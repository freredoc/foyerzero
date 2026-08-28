// L'état de jeu — rattrapage, sérialisation, migration.
//
// ⚠ CE FICHIER A ÉTÉ RÉÉCRIT LE 26/08 avec la bascule du moteur. L'ancien
// montage portait des `foreuse` et des `decapeuse` sans coordonnées ; le
// nouveau porte une POSITION sur la carte et une DISPOSITION de bâtiments
// placés à la case. Ce qui a été GARDÉ tel quel, parce que ça ne dépendait pas
// du modèle : le contrôle BigInt du rattrapage, qui est de l'arithmétique pure.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { TICKS_PAR_HEURE } from '../src/sim/clock.js';
import {
  SAVE_VERSION, creerEtat, tickJeu, rattraperJeu, serialiser, charger, migrer,
  poser, problemesDeLaPose,
  ameliorer, problemesDeLAmelioration, demolir, problemesDeLaDemolition,
  CODES_TOLERES_AU_CHARGEMENT,
} from '../src/sim/state.js';
import { coutDeMontee, coutCumule, remboursementDuNiveau } from '../src/data/base.js';
import {
  DEBIT_MILLI_PAR_HEURE_MAX, capacitesMilli, STOCK_DE_DEPART, creerEtatEconomie,
} from '../src/sim/economie-base.js';
import { problemesDeDisposition } from '../src/sim/disposition.js';
import { creerRng, entier } from '../src/sim/rng.js';
import { positionDepartJoueur } from '../src/sim/carte.js';
import { champsDeLaBase } from '../src/sim/champs.js';

// ⚠ UN INSTANT MURAL FIXE, JAMAIS L'HORLOGE DE LA MACHINE. Depuis la v6,
// `serialiser` et `charger` reçoivent l'instant présent en argument. Le prendre
// ici sur l'horloge système rendrait la suite dépendante du moment où elle
// tourne — exactement ce que le déterminisme du dépôt interdit. Valeur
// arbitraire mais fixe : le 14 novembre 2023.
const T0 = 1_700_000_000_000;
const HEURE_MS = 3_600_000;

/**
 * Montage volontairement hétérogène : une base qui PRODUIT dans les trois
 * ressources, avec un stock déjà proche de la saturation pour que le plafond
 * soit réellement traversé.
 *
 * ⚠ LES COLLECTEURS SONT POSÉS SUR LES CHAMPS RÉELS de la position de départ,
 * pas sur des cases choisies à la main : un collecteur hors champ rendrait la
 * disposition illégale et ferait mesurer autre chose. Le reste va sur le
 * pourtour de la bande (rangées 11 et 18), seul endroit garanti sans champ.
 */
function etatDeReference() {
  const etat = creerEtat(20260826);
  const champs = etat.champs.cases;

  etat.disposition = [
    { id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 20 },
    { id: 'centrale', rangee: 11, colonne: 2, niveau: 4 },
    { id: 'accumulateur', rangee: 11, colonne: 3, niveau: 3 },
    { id: 'raffinerie', rangee: 18, colonne: 6, niveau: 2 },
  ];
  // Trois collecteurs, chacun sur un vrai champ.
  for (const k of champs.slice(0, 3)) {
    etat.disposition.push({ id: 'collecteur', rangee: k.rangee, colonne: k.colonne, niveau: 5 });
  }

  etat.economie = {
    ressources: { quartz: 137_000, scorie: 0, electricite: 0 },
    residus: etat.disposition.map(() => ({ quartz: 0, scorie: 0, electricite: 0 })),
  };
  // Un stock à un cheveu du plafond : la saturation sera franchie en moins
  // d'une heure, donc traversée par les deux chemins.
  const caps = capacitesMilli(etat.disposition);
  etat.economie.ressources.electricite = caps.electricite - 50_000;

  // Le montage doit être JOUABLE, sinon les tests mesurent une base illégale.
  assert.deepEqual(problemesDeDisposition(etat.disposition, etat.champs), []);
  return etat;
}

test('état — une partie neuve ouvre sur la base du joueur, à sa position', () => {
  const etat = creerEtat(424242);
  assert.equal(etat.version, SAVE_VERSION);
  assert.deepEqual(etat.position, positionDepartJoueur());
  assert.deepEqual(etat.disposition, [
    { id: 'chantierDeConstruction', niveau: 1, rangee: 18, colonne: 5 },
  ]);
  // ⚠ L'AMORCE, arbitrée le 27/08 : 30 · 30 · 20. Elle est écrite en toutes
  // lettres ici plutôt que relue depuis `STOCK_DE_DEPART` — un test qui relit
  // la constante qu'il vérifie ne vérifie rien.
  assert.deepEqual(etat.economie.ressources, { quartz: 30_000, scorie: 30_000, electricite: 20_000 });
  assert.deepEqual(STOCK_DE_DEPART, { quartz: 30, scorie: 30, electricite: 20 });

  // ⚠ ELLE TIENT SOUS LA POCHE DU CHANTIER, sinon elle naîtrait GELÉE : le
  // moteur immobilise un excédent au lieu de le rabattre, et le joueur verrait
  // un compteur bloqué dès la première image.
  const plafond = capacitesMilli(etat.disposition);
  for (const r of ['quartz', 'scorie', 'electricite']) {
    assert.ok(etat.economie.ressources[r] < plafond[r], `l'amorce sature déjà en ${r}`);
  }
  assert.equal(etat.champs.cases.length, 12);

  // ⚠ UNE BASE QUI N'A QUE SON CHANTIER NE PRODUIT RIEN, et c'est juste : ni
  // collecteur, ni centrale. Après une heure pleine, les trois stocks valent
  // encore l'amorce, à l'unité près. Un moteur qui produirait « un peu » de
  // quelque chose ici serait faux, et personne ne le verrait sans cette
  // assertion.
  for (let t = 0; t < TICKS_PAR_HEURE; t++) tickJeu(etat);
  assert.deepEqual(etat.economie.ressources, { quartz: 30_000, scorie: 30_000, electricite: 20_000 });
  assert.equal(etat.horloge.nbTicks, TICKS_PAR_HEURE);
});

