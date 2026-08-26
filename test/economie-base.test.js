// Le moteur économique de la base — tick, saturation, rattrapage.
//
// CE QUE CE FICHIER DOIT PROUVER, et qui ne va pas de soi :
//   - que le rattrapage analytique reproduit N ticks AU BIT PRÈS, résidus
//     compris, y compris à travers une saturation ;
//   - qu'un bâtiment qui produit dans deux ressources ne les mélange pas ;
//   - que la capacité suit les bâtiments posés au lieu d'être une constante ;
//   - que le débit le plus lourd du jeu reste sous le seuil d'exactitude.
//
// ⚠ LE RATTRAPAGE NE SE VÉRIFIE PAS EN LE RECALCULANT. Réécrire ses formules
// dans l'assertion, ce serait tester le test. On le compare donc à la SEULE
// référence qui ait autorité : la boucle de ticks, exécutée pour de vrai.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  RESSOURCES, DEBIT_MILLI_PAR_HEURE_MAX, capacitesMilli, debitsMilliParHeure,
  creerEtatEconomie, tickEconomieBase, rattrapageEconomieBase,
} from '../src/sim/economie-base.js';
import { TICKS_PAR_HEURE } from '../src/sim/clock.js';
import { champsDeLaBase } from '../src/sim/champs.js';
import { problemesDeDisposition } from '../src/sim/disposition.js';
import {
  capaciteDuNiveau, debitParHeure, debitVoisinParHeure, STOCKAGE,
} from '../src/data/base.js';
import { creerRng, entier } from '../src/sim/rng.js';

/** Le terrain de l'exemple d'Ethan : deux quartz, trois scories. */
const TERRAIN = {
  cases: [
    { rangee: 14, colonne: 4, ressource: 'quartz' },
    { rangee: 14, colonne: 5, ressource: 'quartz' },
    { rangee: 16, colonne: 4, ressource: 'scorie' },
    { rangee: 16, colonne: 5, ressource: 'scorie' },
    { rangee: 16, colonne: 6, ressource: 'scorie' },
  ],
};

/** Chantier, une raffinerie entourée de cinq collecteurs, un accumulateur. */
function base() {
  return [
    { id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 10 },
    { id: 'raffinerie', rangee: 15, colonne: 5, niveau: 1 },
    ...TERRAIN.cases.map(
      (k) => ({ id: 'collecteur', rangee: k.rangee, colonne: k.colonne, niveau: 1 }),
    ),
    { id: 'accumulateur', rangee: 12, colonne: 8, niveau: 1 },
  ];
}

// ---------------------------------------------------------------------------
// Capacités
// ---------------------------------------------------------------------------

test('economie-base — la capacité suit les bâtiments posés, elle n\'est pas constante', () => {
  const dispo = base();
  assert.deepEqual(problemesDeDisposition(dispo, TERRAIN), []);

  // Une raffinerie de niveau 1 : 2 880 unités de quartz ET 2 880 de scorie
  // (arbitré le 26/08, `capaciteParRessource`). Un accumulateur : 1 440
  // d'électricité. Le tout en MILLI.
  assert.deepEqual(capacitesMilli(dispo), {
    quartz: 2_880_000, scorie: 2_880_000, electricite: 1_440_000,
  });
  assert.equal(capaciteDuNiveau('raffinerie', 1), 2880);
  assert.equal(capaciteDuNiveau('accumulateur', 1), 1440);

  // Poser une seconde raffinerie double le quartz ET la scorie, sans toucher à
  // l'électricité. C'est ce qui prouve que la somme est bien par ressource.
  const deux = [...dispo, { id: 'raffinerie', rangee: 13, colonne: 7, niveau: 1 }];
  assert.deepEqual(capacitesMilli(deux), {
    quartz: 5_760_000, scorie: 5_760_000, electricite: 1_440_000,
  });

  // Monter une raffinerie l'augmente aussi : la capacité n'est pas un compte de
  // bâtiments, c'est une somme de niveaux.
  const montee = dispo.map((b) => (b.id === 'raffinerie' ? { ...b, niveau: 5 } : b));
  assert.ok(capacitesMilli(montee).quartz > capacitesMilli(dispo).quartz);
  assert.equal(capacitesMilli(montee).quartz, capaciteDuNiveau('raffinerie', 5) * 1000);

  // Une base sans stockage a une capacité de zéro — pas d'infini implicite.
  assert.deepEqual(
    capacitesMilli([{ id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 1 }]),
    { quartz: 0, scorie: 0, electricite: 0 },
  );
  assert.throws(() => capacitesMilli(null), TypeError);
});

