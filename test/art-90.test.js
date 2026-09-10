// Le lot ART-90 — points 1 et 2 d'Ethan du 10/09/2026.
//
// Deux gestes d'art, et rien d'autre : le QG de défense et le Centre de
// commandement échangent leur dessin, et les vingt bâtiments passent tous à
// 90 % d'emprise. Aucune ligne de `src/sim/`, `src/ui/` ni `src/son/`.
//
// ⚠⚠ CE FICHIER GARDE LES DEUX PAR LES DEUX BOUTS — LES PIXELS ET LA SOURCE DE
// L'OUTIL. C'est la leçon du lot EMBLÈME-CENTRÉ, 06/09 : remettre `'bas'` y
// faisait tomber `EMB-C T1`, qui voit le décalage dans les PIXELS, ET `EMB-C
// T5`, qui le voit dans la SOURCE de l'outil. Un lot qui reviendrait à
// `cible(PV[…])` sans régénérer l'art ne ferait tomber que le second — et c'est
// très exactement le trou du 30/08, où six PNG d'emblème contredisaient l'outil
// qui les fabrique pendant que `npm run check` était vert.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ATLAS } from '../src/data/atlas.js';
import { SUFFIXE_ETAT_BATIMENT } from '../src/data/base.js';
import { decoderRgba } from './png-rgba.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES = join(RACINE, 'art', 'sources');
const SPRITES = join(RACINE, 'art', 'sprites', 'bâtiment');

const sha = (chemin) => createHash('sha256').update(readFileSync(chemin)).digest('hex');

// ---------------------------------------------------------------------------
// AR T1 — les huit dessins ont échangé, les quatre états compris
// ---------------------------------------------------------------------------

// ⚠⚠ LES QUATRE ÉTATS PARTENT ENSEMBLE, ET C'EST TOUT L'OBJET DE CE TEST.
// Permuter le seul état intact laisserait un bâtiment qui CHANGE D'IDENTITÉ EN
// BRÛLANT : le joueur poserait une coupole vitrée qui, sous le feu, deviendrait
// un plateau à tourelles. Les huit fichiers sont donc mesurés, pas les deux.
//
// ⚠⚠ ET LE TÉMOIN EST `art/sources/`, PAS `art/sprites/` — CE N'EST PAS UN
// CONFORT, C'EST LA SEULE MESURE QUI RESTE FALSIFIABLE. Le même lot
// ré-échantillonne les 162 sprites à 29 gros pixels : AUCUNE empreinte de
// sprite d'après n'égale une empreinte de sprite d'avant, permutation ou pas,
// donc un test bâti sur eux serait vert quoi qu'il arrive. Les sources, elles,
// ne sont pas touchées par le §2 du lot.
//
// Les huit empreintes sont celles relevées le 10/09 AVANT le lot, sur `main` =
// `14dd4ac`. Même nature que `TAILLES_D_AVANT` de `pictogramme.test.js` : c'est
// un relevé d'AVANT, et il ne se rafraîchit pas — le recapturer après coup
// ferait comparer un arbre à lui-même.
const AVANT = {
  bat_j_qg_de_defense: '07f466cdc54a2514debfe695b13edafd64c4e2752b3bc358991b61b867682b5b',
  bat_j_qg_de_defense_abime: '5246997138786152c046972a325956d5bf15306b5f299eaa0a8257cec63d99de',
  bat_j_qg_de_defense_tres_abime: 'b2a5c1acaba6f4c33e314feafcd32796cb6eeb643e2bea28868c640549b1970a',
  bat_j_qg_de_defense_detruit: '085e340812a5535bcdec7b7f78e3624f1ff192a5f12c9d21dcc3e4fa9476508f',
  bat_j_centre_de_commandement: 'a1a74daa5737f6b88e537e8ecc693885237df19ec0e0a5342b287c1ceb877ca6',
  bat_j_centre_de_commandement_abime: 'c204ab540b91190b23453c98bfa6c24f36feb1730369aa0de3e2706eed7a4611',
  bat_j_centre_de_commandement_tres_abime: 'd6ebe11de08f819a58933aa7e1b83d254a6a46abc172dd65f5154a669142282d',
  bat_j_centre_de_commandement_detruit: 'bf6e9dc5b07fd69f6cb17db258f6927adc3cc08a159f5846de45fb3af3b6b009',
};

