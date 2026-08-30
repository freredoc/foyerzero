// L'Arsenal — la composition d'armée du joueur, lot 5A.
//
// Module PUR : il n'importe ni le DOM ni le canvas, et son état est un objet
// sérialisable. C'est ce qui le rend testable sous node --test, et ce qui
// permettra de le sauvegarder plus tard sans y toucher.
//
// L'INVARIANT DU LOT. La grille de l'Arsenal fait 4 × 9 et ses colonnes SONT
// celles du champ de bataille : aucune unité ne change jamais de colonne
// pendant un raid — c'est vrai depuis le lot 2A et un test le vérifie sur
// 300 ticks. La case où le joueur pose un Perceurs EST le couloir qu'il
// empruntera. La position dans l'éditeur n'est pas une représentation de la
// décision tactique : elle en est la totalité.
//
// ORDRE DES VAGUES. La rangée du HAUT de l'Arsenal est la vague 1, celle qui
// part la première ; la rangée du BAS est la vague 4. La file avance vers le
// haut, comme tout le reste du jeu. En interne, `cases[0]` est donc la rangée
// du haut et devient `vagues[0]`.

import { GRILLE, UNITES } from '../data/combat.js';
import { POINTS_ARMEE, EMPLACEMENTS_ASSAUT } from '../data/sites.js';
import { NIVEAU } from '../data/niveaux.js';

/** 4 vagues de 9 colonnes, alignées sur la largeur du champ. */
export const NB_VAGUES = EMPLACEMENTS_ASSAUT.vagues;
export const NB_COLONNES = EMPLACEMENTS_ASSAUT.parVague;

/**
 * Emplacements totaux : 36.
 *
 * ⚠ CONTRAINTE STRUCTURELLE, consignée sans être corrigée. À partir du niveau
 * 32, les 36 emplacements plafonnent l'armée AVANT le budget — 36 × 5 = 180
 * points, quand le budget en vaut 20 + 5 × 32 = 180 puis davantage. Au-delà, un
 * joueur ne peut plus dépenser tout son budget d'armée en un seul raid. La spec
 * ne mentionne pas cette borne.
 */
export const NB_EMPLACEMENTS = NB_VAGUES * NB_COLONNES;

function verifierNiveau(niveau) {
  if (!Number.isInteger(niveau) || niveau < 1 || niveau > NIVEAU.plafond) {
    throw new Error(`arsenal : niveau ${niveau} hors de 1…${NIVEAU.plafond}`);
  }
  return niveau;
}

function verifierCase(vague, colonne) {
  if (!Number.isInteger(vague) || vague < 1 || vague > NB_VAGUES) {
    throw new Error(`arsenal : vague ${vague} hors de 1…${NB_VAGUES}`);
  }
  if (!Number.isInteger(colonne) || colonne < 1 || colonne > NB_COLONNES) {
    throw new Error(`arsenal : colonne ${colonne} hors de 1…${NB_COLONNES}`);
  }
}

/** Budget d'armée du joueur : `base + parNiveau × niveau`. */
export function budgetDuNiveau(niveau) {
  verifierNiveau(niveau);
  return POINTS_ARMEE.offense.base + POINTS_ARMEE.offense.parNiveau * niveau;
}

/**
 * Comment le joueur appelle chaque famille de châssis.
 *
 * ⚠ CE SONT LES MOTS D'ETHAN, LE 29/08 : « Infanterie inconstructible sans
 * caserne. Même règle pour véhicule et avion. » On lui rend son vocabulaire
 * dans le message de refus plutôt que d'y écrire « escouade », qui est le nom
 * INTERNE du châssis et n'apparaît nulle part à l'écran.
 */
export const FAMILLE_DE_CHASSIS = {
  escouade: 'infanterie',
  blinde: 'véhicule',
  aeronef: 'avion',
};

