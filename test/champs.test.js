// Le générateur de champs — déterminisme, forme, comptes.
//
// CE QUE CE FICHIER DOIT PROUVER, et qui ne va pas de soi : que le terrain
// d'une base est une FONCTION de sa position, que les douze cases sont bien
// douze, qu'aucun bloc ne dépasse trois cases À L'ŒIL — pas seulement dans
// l'intention du tirage — et qu'aucune ne tombe sur le pourtour.
//
// ⚠ LA DIFFÉRENCE ENTRE COMPTER ET RECOMPTER. Vérifier les tailles de bloc en
// relisant ce que le tirage croit avoir posé ne prouverait rien : le tirage
// serait juge de sa propre partie. Les blocs sont donc RECONSTRUITS depuis les
// seules cases, par composantes connexes (`blocsDuTerrain`), et c'est cette
// lecture indépendante qui est assertée. Si le placement laissait deux blocs de
// deux se toucher, la reconstruction verrait un bloc de quatre et les tests
// tomberaient — c'est exactement ce qu'on veut.
//
// Les seuils sont MESURÉS sur les positions de la carte réelle, pas devinés.
// Voir RAPPORT-lotCHAMPS-generateur.md. ⚠ Elles étaient 9 000 (30 × 300) jusqu'au
// 29/08 ; la carte fait 31 colonnes depuis, donc 9 300 — les tests lisent
// `GEOGRAPHIE.carte`, ils n'ont pas eu à changer.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  champsDeLaBase, graineDePosition, decouperEnBlocs,
  blocsDuTerrain, categorieDuBloc, ressourceDeLaCase, obstaclesDeLaBase,
} from '../src/sim/champs.js';
import {
  CHAMPS, zoneDesChamps, estDansLaBase, TERRAIN_INITIAL, OBSTACLES_DE_BASE,
} from '../src/data/base.js';
import { GEOGRAPHIE } from '../src/data/sites.js';
import { GRILLE, OBSTACLES } from '../src/data/combat.js';
import { positionDepartJoueur } from '../src/sim/carte.js';
import { creerRng } from '../src/sim/rng.js';

const ZONE = zoneDesChamps();

/** Un échantillon de positions réparti sur toute la carte, pas un coin. */
function positions(pas = 17) {
  const p = [];
  for (let r = 1; r <= GEOGRAPHIE.carte.hauteur; r += pas) {
    for (let c = 1; c <= GEOGRAPHIE.carte.largeur; c += 3) p.push([r, c]);
  }
  return p;
}

// ---------------------------------------------------------------------------
// Déterminisme
// ---------------------------------------------------------------------------

test('champs — une position rend toujours le même terrain', () => {
  // « Une base posée à un endroit aura toujours les mêmes choses. » C'est
  // l'arbitrage du 26/08, et c'est la propriété dont tout le reste dépend.
  for (const [r, c] of positions(29)) {
    const a = champsDeLaBase(r, c);
    const b = champsDeLaBase(r, c);
    assert.equal(JSON.stringify(a), JSON.stringify(b), `(${r},${c}) diverge d'un appel à l'autre`);
  }

  // Montage falsifiable : si le générateur rendait un terrain constant, le test
  // ci-dessus passerait aussi. On exige donc que des positions différentes
  // donnent des terrains différents.
  const vus = new Set();
  const echantillon = positions(11);
  for (const [r, c] of echantillon) {
    vus.add(JSON.stringify(champsDeLaBase(r, c).cases));
  }
  // MESURÉ : sur 280 positions échantillonnées, 280 terrains distincts. On
  // asserte 95 % pour laisser respirer d'éventuelles collisions légitimes, tout
  // en tombant net si le générateur devenait constant ou quasi constant.
  assert.ok(
    vus.size >= echantillon.length * 0.95,
    `${vus.size} terrains distincts sur ${echantillon.length} positions`,
  );
});