test('test 11 — le rattrapage reproduit la boucle sur 1 h et 2 h', () => {
  // ⚠ LES HORIZONS ONT ÉTÉ RABOTÉS DE 24 h ET 72 h À 2 h LE 26/08, et ce n'est
  // pas une baisse d'exigence. Le triple 1/24/72 venait du moteur du lot 1, qui
  // coûtait deux ordres de grandeur de moins par tick. Après la bascule, les
  // 72 h faisaient 2,6 MILLIONS de ticks : `state.test.js` passait de 3 à
  // 58 secondes, et la suite entière de 13 à 74. Une suite qu'on hésite à
  // lancer cesse d'être lancée.
  //
  // Ce que 72 h prouvait de plus que 2 h : RIEN au niveau des chemins de code.
  // La formule décompose en heures pleines + reste ; deux heures exercent déjà
  // `heuresPleines >= 2` et le reste, et la saturation est franchie dès la
  // première. Les très longs horizons sont couverts autrement, et MIEUX : par
  // le contrôle BigInt (jusqu'à 3,2 milliards de ticks) et par le test de
  // composition juste en dessous, tous deux en temps constant.
  for (const heures of [1, 2]) {
    const nbTicks = heures * TICKS_PAR_HEURE;
    const simule = etatDeReference();
    for (let t = 0; t < nbTicks; t++) tickJeu(simule);
    const analytique = etatDeReference();
    rattraperJeu(analytique, nbTicks);
    assert.equal(
      JSON.stringify(analytique), JSON.stringify(simule),
      `${heures} h : le rattrapage diverge de la boucle`,
    );
  }

  // Le montage doit VRAIMENT traverser la saturation, sinon il ne mesure que
  // le cas facile. L'électricité partait à 50 000 milli du plafond.
  const temoin = etatDeReference();
  const caps = capacitesMilli(temoin.disposition);
  rattraperJeu(temoin, 2 * TICKS_PAR_HEURE);
  assert.equal(
    temoin.economie.ressources.electricite, caps.electricite,
    'le plafond d\'électricité n\'a pas été atteint : la saturation n\'est pas traversée',
  );
  // Et le quartz doit avoir monté, sinon les collecteurs ne servent à rien ici.
  assert.ok(temoin.economie.ressources.quartz > 137_000, 'aucun quartz produit');
});

test('test 11 bis — le rattrapage tombe juste sur une fenêtre NON RONDE', () => {
  // Le test 11 ne rattrape que des heures rondes, pour lesquelles le reste de
  // la division par TICKS_PAR_HEURE vaut zéro — soit précisément le chemin que
  // la formule traite à part. Une fenêtre non ronde est le seul montage qui
  // l'emprunte.
  const nbTicks = 4530;
  assert.notEqual(nbTicks % TICKS_PAR_HEURE, 0, 'une fenêtre ronde ne mesurerait rien ici');

  const simule = etatDeReference();
  for (let t = 0; t < nbTicks; t++) tickJeu(simule);
  const analytique = etatDeReference();
  rattraperJeu(analytique, nbTicks);
  assert.equal(JSON.stringify(analytique), JSON.stringify(simule));

  // Et le montage doit exercer les résidus : au moins un bâtiment doit en
  // porter un non nul, sinon la fenêtre non ronde ne prouverait rien de plus
  // qu'une fenêtre ronde.
  assert.ok(
    simule.economie.residus.some((r) => Object.values(r).some((v) => v > 0)),
    'aucun résidu non nul : la fenêtre ne traverse pas de fraction d\'heure',
  );
});

test('rattrapage — se rattraper en deux fois vaut se rattraper en une, sur des mois', () => {
  // CE TEST REMPLACE LES 72 h DE BOUCLE, et il couvre bien plus large pour un
  // coût nul : il est en temps constant, donc les horizons peuvent être
  // absurdes. Un mois d'absence, c'est 26 millions de ticks — impossible à
  // simuler tick par tick, mais la composition, elle, doit tenir.
  //
  // La propriété testée est celle dont dépend tout retour d'absence :
  // rattraper(a) puis rattraper(b) doit valoir rattraper(a + b). Si les résidus
  // ou la saturation se composaient mal, un joueur qui ouvre le jeu deux fois
  // n'obtiendrait pas la même chose que celui qui l'ouvre une fois.
  const TPH = TICKS_PAR_HEURE;
  const coupures = [
    [TPH, TPH], // deux heures pile
    [TPH + 1, TPH - 1], // la coupure tombe au milieu d'une heure
    [1, 30 * 24 * TPH], // un mois, coupé après un seul tick
    [7 * 24 * TPH, 23 * 24 * TPH], // une semaine puis trois
    [0, 5 * TPH], // une coupure vide ne doit rien changer
  ];

  for (const [a, b] of coupures) {
    const enUneFois = etatDeReference();
    rattraperJeu(enUneFois, a + b);

    const enDeuxFois = etatDeReference();
    rattraperJeu(enDeuxFois, a);
    rattraperJeu(enDeuxFois, b);

    assert.equal(
      JSON.stringify(enDeuxFois), JSON.stringify(enUneFois),
      `coupure ${a} + ${b} : les deux chemins divergent`,
    );
  }

  // Falsifiable : sur un mois, le stock doit avoir SATURÉ, sinon on ne teste la
  // composition que dans le régime facile où rien ne plafonne.
  const long = etatDeReference();
  const caps = capacitesMilli(long.disposition);
  rattraperJeu(long, 30 * 24 * TPH);
  assert.equal(long.economie.ressources.quartz, caps.quartz, 'le quartz devrait saturer en un mois');
  assert.equal(long.economie.ressources.electricite, caps.electricite);
});

test('rattrapage — une très longue absence reste exacte au bit près (contrôle BigInt)', () => {
  // GARDÉ TEL QUEL À LA BASCULE : c'est de l'arithmétique pure, elle ne dépend
  // pas du modèle de jeu. Ce que le test 11 ne peut PAS atteindre : une fenêtre
  // qu'on ne peut pas simuler tick par tick. La seule référence disponible est
  // l'arithmétique exacte, donc BigInt. Cinq cents tirages déterministes.
  const rng = creerRng(20260826);
  const TPH = TICKS_PAR_HEURE;
  let plusGrandIntermediaire = 0;

  for (let i = 0; i < 500; i++) {
    const debit = entier(rng, 1, Math.floor(DEBIT_MILLI_PAR_HEURE_MAX / 1000));
    const residuDepart = entier(rng, 0, TPH - 1);
    const nbTicks = entier(rng, 0, 3_200_000_000);

    const total = BigInt(residuDepart) + BigInt(nbTicks) * BigInt(debit);
    const gainAttendu = total / BigInt(TPH);
    const residuAttendu = total % BigInt(TPH);

    const heuresPleines = Math.floor(nbTicks / TPH);
    const ticksRestants = nbTicks - heuresPleines * TPH;
    const cumulPartiel = residuDepart + ticksRestants * debit;
    plusGrandIntermediaire = Math.max(plusGrandIntermediaire, cumulPartiel);
    const report = Math.floor(cumulPartiel / TPH);
    const residuObtenu = cumulPartiel - report * TPH;
    const gainObtenu = BigInt(heuresPleines) * BigInt(debit) + BigInt(report);

    assert.equal(gainObtenu, gainAttendu, `gain faux au tirage ${i}`);
    assert.equal(BigInt(residuObtenu), residuAttendu, `résidu faux au tirage ${i}`);
  }

  assert.ok(
    plusGrandIntermediaire <= Number.MAX_SAFE_INTEGER,
    `intermédiaire ${plusGrandIntermediaire} au-dessus de l'entier sûr`,
  );
  assert.ok(
    plusGrandIntermediaire > 1e12,
    `montage trop léger : plus grand intermédiaire ${plusGrandIntermediaire}`,
  );
});