/**
 * Ce que la palette dit d'une unité dont le bâtiment de production manque.
 *
 * ⚠ LA PHRASE ÉVITE L'ARTICLE DU BÂTIMENT, ET C'EST VOULU. « une Caserne » mais
 * « un Dépôt de véhicules » : porter le genre demanderait un champ de plus dans
 * `BASE_BATIMENTS` pour onze bâtiments, dont trois seulement s'en serviraient.
 * « sans Caserne » est juste des deux côtés. L'élision, elle, ne se contourne
 * pas — « pas d'infanterie » contre « pas de véhicule » — et se fait ici.
 *
 * @param {string} nomBatiment nom joueur du bâtiment manquant
 * @param {string} chassis clé de `FAMILLE_DE_CHASSIS`
 * @returns {string}
 */
export function messageSansBatiment(nomBatiment, chassis) {
  const famille = FAMILLE_DE_CHASSIS[chassis];
  if (famille === undefined) {
    throw new Error(`arsenal : châssis inconnu « ${chassis} »`);
  }
  const elide = /^[aeiouyéèêàâîïôûù]/i.test(famille) ? `d'${famille}` : `de ${famille}`;
  return `sans ${nomBatiment}, pas ${elide}`;
}

/**
 * Les unités que le joueur peut poser : celles que la RECHERCHE a ouvertes.
 *
 * ⚠⚠ CE N'EST PLUS UN NIVEAU. Jusqu'au lot RECHERCHE, la porte était
 * `apparition <= niveau` du Centre de commandement ; Ethan a tranché le 30/08 :
 * « oui la recherche seule permet de poser des pièces », « non » au niveau seul,
 * « non » aux deux. `apparition` est redevenue une table de l'OUVRAGE, lue par
 * `sim/generateur.js` et par aucun chemin du joueur.
 *
 * ⚠ `acquises === null` VEUT DIRE « AUCUN FILTRE », et ce n'est pas la même
 * chose que la liste vide. Le banc (`ui/banc.js`) monte des compositions hors
 * partie, sans état de recherche : lui imposer une liste vide lui interdirait
 * de poser quoi que ce soit. La liste VIDE, elle, veut bien dire « rien
 * d'acquis ».
 *
 * @param {string[]|null} acquises identifiants ouverts, ou `null` pour tout
 * @returns {string[]}
 */
export function unitesDisponibles(acquises) {
  if (acquises === null || acquises === undefined) return Object.keys(UNITES);
  return Object.keys(UNITES).filter((id) => acquises.includes(id));
}

/**
 * Pourquoi cette unité n'est pas encore constructible à ce niveau — ou `null`.
 *
 * ⚠ ELLE VIT ICI PARCE QUE LA PORTE VIT ICI. `unitesDisponibles` est la seule
 * lecture de l'ouverture du dépôt côté écran ; l'écran Offense a besoin de
 * NOMMER le verrou depuis qu'il grise au lieu de filtrer, et le laisser relire
 * la règle lui-même en ferait une seconde lecture. Un test balaie
 * `ui/offense.js` pour que ça reste vrai.
 *
 * ⚠ `niveau === null` N'EST PAS UN NIVEAU ZÉRO, ET CETTE RAISON PRIME TOUJOURS.
 * Sans Centre de commandement il n'y a pas de budget d'armée du tout : dire
 * « se débloque par la recherche » à un joueur qui n'a pas encore de QG
 * l'enverrait acheter là où il doit d'abord construire.
 *
 * ⚠ LE MESSAGE NE PORTE PLUS DE NOMBRE. Le coût vit dans l'écran Recherche ; le
 * redire ici ferait deux lectures de la même table, et deux endroits à corriger
 * au premier réétalonnage.
 *
 * @param {string} id clé de `UNITES`
 * @param {number|null} niveau niveau du Centre de commandement
 * @param {string[]|null} acquises identifiants ouverts par la recherche
 * @returns {string|null}
 */
export function raisonDuVerrou(id, niveau, acquises = null) {
  if (UNITES[id] === undefined) throw new Error(`arsenal : unité inconnue « ${id} »`);
  if (niveau === null) return 'aucun Centre de commandement posé';
  if (unitesDisponibles(acquises).includes(id)) return null;
  return 'se débloque par la recherche';
}

