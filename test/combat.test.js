// Tests T1 à T15 du brief du lot 2A — moteur de combat déterministe.
//
// Tous les seuils sont CALCULÉS, pas devinés : le calcul est donné en
// commentaire au-dessus de l'assertion. Un test dont le seuil n'est pas
// justifié est un test raté.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  creerCombat,
  tick,
  resoudre,
  butin,
  butinPlein,
  pointsRecherche,
  construireResultat,
  serialiserEtat,
  CAUSES,
  TICKS_MAX_COMBAT,
  TICKS_PAR_VAGUE,
} from '../src/sim/combat.js';
import { caseDepuisMilli } from '../src/sim/grille.js';
import { BUTIN } from '../src/data/sites.js';

// ---------------------------------------------------------------------------
// T2 — aucun aléa, pour TOUTE la durée du fichier
// ---------------------------------------------------------------------------
//
// Math.random et Date.now lèvent à partir d'ici : si une seule ligne du moteur
// y touche, n'importe lequel des tests ci-dessous casse. Le contrôle statique
// des sources (T2, plus bas) couvre en plus le chargement des modules, que des
// bouchons installés après les imports ne peuvent pas surveiller.

const vraiRandom = Math.random;
const vraiNow = Date.now;
Math.random = () => {
  throw new Error('Math.random est interdit dans src/sim/combat.js et src/sim/grille.js');
};
Date.now = () => {
  throw new Error('Date.now est interdit dans src/sim/combat.js et src/sim/grille.js');
};
process.on('exit', () => {
  Math.random = vraiRandom;
  Date.now = vraiNow;
});

// ---------------------------------------------------------------------------
// Outils
// ---------------------------------------------------------------------------

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Joue jusqu'au tick voulu (ou jusqu'à la fin du combat). */
function jouer(etat, jusquAuTick) {
  while (etat.tick < jusquAuTick && !etat.termine) tick(etat);
  return etat;
}

/** Première entité correspondant au prédicat, dans l'ordre d'insertion. */
function entite(etat, predicat) {
  const trouvee = etat.entites.find(predicat);
  assert.ok(trouvee !== undefined, 'entité introuvable dans le montage');
  return trouvee;
}

const parId = (id) => (e) => e.id === id;
const parCase = (id, rangee, colonne) => (e) =>
  e.id === id && caseDepuisMilli(e.rangeeMilli) === rangee && e.colonne === colonne;

/** Attaquants encore présents sur la grille (ni morts, ni sortis par le haut). */
function attaquantsPresents(etat) {
  return etat.entites.filter((e) => e.camp === 'attaque' && e.vivant && !e.sorti).length;
}

/** Un bâtiment hors de portée de tout, pour que le combat ne s'arrête pas faute de cible. */
const GANGUE_LOINTAINE = { id: 'gangue', rangee: 18, colonne: 1 };

/**
 * Montage riche : 4 vagues, obstacles, murs, barrières, tourelles, artilleries,
 * unités défensives, aviation traversante et stoppeuse. Sert à T1 et T2.
 */
function montageRiche() {
  return {
    niveau: 12,
    saveur: 'richeQuartz',
    obstacles: [
      { rangee: 4, colonne: 2, type: 'infanterie' },
      { rangee: 5, colonne: 6, type: 'vehicule' },
      { rangee: 7, colonne: 4, type: 'les_deux' },
    ],
    batiments: [
      { id: 'souche', rangee: 14, colonne: 5 },
      { id: 'etai', rangee: 12, colonne: 3 },
      { id: 'noeud', rangee: 13, colonne: 7 },
      { id: 'gangue', rangee: 11, colonne: 2 },
      { id: 'terril', rangee: 16, colonne: 8 },
    ],
    defenseurs: [
      { id: 'merlon', rangee: 6, colonne: 3 },
      { id: 'merlon', rangee: 6, colonne: 4 },
      { id: 'ronce', rangee: 5, colonne: 1 },
      { id: 'herse', rangee: 5, colonne: 2 },
      { id: 'casemate', rangee: 7, colonne: 5 },
      { id: 'creneau', rangee: 7, colonne: 7 },
      { id: 'batterie', rangee: 8, colonne: 6 },
      { id: 'faucheuse', rangee: 9, colonne: 4 },
      { id: 'mortier', rangee: 9, colonne: 8 },
      { id: 'harpon', rangee: 10, colonne: 2 },
      { id: 'meute', rangee: 4, colonne: 7 },
      { id: 'carapace', rangee: 4, colonne: 8 },
      { id: 'fendeur', rangee: 3, colonne: 6 },
    ],
    vagues: [
      [{ id: 'meute', colonne: 1 }, { id: 'perceurs', colonne: 2 }, { id: 'fendeur', colonne: 3 }],
      [{ id: 'crecelle', colonne: 4 }, { id: 'busard', colonne: 5 }],
      [{ id: 'frappeur', colonne: 6 }, { id: 'pilon', colonne: 7 }],
      [{ id: 'broyeur', colonne: 8 }, { id: 'enclume', colonne: 9 }],
    ],
    modulesDebloques: { ouvrage: ['pvPlusVingt', 'munitionSpeciale'], joueur: [] },
  };
}

// ---------------------------------------------------------------------------
// T1 — déterminisme
// ---------------------------------------------------------------------------

test('T1 — deux exécutions du même montage donnent la même trace, tick à tick', () => {
  const trace = (montage) => {
    const etat = creerCombat(montage);
    const lignes = [serialiserEtat(etat)];
    while (!etat.termine) {
      tick(etat);
      lignes.push(serialiserEtat(etat));
    }
    return lignes;
  };

  const a = trace(montageRiche());
  const b = trace(montageRiche());

  // Le montage doit vraiment tourner : une trace de deux lignes ne prouverait rien.
  assert.ok(a.length > 100, `trace trop courte (${a.length} ticks) pour valoir preuve`);
  assert.equal(a.length, b.length, 'les deux exécutions ne durent pas le même nombre de ticks');
  for (let i = 0; i < a.length; i++) {
    assert.equal(a[i], b[i], `divergence au tick ${i}`);
  }
});

