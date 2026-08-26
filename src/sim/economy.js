// Moteur économique de Chantier — deux étages :
//
//   1. Les COURBES (flottants) : coût et production relatifs par niveau,
//      coût croisé quartz/scorie, poids d'adjacence. Pures, sans état.
//   2. Le TICK (entiers) : flux continu, saturation du stockage, colis.
//      Toute l'arithmétique par tick est ENTIÈRE (milli-unités), condition
//      nécessaire pour que le rattrapage analytique reproduise la simulation
//      tick par tick au bit près (test 11).
//
// ⚠ AUCUN DÉBIT N'EST JAMAIS ARRONDI PAR TICK. Un débit se range PAR HEURE,
// et chaque bâtiment porte un RÉSIDU : l'erreur d'arrondi par tick est
// exactement nulle, à n'importe quelle fréquence de tick. Voir le §« Débit
// horaire et résidu » plus bas.
//
// Aucune valeur de calibrage en dur : tout vient de data/params.js, reçu en
// argument. Aucune dépendance navigateur.

import { TICK_MS, TICKS_PAR_HEURE } from './clock.js';

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

// ---------------------------------------------------------------------------
// Débit horaire et résidu — pourquoi le débit n'est PAS rangé par tick
// ---------------------------------------------------------------------------
//
// Le moteur rangeait autrefois un débit en milli-unités PAR TICK, arrondi une
// fois par couple (niveau, voisins). L'arrondi était cohérent — tick et
// rattrapage lisaient le même entier — mais il était GROS : à 10 Hz, la
// production du niveau 3 tombait sur 37,26 milli/tick, et arrondir coûtait
// 0,71 % de production, en permanence, pour toujours.
//
// Le débit se range donc PAR HEURE, entier, et chaque bâtiment porte un
// résidu. Par tick :
//
//   residu += debitMilliParHeure
//   gain    = Math.floor(residu / TICKS_PAR_HEURE)
//   residu  = residu % TICKS_PAR_HEURE
//
// L'erreur par tick est EXACTEMENT NULLE, à n'importe quelle fréquence : le
// résidu est le reste exact de la somme cumulée. Le seul arrondi qui subsiste
// est celui du débit horaire lui-même, fait une fois par niveau — nul aux
// niveaux 1 et 2, et sous le millionième de pour cent au-delà du niveau 4.
//
// ⚠ LE RÉSIDU AVANCE MÊME STOCKAGE PLEIN, exactement comme le débit avançait
// avant lui : ce qui déborde est perdu, le compteur ne s'arrête pas. C'est ce
// qui rend le rattrapage analytique exact — voir sa démonstration.

/**
 * Débit d'un bâtiment en milli-unités PAR HEURE, adjacence comprise.
 * L'arrondi se fait UNE fois, ici, par couple (niveau, voisins) : le résultat
 * est un entier, et tout ce qui en découle (tick et rattrapage) est exact.
 * Le bonus d'adjacence est arrondi séparément pour rester strictement
 * constant d'un niveau à l'autre.
 * @param {{ type: string, niveau: number, voisinsQualifiants: number }} batiment
 * @param {object} params
 * @returns {number} milli-unités par heure (entier ≥ 0)
 */
export function debitMilliParHeure(batiment, params) {
  const base = params.fluxContinu.baseMilliParHeureNiveau1;
  const continu = Math.round(productionRelative(batiment.niveau, params) * base);
  const adjacence = Math.round(bonusAdjacenceRelatif(batiment.voisinsQualifiants, params) * base);
  return continu + adjacence;
}

