// Lot RUINES-DÉFENSE — 19/09/2026.
//
// Ethan a livré huit planches de gravats — quatre par camp — et le brief
// demande de les brancher sous les pièces de DÉFENSE tombées. Deux tests, et
// ils mesurent les deux choses que le lot peut casser en silence.
//
// ⚠⚠ AUCUN TEST DE VALEUR ABSOLUE ICI, ET LE BRIEF L'INTERDIT NOMMÉMENT. `T1`
// mesure une FRACTION d'accord entre deux tirages et la borne des deux côtés ;
// épingler la lettre d'une case donnée figerait le hachage lui-même, donc
// ferait rougir le jour où une variante de plus entrerait au dépôt — pour une
// propriété qui n'aurait rien à voir avec ce que le lot défend.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { GRILLE } from '../src/data/combat.js';
import { RESTE_APRES_DESTRUCTION, FAMILLE_DE_LA_RUINE } from '../src/data/sites.js';
import {
  nomDeVariante, SEL_VARIANTE, SEL_VARIANTE_RUINE,
} from '../src/render/variante.js';
import { listeAffichage, couchesDeLaRuine } from '../src/render/scene.js';
import { calculerProjection } from '../src/render/projection.js';
import { MUR_CASES } from '../src/render/fond.js';
import { creerCombat, tick } from '../src/sim/combat.js';
import { creerEtat } from '../src/sim/state.js';

const GRAINE = 2026;

// ---------------------------------------------------------------------------
// T1 — la ruine ne porte pas la lettre du sol de sa case
// ---------------------------------------------------------------------------

test('RUINES-DÉF T1 — la ruine et le sol tirent séparément, et l\'accord tombe au hasard', () => {
  // ⚠⚠ C'EST LE PIÈGE DU §2 DU BRIEF, ET IL SE MESURE AVANT DE SE CORRIGER. Le
  // sol a QUATRE variantes ; les ruines de pièce en ont quatre aussi. La bande
  // de sel s'écrit `sel * 32 + nombre` : sous un sel unique, elle vaut 132 des
  // deux côtés, donc le hachage est le MÊME et la ruine porte TOUJOURS la lettre
  // du sol de sa case. Quatre paires sur seize, répétées sur toute la base —
  // c'est la sorte de motif qu'on voit sans savoir le nommer.
  //
  // ⚠ ET LA PROPRIÉTÉ GARDÉE EST UNE FRACTION, BORNÉE DES DEUX CÔTÉS. Deux
  // tirages indépendants sur quatre valeurs s'accordent une fois sur quatre ;
  // exiger l'égalité exacte à 0,25 sur 162 cases serait exiger que le hachage
  // soit parfait, ce qu'aucun hachage n'est. La borne dit « du hasard », pas
  // « ce hasard-ci ».
  const cases = [];
  for (let r = 1; r <= GRILLE.longueur; r += 1) {
    for (let c = 1; c <= GRILLE.largeur; c += 1) cases.push([r, c]);
  }
  assert.equal(cases.length, 162, 'le montage ne balaie pas la grille entière');

  const lettre = (nom) => nom.slice(-1);
  const lettreDuSol = (r, c) => lettre(nomDeVariante('tile_sol_j', GRAINE, r, c));
  // ⚠⚠ LA RUINE SE DEMANDE PAR LA PORTE DE PRODUCTION, PAS À `nomDeVariante`. La
  // première écriture de ce test appelait le tirage directement : **oublier le
  // sel AU SITE D'APPEL de `render/scene.js` la laissait entièrement verte** —
  // mesuré, 3 pass / 0 fail sur un code où la ruine reprenait le sel du sol.
  // Le test mesurait la fonction, pas le chemin. Il passe par
  // `couchesDeLaRuine`, qui est ce que `listeAffichage` appelle.
  const lettreDeLaRuine = (r, c) => lettre(
    couchesDeLaRuine('joueur', 'defense', GRAINE, r, c)[0].nom);
  const accord = () => cases.filter(([r, c]) => lettreDuSol(r, c) === lettreDeLaRuine(r, c)).length;
  // ⚠ ET LE TÉMOIN DU SEL PARTAGÉ RESTE UN CALCUL DE RÉFÉRENCE, à côté : c'est
  // ce que la ruine RENDRAIT si elle reprenait le sel du terrain, et il n'a pas
  // à passer par la production pour le dire.
  const accordSousLeSelDuSol = () => cases.filter(([r, c]) => lettreDuSol(r, c)
    === lettre(nomDeVariante('ruine_def_j', GRAINE, r, c, 'defense', SEL_VARIANTE))).length;

  // ⚠⚠ LA PRÉMISSE D'ABORD : les deux familles ont bien le MÊME compte de
  // variantes. Sans cette ligne, la mesure ci-dessous serait celle de deux
  // familles d'effectifs différents, que `nombre` décorrèle déjà tout seul —
  // le test passerait sans rien garder.
  const sols = new Set(cases.map(([r, c]) => lettreDuSol(r, c)));
  const ruines = new Set(cases.map(([r, c]) => lettreDeLaRuine(r, c)));
  assert.deepEqual([...sols].sort(), ['a', 'b', 'c', 'd'],
    'le sol ne sort pas ses quatre variantes sur cette graine');
  assert.deepEqual([...ruines].sort(), ['a', 'b', 'c', 'd'],
    'la ruine ne sort pas ses quatre variantes sur cette graine');

  // ⚠⚠ LA FALSIFICATION EST DANS LE TEST, ET ELLE MORD À 100 %. Reprendre le sel
  // du terrain — ce que faisait la fonction avant que le sel ne devienne un
  // argument — rend l'accord PARFAIT. C'est elle qui dit que la borne du bas
  // n'est pas décorative : sans le second sel, la fraction ne vaut pas 0,4 ou
  // 0,5, elle vaut 1.
  assert.equal(accordSousLeSelDuSol(), cases.length,
    'le sel du terrain ne rend plus 100 % d\'accord : la mesure ne dit plus rien');

  const n = accord();
  const fraction = n / cases.length;
  assert.ok(fraction >= 0.15 && fraction <= 0.35,
    `accord ruine/sol ${n}/${cases.length} = ${(fraction * 100).toFixed(2)} %, hors de [15 %, 35 %]`);

  // ⚠ ET LE SEL EST LE PREMIER LIBRE, pas un nombre choisi au hasard. Deux
  // tirages sans rapport qui partagent un sel finissent par se corréler — c'est
  // très exactement la faute que ce lot corrige, et la reproduire ailleurs
  // coûterait un second lot.
  assert.notEqual(SEL_VARIANTE_RUINE, SEL_VARIANTE,
    'les deux sels ont reconvergé : le mélange redevient identique');
});

