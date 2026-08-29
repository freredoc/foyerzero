// Le site d'une case — ce qu'il y a sur la carte, et ce que le joueur en voit
// avant de partir dessus.
//
// C'est le chaînon qui manquait au raid. `sim/generateur.js` sait peupler un
// site depuis `{ type, niveau, saveur, graine }` ; `sim/peuplement.js` sait où
// sont les bases de l'Ouvrage ; `sim/satellites.js` sait où sont les camps du
// joueur. Rien, jusqu'ici, ne traduisait UNE CASE en ces quatre paramètres.
//
// ⚠ DEUX GRAINES, ET C'EST UN ARBITRAGE D'ETHAN DU 29/08 : « deux camps qui
// apparaissent sur la même case l'un après l'autre auront les mêmes
// dispositions quartz scories obstacles, mais des dispositions bâtiment défense
// différentes ». Le TERRAIN se dérive de la case seule, les OCCUPANTS de la case
// ET du numéro d'instance. La moitié « quartz scories » de sa phrase, au niveau
// d'un site, c'est la SAVEUR : elle est ici, et elle est stable par case.
//
// ⚠ L'AUTRE MOITIÉ — LES OBSTACLES — N'EST PAS TENUE, ET C'EST MESURÉ, PAS
// SUPPOSÉ. `genererSite` place ses obstacles EN DERNIER, dans les cases que les
// bâtiments et les défenses ont laissées libres ; ils dépendent donc de la
// disposition, donc de l'instance, quelle que soit la graine qu'on leur donne.
// Les tenir demanderait de tirer les obstacles EN PREMIER et d'apprendre à
// `placerDefenses` à les éviter — c'est-à-dire de déplacer chaque défense de
// chaque site déjà généré, dont les six raids de référence dont le butin est
// mesuré au champ près. Ce lot ne le fait pas, un test MESURE l'écart, et le
// rapport le chiffre.
//
// ⚠ AUCUN HACHAGE NEUF ICI. `hachageBrut` de `sim/peuplement.js` existe
// exactement pour ça — son en-tête le dit : « il existe pour que personne n'en
// écrive un second ». Les sels 0 et 1 sont au peuplement, 2 et 3 au pavage du
// fond de carte ; ce module prend 4 et 5.

import { SAVEURS, GEOGRAPHIE } from '../data/sites.js';
import { UNITES, DEFENSES } from '../data/combat.js';
import { estSurLaCarte, niveauDeLaRangee } from './carte.js';
import { estBaseOuvrage, hachageBrut } from './peuplement.js';
import { genererSite } from './generateur.js';
import { butin, creerCombat, construireResultat } from './combat.js';
import { basesDuJoueur, distanceTchebychev } from './points-attaque.js';

/** Sel du tirage qui ne dépend que de la CASE : la saveur, et le terrain. */
export const SEL_TERRAIN_DU_SITE = 4;
/** Sel du tirage qui dépend de la case ET de l'instance : les occupants. */
export const SEL_INSTANCE_DU_SITE = 5;

/**
 * L'instance d'un site qui n'en a pas : une base de l'Ouvrage.
 *
 * ⚠ UNE BASE N'A PAS D'INSTANCE PARCE QU'ELLE NE RENAÎT PAS. `TYPES_SITE.base`
 * porte `respawn: false` et `destructionDefinitive: false` : elle se répare,
 * elle ne se remplace pas. Ses occupants sont donc aussi stables que sa case, et
 * zéro est la valeur qui le dit — pas un numéro qui n'avancerait jamais.
 */
export const INSTANCE_DUNE_BASE = 0;

/**
 * La graine du TERRAIN d'une case : elle ignore l'instance, exprès.
 * @param {number} graine graine de la partie
 * @param {number} rangee
 * @param {number} colonne
 * @returns {number} entier de [0, 2³²[
 */
export function graineDuTerrain(graine, rangee, colonne) {
  return hachageBrut(graine, rangee, colonne, SEL_TERRAIN_DU_SITE);
}

