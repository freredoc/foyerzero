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
// La grille PORTÉE — lot GRILLE-PORTÉE, 20/09/2026
// ---------------------------------------------------------------------------
//
// ⚠⚠ LES DEUX CONSTANTES CI-DESSUS SONT FIGÉES À L'IMPORT, ET C'EST TOUT LE MUR
// QUE CE LOT FRANCHIT. Mesuré en mutant `GRILLE` en mémoire vers 9 × 27 APRÈS
// un import statique — l'ordre réel du jeu : `DERNIERE_RANGEE` valait encore
// 18, `genererSite` posait une Souche en rangée 26, et `creerCombat` la
// refusait « hors de la grille (rangées 1–18, colonnes 1–9) ». Le générateur
// produisait une base valide que le moteur refusait. Une constante ne prend pas
// de paramètre ; ce qui suit en prend un.
//
// ⚠⚠ LA RÈGLE DU LOT : ce qui lit `GRILLE` peut recevoir une grille, et SANS
// argument rend exactement ce qu'il rendait. `GRILLE` reste l'objet 9 × 18 de
// `data/combat.js`, il n'est JAMAIS muté ; une autre grille est un SECOND objet,
// passé en argument. C'est ce qui garantit que la base du JOUEUR — `data/base.js`,
// `sim/state.js`, `ui/defense.js`, `ui/chantier.js`, qui lisent `GRILLE` — ne
// peut pas être touchée : par construction, pas par vigilance.
//
// ⚠ LES DEUX CONSTANTES RESTENT, ET ELLES DÉCRIVENT `GRILLE`. Vingt fichiers de
// `test/` les lisent pour ce qu'elles sont. Ce qui change, c'est que plus AUCUN
// lecteur de `sim/combat.js` ne les lit : les six sites qui le faisaient
// demandent la grille que l'état porte, par les deux fonctions ci-dessous.

/**
 * La dernière rangée d'une grille — `DERNIERE_RANGEE` sans argument.
 * @param {object} [grille] une grille au format de `GRILLE`
 * @returns {number}
 */
export function derniereRangee(grille = GRILLE) {
  return grille.longueur;
}

/**
 * La dernière colonne d'une grille — `DERNIERE_COLONNE` sans argument.
 * @param {object} [grille] une grille au format de `GRILLE`
 * @returns {number}
 */
export function derniereColonne(grille = GRILLE) {
  return grille.largeur;
}

/**
 * Une grille est-elle bien formée ? LÈVE sinon, en nommant le contexte.
 *
 * ⚠⚠ ELLE EXISTE PARCE QU'UNE GRILLE MALFORMÉE NE LÈVE NULLE PART AILLEURS.
 * `estDansLaGrille` sur un `longueur` absent compare à `undefined`, rend
 * `false`, et le moteur refuserait chaque pose « hors de la grille » sans dire
 * que la grille est en cause. `creerCombat` l'appelle sur une grille PRÉSENTE
 * dans le montage — et sur elle seule.
 *
 * ⚠ LES TROIS BANDES SONT CONTIGUËS, DANS L'ORDRE DE `GRILLE`, ET COUVRENT LA
 * GRILLE : c'est ce que `G3` asserte de `GRILLE` depuis le lot 2A, et ce que
 * `RANGEE_DEFENSE_FRANCHIE`, `tiersDeLaDefense` et `render/bandes.js` supposent
 * tous. Une seconde grille qui ne le tiendrait pas ferait mentir les trois.
 *
 * ⚠ ET LES NOMS DES BANDES SE LISENT DANS `GRILLE`, ILS NE S'ÉCRIVENT PAS ICI :
 * `render/bandes.js` est la seule table qui les nomme, et `RAID-E T5` refuse
 * une seconde — mesuré, le premier jet de cette fonction l'a fait tomber. La
 * référence est la grille par défaut elle-même, ce qui est plus fort qu'une
 * liste : une grille portée a EXACTEMENT les bandes de `GRILLE`, dans son ordre.
 *
 * @param {object} grille
 * @param {string} [contexte] nommé dans le message d'erreur
 * @returns {object} la grille, telle quelle
 */
