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
  REPARATION_BASE_JOUEUR, RESSOURCE_DE_COUT, CATEGORIE_DE_COUT_DE_LA_BASE,
  REMBOURSEMENT_DEMOLITION,
  emplacementsDuNiveau, capaciteDuNiveau, debitParHeure, debitVoisinParHeure,
  zoneDesChamps, estDansLaBase, coutDeMontee, coutCumule, remboursementDuNiveau,
  stockagePropreDuNiveau,
  multiplicateurDeStockage,
} from '../src/data/base.js';
import { GRILLE } from '../src/data/combat.js';
import { capacitesMilli, CAPACITE_MILLI_MAX } from '../src/sim/economie-base.js';
import { GEOGRAPHIE, BATIMENTS } from '../src/data/sites.js';
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

test('base — trois bâtiments portent un nom d\'Ouvrage, et ce sont les bons', () => {
  // TROIS, et le chemin compte : la ligne annonçait « trois » alors que la
  // table en portait quatre (25/08) ; le décompte a corrigé la ligne (26/08) ;
  // puis Ethan a arbitré que le quatrième appariement n'existait pas, et c'est
  // la TABLE qui a été corrigée. Les deux fois, la mesure a précédé l'écriture.
  //
  // ⚠ `hasOwnProperty` et pas `!== undefined` : la règle du projet est que
  // l'absence de clé se distingue d'une valeur vide (CLAUDE.md §6).
  const avecOuvrage = IDS.filter(
    (id) => Object.prototype.hasOwnProperty.call(BASE_BATIMENTS[id].nom, 'ouvrage'),
  );
  assert.deepEqual(
    avecOuvrage,
    ['chantierDeConstruction', 'complexeDeDefense', 'collecteur'],
    'les trois bâtiments à pendant Ouvrage ont changé',
  );
  assert.deepEqual(
    avecOuvrage.map((id) => BASE_BATIMENTS[id].nom.ouvrage),
    ['Souche', 'Étai', 'Nœud'],
  );

  // La raffinerie n'en a PAS, et c'est un arbitrage : côté Ouvrage le stockage
  // est deux bâtiments (Gangue pour le quartz, Terril pour la scorie) parce que
  // c'est du butin ; côté joueur c'est un seul qui tient les deux. Un vers
  // deux : aucun nom ne convient.
  assert.ok(
    !Object.prototype.hasOwnProperty.call(BASE_BATIMENTS.raffinerie.nom, 'ouvrage'),
    'la raffinerie ne doit pas porter de nom d\'Ouvrage',
  );

  // Les huit autres n'ont PAS la clé — c'est ce qui rend `hasOwnProperty`
  // capable de trancher. Sans cette moitié, le test ne mesurerait qu'un sens.
  assert.equal(IDS.length - avecOuvrage.length, 8);
});

