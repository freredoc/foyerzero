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
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { libelleDAttaque, vueDuRaid, plafondDuZoom } from '../src/ui/raid.js';
import { calculerProjection } from '../src/render/projection.js';
import { MUR_CASES, BANDE_SOUS_LE_MUR } from '../src/render/fond.js';
import {
  BANDES, casesDeLaBande, bornesDuDecalage, bornesDuDecalageX,
} from '../src/render/bandes.js';
import { GRILLE } from '../src/data/combat.js';
import { COTE_SPRITE } from '../src/data/atlas.js';
import { COTE_CASE_MAX } from '../src/ui/chantier.js';
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

// ===========================================================================
// Lot ÉCRAN-RAID, 04/09 — une bande à la fois, le zoom, et les sprites du bas
// ===========================================================================
//
// ⚠⚠ CE QUE CES NEUF TESTS NE PROUVENT PAS, ET IL FAUT LE DIRE EN TÊTE. Cinq
// d'entre eux calculent une géométrie — ça, ils le prouvent. `T5` et `T8` sont
// des gardes de SOURCE : elles disent qu'une table est unique et qu'un nom nu a
// disparu, jamais qu'un pixel est au bon endroit. `T9` est le seul qui porte
// sur un geste, et il ne se calcule pas : il est mesuré dans Chromium, et le
// rapport porte ses nombres. La preuve du rendu est là-bas, pas ici.

test('RAID-E T1 — une bande cadre par la LARGEUR, et le fond remplit tout', () => {
  // ⚠⚠ C'EST LE DÉFAUT QU'ETHAN A RAPPORTÉ, ET IL SE REPRODUIT ICI EN DEUX
  // LIGNES. Sur le canevas de préparation d'un S25 FE — 1080 × 1398 pixels de
  // buffer, mesuré, `#raid-bas` en prenant 227,56 px CSS —, faire tenir les
  // dix-huit rangées et demie donne une case de 75 et laisse **165 pixels de
  // noir de chaque côté**. Huit rangées et demie donnent 108, et la grille
  // occupe les 1080.
  const LARGEUR = 1080; const HAUTEUR = 1398;
  const boite = GRILLE.largeur + 2 * MUR_CASES;

  const avant = calculerProjection(LARGEUR, HAUTEUR, MUR_CASES);
  assert.equal(avant.tailleCase, 75, 'la vue d\'ensemble ne tombe plus sur 75');
  assert.equal((LARGEUR - boite * avant.tailleCase) / 2, 165,
    'le vide latéral de la vue d\'ensemble a changé sans qu\'on le dise');

  const bande = calculerProjection(LARGEUR, HAUTEUR, MUR_CASES, {
    lignesVisibles: casesDeLaBande('batiments', MUR_CASES),
  });
  assert.equal(bande.tailleCase, 108, 'la bande ne fait plus tenir la case sur la largeur');
  assert.equal(boite * bande.tailleCase, LARGEUR,
    'la boîte n\'occupe plus exactement la largeur du cadre');
  // ⚠ ET C'EST BIEN LA LARGEUR QUI COMMANDE, pas la hauteur : sans cette ligne,
  // le test passerait sur une géométrie où les deux coïncideraient par hasard.
  assert.ok(LARGEUR / boite < HAUTEUR / casesDeLaBande('batiments', MUR_CASES),
    'la hauteur commande encore : le cadrage ne vient pas de la bande');

  // ⚠⚠ ET LE CENTRAGE SE MESURE SUR LE CONTENU ENTIER, PAS SUR LA BANDE — CETTE
  // ASSERTION A ÉTÉ ÉCRITE APRÈS UNE FALSIFICATION QUI NE MORDAIT PAS. Centrer
  // sur les huit rangées et demie de la bande laisse **240 pixels de buffer de
  // noir au-dessus de la rangée 18** — mesuré, `margeY` passe de 54 à 294 — et
  // la suite restait ENTIÈREMENT VERTE, 30 pass / 0 fail. C'est la bande de noir
  // que le lot retire, déplacée des côtés vers le haut.
  assert.ok((GRILLE.longueur + MUR_CASES) * bande.tailleCase > HAUTEUR,
    'le montage ne mesure rien : le contenu tient dans la vue, il n\'y a rien à centrer');
  assert.equal(bande.margeY, MUR_CASES * bande.tailleCase,
    'une bande de noir s\'est glissée au-dessus de la première rangée');

  // ⚠ ET LE CENTRAGE MORD ENCORE QUAND LE CONTENU TIENT : sans cette moitié,
  // l'assertion du dessus serait vraie d'un code qui ne centrerait jamais rien.
  const plein = calculerProjection(1080, 2340, MUR_CASES);
  assert.ok((GRILLE.longueur + MUR_CASES) * plein.tailleCase < 2340);
  assert.ok(plein.margeY > MUR_CASES * plein.tailleCase,
    'la vue d\'ensemble ne se centre plus quand elle a de la place');
});

