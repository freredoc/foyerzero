// La réparation de l'armée — une réserve de temps qui s'accumule, par châssis.
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
import { BASE_BATIMENTS, BATIMENT_DE_CHASSIS } from '../data/base.js';
import { coutDeMonteeOffense } from '../data/couts-militaires.js';
import { REPARATION } from '../data/sites.js';
import { TICKS_PAR_SECONDE, TICKS_PAR_HEURE } from './clock.js';
import { facteurMilli } from './combat.js';
import { niveauDeLArmee } from './niveau-de-base.js';

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
  const dixiemes = niveauDeLArmee(etat.armee) ?? 0;
  const heures = REPARATION.plafondHeures
    + REPARATION.plafondHeuresParNiveauArmee * (dixiemes / DIXIEMES_PAR_NIVEAU);
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
  const plafond = plafondDeLaReserve(etat);
  for (const chassis of CHASSIS_REPARABLES) {
    const avant = etat.reserveReparation[chassis];
    etat.reserveReparation[chassis] = Math.min(plafond, avant + nbTicks);
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
  const piece = etat.armee[index];
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

  for (let index = 0; index < etat.armee.length; index += 1) {
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
      index, degatsDepart: etat.armee[index].degatsMilli, secondes: cout.secondes,
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
  const reservoirs = reservoirsDeLArmee(etat);
  let secondes = 0;
  let scorie = 0;
  for (const r of Object.values(reservoirs)) {
    secondes += r.secondes;
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

/** La scorie disponible, en unités entières. */
function scorieDisponible(etat) {
  return Math.floor(etat.economie.ressources.scorie / MILLE);
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
  const reserve = etat.reserveReparation[cout.chassis];
  if (reserve < cout.ticks) {
    problemes.push({
      code: 'reserve-insuffisante',
      message: `Cette réparation demande ${direLaDuree(cout.ticks)} de réserve : `
        + `il t'en manque ${direLaDuree(cout.ticks - reserve)}.`,
    });
  }
  const du = Math.ceil(cout.scorie);
  const dispo = scorieDisponible(etat);
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
  const problemes = problemesDeLaReparationDUnePiece(etat, index);
  if (problemes.length > 0) {
    throw new Error(`réparation impossible — ${problemes.map((p) => p.message).join(' ; ')}`);
  }
  const cout = coutDeLaReparation(etat, index);
  const scorie = Math.ceil(cout.scorie);
  etat.reserveReparation[cout.chassis] -= cout.ticks;
  etat.economie.ressources.scorie -= scorie * MILLE;
  etat.armee[index].degatsMilli = 0;
  return { chassis: cout.chassis, ticks: cout.ticks, scorie };
}

/**
 * Ce qui empêche de tout réparer — liste vide si l'armée entière est payable.
 *
 * @param {object} etat
 * @returns {Array<{code: string, message: string}>}
 */
export function problemesDeToutReparer(etat) {
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
    const reserve = etat.reserveReparation[chassis];
    if (demande > reserve) {
      problemes.push({
        code: 'reserve-insuffisante',
        message: `Réserve ${chassis} : il manque ${direLaDuree(demande - reserve)}.`,
      });
    }
  }
  const dispo = scorieDisponible(etat);
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
  const ticks = reservesVides();
  let reparees = 0;
  let impayables = 0;
  let scorie = 0;
  for (let index = 0; index < etat.armee.length; index += 1) {
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
