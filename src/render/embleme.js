// Quel dessin porte un site de la carte du monde — un module PUR.
//
// ⚠ IL NE TOUCHE NI AU DOM NI À UN CONTEXTE. Il rend des NOMS de sprite et une
// géométrie ; `src/ui/monde.js` appelle `drawImage`. C'est la même discipline
// que `render/scene.js`, qui émet des primitives sans jamais voir une image.
//
// ⚠⚠ LE FICHIER S'APPELLE `embleme.js`, AU SINGULIER, ET CE N'EST PAS
// NÉGOCIABLE. `tools/emblemes.py` produit les sprites que ce module nomme ; un
// sélecteur de téléphone n'affiche que les noms courts, et deux fichiers qui ne
// diffèrent que par un `s` final sont exactement l'accident du 27/08 où le
// moteur de combat a été écrasé par la table de données du même nom court
// (CLAUDE.md §6, homonymes).
//
// ⚠⚠ LES SEPT POI NE SONT PLUS PRÉ-BRANCHÉS : ILS SONT BRANCHÉS. Le lot POI du
// 31/08 a écrit le modèle qui manquait — `sim/poi.js` produit soixante-dix sites
// de type POI, `EMBLEMES_CARTE` porte leurs sept entrées, et `spriteDuSite` les
// résout. **Le pré-branchement du 26/08 aura tenu cinq jours et il a tenu sa
// promesse** : le jour venu, SEUL le modèle a changé de ce côté-ci — cette
// fonction a gagné trois lignes, et aucun sprite n'a été retouché.
//
// ⚠ CE COMMENTAIRE PORTAIT L'INTERDICTION INVERSE, ET ELLE EST LEVÉE. Il disait :
// « ajouter `poi_reacteur` à `EMBLEMES_CARTE` écrirait dans la table du MODÈLE
// une entrée que le modèle ne produit pas ». C'était vrai tant que rien ne les
// produisait ; ça ne l'est plus. Un garde-fou qu'on enjambe sans le réécrire est
// un garde-fou qui mentira au lecteur suivant.
//
// ⚠⚠ DEUX SPRITES RESTENT PRÉ-BRANCHÉS, ET IL FAUT SAVOIR CE QUE ÇA COÛTE. Les
// deux grosses bases entrent dans le fichier livré et une seule est dessinée —
// la 3 × 3 de la terminale. La 2 × 2 attend un emploi qu'Ethan n'a pas encore
// donné : 37 038 octets pour les deux, payés par tous les joueurs.
//
// ⚠ ET LE NOM DE SPRITE D'UN POI SE LIT DANS `POI`, IL NE SE RÉÉCRIT PAS ICI. La
// table de `data/sites.js` fait foi sur les identifiants, les noms affichés, les
// sprites et les effets ; une seconde correspondance ici divergerait au premier
// renommage d'image.

import { ATLAS, COTE_SPRITE } from '../data/atlas.js';
import { GEOGRAPHIE, POI } from '../data/sites.js';
import { existeDansAtlas, celluleDuSprite } from './sprite.js';

/** La famille d'atlas où vivent les emblèmes. */
export const FAMILLE = 'carte';

/**
 * Les sept points d'intérêt, LUS dans l'atlas et non recopiés.
 *
 * ⚠ UNE LISTE ÉCRITE À LA MAIN VIEILLIRAIT au premier POI ajouté ou renommé, et
 * rien ne le dirait — c'est la faute que `SE_LIE_AU_MUR` de `sim/rendu-pose.js`
 * évite déjà en lisant `DEFENSES` plutôt qu'en énumérant.
 */
export const SPRITES_POI = ATLAS[FAMILLE].noms.filter((nom) => nom.startsWith('poi_'));

/**
 * Les deux grosses bases, par leur côté en cases.
 *
 * ⚠ ELLES NE SONT PAS DANS L'ATLAS, et c'est mesuré : à la grille 64 elles font
 * 128 × 128 et 192 × 192, quand `coudre` exige 64 × 64. Chacune voyage dans son
 * propre marqueur, comme l'atlas de terrain de la carte du monde. `tools/atlas.py`
 * les exclut nommément, et asserte qu'elles ne sont PAS carrées à la taille de
 * case — sans quoi l'exclusion deviendrait un moyen de cacher un sprite cassé.
 */
export const SPRITES_GROSSE_BASE = {
  2: 'base_o_2x2',
  3: 'base_o_3x3',
};