test('RAID-E T2 — sans `lignesVisibles`, la projection est celle d\'hier au caractère près', () => {
  // ⚠⚠ CE TEST EXISTE POUR QUE `T1` NE PUISSE PAS ÊTRE OBTENU EN CHANGEANT TOUT.
  // Le défaut le plus probable du lot est un paramètre qui déborde sur les
  // appelants qui ne l'ont pas demandé — `ui/banc.js`, et le déroulé lui-même.
  // On refait donc l'ANCIENNE formule à la main et on exige l'égalité.
  for (const [largeur, hauteur, mur] of [
    [1080, 1398, 0.5], [1080, 2340, 0.5], [412, 820, 0], [360, 560, 0], [1024, 768, 1],
  ]) {
    const colonnes = GRILLE.largeur + 2 * mur;
    const lignes = GRILLE.longueur + mur;
    const tailleCase = Math.floor(Math.min(largeur / colonnes, hauteur / lignes));
    const attendu = {
      tailleCase,
      margeX: Math.floor((largeur - colonnes * tailleCase) / 2) + mur * tailleCase,
      margeY: Math.floor((hauteur - lignes * tailleCase) / 2) + mur * tailleCase,
    };
    const rendu = calculerProjection(largeur, hauteur, mur);
    assert.equal(rendu.tailleCase, attendu.tailleCase, `${largeur}×${hauteur} : la taille de case a bougé`);
    assert.equal(rendu.margeX, attendu.margeX, `${largeur}×${hauteur} : margeX a bougé`);
    assert.equal(rendu.margeY, attendu.margeY, `${largeur}×${hauteur} : margeY a bougé`);
  }
  // ⚠ ET LE DÉFAUT DE `lignesVisibles` EST BIEN CELUI DE LA VUE D'ENSEMBLE :
  // `casesDeLaBande(null, …)` doit rendre exactement ce que la formule d'hier
  // mettait au dénominateur, sinon l'égalité ci-dessus tiendrait par accident.
  assert.equal(casesDeLaBande(null, MUR_CASES), GRILLE.longueur + MUR_CASES);
});

test('RAID-E T3 — la demi-case de mur ne compte que sur la bande qui la porte', () => {
  // ⚠ `BANDE_SOUS_LE_MUR` FAIT FOI, ET LE TEST NE LA RECOPIE PAS : il la LIT, et
  // exige que ce soit la seule des trois à porter la demi-case. Écrire
  // « batiments » ici passerait aujourd'hui et mentirait le jour où le mur
  // changerait de bande.
  const rangees = (cle) => {
    const b = BANDES.find((x) => x.cle === cle);
    return b.derniere - b.premiere + 1;
  };
  for (const bande of BANDES) {
    const attendu = rangees(bande.cle) + (bande.cle === BANDE_SOUS_LE_MUR ? MUR_CASES : 0);
    assert.equal(casesDeLaBande(bande.cle, MUR_CASES), attendu,
      `la bande « ${bande.cle} » ne réserve pas la bonne hauteur`);
  }
  // Une seule bande porte le mur, et elle en porte une demi-case.
  const avecMur = BANDES.filter((b) => casesDeLaBande(b.cle, MUR_CASES) % 1 !== 0);
  assert.equal(avecMur.length, 1, 'zéro ou plusieurs bandes réservent une demi-case de mur');
  assert.equal(avecMur[0].cle, BANDE_SOUS_LE_MUR);
  // ⚠ ET SANS MUR, LES TROIS RENDENT UN NOMBRE ENTIER DE RANGÉES : un mur
  // fantôme se verrait ici.
  for (const bande of BANDES) {
    assert.equal(casesDeLaBande(bande.cle, 0), rangees(bande.cle));
  }
});