// ⚠ LES QUATRE SUFFIXES SE LISENT DANS `src/data/base.js`, ILS NE SE RETAPENT
// PAS. `SUFFIXE_ETAT_BATIMENT` est la table que le rendu emploie ; en écrire une
// seconde ici la ferait diverger au premier état ajouté, et ce test garderait
// alors trois états sur quatre sans le dire — c'est-à-dire exactement la faute
// qu'il existe pour attraper.
const ETATS = Object.values(SUFFIXE_ETAT_BATIMENT);

test('AR T1 — le QG de défense et le Centre de commandement ont échangé leurs quatre états', () => {
  // ⚠ LE MONTAGE SE PROUVE AVANT DE MESURER. Les huit fichiers doivent exister
  // et le relevé d'avant doit en porter huit, sinon la boucle ci-dessous
  // passerait sur un dépôt amputé.
  assert.equal(Object.keys(AVANT).length, 8, 'le relevé d\'avant ne porte plus huit fichiers');
  assert.equal(new Set(Object.values(AVANT)).size, 8,
    'deux sources portaient la même empreinte AVANT le lot : le relevé est faux');

  const couples = [];
  for (const etat of ETATS) {
    const qg = `bat_j_qg_de_defense${etat}`;
    const cc = `bat_j_centre_de_commandement${etat}`;
    for (const nom of [qg, cc]) {
      const chemin = join(SOURCES, `${nom}.png`);
      assert.ok(existsSync(chemin), `${nom}.png : source absente de art/sources/`);
      assert.ok(AVANT[nom] !== undefined, `${nom} n'est pas dans le relevé d'avant`);
    }
    couples.push([qg, cc]);
  }
  assert.equal(couples.length, 4, 'les quatre états doivent être confrontés');

  // ⚠⚠ L'ÉCHANGE SE MESURE DANS LES DEUX SENS, ET LES DEUX SONT NÉCESSAIRES.
  // N'exiger qu'un sens laisserait passer une COPIE — le QG prenant le dessin du
  // Centre pendant que le Centre garde le sien.
  const croises = [];
  for (const [qg, cc] of couples) {
    if (sha(join(SOURCES, `${qg}.png`)) !== AVANT[cc]) croises.push(qg);
    if (sha(join(SOURCES, `${cc}.png`)) !== AVANT[qg]) croises.push(cc);
  }
  assert.deepEqual(croises, [],
    `sources non échangées : ${croises.join(', ')} — la permutation doit porter sur `
    + 'les QUATRE états, sinon le bâtiment change d\'identité en brûlant');

  // ⚠ ET L'ENSEMBLE DES HUIT EST INCHANGÉ : c'est ce qui dit qu'aucun dessin n'a
  // été perdu ni dupliqué en route. Une copie au lieu d'un échange ferait
  // apparaître une empreinte en double, donc un ensemble de sept.
  const apres = new Set(Object.keys(AVANT).map((n) => sha(join(SOURCES, `${n}.png`))));
  assert.deepEqual([...apres].sort(), [...new Set(Object.values(AVANT))].sort(),
    'l\'ensemble des huit empreintes a bougé : un dessin a été perdu ou dupliqué');
});

// ---------------------------------------------------------------------------
// AR T2 — les quatre-vingt-un sprites de bâtiment tiennent 29 gros pixels sur 32
// ---------------------------------------------------------------------------

// ⚠⚠ LE SEUIL D'ENCRE SE LIT DANS L'OUTIL, IL NE SE RETAPE PAS — même idiome que
// `test/embleme.test.js` depuis le lot EMBLÈME-CENTRÉ. `ecrire` de
// `tools/final128.py` coupe l'alpha sous `SEUIL_ALPHA` : ce qui survit à cette
// coupe est DESSINÉ à l'écran, et c'est donc là qu'est la frontière de l'encre.
//
// ⚠⚠ ET LE SEUIL DE 128 MENTIRAIT ICI, MESURÉ. À alpha ≥ 128 la boîte des
// quatre-vingt-un sprites s'écarte de sa cible de **0 à −3 pixels** sur les deux
// grilles ; au seuil de l'encre, de **0 à ±1**. Ce qui les sépare est mesuré, en
// grille 64 : **vingt sprites sur 81** ont une boîte plus large à l'encre qu'à
// 128 — de 1 px pour quinze, 2 pour quatre, 3 pour un. Ces pixels-là sont
// DESSINÉS, `ecrire` ne coupant qu'à `SEUIL_ALPHA` : c'est donc la mesure à 128
// qui serait fausse, pas le sprite. Sans cette ligne-ci, ce test tomberait sur
// une chaîne parfaitement juste.
const SEUIL_ENCRE = (() => {
  const src = readFileSync(join(RACINE, 'tools', 'final128.py'), 'utf8');
  const m = src.match(/^SEUIL_ALPHA\s*=\s*(\d+)/m);
  assert.ok(m, 'tools/final128.py ne porte plus SEUIL_ALPHA');
  return Number(m[1]);
})();

