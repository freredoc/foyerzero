// La réparation de l'armée — les réservoirs en parallèle.
//
// ⚠ TOUT CE LOT EST UNE TRANSCRIPTION, PAS UNE INVENTION. Trois documents le
// portent en entier, et ils se recoupent :
//
//   `MODELE-ECONOMIQUE.md` §7 — « Quatre réservoirs — infanterie, véhicules,
//   aviation, base — qui réparent EN PARALLÈLE. coût_total = Σ coût(réservoir),
//   temps_total = max(temps(réservoir)). Concentrer ses pertes sur un réservoir
//   coûte pareil mais immobilise plus longtemps ; les répartir libère plus
//   vite. »
//
//   `RELEVE-TA-COURBES-2.md` §4 — la formule, vérifiée à 0,02 % sur sept points :
//       T(L, C) = base_unité × 1,15^(L−1) / D(C)
//       D(C)    = 1,09^(min(C,12)−1) × 1,12^max(C−12, 0)
//   `L` niveau de l'unité, `C` niveau du bâtiment réparateur. La base par unité
//   est déjà dans `data/combat.js`, champ `reparation`, en secondes.
//
//   `MODELE-REPARATION-1.md` §3 — quel bâtiment commande quel châssis, et que
//   le coût se paie en SCORIE, indexé sur le niveau de l'unité.
//
// Et Ethan l'a redit le 29/08 au soir, avec ses nombres : « je rentre de raid,
// j'ai 30 minutes de répa infanterie, 20 de véhicule, 1 h d'aviation. Si je
// répare complètement mes véhicules, j'ai 20 minutes d'infanterie gratuites et
// 20 minutes d'aviation gratuites. » C'est le parallélisme, vu du joueur : le
// réservoir le plus touché paie pour tous les autres.
//
// ⚠ IL N'Y A DONC RIEN À CHOISIR, ET C'EST LE POINT. Le joueur ne répartit pas
// un budget entre ses châssis : il lance UNE réparation, et elle dure le temps
// du réservoir le plus abîmé. Ce qui se joue, c'est la COMPOSITION de l'armée —
// concentrer ses pertes immobilise longtemps, les répartir libère vite. C'est
// écrit noir sur blanc dans le modèle économique, et c'est ce qu'Ethan appelle
// « diversifier les armées infanterie véhicule avion ».
//
// ⚠ LE BONUS NE SE MET PAS EN BANQUE. « Les points de réparation bonus
// disparaissent si on refait un raid avec la même armée » : une réparation en
// cours est ABANDONNÉE par un nouveau raid. Ce qui a déjà été rendu est rendu ;
// le temps restant est perdu. C'est `annulerLaReparation`, appelée par
// `sim/raid.js`.

import { UNITES } from '../data/combat.js';
import { BATIMENT_DE_CHASSIS } from '../data/base.js';
import { coutDeMonteeOffense } from '../data/couts-militaires.js';
import { REPARATION } from '../data/sites.js';
import { TICKS_PAR_SECONDE } from './clock.js';
import { facteurMilli } from './combat.js';

/** Un millier — l'échelle des milli-PV. */
const MILLE = 1000;

/**
 * Le diviseur du bâtiment réparateur — `D(C)` du relevé.
 *
 * ⚠ LA RUPTURE EST AU NIVEAU 12, PAS AU 11. Quatre systèmes changent de régime
 * au 11 — dégâts, coûts des bâtiments, coûts des unités — et celui-ci fait
 * exception : le relevé mesure `÷1,09` jusqu'au 12 inclus, puis `÷1,12`. Aligner
 * la rupture sur les autres « pour faire propre » déplacerait la série mesurée.
 *
 * @param {number} niveau niveau du bâtiment réparateur
 * @returns {number} diviseur, ≥ 1
 */
export function diviseurDuBatiment(niveau) {
  if (!Number.isInteger(niveau) || niveau < 1) {
    throw new RangeError(`réparation : niveau de bâtiment « ${niveau} » — entier ≥ 1 attendu`);
  }
  const { penteBasse, penteHaute, niveauRupture } = REPARATION.diviseurBatiment;
  const bas = Math.min(niveau, niveauRupture) - 1;
  const haut = Math.max(niveau - niveauRupture, 0);
  return penteBasse ** bas * penteHaute ** haut;
}

