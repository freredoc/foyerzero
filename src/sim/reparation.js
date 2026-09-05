// La réparation du joueur — des réserves de temps qui s'accumulent, et se vident.
//
// ⚠⚠ IL Y EN A QUATRE DEPUIS LE 05/09, PAS TROIS, ET CE FICHIER N'EN PORTAIT QUE
// TROIS. `MODELE-REPARATION-1.md` §4, réécrit ce jour-là : trois réservoirs de
// CHÂSSIS paient les unités d'assaut, un quatrième paie les BÂTIMENTS et il est
// produit par le Chantier de construction. La version du 24/08 disait que les
// deux puisaient dans la même réserve ; `MODELE-ECONOMIQUE.md` §7 disait déjà
// « quatre réservoirs — infanterie, véhicules, aviation, base » sans que
// personne ne rapproche les deux documents.
//
// ⚠⚠ ET C'EST CE QUI CASSE LE CLIQUET, CÔTÉ MOTEUR. `sim/raid-ouvrage.js` pose
// les bâtiments du joueur à 1 PV et, jusqu'ici, RIEN ne les en faisait remonter
// — `AUDIT-REPARATION.md` §4 : « un raid subi laisse la base du joueur à 1 PV,
// et rien au monde ne l'en fait remonter. Le raid suivant la traverse. » Le lot
// BARÈME a écrit les nombres, ce module les branche. ⚠ Le cliquet n'est refermé
// que pour le MOTEUR : aucun écran n'appelle encore ces fonctions.
//
// ⚠ LES DEUX MOITIÉS SONT DISJOINTES, ET ELLES DOIVENT LE RESTER. Une pièce
// d'armée se paie en SCORIE sur la réserve de son châssis ; un bâtiment se paie
// en QUARTZ sur la réserve de base. Il n'y a pas de « tout réparer » qui
// traverse les deux : il échouerait en bloc parce qu'un seul des deux
// réservoirs est à sec. Deux fonctions, deux boutons le jour venu.
//
// ⚠⚠ CE MODULE A CHANGÉ DE MODÈLE LE 01/09/2026, ET L'ANCIEN ÉTAIT UNE
// DIVERGENCE, PAS UN CHOIX. `MODELE-REPARATION-1.md` §4, dicté le 24/08 :
//
//   « Le temps de réparation est une GRANDEUR QUI S'ACCUMULE, à la manière d'un
//   idle, et que toute réparation consomme. »
//
// Le code avait implémenté autre chose : une réparation qui DURE —
// `etat.reparation`, un `debutTick`, des PV rendus au fil des ticks, une
// annulation par le raid. La divergence est restée invisible huit jours parce
// qu'aucun écran n'appelait jamais la réparation. Ethan a tranché le 01/09 : le
// stock est le bon modèle, ET IL Y EN A UN PAR CHÂSSIS.
//
// ⚠ LA RAISON DE CONCEPTION, DITE PAR ETHAN. Avec une réparation qui dure,
// enchaîner les raids est impossible : on perd une armée, on attend une
// demi-heure, et pendant ce temps la défense de la cible s'est réparée toute
// seule. Avec une réserve, on accumule pendant qu'on ne joue pas, puis on lance
// plusieurs raids d'affilée en réparant entre chaque.
//
// ⚠ LE PARALLÉLISME DE `MODELE-ECONOMIQUE.md` §7 SURVIT, SOUS UNE AUTRE FORME.
// Il ne joue plus sur une durée — il n'y a plus de durée — mais sur trois
// stocks qui se remplissent EN MÊME TEMPS et se vident SÉPARÉMENT. Concentrer
// ses pertes sur un châssis vide son réservoir pendant que les deux autres
// restent pleins. La phrase d'Ethan du 29/08 — « je répare complètement mes
// véhicules, j'ai 20 minutes d'infanterie gratuites » — reste vraie mot pour
// mot, et pour une raison plus simple qu'avant : le temps d'infanterie n'a
// jamais été dépensé.
//
// ⚠ CE QUI NE CHANGE PAS, ET IL FAUT LE SAVOIR AVANT DE TOUCHER À CE FICHIER :
// la courbe `T(L, C)` de `RELEVE-TA-COURBES-2.md` §4, le diviseur du bâtiment
// réparateur et sa rupture au niveau 12, le prorata des dégâts, le coût en
// SCORIE indexé sur le niveau de l'unité, et la convention `null ≠ zéro` sur le
// bâtiment absent. Seul le MÉCANISME DE CONSOMMATION est neuf.
//
// ⚠ LE NIVEAU DU BÂTIMENT NE CRÉDITE RIEN, IL DÉCOTE. Le taux de crédit est de
// 1 pour 1 pour tout le monde : une seconde écoulée est une seconde créditée,
// dans les trois réservoirs à la fois. Le niveau du bâtiment rend les
// réparations MOINS CHÈRES — `diviseurDuBatiment` —, et c'est son seul effet.
// L'appliquer aussi au crédit le compterait deux fois.
//
// ⚠ RÉPARER EST INSTANTANÉ ET SE PAIE D'AVANCE. Débit du temps, débit de la
// scorie et retour des PV se font dans le MÊME appel ; il n'y a plus rien « en
// cours », donc plus rien à annuler — et c'est pourquoi `annulerLaReparation` a
// disparu d'`executerRaid`. L'arbitrage du 29/08 (« les points de réparation
// bonus disparaissent si on refait un raid ») portait sur le modèle à durée :
// il est CADUC, et non contredit.

import { UNITES } from '../data/combat.js';
import {
  BASE_BATIMENTS, BATIMENT_DE_CHASSIS, REPARATION_BASE_JOUEUR, coutDeMontee,
} from '../data/base.js';
import { ECONOMIE_NIVEAU } from '../data/economie.js';
import { coutDeMonteeOffense } from '../data/couts-militaires.js';
import { REPARATION } from '../data/sites.js';
import { TICKS_PAR_SECONDE, TICKS_PAR_HEURE } from './clock.js';
import { facteurMilli } from './combat.js';
import { niveauDeLArmee, niveauDesBatiments } from './niveau-de-base.js';
import { baseCourante } from './base-courante.js';

/** Un millier — l'échelle des milli-PV et des milli-ressources. */
const MILLE = 1000;

/**
 * ⚠ `niveauDeLArmee` REND DES DIXIÈMES DE NIVEAU. Le plafond s'exprime en
 * heures par niveau ENTIER ; sans cette division il serait dix fois trop grand,
 * et c'est la faute la plus facile de tout ce module.
 */
