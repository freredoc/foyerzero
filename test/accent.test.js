// L'accent DESSINÉ confronté à la table de dégâts — lot ACCENT-CONFRONTÉ.
//
// ⚠⚠ POURQUOI CE FICHIER EXISTE. Le lot UNITÉS-AU-COMBAT a remplacé le casque
// procédural — un rectangle à la teinte de la colonne de dégâts dominante — par
// un sprite. Son rapport a posé la question comme une PERTE d'information ;
// mesuré, c'en est une autre : les sprites PORTENT leur accent, dans les teintes
// exactes de la palette, et `accentDe` retombe dessus quatorze fois sur
// quatorze pour les unités entières du joueur. Ce qui a été perdu, ce n'est pas
// l'information — c'est la GARANTIE qu'elle y soit.
//
// C'est un croisement art ↔ table, la classe de défaut qui a mordu cinq fois
// pendant la session des sprites : deux choses justes séparément, fausses
// ensemble. Aucun test ne le faisait.
//
// ⚠⚠ ET IL MESURE CE QUI EST AFFICHÉ, PAS CE QUI PORTE LE NOM DE L'UNITÉ. Un
// blindé du JOUEUR est composé de deux sprites depuis le lot précédent — sa
// coque et sa tourelle — et son sprite `unite/` n'est plus dessiné au combat.
// C'est là que se cachent deux des quatre dettes : `off_j_broyeur` entier est
// JUSTE, son composé ne l'est pas.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { decoderRgba } from './png-rgba.js';
import { PALETTE, accentDe, classeDe } from '../src/render/scene.js';
import { UNITES } from '../src/data/combat.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPRITES = join(RACINE, 'art', 'sprites');
const GRILLE = 64; // la seule grille cousue dans un atlas, donc la seule affichée

/**
 * Les six teintes d'accent, LUES DANS `PALETTE`, jamais recopiées.
 *
 * ⚠ C'EST LA MOITIÉ QUI REND CE TEST HONNÊTE. Une table écrite en dur ici
 * resterait verte si quelqu'un changeait une teinte d'accent dans la fiche de
 * style : le dessin et la table diraient alors deux choses différentes, et le
 * garde-fou censé les confronter regarderait un troisième jeu de valeurs.
 */
function teintesDAccent() {
  const table = new Map();
  for (const [colonne, t] of Object.entries(PALETTE.accents)) {
    table.set(t.sombre.toUpperCase(), colonne);
    table.set(t.clair.toUpperCase(), colonne);
  }
  return table;
}

const hex = (r, g, b) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0').toUpperCase()).join('')}`;
const octets = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/**
 * Les quatorze teintes de la rampe du joueur, dans l'ordre où la chaîne les
 * range : cinq kaki, trois métal, puis les six accents.
 *
 * ⚠ L'ORDRE N'EST PAS DÉCORATIF — c'est celui de `BASE` dans
 * `tools/final128.py`, et les portes ci-dessous s'appliquent PAR FAMILLE de
 * teinte, pas par rang. Ce qui compte ici, c'est que les quatorze soient
 * toutes présentes : une classification au plus proche sur les six accents
 * SEULS ferait tomber tout le kaki sur un accent.
 */
function rampeDuJoueur() {
  const rampe = [];
  for (const cle of ['contour', 'kakiOmbre', 'kakiCorps', 'kakiEclaire', 'kakiLumiere',
    'metalSombre', 'metalMoyen', 'metalClair']) {
    rampe.push({ rgb: octets(PALETTE[cle]), famille: 'corps', colonne: null });
  }
  for (const [colonne, t] of Object.entries(PALETTE.accents)) {
    const famille = { infanterie: 'blanc', vehicule: 'rouge', structureOuAviation: 'jaune' }[colonne];
    rampe.push({ rgb: octets(t.sombre), famille, colonne });
    rampe.push({ rgb: octets(t.clair), famille, colonne });
  }
  return rampe;
}