test('sérialisation — le terrain N\'EST PAS sauvegardé, il se redéduit', () => {
  // Le terrain est une fonction de la position. L'écrire dans la sauvegarde
  // créerait une seconde source de vérité, donc une occasion de divergence
  // silencieuse. `serialiser` l'omet, `charger` le reconstruit.
  const etat = etatDeReference();
  const json = serialiser(etat, T0);
  assert.ok(!json.includes('"champs"'), 'le terrain est parti dans la sauvegarde');
  assert.ok(json.includes('"position"'), 'la position doit y être : c\'est la source');

  const recharge = charger(json, T0);
  assert.deepEqual(recharge.champs, etat.champs, 'le terrain redéduit diffère de l\'original');
  assert.equal(recharge.champs.cases.length, 12);
});

test('sérialisation — sauvegarder en pleine partie, recharger, poursuivre : trajectoires identiques', () => {
  const continu = etatDeReference();
  for (let t = 0; t < 5000; t++) tickJeu(continu);

  const interrompu = etatDeReference();
  for (let t = 0; t < 2000; t++) tickJeu(interrompu);
  const recharge = charger(serialiser(interrompu, T0), T0);
  for (let t = 2000; t < 5000; t++) tickJeu(recharge);

  assert.equal(serialiser(recharge, T0), serialiser(continu, T0));
  // Falsifiable : la partie doit avoir AVANCÉ, sinon comparer deux états
  // immobiles ne prouve rien.
  assert.ok(continu.economie.ressources.quartz > 137_000);
});

test('test 12 — une sauvegarde de version 0 traverse toute la chaîne, jusqu\'à la refondation', () => {
  // Sauvegarde v0 fabriquée à la main, avec tout ce qu'une vraie d'époque
  // portait : pas de version, pas de residuMs, un `colis`, des bâtiments du
  // modèle du lot 1.
  const v0 = {
    graine: 777,
    rng: { s: 123456 },
    horloge: { tempsSimuleMs: 250_000, nbTicks: 2500 },
    ressources: { quartzMilli: 42_000, scorieMilli: 7_000 },
    batiments: [
      { type: 'decapeuse', niveau: 5, colis: { enAttente: 1, progresTicks: 42 } },
    ],
  };

  const etat = charger(JSON.stringify(v0), T0);

  assert.equal(etat.version, SAVE_VERSION, 'version non mise à jour');
  assert.equal(SAVE_VERSION, 6, 'le bump de la version des sauvegardes a été oublié');

  // Le dernier maillon de la chaîne, v4 → v5, doit avoir été appliqué lui
  // aussi : sans `fondation` le terrain ne serait dérivable de rien.
  assert.ok(etat.fondation, 'le maillon v4 → v5 n\'a pas été appliqué');
  assert.deepEqual(etat.fondation, etat.position, 'une base refondée n\'a jamais bougé');

  // ⚠ CE QUI SURVIT : LE TEMPS, PAS LE CONTENU. La migration 3 → 4 REFONDE la
  // base — il n'existe aucune correspondance entre une `foreuse` sans
  // coordonnée et un collecteur qui doit se poser sur un champ. Inventer une
  // case reviendrait à fabriquer une partie qui n'a jamais été jouée.
  assert.equal(etat.graine, 777);
  assert.equal(etat.rng.s, 123456);
  assert.equal(etat.horloge.tempsSimuleMs, 250_000);
  assert.equal(etat.horloge.nbTicks, 2500);
  assert.equal(etat.horloge.residuMs, 0, 'le maillon v0 → v1 n\'a pas été appliqué');

  // ET CE QUI DISPARAÎT, asserté par `hasOwnProperty` : les clés du vieux
  // modèle ne doivent pas traîner à côté des nouvelles.
  for (const mort of ['batiments', 'ressources']) {
    assert.ok(
      !Object.prototype.hasOwnProperty.call(etat, mort),
      `la clé « ${mort} » du modèle du lot 1 a survécu à la migration`,
    );
  }

  // La base refondée est celle de n'importe quelle base neuve.
  assert.deepEqual(etat.disposition, [
    { id: 'chantierDeConstruction', niveau: 1, rangee: 18, colonne: 5 },
  ]);
  assert.deepEqual(etat.economie.ressources, { quartz: 0, scorie: 0, electricite: 0 });
  assert.deepEqual(etat.position, positionDepartJoueur());

  // L'état migré est fonctionnel : la boucle tourne dessus sans erreur.
  tickJeu(etat);
  assert.equal(etat.horloge.nbTicks, 2501);
});

test('migration — une sauvegarde plus récente que le jeu est refusée, pas corrompue', () => {
  assert.throws(
    () => migrer({ version: SAVE_VERSION + 1 }),
    /plus récente/,
    'charger une sauvegarde du futur devrait échouer explicitement',
  );
});

test('état — une sauvegarde injouable est REFUSÉE au chargement, pas jouée de travers', () => {
  // ⚠ LA DIFFÉRENCE AVEC `problemesDeDisposition` EST VOULUE. En cours de
  // partie, une disposition illégale est un fait de JEU : on la montre au
  // joueur, il purge. Au CHARGEMENT, c'est un fait de programme : la partie
  // n'est pas jouable, et continuer produirait des résultats faux en silence.
  const etat = creerEtat(999);
  const abime = JSON.parse(serialiser(etat, T0));
  // Un collecteur posé sur une case nue : illégal, et silencieux si on laisse
  // passer — il ne produirait simplement jamais rien.
  abime.disposition.push({ id: 'collecteur', rangee: 11, colonne: 1, niveau: 1 });
  abime.economie.residus.push({ quartz: 0, scorie: 0, electricite: 0 });
  assert.throws(() => charger(JSON.stringify(abime), T0), /injouable/);

  // Un état dont les résidus ne comptent pas les bâtiments : refusé aussi, et
  // par un message différent — les deux fautes ne se confondent pas.
  const desaccorde = JSON.parse(serialiser(etat, T0));
  desaccorde.economie.residus.push({ quartz: 0, scorie: 0, electricite: 0 });
  assert.throws(() => charger(JSON.stringify(desaccorde), T0), /résidus pour/);

  // Et une sauvegarde amputée d'un champ entier ne passe pas non plus.
  const ampute = JSON.parse(serialiser(etat, T0));
  delete ampute.disposition;
  assert.throws(() => charger(JSON.stringify(ampute), T0));
});

