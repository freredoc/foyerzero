// Tests T1 et T2 du brief du lot PRÉDILECTION — la cible de prédilection passe
// en tête de l'ordre de ciblage.
//
// Ethan, 13/09/2026, point 3 : « L'épervier ne s'est pas arrêté pour cibler le
// fendeur. D'autres situations comme ça ? » — OUI, douze unités sur quatorze.
// `doitSArreter` demandait déjà si la cible COURANTE est de prédilection ;
// `ciblage`, lui, élisait la plus PROCHE sans préférence. Une cible hors
// prédilection plus proche raflait donc le ciblage, et la règle d'arrêt ne
// pouvait plus jamais répondre oui.
//
// ⚠⚠ L'ARBITRAGE EST « ROUTE i » : ON CHANGE `ciblage`, PAS LA RÈGLE D'ARRÊT.
// `doitSArreter` n'a pas une ligne de changée — vérifié au diff, et gardé par
// `ARRÊT T10`, qui compte et NOMME les lecteurs de `colonnePredilection`.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { UNITES, DEFENSES, COLONNES_DEGATS, GRILLE } from '../src/data/combat.js';
import { creerCombat, tick, facteurMilli } from '../src/sim/combat.js';
import { distanceCarreeMilli, estEnApproche } from '../src/sim/grille.js';
import { montageDuBanc } from '../src/ui/banc.js';

/** La rangée d'où part une vague — dérivée de la bande, jamais écrite « 2 ». */
const DEPART = GRILLE.bandes.deploiement.derniere;

// ---------------------------------------------------------------------------
// L'oracle, recalculé depuis les DONNÉES seules — il ne doit rien devoir au
// moteur. C'est le motif de `colonneDe` / `tableDe` / `degatsAttendus` de
// `test/cible.test.js`, repris et non importé : les deux fichiers mesurent deux
// propriétés différentes du même ciblage, et un oracle partagé qui dériverait
// les ferait mentir ensemble.
// ---------------------------------------------------------------------------

const COLONNE_CHASSIS = {
  escouade: 'infanterie', blinde: 'vehicule', aeronef: 'structureOuAviation',
};
const COLONNE_TYPE_DEFENSE = {
  mur: 'structureOuAviation', barriere: 'structureOuAviation',
  tourelle: 'structureOuAviation', artillerie: 'vehicule',
};

/** La colonne dans laquelle une entité est FRAPPÉE. */
const colonneDe = (e) => (e.genre === 'batiment' ? 'structureOuAviation'
  : e.genre === 'defense' ? COLONNE_TYPE_DEFENSE[DEFENSES[e.id].type]
    : COLONNE_CHASSIS[UNITES[e.id].chassis]);

/** La table de dégâts d'une entité, en PV entiers. `null` si elle ne tire pas. */
const tableDe = (e) => (e.genre === 'batiment' ? null
  : e.genre === 'defense' ? DEFENSES[e.id].degats : UNITES[e.id].degats);

/**
 * La colonne où une entité frappe le plus fort — sa PRÉDILECTION.
 *
 * ⚠ RIEN N'EST IMPORTÉ DE `sim/combat.js` ICI : `colonneDominante` y est privée,
 * et la rejouer est précisément ce qui fait de ce fichier un oracle. Elle rend
 * `null` sur une table absente, jamais une colonne par défaut — la garde de
 * nullité du moteur en dépend.
 */
function dominante(table) {
  if (table === null) return null;
  let meilleure = null;
  let max = 0;
  for (const colonne of COLONNES_DEGATS) {
    if (table[colonne] > max) { max = table[colonne]; meilleure = colonne; }
  }
  return meilleure;
}

/** Les dégâts qu'un tir de `x` porterait à `c`, depuis les données seules. */
function degatsAttendus(x, c) {
  const table = tableDe(x);
  if (table === null) return 0;
  if (c.genre === 'batiment' && x.camp === 'attaque' && x.reserve <= 0) return 0;
  const colonneMilli = table[colonneDe(c)] * facteurMilli(x.niveau);
  const sante = Math.floor((x.pvMilli * 1000) / x.pvMaxMilli);
  return Math.floor((colonneMilli * sante) / 1000);
}

const actif = (e) => e.vivant && !e.sorti && !e.embarquee;

// ---------------------------------------------------------------------------
// PRÉDILECTION T1 — l'Épervier prend le Chasseur dès qu'il l'a à portée
// ---------------------------------------------------------------------------