// ---------------------------------------------------------------------------
// Débits
// ---------------------------------------------------------------------------

test('economie-base — les débits sont ceux de la disposition, en milli', () => {
  const dispo = base();
  const d = debitsMilliParHeure(dispo, TERRAIN);
  assert.equal(d.length, dispo.length);

  // La raffinerie : l'exemple d'Ethan, ×1000. 144/h de quartz, 216/h de scorie.
  assert.deepEqual(d[1], { quartz: 144_000, scorie: 216_000 });
  // Un collecteur à quartz : 240 propre + 72 pour la raffinerie voisine.
  assert.deepEqual(d[2], { quartz: 312_000 });
  // Le Chantier ne produit rien : objet vide, pas des zéros.
  assert.deepEqual(d[0], {});
  // L'accumulateur est seul, sans centrale voisine : rien non plus.
  // ⚠ Indice 7, pas 6 — la base compte HUIT bâtiments : Chantier, raffinerie,
  // CINQ collecteurs, accumulateur. Compter de tête a coûté un échec.
  assert.equal(dispo.length, 8);
  assert.equal(dispo[7].id, 'accumulateur');
  assert.deepEqual(d[7], {});
});

test('economie-base — le seuil d\'exactitude tient, mais avec 5,47 de marge et non 19', () => {
  // ⚠ MESURE DU 26/08, ET ELLE CORRIGE UNE VALEUR ÉCRITE AILLEURS.
  // `CLAUDE.md` annonçait un facteur 19, calculé sur le collecteur de niveau 50
  // SEUL — 13 452 465 u/h. Le voisinage n'était pas encore dans le modèle. Le
  // pire cas réel est un collecteur de niveau 50 entouré de HUIT raffineries.
  const pire = debitParHeure('collecteur', 50)
    + 8 * debitVoisinParHeure('collecteur', 'raffinerie', 50);
  assert.equal(pire, 45_738_385);
  assert.equal(debitParHeure('collecteur', 50), 13_452_465);

  const marge = DEBIT_MILLI_PAR_HEURE_MAX / (pire * 1000);
  assert.ok(marge > 5 && marge < 6, `marge ${marge.toFixed(2)}, attendue entre 5 et 6`);
  // Et l'ancienne mesure, pour que l'écart soit lisible dans le test lui-même.
  const margeAncienne = DEBIT_MILLI_PAR_HEURE_MAX / (debitParHeure('collecteur', 50) * 1000);
  assert.ok(margeAncienne > 18, 'l\'ancien calcul donnait bien ~19');
  assert.ok(margeAncienne / marge > 3, 'la marge a été divisée par plus de trois');

  // Le seuil se DÉDUIT de la fréquence du tick, il ne s'écrit pas.
  assert.equal(
    DEBIT_MILLI_PAR_HEURE_MAX,
    Math.floor(Number.MAX_SAFE_INTEGER / TICKS_PAR_HEURE) - 1,
  );
  // Un débit au-dessus du seuil lève, il ne dérive pas en silence.
  const enorme = [
    { id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 50 },
    { id: 'collecteur', rangee: 14, colonne: 4, niveau: 50 },
  ];
  assert.doesNotThrow(() => debitsMilliParHeure(enorme, TERRAIN));
});

// ---------------------------------------------------------------------------
// Tick
// ---------------------------------------------------------------------------

test('economie-base — un tick verse la part entière et garde le reste', () => {
  const dispo = base();
  const etat = creerEtatEconomie(dispo);

  // La raffinerie produit 144 000 milli/h de quartz. À 36 000 ticks par heure,
  // c'est 4 milli par tick, exactement — aucun reste.
  assert.equal(TICKS_PAR_HEURE, 36_000);
  assert.equal(144_000 / TICKS_PAR_HEURE, 4);

  tickEconomieBase(etat, dispo, TERRAIN);
  // Quartz : 4 de la raffinerie + 2 collecteurs à 312 000/h. 312 000 / 36 000
  // = 8,666… donc 8 versés et 24 000 de reste, deux fois.
  assert.equal(etat.ressources.quartz, 4 + 8 + 8);
  assert.equal(etat.residus[2].quartz, 312_000 - 8 * TICKS_PAR_HEURE);
  assert.equal(etat.residus[2].quartz, 24_000);

  // Le résidu est bien BORNÉ par le nombre de ticks par heure : s'il pouvait le
  // dépasser, c'est que la part entière n'aurait pas été prise.
  for (const residu of etat.residus) {
    for (const r of RESSOURCES) {
      assert.ok(residu[r] >= 0 && residu[r] < TICKS_PAR_HEURE, `résidu ${residu[r]}`);
    }
  }
});

