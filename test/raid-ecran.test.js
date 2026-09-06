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

import {
  libelleDAttaque, vueDuRaid, plafondDuZoom,
  initialiserEcranRaid, BANDE_A_L_OUVERTURE,
} from '../src/ui/raid.js';
import { calculerProjection } from '../src/render/projection.js';
import { MUR_CASES, BANDE_SOUS_LE_MUR } from '../src/render/fond.js';
import {
  BANDES, casesDeLaBande, bornesDuDecalage, bornesDuDecalageX, basculeDeBande,
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

  // ⚠⚠ ELLE A CHANGÉ DE CIBLE AU LOT RETOUR-DE-RAID, ET ELLE SE RESSERRE : IL
  // N'Y EN A PLUS QU'UN. Elle admettait DEUX déclencheurs — « Attaquer » et
  // « Ré-attaquer » —, au motif que le second était « un second raid décidé
  // devant un résultat ». Ethan, 06/09 : « bouton réattaquer remet sur la cible,
  // pas d'attaque instantané. » Il ne dépense plus : il rouvre la préparation, et
  // c'est « Attaquer » qui engage, comme la première fois.
  const permis = ['raid-attaquer'];
  for (const { l } of chemins) {
    const parQui = permis.filter((id) => l.includes(`'${id}'`));
    assert.equal(parQui.length, 1,
      `un chemin vers lancer(false) qui ne part pas de raid-attaquer : ${l.trim()}`);
  }
  assert.deepEqual(
    chemins.map(({ l }) => permis.find((id) => l.includes(`'${id}'`))).sort(),
    [...permis].sort(),
    'le déclencheur attendu n\'est pas exactement celui qu\'on trouve',
  );

  // ⚠⚠ ET « RÉ-ATTAQUER » EST NOMMÉ DE FACE, DANS LES DEUX SENS. Sans ces deux
  // lignes, remettre `lancer(false)` dans son branchement ferait tomber la
  // boucle ci-dessus par accident, avec un message qui parlerait d'autre chose ;
  // et surtout, un bouton qui cesserait de rouvrir la cible passerait inaperçu.
  const reattaquer = src.match(/brancher\('raid-reattaquer'[\s\S]*?\n {2}\}\);/);
  assert.ok(reattaquer, 'raid-reattaquer a disparu');
  assert.ok(!/lancer\(/.test(reattaquer[0]),
    'raid-reattaquer engage de nouveau un raid : Ethan a dit « pas d\'attaque instantané »');
  assert.match(reattaquer[0], /ouvrirSurLaCible\(etatCourant, cibleCourante\)/,
    'raid-reattaquer ne remet plus le joueur sur sa cible');

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
  const pasAPas = src.match(/brancher\('raid-pas'[\s\S]*?\n {2}\}\);/);
  assert.ok(pasAPas, 'raid-pas a disparu');
  assert.match(pasAPas[0], /finDuDeroule\(\)/, 'raid-pas ne passe pas par finDuDeroule');
  // ⚠⚠ « INSTANTANÉ » PASSE PAR UNE INDIRECTION DEPUIS LE LOT RETOUR-DE-RAID, ET
  // LA GARDE LA SUIT. Son corps a été EXTRAIT sous le nom `conclureLeDeroule`,
  // parce que le masquage de la page en a besoin lui aussi — et deux écritures
  // voisines de « conclure un combat » divergeraient. Le test ne relâche rien :
  // il vérifie que le bouton mène à la fonction, PUIS que la fonction mène à
  // `finDuDeroule`. Une indirection qui perdrait la fin le ferait tomber.
  const instantane = src.match(/brancher\('raid-instantane'[\s\S]*?\);/);
  assert.ok(instantane, 'raid-instantane a disparu');
  assert.match(instantane[0], /conclureLeDeroule\(\)/,
    'raid-instantane ne conclut plus le déroulé');
  const conclure = src.match(/function conclureLeDeroule\(\) \{[\s\S]*?\n {2}\}/);
  assert.ok(conclure, 'conclureLeDeroule a disparu');
  assert.match(conclure[0], /finDuDeroule\(\)/, 'conclureLeDeroule ne passe pas par finDuDeroule');
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
  //
  // ⚠ LE CHEMIN D'ENTRÉE PORTE UN NOM DEPUIS LE LOT RETOUR-DE-RAID : il a deux
  // appelants — la session, et « Réattaquer » —, donc la garde lit la fonction
  // NOMMÉE, et exige au passage que la méthode publique lui délègue plutôt que
  // de refaire une entrée à elle.
  const ouvrir = src.match(/function ouvrirSurLaCible\([\s\S]*?\n {2}\}/);
  assert.ok(ouvrir, 'ouvrirSurLaCible a disparu');
  assert.match(ouvrir[0], /armerLAttaque\(/, 'le bouton n\'est pas ré-armé à l\'entrée');
  const methode = src.match(/ouvrir\(etat, cible, atlasFournis = null\) \{[^\n]*\}/);
  assert.ok(methode, 'la méthode `ouvrir` a disparu');
  assert.match(methode[0], /ouvrirSurLaCible\(etat, cible, atlasFournis\)/,
    'la méthode `ouvrir` ne passe plus par le chemin d\'entrée commun');

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

// ---------------------------------------------------------------------------
// RETOUR-DE-RAID — points 5, 8, 11 et 21 d'Ethan, 06/09
// ---------------------------------------------------------------------------
//
// ⚠⚠ CES HUIT TESTS-CI MONTENT L'ÉCRAN POUR DE BON, ET C'EST NEUF DANS CE
// FICHIER. Les onze tests du lot ASSAUT, plus haut, lisent la SOURCE et le
// BALISAGE : c'était juste pour ce qu'ils gardent — quels boutons existent, quel
// chemin mène où. Le point 11 d'Ethan, lui, porte sur un CYCLE DE VIE — un raid
// masqué en cours de déroulé — et « le code contient un écouteur » ne dit rien de
// ce que cet écouteur FAIT. Asserter la présence d'une ligne est le proxy que ce
// dépôt a déjà payé quatre fois.
//
// ⚠ AUCUNE DÉPENDANCE N'ENTRE : le faux document est écrit à la main, sur le
// modèle de ceux de `chantier.test.js`, `recherche.test.js` et `monde.test.js`.
// `esbuild` reste la seule dépendance de développement (CLAUDE.md §3).

/**
 * Un document de papier qui porte exactement les identifiants de l'écran de
 * raid — et LÈVE sur tout autre.
 *
 * ⚠⚠ IL GARDE DONC UNE SECONDE CHOSE : que l'écran ne demande aucun élément que
 * `src/index.src.html` n'a pas. La liste est confrontée au balisage avant le
 * montage, comme celle de `fauxDocumentMonde`.
 */
function fauxDocumentRaid({ largeurCss = 360, hauteurCss = 466, dpr = 3 } = {}) {
  const IDS = [
    'raid-canvas', 'raid-titre', 'raid-avis', 'raid-bas', 'raid-vagues',
    'raid-bandeau', 'raid-vitesses', 'raid-bascule-bande', 'raid-boutons',
    'raid-attaquer', 'raid-simuler', 'raid-reattaquer', 'raid-tout-reparer',
    'raid-reparer', 'raid-activer', 'raid-pas', 'raid-instantane',
    'raid-sim', 'raid-sim-corps', 'raid-sim-fermer',
    'raid-fin', 'raid-fin-corps', 'raid-fin-carte', 'raid-fin-base',
    'raid-retour-carte', 'raid-retour-offense',
    'raid-vitesse-1', 'raid-vitesse-2', 'raid-vitesse-4',
  ];
  const html = balisage();
  for (const id of IDS) {
    assert.match(html, new RegExp(`id="${id}"`), `« ${id} » n'est pas dans le balisage`);
  }

  /** Tout ce que le canevas a reçu — on n'en compte que le nombre. */
  const appels = [];
  const ctx = new Proxy({}, {
    get(_, nom) {
      if (nom === 'measureText') return () => ({ width: 40 });
      return (...args) => { appels.push({ nom, args }); };
    },
    set(_, nom, valeur) { appels.push({ nom, args: [valeur] }); return true; },
  });

  const faire = (id) => {
    const el = {
      id,
      tag: id,
      hidden: false,
      disabled: false,
      title: '',
      style: {},
      dataset: {},
      classes: new Set(),
      children: [],
      parent: null,
      attributs: new Map(),
      complete: true,
      naturalWidth: 512,
      clientWidth: largeurCss,
      clientHeight: hauteurCss,
      width: 0,
      height: 0,
      classList: {
        add(...n) { for (const c of n) el.classes.add(c); },
        remove(...n) { for (const c of n) el.classes.delete(c); },
        contains(c) { return el.classes.has(c); },
        toggle(c, force) {
          const veut = force === undefined ? !el.classes.has(c) : force;
          if (veut) el.classes.add(c); else el.classes.delete(c);
          return veut;
        },
      },
      set className(v) { el.classes = new Set(String(v).split(/\s+/).filter(Boolean)); },
      get className() { return [...el.classes].join(' '); },
      // ⚠⚠ ÉCRIRE `textContent` VIDE LES ENFANTS, ET C'EST LA MOITIÉ QUI COMPTE.
      // Les deux peintres du dépôt commencent par `hote.textContent = ''` pour
      // repartir d'une grille vide ; un faux qui garderait ses enfants ferait
      // s'empiler quatre vagues à chaque repeint, et le test compterait des
      // cases qui n'existent plus. Trouvé en le mesurant, pas en le relisant.
      _texte: '',
      set textContent(v) { el.children.length = 0; el._texte = String(v); },
      get textContent() { return el._texte; },
      appendChild(n) { el.children.push(n); n.parent = el; return n; },
      append(...n) { for (const x of n) el.appendChild(x); },
      querySelector: () => null,
      setAttribute(nom, valeur) { el.attributs.set(nom, valeur); },
      ownerDocument: null,
      getContext: () => ctx,
      getBoundingClientRect: () => ({ width: largeurCss, height: hauteurCss, left: 0, top: 0 }),
      ecouteurs: new Map(),
      addEventListener(type, fn) {
        if (!el.ecouteurs.has(type)) el.ecouteurs.set(type, []);
        el.ecouteurs.get(type).push(fn);
      },
      envoyer(type, evenement = {}) {
        const fns = el.ecouteurs.get(type);
        assert.ok(fns && fns.length > 0, `rien n'écoute « ${type} » sur ${el.id}`);
        for (const fn of fns) fn(evenement);
      },
      setPointerCapture() {},
    };
    return el;
  };

  const parId = new Map(IDS.map((id) => [id, faire(id)]));
  const ecouteursDoc = new Map();
  // ⚠⚠ LE FAUX PORTE CE QUE LE CODE EMPLOIE VRAIMENT, IL NE L'ÉVITE PAS. Les
  // fonds d'atlas passent par une règle de feuille PARTAGÉE depuis le correctif
  // du freeze : `poserCouches` demande un `head`, un `createTextNode` et une vue
  // qui rende la valeur d'une variable CSS. Les lui refuser ferait retomber
  // l'écran sur un chemin de repli, donc exercer autre chose que ce qui est
  // livré. Même choix qu'au faux document de `recherche.test.js`.
  const doc = {
    hidden: false,
    head: faire('head'),
    documentElement: faire('html'),
    getElementById(id) {
      if (!parId.has(id)) {
        throw new Error(`faux document : « ${id} » n'est pas dans src/index.src.html`);
      }
      return parId.get(id);
    },
    createElement: (tag) => { const el = faire(tag); el.ownerDocument = doc; return el; },
    createTextNode: (texte) => ({ textContent: String(texte) }),
    addEventListener(type, fn) {
      if (!ecouteursDoc.has(type)) ecouteursDoc.set(type, []);
      ecouteursDoc.get(type).push(fn);
    },
    /** Rejoue un évènement de document — c'est ce qui masque la page. */
    envoyer(type) {
      const fns = ecouteursDoc.get(type);
      assert.ok(fns && fns.length > 0, `rien n'écoute « ${type} » sur le document`);
      for (const fn of fns) fn({});
    },
    aUnEcouteur(type) { return (ecouteursDoc.get(type) ?? []).length > 0; },
    defaultView: {
      devicePixelRatio: dpr,
      requestAnimationFrame: () => { rafs.n += 1; return rafs.n; },
      cancelAnimationFrame() {},
      setTimeout: () => 1,
      clearTimeout() {},
      performance: { now: () => 0 },
      // L'adresse rendue n'est pas une image, et elle n'a pas à l'être : le code
      // s'en sert comme d'une CLÉ — deux atlas doivent donner deux règles, et
      // une variable vide doit lever.
      getComputedStyle: () => ({ getPropertyValue: (nom) => `url("${nom}")` }),
    },
  };
  for (const el of parId.values()) el.ownerDocument = doc;
  doc.head.ownerDocument = doc;
  const rafs = { n: 0 };
  return { doc, appels, parId, rafs };
}

/**
 * Des atlas de papier pour toutes les familles, quelle qu'en soit la liste.
 *
 * ⚠ `executer` LÈVE SUR UNE FAMILLE ABSENTE — « une unité invisible est un
 * défaut qu'on doit voir » —, et ce montage-ci ne mesure ni un sprite ni un
 * cadrage : il mesure un cycle de vie. Écrire la liste des familles à la main la
 * ferait vieillir au premier décor qui change, et le test tomberait pour une
 * raison qui ne le regarde pas.
 */
function fauxAtlas() {
  const image = { width: 512, height: 512, complete: true, naturalWidth: 512 };
  return new Proxy({}, { get: () => image, has: () => true });
}

/** L'écran monté sur une partie prête à attaquer, et sa cible. */
function ecranPret(options = {}) {
  const { doc, appels, parId } = fauxDocumentRaid(options);
  const etat = partieArmee();
  const cible = premierCamp(etat);
  const journal = { deroule: [] };
  const ecran = initialiserEcranRaid(doc, {
    pendantLeDeroule: (v) => journal.deroule.push(v),
  });
  ecran.ouvrir(etat, cible, fauxAtlas());
  return {
    doc, appels, parId, etat, cible, ecran, journal, $: (id) => parId.get(id),
  };
}

test('RDR T1 — un VRAI raid masqué se conclut, et le joueur atterrit sur son rapport', () => {
  // ⚠⚠ ETHAN, 06/09 : « je lance le raid, je quitte le jeu juste après, je
  // reviens après 5 min : le raid a figé et reprend, je dois attendre la fin. »
  const { doc, etat, $ } = ecranPret();
  const rapportsAvant = etat.rapports.length;

  $('raid-attaquer').envoyer('click');

  // ⚠ LE MONTAGE PROUVE D'ABORD QU'IL MESURE QUELQUE CHOSE : un déroulé de VRAI
  // raid est en cours, et aucun rapport n'est affiché. Sans ces trois lignes, un
  // combat déjà terminé passerait le test sans que l'écouteur existe.
  assert.equal(etat.rapports.length, rapportsAvant + 1, 'le montage n\'a pas lancé de raid');
  assert.equal($('raid-bas').hidden, true, 'le montage n\'est pas dans un déroulé');
  assert.equal($('raid-fin').hidden, true, 'le panneau de fin est déjà ouvert');
  assert.equal($('raid-bandeau').hidden, true, 'le montage a lancé une SIMULATION');

  // ⚠⚠ ET C'EST ICI QUE LE DÉFAUT VIVAIT : `requestAnimationFrame` ne rappelle
  // jamais dans ce montage, exactement comme il cesse de battre quand la WebView
  // passe à l'arrière-plan. Le déroulé est figé où il en était.
  doc.hidden = true;
  doc.envoyer('visibilitychange');

  // ⚠⚠ LE COMBAT EST CONCLU, ET LE RAPPORT EST À L'ÉCRAN. `combat` ne sort pas du
  // module — lui ouvrir un accesseur pour les besoins d'un test mettrait dans
  // `src/` une porte que la production n'emploie pas —, donc on lit l'état du
  // DÉROULÉ, qui est la conséquence exacte de sa fin : `finDuDeroule` appelle
  // `quitterLeDeroule`, qui rend `#raid-bas`, puis `montrerResultat`.
  assert.equal($('raid-fin').hidden, false, 'le joueur n\'atterrit pas sur son rapport');
  assert.equal($('raid-bas').hidden, false, 'le déroulé n\'est pas fini');
  assert.ok($('raid-fin-corps').children.length > 0, 'le rapport est vide');

  // ⚠ ET AUCUN SECOND RAID N'A EU LIEU : on conclut l'animation, on ne rejoue rien.
  assert.equal(etat.rapports.length, rapportsAvant + 1, 'le masquage a engagé un second raid');
});

test('RDR T2 — une SIMULATION masquée ne se conclut PAS', () => {
  // ⚠⚠ C'EST LE TEST QUI ATTRAPE UN ÉCOUTEUR ÉCRIT SANS SA GARDE. Une simulation
  // ne commande rien à personne — le bandeau « SIMULATEUR » existe pour qu'on ne
  // la confonde pas avec un ordre —, donc le joueur qui revient la reprend où il
  // l'a laissée.
  const { doc, etat, $ } = ecranPret();
  const rapportsAvant = etat.rapports.length;

  $('raid-simuler').envoyer('click');
  assert.equal(etat.rapports.length, rapportsAvant,
    'le montage a lancé un VRAI raid : il ne mesure pas ce qu\'il annonce');
  assert.equal($('raid-bandeau').hidden, false, 'le bandeau SIMULATEUR n\'est pas levé');
  assert.equal($('raid-bas').hidden, true, 'le montage n\'est pas dans un déroulé');

  doc.hidden = true;
  doc.envoyer('visibilitychange');

  assert.equal($('raid-bas').hidden, true, 'la simulation a été conclue par le masquage');
  assert.equal($('raid-sim').hidden, true, 'un rapport de simulation s\'est ouvert tout seul');
  assert.equal($('raid-fin').hidden, true, 'le panneau du VRAI raid s\'est ouvert');
});

test('RDR T3 — masquer sans déroulé ne fait rien, préparation comprise', () => {
  // ⚠⚠ LA SECONDE MOITIÉ DE CE TEST N'EST PAS AU BRIEF, ET C'EST LA PLUS UTILE.
  // Il demandait `combat === null` ; or `ouvrir` monte DÉJÀ un combat pour
  // montrer la cible, avec `vagues: []`, et ce combat-là n'est PAS terminé tant
  // qu'aucun tick n'a tourné. S'en tenir à « combat non nul et non terminé »
  // ferait donc conclure l'APERÇU chaque fois que le joueur quitte le jeu depuis
  // la préparation. C'est `deroule` qui discrimine, et c'est ce que ce test-ci
  // mesure.
  const { doc, appels, $ } = ecranPret();
  assert.equal($('raid-bas').hidden, false, 'le montage est déjà dans un déroulé');

  // ⚠ L'OBSERVABLE EST LE CANEVAS : `conclureLeDeroule` finit par `dessiner()`.
  // Si l'aperçu était résolu, la scène serait repeinte — et elle ne doit pas
  // l'être, puisque rien ne s'est passé.
  const avant = appels.length;
  assert.ok(avant > 0, 'le montage n\'a rien peint : il ne mesure pas un repeint');
  doc.hidden = true;
  doc.envoyer('visibilitychange');
  assert.equal(appels.length, avant, 'la préparation a été résolue par le masquage');
  assert.equal($('raid-fin').hidden, true, 'un rapport s\'est ouvert sans raid');
  assert.equal($('raid-sim').hidden, true, 'un rapport de simulation s\'est ouvert sans raid');

  // Et sur un écran monté mais jamais ouvert, `combat` vaut `null` : rien non plus.
  const vierge = fauxDocumentRaid();
  initialiserEcranRaid(vierge.doc);
  vierge.doc.hidden = true;
  vierge.doc.envoyer('visibilitychange');
  assert.equal(vierge.parId.get('raid-fin').hidden, true, 'un rapport sans combat');
});

test('RDR T3 bis — le retour de veille ne conclut rien non plus', () => {
  // L'évènement se déclenche dans les DEUX sens : `doc.hidden` faux est le
  // RETOUR, et il n'a rien à conclure.
  const { doc, $ } = ecranPret();
  $('raid-attaquer').envoyer('click');
  assert.equal($('raid-bas').hidden, true, 'le montage n\'est pas dans un déroulé');
  doc.hidden = false;
  doc.envoyer('visibilitychange');
  assert.equal($('raid-bas').hidden, true, 'le RETOUR de veille a conclu le raid');
  assert.equal($('raid-fin').hidden, true, 'le RETOUR de veille a ouvert le rapport');
});

test('RDR T4 — `#raid-vitesses` reste caché sur un vrai raid : pas de bouton « passer »', () => {
  // ⚠ ETHAN, 06/09, MOT POUR MOT : « bouton passer non ». On emprunte le CHEMIN
  // DE CODE d'« Instantané », on n'expose pas son bouton.
  const { $ } = ecranPret();
  $('raid-attaquer').envoyer('click');
  assert.equal($('raid-vitesses').hidden, true, 'les contrôles de vitesse sont apparus sur un vrai raid');
  // Et ils reviennent bien pour le simulateur : la garde n'est pas un mur.
  const b = ecranPret();
  b.$('raid-simuler').envoyer('click');
  assert.equal(b.$('raid-vitesses').hidden, false, 'le simulateur a perdu ses vitesses');
});

test('RDR T5 — « Réattaquer » n\'engage pas : il remet sur la cible', () => {
  // ⚠⚠ ETHAN, 06/09 : « bouton réattaquer remet sur la cible, pas d'attaque
  // instantané. » Il appelait `lancer(false)`.
  const { doc, etat, $ } = ecranPret();
  $('raid-attaquer').envoyer('click');
  doc.hidden = true;
  doc.envoyer('visibilitychange');
  assert.equal($('raid-fin').hidden, false, 'le montage n\'a pas de rapport à fermer');

  const rapportsApresRaid = etat.rapports.length;
  const pointsApresRaid = etat.attaque.points;

  $('raid-reattaquer').envoyer('click');

  // ⚠ L'OBSERVABLE EST LE RAPPORT, PAS LE PANNEAU. « les panneaux sont fermés »
  // passerait sur l'ancien code, qui les fermait avant de relancer :
  // `executerRaid` EMPILE un rapport et DÉPENSE des points, et ni l'un ni
  // l'autre ne bouge.
  assert.equal(etat.rapports.length, rapportsApresRaid, '« Réattaquer » a engagé un second raid');
  assert.equal(etat.attaque.points, pointsApresRaid, '« Réattaquer » a dépensé des points');
  // Et l'écran est en PRÉPARATION : le rapport est refermé, la barre du bas est
  // là, le bandeau du simulateur ne l'est pas.
  assert.equal($('raid-fin').hidden, true, 'le rapport est resté ouvert');
  assert.equal($('raid-bas').hidden, false, 'l\'écran n\'est pas revenu en préparation');
  assert.equal($('raid-bandeau').hidden, true, 'le bandeau SIMULATEUR est apparu');
});

test('RDR T6 — « Réattaquer » relit l\'état d\'APRÈS le raid, il ne rejoue pas la vue d\'avant', () => {
  // ⚠⚠ CE QUE CE TEST MESURE, ET POURQUOI CE N'EST PAS CE QUE LE BRIEF PROPOSAIT.
  // Il demandait que « les points d'attaque affichés au retour diffèrent » : cet
  // écran-ci n'affiche pas le SOLDE, il affiche le PRIX d'un raid, qui est
  // fonction de la distance et du niveau du site — donc que le raid ne change
  // pas. Écart déclaré au rapport.
  //
  // ⚠⚠ ET LA GRILLE DES VAGUES NE DISCRIMINE PAS NON PLUS — MESURÉ, ET C'EST LA
  // PREMIÈRE ÉCRITURE DE CE TEST QUI EST TOMBÉE. `lancer` repeint DÉJÀ les vagues
  // après le raid : l'armée abîmée est à l'écran avant même qu'on touche
  // « Réattaquer », si bien qu'un test qui la compterait passerait sur un écran
  // qui ne relit rien. Une falsification qui ne mord pas se vérifie avant d'être
  // crue.
  //
  // ⚠⚠ CE QUI DISCRIMINE EST LA SCÈNE. `ouvrirSurLaCible` rebâtit son aperçu par
  // `montageDuRaid(etat, siteDeLaCase(...))`, donc sur la défense TELLE QUE LE
  // RAID L'A LAISSÉE — mesuré : les trois défenseurs du camp survivent tous, mais
  // à 52 % de leurs PV, et `render/scene.js` peint une barre de vie dont la
  // LARGEUR est proportionnelle aux PV. Le nombre de primitives ne bouge pas ;
  // leurs arguments, si.
  const { doc, appels, etat, cible, ecran, $ } = ecranPret();

  const trace = () => appels.map((a) => `${a.nom}(${a.args.join(',')})`).join('|');
  const peintureDe = (geste) => { appels.length = 0; geste(); return trace(); };

  const avant = peintureDe(() => ecran.ouvrir(etat, cible, fauxAtlas()));
  assert.ok(avant.length > 0, 'le montage ne peint rien : il ne mesure aucune scène');
  // ⚠ LE MONTAGE PROUVE QUE LA DIFFÉRENCE N'EST PAS DU BRUIT : deux ouvertures
  // du MÊME état rendent la MÊME scène, au caractère près.
  assert.equal(peintureDe(() => ecran.ouvrir(etat, cible, fauxAtlas())), avant,
    'deux ouvertures du même état ne rendent pas la même scène : le témoin est instable');

  $('raid-attaquer').envoyer('click');
  doc.hidden = true;
  doc.envoyer('visibilitychange');
  assert.equal($('raid-fin').hidden, false, 'le montage n\'a pas de rapport à fermer');

  const apres = peintureDe(() => $('raid-reattaquer').envoyer('click'));
  assert.ok(apres.length > 0, '« Réattaquer » ne peint plus rien');
  assert.notEqual(apres, avant,
    '« Réattaquer » rejoue la scène d\'AVANT le raid : la cible n\'est pas relue');
});

test('RDR T7 — une cible s\'ouvre sur la DÉFENSE, à CHAQUE entrée', () => {
  // ⚠⚠ ETHAN, 06/09 : « ouverture de la cible : on voit la défense ennemie en
  // 1er. »
  const { etat, cible, ecran, $ } = ecranPret();
  const attendue = basculeDeBande(BANDE_A_L_OUVERTURE);
  assert.equal(BANDE_A_L_OUVERTURE, 'defense', 'la bande d\'ouverture n\'est plus la défense');
  assert.equal($('raid-bascule-bande').title, attendue.libelle,
    'la première cible ne s\'ouvre pas sur la défense');

  // ⚠ ON DÉFAIT AVANT DE REFAIRE : sans ce toucher, une valeur posée UNE FOIS au
  // câblage passerait le test. La bascule emmène sur l'autre bande.
  $('raid-bascule-bande').envoyer('click');
  assert.notEqual($('raid-bascule-bande').title, attendue.libelle,
    'la bascule n\'a pas changé de bande : le montage ne défait rien');

  // Une SECONDE entrée, sur une autre cible : elle doit s'ouvrir sur la défense.
  const autre = baseCourante(etat).satellites.presents
    .find((s) => s.rangee !== cible.rangee || s.colonne !== cible.colonne);
  assert.ok(autre !== undefined, 'le montage n\'a pas de seconde cible');
  ecran.ouvrir(etat, { rangee: autre.rangee, colonne: autre.colonne });
  assert.equal($('raid-bascule-bande').title, attendue.libelle,
    'la seconde cible ne s\'ouvre pas sur la défense');
});

test('RDR T8 — le niveau peint sur une vague vient de l\'aperçu, pas d\'un 1 en dur', () => {
  // ⚠⚠ ETHAN, 06/09 : « le niveau des unités offensives ne s'affiche pas dans
  // l'ui ». Il était dans le `title`, et un `title` ne s'ouvre pas au doigt.
  //
  // ⚠ LE MONTAGE MONTE UNE PIÈCE AU NIVEAU 3 : à niveau 1 partout, un « 1 »
  // écrit en dur passerait.
  const { doc, parId } = fauxDocumentRaid();
  const etat = partieArmee();
  baseCourante(etat).armee[0].niveau = 3;
  baseCourante(etat).armee[1].niveau = 7;
  const ecran = initialiserEcranRaid(doc);
  ecran.ouvrir(etat, premierCamp(etat), fauxAtlas());

  const cases = parId.get('raid-vagues').children
    .flatMap((v) => v.children).flatMap((r) => r.children);
  const occupees = cases.filter((c) => c.classList.contains('occupe'));
  assert.equal(occupees.length, baseCourante(etat).armee.length,
    'le montage ne peint pas toute l\'armée');
  const niveaux = occupees.map((c) => {
    const pastille = c.children.find((e) => e.classList.contains('niveau'));
    assert.ok(pastille !== undefined, 'une case occupée ne porte pas son niveau');
    return pastille.textContent;
  });
  assert.deepEqual(niveaux, baseCourante(etat).armee.map((p) => String(p.niveau)),
    'les niveaux peints ne sont pas ceux de l\'armée');
  // ⚠ ET UNE CASE VIDE N'EN PORTE PAS : la pastille n'est pas un décor de case.
  for (const vide of cases.filter((c) => !c.classList.contains('occupe'))) {
    assert.equal(vide.children.length, 0, 'une case vide porte une pastille de niveau');
  }
});
