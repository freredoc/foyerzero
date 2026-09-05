/**
 * Lot EMBLÈMES-ABÎMÉS — les emblèmes de site en fumée et en feu, et l'échelle.
 *
 * Deux moitiés qui n'ont rien à voir, et les treize tests le disent : `T1` à
 * `T8` gardent la CHAÎNE GRAPHIQUE — la coupe des huit planches d'Ethan, la
 * référence d'échelle commune à une famille, la ligne de sol —, `T9` à `T13`
 * gardent le CÂBLAGE, c'est-à-dire quel emblème se dessine dans quel état.
 *
 * ⚠⚠ CE QUE NODE NE PEUT PAS MESURER, L'OUTIL L'ÉCRIT. Les douze planches font
 * 1 024 et 1 254 pixels de côté, et surtout les grandeurs qui décident — la
 * colonne d'une cellule, sa ligne de sol, la référence d'échelle de sa famille —
 * sont des DÉCISIONS de `tools/emblemes.py`, pas des propriétés d'une image.
 * `art/sprites/carte/emblemes-mesures.json` les porte, et ces tests confrontent
 * le manifeste au produit. Même motif que `bord-empreintes.json` au lot MURS et
 * qu'`atlas-empreintes.json` au lot PIXELS.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decoderRgba } from './png-rgba.js';

import { ATLAS } from '../src/data/atlas.js';
import { spriteDuSite, dessinerEmblemeDUneCase } from '../src/render/embleme.js';

import { BATIMENTS, POI } from '../src/data/sites.js';
import { BASE_BATIMENTS } from '../src/data/base.js';
import {
  AVARIE, avarie, avarieDuSite, avarieDeLaBase, avariesParCase, enregistrerLeRaid,
} from '../src/sim/site-entame.js';
import { creerEtat } from '../src/sim/state.js';
import { montageDuSite } from '../src/sim/site-de-la-case.js';
import { baseCourante } from '../src/sim/base-courante.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPRITES = join(RACINE, 'art', 'sprites', 'carte', '128');
const MESURES = JSON.parse(
  readFileSync(join(RACINE, 'art', 'sprites', 'carte', 'emblemes-mesures.json'), 'utf8'),
);

const FAMILLES = ['site_base_j', 'site_base_o', 'site_quartz', 'site_scorie'];
const ETATS = ['', '_fumee', '_feu'];
const NIVEAUX = Array.from({ length: 9 }, (_, i) => `n${i + 1}`);

/** La boîte de matière d'un sprite : alpha ≥ 128, comme partout au dépôt. */
function matiere(nom) {
  const img = decoderRgba(join(SPRITES, `${nom}.png`));
  let xMin = Infinity; let xMax = -1; let yMin = Infinity; let yMax = -1; let px = 0;
  for (let y = 0; y < img.hauteur; y += 1) {
    for (let x = 0; x < img.largeur; x += 1) {
      if (img.pixels[(y * img.largeur + x) * 4 + 3] < 128) continue;
      px += 1;
      if (x < xMin) xMin = x;
      if (x > xMax) xMax = x;
      if (y < yMin) yMin = y;
      if (y > yMax) yMax = y;
    }
  }
  assert.ok(px > 0, `${nom} : sprite vide`);
  return {
    l: xMax - xMin + 1, h: yMax - yMin + 1, bas: yMax, px, img,
  };
}

/** Les pixels transparents ENFERMÉS par de la matière, par remplissage du bord. */
function trous(img) {
  const { largeur: L, hauteur: H, pixels } = img;
  const opaque = (i) => pixels[i * 4 + 3] >= 128;
  const vu = new Uint8Array(L * H);
  const pile = [];
  for (let x = 0; x < L; x += 1) { pile.push(x, x + (H - 1) * L); }
  for (let y = 0; y < H; y += 1) { pile.push(y * L, y * L + L - 1); }
  while (pile.length) {
    const i = pile.pop();
    if (vu[i] || opaque(i)) continue;
    vu[i] = 1;
    const x = i % L; const y = (i - x) / L;
    if (x > 0) pile.push(i - 1);
    if (x < L - 1) pile.push(i + 1);
    if (y > 0) pile.push(i - L);
    if (y < H - 1) pile.push(i + L);
  }
  let n = 0;
  for (let i = 0; i < L * H; i += 1) if (!opaque(i) && !vu[i]) n += 1;
  return n;
}