test('champs — la graine dépend de l\'ORDRE des coordonnées', () => {
  // Sans mélange, (3,12) et (12,3) tomberaient sur la même graine et deux bases
  // symétriques de la carte porteraient le même terrain. Le défaut serait
  // invisible en jeu et impossible à retrouver après coup.
  assert.notEqual(graineDePosition(3, 12), graineDePosition(12, 3));
  assert.notEqual(graineDePosition(1, 2), graineDePosition(2, 1));
  // Et elle reste une fonction : même entrée, même sortie.
  assert.equal(graineDePosition(7, 19), graineDePosition(7, 19));
  // Entier 32 bits non signé, comme l'état de rng.js.
  for (const [r, c] of positions(41)) {
    const g = graineDePosition(r, c);
    assert.ok(Number.isInteger(g) && g >= 0 && g <= 0xffffffff, `graine ${g} hors uint32`);
  }
  assert.throws(() => graineDePosition(1.5, 2), /non entière/);
  assert.throws(() => graineDePosition(1, NaN), /non entière/);
});

test('champs — le tirage réussit du premier coup, partout sur la carte', () => {
  // MESURÉ sur les 9 000 positions de la carte : maximum 1 tentative, médiane 1,
  // moyenne 1,0000. Le garde-fou `tentativesMax` ne se déclenche jamais aux
  // valeurs actuelles, et l'écrire ici vaut mieux qu'annoncer une marge.
  // Il commence à mordre à 24 cases sur 42 (2 tentatives), 28 (4), 30 (9).
  let max = 0;
  for (const [r, c] of positions(7)) {
    max = Math.max(max, champsDeLaBase(r, c).tentatives);
  }
  assert.equal(max, 1, `${max} tentatives au pire, 1 attendue`);
  assert.ok(CHAMPS.tentativesMax >= 1);
});

// ---------------------------------------------------------------------------
// Comptes
// ---------------------------------------------------------------------------

test('champs — douze cases, et la répartition sort de la table', () => {
  const vues = new Set();
  for (const [r, c] of positions(13)) {
    const t = champsDeLaBase(r, c);
    assert.equal(t.cases.length, CHAMPS.total, `(${r},${c}) : ${t.cases.length} cases`);

    const quartz = t.cases.filter((k) => k.ressource === 'quartz').length;
    const scorie = t.cases.filter((k) => k.ressource === 'scorie').length;
    assert.equal(quartz, t.repartition.quartz, `(${r},${c}) : quartz posé ≠ quartz annoncé`);
    assert.equal(scorie, t.repartition.scorie, `(${r},${c}) : scorie posée ≠ scorie annoncée`);
    assert.equal(quartz + scorie, CHAMPS.total);

    // La répartition doit être l'un des trois objets de la table, pas une
    // valeur forgée qui lui ressemble.
    assert.ok(
      CHAMPS.repartitions.includes(t.repartition),
      `(${r},${c}) : répartition hors table`,
    );
    vues.add(`${t.repartition.quartz}/${t.repartition.scorie}`);

    // Aucune case en double : un doublon ferait 12 entrées pour 11 cases.
    const cles = new Set(t.cases.map((k) => `${k.rangee}:${k.colonne}`));
    assert.equal(cles.size, CHAMPS.total, `(${r},${c}) : cases en double`);
  }
  // Falsifiable : les trois répartitions doivent SORTIR, sinon le tirage
  // n'en choisirait qu'une et le test ci-dessus passerait quand même.
  // MESURÉ sur 9 000 positions : 5/7 → 3 019 · 6/6 → 2 952 · 7/5 → 3 029.
  assert.equal(vues.size, 3, `${vues.size} répartitions vues sur 3`);
});

