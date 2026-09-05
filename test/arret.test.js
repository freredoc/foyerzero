// LOT ARRÊT — on s'arrête pour un BÂTIMENT, et pour rien d'autre.
//
// Ethan, 04/09 : « Je demande un comportement. Chaque unité s'arrête pour
// casser des bâtiments. Merlon et tourelles exclus, sauf si ils empêchent
// d'avancer. »
//
// ⚠⚠ CE QUE CES DIX TESTS GARDENT N'EST PAS UNE LIGNE, C'EST UNE DISTINCTION.
// `doitSArreter` comparait `colonnePredilection` à la colonne de la cible ; or
// `COLONNE_PAR_TYPE_DEFENSE` range mur, barrière et tourelle sous
// `structureOuAviation`, exactement comme `profilBatiment`. Aucune lecture de
// colonne ne pouvait donc séparer un mur d'un bâtiment. Le `genre` le peut, et
// il est seul à le pouvoir.
//
// ⚠ T2, T3 ET T4 SONT DES INVERSIONS : ils sont VERTS ici et ROUGES sur
// `origin/main`, vérifié en exécutant ce fichier dans un `git worktree`. Un
// test d'inversion qui passe des deux côtés ne teste rien.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { creerCombat, tick, TICKS_AVANT_REPLI } from '../src/sim/combat.js';
import { DEFENSES, UNITES } from '../src/data/combat.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Retire commentaires de ligne et de bloc : une garde ne lit jamais sa propre prose. */
function sansCommentaires(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
}

/**
 * Un montage nu — un seul assaillant, et rien qui ne serve à la mesure.
 *
 * ⚠ LA GANGUE LOINTAINE EST OBLIGATOIRE quand la scène n'a pas d'autre
 * bâtiment : sans un objectif quelque part, le combat se conclut faute de
 * cible et la trace s'arrête avant ce qu'on veut voir.
 */
const montage = (o) => ({
  niveau: 1,
  saveur: null,
  obstacles: [],
  batiments: [],
  defenseurs: [],
  vagues: [[]],
  modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
  ...o,
});

const GANGUE_LOINTAINE = { id: 'gangue', rangee: 18, colonne: 1 };

/** L'assaillant du montage — il n'y en a qu'un. */
function assaillant(etat) {
  const e = etat.entites.find((x) => x.camp === 'attaque');
  assert.ok(e !== undefined, 'montage : aucun assaillant');
  return e;
}

/** Joue `n` ticks. */
function jouer(etat, n) {
  for (let i = 0; i < n; i += 1) tick(etat);
}

/** Le nom de la cible courante, ou `null`. */
const cibleDe = (etat, e) => (e.cibleIndice === null ? null : etat.entites[e.cibleIndice].id);

// ---------------------------------------------------------------------------
// ARRÊT T1 — une anti-infanterie s'arrête pour un bâtiment
// ---------------------------------------------------------------------------

test('ARRÊT T1 — une anti-infanterie s\'arrête désormais pour un bâtiment', () => {
  // ⚠ LE BÂTIMENT EST DANS UNE AUTRE COLONNE, ET C'EST TOUT CE QUI REND LA
  // MESURE LISIBLE. Un bâtiment est `bloquant` : posé dans la colonne de
  // l'unité, il l'arrêterait de toute façon par `peutAvancer`, et le test
  // passerait avec ou sans la règle. En (12,6) contre une unité en colonne 5,
  // la colonne de l'unité est LIBRE : si elle ne bouge plus, c'est qu'elle
  // s'arrête.
  const etat = creerCombat(montage({
    batiments: [{ id: 'gangue', rangee: 12, colonne: 6 }],
    vagues: [[{ id: 'meute', colonne: 5 }]],
  }));
  const meute = assaillant(etat);
  assert.equal(UNITES.meute.degats.infanterie > UNITES.meute.degats.structureOuAviation, true,
    'montage : la Meute doit être anti-infanterie, sinon elle s\'arrêtait déjà');

  // Elle marche 149 ticks sans rien voir — la Gangue entre dans ses 1,5 case au
  // tick 150 : (12000 − 10940)² + 1000² = 2 123 600 ≤ 1500² × 1000² / 10⁶.
  jouer(etat, 149);
  assert.equal(cibleDe(etat, meute), null, 'montage : la Gangue ne doit pas être visée avant');
  assert.equal(meute.rangeeMilli, 10940);

  jouer(etat, 1);
  assert.equal(cibleDe(etat, meute), 'gangue');
  assert.equal(meute.rangeeMilli, 10940, 'montage : elle a avancé au tick de l\'acquisition');

  // Et elle ne bouge plus d'un milli-case pendant cinquante ticks.
  jouer(etat, 50);
  assert.equal(meute.rangeeMilli, 10940, 'elle avance encore : elle ne s\'arrête pas pour le bâtiment');
  assert.equal(meute.vivant, true, 'montage : rien ne doit la tuer');
});

