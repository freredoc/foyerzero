// Lot PAQUETS — 09/09/2026. Ethan : « un ratio de destruction trop grand »,
// puis « ce n'est pas un problème de ligne et colonne mais de placement — des
// paquets de 3-4, quelques-uns au fond, quelques-uns devant ».
//
// ⚠⚠ CE FICHIER GARDE UNE MESURE, PAS UNE INTUITION. Chaque seuil vient du
// balayage joué sur le placement livré, et le nombre mesuré est écrit à côté
// du seuil : une garde qui dirait « plus d'un » resterait verte sur une
// silhouette figée. Les onze tests PQ reprennent ce que les tests retirés du
// modèle ligne/colonne gardaient — voir `RAPPORT-lotPAQUETS.md` §6 pour la
// correspondance test par test.

import test from 'node:test';
import assert from 'node:assert/strict';

import { genererSite, densite, SEL_PLACEMENT_DES_RANGEES, tiersDeLaDefense } from '../src/sim/generateur.js';
import { hachageBrut } from '../src/sim/peuplement.js';
import { creerRng, entier, melanger } from '../src/sim/rng.js';
import { cleCase } from '../src/sim/grille.js';
import { GRILLE, OBSTACLES, DEFENSES } from '../src/data/combat.js';
import { DISPOSITION_DEFENSES, FORMES_DE_PAQUET, BATIMENTS } from '../src/data/sites.js';
import {
  creerEtat, serialiser, migrer, charger, SAVE_VERSION,
} from '../src/sim/state.js';

// ---------------------------------------------------------------------------
// Outils
// ---------------------------------------------------------------------------

const BANDE_DEFENSE = GRILLE.bandes.defense;
const BANDE_BATIMENTS = GRILLE.bandes.batiments;
const categorieDe = (id) => DEFENSES[id]?.type ?? 'unite';
const site = (type, niveau, graine) => genererSite({
  type, niveau, saveur: type === 'base' ? null : 'richeQuartz', graine,
});
const tchebychev = (a, b) => Math.max(Math.abs(a.rangee - b.rangee), Math.abs(a.colonne - b.colonne));

/** Le profil d'occupation d'une bande : un compte par rangée. */
function profil(entites, bande) {
  const comptes = new Array(bande.derniere - bande.premiere + 1).fill(0);
  for (const e of entites) comptes[e.rangee - bande.premiere] += 1;
  return comptes.join(',');
}

const mediane = (xs) => {
  const t = [...xs].sort((a, b) => a - b);
  return t[Math.floor(t.length / 2)];
};

// ---------------------------------------------------------------------------
// PQ T1 — la Souche parcourt les huit rangées, sans en préférer une
// ---------------------------------------------------------------------------

// ⚠⚠ C'EST LE TEST QUI REPREND « Souche et Étai au fond » DE `T4`, `CR T5`,
// `COL T18` ET `DO T6`, DANS L'AUTRE SENS. Avant le lot, 240 montages sur 240
// posaient la Souche en rangée 18. Mesuré, base n.30, 500 graines :
// 11:83 · 12:59 · 13:53 · 14:52 · 15:73 · 16:73 · 17:75 · 18:32 — le maximum
// vaut 16,6 % (rangée 11) et le fond n'est plus que la rangée la moins servie.
test('PQ T1 — la Souche atteint les huit rangées de sa bande, aucune au-delà de 25 %', () => {
  const GRAINES = 500;
  const parRangee = new Map();
  for (let g = 1; g <= GRAINES; g += 1) {
    const s = site('base', 30, g).batiments.find((b) => b.id === 'souche');
    assert.ok(s.rangee >= BANDE_BATIMENTS.premiere && s.rangee <= BANDE_BATIMENTS.derniere,
      `graine ${g} : la Souche en rangée ${s.rangee}, hors de la bande`);
    parRangee.set(s.rangee, (parRangee.get(s.rangee) ?? 0) + 1);
  }
  assert.equal(parRangee.size, BANDE_BATIMENTS.derniere - BANDE_BATIMENTS.premiere + 1,
    `la Souche n'atteint que ${parRangee.size} rangées sur 8`);
  const pire = Math.max(...parRangee.values());
  assert.ok(pire <= GRAINES * 0.25,
    `une rangée porte la Souche ${pire} fois sur ${GRAINES}, au-delà du quart — mesuré 83 au plus`);
});

// ---------------------------------------------------------------------------
// PQ T2 — les deux uniques se touchent une fois sur trois, à peu près
// ---------------------------------------------------------------------------

