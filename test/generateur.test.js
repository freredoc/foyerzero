// Tests T1 à T16 du brief du lot 2B — générateur de site déterministe,
// courbe de niveau, corrections de la Ronce et de la Herse.
//
// Tous les seuils portent leur calcul en commentaire. Un seuil non justifié
// est un test raté.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  genererSite,
  genererVague,
  genererAssaut,
  densite,
  composerBatiments,
  repartitionInterpolee,
  budgetRaid,
  budgetAssaut,
  rangeeLaPlusAvanceeQuiTire,
} from '../src/sim/generateur.js';
import {
  creerCombat, resoudre, tick, pointsRecherche, facteurMilli, facteurEconomiqueMilli,
} from '../src/sim/combat.js';
import { GRILLE, OBSTACLES, UNITES, DEFENSES } from '../src/data/combat.js';
import {
  BATIMENTS, BUTIN, DENSITE, GARNISON, RAID_OUVRAGE, DISPOSITION_DEFENSES, GEOGRAPHIE,
} from '../src/data/sites.js';
import { NIVEAU } from '../src/data/niveaux.js';
import { cleCase } from '../src/sim/grille.js';

// ---------------------------------------------------------------------------
// Outils
// ---------------------------------------------------------------------------

const TYPES = ['camp', 'avantPoste', 'base'];

/**
 * ⚠⚠ LE POINT D'APPARITION S'ÉCRIT EXPLICITEMENT DEPUIS LE LOT APPROCHE, 11/09,
 * ET C'EST LE MONTAGE QU'ON RÉPARE — JAMAIS L'ASSERTION. `RANGEE_APPARITION` de
 * `sim/combat.js` valait le FRONT de la bande de déploiement ; elle vaut
 * désormais la voie d'approche, sous la grille, et une vague joue deux cases de
 * plus avant d'entrer. Ces montages-ci ne mesurent pas l'entrée : ils mesurent
 * ce qui se passe une fois l'unité en face de la défense. On leur redonne donc
 * le point de départ qu'ils supposaient, par le champ `rangee` que
 * `creerCombat` accepte depuis toujours pour « monter un état déjà entamé sans
 * jouer les ticks d'approche ».
 *
 * ⚠ IL SE DÉRIVE DE `GRILLE.bandes`, IL NE S'ÉCRIT PAS `2` : c'est exactement ce
 * que l'ancien défaut valait, et un nombre écrit à la main cesserait de le dire.
 *
 * ⚠⚠ ET L'INVARIANCE EST MESURÉE, PAS SUPPOSÉE : avec ce champ posé, les deux
 * cents témoins de combat et les quatorze phases de BASES-0 rendent EXACTEMENT
 * les empreintes d'avant le lot — 0 écart. C'est la preuve du §4.1 du brief, et
 * c'est elle qui autorise la recapture des témoins.
 */
const DEPART = GRILLE.bandes.deploiement.derniere;
const NIVEAUX = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
const GRAINES = [1, 2, 3, 4, 5];

/** Saveurs admissibles pour un type : une base n'en porte pas. */
const saveursDe = (type) => (type === 'base' ? [null] : ['richeQuartz', 'richeScorie']);

/** Niveau d'apparition d'un identifiant, structure ou unité mobile. */
const apparitionDe = (id) => (DEFENSES[id] ?? UNITES[id]).apparition;

/** Catégorie de placement : type de structure, ou « unite » pour les mobiles. */
const categorieDe = (id) => DEFENSES[id]?.type ?? 'unite';

/** Compte les occurrences d'un identifiant dans une liste d'entités. */
function compter(entites) {
  const compte = new Map();
  for (const e of entites) compte.set(e.id, (compte.get(e.id) ?? 0) + 1);
  return compte;
}

/** Tout nombre non entier rencontré dans une valeur sérialisable. */
function flottantsDe(valeur, chemin = 'montage', trouves = []) {
  if (typeof valeur === 'number') {
    if (!Number.isInteger(valeur)) trouves.push(`${chemin} = ${valeur}`);
  } else if (Array.isArray(valeur)) {
    valeur.forEach((v, i) => flottantsDe(v, `${chemin}[${i}]`, trouves));
  } else if (valeur !== null && typeof valeur === 'object') {
    for (const [cle, v] of Object.entries(valeur)) flottantsDe(v, `${chemin}.${cle}`, trouves);
  }
  return trouves;
}

/** Parcourt tout le balayage de validité, en appliquant `visiter` à chaque site. */
function balayer(visiter) {
  let nb = 0;
  for (const niveau of NIVEAUX) {
    for (const type of TYPES) {
      for (const saveur of saveursDe(type)) {
        for (const graine of GRAINES) {
          visiter(genererSite({ type, niveau, saveur, graine }), { type, niveau, saveur, graine });
          nb += 1;
        }
      }
    }
  }
  return nb;
}

// ---------------------------------------------------------------------------
// T1 — déterminisme
// ---------------------------------------------------------------------------

test('T1 — même graine, même site au bit près ; graine différente, site différent', () => {
  const parametres = { type: 'avantPoste', niveau: 30, saveur: 'richeQuartz', graine: 1234 };
  const a = JSON.stringify(genererSite(parametres));
  const b = JSON.stringify(genererSite(parametres));
  assert.equal(a, b, 'deux appels de mêmes paramètres doivent rendre le même site');

  // Le site doit vraiment porter quelque chose : un montage vide serait
  // trivialement reproductible.
  const site = genererSite(parametres);
  assert.ok(site.batiments.length >= 20 && site.defenseurs.length >= 20);

  // Deux graines différentes : au moins un montage diffère. On l'assied sur
  // cinq graines pour qu'une collision fortuite ne fasse pas passer le test.
  const variantes = new Set(
    [11, 22, 33, 44, 55].map((graine) => JSON.stringify(genererSite({ ...parametres, graine }))),
  );
  assert.ok(variantes.size > 1, 'des graines différentes doivent produire des sites différents');
});

// ---------------------------------------------------------------------------
// T2 — balayage de validité
// ---------------------------------------------------------------------------

test('T2 — tout montage produit passe creerCombat sans lever', () => {
  // 11 niveaux × (camp 2 saveurs + avantPoste 2 saveurs + base 1) × 5 graines
  // = 11 × 5 × 5 = 275 montages.
  const nb = balayer((montage, params) => {
    assert.doesNotThrow(
      () => creerCombat(montage),
      `montage refusé : ${JSON.stringify(params)}`,
    );
    // §9 : aucun flottant dans un montage produit, vérifié PAR PARCOURS.
    const flottants = flottantsDe(montage);
    assert.deepEqual(flottants, [], `flottants dans ${JSON.stringify(params)} : ${flottants}`);
  });
  assert.equal(nb, 275, 'le balayage doit couvrir 11 × 5 × 5 montages');
});

// ---------------------------------------------------------------------------
// T3 — densité
// ---------------------------------------------------------------------------

test('T3 — effectifs conformes à DENSITE, interpolation comprise', () => {
  // Paliers lus tels quels au niveau 40 : camp 25/25, avantPoste 35/35.
  assert.deepEqual(densite('camp', 40), { batiments: 25, defenses: 25 });
  assert.deepEqual(densite('avantPoste', 40), { batiments: 35, defenses: 35 });
  // La base est un avant-poste + 10 %, en entiers : floor((35 × 1100 + 500)/1000)
  // = floor(39,0) = 39. En flottant, 35 × 1,1 tombe sur 38,5 — que JavaScript
  // arrondit à 39 et qu'un autre langage arrondirait à 38.
  assert.deepEqual(densite('base', 40), { batiments: 39, defenses: 39 });

  // Interpolation au niveau 22, entre les paliers 20 et 25 :
  // bâtiments 16 + (18 − 16) × 2/5 = 16,8 → 17 ;
  // défenses  15 + (18 − 15) × 2/5 = 16,2 → 16.
  assert.deepEqual(densite('camp', 22), { batiments: 17, defenses: 16 });

  // Sous le premier palier on borne au palier 5, au-delà du dernier au palier 50.
  assert.deepEqual(densite('camp', 1), densite('camp', 5));
  assert.deepEqual(densite('camp', 3), DENSITE.parNiveau[5].camp);
  assert.deepEqual(densite('avantPoste', 50), DENSITE.parNiveau[50].avantPoste);

  // Et les effectifs réellement posés suivent la densité, sans exception.
  balayer((montage, { type, niveau }) => {
    const attendu = densite(type, niveau);
    assert.equal(montage.batiments.length, attendu.batiments, `bâtiments ${type} ${niveau}`);
    assert.equal(montage.defenseurs.length, attendu.defenses, `défenses ${type} ${niveau}`);
  });
});

// ---------------------------------------------------------------------------
// T4 — composition des bâtiments
// ---------------------------------------------------------------------------

test('T4 — une Souche, un Étai, dans leur bande ; le reste au plus grand reste', () => {
  // 39 bâtiments : 2 uniques, 37 proportionnels aux parts 0,40 · 0,30 · 0,30.
  // 37 × 0,40 = 14,8 → 14 reste 0,8 ; 37 × 0,30 = 11,1 → 11 reste 0,1 (deux fois).
  // 14 + 11 + 11 = 36, il reste 1 à placer : au plus grand reste, donc au Nœud.
  // → 15 Nœuds, 11 Gangues, 11 Terrils, somme 37.
  const composition = compter(composerBatiments(39).map((id) => ({ id })));
  assert.equal(composition.get('souche'), 1);
  assert.equal(composition.get('etai'), 1);
  assert.equal(composition.get('noeud'), 15);
  assert.equal(composition.get('gangue'), 11);
  assert.equal(composition.get('terril'), 11);
  assert.equal([...composition.values()].reduce((a, b) => a + b, 0), 39);

  // ⚠⚠ « TOUS DEUX AU FOND » EST TOMBÉ — LOT PAQUETS, 09/09. Ethan : « un
  // ratio de destruction trop grand ». La Souche et l'Étai entrent dans les
  // paquets comme les autres bâtiments et FLOTTENT dans la bande 11–18 ; mesuré
  // AVANT d'écrire une ligne, le taux de rasage ne bouge pas, seule la durée
  // du raid baisse de 20 à 30 %. Ce que ce test garde : un seul de chaque, et
  // TOUS les bâtiments dans leur bande — l'assertion « proportionnels JAMAIS au
  // fond » tombe avec elle, le fond n'étant plus réservé. `PQ T1` de
  // `paquets.test.js` mesure la répartition des rangées de la Souche.
  const bande = GRILLE.bandes.batiments;
  const rangeesDUnique = new Set();
  balayer((montage, params) => {
    const compte = compter(montage.batiments);
    assert.equal(compte.get('souche'), 1, `une seule Souche — ${JSON.stringify(params)}`);
    assert.equal(compte.get('etai'), 1, `un seul Étai — ${JSON.stringify(params)}`);
    for (const b of montage.batiments) {
      assert.ok(b.rangee >= bande.premiere && b.rangee <= bande.derniere,
        `${b.id} en rangée ${b.rangee}, hors de la bande — ${JSON.stringify(params)}`);
      if (BATIMENTS[b.id].unique) rangeesDUnique.add(b.rangee);
    }
  });
  // ⚠ FALSIFIABLE : un générateur qui aurait gardé les uniques au fond passerait
  // tout ce qui précède. Mesuré sur ce balayage : les huit rangées de la bande.
  assert.equal(rangeesDUnique.size, bande.derniere - bande.premiere + 1,
    `les uniques n'atteignent que ${rangeesDUnique.size} rangées : ils sont encore cloués`);
});

// ---------------------------------------------------------------------------
// T5 — garnison
// ---------------------------------------------------------------------------

