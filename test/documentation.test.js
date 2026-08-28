// Les compteurs de CLAUDE.md sont assertés contre le disque.
//
// POURQUOI CE FICHIER EXISTE. `CLAUDE.md` §0 annonce un nombre de tests « à
// confronter » et §2 une arborescence. Les deux dérivent, et le dépôt en a déjà
// payé le prix : §2 « a menti deux fois », de l'aveu du fichier lui-même, et
// §0 a été réécrit à la main quatre fois dans la seule journée du 26/08 — dont
// une fois avec un nombre écrit AVANT d'avoir lancé la suite, donc faux.
//
// Le remède n'est pas de promettre d'être plus attentif. C'est de faire tomber
// la suite. Un lot qui ajoute un test ou un fichier sans mettre `CLAUDE.md` à
// jour passe désormais au rouge, et c'est voulu : le premier geste de chaque
// session est de lire ce fichier, il n'a donc pas le droit de mentir.
//
// ⚠ COMMENT LE COMPTE DE TESTS EST OBTENU. En comptant les déclarations
// `test(` en TÊTE DE LIGNE dans `test/*.test.js`. Ça ne vaut que tant que la
// suite n'utilise ni sous-tests imbriqués, ni groupements, ni tests ignorés ni
// `test.skip` / `test.only` — un test asserte donc qu'aucun des quatre
// n'apparaît. Le jour où l'un d'eux devient nécessaire, c'est CETTE méthode
// qu'il faudra changer, pas le nombre.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const CLAUDE_MD = readFileSync(join(RACINE, 'CLAUDE.md'), 'utf8');

