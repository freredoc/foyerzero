// L'acte de raid — la boucle refermée.
//
// Tout ce qu'il fallait existait déjà, épars : `sim/points-attaque.js` sait ce
// qu'un raid coûte, `sim/site-de-la-case.js` sait ce qu'il y a sur une case,
// `sim/site-entame.js` sait ce qui reste debout, `sim/combat.js` sait résoudre.
// Ce module est le seul endroit qui les appelle dans l'ordre, et il n'ajoute
// aucune règle de combat.
//
// ⚠ IL ÉCRIT DANS QUATRE ENDROITS DE L'ÉTAT, ET C'EST LA RAISON DE SON
// EXISTENCE. Un raid débite les points d'attaque, verse le butin dans
// l'économie, range les points de recherche, marque le site, et rapporte les
// dégâts sur l'armée. Éparpiller ces cinq écritures chez leurs propriétaires
// respectifs aurait rendu impossible de dire ce qu'un raid fait.
//
// ⚠ L'ARMÉE DU JOUEUR EST CELLE QU'IL A POSÉE, pas un profil du banc.
// `genererAssaut` compose une armée théorique pour mesurer des courbes ; ici,
// les quatre vagues de `etat.armee` deviennent les quatre vagues du raid, avec
// leurs dégâts en cours. C'est tout l'écart entre le banc d'essai et le jeu.
//
// ⚠ UNE UNITÉ DÉTRUITE NE PART PAS, ET ELLE N'EST PAS PERDUE. Arbitré le 28/08 :
// « les unités sont détruites mais pas perdues ». Elles planchent à 1 PV
// (`MODELE-REPARATION-1.md` §2), restent dans la grille de composition, et
// attendent une réparation. Une unité au plancher ne peut pas être montée —
// `creerCombat` refuse un `pvMilli` nul et une unité à 1 PV ne sert à rien —,
// donc elle reste à la maison sans qu'on la retire.

import { APRES_RAID, TYPES_SITE } from '../data/sites.js';
import { UNITES, GRILLE } from '../data/combat.js';
import { RESSOURCES, capacitesMilli } from './economie-base.js';
import {
  coutDUnRaid, manquePourPayer, payer, distanceTchebychev, basesDuJoueur,
} from './points-attaque.js';
import { siteDeLaCase } from './site-de-la-case.js';
import { annulerLaReparation } from './reparation.js';
import { montageCourant, enregistrerLeRaid } from './site-entame.js';
import {
  creerCombat, resoudre, butin, pointsRecherche, facteurMilli, TICKS_MAX_COMBAT,
} from './combat.js';
import { GEOGRAPHIE } from '../data/sites.js';
import { creerAcquises, modulesDebloquesDuJoueur } from './recherche.js';

/** Un millier — l'échelle des milli-PV et des milli-unités. */
const MILLE = 1000;

/**
 * L'état neuf de la recherche : le compteur, et ce qui est déjà acquis.
 *
 * ⚠ LE COMPTEUR RESTE ICI, LES ACQUISES VIENNENT DE `sim/recherche.js`. Le lot
 * RECHERCHE ne touche pas à la façon dont les points ENTRENT — c'est
 * `pointsRecherche` qui les fabrique, ligne 253 — il ajoute une SORTIE. Les deux
 * moitiés se composent ici, à un seul endroit, pour qu'une partie neuve et une
 * sauvegarde migrée aient exactement la même forme.
 *
 * Voir `RECHERCHE_EN_CHAINE` juste dessous pour la raison de la chaîne décimale.
 */
export function creerRecherche() {
  return { pointsMilli: '0', ...creerAcquises() };
}

// ⚠ LES POINTS DE RECHERCHE SE RANGENT EN CHAÎNE DÉCIMALE, PAS EN NOMBRE, et
// `sim/combat.js` l'exige déjà dans son en-tête : le barème dépasse
// `Number.MAX_SAFE_INTEGER` dès le niveau 39 pour le Broyeur, donc le compteur
// est un BigInt — et `JSON.stringify` LÈVE sur un BigInt. La chaîne est la seule
// forme qui traverse une sauvegarde sans perdre un chiffre. Elle se relit par
// `BigInt(x)`, jamais par `Number(x)`.
export const RECHERCHE_EN_CHAINE = true;