/**
 * Les poids et les portes de la quantification, LUS DANS LE FICHIER GÉNÉRÉ.
 *
 * ⚠⚠ ILS NE SE RETAPENT PAS ICI, ET C'EST UNE EXIGENCE D'ETHAN, 02/09. Les
 * nombres vivent dans `tools/portes.py`, `tools/final128.quant` les emploie, et
 * `tools/atlas.py` les écrit dans `art/sprites/atlas-empreintes.json`. Ce
 * fichier-ci ne porte que la FORME des trois conditions. Deux tables de
 * seuils, l'une en Python l'autre en JS, dériveraient au premier réglage — et
 * la dérive serait muette, le test continuant de passer sur son propre barème.
 */
function quantification() {
  const chemin = join(SPRITES, 'atlas-empreintes.json');
  assert.ok(existsSync(chemin),
    'art/sprites/atlas-empreintes.json est absent — relancer « python3 tools/atlas.py --ecrire »');
  const q = JSON.parse(readFileSync(chemin, 'utf8')).quantification;
  assert.equal(q.poids.length, 3, 'les poids de la distance ne sont plus trois');
  for (const porte of ['jaune', 'rouge', 'blanc']) {
    assert.ok(q.portes[porte] !== undefined, `la porte « ${porte} » a disparu du fichier généré`);
  }
  return q;
}

/**
 * La teinte de palette la plus proche d'un pixel, sous les trois portes.
 *
 * ⚠⚠ POURQUOI CE N'EST PLUS UNE ÉGALITÉ EXACTE. Jusqu'au lot PIXELS la chaîne
 * QUANTIFIAIT sur ces quatorze teintes : un pixel d'accent l'était au bit près,
 * et ce test comptait des égalités. Elle réduit maintenant la source par
 * FILTRE, et il ne reste plus une seule teinte exacte — mesuré sur
 * `off_j_pilon_s`, **161 pixels de véhicule la veille, ZÉRO le lendemain**.
 *
 * ⚠ TROIS AUTRES FORMULATIONS ONT ÉTÉ MESURÉES ET ÉCARTÉES, pour qu'on ne les
 * repose pas. Sur les 48 combinaisons hors dettes :
 *   • égalité exacte, tolérance 30 — 42 px reconnus sur 546 la veille ;
 *   • le plus proche parmi les SIX accents seuls, sous tolérance — **40/48 au
 *     mieux**, balayé de 10 à 100 dans les deux métriques ;
 *   • le plus proche parmi les quatorze SANS les portes — **46/48**, le
 *     `busard` bascule sur structure (140 px contre 115), ce qui obligerait à
 *     déclarer une dette que l'art ne mérite pas.
 * Celle-ci rend **48/48**.
 */
function accentDuPixel(r, g, b, rampe, q) {
  const [pr, pg, pb] = q.poids;
  const mx = Math.max(r, g, b, 1);
  const mn = Math.min(r, g, b);
  const J = q.portes.jaune;
  const R = q.portes.rouge;
  const B = q.portes.blanc;
  const ouvertes = {
    corps: true,
    jaune: b / mx < J.bleuSurMax && g / mx > J.vertSurMax,
    rouge: g / mx < R.vertSurMax && b / mx < R.bleuSurMax && r >= R.rougeMin,
    blanc: (mx - mn) / mx < B.ecartSurMax && mx >= B.maxMin,
  };
  let meilleur = null;
  let distance = Infinity;
  for (const t of rampe) {
    if (!ouvertes[t.famille]) continue;
    const d = pr * (r - t.rgb[0]) ** 2 + pg * (g - t.rgb[1]) ** 2 + pb * (b - t.rgb[2]) ** 2;
    if (d < distance) { distance = d; meilleur = t.colonne; }
  }
  return meilleur;
}

/**
 * Compte les pixels d'accent d'une pile de sprites.
 *
 * Chaque pixel opaque est apparié à la teinte la plus PROCHE de la rampe, sous
 * les portes : c'est le même geste que `tools/final128.quant`, avec les mêmes
 * nombres, donc ce que la chaîne aurait vu.
 */
