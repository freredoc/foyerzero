// L'écran de raid vu du DOIGT — lot ASSAUT, 04/09.
//
// Trois retours d'Ethan qui tiennent ensemble : on ENTRE par le double-toucher,
// on ATTAQUE par un bouton et un seul, et pendant le déroulé il ne reste que le
// combat à l'écran. Aucune règle de jeu ne bouge ; ce fichier garde les GESTES.
//
// ⚠⚠ CE QUE CES ONZE TESTS NE PROUVENT PAS. Le dépôt n'a ni jsdom ni navigateur
// (CLAUDE.md §3) : rien ici ne dit qu'un bouton est GROS, ni qu'un chrome masqué
// a disparu à l'écran. Ce sont des gardes de MÉCANISME. La preuve du rendu est
// dans `RAPPORT-lotASSAUT.md`, mesurée dans Chromium — et le rapport porte les
// nombres, y compris ceux de la garde du doigt qui reste, dont l'hypothèse a été
// REPRODUITE avant qu'on ne la garde.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { libelleDAttaque, vueDuRaid } from '../src/ui/raid.js';
import { gesteDuSecondToucher } from '../src/ui/monde.js';
import {
  chromeMasque, CHROME_MASQUE_PAR, CHROME_MASQUE_PAR_LE_DEROULE, BLOCS_DE_CHROME,
} from '../src/ui/session.js';
import { ECRAN_RAID, TYPES_SITE, EMBLEMES_CARTE } from '../src/data/sites.js';
import { creerEtat, rattraperJeu } from '../src/sim/state.js';
import { baseCourante } from '../src/sim/base-courante.js';
import { coutDUnRaid } from '../src/sim/points-attaque.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

/** La source d'un fichier, commentaires ôtés — une garde ne lit pas sa prose. */
function decommentee(chemin) {
  return readFileSync(join(RACINE, chemin), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
}

/** Le balisage, commentaires HTML ôtés. */
function balisage() {
  return readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '');
}

/** Une partie dont les satellites sont parus, avec une armée posée. */
function partieArmee(graine = 2026) {
  const etat = creerEtat(graine);
  rattraperJeu(etat, 3001);
  for (let c = 1; c <= 6; c += 1) {
    baseCourante(etat).armee.push({ id: 'meute', vague: 1, colonne: c, niveau: 1, degatsMilli: 0 });
  }
  etat.attaque.points = 5000;
  return etat;
}

/** Le premier camp autour de la base. */
function premierCamp(etat) {
  const s = baseCourante(etat).satellites.presents.find((x) => x.type === 'camp');
  assert.ok(s !== undefined, 'montage : aucun camp autour de la base');
  return { rangee: s.rangee, colonne: s.colonne };
}

// ---------------------------------------------------------------------------
// 1. Le bouton d'attaque sort du rang, et il est le seul déclencheur
// ---------------------------------------------------------------------------

