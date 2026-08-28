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
  BASE_BATIMENTS, CHAMPS, COUT_NIVEAU_DEUX, emplacementsDuNiveau, stockagePropreDuNiveau,
} from '../src/data/base.js';
import { ECONOMIE_NIVEAU } from '../src/data/economie.js';
import { GRILLE } from '../src/data/combat.js';
import { champsDeLaBase } from '../src/sim/champs.js';
import { problemesDeDisposition } from '../src/sim/disposition.js';
import { creerEtatEconomie, capacitesMilli, debitsMilliParHeure, RESSOURCES } from '../src/sim/economie-base.js';
import { niveauDesBatiments } from '../src/sim/niveau-de-base.js';
import { creerEtat, tickJeu, poser, problemesDeLaPose } from '../src/sim/state.js';
import { TICKS_PAR_HEURE } from '../src/sim/clock.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

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
function baseDeLaMaquette() {
  const champs = champsDeLaBase(275, 16);
  const disposition = [
    ['chantierDeConstruction', 18, 5, 6], ['collecteur', 13, 2, 6], ['collecteur', 14, 2, 6],
    ['collecteur', 14, 6, 5], ['collecteur', 14, 7, 5], ['collecteur', 16, 7, 4],
    ['raffinerie', 15, 6, 5], ['centrale', 16, 5, 4], ['accumulateur', 17, 5, 3],
    ['caserne', 18, 3, 4], ['complexeDeDefense', 18, 7, 3],
  ].map(([id, rangee, colonne, niveau]) => ({ id, rangee, colonne, niveau }));
  // Le montage doit être LÉGAL avant de mesurer quoi que ce soit : une
  // disposition invalide donnerait des débits qui ne veulent rien dire.
  assert.deepEqual(problemesDeDisposition(disposition, champs), []);
  return { disposition, champs, economie: creerEtatEconomie(disposition) };
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
  const niveauDuChantier = etat.disposition
    .find((b) => b.id === 'chantierDeConstruction').niveau;
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
    { cle: 'quartz', stockMilli: 0, capaciteMilli: 7_032_000 + poche.quartz * 1000, debitMilli: 2_250_000 },
    { cle: 'scorie', stockMilli: 0, capaciteMilli: 7_032_000 + poche.scorie * 1000, debitMilli: 1_876_000 },
    { cle: 'electricite', stockMilli: 0, capaciteMilli: 2_256_000 + poche.electricite * 1000, debitMilli: 567_000 },
  ]);
  assert.deepEqual(resume.emplacements, { poses: 11, ouverts: 12 });
  assert.deepEqual(resume.niveaux, { batiments: 46, defense: null, assaut: null });

  // Et le même résultat par le chemin direct : le résumé ne fait que recopier
  // ce que le moteur dit, il ne recalcule rien pour son compte.
  const capacites = capacitesMilli(etat.disposition);
  const total = {};
  for (const r of RESSOURCES) total[r] = 0;
  for (const parBatiment of debitsMilliParHeure(etat.disposition, etat.champs)) {
    for (const r of RESSOURCES) total[r] += parBatiment[r] ?? 0;
  }
  for (const ligne of resume.ressources) {
    assert.equal(ligne.capaciteMilli, capacites[ligne.cle]);
    assert.equal(ligne.debitMilli, total[ligne.cle]);
  }
  assert.equal(resume.niveaux.batiments, niveauDesBatiments(etat.disposition));
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
  const capaciteQuartz = 7_032_000 + poche.quartz * 1000;
  assert.equal(
    capaciteQuartz, 7_185_000,
    'la poche du Chantier a bougé : recalculer la ligne formatée juste en dessous',
  );
  assert.equal(formaterUnites(resume.ressources[0].capaciteMilli), `7${SEPARATEUR_MILLIERS}185`);
  assert.equal(formaterDebit(resume.ressources[1].debitMilli), `+1${SEPARATEUR_MILLIERS}876/h`);
  assert.equal(formaterDixiemes(resume.niveaux.batiments), '4,6');
});