/**
 * Le sprite d'un site de la carte.
 *
 * ⚠ `camp` ET `avantPoste` SE DISTINGUENT PAR LEUR SAVEUR, PAS PAR LEUR TYPE.
 * L'art n'a pas de dessin propre à l'avant-poste : il a `site_quartz_n*` et
 * `site_scorie_n*`, qui disent ce qu'on y prend. C'est la saveur de la CASE
 * (`sim/site-de-la-case.js`), donc deux camps successifs au même endroit portent
 * le même emblème.
 *
 * ⚠⚠ `baseTerminale` N'A PLUS DE NOM D'EMBLÈME, ET ELLE LÈVE. Arbitré par Ethan
 * le 30/08 : « la base terminale c'est la base en hexagone, sur 9 tuiles monde. »
 * Elle prenait `site_base_o_n9` et se confondait exactement avec une base de
 * l'Ouvrage au dernier palier ; elle se dessine maintenant par
 * `dessinerGrosseBase(3, …)`, comme une emprise de neuf cases.
 *
 * ⚠ ELLE LÈVE PLUTÔT QUE DE RENDRE L'ANCIEN NOM. Un appelant oublié doit se
 * VOIR : rendre `site_base_o_n9` par compatibilité laisserait la terminale
 * dessinée deux fois, en petit sous son hexagone, et rien ne le dirait.
 *
 * @param {string} type clé d'`EMBLEMES_CARTE`
 * @param {number} palier 1…9, de `palierDeNiveau`
 * @param {string} avarie une valeur d'`AVARIE` de `sim/site-entame.js`
 * @param {string|null} saveur `richeQuartz`, `richeScorie` ou `null`
 * @returns {string} un nom de la famille `carte`
 */
/**
 * Le suffixe de fichier d'un état d'avarie — le sain n'en a pas.
 *
 * ⚠⚠ LE PALIER NE CHANGE PAS AVEC L'ÉTAT, ET C'EST LA RÈGLE. `palierDeNiveau`
 * rend le palier, l'avarie choisit la FAMILLE de dessin : une base de niveau 30
 * en feu reste au palier 6. Mélanger les deux ferait RÉTRÉCIR la base quand elle
 * brûle, c'est-à-dire dire au joueur qu'elle a baissé de niveau.
 *
 * ⚠ LE SAIN GARDE SON NOM NU. Renommer les 36 sprites sains aurait fait tomber
 * `src/data/atlas.js`, ce module et leurs gardes pour un lot qui n'ajoute qu'un
 * état.
 */
const SUFFIXE_AVARIE = { aucune: '', fumee: '_fumee', feu: '_feu' };

export function spriteDuSite(type, palier, saveur, avarie = 'aucune') {
  if (!Number.isInteger(palier) || palier < 1 || palier > 9) {
    throw new RangeError(`emblème : palier ${palier} hors de 1…9`);
  }
  const abime = SUFFIXE_AVARIE[avarie];
  if (abime === undefined) {
    throw new RangeError(`emblème : avarie inconnue « ${avarie} »`);
  }
  // ⚠⚠ UN POI IGNORE SON PALIER, ET C'EST UNE PROPRIÉTÉ DE L'ART, PAS UN OUBLI.
  // Il n'y a qu'un dessin par type — pas de variante `n1`…`n9` —, et le niveau
  // d'un POI ne dit de toute façon rien de ce qu'il donne : il dit seulement où
  // il se trouve. Le contrôle de borne du palier reste AU-DESSUS, parce qu'il
  // protège tous les autres types.
  // ⚠ UN POI NE BRÛLE PAS, ET IL N'A QU'UN DESSIN. Il ne s'attaque pas — il
  // n'est dans aucun `TYPES_SITE` —, donc aucune avarie ne peut le concerner ;
  // lui coudre 14 sprites de plus aurait payé des octets pour un état
  // inatteignable. Le contrôle de borne de l'avarie reste AU-DESSUS, lui,
  // parce qu'il protège tous les autres types.
  if (POI[type] !== undefined) return POI[type].sprite;
  if (type === 'base') return `site_base_o_n${palier}${abime}`;
  if (type === 'baseJoueur') return `site_base_j_n${palier}${abime}`;
  if (type === 'baseTerminale') {
    throw new RangeError(
      'emblème : la base terminale se dessine en hexagone 3 × 3 par '
      + '`dessinerGrosseBase`, elle n\'a pas de sprite d\'une case',
    );
  }
  if (type === 'camp' || type === 'avantPoste') {
    if (saveur === 'richeQuartz') return `site_quartz_n${palier}${abime}`;
    if (saveur === 'richeScorie') return `site_scorie_n${palier}${abime}`;
    throw new RangeError(`emblème : « ${type} » sans saveur — reçu « ${saveur} »`);
  }
  throw new RangeError(`emblème : type de site inconnu « ${type} »`);
}