/**
 * La graine des OCCUPANTS : la case, puis l'instance mélangée par-dessus.
 *
 * ⚠ DEUX PASSES, PARCE QUE `hachageBrut` NE PREND QUE DEUX COORDONNÉES. La
 * première réduit la case à un entier, la seconde y mêle l'instance sous un
 * autre sel. C'est le même hachage employé deux fois, pas une seconde famille.
 *
 * @param {number} graine
 * @param {number} rangee
 * @param {number} colonne
 * @param {number} instance
 * @returns {number} entier de [0, 2³²[
 */
export function graineDeLInstance(graine, rangee, colonne, instance) {
  if (!Number.isInteger(instance) || instance < 0) {
    throw new RangeError(`site : instance « ${instance} » — entier ≥ 0 attendu`);
  }
  const deLaCase = hachageBrut(graine, rangee, colonne, SEL_TERRAIN_DU_SITE);
  return hachageBrut(deLaCase, instance, 0, SEL_INSTANCE_DU_SITE);
}

/**
 * Les deux saveurs, dans l'ordre où le tirage les rend.
 *
 * ⚠ DEUX, PAS TROIS, ET LA SPEC LE DIT : « deux variantes de camp et
 * d'avant-poste : riche quartz (75/25) ou riche scorie (l'inverse). Les bases
 * sont proportionnelles. » La clé `base` de `SAVEURS` vaut `null` — c'est
 * l'absence d'inclinaison d'une BASE, pas une troisième saveur qu'un camp
 * pourrait tirer.
 */
export const SAVEURS_TIRABLES = ['richeQuartz', 'richeScorie'];

/**
 * La saveur d'un site posé sur cette case — `null` pour une base.
 *
 * ⚠ ELLE EST DE LA CASE, PAS DE L'INSTANCE. Deux camps successifs sur la même
 * case sont riches de la même chose : c'est l'arbitrage du 29/08, et c'est aussi
 * ce qui fait de la saveur une géographie plutôt qu'une loterie.
 *
 * @param {number} graine
 * @param {number} rangee
 * @param {number} colonne
 * @param {string} type
 * @returns {string|null}
 */
export function saveurDeLaCase(graine, rangee, colonne, type) {
  if (type === 'base') return null;
  const h = graineDuTerrain(graine, rangee, colonne);
  return SAVEURS_TIRABLES[h % SAVEURS_TIRABLES.length];
}

/**
 * Ce qu'il y a sur une case — `null` s'il n'y a rien à attaquer.
 *
 * Trois sources, dans cet ordre, et elles ne se recouvrent jamais :
 *   1. une base du JOUEUR : ce n'est pas une cible, donc `null` ;
 *   2. un satellite posé — il est dans la sauvegarde, avec son instance ;
 *   3. une base de l'Ouvrage — elle est dérivée de la graine, sans instance.
 *
 * ⚠ L'ORDRE COMPTE, MÊME SI RIEN NE SE RECOUVRE AUJOURD'HUI.
 * `poserUnSatellite` refuse déjà de poser sur une base de l'Ouvrage, donc les
 * cas 2 et 3 s'excluent par construction. Mais c'est une propriété du POSEUR,
 * pas de la case : si elle cessait un jour d'être vraie, mieux vaut que le site
 * stocké gagne sur le site dérivé — l'un porte de l'histoire, l'autre se
 * recalcule.
 *
 * @param {object} etat
 * @param {number} rangee
 * @param {number} colonne
 * @returns {{type: string, niveau: number, saveur: string|null, instance: number,
 *   rangee: number, colonne: number}|null}
 */
