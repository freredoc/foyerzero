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
//
// ⚠⚠⚠ ET LE LOT MUR (10/09) RETOURNE T2 ET T3 UNE SECONDE FOIS — LE FICHIER
// GARDE DÉSORMAIS LE CONTRAIRE DE CE QUE SON TITRE ANNONCE. Ethan : « les
// unités anti-structure s'arrêtent devant les tourelles, les barbelés, les murs
// et les bâtiments. » L'exclusion du 04/09 tombe, `estStructureDefensive` part
// avec son dernier lecteur, et `T10` garde désormais son ABSENCE. Ce qui reste
// vrai du titre est la moitié qui n'a jamais bougé : le genre `batiment`
// arrête TOUT LE MONDE, et il est seul à le faire.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { creerCombat, tick, TICKS_AVANT_REPLI } from '../src/sim/combat.js';
import { MILLI_PAR_CASE } from '../src/sim/grille.js';
import { DEFENSES, GRILLE, UNITES } from '../src/data/combat.js';

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
const montage = (o) => {
  const brut = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [],
    defenseurs: [],
    vagues: [[]],
    modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
    ...o,
  };
  return { ...brut, vagues: brut.vagues.map((v) => v.map((u) => ({ rangee: DEPART, ...u }))) };
};

const GANGUE_LOINTAINE = { id: 'gangue', rangee: 18, colonne: 1 };

/**
 * ⚠⚠ LE POINT D'APPARITION S'ÉCRIT EXPLICITEMENT DEPUIS LE LOT APPROCHE, 11/09,
 * ET C'EST LE MONTAGE QU'ON RÉPARE — JAMAIS L'ASSERTION. `RANGEE_APPARITION` de
 * `sim/combat.js` valait le FRONT de la bande de déploiement ; elle vaut
 * désormais la voie d'approche, sous la grille, et une vague joue deux cases de
 * plus avant d'entrer. Ces montages-ci ne mesurent pas l'entrée : ils mesurent
 * ce qui se passe une fois l'unité en face de la défense. On leur redonne donc
 * le point de départ qu'ils supposaient, par le champ `rangee` que
 * `creerCombat` accepte depuis toujours pour « monter un état déjà entamé sans
 * jouer les ticks d'approche ».
 *
 * ⚠ IL SE DÉRIVE DE `GRILLE.bandes`, IL NE S'ÉCRIT PAS `2` : c'est exactement ce
 * que l'ancien défaut valait, et un nombre écrit à la main cesserait de le dire.
 *
 * ⚠⚠ ET L'INVARIANCE EST MESURÉE, PAS SUPPOSÉE : avec ce champ posé, les deux
 * cents témoins de combat et les quatorze phases de BASES-0 rendent EXACTEMENT
 * les empreintes d'avant le lot — 0 écart. C'est la preuve du §4.1 du brief, et
 * c'est elle qui autorise la recapture des témoins.
 */
const DEPART = GRILLE.bandes.deploiement.derniere;

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
// ARRÊT T2 — une anti-structure s'arrête POUR une tourelle
// ---------------------------------------------------------------------------

