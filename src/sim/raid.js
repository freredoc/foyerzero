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
import { reservoirsDeLArmee } from './reparation.js';
import { RESSOURCES, capacitesMilli } from './economie-base.js';
import {
  coutDUnRaid, manquePourPayer, payer, basesDuJoueur,
  estAPorteeDAttaque, distanceCarreeCases, casesArrondiesAuSuperieur,
} from './points-attaque.js';
import { siteDeLaCase, montageDuSite } from './site-de-la-case.js';
import { montageCourant, enregistrerLeRaid } from './site-entame.js';
import { majorationsDeCombat } from './poi.js';
import {
  creerCombat, resoudre, construireResultat, butin, pointsRecherche, facteurMilli,
  TICKS_MAX_COMBAT,
} from './combat.js';
import { GEOGRAPHIE } from '../data/sites.js';
import {
  creerAcquises, modulesDebloquesDuJoueur, moduleEstAcquis, nomDuModule,
} from './recherche.js';
import { baseCourante } from './base-courante.js';

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
  const laBase = baseCourante(etat);
  const parVague = new Map();
  const ordonnees = laBase.armee
    .map((piece, index) => ({ piece, index }))
    .sort((a, b) => a.piece.vague - b.piece.vague || a.piece.colonne - b.piece.colonne);

  const indices = [];
  for (const { piece, index } of ordonnees) {
    // ⚠⚠ « ELLE PART » EST LE DÉFAUT, ET C'EST `=== false` QUI LE DIT. Une pièce
    // venue d'une sauvegarde v17 non migrée, ou montée par un test qui ne
    // connaît pas le champ, porte `actif === undefined` : écrit `!piece.actif`,
    // ce test la garderait à la maison SANS que personne l'ait demandé, et la
    // moitié des montages du dépôt partiraient avec une armée vide. Le drapeau
    // ne retient que ce qu'on lui a EXPLICITEMENT demandé de retenir.
    //
    // ⚠ ET IL PRÉCÈDE LES DEUX `push`, comme celui du plancher juste dessous.
    // `indices` doit rester aligné sur les attaquants que le moteur rend :
    // sauter une pièce sans sauter son indice ferait retomber les dégâts sur la
    // MAUVAISE unité, en silence, et aucun raid de référence ne le dirait.
    //
    // ⚠ AVANT LE CALCUL DES PV, et c'est de la lecture, pas du résultat : une
    // unité qui reste à la maison n'a pas besoin qu'on mesure sa santé.
    if (piece.actif === false) continue;
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

  // ⚠⚠ LA PORTÉE SE TESTE AU CARRÉ DEPUIS LE LOT EUCLIDE, et la question se pose
  // à `estAPorteeDAttaque` plutôt qu'ici. `ciblesAPortee` la pose à la même
  // fonction : deux écritures d'une même règle divergeraient sur un cas limite,
  // et l'écran proposerait alors une cible que ce refus-ci rejetterait.
  if (!estAPorteeDAttaque(baseAttaquante.position, cible)) {
    // ⚠ LE NOMBRE AFFICHÉ EST DANS LA MÉTRIQUE QUI A DÉCIDÉ. Citer la distance
    // de grille dirait « cette cible est à 8 cases, le rayon d'attaque est de
    // 10 » pour une diagonale refusée — un message qui donne tort au jeu.
    const cases = casesArrondiesAuSuperieur(
      distanceCarreeCases(baseAttaquante.position, cible),
    );
    problemes.push({
      code: 'hors-portee',
      message: `Cette cible est à ${cases} cases en ligne droite : le rayon `
        + `d'attaque est de ${GEOGRAPHIE.rayonAttaque}.`,
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
      // ⚠ TROIS CAUSES POUR UN SEUL CODE, ET C'EST VOULU. `sans-armee` se
      // déclenche sur une armée vide, sur une armée entièrement au plancher de
      // PV, et depuis le 01/09 sur une armée entièrement DÉSACTIVÉE. L'écran
      // grise un bouton et affiche une phrase : trois codes pour le même bouton
      // grisé n'apporteraient rien, mais un message qui n'en cite que deux
      // envoie le joueur réparer une armée qui n'a rien de cassé.
      message: 'Aucune unité en état de partir : compose ton armée, répare-la, '
        + 'ou réactive tes unités.',
    });
  }
  return problemes;
}