// ---------------------------------------------------------------------------
// Le terrain est gelé à la fondation — arbitrage du 27/08
// ---------------------------------------------------------------------------

test('état — le terrain suit la FONDATION, pas la position courante', () => {
  const etat = creerEtat(4242);

  // Montage falsifiable AVANT la mesure : il faut une destination dont le
  // terrain DIFFÈRE de celui de la fondation, sinon l'égalité qu'on va
  // asserter passerait toute seule et ne prouverait rien.
  const depart = etat.fondation;
  let ailleurs = null;
  for (let d = 1; d <= 40 && ailleurs === null; d++) {
    const candidat = { rangee: depart.rangee - d, colonne: depart.colonne };
    const terrain = champsDeLaBase(candidat.rangee, candidat.colonne);
    if (JSON.stringify(terrain.cases) !== JSON.stringify(etat.champs.cases)) {
      ailleurs = candidat;
    }
  }
  assert.ok(ailleurs, 'aucune case voisine ne donne un terrain différent : rien à mesurer');

  const avant = JSON.stringify(etat.champs.cases);

  // Le redéploiement n'existe pas encore : on simule ce qu'il fera, déplacer la
  // base sur la carte. C'est `position` qui bouge, et elle seule.
  etat.position = ailleurs;
  const recharge = charger(serialiser(etat, T0), T0);

  assert.deepEqual(recharge.fondation, depart, 'la fondation ne bouge pas');
  assert.deepEqual(recharge.position, ailleurs, 'la position, elle, a bougé');
  assert.equal(
    JSON.stringify(recharge.champs.cases), avant,
    'le terrain a suivi la position : c\'est exactement ce que l\'arbitrage du 27/08 interdit',
  );
  // Et le contrôle négatif : sous l'ancienne règle le terrain AURAIT changé.
  assert.notEqual(
    JSON.stringify(champsDeLaBase(ailleurs.rangee, ailleurs.colonne).cases), avant,
    'la destination choisie a le même terrain : le montage ne mesure rien',
  );
});

test('état — la fondation est SAUVEGARDÉE, le terrain toujours pas', () => {
  const etat = creerEtat(7);
  const brut = JSON.parse(serialiser(etat, T0));

  assert.ok(!('champs' in brut), 'le terrain ne doit pas entrer dans la sauvegarde');
  assert.deepEqual(brut.fondation, { rangee: etat.position.rangee, colonne: etat.position.colonne });

  // Une sauvegarde amputée de `fondation` est refusée au chargement : sans
  // elle le terrain ne peut plus être reconstruit du tout.
  //
  // ⚠ ON ASSERTE LE MESSAGE, PAS SEULEMENT QUE ÇA LÈVE. Sans `fondation`,
  // `charger` déréférence `undefined` et lève de toute façon — un simple
  // `assert.throws` passerait donc même si `verifierEtat` ne surveillait plus
  // le champ, et ne prouverait rien. La falsification l'a montré : retirer
  // `fondation` de la liste des champs obligatoires laissait ce test vert.
  // Ce qu'on veut, c'est le refus EXPLIQUÉ, qui nomme le champ manquant.
  const ampute = JSON.parse(serialiser(etat, T0));
  delete ampute.fondation;
  assert.throws(
    () => charger(JSON.stringify(ampute), T0),
    /champ « fondation » absent/,
  );
});

test('état — fondation et position sont deux objets DISTINCTS à la création', () => {
  // Partager la référence marcherait jusqu'au premier redéploiement, puis
  // déplacerait silencieusement le terrain avec la base. C'est le genre de
  // faute qu'aucune égalité de valeurs n'attrape.
  const etat = creerEtat(11);
  assert.deepEqual(etat.fondation, etat.position, 'à la fondation elles coïncident');
  assert.notEqual(etat.fondation, etat.position, 'mais ce ne doit PAS être le même objet');

  etat.position.rangee -= 20;
  assert.notEqual(etat.fondation.rangee, etat.position.rangee, 'la fondation a suivi la position');
});

test('état — migration 4 → 5 : une sauvegarde v4 garde EXACTEMENT son terrain', () => {
  const etat = creerEtat(31_415);
  const v4 = JSON.parse(serialiser(etat, T0));
  // On fabrique une vraie v4 : version rabaissée, `fondation` absente.
  v4.version = 4;
  delete v4.fondation;

  // Falsifiable : sous la v4 le terrain se déduisait de `position`. C'est CE
  // terrain-là qui doit ressortir, et on le calcule à part avant de charger.
  const terrainV4 = champsDeLaBase(v4.position.rangee, v4.position.colonne);
  assert.ok(terrainV4.cases.length > 0, 'terrain de contrôle vide : rien à comparer');

  const charge = charger(JSON.stringify(v4), T0);

  assert.equal(charge.version, SAVE_VERSION);
  assert.deepEqual(charge.fondation, v4.position, 'la migration pose fondation = position');
  assert.deepEqual(
    charge.champs.cases, terrainV4.cases,
    'la migration 4 → 5 a changé le terrain : elle ne doit RIEN perdre',
  );
});

// ---------------------------------------------------------------------------
// L'horloge murale et le rattrapage hors ligne — v6, arbitrage du 27/08
// ---------------------------------------------------------------------------

/**
 * Une base qui PRODUIT, pour que le rattrapage ait quelque chose à rattraper.
 * Chantier au niveau 5 (dix emplacements), un collecteur sur un champ de
 * quartz, une raffinerie à côté. Sans producteur, toutes les assertions de
 * production ci-dessous passeraient sur du code cassé.
 */
function baseQuiProduit(graine) {
  const etat = creerEtat(graine);
  etat.disposition[0].niveau = 5;
  const quartz = etat.champs.cases.filter((c) => c.ressource === 'quartz');
  assert.ok(quartz.length > 0, 'montage : pas un seul champ de quartz');
  etat.disposition.push(
    { id: 'collecteur', rangee: quartz[0].rangee, colonne: quartz[0].colonne, niveau: 10 },
    { id: 'raffinerie', rangee: quartz[0].rangee, colonne: quartz[0].colonne + 1, niveau: 10 },
  );
  etat.economie.residus.push(
    { quartz: 0, scorie: 0, electricite: 0 },
    { quartz: 0, scorie: 0, electricite: 0 },
  );
  return etat;
}

test('état — la sauvegarde porte l\'instant d\'écriture, l\'état ne le porte pas', () => {
  const etat = creerEtat(5);
  const brut = JSON.parse(serialiser(etat, T0));
  assert.equal(brut.instantSauvegardeMs, T0, 'la sauvegarde doit dater son écriture');

  // ⚠ LE CHEMIN INVERSE DU TERRAIN. Le terrain vit dans l'état et sort de la
  // sauvegarde ; l'instant vit dans la sauvegarde et n'entre pas dans l'état.
  const recharge = charger(JSON.stringify(brut), T0);
  assert.ok(!('instantSauvegardeMs' in recharge), 'l\'instant ne descend pas dans l\'état');
  assert.ok(!('champs' in brut), 'le terrain ne monte pas dans la sauvegarde');
});

