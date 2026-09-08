// Lot BÂTIMENTS-QUATRE-ÉTATS — un état devient quatre, onze bâtiments deviennent
// quinze, et le Collecteur se dédouble.
//
// ⚠⚠ CE FICHIER GARDE DEUX CHOSES QUI NE SE RESSEMBLENT PAS. D'abord la
// DISPARITION d'un identifiant : `collecteur` n'existe plus, et un lot de
// renommage qui en laisse traîner un dans un coin produit un `undefined` qui se
// promène — on l'a mesuré deux fois pendant celui-ci, dans `couts-militaires` et
// `niveau-de-base`, où le nom mort passait sans que rien ne rougisse. Ensuite le
// RABATTEMENT d'état, qui est ce qui rend le lot livrable avant l'art : un
// bâtiment dont `_tres_abime` n'est pas cousu doit retomber sur ce qui existe,
// sans qu'une liste écrite quelque part dise lequel.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  BASE_BATIMENTS, ORDRE_PALETTE, VIGNETTES_MIXTES, CHAMPS,
  ETATS_BATIMENT, SUFFIXE_ETAT_BATIMENT, etatDuBatiment,
  batimentDeLaVignette, batimentDeReference, posablesSurUnChamp,
} from '../src/data/base.js';
import { BATIMENTS } from '../src/data/sites.js';
import { ATLAS } from '../src/data/atlas.js';
import { couchesDeLEntite } from '../src/render/scene.js';
import { etatDeLaPose } from '../src/sim/reparation.js';
import {
  creerEtat, serialiser, charger, migrer, poser, exigerAucunePerte,
} from '../src/sim/state.js';
import { poserLaBaseSur } from '../src/sim/deplacement.js';
import { baseCourante } from '../src/sim/base-courante.js';
import { ressourceDeLaCase } from '../src/sim/champs.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Le nom de sprite d'un bâtiment dans un état, tel que le jeu le compose. */
const spriteDe = (id, etat, proprietaire = 'joueur') => couchesDeLEntite(
  { genre: 'batiment', id, proprietaire, camp: 'defense', etat },
)[0].nom;

// ---------------------------------------------------------------------------
// B4 T1 — `collecteur` a disparu partout
// ---------------------------------------------------------------------------

