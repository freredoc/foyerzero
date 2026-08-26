// Champs de ressource d'une base — tirage déterministe par la POSITION.
//
// Une base, où qu'elle soit sur la carte, porte douze cases de champ : cinq à
// sept de quartz, le reste en scorie. Elles sont le SOCLE des collecteurs — un
// collecteur ne se pose que là, et il produit ce qu'il y a sous lui. Douze
// cases, donc douze collecteurs au maximum, et pas un de plus quel que soit le
// niveau du Chantier.
//
// CONTRAT DE DÉTERMINISME. Le tirage ne dépend QUE de la position sur la carte :
// deux appels avec la même case rendent le même terrain, à l'octet près, pour
// toujours. Aucune horloge, aucun état global, aucun tirage du langage — le
// PRNG du projet, explicitement passé. C'est ce qui fait qu'une base « posée à
// un endroit aura toujours les mêmes choses ».
//
// ⚠ CE MODULE NE POSE PAS DE BÂTIMENT. Il rend un terrain, rien d'autre. Qui a
// le droit de se poser dessus est dans `CHAMPS.posableDessus` de data/base.js,
// et ce sera au moteur de base de le faire respecter le jour où il existera.
//
// Aucune valeur de calibrage en dur : tout vient de data/base.js.

import { creerRng, entier, choisir, melanger } from './rng.js';
import { CHAMPS, zoneDesChamps } from '../data/base.js';

// ---------------------------------------------------------------------------
// Formes — un bloc est une liste d'écarts par rapport à son ancre
// ---------------------------------------------------------------------------
//
// Les écarts sont [écart de rangée, écart de colonne], l'ancre étant toujours
// l'un des membres du bloc. Ils sont écrits en dur ICI et pas dans data/ à
// dessein : ce ne sont pas des valeurs de calibrage, ce sont les seules formes
// géométriquement possibles pour un domino et un tromino. Les changer, ce
// serait changer de géométrie, pas de réglage.
//
//   taille 1   ▓
//   taille 2   ▓▓        ▓
//                        ▓
//   taille 3   ▓▓▓       ▓      droit
//                        ▓
//                        ▓
//   taille 3   ▓▓   ▓▓   ▓·   ·▓    coudé — les quatre orientations du L
//              ▓·   ·▓   ▓▓   ▓▓

const FORMES = {
  1: [
    { categorie: 'unique', ecarts: [[0, 0]] },
  ],
  2: [
    { categorie: 'unique', ecarts: [[0, 0], [0, 1]] }, // horizontal
    { categorie: 'unique', ecarts: [[0, 0], [1, 0]] }, // vertical
  ],
  3: [
    { categorie: 'droit', ecarts: [[0, 0], [0, 1], [0, 2]] },
    { categorie: 'droit', ecarts: [[0, 0], [1, 0], [2, 0]] },
    { categorie: 'coude', ecarts: [[0, 0], [0, 1], [1, 0]] },
    { categorie: 'coude', ecarts: [[0, 0], [0, 1], [1, 1]] },
    { categorie: 'coude', ecarts: [[0, 0], [1, 0], [1, 1]] },
    { categorie: 'coude', ecarts: [[0, 1], [1, 0], [1, 1]] },
  ],
};

/**
 * Les formes admises pour une taille de bloc, filtrées par ce que les données
 * autorisent. Un triplet dont la catégorie n'est pas dans
 * `CHAMPS.formesTriplet` ne sortira jamais du tirage : retirer 'coude' de la
 * table suffit à n'obtenir que des barres, sans toucher à ce fichier.
 * @param {number} taille
 * @returns {Array<{categorie: string, ecarts: number[][]}>}
 */
function formesAdmises(taille) {
  const toutes = FORMES[taille];
  if (toutes === undefined) {
    throw new Error(`champs : taille de bloc ${taille} sans forme connue`);
  }
  if (taille < 3) return toutes;
  const retenues = toutes.filter((f) => CHAMPS.formesTriplet.includes(f.categorie));
  if (retenues.length === 0) {
    throw new Error('champs : aucune forme de triplet admise par CHAMPS.formesTriplet');
  }
  return retenues;
}

// ---------------------------------------------------------------------------
// Découpe d'un compte de cases en tailles de blocs
// ---------------------------------------------------------------------------