test('ARRÊT T2 — une anti-structure s\'arrête POUR une tourelle (inversion du 10/09)', () => {
  // ⚠⚠ CE TEST EST RETOURNÉ, ET IL L'EST POUR LA SECONDE FOIS. Il assertait
  // « elle ne s'arrête PLUS pour une tourelle », conséquence de l'exclusion du
  // 04/09 ; Ethan renverse le 10/09 : « les unités anti-structure s'arrêtent
  // devant les tourelles, les barbelés, les murs et les bâtiments ». Ce qui est
  // mesuré ici n'est donc plus une absence d'arrêt mais sa PRÉSENCE — et,
  // au-delà, que l'arrêt SERT à quelque chose : la tourelle tombe.
  //
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
  const batterie = () => etat.entites.find((e) => e.id === 'batterie');
  assert.equal(DEFENSES.batterie.type, 'tourelle', 'montage : ce n\'est pas une tourelle');
  // ⚠ LA PRÉDILECTION SE DÉDUIT DE LA MATRICE, elle n'est pas un champ de
  // `UNITES` : `colonneDominante` la calcule au profil. On asserte donc la
  // DONNÉE d'où elle sort — 25 en structure contre 12 et 5 —, faute de quoi un
  // réglage de roster ferait passer ce test sur une unité qui n'est plus
  // anti-structure, et il ne mesurerait plus rien.
  const d = UNITES.perceurs.degats;
  assert.ok(d.structureOuAviation > d.vehicule && d.vehicule > d.infanterie,
    'montage : les Perceurs ne sont plus anti-structure, le test ne mesure rien');

  // ⚠ LA TOURELLE EST DANS UNE AUTRE COLONNE, ET C'EST TOUT CE QUI REND LA
  // MESURE LISIBLE — même raison qu'en `T1`. En (6,6) contre une unité en
  // colonne 5, la colonne de l'unité est LIBRE : ni `peutAvancer` ni le
  // rangement du point 2 ne peuvent la retenir. Si elle ne bouge plus, c'est
  // `doitSArreter` et rien d'autre.
  jouer(etat, 49);
  assert.equal(cibleDe(etat, perceurs), null, 'montage : la tourelle ne doit pas être visée avant');
  assert.equal(perceurs.rangeeMilli, 4940);

  // Le tick de l'acquisition est CELUI DU GEL, pas le suivant : `doitSArreter`
  // exige `aTire`, l'étape 4 tire, l'étape 7 lit — dans le même tick.
  jouer(etat, 1);
  assert.equal(cibleDe(etat, perceurs), 'batterie');
  assert.equal(perceurs.rangeeMilli, 4940, 'elle a avancé au tick de l\'acquisition');

  // AVANT le 10/09 : elle continuait à 60 milli-cases par tick et dépassait la
  // rangée de la tourelle — 7 400 au bout de quarante ticks. APRÈS : pas un
  // milli-case, et la tourelle PERD des PV pendant ce temps. Les deux moitiés
  // comptent : figée sans tirer, elle serait bloquée, pas arrêtée.
  const pvAvant = batterie().pvMilli;
  jouer(etat, 30);
  assert.equal(perceurs.rangeeMilli, 4940, 'elle avance encore : elle ne s\'arrête pas pour la tourelle');
  assert.ok(batterie().pvMilli < pvAvant, 'elle est figée sans tirer : c\'est un blocage, pas un arrêt');
  assert.equal(batterie().vivant, true, 'montage : la tourelle doit tenir la fenêtre mesurée');

  // Et l'arrêt LÈVE avec sa cause : la Batterie tombe au tick 89, l'unité
  // repart au tick suivant. Un arrêt qui ne lèverait pas serait un gel.
  jouer(etat, 9);
  assert.equal(batterie().vivant, false, 'montage : la tourelle devait tomber au tick 89');
  jouer(etat, 1);
  assert.equal(perceurs.rangeeMilli, 5000, 'elle ne repart pas une fois la tourelle détruite');
});

// ---------------------------------------------------------------------------
// ARRÊT T3 — une anti-structure s'arrête POUR un mur
// ---------------------------------------------------------------------------