function comptesDAccent(chemins) {
  const rampe = rampeDuJoueur();
  const q = quantification();
  const c = { infanterie: 0, vehicule: 0, structureOuAviation: 0, opaques: 0 };
  for (const chemin of chemins) {
    const { largeur, hauteur, pixels } = decoderRgba(chemin);
    for (let i = 0; i < largeur * hauteur; i += 1) {
      const o = i * 4;
      if (pixels[o + 3] < 128) continue;
      c.opaques += 1;
      const colonne = accentDuPixel(pixels[o], pixels[o + 1], pixels[o + 2], rampe, q);
      if (colonne !== null) c[colonne] += 1;
    }
  }
  return c;
}

/** La colonne la plus représentée, ou `null` si le sprite n'a aucun accent. */
function dominant(c) {
  let d = null;
  for (const colonne of Object.keys(PALETTE.accents)) {
    if (c[colonne] > 0 && (d === null || c[colonne] > c[d])) d = colonne;
  }
  return d;
}

const fichier = (famille, nom) => join(SPRITES, famille, String(GRILLE), `${nom}.png`);

/**
 * Les fichiers RÉELLEMENT dessinés pour une unité, camp et force donnés.
 *
 * Il reproduit `couchesDeLUnite` de `render/scene.js` sur le disque — et c'est
 * volontairement une SECONDE lecture : si les deux divergeaient, ce test
 * mesurerait autre chose que ce que le joueur voit, et il faudrait le savoir.
 * `test/sprite.test.js` asserte par ailleurs que les noms rendus par le module
 * existent bien dans l'atlas ; les deux se recoupent sans se remplacer.
 */
function fichiersAffiches(id, lettre, force) {
  const pose = (base, famille) => {
    const defensif = `${base}_def`;
    return force === 'garnison' && existsSync(fichier(famille, defensif)) ? defensif : base;
  };
  // ⚠⚠ LE `&& lettre === 'j'` EST PARTI AU LOT OUVRAGE-CÂBLAGE, ET C'ÉTAIT LA
  // MÊME SECONDE VÉRITÉ QUE CELLE QUE `scene.js` A PERDUE LE MÊME JOUR. Ce
  // fichier-ci doit refléter ce que le RENDU compose : depuis que l'Ouvrage a
  // ses neuf coques et ses cinq tourelles, un blindé émet deux couches dans les
  // deux camps. Laisser la lettre ici aurait fait chercher `off_o_belier`, qui
  // n'existe plus, donc écarté DIX combinaisons en silence — et un accent qu'on
  // ne mesure plus est un accent qu'on ne garde plus.
  if (classeDe('unite', id) === 'blinde') {
    return [
      fichier('chassis', pose(`off_${lettre}_${id}_chassis`, 'chassis')),
      fichier('tourelle-unite', `off_${lettre}_${id}_tourelle`),
    ];
  }
  return [fichier('unite', pose(`off_${lettre}_${id}`, 'unite'))];
}

/**
 * ⚠⚠ LES QUATRE DETTES D'ART, MESURÉES LE 05/09 SUR LA v2 DES SPRITES DU JOUEUR.
 *
 * Elles entrent au dépôt comme EXCEPTIONS NOMMÉES pour que le garde-fou puisse
 * rester posé sans rendre `main` rouge — et chacune porte sa raison. Ce lot NE
 * CORRIGE PAS L'ART : le brief l'écrit en toutes lettres, « si une pièce paraît
 * fausse, le dire au rapport ; ne pas la corriger ». Recolorier un sprite est
 * une décision de production, et elle appartient à Ethan.
 *
 * ⚠⚠ CHAQUE DETTE EST ASSERTÉE ENCORE VIOLÉE, ET C'EST CE QUI REND LA TABLE
 * HONNÊTE. Le jour où l'art est corrigé, le test tombe et quelqu'un retire la
 * ligne. Sans cette moitié-là, une liste d'exceptions pourrit en silence — même
 * mécanique que les `ÉCART` permanents de `tools/planches.py`, qui sont voulus
 * ET vérifiés. C'est exactement ce qui vient de se passer, dans les deux sens.
 *
 * ⚠⚠ LES DEUX DETTES DE LA V1 SE SONT REFERMÉES, ET LES QUATRE NEUVES SONT
 * D'AUTRES SUJETS. `broyeur j` et `pilon j` étaient déclarés en défaut depuis le
 * 30/08 — le composé coque + tourelle contredisait le sprite entier ; mesuré sur
 * la v2, les deux rendent EXACTEMENT ce que la table dit (broyeur : 35 pixels de
 * véhicule et zéro ailleurs ; pilon : 243 de structure contre 2 et 1). Les
 * quatre qui entrent n'ont rien à voir avec elles : ce sont des ESCOUADES et des
 * AÉRONEFS, que ce lot redessine, pas des blindés composés.
 *
 * ⚠ LA CLÉ EST (unité, camp), PAS (unité, camp, force) — inchangé. Les quatre
 * sujets violent dans LEURS DEUX poses, soit huit combinaisons couvertes.
 */