test('état — huit heures hors ligne PRODUISENT, et autant que huit heures de ticks', () => {
  const etat = baseQuiProduit(77);

  // Falsifiable d'abord : le montage doit produire quelque chose, sinon
  // l'égalité plus bas serait 0 === 0.
  const uneHeure = charger(serialiser(etat, T0), T0 + HEURE_MS);
  assert.ok(uneHeure.economie.ressources.quartz > 0, 'le montage ne produit rien');
  assert.equal(uneHeure.horloge.nbTicks, TICKS_PAR_HEURE, 'une heure doit valoir TICKS_PAR_HEURE');

  // Et il ne doit pas SATURER en huit heures, sinon la composition ci-dessous
  // serait vraie pour une raison sans rapport — deux plafonds sont égaux.
  const huit = charger(serialiser(etat, T0), T0 + 8 * HEURE_MS);
  assert.ok(
    huit.economie.ressources.quartz > uneHeure.economie.ressources.quartz,
    'le stock sature avant huit heures : le montage ne mesure plus le rattrapage',
  );

  // Rattraper 8 h d'un coup == rattraper 5 h puis 3 h. C'est le contrôle de
  // composition, en temps constant, du lot TICK.
  const cinq = charger(serialiser(etat, T0), T0 + 5 * HEURE_MS);
  const puisTrois = charger(serialiser(cinq, T0), T0 + 3 * HEURE_MS);
  assert.deepEqual(
    puisTrois.economie.ressources, huit.economie.ressources,
    '5 h + 3 h doit valoir 8 h, sinon le rattrapage n\'est pas exact',
  );
  assert.equal(puisTrois.horloge.nbTicks, huit.horloge.nbTicks);
});

test('état — une horloge qui RECULE ne produit rien et ne lève pas', () => {
  // Fuseau, NTP, joueur qui change la date de son téléphone. Refuser la
  // sauvegarde le punirait pour l'heure de son appareil.
  const etat = baseQuiProduit(88);
  const json = serialiser(etat, T0);

  const recule = charger(json, T0 - 3 * HEURE_MS);
  assert.equal(recule.horloge.nbTicks, 0, 'une durée négative ne doit avancer de rien');
  // ⚠ « RIEN PRODUIT » NE VEUT PLUS DIRE « ZÉRO » depuis l'amorce du 27/08 :
  // le montage part de `creerEtat`, donc de 30 · 30 · 20. Ce qu'on vérifie est
  // que le recul n'a RIEN CHANGÉ — comparer à l'état d'avant, pas à zéro.
  assert.deepEqual(recule.economie.ressources, etat.economie.ressources);

  // Falsifiable : le même montage, en avançant, produit bien — donc le zéro
  // ci-dessus vient du recul et pas d'une base stérile.
  const avance = charger(json, T0 + 3 * HEURE_MS);
  assert.ok(avance.economie.ressources.quartz > 0, 'le montage ne produit rien');
});

test('état — dix ans d\'absence SATURENT sans lever et sans déborder', () => {
  // Le rattrapage borne les heures pleines à ce qu'il faut pour saturer : au
  // delà, le stock vaut la capacité de toute façon. Mesuré ici de face plutôt
  // que supposé — 3,15 milliards de ticks.
  const etat = baseQuiProduit(99);
  const json = serialiser(etat, T0);
  const dixAns = 10 * 365 * 24 * HEURE_MS;

  const vieux = charger(json, T0 + dixAns);
  assert.equal(vieux.horloge.nbTicks, (dixAns / 100), 'les ticks doivent être comptés en entier');

  const plafonds = capacitesMilli(etat.disposition);
  assert.equal(
    vieux.economie.ressources.quartz, plafonds.quartz,
    'dix ans doivent saturer exactement, ni moins ni plus',
  );
  // Falsifiable : le plafond doit être atteignable ET non nul.
  assert.ok(plafonds.quartz > 0, 'capacité nulle : rien à saturer');

  // Un mois et dix ans donnent le même stock — c'est la définition de saturé.
  const unMois = charger(json, T0 + 30 * 24 * HEURE_MS);
  assert.deepEqual(unMois.economie.ressources, vieux.economie.ressources);
});

test('état — un instant mural absurde est REFUSÉ des deux côtés', () => {
  const etat = creerEtat(3);
  for (const absurde of [undefined, null, -1, 1.5, NaN, Infinity, '1700000000000']) {
    assert.throws(() => serialiser(etat, absurde), RangeError, `serialiser a accepté ${absurde}`);
    assert.throws(() => charger(serialiser(etat, T0), absurde), RangeError, `charger a accepté ${absurde}`);
  }
  // Et une sauvegarde dont l'instant a été trafiqué ne passe pas non plus.
  const trafique = JSON.parse(serialiser(etat, T0));
  trafique.instantSauvegardeMs = 'hier';
  assert.throws(() => charger(JSON.stringify(trafique), T0), RangeError);
});

test('état — migration 5 → 6 : une sauvegarde v5 ne donne AUCUNE absence', () => {
  // On ne sait pas quand elle a été écrite. Lui inventer une durée
  // fabriquerait des ressources.
  const etat = baseQuiProduit(123);
  const v5 = JSON.parse(serialiser(etat, T0));
  v5.version = 5;
  delete v5.instantSauvegardeMs;

  const charge = charger(JSON.stringify(v5), T0 + 100 * HEURE_MS);
  assert.equal(charge.version, SAVE_VERSION);
  assert.equal(charge.horloge.nbTicks, 0, 'cent heures ont été fabriquées à partir de rien');
  // ⚠ ON COMPARE À L'ÉTAT D'AVANT, PAS À ZÉRO — et c'est le test qui a montré
  // que l'amorce du 27/08 n'avait rien à faire dans `creerEtatEconomie` : une
  // v5 qu'on monte en v6 repasse par elle, et le joueur aurait touché 30 · 30
  // · 20 une seconde fois, à chaque montée de version. « Aucune absence »
  // veut dire « rien n'a bougé », pas « les poches sont vides ».
  assert.deepEqual(charge.economie.ressources, etat.economie.ressources);

  // Falsifiable : la MÊME sauvegarde en v6 aurait bien rattrapé les cent
  // heures. Sans ce contrôle, le zéro ci-dessus pourrait venir du montage.
  const enV6 = charger(serialiser(etat, T0), T0 + 100 * HEURE_MS);
  assert.ok(enV6.economie.ressources.quartz > 0, 'le montage ne produit rien');
});

