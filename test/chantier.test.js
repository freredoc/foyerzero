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
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  SEPARATEUR_MILLIERS, SIGLES, BANDES, LIBELLES_RESSOURCE, NIVEAU_ABSENT,
  formaterEntier, formaterUnites, formaterDixiemes, formaterDebit, formaterNiveau,
  familleDuBatiment, bandeDeLaRangee, resumeDeLaBase, detailDuBatiment, posablesDeLaBase,
} from '../src/ui/chantier.js';
import {
  CLE_SAUVEGARDE, CLE_SECOURS, SEUIL_RATTRAPAGE_TICKS, PERIODE_SAUVEGARDE_MS,
  DUREE_APPUI_DEBUG_MS, avancer,
} from '../src/ui/session.js';
import { BASE_BATIMENTS, COUT_NIVEAU_DEUX, emplacementsDuNiveau } from '../src/data/base.js';
import { GRILLE } from '../src/data/combat.js';
import { champsDeLaBase } from '../src/sim/champs.js';
import { problemesDeDisposition } from '../src/sim/disposition.js';
import { creerEtatEconomie, capacitesMilli, debitsMilliParHeure, RESSOURCES } from '../src/sim/economie-base.js';
import { niveauDesBatiments } from '../src/sim/niveau-de-base.js';
import { creerEtat, tickJeu } from '../src/sim/state.js';
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

// ---------------------------------------------------------------------------
// Ce que l'écran lit dans l'état
// ---------------------------------------------------------------------------

test('chantier — le résumé retrouve, par le moteur, les chiffres de la maquette', () => {
  const etat = baseDeLaMaquette();
  const resume = resumeDeLaBase(etat);

  // Les chiffres relevés indépendamment le 27/08 et gardés par
  // `tools/audit-maquette.mjs`. En milli-unités, comme le moteur les range.
  assert.deepEqual(resume.ressources, [
    { cle: 'quartz', stockMilli: 0, capaciteMilli: 7_032_000, debitMilli: 2_250_000 },
    { cle: 'scorie', stockMilli: 0, capaciteMilli: 7_032_000, debitMilli: 1_876_000 },
    { cle: 'electricite', stockMilli: 0, capaciteMilli: 2_256_000, debitMilli: 567_000 },
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
  assert.equal(formaterUnites(resume.ressources[0].capaciteMilli), `7${SEPARATEUR_MILLIERS}032`);
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

  // Le coût affiché est celui du NIVEAU 2 : poser ne coûte rien, le niveau 1
  // est gratuit pour les onze.
  for (const p of posables) {
    assert.equal(p.coutNiveauDeux, COUT_NIVEAU_DEUX[BASE_BATIMENTS[p.id].classeDeCout]);
    assert.equal(p.nom, BASE_BATIMENTS[p.id].nom.joueur);
    assert.ok(p.coutNiveauDeux > 0);
  }

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
    'chantier-bandes', 'chantier-palette', 'chantier-avis',
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