/**
 * Verse un butin ENTIER dans une base — TOUT le butin, sans plafond.
 *
 * ⚠⚠ LE BUTIN A LE DROIT DE DÉPASSER LA CAPACITÉ DEPUIS LE LOT TRANSFERT —
 * Ethan, 02/09. Ce commentaire disait l'inverse, et il portait trois arguments
 * qu'il faut savoir périmés plutôt que les redécouvrir : que le stockage
 * perdrait sa raison d'être, que le premier camp sauterait huit niveaux de
 * progression, et que `butinPerdu` sauvait « rien ne se retire en silence ».
 * Les deux premiers restent des faits — un camp neuf rapporte bien quatre-vingts
 * fois le coffre — mais ils sont désormais tenus par l'AUTRE bout : le stock
 * monte au-dessus, et **tant qu'il y est, cette ressource-là cesse d'être
 * produite dans cette base**. Le stockage garde donc sa raison d'être ; il ne
 * borne plus le butin, il borne la PRODUCTION.
 *
 * ⚠⚠ LE PLAFONNEMENT N'A PAS ÉTÉ DÉPLACÉ, IL A ÉTÉ RETIRÉ, ET AVEC LUI LA
 * FONCTION `verser` QUI LE PORTAIT. Elle rendait « ce qui n'a pas pu entrer » ;
 * plus rien ne peut ne pas entrer, donc son reste valait toujours zéro et sa
 * signature aurait menti. `butinPerdu` disparaît du rapport de raid pour la
 * même raison : un champ qui vaut toujours `{}` invite à écrire un écran qui ne
 * montrera jamais rien.
 *
 * ⚠ LE GEL DU SURPLUS, LUI, N'A PAS BOUGÉ D'UNE LIGNE — il est dans
 * `economie-base.js` depuis le 26/08, dans les DEUX chemins, et ce lot n'a fait
 * que le prouver : `tickEconomieBase` et `rattrapageEconomieBase` bornent au
 * `max(capacité, stock)`, donc un stock au-dessus ne monte plus et n'est jamais
 * amputé. C'est ce qui rend le dépassement tenable ici.
 *
 * ⚠⚠ ET C'EST BIEN L'ÉCONOMIE QUI ARRÊTE LA PRODUCTION, PAS CETTE FONCTION.
 * Elle verse, un point c'est tout. Lui faire écrire un drapeau « saturé » ferait
 * une seconde vérité sur un fait que le stock dit déjà tout seul.
 *
 * ⚠ ELLE EST SORTIE D'`executerRaid` AU LOT BASES-1, ET C'EST UN DÉPLACEMENT,
 * PAS UNE ADDITION. Fonder une base sur un camp le détruit et rend son butin :
 * sans cette extraction, il y aurait eu DEUX codes qui versent un butin, et le
 * second aurait divergé du premier au premier réglage — c'est la faute que
 * `raserLaBase` a déjà value au dépôt.
 *
 * ⚠ LA BASE QUI REÇOIT EST UN ARGUMENT, et c'est tout l'intérêt : le raid verse
 * dans la base qui attaque, la fondation dans la base qui FONDE.
 *
 * @param {object} laBase la base qui encaisse
 * @param {object} gagne butin en unités entières, par ressource
 * @returns {{verse: object}} en unités entières — tout ce qui est gagné est versé
 */
export function verserLeButin(laBase, gagne) {
  const verse = {};
  for (const ressource of RESSOURCES) {
    const unites = gagne[ressource] ?? 0;
    if (unites === 0) continue;
    laBase.economie.ressources[ressource] += unites * MILLE;
    verse[ressource] = unites;
  }
  return { verse };
}