test('base — l\'appariement avec l\'Ouvrage boucle dans les deux sens', () => {
  // C'EST CE TEST QUI AURAIT ATTRAPÉ L'APPARIEMENT DE TROP. sites.js porte le
  // renvoi de l'autre côté : `BATIMENTS[x].ta` nomme le bâtiment JOUEUR
  // correspondant, en français. Les trois appariements doivent donc boucler sur
  // `nom.joueur` d'ici.
  //
  // ⚠ Le champ `ta` n'a pas le même sens dans les deux fichiers : ici c'est le
  // nom Tiberium Alliances en anglais (« Harvester »), là-bas le nom français
  // du pendant joueur (« Collecteur »), le nom TA étant en commentaire. Ne pas
  // comparer `base.ta` à `sites.ta`, ils ne parlent pas de la même chose.
  const parNomOuvrage = new Map(
    IDS.filter((id) => Object.prototype.hasOwnProperty.call(BASE_BATIMENTS[id].nom, 'ouvrage'))
      .map((id) => [BASE_BATIMENTS[id].nom.ouvrage, BASE_BATIMENTS[id].nom.joueur]),
  );
  // MESURÉ : 3 appariements déclarés côté base.
  assert.equal(parNomOuvrage.size, 3);

  let boucles = 0;
  for (const site of Object.values(BATIMENTS)) {
    const nomJoueur = parNomOuvrage.get(site.nom);
    if (nomJoueur === undefined) continue;
    boucles += 1;
    assert.equal(
      site.ta, nomJoueur,
      `${site.nom} renvoie vers « ${site.ta} », mais base.js le déclare pendant de « ${nomJoueur} »`,
    );
  }
  // Les trois déclarés doivent TOUS avoir été retrouvés dans sites.js : sans
  // ça, un nom d'Ouvrage inventé passerait sans être vu.
  assert.equal(boucles, parNomOuvrage.size, 'un nom d\'Ouvrage ne désigne aucun bâtiment de site');

  // Falsifiable dans l'autre sens : les deux silos de l'Ouvrage ne renvoient
  // vers AUCUN bâtiment du joueur, et c'est justement l'asymétrie arbitrée.
  // Si l'un des deux se mettait à nommer la Raffinerie, il faudrait rouvrir
  // l'arbitrage plutôt que de laisser le test muet.
  const nomsJoueur = new Set(IDS.map((id) => BASE_BATIMENTS[id].nom.joueur));
  assert.ok(!nomsJoueur.has(BATIMENTS.gangue.ta), `gangue.ta = ${BATIMENTS.gangue.ta}`);
  assert.ok(!nomsJoueur.has(BATIMENTS.terril.ta), `terril.ta = ${BATIMENTS.terril.ta}`);
  // Et les deux silos portent bien des ressources OPPOSÉES : c'est la raison de
  // l'asymétrie, pas une coïncidence de nommage.
  assert.equal(BATIMENTS.gangue.ressource.quartz, 1);
  assert.equal(BATIMENTS.gangue.ressource.scorie, 0);
  assert.equal(BATIMENTS.terril.ressource.quartz, 0);
  assert.equal(BATIMENTS.terril.ressource.scorie, 1);
});

