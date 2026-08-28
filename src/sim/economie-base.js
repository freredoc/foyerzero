// Moteur économique de la base du joueur — le TICK.
//
// C'est la dernière pièce : `sim/champs.js` donne le terrain, `sim/disposition.js`
// donne les débits ressource par ressource, et celui-ci fait passer le temps.
//
// ⚠ CE MODULE A REMPLACÉ `sim/economy.js`, qui n'existe plus. L'ancien portait
// le modèle du lot 1 — deux types de bâtiments, courbe hyperbolique, adjacence
// anonyme, une capacité de stockage globale. `sim/state.js` est passé sur
// celui-ci le 26/08 (lot BASCULE, SAVE_VERSION 4), et l'ancien a été retiré le
// 27/08 (lot ORPHELIN) avec `data/params.js` et `test/economy.test.js`.
//
// CE QUI A ÉTÉ REPRIS DE L'ANCIEN, ET QUI VALAIT D'ÊTRE REPRIS
//
// Toute l'arithmétique par tick est ENTIÈRE, en milli-unités, et le débit se
// range PAR HEURE — jamais par tick. Chaque bâtiment porte un RÉSIDU par
// ressource :
//
//   residu += debitMilliParHeure
//   gain    = Math.floor(residu / TICKS_PAR_HEURE)
//   residu  = residu % TICKS_PAR_HEURE
//
// L'erreur d'arrondi par tick est alors EXACTEMENT NULLE, à n'importe quelle
// fréquence — le résidu est le reste exact de la somme cumulée. Ranger un débit
// par tick coûtait 0,71 % de production en permanence au niveau 3. C'est la
// leçon du lot 1 et elle ne se réapprend pas.
//
// ⚠ LE RÉSIDU AVANCE MÊME STOCKAGE PLEIN. Ce qui déborde est perdu, le compteur
// ne s'arrête pas. C'est ce qui rend le rattrapage analytique exact.
//
// CE QUI CHANGE, ET QUI N'EST PAS UN DÉTAIL
//
//   - TROIS ressources au lieu de deux, électricité comprise.
//   - UN BÂTIMENT PEUT PRODUIRE DANS DEUX RESSOURCES À LA FOIS. La raffinerie
//     entourée de collecteurs mêlés fait du quartz ET de la scorie (arbitré le
//     26/08). Le résidu est donc par (bâtiment, ressource), pas par bâtiment :
//     un résidu unique mélangerait deux flux et ferait dériver les deux.
//   - LA CAPACITÉ N'EST PLUS UNE CONSTANTE. Elle est la somme des bâtiments de
//     stockage posés, et elle change quand on en pose un ou qu'on le monte.
//   - Plus de colis. Abandonnés le 25/08, reconfirmés le 26.

import { TICKS_PAR_HEURE } from './clock.js';
import {
  BASE_BATIMENTS, PRODUCTEUR_APPARIE, capaciteDuNiveau, stockagePropreDuNiveau,
} from '../data/base.js';
import { productionParRessource } from './disposition.js';

/** Les trois ressources du jeu, dans un ordre stable. */
export const RESSOURCES = ['quartz', 'scorie', 'electricite'];

// ---------------------------------------------------------------------------
// Le seuil d'exactitude — recalculé, parce que l'ancien ne valait plus
// ---------------------------------------------------------------------------
//
// Le rattrapage analytique reste dans les entiers exacts tant qu'aucun débit ne
// dépasse ce seuil. La borne est celle qu'avait déjà l'ancien `sim/economy.js`
// (retiré le 27/08) : le produit le plus lourd est `residu + (nbTicks mod TICKS_PAR_HEURE) × debit`,
// borné par TICKS_PAR_HEURE × (debit + 1).
//
// ⚠ MAIS LA MARGE, ELLE, N'EST PLUS CELLE QU'ON CROYAIT. `CLAUDE.md` annonçait
// un facteur 19, mesuré sur le collecteur de niveau 50 SEUL — 13 452 465 u/h.
// Le voisinage n'était pas encore dans le modèle. Mesuré le 26/08, voisinage
// compris, le pire cas réel du jeu est :
//
//   collecteur niveau 50 + 8 raffineries   45 738 385 u/h   ← le pire
//   centrale   niveau 50 + 8 accumulateurs 39 012 153 u/h
//   centrale   niveau 50 + 8 champs scorie 33 631 161 u/h
//   raffinerie niveau 50 + 8 collecteurs   32 285 920 u/h
//   accumulateur niv 50 + 8 centrales      21 523 944 u/h
//   collecteur niveau 50 seul              13 452 465 u/h   ← l'ancien calcul
//
// Soit 4,57 × 10¹⁰ milli/h contre un seuil de 2,50 × 10¹¹ : **facteur 5,47**,
// et non 19. La marge reste réelle mais elle a été divisée par plus de trois
// sans que personne ne s'en aperçoive, simplement parce que le modèle a gagné
// le voisinage. Une donnée qui multiplierait encore les débits par cinq devrait
// faire DESCENDRE la fréquence du tick, pas franchir le seuil.
export const DEBIT_MILLI_PAR_HEURE_MAX =
  Math.floor(Number.MAX_SAFE_INTEGER / TICKS_PAR_HEURE) - 1;