const DIXIEMES_PAR_NIVEAU = 10;

/** Les trois châssis réparables, dans l'ordre de la table qui fait foi. */
export const CHASSIS_REPARABLES = Object.freeze(Object.keys(BATIMENT_DE_CHASSIS));

/**
 * Le diviseur du bâtiment réparateur — `D(C)` du relevé.
 *
 * ⚠ LA RUPTURE EST AU NIVEAU 12, PAS AU 11. Quatre systèmes changent de régime
 * au 11 — dégâts, coûts des bâtiments, coûts des unités — et celui-ci fait
 * exception : le relevé mesure `÷1,09` jusqu'au 12 inclus, puis `÷1,12`. Aligner
 * la rupture sur les autres « pour faire propre » déplacerait la série mesurée.
 *
 * ⚠⚠ UNE SEULE IMPLÉMENTATION, DEUX TABLES, ET C'EST VOULU. Les bâtiments
 * passent par cette fonction-ci — jamais par une seconde copie de la formule —
 * mais avec LEUR jeu de pentes, `REPARATION_BASE_JOUEUR.courbe.diviseurBatiment`.
 * Les deux tables portent aujourd'hui les mêmes trois nombres, et ce n'est PAS
 * une redondance à supprimer : celle de l'armée est MESURÉE (Exosoldats à
 * Caserne 10 puis 12, rapport 1,1874 = 1,09² à un millième), celle des bâtiments
 * est reprise « par analogie et sans preuve » — aucune des trente captures du
 * 05/09 ne montre l'effet du Chantier sur le temps de réparation d'un bâtiment.
 * Le jour où une capture le montrera, c'est la seconde qui bougera, et elle
 * seule. Lire la table de l'armée pour les bâtiments ferait de ce commentaire-là
 * un mensonge, et rendrait ce jour-là invisible.
 *
 * @param {number} niveau niveau du bâtiment réparateur
 * @param {{penteBasse: number, penteHaute: number, niveauRupture: number}} pentes
 * @returns {number} diviseur, ≥ 1
 */
export function diviseurDuBatiment(niveau, pentes = REPARATION.diviseurBatiment) {
  if (!Number.isInteger(niveau) || niveau < 1) {
    throw new RangeError(`réparation : niveau de bâtiment « ${niveau} » — entier ≥ 1 attendu`);
  }
  const { penteBasse, penteHaute, niveauRupture } = pentes;
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
  const laBase = baseCourante(etat);
  const id = BATIMENT_DE_CHASSIS[chassis];
  if (id === undefined) throw new RangeError(`réparation : châssis « ${chassis} » inconnu`);
  const pose = laBase.disposition.find((b) => b.id === id);
  return { id, niveau: pose === undefined ? null : pose.niveau };
}

// ---------------------------------------------------------------------------
// La réserve : trois stocks de temps, en TICKS
// ---------------------------------------------------------------------------

/**
 * Trois réservoirs à zéro — la réserve d'une base neuve.
 *
 * ⚠ EN TICKS ENTIERS, JAMAIS EN SECONDES FLOTTANTES, et la raison est
 * l'équivalence des deux chemins d'avancement. Créditer en secondes ferait
 * diverger `tickJeu` appelé mille fois de `rattraperJeu(1000)` par accumulation
 * d'arrondis. En entiers, créditer `n` d'un coup est IDENTIQUEMENT `n` crédits
 * de 1 — l'addition est exacte, et le plafond est un `min`, qui l'est aussi.
 *
 * @returns {Object<string, number>}
 */
export function reservesVides() {
  const sortie = {};
  for (const chassis of CHASSIS_REPARABLES) sortie[chassis] = 0;
  return sortie;
}

/**
 * Le plafond d'un réservoir, en ticks — le même pour les trois.
 *
 * « 12 h en début de partie, +1 h par niveau d'armée », Ethan, 01/09. Les deux
 * nombres vivent dans `REPARATION` de `data/sites.js`, jamais ici.
 *
 * ⚠⚠ `niveauDeLArmee` REND DES DIXIÈMES, ET IL PEUT RENDRE `null`. Une armée
 * vide n'a pas un niveau zéro, elle n'a pas de niveau : le plafond y vaut 12 h
 * tout rond. Traiter sa sortie comme un niveau entier ferait un plafond dix
 * fois trop grand.
 *
 * ⚠ UN SEUL `Math.floor`, EN BOUT DE CHAÎNE. Arrondir au milieu — les heures,
 * puis les ticks — perdrait la fraction de niveau que les dixièmes portent
 * justement.
 *
 * @param {object} etat
 * @returns {number} ticks
 */
export function plafondDeLaReserve(etat) {
  return plafondDeLaReserveDeLaBase(baseCourante(etat));
}

/**
 * Le même plafond, lu sur une BASE.
 *
 * ⚠⚠ ELLE EXISTE POUR LA BOUCLE DE `crediterLesReserves` — lot BASES-1. Le
 * plafond dépend du niveau de l'armée de CETTE base : créditer toutes les bases
 * au plafond de la courante donnerait à une base sans armée la réserve d'une
 * base équipée, ou l'inverse. C'est le piège que le §5.3 du brief nomme.
 *
 * @param {{ armee: Array }} base
 * @returns {number} plafond en ticks
 */
export function plafondDeLaReserveDeLaBase(base) {
  const dixiemes = niveauDeLArmee(base.armee) ?? 0;
  const heures = REPARATION.plafondHeures
    + REPARATION.plafondHeuresParNiveauArmee * (dixiemes / DIXIEMES_PAR_NIVEAU);
  return Math.floor(heures * TICKS_PAR_HEURE);
}

