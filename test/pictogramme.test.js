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
 * l'index et du disque, la non-régression des atlas d'avant, le poids.
 *
 * ⚠⚠ `PIC T1` N'EST PAS ICI, ET IL NE PEUT PAS Y ÊTRE. « La chaîne reproduit à
 * l'octet » se mesure par `python3 tools/planches.py --verifier`, et le dépôt
 * n'a pas de Python sous `npm run check` — c'est l'arbitrage de `CLAUDE.md` §3,
 * « la chaîne graphique, hors de `npm run check`, et pour une raison ». Le
 * verdict est au rapport, avant et après, comme pour tous les lots d'art.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decoderRgba } from './png-rgba.js';

import { ATLAS, COTE_SPRITE } from '../src/data/atlas.js';
import { MODULES } from '../src/data/modules.js';
import { DEFENSES, COLONNES_DEGATS } from '../src/data/combat.js';
import {
  ACCORDS, CLASSE_PICTOGRAMME, PICTOGRAMME_DE_LA_CATEGORIE, PICTOGRAMME_DE_LA_COLONNE,
  PICTOGRAMME_DE_LA_RESSOURCE, creerPictogramme, pictogrammeDuModule, tousLesPictogrammes,
} from '../src/ui/pictogramme.js';
import {
  apercuDeLaPiece, apercuDuBatiment, lignesDeLaPiece, lignesDuPanneau,
} from '../src/ui/chantier.js';
import { creerEtat } from '../src/sim/state.js';
import { baseCourante } from '../src/sim/base-courante.js';

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

/**
 * Un élément assez complet pour ce que `creerPictogramme` en fait — et rien de
 * plus.
 *
 * ⚠ IL PORTE « CE QUE LE CODE EMPLOIE VRAIMENT », comme les cinq autres faux
 * documents du dépôt : `className`, `dataset`, `style` et `setAttribute`. Un
 * faux plus riche laisserait passer un poseur qui emploierait autre chose.
 */
function fauxDocument() {
  return {
    createElement() {
      const el = { className: '', dataset: {}, style: {}, attributs: {} };
      el.setAttribute = (nom, valeur) => { el.attributs[nom] = String(valeur); };
      return el;
    },
  };
}

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
// PIC T6 — les atlas d'avant n'ont pas bougé d'un octet
// ---------------------------------------------------------------------------

/**
 * La taille de chacun des atlas d'avant ce lot, MESURÉE avant lui.
 *
 * ⚠⚠ ÉCRITE EN CLAIR, ET C'EST LA MOITIÉ QUI COMPTE. Une garde qui lirait la
 * taille du fichier qu'elle garde ne pourrait jamais la voir changer.
 *
 * ⚠⚠ DEUX LIGNES ONT BOUGÉ AU LOT CONQUÊTE-24H, EN LE SACHANT, ET C'EST LE SEUL
 * MOYEN CORRECT DE LES FAIRE BOUGER. Les 18 ruines de bases entrent dans la
 * famille `carte`, donc ses deux atlas sont recousus : 410 234 → **473 716** à la
 * grille 128, 156 372 → **180 372** à la 64.
 *
 * ⚠⚠ ET DEUX AUTRES AU LOT BÂTIMENTS-QUATRE-ÉTATS, 08/09, POUR LA MÊME
 * RAISON. La famille `batiment` passe de 34 à 83 sprites — vingt bâtiments à
 * quatre états, deux ruines de case, et l'icône de la vignette mixte : 114 650
 * → **299 848** à la grille 128, 42 952 → **107 050** à la 64. C'est le poste le
 * plus lourd du lot, et il est ventilé au rapport.
 *
 * ⚠ LES QUATORZE AUTRES N'ONT PAS BOUGÉ D'UN OCTET, ce que les quatorze
 * autres lignes continuent de garder — et c'est exactement ce que ce test
 * existe pour dire.
 *
 * ⚠ `tools/atlas.py` A REFUSÉ DE LES ÉCRIRE, et il avait raison : sa garde
 * ne connaissait qu'un cas, l'écart d'encodeur WebP. Elle en connaît deux depuis
 * ce lot — `--forcer carte` nomme la famille qu'on entend réécrire, et laisse les
 * dix autres tranquilles.
 */
