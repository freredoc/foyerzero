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
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ATLAS, COTE_SPRITE } from '../src/data/atlas.js';
import { celluleDuSprite, fondDuSprite } from '../src/render/sprite.js';
import { variante, suffixeDeVariante, SEL_VARIANTE } from '../src/render/variante.js';
import { spriteDuBatiment } from '../src/ui/chantier.js';
import { BASE_BATIMENTS } from '../src/data/base.js';
import { creerEtat } from '../src/sim/state.js';
import { tirer } from '../src/sim/rng.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPRITES = join(RACINE, 'art', 'sprites');

/** Le dossier source d'une famille cousue — le slug ASCII n'est pas le dossier. */
const DOSSIER_DE_LA_FAMILLE = { batiment: 'bâtiment', terrain: 'terrain' };

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
    const dossier = DOSSIER_DE_LA_FAMILLE[slug];
    assert.ok(dossier !== undefined, `famille « ${slug} » sans dossier source connu`);
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