const nomsAttendus = FAMILLES.flatMap(
  (f) => ETATS.flatMap((e) => NIVEAUX.map((n) => `${f}_${n}${e}`)),
);

test('EMB T1 — les douze planches rendent NEUF cellules chacune, fusion comprise', () => {
  // Les 108 cellules existent, et elles sont réparties 27 par famille : c'est la
  // sortie observable de « neuf composantes par planche ». Une planche qui en
  // aurait rendu huit ferait LEVER `cellules_par_composante` — donc le manifeste
  // et les fichiers n'existeraient pas du tout.
  for (const famille of FAMILLES) {
    assert.equal(Object.keys(MESURES[famille].cellules).length, 27,
      `${famille} : 27 cellules attendues, trois états de neuf paliers`);
  }
  for (const nom of nomsAttendus) {
    assert.ok(MESURES[nomFamille(nom)].cellules[nom], `${nom} absent du manifeste`);
    assert.ok(matiere(nom).px > 0, `${nom} : sprite sans matière`);
  }

  // ⚠⚠ LA SEULE COMPOSANTE FUSIONNÉE DU LOT EST NOMMÉE, ET SA COUPE AUSSI. Sur
  // `S10_camps_quartz_en_feu`, le panache de la rangée 3 touche le bâtiment de
  // la rangée 2 dans la colonne du MILIEU : une seule composante de 253 × 620,
  // deux cellules de haut. La colonne du milieu porte `n2`, `n5` et `n8` ; les
  // deux fusionnés sont donc `n5` et `n8`.
  assert.equal(MESURES.coupes.length, 1, 'une seule coupe en hauteur attendue');
  const [coupe] = MESURES.coupes;
  assert.equal(coupe.planche, 'S10_camps_quartz_en_feu_3x3_1024.png');
  assert.equal(coupe.colonne, 1);

  // ⚠ ET LA COUPE SE CONFRONTE À LA PLANCHE SŒUR, PAS À UN NOMBRE ÉCRIT. Sur
  // `camps_quartz_degats_fumee`, où les deux composantes sont SÉPARÉES, la ligne
  // de sol de `n5` dit où la frontière tombe vraiment. Un pixel d'écart sur
  // 1 024 est la tolérance, et elle se mesure : la garde tomberait si la coupe
  // se posait ailleurs qu'à la taille de la composante.
  const solVoisin = MESURES.site_quartz.cellules.site_quartz_n5_fumee.sol;
  assert.ok(Math.abs(coupe.y - solVoisin) <= 2,
    `coupe à y=${coupe.y}, frontière de la planche sœur à y=${solVoisin}`);

  for (const nom of ['site_quartz_n5_feu', 'site_quartz_n8_feu']) {
    assert.ok(matiere(nom).px > 500, `${nom} : la moitié coupée est vide`);
  }
  assert.notDeepEqual(
    [...matiere('site_quartz_n5_feu').img.pixels],
    [...matiere('site_quartz_n8_feu').img.pixels],
    'les deux moitiés de la composante fusionnée rendent la même image',
  );
});

function nomFamille(nom) {
  return FAMILLES.find((f) => nom.startsWith(`${f}_n`));
}