/**
 * Combien de cases de côté un type de site occupe — `null` s'il en tient une.
 *
 * ⚠⚠ LA TABLE VIT ICI, PAS DANS L'ÉCRAN. `ui/monde.js` demande plutôt que de
 * reconnaître `baseTerminale` par son nom : un `=== 'baseTerminale'` écrit à la
 * main dans la boucle de dessin serait le premier cas particulier à diverger, et
 * le dépôt refuse déjà cette forme ailleurs — un test de `chantier.test.js`
 * interdit un `=== 'deplacer'` dans son écran pour la même raison.
 *
 * ⚠ LA 2 × 2 N'EST DÉLIBÉRÉMENT ASSOCIÉE À AUCUN TYPE. Ethan, 30/08 : « la base
 * 2 × 2 sera pour autre chose. » Elle reste pré-branchée — nommée, vérifiée
 * contre l'art — et sans emploi. Lui en inventer un serait trancher à sa place.
 *
 * @param {string} type clé d'`EMBLEMES_CARTE`
 * @returns {number|null}
 */
export function cotesDuSite(type) {
  return type === 'baseTerminale' ? 3 : null;
}

/**
 * Où se pose une grosse base, en CASES, autour de la case du site.
 *
 * ⚠⚠ UNE 3 × 3 SE CENTRE, UNE 2 × 2 NE PEUT PAS. `data/sites.js` a déjà buté sur
 * cette parité — « une largeur paire n'a pas de centre », et la carte est passée
 * de 30 à 31 colonnes pour cette raison. **Retenu : la case du site est le coin
 * HAUT-GAUCHE du carré pair.** C'est un choix réversible d'une ligne, et il est
 * dit au rapport comme tel : le coin bas-droit, ou un décalage d'un demi-pixel,
 * seraient aussi défendables.
 *
 * @param {number} cotes 2 ou 3
 * @param {{rangee: number, colonne: number}} site
 * @returns {{rangee: number, colonne: number, cotes: number}} le coin haut-gauche
 */
export function empriseDeLaGrosseBase(cotes, site) {
  if (SPRITES_GROSSE_BASE[cotes] === undefined) {
    throw new RangeError(`emblème : pas de grosse base de ${cotes} cases de côté`);
  }
  // Impair : le carré se centre, donc il déborde de (cotes − 1) / 2 de chaque
  // côté. Pair : la case EST le coin, donc aucun débordement vers le haut.
  const recul = (cotes - 1) % 2 === 0 ? (cotes - 1) / 2 : 0;
  const rangee = site.rangee - recul;
  const colonne = site.colonne - recul;
  // ⚠⚠ UN CARRÉ QUI DÉBORDE LA CARTE LÈVE, IL NE SE ROGNE PAS. La base terminale
  // tient largement — rangées 25 à 27, colonnes 15 à 17 sur une carte de
  // 300 × 31, mesuré —, mais c'est une propriété de sa POSITION, pas de la
  // fonction. Le jour où une grosse base se poserait au bord, un carré rogné en
  // silence dessinerait une base tronquée que personne ne saurait expliquer.
  if (rangee < 1 || rangee + cotes - 1 > GEOGRAPHIE.carte.hauteur
    || colonne < 1 || colonne + cotes - 1 > GEOGRAPHIE.carte.largeur) {
    throw new RangeError(
      `emblème : une base de ${cotes} cases en (${site.rangee}, ${site.colonne}) `
      + `déborde la carte de ${GEOGRAPHIE.carte.hauteur} × ${GEOGRAPHIE.carte.largeur}`,
    );
  }
  return { rangee, colonne, cotes };
}