test('ASSAUT T1 — `lancer(false)` n\'est atteint que par deux boutons nommés', () => {
  const src = decommentee('src/ui/raid.js');

  // ⚠⚠ CE QUI EST GARDÉ N'EST PAS « le bouton marche », C'EST « AUCUN AUTRE
  // CHEMIN NE DÉPENSE ». `lancer(true)` simule et ne coûte rien ; `lancer(false)`
  // paie des points d'attaque et engage une armée abîmée. Ethan, 04/09 : « il
  // n'y a que ça qui déclenche l'attaque ».
  const lignes = src.split('\n');
  const chemins = lignes
    .map((l, i) => ({ l, i }))
    .filter(({ l }) => /lancer\(false\)/.test(l));
  assert.ok(chemins.length > 0, 'le montage ne mesure rien : plus aucun appel à lancer(false)');

  // ⚠ « RÉ-ATTAQUER » RESTE, ET C'EST UNE DÉCISION. C'est un second raid décidé
  // devant un RÉSULTAT, pas un geste accidentel : le panneau de fin couvre tout
  // l'écran, et son bouton n'est vif que si `problemesDuRaid` est vide.
  const permis = ['raid-attaquer', 'raid-reattaquer'];
  for (const { l } of chemins) {
    const parQui = permis.filter((id) => l.includes(`'${id}'`));
    assert.equal(parQui.length, 1,
      `un chemin vers lancer(false) qui ne part ni de raid-attaquer ni de raid-reattaquer : ${l.trim()}`);
  }
  assert.deepEqual(
    chemins.map(({ l }) => permis.find((id) => l.includes(`'${id}'`))).sort(),
    [...permis].sort(),
    'les deux déclencheurs attendus ne sont pas exactement ceux qu\'on trouve',
  );

  // Falsifiable : un troisième chemin est bien vu comme tel.
  const appat = "  brancher('raid-vitesse-1', () => lancer(false));";
  assert.equal(permis.filter((id) => appat.includes(`'${id}'`)).length, 0,
    'le motif ne verrait pas un troisième chemin');

  // ⚠ ET LE BOUTON A QUITTÉ LA RANGÉE DES CINQ AUTRES. Le balisage le dit : il
  // n'est plus DANS `#raid-boutons`, il est son frère à droite.
  const html = balisage();
  const rangee = html.match(/<div id="raid-boutons">([\s\S]*?)<\/div>/);
  assert.ok(rangee, '#raid-boutons a disparu du balisage');
  assert.ok(!rangee[1].includes('raid-attaquer'),
    'le bouton d\'attaque est retombé dans la rangée des cinq');
  assert.match(html, /<div id="raid-rangee">/, 'la rangée du bas n\'a plus de conteneur');
  // Cinq boutons dans la rangée, pas six.
  assert.equal((rangee[1].match(/<button/g) ?? []).length, 5,
    'la rangée du bas ne porte plus exactement cinq boutons');

  // La feuille lui donne une cible de doigt, et la garde nomme le nombre.
  const feuille = readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const regle = feuille.match(/#raid-attaquer \{([^}]*)\}/);
  assert.ok(regle, 'la règle de #raid-attaquer a disparu');
  const haut = regle[1].match(/min-height:\s*(\d+)px/);
  assert.ok(haut && Number(haut[1]) >= 48,
    `le bouton d'attaque fait ${haut ? haut[1] : '?'} px de haut : « vraiment en gros » demande au moins 48`);
});

test('ASSAUT T2 — le bouton porte le coût, et il ne le recalcule pas', () => {
  const src = decommentee('src/ui/raid.js');

  // ⚠⚠ UN SEUL SITE D'APPEL DE `coutDUnRaid` DANS TOUT L'ÉCRAN, et il est dans
  // `vueDuRaid`. Le rappeler pour le libellé donnerait deux nombres qui peuvent
  // diverger — le joueur verrait un prix sur le bouton et un autre sur la carte.
  // C'est le motif de `ciblageOuvert` dans `ui/monde.js`, où la flèche RELIT le
  // ciblage au lieu de le refaire.
  const appels = [...src.matchAll(/coutDUnRaid\(/g)];
  assert.equal(appels.length, 1,
    `${appels.length} appels à coutDUnRaid dans src/ui/raid.js : un seul, dans vueDuRaid`);
  const corpsVue = src.match(/export function vueDuRaid\([\s\S]*?\n\}/);
  assert.ok(corpsVue, 'vueDuRaid a disparu');
  assert.match(corpsVue[0], /coutDUnRaid\(/, 'l\'unique appel n\'est pas dans vueDuRaid');

  // Et le libellé LIT ce que `vueDuRaid` rend.
  assert.match(src, /armerLAttaque\(vueDuRaid\([^)]*\)\.cout\)/,
    'le bouton ne prend plus son prix dans vueDuRaid');

  // ⚠ LE PRIX EST CELUI DU MOTEUR, ET LE TEST LE CONFRONTE — pas une recopie.
  const etat = partieArmee();
  const cible = premierCamp(etat);
  const vue = vueDuRaid(etat, cible);
  assert.equal(vue.cout, coutDUnRaid(etat, baseCourante(etat), cible));
  assert.ok(vue.cout > 0, 'le montage ne mesure rien : ce raid est gratuit');
  assert.deepEqual(libelleDAttaque(vue.cout), { mot: 'ATTAQUER', prix: `${vue.cout} points` });

  // ⚠⚠ HORS DE PORTÉE, LE COÛT VAUT `null` ET LE BOUTON SE TAIT — jamais zéro,
  // qui se lirait « gratuit ». Et l'ordre compte : `coutDUnRaid` LÈVE au-delà du
  // rayon, donc les problèmes se demandent d'abord. C'est le défaut que
  // `ciblageDuSite` a payé au lot DÉPLACEMENT.
  const loin = { rangee: baseCourante(etat).position.rangee - 40, colonne: 16 };
  assert.doesNotThrow(() => vueDuRaid(etat, loin), 'vueDuRaid lève sur une cible lointaine');
  assert.equal(vueDuRaid(etat, loin).cout, null);
  assert.deepEqual(libelleDAttaque(null), { mot: 'ATTAQUER', prix: '' });
  assert.deepEqual(libelleDAttaque(1), { mot: 'ATTAQUER', prix: '1 point' });

  // Le balisage porte les deux lignes que le libellé remplit.
  const html = balisage();
  const bouton = html.match(/<button[^>]*id="raid-attaquer"[^>]*>([\s\S]*?)<\/button>/);
  assert.ok(bouton, '#raid-attaquer a disparu du balisage');
  assert.match(bouton[1], /<b>/, 'le bouton n\'a plus de ligne de mot');
  assert.match(bouton[1], /<small/, 'le bouton n\'a plus de ligne de prix');
});

// ---------------------------------------------------------------------------
// 2. Le second toucher se lit sur le TYPE
// ---------------------------------------------------------------------------

test('ASSAUT T3 — second toucher sur SA base : on entre dans la base', () => {
  assert.equal(gesteDuSecondToucher({ type: 'baseJoueur' }), 'base');

  const src = decommentee('src/ui/monde.js');
  const bloc = src.match(/if \(gesteDuSecondToucher\(site\) === 'base'\) \{([\s\S]*?)\n {10}\}/);
  assert.ok(bloc, 'le second toucher ne se lit plus sur le type');
  assert.match(bloc[1], /surEntreeBase\(\)/, 'le crochet d\'entrée dans la base ne part pas');
  // ⚠ ET `entrerDansLaCible` N'EST PAS SUR CE CHEMIN-LÀ. Sur sa propre base,
  // `ciblageDuSite` rend `null` — on n'attaque pas chez soi — et le panneau
  // affichait « Plus rien à attaquer ici ». Le geste ne menait nulle part.
  assert.ok(!bloc[1].includes('entrerDansLaCible'),
    'sa propre base passe encore par entrerDansLaCible');
  // ⚠ ET LE PANNEAU SE FERME EN PARTANT, comme le fait `entrerDansLaCible`.
  assert.match(bloc[1], /fermerPanneau\(\)/, 'le panneau reste ouvert sur un site qu\'on quitte');

  // Le crochet existe, à côté de celui du raid, et la session le câble.
  assert.match(src, /crochets\.surEntreeBase/, 'le crochet n\'est pas déclaré');
  const session = decommentee('src/ui/session.js');
  assert.match(session, /surEntreeBase: \(\) => \{ montrerEcran\('chantier'\); \}/,
    'la session ne câble pas l\'entrée dans la base');
});

test('ASSAUT T4 — second toucher ailleurs : on entre dans la CIBLE, inchangé', () => {
  // ⚠⚠ CE TEST EXISTE PARCE QUE T3 SEUL PASSERAIT SI ON AVAIT TOUT DÉROUTÉ.
  // Une fonction qui rendrait toujours « base » le satisferait, et le joueur ne
  // pourrait plus attaquer personne.
  for (const type of Object.keys(TYPES_SITE)) {
    assert.equal(gesteDuSecondToucher({ type }), 'cible', `${type} n'entre plus dans la cible`);
  }
  // Et les sept POI, qui ont un gabarit de carte sans être attaquables.
  const autres = Object.keys(EMBLEMES_CARTE).filter((t) => t !== 'baseJoueur');
  assert.ok(autres.length > 3, 'le montage ne mesure rien : trop peu de types');
  for (const type of autres) assert.equal(gesteDuSecondToucher({ type }), 'cible', type);

  const src = decommentee('src/ui/monde.js');
  // La branche « cible » est celle d'avant le lot, mot pour mot.
  assert.match(src, /\n {10}entrerDansLaCible\(site\);\n {10}return;/,
    'le chemin ordinaire vers la cible a changé de forme');

  // ⚠ ET LE BOUTON « DÉPLACER LA BASE » LIT LA MÊME FONCTION. Un second
  // littéral 'baseJoueur' pour la même question divergerait au premier
  // renommage — une seule table fait foi par grandeur (CLAUDE.md §4).
  assert.match(src, /panneauDeplacer\.hidden = gesteDuSecondToucher\(site\) !== 'base'/,
    'le bouton de déplacement recompare le type de son côté');
});

test('ASSAUT T5 — `etat.baseCourante` ne s\'écrit qu\'au PREMIER toucher', () => {
  const src = decommentee('src/ui/monde.js');

  // ⚠⚠ LA BASCULE A DÉJÀ EU LIEU. `ouvrirPanneau` écrit `etat.baseCourante` au
  // premier toucher — lecture prise au lot BASES-1, « haloter et basculer sont
  // le MÊME geste ». Rebasculer au second poserait une SECONDE écriture de la
  // même grandeur sur le même trajet, et deux écritures de la même grandeur
  // divergent à la première inattention.
  const ecritures = [...src.matchAll(/basculerVersLaBase\(/g)];
  assert.equal(ecritures.length, 1,
    `${ecritures.length} appels à basculerVersLaBase dans l'écran : un seul, dans ouvrirPanneau`);

  const corps = src.match(/function ouvrirPanneau\(site\) \{[\s\S]*?\n {2}\}/);
  assert.ok(corps, 'ouvrirPanneau a disparu');
  assert.match(corps[0], /basculerVersLaBase\(/, 'l\'unique bascule n\'est pas dans ouvrirPanneau');

  // Et l'écran n'écrit jamais le champ à la main.
  assert.ok(!/\.baseCourante\s*=/.test(src),
    'l\'écran Monde écrit etat.baseCourante directement');

  // Le second toucher, lui, ne bascule pas.
  const bloc = src.match(/if \(gesteDuSecondToucher\(site\) === 'base'\) \{([\s\S]*?)\n {10}\}/);
  assert.ok(bloc, 'le second toucher ne se lit plus sur le type');
  assert.ok(!bloc[1].includes('bascule'), 'le second toucher rebascule');

  // Falsifiable : le motif verrait bien une seconde écriture.
  assert.equal([...('a basculerVersLaBase(x); b basculerVersLaBase(y);').matchAll(/basculerVersLaBase\(/g)].length, 2);
});

// ---------------------------------------------------------------------------
// 3. Pendant le déroulé, il ne reste que le combat
// ---------------------------------------------------------------------------

test('ASSAUT T6 — trois états de chrome, et la fin est la préparation', () => {
  const preparation = chromeMasque('raid', false);
  const deroule = chromeMasque('raid', true);
  const fin = chromeMasque('raid', false);

  // ⚠⚠ LA LIGNE DU DÉROULÉ SE DISTINGUE DES DEUX AUTRES, ET LES DEUX AUTRES SONT
  // ÉGALES. Avant le lot, les trois étaient identiques : il n'y avait pas
  // d'état de déroulé. C'est le second point qui garde le retour du chrome — un
  // masquage qui ne se rend pas enferme le joueur dans un écran sans onglets.
  const mot = (s) => [...s].sort().join(',');
  assert.notEqual(mot(deroule), mot(preparation), 'le déroulé ne masque rien de plus');
  assert.equal(mot(fin), mot(preparation), 'la fin ne rend pas exactement ce que la préparation avait');

  // Ce que chacun masque, nommé.
  assert.deepEqual([...preparation].sort(), ['navigation', 'ressources']);
  assert.deepEqual([...deroule].sort(), ['barre-bas', 'navigation', 'ressources', 'tete-onglets']);

  // ⚠ ET LE DÉROULÉ MASQUE PARTOUT, PAS SEULEMENT SUR LE RAID. Un combat ne se
  // joue que là aujourd'hui ; la fonction n'a pas à le supposer.
  assert.ok(chromeMasque('chantier', true).has('tete-onglets'));
  assert.deepEqual([...chromeMasque('chantier', false)], []);

  // Les trois listes sont des blocs qui existent.
  for (const bloc of [...CHROME_MASQUE_PAR.raid, ...CHROME_MASQUE_PAR_LE_DEROULE]) {
    assert.ok(BLOCS_DE_CHROME.includes(bloc), `${bloc} n'est pas un bloc de chrome`);
  }
  const html = balisage();
  for (const bloc of BLOCS_DE_CHROME) {
    assert.ok(html.includes(`id="${bloc}"`), `${bloc} n'existe pas dans la page`);
  }

  // ⚠ ET LA SESSION EST LA SEULE À ÉCRIRE. Un écran qui masquerait
  // `#tete-onglets` lui-même serait le premier à oublier de le rendre.
  const session = decommentee('src/ui/session.js');
  assert.match(session, /function appliquerLeChrome\(\) \{/);
  assert.match(session, /for \(const bloc of BLOCS_DE_CHROME\) \$\(bloc\)\.hidden = masques\.has\(bloc\);/);
  // ⚠ ET LA GARDE PORTE SUR LE MASQUAGE, PAS SUR LE NOM — ELLE A ACCUSÉ UN
  // INNOCENT AU PREMIER JET. `ui/chantier.js` nomme `#ressources` pour le
  // REMPLIR : il construit les trois bandeaux, c'est écrit dans CLAUDE.md §6
  // (« l'écran de la base construit tout ce chrome »). Ce qu'aucun écran n'a le
  // droit de faire, c'est de le CACHER.
  for (const ecran of ['raid', 'monde', 'chantier', 'offense', 'mission', 'recherche']) {
    const src = decommentee(`src/ui/${ecran}.js`);
    for (const bloc of BLOCS_DE_CHROME) {
      const motif = new RegExp(`(?:\\$|getElementById)\\('${bloc}'\\)[^;\\n]*\\.hidden`);
      assert.ok(!motif.test(src), `src/ui/${ecran}.js masque le bloc de chrome ${bloc}`);
      // Falsifiable : le motif verrait bien la faute.
      assert.ok(motif.test(`$('${bloc}').hidden = true;`), 'le motif ne voit pas la faute');
    }
  }
});

test('ASSAUT T7 — le chrome revient par TOUS les chemins de fin', () => {
  const src = decommentee('src/ui/raid.js');

  // ⚠⚠ C'EST LE DÉFAUT LE PLUS PROBABLE DU LOT, et il se monte PAR CHEMIN. Un
  // seul chemin gardé laisserait vert un lot qui enferme le joueur dès qu'il
  // touche « Instantané » — et « Instantané » est le bouton qu'Ethan emploie le
  // plus, puisqu'il teste seul.
  assert.match(src, /function quitterLeDeroule\(\) \{[\s\S]*?pendantLeDeroule\(false\);/,
    'quitterLeDeroule ne rend plus le chrome');

  // Les trois portes de sortie l'appellent.
  const portes = {
    'function finDuDeroule()': /function finDuDeroule\(\) \{[\s\S]*?\n {2}\}/,
    'function fermerPanneaux()': /function fermerPanneaux\(\) \{[\s\S]*?\n {2}\}/,
    'masquer()': /masquer\(\) \{[^}]*\}/,
  };
  for (const [nom, motif] of Object.entries(portes)) {
    const corps = src.match(motif);
    assert.ok(corps, `${nom} a disparu`);
    assert.match(corps[0], /quitterLeDeroule\(\)/, `${nom} ne rend pas le chrome`);
  }

  // ⚠ ET LES TROIS FINS DE COMBAT PASSENT PAR `finDuDeroule` — la fin normale
  // dans la boucle d'image, « Instantané », et le pas-à-pas au dernier tick.
  const fins = [...src.matchAll(/finDuDeroule\(\)/g)];
  assert.ok(fins.length >= 4,
    `${fins.length} appels à finDuDeroule : la boucle, le pas-à-pas, l'instantané, et sa déclaration`);
  for (const bouton of ['raid-pas', 'raid-instantane']) {
    const bloc = src.match(new RegExp(`brancher\\('${bouton}'[\\s\\S]*?\\n {2}\\}\\);`));
    assert.ok(bloc, `${bouton} a disparu`);
    assert.match(bloc[0], /finDuDeroule\(\)/, `${bouton} ne passe pas par finDuDeroule`);
  }
  const boucle = src.match(/function image\(horodatageMs\) \{[\s\S]*?\n {2}\}/);
  assert.ok(boucle, 'la boucle d\'image a disparu');
  assert.match(boucle[0], /finDuDeroule\(\)/, 'la fin normale ne passe pas par finDuDeroule');

  // ⚠ ET `quitterLeDeroule` EST IDEMPOTENTE : elle est appelée au câblage, à
  // chaque ouverture et à chaque fin. Sans le garde-fou, la session recevrait
  // un « le déroulé est fini » avant qu'aucun n'ait commencé.
  const corps = src.match(/function quitterLeDeroule\(\) \{[\s\S]*?\n {2}\}/);
  assert.match(corps[0], /if \(!deroule\) return;/, 'quitterLeDeroule n\'est plus idempotente');

  // ⚠ ET `#raid-bas` EST MASQUÉ PAR L'ÉCRAN QUI LE POSSÈDE, pas par la session.
  assert.match(src, /entrerDansLeDeroule\(\)[\s\S]*?\}/);
  const entrer = src.match(/function entrerDansLeDeroule\(\) \{[\s\S]*?\n {2}\}/);
  assert.match(entrer[0], /bas\.hidden = true/, 'la barre du bas ne part pas au déroulé');
  assert.match(corps[0], /bas\.hidden = false/, 'la barre du bas ne revient pas');
});

test('ASSAUT T8 — le simulateur suit la même règle que le vrai raid', () => {
  const src = decommentee('src/ui/raid.js');

  // ⚠⚠ C'EST LE MÊME DÉROULÉ À L'ÉCRAN, DONC LE MÊME MASQUAGE. Laisser les
  // barres dans un cas et pas dans l'autre apprendrait deux grammaires pour le
  // même dessin. **C'est une LECTURE** : Ethan a parlé du raid.
  const lancer = src.match(/function lancer\(simule\) \{[\s\S]*?\n {2}\}/);
  assert.ok(lancer, 'lancer a disparu');
  assert.match(lancer[0], /entrerDansLeDeroule\(\);/, 'lancer n\'entre plus dans le déroulé');

  // L'appel n'est pas sous une condition de simulation.
  const ligne = lancer[0].split('\n').find((l) => l.includes('entrerDansLeDeroule()'));
  assert.ok(!/simule/.test(ligne), 'l\'entrée dans le déroulé dépend de la simulation');
  const avant = lancer[0].slice(0, lancer[0].indexOf('entrerDansLeDeroule()'));
  assert.ok(!/if \([^)]*simule[^)]*\) \{[^}]*$/.test(avant),
    'l\'entrée dans le déroulé est enfermée dans une branche de simulation');

  // ⚠ ET LES VITESSES RESTENT LE SEUL RESCAPÉ — c'est le contrôle du déroulé
  // lui-même. Elles ne paraissent qu'en simulation : « le vrai raid se regarde
  // en temps réel, sans contrôle de vitesse », arbitrage d'Ethan du 01/09.
  assert.match(lancer[0], /\$\('raid-vitesses'\)\.hidden = !simule;/);
  const corps = src.match(/function quitterLeDeroule\(\) \{[\s\S]*?\n {2}\}/);
  assert.match(corps[0], /vitesses\.hidden = true/, 'les vitesses survivent à la fin du déroulé');
});

// ---------------------------------------------------------------------------
// 4. La garde du doigt qui reste
// ---------------------------------------------------------------------------

test('ASSAUT T9 — le bouton naît inerte, et il le dit', () => {
  // ⚠⚠ CE QUE CE TEST GARDE ET CE QU'IL NE GARDE PAS. Il garde le MÉCANISME :
  // le bouton est inerte au balisage, il est remis inerte à chaque entrée sur
  // l'écran, et l'aspect « hors service » du dépôt le montre. Il ne peut pas
  // garder le COMPORTEMENT — un contact de trop sur un bouton, ça se mesure dans
  // un navigateur (CLAUDE.md §3). Le rapport porte la mesure : trois contacts au
  // même endroit, intervalles RÉELS de 102, 101 et 219 ms, `lancer(false)` ne
  // part pas ; contre-épreuve sur un livrable où le délai vaut zéro, mêmes
  // gestes à 140, 141 et 244 ms, il part à chaque fois.
  const html = balisage();
  const bouton = html.match(/<button[^>]*id="raid-attaquer"[^>]*>/);
  assert.ok(bouton, '#raid-attaquer a disparu du balisage');
  assert.match(bouton[0], /\bdisabled\b/, 'le bouton d\'attaque naît vif dans la page');

  const src = decommentee('src/ui/raid.js');
  const armer = src.match(/function armerLAttaque\(cout\) \{[\s\S]*?\n {2}\}/);
  assert.ok(armer, 'armerLAttaque a disparu');
  // ⚠ L'ORDRE COMPTE : on éteint AVANT d'armer la minuterie. Dans l'autre sens,
  // le bouton resterait vif pendant tout le délai.
  const iEteint = armer[0].indexOf('bouton.disabled = true');
  const iMinuterie = armer[0].indexOf('setTimeout');
  assert.ok(iEteint >= 0 && iMinuterie > iEteint,
    'le bouton n\'est pas éteint avant que la minuterie ne parte');
  // Et il est ré-armé à CHAQUE entrée sur l'écran, pas une fois pour toutes.
  const ouvrir = src.match(/ouvrir\(etat, cible, atlasFournis = null\) \{[\s\S]*?\n {4}\}/);
  assert.ok(ouvrir, 'ouvrir a disparu');
  assert.match(ouvrir[0], /armerLAttaque\(/, 'le bouton n\'est pas ré-armé à l\'entrée');

  // ⚠ INERTE, ET QUI SE VOIT — et la teinte n'est pas une seconde.
  const feuille = readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const inerte = feuille.match(/#raid-attaquer\[disabled\] \{([^}]*)\}/);
  assert.ok(inerte, 'un bouton qui ne répond pas sans le dire est un bouton cassé');
  const horsService = feuille.match(/#raid-fin \.boutons button\[disabled\] \{([^}]*)\}/);
  assert.ok(horsService, 'l\'aspect « hors service » du dépôt a disparu');
  const teinte = horsService[1].match(/color:\s*(#[0-9A-Fa-f]{6})/);
  assert.ok(teinte, 'l\'aspect « hors service » ne porte plus de teinte');
  assert.ok(inerte[1].includes(teinte[1]),
    `le bouton inerte n'emploie pas la teinte du dépôt (${teinte[1]})`);
});

test('ASSAUT T10 — la garde n\'est pas un mur : elle s\'ouvre', () => {
  // ⚠⚠ UNE GARDE QUI BLOQUERAIT TOUJOURS PASSERAIT T9 SANS RIEN VALOIR. Ce
  // test-ci est l'autre moitié : le bouton redevient vif, et il redevient vif
  // TOUT SEUL — au bout d'un délai fini, sans que le joueur ait rien à faire.
  const src = decommentee('src/ui/raid.js');
  const armer = src.match(/function armerLAttaque\(cout\) \{[\s\S]*?\n {2}\}/);
  assert.match(armer[0], /bouton\.disabled = false;/, 'rien ne rend le bouton vif');
  assert.match(armer[0], /ECRAN_RAID\.delaiArmementMs/, 'la minuterie n\'emploie pas le délai de la donnée');

  // ⚠ ET LE DÉLAI EST COURT. Ethan attaque beaucoup — il est le seul testeur.
  assert.ok(ECRAN_RAID.delaiArmementMs > 0, 'un délai nul ne garde rien');
  assert.ok(ECRAN_RAID.delaiArmementMs <= 500,
    `${ECRAN_RAID.delaiArmementMs} ms : au-delà d'une demi-seconde, la garde se sent`);

  // ⚠ ET SANS NAVIGATEUR, LE BOUTON N'EST PAS CONDAMNÉ. Le dépôt n'en a pas ;
  // un `setTimeout` absent laisserait le bouton mort pour toujours.
  assert.match(armer[0], /typeof fenetre\.setTimeout !== 'function'/,
    'sans minuterie, le bouton resterait inerte à jamais');

  // ⚠ ET UNE SECONDE ENTRÉE N'EMPILE PAS LES MINUTERIES : celle d'avant est
  // annulée, sinon la première à échoir rendrait le bouton vif trop tôt.
  assert.match(armer[0], /clearTimeout\(minuterieArmement\)/,
    'une minuterie d\'armement peut en écraser une autre');
});

test('ASSAUT T11 — le délai est une donnée, pas un nombre dans l\'écran', () => {
  // ⚠⚠ RÈGLE §4 DE `CLAUDE.md` : un nombre se change seul, donc il vit dans
  // `src/data/`. C'est exactement celle qui est tombée sur le seuil d'étiquette
  // au lot CONTOUR-ET-ÉTIQUETTES, parce qu'il valait 64 et qu'un cran valait 64.
  assert.equal(typeof ECRAN_RAID.delaiArmementMs, 'number');
  assert.ok(Number.isInteger(ECRAN_RAID.delaiArmementMs), 'un délai en millisecondes est entier');

  const src = decommentee('src/ui/raid.js');
  // Aucun littéral de millisecondes dans l'appel de minuterie.
  const minuteries = [...src.matchAll(/setTimeout\([\s\S]*?\);/g)].map((m) => m[0]);
  assert.ok(minuteries.length > 0, 'le montage ne mesure rien : plus aucune minuterie');
  for (const m of minuteries) {
    assert.ok(!/,\s*\d+\s*\)/.test(m), `une minuterie porte un nombre en dur : ${m.replace(/\s+/g, ' ')}`);
  }
  // Falsifiable : le motif verrait bien un nombre en dur.
  assert.ok(/,\s*\d+\s*\)/.test('fenetre.setTimeout(() => {}, 300)'));

  // Et la valeur ne se recopie pas non plus dans la feuille ni dans la session.
  const session = decommentee('src/ui/session.js');
  assert.ok(!session.includes('delaiArmementMs'), 'la session recopie le délai');
});