/**
 * Grille vide : 4 rangées de 9 cases, toutes libres.
 *
 * ⚠ `acquises` VOYAGE DANS L'ÉTAT DE L'ÉDITEUR, comme `interdites` de
 * `ui/defense.js` avant lui. `poser`, `bilan` et `purger` sont des fonctions
 * pures qui ne connaissent pas la partie : leur passer l'état de recherche à
 * chaque appel multiplierait les signatures. Le porter dans l'état est le motif
 * déjà en place pour les obstacles, et il a fait ses preuves.
 *
 * @param {number} niveau
 * @param {string[]|null} [acquises] ouvertures de la recherche, `null` = aucun filtre
 */
export function arsenalVide(niveau, acquises = null) {
  verifierNiveau(niveau);
  return {
    niveau,
    acquises,
    cases: Array.from({ length: NB_VAGUES }, () => Array.from({ length: NB_COLONNES }, () => null)),
  };
}

/** Copie profonde : chaque opération rend un NOUVEL état, jamais une mutation. */
function copier(etat) {
  return {
    niveau: etat.niveau,
    acquises: etat.acquises ?? null,
    cases: etat.cases.map((rangee) => [...rangee]),
  };
}

/** Somme des points engagés. */
function pointsDe(cases) {
  let total = 0;
  for (const rangee of cases) {
    for (const id of rangee) if (id !== null) total += UNITES[id].points;
  }
  return total;
}

/**
 * Pose une unité. Rend un NOUVEL état, ou LÈVE.
 *
 * Quatre refus, dans cet ordre : case hors grille, unité inconnue, unité
 * verrouillée au niveau courant, case déjà occupée, budget dépassé. Le budget
 * est une BARRIÈRE, pas un écrêtage : une pose qui dépasserait est refusée
 * entière, on ne pose pas « ce qui rentre ».
 */
export function poser(etat, { vague, colonne, id }) {
  verifierCase(vague, colonne);
  if (UNITES[id] === undefined) {
    throw new Error(`arsenal : unité inconnue « ${id} »`);
  }
  if (!unitesDisponibles(etat.acquises ?? null).includes(id)) {
    throw new Error(`arsenal : ${id} n'est pas débloquée par la recherche`);
  }
  if (etat.cases[vague - 1][colonne - 1] !== null) {
    throw new Error(`arsenal : la case (vague ${vague}, colonne ${colonne}) est occupée`);
  }
  const budget = budgetDuNiveau(etat.niveau);
  const apres = pointsDe(etat.cases) + UNITES[id].points;
  if (apres > budget) {
    throw new Error(
      `arsenal : ${apres} points dépasseraient le budget de ${budget}`,
    );
  }
  const suivant = copier(etat);
  suivant.cases[vague - 1][colonne - 1] = id;
  return suivant;
}

/** Retire l'unité d'une case. Une case déjà vide se retire sans erreur. */
export function retirer(etat, { vague, colonne }) {
  verifierCase(vague, colonne);
  const suivant = copier(etat);
  suivant.cases[vague - 1][colonne - 1] = null;
  return suivant;
}

/**
 * Le `vagues[][]` du moteur, exactement dans la forme qu'attend `creerCombat`.
 *
 * ⚠ Les QUATRE vagues sont toujours rendues, y compris vides. Une vague vide
 * conserve son rang : la vague 2 laissée vide ne doit pas décaler la vague 3,
 * sous peine de changer les instants d'apparition — la vague n apparaît au tick
 * (n − 1) × 50, et un décalage la ferait entrer cinquante ticks trop tôt.
 */
export function enVagues(etat) {
  return etat.cases.map((rangee) => {
    const vague = [];
    for (let colonne = 1; colonne <= NB_COLONNES; colonne += 1) {
      const id = rangee[colonne - 1];
      if (id !== null) vague.push({ id, colonne, niveau: etat.niveau });
    }
    return vague;
  });
}