const DETTES_ACCENT = [
  {
    unite: 'meute',
    camp: 'j',
    attendu: 'infanterie',
    mesure: 'structureOuAviation',
    raison: 'la pose d\'attaque n\'a AUCUN pixel d\'infanterie sur 272 opaques, et 25 de '
      + 'structure ; la pose de défense en a 6 contre 59. Les Fusiliers sont la '
      + 'première ligne du joueur, et leur accent dit qu\'ils visent des bâtiments.',
  },
  {
    unite: 'guetteur',
    camp: 'j',
    attendu: 'infanterie',
    mesure: 'structureOuAviation',
    raison: 'même écart que la Meute, et plus net — 6 pixels d\'infanterie contre 127 de '
      + 'structure en attaque, 8 contre 128 en défense. Les deux escouades légères '
      + 'du joueur portent la même teinte, ce qui suggère un choix de dessin et non '
      + 'un accident sur une pièce.',
  },
  {
    unite: 'carapace',
    camp: 'j',
    attendu: 'vehicule',
    mesure: 'structureOuAviation',
    raison: 'le véhicule EST présent — 76 pixels en attaque, 62 en défense — mais la '
      + 'structure domine, 118 et 157. C\'est la dette la plus proche de se '
      + 'refermer : quelques pixels d\'ambre de plus la renverseraient.',
  },
  {
    unite: 'frappeur',
    camp: 'j',
    attendu: 'structureOuAviation',
    mesure: 'infanterie',
    raison: 'les deux colonnes sont presque à égalité — 66 pixels d\'infanterie contre '
      + '63 de structure, dans les deux poses, qui partagent le même fichier. Trois '
      + 'pixels séparent le verdict de la table : c\'est la dette la plus fragile '
      + 'des quatre, et elle basculera au premier retouchage.',
  },
];

const estUneDette = (id, lettre) => DETTES_ACCENT.some((d) => d.unite === id && d.camp === lettre);

/**
 * ⚠⚠ L'ACCENT DE L'OUVRAGE, MESURÉ SUR SA v2 — ET C'EST UN FAIT, PAS NEUF DETTES.
 *
 * Ethan a livré les quarante-deux sources de l'Ouvrage le 07/09. Confronté à la
 * table de dégâts, ce camp diverge sur DIX-NEUF combinaisons sur vingt-huit — et
 * les dix-neuf divergent dans le même sens : c'est l'accent `infanterie` qui
 * l'emporte. Sur les vingt-huit, **vingt-sept sont dominées par le rouge**, et
 * la seule qui ne l'est pas est la Carapace en ATTAQUE — véhicule 98 contre 88.
 * En garnison la même pièce bascule, 94 contre 95 : **un pixel**.
 *
 * Ce n'est donc pas neuf accidents de dessin, c'est UNE propriété de la palette
 * du camp, et l'inscrire comme neuf lignes de `DETTES_ACCENT` l'aurait déguisée
 * en série de petits défauts tout en retirant neuf unités de la mesure — la
 * moitié du camp cesserait d'être gardée.
 *
 * ⚠⚠ LA TABLE CI-DESSOUS GARDE DONC LE CAMP ENTIER, ET ELLE EST PLUS SERRÉE
 * QU'UNE LISTE D'EXCEPTIONS. Aucune unité n'est écartée : chacune est confrontée
 * à ce qu'elle DESSINE aujourd'hui, si bien qu'un retouchage d'art la fait
 * rougir dans les deux sens — celui qui casse comme celui qui répare. Et la
 * divergence avec la table de dégâts est COMPTÉE, pas seulement tolérée.
 *
 * ⚠ CE LOT NE CORRIGE PAS L'ART, et c'est la consigne du brief : « si une pièce
 * paraît fausse, le dire au rapport ; ne pas la corriger ». Recolorier
 * treize sprites est une décision de production, et elle appartient à Ethan.
 */
