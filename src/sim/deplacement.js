// LA BASE BOUGE — lot DÉPLACEMENT, 02/09/2026.
//
// Ethan : « tout se débloque lorsqu'on pourra bouger la base ». Ce module porte
// le geste, son barème et son unique écriture.
//
// ⚠⚠ UN SEUL CODE DÉPLACE LA BASE, ET C'EST `poserLaBaseSur`. Il y en avait
// déjà un avant ce lot — `raserLaBase` de `sim/raid-ouvrage.js`, qui descend la
// base de vingt rangées après un rasage. Il n'a PAS été dupliqué : il appelle
// celui-ci. Deux codes qui déplacent la base divergeraient, et le dépôt a déjà
// payé cette faute-là deux fois (`site-entame` contre `montageCourant` au lot
// RAID-A, `MODELE-REPARATION-1` contre `sim/reparation` au lot RÉSERVE).
//
// ⚠⚠ LE TERRAIN NE SUIT PAS LA BASE, ET C'EST ARBITRÉ DEPUIS LE 27/08.
// `etat.champs` et `etat.obstacles` dérivent de `fondation`, jamais de
// `position` ; `serialiser` les redéduit de `fondation` à chaque chargement.
// Ethan : « une fois qu'il a posé sa base, les champs de quartz et de scorie ne
// changent plus jamais, sinon ça casserait les collecteurs et le schéma ».
// **Conséquence, et c'est une bonne nouvelle** : aucun bâtiment ne peut se
// retrouver sur un obstacle après un déplacement, aucun collecteur ne perd son
// champ. Ce module ne touche donc PAS à la disposition — ne pas « corriger »
// cette apparente incohérence, elle est le mécanisme.
//
// Ce qui bouge, en revanche : le territoire (`sim/territoire.js` rend
// `[etat.position]`), les POI à portée, le rayon des anneaux de satellites
// (`satellites.js` lit `niveauDeLaRangee(etat.position.rangee)`) et les cibles
// à portée.

import { DEPLACEMENT, GEOGRAPHIE } from '../data/sites.js';
import { TICKS_PAR_HEURE } from './clock.js';
import { estSurLaCarte } from './carte.js';
import { releverLesPoisAcquis } from './poi.js';
import { niveauDesBatiments } from './niveau-de-base.js';
import { distanceCarreeCases } from './points-attaque.js';
import { baseCourante } from './base-courante.js';

/** Dixièmes de niveau par niveau — `niveauDesBatiments` rend des dixièmes. */
const DIXIEMES_PAR_NIVEAU = 10;

/** La portée d'un déplacement, AU CARRÉ — jamais de racine. */
export const PORTEE_CARREE = DEPLACEMENT.porteeMaxCases * DEPLACEMENT.porteeMaxCases;

/**
 * Le délai entre deux déplacements, en TICKS, au niveau où la base est.
 *
 * ⚠⚠ EN DIXIÈMES DE NIVEAU, ET C'EST LE PIÈGE DU LOT. `niveauDesBatiments` rend
 * `58` pour une base de niveau 5,8 ; le lire comme un entier ferait croire à une
 * base de niveau 58, donc rendrait le délai du niveau 50 dès le niveau 5,8 —
 * un délai DIX FOIS trop long. `sim/reparation.js` a payé exactement ce
 * piège-là avec `niveauDeLArmee` au lot RÉSERVE.
 *
 * ⚠ TOUT EN ENTIERS, ET LA DIVISION VIENT EN DERNIER. L'interpolation est
 * linéaire entre les deux bouts de `DEPLACEMENT.delaiHeures` ; multiplier avant
 * de diviser garde le calcul exact, et `TICKS_PAR_HEURE` fait de la sortie un
 * nombre de ticks entier, comparable à `etat.horloge.nbTicks` sans arrondi.
 *
 * ⚠ ET LE NIVEAU EST BORNÉ AUX DEUX BOUTS. Une base vide rendrait `null`, une
 * base de niveau 50 rendrait 500 : hors de [10, 500], l'interpolation sortirait
 * du barème et rendrait un délai négatif ou plus long que celui du niveau 50.
 *
 * @param {object} etat
 * @returns {number} ticks, entier ≥ 0
 */
