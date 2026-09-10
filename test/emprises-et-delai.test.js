// Le lot EMPRISES-ET-DÉLAI — arbitrages d'Ethan du 10/09/2026 au soir.
//
// Deux chantiers sans rapport l'un avec l'autre, et ce fichier les garde
// séparément : trois paliers d'emprise pour les bâtiments (`ED T1` à `ED T5`),
// et une courbe de délai de déplacement qui double tous les dix niveaux
// (`ED T6`, `ED T7`).
//
// ⚠⚠ LE PREMIER RENVERSE LE LOT DU MATIN MÊME. ART-90 avait mis les vingt
// bâtiments à une emprise unique de 29 gros pixels sur 32 — « ils doivent tous
// prendre 90% d'emprise » ; Ethan est revenu dessus le soir : « Passer tous les
// bâtiments collecteur et central etc à 85. Les autres 92 %. Chantier et souche
// 98 % », puis, la classification lui ayant été soumise ligne par ligne,
// « Emprise 3 palier ok ».
//
// ⚠⚠ LE SECOND RENVERSE RÈGLES-DE-CARTE, LUI AUSSI DU MATIN MÊME. Le délai était
// une droite — `60 + niveau + (distance − 1)` — dont le pire cas valait 1 h 59 ;
// Ethan a dicté le soir cinq ancrages qui DOUBLENT tous les dix niveaux, et un
// plancher : « 1 h 30 niv 10 distance 10 ; 3 h niv 20 d10 ; 6 h niv 30 d10 ;
// 12 h niv 40 d10 ; 24 h niv 50 d10 », puis « 1 h mini ».
//
// ⚠⚠ ET `AR T2` A DÉMÉNAGÉ ICI SOUS LE NOM `ED T1`, RETOURNÉ ET NON SUPPRIMÉ.
// Il exigeait que les quatre-vingt-un sprites prennent TOUS 29 : c'est
// exactement la propriété que l'arbitrage du soir renverse. C'est le précédent
// `EMB T6` → `EMB-C T1` du lot EMBLÈME-CENTRÉ, à la lettre — la garde suit la
// règle qu'elle mesure, et elle FALSIFIE l'ancienne de face.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

import { ATLAS } from '../src/data/atlas.js';
import { GEOGRAPHIE, DEPLACEMENT } from '../src/data/sites.js';
import { TICKS_PAR_HEURE } from '../src/sim/clock.js';
import { creerEtat } from '../src/sim/state.js';
import { baseCourante } from '../src/sim/base-courante.js';
import { niveauDesBatiments } from '../src/sim/niveau-de-base.js';
import { delaiDeplacementTicks } from '../src/sim/deplacement.js';
import { decoderRgba } from './png-rgba.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPRITES = join(RACINE, 'art', 'sprites', 'bâtiment');
const OUTIL = readFileSync(join(RACINE, 'tools', 'batiments_v2.py'), 'utf8');

/**
 * L'outil sans sa prose : docstring de module et lignes entièrement commentées.
 *
 * ⚠⚠ SANS ELLE, LA GARDE DE L'IMPORT LIT SA PROPRE EXPLICATION — ET ELLE L'A
 * FAIT, AU PREMIER JET. L'en-tête de `batiments_v2.py` nomme `tools/joueur_v2.py`
 * DEUX fois, dont une pour dire qu'on ne l'importe plus : un `includes` nu tombe
 * dessus, et le test accuse l'outil d'une faute qu'il ne commet pas. C'est la
 * dixième fois que ce dépôt paie cette faute-là, et c'est le test qui l'a dite.
 *
 * ⚠ ON NE RETIRE QUE LES LIGNES ENTIÈREMENT COMMENTÉES, comme
 * `sansCommentairesPython` de `test/son.test.js` : couper à tout croisillon
 * mangerait les clés `'#FF00FF'` que ces outils portent. Ce qui s'ajoute ici est
 * la DOCSTRING, que ce test-ci est le premier à devoir écarter.
 */
function sansProsePython(code) {
  const sansDoc = code.replace(/"""[\s\S]*?"""/, '');
  return sansDoc.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
}

// ---------------------------------------------------------------------------
// La table des paliers se LIT dans l'outil, elle ne se recopie pas
// ---------------------------------------------------------------------------
//
// ⚠⚠ RECOPIER LES VINGT LIGNES ICI FERAIT LA SECONDE VÉRITÉ QUE §4 DE
// `CLAUDE.md` INTERDIT, et elle serait muette : un bâtiment déplacé d'un palier
// à l'autre dans l'outil laisserait ce test vert sur l'ancienne classification,
// donc mesurerait la copie au lieu de mesurer l'art. On demande donc à Python de
// rendre la table qu'il APPLIQUE — le même idiome que `SEUIL_ENCRE` d'`AR T2`,
// poussé d'un cran : là on lisait un nombre au motif, ici on exécute la
// fonction.
//
// ⚠ ET C'EST `emprise_du_batiment` QU'ON APPELLE, PAS `EMPRISE_PAR_BATIMENT`.
// La table ne porte que les EXCEPTIONS ; c'est la fonction qui applique le
// défaut, et c'est donc elle qui dit ce qu'un bâtiment mesure vraiment.
const PALIERS = (() => {
  const src = 'import sys, json; sys.path.insert(0, "tools"); import batiments_v2 as b;'
    + ' print(json.dumps({c: b.emprise_du_batiment(c) for c in b.BATIMENTS}))';
  const out = execFileSync('python3', ['-c', src], { cwd: RACINE, encoding: 'utf8' });
  return JSON.parse(out);
})();

