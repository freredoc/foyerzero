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
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ATLAS, COTE_SPRITE } from '../src/data/atlas.js';
import { celluleDuSprite, existeDansAtlas, fondDuSprite } from '../src/render/sprite.js';
import { variante, suffixeDeVariante, SEL_VARIANTE } from '../src/render/variante.js';
import { couchesDeLaDefense, spriteDuBatiment } from '../src/ui/chantier.js';
import { BASE_BATIMENTS } from '../src/data/base.js';
import { creerEtat, poserEffectif, problemesDeLaPoseDEffectif } from '../src/sim/state.js';
import { DEFENSES, GRILLE } from '../src/data/combat.js';
import { tirer } from '../src/sim/rng.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPRITES = join(RACINE, 'art', 'sprites');

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
const DOSSIER_EXCEPTION = { batiment: 'bâtiment' };
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

test('sprite — l\'index dit exactement ce que le disque porte', () => {
  // Recalculé en JS depuis le dossier réel, avec le même tri que l'outil :
  // `sorted` sur le nom de fichier, en points de code. `localeCompare` rangerait
  // autrement selon la machine, et l'index cesserait d'être reproductible.
  assert.ok(Object.keys(ATLAS).length >= 2, 'moins de deux familles cousues');

  for (const [slug, table] of Object.entries(ATLAS)) {
    const dossier = dossierDeLaFamille(slug);
    assert.ok(existsSync(join(SPRITES, dossier, String(COTE_SPRITE))),
      `famille « ${slug} » : le dossier source ${dossier}/${COTE_SPRITE} est introuvable`);
    const attendus = readdirSync(join(SPRITES, dossier, String(COTE_SPRITE)))
      .filter((n) => n.endsWith('.png'))
      .map((n) => n.slice(0, -4))
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
    const { largeur, hauteur } = tailleDuPng(join(SPRITES, `atlas-${slug}-${COTE_SPRITE}.png`));
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

/**
 * Les pixels d'un PNG 8 bits RVBA non entrelacé — le seul format que
 * `tools/atlas.py` produise, et celui de tous les sprites conditionnés.
 *
 * Il LÈVE sur tout ce qu'il ne sait pas faire plutôt que de rendre une image
 * approchée : un atlas mal décodé ferait tomber la garde suivante sur un défaut
 * qui n'existe pas. Même discipline que le décodeur de `terrain.test.js`, qui
 * lit les PNG INDEXÉS de la carte du monde — les deux formats ne se recouvrent
 * pas, d'où deux lecteurs et non un lecteur à tout faire.
 */
function decoderRgba(chemin) {
  const octets = readFileSync(chemin);
  assert.equal(octets.readUInt32BE(0), 0x89504e47, `${chemin} n'est pas un PNG`);
  let position = 8;
  let largeur = 0;
  let hauteur = 0;
  const morceaux = [];
  while (position < octets.length) {
    const taille = octets.readUInt32BE(position);
    const nom = octets.toString('ascii', position + 4, position + 8);
    const corps = octets.subarray(position + 8, position + 8 + taille);
    if (nom === 'IHDR') {
      largeur = corps.readUInt32BE(0);
      hauteur = corps.readUInt32BE(4);
      assert.equal(corps[8], 8, `${chemin} : profondeur de bits inattendue`);
      assert.equal(corps[9], 6, `${chemin} : ce n'est plus du RVBA`);
      assert.equal(corps[12], 0, `${chemin} : entrelacement non géré`);
    } else if (nom === 'IDAT') morceaux.push(Buffer.from(corps));
    else if (nom === 'IEND') break;
    position += 12 + taille;
  }
  const brut = inflateSync(Buffer.concat(morceaux));
  const bpp = 4;
  const pas = largeur * bpp;
  const pixels = Buffer.alloc(hauteur * pas);
  for (let y = 0; y < hauteur; y++) {
    const filtre = brut[y * (pas + 1)];
    const ligne = brut.subarray(y * (pas + 1) + 1, y * (pas + 1) + 1 + pas);
    for (let x = 0; x < pas; x++) {
      const a = x >= bpp ? pixels[y * pas + x - bpp] : 0;
      const b = y > 0 ? pixels[(y - 1) * pas + x] : 0;
      const c = x >= bpp && y > 0 ? pixels[(y - 1) * pas + x - bpp] : 0;
      let v = ligne[x];
      if (filtre === 1) v += a;
      else if (filtre === 2) v += b;
      else if (filtre === 3) v += (a + b) >> 1;
      else if (filtre === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else assert.equal(filtre, 0, `${chemin} : filtre ${filtre} inconnu`);
      pixels[y * pas + x] = v & 0xff;
    }
  }
  return { largeur, hauteur, pixels };
}

test('sprite — l\'atlas cousu porte les pixels des sprites d\'aujourd\'hui', () => {
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
  // ⚠ ET AUCUNE DES GARDES EXISTANTES NE POUVAIT LE VOIR. `src/data/atlas.js` ne
  // porte que des NOMS, et ce lot n'en renomme aucun : l'index restait exact,
  // la géométrie restait exacte, les onze bâtiments se résolvaient toujours.
  // Seuls les PIXELS avaient divergé. C'est pour ça que celle-ci les compare.
  for (const [slug, table] of Object.entries(ATLAS)) {
    const dossier = dossierDeLaFamille(slug);
    const atlas = decoderRgba(join(SPRITES, `atlas-${slug}-${COTE_SPRITE}.png`));

    let comparees = 0;
    for (const [rang, nom] of table.noms.entries()) {
      const source = decoderRgba(join(SPRITES, dossier, String(COTE_SPRITE), `${nom}.png`));
      assert.equal(source.largeur, COTE_SPRITE, `${nom} n'est pas au format de la grille`);
      const { colonne, rangee } = celluleDuSprite(slug, nom);

      for (let y = 0; y < COTE_SPRITE; y++) {
        const debutAtlas = ((rangee * COTE_SPRITE + y) * atlas.largeur + colonne * COTE_SPRITE) * 4;
        const ligneAtlas = atlas.pixels.subarray(debutAtlas, debutAtlas + COTE_SPRITE * 4);
        const ligneSource = source.pixels.subarray(y * COTE_SPRITE * 4, (y + 1) * COTE_SPRITE * 4);
        assert.ok(ligneAtlas.equals(ligneSource),
          `atlas-${slug} : la cellule (${colonne}, ${rangee}) ne porte plus les pixels de `
          + `« ${nom} », ligne ${y} — relancer « python3 tools/atlas.py --ecrire »`);
      }
      comparees += 1;
    }
    assert.equal(comparees, table.noms.length, `${slug} : toutes les cellules n'ont pas été comparées`);
  }

  // ⚠ FALSIFIABLE : le décodeur rend bien des pixels, et deux sprites DIFFÉRENTS
  // se distinguent. Sans ça, un décodeur qui rendrait partout du vide ferait
  // passer la boucle ci-dessus sur n'importe quel atlas.
  const a = decoderRgba(join(SPRITES, 'bâtiment', '64', 'bat_j_collecteur.png'));
  const b = decoderRgba(join(SPRITES, 'bâtiment', '64', 'bat_j_chantier_de_construction.png'));
  assert.ok(a.pixels.some((v) => v !== 0), 'le décodeur rend une image vide');
  assert.ok(!a.pixels.equals(b.pixels), 'le décodeur ne distingue pas deux sprites');
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
  assert.equal(etat.garnison.length, Object.keys(DEFENSES).length,
    'le montage ne porte pas les neuf défenses');

  let couchesVues = 0;
  for (const piece of etat.garnison) {
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
  const barrieres = etat.garnison.filter((p) => DEFENSES[p.id].type === 'barriere');
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
  const tourelle = etat.garnison.find((p) => DEFENSES[p.id].type === 'tourelle');
  assert.ok(tourelle !== undefined, 'le montage ne porte aucune tourelle');
  const couchesTourelle = couchesDeLaDefense(tourelle, etat);
  assert.equal(couchesTourelle.length, 2, 'une tourelle doit porter sa couche et son socle');
  assert.equal(couchesTourelle[1].famille, 'socle', 'le socle doit être la couche BASSE');
  assert.match(couchesTourelle[0].nom, /_(n|s|e|o)[a-z]*$/,
    'la tourelle ne porte plus de suffixe d\'orientation');
});
