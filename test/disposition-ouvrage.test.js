// Lot DISPOSITION-OUVRAGE — 08/09/2026, point 9 du relevé d'Ethan :
// « Malgré un patch, toutes les bases Ouvrage restent identiques : les unités de
// défense sont au fond, tous les bâtiments au premier rang, et souche et étai
// restent au fond. »
//
// ⚠⚠ CE FICHIER GARDE UNE MESURE, PAS UNE INTUITION. Les seuils de `DO T1`
// viennent du balayage du §3 du brief, joué AVANT d'écrire une ligne de
// générateur, et les nombres d'avant sont écrits en clair à côté de ceux
// d'après : une garde qui dirait seulement « plus d'un » resterait verte à deux
// silhouettes sur vingt.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import {
  genererSite, rangeeLaPlusAvanceeQuiTire, SEL_PLACEMENT_DES_RANGEES,
} from '../src/sim/generateur.js';
import { hachageBrut } from '../src/sim/peuplement.js';
import { graineDeLInstance, SEL_INSTANCE_DU_SITE } from '../src/sim/site-de-la-case.js';
import { SEL_RANGEE, SEL_COLONNE } from '../src/sim/poi.js';
import { SEL_TERRAIN_DU_SITE } from '../src/sim/saveur.js';
import { SEL_RAID_OUVRAGE } from '../src/sim/raid-ouvrage.js';
import { SEL_VARIANTE } from '../src/render/variante.js';
import { SEL_FOND } from '../src/render/fond.js';
import { SEL_BLOC, SEL_FAMILLE } from '../src/render/terrain.js';
import { creerRng, entier, melanger } from '../src/sim/rng.js';
import { cleCase } from '../src/sim/grille.js';
import { GRILLE, OBSTACLES, DEFENSES } from '../src/data/combat.js';
import { DISPOSITION_DEFENSES, BATIMENTS } from '../src/data/sites.js';
import { creerEtat } from '../src/sim/state.js';
import { montageCourant, enregistrerLeRaid, etatDuSite } from '../src/sim/site-entame.js';
import { creerCombat, resoudre } from '../src/sim/combat.js';

// ---------------------------------------------------------------------------
// Outils
// ---------------------------------------------------------------------------

const BANDE_DEFENSE = GRILLE.bandes.defense;
const FOND = GRILLE.bandes.batiments.derniere;
const PREMIERE_BAT = GRILLE.bandes.batiments.premiere;

/**
 * Vingt graines de cases distinctes, dérivées comme le JEU les dérive —
 * `graineDeLInstance(graine de partie, rangée, colonne, instance)`. Ce sont
 * celles du balayage du §3 : les seuils écrits plus bas se lisent sur ELLES, et
 * les recalculer sur d'autres graines ferait comparer deux mesures qui ne
 * portent pas sur le même échantillon.
 */
const VINGT_GRAINES = Array.from(
  { length: 20 },
  (_, k) => graineDeLInstance(1, 200 - k * 7, 1 + (k * 3) % 31, 1),
);

/** Soixante graines de cases, pour ce qui demande un échantillon plus large. */
const SOIXANTE_GRAINES = Array.from(
  { length: 60 },
  (_, k) => graineDeLInstance(1, 290 - k * 4, 1 + (k * 7) % 31, 1),
);

const rangeesDe = (entites) => [...new Set(entites.map((e) => e.rangee))]
  .sort((a, b) => a - b).join('-');

/** L'occupation case par case, bâtiments et défenses confondus. */
function silhouette(montage) {
  const lignes = [];
  for (let r = 1; r <= GRILLE.longueur; r += 1) {
    let ligne = '';
    for (let c = 1; c <= GRILLE.largeur; c += 1) {
      const pris = montage.batiments.some((b) => b.rangee === r && b.colonne === c)
        || montage.defenseurs.some((d) => d.rangee === r && d.colonne === c);
      ligne += pris ? '#' : '.';
    }
    lignes.push(ligne);
  }
  return lignes.join('/');
}

const categorieDe = (id) => DEFENSES[id]?.type ?? 'unite';
const distincts = (xs) => new Set(xs).size;

// ---------------------------------------------------------------------------
// DO T1 — vingt graines ne donnent plus la même silhouette
// ---------------------------------------------------------------------------

// ⚠⚠ LES SEUILS SORTENT DU BALAYAGE DU §3, JOUÉ AVANT LE LOT, ET LES DEUX
// COLONNES SONT ÉCRITES EN CLAIR. Sur les vingt graines de cases ci-dessus,
// nombre d'ensembles de rangées occupées DISTINCTS — bâtiments / défenses — et
// nombre de positions d'uniques distinctes :
//
//                        avant          après
//     camp       n.12    4 /  4   1     16 / 16   18
//     camp       n.20    4 /  3   1     18 / 18   18
//     camp       n.30    4 /  3   1     16 / 18   18
//     camp       n.45    5 /  4   1     15 / 15   18
//     avantPoste n.12    4 /  3   1     18 / 16   18
//     avantPoste n.20    5 /  3   1     15 / 19   18
//     avantPoste n.30    4 /  3   1     13 /  9   18
//     avantPoste n.45    4 /  3   1     13 /  7   18
//     base       n.12    4 /  3   1     18 / 17   18
//     base       n.20    5 /  4   1     15 / 17   18
//     base       n.30    4 /  3   1     13 /  8   18
//     base       n.45    3 /  2   1      9 /  3   18
//     ------------------------------------------------
//     somme             50 / 38  12    179 /163  216
//
// ⚠⚠ ET LE SEUIL N'EST PAS PLAT, PARCE QUE LA LIBERTÉ NE L'EST PAS. Lire la
// colonne « après » de bas en haut : `base n.45` ne rend que 3 ensembles de
// rangées de défenses — presque autant qu'avant. Ce n'est pas un réglage
// manqué, c'est la GÉOMÉTRIE : à ce niveau-là, les défenses remplissent sept ou
// huit des huit rangées de leur bande, donc le bloc n'a rien où flotter. Un
// seuil plat à 12 accuserait le lot d'un défaut que la densité du site
// explique ; un seuil plat à 3 serait vert sur le générateur d'hier.
//
// Le plancher se calcule donc sur la MARGE que le bloc laisse dans sa bande —
// `1 + 3 × marge`, plafonné à 12. Marge nulle : rien n'est exigé, et c'est
// honnête. Marge d'une rangée : quatre ensembles au moins, soit déjà au-dessus
// du meilleur relevé d'avant le lot (5 pour les bâtiments, 4 pour les défenses,
// et jamais les deux dans la même cellule). Marge de quatre rangées et plus :
// douze, soit plus du double du meilleur relevé d'avant.
const PLANCHER_PAR_MARGE = (marge) => Math.min(12, 1 + 3 * marge);