export function verifierGrille(grille, contexte = 'grille') {
  if (grille === null || typeof grille !== 'object') {
    throw new TypeError(`${contexte} : grille absente ou malformée`);
  }
  const { largeur, longueur, bandes, casesBatiments } = grille;
  if (!Number.isInteger(largeur) || largeur < 1) {
    throw new RangeError(`${contexte} : largeur « ${largeur} » — entier ≥ 1 attendu`);
  }
  if (!Number.isInteger(longueur) || longueur < 1) {
    throw new RangeError(`${contexte} : longueur « ${longueur} » — entier ≥ 1 attendu`);
  }
  if (bandes === null || typeof bandes !== 'object') {
    throw new TypeError(`${contexte} : bandes absentes`);
  }
  let attendue = PREMIERE_RANGEE;
  for (const nom of Object.keys(GRILLE.bandes)) {
    const bande = bandes[nom];
    if (!bande || !Number.isInteger(bande.premiere) || !Number.isInteger(bande.derniere)) {
      throw new TypeError(`${contexte} : bande « ${nom} » absente ou malformée`);
    }
    if (bande.premiere !== attendue || bande.derniere < bande.premiere) {
      throw new RangeError(
        `${contexte} : bande « ${nom} » ${bande.premiere}…${bande.derniere} — `
        + `attendue à partir de la rangée ${attendue}, les trois bandes sont contiguës`,
      );
    }
    attendue = bande.derniere + 1;
  }
  if (attendue - 1 !== longueur) {
    throw new RangeError(
      `${contexte} : les trois bandes couvrent ${attendue - 1} rangées, la grille en fait ${longueur}`,
    );
  }
  const cases = (bandes.batiments.derniere - bandes.batiments.premiere + 1) * largeur;
  if (casesBatiments !== cases) {
    throw new RangeError(
      `${contexte} : casesBatiments vaut ${casesBatiments}, la bande des bâtiments en fait ${cases}`,
    );
  }
  return grille;
}

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

/**
 * La case (rangee, colonne) est-elle sur la grille ?
 *
 * ⚠ LE TROISIÈME PARAMÈTRE EST LA GRILLE, `GRILLE` PAR DÉFAUT — lot
 * GRILLE-PORTÉE. Sans lui, la fonction rend exactement le prédicat d'avant ; ce
 * n'est PAS l'élargissement que le pavé d'`estEnApproche` interdit, qui parle
 * d'accepter une rangée 0 sur la grille par défaut.
 */
export function estDansLaGrille(rangee, colonne, grille = GRILLE) {
  return (
    Number.isInteger(rangee)
    && Number.isInteger(colonne)
    && rangee >= PREMIERE_RANGEE && rangee <= derniereRangee(grille)
    && colonne >= PREMIERE_COLONNE && colonne <= derniereColonne(grille)
  );
}

/**
 * La rangée est-elle dans la bande nommée ('deploiement', 'defense',
 * 'batiments') ?
 */
export function estDansLaBande(rangee, nomBande, grille = GRILLE) {
  const bande = grille.bandes[nomBande];
  if (!bande) throw new Error(`grille : bande inconnue « ${nomBande} »`);
  return rangee >= bande.premiere && rangee <= bande.derniere;
}

/** Bornes d'une bande, pour les messages d'erreur. */
export function bornesBande(nomBande, grille = GRILLE) {
  const bande = grille.bandes[nomBande];
  if (!bande) throw new Error(`grille : bande inconnue « ${nomBande} »`);
  return { premiere: bande.premiere, derniere: bande.derniere };
}

/**
 * L'entité est-elle encore SOUS la grille, dans la voie d'approche ?
 *
 * ⚠⚠ C'EST LE PRÉDICAT DES DEUX VERROUS D'ETHAN — « elles peuvent engager le
 * combat dès qu'elles sont visibles ». Hors grille, une attaquante ne tire pas
 * et n'est pas tirable ; elle entre au combat en atteignant la rangée 1. Les
 * deux moitiés se lisent dans `ciblage` de `sim/combat.js` — et `avancer` la
 * lit une TROISIÈME fois depuis le lot APPROCHE, pour geler le compteur de repli
 * sur la voie d'approche. Ce pavé disait « nulle part ailleurs » ; c'était
 * périmé, mesuré au lot GRILLE-PORTÉE.
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
 *
 * ⚠ « ÉLARGIR » VEUT DIRE ACCEPTER UNE RANGÉE DE PLUS SUR LA GRILLE PAR DÉFAUT.
 * Lui avoir donné un paramètre `grille` au lot GRILLE-PORTÉE n'est PAS ça :
 * sans argument elle rend le même prédicat qu'avant, au caractère près, et avec
 * une autre grille elle répond de CETTE grille-là — une rangée 27 sur une grille
 * de 27 est sur la grille. Le prochain lot ne doit pas lire ce pavé comme une
 * interdiction de ce qui vient d'être fait.
 */
export function estEnApproche(rangeeMilli) {
  return rangeeMilli < milliDepuisCase(PREMIERE_RANGEE);
}

/**
 * Une position au-delà de la dernière rangée sort du combat. Seule l'aviation
 * traversante y arrive : le sol refuse le déplacement qui l'y mènerait.
 */
export function estSortiParLeHaut(rangeeMilli, grille = GRILLE) {
  return rangeeMilli >= milliDepuisCase(derniereRangee(grille) + 1);
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
export function estSortiParLeCote(colonneMilli, grille = GRILLE) {
  const c = caseDepuisMilli(colonneMilli);
  return c < PREMIERE_COLONNE || c > derniereColonne(grille);
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