test('PRÉDILECTION T1 — l\'Épervier bascule sur le Chasseur au premier tick où il est à portée, et s\'arrête', () => {
  // Le montage du §1 du brief, à la lettre. L'Épervier monte la colonne 5 ;
  // les Fusiliers lui barrent le chemin en (5, 5), le Chasseur est en (6, 6),
  // une case plus loin et en diagonale.
  //
  //   busard    : châssis aéronef, dégâts {4, 20, 12} → prédilection VÉHICULE.
  //   meute     : châssis escouade → frappée en colonne INFANTERIE.
  //   fendeur   : châssis blindé   → frappée en colonne VÉHICULE.
  //
  // ⚠ LA SOUCHE LOINTAINE EST LÀ POUR QUE LA FIN NE VIENNE PAS D'UNE GRILLE
  // VIDE, comme `GANGUE_LOINTAINE` de `cible.test.js`. Elle est en (15, 1),
  // hors de toute portée.
  const montage = {
    niveau: 1,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 15, colonne: 1, niveau: 1 }],
    defenseurs: [
      { id: 'meute', rangee: 5, colonne: 5, niveau: 1 },
      { id: 'fendeur', rangee: 6, colonne: 6, niveau: 1 },
    ],
    vagues: [[{ id: 'busard', colonne: 5, rangee: DEPART, niveau: 1 }]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] },
    },
  };

  // ⚠ LE MONTAGE PROUVE D'ABORD QU'IL MESURE UNE PRÉFÉRENCE ET NON UNE DISTANCE.
  // Sans ces deux gardes, un moteur qui n'aurait jamais changé d'ordre passerait
  // le test dès que le Chasseur se trouverait être le plus proche.
  assert.equal(dominante(UNITES.busard.degats), 'vehicule', 'la prédilection de l’Épervier');
  assert.equal(COLONNE_CHASSIS[UNITES.fendeur.chassis], 'vehicule', 'le Chasseur est frappé en véhicule');
  assert.notEqual(COLONNE_CHASSIS[UNITES.meute.chassis], 'vehicule', 'les Fusiliers ne le sont pas');

  const etat = creerCombat(montage);
  const busard = etat.entites.find((e) => e.id === 'busard');
  const meute = etat.entites.find((e) => e.id === 'meute');
  const fendeur = etat.entites.find((e) => e.id === 'fendeur');

  let bascule = null;
  let rangeeALaBascule = 0;
  let pvMeuteALaBascule = 0;
  let d2MeuteALaBascule = 0;
  let d2FendeurALaBascule = 0;
  let rangeeAvant = busard.rangeeMilli;
  const rangeesApres = [];

  for (let t = 1; t <= 60 && !etat.termine; t += 1) {
    // La photo d'AVANT le tick : le ciblage de l'étape 3 travaille sur ces
    // positions-là, le déplacement ne vient qu'à l'étape 7.
    const rDepart = busard.rangeeMilli;
    const cDepart = busard.colonneMilli;
    const pvMeuteDepart = meute.pvMilli;
    const d2Meute = distanceCarreeMilli(rDepart, cDepart, meute.rangeeMilli, meute.colonneMilli);
    const d2Fendeur = distanceCarreeMilli(rDepart, cDepart, fendeur.rangeeMilli, fendeur.colonneMilli);

    tick(etat);

    const cible = busard.cibleIndice === null ? null : etat.entites[busard.cibleIndice].id;
    if (cible === 'fendeur' && bascule === null) {
      bascule = t;
      rangeeALaBascule = rDepart;
      pvMeuteALaBascule = pvMeuteDepart;
      d2MeuteALaBascule = d2Meute;
      d2FendeurALaBascule = d2Fendeur;
    }
    if (bascule !== null) rangeesApres.push(busard.rangeeMilli);
    rangeeAvant = rDepart;
  }
  assert.ok(rangeeAvant > 0, 'le combat a bien tourné');

  // ---- LES TROIS ASSERTIONS DU §8, AU TICK DE BASCULE ----------------------

  // 1. La cible EST le Chasseur, et elle l'est au tick 16 — le PREMIER tick où
  //    il entre dans les 6 250 000 de portée de l'Épervier. Au tick 15 il était
  //    encore à 6 382 400, donc dehors.
  assert.equal(bascule, 16, `bascule au tick ${bascule} au lieu de 16`);
  assert.equal(rangeeALaBascule, 3_800, `bascule en rangée ${rangeeALaBascule} au lieu de 3 800`);

  // ⚠⚠ CONTRE-ASSERTION — LA MESURE D'AVANT LE LOT NE DOIT PAS REVENIR EN
  // SILENCE. Sur `main`, l'Épervier prenait le Chasseur au tick 35, rangée
  // 6 080 : dix-neuf ticks et 2,28 rangées plus tard, et **pas** parce qu'il
  // l'avait préféré — parce qu'il avait DOUBLÉ les Fusiliers et que le Chasseur
  // était devenu le plus proche. Un lot qui déferait l'ordre de tête repasserait
  // au vert sans elles.
  assert.notEqual(bascule, 35, 'bascule au tick 35 : l’ordre de tête a disparu, la distance décide à nouveau');
  assert.notEqual(rangeeALaBascule, 6_080, 'bascule en rangée 6 080 : c’est la mesure d’avant le lot');

  // ⚠⚠ ET C'EST BIEN UNE PRÉFÉRENCE, PAS UNE PROXIMITÉ — la moitié qui distingue
  // ce test d'un test de distance. Au tick de bascule, les Fusiliers sont
  // STRICTEMENT plus proches que le Chasseur : 1 440 000 contre 5 840 000
  // milli-cases au carré, soit 1,20 case contre 2,42. L'Épervier laisse donc
  // passer la cible la plus proche pour prendre celle qu'il frappe le mieux.
  //
  // ⚠ SUR `main`, LE RAPPORT ÉTAIT INVERSÉ, ET C'EST TOUT LE DÉFAUT : au tick 35
  // l'Épervier avait DOUBLÉ les Fusiliers — 1 166 400 contre 1 006 400 — et le
  // Chasseur était devenu le plus proche. Il ne l'a jamais préféré ; il l'a
  // rattrapé.
  assert.equal(d2MeuteALaBascule, 1_440_000, 'les Fusiliers sont à 1,20 case');
  assert.equal(d2FendeurALaBascule, 5_840_000, 'le Chasseur est à 2,42 case');
  assert.ok(d2MeuteALaBascule < d2FendeurALaBascule,
    'la cible préférée est aussi la plus proche : le test ne mesure plus qu’une distance');

  // 2. L'entité ne se déplace plus, à partir du tick de bascule et jusqu'au bout
  //    de la fenêtre. `doitSArreter` répond oui dès que la cible courante est de
  //    prédilection — l'arrêt suit le ciblage sans qu'une ligne l'y branche.
  assert.ok(rangeesApres.length >= 40, `fenêtre trop courte : ${rangeesApres.length} ticks après la bascule`);
  for (const r of rangeesApres) {
    assert.equal(r, 3_800, `l’Épervier a repris sa montée (rangée ${r}) après avoir pris le Chasseur`);
  }

  // 3. Les Fusiliers sont ENCORE VIVANTS au tick de bascule — sans quoi le test
  //    mesurerait une mort et non une préférence. Ils sont à 660 028 / 700 000,
  //    soit 94,3 % de leurs PV.
  assert.equal(pvMeuteALaBascule, 660_028, `PV des Fusiliers à la bascule : ${pvMeuteALaBascule}`);
  assert.ok(pvMeuteALaBascule > 0, 'les Fusiliers doivent être vivants à la bascule');
  assert.ok(pvMeuteALaBascule * 2 > meute.pvMaxMilli,
    'les Fusiliers doivent être largement vivants, pas agonisants');
});