// Le seuil de l'encre se lit dans l'outil qui coupe — idiome d'`AR T2` et de
// `test/embleme.test.js`. Ce qui survit à `SEUIL_ALPHA` est DESSINÉ à l'écran,
// et c'est là qu'est la frontière de la boîte.
const SEUIL_ENCRE = (() => {
  const src = readFileSync(join(RACINE, 'tools', 'final128.py'), 'utf8');
  const m = src.match(/^SEUIL_ALPHA\s*=\s*(\d+)/m);
  assert.ok(m, 'tools/final128.py ne porte plus SEUIL_ALPHA');
  return Number(m[1]);
})();

const BATIMENTS = ATLAS.batiment.noms.filter((n) => n.startsWith('bat_'));
const RUINES = ATLAS.batiment.noms.filter((n) => !n.startsWith('bat_'));
const PANACHE = 'bat_j_artillerie_anti_infanterie_tres_abime';

/** La clé de bâtiment d'un nom de sprite : `bat_j_caserne_abime` → `caserne`. */
function cleDuSprite(nom) {
  const sans = nom.slice('bat_x_'.length);
  for (const suffixe of ['_tres_abime', '_abime', '_detruit']) {
    if (sans.endsWith(suffixe)) return sans.slice(0, -suffixe.length);
  }
  return sans;
}

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

// ---------------------------------------------------------------------------
// ED T1 — chaque sprite mesure l'emprise de SON palier (ex-`AR T2`, retourné)
// ---------------------------------------------------------------------------

