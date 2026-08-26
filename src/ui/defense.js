// L'écran de Défense — la garnison du joueur. Jumeau de l'Arsenal.
//
// Module PUR : il n'importe ni le DOM ni le canvas, ne tire aucun hasard, ne
// lit aucune horloge, et son état est un objet sérialisable.
//
// L'INVARIANT DU LOT. Les rangées de l'éditeur SONT les rangées du champ. Poser
// une Casemate en rangée 7 produit `{ rangee: 7 }` dans le montage, et le
// moteur la place en rangée 7. Aucune translation, aucun indice interne. C'est
// le pendant exact de l'invariant de colonne de l'Arsenal, et il se teste de la
// même façon : les huit ordonnées de l'éditeur doivent tomber sur `yDeRangee`.
//
// ORDRE DES RANGÉES. `cases[0]` est la rangée 3, la plus AVANCÉE — celle que
// l'assaut rencontre en premier. `cases[7]` est la rangée 10, adossée aux
// bâtiments. La grille se lit donc de l'ennemi vers chez soi, dans le sens où
// l'assaut la traverse.

import { GRILLE, DEFENSES, UNITES } from '../data/combat.js';
import { POINTS_ARMEE, DISPOSITION_DEFENSES } from '../data/sites.js';
import { NIVEAU } from '../data/niveaux.js';

/** Les huit rangées de la bande de défense, et les neuf colonnes du champ. */
export const PREMIERE_RANGEE = GRILLE.bandes.defense.premiere;
export const DERNIERE_RANGEE = GRILLE.bandes.defense.derniere;
export const NB_RANGEES = DERNIERE_RANGEE - PREMIERE_RANGEE + 1;
export const NB_COLONNES = GRILLE.largeur;

/**
 * Emplacements totaux : 72.
 *
 * ⚠ CONTRAIREMENT À L'ARSENAL, ils ne plafonnent JAMAIS le budget. Le calcul
 * s'inverse : budget maximal 40 + 5 × 50 = 290, défenseur le moins cher 5
 * points, donc 58 pièces au plus pour 72 emplacements. Ne pas recopier ici
 * l'avertissement de l'Arsenal, il serait faux. Un test verrouille l'invariant
 * pour qu'un futur relèvement du budget le réveille.
 */
export const NB_EMPLACEMENTS = NB_RANGEES * NB_COLONNES;

/**
 * Six occupants au plus par rangée de neuf colonnes — arbitré le 25/08/2026,
 * la règle du générateur s'applique aussi au joueur. Trois colonnes libres au
 * minimum : sans passage, le terrain ne décide plus rien.
 */
export const OCCUPANTS_MAX_PAR_RANGEE = DISPOSITION_DEFENSES.occupantsMaxParRangee;

/** La ligne de données d'un défenseur, structure ou unité. */
function ligne(id) {
  return DEFENSES[id] ?? UNITES[id];
}

/** Une unité n'est posable en défense que si elle y a un rôle. */
function aUnRoleDefensif(id) {
  if (DEFENSES[id] !== undefined) return true;
  return UNITES[id] !== undefined && UNITES[id].defense.present === true;
}

function verifierNiveau(niveau) {
  if (!Number.isInteger(niveau) || niveau < 1 || niveau > NIVEAU.plafond) {
    throw new Error(`defense : niveau ${niveau} hors de 1…${NIVEAU.plafond}`);
  }
  return niveau;
}

function verifierCase(rangee, colonne) {
  if (!Number.isInteger(rangee) || rangee < PREMIERE_RANGEE || rangee > DERNIERE_RANGEE) {
    throw new Error(`defense : rangée ${rangee} hors de ${PREMIERE_RANGEE}…${DERNIERE_RANGEE}`);
  }
  if (!Number.isInteger(colonne) || colonne < 1 || colonne > NB_COLONNES) {
    throw new Error(`defense : colonne ${colonne} hors de 1…${NB_COLONNES}`);
  }
}