test('champs — aucune case sur le pourtour de la base', () => {
  // Arbitré le 26/08 : « les champs n'apparaissent jamais sur les bords ».
  for (const [r, c] of positions(9)) {
    for (const k of champsDeLaBase(r, c).cases) {
      assert.ok(
        k.rangee >= ZONE.premiereRangee && k.rangee <= ZONE.derniereRangee
        && k.colonne >= ZONE.premiereColonne && k.colonne <= ZONE.derniereColonne,
        `(${r},${c}) : case (${k.rangee},${k.colonne}) hors de la zone intérieure`,
      );
      // Et donc, a fortiori, dans la base.
      assert.ok(estDansLaBase(k.rangee, k.colonne));
    }
  }
  // Falsifiable : la zone doit être strictement plus petite que la base, sinon
  // « dans la zone » et « dans la base » seraient la même assertion.
  assert.ok(ZONE.premiereRangee > 11 && ZONE.derniereColonne < 9 + 1 - 1 + 1);
  assert.equal(ZONE.nombre, 42);
});

// ---------------------------------------------------------------------------
// Forme — reconstruite depuis les cases, jamais relue du tirage
// ---------------------------------------------------------------------------

test('champs — aucun bloc ne dépasse trois cases, vu de l\'extérieur', () => {
  // ⚠ Les blocs sont RECONSTRUITS par composantes connexes à partir des seules
  // cases. Si deux blocs de deux de même ressource se touchaient, cette lecture
  // verrait un bloc de quatre — c'est tout l'intérêt de ne pas croire le tirage
  // sur parole.
  const tailles = new Set();
  for (const [r, c] of positions(9)) {
    const t = champsDeLaBase(r, c);
    const blocs = blocsDuTerrain(t);

    // La partition est exhaustive et sans recouvrement.
    assert.equal(
      blocs.reduce((n, b) => n + b.cases.length, 0), CHAMPS.total,
      `(${r},${c}) : les blocs ne couvrent pas les 12 cases`,
    );

    for (const b of blocs) {
      assert.ok(
        CHAMPS.taillesBloc.includes(b.cases.length),
        `(${r},${c}) : bloc de ${b.cases.length} cases, admis ${CHAMPS.taillesBloc}`,
      );
      tailles.add(b.cases.length);
    }
  }
  // Falsifiable : les trois tailles doivent apparaître. Un générateur qui ne
  // poserait que des cases isolées satisferait « aucun bloc > 3 » sans rien
  // prouver. MESURÉ sur 9 000 positions : 28 697 blocs de 1, 18 482 de 2,
  // 14 113 de 3.
  assert.deepEqual([...tailles].sort(), [1, 2, 3]);
});

test('champs — les triplets sont droits ou coudés, et les deux sortent', () => {
  const categories = new Set();
  for (const [r, c] of positions(9)) {
    for (const b of blocsDuTerrain(champsDeLaBase(r, c))) {
      if (b.cases.length < 3) continue;
      const cat = categorieDuBloc(b.cases);
      assert.ok(
        CHAMPS.formesTriplet.includes(cat),
        `(${r},${c}) : triplet « ${cat} », admis ${CHAMPS.formesTriplet}`,
      );
      categories.add(cat);

      // Un triplet coudé tient dans un carré 2 × 2 ; un droit dans une bande
      // de 1 × 3. Aucun des deux ne peut s'étaler davantage.
      const dr = Math.max(...b.cases.map((k) => k.rangee)) - Math.min(...b.cases.map((k) => k.rangee));
      const dc = Math.max(...b.cases.map((k) => k.colonne)) - Math.min(...b.cases.map((k) => k.colonne));
      if (cat === 'droit') assert.ok((dr === 2 && dc === 0) || (dr === 0 && dc === 2));
      else assert.ok(dr === 1 && dc === 1, `coude étalé ${dr}×${dc}`);
    }
  }
  // MESURÉ : 4 844 droits, 9 269 coudés — le rapport 2 tombe des quatre
  // orientations du L contre les deux de la barre.
  assert.deepEqual([...categories].sort(), ['coude', 'droit']);
});