/** Le total de recherche du joueur, en milli-points, exact. */
export function rechercheMilli(etat) {
  return BigInt(etat.recherche.pointsMilli);
}

/**
 * Les PV maximaux d'une unité du joueur à ce niveau, en milli-PV.
 *
 * ⚠ MÊME FORMULE QUE `creerCombat`, ET C'EST VOULU QU'ELLE SOIT ICI AUSSI : il
 * faut connaître le maximum AVANT de monter le combat, pour savoir si une unité
 * abîmée peut encore partir. `facteurMilli` est la seule courbe en jeu, et elle
 * vient du moteur — rien n'est recopié d'une table.
 *
 * @param {string} id
 * @param {number} niveau
 * @returns {number} milli-PV
 */
export function pvMaxDeLUnite(id, niveau) {
  const ligne = UNITES[id];
  if (ligne === undefined) throw new RangeError(`raid : unité « ${id} » inconnue`);
  return ligne.pv * facteurMilli(niveau);
}

/**
 * Les vagues du raid, tirées de l'armée posée.
 *
 * Rend aussi la liste des INDICES de `etat.armee` dans l'ordre de montage : le
 * moteur rend ses attaquants dans le même ordre, et c'est ce qui permet de
 * reporter les dégâts sur les bonnes pièces sans chercher qui est qui.
 *
 * ⚠ L'ORDRE COMPTE, ET IL EST DOUBLEMENT TRIÉ. Par vague d'abord — les rangs
 * d'entrée du raid —, par colonne ensuite, parce que la colonne EST le couloir
 * dans lequel l'unité descend. Une armée rangée dans l'ordre où le joueur l'a
 * posée entrerait dans le désordre.
 *
 * @param {object} etat
 * @returns {{vagues: Array<Array<object>>, indices: Array<number>}}
 */
export function composerLesVagues(etat) {
  const parVague = new Map();
  const ordonnees = etat.armee
    .map((piece, index) => ({ piece, index }))
    .sort((a, b) => a.piece.vague - b.piece.vague || a.piece.colonne - b.piece.colonne);

  const indices = [];
  for (const { piece, index } of ordonnees) {
    const pvMax = pvMaxDeLUnite(piece.id, piece.niveau);
    const pv = pvMax - (piece.degatsMilli ?? 0);
    // Au plancher ou en dessous : elle reste à la maison. Elle n'est pas
    // retirée de l'armée pour autant — elle attend d'être réparée.
    if (pv <= APRES_RAID.plancherPvMilli) continue;
    if (!parVague.has(piece.vague)) parVague.set(piece.vague, []);
    const unite = { id: piece.id, colonne: piece.colonne, niveau: piece.niveau };
    // ⚠ `pvMilli` N'EST POSÉ QUE SI L'UNITÉ EST ABÎMÉE. Le passer toujours
    // ferait entrer le forçage explicite de `creerCombat` sur le chemin
    // ordinaire, et une unité intacte serait montée par une autre route que
    // celle que les raids de référence empruntent.
    if (pv < pvMax) unite.pvMilli = pv;
    parVague.get(piece.vague).push(unite);
    indices.push(index);
  }

  const vagues = [...parVague.keys()].sort((a, b) => a - b).map((v) => parVague.get(v));
  return { vagues, indices };
}

/**
 * Ce qui empêche ce raid — liste vide si tout va bien.
 *
 * ⚠ ELLE REND UNE LISTE, ELLE NE LÈVE PAS, comme les `problemesDe…` de
 * `sim/state.js` : l'écran doit pouvoir griser un bouton et DIRE pourquoi. C'est
 * `executerRaid` qui lève, et seulement si on l'appelle quand même.
 *
 * @param {object} etat
 * @param {{position: object}} baseAttaquante
 * @param {{rangee: number, colonne: number}} cible
 * @returns {Array<{code: string, message: string}>}
 */