// ⚠⚠ L'EMPRISE SE LIT DANS `tools/joueur_v2.py`, OÙ ELLE EST DÉJÀ ÉCRITE. 90 %
// de 32 font 28,8 et les outils prennent un entier : c'est 29, et le nombre
// existait avant ce lot — les murs, les barrières et trois socles du joueur le
// portent depuis le lot SPRITES-V2-JOUEUR. Le retaper ici serait la seconde
// vérité que §4 de `CLAUDE.md` interdit.
const EMPRISE = (() => {
  const src = readFileSync(join(RACINE, 'tools', 'joueur_v2.py'), 'utf8');
  const m = src.match(/^EMPRISE_QUATRE_VINGT_DIX\s*=\s*(\d+)/m);
  assert.ok(m, 'tools/joueur_v2.py ne porte plus EMPRISE_QUATRE_VINGT_DIX');
  return Number(m[1]);
})();

// ⚠⚠ LA LISTE DES QUATRE-VINGT-UN SE DÉRIVE DE L'INDEX, ELLE NE S'ÉCRIT PAS.
// `src/data/atlas.js` est GÉNÉRÉ par `tools/atlas.py` et porte les
// quatre-vingt-trois noms de la famille : quatre-vingt-un bâtiments — vingt à
// quatre états, plus la vignette mixte — et les DEUX ruines, qui n'ont jamais
// été des bâtiments et sortent de `tools/ruines.py`. Le partage se fait sur le
// préfixe, et les deux comptes sont assertés : un sprite qui entre ou qui sort
// fait tomber ce test et oblige à décider, au lieu de glisser dans la boucle.
//
// ⚠ ET LES DEUX RUINES NE PRENNENT PAS 90 % — mesuré : leur boîte vaut 52 sur
// 64. Elles ne sont pas dans le périmètre d'Ethan (« les bâtiments »), leur
// producteur n'est pas touché par le lot, et les compter ferait tomber ce test
// sur un art que personne n'a demandé de changer.
const BATIMENTS = ATLAS.batiment.noms.filter((n) => n.startsWith('bat_'));
const PANACHE = 'bat_j_artillerie_anti_infanterie_tres_abime';
const RUINES = ATLAS.batiment.noms.filter((n) => !n.startsWith('bat_'));

