// Géométrie de la grille de combat : cases, milli-cases, distances, occupation,
// obstacles de terrain.
//
// UNITÉ INTERNE UNIQUE : la MILLI-CASE (× 1000). Aucun flottant ne sort de ce
// module — c'est la contrainte structurante du lot 2A. Les distances se
// comparent AU CARRÉ, en milli-case², jamais par racine carrée : la portée est
// franchie si distance² ≤ portée², la portée minimale si distance² ≥ mini².
//
// CONTRAT DE DÉTERMINISME : aucun tirage pseudo-aléatoire, aucune lecture de
// l'horloge murale, aucune racine carrée dans ce module. Le hasard n'intervient
// qu'à la génération du site, donc au lot 2B, en amont du moteur.
//
// Aucune valeur de calibrage en dur : tout vient de src/data/combat.js.

import { GRILLE, OBSTACLES } from '../data/combat.js';

/** Nombre de milli-cases dans une case. */
export const MILLI_PAR_CASE = 1000;

/** Première et dernière rangée de la grille (1 en bas, 18 au fond). */
export const PREMIERE_RANGEE = 1;
export const DERNIERE_RANGEE = GRILLE.longueur;

/**
 * La VOIE D'APPROCHE : la rangée d'où les vagues entrent, sous la grille.
 *
 * ⚠⚠ ETHAN, 11/09 : « qu'elles apparaissent en dessous hors écran, du coup en
 * rangée zéro, trois rangées avant la défense en gros, et elles arrivent
 * normalement. Et elles peuvent engager le combat dès qu'elles sont visibles. »
 * Jusque-là `RANGEE_APPARITION` valait le FRONT de la bande de déploiement — la
 * rangée 2, collée à la défense qui commence en 3 : il n'y avait jamais eu
 * d'approche, et une rampe de dessin la mimait en posant le sprite une case plus
 * bas. L'unité naît maintenant là où le sprite la montrait.
 *
 * ⚠⚠ DÉRIVÉE, JAMAIS ÉCRITE `0`. `PREMIERE_RANGEE - 1` dit ce que le nombre EST
 * — la case sous la grille — et il suivra le jour où la grille changerait de
 * numérotation. Un zéro écrit à la main serait le premier à rester derrière.
 */
export const RANGEE_APPROCHE = PREMIERE_RANGEE - 1;

/** Première et dernière colonne (1 à gauche). */
export const PREMIERE_COLONNE = 1;
export const DERNIERE_COLONNE = GRILLE.largeur;

// ---------------------------------------------------------------------------
// Conversions
// ---------------------------------------------------------------------------

/**
 * Convertit une valeur de src/data/ en entier de milli-quelque-chose, et
 * REFUSE si le produit n'est pas entier. C'est la porte d'entrée unique des
 * flottants du calibrage vers l'arithmétique entière du moteur.
 * @param {number} valeur
 * @param {number} facteur
 * @param {string} contexte Nommé dans le message d'erreur.
 * @returns {number} Entier.
 */
export function enEntier(valeur, facteur, contexte) {
  if (!Number.isFinite(valeur)) {
    throw new Error(`grille : ${contexte} n'est pas un nombre fini (${valeur})`);
  }
  const produit = valeur * facteur;
  const arrondi = Math.round(produit);
  if (Math.abs(produit - arrondi) > 1e-9) {
    throw new Error(`grille : ${contexte} × ${facteur} = ${produit} n'est pas entier`);
  }
  return arrondi;
}

/** Position en milli-cases du centre de la case `n`. */
export function milliDepuisCase(n) {
  return n * MILLI_PAR_CASE;
}

/** Case contenant la position `milli`. */
export function caseDepuisMilli(milli) {
  return Math.floor(milli / MILLI_PAR_CASE);
}

