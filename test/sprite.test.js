// La première couche de sprites — `src/render/sprite.js`, `src/render/variante.js`
// et l'index généré `src/data/atlas.js`, confrontés aux fichiers réels.
//
// ⚠ CE FICHIER LIT LE DISQUE, IL NE SE FABRIQUE PAS UN ATLAS DE COMPLAISANCE.
// C'est la même discipline que `terrain.test.js` : un index recopié dans le test
// serait vrai contre lui-même et muet sur ce que le joueur verra. Ici l'index
// est confronté au CONTENU de `art/sprites/<famille>/64/`, et sa géométrie aux
// en-têtes des PNG cousus. Un sprite ajouté sans que `tools/atlas.py` soit
// relancé fait donc rougir la suite, au lieu de faire dessiner de travers.
//
// ⚠ ET CHAQUE MONTAGE ASSERTE D'ABORD QU'IL MESURE QUELQUE CHOSE. Deux tableaux
// vides sont égaux, une fonction constante est bornée et stable, un PRNG qu'on
// ne fait jamais tourner ne bouge pas : les trois passeraient sans rien prouver.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { decoderRgba } from './png-rgba.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ATLAS, COTE_SPRITE } from '../src/data/atlas.js';
import {
  celluleDuSprite, existeDansAtlas, fondDuSprite, fondDeCellule,
} from '../src/render/sprite.js';
import { variante, suffixeDeVariante, SEL_VARIANTE } from '../src/render/variante.js';
import { couchesDeLEntite, listeAffichage, genreDeLaGarnison } from '../src/render/scene.js';
import { ANCRES_CHASSIS } from '../src/data/ancres-chassis.js';
import { rosterDefensif } from '../src/data/couts-militaires.js';
import { BASE_BATIMENTS } from '../src/data/base.js';
import { creerEtat, poserEffectif, problemesDeLaPoseDEffectif } from '../src/sim/state.js';
import { TERRAINS, tuilesDuContour, LONGUEUR_DU_MUR } from '../src/ui/chantier.js';
import { BATIMENTS } from '../src/data/sites.js';
import { ORIENTATION_PAR_DEFAUT } from '../src/sim/rendu-pose.js';
import { creerCombat } from '../src/sim/combat.js';
import { calculerProjection } from '../src/render/projection.js';
import { DEFENSES, GRILLE, UNITES } from '../src/data/combat.js';
import { tirer } from '../src/sim/rng.js';
import { baseCourante } from '../src/sim/base-courante.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPRITES = join(RACINE, 'art', 'sprites');

// ⚠⚠ LES TROIS GENRES PASSENT PAR LE MÊME POINT D'ENTRÉE DEPUIS LE LOT
// STRUCTURES-AU-COMBAT. Ce fichier appelait `couchesDeLaDefense` de
// `src/ui/chantier.js`, `spriteDuBatiment` du même écran et `couchesDeLUnite` de
// `src/render/scene.js` — trois portes pour une question. Les trois fonctions
// ont DÉMÉNAGÉ dans `scene.js` derrière `couchesDeLEntite`, et le champ de
// bataille les lit désormais aussi ; les garder joignables séparément aurait
// laissé au test des chemins que le jeu n'emprunte plus.
//
// Ces trois raccourcis ne recalculent RIEN : ils composent le descripteur, et
// c'est tout. Aucune assertion de ce fichier n'a été retirée ni assouplie.
const couchesDeLaDefense = (piece, etat) => couchesDeLEntite(
  { genre: 'defense', id: piece.id, proprietaire: 'joueur', camp: 'defense',
    rangee: piece.rangee, colonne: piece.colonne },
  { voisines: baseCourante(etat).garnison },
);
const couchesDeLUnite = (d, cible = null) => couchesDeLEntite(d, { cible });
const spriteDuBatiment = (id) => couchesDeLEntite(
  { genre: 'batiment', id, proprietaire: 'joueur', camp: 'defense' },
)[0].nom;

/**
 * Le dossier source d'une famille cousue — le slug ASCII n'est pas le dossier.
 *
 * ⚠ LA RÈGLE EST « LE DOSSIER PORTE LE NOM DU SLUG », ET LES EXCEPTIONS SEULES
 * S'ÉCRIVENT. `tools/atlas.py` translittère le dossier en slug ASCII parce que
 * celui-ci devient un nom de fichier, un marqueur de build et une clé
 * JavaScript ; la seule famille où les deux diffèrent aujourd'hui est
 * « bâtiment », à cause de son accent. Énumérer les quatre à la main ferait une
 * liste à tenir à jour, et c'est elle qui a dû être reprise au lot
 * BRANCHEMENT-DÉFENSE quand `defense` et `socle` sont entrées.
 */
const DOSSIER_EXCEPTION = {
  batiment: 'bâtiment', //        l'accent ne passe pas dans un slug ASCII
  tourelle_unite: 'tourelle-unite', // le tiret ne passe pas dans une clé JS
};
const dossierDeLaFamille = (slug) => DOSSIER_EXCEPTION[slug] ?? slug;

/** Le code d'un module, sa prose ôtée — voir le dernier test pour le pourquoi. */
function sansCommentaires(texte) {
  return texte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

/**
 * Largeur et hauteur d'un PNG, lues dans son IHDR.
 *
 * Les 24 premiers octets suffisent : signature (8), taille et nom du morceau
 * (8), puis les deux entiers. Même lecture que `terrain.test.js` fait déjà pour
 * l'atlas du monde.
 */
function tailleDuPng(chemin) {
  const octets = readFileSync(chemin);
  assert.equal(octets.readUInt32BE(0), 0x89504e47, `${chemin} n'est pas un PNG`);
  assert.equal(octets.toString('ascii', 12, 16), 'IHDR', `${chemin} : IHDR attendu en tête`);
  return { largeur: octets.readUInt32BE(16), hauteur: octets.readUInt32BE(20) };
}

/**
 * La taille d'un atlas WebP, LUE DANS SON EN-TÊTE.
 *
 * ⚠⚠ POURQUOI UN SECOND LECTEUR D'EN-TÊTE. Les atlas sont passés au WebP au lot
 * PIXELS — les sprites ne sont plus quantifiés sur quatorze teintes, et en PNG
 * les huit atlas pèseraient ×3,5. Les SPRITES, eux, restent des PNG : c'est ce
 * qui laisse `decoderRgba` lire la matière partout ailleurs dans les tests.
 *
 * ⚠ ON NE LIT QUE L'EN-TÊTE, JAMAIS LES PIXELS. Décoder du WebP demanderait un
 * décodeur VP8 écrit à la main, et le dépôt n'ajoute pas de dépendance de test
 * (CLAUDE.md §3). Les trois formes de conteneur sont couvertes — `VP8X`,
 * `VP8L`, `VP8 ` — et une quatrième fait LEVER plutôt que rendre du vide : une
 * taille inventée ferait passer la garde ci-dessous sur n'importe quoi.
 */
function tailleDuWebp(chemin) {
  const o = readFileSync(chemin);
  assert.equal(o.toString('ascii', 0, 4), 'RIFF', `${chemin} n'est pas un RIFF`);
  assert.equal(o.toString('ascii', 8, 12), 'WEBP', `${chemin} n'est pas un WebP`);
  const forme = o.toString('ascii', 12, 16);
  if (forme === 'VP8X') {
    // 24 bits little-endian, moins un, chacun.
    return { largeur: o.readUIntLE(24, 3) + 1, hauteur: o.readUIntLE(27, 3) + 1 };
  }
  if (forme === 'VP8L') {
    const bits = o.readUInt32LE(21);
    return { largeur: (bits & 0x3fff) + 1, hauteur: ((bits >>> 14) & 0x3fff) + 1 };
  }
  if (forme === 'VP8 ') {
    return { largeur: o.readUInt16LE(26) & 0x3fff, hauteur: o.readUInt16LE(28) & 0x3fff };
  }
  throw new Error(`${chemin} : conteneur WebP « ${forme} » inconnu`);
}

/**
 * Les fichiers que `tools/atlas.py` exclut de la couture, LUS dans l'outil.
 *
 * ⚠⚠ RECOPIER LA LISTE ICI SERAIT UNE SECONDE VÉRITÉ, et la première à diverger.
 * L'outil est la source : un lot qui ajoute une exclusion sans toucher à ce
 * fichier-ci doit continuer de passer, et un lot qui en RETIRE une doit faire
 * tomber la garde de l'index. C'est la même discipline que la palette de
 * `banc.test.js`, transcrite puis confrontée à `FICHE-STYLE.md`.
 *
 * ⚠ ET LE PARSE S'ASSERTE. Un reformatage de `FAMILLES` qui ferait rendre une
 * table vide rendrait la garde muette : on exige d'avoir trouvé autant d'entrées
 * que l'index porte de familles.
 */
function exclusionsDeLOutil() {
  const source = readFileSync(join(RACINE, 'tools', 'atlas.py'), 'utf8');
  const bloc = source.match(/^FAMILLES = \{$([\s\S]*?)^\}$/m);
  assert.ok(bloc !== null, '`FAMILLES` est introuvable dans tools/atlas.py');
  const parFamille = {};
  for (const ligne of bloc[1].split('\n')) {
    const m = ligne.match(/^\s*'([^']+)':\s*\('([^']+)',\s*(\d+),\s*\(([^)]*)\)/);
    if (m === null) continue;
    parFamille[m[2]] = [...m[4].matchAll(/'([^']+)'/g)].map((x) => x[1]);
  }
  assert.equal(Object.keys(parFamille).length, Object.keys(ATLAS).length,
    'le parse de FAMILLES ne trouve pas autant d\'entrées que l\'index a de familles');
  return parFamille;
}

test('sprite — une exclusion de couture existe sur le disque et n\'est pas cousable', () => {
  // ⚠⚠ UNE EXCLUSION SE JUSTIFIE DANS LES DEUX SENS, sans quoi elle devient un
  // moyen de faire disparaître un sprite cassé. Le fichier exclu doit EXISTER —
  // sinon la ligne est morte — et il doit être d'une taille que `coudre` refuse
  // — sinon son exclusion n'a plus de raison d'être. `tools/atlas.py` fait la
  // même vérification de son côté ; celle-ci la refait depuis le dépôt, en
  // JavaScript, pour qu'un lot qui n'aurait pas relancé l'outil la voie quand
  // même.
  const exclusions = exclusionsDeLOutil();
  const exclus = Object.entries(exclusions).flatMap(([slug, noms]) => noms.map((n) => [slug, n]));

  // ⚠ FALSIFIABLE : sans cette ligne, une table vide passerait la boucle.
  assert.equal(exclus.length, 2,
    `${exclus.length} exclusions — si le compte a changé, dire pourquoi ici`);

  for (const [slug, nom] of exclus) {
    const chemin = join(SPRITES, dossierDeLaFamille(slug), String(COTE_SPRITE), `${nom}.png`);
    assert.ok(existsSync(chemin), `« ${nom} » est exclu mais absent du disque — ligne morte`);
    const { largeur, hauteur } = tailleDuPng(chemin);
    assert.ok(largeur !== COTE_SPRITE || hauteur !== COTE_SPRITE,
      `« ${nom} » mesure ${largeur}×${hauteur} : il pourrait être cousu, son exclusion n'a plus lieu d'être`);
  }

  // Et le témoin : un sprite NON exclu de la même famille EST cousable. Sans
  // lui, une famille dont tous les fichiers seraient hors gabarit passerait.
  const temoin = join(SPRITES, 'carte', String(COTE_SPRITE), 'poi_reacteur.png');
  const t = tailleDuPng(temoin);
  assert.deepEqual([t.largeur, t.hauteur], [COTE_SPRITE, COTE_SPRITE],
    'le témoin n\'est pas à la taille de case : le test ne mesure plus rien');
});

test('sprite — l\'index dit exactement ce que le disque porte', () => {
  // Recalculé en JS depuis le dossier réel, avec le même tri que l'outil :
  // `sorted` sur le nom de fichier, en points de code. `localeCompare` rangerait
  // autrement selon la machine, et l'index cesserait d'être reproductible.
  assert.ok(Object.keys(ATLAS).length >= 2, 'moins de deux familles cousues');

  for (const [slug, table] of Object.entries(ATLAS)) {
    const dossier = dossierDeLaFamille(slug);
    assert.ok(existsSync(join(SPRITES, dossier, String(COTE_SPRITE))),
      `famille « ${slug} » : le dossier source ${dossier}/${COTE_SPRITE} est introuvable`);
    // ⚠ LES EXCLUSIONS SE RETIRENT DU DISQUE AVANT LA COMPARAISON, et elles se
    // LISENT dans l'outil — voir `exclusionsDeLOutil`. Sans elles, la famille
    // `carte` serait rouge pour toujours : le disque en porte 45, l'index 43,
    // les deux grosses bases n'étant pas carrées à la taille de case. Le test
    // voisin vérifie que chaque exclusion est légitime, dans les deux sens.
    const exclus = new Set(exclusionsDeLOutil()[slug] ?? []);
    const attendus = readdirSync(join(SPRITES, dossier, String(COTE_SPRITE)))
      .filter((n) => n.endsWith('.png'))
      .map((n) => n.slice(0, -4))
      .filter((n) => !exclus.has(n))
      .sort();

    // ⚠ SANS CETTE LIGNE, DEUX LISTES VIDES SERAIENT ÉGALES. Un dossier
    // renommé ferait passer le test au lieu de le faire tomber.
    assert.ok(attendus.length > 0, `${dossier}/${COTE_SPRITE} est vide ou absent`);
    assert.deepEqual(table.noms, attendus,
      `l'index de « ${slug} » ne correspond plus au disque — relancer tools/atlas.py`);
  }
});

test('sprite — la géométrie de l\'index correspond à l\'atlas réellement cousu', () => {
  for (const [slug, table] of Object.entries(ATLAS)) {
    const { largeur, hauteur } = tailleDuWebp(join(SPRITES, `atlas-${slug}-${COTE_SPRITE}.webp`));
    assert.equal(largeur, table.colonnes * COTE_SPRITE,
      `atlas-${slug} : ${largeur} px de large pour ${table.colonnes} colonnes de ${COTE_SPRITE}`);
    assert.equal(hauteur, table.rangees * COTE_SPRITE,
      `atlas-${slug} : ${hauteur} px de haut pour ${table.rangees} rangées de ${COTE_SPRITE}`);
    // La grille contient les sprites, et pas beaucoup plus : une rangée entière
    // de vide dirait que la couture et l'index ne comptent pas pareil.
    const cellules = table.colonnes * table.rangees;
    assert.ok(cellules >= table.noms.length && cellules - table.noms.length < table.colonnes,
      `atlas-${slug} : ${cellules} cellules pour ${table.noms.length} sprites`);
  }
});

