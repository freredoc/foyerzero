// Le journal des RAIDS — lot JOURNAL, 07/09, point 14 d'Ethan : « Défense et
// offense : rajouter un bouton rapport, qui permet de voir les 10 dernières
// attaques et raids subis. »
//
// ⚠⚠ IL NE S'APPELLE PAS `journal.test.js`, ET CE N'EST PAS UN CAPRICE. Ce nom
// est PRIS depuis le lot JOURNAL-DE-COMBAT : `test/journal.test.js` garde le
// journal de TICK — ce que `sim/combat.js` publie pendant un combat. Deux
// sujets, deux fichiers, et deux noms qui se distinguent dans un sélecteur de
// téléphone : c'est la leçon des homonymes du 27/08, où le moteur de combat a
// été écrasé par la table du même nom court. **Payée une seconde fois ici** :
// la première écriture de ce fichier-ci s'appelait `journal.test.js` et a
// effacé les dix `JOURNAL T*`. Restaurées au `git checkout`.
//
// ⚠⚠ CE QUE CE FICHIER MESURE, ET CE QU'IL NE MESURE PAS. Le RANGEMENT était
// déjà là — `garderLeRapport`, la file, la borne — et `RAID-A T9` et `T10` de
// `test/raid.test.js` le gardaient déjà pour le raid MENÉ. Ce qui manquait, et
// que ce fichier ajoute : la moitié DÉFENSE du rangement, et la VUE.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  creerEtat, rattraperJeu, serialiser, charger, SAVE_VERSION,
} from '../src/sim/state.js';
import { baseCourante } from '../src/sim/base-courante.js';
import { executerRaid, simulerRaid, garderLeRapport } from '../src/sim/raid.js';
import { subirUnRaid } from '../src/sim/raid-ouvrage.js';
import { poserEffectif } from '../src/sim/state.js';
import { crediterLesReserves, plafondDeLaReserve } from '../src/sim/reparation.js';
import { APRES_RAID } from '../src/data/sites.js';
import { vueDuJournal, JOURNAL_VIDE, TITRE_JOURNAL, LIBELLE_VERDICT } from '../src/ui/chantier.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => readFileSync(join(RACINE, f), 'utf8');
const sansCommentaires = (code) => code
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/.*$/gm, '$1');

/** L'attaquante des tests de `raid-ouvrage.test.js`, reprise telle quelle. */
const ATTAQUANTE = {
  type: 'base', niveau: 20, rangee: 190, colonne: 16, saveur: null, instance: 0,
};

/** Une base placée là où l'Ouvrage est à portée. */
function baseSousLeFeu(graine = 7, rangee = 200) {
  const etat = creerEtat(graine);
  baseCourante(etat).position.rangee = rangee;
  baseCourante(etat).disposition[0].niveau = 20;
  return etat;
}

/** Une partie où le joueur peut mener un raid pour de bon. */
function partieJouable(graine = 2026) {
  const etat = creerEtat(graine);
  rattraperJeu(etat, 3001);
  baseCourante(etat).disposition[0].niveau = 12;
  let colonne = 1;
  for (const id of ['caserne', 'depotDeVehicules', 'aerodrome']) {
    baseCourante(etat).disposition.push({ id, rangee: 13, colonne, niveau: 5 });
    baseCourante(etat).economie.residus.push({});
    colonne += 2;
  }
  for (let c = 1; c <= 6; c += 1) {
    poserEffectif(etat, 'armee', { id: 'meute', vague: 1, colonne: c, niveau: 1 });
  }
  baseCourante(etat).economie.ressources.scorie = 1_000_000_000;
  etat.attaque.points = 100_000;
  crediterLesReserves(etat, plafondDeLaReserve(etat));
  return etat;
}

function premierCamp(etat) {
  const s = baseCourante(etat).satellites.presents.find((x) => x.type === 'camp');
  return s === undefined ? null : { rangee: s.rangee, colonne: s.colonne };
}