test('RAID-E T4 — une bande qui tient entière dans la vue ne défile pas', () => {
  // ⚠⚠ LA BORNE DE BANDE NE SUFFIT PAS SUR UN CANEVAS, ET C'EST LA MOITIÉ QUE
  // `bornesDuDecalage` AJOUTE. Au plancher de zoom, la vue montre TREIZE rangées
  // pour une bande qui en fait huit : s'en tenir à `bornesDeDefilement`
  // laisserait la Défense se poser à 918 pixels alors que le contenu s'arrête
  // 318 pixels plus haut que le bas du cadre — trois cents pixels de noir.
  const cote = 108; const vue = 1398; const mur = MUR_CASES;
  const bat = bornesDuDecalage('batiments', cote, vue, mur);
  assert.equal(bat.min, 0, 'la base ne commence plus en haut du contenu');
  assert.equal(bat.max, bat.min, 'la base défile alors qu\'elle tient entière');

  const def = bornesDuDecalage('defense', cote, vue, mur);
  assert.equal(def.max, def.min, 'la défense défile alors qu\'elle tient entière');
  // Le contenu entier fait 18 rangées plus la demi-case du mur ; la vue s'arrête
  // à son bord, jamais après.
  const contenu = mur * cote + GRILLE.longueur * cote;
  assert.equal(def.min, contenu - vue, 'la vue de la défense dépasse le bas du contenu');
  assert.ok(def.min > 0, 'le montage ne mesure rien : la défense ne décale pas');

  // ⚠ ET AUCUNE BORNE N'EST NÉGATIVE, sur les deux bandes et les deux axes.
  for (const bornes of [bat, def, bornesDuDecalageX(cote, 1080, mur)]) {
    assert.ok(bornes.min >= 0 && bornes.max >= bornes.min,
      `bornes hors course : ${JSON.stringify(bornes)}`);
  }
  // Au plancher, la boîte occupe exactement la largeur : rien à promener.
  assert.equal(bornesDuDecalageX(cote, 1080, mur).max, 0);
  // ⚠ ET UNE FOIS ZOOMÉ, LES DEUX AXES S'OUVRENT — sinon le zoom ne servirait à
  // rien, et ces bornes seraient inertes.
  assert.ok(bornesDuDecalageX(216, 1080, mur).max > 0, 'zoomé, on ne peut pas promener en largeur');
  assert.ok(bornesDuDecalage('batiments', 216, 600, mur).max > 0, 'zoomé, on ne peut pas défiler');
});