/**
 * Les pixels transparents ENFERMÉS d'un sprite — ceux qu'aucun chemin ne relie
 * au bord de l'image.
 *
 * Un remplissage depuis le bord, quatre voisins, puis la soustraction : c'est
 * la définition même de « trou », et elle est linéaire — la suite ne peut pas
 * se permettre un étiquetage complet sur trois cent quarante sprites.
 */
function trousEnfermes(chemin) {
  const { largeur, hauteur, pixels } = decoderRgba(chemin);
  const n = largeur * hauteur;
  const vide = new Uint8Array(n);
  let transparents = 0;
  for (let i = 0; i < n; i += 1) {
    if (pixels[i * 4 + 3] < 128) { vide[i] = 1; transparents += 1; }
  }
  const vu = new Uint8Array(n);
  const pile = [];
  const pousser = (i) => { if (vide[i] === 1 && vu[i] === 0) { vu[i] = 1; pile.push(i); } };
  for (let x = 0; x < largeur; x += 1) { pousser(x); pousser((hauteur - 1) * largeur + x); }
  for (let y = 0; y < hauteur; y += 1) { pousser(y * largeur); pousser(y * largeur + largeur - 1); }
  let atteints = 0;
  while (pile.length > 0) {
    const i = pile.pop();
    atteints += 1;
    const x = i % largeur;
    const y = (i - x) / largeur;
    if (x > 0) pousser(i - 1);
    if (x < largeur - 1) pousser(i + 1);
    if (y > 0) pousser(i - largeur);
    if (y < hauteur - 1) pousser(i + largeur);
  }
  return transparents - atteints;
}

/**
 * Les sprites de l'Ouvrage d'une grille — `_o_` est la marque du camp.
 *
 * ⚠⚠ `terrain` EST ÉCARTÉE, ET LA RAISON A ÉTÉ RÉÉCRITE AU LOT
 * MOULINETTE-TERRAIN, PARCE QU'ELLE ÉTAIT DEVENUE FAUSSE. Elle disait « aucun
 * outil ne les produit, la chaîne ne les a jamais touchées » : c'est vrai des
 * quatre `tile_sol_o_*` — les SEULS fichiers de la famille que ce filtre
 * ramasse, `_o_` n'apparaissant nulle part ailleurs dans `terrain/` — et c'est
 * FAUX de la famille depuis que `tools/terrain.py` produit ses dix champs et
 * obstacles. Les quatre dalles restent une source déclarée de
 * `tools/verifier.py` : leur seul original apparent est un index à cinq teintes
 * que la migration n'a pas découpé tel quel, et elles sont en RVB indexé, que
 * `decoderRgba` refuse de face.
 *
 * ⚠ ET LES DIX AUTRES NE SONT PAS LAISSÉES SANS GARDE : trois tests plus bas
 * les mesurent — teintes, emprise, miroirs, clé — ce que ce compte de trous ne
 * saurait pas faire sur des dessins qui n'ont pas de camp.
 */
/**
 * ⚠⚠ `limite` EST ÉCARTÉE AUSSI, ET POUR UNE RAISON DE FORME, PAS DE CHAÎNE —
 * lot TERRITOIRE, 03/09. Une limite de territoire CEINT une case : ce que son
 * trait enferme n'est pas un trou percé dedans, c'est la case elle-même.
 * Mesuré sur les treize sprites de l'Ouvrage de la famille, grille 128 :
 * **12 368 px enfermés**, dont **11 792 pour le seul `carre`**, qui est un
 * rectangle fermé de bord à bord. Les compter avec les autres ferait franchir
 * le seuil de 1 500 à une famille qui n'a aucun défaut, et le seul moyen de la
 * faire passer serait de RELEVER le seuil — c'est-à-dire d'aveugler la garde
 * pour les huit autres familles.
 *
 * ⚠⚠ ET LA FAMILLE N'EST PAS LAISSÉE SANS GARDE POUR AUTANT : `test/limite.test.js`
 * la mesure forme par forme, ce que ce compte global ne peut pas faire. Mesuré,
 * et c'est contre l'intuition : seuls `carre` et les quatre `u` enferment quoi
 * que ce soit ; les quatre `trait` et les quatre `coin` sont des formes
 * OUVERTES et enferment **exactement zéro**. C'est cette moitié-là qui garde le
 * détourage — un `est_fond` qui percerait la bande claire d'un `trait` y
 * ouvrirait des trous là où il ne peut pas y en avoir.
 */
const FAMILLE_HORS_CHAINE = new Set(['terrain', 'limite']);

function spritesDeLOuvrage(cote) {
  const sortie = [];
  for (const slug of Object.keys(ATLAS)) {
    if (FAMILLE_HORS_CHAINE.has(slug)) continue;
    const dossier = dossierDeLaFamille(slug);
    const chemin = join(SPRITES, dossier, String(cote));
    if (!existsSync(chemin)) continue;
    for (const f of readdirSync(chemin)) {
      if (f.endsWith('.png') && f.includes('_o_')) sortie.push(join(chemin, f));
    }
  }
  return sortie;
}

test('sprite — les sprites de l\'Ouvrage ne sont plus percés de trous', () => {
  // ⚠⚠ CE QUE CETTE GARDE EXISTE POUR EMPÊCHER. `cond.reduire` prenait sa
  // sentinelle de transparence à `len(PAL)` en dur, soit 14 ; or la palette de
  // l'Ouvrage compte DIX-NEUF teintes et son index 14 est « A contour »
  // `#0D0B12`. Transparent et contour partageaient la même case du vote de
  // bloc : tout bloc majoritairement contour sortait TRANSPARENT. Mesuré sur
  // `base_o_3x3` en 128 avant le lot PIXELS, 9 336 blocs transparents sans un
  // seul pixel transparent dedans.
  //
  // ⚠ ON N'ASSERTE PAS ZÉRO, ET C'EST DÉLIBÉRÉ. Le reste est de vraies
  // ouvertures du dessin — une embrasure, un espace entre deux mâts. Asserter
  // zéro inviterait à boucher un trou voulu pour faire passer la suite.
  //
  // ⚠⚠ CE QUE LA GARDE MESURE VRAIMENT, ET CE QU'ELLE NE MESURE PAS. Le brief
  // du lot proposait de la falsifier en RENDANT la sentinelle fausse ; mesuré,
  // ça ne marche pas, et pour une raison qui vaut d'être écrite : depuis que
  // `ecrire` réduit la MATIÈRE par filtre, la grille d'indices `g` n'atteint
  // plus aucun fichier — `boite(g)`, son seul consommateur, est un diagnostic
  // dont l'appelant jette le retour. Rejoué pour de bon sur 51 sprites de
  // l'Ouvrage : sentinelle remise à 14, **0 fichier sur 51 change d'un octet**,
  // et le compte de trous ne bouge pas d'une unité.
  //
  // ⚠ LA FALSIFICATION QUI MORD EST L'AUTRE : rendre à `conditionner` la clé de
  // fond NUE — `est_fond` au lieu d'`est_fond_sujet`, donc `c1|c2` sans la
  // borne de la composante extérieure. Rejoué : les mêmes 51 sprites passent de
  // **113 à 19 213 px enfermés**, et 45 fichiers sur 51 changent. C'est bien
  // §2.2 du lot que cette garde tient, pas §2.1.
  const trous = spritesDeLOuvrage(128).reduce((t, f) => t + trousEnfermes(f), 0);
  assert.ok(trous <= 1500, `${trous} px transparents enfermés dans les sprites de l'Ouvrage`);

  // ⚠ ET LE COMPTEUR MESURE BIEN QUELQUE CHOSE. Les châssis du JOUEUR portent
  // leurs propres ouvertures — mesuré 2 694 px, déjà au dépôt avant ce lot —
  // et c'est l'appât : un `trousEnfermes` qui rendrait toujours zéro ferait
  // passer l'assertion du dessus sur n'importe quel art.
  const chassis = readdirSync(join(SPRITES, 'chassis', '128'))
    .filter((f) => f.endsWith('.png'))
    .reduce((t, f) => t + trousEnfermes(join(SPRITES, 'chassis', '128', f)), 0);
  assert.ok(chassis > 2000, `${chassis} px enfermés côté joueur : le compteur ne compte rien`);

  // Et le balayage a bien trouvé les sprites : sans ça, zéro fichier donnerait
  // zéro trou, et la garde serait verte sur un dossier vide.
  assert.ok(spritesDeLOuvrage(128).length > 150,
    `${spritesDeLOuvrage(128).length} sprites de l'Ouvrage : le balayage n'a rien trouvé`);
});

test('sprite — le pourcentage rendu décale bien de −colonne × côté', () => {
  // ⚠ LES VALEURS SE CALCULENT, ELLES NE SE RECOPIENT PAS. Un pourcentage de
  // `background-position` aligne le point situé à P % de l'IMAGE sur celui situé
  // à P % du CADRE : le décalage effectif vaut `P/100 × (cadre − image)`. On
  // refait ce calcul-là, et on exige qu'il retombe sur la cellule voulue.
  const COTE_CASE = 42; // px, l'ordre de grandeur réel d'une case sur téléphone
  const { colonnes, rangees, noms } = ATLAS.batiment;
  assert.ok(colonnes > 1 && rangees > 1, 'la famille tient sur une seule ligne : le test ne mesure rien');

  const aEssayer = [0, 1, colonnes + 2, noms.length - 1];
  for (const rang of aEssayer) {
    const nom = noms[rang];
    const cellule = celluleDuSprite('batiment', nom);
    const fond = fondDuSprite('batiment', nom);

    assert.equal(fond.taille, `${colonnes * 100}% ${rangees * 100}%`);
    const [px, py] = fond.position.split(' ').map((v) => Number.parseFloat(v));
    const largeurImage = colonnes * COTE_CASE;
    const hauteurImage = rangees * COTE_CASE;
    const decalageX = (px / 100) * (COTE_CASE - largeurImage);
    const decalageY = (py / 100) * (COTE_CASE - hauteurImage);

    assert.ok(Math.abs(decalageX - -cellule.colonne * COTE_CASE) < 1e-9,
      `${nom} : décalage horizontal ${decalageX}, attendu ${-cellule.colonne * COTE_CASE}`);
    assert.ok(Math.abs(decalageY - -cellule.rangee * COTE_CASE) < 1e-9,
      `${nom} : décalage vertical ${decalageY}, attendu ${-cellule.rangee * COTE_CASE}`);
  }

  // La cellule (0, 0) ne bouge pas, et une cellule intérieure bouge : sans cette
  // seconde assertion, une fonction qui rendrait toujours « 0% 0% » passerait.
  assert.equal(fondDuSprite('batiment', noms[0]).position, '0% 0%');
  assert.notEqual(fondDuSprite('batiment', noms[colonnes + 2]).position, '0% 0%');
});

test('sprite — une cellule se pose aussi dans un QUARTIER, et la formule tient', () => {
  // ⚠⚠ CE QUE CE TEST GARDE : le sol de la base pose QUATRE cellules dans une
  // seule case depuis le 30/08 — Ethan, « utiliser les sprites terrain monde
  // (en 2 × 2) ». La formule du décalage n'est plus celle d'une cellule qui
  // remplit son élément, et elle ne se recopie pas : on refait ici le calcul du
  // NAVIGATEUR — `décalage = P/100 × (cadre − image)` — et on exige que le bord
  // de la cellule tombe très exactement sur le bord du quartier voulu.
  //
  // ⚠ ET C'EST BIEN LE MÊME CALCUL QUE L'ANCIEN, PAS UN SECOND. Le dernier bloc
  // le vérifie : à un seul quartier, la nouvelle formule rend caractère pour
  // caractère ce que rendait celle d'avant.
  const COTE = 48; // px, l'ordre de grandeur d'une case sur téléphone

  for (const divisions of [1, 2, 3]) {
    for (const [colonnes, rangees] of [[4, 4], [5, 4], [16, 16], [7, 7]]) {
      for (const colonne of [0, 1, colonnes - 1]) {
        for (const sousColonne of [0, divisions - 1]) {
          const fond = fondDeCellule({
            colonne, rangee: colonne, colonnes, rangees,
            divisions, sousColonne, sousRangee: sousColonne,
          });
          // La taille : une cellule fait exactement 1/divisions de l'élément.
          const [tx] = fond.taille.split(' ').map((v) => Number.parseFloat(v));
          assert.ok(Math.abs(tx - (colonnes * 100) / divisions) < 1e-9,
            `taille ${fond.taille} pour ${colonnes} colonnes en ${divisions}`);

          const [px] = fond.position.split(' ').map((v) => Number.parseFloat(v));
          const largeurImage = (colonnes * COTE) / divisions;
          const decalage = (px / 100) * (COTE - largeurImage);
          // Le bord gauche de la cellule doit tomber sur le bord du quartier.
          const attendu = (sousColonne - colonne) * (COTE / divisions);
          assert.ok(Math.abs(decalage - attendu) < 1e-9,
            `${colonnes}×${divisions}, cellule ${colonne} au quartier ${sousColonne} : `
              + `décalage ${decalage}, attendu ${attendu}`);
        }
      }
    }
  }

  // ⚠ LE DÉFAUT EST L'ANCIEN COMPORTEMENT, À LA CHAÎNE PRÈS. Si la
  // généralisation avait déplacé ne serait-ce qu'une cellule, tous les sprites
  // déjà posés auraient bougé — et rien dans la suite ne l'aurait dit, un
  // sprite décalé restant un sprite.
  const { colonnes, rangees, noms } = ATLAS.batiment;
  for (let rang = 0; rang < noms.length; rang += 1) {
    const c = rang % colonnes;
    const r = Math.floor(rang / colonnes);
    const ancienne = {
      taille: `${colonnes * 100}% ${rangees * 100}%`,
      position: `${(c * 100) / (colonnes - 1)}% ${(r * 100) / (rangees - 1)}%`,
    };
    assert.deepEqual(fondDuSprite('batiment', noms[rang]), ancienne,
      `${noms[rang]} a bougé : la généralisation a changé le cas à un quartier`);
  }

  // Falsifiable : un quartier hors du découpage est refusé, et un découpage
  // absurde aussi. Sans ça, un `sousColonne` de 2 dans un 2 × 2 poserait la
  // cellule hors de la case, en silence.
  assert.throws(() => fondDeCellule({
    colonne: 0, rangee: 0, colonnes: 4, rangees: 4, divisions: 2, sousColonne: 2,
  }), /quartier/);
  assert.throws(() => fondDeCellule({
    colonne: 0, rangee: 0, colonnes: 4, rangees: 4, divisions: 0,
  }), /divisions/);

  // ⚠ ET LE CAS DÉGÉNÉRÉ REND 0 PLUTÔT QUE `Infinity`. Autant de colonnes que
  // de quartiers : l'image fait exactement la largeur de l'élément, aucun
  // pourcentage ne la déplace. Aucune grille du dépôt n'est dans ce cas.
  const degenere = fondDeCellule({
    colonne: 1, rangee: 1, colonnes: 2, rangees: 2, divisions: 2, sousColonne: 1, sousRangee: 1,
  });
  assert.equal(degenere.position, '0% 0%');
});