// ---------------------------------------------------------------------------
// PRÉDILECTION T2 — l'invariant, sur les 54 raids du balayage
// ---------------------------------------------------------------------------

/** Les 54 raids : 3 préréglages × 3 types × 6 graines, niveau 15. */
const GRAINES = [1, 2, 3, 7, 11, 42];
function* balayage() {
  for (const assaut of ['infanterie', 'blindeLourd', 'mixte']) {
    for (const type of ['camp', 'avantPoste', 'base']) {
      for (const graine of GRAINES) {
        yield {
          nom: `${assaut}/${type}/${graine}`,
          montage: montageDuBanc({
            type, niveau: 15, saveur: type === 'base' ? null : 'richeQuartz', graine, assaut,
          }),
        };
      }
    }
  }
}

/**
 * La photo d'une entité, prise en FIN de tick.
 *
 * ⚠⚠ ET C'EST TOUT CE QUI REND CE TEST HONNÊTE. Le ciblage est l'étape 3, le
 * DÉPLACEMENT l'étape 7 : lire les positions en fin de tick compte des cibles
 * qui n'étaient pas à portée au moment où le choix a été fait. Mesuré : la
 * même boucle écrite sur l'état de fin de tick rend **366 violations** sur
 * l'arbre du lot, dont pas une n'en est une. C'est la leçon de `CIBLE T5`,
 * reprise par l'autre bout — là-bas on demande si la cible stérile SURVIT au
 * ciblage suivant, ici on juge le ciblage sur la géométrie qu'il a vue.
 */
