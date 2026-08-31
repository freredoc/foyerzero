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
  facteurMilli,
  TICKS_AVANT_REPLI,
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
  // ⚠ SEUILS DÉPLACÉS AU LOT 4A, roster mesuré. Le Merlon (Wall) passe de 500
  // à 2 000 PV, et le Fusilier de 8 × 0,3 = 2,4 PV contre une structure à ses
  // 7 PV mesurés (1 120 du relevé ÷ 160).
  // Dégâts du Meute contre une structure, à pleine vie : santé = floor(700000 ×
  // 1000/700000) = 1000 ‰, puis floor(7 × 1000) = 7000 milli-PV.
  assert.equal(gauche.pvMilli, 2_000_000 - 7000);
  assert.equal(droite.pvMilli, 2_000_000, 'le Merlon de droite ne doit pas être touché');
});

// ---------------------------------------------------------------------------
// T4 — portée et portée minimale
// ---------------------------------------------------------------------------

test('T4 — la Faucheuse ne tire ni trop près ni trop loin', () => {
  // Faucheuse en (8,5) : portée 5,5 → 5500² = 30 250 000 ; portée mini 3,5 →
  // 3500² = 12 250 000. Les deux portées sont INCHANGÉES par le lot 4A — le
  // relevé donne les mêmes 5,5 et 3,5 pour ses trois artilleries.
  // ⚠ Seuils déplacés : la Faucheuse est le Watchtower, 1 600 contre
  // l'infanterie ÷ 160 = 10 PV par tir, et le Fusilier a 700 PV.
  // À pleine vie : santé 1000 ‰, puis floor(10 × 1000) = 10 000 milli-PV.
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
    const attendu = tire ? 700_000 - 10_000 : 700_000;
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

  // ⚠ SEUILS DÉPLACÉS AU LOT 4A, roster mesuré. Le Merlon (Wall) passe de 500 à
  // 2 000 PV, le Fusilier de 2,4 à 7 PV par tir contre une structure, sa réserve
  // de 150 à 70 et sa vitesse de 50 à 60 milli-cases par tick. La MÉCANIQUE ne
  // bouge pas d'un pouce : le plancher arrête la consommation, pas le tir.
  //
  // Le Meute apparaît en (2,5), le Merlon est en (3,5) : distance² = 1 000 000
  // ≤ portée² 2 250 000, il tire dès le tick 1.
  // Dégâts par tir : santé du Meute = floor(700000 × 1000/700000) = 1000 ‰,
  // puis floor(7 × 1000) = 7000 milli-PV. Constants, puisque le Merlon ne tire
  // pas (degats null) et que le Meute n'est donc jamais blessé.
  // Plancher de réserve = floor(70 × 0,10) = 7, atteint après 70 − 7 = 63 tirs.
  jouer(etat, 63);
  assert.equal(etat.tick, 63);
  assert.equal(meute.reserve, 7, 'réserve au plancher au tick 63');
  assert.equal(merlon.pvMilli, 2_000_000 - 63 * 7000);

  // Le tir CONTINUE au-delà du plancher, sans plus rien consommer :
  // ceil(2 000 000 / 7000) = 286, car 285 × 7000 = 1 995 000 < 2 000 000 et
  // 286 × 7000 = 2 002 000 ≥ 2 000 000. Le mur tombe donc au tick 286,
  // dont 286 − 63 = 223 tirs gratuits — contre 74 avant la conversion.
  jouer(etat, 285);
  assert.equal(merlon.pvMilli, 2_000_000 - 285 * 7000, 'le mur tient encore au tick 285');
  assert.ok(merlon.vivant);

  jouer(etat, 286);
  assert.equal(meute.reserve, 7, 'réserve toujours au plancher au tick 286');
  assert.equal(merlon.pvMilli, 0, 'le Merlon tombe au tick 286');
  assert.equal(merlon.vivant, false, 'et il est retiré de la grille');

  // Le Meute était bloqué devant le mur : parti de 2000 à 60 milli-cases par
  // tick, il atteint 2960 au tick 16 (2000 + 16 × 60) et refuse le pas suivant,
  // qui le porterait à 3020, donc dans la case du mur. La case libérée, il
  // avance — au tick 286 même, l'ordre normatif du §6 plaçant le RETRAIT DES
  // MORTS (6) avant le DÉPLACEMENT (7). Le §12 du brief annonce le tick
  // d'après ; c'est le seul point où ses deux sections divergent, et §6 est
  // déclaré normatif.
  assert.equal(meute.rangeeMilli, 3020, 'la case libérée, le Meute avance dès le tick 286');
  jouer(etat, 287);
  assert.equal(meute.rangeeMilli, 3080);
});