test('bord — les murs de contour sont des BLOCS à part, et le manifeste en répond', () => {
  // ⚠⚠ CE QUE CE TEST GARDE, ET IL VIENT DE DEUX ARBITRAGES. Le 31/08, le mur
  // avait d'abord été conditionné comme un sprite de case — 64 × 64, quatorze
  // teintes du dépôt, cousu dans un atlas — et Ethan l'a refusé de face : « mais
  // c'est quoi cette chiasse de pixel. divise par deux l'asset original. et
  // garde la colorisation. » Le 03/09, il a livré des planches neuves : « déjà
  // refait les murs avec les nouveaux sprites, et pour que ça passe bien parce
  // que là ça déborde ».
  //
  // ⚠⚠ LA V2 N'EST PAS LA V1 EN PLUS GRAND. Ce sont des BLOCS PLEINS — quatre
  // murs de quatre cases et quatre blocs d'une case par camp —, là où la v1
  // était cinq TRAITS fins nommés par leur PLACE (`mur_h_a`, `angle_no`). Les
  // quatre « angles » du zip ne sont pas quatre orientations d'un coude : ce
  // sont quatre VARIANTES du même carré, mesuré et regardé, dont aucune n'est le
  // miroir d'une autre. Ils se numérotent, donc, au lieu de se nommer.
  const dossier = join(SPRITES, 'bord');
  const fichiers = readdirSync(dossier).filter((f) => f.endsWith('.webp')).sort();
  assert.equal(fichiers.length, 16,
    `bord/ porte ${fichiers.length} fichiers : deux camps × (4 murs + 4 blocs)`);

  // ⚠ LA V1 EST PARTIE AVEC SA PRODUCTION. `tools/bords.py` ne fait plus ses
  // seize traits ; les laisser au dépôt les ferait compter MANQUANTS par le
  // vérificateur à chaque exécution — « le dépôt les porte, aucun outil ne les
  // fait », c'est-à-dire le contraire de la vérité.
  assert.equal(readdirSync(dossier).filter((f) => f.endsWith('.png')).length, 0,
    'bord/ porte encore des PNG : la v1 du mur n\'est plus produite par personne');
  assert.ok(!existsSync(join(dossier, String(COTE_SPRITE))),
    'bord/ a repris un dossier de grille : ses sprites ne sont pas des sprites de case');

  // ⚠ ET IL N'EST TOUJOURS PAS DANS L'INDEX DES ATLAS. `tools/atlas.py` n'accepte
  // que des cellules carrées d'un même côté ; ni 512 × 128 ni un mélange de
  // formats n'y tiennent.
  assert.equal(ATLAS.bord, undefined,
    'la famille `bord` est revenue dans l\'atlas : elle n\'y tient pas');

  // ⚠⚠ LE MANIFESTE EST CE QUI REMPLACE `decoderRgba` ICI, ET C'EST LE MOTIF DU
  // DÉPÔT DEPUIS LE 02/09. Les murs sont en WebP — 6 344 octets pour `mur_1`
  // contre 72 651 en PNG optimisé, mesuré — et Node n'a pas de décodeur WebP ;
  // §3 interdit d'ajouter une dépendance de test. `tools/bords.py` écrit donc
  // `bord-empreintes.json` : le SHA-256 de chaque fichier, sa taille, ses
  // teintes opaques, ses transparents et ses trous enfermés. Le test lit, il ne
  // décode pas.
  const manifeste = JSON.parse(readFileSync(join(dossier, 'bord-empreintes.json'), 'utf8'));
  const sprites = manifeste.sprites;
  assert.equal(Object.keys(sprites).length, fichiers.length,
    'le manifeste et le dossier ont divergé — relancer `python3 tools/bords.py`');

  // ⚠ L'EMPREINTE SE VÉRIFIE, ELLE NE SE CROIT PAS. Sans ce bloc, le manifeste
  // serait une prose que rien ne rattache aux fichiers : un sprite remplacé
  // passerait, et c'est exactement l'accident de BÂTIMENTS-1024 sous un autre
  // format.
  for (const fichier of fichiers) {
    const nom = fichier.replace(/\.webp$/, '');
    const dit = sprites[nom];
    assert.ok(dit, `${nom} n'est pas dans le manifeste`);
    const vu = createHash('sha256').update(readFileSync(join(dossier, fichier))).digest('hex');
    assert.equal(vu, dit.sha256, `${fichier} ne correspond plus à son empreinte`);
    assert.equal(statSync(join(dossier, fichier)).size, dit.octets, `${fichier} : taille`);
  }

  // ⚠⚠ LA TAILLE EST CELLE DE LA GRILLE DU JEU, ET LA DETTE DU 03/09 EST
  // SOLDÉE. La v1 était taillée pour une case de 64 et s'affichait étirée deux
  // fois depuis le passage à la 128 ; `COTE_MUR` et son assertion inverse ont
  // disparu avec elle. Un bloc fait une case, un mur `LONGUEUR_DU_MUR` cases.
  for (const [nom, dit] of Object.entries(sprites)) {
    const mur = nom.includes('_mur_');
    assert.equal(dit.hauteur, COTE_SPRITE, `${nom} fait ${dit.hauteur} de haut`);
    assert.equal(dit.largeur, COTE_SPRITE * (mur ? LONGUEUR_DU_MUR : 1),
      `${nom} fait ${dit.largeur} de large`);
  }
  assert.equal(tuilesDuContour('j').find((t) => t.l === LONGUEUR_DU_MUR).h, 1,
    'un mur ne fait plus une case d\'épaisseur sur la grille');

  // ⚠⚠ « GARDE LA COLORISATION » SE MESURE, ET LA MESURE A CHANGÉ DE SENS. La
  // v1 était ramenée à SEIZE teintes par camp, parce qu'un PNG au rendu libre
  // pesait 42 643 octets pour un seul mur. Depuis le lot PIXELS la chaîne ne
  // quantifie plus rien, et c'est le WebP qui paie : on exige donc maintenant le
  // CONTRAIRE — des milliers de teintes, pas quelques-unes.
  for (const [nom, dit] of Object.entries(sprites)) {
    assert.ok(dit.teintes > 1000,
      `${nom} ne porte que ${dit.teintes} teintes : la chaîne s'est remise à quantifier`);
  }

  // ⚠⚠ LE DÉTOURAGE A MORDU, ET IL N'A PAS PERCÉ. La coupe livrée par Ethan
  // laissait 2 029 pixels de magenta pur dans `mur_1`, dont 493 sur la seule
  // ligne du haut : un liseré `#FF00FF` aurait couru sur toute la longueur du
  // mur. On exige donc des transparents — le détourage a bien fait quelque
  // chose — et presque aucun TROU ENFERMÉ, qui serait la seconde porte
  // d'`est_fond` en train de percer le bloc.
  for (const [nom, dit] of Object.entries(sprites)) {
    assert.ok(dit.transparents > 0,
      `${nom} n'a aucun pixel transparent : le fond magenta est resté dans le sprite`);
    assert.ok(dit.trousEnfermes <= 100,
      `${nom} enferme ${dit.trousEnfermes} px : le détourage perce le bloc`);
  }
  // Et le compteur compte : sans ce témoin, un `trousEnfermes` toujours nul
  // ferait passer l'assertion du dessus sur n'importe quel détourage.
  assert.ok(Object.values(sprites).some((d) => d.trousEnfermes > 0),
    'aucun sprite n\'enferme le moindre pixel : le compteur de trous ne compte rien');

  // ⚠ ET LE CAMP DU JOUEUR EST PROPRE, LUI. Le violet de l'Ouvrage frôle le
  // magenta — distance minimale 140,0, pile sur le seuil de `cond.est_fond` —,
  // donc ses blocs se font grignoter ; ceux du joueur, non, et ce sont les seuls
  // qui entrent dans le livrable.
  for (const [nom, dit] of Object.entries(sprites)) {
    if (!nom.startsWith('bord_j_')) continue;
    assert.equal(dit.trousEnfermes, 0, `${nom} enferme ${dit.trousEnfermes} px côté joueur`);
  }
});