test('RAID-E T5 — une seule table de bandes dans tout `src/`', () => {
  // ⚠⚠ C'EST LA GARDE DU DÉPLACEMENT. Les bandes ont quitté `ui/chantier.js`
  // pour `render/bandes.js` parce que l'écran de raid les cadre lui aussi ; une
  // seconde table serait la deuxième vérité que §4 interdit, et la première à
  // mentir le jour où une rangée bouge.
  const dossiers = ['data', 'sim', 'render', 'ui', 'son'];
  const porteurs = [];
  for (const dossier of dossiers) {
    for (const fichier of readdirSync(join(RACINE, 'src', dossier))) {
      const source = decommentee(join('src', dossier, fichier));
      // Une table de bandes se reconnaît à ce qu'elle NOMME les trois clés.
      const nomme = ['deploiement', 'defense', 'batiments']
        .every((cle) => source.includes(`'${cle}'`));
      if (nomme) porteurs.push(`${dossier}/${fichier}`);
    }
  }
  assert.deepEqual(porteurs, ['render/bandes.js'],
    `les trois bandes sont nommées ailleurs qu'une fois : ${porteurs.join(', ')}`);

  // ⚠ ET `ui/raid.js` LES IMPORTE, il ne les redéduit pas de `GRILLE.bandes`.
  const raid = decommentee('src/ui/raid.js');
  assert.match(raid, /from '\.\.\/render\/bandes\.js'/, 'l\'écran de raid n\'importe pas les bandes');
  assert.ok(!/GRILLE\.bandes/.test(raid), 'l\'écran de raid relit GRILLE.bandes de son côté');
  // Et il ne passe pas non plus par l'écran de la base pour les avoir.
  assert.ok(!/BANDES[^_A-Za-z]|BANDES$/.test(raid.split('\n').filter((l) => l.includes("from './chantier.js'")).join('\n')),
    'l\'écran de raid prend les bandes à l\'écran de la base');
});

test('RAID-E T6 — le plancher de zoom se dérive, et il laisse voir la bande', () => {
  // ⚠⚠ LE PLANCHER N'EST PAS ÉCRIT, C'EST LA MÊME FORMULE SANS CÔTÉ IMPOSÉ.
  // On le refait donc sur trois hauteurs de bande et on exige que la bande
  // entre entière — c'est la seule chose qu'un plancher doive garantir.
  for (const [largeur, hauteur] of [[1080, 1398], [1080, 2340], [360, 466]]) {
    for (const cle of ['batiments', 'defense', 'deploiement']) {
      const lignes = casesDeLaBande(cle, MUR_CASES);
      const plancher = calculerProjection(largeur, hauteur, MUR_CASES, { lignesVisibles: lignes })
        .tailleCase;
      assert.ok(lignes * plancher <= hauteur,
        `${cle} sur ${largeur}×${hauteur} : la bande ne tient pas au plancher`);
      assert.ok((GRILLE.largeur + 2 * MUR_CASES) * plancher <= largeur,
        `${cle} sur ${largeur}×${hauteur} : la boîte déborde en largeur au plancher`);
      // Et il est MAXIMAL : une case de plus ferait déborder l'un des deux.
      const trop = plancher + 1;
      assert.ok(lignes * trop > hauteur || (GRILLE.largeur + 2 * MUR_CASES) * trop > largeur,
        `${cle} sur ${largeur}×${hauteur} : le plancher laisse de la place perdue`);
    }
  }
  // ⚠ ET LES TROIS BANDES NE DONNENT PAS LE MÊME PLANCHER : sans cette ligne, le
  // test passerait sur un code qui ignorerait `lignesVisibles`.
  const planchers = ['batiments', 'defense', 'deploiement'].map((cle) => calculerProjection(
    1080, 1398, MUR_CASES, { lignesVisibles: casesDeLaBande(cle, MUR_CASES) },
  ).tailleCase);
  assert.equal(new Set(planchers).size >= 1, true);
  assert.ok(planchers[0] > calculerProjection(1080, 1398, MUR_CASES).tailleCase,
    'cadrer une bande ne gagne rien sur la vue d\'ensemble');
});