test('champs — deux blocs de même ressource ne se touchent jamais par un côté', () => {
  // C'est la règle DÉDUITE, pas dictée (voir CHAMPS.contactLateralEntreBlocsDe-
  // MemeRessource). Sans elle, la lisibilité tombe : deux blocs de deux collés
  // se lisent comme un bloc de quatre. Le test précédent la vérifie par
  // conséquence ; celui-ci la vérifie de face.
  assert.equal(CHAMPS.contactLateralEntreBlocsDeMemeRessource, false);

  let contactsDiagonaux = 0;
  for (const [r, c] of positions(11)) {
    const t = champsDeLaBase(r, c);
    const parCle = new Map(t.cases.map((k) => [`${k.rangee}:${k.colonne}`, k.ressource]));
    const blocs = blocsDuTerrain(t);
    // Un bloc reconstruit par les côtés a exactement la taille de son tirage :
    // c'est la même assertion que plus haut, vue autrement.
    for (const b of blocs) assert.ok(b.cases.length <= 3);

    for (const k of t.cases) {
      // Les diagonales, elles, ont le droit de se toucher : on les COMPTE pour
      // prouver que la règle porte bien sur les côtés seuls et pas sur tout.
      for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
        if (parCle.get(`${k.rangee + dr}:${k.colonne + dc}`) === k.ressource) contactsDiagonaux++;
      }
    }
  }
  // MESURÉ : les contacts diagonaux existent bel et bien. S'il y en avait zéro,
  // c'est que la règle serait plus stricte que voulue et le test serait muet.
  assert.ok(contactsDiagonaux > 0, 'aucun contact diagonal : la règle est trop stricte');
});

// ---------------------------------------------------------------------------
// Les briques, séparément
// ---------------------------------------------------------------------------

test('champs — decouperEnBlocs rend des tailles admises dont la somme est exacte', () => {
  const rng = creerRng(20260826);
  const tailles = new Set();
  for (let essai = 0; essai < 400; essai++) {
    for (const n of [0, 1, 2, 3, 5, 7, 12]) {
      const decoupe = decouperEnBlocs(rng, n);
      assert.equal(decoupe.reduce((a, b) => a + b, 0), n, `somme ≠ ${n}`);
      for (const t of decoupe) {
        assert.ok(CHAMPS.taillesBloc.includes(t), `taille ${t} non admise`);
        tailles.add(t);
      }
      if (n === 0) assert.deepEqual(decoupe, []);
      if (n === 1) assert.deepEqual(decoupe, [1]);
    }
  }
  // Falsifiable : les trois tailles doivent sortir du tirage, sinon la découpe
  // serait dégénérée et la somme resterait juste.
  assert.deepEqual([...tailles].sort(), [1, 2, 3]);
  assert.throws(() => decouperEnBlocs(rng, -1), /invalide/);
  assert.throws(() => decouperEnBlocs(rng, 2.5), /invalide/);
});

test('champs — categorieDuBloc lit la géométrie, et refuse ce qu\'elle ne sait pas lire', () => {
  assert.equal(categorieDuBloc([{ rangee: 1, colonne: 1 }]), 'unique');
  assert.equal(categorieDuBloc([{ rangee: 1, colonne: 1 }, { rangee: 1, colonne: 2 }]), 'unique');
  assert.equal(categorieDuBloc([
    { rangee: 5, colonne: 2 }, { rangee: 5, colonne: 3 }, { rangee: 5, colonne: 4 },
  ]), 'droit');
  assert.equal(categorieDuBloc([
    { rangee: 5, colonne: 2 }, { rangee: 6, colonne: 2 }, { rangee: 7, colonne: 2 },
  ]), 'droit');
  assert.equal(categorieDuBloc([
    { rangee: 5, colonne: 2 }, { rangee: 5, colonne: 3 }, { rangee: 6, colonne: 2 },
  ]), 'coude');
  // Quatre cases n'ont pas de catégorie : la fonction lève plutôt que d'inventer.
  assert.throws(() => categorieDuBloc([
    { rangee: 1, colonne: 1 }, { rangee: 1, colonne: 2 },
    { rangee: 2, colonne: 1 }, { rangee: 2, colonne: 2 },
  ]), /3 au plus/);
});

