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
  problemesDuDeplacement,
  deplacer,
  FORCES, poserEffectif, retirerEffectif, deplacerEffectif,
  problemesDeLaPoseDEffectif, problemesDuDeplacementDEffectif,
  niveauDeCommandement, niveauDuChantier, batimentDeProductionManquant,
} from '../src/sim/state.js';
import { budgetDuNiveau as budgetOffense, arsenalVide, poser as poserUnite } from '../src/ui/arsenal.js';
import { budgetDuNiveau as budgetDefense } from '../src/ui/defense.js';
import { POINTS_ARMEE, GEOGRAPHIE } from '../src/data/sites.js';
import { gratuitesDe, ARBRE_RECHERCHE } from '../src/data/recherche.js';
import { UNITES, DEFENSES } from '../src/data/combat.js';
import {
  coutDeMontee, coutCumule, remboursementDuNiveau, emplacementsDuNiveau,
} from '../src/data/base.js';
import {
  DEBIT_MILLI_PAR_HEURE_MAX, capacitesMilli, STOCK_DE_DEPART, creerEtatEconomie,
} from '../src/sim/economie-base.js';
import { problemesDeDisposition } from '../src/sim/disposition.js';
import { creerRng, entier } from '../src/sim/rng.js';
import { positionDepartJoueur } from '../src/sim/carte.js';
import { champsDeLaBase, obstaclesDeLaBase } from '../src/sim/champs.js';
import {
  TICKS_APPARITION, satellitesVides, planifierSatellites, resoudreSatellites,
  detruireSatellite, casesDeLAnneau, ANNEAUX,
} from '../src/sim/satellites.js';
import { GRILLE, OBSTACLES } from '../src/data/combat.js';

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
  // ⚠ `degatsMilli` EST ENTRÉ AU LOT RAID-B (02/09) : depuis que l'Ouvrage
  // attaque la base, un bâtiment du joueur peut être endommagé. Un bâtiment
  // neuf est intact, donc il porte ZÉRO — et le champ est PRÉSENT plutôt
  // qu'absent, comme sur une pièce de garnison ou d'armée.
  assert.deepEqual(etat.disposition, [
    {
      id: 'chantierDeConstruction', niveau: 1, rangee: 18, colonne: 5, degatsMilli: 0,
    },
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
  assert.equal(SAVE_VERSION, 21, 'le bump de la version des sauvegardes a été oublié');

  // Le maillon v4 → v5 doit avoir été appliqué lui aussi : sans `fondation` le
  // terrain ne serait dérivable de rien.
  assert.ok(etat.fondation, 'le maillon v4 → v5 n\'a pas été appliqué');
  assert.deepEqual(etat.fondation, etat.position, 'une base refondée n\'a jamais bougé');

  // Et le dernier, v6 → v7 : les deux forces existent et sont VIDES. Une
  // sauvegarde v0 ne portait évidemment aucune composition — il n'y a rien à
  // convertir, et deux listes vides sont exactement ce que la partie avait.
  assert.deepEqual(etat.garnison, [], 'le maillon v6 → v7 n\'a pas été appliqué');
  assert.deepEqual(etat.armee, [], 'le maillon v6 → v7 n\'a pas été appliqué');

  // Et v7 → v8 : les satellites sont PROGRAMMÉS, pas posés. Une sauvegarde v0
  // n'a jamais eu de voisins ; les faire paraître à l'instant du chargement
  // sauterait les cinq minutes arbitrées le 29/08.
  assert.deepEqual(etat.satellites.presents, [], 'le maillon v7 → v8 pose au lieu de programmer');
  assert.equal(etat.satellites.attentes.length, 3, 'deux camps et un avant-poste');
  assert.deepEqual(
    etat.satellites.attentes.map((a) => a.type).sort(),
    ['avantPoste', 'camp', 'camp'],
  );

  // Et v8 → v9 : la mini-fenêtre du tutoriel est OUVERTE. Une sauvegarde v0
  // n'a jamais eu de croix à cliquer ; la déclarer fermée priverait son joueur
  // du tutoriel pour un geste qu'il n'a pas fait.
  assert.deepEqual(etat.tutoriel, { ferme: false }, 'le maillon v8 → v9 n\'a pas été appliqué');

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
    {
      id: 'chantierDeConstruction', niveau: 1, rangee: 18, colonne: 5, degatsMilli: 0,
    },
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
  // Et le plafond d'emplacements. ⚠ IL MORD UN CRAN PLUS LOIN DEPUIS LE 29/08 :
  // un Chantier de niveau 1 ouvre TROIS emplacements et en occupe un, il en
  // reste deux. Le compte se LIT plutôt que de se réécrire — la prochaine table
  // le déplacera encore.
  const libres = emplacementsDuNiveau(etat.disposition[0].niveau) - etat.disposition.length;
  assert.equal(libres, 2, 'montage : ce test mesure le plafond, il doit savoir où il est');
  assert.deepEqual(problemesDeLaPose(etat, 'centrale', 11, 1), []);
  poser(etat, 'centrale', 11, 1);
  assert.deepEqual(problemesDeLaPose(etat, 'accumulateur', 11, 2), []);
  poser(etat, 'accumulateur', 11, 2);
  assert.deepEqual(
    problemesDeLaPose(etat, 'aerodrome', 11, 3).map((p) => p.code), ['trop-de-batiments'],
  );

  // `poser` LÈVE là où `problemesDeLaPose` rend une liste — appelée sans avoir
  // regardé, c'est un fait de programme.
  const avant = etat.disposition.length;
  assert.throws(() => poser(etat, 'aerodrome', 11, 3), /pose illégale/);
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
// Le Chantier plafonne, et les bâtiments de production ouvrent — 29/08
// ---------------------------------------------------------------------------

test('état — le Chantier plafonne le niveau de toute la base, sauf le sien', () => {
  // ARBITRÉ le 29/08 par Ethan : « le chantier de construction définit le
  // niveau max des bâtiments. Donc aucun bâtiment ne peut avoir un niveau
  // supérieur à celui du chantier. »
  const etat = creerEtat(4242);
  const champ = etat.champs.cases[0];
  poser(etat, 'collecteur', champ.rangee, champ.colonne);
  etat.economie.ressources = { quartz: 9e9, scorie: 9e9, electricite: 9e9 };

  // Montage falsifiable : sans le plafond, cette montée serait payable. On le
  // prouve en montant le Chantier d'abord, puis en revenant en arrière.
  assert.equal(niveauDuChantier(etat), 1);
  assert.deepEqual(
    problemesDeLAmelioration(etat, 1).map((p) => p.code), ['plafond-chantier'],
    'le collecteur devrait être plafonné par le Chantier',
  );
  assert.match(problemesDeLAmelioration(etat, 1)[0].message, /Chantier de construction/);
  assert.throws(() => ameliorer(etat, 1), /impossible/);
  assert.equal(etat.disposition[1].niveau, 1, 'un refus ne doit rien avoir monté');

  // ⚠ LE CHANTIER NE SE PLAFONNE PAS LUI-MÊME. Il EST la référence ; lui
  // appliquer la règle figerait la base à son niveau de départ pour toujours.
  assert.deepEqual(problemesDeLAmelioration(etat, 0), []);
  ameliorer(etat, 0);
  assert.equal(niveauDuChantier(etat), 2);

  // Et le plafond se lève AVEC lui, d'un cran exactement.
  assert.deepEqual(problemesDeLAmelioration(etat, 1), []);
  ameliorer(etat, 1);
  assert.equal(etat.disposition[1].niveau, 2);
  assert.deepEqual(
    problemesDeLAmelioration(etat, 1).map((p) => p.code), ['plafond-chantier'],
    'le collecteur devrait être bloqué à nouveau, au niveau du Chantier',
  );

  // Le plafond du JEU reste le premier à parler : à 50, c'est lui qui refuse,
  // pas le Chantier — sinon le message enverrait monter un bâtiment déjà au bout.
  const auBout = creerEtat(11);
  auBout.disposition[0].niveau = GEOGRAPHIE.niveauPlafond;
  assert.deepEqual(
    problemesDeLAmelioration(auBout, 0).map((p) => p.code), ['plafond'],
  );

  // `niveauDuChantier` LÈVE sans Chantier : c'est un fait de programme, pas de
  // jeu — `problemesDeDisposition` porte déjà `sans-chantier`, et ce code-là
  // n'est pas toléré au chargement.
  assert.throws(() => niveauDuChantier({ disposition: [] }), /aucun Chantier/);
});

test('état — une unité demande son bâtiment de production, et la règle n\'est pas au chargement', () => {
  // ARBITRÉ le 29/08 par Ethan : « Infanterie inconstructible sans caserne.
  // Même règle pour véhicule et avion. »
  const etat = creerEtat(4242);
  etat.disposition[0].niveau = 20;

  // Les trois familles réclament leur bâtiment, nommément.
  assert.equal(batimentDeProductionManquant(etat, 'meute'), 'caserne');
  assert.equal(batimentDeProductionManquant(etat, 'fendeur'), 'depotDeVehicules');
  assert.equal(batimentDeProductionManquant(etat, 'busard'), 'aerodrome');
  // Un ouvrage fixe n'en réclame aucun : un mur n'a jamais eu besoin d'une
  // caserne, et `null` le dit sans lever.
  assert.equal(batimentDeProductionManquant(etat, 'merlon'), null);

  // Poser la Caserne débloque EXACTEMENT l'infanterie.
  poser(etat, 'caserne', 11, 3);
  assert.equal(batimentDeProductionManquant(etat, 'meute'), null);
  assert.equal(batimentDeProductionManquant(etat, 'fendeur'), 'depotDeVehicules');

  // ⚠⚠ ET LA RÈGLE N'EST PAS DANS `verifierEtat`, EXACTEMENT COMME LE BUDGET.
  // Elle peut devenir fausse SOUS une armée déjà posée — la Caserne démolie, ou
  // tombée au raid — et refuser le chargement rendrait la partie injouable pour
  // une faute que le joueur n'a pas commise. C'est aussi ce qui évite une
  // migration : aucune sauvegarde n'a changé de forme.
  poserEffectif(etat, 'armee', { id: 'meute', vague: 1, colonne: 1, niveau: 1 });
  const index = etat.disposition.findIndex((b) => b.id === 'caserne');
  demolir(etat, index);
  assert.equal(batimentDeProductionManquant(etat, 'meute'), 'caserne',
    'le montage doit vraiment retirer la Caserne');
  const json = serialiser(etat, 1_700_000_000_000);
  const relu = charger(json, 1_700_000_000_000);
  assert.equal(relu.armee.length, 1,
    'une armée sans Caserne doit se recharger : elle se SIGNALE, elle ne bloque pas');
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
/**
 * Une base à deux bâtiments, avec de quoi payer.
 *
 * ⚠ LE CHANTIER Y EST MONTÉ, ET C'EST OBLIGATOIRE DEPUIS LE 29/08. Il plafonne
 * désormais le niveau de toute la base : sous un Chantier de niveau 1, aucun
 * autre bâtiment ne peut monter, et ces montages-ci mesurent justement des
 * montées. On l'écrit DANS le montage plutôt que de désarmer la règle — le
 * niveau 10 laisse de la marge à des tests qui montent jusqu'au troisième.
 */
const NIVEAU_CHANTIER_MONTAGE = 10;

function baseAvecCollecteur(quartzMilli = 100_000_000) {
  const etat = creerEtat(20260827);
  const premierChamp = etat.champs.cases[0];
  poser(etat, 'collecteur', premierChamp.rangee, premierChamp.colonne);
  etat.disposition[0].niveau = NIVEAU_CHANTIER_MONTAGE;
  etat.economie.ressources = {
    quartz: quartzMilli, scorie: quartzMilli, electricite: quartzMilli,
  };
  assert.equal(etat.disposition.length, 2);
  assert.equal(etat.economie.residus.length, 2);
  // Le montage doit laisser de la place à ce qu'il mesure : un Chantier trop
  // bas ferait tomber les montées sur `plafond-chantier` et non sur le prix.
  // ⚠ ON ASSERTE L'ABSENCE DE CE CODE-LÀ, PAS UNE LISTE VIDE : ce montage sert
  // aussi au test du stock à zéro, où le refus « manque:quartz » est justement
  // ce qu'on veut mesurer.
  assert.ok(
    !problemesDeLAmelioration(etat, 1).some((p) => p.code === 'plafond-chantier'),
    'montage : le Chantier plafonne la montée que ce test veut mesurer',
  );
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
  assert.equal(etat.disposition[0].niveau, NIVEAU_CHANTIER_MONTAGE);

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
  //
  // ⚠⚠ ET LA CHAÎNE A CHANGÉ D'ORDRE LE 29/08, PAS DE NATURE. Le Chantier
  // plafonne désormais le niveau de toute la base : la PREMIÈRE montée payable
  // d'une partie est forcément la sienne. C'était déjà le premier geste de
  // l'ouverture mesurée de CLAUDE.md §6 ; c'en est maintenant le seul possible,
  // et ce test le vérifie au lieu de le supposer.
  const etat = creerEtat(779);
  const champ = etat.champs.cases[0];
  poser(etat, 'collecteur', champ.rangee, champ.colonne);

  // Rien d'autre que le Chantier ne peut monter tant qu'il est au niveau 1.
  assert.deepEqual(
    problemesDeLAmelioration(etat, 1).map((p) => p.code), ['plafond-chantier'],
    'le collecteur devrait être plafonné par un Chantier de niveau 1',
  );

  // Et l'amorce paie SA montée à lui, qui est le vrai premier geste.
  assert.deepEqual(problemesDeLAmelioration(etat, 0), [],
    'l\'amorce ne paie même pas la première montée du Chantier');
  ameliorer(etat, 0);
  assert.equal(etat.disposition[0].niveau, 2);

  // Le plafond se lève avec lui : le collecteur devient montable, et payable.
  assert.deepEqual(problemesDeLAmelioration(etat, 1), [],
    'le collecteur reste bloqué alors que le Chantier est monté');
  ameliorer(etat, 1);
  assert.equal(etat.disposition[1].niveau, 2);

  // Et il reste de quoi faire autre chose : une amorce qui financerait
  // EXACTEMENT ces deux gestes laisserait le joueur bloqué juste après.
  assert.ok(etat.economie.ressources.quartz > 0, 'l\'amorce est épuisée par l\'ouverture');
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
  // ⚠ `obstacle` L'A REJOINT LE 29/08, et pour la même raison exactement : une
  // pièce de garnison peut se retrouver SOUS un obstacle sans que le joueur ait
  // rien fait, puisque le terrain se redéduit à chaque chargement et que le
  // tirage des obstacles bougera encore. Ce n'est pas une faute structurelle —
  // la pièce est bien formée, elle est juste mal placée — et elle reste
  // SIGNALÉE : toute nouvelle pose au même endroit est refusée.
  assert.deepEqual([...CODES_TOLERES_AU_CHARGEMENT], ['uniques-voisins', 'obstacle']);
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

test('déplacer — la règle est celle de la disposition, jamais une seconde', () => {
  // ⚠ MÊME DISCIPLINE QUE `poser` : on construit la disposition candidate et on
  // la soumet à `problemesDeDisposition`. Une seconde table de règles finirait
  // par diverger de la première, sur le voisinage ou sur les champs.
  const etat = creerEtat(4242);
  etat.disposition[0].niveau = 6;
  const champ = etat.champs.cases.find((c) => c.ressource === 'quartz');
  poser(etat, 'collecteur', champ.rangee, champ.colonne);
  // ⚠ UN TROISIÈME BÂTIMENT, ET IL EST INDISPENSABLE. Sans lui le collecteur est
  // le DERNIER de la liste, et un `splice` suivi d'un `push` le remettrait
  // exactement au même indice : le test passerait sur du code qui décale tous
  // les résidus. La falsification l'a montré.
  poser(etat, 'caserne', 18, 1);
  assert.equal(etat.disposition.length, 3);
  assert.notEqual(etat.disposition.length - 1, 1, 'le bâtiment déplacé doit avoir un successeur');
  const apres = etat.disposition[2].id;

  // Vers un autre champ : légal. Vers une case sans champ : refusé, et par la
  // MÊME règle que la pose — le message vient de `sim/disposition.js`.
  const autre = etat.champs.cases.find((c) => c.ressource === 'quartz' && c !== champ);
  assert.deepEqual(problemesDuDeplacement(etat, 1, autre.rangee, autre.colonne), []);
  const horsChamp = problemesDuDeplacement(etat, 1, 16, 4);
  assert.deepEqual(horsChamp.map((p) => p.code), ['hors-champ']);
  assert.equal(horsChamp[0].message, problemesDeLaPose(etat, 'collecteur', 16, 4)[0].message,
    'le refus du déplacement ne dit pas la même chose que celui de la pose');

  // ⚠ RESTER SUR PLACE EST LÉGAL. Le refuser obligerait l'écran à connaître
  // cette exception, et le joueur n'aurait aucun moyen d'annuler son geste.
  assert.deepEqual(problemesDuDeplacement(etat, 1, champ.rangee, champ.colonne), []);

  // Le geste lui-même.
  deplacer(etat, 1, autre.rangee, autre.colonne);
  assert.equal(etat.disposition[1].rangee, autre.rangee);
  assert.equal(etat.disposition[1].colonne, autre.colonne);
  assert.equal(etat.disposition[1].niveau, 1, 'un déplacement ne change pas le niveau');
  assert.equal(etat.disposition.length, 3, 'un déplacement n\'ajoute ni ne retire rien');
  // ⚠ ET L'ORDRE DE LA LISTE NE BOUGE PAS. C'est ce que la garde des résidus
  // protège : `economie.residus` est parallèle à `disposition`, et réécrire la
  // liste dans un autre ordre ferait produire à chaque bâtiment le reste de son
  // voisin.
  assert.equal(etat.disposition[1].id, 'collecteur', 'le bâtiment déplacé a changé d\'indice');
  assert.equal(etat.disposition[2].id, apres, 'l\'ordre de la disposition a changé');

  // ⚠ L'INDICE NE BOUGE PAS, DONC LE RÉSIDU SUIT TOUT SEUL. `economie.residus`
  // est parallèle à `disposition` : un déplacement écrit avec un `splice` puis
  // un `push` décalerait les résidus d'un cran et ferait produire à chaque
  // bâtiment le reste de son voisin. Le tick suivant doit passer.
  assert.equal(etat.economie.residus.length, etat.disposition.length);
  tickJeu(etat);
  assert.ok(etat.economie.ressources.quartz >= 0);

  // Et il LÈVE sur un déplacement illégal, comme `poser` : un fait de PROGRAMME.
  assert.throws(() => deplacer(etat, 1, 16, 4), /illégal/);
  assert.throws(() => problemesDuDeplacement(etat, 99, 13, 2), /hors de la disposition/);
});

test('déplacer — une base déjà bancale reste réarrangeable', () => {
  // ⚠ C'EST LE CAS QUI COMPTE LE PLUS. Depuis le 28/08 une base peut porter deux
  // uniques voisins — la règle est née après des sauvegardes qui la violent, et
  // elle est tolérée au chargement. Déplacer est précisément ce qui permet de
  // réparer ça. Faire remonter le défaut PRÉEXISTANT sur chaque déplacement
  // enfermerait le joueur dans la faute qu'on lui demande de corriger.
  const etat = creerEtat(4242);
  etat.disposition[0].niveau = 6;
  etat.disposition.push({ id: 'centreDeCommandement', rangee: 18, colonne: 4, niveau: 1 });
  etat.economie.residus.push({});

  // Le montage est bien en faute AVANT le geste, sinon il ne mesure rien.
  const defauts = problemesDeDisposition(etat.disposition, etat.champs);
  assert.ok(defauts.some((p) => p.code === 'uniques-voisins'), 'le montage devrait être illégal');

  // ⚠ ET C'EST UN AUTRE BÂTIMENT QU'ON DÉPLACE, PAS LE FAUTIF. La falsification
  // l'a exigé : éloigner le Centre de commandement REND la base saine, si bien
  // que la candidate est propre et que retirer le filtre ne se voit pas. Ce que
  // le filtre protège, c'est le déplacement d'un bâtiment INNOCENT pendant que
  // le défaut demeure — le cas ordinaire d'une base déjà bancale.
  const champ = etat.champs.cases.find((c) => c.ressource === 'quartz');
  poser(etat, 'collecteur', champ.rangee, champ.colonne);
  const ailleurs = etat.champs.cases.find((c) => c.ressource === 'quartz' && c !== champ);
  assert.ok(problemesDeDisposition(etat.disposition, etat.champs)
    .some((p) => p.code === 'uniques-voisins'), 'le défaut doit survivre à la pose');
  assert.deepEqual(problemesDuDeplacement(etat, 2, ailleurs.rangee, ailleurs.colonne), [],
    'un bâtiment innocent doit pouvoir bouger malgré un défaut préexistant');
  deplacer(etat, 2, ailleurs.rangee, ailleurs.colonne);
  assert.equal(etat.disposition[2].rangee, ailleurs.rangee);

  // Et éloigner le fautif RÉPARE bel et bien la base.
  deplacer(etat, 1, 18, 1);
  assert.deepEqual(problemesDeDisposition(etat.disposition, etat.champs), [],
    'le déplacement devait réparer la base');

  // ⚠ ET LA RÈGLE MORD TOUJOURS SUR CE QU'ON AJOUTE. Remettre le Centre de
  // commandement au contact du Chantier est un défaut NOUVEAU, pas préexistant :
  // il est refusé. C'est la moitié qui fait de « toléré » autre chose
  // qu'« effacé ».
  assert.ok(problemesDuDeplacement(etat, 1, 18, 4).some((p) => p.code === 'uniques-voisins'),
    'un déplacement qui CRÉE le défaut devrait être refusé');
  assert.throws(() => deplacer(etat, 1, 18, 4), /illégal/);

  // Falsifiable : le filtre des défauts préexistants est bien ce qui a permis le
  // premier déplacement. On repose le défaut à la main — le moteur, lui, refuse
  // de le créer — et on vérifie qu'on peut de nouveau s'en éloigner.
  etat.disposition[1].rangee = 18;
  etat.disposition[1].colonne = 4;
  assert.ok(problemesDeDisposition(etat.disposition, etat.champs).length > 0,
    'le montage devrait être redevenu illégal');
  assert.deepEqual(problemesDuDeplacement(etat, 1, 18, 1), [],
    'les défauts préexistants ne sont plus filtrés');
});

// ---------------------------------------------------------------------------
// La garnison et l'armée — lot GARNISON-ET-ARMÉE, 28/08
// ---------------------------------------------------------------------------
//
// CE QUE CES TESTS GARDENT :
//   — les deux champs existent dès la base neuve, VIDES, et une liste vide est
//     un état légal et non un trou ;
//   — un aller-retour de sauvegarde rend le placement, les niveaux ET les
//     dégâts, sans quoi une unité détruite ressusciterait intacte ;
//   — le budget n'entre PAS dans `verifierEtat` : une armée trop chère est un
//     fait de jeu, pas un fait de programme ;
//   — un déplacement ne réordonne pas la liste.

/** Une base qui porte les deux bâtiments de commandement, à des niveaux connus. */
function etatAvecCommandement(niveauOffense = 4, niveauDefense = 6) {
  const etat = creerEtat(20260828);
  // ⚠ LE CHANTIER DOIT OUVRIR ASSEZ D'EMPLACEMENTS. Au niveau 1 il en ouvre
  // DEUX et en prend un : poser les deux QG rendrait la base injouable, et le
  // montage échouerait au chargement pour une raison sans rapport avec ce
  // qu'il mesure. Au niveau 5 il en ouvre dix.
  etat.disposition[0].niveau = 5;
  // Les deux QG sont `unique: true` et ne se touchent pas — la règle
  // « uniques-voisins » du 28/08 les sépare du Chantier posé en (18, 5).
  // ⚠ `degatsMilli: 0` COMME `poser` LE POSE. Un montage écrit à la main doit
  // ressembler à ce que le moteur produit, sinon il mesure autre chose que le
  // jeu : sans ce champ, la migration v19 → v20 l'ajouterait ICI et la
  // sauvegarde migrée cesserait d'être comparable à celle d'origine — pour une
  // différence qui vient du test, pas du code.
  etat.disposition.push(
    {
      id: 'centreDeCommandement', rangee: 11, colonne: 1, niveau: niveauOffense, degatsMilli: 0,
    },
    {
      id: 'qgDeDefense', rangee: 11, colonne: 8, niveau: niveauDefense, degatsMilli: 0,
    },
  );
  for (let i = etat.economie.residus.length; i < etat.disposition.length; i += 1) {
    etat.economie.residus.push({ quartz: 0, scorie: 0, electricite: 0 });
  }
  return etat;
}

test('forces — une base neuve porte les deux champs, tous deux vides', () => {
  const etat = creerEtat(7);
  assert.deepEqual(etat.garnison, []);
  assert.deepEqual(etat.armee, []);
  // ⚠ VIDE N'EST PAS ABSENT. Les deux champs doivent EXISTER — c'est ce qui
  // distingue « rien de posé » de « quelque chose a écrit l'état de travers ».
  assert.ok(Object.prototype.hasOwnProperty.call(etat, 'garnison'));
  assert.ok(Object.prototype.hasOwnProperty.call(etat, 'armee'));
  // Et c'est cohérent : aucun des deux bâtiments de commandement n'est posé.
  assert.equal(niveauDeCommandement(etat, 'garnison'), null);
  assert.equal(niveauDeCommandement(etat, 'armee'), null);
});

test('forces — un aller-retour rend le placement, les niveaux ET les dégâts', () => {
  const etat = etatAvecCommandement();
  poserEffectif(etat, 'garnison', { id: 'merlon', rangee: 3, colonne: 1, niveau: 2 });
  poserEffectif(etat, 'garnison', { id: 'faucheuse', rangee: 7, colonne: 9, niveau: 5 });
  poserEffectif(etat, 'armee', { id: 'meute', vague: 1, colonne: 2, niveau: 3 });
  poserEffectif(etat, 'armee', { id: 'enclume', vague: 4, colonne: 9, niveau: 11 });

  // Des dégâts écrits à la main : le moteur de combat n'existe pas encore, mais
  // le champ doit traverser la sauvegarde.
  etat.armee[0].degatsMilli = 690_000;

  const relu = charger(serialiser(etat, T0), T0);
  assert.deepEqual(relu.garnison, etat.garnison);
  assert.deepEqual(relu.armee, etat.armee);

  // Falsifiable : le montage doit porter des valeurs DISTINCTES, sinon deux
  // listes de zéros seraient égales sans rien prouver.
  assert.equal(relu.armee[0].degatsMilli, 690_000);
  assert.equal(relu.armee[1].degatsMilli, 0);
  assert.notEqual(relu.garnison[0].niveau, relu.garnison[1].niveau);
  assert.equal(relu.armee[1].vague, 4);
  assert.equal(relu.garnison[1].rangee, 7);
});

test('forces — une pièce détruite reste dans la liste après un aller-retour', () => {
  // ARBITRÉ le 28/08 : « les unités sont détruites mais pas perdues ». Une
  // pièce à zéro PV n'est pas retirée de la grille — elle y est, en attente de
  // réparation. Si l'aller-retour la faisait disparaître, le joueur perdrait
  // son armée à chaque fermeture du jeu au lieu de la réparer.
  const etat = etatAvecCommandement();
  poserEffectif(etat, 'armee', { id: 'meute', vague: 2, colonne: 5, niveau: 1 });
  poserEffectif(etat, 'armee', { id: 'broyeur', vague: 2, colonne: 6, niveau: 1 });
  // Détruite : tous ses PV en dégâts. La table dit 700 PV au niveau 1 pour la
  // Meute — on ne recopie pas le nombre, on le lit.
  const pvMilli = 700 * 1000;
  etat.armee[0].degatsMilli = pvMilli;

  const relu = charger(serialiser(etat, T0), T0);
  assert.equal(relu.armee.length, 2, 'une pièce détruite ne quitte pas la liste');
  assert.equal(relu.armee[0].id, 'meute');
  assert.equal(relu.armee[0].degatsMilli, pvMilli);
  // ⚠ AUCUN PLAFOND N'EST APPLIQUÉ À L'ÉCRITURE. Des dégâts supérieurs aux PV
  // de la table se chargent sans broncher : les borner ici ferait refuser une
  // sauvegarde le jour où un PV baisse. Ils se bornent à la lecture.
  etat.armee[0].degatsMilli = pvMilli * 10;
  assert.equal(charger(serialiser(etat, T0), T0).armee[0].degatsMilli, pvMilli * 10);
});

test('forces — une sauvegarde v6 se migre en v7 sans rien perdre', () => {
  const etat = etatAvecCommandement();
  poser(etat, 'raffinerie', 18, 7);
  const v7 = JSON.parse(serialiser(etat, T0));

  // On redescend la sauvegarde en v6, c'est-à-dire telle qu'elle était AVANT ce
  // lot : pas de garnison, pas d'armée.
  const v6 = { ...v7, version: 6 };
  delete v6.garnison;
  delete v6.armee;
  // ⚠ ET `satellites` AUSSI, DEPUIS LE 29/08. Une v6 ne le portait pas non plus,
  // et le laisser ferait migrer une sauvegarde qui n'a jamais existé.
  delete v6.satellites;

  const migre = migrer(structuredClone(v6));
  assert.equal(migre.version, 21, 'la chaîne doit aller jusqu\'au bout, pas s\'arrêter à 7');
  assert.equal(migre.attaque.plafond, 100, 'le maillon v9 → v10 manque');
  assert.deepEqual(migre.sitesEntames, {}, 'le maillon v10 → v11 manque');
  assert.equal(migre.recherche.pointsMilli, '0', 'le maillon v11 → v12 manque');
  // ⚠⚠ LE MAILLON v12 → v13 EST DEVENU INOBSERVABLE EN BOUT DE CHAÎNE, et ce
  // n'est pas un assouplissement : c'est un fait. Il posait `reparation: null` ;
  // le maillon v16 → v17 SUPPRIME ce champ. Qu'il ait tourné ou non, la
  // sauvegarde finit sans `reparation` — aucune assertion ne peut donc plus les
  // distinguer, et en garder une qui ne distingue rien ferait croire qu'elle
  // garde quelque chose. On mesure à la place ce que le DERNIER maillon laisse,
  // qui est ce que la chaîne doit produire aujourd'hui.
  assert.ok(!('reparation' in migre), 'le maillon v16 → v17 n\'a pas retiré le chronomètre');
  assert.deepEqual(migre.reserveReparation, { escouade: 0, blinde: 0, aeronef: 0 },
    'le maillon v16 → v17 manque, ou il a crédité une réserve rétroactive');
  // ⚠⚠ LE MAILLON v13 → v14 OFFRE, LÀ OÙ TOUTES LES AUTRES NE CONVERTISSENT
  // RIEN — et ce qu'il offre est EXACTEMENT ce que l'ancienne règle autorisait.
  // Ce montage porte un Centre de commandement au niveau 4 et un QG de défense
  // au niveau 6 : l'attendu se RECALCULE sur `apparition`, il ne se recopie pas.
  // Le poser en dur ferait un test qui suit le patch au lieu de le mesurer.
  //
  // ⚠ L'UNION AVEC LES GRATUITES EST DANS L'ATTENDU, et elle compte : au
  // niveau 4, l'ancienne règle n'ouvrait que la Meute et les Perceurs, alors
  // qu'une partie NEUVE reçoit aussi l'Éclaireur et l'Épervier. Sans elle, un
  // joueur qui recharge aurait moins qu'un joueur qui recommence.
  const ancienneRegle = (branche, niveau) => [...new Set([
    ...Object.keys(ARBRE_RECHERCHE[branche])
      .filter((id) => (DEFENSES[id] ?? UNITES[id]).apparition <= niveau),
    ...gratuitesDe(branche),
  ])].sort();
  assert.deepEqual(migre.recherche.acquises,
    { offense: ancienneRegle('offense', 4), defense: ancienneRegle('defense', 6) },
    'le maillon v13 → v14 manque, ou il n\'offre pas ce que l\'ancienne règle donnait');
  // ⚠ ET IL DONNE AU MOINS UNE PIÈCE PAYANTE, sinon l'assertion ci-dessus
  // passerait pour une migration qui poserait bêtement les gratuites.
  for (const branche of ['offense', 'defense']) {
    assert.ok(
      migre.recherche.acquises[branche].some((id) => ARBRE_RECHERCHE[branche][id].unite > 0),
      `montage sans mordant : la branche ${branche} n'a reçu que des gratuites`,
    );
  }
  assert.deepEqual(migre.recherche.modules, { offense: [], defense: [] },
    'la migration a offert des modules jamais achetés');
  assert.deepEqual(migre.tutoriel, { ferme: false }, 'le maillon v8 → v9 manque');
  assert.deepEqual(migre.garnison, []);
  assert.deepEqual(migre.armee, []);
  assert.deepEqual(migre.satellites.presents, []);
  assert.equal(migre.satellites.attentes.length, 3);
  // Et RIEN d'autre n'a bougé : la migration ajoute, elle ne refonde pas.
  //
  // ⚠ CETTE ASSERTION N'OBSERVE PAS LE MAILLON v19 → v20, et c'est un FAIT plus
  // qu'un assouplissement : la v7 est sérialisée depuis un état RÉEL, dont les
  // bâtiments portent déjà `degatsMilli: 0`. Ce qu'elle tient toujours, c'est
  // que la chaîne entière n'a touché à AUCUN d'eux. Le maillon lui-même se
  // mesure sur une v19 forgée SANS le champ — RAID-B T12.
  assert.deepEqual(migre.disposition, v7.disposition);
  assert.deepEqual(migre.economie, v7.economie);
  assert.deepEqual(migre.fondation, v7.fondation);
  assert.deepEqual(migre.horloge, v7.horloge);
  // ⚠ ET LES ÉCHÉANCES SE COMPTENT DEPUIS L'HORLOGE DE LA SAUVEGARDE, pas depuis
  // zéro. Une partie vieille de deux heures verrait sinon ses trois satellites
  // paraître à l'instant même du chargement.
  for (const a of migre.satellites.attentes) {
    assert.equal(a.tickDu, v7.horloge.nbTicks + TICKS_APPARITION);
  }

  // Falsifiable : la disposition doit être NON TRIVIALE, sinon comparer deux
  // listes vides ne prouverait rien.
  assert.ok(v7.disposition.length >= 4, 'le montage ne porte pas assez de bâtiments');

  // Et le chemin complet passe : une v6 se charge et se joue.
  const charge = charger(JSON.stringify(v6), T0);
  assert.deepEqual(charge.armee, []);
  assert.equal(charge.disposition.length, v7.disposition.length);
});

test('forces — le chargement exige les deux champs, et accepte qu\'ils soient vides', () => {
  const etat = etatAvecCommandement();

  // ⚠ « CHAMP ABSENT » ET « LISTE VIDE » NE SONT PAS LA MÊME CHOSE. Une v7
  // amputée est un fait de PROGRAMME et doit lever, en NOMMANT le champ.
  for (const champ of ['garnison', 'armee']) {
    const ampute = JSON.parse(serialiser(etat, T0));
    delete ampute[champ];
    assert.throws(
      () => charger(JSON.stringify(ampute), T0),
      new RegExp(`champ « ${champ} » absent`),
      `une sauvegarde v7 sans « ${champ} » doit être refusée, et le dire`,
    );
  }
  // Vides, en revanche : c'est l'état de toute base neuve.
  assert.doesNotThrow(() => charger(serialiser(etat, T0), T0));

  // Et une liste qui n'en est pas une lève aussi.
  const tordu = JSON.parse(serialiser(etat, T0));
  tordu.armee = { meute: 1 };
  assert.throws(() => charger(JSON.stringify(tordu), T0), /n'est pas une liste/);
});

test('forces — le chargement refuse une pièce malformée, et dit laquelle', () => {
  const etat = etatAvecCommandement();
  poserEffectif(etat, 'garnison', { id: 'merlon', rangee: 3, colonne: 1, niveau: 2 });

  const cas = [
    [{ id: 'pilon', rangee: 4, colonne: 1, niveau: 1, degatsMilli: 0 }, /n'a pas sa place/],
    [{ id: 'merlon', rangee: 11, colonne: 1, niveau: 1, degatsMilli: 0 }, /rangée 11 hors de/],
    [{ id: 'merlon', rangee: 4, colonne: 99, niveau: 1, degatsMilli: 0 }, /colonne 99 hors de/],
    [{ id: 'merlon', rangee: 4, colonne: 2, niveau: 0, degatsMilli: 0 }, /niveau 0 hors de/],
    [{ id: 'merlon', rangee: 4, colonne: 2, niveau: 1, degatsMilli: -1 }, /dégâts/],
    [{ id: 'merlon', rangee: 3, colonne: 1, niveau: 1, degatsMilli: 0 }, /déjà occupée/],
  ];
  for (const [piece, motif] of cas) {
    const tordu = JSON.parse(serialiser(etat, T0));
    tordu.garnison.push(piece);
    assert.throws(() => charger(JSON.stringify(tordu), T0), motif, JSON.stringify(piece));
  }
  // Falsifiable : la même sauvegarde SANS la pièce fautive passe.
  assert.doesNotThrow(() => charger(serialiser(etat, T0), T0));
});

test('forces — une composition hors budget se charge quand même', () => {
  // ⚠⚠ C'EST VOLONTAIRE, ET C'EST LA MOITIÉ DE L'ARBITRAGE. Le budget BAISSE
  // quand le QG est démoli ou tombe au raid, sous une armée déjà posée. Refuser
  // le chargement rendrait la partie injouable pour une faute que le joueur n'a
  // pas commise — la même erreur qu'aurait été de faire lever `uniques-voisins`.
  // On SIGNALE et on propose de purger ; jamais d'amputation automatique.
  const etat = etatAvecCommandement(1, 1);
  const budget = budgetOffense(1);
  let engages = 0;
  let colonne = 1;
  while (engages <= budget && colonne <= 9) {
    poserEffectif(etat, 'armee', { id: 'enclume', vague: 1, colonne, niveau: 1 });
    engages += 15; // points de l'Enclume — le montage vise le DÉPASSEMENT
    colonne += 1;
  }
  // Falsifiable : le montage doit vraiment dépasser, sinon il ne mesure rien.
  assert.ok(engages > budget, `${engages} points contre un budget de ${budget}`);

  // Le QG disparaît : plus aucun budget du tout, et l'armée reste là.
  etat.disposition = etat.disposition.filter((b) => b.id !== 'centreDeCommandement');
  etat.economie.residus.pop();
  assert.equal(niveauDeCommandement(etat, 'armee'), null);

  const relu = charger(serialiser(etat, T0), T0);
  assert.equal(relu.armee.length, etat.armee.length, 'rien ne se retire en silence');
});

test('forces — poser ne coûte rien, et le roster est gardé des deux côtés', () => {
  const etat = etatAvecCommandement();
  const avant = { ...etat.economie.ressources };
  poserEffectif(etat, 'garnison', { id: 'casemate', rangee: 5, colonne: 5, niveau: 1 });
  poserEffectif(etat, 'armee', { id: 'pilon', vague: 3, colonne: 3, niveau: 1 });
  assert.deepEqual(etat.economie.ressources, avant, 'poser un effectif ne débite rien');

  // Le Pilon n'a pas de rôle défensif — il a sa place en assaut, pas en garnison.
  assert.ok(problemesDeLaPoseDEffectif(etat, 'garnison', { id: 'pilon', rangee: 4, colonne: 4, niveau: 1 })
    .some((p) => p.code === 'inconnu'));
  // Et un ouvrage n'a pas sa place dans une vague d'assaut.
  assert.ok(problemesDeLaPoseDEffectif(etat, 'armee', { id: 'merlon', vague: 1, colonne: 1, niveau: 1 })
    .some((p) => p.code === 'inconnu'));
  assert.throws(() => poserEffectif(etat, 'armee', { id: 'merlon', vague: 1, colonne: 1, niveau: 1 }),
    /pose illégale/);
  // Une force inconnue lève aussi — l'appelant s'est trompé de mot.
  assert.throws(() => poserEffectif(etat, 'infanterie', { id: 'meute', vague: 1, colonne: 1, niveau: 1 }),
    /n'est pas une force/);
});

test('forces — déplacer ne réordonne pas la liste', () => {
  // ⚠ TROIS PIÈCES, PAS DEUX. Le lot POSE-ET-DÉPLACEMENT est tombé dans le
  // piège : avec deux éléments, le déplacé est le dernier et un `splice` suivi
  // d'un `push` le remet au même indice — le test passerait sur du code cassé.
  // On déplace donc celle du MILIEU.
  const etat = etatAvecCommandement();
  poserEffectif(etat, 'garnison', { id: 'merlon', rangee: 3, colonne: 1, niveau: 1 });
  poserEffectif(etat, 'garnison', { id: 'casemate', rangee: 4, colonne: 2, niveau: 7 });
  poserEffectif(etat, 'garnison', { id: 'harpon', rangee: 5, colonne: 3, niveau: 3 });
  etat.garnison[1].degatsMilli = 12_345;

  deplacerEffectif(etat, 'garnison', 1, { rangee: 9, colonne: 8 });

  assert.deepEqual(etat.garnison.map((p) => p.id), ['merlon', 'casemate', 'harpon'],
    'la liste a été réordonnée : les indices que l\'écran garde en main ne valent plus rien');
  assert.equal(etat.garnison[1].rangee, 9);
  assert.equal(etat.garnison[1].colonne, 8);
  // Ce qui appartient à la pièce l'a suivie.
  assert.equal(etat.garnison[1].niveau, 7);
  assert.equal(etat.garnison[1].degatsMilli, 12_345);
  // Les voisines n'ont pas bougé d'un pixel.
  assert.deepEqual(etat.garnison[0], { id: 'merlon', rangee: 3, colonne: 1, niveau: 1, degatsMilli: 0 });
  assert.deepEqual(etat.garnison[2], { id: 'harpon', rangee: 5, colonne: 3, niveau: 3, degatsMilli: 0 });
});

test('forces — rester sur place est légal, se superposer ne l\'est pas', () => {
  const etat = etatAvecCommandement();
  poserEffectif(etat, 'armee', { id: 'meute', vague: 1, colonne: 1, niveau: 1 });
  poserEffectif(etat, 'armee', { id: 'busard', vague: 2, colonne: 4, niveau: 1 });

  // Sur place : liste vide. Le refuser priverait le joueur de toute annulation.
  assert.deepEqual(problemesDuDeplacementDEffectif(etat, 'armee', 1, { vague: 2, colonne: 4 }), []);
  assert.doesNotThrow(() => deplacerEffectif(etat, 'armee', 1, { vague: 2, colonne: 4 }));

  // Sur la voisine : refusé.
  assert.ok(problemesDuDeplacementDEffectif(etat, 'armee', 1, { vague: 1, colonne: 1 })
    .some((p) => p.code === 'superposition'));
  assert.throws(() => deplacerEffectif(etat, 'armee', 1, { vague: 1, colonne: 1 }), /illégal/);
  assert.throws(() => deplacerEffectif(etat, 'armee', 9, { vague: 1, colonne: 2 }), RangeError);
});

test('forces — retirer rend la pièce et ne touche pas aux ressources', () => {
  const etat = etatAvecCommandement();
  poserEffectif(etat, 'garnison', { id: 'merlon', rangee: 3, colonne: 1, niveau: 4 });
  poserEffectif(etat, 'garnison', { id: 'ronce', rangee: 3, colonne: 2, niveau: 1 });
  const avant = { ...etat.economie.ressources };

  const rendue = retirerEffectif(etat, 'garnison', 0);
  assert.equal(rendue.id, 'merlon');
  assert.equal(rendue.niveau, 4);
  assert.equal(etat.garnison.length, 1);
  assert.equal(etat.garnison[0].id, 'ronce');
  // ⚠ AUCUN REMBOURSEMENT — non arbitré. En inventer un serait trancher seul.
  assert.deepEqual(etat.economie.ressources, avant);
  assert.throws(() => retirerEffectif(etat, 'garnison', 5), RangeError);
});

// ---------------------------------------------------------------------------
// Le budget, à la couture entre l'état et les deux éditeurs
// ---------------------------------------------------------------------------

test('forces — le budget suit le niveau du bâtiment posé, et retombe s\'il est démoli', () => {
  const etat = etatAvecCommandement(4, 6);
  // ⚠ UNE SEULE LECTURE DE CETTE GRANDEUR. `POINTS_ARMEE` nomme déjà le
  // bâtiment de chaque côté ; `niveauDeCommandement` est le seul à le chercher.
  assert.equal(POINTS_ARMEE.offense.batiment, 'centreDeCommandement');
  assert.equal(POINTS_ARMEE.defense.batiment, 'qgDeDefense');
  assert.equal(niveauDeCommandement(etat, 'armee'), 4);
  assert.equal(niveauDeCommandement(etat, 'garnison'), 6);

  // Le budget en découle, par la formule des éditeurs — pas par une seconde.
  assert.equal(budgetOffense(4), POINTS_ARMEE.offense.base + POINTS_ARMEE.offense.parNiveau * 4);
  assert.equal(budgetDefense(6), POINTS_ARMEE.defense.base + POINTS_ARMEE.defense.parNiveau * 6);

  // Il MONTE avec le bâtiment.
  const indice = etat.disposition.findIndex((b) => b.id === 'centreDeCommandement');
  etat.disposition[indice].niveau = 9;
  assert.equal(niveauDeCommandement(etat, 'armee'), 9);
  assert.ok(budgetOffense(9) > budgetOffense(4), 'le budget devrait suivre le niveau');

  // Et il RETOMBE quand le bâtiment part. `null`, pas zéro : il n'y a pas de
  // budget nul, il n'y a pas de budget du tout.
  etat.disposition.splice(indice, 1);
  etat.economie.residus.pop();
  assert.equal(niveauDeCommandement(etat, 'armee'), null);
  assert.equal(niveauDeCommandement(etat, 'garnison'), 6, 'l\'autre force n\'est pas concernée');
});

test('forces — poser au-delà du budget est refusé ENTIER, pas écrêté', () => {
  // La règle vit dans l'éditeur, qui fait foi ; ce test garde la couture.
  const niveau = 1;
  const budget = budgetOffense(niveau);
  let grille = arsenalVide(niveau);

  // On remplit jusqu'à ce que la pose suivante dépasse.
  let posees = 0;
  for (let colonne = 1; colonne <= 9; colonne += 1) {
    try {
      grille = poserUnite(grille, { vague: 1, colonne, id: 'meute' });
      posees += 1;
    } catch { break; }
  }
  assert.ok(posees > 0, 'le montage n\'a rien posé : il ne mesure rien');
  assert.ok(posees < 9, `${posees} poses : le budget de ${budget} n'a jamais mordu`);

  // La pose refusée n'a RIEN posé — pas « ce qui rentre ».
  const avant = JSON.stringify(grille);
  assert.throws(() => poserUnite(grille, { vague: 1, colonne: posees + 1, id: 'meute' }),
    /budget/);
  assert.equal(JSON.stringify(grille), avant, 'la grille a bougé alors que la pose était refusée');
});

test('forces — la table des forces dit tout ce qui les distingue', () => {
  // ⚠ TABLE, PAS CONDITION. Le reste du code LIT `FORCES` au lieu de
  // reconnaître « garnison » par son nom : un cas particulier écrit à la main
  // serait le premier à diverger.
  assert.deepEqual(Object.keys(FORCES).sort(), ['armee', 'garnison']);
  assert.equal(FORCES.garnison.axe, 'rangee');
  assert.equal(FORCES.armee.axe, 'vague');
  assert.equal(FORCES.garnison.role, 'defense');
  assert.equal(FORCES.armee.role, 'offense');
  // Les deux rosters sont non vides et disjoints en nature : la garnison porte
  // des ouvrages que l'assaut ne connaît pas, et réciproquement.
  assert.ok(FORCES.garnison.roster.has('merlon'));
  assert.ok(!FORCES.armee.roster.has('merlon'));
  assert.ok(FORCES.armee.roster.has('pilon'));
  assert.ok(!FORCES.garnison.roster.has('pilon'));
  // 36 emplacements d'assaut, 72 de garnison — les deux géométries du brief.
  assert.equal((FORCES.armee.axeMax - FORCES.armee.axeMin + 1) * FORCES.armee.colonneMax, 36);
  assert.equal((FORCES.garnison.axeMax - FORCES.garnison.axeMin + 1) * FORCES.garnison.colonneMax, 72);
});

// ---------------------------------------------------------------------------
// Obstacles — du terrain, pas de la sauvegarde
// ---------------------------------------------------------------------------

test('obstacles — ils sont dérivés, omis de la sauvegarde, et redéduits au chargement', () => {
  const etat = creerEtat(4242);
  assert.equal(etat.obstacles.cases.length, OBSTACLES.nombre);

  const json = serialiser(etat, T0);
  assert.ok(!json.includes('"obstacles"'), 'les obstacles sont partis dans la sauvegarde');
  // Falsifiable : la même sauvegarde doit bien contenir ce qui les PRODUIT.
  assert.ok(json.includes('"fondation"'), 'la fondation doit y être : c\'est la source');

  const relu = charger(json, T0);
  assert.deepEqual(relu.obstacles, etat.obstacles, 'les obstacles redéduits diffèrent');

  // ⚠ ILS SUIVENT LA FONDATION, comme les champs. Une base qui se déplace
  // emporte son terrain — arbitré le 27/08 pour les champs, le 29/08 pour les
  // obstacles (« la base garde sa disposition »).
  const avant = JSON.stringify(etat.obstacles.cases);
  etat.position = { rangee: etat.fondation.rangee - 12, colonne: etat.fondation.colonne };
  const apres = charger(serialiser(etat, T0), T0);
  assert.equal(JSON.stringify(apres.obstacles.cases), avant, 'les obstacles ont suivi la position');
  // Contrôle négatif : la destination a bien d'AUTRES obstacles.
  assert.notEqual(
    JSON.stringify(obstaclesDeLaBase(etat.position.rangee, etat.position.colonne).cases), avant,
    'la destination porte les mêmes obstacles : le montage ne mesure rien',
  );
});

test('obstacles — une pièce de garnison ne se pose pas dessus, une unité d\'assaut s\'en moque', () => {
  const etat = creerEtat(4242);
  const o = etat.obstacles.cases[0];

  const refus = problemesDeLaPoseDEffectif(
    etat, 'garnison', { id: 'merlon', rangee: o.rangee, colonne: o.colonne, niveau: 1 },
  );
  assert.deepEqual(refus.map((p) => p.code), ['obstacle']);
  // ⚠ LE MESSAGE COMPTE : l'écran le reprend mot pour mot. « Déjà occupée »
  // enverrait le joueur chercher une pièce à retirer.
  assert.equal(refus[0].message, 'cette case porte un obstacle');
  assert.throws(
    () => poserEffectif(etat, 'garnison', { id: 'merlon', rangee: o.rangee, colonne: o.colonne, niveau: 1 }),
    /obstacle/,
  );

  // La case d'à côté, elle, accepte — sinon on aurait mesuré un refus général.
  const libre = { rangee: o.rangee, colonne: o.colonne };
  for (let c = 1; c <= GRILLE.largeur; c += 1) {
    const prise = etat.obstacles.cases.some((x) => x.rangee === o.rangee && x.colonne === c);
    if (!prise) { libre.colonne = c; break; }
  }
  assert.deepEqual(
    problemesDeLaPoseDEffectif(etat, 'garnison', { id: 'merlon', ...libre, niveau: 1 }), [],
  );

  // ⚠ ET L'ARMÉE N'EST PAS CONCERNÉE. Ses vagues ne sont pas des rangées de la
  // grille : la règle se lit dans `FORCES[x].surLeTerrain`, pas sur le nom de la
  // force. Une vague qui porte le même numéro qu'une rangée obstruée doit
  // rester posable.
  assert.equal(FORCES.armee.surLeTerrain, false);
  assert.equal(FORCES.garnison.surLeTerrain, true);
  const surLaMemeVague = etat.obstacles.cases.filter((x) => x.rangee <= FORCES.armee.axeMax);
  assert.ok(surLaMemeVague.length > 0, 'aucun obstacle sur un numéro de vague : rien à mesurer');
  for (const x of surLaMemeVague) {
    assert.deepEqual(
      problemesDeLaPoseDEffectif(
        etat, 'armee', { id: 'meute', vague: x.rangee, colonne: x.colonne, niveau: 1 },
      ),
      [],
      `l'armée refuse la vague ${x.rangee} : elle a lu une règle de terrain`,
    );
  }
});

test('obstacles — une pièce déjà sous un obstacle ne rend pas la partie illisible', () => {
  // ⚠ CE CAS NE PEUT PLUS SE CRÉER PAR LE JEU, et c'est pour ça qu'il faut le
  // fabriquer à la main. Il apparaîtra tout seul le jour où le tirage des
  // obstacles changera : le terrain se redéduit à chaque chargement, donc un
  // obstacle peut se poser sous une pièce posée légalement la veille.
  const etat = creerEtat(4242);
  const o = etat.obstacles.cases[0];
  etat.garnison.push({
    id: 'merlon', rangee: o.rangee, colonne: o.colonne, niveau: 1, degatsMilli: 0,
  });

  const relu = charger(serialiser(etat, T0), T0);
  assert.equal(relu.garnison.length, 1, 'la pièce ne doit pas être retirée en silence');

  // Toléré ne veut pas dire effacé : le défaut reste visible, et toute NOUVELLE
  // pose au même endroit reste refusée.
  const refus = problemesDeLaPoseDEffectif(
    relu, 'garnison', { id: 'ronce', rangee: o.rangee, colonne: o.colonne, niveau: 1 },
  );
  assert.ok(refus.some((p) => p.code === 'obstacle'), 'la règle doit rester active après chargement');

  // Falsifiable : une faute STRUCTURELLE, elle, fait toujours lever.
  const casse = creerEtat(4242);
  casse.garnison.push({ id: 'merlon', rangee: 99, colonne: 5, niveau: 1, degatsMilli: 0 });
  assert.throws(() => charger(serialiser(casse, T0), T0), /injouable/);
});
