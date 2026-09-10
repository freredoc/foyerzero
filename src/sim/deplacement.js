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
import { problemesDuVoisinageDesBases } from './voisinage-des-bases.js';
import { problemesDuTerritoireTenu } from './territoire-tenu.js';

/** Dixièmes de niveau par niveau — `niveauDesBatiments` rend des dixièmes. */
const DIXIEMES_PAR_NIVEAU = 10;

/** La portée d'un déplacement, AU CARRÉ — jamais de racine. */
export const PORTEE_CARREE = DEPLACEMENT.porteeMaxCases * DEPLACEMENT.porteeMaxCases;

/** Dixièmes de minute par minute — tout le calcul du délai s'y fait. */
const DIXIEMES_PAR_MINUTE = 10;

/** Minutes par heure — pour convertir les dixièmes de minute en ticks. */
const MINUTES_PAR_HEURE = 60;

/**
 * Le délai avant le prochain déplacement, en TICKS, pour ce niveau et cette
 * distance.
 *
 * ⚠⚠ LA DISTANCE EST ENTRÉE DANS LE BARÈME — lot RÈGLES-DE-CARTE, 10/09/2026.
 * Ethan : « Deux choses : coût par distance et niv. Base 1h, puis chaque niveau
 * de base rajoute 1min », puis, sur la forme exacte, « Q2 b » :
 *
 *     délai en minutes = 60 + niveau + (distance − 1)
 *
 * ⚠⚠ ET ÇA ABANDONNE LES 24 HEURES DU NIVEAU 50, qu'il faut dire avant tout le
 * reste. L'ancien barème interpolait linéairement entre 1 h au niveau 1 et 24 h
 * au niveau 50 ; le pire cas de la règle neuve — niveau 50, dix cases — rend
 * `60 + 50 + 9 = 119 minutes`, soit **1 h 59**. Le plafond est divisé par douze,
 * et `SESSION-RELEVE-BUTIN.md` §0 cesse d'être la règle sur ce point.
 *
 * ⚠⚠ EN DIXIÈMES DE NIVEAU, ET C'EST LE PIÈGE QUE CE DÉPÔT A DÉJÀ PAYÉ DEUX
 * FOIS. `niveauDesBatiments` rend `86` pour une base de niveau 8,6 ; le lire
 * comme un entier ferait croire à une base de niveau 86, donc rendrait un délai
 * bien plus long. `sim/reparation.js` l'a payé avec `niveauDeLArmee` au lot
 * RÉSERVE ; ce module-ci le documentait déjà au lot DÉPLACEMENT.
 *
 * ⚠ TOUT EN ENTIERS, LA DIVISION EN DERNIER. Le calcul se fait en DIXIÈMES DE
 * MINUTE — `600 + dixièmes + 10 × (distance − 1)` — et ne se convertit en ticks
 * qu'une fois. Une base de niveau 8,6 coûte ainsi 68,6 min à distance 1, et non
 * 68 ni 69 : arrondir le niveau avant de l'ajouter perdrait exactement ce que
 * les dixièmes servent à porter.
 *
 * ⚠⚠ ET LE NIVEAU RESTE BORNÉ AUX DEUX BOUTS, `[10, 500]` DIXIÈMES, COMME
 * AVANT — ET LA BORNE EST INERTE AUJOURD'HUI, MESURÉ. `niveauDesBatiments` rend
 * une MOYENNE de niveaux qu'`ameliorer` plafonne déjà à `NIVEAU.plafond`, et
 * `verifierEtat` refuse au chargement une disposition qui sortirait de là : la
 * retirer ne fait tomber AUCUN test, vérifié à la falsification. Elle est écrite
 * quand même parce qu'elle protège le seul bout par lequel un nombre absurde
 * pourrait entrer — un `??` sur une base vide —, et parce qu'un barème qui rend
 * une durée négative ne lèverait pas : il déverrouillerait le déplacement.
 *
 * @param {object} etat
 * @param {number} distance distance PARCOURUE, en cases entières, ≥ 1
 * @returns {number} ticks, entier ≥ 0
 */
export function delaiDeplacementTicks(etat, distance) {
  return delaiPourLaBase(baseCourante(etat), distance);
}

/**
 * Le même barème, mais sur UNE BASE plutôt que sur l'état.
 *
 * ⚠⚠ ELLE PREND UNE BASE, ET C'EST CE QUI PERMET À LA MIGRATION DE L'APPELER.
 * La v30 → v31 doit donner à chaque base la durée qu'elle aurait contractée, et
 * une migration travaille sur une SAUVEGARDE — pas sur un état monté, donc pas
 * sur `baseCourante`. Lui faire recopier la formule aurait mis deux écritures du
 * barème au dépôt, et la seconde se serait tue au premier réglage d'Ethan. C'est
 * le motif de `problemesDeLEffectif`, qui prend une liste et non un état.
 *
 * ⚠ ELLE NE LIT QUE `disposition`, donc elle ne peut rien savoir de la position :
 * la distance lui est DONNÉE. C'est voulu — la distance parcourue est un fait du
 * geste, pas une propriété de la base.
 *
 * @param {{disposition: Array}} laBase
 * @param {number} distance distance PARCOURUE, en cases entières, ≥ 1
 * @returns {number} ticks, entier ≥ 0
 */