// Somme sur les douze cellules — mesurée 50 / 38 avant le lot, 179 / 163 après.
// Le seuil de 120 est plus du double de l'avant et laisse un tiers de marge sous
// l'après : c'est l'instrument émoussé qui tombe si le lot était défait en bloc.
//
// ⚠⚠ LOT PAQUETS (09/09) : LA SOMME TOMBE À 121 / 119, ET CE N'EST PAS UN RECUL
// DU LOT, C'EST L'INSTRUMENT QUI CHANGE DE NATURE. « Ensembles de rangées
// occupées distincts » mesurait un BLOC qui flotte ; des paquets répulsés
// couvrent la bande entière dès le niveau 30 (base n.45 : 3 / 1 ensembles),
// donc les ensembles convergent vers « toute la bande » pendant que les
// silhouettes, elles, restent 20 sur 20 distinctes. Le seuil de 120 N'EST PAS
// BAISSÉ : il reste tenu pour les BÂTIMENTS (121), et pour les DÉFENSES il est
// REMPLACÉ par un instrument qui mesure ce que les paquets font — le profil
// d'occupation par rangée (les huit comptes), distinct 20 sur 20 dans chacune
// des douze cellules, mesuré. `PQ T1` et `PQ T3` de `paquets.test.js`
// portent la même mesure sur 500 graines.
const SOMME_MINIMALE = 120;
const PROFILS_DISTINCTS_PAR_CELLULE = 20;
const profilDeRangee = (entites, premiere, hauteur) => {
  const comptes = new Array(hauteur).fill(0);
  for (const e of entites) comptes[e.rangee - premiere] += 1;
  return comptes.join(',');
};

// Positions d'uniques distinctes — **1 sur 20 avant, sur les DOUZE cellules** :
// 240 montages sur 240 posaient l'Étai en (18, 4) et la Souche en (18, 5). Un
// seuil de 12 est douze fois l'avant et six sur vingt sous l'après.
const SEUIL_UNIQUES_DISTINCTS = 12;

/** La marge médiane que le bloc laisse dans sa bande, sur les vingt montages. */
function margeMediane(montages, rangeesDe1, disponibles) {
  const marges = montages
    .map((m) => disponibles - new Set(rangeesDe1(m).map((e) => e.rangee)).size)
    .sort((a, b) => a - b);
  return marges[Math.floor(marges.length / 2)];
}

test('DO T1 — vingt graines ne donnent plus la même silhouette', () => {
  let sommeB = 0;
  let sommeD = 0;
  let cellules = 0;
  for (const type of ['camp', 'avantPoste', 'base']) {
    for (const niveau of [12, 20, 30, 45]) {
      const montages = VINGT_GRAINES.map((graine) => genererSite({ type, niveau, graine }));
      cellules += 1;

      const rB = distincts(montages.map((m) => rangeesDe(m.batiments)));
      const rD = distincts(montages.map((m) => rangeesDe(m.defenseurs)));
      sommeB += rB;
      sommeD += rD;

      const margeB = margeMediane(
        montages, (m) => m.batiments.filter((b) => b.rangee !== FOND), FOND - PREMIERE_BAT,
      );
      const margeD = margeMediane(
        montages, (m) => m.defenseurs, BANDE_DEFENSE.derniere - BANDE_DEFENSE.premiere + 1,
      );
      assert.ok(
        rB >= PLANCHER_PAR_MARGE(margeB),
        `${type} n.${niveau} : ${rB} ensembles de rangées de BÂTIMENTS sur 20 pour une `
        + `marge de ${margeB} rangées — plancher ${PLANCHER_PAR_MARGE(margeB)}`,
      );
      assert.ok(
        rD >= PLANCHER_PAR_MARGE(margeD),
        `${type} n.${niveau} : ${rD} ensembles de rangées de DÉFENSES sur 20 pour une `
        + `marge de ${margeD} rangées — plancher ${PLANCHER_PAR_MARGE(margeD)}`,
      );

      const profilsD = distincts(montages.map((m) => profilDeRangee(
        m.defenseurs, BANDE_DEFENSE.premiere, BANDE_DEFENSE.derniere - BANDE_DEFENSE.premiere + 1,
      )));
      assert.equal(profilsD, PROFILS_DISTINCTS_PAR_CELLULE,
        `${type} n.${niveau} : ${profilsD} profils d'occupation de DÉFENSES sur 20`);

      const uniques = distincts(montages.map((m) => m.batiments
        .filter((b) => BATIMENTS[b.id].unique)
        .map((b) => `${b.id}@${b.rangee}:${b.colonne}`).sort().join(',')));
      assert.ok(
        uniques >= SEUIL_UNIQUES_DISTINCTS,
        `${type} n.${niveau} : ${uniques} positions d'uniques sur 20, `
        + `seuil ${SEUIL_UNIQUES_DISTINCTS} — Souche et Étai sont figés`,
      );

      // ⚠ ET LA SILHOUETTE COMPLÈTE ÉTAIT DÉJÀ TOUTE DISTINCTE AVANT LE LOT —
      // 20 sur 20, mesuré. Ce n'est donc PAS elle qu'Ethan décrit, et l'asserter
      // seule aurait rendu ce test vert sur le générateur d'hier. Elle reste
      // gardée pour que le lot ne perde pas cet acquis-là.
      assert.equal(
        distincts(montages.map(silhouette)), 20,
        `${type} n.${niveau} : deux graines rendent la même occupation case par case`,
      );
    }
  }
  assert.equal(cellules, 12);
  // ⚠ ET L'INSTRUMENT ÉMOUSSÉ, POUR QUE LES PLANCHERS PAR MARGE NE PUISSENT PAS
  // TOUS ÊTRE VACUEUX À LA FOIS : la somme sur les douze cellules.
  assert.ok(sommeB >= SOMME_MINIMALE,
    `${sommeB} ensembles de rangées de bâtiments en tout, seuil ${SOMME_MINIMALE}`);
  // ⚠ LOT PAQUETS : 119 mesuré pour les défenses, écrit en clair — l'instrument
  // qui les garde est le profil d'occupation, asserté cellule par cellule.
  assert.equal(sommeD, 119, `${sommeD} ensembles de rangées de défenses en tout`);
});