// ---------------------------------------------------------------------------
// ARRÊT T2 — une anti-structure ne s'arrête plus pour une tourelle
// ---------------------------------------------------------------------------

test('ARRÊT T2 — une anti-structure ne s\'arrête plus pour une tourelle (inversion)', () => {
  // ⚠ LA BATTERIE NE PEUT PAS RIPOSTER, ET C'EST VOULU : sa table vaut
  // {0, 0, 40}, donc elle ne touche que ce qui vole ou construit. Une Casemate
  // à sa place tuerait les Perceurs au tick 65 et la mesure porterait sur une
  // mort, pas sur un déplacement.
  const etat = creerCombat(montage({
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'batterie', rangee: 6, colonne: 6 }],
    vagues: [[{ id: 'perceurs', colonne: 5 }]],
  }));
  const perceurs = assaillant(etat);
  assert.equal(DEFENSES.batterie.type, 'tourelle', 'montage : ce n\'est pas une tourelle');

  jouer(etat, 50);
  assert.equal(cibleDe(etat, perceurs), 'batterie', 'montage : la tourelle doit être visée');
  // ⚠ ON RELÈVE LE DÉPART, ON NE L'ASSERTE PAS : sur `origin/main` l'unité gèle
  // dès qu'elle acquiert la tourelle, donc elle n'est même pas à la même case
  // au tick 50. Asserter sa position ici ferait tomber ce test AVANT la ligne
  // qui porte la règle, et l'inversion ne dirait plus laquelle des deux
  // grandeurs a bougé.
  const depart = perceurs.rangeeMilli;

  // AVANT : `colonnePredilection` des Perceurs vaut `structureOuAviation`, la
  // colonne d'une tourelle — l'unité gelait ici, et l'avance valait ZÉRO.
  // APRÈS : elle continue à sa vitesse nominale de 60 milli-cases par tick, et
  // dépasse la rangée de la tourelle.
  jouer(etat, 40);
  assert.equal(perceurs.rangeeMilli - depart, 40 * UNITES.perceurs.vitesse,
    'elle ne s\'est pas déplacée de quarante pas : elle s\'arrête pour la tourelle');
  assert.equal(perceurs.rangeeMilli, 7400);
  assert.ok(perceurs.rangeeMilli > 6000, 'elle n\'a pas dépassé la rangée de la tourelle');
});

// ---------------------------------------------------------------------------
// ARRÊT T3 — une anti-structure ne s'arrête plus pour un mur
// ---------------------------------------------------------------------------