/**
 * Découpe `cases` cases en blocs dont les tailles sont dans
 * `CHAMPS.taillesBloc`. Le tirage est uniforme parmi les tailles qui TIENNENT
 * encore : à deux cases restantes, un bloc de trois n'est pas proposé, ce qui
 * évite d'avoir à revenir en arrière.
 * @param {{s: number}} rng
 * @param {number} cases
 * @returns {number[]} tailles, dans l'ordre du tirage. Leur somme vaut `cases`.
 */
export function decouperEnBlocs(rng, cases) {
  if (!Number.isInteger(cases) || cases < 0) {
    throw new Error(`champs : nombre de cases invalide ${cases}`);
  }
  const tailles = [];
  let reste = cases;
  while (reste > 0) {
    const possibles = CHAMPS.taillesBloc.filter((t) => t <= reste);
    if (possibles.length === 0) {
      // Impossible tant que 1 est une taille admise ; la garde existe pour le
      // jour où quelqu'un retirerait 1 de la table.
      throw new Error(`champs : ${reste} case(s) que nulle taille de bloc ne couvre`);
    }
    const taille = choisir(rng, possibles);
    tailles.push(taille);
    reste -= taille;
  }
  return tailles;
}

// ---------------------------------------------------------------------------
// Placement
// ---------------------------------------------------------------------------

/** Clé d'une case, pour les ensembles. */
function cle(rangee, colonne) {
  return `${rangee}:${colonne}`;
}

/** Les quatre cases qui touchent celle-ci par un côté. */
function cotes(rangee, colonne) {
  return [
    [rangee - 1, colonne], [rangee + 1, colonne],
    [rangee, colonne - 1], [rangee, colonne + 1],
  ];
}

/**
 * Tente de poser un bloc. Rend les cases posées, ou `null` si aucune position
 * ne convient — l'appelant rejoue alors la tentative entière.
 *
 * Trois conditions, et la troisième est celle qui donne sa lisibilité au
 * terrain : les cases sont dans la zone, elles sont libres, et aucune ne touche
 * PAR UN CÔTÉ une case de la même ressource déjà posée. Sans elle, deux blocs
 * de deux collés formeraient un bloc de quatre à l'œil.
 *
 * @param {{s: number}} rng
 * @param {number} taille
 * @param {string} ressource
 * @param {Map<string, string>} occupees clé de case → ressource déjà posée
 * @param {object} zone bornes rendues par zoneDesChamps()
 * @returns {Array<{rangee: number, colonne: number}>|null}
 */
function poserUnBloc(rng, taille, ressource, occupees, zone) {
  const formes = melanger(rng, [...formesAdmises(taille)]);

  const ancres = [];
  for (let r = zone.premiereRangee; r <= zone.derniereRangee; r++) {
    for (let c = zone.premiereColonne; c <= zone.derniereColonne; c++) {
      ancres.push([r, c]);
    }
  }
  melanger(rng, ancres);

  for (const forme of formes) {
    for (const [ancreR, ancreC] of ancres) {
      const cases = forme.ecarts.map(([dr, dc]) => ({
        rangee: ancreR + dr,
        colonne: ancreC + dc,
      }));

      const tientDansLaZone = cases.every(
        (k) => k.rangee >= zone.premiereRangee && k.rangee <= zone.derniereRangee
          && k.colonne >= zone.premiereColonne && k.colonne <= zone.derniereColonne,
      );
      if (!tientDansLaZone) continue;

      const libre = cases.every((k) => !occupees.has(cle(k.rangee, k.colonne)));
      if (!libre) continue;

      const propres = new Set(cases.map((k) => cle(k.rangee, k.colonne)));
      const colleUnFrere = cases.some((k) => cotes(k.rangee, k.colonne).some(([vr, vc]) => {
        const cv = cle(vr, vc);
        return !propres.has(cv) && occupees.get(cv) === ressource;
      }));
      if (colleUnFrere) continue;

      return cases;
    }
  }
  return null;
}

/**
 * Une tentative complète : découpe les deux comptes en blocs et les pose tous,
 * les plus gros d'abord. Rend `null` dès qu'un bloc ne trouve pas de place —
 * une tentative se rejoue en entier, jamais à moitié.
 * @returns {Array<{rangee: number, colonne: number, ressource: string}>|null}
 */
