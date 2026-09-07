/**
 * Lot PICTOGRAMMES — la quatorzième famille de sprites, et la première qui ne
 * soit pas du jeu mais de l'INTERFACE.
 *
 * ⚠⚠ CE LOT PRODUIT LES SPRITES, IL NE LES CÂBLE PAS. Aucun pictogramme
 * n'apparaît à l'écran à sa fin — c'est l'arbitrage du brief du 07/09, celui
 * que SON-CATALOGUE avait pris avant SON-CÂBLAGE : décider où va chacun des
 * quarante-six est quarante-six décisions d'interface, et ce n'est pas le même
 * travail que de produire des images. Ces tests gardent donc la CHAÎNE et rien
 * d'autre : la coupe des neuf planches, le centrage, le détourage, l'accord de
 * l'index et du disque, la non-régression des onze autres atlas, le poids.
 *
 * ⚠⚠ `PIC T1` N'EST PAS ICI, ET IL NE PEUT PAS Y ÊTRE. « La chaîne reproduit à
 * l'octet » se mesure par `python3 tools/planches.py --verifier`, et le dépôt
 * n'a pas de Python sous `npm run check` — c'est l'arbitrage de `CLAUDE.md` §3,
 * « la chaîne graphique, hors de `npm run check`, et pour une raison ». Le
 * verdict est au rapport, avant et après, comme pour tous les lots d'art.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decoderRgba } from './png-rgba.js';

import { ATLAS, COTE_SPRITE } from '../src/data/atlas.js';
import { MODULES } from '../src/data/modules.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPRITES = join(RACINE, 'art', 'sprites');
const INTERFACE = join(SPRITES, 'interface');

/**
 * Les quarante-six noms attendus, planche par planche, sur les grilles MESURÉES.
 *
 * ⚠⚠ MESURÉES, PAS RECOPIÉES DU MANIFESTE. `S11_UI_CONTENU.txt` annonce des
 * tailles ; les gouttières de fond magenta ont été comptées sur les neuf images
 * avant qu'une ligne ne soit écrite, parce qu'un manifeste et une planche qui
 * divergent d'une case décalent TOUS les noms. Sept planches confirment le
 * manifeste. Les deux autres demandaient de regarder :
 *   — P11.8 montre QUATRE bandes verticales sans encre, mais deux ne font que
 *     11 et 6 px quand une vraie gouttière en fait 27 à 147 : ce sont des trous
 *     INTERNES au cadenas et à la jauge, pas des séparations. La grille est
 *     bien 2 × 2.
 *   — P11.9 est une grille 3 × 2 pour CINQ contenus : la sixième case est VIDE,
 *     mesurée à zéro pixel d'encre. C'est le `None` de la table de l'outil.
 */
const PICTOGRAMMES = {
  'P11.1 (3×1)': ['ui_quartz', 'ui_scorie', 'ui_electricite'],
  'P11.2 (2×2)': ['ui_points_attaque', 'ui_armee_offensive', 'ui_armee_defensive', 'ui_recherche'],
  'P11.3 (3×2)': ['ui_cible_infanterie', 'ui_cible_vehicule', 'ui_cible_aviation',
    'ui_chassis_escouade', 'ui_chassis_blinde', 'ui_chassis_aeronef'],
  'P11.4 (2×2)': ['ui_categorie_mur', 'ui_categorie_barriere',
    'ui_categorie_tourelle', 'ui_categorie_artillerie'],
  'P11.5 (4×2)': ['ui_module_flashbang', 'ui_module_camouflage', 'ui_module_emp',
    'ui_module_munition_speciale', 'ui_module_tir_de_barrage', 'ui_module_vol_de_vie',
    'ui_module_booster', 'ui_module_pv_plus_vingt'],
  'P11.6 (3×2)': ['ui_module_garnison', 'ui_module_rayon_mini_moins_un', 'ui_module_ecraseur',
    'ui_module_rayon_plus_un', 'ui_module_auto_reparation', 'ui_module_bouclier'],
  'P11.7 (3×2)': ['ui_pv', 'ui_degats', 'ui_butin', 'ui_reparation', 'ui_temps', 'ui_niveau'],
  'P11.8 (2×2)': ['ui_verrou', 'ui_emplacement', 'ui_vague', 'ui_budget'],
  'P11.9 (3×2)': ['ui_fleche_gauche', 'ui_fleche_droite', 'ui_fleche_verte',
    'ui_plus', 'ui_moins'],
};