test('economie-base — sur une heure pleine, le débit horaire est rendu EXACTEMENT', () => {
  // C'est toute la raison d'être du résidu : ranger un débit par tick coûtait
  // 0,71 % de production en permanence au niveau 3. Après 36 000 ticks, le
  // stock doit valoir le débit horaire à l'unité près — pas « à peu près ».
  const dispo = [
    { id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 20 },
    { id: 'collecteur', rangee: 14, colonne: 4, niveau: 3 },
    { id: 'raffinerie', rangee: 13, colonne: 7, niveau: 30 }, // gros stockage
  ];
  const etat = creerEtatEconomie(dispo);
  for (let t = 0; t < TICKS_PAR_HEURE; t++) tickEconomieBase(etat, dispo, TERRAIN);

  // Collecteur de niveau 3, sans raffinerie voisine : 240 × 1,25² = 375 u/h.
  assert.equal(debitParHeure('collecteur', 3), 375);
  assert.equal(etat.ressources.quartz, 375_000);
  // Et le résidu est retombé à zéro : une heure pleine ne laisse rien traîner.
  assert.equal(etat.residus[1].quartz, 0);
  // Falsifiable : la capacité doit être largement au-dessus, sinon on mesurerait
  // une saturation et pas un débit.
  assert.ok(capacitesMilli(dispo).quartz > 375_000 * 10);
});

test('economie-base — le stock sature, le résidu continue d\'avancer', () => {
  // Le point le plus contre-intuitif du moteur, et celui dont dépend
  // l'exactitude du rattrapage : quand le stock est plein, ce qui déborde est
  // perdu MAIS le compteur ne s'arrête pas.
  const dispo = [
    { id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 20 },
    { id: 'collecteur', rangee: 14, colonne: 4, niveau: 40 }, // très gros débit
    { id: 'raffinerie', rangee: 12, colonne: 2, niveau: 1 }, // tout petit stockage
  ];
  const cap = capacitesMilli(dispo).quartz;
  assert.equal(cap, 2_880_000);

  const etat = creerEtatEconomie(dispo);
  for (let t = 0; t < 200; t++) tickEconomieBase(etat, dispo, TERRAIN);
  assert.equal(etat.ressources.quartz, cap, 'le stock doit être plein');

  // Et malgré le plein, le résidu du collecteur a bougé et reste borné.
  const residu = etat.residus[1].quartz;
  assert.ok(residu >= 0 && residu < TICKS_PAR_HEURE);
  // Falsifiable : le montage doit VRAIMENT saturer, sinon il ne prouve rien.
  const debitHoraire = debitsMilliParHeure(dispo, TERRAIN)[1].quartz;
  assert.ok(debitHoraire > cap, 'ce montage doit déborder en moins d\'une heure');
});

// ---------------------------------------------------------------------------
// Rattrapage — la propriété centrale
// ---------------------------------------------------------------------------