/** Budget de défense : `base + parNiveau × niveau`. 45 au niveau 1, 290 au 50. */
export function budgetDuNiveau(niveau) {
  verifierNiveau(niveau);
  return POINTS_ARMEE.defense.base + POINTS_ARMEE.defense.parNiveau * niveau;
}

/**
 * Ce que le joueur peut poser à ce niveau : les DEFENSES, plus les UNITES qui
 * ont un rôle défensif. Dans les deux cas `apparition <= niveau`.
 *
 * ⚠ UNE SEULE TABLE D'APPARITION FAIT FOI, celle des lignes elles-mêmes. Il
 * n'existe PAS de champ `defense.apparition` — `UNITES[x].defense` ne porte que
 * `present`, `cible` et `module`. Le classeur CIBLAGE-DEFENSE en propose un qui
 * diverge ; il a été écarté le 24/08.
 */
export function defensesDisponibles(niveau) {
  verifierNiveau(niveau);
  return [
    ...Object.keys(DEFENSES).filter((id) => DEFENSES[id].apparition <= niveau),
    ...Object.keys(UNITES).filter((id) => aUnRoleDefensif(id) && UNITES[id].apparition <= niveau),
  ];
}

/**
 * Grille vide : 8 rangées de 9 cases.
 *
 * `obstacles` est la liste des cases interdites, au format du montage. Elle est
 * OPTIONNELLE et ne préjuge de rien : le moteur refuse un défenseur posé sur un
 * obstacle, et les obstacles d'un site sont tirés par graine. Le jour où la base
 * du joueur aura les siens, ils entreront par là.
 */
export function defenseVide(niveau, obstacles = []) {
  verifierNiveau(niveau);
  const interdites = new Set();
  for (const o of obstacles) {
    if (o.rangee >= PREMIERE_RANGEE && o.rangee <= DERNIERE_RANGEE) {
      interdites.add(`${o.rangee},${o.colonne}`);
    }
  }
  return {
    niveau,
    interdites: [...interdites],
    cases: Array.from({ length: NB_RANGEES }, () => Array.from({ length: NB_COLONNES }, () => null)),
  };
}

/** Copie profonde : chaque opération rend un NOUVEL état, jamais une mutation. */
function copier(etat) {
  return {
    niveau: etat.niveau,
    interdites: [...etat.interdites],
    cases: etat.cases.map((rangee) => [...rangee]),
  };
}

function pointsDe(cases) {
  let total = 0;
  for (const rangee of cases) {
    for (const id of rangee) if (id !== null) total += ligne(id).points;
  }
  return total;
}

function occupantsDeLaRangee(cases, rangee) {
  return cases[rangee - PREMIERE_RANGEE].filter((id) => id !== null).length;
}

/**
 * Pose un défenseur. Rend un NOUVEL état, ou LÈVE.
 *
 * Refus, dans cet ordre : case hors grille, identifiant inconnu, identifiant
 * sans rôle défensif, case interdite par un obstacle, rangée déjà pleine, case
 * déjà occupée, budget dépassé. Le budget est une BARRIÈRE, pas un écrêtage.
 *
 * Le message du troisième refus reprend MOT POUR MOT celui de `creerCombat` :
 * l'éditeur ne doit jamais produire un montage que le moteur refusera, et quand
 * il refuse, il doit refuser pour la même raison, dite pareil.
 */
