// La carte monde — où l'on est, et quel niveau ça vaut.
//
// Trois choses seulement, et elles se dérivent toutes de `GEOGRAPHIE` : la
// colonne du centre, le niveau d'une rangée, et les deux positions remarquables
// (le départ du joueur, la base terminale).
//
// ⚠ POURQUOI CE MODULE EXISTE ALORS QUE `GEOGRAPHIE` EST DÉJÀ ÉCRITE.
// `GEOGRAPHIE` porte des DISTANCES (« 25 cases depuis le bord bas », « colonne
// centre ») et pas des coordonnées. Tant que personne n'avait besoin d'une
// rangée et d'une colonne, ça suffisait. `sim/champs.js` en a besoin : le
// terrain d'une base se tire de sa POSITION. Traduire une distance en
// coordonnée demande de fixer deux conventions — d'où est comptée une rangée,
// et où tombe le centre d'une largeur paire — et ces conventions ne doivent
// exister qu'ICI, une fois.
//
// ⚠ LA CONVENTION DE RANGÉE N'A PAS ÉTÉ CHOISIE, ELLE A ÉTÉ DÉDUITE.
// `GEOGRAPHIE.departJoueur` porte DEUX faits liés : `strate: 5` et
// `casesDepuisBordBas: 25`. Avec `niveauParCase: 0.2`, un seul décalage les
// rend tous les deux vrais — 25 × 0,2 = 5. Le test l'asserte de face : si
// quelqu'un décale d'une rangée, la strate cesse de valoir 5 et la suite tombe.
// C'est ce qui fait qu'aucun « plus ou moins un » n'a été tranché à la main.

import { GEOGRAPHIE } from '../data/sites.js';

/**
 * Colonne du centre de la carte.
 *
 * ⚠ LA LARGEUR EST PAIRE (30), DONC IL N'Y A PAS DE CENTRE EXACT. Il faut
 * choisir entre 15 et 16, et le choix n'a aucune conséquence de jeu — ce qui
 * compte, c'est qu'il soit fait UNE fois et que les deux positions
 * remarquables l'emploient. `GEOGRAPHIE.baseTerminale.colonne` vaut la chaîne
 * `'centre'` sans dire laquelle ; cette fonction est la réponse, et elle est
 * la seule.
 *
 * Retenu : la moitié SUPÉRIEURE, soit 16 sur 30 — la même règle qu'un
 * `Math.ceil` de milieu de tableau, celle qu'on réécrit d'instinct.
 * @returns {number}
 */
export function colonneCentre() {
  return Math.ceil((GEOGRAPHIE.carte.largeur + 1) / 2);
}

/**
 * Niveau des sites de l'OUVRAGE sur une rangée de la carte.
 *
 * ⚠ CE NIVEAU N'EST PAS CELUI DU JOUEUR, et la confusion coûterait cher.
 * Arbitré le 27/08 : les niveaux de la carte concernent l'Ouvrage seul. La base
 * du joueur porte trois niveaux qui lui sont propres — bâtiments, défense,
 * armée offensive —, chacun une MOYENNE, et aucun ne se déduit d'une rangée.
 * Ne jamais appeler cette fonction avec la position du joueur pour en tirer
 * « son niveau ».
 *
 * Le niveau monte de `niveauParCase` à chaque case en s'éloignant du bord BAS,
 * et se plafonne à `niveauPlafond`. Il ne descend jamais sous 1 : la rangée du
 * bord bas vaudrait 0, qui n'est pas un niveau.
 *
 * ⚠ RANGÉE 1 = BORD HAUT, RANGÉE `hauteur` = BORD BAS. C'est l'ordre de
 * lecture d'un écran, et c'est aussi celui de la grille de combat, où la
 * rangée 1 est le côté d'où arrivent les vagues. Une seule convention pour les
 * deux grilles, sinon on passe son temps à retourner des coordonnées.
 *
 * @param {number} rangee de 1 à `GEOGRAPHIE.carte.hauteur`
 * @returns {number} entier de 1 à `niveauPlafond`
 */
export function niveauDeLaRangee(rangee) {
  if (!Number.isInteger(rangee) || rangee < 1 || rangee > GEOGRAPHIE.carte.hauteur) {
    throw new RangeError(
      `carte : rangée ${rangee} hors de 1…${GEOGRAPHIE.carte.hauteur}`,
    );
  }
  const depuisLeBas = GEOGRAPHIE.carte.hauteur - rangee;
  const brut = Math.round(depuisLeBas * GEOGRAPHIE.niveauParCase);
  if (brut < 1) return 1;
  return brut > GEOGRAPHIE.niveauPlafond ? GEOGRAPHIE.niveauPlafond : brut;
}