test('ED T1 — les 81 sprites de bâtiment mesurent chacun l\'emprise de SON palier', () => {
  assert.equal(BATIMENTS.length, 81,
    `${BATIMENTS.length} bâtiments dans l'index : vingt à quatre états plus la vignette mixte `
    + 'font 81 — un sprite est entré ou sorti, il faut décider');
  assert.deepEqual([...RUINES].sort(), ['ruine_j', 'ruine_o'],
    'la famille « batiment » ne porte plus exactement les deux ruines à côté des bâtiments');

  // ⚠⚠ LA FALSIFICATION DE L'ANCIENNE RÈGLE, DE FACE. `AR T2` exigeait UNE
  // emprise pour les quatre-vingt-un ; sans cette ligne-ci, un retour silencieux
  // à la constante unique passerait — les deux `out.append` de `taches()`
  // reprendraient `EMPRISE_QUATRE_VINGT_DIX` et rien ne tomberait, puisque le
  // palier médian VAUT cette constante. C'est le cas que le brief nomme :
  // « laisser un seul des deux `out.append` sur la constante laisse tout un
  // groupe à 58 ».
  const distincts = new Set(Object.values(PALIERS));
  assert.equal(distincts.size, 3,
    `les bâtiments ne portent plus que ${distincts.size} emprise(s) distincte(s) : `
    + 'le lot est revenu à une emprise unique');
  assert.deepEqual([...distincts].sort((a, b) => a - b), [27, 29, 31],
    'les trois paliers ne sont plus 85 %, 92 % et 98 % de 32 gros pixels');

  for (const grille of [64, 128]) {
    const facteur = grille / 32;
    const fautifs = [];
    let justes = 0;
    for (const nom of BATIMENTS) {
      const cle = cleDuSprite(nom);
      // ⚠ LA VIGNETTE MIXTE N'EST PAS UN BÂTIMENT : elle EMPRUNTE l'emprise du
      // collecteur qu'elle représente, et `ED T3` mesure cet emprunt.
      const palier = PALIERS[cle] ?? PALIERS.collecteur_quartz;
      assert.ok(palier, `${nom} : aucun palier pour la clé « ${cle} »`);
      const vise = palier * facteur;
      const b = boiteDuSprite(grille, nom);
      assert.equal(b.cote, grille, `${nom} : le sprite ne fait pas ${grille} pixels de côté`);
      const plusGrande = Math.max(b.largeur, b.hauteur);
      const tolere = (nom === PANACHE && grille === 128) ? 2 : 1;
      if (Math.abs(plusGrande - vise) > tolere) fautifs.push(`${nom} (${plusGrande} pour ${vise})`);
      if (nom === PANACHE) continue;
      if (plusGrande === vise) justes += 1;
    }
    assert.deepEqual(fautifs, [],
      `grille ${grille} : ${fautifs.length} sprite(s) hors de l'emprise de leur palier — `
      + fautifs.slice(0, 6).join(', '));
    // ⚠ ET LA BORNE N'EST PAS LARGE : quatre-vingts sur quatre-vingts tombent
    // EXACTEMENT sur leur cible, le ±1 n'est employé par personne. Mesuré au lot
    // EMPRISES-ET-DÉLAI comme il l'était à ART-90 : les paliers ont changé, la
    // précision de la chaîne non.
    assert.equal(justes, BATIMENTS.length - 1,
      `grille ${grille} : ${justes} sprites exactement sur leur palier sur ${BATIMENTS.length - 1} — `
      + 'la tolérance de ±1 a commencé à servir, il faut regarder pourquoi');
  }

  // ⚠⚠ LES TROIS PALIERS SE VOIENT DANS LES PIXELS, ET PAS SEULEMENT DANS LA
  // TABLE. Sans cette moitié-ci, un lot qui aurait changé la table SANS
  // régénérer l'art passerait — c'est le trou du 30/08, où six PNG d'emblème
  // contredisaient l'outil qui les fabrique pendant que `npm run check` était
  // vert. On mesure donc un représentant de chaque palier, en 64.
  assert.equal(Math.max(...Object.values(boiteDuSprite(64, 'bat_j_chantier_de_construction'))
    .slice(0, 2)), 62, 'le Chantier ne prend plus 98 % de sa case');
  const b27 = boiteDuSprite(64, 'bat_j_collecteur_quartz');
  assert.equal(Math.max(b27.largeur, b27.hauteur), 54, 'le Collecteur ne prend plus 85 %');
  const b29 = boiteDuSprite(64, 'bat_j_caserne');
  assert.equal(Math.max(b29.largeur, b29.hauteur), 58, 'la Caserne ne prend plus 92 %');

  // ⚠⚠ UNE EXCEPTION SUR QUATRE-VINGT-UNE, RECONDUITE NOMMÉMENT ET REMESURÉE —
  // ET ELLE EST ENCORE NÉCESSAIRE, ce qui est la moitié qui compte. L'artillerie
  // anti-infanterie TRÈS ABÎMÉE sort à **57 sur 58** en grille 64 et à **114 sur
  // 116** en 128, EXACTEMENT comme à ART-90 : son palier n'a pas bougé — elle est
  // au 92 %, celui qui vaut encore 29 — donc son dessin n'a pas été retouché.
  //
  // ⚠⚠ LA CAUSE EST L'ÉROSION, PAS L'ARRONDI, ET C'EST CE QUI EXPLIQUE QU'ELLE
  // SURVIVE AU CHANGEMENT DE PALIER. `eroder(m, 3)` de `conditionner` ronge trois
  // pixels du masque dans la boîte recadrée ; ce dessin-là finit en PANACHE DE
  // FUMÉE large de 3 px sur ses premières lignes encrées, et même interrompu, si
  // bien que l'érosion emporte douze lignes de la source. Un changement
  // d'emprise ne touche pas à ça.
  //
  // ⚠ ELLE EST ASSERTÉE ENCORE NÉCESSAIRE — l'idiome de `DETTES_ACCENT`. Le jour
  // où le dessin ou l'érosion changeront, ce test tombera pour dire que
  // l'exception n'a plus lieu d'être, au lieu de la laisser dormir.
  assert.equal(PALIERS.artillerie_anti_infanterie, 29,
    'le panache a changé de palier : sa mesure est à refaire avant de la reconduire');
  for (const [grille, mesure, ecartAttendu] of [[64, 57, 1], [128, 114, 2]]) {
    const vise = PALIERS.artillerie_anti_infanterie * (grille / 32);
    const b = boiteDuSprite(grille, PANACHE);
    assert.equal(Math.max(b.largeur, b.hauteur), mesure,
      `${PANACHE} en ${grille} : la mesure du panache a bougé (visé ${vise})`);
    assert.equal(vise - mesure, ecartAttendu,
      `${PANACHE} en ${grille} : l'exception n'est plus nécessaire — la retirer`);
  }
});

// ---------------------------------------------------------------------------
// ED T2 — trois paliers, un défaut, et aucune clé mal orthographiée
// ---------------------------------------------------------------------------