function uneTentative(rng, repartition, zone) {
  const blocs = [];
  for (const ressource of ['quartz', 'scorie']) {
    for (const taille of decouperEnBlocs(rng, repartition[ressource])) {
      blocs.push({ taille, ressource });
    }
  }
  // LES GROS D'ABORD, et c'est mesuré, pas supposé. À douze cases sur
  // quarante-deux, l'ordre ne change RIEN : les deux stratégies réussissent du
  // premier coup partout. Il ne se voit qu'en saturant la zone — et alors il
  // décide de tout :
  //
  //   cases     gros d'abord              petits d'abord
  //   24/42     max 2, moy 1,00, 0 échec  max  6, moy  1,36, 0 échec
  //   28/42     max 4, moy 1,13, 0 échec  max 37, moy  5,74, 0 échec
  //   30/42     max 9, moy 1,60, 0 échec  max 64, moy 19,76, 139 ÉCHECS
  //   32/42     max 22, moy 3,52, 0 échec max 64, moy 31,41, 1 269 ÉCHECS
  //
  // (1 800 positions par ligne.) Un test qui inverserait cet ordre ne tomberait
  // donc pas aux valeurs actuelles, et il a raison de ne pas tomber : ce n'est
  // pas un défaut, c'est une marge. Elle est ici pour le jour où les comptes
  // monteront.
  //
  // L'ordre à taille égale est mélangé, sinon tout le quartz se poserait
  // systématiquement avant toute la scorie.
  melanger(rng, blocs);
  blocs.sort((a, b) => b.taille - a.taille);

  const occupees = new Map();
  const posees = [];
  for (const bloc of blocs) {
    const cases = poserUnBloc(rng, bloc.taille, bloc.ressource, occupees, zone);
    if (cases === null) return null;
    for (const k of cases) {
      occupees.set(cle(k.rangee, k.colonne), bloc.ressource);
      posees.push({ rangee: k.rangee, colonne: k.colonne, ressource: bloc.ressource });
    }
  }
  return posees;
}

/**
 * Graine du terrain d'une base, dérivée de sa position sur la carte.
 *
 * Elle mélange les deux coordonnées avant de les combiner : sans ça, (3, 12) et
 * (12, 3) tomberaient sur la même graine, et deux bases symétriques de la carte
 * porteraient le même terrain. Le mélange est celui de `rng.js`, appliqué à
 * chaque coordonnée séparément.
 *
 * @param {number} rangeeCarte
 * @param {number} colonneCarte
 * @returns {number} entier 32 bits non signé.
 */