test('DO T2 — la même graine rend deux fois exactement le même montage', () => {
  for (const type of ['camp', 'avantPoste', 'base']) {
    for (const niveau of [1, 7, 20, 33, 50]) {
      for (const graine of VINGT_GRAINES.slice(0, 5)) {
        const a = genererSite({ type, niveau, graine });
        const b = genererSite({ type, niveau, graine });
        assert.deepEqual(a, b, `${type} n.${niveau} g${graine} : deux appels divergent`);
      }
    }
  }
  // ⚠ CONTRE-ÉPREUVE : sans elle, un générateur qui rendrait toujours la même
  // chose passerait la boucle ci-dessus.
  const p = { type: 'camp', niveau: 20 };
  assert.notDeepEqual(
    genererSite({ ...p, graine: VINGT_GRAINES[0] }),
    genererSite({ ...p, graine: VINGT_GRAINES[1] }),
    'deux graines rendent le même site',
  );
});

// ---------------------------------------------------------------------------
// DO T3 — le flux de tirages ne dépend pas du résultat
// ---------------------------------------------------------------------------

test('DO T3 — le placement ne déplace pas d\'un cran le flux de composition', () => {
  // ⚠⚠ C'EST LA GARDE DU §5 DU BRIEF, ET C'EST ELLE QUI PROTÈGE LES SAUVEGARDES
  // D'ETHAN. `sim/site-entame.js` range `pvBatimentsMilli` et `pvDefensesMilli`
  // PAR INDICE dans le montage régénéré : si un tirage de placement était pris
  // sur le flux principal, `composerRepartition` composerait une AUTRE garnison
  // pour la même graine, et les dégâts de tout site à moitié rasé se
  // retrouveraient sur d'autres pièces — sans erreur, sans message, sans test
  // rouge. Mesuré : la suite des identifiants de défense varie avec la graine
  // sur 18 des 21 couples (type, niveau) essayés.
  //
  // ⚠ ON LE MESURE EN TOURNANT UN BOUTON DU PLACEMENT. ⚠ LOT PAQUETS (09/09) :
  // `etalementMaxRangees` est retiré, le bouton est `candidatsParPaquet` — dix
  // candidats ou trois changent la case retenue, jamais la composition. Si le
  // nombre de candidats changeait le nombre de tirages du flux PRINCIPAL, la
  // composition bougerait avec lui. Elle ne bouge pas ; seules les cases le font.
  const dOrigine = DISPOSITION_DEFENSES.candidatsParPaquet;
  try {
    const ids = (m) => [
      m.batiments.map((b) => b.id).join(','),
      m.defenseurs.map((d) => d.id).join(','),
    ].join('||');
    const rangees = (m) => JSON.stringify(
      [...m.batiments, ...m.defenseurs].map((e) => `${e.rangee},${e.colonne}`),
    );

    let bougees = 0;
    for (const type of ['camp', 'avantPoste', 'base']) {
      for (const niveau of [12, 25, 40]) {
        for (const graine of VINGT_GRAINES.slice(0, 6)) {
          DISPOSITION_DEFENSES.candidatsParPaquet = dOrigine;
          const a = genererSite({ type, niveau, graine });
          DISPOSITION_DEFENSES.candidatsParPaquet = 3;
          const b = genererSite({ type, niveau, graine });
          assert.equal(
            ids(a), ids(b),
            `${type} n.${niveau} g${graine} : la COMPOSITION suit le placement — `
            + 'un tirage de placement a fui dans le flux principal',
          );
          if (rangees(a) !== rangees(b)) bougees += 1;
        }
      }
    }
    // ⚠ ET LE MONTAGE DOIT AVOIR MESURÉ QUELQUE CHOSE : si tourner le bouton ne
    // déplaçait aucune rangée, l'égalité ci-dessus serait gratuite.
    assert.ok(bougees >= 30, `seulement ${bougees} montages sur 54 changent de cases`);
  } finally {
    DISPOSITION_DEFENSES.candidatsParPaquet = dOrigine;
  }
});

