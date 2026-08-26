// Invariants de `src/data/base.js` — la base du joueur.
//
// POURQUOI CE FICHIER EXISTE. `data/base.js` existe depuis le 25/08, porte onze
// bâtiments, quatre tables de calibrage et cinq fonctions exportées, et jusqu'au
// 26/08 **aucune ligne de test ne le touchait**. `donnees.test.js` couvre
// `combat.js` et `sites.js`, pas lui. Ce n'était donc pas « un audit hors de
// npm run check » comme `verif.mjs` — c'était pire : il n'y avait pas d'audit
// du tout, et le fichier n'est importé par aucun module du jeu, si bien qu'une
// faute n'y aurait été révélée par rien.
//
// Elle y dormait d'ailleurs déjà : l'en-tête annonçait « trois bâtiments ont un
// nom d'Ouvrage » depuis un mois. Ils sont quatre. Personne n'avait compté.
//
// LES SEUILS SONT MESURÉS, jamais devinus (CLAUDE.md §5). Chaque nombre écrit
// ici a été calculé en exécutant le module avant d'écrire l'assertion, et le
// commentaire dit d'où il sort. Une égalité plutôt qu'un plancher : ajouter un
// bâtiment fera tomber le test, et c'est voulu — le changement doit être
// délibéré et visible.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  BASE_BATIMENTS, EMPLACEMENTS, GEOMETRIE_BASE, CHAMPS, COUT_NIVEAU_DEUX,
  COUT_ELECTRICITE, DEBITS, VOISINAGE, STOCKAGE, PRODUCTEUR_APPARIE,
  REPARATION_BASE_JOUEUR,
  emplacementsDuNiveau, capaciteDuNiveau, debitParHeure, debitVoisinParHeure,
  zoneDesChamps, estDansLaBase,
} from '../src/data/base.js';
import { GRILLE } from '../src/data/combat.js';
import { GEOGRAPHIE } from '../src/data/sites.js';
import { ECONOMIE_NIVEAU } from '../src/data/economie.js';

const IDS = Object.keys(BASE_BATIMENTS);

// ---------------------------------------------------------------------------
// Le roster de la base
// ---------------------------------------------------------------------------

test('base — onze bâtiments, nommés, et le dépôt de véhicules porte son nom arbitré', () => {
  // MESURÉ : 11. C'est le total annoncé par BASE-DU-JOUEUR-1.md §2 (sept du
  // lexique + Chantier + Caserne + dépôt de véhicules + aérodrome).
  assert.equal(IDS.length, 11, `${IDS.length} bâtiments, 11 attendus`);

  for (const id of IDS) {
    const b = BASE_BATIMENTS[id];
    assert.ok(
      typeof b.nom?.joueur === 'string' && b.nom.joueur.length > 0,
      `${id} : nom joueur manquant`,
    );
    assert.ok(typeof b.ta === 'string' && b.ta.length > 0, `${id} : équivalent TA manquant`);
  }

  // ARBITRÉ le 26/08 par Ethan, après que trois noms eurent coexisté dans le
  // dépôt pour ce seul bâtiment : `usine` / « Usine » (la clé), « dépôt de
  // véhicules » (le commentaire de COUT_NIVEAU_DEUX, qui avait raison) et
  // « atelier » (MODELE-REPARATION-1.md §3, corrigé le 26/08). La clé fait foi.
  assert.ok(
    Object.prototype.hasOwnProperty.call(BASE_BATIMENTS, 'depotDeVehicules'),
    'la clé du bâtiment des blindés doit être depotDeVehicules',
  );
  assert.equal(BASE_BATIMENTS.depotDeVehicules.nom.joueur, 'Dépôt de véhicules');
  assert.equal(BASE_BATIMENTS.depotDeVehicules.chassis, 'blinde');
  assert.ok(
    !Object.prototype.hasOwnProperty.call(BASE_BATIMENTS, 'usine'),
    'l\'ancienne clé `usine` ne doit plus exister',
  );
});