export function poser(etat, { rangee, colonne, id }) {
  verifierCase(rangee, colonne);
  if (ligne(id) === undefined) {
    throw new Error(`defense : défenseur « ${id} » — identifiant inconnu`);
  }
  if (!aUnRoleDefensif(id)) {
    throw new Error(`defense : défenseur « ${id} » n'a pas de rôle en défense`);
  }
  if (ligne(id).apparition > etat.niveau) {
    throw new Error(
      `defense : ${id} est verrouillé au niveau ${etat.niveau} `
      + `(apparition ${ligne(id).apparition})`,
    );
  }
  if (etat.interdites.includes(`${rangee},${colonne}`)) {
    throw new Error(`defense : la case (${rangee}, ${colonne}) porte un obstacle`);
  }
  if (etat.cases[rangee - PREMIERE_RANGEE][colonne - 1] !== null) {
    throw new Error(`defense : la case (rangée ${rangee}, colonne ${colonne}) est occupée`);
  }
  if (occupantsDeLaRangee(etat.cases, rangee) >= OCCUPANTS_MAX_PAR_RANGEE) {
    throw new Error(
      `defense : la rangée ${rangee} porte déjà ${OCCUPANTS_MAX_PAR_RANGEE} occupants, `
      + 'il faut laisser passer',
    );
  }
  const budget = budgetDuNiveau(etat.niveau);
  const apres = pointsDe(etat.cases) + ligne(id).points;
  if (apres > budget) {
    throw new Error(`defense : ${apres} points dépasseraient le budget de ${budget}`);
  }
  const suivant = copier(etat);
  suivant.cases[rangee - PREMIERE_RANGEE][colonne - 1] = id;
  return suivant;
}

/** Retire le défenseur d'une case. Une case déjà vide se retire sans erreur. */
export function retirer(etat, { rangee, colonne }) {
  verifierCase(rangee, colonne);
  const suivant = copier(etat);
  suivant.cases[rangee - PREMIERE_RANGEE][colonne - 1] = null;
  return suivant;
}

/**
 * Le `defenseurs[]` du moteur, exactement dans la forme qu'attend `creerCombat`.
 * Ordre stable : rangée croissante, puis colonne croissante.
 */
export function enDefenseurs(etat) {
  const liste = [];
  for (let rangee = PREMIERE_RANGEE; rangee <= DERNIERE_RANGEE; rangee += 1) {
    for (let colonne = 1; colonne <= NB_COLONNES; colonne += 1) {
      const id = etat.cases[rangee - PREMIERE_RANGEE][colonne - 1];
      if (id !== null) liste.push({ id, rangee, colonne, niveau: etat.niveau });
    }
  }
  return liste;
}

/**
 * L'opération inverse. C'est un CHARGEMENT, pas une pose : il accepte ce qu'on
 * lui donne et laisse `bilan` juger, exactement comme `avecNiveau` accepte de
 * descendre sous l'apparition d'une pièce déjà là.
 *
 * ⚠ EN PARTICULIER, IL ACCEPTE UNE PIÈCE SUR UN OBSTACLE. C'est délibéré et ça
 * a été tranché le 25/08/2026. Les obstacles sont tirés PAR GRAINE : changer de
 * graine peut en poser un sous une pièce déjà placée, et la pièce n'y est pour
 * rien — c'est le terrain qui a bougé sous elle. Lever ici ferait planter le
 * chargement au lieu de dégrader. `bilan` la signale dans `surObstacle`,
 * `valide` passe à faux, et `purger` la retire SUR DEMANDE. Jamais en silence.
 *
 * Deux défenseurs sur la même case, en revanche, lèvent — c'est une liste
 * corrompue, pas un terrain qui a bougé.
 */
export function depuisDefenseurs(liste, niveau, obstacles = []) {
  const etat = defenseVide(niveau, obstacles);
  for (const d of liste) {
    verifierCase(d.rangee, d.colonne);
    if (etat.cases[d.rangee - PREMIERE_RANGEE][d.colonne - 1] !== null) {
      throw new Error(`defense : deux défenseurs en (${d.rangee}, ${d.colonne})`);
    }
    etat.cases[d.rangee - PREMIERE_RANGEE][d.colonne - 1] = d.id;
  }
  return etat;
}

/** Change le niveau SANS toucher à la composition — c'est `bilan` qui jugera. */
export function avecNiveau(etat, niveau) {
  verifierNiveau(niveau);
  return { ...copier(etat), niveau };
}