export function delaiPourLaBase(laBase, distance) {
  if (!Number.isInteger(distance) || distance < 1
    || distance > DEPLACEMENT.porteeMaxCases) {
    throw new RangeError(
      `delaiPourLaBase : distance « ${distance} » — entier de 1 à `
      + `${DEPLACEMENT.porteeMaxCases} attendu`,
    );
  }
  const { base, parNiveau, parCaseAuDela } = DEPLACEMENT.delaiMinutes;
  const plancher = DIXIEMES_PAR_NIVEAU;
  const plafond = GEOGRAPHIE.niveauPlafond * DIXIEMES_PAR_NIVEAU;
  const brut = niveauDesBatiments(laBase.disposition) ?? plancher;
  const dixiemes = Math.min(plafond, Math.max(plancher, brut));
  const dixiemesDeMinute = base * DIXIEMES_PAR_MINUTE
    + parNiveau * dixiemes
    + parCaseAuDela * DIXIEMES_PAR_MINUTE * (distance - 1);
  return Math.round(
    (TICKS_PAR_HEURE * dixiemesDeMinute) / (MINUTES_PAR_HEURE * DIXIEMES_PAR_MINUTE),
  );
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
 * ⚠⚠ ELLE NE RECALCULE PLUS LE DÉLAI, ELLE LE RELIT — lot RÈGLES-DE-CARTE,
 * 10/09/2026, ET C'EST LE BUMP DE `SAVE_VERSION`. Tant que le délai ne dépendait
 * que du NIVEAU, le recalculer ici était juste : la base n'avait qu'un niveau, et
 * c'était celui-là. Depuis qu'il dépend de la DISTANCE PARCOURUE, le recalcul ne
 * sait plus quelle distance a été parcourue — un saut de dix cases se
 * déverrouillerait au tarif d'un saut d'une case. La base porte donc
 * `dernierDeplacementDelaiTicks`, écrit au moment du saut, à côté de l'horodatage.
 *
 * ⚠ ET C'EST UNE DURÉE FIGÉE, PAS UN COMPTE À REBOURS. La soustraction reste
 * `ecoules >= du ? 0 : du - ecoules` : deux nombres relus contre l'horloge, donc
 * rien qui puisse diverger au rattrapage. Un résiduel qui décroîtrait tick par
 * tick serait exactement ce que `rattraperJeu` passe son temps à éviter.
 *
 * ⚠ ET FIGÉE VEUT DIRE QU'AMÉLIORER SA BASE NE RALLONGE PAS UNE ATTENTE DÉJÀ
 * COMMENCÉE. C'est la bonne lecture : le joueur a contracté SON délai en
 * sautant, et monter un bâtiment ensuite ne peut pas le punir rétroactivement.
 *
 * @param {object} etat
 * @returns {number} ticks restants, 0 si aucun
 */
export function ticksAvantProchainDeplacement(etat) {
  const laBase = baseCourante(etat);
  const dernier = laBase.dernierDeplacementTick;
  if (dernier === null || dernier === undefined) return 0;
  const du = laBase.dernierDeplacementDelaiTicks;
  if (du === null || du === undefined) return 0;
  const ecoules = etat.horloge.nbTicks - dernier;
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

  // ⚠⚠ LA MÊME RÈGLE QU'À LA FONDATION, ET LA MÊME ÉCRITURE — lot
  // VOISINAGE-ET-MENACE, 08/09/2026. Ethan : « aucune base joueur/ouvrage ne
  // doit être côte à côte sur les 9 cases ». Sans cet appel, la règle ne
  // vaudrait RIEN : le joueur fonderait loin — où `problemesDeLaFondation` la
  // fait respecter — puis déplacerait sa base juste à côté de l'Ouvrage au geste
  // suivant, et le contournement serait à un toucher.
  //
  // ⚠⚠ ET IL FERME UN TROU QUI PRÉEXISTAIT AU LOT. Cette fonction ne connaissait
  // que `hors-carte`, `sur-place`, `trop-loin` et `delai` : déplacer sa base SUR
  // la case exacte d'une base de l'Ouvrage était PERMIS, et le geste l'effaçait
  // de la carte — `siteDeLaCase` rend `null` sur toute case occupée par une base
  // du joueur. Le bloc de 3 × 3 contient son centre, donc la règle le referme
  // sans qu'on ait à écrire une seconde condition.
  //
  // ⚠ LA BASE QUI BOUGE NE SE COMPTE PAS ELLE-MÊME : sa case de départ est
  // libérée par le geste. La compter ferait refuser tout saut d'une case,
  // c'est-à-dire ferait dire à la règle que la base s'encombre elle-même.
  for (const p of problemesDuVoisinageDesBases(etat, cible, laBase)) problemes.push(p);

  // ⚠⚠ LA MÊME RÈGLE QU'À LA FONDATION, ET LA MÊME ÉCRITURE — lot
  // RÈGLES-DE-CARTE, 10/09/2026. Ethan : « Je ne dois pas pouvoir poser ma base
  // dans [le] territoire ouvrage ». Elle vivait dans `problemesDeLaFondation` et
  // manquait ICI, si bien qu'on fondait loin puis qu'on sautait dans le violet
  // au geste suivant : le contournement était à un toucher, exactement comme
  // celui que VOISINAGE-ET-MENACE a fermé deux jours plus tôt.
  //
  // ⚠ APRÈS LE VOISINAGE ET AVANT LE DÉLAI, PARCE QUE L'ORDRE DES REFUS EST
  // CELUI DANS LEQUEL LE JOUEUR LES LIT. Ce qui tient à la CASE se dit d'abord —
  // hors carte, sur place, trop loin, encombrement, territoire —, et le délai
  // vient en dernier : c'est la seule raison qui s'en ira toute seule.
  //
  // ⚠⚠ ET `casesAtteignables` SUIT PAR CONSTRUCTION : elle INTERROGE cette
  // fonction au lieu de réécrire ses règles. C'est ce que `VM T8` garde depuis
  // VOISINAGE — « elle ne propose plus une case qui sera refusée » —, et ce lot
  // le vérifie plutôt que de le croire.
  //
  // ⚠⚠ CE QUE LA RÈGLE COÛTE EST MESURÉ, PAS DEVINÉ. Passé la rangée 275 le
  // joueur est IMMOBILISÉ : 20 graines sur 20 rendent ZÉRO destination aux
  // rangées 250, 200, 150, 100 et 50, contre une médiane de 6 avant le lot. La
  // porte de sortie tient — raser des bases de l'Ouvrage voisines rouvre le
  // territoire, 15 fois sur 15 — mais elle demande **4 à 10 rasages**, là où le
  // lot VOISINAGE en mesurait UN. Voir `RAPPORT-lotREGLES-DE-CARTE.md` §3 :
  // c'est un chiffre d'arbitrage, et il revient à Ethan.
  for (const p of problemesDuTerritoireTenu(etat, cible)) problemes.push(p);

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
 *
 * ⚠⚠ ET ELLE NE SERT PLUS QU'À ÉCRIRE UNE PHRASE DEPUIS LE LOT RÈGLES-DE-CARTE :
 * elle FACTURE aussi. `deplacerLaBase` la lit pour le barème du délai, et c'est
 * voulu — la distance qui se paie doit être celle que l'écran annonce. La
 * mesurer en Tchebychev ferait payer « 7 cases » à un saut que le refus
 * `trop-loin` chiffre à dix, et le joueur lirait deux nombres pour un geste.
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
 * ⚠⚠ LA BASE SE PASSE EN ARGUMENT DEPUIS BASES-1, ET LE DÉFAUT EST LA COURANTE.
 * Un rasage ne frappe pas forcément la base que le joueur regarde : l'Ouvrage
 * attaque celle qu'il a à portée, et l'écran peut être sur une autre. Laisser
 * `baseCourante` décider ici aurait déplacé la MAUVAISE base, en silence — la
 * bonne aurait gardé sa position, et le joueur aurait vu son autre base sauter
 * de vingt cases sans raison. Le défaut sert les gestes du joueur, qui agissent
 * toujours sur celle qu'il regarde.
 *
 * @param {object} etat modifié en place
 * @param {number} rangee
 * @param {number} colonne
 * @param {object} [laBase] la base à poser — la courante par défaut
 * @returns {{avant: object, apres: object, poisAjoutes: number}}
 */
export function poserLaBaseSur(etat, rangee, colonne, laBase = baseCourante(etat)) {
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
  const distance = casesEnLigneDroite(distanceCarreeCases(laBase.position, cible));
  const bilan = poserLaBaseSur(etat, cible.rangee, cible.colonne);
  laBase.dernierDeplacementTick = etat.horloge.nbTicks;
  // ⚠⚠ LES DEUX S'ÉCRIVENT ENSEMBLE, ET LA DISTANCE SE PREND AVANT LE SAUT.
  // `poserLaBaseSur` écrit `position` : la mesurer après rendrait zéro, donc le
  // délai le plus court du barème, à tous les coups et en silence.
  laBase.dernierDeplacementDelaiTicks = delaiDeplacementTicks(etat, distance);
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