test('champs — ressourceDeLaCase rend la ressource, ou null sur une case nue', () => {
  const t = champsDeLaBase(42, 15);
  for (const k of t.cases) {
    assert.equal(ressourceDeLaCase(t, k.rangee, k.colonne), k.ressource);
  }
  // Le pourtour est nu par construction : c'est la case la plus sûre à tester.
  assert.equal(ressourceDeLaCase(t, 11, 1), null);
  assert.equal(ressourceDeLaCase(t, 18, 9), null);

  // Falsifiable : il doit rester des cases NUES dans la zone intérieure aussi,
  // sinon `null` ne serait rendu que hors zone. MESURÉ : 12 cases occupées sur
  // 42, donc 30 nues.
  let nues = 0;
  for (let r = ZONE.premiereRangee; r <= ZONE.derniereRangee; r++) {
    for (let c = ZONE.premiereColonne; c <= ZONE.derniereColonne; c++) {
      if (ressourceDeLaCase(t, r, c) === null) nues++;
    }
  }
  assert.equal(nues, ZONE.nombre - CHAMPS.total);
  assert.equal(nues, 30);
});

test('champs — l\'ordre du tirage ne transparaît pas dans le résultat', () => {
  // Les cases sortent triées par rangée puis colonne. Sans ça, deux terrains
  // identiques posés dans un ordre différent seraient déclarés divergents, et
  // le test de déterminisme mesurerait l'ordre plutôt que le contenu.
  for (const [r, c] of positions(23)) {
    const cases = champsDeLaBase(r, c).cases;
    for (let i = 1; i < cases.length; i++) {
      const a = cases[i - 1];
      const b = cases[i];
      assert.ok(
        a.rangee < b.rangee || (a.rangee === b.rangee && a.colonne < b.colonne),
        `(${r},${c}) : cases non triées en position ${i}`,
      );
    }
  }
});

test('champs — le collecteur est le seul à pouvoir s\'y poser, et le champ décide de sa ressource', () => {
  // Les deux arbitrages du 26/08, assertés dans les données pour que le moteur
  // de base les trouve écrits quand il arrivera.
  assert.deepEqual(CHAMPS.posableDessus, ['collecteur']);
  assert.equal(CHAMPS.ressourceDonneeParLeChamp, true);
  // Douze cases → douze collecteurs au plus. C'est le plafond réel du jeu, et
  // il tient à ce module : si le générateur en posait treize, il se déplacerait.
  for (const [r, c] of positions(31)) {
    assert.equal(champsDeLaBase(r, c).cases.length, CHAMPS.total);
  }
});

// ---------------------------------------------------------------------------
// Le terrain de la PREMIÈRE base — une table, pas un tirage
// ---------------------------------------------------------------------------