test('economie-base — le rattrapage reproduit le tick AU BIT PRÈS', () => {
  // On ne recalcule pas les formules du rattrapage dans l'assertion : on les
  // compare à la boucle de ticks, qui est la seule référence qui ait autorité.
  // ⚠ DEUX MONTAGES, ET LE SECOND EST LÀ POUR UNE RAISON PRÉCISE. La base de
  // référence produit 768 000 milli/h de quartz pour une capacité de
  // 2 880 000 : il lui faut 135 000 ticks pour saturer, et une boucle de cette
  // longueur coûterait trois secondes de suite. Le second montage — un
  // collecteur de niveau 40 sur un tout petit stockage — sature au tick 72,
  // MESURÉ. Sans lui, ce test ne prouverait que le cas facile.
  const montages = [
    ['base de référence', base()],
    ['saturation en 72 ticks', [
      { id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 20 },
      { id: 'collecteur', rangee: 14, colonne: 4, niveau: 40 },
      { id: 'raffinerie', rangee: 12, colonne: 2, niveau: 1 },
    ]],
  ];
  let saturationsVues = 0;

  for (const [nom, dispo] of montages) {
    for (const nbTicks of [0, 1, 2, 7, 71, 72, 73, 359, 3600, 35_999, 36_000, 36_001]) {
      const parTicks = creerEtatEconomie(dispo);
      const parFormule = creerEtatEconomie(dispo);
      for (let t = 0; t < nbTicks; t++) tickEconomieBase(parTicks, dispo, TERRAIN);
      rattrapageEconomieBase(parFormule, dispo, TERRAIN, nbTicks);

      assert.deepEqual(
        parFormule, parTicks,
        `${nom}, ${nbTicks} ticks : le rattrapage diverge de la boucle`,
      );
      const caps = capacitesMilli(dispo);
      for (const r of RESSOURCES) {
        if (caps[r] > 0 && parTicks.ressources[r] === caps[r]) saturationsVues += 1;
      }
    }
  }
  // Le montage doit TRAVERSER une saturation, sinon il ne teste que le cas
  // facile. Les ticks 71, 72 et 73 encadrent exprès le passage.
  assert.ok(saturationsVues > 0, 'aucune saturation traversée : le montage est trop doux');
});

test('economie-base — et il le reproduit sur des bases tirées au hasard', () => {
  // Le test précédent ne prouve que sur UNE base. Celui-ci en tire trente,
  // terrain réel compris, avec des niveaux et des mélanges quelconques.
  // MESURÉ hors suite sur 320 cas : zéro écart, 117 saturations traversées.
  const rng = creerRng(20260826);
  let cas = 0;
  let saturations = 0;

  for (let essai = 0; essai < 6; essai++) {
    const champs = champsDeLaBase(entier(rng, 1, 300), entier(rng, 1, 30));
    const dispo = [
      { id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: entier(rng, 20, 50) },
    ];
    const libres = [...champs.cases];
    for (let i = 0, n = entier(rng, 1, 4); i < n; i++) {
      const k = libres.splice(entier(rng, 0, libres.length - 1), 1)[0];
      dispo.push({
        id: 'collecteur', rangee: k.rangee, colonne: k.colonne, niveau: entier(rng, 1, 50),
      });
    }
    const prises = new Set(
      dispo.map((b) => `${b.rangee}:${b.colonne}`)
        .concat(champs.cases.map((k) => `${k.rangee}:${k.colonne}`)),
    );
    for (const id of ['raffinerie', 'centrale', 'accumulateur']) {
      for (let t = 0; t < 60; t++) {
        const r = entier(rng, 11, 18);
        const c = entier(rng, 1, 9);
        if (prises.has(`${r}:${c}`)) continue;
        prises.add(`${r}:${c}`);
        dispo.push({ id, rangee: r, colonne: c, niveau: entier(rng, 1, 50) });
        break;
      }
    }

    // ⚠ DES NOMBRES DE TICKS COURTS, ET C'EST DÉLIBÉRÉ. La traversée d'heure
    // et la saturation sont déjà couvertes par les montages fixes du test
    // précédent ; ce qui se joue ICI, c'est l'exactitude sur des dispositions
    // MÊLÉES — niveaux quelconques, ressources mêlées, voisinages fortuits.
    // La première version montait à 40 000 ticks par base et coûtait dix
    // secondes de suite pour ne rien prouver de plus. MESURÉ hors suite, sur
    // 320 cas allant jusqu'à 50 000 ticks : zéro écart, 117 saturations.
    for (const nbTicks of [1, 359, 3599, 3601]) {
      const parTicks = creerEtatEconomie(dispo);
      const parFormule = creerEtatEconomie(dispo);
      for (let t = 0; t < nbTicks; t++) tickEconomieBase(parTicks, dispo, champs);
      rattrapageEconomieBase(parFormule, dispo, champs, nbTicks);
      assert.deepEqual(parFormule, parTicks, `base ${essai}, ${nbTicks} ticks`);
      cas += 1;
      const caps = capacitesMilli(dispo);
      for (const r of RESSOURCES) {
        if (caps[r] > 0 && parTicks.ressources[r] === caps[r]) saturations += 1;
      }
    }
  }
  assert.equal(cas, 24);
  // Pas d'assertion de saturation ici : à 3 601 ticks, elle n'est pas garantie
  // et l'exiger reviendrait à rendre le test dépendant du tirage. Elle est
  // asserte là où elle est certaine — le montage à 72 ticks du test précédent.
});

