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

import { ACTIONS, PAS_DE_REPARATION, DUREE_TOAST_MS } from '../src/ui/chantier.js';
import {
  ligneAAfficher, MESSAGES_MODE, messageDePose, MENTION_SATURE,
  apercuDuBatiment, lignesDuPanneau, formaterCout, libelleDuVoisin,
  delaiAvantAmelioration,
  formaterDelai,
  noteDuRefus,
  compteurDeContexte,
  CONTEXTES,
  navigationEntreBases,
  NOMBRE_DE_BASES,
  BOUTONS_DU_BAS,
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
} from '../src/data/base.js';
import { GEOGRAPHIE } from '../src/data/sites.js';
import { ECONOMIE_NIVEAU } from '../src/data/economie.js';
import { GRILLE } from '../src/data/combat.js';
import { champsDeLaBase } from '../src/sim/champs.js';
import { problemesDeDisposition } from '../src/sim/disposition.js';
import { creerEtatEconomie, capacitesMilli, debitsMilliParHeure, RESSOURCES } from '../src/sim/economie-base.js';
import { niveauDesBatiments } from '../src/sim/niveau-de-base.js';
import { creerEtat, tickJeu, poser, problemesDeLaPose } from '../src/sim/state.js';
import * as moteurEtat from '../src/sim/state.js';
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
  const capRaffinerie = capaciteDuNiveau('raffinerie',
    etat.disposition.find((b) => b.id === 'raffinerie').niveau) * 1000;
  const capAccumulateur = capaciteDuNiveau('accumulateur',
    etat.disposition.find((b) => b.id === 'accumulateur').niveau) * 1000;
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
    assert.ok(etat.disposition.some((b) => b.id === multiple), `${multiple} devrait être posé`);
  }

  // Falsifiable : sur une base NEUVE, seul le Chantier porte la marque. Un
  // montage où tout serait posé — ou rien — ne distinguerait pas les deux cas.
  const paletteNeuve = posablesDeLaBase(creerEtat(7));
  assert.deepEqual(
    paletteNeuve.filter((p) => p.dejaPose).map((p) => p.id), ['chantierDeConstruction'],
  );

  // Et l'écran LIT cette marque au lieu de recompter les uniques lui-même.
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  assert.match(ecran, /classList\.toggle\('pose', posable\.dejaPose\)/,
    'la palette ne grise plus la vignette d\'un unique posé');

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
  assert.equal(neuve.disposition.length, 1);
  assert.equal(posablesDeLaBase(neuve).length, Object.keys(BASE_BATIMENTS).length);
  assert.equal(posablesDeLaBase(neuve).filter((p) => !p.dejaPose).length,
    Object.keys(BASE_BATIMENTS).length - 1, 'un seul bâtiment devrait être grisé');
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
  // Cinq onglets, dont trois morts : Base, Mission, Recherche, Monde, Options.
  const ongletsMorts = [...code.matchAll(/class="futur" disabled/g)];
  assert.equal(ongletsMorts.length, 3, 'Mission, Recherche et Monde doivent être désactivés');
  assert.ok(/>Mission</.test(code), 'l\'onglet Mission est absent');
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


// ---------------------------------------------------------------------------
// Les actions — lot ÉCRAN-ACTIONS
// ---------------------------------------------------------------------------

