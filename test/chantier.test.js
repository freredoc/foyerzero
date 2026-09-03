// L'écran Chantier — tout ce qui peut se vérifier SANS écran.
//
// ⚠ CE QUI TOUCHE AU DOM N'EST PAS TESTÉ ICI, ET NE PEUT PAS L'ÊTRE. Le dépôt
// n'a ni jsdom ni navigateur, et ce n'est pas un oubli (`CLAUDE.md` §3) :
// `esbuild` est sa seule dépendance de développement. Ce qui s'automatise, ce
// sont les fonctions PURES de `ui/chantier.js` — le formatage et la lecture de
// l'état — et la présence du balisage dans le HTML produit. Le reste se vérifie
// à la main sur appareil, et un test appareil non exécuté se déclare NON
// EXÉCUTÉ, jamais passé.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  ACTIONS, messagePasDeReparation, DUREE_TOAST_MS,
  SIGLES_DEFENSE, posablesDeLaDefense, detailDeLaDefense, nomDeLaPieceDeDefense,
  TERRAINS, casesPosablesDuTerrain, casesDeplacablesDuTerrain, actionSansMoteur,
  SIGLES_OBSTACLE, LIBELLES_OBSTACLE, fondsDuSol, LIBELLES_FAMILLE, coteCaseParDefaut,
  COTE_CASE_MAX, ZOOM_BASE_MULTIPLE_MAX, basculeDeBande, bornesDeDefilement,
  tuilesDuContour, BANDE_DU_CONTOUR, BANDE_DE_FIN_DU_CONTOUR, VARIABLE_DU_MUR,
  LONGUEUR_DU_MUR, NB_VARIANTES_DU_MUR,
} from '../src/ui/chantier.js';
import { rosterDefensif } from '../src/data/couts-militaires.js';
import { ZOOM_CARTE } from '../src/data/sites.js';
import { COTE_SPRITE } from '../src/data/atlas.js';
import {
  ligneAAfficher, MESSAGES_MODE, messageDePose, MENTION_SATURE,
  apercuDuBatiment, lignesDuPanneau, formaterCout, libelleDuVoisin,
  delaiAvantAmelioration,
  formaterDelai,
  noteDuRefus,
  compteurDeContexte,
  CONTEXTES,
  navigationEntreBases,
  BOUTONS_DU_BAS,
  flechesDeVoisinage,
  GLYPHES_DE_FLECHE, traitDeVoisinage, TRAIT_VOISINAGE,
  messageDeConfirmation,
  messageDeDestination,
  casesDeplacables,
  casesDeSolParAtlas,
} from '../src/ui/chantier.js';
import {
  SEPARATEUR_MILLIERS, SIGLES, BANDES, BANDES_NAVIGABLES, LIBELLES_RESSOURCE, NIVEAU_ABSENT,
  formaterEntier, formaterUnites, formaterDixiemes, formaterDebit, formaterNiveau,
  familleDuBatiment, bandeDeLaRangee, resumeDeLaBase, detailDuBatiment, posablesDeLaBase,
  casesPosables, messageDeRefus,
} from '../src/ui/chantier.js';
import { creerChronometre,
  CLE_SAUVEGARDE, CLE_SECOURS, SEUIL_RATTRAPAGE_TICKS, PERIODE_SAUVEGARDE_MS,
  DUREE_APPUI_DEBUG_MS, avancer,
} from '../src/ui/session.js';
import {
  BASE_BATIMENTS, CHAMPS, COUT_NIVEAU_DEUX, coutDeMontee, emplacementsDuNiveau,
  remboursementDuNiveau, stockagePropreDuNiveau,
  capaciteDuNiveau,
  ORDRE_PALETTE,
} from '../src/data/base.js';
import { GEOGRAPHIE } from '../src/data/sites.js';
import { ECONOMIE_NIVEAU } from '../src/data/economie.js';
import { GRILLE, OBSTACLES } from '../src/data/combat.js';
import { satellitesVides } from '../src/sim/satellites.js';
import { creerPointsAttaque } from '../src/sim/points-attaque.js';
import { reservesVides } from '../src/sim/reparation.js';
import { champsDeLaBase } from '../src/sim/champs.js';
import { ligneEcranDeLaRangee, ligneEcranDeLaBande } from '../src/render/orientation.js';
import { positionDepartJoueur } from '../src/sim/carte.js';
import { problemesDeDisposition, debitDuBatiment } from '../src/sim/disposition.js';
import { creerEtatEconomie, capacitesMilli, debitsMilliParHeure, RESSOURCES } from '../src/sim/economie-base.js';
import { UNITES, DEFENSES } from '../src/data/combat.js';
import { budgetDuNiveau as budgetOffense } from '../src/ui/arsenal.js';
import { budgetDuNiveau as budgetDefense } from '../src/ui/defense.js';
import { niveauDesBatiments } from '../src/sim/niveau-de-base.js';
import {
  creerEtat, tickJeu, poser, problemesDeLaPose, poserEffectif, basculerVersLaBase,
} from '../src/sim/state.js';
import { fonderUneBase } from '../src/sim/fondation.js';
import * as moteurEtat from '../src/sim/state.js';
import { TICKS_PAR_HEURE } from '../src/sim/clock.js';
import { baseCourante } from '../src/sim/base-courante.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

// ⚠⚠ LA POSITION DE DÉPART SE DEMANDE, ELLE NE S'ÉCRIT PLUS. Ces montages
// portaient `champsDeLaBase(275, 16)` en dur : le 31/08, Ethan a rapproché le
// départ du bord bas (rangée 295), et les trois tests sont tombés d'un coup —
// non parce qu'ils mesuraient une position, mais parce qu'ils avaient besoin du
// terrain de DÉPART, celui de `TERRAIN_INITIAL`, qui n'est servi que là. En le
// dérivant, ils suivent le prochain déplacement sans qu'on y pense.
const DEPART = positionDepartJoueur();

/**
 * La base de la maquette : onze bâtiments sur le terrain de la case de départ.
 *
 * ⚠ CE MONTAGE EST CELUI DE `foyer-zero-ui.html`, ET C'EST VOULU. Ses chiffres
 * ont été relevés indépendamment le 27/08 et `tools/audit-maquette.mjs` les
 * confronte aux tables. Les retrouver ici par un autre chemin — l'écran, et non
 * la maquette — est ce qui prouve que l'écran lit le moteur au lieu de graver
 * ce qu'il affiche.
 *
 * Une base NEUVE ne servirait à rien pour ça : un seul Chantier, zéro débit,
 * zéro capacité. Toutes les égalités passeraient sur du code cassé.
 */
// Le terrain de la maquette, TRANSCRIT et non plus dérivé.
//
// ⚠ IL ÉTAIT RENDU PAR `champsDeLaBase(275, 16)` JUSQU'AU 29/08, et c'est ce
// qui l'a fait tomber : la position de départ est désormais servie par
// `TERRAIN_INITIAL`, le dessin arbitré par Ethan, qui ne porte pas de champ sous
// les cinq collecteurs de la maquette. Les chiffres relevés le 27/08 ont été
// mesurés sur CE terrain-ci ; les recalculer sur un autre ne vérifierait plus la
// maquette, ça vérifierait le nouveau tirage.
//
// ⚠ ET C'EST PLUS JUSTE AINSI. Une maquette est un RELEVÉ : son terrain fait
// partie de ce qui a été observé, il n'a pas à se re-dériver à chaque lot. La
// version dérivée liait ces mesures au générateur, si bien qu'un changement de
// tirage cassait des assertions qui ne parlaient pas de tirage.
const CHAMPS_DE_LA_MAQUETTE = {
  repartition: { quartz: 6, scorie: 6 },
  cases: [
    { rangee: 12, colonne: 5, ressource: 'scorie' },
    { rangee: 13, colonne: 2, ressource: 'quartz' },
    { rangee: 14, colonne: 2, ressource: 'quartz' },
    { rangee: 14, colonne: 3, ressource: 'quartz' },
    { rangee: 14, colonne: 6, ressource: 'scorie' },
    { rangee: 14, colonne: 7, ressource: 'scorie' },
    { rangee: 15, colonne: 5, ressource: 'scorie' },
    { rangee: 16, colonne: 7, ressource: 'quartz' },
    { rangee: 17, colonne: 2, ressource: 'scorie' },
    { rangee: 17, colonne: 3, ressource: 'scorie' },
    { rangee: 17, colonne: 6, ressource: 'quartz' },
    { rangee: 17, colonne: 7, ressource: 'quartz' },
  ],
  tentatives: 1,
};

function baseDeLaMaquette() {
  const champs = {
    repartition: { ...CHAMPS_DE_LA_MAQUETTE.repartition },
    cases: CHAMPS_DE_LA_MAQUETTE.cases.map((k) => ({ ...k })),
    tentatives: CHAMPS_DE_LA_MAQUETTE.tentatives,
  };
  const disposition = [
    ['chantierDeConstruction', 18, 5, 6], ['collecteur', 13, 2, 6], ['collecteur', 14, 2, 6],
    ['collecteur', 14, 6, 5], ['collecteur', 14, 7, 5], ['collecteur', 16, 7, 4],
    ['raffinerie', 15, 6, 5], ['centrale', 16, 5, 4], ['accumulateur', 17, 5, 3],
    ['caserne', 18, 3, 4], ['complexeDeDefense', 18, 7, 3],
  ].map(([id, rangee, colonne, niveau]) => ({ id, rangee, colonne, niveau }));
  // Le montage doit être LÉGAL avant de mesurer quoi que ce soit : une
  // disposition invalide donnerait des débits qui ne veulent rien dire.
  assert.deepEqual(problemesDeDisposition(disposition, champs), []);
  // ⚠ LES DEUX FORCES SONT DU MONTAGE DEPUIS LE 28/08. L'état porte
  // `garnison` et `armee` ; un montage qui les omet n'est plus un état de jeu,
  // et `resumeDeLaBase` le dit au lieu de lever au fond de `sim/`.
  // ⚠⚠ L'ENVELOPPE DE BASES EST DU MONTAGE DEPUIS LE LOT BASES-0, 02/09/2026,
  // pour la raison EXACTE des six champs qui l'ont précédée : les onze champs
  // d'une base ont descendu d'un cran, et un montage qui les laisse à la racine
  // n'est plus un état de jeu. `baseCourante` le dit au lieu de lever une
  // TypeError au fond de `sim/`.
  return {
    graine: 4242,
    baseCourante: 0,
    bases: [{
      disposition,
      champs,
      economie: creerEtatEconomie(disposition),
      garnison: [],
      armee: [],
      // ⚠ LA TABLE DES SATELLITES EST DU MONTAGE DEPUIS LE 29/08, pour la raison
      // exacte qui a fait entrer les deux forces la veille : `tickJeu` la lit, et
      // un montage qui l'omet n'est plus un état de jeu. Le message le dit au lieu
      // de lever une TypeError au fond de `sim/`.
      satellites: satellitesVides(),
      // ⚠ ET LA RÉSERVE DE RÉPARATION DEPUIS LE 01/09, pour la raison EXACTE des
      // cinq champs d'avant : `tickJeu` la crédite, et un montage qui l'omet n'est
      // plus un état de jeu. Elle a REMPLACÉ `reparation: null` — le chronomètre a
      // cédé la place à trois stocks de temps, un par châssis.
      reserveReparation: reservesVides(),
      // ⚠ `position` EST DANS LA BASE, ELLE AUSSI : le relevé des POI demande à
      // la carte ce que porte chaque case du territoire, et le territoire part
      // de là où la base est.
      position: positionDepartJoueur(),
    }],
    // ⚠ ET LES POINTS D'ATTAQUE DEPUIS LE 29/08 AU SOIR, pour la raison exacte
    // qui a fait entrer les satellites le matin : `tickJeu` les lit, et un
    // montage qui les omet n'est plus un état de jeu.
    attaque: creerPointsAttaque(),
    // ⚠ ET LES SITES ENTAMÉS, pour la même raison que les trois d'avant :
    // `tickJeu` les lit, un montage qui les omet n'est plus un état de jeu.
    sitesEntames: {},
    basesRasees: [],
    recherche: { pointsMilli: '0' },
    // ⚠ ET LES POI ACQUIS DEPUIS LE 31/08, pour la raison EXACTE des quatre
    // champs d'avant : `tickJeu` les relève, et un montage qui les omet n'est
    // plus un état de jeu. Ils sont GLOBAUX depuis le lot BASES-0 — « acquis une
    // fois, valable partout », Ethan, 02/09.
    poisAcquis: [],
  };
}

// ---------------------------------------------------------------------------
// Formatage
// ---------------------------------------------------------------------------

test('chantier — les milliers se groupent avec l\'espace fine insécable', () => {
  // ⚠ U+202F, ET ON L'ASSERTE PAR SON CODE. Écrire l'espace dans le littéral du
  // test la rendrait indiscernable d'une espace ordinaire à la relecture, et
  // un jour quelqu'un « corrigerait » l'une en l'autre sans que rien ne tombe.
  assert.equal(SEPARATEUR_MILLIERS.codePointAt(0), 0x202F);
  assert.equal(SEPARATEUR_MILLIERS.length, 1);

  assert.equal(formaterEntier(0), '0');
  assert.equal(formaterEntier(7), '7');
  assert.equal(formaterEntier(999), '999');
  assert.equal(formaterEntier(1000), `1${SEPARATEUR_MILLIERS}000`);
  assert.equal(formaterEntier(45_738_385), `45${SEPARATEUR_MILLIERS}738${SEPARATEUR_MILLIERS}385`);
  assert.equal(formaterEntier(-1234), `-1${SEPARATEUR_MILLIERS}234`);
  // Falsifiable : le séparateur ne doit surtout pas être une espace ordinaire.
  assert.ok(!formaterEntier(1000).includes(' '), 'espace ordinaire entre les milliers');
  assert.throws(() => formaterEntier(Number.NaN), /n'est pas un nombre fini/);
});

test('chantier — les milli-unités se tronquent, elles ne s\'arrondissent pas', () => {
  // Afficher 1 quand le stock vaut 999 milli ferait croire au joueur qu'il peut
  // dépenser une unité qu'il n'a pas. Même règle que `formaterPv` du banc.
  assert.equal(formaterUnites(0), '0');
  assert.equal(formaterUnites(999), '0');
  assert.equal(formaterUnites(1000), '1');
  assert.equal(formaterUnites(1999), '1');
  assert.equal(formaterUnites(7_032_000), `7${SEPARATEUR_MILLIERS}032`);

  assert.equal(formaterDebit(0), '—', 'un débit nul se lit « — », pas « +0/h »');
  assert.equal(formaterDebit(2_250_000), `+2${SEPARATEUR_MILLIERS}250/h`);
  assert.equal(formaterDebit(567_000), '+567/h');
});

test('chantier — un niveau moyen montre TOUJOURS sa décimale', () => {
  // ⚠ ARBITRÉ LE 27/08 : « 6,0 », jamais « 6 ». Un niveau moyen qui tombe rond
  // reste une moyenne ; l'écrire sans décimale le ferait lire comme le niveau
  // entier d'un bâtiment.
  assert.equal(formaterDixiemes(46), '4,6');
  assert.equal(formaterDixiemes(60), '6,0');
  assert.equal(formaterDixiemes(10), '1,0');
  assert.equal(formaterDixiemes(5), '0,5');
  assert.equal(formaterDixiemes(500), '50,0');
  assert.equal(formaterDixiemes(1234), '123,4');
  // Au-delà du millier, la partie entière se groupe comme partout ailleurs.
  assert.equal(formaterDixiemes(12_345), `1${SEPARATEUR_MILLIERS}234,5`);
  // Falsifiable dans le sens qui compte : rien ne doit rendre un entier nu.
  for (const dixiemes of [10, 20, 50, 100, 500]) {
    assert.ok(formaterDixiemes(dixiemes).includes(','), `${dixiemes} rendu sans décimale`);
  }
  assert.throws(() => formaterDixiemes(4.6), /pas un entier de dixièmes/);

  // Les deux niveaux que l'état ne porte pas s'affichent en creux, jamais à 0.
  assert.equal(formaterNiveau(null), NIVEAU_ABSENT);
  assert.equal(formaterNiveau(46), '4,6');
  assert.notEqual(NIVEAU_ABSENT, '0,0');
});

// ---------------------------------------------------------------------------
// Vocabulaire d'écran
// ---------------------------------------------------------------------------

test('chantier — les onze sigles couvrent la table et sont tous distincts', () => {
  // Un sigle en double, ce sont deux bâtiments qu'on confond à l'œil sur la
  // grille — précisément ce que le sigle existe pour empêcher. Et la table doit
  // suivre `BASE_BATIMENTS` : un douzième bâtiment sans sigle afficherait
  // « undefined » sur son jeton.
  assert.deepEqual(Object.keys(SIGLES).sort(), Object.keys(BASE_BATIMENTS).sort());
  const sigles = Object.values(SIGLES);
  assert.equal(new Set(sigles).size, sigles.length, 'deux bâtiments portent le même sigle');
  for (const sigle of sigles) assert.match(sigle, /^[A-Z]{3}$/);
  // Le piège qui a imposé la table écrite : les trois premières lettres du nom
  // ne suffisent pas, deux bâtiments les partagent.
  const troisPremieres = Object.values(BASE_BATIMENTS)
    .map((b) => b.nom.joueur.slice(0, 3).toUpperCase());
  assert.ok(
    new Set(troisPremieres).size < troisPremieres.length,
    'si les trois premières lettres suffisaient, la table écrite ne se justifierait plus',
  );
});

test('chantier — la famille visuelle se déduit du rôle, pour les onze', () => {
  const familles = {};
  for (const id of Object.keys(BASE_BATIMENTS)) familles[id] = familleDuBatiment(id);
  assert.equal(familles.chantierDeConstruction, 'pivot');
  assert.equal(familles.collecteur, 'prod');
  assert.equal(familles.raffinerie, 'prod');
  assert.equal(familles.centrale, 'prod');
  assert.equal(familles.accumulateur, 'prod');
  assert.equal(familles.caserne, 'mil');
  assert.equal(familles.complexeDeDefense, 'mil');
  // Falsifiable : les trois familles doivent réellement être employées, sinon
  // la déduction n'en distingue aucune.
  assert.deepEqual([...new Set(Object.values(familles))].sort(), ['mil', 'pivot', 'prod']);
  // Un seul pivot : le Chantier, dont la chute rase la base.
  assert.equal(Object.values(familles).filter((f) => f === 'pivot').length, 1);
  assert.throws(() => familleDuBatiment('fonderie'), /n'est pas un bâtiment de la base/);
});

test('chantier — les trois bandes sont lues dans GRILLE, et couvrent la grille', () => {
  // Aucune borne écrite ici : elles viennent de `GRILLE`, qui fait foi.
  assert.equal(BANDES.length, 3);
  assert.equal(BANDES[0].premiere, GRILLE.bandes.deploiement.premiere);
  assert.equal(BANDES[2].derniere, GRILLE.bandes.batiments.derniere);
  // Toutes les rangées appartiennent à exactement une bande — pas de trou, pas
  // de recouvrement.
  const comptes = {};
  for (let rangee = 1; rangee <= GRILLE.longueur; rangee++) {
    const bande = bandeDeLaRangee(rangee);
    comptes[bande] = (comptes[bande] ?? 0) + 1;
  }
  assert.deepEqual(Object.keys(comptes).sort(), ['batiments', 'defense', 'deploiement']);
  assert.equal(Object.values(comptes).reduce((a, b) => a + b, 0), GRILLE.longueur);

  // ⚠ LA DERNIÈRE RANGÉE EST LE FOND, celle du Chantier — pas « le haut ».
  assert.equal(bandeDeLaRangee(GRILLE.longueur), 'batiments');
  assert.equal(bandeDeLaRangee(1), 'deploiement');
  assert.throws(() => bandeDeLaRangee(0), /hors de la grille/);
  assert.throws(() => bandeDeLaRangee(GRILLE.longueur + 1), /hors de la grille/);

  // Les trois ressources ont toutes un libellé : aucune ne s'affiche muette.
  for (const r of RESSOURCES) {
    assert.equal(typeof LIBELLES_RESSOURCE[r]?.nom, 'string', `ressource « ${r} » sans libellé`);
    assert.equal(typeof LIBELLES_RESSOURCE[r]?.sigle, 'string');
  }
});

test('chantier — la barre du bas porte DEUX bandes, le déploiement n\'en est plus', () => {
  // ⚠ POURQUOI DEUX ET NON TROIS. Le lot précédent donnait un bouton « Assaut »
  // pointant sur les rangées 1–2. Ces deux rangées sont l'endroit où les vagues
  // PARAISSENT pendant un combat, pas celui où on les COMPOSE : le bouton
  // promettait un éditeur et livrait du sol nu. La composition a désormais son
  // écran, et ce raccourci-là n'existe plus.
  assert.deepEqual(BANDES_NAVIGABLES, ['batiments', 'defense']);
  assert.ok(!BANDES_NAVIGABLES.includes('deploiement'), 'le déploiement a repris un bouton');

  // La bande, elle, EXISTE toujours : elle se dessine et se traverse en
  // défilant. C'est le raccourci qui disparaît, pas la géométrie.
  assert.equal(BANDES.length, 3);
  assert.ok(BANDES.some((b) => b.cle === 'deploiement'));

  // Chaque bouton renvoie à une bande réelle de la grille, et porte un nom.
  for (const cle of BANDES_NAVIGABLES) {
    const bande = BANDES.find((b) => b.cle === cle);
    assert.ok(bande, `bande « ${cle} » introuvable`);
    assert.equal(typeof bande.nom, 'string');
    assert.ok(bande.nom.length > 0);
  }
  // Et plus aucune bande ne s'appelle « Assaut » : le mot désigne un écran
  // maintenant, pas deux rangées de sol nu.
  assert.deepEqual(BANDES.filter((b) => b.nom === 'Assaut'), []);
});

// ---------------------------------------------------------------------------
// Ce que l'écran lit dans l'état
// ---------------------------------------------------------------------------

test('chantier — le résumé retrouve, par le moteur, les chiffres de la maquette', () => {
  const etat = baseDeLaMaquette();
  const resume = resumeDeLaBase(etat);

  // Les chiffres relevés indépendamment le 27/08 et gardés par
  // `tools/audit-maquette.mjs`. En milli-unités, comme le moteur les range.
  //
  // ⚠ LES CAPACITÉS ONT BOUGÉ DE 50 · 50 · 40 LE 27/08 AU SOIR, et c'est la
  // POCHE du Chantier — arbitrée depuis la feuille EFFETS ligne 14. Les débits,
  // eux, n'ont pas changé d'une unité : la poche stocke, elle ne produit pas.
  // On l'écrit ADDITIONNÉE plutôt que fondue dans un nouveau total, pour que la
  // ligne dise d'où vient l'écart.
  //
  // ⚠ ET ELLES ONT REBOUGÉ LE MÊME SOIR, une heure plus tard : la poche suit le
  // niveau depuis l'arbitrage d'Ethan (× 1,25). La maquette porte un Chantier
  // de niveau 6, donc 50 × 1,25⁵ = 153, pas 50. La ligne précédente lisait le
  // CHAMP `stockagePropre`, qui ne porte que le niveau 1 — elle a rendu 50 pour
  // un Chantier de niveau 6 et le test est tombé. Passer par
  // `stockagePropreDuNiveau` est le seul moyen de ne pas relire le niveau 1.
  const niveauDuChantier = baseCourante(etat).disposition
    .find((b) => b.id === 'chantierDeConstruction').niveau;
  const capRaffinerie = capaciteDuNiveau('raffinerie',
    baseCourante(etat).disposition.find((b) => b.id === 'raffinerie').niveau) * 1000;
  const capAccumulateur = capaciteDuNiveau('accumulateur',
    baseCourante(etat).disposition.find((b) => b.id === 'accumulateur').niveau) * 1000;
  const poche = stockagePropreDuNiveau('chantierDeConstruction', niveauDuChantier);
  // Falsifiable : si la maquette repassait à un Chantier de niveau 1, la poche
  // vaudrait de nouveau 50 et cette ligne ne distinguerait plus les deux
  // lectures. Le montage doit être à un niveau où elles DIFFÈRENT.
  assert.ok(
    niveauDuChantier > 1 && poche.quartz > BASE_BATIMENTS.chantierDeConstruction.stockagePropre.quartz,
    'la maquette doit porter un Chantier au-dessus du niveau 1, sinon la courbe n\'est pas mesurée',
  );
  assert.ok(poche.quartz > 0, 'poche nulle : le montage ne mesure rien');
  assert.deepEqual(resume.ressources, [
    // ⚠ LES CAPACITÉS SE LISENT DANS LA TABLE DEPUIS LE 28/08. Elles portaient
    // 7 032 et 2 256 en dur ; la courbe arbitrée ce jour-là les a divisées par
    // vingt-deux d'un coup, et un nombre retapé ici ne dit de toute façon rien
    // que `capaciteDuNiveau` ne dise mieux. Les DÉBITS, eux, restent en dur :
    // c'est eux que ce test confronte à la maquette, et ils n'ont pas bougé.
    { cle: 'quartz', stockMilli: 0, capaciteMilli: capRaffinerie + poche.quartz * 1000, debitMilli: 2_250_000 },
    { cle: 'scorie', stockMilli: 0, capaciteMilli: capRaffinerie + poche.scorie * 1000, debitMilli: 1_876_000 },
    { cle: 'electricite', stockMilli: 0, capaciteMilli: capAccumulateur + poche.electricite * 1000, debitMilli: 567_000 },
  ]);
  // ⚠ LE NOMBRE OUVERT SE LIT, IL NE SE RECOPIE PAS. La table d'emplacements a
  // changé le 29/08 ; ce qui est mesuré ici est que le résumé demande la même
  // grandeur que `data/base.js`, pas qu'elle vaille douze.
  const niveauChantier = baseCourante(etat).disposition.find((b) => b.id === 'chantierDeConstruction').niveau;
  assert.deepEqual(resume.emplacements, {
    poses: 11, ouverts: emplacementsDuNiveau(niveauChantier),
  });
  assert.deepEqual(resume.niveaux, { batiments: 46, defense: null, assaut: null });

  // Et le même résultat par le chemin direct : le résumé ne fait que recopier
  // ce que le moteur dit, il ne recalcule rien pour son compte.
  const capacites = capacitesMilli(baseCourante(etat).disposition);
  const total = {};
  for (const r of RESSOURCES) total[r] = 0;
  for (const parBatiment of debitsMilliParHeure(baseCourante(etat).disposition, baseCourante(etat).champs)) {
    for (const r of RESSOURCES) total[r] += parBatiment[r] ?? 0;
  }
  for (const ligne of resume.ressources) {
    assert.equal(ligne.capaciteMilli, capacites[ligne.cle]);
    assert.equal(ligne.debitMilli, total[ligne.cle]);
  }
  assert.equal(resume.niveaux.batiments, niveauDesBatiments(baseCourante(etat).disposition));
  assert.equal(resume.emplacements.ouverts, emplacementsDuNiveau(6));

  // Falsifiable : rien de tout ça ne doit être nul, sinon les égalités
  // ci-dessus passeraient aussi sur un module qui rend zéro partout.
  for (const ligne of resume.ressources) {
    assert.ok(ligne.debitMilli > 0, `débit nul en ${ligne.cle}`);
    assert.ok(ligne.capaciteMilli > 0, `capacité nulle en ${ligne.cle}`);
  }

  // Ce que le joueur lit vraiment, une fois formaté.
  //
  // ⚠ CETTE LIGNE EST TOMBÉE AU PASSAGE DE LA POCHE À LA COURBE, et elle avait
  // raison. Elle portait « 7 082 » — 7 032 + 50, la poche PLATE — alors que
  // l'assertion vingt lignes plus haut était déjà passée à `poche.quartz`. Un
  // nombre retapé à deux endroits n'en fait bouger qu'un. Le garde ci-dessous
  // nomme la cause au lieu de laisser un écart de trois chiffres :
  const capaciteQuartz = capRaffinerie + poche.quartz * 1000;
  assert.equal(
    capaciteQuartz, 473_000,
    'la courbe de stockage ou la poche ont bougé : recalculer la ligne formatée juste en dessous',
  );
  assert.equal(formaterUnites(resume.ressources[0].capaciteMilli), '473');
  assert.equal(formaterDebit(resume.ressources[1].debitMilli), `+1${SEPARATEUR_MILLIERS}876/h`);
  assert.equal(formaterDixiemes(resume.niveaux.batiments), '4,6');
});

test('chantier — le bandeau contextuel sépare les deux ressources d\'une raffinerie', () => {
  const etat = baseDeLaMaquette();
  const raffinerie = baseCourante(etat).disposition.findIndex((b) => b.id === 'raffinerie');
  assert.ok(raffinerie >= 0);
  // ⚠ 144 ET 216 NE S'ADDITIONNENT PAS, et c'est l'arbitrage du 26/08 : une
  // raffinerie tient les deux ressources à la fois. Ici, au niveau 5, c'est
  // +176 de quartz et +352 de scorie — jamais 528 d'un mélange.
  const detail = detailDuBatiment(etat, raffinerie);
  assert.equal(detail.nom, 'Raffinerie');
  assert.equal(detail.niveau, 5);
  assert.equal(detail.detail, 'Niv. 5 · +176 q +352 s /h');
  assert.ok(!detail.detail.includes('528'), 'les deux ressources ont été additionnées');

  // Un bâtiment qui ne produit rien ne porte pas de « /h » orphelin.
  const chantier = baseCourante(etat).disposition.findIndex((b) => b.id === 'chantierDeConstruction');
  assert.equal(detailDuBatiment(etat, chantier).detail, 'Niv. 6');
  // Et le nom affiché est celui de la table, jamais le sigle du jeton.
  assert.equal(detailDuBatiment(etat, chantier).nom, BASE_BATIMENTS.chantierDeConstruction.nom.joueur);
  assert.throws(() => detailDuBatiment(etat, 99), /hors de la disposition/);
});

test('chantier — la palette GRISE un unique déjà posé, elle ne le retire plus', () => {
  // ⚠ CE TEST DISAIT L'INVERSE JUSQU'AU 28/08. Ethan : « quand on pose un
  // bâtiment unique, griser le bouton, pas le faire disparaître ». La palette
  // perdait une vignette à chaque unique posé, donc elle changeait de longueur
  // et les autres se déplaçaient sous le doigt entre deux gestes.
  const etat = baseDeLaMaquette();
  const posables = posablesDeLaBase(etat);
  const ids = posables.map((p) => p.id);

  // La palette porte TOUS les bâtiments, tout le temps.
  assert.deepEqual(ids.slice().sort(), Object.keys(BASE_BATIMENTS).slice().sort());
  assert.equal(posables.length, 11);

  // Les trois uniques posés y sont, marqués…
  for (const pose of ['chantierDeConstruction', 'caserne', 'complexeDeDefense']) {
    assert.equal(posables.find((p) => p.id === pose).dejaPose, true, `${pose} est unique et posé`);
  }
  // …les deux uniques encore libres n'ont pas la marque…
  for (const libre of ['centreDeCommandement', 'qgDeDefense']) {
    assert.equal(posables.find((p) => p.id === libre).dejaPose, false, `${libre} est encore libre`);
  }
  // …et les quatre non-uniques ne l'ont jamais, même posés en plusieurs
  // exemplaires : c'est la propriété `unique` qui décide, pas le compte.
  for (const multiple of ['collecteur', 'raffinerie', 'centrale', 'accumulateur']) {
    assert.equal(posables.find((p) => p.id === multiple).dejaPose, false, `${multiple} n'est pas unique`);
    assert.ok(baseCourante(etat).disposition.some((b) => b.id === multiple), `${multiple} devrait être posé`);
  }

  // Falsifiable : sur une base NEUVE, seul le Chantier porte la marque. Un
  // montage où tout serait posé — ou rien — ne distinguerait pas les deux cas.
  const paletteNeuve = posablesDeLaBase(creerEtat(7));
  assert.deepEqual(
    paletteNeuve.filter((p) => p.dejaPose).map((p) => p.id), ['chantierDeConstruction'],
  );

  // Et l'écran LIT cette marque au lieu de recompter les uniques lui-même.
  //
  // ⚠ LA MARQUE A CHANGÉ DE NOM AU LOT GARNISON-ET-ARMÉE, PAS DE SENS. Depuis
  // que la bande Défense est éditable, la même vignette et la même classe
  // servent deux terrains : `verrouille` dit « celui-là, tu ne peux pas le
  // poser maintenant » des deux côtés — un unique déjà posé au Chantier, une
  // pièce que le niveau du QG n'a pas encore ouverte en défense. `dejaPose`
  // reste la marque du terrain des bâtiments, et le terrain la traduit.
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  assert.match(ecran, /classList\.toggle\('pose', posable\.verrouille\)/,
    'la palette ne grise plus la vignette d\'un unique posé');
  assert.match(ecran, /verrouille: p\.dejaPose/,
    'le terrain des bâtiments ne traduit plus « déjà posé » en « verrouillé »');

  // ⚠ LE CHAMP NE S'APPELLE PLUS `coutNiveauDeux`, ET LE RENOMMAGE EST LA
  // CORRECTION. Sous l'ancien nom, la vignette de pose affichait ce nombre en
  // chiffre nu : « 3 » sur un Collecteur posable se lit « poser coûte 3 ». Or
  // poser ne coûte RIEN — le niveau 1 est gratuit pour les onze. Le nom dit
  // maintenant ce que le nombre est : le coût de la PREMIÈRE AMÉLIORATION.
  for (const p of posables) {
    assert.equal(
      p.coutPremiereAmelioration, COUT_NIVEAU_DEUX[BASE_BATIMENTS[p.id].classeDeCout],
    );
    assert.equal(p.nom, BASE_BATIMENTS[p.id].nom.joueur);
    assert.ok(p.coutPremiereAmelioration > 0);
    // L'ancien nom ne doit pas survivre en doublon : deux champs pour le même
    // nombre laisseraient un appelant continuer d'employer le trompeur.
    assert.ok(!('coutNiveauDeux' in p), 'l\'ancien nom trompeur est toujours là');
  }
  // Et le premier niveau payant est bien le DEUXIÈME : c'est ce fait qui rend
  // l'ancien affichage faux, et il se lit dans la table, pas de mémoire.
  assert.equal(ECONOMIE_NIVEAU.premierNiveauPayant, 2);

  // Sur une base NEUVE, seul le Chantier est posé — et depuis le 28/08 il reste
  // dans la palette, grisé, au lieu d'en sortir. La longueur ne bouge donc plus
  // d'une pose à l'autre, ce qui est tout l'intérêt de l'arbitrage : les
  // vignettes ne se déplacent plus sous le doigt.
  const neuve = creerEtat(7);
  assert.equal(baseCourante(neuve).disposition.length, 1);
  assert.equal(posablesDeLaBase(neuve).length, Object.keys(BASE_BATIMENTS).length);
  assert.equal(posablesDeLaBase(neuve).filter((p) => !p.dejaPose).length,
    Object.keys(BASE_BATIMENTS).length - 1, 'un seul bâtiment devrait être grisé');
  assert.deepEqual(resumeDeLaBase(neuve).emplacements, {
    poses: 1, ouverts: emplacementsDuNiveau(1),
  });
});

// ---------------------------------------------------------------------------
// La session
// ---------------------------------------------------------------------------

test('session — les deux chemins d\'avancement rendent le même état', () => {
  // ⚠ LE SEUIL N'EST PAS UN COMPROMIS D'EXACTITUDE. `avancer` boucle sous le
  // seuil et rattrape au-dessus ; les deux chemins doivent rendre le MÊME état,
  // sinon le retour d'un onglet masqué donnerait des ressources que le jeu
  // ouvert n'aurait pas données.
  const dureeMs = (SEUIL_RATTRAPAGE_TICKS + 1000) * 100;

  const parBoucle = baseDeLaMaquette();
  parBoucle.horloge = { tempsSimuleMs: 0, nbTicks: 0, residuMs: 0 };
  const parRattrapage = baseDeLaMaquette();
  parRattrapage.horloge = { tempsSimuleMs: 0, nbTicks: 0, residuMs: 0 };

  // Le premier avance par tranches qui restent sous le seuil, donc en bouclant ;
  // le second d'un coup, donc par rattrapage analytique.
  const tranche = (SEUIL_RATTRAPAGE_TICKS / 2) * 100;
  for (let restant = dureeMs; restant > 0; restant -= tranche) {
    avancer(parBoucle, Math.min(tranche, restant));
  }
  assert.equal(avancer(parRattrapage, dureeMs), SEUIL_RATTRAPAGE_TICKS + 1000);

  assert.deepEqual(baseCourante(parBoucle).economie, baseCourante(parRattrapage).economie);
  assert.deepEqual(parBoucle.horloge, parRattrapage.horloge);
  // Falsifiable : le montage doit avoir réellement produit quelque chose.
  assert.ok(baseCourante(parBoucle).economie.ressources.quartz > 0, 'aucune ressource produite');

  // ⚠ UNE HORLOGE QUI RECULE NE FAIT RIEN, ELLE NE LÈVE PAS. Fuseau, NTP,
  // joueur qui change la date de son téléphone : la même règle que `charger`.
  const avant = JSON.stringify(baseCourante(parBoucle).economie);
  assert.equal(avancer(parBoucle, -100_000), 0);
  assert.equal(JSON.stringify(baseCourante(parBoucle).economie), avant);
});

test('session — la clé de sauvegarde ne porte PAS le numéro de format', () => {
  // ⚠ LE « 1 » EST LA VERSION DE L'EMPLACEMENT, PAS CELLE DU CONTENU. Y mettre
  // `SAVE_VERSION` rendrait introuvable toute sauvegarde d'un format antérieur,
  // et la chaîne de migrations — six maillons, écrite et éprouvée — ne servirait
  // plus jamais à personne.
  assert.match(CLE_SAUVEGARDE, /^foyer-zero\/partie\/\d+$/);
  assert.notEqual(CLE_SAUVEGARDE, CLE_SECOURS);
  assert.ok(CLE_SECOURS.startsWith(CLE_SAUVEGARDE), 'la clé de secours dérive de la principale');

  // Les réglages de la boucle tiennent debout : on sauvegarde plus souvent que
  // l'on ne perdrait de temps de jeu, et l'appui long ne se déclenche pas par
  // accident.
  assert.ok(PERIODE_SAUVEGARDE_MS >= 5_000 && PERIODE_SAUVEGARDE_MS <= 120_000);
  assert.ok(DUREE_APPUI_DEBUG_MS >= 1_000, 'un appui plus court se déclencherait par accident');
  // Le seuil de rattrapage vaut moins d'une heure de jeu : au-delà, la boucle
  // tick par tick coûterait plus qu'une image.
  assert.ok(SEUIL_RATTRAPAGE_TICKS > 0 && SEUIL_RATTRAPAGE_TICKS < TICKS_PAR_HEURE);
});

// ---------------------------------------------------------------------------
// Le HTML produit
// ---------------------------------------------------------------------------

test('chantier — le HTML produit porte les sept bandeaux et le retour du banc', () => {
  // Même rôle que T16 pour le bloc Défense : l'écran est construit par le JS à
  // partir d'un balisage vide, et un identifiant renommé d'un seul côté ne se
  // verrait nulle part ailleurs — l'écran resterait simplement muet.
  //
  // ⚠ `npm run check` lance le build AVANT les tests, et T10 le relance ; on lit
  // donc un `dist/index.html` à jour.
  const html = readFileSync(join(RACINE, 'dist', 'index.html'), 'utf8');
  for (const attendu of [
    // L'en-tête COMMUN aux trois écrans, sorti de `#ecran-chantier` le 28/08.
    'jeu', 'ecrans', 'tete-onglets', 'onglet-base', 'onglet-options', 'ressources',
    'navigation', 'navigation-precedente', 'navigation-suivante', 'navigation-libelle',
    'barre-bas', 'ecran-options', 'options-version',
    'ecran-chantier', 'chantier-champ', 'chantier-defile', 'chantier-grille',
    'chantier-contexte', 'chantier-selection-nom', 'chantier-selection-detail',
    'chantier-reparer', 'chantier-ameliorer', 'chantier-ameliorer-cible', 'chantier-demolir',
    'chantier-palette', 'chantier-avis',
    'chantier-alerte', 'chantier-alerte-message', 'chantier-alerte-neuve', 'chantier-alerte-reessayer',
    // Le panneau de détail, lot PANNEAU-ET-MARGES : son contenu vient du JS,
    // mais ses quatre points d'ancrage sont dans le balisage.
    'chantier-panneau', 'chantier-panneau-titre', 'chantier-panneau-fermer',
    'chantier-panneau-corps', 'chantier-panneau-ameliorer',
    // L'écran Recherche, lot RECHERCHE : son onglet, ses trois panneaux et les
    // deux ancres que `ui/recherche.js` remplit. Même rôle que ci-dessus — le
    // JS écrit tout le contenu, un identifiant renommé d'un seul côté laisserait
    // l'écran muet sans qu'aucun test ne le dise.
    'onglet-recherche', 'ecran-recherche', 'recherche-tete', 'recherche-points',
    'recherche-pastilles', 'recherche-panneaux',
    'recherche-offense', 'recherche-defense', 'recherche-special',
  ]) {
    assert.ok(html.includes(attendu), `élément « ${attendu} » absent du HTML final`);
  }

  // Le banc reste embarqué, mais CACHÉ, et on peut en revenir. T10 garde déjà sa
  // présence ; ce qui est neuf, c'est qu'il est derrière un attribut `hidden` et
  // qu'il a une porte de sortie.
  assert.ok(/<div id="banc" hidden>/.test(html), 'le banc n\'est pas caché dans le HTML livré');
  assert.ok(html.includes('banc-fermer'), 'aucun retour au jeu depuis le banc');

  // ⚠ `[hidden]` NE CACHE RIEN CONTRE UN SÉLECTEUR D'ID. `#chantier-alerte` fixe
  // `display: flex` (spécificité 1,0,0) et l'emporterait sur `[hidden]` (0,1,0)
  // sans le `!important` de la tête de feuille. Le même piège avait déjà mordu
  // sur `#banc-arsenal` au lot 5A.
  assert.ok(/\[hidden\]\s*\{[^}]*display:\s*none\s*!important/.test(html),
    'la règle [hidden] a perdu son !important');

  // Les onglets à venir sont désactivés : un contrôle inerte qui a l'air vif
  // fait douter le joueur de son appareil plutôt que du jeu.
  //
  // ⚠⚠ PLUS AUCUN ONGLET MORT DEPUIS LE LOT RECHERCHE (30/08), et la garde a
  // CHANGÉ DE FORME pour le dire. Elle listait les boutons `class="futur"
  // disabled` et attendait `['Recherche']` ; une liste attendue VIDE aurait été
  // vraie aussi le jour où quelqu'un écrirait un onglet mort SANS la classe —
  // et la classe vient justement de disparaître de la feuille de style, faute
  // de porteur. On asserte donc le POSITIF, sur les cinq boutons de la barre :
  // chacun porte un identifiant (donc quelque chose l'écoute) et aucun n'est
  // éteint. Un onglet mort de plus tombe, quelle que soit la façon de l'écrire.
  const barre = html.match(/<div id="tete-onglets">([\s\S]*?)<\/div>/);
  assert.ok(barre, 'la barre d\'onglets a disparu');
  const onglets = [...barre[1].matchAll(/<button[^>]*>[^<]*</g)].map((m) => m[0]);
  assert.equal(onglets.length, 5, 'la barre ne porte plus cinq onglets');
  for (const onglet of onglets) {
    assert.match(onglet, /\sid="onglet-[a-z]+"/, `onglet sans identifiant : ${onglet}`);
    assert.ok(!/\sdisabled/.test(onglet), `onglet désactivé : ${onglet}`);
    assert.ok(!/class="[^"]*\bfutur\b/.test(onglet), `onglet encore « futur » : ${onglet}`);
  }

  // ⚠ LES TROIS BOUTONS D'ACTION NE SONT PLUS DÉSACTIVÉS, ET C'EST LE LOT.
  // Le modèle est « armer puis toucher » : c'est le bouton qu'on touche EN
  // PREMIER, donc il doit être vif avant qu'un bâtiment soit choisi. Les laisser
  // `disabled` dans le balisage rendrait tout le lot inatteignable au doigt.
  for (const bouton of ['chantier-reparer', 'chantier-ameliorer', 'chantier-demolir']) {
    assert.doesNotMatch(html, new RegExp(`id="${bouton}"[^>]*disabled`),
      `${bouton} est désactivé : le modèle « armer puis toucher » ne peut pas démarrer`);
  }

  // ⚠ LE BANDEAU D'EMPLACEMENTS RESTE PARTI — le COMPTEUR, lui, est revenu.
  // La distinction n'est pas un détail : c'est la barre de gauche et son
  // bandeau dédié qui ont disparu le 27/08, et le chiffre a été remis le 28/08
  // dans le bandeau des ressources, où il se lit comme un stock plafonné. Ce
  // test garde donc le BANDEAU retiré, et le test du compteur garde le chiffre
  // présent : les deux ensemble disent la forme exacte.
  for (const parti of ['chantier-emplacements', 'chantier-jauge', 'chantier-demonter']) {
    assert.ok(!html.includes(parti), `« ${parti} » devait disparaître de l'écran`);
  }

  // ⚠ ET L'EN-TÊTE A DÉMÉNAGÉ, IL N'A PAS ÉTÉ DUPLIQUÉ. Les anciens
  // identifiants ne doivent plus exister : deux bandeaux de ressources, l'un
  // dans l'écran et l'autre au-dessus, se rempliraient chacun de leur côté et
  // l'un des deux mentirait. On lit la page décommentée — la prose du lot
  // raconte ce déménagement et citerait les noms partis.
  const code = html.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const demenage of ['chantier-onglets', 'chantier-ressources', 'chantier-bandes',
    'chantier-bandes-liste', 'chantier-version', 'chantier-vers-offense']) {
    assert.ok(!code.includes(demenage), `« ${demenage} » survit après le déménagement`);
  }
  // Cinq onglets, et AUCUN mort : Base, Mission, Recherche, Monde, Options.
  // ⚠ MISSION S'EST OUVERT AU LOT TUTORIEL, MONDE AU LOT ÉCRAN-CARTE, RECHERCHE
  // À CELUI-CI (30/08) — c'était le dernier. La liste attendue devient donc
  // vide ; la garde qui compte vraiment est celle du haut de ce fichier, qui
  // exige un identifiant sur les cinq boutons. Ici on garde la forme ancienne
  // pour lire le passage de `['Recherche']` à `[]` dans le diff du lot.
  const ongletsMorts = [...code.matchAll(/<button[^>]*class="futur"[^>]*disabled[^>]*>([^<]*)</g)]
    .map((m) => m[1]);
  assert.deepEqual(ongletsMorts.slice().sort(), []);
  assert.ok(/id="onglet-monde">Monde</.test(code), 'l\'onglet Monde est absent ou muet');
  assert.ok(/id="onglet-mission">Mission</.test(code), 'l\'onglet Mission est absent ou muet');
  assert.ok(/id="onglet-recherche">Recherche</.test(code),
    'l\'onglet Recherche est absent ou muet');
  assert.ok(/id="onglet-base">Base</.test(code), 'l\'onglet ne s\'appelle plus « Base »');
  assert.ok(!/>Chantier</.test(code), 'un onglet « Chantier » traîne encore');
  // Et la grille se centre par la MISE EN PAGE, jamais par une transformation :
  // un `scale()` décrocherait le doigt de la case qu'il vise.
  assert.match(html, /#chantier-grille\s*\{[^}]*margin-inline:\s*auto/,
    'la grille ne se centre plus par ses marges');
  assert.ok(!/#chantier-grille\s*\{[^}]*transform:/.test(html),
    'la grille est centrée par une transformation');

  // Le point d'entrée est la session, plus le banc : c'est ce qui garantit que
  // `initialiserBanc` n'est pas appelé au chargement.
  assert.ok(!/initialiserBanc\(document\)/.test(html), 'le banc est encore câblé au chargement');
});