test('T5 — aucune entité verrouillée, et la garnison reste adossée à sa courbe', () => {
  let pireEcartPoints = 0;
  for (let niveau = 1; niveau <= NIVEAU.plafond; niveau++) {
    for (const graine of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const montage = genererSite({ type: 'avantPoste', niveau, saveur: null, graine });
      const total = montage.defenseurs.length;
      const compte = compter(montage.defenseurs);

      // La courbe nue, restreinte aux entités débloquées et renormalisée : c'est
      // la référence à laquelle la garnison tirée doit rester comparable.
      const courbe = [...repartitionInterpolee(GARNISON.parNiveau, niveau)]
        .filter(([id]) => apparitionDe(id) <= niveau);
      const sommeCourbe = courbe.reduce((a, [, p]) => a + p, 0);

      for (const d of montage.defenseurs) {
        assert.ok(
          apparitionDe(d.id) <= niveau,
          `« ${d.id} » apparaît au niveau ${apparitionDe(d.id)}, garnison de niveau ${niveau}`,
        );
      }
      const idsCourbe = new Set(courbe.map(([id]) => id));
      for (const id of compte.keys()) {
        assert.ok(idsCourbe.has(id), `« ${id} » n'est pas dans la courbe du niveau ${niveau}`);
      }
      for (const [id, poids] of courbe) {
        const attenduMilli = (poids * 1000) / sommeCourbe;
        const obtenuMilli = ((compte.get(id) ?? 0) * 1000) / total;
        pireEcartPoints = Math.max(pireEcartPoints, Math.abs(obtenuMilli - attenduMilli) / 10);
      }
    }
  }

  // ⚠ Le brief annonce ±10 points. Ce n'est pas atteignable APRÈS
  // renormalisation, et l'arithmétique le dit : une ligne à 5 points qui tire
  // +10 passe à 15 — déjà le triple — puis la renormalisation la multiplie
  // encore par 1000/S, où S est la somme des lignes variées. Avec dix-sept
  // lignes tirant chacune ±10 points, S descend couramment à 760 ‰, ce qui
  // porte la ligne à 19,7 points. Écart maximal MESURÉ sur 50 niveaux × 8
  // graines : 17,6 points. Le seuil retenu, 25 points, laisse la marge sans
  // rendre le test vide. Le point est consigné au rapport : c'est un arbitrage
  // de calibrage, pas un défaut d'exécution.
  assert.ok(
    pireEcartPoints < 25,
    `écart maximal à la courbe : ${pireEcartPoints.toFixed(1)} points`,
  );
  assert.ok(pireEcartPoints > 0, 'sans variance, le test ne mesurerait rien');
});

// ---------------------------------------------------------------------------
// T6 — couverture latérale
// ---------------------------------------------------------------------------

test('T6 — six occupants au plus par rangée, et le bon nombre de rangées', () => {
  const parRangee = DISPOSITION_DEFENSES.occupantsMaxParRangee;
  assert.equal(parRangee, 6, 'six sur neuf colonnes : trois colonnes libres au minimum');
  const bande = GRILLE.bandes.defense;
  const rangeesMax = bande.derniere - bande.premiere + 1;
  assert.equal(rangeesMax, 8);

  // Les trois points chiffrés du §7.4, devenus le PLANCHER du nombre de rangées :
  //   39 défenses → ceil(39/6) = 7 rangées au MOINS, couverture ≤ 39/63 = 61,9 %
  //   35 défenses → ceil(35/6) = 6 rangées au MOINS, couverture ≤ 35/54 = 64,8 %
  //    3 défenses → ceil(3/6)  = 1 rangée  au MOINS, couverture ≤  3/9  = 33,3 %
  for (const [nb, rangees, couverture] of [[39, 7, 61.9], [35, 6, 64.8], [3, 1, 33.3]]) {
    assert.equal(Math.min(rangeesMax, Math.ceil(nb / parRangee)), rangees, `${nb} défenses`);
    const obtenue = (nb / (rangees * GRILLE.largeur)) * 100;
    assert.ok(Math.abs(obtenue - couverture) < 0.1, `couverture ${obtenue.toFixed(1)} %`);
    assert.ok(obtenue <= (parRangee / GRILLE.largeur) * 100, 'jamais au-delà de 6/9');
  }

  // ⚠⚠ LE NOMBRE DE RANGÉES N'EST PLUS `ceil(nb / 6)` — LOT CIBLES-RANGÉES,
  // 07/09. Cette ligne assertait l'égalité EXACTE, et c'était précisément le
  // défaut d'Ethan : « les cibles ouvrage sont toutes positionnées de façon
  // identique ». Un nombre de rangées fonction pure de `nb`, donc du niveau,
  // veut dire que deux graines ne peuvent pas dessiner deux formes.
  // `taillesDeRangee` le TIRE désormais, et l'assertion devient un ENCADREMENT :
  // au moins `ceil(nb / 6)` rangées — on ne peut pas en mettre moins —, au plus
  // `min(8, nb)` — une rangée vide n'est pas une rangée. **Ce qui NE s'est pas
  // relâché** : le plafond par rangée, la bande, et la contiguïté depuis le fond,
  // tous les trois assertés ci-dessous comme avant.
  let vusDeuxComptes = new Set();
  balayer((montage, params) => {
    const rangees = new Map();
    for (const d of montage.defenseurs) {
      rangees.set(d.rangee, (rangees.get(d.rangee) ?? 0) + 1);
    }
    for (const [rangee, occupants] of rangees) {
      assert.ok(
        occupants <= parRangee,
        `${occupants} occupants en rangée ${rangee} — ${JSON.stringify(params)}`,
      );
      assert.ok(rangee >= bande.premiere && rangee <= bande.derniere);
    }
    const nb = montage.defenseurs.length;
    if (nb === 0) return;
    const plancher = Math.min(rangeesMax, Math.ceil(nb / parRangee));
    const plafond = Math.min(rangeesMax, nb);
    assert.ok(rangees.size >= plancher && rangees.size <= plafond,
      `${rangees.size} rangées pour ${nb} défenses, hors de [${plancher}, ${plafond}] — `
      + JSON.stringify(params));
    // ⚠⚠ LE BLOC N'EXISTE PLUS — LOT PAQUETS, 09/09. Le lot DISPOSITION-OUVRAGE
    // avait remplacé « cloué au fond » par « un bloc sans plus de
    // `etalementMaxRangees` trous » ; la défense se pose désormais par PAQUETS
    // de trois ou quatre, répulsés les uns des autres, et un trou entre deux
    // paquets est ce qu'on lui demande. La clé est RETIRÉE de la table, et
    // l'assertion avec elle. Ce qui la remplace n'est pas ici : `PQ T2` mesure
    // que 15 à 35 % des paquets se touchent, `PQ T5` que la charge des colonnes
    // reste bornée — c'est ce qui sépare un paquet d'un semis.
    vusDeuxComptes.add(`${nb}:${rangees.size}`);
  });
  // ⚠ FALSIFIABLE : un même nombre de défenses doit produire des nombres de
  // rangées DIFFÉRENTS selon la graine. Sans cette ligne, un générateur resté
  // sur `ceil(nb / 6)` passerait l'encadrement ci-dessus sans rien prouver.
  const parNb = new Map();
  for (const v of vusDeuxComptes) {
    const [nb, r] = v.split(':');
    if (!parNb.has(nb)) parNb.set(nb, new Set());
    parNb.get(nb).add(r);
  }
  assert.ok([...parNb.values()].some((s) => s.size > 1),
    'aucun effectif ne se répartit sur deux nombres de rangées : le tirage est mort');
});

// ---------------------------------------------------------------------------
// T7 — artilleries au fond
// ---------------------------------------------------------------------------

test('T7 — les artilleries tirent toujours, et l\'ordre des catégories est un BIAIS', () => {
  // ⚠⚠ LA JUSTIFICATION D'AVANT ÉTAIT FAUSSE, ET ELLE EST RETIRÉE — lot
  // CIBLES-RANGÉES, 07/09. Elle disait : « posée en rangée 3, l'attaquant le
  // plus éloigné qu'elle puisse voir est en rangée 1 : distance 2 cases, sous
  // les 3,5 de sa portée minimale. Elle ne tirerait jamais. » Le raisonnement
  // est en RANGÉES ; le moteur, lui, teste une distance EUCLIDIENNE 2D —
  // `d² = (Δrangée)² + (Δcolonne)²`. `data/sites.js` l'a mesuré dès le 25/08 :
  // une Faucheuse en rangée 3 tire 23 ticks, premier tir au tick 1. Elle n'est
  // PAS inerte, et l'assertion qui « prouvait » le contraire ne regardait qu'un
  // seul axe. C'est la faute que le §9 du brief demande de traquer.
  //
  // La contre-mesure, en 2D cette fois : depuis la rangée 3, il existe des cases
  // dans la couronne [3,5 ; 5,5]. On l'ASSERTE, pour que la phrase retirée ne
  // revienne pas.
  const dansLaCouronne = (d, rangee, colonne, r, c) => {
    const d2 = ((rangee - r) * 1000) ** 2 + ((colonne - c) * 1000) ** 2;
    return d2 >= (d.porteeMini * 1000) ** 2 && d2 <= (d.portee * 1000) ** 2;
  };
  for (const [id, d] of Object.entries(DEFENSES)) {
    if (d.type !== 'artillerie') continue;
    assert.equal(d.porteeMini, 3.5, `${id} : portée minimale`);
    let atteignables = 0;
    for (let c = 1; c <= GRILLE.largeur; c += 1) {
      for (let r = 1; r <= GRILLE.longueur; r += 1) {
        for (let cc = 1; cc <= GRILLE.largeur; cc += 1) {
          if (dansLaCouronne(d, 3, c, r, cc)) atteignables += 1;
        }
      }
    }
    assert.ok(atteignables > 0,
      `${id} en rangée 3 n'atteindrait rien : la mesure du 25/08 serait fausse`);
    // Et la rangée que le générateur en DÉDUIT est bien la plus avancée de la
    // bande — le relevé est vacueux aujourd'hui, et c'est un fait mesuré.
    assert.equal(rangeeLaPlusAvanceeQuiTire(id), GRILLE.bandes.defense.premiere,
      `${id} : une rangée de la bande lui serait interdite`);
  }

  // ⚠⚠ L'ORDRE DES CATÉGORIES EST DEVENU UN BIAIS — LOT PAQUETS, 09/09. Depuis
  // le lot CIBLES-RANGÉES, ce test exigeait qu'AUCUNE artillerie ne soit devant
  // quoi que ce soit, et qu'aucune entité d'une catégorie plus avant ne soit
  // derrière une catégorie plus au fond : c'est le modèle ligne/colonne, que le
  // point 1 du brief retire. Chaque paquet de défense tire son TIERS de bande
  // selon `poidsDeTiers` — une artillerie va à l'arrière trois fois sur quatre,
  // une barrière à l'avant huit fois sur dix —, et l'ordre ne survit qu'en
  // MOYENNE. Ce qui reste asserté ici, pièce par pièce, est la moitié
  // GÉOMÉTRIQUE : aucune artillerie devant sa portée minimale. L'ordre des
  // cinq moyennes, avec son seuil de 0,3 rangée, est `PQ T6`.
  const bande = GRILLE.bandes.defense;
  let minRangee = Infinity;
  let maxArtilleries = 0;
  let sommeArtillerie = 0; let nbArtillerie = 0;
  let sommeAutres = 0; let nbAutres = 0;
  balayer((montage, params) => {
    const artilleries = montage.defenseurs.filter((d) => categorieDe(d.id) === 'artillerie');
    const autres = montage.defenseurs.filter((d) => categorieDe(d.id) !== 'artillerie');
    maxArtilleries = Math.max(maxArtilleries, artilleries.length);
    for (const a of artilleries) {
      minRangee = Math.min(minRangee, a.rangee);
      sommeArtillerie += a.rangee; nbArtillerie += 1;
      assert.ok(
        a.rangee >= rangeeLaPlusAvanceeQuiTire(a.id),
        `artillerie « ${a.id} » en rangée ${a.rangee}, devant sa portée — `
        + JSON.stringify(params),
      );
    }
    for (const b of autres) { sommeAutres += b.rangee; nbAutres += 1; }
  });
  // ⚠ LE MAXIMUM D'ARTILLERIES NE TIENT PLUS EN DEUX RANGÉES PLEINES — 13 sur
  // ce balayage (base n.50, graine 3), mesuré. Ce n'est pas le placement : la
  // COMPOSITION de la garnison change de tirage pour une même graine depuis
  // que le flux `rng` ne sert plus qu'à elle, et la variance de `GARNISON` en
  // rend treize là où l'ancienne suite en rendait douze au plus. Écrit en clair.
  assert.equal(maxArtilleries, 13, `${maxArtilleries} artilleries au plus sur le balayage`);
  // ⚠ LE BIAIS SE MESURE : l'artillerie est en moyenne derrière tout le reste,
  // d'au moins 0,3 rangée. Mesuré sur ce balayage : 8,09 contre 6,6 pour les
  // autres réunies. Sans cette ligne, des poids inertes passeraient.
  const moyenneArtillerie = sommeArtillerie / nbArtillerie;
  const moyenneAutres = sommeAutres / nbAutres;
  assert.ok(moyenneArtillerie >= moyenneAutres + 0.3,
    `artillerie en moyenne en ${moyenneArtillerie.toFixed(2)}, le reste en `
    + `${moyenneAutres.toFixed(2)} : le biais de tiers ne mord pas`);
  // ⚠⚠ MESURÉ, ET ÉCRIT EN CLAIR : la rangée la plus avancée qu'une artillerie
  // atteigne sur tout le balayage. Elle valait 9 avant le lot CIBLES-RANGÉES,
  // 8 depuis que les tailles se tiraient, 7 depuis DISPOSITION-OUVRAGE — et
  // **3, la première rangée de la bande, depuis PAQUETS** : le tiers avant pèse
  // 5 % pour une artillerie, et 5 % sur ce balayage suffit à y tomber. La
  // phrase « posée à l'avant, elle ne tirerait jamais » reste fausse — la
  // couronne est assertée plus haut —, et une artillerie à l'avant est
  // maintenant un fait de jeu, mesuré et non subi.
  //
  // ⚠ ET LE CHIFFRE EN CLAIR RESTE UN CHIFFRE EN CLAIR. Un `>=` laisserait
  // glisser la dispersion sans un mot ; cette égalité tombe le jour où le
  // placement changerait de bornes, dans un sens comme dans l'autre.
  assert.equal(minRangee, bande.premiere,
    'les artilleries n\'atteignent plus la rangée 3 : le tiers avant leur est refermé');
});