/**
 * Ce qui reste DEBOUT d'une liste de lignes de combat, en pour-cent entiers.
 *
 * ⚠ « RESTANT », PAS « DÉTRUIT » — Ethan, 01/09. Les deux disent la même chose
 * et ne se lisent pas pareil quand on enchaîne les raids : 30 % restant se
 * compare au raid suivant, 70 % détruit ne se compare à rien.
 *
 * ⚠ EN PV, PAS EN COMPTE DE PIÈCES, et c'est forcé par le cas d'un bâtiment
 * SEUL : le Chantier de construction est unique, donc un compte n'en dirait
 * jamais que 0 % ou 100 %. Le même barème sert donc aux quatre grandeurs.
 *
 * ⚠⚠ LE DÉNOMINATEUR EST LE SITE **PLEIN**, PAS CE QUI ÉTAIT ENCORE DEBOUT EN
 * ARRIVANT — et c'est un correctif mesuré, pas une préférence. Une pièce
 * détruite QUITTE le montage (`montageCourant` la retire, `creerCombat`
 * refusant une entité à zéro PV) : rapporté aux seules survivantes, le
 * pourcentage MONTAIT d'un raid à l'autre. Relevé sur onze raids d'affilée :
 * 74 % puis 76 % après une passe qui avait pourtant détruit un bâtiment de plus.
 * Un nombre qui grimpe quand on casse est illisible, et il ruine la seule chose
 * qu'on demande à « restant » : se comparer au raid suivant.
 *
 * @param {Array<object>} lignes ce qui s'est battu
 * @param {Array<object>} pleines la même sorte de pièces sur le site INTACT
 * @returns {number|null} pour-cent, ou `null` s'il n'y a rien de cette sorte
 */
function restantPct(lignes, pleines) {
  let max = 0;
  for (const l of pleines) max += l.pvMaxMilli;
  let reste = 0;
  for (const l of lignes) reste += l.pvMilli > 0 ? l.pvMilli : 0;
  // ⚠ `null`, PAS ZÉRO. Un site sans défense n'a pas une défense à 0 % : il n'en
  // a pas. C'est la convention `null ≠ zéro` du dépôt, et l'écran affiche « — ».
  if (max === 0) return null;
  return Math.round((reste * 100) / max);
}

/** Ce qui reste debout d'un bâtiment nommé — `null` si le site n'en a pas. */
function restantDeLId(lignes, pleines, id) {
  const pleinesChoisies = pleines.filter((l) => l.id === id);
  if (pleinesChoisies.length === 0) return null;
  return restantPct(lignes.filter((l) => l.id === id), pleinesChoisies);
}

/**
 * Ce que la réparation de l'armée va coûter, châssis par châssis.
 *
 * ⚠ LE POURCENTAGE EST CELUI DE LA RÉSERVE DISPONIBLE DE CE CHÂSSIS, et c'est
 * une LECTURE, pas un arbitrage : c'est le nombre actionnable — « ça me coûtera
 * 27 % de ma réserve escouade ». Un pourcentage des PV de l'armée dirait autre
 * chose, et se changerait ici en une ligne.
 *
 * ⚠ `pctReserve` VAUT `null` SUR UNE RÉSERVE VIDE, jamais l'infini ni 100. Une
 * division par zéro n'a pas de réponse à afficher.
 *
 * ⚠⚠ `sansBatiment` EXISTE PARCE QUE ZÉRO VEUT DIRE DEUX CHOSES. `reservoirsDeLArmee`
 * saute les pièces dont le bâtiment réparateur n'est pas posé — convention
 * `null ≠ zéro` — si bien qu'un châssis sans Caserne rend exactement le même
 * `0 s` qu'un châssis intact. Sans ce drapeau, le panneau annoncerait « aucune
 * réparation » à un joueur dont l'infanterie est en miettes et irréparable.
 * Mesuré : sur une base neuve, les trois châssis rendent 0 après un vrai raid
 * qui a bel et bien abîmé l'armée.
 *
 * @param {object} etat APRÈS le report des dégâts
 * @returns {Object<string, {secondes: number, ticks: number,
 *   pctReserve: number|null, sansBatiment: boolean}>}
 */
