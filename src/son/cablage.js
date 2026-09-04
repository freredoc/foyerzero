// CE QUE LE JEU DEMANDE AU SON : les boucles que l'état porte, et l'événement
// qu'un geste réclame. Deux questions, un seul module, et aucune ne fait de bruit.
//
// ⚠⚠ L'ENSEMBLE DÉSIRÉ NE SE DÉDUIT D'AUCUN ÉVÉNEMENT, ET C'EST LA RAISON DE CE
// MODULE. Un coup répond à un geste ; une boucle répond à une SITUATION — quel
// écran est affiché, quelles unités roulent, quels bâtiments tournent. Un
// mécanisme fondé sur des événements manquerait tout ce qui commence sans geste
// (un chargement de partie, une unité qui se remet en marche) et surtout tout ce
// qui s'arrête sans geste, ce qui laisserait une boucle sonner pour toujours.
//
// ⚠⚠ IL EST PUR, ET IL N'IMPORTE QUE `src/data/`. Aucun `src/sim/` : il REÇOIT
// des données simples — l'écran, la disposition d'une base, l'état d'un combat —
// et n'appelle aucun moteur. C'est la même frontière que `src/son/politique.js`,
// et deux gardes de `test/son.test.js` la tiennent dans les deux sens.
//
// ⚠⚠ ET IL NE JOUE RIEN. Il rend des NOMS d'événement ; `src/ui/son.js` en fait
// des sources, `src/ui/session.js` les lui demande. La garde `SON T14` refuse un
// appel de `jouer(` ailleurs que dans ces deux fichiers-là, et elle reste vraie.

import { UNITES } from '../data/combat.js';
import { BASE_BATIMENTS } from '../data/base.js';
import {
  AMBIANCE_PAR_ECRAN, BOUCLES_DE_BATIMENT, MOUVEMENT_PAR_PAIRE, EFFONDREMENT_PV,
} from '../data/sons.js';

/**
 * La clé de `MOUVEMENT_PAR_PAIRE` pour une unité : « nom joueur/nom Ouvrage ».
 *
 * ⚠⚠ LA CARTE DU PACK EST INDEXÉE PAR NOMS AFFICHÉS, PAS PAR IDENTIFIANTS, et
 * c'est le point où la correspondance peut se rompre en silence le jour où un
 * nom bouge. On la reconstruit donc de `UNITES[x].nom`, qui est la table qui
 * fait foi sur les deux noms — jamais d'une liste recopiée. **Mesuré au lot
 * SON-CÂBLAGE : les quatorze paires de la carte se résolvent, et les quatorze
 * unités du jeu ont leur entrée** — la couverture est totale dans les deux sens,
 * et un test la recompte.
 *
 * @param {string} id une clé d'`UNITES`
 * @returns {string|null} la paire, ou null si l'identifiant n'est pas une unité
 */
export function paireDeLUnite(id) {
  const unite = UNITES[id];
  if (unite === undefined) return null;
  return `${unite.nom.joueur}/${unite.nom.ouvrage}`;
}

/**
 * Les unités du JOUEUR qui ont bougé pendant le dernier tick de combat.
 *
 * ⚠⚠ C'EST UNE LECTURE D'ÉTAT, PAS UN ÉVÉNEMENT DE SIMULATION, ET LA NUANCE EST
 * TOUTE LA GARDE `SON T14`. On ne branche rien dans `src/sim/` et le moteur ne
 * publie rien : on COMPARE deux instantanés que l'écran de raid prend déjà pour
 * son interpolation. Le moteur ne sait pas qu'on l'écoute, et il n'a pas bougé
 * d'une ligne.
 *
 * ⚠ SEUL LE CAMP `attaque` SE DÉPLACE — `deplacement()` de `sim/combat.js`
 * écarte tout le reste depuis toujours —, donc comparer les rangées suffit et
 * il n'y a pas de second critère à inventer.
 *
 * ⚠ UNE UNITÉ QUI VIENT DE PARAÎTRE N'A PAS DE POSITION D'AVANT, ET ELLE NE
 * COMPTE PAS. Les vagues entrent en cours de combat — `ajouterEntite` allonge
 * `entites` —, donc l'instantané pris avant le tick est plus court que la liste
 * d'après. Le tick suivant la comptera si elle avance. Mesuré : `entites` n'est
 * jamais RACCOURCIE — `retirerLesMorts` marque `vivant`, elle ne retire rien —,
 * donc les indices des deux tableaux ne peuvent pas se décaler.
 *
 * ⚠ ET SEUL LE PROPRIÉTAIRE `joueur` EST RETENU. Le bloc `player` de la carte
 * décrit les unités du joueur ; son bloc `ouvrage` porte une taxonomie qui
 * n'est nulle part dans le dépôt (mesuré : zéro des sept noms). Faire sonner
 * une unité de l'Ouvrage avec le roulement du joueur serait l'attribution par
 * ressemblance que le brief interdit.
 *
 * @param {{entites: object[]}|null} combat l'état de combat, ou null
 * @param {number[]|null} precedentes les `rangeeMilli` d'avant le tick
 * @returns {string[]} les identifiants d'unité, triés, sans doublon
 */
export function unitesEnMouvement(combat, precedentes) {
  if (combat === null || combat === undefined || precedentes === null
      || precedentes === undefined) return [];
  const vus = new Set();
  combat.entites.forEach((e, i) => {
    if (e.camp !== 'attaque' || e.proprietaire !== 'joueur') return;
    if (e.vivant !== true || e.sorti === true) return;
    if (precedentes[i] === undefined || e.rangeeMilli === precedentes[i]) return;
    vus.add(e.id);
  });
  return [...vus].sort();
}