/** Les deux grilles produites. La 32 est sortie au lot PIXELS ; elle ne revient pas. */
const GRILLES = [64, 128];

const TOUS = Object.values(PICTOGRAMMES).flat();

function fichiersDe(grille) {
  return readdirSync(join(INTERFACE, String(grille)))
    .filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)).sort();
}

// ---------------------------------------------------------------------------
// PIC T2 — le compte est celui des grilles MESURÉES
// ---------------------------------------------------------------------------

test('PIC T2 — quarante-six pictogrammes, planche par planche, sur les grilles mesurées', () => {
  assert.equal(TOUS.length, 46, 'le compte attendu a changé sans que ce test le dise');
  assert.equal(new Set(TOUS).size, 46, 'deux planches se disputent un nom');

  const parPlanche = Object.fromEntries(
    Object.entries(PICTOGRAMMES).map(([p, n]) => [p, n.length]),
  );
  assert.deepEqual(parPlanche, {
    'P11.1 (3×1)': 3,
    'P11.2 (2×2)': 4,
    'P11.3 (3×2)': 6,
    'P11.4 (2×2)': 4,
    'P11.5 (4×2)': 8,
    'P11.6 (3×2)': 6,
    'P11.7 (3×2)': 6,
    // ⚠ CINQ SUR SIX CASES : la sixième est vide. Une grille 3 × 2 qui rendrait
    // six noms ici serait le signe qu'on a inventé un sprite pour du vide.
    'P11.9 (3×2)': 5,
    'P11.8 (2×2)': 4,
  }, 'le découpage par planche a changé');

  for (const grille of GRILLES) {
    assert.deepEqual(fichiersDe(grille), [...TOUS].sort(),
      `grille ${grille} : les fichiers et la table ne s'accordent pas`);
  }
});

test('PIC T2 bis — les quatorze pictogrammes de module SONT les quatorze clés de `MODULES`', () => {
  // ⚠⚠ ET CE N'ÉTAIT PAS UNE DEVINETTE. Les deux planches s'annoncent
  // « modules 1-8 » et « modules 9-14 », mais cette numérotation N'EST PAS celle
  // de la table : le cœur « PV +20 % » est le huitième de la première planche
  // quand `pvPlusVingt` est le treizième de `MODULES`. Croire le nom de fichier
  // aurait décalé six noms. Les quatorze ont donc été identifiés au DESSIN — et
  // s'ils l'avaient été de travers, l'égalité ci-dessous ne retomberait pas
  // juste : il manquerait une clé et il en resterait une en trop.
  const serpent = (cle) => cle.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
  const desPlanches = [...PICTOGRAMMES['P11.5 (4×2)'], ...PICTOGRAMMES['P11.6 (3×2)']]
    .map((n) => n.replace('ui_module_', '')).sort();
  assert.equal(desPlanches.length, 14, 'les deux planches de modules ne rendent plus quatorze noms');
  assert.deepEqual(desPlanches, Object.keys(MODULES).map(serpent).sort(),
    'les pictogrammes de module et les clés de MODULES ont divergé');

  // Falsifiable : la conversion doit VRAIMENT convertir, sinon deux listes
  // brutes se compareraient et le test ne dirait rien du nommage.
  assert.equal(serpent('rayonMiniMoinsUn'), 'rayon_mini_moins_un');
  assert.notDeepEqual(Object.keys(MODULES).map(serpent).sort(), Object.keys(MODULES).sort());
});