/**
 * La primitive de dessin d'une grosse base — position et taille, en pixels.
 *
 * ⚠ L'ÉCHELLE SE LIT DANS `ZOOM_CARTE`, elle ne se réécrit pas. Une grosse base
 * couvre `cotes` cases, donc `cran × cotes` pixels de côté ; un emblème
 * ordinaire vaut `cran / COTE_SPRITE` fois sa taille source. Écrire ces
 * nombres ici en ferait une seconde vérité, et le dessin cesserait de suivre le
 * jour où un cran bougerait.
 *
 * @param {number} cotes 2 ou 3
 * @param {{rangee: number, colonne: number}} site
 * @param {number} cran pixels physiques par case
 * @param {{x: number, y: number}} origine coin haut-gauche de la vue, en pixels
 * @returns {{nom: string, x: number, y: number, cote: number}}
 */
export function dessinerGrosseBase(cotes, site, cran, origine) {
  // ⚠⚠ LA GARDE A CHANGÉ DE CIBLE AU LOT ZOOM-CONTINU, ELLE N'A PAS ÉTÉ
  // RETIRÉE. Elle exigeait un cran DE LA TABLE `ZOOM_CARTE.crans`, ce qui était
  // juste tant que la carte zoomait par crans ; depuis le 04/09 l'échelle est
  // un RÉEL, et cette garde-là faisait LEVER `dessinerGrosseBase` à toute
  // échelle intermédiaire. Ce n'était pas un décalage d'un pixel : une levée
  // dans la boucle de dessin vide tout l'écran Monde, et la base terminale est
  // à l'écran dès qu'on regarde le haut de la carte. Mesuré avant correction —
  // « cran 97.3 hors de 32, 64, 128, 256 » — et c'est très exactement ce que le
  // §2.5 du brief demandait de vérifier plutôt que de croire.
  //
  // ⚠ CE QU'ELLE GARDE RESTE LE MÊME : « le dessin ne s'invente pas une
  // échelle ». La faute qui peut arriver aujourd'hui n'est plus un cran hors
  // table — il n'y a plus de table — mais une échelle qui n'est pas un nombre :
  // un `NaN` venu d'une division par zéro rendrait `drawImage` muet, sans lever
  // et sans dessiner, ce qui est la faute que ce module tout entier raconte.
  if (!Number.isFinite(cran) || cran <= 0) {
    throw new RangeError(`emblème : échelle ${cran} invalide`);
  }
  const emprise = empriseDeLaGrosseBase(cotes, site);
  return {
    nom: SPRITES_GROSSE_BASE[cotes],
    // ⚠ ENTIERS. Un `drawImage` à une position fractionnaire rééchantillonne et
    // rend le pixel art flou — c'est déjà la règle du fond de carte.
    x: Math.round((emprise.colonne - 1) * cran - origine.x),
    y: Math.round((emprise.rangee - 1) * cran - origine.y),
    cote: cran * emprise.cotes,
  };
}