test('chantier — un tick de jeu fait monter le stock que l\'écran affiche', () => {
  // ⚠ CE TEST EST LE JUMEAU SANS ÉCRAN DE LA VÉRIFICATION APPAREIL N° 3 (« les
  // stocks montent en regardant l'écran »). Il ne prouve pas l'affichage — rien
  // ici ne peut le prouver — mais il prouve que ce que l'écran LIT change quand
  // le temps passe. Si un jour le résumé se met à lire un champ figé, il tombe.
  const etat = baseDeLaMaquette();
  etat.horloge = { tempsSimuleMs: 0, nbTicks: 0, residuMs: 0 };
  const avant = resumeDeLaBase(etat);
  assert.equal(formaterUnites(avant.ressources[0].stockMilli), '0');

  // ⚠ L'HORIZON EST PASSÉ D'UNE HEURE À SIX MINUTES LE 28/08, ET CE N'EST PAS
  // UN ASSOUPLISSEMENT. La courbe de stockage arbitrée ce jour-là fait tenir
  // 473 unités de quartz à la base de la maquette contre 2 250 produites par
  // heure : elle SATURE en treize minutes. Une heure de boucle ne mesurait donc
  // plus « le stock monte », mais « le stock est plein » — ce qui est vrai de
  // n'importe quel code, cassé compris. On mesure sur un horizon où le stock
  // monte encore, et on asserte la saturation à part, juste en dessous.
  const HORIZON = TICKS_PAR_HEURE / 10; // six minutes
  assert.ok(Number.isInteger(HORIZON), 'l\'horizon doit tomber sur un nombre entier de ticks');
  for (let i = 0; i < HORIZON; i++) tickJeu(etat);
  const apres = resumeDeLaBase(etat);

  // Un dixième d'heure exactement : le résidu est le reste exact de la somme
  // cumulée, donc l'égalité est stricte, pas approchée.
  assert.equal(apres.ressources[0].stockMilli, avant.ressources[0].debitMilli / 10);
  assert.equal(formaterUnites(apres.ressources[0].stockMilli), '225');
  for (const ligne of apres.ressources) {
    assert.ok(ligne.stockMilli > 0, `${ligne.cle} n'a pas bougé en six minutes`);
    assert.ok(ligne.stockMilli < ligne.capaciteMilli,
      `${ligne.cle} sature déjà : l'horizon ne mesure plus une montée`);
  }

  // ⚠ ET LA SATURATION EST LE FAIT NEUF DE LA COURBE. On la mesure ici pour que
  // personne ne la découvre sur son téléphone : la base de la MAQUETTE — onze
  // bâtiments, Chantier de niveau 6 — remplit son quartz en moins d'un quart
  // d'heure. C'est la conséquence directe de l'arbitrage du 28/08, pas un défaut.
  for (let i = 0; i < TICKS_PAR_HEURE; i++) tickJeu(etat);
  const pleine = resumeDeLaBase(etat);
  assert.equal(pleine.ressources[0].stockMilli, pleine.ressources[0].capaciteMilli,
    'la base de la maquette devrait saturer en moins d\'une heure');
});