test('DO T3 bis — le flux de PLACEMENT se rejoue de l\'extérieur, tirage pour tirage', () => {
  // ⚠⚠ LA SECONDE MOITIÉ DE T3, RÉÉCRITE AU LOT PAQUETS (09/09) : le nombre de
  // tirages du flux de placement ne dépend NI du résultat NI des refus. Le
  // placement par paquets tire TOUT d'avance — `nbPaquetsMax(N)` tailles, trois
  // clés d'uniques, puis par paquet une clé de tiers et `candidatsParPaquet`
  // triplets (forme, rangée, colonne) — et le repli case par case ne tire
  // rien. On le prouve par la QUEUE du flux : les obstacles sont posés APRÈS
  // les deux placements sur le même flux, par `melanger` puis un type par
  // obstacle. En refaisant le flux depuis le sel exporté, en SAUTANT le nombre
  // de tirages qu'annonce la formule, et en rejouant la pose des obstacles à la
  // main, on doit retomber sur les obstacles du montage — si un tirage de
  // placement était pris sous condition, la queue se désynchroniserait.
  // `PQ T8` de `paquets.test.js` rejoue la même formule sur trois mille montages.
  const { tailleDePaquet, candidatsParPaquet } = DISPOSITION_DEFENSES;
  const nbPaquetsMax = (nb) => (nb < tailleDePaquet.paquetUnique ? 1 : Math.ceil(nb / tailleDePaquet.min));
  const tiragesDUnPlacement = (nb, avecUniques) => (nb === 0
    ? 0
    : nbPaquetsMax(nb) * (1 + 1 + 3 * candidatsParPaquet) + (avecUniques ? 3 : 0));

  let verifies = 0;
  for (const type of ['camp', 'avantPoste', 'base']) {
    for (const niveau of [8, 20, 35, 50]) {
      for (const graine of VINGT_GRAINES.slice(0, 5)) {
        const m = genererSite({ type, niveau, graine });
        const rng = creerRng(hachageBrut(graine, 0, 0, SEL_PLACEMENT_DES_RANGEES));
        const aSauter = tiragesDUnPlacement(m.batiments.length, true)
          + tiragesDUnPlacement(m.defenseurs.length, false);
        for (let k = 0; k < aSauter; k += 1) entier(rng, 0, 1);

        // La pose des obstacles, refaite à la main : les cases libres de la
        // bande de défense dans l'ordre de balayage, mélangées, les dix
        // premières, un type chacune.
        const prises = new Set([...m.batiments, ...m.defenseurs].map((e) => cleCase(e.rangee, e.colonne)));
        const libres = [];
        for (let r = BANDE_DEFENSE.premiere; r <= BANDE_DEFENSE.derniere; r += 1) {
          for (let c = 1; c <= GRILLE.largeur; c += 1) {
            if (!prises.has(cleCase(r, c))) libres.push({ rangee: r, colonne: c });
          }
        }
        melanger(rng, libres);
        const attendus = libres.slice(0, OBSTACLES.nombre).map((c) => ({
          rangee: c.rangee,
          colonne: c.colonne,
          type: OBSTACLES.types[entier(rng, 0, OBSTACLES.types.length - 1)],
        }));
        assert.deepEqual(m.obstacles, attendus,
          `${type} n.${niveau} g${graine} : la queue du flux de placement est désynchronisée — `
          + 'un tirage de placement dépend du résultat');
        verifies += 1;
      }
    }
  }
  assert.equal(verifies, 60, `${verifies} montages rejoués au lieu de 60`);
  // ⚠ FALSIFIABLE : sauter un tirage de moins désynchronise la queue.
  const m = genererSite({ type: 'base', niveau: 20, graine: VINGT_GRAINES[0] });
  const rng = creerRng(hachageBrut(VINGT_GRAINES[0], 0, 0, SEL_PLACEMENT_DES_RANGEES));
  const aSauter = tiragesDUnPlacement(m.batiments.length, true)
    + tiragesDUnPlacement(m.defenseurs.length, false) - 1;
  for (let k = 0; k < aSauter; k += 1) entier(rng, 0, 1);
  const prises = new Set([...m.batiments, ...m.defenseurs].map((e) => cleCase(e.rangee, e.colonne)));
  const libres = [];
  for (let r = BANDE_DEFENSE.premiere; r <= BANDE_DEFENSE.derniere; r += 1) {
    for (let c = 1; c <= GRILLE.largeur; c += 1) if (!prises.has(cleCase(r, c))) libres.push({ rangee: r, colonne: c });
  }
  melanger(rng, libres);
  assert.notDeepEqual(
    m.obstacles.map((o) => `${o.rangee},${o.colonne}`),
    libres.slice(0, OBSTACLES.nombre).map((o) => `${o.rangee},${o.colonne}`),
    'un tirage de moins rend les mêmes obstacles : le montage ne mesure rien',
  );
});

// ---------------------------------------------------------------------------
// DO T4 — l'ordre de retrait des portées ne lève sur aucune graine
// ---------------------------------------------------------------------------

// ⚠⚠ CE TEST EST LONG, ET SA BORNE EST ÉCRITE. `verifierLeRetraitDesPortees`
// LÈVE au tirage, donc sur une graine quelconque, donc chez le joueur : le §4
// du brief exige « des milliers de graines, pas trois ». **Cinq mille montages**
// — 100 graines × 10 niveaux de 10 à 50 × 3 types + un balayage serré autour des
// bas niveaux — coûtent une poignée de secondes ; les pousser à 50 000 en
// coûterait dix fois plus pour la même réponse.
const DO_T4_GRAINES = 100;
const DO_T4_NIVEAUX = [10, 14, 19, 23, 28, 32, 37, 41, 46, 50];

test('DO T4 — cinq mille montages, aucune levée du retrait des portées', () => {
  let montages = 0;
  let artilleriesVues = 0;
  for (const type of ['camp', 'avantPoste', 'base']) {
    for (const niveau of DO_T4_NIVEAUX) {
      for (let g = 1; g <= DO_T4_GRAINES; g += 1) {
        const graine = hachageBrut(g, niveau, 0, SEL_PLACEMENT_DES_RANGEES + 1);
        // `genererSite` appelle `verifierLeRetraitDesPortees` lui-même : une
        // levée fait tomber ce test en la nommant.
        const m = genererSite({ type, niveau, graine });
        montages += 1;
        const artilleries = m.defenseurs.filter((d) => categorieDe(d.id) === 'artillerie');
        artilleriesVues += artilleries.length;
        // ⚠ ET ON LE REMESURE DE L'EXTÉRIEUR, plutôt que de croire l'appel
        // interne : une garde retirée du générateur laisserait ce test vert.
        // ⚠ LOT PAQUETS (09/09) : la moitié ORDRE de `verifierLeRetraitDesPortees`
        // est retirée — l'ordre des catégories est un biais de tiers, `PQ T6` le
        // mesure. Ne reste ici que la moitié GÉOMÉTRIQUE.
        for (const a of artilleries) {
          assert.ok(a.rangee >= rangeeLaPlusAvanceeQuiTire(a.id),
            `${type} n.${niveau} g${graine} : ${a.id} devant sa portée`);
        }
      }
    }
  }
  assert.equal(montages, 3 * DO_T4_NIVEAUX.length * DO_T4_GRAINES);
  assert.equal(montages, 3000, 'le balayage a changé de taille : réécrire la borne');
  // ⚠ LE MONTAGE DOIT AVOIR RENCONTRÉ DE L'ARTILLERIE, sinon la boucle
  // ci-dessus ne mesurerait rien.
  assert.ok(artilleriesVues > 1000, `seulement ${artilleriesVues} artilleries sur le balayage`);
});

// ---------------------------------------------------------------------------
// DO T5 — le plafond de six occupants par rangée de défense
// ---------------------------------------------------------------------------