// `uniquesDansLeMemePaquetUneFoisSur` vaut 3 : un tirage sur trois les met dans
// le MÊME paquet, où ils sont voisins ; sinon deux paquets distincts, répulsés.
// « Collés » se mesure en Tchebychev ≤ 1. Mesuré, base n.30, 500 graines :
// 32,2 % — au-dessus du tiers strict parce que deux paquets distincts peuvent se
// toucher aussi (le repli case par case et la répulsion plafonnée à 4 le
// permettent). Le seuil est une fourchette, 15 à 35 %, écrite en clair.
test('PQ T2 — Souche et Étai sont collés entre 15 et 35 % du temps', () => {
  const GRAINES = 500;
  let colles = 0;
  for (let g = 1; g <= GRAINES; g += 1) {
    const m = site('base', 30, g);
    const s = m.batiments.find((b) => b.id === 'souche');
    const e = m.batiments.find((b) => b.id === 'etai');
    if (tchebychev(s, e) <= 1) colles += 1;
  }
  const part = (colles / GRAINES) * 100;
  assert.ok(part >= 15 && part <= 35, `${part.toFixed(1)} % de montages aux uniques collés — mesuré 32,2 %`);
  // ⚠ ET LE BOUTON MORD : à « une fois sur un », ils seraient collés partout.
  assert.equal(DISPOSITION_DEFENSES.uniquesDansLeMemePaquetUneFoisSur, 3);
});

// ---------------------------------------------------------------------------
// PQ T3 — au niveau 1, les profils d'occupation varient
// ---------------------------------------------------------------------------

// ⚠⚠ C'EST `CR T1` ET `DO T1` REPRIS SUR LE SITE LE PLUS PETIT. Une base de
// niveau 1 porte 11 bâtiments et 6 défenses — le brief mesurait 56 profils de
// bâtiments et 47 de défenses sur 500 graines AVANT le lot, sous le bloc
// flottant. Mesuré après : **471 / 248**. Les seuils, 300 et 150, sont à
// mi-chemin et tombent si le placement redevient un bloc.
test('PQ T3 — base n.1, 500 graines : au moins 300 profils de bâtiments et 150 de défenses', () => {
  const GRAINES = 500;
  const d = densite('base', 1);
  const pb = new Set();
  const pd = new Set();
  for (let g = 1; g <= GRAINES; g += 1) {
    const m = site('base', 1, g);
    assert.equal(m.batiments.length, d.batiments);
    assert.equal(m.defenseurs.length, d.defenses);
    pb.add(profil(m.batiments, BANDE_BATIMENTS));
    pd.add(profil(m.defenseurs, BANDE_DEFENSE));
  }
  assert.ok(pb.size >= 300, `${pb.size} profils de bâtiments sur ${GRAINES} — 56 avant le lot, 471 mesuré`);
  assert.ok(pd.size >= 150, `${pd.size} profils de défenses sur ${GRAINES} — 47 avant le lot, 248 mesuré`);
});

// ---------------------------------------------------------------------------
// PQ T4 — les plafonds de rangée tiennent : 6 en défense, 9 aux bâtiments
// ---------------------------------------------------------------------------

// Reprend `T6`, `CR T4`, `COL T16` et `DO T5` : `occupantsMaxParRangee` reste 6,
// et il est ÉCRIT EN CLAIR — une garde qui lit son seuil dans la table qu'elle
// garde ne le verrait pas se relâcher. Les bâtiments plafonnent à la largeur.
test('PQ T4 — six occupants par rangée de défense, neuf par rangée de bâtiments', () => {
  assert.equal(DISPOSITION_DEFENSES.occupantsMaxParRangee, 6, 'le plafond de rangée a bougé');
  let pire6 = 0; let pire9 = 0;
  for (const type of ['camp', 'avantPoste', 'base']) {
    for (let niveau = 1; niveau <= 50; niveau += 1) {
      for (let g = 1; g <= 5; g += 1) {
        const m = site(type, niveau, g);
        const rd = new Map(); const rb = new Map();
        for (const d of m.defenseurs) rd.set(d.rangee, (rd.get(d.rangee) ?? 0) + 1);
        for (const b of m.batiments) rb.set(b.rangee, (rb.get(b.rangee) ?? 0) + 1);
        for (const [r, n] of rd) {
          assert.ok(n <= 6, `${type} n.${niveau} g${g} : ${n} défenses en rangée ${r}`);
          pire6 = Math.max(pire6, n);
        }
        for (const [r, n] of rb) {
          assert.ok(n <= GRILLE.largeur, `${type} n.${niveau} g${g} : ${n} bâtiments en rangée ${r}`);
          pire9 = Math.max(pire9, n);
        }
      }
    }
  }
  // Et les deux plafonds sont ATTEINTS — sans quoi ils seraient décoratifs.
  assert.equal(pire6, 6, `plafond de défense atteint à ${pire6}`);
  assert.equal(pire9, 9, `plafond de bâtiments atteint à ${pire9}`);
});