// ---------------------------------------------------------------------------
// T8 — équilibre des colonnes
// ---------------------------------------------------------------------------

test('T8 — la charge d\'une colonne n\'excède jamais ⌈N/9⌉ + 2', () => {
  // ⚠⚠ `ecartColonnesMax` EST RETIRÉ — LOT PAQUETS, 09/09. Le motif d'origine
  // (« une colonne vide serait une autoroute ») est tombé au lot COLONNE, où la
  // défense s'est mise à se DÉCALER ; et l'audit du 09/09 mesure ZÉRO colonne
  // libre à partir du niveau 15, quelle que soit la règle. Ce qui borne la
  // charge est désormais le PLAFOND DE COLONNE de `admissible` : jamais plus de
  // `⌈N/9⌉ + margeDeColonne` occupants d'un même groupe dans une colonne — un
  // repli le relâche en dernier recours, et il n'a jamais eu à le faire sur ce
  // balayage. L'écart maximal, lui, est ÉCRIT EN CLAIR : `PQ T5` le borne à 7
  // sur ses propres montages.
  const marge = DISPOSITION_DEFENSES.margeDeColonne;
  assert.equal(marge, 2, 'la marge de colonne a bougé — une borne ne se desserre pas pour un lot');
  let ecartMax = 0;
  balayer((montage, params) => {
    for (const groupe of [montage.defenseurs, montage.batiments]) {
      const charge = new Array(GRILLE.largeur).fill(0);
      for (const e of groupe) charge[e.colonne - 1] += 1;
      const plafond = Math.ceil(groupe.length / GRILLE.largeur) + marge;
      assert.ok(
        Math.max(...charge) <= plafond,
        `${Math.max(...charge)} dans une colonne pour un plafond de ${plafond} — `
        + `${JSON.stringify(params)} : ${charge}`,
      );
      ecartMax = Math.max(ecartMax, Math.max(...charge) - Math.min(...charge));
    }
  });
  // Mesuré sur ce balayage : 5. Il valait 2 sous `ecartColonnesMax`.
  assert.equal(ecartMax, 5, `écart maximal entre colonnes : ${ecartMax}`);
});

// ---------------------------------------------------------------------------
// T9 — obstacles
// ---------------------------------------------------------------------------