test('ARRÊT T3 — une anti-structure s\'arrête POUR un mur (inversion du 10/09)', () => {
  // ⚠⚠ SECOND RETOURNEMENT, MÊME ARBITRAGE QU'EN `T2`, ET C'EST ICI QUE LE
  // POINT 3 D'ETHAN SE LIT LE PLUS NETTEMENT : « Une unité anti-structure doit
  // s'arrêter pour détruire mur barrière tourelles. C'est une cible de
  // prédilection. »
  //
  // ⚠⚠ ET L'ARRÊT SE PRODUIT À PORTÉE, PAS AU CONTACT — c'est ce qui le
  // distingue du blocage, et c'est ce que le lot MUR sépare. Elle gèle à 4 520,
  // dans sa case 4, dès qu'elle acquiert le Merlon ; elle n'atteint jamais
  // 5 960 ni même la case devant le mur. Le rangement du point 2, lui, ne la
  // concerne pas : `if (arrete) return;` passe AVANT, et une unité arrêtée
  // n'avait pas commencé à fluer.
  const etat = creerCombat(montage({
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'merlon', rangee: 6, colonne: 5 }],
    vagues: [[{ id: 'perceurs', colonne: 5 }]],
  }));
  const perceurs = assaillant(etat);
  const mur = () => etat.entites.find((e) => e.id === 'merlon');

  jouer(etat, 42);
  assert.equal(cibleDe(etat, perceurs), null, 'montage : le mur ne doit pas être visé avant');
  assert.equal(perceurs.rangeeMilli, 4520);

  jouer(etat, 1);
  assert.equal(cibleDe(etat, perceurs), 'merlon', 'montage : le mur doit être visé');
  assert.equal(perceurs.rangeeMilli, 4520, 'elle a avancé au tick de l\'acquisition');

  // AVANT le 10/09 : elle montait jusqu'au bord de la case du mur, 5 960, et y
  // restait. APRÈS : elle ne bouge plus d'un milli-case dès l'acquisition, et
  // elle tire — le mur perd des PV pendant les quarante ticks mesurés.
  const pvAvant = mur().pvMilli;
  jouer(etat, 40);
  assert.equal(perceurs.rangeeMilli, 4520,
    'elle a bougé depuis qu\'elle vise le mur : elle ne s\'arrête pas pour lui');
  assert.ok(mur().pvMilli < pvAvant, 'elle est figée sans tirer : c\'est un blocage, pas un arrêt');
  assert.equal(perceurs.sorti, false, 'elle s\'est repliée devant le mur');
  assert.equal(mur().vivant, true, 'montage : le mur doit tenir la fenêtre mesurée');

  // Et l'arrêt lève avec sa cause, ici aussi : le Merlon tombe au tick 122.
  jouer(etat, 39);
  assert.equal(mur().vivant, false, 'montage : le mur devait tomber au tick 122');
  jouer(etat, 1);
  assert.equal(perceurs.rangeeMilli, 4580, 'elle ne repart pas une fois le mur détruit');
});

// ---------------------------------------------------------------------------
// ARRÊT T4 — une anti-véhicule s'arrête POUR une artillerie
// ---------------------------------------------------------------------------