/**
 * LA COUVERTURE — le nombre de cases du champ qu'une pièce peut engager depuis
 * cette case, calculé avec LE PRÉDICAT DU MOTEUR et rien d'autre :
 *
 *   d² = (Δrangée)² + (Δcolonne)², rejet si d² > portée² OU d² < portéeMini²
 *
 * ⚠ CE CALCUL CORRIGE UNE ERREUR DE LA SPEC. `DISPOSITION_DEFENSES` affirme
 * qu'« en rangée 3 une artillerie engagerait entre −2,5 et −0,5, c'est-à-dire
 * jamais » et conclut que « toute artillerie avancée est inerte ». C'est FAUX :
 * le raisonnement est en rangées, le moteur mesure une distance euclidienne 2D
 * et sans direction. Mesuré sur cinq graines au niveau 30, une Faucheuse en
 * rangée 3 tire 23 ticks et ouvre le feu au tick 1 — elle atteint les colonnes
 * lointaines dès l'apparition, puis tire dans le dos de ce qui l'a dépassée.
 *
 * Ce qui est vrai, c'est qu'elle engage MOINS : la couverture sature à partir
 * de la rangée 6, et les rangées 3, 4 et 5 en perdent par débordement de la
 * grille sous la rangée 1. Le seuil ne se choisit donc pas, il se calcule.
 */
export function couverture(id, rangee, colonne) {
  verifierCase(rangee, colonne);
  const d = ligne(id);
  if (d === undefined) throw new Error(`defense : défenseur « ${id} » — identifiant inconnu`);
  const portee = d.portee ?? 0;
  const mini = d.porteeMini ?? 0;
  let n = 0;
  for (let a = 1; a <= GRILLE.longueur; a += 1) {
    for (let k = 1; k <= NB_COLONNES; k += 1) {
      const d2 = (rangee - a) ** 2 + (colonne - k) ** 2;
      if (d2 <= portee * portee && d2 >= mini * mini) n += 1;
    }
  }
  return n;
}

/** La meilleure couverture atteignable par ce profil dans la bande, à colonne fixée. */
function couvertureMaximale(id, colonne) {
  let max = 0;
  for (let rangee = PREMIERE_RANGEE; rangee <= DERNIERE_RANGEE; rangee += 1) {
    const c = couverture(id, rangee, colonne);
    if (c > max) max = c;
  }
  return max;
}

/**
 * L'INDICE DE COUVERTURE — ce que le joueur ne peut pas voir seul.
 *
 * Une pièce dont la couverture n'est pas maximale pour son profil, à sa colonne,
 * est marquée. Le libellé montré dit « engagement réduit », JAMAIS « inerte ».
 *
 * Et le module le dit franchement : l'indice SOUS-ESTIME. Le gradient dynamique
 * mesuré va de 23 à 110 ticks de tir entre les rangées 3 et 10, soit ×4,8, quand
 * le gradient géométrique ne fait que ×1,6 — une pièce reculée voit l'assaut
 * plus longtemps en approche, ce qu'aucun comptage de cases ne capture. L'indice
 * est déterministe et gratuit ; la mesure ne l'est pas.
 *
 * C'est un INDICE, pas une interdiction. Le joueur doit pouvoir se tromper
 * exprès — doctrine du lot 5A.
 */
export function indicesDeCouverture(etat) {
  const indices = [];
  for (let rangee = PREMIERE_RANGEE; rangee <= DERNIERE_RANGEE; rangee += 1) {
    for (let colonne = 1; colonne <= NB_COLONNES; colonne += 1) {
      const id = etat.cases[rangee - PREMIERE_RANGEE][colonne - 1];
      if (id === null) continue;
      const obtenue = couverture(id, rangee, colonne);
      const maximale = couvertureMaximale(id, colonne);
      if (obtenue < maximale) {
        indices.push({ rangee, colonne, id, couverture: obtenue, maximale });
      }
    }
  }
  return indices;
}