test('B4 T1 — l\'identifiant `collecteur` n\'existe plus, et personne ne le nomme', () => {
  // ⚠⚠ LE MOTIF EST BORNÉ DES DEUX CÔTÉS, ET SANS ÇA IL NE MESURE RIEN.
  // `collecteurQuartz` contient `collecteur` : un motif nu passerait toujours.
  // Ce qu'on cherche est l'identifiant SEUL — entre guillemets, en accès de
  // propriété, ou en clé d'objet — et jamais le nom commun français, qui reste
  // légitime dans une phrase (« un collecteur ne se pose que sur un champ »).
  const MOTIF = /(['"`])collecteur\1|\.collecteur(?![A-Za-z])|(?<![\w.])collecteur:/g;

  // ⚠ FALSIFIABLE DES DEUX CÔTÉS, ET C'EST LE MONTAGE QUE LE BRIEF DEMANDE.
  // Le motif doit attraper l'appât, et laisser passer le nom vivant.
  assert.equal("const x = 'collecteur';".match(MOTIF)?.length, 1, 'l\'appât passe');
  assert.equal("const x = 'collecteurQuartz';".match(MOTIF), null,
    'le motif attrape `collecteurQuartz` : il n\'est pas borné à droite');
  assert.equal('un collecteur ne se pose que sur un champ'.match(MOTIF), null,
    'le motif attrape le nom commun : il ne mesure plus un identifiant');

  // ⚠⚠ UNE SEULE EXCEPTION, ET ELLE EST LA RAISON D'ÊTRE DU LOT. La migration
  // v28 → v29 DOIT nommer le mort : c'est elle qui le convertit, et une
  // migration qui ne saurait pas prononcer le nom qu'elle remplace ne
  // remplacerait rien. Elle est déclarée ici avec son compte exact — une
  // occurrence de plus dans ce fichier-là ferait rougir aussi.
  const EXCEPTIONS = { 'src/sim/state.js': 1 };

  const fautifs = {};
  for (const dossier of ['data', 'sim', 'render', 'ui', 'son']) {
    const base = join(RACINE, 'src', dossier);
    for (const f of readdirSync(base).filter((n) => n.endsWith('.js'))) {
      const rel = `src/${dossier}/${f}`;
      const source = readFileSync(join(base, f), 'utf8')
        // Les commentaires ont le droit de citer le nom mort pour raconter son
        // histoire — c'est même ce qu'on leur demande. On ne lit que le CODE.
        .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
      const n = (source.match(MOTIF) ?? []).length;
      if (n !== (EXCEPTIONS[rel] ?? 0)) fautifs[rel] = n;
    }
  }
  assert.deepEqual(fautifs, {},
    'l\'identifiant `collecteur` est encore nommé dans du code de `src/`');

  // Et la table ne le porte plus du tout : c'est la moitié qui compte vraiment.
  assert.equal(BASE_BATIMENTS.collecteur, undefined);
  assert.ok(!Object.prototype.hasOwnProperty.call(BASE_BATIMENTS, 'collecteur'));
  assert.deepEqual(Object.keys(BASE_BATIMENTS).filter((id) => id.startsWith('collecteur')),
    ['collecteurQuartz', 'collecteurScorie']);
});

// ---------------------------------------------------------------------------
// B4 T2 — les vingt bâtiments ont leurs quatre noms d'état, et l'atlas les porte
// ---------------------------------------------------------------------------

test('B4 T2 — vingt bâtiments × quatre états, et le compte se lit dans l\'atlas', () => {
  // ⚠⚠ LE COMPTE N'EST PAS ÉCRIT ICI, IL EST LU. Écrire « 80 » en dur ferait de
  // ce test une seconde table, qui cesserait d'être vraie au premier bâtiment
  // ajouté sans que rien ne le dise — exactement ce que le lot vient de vivre
  // avec les comptes de `11` semés dans huit fichiers.
  const joueur = Object.keys(BASE_BATIMENTS);
  const ouvrage = Object.keys(BATIMENTS);
  assert.equal(joueur.length, 15);
  assert.equal(ouvrage.length, 5);

  const attendus = [];
  for (const [ids, proprietaire] of [[joueur, 'joueur'], [ouvrage, 'ouvrage']]) {
    for (const id of ids) {
      for (const etat of ETATS_BATIMENT) attendus.push(spriteDe(id, etat, proprietaire));
    }
  }
  // Quatre-vingts noms DISTINCTS : un rabattement qui écraserait deux états sur
  // le même fichier passerait la boucle ci-dessous sans qu'on le voie.
  assert.equal(new Set(attendus).size, 80, `${new Set(attendus).size} noms distincts`);
  for (const nom of attendus) {
    assert.ok(ATLAS.batiment.noms.includes(nom), `${nom} absent de l'atlas cousu`);
  }

  // ⚠ ET L'ATLAS N'EN PORTE PAS D'AUTRES QUE CE QUE LE CODE SAIT DEMANDER — aux
  // trois près qui ne sont pas des bâtiments : les deux ruines de case et
  // l'icône de la vignette mixte.
  const horsBatiments = ATLAS.batiment.noms.filter((n) => !attendus.includes(n));
  assert.deepEqual(horsBatiments.sort(),
    ['bat_j_collecteur_mixte', 'ruine_j', 'ruine_o']);
  assert.equal(ATLAS.batiment.noms.length, 83);
});

// ---------------------------------------------------------------------------
// B4 T3 — les seuils sont monotones et couvrent [0, pvMax] sans trou
// ---------------------------------------------------------------------------

test('B4 T3 — les quatre états couvrent tous les PV, sans trou ni recouvrement', () => {
  // ⚠⚠ ON BALAIE AU PV PRÈS, ET C'EST CE QUE LA RÈGLE EXIGE. « Intact » est une
  // ÉGALITÉ, pas une fraction : un balayage par pourcentages ne verrait jamais
  // la différence entre `pv === pvMax` et `pv / pvMax > 0.99`, qui est très
  // exactement la faute que le brief nomme.
  const MAX = 200;
  const vus = [];
  for (let pv = 0; pv <= MAX; pv += 1) vus.push(etatDuBatiment(pv, MAX));

  // Aucun trou : chaque PV a un état, et c'en est un des quatre.
  assert.equal(vus.length, MAX + 1);
  for (const e of vus) assert.ok(ETATS_BATIMENT.includes(e), `état inconnu « ${e} »`);

  // Aucun recouvrement : la suite est MONOTONE — une fois qu'on a quitté un
  // état, on n'y revient pas. C'est ce qui interdit d'intervertir deux seuils.
  const ordre = ETATS_BATIMENT.slice().reverse();   // du plus mort au plus sain
  let rang = 0;
  for (const e of vus) {
    const r = ordre.indexOf(e);
    assert.ok(r >= rang, `les états ne sont pas monotones : ${e} après ${ordre[rang]}`);
    rang = r;
  }
  // Et les quatre paraissent : une règle qui n'en rendrait que trois passerait
  // tout ce qui précède.
  assert.deepEqual([...new Set(vus)], ['detruit', 'tresAbime', 'abime', 'intact']);

  // ⚠⚠ LES QUATRE FRONTIÈRES, AU PV PRÈS — c'est la liste que le brief dicte.
  assert.equal(etatDuBatiment(MAX, MAX), 'intact');
  assert.equal(etatDuBatiment(MAX - 1, MAX), 'abime', 'un PV de moins que plein est ABÎMÉ');
  assert.equal(etatDuBatiment(MAX / 2, MAX), 'abime', '50 % appartient à `_abime`');
  assert.equal(etatDuBatiment(MAX / 2 - 1, MAX), 'tresAbime');
  assert.equal(etatDuBatiment(1, MAX), 'tresAbime', '1 PV tient encore');
  assert.equal(etatDuBatiment(0, MAX), 'detruit');

  // ⚠ ET SUR UN PETIT BÂTIMENT AUSSI. Un `pv / pvMax > 0.99` marcherait sur
  // 1 000 PV et pas sur 50 : la faute ne se verrait que sur les petits.
  assert.equal(etatDuBatiment(50, 50), 'intact');
  assert.equal(etatDuBatiment(49, 50), 'abime');
  // Et sur un maximum IMPAIR, où une division rendrait la moitié inexacte.
  assert.equal(etatDuBatiment(4, 7), 'abime', '4/7 est au-dessus de la moitié');
  assert.equal(etatDuBatiment(3, 7), 'tresAbime', '3/7 est en dessous');

  // La table des suffixes couvre les quatre états, et l'intact n'en a pas.
  assert.deepEqual(Object.keys(SUFFIXE_ETAT_BATIMENT).sort(), ETATS_BATIMENT.slice().sort());
  assert.equal(SUFFIXE_ETAT_BATIMENT.intact, '');
  assert.equal(new Set(Object.values(SUFFIXE_ETAT_BATIMENT)).size, 4);
});

// ---------------------------------------------------------------------------
// B4 T4 — la dégradation est propre : l'atlas décide, pas une liste
// ---------------------------------------------------------------------------

test('B4 T4 — un état absent de l\'atlas retombe sur ce qui existe', () => {
  // ⚠⚠ LE MONTAGE RETIRE UNE ENTRÉE DE L'ATLAS, ET C'EST CELUI QUE LE BRIEF
  // DEMANDE. Les quatre-vingts sprites sont cousus aujourd'hui : sans ce
  // montage, le rabattement ne serait jamais emprunté et le test serait vert sur
  // un code mort. On retire donc les états d'un bâtiment, un par un, et on exige
  // que le nom rendu reste un nom que l'atlas porte.
  const noms = ATLAS.batiment.noms;
  const retires = [
    'bat_j_caserne_tres_abime', 'bat_j_caserne_abime', 'bat_j_caserne_detruit',
  ];
  const sauvegarde = noms.slice();
  try {
    // Un seul manque : `_tres_abime` retombe sur `_abime`, son voisin le plus
    // proche du côté sain.
    noms.splice(noms.indexOf('bat_j_caserne_tres_abime'), 1);
    assert.equal(spriteDe('caserne', 'tresAbime'), 'bat_j_caserne_abime');
    assert.equal(spriteDe('caserne', 'detruit'), 'bat_j_caserne_detruit',
      'un état voisin absent a déteint sur un état présent');

    // Deux manquent : on continue vers le sain, on ne saute pas au détruit.
    noms.splice(noms.indexOf('bat_j_caserne_abime'), 1);
    assert.equal(spriteDe('caserne', 'tresAbime'), 'bat_j_caserne');
    assert.equal(spriteDe('caserne', 'abime'), 'bat_j_caserne');

    // Trois manquent : même le détruit retombe, et l'intact reste le plancher.
    noms.splice(noms.indexOf('bat_j_caserne_detruit'), 1);
    for (const etat of ETATS_BATIMENT) {
      const nom = spriteDe('caserne', etat);
      assert.equal(nom, 'bat_j_caserne', `${etat} ne retombe pas sur l'intact`);
      assert.ok(noms.includes(nom), `${nom} n'est pas dans l'atlas`);
    }
  } finally {
    // ⚠ LA TABLE EST REMISE, et ce n'est pas de la politesse : un test qui
    // laisserait l'atlas amputé empoisonnerait tous ceux qui suivent.
    noms.length = 0;
    noms.push(...sauvegarde);
  }
  assert.deepEqual(ATLAS.batiment.noms, sauvegarde);
  for (const nom of retires) assert.ok(ATLAS.batiment.noms.includes(nom));

  // ⚠⚠ ET SANS MONTAGE, LES QUATRE-VINGTS NOMS EXISTENT VRAIMENT. C'est l'autre
  // moitié : le rabattement ne doit servir à personne aujourd'hui.
  for (const id of Object.keys(BASE_BATIMENTS)) {
    for (const etat of ETATS_BATIMENT) {
      assert.equal(spriteDe(id, etat).endsWith(SUFFIXE_ETAT_BATIMENT[etat]), true,
        `${id}/${etat} a été rabattu alors que son sprite existe`);
    }
  }

  // Un état inconnu LÈVE plutôt que de retomber : se tromper de nom d'état est
  // une faute de programme, pas un manque d'art.
  assert.throws(() => spriteDe('caserne', 'fumee'), /état inconnu/);
});

// ---------------------------------------------------------------------------
// B4 T5 — `ruine_<c>` et `_detruit` ne se confondent pas
// ---------------------------------------------------------------------------

test('B4 T5 — une case rasée rend `ruine_<c>`, un bâtiment à zéro PV rend `_detruit`', () => {
  // ⚠⚠ DEUX CHOSES DIFFÉRENTES, ET LE LOT AURAIT PU LES FONDRE. La ruine se pose
  // quand la CASE est rasée — il n'y a plus de bâtiment du tout ; `_detruit`
  // quand le bâtiment est à zéro PV mais TOUJOURS LÀ, réparable. Les confondre
  // ferait disparaître de l'écran un bâtiment que le joueur peut encore relever.
  assert.equal(spriteDe('caserne', 'detruit'), 'bat_j_caserne_detruit');
  assert.equal(spriteDe('souche', 'detruit', 'ouvrage'), 'bat_o_souche_detruit');
  for (const camp of ['j', 'o']) {
    assert.ok(ATLAS.batiment.noms.includes(`ruine_${camp}`));
    // Aucun nom de ruine ne porte de suffixe d'état, et aucun état ne rend une
    // ruine : les deux familles de noms sont disjointes.
    assert.equal(`ruine_${camp}`.includes('_detruit'), false);
  }
  const detruits = ATLAS.batiment.noms.filter((n) => n.endsWith('_detruit'));
  assert.equal(detruits.length, 20, 'vingt bâtiments, vingt états détruits');
  for (const n of detruits) assert.ok(n.startsWith('bat_'), `${n} n'est pas un bâtiment`);

  // ⚠ ET `_detruit` A ENFIN UN LECTEUR. Le brief le relevait : seize sprites
  // dormaient dans le livrable depuis leur fabrication, nommés par personne —
  // « troisième fois du dépôt après `ui_pause` et `ruine_j`/`ruine_o` ».
  const scene = readFileSync(join(RACINE, 'src', 'render', 'scene.js'), 'utf8');
  assert.match(scene, /SUFFIXE_ETAT_BATIMENT/,
    'le rendu ne lit plus la table des suffixes');
  assert.equal(etatDeLaPose({ id: 'caserne', niveau: 1, degatsMilli: 2_500_000 }), 'detruit');
  assert.equal(etatDeLaPose({ id: 'caserne', niveau: 1 }), 'intact');
});

// ---------------------------------------------------------------------------
// B4 T6 — le joueur et l'Ouvrage passent par le même chemin
// ---------------------------------------------------------------------------

test('B4 T6 — aucun camp écrit en dur dans le chemin des bâtiments', () => {
  // ⚠⚠ LE NOM SE COMPOSE SUR LE PROPRIÉTAIRE, ET C'EST LA FAUTE QUE `scene.js`
  // A DÉJÀ PAYÉE DEUX FOIS. Un `bat_j_` écrit en dur donnait le bâtiment du
  // joueur à l'Ouvrage sans lever, les deux existant dans l'atlas.
  const scene = readFileSync(join(RACINE, 'src', 'render', 'scene.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const couches = scene.slice(scene.indexOf('function nomAvecEtat'),
    scene.indexOf('function couchesDeLaRuine'));
  assert.ok(couches.length > 200, 'la tranche mesurée est vide : le motif a changé');
  for (const interdit of [/=== 'o'/, /=== 'j'/, /'bat_j_'/, /'bat_o_'/]) {
    assert.doesNotMatch(couches, interdit,
      `le chemin des bâtiments écrit un camp en dur : ${interdit}`);
  }
  // Falsifiable : les motifs attrapent de vrais appâts.
  assert.match("if (c === 'o') return 'bat_o_' + id;", /=== 'o'/);

  // ⚠ ET LES DEUX CAMPS RENDENT VRAIMENT DES NOMS DIFFÉRENTS, dans les quatre
  // états. Sans cette moitié, une fonction qui rendrait toujours `bat_j_`
  // passerait le balayage de source.
  for (const etat of ETATS_BATIMENT) {
    assert.ok(spriteDe('caserne', etat, 'joueur').startsWith('bat_j_'));
    assert.ok(spriteDe('souche', etat, 'ouvrage').startsWith('bat_o_'));
  }
});

// ---------------------------------------------------------------------------
// B4 T7 — le Collecteur dédoublé : le champ décide, et rien d'autre
// ---------------------------------------------------------------------------

test('B4 T7 — le champ décide DU collecteur, et la palette n\'en propose qu\'un', () => {
  // ⚠ LA GARDE DU NUMÉRO DE SAUVEGARDE APPARTIENT AU MAILLON LE PLUS RÉCENT,
  // une seule fois — la règle du dépôt depuis le lot SITE-ENTAMÉ.
  assert.equal(
    JSON.parse(readFileSync(join(RACINE, 'package.json'), 'utf8')).version,
    '0.99.31',
  );

  // Le terrain tranche, dans les deux sens, et rien d'autre ne se pose dessus.
  assert.equal(batimentDeLaVignette('collecteurMixte', 'quartz'), 'collecteurQuartz');
  assert.equal(batimentDeLaVignette('collecteurMixte', 'scorie'), 'collecteurScorie');
  assert.deepEqual(CHAMPS.posableDessus, {
    quartz: ['collecteurQuartz'],
    scorie: ['collecteurScorie'],
  });
  assert.deepEqual([...posablesSurUnChamp()].sort(),
    ['collecteurQuartz', 'collecteurScorie']);

  // ⚠⚠ HORS CHAMP, ELLE REND LE DÉFAUT AU LIEU DE LEVER, et c'est un geste
  // ORDINAIRE du joueur : viser une case nue. Le refus vient alors de
  // `problemesDeLaPose`, avec la phrase que le moteur écrit depuis le 26/08.
  assert.equal(batimentDeLaVignette('collecteurMixte', null), 'collecteurQuartz');
  // Une ressource INCONNUE, elle, est une faute de programme : elle lève.
  assert.throws(() => batimentDeLaVignette('collecteurMixte', 'quartzz'), /ne sait pas quoi poser/);
  // Et une vignette qui n'est pas mixte se rend elle-même, sans que l'appelant
  // ait à demander laquelle il tient.
  assert.equal(batimentDeLaVignette('raffinerie', 'quartz'), 'raffinerie');
  assert.equal(batimentDeReference('raffinerie'), 'raffinerie');

  // ⚠⚠ QUINZE BÂTIMENTS, QUATORZE VIGNETTES, ET LA COUVERTURE EST EXACTE. Le
  // joueur n'a jamais à choisir entre les deux collecteurs — c'est l'arbitrage
  // d'Ethan du 08/09, et c'est ce qui garde vraie la phrase du tutoriel : « c'est
  // le champ sous lui qui décide de ce qu'il sort ».
  assert.equal(ORDRE_PALETTE.length, 14);
  assert.deepEqual(
    [...new Set(ORDRE_PALETTE.flatMap(
      (v) => (VIGNETTES_MIXTES[v] ? Object.values(VIGNETTES_MIXTES[v].pose) : [v]),
    ))].sort(),
    Object.keys(BASE_BATIMENTS).sort(),
  );
  assert.equal(ORDRE_PALETTE.filter((v) => VIGNETTES_MIXTES[v]).length, 1);
});

// ---------------------------------------------------------------------------
// B4 T8 — la migration d'une base QUI A BOUGÉ
// ---------------------------------------------------------------------------

test('B4 T8 — une base déplacée garde tous ses bâtiments, et ses collecteurs suivent leur champ', () => {
  // ⚠⚠ CE TEST VIENT D'UNE FAUTE RÉELLE, ET IL EN GARDE DEUX. La première
  // écriture de la migration v28 → v29 recalculait le terrain depuis
  // `base.position` au lieu de `base.fondation` — le bandeau de `sim/state.js`
  // prévient pourtant en capitales : « DÉRIVÉ DE LA FONDATION, PAS DE LA POSITION
  // COURANTE […] il ne faut jamais les confondre ». Une base qui a bougé, ce qui
  // est le geste le plus ordinaire du jeu, voyait donc un terrain qui n'est pas
  // le sien.
  //
  // ⚠⚠ ET ELLE FILTRAIT LA DISPOSITION : les collecteurs « tombés à côté » de
  // ce faux terrain étaient EFFACÉS. Sur la partie d'Ethan, trois bâtiments.
  // `economie.residus` étant un tableau PARALLÈLE, l'état devenait incohérent et
  // `verifierEtat` refusait la sauvegarde — « 19 résidus pour 16 bâtiments », un
  // message qui parle d'économie pour une faute de migration.
  //
  // ⚠ LE MONTAGE DÉPLACE LA BASE, et c'est tout ce qui manquait pour voir la
  // faute : les montages de migration d'alors posaient tous sur une base neuve,
  // où `fondation` et `position` coïncident.
  const etat = creerEtat(7);
  const base = baseCourante(etat);
  let poses = 0;
  for (const k of base.champs.cases) {
    if (poses >= 3) break;
    const id = k.ressource === 'quartz' ? 'collecteurQuartz' : 'collecteurScorie';
    try { poser(etat, id, k.rangee, k.colonne); poses += 1; } catch { /* case prise */ }
  }
  assert.ok(poses >= 2, 'le montage ne pose pas assez de collecteurs');

  poserLaBaseSur(etat, base.position.rangee - 10, base.position.colonne);
  assert.notDeepEqual(base.position, base.fondation,
    'la base n\'a pas bougé : le montage ne mesure rien');

  // La sauvegarde telle qu'une v28 l'écrivait : un seul identifiant.
  const v28 = JSON.parse(serialiser(etat, 1_700_000_000_000));
  v28.version = 28;
  for (const b of v28.bases) {
    b.disposition = b.disposition.map(
      (x) => (x.id.startsWith('collecteur') ? { ...x, id: 'collecteur' } : x),
    );
  }
  const avant = v28.bases[0].disposition.length;

  const migre = migrer(structuredClone(v28));
  // ⚠⚠ AUCUN BÂTIMENT PERDU — c'est la moitié qui a coûté une partie.
  assert.equal(migre.bases[0].disposition.length, avant, 'la migration a perdu un bâtiment');
  assert.equal(
    migre.bases[0].economie.residus.length, migre.bases[0].disposition.length,
    'les résidus et la disposition ont divergé : c\'est le défaut du 08/09',
  );

  // ⚠⚠ ET CHAQUE COLLECTEUR PORTE LA RESSOURCE DE SON VRAI CHAMP, celui de la
  // FONDATION. Sans cette moitié, une migration qui garderait tout en mettant
  // `collecteurQuartz` partout passerait la ligne du dessus.
  for (const b of migre.bases[0].disposition) {
    if (!b.id.startsWith('collecteur')) continue;
    const ressource = ressourceDeLaCase(base.champs, b.rangee, b.colonne);
    assert.equal(b.id, ressource === 'quartz' ? 'collecteurQuartz' : 'collecteurScorie',
      `${b.id}@${b.rangee},${b.colonne} ne suit pas son champ (${ressource})`);
  }

  // Et la sauvegarde se charge, ce qui est la seule chose que le joueur voit.
  assert.doesNotThrow(() => charger(JSON.stringify(v28), 1_700_000_000_000));
});

// ---------------------------------------------------------------------------
// B4 T9 — aucune migration ne peut plus perdre un bâtiment en silence
// ---------------------------------------------------------------------------

test('B4 T9 — la garde refuse qu\'une migration jette un bâtiment', () => {
  // ⚠⚠ LA GARDE EST STRUCTURELLE, ET ELLE VAUT POUR LES MIGRATIONS À VENIR.
  // Celle du 08/09 s'est vue trois couches plus loin, dans `verifierEtat`, sous
  // un message qui parlait d'économie. La prochaine se verra à sa source, avec
  // le numéro du maillon fautif dans la phrase.
  //
  // ⚠ ON MESURE LA GARDE, PAS UNE MIGRATION TRUQUÉE. `MIGRATIONS` n'est pas
  // exportée — et ne doit pas l'être : c'est une table interne, et un test qui
  // la remplacerait laisserait une migration fausse derrière lui si une
  // assertion tombait au mauvais moment.
  assert.throws(() => exigerAucunePerte([16], [13], 28),
    /la migration 28 → 29 a perdu 3 bâtiment\(s\) de la base 0/);
  // C'est le compte exact du défaut d'Ethan : 16 bâtiments, 13 après.

  // Ce qu'elle laisse passer, et c'est délibéré : autant, ou PLUS.
  assert.doesNotThrow(() => exigerAucunePerte([16], [16], 28));
  assert.doesNotThrow(() => exigerAucunePerte([16], [17], 28));
  // Une base sans liste ne se compare pas — une v9 n'avait pas de `bases`.
  assert.doesNotThrow(() => exigerAucunePerte([null], [3], 28));
  assert.doesNotThrow(() => exigerAucunePerte([3], [null], 28));
  // Plusieurs bases : la fautive est NOMMÉE, pas seulement comptée.
  assert.throws(() => exigerAucunePerte([5, 9], [5, 8], 28), /de la base 1/);
});
