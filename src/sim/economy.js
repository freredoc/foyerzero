// Moteur économique de Chantier — deux étages :
//
//   1. Les COURBES (flottants) : coût et production relatifs par niveau,
//      coût croisé quartz/scorie, poids d'adjacence. Pures, sans état.
//   2. Le TICK (entiers) : flux continu, saturation du stockage, colis.
//      Toute l'arithmétique par tick est ENTIÈRE (milli-unités), condition
//      nécessaire pour que le rattrapage analytique reproduise la simulation
//      tick par tick au bit près (test 11).
//
// Aucune valeur de calibrage en dur : tout vient de data/params.js, reçu en
// argument. Aucune dépendance navigateur.

import { TICK_MS } from './clock.js';

// ---------------------------------------------------------------------------
// Étage 1 — courbes
// ---------------------------------------------------------------------------

/** Vérifie qu'un niveau est un entier ≥ 1. */
function verifierNiveau(n) {
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`economie : niveau invalide ${n}`);
  }
}

/**
 * Ratio de coût appliqué du niveau n vers le niveau n+1.
 * ratio_C(n) = RInf + (R1 − RInf) / n
 * @param {number} n
 * @param {object} params
 * @returns {number}
 */
export function ratioCout(n, params) {
  verifierNiveau(n);
  const { R1, RInf } = params.courbes.cout;
  return RInf + (R1 - RInf) / n;
}

/**
 * Ratio de production appliqué du niveau n vers le niveau n+1.
 * ratio_P(n) = RInf + (R1 − RInf) / n
 * @param {number} n
 * @param {object} params
 * @returns {number}
 */
export function ratioProduction(n, params) {
  verifierNiveau(n);
  const { R1, RInf } = params.courbes.production;
  return RInf + (R1 - RInf) / n;
}

/**
 * Coût relatif C(n), avec C(1) = 1 et C(n+1) = C(n) × ratio_C(n).
 * @param {number} n
 * @param {object} params
 * @returns {number}
 */
export function coutRelatif(n, params) {
  verifierNiveau(n);
  let c = 1;
  for (let k = 1; k < n; k++) c *= ratioCout(k, params);
  return c;
}

/**
 * Production relative P(n), avec P(1) = 1 et P(n+1) = P(n) × ratio_P(n).
 * @param {number} n
 * @param {object} params
 * @returns {number}
 */
export function productionRelative(n, params) {
  verifierNiveau(n);
  let p = 1;
  for (let k = 1; k < n; k++) p *= ratioProduction(k, params);
  return p;
}

/**
 * Facteur de temps de retour moyen : moyenne de ratio_C(n)/ratio_P(n) sur la
 * fenêtre de niveaux définie dans les paramètres (test 6).
 * @param {object} params
 * @returns {number}
 */
export function facteurTempsRetourMoyen(params) {
  const nMax = params.facteurTempsRetour.niveaux;
  let somme = 0;
  for (let n = 1; n <= nMax; n++) {
    somme += ratioCout(n, params) / ratioProduction(n, params);
  }
  return somme / nMax;
}

/**
 * Coût d'un niveau, ventilé quartz/scorie, arrondi à l'entier.
 *
 * Coût croisé : quartz = C(n)·E·ρ/(1+ρ), scorie = C(n)·E/(1+ρ).
 * Plancher d'amorçage : les niveaux 1 à params.plancherAmorcageNiveaux
 * coûtent 100 % quartz, scorie = 0.
 *
 * @param {{ rho: number, echelleCout: number }} batiment
 * @param {number} niveau
 * @param {object} params
 * @returns {{ quartz: number, scorie: number }}
 */
export function coutNiveau(batiment, niveau, params) {
  verifierNiveau(niveau);
  const total = coutRelatif(niveau, params) * batiment.echelleCout;
  if (niveau <= params.plancherAmorcageNiveaux) {
    return { quartz: Math.round(total), scorie: 0 };
  }
  const { rho } = batiment;
  return {
    quartz: Math.round((total * rho) / (1 + rho)),
    scorie: Math.round(total / (1 + rho)),
  };
}

/**
 * Bonus d'adjacence relatif TOTAL pour un nombre de voisins qualifiants :
 * facteur × P(1) par voisin, plafonné à maxVoisins, constant quel que soit le
 * niveau du bâtiment.
 * @param {number} nbVoisins
 * @param {object} params
 * @returns {number}
 */
export function bonusAdjacenceRelatif(nbVoisins, params) {
  const voisins = Math.min(Math.max(0, nbVoisins), params.adjacence.maxVoisins);
  // P(1) = 1 par définition de la courbe relative.
  return voisins * params.adjacence.facteur * productionRelative(1, params);
}

/**
 * Poids relatif de l'adjacence dans la production totale d'un bâtiment :
 * adjacence / (P(niveau) + adjacence). Vaut 50 % au niveau 1 avec 2 voisins,
 * et décroît quand le niveau monte puisque le bonus est constant (test 10).
 * @param {number} niveau
 * @param {number} nbVoisins
 * @param {object} params
 * @returns {number}
 */