// ---------------------------------------------------------------------------
// PQ T5 — la charge des colonnes reste bornée
// ---------------------------------------------------------------------------

// Reprend `T8`, `CR T4` et `COL T16`, où `ecartColonnesMax` valait 2. Le plafond
// par colonne est `⌈N/9⌉ + margeDeColonne` ; l'écart max-min qui en résulte est
// mesuré sur six cellules × 500 graines : max 7 (base n.50), médiane ≤ 3.
test('PQ T5 — écart de charge entre colonnes ≤ 7, médiane ≤ 4, sur 3 000 montages', () => {
  assert.equal(DISPOSITION_DEFENSES.margeDeColonne, 2, 'la marge de colonne a bougé');
  let pire = 0;
  for (const [type, niveau] of [['camp', 1], ['camp', 20], ['camp', 50], ['base', 1], ['base', 20], ['base', 50]]) {
    const ecarts = [];
    for (let g = 1; g <= 500; g += 1) {
      const m = site(type, niveau, g);
      for (const groupe of [m.batiments, m.defenseurs]) {
        const charge = new Array(GRILLE.largeur).fill(0);
        for (const e of groupe) charge[e.colonne - 1] += 1;
        ecarts.push(Math.max(...charge) - Math.min(...charge));
      }
    }
    const max = Math.max(...ecarts);
    pire = Math.max(pire, max);
    assert.ok(max <= 7, `${type} n.${niveau} : écart de ${max} entre colonnes`);
    assert.ok(mediane(ecarts) <= 4, `${type} n.${niveau} : médiane des écarts ${mediane(ecarts)}`);
  }
  // Écrit en clair : le pire des six cellules.
  assert.equal(pire, 7, `pire écart ${pire} — mesuré 7 sur base n.50`);
});

// ---------------------------------------------------------------------------
// PQ T6 — l'ordre des catégories survit en MOYENNE, et chaque tiers voit tout
// ---------------------------------------------------------------------------

// ⚠⚠ C'EST CE QUI REMPLACE L'ORDRE STRICT DE `T7`, `CR T3` ET `DO T4`. Les
// poids de `poidsDeTiers` sont calibrés pour que les cinq moyennes de rangée
// restent séparées d'au moins 0,3 dans l'ordre d'`ordreCategories`. Mesuré,
// base n.40, 500 graines : artillerie 8,25 · tourelle 7,53 · unité 6,06 ·
// mur 5,54 · barrière 4,86 — et chaque catégorie paraît à l'AVANT (rangées
// 3–5) comme à l'ARRIÈRE (8–10) : l'artillerie devant 108 fois, la barrière
// derrière 168 fois. C'est « quelques-uns au fond, quelques-uns devant ».
test('PQ T6 — cinq moyennes ordonnées à 0,3 rangée près, et chaque catégorie devant ET derrière', () => {
  const tiers = tiersDeLaDefense();
  const rangees = {}; const avant = {}; const arriere = {};
  for (let g = 1; g <= 500; g += 1) {
    for (const d of site('base', 40, g).defenseurs) {
      const c = categorieDe(d.id);
      (rangees[c] ??= []).push(d.rangee);
      if (d.rangee <= tiers.avant.derniere) avant[c] = (avant[c] ?? 0) + 1;
      if (d.rangee >= tiers.arriere.premiere) arriere[c] = (arriere[c] ?? 0) + 1;
    }
  }
  const ordre = DISPOSITION_DEFENSES.ordreCategories;
  const moyennes = ordre.map((c) => {
    assert.ok(rangees[c]?.length > 100, `${c} : ${rangees[c]?.length ?? 0} pièces, le montage ne mesure rien`);
    return rangees[c].reduce((a, b) => a + b, 0) / rangees[c].length;
  });
  for (let i = 1; i < ordre.length; i += 1) {
    assert.ok(moyennes[i - 1] >= moyennes[i] + 0.3,
      `${ordre[i - 1]} en moyenne en ${moyennes[i - 1].toFixed(2)}, ${ordre[i]} en ${moyennes[i].toFixed(2)} : `
      + 'les tiers ne séparent plus les catégories');
  }
  for (const c of ordre) {
    assert.ok((avant[c] ?? 0) > 0, `${c} n'est jamais à l'avant`);
    assert.ok((arriere[c] ?? 0) > 0, `${c} n'est jamais à l'arrière`);
  }
  // ⚠ ET LES TIERS SONT DÉRIVÉS DE LA BANDE, PAS ÉCRITS : 3–5 · 6–7 · 8–10.
  assert.deepEqual(tiers, {
    avant: { premiere: 3, derniere: 5 }, milieu: { premiere: 6, derniere: 7 }, arriere: { premiere: 8, derniere: 10 },
  });
});