/**
 * Distance AU CARRÉ entre deux positions, en milli-case², LES DEUX AXES EN
 * MILLI-CASES.
 *
 * ⚠⚠ ELLE S'APPELAIT `distanceCarree` ET ELLE MÉLANGEAIT LES DEUX UNITÉS —
 * rangée en milli, colonne en CASES, converties dedans. C'était juste tant
 * qu'aucune entité ne changeait de colonne : la colonne était un entier, et il
 * n'y avait pas d'autre position latérale à décrire. Le lot COLONNE fait tomber
 * cette prémisse pour la DÉFENSE des deux camps, et une entité porte désormais
 * un `colonneMilli` comme elle porte un `rangeeMilli`.
 *
 * ⚠⚠ LE RENOMMAGE EST LE GARDE-FOU, ET C'EST POUR ÇA QU'IL A ÉTÉ FAIT. Gardé
 * sous son ancien nom, un appelant oublié lui aurait passé une colonne en
 * CASES : le carré aurait été faux d'un facteur 1 000 000 sur l'axe horizontal,
 * `node --check` n'aurait rien vu, et un test de portée écrit sur des entités
 * ALIGNÉES en colonne n'aurait rien vu non plus — la composante horizontale y
 * vaut zéro des deux façons. Sous un nom neuf, `esbuild` refuse le build sur
 * « No matching export » et Node lève à l'import : un appelant oublié ne peut
 * plus être silencieux. Les cinq appelants de production ont été repris d'un
 * coup, et `COL T11` désaligne les colonnes pour que le montage puisse tomber.
 *
 * @returns {number} Entier.
 */
export function distanceCarreeMilli(rangeeMilliA, colonneMilliA, rangeeMilliB, colonneMilliB) {
  const dr = rangeeMilliA - rangeeMilliB;
  const dc = colonneMilliA - colonneMilliB;
  return dr * dr + dc * dc;
}

// ---------------------------------------------------------------------------
// Bandes et bornes
// ---------------------------------------------------------------------------

/** La case (rangee, colonne) est-elle sur la grille ? */
export function estDansLaGrille(rangee, colonne) {
  return (
    Number.isInteger(rangee)
    && Number.isInteger(colonne)
    && rangee >= PREMIERE_RANGEE && rangee <= DERNIERE_RANGEE
    && colonne >= PREMIERE_COLONNE && colonne <= DERNIERE_COLONNE
  );
}

/**
 * La rangée est-elle dans la bande nommée ('deploiement', 'defense',
 * 'batiments') ?
 */
export function estDansLaBande(rangee, nomBande) {
  const bande = GRILLE.bandes[nomBande];
  if (!bande) throw new Error(`grille : bande inconnue « ${nomBande} »`);
  return rangee >= bande.premiere && rangee <= bande.derniere;
}

/** Bornes d'une bande, pour les messages d'erreur. */
export function bornesBande(nomBande) {
  const bande = GRILLE.bandes[nomBande];
  if (!bande) throw new Error(`grille : bande inconnue « ${nomBande} »`);
  return { premiere: bande.premiere, derniere: bande.derniere };
}

/**
 * L'entité est-elle encore SOUS la grille, dans la voie d'approche ?
 *
 * ⚠⚠ C'EST LE PRÉDICAT DES DEUX VERROUS D'ETHAN — « elles peuvent engager le
 * combat dès qu'elles sont visibles ». Hors grille, une attaquante ne tire pas
 * et n'est pas tirable ; elle entre au combat en atteignant la rangée 1. Les
 * deux moitiés se lisent dans `ciblage` de `sim/combat.js`, et nulle part
 * ailleurs.
 *
 * ⚠⚠ IL PREND UN MILLI, PAS UNE CASE, ET C'EST STRUCTUREL. Tout le moteur
 * raisonne en milli-cases depuis le lot 2A : une entité franchit la rangée 1 au
 * milieu d'un tick, et un prédicat en cases obligerait chaque appelant à faire
 * son propre `caseDepuisMilli`. Le premier qui l'oublierait le ferait en
 * silence — et le seuil est justement l'endroit où la règle bascule.
 *
 * ⚠⚠ ET `estDansLaGrille` N'EST PAS ÉLARGIE, SURTOUT PAS. Elle est lue par
 * `render/portee.js` et par `caseDepuisPixels` de `render/projection.js` : une
 * rangée 0 acceptée y ferait DÉSIGNER AU DOIGT une case sous la grille, et le
 * banc rendrait une case là où le joueur n'a rien touché. C'est une fonction de
 * géométrie, pas un droit de séjour.
 */
export function estEnApproche(rangeeMilli) {
  return rangeeMilli < milliDepuisCase(PREMIERE_RANGEE);
}

/**
 * Une position au-delà de la dernière rangée sort du combat. Seule l'aviation
 * traversante y arrive : le sol refuse le déplacement qui l'y mènerait.
 */
export function estSortiParLeHaut(rangeeMilli) {
  return rangeeMilli >= milliDepuisCase(DERNIERE_RANGEE + 1);
}