/**
 * La primitive de dessin d'un emblème d'UNE case — source ET destination.
 *
 * ⚠⚠ ELLE EXISTE PARCE QUE L'ÉCRAN CALCULAIT CETTE GÉOMÉTRIE LUI-MÊME, ET SE
 * TROMPAIT EN SILENCE. `ui/monde.js` lisait `cellule.x`, `cellule.y` et
 * `cellule.cote` sur ce que rend `celluleDuSprite` — qui rend `colonne`,
 * `rangee`, `colonnes` et `rangees`, c'est-à-dire des INDICES de cellule et
 * jamais des pixels. Les trois valeurs valaient donc `undefined`, et
 * `drawImage` avec un rectangle source non fini **ne dessine rien et ne lève
 * pas** : la carte s'ouvrait avec son fond, ses bases de l'Ouvrage, ses camps
 * et la base du joueur tous absents. Mesuré dans Chromium avant correction —
 * 88 appels à `drawImage`, 88 rectangles sources non finis.
 *
 * ⚠ D'OÙ LE DÉPLACEMENT ICI, ET PAS UNE LIGNE CORRIGÉE LÀ-BAS. L'en-tête de ce
 * module promet depuis le lot CARTE-EMBLÈMES qu'il rend « des NOMS de sprite et
 * une géométrie » ; `dessinerGrosseBase` le fait déjà. L'emblème d'une case
 * était le seul à faire son calcul dans l'écran, donc le seul qu'aucun test ne
 * pouvait atteindre — le dépôt n'a pas de navigateur. Ramené ici, il se mesure.
 *
 * ⚠⚠ LE CÔTÉ DE LA CELLULE SE LIT DANS `COTE_SPRITE`, ET IL A ÉTÉ LU AILLEURS
 * PENDANT DEUX LOTS. Il venait de `ZOOM_CARTE.grilleEmbleme`, une entrée de
 * `data/sites.js` qui valait 64 — c'est-à-dire la grille de couture de
 * l'époque, recopiée dans une table de calibrage. Le lot GRILLE-128 a fait
 * passer l'atlas embarqué à 128 en changeant DEUX constantes d'outil, et son
 * rapport annonçait « tout le reste suit — `render/sprite.js` calcule en
 * POURCENTAGES, donc il est sans échelle ». C'était vrai de `sprite.js` et
 * FAUX d'ici : ce module-ci calcule en PIXELS, et sa constante est restée à 64.
 *
 * ⚠⚠ CE QUE ÇA DONNAIT À L'ÉCRAN, MESURÉ SUR L'ATLAS RÉEL. Avec `sCote` à 64
 * sur un atlas cousu en 128, la cellule `(2, 2)` de `site_base_o_n1` se lisait
 * en `(128, 128, 64, 64)` — c'est-à-dire le QUART HAUT-GAUCHE de la cellule
 * `(1, 1)`, qui porte `site_base_j_n2`. Toutes les bases de l'Ouvrage de la
 * carte du monde étaient donc dessinées avec un morceau de l'emblème du
 * JOUEUR, étiré sur la case entière. Reproduit à l'octet contre une capture
 * d'Ethan du 03/09 avant d'écrire une ligne.
 *
 * ⚠ IL N'Y A PLUS DE SECONDE VÉRITÉ : `ZOOM_CARTE.grilleEmbleme` est RETIRÉE.
 * Le côté d'une cellule d'atlas est une grandeur, et `COTE_SPRITE` la porte
 * déjà — la recopier dans une table de calibrage, c'est exactement ce que §4
 * de `CLAUDE.md` refuse, et c'est ce qui a permis aux deux de diverger sans que
 * rien ne le dise. `render/limite.js` lisait `COTE_SPRITE` depuis le premier
 * jour, et ses frontières se dessinaient juste pendant que les emblèmes non.
 *
 * @param {{type: string, saveur: string|null, avarie: string|undefined}} site
 * @param {number} palier 1…9, de `palierDeNiveau`
 * @param {number} x abscisse de destination, en pixels
 * @param {number} y ordonnée de destination, en pixels
 * @param {number} taille côté de destination, en pixels
 * @returns {{nom: string, sx: number, sy: number, sCote: number,
 *   x: number, y: number, cote: number}}
 */
export function dessinerEmblemeDUneCase(site, palier, x, y, taille) {
  // ⚠ L'AVARIE VIENT DU SITE, ET SON DÉFAUT EST « AUCUNE ». Les montages qui
  // composent un site à la main — il y en a plusieurs au dépôt — n'en portent
  // pas, et un site sans blessure connue est un site sain.
  const nom = spriteDuSite(site.type, palier, site.saveur, site.avarie ?? 'aucune');
  const cellule = celluleDuSprite(FAMILLE, nom);
  const sCote = COTE_SPRITE;
  return {
    nom,
    sx: cellule.colonne * sCote,
    sy: cellule.rangee * sCote,
    sCote,
    // ⚠ ENTIERS, comme la grosse base : un `drawImage` à une position
    // fractionnaire rééchantillonne et rend le pixel art flou.
    x: Math.round(x),
    y: Math.round(y),
    cote: taille,
  };
}

/**
 * Tous les noms que ce module peut demander, atlas et hors-atlas confondus.
 *
 * ⚠ ELLE EXISTE POUR LE TEST, ET C'EST ASSUMÉ. Sans elle, le test des neuf
 * pré-branchés devrait réénumérer ce que le module sait produire, c'est-à-dire
 * recopier la moitié du fichier qu'il vérifie.
 */
export function nomsPreBranches() {
  return [...SPRITES_POI, ...Object.values(SPRITES_GROSSE_BASE)];
}

/**
 * Un nom est-il disponible — dans l'atlas, ou hors atlas par son marqueur ?
 *
 * Les deux grosses bases ne sont dans aucun atlas : leur disponibilité se
 * mesure sur le disque, pas sur l'index, et c'est le test qui va le chercher.
 * Ici on répond pour ce que le livrable porte : l'atlas.
 */
export function estDansLAtlas(nom) {
  return existeDansAtlas(FAMILLE, nom);
}
