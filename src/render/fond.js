// Le fond peint d'une base — QUEL dessin elle porte, et OÙ il se pose.
//
// ⚠⚠ CE MODULE REMPLACE `render/contour.js`, IL NE S'AJOUTE PAS À LUI — lot
// MUR-PEINT, 03/09. Ethan : « le mur est peint dans le fond, il n'est plus
// dessiné ». L'anneau de blocs que les deux écrans posaient case par case a
// disparu ; ce que le joueur voit du mur, il le voit dans l'image. Le dépôt
// perd donc une géométrie et gagne huit décors.
//
// ⚠⚠ ET C'EST LE MÊME PARTAGE QUE L'ANNEAU AVAIT : ce module ne connaît ni le
// DOM, ni le canevas, ni une image. Il rend un NOM et des unités de CASE, à
// charge des deux écrans de les poser — l'un en fond CSS sur sa grille, l'autre
// en primitive `sprite` sur son canevas. C'est ce qui fait que les deux fonds
// sont le MÊME fond : deux dessins d'une même règle, et non deux règles qui
// finiraient par diverger.

import { GRILLE } from '../data/combat.js';
import { variante } from './variante.js';

/**
 * Ce que le mur peint occupe de chaque côté, en cases.
 *
 * ⚠⚠ UNE DEMI-CASE, ET C'EST MESURÉ SUR L'ART, PAS CHOISI. Les huit planches
 * font 1080 × 2160 ; en y posant une grille de 108 px décalée de 54, la ligne à
 * 54 px longe la face intérieure du parapet peint sur les quatre jets joueur, et
 * son symétrique tombe sur 1026 = 1080 − 54. Donc : case = 108 px, mur = 54 px,
 * image = `0,5 + 9 + 0,5 = 10` cases de large. Ethan a tranché la règle
 * (« le mur occupe une demi-case ») ; l'art la porte déjà.
 *
 * ⚠ ET C'EST UNE DEMI-CASE, PAS UNE CASE PLEINE : l'anneau d'avant prenait une
 * case entière de chaque côté, donc une boîte de 11 × 19. La boîte fait
 * maintenant 10 × 18,5, ce qui fait grossir la case d'environ 10 % à surface
 * d'écran égale. C'est le gain du lot, et il se mesure.
 */
export const MUR_CASES = 0.5;

/**
 * La boîte affichée, en cases : les neuf colonnes jouables entre les deux murs.
 *
 * ⚠ ELLE SE DÉRIVE DE `GRILLE`, ELLE NE S'ÉCRIT PAS « 10 ». Le jour où la base
 * changera de largeur, la boîte suivra et l'image se posera toujours d'un mur à
 * l'autre.
 */
export const LARGEUR_EN_CASES = GRILLE.largeur + 2 * MUR_CASES;

/**
 * La hauteur de la boîte, en cases : le mur du haut, puis les dix-huit rangées.
 *
 * ⚠ RIEN EN BAS, ET C'EST LA MÊME RAISON QU'AU TEMPS DE L'ANNEAU : le U s'ouvre
 * sur les deux rangées de déploiement, par lesquelles l'assaut arrive. Le mur
 * peint ne ferme pas le bas non plus — regardé sur les huit planches, les flancs
 * meurent aux alentours de 57 % de la hauteur, soit la rangée 11 sur 18.
 */
export const HAUTEUR_EN_CASES = GRILLE.longueur + MUR_CASES;

/**
 * La hauteur de l'IMAGE, en cases — plus grande que la boîte, et à dessein.
 *
 * ⚠⚠ LE DÉBORD EST UN ARBITRAGE, PAS UN DÉFAUT. Les planches font 2160 px pour
 * 1080 de large, donc `20` cases de haut quand la boîte n'en fait que 18,5 :
 * `54 + 18 × 108 = 1998` px sur 2160, il reste **162 px, soit 1,5 case** sous la
 * dernière rangée. Ethan : « le débord du bas se laisse déborder sous l'UI […]
 * ni rognage, ni étirement, ni recentrage ». Le terrain en trop passe sous les
 * contrôles, et c'est tout.
 *
 * ⚠ ELLE SE DÉRIVE DU RAPPORT DE L'IMAGE, elle n'est pas un nombre de plus :
 * 2160 / 1080 = 2, donc la hauteur vaut deux fois la largeur en cases. Un test
 * la confronte aux fichiers de `art/sprites/fond/` plutôt que de la croire.
 */