// ---------------------------------------------------------------------------
// PQ T7 — le placement ne touche pas à la composition
// ---------------------------------------------------------------------------

// ⚠⚠ C'EST LA GARDE QUI PROTÈGE LES SAUVEGARDES : `site-entame.js` range les PV
// par INDICE dans le montage régénéré. Le flux `rng` ne sert plus qu'à
// `composerRepartition` ; tout ce qui place tire sur `placement`. On tourne
// TOUS les boutons du placement — candidats, tailles, poids, marge, répulsion —
// et les identifiants doivent rester ceux d'avant, dans le même ordre.
// ⚠ Le SEL du flux de placement est une constante exportée, non modifiable
// d'ici : ce test tourne les boutons de la table à la place, ce qui déplace
// le placement sans changer d'un tirage la consommation de `rng`.
test('PQ T7 — tourner tous les boutons du placement laisse les identifiants intacts', () => {
  const ids = (m) => [m.batiments.map((b) => b.id).join(','), m.defenseurs.map((d) => d.id).join(',')].join('||');
  const cases = (m) => JSON.stringify([...m.batiments, ...m.defenseurs].map((e) => `${e.rangee},${e.colonne}`));
  const T = DISPOSITION_DEFENSES;
  const sauve = JSON.parse(JSON.stringify({
    candidatsParPaquet: T.candidatsParPaquet,
    poidsDeTiers: T.poidsDeTiers, margeDeColonne: T.margeDeColonne, repulsionMax: T.repulsionMax,
  }));
  const avant = [];
  for (const type of ['camp', 'avantPoste', 'base']) {
    for (const niveau of [3, 15, 30, 50]) {
      for (let g = 1; g <= 10; g += 1) avant.push(site(type, niveau, g));
    }
  }
  try {
    // ⚠ `tailleDePaquet` n'est PAS tourné : `nbPaquetsMax` en dérive, donc le
    // nombre de tirages du flux de placement aussi — c'est un réglage qui se
    // change avec `SAVE_VERSION`, pas un bouton.
    T.candidatsParPaquet = 4;
    T.poidsDeTiers = Object.fromEntries(Object.keys(T.poidsDeTiers).map((c) => [c, { avant: 1, milieu: 1, arriere: 1 }]));
    T.margeDeColonne = 4;
    T.repulsionMax = 2;
    let k = 0; let bougees = 0;
    for (const type of ['camp', 'avantPoste', 'base']) {
      for (const niveau of [3, 15, 30, 50]) {
        for (let g = 1; g <= 10; g += 1) {
          const apres = site(type, niveau, g);
          assert.equal(ids(apres), ids(avant[k]), `${type} n.${niveau} g${g} : la composition a suivi le placement`);
          if (cases(apres) !== cases(avant[k])) bougees += 1;
          k += 1;
        }
      }
    }
    assert.ok(bougees >= 100, `seulement ${bougees} montages sur 120 changent de cases : les boutons sont inertes`);
  } finally {
    Object.assign(T, sauve);
  }
});

// ---------------------------------------------------------------------------
// PQ T8 — le nombre de tirages du placement ne dépend que de (type, niveau)
// ---------------------------------------------------------------------------