test('RAID-E T7 — le plafond du zoom est un multiple ENTIER de `COTE_SPRITE`', () => {
  // ⚠⚠ C'EST LE RAISONNEMENT DE `ZOOM_BASE_MULTIPLE_MAX`, REPRIS DANS L'UNITÉ DU
  // CANEVAS. Au plafond, un pixel de sprite doit valoir un nombre ENTIER de
  // pixels dessinés, sans quoi `drawImage` interpole et rend du flou — c'est ce
  // que le lot du 30/08 a retiré à la carte du monde.
  for (const dpr of [1, 1.5, 2, 2.625, 3, 4]) {
    const plafond = plafondDuZoom(dpr);
    assert.equal(plafond % COTE_SPRITE, 0, `à dpr ${dpr}, le plafond n'est pas un multiple de sprite`);
    assert.ok(plafond >= COTE_SPRITE, `à dpr ${dpr}, le plafond passe sous une cellule d'atlas`);
  }
  // ⚠ ET IL SUIT LA DENSITÉ. Prendre `COTE_CASE_MAX` tel quel donnerait, à
  // densité 3, un plafond de 128 quand le plancher d'une bande en vaut déjà
  // 108 : une plage de 1,19 fois, très exactement le « zoom chelou, très lent »
  // du 31/08. Le test mesure la plage, pas la constante.
  assert.equal(plafondDuZoom(3), COTE_CASE_MAX * 3);
  const plancher = calculerProjection(1080, 1398, MUR_CASES, {
    lignesVisibles: casesDeLaBande('batiments', MUR_CASES),
  }).tailleCase;
  assert.ok(plafondDuZoom(3) / plancher > 3, 'la plage du zoom du raid s\'est refermée');
  // Une densité absurde ne fait pas disparaître la grille.
  assert.equal(plafondDuZoom(0), COTE_SPRITE);
  assert.equal(plafondDuZoom(Number.NaN), COTE_SPRITE);
});