const photo = (etat) => etat.entites.map((e) => ({
  indice: e.indice,
  camp: e.camp,
  id: e.id,
  genre: e.genre,
  niveau: e.niveau,
  vivant: e.vivant,
  sorti: e.sorti,
  embarquee: e.embarquee,
  rangeeMilli: e.rangeeMilli,
  colonneMilli: e.colonneMilli,
  pvMilli: e.pvMilli,
  pvMaxMilli: e.pvMaxMilli,
  reserve: e.reserve,
  porteeCarree: e.porteeCarree,
  porteeMiniCarree: e.porteeMiniCarree,
}));

test('PRÉDILECTION T2 — sur les 54 raids, personne ne vise hors prédilection quand une cible de prédilection est à portée', () => {
  let raids = 0;
  let ticksVises = 0;
  let modulesArmes = 0;

  for (const { nom, montage } of balayage()) {
    const etat = creerCombat(montage);
    raids += 1;
    for (const cote of ['joueur', 'ouvrage']) {
      for (const branche of ['offense', 'defense']) {
        modulesArmes += (montage.modulesDebloques?.[cote]?.[branche] ?? []).length;
      }
    }

    let avant = photo(etat);
    while (!etat.termine) {
      tick(etat);
      const parIndice = new Map(avant.map((s) => [s.indice, s]));
      for (const x of etat.entites) {
        const tireur = parIndice.get(x.indice);
        // Une entité apparue à l'étape 2 de CE tick n'est pas dans la photo :
        // son ciblage s'est fait sur une géométrie qu'on n'a pas relevée.
        if (tireur === undefined || !actif(tireur) || estEnApproche(tireur.rangeeMilli)) continue;
        if (x.cibleIndice === null) continue;
        const predilection = dominante(tableDe(tireur));
        if (predilection === null) continue;
        const cible = parIndice.get(x.cibleIndice);
        if (cible === undefined || !actif(cible)) continue;
        ticksVises += 1;
        if (colonneDe(cible) === predilection) continue;

        // La cible n'est pas de prédilection : alors aucune cible de
        // prédilection n'était VALIDE — camp adverse, active, hors de la voie
        // d'approche, dans la fourchette de portée, et blessable.
        for (const c of avant) {
          if (c.camp === tireur.camp || !actif(c) || estEnApproche(c.rangeeMilli)) continue;
          if (colonneDe(c) !== predilection) continue;
          const d2 = distanceCarreeMilli(
            tireur.rangeeMilli, tireur.colonneMilli, c.rangeeMilli, c.colonneMilli,
          );
          if (d2 > tireur.porteeCarree || d2 < tireur.porteeMiniCarree) continue;
          if (degatsAttendus(tireur, c) === 0) continue;
          assert.fail(`${nom} tick ${etat.tick} : « ${tireur.id} » vise « ${cible.id} » `
            + `(${colonneDe(cible)}) alors que « ${c.id} » (${predilection}) est à portée`);
        }
      }
      avant = photo(etat);
    }
  }

  assert.equal(raids, 54, '3 préréglages × 3 types × 6 graines');

  // ⚠ LE PLANCHER DE FALSIFIABILITÉ, à l'idiome de `CIBLE T5`. Sans lui, un
  // balayage qui cesserait de tourner — un `while` qui sortirait au premier
  // tick, un montage qui ne produirait plus d'entité — passerait au vert en ne
  // mesurant rien. 134 836 ticks-entités relevés ; le seuil est bas exprès,
  // c'est un garde-fou et non une ancre.
  assert.ok(ticksVises > 40_000, `balayage trop maigre : ${ticksVises} ticks-entités`);

  // ⚠⚠ ET LA PRÉMISSE DU CAMOUFLAGE EST DÉCLARÉE PLUTÔT QUE REJOUÉE. `ciblage`
  // masque les camouflés au camp qui DÉFEND ; l'oracle ci-dessus ne le fait pas,
  // et il n'a pas à le faire tant qu'aucun module n'est armé. Mesuré : les 54
  // montages arment ZÉRO module — `apparitionModule` du Camouflage vaut 28, les
  // sites sont de niveau 15, et `montageDuBanc` n'arme rien côté joueur. Le jour
  // où l'un d'eux en armera un, cette assertion tombera et il faudra rejouer
  // `ensembleCamoufles` ici.
  assert.equal(modulesArmes, 0,
    'un module est armé dans le balayage : l’oracle doit apprendre le camouflage');
});