// ⚠⚠ REPREND `DO T3 bis` SUR TROIS MILLE MONTAGES. Le placement tire tout
// d'avance : `nbPaquetsMax(N)` tailles, trois clés d'uniques, puis par paquet
// une clé de tiers et `candidatsParPaquet` triplets. Le repli ne tire rien. On
// le prouve par la QUEUE du flux : en sautant ce compte depuis le sel exporté,
// on retombe sur les obstacles du montage. Et le compte, lui, ne dépend que des
// effectifs de `densite`, donc de (type, niveau) — asserté sur les 3 000.
test('PQ T8 — trois mille montages : le compte de tirages est une fonction de (type, niveau)', () => {
  const { tailleDePaquet, candidatsParPaquet } = DISPOSITION_DEFENSES;
  const nbPaquetsMax = (nb) => (nb < tailleDePaquet.paquetUnique ? 1 : Math.ceil(nb / tailleDePaquet.min));
  const tirages = (nb, uniques) => (nb === 0 ? 0 : nbPaquetsMax(nb) * (2 + 3 * candidatsParPaquet) + (uniques ? 3 : 0));
  let montages = 0;
  for (const type of ['camp', 'avantPoste', 'base']) {
    for (const niveau of [1, 6, 11, 16, 21, 26, 31, 36, 41, 46]) {
      const d = densite(type, niveau);
      const attendu = tirages(d.batiments, true) + tirages(d.defenses, false);
      for (let g = 1; g <= 100; g += 1) {
        const graine = hachageBrut(g, niveau, 0, SEL_PLACEMENT_DES_RANGEES + 2);
        const m = genererSite({ type, niveau, graine });
        montages += 1;
        assert.equal(tirages(m.batiments.length, true) + tirages(m.defenseurs.length, false), attendu,
          `${type} n.${niveau} g${g} : le compte de tirages dépend de la graine`);
        const rng = creerRng(hachageBrut(graine, 0, 0, SEL_PLACEMENT_DES_RANGEES));
        for (let k = 0; k < attendu; k += 1) entier(rng, 0, 1);
        const prises = new Set([...m.batiments, ...m.defenseurs].map((e) => cleCase(e.rangee, e.colonne)));
        const libres = [];
        for (let r = BANDE_DEFENSE.premiere; r <= BANDE_DEFENSE.derniere; r += 1) {
          for (let c = 1; c <= GRILLE.largeur; c += 1) if (!prises.has(cleCase(r, c))) libres.push({ rangee: r, colonne: c });
        }
        melanger(rng, libres);
        const obstacles = libres.slice(0, OBSTACLES.nombre).map((c) => ({
          rangee: c.rangee, colonne: c.colonne, type: OBSTACLES.types[entier(rng, 0, OBSTACLES.types.length - 1)],
        }));
        assert.deepEqual(m.obstacles, obstacles, `${type} n.${niveau} g${g} : la queue du flux est désynchronisée`);
      }
    }
  }
  assert.equal(montages, 3000);
});

// ---------------------------------------------------------------------------
// PQ T9 — déterminisme
// ---------------------------------------------------------------------------

test('PQ T9 — même graine, même site au bit près ; graine voisine, autre site', () => {
  for (const type of ['camp', 'avantPoste', 'base']) {
    for (const niveau of [2, 19, 37, 50]) {
      for (let g = 1; g <= 20; g += 1) {
        assert.deepEqual(site(type, niveau, g), site(type, niveau, g), `${type} n.${niveau} g${g}`);
        assert.notDeepEqual(site(type, niveau, g), site(type, niveau, g + 1000), `${type} n.${niveau} g${g} : graine sans effet`);
      }
    }
  }
});

// ---------------------------------------------------------------------------
// PQ T10 — intégrité sur trois mille montages
// ---------------------------------------------------------------------------

