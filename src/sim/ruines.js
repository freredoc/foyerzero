// Ce qu'une base rasée laisse derrière elle — la ruine, et les vingt-quatre
// heures pendant lesquelles elle tient encore le terrain pour qui l'a prise.
//
// Arbitrage d'Ethan du 07/09, point 13 : « pendant 24 h, la base rasée émet le
// territoire du vainqueur, du niveau de la base rasée. Après, la ruine
// disparaît, et les territoires sont recalculés. »
//
// ⚠⚠ UNE SEULE LISTE, DEUX LECTURES, ET C'EST TOUT LE LOT. `etat.basesRasees`
// répond depuis ce lot à deux questions qui n'ont pas la même durée de vie :
//
//     1. « cette case porte-t-elle encore un site ? »  — JAMAIS, et pour de bon
//     2. « cette case émet-elle du territoire ? »      — 24 h, pas une de plus
//
// La première IGNORE l'expiration, délibérément : une base rasée ne revient pas,
// `TYPES_SITE.base.respawn` vaut `false`, et cette liste porte le seul fait que
// la graine ne peut pas connaître. La seconde l'EXIGE. Confondre les deux est la
// seule façon dont ce lot peut mentir en silence — une carte juste au
// chargement et fausse une heure plus tard. C'est pourquoi les deux lectures
// s'écrivent ici, l'une à côté de l'autre, sous deux noms qui ne se ressemblent
// pas : `casesRasees` et `ruinesActives`.
//
// ⚠⚠ ET LA PURGE N'EST PAS SEULEMENT FACULTATIVE, ELLE EST INTERDITE. Retirer
// une entrée expirée ferait REPARAÎTRE la base au calcul suivant. Ce qui expire
// est la REVENDICATION de l'entrée, jamais son existence : une ruine périmée
// reste dans l'état à vie, et toute lecture d'émission doit la traiter comme
// absente. `C24 T14` pose une entrée expirée SANS la purger et exige que la
// carte l'ignore — c'est-à-dire que la purge ne soit pas le rempart.
//
// ⚠⚠ LA DURÉE SE COMPTE EN TICKS, PAS EN MILLISECONDES D'HORLOGE MURALE.
// L'économie et les raids se rattrapent hors ligne ; une ruine créée avant une
// nuit d'absence doit être expirée AU RETOUR, sans qu'aucune boucle n'ait
// tourné. Une soustraction sur `etat.horloge.nbTicks` est vraie au premier appel
// après le rattrapage, sans traitement particulier — là où une file
// d'expirations à traiter tick par tick réclamerait son propre rattrapage, donc
// un second endroit où se tromper.
//
// ⚠ CE MODULE NE SAIT PAS CE QU'EST UN CAMP, et c'est ce qui l'empêche de
// dépendre de `sim/territoire.js`, qui dépend de lui. Il range le `vainqueur`
// qu'on lui donne et le rend tel quel ; `JOUEUR` et `OUVRAGE` restent définis
// une seule fois, là où la carte les emploie.

import { APRES_RAID } from '../data/sites.js';
import { TICKS_PAR_HEURE } from './clock.js';

/**
 * Combien de ticks une ruine revendique le terrain.
 *
 * ⚠ LA VALEUR DE JEU EST DANS `src/data/`, LA CONVERSION EST ICI — c'est la
 * route de `TICKS_APPARITION` (`sim/satellites.js`) et de `RETOUR_DEFENSES`
 * (`sim/reparation.js`). Vingt-quatre heures est un arbitrage, pas une constante
 * de moteur : l'écrire ici ferait de `sim/` un endroit où l'on règle le jeu.
 */
export const TICKS_DE_RUINE = APRES_RAID.ruineHeures * TICKS_PAR_HEURE;

/** La clé de case employée par `basesRasees` depuis le début : « rangée:colonne ». */
export function cleDeLaCase(rangee, colonne) {
  return `${rangee}:${colonne}`;
}