test('DO T5 — six occupants au plus par rangée de défense, sur tout le balayage', () => {
  const parRangee = DISPOSITION_DEFENSES.occupantsMaxParRangee;
  assert.equal(parRangee, 6, 'six sur neuf colonnes : trois colonnes libres au minimum');
  let atteint = 0;
  for (const type of ['camp', 'avantPoste', 'base']) {
    for (let niveau = 1; niveau <= 50; niveau += 1) {
      for (const graine of VINGT_GRAINES.slice(0, 5)) {
        const m = genererSite({ type, niveau, graine });
        const compte = new Map();
        for (const d of m.defenseurs) compte.set(d.rangee, (compte.get(d.rangee) ?? 0) + 1);
        for (const [rangee, n] of compte) {
          assert.ok(n <= parRangee,
            `${type} n.${niveau} g${graine} : ${n} occupants en rangée ${rangee}`);
          assert.ok(GRILLE.largeur - n >= 3,
            `${type} n.${niveau} g${graine} : moins de trois colonnes libres en rangée ${rangee}`);
          if (n === parRangee) atteint += 1;
        }
      }
    }
  }
  // ⚠ ET LE PLAFOND DOIT ÊTRE ATTEINT, sinon la garde serait vacueuse : un
  // générateur qui ne poserait jamais plus de deux occupants par rangée la
  // passerait sans rien prouver.
  assert.ok(atteint > 100, `le plafond de six n'est atteint que ${atteint} fois`);
});

// ---------------------------------------------------------------------------
// DO T6 — Souche et Étai restent en rangée 18, et leurs colonnes varient
// ---------------------------------------------------------------------------

test('DO T6 — les deux uniques flottent dans leur bande, et leurs colonnes se tirent', () => {
  // ⚠⚠ LA RANGÉE NE SE NÉGOCIAIT PAS — §4.2 du brief DISPOSITION-OUVRAGE : « ce
  // sont les deux objectifs du raid, ils doivent coûter la traversée complète ».
  // ⚠⚠ RENVERSÉ AU LOT PAQUETS, 09/09 — Ethan : « un ratio de destruction trop
  // grand ». La Souche et l'Étai entrent dans les paquets, ensemble une fois
  // sur trois (`uniquesDansLeMemePaquetUneFoisSur`), et flottent sur les huit
  // rangées de la bande. Mesuré AVANT d'écrire : le taux de rasage ne bouge
  // pas, seule la durée du raid baisse. Ce test garde le reste : deux uniques,
  // deux cases, la bande, les neuf colonnes — et gagne les huit rangées.
  //
  // ⚠⚠ ET LA COLONNE D'UN UNIQUE NE DÉPEND QUE DE LA GRAINE, PAS DU NIVEAU NI DU
  // TYPE — c'est une conséquence directe du second flux, qui est semé sur la
  // seule graine. Deux sites de niveaux différents sur la MÊME case portent donc
  // les mêmes deux colonnes. Ce n'est pas un défaut : en jeu, chaque site a sa
  // propre graine, `graineDeLInstance` mêlant la case ET l'instance. Mais ça
  // veut dire que la couverture des neuf colonnes se mesure sur le nombre de
  // GRAINES, pas sur le nombre de montages — d'où les soixante ci-dessous, là où
  // vingt en laissaient une sur neuf inatteinte.
  const colonnes = { souche: new Set(), etai: new Set() };
  const rangees = { souche: new Set(), etai: new Set() };
  let montages = 0;
  for (const type of ['camp', 'avantPoste', 'base']) {
    for (const niveau of [1, 10, 20, 30, 40, 50]) {
      for (const graine of VINGT_GRAINES) {
        const m = genererSite({ type, niveau, graine });
        montages += 1;
        const uniques = m.batiments.filter((b) => BATIMENTS[b.id].unique);
        assert.equal(uniques.length, 2, `${type} n.${niveau} g${graine} : ${uniques.length} uniques`);
        for (const u of uniques) {
          assert.ok(u.rangee >= PREMIERE_BAT && u.rangee <= FOND,
            `${type} n.${niveau} g${graine} : « ${u.id} » en rangée ${u.rangee}, hors de la bande`);
          colonnes[u.id].add(u.colonne);
          rangees[u.id].add(u.rangee);
        }
        assert.ok(uniques[0].colonne !== uniques[1].colonne || uniques[0].rangee !== uniques[1].rangee,
          `${type} n.${niveau} g${graine} : les deux uniques sur la même case`);
      }
    }
  }
  assert.equal(montages, 360);
  // ⚠ LES HUIT RANGÉES SONT ATTEINTES, DES DEUX CÔTÉS — mesuré. Un générateur
  // qui les aurait laissés au fond passerait tout ce qui précède.
  assert.equal(rangees.souche.size, FOND - PREMIERE_BAT + 1,
    `la Souche n'atteint que ${rangees.souche.size} rangées`);
  assert.equal(rangees.etai.size, FOND - PREMIERE_BAT + 1,
    `l'Étai n'atteint que ${rangees.etai.size} rangées`);
  // ⚠ LES NEUF COLONNES SONT ATTEINTES, DES DEUX CÔTÉS — pas seulement « plus
  // d'une ». Avant le lot, les deux valaient 5 et 4 sur 240 montages sur 240.
  for (const graine of SOIXANTE_GRAINES) {
    for (const u of genererSite({ type: 'camp', niveau: 20, graine }).batiments
      .filter((b) => BATIMENTS[b.id].unique)) {
      colonnes[u.id].add(u.colonne);
    }
  }
  assert.equal(colonnes.souche.size, GRILLE.largeur,
    `la Souche n'atteint que ${colonnes.souche.size} colonnes`);
  assert.equal(colonnes.etai.size, GRILLE.largeur,
    `l'Étai n'atteint que ${colonnes.etai.size} colonnes`);
});

// ---------------------------------------------------------------------------
// DO T7 — les obstacles restent dans la bande de défense
// ---------------------------------------------------------------------------