/**
 * Le temps de réparation PLEINE d'une unité, en secondes.
 *
 * @param {string} id
 * @param {number} niveauUnite
 * @param {number} niveauBatiment
 * @returns {number} secondes, réel
 */
export function secondesPleines(id, niveauUnite, niveauBatiment) {
  const ligne = UNITES[id];
  if (ligne === undefined) throw new RangeError(`réparation : unité « ${id} » inconnue`);
  if (!Number.isInteger(niveauUnite) || niveauUnite < 1) {
    throw new RangeError(`réparation : niveau d'unité « ${niveauUnite} » — entier ≥ 1 attendu`);
  }
  return (ligne.reparation * REPARATION.penteNiveauUnite ** (niveauUnite - 1))
    / diviseurDuBatiment(niveauBatiment);
}

/** Les PV maximaux d'une unité, en milli-PV. */
function pvMaxMilli(id, niveau) {
  return UNITES[id].pv * facteurMilli(niveau);
}

/**
 * Le niveau du bâtiment réparateur d'un châssis, ou `null` s'il n'est pas posé.
 *
 * ⚠ `null` N'EST PAS ZÉRO, et c'est la convention du dépôt depuis
 * `niveauDeCommandement` : sans le bâtiment il n'y a pas de réparation du tout,
 * pas une réparation infiniment lente. Un châssis sans son bâtiment reste
 * abîmé, et l'écran doit pouvoir le DIRE.
 *
 * @param {object} etat
 * @param {string} chassis
 * @returns {{id: string, niveau: number|null}}
 */
export function batimentDuChassis(etat, chassis) {
  const id = BATIMENT_DE_CHASSIS[chassis];
  if (id === undefined) throw new RangeError(`réparation : châssis « ${chassis} » inconnu`);
  const pose = etat.disposition.find((b) => b.id === id);
  return { id, niveau: pose === undefined ? null : pose.niveau };
}

/**
 * Les réservoirs de l'armée : un par châssis, avec ce qu'ils demandent.
 *
 * ⚠ LE TEMPS D'UN RÉSERVOIR EST LA SOMME DE SES PIÈCES, pas leur maximum. Le
 * parallélisme du modèle joue ENTRE les réservoirs, pas à l'intérieur : deux
 * Fusiliers à moitié morts demandent deux fois le temps d'un seul. C'est ce qui
 * fait qu'une armée mono-châssis s'immobilise longtemps.
 *
 * ⚠ LE TEMPS ET LE COÛT SONT PROPORTIONNELS AUX PV PERDUS. Le relevé donne le
 * temps d'une réparation PLEINE ; rien n'y dit ce que coûte une demi-réparation,
 * et la proportionnalité est la lecture la plus simple — la même que celle du
 * butin, qui paie la moitié d'un bâtiment cassé à moitié.
 *
 * @param {object} etat
 * @returns {Object<string, {batiment: string, niveauBatiment: number|null,
 *   secondes: number, scorie: number, pieces: Array<object>}>}
 */
export function reservoirsDeLArmee(etat) {
  const sortie = {};
  for (const chassis of Object.keys(BATIMENT_DE_CHASSIS)) {
    sortie[chassis] = {
      ...batimentDuChassis(etat, chassis),
      batiment: BATIMENT_DE_CHASSIS[chassis],
      secondes: 0,
      scorie: 0,
      pieces: [],
    };
  }

  for (let index = 0; index < etat.armee.length; index += 1) {
    const piece = etat.armee[index];
    const degats = piece.degatsMilli ?? 0;
    if (degats === 0) continue;
    const reservoir = sortie[UNITES[piece.id].chassis];
    if (reservoir.niveau === null) continue;

    const part = degats / pvMaxMilli(piece.id, piece.niveau);
    const secondes = secondesPleines(piece.id, piece.niveau, reservoir.niveau) * part;
    // ⚠ LE COÛT EST INDEXÉ SUR LE NIVEAU DE L'UNITÉ, « et rien d'autre » —
    // `MODELE-REPARATION-1.md` §3. Ce qui n'y est PAS écrit, c'est l'ancre : ce
    // module prend la dernière montée de l'unité comme prix d'une réparation
    // complète, et `REPARATION.partDuCoutDeMontee` est le seul nombre à changer
    // si Ethan en veut un autre. Un niveau 1 n'a jamais été monté : il est
    // gratuit à réparer, ce qui est cohérent avec un premier niveau gratuit à
    // poser.
    const scorie = piece.niveau < 2 ? 0
      : coutDeMonteeOffense(piece.id, piece.niveau).scorie * REPARATION.partDuCoutDeMontee * part;

    reservoir.secondes += secondes;
    reservoir.scorie += scorie;
    reservoir.pieces.push({ index, degatsDepart: degats, secondes });
  }
  return sortie;
}