export function siteDeLaCase(etat, rangee, colonne) {
  if (!estSurLaCarte(rangee, colonne)) return null;
  const ici = { rangee, colonne };

  for (const base of basesDuJoueur(etat)) {
    if (distanceTchebychev(base.position, ici) === 0) return null;
  }

  for (const s of etat.satellites?.presents ?? []) {
    if (s.rangee !== rangee || s.colonne !== colonne) continue;
    return {
      type: s.type,
      niveau: s.niveau,
      saveur: saveurDeLaCase(etat.graine, rangee, colonne, s.type),
      instance: s.instance,
      rangee,
      colonne,
    };
  }

  // ⚠ UNE BASE RASÉE NE REVIENT PAS. Elle est DÉRIVÉE de la graine, donc rien
  // ne l'empêcherait de reparaître au prochain calcul : c'est la liste des
  // rasées qui porte le seul fait que la graine ne peut pas connaître.
  // `TYPES_SITE.base.respawn` vaut `false`, et la §10 de la spec le redit.
  if ((etat.basesRasees ?? []).includes(`${rangee}:${colonne}`)) return null;

  if (estBaseOuvrage(etat.graine, rangee, colonne)) {
    return {
      type: 'base',
      // ⚠ LE NIVEAU D'UNE BASE SE LIT SUR SA RANGÉE, et il n'y a pas d'autre
      // règle : `GEOGRAPHIE.niveauParCase` est la seule chose qui fasse monter
      // la carte. Le peuplement s'appuie déjà dessus pour que les bases proches
      // du départ soient « de niveau 1 à 10 ».
      niveau: niveauDeLaRangee(rangee),
      saveur: null,
      instance: INSTANCE_DUNE_BASE,
      rangee,
      colonne,
    };
  }

  return null;
}

/**
 * Le montage de combat d'un site — ce que le raid affrontera.
 *
 * ⚠ `vagues` EST VIDE, ET C'EST LE CONTRAT DE `genererSite` : la force d'assaut
 * est celle du joueur, le site ne la connaît pas. C'est l'appelant du combat qui
 * la compose.
 *
 * @param {number} graine graine de la partie
 * @param {object} identite ce que rend `siteDeLaCase`
 * @returns {object} montage pour `creerCombat`
 */
export function montageDuSite(graine, identite) {
  exigerIdentite(identite);
  return genererSite({
    type: identite.type,
    niveau: identite.niveau,
    saveur: identite.saveur,
    graine: graineDeLInstance(graine, identite.rangee, identite.colonne, identite.instance),
  });
}

function exigerIdentite(identite) {
  if (identite === null || typeof identite !== 'object') {
    throw new TypeError('site : identité attendue — `siteDeLaCase` rend `null` sur une case vide');
  }
  for (const champ of ['type', 'niveau', 'instance', 'rangee', 'colonne']) {
    if (identite[champ] === undefined) {
      throw new RangeError(`site : l'identité ne porte pas « ${champ} »`);
    }
  }
}

/**
 * Ce que pèse la garnison d'un site, en POINTS D'ARMÉE.
 *
 * ⚠ C'EST LA MÊME UNITÉ QUE CELLE DU JOUEUR, ET C'EST TOUT L'INTÉRÊT. Le joueur
 * lit déjà « 190 / 220 points » sur ses propres bandes ; dire d'une cible
 * qu'elle en pèse 240 se compare sans conversion. `pointsEngages` de
 * `sim/state.js` fait exactement cette somme sur les pièces du joueur — un test
 * confronte les deux résultats sur la même liste, pour qu'aucune des deux ne
 * dérive de l'autre.
 *
 * ⚠ LES DEUX TABLES SONT INTERROGÉES, dans le même ordre que `pointsEngages` :
 * une garnison de site mêle des ouvrages et des unités mobiles.
 *
 * @param {Array<{id: string}>} defenseurs
 * @returns {number} points
 */
export function forceDeLaDefense(defenseurs) {
  let total = 0;
  for (const d of defenseurs) {
    const ligne = DEFENSES[d.id] ?? UNITES[d.id];
    if (ligne === undefined) {
      throw new Error(`site : « ${d.id} » n'est ni une défense ni une unité`);
    }
    total += ligne.points;
  }
  return total;
}