test('ARRÊT T3 — une anti-structure ne s\'arrête plus pour un mur (inversion)', () => {
  // Le Merlon est DANS la colonne de l'unité : il bloque, donc l'unité ne
  // franchira pas sa case. Ce que la règle change se lit à l'intérieur de la
  // case — `peutAvancer` compte comme un progrès le fait d'avancer chez soi.
  const etat = creerCombat(montage({
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'merlon', rangee: 6, colonne: 5 }],
    vagues: [[{ id: 'perceurs', colonne: 5 }]],
  }));
  const perceurs = assaillant(etat);

  jouer(etat, 45);
  assert.equal(cibleDe(etat, perceurs), 'merlon', 'montage : le mur doit être visé');
  const acquisition = perceurs.rangeeMilli;

  // AVANT : gelée pour toujours à l'endroit où elle a acquis le mur — 4 520 sur
  // `origin/main`, où l'arrêt tombe cinq ticks plus tôt. APRÈS : elle monte
  // jusqu'au bord de la case du mur, 5 960, et le pas suivant viserait 6 020,
  // c'est-à-dire la case du Merlon, qui bloque.
  jouer(etat, 21);
  assert.ok(perceurs.rangeeMilli > acquisition,
    'elle n\'a pas bougé depuis qu\'elle vise le mur : elle s\'arrête encore pour lui');
  assert.equal(perceurs.rangeeMilli, 5960);
  jouer(etat, 20);
  assert.equal(perceurs.rangeeMilli, 5960, 'elle a franchi le mur');
  assert.equal(perceurs.sorti, false, 'elle s\'est repliée devant le mur');
});

// ---------------------------------------------------------------------------
// ARRÊT T4 — une anti-véhicule ne s'arrête plus pour une artillerie
// ---------------------------------------------------------------------------

test('ARRÊT T4 — une anti-véhicule ne s\'arrête plus pour une artillerie (inversion)', () => {
  // ⚠ LES TROIS ARTILLERIES SONT DES VÉHICULES SANS ÊTRE DES BLINDÉS : leur
  // châssis est nul, c'est `COLONNE_PAR_TYPE_DEFENSE` qui les range en
  // `vehicule`. La Carapace, dont la prédilection est `vehicule`, s'arrêtait
  // donc pour elles.
  const etat = creerCombat(montage({
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'harpon', rangee: 6, colonne: 6 }],
    vagues: [[{ id: 'carapace', colonne: 5 }]],
  }));
  const carapace = assaillant(etat);
  assert.equal(DEFENSES.harpon.type, 'artillerie');
  assert.equal(DEFENSES.harpon.degats.infanterie, 0, 'montage : le Harpon ne doit pas riposter');

  jouer(etat, 50);
  assert.equal(cibleDe(etat, carapace), 'harpon', 'montage : l\'artillerie doit être visée');
  const depart = carapace.rangeeMilli;

  jouer(etat, 20);
  assert.equal(carapace.rangeeMilli - depart, 20 * UNITES.carapace.vitesse,
    'elle est restée devant l\'artillerie');
  assert.equal(carapace.rangeeMilli, 6200);
});

// ---------------------------------------------------------------------------
// ARRÊT T5 — l'aviation traversante ne s'arrête pour rien
// ---------------------------------------------------------------------------

test('ARRÊT T5 — la traversante ne s\'arrête pas, bâtiment ou non', () => {
  assert.equal(UNITES.crecelle.comportementAerien, 'traversant');
  const etat = creerCombat(montage({
    batiments: [{ id: 'gangue', rangee: 12, colonne: 6 }],
    vagues: [[{ id: 'crecelle', colonne: 5 }]],
  }));
  const crecelle = assaillant(etat);

  jouer(etat, 80);
  assert.equal(cibleDe(etat, crecelle), 'gangue', 'montage : elle doit viser le bâtiment');
  const r = crecelle.rangeeMilli;

  // La garde aérienne passe AVANT tout le reste : elle vise le bâtiment, elle
  // le frappe, et elle continue à 120 milli-cases par tick.
  jouer(etat, 10);
  assert.equal(crecelle.rangeeMilli, r + 10 * UNITES.crecelle.vitesse);
  // Et elle finit par sortir par le fond, ce qu'elle seule sait faire.
  jouer(etat, 60);
  assert.equal(crecelle.sorti, true, 'la traversante n\'est pas sortie');
});