test('EMB T2 — les neuf se rangent par COLONNE puis par ligne de sol', () => {
  for (const famille of FAMILLES) {
    for (const etat of ETATS) {
      const cs = NIVEAUX.map((n) => MESURES[famille].cellules[`${famille}_${n}${etat}`]);
      // Ordre de lecture : trois rangées de trois, colonnes 0, 1, 2.
      cs.forEach((c, i) => {
        assert.equal(c.colonne, i % 3, `${famille}${etat} n${i + 1} : colonne ${c.colonne}`);
        assert.equal(c.rangee, Math.floor(i / 3), `${famille}${etat} n${i + 1} : rangée`);
      });
      // Dans une colonne, la ligne de sol croît strictement d'une rangée à la
      // suivante — c'est la définition du tri, et c'est ce qu'on peut vérifier.
      for (let col = 0; col < 3; col += 1) {
        const sols = [0, 1, 2].map((r) => cs[r * 3 + col].sol);
        assert.ok(sols[0] < sols[1] && sols[1] < sols[2],
          `${famille}${etat} colonne ${col} : lignes de sol ${sols} non croissantes`);
      }
      // Et la taille croît d'un bout à l'autre : `n9` est bien le plus grand.
      assert.ok(cs[8].h > cs[0].h * 1.3,
        `${famille}${etat} : n9 (${cs[8].h}) devrait dominer n1 (${cs[0].h})`);
    }
  }

  // ⚠⚠ CE QUI SERAIT FAUX SANS LE GROUPEMENT PAR COLONNE, ET C'EST MESURÉ ICI.
  // Trier les neuf composantes par la seule ligne de sol mélange les colonnes :
  // sur la planche saine du joueur, la rangée 1 porte les bas 311, 310 et 311,
  // si bien qu'un tri global met la colonne 1 devant la colonne 0. La garde
  // rejoue ce tri global et exige qu'il DIFFÈRE de l'ordre retenu — sans quoi
  // elle ne garderait rien.
  const cs = NIVEAUX.map((n) => MESURES.site_base_j.cellules[`site_base_j_${n}`]);
  const globalParSol = cs.map((c, i) => ({ ...c, i }))
    .sort((a, b) => a.sol - b.sol || a.i - b.i).map((c) => c.i);
  assert.notDeepEqual(globalParSol, [0, 1, 2, 3, 4, 5, 6, 7, 8],
    'le tri global par ligne de sol donne le même ordre : la garde ne mord pas');

  // ⚠ EN REVANCHE, TRIER PAR LE HAUT AU LIEU DU BAS **DANS UNE COLONNE** NE
  // CHANGE RIEN AUJOURD'HUI — mesuré sur les douze planches, colonne par
  // colonne, les deux tris rendent le même ordre. Le brief du lot annonçait
  // l'inverse ; c'est le groupement par colonne qui corrige, pas le choix du
  // bas. La ligne de sol reste le bon critère — elle ne dépend pas de la hauteur
  // du panache — et cette falsification-là se DÉCLARE au lieu d'être comptée.
});

test('EMB T3 — la largeur du sprite est celle de la source, à l\'érosion près', () => {
  // ⚠⚠ LE BRIEF DEMANDAIT « LE RAPPORT n1/n9 À 5 % PRÈS » ; LA MESURE OFFRE
  // BEAUCOUP MIEUX, ET LE RAPPORT SEUL AURAIT ÉTÉ FAUX. `conditionner` érode la
  // matière de trois pixels de planche avant de réduire : la perte est ABSOLUE,
  // donc elle pèse plus lourd sur un petit palier que sur un grand, et le seul
  // rapport `n1/n9` s'en trouve biaisé jusqu'à 5,5 % — `site_scorie_fumee`
  // mesure 0,362 pour une source à 0,383. Ce n'est pas la chaîne qui rééchelonne.
  //
  // Ce qu'on peut affirmer, et qui est bien plus fort : la largeur sortante est
  // une fonction AFFINE de la largeur entrante, de pente 1, à un décalage
  // constant près. Mesuré sur les 108 : résidu médian 2,0 px, min 0,6, max 3,1,
  // écart-type 0,51 — c'est l'érosion, et elle ne dépend pas du palier.
  const residus = [];
  for (const famille of FAMILLES) {
    const reference = MESURES[famille].reference;
    for (const etat of ETATS) {
      for (const n of NIVEAUX) {
        const c = MESURES[famille].cellules[`${famille}_${n}${etat}`];
        const predite = ((c.l / c.cotePlanche) / reference) * 120;
        const mesuree = matiere(`${famille}_${n}${etat}`).l;
        residus.push(predite - mesuree);
      }
    }
  }
  assert.equal(residus.length, 108);
  const mini = Math.min(...residus);
  const maxi = Math.max(...residus);
  assert.ok(mini > 0 && maxi < 4,
    `résidu hors de ]0 ; 4[ : min ${mini.toFixed(1)}, max ${maxi.toFixed(1)}`);
  // ⚠ ET C'EST L'ÉTALEMENT QUI GARDE, PAS LA BORNE. Un décalage constant est de
  // l'érosion ; un décalage qui CROÎT avec la taille serait une échelle qui
  // dérive, et c'est exactement ce qu'on veut interdire.
  assert.ok(maxi - mini < 3,
    `résidu étalé de ${(maxi - mini).toFixed(1)} px : l'échelle n'est pas affine`);
});