export function problemesDuRaid(etat, baseAttaquante, cible) {
  const problemes = [];
  const site = siteDeLaCase(etat, cible.rangee, cible.colonne);
  if (site === null) {
    problemes.push({ code: 'sans-cible', message: 'Il n\'y a rien à attaquer sur cette case.' });
    return problemes;
  }

  const distance = distanceTchebychev(baseAttaquante.position, cible);
  if (distance > GEOGRAPHIE.rayonAttaque) {
    problemes.push({
      code: 'hors-portee',
      message: `Cette cible est à ${distance} cases : le rayon d'attaque est de `
        + `${GEOGRAPHIE.rayonAttaque}.`,
    });
    return problemes;
  }

  const cout = coutDUnRaid(etat, baseAttaquante, cible);
  const manque = manquePourPayer(etat.attaque, cout);
  if (manque !== null) {
    problemes.push({
      code: 'points-insuffisants',
      message: `Ce raid coûte ${cout} points d'attaque : il t'en manque ${manque}.`,
    });
  }

  const { vagues } = composerLesVagues(etat);
  if (vagues.length === 0) {
    problemes.push({
      code: 'sans-armee',
      message: 'Aucune unité en état de partir : compose ton armée ou répare-la.',
    });
  }
  return problemes;
}

/**
 * Verse une ressource dans l'économie et dit ce qui n'a pas tenu.
 *
 * ⚠⚠ LE BUTIN SATURE, ET CE N'EST PAS ARBITRÉ — c'est la lecture que ce lot
 * retient, et elle tient en une ligne. Trois raisons :
 *   — sans elle, les quatre bâtiments de stockage du jeu perdent la moitié de
 *     leur raison d'être ; on ne monterait plus jamais une Gangue ;
 *   — le premier camp d'une partie neuve rapporte 4 050 quartz pour une capacité
 *     de 50, soit QUATRE-VINGTS FOIS le coffre. Sans plafond, le premier raid
 *     saute les huit premiers niveaux de progression ;
 *   — « rien ne se retire en silence » n'est pas violé : on ne rogne aucun stock
 *     existant, on refuse un versement qui ne rentre pas — et le rapport le DIT,
 *     champ `butinPerdu`, pour que l'écran puisse l'écrire.
 * Le surplus DÉJÀ présent, lui, reste gelé comme l'a arbitré le 26/08 : le
 * plafond effectif est `max(capacité, stock)`, jamais moins que ce qu'on a.
 *
 * @returns {number} ce qui n'a pas pu entrer, en milli-unités
 */
function verser(economie, capacites, ressource, gainMilli) {
  const actuel = economie.ressources[ressource];
  const cap = capacites[ressource] ?? 0;
  const plafond = actuel > cap ? actuel : cap;
  const place = plafond - actuel;
  if (gainMilli <= place) {
    economie.ressources[ressource] = actuel + gainMilli;
    return 0;
  }
  economie.ressources[ressource] = plafond;
  return gainMilli - place;
}

/**
 * Lance un raid, du paiement au retour.
 *
 * @param {object} etat modifié en place
 * @param {{position: object}} baseAttaquante
 * @param {{rangee: number, colonne: number}} cible
 * @param {{maxTicks?: number}} [options]
 * @returns {object} rapport du raid
 */
