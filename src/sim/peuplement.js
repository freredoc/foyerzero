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
// ⚠⚠ LA CARTE S'EST REMPLIE LE 03/09/2026, ET L'EXCLUSION N'A PAS BOUGÉ D'UNE
// CASE. Ethan : « on davantage remplir le monde avec des bases ouvrage ». La
// première réponse a été de desserrer le voisinage aux QUATRE voisines
// orthogonales, au motif que les huit plafonnaient la carte à 16 par 12 × 12 ;
// Ethan l'a refusée le jour même — « je suis sûr à 100 % qu'on n'est pas obligé
// de mettre des bases en diagonale » —, et il avait raison.
//
// ⚠⚠ LE 16 ÉTAIT LE PLAFOND D'UNE SEULE PASSE, PAS CELUI DE LA RÈGLE. La
// densité des maxima locaux d'un champ indépendant dans un voisinage de neuf
// vaut exactement 1/9 : c'est une propriété de la SÉLECTION. La règle, elle —
// « aucune base dans les huit cases autour » —, admet un damier au pas de deux,
// soit 36 par 12 × 12. Entre les deux il y avait un facteur d'un peu plus de
// deux, et il se prend en REPOSANT des bases sur ce que la première passe a
// laissé libre.
//
// ⚠⚠ D'OÙ LES TOURS. Au tour 1, une case candidate devient une base si son
// hachage domine celui de ses huit voisines candidates. Au tour `k`, on
// recommence, mais seules concourent les cases qu'aucun tour précédent n'a
// prises ni voisinées. `PEUPLEMENT.toursDePeuplement` en fixe le nombre — quatre,
// où la densité est au point fixe à un centième près. Le résultat est un
// ensemble indépendant MAXIMAL : plus aucune case ne pourrait être ajoutée sans
// toucher une base.
//
// ⚠ ET DEUX BASES NE SE TOUCHENT JAMAIS, PAS MÊME PAR UN COIN. C'est vrai tour
// par tour et donc vrai en tout : deux voisines candidates ne peuvent pas gagner
// ensemble au même tour, et une case prise interdit ses huit voisines à tous les
// tours suivants. Le message du 29/08 — « 8 cases autour » — est appliqué à la
// lettre.
//
// ⚠ LA RÈGLE RESTE LOCALE, SANS AUCUNE PASSE GLOBALE, et c'est ce qui garde le
// peuplement dérivé. Le tour `k` d'une case dépend du tour `k − 1` de ses
// voisines : la récursion regarde donc un rayon de `toursDePeuplement` cases et
// s'arrête là. Mesuré : 59 hachages par appel isolé contre 9 auparavant. Une
// fenêtre d'écran de 1 240 cases passe de **0,9 à 2,4 ms** — et non à 5,5, qui
// serait le prix d'un mémo par case ; voir `priseAUnTour`.
//
// ⚠⚠ ET ELLE REND EXACTEMENT CE QUE RENDRAIT LA PASSE GLOBALE — vérifié case
// par case, 0 désaccord sur 27 900 cases et trois graines, par le test qui
// réimplémente l'itération sur la carte entière. C'est la seule garde qui dise
// que la récursion locale n'a pas oublié un tour.
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
 * Les huit voisines : celles qu'une base interdit, et celles dont une candidate
 * doit dominer le hachage pour gagner un tour.
 *
 * ⚠⚠ C'EST LA RÈGLE D'ETHAN DU 29/08, ET ELLE N'A JAMAIS DE VARIANTE. « Aucune
 * base ouvrage et joueur ne peuvent être côte à côte avec une autre base ouvrage
 * joueur — 8 cases autour. » Une liste de quatre a existé quelques heures le
 * 03/09, le temps qu'on croie le voisinage responsable du plafond de densité ;
 * ce n'était pas lui, c'était la passe unique. Ne pas la réintroduire pour
 * gagner des bases : ce sont les TOURS qui les donnent.
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
 * La case est-elle PRISE au tour `tour` ?
 *
 * Elle l'est si elle est candidate, encore libre à ce tour, et si son hachage
 * domine celui de toutes ses voisines encore libres. La comparaison est stricte :
 * à égalité — c'est-à-dire jamais, en pratique — la case perd, ce qui est le
 * seul sens qui garantisse qu'aucune paire de voisines ne gagne ensemble.
 *
 * ⚠ LE MÉMO EST OBLIGATOIRE, ET IL EST PROPRE À UN APPEL. Sans lui, `libreAuTour`
 * redemanderait les tours précédents de chaque voisine pour chacune des huit
 * voisines : le coût partirait en 9 puissance `tour`. Avec lui, un appel isolé
 * coûte 59 hachages, mesuré. Il ne survit PAS à l'appel — un cache partagé entre
 * deux graines serait une source de vérité de plus, et il faudrait le vider.
 *
 * @param {number} graine
 * @param {number} rangee
 * @param {number} colonne
 * @param {number} tour de 1 à `PEUPLEMENT.toursDePeuplement`
 * @param {Map<string, boolean>} memo
 * @returns {boolean}
 */
