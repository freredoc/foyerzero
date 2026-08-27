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
} from '../src/sim/state.js';
import { DEBIT_MILLI_PAR_HEURE_MAX, capacitesMilli } from '../src/sim/economie-base.js';
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
  assert.deepEqual(etat.economie.ressources, { quartz: 0, scorie: 0, electricite: 0 });
  assert.equal(etat.champs.cases.length, 12);

  // ⚠ UNE BASE QUI N'A QUE SON CHANTIER NE PRODUIT RIEN, et c'est juste : ni
  // collecteur, ni centrale. Après une heure pleine, les trois stocks sont
  // encore à zéro. Un moteur qui produirait « un peu » de quelque chose ici
  // serait faux, et personne ne le verrait sans cette assertion.
  for (let t = 0; t < TICKS_PAR_HEURE; t++) tickJeu(etat);
  assert.deepEqual(etat.economie.ressources, { quartz: 0, scorie: 0, electricite: 0 });
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
  assert.deepEqual(recule.economie.ressources, { quartz: 0, scorie: 0, electricite: 0 });

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
  assert.deepEqual(charge.economie.ressources, { quartz: 0, scorie: 0, electricite: 0 });

  // Falsifiable : la MÊME sauvegarde en v6 aurait bien rattrapé les cent
  // heures. Sans ce contrôle, le zéro ci-dessus pourrait venir du montage.
  const enV6 = charger(serialiser(etat, T0), T0 + 100 * HEURE_MS);
  assert.ok(enV6.economie.ressources.quartz > 0, 'le montage ne produit rien');
});