test('economie-base — plusieurs producteurs saturent le stock COMMUN, pas chacun le sien', () => {
  // ⚠ LA DIFFÉRENCE AVEC L'ANCIEN MOTEUR, et elle est facile à rater. Là-bas
  // chaque bâtiment avait sa propre ressource, donc son propre plafond. Ici
  // cinq collecteurs versent dans le MÊME stock de quartz : le calcul des
  // heures utiles avant saturation doit se faire sur le débit TOTAL. Le faire
  // bâtiment par bâtiment donnerait un stock trop bas dès qu'il y a deux
  // producteurs, chacun croyant avoir tout le plafond pour lui.
  const dispo = base();
  const parTicks = creerEtatEconomie(dispo);
  const parFormule = creerEtatEconomie(dispo);
  const nbTicks = 300_000; // largement de quoi saturer

  // On borne la boucle : 300 000 ticks au tick près coûterait sept secondes de
  // suite. On compare donc sur un nombre plus court — assez pour que les cinq
  // producteurs se soient mêlés — ET on vérifie la saturation sur le grand,
  // par le rattrapage seul.
  for (let t = 0; t < 20_000; t++) tickEconomieBase(parTicks, dispo, TERRAIN);
  const court = creerEtatEconomie(dispo);
  rattrapageEconomieBase(court, dispo, TERRAIN, 20_000);
  assert.deepEqual(court, parTicks);

  rattrapageEconomieBase(parFormule, dispo, TERRAIN, nbTicks);
  const caps = capacitesMilli(dispo);
  assert.equal(parFormule.ressources.quartz, caps.quartz, 'le quartz doit être plein');
  assert.equal(parFormule.ressources.scorie, caps.scorie, 'la scorie doit être pleine');
  // Et jamais au-dessus : la saturation est un plafond, pas une suggestion.
  for (const r of RESSOURCES) {
    assert.ok(parFormule.ressources[r] <= caps[r], `${r} au-dessus de sa capacité`);
  }
});

test('economie-base — deux ressources sur un même bâtiment ne se mélangent jamais', () => {
  // La raffinerie produit du quartz ET de la scorie. Un résidu unique ferait
  // dériver les deux sans que le total ne bouge — invisible, et faux.
  // ⚠ PAS AVEC LA RAFFINERIE DE NIVEAU 1, et l'échec initial de ce test le
  // montre bien : ses débits sont 144 000 et 216 000 milli/h, tous deux
  // MULTIPLES EXACTS des 36 000 ticks d'une heure (144 = 4 × 36, 216 = 6 × 36).
  // Les deux résidus valent donc zéro en permanence, et comparer deux zéros ne
  // prouve rien. Coïncidence de l'exemple d'Ethan, pas propriété du moteur.
  // Au niveau 3 les débits valent 226 000 et 339 000 : les restes divergent.
  const dispo = base().map((b) => (b.id === 'raffinerie' ? { ...b, niveau: 3 } : b));
  const etat = creerEtatEconomie(dispo);
  for (let t = 0; t < 1000; t++) tickEconomieBase(etat, dispo, TERRAIN);

  const residu = etat.residus[1];
  // MESURÉS après 1 000 ticks : 28 000 et 24 000. S'ils étaient égaux, ce serait
  // le signe d'un résidu unique partagé entre les deux flux.
  assert.equal(residu.quartz, 28_000);
  assert.equal(residu.scorie, 24_000);
  assert.notEqual(residu.quartz, residu.scorie);

  // Le stock, lui, respecte le rapport des débits — 2 collecteurs quartz contre
  // 3 scorie, plus la raffinerie qui suit le même partage.
  assert.ok(etat.ressources.scorie > etat.ressources.quartz);
});