test('DO T7 — les obstacles restent dans leur bande et ne recouvrent aucune case prise', () => {
  // ⚠ ARBITRAGE DU 29/08, QUE CE LOT NE TOUCHE PAS : « un obstacle dans la bande
  // des bâtiments mange un emplacement de construction, c'est-à-dire une
  // décision d'urbanisme, alors qu'un obstacle dans la bande de défense ralentit
  // l'assaillant, c'est-à-dire une décision tactique. »
  for (const type of ['camp', 'avantPoste', 'base']) {
    for (const niveau of [1, 15, 30, 45, 50]) {
      for (const graine of VINGT_GRAINES) {
        const m = genererSite({ type, niveau, graine });
        assert.equal(m.obstacles.length, OBSTACLES.nombre);
        const prises = new Set([...m.batiments, ...m.defenseurs]
          .map((e) => `${e.rangee}:${e.colonne}`));
        const vues = new Set();
        for (const o of m.obstacles) {
          assert.ok(
            o.rangee >= BANDE_DEFENSE.premiere && o.rangee <= BANDE_DEFENSE.derniere,
            `${type} n.${niveau} g${graine} : obstacle en rangée ${o.rangee}, hors bande`,
          );
          const cle = `${o.rangee}:${o.colonne}`;
          assert.ok(!prises.has(cle),
            `${type} n.${niveau} g${graine} : obstacle sur une case occupée (${cle})`);
          assert.ok(!vues.has(cle),
            `${type} n.${niveau} g${graine} : deux obstacles sur la même case (${cle})`);
          vues.add(cle);
        }
      }
    }
  }
});

// ---------------------------------------------------------------------------
// DO T8 — les PV d'un site entamé ne se remappent pas
// ---------------------------------------------------------------------------

test('DO T8 — un site entamé retrouve ses dégâts sur les mêmes bâtiments', () => {
  // ⚠⚠ C'EST LE TEST DU §5, ET C'EST CELUI QUI PROTÈGE LES SAUVEGARDES D'ETHAN.
  // `montageCourant` applique `entree.pvBatimentsMilli` au tableau
  // `montage.batiments` PAR INDICE, et `santeDeLEtai` fait un `findIndex` puis
  // lit la même case. Si `genererSite` changeait l'ORDRE ou la COMPOSITION de ce
  // qu'il rend, les dégâts d'un site à moitié rasé se retrouveraient sur
  // d'autres bâtiments — sans erreur, sans message et sans test rouge.
  //
  // ⚠ LE MONTAGE A ÉTÉ CHERCHÉ, PAS SUPPOSÉ. Un raid qui RASE ne laisse aucune
  // entrée — `enregistrerLeRaid` retire le site —, et un raid trop faible n'en
  // abîme aucun. Balayage sur quatre niveaux et quatre graines : `camp n.25`
  // sur la graine 99 laisse **cinq bâtiments touchés dont quatre détruits**,
  // donc il exerce les DEUX branches de `montageCourant` — la pièce retirée et
  // la pièce montée à ses PV rangés.
  const identite = {
    type: 'camp', saveur: 'richeQuartz', niveau: 25, rangee: 120, colonne: 7, instance: 1,
  };
  // ⚠ LOT PAQUETS (09/09) : 99 → 102. Sur la graine 99 le raid ne touche plus
  // qu'UN bâtiment ; la 102 en laisse **sept touchés dont six détruits**, et les
  // deux branches restent exercées. Réancré par balayage des graines 99 à 140.
  //
  // ⚠⚠ LOT MUR (10/09) : 102 → 106, ET LE MOTIF DU RÉANCRAGE EST L'INVERSE DU
  // PRÉCÉDENT. Sur la 102 le raid rase désormais TOUT ce qu'il touche — sept
  // touchés, sept détruits —, donc plus un seul bâtiment survivant abîmé et la
  // seconde branche de `montageCourant` n'est plus exercée. Un raid qui ouvre
  // ses brèches va plus loin. Balayage des mêmes graines 99 à 140 : dix-sept
  // conviennent, la **106** en laisse **dix touchés dont six détruits**, donc
  // quatre survivants abîmés — la marge la plus large des dix-sept.
  const etat = creerEtat(106);
  const vagues = [Array.from({ length: GRILLE.largeur }, (_, k) => ({
    id: ['belier', 'pilon', 'broyeur', 'crecelle'][k % 4], colonne: k + 1, niveau: 25,
  }))];

  const avant = { ...montageCourant(etat, identite), vagues };
  enregistrerLeRaid(etat, identite, resoudre(creerCombat(avant)), avant);
  const entree = etatDuSite(etat, identite);
  assert.notEqual(entree, null, 'montage : le raid n\'a rien laissé à ranger');

  // ⚠ LE MONTAGE DOIT AVOIR ABÎMÉ ET DÉTRUIT, sinon la comparaison serait
  // gratuite : un site intact retrouve trivialement des dégâts nuls.
  const touches = entree.pvBatimentsMilli.filter((v) => v !== null);
  const detruits = touches.filter((v) => v === 0);
  assert.ok(touches.length >= 5, `montage : ${touches.length} bâtiments touchés`);
  assert.ok(detruits.length >= 1, 'montage : aucun bâtiment détruit');
  assert.ok(touches.length > detruits.length, 'montage : aucun bâtiment survivant abîmé');

  // La correspondance est PAR INDICE, et on la relit PAR IDENTIFIANT ET PAR
  // CASE : c'est ce qui distingue « les PV sont bien rangés » de « les PV sont
  // rangés sur le BON bâtiment ».
  const apres = montageCourant(etat, identite);
  let verifies = 0;
  entree.pvBatimentsMilli.forEach((pv, k) => {
    if (pv === null) return;
    const attendu = avant.batiments[k];
    assert.notEqual(attendu, undefined, `le bâtiment d'indice ${k} a disparu du montage`);
    const pose = apres.batiments.find((b) => b.id === attendu.id
      && b.rangee === attendu.rangee && b.colonne === attendu.colonne);
    if (pv === 0) {
      assert.equal(pose, undefined,
        `« ${attendu.id} » détruit est toujours au montage : ${JSON.stringify(pose)}`);
    } else {
      assert.notEqual(pose, undefined,
        `« ${attendu.id} » en (${attendu.rangee}, ${attendu.colonne}) a quitté le montage`);
      assert.equal(pose.pvMilli, pv,
        `« ${attendu.id} » porte ${pose.pvMilli} milli-PV au lieu de ${pv}`);
    }
    verifies += 1;
  });
  assert.equal(verifies, touches.length);

  // ⚠⚠ ET LA FALSIFICATION EST JOUÉE, PAS SEULEMENT DÉCRITE. On permute deux
  // entrées de `pvBatimentsMilli` et on exige que la lecture CHANGE : sans cela,
  // les assertions ci-dessus pourraient être vraies d'un remappage aussi bien
  // que du bon rangement. On prend deux indices dont les valeurs diffèrent —
  // permuter deux nulls ne prouverait rien.
  const i = entree.pvBatimentsMilli.findIndex((v) => v !== null && v !== 0);
  const j = entree.pvBatimentsMilli.findIndex((v, k) => k !== i && v === 0);
  assert.ok(i >= 0 && j >= 0, 'montage : pas deux entrées de valeurs différentes à permuter');
  const permutee = [...entree.pvBatimentsMilli];
  const t = permutee[i]; permutee[i] = permutee[j]; permutee[j] = t;
  etat.sitesEntames[Object.keys(etat.sitesEntames)[0]].pvBatimentsMilli = permutee;
  const remappe = montageCourant(etat, identite);
  assert.notDeepEqual(
    remappe.batiments, apres.batiments,
    'permuter deux PV ne change pas le montage : la lecture par indice ne mesure rien',
  );
});