/**
 * L'opération inverse : un `vagues[][]` du moteur redevient une grille.
 *
 * C'est ce qui permet au bouton « Remplir » de verser une composition de
 * `genererAssaut` dans l'Arsenal, et ce qui rendra la sauvegarde triviale.
 * Aucune validation de budget ici : on charge ce qui a été produit, et `bilan`
 * dira ensuite si l'ensemble tient.
 */
export function depuisVagues(vagues, niveau) {
  const etat = arsenalVide(niveau);
  vagues.forEach((vague, indice) => {
    if (indice >= NB_VAGUES) {
      throw new Error(`arsenal : ${vagues.length} vagues, le maximum est ${NB_VAGUES}`);
    }
    for (const u of vague) {
      verifierCase(indice + 1, u.colonne);
      if (etat.cases[indice][u.colonne - 1] !== null) {
        throw new Error(`arsenal : deux unités en (vague ${indice + 1}, colonne ${u.colonne})`);
      }
      etat.cases[indice][u.colonne - 1] = u.id;
    }
  });
  return etat;
}

/** Change le niveau SANS toucher à la composition — c'est `bilan` qui jugera. */
export function avecNiveau(etat, niveau) {
  verifierNiveau(niveau);
  // ⚠ `acquises` SUIT LE CHANGEMENT DE NIVEAU SANS BOUGER. Rien ne se
  // dé-recherche : baisser le Centre de commandement rétrécit le BUDGET, il ne
  // referme aucune pièce. Le perdre ici ferait passer l'état à « aucun filtre »
  // et rendrait `verrouillees` toujours vide.
  return {
    niveau,
    acquises: etat.acquises ?? null,
    cases: etat.cases.map((rangee) => [...rangee]),
  };
}

/**
 * L'INDICE DE FILE — ce que le joueur ne peut pas voir seul.
 *
 * Depuis le lot 3B, les alliés ne s'écrasent plus : ils se bloquent. Une unité
 * rapide posée dans une vague POSTÉRIEURE, sur la MÊME colonne qu'une unité
 * plus lente, se fait retenir derrière elle sur toute la traversée.
 *
 * Mesuré : un Fendeur en vague 2, colonne 5, quitte le champ au tick 257 ; le
 * même derrière un Fusilier allié dans la même colonne en sort au tick 327 —
 * 70 ticks de retard, sept secondes sur un plafond de quatre-vingt-dix. Le même
 * Fusilier posé en colonne 4 ne coûte rien : 257 à nouveau. C'est bien la
 * colonne qui décide.
 *
 * Prédicat exact : deux unités NON AÉRIENNES, même colonne, la plus rapide dans
 * une vague strictement postérieure.
 *
 * Les aéronefs sont exclus des deux côtés : masse nulle, ils ne bloquent rien
 * et ne sont bloqués par rien. Vérifié — un Frappeur en vague 2 sort au tick
 * 120 qu'il soit seul, derrière une Crécelle ou derrière un Fusilier.
 *
 * C'est un INDICE, pas une interdiction : la pose reste permise, la colonne se
 * marque, et l'inspecteur explique. Le joueur doit pouvoir se tromper exprès.
 *
 * @returns {Array<{colonne, devant, derriere}>} un indice par colonne au plus,
 *   sur le couple dont l'écart de vitesse est le plus grand.
 */
export function indicesDeFile(etat) {
  const indices = [];
  for (let colonne = 1; colonne <= NB_COLONNES; colonne += 1) {
    const pile = [];
    for (let vague = 1; vague <= NB_VAGUES; vague += 1) {
      const id = etat.cases[vague - 1][colonne - 1];
      if (id === null || UNITES[id].chassis === 'aeronef') continue;
      pile.push({ vague, id, vitesse: UNITES[id].vitesse });
    }
    let pire = null;
    for (let i = 0; i < pile.length; i += 1) {
      for (let j = i + 1; j < pile.length; j += 1) {
        const ecart = pile[j].vitesse - pile[i].vitesse;
        if (ecart > 0 && (pire === null || ecart > pire.ecart)) {
          pire = { ecart, devant: pile[i], derriere: pile[j] };
        }
      }
    }
    if (pire !== null) {
      indices.push({ colonne, devant: pire.devant, derriere: pire.derriere });
    }
  }
  return indices;
}