/**
 * Distance d'une rangée au bord bas, en cases. Le bord bas lui-même vaut 0.
 * @param {number} rangee
 * @returns {number}
 */
export function casesDepuisBordBas(rangee) {
  return GEOGRAPHIE.carte.hauteur - rangee;
}

/**
 * Où le joueur ouvre le jeu.
 *
 * ARBITRÉ le 26/08 : « le joueur démarre tout en bas au milieu ». La COLONNE
 * vient de là — elle n'était écrite nulle part. La RANGÉE, elle, était déjà
 * arbitrée par `GEOGRAPHIE.departJoueur` : 25 cases depuis le bord bas, ce qui
 * fait la strate 5. Ce n'est donc pas le bord lui-même, et ça ne peut pas
 * l'être : le bord vaudrait le niveau 0.
 *
 * @returns {{rangee: number, colonne: number}}
 */
export function positionDepartJoueur() {
  return {
    rangee: GEOGRAPHIE.carte.hauteur - GEOGRAPHIE.departJoueur.casesDepuisBordBas,
    colonne: colonneCentre(),
  };
}

/**
 * Où se trouve la base terminale — le bout de la carte.
 * `GEOGRAPHIE.baseTerminale.colonne` dit `'centre'` ; c'est `colonneCentre()`
 * qui le traduit, la même que pour le départ du joueur. Les deux extrémités du
 * couloir sont donc alignées, ce qui n'est pas un hasard : la carte EST un
 * couloir.
 * @returns {{rangee: number, colonne: number}}
 */
export function positionBaseTerminale() {
  if (GEOGRAPHIE.baseTerminale.colonne !== 'centre') {
    throw new Error(
      `carte : colonne de base terminale « ${GEOGRAPHIE.baseTerminale.colonne} » non traduite`,
    );
  }
  return {
    rangee: 1 + GEOGRAPHIE.baseTerminale.casesDepuisBordHaut,
    colonne: colonneCentre(),
  };
}

/**
 * La case est-elle sur la carte ?
 * @param {number} rangee
 * @param {number} colonne
 * @returns {boolean}
 */
export function estSurLaCarte(rangee, colonne) {
  return Number.isInteger(rangee) && Number.isInteger(colonne)
    && rangee >= 1 && rangee <= GEOGRAPHIE.carte.hauteur
    && colonne >= 1 && colonne <= GEOGRAPHIE.carte.largeur;
}

// ---------------------------------------------------------------------------
// Les grosses bases — lot VERROUS, 20/09/2026
// ---------------------------------------------------------------------------
//
// ⚠⚠ `empriseDeLaGrosseBase` MONTE ICI DEPUIS `render/embleme.js`, ET C'EST LE
// GESTE QUE `sim/poi.js` ANNONÇAIT DEPUIS LE 31/08. Son en-tête dit, mot pour
// mot : « il n'y a pas de cycle aujourd'hui, mais le jour où il en aurait un,
// c'est CETTE ligne qu'il faudra défaire, en montant la géométrie dans `sim/`
// plutôt qu'en recopiant le décalage. » Ce lot est ce jour-là : `poi.js`,
// `peuplement.js` et `site-de-la-case.js` ont tous les trois besoin de savoir
// quelles cases une grosse base couvre, et trois modules de `sim/` qui lisent
// `render/` pour une question de GÉOMÉTRIE, c'est la direction à l'envers.
//
// ⚠ `render/embleme.js` LA RÉEXPORTE, donc aucun import du dépôt ne change et
// aucun test n'a eu à être déplacé. Ce qui change est la direction : `render/`
// lit `sim/`, comme `render/terrain.js` et `render/variante.js` le font déjà.
//
// ⚠ LE NOM DES SPRITES RESTE DANS `render/`, ET C'EST LA LIGNE DE PARTAGE. Quel
// dessin porte une grosse base est une question de rendu ; quelles CASES elle
// couvre est une question de carte. `COTES_GROSSE_BASE` ci-dessous est la
// seconde, et `SPRITES_GROSSE_BASE` la première — un test les confronte.