test('terrain initial — la table obéit aux mêmes règles que le tirage', () => {
  // ⚠ UNE TABLE DISPENSÉE DES RÈGLES SERAIT LA PREMIÈRE À LES CONTREDIRE. Le
  // dessin d'Ethan est transcrit à la main : rien ne garantit a priori qu'il
  // respecte la zone, les tailles de bloc et le non-contact. On le vérifie donc
  // exactement comme un terrain tiré, avec la MÊME lecture indépendante par
  // composantes connexes.
  const { champs, repartition } = TERRAIN_INITIAL;

  assert.equal(champs.length, CHAMPS.total);
  const compte = { quartz: 0, scorie: 0 };
  for (const k of champs) compte[k.ressource] += 1;
  assert.deepEqual(compte, repartition, 'la répartition annoncée ne compte pas les cases');
  assert.ok(
    CHAMPS.repartitions.some((r) => r.quartz === repartition.quartz && r.scorie === repartition.scorie),
    `répartition ${repartition.quartz}/${repartition.scorie} hors des trois admises`,
  );

  // Dans la zone, jamais sur le pourtour.
  for (const k of champs) {
    assert.ok(
      k.rangee >= ZONE.premiereRangee && k.rangee <= ZONE.derniereRangee
        && k.colonne >= ZONE.premiereColonne && k.colonne <= ZONE.derniereColonne,
      `champ en (${k.rangee}, ${k.colonne}) hors de la zone`,
    );
  }

  // Blocs RECONSTRUITS, jamais déclarés.
  const blocs = blocsDuTerrain({ cases: champs });
  for (const bloc of blocs) {
    assert.ok(bloc.cases.length <= 3, `bloc de ${bloc.cases.length} cases`);
    assert.ok(CHAMPS.taillesBloc.includes(bloc.cases.length));
    if (bloc.cases.length === 3) {
      assert.ok(CHAMPS.formesTriplet.includes(categorieDuBloc(bloc.cases)));
    }
  }
  // Falsifiable : sans blocs, la boucle ne mesure rien.
  assert.ok(blocs.length >= 5, `${blocs.length} blocs seulement`);
});

test('terrain initial — la position de départ est servie par la table, les autres par le tirage', () => {
  const depart = positionDepartJoueur();
  const initial = champsDeLaBase(depart.rangee, depart.colonne);

  // `tentatives` à zéro dit « aucun tirage n'a eu lieu ». C'est ce qui distingue
  // une table d'un tirage réussi du premier coup.
  assert.equal(initial.tentatives, 0);
  assert.deepEqual(initial.cases, TERRAIN_INITIAL.champs);
  assert.deepEqual(initial.repartition, TERRAIN_INITIAL.repartition);

  // ⚠ ET C'EST UNE COPIE, pas la table elle-même. Rendre la référence laisserait
  // n'importe quel appelant modifier le terrain de toutes les parties à venir.
  initial.cases[0].ressource = 'scorie';
  assert.notEqual(TERRAIN_INITIAL.champs[0].ressource, 'scorie', 'la table a été mutée');

  // La case d'à côté, elle, est tirée — sinon la dérogation ne serait pas une
  // dérogation mais la règle.
  const voisine = champsDeLaBase(depart.rangee, depart.colonne + 1);
  assert.ok(voisine.tentatives >= 1);
  assert.notDeepEqual(voisine.cases, TERRAIN_INITIAL.champs);
});

// ---------------------------------------------------------------------------
// Obstacles — bande de défense seulement
// ---------------------------------------------------------------------------

/** Les mêmes contrôles pour un jeu d'obstacles, d'où qu'il vienne. */
function verifierObstacles(cases, ou) {
  const bande = GRILLE.bandes.defense;
  assert.equal(cases.length, OBSTACLES.nombre, `${ou} : compte`);

  const vues = new Set();
  const parRangee = new Map();
  for (const o of cases) {
    assert.ok(
      o.rangee >= bande.premiere && o.rangee <= bande.derniere,
      `${ou} : obstacle en rangée ${o.rangee}, hors de la bande de défense`,
    );
    assert.ok(o.colonne >= 1 && o.colonne <= GRILLE.largeur, `${ou} : colonne ${o.colonne}`);
    assert.ok(OBSTACLES.types.includes(o.type), `${ou} : type « ${o.type} »`);
    const cle = `${o.rangee}:${o.colonne}`;
    assert.ok(!vues.has(cle), `${ou} : deux obstacles en ${cle}`);
    vues.add(cle);
    parRangee.set(o.rangee, (parRangee.get(o.rangee) ?? 0) + 1);
  }

  // Deux par rangée au plus : neuf colonnes moins deux en laissent sept, donc
  // les six occupants de `DISPOSITION_DEFENSES` restent atteignables partout.
  for (const [rangee, n] of parRangee) {
    assert.ok(n <= OBSTACLES_DE_BASE.maxParRangee, `${ou} : ${n} obstacles en rangée ${rangee}`);
  }

  // Jamais deux au contact par un côté : collés, ils font un mur, et le mur est
  // une DÉFENSE, avec ses points et ses PV.
  for (const o of cases) {
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      assert.ok(
        !vues.has(`${o.rangee + dr}:${o.colonne + dc}`),
        `${ou} : obstacles collés en (${o.rangee}, ${o.colonne})`,
      );
    }
  }
}