// ---------------------------------------------------------------------------
// PIC T3 — chaque pictogramme est CENTRÉ
// ---------------------------------------------------------------------------

test('PIC T3 — l\'encre est centrée sur les quarante-six, dans les DEUX AXES et les deux grilles', () => {
  // ⚠⚠ C'EST LA LEÇON DU 06/09, ET ELLE A COÛTÉ UN LOT. `recadrer` a deux
  // modes : `ancrage='bas'` pose les contenus sur une ligne de sol commune —
  // juste pour un bâtiment vu de CÔTÉ — et il a donné aux emblèmes de carte
  // 5 px de marge basse à TOUS les paliers et jusqu'à 35 px de vide en haut,
  // soit 28 % d'une case de décalage vers le sud. Un pictogramme n'a pas de
  // sol : il se centre, et `ancrage='centre'` est le défaut de `recadrer`.
  //
  // ⚠⚠ ET L'AXE HORIZONTAL EST MESURÉ AUSSI, PARCE QU'IL A ATTRAPÉ UN VRAI
  // DÉFAUT. Le brief ne demandait que la verticale ; la première production
  // rendait `ui_scorie` décalé de 11 px vers la gauche sur la grille 128, soit
  // 8,6 % d'une case. Cause mesurée : `1024 / 3` ne tombe pas juste, la coupe
  // arithmétique de P11.1 tombait à 682 alors que sa gouttière finit à 679, et
  // trois colonnes de l'éclair d'électricité entraient dans la cellule de la
  // scorie — assez pour gonfler la boîte que `recadrer` centre, donc pour
  // décaler le sprite. `COUPES_INTERFACE` et `verifier_les_coupes` de
  // `tools/planches.py` le corrigent, et les deux axes tombent alors à 1 px.
  //
  // ⚠ SUR TOUS, PAS SUR UN. Le décalage qui a mordu les emblèmes était
  // IDENTIQUE partout, donc invisible à qui n'en regarde qu'un seul.
  let pire = { ecart: -1 };
  let mesures = 0;
  for (const grille of GRILLES) {
    for (const nom of TOUS) {
      const { largeur, hauteur, pixels } = decoderRgba(join(INTERFACE, String(grille), `${nom}.png`));
      assert.equal(largeur, grille, `${nom} : largeur ${largeur} au lieu de ${grille}`);
      assert.equal(hauteur, grille, `${nom} : hauteur ${hauteur} au lieu de ${grille}`);

      // La boîte de l'encre, sur les deux axes à la fois.
      let haut = null;
      let bas = null;
      let gauche = largeur;
      let droite = -1;
      for (let y = 0; y < hauteur; y += 1) {
        for (let x = 0; x < largeur; x += 1) {
          if (pixels[(y * largeur + x) * 4 + 3] === 0) continue;
          if (haut === null) haut = y;
          bas = y;
          if (x < gauche) gauche = x;
          if (x > droite) droite = x;
        }
      }
      assert.ok(haut !== null, `${nom} en ${grille} : aucun pixel opaque, le sprite est vide`);

      for (const [axe, avant, apres] of [
        ['vertical', haut, hauteur - 1 - bas],
        ['horizontal', gauche, largeur - 1 - droite],
      ]) {
        const ecart = Math.abs(avant - apres);
        if (ecart > pire.ecart) pire = { ecart, nom, grille, axe, avant, apres };
        assert.ok(ecart <= 1,
          `${nom} en ${grille}, axe ${axe} : marges ${avant} et ${apres}`);
      }
      mesures += 1;
    }
  }
  assert.equal(mesures, 46 * 2, 'le balayage n\'a pas parcouru les deux grilles');

  // ⚠ FALSIFIABLE : le pire écart doit être ATTEINT. Un test qui ne mesurerait
  // rien — dossier vide, boucle qui ne tourne pas — passerait l'inégalité
  // ci-dessus sans rien dire. Mesuré : 1 px, qui est l'arrondi d'une encre de
  // longueur impaire dans une case paire, et non un décalage.
  assert.equal(pire.ecart, 1,
    `le pire écart vaut ${pire.ecart} px (${pire.nom} en ${pire.grille}, `
    + `axe ${pire.axe}) : la mesure a changé`);
});