/**
 * Le devis : ce que coûte de tout réparer, et ce que ça immobilise.
 *
 * `coût = Σ réservoirs`, `temps = max réservoirs` — `MODELE-ECONOMIQUE.md` §7.
 *
 * @param {object} etat
 * @returns {{secondes: number, scorie: number, reservoirs: object,
 *   piecesSansBatiment: number}}
 */
export function devisDeLaReparation(etat) {
  const reservoirs = reservoirsDeLArmee(etat);
  let secondes = 0;
  let scorie = 0;
  for (const r of Object.values(reservoirs)) {
    if (r.secondes > secondes) secondes = r.secondes;
    scorie += r.scorie;
  }
  let piecesSansBatiment = 0;
  for (const piece of etat.armee) {
    if ((piece.degatsMilli ?? 0) === 0) continue;
    if (batimentDuChassis(etat, UNITES[piece.id].chassis).niveau === null) piecesSansBatiment += 1;
  }
  return {
    secondes,
    scorie: Math.ceil(scorie),
    reservoirs,
    piecesSansBatiment,
  };
}

/**
 * Ce qui empêche de lancer une réparation — liste vide si tout va bien.
 *
 * @param {object} etat
 * @returns {Array<{code: string, message: string}>}
 */
export function problemesDeLaReparation(etat) {
  const problemes = [];
  if (etat.reparation !== null) {
    problemes.push({ code: 'deja-en-cours', message: 'Une réparation est déjà en cours.' });
    return problemes;
  }
  const devis = devisDeLaReparation(etat);
  if (devis.secondes === 0) {
    problemes.push({
      code: 'rien-a-reparer',
      message: devis.piecesSansBatiment > 0
        ? 'Aucun bâtiment de réparation posé pour les unités abîmées.'
        : 'Ton armée est intacte.',
    });
    return problemes;
  }
  const dispo = Math.floor(etat.economie.ressources.scorie / MILLE);
  if (dispo < devis.scorie) {
    problemes.push({
      code: 'scorie-insuffisante',
      message: `Cette réparation coûte ${devis.scorie} de scorie : il t'en manque `
        + `${devis.scorie - dispo}.`,
    });
  }
  return problemes;
}

/**
 * Lance la réparation : débite la scorie et met l'armée sur l'établi.
 *
 * ⚠ LA SCORIE SE PAIE AU LANCEMENT, comme les points d'attaque se paient au
 * départ du raid. Une réparation interrompue par un nouveau raid ne se
 * rembourse pas — c'est le pendant exact de « le bonus ne se met pas en
 * banque ».
 *
 * @param {object} etat modifié en place
 * @returns {object} l'état de la réparation lancée
 */