/**
 * L'ensemble des boucles que l'état DEMANDE, à cet instant.
 *
 * ⚠ TROIS SOURCES, ET ELLES NE SE CHEVAUCHENT PAS : l'écran donne l'ambiance,
 * la disposition donne les machineries, le combat donne les roulements. Un même
 * nom demandé deux fois ne sonne qu'une : l'ensemble est dédoublonné ici, ce qui
 * est la forme que prend « une boucle par TYPE de bâtiment, pas par bâtiment ».
 * Six usines ne font pas six fois le même bruit ; compter sur le plafond de voix
 * pour les refuser marcherait, et demanderait de savoir combien il en autorise.
 *
 * ⚠ UN ÉCRAN SANS AMBIANCE NE LÈVE PAS. `AMBIANCE_PAR_ECRAN` couvre les sept
 * écrans d'aujourd'hui, et un test l'exige ; mais l'appelant peut passer `null`
 * avant que le premier écran soit montré, et ce n'est pas une faute.
 *
 * @param {{ecran: string|null, disposition: object[], unites: string[]}} vue
 * @returns {string[]} des clés d'`EVENEMENTS`, triées, sans doublon
 */
export function bouclesDesirees({ ecran = null, disposition = [], unites = [] } = {}) {
  const voulu = new Set();
  const ambiance = ecran === null ? undefined : AMBIANCE_PAR_ECRAN[ecran];
  if (ambiance !== undefined) voulu.add(ambiance);
  for (const piece of disposition) {
    const boucle = BOUCLES_DE_BATIMENT[piece.id];
    if (boucle !== undefined) voulu.add(boucle);
  }
  for (const id of unites) {
    const paire = paireDeLUnite(id);
    const boucle = paire === null ? undefined : MOUVEMENT_PAR_PAIRE[paire];
    if (boucle !== undefined) voulu.add(boucle);
  }
  return [...voulu].sort();
}

/**
 * La taille d'un effondrement, lue sur les PV du bâtiment.
 *
 * ⚠⚠ C'EST UNE PROPOSITION, PAS UN ARBITRAGE, ET ELLE SE CHANGE EN DEUX
 * NOMBRES. Le pack porte trois tailles ; le dépôt ne porte AUCUNE notion de
 * taille de bâtiment. Le brief donnait « l'empreinte » comme candidat naturel :
 * mesuré, elle ne discrimine rien — les onze bâtiments occupent une case. Les PV
 * discriminent et se coupent net : **{1000, 1000, 1500} · {2000, 2500 ×4} ·
 * {3000, 3000, 5500}**, d'où les seuils 2 000 et 3 000 d'`EFFONDREMENT_PV`, qui
 * rendent 3 · 5 · 3. ⚠ `classeDeCout` donnerait presque la même partition — elle
 * ne diverge que sur la Centrale — mais elle a QUATRE classes pour trois
 * tailles : il faudrait en grouper deux, ce qui est le même choix, déguisé en
 * donnée. **Ethan tranche.**
 *
 * @param {string} id une clé de `BASE_BATIMENTS`
 * @returns {string} une clé d'`EVENEMENTS`
 */
export function effondrementDuBatiment(id) {
  const batiment = BASE_BATIMENTS[id];
  if (batiment === undefined) {
    throw new RangeError(`son : « ${id} » n'est pas un bâtiment de la base`);
  }
  const [moyen, grand] = EFFONDREMENT_PV;
  if (batiment.pv >= grand) return 'building_player_collapse_large';
  if (batiment.pv >= moyen) return 'building_player_collapse_medium';
  return 'building_player_collapse_small';
}

/**
 * Quel événement un GESTE du joueur demande — ou `null` s'il n'en demande aucun.
 *
 * ⚠⚠ L'ÉCRAN NOMME UN GESTE, JAMAIS UN SON. C'est la même frontière que
 * `sonDeRefus` du lot SON-MOTEUR, poussée d'un cran : `src/ui/chantier.js` dit
 * « le joueur a démoli une pièce de tel genre », et c'est ici qu'on décide si ça
 * fait du bruit et lequel. La garde `SON T14` refuse de toute façon un appel de
 * `jouer(` dans un écran ; sans ce module, la session porterait la décision.
 *
 * ⚠⚠ ET LE GENRE VIENT DE LA TABLE `TERRAINS`, PAS D'UN `=== 'batiments'` ÉCRIT
 * DANS L'ÉCRAN. Le dépôt a déjà payé ce cas particulier deux fois — `demolir` et
 * `deplacer` reconnus par leur nom —, et deux gardes de `chantier.test.js` le
 * refusent nommément. Démolir une garnison n'est pas un effondrement de
 * bâtiment : le pack n'a pas de son pour ça, et on n'en détourne aucun.
 *
 * @param {string} geste 'selection' · 'pose' · 'amelioration' · 'deplacement'
 *   · 'retrait' · 'attaque'
 * @param {{genre?: string, id?: string}} quoi ce sur quoi le geste porte
 * @returns {string|null}
 */
export function evenementDuGeste(geste, { genre = null, id = null } = {}) {
  switch (geste) {
    case 'selection': return 'order_player_select';
    case 'deplacement': return 'order_player_move';
    case 'attaque': return 'order_player_attack';
    case 'pose':
    case 'amelioration':
      return genre === 'batiment' ? 'building_player_complete' : null;
    case 'retrait':
      return genre === 'batiment' ? effondrementDuBatiment(id) : null;
    default:
      throw new RangeError(`son : geste « ${geste} » inconnu`);
  }
}