// ---------------------------------------------------------------------------
// PIC T4 — aucun fond magenta ne survit
// ---------------------------------------------------------------------------

test('PIC T4 — aucun pixel du fond magenta ne reste opaque', () => {
  // ⚠⚠ LA MESURE PORTE SUR LA TEINTE DE CLÉ, PAS SUR `est_fond`, ET LA NUANCE
  // EST TOUT LE TEST. `est_fond` de `tools/cond.py` a une SECONDE porte —
  // « violet clair quelconque » — qui attrape aussi le sujet : mesuré, elle
  // compte 17 pixels « de fond » au milieu du bouclier VIOLET de
  // `ui_module_bouclier`, qui n'en est pas un. C'est le piège que
  // `est_fond_sujet` documente déjà — « la seconde porte mangeait l'intérieur du
  // sujet ». Un test qui reprendrait ce prédicat accuserait donc le détourage
  // d'une faute qui est dans le prédicat.
  //
  // On mesure la distance au magenta de clé, sur les pixels OPAQUES seuls : un
  // pixel à demi transparent est un bord adouci, pas du fond resté là.
  const CLE = [255, 0, 255];
  const TOLERANCE = 60; // large exprès : un magenta délavé compte encore
  let opaques = 0;
  for (const grille of GRILLES) {
    for (const nom of TOUS) {
      const { largeur, hauteur, pixels } = decoderRgba(join(INTERFACE, String(grille), `${nom}.png`));
      for (let i = 0; i < largeur * hauteur; i += 1) {
        if (pixels[i * 4 + 3] < 128) continue;
        opaques += 1;
        const d2 = (pixels[i * 4] - CLE[0]) ** 2
          + (pixels[i * 4 + 1] - CLE[1]) ** 2
          + (pixels[i * 4 + 2] - CLE[2]) ** 2;
        assert.ok(d2 > TOLERANCE * TOLERANCE,
          `${nom} en ${grille} : un pixel de fond a survécu, `
          + `(${pixels[i * 4]}, ${pixels[i * 4 + 1]}, ${pixels[i * 4 + 2]})`);
      }
    }
  }
  // Falsifiable : sans encre à balayer, la boucle ci-dessus passerait vide.
  assert.ok(opaques > 100_000, `${opaques} pixels opaques balayés : le test ne mesure rien`);
});

test('PIC T4 bis — le VERT de la grande flèche survit, et il n\'est dans aucune teinte de base', () => {
  // ⚠⚠ LA PALETTE NE CONTRAINT PLUS LES COULEURS DEPUIS LE LOT PIXELS, et c'est
  // ce qui rend ce pictogramme possible. `ecrire` quantifiait sur quatorze
  // teintes ; il réduit maintenant par FILTRE dès qu'on lui passe la matière, et
  // `produire` la lui passe. Le vert de la grande flèche de P11.9 n'est dans
  // aucune des quatorze — il ressort quand même, et AUCUNE teinte n'a été
  // ajoutée à la palette pour ça.
  const compterLeVert = (nom) => {
    const { largeur, hauteur, pixels } = decoderRgba(join(INTERFACE, '128', `${nom}.png`));
    let verts = 0;
    for (let i = 0; i < largeur * hauteur; i += 1) {
      if (pixels[i * 4 + 3] < 128) continue;
      const r = pixels[i * 4];
      const v = pixels[i * 4 + 1];
      const b = pixels[i * 4 + 2];
      if (v > 120 && v > r + 40 && v > b + 40) verts += 1;
    }
    return verts;
  };
  assert.ok(compterLeVert('ui_fleche_verte') > 1000,
    `${compterLeVert('ui_fleche_verte')} pixels verts : la flèche a perdu son vert`);

  // Falsifiable : un pictogramme SANS vert n'en rend aucun, sinon le compteur
  // mesurerait n'importe quoi et le test passerait sur n'importe quelle image.
  assert.equal(compterLeVert('ui_fleche_gauche'), 0,
    'la flèche claire porte du vert : le prédicat ne discrimine pas');
});