/**
 * Ce que le site rend SI TOUT TOMBE — les « ressources récupérables » du
 * mini-onglet.
 *
 * ⚠ ELLE PASSE PAR `butin`, ELLE NE REFAIT PAS LE CALCUL. Réécrire ici la somme
 * des `butinPlein` donnerait un second barème, et le mini-onglet finirait par
 * annoncer autre chose que ce que le raid verse.
 *
 * ⚠ ELLE MONTE UN COMBAT POUR LE DEMANDER, et ce n'est pas un détour. Depuis
 * l'arbitrage du 29/08 — « livre ce qui reste à livrer » —, un rasage ne paie
 * plus le plein nominal mais ce qui était encore DEBOUT en arrivant. La réponse
 * dépend donc des PV du montage, que seul `creerCombat` sait mettre à l'échelle
 * du niveau. Sur un site entamé, le nombre annoncé baisse à mesure que le joueur
 * l'use : c'est ce qu'il lui reste à prendre, pas ce que le site valait neuf.
 *
 * @param {object} montage
 * @returns {{quartz: number, scorie: number}}
 */
export function butinSiToutTombe(montage) {
  const resultat = construireResultat(creerCombat({ ...montage, vagues: [] }));
  resultat.cause = 'souche';
  return butin(resultat, montage);
}

/**
 * Le mini-onglet, en une fonction : tout ce que le joueur voit au premier
 * toucher sur une cible.
 *
 * ⚠ LE MONTAGE PEUT ÊTRE FOURNI, et c'est ce qui permet à `sim/site-entame.js`
 * de résumer un site ENTAMÉ sans écrire un second résumé. Sans lui, le
 * mini-onglet annoncerait toujours le site intact — donc un butin que le joueur
 * ne ramènera pas, puisqu'il a déjà cassé la moitié des bâtiments à la
 * première passe.
 *
 * @param {number} graine
 * @param {object} identite
 * @param {object} [montage] le montage COURANT ; à défaut, le site intact
 * @returns {{type: string, niveau: number, saveur: string|null, rangee: number,
 *   colonne: number, batiments: number, defenseurs: number,
 *   butinSiToutTombe: {quartz: number, scorie: number}, forceDeLaDefense: number}}
 */
export function resumeDuSite(graine, identite, montageFourni = null) {
  const montage = montageFourni ?? montageDuSite(graine, identite);
  return {
    type: identite.type,
    niveau: identite.niveau,
    saveur: identite.saveur ?? null,
    rangee: identite.rangee,
    colonne: identite.colonne,
    batiments: montage.batiments.length,
    defenseurs: montage.defenseurs.length,
    butinSiToutTombe: butinSiToutTombe(montage),
    forceDeLaDefense: forceDeLaDefense(montage.defenseurs),
  };
}

/**
 * Les cibles à portée d'une base, avec leur identité — ce que l'écran de la
 * carte parcourra pour savoir quoi dessiner comme attaquable.
 *
 * ⚠ ELLE BALAIE UN CARRÉ DE TCHEBYCHEV, pas un disque : c'est la même distance
 * que le barème du raid et que la garde du peuplement. Au rayon 10, ça fait
 * 440 cases — assez peu pour être balayé à chaque ouverture d'écran, assez pour
 * ne pas le faire à chaque image.
 *
 * @param {object} etat
 * @param {{position: {rangee: number, colonne: number}}} baseAttaquante
 * @returns {Array<object>} identités, du plus proche au plus loin
 */
export function ciblesAPortee(etat, baseAttaquante) {
  const { rangee: r0, colonne: c0 } = baseAttaquante.position;
  const rayon = GEOGRAPHIE.rayonAttaque;
  const trouvees = [];
  for (let r = r0 - rayon; r <= r0 + rayon; r += 1) {
    for (let c = c0 - rayon; c <= c0 + rayon; c += 1) {
      if (r === r0 && c === c0) continue;
      const site = siteDeLaCase(etat, r, c);
      if (site === null) continue;
      trouvees.push({ ...site, distance: Math.max(Math.abs(r - r0), Math.abs(c - c0)) });
    }
  }
  trouvees.sort((a, b) => a.distance - b.distance
    || a.rangee - b.rangee || a.colonne - b.colonne);
  return trouvees;
}

/** Exporté pour le test qui croise les saveurs tirables et la table. */
export const SAVEURS_CONNUES = Object.keys(SAVEURS);