test('base — quatre bâtiments portent un nom d\'Ouvrage, et ce sont les bons', () => {
  // L'en-tête du fichier annonçait TROIS depuis le 25/08. MESURÉ : quatre.
  // C'est l'assertion qui a motivé ce fichier de test.
  //
  // ⚠ `hasOwnProperty` et pas `!== undefined` : la règle du projet est que
  // l'absence de clé se distingue d'une valeur vide (CLAUDE.md §6).
  const avecOuvrage = IDS.filter(
    (id) => Object.prototype.hasOwnProperty.call(BASE_BATIMENTS[id].nom, 'ouvrage'),
  );
  assert.deepEqual(
    avecOuvrage,
    ['chantierDeConstruction', 'complexeDeDefense', 'collecteur', 'raffinerie'],
    'les quatre bâtiments à pendant Ouvrage ont changé',
  );
  assert.deepEqual(
    avecOuvrage.map((id) => BASE_BATIMENTS[id].nom.ouvrage),
    ['Souche', 'Étai', 'Nœud', 'Gangue'],
  );

  // Les sept autres n'ont PAS la clé — c'est ce qui rend `hasOwnProperty`
  // capable de trancher. Sans cette moitié, le test ne mesurerait qu'un sens.
  assert.equal(IDS.length - avecOuvrage.length, 7);
});

test('base — sept bâtiments uniques, quatre libres, et le Chantier seul sans plancher de PV', () => {
  const uniques = IDS.filter((id) => BASE_BATIMENTS[id].unique === true);
  const libres = IDS.filter((id) => BASE_BATIMENTS[id].unique === false);
  // MESURÉ : 7 uniques / 4 libres. Les quatre libres sont ceux dont le nombre
  // est borné par les emplacements, pas par la règle — c'est ce qui donne son
  // intérêt au voisinage (base.js, en-tête de BASE_BATIMENTS).
  assert.equal(uniques.length, 7, `${uniques.length} bâtiments uniques, 7 attendus`);
  assert.deepEqual(libres, ['centrale', 'collecteur', 'raffinerie', 'accumulateur']);

  // MODELE-REPARATION-1.md §2 : le central est la SEULE exception au plancher.
  // Si tout planchait, le Chantier ne tomberait jamais et la sanction la plus
  // lourde du jeu ne se déclencherait pas.
  const sansPlancher = IDS.filter((id) => BASE_BATIMENTS[id].plancherPv === false);
  assert.deepEqual(sansPlancher, ['chantierDeConstruction']);
  for (const id of IDS) {
    assert.equal(
      typeof BASE_BATIMENTS[id].plancherPv, 'boolean',
      `${id} : plancherPv doit être un booléen, pas une valeur calculée`,
    );
  }
});

test('base — les trois châssis de production tombent sur ceux de combat.js', () => {
  // Une table fait foi par grandeur : les noms de châssis viennent de
  // combat.js, base.js ne fait que les référencer. Les recopier en les
  // déformant (« blindé », « véhicule ») serait invisible jusqu'au branchement.
  const parChassis = Object.fromEntries(
    IDS.filter((id) => BASE_BATIMENTS[id].chassis)
      .map((id) => [BASE_BATIMENTS[id].chassis, id]),
  );
  assert.deepEqual(parChassis, {
    escouade: 'caserne',
    blinde: 'depotDeVehicules',
    aeronef: 'aerodrome',
  });
  // MESURÉ : 3 bâtiments portent un châssis, un par châssis, sans doublon.
  assert.equal(Object.keys(parChassis).length, 3);
});