function reparationInduite(etat) {
  const laBase = baseCourante(etat);
  const reservoirs = reservoirsDeLArmee(etat);
  const sortie = {};
  for (const [chassis, r] of Object.entries(reservoirs)) {
    const reserve = laBase.reserveReparation?.[chassis] ?? 0;
    sortie[chassis] = {
      secondes: r.secondes,
      ticks: r.ticks,
      pctReserve: reserve === 0 ? null : Math.round((r.ticks * 100) / reserve),
      sansBatiment: r.niveau === null,
    };
  }
  return sortie;
}

/**
 * Le verdict du raid — trois mots, et trois seulement.
 *
 * ⚠ « DÉFAITE TOTALE » DÈS QU'AUCUN BÂTIMENT N'A ÉTÉ TOUCHÉ, même si toute la
 * défense est tombée. C'est la règle d'Ethan telle quelle : une armée qui n'a
 * griffé que la garnison n'a rien pris.
 *
 * ⚠ ET C'EST `pvPerdusIciMilli`, PAS `pvPerdusMilli`. Le verdict juge CE raid-ci :
 * sur un site déjà entamé, les dégâts d'hier rendraient « victoire » une passe
 * qui n'a rien fait du tout.
 *
 * ⚠ LE MOT « DÉFAITE » SANS « TOTALE » EST RÉSERVÉ À LA DÉFENSE, et n'existe pas
 * dans ce lot : la base du joueur n'est pas encore attaquable.
 *
 * @param {boolean} rase
 * @param {Array<object>} batiments
 * @returns {'victoire-totale'|'victoire'|'defaite-totale'}
 */
function verdictDuRaid(rase, batiments) {
  if (rase) return 'victoire-totale';
  if (batiments.some((b) => b.pvPerdusIciMilli > 0)) return 'victoire';
  return 'defaite-totale';
}

/**
 * Le montage exact d'un raid sur ce site — ce que `creerCombat` recevra.
 *
 * ⚠⚠ EXTRAITE POUR QUE L'ÉCRAN REJOUE LE COMBAT SANS LE RECOMPOSER. Le déroulé
 * visuel est un REJEU : l'état est déjà commis quand la première image
 * s'affiche, et l'écran doit refaire tourner la boucle sur le MÊME montage. Le
 * recomposer dans `ui/` donnerait deux montages voisins — modules, POI, PV
 * courants — dont un seul serait éprouvé, et le rejeu divergerait du rapport
 * sans que rien ne le dise. Un seul montage, deux appelants.
 *
 * ⚠ ET IL NE VOYAGE PAS DANS LE RAPPORT. Le mettre dans le rapport le ferait
 * entrer dans les dix rapports gardés, donc dans la sauvegarde : c'est
 * exactement ce que « ne pas stocker le combat » interdit. L'écran le demande
 * AVANT le raid, s'en sert pour rejouer, et le jette.
 *
 * @param {object} etat
 * @param {object} site identité rendue par `siteDeLaCase`
 * @returns {object} montage prêt pour `creerCombat`
 */
export function montageDuRaid(etat, site) {
  const montageSite = montageCourant(etat, site);
  return {
    ...montageSite,
    modulesDebloques: {
      ouvrage: montageSite.modulesDebloques?.ouvrage
        ?? { offense: [], defense: [] },
      joueur: modulesDebloquesDuJoueur(etat),
    },
    majorationsPoi: { joueur: majorationsDeCombat(etat.poisAcquis ?? []) },
  };
}