// ---------------------------------------------------------------------------
// Poser un bâtiment — lot POSE
// ---------------------------------------------------------------------------

test('état — poser un bâtiment de niveau 1 ne coûte RIEN', () => {
  const etat = creerEtat(2026);
  const champ = etat.champs.cases.find((c) => c.ressource === 'quartz');
  assert.ok(champ, 'montage : pas un seul champ de quartz');

  // Falsifiable : il faut d'abord des stocks NON NULS, sinon « rien n'a été
  // prélevé » serait vrai sur une base qui n'a rien.
  etat.economie.ressources.quartz = 5_000_000;
  etat.economie.ressources.scorie = 3_000_000;
  const avant = { ...etat.economie.ressources };

  poser(etat, 'collecteur', champ.rangee, champ.colonne);

  assert.deepEqual(etat.economie.ressources, avant, 'poser a prélevé quelque chose');
  assert.equal(etat.disposition.length, 2);
  assert.equal(etat.disposition[1].niveau, 1, 'une pose se fait toujours au niveau 1');
});

test('état — le résidu suit le bâtiment posé, et le tick le prouve', () => {
  const etat = creerEtat(4242);
  const champ = etat.champs.cases.find((c) => c.ressource === 'quartz');

  // ⚠ IL FAUT DEUX EMPLACEMENTS, ET UNE BASE NEUVE N'EN A QU'UN DE LIBRE.
  // Un collecteur seul produit 240/h dans une capacité de ZÉRO — sans
  // raffinerie, `capacitesMilli` rend 0 et le stock ne bouge jamais. Ce test
  // est tombé sur ce mur au premier jet, et c'est ainsi qu'a été trouvé le
  // blocage de la base neuve (voir le rapport du lot POSE). Ici on monte le
  // Chantier à 2 pour ouvrir la place ; ce n'est PAS ce que le jeu permet
  // aujourd'hui, et c'est exactement le point qu'Ethan doit arbitrer.
  etat.disposition[0].niveau = 2;
  const nue = etat.champs.cases.some((c) => c.rangee === champ.rangee + 1 && c.colonne === champ.colonne)
    ? { rangee: champ.rangee - 1, colonne: champ.colonne }
    : { rangee: champ.rangee + 1, colonne: champ.colonne };
  // ⚠ Une raffinerie ne se pose PAS sur un champ — `champ-gache` : le terrain
  // est réservé au Collecteur. Le montage doit donc viser une case nue, et le
  // vérifier plutôt que l'espérer.
  assert.deepEqual(problemesDeLaPose(etat, 'raffinerie', nue.rangee, nue.colonne), []);
  poser(etat, 'raffinerie', nue.rangee, nue.colonne);
  poser(etat, 'collecteur', champ.rangee, champ.colonne);

  assert.equal(etat.economie.residus.length, etat.disposition.length);
  // Le montage doit produire ET pouvoir stocker, sinon il ne mesure rien.
  assert.ok(capacitesMilli(etat.disposition).quartz > 0, 'montage : capacité nulle');

  // ⚠ SANS LE RÉSIDU AJOUTÉ, C'EST LE TICK QUI LÈVE, PAS LA POSE.
  // `economie-base` asserte que les deux listes ont la même longueur : la faute
  // apparaîtrait loin de sa cause. On la mesure donc par le tick.
  for (let t = 0; t < TICKS_PAR_HEURE; t++) tickJeu(etat);
  assert.ok(
    etat.economie.ressources.quartz > 0,
    'le collecteur posé ne produit rien : la pose n\'a pas branché le bâtiment',
  );
});

test('état — une pose illégale est REFUSÉE, et elle dit laquelle', () => {
  const etat = creerEtat(7);
  const champ = etat.champs.cases.find((c) => c.ressource === 'quartz');

  // Un collecteur hors d'un champ : le champ décide de sa ressource, hors champ
  // il ne produirait rien et ne le dirait pas.
  assert.deepEqual(
    problemesDeLaPose(etat, 'collecteur', 11, 1).map((p) => p.code), ['hors-champ'],
  );
  // Un second Chantier : `unique` vaut true.
  assert.deepEqual(
    problemesDeLaPose(etat, 'chantierDeConstruction', 11, 1).map((p) => p.code), ['doublon'],
  );
  // La case du Chantier lui-même.
  const chantier = etat.disposition[0];
  assert.deepEqual(
    problemesDeLaPose(etat, 'centrale', chantier.rangee, chantier.colonne).map((p) => p.code),
    ['superposition'],
  );
  // Et le plafond d'emplacements : un Chantier niveau 1 en ouvre deux, il en
  // occupe un, il reste UN. Le deuxième bâtiment passe, le troisième non.
  assert.deepEqual(problemesDeLaPose(etat, 'centrale', 11, 1), []);
  poser(etat, 'centrale', 11, 1);
  assert.deepEqual(
    problemesDeLaPose(etat, 'accumulateur', 11, 2).map((p) => p.code), ['trop-de-batiments'],
  );

  // `poser` LÈVE là où `problemesDeLaPose` rend une liste — appelée sans avoir
  // regardé, c'est un fait de programme.
  const avant = etat.disposition.length;
  assert.throws(() => poser(etat, 'accumulateur', 11, 2), /pose illégale/);
  assert.equal(etat.disposition.length, avant, 'une pose refusée ne doit rien laisser derrière');
  assert.equal(etat.economie.residus.length, avant, 'ni résidu orphelin');
});

test('état — une base déjà bancale reste constructible', () => {
  // ⚠ POURQUOI CE TEST. Un raid peut amputer une base, une vieille sauvegarde
  // peut porter une disposition douteuse. Si `problemesDeLaPose` remontait les
  // défauts PRÉEXISTANTS, toute pose deviendrait impossible et le joueur serait
  // enfermé — alors qu'aucun de ces défauts ne vient de sa pose.
  const etat = creerEtat(31);
  etat.disposition[0].niveau = 5; // dix emplacements, de la place
  const champs = etat.champs.cases.filter((c) => c.ressource === 'quartz');
  // On abîme la base : une centrale posée sur un champ, ce qui gâche le champ.
  etat.disposition.push({ id: 'centrale', rangee: champs[0].rangee, colonne: champs[0].colonne, niveau: 1 });
  etat.economie.residus.push({ quartz: 0, scorie: 0, electricite: 0 });

  // Le montage doit vraiment être bancal, sinon le test ne mesure rien.
  assert.ok(
    problemesDeDisposition(etat.disposition, etat.champs).length > 0,
    'montage : la base n\'est pas bancale, rien à filtrer',
  );
  // Et une pose légale reste légale malgré ça.
  assert.deepEqual(problemesDeLaPose(etat, 'collecteur', champs[1].rangee, champs[1].colonne), []);
});