test('base — les quatre classes de coût couvrent exactement les onze bâtiments', () => {
  // MESURÉ : majeur 3 · courant 4 · modeste 2 · mineur 2 = 11.
  // C'est ce test qui empêchera un futur bâtiment d'entrer sans classe, et une
  // classe de rester dans un commentaire sans porteur — la faute exacte qui a
  // laissé « dépôt de véhicules » vivre un mois dans le commentaire de
  // COUT_NIVEAU_DEUX pendant que la clé disait `usine`.
  const compte = {};
  for (const id of IDS) {
    const c = BASE_BATIMENTS[id].classeDeCout;
    assert.ok(
      Object.prototype.hasOwnProperty.call(COUT_NIVEAU_DEUX, c),
      `${id} : classe de coût inconnue « ${c} »`,
    );
    compte[c] = (compte[c] ?? 0) + 1;
  }
  assert.deepEqual(compte, { majeur: 3, courant: 4, modeste: 2, mineur: 2 });
  // Aucune classe orpheline dans l'autre sens.
  assert.deepEqual(Object.keys(COUT_NIVEAU_DEUX).sort(), Object.keys(compte).sort());
  // Les ancrages décroissent avec la classe, et le premier niveau payant est
  // celui d'ECONOMIE_NIVEAU — pas un 2 réécrit ici.
  assert.ok(
    COUT_NIVEAU_DEUX.majeur > COUT_NIVEAU_DEUX.courant
    && COUT_NIVEAU_DEUX.courant > COUT_NIVEAU_DEUX.modeste
    && COUT_NIVEAU_DEUX.modeste > COUT_NIVEAU_DEUX.mineur,
    'les ancrages de coût doivent décroître de majeur à mineur',
  );
  assert.equal(ECONOMIE_NIVEAU.premierNiveauPayant, 2);
});

// ---------------------------------------------------------------------------
// Emplacements
// ---------------------------------------------------------------------------

test('base — emplacementsDuNiveau : deux régimes, un plafond, et le plafond mord au niveau 30', () => {
  // MESURÉS en exécutant la fonction. Les six premiers couvrent les deux
  // régimes et la charnière ; les trois derniers encadrent le plafond.
  const attendus = [
    [1, 2], [5, 10], [9, 18], [10, 20], // pas de 2 jusqu'au dixième
    [11, 21], [20, 30], [29, 39], // pas de 1 ensuite
    [30, 40], [31, 40], [50, 40], // plafond
  ];
  for (const [niveau, attendu] of attendus) {
    assert.equal(
      emplacementsDuNiveau(niveau), attendu,
      `niveau ${niveau} : ${emplacementsDuNiveau(niveau)} emplacements, ${attendu} attendus`,
    );
  }

  // Le montage doit prouver qu'il mesure quelque chose : si la fonction était
  // constante, les couples ci-dessus seraient satisfaits par hasard sur un
  // seul d'entre eux. On asserte donc la STRICTE croissance jusqu'au plafond,
  // puis la stagnation — c'est ce qui rendrait un aplatissement détectable.
  for (let n = 2; n < 30; n++) {
    assert.ok(
      emplacementsDuNiveau(n) > emplacementsDuNiveau(n - 1),
      `niveau ${n} : la courbe doit croître avant le plafond`,
    );
  }
  for (let n = 31; n <= GEOGRAPHIE.niveauPlafond; n++) {
    assert.equal(emplacementsDuNiveau(n), EMPLACEMENTS.plafond);
  }

  // Bornes : la fonction lève plutôt que de rendre une valeur douteuse.
  for (const mauvais of [0, -1, 1.5, GEOGRAPHIE.niveauPlafond + 1, NaN, '3']) {
    assert.throws(() => emplacementsDuNiveau(mauvais), /hors de|niveau/);
  }
});