/**
 * Les côtés qu'une grosse base peut avoir, en cases.
 *
 * ⚠ ELLE EST DÉRIVÉE DE CE QUE LA CARTE EMPLOIE, jamais écrite à la main : la
 * finale couvre `3 × 3`, un verrou `GEOGRAPHIE.verrous.cotes`. Le jour où un
 * troisième format entrerait, il entrerait par sa table, pas par cette ligne.
 */
export const COTES_GROSSE_BASE = [...new Set([GEOGRAPHIE.verrous.cotes, 3])]
  .sort((a, b) => a - b);

/**
 * Où se pose une grosse base, en CASES, autour de la case du site.
 *
 * ⚠⚠ UNE 3 × 3 SE CENTRE, UNE 2 × 2 NE PEUT PAS. `data/sites.js` a déjà buté sur
 * cette parité — « une largeur paire n'a pas de centre », et la carte est passée
 * de 30 à 31 colonnes pour cette raison. **Retenu : la case du site est le coin
 * HAUT-GAUCHE du carré pair.** C'est un choix réversible d'une ligne.
 *
 * ⚠⚠ UN CARRÉ QUI DÉBORDE LA CARTE LÈVE, IL NE SE ROGNE PAS. La base finale
 * tient largement, et les six verrous sont mesurés — mais c'est une propriété de
 * leur POSITION, pas de la fonction. Le jour où une grosse base se poserait au
 * bord, un carré rogné en silence dessinerait une base tronquée que personne ne
 * saurait expliquer. C'est ce qui a tué le rayon 15 de la fourchette d'Ethan.
 *
 * @param {number} cotes une valeur de `COTES_GROSSE_BASE`
 * @param {{rangee: number, colonne: number}} site
 * @returns {{rangee: number, colonne: number, cotes: number}} le coin haut-gauche
 */
export function empriseDeLaGrosseBase(cotes, site) {
  if (!COTES_GROSSE_BASE.includes(cotes)) {
    throw new RangeError(`carte : pas de grosse base de ${cotes} cases de côté`);
  }
  // Impair : le carré se centre, donc il déborde de (cotes − 1) / 2 de chaque
  // côté. Pair : la case EST le coin, donc aucun débordement vers le haut.
  const recul = (cotes - 1) % 2 === 0 ? (cotes - 1) / 2 : 0;
  const rangee = site.rangee - recul;
  const colonne = site.colonne - recul;
  if (rangee < 1 || rangee + cotes - 1 > GEOGRAPHIE.carte.hauteur
    || colonne < 1 || colonne + cotes - 1 > GEOGRAPHIE.carte.largeur) {
    throw new RangeError(
      `carte : une base de ${cotes} cases en (${site.rangee}, ${site.colonne}) `
      + `déborde la carte de ${GEOGRAPHIE.carte.hauteur} × ${GEOGRAPHIE.carte.largeur}`,
    );
  }
  return { rangee, colonne, cotes };
}

/**
 * Les six verrous, dans le sens horaire depuis la pointe du haut.
 *
 * ⚠⚠ SIX SOMMETS CALCULÉS, JAMAIS SIX COUPLES ÉCRITS. Une table de positions
 * cesserait d'être vraie au premier réglage du rayon, et la divergence se
 * lirait comme un verrou mal placé plutôt que comme une table périmée. Tout
 * vient de `GEOGRAPHIE.verrous` et de `positionBaseTerminale`.
 *
 * ⚠ L'ARRONDI EST `Math.round`, ET IL EST DANS LE RÉSULTAT. Un hexagone de
 * rayon 12 sur une grille carrée ne tombe pas sur des entiers : les sommets
 * mesurés sont (3,16) (9,26) (21,26) (27,16) (21,6) (9,6), et ce sont EUX les
 * positions du jeu, pas une approximation d'autre chose. Ils sont figés par un
 * test — s'ils bougent, c'est que le rayon ou l'orientation a bougé, et il faut
 * le dire, pas le subir.
 *
 * ⚠ L'ORDRE FAIT PARTIE DU RÉSULTAT, comme celui des POI : il décide de l'ordre
 * de dessin et de celui du compteur « n sur six ».
 *
 * @returns {Array<{rangee: number, colonne: number}>}
 */
