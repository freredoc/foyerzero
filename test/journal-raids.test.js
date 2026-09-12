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
// ⚠ LE JOURNAL A DÉMÉNAGÉ DANS `ui/rapport.js` LE 11/09 : le dépliant d'un
// rapport rend les MÊMES lignes que le panneau de fin de raid, et celles-là
// vivaient dans `ui/raid.js`, qui importe `ui/chantier.js`. Un troisième fichier
// était la seule sortie sans recopie. `LIBELLE_VERDICT`, lui, est resté là où
// trois fichiers le lisent.
import {
  vueDuJournal, JOURNAL_VIDE, TITRE_JOURNAL, cleDuRapport,
  lignesDeLaDefense, lignesDetailleesDuRapport, LIBELLE_CAUSE,
  VERDICTS_MENES, VERDICTS_SUBIS, issueEstBonne,
} from '../src/ui/rapport.js';
import { LIBELLE_VERDICT } from '../src/ui/chantier.js';

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
  // ⚠ LE TITRE FINIT MAINTENANT PAR UN MARQUEUR DE DÉPLIANT — « ▾ » replié,
  // « ▴ » déplié, lot du 11/09. On mesure donc l'âge par `includes` et le
  // marqueur à part : sans lui, rien n'apprendrait au joueur qu'un rapport
  // s'ouvre.
  assert.ok(vue.sections[0].titre.includes('il y a 0 s'), vue.sections[0].titre);
  assert.ok(vue.sections[0].titre.endsWith('▾'), vue.sections[0].titre);

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
  assert.ok(titreDemi.includes('il y a 59 s'), titreDemi);
  // ⚠ LE POINT DÉCIMAL EST CELUI DE `direLaDuree`, ET IL N'EST PAS CORRIGÉ ICI.
  // Elle est PARTAGÉE avec la réserve de réparation, et le lot FICHE-JUSTE a
  // déjà déclaré ce point-là : le corriger dans le journal seul ferait diverger
  // deux affichages de la même grandeur. Relevé, non corrigé.
  // ⚠ ET LE MARQUEUR DU DÉPLIANT SUIT L'ÂGE depuis le 11/09 : l'ancre de fin de
  // chaîne devient l'ancre du marqueur.
  assert.ok(/il y a 1\.0 h {2}▾$/.test(vue.sections[1].titre), vue.sections[1].titre);
  assert.ok(/il y a 2\.0 h {2}▾$/.test(vue.sections[2].titre), vue.sections[2].titre);
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