test('base — le Chantier occupe un emplacement, donc il en reste UN au niveau 1', () => {
  // L'arbitrage du 25/08 et sa conséquence, assertés ensemble : c'est ce couple
  // qui fait que le deuxième bâtiment de la partie est un vrai choix.
  assert.equal(EMPLACEMENTS.chantierOccupeUnEmplacement, true);
  const libresNiveau1 = emplacementsDuNiveau(1) - 1;
  assert.equal(libresNiveau1, 1, 'un seul emplacement libre au niveau 1');

  // Et il faut le niveau 4 pour poser les sept obligatoires (7 uniques, dont le
  // Chantier lui-même) : 2 × 4 = 8 ≥ 7, alors que 2 × 3 = 6 < 7.
  const obligatoires = IDS.filter((id) => BASE_BATIMENTS[id].unique === true).length;
  assert.equal(obligatoires, 7);
  assert.ok(emplacementsDuNiveau(3) < obligatoires, 'le niveau 3 ne doit pas suffire');
  assert.ok(emplacementsDuNiveau(4) >= obligatoires, 'le niveau 4 doit suffire');
});

// ---------------------------------------------------------------------------
// Géométrie et champs — arbitrages du 26/08
// ---------------------------------------------------------------------------

test('base — la géométrie RÉFÉRENCE GRILLE, elle ne la recopie pas', () => {
  // ARBITRÉ le 26/08 : la base du joueur, une base de l'Ouvrage, un camp et un
  // avant-poste ont la MÊME géométrie. Il n'y a donc pas de grille propre au
  // joueur, et ce test existe pour qu'on n'en écrive jamais une : si quelqu'un
  // remplace ces références par des littéraux, un changement de GRILLE cessera
  // de se propager et le test tombera.
  assert.equal(GEOMETRIE_BASE.premiereRangee, GRILLE.bandes.batiments.premiere);
  assert.equal(GEOMETRIE_BASE.derniereRangee, GRILLE.bandes.batiments.derniere);
  assert.equal(GEOMETRIE_BASE.derniereColonne, GRILLE.largeur);

  // MESURÉ : rangées 11 à 18, colonnes 1 à 9 → 8 × 9 = 72 cases, et c'est le
  // `casesBatiments` que sites.js utilise déjà pour la densité de remplissage.
  const rangees = GEOMETRIE_BASE.derniereRangee - GEOMETRIE_BASE.premiereRangee + 1;
  const colonnes = GEOMETRIE_BASE.derniereColonne - GEOMETRIE_BASE.premiereColonne + 1;
  assert.equal(rangees, 8);
  assert.equal(colonnes, 9);
  assert.equal(rangees * colonnes, GRILLE.casesBatiments);
  assert.equal(rangees * colonnes, 72);

  // Le plafond d'emplacements mord TOUJOURS : 40 < 72. Trente-deux cases que le
  // Chantier n'ouvrira jamais, même au niveau 50.
  assert.ok(
    EMPLACEMENTS.plafond < GRILLE.casesBatiments,
    'le plafond d\'emplacements doit rester sous les 72 cases',
  );

  // estDansLaBase : les quatre coins dedans, les quatre débords dehors.
  assert.ok(estDansLaBase(11, 1) && estDansLaBase(11, 9));
  assert.ok(estDansLaBase(18, 1) && estDansLaBase(18, 9));
  assert.ok(!estDansLaBase(10, 5), 'la rangée 10 est la défense, pas la base');
  assert.ok(!estDansLaBase(19, 5) && !estDansLaBase(14, 0) && !estDansLaBase(14, 10));
});