// ---------------------------------------------------------------------------
// DO T9 — l'écran de raid n'a pas changé de contrat
// ---------------------------------------------------------------------------

test('DO T9 — la FORME du montage est celle que l\'écran de raid attend', () => {
  // ⚠⚠ LE §7 DU BRIEF INTERDIT DE TOUCHER `src/ui/` ET `src/render/`, ET CE TEST
  // EN EST LA CONTREPARTIE MESURÉE : si le générateur rendait une forme
  // différente, leurs tests tomberaient — et le brief demande alors de
  // s'arrêter. On garde donc la forme ici, à la clé près, plutôt que d'attendre
  // qu'un autre fichier s'en aperçoive.
  const m = genererSite({ type: 'base', niveau: 30, graine: VINGT_GRAINES[0] });
  assert.deepEqual(Object.keys(m).sort(), [
    'batiments', 'defenseurs', 'modulesDebloques', 'niveau', 'obstacles', 'saveur',
    'type', 'vagues',
  ]);
  for (const groupe of ['batiments', 'defenseurs']) {
    for (const e of m[groupe]) {
      assert.deepEqual(Object.keys(e).sort(), ['colonne', 'id', 'niveau', 'rangee'],
        `${groupe} : une pièce a changé de forme — ${JSON.stringify(e)}`);
      assert.ok(Number.isInteger(e.rangee) && Number.isInteger(e.colonne));
    }
  }
  for (const o of m.obstacles) {
    assert.deepEqual(Object.keys(o).sort(), ['colonne', 'rangee', 'type']);
  }
  // ⚠ ET LE MONTAGE PASSE `creerCombat` SANS UNE LIGNE D'ADAPTATION : c'est le
  // contrat que l'écran de raid consomme.
  assert.doesNotThrow(() => creerCombat({ ...m, vagues: [[{ id: 'meute', colonne: 5 }]] }));
});

// ---------------------------------------------------------------------------
// DO T10 — le bloc reste un bloc : les bornes du placement, en clair
// ---------------------------------------------------------------------------

test('DO T10 — les bornes du placement, mesurées sur trois mille montages', () => {
  // ⚠⚠ UNE LIBERTÉ NON BORNÉE N'EST PAS UNE LIBERTÉ, C'EST UN SEMIS. Ce test
  // écrit en clair ce que le balayage rend, dans les deux sens : un `>=` seul
  // laisserait la dispersion glisser sans un mot.
  let minDef = Infinity; let maxDef = -Infinity;
  let minBat = Infinity; let maxBat = -Infinity;
  let minUnique = Infinity; let maxUnique = -Infinity;
  let chargeMaxDef = 0; let chargeMaxBat = 0;
  let montages = 0;
  for (const type of ['camp', 'avantPoste', 'base']) {
    for (let niveau = 1; niveau <= 50; niveau += 1) {
      for (const graine of VINGT_GRAINES) {
        const m = genererSite({ type, niveau, graine });
        montages += 1;
        for (const d of m.defenseurs) {
          minDef = Math.min(minDef, d.rangee); maxDef = Math.max(maxDef, d.rangee);
        }
        for (const b of m.batiments) {
          if (BATIMENTS[b.id].unique) {
            minUnique = Math.min(minUnique, b.rangee); maxUnique = Math.max(maxUnique, b.rangee);
          } else {
            minBat = Math.min(minBat, b.rangee); maxBat = Math.max(maxBat, b.rangee);
          }
        }
        for (const [groupe, isDef] of [[m.defenseurs, true], [m.batiments, false]]) {
          const charge = new Array(GRILLE.largeur).fill(0);
          for (const e of groupe) charge[e.colonne - 1] += 1;
          const depassement = Math.max(...charge)
            - (Math.ceil(groupe.length / GRILLE.largeur) + DISPOSITION_DEFENSES.margeDeColonne);
          if (isDef) chargeMaxDef = Math.max(chargeMaxDef, depassement);
          else chargeMaxBat = Math.max(chargeMaxBat, depassement);
        }
      }
    }
  }
  assert.equal(montages, 3000);
  // Mesuré : les défenses parcourent la bande ENTIÈRE, 3 à 10.
  assert.equal(minDef, BANDE_DEFENSE.premiere, `les défenses ne descendent qu'à ${minDef}`);
  assert.equal(maxDef, BANDE_DEFENSE.derniere, `les défenses ne montent qu'à ${maxDef}`);
  // ⚠ LOT PAQUETS (09/09) : les bâtiments parcourent leur bande ENTIÈRE, fond
  // compris — le fond n'est plus réservé aux uniques —, et les uniques la
  // parcourent aussi, de 11 à 18.
  assert.equal(minBat, PREMIERE_BAT, `les bâtiments ne descendent qu'à ${minBat}`);
  assert.equal(maxBat, FOND, `les bâtiments ne montent qu'à ${maxBat}`);
  assert.equal(minUnique, PREMIERE_BAT, `les uniques ne descendent qu'à ${minUnique}`);
  assert.equal(maxUnique, FOND, `les uniques ne montent qu'à ${maxUnique}`);
  // ⚠ `etalementMaxRangees` est retiré : un trou entre deux paquets est voulu.
  // La borne qui reste est le plafond de colonne, `⌈N/9⌉ + margeDeColonne`, et
  // le repli qui a le droit de le relâcher n'a jamais eu à le faire ici —
  // mesuré, dépassement ZÉRO sur les trois mille, pour les deux groupes.
  assert.equal(chargeMaxDef, 0, `plafond de colonne des défenses dépassé de ${chargeMaxDef}`);
  assert.equal(chargeMaxBat, 0, `plafond de colonne des bâtiments dépassé de ${chargeMaxBat}`);
});