// ---------------------------------------------------------------------------
// T2 — aucun aléa
// ---------------------------------------------------------------------------

/** Retire commentaires de ligne et de bloc, pour ne scanner que du code. */
function sansCommentaires(texte) {
  return texte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

test('T2 — aucun aléa : un montage riche se résout sans jamais toucher au hasard', () => {
  // Les bouchons installés en tête de fichier lèvent : la résolution complète
  // d'un montage à 4 vagues, obstacles, structures et artilleries doit passer.
  const montage = montageRiche();
  const etat = creerCombat(montage);
  const resultat = resoudre(etat);
  assert.ok(CAUSES.includes(resultat.cause), `cause inattendue : ${resultat.cause}`);
  assert.ok(resultat.tick > 0);

  // Et les bouchons sont bien armés : ce n'est pas une absence de vérification.
  assert.throws(() => Math.random(), /Math\.random est interdit/);
  assert.throws(() => Date.now(), /Date\.now est interdit/);

  // Contrôle statique : ni hasard, ni horloge murale, ni racine carrée dans le
  // chemin chaud. Les commentaires, qui nomment ces interdits, sont retirés.
  for (const chemin of ['src/sim/combat.js', 'src/sim/grille.js']) {
    const code = sansCommentaires(readFileSync(join(RACINE, chemin), 'utf8'));
    for (const interdit of ['Math.random', 'Date.now', 'Math.sqrt']) {
      assert.ok(!code.includes(interdit), `${chemin} contient ${interdit}`);
    }
  }
});

/** Tout nombre non entier rencontré dans une valeur sérialisée. */
function flottantsDe(valeur, chemin = 'etat', trouves = []) {
  if (typeof valeur === 'number') {
    if (!Number.isInteger(valeur)) trouves.push(`${chemin} = ${valeur}`);
  } else if (Array.isArray(valeur)) {
    valeur.forEach((v, i) => flottantsDe(v, `${chemin}[${i}]`, trouves));
  } else if (valeur !== null && typeof valeur === 'object') {
    for (const [cle, v] of Object.entries(valeur)) flottantsDe(v, `${chemin}.${cle}`, trouves);
  }
  return trouves;
}

test('§13 — aucun flottant ne subsiste dans un état sérialisé', () => {
  const etat = creerCombat(montageRiche());
  // Parcours de l'état, pas contrôle à l'œil : à la création, à mi-parcours et
  // à la fin du combat.
  for (const jusqua of [0, 137, TICKS_MAX_COMBAT]) {
    jouer(etat, jusqua);
    const trouves = flottantsDe(JSON.parse(serialiserEtat(etat)));
    assert.deepEqual(trouves, [], `flottants au tick ${etat.tick} : ${trouves.join(', ')}`);
  }
});

// ---------------------------------------------------------------------------
// T3 — ciblage : le plus proche, puis le plus à gauche
// ---------------------------------------------------------------------------

test('T3 — à distance égale, la cible retenue est la plus à gauche', () => {
  const montage = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [
      { id: 'merlon', rangee: 4, colonne: 4 },
      { id: 'merlon', rangee: 4, colonne: 6 },
    ],
    vagues: [[{ id: 'meute', rangee: 3, colonne: 5 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const etat = creerCombat(montage);
  const meute = entite(etat, (e) => e.camp === 'attaque');
  const gauche = entite(etat, parCase('merlon', 4, 4));
  const droite = entite(etat, parCase('merlon', 4, 6));

  jouer(etat, 1);

  // (3,5) → (4,4) : 1000² + 1000² = 2 000 000. (3,5) → (4,6) : identique.
  // Portée du Meute : 1,5 → 1500² = 2 250 000 ≥ 2 000 000, les deux sont à
  // portée. L'ordre total tranche sur la colonne : 4 avant 6.
  assert.equal(meute.cibleIndice, gauche.indice, 'la cible doit être la colonne 4');
  // Dégâts du Meute contre une structure, à pleine vie : santé = floor(100000 ×
  // 1000/100000) = 1000 ‰, puis floor(8 × 300 × 1000/1000) = 2400 milli-PV.
  assert.equal(gauche.pvMilli, 500_000 - 2400);
  assert.equal(droite.pvMilli, 500_000, 'le Merlon de droite ne doit pas être touché');
});

// ---------------------------------------------------------------------------
// T4 — portée et portée minimale
// ---------------------------------------------------------------------------

test('T4 — la Faucheuse ne tire ni trop près ni trop loin', () => {
  // Faucheuse en (8,5) : portée 5,5 → 5500² = 30 250 000 ; portée mini 3,5 →
  // 3500² = 12 250 000. Dégâts contre infanterie, à pleine vie : santé 1000 ‰,
  // puis floor(20 × 1000 × 1000/1000) = 20 000 milli-PV.
  const montageAvec = (rangee) => ({
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'faucheuse', rangee: 8, colonne: 5 }],
    vagues: [[{ id: 'meute', rangee, colonne: 5 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  });

  const cas = [
    // (5,5) → (8,5) : 3000² = 9 000 000 < 12 250 000, sous la portée mini.
    { rangee: 5, distanceCarree: 9_000_000, tire: false },
    // (4,5) → (8,5) : 4000² = 16 000 000, dans la fenêtre [12,25 M ; 30,25 M].
    { rangee: 4, distanceCarree: 16_000_000, tire: true },
    // (2,5) → (8,5) : 6000² = 36 000 000 > 30 250 000, au-delà de la portée.
    { rangee: 2, distanceCarree: 36_000_000, tire: false },
  ];

  for (const { rangee, distanceCarree: d2, tire } of cas) {
    const etat = creerCombat(montageAvec(rangee));
    const meute = entite(etat, (e) => e.camp === 'attaque');
    const dr = (8 - rangee) * 1000;
    assert.equal(dr * dr, d2, `distance² attendue pour la rangée ${rangee}`);
    jouer(etat, 1);
    const attendu = tire ? 100_000 - 20_000 : 100_000;
    assert.equal(
      meute.pvMilli, attendu,
      `rangée ${rangee} : distance² ${d2}, la Faucheuse ${tire ? 'doit' : 'ne doit pas'} tirer`,
    );
  }
});

// ---------------------------------------------------------------------------
// T5 — la défense ne consomme pas le plancher, et n'arrête pas le tir
// ---------------------------------------------------------------------------

/** Montage de T5, T6 : un Meute face à un Merlon en zone de défense. */
function montageMeuteContreMerlon(surchargeMeute = {}) {
  return {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'merlon', rangee: 3, colonne: 5 }],
    vagues: [[{ id: 'meute', colonne: 5, ...surchargeMeute }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
}

test('T5 — sur une entité de la défense, la réserve s\'arrête au plancher et le tir continue', () => {
  const etat = creerCombat(montageMeuteContreMerlon());
  const meute = entite(etat, (e) => e.camp === 'attaque');
  const merlon = entite(etat, parId('merlon'));

  // Le Meute apparaît en (2,5), le Merlon est en (3,5) : distance² = 1 000 000
  // ≤ portée² 2 250 000, il tire dès le tick 1.
  // Dégâts par tir : santé du Meute = floor(100000 × 1000/100000) = 1000 ‰,
  // puis floor(8 × 300 × 1000/1000) = 2400 milli-PV. Constants, puisque le
  // Merlon ne tire pas (degats 0) et que le Meute n'est donc jamais blessé.
  // Plancher de réserve = floor(150 × 0,10) = 15, atteint après 135 tirs.
  jouer(etat, 135);
  assert.equal(etat.tick, 135);
  assert.equal(meute.reserve, 15, 'réserve au plancher au tick 135');
  assert.equal(merlon.pvMilli, 500_000 - 135 * 2400);

  // Le tir CONTINUE au-delà du plancher, sans plus rien consommer :
  // ceil(500 000 / 2400) = 209, car 208 × 2400 = 499 200 < 500 000 et
  // 209 × 2400 = 501 600 ≥ 500 000. Le mur tombe donc au tick 209,
  // dont 209 − 135 = 74 tirs gratuits.
  jouer(etat, 208);
  assert.equal(merlon.pvMilli, 500_000 - 208 * 2400, 'le mur tient encore au tick 208');
  assert.ok(merlon.vivant);

  jouer(etat, 209);
  assert.equal(meute.reserve, 15, 'réserve toujours au plancher au tick 209');
  assert.equal(merlon.pvMilli, 0, 'le Merlon tombe au tick 209');
  assert.equal(merlon.vivant, false, 'et il est retiré de la grille');

  // Le Meute était bloqué devant le mur depuis le tick 20 : parti de 2000 à
  // 50 milli-cases par tick, il atteint 2950 au tick 19 et refuse 3000 tant que
  // le mur l'occupe. La case libérée, il avance — au tick 209 même, l'ordre
  // normatif du §6 plaçant le RETRAIT DES MORTS (6) avant le DÉPLACEMENT (7).
  // Le §12 du brief annonce le tick 210 ; c'est le seul point où ses deux
  // sections divergent, et §6 est déclaré normatif.
  assert.equal(meute.rangeeMilli, 3000, 'la case libérée, le Meute avance dès le tick 209');
  jouer(etat, 210);
  assert.equal(meute.rangeeMilli, 3050);
});

test('T5 bis — sur un bâtiment, le plancher est levé et l\'unité se vide', () => {
  // Même Meute, monté à reserve 15 — soit exactement son plancher — et passé la
  // ligne, face à une Gangue (150 PV) adjacente.
  const montage = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [{ id: 'gangue', rangee: 11, colonne: 5 }],
    defenseurs: [],
    vagues: [[{ id: 'meute', rangee: 10, colonne: 5, reserve: 15 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const etat = creerCombat(montage);
  const meute = entite(etat, (e) => e.camp === 'attaque');
  const gangue = entite(etat, parId('gangue'));

  const resultat = resoudre(etat, { maxTicks: 25 });

  // Toujours 2400 milli-PV par tir. 15 × 2400 = 36 000 milli-PV, soit 24 % de
  // 150 000. Gangue finale = 150 000 − 36 000 = 114 000.
  assert.equal(gangue.pvMilli, 114_000);
  assert.equal(meute.reserve, 0, 'la réserve descend jusqu\'à 0 sur un bâtiment');
  // Et à 0, plus un seul tir : les dix ticks suivants n'ont rien changé.
  assert.equal(resultat.tick, 25);
  assert.equal(resultat.cause, 'duree');

  // Butin plein niveau 1, indice 3 = 300 × 3 = 900 quartz.
  // 900 × 36 000 / 150 000 = 216 quartz, la Gangue étant quartz pur.
  assert.deepEqual(butin(resultat, montage), { quartz: 216, scorie: 0 });
});

// ---------------------------------------------------------------------------
// T6 — dégâts proportionnels aux PV restants
// ---------------------------------------------------------------------------

test('T6 — un Meute à demi-vie inflige exactement la moitié des dégâts', () => {
  const etat = creerCombat(montageMeuteContreMerlon({ pvMilli: 50_000 }));
  const merlon = entite(etat, parId('merlon'));
  jouer(etat, 10);
  // Santé du Meute = floor(50000 × 1000/100000) = 500 ‰, donc dégâts par tir
  // = floor(8 × 300 × 500/1000) = 1200 milli-PV, la moitié exacte des 2400 de
  // T5. Après 10 ticks : 500 000 − 10 × 1200 = 488 000.
  assert.equal(merlon.pvMilli, 488_000);
});

// ---------------------------------------------------------------------------
// T7 — écrasement
// ---------------------------------------------------------------------------

test('T7 a — masse supérieure : la bloquante meurt, la mobile ne s\'arrête pas', () => {
  const montage = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'meute', rangee: 3, colonne: 5 }],
    vagues: [[{ id: 'fendeur', colonne: 5 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const etat = creerCombat(montage);
  const fendeur = entite(etat, (e) => e.camp === 'attaque');
  const meute = entite(etat, (e) => e.camp === 'defense' && e.id === 'meute');

  // Fendeur : masse 10, vitesse 1,0 → 100 milli-cases par tick, parti de 2000.
  // Le Meute défensif (masse 1) occupe la case 3. 2000 + 9 × 100 = 2900 : la
  // case de destination n'est atteinte qu'au tick 10.
  jouer(etat, 9);
  assert.equal(fendeur.rangeeMilli, 2900);
  assert.equal(meute.vivant, true, 'le Meute tient encore au tick 9');

  jouer(etat, 10);
  assert.equal(meute.vivant, false, 'écrasé au tick de la rencontre');
  assert.equal(meute.ecrase, true);
  assert.equal(meute.pvMilli, 0);
  // Et la mobile continue sans s'arrêter : elle avance bien de 100 milli-cases.
  assert.equal(fendeur.rangeeMilli, 3000);
});

test('T7 b — masse égale : blocage mutuel, aucune n\'avance', () => {
  // Deux Fendeurs opposés, masse 10 = 10.
  const montage = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'fendeur', rangee: 3, colonne: 5 }],
    vagues: [[{ id: 'fendeur', colonne: 5 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const etat = creerCombat(montage);
  const attaquant = entite(etat, (e) => e.camp === 'attaque');
  const defenseur = entite(etat, (e) => e.camp === 'defense' && e.id === 'fendeur');
  jouer(etat, 20);
  // Aucun n'avance : position identique 20 ticks plus tard.
  assert.equal(attaquant.rangeeMilli, 2000);
  assert.equal(defenseur.rangeeMilli, 3000);
  // Ils sont bien encore en vie — le blocage n'est pas un artefact d'une mort.
  // Chacun inflige 12 × floor(pv × 1000 / 300 000) = 12 × floor(pv/300) par
  // tick, soit 12 000 à pleine vie : après 20 ticks, pv ≈ 300 000 × 0,96^20
  // ≈ 132 000, très au-dessus de 0.
  assert.ok(attaquant.vivant && defenseur.vivant);
  assert.ok(attaquant.pvMilli > 100_000 && attaquant.pvMilli < 200_000);

  // Le Fendeur s'arrête aussi pour prédilection (matrice véhicule = 1,0). Pour
  // isoler le SEUL blocage par masse égale, on rejoue avec un couple qui n'est
  // pas de prédilection l'un pour l'autre : Ratisseur (masse 5, matrice véhicule
  // 0,3) contre Bélier défensif (masse 5, châssis blindé).
  const montageMarche = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'belier', rangee: 3, colonne: 5 }],
    vagues: [[{ id: 'ratisseur', colonne: 5 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const marche = creerCombat(montageMarche);
  const ratisseur = entite(marche, (e) => e.camp === 'attaque');
  // Ratisseur : vitesse 1,2 → 120 milli/tick. 2000 + 8 × 120 = 2960 ; au tick 9
  // la destination 3080 tombe dans la case 3, occupée par une masse égale.
  jouer(marche, 8);
  assert.equal(ratisseur.rangeeMilli, 2960);
  jouer(marche, 25);
  assert.equal(ratisseur.rangeeMilli, 2960, 'bloqué, il n\'a pas bougé d\'un milli-case');
  assert.ok(ratisseur.vivant);
});

// ---------------------------------------------------------------------------
// T8 — obstacle
// ---------------------------------------------------------------------------

test('T8 — l\'obstacle divise la vitesse par 2,5 ; l\'aviation l\'ignore', () => {
  const montageSol = {
    niveau: 1,
    saveur: null,
    obstacles: [{ rangee: 2, colonne: 5, type: 'infanterie' }],
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [],
    vagues: [[{ id: 'meute', rangee: 1, colonne: 5 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const etat = creerCombat(montageSol);
  const meute = entite(etat, (e) => e.camp === 'attaque');

  // Meute : vitesse 0,5 → 50 milli/tick. Rangée 1, sans obstacle :
  // 10 ticks → 1000 + 10 × 50 = 1500, soit +500.
  jouer(etat, 10);
  assert.equal(meute.rangeeMilli, 1500);

  // Ticks 11 à 20 : 1500 → 1950 puis l'entrée en case 2 au tick 20 (1950 + 50).
  jouer(etat, 20);
  assert.equal(meute.rangeeMilli, 2000, 'entré dans la case porteuse d\'obstacle');

  // Ticks 21 à 30, sur l'obstacle « infanterie » : 50 / 2,5 = 20 par tick,
  // donc 2000 + 10 × 20 = 2200, soit +200 au lieu de +500.
  jouer(etat, 30);
  assert.equal(meute.rangeeMilli, 2200);

  const montageAir = {
    niveau: 1,
    saveur: null,
    // « les_deux » : l'obstacle le plus large possible, l'aviation l'ignore
    // quand même.
    obstacles: [{ rangee: 2, colonne: 5, type: 'les_deux' }],
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [],
    vagues: [[{ id: 'crecelle', rangee: 1, colonne: 5 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const air = creerCombat(montageAir);
  const crecelle = entite(air, (e) => e.camp === 'attaque');
  // Crécelle : vitesse 1,5 → 150 milli/tick. 10 ticks → 1000 + 1500 = 2500,
  // en traversant la case porteuse d'obstacle sans ralentir.
  jouer(air, 10);
  assert.equal(crecelle.rangeeMilli, 2500);
  assert.equal(caseDepuisMilli(crecelle.rangeeMilli), 2, 'bien passée sur la case d\'obstacle');
});

// ---------------------------------------------------------------------------
// T9 — vagues
// ---------------------------------------------------------------------------

test('T9 — les quatre vagues apparaissent aux ticks 0, 50, 100 et 150', () => {
  assert.equal(TICKS_PAR_VAGUE, 50);
  const montage = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [{ id: 'gangue', rangee: 18, colonne: 9 }],
    defenseurs: [],
    // Une unité par vague, même colonne : au tick 50, l'unité de la vague 1 est
    // à 2000 + 50 × 50 = 4500, soit la case 4 — la case 2 est libre.
    vagues: [
      [{ id: 'meute', colonne: 1 }],
      [{ id: 'meute', colonne: 1 }],
      [{ id: 'meute', colonne: 1 }],
      [{ id: 'meute', colonne: 1 }],
    ],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const etat = creerCombat(montage);

  const attendu = [[0, 1], [49, 1], [50, 2], [99, 2], [100, 3], [149, 3], [150, 4]];
  for (const [t, groupes] of attendu) {
    jouer(etat, t);
    assert.equal(etat.tick, t);
    assert.equal(attaquantsPresents(etat), groupes, `au tick ${t}`);
  }
});

// ---------------------------------------------------------------------------
// T10 — aucun plancher de PV en combat
// ---------------------------------------------------------------------------

test('T10 — une Casemate descend jusqu\'à 0, pas jusqu\'à 1 %', () => {
  const montage = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [GANGUE_LOINTAINE],
    // Casemate montée à 35 000 milli-PV, soit 10 % de ses 350 000.
    defenseurs: [{ id: 'casemate', rangee: 3, colonne: 5, pvMilli: 35_000 }],
    vagues: [[{ id: 'fouisseurs', colonne: 5 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const etat = creerCombat(montage);
  const casemate = entite(etat, parId('casemate'));
  const fouisseurs = entite(etat, (e) => e.camp === 'attaque');

  jouer(etat, 1);
  // À 10 % de PV, sa santé vaut floor(35000 × 1000/350000) = 100 ‰, et son tir
  // contre une cible de matrice 1,0 vaut floor(15 × 1000 × 100/1000) = 1500
  // milli-PV, le dixième exact de ses 15 000 nominaux. Les Fouisseurs passent
  // donc de 150 000 à 148 500.
  assert.equal(fouisseurs.pvMilli, 150_000 - 1500);
  // Les Fouisseurs, à pleine vie, rendent floor(20 × 1000 × 1000/1000) = 20 000 :
  // la Casemate tombe de 35 000 à 15 000.
  assert.equal(casemate.pvMilli, 15_000);

  jouer(etat, 2);
  // Tick 2 : la Casemate, à 15 000, a une santé de floor(15000 × 1000/350000)
  // = 42 ‰ et rend floor(15 × 1000 × 42/1000) = 630 ; les Fouisseurs, à
  // 148 500, ont 990 ‰ et rendent floor(20 × 1000 × 990/1000) = 19 800, soit
  // plus que les 15 000 restants. Aucun plancher : elle tombe à 0.
  assert.equal(casemate.pvMilli, 0, 'aucun plancher de 1 % pendant le combat');
  assert.equal(casemate.vivant, false);
  assert.equal(fouisseurs.pvMilli, 148_500 - 630);

  // Et elle cesse de tirer : trente ticks plus tard, les Fouisseurs n'ont pas
  // perdu un milli-PV de plus.
  jouer(etat, 32);
  assert.equal(fouisseurs.pvMilli, 148_500 - 630);
  // Retirée de la grille : la case 3 est libre, les Fouisseurs (50 milli/tick,
  // repartis de 2000 au tick 3) l'occupent avant le tick 32.
  assert.equal(caseDepuisMilli(fouisseurs.rangeeMilli), 3);
});

// ---------------------------------------------------------------------------
// T11 — fin sur destruction de la Souche
// ---------------------------------------------------------------------------

/** Montage de T11 : un Pilon adjacent à la Souche, une Gangue à côté. */
function montageSouche() {
  return {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [
      { id: 'souche', rangee: 11, colonne: 5 },
      { id: 'gangue', rangee: 11, colonne: 7 },
    ],
    defenseurs: [],
    vagues: [[{ id: 'pilon', rangee: 10, colonne: 5 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
}

test('T11 — la Souche tombée, le combat s\'arrête et le site livre tout', () => {
  const montage = montageSouche();
  const etat = creerCombat(montage);
  const resultat = resoudre(etat);

  // Pilon en (10,5), Souche en (11,5) : distance² = 1 000 000 ≤ portée² 6 250 000.
  // La Gangue en (11,7) est à 1 000 000 + 4 000 000 = 5 000 000, également à
  // portée mais plus loin : la Souche est la cible.
  // Matrice du Pilon contre une structure = 1,0, donc cible de prédilection :
  // il s'arrête et tire. À pleine vie, santé 1000 ‰ et dégâts
  // floor(15 × 1000 × 1000/1000) = 15 000 milli-PV par tick.
  // ceil(400 000 / 15 000) = 27, car 26 × 15 000 = 390 000
  // < 400 000 et 27 × 15 000 = 405 000 ≥ 400 000.
  assert.equal(resultat.tick, 27);
  assert.equal(resultat.cause, 'souche');

  const gangue = resultat.batiments.find(parId('gangue'));
  assert.equal(gangue.detruit, false, 'la Gangue est encore debout');
  assert.equal(gangue.pvPerdusMilli, 0);

  // Butin intégral : sa destruction rase le site et livre tout, quel que soit
  // l'état des autres bâtiments. Niveau 1 : Souche 300 × 1 = 300, Gangue
  // 300 × 3 = 900, toutes deux quartz pur → 1200 quartz, 0 scorie.
  assert.deepEqual(butin(resultat, montage), { quartz: 1200, scorie: 0 });
  // Aucune défense sur le site : aucun point de recherche. Les bâtiments,
  // Souche comprise, ne rapportent rien.
  assert.equal(pointsRecherche(resultat, montage), 0);
});

// ---------------------------------------------------------------------------
// T12 — butin proportionnel
// ---------------------------------------------------------------------------

test('T12 — un bâtiment à moitié détruit paie la moitié', () => {
  const montage = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [{ id: 'gangue', rangee: 11, colonne: 5 }],
    defenseurs: [],
    vagues: [[{ id: 'pilon', rangee: 10, colonne: 5 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const etat = creerCombat(montage);
  const resultat = resoudre(etat, { maxTicks: 5 });

  // Pilon : 15 000 milli-PV par tick contre une structure. 5 ticks → 75 000
  // milli-PV perdus sur 150 000, soit 50 % exactement.
  const gangue = resultat.batiments.find(parId('gangue'));
  assert.equal(gangue.pvPerdusMilli, 75_000);
  assert.equal(gangue.pvMilli, 75_000);
  assert.equal(resultat.cause, 'duree');

  // Butin plein niveau 1, indice 3 = 300 × 3 = 900 quartz → 900 × 0,5 = 450.
  assert.deepEqual(butin(resultat, montage), { quartz: 450, scorie: 0 });
});

// ---------------------------------------------------------------------------
// T13 — points de recherche
// ---------------------------------------------------------------------------

test('T13 — un Merlon de niveau 3 détruit à 50 % rapporte 4 000 milli-points', () => {
  const montage = {
    niveau: 3,
    saveur: null,
    obstacles: [],
    // Merlon monté à 250 000 sur 500 000 : exactement 50 % de dégâts subis.
    defenseurs: [{ id: 'merlon', rangee: 3, colonne: 5, pvMilli: 250_000 }],
    batiments: [{ id: 'gangue', rangee: 18, colonne: 9 }],
    // Un attaquant en (2,1) : distance² au Merlon = 1 000 000 + 16 000 000
    // = 17 000 000, hors de sa portée² de 2 250 000. Rien ne bouge en un tick.
    vagues: [[{ id: 'meute', colonne: 1 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const etat = creerCombat(montage);
  const resultat = resoudre(etat, { maxTicks: 1 });

  const merlon = resultat.defenses.find(parId('merlon'));
  assert.equal(merlon.pvPerdusMilli, 250_000);

  // 2 × 1000 × 2^(3−1) × 0,5 = 2 × 1000 × 4 × 0,5 = 4 000 milli-points.
  assert.equal(pointsRecherche(resultat, montage), 4000);

  // Avec le module de la cible débloqué (Merlon côté Ouvrage : pvPlusVingt),
  // × 1,2 → 4 800.
  const avecModule = { ...montage, modulesDebloques: { ouvrage: ['pvPlusVingt'], joueur: [] } };
  const etatModule = creerCombat(avecModule);
  const resultatModule = resoudre(etatModule, { maxTicks: 1 });
  assert.equal(pointsRecherche(resultatModule, avecModule), 4800);

  // Un bâtiment détruit rapporte 0 : la Gangue n'entre pas dans le compte.
  assert.equal(resultat.batiments.length, 1);
  assert.equal(resultat.defenses.length, 1);
});

// ---------------------------------------------------------------------------
// T14 — durée maximale
// ---------------------------------------------------------------------------

test('T14 — un montage sans issue s\'arrête au tick 900, cause « duree »', () => {
  const montage = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    // Le seul bâtiment est en colonne 9 ; l'attaquant monte la colonne 1 et
    // s'arrête au fond. Distance² finale = 8000² = 64 000 000, très au-delà de
    // sa portée² de 2 250 000 : il n'atteindra jamais rien.
    batiments: [{ id: 'gangue', rangee: 18, colonne: 9 }],
    defenseurs: [],
    vagues: [[{ id: 'meute', colonne: 1 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const etat = creerCombat(montage);
  const resultat = resoudre(etat);
  assert.equal(resultat.tick, 900);
  assert.equal(resultat.tick, TICKS_MAX_COMBAT, '90 s à 10 Hz');
  assert.equal(resultat.cause, 'duree');
  // Personne n'est mort, rien n'a été livré.
  assert.equal(resultat.batiments[0].pvPerdusMilli, 0);
  assert.deepEqual(butin(resultat, montage), { quartz: 0, scorie: 0 });
});

// ---------------------------------------------------------------------------
// T15 — validation du montage
// ---------------------------------------------------------------------------

test('T15 — chacun des cas de refus lève, en nommant l\'entité fautive', () => {
  const valide = {
    niveau: 1,
    saveur: null,
    obstacles: [{ rangee: 4, colonne: 4, type: 'infanterie' }],
    batiments: [{ id: 'gangue', rangee: 12, colonne: 4 }],
    defenseurs: [{ id: 'merlon', rangee: 3, colonne: 5 }],
    vagues: [[{ id: 'meute', colonne: 5 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  // Le montage de référence, lui, passe.
  assert.doesNotThrow(() => creerCombat(valide));

  const cas = [
    {
      quoi: 'identifiant inconnu',
      montage: { ...valide, defenseurs: [{ id: 'chimere', rangee: 3, colonne: 5 }] },
      motif: /chimere.*identifiant inconnu/,
    },
    {
      quoi: 'identifiant sans rôle en défense',
      montage: { ...valide, defenseurs: [{ id: 'pilon', rangee: 3, colonne: 5 }] },
      motif: /pilon.*rôle en défense/,
    },
    {
      quoi: 'case hors grille',
      montage: { ...valide, defenseurs: [{ id: 'merlon', rangee: 3, colonne: 10 }] },
      motif: /merlon.*hors de la grille/,
    },
    {
      quoi: 'deux entités sur la même case',
      montage: {
        ...valide,
        defenseurs: [
          { id: 'merlon', rangee: 3, colonne: 5 },
          { id: 'casemate', rangee: 3, colonne: 5 },
        ],
      },
      motif: /casemate.*même case que « merlon »/,
    },
    {
      quoi: 'bâtiment hors de la bande 11–18',
      montage: { ...valide, batiments: [{ id: 'gangue', rangee: 9, colonne: 4 }] },
      motif: /gangue.*bande des bâtiments \(11–18\)/,
    },
    {
      quoi: 'défenseur hors de 3–10',
      montage: { ...valide, defenseurs: [{ id: 'merlon', rangee: 12, colonne: 4 }] },
      motif: /merlon.*bande de défense \(3–10\)/,
    },
    {
      quoi: 'entité posée sur un obstacle',
      montage: { ...valide, defenseurs: [{ id: 'merlon', rangee: 4, colonne: 4 }] },
      motif: /merlon.*posée sur un obstacle/,
    },
    {
      quoi: 'attaquant posé sur un obstacle',
      montage: { ...valide, vagues: [[{ id: 'meute', rangee: 4, colonne: 4 }]] },
      motif: /meute.*posée sur un obstacle/,
    },
    {
      quoi: 'plus de 4 vagues',
      montage: {
        ...valide,
        vagues: [
          [{ id: 'meute', colonne: 1 }], [{ id: 'meute', colonne: 2 }],
          [{ id: 'meute', colonne: 3 }], [{ id: 'meute', colonne: 4 }],
          [{ id: 'meute', colonne: 5 }],
        ],
      },
      motif: /5 vagues déclarées, 4 au plus/,
    },
    {
      quoi: 'niveau hors bornes',
      montage: { ...valide, niveau: 51 },
      motif: /niveau 51 hors de 1…50/,
    },
    {
      quoi: 'saveur inconnue',
      montage: { ...valide, saveur: 'richeRien' },
      motif: /saveur inconnue/,
    },
  ];

  for (const { quoi, montage, motif } of cas) {
    assert.throws(() => creerCombat(montage), motif, `le cas « ${quoi} » doit lever`);
  }
});

// ---------------------------------------------------------------------------
// Contrôles de cohérence de l'API
// ---------------------------------------------------------------------------

test('§11 — l\'état porte dès 2A les champs que le lot 2C remplira', () => {
  const etat = creerCombat(montageRiche());
  for (const e of etat.entites) {
    assert.deepEqual(e.modulesActifs, [], `${e.id} : modulesActifs doit exister et rester vide`);
    assert.deepEqual(e.effetsTemporises, [], `${e.id} : effetsTemporises doit exister et rester vide`);
  }
  jouer(etat, 200);
  for (const e of etat.entites) {
    assert.deepEqual(e.modulesActifs, [], 'les modules restent inertes en 2A');
    assert.deepEqual(e.effetsTemporises, [], 'les effets temporisés restent inertes en 2A');
  }
});

test('§10 — la saveur incline le partage du butin sans en changer le total', () => {
  // Souche (indice 1) + Gangue (indice 3), niveau 1, toutes deux quartz pur :
  // butin intégral = 300 + 900 = 1200. Une saveur richeScorie (0,25 / 0,75)
  // reventile ce même total : 300 quartz et 900 scorie.
  const montage = { ...montageSouche(), saveur: 'richeScorie' };
  const resultat = resoudre(creerCombat(montage));
  assert.equal(resultat.cause, 'souche');
  assert.deepEqual(butin(resultat, montage), { quartz: 300, scorie: 900 });
});

test('§9 — un raid ne s\'arrête pas tant qu\'il reste une vague à venir', () => {
  // Vague 1 : un Meute face à une Casemate qui l'abat. Vague 2 : un second
  // Meute, au tick 50. La grille est vide d'attaquants entre-temps, mais
  // l'assaut n'est pas terminé pour autant.
  const montage = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'casemate', rangee: 3, colonne: 5 }],
    vagues: [[{ id: 'meute', colonne: 5 }], [{ id: 'meute', colonne: 5 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const etat = creerCombat(montage);
  // Casemate à pleine vie : santé 1000 ‰, floor(15 × 1000 × 1000/1000)
  // = 15 000 milli-PV par tick
  // contre une infanterie (matrice 1,0). Le Meute, 100 000 milli-PV, tombe au
  // tick 7 : 7 × 15 000 = 105 000 ≥ 100 000, alors que 6 × 15 000 = 90 000.
  jouer(etat, 7);
  assert.equal(attaquantsPresents(etat), 0);
  assert.equal(etat.termine, false, 'la vague 2 est encore à venir');
  jouer(etat, 50);
  assert.equal(attaquantsPresents(etat), 1, 'la vague 2 est bien arrivée');
  const resultat = resoudre(etat);
  assert.equal(resultat.cause, 'attaquants');
});

test('§11 — construireResultat rend le même objet que resoudre', () => {
  const etat = creerCombat(montageSouche());
  const resultat = resoudre(etat);
  assert.deepEqual(construireResultat(etat), resultat);
});

// ---------------------------------------------------------------------------
// Contrôles ajoutés en relecture hostile (§13)
//
// Quatre règles du brief n'ont pas de test au §12 : le franchissement des
// barrières, les deux comportements aériens, le cas discriminant du plancher
// de réserve, et les deux pentes du butin. Sans elles, autant de chemins du
// moteur ne seraient asseyés par rien.
// ---------------------------------------------------------------------------

test('§7 — une barrière ne bloque pas, elle saigne', () => {
  const montage = (id) => ({
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'ronce', rangee: 3, colonne: 5 }],
    vagues: [[{ id, colonne: 5 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  });
  const etat = creerCombat(montage('meute'));
  const meute = entite(etat, (e) => e.camp === 'attaque');
  const ronce = entite(etat, parId('ronce'));

  // La Ronce ne bloque pas (bloque: false) : le Meute, 50 milli/tick depuis
  // 2000, entre dans sa case au tick 20 (2000 + 20 × 50 = 3000) au lieu d'être
  // arrêté comme il l'aurait été par un mur.
  jouer(etat, 20);
  assert.equal(meute.rangeeMilli, 3000);
  // Rien encore : les dégâts d'un tick se calculent sur les positions de DÉBUT
  // de tick, et au début du tick 20 le Meute était encore à 2950, en case 2.
  assert.equal(meute.pvMilli, 100_000);
  // Pendant ces 20 ticks, le Meute a tiré sur la Ronce à pleine vie : santé
  // 1000 ‰, floor(8 × 300 × 1000/1000) = 2400 par tick, la Ronce étant une
  // barrière donc lue en colonne « structure ». 200 000 − 20 × 2400 = 152 000.
  assert.equal(ronce.pvMilli, 152_000);

  // Premier tick de présence : la Ronce est à floor(152000 × 1000/200000)
  // = 760 ‰, et son franchissement vaut floor(20 × 1000 × 760/1000) = 15 200
  // milli-PV — pondéré par sa matrice contre l'infanterie (1,0) et
  // proportionnel aux PV qui lui restent.
  jouer(etat, 21);
  assert.equal(meute.pvMilli, 100_000 - 15_200);
  assert.equal(ronce.pvMilli, 152_000 - 2400);

  // Et il traverse : cinq ticks plus tard il a bien avancé de 5 × 50, sans
  // jamais s'arrêter — 3000 + 250 = 3250.
  jouer(etat, 25);
  assert.equal(meute.rangeeMilli, 3250);

  // Au-delà, les deux décroissances s'imbriquent. Le Meute rend
  // floor(2400 × floor(M/100) / 1000) à la Ronce ; la Ronce lui rend
  // 20 × floor(R/200). Partant de M = 84 800 et R = 149 600 au tick 22, la
  // suite des PV du Meute est 69 840 · 55 100 · 40 520 · 26 080 · 11 740, et au
  // tick 27 le franchissement vaut 20 × floor(142 972/200) = 20 × 714 = 14 280,
  // au-dessus des 11 740 restants : le Meute meurt au tick 27.
  jouer(etat, 26);
  assert.equal(meute.pvMilli, 11_740);
  jouer(etat, 27);
  assert.equal(meute.pvMilli, 0);
  assert.equal(meute.vivant, false);
  // Une barrière ne se détruit pas en la franchissant : elle n'a encaissé que
  // les tirs, et elle est toujours debout.
  assert.equal(ronce.pvMilli, 142_692);
  assert.equal(ronce.vivant, true);

  // L'aviation, elle, ne paie rien : la matrice de la Ronce vaut 0 en colonne
  // « aviation ». Crécelle à 150 milli/tick, 2000 + 20 × 150 = 5000, PV intacts.
  const air = creerCombat(montage('crecelle'));
  const crecelle = entite(air, (e) => e.camp === 'attaque');
  jouer(air, 20);
  assert.equal(crecelle.rangeeMilli, 5000);
  assert.equal(crecelle.pvMilli, 200_000, 'l\'aviation ne franchit rien, elle survole');
});

test('§7 — l\'aviation traversante sort par le haut, la stoppeuse s\'arrête au fond', () => {
  const montageAerien = (id) => ({
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [{ id: 'gangue', rangee: 18, colonne: 9 }],
    defenseurs: [],
    vagues: [[{ id, colonne: 1 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  });

  // Frappeur : traversant, vitesse 3 → 300 milli/tick. Parti de 2000, il vise
  // au-delà de la rangée 18 quand 2000 + 300k ≥ 19000, soit k ≥ 56,67 → k = 57.
  const traversant = creerCombat(montageAerien('frappeur'));
  const frappeur = entite(traversant, (e) => e.camp === 'attaque');
  jouer(traversant, 56);
  assert.equal(frappeur.rangeeMilli, 18_800);
  assert.equal(frappeur.sorti, false);
  const resultat = resoudre(traversant);
  assert.equal(frappeur.sorti, true, 'sorti du combat, il n\'y revient pas');
  assert.equal(frappeur.vivant, true, 'sorti n\'est pas mort');
  // Plus aucun attaquant sur la grille, morts OU sortis par le haut.
  assert.equal(resultat.tick, 57);
  assert.equal(resultat.cause, 'attaquants');

  // Busard : stoppeur, vitesse 1,5 → 150 milli/tick. Il se comporte comme un
  // véhicule volant et refuse de franchir le fond : 2000 + 150 × 113 = 18 950,
  // et le pas suivant viserait la case 19.
  const stoppeur = creerCombat(montageAerien('busard'));
  const busard = entite(stoppeur, (e) => e.camp === 'attaque');
  jouer(stoppeur, 113);
  assert.equal(busard.rangeeMilli, 18_950);
  jouer(stoppeur, 200);
  assert.equal(busard.rangeeMilli, 18_950, 'la stoppeuse ne sort pas');
  assert.equal(busard.sorti, false);
});

test('§8 — passée la ligne, une unité qui tire sur la défense garde son plancher', () => {
  // C'est le cas où la formulation du brief (« le type de la cible tranche »)
  // et celle du compte rendu (« le plancher se lève au passage de ligne »)
  // divergent : un tireur déjà dans la bande des bâtiments, qui tire EN
  // ARRIÈRE sur un mur. Le plancher doit tenir.
  const montage = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'merlon', rangee: 10, colonne: 5 }],
    // Réserve montée à 16, soit un tir au-dessus du plancher de 15.
    vagues: [[{ id: 'meute', rangee: 11, colonne: 5, reserve: 16 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const etat = creerCombat(montage);
  const meute = entite(etat, (e) => e.camp === 'attaque');
  const merlon = entite(etat, parId('merlon'));

  jouer(etat, 1);
  assert.equal(meute.reserve, 15, 'le premier tir descend au plancher');

  // Le Meute s'éloigne du mur à 50 milli/tick ; au début du tick 10 il est à
  // 11 450, distance 1450 → 2 102 500 ≤ portée² 2 250 000 : il tire encore.
  // Dix tirs de 2400 → 500 000 − 24 000 = 476 000.
  jouer(etat, 10);
  assert.equal(meute.reserve, 15, 'la défense ne prend pas les 10 % réservés aux bâtiments');
  assert.equal(merlon.pvMilli, 476_000, 'et le tir n\'a jamais cessé');
});

test('§10 — le butin plein suit ses deux pentes et son indice', () => {
  // butinPlein(1, 1) = 300 × 1 × 1,259^0 × 1,32^0 = 300, l'ancrage.
  assert.equal(butinPlein(1, 1), BUTIN.ancrageNiveau1);
  // Le rapport d'un niveau au suivant vaut penteBasse jusqu'à la bascule, puis
  // penteHaute au-delà : c'est toute la définition de la courbe.
  const rapport = (n) => butinPlein(n + 1, 1) / butinPlein(n, 1);
  for (let n = 1; n < BUTIN.niveauBascule; n++) {
    assert.ok(
      Math.abs(rapport(n) - BUTIN.penteBasse) < 1e-12,
      `pente basse rompue entre ${n} et ${n + 1} : ${rapport(n)}`,
    );
  }
  for (let n = BUTIN.niveauBascule; n < 20; n++) {
    assert.ok(
      Math.abs(rapport(n) - BUTIN.penteHaute) < 1e-12,
      `pente haute rompue entre ${n} et ${n + 1} : ${rapport(n)}`,
    );
  }
  // Et l'indice de butin est un simple facteur.
  const ecart = Math.abs(butinPlein(7, 3) - 3 * butinPlein(7, 1)) / butinPlein(7, 3);
  assert.ok(ecart < 1e-12, 'le butin doit être proportionnel à l\'indice');
});