test('obstacles — la table initiale obéit aux règles de pose', () => {
  verifierObstacles(TERRAIN_INITIAL.obstacles, 'TERRAIN_INITIAL');
  // Et elle ne mord sur aucun champ — ce qui est garanti par les bandes, mais
  // le jour où quelqu'un déplacera un obstacle à la main, c'est cette ligne qui
  // le rattrapera.
  const champs = new Set(TERRAIN_INITIAL.champs.map((k) => `${k.rangee}:${k.colonne}`));
  for (const o of TERRAIN_INITIAL.obstacles) {
    assert.ok(!champs.has(`${o.rangee}:${o.colonne}`), `obstacle sur un champ en (${o.rangee}, ${o.colonne})`);
  }
});

test('obstacles — tirés de la position, dans la bande de défense, et stables', () => {
  const depart = positionDepartJoueur();

  // La première base porte la table, comme pour les champs et sous la même clé.
  const initial = obstaclesDeLaBase(depart.rangee, depart.colonne);
  assert.equal(initial.tentatives, 0);
  assert.deepEqual(initial.cases, TERRAIN_INITIAL.obstacles);

  // Ailleurs, un tirage — vérifié sur un échantillon de la carte réelle.
  const { largeur, hauteur } = GEOGRAPHIE.carte;
  let tires = 0;
  let maxTentatives = 0;
  for (let r = 3; r <= hauteur; r += 37) {
    for (let c = 1; c <= largeur; c += 5) {
      if (r === depart.rangee && c === depart.colonne) continue;
      const o = obstaclesDeLaBase(r, c);
      verifierObstacles(o.cases, `(${r}, ${c})`);
      maxTentatives = Math.max(maxTentatives, o.tentatives);
      tires += 1;
    }
  }
  assert.ok(tires > 40, `${tires} positions balayées : l'échantillon ne mesure rien`);
  assert.ok(
    maxTentatives < OBSTACLES_DE_BASE.tentativesMax,
    `${maxTentatives} tentatives au pire, le plafond est ${OBSTACLES_DE_BASE.tentativesMax}`,
  );

  // Fonction de la position, et de rien d'autre.
  assert.deepEqual(obstaclesDeLaBase(100, 7), obstaclesDeLaBase(100, 7));
  assert.notDeepEqual(obstaclesDeLaBase(100, 7), obstaclesDeLaBase(100, 8));

  // ⚠ ET LES OBSTACLES NE SUIVENT PAS LE FLUX DES CHAMPS. Si les deux tirages
  // partageaient leur graine, changer le nombre de champs déplacerait tous les
  // obstacles. Deux positions dont les champs sont identiques n'existent pas, on
  // vérifie donc l'indépendance autrement : les obstacles d'une position ne se
  // déduisent pas de ses champs, ils tombent dans une bande où aucun champ ne va.
  const champs = champsDeLaBase(100, 7).cases.map((k) => `${k.rangee}:${k.colonne}`);
  for (const o of obstaclesDeLaBase(100, 7).cases) {
    assert.ok(!champs.includes(`${o.rangee}:${o.colonne}`));
  }
});