// Reprend `T2`, `T9`, `DO T4`, `DO T5`, `DO T7` et `DO T10` d'un seul balayage :
// effectifs de `densite`, bandes, aucune case partagée — obstacles compris —,
// plafonds, formes du catalogue valides, et aucune levée de
// `verifierLeRetraitDesPortees` (appelée par `genererSite` lui-même).
test('PQ T10 — trois mille montages : effectifs, bandes, cases uniques, aucune levée', () => {
  // Le catalogue est sain avant de servir.
  for (const [taille, formes] of Object.entries(FORMES_DE_PAQUET)) {
    for (const [nom, cases] of Object.entries(formes)) {
      assert.equal(cases.length, Number(taille), `forme ${nom} : ${cases.length} cases pour une taille ${taille}`);
      assert.equal(new Set(cases.map(([r, c]) => `${r},${c}`)).size, cases.length, `forme ${nom} : case répétée`);
    }
  }
  let montages = 0; let replisPossibles = 0;
  for (const type of ['camp', 'avantPoste', 'base']) {
    for (let niveau = 1; niveau <= 50; niveau += 1) {
      for (let g = 1; g <= 20; g += 1) {
        const graine = hachageBrut(g, niveau, 7, SEL_PLACEMENT_DES_RANGEES + 3);
        const m = genererSite({ type, niveau, graine });
        montages += 1;
        const d = densite(type, niveau);
        assert.equal(m.batiments.length, d.batiments, `${type} n.${niveau} : effectif de bâtiments`);
        assert.equal(m.defenseurs.length, d.defenses, `${type} n.${niveau} : effectif de défenses`);
        assert.equal(m.obstacles.length, OBSTACLES.nombre);
        const cases = new Set();
        for (const e of [...m.batiments, ...m.defenseurs, ...m.obstacles]) {
          const k = cleCase(e.rangee, e.colonne);
          assert.ok(!cases.has(k), `${type} n.${niveau} g${g} : case ${k} partagée`);
          cases.add(k);
          assert.ok(Number.isInteger(e.colonne) && e.colonne >= 1 && e.colonne <= GRILLE.largeur);
        }
        for (const b of m.batiments) {
          assert.ok(b.rangee >= BANDE_BATIMENTS.premiere && b.rangee <= BANDE_BATIMENTS.derniere,
            `${type} n.${niveau} g${g} : bâtiment en rangée ${b.rangee}`);
        }
        for (const x of [...m.defenseurs, ...m.obstacles]) {
          assert.ok(x.rangee >= BANDE_DEFENSE.premiere && x.rangee <= BANDE_DEFENSE.derniere,
            `${type} n.${niveau} g${g} : défense ou obstacle en rangée ${x.rangee}`);
        }
        const compte = new Map();
        for (const b of m.batiments) compte.set(b.id, (compte.get(b.id) ?? 0) + 1);
        assert.equal(compte.get('souche'), 1); assert.equal(compte.get('etai'), 1);
        if (d.defenses >= 30) replisPossibles += 1;
      }
    }
  }
  assert.equal(montages, 3000);
  assert.ok(replisPossibles > 300, 'le balayage ne porte pas de sites denses : le repli n\'est pas exercé');
  // Et l'inventaire ne varie pas d'un montage à l'autre : `BATIMENTS` reste la
  // seule source, `composerBatiments` n'a pas bougé.
  assert.ok(Object.keys(BATIMENTS).length >= 5);
});

// ---------------------------------------------------------------------------
// PQ T11 — la migration 29 → 30 vide les sites entamés, et rien d'autre
// ---------------------------------------------------------------------------

// ⚠⚠ `sitesEntames` RANGE LES PV PAR INDICE dans un montage que le placement
// régénère : un site entamé sous l'ancien placement remettrait ses dégâts sur
// d'autres pièces. La migration le vide ; `basesRasees` — une case retirée pour
// toujours, indépendante du placement — ne bouge pas. C'est la DERNIÈRE fois
// qu'un lot de placement bump `SAVE_VERSION` : le placement tire sur son propre
// flux, tout d'avance, et un lot qui le retouche ne change plus la composition.
test('PQ T11 — v29 → v30 : sitesEntames vidé, basesRasees intact, v30 inchangée', () => {
  assert.equal(SAVE_VERSION, 30);
  const etat = creerEtat(11);
  const v29 = JSON.parse(serialiser(etat, 1_700_000_000_000));
  v29.version = 29;
  v29.sitesEntames = { '200:16:1': { tickDuRaid: 5, pvBatimentsMilli: [1, 2], pvDefensesMilli: [3] } };
  v29.basesRasees = [{ rangee: 150, colonne: 4, vainqueur: 'joueur', niveau: 12, tick: 9, type: 'baseOuvrage' }];
  const migre = migrer(structuredClone(v29));
  assert.equal(migre.version, 30);
  assert.deepEqual(migre.sitesEntames, {}, 'le maillon v29 → v30 n\'a pas vidé les sites entamés');
  assert.deepEqual(migre.basesRasees, v29.basesRasees, 'la migration a touché basesRasees');
  // Une sauvegarde déjà en v30 traverse sans être réécrite.
  const v30 = JSON.parse(serialiser(etat, 1_700_000_000_000));
  v30.sitesEntames = { '1:1:1': { tickDuRaid: 1, pvBatimentsMilli: [], pvDefensesMilli: [] } };
  assert.deepEqual(migrer(structuredClone(v30)), v30, 'une v30 est réécrite');
  // Et la v29 se charge, ce qui est la seule chose que le joueur voit.
  assert.doesNotThrow(() => charger(JSON.stringify(v29), 1_700_000_000_000));
});