// ---------------------------------------------------------------------------
// ARRÊT T6 — on ne s'arrête pas pour une cible qu'on n'a pas touchée
// ---------------------------------------------------------------------------

test('ARRÊT T6 — cible conservée hors de portée : pas de tir, donc pas d\'arrêt', () => {
  // ⚠ UNE UNITÉ CONSERVE SA CIBLE quand aucune n'est à portée (règle du lot 2A).
  // On l'exploite pour construire l'état exact que la garde `!e.aTire` défend :
  // `cibleIndice` pointe un BÂTIMENT, et pourtant l'unité n'a rien tiré.
  const etat = creerCombat(montage({
    batiments: [{ id: 'gangue', rangee: 12, colonne: 6 }],
    vagues: [[{ id: 'meute', colonne: 5 }]],
  }));
  const meute = assaillant(etat);
  while (meute.cibleIndice === null) tick(etat);
  const cible = meute.cibleIndice;

  meute.rangeeMilli = 2000; // la Gangue passe hors des 1,5 case
  tick(etat);
  assert.equal(meute.cibleIndice, cible, 'montage : la cible n\'a pas été conservée');
  assert.equal(etat.entites[meute.cibleIndice].genre, 'batiment');
  assert.equal(meute.aTire, false, 'montage : elle ne doit pas avoir tiré');
  assert.equal(meute.rangeeMilli, 2060, 'elle s\'est arrêtée pour une cible qu\'elle n\'a pas touchée');
});

// ---------------------------------------------------------------------------
// ARRÊT T7 — devant un mur bloquant, elle ne progresse pas et elle FORCE
// ---------------------------------------------------------------------------

test('ARRÊT T7 — devant un mur bloquant, le porteur de l\'Écraseur force', () => {
  // ⚠⚠ LE FORÇAGE SE MESURE PAR DIFFÉRENCE, PAS PAR LECTURE. Le Broyeur TIRE
  // aussi sur le mur ; la seule façon d'isoler `structureForcee` est de rejouer
  // la même scène sans le module et de soustraire.
  const scene = (modules) => creerCombat(montage({
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'merlon', rangee: 6, colonne: 5 }],
    vagues: [[{ id: 'broyeur', colonne: 5 }]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: { offense: modules, defense: [] },
    },
  }));
  assert.equal(UNITES.broyeur.module, 'ecraseur', 'montage : le porteur n\'a plus l\'Écraseur');

  const avec = scene(['ecraseur']);
  const sans = scene([]);
  const murDe = (etat) => etat.entites.find((e) => e.id === 'merlon');
  const uniteDe = (etat) => assaillant(etat);

  // Le Broyeur ARRIVE au contact au tick 44, à 5 960 — 4 700 + 14 × 90 — et le
  // premier forçage tombe au tick 45, le premier où il ne progresse plus. On
  // relève donc au 44 : un relevé pris au 45 trouve déjà vingt mille milli-PV
  // d'écart, et c'est ce qui a fait tomber le premier jet de ce test.
  jouer(avec, 44);
  jouer(sans, 44);
  assert.equal(uniteDe(avec).rangeeMilli, 5960, 'montage : le porteur n\'est pas au contact');
  assert.equal(uniteDe(avec).rangeeMilli, uniteDe(sans).rangeeMilli, 'montage : les deux scènes divergent');
  assert.equal(murDe(avec).pvMilli, murDe(sans).pvMilli, 'montage : le forçage a commencé trop tôt');

  // Seize ticks bloqués — 45 à 60 : l'écart vaut EXACTEMENT seize fois 1 % des
  // PV max du mur, `ECRASEUR_PCT_PAR_TICK`, mesuré et non recopié. Le facteur
  // est celui du NOMBRE DE TICKS joués, pas un nombre choisi : le changer d'un
  // côté sans l'autre fait tomber le test.
  const bloques = 16;
  jouer(avec, bloques);
  jouer(sans, bloques);
  const ecart = murDe(sans).pvMilli - murDe(avec).pvMilli;
  assert.equal(ecart, bloques * Math.floor(murDe(avec).pvMaxMilli / 100), `écart mesuré : ${ecart}`);
  assert.ok(ecart > 0, 'le module ne force rien : le test ne mesure rien');

  // Et le porteur n'a pas progressé d'un milli-case pendant ce temps.
  assert.equal(uniteDe(avec).rangeeMilli, 5960);
  assert.equal(uniteDe(avec).ticksInutiles, 0, 'le compteur de repli est monté alors qu\'elle force');
});