test('ED T2 — les trois paliers sont deux à deux différents, et le défaut est le 92 %', () => {
  // ⚠ LES TROIS VALEURS SONT LES ARRONDIS DES POURCENTAGES D'ETHAN, et l'écart
  // se déclare : 98 % de 32 font 31,36 → 31 ; 92 % font 29,44 → 29 ; 85 % font
  // 27,2 → 27. Les trois sont sous le demi-gros pixel.
  for (const [pourcent, palier] of [[98, 31], [92, 29], [85, 27]]) {
    assert.equal(Math.floor((pourcent * 32) / 100), palier,
      `${pourcent} % de 32 ne rend plus ${palier} gros pixels`);
  }

  // ⚠⚠ LA TABLE NE PORTE QUE DES CLÉS DU ROSTER, ET C'EST LA GARDE ANTI-COQUILLE.
  // `collecteur_scorries` ne serait jamais lu : le collecteur resterait
  // silencieusement au palier par défaut, et rien ne lèverait — c'est le défaut
  // lui-même qui rend la faute muette. L'outil refuse donc une clé inconnue, et
  // ce test le vérifie en lui en donnant une.
  // ⚠⚠ LA GARDE ANTI-COQUILLE S'EXERCE, ELLE NE SE LIT PAS. On donne à l'outil
  // une clé mal orthographiée et on exige qu'il LÈVE en la nommant : sans ça,
  // `collecteur_scorries` ne serait jamais lu, le collecteur resterait au palier
  // par défaut, et rien ne le dirait — c'est le défaut lui-même qui rend la
  // faute muette.
  const coquille = 'import sys; sys.path.insert(0, "tools"); import batiments_v2 as b;'
    + ' b.EMPRISE_PAR_BATIMENT["collecteur_scorries"] = 27;'
    + ' b.emprise_du_batiment("caserne")';
  assert.throws(() => execFileSync('python3', ['-c', coquille],
    { cwd: RACINE, encoding: 'utf8', stdio: 'pipe' }),
  /collecteur_scorries/,
  'une clé mal orthographiée passe en silence : son bâtiment irait au palier par défaut');

  const roster = new Set(Object.keys(PALIERS));
  const src = 'import sys, json; sys.path.insert(0, "tools"); import batiments_v2 as b;'
    + ' print(json.dumps(sorted(b.EMPRISE_PAR_BATIMENT)))';
  const nommees = JSON.parse(execFileSync('python3', ['-c', src],
    { cwd: RACINE, encoding: 'utf8' }));
  for (const cle of nommees) {
    assert.ok(roster.has(cle),
      `EMPRISE_PAR_BATIMENT nomme « ${cle} », qui n'est pas un bâtiment du roster`);
  }

  // ⚠ ET LA TABLE NE PORTE QUE LES EXCEPTIONS : y inscrire un bâtiment au défaut
  // ferait une ligne qui ne dit rien et qui survivrait à un changement de défaut.
  for (const cle of nommees) {
    assert.notEqual(PALIERS[cle], 29,
      `EMPRISE_PAR_BATIMENT nomme « ${cle} » au palier par défaut : la ligne ne dit rien`);
  }

  // ⚠⚠ LE DÉFAUT EST BIEN LE 92 %, ET ON LE MESURE PAR CE QUI N'EST PAS NOMMÉ.
  // Un vingt-et-unième bâtiment ajouté demain doit prendre 29 sans que personne
  // ne l'inscrive : c'est le palier qu'Ethan désigne par « les autres ».
  const muets = Object.keys(PALIERS).filter((c) => !nommees.includes(c));
  assert.ok(muets.length > 0, 'tous les bâtiments sont nommés : il n\'y a plus de défaut à mesurer');
  for (const cle of muets) {
    assert.equal(PALIERS[cle], 29, `« ${cle} » n'est pas nommé et ne prend pas le défaut de 92 %`);
  }

  // La classification d'Ethan, ligne par ligne — c'est ce qu'il a validé.
  assert.deepEqual(Object.keys(PALIERS).filter((c) => PALIERS[c] === 31).sort(),
    ['chantier_de_construction', 'souche'],
    'le palier 98 % n\'est plus exactement le Chantier et la Souche');
  assert.deepEqual(Object.keys(PALIERS).filter((c) => PALIERS[c] === 27).sort(),
    ['accumulateur', 'centrale', 'collecteur_quartz', 'collecteur_scorie',
      'gangue', 'noeud', 'raffinerie', 'terril'],
    'le palier 85 % n\'est plus exactement la chaîne des ressources et ses entrepôts');
  // ⚠ CASERNE, DÉPÔT ET AÉRODROME SONT AUX « AUTRES », et c'est le choix soumis
  // à Ethan puis validé : ils produisent des UNITÉS, pas des ressources.
  for (const cle of ['caserne', 'depot_de_vehicules', 'aerodrome']) {
    assert.equal(PALIERS[cle], 29,
      `« ${cle} » est passé au palier de l'économie : il produit des unités, pas des ressources`);
  }

  // ⚠⚠ ET LA CONSTANTE DES UNITÉS N'EST PLUS LUE PAR L'OUTIL DES BÂTIMENTS.
  // `EMPRISE_QUATRE_VINGT_DIX` de `tools/joueur_v2.py` vaut 29 et sert les murs,
  // les barrières et les socles d'artillerie — qu'Ethan a nommément exclus,
  // « seulement bâtiment, pas unités ». La partager ferait bouger quatorze unités
  // le jour où il règle le palier des collecteurs, et **aucun test ne le dirait**
  // puisque les deux nombres sont égaux.
  const nu = sansProsePython(OUTIL);
  // ⚠ LE TÉMOIN D'ABORD : le filtre ne doit pas avoir tout mangé, sinon la garde
  // ci-dessous serait verte sur n'importe quoi.
  assert.match(nu, /^from final128 import /m,
    'le décommentage a mangé les imports : la garde ci-dessous ne mesure plus rien');
  assert.ok(!/^\s*(from\s+joueur_v2\s|import\s+joueur_v2)/m.test(nu),
    'tools/batiments_v2.py importe de nouveau `joueur_v2` : les bâtiments et les unités '
    + 'partagent une emprise, donc l\'une bougera avec l\'autre en silence');
  // ⚠ ET L'APPÂT, DANS L'AUTRE SENS : le motif reconnaît encore la vraie faute.
  assert.ok(/^\s*(from\s+joueur_v2\s|import\s+joueur_v2)/m
    .test('from joueur_v2 import EMPRISE_QUATRE_VINGT_DIX  # noqa: E402'),
    'le motif de la garde ne reconnaît plus un import de `joueur_v2`');
});

// ---------------------------------------------------------------------------
// ED T3 — la vignette mixte hérite de ce qu'elle représente
// ---------------------------------------------------------------------------