test('base — les champs se tiennent à l\'intérieur : 42 cases, pas 35', () => {
  // ARBITRÉ le 26/08 : « les champs n'apparaissent jamais sur les bords de la
  // base, toujours à l'intérieur ». Ethan avait dit « sept fois cinq » de
  // mémoire — c'est l'intérieur d'un 9 × 7, l'orientation inversée. MESURÉ sur
  // GRILLE : l'intérieur d'un 8 × 9 vaut 6 × 7 = 42, rangées 12–17, colonnes 2–8.
  const z = zoneDesChamps();
  assert.deepEqual(z, {
    premiereRangee: 12,
    derniereRangee: 17,
    premiereColonne: 2,
    derniereColonne: 8,
    nombre: 42,
  });

  // Le montage est falsifiable : on asserte d'abord que la marge RETIRE bien
  // quelque chose, sinon comparer 42 à 42 ne prouverait rien.
  assert.ok(CHAMPS.margeBord >= 1, 'sans marge, ce test ne mesurerait rien');
  assert.ok(
    z.nombre < GRILLE.casesBatiments,
    'la zone des champs doit être strictement plus petite que la base',
  );
  assert.equal(GRILLE.casesBatiments - z.nombre, 30, '30 cases de pourtour');

  // Toute case de la zone est dans la base, et le pourtour en est exclu.
  for (let r = z.premiereRangee; r <= z.derniereRangee; r++) {
    for (let c = z.premiereColonne; c <= z.derniereColonne; c++) {
      assert.ok(estDansLaBase(r, c), `(${r},${c}) devrait être dans la base`);
    }
  }
  assert.ok(z.premiereRangee > GEOMETRIE_BASE.premiereRangee);
  assert.ok(z.derniereColonne < GEOMETRIE_BASE.derniereColonne);
});

test('base — douze cases de champ, trois répartitions, et douze collecteurs au plus', () => {
  // ARBITRÉ le 26/08. Les trois répartitions somment toutes à `total` : c'est
  // l'invariant qui empêcherait d'ajouter un « 8 quartz / 5 scorie » en passant.
  assert.equal(CHAMPS.total, 12);
  assert.equal(CHAMPS.repartitions.length, 3);
  for (const r of CHAMPS.repartitions) {
    assert.equal(
      r.quartz + r.scorie, CHAMPS.total,
      `répartition ${r.quartz}/${r.scorie} : somme ${r.quartz + r.scorie}, ${CHAMPS.total} attendu`,
    );
    assert.ok(Number.isInteger(r.quartz) && r.quartz > 0);
    assert.ok(Number.isInteger(r.scorie) && r.scorie > 0);
  }
  // MESURÉ : quartz de 5 à 7, scorie de 5 à 7. La répartition est symétrique
  // autour de 6/6 — si elle cessait de l'être, ce serait délibéré.
  const quartz = CHAMPS.repartitions.map((r) => r.quartz);
  assert.deepEqual(quartz, [5, 6, 7]);
  assert.deepEqual(CHAMPS.repartitions.map((r) => r.scorie), [7, 6, 5]);

  // Les douze cases tiennent dans les 42 de l'intérieur, largement — sinon le
  // tirage n'aurait pas de solution. MESURÉ : 12 sur 42, soit 28,6 %.
  assert.ok(
    CHAMPS.total <= zoneDesChamps().nombre,
    'les champs ne tiennent pas dans la zone autorisée',
  );

  // Blocs de 1, 2 ou 3 ; les triplets droits ou coudés, rien d'autre.
  assert.deepEqual(CHAMPS.taillesBloc, [1, 2, 3]);
  assert.deepEqual(CHAMPS.formesTriplet, ['droit', 'coude']);
  // Douze cases sont décomposables en blocs de ces tailles dans tous les cas —
  // 12 = 12×1 = 6×2 = 4×3, donc aucune répartition ne peut être infaisable.
  assert.ok(CHAMPS.taillesBloc.some((t) => CHAMPS.total % t === 0));

  // ARBITRÉ le 26/08 : seul le collecteur se pose sur un champ. C'est ce qui
  // fait des douze cases le PLAFOND du nombre de collecteurs, et donc un vrai
  // régulateur : 12 collecteurs au plus sur une base de 40 emplacements.
  assert.deepEqual(CHAMPS.posableDessus, ['collecteur']);
  assert.ok(
    Object.prototype.hasOwnProperty.call(BASE_BATIMENTS, 'collecteur'),
    'le bâtiment autorisé sur un champ doit exister',
  );
  assert.equal(BASE_BATIMENTS.collecteur.unique, false, 'un plafond de 12 suppose un bâtiment libre');
  assert.ok(
    CHAMPS.total < EMPLACEMENTS.plafond,
    'le plafond de champs doit mordre avant celui des emplacements',
  );
});