export function delaiDeplacementTicks(etat) {
  const laBase = baseCourante(etat);
  const { depart, niveau50 } = DEPLACEMENT.delaiHeures;
  const plancher = DIXIEMES_PAR_NIVEAU;
  const plafond = GEOGRAPHIE.niveauPlafond * DIXIEMES_PAR_NIVEAU;
  const brut = niveauDesBatiments(laBase.disposition) ?? plancher;
  const dixiemes = Math.min(plafond, Math.max(plancher, brut));
  const portee = plafond - plancher;
  const heuresMilli = (depart * (plafond - dixiemes) + niveau50 * (dixiemes - plancher));
  return Math.round((TICKS_PAR_HEURE * heuresMilli) / portee);
}

/**
 * Combien de ticks il reste à attendre avant le prochain déplacement — `0` si
 * la base peut partir tout de suite.
 *
 * ⚠⚠ UN HORODATAGE, JAMAIS UN COMPTE À REBOURS. Un résiduel qui décroîtrait
 * tick par tick divergerait au rattrapage — c'est très exactement la faute que
 * `rattraperJeu` passe son temps à éviter. Un instant relu contre l'horloge ne
 * peut pas diverger : il ne dépend pas du chemin par lequel on y est arrivé.
 *
 * ⚠ PREMIER DÉPLACEMENT : AUCUNE ATTENTE, ET ÇA S'ÉCRIT. `dernierDeplacementTick`
 * vaut `null` sur une partie neuve, PAS zéro. Un zéro se lirait « déplacé au
 * tick 0 », ce qui est vrai par accident aujourd'hui — l'horloge y démarre — et
 * cesserait de l'être le jour où une partie commencerait ailleurs.
 *
 * @param {object} etat
 * @returns {number} ticks restants, 0 si aucun
 */
export function ticksAvantProchainDeplacement(etat) {
  const laBase = baseCourante(etat);
  const dernier = laBase.dernierDeplacementTick;
  if (dernier === null || dernier === undefined) return 0;
  const ecoules = etat.horloge.nbTicks - dernier;
  const du = delaiDeplacementTicks(etat);
  return ecoules >= du ? 0 : du - ecoules;
}

/**
 * Ce qui empêche ce déplacement — liste vide si rien.
 *
 * ⚠ ELLE REND UNE LISTE DE PHRASES, PAS UN BOOLÉEN, et c'est la convention du
 * dépôt : `problemesDuRaid`, `problemesDeLaPose`, `manquePourPayer`. « Il te
 * reste 3 h 20 » est une phrase ; `false` n'en est pas une, et l'écran ne peut
 * rien en faire d'autre que griser un bouton muet.
 *
 * @param {object} etat
 * @param {{rangee: number, colonne: number}} cible
 * @returns {Array<{code: string, message: string}>}
 */