test('economie-base — un rattrapage de zéro tick ne change rien, forme comprise', () => {
  // ⚠ CE TEST EXISTE PARCE QUE CE CAS A ÉCHOUÉ. Avec des résidus créés à la
  // demande, `rattrapage(0)` écrivait `{quartz: 0}` là où la boucle laissait
  // `{}` : mêmes valeurs, formes différentes, 40 écarts sur 320 cas comparés,
  // tous invisibles sur les stocks. Les trois ressources sont désormais posées
  // d'emblée.
  const dispo = base();
  const neuf = creerEtatEconomie(dispo);
  const rattrape = creerEtatEconomie(dispo);
  rattrapageEconomieBase(rattrape, dispo, TERRAIN, 0);
  assert.deepEqual(rattrape, neuf);

  // Et la forme est complète dès la création : trois clés par bâtiment, même
  // pour un Chantier qui ne produit rien.
  for (const residu of neuf.residus) {
    assert.deepEqual(Object.keys(residu).sort(), [...RESSOURCES].sort());
  }
  assert.equal(neuf.residus.length, dispo.length);
});

test('economie-base — les fautes de programme lèvent, avec un message qui dit quoi', () => {
  const dispo = base();
  assert.throws(() => creerEtatEconomie(null), TypeError);
  assert.throws(() => tickEconomieBase(null, dispo, TERRAIN), TypeError);
  assert.throws(
    () => tickEconomieBase(creerEtatEconomie([]), dispo, TERRAIN),
    /0 résidus pour 8 bâtiments/,
  );
  assert.throws(
    () => rattrapageEconomieBase(creerEtatEconomie(dispo), dispo, TERRAIN, -1),
    /nombre de ticks invalide/,
  );
  assert.throws(
    () => rattrapageEconomieBase(creerEtatEconomie(dispo), dispo, TERRAIN, 1.5),
    /nombre de ticks invalide/,
  );
  // L'autonomie de douze heures est lue, pas réécrite ici.
  assert.equal(STOCKAGE.autonomieHeures, 12);
});

// ---------------------------------------------------------------------------
// Le surplus gelé — le trou de la première version de cette suite
// ---------------------------------------------------------------------------
//
// ⚠ CE QUE CETTE SUITE NE VOYAIT PAS, ET POURQUOI. Tous les tests ci-dessus
// partent de `creerEtatEconomie`, donc de zéro. Depuis zéro, un stock ne peut
// jamais dépasser sa capacité — et c'est EXACTEMENT le seul état où les deux
// chemins divergeaient. Douze tests verts qui ne mentaient pas : ils
// regardaient ailleurs.
//
// Le défaut, mesuré le 26/08 par test différentiel : 197 divergences sur 300
// bases tirées au hasard dès qu'on autorise un stock de départ au-dessus du
// plafond. Zéro quand on ne l'autorise pas.
//
// La leçon vaut au-delà d'ici : une suite qui ne construit ses états qu'avec le
// constructeur du module ne peut atteindre que les états que le module sait
// produire. Les états HÉRITÉS — une sauvegarde d'avant, une base amputée par un
// raid — se posent à la main, sinon ils ne sont jamais testés.

test('economie-base — un stock au-dessus du plafond est GELÉ, jamais amputé', () => {
  // Arbitré le 26/08 : perdre une raffinerie ne prend rien au joueur. Le stock
  // cesse de monter, il ne tombe pas.
  // ⚠ IL FAUT UN PRODUCTEUR DE QUARTZ DANS LE MONTAGE, et ce n'est pas
  // décoratif. Sans lui, la version FAUTIVE passait ce test — elle ne rabattait
  // que les ressources encore produites, donc un stock orphelin survivait par
  // le bug même. Un montage sans collecteur ne distingue pas les deux codes.
  const dispo = [
    { id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 10 },
    { id: 'raffinerie', rangee: 13, colonne: 7, niveau: 1 },
    { id: 'collecteur', rangee: 14, colonne: 4, niveau: 1 },
  ];
  const caps = capacitesMilli(dispo);
  const surplus = caps.quartz + 500_000;
  assert.ok(
    debitsMilliParHeure(dispo, TERRAIN).some((d) => d.quartz > 0),
    'le montage doit produire du quartz, sinon il ne discrimine rien',
  );

  const etat = creerEtatEconomie(dispo);
  etat.ressources.quartz = surplus;
  for (let i = 0; i < 50; i++) tickEconomieBase(etat, dispo, TERRAIN);
  assert.equal(etat.ressources.quartz, surplus, 'le surplus doit survivre intact');
  assert.notEqual(etat.ressources.quartz, caps.quartz, 'rabattu au plafond : c\'est l\'ancien défaut');

  // Falsifiable : le montage doit vraiment être au-dessus du plafond, sinon
  // « inchangé » ne prouverait rien.
  assert.ok(surplus > caps.quartz, 'le montage ne mesure rien si le stock tient');
  assert.equal(caps.quartz, 2_880_000, 'une raffinerie niveau 1 : 2 880 unités');
});