/** Les fichiers `.js` d'un dossier du dépôt, hors sous-dossiers. */
function fichiersJs(...chemin) {
  return readdirSync(join(RACINE, ...chemin), { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.js'))
    .map((e) => e.name);
}

test('documentation — CLAUDE.md §0 annonce le vrai nombre de tests', () => {
  const fichiers = fichiersJs('test').filter((n) => n.endsWith('.test.js'));

  // Le comptage n'est valable que sous ces conditions. Les asserter d'abord,
  // sinon le nombre obtenu plus bas ne voudrait rien dire — c'est le montage
  // falsifiable avant la mesure.
  //
  // ⚠ LES MOTIFS SONT BORNÉS EN UNICODE, et il a fallu une première version
  // ratée pour le réapprendre. Chercher la sous-chaîne « t·test( » attrape
  // `interdit·test(source)` — un appel de `RegExp·test`, parfaitement innocent,
  // qui se termine par le « t » d'« interdit ». C'est la faute que CLAUDE.md §6
  // documente déjà pour la garde du lot 1, commise à nouveau sous une autre
  // forme. Un motif de mot se borne, toujours.
  //
  // ⚠ ET CE FICHIER-CI EST EXCLU DU BALAYAGE. Il traque des motifs textuels, et
  // toute prose qui les explique en devient une occurrence : il s'est dénoncé
  // lui-même trois fois de suite — d'abord par sa liste de motifs, puis par son
  // appât, puis par un commentaire. La prose a fini par être réécrite sans eux
  // (les points médians plus haut remplacent des points, exprès), si bien que
  // l'exclusion n'est PLUS nécessaire aujourd'hui. Elle reste, parce que la
  // prochaine phrase d'explication la rendra nécessaire à nouveau, et qu'une
  // alarme disant « la méthode de comptage ne tient plus » alors qu'il s'agit
  // d'un commentaire ferait perdre bien plus de temps qu'elle n'en fait gagner.
  // L'angle mort est d'un fichier, et c'est celui dont l'auteur connaît le
  // mieux la règle.
  const incompatibles = [
    /(?<![\p{L}\p{N}_])t\.test\(/u, // sous-test imbriqué
    /(?<![\p{L}\p{N}_])describe\(/u, // groupement
    /(?<![\p{L}\p{N}_])test\.skip\(/u,
    /(?<![\p{L}\p{N}_])test\.only\(/u,
  ];
  const balayes = fichiers.filter((n) => n !== 'documentation.test.js');
  assert.equal(balayes.length, fichiers.length - 1, 'l\'exclusion doit porter sur UN fichier');

  for (const nom of balayes) {
    const contenu = readFileSync(join(RACINE, 'test', nom), 'utf8');
    for (const motif of incompatibles) {
      const m = contenu.match(motif);
      assert.ok(
        m === null,
        `${nom} emploie « ${m?.[0]} » : la méthode de comptage ne tient plus, `
          + 'c\'est ELLE qu\'il faut corriger, pas le nombre de CLAUDE.md',
      );
    }
  }

  // Les motifs doivent effectivement attraper une vraie violation, sinon la
  // boucle ci-dessus passerait sur n'importe quoi. L'appât est assemblé à
  // l'exécution : écrit d'une pièce il serait, lui aussi, une occurrence.
  const appat = `await t${'.'}test("sous-test", () => {});`;
  assert.ok(incompatibles.some((m) => m.test(appat)), 'les motifs n\'attrapent même pas un appât');
  // Et laisser passer l'innocent qui avait fait tomber la première version.
  const innocent = `assert.ok(!interdit${'.'}test(source), "…");`;
  assert.deepEqual(
    incompatibles.filter((m) => m.test(innocent)), [],
    'la garde se déclenche sur un appel de RegExp.test',
  );

  let declares = 0;
  for (const nom of fichiers) {
    const contenu = readFileSync(join(RACINE, 'test', nom), 'utf8');
    declares += (contenu.match(/^test\(/gm) ?? []).length;
  }
  // Le parse doit avoir trouvé quelque chose de plausible : à zéro ou à trois,
  // c'est la lecture qui est cassée, pas la documentation.
  assert.ok(declares > 100, `${declares} tests comptés : la lecture est cassée`);

  const annonce = CLAUDE_MD.match(/\*\*(\d+) pass \/ 0 fail\*\*/);
  assert.ok(annonce, 'CLAUDE.md §0 ne porte plus de ligne « N pass / 0 fail »');
  assert.equal(
    Number(annonce[1]), declares,
    `CLAUDE.md §0 annonce ${annonce[1]} tests, le dépôt en déclare ${declares}. `
      + 'Mettre le fichier à jour, ne pas toucher à ce test.',
  );
});

test('documentation — CLAUDE.md §2 annonce la vraie arborescence', () => {
  // Chaque ligne de l'arborescence porte « — N fichiers ». On les confronte au
  // disque, dossier par dossier.
  const attendus = [
    { motif: /^src\/data\/.*— (\d+) fichiers/m, chemin: ['src', 'data'], filtre: () => true },
    { motif: /^src\/sim\/.*— (\d+) fichiers/m, chemin: ['src', 'sim'], filtre: () => true },
    { motif: /^src\/render\/.*— (\d+) fichiers/m, chemin: ['src', 'render'], filtre: () => true },
    { motif: /^src\/ui\/.*— (\d+) fichiers/m, chemin: ['src', 'ui'], filtre: () => true },
    {
      motif: /^test\/ +(\d+) fichiers \*\.test\.js/m,
      chemin: ['test'],
      filtre: (n) => n.endsWith('.test.js'),
    },
  ];

  for (const { motif, chemin, filtre } of attendus) {
    const trouve = CLAUDE_MD.match(motif);
    assert.ok(trouve, `CLAUDE.md §2 : plus de compte lisible pour ${chemin.join('/')}/`);
    const reel = fichiersJs(...chemin).filter(filtre).length;
    assert.equal(
      Number(trouve[1]), reel,
      `CLAUDE.md §2 annonce ${trouve[1]} fichiers dans ${chemin.join('/')}/, il y en a ${reel}`,
    );
    // Falsifiable : un dossier vide rendrait toutes ces égalités triviales.
    assert.ok(reel > 0, `${chemin.join('/')}/ est vide : le montage ne mesure rien`);
  }
});

test('documentation — CLAUDE.md §2 nomme exactement les fichiers de test présents', () => {
  // Le compte seul ne suffit pas : deux fichiers pourraient s'échanger sans que
  // le total bouge.
  //
  // ⚠ ÉGALITÉ D'ENSEMBLE, PAS RECHERCHE DE MOT. La première version cherchait
  // chaque nom « quelque part dans le bloc » — et retirer `champs` de la liste
  // PASSAIT, parce que le mot « champs » apparaît aussi dans une annotation en
  // prose deux lignes plus bas. Un test qui accepte de trouver sa réponse dans
  // le commentaire d'à côté ne mesure rien. On lit donc UNIQUEMENT les lignes
  // de liste — deux espaces puis des noms séparés par des espaces — et on exige
  // l'égalité stricte des deux ensembles, dans les deux sens.
  const lignes = CLAUDE_MD.split('\n');
  const debut = lignes.findIndex((l) => /^test\/ +\d+ fichiers \*\.test\.js/.test(l));
  assert.ok(debut >= 0, 'CLAUDE.md §2 : ligne d\'en-tête de test/ introuvable');

  const declares = [];
  for (let i = debut + 1; i < lignes.length; i++) {
    // Les lignes de liste : deux espaces exactement, puis un nom en minuscules.
    // Les annotations commencent par « ⤷ » et arrêtent la lecture.
    if (!/^ {2}[a-z]/.test(lignes[i])) break;
    declares.push(...lignes[i].trim().split(/\s+/));
  }

  const reels = fichiersJs('test')
    .filter((n) => n.endsWith('.test.js'))
    .map((n) => n.replace('.test.js', ''));

  // Falsifiable : les deux listes doivent être non triviales avant d'être
  // comparées, sinon [] === [] passerait.
  assert.ok(declares.length > 10, `${declares.length} noms lus dans CLAUDE.md`);
  assert.ok(reels.length > 10, `${reels.length} fichiers de test trouvés`);

  assert.deepEqual(
    [...declares].sort(), [...reels].sort(),
    'CLAUDE.md §2 et le dossier test/ ne nomment pas les mêmes fichiers',
  );
});

test('documentation — CLAUDE.md §2 nomme exactement les fichiers de src/', () => {
  // ⚠ CE TEST EXISTE PARCE QUE LE COMPTE SEUL A LAISSÉ PASSER UN ÉCRASEMENT.
  // Le 27/08, une archive de livraison a été déposée dans le mauvais dossier :
  //   — `src/data/base.js` s'est retrouvé AUSSI dans `src/sim/`, où il n'a rien
  //     à faire ;
  //   — `src/data/combat.js` a REMPLACÉ `src/sim/combat.js`, le moteur de
  //     combat, 1 450 lignes.
  //
  // Deux fichiers sans le moindre rapport portent le même nom court dans deux
  // dossiers : `combat.js` est à la fois une table de `src/data/` et le moteur
  // de `src/sim/`. Le sélecteur de fichiers d'un téléphone n'affiche que le nom
  // court, et rien dans le dépôt ne disait que c'était dangereux.
  //
  // Le compte de §2 n'a rien vu de l'écrasement : `src/sim/` avait toujours ses
  // onze fichiers, un module de moins et un intrus de plus. Seul le BUILD est
  // tombé, six erreurs esbuild plus loin, et il ne tourne pas sur le téléphone.
  // Le compte ne suffit donc pas — il faut les NOMS, comme pour `test/`.
  //
  // ⚠ CONSÉQUENCE SUR LA PROSE DE §2. Les lignes de description d'un bloc de
  // `src/` ne doivent nommer AUCUN fichier en `.js` : elles seraient lues comme
  // des déclarations. C'est une contrainte, et elle est voulue — un nom de
  // fichier dans une description est de toute façon un renvoi qui pourrit.
  const dossiers = ['data', 'sim', 'render', 'ui'];

  for (const dossier of dossiers) {
    const enTete = new RegExp(`^src/${dossier}/ .*— (\\d+) fichiers`, 'm');
    const lignes = CLAUDE_MD.split('\n');
    const debut = lignes.findIndex((l) => enTete.test(l));
    assert.ok(debut >= 0, `CLAUDE.md §2 : ligne d'en-tête de src/${dossier}/ introuvable`);

    // Les lignes de liste : deux espaces exactement, puis un nom en minuscules.
    // Un bloc s'arrête à la première ligne qui n'en est pas une.
    const declares = [];
    for (let i = debut + 1; i < lignes.length; i++) {
      if (!/^ {2}[a-z]/.test(lignes[i])) break;
      for (const mot of lignes[i].trim().split(/\s+/)) {
        if (/^[a-z0-9-]+\.js$/.test(mot)) declares.push(mot);
      }
    }

    const reels = fichiersJs('src', dossier);

    // Falsifiable des deux côtés : deux listes vides seraient égales.
    assert.ok(declares.length >= 3, `${declares.length} noms lus pour src/${dossier}/`);
    assert.ok(reels.length >= 3, `${reels.length} fichiers trouvés dans src/${dossier}/`);
    // Et aucun doublon déclaré, sinon un nom pourrait en masquer un absent.
    assert.equal(
      new Set(declares).size, declares.length,
      `CLAUDE.md §2 nomme deux fois le même fichier dans src/${dossier}/`,
    );

    assert.deepEqual(
      [...declares].sort(), [...reels].sort(),
      `CLAUDE.md §2 et src/${dossier}/ ne nomment pas les mêmes fichiers — `
        + 'un module déposé dans le mauvais dossier en écrase un autre en silence',
    );
  }
});

test('documentation — aucun fichier de test ne traîne hors de test/', () => {
  // ⚠ CE TEST EXISTE PARCE QUE C'EST ARRIVÉ DEUX FOIS EN DEUX LIVRAISONS.
  // Le dépôt se met à jour depuis un téléphone, fichier par fichier, et le
  // sélecteur n'affiche que les noms courts : `disposition.js` et
  // `disposition.test.js` s'y ressemblent beaucoup. Résultat, le 26/08 :
  //   — d'abord `src/sim/disposition.js` déposé DANS `test/`, sous le nom
  //     `disposition.js` — donc invisible au glob `test/*.test.js`, donc quinze
  //     tests disparus sans un mot ;
  //   — puis `disposition.test.js` déposé DANS `src/sim/`, où il n'a rien à
  //     faire, pendant que le module y restait périmé.
  //
  // Les deux fois, le symptôme était lointain et illisible. Ce test rend la
  // faute IMMÉDIATE et NOMMÉE : il dit quel fichier est au mauvais endroit.
  //
  // Il vaut aussi comme règle de fond : `src/` ne contient que du code livré.
  // Un fichier de test qui s'y trouve partirait dans le bundle si un jour
  // `index.src.html` l'importait par erreur.
  const intrus = [];
  for (const dossier of [['src', 'data'], ['src', 'sim'], ['src', 'render'], ['src', 'ui'], ['tools']]) {
    for (const nom of fichiersJs(...dossier)) {
      if (nom.endsWith('.test.js')) intrus.push(`${dossier.join('/')}/${nom}`);
    }
  }
  assert.deepEqual(
    intrus, [],
    `fichier(s) de test hors de test/ : ${intrus.join(', ')} — à supprimer, `
      + 'le bon exemplaire est dans test/',
  );

  // Falsifiable dans l'autre sens : le dossier test/ doit, lui, être PLEIN de
  // fichiers en .test.js. Sinon la boucle ci-dessus pourrait ne rien parcourir
  // et l'égalité passerait sur un dépôt vide.
  const vraisTests = fichiersJs('test').filter((n) => n.endsWith('.test.js'));
  assert.ok(vraisTests.length > 10, `${vraisTests.length} fichiers de test dans test/`);

  // Et le symétrique : aucun module de PRODUCTION ne doit traîner dans test/.
  // C'est l'autre moitié de l'accident, celle du 26/08 au matin. Un fichier de
  // test/ qui n'est ni un `.test.js` ni un préréglage connu est suspect.
  const connus = new Set(['prereglages-lot3a.js']);
  const egares = fichiersJs('test')
    .filter((n) => !n.endsWith('.test.js') && !connus.has(n));
  assert.deepEqual(
    egares, [],
    `fichier(s) inattendu(s) dans test/ : ${egares.join(', ')} — un module de `
      + 'src/ déposé au mauvais endroit ne serait exécuté par personne',
  );
});

// ---------------------------------------------------------------------------
// La palette annoncée par CLAUDE.md, confrontée à FICHE-STYLE.md
// ---------------------------------------------------------------------------

/**
 * Décode un nombre français écrit en lettres, de « un » à « quatre-vingt-dix-neuf ».
 *
 * Le décodeur somme les morceaux séparés par des traits d'union — « trente-trois »
 * vaut 30 + 3 — ce qui suffit largement au seul usage qu'on en fait ici. Il rend
 * `null` sur un mot inconnu plutôt que zéro : un mot non décodé doit faire
 * TOMBER la garde, pas la faire passer silencieusement à côté.
 */
function nombreEnLettres(mot) {
  const VALEURS = new Map([
    ['un', 1], ['deux', 2], ['trois', 3], ['quatre', 4], ['cinq', 5], ['six', 6],
    ['sept', 7], ['huit', 8], ['neuf', 9], ['dix', 10], ['onze', 11], ['douze', 12],
    ['treize', 13], ['quatorze', 14], ['quinze', 15], ['seize', 16],
    ['vingt', 20], ['vingts', 20], ['trente', 30], ['quarante', 40],
    ['cinquante', 50], ['soixante', 60],
  ]);
  let total = 0;
  for (const morceau of mot.toLowerCase().split('-')) {
    if (morceau === 'et') continue;
    const valeur = VALEURS.get(morceau);
    if (valeur === undefined) return null;
    total += valeur;
  }
  return total;
}

test('documentation — CLAUDE.md compte les teintes de FICHE-STYLE.md, total ET détail', () => {
  // ⚠ POURQUOI CE TEST EXISTE. `CLAUDE.md` §6 a annoncé « vingt-huit teintes »
  // pendant une journée entière alors que la fiche en portait trente-trois, et
  // son énumération avait perdu une rampe complète — les cinq tons du sol de
  // l'Ouvrage. C'est EXACTEMENT la faute que la liste de `banc.test.js` avait
  // commise la veille, et qu'un test avait alors réparée : une transcription
  // qui ne se confronte pas à sa source est une copie qui vieillit. La liste de
  // code est gardée depuis le 27/08 ; la PROSE ne l'était pas, et elle a dérivé
  // le lendemain. On garde donc les deux, contre la même source.
  //
  // ⚠ ET ON GARDE LE DÉTAIL AUTANT QUE LE TOTAL. Une garde qui ne lirait que le
  // total laisserait écrire « trente-trois » au-dessus d'une énumération qui
  // fait vingt-huit — c'est-à-dire exactement l'état dans lequel ce paragraphe
  // a été trouvé, un total juste ne l'aurait pas sauvé.
  const fiche = readFileSync(join(RACINE, 'FICHE-STYLE.md'), 'utf8');
  const teintes = new Set(
    [...fiche.matchAll(/#[0-9A-Fa-f]{6}(?![0-9A-Za-z])/g)].map((m) => m[0].toUpperCase()),
  );

  // Montage falsifiable : le décodeur doit décoder, et la fiche doit porter des
  // teintes. Sans ces deux-là, l'égalité finale pourrait tenir sur du vide.
  assert.equal(nombreEnLettres('vingt-huit'), 28, 'le décodeur ne décode pas');
  assert.equal(nombreEnLettres('trente-trois'), 33, 'le décodeur ne décode pas');
  assert.equal(nombreEnLettres('brouette'), null, 'le décodeur avale un mot inconnu');
  assert.ok(teintes.size >= 20, `${teintes.size} teintes lues dans FICHE-STYLE.md`);

  // Le total annoncé. L'ancre est la phrase de la garde, pas la prose qui
  // l'explique : le paragraphe raconte sa propre dérive et contient donc les
  // deux nombres, l'ancien et le bon.
  const totalEcrit = CLAUDE_MD.match(/LA PALETTE EST FERMÉE : ([a-zà-ÿ-]+) teintes/);
  assert.ok(totalEcrit, 'CLAUDE.md §6 n\'annonce plus de nombre de teintes');
  assert.equal(
    nombreEnLettres(totalEcrit[1]), teintes.size,
    `CLAUDE.md annonce « ${totalEcrit[1]} » teintes, FICHE-STYLE.md en porte ${teintes.size}`,
  );

  // Le détail. Chaque terme de l'énumération commence par son compte en
  // lettres ; leur somme doit valoir le même nombre.
  const detail = CLAUDE_MD.match(/Les [a-zà-ÿ-]+ : ([^.]*)\./);
  assert.ok(detail, 'CLAUDE.md §6 n\'énumère plus les familles de teintes');
  const familles = detail[1].split(',').map((t) => t.trim());
  assert.ok(familles.length >= 5, `${familles.length} familles énumérées, c'est trop peu`);

  let somme = 0;
  for (const famille of familles) {
    const compte = nombreEnLettres(famille.split(/[\s\u00A0]/)[0]);
    assert.ok(
      compte !== null,
      `« ${famille} » ne commence pas par un compte en lettres décodable`,
    );
    somme += compte;
  }
  assert.equal(
    somme, teintes.size,
    `l'énumération de CLAUDE.md §6 fait ${somme}, FICHE-STYLE.md porte ${teintes.size} teintes`,
  );
});