test('ED T3 — la vignette du collecteur mixte porte l\'emprise du collecteur, pas un nombre', () => {
  // ⚠⚠ ON COMPARE LES DEUX SORTIES, JAMAIS L'UNE À UN NOMBRE. Écrire 27 ici
  // passerait aujourd'hui et se tairait le jour où Ethan règle le palier de
  // l'économie : la palette montrerait une icône à une échelle que plus aucun
  // collecteur ne pose. C'est ce que le brief demande en toutes lettres.
  const src = 'import sys, json; sys.path.insert(0, "tools"); import batiments_v2 as b;'
    + ' print(json.dumps({n: e for n, _, e, _ in b.taches()}))';
  const emprises = JSON.parse(execFileSync('python3', ['-c', src],
    { cwd: RACINE, encoding: 'utf8' }));
  assert.equal(emprises.bat_j_collecteur_mixte, emprises.bat_j_collecteur_quartz,
    'la vignette mixte n\'emprunte plus l\'emprise du collecteur qu\'elle représente');

  // ⚠ ET LE MONTAGE DISCRIMINE : le collecteur n'est PAS au palier par défaut.
  // Sans cette ligne, l'égalité ci-dessus serait vraie d'une vignette figée à 29
  // à côté d'un collecteur qui vaudrait 29 lui aussi.
  assert.notEqual(emprises.bat_j_collecteur_quartz, 29,
    'le montage ne mesure rien : le collecteur est au palier par défaut');

  // ⚠⚠ ET L'ÉGALITÉ NE SUFFIT PAS — MESURÉ, ET C'EST LA FALSIFICATION QUI L'A
  // DIT. Écrire `27` EN DUR dans `taches()` laisse les deux sorties égales,
  // puisque 27 est justement le palier du collecteur AUJOURD'HUI : la
  // falsification ne mordait pas. Le brief posait que comparer les deux sorties
  // protégeait du nombre en dur ; **il protège du mauvais nombre, pas du bon**.
  //
  // ⚠⚠ CE QUI L'ATTRAPE EST DE BOUGER LE PALIER DU COLLECTEUR ET DE VÉRIFIER QUE
  // LA VIGNETTE SUIT. On monte donc un `EMPRISE_PAR_BATIMENT` forgé, dans le
  // processus Python et pour ce seul appel — l'idiome de `F-J T5`, qui monte un
  // `parVoisin` à la main plutôt que de sauter le test.
  const forge = 'import sys, json; sys.path.insert(0, "tools"); import batiments_v2 as b;'
    + ' b.EMPRISE_PAR_BATIMENT["collecteur_quartz"] = 21;'
    + ' print(json.dumps({n: e for n, _, e, _ in b.taches()}))';
  const bouge = JSON.parse(execFileSync('python3', ['-c', forge],
    { cwd: RACINE, encoding: 'utf8' }));
  assert.equal(bouge.bat_j_collecteur_quartz, 21, 'le montage forgé n\'a pas pris');
  assert.equal(bouge.bat_j_collecteur_mixte, 21,
    'la vignette mixte porte un nombre ÉCRIT EN DUR : elle ne suit plus le collecteur '
    + 'qu\'elle représente, et se taira au premier réglage du palier de l\'économie');

  // ⚠ ET L'EMPRUNT SE VOIT DANS LES PIXELS, pas seulement dans la table.
  const vignette = boiteDuSprite(64, 'bat_j_collecteur_mixte');
  const collecteur = boiteDuSprite(64, 'bat_j_collecteur_quartz');
  assert.equal(Math.max(vignette.largeur, vignette.hauteur),
    Math.max(collecteur.largeur, collecteur.hauteur),
    'à l\'écran, la vignette n\'est plus à l\'échelle de ce qu\'elle pose');

  // ⚠ LA GARDE DU RENVOI RESTE, ET SA RAISON EST REDEVENUE DOUBLE : elle gardait
  // que la vignette renvoie encore à un bâtiment ; elle garde de nouveau la
  // LISIBILITÉ du palier, un renvoi cassé rendant une emprise inventée.
  assert.match(OUTIL, /if emprunte not in PV:/,
    'la garde du renvoi de la vignette a disparu de `taches`');
});

// ---------------------------------------------------------------------------
// ED T4 — les deux ruines suivent le Chantier et la Souche
// ---------------------------------------------------------------------------