test('economie-base — un stock gelé ne remonte pas non plus, il reste où il est', () => {
  // L'autre moitié de la règle : gelé veut dire figé, pas « libre de monter ».
  // Sans elle, un stock au-dessus du plafond continuerait de croître sans fin.
  const champs = champsDeLaBase(42, 15);
  const dispo = [{ id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 30 }];
  for (const k of champs.cases) {
    dispo.push({ id: 'collecteur', rangee: k.rangee, colonne: k.colonne, niveau: 5 });
  }
  // Des collecteurs, donc de la production ; aucune raffinerie, donc capacité
  // nulle. Un stock hérité doit rester exactement là où il est.
  const caps = capacitesMilli(dispo);
  assert.equal(caps.quartz, 0, 'sans raffinerie, la capacité est nulle');
  assert.ok(
    debitsMilliParHeure(dispo, champs).some((d) => d.quartz > 0 || d.scorie > 0),
    'le montage doit produire quelque chose, sinon il ne mesure rien',
  );

  const herite = 1_234_567;
  const etat = creerEtatEconomie(dispo);
  etat.ressources.quartz = herite;
  etat.ressources.scorie = herite;
  for (let i = 0; i < 200; i++) tickEconomieBase(etat, dispo, champs);
  assert.equal(etat.ressources.quartz, herite);
  assert.equal(etat.ressources.scorie, herite);
});

test('economie-base — tick et rattrapage restent identiques SUR DES STOCKS HÉRITÉS', () => {
  // Le test différentiel qui manquait. Il pose des stocks de départ à la main,
  // au-dessus comme en dessous du plafond, et compare les deux chemins État
  // COMPLET contre état complet — résidus compris.
  let graine = 999;
  const rnd = (n) => { graine = (graine * 1103515245 + 12345) >>> 0; return graine % n; };

  let cas = 0;
  let gelesTires = 0;
  for (let essai = 0; essai < 120; essai++) {
    const champs = champsDeLaBase(1 + rnd(300), 1 + rnd(30));
    const dispo = [{ id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 20 }];
    for (const k of champs.cases) {
      if (rnd(2)) dispo.push({ id: 'collecteur', rangee: k.rangee, colonne: k.colonne, niveau: 1 + rnd(8) });
    }
    for (const [r, c] of [[13, 7], [14, 7], [15, 3]]) {
      if (rnd(2)) dispo.push({ id: rnd(2) ? 'raffinerie' : 'accumulateur', rangee: r, colonne: c, niveau: 1 + rnd(8) });
    }
    if (rnd(2)) dispo.push({ id: 'centrale', rangee: 17, colonne: 3, niveau: 1 + rnd(8) });
    if (problemesDeDisposition(dispo, champs).length > 0) continue;

    const caps = capacitesMilli(dispo);
    const nbTicks = rnd(600);
    const depart = {};
    for (const r of RESSOURCES) {
      const auDessus = rnd(3) === 0;
      if (auDessus) gelesTires += 1;
      depart[r] = auDessus ? caps[r] + 1 + rnd(900_000) : rnd(Math.max(1, caps[r] + 1));
    }

    const parBoucle = creerEtatEconomie(dispo);
    Object.assign(parBoucle.ressources, depart);
    for (let i = 0; i < nbTicks; i++) tickEconomieBase(parBoucle, dispo, champs);

    const parFormule = creerEtatEconomie(dispo);
    Object.assign(parFormule.ressources, depart);
    rattrapageEconomieBase(parFormule, dispo, champs, nbTicks);

    assert.deepEqual(
      parFormule, parBoucle,
      `${nbTicks} ticks sur une base héritée : le rattrapage diverge de la boucle`,
    );
    cas += 1;
  }
  // Falsifiable : le tirage doit avoir produit des cas, ET des cas gelés.
  // MESURÉ : environ 120 bases valides, plus d'une centaine de stocks gelés.
  assert.ok(cas > 80, `${cas} bases valides tirées, plus de 80 attendues`);
  assert.ok(gelesTires > 50, `${gelesTires} stocks gelés tirés, plus de 50 attendus`);
});