test('chantier — le bandeau contextuel sépare les deux ressources d\'une raffinerie', () => {
  const etat = baseDeLaMaquette();
  const raffinerie = etat.disposition.findIndex((b) => b.id === 'raffinerie');
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
  const chantier = etat.disposition.findIndex((b) => b.id === 'chantierDeConstruction');
  assert.equal(detailDuBatiment(etat, chantier).detail, 'Niv. 6');
  // Et le nom affiché est celui de la table, jamais le sigle du jeton.
  assert.equal(detailDuBatiment(etat, chantier).nom, BASE_BATIMENTS.chantierDeConstruction.nom.joueur);
  assert.throws(() => detailDuBatiment(etat, 99), /hors de la disposition/);
});

test('chantier — la palette ne propose pas un unique déjà posé', () => {
  const etat = baseDeLaMaquette();
  const posables = posablesDeLaBase(etat);
  const ids = posables.map((p) => p.id);

  // Les trois uniques posés ont disparu de la palette…
  for (const pose of ['chantierDeConstruction', 'caserne', 'complexeDeDefense']) {
    assert.ok(!ids.includes(pose), `${pose} est unique et déjà posé`);
  }
  // …les deux uniques encore libres y sont…
  for (const libre of ['centreDeCommandement', 'qgDeDefense']) {
    assert.ok(ids.includes(libre), `${libre} est unique et pas encore posé`);
  }
  // …et les quatre non-uniques y restent même posés en plusieurs exemplaires.
  for (const multiple of ['collecteur', 'raffinerie', 'centrale', 'accumulateur']) {
    assert.ok(ids.includes(multiple), `${multiple} n'est pas unique`);
  }

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

  // Sur une base NEUVE, seul le Chantier est posé : tous les autres sont
  // proposés. C'est le cas que le joueur voit à sa première ouverture.
  const neuve = creerEtat(7);
  assert.equal(neuve.disposition.length, 1);
  assert.equal(posablesDeLaBase(neuve).length, Object.keys(BASE_BATIMENTS).length - 1);
  assert.deepEqual(resumeDeLaBase(neuve).emplacements, { poses: 1, ouverts: 2 });
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

  assert.deepEqual(parBoucle.economie, parRattrapage.economie);
  assert.deepEqual(parBoucle.horloge, parRattrapage.horloge);
  // Falsifiable : le montage doit avoir réellement produit quelque chose.
  assert.ok(parBoucle.economie.ressources.quartz > 0, 'aucune ressource produite');

  // ⚠ UNE HORLOGE QUI RECULE NE FAIT RIEN, ELLE NE LÈVE PAS. Fuseau, NTP,
  // joueur qui change la date de son téléphone : la même règle que `charger`.
  const avant = JSON.stringify(parBoucle.economie);
  assert.equal(avancer(parBoucle, -100_000), 0);
  assert.equal(JSON.stringify(parBoucle.economie), avant);
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
    'ecran-chantier', 'chantier-onglets', 'chantier-ressources',
    'chantier-emplacements-bandeau', 'chantier-jauge', 'chantier-emplacements',
    'chantier-version', 'chantier-champ', 'chantier-defile', 'chantier-grille',
    'chantier-contexte', 'chantier-selection-nom', 'chantier-selection-detail',
    'chantier-reparer', 'chantier-ameliorer', 'chantier-ameliorer-cible', 'chantier-demonter',
    'chantier-bandes', 'chantier-bandes-liste', 'chantier-palette', 'chantier-avis',
    'chantier-alerte', 'chantier-alerte-message', 'chantier-alerte-neuve', 'chantier-alerte-reessayer',
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

  // Les trois onglets à venir sont désactivés : un contrôle inerte qui a l'air
  // vif fait douter le joueur de son appareil plutôt que du jeu.
  const futurs = [...html.matchAll(/class="futur"\s+disabled/g)];
  assert.equal(futurs.length, 3, 'Recherche, Monde et Options doivent être désactivés');
  // Et les trois boutons d'action aussi, tant que la couche d'action n'existe pas.
  for (const bouton of ['chantier-reparer', 'chantier-ameliorer', 'chantier-demonter']) {
    assert.match(html, new RegExp(`id="${bouton}"[^>]*disabled`), `${bouton} n'est pas désactivé`);
  }

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

  // Une heure de jeu, par le chemin de la boucle.
  for (let i = 0; i < TICKS_PAR_HEURE; i++) tickJeu(etat);
  const apres = resumeDeLaBase(etat);

  // Une heure exactement de débit horaire : le résidu est le reste exact de la
  // somme cumulée, donc l'égalité est stricte, pas approchée.
  assert.equal(apres.ressources[0].stockMilli, avant.ressources[0].debitMilli);
  assert.equal(formaterUnites(apres.ressources[0].stockMilli), `2${SEPARATEUR_MILLIERS}250`);
  for (const ligne of apres.ressources) {
    assert.ok(ligne.stockMilli > 0, `${ligne.cle} n'a pas bougé en une heure`);
    assert.ok(ligne.stockMilli <= ligne.capaciteMilli, `${ligne.cle} a dépassé sa capacité`);
  }
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
  assert.ok(
    /title\s*=[\s\S]{0,200}gratuit/.test(source),
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
  for (const parBatiment of debitsMilliParHeure(etat.disposition, etat.champs)) {
    for (const r of RESSOURCES) total[r] += parBatiment[r] ?? 0;
  }
  return {
    debitQuartz: total.quartz,
    capaciteQuartz: capacitesMilli(etat.disposition).quartz,
    poses: resumeDeLaBase(etat).emplacements.poses,
    niveauDixiemes: niveauDesBatiments(etat.disposition),
  };
}

test('pose — sur une base neuve, un Collecteur a exactement les douze champs', () => {
  const etat = creerEtat(7);

  // ⚠ LE MONTAGE S'ASSERTE AVANT DE MESURER. Sans cette ligne, « douze cases
  // légales » serait comparé à un douze écrit de mémoire : c'est le terrain qui
  // en porte douze, et c'est ce fait-là qui rend le nombre signifiant.
  assert.equal(etat.champs.cases.length, CHAMPS.total);
  assert.equal(CHAMPS.total, 12);

  const legales = casesPosables(etat, 'collecteur');
  assert.equal(legales.length, etat.champs.cases.length);

  // Et ce sont EXACTEMENT les champs, pas douze cases qui se trouvent être au
  // bon nombre. Égalité d'ensemble, dans les deux sens.
  const cle = (c) => `${c.rangee}:${c.colonne}`;
  assert.deepEqual(
    legales.map(cle).sort(),
    etat.champs.cases.map(cle).sort(),
  );

  // Falsifiable : un bâtiment qui n'est PAS lié au terrain doit en avoir un
  // autre nombre, sinon `casesPosables` rendrait la même chose pour tout le
  // monde et l'égalité ci-dessus ne prouverait rien.
  const centrale = casesPosables(etat, 'centrale');
  assert.notEqual(centrale.length, legales.length);
  // Une centrale ne peut PAS se poser sur un champ — réservé au collecteur.
  for (const c of centrale) {
    assert.ok(!etat.champs.cases.some((f) => f.rangee === c.rangee && f.colonne === c.colonne),
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
  const avant = niveauDesBatiments(etat.disposition);
  assert.ok(avant > 10, `le montage doit partir d'une moyenne > 1,0 — il vaut ${avant}`);

  poser(etat, 'raffinerie', 12, 1);
  const apres = niveauDesBatiments(etat.disposition);

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
  assert.equal(etat.disposition.length, 1);
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
  const MOTIF_POSER = /(?<![\p{L}\p{N}_])poserBatiment\s*\(/u;

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