/**
 * Range un rapport dans le journal, et jette le plus ancien au-delà de la borne.
 *
 * ⚠ LE JOURNAL VIT DANS `raid.js` ET PAS DANS `state.js`, et ce n'est pas un
 * choix de confort : `state.js` importe déjà `creerRecherche` d'ici, donc
 * l'importer en retour ferait un CYCLE. Ce que `state.js` garde, c'est la
 * création du champ et sa migration — ce qui est sa charge — et l'écriture vit
 * chez celui qui produit le rapport.
 *
 * ⚠ LE PLUS ANCIEN SORT EN PREMIER, et la borne vient des DONNÉES
 * (`APRES_RAID.rapportsGardes`). Une file, pas une pile : le journal se lit dans
 * l'ordre où les raids ont eu lieu.
 *
 * ⚠ IL PORTE UN HORODATAGE DE JEU, PAS L'HEURE MURALE. Aucun fichier de `src/`
 * n'a le droit d'appeler l'horloge système hors de `ui/session.js` — c'est la
 * garde §11 de `banc.test.js`. `etat.horloge.nbTicks` dit quand, dans le temps
 * de la partie, et c'est ce qui se rejoue à l'identique.
 *
 * @param {object} etat modifié en place
 * @param {object} rapport
 */
export function garderLeRapport(etat, rapport) {
  if (!Array.isArray(etat.rapports)) etat.rapports = [];
  etat.rapports.push({ ...rapport, tick: etat.horloge.nbTicks });
  while (etat.rapports.length > APRES_RAID.rapportsGardes) etat.rapports.shift();
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
  const laBase = baseCourante(etat);
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
  // ⚠ LE RAID NE TOUCHE PLUS À LA RÉPARATION, ET C'EST UN ARBITRAGE, PAS UN
  // OUBLI. Ethan, le 29/08 : « les points de réparation bonus disparaissent si
  // on refait un raid avec la même armée » — cette phrase portait sur un modèle
  // où la réparation DURAIT, et où un raid pouvait donc en abandonner une en
  // vol. Depuis le 01/09 la réparation est instantanée et se paie sur une
  // réserve : il n'y a plus rien en cours à annuler, et la réserve accumulée
  // n'est pas un bonus mais un stock. L'arbitrage est CADUC, pas contredit.

  // ⚠ LES MODULES DU JOUEUR ENTRENT PAR LE MONTAGE, JAMAIS PAR L'ÉTAT LU AU VOL.
  // Le combat est déterministe et rejouable : tout ce qui gouverne la boucle
  // doit être dans le montage, qui est sérialisé. Un raid rejoué depuis une
  // sauvegarde doit rendre le même résultat au tick près.
  //
  // ⚠ `joueur`, PAS `ouvrage`. `pointsRecherche` lit `modulesDebloques.ouvrage`
  // pour majorer les points de 20 % sur une cible dont le module est débloqué :
  // c'est le camp d'en face et une autre grandeur. Les confondre ferait payer au
  // joueur les modules de l'Ouvrage.
  //
  // ⚠ LES POI SUIVENT LA MÊME RÈGLE, ET POUR LE MÊME MOTIF. Ce que le joueur a
  // acquis gouverne les dégâts de son assaut : ça doit être DANS le montage.
  // `ouvrage` reste à zéro — aucun POI ne bénéficie à l'Ouvrage —, mais la forme
  // est symétrique, comme `modulesDebloques` depuis MODULES-E.
  const montage = montageDuRaid(etat, site);
  const { vagues, indices } = composerLesVagues(etat);
  const resultat = resoudre(
    creerCombat({ ...montage, vagues }),
    { maxTicks: options.maxTicks ?? TICKS_MAX_COMBAT },
  );

  // --- le butin entre dans l'économie ---------------------------------------
  const { verse } = verserLeButin(laBase, butin(resultat, montage));

  // --- les points de recherche se rangent -----------------------------------
  const gagnesMilli = pointsRecherche(resultat, montage);
  etat.recherche.pointsMilli = (rechercheMilli(etat) + gagnesMilli).toString();

  // --- le site garde ses dégâts ---------------------------------------------
  const verdict = enregistrerLeRaid(etat, site, resultat);

  // --- l'armée revient abîmée -----------------------------------------------
  const degats = reporterLesDegats(etat, resultat, indices);

  // --- la garnison à Auto-réparation se recolle -----------------------------
  reparerLaGarnison(etat);

  // ⚠ LE SITE INTACT, MONTÉ UNE FOIS, POUR SERVIR DE DÉNOMINATEUR AUX QUATRE
  // POURCENTAGES. Même détour que `butinSiToutTombe` : on monte un combat sans
  // vagues, uniquement pour que `creerCombat` mette les PV à l'échelle du
  // niveau. C'est le seul endroit qui connaisse la composition PLEINE une fois
  // le site entamé.
  const plein = construireResultat(creerCombat({
    ...montageDuSite(etat.graine, site), vagues: [],
  }));

  // ⚠⚠ TOUT CE QUE L'ÉCRAN DE FIN AFFICHE SE CALCULE ICI, ET NULLE PART AILLEURS.
  // C'est toute la raison d'être de RAID-0 : `simulerRaid` appelle cette
  // fonction-ci sur une COPIE, donc ce qui est calculé là est exact dans le
  // simulateur PAR CONSTRUCTION. Un pourcentage calculé côté interface
  // divergerait entre le panneau du simulateur et celui du vrai raid, et
  // personne ne le verrait — les deux panneaux ne sont jamais à l'écran en même
  // temps.
  //
  // ⚠ `reparationInduite` SE PREND APRÈS `reporterLesDegats`, et l'ordre est
  // tout : avant, l'armée est encore intacte et le devis vaudrait zéro.
  const rapport = {
    // ⚠ LE SENS EST ÉCRIT DES DEUX CÔTÉS DEPUIS LE LOT RAID-B. La liste des dix
    // porte maintenant les raids que le joueur a MENÉS et ceux qu'il a SUBIS ;
    // ne déclarer que les seconds obligerait tout lecteur à traiter l'absence du
    // champ comme un cas, et le premier qui l'oublierait afficherait une défaite
    // comme une victoire.
    sens: 'offense',
    cible: site,
    cout,
    cause: resultat.cause,
    ticks: resultat.tick,
    // ⚠ `butinPerdu` A DISPARU AU LOT TRANSFERT, ET IL N'A PAS ÉTÉ REMPLACÉ.
    // Le butin ne se plafonne plus : il n'y a plus rien à perdre, donc plus
    // rien à annoncer. Le garder à `{}` aurait invité à écrire un écran qui ne
    // montrera jamais rien.
    butin: verse,
    rechercheMilli: gagnesMilli.toString(),
    rase: verdict.rase,
    unitesEngagees: indices.length,
    unitesAuPlancher: degats.auPlancher,
    pointsRestants: etat.attaque.points,
    restantDefense: restantPct(resultat.defenses, plein.defenses),
    restantBatiments: restantPct(resultat.batiments, plein.batiments),
    // ⚠ LES CLÉS SONT LES NOMS OUVRAGE — `souche` et `etai` —, et elles ne
    // changent jamais. C'est le LIBELLÉ affiché qui suit la faction de la base
    // regardée : `BATIMENTS.souche.ta` vaut « Chantier de construction ».
    restantSouche: restantDeLId(resultat.batiments, plein.batiments, 'souche'),
    restantEtai: restantDeLId(resultat.batiments, plein.batiments, 'etai'),
    reparationInduite: reparationInduite(etat),
    verdict: verdictDuRaid(verdict.rase, resultat.batiments),
  };

  // ⚠⚠ LE RAPPORT SE RANGE ICI, DONC LE SIMULATEUR N'EN RANGE AUCUN — et c'est
  // gratuit. `simulerRaid` appelle cette fonction-ci sur une COPIE : le journal
  // de la copie reçoit le rapport, celui de l'état réel n'est jamais touché.
  // Ranger le rapport dans `simulerRaid` aurait été le seul moyen de se tromper.
  //
  // ⚠ ON RANGE LE RAPPORT, JAMAIS LE `resultat`. Un résultat complet porte les
  // vagues, les positions et les PV de chaque entité : dix de ces objets
  // rendraient la sauvegarde illisible. Mesuré : un rapport pèse 645 octets.
  garderLeRapport(etat, rapport);
  return rapport;
}