export const HAUTEUR_IMAGE_EN_CASES = LARGEUR_EN_CASES * 2;

/**
 * La bande dont le HAUT porte le mur peint — la base elle-même.
 *
 * ⚠⚠ ELLE VIENT DE `render/contour.js`, QUI DISPARAÎT AVEC L'ANNEAU, ET LE FAIT
 * QU'ELLE PORTE N'A PAS BOUGÉ. `GEOMETRIE_BASE` de `data/base.js` référence déjà
 * `GRILLE.bandes.batiments` : la base EST cette bande-là, et c'est en haut d'elle
 * que le mur court. Ce qui a changé, c'est ce que le mur coûte — une demi-case
 * au lieu d'une case pleine —, pas l'endroit où il est.
 *
 * ⚠ `bornesDeDefilement` de l'écran de la base la LIT pour ne pas couper la
 * bande de mur en défilant jusqu'en haut. C'est son seul lecteur, et c'est la
 * raison pour laquelle elle survit à l'anneau.
 */
export const BANDE_SOUS_LE_MUR = 'batiments';

/**
 * Le côté d'une case DANS l'image source, en pixels.
 *
 * ⚠⚠ IL SE MESURE SUR LES PLANCHES, ET UN TEST LE CONFRONTE AU MANIFESTE.
 * `render/` est pur : il ne lit aucun fichier, et `naturalWidth` n'existe qu'une
 * fois l'image décodée par un navigateur — c'est la règle que le lot
 * MURS-OUVRAGE avait déjà écrite pour la taille source des murs. Les dimensions
 * vivent donc ici en constantes, et `art/sprites/fond/fond-empreintes.json` les
 * dément au dépôt si elles dérivent, pas chez le joueur.
 *
 * ⚠ ET CE N'EST PAS `COTE_SPRITE`. Les sprites de case sont conditionnés à 128 ;
 * les huit décors sont des photographies de 1080 de large pour dix cases, donc
 * 108. Les confondre poserait le fond au mauvais facteur sans qu'une erreur le
 * dise.
 */
export const COTE_CASE_SOURCE = 108;

/** La taille de l'image source, en pixels — dix cases sur vingt. */
export const SOURCE_LARGEUR = LARGEUR_EN_CASES * COTE_CASE_SOURCE;
export const SOURCE_HAUTEUR = HAUTEUR_IMAGE_EN_CASES * COTE_CASE_SOURCE;

/**
 * Quel fond porte quelle base — la règle d'Ethan, du 03/09.
 *
 * ⚠⚠ LA TABLE EST À DEUX ÉTAGES, ET LES DEUX SE VALIDENT. Le premier est le
 * PROPRIÉTAIRE, le second le TYPE DE SITE de `data/sites.js` — `camp`,
 * `avantPoste`, `base`, lus dans la table et non retapés. Le joueur n'a que des
 * `base` : il ne possède ni camp ni avant-poste, et lui en demander un LÈVE au
 * lieu de retomber sur un fond par défaut.
 *
 * ⚠ `camp` ET `avantPoste` PARTAGENT `fond_o_austere`, ET C'EST LA RÈGLE, pas
 * une économie. Ethan les a nommés ensemble ; ce sont les deux sites de butin
 * qui suivent le joueur, quand une `base` est une conquête.
 *
 * ⚠ ET LA LISTE À UN SEUL ÉLÉMENT N'EST PAS UN CAS PARTICULIER : le tirage la
 * traverse comme les autres et rend toujours son unique fond. Écrire une branche
 * « si un seul, le rendre » aurait fait un chemin de code que rien n'éprouve.
 */
export const FONDS = {
  joueur: {
    base: ['fond_j_01', 'fond_j_02', 'fond_j_03', 'fond_j_04'],
  },
  ouvrage: {
    camp: ['fond_o_austere'],
    avantPoste: ['fond_o_austere'],
    base: ['fond_o_hostile', 'fond_o_menacante', 'fond_o_oppressante'],
  },
};