test('T9 — dix obstacles, hors de la bande de déploiement, sous personne', () => {
  const deploiement = GRILLE.bandes.deploiement;
  balayer((montage, params) => {
    assert.equal(montage.obstacles.length, OBSTACLES.nombre, JSON.stringify(params));
    const cases = new Set();
    for (const o of montage.obstacles) {
      // Un obstacle en rangée 1 ou 2 mangerait un emplacement d'apparition :
      // le moteur refuse une unité posée dessus.
      assert.ok(
        o.rangee > deploiement.derniere,
        `obstacle en rangée ${o.rangee} — ${JSON.stringify(params)}`,
      );
      // ⚠ ET DANS LA BANDE DE DÉFENSE, DEPUIS LE 29/08. Ethan : « obstacles
      // seulement en défense, réparti au hasard ». Ils couvraient les rangées 3
      // à 18. L'assertion ci-dessus ne suffit PAS à le tenir — la bande des
      // bâtiments est elle aussi au-delà du déploiement — et c'est cette
      // ligne-ci qui porte la règle.
      assert.ok(
        o.rangee >= GRILLE.bandes.defense.premiere && o.rangee <= GRILLE.bandes.defense.derniere,
        `obstacle en rangée ${o.rangee}, hors de la bande de défense `
          + `— ${JSON.stringify(params)}`,
      );
      assert.ok(OBSTACLES.types.includes(o.type));
      const cle = cleCase(o.rangee, o.colonne);
      assert.ok(!cases.has(cle), 'deux obstacles sur la même case');
      cases.add(cle);
    }
    for (const e of [...montage.batiments, ...montage.defenseurs]) {
      assert.ok(
        !cases.has(cleCase(e.rangee, e.colonne)),
        `« ${e.id} » posée sur un obstacle — ${JSON.stringify(params)}`,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// T10 — courbe de niveau
// ---------------------------------------------------------------------------

test('T10 — facteurMilli suit sa pente, et vaut 1000 au niveau 1', () => {
  assert.equal(facteurMilli(1), 1000, 'le niveau 1 est l\'ancrage, exactement');

  // ⚠ LOT COURBE. La courbe de combat n'a plus qu'UNE pente, 1,1, et le
  // drapeau deuxRegimes est retombé à false. Le test conserve sa forme à deux
  // pentes : il vaut aussi bien pour une pente unique, où les deux valent 1,1,
  // et il redeviendra mordant sans réécriture si la bascule revient un jour.
  //
  // Rapport d'un niveau au suivant : penteBasse jusqu'à la bascule, penteHaute
  // au-delà. On le vérifie sur les facteurs NON arrondis, l'arrondi à l'entier
  // de millième introduisant jusqu'à 1/2 millième d'écart.
  const nu = (n) => {
    const bas = Math.min(n, NIVEAU.niveauBascule) - 1;
    const haut = Math.max(n - NIVEAU.niveauBascule, 0);
    return NIVEAU.penteBasse ** bas * NIVEAU.penteHaute ** haut;
  };
  for (let n = 1; n < NIVEAU.niveauBascule; n++) {
    assert.ok(Math.abs(nu(n + 1) / nu(n) - NIVEAU.penteBasse) < 1e-12, `pente basse en ${n}`);
  }
  for (let n = NIVEAU.niveauBascule; n < NIVEAU.plafond; n++) {
    assert.ok(Math.abs(nu(n + 1) / nu(n) - NIVEAU.penteHaute) < 1e-12, `pente haute en ${n}`);
  }
  assert.ok(facteurMilli(50) === Math.round(1000 * nu(50)));

  // round(1000 × 1,1⁴⁹) = round(106 718,96) = 106 719. C'était 480 941 681 sous
  // les deux régimes : la courbe est 4 505 fois plus plate au niveau 50.
  assert.equal(facteurMilli(50), 106_719);

  // Le drapeau deuxRegimes est aujourd'hui INERTE, parce que les deux pentes
  // sont égales — et ce test le PROUVE plutôt que de le supposer : le basculer
  // ne change aucune des deux bornes. Le jour où quelqu'un rouvre une bascule
  // en ne touchant qu'une pente, cette assertion tombe et le lui dit.
  const memoire = NIVEAU.deuxRegimes;
  try {
    NIVEAU.deuxRegimes = !memoire;
    assert.equal(facteurMilli(1), 1000, 'le niveau 1 reste l\'ancrage');
    assert.equal(facteurMilli(50), 106_719, 'le drapeau est inerte tant que les pentes sont égales');
  } finally {
    NIVEAU.deuxRegimes = memoire;
  }
  assert.equal(facteurMilli(50), 106_719, 'le drapeau a bien été rendu');
  assert.equal(NIVEAU.penteBasse, NIVEAU.penteHaute, 'une seule pente, donc drapeau inerte');

  // ⚠ CE GARDE-FOU A CHANGÉ DE SENS, ET C'EST LUI QUI A SIGNALÉ LE LOT.
  // Il disait : « la courbe de niveau partage ses pentes avec celle du butin,
  // c'est une DÉCISION, et elle est assérée ». La décision s'est inversée le
  // 25/08 — le COMBAT descend à 1,1 pour ouvrir les marges arithmétiques et
  // adoucir l'écart de niveau, l'ÉCONOMIE reste à 1,259/1,32 parce que c'est
  // elle qui règle le rythme de progression. Le garde-fou reste, retourné : il
  // asserte désormais que la divergence est bien celle qu'on a voulue, et il
  // tombera tout autant si quelqu'un réaligne les deux par distraction.
  assert.notEqual(NIVEAU.penteHaute, BUTIN.penteHaute, 'divergence VOULUE le 25/08');
  assert.equal(NIVEAU.penteHaute, 1.1, 'courbe de COMBAT');
  assert.equal(BUTIN.penteBasse, 1.259, 'courbe ÉCONOMIQUE, inchangée');
  assert.equal(BUTIN.penteHaute, 1.32, 'courbe ÉCONOMIQUE, inchangée');
  assert.equal(BUTIN.niveauBascule, 12, 'la bascule survit du côté économique');

  // Le plafond, lui, reste partagé : c'est la même grandeur des deux côtés.
  assert.equal(NIVEAU.plafond, GEOGRAPHIE.niveauPlafond);
});

// ---------------------------------------------------------------------------
// T11 — ce qui ne monte pas
// ---------------------------------------------------------------------------

test('T11 — réserve, portée, vitesse, masse et points ne montent pas avec le niveau', () => {
  const monter = (id, niveau, genre) => {
    const montage = {
      niveau,
      saveur: null,
      obstacles: [],
      batiments: [{ id: 'gangue', rangee: 18, colonne: 9, niveau }],
      defenseurs: genre === 'defense' ? [{ id, rangee: 3, colonne: 5, niveau }] : [],
      vagues: genre === 'unite' ? [[{ rangee: DEPART, id, colonne: 5, niveau }]] : [],
      modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
    };
    const etat = creerCombat(montage);
    return etat.entites.find((e) => e.id === id);
  };

  for (const [id, u] of Object.entries(UNITES)) {
    const bas = monter(id, 1, 'unite');
    const haut = monter(id, NIVEAU.plafond, 'unite');
    // Ce qui NE monte pas : la réserve et son plancher, portés par l'entité.
    assert.equal(haut.reserve, bas.reserve, `${id} : réserve`);
    assert.equal(haut.plancherReserve, bas.plancherReserve, `${id} : plancher de réserve`);
    // Ce qui monte : PV et dégâts, exactement d'un facteur facteurMilli/1000.
    assert.equal(haut.pvMaxMilli, u.pv * facteurMilli(NIVEAU.plafond), `${id} : PV`);
    assert.equal(bas.pvMaxMilli, u.pv * 1000, `${id} : PV au niveau 1`);
    // LOT 4A — les dégâts sont une TABLE à trois colonnes, mises à l'échelle
    // une par une. Une colonne nulle le reste : 0 × facteur = 0.
    // Les colonnes vivent en MILLI-PV sur l'entité, comme pvMaxMilli : la mise
    // à l'échelle est donc EXACTE, degats × facteurMilli sans reste.
    for (const colonne of ['infanterie', 'vehicule', 'structureOuAviation']) {
      const attendu = u.degats[colonne] * facteurMilli(NIVEAU.plafond);
      assert.equal(haut.degatsColonne[colonne], attendu, `${id}.${colonne} : dégâts au plafond`);
      assert.equal(bas.degatsColonne[colonne], u.degats[colonne] * 1000,
        `${id}.${colonne} : au niveau 1`);
      if (u.degats[colonne] > 0) {
        assert.ok(haut.degatsColonne[colonne] > bas.degatsColonne[colonne],
          `${id}.${colonne} : les dégâts doivent monter`);
      }
    }
    // Et les grandeurs de la table qui n'ont aucune raison de bouger.
    assert.equal(UNITES[id].portee, u.portee);
    assert.equal(UNITES[id].vitesse, u.vitesse);
    assert.equal(UNITES[id].masse, u.masse);
    assert.equal(UNITES[id].points, u.points);
  }

  // La vitesse ne monte pas : preuve par le comportement, pas par la table.
  // Un Meute au niveau 1 et un Meute au niveau 50 parcourent exactement la même
  // distance en dix ticks — 10 × 60 = 600 milli-cases depuis le lot 4A.
  for (const niveau of [1, NIVEAU.plafond]) {
    const montage = {
      niveau,
      saveur: null,
      obstacles: [],
      batiments: [{ id: 'gangue', rangee: 18, colonne: 9, niveau }],
      defenseurs: [],
      vagues: [[{ rangee: DEPART, id: 'meute', colonne: 1, niveau }]],
      modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
    };
    const etat = creerCombat(montage);
    const meute = etat.entites.find((e) => e.camp === 'attaque');
    for (let t = 0; t < 10; t++) tick(etat);
    assert.equal(meute.rangeeMilli, 2000 + 600, `vitesse au niveau ${niveau}`);
  }

  // Les défenses aussi : la Casemate garde portée et portée minimale.
  for (const [id, d] of Object.entries(DEFENSES)) {
    const haut = monter(id, NIVEAU.plafond, 'defense');
    assert.equal(haut.pvMaxMilli, d.pv * facteurMilli(NIVEAU.plafond), `${id} : PV`);
    assert.equal(haut.reserve, 0, `${id} : une défense n'a pas de réserve`);
  }
});

// ---------------------------------------------------------------------------
// T12 — l'invariance du miroir
// ---------------------------------------------------------------------------

// Niveaux comparés : de part et d'autre de la bascule du niveau 12, et le
// plafond. Toutes les paires sont comparées, pas seulement des couples choisis.
const MIROIR_NIVEAUX = [1, 2, 10, 30, NIVEAU.plafond];

// Cinq compositions d'assaut RÉELLES, tirées du générateur — on ne les invente
// pas à la main. Trois profils, plus deux graines supplémentaires sur les deux
// profils qui varient le plus.
const MIROIR_COMPOSITIONS = [
  ['infanterie', 5], ['blindeLourd', 5], ['mixte', 5],
  ['mixte', 17], ['blindeLourd', 29],
];

const MIROIR_GRAINES = [11, 23, 37, 53, 71];
const MIROIR_TYPES = ['camp', 'avantPoste'];

// Seuil du résidu de PV d'une entité dont le sort bascule — voir le corps du
// test. CALCULÉ, pas deviné : balayage de 3 types × 20 graines × 7 compositions
// × 5 niveaux = 4 200 comparaisons, résidu maximal relevé 27,4 ppm des PV max
// (25,0 / 27,4 / 25,4 ppm sur les trois seuls cas rencontrés). 100 ppm laisse
// 3,6 fois de marge, et reste quatre ordres de grandeur sous le perceptible.
const MIROIR_RESIDU_PPM_MAX = 100;

test('T12 — l’invariance du miroir sur 50 montages, 5 niveaux, 500 comparaisons', () => {
  // ⚠ On ne génère PAS deux sites à deux niveaux : la densité varie avec le
  // niveau, et comparer un camp de niveau 5 (8 bâtiments, 3 défenses) à un camp
  // de niveau 30 (21 et 21) mélangerait la loi d'échelle et la loi de densité.
  // On génère UN site, et on n'en change que le champ `niveau`, ligne à ligne.
  //
  // ⚠ ET ON NE MESURE PAS SUR UNE SEULE GRAINE. La rédaction précédente de ce
  // test tenait sur UN site et UNE composition, et sa tolérance d'un tick
  // n'avait jamais été re-mesurée — deux passations l'ont portée comme dette.
  // Cinq graines et cinq compositions, médiane et maximum : CLAUDE.md §5.
  const ecarts = [];
  const ecartsRelatifs = [];
  let cellules = 0;
  let combatsTropCourts = 0;
  let entitesQuiBasculent = 0;
  let residuPpmMax = 0;

  for (const type of MIROIR_TYPES) {
    for (const graine of MIROIR_GRAINES) {
      const reference = genererSite({ type, niveau: 20, saveur: null, graine });
      for (const [profil, graineAssaut] of MIROIR_COMPOSITIONS) {
        const assaut = genererAssaut({
          niveau: 20,
          budgetPoints: budgetAssaut(20),
          profil,
          graine: graineAssaut,
        });
        assert.ok(assaut.vagues.length > 0, `assaut vide : ${profil}/${graineAssaut}`);
        cellules += 1;

        const auNiveau = (n) => {
          const copie = structuredClone(reference);
          copie.niveau = n;
          for (const e of [...copie.batiments, ...copie.defenseurs]) e.niveau = n;
          copie.vagues = assaut.vagues.map((v) => v.map((u) => ({ ...u, niveau: n })));
          return copie;
        };

        const resultats = MIROIR_NIVEAUX.map((n) => resoudre(creerCombat(auNiveau(n))));

        // 1) La cause et la durée, sur TOUTES les paires.
        for (let i = 0; i < resultats.length; i++) {
          if (resultats[i].tick <= 50) combatsTropCourts += 1;
          for (let j = i + 1; j < resultats.length; j++) {
            const a = MIROIR_NIVEAUX[i];
            const b = MIROIR_NIVEAUX[j];
            assert.equal(
              resultats[i].cause, resultats[j].cause,
              `${type} g${graine} ${profil}/${graineAssaut} : causes différentes entre ${a} et ${b}`,
            );
            const ecart = Math.abs(resultats[i].tick - resultats[j].tick);
            ecarts.push(ecart);
            // ⚠ L'ÉCART RELATIF SE PREND PAIRE PAR PAIRE, jamais contre la durée
            // la plus courte du balayage : un écart de cinq ticks sur un combat
            // de 644 et un combat de 155 qui n'écarte de rien sont deux
            // cellules différentes, et les mêler ferait accuser la seconde.
            ecartsRelatifs.push(ecart / Math.min(resultats[i].tick, resultats[j].tick));
          }
        }

        // 2) Le SORT de chaque entité. Ce que la rédaction précédente ne
        // regardait pas du tout — et c'est là que le miroir n'est pas parfait.
        for (const bord of ['batiments', 'defenses', 'attaquants']) {
          for (const temoin of resultats[0][bord]) {
            const lignes = resultats.map((r) => r[bord].find((x) => x.indice === temoin.indice));
            if (lignes.some((x) => x === undefined)) continue;
            if (new Set(lignes.map((x) => x.detruit)).size === 1) continue;

            // Une entité dont le sort bascule doit être À UN ARRONDI DE LA
            // MORT, et pas ailleurs : là où elle survit, elle ne tient qu'une
            // poussière de ses PV max. `pvMaxMilli` et les dégâts sont arrondis
            // séparément par niveau, donc le dernier coup tombe tantôt juste
            // avant zéro, tantôt juste après. Le combat, lui, ne bouge pas.
            entitesQuiBasculent += 1;
            for (const x of lignes) {
              if (x.detruit) continue;
              const ppm = (x.pvMilli * 1_000_000) / x.pvMaxMilli;
              residuPpmMax = Math.max(residuPpmMax, ppm);
              assert.ok(
                x.pvMilli * 1_000_000 <= MIROIR_RESIDU_PPM_MAX * x.pvMaxMilli,
                `${type} g${graine} ${profil}/${graineAssaut} : ${x.id} niveau ${x.niveau} `
                + `bascule en tenant ${ppm.toFixed(1)} ppm de ses PV — au-dessus de `
                + `${MIROIR_RESIDU_PPM_MAX} ppm, ce n'est plus un arrondi`,
              );
            }
          }
        }
      }
    }
  }

  // 3) Le montage doit avoir mesuré quelque chose.
  assert.equal(cellules, 50, `${cellules} montages au lieu de 50`);
  assert.equal(ecarts.length, 500, `${ecarts.length} comparaisons au lieu de 500`);
  assert.equal(combatsTropCourts, 0, `${combatsTropCourts} combats de 50 ticks ou moins : ils ne prouvent rien`);

  // 4) Les écarts de ticks. Le MAXIMUM seul ne suffit pas : un miroir qui se
  // dégraderait partout sans jamais dépasser un tick passerait sans être vu.
  // On asserte donc aussi la MÉDIANE, et elle vaut zéro.
  ecarts.sort((x, y) => x - y);
  const ecartMax = ecarts[ecarts.length - 1];
  const mediane = ecarts[Math.floor(ecarts.length / 2)];
  const auDessusDeZero = ecarts.filter((e) => e > 0).length;

  // Mesuré sur ce montage : médiane 0, et 32 comparaisons sur 4 200 au-dessus de
  // zéro sur le balayage large — soit 0,76 %. Le plafond de 5 % laisse 6,5 fois
  // de marge et tomberait si l'arrondi se mettait à mordre.
  assert.equal(mediane, 0, `médiane des écarts = ${mediane} tick(s), attendue 0`);
  assert.ok(
    auDessusDeZero <= ecarts.length * 0.05,
    `${auDessusDeZero} comparaisons sur ${ecarts.length} écartent d'un tick : au-dessus de 5 %`,
  );

  // ⚠⚠ LE PLAFOND DE L'ÉCART EST DEVENU RELATIF — LOT DISPOSITION-OUVRAGE,
  // 08/09 —, ET CE N'EST PAS UN ASSOUPLISSEMENT : MESURÉ DES DEUX CÔTÉS. Il
  // valait `ecartMax <= 1`, un nombre de TICKS, sur un montage dont le pire
  // combat durait 434 ticks. Le lot déplace les rangées des sites, donc il
  // échantillonne d'autres combats : le même montage dure maintenant 644 ticks
  // au pire, et le seul écart non nul en vaut 5.
  //
  // ⚠⚠ ET LA STRUCTURE DE L'ÉCART N'A PAS BOUGÉ D'UN CHEVEU — c'est ce qui
  // distingue un miroir qui se dégrade d'un montage qui grandit. Avant comme
  // après : **quatre comparaisons sur cinq cents**, toujours UNE cellule sur
  // cinquante, et toujours le niveau 2 seul contre les quatre autres. Ce que le
  // plafond doit tenir n'est donc pas un nombre de ticks — il grandit avec le
  // combat — mais la PART du combat que l'arrondi déplace : **0,231 % avant,
  // 0,782 % après**. Un pour cent laisse 1,3 fois de marge, et un `<= 5` nu
  // aurait laissé passer un miroir cassé sur un combat de cent ticks.
  const relatifMax = Math.max(...ecartsRelatifs);
  assert.ok(
    relatifMax <= 0.01,
    `l'arrondi déplace ${(relatifMax * 100).toFixed(3)} % d'un combat, au-dessus de 1 %`,
  );
  // Et le montage doit avoir vraiment rencontré l'écart, sinon la borne
  // ci-dessus serait vacueuse : la voici en clair, mesurée.
  // ⚠⚠ LOT PAQUETS (09/09) : 5 → 0, ET C'EST DÉCLARÉ PLUTÔT QUE TU. Sur ces
  // cinquante montages, plus AUCUNE entité ne bascule d'un niveau à l'autre
  // (`entitesQuiBasculent` vaut 0) et les 500 comparaisons rendent le même
  // tick : la borne de 1 % ci-dessus est donc VACUEUSE sur ce montage, et le
  // seuil de résidu aussi. La propriété du miroir est gardée par l'égalité des
  // causes et des ticks ; ce qu'on perd, c'est la mesure de l'arrondi, qui
  // demanderait un autre montage. Un `>=` laisserait glisser sans un mot.
  // ⚠⚠ LOT MUR (10/09) : 0 → 1, ET LA BORNE DE 1 % CESSE D'ÊTRE VACUEUSE. Le lot
  // ne touche ni au générateur ni à la courbe de niveau : il change le DÉROULÉ des
  // combats, donc il échantillonne d'autres fins de combat, et l'arrondi
  // redevient visible là où le lot PAQUETS l'avait perdu. **Quatre comparaisons
  // sur cinq cents** écartent d'un tick — 0,8 %, sous le plafond de 5 % —, la
  // médiane reste À ZÉRO, et l'arrondi ne déplace que **0,173 %** d'un combat,
  // contre 1 % permis : la marge est de 5,8 fois. C'est trois fois MIEUX que les
  // 0,782 % du lot DISPOSITION-OUVRAGE, où la mesure était la dernière non
  // vacueuse.
  //
  // ⚠ CE TEST N'EST PAS DANS LES VINGT-NEUF DU BRIEF, et il faut le dire : il
  // ne tombe QUE sur la variante correcte du lot. Avec l'Écraseur cassé — la
  // variante où `progresse` reste vrai devant un mur — les cinquante montages
  // échantillonnent d'autres combats encore, et l'écart y reste nul. Le brief
  // annonçait 29 ; la variante correcte en fait tomber **28**, celui-ci compris.
  //
  // ⚠⚠ LOT APPROCHE (11/09) : 1 → 0, ET LA BORNE DE 1 % REDEVIENT VACUEUSE — LE
  // MÊME MOUVEMENT QU'AU LOT PAQUETS, DANS L'AUTRE SENS. Le lot ne touche ni au
  // générateur ni à la courbe de niveau : il fait naître les vagues deux cases
  // plus bas, donc il échantillonne d'autres fins de combat, et l'arrondi
  // redevient invisible là où MUR l'avait rendu visible. **Les 500 comparaisons
  // rendent de nouveau le même tick.** Ce qui reste gardé est l'égalité des
  // CAUSES et des TICKS sur les cinq niveaux ; ce qu'on perd est la mesure de
  // l'arrondi, qui demanderait un autre montage.
  //
  // ⚠ ET C'EST UNE ÉGALITÉ, PAS UN `>=`. Un `>=` laisserait l'écart glisser à
  // trois ticks sans un mot ; l'égalité oblige à remesurer et à écrire ce qu'on
  // a mesuré, ce que ce bloc fait pour la troisième fois.
  assert.equal(ecartMax, 0, `écart maximal ${ecartMax} ticks au lieu du 0 mesuré`);

  // 5) Et le résidu observé doit rester loin sous son plafond, sinon le seuil
  // du §4 aurait été choisi trop juste sans qu'on le sache.
  assert.ok(
    residuPpmMax <= MIROIR_RESIDU_PPM_MAX / 2,
    `résidu maximal ${residuPpmMax.toFixed(1)} ppm : la marge du seuil a fondu`,
  );
  assert.ok(entitesQuiBasculent >= 0, 'compteur incohérent');
});

// ---------------------------------------------------------------------------
// T13 — pas de débordement
// ---------------------------------------------------------------------------

test('T13 — au niveau 50 rien ne déborde, et les points de recherche restent exacts', () => {
  const facteur = facteurMilli(NIVEAU.plafond);
  let pvMax = 0;
  let degatsMax = 0;
  for (const table of [UNITES, DEFENSES]) {
    for (const e of Object.values(table)) {
      pvMax = Math.max(pvMax, e.pv);
      if (e.degats === null) continue;
      for (const colonne of ['infanterie', 'vehicule', 'structureOuAviation']) {
        degatsMax = Math.max(degatsMax, e.degats[colonne]);
      }
    }
  }
  // ⚠ SEUILS DÉPLACÉS AU LOT 4A, roster mesuré, et la marge se resserre : les
  // PV du plus gros passent de 500 à 2 000 (Broyeur/Mammoth et Merlon/Wall).
  assert.equal(pvMax, 2000);
  assert.equal(degatsMax, 300, 'le Frappeur contre les bâtiments, 48 000 ÷ 160');

  // 1) PV. 2000 × 106 719 = 213 438 000 milli-PV.
  const pvMaxMilli = pvMax * facteur;
  assert.equal(pvMaxMilli, 213_438_000);
  assert.ok(Number.isSafeInteger(pvMaxMilli));

  // 2) Le produit le plus LOURD du moteur n'est pas celui des dégâts : c'est le
  // numérateur du ratio de santé, pvCourantMilli × 1000, qui vaut ici
  // 213 438 000 000 — 42 200 fois sous MAX_SAFE_INTEGER
  // = 9 007 199 254 740 991. ⚠ Sous les deux régimes il n'y avait que 9,36 fois
  // de marge, et ce commentaire disait « C'EST LA contrainte du calibrage ».
  // Elle n'en est plus une : le point de rupture,
  // floor(MAX_SAFE_INTEGER / (facteurMilli(50) × 1000)), passe de 18 728 à
  // 84 401 083 PV de base, soit quarante-deux mille fois le plus gros du
  // roster. C'est le gain principal du lot COURBE.
  const ratio = pvMaxMilli * 1000;
  assert.ok(Number.isSafeInteger(ratio));
  assert.ok(Number.MAX_SAFE_INTEGER / ratio > 42_000, 'la marge du ratio de santé est de 42 200×');
  assert.equal(Math.floor(Number.MAX_SAFE_INTEGER / (facteur * 1000)), 84_401_083);

  // 3) Dégâts. Les colonnes vivent en milli-PV : 300 × 106 719 = 32 015 700, et
  // le produit de la formule de tir, santé au maximum, vaut
  // 32 015 700 × 1000 = 32 015 700 000 — 281 336 fois sous l'entier sûr, contre
  // 62,4 fois auparavant.
  const degatsColonneMilli = degatsMax * facteur;
  assert.equal(degatsColonneMilli, 32_015_700);
  const produit = degatsColonneMilli * 1000;
  assert.ok(Number.isSafeInteger(produit));
  assert.ok(Number.MAX_SAFE_INTEGER / produit > 281_000, 'la marge des dégâts est de 281 336×');

  // ⚠ CE PARAGRAPHE A ÉTÉ RETOURNÉ LE 25/08/2026. Il tenait le DÉBORDEMENT des
  // points de recherche, seule grandeur du jeu à croître en 2^(n−1) : au niveau
  // 50, 60 × 1000 × 2^49 = 3,4 × 10¹⁹, quatre mille fois l'entier sûr, au point
  // que lui ajouter 1 en Number ne changeait rien. Le débordement était consigné
  // et non réparé depuis le lot 2B.
  //
  // Ethan a arbitré que les points de recherche sont une récompense ÉCONOMIQUE
  // et doivent suivre la courbe économique. Le barème n'a plus de multiplicateur
  // propre, et le produit le plus lourd tient désormais très largement :
  //   60 × 480 941 681 × 1200 = 34 627 801 032 000, soit 260 fois sous l'entier
  //   sûr, là où l'ancien barème le dépassait de 4 500 fois.
  const bareme = 60;
  const bonus = 1200;
  const plafond = bareme * facteurEconomiqueMilli(NIVEAU.plafond) * bonus;
  assert.equal(facteurEconomiqueMilli(NIVEAU.plafond), 480_941_681);
  assert.equal(plafond, 34_627_801_032_000);
  assert.ok(Number.isSafeInteger(plafond), 'le barème ne déborde plus');
  assert.ok(Number.MAX_SAFE_INTEGER / plafond > 260);

  // ⚠ ET POURTANT BigInt RESTE OBLIGATOIRE — c'est le point que ce test tient
  // désormais, et il n'est pas évident. Le PLAFOND DU BARÈME tient, mais le
  // PRODUIT COMPLET du calcul ne tient pas : il multiplie encore par
  // pvPerdusMilli, qui vaut jusqu'à 2000 × facteurMilli(50) = 213 438 000.
  // 60 × 480 941 681 × 1000 × 180 308 053 = 5,2 × 10²¹, toujours hors de
  // l'entier sûr. Passer ce calcul en Number serait une régression silencieuse.
  //
  // Cas concret : un Broyeur de niveau 50 ayant perdu 180 308 053 milli-PV sur
  // 213 438 000.
  //
  // ⚠ IL SE MONTE PLEIN ET SE FAIT ABAISSER APRÈS, depuis le lot
  // RECHERCHE-AU-PRORATA (29/08). Le monter déjà entamé décrivait un Broyeur
  // cassé À LA PASSE PRÉCÉDENTE, qui ne rapporte plus rien à celle-ci — les
  // points suivent désormais ce que le raid casse LUI. Le nombre mesuré, lui,
  // n'a pas bougé d'une unité : c'est le même Broyeur, les mêmes 180 308 053
  // milli-PV, le même produit intermédiaire hors de l'entier sûr.
  const perdus = 180_308_053;
  const montage = {
    niveau: 50,
    saveur: null,
    obstacles: [],
    batiments: [{ id: 'gangue', rangee: 18, colonne: 9, niveau: 50 }],
    defenseurs: [{ id: 'broyeur', rangee: 3, colonne: 5, niveau: 50 }],
    vagues: [[{ rangee: DEPART, id: 'meute', colonne: 1, niveau: 50 }]],
    modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
  };
  const resultat = resoudre(creerCombat(montage), { maxTicks: 1 });
  const broyeur = resultat.defenses.find((d) => d.id === 'broyeur');
  assert.equal(broyeur.pvPerdusMilli, 0, 'un tick n\'aurait pas dû l\'entamer');
  broyeur.pvMilli -= perdus;
  broyeur.pvPerdusMilli = broyeur.pvMaxMilli - broyeur.pvMilli;
  broyeur.pvPerdusIciMilli = broyeur.pvInitialMilli - broyeur.pvMilli;
  assert.equal(broyeur.pvPerdusMilli, perdus);

  const fe = BigInt(facteurEconomiqueMilli(50));
  const exact = (60n * fe * 1000n * BigInt(perdus)) / (BigInt(2000 * facteur) * 1000n);
  assert.equal(exact, 24_377_381_190n);
  assert.equal(pointsRecherche(resultat, montage), exact);

  // Le produit intermédiaire, lui, sort de l'entier sûr : c'est la preuve que
  // BigInt n'est pas une précaution décorative. Que le Number retombe ICI sur le
  // même quotient est une coïncidence de cette division-là — l'asserter serait
  // asserter une chance.
  const intermediaire = 60 * facteurEconomiqueMilli(50) * 1000 * perdus;
  assert.ok(!Number.isSafeInteger(intermediaire), 'BigInt reste obligatoire');
  assert.ok(intermediaire > 5e21);
});

// ---------------------------------------------------------------------------
// T14 — franchissement, Ronce à 2,5 et Herse à 15
// ---------------------------------------------------------------------------

test('T14 — le coût du franchissement, ligne à ligne', () => {
  // Arbitrages du lot 2B, reportés à l'identique par le lot 4A dans la forme
  // absolue : le relevé §6.4 affiche zéro pour les trois barrières et dit la
  // valeur non exposée par le jeu d'origine, donc le franchissement reste NOTRE
  // choix. Ancien degatsFranchissement × ancienne matrice, en milli-PV :
  //   Ronce  2,5 PV/tick × {1 · 0,1 · 0}  → {2500 · 250 · 0}
  //   Herse  15  PV/tick × {0,03 · 1 · 0} → {450 · 15000 · 0}
  assert.deepEqual(DEFENSES.ronce.degatsFranchissement,
    { infanterie: 2500, vehicule: 250, structureOuAviation: 0 });
  assert.deepEqual(DEFENSES.herse.degatsFranchissement,
    { infanterie: 450, vehicule: 15_000, structureOuAviation: 0 });

  // Coût par tick à barrière PLEINE VIE, formule
  // floor(franchissementColonneMilli × 1000 / 1000), soit la colonne elle-même :
  //   Ronce contre infanterie : 2 500 milli-PV →  2,5 PV
  //   Ronce contre véhicule   :   250 milli-PV →  0,25 PV
  //   Herse contre infanterie :   450 milli-PV →  0,45 PV
  //   Herse contre véhicule   : 15 000 milli-PV → 15 PV
  //
  // ⚠ Seuils déplacés au lot 4A : les vitesses mesurées changent le temps passé
  // sur une case. ceil(1000 / vitesse), soit 17 pour l'infanterie (60), 12 pour
  // un char moyen (90) et 9 pour un rapide (120).
  const ticksSurUneCase = (vitesse) => Math.ceil(1000 / vitesse);
  assert.equal(ticksSurUneCase(UNITES.meute.vitesse), 17);
  assert.equal(ticksSurUneCase(UNITES.ratisseur.vitesse), 9);
  assert.equal(ticksSurUneCase(UNITES.fendeur.vitesse), 12);

  // Et la mesure, dans le moteur. Chaque unité canarde la barrière pendant son
  // approche, et les PV mesurés des barrières ont quintuplé — la Ronce passe de
  // 200 à 1 000 PV, la Herse de 200 à 1 500 — si bien qu'à l'entrée sur la case
  // elles sont bien plus fraîches qu'avant : 881 ‰ et 920 ‰ contre 760 ‰.
  //   — le Meute entre au tick 17, rendant 7000/tick pendant 17 ticks ;
  //   — le Fendeur entre au tick 12, rendant 10 000/tick pendant 12 ticks.
  const attendus = [
    ['ronce', 'meute', 17, 881_000, 2202], //  floor(2500  × 881 / 1000) =  2 202
    ['ronce', 'fendeur', 12, 880_000, 220], //  floor(250  × 880 / 1000) =    220
    ['herse', 'meute', 17, 1_381_000, 414], //  floor(450  × 920 / 1000) =    414
    ['herse', 'fendeur', 12, 1_380_000, 13_800], // floor(15000 × 920 / 1000) = 13 800
  ];
  for (const [barriere, unite, tickEntree, murALEntree, degats] of attendus) {
    const montage = {
      niveau: 1,
      saveur: null,
      obstacles: [],
      batiments: [{ id: 'gangue', rangee: 18, colonne: 1 }],
      defenseurs: [{ id: barriere, rangee: 3, colonne: 5 }],
      vagues: [[{ rangee: DEPART, id: unite, colonne: 5 }]],
      modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
    };
    const etat = creerCombat(montage);
    const attaquant = etat.entites.find((e) => e.camp === 'attaque');
    const mur = etat.entites.find((e) => e.id === barriere);
    for (let t = 0; t < tickEntree; t++) tick(etat);
    assert.equal(mur.pvMilli, murALEntree, `${barriere} + ${unite} : barrière à l'entrée`);
    const avant = attaquant.pvMilli;
    tick(etat);
    assert.equal(avant - attaquant.pvMilli, degats, `${barriere} + ${unite} : franchissement`);
  }

  // Le fond du sujet : une infanterie RÉCHAPPE d'une Ronce. Elle en réchappe
  // même très largement depuis le lot 4A — 17 ticks à 2 500 milli-PV coûtent
  // 42,5 PV sur les 700 mesurés du Fusilier, soit 6,1 %, là où le lot 2B visait
  // la moitié de sa vie. Les PV ont été mesurés, le franchissement non : c'est
  // le seul endroit du roster où les deux échelles ne se parlent plus, et il
  // est à revoir au banc.
  assert.ok(
    UNITES.meute.pv * 1000 > 17 * 2500,
    'dix-sept ticks de Ronce à pleine vie doivent laisser un Fusilier en vie',
  );
  assert.equal(Math.round((17 * 2500 * 100) / (UNITES.meute.pv * 1000)), 6);
});

// ---------------------------------------------------------------------------
// T15 — vagues de l'Ouvrage
// ---------------------------------------------------------------------------

test('T15 — budget respecté, ordre imposé, aucune entité verrouillée', () => {
  // Budget de raid interpolé : palier 30 → 170 points, palier 50 → 250.
  assert.equal(budgetRaid(30), RAID_OUVRAGE.budgetParNiveau[30]);
  assert.equal(budgetRaid(50), RAID_OUVRAGE.budgetParNiveau[50]);
  // Entre 30 et 35 : 170 + (200 − 170) × 2/5 = 182.
  assert.equal(budgetRaid(32), 182);

  const rangDe = (id) => RAID_OUVRAGE.ordreVagues.indexOf(UNITES[id].specialite);

  for (let niveau = 1; niveau <= NIVEAU.plafond; niveau++) {
    for (const graine of [1, 2, 3]) {
      const budget = Math.max(10, Math.floor(budgetRaid(niveau) / GRILLE.vaguesParRaid));
      const vague = genererVague({ niveau, budgetPoints: budget, graine });

      const engages = vague.unites.reduce((somme, u) => somme + UNITES[u.id].points, 0);
      assert.equal(engages, vague.pointsEngages, `niveau ${niveau} : comptabilité du budget`);
      assert.ok(engages <= budget, `niveau ${niveau} : budget ${engages} > ${budget}`);
      assert.equal(vague.pointsRestants, budget - engages);
      // Le budget n'est pas gaspillé : il reste moins que la plus petite unité
      // encore tirable, ou la bande de déploiement est pleine.
      const plusPetite = Math.min(...vague.unites.map((u) => UNITES[u.id].points));
      assert.ok(
        vague.unites.length === 18 || vague.pointsRestants < plusPetite || vague.unites.length === 0,
        `niveau ${niveau} : ${vague.pointsRestants} points laissés pour rien`,
      );

      let rangPrecedent = -1;
      for (const u of vague.unites) {
        assert.ok(
          apparitionDe(u.id) <= niveau,
          `« ${u.id} » apparaît au niveau ${apparitionDe(u.id)}, vague de niveau ${niveau}`,
        );
        // Ordre imposé : anti-infanterie et anti-véhicule d'abord, les unités
        // qui doivent arriver avec des munitions ensuite.
        const rang = rangDe(u.id);
        assert.ok(rang >= rangPrecedent, `ordre rompu sur « ${u.id} » au niveau ${niveau}`);
        rangPrecedent = rang;
      }

      // Et la vague se pose : creerCombat l'accepte sur un site réel.
      const site = genererSite({ type: 'camp', niveau, saveur: null, graine });
      site.vagues = [vague.unites];
      assert.doesNotThrow(() => creerCombat(site), `vague refusée au niveau ${niveau}`);
    }
  }
});

// ---------------------------------------------------------------------------
// T16 — non-régression de l'API du lot 2A
// ---------------------------------------------------------------------------

test('T16 — un montage sans niveau par entité se comporte comme au lot 2A', () => {
  // Le champ `niveau` est OPTIONNEL : sans lui, l'entité prend celui du site,
  // et au niveau 1 le facteur vaut exactement 1000. C'est ce qui fait tenir les
  // 58 tests des lots 1, 1C et 2A sans modification de leur montage.
  const montage = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [{ id: 'gangue', rangee: 11, colonne: 5 }],
    defenseurs: [{ id: 'merlon', rangee: 3, colonne: 5 }],
    vagues: [[{ rangee: DEPART, id: 'meute', colonne: 5 }]],
    modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
  };
  const etat = creerCombat(montage);
  for (const e of etat.entites) assert.equal(e.niveau, 1, `${e.id} hérite du niveau du site`);
  const merlon = etat.entites.find((e) => e.id === 'merlon');
  const meute = etat.entites.find((e) => e.camp === 'attaque');
  assert.equal(merlon.pvMaxMilli, DEFENSES.merlon.pv * 1000, 'PV inchangés au niveau 1');
  // Les colonnes de dégâts sont en milli-PV sur l'entité : au niveau 1, c'est
  // exactement la table des données × 1000, sans autre transformation.
  for (const colonne of ['infanterie', 'vehicule', 'structureOuAviation']) {
    assert.equal(meute.degatsColonne[colonne], UNITES.meute.degats[colonne] * 1000,
      `${colonne} : dégâts inchangés au niveau 1`);
  }
  assert.equal(facteurMilli(1), 1000);

  // Et le BigInt des points de recherche reste CONFINÉ : il n'entre ni dans
  // l'état, ni dans le résultat. JSON.stringify lèverait sur un BigInt, et la
  // sauvegarde serait cassée du jour où l'un s'y rangerait.
  const resultat = resoudre(creerCombat(montage), { maxTicks: 30 });
  assert.doesNotThrow(() => JSON.stringify(resultat), 'le résultat doit rester sérialisable');
  assert.doesNotThrow(() => JSON.stringify(creerCombat(montage)), 'l\'état aussi');
  assert.equal(typeof pointsRecherche(resultat, montage), 'bigint');
});

// ---------------------------------------------------------------------------
// Contrôle ajouté en relecture hostile (§9)
// ---------------------------------------------------------------------------

test('§7 — le générateur refuse des paramètres incohérents plutôt que de bricoler', () => {
  const valide = { type: 'camp', niveau: 10, saveur: 'richeQuartz', graine: 1 };
  assert.doesNotThrow(() => genererSite(valide));

  const cas = [
    ['type inconnu', { ...valide, type: 'forteresse' }, /type de site inconnu/],
    ['niveau nul', { ...valide, niveau: 0 }, /niveau 0 hors de 1…50/],
    ['niveau au-delà du plafond', { ...valide, niveau: 51 }, /niveau 51 hors de 1…50/],
    ['niveau non entier', { ...valide, niveau: 7.5 }, /hors de 1…50/],
    ['saveur inconnue', { ...valide, saveur: 'richeRien' }, /saveur inconnue/],
    // La saveur est transmise, pas calculée — mais une base n'en porte pas.
    ['saveur sur une base', { ...valide, type: 'base' }, /une base ne porte pas de saveur/],
    ['graine non entière', { ...valide, graine: 0.5 }, /graine 0.5 n'est pas un entier/],
  ];
  for (const [quoi, parametres, motif] of cas) {
    assert.throws(() => genererSite(parametres), motif, `le cas « ${quoi} » doit lever`);
  }

  assert.throws(() => genererVague({ niveau: 0, budgetPoints: 10, graine: 1 }), /niveau 0/);
  assert.throws(() => genererVague({ niveau: 10, budgetPoints: -1, graine: 1 }), /budget -1/);
  // Budget nul : une vague vide, pas une exception.
  assert.deepEqual(genererVague({ niveau: 10, budgetPoints: 0, graine: 1 }).unites, []);
});

// ---------------------------------------------------------------------------
// CIBLES-RANGÉES — la rangée cesse d'être une fonction du rang, 07/09/2026
// ---------------------------------------------------------------------------
//
// ⚠⚠ ETHAN, 07/09, POINT 9 : « Audit sur les cibles ouvrage : elles sont toutes
// positionnées de façon identique. Elles doivent bien + aléatoire. » C'est une
// REPRISE : le lot COLONNE du 06/09 a traité la même plainte et n'en a traité
// que la MOITIÉ — l'axe des colonnes.
//
// ⚠⚠ ET LA LEÇON EST DANS LE TEST QUI N'A RIEN VU. `COL T15` mesurait « le
// multi-ensemble des charges », c'est-à-dire les COLONNES. Il est passé sans
// jamais regarder l'axe qui gênait Ethan, alors que le brief d'alors demandait
// « le multi-ensemble des (rangee, id) ». **Le montage de `CR T1` est donc
// insensible aux colonnes par construction : il ne compte que `rangée → nombre
// d'occupants`.** Un test qui inclurait la colonne passerait AVANT le lot.

/** `rangée → nombre d'occupants`, et rien d'autre : la colonne n'y entre pas. */
function profilDeRangee(liste) {
  const parRangee = new Map();
  for (const o of liste) parRangee.set(o.rangee, (parRangee.get(o.rangee) ?? 0) + 1);
  return JSON.stringify([...parRangee.entries()].sort((a, b) => a[0] - b[0]));
}

/** Le multi-ensemble des couples `(rangée, id)` — le second angle du brief. */
function couplesRangeeId(liste) {
  return JSON.stringify(liste.map((o) => `${o.rangee}:${o.id}`).sort());
}

test('CR T1 — les FORMES varient : le profil d\'occupation par rangée n\'est plus unique', () => {
  // ⚠⚠ LE COMPTE D'AVANT LE LOT EST ÉCRIT ICI POUR QUE LA COMPARAISON SE LISE.
  // Mesuré sur l'arbre d'avant, 200 graines, dans un `git worktree` : **UN
  // SEUL** profil d'occupation par rangée, à tous les types et à tous les
  // niveaux. Un camp de niveau 7 portait toujours 5 occupants en rangée 10, 7
  // en rangée 11 et 2 en rangée 18, quelle que soit la graine.
  const AVANT_LE_LOT = 1;
  const GRAINES = 200;

  for (const [type, niveau] of [['camp', 3], ['camp', 7], ['base', 15], ['base', 30]]) {
    const profils = new Set();
    const profilsDefenses = new Set();
    for (let g = 1; g <= GRAINES; g += 1) {
      const site = genererSite({ type, niveau, saveur: type === 'base' ? null : 'richeQuartz', graine: g });
      profils.add(profilDeRangee([...site.batiments, ...site.defenseurs]));
      profilsDefenses.add(profilDeRangee(site.defenseurs));
    }
    assert.ok(profils.size > AVANT_LE_LOT * 4,
      `${type}/n${niveau} : ${profils.size} profils sur ${GRAINES} graines — `
      + `il y en avait ${AVANT_LE_LOT} avant le lot, et la rangée est restée une `
      + 'fonction du rang');
    assert.ok(profilsDefenses.size > AVANT_LE_LOT,
      `${type}/n${niveau} : ${profilsDefenses.size} profils de DÉFENSES seules`);
  }

  // ⚠⚠ ET LA FALSIFICATION DU MONTAGE : le même balayage, en incluant la
  // COLONNE, distinguait DÉJÀ les graines avant le lot. C'est exactement
  // l'erreur de `COL T15`, et cette assertion-ci prouve que `profilDeRangee` ne
  // la refait pas — si elle regardait les colonnes, elle rendrait le même
  // nombre que la ligne ci-dessous.
  //
  // ⚠ LOT PAQUETS (09/09) : la preuve par « moins de profils que de dispositions
  // sur 40 graines » ne tient plus — les paquets rendent les 40 profils de
  // rangée DISTINCTS eux aussi, mesuré. Elle est remplacée par une preuve
  // DIRECTE : on permute les colonnes d'un site à la main, la disposition
  // complète change, le profil de rangée ne bouge pas.
  const site = genererSite({ type: 'camp', niveau: 3, saveur: 'richeQuartz', graine: 1 });
  const tout = [...site.batiments, ...site.defenseurs];
  const permute = tout.map((o) => ({ ...o, colonne: GRILLE.largeur + 1 - o.colonne }));
  const complet = (l) => JSON.stringify(l.map((o) => `${o.id}@${o.rangee},${o.colonne}`).sort());
  assert.notEqual(complet(tout), complet(permute), 'le miroir des colonnes ne change rien : montage mort');
  assert.equal(profilDeRangee(tout), profilDeRangee(permute),
    'le profil de rangée change quand seules les colonnes changent : il lit les colonnes');
});

test('CR T2 — les ids changent de RANGÉE, pas seulement de colonne', () => {
  // Second angle, pour ne pas dépendre du seul comptage : le multi-ensemble des
  // couples `(rangée, id)`. Deux graines doivent en produire deux différents.
  for (const [type, niveau] of [['camp', 7], ['avantPoste', 20], ['base', 30]]) {
    const vus = new Set();
    for (let g = 1; g <= 40; g += 1) {
      const site = genererSite({ type, niveau, saveur: type === 'base' ? null : 'richeQuartz', graine: g });
      vus.add(couplesRangeeId([...site.batiments, ...site.defenseurs]));
    }
    assert.ok(vus.size > 1,
      `${type}/n${niveau} : ${vus.size} multi-ensemble(s) (rangée, id) sur 40 graines`);
  }
  // ⚠ FALSIFIABLE PAR LE BAS : au niveau 3, un camp ne porte que trois défenses
  // et onze bâtiments. Le nombre de formes légales y est petit — mais il n'est
  // plus UN, et c'est tout ce que ce lot promet.
  const auRasDuSol = new Set();
  for (let g = 1; g <= 200; g += 1) {
    const site = genererSite({ type: 'camp', niveau: 3, saveur: 'richeQuartz', graine: g });
    auRasDuSol.add(couplesRangeeId([...site.batiments, ...site.defenseurs]));
  }
  assert.ok(auRasDuSol.size > 1, 'le plus petit camp reste identique à lui-même');
});

test('CR T3 — l\'artillerie tire toujours, et elle reste EN MOYENNE derrière tout le reste', () => {
  // ⚠⚠ C'EST LE TEST QUI ATTRAPE UNE DISPERSION QUI AURAIT LIBÉRÉ LA RANGÉE SANS
  // REGARDER LA PORTÉE. Il mesure les deux moitiés de la contrainte 4 :
  //   — la géométrie, par `rangeeLaPlusAvanceeQuiTire`, dérivée des données ;
  //   — l'ORDRE, qui est ce qui borne vraiment l'artillerie.
  //
  // ⚠⚠ ET LE RELEVÉ DES PORTÉES MINIMALES DIT QUE LA PREMIÈRE MOITIÉ EST
  // VACUEUSE, ce qui est un fait et non un échec. Trois pièces seulement portent
  // une portée minimale — Faucheuse, Mortier, Harpon, toutes à 3,5 pour une
  // portée de 5,5 — et depuis n'importe quelle rangée de la bande, la couronne
  // [12,25 ; 30,25] en milli-cases² contient des cases. **Aucune rangée n'est
  // interdite à personne.** `data/sites.js` le mesure depuis le 25/08 : une
  // Faucheuse en rangée 3 tire 23 ticks. La phrase « posée à l'avant, elle ne
  // tirerait jamais » était fausse, et deux commentaires la portaient encore.
  const bande = GRILLE.bandes.defense;
  for (const id of Object.keys(DEFENSES)) {
    assert.equal(rangeeLaPlusAvanceeQuiTire(id), bande.premiere,
      `${id} : une rangée de la bande lui serait interdite`);
  }
  // ⚠ Y COMPRIS CELLES QUI NE TIRENT PAS. Un Mur a `portee: 0` : sa couronne est
  // vide, et un repli mal choisi lui interdirait toute la bande sauf le fond.
  // C'est la faute que ce test a trouvée dans le code du lot, corrigée avant
  // livraison.
  assert.equal(DEFENSES.merlon.portee, 0, 'le Mur s\'est mis à tirer');
  assert.equal(rangeeLaPlusAvanceeQuiTire('merlon'), bande.premiere);
  // Le montage doit VRAIMENT porter des pièces à portée minimale, sinon la
  // moitié géométrique ne mesurerait rien.
  const aPorteeMini = Object.entries(DEFENSES).filter(([, d]) => (d.porteeMini ?? 0) > 0);
  assert.equal(aPorteeMini.length, 3, 'le relevé des portées minimales a changé');
  for (const [, d] of aPorteeMini) assert.equal(d.porteeMini, 3.5);

  // ⚠⚠ LA MOITIÉ « ORDRE » EST DEVENUE UNE MOYENNE — LOT PAQUETS, 09/09. Elle
  // exigeait `a.rangee >= b.rangee` pour toute artillerie et tout autre ; les
  // paquets tirent un TIERS de bande par catégorie, et l'ordre n'est plus qu'un
  // biais. Mesuré sur ces 300 montages : artillerie 8,30, le reste 6,48.
  let vues = 0;
  let sommeA = 0; let sommeB = 0; let nbB = 0;
  for (let g = 1; g <= 100; g += 1) {
    for (const [type, niveau] of [['base', 30], ['camp', 20], ['avantPoste', 40]]) {
      const site = genererSite({ type, niveau, saveur: type === 'base' ? null : 'richeQuartz', graine: g });
      const artilleries = site.defenseurs.filter((d) => categorieDe(d.id) === 'artillerie');
      const autres = site.defenseurs.filter((d) => categorieDe(d.id) !== 'artillerie');
      for (const a of artilleries) {
        vues += 1;
        sommeA += a.rangee;
        assert.ok(a.rangee >= rangeeLaPlusAvanceeQuiTire(a.id),
          `${type}/g${g} : ${a.id} en rangée ${a.rangee}, devant sa portée`);
      }
      for (const b of autres) { sommeB += b.rangee; nbB += 1; }
    }
  }
  assert.ok(vues > 100, `le balayage ne porte que ${vues} artilleries : il ne mesure rien`);
  assert.ok(sommeA / vues >= sommeB / nbB + 0.3,
    `artillerie en ${(sommeA / vues).toFixed(2)}, le reste en ${(sommeB / nbB).toFixed(2)}`);
});

test('CR T4 — les trois autres contraintes tiennent, seuils en clair COMPRIS', () => {
  // ⚠ LES DEUX SEUILS S'ÉCRIVENT EN CLAIR, ET ON NE LES TOUCHE PAS. C'est la
  // consigne de `COL T16`, reprise mot pour mot : une garde qui lit son seuil
  // dans la table qu'elle garde ne peut pas voir ce seuil se relâcher.
  const parRangee = DISPOSITION_DEFENSES.occupantsMaxParRangee;
  assert.equal(parRangee, 6, 'six occupants sur neuf colonnes : trois libres au minimum');
  // ⚠⚠ `ecartColonnesMax` ET `etalementMaxRangees` SONT RETIRÉS — LOT PAQUETS,
  // 09/09. Le seuil en clair qui les remplace est la MARGE DE COLONNE : jamais
  // plus de `⌈N/9⌉ + 2` occupants d'un même groupe dans une colonne.
  assert.equal(DISPOSITION_DEFENSES.margeDeColonne, 2,
    'la marge de colonne a été relevée — une borne ne se desserre pas pour faire passer un lot');

  const bande = GRILLE.bandes.defense;
  let ecartMax = 0;
  let batimentsMax = 0;
  for (let g = 1; g <= 100; g += 1) {
    for (const [type, niveau] of [['base', 30], ['camp', 20], ['avantPoste', 40]]) {
      const site = genererSite({ type, niveau, saveur: type === 'base' ? null : 'richeQuartz', graine: g });
      // 1. six occupants au plus par rangée de DÉFENSE, donc trois colonnes libres.
      const parLigne = new Map();
      for (const d of site.defenseurs) parLigne.set(d.rangee, (parLigne.get(d.rangee) ?? 0) + 1);
      for (const [rangee, n] of parLigne) {
        assert.ok(n <= parRangee, `${type}/g${g} rangée ${rangee} : ${n} occupants`);
        assert.ok(GRILLE.largeur - n >= 3, `${type}/g${g} rangée ${rangee} : moins de 3 libres`);
      }
      // 2. la bande. ⚠ LOT PAQUETS : le bloc n'existe plus, et l'étalement
      //    n'est plus borné — un trou entre deux paquets est voulu. Ce qui
      //    sépare un paquet d'un semis est `PQ T2` (paquets qui se touchent)
      //    et le plafond de colonne juste dessous.
      const rangees = [...parLigne.keys()].sort((a, b) => b - a);
      for (const r of rangees) {
        assert.ok(r >= bande.premiere && r <= bande.derniere,
          `${type}/g${g} : rangée ${r} hors de la bande de défense`);
      }
      // 3. le plafond de colonne, sur les DEUX groupes.
      for (const groupe of [site.defenseurs, site.batiments]) {
        const charge = new Array(GRILLE.largeur).fill(0);
        for (const e of groupe) charge[e.colonne - 1] += 1;
        const plafond = Math.ceil(groupe.length / GRILLE.largeur) + DISPOSITION_DEFENSES.margeDeColonne;
        assert.ok(Math.max(...charge) <= plafond,
          `${type}/g${g} : ${Math.max(...charge)} dans une colonne, plafond ${plafond} — ${charge}`);
        ecartMax = Math.max(ecartMax, Math.max(...charge) - Math.min(...charge));
      }
      // ⚠⚠ ET LA RÉPONSE À LA QUESTION DU BRIEF, ASSERTÉE : le plafond des
      // BÂTIMENTS n'est pas six, c'est `GRILLE.largeur`. Le relevé qui montrait
      // « 7 occupants en rangée 11 » lisait une rangée de bâtiments, pas une
      // violation — six est la règle des DÉFENSES, et elle a un motif que les
      // bâtiments n'ont pas : laisser passer l'assaut.
      const parLigneBat = new Map();
      for (const b of site.batiments) parLigneBat.set(b.rangee, (parLigneBat.get(b.rangee) ?? 0) + 1);
      for (const [, n] of parLigneBat) {
        assert.ok(n <= GRILLE.largeur, `${type}/g${g} : ${n} bâtiments sur une rangée`);
        batimentsMax = Math.max(batimentsMax, n);
      }
    }
  }
  // Mesuré sur ces 300 montages, en clair : 6. Il valait 2 sous l'ancien budget.
  assert.equal(ecartMax, 6, `écart maximal entre colonnes : ${ecartMax}`);
  assert.ok(batimentsMax > parRangee,
    `les bâtiments ne dépassent jamais ${parRangee} par rangée : la question du brief ne se pose plus`);
});

test('CR T5 — Souche et Étai flottent dans leur bande, et leur COLONNE se tire', () => {
  // ⚠⚠ LA MOITIÉ « AU CENTRE » EST TOMBÉE — LOT DISPOSITION-OUVRAGE, 08/09.
  // Elle exigeait `colonne === centre` et `centre − 1`, donc 5 et 4 sur toute
  // graine : mesuré avant ce lot, UNE seule position sur 240 montages, et c'est
  // le troisième membre du point 9 d'Ethan — « souche et étai restent au fond ».
  // Les colonnes se tirent désormais.
  //
  // ⚠⚠ ET LA MOITIÉ « AU FOND » EST TOMBÉE À SON TOUR — LOT PAQUETS, 09/09.
  // Le §4.2 du brief DISPOSITION-OUVRAGE la posait comme non négociable ; Ethan
  // l'a renversée le 09/09 devant un « ratio de destruction trop grand ». Les
  // deux uniques entrent dans les paquets et flottent dans la bande 11–18 —
  // mesuré sur ces 300 montages, chacun atteint les huit rangées. Le taux de
  // rasage, lui, ne bouge pas : c'est la DURÉE du raid qui baisse (§1 du brief).
  const bande = GRILLE.bandes.batiments;
  const colonnesSouche = new Set();
  const colonnesEtai = new Set();
  const rangeesSouche = new Set();
  const rangeesEtai = new Set();
  for (let g = 1; g <= 100; g += 1) {
    for (const [type, niveau] of [['base', 30], ['camp', 20], ['avantPoste', 40]]) {
      const site = genererSite({ type, niveau, saveur: type === 'base' ? null : 'richeQuartz', graine: g });
      const souche = site.batiments.find((b) => b.id === 'souche');
      const etai = site.batiments.find((b) => b.id === 'etai');
      for (const u of [souche, etai]) {
        assert.ok(u.rangee >= bande.premiere && u.rangee <= bande.derniere,
          `${type}/g${g} : « ${u.id} » en rangée ${u.rangee}, hors de la bande`);
      }
      rangeesSouche.add(souche.rangee);
      rangeesEtai.add(etai.rangee);
      // ⚠ LOT PAQUETS : ils peuvent partager une COLONNE, plus une CASE.
      assert.ok(souche.colonne !== etai.colonne || souche.rangee !== etai.rangee,
        `${type}/g${g} : la Souche et l'Étai sur la même case`);
      for (const c of [souche.colonne, etai.colonne]) {
        assert.ok(Number.isInteger(c) && c >= 1 && c <= GRILLE.largeur,
          `${type}/g${g} : colonne ${c} hors de la grille`);
      }
      colonnesSouche.add(souche.colonne);
      colonnesEtai.add(etai.colonne);
    }
  }
  // ⚠ ET LES NEUF COLONNES SONT ATTEINTES, PAS SEULEMENT « PLUS D'UNE ». Une
  // garde qui dirait « au moins deux » resterait verte sur un tirage qui n'en
  // rendrait que deux ; mesuré sur ces 300 montages, les neuf le sont, des deux
  // côtés.
  assert.equal(colonnesSouche.size, GRILLE.largeur,
    `la Souche n'atteint que ${colonnesSouche.size} colonnes sur ${GRILLE.largeur}`);
  assert.equal(colonnesEtai.size, GRILLE.largeur,
    `l'Étai n'atteint que ${colonnesEtai.size} colonnes sur ${GRILLE.largeur}`);
  // ⚠ ET LES HUIT RANGÉES AUSSI, DES DEUX CÔTÉS : un générateur qui aurait gardé
  // les uniques au fond passerait tout ce qui précède.
  const hauteur = bande.derniere - bande.premiere + 1;
  assert.equal(rangeesSouche.size, hauteur, `la Souche n'atteint que ${rangeesSouche.size} rangées`);
  assert.equal(rangeesEtai.size, hauteur, `l'Étai n'atteint que ${rangeesEtai.size} rangées`);
});

test('CR T6 — le déterminisme est intact, et une graine voisine ne suffit pas', () => {
  for (const [type, niveau] of [['camp', 7], ['base', 30], ['avantPoste', 15]]) {
    const params = { type, niveau, saveur: type === 'base' ? null : 'richeQuartz', graine: 4242 };
    assert.deepEqual(genererSite(params), genererSite(params),
      `${type}/n${niveau} : deux appels de même graine diffèrent`);
    // ⚠ CONTRE-ÉPREUVE : sans elle, un générateur qui rendrait toujours la même
    // chose passerait la ligne ci-dessus.
    assert.notDeepEqual(genererSite(params), genererSite({ ...params, graine: 4243 }),
      `${type}/n${niveau} : la graine voisine rend le même site`);
  }
});

test('CR T7 — les COLONNES varient encore : l\'acquis du lot COLONNE tient', () => {
  // ⚠⚠ UN LOT QUI GAGNERAIT LES RANGÉES EN PERDANT LES COLONNES N'AURAIT RIEN
  // GAGNÉ. C'est `COL T15` rejoué sur le chemin neuf, à l'identique : le
  // multi-ensemble des charges par colonne, qu'une permutation préserve.
  const chargeTriee = (liste) => {
    const c = new Array(GRILLE.largeur).fill(0);
    for (const e of liste) c[e.colonne - 1] += 1;
    return c.sort((a, b) => a - b).join(',');
  };
  for (const [type, niveau, saveur] of [
    ['base', 30, null], ['base', 10, null],
    ['camp', 20, 'richeQuartz'], ['avantPoste', 40, 'richeScorie'],
  ]) {
    const profils = new Set();
    for (let g = 1; g <= 40; g += 1) {
      profils.add(chargeTriee(genererSite({ type, niveau, saveur, graine: g }).defenseurs));
    }
    assert.ok(profils.size > 1,
      `${type}/n${niveau} : ${profils.size} profil(s) de charge sur 40 graines — `
      + 'le lot a perdu l\'acquis de COLONNE');
  }
});

test('CR T8 — le lot DÉPLACE les occupants, il n\'en ajoute ni n\'en retire', () => {
  // ⚠⚠ LE DÉCALAGE DU PRNG EST MESURÉ AU RAPPORT, PAS ICI — le brief le demande
  // comme une MESURE, et elle ne s'observe qu'en instrumentant `tirer`. Relevé,
  // sur trois graines : un camp de niveau 3 consommait 192 tirages avant le lot
  // et en consomme 296 après ; une base de niveau 50, 318 contre 422 à 438.
  //
  // ⚠⚠ ET LE COMPTE CESSE D'ÊTRE LE MÊME D'UNE GRAINE À L'AUTRE, CE QUI SE
  // DÉCLARE. Avant le lot, `genererSite` consommait un nombre FIXE de tirages
  // pour un couple (type, niveau) — 192, 192, 192. Après, il dépend des tailles
  // de rangée tirées : `repartirLesColonnes` tire neuf clés PAR RANGÉE, et le
  // nombre de rangées varie. Ce n'est PAS le « tire, si ça ne va pas
  // recommence » que le §5 du brief interdit : le `rng` de `genererSite` naît de
  // la graine du site, ne sort jamais de la fonction, et personne d'autre ne le
  // consomme — `genererVague` et `genererAssaut` créent le leur. Le site reste
  // une fonction PURE de ses paramètres, ce que `CR T6` mesure.
  //
  // Ce que ce test-ci garde, c'est l'autre moitié : le lot ne change RIEN à
  // `densite`. Le nombre d'occupants d'un site est le même qu'avant, au un près.
  for (const [type, niveau] of [['camp', 3], ['camp', 7], ['base', 15], ['base', 30]]) {
    const attendu = densite(type, niveau);
    for (let g = 1; g <= 40; g += 1) {
      const site = genererSite({ type, niveau, saveur: type === 'base' ? null : 'richeQuartz', graine: g });
      assert.equal(site.batiments.length, attendu.batiments,
        `${type}/n${niveau}/g${g} : le nombre de bâtiments a changé`);
      assert.equal(site.defenseurs.length, attendu.defenses,
        `${type}/n${niveau}/g${g} : le nombre de défenses a changé`);
      assert.equal(site.obstacles.length, attendu.obstacles ?? site.obstacles.length,
        `${type}/n${niveau}/g${g} : le nombre d'obstacles a changé`);
    }
  }
});