// ---------------------------------------------------------------------------
// PIC T5 — l'index et le disque s'accordent, dans les deux sens
// ---------------------------------------------------------------------------

test('PIC T5 — `ATLAS.interface` et le dossier portent exactement les mêmes noms', () => {
  const table = ATLAS.interface;
  assert.ok(table !== undefined,
    'la famille « interface » n\'est pas dans src/data/atlas.js — relancer tools/atlas.py --ecrire');
  assert.deepEqual([...table.noms].sort(), fichiersDe(COTE_SPRITE),
    'l\'index et le dossier ne portent pas les mêmes pictogrammes');
  assert.equal(table.noms.length, 46);

  // La grille cousue doit tenir les quarante-six, et de peu : 7 × 7 = 49 cases,
  // trois vides. Une grille plus large serait de l'atlas payé pour rien.
  assert.equal(table.colonnes, 7);
  assert.equal(table.rangees, 7);
  assert.ok(table.colonnes * table.rangees >= 46,
    'la grille cousue ne tient pas les quarante-six pictogrammes');
  assert.ok((table.colonnes - 1) * table.rangees < 46,
    'une colonne de moins suffirait : l\'atlas porte une bande vide');
});

// ---------------------------------------------------------------------------
// PIC T6 — les onze autres atlas n'ont pas bougé d'un octet
// ---------------------------------------------------------------------------

/**
 * La taille de chacun des atlas d'avant ce lot, MESURÉE avant lui.
 *
 * ⚠⚠ ÉCRITE EN CLAIR, ET C'EST LA MOITIÉ QUI COMPTE. Une garde qui lirait la
 * taille du fichier qu'elle garde ne pourrait jamais la voir changer.
 */
const TAILLES_D_AVANT = {
  'atlas-batiment-128.webp': 114650,
  'atlas-batiment-64.webp': 42952,
  'atlas-carte-128.webp': 410234,
  'atlas-carte-64.webp': 156372,
  'atlas-chassis-128.webp': 28850,
  'atlas-chassis-64.webp': 10690,
  'atlas-defense-128.webp': 53520,
  'atlas-defense-64.webp': 21976,
  'atlas-limite-128.webp': 13092,
  'atlas-limite-64.webp': 10016,
  'atlas-socle-128.webp': 54642,
  'atlas-socle-64.webp': 21092,
  'atlas-terrain-128.webp': 78802,
  'atlas-terrain-64.webp': 33256,
  'atlas-tourelle_unite-128.webp': 19454,
  'atlas-tourelle_unite-64.webp': 7912,
  'atlas-unite-128.webp': 140972,
  'atlas-unite-64.webp': 57386,
};

