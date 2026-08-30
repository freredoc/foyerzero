// L'icône de l'application — `tools/icone.py` et ses cinq densités, confrontées
// au disque et à la palette du jeu.
//
// ⚠ CE FICHIER LIT `android/`, ET C'EST LE SEUL DE `test/` DANS CE CAS. Les
// sorties de l'icône vivent hors de `art/sprites/`, donc hors du périmètre de
// `tools/verifier.py` : rien d'autre ne peut dire que l'icône commitée est celle
// que son outil produit aujourd'hui. Ce test ne comble pas cet angle mort — il
// ne rejoue pas l'outil —, mais il tient ce qui se tient sans Python : les
// dimensions, la palette, et l'encastrement.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { decoderRgba } from './png-rgba.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const RES = join(RACINE, 'android', 'app', 'src', 'main', 'res');

/** Les cinq compartiments de densité, en pixels de côté pour 108 dp. */
const DENSITES = {
  mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432,
};

/** La part des 108 dp que le motif occupe — la zone sûre du format. */
const ENCASTREMENT = 72 / 108;

/**
 * La palette étendue de `tools/final128.py` — base + ardoise de l'Ouvrage.
 *
 * ⚠ TRANSCRITE, ET CONFRONTÉE À `FICHE-STYLE.md` PAR LE TEST VOISIN. La même
 * discipline que la liste de `banc.test.js` : elle reste ÉCRITE pour qu'un ajout
 * se voie en relecture, et un test la compare à sa source.
 */
const PALETTE = [
  '#161914', '#343A2C', '#4E5742', '#6A7658', '#8C9A72',
  '#1E2124', '#3E454C', '#68727E',
  '#928E80', '#F5F3E8',
  '#8A1E17', '#E43E32',
  '#A67018', '#F5B636',
  '#0D0B12', '#231D2E', '#382E47', '#4E4160', '#6B5B80',
];

const hex = (r, v, b) => `#${[r, v, b].map((n) => n.toString(16).toUpperCase().padStart(2, '0')).join('')}`;

const chemin = (densite) => join(RES, `mipmap-${densite}`, 'ic_launcher_premier_plan.png');

test('icône — les cinq densités existent et ont les bonnes dimensions', () => {
  // ⚠ LES CINQ MULTIPLES CANONIQUES D'ANDROID pour 108 dp : mdpi est la
  // référence à 1 dp = 1 px, puis 1,5 · 2 · 3 · 4. Une densité manquante ferait
  // que le lanceur remonte à la plus proche et affiche une icône floue.
  assert.equal(Object.keys(DENSITES).length, 5);
  for (const [densite, cote] of Object.entries(DENSITES)) {
    const p = chemin(densite);
    assert.ok(existsSync(p), `mipmap-${densite} : l'icône est absente`);
    const img = decoderRgba(p);
    assert.equal(img.largeur, cote, `mipmap-${densite} : largeur`);
    assert.equal(img.hauteur, cote, `mipmap-${densite} : hauteur`);
  }
  // Témoin : les cinq côtés sont bien distincts. Cinq fichiers de même taille
  // passeraient la boucle ci-dessus si la table était constante.
  assert.equal(new Set(Object.values(DENSITES)).size, 5);
});

test('icône — 100 % des pixels sont sur la palette du jeu, aux cinq densités', () => {
  // ⚠⚠ LA SOURCE N'EST PAS PROPRE, ET C'EST TOUT L'OBJET DU CONDITIONNEMENT.
  // Mesuré sur `art/sources/icone_appli.png` : **109 969 teintes distinctes et
  // 0,0 % des pixels sur la palette** — des voisines à un point d'écart,
  // signature d'une compression avec perte. Réduite telle quelle, cette bouillie
  // donnerait une icône terne.
  const admis = new Set(PALETTE);
  let opaquesVus = 0;
  for (const densite of Object.keys(DENSITES)) {
    const img = decoderRgba(chemin(densite));
    const teintes = new Set();
    let opaques = 0;
    for (let i = 0; i < img.pixels.length; i += 4) {
      if (img.pixels[i + 3] === 0) continue;
      opaques += 1;
      teintes.add(hex(img.pixels[i], img.pixels[i + 1], img.pixels[i + 2]));
    }
    // ⚠ SANS CETTE LIGNE, UNE IMAGE ENTIÈREMENT TRANSPARENTE PASSERAIT : un
    // ensemble vide est inclus dans n'importe quel autre.
    assert.ok(opaques > 0, `mipmap-${densite} : aucun pixel opaque`);
    assert.ok(teintes.size > 3, `mipmap-${densite} : ${teintes.size} teintes, l'image est plate`);
    for (const t of teintes) {
      assert.ok(admis.has(t), `mipmap-${densite} : « ${t} » n'est pas sur la palette`);
    }
    opaquesVus += opaques;
  }
  assert.ok(opaquesVus > 100_000, `${opaquesVus} pixels opaques balayés : le test ne mesure rien`);
});