/**
 * Tous les fonds employés, une fois chacun, dans l'ordre.
 *
 * ⚠⚠ ELLE SE DÉRIVE DE LA TABLE, ELLE NE SE RECOPIE PAS. C'est exactement le
 * motif de `nomsDuContour` : le livrable ne porte que ces images-là, et deux
 * endroits ont besoin de la liste — `tools/build.js` par ses marqueurs, et les
 * deux écrans par leur table d'images. Une liste écrite à la main serait la
 * première à mentir le jour où un neuvième décor entrerait au dépôt.
 */
export function tousLesFonds() {
  const vus = [];
  for (const parType of Object.values(FONDS)) {
    for (const noms of Object.values(parType)) {
      for (const nom of noms) if (!vus.includes(nom)) vus.push(nom);
    }
  }
  return vus.sort();
}

/**
 * Les huit décors, et la variable CSS qui porte chacun.
 *
 * ⚠⚠ CE NE SONT PAS DES CELLULES D'ATLAS. Un fond fait 1080 × 2160 ;
 * `tools/atlas.py` exige des cellules CARRÉES d'un même côté, donc il n'en coud
 * aucun. Chaque image entre dans le livrable par son propre marqueur, comme le
 * fond du bassin de l'écran Offense et comme les murs de contour avant eux.
 *
 * ⚠⚠ ET LES HUIT SONT LÀ, PAS SEULEMENT CEUX DU JOUEUR — c'est l'inverse du
 * choix fait pour l'anneau. `VARIABLE_DU_MUR` ne portait que le camp du joueur,
 * l'écran de la base ne montrant que la sienne, et les pièces de l'Ouvrage
 * vivaient en balises `img` pour le canevas du raid. Ici les deux écrans lisent
 * la MÊME déclaration : la feuille porte les huit variables, et
 * `garnirLesAtlas` en donne l'adresse aux huit balises. Les déclarer deux fois
 * les inlinerait deux fois — 3,3 Mo mesurés au lot SPRITES-ET-ZOOM sur quatre
 * atlas bien plus légers.
 *
 * ⚠ ELLE SE DÉRIVE DE LA TABLE DES FONDS, elle ne se recopie pas. Même motif que
 * `VARIABLE_DU_MUR` avant elle : une liste écrite à la main serait la première à
 * oublier un décor le jour où un neuvième entrerait.
 *
 * ⚠⚠ ET ELLE VIT ICI, PAS DANS `ui/`. `VARIABLE_DU_MUR` vivait dans l'écran de
 * la base, parce que lui seul peignait un mur en CSS. Les huit décors servent
 * l'écran de la base ET les balises que `ui/session.js` garnit pour le canevas
 * du raid : la dérivation du nom doit être la MÊME des deux côtés, sinon une
 * balise chercherait `--fond-j-01` pendant que la feuille écrit `--fond_j_01`,
 * et `garnirLesAtlas` lèverait sur une variable vide. Ce module rend déjà des
 * chaînes CSS — `render/sprite.js` en rend deux par sprite depuis toujours.
 */
export const nomCssDuFond = (nom) => `--${nom.replaceAll('_', '-')}`;

export const VARIABLE_DU_FOND = Object.fromEntries(
  tousLesFonds().map((nom) => [nom, `var(${nomCssDuFond(nom)})`]),
);

/**
 * Le sel du tirage du fond — le sixième du dépôt.
 *
 * ⚠ LES CINQ AUTRES SONT PRIS : 0 et 1 départagent les bases de l'Ouvrage
 * (`sim/peuplement.js`), 2 et 3 pavent le fond de la carte
 * (`render/terrain.js`), 4 choisit la variante d'une case (`render/variante.js`).
 * Reprendre l'un des cinq corrélerait le décor d'une base à une décision de jeu
 * prise ailleurs sur les mêmes coordonnées.
 */
export const SEL_FOND = 5;