// ---------------------------------------------------------------------------
// Débits et stockage
// ---------------------------------------------------------------------------

test('base — debitParHeure suit la pente de production, et elle vient d\'economie.js', () => {
  // MESURÉS : collecteur 240 → 300 au niveau 2 (× 1,25), 13 452 465 au niveau 50.
  // Ce dernier est le débit le plus lourd du jeu, celui que CLAUDE.md §6 cite
  // comme n'étant que 19 fois sous DEBIT_MILLI_PAR_HEURE_MAX.
  assert.equal(debitParHeure('collecteur', 1), 240);
  assert.equal(debitParHeure('collecteur', 2), 300);
  assert.equal(debitParHeure('collecteur', 50), 13_452_465);
  assert.equal(debitParHeure('centrale', 1), 120);
  assert.equal(debitParHeure('centrale', 50), 6_726_233);

  // La pente n'est pas réécrite ici : elle est LUE. Si quelqu'un la duplique
  // dans base.js, le rapport cessera de coller et ce test tombera.
  assert.equal(
    debitParHeure('collecteur', 2) / debitParHeure('collecteur', 1),
    ECONOMIE_NIVEAU.penteProduction,
  );
  // Et elle ne doit PAS valoir la pente des coûts — les deux courbes ont été
  // séparées exprès (CLAUDE.md §6, « deux courbes à ne jamais confondre »).
  assert.notEqual(ECONOMIE_NIVEAU.penteProduction, ECONOMIE_NIVEAU.penteStable);

  // Croissance stricte sur les cinquante niveaux : un arrondi qui aplatirait un
  // palier se verrait ici.
  for (let n = 2; n <= GEOGRAPHIE.niveauPlafond; n++) {
    assert.ok(
      debitParHeure('collecteur', n) > debitParHeure('collecteur', n - 1),
      `collecteur : le débit n'a pas crû du niveau ${n - 1} au niveau ${n}`,
    );
  }

  // Un bâtiment sans `propre` n'est pas un producteur : la fonction lève.
  assert.throws(() => debitParHeure('raffinerie', 1), /producteur/);
  assert.throws(() => debitParHeure('accumulateur', 1), /producteur/);
  assert.throws(() => debitParHeure('collecteur', 0), /hors de/);
  assert.throws(() => debitParHeure('collecteur', 51), /hors de/);
});