export function poidsAdjacence(niveau, nbVoisins, params) {
  const bonus = bonusAdjacenceRelatif(nbVoisins, params);
  return bonus / (productionRelative(niveau, params) + bonus);
}

// ---------------------------------------------------------------------------
// Étage 2 — tick (arithmétique entière)
// ---------------------------------------------------------------------------

/** Intervalle entre deux colis, en ticks (entier garanti par construction). */
export function intervalleColisTicks(params) {
  const ticks = params.colis.intervalleMs / TICK_MS;
  if (!Number.isInteger(ticks)) {
    throw new Error(`economie : intervalle de colis non multiple du tick (${ticks})`);
  }
  return ticks;
}

/**
 * Flux continu d'un bâtiment en milli-unités par tick, adjacence comprise.
 * L'arrondi se fait UNE fois, ici, par couple (niveau, voisins) : le résultat
 * est un entier, et tout ce qui en découle (tick et rattrapage) est exact.
 * Le bonus d'adjacence est arrondi séparément pour rester strictement
 * constant d'un niveau à l'autre.
 * @param {{ type: string, niveau: number, voisinsQualifiants: number }} batiment
 * @param {object} params
 * @returns {number} milli-unités par tick (entier ≥ 0)
 */
export function fluxMilliParTick(batiment, params) {
  const base = params.fluxContinu.baseMilliParTickNiveau1;
  const continu = Math.round(productionRelative(batiment.niveau, params) * base);
  const adjacence = Math.round(bonusAdjacenceRelatif(batiment.voisinsQualifiants, params) * base);
  return continu + adjacence;
}

/**
 * Avance l'économie d'exactement UN tick :
 *   - chaque bâtiment verse son flux continu dans le stock de sa ressource,
 *     saturé à la capacité de stockage (le flux s'arrête stockage plein) ;
 *   - chaque bâtiment fait progresser son colis en cours, sauf si le maximum
 *     de colis en attente est atteint (arrêt complet de la chaîne).
 * @param {object} etat État de jeu (voir sim/state.js).
 * @param {object} params
 */
export function tickEconomie(etat, params) {
  const cap = params.stockage.capaciteMilli;
  const intervalle = intervalleColisTicks(params);
  const maxColis = params.colis.maxEnAttente;

  for (const b of etat.batiments) {
    const def = params.batiments[b.type];
    const cle = def.ressource + 'Milli';
    const stock = etat.ressources[cle] + fluxMilliParTick(b, params);
    etat.ressources[cle] = stock > cap ? cap : stock;

    if (b.colis.enAttente < maxColis) {
      b.colis.progresTicks += 1;
      if (b.colis.progresTicks >= intervalle) {
        b.colis.enAttente += 1;
        b.colis.progresTicks = 0;
      }
    }
  }
}

/**
 * Rattrapage analytique : produit en O(nb bâtiments) un état STRICTEMENT
 * identique à nbTicks exécutions de tickEconomie (test 11).
 *
 * Démonstration des deux formules :
 *   - Stock : par tick, chaque ajout est borné par la même capacité ;
 *     min(cap, min(cap, x+a)+b) = min(cap, x+a+b), donc la séquence entière
 *     vaut min(cap, stock + fluxTotal × nbTicks) en arithmétique entière.
 *   - Colis : tant que enAttente < max, le progrès total est progres + nbTicks ;
 *     chaque tranche d'`intervalle` produit un colis et remet le progrès à
 *     zéro ; la chaîne s'arrête dès que le maximum est atteint, progrès figé
 *     à zéro (il venait d'être remis à zéro par le colis qui a atteint le max).
 * @param {object} etat État de jeu, modifié en place.
 * @param {number} nbTicks
 * @param {object} params
 */
export function rattrapageEconomie(etat, nbTicks, params) {
  if (!Number.isInteger(nbTicks) || nbTicks < 0) {
    throw new Error(`economie : rattrapage sur un nombre de ticks invalide ${nbTicks}`);
  }
  const cap = params.stockage.capaciteMilli;
  const intervalle = intervalleColisTicks(params);
  const maxColis = params.colis.maxEnAttente;

  for (const b of etat.batiments) {
    const def = params.batiments[b.type];
    const cle = def.ressource + 'Milli';
    const stock = etat.ressources[cle] + fluxMilliParTick(b, params) * nbTicks;
    etat.ressources[cle] = stock > cap ? cap : stock;

    if (b.colis.enAttente < maxColis) {
      const progresTotal = b.colis.progresTicks + nbTicks;
      const produits = Math.floor(progresTotal / intervalle);
      if (produits >= maxColis - b.colis.enAttente) {
        b.colis.enAttente = maxColis;
        b.colis.progresTicks = 0;
      } else {
        b.colis.enAttente += produits;
        b.colis.progresTicks = progresTotal - produits * intervalle;
      }
    }
  }
}