test('base — la raffinerie stocke les DEUX ressources, le collecteur en produit UNE', () => {
  // Arbitré le 26/08, et la nuance porte tout : « quartzOuScorie » est
  // exclusif, « quartzEtScorie » est inclusif. Les écrire pareil, c'est se
  // préparer à additionner deux capacités qui ne s'additionnent pas.
  assert.equal(BASE_BATIMENTS.collecteur.ressource, 'quartzOuScorie');
  assert.equal(BASE_BATIMENTS.raffinerie.ressource, 'quartzEtScorie');
  assert.notEqual(
    BASE_BATIMENTS.collecteur.ressource, BASE_BATIMENTS.raffinerie.ressource,
    'produire l\'une OU l\'autre et stocker les DEUX ne peuvent pas s\'écrire pareil',
  );

  // Seule la raffinerie porte une capacité par ressource. L'accumulateur n'a
  // qu'une ressource, donc la clé est absente plutôt que `false` — même règle
  // que pour `nom.ouvrage`.
  assert.equal(BASE_BATIMENTS.raffinerie.capaciteParRessource, true);
  const porteuses = IDS.filter(
    (id) => Object.prototype.hasOwnProperty.call(BASE_BATIMENTS[id], 'capaciteParRessource'),
  );
  assert.deepEqual(porteuses, ['raffinerie']);

  // Conséquence chiffrée : une raffinerie de niveau 1 tient 20 de chaque, soit
  // 40 en tout. C'est le double de ce qu'on lirait en prenant `capaciteDuNiveau`
  // pour un total. (Le chiffre était 2 880 avant la courbe du 28/08 ; c'est la
  // DOUBLE COMPTE qui est asserté ici, pas la valeur.)
  const parRessource = capaciteDuNiveau('raffinerie', 1);
  assert.equal(parRessource, STOCKAGE.niveauUn.raffinerie);
  assert.equal(parRessource, 20);
  assert.equal(parRessource * 2, 40);
  // Et le double compte se voit là où il compte : dans la capacité de la base.
  const base = capacitesMilli([{ id: 'raffinerie', niveau: 1 }]);
  assert.equal(base.quartz, parRessource * 1000);
  assert.equal(base.scorie, parRessource * 1000);
  assert.equal(base.electricite, 0, 'une raffinerie ne stocke pas d\'électricité');
  // L'accumulateur, lui, n'a rien à doubler.
  assert.equal(BASE_BATIMENTS.accumulateur.ressource, 'electricite');
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

  // ⚠ LA FORME EXACTE, PAS SEULEMENT LES VALEURS. Les assertions ci-dessus
  // passent toutes si quelqu'un AJOUTE une clé — c'est le trou par lequel un
  // bonus de terrain sur le Collecteur entrerait sans qu'on revoie la décision.
  // ARBITRÉ le 26/08 : asymétrie voulue, le Collecteur ne touche rien du
  // terrain. Le champ sous lui décide de sa ressource, un point c'est tout.
  assert.deepEqual(DEBITS.collecteur.parVoisin, { raffinerie: 72 });
  assert.deepEqual(DEBITS.raffinerie.parVoisin, { collecteur: 72 });
  assert.deepEqual(DEBITS.accumulateur.parVoisin, { centrale: 48 });
  assert.deepEqual(DEBITS.centrale.parVoisin, { champDeScorie: 60, accumulateur: 72 });

  // Et le corollaire, asserté de face : `champDeScorie` sur la Centrale est LE
  // SEUL bonus de terrain de toute la table. Falsifiable — s'il y en avait
  // zéro, l'égalité ci-dessous passerait aussi et ne prouverait rien.
  const bonusDeTerrain = Object.entries(DEBITS).flatMap(
    ([id, d]) => Object.keys(d.parVoisin ?? {})
      .filter((v) => v.startsWith('champDe'))
      .map((v) => `${id}.${v}`),
  );
  assert.deepEqual(bonusDeTerrain, ['centrale.champDeScorie']);
  assert.equal(bonusDeTerrain.length, 1, 'un seul ancrage au terrain, arbitré le 26/08');

  // DEBITS est COMPLÈTE : sept valeurs, et il n'en manque plus aucune.
  // MESURÉ par exécution — j'en avais annoncé six, c'était faux.
  const valeurs = Object.values(DEBITS).flatMap(
    (d) => (d.propre === undefined ? [] : [d.propre]).concat(Object.values(d.parVoisin ?? {})),
  );
  assert.equal(valeurs.length, 7, `${valeurs.length} valeurs de débit, 7 attendues`);
  for (const v of valeurs) assert.ok(Number.isInteger(v) && v > 0, `débit ${v} invalide`);

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

test('base — capaciteDuNiveau suit la courbe arbitrée le 28/08, palier par palier', () => {
  // ⚠ RUPTURE ASSUMÉE. Jusqu'au 28/08 la capacité valait `autonomieHeures ×
  // débit du producteur apparié`, si bien que l'autonomie était constante sur
  // les cinquante niveaux. Ethan a jugé la courbe « chelou » et l'a remplacée
  // par des chiffres absolus : 20 pour la raffinerie et 15 pour l'accumulateur
  // au niveau 1, × 2 par palier jusqu'au dixième, puis un multiplicateur qui
  // décroît linéairement jusqu'à 1,333 au cinquantième.
  //
  // Ce test-ci a été RÉÉCRIT, pas assoupli : il assertait l'ancienne égalité et
  // il asserte maintenant la nouvelle, avec autant de points de contrôle.
  assert.equal(capaciteDuNiveau('raffinerie', 1), STOCKAGE.niveauUn.raffinerie);
  assert.equal(capaciteDuNiveau('accumulateur', 1), STOCKAGE.niveauUn.accumulateur);
  assert.equal(capaciteDuNiveau('raffinerie', 1), 20);
  assert.equal(capaciteDuNiveau('accumulateur', 1), 15);

  // Le régime constant : chaque palier double, jusqu'au seuil inclus.
  for (let n = 2; n <= STOCKAGE.niveauSeuil; n++) {
    assert.equal(multiplicateurDeStockage(n), STOCKAGE.multiplicateurAuDepart, `palier ${n}`);
    assert.equal(
      capaciteDuNiveau('raffinerie', n),
      capaciteDuNiveau('raffinerie', n - 1) * 2,
      `raffinerie niveau ${n}`,
    );
  }
  // MESURÉ : 20 × 2⁹ au dixième niveau.
  assert.equal(capaciteDuNiveau('raffinerie', 10), 10_240);
  assert.equal(capaciteDuNiveau('accumulateur', 10), 7_680);

  // Le régime linéaire : le multiplicateur décroît STRICTEMENT, et il arrive
  // exactement sur la valeur d'arrivée au dernier niveau du jeu.
  for (let n = STOCKAGE.niveauSeuil + 1; n <= GEOGRAPHIE.niveauPlafond; n++) {
    assert.ok(multiplicateurDeStockage(n) < multiplicateurDeStockage(n - 1),
      `le multiplicateur devrait décroître au palier ${n}`);
    assert.ok(multiplicateurDeStockage(n) > 1, `le stockage recule au palier ${n}`);
  }
  assert.equal(
    multiplicateurDeStockage(GEOGRAPHIE.niveauPlafond),
    STOCKAGE.multiplicateurAuPlafond,
  );
  // ⚠ LE PLAFOND EST LU DANS `GEOGRAPHIE`, PAS RÉÉCRIT. Une seconde écriture
  // du 50 ferait rater sa cible à la courbe le jour où le plafond bougerait :
  // on l'asserte en déplaçant le regard, pas la constante.
  assert.notEqual(multiplicateurDeStockage(GEOGRAPHIE.niveauPlafond - 1),
    STOCKAGE.multiplicateurAuPlafond);

  // La capacité est strictement croissante sur les cinquante niveaux : une
  // amélioration ne doit jamais faire perdre du stockage.
  for (const id of Object.keys(STOCKAGE.niveauUn)) {
    for (let n = 2; n <= GEOGRAPHIE.niveauPlafond; n++) {
      assert.ok(capaciteDuNiveau(id, n) > capaciteDuNiveau(id, n - 1), `${id} niveau ${n}`);
    }
  }

  // ⚠ ET LE LIEN AVEC LE DÉBIT EST ROMPU, ce qui est le fond de l'arbitrage.
  // L'autonomie n'est plus constante : elle vaut cinq minutes au niveau 1 et
  // des décennies au niveau 50. On le MESURE, pour que personne ne rétablisse
  // l'ancienne égalité en croyant réparer une régression.
  const autonomie = (n) => capaciteDuNiveau('raffinerie', n) / debitParHeure('collecteur', n);
  assert.ok(autonomie(1) < 0.2, `autonomie de niveau 1 : ${autonomie(1)} h, moins de 12 minutes attendues`);
  assert.ok(autonomie(50) > 1_000, 'autonomie de niveau 50 : des mois attendus');
  assert.ok(autonomie(50) / autonomie(1) > 1e4,
    'les deux bouts de la courbe devraient être très écartés');

  // Un bâtiment qui n'est pas du stockage lève, plutôt que de rendre un nombre.
  assert.throws(() => capaciteDuNiveau('collecteur', 1), /stockage/);
  assert.throws(() => capaciteDuNiveau('chantierDeConstruction', 1), /stockage/);
  assert.throws(() => capaciteDuNiveau('inexistant', 1), /stockage/);
  assert.throws(() => capaciteDuNiveau('raffinerie', 0), /hors de/);
  assert.throws(() => capaciteDuNiveau('raffinerie', GEOGRAPHIE.niveauPlafond + 1), /hors de/);

  // Les deux bâtiments de rôle `stockage` sont exactement les deux clés de
  // PRODUCTEUR_APPARIE, ET les deux clés de STOCKAGE.niveauUn : pas d'orphelin
  // d'un côté ni de l'autre. C'est la table qui décide, pas une liste écrite ici.
  const parRole = IDS.filter((id) => BASE_BATIMENTS[id].role === 'stockage');
  assert.deepEqual(parRole.slice().sort(), Object.keys(PRODUCTEUR_APPARIE).slice().sort());
  assert.deepEqual(parRole.slice().sort(), Object.keys(STOCKAGE.niveauUn).slice().sort());
});

test('base — la base LÉGALE la plus grosse tient dans l\'entier sûr, écrêtage compris', () => {
  // ⚠ CE TEST A CHANGÉ DE VERDICT DEUX FOIS EN UN JOUR, ET LES DEUX FOIS IL
  // AVAIT RAISON. Il disait « la marge est réelle » sous l'ancienne courbe
  // (2 815 fois) ; « elle a disparu » sous la première écriture de la nouvelle
  // (une raffinerie de niveau 50 valait 53 % de l'entier sûr à elle seule) ;
  // il dit maintenant « elle est revenue », parce qu'Ethan a fait écraser la
  // queue de courbe plutôt que de renoncer au × 2 des dix premiers niveaux.
  //
  // ⚠ LA CIBLE EST LA BASE LÉGALE LA PLUS GROSSE, PAS UNE BASE PLAUSIBLE. Au
  // niveau 50 le Chantier ouvre 40 emplacements et en occupe un : 39 bâtiments
  // de stockage au maximum. C'est dégénéré — une base sans production — mais
  // parfaitement légal, et l'exactitude ne se règle pas sur le vraisemblable.
  const parBatiment = capaciteDuNiveau('raffinerie', GEOGRAPHIE.niveauPlafond);
  const maxStockage = emplacementsDuNiveau(GEOGRAPHIE.niveauPlafond) - 1;
  assert.equal(maxStockage, 39, 'le montage suppose 40 emplacements moins le Chantier');

  const pire = Array.from({ length: maxStockage }, () => ({
    id: 'raffinerie', niveau: GEOGRAPHIE.niveauPlafond,
  }));
  const caps = capacitesMilli(pire);
  assert.equal(caps.quartz, maxStockage * parBatiment * 1000,
    'la base légale maximale ne doit PAS être écrêtée');
  assert.ok(Number.isSafeInteger(caps.quartz));
  assert.notEqual(caps.quartz, CAPACITE_MILLI_MAX, 'l\'écrêtage mord : la courbe a redébordé');

  // ⚠ ET LA MARGE EST MESURÉE, PAS ESPÉRÉE. 2,8 fois au moment de l'arbitrage.
  const marge = Number.MAX_SAFE_INTEGER / caps.quartz;
  assert.ok(marge > 2, `marge ${marge.toFixed(1)}, plus de 2 attendue — la queue de courbe a remonté`);

  // ⚠ AUCUN PALIER N'EST MORT POUR AUTANT. Écraser la queue ne veut pas dire
  // l'aplatir : le dernier niveau doit encore apporter quelque chose, sinon on
  // vendrait au joueur une amélioration qui ne fait rien.
  const dernier = STOCKAGE.multiplicateurAuPlafond;
  assert.ok(dernier > 1, 'un multiplicateur ≤ 1 rendrait le dernier niveau inutile');
  assert.ok(dernier >= 1.02, `le dernier palier n'apporte que ${((dernier - 1) * 100).toFixed(1)} %`);
  // Et le × 2 des dix premiers niveaux est INTACT — c'est la contrainte d'Ethan.
  assert.equal(STOCKAGE.multiplicateurAuDepart, 2);
  assert.equal(capaciteDuNiveau('raffinerie', 10), STOCKAGE.niveauUn.raffinerie * 2 ** 9);

  // L'écrêtage reste là, en dernier recours, et il fonctionne — on le montre
  // sur une disposition qu'aucune base ne peut atteindre.
  const impossible = Array.from({ length: 500 }, () => ({
    id: 'raffinerie', niveau: GEOGRAPHIE.niveauPlafond,
  }));
  assert.equal(capacitesMilli(impossible).quartz, CAPACITE_MILLI_MAX);
  assert.ok(Number.isSafeInteger(capacitesMilli(impossible).quartz));
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

// ---------------------------------------------------------------------------
// Coût de montée, cumul, remboursement — arbitrés le 27/08 au soir
// ---------------------------------------------------------------------------
//
// LES TROIS ARBITRAGES QUE CES TESTS GARDENT :
//   - tous les BÂTIMENTS coûtent du quartz ; l'offense coûte de la scorie ; la
//     DÉFENSE, elle, se paie dans les deux — voir couts-militaires.test.js ;
//   - la poche du Chantier suit le niveau en × 1,25 ;
//   - démolir rend 90 % de TOUT l'investi, arrondi vers le bas.
//
// Chaque nombre écrit ici a été relevé en exécutant le module, jamais déduit de
// la formule : c'est la formule qu'on teste.

test('base — un bâtiment coûte du quartz, et jamais de la scorie', () => {
  assert.equal(RESSOURCE_DE_COUT.batiment, 'quartz');
  assert.equal(RESSOURCE_DE_COUT.offense, 'scorie');
  assert.equal(CATEGORIE_DE_COUT_DE_LA_BASE, 'batiment');
  // ⚠ LA CLÉ `defense` A ÉTÉ RETIRÉE LE 28/08, ET CE TEST NE S'EST PAS
  // ASSOUPLI — il a changé de cible. Elle valait « scorie » depuis le 27/08, en
  // anticipation et sans que rien ne la lise. L'arbitrage du 28/08 a chiffré la
  // défense entité par entité et l'a falsifiée pour six ouvrages sur dix-sept :
  // mur, barbelés, barrière anti-char, tourelle mitrailleuse, canon anti-char
  // et DCA se paient en QUARTZ. Une clé unique ne peut plus dire vrai, donc la
  // ressource se dit ligne par ligne dans `data/couts-militaires.js`.
  assert.equal(
    Object.prototype.hasOwnProperty.call(RESSOURCE_DE_COUT, 'defense'), false,
    'la défense se paie dans deux ressources — une clé unique mentirait pour six entités',
  );

  // Les onze, à trois niveaux : aucun ne demande de scorie, tous demandent du
  // quartz. Une inversion de la table ferait tomber les deux moitiés.
  for (const id of IDS) {
    for (const niveau of [2, 5, 9]) {
      const cout = coutDeMontee(id, niveau);
      assert.equal(cout.scorie, 0, `${id} niv.${niveau} : la base ne coûte pas de scorie`);
      assert.ok(cout.quartz > 0, `${id} niv.${niveau} : coût en quartz nul`);
    }
  }
});

test('base — la chaîne des coûts restitue la table relevée, palier par palier', () => {
  // Relevé par exécution le 27/08. C'est exactement la suite écrite en
  // commentaire d'`ECONOMIE_NIVEAU.ratios` — la formule la retrouve.
  const attendus = [8, 10, 20, 80, 440, 1440];
  const obtenus = [2, 3, 4, 5, 6, 7].map((n) => coutDeMontee('chantierDeConstruction', n).quartz);
  assert.deepEqual(obtenus, attendus);

  // Le premier palier EST la table de classe, il ne s'en déduit pas.
  assert.equal(obtenus[0], COUT_NIVEAU_DEUX.majeur);
  assert.equal(coutDeMontee('collecteur', 2).quartz, COUT_NIVEAU_DEUX.modeste);
  assert.equal(coutDeMontee('raffinerie', 2).quartz, COUT_NIVEAU_DEUX.mineur);

  // Falsifiable : la suite doit être STRICTEMENT croissante, sinon une chaîne
  // qui rendrait partout le même nombre passerait les égalités ci-dessus.
  for (let i = 1; i < obtenus.length; i++) {
    assert.ok(obtenus[i] > obtenus[i - 1], `palier ${i + 2} non croissant`);
  }
});

test('base — l\'électricité est une fraction du coût principal, à partir du niveau 3', () => {
  // Les niveaux 1 et 2 n'en coûtent aucune.
  assert.equal(coutDeMontee('chantierDeConstruction', 2).electricite, 0);
  assert.equal(COUT_ELECTRICITE.premierNiveauPayant, 3);

  // Au-delà, elle vaut la fraction du bâtiment appliquée au quartz du MÊME
  // palier — pas du palier précédent, pas du cumul.
  for (const id of IDS) {
    for (const niveau of [3, 6, 11]) {
      const cout = coutDeMontee(id, niveau);
      const part = Object.prototype.hasOwnProperty.call(COUT_ELECTRICITE.fraction, id)
        ? COUT_ELECTRICITE.fraction[id]
        : COUT_ELECTRICITE.fraction.autres;
      assert.equal(cout.electricite, Math.round(part * cout.quartz), `${id} niv.${niveau}`);
    }
  }

  // ⚠ UNE FRACTION PEUT S'ARRONDIR À ZÉRO, et ce n'est pas un défaut : la
  // centrale paie 10 % d'un coût de 4, soit 0,4 → 0. Relevé, pas déduit.
  assert.equal(coutDeMontee('centrale', 3).quartz, 4);
  assert.equal(coutDeMontee('centrale', 3).electricite, 0);
  assert.equal(coutDeMontee('centrale', 4).electricite, 1);

  // Falsifiable : le collecteur, lui, en paie franchement — sinon le test
  // ci-dessus passerait sur un module qui rend zéro partout.
  assert.ok(coutDeMontee('collecteur', 5).electricite > 0);
});

test('base — le niveau 1 est gratuit, et il ne se demande pas', () => {
  for (const id of IDS) {
    // `coutDeMontee` LÈVE plutôt que de rendre zéro : demander le prix d'un
    // niveau gratuit est une faute d'appel, pas une réponse valide.
    assert.throws(() => coutDeMontee(id, 1), /gratuit/);
    assert.deepEqual(coutCumule(id, 1), { quartz: 0, scorie: 0, electricite: 0 });
    assert.deepEqual(remboursementDuNiveau(id, 1), { quartz: 0, scorie: 0, electricite: 0 });
  }
});

test('base — le cumul est la somme des paliers, et rien d\'autre', () => {
  for (const id of ['chantierDeConstruction', 'collecteur', 'raffinerie']) {
    for (const niveau of [2, 5, 8]) {
      const somme = { quartz: 0, scorie: 0, electricite: 0 };
      for (let n = ECONOMIE_NIVEAU.premierNiveauPayant; n <= niveau; n++) {
        const palier = coutDeMontee(id, n);
        for (const r of Object.keys(somme)) somme[r] += palier[r];
      }
      assert.deepEqual(coutCumule(id, niveau), somme, `${id} niv.${niveau}`);
    }
  }

  // Relevé par exécution : un collecteur de niveau 5 a coûté 47 de quartz et
  // 22 d'électricité depuis le niveau 1.
  assert.deepEqual(coutCumule('collecteur', 5), { quartz: 47, scorie: 0, electricite: 22 });

  // Falsifiable : le cumul doit dépasser STRICTEMENT le dernier palier, sinon
  // une fonction qui ne rendrait que le dernier passerait la comparaison.
  assert.ok(coutCumule('collecteur', 5).quartz > coutDeMontee('collecteur', 5).quartz);
});

test('base — démolir rend 90 % de l\'investi, arrondi vers le bas', () => {
  assert.equal(REMBOURSEMENT_DEMOLITION.fraction, 0.9);

  for (const id of ['chantierDeConstruction', 'collecteur', 'centrale']) {
    for (const niveau of [2, 4, 7]) {
      const investi = coutCumule(id, niveau);
      const rendu = remboursementDuNiveau(id, niveau);
      for (const r of ['quartz', 'scorie', 'electricite']) {
        assert.equal(rendu[r], Math.floor(investi[r] * 0.9), `${id} niv.${niveau} ${r}`);
      }
      // ⚠ LE RENDU EST STRICTEMENT INFÉRIEUR À L'INVESTI dès qu'il y a de quoi
      // perdre 10 %. Sans cette ligne, un remboursement à 100 % passerait
      // toutes les égalités ci-dessus le jour où quelqu'un écrirait 1 à la
      // place de 0,9 — l'arrondi vers le bas ne suffit pas à le trahir.
      assert.ok(rendu.quartz < investi.quartz, `${id} niv.${niveau} : 90 % non appliqué`);
    }
  }

  // Relevé par exécution : un collecteur de niveau 5 rend 42 et 19.
  assert.deepEqual(remboursementDuNiveau('collecteur', 5), { quartz: 42, scorie: 0, electricite: 19 });
});

test('base — la poche du Chantier suit le niveau, et la pente n\'est écrite qu\'une fois', () => {
  const champ = BASE_BATIMENTS.chantierDeConstruction.stockagePropre;
  assert.deepEqual(champ, { quartz: 50, scorie: 50, electricite: 40 });

  // Le champ vaut au niveau 1 — et seulement là.
  assert.deepEqual(stockagePropreDuNiveau('chantierDeConstruction', 1), champ);

  // ⚠ LA PENTE VIENT D'`ECONOMIE_NIVEAU`, elle n'est pas retapée ici. Si la
  // production changeait de pente, la poche suivrait et ce test avec elle :
  // c'est voulu, c'est la même grandeur.
  for (const niveau of [2, 4, 6, 10, 25]) {
    const facteur = ECONOMIE_NIVEAU.penteProduction ** (niveau - 1);
    const poche = stockagePropreDuNiveau('chantierDeConstruction', niveau);
    for (const r of ['quartz', 'scorie', 'electricite']) {
      assert.equal(poche[r], Math.round(champ[r] * facteur), `niv.${niveau} ${r}`);
    }
  }

  // Relevés par exécution — les deux niveaux qui servent ailleurs dans la suite.
  assert.deepEqual(stockagePropreDuNiveau('chantierDeConstruction', 6),
    { quartz: 153, scorie: 153, electricite: 122 });
  assert.deepEqual(stockagePropreDuNiveau('chantierDeConstruction', 10),
    { quartz: 373, scorie: 373, electricite: 298 });

  // Falsifiable : la courbe doit MONTER dès le niveau 2, sinon un module resté
  // plat passerait la comparaison au niveau 1 et rien d'autre ne le verrait.
  assert.ok(stockagePropreDuNiveau('chantierDeConstruction', 2).quartz > champ.quartz);

  // ⚠ ELLE REND `null`, PAS DES ZÉROS, pour un bâtiment sans poche : les dix
  // autres n'en portent pas, et l'absence doit rester discernable d'un zéro.
  for (const id of IDS.filter((k) => k !== 'chantierDeConstruction')) {
    assert.equal(stockagePropreDuNiveau(id, 3), null, `${id} ne porte pas de poche`);
  }
});