/**
 * Le plafond de la QUATRIÈME réserve, celle des bâtiments — en ticks.
 *
 * « 12 h, plus 1 h par niveau de bâtiments » : la même règle que les trois
 * autres, mais indexée sur une autre grandeur et lue dans une autre table.
 * Les deux nombres vivent dans `REPARATION_BASE_JOUEUR` de `data/base.js`,
 * jamais ici, et jamais dans le `REPARATION` de `data/sites.js` — celui-là est
 * la réserve de l'ARMÉE, et ses champs portent déjà ces noms-là.
 *
 * ⚠⚠ `niveauDesBatiments` NE REND PAS `null` — ELLE LÈVE, et il ne faut PAS
 * recopier ici le `?? 0` de la fonction ci-dessus. Les deux ne décrivent pas le
 * même monde : une armée VIDE est l'état normal de toute base neuve, alors
 * qu'une base sans un seul bâtiment n'existe pas — elle porte toujours son
 * Chantier (`problemesDeDisposition` refuse `sans-chantier`, qui n'est pas dans
 * `CODES_TOLERES_AU_CHARGEMENT`), et les bâtiments du joueur planchent à 1 PV
 * sans jamais mourir. Un `?? 0` transformerait donc une invariante violée en
 * plafond de 12 h silencieux.
 *
 * ⚠ UN SEUL `Math.floor`, EN BOUT DE CHAÎNE, exactement comme l'existante :
 * arrondir les heures puis les ticks perdrait la fraction de niveau que les
 * dixièmes portent justement.
 *
 * @param {{ disposition: Array }} base
 * @returns {number} plafond en ticks
 */
export function plafondDeLaReserveDesBatiments(base) {
  const dixiemes = niveauDesBatiments(base.disposition);
  const heures = REPARATION_BASE_JOUEUR.plafondHeures
    + REPARATION_BASE_JOUEUR.plafondHeuresParNiveauBatiments
      * (dixiemes / DIXIEMES_PAR_NIVEAU);
  return Math.floor(heures * TICKS_PAR_HEURE);
}

/**
 * Crédite les trois réservoirs du temps qui vient de passer, au taux 1 pour 1.
 *
 * ⚠⚠ UN SEUL APPEL, PAS UNE BOUCLE — même forme que `resoudreSatellites` et
 * `avancerPointsAttaque` : `min(plafond, reserve + n)` est exactement ce que
 * `n` crédits de 1 auraient donné, l'addition d'entiers et le `min` étant tous
 * deux exacts et le second idempotent.
 *
 * ⚠ ET VOICI SA CONDITION DE RUPTURE, ÉCRITE. L'équivalence tient parce que le
 * PLAFOND NE BOUGE PAS pendant le rattrapage : il ne dépend que du niveau de
 * l'armée, et l'armée ne se compose pas hors ligne. Le jour où elle pourra
 * monter de niveau en cours de rattrapage, le plafond deviendra une fonction du
 * temps et cette ligne cessera d'être juste — un réservoir plafonné tôt puis
 * relevé tard ne rattrape pas ce qu'il a perdu. C'est le test d'équivalence des
 * deux chemins qui doit tomber en premier.
 *
 * @param {object} etat modifié en place
 * @param {number} nbTicks
 */
export function crediterLesReserves(etat, nbTicks) {
  if (!Number.isInteger(nbTicks) || nbTicks < 0) {
    throw new RangeError(`réparation : « ${nbTicks} » ticks — entier ≥ 0 attendu`);
  }
  // ⚠⚠ TOUTES LES BASES, PAS SEULEMENT LA COURANTE — lot BASES-1, 02/09/2026.
  // C'est l'une des trois conditions de rupture que le rapport de BASES-0 avait
  // NOMMÉES, et le commentaire de `reserveReparation` dans `sim/state.js` le
  // disait mot pour mot : « `crediterLesReserves` devra boucler dessus ». Sans la
  // boucle, la base qu'on ne regarde pas n'accumulerait jamais de temps de
  // réparation, et le joueur le verrait comme un bogue d'économie.
  //
  // ⚠ CHACUNE À SON PROPRE PLAFOND. Il dépend du niveau de SON armée : un
  // plafond commun ferait déborder la base sans armée et brider celle qui en a.
  for (const base of etat.bases) {
    const plafond = plafondDeLaReserveDeLaBase(base);
    for (const chassis of CHASSIS_REPARABLES) {
      const avant = base.reserveReparation[chassis];
      base.reserveReparation[chassis] = Math.min(plafond, avant + nbTicks);
    }
    // ⚠⚠ LE QUATRIÈME RÉSERVOIR, DANS LA MÊME BOUCLE ET AVEC SON PROPRE
    // PLAFOND. Le sien dépend du niveau des BÂTIMENTS, celui des trois autres du
    // niveau de l'ARMÉE : les confondre donnerait à une base neuve — armée vide,
    // Chantier de niveau 1 — un plafond de bâtiments de 12 h tout rond alors
    // qu'elle en mérite 12,1, et à une base équipée l'inverse.
    //
    // ⚠⚠ ET SA CONDITION DE RUPTURE N'EST PAS CELLE DES TROIS AUTRES. Là-haut,
    // l'équivalence tient parce qu'on ne compose pas d'armée hors ligne. Ici
    // elle tient pour une autre raison, et il faut l'écrire : `ameliorer` est
    // INSTANTANÉE et déclenchée par le joueur — il n'y a pas de file de
    // construction —, donc `niveauDesBatiments` ne peut pas changer PENDANT un
    // rattrapage. Le jour où une amélioration prendra du temps, cette ligne
    // cessera d'être juste : un réservoir plafonné tôt puis relevé tard ne
    // rattrape pas ce qu'il a perdu. C'est le test d'équivalence des deux
    // chemins qui doit tomber en premier.
    const plafondBatiments = plafondDeLaReserveDesBatiments(base);
    base.reserveReparationBatiments = Math.min(
      plafondBatiments, base.reserveReparationBatiments + nbTicks,
    );
  }
}

// ---------------------------------------------------------------------------
// Ce que coûte une réparation
// ---------------------------------------------------------------------------

/**
 * Ce que coûte de remettre à neuf la pièce d'indice `index` — ou `null` si
 * elle n'a rien à réparer, et `niveauBatiment: null` si son bâtiment manque.
 *
 * ⚠ LE TEMPS ET LE COÛT SONT PROPORTIONNELS AUX PV PERDUS. Le relevé donne le
 * temps d'une réparation PLEINE ; rien n'y dit ce que coûte une demi-réparation,
 * et la proportionnalité est la lecture la plus simple — la même que celle du
 * butin, qui paie la moitié d'un bâtiment cassé à moitié.
 *
 * @param {object} etat
 * @param {number} index
 * @returns {{chassis: string, batiment: string, niveauBatiment: number|null,
 *   part: number, secondes: number, ticks: number, scorie: number}|null}
 */