// ---------------------------------------------------------------------------
// T2 — une pièce de défense laisse SA ruine, un bâtiment laisse SA planche
// ---------------------------------------------------------------------------

/**
 * Un site et sa peinture, sous forme de noms `famille/nom`.
 *
 * ⚠⚠ DEUX MONTAGES, ET C'EST MESURÉ PLUTÔT QUE CHOISI. Le premier porte les
 * TROIS genres, parce que `RESTE_APRES_DESTRUCTION` en a trois clés et qu'un
 * montage qui n'en couvrirait que deux laisserait la troisième sans mesure ; il
 * ne fait tomber personne, il se contente d'un effondrement. Le second n'a que
 * le Merlon, parce qu'il faut que le MOTEUR l'abatte : **mesuré, une escouade
 * de défense posée à côté fait replier l'attaquante au trentième tick** — la
 * Meute vise la Meute, qui est sa prédilection, ne peut pas l'atteindre à six
 * colonnes de là, et rentre sans avoir griffé le mur. Un seul montage pour les
 * deux chemins aurait demandé de tordre l'un ou l'autre.
 */
function montage(defenseurs) {
  const etat = creerCombat({
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 18, colonne: 5 }],
    defenseurs,
    vagues: [[{ id: 'meute', colonne: 5 }]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] },
    },
  });
  const proj = calculerProjection(1080, 4000, MUR_CASES);
  const noms = (tombees = null) => listeAffichage(etat, proj, null, 0, null, GRAINE, tombees)
    .filter((p) => p.forme === 'sprite')
    .map((p) => `${p.famille}/${p.nom}`);
  return { etat, proj, noms };
}

