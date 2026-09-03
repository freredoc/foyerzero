// Le peuplement de la carte en bases de l'Ouvrage — dérivé, jamais stocké.
//
// ARBITRÉ le 29/08/2026 par Ethan : « aucune base ouvrage et joueur ne peuvent
// être côte à côte avec une autre base ouvrage joueur — 8 cases autour », « dans
// un carré de 12×12, il y a environ 12 bases ouvrage », « disposition
// irrégulière », et « spawn des bases ouvrage de part et d'autre du joueur, base
// de niveau 1 à 10, à au moins 15 cases du joueur ».
//
// ⚠ RIEN N'EST STOCKÉ, ET C'EST LE POINT DE TOUT LE MODULE. Neuf mille trois
// cents cases, c'est plus que tout le reste de la sauvegarde réuni. Une base est
// donc une FONCTION de la graine et de la case, calculée quand on regarde. Ce
// qui se journalisera plus tard, ce sont les ÉCARTS — un site rasé, un camp qui
// réapparaît —, jamais la carte elle-même.
//
// ⚠⚠ LA RÈGLE DE NON-CONTACT S'EST DESSERRÉE LE 03/09/2026, ET C'ÉTAIT LE SEUL
// MOYEN DE REMPLIR DAVANTAGE. Ethan : « on davantage remplir le monde avec des
// bases ouvrage ». L'exclusion portait sur les HUIT voisines, et ce voisinage
// est un PLAFOND MATHÉMATIQUE : la densité des maxima locaux d'un 3 × 3 vaut
// exactement 1/9, soit 16 par 12 × 12, quelle que soit la probabilité — le dépôt
// en était déjà à 15,7. Elle porte désormais sur les QUATRE voisines
// orthogonales, dont le plafond est 1/5, soit 28,8 ; mesuré, 27,83.
//
// ⚠ CE QUI RESTE VRAI : DEUX BASES NE SONT JAMAIS CÔTE À CÔTE. Elles peuvent se
// toucher par un COIN, jamais par un côté — c'est la lettre du message du 29/08
// (« aucune base ne peut être côte à côte »), et non plus ses « 8 cases autour ».
// `PEUPLEMENT.contactDiagonalPermis` porte la décision, et la remettre à `false`
// rend la carte d'avant à l'identique.
//
// ⚠ LA RÈGLE RESTE APPLIQUÉE LOCALEMENT, SANS PASSE GLOBALE. Une case candidate
// devient une base si son hachage DOMINE celui de ses voisines candidates. Deux
// voisines candidates ne peuvent donc pas gagner toutes les deux, et le contact
// interdit est impossible par construction — sans jamais parcourir la carte.
//
// ⚠ CE MODULE NE POSE NI CAMP NI AVANT-POSTE. Ceux-là ne sont pas sur la carte :
// ils suivent la base du joueur, apparaissent cinq minutes après sa pose ou son
// déplacement, et réapparaissent quand on les détruit. Leur existence dépend de
// l'histoire de la partie, donc du journal, pas d'une graine. Voir `SATELLITES`
// de data/sites.js.
//
// ⚠ ET IL NE DIT PAS LE NIVEAU D'UNE BASE. Le niveau se lit sur la rangée, par
// `niveauDeLaRangee` de sim/carte.js, et c'est ce qui fait sortir tout seul le
// « niveau 1 à 10 » des rangées basses. Le recopier ici serait une seconde table.

import { GEOGRAPHIE, PEUPLEMENT } from '../data/sites.js';
import { estSurLaCarte, positionDepartJoueur } from './carte.js';

/**
 * Hachage d'une case, salé.
 *
 * ⚠ POURQUOI PAS `graineDePosition` DE sim/champs.js. Celle-là ne prend NI la
 * graine de la partie NI de sel : deux parties porteraient la même carte, et le
 * tirage « candidate ou non » partagerait son flux avec celui du départage. Or
 * les deux doivent être indépendants — sinon les cases les plus susceptibles
 * d'être candidates seraient aussi celles qui gagnent leurs duels, et les bases
 * se regrouperaient au lieu de se répartir.
 *
 * La constante est celle de FNV-1a, comme dans champs.js : même famille, même
 * lecture, et un mélange par coordonnée pour que (3, 12) et (12, 3) ne tombent
 * pas ensemble.
 *
 * @param {number} graine graine de la partie
 * @param {number} rangee
 * @param {number} colonne
 * @param {number} sel 0 pour « candidate », 1 pour le départage
 * @returns {number} réel de [0, 1[
 */