test('JRN T8 — UNE vue, UN lecteur, UN écran : le journal a quitté les panneaux', () => {
  const rapport = sansCommentaires(lire('src/ui/rapport.js'));
  const chantier = sansCommentaires(lire('src/ui/chantier.js'));
  const offense = sansCommentaires(lire('src/ui/offense.js'));
  const raid = sansCommentaires(lire('src/ui/raid.js'));
  const session = sansCommentaires(lire('src/ui/session.js'));

  // ⚠⚠ CE TEST A CHANGÉ DE CIBLE LE 10/09, ET IL SE RESSERRE — point 4 d'Ethan,
  // « Bouton rapport a deplacer en haut entre base et mission ». Il gardait
  // « une seule vue, DEUX appelants » : le Chantier et l'Offense portaient chacun
  // un bouton, un panneau et six lignes de câblage pour peindre exactement la
  // même chose. Il garde maintenant « une seule vue, UN appelant » — ce qui est
  // strictement plus fort, puisqu'il n'y a plus qu'un endroit où le journal peut
  // diverger de lui-même.
  //
  // ⚠ LA VUE N'A PAS DÉMÉNAGÉ AVEC LE BOUTON, ET C'EST MESURÉ. `vueDuJournal` a
  // besoin de `formaterEntier`, de `direLaDuree` et de `peindreVueDuPanneau`, qui
  // vivent tous trois dans `ui/chantier.js` : la déplacer dans `ui/session.js`
  // aurait fait importer l'écran par la session, donc un cycle. Elle reste écrite
  // là où sont ses briques, et elle s'EXPORTE.
  // ⚠⚠ LA VUE A DÉMÉNAGÉ DANS `ui/rapport.js` LE 11/09, ET C'EST UN CYCLE
  // D'IMPORTS QUI L'A DÉCIDÉ, pas un goût de rangement. Ethan voulait ouvrir un
  // rapport pour voir ce qui s'est passé ; les quinze lignes d'un rapport
  // d'attaque sont déjà écrites par `lignesDuResultat`, qui vivait dans
  // `ui/raid.js` — lequel IMPORTE `ui/chantier.js`, où la vue vivait. Un
  // troisième fichier était la seule sortie sans recopie. L'arborescence est
  // donc `chantier.js` ← `rapport.js` ← `raid.js`, et aucune flèche ne remonte.
  assert.equal((rapport.match(/export function vueDuJournal\(/g) ?? []).length, 1);
  for (const [ou, code] of [['le Chantier', chantier], ['l\'Offense', offense],
    ['l\'écran de raid', raid], ['la session', session]]) {
    assert.ok(!/function vueDuJournal\(/.test(code), `${ou} a recopié la vue`);
  }
  const bloc = session.match(/import \{([^}]*)\} from '\.\/rapport\.js';/);
  assert.ok(bloc !== null && bloc[1].split(',').map((n) => n.trim()).includes('vueDuJournal'),
    'la session n\'importe pas la vue');
  // ⚠ ET AUCUNE FLÈCHE NE REMONTE : `ui/rapport.js` ne lit ni le raid ni la
  // session. Le jour où il le ferait, le cycle qu'on vient d'éviter reviendrait.
  assert.ok(!/from '\.\/raid\.js'/.test(rapport), '`ui/rapport.js` importe l\'écran de raid');
  assert.ok(!/from '\.\/session\.js'/.test(rapport), '`ui/rapport.js` importe la session');

  // ⚠ IMPORTER N'EST PAS APPELER — la leçon d'`ERGO T7 ter`. On compte les
  // APPELS, déclaration et imports retirés.
  const appels = (code) => (code.replace(/export function vueDuJournal\(/g, 'DECL(')
    .replace(/import \{[^}]*\} from '[^']*';/g, '')
    .match(/vueDuJournal\(/g) ?? []).length;
  assert.equal(appels(session), 1, 'la session n\'appelle pas la vue exactement une fois');
  assert.equal(appels(raid), 0, 'l\'écran de raid appelle le journal');
  // ⚠⚠ ET LES DEUX ÉCRANS NE L'APPELLENT PLUS DU TOUT. C'est la moitié qui
  // mesure le DÉPLACEMENT : un câblage laissé en place aurait rendu deux boutons
  // pour un panneau, et le bouton orphelin aurait levé au premier toucher.
  assert.equal(appels(chantier), 0, 'le Chantier appelle encore le journal');
  assert.equal(appels(offense), 0, 'l\'Offense appelle encore le journal');

  // ⚠ ET LA SESSION PEINT PAR LE RENDU PARTAGÉ, jamais à la main.
  assert.match(session, /peindreVueDuPanneau\(\s*\n?\s*doc, elementsJournal,/,
    'la session ne peint pas le journal par le rendu partagé');

  // ⚠⚠ LE BALISAGE PORTE UN ONGLET ET UN ÉCRAN, ET TOUTES LES FORMES ANTÉRIEURES
  // ONT DISPARU. La seconde moitié est celle qui compte : un bouton laissé dans
  // un écran est le défaut le plus probable de ces déplacements, et `$('…')`
  // rendrait `null` sans lever — le bouton serait simplement mort.
  //
  // ⚠ TROIS FORMES EN DEUX JOURS, ET LES DEUX PREMIÈRES SONT NOMMÉES ICI POUR
  // QU'ELLES NE REVIENNENT PAS : deux boutons posés sur deux champs (lot
  // JOURNAL), puis un bouton de barre ouvrant un panneau global (10/09), puis un
  // écran (11/09). `journal-titre` et `journal-corps` traversent les trois : ce
  // sont eux que `peindreVueDuPanneau` écrit.
  const html = lire('src/index.src.html');
  for (const id of ['onglet-journal', 'ecran-journal', 'journal-titre', 'journal-corps']) {
    assert.ok(html.includes(`id="${id}"`), `le balisage n'a pas ${id}`);
  }
  for (const id of ['tete-rapport', 'journal-panneau', 'journal-fermer']) {
    assert.ok(!html.includes(`id="${id}"`),
      `le balisage porte encore ${id} : le journal est resté un panneau`);
  }
  for (const id of ['chantier-journal', 'chantier-journal-panneau', 'chantier-journal-titre',
    'chantier-journal-corps', 'chantier-journal-fermer', 'offense-journal',
    'offense-journal-panneau', 'offense-journal-titre', 'offense-journal-corps',
    'offense-journal-fermer']) {
    assert.ok(!html.includes(`id="${id}"`), `le balisage porte encore ${id}`);
  }

  // ⚠ L'ONGLET EST ENTRE BASE ET MISSION — c'est la demande du 10/09, mot pour
  // mot, et devenir un écran ne l'a pas déplacé : une position se garde par
  // l'ORDRE, pas par la présence, et le poser après « Options » passerait toutes
  // les lignes ci-dessus.
  const barre = html.match(/<div id="tete-onglets">([\s\S]*?)<\/div>/)[1];
  const rang = (id) => barre.indexOf(`id="${id}"`);
  assert.ok(rang('onglet-base') < rang('onglet-journal'),
    'le journal n\'est pas après l\'onglet Base');
  assert.ok(rang('onglet-journal') < rang('onglet-mission'),
    'le journal n\'est pas avant l\'onglet Mission');

  const feuille = html.replace(/\/\*[\s\S]*?\*\//g, '');
  // ⚠ ET LES DEUX ANCIENNES RÈGLES SONT PARTIES AVEC LEURS BOUTONS. Une règle
  // qui ne peint plus rien se réécrit sans qu'on s'aperçoive qu'elle ne fait rien.
  assert.ok(!/#chantier-journal|#offense-journal/.test(feuille),
    'la feuille garde une règle pour un bouton qui n\'existe plus');
  // ⚠⚠ ET L'ÉCRAN PORTE `panneau-detail` POUR LE DESSIN, avec une SEULE règle à
  // lui — celle qui défait ce qui plaçait un panneau. Le 10/09, ce bloc exigeait
  // « aucune règle propre » ; un écran en a besoin d'une, et d'une seule : trois
  // déclarations, `position`, `max-height` et la bordure du haut. Les quatorze
  // règles de contenu, elles, restent partagées — c'est `EC T2` qui le garde.
  assert.match(html, /id="ecran-journal" class="panneau-detail"/);
  const propres = [...feuille.matchAll(/#ecran-journal\s*\{([^}]*)\}/g)];
  assert.equal(propres.length, 1, 'l\'écran du journal a plus d\'une règle à lui');
  assert.equal(propres[0][1].split(';').filter((d) => d.trim().length > 0).length, 3,
    'la règle de l\'écran du journal a grossi : elle ne défait plus, elle dessine');
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
  // ⚠⚠ ET RAID-ET-ÉCRAN Y EST PASSÉ À SON TOUR, LE 10/09, EN LE SACHANT : la
  // formation de raid RETENUE entre dans l'état — Ethan, « je reviens sur la
  // cible, les unités restent dans leur position ». Elle vivait jusque-là dans
  // la fermeture de l'écran de raid et ne se sérialisait pas ; un raid non
  // terminé est le cas d'usage, donc la mémoire doit survivre à la fermeture du
  // jeu. Le maillon v31 → v32 est dans `state.js`.
  assert.equal(SAVE_VERSION, 32);

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
  // ⚠ LA VUE VIT DANS `ui/rapport.js` DEPUIS LE 11/09.
  const rapport = sansCommentaires(lire('src/ui/rapport.js'));
  const vue = rapport.match(/export function vueDuJournal\([\s\S]*?\n\}/);
  assert.ok(vue !== null, 'la vue a disparu');
  assert.ok(!/\bslice\(/.test(vue[0]) && !/\b10\b/.test(vue[0]),
    'la vue rogne le journal une seconde fois');

  // ⚠ ET LE VOCABULAIRE DES VERDICTS EST CELUI DU MOTEUR, à la clé près.
  assert.deepEqual(Object.keys(LIBELLE_VERDICT).sort(),
    ['defaite', 'defaite-totale', 'victoire', 'victoire-totale']);
});

// ---------------------------------------------------------------------------
// JD T1 — le dépliant : un rapport s'ouvre, et il dit ce qui s'est passé
// ---------------------------------------------------------------------------

test('JD T1 — un rapport déplié montre son détail, et lui seul', () => {
  // ⚠⚠ ETHAN, 11/09 : « je veux, quand je clique sur un des rapports, voir ce
  // qui s'est passé — là je vois juste "je me suis fait attaquer", c'est écrit,
  // et je vois pas ce qui s'est passé ». Le journal montrait QUATRE lignes par
  // rapport ; un rapport de défense en porte TREIZE. Rien ne manquait dans la
  // sauvegarde, et ce test le prouve en dépliant ce qui y était déjà.
  const etat = creerEtat(11);
  garderLeRapport(etat, rapportMene(3));
  etat.horloge.nbTicks = 600;
  garderLeRapport(etat, rapportSubi(8));
  const [mene, subi] = etat.rapports;

  // Replié : les quatre lignes du résumé, et rien de plus, sur les DEUX.
  const ferme = vueDuJournal(etat.rapports, 600);
  assert.deepEqual(ferme.sections.map((s) => s.lignes.length), [4, 4]);
  for (const s of ferme.sections) assert.ok(s.titre.endsWith('▾'), s.titre);

  // Déplié : le détail s'AJOUTE, il ne remplace pas — replier ne doit pas
  // effacer ce qu'on lisait, déplier ne doit pas faire relire autre chose.
  const ouvert = vueDuJournal(etat.rapports, 600, cleDuRapport(subi));
  const [sectionSubi, sectionMene] = ouvert.sections;
  assert.ok(sectionSubi.titre.endsWith('▴'), sectionSubi.titre);
  assert.ok(sectionMene.titre.endsWith('▾'), sectionMene.titre);
  assert.deepEqual(sectionSubi.lignes.slice(0, 4), ferme.sections[0].lignes,
    'déplier a réécrit le résumé au lieu de lui ajouter le détail');
  assert.ok(sectionSubi.lignes.length > 4, 'le dépliant n\'ajoute rien');
  // ⚠ ET UN SEUL À LA FOIS : l'autre reste replié. Deux dépliants ouverts sur un
  // écran de 360 px demanderaient de faire défiler pour comparer.
  assert.equal(sectionMene.lignes.length, 4);

  // ⚠⚠ LA CLÉ N'EST PAS L'INDICE, ET C'EST LE PIÈGE QUE CE MONTAGE MESURE. Le
  // journal est une FILE de dix : à l'arrivée du onzième rapport, le plus ancien
  // sort et tous les indices glissent. Une clé d'indice ouvrirait alors un autre
  // raid pendant que le joueur le regarde ; le tick et le sens, eux, ne bougent
  // pas. On sature la file et on vérifie que le dépliant suit SON rapport.
  const cle = cleDuRapport(subi);
  for (let n = 0; n < APRES_RAID.rapportsGardes; n += 1) {
    etat.horloge.nbTicks = 1000 + n;
    garderLeRapport(etat, rapportMene(n + 1));
  }
  assert.ok(!etat.rapports.includes(subi), 'le montage n\'a pas fait glisser la file');
  const apres = vueDuJournal(etat.rapports, 5000, cle);
  assert.deepEqual(apres.sections.map((s) => s.lignes.length),
    apres.sections.map(() => 4),
    'une clé d\'indice a rouvert un autre rapport après le glissement de la file');

  // ⚠ LE DÉTAIL D'UN RAID SUBI NOMME CE QUE LE RAPPORT PORTE, et il n'invente
  // rien : chaque libellé se lit sur un champ de l'entrée rangée par le moteur.
  const detail = new Map(lignesDeLaDefense({
    ...subi, restantDefense: 41, restantBatiments: 88, reserveVidee: true,
    autoReparationMilli: 4200, garnisonAuPlancher: 2, batimentsAuPlancher: 0,
  }).map((l) => [l.libelle, l.avant]));
  assert.equal(detail.get('Fin du combat'), LIBELLE_CAUSE.attaquants);
  assert.equal(detail.get('Défense restante'), '41 %');
  assert.equal(detail.get('Bâtiments restants'), '88 %');
  assert.equal(detail.get('Réserve de réparation'), 'vidée');
  assert.match(detail.get('Auto-réparation'), /4 PV/);
  // ⚠ ET « AU PLANCHER » N'EST PAS « DÉTRUIT » : une pièce au plancher se répare.
  assert.match(detail.get('Garnison au plancher'), /^2 /);

  // ⚠ L'AUTO-RÉPARATION NE SE DIT QUE QUAND ELLE A AGI : à zéro, la ligne
  // apprendrait qu'un module existe sans dire qu'il n'est pas acquis.
  const sansModule = lignesDeLaDefense({ ...subi, autoReparationMilli: 0 })
    .map((l) => l.libelle);
  assert.ok(!sansModule.includes('Auto-réparation'));

  // ⚠⚠ ET LES QUATRE CAUSES SONT CELLES DU MOTEUR, CONFRONTÉES À LA SOURCE. Une
  // cinquième posée par `terminer(etat, …)` dans `sim/combat.js` ferait afficher
  // « undefined » à un journal qui recopierait la liste de mémoire.
  const combat = lire('src/sim/combat.js');
  const causes = [...combat.matchAll(/terminer\(etat, '([a-z-]+)'\)/g)].map((m) => m[1]);
  assert.ok(causes.length >= 4, `montage : ${causes.length} appels trouvés`);
  assert.deepEqual([...new Set(causes)].sort(), Object.keys(LIBELLE_CAUSE).sort(),
    'les causes du moteur et les libellés du journal ont divergé');

  // ⚠ UN RAID MENÉ, LUI, RÉEMPLOIE LA VUE DU PANNEAU DE FIN — pas une seconde
  // écriture. On mesure que le dépliant rend bien SES lignes.
  const detailMene = lignesDetailleesDuRapport({
    ...mene, restantDefense: 0, restantBatiments: 0, restantSouche: 0, restantEtai: 0,
    reparationInduite: {},
  }).map((l) => l.libelle);
  assert.ok(detailMene.includes('Verdict') && detailMene.includes('Butin'),
    `le détail d'un raid mené ne vient pas du panneau de fin : ${detailMene.join(', ')}`);
});

// ---------------------------------------------------------------------------
// VITESSE — le point 9 : le journal dit de quel côté l'issue tombe
// ---------------------------------------------------------------------------

test('VIT T6 — les six clauses d\'issue sont celles que le moteur produit', () => {
  // ⚠⚠ LA PRÉMISSE DU BRIEF EST FAUSSE, ET C'EST MESURÉ ICI. Il écrit : « sur un
  // raid SUBI, "Victoire totale" est l'issue vue de l'ATTAQUANT ».
  // `verdictDeLaDefense` porte en toutes lettres « le miroir de `verdictDuRaid`,
  // vu du côté de celui qui se défend » — base rasée → `defaite-totale`, rien
  // touché → `victoire-totale`. **Le verdict est déjà celui du joueur.** Ce qui
  // manquait, c'est que rien ne le DISAIT.
  //
  // ⚠ CE TEST CONFRONTE LES TABLES À LA SOURCE, IL NE LES RECOPIE PAS. C'est
  // l'idiome de `JD T1` juste au-dessus : une cinquième branche ajoutée à l'une
  // des deux fonctions du moteur fait tomber ce test au lieu d'afficher
  // « undefined » au joueur.
  //
  // MONTAGE QUI LE FAIT TOMBER : ajouter un `return 'match-nul'` dans
  // `verdictDuRaid`, ou retirer `defaite` de la table du subi.
  const verdictsDe = (fichier, fonction) => {
    const source = sansCommentaires(lire(fichier));
    const debut = source.indexOf(`function ${fonction}(`);
    assert.ok(debut > 0, `le montage ne trouve pas ${fonction} dans ${fichier}`);
    const corps = source.slice(debut, source.indexOf('\n}', debut));
    const trouves = [...corps.matchAll(/return '([a-z-]+)'/g)].map((m) => m[1]);
    assert.ok(trouves.length >= 3,
      `le montage ne mesure rien : ${trouves.length} verdicts trouvés dans ${fonction}`);
    return [...new Set(trouves)].sort();
  };

  const menes = verdictsDe('src/sim/raid.js', 'verdictDuRaid');
  const subis = verdictsDe('src/sim/raid-ouvrage.js', 'verdictDeLaDefense');
  // ⚠ LE MONTAGE PROUVE D'ABORD QU'IL DISCRIMINE : les deux ensembles diffèrent.
  assert.notDeepEqual(menes, subis,
    'le montage ne mesure rien : les deux camps produisent les mêmes verdicts');

  assert.deepEqual(Object.keys(VERDICTS_MENES).sort(), menes,
    'les clauses d\'un raid mené et les verdicts du moteur ont divergé');
  assert.deepEqual(Object.keys(VERDICTS_SUBIS).sort(), subis,
    'les clauses d\'un raid subi et les verdicts du moteur ont divergé');
  // ⚠ ET CHAQUE VERDICT A UN MOT DANS LA TABLE PARTAGÉE — sans quoi la ligne
  // afficherait la clé interne.
  for (const v of [...menes, ...subis]) {
    assert.ok(LIBELLE_VERDICT[v] !== undefined, `« ${v} » n'a pas de libellé`);
  }

  // ⚠ « BONNE » SE DÉRIVE DU NOM, ET LES DEUX CÔTÉS SE DISTINGUENT.
  assert.equal(issueEstBonne('victoire-totale'), true);
  assert.equal(issueEstBonne('victoire'), true);
  assert.equal(issueEstBonne('defaite'), false);
  assert.equal(issueEstBonne('defaite-totale'), false);
});

test('VIT T7 — la ligne d\'issue nomme ce qui s\'est passé, et sa couleur suit', () => {
  // ⚠⚠ LE DÉFAUT D'ETHAN, PRIS PAR SON VRAI BOUT : « Victoire totale » sous
  // « Raid subi » se lit dans les deux sens tant qu'on ne connaît pas la
  // convention. La ligne porte maintenant ce qui s'est passé.
  //
  // MONTAGE QUI LE FAIT TOMBER : rendre `LIBELLE_VERDICT[verdict]` seul, sans la
  // clause du sens — c'est exactement la ligne d'avant le lot.
  const tick = creerEtat(7).horloge.nbTicks;
  const subi = {
    sens: 'defense', tick, verdict: 'victoire-totale',
    attaquant: ATTAQUANTE, sanction: { perdu: null },
  };
  const mene = {
    sens: 'offense', tick, verdict: 'victoire-totale',
    cible: ATTAQUANTE, butin: { quartz: 10, scorie: 5 },
  };
  // ⚠ LE JOURNAL SE LIT À L'ENVERS — le plus récent d'abord, sur une COPIE. Le
  // montage range donc le mené en dernier pour le retrouver en tête.
  const vue = vueDuJournal([subi, mene], tick);
  const [sMene, sSubi] = vue.sections;
  const issueDe = (section) => section.lignes.find((l) => l.libelle === 'Issue');

  // ⚠ LES DEUX SECTIONS PORTENT LE MÊME VERDICT, ET C'EST LE POINT DU MONTAGE :
  // s'il variait, on ne saurait pas si c'est le SENS qui change la phrase.
  assert.equal(sMene.titre.startsWith('Raid mené'), true);
  assert.equal(sSubi.titre.startsWith('Raid subi'), true);
  assert.equal(sMene.classe, 'raid-mene');
  assert.equal(sSubi.classe, 'raid-subi');
  assert.notEqual(sMene.classe, sSubi.classe,
    'le code couleur ne sépare pas mené de subi');

  const menee = issueDe(sMene);
  const subie = issueDe(sSubi);
  assert.notEqual(menee.avant, subie.avant,
    'le même verdict rend la même phrase des deux côtés : la clause du sens manque');
  assert.match(menee.avant, /^Victoire totale · /);
  assert.match(menee.avant, /site rasé/);
  assert.match(subie.avant, /attaque repoussée/);
  // ⚠ ET LA COULEUR DIT L'ISSUE, PAS LE SENS : une attaque repoussée est une
  // BONNE nouvelle, et le titre rouge du « Raid subi » ne doit pas la teindre.
  assert.equal(menee.classe, 'issue-bonne');
  assert.equal(subie.classe, 'issue-bonne');

  const rase = vueDuJournal([{ ...subi, verdict: 'defaite-totale' }], tick);
  const perdue = issueDe(rase.sections[0]);
  assert.equal(perdue.classe, 'issue-mauvaise');
  assert.match(perdue.avant, /votre base est rasée/);

  // ⚠ ET LA FEUILLE PORTE LES QUATRE RÈGLES — une classe que le code pose sans
  // qu'aucune règle ne la peigne se réécrit sans qu'on s'aperçoive de rien.
  const feuille = lire('src/index.src.html');
  for (const [selecteur, teinte] of [
    ['.panneau-detail .section.raid-mene h3', '#8C9A72'],
    ['.panneau-detail .section.raid-subi h3', '#E43E32'],
    ['.panneau-detail .ligne.issue-bonne b', '#8C9A72'],
    ['.panneau-detail .ligne.issue-mauvaise b', '#E43E32'],
  ]) {
    const motif = new RegExp(
      `${selecteur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{[^}]*${teinte}`,
    );
    assert.match(feuille, motif, `« ${selecteur} » ne peint pas ${teinte}`);
  }
  // ⚠ ET L'ORDRE PORTE : `.depliable h3` a la MÊME spécificité, et une section du
  // journal porte les deux classes. Si elle repassait devant, le code couleur
  // serait inerte sur le seul écran qui l'emploie.
  assert.ok(feuille.indexOf('.panneau-detail .section.raid-subi h3')
    > feuille.indexOf('.panneau-detail .section.depliable h3'),
    'la règle du sens passe avant celle du dépliant : la teinte du sens est perdue');
});