export function problemesDuDeplacement(etat, cible) {
  const laBase = baseCourante(etat);
  const problemes = [];
  if (cible === null || typeof cible !== 'object'
    || !Number.isInteger(cible.rangee) || !Number.isInteger(cible.colonne)) {
    throw new TypeError('deplacement : la cible n\'est pas une case entière');
  }

  // ⚠⚠ ON REFUSE, ON NE RABOTE PAS. `raserLaBase` avance case par case et
  // s'arrête au bord ; c'est juste pour une SANCTION, qui n'a qu'une direction
  // et que personne n'a demandée. Un déplacement voulu a deux axes : le joueur a
  // DÉSIGNÉ une case, il doit obtenir celle-là ou un refus motivé. La rabatte
  // silencieuse le poserait ailleurs qu'où il a touché.
  if (!estSurLaCarte(cible.rangee, cible.colonne)) {
    problemes.push({
      code: 'hors-carte',
      message: 'Cette case est en dehors de la carte.',
    });
    return problemes;
  }

  const carre = distanceCarreeCases(laBase.position, cible);
  if (carre === 0) {
    problemes.push({
      code: 'sur-place',
      message: 'La base est déjà là.',
    });
    return problemes;
  }
  if (carre > PORTEE_CARREE) {
    problemes.push({
      code: 'trop-loin',
      message: `Cette case est à ${casesEnLigneDroite(carre)} cases en ligne `
        + `droite : la base ne se déplace que de ${DEPLACEMENT.porteeMaxCases}.`,
    });
  }

  const reste = ticksAvantProchainDeplacement(etat);
  if (reste > 0) {
    problemes.push({
      code: 'delai',
      message: `La base vient de se déplacer : il reste ${enDuree(reste)} à attendre.`,
    });
  }
  return problemes;
}

/**
 * La distance en cases entières, arrondie au supérieur — POUR L'AFFICHAGE.
 *
 * ⚠ SANS `Math.sqrt`, comme `casesArrondiesAuSuperieur` de
 * `sim/points-attaque.js`, dont c'est la copie de contrat. On ne l'importe pas :
 * ce module-ci n'a pas besoin du reste de `points-attaque.js`, et la boucle
 * tient en trois lignes. ⚠ Si une TROISIÈME arrivait, il faudrait les réunir.
 */
function casesEnLigneDroite(carre) {
  let n = 0;
  while (n * n < carre) n += 1;
  return n;
}

/**
 * Une durée en ticks, dite en heures et minutes — « 3 h 20 », « 45 min ».
 *
 * ⚠ ELLE VIT ICI ET NON DANS L'ÉCRAN parce que c'est le MESSAGE de refus qui la
 * porte, et que le message est produit par la simulation. Le reformuler dans
 * `ui/` créerait une seconde formulation qui finirait par dire autre chose que
 * la règle — c'est ce que `CLAUDE.md` §6 dit déjà des refus de pose.
 */
function enDuree(ticks) {
  const minutes = Math.ceil((ticks * 60) / TICKS_PAR_HEURE);
  if (minutes < 60) return `${minutes} min`;
  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  return reste === 0 ? `${heures} h` : `${heures} h ${reste}`;
}

/**
 * LE SEUL ENDROIT QUI ÉCRIVE `etat.position`.
 *
 * ⚠⚠ IL NE VÉRIFIE NI LA PORTÉE NI LE DÉLAI, ET C'EST VOULU. Ses deux appelants
 * n'ont pas les mêmes règles : un déplacement voulu se refuse au-delà de dix
 * cases et attend son délai, un rasage tombe dessus sans rien demander. Ce qui
 * leur est COMMUN, c'est l'écriture et ses conséquences — et c'est cela, et
 * cela seul, qui ne doit exister qu'en un exemplaire.
 *
 * ⚠ IL LÈVE HORS CARTE, il ne rabote pas. Les deux appelants ont déjà décidé où
 * poser ; arriver ici avec une case hors carte est un fait de PROGRAMME.
 *
 * ⚠⚠ `releverLesPoisAcquis` EST RAPPELÉ ICI, ET C'EST LA MOITIÉ QUI SE PERD.
 * L'oublier laisserait le joueur avec les POI de son ANCIENNE position et sans
 * ceux de la nouvelle — et **rien ne casserait**, donc aucun test ne le dirait,
 * à moins de l'écrire. `raid-ouvrage.js` le faisait déjà pour le rasage ; le
 * remonter ici, c'est en faire une propriété du DÉPLACEMENT plutôt qu'une
 * précaution de l'un de ses appelants.
 *
 * ⚠ ET LE RELEVÉ AJOUTE, IL NE RECALCULE PAS. `poisAcquis` est acquis
 * DÉFINITIVEMENT — arbitrage du 31/08 —, et `releverLesPoisAcquis` n'ajoute que
 * ce qui manque. Une implémentation qui reconstruirait la liste depuis la
 * nouvelle position retirerait les anciens sans que personne ne s'en aperçoive
 * avant longtemps.
 *
 * ⚠ `fondation` N'EST PAS TOUCHÉE, et ce module ne la nomme qu'ici, pour dire
 * qu'il n'y touche pas.
 *
 * @param {object} etat modifié en place
 * @param {number} rangee
 * @param {number} colonne
 * @returns {{avant: object, apres: object, poisAjoutes: number}}
 */