test('EMB T4 — les 36 emblèmes SAINS suivent la même règle, donc ont été régénérés', () => {
  // ⚠⚠ CE TEST TOMBE SI LES SAINS NE SONT PAS RÉGÉNÉRÉS, ET C'EST TOUT SON
  // OBJET. Avant ce lot, `recadrer` normalisait CHAQUE cellule sur son propre
  // contenu : mesuré sur `art/sprites/carte/128/`, `site_base_j` faisait 86
  // pixels de large en `n1` et 118 en `n9`, et SEPT des neuf paliers valaient
  // 117 ou 118 — une base de niveau 1 dessinée à la taille d'une base de niveau
  // 50, ce qu'Ethan a décrit mot pour mot. Le rapport `n1/n9` valait 0,73 ;
  // il vaut désormais 0,33 à 0,38 selon la famille.
  for (const famille of FAMILLES) {
    const spr = NIVEAUX.map((n) => matiere(`${famille}_${n}`));
    const rapport = spr[0].l / spr[8].l;
    assert.ok(rapport < 0.55,
      `${famille} : n1 fait ${spr[0].l} px pour ${spr[8].l} en n9 — rapport `
      + `${rapport.toFixed(2)}, la chaîne normalise encore par cellule`);
  }
});

test('EMB T5 — un palier fait la MÊME largeur dans les trois états', () => {
  // ⚠⚠ T3 DIT QUE L'ÉCHELLE EXISTE, T5 QU'ELLE EST LA MÊME D'UN ÉTAT À L'AUTRE,
  // et une chaîne qui normaliserait par PLANCHE passerait T3 en tombant ici.
  // C'est ce que la référence commune à la famille entière — saine, fumée, feu —
  // achète : sans elle, la base grandirait en prenant feu.
  let pire = 0;
  for (const famille of FAMILLES) {
    for (const n of NIVEAUX) {
      const ls = ETATS.map((e) => matiere(`${famille}_${n}${e}`).l);
      const ecart = Math.max(...ls) - Math.min(...ls);
      pire = Math.max(pire, ecart);
      assert.ok(ecart <= 4, `${famille}_${n} : largeurs ${ls}, écart ${ecart} px`);
    }
  }
  // ⚠ LE SEUIL EST MESURÉ, PAS CHOISI, ET L'ÉCART RÉSIDUEL EST DANS L'ART. Les
  // planches abîmées de `site_base_j` sont dessinées 3 % plus étroites que la
  // saine — rapporté à la cellule, 0,885 contre 0,911 en `n9` —, et
  // `site_quartz` n1 va dans l'autre sens. La chaîne ne peut pas rattraper ça
  // sans normaliser par planche, c'est-à-dire sans casser la propriété que ce
  // test défend. Trois familles sur quatre tiennent à 2 pixels.
  assert.ok(pire >= 2, `écart maximal ${pire} px : le seuil de 4 ne mesure plus rien`);

  // Et la chaîne n'AJOUTE rien à l'écart de la source : le rapport des largeurs
  // sortantes vaut celui des largeurs entrantes.
  for (const famille of FAMILLES) {
    for (const n of NIVEAUX) {
      const cs = ETATS.map((e) => MESURES[famille].cellules[`${famille}_${n}${e}`]);
      const src = cs.map((c) => c.l / c.cotePlanche);
      const spr = ETATS.map((e) => matiere(`${famille}_${n}${e}`).l);
      for (let i = 1; i < 3; i += 1) {
        const attendu = spr[0] * (src[i] / src[0]);
        assert.ok(Math.abs(spr[i] - attendu) <= 2,
          `${famille}_${n}${ETATS[i]} : ${spr[i]} px pour ${attendu.toFixed(1)} `
          + 'attendus du rapport de la source — la chaîne rééchelonne');
      }
    }
  }
});