export function hachageDeCase(graine, rangee, colonne, sel) {
  return hachageBrut(graine, rangee, colonne, sel) / 0x100000000;
}

/**
 * Le même hachage, rendu ENTIER sur 32 bits non signés.
 *
 * ⚠ IL EXISTE POUR QUE PERSONNE N'EN ÉCRIVE UN SECOND. Le pavage du fond de
 * carte (`render/terrain.js`) a besoin de plusieurs CHAMPS par nœud — un
 * décalage sur chaque axe, un numéro de tuile, une rotation, un miroir, un
 * tirage d'appartenance —, donc de bits, pas d'un réel de [0, 1[. Réécrire une
 * seconde famille de hachage pour ça aurait donné deux tirages voisins dans le
 * dépôt, tous deux « FNV, à peu près », dont un seul serait testé.
 *
 * ⚠ ET LES BITS SE COMPTENT AVANT DE SE DÉCOUPER. Il y en a TRENTE-DEUX, pas
 * un de plus : lire un champ dans `h >>> 29` n'en laisse que trois, donc une
 * valeur toujours minuscule — la faute a été commise pendant la maquette et
 * faisait basculer *toutes* les tuiles du même côté. Un champ qui n'a pas assez
 * de bits se tire d'un second hachage salé, jamais du même en le pressant.
 *
 * @param {number} graine graine de la partie
 * @param {number} a
 * @param {number} b
 * @param {number} sel
 * @returns {number} entier de [0, 2³²[
 */
export function hachageBrut(graine, a, b, sel) {
  let h = 0x811c9dc5;
  for (const v of [graine, a, b, sel]) {
    h = Math.imul(h ^ (v & 0xffff), 0x01000193) >>> 0;
    h = Math.imul(h ^ ((v >>> 16) & 0xffff), 0x01000193) >>> 0;
  }
  // Un dernier brassage : sans lui, les bits de poids faible de deux cases
  // voisines restent corrélés, et le départage cesse d'être un départage.
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h ^= h >>> 12;
  return h >>> 0;
}

/**
 * La case est-elle assez loin de la position de DÉPART du joueur ?
 *
 * ⚠⚠ EUCLIDE DEPUIS LE LOT EUCLIDE (02/09/2026), ARBITRÉ PAR ETHAN. Ce
 * commentaire disait : « distance de Tchebychev — le maximum des deux écarts —,
 * parce que la carte est une grille et qu'une base en diagonale n'est pas plus
 * loin qu'une base droit devant ». La règle a changé EN MÊME TEMPS que la portée
 * du raid et que les anneaux des satellites : la carte compte désormais une
 * diagonale pour ce qu'elle vaut, partout, et c'est ce qui garde la cohérence
 * que l'ancienne phrase défendait.
 *
 * ⚠ ET CE N'EST PAS NEUTRE : LA ZONE INTERDITE RÉTRÉCIT. Le carré de 31 × 31
 * devient un disque — mesuré, **841 cases interdites deviennent 697**, donc
 * **144 cases libérées**, toutes dans les diagonales. La base ennemie la plus
 * proche peut s'installer à onze cases du départ en ligne de grille, là où il en
 * fallait quinze. Combiné au doublement du peuplement du même lot, le début de
 * partie durcit deux fois — c'est une conséquence chiffrée de deux décisions
 * d'Ethan, pas un effet de bord à corriger.
 *
 * ⚠ AU CARRÉ DES DEUX CÔTÉS, JAMAIS DE RACINE. `d² ≥ garde²` : deux entiers,
 * une comparaison exacte, aucun arrondi à débattre.
 *
 * ⚠ LA GARDE SE MESURE DEPUIS LE DÉPART, QUI EST FIXE — cette moitié-là n'a pas
 * bougé. Si elle suivait la base, les bases s'écarteraient à chaque
 * redéploiement et il faudrait toutes les journaliser.
 *
 * @param {number} rangee
 * @param {number} colonne
 * @returns {boolean}
 */
export function horsDeLaGarde(rangee, colonne) {
  const depart = positionDepartJoueur();
  const dr = rangee - depart.rangee;
  const dc = colonne - depart.colonne;
  const garde = PEUPLEMENT.gardeAutourDuDepart;
  return dr * dr + dc * dc >= garde * garde;
}