test('ARRÊT T4 — une anti-véhicule s\'arrête pour une artillerie (arbitrage du 06/09)', () => {
  // ⚠⚠ CE TEST EST RETOURNÉ, ET IL A ÉTÉ VU ROUGE AVANT DE L'ÊTRE — LOT
  // COLONNE. Il assertait l'INVERSE : « elle ne s'arrête plus pour une
  // artillerie », qui était la conséquence de l'arbitrage du 04/09 remplaçant
  // la colonne par le genre. Ethan, 06/09 : « ajouter l'arrêt sur prédilection
  // EN PLUS du bâtiment ». L'exclusion qu'il avait posée le 04/09 nomme
  // « merlon et tourelles » ; `estStructureDefensive` la tient au COUPLE
  // `genre === 'defense'` ET `colonneMatrice === 'structureOuAviation'`, qui
  // désigne exactement les murs, les barrières et les tourelles. **Une
  // artillerie n'y est pas** — c'est une conséquence DÉCLARÉE de la lecture du
  // lot, et une ligne suffit à la renverser si Ethan tranche autrement.
  //
  // ⚠ LES TROIS ARTILLERIES SONT DES VÉHICULES SANS ÊTRE DES BLINDÉS : leur
  // châssis est nul, c'est `COLONNE_PAR_TYPE_DEFENSE` qui les range en
  // `vehicule`. La Carapace, dont la prédilection est `vehicule`, s'arrête donc
  // pour elles.
  const etat = creerCombat(montage({
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'harpon', rangee: 6, colonne: 6 }],
    vagues: [[{ id: 'carapace', colonne: 5 }]],
  }));
  const carapace = assaillant(etat);
  assert.equal(DEFENSES.harpon.type, 'artillerie');
  assert.equal(DEFENSES.harpon.degats.infanterie, 0, 'montage : le Harpon ne doit pas riposter');
  // La prédilection est la colonne de dégâts DOMINANTE — on la recalcule sur la
  // table plutôt que d'écrire « vehicule », qui ne dirait pas d'où ça vient.
  const dominante = (degats) => Object.entries(degats)
    .reduce((m, [c, v]) => (v > (degats[m] ?? -1) ? c : m), null);
  assert.equal(dominante(UNITES.carapace.degats), 'vehicule',
    'montage : la prédilection doit correspondre à la colonne de l\'artillerie');

  jouer(etat, 50);
  assert.equal(cibleDe(etat, carapace), 'harpon', 'montage : l\'artillerie doit être visée');
  const depart = carapace.rangeeMilli;

  // ⚠⚠ LA FENÊTRE EST BORNÉE PAR LA MORT DE LA CIBLE, ET C'EST CE QUI L'A FAIT
  // TOMBER AU PREMIER JET. Mesuré : la Carapace se fige au tick 50 et repart au
  // 69 — parce qu'elle a TUÉ le Harpon, pas parce que la règle a lâché. Un
  // montage qui jouerait vingt ticks de trop mesurerait la reprise et
  // conclurait que l'arrêt ne marche pas. On mesure DANS la fenêtre, et on
  // asserte que la cible est encore debout à la fin.
  jouer(etat, 15);
  assert.equal(carapace.rangeeMilli - depart, 0,
    'elle a continué d\'avancer devant l\'artillerie qu\'elle vise');
  assert.equal(etat.entites.find((e) => e.id === 'harpon').vivant, true,
    'le Harpon est tombé pendant la fenêtre : la mesure ne vaut rien');

  // Falsifiable : sans le tir, il n'y a pas d'arrêt — la garde `aTire` d'abord.
  assert.equal(carapace.aTire, true, 'montage : elle doit tirer pour s\'arrêter');

  // ⚠ ET LA SCÈNE DOIT AVANCER SANS LA RÈGLE, sinon le test passerait sur une
  // unité déjà bloquée : elle montait de 60 milli-cases par tick jusqu'ici.
  assert.ok(depart > 2000 + 40 * UNITES.carapace.vitesse,
    'montage : elle n\'a pas avancé avant d\'acquérir sa cible');
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

  // ⚠⚠ LE CONTACT A CHANGÉ D'ENDROIT ET DE TICK AU LOT MUR, ET C'EST LE POINT 2.
  // AVANT : le Broyeur montait jusqu'à 5 960 — le bord de sa case, 4 700 + 14 ×
  // 90 — au tick 44, et forçait à partir du 45. APRÈS : il ENTRE dans la case 5
  // au tick 34, à 5 060, puis se RANGE à 5 000 au tick 35, où tombe le premier
  // forçage. On relève donc au 34 : un relevé pris au 35 trouve déjà vingt mille
  // milli-PV d'écart, et c'est ce qui avait fait tomber le premier jet de ce
  // test.
  //
  // ⚠⚠⚠ ET CE TEST EST LE CANARI DU PIÈGE DE L'ÉCRASEUR. Le lot MUR range
  // l'unité sur sa case : `caseDestination` revaut alors `rangee`, si bien que
  // `structureForcee` chercherait la structure SOUS l'unité et que `peutAvancer`
  // la dirait « progressante » pour toujours. L'une ou l'autre moitié oubliée,
  // l'écart mesuré plus bas vaut ZERO et la brèche ne s'ouvre plus — en silence.
  jouer(avec, 34);
  jouer(sans, 34);
  assert.equal(uniteDe(avec).rangeeMilli, 5060, 'montage : le porteur n\'est pas au contact');
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

  // Et le porteur est RANGÉ sur sa case, au millième : 5 000, là où il fluait
  // jusqu'à 5 960 avant le lot.
  assert.equal(uniteDe(avec).rangeeMilli, 5000);
  assert.equal(uniteDe(avec).rangeeMilli % MILLI_PAR_CASE, 0,
    'le porteur flue encore dans la case du mur');
  assert.equal(uniteDe(avec).ticksInutiles, 0, 'le compteur de repli est monté alors qu\'elle force');
});

// ---------------------------------------------------------------------------
// ARRÊT T8 — et elle ne se replie pas
// ---------------------------------------------------------------------------