/**
 * L'état de la composition en un coup d'œil.
 *
 * Trois défauts possibles, et AUCUN ne peut naître d'une pose — `poser` les
 * refuse tous les trois. Ils naissent d'un changement du contexte SOUS une
 * composition déjà faite :
 *   `verrouilles`        — le niveau est descendu sous l'apparition d'une pièce
 *   `depassementBudget`  — le niveau est descendu, le budget avec lui
 *   `surObstacle`        — la graine a changé, un obstacle est apparu dessous
 *
 * Le banc doit les dire et proposer de purger, jamais retirer en silence.
 *
 * ⚠ `surObstacle` est la seule des trois qui rende le montage IMPOSSIBLE :
 * `creerCombat` lève sur un défenseur posé sur un obstacle, là où il accepte
 * sans broncher une pièce verrouillée ou un budget dépassé.
 */
export function bilan(etat) {
  const budgetPoints = budgetDuNiveau(etat.niveau);
  const pointsEngages = pointsDe(etat.cases);
  const verrouilles = [];
  const surObstacle = [];
  const rangeesPleines = [];
  let emplacementsOccupes = 0;
  for (let rangee = PREMIERE_RANGEE; rangee <= DERNIERE_RANGEE; rangee += 1) {
    const occupants = occupantsDeLaRangee(etat.cases, rangee);
    emplacementsOccupes += occupants;
    if (occupants >= OCCUPANTS_MAX_PAR_RANGEE) rangeesPleines.push(rangee);
    for (let colonne = 1; colonne <= NB_COLONNES; colonne += 1) {
      const id = etat.cases[rangee - PREMIERE_RANGEE][colonne - 1];
      if (id === null) continue;
      if (ligne(id).apparition > etat.niveau) {
        verrouilles.push({ rangee, colonne, id, apparition: ligne(id).apparition });
      }
      if (etat.interdites.includes(`${rangee},${colonne}`)) {
        surObstacle.push({ rangee, colonne, id });
      }
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
    rangeesPleines,
    indices: indicesDeCouverture(etat),
    verrouilles,
    surObstacle,
    depassementBudget,
    valide: !depassementBudget && verrouilles.length === 0 && surObstacle.length === 0,
  };
}

/**
 * Retire ce que le contexte courant n'autorise plus : pièces verrouillées,
 * pièces prises sous un obstacle, puis les plus chères jusqu'à retomber dans le
 * budget. N'est appelée que sur demande explicite du joueur — jamais en silence.
 *
 * On retire en partant de la rangée la plus AVANCÉE : c'est la ligne la plus
 * exposée, celle qu'on sacrifie en premier quand il faut réduire la voilure.
 */
export function purger(etat) {
  let suivant = copier(etat);
  const budget = budgetDuNiveau(suivant.niveau);
  for (let rangee = PREMIERE_RANGEE; rangee <= DERNIERE_RANGEE; rangee += 1) {
    for (let colonne = 1; colonne <= NB_COLONNES; colonne += 1) {
      const id = suivant.cases[rangee - PREMIERE_RANGEE][colonne - 1];
      if (id === null) continue;
      if (ligne(id).apparition > suivant.niveau
        || suivant.interdites.includes(`${rangee},${colonne}`)) {
        suivant.cases[rangee - PREMIERE_RANGEE][colonne - 1] = null;
      }
    }
  }
  while (pointsDe(suivant.cases) > budget) {
    let choix = null;
    for (let rangee = PREMIERE_RANGEE; rangee <= DERNIERE_RANGEE; rangee += 1) {
      for (let colonne = 1; colonne <= NB_COLONNES; colonne += 1) {
        const id = suivant.cases[rangee - PREMIERE_RANGEE][colonne - 1];
        if (id === null) continue;
        if (choix === null || ligne(id).points > choix.points) {
          choix = { rangee, colonne, points: ligne(id).points };
        }
      }
    }
    if (choix === null) break;
    suivant = retirer(suivant, choix);
  }
  return suivant;
}

/** Une garnison vide est permise — la base n'est simplement pas défendue. */
export function estVide(etat) {
  return bilan(etat).emplacementsOccupes === 0;
}