test('T5 bis — sur un bâtiment, le plancher est levé et l\'unité se vide', () => {
  // Même Meute, monté à reserve 7 — soit exactement son plancher, floor(70 ×
  // 0,10) — et passé la ligne, face à une Gangue adjacente.
  // ⚠ Seuil déplacé au lot 4B : la Gangue (Silo) passe de 150 à 1 000 PV.
  const montage = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [{ id: 'gangue', rangee: 11, colonne: 5 }],
    defenseurs: [],
    vagues: [[{ id: 'meute', rangee: 10, colonne: 5, reserve: 7 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const etat = creerCombat(montage);
  const meute = entite(etat, (e) => e.camp === 'attaque');
  const gangue = entite(etat, parId('gangue'));

  const resultat = resoudre(etat, { maxTicks: 25 });

  // 7000 milli-PV par tir (lot 4A) et 7 de réserve. 7 × 7000 = 49 000 milli-PV,
  // soit 4,9 % de 1 000 000 — contre 32,7 % des 150 000 d'avant le lot 4B.
  // Gangue finale = 1 000 000 − 49 000 = 951 000.
  assert.equal(gangue.pvMilli, 951_000);
  assert.equal(meute.reserve, 0, 'la réserve descend jusqu\'à 0 sur un bâtiment');
  // Et à 0, plus un seul tir : les dix ticks suivants n'ont rien changé.
  assert.equal(resultat.tick, 25);
  assert.equal(resultat.cause, 'duree');

  // Butin plein niveau 1, indice 3 = 300 × 3 = 900 quartz. Le butin est
  // proportionnel à la FRACTION détruite, donc le quintuplement des PV le
  // divise d'autant : 900 × 49 000 / 1 000 000 = 44 quartz, contre 294 avant le
  // lot 4B. Le butin PLEIN, lui, n'a pas bougé d'un quartz.
  assert.deepEqual(butin(resultat, montage), { quartz: 44, scorie: 0 });
});

// ---------------------------------------------------------------------------
// T6 — dégâts proportionnels aux PV restants
// ---------------------------------------------------------------------------

test('T6 — un Meute à demi-vie inflige exactement la moitié des dégâts', () => {
  // ⚠ Seuil déplacé au lot 4A : la demi-vie du Fusilier n'est plus 50 000
  // milli-PV mais 350 000, puisqu'il en a 700 000 et non plus 100 000.
  const etat = creerCombat(montageMeuteContreMerlon({ pvMilli: 350_000 }));
  const merlon = entite(etat, parId('merlon'));
  jouer(etat, 10);
  // Santé du Meute = floor(350000 × 1000/700000) = 500 ‰, donc dégâts par tir
  // = floor(7 × 500) = 3500 milli-PV, la moitié exacte des 7000 de T5.
  // Après 10 ticks : 2 000 000 − 10 × 3500 = 1 965 000.
  assert.equal(merlon.pvMilli, 1_965_000);
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

  // ⚠ Seuil déplacé au lot 4A : le Fendeur (Predator) avance à 90 milli-cases
  // par tick et non plus 100. Sa masse, elle, ne vient pas du relevé et n'a pas
  // bougé — l'écrasement au seuil de masse reste l'arbitrage d'Ethan.
  // Le Meute défensif (masse 1) occupe la case 3, qui commence à 3000.
  // 2000 + 11 × 90 = 2990 : encore dans la case 2. Le pas suivant viserait
  // 3080, donc la case 3 — c'est là que la rencontre a lieu, au tick 12.
  jouer(etat, 11);
  assert.equal(fendeur.rangeeMilli, 2990);
  assert.equal(meute.vivant, true, 'le Meute tient encore au tick 11');

  jouer(etat, 12);
  assert.equal(meute.vivant, false, 'écrasé au tick de la rencontre');
  assert.equal(meute.ecrase, true);
  assert.equal(meute.pvMilli, 0);
  // Et la mobile continue sans s'arrêter : elle avance bien de 90 milli-cases.
  assert.equal(fendeur.rangeeMilli, 3080);
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
  // ⚠ Seuil déplacé au lot 4A : le Fendeur passe de 300 à 1 000 PV et de 12 ×
  // 1,0 à 23 PV par tir contre un véhicule. Chacun inflige
  // floor(23 × floor(pv × 1000 / 1 000 000)) = 23 × floor(pv/1000) par tick,
  // soit 23 000 à pleine vie — 2,3 % de la cible, contre 4,0 % avant. Le combat
  // en miroir est donc plus lent, et c'est le sens du T = 16 s : après 20 ticks
  // chacun est à 628 044 milli-PV, là où il tombait à ~132 000 avant.
  // Ils sont bien encore en vie — le blocage n'est pas un artefact d'une mort.
  assert.ok(attaquant.vivant && defenseur.vivant);
  assert.equal(attaquant.pvMilli, 628_044);
  assert.equal(defenseur.pvMilli, 628_044, 'le miroir est exact : mêmes PV des deux côtés');

  // Le Fendeur s'arrête aussi pour prédilection (colonne véhicule dominante).
  // Pour isoler le SEUL blocage par masse égale, on rejoue avec un couple qui
  // n'est pas de prédilection l'un pour l'autre : Ratisseur (masse 5, dominante
  // infanterie) contre Bélier défensif (masse 5, châssis blindé).
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

  // ⚠ Seuils déplacés au lot 4A : le Fusilier avance à 60 milli/tick, et sous
  // obstacle à 60 / 2,5 = 24. Le RAPPORT des deux, lui, est le même — c'est
  // l'invariant que ce test tient, et il ne bouge pas.
  // Rangée 1, sans obstacle : 10 ticks → 1000 + 10 × 60 = 1600, soit +600.
  jouer(etat, 10);
  assert.equal(meute.rangeeMilli, 1600);

  // La case 2 commence à 2000 : 1000 + 60k ≥ 2000 dès k = 17 (2020), le pas de
  // 16 ne portant qu'à 1960.
  jouer(etat, 16);
  assert.equal(meute.rangeeMilli, 1960, 'encore dans la case 1 au tick 16');
  jouer(etat, 17);
  assert.equal(meute.rangeeMilli, 2020, 'entré dans la case porteuse d\'obstacle');

  // Ticks 18 à 32, sur l'obstacle « infanterie » : 24 par tick au lieu de 60,
  // donc 2020 + 15 × 24 = 2380 — +360 là où quinze pas libres auraient fait
  // +900.
  jouer(etat, 32);
  assert.equal(meute.rangeeMilli, 2380);

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
  // ⚠ Seuil déplacé : la Crécelle (Orca) vole à 120 milli/tick et non 150.
  // 10 ticks → 1000 + 1200 = 2200, en traversant la case porteuse d'obstacle
  // sans ralentir — 120 par tick du premier au dixième.
  jouer(air, 10);
  assert.equal(crecelle.rangeeMilli, 2200);
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
    // à 2000 + 50 × 60 = 5000, soit la case 5 — la case 2 est libre.
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
    // ⚠ Seuil déplacé au lot 4A : la Casemate (MG Nest) passe de 350 à
    // 1 000 PV. Montée à 100 000 milli-PV, soit 10 % de ses 1 000 000.
    defenseurs: [{ id: 'casemate', rangee: 3, colonne: 5, pvMilli: 100_000 }],
    vagues: [[{ id: 'fouisseurs', colonne: 5 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const etat = creerCombat(montage);
  const casemate = entite(etat, parId('casemate'));
  const fouisseurs = entite(etat, (e) => e.camp === 'attaque');

  jouer(etat, 1);
  // À 10 % de PV, sa santé vaut floor(100000 × 1000/1000000) = 100 ‰, et son
  // tir contre l'infanterie vaut floor(20 × 100) = 2000 milli-PV, le dixième
  // exact de ses 20 000 nominaux. Les Fouisseurs (900 PV) passent donc de
  // 900 000 à 898 000.
  assert.equal(fouisseurs.pvMilli, 900_000 - 2000);
  // Les Fouisseurs, à pleine vie, rendent floor(50 × 1000) = 50 000 contre une
  // tourelle : la Casemate tombe de 100 000 à 50 000.
  assert.equal(casemate.pvMilli, 50_000);

  jouer(etat, 2);
  // Tick 2 : la Casemate, à 50 000, a 50 ‰ et rend floor(20 × 50) = 1000 ; les
  // Fouisseurs, à 898 000, ont floor(898000 × 1000/900000) = 997 ‰ et rendent
  // floor(50 × 997) = 49 850. Il reste donc 150 milli-PV à la Casemate — un
  // cheveu, mais elle est encore debout. Aucun plancher ne l'a sauvée : c'est
  // l'arithmétique.
  assert.equal(casemate.pvMilli, 150);
  assert.equal(casemate.vivant, true);
  assert.equal(fouisseurs.pvMilli, 898_000 - 1000);

  jouer(etat, 3);
  // Tick 3 : à 150 milli-PV sur 1 000 000, la santé arrondie de la Casemate
  // tombe à 0 ‰ et son tir ne retire plus rien — c'est le point de
  // quantification en millièmes signalé aux lots 3B et 3C, laissé à
  // l'arbitrage. Les Fouisseurs, eux, l'achèvent : elle descend à 0, PAS à 1 %.
  assert.equal(casemate.pvMilli, 0, 'aucun plancher de 1 % pendant le combat');
  assert.equal(casemate.vivant, false);
  assert.equal(fouisseurs.pvMilli, 897_000, 'un tir à 0 ‰ ne retire rien');

  // Et elle cesse de tirer : trente ticks plus tard, les Fouisseurs n'ont pas
  // perdu un milli-PV de plus.
  jouer(etat, 32);
  assert.equal(fouisseurs.pvMilli, 897_000);
  // Retirée de la grille : la case 3 est libre, les Fouisseurs (60 milli/tick,
  // repartis de 2000 au tick 4) l'occupent avant le tick 32.
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
  // La colonne structure du Pilon (Juggernaut) est sa dominante — 8 000 du
  // relevé ÷ 160 = 50 PV — donc cible de prédilection : il s'arrête et tire. À
  // pleine vie, santé 1000 ‰ et dégâts floor(50 × 1000) = 50 000 milli-PV par
  // tick.
  // ⚠ Seuil déplacé au lot 4B : la Souche (Construction Yard) passe de 400 à
  // 5 500 PV. ceil(5 500 000 / 50 000) = 110 ticks, exactement — contre 8.
  // C'est tout le sens du lot : l'objectif redevient le gros du travail.
  assert.equal(resultat.tick, 110);
  assert.equal(resultat.cause, 'souche');

  const gangue = resultat.batiments.find(parId('gangue'));
  assert.equal(gangue.detruit, false, 'la Gangue est encore debout');
  assert.equal(gangue.pvPerdusMilli, 0);

  // Butin intégral : sa destruction rase le site et livre tout, quel que soit
  // l'état des autres bâtiments. Niveau 1 : Souche 300 × 1 = 300, Gangue
  // 300 × 3 = 900, toutes deux quartz pur → 1200 quartz, 0 scorie.
  assert.deepEqual(butin(resultat, montage), { quartz: 1200, scorie: 0 });
  // Aucune défense sur le site : aucun point de recherche. Les bâtiments,
  // Souche comprise, ne rapportent rien. Le type est un BigInt depuis le lot
  // 2B — 0n, pas 0.
  assert.equal(pointsRecherche(resultat, montage), 0n);
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
    // ⚠ MONTAGE CHANGÉ AU LOT 4A. Le Pilon retirait 15 000 milli-PV par tick,
    // et cinq ticks faisaient la moitié pile des 150 000 de la Gangue. Il en
    // retire maintenant 50 000, et 150 000 / 2 = 75 000 n'est pas un multiple
    // de 50 000 : aucun nombre entier de ticks ne donnerait la moitié. Le
    // Bélier (Pitbull, 4 000 ÷ 160 = 25 PV contre une structure) la donne en un
    // nombre entier de ticks. Le test mesure la même chose ; seul le tireur
    // change, pour que le seuil reste rond.
    vagues: [[{ id: 'belier', rangee: 10, colonne: 5 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const etat = creerCombat(montage);
  // ⚠ Seuil déplacé au lot 4B : la Gangue passe de 150 à 1 000 PV, donc la
  // moitié se fait en 20 ticks au lieu de 3.
  const resultat = resoudre(etat, { maxTicks: 20 });

  // Bélier : 25 000 milli-PV par tick contre une structure. 20 ticks → 500 000
  // milli-PV perdus sur 1 000 000, soit 50 % exactement.
  const gangue = resultat.batiments.find(parId('gangue'));
  assert.equal(gangue.pvPerdusMilli, 500_000);
  assert.equal(gangue.pvMilli, 500_000);
  assert.equal(resultat.cause, 'duree');

  // Butin plein niveau 1, indice 3 = 300 × 3 = 900 quartz → 900 × 0,5 = 450.
  // ⚠ Ce seuil-ci ne bouge PAS, et c'est la preuve que le lot 4B n'a pas touché
  // à l'économie : le butin est proportionnel à la FRACTION détruite, jamais aux
  // PV absolus. La moitié d'une Gangue paie 450 quartz, qu'elle en ait 150 ou
  // 1 000.
  assert.deepEqual(butin(resultat, montage), { quartz: 450, scorie: 0 });
});

// ---------------------------------------------------------------------------
// T13 — points de recherche
// ---------------------------------------------------------------------------

/**
 * Abaisse une ligne de résultat de `perdus` milli-PV, comme le moteur l'aurait
 * fait pendant la passe. Les TROIS compteurs bougent ensemble ; n'en bouger que
 * deux ferait tomber le calcul à zéro sans rien dire.
 */
function abimerLigne(ligne, perdus) {
  ligne.pvMilli -= perdus;
  ligne.pvPerdusMilli = ligne.pvMaxMilli - ligne.pvMilli;
  ligne.pvPerdusIciMilli = ligne.pvInitialMilli - ligne.pvMilli;
  ligne.detruit = ligne.pvMilli <= 0;
}

test('T13 — un Merlon de niveau 3 détruit à 50 % rapporte 1 585 milli-points', () => {
  const montage = {
    niveau: 3,
    saveur: null,
    obstacles: [],
    // ⚠ Seuil déplacé DEUX FOIS. Lot 4A : le Merlon (Wall) passe de 500 à
    // 2 000 PV. Lot COURBE : la pente unique de 1,1 remplace les deux régimes,
    // donc facteurMilli(3) = round(1000 × 1,1²) = 1210 au lieu de 1585, et le
    // Merlon vaut 2000 × 1210 = 2 420 000 milli-PV. Monté à 1 210 000, il est à
    // exactement 50 % de dégâts subis.
    // Ce que ce test TIENT n'a pas bougé : le barème de points de recherche ne
    // dépend que du niveau de la cible et de la FRACTION détruite, jamais de
    // ses PV absolus. La moitié d'un Merlon reste la moitié d'un Merlon, que
    // ses PV valent 2 000 000, 3 170 000 ou 2 420 000 milli-PV.
    //
    // ⚠ SEUIL DÉPLACÉ UNE TROISIÈME FOIS, LOT RECHERCHE-AU-PRORATA (29/08). Le
    // Merlon se monte désormais PLEIN, et c'est la ligne de résultat qu'on
    // abaisse à 50 % après coup. Le monter à moitié comme avant décrivait un
    // Merlon DÉJÀ à moitié cassé EN ARRIVANT, et depuis l'arbitrage d'Ethan ce
    // n'est plus la même chose : un raid ne marque que ce qu'il casse LUI, donc
    // un Merlon monté à 50 % et laissé tranquille rapporte zéro — il a été payé
    // à la passe précédente. Ce que le test veut dire, « détruit à 50 % »,
    // s'écrit donc maintenant en abaissant le RÉSULTAT.
    defenseurs: [{ id: 'merlon', rangee: 3, colonne: 5 }],
    batiments: [{ id: 'gangue', rangee: 18, colonne: 9 }],
    // Un attaquant en (2,1) : distance² au Merlon = 1 000 000 + 16 000 000
    // = 17 000 000, hors de sa portée² de 2 250 000. Rien ne bouge en un tick.
    vagues: [[{ id: 'meute', colonne: 1 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const etat = creerCombat(montage);
  const resultat = resoudre(etat, { maxTicks: 1 });

  const merlon = resultat.defenses.find(parId('merlon'));
  assert.equal(facteurMilli(3), 1210);
  assert.equal(merlon.pvMaxMilli, 2000 * 1210);
  // Personne ne l'a touché en un tick : c'est le montage qui pose les dégâts,
  // et il les pose comme le moteur les aurait posés — PV, perte totale, perte
  // de cette passe-ci.
  assert.equal(merlon.pvPerdusMilli, 0, 'le montage a changé sans qu\'on le sache');
  abimerLigne(merlon, 1_210_000);
  assert.equal(merlon.pvPerdusMilli, 1_210_000);
  assert.equal(merlon.pvPerdusIciMilli, 1_210_000);
  assert.equal(merlon.niveau, 3, 'le niveau de l\'entité, plus celui du site');

  // ⚠ LOT RECHERCHE (25/08/2026). Le barème ne double plus par niveau : il suit
  // la courbe ÉCONOMIQUE, celle de BUTIN, comme toute récompense de raid.
  //   avant : 2 × 1000 × 2^(3−1)            × 0,5 = 4 000 milli-points
  //   après : 2 × 1000 × facteurEconomiqueMilli(3)/1000 × 0,5
  //         = 2 × 1000 × 1,585              × 0,5 = 1 585 milli-points
  // Le niveau 3 perd donc 60 % de son rendement — c'est le prix à payer pour
  // que le niveau 50 cesse de déborder l'entier sûr, et le rendement reste
  // strictement croissant en niveau.
  //
  // BigInt reste OBLIGATOIRE malgré tout : le produit intermédiaire du calcul,
  // barème × facteur × bonus × pvPerdusMilli, atteint encore 5,2 × 10²¹ au
  // niveau 50. C'est le T13 de generateur.test.js qui le mesure.
  assert.equal(pointsRecherche(resultat, montage), 1585n);

  // Avec le module de la cible débloqué (Merlon côté Ouvrage : pvPlusVingt),
  // × 1,2 → 1 902.
  const avecModule = { ...montage, modulesDebloques: { ouvrage: ['pvPlusVingt'], joueur: [] } };
  const etatModule = creerCombat(avecModule);
  const resultatModule = resoudre(etatModule, { maxTicks: 1 });
  abimerLigne(resultatModule.defenses.find(parId('merlon')), 1_210_000);
  assert.equal(pointsRecherche(resultatModule, avecModule), 1902n);

  // Un bâtiment détruit rapporte 0 : la Gangue n'entre pas dans le compte.
  assert.equal(resultat.batiments.length, 1);
  assert.equal(resultat.defenses.length, 1);
});

// ---------------------------------------------------------------------------
// T14 — durée maximale
// ---------------------------------------------------------------------------

test('T14 — un adversaire hors d\'échelle fait durer le raid jusqu\'au tick 900', () => {
  // ⚠ TEST MODIFIÉ AU LOT 3B. Il montait auparavant « un attaquant hors de
  // portée de tout, aucun bâtiment atteignable » et attendait la fin par
  // `duree`. Depuis le repli du lot 3B, un tel attaquant rentre à la base au
  // bout de 30 ticks inutiles et la fin devient `attaquants` : c'est la RÈGLE
  // qui a changé, pas le test qui avait tort. Le §7 du lot 3B en fait le cas
  // témoin, et le lot 3B le consigne au rapport.
  //
  // Pour éprouver encore le plafond de 900 ticks, il faut un raid qui a une
  // issue mais ne l'atteint pas : un Meute de niveau 1 devant un Merlon de
  // niveau 50. Il nuit — donc il ne se replie jamais — mais il lui faudrait
  // cent millions de ticks.
  const montage = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    // Le seul bâtiment est en colonne 9, hors de portée : la fin ne peut pas
    // venir de « plus aucun bâtiment debout ».
    batiments: [{ id: 'gangue', rangee: 18, colonne: 9 }],
    // ⚠ Seuil déplacé au lot 4A : le Merlon (Wall) passe de 500 à 2 000 PV.
    // Merlon de niveau 50 : 2000 × facteurMilli(50) = 2000 × 480 941 681
    // = 961 883 362 000 milli-PV. Il ne tire pas (degats null), le Meute reste
    // donc à pleine vie et rend 7000 milli-PV par tick — il lui faudrait
    // 137 millions de ticks, contre 100 millions avant. La conclusion est la
    // même et le plafond de 900 mord toujours.
    defenseurs: [{ id: 'merlon', rangee: 3, colonne: 5, niveau: 50 }],
    vagues: [[{ id: 'meute', colonne: 5 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const etat = creerCombat(montage);
  const meute = entite(etat, (e) => e.camp === 'attaque');
  const merlon = entite(etat, parId('merlon'));
  assert.equal(merlon.pvMaxMilli, 2000 * facteurMilli(50));

  const resultat = resoudre(etat);
  assert.equal(resultat.tick, 900);
  assert.equal(resultat.tick, TICKS_MAX_COMBAT, '90 s à 10 Hz');
  assert.equal(resultat.cause, 'duree');

  // 900 × 7000 = 6 300 000 milli-PV, soit 0,00066 % du mur : il n'a rien entamé.
  assert.equal(merlon.pvMilli, 2000 * facteurMilli(50) - 900 * 7000);
  // Et il ne s'est jamais replié : il nuisait, même dérisoirement.
  assert.equal(meute.ticksInutiles, 0);
  assert.equal(meute.sorti, false);
  assert.equal(meute.vivant, true);
  // Personne n'a rien livré.
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

test('§11 — `modulesActifs` et `effetsTemporises` ne se remplissent QUE sous module câblé', () => {
  // ⚠⚠ RÉÉCRIT AU LOT MODULES-A, ET C'EST UNE BORNE PLUS FORTE, PAS PLUS
  // FAIBLE. Les quatre assertions d'origine exigeaient que ces deux champs
  // restent VIDES pour toute entité, avant et après 200 ticks — « les modules
  // restent inertes en 2A ». Ils ne le sont plus : le Booster est le premier
  // module à les employer. L'intention est gardée en la SÉPARANT en deux —
  // vides tant qu'aucun module câblé n'est en jeu, remplis quand il y en a un.
  // Un test qui n'aurait gardé que la première moitié passerait encore
  // aujourd'hui, et ne prouverait plus rien du second usage.
  const etat = creerCombat(montageRiche());
  for (const e of etat.entites) {
    assert.deepEqual(e.modulesActifs, [], `${e.id} : modulesActifs doit exister et partir vide`);
    assert.deepEqual(e.effetsTemporises, [], `${e.id} : effetsTemporises doit exister et partir vide`);
  }
  // `montageRiche` ne débloque AUCUN module côté joueur — l'Ouvrage y a
  // `pvPlusVingt` et `munitionSpeciale`, tous deux non câblés.
  jouer(etat, 200);
  for (const e of etat.entites) {
    assert.deepEqual(e.modulesActifs, [], `${e.id} : aucun module câblé, rien à marquer`);
    assert.deepEqual(e.effetsTemporises, [], `${e.id} : aucun module câblé, aucun effet`);
  }

  // Et le contre-cas, sans lequel la moitié haute passerait sur un moteur qui
  // n'écrit JAMAIS dans ces deux champs : un Cuirassier à Booster, blessé au
  // passage d'une Ronce.
  const boostee = creerCombat({
    niveau: 1,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 18, colonne: 1, niveau: 1 }],
    defenseurs: [{ id: 'ronce', rangee: 3, colonne: 5, niveau: 1 }],
    vagues: [[{ id: 'carapace', colonne: 5, rangee: 2, niveau: 20 }]],
    modulesDebloques: { ouvrage: [], joueur: ['booster'] },
  });
  const cuirassier = entite(boostee, parId('carapace'));
  jouer(boostee, 25);
  assert.deepEqual(cuirassier.modulesActifs, ['booster'], 'le Booster n\'a pas marqué son porteur');
  assert.equal(cuirassier.effetsTemporises.length, 1, 'le Booster n\'a posé aucun effet');
  const effet = cuirassier.effetsTemporises[0];
  // ⚠ QUE DES CHAÎNES ET DES ENTIERS : `serialiserEtat` trie les clés et
  // compare le tout ; une valeur non triable y romprait le déterminisme.
  assert.deepEqual(Object.keys(effet).sort(), ['finTick', 'nom']);
  assert.equal(typeof effet.nom, 'string');
  assert.ok(Number.isInteger(effet.finTick));
  // La Ronce ne blesse pas les autres : eux restent vides.
  for (const e of boostee.entites) {
    if (e === cuirassier) continue;
    assert.deepEqual(e.modulesActifs, [], `${e.id} : marqué sans porter de module câblé`);
    assert.deepEqual(e.effetsTemporises, [], `${e.id} : effet posé sans module câblé`);
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
  // ⚠ Seuils déplacés au lot 4A. Casemate à pleine vie : santé 1000 ‰,
  // floor(20 × 1000) = 20 000 milli-PV par tick contre l'infanterie (sa colonne
  // dominante). Le Meute, 700 000 milli-PV, en encaisse 20 000 au premier tick.
  //
  // Mais il rend coup pour coup — 7 PV contre une tourelle — et la Casemate
  // s'affaiblit donc elle aussi : son tir décroît avec sa santé, si bien que la
  // mise à mort ne tombe pas à ceil(700 000 / 20 000) = 35 mais quatre ticks
  // plus tard, au 39e. Le Fusilier tient ainsi cinq fois plus longtemps
  // qu'avant la conversion (7 ticks), et il meurt AVANT la vague 2 du tick 50 —
  // ce que ce test exige.
  jouer(etat, 38);
  assert.equal(attaquantsPresents(etat), 1, 'il tient encore au tick 38');
  jouer(etat, 39);
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

test('§7 — une barrière ne bloque pas, elle saigne, et on en réchappe', () => {
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

  // ⚠ SEUILS DÉPLACÉS AU LOT 4A. La Ronce (Barbwire) passe de 200 à 1 000 PV,
  // le Fusilier de 100 à 700, sa vitesse de 50 à 60 milli/tick et son tir
  // contre une structure de 2,4 à 7 PV. Le franchissement, lui, ne bouge PAS :
  // le relevé ne l'expose pas, et le ÷8 du lot 2B reste notre arbitrage —
  // 2 500 milli-PV par tick contre l'infanterie, simplement écrit désormais en
  // colonne absolue au lieu de 2,5 × matrice 1,0.
  //
  // La Ronce ne bloque pas (bloque: false) : le Fusilier, 60 milli/tick depuis
  // 2000, entre dans sa case au tick 17 (2000 + 17 × 60 = 3020) au lieu d'être
  // arrêté comme il l'aurait été par un mur.
  jouer(etat, 17);
  assert.equal(meute.rangeeMilli, 3020);
  // Rien encore : les dégâts d'un tick se calculent sur les positions de DÉBUT
  // de tick, et au début du tick 17 le Meute était encore à 2960, en case 2.
  assert.equal(meute.pvMilli, 700_000);
  // Pendant ces 17 ticks, le Meute a tiré sur la Ronce à pleine vie : santé
  // 1000 ‰, floor(7 × 1000) = 7000 par tick, la Ronce étant une barrière donc
  // lue en colonne « structure ». 1 000 000 − 17 × 7000 = 881 000.
  assert.equal(ronce.pvMilli, 881_000);

  // Premier tick de présence. La Ronce est à floor(881000 × 1000/1000000)
  // = 881 ‰, donc floor(2500 × 881 / 1000) = 2202 milli-PV de franchissement.
  jouer(etat, 18);
  assert.equal(meute.pvMilli, 700_000 - 2202);

  // Et il traverse : cinq ticks plus tard il a bien avancé de 5 × 60, sans
  // jamais s'arrêter — 3020 + 300 = 3320.
  jouer(etat, 22);
  assert.equal(meute.rangeeMilli, 3320);

  // Entré à 3020, il quitte la case 3 quand il dépasse 3999 : 3020 + 60k ≥ 4000
  // dès k = 17, soit au tick 34. Il paie donc le franchissement aux ticks 18 à
  // 34, dix-sept fois. Les deux décroissances s'imbriquent — le Meute rend
  // 7 × floor(R/1000) à la Ronce, la Ronce lui rend floor(2500 × floor(R/1000)
  // / 1000) — et il sort avec 664 919 milli-PV, soit 35,081 PV perdus sur 700,
  // c'est-à-dire 5,0 % de sa vie là où la Ronce lui coûtait 32,9 % avant la
  // conversion. Le PV mesuré du Fusilier est sept fois le PV deviné ; le
  // franchissement, lui, n'a pas suivi. C'est un point à revoir au banc.
  jouer(etat, 34);
  assert.equal(caseDepuisMilli(meute.rangeeMilli), 4, 'sorti de la case au tick 34');
  assert.equal(meute.pvMilli, 664_919);
  assert.equal(meute.vivant, true, 'une infanterie RÉCHAPPE désormais d\'une Ronce');

  // Plus un milli-PV de franchissement une fois la case quittée.
  jouer(etat, 60);
  assert.equal(meute.pvMilli, 664_919);

  // Le toll est plus faible que le tableau du §3 parce que celui-ci suppose la
  // barrière à pleine vie : ici le Meute l'a canardée pendant toute son
  // approche, et les dégâts de franchissement sont proportionnels aux PV qui
  // restent à la barrière. Elle tient quand même — une barrière ne se détruit
  // pas en la franchissant.
  assert.ok(ronce.pvMilli > 500_000 && ronce.vivant);

  // L'aviation ne paie rien : la table de franchissement de la Ronce vaut 0 en
  // colonne « aviation ». Crécelle (Orca) à 120 milli/tick et 900 PV :
  // 2000 + 20 × 120 = 4400, PV intacts.
  const air = creerCombat(montage('crecelle'));
  const crecelle = entite(air, (e) => e.camp === 'attaque');
  jouer(air, 20);
  assert.equal(crecelle.rangeeMilli, 4400);
  assert.equal(crecelle.pvMilli, 900_000, 'l\'aviation ne franchit rien, elle survole');
});

test('§7 — la traversante sort par le haut, la stoppeuse rentre à la base', () => {
  const montageAerien = (id) => ({
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [{ id: 'gangue', rangee: 18, colonne: 9 }],
    defenseurs: [],
    vagues: [[{ id, colonne: 1 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  });

  // ⚠ Seuils déplacés au lot 4A : le Frappeur (Firehawk) vole à 240 milli/tick
  // et non plus 300 — c'est toujours DEUX FOIS le reste de l'aviation, le
  // relevé le donnant à 240 quand les trois autres sont à 120.
  // Traversant, parti de 2000, il passe au-delà de la rangée 18 quand
  // 2000 + 240k ≥ 19000, soit k ≥ 70,83 → k = 71. Il ne compte jamais un tick
  // inutile : il progresse toujours.
  const traversant = creerCombat(montageAerien('frappeur'));
  const frappeur = entite(traversant, (e) => e.camp === 'attaque');
  jouer(traversant, 70);
  assert.equal(frappeur.rangeeMilli, 18_800);
  assert.equal(frappeur.sorti, false);
  assert.equal(frappeur.ticksInutiles, 0);
  const resultat = resoudre(traversant);
  assert.equal(frappeur.sorti, true, 'sorti du combat, il n\'y revient pas');
  assert.equal(frappeur.vivant, true, 'sorti n\'est pas mort');
  assert.equal(resultat.tick, 71);
  assert.equal(resultat.cause, 'attaquants');

  // ⚠ SECONDE MOITIÉ MODIFIÉE AU LOT 3B. Le Busard restait auparavant planté à
  // 18 950 jusqu'au tick 900. Le repli le renvoie désormais à la base — c'est
  // la règle qui a changé, pas le test. Ce qu'il prouve toujours : une
  // stoppeuse ne franchit JAMAIS le fond, elle ne part pas par le haut.
  //
  // ⚠ Seuils déplacés au lot 4A : le Busard (Paladin) vole à 120 milli/tick et
  // non plus 150. 2000 + 134 × 120 = 18 080 : il entre en rangée 18 au tick 134,
  // et c'est le DERNIER tick où il progresse — dès le 135e, la dernière rangée
  // est un cul-de-sac pour une stoppeuse.
  // La Gangue en (18,9) est à 8 colonnes, soit 8000² = 64 000 000, très au-delà
  // de sa portée² de 6 250 000 : il ne peut pas nuire non plus. Le compteur part
  // au tick 135 et atteint 30 au tick 135 + 29 = 164.
  const stoppeur = creerCombat(montageAerien('busard'));
  const busard = entite(stoppeur, (e) => e.camp === 'attaque');
  jouer(stoppeur, 134);
  assert.equal(busard.rangeeMilli, 18_080);
  assert.equal(busard.ticksInutiles, 0, 'il progressait encore jusqu\'ici');

  jouer(stoppeur, 135);
  assert.equal(busard.ticksInutiles, 1, 'premier tick sans avancer ni nuire');

  // Il rampe encore DANS sa case jusqu'à 18 920, le compteur courant pendant ce
  // temps — ramper n'est pas progresser —, puis refuse le pas suivant :
  // 2000 + 141 × 120 = 18 920, et 19 040 tomberait en rangée 19.
  jouer(stoppeur, 141);
  assert.equal(busard.rangeeMilli, 18_920);
  assert.equal(busard.ticksInutiles, 7);
  jouer(stoppeur, 163);
  assert.equal(busard.rangeeMilli, 18_920, 'une stoppeuse ne franchit pas le fond');
  assert.equal(busard.ticksInutiles, 29);
  assert.equal(busard.sorti, false);

  jouer(stoppeur, 164);
  assert.equal(busard.ticksInutiles, TICKS_AVANT_REPLI);
  assert.equal(busard.sorti, true, 'elle rentre à la base');
  assert.equal(busard.vivant, true, 'rentrer n\'est pas mourir');
  assert.ok(busard.rangeeMilli < 19_000, 'et elle n\'est jamais passée par le haut');
  assert.equal(stoppeur.cause, 'attaquants');
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
    // ⚠ Seuil déplacé au lot 4A : la réserve du Fusilier passe de 150 à 70,
    // donc son plancher de 15 à floor(70 × 0,10) = 7. Réserve montée à 8, soit
    // un tir au-dessus du plancher.
    vagues: [[{ id: 'meute', rangee: 11, colonne: 5, reserve: 8 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const etat = creerCombat(montage);
  const meute = entite(etat, (e) => e.camp === 'attaque');
  const merlon = entite(etat, parId('merlon'));

  jouer(etat, 1);
  assert.equal(meute.reserve, 7, 'le premier tir descend au plancher');

  // Le Meute s'éloigne du mur à 60 milli/tick. Les dégâts d'un tick se calculent
  // sur les positions de DÉBUT de tick : au début du tick 9 il est à 11 480,
  // distance 1480 → 2 190 400 ≤ portée² 2 250 000, il tire ; au début du tick 10
  // il est à 11 540, distance 1540 → 2 371 600 > 2 250 000, il ne tire plus.
  // Neuf tirs de 7000 → 2 000 000 − 63 000 = 1 937 000.
  jouer(etat, 20);
  assert.equal(meute.reserve, 7, 'la défense ne prend pas les 10 % réservés aux bâtiments');
  assert.equal(merlon.pvMilli, 1_937_000, 'et le tir n\'a cessé que faute de portée');
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