// ---------------------------------------------------------------------------
// Améliorer et démolir — lot du 27/08 au soir
// ---------------------------------------------------------------------------
//
// ⚠ CES DEUX MUTATIONS SONT LES PREMIÈRES QUI DÉPENSENT. Tout ce que le moteur
// faisait jusqu'ici ne faisait qu'ajouter aux stocks. Les tests portent donc
// autant sur ce qui NE bouge PAS quand l'opération est refusée que sur ce qui
// bouge quand elle passe : un refus qui débiterait quand même serait invisible
// à un test qui ne regarde que le verdict.

/** Une base neuve avec un collecteur posé sur un vrai champ, et de quoi payer. */
function baseAvecCollecteur(quartzMilli = 100_000_000) {
  const etat = creerEtat(20260827);
  const premierChamp = etat.champs.cases[0];
  poser(etat, 'collecteur', premierChamp.rangee, premierChamp.colonne);
  etat.economie.ressources = {
    quartz: quartzMilli, scorie: quartzMilli, electricite: quartzMilli,
  };
  assert.equal(etat.disposition.length, 2);
  assert.equal(etat.economie.residus.length, 2);
  return etat;
}

test('état — améliorer monte d\'un niveau et débite exactement le palier', () => {
  const etat = baseAvecCollecteur();
  const avant = { ...etat.economie.ressources };
  const cout = coutDeMontee('collecteur', 2);

  // Falsifiable : un palier gratuit rendrait le débit indétectable.
  assert.ok(cout.quartz > 0, 'le montage ne mesure rien : palier gratuit');

  ameliorer(etat, 1);

  assert.equal(etat.disposition[1].niveau, 2);
  for (const r of ['quartz', 'scorie', 'electricite']) {
    assert.equal(etat.economie.ressources[r], avant[r] - cout[r] * 1000, `débit en ${r}`);
  }
  // Le Chantier n'a pas bougé : améliorer ne touche QUE l'indice visé.
  assert.equal(etat.disposition[0].niveau, 1);

  // Deux montées d'affilée débitent deux paliers DIFFÉRENTS — sinon un module
  // qui relirait toujours le palier 2 passerait la première assertion.
  const apresUn = { ...etat.economie.ressources };
  ameliorer(etat, 1);
  assert.equal(etat.disposition[1].niveau, 3);
  const debitDeux = apresUn.quartz - etat.economie.ressources.quartz;
  assert.equal(debitDeux, coutDeMontee('collecteur', 3).quartz * 1000);
  assert.notEqual(debitDeux, cout.quartz * 1000);
});

test('état — améliorer sans les ressources est REFUSÉ, et rien n\'est débité', () => {
  const etat = baseAvecCollecteur(0);
  const avant = { ...etat.economie.ressources };

  const problemes = problemesDeLAmelioration(etat, 1);
  assert.ok(problemes.length > 0, 'un stock à zéro doit refuser');
  assert.ok(problemes.some((p) => p.code === 'manque:quartz'), 'le manque doit nommer la ressource');
  // Le message CHIFFRE ce qui manque : un message qui dirait seulement
  // « ressources insuffisantes » ne permettrait pas au joueur de viser.
  assert.match(problemes.find((p) => p.code === 'manque:quartz').message, /\d/);

  assert.throws(() => ameliorer(etat, 1), /impossible/);

  // ⚠ LE CŒUR DU TEST. Un refus qui aurait déjà débité, ou déjà monté le
  // niveau, passerait le `throws` ci-dessus sans que rien ne le dise.
  assert.equal(etat.disposition[1].niveau, 1);
  assert.deepEqual(etat.economie.ressources, avant);

  // Et avec juste ce qu'il faut, ça passe : le refus vient bien du stock, pas
  // d'un blocage permanent.
  const cout = coutDeMontee('collecteur', 2);
  for (const r of ['quartz', 'scorie', 'electricite']) {
    etat.economie.ressources[r] = cout[r] * 1000;
  }
  assert.deepEqual(problemesDeLAmelioration(etat, 1), []);
  ameliorer(etat, 1);
  assert.equal(etat.disposition[1].niveau, 2);
});

test('état — démolir rend 90 %, retire la ligne, et retire son résidu', () => {
  const etat = baseAvecCollecteur();
  ameliorer(etat, 1);
  ameliorer(etat, 1); // niveau 3, donc un investi non nul dans les deux canaux
  const avant = { ...etat.economie.ressources };
  const investi = coutCumule('collecteur', 3);
  assert.ok(investi.quartz > 0 && investi.electricite > 0, 'montage sans investi mesurable');

  const rendu = demolir(etat, 1);

  assert.deepEqual(rendu, remboursementDuNiveau('collecteur', 3));
  assert.ok(rendu.quartz < investi.quartz, 'le rendu doit être amputé de 10 %');
  for (const r of ['quartz', 'scorie', 'electricite']) {
    assert.equal(etat.economie.ressources[r], avant[r] + rendu[r] * 1000, `rendu en ${r}`);
  }

  // ⚠ LES DEUX LISTES PARALLÈLES RESTENT ALIGNÉES. `verifierEtat` refuse un
  // état dont les résidus ne comptent pas comme la disposition, et il lèverait
  // au prochain CHARGEMENT — donc loin de la faute.
  assert.equal(etat.disposition.length, 1);
  assert.equal(etat.economie.residus.length, 1);
  assert.equal(etat.disposition[0].id, 'chantierDeConstruction');

  // La sauvegarde relit l'état sans broncher : la preuve que l'alignement tient.
  assert.doesNotThrow(() => charger(serialiser(etat, T0), T0));
});

test('état — le Chantier de construction ne se démolit pas', () => {
  const etat = baseAvecCollecteur();
  const problemes = problemesDeLaDemolition(etat, 0);
  assert.ok(problemes.some((p) => p.code === 'central'), 'le Chantier doit être protégé');

  assert.throws(() => demolir(etat, 0), /impossible/);
  // Rien n'a été rendu, rien n'a été retiré.
  assert.equal(etat.disposition.length, 2);
  assert.equal(etat.disposition[0].id, 'chantierDeConstruction');

  // Falsifiable : le collecteur du même montage, lui, se démolit — sinon le
  // test passerait sur un module qui refuserait TOUTE démolition.
  assert.deepEqual(problemesDeLaDemolition(etat, 1), []);
  assert.doesNotThrow(() => demolir(etat, 1));
});