/**
 * Le plafond au-delà duquel une capacité cesserait d'être un entier exact.
 *
 * ⚠⚠ IL EST DEVENU MORDANT LE 28/08, ET IL NE L'ÉTAIT PAS AVANT. La courbe de
 * stockage arbitrée ce jour-là ( × 2 par niveau jusqu'au dixième, puis
 * décroissance linéaire jusqu'à × 1,333) porte une raffinerie de niveau 50 à
 * 4,75 × 10¹² unités, soit 4,75 × 10¹⁵ milli : **53 % de l'entier sûr à elle
 * seule**, et DEUX raffineries de niveau 50 le dépassent. L'ancienne courbe
 * laissait 2 815 fois de marge ; celle-ci n'en laisse plus.
 *
 * ⚠ ON ÉCRÊTE, ON NE LÈVE PAS — et c'est le contraire du choix fait pour
 * `DEBIT_MILLI_PAR_HEURE_MAX`. La différence est que là-bas un dépassement
 * FAUSSE le rattrapage en silence, alors qu'ici il ne fausse rien : écrêter une
 * capacité ne fait que borner ce que le joueur peut stocker, et toutes les
 * opérations restent exactes. Lever ferait planter la partie d'un joueur qui a
 * simplement bien joué, ce qui est pire que le mur qu'on lui pose.
 *
 * ⚠ ET L'ÉCRÊTAGE N'EST PAS SILENCIEUX : la capacité est ce que le bandeau du
 * haut affiche. Un joueur qui l'atteint la voit cesser de monter, au même titre
 * qu'un stock saturé.
 */
export const CAPACITE_MILLI_MAX = Number.MAX_SAFE_INTEGER;

// ---------------------------------------------------------------------------
// Capacités
// ---------------------------------------------------------------------------

/**
 * Capacité de stockage de la base, par ressource, en MILLI-unités.
 *
 * Elle n'est pas une constante : c'est la somme des bâtiments de stockage
 * posés. Poser une raffinerie ou la monter d'un niveau l'augmente, en perdre
 * une la fait baisser — et un stock qui se retrouve au-dessus de la nouvelle
 * capacité est GELÉ, pas amputé : il ne peut plus monter, mais il reste au
 * joueur, qui le dépense. Arbitré le 26/08 — « rien ne se retire en silence »
 * vaut aussi pour un stock.
 *
 * ⚠ LA RAFFINERIE COMPTE POUR CHAQUE RESSOURCE, PAS UNE SEULE FOIS. Elle
 * stocke le quartz ET la scorie, chacun jusqu'à son plafond (arbitré le 26/08,
 * `capaciteParRessource`). Une raffinerie de niveau 1 apporte donc 2 880 de
 * quartz et 2 880 de scorie — 5 760 en tout, mais qui ne se transvasent pas.
 *
 * @param {Array<{id: string, niveau: number}>} disposition
 * @returns {{quartz: number, scorie: number, electricite: number}}
 */