// ---------------------------------------------------------------------------
// DO T11 — le sel du second flux est à lui, et il n'en existe qu'un
// ---------------------------------------------------------------------------

test('DO T11 — le sel du flux de placement est à lui, et il est le huitième', () => {
  // ⚠⚠ DEUX TIRAGES SANS RAPPORT QUI PARTAGENT UN SEL FINISSENT PAR SE
  // CORRÉLER — `render/terrain.js` a retiré 2 et 3 plutôt que de les réemployer.
  // Les sept premiers sels de `src/sim/` sont pris, et on les LIT au lieu de les
  // recopier : une liste écrite à la main vieillirait au premier sel ajouté.
  //
  // ⚠ ET ON LES LIT AU LIEU DE LES RECOPIER : une liste écrite à la main
  // vieillirait au premier sel ajouté. Seuls les deux de `sim/peuplement.js`
  // sont en clair, ce module-là les écrivant en clair lui-même.
  const prisDansSim = [
    0, 1, // `sim/peuplement.js` : candidate et départage
    SEL_RANGEE, SEL_COLONNE, SEL_TERRAIN_DU_SITE, SEL_INSTANCE_DU_SITE, SEL_RAID_OUVRAGE,
  ];
  const prisDansRender = [SEL_VARIANTE, SEL_FOND, SEL_BLOC, SEL_FAMILLE];
  assert.equal(new Set(prisDansSim).size, prisDansSim.length,
    'deux modules de src/sim/ partagent déjà un sel');
  // ⚠⚠ `src/render/` EN RÉEMPLOIE QUATRE, ET C'EST UN FAIT, PAS UN DÉFAUT : ses
  // sels ne hachent pas les mêmes entrées — une case de dalle, pas une case de
  // carte. Le relever ici évite de croire que les sels sont uniques dans tout le
  // dépôt, ce qu'ils ne sont pas.
  const tousPris = new Set([...prisDansSim, ...prisDansRender]);
  assert.ok(prisDansRender.some((x) => prisDansSim.includes(x)),
    'src/render/ ne réemploie plus aucun sel : ce commentaire est devenu faux');
  // ⚠ HUIT EST LE PREMIER LIBRE PARTOUT, ET C'EST POUR ÇA QU'IL EST RETENU. Sept
  // était libre dans `src/sim/` mais pris par `render/terrain.js` ; le prendre
  // aurait marché et aurait mis deux sels de plus en collision, ce que le dépôt
  // paie déjà quatre fois.
  assert.ok(!tousPris.has(SEL_PLACEMENT_DES_RANGEES),
    `le sel ${SEL_PLACEMENT_DES_RANGEES} est déjà employé ailleurs`);
  assert.equal(SEL_PLACEMENT_DES_RANGEES, Math.max(...tousPris) + 1,
    'le sel du placement n\'est plus le premier libre : un sel a été sauté ou réemployé');

  // ⚠⚠ ET LA DÉRIVATION DOIT PASSER PAR `hachageBrut`, PAS PAR UNE ARITHMÉTIQUE
  // SUR LA GRAINE. `creerRng` pose `s = graine >>> 0` et `tirer` avance de
  // 0x6d2b79f5 : deux graines qui diffèrent d'un multiple de ce pas rendent le
  // MÊME flux, décalé — un `graine + 0x6d2b79f5` serait donc le flux principal
  // avec un tirage d'avance. On mesure ici que le hachage retenu ne peut pas
  // recoller : sur deux mille graines, jamais à moins de mille tirages.
  //
  // ⚠ CE QUI RELIE CETTE PROPRIÉTÉ AU CODE, C'EST `DO T3 bis`, ET PAS CE
  // TEST-CI. Celui-ci mesure la FONCTION qu'on a choisie ; c'est `DO T3 bis` qui
  // rejoue le flux depuis `hachageBrut` et le confronte aux rangées rendues,
  // donc qui tombe si `genererSite` dérivait son second flux autrement. Mesuré :
  // en remplaçant la dérivation par `graine + 0x6d2b79f5`, T3 bis tombe et
  // celui-ci reste vert. Le dire plutôt que de laisser croire l'inverse.
  const PAS = 0x6d2b79f5;
  let pireEcart = Infinity;
  for (let g = 1; g <= 2000; g += 1) {
    const graine = hachageBrut(g, 7, 13, SEL_TERRAIN_DU_SITE);
    const place = hachageBrut(graine, 0, 0, SEL_PLACEMENT_DES_RANGEES);
    let k = 0;
    let s = graine >>> 0;
    while (k < 1000 && s !== (place >>> 0)) { s = (s + PAS) >>> 0; k += 1; }
    pireEcart = Math.min(pireEcart, s === (place >>> 0) ? k : 1000);
  }
  assert.equal(pireEcart, 1000,
    `le flux de placement recolle au principal à ${pireEcart} tirages près`);
});

// ---------------------------------------------------------------------------
// DO T12 — l'empreinte du générateur, figée
// ---------------------------------------------------------------------------

test('DO T12 — l\'empreinte de trente montages, en clair', () => {
  // ⚠ UNE EMPREINTE NE DIT PAS CE QUI A BOUGÉ, ELLE DIT QUE QUELQUE CHOSE A
  // BOUGÉ — et c'est ce qu'on lui demande ici : les onze tests au-dessus
  // nomment des PROPRIÉTÉS, celui-ci garde l'AVENIR. Un lot qui déplacerait la
  // disposition sans le déclarer le fait tomber.
  const morceaux = [];
  for (const type of ['camp', 'avantPoste', 'base']) {
    for (const niveau of [5, 20, 45]) {
      for (const graine of VINGT_GRAINES.slice(0, 4)) {
        morceaux.push(JSON.stringify(genererSite({ type, niveau, graine })));
      }
    }
  }
  assert.equal(morceaux.length, 36);
  const empreinte = createHash('sha256').update(morceaux.join('|')).digest('hex').slice(0, 16);
  // ⚠ LOT PAQUETS (09/09) : `41bf9bd339d8ae8f` → `dfd5f7409f5f4c64`, déclaré.
  assert.equal(empreinte, 'dfd5f7409f5f4c64', 'la disposition d\'un site a changé sans être déclarée');
});