test('chantier — aucune vignette de pose ne présente un coût de POSE', () => {
  // ⚠ CE TEST LIT LA SOURCE, ET IL FAUT DIRE POURQUOI. Ce qu'il garde est un
  // rendu au DOM, et le dépôt n'a ni jsdom ni navigateur : la valeur affichée
  // ne peut pas être observée ici. Ce qui PEUT l'être, c'est que le seul
  // endroit qui écrit la pastille écrive la constante, et qu'aucun texte de
  // vignette ne soit alimenté par le coût.
  //
  // Le défaut qu'il garde a déjà été livré une fois : la pastille portait
  // `COUT_NIVEAU_DEUX` en chiffre nu, un commentaire du même fichier disait
  // trois lignes plus haut que poser est gratuit, et personne ne l'a vu avant
  // qu'Ethan n'essaie l'écran sur son téléphone.
  const source = readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8');

  // ⚠ LA VIGNETTE NE PORTE PLUS DE PASTILLE DU TOUT — retirée le 27/08 au soir
  // après l'essai d'Ethan. Douze vignettes qui annoncent toutes « gratuit » ne
  // disent plus rien, et la place manque. Ce test garde donc l'ABSENCE : ni le
  // mot, ni un chiffre, ni une pastille d'aucune sorte.
  assert.ok(
    !/className\s*=\s*['`"]cout['`"]/.test(source),
    'une pastille est revenue sur la vignette de pose',
  );
  assert.ok(
    !/textContent\s*=\s*['`"]gratuit['`"]/.test(source),
    'le mot « gratuit » est revenu dans un texte affiché',
  );
  // Falsifiable : le montage doit vraiment lire le fichier de la vignette.
  assert.ok(source.includes('peindrePalette'), 'ce n\'est pas le bon fichier');
  // Et le fait reste DIT, dans le titre — il a changé de place, pas disparu.
  //
  // ⚠ LE TITRE EST PASSÉ DANS UNE FONCTION AU LOT GARNISON-ET-ARMÉE, parce
  // qu'il dit deux choses différentes selon le terrain — un coût de première
  // amélioration pour un bâtiment, des points d'armée pour une pièce de
  // garnison. La garde suit la phrase, pas la ligne : ce qu'elle tient, c'est
  // que « gratuit » reste écrit quelque part dans ce que la vignette annonce.
  assert.ok(
    /function titreDeLaVignette\([\s\S]{0,700}gratuit/.test(source),
    'le titre de la vignette ne dit plus que poser est gratuit',
  );

  // Et AUCUN texte affiché n'est alimenté par le coût. Le coût reste rendu par
  // `posablesDeLaBase` et porté par le `title` de la vignette — il n'a pas
  // disparu, il a cessé d'être présenté comme un prix à payer pour poser.
  const fautes = source.split('\n')
    .filter((l) => /textContent\s*=/.test(l) && /coutPremiereAmelioration/.test(l));
  assert.deepEqual(fautes, [], `un texte affiché porte le coût : ${fautes.join(' | ')}`);

  // Falsifiable des deux côtés : le motif doit attraper la vraie régression…
  const appat = 'cout.textContent = String(posable.coutPremiereAmelioration);';
  assert.ok(/textContent\s*=/.test(appat) && /coutPremiereAmelioration/.test(appat),
    'le montage n\'attraperait pas le retour du chiffre nu');
  // …et laisser passer l'usage légitime, qui n'affiche rien de lui-même.
  const innocent = 'const cout = posable.coutPremiereAmelioration;';
  assert.ok(!/textContent\s*=/.test(innocent), 'la garde refuse une lecture légitime du coût');

  // Le coût EST toujours accessible : on ne l'a pas supprimé, on l'a déplacé.
  const posables = posablesDeLaBase(creerEtat(3));
  assert.ok(posables.every((p) => p.coutPremiereAmelioration > 0));
});


// ---------------------------------------------------------------------------
// La pose — lot POSE-À-L'ÉCRAN
// ---------------------------------------------------------------------------

/** Les quatre grandeurs qu'une pose déplace, lues dans le moteur. */
function quatreGrandeurs(etat) {
  const total = {};
  for (const r of RESSOURCES) total[r] = 0;
  for (const parBatiment of debitsMilliParHeure(baseCourante(etat).disposition, baseCourante(etat).champs)) {
    for (const r of RESSOURCES) total[r] += parBatiment[r] ?? 0;
  }
  return {
    debitQuartz: total.quartz,
    capaciteQuartz: capacitesMilli(baseCourante(etat).disposition).quartz,
    poses: resumeDeLaBase(etat).emplacements.poses,
    niveauDixiemes: niveauDesBatiments(baseCourante(etat).disposition),
  };
}

test('pose — sur une base neuve, un Collecteur a exactement les douze champs', () => {
  const etat = creerEtat(7);

  // ⚠ LE MONTAGE S'ASSERTE AVANT DE MESURER. Sans cette ligne, « douze cases
  // légales » serait comparé à un douze écrit de mémoire : c'est le terrain qui
  // en porte douze, et c'est ce fait-là qui rend le nombre signifiant.
  assert.equal(baseCourante(etat).champs.cases.length, CHAMPS.total);
  assert.equal(CHAMPS.total, 12);

  const legales = casesPosables(etat, 'collecteur');
  assert.equal(legales.length, baseCourante(etat).champs.cases.length);

  // Et ce sont EXACTEMENT les champs, pas douze cases qui se trouvent être au
  // bon nombre. Égalité d'ensemble, dans les deux sens.
  const cle = (c) => `${c.rangee}:${c.colonne}`;
  assert.deepEqual(
    legales.map(cle).sort(),
    baseCourante(etat).champs.cases.map(cle).sort(),
  );

  // Falsifiable : un bâtiment qui n'est PAS lié au terrain doit en avoir un
  // autre nombre, sinon `casesPosables` rendrait la même chose pour tout le
  // monde et l'égalité ci-dessus ne prouverait rien.
  const centrale = casesPosables(etat, 'centrale');
  assert.notEqual(centrale.length, legales.length);
  // Une centrale ne peut PAS se poser sur un champ — réservé au collecteur.
  for (const c of centrale) {
    assert.ok(!baseCourante(etat).champs.cases.some((f) => f.rangee === c.rangee && f.colonne === c.colonne),
      `centrale proposée sur le champ (${c.rangee},${c.colonne})`);
  }

  // ⚠ SEULE LA BANDE DES BÂTIMENTS EST BALAYÉE. Une case proposée hors de la
  // base serait refusée par `poser`, donc l'écran mentirait en la cerclant.
  for (const c of [...legales, ...centrale]) {
    assert.ok(c.rangee >= GRILLE.bandes.batiments.premiere
      && c.rangee <= GRILLE.bandes.batiments.derniere, `rangée ${c.rangee} hors de la base`);
  }
});

test('pose — une pose déplace les QUATRE grandeurs, pas une seule', () => {
  // ⚠ LE MONTAGE EST CHOISI POUR QUE LES QUATRE BOUGENT, et ce n'est pas un
  // détail. Sur une base NEUVE, poser un Collecteur ne change ni la capacité
  // (il ne stocke pas) ni le niveau moyen (tout est au niveau 1) : un test
  // écrit là-dessus passerait en n'ayant rien mesuré. Il faut une base déjà
  // montée, de niveau moyen supérieur à 1, et un bâtiment de STOCKAGE.
  const etat = baseDeLaMaquette();
  const cible = { rangee: 12, colonne: 1 };
  assert.deepEqual(problemesDeLaPose(etat, 'raffinerie', cible.rangee, cible.colonne), []);
  assert.ok(
    casesPosables(etat, 'raffinerie').some(
      (c) => c.rangee === cible.rangee && c.colonne === cible.colonne,
    ),
    'la case retenue doit être proposée par le balayage',
  );

  const avant = quatreGrandeurs(etat);
  poser(etat, 'raffinerie', cible.rangee, cible.colonne);
  const apres = quatreGrandeurs(etat);

  // CHACUNE des quatre a bougé. Un repeint partiel — qui rafraîchirait les
  // stocks sans les emplacements, ou l'inverse — passerait un test qui n'en
  // regarderait qu'une.
  for (const grandeur of Object.keys(avant)) {
    assert.notEqual(apres[grandeur], avant[grandeur], `${grandeur} n'a pas bougé`);
  }

  // Et dans le sens attendu, valeur par valeur.
  assert.ok(apres.debitQuartz > avant.debitQuartz, 'la raffinerie voisine d\'un collecteur produit');
  assert.ok(apres.capaciteQuartz > avant.capaciteQuartz, 'une raffinerie ajoute du stockage');
  assert.equal(apres.poses, avant.poses + 1);
});

test('pose — poser un niveau 1 FAIT BAISSER le niveau moyen', () => {
  // ⚠ C'EST CONTRE-INTUITIF, ET ÇA SE VERRA À L'ÉCRAN. Le niveau des bâtiments
  // est une MOYENNE : ajouter un bâtiment de niveau 1 à une base qui vaut 4,6
  // la tire vers le bas. L'asserter maintenant évite qu'on le prenne un jour
  // pour un défaut de calcul.
  const etat = baseDeLaMaquette();
  const avant = niveauDesBatiments(baseCourante(etat).disposition);
  assert.ok(avant > 10, `le montage doit partir d'une moyenne > 1,0 — il vaut ${avant}`);

  poser(etat, 'raffinerie', 12, 1);
  const apres = niveauDesBatiments(baseCourante(etat).disposition);

  assert.ok(apres < avant, `la moyenne devrait baisser : ${avant} → ${apres}`);
  assert.equal(avant, 46);
  assert.equal(apres, 43);
  // Ce que le joueur lit, une fois formaté.
  assert.equal(formaterDixiemes(avant), '4,6');
  assert.equal(formaterDixiemes(apres), '4,3');
});

test('pose — les refus reprennent les messages du moteur, mot pour mot', () => {
  const etat = creerEtat(7);
  // Une case sans champ, sous un Collecteur : le moteur a déjà écrit la phrase.
  const horsChamp = casesPosables(etat, 'centrale')[0];
  const problemes = problemesDeLaPose(etat, 'collecteur', horsChamp.rangee, horsChamp.colonne);
  assert.ok(problemes.length > 0, 'le montage doit produire un vrai refus');

  // ⚠ AUCUNE REFORMULATION. Les messages viennent de `sim/disposition.js`, qui
  // est la seule table de règles ; une seconde formulation dans l'écran finirait
  // par dire autre chose que la règle.
  assert.equal(messageDeRefus(problemes), problemes.map((p) => p.message).join(' ; '));
  for (const p of problemes) {
    assert.ok(messageDeRefus(problemes).includes(p.message), `« ${p.message} » perdu en route`);
  }
  assert.match(messageDeRefus(problemes), /doit être posé sur un champ/);

  // Et la case ne bouge pas : demander n'est pas poser.
  assert.equal(baseCourante(etat).disposition.length, 1);
});


/**
 * Les blocs `try { … }` d'un source, rendus en texte.
 *
 * Comptage d'accolades, sur un source déjà décommenté. C'est naïf en théorie —
 * une accolade seule dans une chaîne le décalerait — mais l'erreur va dans le
 * bon sens : elle ferait TOMBER le test, pas passer silencieusement. Un test
 * qui hurle à tort se répare ; un test qui se tait à tort ne se répare jamais.
 */
function blocsTry(source) {
  const blocs = [];
  for (const m of source.matchAll(/(?<![\p{L}\p{N}_])try\s*\{/gu)) {
    let profondeur = 0;
    let i = m.index + m[0].length - 1;
    for (; i < source.length; i++) {
      if (source[i] === '{') profondeur += 1;
      else if (source[i] === '}') {
        profondeur -= 1;
        if (profondeur === 0) break;
      }
    }
    blocs.push(source.slice(m.index, i + 1));
  }
  return blocs;
}

/** Retire commentaires de ligne et de bloc avant un balayage de code. */
function sansCommentaires(texte) {
  return texte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

/**
 * Le même service pour une page : commentaires HTML ET commentaires CSS.
 *
 * ⚠ IL EXISTE PARCE QU'UNE GARDE S'EST FAIT AVOIR PAR SON PROPRE COMMENTAIRE.
 * Le test des marges système cherchait `viewport-fit=cover` dans le HTML
 * produit ; le paragraphe qui EXPLIQUE la règle contient les mêmes mots, si
 * bien que retirer la balise `<meta>` laissait le test vert. Une garde qui lit
 * la prose au lieu du code ne garde rien.
 */
function sansCommentairesHtml(texte) {
  return texte.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

test('pose — jamais de `try` autour de `poser`, dans tout src/ui/', () => {
  // ⚠ LA RÈGLE QUE CETTE GARDE TIENT. `problemesDeLaPose` rend une LISTE, et
  // `poser` LÈVE : la différence est délibérée. Une pose refusée est un fait de
  // JEU — on la montre au joueur. `poser` qui lève est un fait de PROGRAMME —
  // l'écran n'aurait pas dû appeler sans regarder. Entourer `poser` d'un `try`
  // reviendrait à traiter la seconde comme la première, et à masquer le jour où
  // l'écran appellerait vraiment de travers.
  // ⚠ LA GARDE VISE `poserBatiment`, PAS `poser`, ET IL LE FAUT. `src/ui/` porte
  // DEUX fonctions `poser` sans rapport : celle de `sim/state.js`, qui pose un
  // bâtiment, et celle d'`ui/arsenal.js`, qui pose une unité dans une vague.
  // `ui/banc.js` entoure la seconde d'un `try` — et il a RAISON : le contrat de
  // l'Arsenal est de lever sur un dépassement de budget, qui est un fait de
  // jeu. Une garde qui chercherait `poser(` accuserait donc le banc d'une faute
  // qu'il ne commet pas, et pousserait à « réparer » du code juste. D'où le
  // renommage à l'import dans `chantier.js`, qui rend ce balayage exact.
  // ⚠ `poserEffectif` EST ENTRÉ DANS LA GARDE LE 28/08. Il pose une unité de
  // garnison ou d'assaut dans l'état, et il obéit au même contrat que
  // `poserBatiment` : `problemesDeLaPoseDEffectif` rend une liste, lui LÈVE.
  // Son nom est sans ambiguïté — aucun homonyme dans `src/ui/` — donc il
  // entre tel quel, sans renommage à l'import.
  const MOTIF_POSER = /(?<![\p{L}\p{N}_])(poserBatiment|poserEffectif)\s*\(/u;

  const fichiers = readdirSync(join(RACINE, 'src', 'ui'))
    .filter((n) => n.endsWith('.js'))
    .map((n) => join(RACINE, 'src', 'ui', n));
  assert.ok(fichiers.length >= 5, `montage cassé : ${fichiers.length} fichiers balayés`);

  let blocsVus = 0;
  let appelsVus = 0;
  for (const fichier of fichiers) {
    const code = sansCommentaires(readFileSync(fichier, 'utf8'));
    if (MOTIF_POSER.test(code)) appelsVus += 1;
    for (const bloc of blocsTry(code)) {
      blocsVus += 1;
      assert.ok(!MOTIF_POSER.test(bloc), `un try entoure poser() dans ${fichier}`);
    }
  }

  // ⚠ DEUX FALSIFICATIONS DU MONTAGE, sans quoi « aucun bloc ne contient
  // poser » passerait sur un balayage qui ne voit ni bloc ni appel.
  assert.ok(blocsVus > 0, 'aucun bloc try vu : le découpage ne fonctionne pas');
  assert.ok(appelsVus > 0, 'aucun appel à poser vu : la garde ne garde rien');

  // Le découpage attrape bien un vrai appât…
  const appat = 'try { poserBatiment(etat, \'collecteur\', 12, 3); } catch (e) { avis(e.message); }';
  const attrapes = blocsTry(appat);
  assert.equal(attrapes.length, 1);
  assert.ok(MOTIF_POSER.test(attrapes[0]), 'l\'appât n\'est pas attrapé');
  // …et laisse passer un try légitime, qui existe pour de bon dans src/ui/.
  const innocent = 'try { magasin.setItem(CLE, texte); } catch (e) { avis(e.message); }';
  assert.equal(blocsTry(innocent).length, 1);
  assert.ok(!MOTIF_POSER.test(blocsTry(innocent)[0]), 'un try légitime est refusé à tort');
  // Et le motif ne se déclenche ni sur un nom qui CONTIENT « poser », ni sur
  // l'homonyme de l'Arsenal, que le banc a le droit d'entourer d'un try.
  assert.ok(!MOTIF_POSER.test('problemesDeLaPose(etat, id, r, c)'));
  assert.ok(!MOTIF_POSER.test('deposer(etat)'));
  assert.ok(!MOTIF_POSER.test('arsenal = poser(arsenal, { vague, colonne, id });'));

  // Et le renommage à l'import est bien celui de `sim/state.js` : sans ça, la
  // garde surveillerait un nom que plus personne ne lie à la bonne fonction.
  const ecran = readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8');
  assert.match(ecran, /import \{[^}]*poser as poserBatiment[^}]*\} from '\.\.\/sim\/state\.js'/);

  // ⚠ ON DEMANDE AVANT DE POSER. La discipline entière tient à cet ordre : la
  // liste d'abord, la pose ensuite. On vérifie que le fichier qui pose consulte
  // aussi la légalité — sans quoi le `try` interdit plus haut aurait été
  // remplacé par rien du tout, ce qui est pire.
  const propre = sansCommentaires(ecran);
  assert.ok(/(?<![\p{L}\p{N}_])problemesDeLaPose\s*\(/u.test(propre),
    'l\'écran pose sans jamais demander si c\'est légal');
  assert.ok(propre.indexOf('problemesDeLaPose(') < propre.indexOf('poserBatiment('),
    'la première consultation de légalité vient APRÈS la pose');

  // ⚠ ET ON SAUVEGARDE TOUT DE SUITE. La pose est la première action
  // irréversible du jeu ; la perdre parce que l'application a été tuée avant
  // l'enregistrement périodique serait la pire façon de perdre la confiance du
  // joueur. Le rappel existe, et le point d'appel s'en sert.
  assert.ok(/apresPose\s*\(/.test(propre), 'la pose ne déclenche aucune sauvegarde');
  const session = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'session.js'), 'utf8'));
  assert.ok(/apresPose\s*:/.test(session), 'la session ne fournit pas de rappel de sauvegarde');
  assert.ok(/apresPose\s*:\s*\(\)\s*=>\s*sauvegarder\(\)/.test(session),
    'le rappel de la session n\'écrit pas la sauvegarde');
});

// ---------------------------------------------------------------------------
// Le chronomètre — le temps vient de l'horloge, jamais de l'image
// ---------------------------------------------------------------------------

test('session — le chronomètre mesure le temps RÉEL, pas le temps dessiné', () => {
  // ⚠ CE TEST GARDE LE DÉFAUT LE PLUS COÛTEUX DE L'ÉCRAN. La boucle mesurait
  // l'écoulement sur les horodatages de `requestAnimationFrame`, qui sont
  // monotones et ne courent PAS pendant qu'une page est gelée. Deux minutes de
  // gel non signalé produisaient 0,006 unité au lieu de 8 — mesuré le 27/08 sur
  // le HTML livré, et c'est exactement ce qu'Ethan voyait sur son téléphone.
  let heure = 1_000_000;
  const chrono = creerChronometre(() => heure);

  // La première lecture ne rend RIEN : il n'y a pas encore de précédent, et
  // rendre l'instant absolu ferait avancer le jeu de cinquante ans au premier
  // tour.
  assert.equal(chrono.ecoule(), 0, 'la première lecture doit être nulle');

  heure += 250;
  assert.equal(chrono.ecoule(), 250);
  assert.equal(chrono.ecoule(), 0, 'deux lectures d\'affilée : le temps n\'a pas bougé');

  // ⚠ LE GEL. Rien n'est lu pendant deux minutes — aucune image, aucun
  // évènement — puis on revient. L'écart doit être ENTIER, sinon le temps est
  // perdu et le joueur avec.
  heure += 2 * 60 * 1000;
  assert.equal(chrono.ecoule(), 120_000, 'le temps gelé doit être rendu en une fois');

  // Une horloge qui recule ne rend rien, elle ne rend pas un négatif — même
  // règle que `charger` et `avancer`.
  heure -= 5000;
  assert.equal(chrono.ecoule(), 0, 'une horloge qui recule ne doit rien produire');
  heure += 400;
  assert.equal(chrono.ecoule(), 400, 'et le chronomètre repart du bon pied');
});

test('session — la boucle ne lit PAS l\'horodatage d\'image', () => {
  // Le garde-fou de source : `image()` recevait un horodatage et s'en servait
  // pour mesurer le temps. Qu'il cesse de le recevoir est la moitié visible du
  // correctif ; qu'aucun `requestAnimationFrame` ne serve de chronomètre est
  // l'autre.
  const source = readFileSync(join(RACINE, 'src', 'ui', 'session.js'), 'utf8');
  assert.ok(source.includes('creerChronometre'), 'le chronomètre n\'est plus utilisé');
  assert.ok(
    /function image\(\)/.test(source),
    '`image` reprend un paramètre : l\'horodatage d\'image est revenu mesurer le temps',
  );
  // Falsifiable : le motif doit attraper la forme fautive.
  assert.ok(!/function image\(\)/.test('function image(horodatageMs) {'), 'le motif n\'attrape rien');
});


// ---------------------------------------------------------------------------
// Les actions — lot ÉCRAN-ACTIONS
// ---------------------------------------------------------------------------

test('actions — les quatre boutons sont branchés sur le MOTEUR, pas sur une copie', () => {
  // ⚠ ÉGALITÉ DE RÉFÉRENCE, PAS DE COMPORTEMENT. C'est ce qui distingue « la
  // table appelle la fonction du moteur » de « la table appelle quelque chose
  // qui lui ressemble ». Une réimplémentation dans l'écran — même juste le jour
  // où elle est écrite — dériverait de `sim/state.js` à la première règle qui
  // change, et personne ne le verrait.
  assert.equal(ACTIONS.ameliorer.problemes, moteurEtat.problemesDeLAmelioration);
  assert.equal(ACTIONS.ameliorer.agir, moteurEtat.ameliorer);
  assert.equal(ACTIONS.demolir.problemes, moteurEtat.problemesDeLaDemolition);
  assert.equal(ACTIONS.demolir.agir, moteurEtat.demolir);
  assert.equal(ACTIONS.deplacer.problemes, moteurEtat.problemesDuDeplacement);
  assert.equal(ACTIONS.deplacer.agir, moteurEtat.deplacer);

  // ⚠ `cible` DIT QUE L'ACTION A BESOIN D'UNE DESTINATION, et une seule en a.
  // C'est la table qui le dit, pas un `if (nom === 'deplacer')` dans l'écran :
  // un cas particulier écrit à la main serait le premier à diverger.
  const aCible = Object.entries(ACTIONS).filter(([, a]) => a.cible === true);
  assert.deepEqual(aCible.map(([nom]) => nom), ['deplacer']);
  const ecranSource = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  assert.ok(!/===\s*'deplacer'/.test(ecranSource),
    'l\'écran traite « deplacer » comme un cas particulier écrit à la main');
  assert.match(ecranSource, /ACTIONS\[actionArmee\]\.cible === true/,
    'l\'écran ne lit pas la table pour reconnaître une action à cible');

  // Chaque action nomme un bouton, et les quatre boutons sont distincts.
  const boutons = Object.values(ACTIONS).map((a) => a.bouton);
  assert.equal(new Set(boutons).size, boutons.length, 'deux actions visent le même bouton');
  for (const [nom, action] of Object.entries(ACTIONS)) {
    assert.match(action.bouton, /^chantier-/, `${nom} vise un bouton hors de l'écran`);
    assert.equal(typeof action.libelle, 'string');
  }

  // Falsifiable : le montage doit voir les DEUX formes d'action — celles qui
  // ont un moteur et celle qui n'en a pas. Sinon la distinction ne prouve rien.
  const avecMoteur = Object.values(ACTIONS).filter((a) => a.agir !== undefined);
  const sansMoteur = Object.values(ACTIONS).filter((a) => a.agir === undefined);
  assert.equal(avecMoteur.length, 3);
  assert.equal(sansMoteur.length, 1);
});

test('actions — Réparer n\'a pas de moteur, et ce n\'est pas un oubli', () => {
  // ⚠ CE TEST EST FAIT POUR TOMBER UN JOUR, ET C'EST SON INTÉRÊT. La phrase de
  // refus de Réparer est la SEULE écrite dans l'interface — toutes les autres
  // viennent de `sim/disposition.js` ou de `sim/state.js`. Elle n'est légitime
  // que tant qu'aucune fonction ne répare. Le jour où le moteur en gagne une,
  // ce test rougit et dit quoi brancher, au lieu de laisser l'écran répéter
  // « rien n'est endommagé » devant des bâtiments abîmés.
  for (const nom of ['reparer', 'problemesDeLaReparation', 'problemesDeLaReparation']) {
    assert.ok(!(nom in moteurEtat), `sim/state.js exporte « ${nom} » : brancher Réparer dessus`);
  }
  assert.equal(ACTIONS.reparer.problemes, undefined);
  assert.equal(ACTIONS.reparer.agir, undefined);

  // La phrase dit ce qui est vrai, et ne promet rien.
  // ⚠ LE MESSAGE NOMME CE DONT IL PARLE DEPUIS LE 29/08. Il disait « aucun
  // bâtiment n'est endommagé » en dur, y compris sur la bande de garnison et,
  // à ce lot, sur l'écran Offense : le mot vient maintenant du terrain.
  const constat = 'aucun bâtiment n\'est endommagé';
  assert.equal(typeof messagePasDeReparation(constat), 'string');
  assert.ok(messagePasDeReparation(constat).length > 20,
    'un refus doit expliquer, pas seulement refuser');
  // ⚠⚠ LE CONSTAT ENTIER, ET IL A FALLU DEUX ESSAIS. La première écriture ne
  // prenait que le nom et préfixait « aucun » : « aucun unité ». La deuxième
  // prenait le sujet accordé et gardait le verbe : « aucune unité n'est
  // endommagé ». Les deux se sont vues À L'ESSAI, pas à la relecture — et ce
  // test-ci les avait laissées passer avec un `aucune?` complaisant. Il exige
  // maintenant que la phrase soit REPRISE, pas recomposée.
  const feminin = 'aucune unité n\'est endommagée';
  assert.ok(messagePasDeReparation(feminin).startsWith(`${feminin} `),
    'le message recompose le constat au lieu de le reprendre');
  assert.ok(!messagePasDeReparation(feminin).includes('bâtiment'),
    'le message parle encore de bâtiments alors qu\'on lui parle d\'unités');
  // Et chaque terrain porte SON constat, accordé de bout en bout.
  for (const terrain of Object.values(TERRAINS)) {
    assert.match(terrain.quoi, /^aucun(e?) [^ ]+ n'est endommagé\1$/,
      `« ${terrain.quoi} » n'est pas un constat accordé`);
    assert.ok(terrain.pourQui.length > 2, 'le terrain ne dit pas pour qui il parle');
  }

  // Falsifiable dans l'autre sens : le montage doit voir de VRAIS exports, sinon
  // « aucun nom de réparation » passerait sur un module vide.
  assert.ok('ameliorer' in moteurEtat && 'demolir' in moteurEtat,
    'le montage ne lit pas les exports de sim/state.js');

  // Le toast a une durée bornée : ni instantané, ni permanent.
  assert.ok(DUREE_TOAST_MS >= 1500 && DUREE_TOAST_MS <= 10_000, `${DUREE_TOAST_MS} ms`);
});

test('actions — jamais de `try` autour d\'`ameliorer` ni de `demolir`', () => {
  // Même discipline que pour `poser`, et pour la même raison : `problemes…`
  // rend une LISTE (fait de JEU, on la montre), `ameliorer` et `demolir` LÈVENT
  // (fait de PROGRAMME). Rattraper la levée confondrait les deux.
  // ⚠ LES DEUX NOMS DIRECTS NE SUFFISENT PAS, et c'est la falsification qui l'a
  // montré : l'écran n'appelle pas `ameliorer(...)`, il appelle
  // `action.agir(...)` par la table `ACTIONS`. Une garde qui ne cherchait que
  // les noms directs laissait passer un `try` autour de la RÉPARTITION — la
  // seule forme sous laquelle la faute se commettrait réellement ici. On garde
  // donc les deux : les noms, et le point d'appel indirect.
  const MOTIFS = [
    { nom: 'ameliorer', motif: /(?<![\p{L}\p{N}_])ameliorer\s*\(/u },
    { nom: 'demolir', motif: /(?<![\p{L}\p{N}_])demolir\s*\(/u },
    { nom: 'action.agir', motif: /\.\s*agir\s*\(/u },
    { nom: 'action.problemes', motif: /\.\s*problemes\s*\(/u },
    // ⚠ AJOUTÉS AU LOT POSE-ET-DÉPLACEMENT. `deplacer` lève exactement comme
    // `ameliorer` et `demolir` ; l'oublier ici aurait laissé passer un `try`
    // autour du seul geste neuf du lot.
    { nom: 'deplacer', motif: /(?<![\p{L}\p{N}_])deplacer\s*\(/u },
    { nom: 'problemesDuDeplacement', motif: /(?<![\p{L}\p{N}_])problemesDuDeplacement\s*\(/u },
  ];
  const fichiers = readdirSync(join(RACINE, 'src', 'ui'))
    .filter((n) => n.endsWith('.js'))
    .map((n) => join(RACINE, 'src', 'ui', n));

  let blocsVus = 0;
  for (const fichier of fichiers) {
    const code = sansCommentaires(readFileSync(fichier, 'utf8'));
    for (const bloc of blocsTry(code)) {
      blocsVus += 1;
      for (const { nom, motif } of MOTIFS) {
        assert.ok(!motif.test(bloc), `un try entoure ${nom}() dans ${fichier}`);
      }
    }
  }
  assert.ok(blocsVus > 0, 'aucun bloc try vu : le découpage ne fonctionne pas');

  // ⚠ ET ON DEMANDE AVANT D'AGIR. Retirer le `try` sans consulter la légalité
  // serait pire que le `try` : l'écran lèverait pour de bon. On vérifie que
  // l'écran passe par `problemes` avant `agir`, dans cet ordre.
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  assert.ok(/action\.problemes\s*\(/.test(ecran), 'l\'écran agit sans demander la légalité');
  assert.ok(/action\.agir\s*\(/.test(ecran), 'l\'écran ne branche aucune action');
  assert.ok(ecran.indexOf('action.problemes(') < ecran.indexOf('action.agir('),
    'la légalité est consultée APRÈS l\'action');

  // Falsifiable : les motifs attrapent un vrai appât, et laissent passer les
  // noms qui les contiennent.
  // Deux appâts : l'appel DIRECT et l'appel par la table. Le second est celui
  // qui passait avant que la falsification ne le débusque.
  for (const appat of [
    'try { ameliorer(etat, i); } catch (e) { toast(e.message); }',
    'try { action.agir(etatCourant, index); } catch (e) { toast(e.message); }',
    'try { deplacer(etat, i, r, c); } catch (e) { toast(e.message); }',
  ]) {
    const bloc = blocsTry(appat);
    assert.equal(bloc.length, 1, appat);
    assert.ok(MOTIFS.some((m) => m.motif.test(bloc[0])), `appât non attrapé : ${appat}`);
  }
  // Et les noms qui CONTIENNENT ceux-là passent, eux.
  assert.ok(!MOTIFS[0].motif.test('problemesDeLAmelioration(etat, i)'));
  assert.ok(!MOTIFS[1].motif.test('problemesDeLaDemolition(etat, i)'));
});

test('actions — les cases distinguées suivent la TABLE, pas un nom écrit dans l\'écran', () => {
  // ⚠ SEUL LE COLLECTEUR EST DISTINGUÉ (27/08), et la raison n'est pas un choix
  // d'interface : c'est le seul bâtiment pour qui le terrain décide. La règle
  // vit dans `CHAMPS.posableDessus`, et l'écran doit la LIRE. Écrire
  // `=== 'collecteur'` en dur marcherait aujourd'hui et mentirait le jour où un
  // second bâtiment gagnerait le droit de se poser sur un champ.
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  assert.ok(/CHAMPS\.posableDessus/.test(ecran),
    'l\'écran ne lit pas CHAMPS.posableDessus pour décider quoi cercler');
  assert.ok(!/['\"]collecteur['\"]/.test(ecran),
    'l\'écran nomme « collecteur » en dur au lieu de lire la table');

  // Et la table dit bien ce que l'écran en attend : un seul bâtiment concerné,
  // sinon « seul le collecteur » cesserait d'être vrai sans que l'écran change.
  assert.equal(CHAMPS.posableDessus.length, 1);

  // Falsifiable : le motif d'un nom en dur doit attraper un vrai appât.
  assert.ok(/['\"]collecteur['\"]/.test("if (posableChoisi === 'collecteur') return;"));
});

test('actions — le compteur d\'emplacements est REVENU à l\'écran, et le calcul n\'a pas bougé', () => {
  // ⚠ IL AVAIT ÉTÉ RETIRÉ AU LOT PRÉCÉDENT, ET C'ÉTAIT UNE ERREUR. La barre de
  // gauche est partie le 27/08 en emportant le compteur, au motif que la
  // saturation se dirait au toucher d'une vignette. Ethan a rapporté le 28/08
  // « il n'y a plus la limite de bâtiment » : un plafond qu'on ne découvre
  // qu'en le heurtant n'est pas un plafond, c'est une surprise.
  //
  // Le toast RESTE — il dit la même grandeur au moment où elle bloque un geste
  // — et le compteur revient dire ce dont on dispose. Les deux, pas l'un ou
  // l'autre.
  const neuve = creerEtat(11);
  const { poses, ouverts } = resumeDeLaBase(neuve).emplacements;
  assert.equal(poses, 1, 'une base neuve porte son seul Chantier');
  assert.equal(ouverts, emplacementsDuNiveau(1));
  assert.ok(ouverts > poses, 'une base neuve doit avoir un emplacement libre');

  // Et l'écran lit bien cette grandeur-là — pour prévenir de la saturation au
  // toucher d'une vignette, ET pour l'afficher en permanence.
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  assert.ok(/poses\s*>=\s*ouverts/.test(ecran),
    'l\'écran ne compare plus les emplacements posés aux emplacements ouverts');
  // ⚠ ET C'EST UNE LIGNE DE MODE, PAS UN TOAST — corrigé à la relecture du
  // 28/08. La saturation dure exactement aussi longtemps que le mode de pose ;
  // un toast s'effaçait au bout de quatre secondes et laissait reparaître
  // « touchez une case libre » alors qu'il n'y en a aucune.
  // ⚠ LE PLAFOND EST PASSÉ DANS UNE FONCTION AU LOT GARNISON-ET-ARMÉE, parce
  // qu'il y en a DEUX depuis que la bande Défense est éditable, et sans
  // rapport : le Chantier borne le NOMBRE de bâtiments par ses emplacements, le
  // QG borne les POINTS d'armée par son budget. Dire « c'est plein » sans dire
  // de quoi enverrait le joueur améliorer le mauvais bâtiment. Ce que la garde
  // tient n'a pas changé : la saturation s'écrit sur la ligne de MODE, qui
  // dure, et non dans un toast qui s'efface au bout de quatre secondes en
  // laissant reparaître « touchez une case libre ».
  assert.match(ecran, /function messageDuPlafond\([\s\S]{0,900}poses >= ouverts/,
    'le plafond des emplacements n\'est plus celui que l\'écran annonce');
  assert.match(ecran, /ligneDeMode\(messageDuPlafond\(/,
    'la saturation n\'est plus dite par une ligne qui dure');
  assert.ok(/emplacementsPoses\.textContent\s*=/.test(ecran)
    && /emplacementsOuverts\.textContent\s*=/.test(ecran),
    'le compteur d\'emplacements n\'est plus écrit à l\'écran');
  assert.ok(/'ressource emplacements'/.test(ecran),
    'le compteur n\'est plus rangé avec les ressources');
  // La feuille le peint : une classe sans règle serait un compteur invisible,
  // qui est exactement le défaut que la garde des classes vient d'attraper.
  // ⚠ LA BORNE N'EST PAS DÉCORATIVE : sans elle, renommer la règle en
  // `.ressource.emplacementsX` laissait le test vert, puisque le motif se
  // contentait du préfixe. Mesuré par falsification le 28/08.
  const feuille = sansCommentairesHtml(readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8'));
  assert.match(feuille, /\.ressource\.emplacements(?![A-Za-z0-9_-])/,
    'le compteur d\'emplacements n\'a aucun style');
  assert.doesNotMatch('.ressource.emplacementsX { }',
    /\.ressource\.emplacements(?![A-Za-z0-9_-])/);

  // Falsifiable : le montage doit voir une base qui SATURE, sinon la
  // comparaison ne prouve rien. On remplit jusqu'au plafond du niveau 1.
  //
  // ⚠ IL FAUT DEUX POSES DEPUIS LE 29/08, PAS UNE. La table d'emplacements
  // dictée par Ethan ouvre trois emplacements au niveau 1 au lieu de deux. On
  // remplit donc jusqu'à ce que la fonction dise plein, plutôt que de compter
  // les poses à la main : la prochaine table ne fera pas retomber ce test.
  const pleine = creerEtat(11);
  const champs = baseCourante(pleine).champs.cases;
  let pose = 0;
  while (resumeDeLaBase(pleine).emplacements.poses
    < resumeDeLaBase(pleine).emplacements.ouverts) {
    poser(pleine, 'collecteur', champs[pose].rangee, champs[pose].colonne);
    pose += 1;
    assert.ok(pose <= champs.length, 'le montage ne parvient pas à remplir la base');
  }
  assert.ok(pose > 0, 'une base neuve était déjà pleine : le montage ne mesure rien');
  const apres = resumeDeLaBase(pleine).emplacements;
  assert.equal(apres.poses, apres.ouverts, 'la base devrait être pleine après les poses');
});

// ---------------------------------------------------------------------------
// Lot PANNEAU-ET-MARGES — l'essai appareil du 28/08
// ---------------------------------------------------------------------------

test('marges — les barres système d\'Android ne mordent plus sur l\'écran', () => {
  // ⚠ LE JEU ÉTAIT INJOUABLE SUR APPAREIL, et la cause était une moitié de
  // mécanisme. `viewport-fit=cover` demande explicitement à dessiner sous les
  // barres système ; il était posé depuis le premier jour, et aucun
  // `env(safe-area-inset-*)` ne rendait la place. L'enveloppe vise le SDK 35,
  // où l'affichage bord à bord est imposé : la rangée d'onglets passait donc
  // sous l'horloge et la palette sous les trois boutons de navigation.
  // ⚠ ON LIT LE CODE, PAS LA PROSE. La première version de ce test cherchait
  // `viewport-fit=cover` dans le HTML brut : le paragraphe qui explique la
  // règle contient les mêmes mots, et retirer la balise `<meta>` laissait donc
  // le test VERT. La falsification l'a débusqué. Commentaires ôtés, la garde
  // ne peut plus se contenter de ce qu'on a écrit à son sujet.
  const html = sansCommentairesHtml(readFileSync(join(RACINE, 'dist', 'index.html'), 'utf8'));

  assert.match(html, /<meta[^>]*name="viewport"[^>]*viewport-fit\s*=\s*cover/,
    'la balise viewport ne demande plus le bord à bord');
  // Et les marges sont RENDUES, c'est-à-dire écrites dans une déclaration de
  // remplissage — pas seulement citées quelque part.
  for (const cote of ['top', 'bottom', 'left', 'right']) {
    assert.match(html, new RegExp(`padding-${cote}:\\s*env\\(safe-area-inset-${cote}`),
      `le HTML ne rend pas la marge système ${cote}`);
  }

  // ⚠ LES DEUX VONT ENSEMBLE, ET C'EST TOUT LE PIÈGE. `viewport-fit=cover` seul
  // est exactement le défaut qu'on répare ; les `env()` seuls seraient inertes,
  // car sans lui les quatre valent zéro. Le test l'écrit pour qu'on ne puisse
  // pas retirer l'un en croyant garder l'autre.
  // Falsifiable : les motifs attrapent bien ce qu'ils cherchent, et rien
  // d'autre. Sans ça, un test qui passe ne prouverait que sa propre existence.
  assert.doesNotMatch('<meta name="viewport" content="width=device-width">',
    /<meta[^>]*name="viewport"[^>]*viewport-fit\s*=\s*cover/);
  assert.doesNotMatch('padding-top: 0px;', /padding-top:\s*env\(safe-area-inset-top/);
  // Et le décommenteur fait bien son travail : une prose qui cite la règle ne
  // la satisfait plus.
  assert.equal(
    sansCommentairesHtml('<!-- viewport-fit=cover expliqué ici --><p>x</p>').includes('viewport-fit'),
    false,
  );
  assert.equal(sansCommentairesHtml('/* env(safe-area-inset-top) */a{}').includes('safe-area'), false);
});

test('écran — toute classe que l\'écran bascule existe dans la feuille de style', () => {
  // ⚠ CETTE GARDE EXISTE À CAUSE D'UN DÉFAUT LIVRÉ. Le lot ÉCRAN-ACTIONS posait
  // `classList.toggle('arme', …)` sur les trois boutons — le JavaScript était
  // juste — et aucune règle CSS ne peignait `arme` : armer une action ne
  // changeait STRICTEMENT rien à l'écran, et le modèle « armer puis toucher »
  // était donc invisible. Ethan l'a relevé sur appareil le 28/08.
  //
  // Aucun test ne pouvait le voir : une classe sans règle n'est pas du JS faux,
  // c'est du CSS absent, et le dépôt n'a pas de navigateur. Ce qu'on PEUT faire
  // sans navigateur, c'est confronter les deux sources — les classes que le
  // code bascule, et les sélecteurs que la feuille déclare.
  // Décommentée, pour la même raison que le test des marges : un commentaire
  // qui NOMME une classe ne la peint pas.
  const feuille = sansCommentairesHtml(readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8'));

  // Seuls les LITTÉRAUX sont extraits : `classList.add(champ.ressource)` passe
  // par une variable, et la feuille ne peut pas être confrontée à ce qu'on ne
  // connaît qu'à l'exécution.
  const MOTIF_CLASSE = /classList\.(?:toggle|add)\(\s*'([A-Za-zÀ-ÿ0-9_-]+)'/g;
  const basculees = new Set();
  for (const nom of readdirSync(join(RACINE, 'src', 'ui')).filter((n) => n.endsWith('.js'))) {
    const code = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', nom), 'utf8'));
    for (const m of code.matchAll(MOTIF_CLASSE)) basculees.add(m[1]);
  }
  assert.ok(basculees.size >= 8,
    `seulement ${basculees.size} classes basculées : l'extraction ne fonctionne pas`);
  assert.ok(basculees.has('arme'), 'la classe du défaut d\'origine n\'est plus basculée');

  for (const classe of basculees) {
    assert.ok(new RegExp(`\\.${classe}(?![a-zA-Z0-9_-])`).test(feuille),
      `la classe « ${classe} » est basculée par le code et n'a aucune règle dans la feuille`);
  }

  // Falsifiable, dans les deux sens : le motif d'extraction attrape un appât, et
  // le motif de sélecteur refuse une classe absente sans se laisser abuser par
  // un nom qui la contient.
  const appat = "bouton.classList.toggle('sansAucuneRegle', vrai);";
  assert.deepEqual([...appat.matchAll(MOTIF_CLASSE)].map((m) => m[1]), ['sansAucuneRegle']);
  assert.ok(!new RegExp('\\.absente(?![a-zA-Z0-9_-])').test(feuille));
  assert.ok(!new RegExp('\\.arm(?![a-zA-Z0-9_-])').test('.arme { color: #F5F3E8; }'),
    'un préfixe de classe est accepté à tort');
});

test('avis — trois registres, une seule ligne, et la priorité est écrite', () => {
  // ⚠ ILS ÉCRIVAIENT AU MÊME ENDROIT SANS SE CONNAÎTRE. Avant ce lot, `armer()`
  // posait `avis('')` : armer une action effaçait donc au passage une alerte de
  // sauvegarde que personne n'avait lue. Et le mode n'écrivait RIEN, ce qui
  // était le défaut qu'Ethan a relevé.
  assert.deepEqual(ligneAAfficher({}), { texte: '', ton: null });
  assert.deepEqual(ligneAAfficher({ mode: 'M' }), { texte: 'M', ton: 'mode' });
  assert.deepEqual(ligneAAfficher({ toast: 'T' }), { texte: 'T', ton: 'alerte' });
  assert.deepEqual(ligneAAfficher({ session: 'S' }), { texte: 'S', ton: 'alerte' });

  // ⚠ LE TOAST PASSE DEVANT LE MODE. « il manque 8 de quartz » répond au doigt
  // qui vient de se poser ; « mode Améliorer » est un rappel qu'on peut relire
  // quatre secondes plus tard. L'inverse ferait disparaître le seul message qui
  // explique le refus.
  assert.deepEqual(ligneAAfficher({ toast: 'T', mode: 'M' }), { texte: 'T', ton: 'alerte' });
  // Et la session passe devant tout : elle décrit un état qui dure.
  assert.deepEqual(ligneAAfficher({ session: 'S', toast: 'T', mode: 'M' }),
    { texte: 'S', ton: 'alerte' });

  // Les trois messages de mode existent, un par action, et ils nomment l'action.
  assert.deepEqual(Object.keys(MESSAGES_MODE).sort(), Object.keys(ACTIONS).sort());
  for (const [nom, texte] of Object.entries(MESSAGES_MODE)) {
    assert.ok(texte.length > 20, `le mode ${nom} ne dit rien d'utile`);
    assert.ok(texte.includes('Retouchez'), `le mode ${nom} ne dit pas comment en sortir`);
  }
  assert.ok(messageDePose('Collecteur').includes('Collecteur'));

  // Et l'écran POSE bien ces lignes-là : la fonction pure ne prouve rien si
  // personne ne l'appelle.
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  assert.ok(/ligneDeMode\([^;]*MESSAGES_MODE\[/.test(ecran),
    'armer() n\'écrit pas la ligne de mode');
  assert.ok(/ligneDeMode\([^;]*messageDePose\(/.test(ecran),
    'choisir un posable n\'écrit pas la ligne de mode');
  // ⚠ ET `avis('')` NE DOIT PLUS SERVIR À EFFACER UN MODE. Le registre de la
  // session ne se vide que par la session.
  assert.ok(!/armer\([\s\S]{0,400}?avis\(''\)/.test(ecran),
    'armer() efface encore le registre de la session');
});

test('aperçu — le « si j\'améliorais » se calcule avec les MÊMES fonctions que le présent', () => {
  // ⚠ C'EST LA RÈGLE QUI TIENT TOUT LE PANNEAU. La projection se fait en
  // fabriquant la disposition CANDIDATE et en la soumettant aux fonctions du
  // moteur — jamais par une formule de projection écrite dans l'écran, qui
  // serait une seconde lecture des règles et divergerait au premier arbitrage.
  //
  // La preuve : l'« après » d'un bâtiment de niveau n doit être EXACTEMENT
  // l'« avant » du même bâtiment déjà monté au niveau n+1.
  const etat = creerEtat(12345);
  moteurEtat.ameliorer(etat, 0);
  const champ = baseCourante(etat).champs.cases.find((c) => c.ressource === 'quartz');
  poser(etat, 'collecteur', champ.rangee, champ.colonne);

  const avant = apercuDuBatiment(etat, 1);
  // Le montage doit MESURER quelque chose : un collecteur qui ne produit rien
  // rendrait toutes les égalités vraies sur du code cassé.
  assert.ok(avant.propreMilli > 0, 'le collecteur du montage ne produit rien');
  assert.ok(avant.propreViseMilli > avant.propreMilli, 'l\'amélioration n\'apporte rien');

  moteurEtat.ameliorer(etat, 1);
  const apres = apercuDuBatiment(etat, 1);
  assert.equal(apres.niveau, avant.niveauVise);
  assert.equal(apres.propreMilli, avant.propreViseMilli);
  assert.deepEqual(
    apres.production.map((r) => [r.cle, r.avantMilli]),
    avant.production.map((r) => [r.cle, r.apresMilli]),
    'la production projetée n\'est pas celle qu\'on obtient',
  );
  assert.deepEqual(
    apres.capacites.map((r) => [r.cle, r.avantMilli]),
    avant.capacites.map((r) => [r.cle, r.apresMilli]),
    'la capacité projetée n\'est pas celle qu\'on obtient',
  );
});

test('aperçu — au plafond, tout le volet « après » vaut null, il ne vaut pas zéro', () => {
  // `coutDeMontee` et `capaciteDuNiveau` LÈVENT au-delà du plafond. Rendre des
  // zéros ferait afficher « 0 » là où il faut lire « il n'y a pas de niveau
  // suivant » — et un « améliorer pour 0 » se lirait comme gratuit.
  const etat = creerEtat(3);
  baseCourante(etat).disposition[0].niveau = GEOGRAPHIE.niveauPlafond;
  const apercu = apercuDuBatiment(etat, 0);
  assert.equal(apercu.auPlafond, true);
  assert.equal(apercu.niveauVise, null);
  assert.equal(apercu.cout, null);
  for (const r of apercu.capacites) assert.equal(r.apresMilli, null);
  assert.equal(lignesDuPanneau(apercu).bouton.libelle, 'Niveau maximum');
  assert.equal(lignesDuPanneau(apercu).bouton.possible, false);

  // Falsifiable : un niveau sous le plafond, lui, porte bien un après.
  const dessous = creerEtat(3);
  baseCourante(dessous).disposition[0].niveau = GEOGRAPHIE.niveauPlafond - 1;
  assert.equal(apercuDuBatiment(dessous, 0).auPlafond, false);
  assert.notEqual(apercuDuBatiment(dessous, 0).cout, null);
});

test('panneau — sur une base neuve, il dit ce qui débloque la partie', () => {
  // ⚠ C'EST LE POINT DE TOUT LE LOT. Une base neuve a UN emplacement libre et
  // pour tout stockage la poche du Chantier — 50 unités. Un Collecteur la
  // remplit en cinq minutes, puis plus rien ne bouge, jamais : Ethan a rapporté
  // le 28/08 « aucun bâtiment ne produit de ressources » et « pas de calcul
  // hors ligne », qui sont le même plafond vu deux fois.
  //
  // La sortie EXISTE — améliorer le Chantier ouvre deux emplacements de plus et
  // l'amorce la paie — mais rien à l'écran ne la montrait. Le panneau la dit.
  const neuve = creerEtat(4242);
  const vue = lignesDuPanneau(apercuDuBatiment(neuve, 0));

  const emplacements = vue.sections.find((s) => s.titre === 'Emplacements ouverts');
  assert.ok(emplacements !== undefined, 'le panneau du Chantier ne dit pas les emplacements');
  assert.equal(emplacements.lignes[0].avant, formaterEntier(emplacementsDuNiveau(1)));
  assert.equal(emplacements.lignes[0].apres, formaterEntier(emplacementsDuNiveau(2)));

  const stockage = vue.sections.find((s) => s.titre === 'Stockage de la base');
  assert.ok(stockage !== undefined, 'le panneau ne dit pas le stockage');
  assert.ok(stockage.lignes.every((l) => l.apres !== null));

  // Et l'amorce paie l'amélioration : sans ça la sortie serait dite mais fermée.
  assert.deepEqual(apercuDuBatiment(neuve, 0).problemes, [],
    'l\'amorce ne couvre plus l\'amélioration du Chantier');
  assert.equal(vue.bouton.possible, true);
  assert.equal(vue.bouton.note, formaterCout(coutDeMontee('chantierDeConstruction', 2)));

  // ⚠ FALSIFIABLE, ET C'EST ICI QUE ÇA COMPTE. Le montage doit voir la base
  // ÉTROITE avant de dire qu'elle s'élargit : on mesure combien d'emplacements
  // sont libres, et qu'un stock saturé le reste après une nuit entière.
  //
  // ⚠ DEUX DEPUIS LE 29/08, ET LE MUR RESTE LE MÊME. La table dictée par Ethan
  // donne un emplacement libre de plus au niveau 1 ; ce que ce test mesure —
  // un stock qui sature en cinq minutes et ne bouge plus — n'en dépend pas.
  assert.equal(emplacementsDuNiveau(1) - baseCourante(neuve).disposition.length, 2,
    'une base neuve n\'a plus exactement deux emplacements libres');
  const bloquee = creerEtat(4242);
  const champ = baseCourante(bloquee).champs.cases.find((c) => c.ressource === 'quartz');
  poser(bloquee, 'collecteur', champ.rangee, champ.colonne);
  const plafond = capacitesMilli(baseCourante(bloquee).disposition).quartz;
  assert.ok(debitsMilliParHeure(baseCourante(bloquee).disposition, baseCourante(bloquee).champs)[1].quartz > 0,
    'le collecteur du montage ne produit rien : le blocage ne serait pas mesuré');
  for (let i = 0; i < TICKS_PAR_HEURE; i++) tickJeu(bloquee);
  assert.equal(baseCourante(bloquee).economie.ressources.quartz, plafond,
    'le montage ne sature pas : il ne mesure pas le blocage');
  const veille = baseCourante(bloquee).economie.ressources.quartz;
  moteurEtat.rattraperJeu(bloquee, TICKS_PAR_HEURE * 12);
  assert.equal(baseCourante(bloquee).economie.ressources.quartz, veille,
    'douze heures hors ligne devraient ne rien ajouter à un stock saturé');

  // Et le remède est dans le panneau : améliorer le Chantier LÈVE ce plafond.
  const apres = baseCourante(bloquee).disposition.map(
    (b, i) => (i === 0 ? { ...b, niveau: 2 } : b),
  );
  assert.ok(capacitesMilli(apres).quartz > plafond,
    'améliorer le Chantier ne lève pas le plafond : le panneau annoncerait une sortie qui n\'en est pas une');
});

test('panneau — le coût annoncé est celui que le moteur débite, à l\'unité près', () => {
  // ⚠ AUCUNE RÉPARTITION N'EST INVENTÉE. Le lot ÉCRAN-ACTIONS ne pouvait
  // annoncer qu'un nombre nu, faute de savoir dans quelle ressource il se payait.
  // `coutDeMontee` le dit, et c'est exactement ce qu'`ameliorer` prélève : le
  // panneau lit la table au lieu de supposer.
  const etat = creerEtat(77);
  const cout = coutDeMontee('chantierDeConstruction', 2);
  const note = lignesDuPanneau(apercuDuBatiment(etat, 0)).bouton.note;
  assert.equal(note, formaterCout(cout));

  const avant = { ...baseCourante(etat).economie.ressources };
  moteurEtat.ameliorer(etat, 0);
  for (const r of RESSOURCES) {
    assert.equal((avant[r] - baseCourante(etat).economie.ressources[r]) / 1000, cout[r],
      `le débit réel en ${r} ne suit pas le coût annoncé`);
  }

  // ⚠ SEULES LES RESSOURCES NON NULLES SONT NOMMÉES, et le fait mérite d'être
  // mesuré : la scorie ne coûte RIEN, nulle part, à aucun palier. Écrire
  // « 8 quartz · 0 scorie » enverrait le joueur chercher une dépense qui
  // n'existe pas.
  assert.equal(cout.scorie, 0);
  assert.ok(!note.includes('scorie'), 'le panneau nomme une ressource qui ne coûte rien');
  assert.equal(formaterCout({ quartz: 8, scorie: 0, electricite: 0 }), '8 quartz');
  assert.equal(formaterCout({ quartz: 0, scorie: 0, electricite: 0 }), 'rien');
  // Falsifiable : une ressource non nulle DOIT être nommée.
  assert.equal(formaterCout({ quartz: 10, scorie: 0, electricite: 3 }), '10 quartz · 3 élec.');
});

test('panneau — la production détaillée explique le chiffre qu\'elle affiche', () => {
  // Un collecteur à 312/h ne dit pas pourquoi il ne fait pas 240. Le détail —
  // production propre, puis apport de chaque type de voisin — est ce qui
  // enseigne le voisinage, et c'est la seule place du jeu qui le fasse.
  const { disposition, champs } = baseCourante(baseDeLaMaquette());
  const etat = {
    bases: [{ disposition, champs, economie: creerEtatEconomie(disposition) }],
    baseCourante: 0,
  };
  // Le collecteur de (13,2) touche une raffinerie ? Sinon le montage ne mesure
  // rien : on prend celui qui a le plus de voisins qualifiants.
  const index = disposition.findIndex((b, i) => b.id === 'collecteur'
    && apercuDuBatiment(etat, i).voisins.some((v) => v.compte > 0));
  assert.notEqual(index, -1, 'aucun collecteur voisiné : le montage ne mesure rien');

  const apercu = apercuDuBatiment(etat, index);
  const vue = lignesDuPanneau(apercu);
  const production = vue.sections.find((s) => s.titre === 'Production par heure');
  assert.ok(production !== undefined);

  // Le total annoncé est la somme du propre et des apports — c'est ce que le
  // détail promet, et c'est vérifiable sans écran.
  const totalMilli = apercu.production.reduce((s, r) => s + r.avantMilli, 0);
  const detailMilli = apercu.propreMilli
    + apercu.voisins.reduce((s, v) => s + v.apportMilli, 0);
  assert.equal(totalMilli, detailMilli, 'le détail ne rend pas le total');

  // ⚠ L'APPORT UNITAIRE S'AFFICHE MÊME À ZÉRO VOISIN : c'est ce qui apprend au
  // joueur ce qu'il gagnerait à en poser un. Il ne se déduit donc PAS d'une
  // division de l'apport total, qui vaudrait NaN.
  for (const v of apercu.voisins) {
    assert.ok(v.apportUnitaireMilli > 0, `l'apport unitaire de ${v.type} est nul`);
    assert.equal(v.apportMilli, v.apportUnitaireMilli * v.compte);
  }
  assert.ok(production.lignes.some((l) => l.mineur === true),
    'le détail ne se distingue pas du total');

  // ⚠ AUCUNE CLÉ DE `parVoisin` NE S'AFFICHE TELLE QUELLE. Elles sont soit un
  // identifiant de bâtiment, soit `champDe<Ressource>` — et `champDeScorie` est
  // LE SEUL bonus de terrain de toute la table (CLAUDE.md §6). Le lire
  // « champDeScorie » à l'écran serait montrer au joueur un nom de champ de
  // données.
  assert.equal(libelleDuVoisin('champDeScorie'), 'champ de scorie');
  assert.equal(libelleDuVoisin('collecteur'), BASE_BATIMENTS.collecteur.nom.joueur);
  assert.throws(() => libelleDuVoisin('nExistePas'), /voisin/);
  // Et aucun libellé rendu ne laisse passer une clé brute.
  for (const v of apercu.voisins) {
    assert.ok(!/^champDe/.test(v.libelle), `clé brute affichée : ${v.libelle}`);
  }
});

test('panneau — ce qu\'une démolition rend se dit AVANT le geste', () => {
  // ⚠ `data/base.js` LE DEMANDAIT NOIR SUR BLANC : « démolir un bâtiment de
  // niveau 1 ne rend rien […] l'écran devra le dire avant le geste, sinon il se
  // lira comme un bug ». C'est ici que ça se dit.
  const etat = creerEtat(9);
  moteurEtat.ameliorer(etat, 0);
  const champ = baseCourante(etat).champs.cases[0];
  poser(etat, 'collecteur', champ.rangee, champ.colonne);

  const neuf = lignesDuPanneau(apercuDuBatiment(etat, 1));
  const demolition = neuf.sections.find((s) => s.titre === 'Démolition');
  assert.ok(demolition !== undefined, 'le panneau ne dit pas ce que rend une démolition');
  assert.equal(demolition.lignes[0].avant, 'rien',
    'un bâtiment de niveau 1 n\'a rien coûté : il ne rend rien');

  // Falsifiable : après une amélioration, il rend quelque chose. Sinon le
  // « rien » ci-dessus ne prouverait pas qu'on lit le remboursement.
  moteurEtat.ameliorer(etat, 1);
  const monte = lignesDuPanneau(apercuDuBatiment(etat, 1));
  assert.notEqual(monte.sections.find((s) => s.titre === 'Démolition').lignes[0].avant, 'rien');
  assert.equal(monte.sections.find((s) => s.titre === 'Démolition').lignes[0].avant,
    formaterCout(remboursementDuNiveau('collecteur', 2)));

  // Et le Chantier dit qu'il ne se démolit pas, avec le message du MOTEUR.
  const chantier = lignesDuPanneau(apercuDuBatiment(etat, 0));
  const ligne = chantier.sections.find((s) => s.titre === 'Démolition').lignes[0];
  assert.equal(ligne.libelle, moteurEtat.problemesDeLaDemolition(etat, 0)[0].message);
});

test('écran — un stock saturé le DIT, il ne le laisse pas deviner à la couleur', () => {
  // ⚠ MESURÉ, PAS SUPPOSÉ. Une base neuve avec son seul Collecteur sature en
  // cinq minutes et ne bouge plus jamais. La seule marque était un chiffre de
  // huit pixels qui virait au rouge, et deux rapports d'Ethan disent que ça n'a
  // pas suffi.
  const etat = creerEtat(4242);
  const champ = baseCourante(etat).champs.cases.find((c) => c.ressource === 'quartz');
  poser(etat, 'collecteur', champ.rangee, champ.colonne);
  const debut = resumeDeLaBase(etat).ressources.find((r) => r.cle === 'quartz');
  assert.ok(debut.stockMilli < debut.capaciteMilli,
    'le montage part déjà saturé : il ne mesurerait rien');
  assert.ok(debut.debitMilli > 0, 'le montage ne produit rien : il ne saturerait jamais');

  for (let i = 0; i < TICKS_PAR_HEURE; i++) tickJeu(etat);
  const fin = resumeDeLaBase(etat).ressources.find((r) => r.cle === 'quartz');
  assert.equal(fin.stockMilli, fin.capaciteMilli, 'le montage ne sature pas');

  // L'écran écrit le mot à ce moment-là, et il le prend dans la constante.
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  // ⚠ ON CHERCHE L'USAGE, PAS LA DÉCLARATION. Un simple `/MENTION_SATURE/` sur
  // le fichier restait vert quand on retirait le mot de l'affichage : la
  // constante est exportée en tête, et sa propre définition satisfaisait la
  // garde. Mesuré par falsification le 28/08 — c'est la deuxième garde du lot
  // qui se contentait d'une mention d'elle-même.
  assert.match(ecran, /textContent\s*=[^;]*MENTION_SATURE/,
    'l\'écran n\'écrit plus le mot dans le bandeau');
  assert.ok(/stockMilli\s*>=\s*r\.capaciteMilli/.test(ecran),
    'l\'écran ne compare plus le stock à sa capacité');
  assert.ok(MENTION_SATURE.length > 0);
  // Et la feuille peint aussi la capacité, pas seulement le nombre : c'est la
  // capacité qui porte le mot.
  const feuille = readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8');
  assert.ok(/\.capacite\.sature/.test(feuille), 'la capacité saturée n\'a pas de style');
});

test('panneau — le chronomètre dit QUAND, ou pourquoi il n\'y en aura pas', () => {
  // ⚠ ETHAN, LE 28/08 : « quand l'amélioration n'est pas possible, indiquer un
  // chronomètre. Si le stock requis est sous le seuil du stockage maximum. » La
  // seconde phrase est la condition, et elle porte tout : un coût plus grand que
  // la capacité de la base n'arrivera JAMAIS, et un compte à rebours dessus
  // tournerait sans jamais atteindre zéro.

  // --- 1. le cas ordinaire : ça arrive, et on dit quand ---------------------
  const etat = creerEtat(4242);
  moteurEtat.ameliorer(etat, 0);
  const champ = baseCourante(etat).champs.cases.find((c) => c.ressource === 'quartz');
  poser(etat, 'collecteur', champ.rangee, champ.colonne);
  baseCourante(etat).economie.ressources.quartz = 0;

  // Le montage doit MESURER quelque chose : un manque réel, et un débit non nul.
  assert.ok(apercuDuBatiment(etat, 0).problemes.length > 0, 'la caisse vide doit bloquer');
  const debit = resumeDeLaBase(etat).ressources.find((r) => r.cle === 'quartz').debitMilli;
  assert.ok(debit > 0, 'sans production, ce cas serait celui du bas');

  const delai = delaiAvantAmelioration(etat, 0);
  assert.equal(delai.cause, 'attente');
  assert.ok(delai.secondes > 0);
  // Le délai est celui du moteur, à la seconde : manque / débit, arrondi au
  // HAUT — annoncer une seconde de moins ferait cliquer le joueur sur un refus.
  // ⚠ LE PALIER VISÉ EST CELUI D'APRÈS LE NIVEAU COURANT, et le Chantier vient
  // d'être amélioré : c'est le prix du niveau 3 qu'on attend, pas celui du 2.
  const manqueMilli = coutDeMontee(
    'chantierDeConstruction', baseCourante(etat).disposition[0].niveau + 1,
  ).quartz * 1000;
  assert.equal(delai.secondes, Math.ceil((manqueMilli * 3600) / debit));
  assert.match(lignesDuPanneau(apercuDuBatiment(etat, 0)).bouton.note, /dans /);

  // ⚠ ET L'ARRONDI SE MESURE SUR UN MONTAGE QUI NE TOMBE PAS ROND — la
  // falsification l'a exigé. Avec une caisse à zéro, le manque vaut exactement
  // 10 000 milli contre 240 000/h : la division tombe juste, et `Math.floor`
  // rendait alors le même nombre que `Math.ceil`. Le test passait sur les deux
  // codes, donc il ne mesurait pas l'arrondi. Un milli de plus en caisse suffit
  // à les séparer.
  baseCourante(etat).economie.ressources.quartz = 1;
  const reste = manqueMilli - 1;
  assert.notEqual((reste * 3600) % debit, 0,
    'le montage doit tomber sur une fraction, sinon il ne mesure pas l\'arrondi');
  const arrondi = delaiAvantAmelioration(etat, 0);
  assert.equal(arrondi.secondes, Math.ceil((reste * 3600) / debit));
  assert.notEqual(arrondi.secondes, Math.floor((reste * 3600) / debit),
    'arrondir vers le bas annoncerait une seconde de moins que la vérité');
  baseCourante(etat).economie.ressources.quartz = 0;

  // ⚠ ET IL TOMBE À `null` DÈS QUE C'EST PAYABLE. Un chronomètre qui resterait
  // affiché sur une amélioration possible dirait au joueur d'attendre pour rien.
  baseCourante(etat).economie.ressources.quartz = manqueMilli;
  assert.equal(delaiAvantAmelioration(etat, 0), null);
  assert.equal(lignesDuPanneau(apercuDuBatiment(etat, 0)).bouton.possible, true);

  // --- 2. le mur : le coût dépasse ce que la base peut contenir -------------
  const mur = creerEtat(4242);
  baseCourante(mur).disposition[0].niveau = 12;
  baseCourante(mur).economie.ressources.quartz = 0;
  const capacite = capacitesMilli(baseCourante(mur).disposition).quartz;
  const requis = coutDeMontee('chantierDeConstruction', 13).quartz * 1000;
  assert.ok(requis > capacite, 'le montage ne mesure rien si le coût tient dans la capacité');
  const bloque = delaiAvantAmelioration(mur, 0);
  assert.equal(bloque.cause, 'capacite');
  assert.equal(bloque.secondes, null, 'un mur n\'a pas de durée');
  assert.equal(bloque.ressource, 'quartz');
  assert.match(lignesDuPanneau(apercuDuBatiment(mur, 0)).bouton.note, /stockage/);
  assert.doesNotMatch(lignesDuPanneau(apercuDuBatiment(mur, 0)).bouton.note, /dans /);

  // --- 3. rien ne produit : pas de mur, mais pas de durée non plus ----------
  const sec = creerEtat(4242);
  baseCourante(sec).economie.ressources.quartz = 0;
  assert.equal(resumeDeLaBase(sec).ressources.find((r) => r.cle === 'quartz').debitMilli, 0);
  const sansDebit = delaiAvantAmelioration(sec, 0);
  assert.equal(sansDebit.cause, 'sans-production');
  assert.equal(sansDebit.secondes, null);
  assert.match(lignesDuPanneau(apercuDuBatiment(sec, 0)).bouton.note, /rien n'en produit/);

  // --- 4. au plafond, il n'y a rien à attendre ------------------------------
  const plafond = creerEtat(4242);
  baseCourante(plafond).disposition[0].niveau = GEOGRAPHIE.niveauPlafond;
  assert.equal(delaiAvantAmelioration(plafond, 0), null);
});

test('panneau — un délai se lit, il ne se compte pas en secondes', () => {
  // « 7 412 s » est exact et illisible. Ce qu'un joueur lit, c'est un ordre de
  // grandeur et le chiffre qui bouge.
  assert.equal(formaterDelai(0), '0 s');
  assert.equal(formaterDelai(45), '45 s');
  assert.equal(formaterDelai(59), '59 s');
  assert.equal(formaterDelai(60), '1 min 00 s');
  assert.equal(formaterDelai(150), '2 min 30 s');
  assert.equal(formaterDelai(3599), '59 min 59 s');
  assert.equal(formaterDelai(3600), '1 h 00');
  assert.equal(formaterDelai(7412), '2 h 03');
  assert.equal(formaterDelai(86_399), '23 h 59');
  assert.equal(formaterDelai(86_400), '1 j 00 h');
  assert.equal(formaterDelai(200_000), '2 j 07 h');
  // Une fraction de seconde s'arrondit vers le HAUT : voir `delaiAvantAmelioration`.
  assert.equal(formaterDelai(0.4), '1 s');
  assert.throws(() => formaterDelai(-1), /durée/);
  assert.throws(() => formaterDelai(NaN), /durée/);
});

test('écran — les pastilles de case libre ont quitté la grille, pas le calcul', () => {
  // ⚠ ETHAN, LE 28/08 : « supprimer les petits carrés en haut à droite qui
  // montrent place disponible bâtiment ». Elles dessinaient un NOMBRE à des
  // endroits qui n'avaient rien à voir avec les cases que le joueur choisirait,
  // et le compteur « Emplac. 3 / 4 » du bandeau des ressources dit la même
  // grandeur sans mentir sur la géométrie.
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  assert.doesNotMatch(ecran, /className\s*=\s*'vide'/,
    'l\'écran dessine encore des pastilles de case libre');

  // La feuille n'a plus la règle de la pastille — mais elle garde `.vide` de
  // l'écran Offense, qui est un autre élément portant le même nom court.
  const feuille = readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8');
  assert.doesNotMatch(feuille, /\n\s*\.vide\s*\{/,
    'la règle de la pastille survit dans la feuille');
  // ⚠ `#offense-barre` A DISPARU AU LOT MISE EN PAGE, donc la précaution qui
  // portait sur lui n'a plus d'objet : c'est la palette de l'Offense qui porte
  // maintenant le seul autre usage du nom court `vide`, et il n'y en a plus.
  assert.ok(!/#offense-barre/.test(feuille.replace(/\/\*[\s\S]*?\*\//g, '')),
    'la barre propre à l\'écran Offense devait disparaître');

  // ⚠ ET LA GRANDEUR RESTE CALCULÉE ET AFFICHÉE. C'est le dessin qui part, pas
  // le plafond : le compteur d'emplacements le dit toujours.
  const neuve = creerEtat(11);
  assert.deepEqual(resumeDeLaBase(neuve).emplacements, {
    poses: 1, ouverts: emplacementsDuNiveau(1),
  });
  assert.match(ecran, /emplacementsPoses\.textContent\s*=/,
    'le compteur d\'emplacements a disparu avec les pastilles');
});

// ---------------------------------------------------------------------------
// Lot MISE EN PAGE — l'en-tête commun, la barre du bas entière, les Options
// ---------------------------------------------------------------------------

test('mise en page — l\'en-tête est COMMUN aux écrans, il n\'appartient plus au Chantier', () => {
  // ⚠ C'EST LE FOND DU LOT. Les onglets et le bandeau des ressources vivaient
  // DANS `#ecran-chantier` : passer à l'Offense les faisait disparaître, alors
  // qu'Ethan demandait de « garder la barre quartz scories etc et monde option
  // dans le menu offense ». Ils en sont sortis, et tout écran à venir en hérite.
  const html = readFileSync(join(RACINE, 'dist', 'index.html'), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

  const pos = (id) => html.indexOf(`id="${id}"`);
  for (const id of ['jeu', 'tete-onglets', 'ressources', 'navigation', 'ecrans',
    'ecran-chantier', 'ecran-offense', 'ecran-options', 'barre-bas']) {
    assert.ok(pos(id) > 0, `« ${id} » absent de la page`);
  }

  // L'ordre du DOCUMENT est l'ordre de l'ÉCRAN : en-tête, écrans, barre du bas.
  // Un `order` CSS ferait le même dessin et casserait la navigation au clavier
  // comme la lecture par un lecteur d'écran.
  assert.ok(pos('jeu') < pos('tete-onglets'), 'les onglets sont hors de la page de jeu');
  assert.ok(pos('tete-onglets') < pos('ressources'));
  assert.ok(pos('ressources') < pos('navigation'));
  assert.ok(pos('navigation') < pos('ecrans'));
  assert.ok(pos('ecrans') < pos('ecran-chantier'), 'l\'écran Chantier est hors du conteneur');
  assert.ok(pos('ecran-chantier') < pos('barre-bas'), 'la barre du bas passe avant les écrans');

  // ⚠ ET SURTOUT : les trois éléments communs sont AVANT `#ecran-chantier`,
  // donc dehors. C'est la falsification de tout ce test — les remettre dedans
  // les ferait repasser après, et la navigation redeviendrait celle qu'on répare.
  for (const commun of ['tete-onglets', 'ressources', 'navigation']) {
    assert.ok(pos(commun) < pos('ecran-chantier'),
      `« ${commun} » est retombé dans l'écran Chantier`);
  }

  // Le jeu s'ouvre sur la Base ; les deux autres écrans partent cachés.
  assert.match(html, /<div id="ecran-offense" hidden>/);
  assert.match(html, /<div id="ecran-options" hidden>/);
  assert.ok(!/<div id="ecran-chantier" hidden>/.test(html), 'l\'écran Chantier part caché');
});

test('compteur — le libellé suit le contexte, et la valeur reste honnête', () => {
  // ⚠ ARBITRÉ LE 28/08 : « quand on passe en défense, le nombre d'emplacement
  // change pour celui des points de défense. Idem pour offense. »
  const etat = creerEtat(11);

  const batiments = compteurDeContexte(etat, 'batiments');
  assert.equal(batiments.libelle, 'Emplac.');
  assert.equal(batiments.valeur, '1');
  assert.equal(batiments.capacite, `/ ${emplacementsDuNiveau(1)}`);
  assert.equal(batiments.sature, false);

  // ⚠ LES DEUX AUTRES PORTENT UN NOMBRE DEPUIS LE 28/08 — ce test a changé de
  // cible, il ne s'est pas assoupli. Ils affichaient « — » tant que
  // `sim/state.js` ne portait ni garnison ni armée ; il les porte, donc les
  // points engagés se comptent. Une base neuve n'a rien de posé : ZÉRO, ce qui
  // est un fait, et non un tiret, qui disait « incomptable ».
  for (const contexte of ['defense', 'offense']) {
    const vue = compteurDeContexte(etat, contexte);
    assert.equal(vue.valeur, '0', `${contexte} devrait compter ses points engagés`);
    assert.notEqual(vue.valeur, NIVEAU_ABSENT);
    // ⚠ C'EST LA CAPACITÉ QUI MANQUE, PAS LA VALEUR : aucune base neuve ne
    // porte de Centre de commandement ni de QG de défense, donc il n'y a
    // AUCUN budget d'où lire un plafond. « 0 / 0 » ferait croire à un plafond
    // atteint là où il n'y en a pas.
    assert.equal(vue.capacite, '');
    assert.equal(vue.sature, false);
    assert.notEqual(vue.libelle, batiments.libelle, `${contexte} garde le libellé des bâtiments`);
    assert.equal(CONTEXTES[contexte].chiffre, true);
  }
  assert.deepEqual(Object.keys(CONTEXTES).slice().sort(), ['batiments', 'defense', 'offense']);
  assert.throws(() => compteurDeContexte(etat, 'inconnu'), /contexte/);

  // Falsifiable : le compteur des bâtiments DOIT bouger avec la base, sinon les
  // trois cas se ressembleraient et le test ne distinguerait rien.
  // ⚠ ON REMPLIT JUSQU'À CE QUE LA FONCTION DISE PLEIN, on ne compte pas les
  // poses à la main : la table d'emplacements a changé le 29/08 et changera
  // encore. Ce qui est mesuré est que le compteur SUIT la base, pas qu'il
  // affiche deux.
  const champs = baseCourante(etat).champs.cases;
  let pose = 0;
  while (compteurDeContexte(etat, 'batiments').sature === false) {
    poser(etat, 'collecteur', champs[pose].rangee, champs[pose].colonne);
    pose += 1;
    assert.ok(pose <= champs.length, 'le montage ne parvient pas à remplir la base');
  }
  assert.ok(pose > 0, 'une base neuve était déjà pleine : le montage ne mesure rien');
  const pleine = compteurDeContexte(etat, 'batiments');
  assert.equal(pleine.valeur, String(1 + pose));
  assert.equal(pleine.sature, true, 'la base devrait être pleine après les poses');
  assert.notEqual(pleine.valeur, batiments.valeur);
});

test('navigation — la bascule est VIVE, et le libellé se compte', () => {
  // ⚠⚠ CE TEST ÉTAIT L'INVERSE JUSQU'AU LOT BASES-1 : il exigeait deux flèches
  // DÉSACTIVÉES et un `NOMBRE_DE_BASES` écrit à 1. La constante a disparu avec
  // la coquille — elle annonçait elle-même que « le jour où l'état en portera
  // plusieurs, ce nombre se comptera au lieu de se lire ici ».
  //
  // ⚠ UNE SEULE BASE : LES DEUX FLÈCHES RESTENT MORTES. Ce n'est pas un refus,
  // c'est qu'il n'y a nulle part où aller — et c'est ce qui distingue ce test
  // d'un simple « toujours vif », qui passerait aussi sur du code qui ne compte
  // rien.
  const seule = navigationEntreBases(creerEtat(3));
  assert.equal(seule.libelle, 'Base 1 / 1');
  assert.equal(seule.precedente, false);
  assert.equal(seule.suivante, false);
  assert.throws(() => navigationEntreBases(null), /état de jeu/);

  // Deux bases : le libellé compte, les deux flèches s'ouvrent, et le numéro
  // suit `baseCourante` — pas un 1 écrit en dur.
  const etat = creerEtat(3);
  etat.recherche.basesAutorisees = 2;
  fonderUneBase(etat, { rangee: 293, colonne: 16 });
  const deux = navigationEntreBases(etat);
  assert.equal(deux.libelle, 'Base 2 / 2', 'le libellé ne suit pas la base courante');
  assert.equal(deux.precedente, true);
  assert.equal(deux.suivante, true);
  basculerVersLaBase(etat, 0);
  assert.equal(navigationEntreBases(etat).libelle, 'Base 1 / 2');

  // Et l'écran ne désarme plus les flèches en dur : il lit la vue.
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  assert.doesNotMatch(ecran, /navigation-precedente'\)\.disabled = true/);
  assert.match(ecran, /navigation-precedente'\)\.disabled = !navigation\.precedente/);
  assert.match(ecran, /navigation-suivante'\)\.disabled = !navigation\.suivante/);
});

test('barre du bas — trois boutons égaux, et le troisième DEMANDE l\'écran', () => {
  // Arbitré le 28/08 : « les boutons base défense offense doivent prendre
  // toutes la place en bas ». Le lot précédent séparait le saut vers l'Offense
  // par un filet, précisément pour qu'il n'ait pas l'air d'une bande ; Ethan a
  // tranché dans l'autre sens.
  assert.equal(BOUTONS_DU_BAS.length, 3);
  assert.deepEqual(BOUTONS_DU_BAS.map((b) => b.nom), ['Base', 'Défense', 'Offense']);
  // Deux font défiler une bande de la MÊME grille, le troisième change d'écran.
  assert.deepEqual(BOUTONS_DU_BAS.filter((b) => b.bande !== null).map((b) => b.bande),
    BANDES_NAVIGABLES);
  assert.equal(BOUTONS_DU_BAS.filter((b) => b.ecran === 'offense').length, 1);
  for (const b of BOUTONS_DU_BAS) {
    assert.ok(BANDES.some((x) => x.cle === b.bande) || b.bande === null, `bande inconnue : ${b.bande}`);
  }

  // ⚠ L'ÉCRAN DEMANDE, LA SESSION DÉCIDE. Changer d'écran n'est pas du ressort
  // de `ui/chantier.js` : il le demande par `versEcran`, comme il demande
  // l'écriture par `apresPose`. Sans ce découpage, l'écran de la base saurait
  // ce qu'est l'écran Offense, et les deux se connaîtraient mutuellement.
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  assert.match(ecran, /versEcran\s*!==\s*undefined/, 'l\'écran n\'appelle pas versEcran');
  assert.ok(!/ecran-offense/.test(ecran), 'l\'écran de la base nomme l\'écran Offense en dur');
  const session = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'session.js'), 'utf8'));
  assert.match(session, /versEcran:\s*\(nom\)\s*=>\s*montrerEcran\(nom\)/,
    'la session ne branche pas versEcran');
});

test('palette — UNE bande qui défile, la hauteur gardée, et l\'économie en tête', () => {
  // ⚠⚠ CE TEST EST RETOURNÉ, PAS RETIRÉ, ET LE 28/08 AVAIT RAISON EN SON TEMPS.
  // Il exigeait deux rangées et aucun défilement : « faire rentrer dans l'ui
  // tous les bâtiments du bas ». Ethan tranche l'inverse le 03/09 : « faire une
  // seule bande pour les bâtiments unités à construire + une barre de
  // défilement. Garder la hauteur, comme ça les boutons seront gros. » La
  // grandeur qu'on garde est la même — la HAUTEUR de la barre —, c'est la
  // répartition dedans qui change.
  const posables = posablesDeLaBase(creerEtat(5));
  assert.equal(posables.length, Object.keys(BASE_BATIMENTS).length);
  assert.equal(posables.length, 11, 'le montage suppose onze bâtiments');

  // ⚠ LES QUATRE DE L'ÉCONOMIE D'ABORD, et l'ordre se lit dans la DONNÉE.
  assert.deepEqual(posables.slice(0, 4).map((p) => p.id),
    ['collecteur', 'raffinerie', 'centrale', 'accumulateur'],
    'la palette ne commence plus par les quatre bâtiments d\'économie');
  // Et c'est bien une PERMUTATION : ni un bâtiment en trop, ni un oublié.
  assert.deepEqual([...ORDRE_PALETTE].sort(), Object.keys(BASE_BATIMENTS).sort(),
    'ORDRE_PALETTE n\'est plus une permutation du roster');
  assert.deepEqual(posables.map((p) => p.id), [...ORDRE_PALETTE],
    'la palette ne suit plus ORDRE_PALETTE');

  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  // ⚠ LE JS NE CALCULE PLUS DE COLONNES. Tant que la palette devait TENIR, lui
  // seul savait combien de vignettes il y avait ; maintenant qu'elle défile, la
  // largeur est une constante d'écran. Laisser le calcul en place donnerait
  // deux endroits qui décident de la même grandeur.
  // ⚠ ELLE NOMME LA PALETTE, PAS LA PROPRIÉTÉ. Un `doesNotMatch` sur
  // `gridTemplateColumns` tout court attrapait la GRILLE DES CASES, qui la pose
  // légitimement depuis toujours : une garde qui tombe sur du code juste se
  // fait retirer, pas resserrer, et c'est comme ça qu'on perd une garde.
  assert.doesNotMatch(ecran, /bandeauPalette\.style\.gridTemplateColumns/,
    'le JS pose encore les colonnes de la palette');
  assert.doesNotMatch(ecran, /Math\.ceil\(posables\.length/,
    'le JS calcule encore un nombre de rangées de palette');

  const feuille = readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const bloc = feuille.slice(feuille.indexOf('#chantier-palette {'));
  const regle = bloc.slice(0, bloc.indexOf('}'));
  assert.match(regle, /overflow-x:\s*auto/, 'la palette ne défile pas');
  assert.match(regle, /grid-auto-flow:\s*column/, 'la palette n\'est pas en une bande');
  assert.match(regle, /grid-template-rows:\s*1fr/, 'la palette a plus d\'une rangée');
  assert.match(regle, /grid-auto-columns/, 'la largeur d\'une vignette n\'est pas fixée');

  // ⚠⚠ ET LA HAUTEUR NE BOUGE PAS — c'est la moitié de la demande, et c'est
  // elle qui rend les boutons gros. Une bande de 86 px moins 10 de `padding`
  // laisse 76 px à une vignette, contre 38 quand elles étaient deux.
  const hauteur = Number(regle.match(/flex:\s*0 0 (\d+)px/)[1]);
  assert.equal(hauteur, 86, 'la palette a changé de hauteur : le chrome de 288 px bouge');
  const remplissage = Number(regle.match(/padding:\s*(\d+)px/)[1]);
  assert.equal(hauteur - 2 * remplissage, 76, 'la vignette ne fait plus 76 px de haut');
});

test('options — le banc reste atteignable après le déménagement de la version', () => {
  // ⚠ C'EST LE PIÈGE DE CE LOT, ET IL EST MÉCANIQUE. Ethan a demandé que le
  // numéro de version quitte la barre du bas, qui doit revenir entière aux trois
  // boutons. Or ce numéro PORTE l'appui long de 1,5 s qui ouvre le banc d'essai.
  // Le déplacer sans lui donner d'abri aurait rendu le banc inatteignable — et
  // T10 de `banc.test.js`, qui exige ses contrôles dans le HTML livré, serait
  // resté VERT en les gardant présents mais hors de portée du doigt.
  const html = readFileSync(join(RACINE, 'dist', 'index.html'), 'utf8');
  assert.ok(html.includes('options-version'), 'le numéro de version n\'a pas d\'abri');
  assert.ok(html.includes('ecran-options'), 'l\'écran Options n\'existe pas');

  // L'onglet Options n'est PAS mort : sans lui, l'écran serait inatteignable et
  // le banc avec.
  const code = html.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/id="onglet-options"[^>]*disabled/.test(code),
    'l\'onglet Options est désactivé : l\'écran, et le banc, deviennent inatteignables');

  // Et la session écoute bien l'appui long SUR CET ÉLÉMENT-LÀ.
  const session = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'session.js'), 'utf8'));
  assert.match(session, /const version = \$\('options-version'\)/,
    'la session écoute encore l\'ancien élément');
  assert.match(session, /version\.addEventListener\('pointerdown'/);
  assert.match(session, /DUREE_APPUI_DEBUG_MS/);
  assert.ok(!/chantier-version/.test(session), 'l\'ancien identifiant survit dans la session');

  // ⚠ ET LE BANC CACHE `#jeu`, PAS LES ÉCRANS UN PAR UN. Il en nommait deux ;
  // avec trois écrans et deux barres communes, en oublier un serait une question
  // de temps — le banc s'ouvrirait par-dessus les onglets restés visibles.
  assert.match(session, /\$\('jeu'\)\.hidden = true/, 'le banc ne cache plus la page de jeu');
  assert.match(session, /\$\('jeu'\)\.hidden = false/, 'la page de jeu ne revient pas');
  assert.ok(!/ecran-offense'\)\.hidden = true/.test(session),
    'le banc cache encore les écrans un par un');
});

test('flèches — un TRAIT ÉPAIS de centre à centre, pas un glyphe dans un coin', () => {
  // ⚠⚠ ETHAN, LE 29/08 : « les flèches de la base (collecteur raffinerie) sont
  // bien trop petites. Elle doit partir du centre d'une case à l'autre. Trait
  // épais. » Ce qui existait était un caractère de 11 px posé en bas à droite
  // de la case voisine : lisible sur une capture de bureau, invisible au doigt.
  //
  // ⚠ LA GÉOMÉTRIE EST PURE ET RAISONNE EN CASES. Elle ne connaît ni pixels ni
  // SVG : le repère a la case pour unité, et le centre de (colonne, ligne) est
  // en (colonne − ½, ligne − ½). C'est ce qui la rend testable ici.
  const trait = traitDeVoisinage({ ligne: 4, colonne: 3 }, { ligne: 4, colonne: 4 });

  // Il PART du centre de la case de départ — c'est la demande, mot pour mot.
  assert.equal(trait.ligne.x1, 2.5);
  assert.equal(trait.ligne.y1, 3.5);
  // Et il ARRIVE au centre de l'autre : la pointe y a son sommet.
  assert.deepEqual(trait.pointe[0], [3.5, 3.5]);
  // Le fût s'arrête à la base de la pointe, pas au sommet : sinon le bout rond
  // dépasserait la pointe et la carte porterait un moignon.
  assert.ok(trait.ligne.x2 < 3.5 && trait.ligne.x2 > 2.5);
  assert.equal(trait.ligne.x2, 3.5 - TRAIT_VOISINAGE.longueurPointe);

  // ⚠ ÉPAIS, ET MESURÉ EN FRACTIONS DE CASE. La case va de 30 à 46 px CSS selon
  // l'appareil : une épaisseur en pixels serait grosse sur un petit écran et
  // maigre sur un grand. Un dixième de case au moins — l'ancien glyphe pesait
  // 11 px sur une case de 46, soit deux fois moins.
  assert.equal(trait.epaisseur, TRAIT_VOISINAGE.epaisseur);
  assert.ok(trait.epaisseur >= 0.1, `trait de ${trait.epaisseur} case : trop maigre`);
  // La pointe est un vrai triangle, pas trois points alignés.
  const [sommet, a, b] = trait.pointe;
  assert.equal(trait.pointe.length, 3);
  const aire = Math.abs((a[0] - sommet[0]) * (b[1] - sommet[1])
    - (b[0] - sommet[0]) * (a[1] - sommet[1])) / 2;
  assert.ok(aire > 0.01, `pointe d'aire ${aire} : elle est dégénérée`);

  // Les huit directions marchent, et la longueur du fût suit la distance : une
  // diagonale est plus longue qu'un côté, sinon elle s'arrêterait en route.
  const droit = traitDeVoisinage({ ligne: 5, colonne: 5 }, { ligne: 4, colonne: 5 });
  const diagonal = traitDeVoisinage({ ligne: 5, colonne: 5 }, { ligne: 4, colonne: 6 });
  const longueur = (t) => Math.hypot(t.ligne.x2 - t.ligne.x1, t.ligne.y2 - t.ligne.y1);
  assert.ok(longueur(diagonal) > longueur(droit),
    'la diagonale devrait être plus longue que le côté');

  // Une case et elle-même n'a pas de direction : ça LÈVE plutôt que de rendre
  // un trait de longueur nulle, qui se dessinerait en point.
  assert.throws(() => traitDeVoisinage({ ligne: 2, colonne: 2 }, { ligne: 2, colonne: 2 }),
    RangeError);
});

test('flèches — le trait et le glyphe disent la MÊME direction', () => {
  // ⚠ DEUX REPRÉSENTATIONS D'UN SEUL FAIT, DONC UNE GARDE. Le glyphe est le
  // LIBELLÉ de la flèche — il vit dans l'infobulle du SVG — et le couple
  // départ/arrivée est son DESSIN. Les laisser diverger montrerait un trait
  // dans un sens et l'annoncerait dans l'autre.
  const champs = champsDeLaBase(DEPART.rangee, DEPART.colonne);
  const dispo = [
    { id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 10 },
    { id: 'centrale', rangee: 15, colonne: 5, niveau: 1 },
    { id: 'accumulateur', rangee: 16, colonne: 5, niveau: 1 },
  ];
  assert.deepEqual(problemesDeDisposition(dispo, champs), []);

  const fleches = flechesDeVoisinage(dispo, champs, 1);
  assert.ok(fleches.length > 1, `${fleches.length} flèche(s) : le montage ne mesure rien`);
  const attendu = new Map(Object.entries(GLYPHES_DE_FLECHE));
  for (const f of fleches) {
    const trait = traitDeVoisinage(f.depart, f.arrivee);
    const dLigne = Math.sign(f.arrivee.ligne - f.depart.ligne);
    const dColonne = Math.sign(f.arrivee.colonne - f.depart.colonne);
    assert.equal(f.glyphe, attendu.get(`${dLigne},${dColonne}`),
      'le glyphe ne décrit pas la direction du trait');
    // Et le trait va bien dans ce sens-là, en coordonnées.
    assert.equal(Math.sign(trait.pointe[0][1] - trait.ligne.y1), dLigne, 'trait inversé en Y');
    assert.equal(Math.sign(trait.pointe[0][0] - trait.ligne.x1), dColonne, 'trait inversé en X');
  }
});

test('flèches — le calque SVG est dans la page, stylé, et ne prend aucun geste', () => {
  const html = readFileSync(join(RACINE, 'dist', 'index.html'), 'utf8');
  const feuille = sansCommentairesHtml(html);

  // ⚠ IL EST CRÉÉ PAR LE JS, PAS ÉCRIT DANS LE BALISAGE : c'est son STYLE qui
  // doit être dans la page, sinon le calque existerait sans se voir — la faute
  // exacte du lot ÉCRAN-ACTIONS, où une classe basculée n'avait aucune règle.
  assert.match(feuille, /#chantier-traits\s*\{/, 'le calque des traits n\'a aucun style');
  assert.match(feuille, /#chantier-traits\s*\{[^}]*position:\s*absolute/);
  // ⚠ `pointer-events: none` : sans lui, un trait posé par-dessus une case
  // avalerait le toucher qui la vise. C'est la même règle que l'interdiction
  // d'un `transform: scale()` sur la grille — le doigt ne se décroche pas.
  assert.match(feuille, /#chantier-traits\s*\{[^}]*pointer-events:\s*none/,
    'le calque des traits avale les touchers de la grille');
  // Le parent doit le porter : un enfant `absolute` se cale sur le premier
  // ancêtre positionné, et sans ça le calque se poserait sur toute la page.
  assert.match(feuille, /#chantier-grille\s*\{[^}]*position:\s*relative/);
  // Le fût et la pointe sont peints — un SVG sans `stroke` ni `fill` est vide.
  assert.match(feuille, /#chantier-traits \.trait\s*\{[^}]*stroke:/);
  assert.match(feuille, /#chantier-traits \.pointe\s*\{[^}]*fill:/);

  // Et l'écran le construit avec le bon `viewBox` : la CASE pour unité, donc
  // autant d'unités que la grille a de colonnes et de lignes.
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  assert.match(ecran, /viewBox['"`],\s*`0 0 \$\{GRILLE\.largeur\} \$\{GRILLE\.longueur\}`/,
    'le viewBox du calque ne suit plus la grille');
  // ⚠ ET LE GLYPHE NE SE DESSINE PLUS DANS UNE CASE. Le marqueur posé en bas à
  // droite d'une case est ce que ce lot remplace ; s'il revenait, les deux
  // dessins se superposeraient.
  //
  // ⚠ LA GARDE EST BORNÉE À `peindreApercu`, ET IL LE FAUT. Une première
  // rédaction cherchait `className = 'fleche'` dans TOUT le fichier — et
  // tombait sur le « → » du panneau de détail, qui porte la même classe pour
  // une raison sans rapport et garde sa règle `#chantier-panneau .ligne
  // .fleche`. Un garde-fou qui accuse un innocent finit par être désarmé.
  const apercu = ecran.slice(ecran.indexOf('function peindreApercu('));
  const corpsApercu = apercu.slice(0, apercu.indexOf('\n  function ', 1));
  assert.ok(corpsApercu.length > 200, 'le découpage de peindreApercu ne mesure rien');
  assert.ok(!/'fleche'/.test(corpsApercu),
    'le marqueur de flèche dans la case est revenu');
  // Et c'est bien le calque qui est rempli à la place.
  assert.match(corpsApercu, /traitDeVoisinage\(/, 'l\'aperçu ne dessine plus de trait');
  assert.match(corpsApercu, /traits\.appendChild/, 'l\'aperçu n\'écrit plus dans le calque');
});

test('flèches — elles pointent vers le bâtiment, dans le sens de l\'ÉCRAN', () => {
  // ⚠ LA GRILLE SE DESSINE À L'ENVERS DES NUMÉROS DE RANGÉE. La rangée 18 est
  // la PREMIÈRE ligne d'écran : un voisin de rangée SUPÉRIEURE est donc PLUS
  // HAUT, et la flèche qui le relie au bâtiment pointe vers le BAS.
  //
  // ⚠ ET LA FALSIFICATION A CORRIGÉ CE COMMENTAIRE. Il affirmait que déduire le
  // glyphe du signe de `rangee` « retourne les huit flèches ». C'est FAUX :
  // avec `ligne = longueur + 1 − rangee`, les deux formules donnent le même
  // signe, le +19 se simplifiant. Passer par `ligneEcranDeLaRangee` ne corrige
  // rien aujourd'hui — ça dit qu'on raisonne en lignes d'écran, et ça restera
  // juste si la transformation cesse d'être affine. La faute qui se commet
  // vraiment est l'INVERSION du signe, et c'est celle-là qu'on attrape.
  // ⚠ COLONNE 5 ET NON 4 DEPUIS LE 29/08 : `TERRAIN_INITIAL` porte un champ de
  // scorie en (15, 4), et la centrale posée dessus rendait « champ-gache » —
  // le montage cessait d'être légal, donc de mesurer le sens des flèches.
  // ⚠ ET LA COLONNE 3, ESSAYÉE D'ABORD, MESURAIT AUTRE CHOSE SANS LE DIRE : le
  // champ de (16, 2) devenait voisin en DIAGONALE de la centrale, si bien que
  // le `find` sur la rangée 16 rendait le champ au lieu de l'accumulateur et
  // l'assertion lisait « ↘ » là où elle croyait lire l'accumulateur. La colonne
  // 5 laisse la rangée 16 vide de champs autour de la centrale.
  const champs = champsDeLaBase(DEPART.rangee, DEPART.colonne);
  const dispo = [
    { id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 10 },
    { id: 'centrale', rangee: 15, colonne: 5, niveau: 1 },
    { id: 'accumulateur', rangee: 16, colonne: 5, niveau: 1 },
  ];
  // Le montage doit être LÉGAL, sinon les débits ne veulent rien dire.
  assert.deepEqual(problemesDeDisposition(dispo, champs), []);
  // …et l'accumulateur doit bien être PLUS HAUT à l'écran que la centrale.
  assert.ok(ligneEcranDeLaRangee(16) < ligneEcranDeLaRangee(15),
    'le montage ne mesure pas le retournement');

  const surCentrale = flechesDeVoisinage(dispo, champs, 2);
  assert.equal(surCentrale.length, 1);
  assert.equal(surCentrale[0].rangee, 15);
  assert.equal(surCentrale[0].glyphe, '↑',
    'la flèche posée sous l\'accumulateur devrait pointer vers le haut');

  const voisinsDeLaCentrale = flechesDeVoisinage(dispo, champs, 1);
  const versLAccumulateur = voisinsDeLaCentrale.find((f) => f.rangee === 16);
  assert.equal(versLAccumulateur.glyphe, '↓',
    'la flèche posée sur l\'accumulateur devrait pointer vers le bas');
  // Et le champ de scorie à droite pointe vers la gauche. Il est en (15, 6)
  // depuis que la centrale a glissé en colonne 5.
  const versLeChamp = voisinsDeLaCentrale.find((f) => f.colonne === 6);
  assert.equal(versLeChamp.glyphe, '←');
  assert.equal(versLeChamp.libelle, 'champ de scorie');

  // ⚠ LES HUIT DIRECTIONS EXISTENT, et aucune n'est un doublon : une direction
  // sans glyphe fait LEVER plutôt que de dessiner une flèche muette.
  assert.equal(Object.keys(GLYPHES_DE_FLECHE).length, 8);
  assert.equal(new Set(Object.values(GLYPHES_DE_FLECHE)).size, 8);

  // ⚠ LE TOTAL DES FLÈCHES EST LE BONUS DE VOISINAGE, à l'unité près. Si les deux
  // divergeaient, l'écran montrerait un voisinage que le débit ne paie pas.
  const debit = debitDuBatiment(dispo, champs, 1);
  const somme = voisinsDeLaCentrale.reduce((t, f) => t + f.apportMilli, 0);
  assert.equal(somme, (debit.total - debit.propre) * 1000);
  assert.ok(somme > 0, 'un voisinage nul ne mesurerait rien');

  // Un bâtiment sans voisinage possible n'a pas de flèche du tout.
  assert.deepEqual(flechesDeVoisinage(dispo, champs, 0), []);
  assert.throws(() => flechesDeVoisinage(dispo, champs, 9), /hors de la disposition/);

  // ⚠ ET L'ÉCRAN LES MONTRE AUX TROIS MOMENTS ARBITRÉS : l'aperçu de pose, le
  // bâtiment en main pendant un déplacement, et l'ouverture du panneau — cette
  // dernière demandée telle quelle par Ethan (« faire apparaître les flèches du
  // bâtiment concerné quand on ouvre l'onglet bâtiment »).
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  const ouvrir = ecran.slice(ecran.indexOf('function ouvrirPanneau('));
  assert.match(ouvrir.slice(0, ouvrir.indexOf('\n  }')), /peindreApercu\(\)/,
    'ouvrir le panneau ne montre plus les flèches');
  assert.match(ecran, /function peindreApercu\(\)/);
  // Et une seule fonction les dessine : trois écritures donneraient trois
  // lectures du voisinage.
  // La déclaration ne compte pas : c'est le nombre d'APPELS qu'on borne.
  assert.equal((ecran.match(/(?<!function )flechesDeVoisinage\(/g) ?? []).length, 1,
    'le voisinage est dessiné à plus d\'un endroit');
});

test('pose — elle se fait en DEUX touchers, et le premier ne pose rien', () => {
  // ⚠ ARBITRÉ LE 28/08 : « il y a d'abord un clic et le bâtiment/sprite
  // transparent, et les flèches bonus proximité s'affiche si il y en a, un deux
  // clique pose le bâtiment ». Le premier toucher MONTRE ; c'est ce temps-là qui
  // rend le voisinage visible avant de s'engager.
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  assert.match(ecran, /poseEnAttente/, 'l\'écran ne retient plus la case en aperçu');
  // Le premier toucher SORT avant d'appeler le moteur : c'est ce `return` qui
  // fait les deux temps.
  assert.match(ecran, /if \(!memeCase\) \{[\s\S]{0,400}?return;/,
    'le premier toucher ne sort plus sans poser');
  // ⚠ LA GARDE PORTE SUR LE CORPS DE `tenterLaPose`, PLUS SUR LE FICHIER
  // ENTIER — et c'est un RESSERREMENT, pas un relâchement. Elle comparait deux
  // `indexOf` sur tout le module : la première mention de `poserBatiment` s'est
  // trouvée remontée dans la table des terrains, bien avant la fonction, et la
  // garde est tombée sans qu'aucun geste ait changé. Un test qui dépend de
  // l'ordre des déclarations dans un fichier de 2 000 lignes ne mesure pas ce
  // qu'il croit. On découpe donc la fonction et on lit dedans.
  const corpsDePose = ecran.slice(ecran.indexOf('function tenterLaPose('));
  const finDePose = corpsDePose.indexOf('\n  }');
  const dansLaPose = corpsDePose.slice(0, finDePose);
  assert.ok(dansLaPose.length > 100, 'le découpage de tenterLaPose ne trouve rien');
  assert.ok(dansLaPose.includes('if (!memeCase)'), 'les deux touchers ont quitté la pose');
  assert.ok(dansLaPose.indexOf('if (!memeCase)') < dansLaPose.indexOf('.poser('),
    'la confirmation est demandée APRÈS la pose');

  // Les deux messages de mode existent et disent quoi faire.
  assert.ok(messageDeConfirmation('Raffinerie').includes('Raffinerie'));
  assert.match(messageDeConfirmation('X'), /retouchez la même case/);
  assert.ok(messageDeDestination('Collecteur').includes('Collecteur'));
  assert.match(messageDeDestination('X'), /case d'arrivée/);
  assert.deepEqual(Object.keys(MESSAGES_MODE).slice().sort(), Object.keys(ACTIONS).slice().sort());

  // Falsifiable : le motif attrape bien un premier toucher qui poserait.
  assert.ok(!/if \(!memeCase\) \{[\s\S]{0,400}?return;/.test('if (!memeCase) { poserBatiment(e); }'));
});

test('mise en page — le chrome fixe tient dans l\'écran, et rien ne défile de travers', () => {
  // ⚠ CONSIGNE D'ETHAN, 28/08 : « tu compresses tout dans l'ui ». Elle est plus
  // forte que « pas de dépassement » : tout doit TENIR, rien ne défile
  // horizontalement, aucune barre n'en pousse une autre hors du cadre.
  const feuille = readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  // Les barres à hauteur FIXE de la colonne de jeu, nommées une par une.
  const hauteur = (id) => {
    const bloc = feuille.match(new RegExp(`#${id}\\s*\\{([^}]*)\\}`));
    assert.ok(bloc, `la règle de #${id} a disparu`);
    const f = bloc[1].match(/flex:\s*0 0 (\d+)px/);
    assert.ok(f, `#${id} n'a plus de hauteur fixe`);
    return Number(f[1]);
  };
  const barres = ['tete-onglets', 'ressources', 'navigation', 'chantier-contexte',
    'barre-bas', 'chantier-palette'];
  const chrome = barres.reduce((t, id) => t + hauteur(id), 0);

  // MESURÉ : 40 + 44 + 26 + 46 + 46 + 86 = 288 px. La borne est à 320 : sur la
  // dalle la plus courte encore en service (568 px de haut en CSS), 320 px de
  // chrome laissent 248 px de grille, soit cinq rangées. En dessous, le jeu
  // cesse d'être jouable — c'est là qu'est la limite, pas dans l'esthétique.
  assert.equal(chrome, 288, `chrome de ${chrome} px : recalculer la borne ci-dessous`);
  assert.ok(chrome <= 320, `${chrome} px de barres fixes, 320 au plus`);

  // ⚠ ET AUCUNE BARRE DE PLUS N'ENTRE SANS QU'ON LE VOIE. Les barres de
  // l'Offense sont les seules autres hauteurs fixes, et elles ne coexistent
  // jamais avec celles du Chantier — c'est l'autre écran. Une de plus fait
  // tomber ce compte, ce qui force à REGARDER plutôt qu'à ajouter.
  const barresOffense = ['offense-contexte', 'offense-palette'];
  const fixes = [...feuille.matchAll(/#([a-zA-Z-]+)\s*\{[^}]*flex:\s*0 0 \d+px/g)]
    .map((m) => m[1]);
  assert.deepEqual(fixes.slice().sort(), [...barres, ...barresOffense].sort(),
    'une barre à hauteur fixe est apparue ou a disparu : le chrome a changé');

  // ⚠ ET L'ÉCRAN OFFENSE SE MESURE AUSSI, DEPUIS QU'IL A SA BARRE CONTEXTUELLE
  // (29/08). Il partage l'en-tête et la barre du bas ; ce qui lui est propre,
  // ce sont sa barre contextuelle et sa palette. Le total doit tenir sous la
  // même borne que le Chantier, sans quoi la consigne « tu compresses tout dans
  // l'ui » serait respectée d'un côté et pas de l'autre.
  const communes = ['tete-onglets', 'ressources', 'navigation', 'barre-bas'];
  const chromeOffense = [...communes, ...barresOffense]
    .reduce((t, id) => t + hauteur(id), 0);
  assert.equal(chromeOffense, 288, `chrome Offense de ${chromeOffense} px : recalculer la borne`);
  assert.ok(chromeOffense <= 320, `${chromeOffense} px de barres fixes sur l'Offense, 320 au plus`);

  // Le champ, lui, absorbe : il est `flex: 1` et peut rétrécir.
  assert.match(feuille, /#chantier-champ \{[^}]*flex: 1[^}]*min-height: 0/);

  // ⚠⚠ RIEN NE DÉFILE HORIZONTALEMENT, SAUF LA PALETTE, ET L'EXCEPTION SE
  // NOMME. L'interdiction date du lot MISE EN PAGE : un défilement coupait la
  // première vignette, et le joueur ne savait pas qu'il y avait autre chose.
  // Ethan la lève le 03/09, pour la palette SEULE : « une seule bande […] + une
  // barre de défilement. Garder la hauteur, comme ça les boutons seront gros. »
  // Ce qu'il achète est mesurable — 38 px de vignette contre 76 —, et ce qu'il
  // paie est que la palette ne montre plus tout d'un coup. L'interdiction reste
  // TOTALE sur les cinq autres barres : une barre de compteurs qui défile
  // cacherait un nombre, ce qu'aucun geste ne ferait réapparaître.
  const DEFILE_A_L_HORIZONTALE = ['chantier-palette'];
  for (const id of barres) {
    const bloc = feuille.match(new RegExp(`#${id}\\s*\\{([^}]*)\\}`))[1];
    if (DEFILE_A_L_HORIZONTALE.includes(id)) {
      assert.match(bloc, /overflow-x:\s*auto/, `#${id} devait défiler, et ne défile pas`);
      continue;
    }
    assert.ok(!/overflow-x:\s*auto/.test(bloc), `#${id} défile horizontalement`);
    assert.ok(!/overflow-x:\s*scroll/.test(bloc), `#${id} défile horizontalement`);
  }

  // Le bandeau contextuel porte QUATRE boutons depuis ce lot, et sa hauteur n'a
  // pas bougé : ce sont les écarts et le bloc de gauche qui ont cédé la place.
  assert.equal(Object.keys(ACTIONS).length, 4);
  assert.equal(hauteur('chantier-contexte'), 46);
});

// ---------------------------------------------------------------------------
// Les deux compteurs qui ont cessé d'être des tirets — lot GARNISON-ET-ARMÉE
// ---------------------------------------------------------------------------

/** Une base assez grande pour porter les deux bâtiments de commandement. */
/**
 * Une base avec ses deux QG, et éventuellement ses trois bâtiments de production.
 *
 * ⚠ LES TROIS PRODUCTIONS SONT UN CHOIX DU MONTAGE DEPUIS LE 29/08. Une unité
 * ne se construit plus sans son bâtiment — Caserne, Dépôt de véhicules,
 * Aérodrome —, si bien qu'un montage qui les oublie mesure le verrou du
 * BÂTIMENT là où il croit mesurer celui du niveau. On les pose donc quand le
 * test parle de niveaux, et on les omet quand il parle du bâtiment.
 */
function baseAvecCommandement(niveauOffense = 3, niveauDefense = 2, avecProduction = false,
  acquisesDefense = null) {
  const etat = creerEtat(20260828);
  baseCourante(etat).disposition[0].niveau = 12; // assez d'emplacements, sinon la base est illégale
  baseCourante(etat).disposition.push(
    { id: 'centreDeCommandement', rangee: 11, colonne: 1, niveau: niveauOffense },
    { id: 'qgDeDefense', rangee: 11, colonne: 8, niveau: niveauDefense },
  );
  if (avecProduction) {
    baseCourante(etat).disposition.push(
      { id: 'caserne', rangee: 11, colonne: 3, niveau: 1 },
      { id: 'depotDeVehicules', rangee: 11, colonne: 5, niveau: 1 },
      { id: 'aerodrome', rangee: 13, colonne: 1, niveau: 1 },
    );
  }
  for (let i = baseCourante(etat).economie.residus.length; i < baseCourante(etat).disposition.length; i += 1) {
    baseCourante(etat).economie.residus.push({ quartz: 0, scorie: 0, electricite: 0 });
  }
  // ⚠ DEPUIS LE LOT RECHERCHE, C'EST L'ACHAT QUI OUVRE, PAS LE NIVEAU. Un
  // montage qui veut mesurer autre chose que ce verrou-là doit donc dire ce
  // qu'il a acheté ; `null` laisse les gratuites d'une partie neuve.
  if (acquisesDefense !== null) etat.recherche.acquises.defense = [...acquisesDefense].sort();
  return etat;
}

test('compteur — la défense et l\'offense montrent un nombre dès que leur QG est posé', () => {
  const etat = baseAvecCommandement(3, 2);

  // Sans rien de posé : zéro engagé, mais un budget, donc une capacité.
  const videOff = compteurDeContexte(etat, 'offense');
  assert.equal(videOff.valeur, '0');
  assert.equal(videOff.capacite, `/ ${budgetOffense(3)}`);
  assert.equal(videOff.sature, false);

  // Deux unités posées : le compteur suit, en POINTS d'armée et non en pièces.
  poserEffectif(etat, 'armee', { id: 'meute', vague: 1, colonne: 1, niveau: 1 }); // 5 pts
  poserEffectif(etat, 'armee', { id: 'enclume', vague: 1, colonne: 2, niveau: 1 }); // 15 pts
  const plein = compteurDeContexte(etat, 'offense');
  assert.equal(plein.valeur, formaterEntier(UNITES.meute.points + UNITES.enclume.points));
  // Falsifiable : ce n'est PAS un compte de pièces. Deux unités, vingt points.
  assert.notEqual(plein.valeur, '2', 'le compteur compte les pièces au lieu des points');

  // La garnison a son propre compteur, et il ne bouge pas quand l'armée bouge.
  const def = compteurDeContexte(etat, 'defense');
  assert.equal(def.valeur, '0');
  assert.equal(def.capacite, `/ ${budgetDefense(2)}`);
  poserEffectif(etat, 'garnison', { id: 'merlon', rangee: 3, colonne: 1, niveau: 1 });
  assert.equal(compteurDeContexte(etat, 'defense').valeur, formaterEntier(DEFENSES.merlon.points));
  assert.equal(compteurDeContexte(etat, 'offense').valeur, plein.valeur, 'les deux forces se mélangent');
});

test('compteur — la saturation se dit quand le budget est atteint, jamais avant', () => {
  const etat = baseAvecCommandement(1, 1);
  const budget = budgetOffense(1);
  let engages = 0;
  let colonne = 1;
  while (engages + UNITES.enclume.points <= budget && colonne <= 9) {
    poserEffectif(etat, 'armee', { id: 'enclume', vague: 1, colonne, niveau: 1 });
    engages += UNITES.enclume.points;
    colonne += 1;
  }
  // Falsifiable : le montage doit vraiment APPROCHER le budget.
  assert.ok(engages > 0 && engages <= budget, `${engages} points pour un budget de ${budget}`);
  const vue = compteurDeContexte(etat, 'offense');
  assert.equal(vue.valeur, formaterEntier(engages));
  assert.equal(vue.sature, engages >= budget);
});

test('résumé — les trois niveaux du joueur sont désormais trois moyennes', () => {
  const etat = baseAvecCommandement();

  // Rien de posé : deux des trois sont `null`, donc « — » à l'écran. C'est
  // l'état d'une base neuve, et ce n'est pas un défaut de calcul.
  const vide = resumeDeLaBase(etat).niveaux;
  assert.ok(Number.isInteger(vide.batiments), 'le niveau des bâtiments existe toujours');
  assert.equal(vide.defense, null);
  assert.equal(vide.assaut, null);
  assert.equal(formaterNiveau(vide.defense), NIVEAU_ABSENT);

  // Deux unités de niveaux 2 et 8 : moyenne 5,0, en dixièmes entiers.
  poserEffectif(etat, 'armee', { id: 'meute', vague: 1, colonne: 1, niveau: 2 });
  poserEffectif(etat, 'armee', { id: 'meute', vague: 1, colonne: 2, niveau: 8 });
  const plein = resumeDeLaBase(etat).niveaux;
  assert.equal(plein.assaut, 50);
  assert.equal(formaterNiveau(plein.assaut), '5,0');
  // Et la défense reste absente : les trois niveaux sont indépendants.
  assert.equal(plein.defense, null);

  // ⚠ UN ÉTAT AMPUTÉ EST NOMMÉ ICI, pas au fond de `sim/`.
  const ampute = { ...etat };
  delete ampute.bases[0].garnison;
  assert.throws(() => resumeDeLaBase(ampute), /état de jeu absent ou malformé/);
});

// ---------------------------------------------------------------------------
// La bande Défense devient éditable — lot GARNISON-ET-ARMÉE, 28/08
// ---------------------------------------------------------------------------

test('défense — les sigles couvrent le roster, et aucun ne se confond avec un autre', () => {
  assert.deepEqual(Object.keys(SIGLES_DEFENSE).sort(), [...rosterDefensif()].sort());

  // ⚠ DISTINCTS DES SIGLES DE BÂTIMENT AUSSI. Les deux se dessinent sur la
  // MÊME grille, l'un au-dessus de l'autre : deux pièces qui portent le même
  // sigle sont deux pièces qu'on confond à l'œil, ce que le sigle doit
  // précisément empêcher. « CHA » est pris par le Chantier, d'où « CHS » pour
  // le Chasseur.
  const tous = [...Object.values(SIGLES), ...Object.values(SIGLES_DEFENSE)];
  assert.equal(new Set(tous).size, tous.length, 'deux sigles identiques sur la même grille');
  assert.equal(tous.length, 28, 'onze bâtiments et dix-sept pièces de garnison');
  for (const sigle of Object.values(SIGLES_DEFENSE)) {
    assert.match(sigle, /^[A-Z]{3}$/, `« ${sigle} » n'est pas un sigle de trois lettres`);
  }

  // Le nom qui fait foi reste celui du joueur, jamais celui de l'Ouvrage.
  assert.equal(nomDeLaPieceDeDefense('merlon'), DEFENSES.merlon.nom.joueur);
  assert.equal(nomDeLaPieceDeDefense('meute'), UNITES.meute.nom.joueur);
  assert.throws(() => nomDeLaPieceDeDefense('collecteur'), /rôle en défense/);
});

test('défense — la palette est grise sans QG, et s\'ouvre avec son niveau', () => {
  const neuve = creerEtat(11);
  const sansQg = posablesDeLaDefense(neuve);
  assert.equal(sansQg.length, 17);
  assert.ok(sansQg.every((p) => p.verrouille), 'la palette est vive sans QG de défense');

  assert.ok(sansQg.every((p) => /QG de défense/.test(p.raison)),
    'sans QG, la raison devrait nommer le QG de défense');

  // ⚠⚠ CE BLOC A CHANGÉ DE PORTE AU LOT RECHERCHE, PAS D'INTENTION. Les pièces
  // s'ouvraient par NIVEAU D'APPARITION ; elles s'ouvrent désormais par ACHAT
  // (arbitrage d'Ethan du 30/08). Ce qui ne change pas — et qui est le vrai
  // sujet du test — c'est que les autres RESTENT dans la palette, grisées :
  // arbitrage du 28/08 sur les uniques, « griser le bouton, pas le faire
  // disparaître ». Une palette qui change de longueur déplace les vignettes
  // sous le doigt.
  const achetees = ['merlon', 'meute', 'casemate', 'herse'];
  const avecQg = baseAvecCommandement(3, 8, true, achetees);
  const ouverte = posablesDeLaDefense(avecQg);
  assert.equal(ouverte.length, 17, 'la palette a changé de longueur');
  const vives = ouverte.filter((p) => !p.verrouille);
  assert.ok(vives.length > 0, 'aucune pièce ouverte alors que quatre sont achetées');
  assert.ok(vives.length < 17, 'toutes les pièces sont ouvertes');
  for (const p of ouverte) {
    assert.equal(p.verrouille, !achetees.includes(p.id), `${p.id} : verrou incohérent`);
  }

  // Falsifiable : acheter tout le roster doit VRAIMENT tout ouvrir.
  const haut = baseAvecCommandement(3, 50, true, rosterDefensif());
  assert.ok(posablesDeLaDefense(haut).every((p) => !p.verrouille),
    'tout le roster acheté et la palette verrouille encore');
  // ⚠ ET LE NIVEAU, LUI, N'OUVRE PLUS RIEN : c'est le renversement du lot.
  const niveauSeul = baseAvecCommandement(3, 50, true);
  assert.ok(posablesDeLaDefense(niveauSeul).some((p) => p.verrouille),
    'le niveau 50 seul ouvre encore des pièces');

  // ⚠⚠ ET LA RÈGLE DU BÂTIMENT DE PRODUCTION VAUT AUSSI EN GARNISON, arbitrée
  // le 29/08 : « infanterie inconstructible sans caserne, même règle pour
  // véhicule et avion ». Ethan ne l'a pas restreinte à un écran, donc elle ne
  // l'est pas. Sans les trois bâtiments, au niveau 50, seules les pièces qui
  // ne sont PAS des unités restent posables — un mur n'a pas besoin d'une
  // caserne.
  const sansProduction = posablesDeLaDefense(
    baseAvecCommandement(3, 50, false, rosterDefensif()),
  );
  for (const p of sansProduction) {
    const estUneUnite = UNITES[p.id] !== undefined;
    assert.equal(p.verrouille, estUneUnite,
      `${p.id} : seules les unités demandent un bâtiment de production`);
    if (estUneUnite) {
      assert.match(p.raison, /^sans .+, pas d/, `${p.id} : la raison ne nomme pas le bâtiment`);
    }
  }
  // Le montage doit voir les deux familles, sinon il ne distingue rien.
  assert.ok(sansProduction.some((p) => UNITES[p.id] !== undefined), 'aucune unité dans le roster');
  assert.ok(sansProduction.some((p) => UNITES[p.id] === undefined), 'aucun ouvrage fixe');
});

test('défense — le détail d\'une pièce dit son niveau et ses points', () => {
  const etat = baseAvecCommandement(3, 20);
  poserEffectif(etat, 'garnison', { id: 'faucheuse', rangee: 6, colonne: 4, niveau: 3 });
  const vue = detailDeLaDefense(etat, 0);
  assert.equal(vue.nom, DEFENSES.faucheuse.nom.joueur);
  assert.equal(vue.niveau, 3);
  assert.ok(vue.detail.includes('Niv. 3'));
  assert.ok(vue.detail.includes(String(DEFENSES.faucheuse.points)));
  assert.throws(() => detailDeLaDefense(etat, 4), RangeError);
});

test('défense — les deux terrains balaient CHACUN leur bande, et pas l\'autre', () => {
  const etat = baseAvecCommandement(3, 50);

  // ⚠ ON NE BALAIE QUE LA BANDE DU TERRAIN. Ailleurs la réponse serait « hors
  // de la bande » quatre-vingt-dix fois, pour rien.
  // ⚠ SOIXANTE-DEUX ET NON SOIXANTE-DOUZE DEPUIS LE LOT OBSTACLES. Les dix
  // obstacles vivent tous dans la bande de défense, et une case obstruée n'est
  // pas posable. Le nombre se CALCULE — 72 moins le compte de la table — au lieu
  // d'être réécrit : le jour où `OBSTACLES.nombre` bougera, ce test suivra au
  // lieu de tomber.
  const casesDefense = casesPosablesDuTerrain(etat, 'defense', 'merlon');
  const rangeesDefense = GRILLE.bandes.defense.derniere - GRILLE.bandes.defense.premiere + 1;
  const libres = rangeesDefense * GRILLE.largeur - baseCourante(etat).obstacles.cases.length;
  assert.equal(libres, 62, 'le montage doit porter les dix obstacles, sinon il ne mesure rien');
  assert.equal(casesDefense.length, libres, 'huit rangées de neuf, moins les obstacles');
  // Et aucune case posable ne porte d'obstacle — la soustraction ci-dessus
  // pourrait tomber juste en retirant les mauvaises cases.
  const obstrues = new Set(baseCourante(etat).obstacles.cases.map((o) => `${o.rangee}:${o.colonne}`));
  for (const c of casesDefense) {
    assert.ok(!obstrues.has(`${c.rangee}:${c.colonne}`),
      `case posable en (${c.rangee}, ${c.colonne}), qui porte un obstacle`);
  }
  for (const { rangee } of casesDefense) {
    assert.ok(rangee >= GRILLE.bandes.defense.premiere && rangee <= GRILLE.bandes.defense.derniere,
      `le balayage de la défense sort de sa bande, rangée ${rangee}`);
  }

  const casesBase = casesPosablesDuTerrain(etat, 'batiments', 'raffinerie');
  for (const { rangee } of casesBase) {
    assert.ok(rangee >= GRILLE.bandes.batiments.premiere,
      `le balayage de la base sort de sa bande, rangée ${rangee}`);
  }
  // Les deux ensembles sont DISJOINTS : c'est ce qui fait deux terrains.
  const enDefense = new Set(casesDefense.map((c) => `${c.rangee}:${c.colonne}`));
  assert.ok(casesBase.every((c) => !enDefense.has(`${c.rangee}:${c.colonne}`)));

  // Une pièce posée retire sa case, et le déplacement la retrouve : rester sur
  // place est légal.
  const libre = casesDefense[0];
  poserEffectif(etat, 'garnison', { ...libre, id: 'merlon', niveau: 1 });
  const apres = casesPosablesDuTerrain(etat, 'defense', 'ronce');
  assert.equal(apres.length, libres - 1, 'la case occupée sort des posables');
  const deplacables = casesDeplacablesDuTerrain(etat, 'defense', 0);
  assert.equal(deplacables.length, libres, 'sa propre case doit rester une arrivée légale');
  assert.ok(deplacables.some((c) => c.rangee === libre.rangee && c.colonne === libre.colonne));
});

test('défense — la table des terrains dit tout ce qui les sépare, et rien de plus', () => {
  assert.deepEqual(Object.keys(TERRAINS).sort(), ['batiments', 'defense']);

  // ⚠ LE TERRAIN DES BÂTIMENTS RÉUTILISE `ACTIONS`, il ne la recopie pas.
  // C'est la même table sous un second nom : deux copies finiraient par dire
  // deux choses différentes d'« améliorer ».
  assert.equal(TERRAINS.batiments.actions, ACTIONS);
  assert.equal(TERRAINS.batiments.panneau, true);
  assert.equal(TERRAINS.batiments.force, null);

  // ⚠ DEUX ACTIONS SANS MOTEUR EN DÉFENSE, ET `null` LE DIT. Le coût d'une
  // amélioration existe depuis l'arbitrage du 28/08, le moteur non : rien dans
  // `sim/` ne monte une pièce de garnison. Réparer n'existe nulle part.
  assert.equal(TERRAINS.defense.actions.ameliorer, null);
  assert.equal(TERRAINS.defense.actions.reparer, null);
  assert.ok(typeof TERRAINS.defense.actions.demolir.agir === 'function');
  assert.equal(TERRAINS.defense.actions.deplacer.cible, true);
  assert.equal(TERRAINS.defense.panneau, false);
  assert.equal(TERRAINS.defense.force, 'garnison');

  // Les deux terrains couvrent les mêmes quatre noms d'action : un bouton sans
  // entrée ferait lever au toucher au lieu de répondre.
  assert.deepEqual(
    Object.keys(TERRAINS.defense.actions).sort(), Object.keys(ACTIONS).sort(),
  );

  // Et le refus se dit, il ne reste pas muet — « un indice n'est pas une
  // interdiction » : un bouton mort n'apprend rien.
  assert.ok(actionSansMoteur('Améliorer', 'la défense').includes('Améliorer'));
  assert.match(actionSansMoteur('X', 'la défense'), /trancher seul/);
  // ⚠ ET LE « POUR QUOI » EST OBLIGATOIRE. Il valait « la défense » en dur ;
  // l'écran Offense affichait donc « pour la défense » à un joueur qui compose
  // son armée. Un appel sans destinataire LÈVE plutôt que d'en inventer un.
  assert.match(actionSansMoteur('X', 'l\'armée'), /pour l'armée/);
  assert.throws(() => actionSansMoteur('X'), /de quoi elle parle/);
});

test('défense — le geste de pose n\'est écrit QU\'UNE FOIS', () => {
  // ⚠ C'EST L'EXIGENCE EXPLICITE DU BRIEF : « Réemployer les fonctions
  // existantes de ui/chantier.js, pas les recopier. Un test doit refuser une
  // seconde implémentation du geste de pose. » Les deux bandes vivent dans le
  // même écran, sous le même doigt : deux implémentations auraient divergé au
  // premier ajustement, et la divergence se lirait comme un bogue de jeu.
  const source = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));

  for (const geste of ['tenterLaPose', 'tenterLeDeplacement', 'peindrePalette', 'executerAction']) {
    const occurrences = source.match(new RegExp(`function ${geste}\\(`, 'g')) ?? [];
    assert.equal(occurrences.length, 1, `${geste} est écrite ${occurrences.length} fois`);
  }

  // ⚠⚠ COMPTER LES NOMS DE FONCTION NE SUFFIT PAS, ET LA FALSIFICATION L'A
  // MONTRÉ. La première version de cette garde ne comptait que
  // `function tenterLaPose(` : une copie déposée sous le nom
  // `tenterLaPoseEnDefense` passait au travers, et la suite restait VERTE avec
  // deux implémentations du même geste dans le fichier. Ce qu'il faut compter,
  // ce sont les APPELS AU MOTEUR — une seconde implémentation qui pose vraiment
  // doit bien appeler quelque chose. Chacun de ces points d'entrée n'a qu'UN
  // site d'appel, et il est dans la table des terrains.
  for (const appel of ['poserBatiment(', 'poserEffectif(', 'retirerEffectif(',
    'deplacerEffectif(', 'problemesDeLaPoseDEffectif(', 'problemesDuDeplacementDEffectif(']) {
    const n = source.split(appel).length - 1;
    assert.equal(
      n, 1,
      `${appel} est appelé ${n} fois dans l'écran : la table des terrains doit être `
        + 'le seul chemin vers le moteur',
    );
  }

  // Et le geste passe par la TABLE, jamais par un nom de terrain écrit à la
  // main : un cas particulier serait le premier à diverger.
  assert.match(source, /terrain\.poser\(/, 'la pose n\'appelle plus le terrain');
  assert.match(source, /terrain\.problemesDeLaPose\(/);
  assert.ok(!/=== 'defense'/.test(source), 'un cas particulier « defense » est écrit à la main');
  assert.ok(!/=== 'garnison'/.test(source), 'un cas particulier « garnison » est écrit à la main');

  // ⚠ ET LA PALETTE SUIT LE TERRAIN. Sans ce rappel, le joueur descendrait sur
  // la bande Défense avec les vignettes des onze bâtiments sous les yeux.
  assert.match(source, /function marquerBandeActive\([\s\S]{0,1200}peindrePalette\(/,
    'la palette ne se repeint plus quand on change de bande');

  // ⚠ ET CHANGER DE BANDE NE VIDE PAS LA LIGNE DE MODE. L'action armée SURVIT
  // au changement — elle s'applique à ce qu'on touche — donc effacer son
  // message laisserait « Démolir » actif et muet, et le bâtiment suivant qu'on
  // touche disparaîtrait sans un mot. C'est le défaut relevé par Ethan le 28/08
  // sur les boutons d'action, qui serait revenu par la porte du défilement.
  const corpsBande = source.slice(source.indexOf('function marquerBandeActive('));
  const finBande = corpsBande.indexOf('\n  }');
  const dansLaBande = corpsBande.slice(0, finBande);
  assert.ok(dansLaBande.length > 100, 'le découpage de marquerBandeActive ne trouve rien');
  assert.ok(!/ligneDeMode\(''\)/.test(dansLaBande),
    'changer de bande vide la ligne de mode alors que l\'action reste armée');
  assert.match(dansLaBande, /ligneDeMode\(actionArmee === null/,
    'le mot du mode n\'est plus remis après un changement de bande');

  // Falsifiable : le montage doit trouver de vraies fonctions, sinon zéro
  // occurrence passerait pour « écrite une fois ».
  assert.ok(source.includes('function tenterLaPose('), 'ce n\'est pas le bon fichier');
});

test('obstacles — l\'écran les dessine, et il sait dire qui ils ralentissent', () => {
  // ⚠ LES DEUX TABLES DOIVENT COUVRIR `OBSTACLES.types`, DANS LES DEUX SENS. Un
  // type ajouté à la table de combat sans sigle ici dessinerait « undefined »
  // dans la case, et personne ne le verrait avant l'appareil.
  assert.deepEqual(Object.keys(SIGLES_OBSTACLE).sort(), [...OBSTACLES.types].sort());
  assert.deepEqual(Object.keys(LIBELLES_OBSTACLE).sort(), [...OBSTACLES.types].sort());

  // Un sigle par type, tous distincts : deux types qui partagent une lettre ne
  // se distingueraient pas à l'écran.
  const sigles = Object.values(SIGLES_OBSTACLE);
  assert.equal(new Set(sigles).size, sigles.length);
  for (const s of sigles) assert.equal(s.length, 1, `« ${s} » n'est pas une lettre`);
  for (const l of Object.values(LIBELLES_OBSTACLE)) assert.ok(l.length > 8);
});

// ---------------------------------------------------------------------------
// Le lot PREMIÈRE-COUCHE : les sprites entrent à l'écran
// ---------------------------------------------------------------------------

test('écran — le fond d\'atlas passe par une règle PARTAGÉE, jamais par élément', () => {
  // ⚠⚠ C'EST LE CORRECTIF DU FREEZE, ET LA GARDE PORTE SUR LA CAUSE MESURÉE.
  // Arriver sur l'écran de la base coûtait 3,1 s : Chromium décode l'atlas UNE
  // FOIS PAR SUBSTITUTION DE `var()`, donc 670 fois pour 162 cases à quatre
  // couches. Mesuré, en ne gardant que les n premières couches : 1 couche
  // 533 ms · 2 couches 1 500 ms · 4 couches 3 133 ms — une droite à 0,78 s la
  // couche. La même liste posée UNE fois dans une règle de feuille rend 33 ms,
  // à capture IDENTIQUE À L'OCTET sur une partie épinglée.
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));

  // ⚠ FALSIFIABLE : le montage doit d'abord prouver qu'il mesure quelque chose.
  // Si plus personne ne posait de fond, toutes les interdictions ci-dessous
  // seraient vraies sur un écran qui ne dessine rien.
  const poses = (ecran.match(/poserLesAtlas\(/g) ?? []).length;
  assert.ok(poses >= 4, `${poses} appels à poserLesAtlas : sa définition et ses trois poseurs`);

  // LA RÉGRESSION A UNE FORME, ET C'EST CELLE-CI : une image d'atlas écrite
  // dans le style d'un élément. Elle revenait par `poserFonds`, par
  // `poserCouches` ou par le mur de contour — les trois passent désormais par
  // la règle partagée.
  assert.doesNotMatch(ecran, /style\.backgroundImage\s*=/,
    'une image de fond est réécrite par élément : le freeze revient');

  // ⚠⚠ ET L'ADRESSE SE LIT, ELLE NE S'ÉCRIT PAS. L'inliner ici la mettrait une
  // SECONDE fois dans le livrable — 507 464 octets mesurés au lot
  // SPRITES-ET-ZOOM — et le build refuserait une adresse assemblée à
  // l'exécution. On demande à la page ce que `tools/build.js` y a mis, comme
  // `garnirLesAtlas` le fait déjà pour le `src` d'une balise.
  assert.doesNotMatch(ecran, /url\(/,
    'l\'écran fabrique une adresse `url(` au lieu de lire celle du build');
  assert.match(ecran, /getComputedStyle\(doc\.documentElement\)[\s\S]{0,400}?getPropertyValue\(/,
    'l\'adresse de l\'atlas ne se lit plus sur le document');

  // La séquence reste LISIBLE sur l'élément : `fondsPoses` relit ce qui a été
  // posé pour empiler une couche de plus, et un nom de classe ne dit pas de
  // quels atlas il est fait.
  assert.match(ecran, /dataset\.fond\s*=/, 'la séquence d\'atlas n\'est plus retenue sur l\'élément');
  assert.match(ecran, /function fondsPoses\(case_\)[\s\S]{0,600}?dataset\.fond/,
    '`fondsPoses` ne relit plus la séquence là où elle est écrite');

  // ⚠ UNE VARIABLE VIDE LÈVE, elle ne dessine pas du vide — même règle que
  // `garnirLesAtlas` et qu'`executer` de `render/canvas2d.js`.
  assert.match(ecran, /valeur === ''[\s\S]{0,200}?throw new RangeError/,
    'une variable d\'atlas vide ne fait plus lever');
});

test('écran — les 162 cases reçoivent un sol, et il vient de l\'atlas DU MONDE', () => {
  // ⚠ GARDE DE TEXTE, comme ses voisines : le dépôt n'a ni jsdom ni navigateur,
  // ce qui touche le DOM ne s'automatise pas ici (CLAUDE.md §3). Ce qu'on PEUT
  // confronter sans navigateur, c'est que l'écran demande son sol au module
  // d'atlas plutôt que de composer un nom de fichier à la main.
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));

  assert.match(ecran, /from '\.\.\/render\/sprite\.js'/,
    'l\'écran ne lit plus l\'atlas par `render/sprite.js`');
  assert.match(ecran, /from '\.\.\/render\/variante\.js'/,
    'l\'écran ne tire plus sa variante par `render/variante.js`');

  // Le sol est posé sur TOUTES les cases, donc dans une boucle sur `cellules`,
  // et non sur les seules cases qui portent quelque chose.
  assert.match(ecran, /for \(const case_ of cellules\.values\(\)\)[\s\S]{0,400}?fondsDuSol\(/,
    'le sol n\'est pas posé sur l\'ensemble des cases');

  // ⚠ ET IL EST UN FOND, PAS UN ENFANT. Un `createElement` par case ferait 162
  // nœuds à créer et à retirer à chaque geste — quatre fois plus depuis que le
  // sol fait 2 × 2 — et il faudrait penser à les retirer, ce que la boucle de
  // remise à zéro ne fait pas.
  // ⚠ LE MOT A CHANGÉ, PAS LA PROPRIÉTÉ GARDÉE. `poserFonds` écrivait
  // `backgroundImage` en ligne ; depuis le correctif du freeze, l'image vient
  // d'une CLASSE partagée et seules la taille et la position restent en ligne.
  // Ce qu'on veut savoir est le même qu'avant — les couches sont un FOND, pas
  // des enfants —, et les trois lignes ci-dessous le disent mieux que le nom de
  // la propriété : `poserFonds` délègue l'image, et pose les deux autres.
  assert.match(ecran, /function poserFonds\(case_, fonds\)[\s\S]{0,400}?poserLesAtlas\(/,
    'les couches de fond ne passent plus par `poserLesAtlas`');
  assert.match(ecran, /function poserFonds\(case_, fonds\)[\s\S]{0,400}?backgroundSize/,
    '`poserFonds` ne pose plus la taille des couches');
  assert.match(ecran, /function poserFonds\(case_, fonds\)[\s\S]{0,400}?backgroundPosition/,
    '`poserFonds` ne pose plus la position des couches');
  assert.doesNotMatch(ecran, /createElement\('div'\)[\s\S]{0,120}?className = 'sol'/,
    'le sol est redevenu un élément enfant');

  // Les deux couches de terrain qui restent — le champ et l'obstacle — viennent
  // du même point d'appel : une seconde façon de nommer un sprite de terrain
  // finirait par nommer autrement.
  assert.equal((ecran.match(/fondDuTerrain\(/g) ?? []).length, 3,
    'le nombre d\'appels à `fondDuTerrain` a changé — deux poses plus sa définition');

  // ⚠⚠ ET LE SOL NE VIENT PLUS DE L'ATLAS DE LA BASE. Ethan, 30/08 : « changer
  // le terrain de la base. Utiliser les sprites terrain monde (en 2 × 2) ». Les
  // quatre `tile_sol_j_*` étaient quatre dessins pour cent soixante-deux cases,
  // et la répétition se lisait d'un coup d'œil.
  assert.doesNotMatch(ecran, /tile_sol_j/,
    'le sol de la base repasse par les quatre tuiles de l\'atlas de la base');
  assert.match(ecran, /sol: 'var\(--atlas-sol\)'/,
    'la table des atlas ne porte plus celui du sol');

  // ⚠ QUATRE COUCHES, PAS UNE, et le nombre se LIT dans `ZOOM_CARTE`. L'écrire
  // ici ferait la troisième vérité sur le découpage d'une case.
  assert.match(ecran, /const divisions = ZOOM_CARTE\.tuilesParCase/,
    'le découpage du sol ne suit plus la table du monde');
  assert.equal(ZOOM_CARTE.tuilesParCase, 2, 'le sol de la base n\'est plus en 2 × 2');

  // ⚠ ET LA VARIANTE SE PREND SUR LA SOUS-CASE. Sur la case, les quatre
  // quartiers tireraient le MÊME dessin — quatre fois le même carré — et le
  // 2 × 2 n'apporterait rien du tout. Le montage le mesure au lieu de le lire :
  // on demande les quatre couches d'une case et on exige qu'elles diffèrent.
  const parAxe = 16;
  const couches = fondsDuSol(parAxe, 20260830, 14, 4);
  assert.equal(couches.length, 4, `${couches.length} couches de sol au lieu de quatre`);
  assert.equal(new Set(couches.map((c) => c.position)).size, 4,
    'les quatre quartiers se posent au même endroit');
  // Falsifiable : sur une graine et une case, deux voisines ne donnent pas le
  // même sol — sans quoi le tirage serait constant et le test ne mesurerait rien.
  const voisine = fondsDuSol(parAxe, 20260830, 14, 5);
  assert.notDeepEqual(couches.map((c) => c.taille + c.position),
    voisine.map((c) => c.taille + c.position),
    'deux cases voisines reçoivent exactement le même sol');
  // Et toutes viennent bien de l'atlas du monde.
  for (const c of couches) assert.equal(c.image, 'var(--atlas-sol)');
});

test('écran — le jeton de la grille porte un sprite, plus un sigle', () => {
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));

  // ⚠ LE SIGLE DU JETON POSÉ SUR LA GRILLE PART, `SIGLES` ET `sigleDe` RESTENT.
  // La palette de pose s'en sert (`sigle: SIGLES[p.id]`), et le fantôme d'aperçu
  // aussi. Les retirer casserait deux choses pour en corriger une seule.
  //
  // ⚠ LA RAISON A CHANGÉ AU LOT BRANCHEMENT-DÉFENSE, PAS L'EXIGENCE. Ce
  // commentaire disait que la bande de défense « en dépend ENTIÈREMENT, ses
  // seize orientations n'étant pas branchables » : elles le sont depuis le
  // 30/08, et son jeton porte maintenant un sprite. `SIGLES_DEFENSE` reste
  // néanmoins, pour sa palette.
  assert.match(ecran, /sigle: SIGLES\[p\.id\]/, '`SIGLES` a disparu de la palette de pose');
  assert.match(ecran, /sigleDe: \(id\) => SIGLES\[id\]/, '`sigleDe` a disparu du terrain des bâtiments');
  assert.match(ecran, /sigleDe: \(id\) => SIGLES_DEFENSE\[id\]/, '`sigleDe` a disparu du terrain de défense');

  // Le jeton demande ses COUCHES au TERRAIN, jamais à un nom de bande écrit à la
  // main : c'est la même discipline que `panneau` et `cible`, et un test voisin
  // refuse déjà un `=== 'defense'` dans cet écran.
  //
  // ⚠ `spriteDe` REND UNE LISTE DEPUIS LE 30/08, même pour une seule couche. Une
  // tourelle en porte deux — elle-même et son socle — venues de deux atlas
  // différents ; rendre tantôt un nom, tantôt une liste obligerait l'appelant à
  // connaître la différence, c'est-à-dire le cas particulier qu'on refuse.
  //
  // ⚠⚠ LES DEUX BANDES DEMANDENT LEURS COUCHES À `render/scene.js` DEPUIS LE LOT
  // STRUCTURES-AU-COMBAT, ET C'EST L'EXIGENCE QUI S'EST RESSERRÉE, PAS QUI S'EST
  // ASSOUPLIE. Ce test exigeait `spriteDe: couchesDeLaDefense` — une fonction
  // que cet écran PORTAIT — et `[{ famille: 'batiment'` écrit sur place, avec
  // `bat_j_` en dur dans `spriteDuBatiment`. Les deux sont montées dans
  // `scene.js`, où le champ de bataille les lit aussi : une casemate se
  // dessinait de trois façons, un bâtiment de l'Ouvrage était inatteignable.
  // Exiger le POINT D'ENTRÉE UNIQUE interdit ce que les deux formes d'avant
  // laissaient passer — une seconde dérivation du nom, ici.
  assert.equal((ecran.match(/couchesDeLEntite\(/g) ?? []).length, 2,
    'le nombre d\'appels à `couchesDeLEntite` a changé — une pose par bande');
  // ⚠ L'IMPORT S'EST ALLONGÉ LE 30/08 — `genreDeLaGarnison` l'accompagne — et
  // la garde vise le NOM, pas la ligne entière : elle mesurait la forme de
  // l'import là où elle voulait mesurer la dépendance.
  assert.match(ecran, /import \{[^}]*\bcouchesDeLEntite\b[^}]*\} from '\.\.\/render\/scene\.js'/,
    'l\'écran ne consomme plus le point d\'entrée des couches');
  assert.match(ecran, /genre: 'batiment', id: piece\.id/,
    'le terrain des bâtiments ne demande plus ses couches au point d\'entrée');
  // ⚠⚠ L'EXIGENCE S'EST RESSERRÉE LE 30/08, ELLE NE S'EST PAS ASSOUPLIE. Elle
  // demandait `genre: 'defense'` écrit tel quel — et c'était précisément la
  // FAUTE : la bande de garnison porte dix-sept pièces posables, dont HUIT sont
  // des unités de `UNITES`. `couchesDeLEntite` levait dessus, et la levée part
  // de `peindre`, donc poser des Fusiliers en garnison laissait l'écran de la
  // base blanc — mesuré sur `main`. Le genre se DEMANDE maintenant, et ce test
  // refuse qu'on le réécrive en dur.
  assert.match(ecran, /genre: genreDeLaGarnison\(piece\.id\)/,
    'la défense ne demande plus son genre : les huit unités de garnison lèveront');
  assert.doesNotMatch(ecran, /genre: 'defense', id: piece\.id/,
    'le genre de la garnison est de nouveau écrit en dur pour les dix-sept');
  // ⚠ ET AUCUNE DES DEUX NE SE RECALCULE ICI. C'est la moitié qui compte : un
  // écran qui appelle le point d'entrée ET garde sa propre dérivation à côté
  // aurait deux vérités, dont une seule serait branchée.
  assert.doesNotMatch(ecran, /couchesDeLaDefense/,
    'le calcul des couches de défense est revenu dans l\'écran');
  assert.doesNotMatch(ecran, /bat_j_|`bat_\$\{/,
    'le nom de sprite d\'un bâtiment se dérive de nouveau dans l\'écran');
  assert.doesNotMatch(ecran, /spriteDe: null/,
    'une bande se redéclare sans sprite — si c\'est voulu, le dire ici');
  // La porte reste ouverte pour une bande à venir qui n'aurait pas de sprite :
  // le retour au sigle est toujours écrit, il n'est simplement plus emprunté.
  assert.match(ecran, /if \(terrain\.spriteDe === null\)[\s\S]{0,200}?sigleDe\(b\.id\)/,
    'la bande sans sprite ne retombe plus sur son sigle');
  assert.match(ecran, /classList\.add\('sprite'\)/, 'le jeton ne porte plus la classe du sprite');

  // ⚠ LES TROIS LISTES CSS SE COMPTENT. `background-image`, `-size` et
  // `-position` se lisent en parallèle ; une liste plus courte SE RÉPÈTE en
  // silence, et le socle prendrait le cadrage de la tourelle.
  assert.match(ecran, /function poserCouches\(element, couches\)/, '`poserCouches` a disparu');
  assert.match(ecran, /images\.length !== tailles\.length \|\| images\.length !== positions\.length/,
    'les trois listes de fond ne sont plus comptées');

  // ⚠ ET LA RÈGLE DU NOM EST MÉCANIQUE, PAS UNE TABLE DE ONZE LIGNES. Une table
  // serait une seconde vérité, et la première à diverger au douzième bâtiment.
  // Elle est montée dans `render/scene.js` avec la fonction : c'est
  // `test/sprite.test.js` qui l'asserte désormais, sur `couchesDuBatiment`.
  assert.doesNotMatch(ecran, /chantierDeConstruction: 'bat_j_/,
    'une table de correspondance sprite est apparue');
});

test('écran — l\'obstacle perd sa LETTRE, il ne perd pas ce qu\'elle disait', () => {
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  const feuille = sansCommentairesHtml(readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8'));

  // ⚠⚠ ETHAN, 30/08 : « et les petites lettres des obstacles en défense ». Le
  // glyphe de 8 px posé dans un coin de la case part avec les carrés et les
  // traits du même relevé.
  assert.doesNotMatch(ecran, /obstacle-marque/, 'la lettre de l\'obstacle est revenue dans l\'écran');
  assert.doesNotMatch(feuille, /\.obstacle-marque/, 'la lettre de l\'obstacle a repris une règle');

  // ⚠⚠ MAIS CE QU'ELLE DISAIT RESTE JOIGNABLE, ET C'EST LA MOITIÉ QUI COMPTE.
  // « Qui est ralenti » est la seule information de JEU que porte un obstacle,
  // et aucun dessin ne la rend : le joueur n'a pas à deviner si un rocher
  // arrête l'infanterie ou les véhicules. Elle passe dans le `title` de la
  // case. C'est « rien ne se retire en silence » (CLAUDE.md §4) — le lot retire
  // un DESSIN, pas une donnée, et les deux tables restent branchées.
  assert.match(ecran, /case_\.title = `\$\{LIBELLES_OBSTACLE\[o\.type\]\}/,
    'le libellé de l\'obstacle n\'est plus joignable nulle part');
  assert.match(ecran, /SIGLES_OBSTACLE\[o\.type\]/,
    'le sigle de l\'obstacle n\'est plus employé — la table est devenue morte');

  // ⚠ ET LE `title` SE RETIRE AU REPEINT. Un titre laissé en place ferait dire
  // « pétrole » à une case redevenue nue après un tirage d'obstacles différent.
  assert.match(ecran, /case_\.removeAttribute\('title'\)/,
    'le titre d\'une case ne se remet plus à zéro : il survivra à son obstacle');

  // Les quatre classes de terrain partent aussi : elles ne peignaient plus que
  // le fond kaki, le liseré tireté et la lettre. Leur garder une règle pour
  // satisfaire la garde des classes aurait été écrire une décoration pour un
  // test — ce que la feuille refuse nommément depuis le lot PREMIÈRE-COUCHE.
  for (const classe of ['champ', 'obstacle']) {
    assert.doesNotMatch(ecran, new RegExp(`classList\\.add\\('${classe}'`),
      `la classe « ${classe} » est reposée sans qu'une règle la peigne`);
  }
  assert.doesNotMatch(feuille, /\.case\.champ/, 'le fond kaki du champ est revenu');
  assert.doesNotMatch(feuille, /\.case\.obstacle/, 'le liseré de l\'obstacle est revenu');

  // Le sprite, lui, reste : c'est lui qui dit qu'il y a quelque chose là.
  assert.match(ecran, /fondDuTerrain\(`obs_\$\{o\.type\}`/, 'l\'obstacle ne reçoit plus son sprite');

  // Et le champ garde sa ressource dans le nom du sprite : `champ_quartz_a`,
  // jamais un sprite unique recolorisé, que l'atlas ne porte pas.
  assert.match(ecran, /fondDuTerrain\(`champ_\$\{champ\.ressource\}`/,
    'le champ ne reçoit plus le sprite de sa ressource');
});

test('écran — les traits de grille et les carrés des jetons sont partis', () => {
  // ⚠⚠ ETHAN, 30/08, SUR APPAREIL : « enlever les carrés et les traits visibles
  // sur la base. Lié aux anciens bâtiments et ressources. » Ce test tient les
  // trois dessins nommés, un par un, parce qu'ils sont indépendants : les
  // retirer d'un geste et en laisser revenir un seul ne se verrait qu'à l'œil.
  const feuille = sansCommentairesHtml(readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8'));
  const regleCase = feuille.match(/\.case\s*\{([^}]*)\}/)[1];

  // 1. Le quadrillage. Deux liserés qui hachaient le sol.
  assert.doesNotMatch(regleCase, /border-right|border-bottom/,
    'la case a repris un trait de grille');

  // 2. Le bloc kaki en relief du jeton, et son cadre de famille.
  const regleJeton = feuille.match(/\.jeton\s*\{([^}]*)\}/)[1];
  assert.doesNotMatch(regleJeton, /background:\s*#/, 'le jeton a repris un fond uni');
  assert.doesNotMatch(regleJeton, /\bborder:/, 'le jeton a repris une bordure');
  assert.doesNotMatch(regleJeton, /box-shadow/, 'le jeton a repris son relief');
  for (const famille of ['prod', 'mil', 'pivot']) {
    assert.doesNotMatch(feuille, new RegExp(`\\.jeton\\.${famille}[^}]*inset 0 0 0 2px`),
      `le cadre de famille « ${famille} » est revenu sur la grille`);
  }

  // 3. Ce que le cadre disait n'est pas perdu : le titre du jeton le porte.
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  assert.match(ecran, /LIBELLES_FAMILLE\[terrain\.familleDe\(b\.id\)\]/,
    'la famille de coût n\'est plus joignable depuis la grille');
  // ⚠ ET LA TABLE COUVRE EXACTEMENT CE QUE REND `familleDuBatiment`, dans les
  // deux sens : une famille sans libellé afficherait « undefined » dans le
  // titre, et un libellé sans famille serait du texte mort.
  const familles = new Set(Object.keys(BASE_BATIMENTS).map(familleDuBatiment));
  assert.deepEqual([...familles].sort(), Object.keys(LIBELLES_FAMILLE).sort());
  for (const mot of Object.values(LIBELLES_FAMILLE)) assert.ok(mot.length > 3, mot);

  // Falsifiable : le montage lit bien la vraie règle, pas une chaîne vide.
  assert.match(regleCase, /aspect-ratio: 1/, 'la règle de `.case` n\'a pas été lue');
  assert.match(regleJeton, /width:/, 'la règle de `.jeton` n\'a pas été lue');
});

test('écran — le sprite d\'un jeton a grandi de 20 %, et le facteur est écrit', () => {
  // ⚠⚠ ETHAN, 30/08 : « les bâtiments sont bien trop petits, surtout collecteur
  // etc. Augmenter la taille du sprite de 20 %. Pas le choix pour l'instant. »
  // Le « pas le choix pour l'instant » dit que c'est un correctif de cadrage :
  // le facteur vit donc À PART, et se retirera en remettant 1 — pas en
  // recalculant un pourcentage dont plus personne ne saura d'où il vient.
  const feuille = sansCommentairesHtml(readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8'));
  const regle = feuille.match(/\.jeton\s*\{([^}]*)\}/)[1];

  const part = Number(regle.match(/--jeton-part:\s*([\d.]+)%/)[1]);
  const facteur = Number(regle.match(/--jeton-grossissement:\s*([\d.]+)/)[1]);
  assert.equal(part, 84, 'la part de case du jeton a changé sans qu\'on le dise');
  assert.equal(facteur, 1.2, 'le grossissement demandé par Ethan n\'est plus de 20 %');
  assert.match(regle, /width:\s*calc\(var\(--jeton-part\) \* var\(--jeton-grossissement\)\)/,
    'la largeur du jeton ne se compose plus des deux variables');

  // ⚠ ET LE MÊME GROSSISSEMENT VAUT POUR L'UNITÉ DE L'OFFENSE. Ethan a demandé
  // 20 % « sur le sprite », pas « sur l'écran de la base » : deux tailles
  // différentes pour la même chose se liraient comme un défaut de cadrage.
  const piece = feuille.match(/#ecran-offense \.emplacement \.piece\s*\{([^}]*)\}/)[1];
  assert.equal(Number(piece.match(/--jeton-grossissement:\s*([\d.]+)/)[1]), facteur,
    'l\'unité de l\'Offense et le jeton du Chantier ne grossissent plus pareil');
});

test('écran — les deux atlas entrent par une variable CSS, et le pixel art ne se lisse pas', () => {
  const feuille = sansCommentairesHtml(readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8'));

  // ⚠ LES MARQUEURS SONT CEUX DU BUILD, ET `%ATLAS_TERRAIN%` ÉTAIT DÉJÀ PRIS
  // par l'atlas de la carte du monde — d'où `%ATLAS_TERRAIN_BASE%`.
  assert.match(feuille, /--atlas-batiment: url\('%ATLAS_BATIMENT%'\)/,
    'la variable de l\'atlas des bâtiments a disparu');
  assert.match(feuille, /--atlas-terrain: url\('%ATLAS_TERRAIN_BASE%'\)/,
    'la variable de l\'atlas de terrain a disparu');

  // ⚠ SANS `pixelated`, UN PIXEL ART AGRANDI EN FRACTIONNAIRE DEVIENT FLOU. Une
  // case fait ~42 px CSS pour un sprite de 64 : le navigateur interpole.
  assert.match(feuille, /\.case\s*\{[^}]*image-rendering: pixelated/,
    'les cases lissent leur sprite');
  assert.match(feuille, /\.jeton\.sprite\s*\{[^}]*image-rendering: pixelated/,
    'les jetons lissent leur sprite');

  // ⚠ ET LA CASE RESTE CARRÉE. Une cellule d'atlas de 64×64 dans un cadre
  // rectangulaire écraserait tous les sprites, et rien ici ne le dirait.
  assert.match(feuille, /\.case\s*\{[^}]*aspect-ratio: 1/, 'la case n\'est plus carrée');
});

// ---------------------------------------------------------------------------
// Le lot SPRITES-ET-ZOOM : la palette montre ce qu'on pose, la base se zoome
// ---------------------------------------------------------------------------

test('palette — la vignette porte le SPRITE de la pièce, plus un carré kaki', () => {
  // ⚠⚠ ETHAN, 30/08 : « dans les barres de construction du bas (base def off)
  // remplacer les carrés par les sprites correspondant ». C'était un carré de
  // 18 px identique pour les onze bâtiments ET pour les dix-sept pièces de
  // défense : la vignette ne se distinguait que par son libellé, en 7 px.
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  const feuille = sansCommentairesHtml(readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8'));

  assert.match(ecran, /poserCouches\(vignette, terrain\.spriteDe\(/,
    'la vignette de la palette ne porte pas le sprite de sa pièce');

  // ⚠ ET IL VIENT DU TERRAIN, comme le jeton de la case : c'est ce qui garantit
  // que la palette montre exactement ce qu'une pose posera. Une dérivation
  // propre à la palette finirait par montrer autre chose.
  assert.doesNotMatch(ecran, /vignette[^;]{0,80}couchesDeLEntite\(/,
    'la palette dérive ses couches elle-même au lieu de les demander au terrain');

  // Le carré kaki en relief est parti ; la pastille grandit pour qu'un sprite
  // de 64 px y reste lisible.
  const regle = feuille.match(/\.posable i\s*\{([^}]*)\}/)[1];
  assert.doesNotMatch(regle, /background:\s*#/, 'la pastille a repris un fond uni');
  assert.match(regle, /image-rendering: pixelated/, 'la pastille lisse son sprite');
  const cote = Number(regle.match(/width:\s*(\d+)px/)[1]);
  assert.ok(cote >= 24, `la pastille ne fait que ${cote} px : un sprite de 64 n'y tient pas`);

  // ⚠ ET LES DEUX BANDES Y PASSENT. `TERRANS` porte `spriteDe` pour les deux
  // depuis le lot BRANCHEMENT-DÉFENSE ; une palette qui n'aurait branché que
  // les bâtiments laisserait dix-sept carrés en défense.
  for (const [nom, terrain] of Object.entries(TERRAINS)) {
    assert.notEqual(terrain.spriteDe, null, `la bande « ${nom} » n'a pas de sprite`);
  }
});

test('zoom — la base se zoome par la TAILLE d\'une case, jamais par une transformation', () => {
  // ⚠⚠ ETHAN, 30/08 : « possibilité de zoomer sur la base, l'ui reste de même
  // taille » et « zoom carte et base : au doigt, pas de zoom fixe avec + − ».
  //
  // ⚠⚠ ET LE DÉPÔT INTERDIT `transform: scale()` SUR CETTE GRILLE DEPUIS LE LOT
  // POSE-À-L'ÉCRAN, pour une raison qui n'a pas bougé : une transformation
  // déplace le DESSIN sans déplacer la géométrie du pointage, donc le doigt
  // cesse de tomber sur la case qu'il vise. C'est l'assertion qui compte ici —
  // le zoom devait arriver SANS rouvrir cette faute.
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  const feuille = sansCommentairesHtml(readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8'));

  assert.doesNotMatch(ecran, /transform/, 'l\'écran de la base a pris une transformation');
  assert.doesNotMatch(feuille.match(/#chantier-grille\s*\{([^}]*)\}/)[1], /transform/,
    'la grille de la base a pris une transformation');

  // Ce qui change, c'est le côté d'une case, en pixels.
  assert.match(ecran, /grille\.style\.setProperty\('--case-cote'/,
    'le zoom n\'écrit plus le côté d\'une case');
  assert.match(feuille, /#chantier-grille\s*\{[^}]*width: max-content/,
    'la grille ne prend plus sa taille de ses colonnes');
  assert.match(ecran, /repeat\(\$\{GRILLE\.largeur\}, var\(--case-cote\)\)/,
    'les colonnes ne font plus `--case-cote`');

  // ⚠ ET LE CHAMP DÉFILE DANS LES DEUX SENS, sans quoi zoomer ne montrerait
  // rien de plus : les colonnes de droite seraient rognées.
  assert.match(feuille, /#chantier-defile\s*\{[^}]*overflow: auto/,
    'le champ de la base ne défile plus dans les deux sens');

  // ⚠⚠ MAIS LE CHROME, LUI, NE DÉFILE TOUJOURS PAS. « Tu compresses tout dans
  // l'ui » porte sur les barres, et la garde des 288 px continue de le tenir :
  // ce test-ci vérifie seulement qu'on n'a pas ouvert la vanne sur elles.
  for (const id of ['chantier-palette', 'chantier-contexte', 'barre-bas']) {
    const bloc = feuille.match(new RegExp(`#${id}\\s*\\{([^}]*)\\}`))[1];
    assert.doesNotMatch(bloc, /overflow:\s*auto/, `#${id} s'est mis à défiler`);
  }
});

test('zoom — les deux bornes se LISENT, et le geste est un rapport', () => {
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  const feuille = sansCommentairesHtml(readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8'));

  // ⚠ LE PLAFOND VIENT DE L'ATLAS : à `COTE_SPRITE` pixels par case, un pixel
  // de sprite vaut un pixel CSS. Au-delà on agrandirait du pixel art au-dessus
  // de sa propre définition — ce que ce lot vient de retirer à la carte.
  assert.match(ecran, /const COTE_CASE_MAX = COTE_SPRITE/,
    'le plafond du zoom ne se lit plus dans l\'atlas');
  // ⚠⚠ RELU LE 03/09, LOT GRILLE-128, ET C'EST TOUT CE QUE CETTE LIGNE DEMANDE.
  // La grille embarquée est passée de 64 à 128 ; `ZOOM_BASE_MULTIPLE_MAX` est
  // passé de 2 à 1 EN MÊME TEMPS, si bien que le plafond vaut toujours 128 px
  // CSS par case. Le joueur ne voit pas la plage bouger ; ce qu'il gagne, c'est
  // qu'au plafond un pixel de sprite vaut UN pixel CSS au lieu d'être doublé.
  assert.equal(COTE_SPRITE, 128, 'la grille des sprites a changé : relire le plafond du zoom');
  assert.equal(COTE_SPRITE * ZOOM_BASE_MULTIPLE_MAX, 128,
    'le plafond du zoom a bougé en pixels CSS : c\'est une décision, pas un effet de bord');

  // ⚠ LE DÉFAUT VIENT DE LA FEUILLE, pas du code : c'est une décision de mise
  // en page, et l'écrire des deux côtés ferait deux vérités.
  assert.match(feuille, /--case-defaut:\s*\d+px/, 'la feuille ne déclare plus le côté par défaut');
  assert.match(ecran, /getPropertyValue\('--case-defaut'\)/,
    'le code n\'a plus l\'air de lire le défaut dans la feuille');
  assert.doesNotMatch(ecran, /(?<![\w.])46(?![\w.])/,
    'le côté par défaut est recopié en dur dans l\'écran');

  // ⚠ LE PLANCHER EST LA TAILLE QUI FAIT TENIR LA GRILLE, mesurée et non
  // devinée : sous celle-là, le zoom arrière ne montrerait que du vide.
  //
  // ⚠⚠ ET IL DIVISE PAR `largeur + 2` DEPUIS QUE LE MUR EST UN ANNEAU (03/09).
  // La v1 était un TRAIT posé à cheval sur le bord et coûtait deux DEMI-cases ;
  // la v2 est faite de BLOCS pleins qui ceignent la grille, donc deux cases
  // entières. Diviser par neuf redonnerait le défilement horizontal au repos que
  // ce padding existe pour éviter — 414 px dans 360, mesuré le 31/08 —, et
  // diviser par dix laisserait déborder une demi-case de mur de chaque côté,
  // c'est-à-dire le « ça déborde » d'Ethan avec la moitié de son ampleur.
  assert.match(ecran, /Math\.floor\(large \/ \(GRILLE\.largeur \+ 2\)\)/,
    'le plancher du zoom ne compte plus la case de mur de chaque côté');

  // ⚠ ET LES TROIS MOITIÉS DOIVENT S'ACCORDER : le `+ 2` du plancher n'a de sens
  // que si la feuille pose bien une case ENTIÈRE de chaque côté, et que
  // `paddingDeLaGrille` en rend autant. En changer une seule décale le mur du
  // contenu, et personne ne le verrait sans mesurer.
  assert.match(feuille, /#chantier-grille\s*\{[^}]*padding:\s*var\(--case-cote\)/,
    'la grille ne porte plus la case de marge que l\'anneau exige');
  assert.match(ecran, /function paddingDeLaGrille\(\)\s*\{\s*return coteCase;/,
    'le padding vu par le défilement ne vaut plus une case pleine');

  // ⚠⚠ LE GESTE EST UN RAPPORT D'ÉCARTS, PAS UNE DIFFÉRENCE. Une différence en
  // pixels zoomerait plus vite sur un grand écran que sur un petit, pour le
  // même geste de la main — et le réglage trouvé sur un téléphone serait faux
  // sur la tablette suivante.
  assert.match(ecran, /ecartDesDoigts\(deux\) \/ pincement\.ecart/,
    'le pincement de la base ne se mesure plus en rapport');

  // ⚠⚠ ET LE GESTE PASSE PAR LES ÉVÈNEMENTS TACTILES, PAS PAR LES POINTEURS —
  // contrairement à la carte, et pour une raison mesurable. La base est un
  // conteneur qui DÉFILE NATIVEMENT : sous `touch-action: pan-x pan-y`, le
  // navigateur garde le droit de faire défiler à deux doigts, et quand il prend
  // la main il envoie `pointercancel` — le pincement se perdrait au milieu du
  // geste. La carte, elle, est un canevas en `touch-action: none` : rien ne lui
  // dispute le geste. Deux surfaces différentes, deux mécanismes, et c'est
  // écrit des deux côtés.
  assert.match(ecran, /defile\.addEventListener\('touchmove'/,
    'le pincement de la base ne passe plus par les évènements tactiles');

  // ⚠⚠ `{ passive: false }` EST LA MOITIÉ QUI COMPTE. Sans lui,
  // `preventDefault` est IGNORÉ dans un `touchmove` : le code aurait l'air
  // juste, le navigateur défilerait quand même, et la grille glisserait sous
  // les doigts pendant qu'elle grandit. Rien à l'écran ne dirait que c'est
  // l'option qui manque.
  assert.match(ecran, /touchmove'[\s\S]{0,1200}?\{ passive: false \}/,
    'le `touchmove` du pincement est passif : son `preventDefault` sera ignoré');
  assert.match(ecran, /evenement\.preventDefault\(\)/,
    'le pincement ne refuse plus le défilement au navigateur');

  // ⚠ ET LE PINCEMENT SE FERME QUAND UN DOIGT PART. Sans ça, l'écran resterait
  // convaincu qu'on pince encore et le geste suivant partirait d'un mauvais
  // écart de référence.
  assert.match(ecran, /if \(evenement\.touches\.length < 2\) pincement = null/,
    'un doigt levé ne referme plus le pincement');
});

test('zoom — le défaut se lit dans la feuille, et le repli n\'est pas zéro', () => {
  // ⚠ FALSIFIABLE, ET C'EST TOUT L'INTÉRÊT : on donne à la fonction un document
  // truqué, et on vérifie qu'elle lit VRAIMENT la variable — puis qu'elle
  // retombe sur une valeur utilisable quand elle manque. Un repli à zéro ferait
  // une grille invisible, ce qui est pire qu'une grille mal dimensionnée.
  const docAvec = {
    documentElement: {},
    defaultView: { getComputedStyle: () => ({ getPropertyValue: () => ' 52px ' }) },
  };
  assert.equal(coteCaseParDefaut(docAvec), 52);

  const docSans = {
    documentElement: {},
    defaultView: { getComputedStyle: () => ({ getPropertyValue: () => '' }) },
  };
  assert.equal(coteCaseParDefaut(docSans), COTE_SPRITE, 'le repli n\'est plus le côté d\'un sprite');
  assert.ok(coteCaseParDefaut(docSans) > 0, 'le repli rend une grille invisible');

  // Et un document sans vue du tout — le cas d'un test, justement.
  assert.ok(coteCaseParDefaut({ documentElement: {} }) > 0);
});

test('fantôme — il porte le sprite de la pièce, plus un carré à sigle', () => {
  // ⚠⚠ CE QU'ETHAN A VU LE 31/08 : « lorsque le bâtiment est grisé avant de le
  // poser, le jeu affiche encore un carré au lieu du sprite ». Le fantôme était
  // un `div` à fond plein portant trois lettres — juste au 28/08, quand la
  // grille ne dessinait AUCUN sprite, faux depuis le lot PREMIÈRE-COUCHE : la
  // case voisine montre le vrai bâtiment, et le fantôme était devenu le dernier
  // carré de l'écran.
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));

  // Le bloc qui fabrique le fantôme, isolé sur sa classe.
  const debut = ecran.indexOf("marque.className = 'fantome'");
  assert.ok(debut > 0, 'le fantôme ne se fabrique plus sous ce nom');
  const bloc = ecran.slice(debut, debut + 700);

  assert.match(bloc, /poserCouches\(marque,/,
    'le fantôme ne pose pas de sprite : il redessinerait un carré');
  assert.match(bloc, /spriteDe/,
    'le sprite du fantôme doit venir de `terrain.spriteDe`, comme la case et la vignette');
  // ⚠ ET LE SIGLE NE DOIT PLUS ÊTRE DESSINÉ. Il n'est pas perdu — il passe dans
  // le `title` —, mais un `textContent` le remettrait par-dessus le sprite.
  assert.ok(!/marque\.textContent\s*=/.test(bloc),
    'le sigle est redessiné sur le fantôme, par-dessus le sprite');
  assert.match(bloc, /marque\.title\s*=/,
    'le sigle doit survivre dans le `title` — ce qui sort de l\'écran ne sort pas du jeu');
});

test('fantôme — sa règle CSS ne peut plus le remplir d\'un aplat', () => {
  const feuille = sansCommentairesHtml(
    readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8'),
  );
  const regle = feuille.match(/\.fantome\s*\{([^}]*)\}/);
  assert.ok(regle, 'la classe `fantome` n\'a plus de règle');
  const corps = regle[1];

  // ⚠ LE FOND N'EST PAS RENDU TRANSLUCIDE, IL EST RETIRÉ. La palette est fermée
  // à trente-trois teintes et ne tolère qu'un seul `rgba` (CLAUDE.md §6) : un
  // aplat semi-transparent aurait ouvert une brèche dans la garde de palette.
  assert.match(corps, /background-color:\s*transparent/,
    'le fantôme reprend un fond plein, qui cache le sprite');
  assert.ok(!/background:\s*#/.test(corps),
    'un raccourci `background: #…` remet un aplat ET efface le sprite posé en ligne');
  assert.match(corps, /image-rendering:\s*pixelated/,
    'sans lui le sprite du fantôme est interpolé, donc flou');
  // ⚠ LE LISERÉ TIRETÉ RESTE : c'est LUI qui dit « pas encore là ».
  assert.match(corps, /border:[^;]*dashed/,
    'le liseré tireté est ce qui distingue un fantôme d\'un bâtiment posé');

  // ⚠ ET SA TAILLE EST CELLE DU JETON, VARIABLES COMPRISES. Un fantôme à 84 %
  // sous un jeton à 84 % × 1,2 ferait grandir le bâtiment au second toucher.
  const jeton = feuille.match(/\.jeton\s*\{([^}]*)\}/);
  assert.ok(jeton, '`.jeton` n\'a plus de règle');
  for (const variable of ['--jeton-part', '--jeton-grossissement']) {
    const valeur = (bloc) => bloc.match(new RegExp(`${variable}:\\s*([^;]+);`))?.[1].trim();
    assert.ok(valeur(corps) !== undefined, `le fantôme ne déclare pas ${variable}`);
    assert.equal(valeur(corps), valeur(jeton[1]),
      `${variable} diverge entre le fantôme et le jeton : la pièce changerait de taille en se posant`);
  }
});

test('zoom de la base — la plage est assez large pour qu\'un geste se voie', () => {
  // ⚠⚠ ETHAN, 31/08 : « le zoom de la base est chelou, très lent ». Mesuré dans
  // Chromium sur 360 px CSS : le plancher vaut 40, le plafond valait 64. Toute
  // la plage tenait donc dans 1,6×, et depuis l'ouverture à 46 il suffisait
  // d'écarter les doigts de 39 % pour buter en haut. Le facteur n'était pas en
  // cause — c'est le rapport des écarts, donc la main donne sa proportion — la
  // PLAGE l'était.
  //
  // ⚠⚠ CETTE GARDE MESURAIT UN PROXY, ET LE LOT GRILLE-128 L'A MONTRÉ. Elle
  // exigeait `ZOOM_BASE_MULTIPLE_MAX >= 2` — vrai tant que la grille faisait 64,
  // où seul un multiple de 2 portait le plafond à 128 px CSS. À 128, le même
  // plafond s'obtient avec un multiple de 1, et le multiple ne dit plus rien de
  // la plage. **Ce qui compte est le plafond en PIXELS**, et il n'a pas bougé.
  assert.equal(COTE_CASE_MAX, 128,
    'le plafond du zoom a changé en pixels CSS : c\'est une décision de plage');
  assert.equal(COTE_CASE_MAX, COTE_SPRITE * ZOOM_BASE_MULTIPLE_MAX);

  // ⚠ LE MULTIPLE EST ENTIER, ET C'EST CE QUI GARDE LE PIXEL ART NET. Au
  // plafond, un pixel de sprite vaut un nombre ENTIER de pixels CSS ; avec
  // `image-rendering: pixelated`, l'agrandissement ne peut pas interpoler. Un
  // plafond à 1,5 × 64 = 96 passerait ce test-ci s'il ne portait que sur la
  // taille, et rendrait du flou.
  assert.ok(Number.isInteger(ZOOM_BASE_MULTIPLE_MAX),
    'un multiple fractionnaire agrandit le pixel art en interpolant');

  // La plage réellement obtenue sur le plus petit téléphone encore en service :
  // 9 colonnes dans 360 px CSS donnent un plancher de 40.
  const plancher = Math.floor(360 / GRILLE.largeur);
  assert.ok(COTE_CASE_MAX / plancher >= 3,
    `plage de ${(COTE_CASE_MAX / plancher).toFixed(1)}× seulement — le geste ne se verra pas`);
});

test('zoom de la base — au repos la grille TIENT, et le zoom du joueur survit', () => {
  // ⚠⚠ LE SECOND DÉFAUT, TROUVÉ EN MESURANT LE PREMIER. `reglerCoteCase` était
  // appelée une seule fois, au câblage — quand `#chantier-defile` n'a pas encore
  // de boîte et que `clientWidth` vaut zéro. La grille restait donc à
  // `--case-defaut` (46 px) : 9 × 46 = 414 px dans 360, deux colonnes hors de
  // l'écran et un défilement horizontal AU REPOS, ce que « tu compresses tout
  // dans l'ui » refuse. Mesuré dans Chromium avant et après : 414 px puis 360.
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));

  assert.match(ecran, /new fenetre\.ResizeObserver\([^)]*\)[\s\S]{0,80}\.observe\(defile\)/,
    'rien ne remesure la largeur du champ : la grille ne peut plus tenir toute seule');

  // ⚠ ET LES DEUX RÈGLES SE DÉPARTAGENT PAR UN DRAPEAU, pas par un choix fait
  // une fois pour toutes. Tant que le joueur n'a pas pincé, la grille suit la
  // largeur ; dès qu'il a pincé, on rejoue SON côté — un zoom effacé par une
  // rotation d'écran serait pire que pas de zoom du tout.
  assert.match(ecran, /zoomRegleParLeJoueur\s*=\s*true/,
    'le pincement ne marque plus que le joueur a réglé le zoom lui-même');
  assert.match(ecran, /zoomRegleParLeJoueur\s*\?\s*coteCase\s*:\s*coteQuiTient\(\)/,
    'le suivi de largeur ne départage plus le zoom du joueur et la taille qui tient');

  // L'appât : la forme fautive — réappliquer le DÉFAUT — ne doit plus se lire.
  assert.ok(!/reglerCoteCase\(COTE_CASE_DEFAUT\)/.test(ecran),
    'la grille s\'ouvre encore au défaut de la feuille, sans regarder la largeur');
});

test('bandes — le défilement ne franchit plus la frontière base / défense', () => {
  // ⚠⚠ ETHAN, 31/08 : « on ne doit plus passer librement de la base joueur à la
  // def joueur ». Le défilement lisait la ligne en tête et changeait de bande
  // tout seul : la palette se reconstruisait au milieu d'un geste, et on
  // arrivait en défense sans l'avoir demandé.
  const h = 40;
  const vue = 364;
  const bat = bornesDeDefilement('batiments', h, vue);
  const def = bornesDeDefilement('defense', h, vue);

  // ⚠ D'ABORD : LE MONTAGE MESURE-T-IL QUELQUE CHOSE ? Deux bandes qui se
  // recouvriraient rendraient ce test vrai sans rien prouver.
  assert.ok(bat.min < def.min, 'les deux bandes se confondent : le test ne mesure rien');

  // La bande des bâtiments ne peut pas descendre dans la défense.
  assert.ok(bat.max < def.min + 1,
    `depuis les bâtiments on atteint ${bat.max}, alors que la défense commence à ${def.min}`);
  // Et la défense ne peut pas remonter dans les bâtiments.
  assert.ok(def.min >= bat.max, 'la défense laisse remonter jusque dans les bâtiments');

  // ⚠ LES DEUX RANGÉES DE DÉPLOIEMENT RESTENT ATTEIGNABLES, et c'est délibéré :
  // elles n'ont pas de bouton, donc les enfermer sous la défense les aurait
  // retirées du jeu — « rien ne se retire en silence ». La borne basse de la
  // défense va jusqu'au bout de la grille.
  const basDeLaGrille = GRILLE.longueur * h;
  assert.equal(def.max, basDeLaGrille - vue,
    'le déploiement n\'est plus atteignable en défilant depuis la défense');

  // ⚠ ET UNE BANDE QUI TIENT ENTIÈRE NE DÉFILE PAS DU TOUT — `max` ne passe
  // jamais sous `min`, sans quoi le champ remonterait au-dessus de sa bande.
  const large = bornesDeDefilement('batiments', h, 5000);
  assert.equal(large.max, large.min);

  // Une bande sans bouton n'a pas de bornes : elle lève plutôt que d'en inventer.
  assert.throws(() => bornesDeDefilement('deploiement', h, vue), /non navigable/);
  assert.throws(() => bornesDeDefilement('batiments', 0, vue), /hauteur de rangée/);

  // ⚠⚠ ET AVEC LE `padding` DE LA GRILLE, LES DEUX BANDES NE SE DÉCALENT PAS DE
  // LA MÊME FAÇON. La première rangée est repoussée d'une demi-case pour tout le
  // monde ; le mur, lui, ne déborde qu'AU-DESSUS DE LA BASE, puisqu'il fait un U
  // sans bas. La bande des bâtiments s'ouvre donc au tout début de la boîte —
  // sans quoi son mur du haut serait hors de vue —, et celle de la défense sur
  // sa propre première rangée, décalée du padding. Mesuré à l'écran avant
  // correction : la bascule vers la Défense s'arrêtait une demi-rangée trop
  // haut, et montrait la fin de la base.
  const p = h / 2;
  const batP = bornesDeDefilement('batiments', h, vue, p);
  const defP = bornesDeDefilement('defense', h, vue, p);
  assert.equal(batP.min, 0, 'la base ne s\'ouvre plus sur son mur du haut');
  assert.equal(defP.min, def.min + p,
    `la défense s'ouvre en ${defP.min} au lieu de ${def.min + p} : le padding est ignoré`);
  assert.ok(defP.min > batP.min, 'le montage ne mesure rien : les deux bandes se confondent');

  // ⚠ ET LE BAS SUIT LE CONTENU, PAS LA BOÎTE. La demi-case de padding du bas ne
  // porte aucun dessin — le U s'arrête au bord de la base — et la rendre
  // atteignable ferait défiler dans du vide.
  const grande = bornesDeDefilement('defense', h, 1, p);
  assert.equal(grande.max, p + GRILLE.longueur * h - 1,
    'le défilement descend dans le padding du bas, où il n\'y a rien');
});

test('bandes — la flèche du bouton se déduit des lignes d\'écran', () => {
  // ⚠ LE SENS N'EST PAS ÉCRIT, IL EST CALCULÉ. La grille se dessine à l'envers
  // des numéros de rangée (`render/orientation.js`), et elle a DÉJÀ été
  // retournée une fois, le 27/08. Un glyphe gravé en dur pointerait alors du
  // mauvais côté sans que rien ne tombe.
  const versDef = basculeDeBande('batiments');
  const versBat = basculeDeBande('defense');
  assert.equal(versDef.cible, 'defense');
  assert.equal(versBat.cible, 'batiments');

  // La cible de l'une est le départ de l'autre : la bascule est un aller-retour.
  assert.equal(basculeDeBande(versDef.cible).cible, 'batiments');

  // ⚠ ET LE GLYPHE SUIT LA GÉOMÉTRIE, pas la table. On refait le calcul ici
  // plutôt que de recopier « ▼ » : la bande des bâtiments porte la rangée 18,
  // qui tombe en PREMIÈRE ligne d'écran, donc la défense est en dessous.
  const ligneDe = (cle) => {
    const bande = BANDES.find((b) => b.cle === cle);
    return ligneEcranDeLaBande(bande).premiereLigne;
  };
  assert.ok(ligneDe('batiments') < ligneDe('defense'),
    'la géométrie a changé : relire le sens des flèches');
  assert.equal(versDef.glyphe, '▼', 'aller vers une bande plus basse doit descendre');
  assert.equal(versBat.glyphe, '▲', 'aller vers une bande plus haute doit monter');

  // Les libellés nomment la bande, ils ne disent pas « suivante ».
  assert.ok(versDef.libelle.includes(BANDES.find((b) => b.cle === 'defense').nom));
  assert.ok(versBat.libelle.includes(BANDES.find((b) => b.cle === 'batiments').nom));

  // ⚠ UNE BANDE SANS BOUTON NE LAISSE PAS LE JOUEUR SANS PORTE DE SORTIE.
  assert.ok(BANDES_NAVIGABLES.includes(basculeDeBande('deploiement').cible));
});

test('bandes — l\'écran borne au lieu de changer de bande, et le bouton existe', () => {
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));

  // ⚠ LA FORME FAUTIVE, NOMMÉE : le défilement ne doit plus déduire la bande de
  // la ligne en tête. C'est exactement ce que faisait l'ancien gestionnaire.
  assert.ok(!/marquerBandeActive\(bandeDeLaRangee\(/.test(ecran),
    'le défilement change encore de bande tout seul');
  assert.match(ecran, /bornesDeDefilement\(bandeCourante/,
    'le gestionnaire de défilement ne borne pas');
  // ⚠ ET LE GARDE-FOU DE RÉENTRANCE EST OBLIGATOIRE : écrire `scrollTop` émet un
  // nouvel évènement `scroll`, donc la correction se rappellerait elle-même.
  assert.match(ecran, /enTrainDeBorner/,
    'la correction de défilement n\'a pas de garde-fou de réentrance');

  // Le bouton est dans le livrable, et il porte une règle qui le pose SUR le
  // champ — pas une septième barre.
  const html = readFileSync(join(RACINE, 'dist', 'index.html'), 'utf8');
  assert.match(html, /id="chantier-bascule-bande"/, 'le bouton de bascule a disparu du livrable');
  const feuille = sansCommentairesHtml(readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8'));
  const regle = feuille.match(/#chantier-bascule-bande\s*\{([^}]*)\}/);
  assert.ok(regle, 'le bouton de bascule n\'a pas de règle CSS');
  assert.match(regle[1], /position:\s*absolute/, 'le bouton entre dans le flux : il pousse le champ');
  assert.match(regle[1], /right:/, 'le bouton n\'est plus à droite');
  assert.match(regle[1], /bottom:/, 'le bouton n\'est plus en bas');

  // ⚠ ET SON ENVELOPPE EST UNE COLONNE FLEX. Sans `display: flex`, le
  // `flex: 1; min-height: 0` de `#chantier-defile` ne s'applique pas : il prend
  // la hauteur de son CONTENU, la grille entière s'affiche et plus rien ne
  // défile. Mesuré au moment de l'erreur — clientHeight et scrollHeight à 720.
  const vue = feuille.match(/#chantier-vue\s*\{([^}]*)\}/);
  assert.ok(vue, '#chantier-vue n\'a pas de règle');
  assert.match(vue[1], /display:\s*flex/, '#chantier-vue n\'est plus une colonne flex');
  assert.match(vue[1], /flex-direction:\s*column/);
  assert.match(vue[1], /min-height:\s*0/);
});
test('contour — le mur fait un U, et l\'anneau se pave sans trou ni recouvrement', () => {
  // ⚠⚠ CE QUE CE TEST GARDE, EN DEUX ARBITRAGES D'ETHAN. Le 31/08 : « le mur
  // fait un U, le bas reste sans mur ». Le 03/09, avec des blocs neufs : « pour
  // que ça passe bien parce que là ça déborde ; les murs vont du haut de la
  // base jusqu'à la défense et ne ferme pas en bas ».
  //
  // ⚠⚠ ET IL A CHANGÉ DE GÉOMÉTRIE, PAS DE TAILLE. La v1 posait cinq TRAITS À
  // CHEVAL sur la ligne du bord : chaque pièce mordait d'une demi-case
  // au-dedans. La v2 pose des BLOCS PLEINS qui CEIGNENT la grille sans rien
  // recouvrir. Ce test asserte donc l'inverse de ce qu'il assertait : plus
  // aucune pièce ne touche le contenu.
  const bandeHaute = BANDES.find((b) => b.cle === BANDE_DU_CONTOUR);
  const bandeBasse = BANDES.find((b) => b.cle === BANDE_DE_FIN_DU_CONTOUR);
  assert.ok(bandeHaute, 'la bande où le mur commence n\'existe plus dans BANDES');
  assert.ok(bandeBasse, 'la bande où le mur s\'arrête n\'existe plus dans BANDES');
  const { premiereLigne } = ligneEcranDeLaBande(bandeHaute);
  const fin = ligneEcranDeLaBande(bandeBasse);
  // ⚠⚠ LE FLANC COURT D'UN BORD À L'AUTRE — Ethan, 03/09 : « flanc sur la
  // défense aussi ». On mesure donc du haut de la première bande au bas de la
  // seconde, et NON la somme des deux : une somme sauterait une bande qui se
  // glisserait un jour entre elles, et le mur aurait un trou que rien ne dirait.
  const nbLignes = fin.premiereLigne + fin.nbLignes - premiereLigne;

  // Le montage mesure quelque chose : sans plusieurs colonnes et plusieurs
  // rangées, « paver » et « poser une case » se confondraient — et sans DEUX
  // bandes distinctes, « jusqu'au bas de la défense » se confondrait avec
  // « jusqu'au bas de la base ».
  assert.ok(GRILLE.largeur > LONGUEUR_DU_MUR, `la base fait ${GRILLE.largeur} colonnes`);
  assert.ok(nbLignes > ligneEcranDeLaBande(bandeHaute).nbLignes,
    'le mur ne descend pas plus bas que sa première bande : le flanc ne longe pas la défense');

  // ⚠⚠ LA COÏNCIDENCE EST TERMINÉE, ET CETTE ASSERTION CHANGE DE CAMP. Elle
  // était DÉCLARÉE « ne mordant pas » depuis le lot MURS : les deux bandes
  // nommées étant adjacentes, mesurer d'un bord à l'autre et les additionner
  // donnaient le même nombre, et le test relevait l'égalité au lieu de faire
  // semblant de la garder. Elle annonçait ceci, mot pour mot : « c'est elle qui
  // tombera le jour où une bande se glisserait entre les deux ». Le lot
  // MURS-JUSQU-EN-BAS a fait descendre les flancs sur le DÉPLOIEMENT : la
  // défense est désormais la bande du milieu, et l'égalité est tombée.
  //
  // Elle mesure donc maintenant la vraie propriété — le flanc couvre EXACTEMENT
  // les bandes qu'il enjambe — et la falsification MORD, ce qu'une assertion
  // supplémentaire dit de face.
  const couvertes = Object.values(GRILLE.bandes)
    .map((b) => ligneEcranDeLaBande(b))
    .filter((l) => l.premiereLigne >= premiereLigne
      && l.premiereLigne + l.nbLignes <= fin.premiereLigne + fin.nbLignes);
  assert.equal(couvertes.length, 3,
    'le flanc n\'enjambe plus trois bandes : la mesure ci-dessous ne dirait plus rien');
  assert.equal(nbLignes, couvertes.reduce((s, l) => s + l.nbLignes, 0),
    'le flanc ne couvre pas exactement les bandes qu\'il enjambe');
  assert.notEqual(nbLignes, ligneEcranDeLaBande(bandeHaute).nbLignes + fin.nbLignes,
    'additionner les deux bandes NOMMÉES redonne la bonne hauteur : le flanc a '
    + 'cessé d\'enjamber une bande du milieu, et la garde ne mesure plus rien');

  const pieces = tuilesDuContour('j');
  const gauche = 0;
  const droite = GRILLE.largeur + 1;
  const haut = premiereLigne - 1;

  // --- 1. rien ne sort de la boîte, et rien ne touche le contenu -------------
  //
  // La boîte fait `largeur + 2` de large ; le CONTENU occupe [1, largeur + 1[.
  // Une seule pièce qui y mordrait recouvrirait une case jouable, et le joueur
  // verrait un bâtiment barré par son propre mur.
  for (const p of pieces) {
    assert.ok(p.l > 0 && p.h > 0, `${p.nom} n'a pas de surface`);
    assert.ok(p.x >= 0 && p.x + p.l <= GRILLE.largeur + 2, `${p.nom} hors boîte en x`);
    assert.ok(p.y >= 0 && p.y + p.h <= GRILLE.longueur + 2, `${p.nom} hors boîte en y`);
    const surLeContenuEnX = p.x + p.l > gauche + 1 && p.x < droite;
    const surLeContenuEnY = p.y + p.h > haut + 1;
    assert.ok(!(surLeContenuEnX && surLeContenuEnY),
      `${p.nom} mord sur le contenu : l'anneau ceint la grille, il ne la recouvre pas`);
  }

  // --- 2. le U : trois côtés, et rien en bas --------------------------------
  const flancGauche = pieces.filter((p) => p.x === gauche && p.y > haut);
  const flancDroit = pieces.filter((p) => p.x === droite && p.y > haut);
  assert.equal(flancGauche.length, nbLignes, 'le flanc gauche ne longe plus les deux bandes');
  assert.equal(flancDroit.length, nbLignes, 'le flanc droit ne longe plus les deux bandes');

  // ⚠⚠ LE U DESCEND JUSQU'EN BAS, ET IL NE SE FERME TOUJOURS PAS. Ethan, 03/09 :
  // « remplir les murs jusqu'en bas […] purement décoratif ». Les flancs
  // couvrent les dix-huit rangées ; le côté du BAS reste sans une seule pièce,
  // et c'est par là que l'assaut entre.
  const plusBas = Math.max(...pieces.map((p) => p.y + p.h));
  assert.equal(plusBas, haut + 1 + nbLignes,
    `le mur descend jusqu'en ${plusBas}, la grille s'arrête en ${haut + 1 + nbLignes}`);

  // ⚠⚠ ET CETTE GARDE-CI MESURAIT UN PROXY, CE QUE LE LOT A RÉVÉLÉ. Elle
  // exigeait `GRILLE.longueur - nbLignes > 0` — « il reste des rangées hors du
  // U » — pour dire « le U s'ouvre quelque part ». C'était vrai tant que les
  // flancs s'arrêtaient avant le bas ; ça a cessé de l'être le jour où ils sont
  // descendus, alors que le U s'ouvre EXACTEMENT comme avant. Un nombre de
  // rangées non ceintes ne dit rien de l'ouverture : ce qui la dit, c'est
  // qu'aucune pièce ne se pose SOUS le dernier cran des flancs.
  assert.equal(pieces.filter((p) => p.y >= haut + 1 + nbLignes).length, 0,
    'une pièce est passée sous le dernier cran des flancs : le U s\'est refermé '
    + 'en bas, et l\'assaut n\'a plus par où entrer');
  // Falsifiable : le montage sait reconnaître une pièce posée là.
  assert.equal([...pieces, { x: 3, y: haut + 1 + nbLignes, l: 1, h: 1 }]
    .filter((p) => p.y >= haut + 1 + nbLignes).length, 1,
    'le montage ne verrait pas une pièce sous les flancs');

  // --- 3. le pavage : la somme retombe juste, et rien ne se recouvre ---------
  //
  // ⚠ ON REFAIT LE COMPTE, ON NE LE RECOPIE PAS. Un mur couvre
  // `LONGUEUR_DU_MUR` cases, un bloc une ; la rangée du haut doit couvrir
  // exactement `largeur + 2` unités, sans trou ni chevauchement.
  const rangeeDuHaut = pieces.filter((p) => p.y === haut).sort((a, b) => a.x - b.x);
  assert.equal(rangeeDuHaut.reduce((t, p) => t + p.l, 0), GRILLE.largeur + 2,
    'la rangée du haut ne couvre plus toute la largeur de la boîte');
  let bord = 0;
  for (const p of rangeeDuHaut) {
    assert.equal(p.x, bord, `trou ou recouvrement à x=${bord} : ${p.nom} commence en ${p.x}`);
    bord = p.x + p.l;
  }
  assert.equal(bord, GRILLE.largeur + 2);

  // Les deux coins sont des BLOCS, et le haut porte au moins un mur — sans quoi
  // le pavage se ferait case par case, ce que les murs de quatre cases existent
  // précisément pour éviter.
  assert.match(rangeeDuHaut[0].nom, /_bloc_\d$/, 'le coin haut-gauche n\'est plus un bloc');
  assert.match(rangeeDuHaut.at(-1).nom, /_bloc_\d$/, 'le coin haut-droit n\'est plus un bloc');
  assert.ok(rangeeDuHaut.some((p) => p.l === LONGUEUR_DU_MUR),
    'le haut est pavé bloc par bloc : les murs de quatre cases ne servent plus');

  // --- 4. les variantes tournent vraiment -----------------------------------
  //
  // ⚠ SANS ÇA, LE TIRAGE POURRAIT RENDRE TOUJOURS LA MÊME et personne ne le
  // verrait sans regarder l'écran. L'anneau porte assez de blocs pour que les
  // quatre soient employées.
  const variantesDeBloc = new Set(
    pieces.filter((p) => p.nom.includes('_bloc_')).map((p) => p.nom.slice(-1)),
  );
  assert.equal(variantesDeBloc.size, NB_VARIANTES_DU_MUR,
    `${variantesDeBloc.size} variantes de bloc employées sur ${NB_VARIANTES_DU_MUR}`);

  // ⚠ ET LE TIRAGE EST STABLE : deux appels rendent le même mur. Un mur qui
  // changerait de dessin à chaque peinture scintillerait dix fois par seconde.
  assert.deepEqual(tuilesDuContour('j'), pieces, 'le mur change d\'un appel à l\'autre');

  // ⚠ ET IL NE CONSOMME PAS LE FLUX DE LA PARTIE. `variante` est pure ; s'en
  // remettre à `etat.rng` décalerait tout ce que le moteur tire ensuite.
  const source = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  const corps = source.slice(source.indexOf('export function tuilesDuContour'));
  assert.doesNotMatch(corps.slice(0, corps.indexOf('\n}')), /etat\.rng|Math\.random/,
    'le mur tire dans le flux de la partie');

  // Les deux camps existent, et un camp inconnu lève plutôt que de rendre une
  // liste vide — un mur absent est exactement ce que personne ne remarque.
  assert.equal(tuilesDuContour('o').length, pieces.length);
  assert.ok(tuilesDuContour('o').every((p) => p.nom.startsWith('bord_o_')));
  assert.throws(() => tuilesDuContour('x'), /camp/);
});

test('contour — l\'écran pose les huit images, et lève sur celle qui manque', () => {
  // ⚠⚠ CE QUE CE TEST GARDE : que chaque pièce ait vraiment une image dans le
  // livrable. Le mur n'est pas un atlas — chaque fichier entre par son propre
  // marqueur —, donc rien ne garantit qu'un nom rendu par `tuilesDuContour`
  // corresponde à quelque chose. Une pièce sans image serait un pan de mur
  // absent, c'est-à-dire exactement ce que personne ne remarque.
  //
  // ⚠ ET C'EST DU WEBP DEPUIS LE LOT MURS. Le rendu n'est plus quantifié sur
  // seize teintes par camp : les huit pièces pèseraient 467 028 octets de
  // base64 en PNG, elles en pèsent 38 878 en WebP q85 — le même encodage que
  // les atlas et que le fond du bassin.
  const html = readFileSync(join(RACINE, 'dist', 'index.html'), 'utf8');
  // ⚠ LES NOMS SE RÉPÈTENT, ET C'EST LE PRINCIPE DEPUIS LE LOT MURS : vingt et
  // une pièces pour huit dessins. Ce qu'on exige, c'est que CHAQUE dessin
  // employé ait son image — et que l'anneau les emploie tous les huit, sans
  // quoi on paierait dans le livrable une variante que rien ne pose.
  const noms = [...new Set(tuilesDuContour('j').map((p) => p.nom))];
  assert.deepEqual(noms.slice().sort(), Object.keys(VARIABLE_DU_MUR).sort(),
    'la table des images et ce que l\'anneau pose ont divergé : une pièce sans image '
    + 'est un pan de mur absent, une image sans pièce est du poids pour rien');
  // Le montage mesure quelque chose : sans plusieurs dessins, « chacun a son
  // image » se confondrait avec « il y en a un ».
  assert.ok(noms.length > 3, `l'anneau ne pose que ${noms.length} dessins`);
  for (const nom of noms) {
    const variable = VARIABLE_DU_MUR[nom];
    assert.ok(variable, `${nom} n'a pas de variable CSS`);
    const cle = variable.match(/var\((--[a-z0-9-]+)\)/)[1];
    // La variable existe dans le livrable, et elle porte une image INLINÉE — pas
    // une adresse, que la garde offline du build refuserait de toute façon.
    const regle = html.match(new RegExp(`${cle}:\\s*url\\('(data:image/webp;base64,[^']{200,})'\\)`));
    assert.ok(regle, `${cle} n'est pas une image inlinée dans le livrable`);
  }

  // ⚠ ET LE CAMP DE L'OUVRAGE N'Y EST PAS, DÉLIBÉRÉMENT : 24 438 octets pour
  // zéro pixel tant qu'aucun écran ne dessine sa base. L'écran LÈVE dessus au
  // lieu de sauter en silence, et le message dit quoi faire.
  for (const p of tuilesDuContour('o')) {
    assert.equal(VARIABLE_DU_MUR[p.nom], undefined,
      `${p.nom} est dans le livrable : le camp de l'Ouvrage n'y a rien à faire encore`);
  }
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  const bloc = ecran.match(/for \(const tuile of tuilesDuContour\([\s\S]*?\n  \}/);
  assert.ok(bloc, 'la boucle qui pose le mur a disparu');
  assert.match(bloc[0], /throw new RangeError/, 'la boucle du mur saute une image absente en silence');
  assert.match(bloc[0], /tuile\.l/, 'la boucle du mur ignore la longueur de la pièce');
  assert.match(bloc[0], /tuile\.h/, 'la boucle du mur ignore la hauteur de la pièce');
  assert.match(bloc[0], /VARIABLE_DU_MUR/, 'la boucle du mur n\'écrit plus l\'image depuis la table');
});

test('contour — trois étages : le sol, puis le mur, puis les pièces', () => {
  // ⚠⚠ CE QUE CE TEST GARDE, ET IL A ÉTÉ ÉCRIT LE JOUR OÙ LE DÉFAUT S'EST VU.
  // Le calque du mur était le premier enfant de la grille et n'avait pas de
  // `z-index` : il peignait donc SOUS le sol des cases qu'il chevauche. Mesuré
  // dans Chromium — la moitié intérieure du trait disparaissait, et pas la même
  // moitié en haut qu'en bas, si bien que les deux murs horizontaux ne
  // montraient pas le même dessin.
  //
  // ⚠ ON ASSERTE UNE RELATION, PAS TROIS NOMBRES. Recopier « 1 » et « 2 »
  // laisserait passer l'inversion des deux, qui est exactement la faute.
  const feuille = sansCommentairesHtml(readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8'));
  const regle = (selecteur) => {
    const m = feuille.match(new RegExp(`${selecteur.replace(/[.#]/g, '\\$&')}\\s*\\{([^}]*)\\}`));
    assert.ok(m, `${selecteur} n'a plus de règle CSS`);
    return m[1];
  };
  const etage = (selecteur) => {
    const m = regle(selecteur).match(/z-index:\s*(-?\d+)/);
    return m ? Number(m[1]) : null;
  };

  const mur = etage('#chantier-contour');
  const jeton = etage('.jeton');
  assert.ok(mur !== null, 'le calque du mur n\'a plus d\'étage : il repasse sous le sol des cases');
  assert.ok(jeton !== null, 'les jetons n\'ont plus d\'étage : le mur leur passera dessus');
  assert.ok(mur > 0, `le mur est à l'étage ${mur} : il ne monte plus au-dessus du sol`);
  assert.ok(jeton > mur,
    `les jetons sont à l'étage ${jeton} et le mur à ${mur} : un bâtiment du pourtour serait barré`);

  // ⚠ LE SOL N'A PAS D'ÉTAGE, ET C'EST CE QUI LE MET SOUS LE MUR. Une case qui
  // en gagnerait un remonterait son fond opaque par-dessus le mur.
  assert.equal(etage('.case'), null, 'les cases ont un `z-index` : leur sol recouvrira le mur');
  assert.equal(etage('.case.choisie'), null,
    'la case choisie a repris un `z-index` : elle redevient un CONTEXTE D\'EMPILEMENT, '
    + 'donc son jeton retombe sous le mur');

  // ⚠ ET LE CALQUE DES TRAITS RESTE AU-DESSUS DU MUR. Les flèches de voisinage
  // répondent à un geste ; le mur est un décor.
  assert.ok(etage('#chantier-traits') >= mur, 'les traits de voisinage passent sous le mur');

  // Le mur ne prend aucun geste : un mur qui avalerait le toucher d'une case du
  // pourtour serait la faute que le dépôt refuse depuis le `transform: scale()`.
  assert.match(regle('#chantier-contour'), /pointer-events:\s*none/,
    'le mur de contour avale le toucher des cases du pourtour');

  // ⚠ ET LA PIÈCE PORTE SA TAILLE, PAS UNE CASE. Une règle qui figerait
  // `width: var(--case-cote)` ramènerait le pavage case par case que le lot
  // vient de retirer, et le mur redeviendrait un motif répété.
  const piece = regle('#chantier-contour .mur');
  assert.doesNotMatch(piece, /width:/, 'la pièce de mur fixe sa largeur dans la feuille');
  assert.match(piece, /background-size:\s*100% 100%/, 'l\'image ne remplit plus sa pièce');
});

// ---------------------------------------------------------------------------
// Le sol qui remplit le champ — lot MURS-JUSQU-EN-BAS, 03/09
// ---------------------------------------------------------------------------

test('décor — le champ est tapissé du même sol que les cases, à la même échelle', () => {
  // ⚠⚠ CE QUE CETTE GARDE TIENT. Ethan, 03/09, capture à l'appui : « rajouter
  // tuiles terrain afin de remplir l'ui. purement decoratif ». La grille ne
  // fait que dix-huit rangées ; sous elle, `#chantier-defile` montrait le
  // `#161914` de son parent — une bande noire franche sous un sol de terre.
  //
  // ⚠ « PUREMENT DÉCORATIF » EST UNE CONTRAINTE, PAS UN COMMENTAIRE : le fond
  // ne doit ni entrer dans le flux, ni prendre un geste, ni déplacer une case.
  // Un `background` ne fait aucune des trois — c'est pour ça que c'est un
  // `background` et pas une rangée de cases en plus.
  const feuille = sansCommentairesHtml(readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8'));
  const bloc = feuille.match(/#chantier-defile\s*\{([^}]*)\}/);
  assert.ok(bloc, '#chantier-defile n\'a plus de règle');

  // Le MÊME atlas que le sol des cases : une seconde image serait un second
  // `data:` au livrable, pour un décor.
  assert.match(bloc[1], /background-image:\s*var\(--atlas-sol\)/,
    'le champ ne se tapisse pas de l\'atlas du sol');
  assert.match(bloc[1], /background-repeat:\s*repeat/, 'le fond ne se répète pas');

  // ⚠ `local`, ET C'EST LA MOITIÉ QUI COMPTE. Sous le défaut `scroll`, la terre
  // resterait collée au cadre pendant que la grille glisse dessus : un effet de
  // parallaxe qui trahirait que ce sol-là n'est pas celui des cases.
  assert.match(bloc[1], /background-attachment:\s*local/,
    'le fond du champ ne défile plus avec la grille');

  // ⚠ ET L'ÉCHELLE VIENT DE LA VARIABLE, PAS D'UN NOMBRE. Un `background-size`
  // chiffré marcherait à la case par défaut et mentirait au premier pincement.
  assert.match(bloc[1], /background-size:\s*var\(--sol-pave/,
    'l\'échelle du pavage est écrite en dur dans la feuille');
  assert.doesNotMatch(bloc[1], /background-size:\s*\d/, 'le pavage porte une taille chiffrée');

  // ⚠⚠ ET LA COULEUR RESTE SOUS L'IMAGE. Si l'atlas manquait, on retombe sur le
  // noir d'avant, jamais sur du blanc : un décor ne rend pas l'écran illisible
  // en tombant.
  const champ = feuille.match(/#chantier-champ\s*\{([^}]*)\}/);
  assert.ok(champ, '#chantier-champ n\'a plus de règle');
  assert.match(champ[1], /background:\s*#161914/,
    'le champ n\'a plus de couleur sous le décor');
});

test('décor — le pavage se dérive de l\'atlas, et il se règle au même endroit que la case', () => {
  // ⚠⚠ LE NOMBRE SE MESURE SUR L'IMAGE, IL NE S'ÉCRIT PAS. Une case prend
  // `tuilesParCase²` cellules de l'atlas ; l'atlas en couvre donc
  // `parAxe / tuilesParCase` par axe. Sur celui du dépôt — 1024 px, cellules de
  // 64 — cela fait 16 / 2 = 8 cases. Écrire 8 dans la feuille ou dans le JS en
  // ferait une seconde vérité, et le premier atlas d'une autre taille
  // décalerait le motif sans que rien ne le dise.
  const octets = readFileSync(join(RACINE, 'art', 'sprites', 'carte', 'atlas-terrain-64.png'));
  const largeur = octets.readUInt32BE(16);
  const cellule = ZOOM_CARTE.coteTuile / ZOOM_CARTE.tuilesParCase;
  const attendu = (largeur / cellule) / ZOOM_CARTE.tuilesParCase;
  const doc = { getElementById: () => ({ getAttribute: () => String(largeur) }) };
  assert.equal(casesDeSolParAtlas(doc), attendu,
    'le pavage ne se dérive plus de la largeur réelle de l\'atlas');
  // Le montage mesure quelque chose : le nombre n'est ni 1 ni la grille entière.
  assert.ok(attendu > 1 && attendu < largeur, `pavage dégénéré : ${attendu}`);
  // ⚠ ET IL SUIT L'IMAGE, IL NE REND PAS UNE CONSTANTE. Sans ce second point,
  // une fonction qui rendrait huit en dur passerait l'égalité ci-dessus, la
  // valeur du dépôt valant huit — c'est exactement la faute que ce lot vient de
  // corriger sur `grilleEmbleme`, qui valait la bonne réponse d'hier.
  const double = { getElementById: () => ({ getAttribute: () => String(largeur * 2) }) };
  assert.equal(casesDeSolParAtlas(double), attendu * 2,
    'le pavage ne suit pas la taille de l\'atlas : il rend une constante');

  // ⚠ ET UN ATLAS QUI NE SE GROUPE PAS EN CASES ENTIÈRES LÈVE. Un pavage
  // fractionnaire brouillerait le pixel art — le défaut que tout le reste du
  // dépôt refuse.
  const bancal = { getElementById: () => ({ getAttribute: () => String(cellule * 3) }) };
  assert.throws(() => casesDeSolParAtlas(bancal), /ne divisent pas|multiple/,
    'un atlas de trois cellules par axe passe : le pavage tomberait entre deux cases');

  // ⚠⚠ ET LES DEUX ÉCHELLES S'ÉCRIVENT DANS LA MÊME FONCTION. `--case-cote` et
  // `--sol-pave` disent la même grandeur à un facteur près ; les régler à deux
  // endroits, c'est se donner rendez-vous pour diverger au premier pincement.
  const source = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  const poses = [...source.matchAll(/setProperty\('--(case-cote|sol-pave)'/g)].map((m) => m[1]);
  assert.deepEqual(poses.sort(), ['case-cote', 'sol-pave'],
    'une des deux échelles est posée deux fois, ou plus du tout');
  const bloc = source.match(/function reglerCoteCase\([^)]*\)\s*\{[\s\S]*?\n  \}/);
  assert.ok(bloc, 'reglerCoteCase a disparu');
  assert.match(bloc[0], /--case-cote/, 'reglerCoteCase ne pose plus le côté de case');
  assert.match(bloc[0], /--sol-pave/,
    'le pavage décoratif a quitté la fonction qui règle la case : les deux échelles vont diverger');

  // ⚠⚠ ET C'EST LE FACTEUR QU'ON LIT, PAS LA PRÉSENCE DE LA LIGNE. Une garde
  // qui se contenterait de trouver `--sol-pave` dans la fonction passerait sur
  // un pavage réglé à la taille de la CASE — le motif serait alors huit fois
  // trop serré, et rien ne tomberait. C'est le proxy que ce lot vient de
  // corriger deux fois ailleurs, sur `grilleEmbleme` et sur `lignesHorsDuU` :
  // on nomme la grandeur défendue, qui est le RAPPORT entre les deux échelles.
  const nomDuFacteur = source.match(/const\s+(\w+)\s*=\s*casesDeSolParAtlas\(/);
  assert.ok(nomDuFacteur, 'le facteur de pavage ne vient plus de `casesDeSolParAtlas`');
  const expression = (variable) => {
    const m = bloc[0].match(new RegExp(`--${variable}',\\s*\`\\$\\{([^}]*)\\}px\``));
    assert.ok(m, `--${variable} ne se pose plus par un gabarit \`\${…}px\``);
    return m[1];
  };
  const cote = expression('case-cote');
  const pave = expression('sol-pave');
  assert.equal(pave.includes(nomDuFacteur[1]), true,
    `--sol-pave vaut « ${pave} » : le pavage ne multiplie plus par ${nomDuFacteur[1]}, `
    + 'donc il suit la case au lieu de l\'atlas');
  assert.equal(cote.includes(nomDuFacteur[1]), false,
    `--case-cote vaut « ${cote} » : le côté de case s'est mis à porter le facteur du pavage`);
  assert.equal(pave.includes(cote.trim()), true,
    `--sol-pave vaut « ${pave} » et ne repart plus du côté de case « ${cote} » : `
    + 'les deux échelles ont cessé d\'en être une seule');
});