test('base — les bonus de voisinage sont typés, et les deux couples réciproques', () => {
  // Le voisinage typé est ce qui distingue ce modèle de l'adjacence anonyme du
  // lot 1 : un accumulateur compte ses centrales, une raffinerie ses
  // collecteurs, une centrale les champs de scorie du terrain.
  assert.equal(debitVoisinParHeure('centrale', 'champDeScorie', 1), 60);
  assert.equal(debitVoisinParHeure('centrale', 'accumulateur', 1), 72);
  assert.equal(debitVoisinParHeure('accumulateur', 'centrale', 1), 48);
  assert.equal(debitVoisinParHeure('collecteur', 'raffinerie', 1), 72);
  assert.equal(debitVoisinParHeure('raffinerie', 'collecteur', 1), 72);

  // Réciprocité : chacun des deux couples se nourrit dans les deux sens. Ce
  // n'est pas de la symétrie de VALEUR (48 ≠ 72), c'est de la symétrie
  // d'EXISTENCE — et c'est elle qui donne son intérêt à la disposition.
  for (const [stockage, producteur] of Object.entries(PRODUCTEUR_APPARIE)) {
    assert.ok(DEBITS[stockage]?.parVoisin?.[producteur] > 0, `${stockage} ← ${producteur}`);
    assert.ok(DEBITS[producteur]?.parVoisin?.[stockage] > 0, `${producteur} ← ${stockage}`);
  }
  // MESURÉ : deux couples, et les quatre bâtiments concernés sont les quatre
  // non-uniques. Ce n'est pas un hasard — c'est ce qui les rend multipliables.
  assert.deepEqual(PRODUCTEUR_APPARIE, { raffinerie: 'collecteur', accumulateur: 'centrale' });
  assert.deepEqual(
    Object.keys(DEBITS).sort(),
    ['accumulateur', 'centrale', 'collecteur', 'raffinerie'],
  );

  // Le bonus se règle sur le niveau du bâtiment QUI PRODUIT, donc il suit la
  // même pente que le débit propre.
  assert.equal(
    debitVoisinParHeure('centrale', 'champDeScorie', 2)
      / debitVoisinParHeure('centrale', 'champDeScorie', 1),
    ECONOMIE_NIVEAU.penteProduction,
  );
  assert.throws(() => debitVoisinParHeure('centrale', 'collecteur', 1), /aucun bonus/);
  assert.throws(() => debitVoisinParHeure('centrale', 'champDeScorie', 0), /hors de/);

  // Le voisinage est le 3 × 3 : huit cases autour, rayon 1. Reconfirmé le 26/08.
  assert.deepEqual(VOISINAGE, { rayon: 1, casesMax: 8 });
  assert.equal((2 * VOISINAGE.rayon + 1) ** 2 - 1, VOISINAGE.casesMax);
});

test('base — capaciteDuNiveau vaut exactement autonomie × débit du producteur apparié', () => {
  // MESURÉS : raffinerie n1 = 12 × 240 = 2 880 · accumulateur n1 = 12 × 120 = 1 440
  // · raffinerie n50 = 161 429 580, soit les 1,6 × 10⁸ annoncés par base.js.
  assert.equal(capaciteDuNiveau('raffinerie', 1), 2880);
  assert.equal(capaciteDuNiveau('accumulateur', 1), 1440);
  assert.equal(capaciteDuNiveau('raffinerie', 50), 161_429_580);

  // L'invariant de fond : le stockage suit EXACTEMENT la pente de production,
  // donc l'autonomie est la même sur les cinquante niveaux. C'est le point de
  // la réécriture du 25/08 — l'ancien ancrage ratait sa cible aux deux bouts.
  for (const [stockage, producteur] of Object.entries(PRODUCTEUR_APPARIE)) {
    for (const n of [1, 2, 10, 25, 49, 50]) {
      assert.equal(
        capaciteDuNiveau(stockage, n),
        Math.round(STOCKAGE.autonomieHeures * debitParHeure(producteur, n)),
        `${stockage} niveau ${n}`,
      );
    }
  }

  // Falsifiable : l'autonomie doit être non triviale, sinon l'égalité ci-dessus
  // passerait sur n'importe quoi.
  assert.ok(STOCKAGE.autonomieHeures > 1, 'une autonomie de 1 h ne mesurerait rien');
  assert.equal(STOCKAGE.autonomieHeures, 12);

  // Un bâtiment qui n'est pas du stockage lève, plutôt que de rendre un nombre.
  assert.throws(() => capaciteDuNiveau('collecteur', 1), /stockage/);
  assert.throws(() => capaciteDuNiveau('chantierDeConstruction', 1), /stockage/);
  assert.throws(() => capaciteDuNiveau('inexistant', 1), /stockage/);
  assert.throws(() => capaciteDuNiveau('raffinerie', 0), /hors de/);

  // Les deux bâtiments de rôle `stockage` sont exactement les deux clés de
  // PRODUCTEUR_APPARIE : pas d'orphelin d'un côté ni de l'autre.
  const parRole = IDS.filter((id) => BASE_BATIMENTS[id].role === 'stockage');
  assert.deepEqual(parRole.sort(), Object.keys(PRODUCTEUR_APPARIE).sort());
});