/**
 * Simule un raid : le même rapport qu'`executerRaid`, et l'état réel intact.
 *
 * ⚠⚠ UNE COPIE ET UN SEUL CHEMIN DE CODE, JAMAIS DEUX. Le découpage qui vient
 * naturellement à l'esprit — extraire la partie pure, puis PROJETER les
 * conséquences sans les écrire — est refusé, et la raison n'est pas un détail
 * d'implémentation : les conséquences ne sont pas projetables sans effort.
 * `verser` ÉCRIT dans l'économie et rend le débordement, `enregistrerLeRaid`
 * écrit sur le site, `reporterLesDegats` écrit sur l'armée. Les reproduire en
 * lecture seule voudrait dire tenir la même logique en DEUX exemplaires, et deux
 * exemplaires divergent. C'est très exactement ce qui s'est passé entre
 * `MODELE-REPARATION-1.md` §4 et `sim/reparation.js` — huit jours d'écart que
 * rien ne pouvait voir, découverts le 01/09. On ne recommence pas.
 *
 * Le simulateur est donc exact PAR CONSTRUCTION, et non par vérification.
 *
 * ⚠ `structuredClone` EST UN CHOIX QUI SE PROUVE, PAS UN RÉFLEXE. L'état
 * traverse déjà `serialiser`, donc il est fait de données simples ; un test le
 * MESURE en comparant la sérialisation d'avant à celle d'après, chaîne contre
 * chaîne. Si elles diffèrent d'un seul octet, la copie fuit.
 *
 * ⚠ `options` PASSE EN ENTIER. `executerRaid` y lit `maxTicks` pour borner le
 * combat : le perdre en route changerait la borne du combat simulé, et le
 * simulateur cesserait d'être exact — la seule propriété qu'on lui demande.
 *
 * @param {object} etat NON modifié
 * @param {{position: object}} baseAttaquante
 * @param {{rangee: number, colonne: number}} cible
 * @param {{maxTicks?: number}} [options]
 * @returns {object} le rapport d'`executerRaid`, plus `simule: true`
 */