test('sprite — un nom absent lève, il ne rend pas un fond vide', () => {
  // Une cellule transparente est exactement ce que personne ne remarque :
  // l'écran s'ouvrirait, la case serait nue, et rien ne dirait que l'atlas a été
  // recousu sans ce sprite.
  assert.throws(() => celluleDuSprite('batiment', 'bat_j_inexistant'), /absent de la famille/);
  assert.throws(() => fondDuSprite('terrain', 'tile_sol_j_z'), /absent de la famille/);
  assert.throws(() => fondDuSprite('famille-qui-n-existe-pas', 'peu importe'), /absente de l'atlas/);
  // Témoin : un nom réel ne lève pas, sinon le test passerait sur une fonction
  // qui lève toujours.
  assert.doesNotThrow(() => fondDuSprite('terrain', ATLAS.terrain.noms[0]));
});

test('sprite — les onze bâtiments du joueur se résolvent dans l\'atlas', () => {
  // Ce test rougit le jour où un douzième bâtiment arrive sans son sprite, et
  // c'est exactement ce qu'on lui demande de faire.
  const ids = Object.keys(BASE_BATIMENTS);
  assert.equal(ids.length, 11, 'le roster des bâtiments du joueur a changé de taille');

  for (const id of ids) {
    const nom = spriteDuBatiment(id);
    assert.ok(ATLAS.batiment.noms.includes(nom),
      `« ${id} » se résout en « ${nom} », absent de l'atlas`);
    assert.doesNotThrow(() => fondDuSprite('batiment', nom));
  }

  // La règle est mécanique, et le cas qui la prouve porte trois majuscules.
  assert.equal(spriteDuBatiment('chantierDeConstruction'), 'bat_j_chantier_de_construction');
  assert.equal(spriteDuBatiment('collecteur'), 'bat_j_collecteur');
  // Onze noms DISTINCTS : une règle qui écraserait deux identifiants sur le même
  // fichier passerait toutes les assertions ci-dessus.
  assert.equal(new Set(ids.map(spriteDuBatiment)).size, 11);
});

test('sprite — la variante est stable, bornée, et elle ne l\'est pas parce qu\'elle est constante', () => {
  const GRAINE = 987654321;
  for (const nombre of [2, 4]) {
    const vues = new Set();
    for (let rangee = 1; rangee <= 18; rangee++) {
      for (let colonne = 1; colonne <= 9; colonne++) {
        const v = variante(GRAINE, rangee, colonne, nombre);
        assert.ok(Number.isInteger(v) && v >= 0 && v < nombre,
          `variante hors de 0…${nombre - 1} : ${v}`);
        assert.equal(v, variante(GRAINE, rangee, colonne, nombre), 'deux appels divergent');
        vues.add(v);
      }
    }
    // ⚠ SANS CETTE LIGNE, `() => 0` PASSERAIT LES DEUX ASSERTIONS CI-DESSUS.
    assert.equal(vues.size, nombre,
      `sur 162 cases, seulement ${vues.size} variantes distinctes sur ${nombre}`);
  }

  // Le suffixe suit le rang, et il se déduit — pas de table de quatre lignes.
  const suffixes = new Set();
  for (let rangee = 1; rangee <= 18; rangee++) {
    for (let colonne = 1; colonne <= 9; colonne++) {
      suffixes.add(suffixeDeVariante(GRAINE, rangee, colonne, 4));
    }
  }
  assert.deepEqual([...suffixes].sort(), ['a', 'b', 'c', 'd']);

  // Deux graines différentes ne donnent pas le même sol partout : sinon la
  // « graine » ne serait pas lue et le paramètre serait décoratif.
  let ecarts = 0;
  for (let colonne = 1; colonne <= 9; colonne++) {
    if (variante(1, 12, colonne, 4) !== variante(2, 12, colonne, 4)) ecarts++;
  }
  assert.ok(ecarts > 0, 'la graine n\'entre pas dans le tirage de la variante');

  // Le sel est à ce module, distinct des quatre déjà employés dans `src/`.
  assert.ok(SEL_VARIANTE > 3, 'le sel de la variante empiète sur ceux déjà pris');
  assert.throws(() => variante(1, 1, 1, 0), /nombre de variantes invalide/);
});

test('sprite — une peinture complète ne consomme pas `etat.rng`', () => {
  // ⚠⚠ LE PRNG DE L'ÉTAT EST CELUI DE LA SIMULATION. Y prendre un tirage pour
  // choisir une texture décale tout ce que le moteur tirera ensuite, et la
  // partie cesse de se rejouer à l'identique.
  const etat = creerEtat(4242);

  // ⚠ D'ABORD LE TÉMOIN : un tirage VOLONTAIRE fait bien bouger l'état. Sans
  // lui, le montage ne mesurerait rien — un flux qu'on ne sait pas faire bouger
  // ne bouge jamais, et le test serait vert sur n'importe quel code.
  const avantTemoin = etat.rng.s;
  tirer(etat.rng);
  assert.notEqual(etat.rng.s, avantTemoin, 'le montage ne sait pas faire bouger le flux');

  const avant = etat.rng.s;
  for (let rangee = 1; rangee <= 18; rangee++) {
    for (let colonne = 1; colonne <= 9; colonne++) {
      fondDuSprite('terrain', `tile_sol_j_${suffixeDeVariante(etat.graine, rangee, colonne, 4)}`);
    }
  }
  assert.equal(etat.rng.s, avant, 'la peinture du sol a consommé le flux de la simulation');

  // Et le module ne l'importe même pas : la faute ne peut pas rentrer par une
  // autre porte que celle qu'on vient de fermer.
  //
  // ⚠ DÉCOMMENTÉ, ET LA PREMIÈRE ÉCRITURE DE CETTE GARDE S'EST FAIT AVOIR. Le
  // commentaire d'en-tête de `variante.js` NOMME `etat.rng` pour dire qu'il ne
  // le touche pas : la garde tombait sur sa propre explication. C'est la faute
  // que le dépôt raconte déjà pour `viewport-fit=cover` et pour `MENTION_SATURE`
  // — une garde qui lit la prose au lieu du code ne garde rien.
  const source = sansCommentaires(
    readFileSync(join(RACINE, 'src', 'render', 'variante.js'), 'utf8'),
  );
  assert.ok(!/\betat\.rng\b/.test(source), '`variante.js` nomme etat.rng hors commentaire');
  assert.ok(!/from '[^']*\/rng\.js'/.test(source), '`variante.js` importe le PRNG de la simulation');
  // Falsifiable : le retrait des commentaires ne vide pas le fichier, et il
  // laisserait passer un appât écrit dans du vrai code.
  assert.ok(source.includes('hachageBrut'), 'le décommentage a mangé le code du module');
  assert.ok(/\betat\.rng\b/.test(sansCommentaires('const x = etat.rng; // rien')),
    'le motif ne reconnaît pas la faute qu\'il cherche');
});

test('sprite — l\'atlas cousu répond des sprites d\'aujourd\'hui', () => {
  // ⚠⚠ CETTE GARDE EXISTE À CAUSE D'UN DÉFAUT QUI A FAILLI ÊTRE LIVRÉ, et elle
  // a été écrite le jour où il s'est produit. Le lot BÂTIMENTS-1024 régénère les
  // seize sprites de `art/sprites/bâtiment/64/` ; l'atlas, lui, est un FICHIER
  // COMMITÉ, et il ne se recoud pas tout seul.
  //
  // Mesuré ce jour-là : avec les sprites régénérés et l'atlas d'hier,
  // `npm run check` restait à **559 pass / 0 fail** et `dist/index.html` ne
  // bougeait pas d'un octet — le jeu aurait affiché l'ANCIEN dessin pendant que
  // le dépôt portait le nouveau, sans qu'une seule assertion tombe.
  //
  // ⚠⚠ ELLE COMPARAIT LES PIXELS JUSQU'AU LOT PIXELS, ET ELLE COMPARE MAINTENANT
  // DES EMPREINTES. Les atlas sont passés au WebP — sans lui, les huit pèseraient
  // ×3,5 depuis que les sprites ne sont plus quantifiés sur quatorze teintes —
  // et Node n'a pas de décodeur WebP ; §3 du CLAUDE.md interdit d'ajouter une
  // dépendance de test, et écrire un décodeur VP8 à la main pour une garde
  // serait pire que le mal. `tools/atlas.py` écrit donc, à côté des atlas,
  // l'empreinte SHA-256 de chacun ET de chaque sprite source.
  //
  // Ce qu'elle tient encore : le défaut du 30/08 de face — un sprite régénéré
  // sous un atlas resté d'hier fait mentir l'empreinte de la SOURCE, et un
  // atlas retouché fait mentir la sienne.
  //
  // ⚠ CE QU'ELLE NE TIENT PLUS, ET IL FAUT LE SAVOIR : la correspondance
  // CELLULE ↔ SPRITE, cellule par cellule. Elle est refaite par RECONSTRUCTION
  // à chaque `python3 tools/verifier.py`, qui appelle `atlas.py --verifier` :
  // l'outil recoud l'atlas depuis les sprites et compare à l'octet, ce qui est
  // strictement plus fort — mais sur les lots qui touchent à l'art seulement,
  // plus à chaque `npm run check`. Arbitré par Ethan le 02/09, contre les deux
  // autres issues mesurées : committer aussi un PNG jamais embarqué (+1,6 Mio
  // de dépôt, deux fichiers pour une vérité, et rien qui les relie), ou rester
  // en PNG (le livrable passe de 1,58 à 2,94 Mo).
  const manifeste = JSON.parse(readFileSync(join(SPRITES, 'atlas-empreintes.json'), 'utf8'));
  assert.equal(manifeste.cote, COTE_SPRITE, 'le manifeste décrit une autre grille que l\'index');

  const sha = (chemin) => createHash('sha256').update(readFileSync(chemin)).digest('hex');

  let comparees = 0;
  for (const [slug, table] of Object.entries(ATLAS)) {
    const dossier = dossierDeLaFamille(slug);
    const attendu = manifeste.familles[slug];
    assert.ok(attendu !== undefined, `« ${slug} » est dans l'index et pas dans le manifeste`);

    assert.equal(sha(join(SPRITES, `atlas-${slug}-${COTE_SPRITE}.webp`)), attendu.atlas,
      `atlas-${slug} : le fichier cousu n'est plus celui du manifeste `
      + '— relancer « python3 tools/atlas.py --ecrire »');

    assert.deepEqual(Object.keys(attendu.sprites).sort(), [...table.noms].sort(),
      `${slug} : le manifeste et l'index ne portent pas les mêmes sprites`);

    for (const nom of table.noms) {
      assert.equal(sha(join(SPRITES, dossier, String(COTE_SPRITE), `${nom}.png`)), attendu.sprites[nom],
        `${dossier}/${nom}.png a changé sans que l'atlas soit recousu `
        + '— relancer « python3 tools/atlas.py --ecrire »');
      comparees += 1;
    }
  }

  // ⚠ FALSIFIABLE, ET EN DEUX TEMPS. D'abord le balayage a bien eu lieu : un
  // manifeste vide, ou un index vide, ferait passer la boucle sans rien
  // comparer. Ensuite l'empreinte DISTINGUE : deux sprites différents n'ont pas
  // la même, sans quoi un `sha` qui rendrait toujours la même chaîne rendrait
  // tout ce qui précède muet.
  assert.ok(comparees > 400, `${comparees} sprites confrontés : le balayage n'a rien parcouru`);
  assert.notEqual(
    sha(join(SPRITES, 'bâtiment', '64', 'bat_j_collecteur.png')),
    sha(join(SPRITES, 'bâtiment', '64', 'bat_j_chantier_de_construction.png')),
    'l\'empreinte ne distingue pas deux sprites',
  );
});

// ---------------------------------------------------------------------------
// Le branchement de la garnison
// ---------------------------------------------------------------------------

/**
 * Une garnison qui porte les neuf défenses, posée sur des cases LÉGALES.
 *
 * ⚠ LES CASES SE CHERCHENT, ELLES NE S'ÉCRIVENT PAS. La bande de défense porte
 * des obstacles tirés de la fondation : une colonne écrite en dur tombe sur un
 * rocher selon la graine, et le montage échoue pour une raison qui n'a rien à
 * voir avec ce qu'il mesure.
 */
function garnisonComplete(graine = 7) {
  let etat = creerEtat(graine);
  const bande = GRILLE.bandes.defense;
  for (const id of Object.keys(DEFENSES)) {
    let pose = false;
    for (let r = bande.premiere; r <= bande.derniere && !pose; r++) {
      for (let c = 1; c <= GRILLE.largeur && !pose; c++) {
        const piece = { id, rangee: r, colonne: c, niveau: 1 };
        if (problemesDeLaPoseDEffectif(etat, 'garnison', piece).length === 0) {
          etat = poserEffectif(etat, 'garnison', piece);
          pose = true;
        }
      }
    }
    assert.ok(pose, `le montage n'a pas su poser « ${id} »`);
  }
  return etat;
}

test('sprite — les socles à liaison sont exactement les défenses de type tourelle', () => {
  // ⚠⚠ CE TEST FIGE UNE COÏNCIDENCE D'AUJOURD'HUI, ET IL EST FAIT POUR ROUGIR.
  // Six défenses du joueur portent une tourelle ; trois seulement ont des socles
  // de liaison. Ce n'est pas un manque d'outil mais un manque de SOURCE :
  // `tools/connexions.py` coupe `socles_j_tourelles_connexions_3x4.png`, un
  // 3 × 4 — trois tourelles, quatre états — et il n'existe pas de planche pour
  // les trois artilleries.
  //
  // Le jour où Ethan dessine cette planche et où les outils tournent, ce test
  // TOMBE. C'est ce qu'on veut : quelqu'un relira ce paragraphe au lieu de
  // découvrir la nouveauté six mois plus tard. Le rendu, lui, s'adapte tout seul
  // — il LIT l'atlas par `existeDansAtlas` au lieu de porter une liste.
  const avecLiaison = [];
  const sansLiaison = [];
  for (const [id, def] of Object.entries(DEFENSES)) {
    if (!existeDansAtlas('socle', `socle_def_j_${id}`)) continue;
    (existeDansAtlas('socle', `socle_def_j_${id}_est`) ? avecLiaison : sansLiaison).push(id);
  }

  // ⚠ D'ABORD : LES DEUX GROUPES SONT-ILS NON VIDES ? Deux listes vides
  // seraient égales à deux autres listes vides, et le test ne mesurerait rien.
  assert.ok(avecLiaison.length > 0, 'aucun socle à liaison — l\'atlas n\'est pas celui qu\'on croit');
  assert.ok(sansLiaison.length > 0, 'tous les socles ont des liaisons — le trou d\'art est comblé, relire le lot');

  const tourelles = Object.keys(DEFENSES).filter((id) => DEFENSES[id].type === 'tourelle');
  const artilleries = Object.keys(DEFENSES).filter((id) => DEFENSES[id].type === 'artillerie');
  assert.deepEqual(avecLiaison.sort(), [...tourelles].sort(),
    'les socles à liaison ne sont plus exactement les défenses de type tourelle');
  assert.deepEqual(sansLiaison.sort(), [...artilleries].sort(),
    'les socles sans liaison ne sont plus exactement les artilleries');
});

test('sprite — chaque pièce de garnison résout toutes ses couches dans un atlas', () => {
  const etat = garnisonComplete();
  assert.equal(baseCourante(etat).garnison.length, Object.keys(DEFENSES).length,
    'le montage ne porte pas les neuf défenses');

  let couchesVues = 0;
  for (const piece of baseCourante(etat).garnison) {
    const couches = couchesDeLaDefense(piece, etat);

    // ⚠ SANS CETTE LIGNE, UNE FONCTION QUI REND `[]` PASSERAIT la boucle
    // ci-dessous sans lever, et le test serait vert sur un écran vide.
    assert.ok(Array.isArray(couches) && couches.length > 0,
      `« ${piece.id} » ne rend aucune couche`);

    for (const { famille, nom } of couches) {
      assert.ok(existeDansAtlas(famille, nom),
        `« ${piece.id} » demande ${famille}/${nom}, absent de l'atlas cousu`);
      // Et le cadrage se calcule vraiment : `existeDansAtlas` ne ment pas.
      assert.doesNotThrow(() => fondDuSprite(famille, nom));
      couchesVues += 1;
    }
  }
  // Neuf pièces : trois à une couche (le mur et les deux barrières) et six à
  // deux (tourelle ou artillerie, plus son socle). Le compte se calcule.
  const attendu = Object.values(DEFENSES)
    .reduce((n, d) => n + (d.type === 'tourelle' || d.type === 'artillerie' ? 2 : 1), 0);
  assert.equal(couchesVues, attendu, `${couchesVues} couches posées pour ${attendu} attendues`);
});

test('sprite — la ronce et la herse n\'ont ni socle ni orientation', () => {
  // Elles blessent au CONTACT : rien à tourner, rien à poser dessous. Un
  // suffixe d'orientation sur leur nom voudrait dire qu'on les traite comme des
  // tourelles, et l'atlas n'en porte qu'un seul sprite chacune.
  const etat = garnisonComplete();
  const barrieres = baseCourante(etat).garnison.filter((p) => DEFENSES[p.id].type === 'barriere');
  assert.ok(barrieres.length >= 2, 'le montage ne porte pas les deux barrières');

  for (const piece of barrieres) {
    const couches = couchesDeLaDefense(piece, etat);
    assert.equal(couches.length, 1, `« ${piece.id} » porte ${couches.length} couches au lieu d'une`);
    assert.equal(couches[0].famille, 'defense');
    assert.equal(couches[0].nom, `def_j_${piece.id}`,
      `« ${piece.id} » porte un suffixe qu'une barrière ne devrait pas avoir`);
  }

  // ⚠ TÉMOIN : une tourelle du MÊME montage en porte deux, elle. Sans lui, une
  // fonction qui rendrait toujours une seule couche passerait les assertions
  // ci-dessus.
  const tourelle = baseCourante(etat).garnison.find((p) => DEFENSES[p.id].type === 'tourelle');
  assert.ok(tourelle !== undefined, 'le montage ne porte aucune tourelle');
  const couchesTourelle = couchesDeLaDefense(tourelle, etat);
  assert.equal(couchesTourelle.length, 2, 'une tourelle doit porter sa couche et son socle');
  // ⚠⚠ LES DEUX INDICES ONT ÉCHANGÉ, L'EXIGENCE EST LA MÊME : le socle est la
  // couche BASSE, la tourelle la haute. La liste se rendait de la plus HAUTE à
  // la plus basse — l'ordre des couches CSS, où la première ligne de
  // `background-image` se dessine au-dessus —, elle se rend maintenant dans
  // l'ordre du canvas, où la dernière est au-dessus. Le point d'entrée sert les
  // deux appelants ; c'est `poserCouches` de l'écran qui retourne la liste, une
  // fois, et un commentaire l'y explique. Une tourelle par-dessus son socle et
  // un socle par-dessus sa tourelle portent les MÊMES DEUX NOMS : sans cette
  // paire d'assertions, l'inversion n'aurait fait tomber aucun test.
  assert.equal(couchesTourelle[0].famille, 'socle', 'le socle doit être la couche BASSE');
  assert.equal(couchesTourelle[1].famille, 'defense', 'la tourelle doit être la couche HAUTE');
  assert.match(couchesTourelle[1].nom, /_(n|s|e|o)[a-z]*$/,
    'la tourelle ne porte plus de suffixe d\'orientation');
});

// ---------------------------------------------------------------------------
// Les unités au combat — lot UNITÉS-AU-COMBAT
// ---------------------------------------------------------------------------

test('sprite — les ancres de coque transcrites sont identiques au JSON du disque', () => {
  // ⚠ UNE TRANSCRIPTION QUI NE SE CONFRONTE PAS À SA SOURCE EST UNE COPIE QUI
  // VIEILLIT. `src/data/ancres-chassis.js` est écrit à la main parce que le
  // build n'inline pas de JSON et que `scene.js` ne lit aucun fichier ; c'est ce
  // test qui rend la divergence impossible.
  const json = JSON.parse(readFileSync(join(SPRITES, 'ancres-chassis.json'), 'utf8'));
  const cles = Object.keys(json).sort();

  assert.ok(cles.length > 0, 'le JSON des ancres est vide : le test ne mesure rien');
  assert.deepEqual(Object.keys(ANCRES_CHASSIS).sort(), cles,
    'la transcription et le JSON ne portent pas les mêmes coques');

  for (const cle of cles) {
    // ⚠ LES VALEURS SIGNÉES, PAS LEUR VALEUR ABSOLUE. Un signe inversé décalerait
    // les dix tourelles du même côté, ce qui a l'air d'un choix d'art et n'en est
    // pas un.
    assert.deepEqual(ANCRES_CHASSIS[cle], json[cle], `ancre « ${cle} » divergente`);
  }

  // ⚠⚠ NEUF `y_pct` SUR DIX SONT NÉGATIFS, PAS LES DIX. Le brief du lot
  // annonçait les dix ; mesuré, `off_j_fendeur_chassis_def` vaut **+1,0**. Un
  // test qui asserterait « toutes négatives » serait donc faux, et pire, il
  // inviterait à « corriger » une donnée juste. On asserte le fait mesuré.
  const positifs = cles.filter((c) => json[c].y_pct >= 0);
  assert.deepEqual(positifs, ['off_j_fendeur_chassis_def'],
    'la liste des y_pct non négatifs a changé — remesurer avant de conclure');

  // Et une seule ancre n'est pas mesurée sur l'image, ce que `tools/chassis.py`
  // annonce par « 10 ancres dont 9 mesurées ».
  assert.equal(cles.filter((c) => !json[c].mesure).length, 1);
});

test('sprite — les ancres posent la tourelle DANS la coque', () => {
  // Pour chacune des dix coques, le disque de la tourelle reste dans la boîte de
  // la coque. Sans ça, une tourelle déborderait de son blindé.
  const COTE = 100; // une coque de 100 unités : les pourcentages se lisentdirectement
  let verifiees = 0;
  for (const [cle, a] of Object.entries(ANCRES_CHASSIS)) {
    const rayon = (COTE * a.diametre_pct) / 200;
    const cx = COTE / 2 + (COTE * a.x_pct) / 100;
    const cy = COTE / 2 + (COTE * a.y_pct) / 100;
    assert.ok(cx - rayon >= 0 && cx + rayon <= COTE,
      `${cle} : la tourelle déborde horizontalement (${(cx - rayon).toFixed(1)}…${(cx + rayon).toFixed(1)})`);
    assert.ok(cy - rayon >= 0 && cy + rayon <= COTE,
      `${cle} : la tourelle déborde verticalement (${(cy - rayon).toFixed(1)}…${(cy + rayon).toFixed(1)})`);
    verifiees += 1;
  }
  assert.equal(verifiees, 10, 'les dix coques n\'ont pas été vérifiées');

  // ⚠ FALSIFIABLE : un décalage volontaire de 200 % en sortirait. Sans cet
  // appât, une boîte trop large accepterait n'importe quelle ancre.
  const fautif = { diametre_pct: 30, x_pct: 200, y_pct: 0 };
  const rayonFautif = (COTE * fautif.diametre_pct) / 200;
  const cxFautif = COTE / 2 + (COTE * fautif.x_pct) / 100;
  assert.ok(!(cxFautif - rayonFautif >= 0 && cxFautif + rayonFautif <= COTE),
    'le montage accepterait une tourelle hors de la coque');
});

test('sprite — chaque unité des deux camps résout des noms qui sont dans l\'atlas', () => {
  const ids = Object.keys(UNITES);
  assert.equal(ids.length, 14, 'le roster des unités a changé de taille');

  let couchesVues = 0;
  for (const id of ids) {
    for (const proprietaire of ['joueur', 'ouvrage']) {
      for (const camp of ['attaque', 'defense']) {
        const couches = couchesDeLUnite({ genre: 'unite', id, proprietaire, camp, rangee: 5, colonne: 5 });
        assert.ok(Array.isArray(couches) && couches.length > 0,
          `${id} ${proprietaire} ${camp} : aucune couche`);
        for (const { famille, nom } of couches) {
          assert.ok(existeDansAtlas(famille, nom),
            `${id} ${proprietaire} ${camp} demande ${famille}/${nom}, absent de l'atlas`);
          couchesVues += 1;
        }
      }
    }
  }
  assert.ok(couchesVues >= 14 * 4, `${couchesVues} couches : le balayage n'a pas tout vu`);

  // ⚠⚠ CES DEUX LIGNES ASSERTAIENT `null` ET ELLES ONT ÉTÉ RETOURNÉES, PAS
  // RETIRÉES. Elles disaient « les structures gardent leur géométrie, les
  // bâtiments sont hors du lot », ce qui était vrai des DEUX lots précédents et
  // faux de celui-ci : `couchesDeLEntite` répond maintenant aux trois genres,
  // et c'est tout l'objet du lot STRUCTURES-AU-COMBAT. Un `null` qui reviendrait
  // ici rendrait une casemate invisible au combat.
  const merlon = couchesDeLEntite(
    { genre: 'defense', id: 'merlon', proprietaire: 'joueur', camp: 'defense', rangee: 5, colonne: 5 },
    { voisines: [] },
  );
  assert.ok(Array.isArray(merlon) && merlon.length > 0, 'le merlon n\'a plus de couche');
  const gangue = couchesDeLEntite(
    { genre: 'batiment', id: 'gangue', proprietaire: 'ouvrage', camp: 'defense' },
  );
  assert.ok(Array.isArray(gangue) && gangue.length > 0, 'la gangue n\'a plus de couche');
  // Et le genre inconnu, lui, rend toujours `null` : c'est le repli de la
  // légende, qui n'a pas d'identifiant à résoudre. Sans ce témoin, une fonction
  // qui rendrait TOUJOURS une liste passerait les deux lignes ci-dessus.
  assert.equal(couchesDeLEntite({ genre: 'vignette', id: null, proprietaire: 'joueur', camp: 'defense' }), null);
});

test('sprite — le blindé du joueur rend DEUX couches, la coque SOUS la tourelle', () => {
  const blindes = Object.keys(UNITES).filter((id) => UNITES[id].chassis === 'blinde');
  assert.ok(blindes.length > 0, 'aucun blindé au roster : le test ne mesure rien');

  for (const id of blindes) {
    const joueur = couchesDeLUnite({ genre: 'unite', id, proprietaire: 'joueur', camp: 'attaque', rangee: 5, colonne: 5 });
    assert.equal(joueur.length, 2, `${id} joueur : ${joueur.length} couche(s) au lieu de 2`);

    // ⚠ L'ORDRE SE MESURE PAR LES INDICES, PAS PAR LA PRÉSENCE. Les deux couches
    // seraient là dans l'ordre inverse aussi, et la tourelle passerait sous sa
    // coque sans qu'une assertion de présence le voie.
    const iCoque = joueur.findIndex((c) => c.famille === 'chassis');
    const iTourelle = joueur.findIndex((c) => c.famille === 'tourelle_unite');
    assert.ok(iCoque >= 0 && iTourelle >= 0, `${id} : une des deux familles manque`);
    assert.ok(iCoque < iTourelle, `${id} : la tourelle est dessinée SOUS sa coque`);
    assert.ok(joueur[iTourelle].ancre, `${id} : la tourelle n'a pas d'ancre`);

    // ⚠ ET LE BLINDÉ DE L'OUVRAGE N'EN A QU'UNE : sa tourelle est cuite dans la
    // coque, ses 240 sprites ont été retirés au lot PRODUCTION.
    const ouvrage = couchesDeLUnite({ genre: 'unite', id, proprietaire: 'ouvrage', camp: 'attaque', rangee: 5, colonne: 5 });
    assert.equal(ouvrage.length, 1, `${id} Ouvrage : la tourelle détachée est revenue`);
    assert.equal(ouvrage[0].famille, 'unite');
  }
});

test('sprite — la pose suit la FORCE, pas le camp ni le propriétaire', () => {
  // ⚠ D'ABORD : CHOISIR UNE UNITÉ QUI A VRAIMENT UNE POSE `_def`, sinon le test
  // passerait sur une égalité triviale — les deux forces rendraient le même nom
  // faute de variante, et on ne mesurerait rien.
  const avecPose = Object.keys(UNITES).filter(
    (id) => existeDansAtlas('unite', `off_o_${id}_def`) && UNITES[id].chassis !== 'blinde',
  );
  assert.ok(avecPose.length > 0, 'aucune unité de l\'Ouvrage n\'a de pose de défense');
  const id = avecPose[0];

  const assaut = couchesDeLUnite({ genre: 'unite', id, proprietaire: 'ouvrage', camp: 'attaque' });
  const garnison = couchesDeLUnite({ genre: 'unite', id, proprietaire: 'ouvrage', camp: 'defense' });
  assert.notEqual(assaut[0].nom, garnison[0].nom, `${id} : les deux forces rendent le même nom`);
  assert.equal(garnison[0].nom, `off_o_${id}_def`);
  assert.equal(assaut[0].nom, `off_o_${id}`);

  // ⚠ ET LE PROPRIÉTAIRE NE DÉCIDE QUE DE LA LETTRE. CLAUDE.md §4 : « la clé est
  // le PROPRIÉTAIRE, pas le camp — le joueur peut défendre ». Une unité du
  // joueur qui défend prend la pose `_def` elle aussi, si elle existe.
  const duJoueur = couchesDeLUnite({ genre: 'unite', id, proprietaire: 'joueur', camp: 'defense' });
  assert.match(duJoueur[0].nom, /^off_j_/, 'le propriétaire ne décide plus de la lettre');
});

test('sprite — les unités à pose de défense sont exactement les huit mesurées', () => {
  // ⚠⚠ CE TEST FIGE UNE COÏNCIDENCE D'AUJOURD'HUI, ET IL EST FAIT POUR ROUGIR.
  // Huit des quatorze unités de l'Ouvrage ont une pose `_def`, six ne l'ont pas.
  // Le rendu, lui, s'adapte tout seul — il LIT l'atlas par `existeDansAtlas` au
  // lieu de porter cette liste. Le jour où les six manquantes seront dessinées,
  // ce test tombe et quelqu'un relit le lot au lieu de découvrir la nouveauté
  // six mois plus tard.
  const avec = Object.keys(UNITES).filter((id) => existeDansAtlas('unite', `off_o_${id}_def`)).sort();
  const sans = Object.keys(UNITES).filter((id) => !existeDansAtlas('unite', `off_o_${id}_def`)).sort();

  assert.ok(avec.length > 0 && sans.length > 0,
    'les deux groupes ne sont pas non vides : le test ne mesure rien');
  assert.deepEqual(avec,
    ['belier', 'broyeur', 'carapace', 'fendeur', 'guetteur', 'meute', 'perceurs', 'ratisseur'],
    'la liste des poses de défense a changé — le trou d\'art se comble, relire le lot');
  assert.deepEqual(sans,
    ['busard', 'crecelle', 'enclume', 'fouisseurs', 'frappeur', 'pilon']);

  // Et la liste n'est écrite NULLE PART dans le code de rendu.
  const source = sansCommentaires(readFileSync(join(RACINE, 'src', 'render', 'scene.js'), 'utf8'));
  for (const id of avec) {
    assert.ok(!source.includes(`'${id}'`) && !source.includes(`"${id}"`),
      `« ${id} » est écrit en dur dans scene.js — la liste doit se lire dans l'atlas`);
  }
});

test('sprite — la tourelle du blindé suit sa cible, et retombe au défaut sans elle', () => {
  const id = Object.keys(UNITES).find((u) => UNITES[u].chassis === 'blinde');
  const tireur = { genre: 'unite', id, proprietaire: 'joueur', camp: 'attaque', rangee: 8, colonne: 5 };

  // ⚠ D'ABORD : LES DEUX AZIMUTS TOMBENT-ILS DANS DES SECTEURS DIFFÉRENTS ?
  // Deux cibles trop proches en angle rendraient la même orientation, et le test
  // passerait sur une boussole bloquée.
  const nord = { rangee: 16, colonne: 5 };
  const est = { rangee: 8, colonne: 9 };
  const nomDeLaTourelle = (cible) => couchesDeLUnite(tireur, cible)[1].nom;

  const versNord = nomDeLaTourelle(nord);
  const versEst = nomDeLaTourelle(est);
  assert.notEqual(versNord, versEst, 'deux azimuts distincts rendent la même orientation');
  assert.match(versNord, /_n$/, 'une cible vers la rangée 18 doit rendre le nord');
  assert.match(versEst, /_e$/, 'une cible à droite doit rendre l\'est');

  // Sans cible, la valeur par défaut de la force — juste depuis le correctif de
  // boussole du lot BRANCHEMENT-DÉFENSE : l'armée au repos regarde au nord.
  assert.equal(nomDeLaTourelle(null), `off_j_${id}_n`);
  assert.equal(
    couchesDeLUnite({ ...tireur, camp: 'defense' }, null)[1].nom,
    `off_j_${id}_s`,
    'la garnison au repos doit regarder au sud, vers le déploiement',
  );
});

// ---------------------------------------------------------------------------
// Les structures au combat — lot STRUCTURES-AU-COMBAT
// ---------------------------------------------------------------------------
//
// ⚠⚠ CE QUE CE BLOC GARDE : un objet, un dessin. Avant ce lot, une casemate se
// dessinait de TROIS façons — en sprites sur l'écran Chantier, en primitives
// géométriques dans l'éditeur Défense, en primitives au combat —, et aucun test
// ne pouvait le voir, chacun des trois chemins étant juste séparément. C'est la
// famille de défauts que CLAUDE.md nomme désormais : « deux modules justes
// séparément peuvent être faux ensemble ».

/** Les seize bâtiments : les onze du joueur, les cinq de l'Ouvrage. */
const BATIMENTS_ET_PROPRIETAIRE = [
  ...Object.keys(BASE_BATIMENTS).map((id) => ({ id, proprietaire: 'joueur' })),
  ...Object.keys(BATIMENTS).map((id) => ({ id, proprietaire: 'ouvrage' })),
];

// ---------------------------------------------------------------------------
// Les entrées de la chaîne — lot ENTRÉES, 03/09
// ---------------------------------------------------------------------------

const SOURCES = join(RACINE, 'art', 'sources');
const ATTENTE = join(RACINE, 'art', 'sourcesstandby');

/** Les fichiers à la RACINE d'un dossier — jamais récursif, comme `entrees.py`. */
function fichiersDe(dossier) {
  if (!existsSync(dossier)) return [];
  return readdirSync(dossier, { withFileTypes: true })
    .filter((e) => e.isFile() && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort();
}

/**
 * ⚠⚠ LE MOTIF S'ASSEMBLE, IL NE S'ÉCRIT PAS. Écrit en clair, la garde plus bas
 * se trouvait ELLE-MÊME dans son propre balayage — la faute que ce dépôt
 * raconte déjà pour `viewport-fit=cover` et pour `MENTION_SATURE` : une garde
 * qui lit ce qu'on a écrit à son sujet ne garde rien. Même remède que le
 * remède que la garde des sous-tests imbriqués de `documentation.test.js` — dont
 * le jeton n'est pas écrit ici non plus, elle le refuserait. Il est au module
 * parce que TROIS endroits le nomment : le titre, le message d'aide et le
 * balayage.
 */
const MOTIF = `--decl${'arer'}`;

function declaration() {
  const chemin = join(RACINE, 'art', 'sources-declarees.json');
  assert.ok(existsSync(chemin),
    `art/sources-declarees.json est absent — le produire une fois par `
    + `« python3 tools/entrees.py ${MOTIF} », puis le commiter.`);
  return JSON.parse(readFileSync(chemin, 'utf8'));
}

test('entrées — tout fichier d\'`art/sources/` est CLASSÉ, consommé ou dormant', () => {
  // ⚠⚠ POURQUOI CETTE MOITIÉ EST EN JS ALORS QUE LA GARDE EST EN PYTHON.
  // `tools/entrees.py --verifier` rejoue toute la chaîne pour savoir ce qu'elle
  // OUVRE : c'est un fait d'exécution, il coûte deux minutes, et il ne tourne
  // donc qu'aux lots qui touchent à l'art. Mais la question « ce fichier neuf
  // a-t-il été classé ? » ne demande aucune trace — elle se lit sur le disque.
  // Elle tourne donc à CHAQUE `npm run check`, et c'est elle qui empêche
  // `art/sources/` de se remettre à pourrir entre deux lots d'art.
  const d = declaration();
  const consommees = d.consommees ?? [];
  const dormantes = d.dormantes ?? [];
  const presentes = fichiersDe(SOURCES);

  // ⚠ D'ABORD : LE MONTAGE MESURE-T-IL QUELQUE CHOSE ? Deux listes vides
  // couvriraient un dossier vide sans rien prouver, et la garde serait verte
  // sur une déclaration effacée.
  assert.ok(presentes.length > 100, `${presentes.length} fichiers dans art/sources/`);
  assert.ok(consommees.length > 50, `${consommees.length} consommées déclarées : trop peu pour être vrai`);
  assert.ok(dormantes.length > 50, `${dormantes.length} dormantes déclarées : trop peu pour être vrai`);

  const doublons = consommees.filter((n) => dormantes.includes(n));
  assert.deepEqual(doublons, [], 'un fichier ne peut pas être à la fois consommé et dormant');

  const classees = [...new Set([...consommees, ...dormantes])].sort();
  assert.deepEqual(classees, presentes,
    'art/sources/ et sa déclaration ont divergé — une image neuve se CLASSE : '
    + 'la consommer par un lot qui le dit, ou la laisser dans art/sourcesstandby/. '
    + `Puis « python3 tools/entrees.py ${MOTIF} ».`);
});

test('entrées — le dossier d\'attente est dehors, et rien ne le déclare', () => {
  assert.ok(existsSync(ATTENTE), 'art/sourcesstandby/ a disparu');
  assert.ok(existsSync(join(ATTENTE, 'README.md')),
    'le dossier d\'attente doit dire en une phrase qu\'aucun outil ne le lit');

  // ⚠⚠ IL EST À CÔTÉ DE `art/sources/`, PAS DEDANS. Un `art/sources/attente/`
  // serait balayé par le premier `os.listdir` qu'on ajouterait sans y penser —
  // le mécanisme exact du défaut que ce lot désarme dans `tools/tourelles.py`.
  assert.ok(!existsSync(join(SOURCES, 'attente')) && !existsSync(join(SOURCES, 'standby')),
    'le dossier d\'attente est passé DANS art/sources/ : il y sera balayé un jour');

  const d = declaration();
  const enAttente = fichiersDe(ATTENTE);
  assert.ok(enAttente.length > 1, `${enAttente.length} fichier(s) en attente : le balayage ne trouve rien`);
  const declares = new Set([...(d.consommees ?? []), ...(d.dormantes ?? [])]);
  const intrus = enAttente.filter((n) => declares.has(n));
  assert.deepEqual(intrus, [],
    'un fichier en attente est déclaré comme une source : il a été déplacé sans son lot');

  // Et aucun outil ne nomme ce dossier, sauf celui qui le surveille.
  const outils = readdirSync(join(RACINE, 'tools')).filter((f) => f.endsWith('.py') || f.endsWith('.js'));
  // ⚠ DEUX OUTILS LE NOMMENT, ET AUCUN NE LE LIT. `entrees.py` le surveille ;
  // `tourelles.py` y renvoie dans son message de refus, quand deux fichiers
  // répondent au même indice de planche. Un TROISIÈME nom fait tomber la garde,
  // pour qu'on vienne dire pourquoi plutôt que de laisser la liste vieillir.
  const nomment = outils.filter((f) => sansCommentaires(
    readFileSync(join(RACINE, 'tools', f), 'utf8'),
  ).includes('sourcesstandby'));
  assert.deepEqual(nomment, ['entrees.py', 'tourelles.py'],
    'un outil de la chaîne nomme le dossier d\'attente hors de sa garde');
});

test(`entrées — \`${MOTIF}\` n'est jamais appelé par le chemin normal`, () => {
  // ⚠⚠ C'EST LA MOITIÉ QUI REND TOUTE LA GARDE HONNÊTE, ET ELLE A DÉJÀ COÛTÉ UN
  // LOT AILLEURS. Une garde qui RÉGÉNÈRE la déclaration puis la compare à ce
  // qu'elle vient d'écrire ne peut pas échouer. La déclaration est une
  // INTENTION commitée ; la trace est un FAIT d'exécution. Deux sources
  // indépendantes, sinon rien.
  const suspects = [
    ['tools/verifier.py', readFileSync(join(RACINE, 'tools', 'verifier.py'), 'utf8')],
    ['package.json', readFileSync(join(RACINE, 'package.json'), 'utf8')],
    ...readdirSync(join(RACINE, 'test'))
      .filter((f) => f.endsWith('.js'))
      .map((f) => [`test/${f}`, readFileSync(join(RACINE, 'test', f), 'utf8')]),
  ];
  for (const [nom, source] of suspects) {
    assert.ok(!sansCommentaires(source).includes(MOTIF),
      `${nom} appelle « ${MOTIF} » : la garde régénérerait ce qu'elle compare`);
  }

  // ⚠ FALSIFIABLE : le motif reconnaît bien la faute qu'il cherche, et le
  // décommentage ne vide pas les fichiers qu'il balaie.
  assert.ok(sansCommentaires(`jouer('entrees', ['${MOTIF}'])`).includes(MOTIF),
    'le motif ne reconnaît pas un appel qu\'il doit refuser');
  assert.ok(suspects.every(([, s]) => sansCommentaires(s).length > 100),
    'le décommentage a mangé un fichier balayé');

  // Et l'outil porte bien les DEUX modes : un mode de déclaration disparu rendrait la
  // déclaration irreproductible sans que rien ne tombe.
  const entrees = readFileSync(join(RACINE, 'tools', 'entrees.py'), 'utf8');
  for (const mode of [MOTIF, '--verifier']) {
    assert.ok(entrees.includes(mode), `tools/entrees.py a perdu le mode ${mode}`);
  }
});

test('entrées — la garde est le DERNIER maillon de la chaîne du vérificateur', () => {
  const source = readFileSync(join(RACINE, 'tools', 'verifier.py'), 'utf8');
  const bloc = source.match(/^CHAINE = \[$([\s\S]*?)^\]$/m);
  assert.ok(bloc !== null, '`CHAINE` est introuvable dans tools/verifier.py');
  const maillons = [...bloc[1].matchAll(/^\s*\('([a-z_]+)',/gm)].map((m) => m[1]);
  assert.ok(maillons.length > 10, `${maillons.length} maillons lus : le parse ne trouve rien`);
  assert.equal(maillons.at(-1), 'entrees',
    'la garde des entrées doit passer en dernier — elle observe ce que les autres ouvrent');
  assert.equal(new Set(maillons).size, maillons.length, 'un outil est deux fois dans CHAINE');
});

test('T8 étendue — une structure se dessine à l\'identique sur l\'écran Chantier et au combat', () => {
  // ⚠ T8 D'`arsenal.test.js` NE COUVRAIT QUE LES QUATORZE UNITÉS. Le même
  // argument vaut mot pour mot pour les défenses et les bâtiments : sans quoi le
  // joueur apprendrait un vocabulaire visuel dans l'éditeur et en découvrirait un
  // autre au combat. Ce test-ci l'étend, et il est fait pour tomber le jour où
  // quelqu'un réécrirait le calcul dans l'écran « pour aller plus vite ».
  const etat = garnisonComplete();
  assert.equal(baseCourante(etat).garnison.length, Object.keys(DEFENSES).length,
    'le montage ne porte pas les neuf défenses');

  let comparees = 0;
  for (const piece of baseCourante(etat).garnison) {
    // Le chemin de l'ÉCRAN : la table de terrain, telle que la boucle de peinture
    // l'interroge — `terrain.spriteDe(b, etat)`.
    const ecran = TERRAINS.defense.spriteDe(piece, etat);
    // Le chemin du CHAMP : le descripteur que `listeAffichage` compose, au même
    // propriétaire et au même contexte.
    const champ = couchesDeLEntite(
      { genre: 'defense', id: piece.id, proprietaire: 'joueur', camp: 'defense',
        rangee: piece.rangee, colonne: piece.colonne },
      { voisines: baseCourante(etat).garnison, cible: null },
    );
    // ⚠ FALSIFIABILITÉ, PREMIÈRE MOITIÉ : deux listes vides seraient égales.
    assert.ok(Array.isArray(ecran) && ecran.length > 0, `« ${piece.id} » : l'écran ne rend rien`);
    assert.deepEqual(champ, ecran, `« ${piece.id} » se dessine autrement au combat`);

    // ⚠ FALSIFIABILITÉ, SECONDE MOITIÉ : une fonction qui rendrait TOUJOURS la
    // même chose passerait l'égalité ci-dessus. Le propriétaire doit peser.
    const ouvrage = couchesDeLEntite(
      { genre: 'defense', id: piece.id, proprietaire: 'ouvrage', camp: 'defense',
        rangee: piece.rangee, colonne: piece.colonne },
      { voisines: baseCourante(etat).garnison, cible: null },
    );
    assert.notDeepEqual(ouvrage, ecran,
      `« ${piece.id} » : le propriétaire ne change rien au dessin`);
    comparees += 1;
  }
  assert.equal(comparees, 9, `${comparees} défenses comparées au lieu de neuf`);

  // Les seize bâtiments, même confrontation. L'écran ne connaît que les onze du
  // joueur — c'est SA bande — et les cinq de l'Ouvrage n'existent qu'au combat.
  for (const id of Object.keys(BASE_BATIMENTS)) {
    const ecran = TERRAINS.batiments.spriteDe({ id, rangee: 18, colonne: 5, niveau: 1 }, etat);
    const champ = couchesDeLEntite(
      { genre: 'batiment', id, proprietaire: 'joueur', camp: 'defense' },
    );
    assert.ok(Array.isArray(ecran) && ecran.length > 0, `« ${id} » : l'écran ne rend rien`);
    assert.deepEqual(champ, ecran, `« ${id} » se dessine autrement au combat`);
    assert.notDeepEqual(
      couchesDeLEntite({ genre: 'batiment', id, proprietaire: 'ouvrage', camp: 'defense' }),
      ecran, `« ${id} » : le propriétaire ne change rien au dessin`,
    );
  }
});

test('couches — les trois genres en rendent, et `null` reste réservé à la légende', () => {
  // ⚠ AVANT CE LOT, DEUX GENRES SUR TROIS RENDAIENT `null`, et c'était le
  // symptôme : ce qui n'a pas de couche se dessine en géométrie. La légende est
  // la seule qui garde ce droit, et elle ne passe par ce point d'entrée que pour
  // s'en voir refuser l'accès — `ENTREES_LEGENDE` liste des couples classe ×
  // accent, sans identifiant à résoudre.
  const etat = garnisonComplete();
  let vues = 0;
  for (const proprietaire of ['joueur', 'ouvrage']) {
    for (const id of Object.keys(UNITES)) {
      for (const camp of ['attaque', 'defense']) {
        const c = couchesDeLEntite(
          { genre: 'unite', id, proprietaire, camp, rangee: 5, colonne: 5 }, {},
        );
        assert.ok(Array.isArray(c) && c.length > 0, `unite ${id} ${proprietaire} ${camp}`);
        vues += 1;
      }
    }
    for (const id of Object.keys(DEFENSES)) {
      const c = couchesDeLEntite(
        { genre: 'defense', id, proprietaire, camp: 'defense', rangee: 5, colonne: 5 },
        { voisines: baseCourante(etat).garnison },
      );
      assert.ok(Array.isArray(c) && c.length > 0, `defense ${id} ${proprietaire}`);
      vues += 1;
    }
  }
  for (const { id, proprietaire } of BATIMENTS_ET_PROPRIETAIRE) {
    const c = couchesDeLEntite({ genre: 'batiment', id, proprietaire, camp: 'defense' });
    assert.ok(Array.isArray(c) && c.length > 0, `batiment ${id} ${proprietaire}`);
    vues += 1;
  }
  // 14 unités × 2 camps × 2 propriétaires + 9 défenses × 2 + 16 bâtiments.
  assert.equal(vues, 14 * 2 * 2 + 9 * 2 + 16, `${vues} descripteurs balayés`);

  // Le témoin : un genre sans identifiant résoluble rend toujours `null`. Sans
  // lui, une fonction qui rendrait TOUJOURS une liste passerait tout ce qui
  // précède, et le repli de la légende serait mort sans qu'on le sache.
  assert.equal(couchesDeLEntite({ genre: 'vignette', id: null, proprietaire: 'joueur', camp: 'defense' }), null);
});

test('couches — tout nom composable est dans un atlas cousu, les deux propriétaires compris', () => {
  // ⚠⚠ C'EST LE TEST QUI FAIT SERVIR LES SPRITES DORMANTS. 125 sprites de
  // l'Ouvrage — 102 `def_o_*`, 18 `socle_def_o_*`, 5 `bat_o_*` — étaient DANS le
  // fichier livré et n'étaient nommés par aucune ligne de `src/`. Le brief le
  // dit : « s'il passe du premier coup sans en toucher un seul, c'est qu'il ne
  // balaye pas ce qu'il croit » — d'où le compte de noms d'Ouvrage, asserté.
  const RANGEE = 5;
  const COLONNE = 5;
  // Les quatre voisinages qui produisent les quatre liaisons, et rien d'autre :
  // ils se construisent, ils ne se nomment pas. Écrire les suffixes à la main
  // ferait balayer ce que le test croit, et non ce que le code compose.
  const VOISINAGES = [
    [],
    [{ id: 'merlon', rangee: RANGEE, colonne: COLONNE + 1 }],
    [{ id: 'merlon', rangee: RANGEE, colonne: COLONNE - 1 }],
    [{ id: 'merlon', rangee: RANGEE, colonne: COLONNE - 1 },
      { id: 'merlon', rangee: RANGEE, colonne: COLONNE + 1 }],
  ];
  // Seize azimuts réguliers : la cible est POSÉE, l'orientation se calcule.
  const CIBLES = Array.from({ length: 16 }, (_, k) => {
    const a = (k * 2 * Math.PI) / 16;
    return { rangee: RANGEE + Math.cos(a) * 10, colonne: COLONNE + Math.sin(a) * 10 };
  });

  const noms = new Set();
  for (const id of Object.keys(DEFENSES)) {
    for (const proprietaire of ['joueur', 'ouvrage']) {
      for (const voisinage of VOISINAGES) {
        for (const cible of CIBLES) {
          const couches = couchesDeLEntite(
            { genre: 'defense', id, proprietaire, camp: 'defense', rangee: RANGEE, colonne: COLONNE },
            { voisines: [{ id, rangee: RANGEE, colonne: COLONNE }, ...voisinage], cible },
          );
          for (const { famille, nom } of couches) {
            assert.ok(existeDansAtlas(famille, nom),
              `${id}/${proprietaire} demande ${famille}/${nom}, absent de l'atlas cousu`);
            assert.doesNotThrow(() => fondDuSprite(famille, nom));
            noms.add(`${famille}/${nom}`);
          }
        }
      }
    }
  }
  for (const { id, proprietaire } of BATIMENTS_ET_PROPRIETAIRE) {
    for (const { famille, nom } of couchesDeLEntite(
      { genre: 'batiment', id, proprietaire, camp: 'defense' },
    )) {
      assert.ok(existeDansAtlas(famille, nom), `${id}/${proprietaire} : ${famille}/${nom} absent`);
      noms.add(`${famille}/${nom}`);
    }
  }

  // ⚠ LE BALAYAGE SE MESURE, IL NE SE SUPPOSE PAS. Les seize orientations et les
  // quatre liaisons doivent réellement produire des noms distincts : sans ce
  // compte, une composition qui ignorerait la cible passerait toutes les
  // assertions ci-dessus en ne nommant que seize sprites.
  assert.equal(noms.size, 238, `${noms.size} noms distincts composés`);

  // ⚠⚠ ET LE COMPTE QUI FAIT LE LOT : les noms de l'OUVRAGE désormais atteints.
  // Ils étaient zéro avant — aucune ligne de `src/` ne les nommait — et le
  // fichier livré les portait déjà.
  const ouvrage = [...noms].filter((n) => /\/(def_o_|socle_def_o_|bat_o_)/.test(n));
  assert.equal(ouvrage.length, 110, `${ouvrage.length} sprites de l'Ouvrage atteints`);

  // ⚠ LES QUINZE QUI RESTENT DORMANTS SE NOMMENT, plutôt que d'être un reste.
  // Douze le sont par ARBITRAGE — l'Ouvrage ne chaîne pas (Ethan, 30/08), donc
  // ses socles et ses merlons raccordés ne peuvent pas être demandés — et trois
  // par une conséquence mesurable : les socles NUS des trois tourelles de
  // contact du joueur ne servent jamais, leurs quatre variantes raccordées
  // couvrant les quatre liaisons, `isole` compris. Ce n'est pas un défaut, c'est
  // le repli d'`existeDansAtlas` qui ne mord pas là où la planche est complète.
  const dormants = [
    ...ATLAS.defense.noms.map((n) => `defense/${n}`),
    ...ATLAS.socle.noms.map((n) => `socle/${n}`),
  ].filter((n) => !noms.has(n));
  assert.deepEqual(dormants.sort(), [
    'defense/def_o_merlon_est',
    'defense/def_o_merlon_ouest',
    'defense/def_o_merlon_traversant',
    'socle/socle_def_j_batterie',
    'socle/socle_def_j_casemate',
    'socle/socle_def_j_creneau',
    'socle/socle_def_o_batterie',
    'socle/socle_def_o_batterie_est',
    'socle/socle_def_o_batterie_ouest',
    'socle/socle_def_o_batterie_traversant',
    'socle/socle_def_o_casemate',
    'socle/socle_def_o_casemate_est',
    'socle/socle_def_o_casemate_ouest',
    'socle/socle_def_o_casemate_traversant',
    'socle/socle_def_o_creneau',
    'socle/socle_def_o_creneau_est',
    'socle/socle_def_o_creneau_ouest',
    'socle/socle_def_o_creneau_traversant',
  ].sort(), 'la liste des sprites hors d\'atteinte a changé — dire pourquoi');
});

test('couches — le chaînage suit les vivantes, MESURÉ SUR LA LISTE D\'AFFICHAGE', () => {
  // ⚠⚠ CE TEST A ÉTÉ RÉÉCRIT APRÈS FALSIFICATION, ET LA RÉÉCRITURE A TROUVÉ UN
  // DÉFAUT. Sa première version appelait `couchesDeLEntite` avec une liste de
  // voisines ÉCRITE À LA MAIN : retirer `visible(e)` du filtre de
  // `listeAffichage` la laissait VERTE. C'est le défaut que CLAUDE.md nomme
  // déjà — « un montage écrit à la main ne garde que lui-même » —, et en
  // passant par la vraie liste d'affichage on a découvert que le chaînage était
  // MORT au combat : les voisines portaient `e.rangee`, qui vaut `undefined`
  // sur une entité (le moteur range `rangeeMilli`), donc aucune comparaison de
  // rangée ne pouvait réussir. Deux merlons côte à côte se rejoignaient sur
  // l'écran Chantier et pas au combat.
  //
  // ⚠ IL FAUT UN COMBAT OÙ LE JOUEUR DÉFEND, sans quoi rien n'est observable :
  // l'Ouvrage ne chaîne pas (arbitré le 30/08), et un site de l'Ouvrage est le
  // seul défenseur que le jeu produise aujourd'hui. `proprietaireDefense` existe
  // dans le montage de `creerCombat` depuis le lot 3A ; c'est ce qui permet de
  // mesurer dès maintenant un chemin que le raid empruntera plus tard.
  //
  // ⚠ ET LE MONTAGE NE PORTE AUCUN BÂTIMENT, délibérément : `creerCombat` ne
  // connaît que les cinq bâtiments de l'Ouvrage, et en poser un sous un
  // propriétaire joueur demanderait `bat_j_gangue`, qui n'existe pas. La levée
  // est le bon comportement — « une unité invisible est un défaut qu'on doit
  // voir » — et ce n'est pas ce test-ci qui l'éprouve.
  const bande = GRILLE.bandes.defense;
  const montage = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    proprietaireDefense: 'joueur',
    proprietaireAttaque: 'ouvrage',
    batiments: [],
    defenseurs: [
      { id: 'merlon', rangee: bande.premiere, colonne: 4 },
      { id: 'merlon', rangee: bande.premiere, colonne: 5 },
    ],
    vagues: [[{ id: 'meute', colonne: 9 }]],
    modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
  };
  const etat = creerCombat(montage);
  const projection = calculerProjection(412, 900);
  const murs = (liste) => liste
    .filter((p) => p.forme === 'sprite' && p.nom.includes('merlon'))
    .map((p) => p.nom)
    .sort();

  // ⚠ FALSIFIABLE : on asserte D'ABORD que les deux se lient. Deux merlons qui
  // ne se rejoindraient jamais rendraient `isole` avant comme après, et la
  // comparaison ci-dessous passerait sur du code mort.
  const avant = murs(listeAffichage(etat, projection, null, 0));
  assert.deepEqual(avant, ['def_j_merlon_est', 'def_j_merlon_ouest'],
    `${avant.join(' ')} : les deux merlons ne se lient pas au combat`);

  // La colonne 4 tombe. Le survivant n'est plus raccordé à une ruine.
  const mort = etat.entites.find((e) => e.id === 'merlon' && e.colonne === 4);
  assert.ok(mort !== undefined, 'le montage n\'a pas produit le merlon de la colonne 4');
  mort.vivant = false;
  const apres = murs(listeAffichage(etat, projection, null, 0));
  assert.deepEqual(apres, ['def_j_merlon_isole'],
    `${apres.join(' ')} : le survivant reste raccordé à une ruine`);
});

test('couches — l\'Ouvrage ne chaîne pas, et le joueur dans la même case chaîne', () => {
  const RANGEE = 5;
  const voisines = [
    { id: 'merlon', rangee: RANGEE, colonne: 4 },
    { id: 'casemate', rangee: RANGEE, colonne: 5 },
    { id: 'merlon', rangee: RANGEE, colonne: 6 },
  ];
  const couches = (piece, proprietaire) => couchesDeLEntite(
    { genre: 'defense', id: piece.id, proprietaire, camp: 'defense',
      rangee: piece.rangee, colonne: piece.colonne },
    { voisines },
  );

  // ⚠ FALSIFIABLE : le témoin joueur d'abord. Un montage qui ne lierait rien
  // rendrait `isole` des deux côtés et le test passerait sur du code cassé.
  const murJoueur = couches(voisines[0], 'joueur')[0].nom;
  const socleJoueur = couches(voisines[1], 'joueur')[0].nom;
  assert.doesNotMatch(murJoueur, /_isole$/, `« ${murJoueur} » : le mur du joueur ne chaîne pas`);
  assert.match(socleJoueur, /_(est|ouest|traversant)$/,
    `« ${socleJoueur} » : le socle du joueur ne porte pas d'amorce`);

  // Mêmes voisines, propriétaire Ouvrage : tout est isolé. Arbitré le 30/08.
  assert.match(couches(voisines[0], 'ouvrage')[0].nom, /^def_o_merlon_isole$/);
  assert.match(couches(voisines[1], 'ouvrage')[0].nom, /^socle_def_o_casemate_isole$/);
});

test('couches — la tourelle du champ vise sa cible, et deux azimuts donnent deux sprites', () => {
  const piece = { id: 'casemate', rangee: 5, colonne: 5 };
  const nomVers = (cible) => couchesDeLEntite(
    { genre: 'defense', id: piece.id, proprietaire: 'joueur', camp: 'defense',
      rangee: piece.rangee, colonne: piece.colonne },
    { voisines: [piece], cible },
  )[1].nom;

  // Deux cibles à deux azimuts nettement distincts — l'une vers la rangée 18
  // (le fond, le nord), l'autre vers le déploiement (le sud).
  const versLeFond = nomVers({ rangee: 15, colonne: 5 });
  const versLAssaut = nomVers({ rangee: 2, colonne: 5 });
  assert.equal(versLeFond, 'def_j_casemate_n');
  assert.equal(versLAssaut, 'def_j_casemate_s');
  assert.notEqual(versLeFond, versLAssaut, 'la tourelle ne suit pas sa cible');

  // Sans cible, c'est le défaut de la garnison — le sud, vers l'assaut. Ce
  // témoin est ce qui a manqué au 30/08 : la boussole et ce défaut se
  // contredisaient, et chacun était gardé de son côté.
  assert.equal(nomVers(null), `def_j_casemate_${ORIENTATION_PAR_DEFAUT.garnison}`);
  assert.equal(nomVers(null), versLAssaut,
    'le repos et la cible au sud ne donnent pas le même sprite : la boussole a redivergé');
});

test('couches — le renommage propriétaire est complet dans tout `src/`', () => {
  // ⚠ `camp` DÉSIGNE UN CÔTÉ DE LA GRILLE, `proprietaire` DÉSIGNE À QUI C'EST
  // (CLAUDE.md §4). Tant qu'un seul appelant passait la valeur par défaut,
  // l'ambiguïté ne coûtait rien ; ce lot ajoute des appelants qui passent une
  // vraie valeur, et passer `e.camp` au lieu d'`e.proprietaire` compilerait,
  // ne lèverait pas, et ferait chaîner le mauvais côté.
  const fichiers = [];
  const parcourir = (dossier) => {
    for (const entree of readdirSync(dossier, { withFileTypes: true })) {
      const chemin = join(dossier, entree.name);
      if (entree.isDirectory()) parcourir(chemin);
      else if (entree.name.endsWith('.js')) fichiers.push(chemin);
    }
  };
  parcourir(join(RACINE, 'src'));
  assert.ok(fichiers.length > 30, `${fichiers.length} fichiers balayés : le parcours ne voit rien`);

  //
  // ⚠⚠ LE BALAYAGE LIT LA SOURCE DÉCOMMENTÉE, ET IL A FALLU LE RESSERRER : la
  // première version tombait sur `rendu-pose.js`, dont le commentaire RACONTE le
  // renommage — « elle s'appelait `campChaine` ». C'est la quatrième fois que le
  // dépôt commet cette faute-là, après `viewport-fit=cover`, `MENTION_SATURE` et
  // `etat.rng` : une garde qui lit ce qu'on a écrit à son sujet ne garde rien.
  // Ici elle accusait au lieu d'absoudre, mais la cause est la même.
  const sansCommentaires = (texte) => texte
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');

  // ⚠ L'APPÂT : le motif doit encore reconnaître la vraie faute. Sans lui, un
  // décommentage trop gourmand rendrait la garde muette pour toujours.
  assert.match(sansCommentaires('const x = campChaine(p); // campChaine'), /campChaine/);
  assert.doesNotMatch(sansCommentaires('// elle s\'appelait campChaine'), /campChaine/);

  let decommentes = 0;
  for (const chemin of fichiers) {
    const source = sansCommentaires(readFileSync(chemin, 'utf8'));
    assert.doesNotMatch(source, /campChaine/, `${chemin} nomme encore \`campChaine\``);
    decommentes += 1;
  }
  assert.equal(decommentes, fichiers.length);

  // Et les deux fonctions de liaison ne prennent plus un paramètre nommé `camp`.
  const rendu = readFileSync(join(RACINE, 'src', 'sim', 'rendu-pose.js'), 'utf8');
  assert.match(rendu, /export function proprietaireChaine\(proprietaire\)/);
  for (const fonction of ['liaisonDuMur', 'liaisonDuSocle']) {
    const motif = new RegExp(`export function ${fonction}\\([^)]*\\)`);
    const signature = rendu.match(motif);
    assert.ok(signature !== null, `${fonction} a disparu`);
    assert.doesNotMatch(signature[0], /\bcamp\b/, `${signature[0]} : le paramètre s'appelle encore camp`);
    assert.match(signature[0], /proprietaire/, `${signature[0]} : le paramètre ne dit pas propriétaire`);
  }
});

// ---------------------------------------------------------------------------
// Le lot SPRITES-ET-ZOOM : la garnison n'est pas faite QUE de défenses
// ---------------------------------------------------------------------------

test('garnison — les DIX-SEPT pièces posables se dessinent, pas seulement les neuf', () => {
  // ⚠⚠ CE TEST NAÎT D'UN DÉFAUT QUI ÉTAIT SUR `main`, ET QUI FAISAIT ÉCRAN
  // BLANC. `rosterDefensif()` compose la palette de garnison à partir de DEUX
  // tables : les neuf ouvrages et artilleries de `DEFENSES`, plus les huit
  // unités de `UNITES` dont `defense.present` est vrai. `ui/chantier.js`
  // demandait `genre: 'defense'` pour les dix-sept ; `couchesDeLEntite` levait
  // sur les huit unités, et comme la levée part de `peindre`, poser des
  // Fusiliers en garnison laissait toute la base blanche.
  //
  // ⚠ SON VOISIN DE DESSUS NE POUVAIT PAS LE VOIR : il monte une garnison des
  // NEUF `DEFENSES` seulement, c'est-à-dire exactement la moitié du roster qui
  // marchait. C'est la leçon habituelle du dépôt — un montage écrit à la main
  // ne garde que lui-même —, et la parade est de partir de la LISTE réelle.
  const roster = rosterDefensif();
  assert.equal(roster.length, 17, `${roster.length} pièces posables au lieu de dix-sept`);

  // ⚠ ET LE MONTAGE MESURE QU'IL Y A BIEN DEUX GENRES. Si les dix-sept étaient
  // du même genre, ce test passerait sur le code cassé qu'il existe pour
  // attraper.
  const genres = new Set(roster.map(genreDeLaGarnison));
  assert.deepEqual([...genres].sort(), ['defense', 'unite'],
    'la garnison ne porte plus qu\'un genre : ce test ne mesure plus rien');
  assert.equal(roster.filter((id) => genreDeLaGarnison(id) === 'unite').length, 8,
    'le compte d\'unités de garnison a changé');

  // Les dix-sept résolvent des couches, et toutes sont dans un atlas cousu.
  const etat = creerEtat(20260830);
  for (const id of roster) {
    const couches = TERRAINS.defense.spriteDe(
      { id, rangee: GRILLE.bandes.defense.premiere, colonne: 3, niveau: 1 }, etat,
    );
    assert.ok(Array.isArray(couches) && couches.length > 0, `« ${id} » ne rend aucune couche`);
    for (const { famille, nom } of couches) {
      assert.ok(existeDansAtlas(famille, nom),
        `« ${id} » demande ${famille}/${nom}, absent de l'atlas cousu`);
      assert.doesNotThrow(() => fondDuSprite(famille, nom));
    }
  }

  // ⚠ ET LA PALETTE LES RÉSOUT AUSSI, à la case (0, 0) qu'elle emploie : une
  // pièce hors grille ne doit pas lever. C'est le chemin par lequel le défaut
  // arriverait désormais en premier — la palette se peint avant toute pose.
  for (const id of roster) {
    assert.doesNotThrow(
      () => TERRAINS.defense.spriteDe({ id, rangee: 0, colonne: 0, niveau: 1 }, etat),
      `la palette lève sur « ${id} »`,
    );
  }

  // Falsifiable de face : un identifiant qui n'est dans aucune des deux tables
  // lève, plutôt que de rendre un genre par défaut qui dessinerait n'importe quoi.
  assert.throws(() => genreDeLaGarnison('nexistepas'), /ni en défense ni dans le roster/);
});

// ---------------------------------------------------------------------------
// La famille `terrain` — lot MOULINETTE-TERRAIN, 03/09
// ---------------------------------------------------------------------------
//
// ⚠⚠ CE QUE CES QUATRE GARDES EXISTENT POUR EMPÊCHER. Le lot PIXELS a fait
// cesser la quantification de toute la chaîne le 02/09 ; la famille `terrain`
// n'y est pas passée, parce qu'elle était déclarée SOURCE et qu'aucun outil ne
// la produisait. Elle est restée à trois teintes pendant que les huit autres en
// portaient trois mille, et **rien dans le dépôt ne pouvait le dire** : l'index
// était exact, la géométrie était exacte, les dix-huit noms se résolvaient.
// Seuls les pixels avaient vieilli. C'est le même angle mort que celui de
// BÂTIMENTS-1024, vu par l'autre bout — là, un atlas périmé sous des sprites
// neufs ; ici, des sprites périmés sous un outil qui n'existait pas.

const TERRAIN_128 = join(SPRITES, 'terrain', '128');
const TERRAIN_64 = join(SPRITES, 'terrain', '64');
const DESSINS_TERRAIN = [
  'champ_quartz_a', 'champ_quartz_b', 'champ_scorie_a', 'champ_scorie_b',
  'obs_infanterie_a', 'obs_infanterie_b', 'obs_les_deux_a', 'obs_les_deux_b',
  'obs_vehicule_a', 'obs_vehicule_b',
];
const DALLES_TERRAIN = [
  'tile_sol_j_a', 'tile_sol_j_b', 'tile_sol_j_c', 'tile_sol_j_d',
  'tile_sol_o_a', 'tile_sol_o_b', 'tile_sol_o_c', 'tile_sol_o_d',
];

/** Les teintes RVB distinctes des pixels non transparents. */
function teintesOpaques(image) {
  const vues = new Set();
  for (let i = 0; i < image.pixels.length; i += 4) {
    if (image.pixels[i + 3] === 0) continue;
    vues.add((image.pixels[i] << 16) | (image.pixels[i + 1] << 8) | image.pixels[i + 2]);
  }
  return vues.size;
}

/** L'emprise du dessin : côté du carré englobant les pixels non transparents. */
function empriseDuSprite(image) {
  let xMin = Infinity, xMax = -1, yMin = Infinity, yMax = -1;
  for (let y = 0; y < image.hauteur; y += 1) {
    for (let x = 0; x < image.largeur; x += 1) {
      if (image.pixels[(y * image.largeur + x) * 4 + 3] === 0) continue;
      if (x < xMin) xMin = x;
      if (x > xMax) xMax = x;
      if (y < yMin) yMin = y;
      if (y > yMax) yMax = y;
    }
  }
  assert.ok(xMax >= 0, 'sprite entièrement transparent');
  return {
    cote: Math.max(xMax - xMin, yMax - yMin) + 1,
    marge: Math.min(xMin, yMin, image.largeur - 1 - xMax, image.hauteur - 1 - yMax),
  };
}

test('terrain — les dix champs et obstacles sont passés au filtre, les huit dalles non', () => {
  // ⚠⚠ LA GARDE EST À DEUX FACES, ET C'EST CE QUI LA REND HONNÊTE. Exiger « plus
  // de cent teintes » sur toute la famille serait faux : les huit dalles de sol
  // sont un INDEX à cinq teintes, c'est leur nature, et `tools/verifier.py` les
  // déclare source pour cette raison-là. On mesure donc les deux groupes
  // séparément, et le second est aussi ferme que le premier — le jour où une
  // dalle se met à porter mille teintes, c'est qu'on l'a passée au filtre sans
  // décider ce que devient la rampe de l'Ouvrage, qui en est un recolorage.
  //
  // ⚠⚠ LE SEUIL EST À TRENTE-DEUX, ET IL SE POSE ENTRE DEUX MESURES, PAS AU
  // JUGÉ. Relevé sur les dix après ce lot : **213 à 3 575 teintes en 128, 82 à
  // 1 195 en 64** — la borne basse est `obs_vehicule`, une nappe de pétrole
  // presque plate qui n'a presque pas de matière à porter. Avant ce lot, les
  // dix en portaient **de 1 à 5**. Trente-deux est six fois au-dessus de
  // l'ancien maximum et deux fois et demie sous le nouveau minimum ; il ne peut
  // donc ni laisser passer une requantification, ni tomber sur un dessin plat.
  // ⚠ La première écriture de cette garde disait cent, et elle est tombée sur
  // les 82 du pétrole : un seuil qui ne tient pas dans l'intervalle qu'on vient
  // soi-même de mesurer n'est pas un seuil, c'est un chiffre rond.
  for (const [dossier, cote] of [[TERRAIN_128, 128], [TERRAIN_64, 64]]) {
    for (const nom of DESSINS_TERRAIN) {
      const n = teintesOpaques(decoderRgba(join(dossier, `${nom}.png`)));
      assert.ok(n > 32,
        `terrain/${cote}/${nom} porte ${n} teintes : la famille est retombée dans la quantification`);
    }
    // ⚠⚠ ET LES HUIT DALLES SE MESURENT AUSSI, MAIS PAS AUX TROIS GRILLES — LEUR
    // TYPE DE COULEUR N'EST PAS LE MÊME PARTOUT, ET C'EST MESURÉ. Les huit sont
    // en RVBA aux grilles 32 et 64, en RVB SANS COUCHE ALPHA à la grille 128 ;
    // `decoderRgba` refuse le second de face. Cette incohérence n'est pas un
    // défaut de ce lot : elle date de la migration à usage unique qui a produit
    // ces fichiers et supprimé ses propres planches, et elle est une raison de
    // plus de ne pas prétendre savoir les reproduire.
    //
    // ⚠ ON MESURE DONC LÀ OÙ ON PEUT LIRE, et c'est assez : cinq teintes, ni
    // plus ni moins. Le jour où une dalle passe au filtre, elle en portera des
    // centaines et cette égalité tombera — et il faudra alors décider ce que
    // devient la rampe de l'Ouvrage, dont ces dalles-ci sont le recolorage
    // exact, structure identique et cinq teintes substituées.
    if (cote === 64) {
      for (const nom of DALLES_TERRAIN) {
        const n = teintesOpaques(decoderRgba(join(dossier, `${nom}.png`)));
        assert.equal(n, 5,
          `terrain/${cote}/${nom} porte ${n} teintes : une dalle de sol est un INDEX à cinq tons`);
      }
    }
  }
});

test('terrain — l\'emprise des dix dessins est celle du dépôt, aux deux grilles', () => {
  // ⚠ CETTE GARDE MESURE `EMPRISE32` DE `tools/terrain.py`, ET ELLE EST LA SEULE
  // À LE FAIRE. Sept huitièmes de la case, centrés : 112 sur 128, 56 sur 64.
  // C'est l'emprise que la famille portait AVANT ce lot, relevée sur les dix
  // sprites commités — la reprendre était le seul moyen de ne pas faire grandir
  // ni maigrir tous les champs de toutes les bases au passage. Une valeur
  // changée dans l'outil déplacerait les dix d'un coup, et rien à l'écran ne
  // dirait laquelle des deux est la bonne.
  for (const [dossier, cote] of [[TERRAIN_128, 128], [TERRAIN_64, 64]]) {
    for (const nom of DESSINS_TERRAIN) {
      const { cote: emprise, marge } = empriseDuSprite(decoderRgba(join(dossier, `${nom}.png`)));
      assert.equal(emprise, (cote * 7) / 8, `terrain/${cote}/${nom} : emprise ${emprise}`);
      assert.equal(marge, cote / 16, `terrain/${cote}/${nom} : marge ${marge}`);
    }
  }
});

test('terrain — trois dessins sur cinq sont des miroirs, et les deux autres n\'en sont pas', () => {
  // ⚠⚠ LES DEUX MOITIÉS COMPTENT AUTANT L'UNE QUE L'AUTRE. `champ_quartz`,
  // `champ_scorie` et `obs_infanterie` n'ont qu'une planche saine : leur variante
  // `b` est le miroir horizontal EXACT de `a`, comme dans l'art commité avant ce
  // lot. `obs_les_deux` et `obs_vehicule` ont deux planches et deux vrais
  // dessins — si l'un d'eux devenait un miroir, c'est qu'une planche aurait été
  // perdue de la table de `tools/terrain.py` sans que personne le voie : le
  // sprite existerait, l'atlas se coudrait, l'écran dessinerait.
  const miroirExact = (nom) => {
    const a = decoderRgba(join(TERRAIN_128, `${nom}_a.png`));
    const b = decoderRgba(join(TERRAIN_128, `${nom}_b.png`));
    for (let y = 0; y < a.hauteur; y += 1) {
      for (let x = 0; x < a.largeur; x += 1) {
        const ia = (y * a.largeur + x) * 4;
        const ib = (y * a.largeur + (a.largeur - 1 - x)) * 4;
        for (let c = 0; c < 4; c += 1) if (a.pixels[ia + c] !== b.pixels[ib + c]) return false;
      }
    }
    return true;
  };
  for (const nom of ['champ_quartz', 'champ_scorie', 'obs_infanterie']) {
    assert.ok(miroirExact(nom), `${nom}_b n'est plus le miroir exact de ${nom}_a`);
  }
  for (const nom of ['obs_les_deux', 'obs_vehicule']) {
    assert.ok(!miroirExact(nom),
      `${nom}_b est devenu le miroir de ${nom}_a : sa seconde planche a disparu de la table`);
  }
});

test('terrain — le détourage ne laisse pas un pixel de clé, et la grille 32 est soldée', () => {
  // ⚠⚠ LA CLÉ DE CES PLANCHES EST BRUITÉE, ET C'EST CE QUI REND CETTE GARDE
  // NÉCESSAIRE. Mesuré sur les sept planches : **zéro pixel `#FF00FF` pur** —
  // le fond va de (194, 16, 138) à (236, 11, 143) et s'assombrit jusqu'à
  // (168, 23, 113) sous une branche. `tools/terrain.py` le rabat sur le magenta
  // pur avant la chaîne ; si ce geste disparaissait, les pixels rabattus
  // resteraient OPAQUES et le sprite ressortirait semé de rose.
  //
  // ⚠⚠ LE SEUIL EST L'ALPHA, PAS LE COMPTE, ET LA PREMIÈRE ÉCRITURE DE CETTE
  // GARDE ÉTAIT FAUSSE. Elle exigeait zéro pixel de clé à quelque alpha que ce
  // soit, et elle est tombée sur dix-huit pixels de `champ_quartz_a` — qui
  // n'ont RIEN à voir avec le détourage : `ecrire` dé-prémultiplie en divisant
  // par l'alpha, si bien qu'un pixel de frange à alpha 9 voit son arrondi
  // amplifié jusqu'à retomber sur `#FF00FF`. Ce n'est pas propre à cette
  // famille : mesuré sur tout `art/sprites/`, `defense` en porte 246, `unite`
  // 58, `socle` 41 — **et ZÉRO, dans tout le dépôt, à alpha ≥ 128.** C'est
  // cette borne-là qui est vraie, et c'est elle que le défaut franchirait : un
  // détourage qui manque sa clé la laisse à alpha 255, pas à 9. Le pire de la
  // famille `terrain` est à **51**.
  for (const [dossier, cote] of [[TERRAIN_128, 128], [TERRAIN_64, 64]]) {
    for (const nom of DESSINS_TERRAIN) {
      const im = decoderRgba(join(dossier, `${nom}.png`));
      let cle = 0;
      for (let i = 0; i < im.pixels.length; i += 4) {
        if (im.pixels[i + 3] < 128) continue;
        if (im.pixels[i] === 255 && im.pixels[i + 1] === 0 && im.pixels[i + 2] === 255) cle += 1;
      }
      assert.equal(cle, 0, `terrain/${cote}/${nom} porte ${cle} pixels de clé magenta opaques`);
    }
  }

  // ⚠⚠ ET LA GRILLE 32 NE PORTE PLUS QUE LES DALLES. Le lot PIXELS a sorti la 32
  // de `GRILLES` partout ; `terrain/32` avait survécu au seul motif que ses
  // tuiles étaient irrécupérables. Ce motif vient de cesser d'être vrai pour dix
  // d'entre elles, donc elles sont retirées — un fichier qu'aucun outil ne
  // produit et qu'aucun écran ne lit est ce que `tools/verifier.py` appelle un
  // MANQUANT. Les huit dalles restent, et restent déclarées.
  const restants = readdirSync(join(SPRITES, 'terrain', '32')).filter((f) => f.endsWith('.png'));
  assert.deepEqual(restants.sort(), DALLES_TERRAIN.map((n) => `${n}.png`).sort());
});