const ACCENT_OUVRAGE_MESURE = {
  // unité + pose                dominante   compte, et ce que la table de dégâts dit
  'meute armee': 'infanterie', //           253 — d'accord
  'meute garnison': 'infanterie', //        273 — d'accord
  'guetteur armee': 'infanterie', //        234 — d'accord
  'guetteur garnison': 'infanterie', //     277 — d'accord
  'perceurs armee': 'infanterie', //         62 contre 12 de structure — table : structure
  'perceurs garnison': 'infanterie', //      76 contre 27 — table : structure
  'fouisseurs armee': 'infanterie', //      124 contre 9 — table : structure
  'fouisseurs garnison': 'infanterie', //   124 contre 9 — table : structure
  // ⚠⚠ UN PIXEL SÉPARE LES DEUX POSES DE LA CARAPACE, ET C'EST POUR ÇA QUE CETTE
  // TABLE PORTE LA POSE ET PAS SEULEMENT L'UNITÉ. En attaque le véhicule
  // l'emporte 98 contre 88 ; en garnison il PERD, 94 contre 95. Une table
  // indexée par unité aurait dû trancher entre les deux et aurait menti sur
  // l'autre.
  'carapace armee': 'vehicule', //           98 contre 88 — d'accord, la SEULE
  'carapace garnison': 'infanterie', //      95 contre 94 — table : véhicule, à UN pixel
  'ratisseur armee': 'infanterie', //       717 — d'accord
  'ratisseur garnison': 'infanterie', //    735 — d'accord
  'fendeur armee': 'infanterie', //         348 contre 142 de véhicule — table : véhicule
  'fendeur garnison': 'infanterie', //      377 contre 138 — table : véhicule
  'broyeur armee': 'infanterie', //         790 contre 369 — table : véhicule
  'broyeur garnison': 'infanterie', //      825 contre 372 — table : véhicule
  'belier armee': 'infanterie', //          694 contre 327 de structure — table : structure
  'belier garnison': 'infanterie', //       683 contre 331 — table : structure
  'pilon armee': 'infanterie', //           675 contre 326 — table : structure
  'pilon garnison': 'infanterie', //        675 contre 326 — table : structure
  'crecelle armee': 'infanterie', //        261 — d'accord
  'crecelle garnison': 'infanterie', //     261 — d'accord
  'busard armee': 'infanterie', //          272 contre 27 de véhicule — table : véhicule
  'busard garnison': 'infanterie', //       272 contre 27 — table : véhicule
  'frappeur armee': 'infanterie', //        167 contre 44 de structure — table : structure
  'frappeur garnison': 'infanterie', //     167 contre 44 — table : structure
  'enclume armee': 'infanterie', //         287 contre 91 — table : structure
  'enclume garnison': 'infanterie', //      287 contre 91 — table : structure
};

/** Toutes les combinaisons (unité, camp, force) dont les fichiers existent. */
function combinaisonsAffichees() {
  const sortie = [];
  for (const id of Object.keys(UNITES)) {
    for (const lettre of ['j', 'o']) {
      for (const force of ['armee', 'garnison']) {
        const chemins = fichiersAffiches(id, lettre, force);
        if (chemins.every(existsSync)) sortie.push({ id, lettre, force, chemins });
      }
    }
  }
  return sortie;
}