const TAILLES_D_AVANT = {
  'atlas-batiment-128.webp': 299848,
  'atlas-batiment-64.webp': 107050,
  'atlas-carte-128.webp': 473716,
  'atlas-carte-64.webp': 180372,
  'atlas-chassis-128.webp': 72842, // 28850 avant OUVRAGE-CÂBLAGE
  'atlas-chassis-64.webp': 27802, // 10690 avant OUVRAGE-CÂBLAGE
  'atlas-defense-128.webp': 65050, // 53520 avant OUVRAGE-CÂBLAGE
  'atlas-defense-64.webp': 27124, // 21976 avant OUVRAGE-CÂBLAGE
  'atlas-limite-128.webp': 13092,
  'atlas-limite-64.webp': 10016,
  'atlas-socle-128.webp': 53918, // 54642 avant OUVRAGE-CÂBLAGE
  'atlas-socle-64.webp': 21750, // 21092 avant OUVRAGE-CÂBLAGE
  'atlas-terrain-128.webp': 78802,
  'atlas-terrain-64.webp': 33256,
  'atlas-tourelle_unite-128.webp': 36454, // 19454 avant OUVRAGE-CÂBLAGE
  'atlas-tourelle_unite-64.webp': 14912, // 7912 avant OUVRAGE-CÂBLAGE
  'atlas-unite-128.webp': 96784, // 140972 avant OUVRAGE-CÂBLAGE
  'atlas-unite-64.webp': 37880, // 57386 avant OUVRAGE-CÂBLAGE
};