/**
 * Débit maximal qu'un bâtiment peut porter sans que le rattrapage analytique
 * ne quitte les entiers exacts. Le produit le plus lourd du rattrapage est
 * `residu + (nbTicks mod TICKS_PAR_HEURE) × debit`, borné par
 * TICKS_PAR_HEURE × (debit + 1) : le seuil s'en déduit, il ne se devine pas.
 *
 * Ordre de grandeur : 2,5 × 10¹¹ milli/h à 10 Hz, soit 250 millions d'unités
 * par heure. Le débit le plus lourd du jeu — le collecteur de niveau 50 de
 * data/base.js, 1,345 × 10⁷ unités/h — reste dessous, mais d'un facteur 19
 * SEULEMENT. La marge est réelle et n'est pas confortable : c'est pour ça que
 * le rattrapage lève au lieu de dériver en silence. Toute donnée qui monterait
 * un débit d'un facteur 20 doit faire descendre le tick, pas franchir le seuil.
 */
export const DEBIT_MILLI_PAR_HEURE_MAX =
  Math.floor(Number.MAX_SAFE_INTEGER / TICKS_PAR_HEURE) - 1;

/**
 * Avance l'économie d'exactement UN tick :
 *   - chaque bâtiment fait avancer son résidu de son débit horaire, en verse
 *     la part entière dans le stock de sa ressource, saturé à la capacité de
 *     stockage (le stock s'arrête plein, le résidu continue d'avancer) ;
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

    const cumul = b.residuFlux + debitMilliParHeure(b, params);
    const gain = Math.floor(cumul / TICKS_PAR_HEURE);
    b.residuFlux = cumul - gain * TICKS_PAR_HEURE;

    const stock = etat.ressources[cle] + gain;
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
 * Démonstration des trois formules :
 *   - Résidu et gain : le résidu est le reste exact de la somme cumulée, donc
 *     après N ticks le cumul vaut `residu + N × debit`, le gain total sa part
 *     entière et le résidu final son reste. On ne calcule PAS `N × debit` :
 *     avec N = q × TICKS_PAR_HEURE + r, le reste ne dépend que de r
 *     (arithmétique modulaire) et la part entière vaut q × debit + le report
 *     de la fraction restante. Les deux produits restent ainsi bornés.
 *   - Stock : par tick, chaque ajout est borné par la même capacité ;
 *     min(cap, min(cap, x+a)+b) = min(cap, x+a+b), donc la séquence entière
 *     vaut min(cap, stock + gainTotal) en arithmétique entière. On borne le
 *     nombre d'heures pleines à ce qu'il faut pour saturer : au-delà le stock
 *     vaut cap de toute façon, et le produit n'a plus à être exact — il n'a
 *     donc plus le droit d'être grand.
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

  const heuresPleines = Math.floor(nbTicks / TICKS_PAR_HEURE);
  const ticksRestants = nbTicks - heuresPleines * TICKS_PAR_HEURE;

  for (const b of etat.batiments) {
    const def = params.batiments[b.type];
    const cle = def.ressource + 'Milli';

    const debit = debitMilliParHeure(b, params);
    if (debit > DEBIT_MILLI_PAR_HEURE_MAX) {
      throw new Error(
        `economie : débit ${debit} milli/h au-dessus du seuil exact ` +
          `${DEBIT_MILLI_PAR_HEURE_MAX} — le rattrapage quitterait les entiers`,
      );
    }

    // Reste et report de la fraction d'heure : bornés par TICKS_PAR_HEURE × (debit + 1).
    const cumulPartiel = b.residuFlux + ticksRestants * debit;
    const reportPartiel = Math.floor(cumulPartiel / TICKS_PAR_HEURE);
    b.residuFlux = cumulPartiel - reportPartiel * TICKS_PAR_HEURE;

    // Heures pleines, bornées à ce qu'il faut pour saturer : le produit reste
    // sous cap + debit, quel que soit le temps passé hors ligne.
    const stockDepart = etat.ressources[cle];
    const manque = cap > stockDepart ? cap - stockDepart : 0;
    const heuresUtiles =
      debit === 0 ? 0 : Math.min(heuresPleines, Math.ceil(manque / debit));
    const stock = stockDepart + heuresUtiles * debit + reportPartiel;
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