export function capacitesMilli(disposition) {
  if (!Array.isArray(disposition)) {
    throw new TypeError('economie-base : une liste est attendue');
  }
  const caps = { quartz: 0, scorie: 0, electricite: 0 };

  for (const b of disposition) {
    const def = BASE_BATIMENTS[b.id];
    if (def === undefined) continue;

    // ⚠ LE STOCKAGE PROPRE EST UN CANAL À PART, et il se compte AVANT le
    // filtre de rôle. Le Chantier de construction en porte un — 50 · 50 · 40 au
    // niveau 1, arbitré le 27/08 — alors qu'il est de rôle `central` : sans
    // lui, une base neuve n'avait aucune capacité et ne pouvait rien
    // accumuler, jamais. Le champ est générique : n'importe quel bâtiment
    // pourra en porter un.
    //
    // ⚠ IL SUIT LE NIVEAU DEPUIS LE 27/08 AU SOIR, et c'est pour ça qu'on passe
    // par `stockagePropreDuNiveau` au lieu de lire le champ. Lire
    // `def.stockagePropre` directement, comme faisait la version précédente,
    // c'est lire le niveau 1 en croyant lire le niveau courant — une poche qui
    // resterait à 50 pendant que tout le reste monte en 1,25.
    if (def.stockagePropre) {
      const niveauPoche = Number.isInteger(b.niveau) && b.niveau >= 1 ? b.niveau : 1;
      const propre = stockagePropreDuNiveau(b.id, niveauPoche);
      for (const r of RESSOURCES) {
        if (propre[r]) caps[r] += propre[r] * 1000;
      }
    }

    if (def.role !== 'stockage') continue;
    if (!Number.isInteger(b.niveau) || b.niveau < 1) continue;
    // `PRODUCTEUR_APPARIE` porte les seuls bâtiments de stockage, et
    // `capaciteDuNiveau` lève sur tout le reste : passer par le rôle et par
    // cette table, c'est ne pas réécrire ici la liste des deux.
    if (!Object.prototype.hasOwnProperty.call(PRODUCTEUR_APPARIE, b.id)) continue;

    const capacite = capaciteDuNiveau(b.id, b.niveau) * 1000;
    if (def.ressource === 'quartzEtScorie') {
      caps.quartz += capacite;
      caps.scorie += capacite;
    } else if (def.ressource === 'electricite') {
      caps.electricite += capacite;
    }
  }
  // ⚠ ÉCRÊTAGE, VOIR `CAPACITE_MILLI_MAX`. Il ne mord qu'au sommet de la courbe
  // arbitrée le 28/08 — deux raffineries de niveau 50 — et il garantit que
  // toutes les comparaisons `stock >= capacite` du tick restent des
  // comparaisons d'entiers exacts.
  for (const r of RESSOURCES) {
    if (caps[r] > CAPACITE_MILLI_MAX) caps[r] = CAPACITE_MILLI_MAX;
  }
  return caps;
}

// ---------------------------------------------------------------------------
// Débits
// ---------------------------------------------------------------------------

/**
 * Débits de chaque bâtiment, par ressource, en MILLI-unités par heure.
 *
 * On passe par `productionParRessource` de `sim/disposition.js` — le calcul du
 * voisinage et de l'attribution vit là-bas, et il n'a pas à être refait ici.
 * La conversion en milli est le SEUL geste de ce module.
 *
 * ⚠ La clé `indetermine` que `productionParRessource` peut rendre est IGNORÉE.
 * Elle signale un voisin mal posé, pas une production : la verser quelque part
 * reviendrait à inventer une ressource. Sur une disposition valide elle
 * n'apparaît jamais — `problemesDeDisposition` est le bon endroit pour s'en
 * apercevoir, pas ici.
 *
 * @returns {Array<Record<string, number>>} un objet par bâtiment, dans l'ordre.
 */
export function debitsMilliParHeure(disposition, champs) {
  return disposition.map((_, index) => {
    const brut = productionParRessource(disposition, champs, index);
    const milli = {};
    for (const r of RESSOURCES) {
      if (brut[r] === undefined || brut[r] === 0) continue;
      const v = brut[r] * 1000;
      if (v > DEBIT_MILLI_PAR_HEURE_MAX) {
        throw new Error(
          `economie-base : débit ${v} milli/h au-dessus du seuil exact `
            + `${DEBIT_MILLI_PAR_HEURE_MAX} — le rattrapage quitterait les entiers`,
        );
      }
      milli[r] = v;
    }
    return milli;
  });
}

