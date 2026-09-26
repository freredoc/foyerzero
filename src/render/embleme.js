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
import { GEOGRAPHIE, POI, TYPES_DE_BASE } from '../data/sites.js';
import { empriseDeLaGrosseBase } from '../sim/carte.js';
import { existeDansAtlas, celluleDuSprite } from './sprite.js';

/** La famille d'atlas où vivent les emblèmes. */
export const FAMILLE = 'carte';

/**
 * Les sept points d'intérêt, LUS dans l'atlas et non recopiés.
 *
 * ⚠ UNE LISTE ÉCRITE À LA MAIN VIEILLIRAIT au premier POI ajouté ou renommé, et
 * rien ne le dirait — c'est la faute que `rosterDefensif` de `sim/state.js`
 * évite déjà en lisant `DEFENSES` et `UNITES` plutôt qu'en énumérant. (Ce
 * paragraphe citait `SE_LIE_AU_MUR`, qui appliquait la même règle et qui est
 * parti avec le chaînage au lot SPRITES-V2-JOUEUR ; un exemple qui n'existe plus
 * envoie chercher un mécanisme qu'on ne trouvera pas.)
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
 * Le sprite d'une grosse base dans un état d'avarie — lot AVARIES, 20/09/2026.
 *
 * ⚠⚠ UN VERROU ENTAMÉ SE DESSINAIT COMME UN VERROU INTACT, ET C'ÉTAIT LE SEUL
 * ENDROIT DU JEU OÙ ÇA MANQUAIT. Les sites d'une case portent leurs quatre
 * états depuis les lots EMBLÈMES-ABÎMÉS et CONQUÊTE-24H ; les deux grosses
 * bases n'en avaient qu'un. Sur les sept bases que le joueur doit casser pour
 * finir la partie, il n'avait aucun moyen de voir ce qu'il avait déjà entamé.
 *
 * ⚠ LE SUFFIXE EST CELUI DES SITES D'UNE CASE, `SUFFIXE_AVARIE`, et ce n'est
 * pas une coïncidence qu'on entretient : c'est la MÊME table. Deux jeux de
 * suffixes pour la même notion divergeraient au premier état ajouté.
 *
 * @param {number} cotes une clé de `SPRITES_GROSSE_BASE`
 * @param {string} avarie une valeur d'`AVARIE` de `sim/site-entame.js`
 * @returns {string} un nom de la famille `carte`
 */
export function spriteDeLaGrosseBase(cotes, avarie = 'aucune') {
  const base = SPRITES_GROSSE_BASE[cotes];
  if (base === undefined) {
    throw new RangeError(`emblème : pas de grosse base de ${cotes} cases de côté`);
  }
  const abime = SUFFIXE_AVARIE[avarie];
  if (abime === undefined) {
    throw new RangeError(`emblème : avarie inconnue « ${avarie} »`);
  }
  return `${base}${abime}`;
}

/**
 * Le sprite de la RUINE d'une grosse base.
 *
 * ⚠ ELLE NE PASSE PAS PAR `spriteDeLaGrosseBase`, POUR LA RAISON QUE
 * `spriteDeLaRuine` DONNE DÉJÀ : une ruine n'est PAS un état d'avarie. `AVARIE`
 * décrit ce qui reste DEBOUT d'un site vivant ; une ruine n'a plus d'entrée de
 * site du tout. Les réunir sous un même paramètre inviterait à demander
 * l'avarie d'une ruine.
 *
 * @param {number} cotes une clé de `SPRITES_GROSSE_BASE`
 * @returns {string} un nom de la famille `carte`
 */
export function spriteDeLaGrosseRuine(cotes) {
  const base = SPRITES_GROSSE_BASE[cotes];
  if (base === undefined) {
    throw new RangeError(`emblème : pas de grosse base de ${cotes} cases de côté`);
  }
  return `${base}${SUFFIXE_RUINE}`;
}

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

/**
 * Le suffixe d'une ruine — le quatrième dessin d'une famille de base.
 *
 * ⚠ IL EST HORS DE `SUFFIXE_AVARIE`, ET CE N'EST PAS UN RANGEMENT : une ruine
 * n'est pas un état d'avarie, c'est ce qui reste quand le site n'existe plus.
 * Voir `spriteDeLaRuine`.
 */