export function executerRaid(etat, baseAttaquante, cible, options = {}) {
  const problemes = problemesDuRaid(etat, baseAttaquante, cible);
  if (problemes.length > 0) {
    throw new Error(`raid impossible — ${problemes.map((p) => p.message).join(' ; ')}`);
  }

  const site = siteDeLaCase(etat, cible.rangee, cible.colonne);
  const cout = coutDUnRaid(etat, baseAttaquante, cible);
  // ⚠ ON PAIE AVANT DE PARTIR, et jamais après. Un raid raté coûte ses points :
  // c'est ce qui fait du choix de cible une décision. Payer au retour ferait de
  // l'échec une répétition gratuite.
  payer(etat.attaque, cout);
  // ⚠ LE BONUS DE RÉPARATION NE SE MET PAS EN BANQUE. Ethan, le 29/08 : « les
  // points de réparation bonus disparaissent si on refait un raid avec la même
  // armée ». Ce qui a déjà été rendu reste rendu — `annulerLaReparation` avance
  // d'abord — mais le temps restant est perdu, et la scorie payée ne se
  // rembourse pas.
  annulerLaReparation(etat);

  // ⚠ LES MODULES DU JOUEUR ENTRENT PAR LE MONTAGE, JAMAIS PAR L'ÉTAT LU AU VOL.
  // Le combat est déterministe et rejouable : tout ce qui gouverne la boucle
  // doit être dans le montage, qui est sérialisé. Un raid rejoué depuis une
  // sauvegarde doit rendre le même résultat au tick près.
  //
  // ⚠ `joueur`, PAS `ouvrage`. `pointsRecherche` lit `modulesDebloques.ouvrage`
  // pour majorer les points de 20 % sur une cible dont le module est débloqué :
  // c'est le camp d'en face et une autre grandeur. Les confondre ferait payer au
  // joueur les modules de l'Ouvrage.
  const montageSite = montageCourant(etat, site);
  const montage = {
    ...montageSite,
    modulesDebloques: {
      ouvrage: montageSite.modulesDebloques?.ouvrage ?? [],
      joueur: modulesDebloquesDuJoueur(etat),
    },
  };
  const { vagues, indices } = composerLesVagues(etat);
  const resultat = resoudre(
    creerCombat({ ...montage, vagues }),
    { maxTicks: options.maxTicks ?? TICKS_MAX_COMBAT },
  );

  // --- le butin entre dans l'économie ---------------------------------------
  const gagne = butin(resultat, montage);
  const capacites = capacitesMilli(etat.disposition);
  const verse = {};
  const perdu = {};
  for (const ressource of RESSOURCES) {
    const unites = gagne[ressource] ?? 0;
    if (unites === 0) continue;
    const resteMilli = verser(etat.economie, capacites, ressource, unites * MILLE);
    verse[ressource] = unites - Math.floor(resteMilli / MILLE);
    if (resteMilli > 0) perdu[ressource] = Math.floor(resteMilli / MILLE);
  }

  // --- les points de recherche se rangent -----------------------------------
  const gagnesMilli = pointsRecherche(resultat, montage);
  etat.recherche.pointsMilli = (rechercheMilli(etat) + gagnesMilli).toString();

  // --- le site garde ses dégâts ---------------------------------------------
  const verdict = enregistrerLeRaid(etat, site, resultat);

  // --- l'armée revient abîmée -----------------------------------------------
  const degats = reporterLesDegats(etat, resultat, indices);

  return {
    cible: site,
    cout,
    cause: resultat.cause,
    ticks: resultat.tick,
    butin: verse,
    butinPerdu: perdu,
    rechercheMilli: gagnesMilli.toString(),
    rase: verdict.rase,
    unitesEngagees: indices.length,
    unitesAuPlancher: degats.auPlancher,
    pointsRestants: etat.attaque.points,
  };
}

/**
 * Reporte les dégâts du combat sur les pièces de l'armée.
 *
 * ⚠ L'APPARIEMENT SE FAIT PAR L'ORDRE, et c'est le même contrat que celui du
 * site entamé : `creerCombat` insère les vagues dans l'ordre où elles sont
 * données, `construireResultat` les rend dans l'ordre d'insertion. La liste
 * d'indices produite par `composerLesVagues` est donc alignée sur
 * `resultat.attaquants`, et un décalage se verrait tout de suite — une unité
 * abîmée porterait les dégâts d'une autre.
 *
 * ⚠ LE PLANCHER À 1 PV, ET LA PIÈCE RESTE DANS L'ARMÉE. Une unité détruite n'est
 * pas retirée : elle est ramenée au plancher et attend sa réparation. C'est
 * l'arbitrage du 28/08, et c'est ce qui distingue le joueur d'un camp de
 * l'Ouvrage, où tout ce qui tombe est perdu.
 */
function reporterLesDegats(etat, resultat, indices) {
  if (resultat.attaquants.length !== indices.length) {
    throw new Error(
      `raid : ${resultat.attaquants.length} attaquants rendus pour ${indices.length} engagés — `
      + 'l\'ordre de montage ne correspond plus',
    );
  }
  let auPlancher = 0;
  for (let i = 0; i < indices.length; i += 1) {
    const ligne = resultat.attaquants[i];
    const piece = etat.armee[indices[i]];
    const pv = ligne.pvMilli > APRES_RAID.plancherPvMilli
      ? ligne.pvMilli : APRES_RAID.plancherPvMilli;
    if (pv === APRES_RAID.plancherPvMilli) auPlancher += 1;
    piece.degatsMilli = ligne.pvMaxMilli - pv;
  }
  return { auPlancher };
}

/** Exporté pour le test qui croise les quatre vagues et la grille de combat. */
export const VAGUES_DU_RAID = GRILLE.vaguesParRaid;

/** Exporté pour le test qui vérifie que tous les types de site sont attaquables. */
export const TYPES_ATTAQUABLES = Object.keys(TYPES_SITE);