// ---------------------------------------------------------------------------
// État
// ---------------------------------------------------------------------------

/**
 * Crée l'état économique d'une base : stocks à zéro, un résidu par bâtiment.
 *
 * Le résidu est un objet par ressource et non un nombre, parce qu'un bâtiment
 * peut produire dans deux ressources à la fois. Un résidu unique les
 * mélangerait, et les deux flux dériveraient — invisiblement, puisque le total
 * resterait juste.
 *
 * ⚠ LES TROIS RESSOURCES SONT POSÉES D'EMBLÉE, MÊME POUR UN CHANTIER QUI N'EN
 * PRODUIT AUCUNE. Ça a l'air gaspilleur ; ça ne l'est pas. Avec des clés
 * créées à la demande, un rattrapage de ZÉRO tick écrivait `{quartz: 0}` là où
 * la boucle de ticks laissait `{}` — mêmes valeurs, formes différentes. Mesuré
 * le 26/08 : 40 écarts sur 320 cas comparés, tous à `nbTicks = 0`, tous
 * invisibles sur les stocks. Une comparaison de sauvegarde aurait fini par
 * tomber dessus sans qu'on comprenne pourquoi.
 *
 * @param {Array<object>} disposition
 * @returns {{ressources: Record<string, number>, residus: Array<Record<string, number>>}}
 */
export function creerEtatEconomie(disposition) {
  if (!Array.isArray(disposition)) {
    throw new TypeError('economie-base : une liste est attendue');
  }
  const ressources = {};
  for (const r of RESSOURCES) ressources[r] = 0;
  return {
    ressources,
    residus: disposition.map(() => {
      const residu = {};
      for (const r of RESSOURCES) residu[r] = 0;
      return residu;
    }),
  };
}

/**
 * Ce que le joueur trouve dans sa poche à la fondation.
 *
 * ⚠ CE N'EST PAS UN ZÉRO DÉGUISÉ, C'EST UNE AMORCE. Arbitré par Ethan le
 * 27/08 : une base neuve ne produit RIEN — ni collecteur, ni centrale — donc un
 * départ à zéro laisse le joueur devant un écran où aucune action n'est
 * payable. Le premier collecteur coûte 3 de quartz, la première centrale 3 : de
 * quoi poser les deux et voir la boucle démarrer.
 *
 * ⚠ CES TROIS NOMBRES RESTENT SOUS LA POCHE DU CHANTIER — 50 · 50 · 40 au
 * niveau 1. Un stock initial au-dessus du plafond naîtrait GELÉ : le moteur ne
 * rabat pas un excédent, il l'immobilise, et le joueur verrait un compteur
 * bloqué dès la première image sans comprendre pourquoi. Le test de
 * `state.test.js` le vérifie plutôt que de faire confiance à ces valeurs.
 *
 * ⚠ CE N'EST PAS `creerEtatEconomie` QUI LA SERT, et l'essai inverse a été
 * fait : huit tests sont tombés, dont deux sur les MIGRATIONS. Cette
 * fonction-là construit la FORME d'une économie, et une v0 qu'on migre en
 * repasse par elle — le joueur aurait touché l'amorce une seconde fois, à
 * chaque montée de version. L'amorce appartient à la partie neuve, donc à
 * `creerEtat`, et à elle seule.
 */
export const STOCK_DE_DEPART = { quartz: 30, scorie: 30, electricite: 20 };

/**
 * Vérifie qu'un état a la forme attendue, et le dit clairement sinon.
 */
function verifierEtat(etat, disposition) {
  if (!etat || typeof etat.ressources !== 'object' || !Array.isArray(etat.residus)) {
    throw new TypeError('economie-base : état absent ou malformé');
  }
  if (etat.residus.length !== disposition.length) {
    throw new Error(
      `economie-base : ${etat.residus.length} résidus pour ${disposition.length} bâtiments`,
    );
  }
}

// ---------------------------------------------------------------------------
// Tick
// ---------------------------------------------------------------------------