test('ARRÊT T8 — devant un mur bloquant, aucune ne se replie', () => {
  // ⚠⚠ C'EST LE TEST QUE LE LOT ARRÊT EXISTAIT POUR ÉCRIRE, et il porte sur les
  // DEUX pièces — celle qui force et celle qui ne fait que tirer. Son brief
  // posait `structureForcee` comme le mécanisme qui retient l'unité ; mesuré, il
  // ne couvre QUE les porteurs de l'Écraseur. Ce qui retient les vingt-deux
  // autres est `nuit(e)`, c'est-à-dire `aTire` : elles tirent sur le mur, donc
  // leur compteur de repli est remis à zéro à chaque tick.
  //
  // ⚠⚠ ET LE LOT MUR SÉPARE LES DEUX PIÈCES SANS TOUCHER À LA CONCLUSION : elles
  // ne se replient toujours pas, mais elles ne s'arrêtent plus au même endroit ni
  // pour la même raison. Le Broyeur n'est PAS anti-structure : il va jusqu'à la
  // case devant le mur et s'y RANGE — 5 000, point 2. Les Perceurs le sont : ils
  // gèlent à PORTÉE, dès l'acquisition — 4 520, point 3 — et n'atteignent jamais
  // le contact. Deux nombres, donc, là où le test n'en attendait qu'un.
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

  for (const [id, modules, arret] of [
    ['broyeur', ['ecraseur'], 5000], ['perceurs', [], 4520],
  ]) {
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
    assert.equal(bloquee, arret, `${id} : la pièce ne s'arrête pas où le lot MUR l'attend`);
    assert.equal(bloquee % MILLI_PAR_CASE === 0, id === 'broyeur',
      `${id} : le rangement doit porter sur la pièce BLOQUÉE, pas sur celle qui s'arrête à portée`);
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

  // Latéralement, donc : une TOURELLE en colonne 6 contre une unité en colonne
  // 5. Elle est à portée, elle est visée, elle tire — et l'unité passe.
  //
  // ⚠⚠ LE MONTAGE CHANGE D'ENTITÉ AU LOT COLONNE, ET C'EST UNE CORRECTION, PAS
  // UN CONTOURNEMENT. Il portait un `harpon`, qui est une ARTILLERIE : le test
  // s'intitulait « aucune tourelle ne retient plus » et n'en montait aucune.
  // Depuis l'arbitrage du 06/09 la distinction MORD — une artillerie est de la
  // colonne `vehicule`, donc de la prédilection du Fendeur, donc elle l'arrête
  // (`ARRÊT T4`) ; une tourelle est `structureOuAviation` ET de genre
  // `defense`, donc exclue, donc elle ne l'arrête pas. Le test mesure
  // désormais ce que son titre annonce, et il tombe si l'exclusion saute.
  const etat = creerCombat(montage({
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'creneau', rangee: 6, colonne: 6 }],
    vagues: [[{ id: 'fendeur', colonne: 5 }]],
  }));
  const fendeur = assaillant(etat);
  assert.equal(DEFENSES.creneau.type, 'tourelle', 'montage : il faut une TOURELLE');
  // Une tourelle est rangée `structureOuAviation` par `COLONNE_PAR_TYPE_DEFENSE`
  // — c'est la moitié du couple qui l'exclut de l'arrêt sur prédilection.
  assert.equal(DEFENSES.creneau.bloque, true, 'montage : elle doit bloquer la colonne voisine ?');
  jouer(etat, 35);
  assert.equal(cibleDe(etat, fendeur), 'creneau', 'montage : la tourelle doit être visée');
  assert.equal(fendeur.aTire, true, 'montage : sans tir, l\'arrêt ne se pose même pas');
  const r = fendeur.rangeeMilli;
  jouer(etat, 10);
  assert.equal(fendeur.rangeeMilli, r + 10 * UNITES.fendeur.vitesse, 'elle s\'est arrêtée');
});

// ---------------------------------------------------------------------------
// ARRÊT T10 — `colonnePredilection` n'est pas devenu un champ mort
// ---------------------------------------------------------------------------