function exigerCase(rangee, colonne) {
  if (!Number.isInteger(rangee) || !Number.isInteger(colonne)) {
    throw new TypeError(`ruines : case « ${rangee}, ${colonne} » — entiers attendus`);
  }
}

/**
 * Une case rasée QUI NE REVENDIQUE RIEN — la forme d'avant ce lot, et celle que
 * la migration donne aux anciennes sauvegardes.
 *
 * ⚠⚠ ELLE EXISTE POUR QU'ON N'INVENTE NI NIVEAU NI VAINQUEUR. Une v27 ne sait
 * pas qui a rasé quoi ni de quel niveau : les trois champs sont nés avec ce lot.
 * Une ruine à qui l'on donnerait un niveau plausible peindrait un territoire que
 * personne n'a conquis.
 *
 * @param {number} rangee
 * @param {number} colonne
 * @returns {{rangee: number, colonne: number}}
 */
export function caseRasee(rangee, colonne) {
  exigerCase(rangee, colonne);
  return { rangee, colonne };
}

/**
 * Une ruine fraîche : la case, le camp qui l'a prise, le niveau de ce qui est
 * tombé, et le tick où c'est tombé.
 *
 * ⚠ LE NIVEAU EST CELUI DE LA BASE RASÉE, PAS CELUI DU VAINQUEUR. C'est le mot
 * d'Ethan — « du niveau de la base rasée » — et c'est ce qui fait qu'abattre une
 * grosse base vaut mieux que d'en abattre deux petites.
 *
 * @param {number} rangee
 * @param {number} colonne
 * @param {number} vainqueur le camp, tel que `sim/territoire.js` les numérote
 * @param {number} niveau entier ≥ 1, celui de la base rasée
 * @param {number} tick `etat.horloge.nbTicks` au moment du rasement
 */
export function ruineFraiche(rangee, colonne, vainqueur, niveau, tick) {
  exigerCase(rangee, colonne);
  if (!Number.isInteger(vainqueur)) {
    throw new TypeError(`ruines : vainqueur « ${vainqueur} » — camp attendu`);
  }
  if (!Number.isInteger(niveau) || niveau < 1) {
    throw new RangeError(`ruines : niveau « ${niveau} » — entier ≥ 1 attendu`);
  }
  if (!Number.isInteger(tick) || tick < 0) {
    throw new RangeError(`ruines : tick « ${tick} » — entier ≥ 0 attendu`);
  }
  return {
    rangee, colonne, vainqueur, niveau, tick,
  };
}

/**
 * L'entrée revendique-t-elle quoi que ce soit ? Trois champs, tous les trois ou
 * aucun — une entrée à moitié remplie ne revendique rien.
 *
 * ⚠ ELLE NE REGARDE PAS L'HORLOGE. Revendiquer et revendiquer ENCORE sont deux
 * questions ; les mélanger ferait de `ruineEstActive` une fonction qu'on peut
 * oublier d'appeler sans que rien ne le dise.
 */
export function revendique(entree) {
  return entree !== null && typeof entree === 'object'
    && Number.isInteger(entree.vainqueur)
    && Number.isInteger(entree.niveau)
    && Number.isInteger(entree.tick);
}

/**
 * La ruine tient-elle encore le terrain, à ce tick-ci ?
 *
 * ⚠⚠ LE BORD EST FRANC ET FERMÉ EN HAUT : à `TICKS_DE_RUINE − 1` elle émet
 * encore, à `TICKS_DE_RUINE` pile elle n'émet plus. Vingt-quatre heures PENDANT
 * lesquelles elle émet, donc la vingt-quatrième comprise et pas la suivante.
 * `C24 T5` et `C24 T6` gardent les deux côtés : un seuil ne se tient pas par un
 * seul.
 *
 * ⚠ UNE HORLOGE QUI RECULE NE RESSUSCITE RIEN ET NE LÈVE PAS. Fuseau ou date
 * changée : l'écart peut être négatif, et une ruine « pas encore rasée » compte
 * alors comme active — c'est le seul choix qui ne fasse pas clignoter la carte,
 * et `charger` ramène déjà les durées négatives à zéro en amont.
 */