test('actions — les trois boutons sont branchés sur le MOTEUR, pas sur une copie', () => {
  // ⚠ ÉGALITÉ DE RÉFÉRENCE, PAS DE COMPORTEMENT. C'est ce qui distingue « la
  // table appelle la fonction du moteur » de « la table appelle quelque chose
  // qui lui ressemble ». Une réimplémentation dans l'écran — même juste le jour
  // où elle est écrite — dériverait de `sim/state.js` à la première règle qui
  // change, et personne ne le verrait.
  assert.equal(ACTIONS.ameliorer.problemes, moteurEtat.problemesDeLAmelioration);
  assert.equal(ACTIONS.ameliorer.agir, moteurEtat.ameliorer);
  assert.equal(ACTIONS.demolir.problemes, moteurEtat.problemesDeLaDemolition);
  assert.equal(ACTIONS.demolir.agir, moteurEtat.demolir);

  // Chaque action nomme un bouton, et les trois boutons sont distincts.
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
  assert.equal(avecMoteur.length, 2);
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
  assert.equal(typeof PAS_DE_REPARATION, 'string');
  assert.ok(PAS_DE_REPARATION.length > 20, 'un refus doit expliquer, pas seulement refuser');

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
  assert.match(ecran, /ligneDeMode\(poses >= ouverts/,
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
  const pleine = creerEtat(11);
  const champ = pleine.champs.cases[0];
  poser(pleine, 'collecteur', champ.rangee, champ.colonne);
  const apres = resumeDeLaBase(pleine).emplacements;
  assert.equal(apres.poses, apres.ouverts, 'la base devrait être pleine après une pose');
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
  const champ = etat.champs.cases.find((c) => c.ressource === 'quartz');
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
  etat.disposition[0].niveau = GEOGRAPHIE.niveauPlafond;
  const apercu = apercuDuBatiment(etat, 0);
  assert.equal(apercu.auPlafond, true);
  assert.equal(apercu.niveauVise, null);
  assert.equal(apercu.cout, null);
  for (const r of apercu.capacites) assert.equal(r.apresMilli, null);
  assert.equal(lignesDuPanneau(apercu).bouton.libelle, 'Niveau maximum');
  assert.equal(lignesDuPanneau(apercu).bouton.possible, false);

  // Falsifiable : un niveau sous le plafond, lui, porte bien un après.
  const dessous = creerEtat(3);
  dessous.disposition[0].niveau = GEOGRAPHIE.niveauPlafond - 1;
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
  // BLOQUÉE avant de dire qu'elle se débloque : on mesure qu'un seul emplacement
  // est libre, et qu'un stock saturé le reste après une nuit entière.
  assert.equal(emplacementsDuNiveau(1) - neuve.disposition.length, 1,
    'une base neuve n\'a plus exactement un emplacement libre');
  const bloquee = creerEtat(4242);
  const champ = bloquee.champs.cases.find((c) => c.ressource === 'quartz');
  poser(bloquee, 'collecteur', champ.rangee, champ.colonne);
  const plafond = capacitesMilli(bloquee.disposition).quartz;
  assert.ok(debitsMilliParHeure(bloquee.disposition, bloquee.champs)[1].quartz > 0,
    'le collecteur du montage ne produit rien : le blocage ne serait pas mesuré');
  for (let i = 0; i < TICKS_PAR_HEURE; i++) tickJeu(bloquee);
  assert.equal(bloquee.economie.ressources.quartz, plafond,
    'le montage ne sature pas : il ne mesure pas le blocage');
  const veille = bloquee.economie.ressources.quartz;
  moteurEtat.rattraperJeu(bloquee, TICKS_PAR_HEURE * 12);
  assert.equal(bloquee.economie.ressources.quartz, veille,
    'douze heures hors ligne devraient ne rien ajouter à un stock saturé');

  // Et le remède est dans le panneau : améliorer le Chantier LÈVE ce plafond.
  const apres = bloquee.disposition.map(
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

  const avant = { ...etat.economie.ressources };
  moteurEtat.ameliorer(etat, 0);
  for (const r of RESSOURCES) {
    assert.equal((avant[r] - etat.economie.ressources[r]) / 1000, cout[r],
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
  const { disposition, champs } = baseDeLaMaquette();
  const etat = { disposition, champs, economie: creerEtatEconomie(disposition) };
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
  const champ = etat.champs.cases[0];
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
  const champ = etat.champs.cases.find((c) => c.ressource === 'quartz');
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
  const champ = etat.champs.cases.find((c) => c.ressource === 'quartz');
  poser(etat, 'collecteur', champ.rangee, champ.colonne);
  etat.economie.ressources.quartz = 0;

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
    'chantierDeConstruction', etat.disposition[0].niveau + 1,
  ).quartz * 1000;
  assert.equal(delai.secondes, Math.ceil((manqueMilli * 3600) / debit));
  assert.match(lignesDuPanneau(apercuDuBatiment(etat, 0)).bouton.note, /dans /);

  // ⚠ ET L'ARRONDI SE MESURE SUR UN MONTAGE QUI NE TOMBE PAS ROND — la
  // falsification l'a exigé. Avec une caisse à zéro, le manque vaut exactement
  // 10 000 milli contre 240 000/h : la division tombe juste, et `Math.floor`
  // rendait alors le même nombre que `Math.ceil`. Le test passait sur les deux
  // codes, donc il ne mesurait pas l'arrondi. Un milli de plus en caisse suffit
  // à les séparer.
  etat.economie.ressources.quartz = 1;
  const reste = manqueMilli - 1;
  assert.notEqual((reste * 3600) % debit, 0,
    'le montage doit tomber sur une fraction, sinon il ne mesure pas l\'arrondi');
  const arrondi = delaiAvantAmelioration(etat, 0);
  assert.equal(arrondi.secondes, Math.ceil((reste * 3600) / debit));
  assert.notEqual(arrondi.secondes, Math.floor((reste * 3600) / debit),
    'arrondir vers le bas annoncerait une seconde de moins que la vérité');
  etat.economie.ressources.quartz = 0;

  // ⚠ ET IL TOMBE À `null` DÈS QUE C'EST PAYABLE. Un chronomètre qui resterait
  // affiché sur une amélioration possible dirait au joueur d'attendre pour rien.
  etat.economie.ressources.quartz = manqueMilli;
  assert.equal(delaiAvantAmelioration(etat, 0), null);
  assert.equal(lignesDuPanneau(apercuDuBatiment(etat, 0)).bouton.possible, true);

  // --- 2. le mur : le coût dépasse ce que la base peut contenir -------------
  const mur = creerEtat(4242);
  mur.disposition[0].niveau = 12;
  mur.economie.ressources.quartz = 0;
  const capacite = capacitesMilli(mur.disposition).quartz;
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
  sec.economie.ressources.quartz = 0;
  assert.equal(resumeDeLaBase(sec).ressources.find((r) => r.cle === 'quartz').debitMilli, 0);
  const sansDebit = delaiAvantAmelioration(sec, 0);
  assert.equal(sansDebit.cause, 'sans-production');
  assert.equal(sansDebit.secondes, null);
  assert.match(lignesDuPanneau(apercuDuBatiment(sec, 0)).bouton.note, /rien n'en produit/);

  // --- 4. au plafond, il n'y a rien à attendre ------------------------------
  const plafond = creerEtat(4242);
  plafond.disposition[0].niveau = GEOGRAPHIE.niveauPlafond;
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
  assert.deepEqual(resumeDeLaBase(neuve).emplacements, { poses: 1, ouverts: 2 });
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
  assert.equal(batiments.capacite, '/ 2');
  assert.equal(batiments.sature, false);

  // ⚠ LES DEUX AUTRES VALENT « — », ET CE N'EST PAS UN OUBLI. `sim/state.js` ne
  // porte ni garnison ni armée d'assaut : `ui/defense.js` et `ui/arsenal.js`
  // sont des ÉDITEURS dont rien n'est sauvegardé. Le LIBELLÉ change, comme
  // demandé ; inventer un chiffre serait pire que le tiret.
  for (const contexte of ['defense', 'offense']) {
    const vue = compteurDeContexte(etat, contexte);
    assert.equal(vue.valeur, NIVEAU_ABSENT, `${contexte} affiche un chiffre inventé`);
    assert.equal(vue.capacite, '');
    assert.equal(vue.sature, false);
    assert.notEqual(vue.libelle, batiments.libelle, `${contexte} garde le libellé des bâtiments`);
    assert.equal(CONTEXTES[contexte].chiffre, false);
  }
  assert.deepEqual(Object.keys(CONTEXTES).slice().sort(), ['batiments', 'defense', 'offense']);
  assert.throws(() => compteurDeContexte(etat, 'inconnu'), /contexte/);

  // Falsifiable : le compteur des bâtiments DOIT bouger avec la base, sinon les
  // trois cas se ressembleraient et le test ne distinguerait rien.
  const champ = etat.champs.cases[0];
  poser(etat, 'collecteur', champ.rangee, champ.colonne);
  const pleine = compteurDeContexte(etat, 'batiments');
  assert.equal(pleine.valeur, '2');
  assert.equal(pleine.sature, true, 'la base devrait être pleine après une pose');
  assert.notEqual(pleine.valeur, batiments.valeur);
});

test('navigation — la bascule entre bases est une coquille, et elle le dit', () => {
  // Le joueur n'a qu'UNE base : `sim/state.js` porte une seule `disposition`.
  // Les flèches sont donc désactivées et le libellé « 1 / 1 » dit pourquoi —
  // les rendre vives sur du vide promettrait une bascule qui n'existe pas,
  // exactement comme le bouton « Assaut » du lot ÉCRAN-CHANTIER.
  const vue = navigationEntreBases(creerEtat(3));
  assert.equal(vue.libelle, 'Base 1 / 1');
  assert.equal(vue.precedente, false);
  assert.equal(vue.suivante, false);
  assert.equal(NOMBRE_DE_BASES, 1);
  assert.throws(() => navigationEntreBases(null), /état de jeu/);

  // Et l'écran désarme bien les deux flèches, plutôt que de les laisser vives.
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  assert.match(ecran, /navigation-precedente'\)\.disabled = true/);
  assert.match(ecran, /navigation-suivante'\)\.disabled = true/);
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

test('palette — les onze vignettes tiennent en deux rangées, sans défilement', () => {
  // ⚠ ETHAN, LE 28/08 : « faire rentrer dans l'ui tous les bâtiments du bas,
  // c'est-à-dire les deux rangées de boutons ». La palette avait des colonnes de
  // 82 px et un défilement horizontal : la première vignette était coupée et
  // deux bâtiments vivaient hors de l'écran.
  const posables = posablesDeLaBase(creerEtat(5));
  assert.equal(posables.length, Object.keys(BASE_BATIMENTS).length);
  assert.equal(posables.length, 11, 'le montage suppose onze bâtiments');

  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  // ⚠ LE NOMBRE DE COLONNES SE CALCULE, IL NE S'ÉCRIT PAS. « 6 » marcherait
  // aujourd'hui et mentirait au douzième bâtiment.
  assert.match(ecran, /Math\.ceil\(posables\.length \/ 2\)/,
    'le nombre de colonnes n\'est plus déduit du nombre de bâtiments');
  assert.match(ecran, /gridTemplateColumns = `repeat\(\$\{colonnes\}/);
  assert.equal(Math.ceil(posables.length / 2), 6, 'onze bâtiments font six colonnes');

  // Et la feuille ne défile plus horizontalement.
  const feuille = readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const bloc = feuille.slice(feuille.indexOf('#chantier-palette {'));
  const regle = bloc.slice(0, bloc.indexOf('}'));
  assert.ok(!/overflow-x:\s*auto/.test(regle), 'la palette défile encore horizontalement');
  assert.match(regle, /overflow:\s*hidden/);
  assert.ok(!/grid-auto-columns/.test(regle), 'la palette fixe encore la largeur d\'une colonne');
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