// ---------------------------------------------------------------------------
// ARRÊT T8 — et elle ne se replie pas
// ---------------------------------------------------------------------------

test('ARRÊT T8 — devant un mur bloquant, aucune ne se replie', () => {
  // ⚠⚠ C'EST LE TEST QUE LE LOT EXISTE POUR ÉCRIRE, et il porte sur les DEUX
  // pièces — celle qui force et celle qui ne fait que tirer. Le brief posait
  // `structureForcee` comme le mécanisme qui retient l'unité ; mesuré, il ne
  // couvre QUE les porteurs de l'Écraseur. Ce qui retient les vingt-deux autres
  // est `nuit(e)`, c'est-à-dire `aTire` : elles tirent sur le mur, donc leur
  // compteur de repli est remis à zéro à chaque tick.
  //
  // ⚠ LE SEUIL SE CALCULE : il faut environ cent ticks pour ouvrir la brèche
  // (1 % des PV max par tick), contre trente avant repli. On joue donc
  // `TICKS_AVANT_REPLI + 5` ticks APRÈS le blocage, et le mur doit être encore
  // debout — sinon le test mesurerait une brèche, pas une absence de repli.
  const scene = (id, modules) => creerCombat(montage({
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'merlon', rangee: 6, colonne: 5 }],
    vagues: [[{ id, colonne: 5 }]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: { offense: modules, defense: [] },
    },
  }));

  for (const [id, modules] of [['broyeur', ['ecraseur']], ['perceurs', []]]) {
    const etat = scene(id, modules);
    const unite = assaillant(etat);
    // ⚠ ON JOUE JUSQU'AU BLOCAGE, ON NE L'ÉCRIT PAS : les deux pièces n'ont pas
    // la même vitesse — 90 pour le Broyeur, 60 pour les Perceurs —, donc pas le
    // même tick d'arrivée. Un nombre en dur aurait fait mesurer la fenêtre
    // ailleurs qu'au contact du mur, et le test serait passé sans rien voir.
    let precedente = -1;
    for (let n = 0; n < 200 && unite.rangeeMilli !== precedente; n += 1) {
      precedente = unite.rangeeMilli;
      tick(etat);
    }
    const bloquee = unite.rangeeMilli;
    assert.equal(bloquee, 5960, `${id} : la pièce ne s'est pas arrêtée au bord de la case du mur`);
    jouer(etat, TICKS_AVANT_REPLI + 5);
    assert.equal(unite.rangeeMilli, bloquee, `${id} : la scène ne bloque pas, le test ne mesure rien`);
    assert.equal(unite.sorti, false, `${id} s'est replié devant le mur`);
    assert.equal(unite.ticksInutiles, 0, `${id} : le compteur de repli est monté`);
    assert.equal(etat.entites.find((e) => e.id === 'merlon').vivant, true,
      `${id} : le mur est tombé avant la fin de la fenêtre, la mesure ne vaut rien`);
  }
});

// ---------------------------------------------------------------------------
// ARRÊT T9 — la tourelle ne retient plus, et TOUTES bloquent
// ---------------------------------------------------------------------------

