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
  const json = serialiser(etat);
  assert.ok(!json.includes('"champs"'), 'le terrain est parti dans la sauvegarde');
  assert.ok(json.includes('"position"'), 'la position doit y être : c\'est la source');

  const recharge = charger(json);
  assert.deepEqual(recharge.champs, etat.champs, 'le terrain redéduit diffère de l\'original');
  assert.equal(recharge.champs.cases.length, 12);
});

test('sérialisation — sauvegarder en pleine partie, recharger, poursuivre : trajectoires identiques', () => {
  const continu = etatDeReference();
  for (let t = 0; t < 5000; t++) tickJeu(continu);

  const interrompu = etatDeReference();
  for (let t = 0; t < 2000; t++) tickJeu(interrompu);
  const recharge = charger(serialiser(interrompu));
  for (let t = 2000; t < 5000; t++) tickJeu(recharge);

  assert.equal(serialiser(recharge), serialiser(continu));
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

  const etat = charger(JSON.stringify(v0));

  assert.equal(etat.version, SAVE_VERSION, 'version non mise à jour');
  assert.equal(SAVE_VERSION, 4, 'le bump de la version des sauvegardes a été oublié');

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
  const abime = JSON.parse(serialiser(etat));
  // Un collecteur posé sur une case nue : illégal, et silencieux si on laisse
  // passer — il ne produirait simplement jamais rien.
  abime.disposition.push({ id: 'collecteur', rangee: 11, colonne: 1, niveau: 1 });
  abime.economie.residus.push({ quartz: 0, scorie: 0, electricite: 0 });
  assert.throws(() => charger(JSON.stringify(abime)), /injouable/);

  // Un état dont les résidus ne comptent pas les bâtiments : refusé aussi, et
  // par un message différent — les deux fautes ne se confondent pas.
  const desaccorde = JSON.parse(serialiser(etat));
  desaccorde.economie.residus.push({ quartz: 0, scorie: 0, electricite: 0 });
  assert.throws(() => charger(JSON.stringify(desaccorde)), /résidus pour/);

  // Et une sauvegarde amputée d'un champ entier ne passe pas non plus.
  const ampute = JSON.parse(serialiser(etat));
  delete ampute.disposition;
  assert.throws(() => charger(JSON.stringify(ampute)));
});