test('base — la capacité de niveau 50 laisse une marge réelle en milli-unités', () => {
  // CLAUDE.md §6 : l'ancien ancrage arrivait à 1,26 fois seulement sous
  // l'entier sûr, donc incompatible avec une boucle en micro-unités. Le
  // nouveau doit garder de l'air. MESURÉ : vingt raffineries de niveau 50
  // plafonnent à 3,2 × 10⁹ unités, soit ~2 790 fois de marge en milli.
  const capMax = capaciteDuNiveau('raffinerie', 50);
  const vingt = 20 * capMax * 1000; // en milli-unités
  const marge = Number.MAX_SAFE_INTEGER / vingt;
  assert.ok(marge > 1000, `marge ${marge.toFixed(0)}, plus de 1 000 attendue`);
  // Et le montage mesure bien quelque chose : la capacité n'est pas dérisoire.
  assert.ok(capMax > 1e8, 'la capacité de niveau 50 doit être de l\'ordre de 10⁸');
});

// ---------------------------------------------------------------------------
// Réparation et électricité — ce qui est arbitré, et rien de plus
// ---------------------------------------------------------------------------

test('base — la réparation du joueur est manuelle, et elle n\'est écrite qu\'ici', () => {
  // MODELE-REPARATION-1.md §3 : le joueur paie ses réparations, là où la base
  // de l'Ouvrage se relève seule en une heure. L'asymétrie est voulue.
  assert.equal(REPARATION_BASE_JOUEUR.mode, 'manuelle');
  // Les onze portent un temps de réparation de niveau 1, entier et positif.
  for (const id of IDS) {
    const t = BASE_BATIMENTS[id].reparationSec;
    assert.ok(Number.isInteger(t) && t > 0, `${id} : reparationSec = ${t}`);
  }
  // MESURÉ : trois valeurs seulement — 88 s pour les sept majeurs et courants,
  // 65 s pour les deux producteurs, 42 s pour les deux stockages. Le temps suit
  // la classe, et un quatrième palier serait un changement délibéré.
  const paliers = [...new Set(IDS.map((id) => BASE_BATIMENTS[id].reparationSec))].sort((a, b) => a - b);
  assert.deepEqual(paliers, [42, 65, 88]);
});

test('base — l\'électricité ne se paie qu\'à partir du niveau 3, et jamais aux deux premiers', () => {
  // BASE-DU-JOUEUR-1.md §4 : l'électricité conditionne TOUTES les améliorations.
  // C'est le garde-fou qui interdit de se contenter de raser et de farmer.
  assert.equal(COUT_ELECTRICITE.premierNiveauPayant, 3);
  assert.ok(
    COUT_ELECTRICITE.premierNiveauPayant > ECONOMIE_NIVEAU.premierNiveauPayant,
    'l\'électricité doit se payer APRÈS le quartz, sinon rien n\'amorce',
  );
  // Les trois fractions sont dans ]0, 1[ — une fraction ≥ 1 rendrait
  // l'électricité plus chère que le bâtiment lui-même.
  for (const [k, v] of Object.entries(COUT_ELECTRICITE.fraction)) {
    assert.ok(v > 0 && v < 1, `fraction ${k} = ${v}, attendue dans ]0, 1[`);
  }
  // La centrale est la moins chère à monter en électricité, le collecteur le
  // plus cher : c'est ce qui pousse à monter sa production d'énergie d'abord.
  assert.ok(COUT_ELECTRICITE.fraction.centrale < COUT_ELECTRICITE.fraction.autres);
  assert.ok(COUT_ELECTRICITE.fraction.autres < COUT_ELECTRICITE.fraction.collecteur);
});