/**
 * Les voisines dont une candidate doit dominer le hachage pour devenir une base.
 *
 * ⚠⚠ LA LISTE EST CALCULÉE UNE FOIS, ET C'EST ELLE QUI PORTE LA DENSITÉ. Quatre
 * voisines orthogonales quand le contact diagonal est permis, les huit sinon :
 * le plafond de densité vaut 1/(1 + n) par case, donc 28,8 par 12 × 12 contre 16.
 * Aucun autre réglage ne peut franchir ce plafond — ni la probabilité, ni la
 * garde, ni la taille de la carte.
 *
 * ⚠ ELLE NE CONTIENT JAMAIS (0, 0). Une case qui devrait dominer son propre
 * hachage ne serait JAMAIS une base : la comparaison est `>=`, donc elle
 * perdrait contre elle-même, et la carte serait vide sans qu'une seule ligne
 * n'ait l'air fausse.
 */
export const VOISINES_EXCLUES = (() => {
  const liste = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      if (PEUPLEMENT.contactDiagonalPermis && dr !== 0 && dc !== 0) continue;
      liste.push([dr, dc]);
    }
  }
  return liste;
})();

/** Une case candidate est une case que le premier tirage retient. */
function estCandidate(graine, rangee, colonne) {
  if (!estSurLaCarte(rangee, colonne)) return false;
  if (!horsDeLaGarde(rangee, colonne)) return false;
  return hachageDeCase(graine, rangee, colonne, 0) < PEUPLEMENT.probabiliteCandidate;
}

/**
 * Y a-t-il une base de l'Ouvrage sur cette case ?
 *
 * Une case porte une base si elle est candidate et si aucune de ses voisines
 * candidates — celles de `VOISINES_EXCLUES` — ne la domine au départage. La
 * comparaison est stricte : à égalité — c'est-à-dire jamais, en pratique — la
 * case perd, ce qui est le seul sens qui garantisse qu'aucune paire ne gagne
 * ensemble.
 *
 * @param {number} graine graine de la partie
 * @param {number} rangee
 * @param {number} colonne
 * @returns {boolean}
 */
export function estBaseOuvrage(graine, rangee, colonne) {
  if (!estCandidate(graine, rangee, colonne)) return false;
  const mien = hachageDeCase(graine, rangee, colonne, 1);
  for (const [dr, dc] of VOISINES_EXCLUES) {
    const r = rangee + dr;
    const c = colonne + dc;
    if (!estCandidate(graine, r, c)) continue;
    if (hachageDeCase(graine, r, c, 1) >= mien) return false;
  }
  return true;
}

/**
 * Les bases de l'Ouvrage d'une fenêtre rectangulaire de la carte.
 *
 * C'est ce que l'écran appellera : il ne connaît que ce qu'il affiche, et la
 * fenêtre la plus large — 31 colonnes sur une quarantaine de rangées au cran de
 * zoom le plus bas — représente moins de 1 500 cases.
 *
 * ⚠ LA FENÊTRE EST ROGNÉE SUR LA CARTE, ELLE N'EST PAS REFUSÉE. Un écran qui
 * défile au doigt demande naturellement des rangées au-delà du bord ; lever
 * obligerait chaque appelant à borner lui-même, et le premier qui oublierait
 * ferait tomber l'affichage au lieu de montrer un bord.
 *
 * @param {number} graine
 * @param {{premiereRangee: number, derniereRangee: number,
 *   premiereColonne: number, derniereColonne: number}} fenetre
 * @returns {Array<{rangee: number, colonne: number}>} triée par rangée puis colonne
 */
export function basesDeLaFenetre(graine, fenetre) {
  const r0 = Math.max(1, fenetre.premiereRangee);
  const r1 = Math.min(GEOGRAPHIE.carte.hauteur, fenetre.derniereRangee);
  const c0 = Math.max(1, fenetre.premiereColonne);
  const c1 = Math.min(GEOGRAPHIE.carte.largeur, fenetre.derniereColonne);
  const bases = [];
  for (let rangee = r0; rangee <= r1; rangee++) {
    for (let colonne = c0; colonne <= c1; colonne++) {
      if (estBaseOuvrage(graine, rangee, colonne)) bases.push({ rangee, colonne });
    }
  }
  return bases;
}