export function ruineEstActive(entree, nbTicks) {
  if (!revendique(entree)) return false;
  return nbTicks - entree.tick < TICKS_DE_RUINE;
}

/**
 * Les cases où plus aucun site ne se trouve — TOUTES, expirées comprises.
 *
 * ⚠⚠ ELLE IGNORE L'EXPIRATION, ET C'EST VOULU. `siteDeLaCase` s'en sert pour
 * rendre `null` : une base rasée ne revient pas, jamais, et une ruine n'est pas
 * une cible — avant comme après expiration. Si un jour cette fonction se met à
 * filtrer sur l'horloge, les bases rasées reparaîtront une à une, vingt-quatre
 * heures après l'avoir été.
 *
 * @param {object} etat
 * @returns {Set<string>} des clés « rangée:colonne »
 */
export function casesRasees(etat) {
  const cases = new Set();
  for (const entree of etat.basesRasees ?? []) {
    // ⚠ LA FORME D'AVANT LA v28 TOMBE ICI, FORT ET TOUT DE SUITE. Une chaîne
    // « rangée:colonne » ne lève pas d'elle-même — `entree.rangee` vaudrait
    // `undefined`, la clé « undefined:undefined », et la base rasée reparaîtrait
    // en silence. `migrer` convertit les sauvegardes ; ce qui reste est un
    // montage écrit à la main, et il doit s'en apercevoir.
    if (entree === null || typeof entree !== 'object') {
      throw new TypeError(
        `ruines : entrée « ${entree} » — la forme « rangée:colonne » a été migrée en v28`,
      );
    }
    cases.add(cleDeLaCase(entree.rangee, entree.colonne));
  }
  return cases;
}

/**
 * Les ruines qui émettent ENCORE, avec leur camp et leur niveau.
 *
 * ⚠⚠ C'EST LA SEULE PORTE VERS L'ÉMISSION, ET ELLE REGARDE L'HORLOGE. Toute
 * lecture qui compterait une ruine sans passer par ici compterait des périmées :
 * c'est le seul défaut que la relecture de ce lot cherche.
 *
 * ⚠ ELLE LÈVE PLUTÔT QUE DE DEVINER L'HEURE. Un état sans horloge qui porte une
 * revendication ne peut pas dire si elle a expiré ; rendre « active » par défaut
 * peindrait un territoire sur une ruine peut-être vieille d'un mois, et rendre
 * « expirée » en effacerait une toute fraîche. Un état sans revendication, lui,
 * ne pose aucune question : il rend une liste vide sans regarder l'heure.
 *
 * @param {object} etat
 * @returns {Array<{rangee: number, colonne: number, vainqueur: number,
 *   niveau: number, ruine: true}>}
 */
export function ruinesActives(etat) {
  const actives = [];
  const nbTicks = etat.horloge?.nbTicks;
  for (const entree of etat.basesRasees ?? []) {
    if (!revendique(entree)) continue;
    if (!Number.isInteger(nbTicks)) {
      throw new Error('ruines : état sans horloge — l\'expiration est incalculable');
    }
    if (!ruineEstActive(entree, nbTicks)) continue;
    actives.push({
      rangee: entree.rangee,
      colonne: entree.colonne,
      vainqueur: entree.vainqueur,
      niveau: entree.niveau,
      // ⚠ CE DRAPEAU N'EST PAS DÉCORATIF : `sim/territoire.js` s'en sert pour ne
      // PAS poser le plancher « le territoire où la base se trouve ne change
      // pas ». Une ruine n'est pas une base — §4 du brief —, elle n'est qu'une
      // contribution de plus dans la somme de son camp, y compris sur sa propre
      // case, qu'elle peut donc perdre face à plus fort qu'elle.
      ruine: true,
    });
  }
  return actives;
}
