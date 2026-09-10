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

import { SUFFIXE_ETAT_BATIMENT } from '../src/data/base.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES = join(RACINE, 'art', 'sources');

// ⚠ `ATLAS`, `decoderRgba` ET `SPRITES` SONT PARTIS AVEC `AR T2` au lot
// EMPRISES-ET-DÉLAI : ils ne servaient qu'à mesurer les boîtes, et `ED T1` les
// reprend. Un import qu'aucune ligne ne lit est la prochaine chose qui ment.
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
// AR T2 a déménagé — il est devenu `ED T1` au lot EMPRISES-ET-DÉLAI
// ---------------------------------------------------------------------------
//
// ⚠⚠ IL EXIGEAIT QUE LES QUATRE-VINGT-UN SPRITES PRENNENT TOUS 29 GROS PIXELS
// SUR 32, ET C'EST EXACTEMENT LA PROPRIÉTÉ QU'ETHAN A RENVERSÉE LE SOIR MÊME.
// « Passer tous les bâtiments collecteur et central etc à 85. Les autres 92 %.
// Chantier et souche 98 % » : il y a désormais TROIS paliers, et une garde qui
// en exige un seul ne mesure plus la règle du jeu.
//
// ⚠ IL N'EST NI SUPPRIMÉ NI ASSOUPLI : il est RETOURNÉ et relocalisé dans
// `test/emprises-et-delai.test.js` sous le nom `ED T1`, où il mesure les mêmes
// quatre-vingt-une boîtes contre le palier de CHACUN, reconduit nommément la
// tolérance du panache, et FALSIFIE l'ancienne règle de face — trois emprises
// distinctes exigées. C'est le précédent `EMB T6` → `EMB-C T1` du lot
// EMBLÈME-CENTRÉ, à la lettre.


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
  // ⚠⚠ CETTE ASSERTION EST RETOURNÉE AU LOT EMPRISES-ET-DÉLAI, ET ELLE ÉTAIT
  // DEVENUE UN PROXY MUET. Elle exigeait TROIS occurrences de
  // `EMPRISE_QUATRE_VINGT_DIX` — l'import plus les deux emplois — au motif qu'un
  // seul laisserait la vignette mixte ou les vingt bâtiments sur l'ancienne
  // courbe. Le lot du soir retire cet import : les bâtiments ont trois paliers à
  // eux, écrits ici, et la constante de `joueur_v2.py` reste aux unités.
  //
  // ⚠⚠ ET ELLE SERAIT RESTÉE VERTE EN NE MESURANT PLUS RIEN — MESURÉ, PAS
  // SUPPOSÉ. Le palier haut s'appelle `EMPRISE_QUATRE_VINGT_DIX_HUIT`, dont
  // l'ancien nom est un PRÉFIXE : le motif non borné en comptait trois
  // occurrences et rendait exactement 3, si bien que la garde passait au vert en
  // comptant une constante qu'elle ne nomme pas. Le motif borné, lui, en compte
  // ZÉRO. C'est le piège du préfixe que `MODULES-D` a déjà payé avec
  // `moduleDefense`, et `CLAUDE.md` §6 avec `jouer(` contre `rejouer(`.
  const borne = /EMPRISE_QUATRE_VINGT_DIX(?![\p{L}\p{N}_])/gu;
  assert.equal((nu.match(borne) ?? []).length, 0,
    'tools/batiments_v2.py lit de nouveau l\'emprise des UNITÉS : les bâtiments et '
    + 'les unités partageraient un nombre, et l\'une bougerait avec l\'autre en silence');
  // ⚠ ET L'APPÂT PROUVE QUE LE MOTIF BORNÉ VOIT ENCORE LA VRAIE FAUTE — sans
  // lui, un motif qui ne reconnaîtrait plus rien passerait aussi.
  assert.equal(('EMPRISE_QUATRE_VINGT_DIX = 29\nEMPRISE_QUATRE_VINGT_DIX_HUIT = 31'
    .match(borne) ?? []).length, 1,
  'le motif borné ne distingue plus la constante des unités de celle des bâtiments');
  // ⚠ ET LES DEUX EMPLOIS PASSENT DÉSORMAIS PAR LA TABLE DES PALIERS. Un seul
  // laisserait la vignette mixte ou les vingt bâtiments sur l'emprise unique —
  // c'est la moitié de l'ancienne assertion qui reste vraie, sous un autre nom.
  assert.equal((nu.match(/emprise_du_batiment\(/g) ?? []).length, 3,
    'les DEUX emplois de l\'emprise plus la définition doivent passer par '
    + '`emprise_du_batiment` — un seul laisserait un groupe sur l\'ancienne emprise');

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