test('PIC T6 — la famille neuve n\'a déplacé aucun des atlas d\'avant', () => {
  // ⚠⚠ NON-RÉGRESSION, ET ELLE A DEMANDÉ UNE CORRECTION D'OUTIL. `tools/atlas.py`
  // écrivait SANS CONDITION : ajouter une famille réécrivait DIX des dix-huit
  // atlas d'avant avec les octets de l'encodeur WebP de la machine, pour des images
  // identiques. Mesuré le 07/09 sur un arbre PRISTINE, `--verifier` rend déjà
  // **8 identiques, 10 différents** sur dix-huit avant qu'une ligne de ce lot ne soit
  // écrite — les SPRITES, eux, se reproduisent à l'octet. L'outil porte
  // désormais l'invariant que `tools/planches.py` a depuis toujours : on
  // n'écrase jamais un fichier existant qui ne se reproduit pas.
  //
  // ⚠⚠ DIX DES DIX-HUIT SONT RÉANCRÉS AU LOT OUVRAGE-CÂBLAGE, ET LE NOMBRE
  // D'AVANT EST ÉCRIT À CÔTÉ DE CELUI D'APRÈS. Ce n'est pas un assouplissement :
  // ce lot fait entrer les quarante-deux sprites v2 de l'Ouvrage et retire ses
  // neuf blindés monolithes, donc `unite`, `chassis`, `tourelle_unite`, `socle`
  // et `defense` CHANGENT de contenu aux deux grilles. Ils ont été réécrits par
  // `--forcer`, un drapeau PAR FAMILLE : les huit autres n'ont pas été touchés,
  // et c'est ce que les huit lignes sans commentaire ci-dessus gardent encore.
  // ⚠ `unite` MAIGRIT de 140 972 à 96 784 octets à la grille 128 — neuf sprites
  // en moins et treize redessinés —, `chassis` et `tourelle_unite` DOUBLENT, un
  // camp de plus chacun.
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

test('PIC T7 — le livrable pèse 9 134 181 octets, la marge sur la borne T10 est de 1,78 %', () => {
  // ⚠⚠ DEUX MESURES, ET LA SECONDE EST CELLE QUI COMPTE. Le lot PICTOGRAMMES
  // avait produit les sprites SANS les câbler : le livrable n'avait alors pris
  // que **+911 octets**, tous en JavaScript, et le compte de `data:` n'avait pas
  // bougé — 296 lignes, 291 URI. La raison était mécanique : un fichier n'entre
  // que par un MARQUEUR, et un marqueur se pose dans la page.
  //
  // ⚠⚠ LE CÂBLAGE POSE CE MARQUEUR, ET L'ATLAS ENTRE. Mesuré le 07/09, du lot
  // PICTOGRAMMES au câblage : **8 016 124 → 8 254 664**, soit **+238 540**.
  // Ventilé : **images +233 940** — l'atlas d'interface en base64 —,
  // **JavaScript +2 901**, **feuille +1 699**, **balisage +0**, **audio +0**, et
  // la somme des cinq postes tombe EXACTEMENT sur le total. Les `data:` passent
  // de 296 lignes / 291 URI à **297 / 292** : une ressource entre, une seule.
  //
  // ⚠ ET LA MARGE S'ÉCRIT ICI EN CLAIR, pas seulement l'inégalité. Une garde
  // qui ne dirait que « moins de 9 300 000 » resterait verte en passant de 11 %
  // de marge à 0,1 % sans que personne ne le voie venir.
  //
  // ⚠⚠ REMESURÉ AU LOT CONQUÊTE-24H, ET LA DERNIÈRE LIGNE DE CE TEST L'AVAIT
  // DEMANDÉ : « remesurer et réécrire ». Les 18 ruines de bases entrent dans
  // l'atlas `carte`, qui était DÉJÀ dans la page : aucune ressource nouvelle —
  // les `data:` restent à **297** —, c'est la même image qui s'alourdit.
  // **8 258 693 → 8 344 729, soit +86 036.** Ventilé, et la somme tombe juste :
  // **images +84 644** — `atlas-carte-128.webp` passe de 410 234 à 473 716 octets,
  // soit 546 980 → 631 624 en base64 — et **JavaScript +1 392**, le dessin des
  // ruines et le filtre des rasées. La grille 64 n'entre pas dans la page : elle
  // pèse 24 000 octets de plus sur le disque et zéro dans le livrable.
  //
  // ⚠⚠ LA MARGE DESCEND DE 11,24 % À 10,27 %, ET C'EST LE PRIX ANNONCÉ. Le §0
  // du brief prévenait : « si ce lot ajoute des images, le delta est annoncé et
  // ventilé avant d'être livré ».
  //
  // ⚠⚠ ET ELLE DESCEND À 9,73 % AU LOT OUVRAGE-CÂBLAGE, 08/09 : le lot COÛTE
  // 38 927 octets. Il fait entrer les quarante-deux sprites v2 de l'Ouvrage et
  // retire ses neuf blindés monolithes ; mesuré poste par poste contre un
  // livrable rebâti dans un `git worktree` depuis `214415d`, **images +36 820 ·
  // JavaScript +2 107 · feuille +0 · audio +0 · balisage +0**, et la somme des
  // cinq tombe EXACTEMENT sur le total. La borne T10, elle, NE BOUGE PAS.
  //
  // ⚠⚠ ET LES IMAGES COÛTENT ALORS QUE LE LOT RETIRE NEUF SPRITES — c'est le
  // détourage de la clé VERTE qui l'explique, et il vaut la peine de le dire
  // dans ce sens-là. Une première passe rendait 21 929 octets, et elle avait
  // TORT : `recadrer` posait son fond en magenta écrit en dur, si bien que 31
  // des 42 sprites gardaient le vert en pixels opaques. Un aplat de vert
  // compresse mieux que du dessin, et le sujet, cadré sur la planche entière,
  // sortait rétréci. Corrigé, l'art pèse ce qu'il dessine.
  //
  // ⚠ LE CHIFFRE EST REMESURÉ PARCE QUE CE LOT TOUCHE À L'ART, ce que la
  // dernière assertion de ce test demande en toutes lettres. La tolérance de
  // 50 000 octets l'aurait laissé passer : elle garde contre la dérive lente,
  // pas contre un lot qui sait ce qu'il déplace.
  //
  // ⚠⚠ REMESURÉ AU LOT BÂTIMENTS-QUATRE-ÉTATS, ET C'EST LE PLUS GROS SAUT DE
  // LA SÉRIE. Les bâtiments passent d'un état à QUATRE et de seize à vingt :
  // 34 sprites cousus deviennent 83, et l'atlas `batiment` — qui était déjà dans
  // la page — passe de 114 650 à 299 848 octets. Aucune ressource nouvelle : les
  // `data:` restent à **297**. **8 395 461 → 8 647 037, soit +251 576.** Ventilé,
  // et la somme tombe juste : **images +246 932** — 152 868 → 399 800 en base64 —
  // et **code +4 644**, le dédoublement du Collecteur, les trois artilleries, la
  // vignette mixte et le rabattement d'état.
  //
  // ⚠⚠ LA MARGE PASSE SOUS LES 8 %, ET C'EST LE POINT À SURVEILLER DU LOT.
  // 11,22 % au 07/09 au matin, 9,73 % au 08/09 au matin, **7,02 %** maintenant :
  // 652 963 octets. Le prochain lot d'art devra compter avant de dessiner.
  //
  // ⚠⚠ REMESURÉ AU LOT SOL-OUVRAGE, ET C'EST LE LOT QUI SERRE LE PLUS LA MARGE.
  // Le sol de la carte cesse d'être uniforme : huit planches deviennent
  // VINGT-DEUX, et quatorze `data:` entrent — 297 lignes / 292 URI deviennent
  // **311 / 306**. **8 655 020 → 9 124 362, soit +469 342.** Ventilé contre un
  // livrable rebâti dans un `git worktree` depuis `37ef8eb`, et la somme des cinq
  // postes tombe EXACTEMENT sur le total : **images +466 506 · JavaScript
  // +2 200 · balisage +636 · feuille +0 · audio +0**.
  //
  // ⚠⚠ ET LA BASE A BOUGÉ SOUS LE LOT : `main` EST PASSÉ DE `6f7b3bb` À
  // `37ef8eb` PENDANT SON EXÉCUTION — NEUTRALISATION puis ÉTAT-EN-RAID. La
  // ventilation a été REJOUÉE contre la base neuve plutôt que recopiée, et elle
  // rend les MÊMES cinq nombres au dernier octet : les deux lots sont du
  // JavaScript pur et ne font entrer aucune image, donc ils ne recouvrent aucun
  // poste de celui-ci. Contre `6f7b3bb` c'était 8 654 436 → 9 123 778.
  //
  // ⚠⚠ ET LE CÔTÉ DES PLANCHES A ÉTÉ CHOISI PAR CETTE BORNE-CI, PAS PAR LE GOÛT.
  // Les vingt-deux ne tiennent pas à leur taille d'origine : `tools/sols.py` les
  // ramène toutes à 704 pixels — recadrage pour les huit ocres, réduction pour
  // les quatorze neuves — parce que 768 dépassait la borne de 344 044 octets.
  // Les quatre mesures qui ont désigné 704 sont dans l'en-tête de l'outil.
  //
  // ⚠⚠ LA MARGE TOMBE À 1,89 %, ET C'EST LA PLUS MINCE DEPUIS BASES-1. 7,02 % au
  // 08/09 au matin, **1,89 %** ensuite : 175 638 octets. Le prochain lot qui
  // fait entrer une image devra relever la borne EN ÉCRIVANT POURQUOI, ou tenir
  // dans cent soixante-quinze kilo-octets.
  //
  // ⚠⚠ REMESURÉ AU LOT PALETTES-ET-DEFENSE, 08/09, ET C'EST UN LOT SANS UNE
  // SEULE IMAGE. **9 124 362 → 9 126 689, soit +2 327**, ventilé contre le
  // livrable bâti sur la base pristine `566a453` au premier `npm run check` de
  // la session : **feuille +2 286 · JavaScript +41 · balisage +0 · images +0 ·
  // audio +0**, la somme des cinq tombant EXACTEMENT sur le total, et les
  // `data:` restant à **311 lignes / 306 URI** des deux côtés.
  //
  // ⚠⚠ ET LE POSTE QUI COÛTE EST LA FEUILLE, PAS LE CODE, PARCE QUE LE CSS N'EST
  // PAS MINIFIÉ. `tools/build.js` passe `minify: true` à esbuild pour le JS
  // SEUL : un commentaire de JavaScript ne pèse RIEN dans le livrable, un
  // commentaire de feuille y part à l'octet. Mesuré : la première écriture des
  // commentaires du lot coûtait **4 088** octets de feuille ; resserrée sans rien
  // perdre de ce qui porte la raison, elle en coûte **2 286**. C'est le fait à
  // retenir pour tout lot qui touche `src/index.src.html`.
  //
  // ⚠ LES 41 OCTETS DE JAVASCRIPT SONT LE LOT ENTIER CÔTÉ CODE : un champ de
  // plus dans `FORCES` pour chacune des deux forces, sa lecture dans
  // `problemeDuBatimentDeProduction`, et une raison de moins dans
  // `posablesDeLaDefense` — qui en REND, d'où un solde si petit.
  //
  // ⚠⚠ REMESURÉ AU LOT PAQUETS, 09/09, ET LA BASE ANNONCÉE CI-DESSUS ÉTAIT DÉJÀ
  // PÉRIMÉE DE 4 407 OCTETS. `main` = `598d23a` bâtit **9 131 096** octets, pas
  // 9 126 689 : trois lots fusionnés depuis (VOISINAGE-ET-MENACE, LIMITE-T8
  // suspendu, la correction du compte de tests) n'avaient pas remesuré cette
  // ligne — le §9.4 du brief PAQUETS demandait de la corriger. Le lot PAQUETS
  // lui-même coûte **9 131 096 → 9 134 181, soit +3 085, ENTIÈREMENT DU
  // JAVASCRIPT** — le placement par paquets et le catalogue de formes —, mesuré
  // contre le livrable rebâti sur l'arbre pristine de `598d23a` (`git stash`)
  // dans la même session : **images +0 · feuille +0 · balisage +0 · audio +0**,
  // `data:` à **311 lignes / 306 URI** des deux côtés.
  const BORNE = 9_300_000;           // T10 de `banc.test.js`, relevée au lot SOL-SATELLITE
  const MESURE = 9_134_181;          // mesuré le 09/09, lot PAQUETS, base `598d23a`
  const MARGE = BORNE - MESURE;      // 165 819 octets
  assert.equal(MARGE, 165_819);
  assert.equal(Math.round((MARGE / BORNE) * 10_000) / 100, 1.78);
  // ⚠ ET LA MARGE NE DESCEND PAS SOUS CENT CINQUANTE MILLE OCTETS. C'est la
  // borne que le brief du lot SOL-OUVRAGE pose sur le choix du côté des
  // planches : sous ce seuil, un lot de code ordinaire ne passerait plus.
  assert.ok(MARGE >= 150_000, `marge de ${MARGE} octets : sous le plancher de 150 000`);

  const octets = statSync(join(RACINE, 'dist', 'index.html')).size;
  assert.ok(octets < BORNE, `${octets} octets : la borne T10 est franchie`);

  // ⚠ ET LE CHIFFRE ÉCRIT DOIT RESTER CELUI DU DISQUE, à la dérive près d'un
  // lot qui ne touche pas à l'art. Sans cette borne-ci, la mesure écrite
  // ci-dessus vieillirait en silence et la marge annoncée deviendrait fausse.
  assert.ok(Math.abs(octets - MESURE) < 50_000,
    `le livrable pèse ${octets} octets, la mesure écrite dit ${MESURE} : remesurer et réécrire`);
});

// ---------------------------------------------------------------------------
// Le câblage — les quarante-six à l'écran, 07/09
// ---------------------------------------------------------------------------
//
// ⚠⚠ ETHAN, 07/09 : « fais tout d'un seul coup, les quatre lots d'un coup ». Le
// rapport du lot PICTOGRAMMES proposait quatre lots de câblage — bandeau,
// arsenal, modules, chiffres — ; ils sont faits ensemble, et ces tests-ci
// gardent ce que le découpage aurait gardé lot par lot.

test('CÂB T1 — la famille entre dans le livrable, et par le seul chemin qui existe', () => {
  // ⚠⚠ UN FICHIER N'ENTRE QUE PAR UN MARQUEUR, et le marqueur ne suffit pas : il
  // faut AUSSI la ligne de `FICHIERS_INLINE`. Les deux moitiés sont dans deux
  // fichiers différents, et l'oubli de l'une laisse un `%ATLAS_INTERFACE%` en
  // clair dans la page — c'est-à-dire une image vide, sans erreur.
  const page = readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8');
  const build = readFileSync(join(RACINE, 'tools', 'build.js'), 'utf8');
  assert.ok(page.includes('--atlas-interface: url(\'%ATLAS_INTERFACE%\')'),
    'la feuille ne déclare plus la variable de l\'atlas d\'interface');
  assert.ok(build.includes('atlas(\'interface\')'),
    'tools/build.js n\'inline plus l\'atlas d\'interface');

  // ⚠ LA CLASSE EST NOMMÉE DANS LE JS ET PEINTE DANS LA FEUILLE : les deux se
  // confrontent, sinon renommer l'une laisserait des pictogrammes sans fond.
  assert.equal(CLASSE_PICTOGRAMME, 'picto');
  assert.match(page, new RegExp(`\\.${CLASSE_PICTOGRAMME}\\s*\\{`),
    `la feuille ne peint plus « .${CLASSE_PICTOGRAMME} »`);
  assert.ok(page.includes('background-image: var(--atlas-interface)'),
    'la règle du pictogramme ne prend plus son fond dans la variable');

  // ⚠⚠ ET LE MARQUEUR NE SURVIT PAS AU BUILD. C'est la moitié que le HTML source
  // ne peut pas dire : un marqueur non remplacé ne lève pas, il dessine du vide.
  const produit = readFileSync(join(RACINE, 'dist', 'index.html'), 'utf8');
  assert.ok(!produit.includes('%ATLAS_INTERFACE%'), 'le marqueur n\'a pas été remplacé');
  assert.ok(produit.includes('--atlas-interface: url(\'data:image/webp;base64,'),
    'l\'atlas d\'interface n\'est pas inliné dans le livrable');
});

test('CÂB T2 — chaque table de pictogrammes couvre EXACTEMENT sa table de données', () => {
  // ⚠⚠ C'EST LA GARDE QUI TIENT TOUT LE FICHIER `ui/pictogramme.js`. Il existe
  // pour qu'aucun écran n'écrive un nom de sprite en dur ; s'il traduit une clé
  // de travers, ou s'il en oublie une, le câblage montre le mauvais dessin sans
  // qu'une seule ligne ne lève. Les paires table ↔ donnée sont déclarées DANS
  // le module, pas recopiées ici : une liste écrite là serait la seconde vérité.
  for (const [nom, table, cles] of ACCORDS) {
    assert.deepEqual(Object.keys(table).sort(), [...cles].sort(),
      `${nom} et sa table de données ne portent pas les mêmes clés`);
  }
  assert.equal(ACCORDS.length, 3, 'le nombre d\'accords a changé sans que ce test le dise');

  // Les quatre catégories de défense sont les `type` que `DEFENSES` porte.
  const types = [...new Set(Object.values(DEFENSES).map((d) => d.type))].sort();
  assert.deepEqual(Object.keys(PICTOGRAMME_DE_LA_CATEGORIE).sort(), types);
  assert.equal(types.length, 4);

  // Les quatorze modules se DÉRIVENT, et la dérivation retombe sur l'atlas.
  const desModules = Object.keys(MODULES).map(pictogrammeDuModule);
  assert.equal(desModules.length, 14);
  for (const nom of desModules) {
    assert.ok(ATLAS.interface.noms.includes(nom), `« ${nom} » n'est pas dans l'atlas`);
  }
  // ⚠ FALSIFIABLE : une clé inconnue LÈVE, elle ne rend pas un nom plausible.
  assert.throws(() => pictogrammeDuModule('bouclierMagique'), /n'est pas un module/);
});

test('CÂB T3 — les quarante-six sont TOUS employés, et rien d\'autre ne l\'est', () => {
  // ⚠⚠ DANS LES DEUX SENS, ET C'EST CE QUI REND LE CÂBLAGE COMPLET. Un
  // pictogramme produit mais jamais nommé serait 5 ko d'atlas payés pour rien —
  // exactement ce que le lot EFFONDREMENT a trouvé sur `ruine_j` et `ruine_o`,
  // « dans le livrable, payées en octets d'images, et employées par personne ».
  // Un nom employé mais absent de l'atlas ferait lever `fondDuSprite` au premier
  // affichage, sur un écran que les tests ne montent pas tous.
  const employes = [...new Set(tousLesPictogrammes())].sort();
  assert.deepEqual(employes, [...ATLAS.interface.noms].sort(),
    'les pictogrammes employés et l\'atlas ont divergé');
  assert.equal(employes.length, 46);
});

test('CÂB T4 — aucun écran n\'écrit un nom de sprite d\'interface en dur', () => {
  // ⚠⚠ C'EST LA RÈGLE DE `ui/pictogramme.js`, MESURÉE PLUTÔT QU'ANNONCÉE. Le
  // fichier existe pour que la traduction clé → sprite se fasse en UN endroit ;
  // un écran qui écrirait `'ui_module_bouclier'` serait la première ligne à
  // mentir le jour où un module change de clé, et rien ne le dirait.
  const dossier = join(RACINE, 'src', 'ui');
  let balayes = 0;
  for (const fichier of readdirSync(dossier)) {
    if (!fichier.endsWith('.js') || fichier === 'pictogramme.js') continue;
    balayes += 1;
    const source = readFileSync(join(dossier, fichier), 'utf8');
    // ⚠ ON CHERCHE LE NOM ENTRE GUILLEMETS, PAS LE PRÉFIXE : le mot est écrit
    // en prose dans les commentaires, et une garde qui tomberait dessus se
    // déclencherait sur ce qu'on écrit à son sujet — c'est arrivé, à l'écriture
    // même de ce test.
    //
    // ⚠⚠ ET ON NE RETIENT QUE CE QUI EST DANS L'ATLAS D'INTERFACE. Les sons du
    // pack portent le MÊME préfixe — trois d'entre eux sont nommés en clair dans
    // `ui/session.js`, comme ils doivent : ce ne sont pas des sprites. Une garde
    // qui accuserait sur le préfixe seul serait rouge pour une raison qui ne la
    // regarde pas, et on l'assouplirait pour de mauvaises raisons.
    const trouves = [...source.matchAll(/'(ui_[a-z0-9_]+)'/g)]
      .map((m) => m[1])
      .filter((nom) => ATLAS.interface.noms.includes(nom));
    assert.deepEqual(trouves, [], `${fichier} écrit ${trouves.join(', ')} en dur`);
  }
  assert.ok(balayes >= 12, `${balayes} fichiers balayés : le montage ne lit rien`);

  // ⚠ FALSIFIABLE, DES DEUX CÔTÉS. Le motif doit attraper un nom de sprite, et
  // le filtre doit laisser passer un nom de SON — sinon la garde ne garde rien,
  // ou bien elle garde tout et le premier son la ferait tomber.
  const attrape = (texte) => [...texte.matchAll(/'(ui_[a-z0-9_]+)'/g)]
    .map((m) => m[1]).filter((nom) => ATLAS.interface.noms.includes(nom));
  assert.deepEqual(attrape(`const x = '${'ui'}_quartz';`), ['ui_quartz'],
    "le motif n'attrape même pas un appât");
  assert.deepEqual(attrape(`son.jouer('${'ui'}_click');`), [],
    'le filtre accuse un nom de son');
});

test('CÂB T5 — un pictogramme se pose, et un nom inconnu LÈVE', () => {
  const doc = fauxDocument();
  const picto = creerPictogramme(doc, 'ui_quartz');
  assert.equal(picto.className, CLASSE_PICTOGRAMME);
  assert.equal(picto.dataset.picto, 'ui_quartz');
  // Le cadrage est celui de l'atlas, et il n'est pas vide.
  assert.equal(picto.style.backgroundSize, '700% 700%');
  assert.match(picto.style.backgroundPosition, /^[\d.]+% [\d.]+%$/);

  // ⚠⚠ DEUX CELLULES DIFFÉRENTES ONT DEUX CADRAGES DIFFÉRENTS. Sans cette
  // ligne, un poseur qui rendrait toujours « 0% 0% » passerait les assertions
  // ci-dessus et dessinerait quarante-six fois le même pictogramme.
  const autre = creerPictogramme(doc, 'ui_verrou');
  assert.notEqual(autre.style.backgroundPosition, picto.style.backgroundPosition);

  // ⚠ ET UN NOM ABSENT DE L'ATLAS LÈVE. Rendre un cadrage par défaut ferait
  // dessiner la première cellule à la place de celle qu'on demande.
  assert.throws(() => creerPictogramme(doc, 'ui_inexistant'), /absent de la famille/);
});

test('CÂB T6 — décoratif ou parlant, jamais les deux, jamais ni l\'un ni l\'autre', () => {
  // ⚠⚠ UN PICTOGRAMME POSÉ À CÔTÉ DE SON LIBELLÉ EST DÉCORATIF : le lecteur
  // d'écran lirait deux fois la même chose. Un pictogramme SEUL — la flèche
  // d'une bascule, le cadenas d'une vignette — porte le sens et doit se dire.
  // Les deux cas existent dans le câblage, et le défaut serait de traiter les
  // quarante-six pareil.
  const doc = fauxDocument();
  const decoratif = creerPictogramme(doc, 'ui_pv');
  assert.equal(decoratif.attributs['aria-hidden'], 'true');
  assert.equal(decoratif.attributs['aria-label'], undefined);

  const parlant = creerPictogramme(doc, 'ui_fleche_gauche', 'Base précédente');
  assert.equal(parlant.attributs['aria-label'], 'Base précédente');
  assert.equal(parlant.attributs.role, 'img');
  assert.equal(parlant.attributs['aria-hidden'], undefined);
});

test('CÂB T7 — les fiches portent leurs pictogrammes, et le TITRE porte le niveau', () => {
  // ⚠⚠ LES DEUX FICHES DOIVENT AVOIR LA MÊME FORME — `ERGO T7 bis` l'exige, et
  // c'est ce qui permet un seul rendu. Ce test-ci mesure l'autre moitié : que
  // les pictogrammes soient bien ceux de la DONNÉE, ligne par ligne.
  const etat = creerEtat(11);
  baseCourante(etat).garnison.push({
    id: 'casemate', rangee: 5, colonne: 4, niveau: 1, degatsMilli: 0,
  });
  const piece = lignesDeLaPiece(apercuDeLaPiece(etat, 'garnison', 0));
  const batiment = lignesDuPanneau(apercuDuBatiment(etat, 0));

  assert.equal(piece.picto, 'ui_niveau');
  assert.equal(batiment.picto, 'ui_niveau');

  const lignes = piece.sections.flatMap((s) => s.lignes);
  const parLibelle = new Map(lignes.map((l) => [l.libelle, l.picto]));
  assert.equal(parLibelle.get('Points de vie'), 'ui_pv');
  assert.equal(parLibelle.get('Points engagés'), 'ui_budget');
  assert.equal(parLibelle.get('État'), 'ui_degats');

  // ⚠ LES TROIS COLONNES DE DÉGÂTS, DANS L'ORDRE DE LA MATRICE. Une seule ligne
  // vérifiée laisserait passer deux cibles interverties.
  const cibles = lignes.filter((l) => l.libelle.startsWith('Contre')).map((l) => l.picto);
  assert.deepEqual(cibles, COLONNES_DEGATS.map((c) => PICTOGRAMME_DE_LA_COLONNE[c]));
  assert.equal(cibles.length, 3);

  // ⚠⚠ ET LA FICHE D'UN BÂTIMENT NOMME SES RESSOURCES PAR LEUR CLÉ, pas par le
  // mot. Le stockage de la base est la section qui les liste TOUTES les trois,
  // dans l'ordre de `RESSOURCES` : c'est celle qui attrape deux pictogrammes
  // intervertis, ce qu'une seule ligne vérifiée ne verrait pas.
  const stockage = batiment.sections.find((s) => s.titre === 'Stockage de la base');
  assert.ok(stockage !== undefined, 'le Chantier ne stocke plus rien');
  assert.deepEqual(
    stockage.lignes.map((l) => l.picto),
    Object.values(PICTOGRAMME_DE_LA_RESSOURCE),
    "les lignes de stockage ne portent pas les trois ressources dans l'ordre",
  );
  assert.equal(stockage.lignes.length, 3);
});