test('état — l\'amorce est SERVIE une fois, à la fondation, et jamais reservie', () => {
  // ⚠ CE TEST EST NÉ D'UN DÉFAUT. L'amorce a d'abord été posée dans
  // `creerEtatEconomie`. Huit tests sont tombés, dont deux sur les migrations :
  // toute sauvegarde qu'on monte de version repasse par cette fonction, et le
  // joueur aurait touché 30 · 30 · 20 à CHAQUE montée. Ce qui suit interdit le
  // retour du défaut par les deux chemins qui pourraient le ramener.
  const neuve = creerEtat(777);
  assert.deepEqual(neuve.economie.ressources,
    { quartz: 30_000, scorie: 30_000, electricite: 20_000 });

  // 1. Une sauvegarde rechargée ne redote pas.
  const rechargee = charger(serialiser(neuve, T0), T0);
  assert.deepEqual(rechargee.economie.ressources, neuve.economie.ressources);

  // 2. Une sauvegarde DÉPENSÉE puis rechargée garde ses poches vides.
  const depensee = creerEtat(778);
  for (const r of ['quartz', 'scorie', 'electricite']) depensee.economie.ressources[r] = 0;
  const apres = charger(serialiser(depensee, T0), T0);
  assert.deepEqual(apres.economie.ressources, { quartz: 0, scorie: 0, electricite: 0 });

  // 3. `creerEtatEconomie`, appelée seule, rend une économie VIDE : c'est la
  //    forme d'une économie, pas la dotation d'un joueur.
  assert.deepEqual(creerEtatEconomie(neuve.disposition).ressources,
    { quartz: 0, scorie: 0, electricite: 0 });

  // Falsifiable : l'amorce doit être NON NULLE, sinon les trois contrôles
  // ci-dessus passeraient sur un jeu qui ne dote personne.
  for (const r of ['quartz', 'scorie', 'electricite']) {
    assert.ok(STOCK_DE_DEPART[r] > 0, `amorce nulle en ${r}`);
  }
});

test('état — l\'amorce paie de quoi démarrer, et c\'est vérifié sur les prix réels', () => {
  // ⚠ CE QUE L'AMORCE DOIT PERMETTRE, arbitré le 27/08 : que le joueur ait une
  // action payable dès la première image. Le vérifier sur les COÛTS RÉELS
  // plutôt que sur les nombres 30 · 30 · 20 — si un prix montait, c'est ici
  // que ça devrait se voir, pas dans une partie livrée injouable.
  const etat = creerEtat(779);
  const champ = etat.champs.cases[0];
  poser(etat, 'collecteur', champ.rangee, champ.colonne);

  assert.deepEqual(problemesDeLAmelioration(etat, 1), [],
    'l\'amorce ne paie même pas la première montée du collecteur');
  ameliorer(etat, 1);
  assert.equal(etat.disposition[1].niveau, 2);

  // Et il lui reste de quoi faire autre chose : une amorce qui financerait
  // EXACTEMENT une action laisserait le joueur bloqué juste après.
  assert.ok(etat.economie.ressources.quartz > 0, 'l\'amorce est épuisée par une seule montée');
});

test('état — une règle née APRÈS les sauvegardes ne rend pas une partie illisible', () => {
  // ⚠ LE PROBLÈME QUE CE TEST GARDE. `verifierEtat` LÈVE là où
  // `problemesDeDisposition` rend une liste, et c'est la bonne règle : au
  // chargement, une disposition illégale est un fait de PROGRAMME. Mais elle a
  // une limite qu'on a rencontrée le 28/08 : une règle AJOUTÉE APRÈS COUP rend
  // illégales des bases qui étaient légales quand le joueur les a construites.
  //
  // `uniques-voisins` est ce cas exactement. La base d'Ethan, mesurée sur sa
  // capture du 28/08, porte le Centre de commandement, le QG de défense et le
  // Chantier côte à côte. Faire lever le chargement là-dessus aurait rendu sa
  // partie INJOUABLE, pour une faute qu'il n'a pas commise.
  const etat = creerEtat(4242);
  // Le Chantier monte d'abord : à son niveau 1 il n'ouvre que deux emplacements,
  // et le montage en réclamerait un troisième — le test mesurerait alors le
  // plafond d'emplacements au lieu de la règle qu'il vise.
  etat.disposition[0].niveau = 6;
  etat.disposition.push({ id: 'centreDeCommandement', rangee: 18, colonne: 4, niveau: 1 });
  etat.disposition.push({ id: 'qgDeDefense', rangee: 18, colonne: 6, niveau: 1 });
  etat.economie.residus.push({}, {});

  // Le montage doit VRAIMENT violer la règle, sinon il ne mesure rien.
  const defauts = problemesDeDisposition(etat.disposition, etat.champs);
  assert.ok(defauts.length > 0, 'le montage devrait être illégal');
  assert.ok(defauts.every((p) => p.code === 'uniques-voisins'),
    'le montage ne doit violer QUE la règle tolérée');

  // Et il se charge quand même, avec ses trois bâtiments.
  const instant = 1_700_000_000_000;
  const relu = charger(serialiser(etat, instant), instant + 3_600_000);
  assert.equal(relu.disposition.length, 3);

  // ⚠ TOLÉRÉ N'EST PAS EFFACÉ. Le défaut reste SIGNALÉ — l'écran le montre — et
  // il interdit toujours toute NOUVELLE pose au contact d'un unique, puisque
  // `problemesDeLaPose` ne filtre que les défauts PRÉEXISTANTS.
  assert.ok(problemesDeDisposition(relu.disposition, relu.champs).length > 0,
    'le défaut doit rester visible après chargement');
  assert.ok(problemesDeLaPose(relu, 'caserne', 17, 5).some((p) => p.code === 'uniques-voisins'),
    'poser un unique au contact d\'un autre doit rester refusé');
  assert.deepEqual(problemesDeLaPose(relu, 'centrale', 17, 5), [],
    'un non-unique n\'est pas concerné par la règle');

  // ⚠ ET L'ENSEMBLE RESTE MINUSCULE. Un code de faute STRUCTURELLE n'a rien à y
  // faire : ceux-là n'ont jamais été légaux, donc aucune sauvegarde honnête ne
  // les porte, et les tolérer ferait tourner le moteur sur un état incohérent.
  assert.deepEqual([...CODES_TOLERES_AU_CHARGEMENT], ['uniques-voisins']);
  for (const structurel of ['sans-chantier', 'superposition', 'hors-base', 'inconnu', 'doublon']) {
    assert.ok(!CODES_TOLERES_AU_CHARGEMENT.has(structurel),
      `${structurel} est structurel, il ne doit jamais être toléré`);
  }

  // Falsifiable : une faute STRUCTURELLE fait toujours lever le chargement.
  const casse = creerEtat(4242);
  casse.disposition[0].niveau = 6;
  casse.disposition.push({ id: 'caserne', rangee: 18, colonne: 5, niveau: 1 }); // sur le Chantier
  casse.economie.residus.push({});
  assert.throws(
    () => charger(serialiser(casse, instant), instant),
    /injouable/,
    'une superposition doit continuer de faire lever le chargement',
  );
});