export function positionsDesVerrous() {
  const { rayon, orientation, nombre } = GEOGRAPHIE.verrous;
  if (orientation !== 'pointe-haut') {
    throw new Error(`carte : orientation de verrous « ${orientation} » non traduite`);
  }
  const centre = positionBaseTerminale();
  const positions = [];
  for (let k = 0; k < nombre; k += 1) {
    // −90° met le premier sommet DROIT AU-DESSUS du centre ; les rangées
    // croissent vers le bas, donc le sinus s'y ajoute tel quel.
    const angle = ((-90 + k * (360 / nombre)) * Math.PI) / 180;
    positions.push({
      rangee: centre.rangee + Math.round(rayon * Math.sin(angle)),
      colonne: centre.colonne + Math.round(rayon * Math.cos(angle)),
    });
  }
  return positions;
}

/**
 * Les sept grosses bases du bout de la carte : la finale et ses six verrous.
 *
 * ⚠ LE TYPE VOYAGE AVEC LA POSITION, parce que tout lecteur en a besoin : le
 * peuplement pour exclure, `siteDeLaCase` pour rendre le site, l'écran pour
 * choisir le sprite. Les séparer ferait recoller les deux listes chez chaque
 * appelant, et l'un d'eux se tromperait.
 *
 * @returns {Array<{type: string, rangee: number, colonne: number, cotes: number}>}
 */
export function grossesBasesDeLaCarte() {
  const finale = positionBaseTerminale();
  return [
    { type: 'baseTerminale', ...finale, cotes: 3 },
    ...positionsDesVerrous().map((p) => ({
      type: 'baseVerrou', ...p, cotes: GEOGRAPHIE.verrous.cotes,
    })),
  ];
}

/**
 * Les cases couvertes par les sept grosses bases — calculées une fois.
 *
 * ⚠⚠ C'EST UNE PROPRIÉTÉ DE LA GÉOMÉTRIE, PAS DE LA PARTIE : elle ne dépend
 * d'aucune graine, donc elle se calcule au chargement du module et jamais plus.
 * `estBaseOuvrage` la consulte pour chaque case candidate de la carte, et
 * `sim/poi.js` pour chacun de ses soixante-dix tirages — la recalculer à chaque
 * appel se paierait.
 *
 * ⚠ LA CLÉ EST « rangée:colonne », la même forme que `basesRasees` emploie
 * depuis le début. Une seconde forme de clé pour les mêmes cases serait une
 * occasion de divergence pour rien.
 */
const CASES_DES_GROSSES_BASES = (() => {
  const cases = new Map();
  for (const base of grossesBasesDeLaCarte()) {
    const e = empriseDeLaGrosseBase(base.cotes, base);
    for (let r = e.rangee; r < e.rangee + e.cotes; r += 1) {
      for (let c = e.colonne; c < e.colonne + e.cotes; c += 1) {
        cases.set(`${r}:${c}`, base);
      }
    }
  }
  return cases;
})();

/**
 * La grosse base qui couvre cette case — `null` s'il n'y en a pas.
 *
 * C'est la question que posent le peuplement (« puis-je poser ici ? »), le
 * tirage des POI (« ce gisement serait-il recouvert ? ») et `siteDeLaCase`
 * (« sur quoi le joueur vient-il de cliquer ? »). **Une seule réponse pour les
 * trois**, et c'est ce qui garantit qu'aucun des trois ne voit une carte
 * différente des deux autres.
 *
 * @param {number} rangee
 * @param {number} colonne
 * @returns {{type: string, rangee: number, colonne: number, cotes: number}|null}
 */
export function grosseBaseDeLaCase(rangee, colonne) {
  return CASES_DES_GROSSES_BASES.get(`${rangee}:${colonne}`) ?? null;
}

/**
 * Le niveau d'une grosse base — la finale a le sien, un verrou lit sa rangée.
 *
 * ⚠⚠ LA FINALE DÉPASSE LE PLAFOND DE LA CARTE, ET C'EST VOULU.
 * `GEOGRAPHIE.niveauDeLaBaseFinale` vaut 60 quand `niveauPlafond` vaut 50 : le
 * niveau d'un SITE et le plafond d'une CARTE sont deux grandeurs, et c'est
 * l'arbitrage Q8 d'Ethan du 11/09. Un verrou, lui, n'a besoin d'aucune
 * dérogation — sa rangée lui donne déjà 50.
 *
 * @param {string} type
 * @param {number} rangee
 * @returns {number}
 */
export function niveauDeLaGrosseBase(type, rangee) {
  return type === 'baseTerminale'
    ? GEOGRAPHIE.niveauDeLaBaseFinale
    : niveauDeLaRangee(rangee);
}