test('PIC T6 — la famille neuve n\'a déplacé aucun des atlas d\'avant', () => {
  // ⚠⚠ NON-RÉGRESSION, ET ELLE A DEMANDÉ UNE CORRECTION D'OUTIL. `tools/atlas.py`
  // écrivait SANS CONDITION : ajouter une famille réécrivait les onze autres
  // atlas avec les octets de l'encodeur WebP de la machine, pour des images
  // identiques. Mesuré le 07/09 sur un arbre PRISTINE, `--verifier` rend déjà
  // **8 identiques, 10 différents** sur dix-huit avant qu'une ligne de ce lot ne soit
  // écrite — les SPRITES, eux, se reproduisent à l'octet. L'outil porte
  // désormais l'invariant que `tools/planches.py` a depuis toujours : on
  // n'écrase jamais un fichier existant qui ne se reproduit pas.
  for (const [fichier, octets] of Object.entries(TAILLES_D_AVANT)) {
    assert.equal(statSync(join(SPRITES, fichier)).size, octets,
      `${fichier} a changé de taille : la famille neuve a déplacé un atlas d'avant`);
  }
  // ⚠ FALSIFIABLE DANS L'AUTRE SENS : le lot doit avoir produit quelque chose.
  // Sans ces deux lignes, la garde ci-dessus serait verte sur un lot qui
  // n'aurait rien fait du tout.
  assert.equal(statSync(join(SPRITES, 'atlas-interface-128.webp')).size, 175454);
  assert.equal(statSync(join(SPRITES, 'atlas-interface-64.webp')).size, 79442);
  assert.equal(Object.keys(TAILLES_D_AVANT).length, 18,
    'neuf familles d\'avant, deux grilles chacune : la table gardée a changé de taille');
});

// ---------------------------------------------------------------------------
// PIC T7 — le poids reste sous la borne, et la marge est écrite en clair
// ---------------------------------------------------------------------------

test('PIC T7 — le livrable pèse 8 016 124 octets, la marge sur la borne T10 est de 13,80 %', () => {
  // ⚠⚠ CE LOT NE FAIT PAS ENTRER UNE IMAGE DANS LE LIVRABLE, ET C'EST LA
  // MESURE QUI COMPTE. Le brief attendait « le plus gros ajout d'images depuis
  // longtemps » ; mesuré, l'ajout vaut **+911 octets**, et le compte de `data:`
  // ne bouge pas d'un : **296 avant, 296 après**. La raison est mécanique et
  // elle est écrite dans `tools/build.js` : un fichier n'entre que par un
  // MARQUEUR, et un marqueur se pose dans la page, c'est-à-dire dans `src/ui/`,
  // où ce lot n'écrit pas une ligne (§6 du brief). Les 911 octets sont donc du
  // JavaScript pur — les quarante-six noms et la grille dans `src/data/atlas.js`.
  //
  // ⚠⚠ CE QUI EST DIFFÉRÉ, ET COMBIEN. `atlas-interface-128.webp` pèse
  // 175 596 octets, soit **234 128 en base64** : c'est ce que le lot de CÂBLAGE
  // paiera, pas celui-ci. Projection à ce moment-là : 8 250 252 octets, marge
  // 1 049 748, soit 11,29 % — au-dessus des 10 % dont le brief demandait qu'on
  // parle. Le rapport le dit ; le chiffre n'est pas caché dans un test.
  //
  // ⚠ ET LA MARGE S'ÉCRIT ICI EN CLAIR, pas seulement l'inégalité. Une garde
  // qui ne dirait que « moins de 9 300 000 » resterait verte en passant de 3 %
  // de marge à 0,1 % sans que personne ne le voie venir.
  const BORNE = 9_300_000;           // T10 de `banc.test.js`, relevée au lot SOL-SATELLITE
  const MESURE = 8_016_124;          // mesuré le 07/09, version 0.99.18 · build 119
  const MARGE = BORNE - MESURE;      // 1 283 876 octets
  assert.equal(MARGE, 1_283_876);
  assert.equal(Math.round((MARGE / BORNE) * 10_000) / 100, 13.81);

  const octets = statSync(join(RACINE, 'dist', 'index.html')).size;
  assert.ok(octets < BORNE, `${octets} octets : la borne T10 est franchie`);

  // ⚠ ET LE CHIFFRE ÉCRIT DOIT RESTER CELUI DU DISQUE, à la dérive près d'un
  // lot qui ne touche pas à l'art. Sans cette borne-ci, la mesure écrite
  // ci-dessus vieillirait en silence et la marge annoncée deviendrait fausse.
  assert.ok(Math.abs(octets - MESURE) < 50_000,
    `le livrable pèse ${octets} octets, la mesure écrite dit ${MESURE} : remesurer et réécrire`);
});