test('accent — le décodeur rend les comptes attendus sur un sprite connu', () => {
  // ⚠ D'ABORD : LE DÉCODAGE REND-IL DES PIXELS ? Un décodeur cassé qui rendrait
  // zéro pixel opaque ferait passer TOUTES les assertions de ce fichier, la
  // dominante valant alors `null` partout.
  // ⚠⚠ LE TÉMOIN CHANGE DE FICHIER ET DE VERDICT AU LOT SPRITES-V2-JOUEUR, ET
  // LES DEUX SE DÉCLARENT. `off_j_pilon_s` était l'une des seize orientations de
  // la tourelle de l'Obusier ; il n'y en a plus qu'une, `off_j_pilon_tourelle`,
  // et elle est REDESSINÉE. Le nombre ne se recopie donc pas d'un lot à l'autre :
  // 179 pixels de VÉHICULE hier, 200 de STRUCTURE aujourd'hui sur 2 584 opaques.
  // Ce que le témoin garde est inchangé — que le décodeur lit vraiment des
  // pixels, sans quoi toutes les assertions de ce fichier passeraient sur une
  // dominante nulle.
  const c = comptesDAccent([fichier('tourelle-unite', 'off_j_pilon_tourelle')]);
  assert.ok(c.opaques > 500, `${c.opaques} pixels opaques : le décodeur ne lit rien`);
  assert.equal(c.structureOuAviation, 200,
    'off_j_pilon_tourelle doit porter 200 pixels de structure à la grille 64');
  assert.equal(dominant(c), 'structureOuAviation');

  // Et les six teintes viennent bien de `PALETTE`, pas d'une copie : six clés,
  // trois colonnes, et chacune se retrouve dans la table de la fiche.
  const teintes = teintesDAccent();
  assert.equal(teintes.size, 6, 'les trois colonnes doivent donner six teintes distinctes');
  for (const [colonne, t] of Object.entries(PALETTE.accents)) {
    assert.equal(teintes.get(t.sombre.toUpperCase()), colonne);
    assert.equal(teintes.get(t.clair.toUpperCase()), colonne);
  }
});

test('accent — l\'accent dessiné est celui de la table, hors dettes', () => {
  const combinaisons = combinaisonsAffichees();
  assert.ok(combinaisons.length >= 40,
    `${combinaisons.length} combinaisons : le balayage n'a pas trouvé les sprites`);

  // ⚠⚠ LA BOUCLE NE PORTE PLUS QUE LE JOUEUR AU LOT OUVRAGE-CÂBLAGE, ET LE CAMP
  // DE L'OUVRAGE EST GARDÉ JUSTE EN DESSOUS, PIÈCE PAR PIÈCE. Sa v2 diverge de
  // la table de dégâts sur neuf unités sur quatorze, toutes dans le même sens ;
  // les inscrire en dettes aurait retiré neuf unités de toute mesure. Elles sont
  // au contraire confrontées à leur dominante MESURÉE, ce qui garde les
  // quatorze au lieu de cinq — voir `ACCENT_OUVRAGE_MESURE`.
  const violations = [];
  let mesurees = 0;
  for (const { id, lettre, force, chemins } of combinaisons) {
    if (lettre !== 'j' || estUneDette(id, lettre)) continue;
    const attendu = accentDe('unite', id).colonne;
    const rendu = dominant(comptesDAccent(chemins));
    mesurees += 1;
    if (rendu !== attendu) violations.push(`${id} ${lettre} ${force} : ${attendu} attendu, ${rendu} dessiné`);
  }

  // ⚠ SANS CETTE LIGNE, UNE TABLE DE DETTES QUI COUVRIRAIT TOUT PASSERAIT.
  // ⚠⚠ IL VAUT 20, ET CE N'EST PAS UNE BORNE DE 42 QU'ON BAISSE : c'est le même
  // compte sur un ENSEMBLE PLUS PETIT. Le joueur porte 14 unités × 2 forces =
  // 28 combinaisons, moins les quatre dettes du 05/09 qui en écartent huit,
  // donc **20 mesurées sur 28** — la même proportion qu'avant, 71 %. Les
  // 28 combinaisons de l'Ouvrage ne disparaissent pas de la mesure : elles
  // changent de garde, et leur garde ne tolère AUCUNE exception.
  assert.ok(mesurees >= 20, `${mesurees} combinaisons du joueur hors dettes : les exceptions couvrent trop`);
  assert.deepEqual(violations, [],
    'l\'art et la table de dégâts divergent — corriger l\'art, ou ajouter la dette avec sa raison');
});