export function poserLaBaseSur(etat, rangee, colonne) {
  const laBase = baseCourante(etat);
  if (!estSurLaCarte(rangee, colonne)) {
    throw new RangeError(
      `deplacement : (${rangee}, ${colonne}) est hors de la carte`,
    );
  }
  const avant = { rangee: laBase.position.rangee, colonne: laBase.position.colonne };
  laBase.position.rangee = rangee;
  laBase.position.colonne = colonne;
  const poisAjoutes = releverLesPoisAcquis(etat);
  return { avant, apres: { rangee, colonne }, poisAjoutes };
}

/**
 * Le geste du joueur : déplacer sa base sur une case qu'il a désignée.
 *
 * ⚠ ELLE LÈVE là où `problemesDuDeplacement` rend une liste, et c'est la même
 * distinction que partout : un déplacement refusé est un fait de JEU, qu'on
 * montre au joueur ; appeler celle-ci sans avoir regardé est un fait de
 * PROGRAMME.
 *
 * ⚠ L'HORODATAGE S'ÉCRIT ICI ET PAS DANS `poserLaBaseSur`, et la nuance porte
 * une règle : un RASAGE ne consomme pas le délai du joueur. La sanction est déjà
 * la plus lourde du jeu ; lui faire aussi perdre son droit de bouger le
 * punirait deux fois, et l'empêcherait précisément de fuir l'endroit où il vient
 * de se faire raser. **Lecture prise, à signaler.**
 *
 * @param {object} etat modifié en place
 * @param {{rangee: number, colonne: number}} cible
 * @returns {{avant: object, apres: object, poisAjoutes: number}}
 */
export function deplacerLaBase(etat, cible) {
  const laBase = baseCourante(etat);
  const problemes = problemesDuDeplacement(etat, cible);
  if (problemes.length > 0) {
    throw new Error(
      `deplacement impossible — ${problemes.map((p) => p.message).join(' ; ')}`,
    );
  }
  const bilan = poserLaBaseSur(etat, cible.rangee, cible.colonne);
  laBase.dernierDeplacementTick = etat.horloge.nbTicks;
  return bilan;
}

/**
 * Les cases où la base peut aller, pour que l'écran les montre.
 *
 * ⚠ ELLE INTERROGE `problemesDuDeplacement`, elle ne réécrit pas ses règles.
 * C'est le motif de `casesPosables` de l'écran Chantier : une seconde liste de
 * règles finirait par diverger, et l'écran proposerait une case que le geste
 * refuse.
 *
 * @param {object} etat
 * @returns {Array<{rangee: number, colonne: number}>}
 */
export function casesAtteignables(etat) {
  const laBase = baseCourante(etat);
  const r0 = laBase.position.rangee;
  const c0 = laBase.position.colonne;
  const portee = DEPLACEMENT.porteeMaxCases;
  const cases = [];
  for (let r = r0 - portee; r <= r0 + portee; r += 1) {
    for (let c = c0 - portee; c <= c0 + portee; c += 1) {
      if (problemesDuDeplacement(etat, { rangee: r, colonne: c }).length > 0) continue;
      cases.push({ rangee: r, colonne: c });
    }
  }
  return cases;
}