export function coutDeLaReparation(etat, index) {
  const laBase = baseCourante(etat);
  const piece = laBase.armee[index];
  if (piece === undefined) throw new RangeError(`réparation : pièce « ${index} » absente`);
  const degats = piece.degatsMilli ?? 0;
  if (degats === 0) return null;

  const chassis = UNITES[piece.id].chassis;
  const { id: batiment, niveau: niveauBatiment } = batimentDuChassis(etat, chassis);
  const part = degats / pvMaxMilli(piece.id, piece.niveau);
  // ⚠ LE COÛT EST INDEXÉ SUR LE NIVEAU DE L'UNITÉ, « et rien d'autre » —
  // `MODELE-REPARATION-1.md` §3. Ce qui n'y est PAS écrit, c'est l'ancre : ce
  // module prend la dernière montée de l'unité comme prix d'une réparation
  // complète, et `REPARATION.partDuCoutDeMontee` est le seul nombre à changer
  // si Ethan en veut un autre. Un niveau 1 n'a jamais été monté : il est
  // gratuit à réparer, ce qui est cohérent avec un premier niveau gratuit à
  // poser.
  const scorie = piece.niveau < 2 ? 0
    : coutDeMonteeOffense(piece.id, piece.niveau).scorie * REPARATION.partDuCoutDeMontee * part;

  // Sans bâtiment il n'y a pas de temps à calculer : `secondesPleines` voudrait
  // un niveau, et il n'y en a pas. Le coût en scorie, lui, ne dépend pas du
  // bâtiment et reste juste — l'écran peut donc annoncer ce que la réparation
  // coûterait une fois le bâtiment posé.
  if (niveauBatiment === null) {
    return {
      chassis, batiment, niveauBatiment: null, part, secondes: 0, ticks: 0, scorie,
    };
  }
  const secondes = secondesPleines(piece.id, piece.niveau, niveauBatiment) * part;
  return {
    chassis,
    batiment,
    niveauBatiment,
    part,
    secondes,
    ticks: Math.ceil(secondes * TICKS_PAR_SECONDE),
    scorie,
  };
}

/**
 * Les réservoirs de l'armée : un par châssis, avec ce que ses pièces demandent.
 *
 * ⚠ LE TEMPS D'UN RÉSERVOIR EST LA SOMME DE SES PIÈCES, pas leur maximum. Deux
 * Fusiliers à moitié morts demandent deux fois le temps d'un seul.
 *
 * ⚠ CE `secondes` N'EST PLUS UNE DURÉE, C'EST UNE DEMANDE. Sous le modèle à
 * chronomètre il disait combien de temps le châssis serait immobilisé ; il dit
 * maintenant combien de réserve il faudrait pour tout remettre à neuf. Rien ne
 * s'immobilise plus.
 *
 * @param {object} etat
 * @returns {Object<string, {batiment: string, niveau: number|null,
 *   secondes: number, ticks: number, scorie: number, pieces: Array<object>}>}
 */
export function reservoirsDeLArmee(etat) {
  const laBase = baseCourante(etat);
  const sortie = {};
  for (const chassis of CHASSIS_REPARABLES) {
    sortie[chassis] = {
      ...batimentDuChassis(etat, chassis),
      batiment: BATIMENT_DE_CHASSIS[chassis],
      secondes: 0,
      ticks: 0,
      scorie: 0,
      pieces: [],
    };
  }

  for (let index = 0; index < laBase.armee.length; index += 1) {
    const cout = coutDeLaReparation(etat, index);
    if (cout === null) continue;
    const reservoir = sortie[cout.chassis];
    // ⚠ SANS SON BÂTIMENT, LA PIÈCE N'ENTRE PAS DANS LE RÉSERVOIR. Elle est
    // comptée à part par `devisDeLaReparation`, qui sait la nommer.
    if (reservoir.niveau === null) continue;

    reservoir.secondes += cout.secondes;
    reservoir.ticks += cout.ticks;
    reservoir.scorie += cout.scorie;
    reservoir.pieces.push({
      index, degatsDepart: laBase.armee[index].degatsMilli, secondes: cout.secondes,
      ticks: cout.ticks,
    });
  }
  return sortie;
}

/**
 * Le devis : ce que coûte de tout réparer.
 *
 * ⚠ `temps = max(réservoirs)` A DISPARU AVEC LE CHRONOMÈTRE. Ce maximum disait
 * la durée d'immobilisation, et il n'y a plus d'immobilisation : chaque châssis
 * puise dans SON stock, donc ce que l'opération coûte au joueur est la SOMME
 * des trois. Le détail par châssis reste dans `reservoirs`, et c'est lui qui
 * compte — un total de temps ne se dépense nulle part.
 *
 * @param {object} etat
 * @returns {{secondes: number, scorie: number, reservoirs: object,
 *   piecesSansBatiment: number}}
 */