function boiteDuSprite(grille, nom) {
  const { largeur, hauteur, pixels } = decoderRgba(join(SPRITES, String(grille), `${nom}.png`));
  let x0 = largeur; let y0 = hauteur; let x1 = -1; let y1 = -1;
  for (let y = 0; y < hauteur; y += 1) {
    for (let x = 0; x < largeur; x += 1) {
      if (pixels[(y * largeur + x) * 4 + 3] < SEUIL_ENCRE) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  assert.ok(x1 >= 0, `${nom} en ${grille} : pas un pixel d'encre`);
  return { largeur: x1 - x0 + 1, hauteur: y1 - y0 + 1, cote: largeur };
}

test('AR T2 — les 81 sprites de bâtiment prennent 90 % de la case sur les deux grilles', () => {
  assert.equal(BATIMENTS.length, 81,
    `${BATIMENTS.length} bâtiments dans l'index : vingt à quatre états plus la vignette mixte `
    + 'font 81 — un sprite est entré ou sorti, il faut décider');
  assert.deepEqual([...RUINES].sort(), ['ruine_j', 'ruine_o'],
    'la famille « batiment » ne porte plus exactement les deux ruines à côté des bâtiments');

  // ⚠ LE SEUIL EST CALCULÉ, PAS DEVINÉ : `EMPRISE` est en gros pixels d'une
  // grille de 32, donc 29 × 2 = 58 sur la grille 64 et 29 × 4 = 116 sur la 128.
  for (const grille of [64, 128]) {
    const vise = EMPRISE * (grille / 32);
    const fautifs = [];
    let justes = 0;
    for (const nom of BATIMENTS) {
      const b = boiteDuSprite(grille, nom);
      assert.equal(b.cote, grille, `${nom} : le sprite ne fait pas ${grille} pixels de côté`);
      const plusGrande = Math.max(b.largeur, b.hauteur);
      const tolere = (nom === PANACHE && grille === 128) ? 2 : 1;
      if (Math.abs(plusGrande - vise) > tolere) fautifs.push(`${nom} (${plusGrande} pour ${vise})`);
      if (nom === PANACHE) continue;
      if (plusGrande === vise) justes += 1;
    }
    assert.deepEqual(fautifs, [],
      `grille ${grille} : ${fautifs.length} sprite(s) hors de l'emprise visée — `
      + fautifs.slice(0, 6).join(', '));
    // ⚠ ET LA BORNE N'EST PAS LARGE : quatre-vingts sur quatre-vingts tombent
    // EXACTEMENT sur la cible, le ±1 n'est employé par personne aujourd'hui. Le
    // dire ici empêche qu'un lot futur s'installe dans la tolérance sans qu'on
    // le voie.
    assert.equal(justes, BATIMENTS.length - 1,
      `grille ${grille} : ${justes} sprites exactement à ${vise} sur ${BATIMENTS.length - 1} — `
      + 'la tolérance de ±1 a commencé à servir, il faut regarder pourquoi');
  }

  // ⚠⚠ UNE EXCEPTION SUR QUATRE-VINGT-UNE, ET ELLE EST MESURÉE PLUTÔT QU'ABSORBÉE
  // PAR UNE TOLÉRANCE PLUS LARGE. L'artillerie anti-infanterie TRÈS ABÎMÉE sort
  // à **57 sur 58** en grille 64 et à **114 sur 116** en grille 128 ; les
  // quatre-vingts autres tombent au pixel, sur les deux grilles.
  //
  // ⚠⚠ LA CAUSE EST L'ÉROSION DE `conditionner`, ET ELLE EST MESURÉE, PAS
  // SUPPOSÉE. `eroder(m, 3)` ronge trois pixels du masque DANS LA BOÎTE
  // RECADRÉE, qui fait ici 993 px : sur une silhouette pleine cela coûte moins
  // d'un demi-pixel de sortie, et les quatre-vingts autres n'en voient rien.
  // Ce dessin-là finit en PANACHE DE FUMÉE, large de **3 px** sur ses premières
  // lignes encrées — et même interrompu, certaines lignes rendant 0. Trois
  // érosions emportent donc **12 lignes de la source**, soit **1,55 px** de la
  // grille 128, que l'arrondi de la boîte porte à deux.
  //
  // ⚠ ELLE EST ASSERTÉE ENCORE NÉCESSAIRE — l'idiome de `DETTES_ACCENT`. Le jour
  // où le dessin ou l'érosion changeront, ce test tombera pour dire que
  // l'exception n'a plus lieu d'être, au lieu de la laisser dormir.
  //
  // ⚠⚠ ET ELLE NE PORTE QUE SUR LA GRILLE 128 — c'est la mesure qui le dit, pas
  // le confort. En grille 64 le même dessin sort à 57 pour 58 visés : il reste
  // DANS le ±1, donc la boucle ci-dessus l'accepte comme les autres et il n'y a
  // pas d'exception à écrire. Les douze lignes de source que l'érosion emporte
  // valent 0,77 px à cette échelle-là, et l'arrondi les ramène à un.
  for (const [grille, mesure, ecartAttendu] of [[64, 57, 1], [128, 114, 2]]) {
    const vise = EMPRISE * (grille / 32);
    const b = boiteDuSprite(grille, PANACHE);
    assert.equal(Math.max(b.largeur, b.hauteur), mesure,
      `${PANACHE} en ${grille} : la mesure du panache a bougé (visé ${vise})`);
    assert.equal(vise - mesure, ecartAttendu,
      `${PANACHE} en ${grille} : l'écart du panache a bougé — remesurer, `
      + 'et retirer l\'exception si elle n\'a plus lieu d\'être');
  }

  // ⚠⚠ FALSIFIABLE, ET C'EST LA MOITIÉ QUI COMPTE. La boucle ci-dessus mesure un
  // ÉCART à une cible ; elle resterait verte sur l'ancienne règle si quelqu'un
  // relâchait la tolérance en même temps qu'il remettait `cible(PV[…])`. Ce qui
  // ne peut PAS survivre à ce retour, c'est l'ÉGALITÉ des deux bouts de l'ancien
  // barème : la Raffinerie sortait à 16 gros pixels sur 32 — la moitié de la
  // case — et le Chantier à 28. Ils tiennent désormais la même place, au pixel.
  const chantier = boiteDuSprite(64, 'bat_j_chantier_de_construction');
  const raffinerie = boiteDuSprite(64, 'bat_j_raffinerie');
  assert.equal(Math.max(raffinerie.largeur, raffinerie.hauteur),
    Math.max(chantier.largeur, chantier.hauteur),
    'la Raffinerie et le Chantier ne tiennent plus la même place : l\'emprise dépend '
    + 'encore des PV, alors qu\'elle doit être la même pour les vingt bâtiments');

  // ⚠ ET 90 % SE DIT AUSSI EN CLAIR. 29 sur 32 font 90,6 % ; l'écart à la
  // consigne d'Ethan est de 0,2 gros pixel, et il est déclaré ici comme au
  // rapport. Une garde qui ne dirait que « les 81 sont d'accord entre eux »
  // resterait verte si les 81 tombaient ensemble à 50 %.
  assert.equal(Math.round((EMPRISE / 32) * 1000) / 10, 90.6,
    `emprise ${EMPRISE}/32 : ce n'est plus les 90 % du point 2 d'Ethan`);
});

// ---------------------------------------------------------------------------
// AR T3 — l'emprise ne se calcule plus depuis les PV, et l'outil le dit
// ---------------------------------------------------------------------------

test('AR T3 — batiments_v2.py lit l\'emprise au lieu de la dériver des PV', () => {
  const src = readFileSync(join(RACINE, 'tools', 'batiments_v2.py'), 'utf8');

  // ⚠ SANS COMMENTAIRES : le fichier EXPLIQUE d'où venait `cible(pv)` et
  // pourquoi elle est partie, donc une garde qui lirait le brut se déclencherait
  // sur sa propre prose. C'est la faute que `CLAUDE.md` §6 raconte cinq fois.
  const nu = src.replace(/^\s*#.*$/gm, '').replace(/"""[\s\S]*?"""/g, '');

  // Le filtre n'a pas tout mangé : le corps de `taches` doit encore être là.
  assert.ok(/def taches\(\)/.test(nu), 'le filtre de commentaires a mangé la source');

  assert.equal((nu.match(/cible\s*\(/g) ?? []).length, 0,
    'tools/batiments_v2.py appelle encore `cible(…)` : l\'emprise d\'un bâtiment '
    + 'ne se dérive plus de ses PV depuis le lot ART-90');
  assert.equal((nu.match(/EMPRISE_QUATRE_VINGT_DIX/g) ?? []).length, 3,
    'les DEUX emplois de l\'emprise plus son import doivent nommer '
    + 'EMPRISE_QUATRE_VINGT_DIX — un seul laisserait la vignette mixte ou les vingt '
    + 'bâtiments sur l\'ancienne courbe');

  // ⚠⚠ ET LA GARDE `if cle not in PV` RESTE, SA RAISON AYANT CHANGÉ. Elle ne
  // garde plus une emprise calculable — il n'y en a plus — mais que `BATIMENTS`
  // et `PV` parlent du même roster, ce que `test/donnees.test.js` confronte
  // ensuite à `src/data/base.js`. La retirer au motif que son motif apparent est
  // parti ôterait le garde-fou à l'instant précis où il devient invisible.
  assert.ok(/cle not in PV/.test(nu),
    'la garde « cle not in PV » a disparu : BATIMENTS et PV ne se confrontent plus');

  // ⚠⚠ ET LES QUATRE ÉTATS DE L'OUTIL SE CONFRONTENT ENFIN À CEUX DU JEU.
  // L'en-tête de `batiments_v2.py` affirme depuis le lot BÂTIMENTS-QUATRE-ÉTATS
  // que « `src/data/base.js` porte la même liste sous `SUFFIXE_ETAT_BATIMENT` —
  // un test confronte les deux plutôt que de les croire d'accord ». **Mesuré le
  // 10/09 : aucun test ne le faisait**, et rien n'aurait dit qu'un état ajouté
  // d'un côté manquait de l'autre. La phrase était vraie de l'intention et
  // fausse du dépôt ; elle le devient ici, à trois lignes de coût.
  const bloc = nu.match(/^ETATS\s*=\s*\[([^\]]*)\]/m);
  assert.ok(bloc, 'tools/batiments_v2.py ne porte plus la liste ETATS');
  const suffixes = [...bloc[1].matchAll(/'([^']*)'/g)].map((m) => m[1]);
  assert.deepEqual(suffixes, ETATS,
    'tools/batiments_v2.py et src/data/base.js ne nomment plus les mêmes états de '
    + 'bâtiment : un sprite manquerait sans qu\'un seul test le dise');
});