test('RAID-E T8 — le nom nu a quitté les vagues, et le sprite est celui de l\'Offense', () => {
  const raid = decommentee('src/ui/raid.js');
  // ⚠⚠ FALSIFICATION : remettre `emplacement.textContent = occupant.nom` fait
  // tomber ce test, et c'est ce qui a été vérifié en le remettant pour de bon.
  assert.ok(!/emplacement\.textContent\s*=\s*occupant\.nom/.test(raid),
    'les vagues du raid réécrivent le nom de l\'unité en toutes lettres');
  // Le motif voit bien la faute qu'il cherche.
  assert.ok(/emplacement\.textContent\s*=\s*occupant\.nom/
    .test('          emplacement.textContent = occupant.nom;'));

  // ⚠ ET LE SPRITE VIENT DE L'OFFENSE, PAS D'UN SECOND APPEL À `couchesDeLEntite`.
  // Les quatre champs d'une unité d'assaut — dont `camp: 'attaque'`, qui décide
  // de la POSE — ne se recopient pas : c'est ce que dit `couchesDeLUniteDAssaut`
  // dans son propre commentaire.
  assert.match(raid, /couchesDeLUniteDAssaut\(occupant\.id\)/,
    'les vagues ne posent pas la vignette de l\'Offense');
  assert.ok(!/couchesDeLEntite\(/.test(raid),
    'l\'écran de raid recompose les couches d\'une unité de son côté');
  assert.match(raid, /poserCouches\(/, 'les couches ne sont pas posées');

  // ⚠ LE NOM N'EST PAS PERDU : il est dans le `title`, avec le niveau et les PV.
  assert.match(raid, /emplacement\.title\s*=\s*`\$\{occupant\.nom\}/,
    'le nom de l\'unité a disparu de l\'écran sans reparaître ailleurs');

  // ⚠⚠ ET LES TROIS ÉTATS SURVIVENT, PARCE QU'AUCUN NE PEINT LE SPRITE. C'est
  // la question que le brief pose : un aplat sur l'image rendrait les pièces
  // méconnaissables. Les trois règles portent sur le LISERÉ.
  const feuille = balisage();
  for (const classe of ['occupe', 'inactive', 'abimee']) {
    const bloc = feuille.match(new RegExp(`#ecran-raid \\.emplacement\\.${classe}[^{]*\\{([^}]*)\\}`));
    assert.ok(bloc !== null, `l'état « ${classe} » n'a plus de règle`);
    assert.ok(!/background(-color|-image)?:/.test(bloc[1]),
      `l'état « ${classe} » peint le fond de la vignette : le sprite devient illisible`);
    assert.ok(!/opacity:|filter:/.test(bloc[1]),
      `l'état « ${classe} » voile le sprite`);
  }
});

test('RAID-E T9 — un doigt promène, deux doigts zooment, et la pièce se glisse', () => {
  // ⚠⚠ CE TEST NE MESURE PAS LE GESTE — IL N'Y A NI JSDOM NI NAVIGATEUR ICI.
  // Ce qu'il garde, c'est la SÉPARATION qui rend le geste possible, et elle a
  // été mesurée avant d'être crue : le glisser-déposer des pièces vit sur
  // `#raid-vagues`, le pincement sur `#raid-canvas`. Ce sont DEUX éléments, et
  // un contact tombe sur un seul — le brief supposait « la même grille », et
  // c'est faux. Les cinq gestes sont relevés dans Chromium au rapport.
  const raid = decommentee('src/ui/raid.js');

  //
  // ⚠⚠ ET LA GARDE NOMME LES RÔLES, ELLE NE LES COMPTE PAS — resserrée après une
  // falsification qui NE MORDAIT PAS. Elle exigeait « au moins trois écouteurs
  // par élément » : renommer `pointermove` en laissait trois, donc elle restait
  // VERTE — mesuré, 20 pass / 0 fail — alors que ni le promenage ni le
  // pincement ne faisaient plus rien. Un compte ne dit pas ce qui manque.
  const ecoutes = [...raid.matchAll(/(\w+)\.addEventListener\('([a-z]+)'/g)]
    .map((m) => `${m[1]}:${m[2]}`);
  for (const attendu of ['canvas:pointerdown', 'canvas:pointermove', 'canvas:pointerup',
    'canvas:pointercancel', 'hoteVagues:pointerdown', 'hoteVagues:pointerup']) {
    assert.ok(ecoutes.includes(attendu), `l'écouteur « ${attendu} » a disparu`);
  }
  // ⚠ ET AUCUN CONTACT N'EST ÉCOUTÉ AILLEURS : deux surfaces, et deux
  // seulement. Un troisième porteur rouvrirait la question de savoir laquelle
  // reçoit le doigt.
  const contacts = ecoutes.filter((e) => /:(pointer|touch)/.test(e));
  assert.equal(contacts.filter((e) => !e.startsWith('hoteVagues:') && !e.startsWith('canvas:')).length, 0,
    'un contact est écouté ailleurs que sur les vagues ou le canevas');

  // ⚠ UN DOIGT PROMÈNE, DEUX DOIGTS ZOOMENT — la règle du 30/08. Le pincement
  // ne s'ouvre qu'à DEUX contacts, et le promenage est la branche d'après.
  assert.match(raid, /if \(doigts\.size >= 2\) \{ ouvrirPincement\(\); return; \}/,
    'le second doigt n\'ouvre plus un pincement');
  assert.match(raid, /if \(pincement !== null && doigts\.size === 2\)/,
    'le pincement s\'applique à un nombre de doigts qui n\'est pas deux');
  // ⚠ ET LES CONTACTS SE SUIVENT PAR IDENTIFIANT, jamais par compteur : un doigt
  // qui quitte la dalle n'émet pas toujours `pointerup`, et un compteur qui ne
  // redescend pas laisserait l'écran convaincu qu'on pince encore.
  assert.match(raid, /const doigts = new Map\(\)/, 'les contacts se comptent au lieu de se nommer');

  // ⚠⚠ ET LE ZOOM NE PASSE PAS PAR UNE TRANSFORMATION. `transform: scale()` est
  // interdit sur la grille de la base depuis le lot POSE-À-L'ÉCRAN, pour une
  // raison qui vaut ici : il déplace le DESSIN sans déplacer la géométrie du
  // pointage. Ce qui change est le côté d'une case.
  assert.ok(!/transform\s*:/.test(raid), 'l\'écran de raid zoome par une transformation');
  assert.ok(!/ctx\.scale\(|setTransform\(/.test(raid),
    'l\'écran de raid met le contexte à l\'échelle au lieu de changer la case');
});