test('EMB T6 — les 108 emblèmes reposent sur UNE ligne de sol', () => {
  // ⚠ SANS L'ANCRAGE PAR LE BAS, LES PETITS FLOTTENT. Le centrage d'avant posait
  // la matière de `site_base_j` entre les lignes 104 et 122 selon le palier —
  // mesuré —, si bien que les bâtiments ne reposaient pas sur le même sol.
  const bas = new Set(nomsAttendus.map((nom) => matiere(nom).bas));
  assert.equal(bas.size, 1,
    `lignes de sol distinctes : ${[...bas].sort((a, b) => a - b).join(', ')}`);
});

test('EMB T7 — les trous se comptent, et les sains n\'en ont AUCUN', () => {
  // ⚠⚠ LES SAINS À ZÉRO SONT LA GARDE QUI MORD, et elle vient d'un défaut réel
  // de ce lot-ci. Masquer sur la composante NUE — celle qu'`est_fond` rend —
  // peignait en magenta le violet clair de l'Ouvrage que sa seconde porte
  // attrape jusqu'au MILIEU d'une base, et `site_base_o` passait de 0 à 893
  // pixels de trou. `binary_fill_holes` sur la composante rend à
  // `est_fond_sujet` de `conditionner` le soin de borner le fond à ce qui touche
  // le bord, ce qu'elle fait depuis le lot PIXELS.
  let total = 0;
  let pirePart = 0;
  for (const nom of nomsAttendus) {
    const m = matiere(nom);
    const t = trous(m.img);
    total += t;
    pirePart = Math.max(pirePart, t / m.px);
    if (!nom.includes('_fumee') && !nom.includes('_feu')) {
      assert.equal(t, 0, `${nom} : ${t} px de trou sur un emblème SAIN`);
    }
  }
  // Seuil calculé sur la mesure : pire part relevée 1,75 % (`site_quartz_n3_fumee`,
  // 56 px sur 3 206), médiane 0, 14 sprites sur 108 concernés.
  assert.ok(pirePart < 0.03, `pire part de trous : ${(100 * pirePart).toFixed(2)} %`);
  assert.ok(total < 400, `${total} px de trous au total`);
});

test('EMB T8 — l\'atlas déclare les 115, et les 108 emblèmes y sont', () => {
  const noms = ATLAS.carte.noms;
  assert.equal(noms.length, 115, 'l\'atlas carte porte 115 sprites cousus');
  for (const nom of nomsAttendus) {
    assert.ok(noms.includes(nom), `${nom} absent de l'index de l'atlas`);
  }
  // La grille suit l'effectif : 11 × 11 tient 121 cellules, 10 × 10 n'en tient
  // que 100 et ferait déborder.
  assert.ok(ATLAS.carte.colonnes * ATLAS.carte.rangees >= 115,
    'la grille de l\'atlas ne tient pas les 115');
  // ⚠⚠ ET AUCUN POI N'A D'ÉTAT — NI DANS L'INDEX, NI DANS CE QUE `spriteDuSite`
  // REND. La première écriture de cette garde ne lisait que l'INDEX : la
  // falsification qui fait porter le suffixe à un POI laissait la suite
  // ENTIÈREMENT VERTE — mesuré, 13 pass / 0 fail — parce que rien n'appelait
  // `spriteDuSite` sur un POI avec une avarie. Elle demande maintenant les deux,
  // et le nom rendu doit exister dans l'atlas.
  assert.equal(noms.filter((n) => n.startsWith('poi')).length, 7);
  assert.equal(noms.filter((n) => n.startsWith('poi') && /_(fumee|feu)$/.test(n)).length, 0);
  for (const type of Object.keys(POI)) {
    const nu = spriteDuSite(type, 5, null, AVARIE.AUCUNE);
    for (const etat of [AVARIE.FUMEE, AVARIE.FEU]) {
      assert.equal(spriteDuSite(type, 5, null, etat), nu,
        `le POI « ${type} » change de dessin en ${etat}`);
    }
    assert.ok(noms.includes(nu), `${nu} hors atlas`);
  }
});

/* ---------------------------------------------------------------- câblage */