/**
 * Le fond que porte une base, par son propriétaire, son type et sa case.
 *
 * ⚠⚠ LE TIRAGE EST DÉTERMINISTE ET STABLE, ET IL NE CONSOMME PAS `etat.rng`.
 * C'est la règle de `render/variante.js`, reprise telle quelle : le PRNG de
 * l'état est celui de la SIMULATION, et y prendre un tirage pour choisir un
 * décor décalerait tout ce que le moteur tire ensuite. On passe donc par
 * `variante`, qui est pure et prend la POSITION — donc le même fond à travers un
 * rechargement, une sauvegarde rechargée et les deux écrans.
 *
 * ⚠⚠ ET LA CASE À PASSER EST L'IDENTITÉ DE LA BASE, PAS SA POSITION DU JOUR.
 * Pour le joueur c'est `fondation`, que `CLAUDE.md` désigne comme « l'IDENTITÉ
 * du terrain » et qui ne bouge jamais ; pour un site de l'Ouvrage c'est sa
 * position, un site ne se déplaçant pas. Passer `position` côté joueur ferait
 * changer le décor de sa base à chaque redéploiement — ce que personne n'a
 * demandé, et l'inverse de la stabilité qu'on cherche ici. **Une ligne à changer
 * chez l'appelant si Ethan veut que le décor suive le déménagement.**
 *
 * ⚠ UN PROPRIÉTAIRE OU UN TYPE INCONNU LÈVE. « Un indice n'est pas une
 * interdiction » vaut pour le joueur ; un décor manquant est un fait de
 * PROGRAMME, et retomber sur un fond par défaut le cacherait.
 *
 * @param {string} proprietaire `joueur` ou `ouvrage`
 * @param {string} type un type de `TYPES_SITE` — `camp`, `avantPoste`, `base`
 * @param {number} rangee rangée qui identifie la base
 * @param {number} colonne colonne qui identifie la base
 * @returns {string} le nom du fond, sans extension
 */
export function fondDeLaBase(proprietaire, type, rangee, colonne) {
  const parType = FONDS[proprietaire];
  if (parType === undefined) {
    throw new RangeError(`fond : propriétaire « ${proprietaire} » inconnu`);
  }
  const noms = parType[type];
  if (noms === undefined) {
    throw new RangeError(`fond : « ${proprietaire} » n'a pas de site « ${type} »`);
  }
  return noms[variante(SEL_FOND, rangee, colonne, noms.length)];
}

/**
 * Où l'image du fond se pose, en pixels, pour une projection de canevas.
 *
 * ⚠ ELLE PART DU COIN DE LA BOÎTE, PAS DE CELUI DU CONTENU. `margeX` et
 * `margeY` pointent sur la colonne 1 et la rangée 18 — le mur peint est replié
 * DANS la marge, exactement comme l'anneau l'était —, donc le coin de l'image
 * est une demi-case plus haut et plus à gauche.
 *
 * ⚠ ET LA HAUTEUR EST CELLE DE L'IMAGE, PAS CELLE DE LA BOÎTE : les 1,5 case de
 * débord se dessinent, et c'est le cadre du canevas qui les coupe.
 *
 * ⚠ ELLE REND AUSSI LE RECTANGLE SOURCE, et c'est ce qui en fait une seule
 * vérité : `drawImage` en veut huit nombres, et les quatre du haut n'ont de sens
 * qu'avec les quatre du bas. Les séparer aurait laissé un appelant poser une
 * destination juste sur une source fausse.
 *
 * @param {{tailleCase: number, margeX: number, margeY: number}} projection
 * @returns {{x: number, y: number, l: number, h: number,
 *   sx: number, sy: number, sl: number, sh: number}} en pixels
 */
export function rectangleDuFond(projection) {
  const { tailleCase, margeX, margeY } = projection;
  return {
    x: margeX - MUR_CASES * tailleCase,
    y: margeY - MUR_CASES * tailleCase,
    l: LARGEUR_EN_CASES * tailleCase,
    h: HAUTEUR_IMAGE_EN_CASES * tailleCase,
    sx: 0,
    sy: 0,
    sl: SOURCE_LARGEUR,
    sh: SOURCE_HAUTEUR,
  };
}