const SUFFIXE_RUINE = '_ruine';

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
  // ⚠⚠ LES DEUX TYPES QUI COUVRENT PLUSIEURS CASES LÈVENT, ET LA CONDITION SE
  // DÉRIVE — lot VERROUS, 20/09/2026. Seule la finale levait ; un verrou couvre
  // 2 × 2 cases depuis ce lot, et le laisser retomber sur `site_base_o_n9`
  // l'aurait dessiné DEUX FOIS, en petit sous son propre carré, sans que rien ne
  // le dise. La question « ce type couvre-t-il plusieurs cases » a déjà sa
  // réponse dans `cotesDuSite` : la reposer par un `===` écrit ici serait la
  // seconde vérité que §4 interdit, et c'est elle qui aurait été oubliée.
  if (cotesDuSite(type) !== null) {
    throw new RangeError(
      `emblème : « ${type} » se dessine sur ${cotesDuSite(type)} × ${cotesDuSite(type)} `
      + 'cases par `dessinerGrosseBase`, il n\'a pas de sprite d\'une case',
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
 * Le sprite de la RUINE que laisse un site tombé — lot CONQUÊTE-24H.
 *
 * ⚠⚠ ELLE DESSINE CE QUI EST TOMBÉ, PAS QUI A GAGNÉ, ET LES DEUX PLANCHES
 * D'ETHAN LE DISENT : « base joueur complètement détruite » et « base Ouvrage
 * complètement détruite ». Une base de l'Ouvrage rasée par le joueur montre donc
 * une carcasse d'OUVRAGE, tout en émettant du territoire JOUEUR pendant vingt-
 * quatre heures. Les deux faits sont opposés, et c'est normal : le décombre
 * appartient au vaincu, le terrain au vainqueur.
 *
 * ⚠⚠ ELLE NE PASSE PAS PAR `spriteDuSite`, ET C'EST DÉLIBÉRÉ. Le quatrième
 * suffixe aurait pu rejoindre `SUFFIXE_AVARIE`, mais une ruine n'est PAS un état
 * d'avarie : `AVARIE` de `sim/site-entame.js` décrit ce qui reste DEBOUT d'un
 * site vivant, et une ruine n'a plus d'entrée de site du tout. Deux notions sous
 * un même paramètre auraient invité à demander l'avarie d'une ruine.
 *
 * ⚠ SEULES LES BASES EN LAISSENT UNE. Un camp ou un avant-poste RESPAWNE —
 * `TYPES_SITE` le dit, `detruireSatellite` le programme — et l'art n'a donc pas
 * de ruine de camp. Un appel avec un autre type LÈVE plutôt que de rendre un nom
 * absent de l'atlas : le sprite manquant se verrait au dessin, pas à l'appel.
 *
 * ⚠⚠ « LES BASES », CE SONT LES TROIS TYPES DE `TYPES_DE_BASE` — lot
 * ÉTAI-RÉTABLI, 25/09. Un verrou et la base finale sont des bases de l'Ouvrage,
 * et depuis ce lot un verrou rasé par sa Souche entre bien dans `basesRasees` :
 * il en sort une ruine `baseVerrou` ou `baseTerminale`, que `dessinerRuines` de
 * `ui/monde.js` demande ICI, sans `try`. Lever sur ces deux types ferait tomber
 * la carte à chaque image où la case rasée est à l'écran. Ils rendent la ruine
 * de base de l'Ouvrage, posée sur la case d'ANCRAGE — une ruine à la taille de
 * l'emprise 2 × 2 ou 3 × 3 demanderait de l'art : **question pour Ethan, non
 * tranchée ici**. La liste se LIT dans `data/sites.js`, elle ne se recopie pas.
 *
 * @param {string} type le type du site tombé, tel que `siteDeLaCase` le rend
 * @param {number} palier 1…9, de `palierDeNiveau`
 * @returns {string} un nom de la famille `carte`
 */
export function spriteDeLaRuine(type, palier) {
  if (!Number.isInteger(palier) || palier < 1 || palier > 9) {
    throw new RangeError(`emblème : palier ${palier} hors de 1…9`);
  }
  if (TYPES_DE_BASE.includes(type)) return `site_base_o_n${palier}${SUFFIXE_RUINE}`;
  if (type === 'baseJoueur') return `site_base_j_n${palier}${SUFFIXE_RUINE}`;
  throw new RangeError(
    `emblème : « ${type} » ne laisse pas de ruine — seules les bases en laissent`,
  );
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
 * ⚠⚠ ET LA 2 × 2 A TROUVÉ SON EMPLOI AU LOT VERROUS, 20/09/2026. Ce commentaire
 * disait, depuis le 30/08 : « elle reste pré-branchée — nommée, vérifiée contre
 * l'art — et sans emploi. Lui en inventer un serait trancher à sa place. »
 * Ethan a tranché le 10/09 : les six verrous de la base finale, en 2 × 2. Le
 * nombre de côtés se lit dans `GEOGRAPHIE.verrous.cotes`, il ne se réécrit pas
 * ici — c'est la même table qui place les six sommets.
 *
 * @param {string} type clé d'`EMBLEMES_CARTE`
 * @returns {number|null}
 */
export function cotesDuSite(type) {
  if (type === 'baseTerminale') return 3;
  if (type === 'baseVerrou') return GEOGRAPHIE.verrous.cotes;
  return null;
}

// ⚠⚠ `empriseDeLaGrosseBase` A DÉMÉNAGÉ DANS `sim/carte.js` AU LOT VERROUS,
// 20/09/2026, ET ELLE EST RÉEXPORTÉE ICI POUR QUE RIEN NE CASSE. `sim/poi.js`
// annonçait ce déménagement depuis le 31/08 : « le jour où [render/embleme.js]
// lirait [de sim/], c'est CETTE ligne qu'il faudra défaire, en montant la
// géométrie dans `sim/` plutôt qu'en recopiant le décalage. » Trois modules de
// `sim/` en ont besoin désormais — le peuplement, les POI et `siteDeLaCase` —
// et quelles CASES une base couvre est une question de carte, pas de dessin.
//
// ⚠ LA RÉEXPORTATION N'EST PAS UNE COMMODITÉ, C'EST CE QUI GARDE UNE SEULE
// VÉRITÉ. Les tests et `sim/poi.js` l'importent d'ici depuis le 31/08 ;
// la réexporter évite d'avoir à choisir, module par module, laquelle des deux
// adresses est la bonne — il n'y en a qu'une, l'autre y mène.
export { empriseDeLaGrosseBase } from '../sim/carte.js';

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
export function dessinerGrosseBase(cotes, site, cran, origine, avarie = 'aucune') {
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
    // ⚠ LE NOM PORTE L'ÉTAT DEPUIS LE LOT AVARIES. Le défaut est « aucune »,
    // donc tout appelant d'avant le lot rend exactement le nom d'avant.
    nom: avarie === 'ruine'
      ? spriteDeLaGrosseRuine(cotes)
      : spriteDeLaGrosseBase(cotes, avarie),
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
 * Où prendre et où poser la carcasse d'une ruine — lot CONQUÊTE-24H.
 *
 * ⚠⚠ LA GÉOMÉTRIE RESTE ICI, COMME CELLE DE L'EMBLÈME, ET POUR LA MÊME RAISON
 * QUI L'Y A FAIT DESCENDRE. `ui/monde.js` calculait autrefois `cellule.x`,
 * `cellule.y` et `cellule.cote` à la main sur ce que rend `celluleDuSprite` — qui
 * rend des INDICES, jamais des pixels — et les trois valaient `undefined` :
 * `drawImage` avec un rectangle source non fini NE DESSINE RIEN ET NE LÈVE PAS,
 * si bien que la carte s'ouvrait vide de tout emblème. Refaire ce calcul dans
 * l'écran pour les ruines rouvrirait très exactement cette porte-là.
 *
 * ⚠ ELLE PREND LE TYPE, PAS UN SITE. Une ruine n'est pas un site : elle n'a
 * ni saveur, ni avarie, ni instance, et `sitesDeLaFenetre` ne la porte pas —
 * elle n'est ni touchable ni légendable, §4 du brief. Lui donner la forme d'un
 * site l'aurait invitée à en devenir un.
 *
 * @param {string} type le type du site tombé
 * @param {number} palier 1…9, de `palierDeNiveau`
 * @param {number} x
 * @param {number} y
 * @param {number} taille côté de la case, en pixels
 */
export function dessinerRuineDUneCase(type, palier, x, y, taille) {
  const nom = spriteDeLaRuine(type, palier);
  const cellule = celluleDuSprite(FAMILLE, nom);
  const sCote = COTE_SPRITE;
  return {
    nom,
    sx: cellule.colonne * sCote,
    sy: cellule.rangee * sCote,
    sCote,
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