test('accent — l\'Ouvrage dessine ce que la table MESURÉE dit, et non ce que les dégâts disent', () => {
  // ⚠⚠ LE CAMP ENTIER EST GARDÉ, SANS UNE SEULE EXCEPTION, et c'est ce qui
  // distingue cette table d'une liste de dettes. Chaque unité est confrontée à
  // ce qu'elle dessine aujourd'hui : un retouchage la fait rougir dans les deux
  // sens, celui qui casse comme celui qui répare.
  const combinaisons = combinaisonsAffichees().filter((c) => c.lettre === 'o');
  assert.equal(combinaisons.length, 28,
    `${combinaisons.length} combinaisons de l'Ouvrage : quatorze unités × deux forces attendues`);

  assert.equal(Object.keys(ACCENT_OUVRAGE_MESURE).length, 28,
    'la table mesurée ne porte plus vingt-huit combinaisons');
  for (const { id, force, chemins } of combinaisons) {
    const cle = `${id} ${force}`;
    const attendu = ACCENT_OUVRAGE_MESURE[cle];
    assert.ok(attendu !== undefined, `${cle} : absent d'ACCENT_OUVRAGE_MESURE`);
    assert.equal(dominant(comptesDAccent(chemins)), attendu,
      `${cle} : l'art de l'Ouvrage a bougé — remesurer et réécrire la ligne`);
  }

  // ⚠⚠ ET LA DIVERGENCE AVEC LES DÉGÂTS EST COMPTÉE, PAS SEULEMENT TOLÉRÉE.
  // Dix-neuf sur vingt-huit, et c'est le nombre qui dira qu'Ethan a repris
  // l'art. Sans cette moitié-là, la table ci-dessus se contenterait de figer
  // l'état du jour sans jamais dire qu'il pose un problème.
  const divergentes = Object.keys(ACCENT_OUVRAGE_MESURE)
    .filter((cle) => ACCENT_OUVRAGE_MESURE[cle] !== accentDe('unite', cle.split(' ')[0]).colonne)
    .sort();
  assert.equal(divergentes.length, 19,
    `${divergentes.length} combinaisons divergentes, 19 mesurées — relire le lot`);
  assert.deepEqual(divergentes.filter((c) => c.startsWith('carapace')), ['carapace garnison'],
    'la Carapace ne diverge plus sur sa seule pose de garnison');

  // ⚠ ET LES DIX-NEUF DIVERGENT DANS LE MÊME SENS : c'est UNE propriété de la
  // palette du camp, pas dix-neuf accidents. Vingt-sept des vingt-huit sont
  // dominées par le rouge ; la seule qui ne l'est pas est la Carapace en
  // ATTAQUE, et sa pose de garnison bascule à UN pixel près.
  for (const cle of divergentes) {
    assert.equal(ACCENT_OUVRAGE_MESURE[cle], 'infanterie',
      `${cle} diverge autrement que par le rouge — le motif commun a cessé d'être vrai`);
  }
  const rouges = Object.values(ACCENT_OUVRAGE_MESURE).filter((c) => c === 'infanterie').length;
  assert.equal(rouges, 27, `${rouges} combinaisons de l'Ouvrage dominées par le rouge, 27 mesurées`);
});