/** Les trois genres, pour l'effondrement. */
const TROIS_GENRES = [
  { id: 'merlon', rangee: 10, colonne: 3 },
  { id: 'meute', rangee: 10, colonne: 9 },
];
/** Le Merlon seul, dans la colonne de l'assaut, pour la mort au combat. */
const MUR_SEUL = [{ id: 'merlon', rangee: 10, colonne: 5 }];

const EST_RUINE_DEF = /^defense\/ruine_def_[jo]_[a-d]$/;
const EST_RUINE_GENERIQUE = /^batiment\/ruine_[jo]$/;

test('RUINES-DÉF T2 — la défense laisse sa ruine, le bâtiment sa planche, et rien ne bouge d\'une image à l\'autre', () => {
  // ⚠⚠ LE RÉGLAGE DU JOUR D'ABORD, SANS QUOI TOUT CE QUI SUIT MESURERAIT AUTRE
  // CHOSE. C'est l'arbitrage du lot : `defense` passe de `'rien'` à `'ruine'`,
  // et les deux autres genres NE BOUGENT PAS — le brief le dit en toutes
  // lettres, « les ruines de bâtiment restent `planche`, celles d'unité
  // restent `rien` ».
  assert.deepEqual({ ...RESTE_APRES_DESTRUCTION },
    { batiment: 'planche', defense: 'ruine', unite: 'rien' });

  // ⚠⚠ ET LA FAMILLE N'EST PAS CELLE DES RUINES DE BÂTIMENT — C'EST LE §1.1 DU
  // BRIEF, ET C'EST LA FAUTE QU'IL EXISTE POUR EMPÊCHER. « Passer `defense` à
  // `'ruine'` ferait dessiner `ruine_j`/`ruine_o`, famille `batiment`,
  // c'est-à-dire les ruines de BÂTIMENT » — Ethan, 19/09 : « les huit sources
  // livrées sont des ruines de défense — socles, tourelles, murs —, parce que
  // les ruines, il y a déjà des ruines de bâtiments ».
  assert.equal(FAMILLE_DE_LA_RUINE.defense.famille, 'defense');
  assert.notEqual(FAMILLE_DE_LA_RUINE.defense.famille,
    FAMILLE_DE_LA_RUINE.batiment.famille,
    'la ruine de pièce est allée chercher la famille des ruines de bâtiment');

  const { etat, noms } = montage(TROIS_GENRES);
  const parId = new Map(etat.entites.map((e) => [`${e.id}/${e.camp}`, e]));
  const souche = parId.get('souche/defense');
  const merlon = parId.get('merlon/defense');
  const escouade = parId.get('meute/defense');
  assert.ok(souche && merlon && escouade, 'le montage n\'a pas les trois genres');

  // Rien n'est tombé : aucune ruine, d'aucune sorte.
  const intact = noms();
  assert.equal(intact.filter((n) => EST_RUINE_DEF.test(n)).length, 0);
  assert.equal(intact.filter((n) => EST_RUINE_GENERIQUE.test(n)).length, 0);
  assert.ok(intact.includes('batiment/bat_o_souche'), 'le montage ne dessine pas la Souche');

  // ⚠⚠ PREMIER CHEMIN : L'EFFONDREMENT DE FIN DE RAID. Les trois genres tombent
  // ensemble, et chacun laisse ce que la table dit — une planche, une ruine de
  // pièce, rien.
  const tombees = new Set([souche.indice, merlon.indice, escouade.indice]);
  const apres = noms(tombees);
  assert.equal(apres.filter((n) => n === 'batiment/bat_o_souche_detruit').length, 1,
    'le bâtiment ne laisse pas sa planche');
  assert.equal(apres.filter((n) => EST_RUINE_GENERIQUE.test(n)).length, 0,
    'le bâtiment laisse la ruine générique : c\'est le piège du §1.1');
  const ruines = apres.filter((n) => EST_RUINE_DEF.test(n));
  assert.equal(ruines.length, 1,
    `${ruines.length} ruines de pièce pour une seule structure tombée`);
  // ⚠ L'ESCOUADE N'EN LAISSE AUCUNE — `unite` reste à `rien`. Sans cette ligne,
  // un `'ruine'` posé sur les trois genres passerait.
  assert.equal(apres.filter((n) => n.startsWith('defense/ruine_def_')).length, 1,
    'l\'escouade laisse une ruine elle aussi');

  // ⚠⚠ SECOND CHEMIN : LA MORT AU COMBAT, SANS EFFONDREMENT. `estTombee` et
  // `estUneRuine` sont deux lectures du même fait, et `render/scene.js` le dit ;
  // n'en mesurer qu'une laisserait l'autre libre de diverger. Le Merlon tombe
  // ici sous le feu du MOTEUR, pas par un champ posé à la main.
  const seul = montage(MUR_SEUL);
  const mur = seul.etat.entites.find((e) => e.id === 'merlon');
  assert.equal(seul.noms().filter((n) => EST_RUINE_DEF.test(n)).length, 0,
    'une ruine avant que rien ne tombe');
  let tours = 0;
  while (mur.vivant && tours < 20_000) { tick(seul.etat); tours += 1; }
  assert.equal(mur.vivant, false, `la Meute n'a pas abattu le Merlon en ${tours} ticks`);
  const auCombat = seul.noms();
  assert.equal(auCombat.filter((n) => EST_RUINE_DEF.test(n)).length, 1,
    'une pièce morte au combat ne laisse pas sa ruine');
  assert.ok(!auCombat.some((n) => n.startsWith('defense/def_o_merlon')),
    'le Merlon mort se dessine encore intact');

  // ⚠⚠ ET LA SCÈNE EST PURE : deux appels aux mêmes arguments rendent la même
  // liste, ruine comprise. Un tirage frais à chaque image ferait SCINTILLER le
  // tas de gravats sous le doigt — `rafraichir` passe dix fois par seconde.
  assert.deepEqual(seul.noms(), auCombat, 'deux peintures ne rendent pas la même ruine');
  assert.deepEqual(noms(tombees), apres, 'deux effondrements ne rendent pas la même ruine');
});