test('icône — le motif tient dans la zone sûre des 72/108 centraux', () => {
  // ⚠⚠ C'EST CE QUI PROUVE L'ENCASTREMENT, ET C'EST FALSIFIABLE. Une icône
  // adaptative fait 108 dp dont **seuls les 72 centraux sont garantis visibles**
  // — le lanceur masque le reste en cercle, en carré arrondi ou en goutte selon
  // l'appareil. Mesuré sur la source : le motif s'étend de x 21 à x 1244 sur
  // 1254, et **36,0 %** en tomberait hors de la zone sûre en plein cadre ; un
  // masque circulaire en couperait déjà 10,4 %.
  //
  // Cette assertion TOMBE si quelqu'un repasse en plein cadre — `ENCASTREMENT`
  // porté à 1.0 dans `tools/icone.py` — sans le dire. C'est le but.
  for (const [densite, cote] of Object.entries(DENSITES)) {
    const img = decoderRgba(chemin(densite));
    const attendu = Math.max(1, Math.round(cote * ENCASTREMENT));
    const marge = Math.floor((cote - attendu) / 2);

    let minX = cote; let maxX = -1; let minY = cote; let maxY = -1;
    for (let y = 0; y < cote; y += 1) {
      for (let x = 0; x < cote; x += 1) {
        if (img.pixels[(y * cote + x) * 4 + 3] === 0) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    assert.ok(maxX >= 0, `mipmap-${densite} : aucun pixel opaque, la boîte ne mesure rien`);
    assert.ok(minX >= marge && minY >= marge,
      `mipmap-${densite} : le motif commence en (${minX}, ${minY}), avant la marge ${marge}`);
    assert.ok(maxX < cote - marge && maxY < cote - marge,
      `mipmap-${densite} : le motif finit en (${maxX}, ${maxY}), après ${cote - marge}`);

    // Et il OCCUPE la zone sûre — un motif d'un seul pixel y tiendrait aussi.
    assert.ok(maxX - minX + 1 >= attendu - 2 && maxY - minY + 1 >= attendu - 2,
      `mipmap-${densite} : le motif fait ${maxX - minX + 1} × ${maxY - minY + 1}, ${attendu} attendu`);
  }
});

test('icône — l\'enveloppe pointe sur les mipmaps, et le vectoriel a disparu', () => {
  const adaptive = readFileSync(join(RES, 'mipmap-anydpi-v26', 'ic_launcher.xml'), 'utf8');
  assert.match(adaptive, /<foreground android:drawable="@mipmap\/ic_launcher_premier_plan" \/>/,
    'le premier plan ne pointe pas sur les mipmaps');
  assert.match(adaptive, /<background android:drawable="@color\/icone_fond" \/>/,
    'le fond a quitté sa couleur — la forme du fichier devait rester');

  // ⚠ LE `<vector>` DU CREUSET ET SON FICHIER SONT PARTIS. Un drawable vectoriel
  // resté au dépôt serait un provisoire que le prochain lot croirait vivant.
  assert.ok(!existsSync(join(RES, 'drawable', 'icone_premier_plan.xml')),
    'le drawable vectoriel du creuset est encore là');

  // Le fond est GÉNÉRÉ, et il est sur la palette : il prolonge la scène au-delà
  // de l'encastrement. `#161914` — le contour kaki — y était écrit en dur quand
  // le fond de la scène est un quasi-noir bleuté ; les deux ne pouvaient pas
  // rester.
  const couleurs = readFileSync(join(RES, 'values', 'couleurs.xml'), 'utf8');
  const m = couleurs.match(/<color name="icone_fond">(#[0-9A-F]{6})<\/color>/);
  assert.ok(m !== null, 'icone_fond est introuvable ou n\'est plus un hex à six chiffres');
  assert.ok(new Set(PALETTE).has(m[1]), `le fond « ${m[1]} » n'est pas sur la palette`);
});

test('icône — la palette transcrite est celle de `tools/final128.py`', () => {
  // ⚠ UNE TRANSCRIPTION QUI NE SE CONFRONTE PAS À SA SOURCE EST UNE COPIE QUI
  // VIEILLIT. Les dix-neuf teintes ci-dessus se lisent dans l'outil, dans les
  // DEUX sens — la même discipline que la palette de `banc.test.js`.
  const source = readFileSync(join(RACINE, 'tools', 'final128.py'), 'utf8');
  const trouvees = [...source.matchAll(/\("[^"]+","(#[0-9A-Fa-f]{6})"\)/g)]
    .map((x) => x[1].toUpperCase());
  // `final128.py` déclare BASE puis A ; les deux listes s'y suivent, et le
  // fichier ne porte pas d'autre couple `("nom","#hex")`.
  const uniques = [...new Set(trouvees)];
  assert.ok(uniques.length > 10, `${uniques.length} teintes trouvées : le motif ne lit plus l'outil`);
  assert.deepEqual([...uniques].sort(), [...new Set(PALETTE)].sort(),
    'la palette transcrite ici et celle de tools/final128.py ont divergé');
});

// ---------------------------------------------------------------------------
// La dette
// ---------------------------------------------------------------------------

test('icône — DETTE : `cond.reduire` efface `A contour`, et ce n\'est PAS corrigé', () => {
  // ⚠⚠ DÉFAUT TROUVÉ AU LOT FINITIONS, EN FAISANT AUTRE CHOSE, ET LAISSÉ EN
  // PLACE DÉLIBÉRÉMENT. `reduire` de `tools/cond.py` prend `len(PAL)` — la
  // palette de base, **quatorze** teintes — comme sentinelle de transparence.
  // Or `tools/final128.py` réduit avec la palette ÉTENDUE, dix-neuf teintes,
  // dont l'indice 14 est `A contour` `#0D0B12`, le ton le plus sombre de
  // l'Ouvrage. Chaque bloc qui vote pour lui devient donc TRANSPARENT.
  //
  // ⚠ MESURÉ, PAS SOUPÇONNÉ : avant réduction, 2,11 % des pixels de `gangue`,
  // 2,13 % de `noeud` et 2,17 % de `terril` tombent sur `A contour` — et aucun
  // ne survit dans le sprite commité, ce que ce test asserte.
  //
  // ⚠⚠ POURQUOI CE N'EST PAS CORRIGÉ ICI. Le faire régénérerait des sprites
  // commités, recoudrait un atlas, changerait `dist` et rendrait
  // `tools/verifier.py` rouge jusqu'à sa relance — c'est un lot à part, et un
  // arbitrage d'Ethan, pas une décision de lot. `tools/icone.py` porte sa PROPRE
  // réduction, qui prend le nombre de teintes en argument, donc l'icône n'en
  // souffre pas.
  //
  // **CE TEST TOMBERA LE JOUR DE LA CORRECTION**, et c'est ce qu'on lui demande :
  // quelqu'un relira ce paragraphe au lieu de découvrir la nouveauté six mois
  // plus tard. C'est la mécanique de `DETTES_ACCENT` et des écarts permanents.
  const MANGES = ['bat_o_gangue', 'bat_o_noeud', 'bat_o_terril'];
  for (const nom of MANGES) {
    const img = decoderRgba(join(RACINE, 'art', 'sprites', 'bâtiment', '64', `${nom}.png`));
    let opaques = 0;
    let sombres = 0;
    for (let i = 0; i < img.pixels.length; i += 4) {
      if (img.pixels[i + 3] === 0) continue;
      opaques += 1;
      if (hex(img.pixels[i], img.pixels[i + 1], img.pixels[i + 2]) === '#0D0B12') sombres += 1;
    }
    // ⚠ FALSIFIABLE : le sprite doit porter des pixels, sinon « zéro #0D0B12 »
    // serait vrai d'une image vide.
    assert.ok(opaques > 100, `${nom} : ${opaques} px opaques, le montage ne mesure rien`);
    assert.equal(sombres, 0,
      `${nom} porte ${sombres} px de « A contour » — la dette est corrigée, retirer ce test `
      + 'et son paragraphe, et régénérer les sprites de l\'Ouvrage');
  }

  // ⚠ ET LE TÉMOIN QUI PROUVE QUE LA TEINTE EST BIEN ATTEIGNABLE AILLEURS : le
  // premier plan de l'icône, produit par la réduction CORRIGÉE, en porte
  // massivement. Sans lui, « zéro #0D0B12 » pourrait vouloir dire que la teinte
  // n'est employée nulle part, et le test ne mesurerait aucune dette.
  const icone = decoderRgba(chemin('xxxhdpi'));
  let dedans = 0;
  for (let i = 0; i < icone.pixels.length; i += 4) {
    if (icone.pixels[i + 3] === 0) continue;
    if (hex(icone.pixels[i], icone.pixels[i + 1], icone.pixels[i + 2]) === '#0D0B12') dedans += 1;
  }
  assert.ok(dedans > 1000,
    `l'icône ne porte que ${dedans} px de « A contour » : le témoin de la dette ne tient plus`);
});