export function devisDeLaReparation(etat) {
  const laBase = baseCourante(etat);
  const reservoirs = reservoirsDeLArmee(etat);
  let secondes = 0;
  let scorie = 0;
  for (const r of Object.values(reservoirs)) {
    secondes += r.secondes;
    scorie += r.scorie;
  }
  let piecesSansBatiment = 0;
  for (const piece of laBase.armee) {
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

// ---------------------------------------------------------------------------
// Réparer — débit et retour des PV dans le même appel
// ---------------------------------------------------------------------------
//
// ⚠ `problemesDe…` REND LE MANQUE, PAS UN BOOLÉEN. C'est la convention établie
// par `manquePourPayer` et par `problemesDuRaid` : « il te manque 7 minutes »
// est une phrase, `false` n'en est pas une. L'écran reprend ces messages mot
// pour mot plutôt que d'en reformuler d'autres.

/**
 * Le nom affiché d'un bâtiment réparateur.
 *
 * ⚠ LE LIBELLÉ VIENT DE `BASE_BATIMENTS`, JAMAIS D'ICI. Recopier « Aérodrome »
 * dans ce module donnerait un second jeu de libellés, qui divergerait au premier
 * renommage — et le joueur verrait deux noms pour le même bâtiment. C'est la
 * faute qu'`ui/chantier.js` a déjà payée sur les clés affichées à la place des
 * libellés.
 */
function nomDuBatiment(id) {
  return BASE_BATIMENTS[id].nom.joueur;
}

/** Le manque de temps, dit en minutes ou en heures selon sa taille. */
function direLaDuree(ticks) {
  const secondes = ticks / TICKS_PAR_SECONDE;
  if (secondes < 60) return `${Math.ceil(secondes)} s`;
  if (secondes < 3600) return `${Math.ceil(secondes / 60)} min`;
  return `${(secondes / 3600).toFixed(1)} h`;
}

/**
 * Une ressource disponible dans la base courante, en unités entières.
 *
 * ⚠ UNE SEULE FONCTION POUR LES DEUX MOITIÉS. L'armée se paie en scorie, les
 * bâtiments en quartz ; en écrire deux donnerait deux conversions milli → unité
 * voisines, dont une seule serait corrigée le jour où l'échelle changera.
 *
 * @param {object} etat
 * @param {'quartz'|'scorie'|'electricite'} cle
 * @returns {number}
 */
function ressourceDisponible(etat, cle) {
  const laBase = baseCourante(etat);
  return Math.floor(laBase.economie.ressources[cle] / MILLE);
}

/**
 * Ce qui empêche de réparer LA pièce d'indice `index` — liste vide si c'est
 * payable.
 *
 * @param {object} etat
 * @param {number} index
 * @returns {Array<{code: string, message: string}>}
 */
export function problemesDeLaReparationDUnePiece(etat, index) {
  const laBase = baseCourante(etat);
  const cout = coutDeLaReparation(etat, index);
  if (cout === null) {
    return [{ code: 'rien-a-reparer', message: 'Cette unité est intacte.' }];
  }
  if (cout.niveauBatiment === null) {
    return [{
      code: 'sans-batiment',
      message: `Sans ${nomDuBatiment(cout.batiment)}, cette unité ne peut pas être réparée.`,
    }];
  }
  const problemes = [];
  const reserve = laBase.reserveReparation[cout.chassis];
  if (reserve < cout.ticks) {
    problemes.push({
      code: 'reserve-insuffisante',
      message: `Cette réparation demande ${direLaDuree(cout.ticks)} de réserve : `
        + `il t'en manque ${direLaDuree(cout.ticks - reserve)}.`,
    });
  }
  const du = Math.ceil(cout.scorie);
  const dispo = ressourceDisponible(etat, 'scorie');
  if (dispo < du) {
    problemes.push({
      code: 'scorie-insuffisante',
      message: `Cette réparation coûte ${du} de scorie : il t'en manque ${du - dispo}.`,
    });
  }
  return problemes;
}

/**
 * Répare la pièce d'indice `index` : débite le temps, débite la scorie, rend
 * les PV. Lève si ce n'est pas payable.
 *
 * ⚠⚠ RIEN N'EST DÉBITÉ SI LA RÉPARATION N'A PAS LIEU — ni le temps, ni la
 * scorie. On demande d'abord, on agit ensuite, comme `poser` et comme le raid :
 * un débit partiel suivi d'un échec est le pire des trois états possibles, et
 * c'est le seul que le joueur ne pourrait pas comprendre.
 *
 * ⚠ RÉPARATION PLEINE UNIQUEMENT. Si la réserve ne suffit pas, on ne répare
 * pas — arbitré le 01/09. Il n'y a pas de demi-réparation qui viderait le
 * réservoir sans rendre l'unité au combat.
 *
 * @param {object} etat modifié en place
 * @param {number} index
 * @returns {{chassis: string, ticks: number, scorie: number}} ce qui a été payé
 */
export function reparerUnePiece(etat, index) {
  const laBase = baseCourante(etat);
  const problemes = problemesDeLaReparationDUnePiece(etat, index);
  if (problemes.length > 0) {
    throw new Error(`réparation impossible — ${problemes.map((p) => p.message).join(' ; ')}`);
  }
  const cout = coutDeLaReparation(etat, index);
  const scorie = Math.ceil(cout.scorie);
  laBase.reserveReparation[cout.chassis] -= cout.ticks;
  laBase.economie.ressources.scorie -= scorie * MILLE;
  laBase.armee[index].degatsMilli = 0;
  return { chassis: cout.chassis, ticks: cout.ticks, scorie };
}

/**
 * Ce qui empêche de tout réparer — liste vide si l'armée entière est payable.
 *
 * @param {object} etat
 * @returns {Array<{code: string, message: string}>}
 */
export function problemesDeToutReparer(etat) {
  const laBase = baseCourante(etat);
  const devis = devisDeLaReparation(etat);
  if (devis.secondes === 0) {
    return [{
      code: 'rien-a-reparer',
      message: devis.piecesSansBatiment > 0
        ? 'Aucun bâtiment de réparation posé pour les unités abîmées.'
        : 'Ton armée est intacte.',
    }];
  }
  const problemes = [];
  for (const chassis of CHASSIS_REPARABLES) {
    const demande = devis.reservoirs[chassis].ticks;
    const reserve = laBase.reserveReparation[chassis];
    if (demande > reserve) {
      problemes.push({
        code: 'reserve-insuffisante',
        message: `Réserve ${chassis} : il manque ${direLaDuree(demande - reserve)}.`,
      });
    }
  }
  const dispo = ressourceDisponible(etat, 'scorie');
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
 * Répare tout ce qui est payable, et rend le compte de ce qui ne l'était pas.
 *
 * ⚠⚠ CE N'EST PAS UNE BOUCLE QUI S'ARRÊTE À LA PREMIÈRE ERREUR. Une pièce
 * impayable — son bâtiment manque, sa réserve est trop courte — ne doit pas
 * empêcher les suivantes d'être réparées : sinon l'ordre du tableau `etat.armee`
 * déciderait de qui rentre au combat, et cet ordre est invisible pour le joueur.
 *
 * ⚠ CE QUI RESTE ORDONNÉ, ET QUI EST ASSUMÉ : quand la réserve d'un châssis
 * s'épuise EN COURS DE ROUTE, ce sont les pièces les plus basses dans le tableau
 * qui ont été servies. C'est inévitable dès lors qu'une réparation est pleine ou
 * rien ; l'écran laissera le joueur réparer pièce par pièce s'il veut choisir.
 *
 * @param {object} etat modifié en place
 * @returns {{reparees: number, impayables: number, ticks: object, scorie: number}}
 */
export function toutReparer(etat) {
  const laBase = baseCourante(etat);
  const ticks = reservesVides();
  let reparees = 0;
  let impayables = 0;
  let scorie = 0;
  for (let index = 0; index < laBase.armee.length; index += 1) {
    if (coutDeLaReparation(etat, index) === null) continue;
    if (problemesDeLaReparationDUnePiece(etat, index).length > 0) {
      impayables += 1;
      continue;
    }
    const paye = reparerUnePiece(etat, index);
    ticks[paye.chassis] += paye.ticks;
    scorie += paye.scorie;
    reparees += 1;
  }
  return { reparees, impayables, ticks, scorie };
}

// ---------------------------------------------------------------------------
// Les BÂTIMENTS — quatrième réserve, quartz, et le Chantier qui décote
// ---------------------------------------------------------------------------
//
// ⚠ TOUT CE QUI SUIT EST LE MIROIR DE CE QUI PRÉCÈDE, ET LES TROIS ENDROITS OÙ
// LA SYMÉTRIE MENT SONT NOMMÉS À LEUR LIGNE : le plafond se lit sur les
// bâtiments et non sur l'armée, le bâtiment qui décote est TOUJOURS là (donc
// `null` n'est pas une réponse possible), et il décote par son NIVEAU et non par
// ses PV — le contraire du Complexe de défense.

/**
 * Le Chantier de construction posé dans une base.
 *
 * ⚠⚠ ELLE LÈVE PLUTÔT QUE DE RENDRE `null`, ET C'EST LA PREMIÈRE DISSYMÉTRIE
 * AVEC `batimentDuChassis`. Là-bas, `null` dit un fait de JEU : le joueur n'a
 * pas encore posé sa Caserne, et l'écran doit pouvoir le dire. Ici il n'y a
 * rien à dire — une base sans Chantier n'existe pas : `problemesDeDisposition`
 * rend `sans-chantier`, ce code n'est pas dans `CODES_TOLERES_AU_CHARGEMENT`, et
 * un Chantier tombé RASE la base au lieu de la laisser sans central. Une
 * invariante violée est un fait de PROGRAMME.
 *
 * ⚠ LE NOM DU BÂTIMENT VIENT DE LA DONNÉE, PAS D'ICI.
 * `REPARATION_BASE_JOUEUR.indexeeSur` le nomme depuis l'arbitrage du 29/08, et
 * l'écrire en dur ferait la seconde vérité que ce champ existe pour éviter.
 *
 * @param {{ disposition: Array }} laBase
 * @returns {{ id: string, niveau: number }}
 */
function chantierDeLaBase(laBase) {
  const id = REPARATION_BASE_JOUEUR.indexeeSur;
  const pose = laBase.disposition.find((b) => b.id === id);
  if (pose === undefined) {
    throw new RangeError(
      `réparation : aucun « ${id} » dans la disposition — une base sans son central n'existe pas`,
    );
  }
  return pose;
}

/** Les PV maximaux d'un bâtiment de la base, en milli-PV. */
function pvMaxDuBatimentMilli(id, niveau) {
  const ligne = BASE_BATIMENTS[id];
  if (ligne === undefined) throw new RangeError(`réparation : bâtiment « ${id} » inconnu`);
  return ligne.pv * facteurMilli(niveau);
}

/**
 * Le temps de réparation PLEINE d'un bâtiment, en secondes.
 *
 *     T(n, Chantier) = reparationSec × 1,1767^(n−1) / D(Chantier)
 *
 * ⚠ 1,1767 EST UNE CINQUIÈME PENTE, ET ELLE NE REPOSE QUE SUR UN COUPLE — le
 * Collecteur relevé aux niveaux 55 et 56, 36 071 s → 42 445 s. Ni 1,10 (les PV),
 * ni 1,15 (la réparation d'armée), ni 1,32 (les coûts). Elle vit dans
 * `REPARATION_BASE_JOUEUR.courbe`, qui porte cet avertissement en toutes lettres.
 *
 * @param {string} id
 * @param {number} niveau niveau du bâtiment réparé
 * @param {number} niveauChantier
 * @returns {number} secondes, réel
 */
export function secondesPleinesDUnBatiment(id, niveau, niveauChantier) {
  const ligne = BASE_BATIMENTS[id];
  if (ligne === undefined) throw new RangeError(`réparation : bâtiment « ${id} » inconnu`);
  if (!Number.isInteger(niveau) || niveau < 1) {
    throw new RangeError(`réparation : niveau de bâtiment « ${niveau} » — entier ≥ 1 attendu`);
  }
  const { penteNiveau, diviseurBatiment } = REPARATION_BASE_JOUEUR.courbe;
  return (ligne.reparationSec * penteNiveau ** (niveau - 1))
    / diviseurDuBatiment(niveauChantier, diviseurBatiment);
}

/**
 * Ce que coûte de remettre à neuf le bâtiment d'indice `index` — ou `null` s'il
 * n'a rien à réparer.
 *
 * ⚠ LE TEMPS ET LE COÛT SONT PROPORTIONNELS AUX PV PERDUS, comme pour l'armée et
 * pour la même raison : le relevé donne le prix d'une réparation PLEINE, rien
 * n'y dit ce que coûte une demi-réparation, et la proportionnalité est la
 * lecture la plus simple — la même que celle du butin, qui paie la moitié d'un
 * bâtiment cassé à moitié.
 *
 * ⚠⚠ LE CHANTIER DÉCOTE PAR SON NIVEAU, PAS PAR SES PV, ET C'EST LA TROISIÈME
 * DISSYMÉTRIE. Un Chantier à 1 PV décote autant qu'un Chantier intact. Ce n'est
 * pas mesuré — aucune capture ne montre un réparateur abîmé — et surtout, c'est
 * l'INVERSE du Complexe de défense, qui répare « au prorata de ses PV »
 * (`MODELE-REPARATION-1.md` §6 point 5). Les deux sont volontairement
 * différents : aligner l'un sur l'autre en croyant corriger un oubli changerait
 * une règle de jeu, et rendrait une base rasée d'un cheveu irréparable au moment
 * exact où elle en a besoin.
 *
 * ⚠⚠ LA RÉPARATION EST GRATUITE DANS LE BAS D'ÉCHELLE, ET C'EST L'ARRONDI AU
 * PLUS PROCHE QUI LE DIT — PAS UNE RÈGLE ÉCRITE. `MODELE-REPARATION-1.md` §3 :
 * « jusqu'au niveau 5, 6 POUR LA CLASSE LA PLUS LÉGÈRE : le prix d'un palier y
 * pèse moins d'une DEMI-unité de ressource ». Mesuré sur les onze bâtiments,
 * c'est exactement ce que l'arrondi au plus proche rend, et lui seul : au
 * niveau 5 les quatre classes valent 0,348 · 0,230 · 0,152 · 0,087, donc zéro
 * pour tout le monde ; au niveau 6 la classe `mineur` vaut **0,478** — sous la
 * demie — quand `modeste` est à 0,896 et `courant` à 1,287. Une TRONCATURE
 * rendrait `modeste` gratuite au niveau 6 elle aussi, donc DEUX classes au lieu
 * d'une, et un `Math.ceil` — celui du coût en scorie de l'armée — ne rendrait
 * jamais zéro au-dessus du niveau 1. La frontière du relevé départage les trois
 * lectures, et c'est la seule mesure qui les départage. ⚠ LE TEMPS, LUI, N'EST
 * JAMAIS NUL : un bâtiment de niveau 1 se répare gratuitement, pas
 * instantanément.
 *
 * @param {object} etat
 * @param {number} index indice dans `disposition`
 * @returns {{batiment: string, niveau: number, niveauChantier: number,
 *   part: number, secondes: number, ticks: number, quartz: number}|null}
 */
export function coutDeLaReparationDUnBatiment(etat, index) {
  const laBase = baseCourante(etat);
  const pose = laBase.disposition[index];
  if (pose === undefined) throw new RangeError(`réparation : bâtiment « ${index} » absent`);
  const degats = pose.degatsMilli ?? 0;
  if (degats === 0) return null;

  const niveauChantier = chantierDeLaBase(laBase).niveau;
  const part = degats / pvMaxDuBatimentMilli(pose.id, pose.niveau);
  const secondes = secondesPleinesDUnBatiment(pose.id, pose.niveau, niveauChantier) * part;
  // ⚠ LE PRIX DU NIVEAU ATTEINT, DIVISÉ PAR 230 — `MODELE-REPARATION-1.md` §3,
  // mesuré le 05/09 sur l'Accumulateur 62 (1/230,3) et la Centrale 48 (1/230,4).
  // Un bâtiment de niveau 1 n'a jamais été monté : `coutDeMontee` LÈVE dessus
  // plutôt que de rendre zéro, et sa réparation est gratuite — cohérent avec un
  // premier niveau gratuit à poser.
  const quartz = pose.niveau < ECONOMIE_NIVEAU.premierNiveauPayant ? 0
    : (coutDeMontee(pose.id, pose.niveau).quartz
      / REPARATION_BASE_JOUEUR.courbe.diviseurDuCout) * part;

  return {
    batiment: pose.id,
    niveau: pose.niveau,
    niveauChantier,
    part,
    secondes,
    ticks: Math.ceil(secondes * TICKS_PAR_SECONDE),
    quartz,
  };
}

/**
 * Le devis de la base : ce que coûterait de tout remettre debout.
 *
 * ⚠ LE TEMPS EST LA SOMME DES BÂTIMENTS, pas leur maximum — il n'y a plus
 * d'immobilisation depuis le lot RÉSERVE, et un total de temps qui ne se dépense
 * nulle part ne veut rien dire. Ici tout se dépense dans le MÊME réservoir, ce
 * qui rend la somme encore plus littérale que du côté de l'armée.
 *
 * @param {object} etat
 * @returns {{secondes: number, ticks: number, quartz: number, batiments: number}}
 */
export function devisDeLaReparationDesBatiments(etat) {
  const laBase = baseCourante(etat);
  let secondes = 0;
  let ticks = 0;
  let quartz = 0;
  let batiments = 0;
  for (let index = 0; index < laBase.disposition.length; index += 1) {
    const cout = coutDeLaReparationDUnBatiment(etat, index);
    if (cout === null) continue;
    secondes += cout.secondes;
    ticks += cout.ticks;
    // ⚠⚠ ON SOMME DES ARRONDIS, ON N'ARRONDIT PAS LA SOMME, ET C'EST DÉLIBÉRÉ.
    // `toutReparerLesBatiments` appelle `reparerUnBatiment` bâtiment par
    // bâtiment, donc il débite un arrondi par bâtiment : un devis qui
    // arrondirait la somme des parts exactes annoncerait un prix que l'opération
    // ne pratique pas, et le joueur pourrait passer la garde de quartz puis
    // manquer d'une unité au dernier bâtiment. Le devis dit ce qui sera
    // FACTURÉ. ⚠ L'écart n'est pas théorique : à onze bâtiments il peut
    // atteindre cinq unités.
    quartz += Math.round(cout.quartz);
    batiments += 1;
  }
  return { secondes, ticks, quartz, batiments };
}

/**
 * Ce qui empêche de réparer LE bâtiment d'indice `index` — liste vide si c'est
 * payable.
 *
 * @param {object} etat
 * @param {number} index
 * @returns {Array<{code: string, message: string}>}
 */
export function problemesDeLaReparationDUnBatiment(etat, index) {
  const laBase = baseCourante(etat);
  const cout = coutDeLaReparationDUnBatiment(etat, index);
  if (cout === null) {
    return [{ code: 'rien-a-reparer', message: 'Ce bâtiment est intact.' }];
  }
  const problemes = [];
  const reserve = laBase.reserveReparationBatiments;
  if (reserve < cout.ticks) {
    problemes.push({
      code: 'reserve-insuffisante',
      message: `Cette réparation demande ${direLaDuree(cout.ticks)} de réserve : `
        + `il t'en manque ${direLaDuree(cout.ticks - reserve)}.`,
    });
  }
  const du = Math.round(cout.quartz);
  const dispo = ressourceDisponible(etat, 'quartz');
  if (dispo < du) {
    problemes.push({
      code: 'quartz-insuffisant',
      message: `Cette réparation coûte ${du} de quartz : il t'en manque ${du - dispo}.`,
    });
  }
  return problemes;
}

/**
 * Répare le bâtiment d'indice `index` : débite le temps, débite le quartz, rend
 * les PV. Lève si ce n'est pas payable.
 *
 * ⚠⚠ RIEN N'EST DÉBITÉ SI LA RÉPARATION N'A PAS LIEU — ni le temps, ni le
 * quartz, ni les PV. On demande d'abord, on agit ensuite, comme `poser`, comme
 * le raid et comme `reparerUnePiece` : un débit partiel suivi d'un échec est le
 * pire des trois états possibles, et le seul que le joueur ne pourrait pas
 * comprendre.
 *
 * @param {object} etat modifié en place
 * @param {number} index
 * @returns {{batiment: string, ticks: number, quartz: number}} ce qui a été payé
 */
export function reparerUnBatiment(etat, index) {
  const laBase = baseCourante(etat);
  const problemes = problemesDeLaReparationDUnBatiment(etat, index);
  if (problemes.length > 0) {
    throw new Error(`réparation impossible — ${problemes.map((p) => p.message).join(' ; ')}`);
  }
  const cout = coutDeLaReparationDUnBatiment(etat, index);
  const quartz = Math.round(cout.quartz);
  laBase.reserveReparationBatiments -= cout.ticks;
  laBase.economie.ressources.quartz -= quartz * MILLE;
  laBase.disposition[index].degatsMilli = 0;
  return { batiment: cout.batiment, ticks: cout.ticks, quartz };
}

/**
 * Ce qui empêche de tout réparer — liste vide si la base entière est payable.
 *
 * @param {object} etat
 * @returns {Array<{code: string, message: string}>}
 */
export function problemesDeToutReparerLesBatiments(etat) {
  const laBase = baseCourante(etat);
  const devis = devisDeLaReparationDesBatiments(etat);
  if (devis.batiments === 0) {
    return [{ code: 'rien-a-reparer', message: 'Ta base est intacte.' }];
  }
  const problemes = [];
  const reserve = laBase.reserveReparationBatiments;
  if (devis.ticks > reserve) {
    problemes.push({
      code: 'reserve-insuffisante',
      message: `Réserve de base : il manque ${direLaDuree(devis.ticks - reserve)}.`,
    });
  }
  const dispo = ressourceDisponible(etat, 'quartz');
  if (dispo < devis.quartz) {
    problemes.push({
      code: 'quartz-insuffisant',
      message: `Cette réparation coûte ${devis.quartz} de quartz : il t'en manque `
        + `${devis.quartz - dispo}.`,
    });
  }
  return problemes;
}

/**
 * Répare tout ce qui est payable dans la base, et compte ce qui ne l'était pas.
 *
 * ⚠⚠ CE N'EST PAS UNE BOUCLE QUI S'ARRÊTE À LA PREMIÈRE ERREUR, pour la raison
 * de `toutReparer` : un bâtiment impayable ne doit pas empêcher les suivants
 * d'être remis debout.
 *
 * ⚠⚠ ET L'ORDRE EST CELUI DE `disposition`, DÉCLARÉ ICI. Quand la réserve
 * s'épuise en cours de route, ce sont les bâtiments les plus BAS dans le tableau
 * qui ont été servis — c'est-à-dire, dans une base neuve, le Chantier d'abord,
 * puis l'ordre de pose. Il fallait le dire plutôt que le laisser à l'implicite :
 * sans ordre déclaré, deux exécutions sur le même état videraient la réserve sur
 * des bâtiments différents, et le joueur ne pourrait pas prévoir ce qu'il paie.
 * L'écran laissera réparer bâtiment par bâtiment s'il veut choisir.
 *
 * ⚠ ELLE NE TOUCHE PAS À `toutReparer`, QUI EST CELLE DE L'ARMÉE. Les deux
 * réserves sont disjointes : un « tout » qui les traverserait échouerait en bloc
 * parce qu'un seul des deux réservoirs est à sec.
 *
 * @param {object} etat modifié en place
 * @returns {{reparees: number, impayables: number, ticks: number, quartz: number}}
 */
export function toutReparerLesBatiments(etat) {
  const laBase = baseCourante(etat);
  let reparees = 0;
  let impayables = 0;
  let ticks = 0;
  let quartz = 0;
  for (let index = 0; index < laBase.disposition.length; index += 1) {
    if (coutDeLaReparationDUnBatiment(etat, index) === null) continue;
    if (problemesDeLaReparationDUnBatiment(etat, index).length > 0) {
      impayables += 1;
      continue;
    }
    const paye = reparerUnBatiment(etat, index);
    ticks += paye.ticks;
    quartz += paye.quartz;
    reparees += 1;
  }
  return { reparees, impayables, ticks, quartz };
}

// ---------------------------------------------------------------------------
// Chargement
// ---------------------------------------------------------------------------

/**
 * Les défauts STRUCTURELS de la réserve, pour le chargement.
 *
 * ⚠ TROIS ENTIERS ≥ 0, ET LES TROIS CHÂSSIS. Un réservoir absent ferait un
 * `NaN` au premier crédit, qui se propagerait sans jamais lever — c'est
 * exactement le genre de faute qu'un contrôle au chargement existe pour
 * attraper. Le PLAFOND, lui, n'est pas vérifié : il dépend du niveau de
 * l'armée, qui peut avoir baissé depuis la sauvegarde, et un stock au-dessus de
 * son plafond est GELÉ, jamais amputé — c'est la règle du dépôt sur les stocks,
 * et le prochain crédit le laissera où il est.
 *
 * @param {*} reserve
 * @returns {Array<string>}
 */
export function problemesDesReserves(reserve) {
  if (reserve === null || typeof reserve !== 'object' || Array.isArray(reserve)) {
    return ['« reserveReparation » n\'est pas une table'];
  }
  const problemes = [];
  for (const chassis of CHASSIS_REPARABLES) {
    const valeur = reserve[chassis];
    if (!Number.isInteger(valeur) || valeur < 0) {
      problemes.push(`réserve « ${chassis} » vaut « ${valeur} »`);
    }
  }
  return problemes;
}

/**
 * Le défaut STRUCTUREL de la quatrième réserve, pour le chargement.
 *
 * ⚠ UN NOMBRE, PAS UNE TABLE, ET C'EST TOUTE LA RAISON D'ÊTRE D'UNE SECONDE
 * FONCTION. La réserve des bâtiments n'est PAS une quatrième clé de
 * `reserveReparation` : cet objet-là est indexé par CHÂSSIS, `CHASSIS_REPARABLES`
 * se dérive de `BATIMENT_DE_CHASSIS`, et `reservoirsDeLArmee` boucle dessus pour
 * l'écran d'armée. Une clé qui n'est pas un châssis fuirait dans les deux, et
 * l'écran afficherait un quatrième réservoir d'armée qui n'existe pas.
 *
 * ⚠ LE PLAFOND N'EST PAS VÉRIFIÉ, comme pour les trois autres : il dépend du
 * niveau des bâtiments, qui peut avoir baissé depuis la sauvegarde, et un stock
 * au-dessus de son plafond est GELÉ, jamais amputé.
 *
 * @param {*} reserve
 * @returns {Array<string>}
 */
export function problemesDeLaReserveDesBatiments(reserve) {
  if (!Number.isInteger(reserve) || reserve < 0) {
    return [`réserve « batiments » vaut « ${reserve} »`];
  }
  return [];
}