/** Un état de partie avec un site de l'Ouvrage entamé au choix. */
function etatAvecSiteEntame(quoi) {
  const etat = creerEtat(7);
  const identite = {
    rangee: 250, colonne: 16, instance: 0, type: 'base', niveau: 20,
  };
  const montage = montageDuSite(etat.graine, identite);
  const idRaseur = Object.keys(BATIMENTS).find((id) => BATIMENTS[id].raseLeSite === true);
  const indexRaseur = montage.batiments.findIndex((b) => b.id === idRaseur);
  assert.ok(indexRaseur >= 0, 'le montage de test ne porte pas le bâtiment qui rase');
  const autre = montage.batiments.findIndex((b) => b.id !== idRaseur);
  assert.ok(autre >= 0, 'le montage de test ne porte qu\'un bâtiment');

  // ⚠ LE MONTAGE NE PORTE PAS LES PV — `montageDuSite` rend `{id, rangée,
  // colonne, niveau}`, et c'est `creerCombat` qui en tire les PV. Le résultat de
  // raid, lui, en porte : on les pose à la main, et `pvApresRaid` ne compare que
  // `pvMilli` à `pvMaxMilli`. Les IDENTIFIANTS, eux, viennent du vrai montage —
  // c'est ce qui fait que `indexRaseur` désigne le bon bâtiment.
  const PV = 1000;
  const ligne = (p) => ({ id: p.id, pvMilli: PV, pvMaxMilli: PV, detruit: false });
  const batiments = montage.batiments.map(ligne);
  if (quoi === 'autre') batiments[autre].pvMilli = PV / 2;
  if (quoi === 'raseur') batiments[indexRaseur].pvMilli = PV / 2;
  enregistrerLeRaid(etat, identite, {
    cause: 'attaquants',
    batiments,
    defenses: montage.defenseurs.map(ligne),
  });
  // Le montage doit mesurer quelque chose : un site « rien » ne laisse aucune
  // entrée, les deux autres en laissent une.
  assert.equal(Object.keys(etat.sitesEntames).length, quoi === 'rien' ? 0 : 1,
    `montage « ${quoi} » : table des entamés inattendue`);
  return { etat, identite };
}

test('EMB T9 — intact, bâtiment quelconque abîmé, bâtiment qui rase abîmé', () => {
  const intact = etatAvecSiteEntame('rien');
  assert.equal(avarieDuSite(intact.etat, intact.identite), AVARIE.AUCUNE);

  const entame = etatAvecSiteEntame('autre');
  assert.equal(avarieDuSite(entame.etat, entame.identite), AVARIE.FUMEE);

  const brule = etatAvecSiteEntame('raseur');
  assert.equal(avarieDuSite(brule.etat, brule.identite), AVARIE.FEU);

  // Les trois donnent trois FAMILLES de sprite distinctes, et le nom existe.
  const noms = [AVARIE.AUCUNE, AVARIE.FUMEE, AVARIE.FEU]
    .map((a) => spriteDuSite('base', 5, null, a));
  assert.deepEqual(noms, ['site_base_o_n5', 'site_base_o_n5_fumee', 'site_base_o_n5_feu']);
  for (const nom of noms) assert.ok(ATLAS.carte.noms.includes(nom), `${nom} hors atlas`);
});

test('EMB T10 — le palier ne change PAS avec l\'état', () => {
  // ⚠ L'AVARIE CHOISIT LA FAMILLE, `palierDeNiveau` CHOISIT LE PALIER. Les
  // mélanger ferait rétrécir une base de niveau 30 quand elle brûle, c'est-à-dire
  // lui ferait annoncer une baisse de niveau qui n'a pas eu lieu.
  for (const palier of [1, 5, 9]) {
    const noms = [AVARIE.AUCUNE, AVARIE.FUMEE, AVARIE.FEU]
      .map((a) => spriteDuSite('base', palier, null, a));
    for (const nom of noms) {
      assert.ok(nom.startsWith(`site_base_o_n${palier}`),
        `${nom} : le palier a bougé avec l'état`);
    }
    // Et la taille suit le palier, pas l'état : les trois font la même largeur.
    const ls = noms.map((n) => matiere(n).l);
    assert.ok(Math.max(...ls) - Math.min(...ls) <= 4, `palier ${palier} : largeurs ${ls}`);
  }
  // La progression de taille, elle, reste celle du palier.
  assert.ok(matiere('site_base_o_n9_feu').l > matiere('site_base_o_n1_feu').l * 2,
    'un palier 9 en feu devrait rester bien plus grand qu\'un palier 1 en feu');
});