/**
 * Une position latérale sort-elle de la grille PAR LE CÔTÉ ?
 *
 * ⚠⚠ ELLE EXISTE PARCE QUE `peutAvancer` EST ÉCRITE POUR LA VERTICALE, ET QU'ON
 * NE LUI AJOUTE PAS UN AXE. Sa première ligne teste `rangee >= DERNIERE_RANGEE`
 * et rend le comportement aérien : un paramètre d'axe en ferait deux fonctions
 * dans une, dont l'une des deux branches ne serait jamais relue. La borne
 * latérale est donc écrite ICI, PURE et EXPORTÉE, pour qu'un test l'atteigne
 * sans monter un combat — `COL T10`.
 *
 * ⚠ ET IL N'Y A AUCUNE SORTIE LÉGALE PAR LE CÔTÉ, contrairement au fond que
 * l'aviation traversante franchit. Une entité qui atteindrait la colonne 0 ou
 * 10 quitterait la grille sans qu'aucune règle le prévoie : le déplacement qui
 * l'y mènerait est simplement REFUSÉ, et elle reste où elle est.
 */
export function estSortiParLeCote(colonneMilli) {
  const c = caseDepuisMilli(colonneMilli);
  return c < PREMIERE_COLONNE || c > DERNIERE_COLONNE;
}

// ---------------------------------------------------------------------------
// Occupation
// ---------------------------------------------------------------------------
//
// Deux entités bloquantes ne peuvent pas occuper la même case. L'occupation
// est DÉRIVÉE : elle se reconstruit à chaque étape qui en a besoin, elle
// n'est jamais stockée dans l'état — un index désynchronisé serait une source
// de divergence, donc de non-déterminisme.

/** Clé entière unique d'une case. colonne < 100, donc pas de collision. */
export function cleCase(rangee, colonne) {
  return rangee * 100 + colonne;
}

/** @returns {Map<number, number>} clé de case → indice d'entité. */
export function creerOccupation() {
  return new Map();
}

export function poser(occupation, rangee, colonne, indice) {
  occupation.set(cleCase(rangee, colonne), indice);
}

export function retirer(occupation, rangee, colonne) {
  occupation.delete(cleCase(rangee, colonne));
}

/** @returns {number|undefined} indice de l'occupante, ou undefined. */
export function occupantDe(occupation, rangee, colonne) {
  return occupation.get(cleCase(rangee, colonne));
}

// ---------------------------------------------------------------------------
// Obstacles de terrain
// ---------------------------------------------------------------------------

/** Diviseur de vitesse d'un obstacle, en millièmes (2,5 → 2500). */
export const DIVISEUR_OBSTACLE_MILLI = enEntier(
  OBSTACLES.diviseurVitesse,
  MILLI_PAR_CASE,
  'OBSTACLES.diviseurVitesse',
);

/** Types d'obstacle admis, tels que déclarés par les données. */
export const TYPES_OBSTACLE = OBSTACLES.types;

/**
 * Vitesse ralentie par un obstacle, en milli-cases par tick.
 * REFUSE si le quotient n'est pas entier : le brief exige que toutes les
 * vitesses divisées par 2,5 restent entières (50 → 20 · 120 → 48 · 300 → 120).
 */
export function vitesseSousObstacle(vitesseMilli) {
  const numerateur = vitesseMilli * MILLI_PAR_CASE;
  if (numerateur % DIVISEUR_OBSTACLE_MILLI !== 0) {
    throw new Error(
      `grille : vitesse ${vitesseMilli} milli/tick divisée par `
      + `${OBSTACLES.diviseurVitesse} ne donne pas un entier`,
    );
  }
  return numerateur / DIVISEUR_OBSTACLE_MILLI;
}

/** @returns {Map<number, string>} clé de case → type d'obstacle. */
export function indexerObstacles(obstacles) {
  const index = new Map();
  for (const o of obstacles) index.set(cleCase(o.rangee, o.colonne), o.type);
  return index;
}

/** @returns {string|undefined} type de l'obstacle porté par la case. */
export function typeObstacleSur(index, rangee, colonne) {
  return index.get(cleCase(rangee, colonne));
}

/**
 * L'obstacle concerne-t-il ce châssis ? L'aviation ignore le terrain, quel
 * que soit le type de l'obstacle.
 * @param {string} type 'infanterie' | 'vehicule' | 'les_deux'
 * @param {string} chassis 'escouade' | 'blinde' | 'aeronef'
 */
export function obstacleConcerne(type, chassis) {
  if (chassis === 'aeronef') return false;
  if (type === 'les_deux') return true;
  if (type === 'infanterie') return chassis === 'escouade';
  if (type === 'vehicule') return chassis === 'blinde';
  throw new Error(`grille : type d'obstacle inconnu « ${type} »`);
}