/**
 * Avance l'économie d'exactement UN tick.
 *
 * Chaque bâtiment fait avancer un résidu par ressource, en verse la part
 * entière dans le stock, saturé à la capacité. Le stock s'arrête plein ; le
 * résidu, lui, continue d'avancer.
 *
 * ⚠ OUI, CAPACITÉS ET DÉBITS SONT RECALCULÉS À CHAQUE TICK, et non, ce n'est
 * pas à corriger — MAIS LE COÛT MONTE VITE AVEC LA TAILLE DE LA BASE, et il
 * faut le savoir. Les deux premières rédactions n'avaient mesuré qu'un seul
 * point, sur huit ou neuf bâtiments, et en tiraient une conclusion générale.
 * Courbe complète, mesurée le 26/08 sur 3 000 ticks par point :
 *
 *    1 bâtiment      2,0 µs/tick      0,020 ms par seconde de jeu
 *    5 bâtiments    27,7 µs/tick      0,277 ms
 *    9 bâtiments    21,1 µs/tick      0,211 ms
 *   20 bâtiments   108,0 µs/tick      1,080 ms
 *   40 bâtiments   280,7 µs/tick      2,807 ms   ← base pleine
 *
 * Une base PLEINE coûte donc **neuf fois** ce que le chiffre cité jusqu'ici
 * laissait croire. 2,8 ms par seconde reste acceptable — moins de trois
 * dixièmes de pour cent d'un cœur — mais la croissance est superlinéaire :
 * `voisinsQualifiants` reconstruit une carte des cases occupées par bâtiment.
 * Si un jour une base dépassait la quarantaine d'emplacements, c'est CETTE
 * courbe qu'il faudrait refaire, pas le chiffre à neuf bâtiments.
 *
 * ⚠ ET ÇA A UNE CONSÉQUENCE SUR LES TESTS, pas seulement sur le jeu. Simuler
 * 72 h tick par tick fait 2,6 millions de ticks : `test/state.test.js` y passait
 * 58 secondes, et la suite entière 74. Les horizons de boucle ont été rabotés à
 * 2 h le 26/08, et les longues absences se testent désormais par COMPOSITION
 * (rattraper deux fois vaut rattraper une fois), qui est en temps constant. Le gain d'un cache serait invisible et le
 * coût, lui, serait une invalidation à tenir à jour à chaque pose, chaque
 * montée de niveau, chaque destruction. C'est exactement le genre de cache qui
 * finit par mentir.
 *
 * Si un appelant a besoin d'avancer de BEAUCOUP de ticks, l'outil n'est pas un
 * cache : c'est `rattrapageEconomieBase`, qui est en O(1) sur le nombre de
 * ticks et rend le même état au bit près.
 *
 * @param {object} etat modifié en place
 * @param {Array<object>} disposition
 * @param {object} champs
 */
export function tickEconomieBase(etat, disposition, champs) {
  verifierEtat(etat, disposition);
  const caps = capacitesMilli(disposition);
  const debits = debitsMilliParHeure(disposition, champs);

  for (let i = 0; i < disposition.length; i++) {
    const residus = etat.residus[i];
    for (const [ressource, debit] of Object.entries(debits[i])) {
      const cumul = residus[ressource] + debit;
      const gain = Math.floor(cumul / TICKS_PAR_HEURE);
      residus[ressource] = cumul - gain * TICKS_PAR_HEURE;

      // ⚠ LE SURPLUS SE GÈLE, IL NE SE RABAT PAS. Arbitré le 26/08. Un stock
      // déjà au-dessus du plafond — une raffinerie détruite en raid — n'est pas
      // amputé : il cesse simplement de monter, et le joueur le dépense. Le
      // plafond effectif est donc `max(cap, stock)`, pas `cap`.
      //
      // La version d'origine rabattait à `cap`, mais SEULEMENT pour les
      // ressources qu'un bâtiment produit encore — la boucle ne parcourt que
      // celles-là. Un stock en trop dans une ressource que plus rien ne produit
      // survivait jusqu'à la prochaine unité produite, puis tombait d'un coup.
      // Ni gelé ni rabattu : les deux à la fois, selon le moment.
      const cap = caps[ressource];
      const actuel = etat.ressources[ressource];
      const plafond = actuel > cap ? actuel : cap;
      const stock = actuel + gain;
      etat.ressources[ressource] = stock > plafond ? plafond : stock;
    }
  }
}