test('ARRÊT T10 — `colonnePredilection` garde ses HUIT lecteurs', () => {
  // ⚠ LE BRIEF DU LOT ARRÊT LE DEMANDAIT PAR GREP, ET C'EST LA BONNE FORME : un
  // champ qu'on laisserait sans lecteur serait un commentaire menteur en
  // puissance. Le compte SE RESSERRE au lot COLONNE, il ne s'assouplit pas — le
  // champ gagne deux lecteurs au lieu d'en perdre un.
  //
  // ⚠⚠ ET LE MOTIF DE CE TEST S'EST RENVERSÉ AVEC L'ARBITRAGE. Il gardait la
  // DISPARITION de la prédilection dans `doitSArreter` — la conséquence du
  // 04/09 —, et il assertait de face que la règle d'arrêt « ne lit plus la
  // colonne ». Ethan la rétablit le 06/09, « EN PLUS du bâtiment » : ce qui est
  // gardé désormais, c'est que les deux moitiés COHABITENT, le genre pour le
  // bâtiment et la colonne pour la prédilection.
  const code = sansCommentaires(readFileSync(join(RACINE, 'src/sim/combat.js'), 'utf8'));
  const lectures = code.match(/[\w.]*colonnePredilection/g) ?? [];
  // Onze occurrences : trois écritures de profil, et huit lectures — une pour
  // la munition spéciale et sa garde de nullité (2), deux pour le camouflage,
  // deux pour `doitSArreter` (garde puis comparaison), deux pour
  // `cibleDuDecalage` (garde puis comparaison).
  assert.equal(lectures.length, 11, `occurrences trouvées : ${lectures.join(', ')}`);
  assert.ok(code.includes('pc.colonneMatrice !== p.colonnePredilection'),
    'la munition spéciale ne lit plus la prédilection');
  assert.ok(code.includes('profil(c).colonneMatrice !== p.colonnePredilection'),
    'le camouflage ne lit plus la prédilection');

  // ⚠⚠ ET LA COMPARAISON EST ÉCRITE DANS LE SENS QUI PROTÈGE DU `null`,
  // PARTOUT : `p.colonnePredilection === pc.colonneMatrice` seul serait VRAI si
  // les deux valaient `null`, et une entité qui ne tire pas porte `null`. La
  // garde de nullité vient d'abord, et cette forme-là reste interdite.
  assert.equal(code.includes('p.colonnePredilection === pc.colonneMatrice'), false,
    'une comparaison de prédilection est écrite sans garde de nullité');

  // La règle d'arrêt lit le GENRE — la seule grandeur qui sépare un mur d'un
  // bâtiment — ET la colonne, désormais SANS exclusion.
  const regle = code.match(/function doitSArreter[\s\S]*?\n}/);
  assert.ok(regle !== null, 'doitSArreter est introuvable');
  assert.ok(regle[0].includes("genre === 'batiment'"), 'la règle d\'arrêt ne lit pas le genre');
  assert.ok(regle[0].includes('comportementAerien'), 'la garde aérienne a disparu');
  assert.ok(regle[0].includes('e.aTire'), 'la garde du tir a disparu');
  assert.ok(regle[0].includes('p.colonnePredilection === null'),
    'la garde de nullité de la prédilection a disparu de la règle d\'arrêt');
  // ⚠⚠ ET LA GARDE DE L'EXCLUSION SE RETOURNE, ELLE NE DISPARAÎT PAS — 10/09.
  // Elle EXIGEAIT `estStructureDefensive(pc)` dans la règle ; elle INTERDIT
  // désormais que le nom reparaisse dans le code. C'est ce qui attrapera le lot
  // futur qui « rétablirait » l'exclusion en croyant réparer une régression : le
  // 04/09 demandait de ne pas s'arrêter devant un mur, le 10/09 demande le
  // contraire, les deux viennent d'Ethan, et la plus récente fait foi.
  //
  // ⚠ LE BALAYAGE PORTE SUR LA SOURCE SANS SES COMMENTAIRES, et c'est ce qui
  // permet au bloc de `doitSArreter` de RACONTER l'exclusion retirée sans faire
  // tomber sa propre garde. Une prose qui explique un motif interdit est le
  // piège que `documentation.test.js` documente depuis le 26/08.
  assert.equal(code.includes('estStructureDefensive'), false,
    'l\'exclusion du 04/09 est revenue dans le code : le 10/09 la renverse');

  // Et la seconde branche conclut SANS CONDITION : la prédilection suffit, il
  // n'y a plus de « sauf » après elle. Un `!quelqueChose(pc)` remis à la place
  // du `return true;` final fait tomber cette ligne, même sous un autre nom.
  assert.ok(/return true;\n}$/.test(regle[0]),
    'la règle ne conclut plus sans condition : une exclusion a été rajoutée');

  // ⚠ LE COMPTE DE LECTEURS NE BOUGE PAS, ET LE BRIEF SE TROMPAIT DESSUS : il
  // annonçait que `colonnePredilection` « en perdrait un si l'exclusion part ».
  // Mesuré : `estStructureDefensive` lisait `genre` et `colonneMatrice`, jamais
  // `colonnePredilection`. Les onze occurrences assertées plus haut sont les
  // mêmes avant et après le lot.
});