test('RUINES-DÉF T2 bis — la ruine ne consomme pas le flux de la partie', () => {
  // ⚠⚠ C'EST LA RÈGLE §4 DU DÉPÔT, ET ELLE VAUT POUR CE TIRAGE-CI COMME POUR LES
  // AUTRES. Le PRNG de l'état est celui de la SIMULATION : y prendre un nombre
  // pour choisir une texture décale tout ce que le moteur tirera ensuite, et la
  // partie cesse de se rejouer à l'identique. `render/variante.js` l'écrit en
  // tête ; ce test le MESURE, plutôt que de relire le commentaire.
  //
  // ⚠ ET L'ÉTAT DE PARTIE EST LÀ EXPRÈS : un montage de combat n'a pas de `rng`
  // — vérifié, `creerCombat` n'en pose aucun —, donc la garde n'aurait rien eu à
  // relever. La graine passe en ARGUMENT, et c'est tout ce que la scène reçoit.
  const partie = creerEtat(GRAINE);
  assert.ok(partie.rng !== undefined, 'l\'état de partie n\'a pas de flux à garder');

  const { etat, noms } = montage(TROIS_GENRES);
  const merlon = etat.entites.find((e) => e.id === 'merlon');
  const avant = JSON.stringify(partie.rng);
  // Une peinture complète, ruine comprise.
  const tombees = new Set(etat.entites.map((e) => e.indice));
  assert.ok(noms(tombees).some((n) => EST_RUINE_DEF.test(n)),
    'la peinture ne pose aucune ruine : le montage ne prouve rien');
  assert.equal(JSON.stringify(partie.rng), avant,
    'la ruine a consommé le flux de la partie');

  // ⚠ ET LE NOM NE DÉPEND QUE DE LA GRAINE ET DE LA CASE : deux cases
  // différentes peuvent porter deux lettres différentes, la MÊME case n'en porte
  // qu'une. Sans la seconde ligne, un tirage frais passerait la première.
  const a = couchesDeLaRuine('ouvrage', 'defense', GRAINE, merlon.indice + 3, 4);
  const b = couchesDeLaRuine('ouvrage', 'defense', GRAINE, merlon.indice + 3, 4);
  assert.deepEqual(a, b, 'deux appels sur la même case rendent deux dessins');
});