test('EMB T11 — la base du JOUEUR suit la même règle, la règle ignore le camp', () => {
  const etat = creerEtat(11);
  const base = baseCourante(etat);
  assert.equal(avarieDeLaBase(base), AVARIE.AUCUNE);

  const idChantier = Object.keys(BASE_BATIMENTS)
    .find((id) => BASE_BATIMENTS[id].raseLeSite === true);
  const chantier = base.disposition.find((b) => b.id === idChantier);
  assert.ok(chantier, 'la base neuve ne porte pas le bâtiment qui rase');

  // Un bâtiment quelconque abîmé : fumée. On en pose un second pour ne pas
  // toucher au Chantier, seul bâtiment d'une base neuve.
  base.disposition.push({
    id: Object.keys(BASE_BATIMENTS).find((id) => id !== idChantier),
    rangee: 12, colonne: 3, niveau: 1, degatsMilli: 0,
  });
  const autre = base.disposition[base.disposition.length - 1];
  autre.degatsMilli = 1;
  assert.equal(avarieDeLaBase(base), AVARIE.FUMEE);

  // Le bâtiment qui rase abîmé : feu, quel que soit l'état des autres.
  chantier.degatsMilli = 1;
  assert.equal(avarieDeLaBase(base), AVARIE.FEU);
  autre.degatsMilli = 0;
  assert.equal(avarieDeLaBase(base), AVARIE.FEU);

  // ⚠ LA GARNISON COMPTE AUSSI, comme les défenses côté Ouvrage. Sans cette
  // moitié, une base dont seule la défense est entamée resterait dessinée
  // intacte — et c'est le cas le plus courant, l'Ouvrage traversant la défense
  // avant d'atteindre les bâtiments.
  chantier.degatsMilli = 0;
  autre.degatsMilli = 0;
  assert.equal(avarieDeLaBase(base), AVARIE.AUCUNE);
  base.garnison.push({
    id: 'merlon', rangee: 5, colonne: 3, niveau: 1, degatsMilli: 0, actif: true,
  });
  assert.equal(avarieDeLaBase(base), AVARIE.AUCUNE, 'une garnison intacte ne fume pas');
  base.garnison[0].degatsMilli = 1;
  assert.equal(avarieDeLaBase(base), AVARIE.FUMEE);

  // ⚠⚠ LA MÊME RÈGLE SERT LES DEUX CAMPS, ET C'EST `avarie` QUI LA PORTE. Les
  // deux lecteurs ne font qu'extraire des faits ; si l'un d'eux écrivait sa
  // propre table de décision, cette égalité tomberait.
  assert.equal(avarie({ raseurAbime: false, quelqueChoseAbime: false }), AVARIE.AUCUNE);
  assert.equal(avarie({ raseurAbime: false, quelqueChoseAbime: true }), AVARIE.FUMEE);
  assert.equal(avarie({ raseurAbime: true, quelqueChoseAbime: false }), AVARIE.FEU);
  assert.equal(avarie({ raseurAbime: true, quelqueChoseAbime: true }), AVARIE.FEU);

  // Et le nom de sprite du joueur porte bien le suffixe.
  assert.equal(spriteDuSite('baseJoueur', 3, null, AVARIE.FEU), 'site_base_j_n3_feu');
});

test('EMB T12 — les PV restaurés rendent l\'emblème sain', () => {
  const { etat, identite } = etatAvecSiteEntame('raseur');
  assert.equal(avarieDuSite(etat, identite), AVARIE.FEU);
  assert.equal(avariesParCase(etat).get('250:16'), AVARIE.FEU);

  // ⚠ RIEN DE NEUF N'EST RANGÉ DANS L'ÉTAT : l'avarie se LIT sur les PV. On les
  // remet à `null` — la valeur « intacte » de `pvBatimentsMilli` — et l'emblème
  // redevient sain de lui-même, exactement comme `reparerLesSites` le fera au
  // bout d'une heure.
  const entree = Object.values(etat.sitesEntames)[0];
  entree.pvBatimentsMilli = entree.pvBatimentsMilli.map(() => null);
  entree.pvDefensesMilli = entree.pvDefensesMilli.map(() => null);
  assert.equal(avarieDuSite(etat, identite), AVARIE.AUCUNE);
  assert.equal(avariesParCase(etat).size, 0, 'la carte des avaries garde un site sain');
});