test('accent — chaque dette déclarée est ENCORE violée', () => {
  // ⚠⚠ L'ASSERTION INVERSE. Le jour où l'art est corrigé, ce test tombe et
  // quelqu'un retire la ligne. Une liste d'exceptions sans cette moitié-là
  // pourrit en silence.
  assert.equal(DETTES_ACCENT.length, 4, 'la table des dettes a changé de taille');

  for (const dette of DETTES_ACCENT) {
    const attendu = accentDe('unite', dette.unite).colonne;
    assert.equal(attendu, dette.attendu,
      `${dette.unite} : la table de dégâts a changé, la dette est à remesurer`);
    assert.ok(dette.raison.length > 40, `${dette.unite} : une dette sans raison écrite`);

    // La dette vaut pour toutes les poses présentes de ce sujet.
    let posesVues = 0;
    for (const force of ['armee', 'garnison']) {
      const chemins = fichiersAffiches(dette.unite, dette.camp, force);
      if (!chemins.every(existsSync)) continue;
      posesVues += 1;
      const rendu = dominant(comptesDAccent(chemins));
      assert.equal(rendu, dette.mesure,
        `${dette.unite} ${dette.camp} ${force} : la dette n'est plus violée comme déclaré — `
        + 'si l\'art est corrigé, RETIRER la ligne de DETTES_ACCENT');
      assert.notEqual(rendu, attendu,
        `${dette.unite} ${dette.camp} ${force} : l'art est réparé, retirer la dette`);
    }
    assert.ok(posesVues > 0, `${dette.unite} : aucune pose trouvée sur le disque`);
  }
});

test('accent — un blindé du joueur porte UNE tourelle, et son verdict la comprend', () => {
  // ⚠⚠ CE TEST EST RÉÉCRIT, SON SUJET AYANT DISPARU — lot SPRITES-V2-JOUEUR. Il
  // exigeait que le verdict d'accent d'un blindé soit le MÊME sur les seize
  // orientations de sa tourelle : une propriété qui n'a plus d'objet, puisqu'il
  // n'y a plus qu'un dessin de tourelle et que le rendu le tourne. Le rendre
  // trivialement vrai en bouclant sur une liste d'un élément aurait été garder
  // la forme du test en perdant ce qu'il mesure.
  //
  // Ce qui le remplace mesure la propriété du modèle NEUF, et elle n'allait pas
  // de soi : la tourelle est un fichier À PART, donc le verdict d'un blindé doit
  // le compter — un compteur qui ne lirait que la coque changerait de verdict
  // sur au moins un blindé, et la légende mentirait sur ce qu'il peut tuer.
  const blindes = Object.keys(UNITES).filter((id) => classeDe('unite', id) === 'blinde');
  assert.ok(blindes.length > 0, 'aucun blindé au roster : le test ne mesure rien');

  let comptent = 0;
  for (const id of blindes) {
    const deux = fichiersAffiches(id, 'j', 'armee');
    assert.equal(deux.length, 2, `${id} : ${deux.length} fichier(s) au lieu de la coque et sa tourelle`);
    assert.match(deux[1], /_tourelle\.png$/, `${id} : la tourelle porte encore une orientation`);

    const avecTourelle = comptesDAccent(deux);
    const coqueSeule = comptesDAccent([deux[0]]);
    assert.ok(avecTourelle.opaques > coqueSeule.opaques,
      `${id} : la tourelle n'ajoute aucun pixel — le montage ne mesure rien`);
    if (dominant(avecTourelle) !== dominant(coqueSeule)) comptent += 1;
  }
  assert.ok(comptent > 0,
    'la tourelle ne change le verdict d\'aucun blindé : un compteur qui ne lirait '
    + 'que la coque passerait ce test, et il ne garderait rien');

  // ⚠ FALSIFIABLE : le montage sait DISTINGUER deux verdicts. Sans cet appât,
  // une fonction `dominant` qui rendrait toujours la même chose ferait passer la
  // boucle ci-dessus sur n'importe quel art.
  assert.notEqual(
    dominant(comptesDAccent(fichiersAffiches('pilon', 'j', 'armee'))),
    dominant(comptesDAccent(fichiersAffiches('broyeur', 'j', 'armee'))),
    'le montage ne distingue pas deux verdicts différents',
  );
});