test('ED T4 — les deux ruines mesurent 98 %, et le nombre vient d\'une seule écriture', () => {
  // ⚠⚠ ETHAN, 10/09 : « Les ruines doivent suivre les bâtiments ». Au palier
  // HAUT et non au défaut, et la raison est de jeu : une ruine remplace à l'écran
  // une base RASÉE TOUT ENTIÈRE. Plus petite que le bâtiment central qu'elle
  // recouvre, elle se lirait comme un rétrécissement du site.
  for (const grille of [64, 128]) {
    const vise = PALIERS.chantier_de_construction * (grille / 32);
    for (const nom of RUINES) {
      const b = boiteDuSprite(grille, nom);
      assert.equal(Math.max(b.largeur, b.hauteur), vise,
        `${nom} en ${grille} : la ruine ne suit plus le palier du Chantier`);
    }
  }

  // ⚠⚠ ET LE NOMBRE NE SE RECOPIE PAS : IL S'IMPORTE. Deux `31` écrits dans deux
  // fichiers sont deux occasions de diverger, et celle-là serait MUETTE — la
  // ruine rétrécirait sous le Chantier sans qu'un test le dise, les deux mesures
  // étant faites séparément. `ruines.py` LIT le palier de `batiments_v2.py`.
  const ruines = readFileSync(join(RACINE, 'tools', 'ruines.py'), 'utf8');
  assert.match(ruines, /from batiments_v2 import EMPRISE_QUATRE_VINGT_DIX_HUIT/,
    'tools/ruines.py n\'importe plus le palier : il en porte une seconde écriture');
  assert.ok(!/recadrer\(cell,\s*\d+\s*\*/.test(ruines),
    'tools/ruines.py a repris un nombre écrit en dur dans son appel à `recadrer`');

  // ⚠ ET LA DÉFINITION EST UNIQUE DANS TOUT `tools/` — c'est ce que « une seule
  // écriture » veut dire, et un `grep` le mesure au lieu de le supposer.
  const outils = execFileSync('grep',
    ['-rn', '^EMPRISE_QUATRE_VINGT_DIX_HUIT', 'tools/'],
    { cwd: RACINE, encoding: 'utf8' }).trim().split('\n');
  assert.equal(outils.length, 1,
    `le palier 98 % est défini ${outils.length} fois dans tools/ : ${outils.join(' | ')}`);
});

// ---------------------------------------------------------------------------
// ED T5 — l'atlas au dépôt est celui que la chaîne produit
// ---------------------------------------------------------------------------

test('ED T5 — la famille « batiment » est cousue à partir des sprites d\'aujourd\'hui', () => {
  // ⚠⚠ CE N'EST PAS UNE GARDE NEUVE, ET C'EST VOLONTAIRE. « sprite — l'atlas
  // cousu répond des sprites d'aujourd'hui » de `test/sprite.test.js` fait déjà
  // ce travail, et c'est elle qui a servi à ART-90 : le piège du lot est de
  // régénérer les PNG SANS recoudre, auquel cas `dist/index.html` ne bouge pas
  // d'un octet — `tools/build.js` n'inline pas les PNG, il inline les atlas.
  // Ce test-ci ne la réécrit pas : il vérifie que le manifeste qu'elle lit décrit
  // bien l'art de ce lot, et il NOMME l'autre garde pour qu'on la retrouve.
  //
  // ⚠ ET IL N'APPELLE PAS `atlas.py` : `CLAUDE.md` §3 interdit une dépendance
  // Python dans `npm run check`. Ce qu'on lit est le manifeste commité.
  const manifeste = JSON.parse(readFileSync(
    join(RACINE, 'art', 'sprites', 'atlas-empreintes.json'), 'utf8'));
  const famille = manifeste.familles.batiment;
  assert.ok(famille, 'atlas-empreintes.json ne décrit plus la famille « batiment »');
  assert.equal(Object.keys(famille.sprites).length, BATIMENTS.length + RUINES.length,
    'le manifeste ne décrit plus les 83 sprites de la famille');

  // ⚠ ET LE MANIFESTE DÉCRIT LE FICHIER RETENU, pas celui qu'on vient de coudre —
  // règle posée au lot PICTOGRAMMES. On le confronte donc au disque.
  const sur = (chemin) => createHash('sha256')
    .update(readFileSync(chemin)).digest('hex');
  assert.equal(sur(join(RACINE, 'art', 'sprites', 'atlas-batiment-128.webp')),
    famille.atlas,
    'l\'atlas `batiment` du dépôt n\'est pas celui que le manifeste décrit — '
    + 'relancer `python3 tools/atlas.py --ecrire --forcer batiment`');
});

// ---------------------------------------------------------------------------
// ED T6 — la table du délai tombe juste, ligne par ligne
// ---------------------------------------------------------------------------

/**
 * Une base dont les bâtiments rendent EXACTEMENT `dixiemes` de niveau moyen.
 * Copie de contrat du montage de `test/deplacement.test.js` : dix bâtiments,
 * dont `dixiemes % 10` au niveau supérieur.
 */
function baseAuNiveau(etat, dixiemes) {
  const laBase = baseCourante(etat);
  const entier = Math.floor(dixiemes / 10);
  const hauts = dixiemes % 10;
  laBase.disposition.length = 0;
  laBase.economie.residus.length = 0;
  for (let i = 0; i < 10; i += 1) {
    laBase.disposition.push({
      id: i === 0 ? 'chantierDeConstruction' : 'accumulateur',
      rangee: 11 + Math.floor(i / 9), colonne: 1 + (i % 9),
      niveau: i < hauts ? entier + 1 : entier, degatsMilli: 0,
    });
    laBase.economie.residus.push({ quartz: 0, scorie: 0, electricite: 0 });
  }
  assert.equal(niveauDesBatiments(laBase.disposition), dixiemes,
    `le montage ne pose pas le niveau ${dixiemes / 10}`);
  return etat;
}

/** Des ticks vers les dixièmes de minute — exact : un dixième vaut 60 ticks. */
const enDixiemes = (ticks) => (ticks * 600) / TICKS_PAR_HEURE;

test('ED T6 — les onze lignes de contrôle du barème tombent juste', () => {
  // ⚠⚠ LES CINQ ANCRAGES D'ETHAN, SES TROIS CONTRÔLES AU NIVEAU 10, SON PLANCHER,
  // ET DEUX LIGNES QUI ATTRAPENT CE QUE LES AUTRES NE VOIENT PAS. Le calcul se
  // fait entièrement en entiers ; on remonte des ticks aux dixièmes de minute,
  // ce qui est EXACT — un dixième de minute vaut six secondes, donc soixante
  // ticks à 10 Hz.
  const table = [
    // [dixièmes de niveau, distance, dixièmes de minute attendus, libellé]
    [10, 10, 600, '1 h 00 — le plancher, et la distance y est GRATUITE'],
    [100, 1, 630, '1 h 03'],
    [100, 5, 750, '1 h 15'],
    [100, 10, 900, '1 h 30'],
    [86, 1, 622, '1 h 02,2'],
    [200, 1, 720, '1 h 12'],
    [200, 10, 1800, '3 h 00'],
    [300, 10, 3600, '6 h 00'],
    [400, 10, 7200, '12 h 00'],
    [500, 1, 1980, '3 h 18'],
    [500, 10, 14400, '24 h 00'],
  ];
  for (const [dixiemes, distance, attendu, libelle] of table) {
    const ticks = delaiDeplacementTicks(baseAuNiveau(creerEtat(7), dixiemes), distance);
    assert.equal(ticks * 600, attendu * TICKS_PAR_HEURE,
      `niveau ${dixiemes / 10}, distance ${distance} : ${libelle} attendu, `
      + `${enDixiemes(ticks)} dixièmes rendus`);
  }

  // ⚠⚠ LA LIGNE 8,6 EST CELLE QUI COMPTE, ET LE CHEMIN SE REFAIT ICI PLUTÔT QUE
  // DE SE RECOPIER. C'est la seule des onze qui tombe si les dixièmes sont lus
  // comme des niveaux entiers, ET la seule qui tombe si l'interpolation est
  // oubliée. Le chemin complet : plafond(8) = 783, plafond(9) = 840, donc
  // plafond(8,6) = 783 + arrondi(57 × 6 / 10) = **817** ; puis
  // 600 + arrondi((817 − 600) × 1 / 10) = **622**.
  const plafonds = DEPLACEMENT.delai.plafondsParNiveau;
  const plancher = DEPLACEMENT.delai.plancherDixiemesDeMinute;
  assert.equal(plafonds[7], 783, 'le plafond du niveau 8 a bougé');
  assert.equal(plafonds[8], 840, 'le plafond du niveau 9 a bougé');
  const interpole = plafonds[7] + Math.round(((plafonds[8] - plafonds[7]) * 6) / 10);
  assert.equal(interpole, 817, 'l\'interpolation du niveau 8,6 ne rend plus 817');
  assert.equal(plancher + Math.round(((interpole - plancher) * 1) / 10), 622,
    'le chemin refait à la main ne rend plus 622 : le test ou le module a tort');

  // ⚠ ET LES FALSIFICATIONS DES DEUX LECTURES FAUSSES, DE FACE.
  const a86 = enDixiemes(delaiDeplacementTicks(baseAuNiveau(creerEtat(7), 86), 1));
  const a80 = enDixiemes(delaiDeplacementTicks(baseAuNiveau(creerEtat(7), 80), 1));
  const a90 = enDixiemes(delaiDeplacementTicks(baseAuNiveau(creerEtat(7), 90), 1));
  assert.notEqual(a86, a80, 'le niveau 8,6 est arrondi vers le bas : l\'interpolation est perdue');
  assert.notEqual(a86, a90, 'le niveau 8,6 est arrondi vers le haut : l\'interpolation est perdue');
  assert.ok(a80 < a86 && a86 < a90, 'le niveau 8,6 ne tombe plus ENTRE ses deux voisins');

  // ⚠⚠ LES CINQ ANCRAGES SONT UN DOUBLEMENT, ET C'EST LA FORME QU'ETHAN A DICTÉE.
  for (const [niveau, heures] of [[10, 1.5], [20, 3], [30, 6], [40, 12], [50, 24]]) {
    assert.equal(plafonds[niveau - 1], heures * 600,
      `le plafond du niveau ${niveau} ne vaut plus ${heures} h`);
  }
  for (const niveau of [20, 30, 40, 50]) {
    assert.equal(plafonds[niveau - 1], 2 * plafonds[niveau - 11],
      `le niveau ${niveau} ne vaut plus le double du niveau ${niveau - 10}`);
  }

  // ⚠⚠ LA TABLE A EXACTEMENT UN PLAFOND PAR NIVEAU, ET C'EST UN FAIT VÉRIFIABLE.
  // Sans cette ligne, le jour où `niveauPlafond` monte, l'interpolation lirait la
  // table hors de ses bornes et rendrait `NaN` — c'est-à-dire un délai qui ne
  // LÈVE pas et qui déverrouille le déplacement.
  assert.equal(plafonds.length, GEOGRAPHIE.niveauPlafond,
    'la table des plafonds n\'a plus un plafond par niveau');
  for (const p of plafonds) assert.ok(Number.isInteger(p), `${p} n'est pas un entier`);

  // ⚠⚠ ET AUCUN `Math.pow` N'ENTRE DANS LE MOTEUR : la durée va dans la
  // SAUVEGARDE, et `2 ^ 0,1` n'est pas garanti bit à bit d'un moteur JavaScript à
  // l'autre. ⚠ Le risque est mesuré, pas craint : `plafond(8)` vaut 783,4955, à
  // quatre millièmes d'une bascule d'arrondi.
  const moteur = readFileSync(join(RACINE, 'src', 'sim', 'deplacement.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/Math\.pow|\*\*/.test(moteur),
    'src/sim/deplacement.js calcule une puissance : la durée entrerait dans la '
    + 'sauvegarde avec un dernier bit qui dépend du navigateur');
  assert.ok(Math.abs(900 * (2 ** (-0.2)) - 783.5) < 0.005,
    'le plafond du niveau 8 n\'est plus à quatre millièmes d\'une bascule d\'arrondi : '
    + 'la mesure qui justifie la table a changé');
});

// ---------------------------------------------------------------------------
// ED T7 — monotone sur les deux axes, et le plancher tient
// ---------------------------------------------------------------------------

test('ED T7 — le délai croît avec le niveau ET avec la distance, sans jamais passer sous 1 h', () => {
  // ⚠⚠ CINQ MILLE POINTS, ET C'EST LA SEULE FAÇON DE VOIR UN ARRONDI MAL POSÉ.
  // Une table de onze lignes ne dit rien de ce qui se passe entre elles : un
  // `Math.round` appliqué au mauvais endroit rend la courbe localement
  // DÉCROISSANTE d'un tick — invisible sur onze lignes, certain sur cinq mille.
  //
  // ⚠ ON BALAIE DE 1 À 500 DIXIÈMES, donc y compris SOUS le plancher du niveau :
  // les neuf premiers exercent la borne `[10, 500]` et doivent rendre ce que
  // rend le niveau 1. Le brief annonçait 5 000 points ; le domaine borné n'en
  // porte que 4 910 de distincts, et la différence est exactement cette borne-là.
  const plancher = DEPLACEMENT.delai.plancherDixiemesDeMinute;
  const cache = new Map();
  const delai = (dixiemes, distance) => {
    const cle = `${dixiemes}:${distance}`;
    if (!cache.has(cle)) {
      const niveau = Math.max(10, dixiemes);
      cache.set(cle, enDixiemes(delaiDeplacementTicks(baseAuNiveau(creerEtat(7), niveau), distance)));
    }
    return cache.get(cle);
  };

  let points = 0;
  for (let d = 1; d <= 500; d += 1) {
    for (let dist = 1; dist <= DEPLACEMENT.porteeMaxCases; dist += 1) {
      const v = delai(d, dist);
      points += 1;
      assert.ok(v >= plancher,
        `niveau ${d / 10}, distance ${dist} : ${v} dixièmes, sous le plancher de ${plancher}`);
      if (dist > 1) {
        assert.ok(v >= delai(d, dist - 1),
          `niveau ${d / 10} : la distance ${dist} coûte MOINS que ${dist - 1}`);
      }
      if (d > 1) {
        assert.ok(v >= delai(d - 1, dist),
          `distance ${dist} : le niveau ${d / 10} coûte MOINS que ${(d - 1) / 10}`);
      }
    }
  }
  assert.equal(points, 5000, 'le balayage ne couvre plus cinq mille points');

  // ⚠⚠ ET LE PLANCHER MORD POUR DE BON, SANS QUOI CE TEST NE MESURERAIT RIEN.
  // Le plafond passe SOUS le plancher en dessous du niveau 4,2 : au niveau 1, les
  // dix distances rendent toutes 1 h 00. ⚠ CE QUE ÇA COÛTE EST DIT : sous ce
  // niveau-là, LA DISTANCE EST GRATUITE, et une base neuve est exactement dans ce
  // cas. C'est une conséquence de la forme d'Ethan, pas un oubli.
  const auPlusBas = new Set();
  for (let dist = 1; dist <= DEPLACEMENT.porteeMaxCases; dist += 1) auPlusBas.add(delai(10, dist));
  assert.deepEqual([...auPlusBas], [plancher],
    'au niveau 1, la distance a cessé d\'être gratuite : le plancher ne mord plus');

  // Et il cesse de mordre exactement au niveau 4,2 — mesuré, pas supposé.
  const plafonds = DEPLACEMENT.delai.plafondsParNiveau;
  let premier = null;
  for (let d = 10; d <= 500 && premier === null; d += 1) {
    const entier = Math.floor(d / 10);
    const frac = d - entier * 10;
    const p = frac === 0 ? plafonds[entier - 1]
      : plafonds[entier - 1] + Math.round(((plafonds[entier] - plafonds[entier - 1]) * frac) / 10);
    if (p > plancher) premier = d;
  }
  assert.equal(premier, 42,
    `le plancher cesse de mordre au niveau ${premier / 10} et non à 4,2 : la courbe a bougé`);

  // ⚠ ET LA COURBE MONTE VRAIMENT — sans cette ligne, une constante passerait
  // toutes les assertions de monotonie large ci-dessus.
  assert.ok(delai(500, 10) > 20 * delai(10, 10),
    'le pire cas ne vaut plus vingt fois le meilleur : le barème s\'est aplati');
});