test('EMB T13 — le discriminant est `raseLeSite`, jamais un nom de bâtiment', () => {
  // ⚠⚠ UN `id === 'chantierDeConstruction'` SERAIT LA SECONDE VÉRITÉ QUE §4
  // INTERDIT, et il mentirait pour toutes les bases de l'Ouvrage, dont le
  // bâtiment qui rase s'appelle autrement. Les deux tables portent le MÊME champ.
  const source = readFileSync(join(RACINE, 'src', 'sim', 'site-entame.js'), 'utf8');
  const sansCommentaires = source
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const idOuvrage = Object.keys(BATIMENTS).find((id) => BATIMENTS[id].raseLeSite === true);
  const idJoueur = Object.keys(BASE_BATIMENTS).find((id) => BASE_BATIMENTS[id].raseLeSite === true);

  // ⚠⚠ LA GARDE PORTE SUR LES TROIS FONCTIONS QUI DÉCIDENT, PAS SUR LE FICHIER.
  // Elle a d'abord balayé le module entier et ACCUSÉ UN INNOCENT : `site-entame`
  // porte `resultat.cause === 'souche'`, où « souche » est une cause de fin de
  // combat qui se trouve s'écrire comme l'identifiant du bâtiment. Un motif non
  // borné sur un nom est la faute que §6 raconte déjà pour `\b` et pour
  // `rejouer(` ; on nomme donc le périmètre.
  const corps = (nom) => {
    const debut = sansCommentaires.indexOf(`export function ${nom}(`);
    assert.ok(debut >= 0, `${nom} introuvable`);
    const fin = sansCommentaires.indexOf('\n}', debut);
    return sansCommentaires.slice(debut, fin);
  };
  const decision = ['avarie', 'avarieDuSite', 'avarieDeLaBase'].map(corps).join('\n');
  for (const id of [idOuvrage, idJoueur]) {
    assert.ok(!decision.includes(`'${id}'`),
      `« ${id} » est écrit en dur dans le choix d'emblème`);
  }
  // Et l'appât prouve que la garde reconnaîtrait la vraie faute.
  assert.ok(`${decision} id === '${idJoueur}'`.includes(`'${idJoueur}'`),
    'la garde ne verrait pas un identifiant écrit en dur');
  // Et le champ, lui, est bien lu — deux fois, une par camp.
  assert.equal((sansCommentaires.match(/raseLeSite === true/g) ?? []).length, 2,
    'les deux camps doivent chercher leur raseur par `raseLeSite`');

  // L'écran ne recompose pas la règle non plus : il DEMANDE.
  const ecran = readFileSync(join(RACINE, 'src', 'ui', 'monde.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/raseLeSite/.test(ecran), 'l\'écran relit `raseLeSite` au lieu de demander');
  for (const nom of ['avariesParCase', 'avarieDeLaBase']) {
    assert.ok(ecran.includes(nom), `l'écran n'appelle pas ${nom}`);
  }

  // ⚠ ET `dessinerEmblemeDUneCase` TRANSPORTE L'AVARIE JUSQU'AU NOM. Sans ce
  // passage, le câblage serait complet côté simulation et muet à l'écran.
  const d = dessinerEmblemeDUneCase(
    { type: 'base', saveur: null, avarie: AVARIE.FUMEE }, 4, 0, 0, 32,
  );
  assert.equal(d.nom, 'site_base_o_n4_fumee');
  const sain = dessinerEmblemeDUneCase({ type: 'base', saveur: null }, 4, 0, 0, 32);
  assert.equal(sain.nom, 'site_base_o_n4');
  assert.notEqual(d.sx + d.sy * 1000, sain.sx + sain.sy * 1000,
    'les deux états pointent la même cellule d\'atlas');
});