export function graineDePosition(rangeeCarte, colonneCarte) {
  if (!Number.isInteger(rangeeCarte) || !Number.isInteger(colonneCarte)) {
    throw new Error(
      `champs : position non entière (${rangeeCarte}, ${colonneCarte})`,
    );
  }
  let h = 0x811c9dc5;
  for (const v of [rangeeCarte, colonneCarte]) {
    h = Math.imul(h ^ (v & 0xffff), 0x01000193) >>> 0;
    h = Math.imul(h ^ ((v >>> 16) & 0xffff), 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Les champs de la base située à cette position de la carte.
 *
 * Rend TOUJOURS le même terrain pour la même position. La répartition
 * quartz/scorie est tirée parmi celles de `CHAMPS.repartitions`, puis les
 * douze cases sont posées en blocs de une à trois cases contiguës.
 *
 * @param {number} rangeeCarte
 * @param {number} colonneCarte
 * @returns {{ repartition: {quartz: number, scorie: number},
 *   cases: Array<{rangee: number, colonne: number, ressource: string}>,
 *   tentatives: number }}
 *   `cases` est triée par rangée puis colonne — l'ordre du tirage ne doit
 *   transparaître nulle part, sinon deux implémentations qui posent les mêmes
 *   cases dans un ordre différent seraient déclarées divergentes à tort.
 */
export function champsDeLaBase(rangeeCarte, colonneCarte) {
  const graine = graineDePosition(rangeeCarte, colonneCarte);
  const zone = zoneDesChamps();

  const rngRepartition = creerRng(graine);
  const repartition = choisir(rngRepartition, CHAMPS.repartitions);
  if (repartition.quartz + repartition.scorie !== CHAMPS.total) {
    throw new Error(
      `champs : répartition ${repartition.quartz}/${repartition.scorie} ne somme pas à ${CHAMPS.total}`,
    );
  }

  for (let n = 1; n <= CHAMPS.tentativesMax; n++) {
    // Un flux propre par tentative, dérivé de la graine et du numéro : une
    // tentative ratée ne laisse aucune trace sur la suivante, et le résultat
    // reste fonction de la seule position.
    const rng = creerRng((graine ^ Math.imul(n, 0x9e3779b1)) >>> 0);
    const posees = uneTentative(rng, repartition, zone);
    if (posees !== null) {
      posees.sort((a, b) => (a.rangee - b.rangee) || (a.colonne - b.colonne));
      return { repartition, cases: posees, tentatives: n };
    }
  }

  throw new Error(
    `champs : aucun terrain trouvé en ${CHAMPS.tentativesMax} tentatives `
      + `pour la position (${rangeeCarte}, ${colonneCarte})`,
  );
}

/**
 * La case (rangee, colonne) de la base porte-t-elle un champ, et lequel ?
 * @param {{cases: Array<{rangee: number, colonne: number, ressource: string}>}} champs
 * @param {number} rangee
 * @param {number} colonne
 * @returns {string|null} la ressource, ou null si la case est nue.
 */
export function ressourceDeLaCase(champs, rangee, colonne) {
  const trouvee = champs.cases.find((k) => k.rangee === rangee && k.colonne === colonne);
  return trouvee === undefined ? null : trouvee.ressource;
}

/**
 * Regroupe les cases d'un terrain en blocs : composantes connexes PAR LES
 * CÔTÉS, à ressource égale. C'est la lecture inverse du tirage, et elle sert à
 * vérifier depuis l'extérieur qu'aucun bloc ne dépasse trois cases — un test
 * qui recompterait les blocs à partir du tirage lui-même ne prouverait rien.
 * @param {{cases: Array<{rangee: number, colonne: number, ressource: string}>}} champs
 * @returns {Array<{ressource: string, cases: Array<{rangee: number, colonne: number}>}>}
 */
export function blocsDuTerrain(champs) {
  const parCle = new Map();
  for (const k of champs.cases) parCle.set(cle(k.rangee, k.colonne), k);

  const vues = new Set();
  const blocs = [];
  for (const depart of champs.cases) {
    const cleDepart = cle(depart.rangee, depart.colonne);
    if (vues.has(cleDepart)) continue;

    const bloc = [];
    const aVoir = [depart];
    vues.add(cleDepart);
    while (aVoir.length > 0) {
      const k = aVoir.pop();
      bloc.push({ rangee: k.rangee, colonne: k.colonne });
      for (const [vr, vc] of cotes(k.rangee, k.colonne)) {
        const cv = cle(vr, vc);
        const voisin = parCle.get(cv);
        if (voisin !== undefined && !vues.has(cv) && voisin.ressource === depart.ressource) {
          vues.add(cv);
          aVoir.push(voisin);
        }
      }
    }
    bloc.sort((a, b) => (a.rangee - b.rangee) || (a.colonne - b.colonne));
    blocs.push({ ressource: depart.ressource, cases: bloc });
  }
  return blocs;
}

/**
 * Catégorie géométrique d'un bloc de trois : 'droit' si ses trois cases
 * partagent une rangée ou une colonne, 'coude' sinon. Rend 'unique' pour les
 * tailles 1 et 2, qui n'ont qu'une forme chacune à rotation près.
 * @param {Array<{rangee: number, colonne: number}>} cases
 * @returns {string}
 */
export function categorieDuBloc(cases) {
  if (cases.length < 3) return 'unique';
  if (cases.length > 3) {
    throw new Error(`champs : bloc de ${cases.length} cases, 3 au plus attendu`);
  }
  const memeRangee = cases.every((k) => k.rangee === cases[0].rangee);
  const memeColonne = cases.every((k) => k.colonne === cases[0].colonne);
  return memeRangee || memeColonne ? 'droit' : 'coude';
}