/**
 * L'état de la composition en un coup d'œil.
 *
 * `verrouillees` et `depassementBudget` ne peuvent pas naître d'une pose — elle
 * les refuse. Le banc doit alors le dire et proposer de purger, jamais retirer
 * des unités en silence.
 *
 * ⚠ CE N'EST PLUS « LE NIVEAU EST DESCENDU », ET LA GARDE RESTE QUAND MÊME.
 * RIEN NE SE DÉ-RECHERCHE : un achat est définitif. `verrouillees` naît
 * désormais d'une sauvegarde trafiquée, d'un identifiant retiré des données, ou
 * d'un budget qui rétrécit avec le Centre de commandement. Le retirer laisserait
 * ces trois cas passer en silence.
 */
export function bilan(etat) {
  const ouvertes = unitesDisponibles(etat.acquises ?? null);
  const budgetPoints = budgetDuNiveau(etat.niveau);
  const pointsEngages = pointsDe(etat.cases);
  const verrouillees = [];
  let emplacementsOccupes = 0;
  for (let vague = 1; vague <= NB_VAGUES; vague += 1) {
    for (let colonne = 1; colonne <= NB_COLONNES; colonne += 1) {
      const id = etat.cases[vague - 1][colonne - 1];
      if (id === null) continue;
      emplacementsOccupes += 1;
      if (!ouvertes.includes(id)) verrouillees.push({ vague, colonne, id });
    }
  }
  const depassementBudget = pointsEngages > budgetPoints;
  return {
    niveau: etat.niveau,
    budgetPoints,
    pointsEngages,
    pointsRestants: budgetPoints - pointsEngages,
    emplacementsOccupes,
    emplacementsLibres: NB_EMPLACEMENTS - emplacementsOccupes,
    indices: indicesDeFile(etat),
    verrouillees,
    depassementBudget,
    valide: !depassementBudget && verrouillees.length === 0,
  };
}

/** Retire tout ce qui n'est plus autorisé : unités verrouillées,
 * puis les plus chères jusqu'à retomber dans le budget. N'est appelée que sur
 * demande explicite du joueur — jamais en silence. */
export function purger(etat) {
  let suivant = copier(etat);
  const ouvertes = unitesDisponibles(suivant.acquises ?? null);
  const budget = budgetDuNiveau(suivant.niveau);
  for (let vague = 1; vague <= NB_VAGUES; vague += 1) {
    for (let colonne = 1; colonne <= NB_COLONNES; colonne += 1) {
      const id = suivant.cases[vague - 1][colonne - 1];
      if (id !== null && !ouvertes.includes(id)) {
        suivant.cases[vague - 1][colonne - 1] = null;
      }
    }
  }
  // Puis le budget : on retire la plus chère, en partant de la DERNIÈRE vague —
  // la file d'attente se vide par la queue, ce qui préserve la tête d'assaut.
  while (pointsDe(suivant.cases) > budget) {
    let choix = null;
    for (let vague = NB_VAGUES; vague >= 1; vague -= 1) {
      for (let colonne = NB_COLONNES; colonne >= 1; colonne -= 1) {
        const id = suivant.cases[vague - 1][colonne - 1];
        if (id === null) continue;
        if (choix === null || UNITES[id].points > choix.points) {
          choix = { vague, colonne, points: UNITES[id].points };
        }
      }
    }
    if (choix === null) break;
    suivant = retirer(suivant, choix);
  }
  return suivant;
}

/** Vérifie que la grille n'est jamais vide au lancement : le moteur refuserait. */
export function estVide(etat) {
  return bilan(etat).emplacementsOccupes === 0;
}