export function lancerLaReparation(etat) {
  const problemes = problemesDeLaReparation(etat);
  if (problemes.length > 0) {
    throw new Error(`réparation impossible — ${problemes.map((p) => p.message).join(' ; ')}`);
  }
  const devis = devisDeLaReparation(etat);
  etat.economie.ressources.scorie -= devis.scorie * MILLE;

  // ⚠ UNE PIÈCE PORTE LE TEMPS DE SON RÉSERVOIR, PAS LE SIEN — et le premier
  // jet portait le sien, ce qui faisait finir les pièces les unes après les
  // autres à l'intérieur d'un même châssis. C'est faux : « j'ai 30 minutes de
  // répa infanterie » est UN nombre pour tout le châssis, la somme de ce que
  // ses pièces demandent, et le réservoir se vide d'un bloc. Toutes les pièces
  // d'un châssis reviennent donc ensemble, au bout du temps du châssis ; le
  // parallélisme joue ENTRE les châssis, jamais à l'intérieur.
  const pieces = [];
  for (const r of Object.values(devis.reservoirs)) {
    const ticksDuReservoir = Math.ceil(r.secondes * TICKS_PAR_SECONDE);
    for (const p of r.pieces) {
      pieces.push({ index: p.index, degatsDepart: p.degatsDepart, ticks: ticksDuReservoir });
    }
  }
  etat.reparation = {
    debutTick: etat.horloge.nbTicks,
    ticks: Math.ceil(devis.secondes * TICKS_PAR_SECONDE),
    scorie: devis.scorie,
    pieces,
  };
  return etat.reparation;
}

/**
 * Rend à l'armée ce que le temps lui doit.
 *
 * ⚠ ANALYTIQUE, ET APPELÉE PAR LES DEUX CHEMINS D'AVANCEMENT. Elle ne lit que
 * l'horloge courante et les dégâts de DÉPART : mille ticks d'un coup réparent
 * exactement ce que mille ticks un par un auraient réparé. Recalculer depuis le
 * départ à chaque appel, au lieu de retrancher un peu à chaque tick, est ce qui
 * rend l'égalité exacte — une soustraction répétée accumulerait ses arrondis.
 *
 * @param {object} etat modifié en place
 * @returns {number} nombre de pièces dont les dégâts ont changé
 */
export function avancerLaReparation(etat) {
  if (etat.reparation === null || etat.reparation === undefined) return 0;
  const ecoule = etat.horloge.nbTicks - etat.reparation.debutTick;
  let touchees = 0;

  for (const p of etat.reparation.pieces) {
    const piece = etat.armee[p.index];
    if (piece === undefined) continue;
    const reste = ecoule >= p.ticks
      ? 0 : Math.round(p.degatsDepart * (1 - ecoule / p.ticks));
    if (piece.degatsMilli !== reste) touchees += 1;
    piece.degatsMilli = reste;
  }

  if (ecoule >= etat.reparation.ticks) etat.reparation = null;
  return touchees;
}

/**
 * Abandonne la réparation en cours. Ce qui est rendu reste rendu.
 *
 * ⚠ ELLE AVANCE AVANT D'ABANDONNER. Sans ça, un raid lancé au milieu d'une
 * réparation ferait perdre les dernières secondes déjà écoulées — le joueur
 * verrait ses unités remonter dans le temps.
 *
 * @param {object} etat modifié en place
 * @returns {boolean} vrai s'il y avait quelque chose à abandonner
 */
export function annulerLaReparation(etat) {
  if (etat.reparation === null || etat.reparation === undefined) return false;
  avancerLaReparation(etat);
  etat.reparation = null;
  return true;
}

/** Les défauts STRUCTURELS de la réparation en cours, pour le chargement. */
export function problemesDeLaReparationEnCours(reparation) {
  if (reparation === null) return [];
  if (typeof reparation !== 'object' || Array.isArray(reparation)) {
    return ['« reparation » n\'est ni null ni une table'];
  }
  const problemes = [];
  for (const champ of ['debutTick', 'ticks']) {
    if (!Number.isInteger(reparation[champ]) || reparation[champ] < 0) {
      problemes.push(`réparation : « ${champ} » vaut « ${reparation[champ]} »`);
    }
  }
  if (!Array.isArray(reparation.pieces)) problemes.push('réparation : « pieces » n\'est pas une liste');
  else {
    for (const p of reparation.pieces) {
      if (!Number.isInteger(p.index) || p.index < 0
        || !Number.isInteger(p.degatsDepart) || p.degatsDepart < 0
        || !Number.isInteger(p.ticks) || p.ticks < 1) {
        problemes.push(`réparation : pièce mal formée à l'indice « ${p.index} »`);
      }
    }
  }
  return problemes;
}