test('ARRÊT T9 — aucune tourelle ne retient plus, et aucune n\'est non bloquante', () => {
  // ⚠⚠ LE BRIEF DEMANDAIT « UNE TOURELLE NON BLOQUANTE », ET IL N'EN EXISTE
  // AUCUNE. Mesuré sur la table : les trois tourelles et les trois artilleries
  // portent toutes `bloque: true` ; seules les deux barrières ne bloquent pas,
  // et elles ne tirent jamais. « Sauf si ils empêchent d'avancer » est donc
  // TOUJOURS vrai d'une tourelle plantée dans la colonne de l'unité : ce que la
  // règle change ne se voit que LATÉRALEMENT.
  for (const [id, d] of Object.entries(DEFENSES)) {
    if (d.type === 'tourelle' || d.type === 'artillerie') {
      assert.equal(d.bloque, true, `${id} ne bloque pas : la lecture de ce test change`);
    }
  }
  assert.deepEqual(
    Object.entries(DEFENSES).filter(([, d]) => d.bloque !== true).map(([id]) => id),
    ['ronce', 'herse'],
    'la liste des défenses non bloquantes a changé',
  );

  // Latéralement, donc : une Casemate en colonne 6 contre une unité en colonne
  // 5. Elle est à portée, elle est visée, elle tire — et l'unité passe.
  const etat = creerCombat(montage({
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'harpon', rangee: 6, colonne: 6 }],
    vagues: [[{ id: 'fendeur', colonne: 5 }]],
  }));
  const fendeur = assaillant(etat);
  jouer(etat, 35);
  assert.equal(cibleDe(etat, fendeur), 'harpon', 'montage : l\'artillerie doit être visée');
  const r = fendeur.rangeeMilli;
  jouer(etat, 10);
  assert.equal(fendeur.rangeeMilli, r + 10 * UNITES.fendeur.vitesse, 'elle s\'est arrêtée');
});

// ---------------------------------------------------------------------------
// ARRÊT T10 — `colonnePredilection` n'est pas devenu un champ mort
// ---------------------------------------------------------------------------

test('ARRÊT T10 — `colonnePredilection` garde ses deux lecteurs', () => {
  // ⚠ LE BRIEF LE DEMANDE PAR GREP, ET C'EST LA BONNE FORME : un champ qu'on
  // laisserait sans lecteur serait un commentaire menteur en puissance. Deux
  // lecteurs restent — la munition spéciale et le camouflage — et le troisième,
  // `doitSArreter`, est celui que le lot retire.
  const code = sansCommentaires(readFileSync(join(RACINE, 'src/sim/combat.js'), 'utf8'));
  const lectures = code.match(/[\w.]*colonnePredilection/g) ?? [];
  // Trois écritures dans les profils, deux lectures de comparaison, une garde
  // de nullité : six occurrences, et pas celle de `doitSArreter`.
  // Sept occurrences : trois écritures de profil, une garde de nullité, et
  // trois lectures de comparaison — deux pour le camouflage, une pour la
  // munition spéciale. Celle de `doitSArreter` faisait la huitième.
  assert.equal(lectures.length, 7, `occurrences trouvées : ${lectures.join(', ')}`);
  assert.equal(code.includes('p.colonnePredilection === pc.colonneMatrice'), false,
    'la règle d\'arrêt lit encore la colonne de prédilection');
  assert.ok(code.includes('pc.colonneMatrice !== p.colonnePredilection'),
    'la munition spéciale ne lit plus la prédilection');
  assert.ok(code.includes('profil(c).colonneMatrice !== p.colonnePredilection'),
    'le camouflage ne lit plus la prédilection');

  // Et la règle d'arrêt lit bien le GENRE — la seule grandeur qui sépare un mur
  // d'un bâtiment.
  const regle = code.match(/function doitSArreter[\s\S]*?\n}/);
  assert.ok(regle !== null, 'doitSArreter est introuvable');
  assert.ok(regle[0].includes("genre === 'batiment'"), 'la règle d\'arrêt ne lit pas le genre');
  assert.ok(regle[0].includes('comportementAerien'), 'la garde aérienne a disparu');
  assert.ok(regle[0].includes('e.aTire'), 'la garde du tir a disparu');
});