function priseAuTour(graine, rangee, colonne, tour, memo) {
  const cle = `${rangee},${colonne},${tour}`;
  const vu = memo.get(cle);
  if (vu !== undefined) return vu;
  let prise = false;
  if (estCandidate(graine, rangee, colonne)
    && libreAuTour(graine, rangee, colonne, tour, memo)) {
    prise = true;
    const mien = hachageDeCase(graine, rangee, colonne, 1);
    for (const [dr, dc] of VOISINES_EXCLUES) {
      const r = rangee + dr;
      const c = colonne + dc;
      if (!estCandidate(graine, r, c)) continue;
      if (!libreAuTour(graine, r, c, tour, memo)) continue;
      if (hachageDeCase(graine, r, c, 1) >= mien) { prise = false; break; }
    }
  }
  memo.set(cle, prise);
  return prise;
}

/**
 * La case est-elle encore libre à l'entrée du tour `tour` ?
 *
 * Elle l'est si aucun tour antérieur ne l'a prise, ELLE ou l'une de ses huit
 * voisines. C'est cette seconde moitié qui fait la règle de non-contact : une
 * base prise au tour 1 retire ses voisines de tous les tours suivants.
 *
 * ⚠ LA BOUCLE VA DE 1 À `tour − 1`, JAMAIS JUSQU'À `tour`. S'y inclure ferait
 * demander à une case si elle est prise au tour où l'on cherche justement à le
 * savoir : récursion infinie, et la pile part avant qu'un test ne dise quoi que
 * ce soit.
 *
 * @param {number} graine
 * @param {number} rangee
 * @param {number} colonne
 * @param {number} tour
 * @param {Map<string, boolean>} memo
 * @returns {boolean}
 */
function libreAuTour(graine, rangee, colonne, tour, memo) {
  for (let j = 1; j < tour; j += 1) {
    if (priseAuTour(graine, rangee, colonne, j, memo)) return false;
    for (const [dr, dc] of VOISINES_EXCLUES) {
      if (priseAuTour(graine, rangee + dr, colonne + dc, j, memo)) return false;
    }
  }
  return true;
}

/**
 * Y a-t-il une base de l'Ouvrage sur cette case ?
 *
 * Elle en porte une si elle est prise à l'un des `toursDePeuplement` tours. Voir
 * l'en-tête du module : la passe unique plafonnait la carte à 16 bases par
 * 12 × 12, les tours la portent à 25,4 sans toucher à la règle de non-contact.
 *
 * ⚠ LE PREMIER REFUS EST UN RACCOURCI, PAS UNE RÈGLE DE PLUS. Une case non
 * candidate n'est prise à aucun tour ; le dire ici évite d'ouvrir un mémo pour
 * les deux tiers de la carte, et c'est mesurable — sans lui, une fenêtre d'écran
 * coûte le double.
 *
 * @param {number} graine graine de la partie
 * @param {number} rangee
 * @param {number} colonne
 * @returns {boolean}
 */
export function estBaseOuvrage(graine, rangee, colonne) {
  return priseAUnTour(graine, rangee, colonne, new Map());
}

/**
 * Le corps de `estBaseOuvrage`, avec le mémo passé par l'appelant.
 *
 * ⚠ IL EXISTE POUR QUE `basesDeLaFenetre` N'EN OUVRE QU'UN SEUL. Une fenêtre
 * d'écran demande 1 240 cases voisines les unes des autres, et leurs récursions
 * se recouvrent presque entièrement : un mémo par case refait le même travail
 * huit fois. Mesuré — 5,5 ms par fenêtre avec un mémo par case, 2,4 ms avec un
 * mémo partagé.
 *
 * ⚠⚠ ET LE MÉMO EST PROPRE À UNE GRAINE. La clé ne porte que la case et le tour ;
 * le partager entre deux graines rendrait la carte de la première. C'est
 * l'appelant qui garantit l'unicité — `basesDeLaFenetre` en prend UNE en
 * argument —, et un test compare les deux chemins case par case.
 */
function priseAUnTour(graine, rangee, colonne, memo) {
  if (!estCandidate(graine, rangee, colonne)) return false;
  for (let tour = 1; tour <= PEUPLEMENT.toursDePeuplement; tour += 1) {
    if (priseAuTour(graine, rangee, colonne, tour, memo)) return true;
  }
  return false;
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
  const memo = new Map();
  for (let rangee = r0; rangee <= r1; rangee++) {
    for (let colonne = c0; colonne <= c1; colonne++) {
      if (priseAUnTour(graine, rangee, colonne, memo)) bases.push({ rangee, colonne });
    }
  }
  return bases;
}