export function simulerRaid(etat, baseAttaquante, cible, options = {}) {
  const copie = structuredClone(etat);
  // ⚠⚠ LA CEINTURE ÉCRITE AU LOT RAID-0 A SERVI, ET ELLE A CHANGÉ DE FORME AU
  // LOT BASES-0. Elle disait : « `basesDuJoueur` rend `[etat]`, donc l'appelant
  // passe l'état deux fois ; le jour où le multi-bases arrivera, passer
  // l'original ferait fuir la simulation sur l'état réel ». Ce jour est celui-ci
  // — `baseAttaquante` n'est plus JAMAIS `etat`, c'est un élément de
  // `etat.bases` —, et la comparaison d'identité serait devenue toujours fausse.
  // Elle n'aurait rien cassé aujourd'hui : `executerRaid` ne LIT que
  // `baseAttaquante.position`. Elle aurait cessé de protéger EN SILENCE.
  //
  // ⚠ ON RETROUVE LA BASE PAR SON INDICE, jamais par identité de référence :
  // `structuredClone` copie des valeurs et ne rétablit aucune identité, donc
  // `copie.bases.indexOf(baseAttaquante)` rendrait −1. On cherche donc l'indice
  // dans l'ORIGINAL, et on prend l'homologue dans la copie. Une base venue
  // d'ailleurs — un montage de test qui forge sa propre base — n'est pas dans
  // `etat.bases` et passe telle quelle, ce qui est le bon comportement : elle ne
  // pointe sur rien que la simulation pourrait salir.
  const indice = etat.bases?.indexOf(baseAttaquante) ?? -1;
  const base = indice >= 0 ? copie.bases[indice] : baseAttaquante;
  return { ...executerRaid(copie, base, cible, options), simule: true };
}