/**
 * Rattrapage analytique : produit en O(bâtiments × ressources) un état
 * STRICTEMENT identique à `nbTicks` appels de `tickEconomieBase`.
 *
 * Les trois arguments, repris de l'ancien `sim/economy.js` (retiré le 27/08)
 * parce qu'ils tiennent toujours :
 *
 *   - RÉSIDU. Il est le reste exact de la somme cumulée, donc après N ticks le
 *     cumul vaut `residu + N × debit`. On ne calcule PAS `N × debit` : avec
 *     N = q × TICKS_PAR_HEURE + r, le reste ne dépend que de r, et la part
 *     entière vaut q × debit plus le report de la fraction restante. Les deux
 *     produits restent ainsi bornés.
 *   - STOCK. Chaque ajout est borné par la même capacité, et
 *     min(cap, min(cap, x+a)+b) = min(cap, x+a+b) : la séquence entière vaut
 *     min(cap, stock + gainTotal). On borne le nombre d'heures pleines à ce
 *     qu'il faut pour saturer — au-delà le stock vaut cap de toute façon, donc
 *     le produit n'a plus à être exact et n'a donc plus le droit d'être grand.
 *
 * ⚠ UNE DIFFÉRENCE AVEC L'ANCIEN, ET ELLE COMPTE. Là-bas chaque bâtiment avait
 * SA ressource, donc son propre plafond à saturer. Ici plusieurs bâtiments
 * versent dans le MÊME stock : le calcul « heures utiles avant saturation » se
 * fait par ressource sur le total des débits, pas bâtiment par bâtiment.
 * Le faire bâtiment par bâtiment donnerait un stock trop bas dès qu'il y a deux
 * producteurs, parce que chacun croirait avoir tout le plafond pour lui.
 *
 * @param {object} etat modifié en place
 * @param {number} nbTicks
 */
export function rattrapageEconomieBase(etat, disposition, champs, nbTicks) {
  verifierEtat(etat, disposition);
  if (!Number.isInteger(nbTicks) || nbTicks < 0) {
    throw new Error(`economie-base : nombre de ticks invalide ${nbTicks}`);
  }
  const caps = capacitesMilli(disposition);
  const debits = debitsMilliParHeure(disposition, champs);

  const heuresPleines = Math.floor(nbTicks / TICKS_PAR_HEURE);
  const ticksRestants = nbTicks - heuresPleines * TICKS_PAR_HEURE;

  // Débit total par ressource : c'est LUI qui décide en combien d'heures le
  // stock sature, pas le débit d'un bâtiment isolé.
  const debitTotal = {};
  for (const r of RESSOURCES) debitTotal[r] = 0;
  for (const d of debits) {
    for (const [r, v] of Object.entries(d)) debitTotal[r] += v;
  }

  for (const ressource of RESSOURCES) {
    const cap = caps[ressource];
    const total = debitTotal[ressource];
    const depart = etat.ressources[ressource];

    // Fraction d'heure : le report se calcule bâtiment par bâtiment, parce que
    // chacun a son propre résidu et que les restes ne s'additionnent pas.
    let reportPartiel = 0;
    for (let i = 0; i < disposition.length; i++) {
      const debit = debits[i][ressource];
      if (debit === undefined) continue;
      const residus = etat.residus[i];
      const cumul = residus[ressource] + ticksRestants * debit;
      const report = Math.floor(cumul / TICKS_PAR_HEURE);
      residus[ressource] = cumul - report * TICKS_PAR_HEURE;
      reportPartiel += report;
    }

    // Même plafond effectif que dans le tick. Quand `depart` dépasse déjà la
    // capacité, `manque` vaut 0, donc `heuresUtiles` vaut 0 et tout ce qui
    // serait produit est rabattu sur `depart` : le stock est gelé, exactement
    // comme dans la boucle. C'est ce qui fait que les deux chemins se
    // rejoignent SANS cas particulier.
    const plafond = depart > cap ? depart : cap;
    const manque = cap > depart ? cap - depart : 0;
    const heuresUtiles = total === 0
      ? 0
      : Math.min(heuresPleines, Math.ceil(manque / total));
    const stock = depart + heuresUtiles * total + reportPartiel;
    etat.ressources[ressource] = stock > plafond ? plafond : stock;
  }
}