/** Un rapport de raid mené, forgé — pour les tests qui mesurent la VUE. */
function rapportMene(n) {
  return {
    sens: 'offense',
    cible: { type: 'camp', niveau: n, rangee: 250, colonne: 10 },
    cout: 11, cause: 'attaquants', ticks: 100,
    butin: { quartz: 1000 * n, scorie: 2000 * n },
    rase: false, verdict: 'victoire',
  };
}

/** Un rapport de raid subi, forgé. */
function rapportSubi(n, sanction = null) {
  return {
    sens: 'defense',
    attaquant: { type: 'base', niveau: n, rangee: 190, colonne: 16 },
    minute: n, cause: 'attaquants', ticks: 200,
    rase: sanction !== null, sanction, verdict: 'defaite',
  };
}

// ---------------------------------------------------------------------------
// T1 — le cœur du lot : un raid SUBI entre au journal
// ---------------------------------------------------------------------------

test('JRN T1 — un raid SUBI entre au journal, et c\'est celui qui est rendu', () => {
  // ⚠⚠ LA MESURE 2.1 DU BRIEF, FAITE AVANT D'ÉCRIRE UNE LIGNE : `subirUnRaid`
  // range DÉJÀ son rapport — mesuré, 0 → 1. Le brief prévenait que si ce
  // n'était pas le cas, ce serait « le cœur du lot » ; ça l'est autrement, et ce
  // test est ce qui empêche la moitié DÉFENSE de repartir en silence. Le raid
  // MENÉ, lui, était gardé depuis le lot RAID-A ; celui-ci ne l'était pas.
  const etat = baseSousLeFeu();
  assert.equal(etat.rapports.length, 0, 'le montage ne part pas d\'un journal vide');
  const rendu = subirUnRaid(etat, ATTAQUANTE, 5);
  assert.equal(etat.rapports.length, 1, 'un raid subi n\'entre pas au journal');
  assert.equal(etat.rapports[0].sens, rendu.sens);
  assert.equal(etat.rapports[0].verdict, rendu.verdict,
    'le rapport rangé n\'est pas celui que la fonction rend');
  // ⚠ ET IL PORTE SON HORODATAGE DE JEU, posé par `garderLeRapport`.
  assert.equal(typeof etat.rapports[0].tick, 'number');

  // ⚠ FALSIFIABLE DANS L'AUTRE SENS : le montage a bien fait un vrai combat.
  assert.ok(etat.rapports[0].ticks > 0, 'le montage n\'a fait tourner aucun tick');

  // ⚠⚠ ET LE RANGEMENT PASSE PAR `garderLeRapport`, PAS PAR UN SECOND CHEMIN.
  // Une seconde mécanique de rapport aurait sa propre borne et sa propre file.
  const source = sansCommentaires(lire('src/sim/raid-ouvrage.js'));
  assert.equal(source.split('garderLeRapport(').length - 1, 1,
    'le raid subi range son rapport par un autre chemin que `garderLeRapport`');
  assert.ok(!/rapports\.push\(/.test(source),
    'le raid subi pousse dans `rapports` à la main');
});

// ---------------------------------------------------------------------------
// T2 — subi et mené se distinguent
// ---------------------------------------------------------------------------

test('JRN T2 — un subi et un mené portent DEUX valeurs de `sens`, et la vue les dit', () => {
  // ⚠⚠ UN MONTAGE À UN SEUL RAPPORT NE PROUVERAIT RIEN. On en range un de
  // chaque, dans le MÊME journal, et on exige deux valeurs distinctes.
  const etat = baseSousLeFeu();
  subirUnRaid(etat, ATTAQUANTE, 5);
  garderLeRapport(etat, rapportMene(20));
  assert.deepEqual([...new Set(etat.rapports.map((r) => r.sens))].sort(),
    ['defense', 'offense'], 'les deux sens ne se distinguent pas');

  // ⚠ ET LA VUE LES DIT, chacun avec SON vocabulaire — la table
  // `SENS_DU_RAPPORT` de `ui/chantier.js` porte les deux mots et le champ où
  // trouver l'adversaire, et il n'y a pas un `=== 'defense'` dans l'écran.
  const vue = vueDuJournal(etat.rapports, 100_000);
  const titres = vue.sections.map((s) => s.titre);
  assert.ok(titres.some((t) => t.startsWith('Raid subi')), `pas de « Raid subi » : ${titres}`);
  assert.ok(titres.some((t) => t.startsWith('Raid mené')), `pas de « Raid mené » : ${titres}`);

  const libelles = vue.sections.map((s) => s.lignes.map((l) => l.libelle));
  assert.ok(libelles.some((l) => l.includes('Assaillant')), 'un raid subi ne nomme pas son assaillant');
  assert.ok(libelles.some((l) => l.includes('Cible')), 'un raid mené ne nomme pas sa cible');

  // ⚠⚠ ET LA VALEUR VIENT DU BON CHAMP, PARCE QUE LA FALSIFICATION NE MORDAIT
  // PAS. Lire `rapport.cible` des DEUX côtés laissait ce test vert : le LIBELLÉ
  // vient de la table, donc « Assaillant » s'affichait quand même — au-dessus
  // d'un « — · niv. 0 », le champ `cible` n'existant pas sur un rapport de
  // défense. C'est la VALEUR qui discrimine, et elle se mesure ici.
  const parTitre = new Map(vue.sections.map((s) => [s.titre.split(' · ')[0], s.lignes]));
  const ligneSubi = parTitre.get('Raid subi').find((l) => l.libelle === 'Assaillant');
  const ligneMene = parTitre.get('Raid mené').find((l) => l.libelle === 'Cible');
  assert.match(ligneSubi.avant, /^Base de l'Ouvrage · niv\. \d+$/,
    `l'assaillant n'est pas nommé : « ${ligneSubi.avant} »`);
  assert.match(ligneMene.avant, /^Camp · niv\. 20$/,
    `la cible n'est pas nommée : « ${ligneMene.avant} »`);
  assert.notEqual(ligneSubi.avant, ligneMene.avant,
    'les deux rapports nomment le même adversaire : le champ lu est le même');
  // ⚠ ET LES DEUX BILANS NE SE CONFONDENT PAS : on ne « butine » pas en se
  // défendant, et on ne « perd au rasage » pas en attaquant.
  assert.ok(libelles.some((l) => l.includes('Butin')));
  assert.ok(libelles.some((l) => l.includes('Perdu au rasage')));

  // ⚠⚠ ET UN TROISIÈME SENS LÈVE. Les deux moitiés du moteur écrivent `sens`
  // depuis le lot RAID-B ; un rapport qui en porterait un autre est un fait de
  // PROGRAMME, et l'afficher en silence ferait lire une histoire fausse.
  assert.throws(() => vueDuJournal([{ sens: 'ni-l-un-ni-l-autre', tick: 0 }], 0),
    /sens .* inconnu/, 'un sens inconnu passe en silence');
});

// ---------------------------------------------------------------------------
// T3 — la borne tient à onze, et c'est le plus ANCIEN qui part
// ---------------------------------------------------------------------------

test('JRN T3 — onze rapports rangés en laissent dix, et le plus ancien est parti', () => {
  // ⚠⚠ COMPTER LA LONGUEUR NE SUFFIT PAS : une PILE en garderait dix aussi, et
  // jetterait le plus RÉCENT. C'est l'identité de ce qui reste qui discrimine.
  const etat = creerEtat(5);
  for (let n = 1; n <= APRES_RAID.rapportsGardes + 1; n += 1) {
    garderLeRapport(etat, rapportMene(n));
  }
  assert.equal(etat.rapports.length, APRES_RAID.rapportsGardes);
  const niveaux = etat.rapports.map((r) => r.cible.niveau);
  assert.equal(niveaux[0], 2, 'ce n\'est pas le PLUS ANCIEN qui est parti');
  assert.equal(niveaux.at(-1), APRES_RAID.rapportsGardes + 1, 'le plus récent n\'est plus là');
  // ⚠ ET L'ORDRE DE LA FILE EST CROISSANT : le journal se range du plus ancien
  // au plus récent, ce qui est ce que la VUE retourne à l'affichage.
  assert.deepEqual(niveaux, [...niveaux].sort((a, b) => a - b));

  // ⚠ LA VUE N'EN MONTRE PAS UN DE PLUS. Elle ne rogne pas non plus — ce serait
  // un second dix dans le dépôt — elle rend ce que l'état porte.
  assert.equal(vueDuJournal(etat.rapports, 0).sections.length, APRES_RAID.rapportsGardes);
});

// ---------------------------------------------------------------------------
// T4 — une simulation n'entre pas
// ---------------------------------------------------------------------------

test('JRN T4 — une simulation n\'entre pas au journal, et la vue ne la voit pas', () => {
  // ⚠ `RAID-A T9` garde déjà l'état ; ce test-ci garde la VUE, qui est ce que le
  // joueur lit. Un rapport de combat qui n'a pas eu lieu, au milieu de ceux qui
  // ont eu lieu, serait le pire mensonge de cet écran.
  const etat = partieJouable();
  const cible = premierCamp(etat);
  assert.ok(cible !== null, 'le montage n\'a pas de camp à attaquer');
  garderLeRapport(etat, rapportMene(3));
  const avant = vueDuJournal(etat.rapports, 0);

  const simule = simulerRaid(etat, baseCourante(etat), cible);
  assert.ok(simule !== null && simule.verdict !== undefined,
    'le montage n\'a rien simulé : il ne mesure rien');
  assert.equal(etat.rapports.length, 1, 'la simulation a rangé un rapport');
  assert.deepEqual(vueDuJournal(etat.rapports, 0), avant, 'la vue a vu la simulation');

  // Falsifiable : un VRAI raid, lui, s'y voit.
  executerRaid(etat, baseCourante(etat), cible);
  assert.equal(vueDuJournal(etat.rapports, 0).sections.length, 2,
    'un vrai raid n\'entre pas dans la vue');
});

// ---------------------------------------------------------------------------
// T5 — la vue affiche du plus RÉCENT au plus ancien
// ---------------------------------------------------------------------------

test('JRN T5 — la vue va du plus récent au plus ancien, et l\'âge le dit', () => {
  const etat = creerEtat(5);
  // Trois rapports d'âges CONNUS : on pousse à des ticks croissants.
  for (const [tick, niveau] of [[0, 1], [36_000, 2], [72_000, 3]]) {
    etat.horloge.nbTicks = tick;
    garderLeRapport(etat, rapportMene(niveau));
  }
  assert.deepEqual(etat.rapports.map((r) => r.tick), [0, 36_000, 72_000]);

  const vue = vueDuJournal(etat.rapports, 72_000);
  // ⚠ LE PLUS RÉCENT EN PREMIER — c'est ce que le joueur veut lire.
  const niveaux = vue.sections.map((s) => Number(s.lignes[0].avant.match(/niv\. (\d+)/)[1]));
  assert.deepEqual(niveaux, [3, 2, 1], 'la vue n\'est pas dans l\'ordre du plus récent');

  // ⚠ ET L'ÂGE SUIT : « il y a 0 s » pour celui de maintenant, davantage pour
  // les autres. C'est ce qui prouve que la vue lit le tick et ne se contente pas
  // de retourner une liste.
  assert.ok(vue.sections[0].titre.endsWith('il y a 0 s'), vue.sections[0].titre);

  // ⚠⚠ ET L'ARRONDI DE L'ÂGE SE MESURE, PARCE QUE LA FALSIFICATION NE MORDAIT
  // PAS. Les trois âges du montage tombent RONDS — 0 s, 1 h, 2 h — donc
  // `Math.floor` et `Math.ceil` y rendent le même mot : passer l'arrondi par
  // défaut laissait ce test ENTIÈREMENT VERT. On prend donc un âge qui les
  // sépare : 595 ticks font 59,5 secondes, « 59 s » vers le bas et « 60 s » vers
  // le haut. Du temps ÉCOULÉ s'arrondit vers le BAS — annoncer une minute pour
  // 59,5 secondes ferait vieillir un raid qui vient d'avoir lieu.
  const demi = creerEtat(6);
  demi.horloge.nbTicks = 0;
  garderLeRapport(demi, rapportMene(1));
  const titreDemi = vueDuJournal(demi.rapports, 595).sections[0].titre;
  assert.ok(titreDemi.endsWith('il y a 59 s'), titreDemi);
  // ⚠ LE POINT DÉCIMAL EST CELUI DE `direLaDuree`, ET IL N'EST PAS CORRIGÉ ICI.
  // Elle est PARTAGÉE avec la réserve de réparation, et le lot FICHE-JUSTE a
  // déjà déclaré ce point-là : le corriger dans le journal seul ferait diverger
  // deux affichages de la même grandeur. Relevé, non corrigé.
  assert.ok(/il y a 1\.0 h$/.test(vue.sections[1].titre), vue.sections[1].titre);
  assert.ok(/il y a 2\.0 h$/.test(vue.sections[2].titre), vue.sections[2].titre);
});

// ---------------------------------------------------------------------------
// T6 — l'état n'est pas retourné
// ---------------------------------------------------------------------------

test('JRN T6 — afficher ne retourne PAS `etat.rapports` : la file reste une file', () => {
  // ⚠⚠ C'EST LE TEST QUI ATTRAPE UN `reverse()` EN PLACE. `Array.reverse` mute :
  // retourner la liste rangée casserait à la fois l'ordre de la file et la
  // borne, puisque `garderLeRapport` jette la TÊTE.
  const etat = creerEtat(5);
  for (let n = 1; n <= 4; n += 1) garderLeRapport(etat, rapportMene(n));
  const avant = JSON.stringify(etat.rapports);

  // ⚠⚠ UN SEUL APPEL, ET C'EST LA FALSIFICATION QUI L'A EXIGÉ. Le premier jet en
  // faisait DEUX, et `liste.reverse()` en place laissait ce test **entièrement
  // vert** : deux retournements s'annulent, et la liste revenait à son ordre.
  // Un nombre IMPAIR d'appels est la seule façon de voir la mutation. Mesuré.
  vueDuJournal(etat.rapports, 0);
  assert.equal(JSON.stringify(etat.rapports), avant, 'la vue a modifié l\'état');
  // ⚠ ET ON REGARDE AUSSI APRÈS UN SECOND APPEL — un code qui muterait à un
  // appel sur deux serait pire encore.
  vueDuJournal(etat.rapports, 0);
  assert.equal(JSON.stringify(etat.rapports), avant, 'la vue a modifié l\'état au second appel');
  assert.deepEqual(etat.rapports.map((r) => r.cible.niveau), [1, 2, 3, 4]);

  // ⚠ ET LE RANGEMENT SUIVANT TOMBE ENCORE JUSTE : c'est la conséquence qu'un
  // `reverse()` en place aurait cassée sans qu'aucune assertion d'ordre ne la
  // voie sur une seule vue.
  for (let n = 5; n <= APRES_RAID.rapportsGardes + 1; n += 1) garderLeRapport(etat, rapportMene(n));
  assert.equal(etat.rapports[0].cible.niveau, 2, 'la file a cessé d\'être une file');
});

// ---------------------------------------------------------------------------
// T7 — un journal vide se dit
// ---------------------------------------------------------------------------

test('JRN T7 — un journal vide rend une PHRASE, jamais une vue blanche', () => {
  const vue = vueDuJournal([], 0);
  assert.equal(vue.titre, TITRE_JOURNAL);
  assert.equal(vue.sections.length, 1, 'un journal vide ne rend pas exactement une section');
  assert.equal(vue.sections[0].titre, JOURNAL_VIDE);
  assert.deepEqual(vue.sections[0].lignes, []);
  // ⚠ LA PHRASE EST UNE PHRASE, pas un tiret : zéro rapport n'est pas une
  // erreur, c'est une partie qui commence.
  assert.ok(JOURNAL_VIDE.length > 20 && JOURNAL_VIDE.endsWith('.'), JOURNAL_VIDE);

  // ⚠ ET UNE LISTE ABSENTE VAUT UNE LISTE VIDE — une sauvegarde d'avant le champ
  // `rapports` ne doit pas faire tomber l'écran.
  assert.deepEqual(vueDuJournal(undefined, 0), vue);
});

// ---------------------------------------------------------------------------
// T8 — une seule vue pour deux écrans
// ---------------------------------------------------------------------------

test('JRN T8 — Défense et Offense passent par LA MÊME fonction, et par le rendu partagé', () => {
  const chantier = sansCommentaires(lire('src/ui/chantier.js'));
  const offense = sansCommentaires(lire('src/ui/offense.js'));

  // ⚠⚠ UNE SEULE DÉCLARATION, DEUX APPELS. Deux vues auraient divergé à la
  // première retouche, et le joueur aurait lu deux histoires de la même partie.
  assert.equal((chantier.match(/export function vueDuJournal\(/g) ?? []).length, 1);
  assert.ok(!/function vueDuJournal\(/.test(offense), 'l\'Offense a recopié la vue');
  const bloc = offense.match(/import \{([^}]*)\} from '\.\/chantier\.js';/);
  assert.ok(bloc !== null && bloc[1].split(',').map((n) => n.trim()).includes('vueDuJournal'),
    'l\'Offense n\'importe pas la vue');

  // ⚠ IMPORTER N'EST PAS APPELER — la leçon d'`ERGO T7 ter`. On compte les
  // APPELS, déclaration retirée.
  const appels = (code) => (code.replace(/export function vueDuJournal\(/g, 'DECL(')
    .replace(/import \{[^}]*\} from '[^']*';/g, '')
    .match(/vueDuJournal\(/g) ?? []).length;
  assert.equal(appels(chantier), 1, 'le Chantier n\'appelle pas la vue exactement une fois');
  assert.equal(appels(offense), 1, 'l\'Offense n\'appelle pas la vue exactement une fois');

  // ⚠ ET LES DEUX PEIGNENT PAR LE RENDU PARTAGÉ, jamais à la main.
  for (const [ou, code] of [['chantier', chantier], ['offense', offense]]) {
    assert.match(code, /peindreVueDuPanneau\(\s*\n?\s*doc, elementsJournal,/,
      `${ou} ne peint pas le journal par le rendu partagé`);
    // ⚠⚠ ET OUVRIR LE JOURNAL FERME LA FICHE. Les deux sont des
    // `panneau-detail`, donc au MÊME endroit, en `absolute` et au même
    // `z-index` : laisser les deux ouverts en superposerait un sur l'autre, et
    // le second avalerait les touchers du premier. C'est la faute du lot
    // TUTORIEL, et celle qu'`ÉD T5 bis` garde déjà pour la ligne d'avis.
    assert.match(code, /fermerPanneau\(\);\s*\n\s*peindreVueDuPanneau\(/,
      `${ou} ouvre le journal par-dessus la fiche`);
  }

  // ⚠ ET LE BALISAGE PORTE LES DEUX BOUTONS ET LES DEUX PANNEAUX, sous UNE règle.
  const html = lire('src/index.src.html');
  for (const id of ['chantier-journal', 'chantier-journal-panneau', 'chantier-journal-titre',
    'chantier-journal-corps', 'chantier-journal-fermer', 'offense-journal',
    'offense-journal-panneau', 'offense-journal-titre', 'offense-journal-corps',
    'offense-journal-fermer']) {
    assert.ok(html.includes(`id="${id}"`), `le balisage n'a pas ${id}`);
  }
  const feuille = html.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(feuille, /#chantier-journal, #offense-journal \{/,
    'les deux boutons ne partagent plus une règle');
  // ⚠ ET PAS DE SECONDE RÈGLE : on cherche un sélecteur qui commence une ligne,
  // sans quoi le sélecteur PARTAGÉ se dénoncerait lui-même.
  assert.ok(!/\n\s*#offense-journal[ ,]*\{/.test(feuille),
    'l\'Offense a sa propre règle de bouton');
  assert.ok(!/\n\s*#chantier-journal \{/.test(feuille),
    'le Chantier a sa propre règle de bouton');
  // ⚠ AUCUNE RÈGLE PROPRE AUX PANNEAUX : ils portent `panneau-detail`, et rien.
  for (const id of ['chantier-journal-panneau', 'offense-journal-panneau']) {
    assert.ok(!new RegExp(`#${id} \\{`).test(feuille), `${id} a sa propre règle`);
    assert.match(html, new RegExp(`id="${id}" class="panneau-detail"`));
  }
});

// ---------------------------------------------------------------------------
// T9 — rien n'est recalculé
// ---------------------------------------------------------------------------

test('JRN T9 — rien n\'est recalculé : l\'état bouge, les nombres du journal non', () => {
  // ⚠⚠ UN MONTAGE À ÉTAT CONSTANT NE DISTINGUERAIT PAS UN CHAMP LU D'UN CHAMP
  // RECALCULÉ. On range un rapport, on change TOUT ce qui pourrait servir à le
  // recomposer, et on exige que la vue ne bouge pas d'un caractère.
  const etat = partieJouable();
  const cible = premierCamp(etat);
  assert.ok(cible !== null);
  const rapport = executerRaid(etat, baseCourante(etat), cible);
  assert.equal(etat.rapports.length, 1);
  const avant = JSON.stringify(vueDuJournal(etat.rapports, etat.horloge.nbTicks));

  // Le site est ré-attaqué, la base gagne des niveaux, les stocks changent, les
  // points d'attaque aussi. Un butin recomposé depuis l'état d'aujourd'hui
  // rendrait un autre nombre.
  baseCourante(etat).disposition[0].niveau = 40;
  baseCourante(etat).economie.ressources.quartz = 999_999_000;
  baseCourante(etat).economie.ressources.scorie = 1;
  etat.attaque.points = 1;
  const tick = etat.horloge.nbTicks;
  assert.equal(JSON.stringify(vueDuJournal(etat.rapports, tick)), avant,
    'un nombre du journal a bougé alors que le rapport n\'a pas changé');

  // ⚠ FALSIFIABLE : le montage porte bien un butin non nul, sans quoi
  // « le nombre n'a pas bougé » serait vrai de deux zéros.
  const bilan = vueDuJournal(etat.rapports, tick).sections[0].lignes.at(-1);
  assert.equal(bilan.libelle, 'Butin');
  assert.notEqual(bilan.avant, '—', `le montage n'a rapporté aucun butin : ${JSON.stringify(rapport.butin)}`);
});

// ---------------------------------------------------------------------------
// T10 — `SAVE_VERSION` n'a pas bougé
// ---------------------------------------------------------------------------

test('JRN T10 — `SAVE_VERSION` ne bouge pas : rien n\'entre dans l\'état', () => {
  // ⚠⚠ TOUT ÉTAIT DÉJÀ STOCKÉ — `etat.rapports`, la borne, le champ `sens`. Le
  // lot n'ajoute pas un champ, donc il n'ajoute pas un maillon de migration.
  // ⚠ CORRIGÉ EN LE SACHANT par le lot BÂTIMENTS-QUATRE-ÉTATS, qui dédouble
  // le Collecteur et fait donc bouger la sauvegarde. Ce que la ligne garde n'est
  // pas un numéro figé, c'est qu'on ne bumpe pas sans passer par ici.
  // ⚠ ET PAR RÈGLES-DE-CARTE, LE 10/09, pour la même raison : la base gagne
  // `dernierDeplacementDelaiTicks`. Le journal, lui, n'a toujours rien ajouté.
  assert.equal(SAVE_VERSION, 31);

  // Une sauvegarde écrite AVANT le lot se relit, journal compris.
  const etat = baseSousLeFeu();
  subirUnRaid(etat, ATTAQUANTE, 5);
  garderLeRapport(etat, rapportMene(4));
  const json = serialiser(etat, 1_700_000_000_000);
  assert.equal(JSON.parse(json).version, SAVE_VERSION);
  const relu = charger(json, 1_700_000_000_000);
  assert.equal(relu.rapports.length, 2, 'le journal n\'a pas survécu au tour du disque');
  assert.deepEqual(relu.rapports.map((r) => r.sens), ['defense', 'offense']);

  // ⚠ ET LA VUE RELUE EST LA MÊME — c'est ce qui dit que le journal ne dépend
  // de rien qui ne traverse pas la sauvegarde.
  assert.deepEqual(
    vueDuJournal(relu.rapports, relu.horloge.nbTicks),
    vueDuJournal(etat.rapports, etat.horloge.nbTicks),
  );

  // ⚠ AUCUN CHAMP NEUF DANS L'ÉTAT : les clés du sérialisé sont celles d'avant.
  const neuf = JSON.parse(serialiser(creerEtat(3), 0));
  const attendues = JSON.parse(serialiser(creerEtat(4), 0));
  assert.deepEqual(Object.keys(neuf).sort(), Object.keys(attendues).sort());
});

// ---------------------------------------------------------------------------
// T11 — la borne vient de `src/data/`
// ---------------------------------------------------------------------------

test('JRN T11 — la borne vient de `src/data/`, et la changer change ce qui est gardé', () => {
  // ⚠⚠ LE COMMENTAIRE D'`APRES_RAID` S'EN INQUIÈTE DÉJÀ : « un 10 écrit dans
  // `ui/` ferait deux vérités le jour où Ethan en veut vingt ». On le mesure au
  // lieu de le lire : on BOUGE la borne, dans un `try/finally`, et on exige que
  // le nombre gardé suive.
  const original = APRES_RAID.rapportsGardes;
  try {
    APRES_RAID.rapportsGardes = 3;
    const etat = creerEtat(5);
    for (let n = 1; n <= 5; n += 1) garderLeRapport(etat, rapportMene(n));
    assert.equal(etat.rapports.length, 3, 'la borne des données n\'est pas celle qui rogne');
    assert.deepEqual(etat.rapports.map((r) => r.cible.niveau), [3, 4, 5]);
    assert.equal(vueDuJournal(etat.rapports, 0).sections.length, 3,
      'la vue ne suit pas la borne des données');
  } finally {
    APRES_RAID.rapportsGardes = original;
  }
  assert.equal(APRES_RAID.rapportsGardes, original, 'le test n\'a pas rendu la borne');

  // ⚠ ET AUCUN SECOND DIX N'EST ÉCRIT AILLEURS : ni l'écran, ni la vue ne
  // rognent une seconde fois.
  const chantier = sansCommentaires(lire('src/ui/chantier.js'));
  const vue = chantier.match(/export function vueDuJournal\([\s\S]*?\n\}/);
  assert.ok(vue !== null, 'la vue a disparu');
  assert.ok(!/\bslice\(/.test(vue[0]) && !/\b10\b/.test(vue[0]),
    'la vue rogne le journal une seconde fois');

  // ⚠ ET LE VOCABULAIRE DES VERDICTS EST CELUI DU MOTEUR, à la clé près.
  assert.deepEqual(Object.keys(LIBELLE_VERDICT).sort(),
    ['defaite', 'defaite-totale', 'victoire', 'victoire-totale']);
});