/** Part des dégâts qu'un ouvrage à Auto-réparation regagne au retour d'un raid. */
const AUTO_REPARATION_PCT = 20;

/**
 * Les ouvrages de garnison à Auto-réparation regagnent 20 % de leurs dégâts.
 *
 * ⚠⚠ CET EFFET EST ATTEIGNABLE EN JEU DEPUIS LE LOT RAID-B, 02/09/2026, ET CE
 * COMMENTAIRE DISAIT L'INVERSE. Il annonçait : « aucun code n'écrit
 * `degatsMilli` sur la garnison aujourd'hui […] l'effet est ÉCRIT ET
 * INATTEIGNABLE EN JEU tant que les attaques sur la base n'existent pas ». Les
 * attaques existent : `sim/raid-ouvrage.js` reporte les dégâts du raid de
 * l'Ouvrage sur `etat.garnison`, et c'est LUI qui appelle cette fonction juste
 * après. Un commentaire qui annonce un futur devenu présent envoie chercher un
 * trou qui n'existe plus.
 *
 * ⚠ LES ÉCRIVAINS DE `degatsMilli` SUR LA GARNISON SONT DONC DEUX, et un seul
 * parcourt `etat.armee` : `reporterSurLesPieces` de `raid-ouvrage.js` écrit sur
 * la garnison, `reporterLesDegats` ici même sur l'armée. Un fait d'orphelinage
 * se remesure, il ne se reconduit pas — c'est ce que ce commentaire disait déjà
 * au lot RÉSERVE, et c'est ce qui a permis de le corriger sans le réécrire.
 *
 * ⚠ IL RESTE APPELÉ DEPUIS `executerRaid`, ET C'EST INTACT : un raid du joueur
 * termine toujours par recoller sa propre garnison. Simplement, elle n'y a plus
 * rien à recoller que dans le cas où elle a été attaquée entre-temps.
 *
 * ⚠ DEUX CONTRÔLES, ET IL FAUT LES DEUX. `nomDuModule` dit QUEL module la ligne
 * porte, `moduleEstAcquis` dit si le joueur l'a payé POUR CETTE LIGNE. Le second
 * seul rendrait la réparation à toute défense achetée ; le premier seul la
 * rendrait sans l'avoir payée.
 *
 * ⚠ 20 % DES DÉGÂTS, PAS DES PV MAX, et un seul `Math.floor`. Une pièce peu
 * abîmée regagne peu ; le reste se soigne par la réparation ordinaire.
 *
 * ⚠ LA GARNISON RECOLLÉE EST CELLE DE LA BASE ATTAQUÉE, PAS DE CELLE QU'ON
 * REGARDE — la base se passe en argument depuis BASES-1. Le défaut est la
 * courante : c'est ce que veut `executerRaid`, où la base qui part au raid est
 * bien celle du joueur.
 *
 * @param {object} etat modifié en place
 * @param {object} [laBase] la base dont on recolle la garnison
 * @returns {number} milli-PV rendus, tous ouvrages confondus
 */
export function reparerLaGarnison(etat, laBase = baseCourante(etat)) {
  let rendus = 0;
  for (const piece of laBase.garnison) {
    if (piece.degatsMilli <= 0) continue;
    if (nomDuModule('defense', piece.id) !== 'autoReparation') continue;
    if (!moduleEstAcquis(etat, 'defense', piece.id)) continue;
    const rendu = Math.floor((piece.degatsMilli * AUTO_REPARATION_PCT) / 100);
    piece.degatsMilli -= rendu;
    rendus += rendu;
  }
  return rendus;
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
  const laBase = baseCourante(etat);
  if (resultat.attaquants.length !== indices.length) {
    throw new Error(
      `raid : ${resultat.attaquants.length} attaquants rendus pour ${indices.length} engagés — `
      + 'l\'ordre de montage ne correspond plus',
    );
  }
  let auPlancher = 0;
  for (let i = 0; i < indices.length; i += 1) {
    const ligne = resultat.attaquants[i];
    const piece = laBase.armee[indices[i]];
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
