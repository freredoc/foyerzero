// L'écran Monde — la carte, ses sites, et le doigt qui la promène.
//
// ⚠ IL NE CALCULE AUCUNE DONNÉE DE JEU. Tout ce qu'il affiche existe déjà :
// les bases de l'Ouvrage sont une FONCTION de la graine (`sim/peuplement.js`),
// les camps et l'avant-poste sont dans l'état (`satellites.presents`), le niveau
// d'une rangée vient de `sim/carte.js`, les bornes de `GEOGRAPHIE` et les crans
// de `ZOOM_CARTE`. Cet écran demande, arrange, et dessine.
//
// ⚠ `basesDeLaFenetre` REND UNE FENÊTRE, PAS LA CARTE. Elle est faite pour être
// appelée à chaque changement de vue et rogne d'elle-même sur les bords. Ne
// jamais l'appeler sur les 9 300 cases : au cran le plus large la fenêtre en
// fait moins de 1 500, et c'est le chiffre pour lequel elle est écrite.
//
// ⚠⚠ LE NIVEAU DU JOUEUR N'EST PAS CELUI DE SA RANGÉE. `niveauDeLaRangee` donne
// le niveau des sites de l'OUVRAGE à cet endroit de la carte. La base du joueur
// porte TROIS niveaux qui lui sont propres — bâtiments, défense, armée —, chacun
// une moyenne, et aucun ne se déduit d'une position. Écrire « vous êtes niveau
// 5 » parce que le joueur est rangée 275 est exactement la faute que
// `sim/carte.js` existe pour empêcher, et le panneau le dit en toutes lettres.
//
// ⚠ RIEN NE DOIT PROMETTRE CE QUI N'EXISTE PAS. Toucher un site ouvre un
// panneau qui dit ce qu'on SAIT — type, niveau, distance, position — et rien
// d'autre.
//
// ⚠⚠ CE PARAGRAPHE A MENTI DEUX JOURS, ET IL EST RÉÉCRIT PLUTÔT QU'ENJAMBÉ. Il
// finissait par « Aucun bouton "Attaquer" : le raid n'existe pas », ce qui était
// vrai le 27/08 — contre le bouton « Assaut » de l'écran Chantier, qui pointait
// sur du sol nu — et FAUX depuis le lot CARTE-C du 06/09, qui a posé
// `#monde-panneau-attaquer` sur ordre d'Ethan. Le balisage, lui, portait déjà le
// renversement en toutes lettres ; l'en-tête d'ici ne l'avait pas suivi. C'est le
// commentaire menteur en puissance que `CLAUDE.md` §6 raconte trois fois, trouvé
// au lot PANNEAUX-DE-LA-CARTE en lui ajoutant un troisième panneau.
//
// ⚠ CE QUI RESTE DE LA RÈGLE, ET QUI N'A PAS BOUGÉ : le panneau ne promet
// toujours rien qui n'existe pas. « Attaquer » entre dans une cible, ce que le
// raid fait depuis RAID-A ; « Déplacer la base » n'apparaît que sur SA PROPRE
// base ; le panneau d'une RUINE ne porte aucun des deux — il est en lecture
// seule, et `ouvrirRuine` dit pourquoi. La liste des boutons reste CLOSE, et un
// test balaie le balisage pour qu'aucun autre n'y entre.

import {
  GEOGRAPHIE, ZOOM_CARTE, TERRAIN_CARTE, EMBLEMES_CARTE, ETIQUETTE_CARTE, POI,
  palierDeNiveau, DEPLACEMENT, TYPES_SITE, ORIGINE_DU_NIVEAU,
} from '../data/sites.js';
import { niveauDeLaRangee, positionBaseTerminale } from '../sim/carte.js';
import { basesDeLaFenetre } from '../sim/peuplement.js';
// ⚠⚠ `carteDesPoi` ENTRE AU LOT ÉCRANS — point 11 d'Ethan, 10/09. Elle rend la
// LISTE des soixante-dix, là où `poisDeLaFenetre` n'en rend que ce qui tombe
// sous les yeux : le panneau les montre TOUS, acquis comme restants, et il ne
// peut donc pas passer par la fenêtre. Elle est mémoïsée sur une entrée, comme
// son en-tête le dit, donc la demander à chaque ouverture ne retire rien.
import { poisDeLaFenetre, poiEstAcquis, carteDesPoi } from '../sim/poi.js';
import {
  saveurDeLaCase, siteDeLaCase, butinSiToutTombe, forceDeLaDefense,
} from '../sim/site-de-la-case.js';
import { avariesParCase, avarieDeLaBase, montageCourant } from '../sim/site-entame.js';
import { distanceCarreeCases, casesArrondiesAuSuperieur } from '../sim/points-attaque.js';
import { coutDUnRaid } from '../sim/prix-du-raid.js';
import { problemesDuRaid } from '../sim/raid.js';
import { nombreDAttaquantes } from '../sim/raid-ouvrage.js';
import {
  problemesDuDeplacement, deplacerLaBase, casesAtteignables,
  ticksAvantProchainDeplacement, delaiDuDeplacementVers, enDuree,
} from '../sim/deplacement.js';
import {
  blocsDeLaDalle, geometrieDuCran, profilDuBloc, COTE_SOURCE, NOMS_DU_SOL,
  arretsDeTeinte, DELTA_TEINTE,
} from '../render/terrain.js';
import {
  cotesDuSite, dessinerGrosseBase, dessinerEmblemeDUneCase,
} from '../render/embleme.js';
import { niveauDesBatiments } from '../sim/niveau-de-base.js';
// ⚠ LE FORMATAGE D'UN NIVEAU EN DIXIÈMES VIT DANS `ui/chantier.js`, ET IL N'Y
// EN A QU'UN. `src/ui/recherche.js` importe déjà de là pour la même raison : ce
// sont des fonctions PURES d'un module d'écran, pas son DOM.
//
// ⚠⚠ ET `DUREE_TOAST_MS` A QUITTÉ CETTE LIGNE — point 11 d'Ethan, 10/09,
// « plutôt qu'un toast mieux vaut avoir un pop-up ». Ce module portait un message
// qui s'effaçait tout seul au bout du délai de l'écran de la base ; il n'en porte
// plus aucun, et la liste des gisements se ferme au BOUTON. Un import que plus
// rien ne lit est une dépendance qu'on croit vivante : `esbuild` ne dit rien, et
// la prochaine lecture chercherait une minuterie qui n'existe pas.
import { formaterDixiemes } from './chantier.js';
import {
  territoireDeLaFenetre, bordsDuTerritoire, RAYONS, JOUEUR, OUVRAGE,
} from '../sim/territoire.js';
import {
  ruinesActives, casesRasees, cleDeLaCase, TICKS_DE_RUINE,
} from '../sim/ruines.js';
// ⚠⚠ ÉCART AU BRIEF, DÉCLARÉ : LA DURÉE NE S'ÉCRIT PAS UNE TROISIÈME FOIS.
// Le §4.2 du brief donne le choix entre exporter la fonction de
// `sim/deplacement.js` — interdit, ce fichier appartient à un autre lot — et en
// écrire « la sienne dans `monde.js`, en la déclarant au rapport comme la
// troisième jumelle ». Ni l'une ni l'autre : `direLaDuree` est **déjà exportée**
// de `sim/reparation.js` depuis le lot RÉPARER-ÉCRAN, et `ui/chantier.js` la
// partage DÉJÀ, très exactement pour que la même quantité ne se lise pas de deux
// façons. L'importer n'ajoute pas une ligne à `sim/reparation.js`, donc pas un
// conflit à résoudre sur un téléphone — ce qui est le motif du §1.6. Écrire une
// troisième jumelle aurait été la faute que §4 de `CLAUDE.md` interdit, et que
// le brief lui-même se propose de défaire plus tard.
import { direLaDuree } from '../sim/reparation.js';
import { dessinerLimiteDUneCase } from '../render/limite.js';
// ⚠⚠ LA MINI-CARTE NE CALCULE RIEN ICI. Le module rend une GÉOMÉTRIE — les
// bandes du sol, le rectangle d'une case — et une LISTE de marqueurs ; cet
// écran ne fait que peindre ce qu'il rend. C'est le motif de `listeAffichage` et
// de `render/terrain.js`, et c'est ce qui rend la mini-carte éprouvable dans un
// dépôt qui n'a pas de navigateur.
import {
  LARGEUR_PX as MINI_LARGEUR, HAUTEUR_PX as MINI_HAUTEUR,
  bandesDuSol, bordY, marqueursDeLaMiniCarte,
} from '../render/mini-carte.js';
import { dessinerRuineDUneCase } from '../render/embleme.js';
import { PALETTE } from '../render/scene.js';
import { baseCourante } from '../sim/base-courante.js';
import { basculerVersLaBase } from '../sim/state.js';
import { satellitesPresents } from '../sim/satellites.js';

/** Les crans de zoom, du plus large au plus serré. Lus, jamais recopiés. */
export const CRANS = ZOOM_CARTE.crans;

/**
 * ⚠⚠ `CRAN_PAR_DEFAUT` A ÉTÉ RETIRÉE AU LOT CARTE-B (06/09), ET C'EST UNE
 * CONSTANTE EN MOINS, PAS UN OUBLI.
 *
 * Elle valait `0` et disait « le cran sur lequel la carte s'ouvre : celui qui
 * montre le plus ». Ethan, 06/09 : « ouverture de la carte : centrée sur ma
 * base du joueur AU ZOOM MAXIMUM ». La carte s'ouvre donc sur `ECHELLE_MAX`,
 * qui est l'autre bout de la même table, et cette constante-ci n'avait plus
 * qu'un lecteur : l'initialisation qu'elle vient de perdre. La garder à `0`
 * aurait laissé dans `src/` un nom qui affirme le contraire de ce que l'écran
 * fait — le commentaire menteur en puissance que `CLAUDE.md` §6 raconte déjà
 * trois fois.
 */

/**
 * Les deux bouts de la course du zoom, en pixels physiques par case.
 *
 * ⚠ ELLES SE LISENT DANS LA TABLE, ELLES NE SE RÉÉCRIVENT PAS. Écrire les deux
 * nombres ici ferait la seconde vérité que §4 de `CLAUDE.md` interdit, et la
 * première à mentir le jour où un cran s'ajouterait à un bout ou à l'autre. La
 * garde « l'écran ne nomme aucune constante de zoom en dur » de `monde.test.js`
 * tomberait d'ailleurs dessus.
 */
export const ECHELLE_MIN = CRANS[0];
export const ECHELLE_MAX = CRANS[CRANS.length - 1];

/**
 * Le cran auquel les dalles se rendent, pour une échelle d'affichage donnée :
 * le plus PETIT cran qui soit supérieur ou égal à l'échelle.
 *
 * ⚠⚠ L'ÉCHELLE D'AFFICHAGE ET L'ÉCHELLE DE RENDU SONT DEUX GRANDEURS, ET C'EST
 * TOUT CE QUI REND LE ZOOM CONTINU PAYABLE. `calculerDalle` fabrique une image à
 * un cran de la table ; `drawImage` la pose à la taille qu'on veut. Une dalle
 * rendue au cran 64 s'affiche donc à 45 px par case sans être recalculée, et le
 * cache ne se renouvelle qu'aux passages de cran — trois fois sur toute la
 * course, et non à chaque image. Le pavé du 30/08 qui déclarait le continu
 * impossible confondait les deux ; c'est ce trou-là que le lot ZOOM-CONTINU a
 * ouvert.
 *
 * ⚠⚠ LE PLUS PETIT CRAN ≥ L'ÉCHELLE, ET JAMAIS LE PLUS PROCHE. Le plus proche
 * donnerait un facteur d'affichage jusqu'à 1,41, c'est-à-dire un
 * AGRANDISSEMENT de pixel art — très exactement le « gros carré moche »
 * qu'Ethan a rapporté le 30/08 et que l'échelle du sol a corrigé. Ici le
 * facteur tombe dans (0,5 ; 1] par construction, les crans allant du simple au
 * double : on réduit toujours, on ne grossit jamais.
 *
 * ⚠ ELLE LÈVE HORS DES BORNES, elle ne rend pas une valeur de repli. Une
 * échelle hors course est un fait de PROGRAMME — le pincement la borne avant
 * d'arriver ici —, et un repli silencieux ferait dessiner la carte à une
 * échelle que personne n'a demandée.
 *
 * @param {number} echelle pixels physiques par case, réel
 * @returns {number} un élément de `CRANS`
 */
export function cranDeRendu(echelle) {
  if (!Number.isFinite(echelle) || echelle < ECHELLE_MIN || echelle > ECHELLE_MAX) {
    throw new RangeError(
      `zoom : échelle ${echelle} hors de [${ECHELLE_MIN}, ${ECHELLE_MAX}]`,
    );
  }
  // La table est croissante — `monde.test.js` l'exige — et l'échelle est bornée
  // par son dernier élément : il y a toujours un cran qui répond.
  return CRANS.find((cran) => cran >= echelle);
}

/**
 * Le facteur d'affichage d'une échelle : ce par quoi une dalle rendue se
 * réduit pour se poser. Dans (0,5 ; 1], jamais au-delà de 1.
 *
 * @param {number} echelle pixels physiques par case, réel
 * @returns {number}
 */
export function facteurDAffichage(echelle) {
  return echelle / cranDeRendu(echelle);
}

/**
 * Ramène une échelle demandée dans la course du zoom.
 *
 * ⚠ LA BUTÉE EST FRANCHE, ET C'EST LE COMPORTEMENT VOULU. Multiplier une
 * échelle déjà collée à un bout par un rapport, puis re-borner, la laisse où
 * elle est : la carte « colle » aux extrémités au lieu de rebondir.
 *
 * @param {number} demandee échelle voulue, en pixels physiques par case
 * @returns {number} dans [`ECHELLE_MIN`, `ECHELLE_MAX`]
 */
export function bornerEchelle(demandee) {
  return Math.min(ECHELLE_MAX, Math.max(ECHELLE_MIN, demandee));
}

/**
 * La vue après un changement d'échelle qui garde un point de l'écran immobile.
 *
 * ⚠⚠ C'EST TOUTE L'ARITHMÉTIQUE DE L'ANCRAGE, ET ELLE EST ICI POUR ÊTRE
 * MESURÉE. On relève la case sous l'ancre AVANT de changer l'échelle, on la
 * réapplique APRÈS : sans ça la case visée fuit sous les doigts, et sur une
 * carte de 300 rangées on ne la retrouve pas. La sortir de la fermeture est ce
 * qui permet à `ZOOM T7` et `ZOOM T8` de mesurer le vrai code plutôt qu'une
 * copie écrite à la main dans le test — « un montage écrit à la main ne garde
 * que lui-même », leçon que le dépôt a payée cinq fois.
 *
 * @param {{x: number, y: number}} vue coin haut-gauche, en pixels d'écran
 * @param {number} avant échelle d'avant
 * @param {number} apres échelle d'après
 * @param {{x: number, y: number}} ancre point du canevas à garder fixe
 * @returns {{x: number, y: number}}
 */
export function vueApresEchelle(vue, avant, apres, ancre) {
  const colonne = (vue.x + ancre.x) / avant;
  const rangee = (vue.y + ancre.y) / avant;
  return { x: colonne * apres - ancre.x, y: rangee * apres - ancre.y };
}

/**
 * Le bord d'une dalle à l'écran : son indice, la largeur d'affichage d'une
 * dalle, et l'origine de la vue.
 *
 * ⚠⚠ C'EST LA FONCTION QUI SUPPRIME LES COUTURES, ET ELLE EST ICI POUR ÊTRE
 * MESURÉE. Le bord DROIT de la dalle `i` est `bordDeDalle(i + 1, …)`, qui est
 * le bord GAUCHE de la dalle `i + 1` : le même appel, donc le même nombre. Ni
 * trou ni recouvrement, quel que soit le facteur — et ça se calcule, là où une
 * capture peut rater une couture d'un pixel.
 *
 * ⚠ ELLE ARRONDIT, ET C'EST TOUT CE QU'ELLE FAIT. La largeur d'une dalle n'est
 * jamais arrondie de son côté : elle se DÉDUIT de deux bords. Arrondir les deux
 * séparément est très exactement le défaut que cette fonction existe pour
 * rendre impossible.
 *
 * @param {number} indice indice de la dalle sur cet axe
 * @param {number} coteAffiche largeur d'une dalle à l'écran, réelle
 * @param {number} origine coin de la vue sur cet axe, en pixels d'écran
 * @returns {number} entier
 */
export function bordDeDalle(indice, coteAffiche, origine) {
  return Math.round(indice * coteAffiche - origine);
}

/**
 * Combien de dalles au plus se calculent dans une même image.
 *
 * ⚠ CE PLAFOND EXISTE PARCE QU'UNE DALLE COÛTE CHER. Le pavage pose environ
 * cinq tuiles par case : une dalle de 512 demande 1,37 million d'accumulations,
 * mesurées à 19 ms ici. Un défilement qui traverse un bord réclame trois dalles
 * d'un coup ; les calculer dans la même image ferait un à-coup de trois fois ce
 * temps. On en fait deux, on redemande une image, et les manquantes se peignent
 * en attendant de la teinte moyenne de leur camp — jamais du noir.
 */
export const DALLES_PAR_IMAGE = 2;

/**
 * La carte entière, en pixels d'écran, à un cran donné.
 * @param {number} cran pixels physiques par case
 * @returns {{largeur: number, hauteur: number}}
 */
export function dimensionsDeLaCarte(cran) {
  return {
    largeur: GEOGRAPHIE.carte.largeur * cran,
    hauteur: GEOGRAPHIE.carte.hauteur * cran,
  };
}

/**
 * Ramène un défilement dans les bornes de la carte.
 *
 * ⚠ CE QUI TIENT ENTIER SE CENTRE, IL NE SE COLLE PAS À GAUCHE. Au cran le plus
 * large les 31 colonnes tiennent dans la largeur d'un téléphone : les borner à
 * zéro laisserait une bande vide sur un seul côté, ce qui se lit comme un bord
 * de carte qui n'existe pas.
 *
 * @param {number} valeur défilement demandé, en pixels d'écran
 * @param {number} contenu taille de la carte sur cet axe
 * @param {number} vue taille de la fenêtre sur cet axe
 * @returns {number}
 */
export function bornerDefilement(valeur, contenu, vue) {
  if (contenu <= vue) return -(vue - contenu) / 2;
  if (valeur < 0) return 0;
  return valeur > contenu - vue ? contenu - vue : valeur;
}

/**
 * La fenêtre de cases que couvre la vue, en coordonnées de carte.
 *
 * Elle déborde d'une case de chaque côté : un emblème dont le centre est hors
 * champ peut encore mordre sur le bord, et le voir apparaître d'un coup au
 * milieu d'un défilement se remarque.
 *
 * @param {{x: number, y: number, largeur: number, hauteur: number, cran: number}} vue
 * @returns {{premiereRangee: number, derniereRangee: number,
 *   premiereColonne: number, derniereColonne: number}}
 */
export function fenetreVisible(vue) {
  // La case qui porte un pixel : la division entière, plus un, les rangées et
  // les colonnes comptant à partir de 1. Le débordement d'une case est ajouté
  // ensuite, pour qu'on lise les deux décisions séparément.
  const caseDe = (pixel) => Math.floor(pixel / vue.cran) + 1;
  const debord = 1;
  return {
    premiereRangee: caseDe(vue.y) - debord,
    derniereRangee: caseDe(vue.y + vue.hauteur) + debord,
    premiereColonne: caseDe(vue.x) - debord,
    derniereColonne: caseDe(vue.x + vue.largeur) + debord,
  };
}

/**
 * Distance entre deux cases, en cases.
 *
 * ⚠⚠ EUCLIDE DEPUIS LE LOT EUCLIDE (02/09/2026). Ce commentaire disait :
 * « TCHEBYCHEV — le maximum des deux écarts —, comme la garde du peuplement et
 * les anneaux des satellites. Sur une grille, une case en diagonale n'est pas
 * plus loin qu'une case droit devant ; en mesurer trois là où le jeu en compte
 * deux ferait mentir toutes les distances du panneau. » Les trois règles qu'il
 * citait ont basculé ensemble ; c'est en RESTANT à Tchebychev que ce panneau se
 * serait mis à mentir — il aurait annoncé « 8 cases » sous un rayon de 10 pour
 * une cible que le jeu refuse.
 *
 * ⚠ ARRONDIE AU SUPÉRIEUR, ET C'EST LE SEUL ARRONDI QUI NE TROMPE PAS. Une
 * cible à 10,05 cases est hors de portée ; l'annoncer à « 10 » la ferait
 * paraître atteignable, et le joueur chercherait ce qui cloche dans son budget.
 * `casesArrondiesAuSuperieur` fait ce calcul sans racine flottante.
 *
 * ⚠ ELLE N'EST QU'UN AFFICHAGE. Ce qui DÉCIDE de la portée est
 * `estAPorteeDAttaque`, et ce qui décide du prix est `coutDUnRaid` : cette
 * fonction-ci ne gouverne rien, et un écran ne doit jamais gouverner une règle.
 *
 * @param {{rangee: number, colonne: number}} a
 * @param {{rangee: number, colonne: number}} b
 * @returns {number}
 */
export function distanceEnCases(a, b) {
  return casesArrondiesAuSuperieur(distanceCarreeCases(a, b));
}

/**
 * Tous les sites d'une fenêtre, dans l'ORDRE OÙ ILS SE DESSINENT.
 *
 * ⚠ L'ORDRE EST LE DESSIN, ET C'EST POUR ÇA QU'ON NE DÉDOUBLONNE PAS. La base
 * terminale est une case fixe de la carte ; rien n'interdit au peuplement d'y
 * poser aussi une base. Retirer l'une des deux ferait diverger cette liste de
 * `estBaseOuvrage`, qui est la seule source du peuplement — et c'est exactement
 * ce qu'un test asserte. On les garde toutes les deux et la dernière se dessine
 * par-dessus.
 *
 * @param {object} etat
 * @param {object} fenetre
 * @returns {Array<{type: string, rangee: number, colonne: number, niveau: number|null}>}
 */
export function sitesDeLaFenetre(etat, fenetre) {
  const dedans = (rangee, colonne) => rangee >= fenetre.premiereRangee
    && rangee <= fenetre.derniereRangee
    && colonne >= fenetre.premiereColonne
    && colonne <= fenetre.derniereColonne;

  // ⚠⚠ LA SAVEUR SE DEMANDE, ELLE NE SE RECALCULE PAS. `saveurDeLaCase` est pure
  // et testée depuis le lot SITE-D'UNE-CASE ; en écrire une seconde lecture ici
  // ferait deux vérités sur ce qu'un camp contient, et la divergence se lirait
  // comme un bogue de jeu. C'est ce qui manquait pour que les dix-huit
  // `site_quartz_n*` et `site_scorie_n*` servent : cette fonction-ci ne
  // transportait que type, rangée, colonne et niveau.
  //
  // ⚠ ELLE EST DE LA CASE, PAS DE L'INSTANCE — deux camps successifs au même
  // endroit sont riches de la même chose (arbitré le 29/08). On ne l'accroche
  // donc à aucun identifiant de satellite.
  //
  // ⚠ ET LES TROIS SITES DE TYPE « BASE » LA DEMANDENT AUSSI, sous le type que
  // le MODÈLE connaît. `TYPES_SITE` n'a que camp, avantPoste et base : ni
  // `baseJoueur` ni `baseTerminale` n'y sont, et les deux sont des bases. Leur
  // passer `'base'` laisse la règle de `saveurDeLaCase` décider — elle rend
  // `null` —, là où écrire `saveur: null` à la main serait une quatrième
  // affirmation sur une question qui a déjà sa réponse.
  const saveur = (rangee, colonne, type) => saveurDeLaCase(etat.graine, rangee, colonne, type);

  // ⚠⚠ L'AVARIE SE DEMANDE AU MOTEUR, ET ELLE NE SE DÉDUIT PAS DU PANNEAU.
  // `avariesParCase` part des sites ENTAMÉS — quelques dizaines — et non des
  // sites visibles, qui sont jusqu'à quinze cents : interroger chaque case
  // régénérerait un montage par case, à chaque image.
  //
  // ⚠ ET LA BASE DU JOUEUR NE PASSE PAS PAR CETTE TABLE : elle n'est pas un
  // site entamé de l'Ouvrage, ses dégâts vivent dans sa `disposition`. C'est la
  // MÊME règle qui les lit — `avarieDeLaBase` et `avarieDuSite` appellent toutes
  // deux `avarie`, et le discriminant est `raseLeSite` des deux côtés.
  const avaries = avariesParCase(etat);
  const avarie = (rangee, colonne) => avaries.get(`${rangee}:${colonne}`) ?? 'aucune';

  // ⚠⚠ UNE BASE RASÉE NE SE DESSINE PLUS, ET LE DÉFAUT A ÉTÉ MESURÉ AVANT
  // D'ÊTRE CORRIGÉ — lot CONQUÊTE-24H, 07/09/2026. Cette ligne appelait
  // `basesDeLaFenetre(etat.graine, …)` — **la graine seule, sans l'état** —, si
  // bien qu'une base rasée restait dessinée INTACTE sur la carte pendant que
  // `siteDeLaCase` y rendait déjà `null` : le joueur voyait une base qu'il venait
  // de détruire, et la toucher n'ouvrait rien. Mesuré sur la graine 31 082 026,
  // base (200, 9) : après `retirerLeSite`, `sitesDeLaFenetre` la rendait encore,
  // `avarie: 'aucune'`.
  //
  // ⚠⚠ C'EST LE MÊME DÉFAUT QUE `TF T10` A CORRIGÉ DANS `forcesDeLOuvrage`,
  // pris par l'autre bout — la force, puis le dessin. Les deux venaient du même
  // oubli : `basesDeLaFenetre` ne lit QUE la graine, et l'histoire vit dans
  // l'état.
  //
  // ⚠ ET LE FILTRE IGNORE L'EXPIRATION, comme `siteDeLaCase` : une base rasée
  // ne revient jamais. C'est la ruine qui expire, pas le rasement.
  const rasees = casesRasees(etat);
  const sites = basesDeLaFenetre(etat.graine, fenetre)
    .filter((base) => !rasees.has(cleDeLaCase(base.rangee, base.colonne)))
    .map((base) => ({
      type: 'base',
      rangee: base.rangee,
      colonne: base.colonne,
      niveau: niveauDeLaRangee(base.rangee),
      saveur: saveur(base.rangee, base.colonne, 'base'),
      avarie: avarie(base.rangee, base.colonne),
    }));

  // ⚠⚠ APRÈS LES BASES DE L'OUVRAGE ET AVANT LES SATELLITES, ET L'ORDRE EST LE
  // DESSIN. Un POI ne peut tomber ni sur une base de l'Ouvrage ni sous un
  // satellite — `sim/poi.js` refuse la première, `poserUnSatellite` refuse la
  // seconde —, donc le recouvrement n'arrive pas ; mais si la règle cessait un
  // jour d'être vraie, mieux vaut que ce soit le SITE ATTAQUABLE qui se dessine
  // par-dessus le gisement, et pas l'inverse.
  //
  // ⚠ LE CHAMP `niveau` PORTE LA BANDE (1 à 10) : c'est ce que le joueur lit
  // comme « niveau du POI », et c'est aussi ce qui dit à quel prix on va le
  // chercher. La `saveur` vaut `null` — un POI n'est ni riche en quartz ni riche
  // en scorie, il EST le gisement.
  for (const poi of poisDeLaFenetre(etat.graine, fenetre)) {
    sites.push({
      type: poi.type,
      rangee: poi.rangee,
      colonne: poi.colonne,
      niveau: poi.bande,
      saveur: null,
    });
  }

  // ⚠ TOUTES LES BASES — lot BASES-1. Les satellites sont par base : n'afficher
  // que ceux de la courante faisait disparaître de la carte les camps d'une
  // autre, alors qu'ils y sont bel et bien.
  for (const { satellite } of satellitesPresents(etat)) {
    if (!dedans(satellite.rangee, satellite.colonne)) continue;
    sites.push({
      type: satellite.type,
      rangee: satellite.rangee,
      colonne: satellite.colonne,
      niveau: satellite.niveau,
      saveur: saveur(satellite.rangee, satellite.colonne, satellite.type),
      avarie: avarie(satellite.rangee, satellite.colonne),
    });
  }

  const terminale = positionBaseTerminale();
  if (dedans(terminale.rangee, terminale.colonne)) {
    sites.push({
      type: 'baseTerminale',
      rangee: terminale.rangee,
      colonne: terminale.colonne,
      niveau: niveauDeLaRangee(terminale.rangee),
      saveur: saveur(terminale.rangee, terminale.colonne, 'base'),
    });
  }

  // ⚠ LES BASES DU JOUEUR EN DERNIER, ET TOUTES — lot BASES-1. Ce sont les seuls
  // sites qu'il ne doit jamais perdre de vue, et il en a maintenant plusieurs.
  //
  // ⚠⚠ `courante` PORTE LE HALO, ET C'EST `etat.baseCourante` QUI LE DIT.
  // **LECTURE PRISE** (§4.6 du brief) : haloter et basculer sont le MÊME geste.
  // Un seul état, une seule vérité — deux notions distinctes, « la base
  // affichée » et « la base qui attaque », se désynchroniseraient à la première
  // inattention, et le joueur lancerait un raid depuis une base qu'il ne regarde
  // pas. Si Ethan veut les séparer, c'est ce champ qui gagne une source à lui.
  //
  // ⚠ PAS DE SECONDE CONVENTION DE COULEUR : le halo réemploie l'os qui borde
  // déjà la base du joueur, il n'invente aucune teinte.
  etat.bases.forEach((base, indice) => {
    if (!dedans(base.position.rangee, base.position.colonne)) return;
    sites.push({
      type: 'baseJoueur',
      rangee: base.position.rangee,
      colonne: base.position.colonne,
      niveau: null,
      saveur: saveur(base.position.rangee, base.position.colonne, 'base'),
      avarie: avarieDeLaBase(base),
      indiceBase: indice,
      courante: indice === etat.baseCourante,
      // ⚠⚠ LE NUMÉRO COMPTE À PARTIR DE UN, ET IL NE S'INVENTE PAS ICI : le
      // bandeau de bascule affiche déjà « BASE 1 / 1 » depuis le lot BASES-1.
      // Deux façons de numéroter la même base seraient une de trop.
      numeroBase: indice + 1,
      // ⚠⚠ LE NIVEAU DES BÂTIMENTS, EN DIXIÈMES ENTIERS, ET C'EST LA MÊME
      // GRANDEUR QUE L'EMBLÈME. `palierDuSite` la retient déjà pour choisir le
      // palier de dessin d'une base du joueur ; l'étiquette qui LÉGENDE ce
      // dessin en prendrait une autre que le même dessin dirait deux choses.
      //
      // ⚠ ET SURTOUT PAS LE NIVEAU DE LA RANGÉE. `niveauDeLaRangee` donne le
      // niveau des sites de l'OUVRAGE à cet endroit : l'écrire sous une base du
      // joueur est la faute que `sim/carte.js` existe pour empêcher, et que
      // trois commentaires de ce fichier nomment déjà.
      niveauBatimentsDixiemes: niveauDesBatiments(base.disposition),
    });
  });
  return sites;
}

/**
 * Le palier d'emblème d'un site affiché — 1 à 9.
 *
 * ⚠⚠ LA BASE DU JOUEUR PORTE `niveau: null`, ET SON PALIER NE PEUT PAS SE LIRE
 * SUR SA RANGÉE. `niveauDeLaRangee` donne le niveau des sites de l'OUVRAGE à cet
 * endroit ; l'employer ici serait exactement la faute que `sim/carte.js` existe
 * pour empêcher, et que l'en-tête de ce fichier nomme déjà.
 *
 * ⚠ RETENU : LE NIVEAU DE SES BÂTIMENTS, et c'est un CHOIX RÉVERSIBLE — le seul
 * point de ce lot qu'Ethan n'a pas arbitré. Le joueur en a trois (bâtiments,
 * défense, armée) ; celui des bâtiments est ce qu'une base montre de loin, et
 * c'est aussi celui que l'écran Base affiche en premier. Les deux autres tiennent
 * en une ligne d'ici.
 *
 * ⚠ IL EST EN DIXIÈMES ENTIERS — `moyenneEnDixiemes` — et s'arrondit avant de
 * chercher un palier. Une base neuve n'a qu'un Chantier de niveau 1, donc 10 :
 * l'arrondi au plus proche donne 1, et `palierDeNiveau` lève sous 1.
 *
 * @param {{type: string, niveau: number|null}} site
 * @param {object} etat
 * @returns {number} 1…9
 */
export function palierDuSite(site, etat) {
  if (site.niveau !== null) return palierDeNiveau(site.niveau);
  // ⚠⚠ LE SITE PORTE SA PROPRE MOYENNE DEPUIS LE LOT CARTE-A, ET ELLE PASSE
  // AVANT CELLE DE LA BASE COURANTE. C'est l'étiquette qui l'a exigé : elle
  // LÉGENDE ce dessin, donc les deux doivent lire la même grandeur. Avec deux
  // bases, l'ancienne écriture donnait à TOUTES le palier de la base courante,
  // si bien que le dessin et sa plaque se seraient contredits dès la seconde.
  //
  // ⚠ LE REPLI RESTE, ET IL SERT : `palierDuSite` est appelée par des montages
  // qui composent un site à la main, sans passer par `sitesDeLaFenetre`.
  const dixiemes = site.niveauBatimentsDixiemes === undefined
    ? niveauDesBatiments(baseCourante(etat).disposition)
    : site.niveauBatimentsDixiemes;
  const niveau = Math.max(1, Math.round(dixiemes / 10));
  return palierDeNiveau(niveau);
}

/**
 * Ce que le panneau dit d'un site — et rien de plus.
 *
 * ⚠ LE NIVEAU DE LA BASE DU JOUEUR EST `null`, ET LA LIGNE LE DIT. Il n'a pas
 * de niveau de carte : il en porte trois, qui sont des moyennes de ce qu'il a
 * posé. Afficher ici le niveau de sa rangée reviendrait à lui apprendre une
 * grandeur fausse.
 *
 * @param {{type: string, rangee: number, colonne: number, niveau: number|null}} site
 * @param {{rangee: number, colonne: number}} depuis position de la base du joueur
 * @returns {Array<{quoi: string, valeur: string}>}
 */
export function ciblageDuSite(etat, site) {
  const identite = siteDeLaCase(etat, site.rangee, site.colonne);
  if (identite === null) return null;
  const montage = montageCourant(etat, identite);
  // ⚠⚠ LES PROBLÈMES SE DEMANDENT AVANT LE COÛT, ET CE N'EST PAS UN DÉTAIL
  // D'ORDRE — c'était un DÉFAUT, trouvé au lot DÉPLACEMENT et présent sur `main`
  // depuis RAID-A. `coutDuRaid` LÈVE au-delà du rayon d'attaque, à raison : un
  // raid hors de portée n'a pas de prix. Mais cette fonction-ci le demandait
  // pour TOUT site que le panneau ouvre, et le panneau s'ouvre sur ce que la
  // FENÊTRE montre, pas sur ce qui est à portée. Conséquence mesurée dans
  // Chromium : toucher n'importe quel site au-delà de dix cases faisait lever
  // `ouvrirPanneau`, donc le panneau ne s'ouvrait PAS — le joueur ne pouvait
  // consulter aucun site lointain, sur toute la carte.
  //
  // ⚠ ET LE COÛT VAUT `null`, PAS ZÉRO. Un raid hors de portée n'a pas de prix ;
  // « 0 point d'attaque » se lirait « gratuit ». C'est la convention que tout le
  // dépôt emploie — `niveauDeCommandement` rend `null` faute de bâtiment, et son
  // commentaire dit exactement pourquoi zéro serait un mensonge.
  const problemes = problemesDuRaid(etat, baseCourante(etat), identite);
  const horsPortee = problemes.some((p) => p.code === 'hors-portee');
  return {
    butin: butinSiToutTombe(montage),
    force: forceDeLaDefense(montage.defenseurs),
    cout: horsPortee ? null : coutDUnRaid(etat, baseCourante(etat), identite),
    problemes,
  };
}

/**
 * Ce que fait le SECOND toucher sur un site déjà ouvert.
 *
 * ⚠⚠ IL SE LIT SUR LE TYPE, ET C'EST LE §2.2 DU LOT ASSAUT. Ethan, 04/09 : « il
 * faut que le double clic, on rentre sur la base, et dans la cible prêt à
 * attaquer ». Avant ce lot, le second toucher appelait `entrerDansLaCible` quel
 * que soit le site : sur sa PROPRE base, `ciblageDuSite` rend `null` — on
 * n'attaque pas chez soi — et le panneau affichait « Plus rien à attaquer ici ».
 * **Le geste ne menait nulle part.**
 *
 * ⚠ ET IL N'A RIEN À BASCULER. `ouvrirPanneau` écrit déjà `etat.baseCourante` au
 * PREMIER toucher — c'est la lecture prise au lot BASES-1, « haloter et basculer
 * sont le MÊME geste ». Rebasculer ici poserait une seconde écriture de la même
 * grandeur sur le même trajet, et deux écritures de la même grandeur divergent à
 * la première inattention.
 *
 * ⚠ UN SEUL LITTÉRAL POUR LES DEUX QUESTIONS QUI SE POSENT SUR SA PROPRE BASE :
 * celle-ci et le bouton « Déplacer la base », qui LIT cette fonction plutôt que
 * de recomparer le type de son côté.
 *
 * @param {{type: string}} site
 * @returns {'base'|'cible'}
 */
export function gesteDuSecondToucher(site) {
  return site.type === 'baseJoueur' ? 'base' : 'cible';
}

export function lignesDuSite(site, depuis, poisAcquis = [], ciblage = null) {
  const embleme = EMBLEMES_CARTE[site.type];
  if (embleme === undefined) throw new Error(`monde : type de site inconnu « ${site.type} »`);
  const distance = distanceEnCases(site, depuis);
  const lignes = [
    { quoi: 'Type', valeur: embleme.nom },
    {
      quoi: 'Niveau',
      valeur: site.niveau === null
        ? '— trois moyennes, sur l\'écran Base'
        : String(site.niveau),
    },
  ];
  // ⚠⚠ D'OÙ VIENT CE NIVEAU — Ethan, 06/09. Il a vu un avant-poste de niveau 1
  // collé à une base de niveau 7,6 et a demandé pourquoi : un CAMP suit le niveau
  // des bâtiments du joueur, un AVANT-POSTE suit l'endroit de la carte, et rien à
  // l'écran ne le disait. Il a choisi de ne pas changer la règle mais de
  // l'AFFICHER.
  //
  // ⚠⚠ LE DISCRIMINANT EST `TYPES_SITE[x].indexeSur`, JAMAIS UN `if` SUR LE TYPE.
  // Un `site.type === 'camp'` écrit ici serait la seconde vérité que §4 de
  // `CLAUDE.md` interdit, et la première à mentir le jour où un troisième type de
  // satellite arriverait. Le libellé, lui, vit dans `src/data/` à côté du champ.
  //
  // ⚠ ET AUCUN CHIFFRE N'EST RECALCULÉ : la ligne explique l'ORIGINE du niveau,
  // elle ne le réévalue pas — celui du site est déjà dans l'état.
  //
  // ⚠ RIEN SUR SA PROPRE BASE, ni sur un POI. La base du joueur n'a pas UN niveau
  // mais trois moyennes, et elle n'est pas dans `TYPES_SITE` ; un POI n'a pas de
  // niveau du tout, sa « bande » n'en est pas un.
  const typeDuSite = TYPES_SITE[site.type];
  if (typeDuSite !== undefined && site.niveau !== null) {
    const origine = ORIGINE_DU_NIVEAU[typeDuSite.indexeSur];
    if (origine === undefined) {
      throw new Error(`monde : « ${typeDuSite.indexeSur} » n'a pas de libellé d'origine`);
    }
    lignes.push({ quoi: 'Indexé sur', valeur: origine });
  }
  lignes.push(
    { quoi: 'Distance', valeur: distance === 1 ? '1 case' : `${distance} cases` },
    { quoi: 'Position', valeur: `rangée ${site.rangee}, colonne ${site.colonne}` },
  );
  // ⚠⚠ DEUX LIGNES DE PLUS POUR UN POI, ET LA FONCTION RESTE PURE. Elle reçoit la
  // LISTE DES ACQUIS, jamais l'état entier : lui passer `etat` lui donnerait accès
  // à tout, et la première commodité prise ici serait la fin de sa pureté.
  //
  // ⚠ LE LIBELLÉ DU BONUS VIENT DE `POI`, il ne se recompose pas ici. Recomposer
  // une phrase française morceau par morceau a déjà produit « aucun unité » puis
  // « aucune unité n'est endommagé », en deux essais, au lot RETOURS-ETHAN.
  const def = POI[site.type];
  if (def !== undefined) {
    lignes.push({ quoi: 'Bonus', valeur: `+${def.bonusPct} % ${def.libelleEffet}` });
    lignes.push({
      quoi: 'Propriété',
      valeur: poiEstAcquis(poisAcquis, { type: site.type, bande: site.niveau })
        ? 'acquis'
        : 'à prendre',
    });
  }

  // ⚠⚠ QUATRE LIGNES DE PLUS POUR UNE CIBLE ATTAQUABLE, ET AUCUN DES TROIS
  // NOMBRES N'EST CALCULÉ ICI. `butinSiToutTombe`, `forceDeLaDefense` et
  // `coutDUnRaid` sont écrits et testés depuis longtemps, et n'étaient appelés
  // par AUCUN écran ; `ciblageDuSite` les rappelle. Les refaire à la main ici
  // donnerait un second barème, et le panneau finirait par annoncer autre chose
  // que ce que le raid verse — c'est la faute que `butinSiToutTombe` porte déjà
  // en garde dans son propre commentaire.
  //
  // ⚠ ET LA FONCTION RESTE PURE : elle REÇOIT le ciblage, elle ne va pas le
  // chercher. Lui passer `etat` lui donnerait accès à tout, et ce fichier dit
  // déjà, deux blocs plus haut, que la première commodité prise ici serait la
  // fin de sa pureté.
  //
  // ⚠ LE BUTIN EST CELUI D'UN SITE ENTAMÉ, pas celui du site neuf : le montage
  // vient de `montageCourant`, donc avec les PV courants. Sur une cible déjà
  // frappée, le nombre baisse — c'est ce qu'il RESTE à prendre.
  if (ciblage !== null) {
    lignes.push({ quoi: 'Butin si tout tombe', valeur: `${ciblage.butin.quartz} quartz` });
    lignes.push({ quoi: 'dont scorie', valeur: `${ciblage.butin.scorie} scorie` });
    lignes.push({ quoi: 'Force de la défense', valeur: `${ciblage.force} points` });
    // ⚠⚠ LE COÛT N'EST PLUS UNE LIGNE DE CETTE LISTE — lot CARTE-A, 04/09. Il y
    // était, en petit, au milieu de sept autres ; Ethan le veut « en gros dans
    // l'onglet ». Il est donc peint par un BLOC propre, au-dessus du corps, et
    // il ne peut pas être ici en même temps : deux afficheurs du même nombre
    // dans le même panneau finiraient par ne plus dire la même chose.
    //
    // ⚠ ET IL N'Y A TOUJOURS QU'UN SEUL CALCUL. Le bloc relit `ciblageOuvert`,
    // il ne rappelle pas `coutDUnRaid` — c'est ce que `ciblageDuSite` interdit
    // depuis le lot RETOURS-DU-31. Ce lot RETIRE un afficheur, il n'en ajoute
    // pas un second.
  }
  return lignes;
}

/**
 * Le rang de priorité d'une étiquette : plus il est petit, plus elle compte.
 *
 * ⚠⚠ ELLE LIT `ETIQUETTE_CARTE.ordreDePriorite` ET NE RECOPIE AUCUN NOM. Une
 * seconde liste écrite ici serait la copie qui vieillit au premier type de site
 * ajouté — et §4 veut de toute façon le calibrage dans `src/data/`.
 *
 * ⚠⚠ UN TYPE HORS TABLE PASSE EN DERNIER, JAMAIS EN TÊTE. `indexOf` rend −1,
 * qui trierait AVANT la base du joueur : c'est la faute exacte qu'`ORDRE_CHASSIS`
 * a payée au lot ARMÉE-ET-FRONTIÈRE, où un châssis inconnu se serait rangé
 * devant l'infanterie. Il n'est pas LEVÉ ici, et le motif est mesuré ailleurs :
 * une levée dans la boucle de dessin tronque tout l'écran Monde — c'est ce que
 * `dessinerGrosseBase` a coûté au lot ZOOM-CONTINU. La garde qui empêche le cas
 * d'arriver est au DÉPÔT : `monde.test.js` exige que la table soit une
 * permutation EXACTE des clés d'`EMBLEMES_CARTE`, donc elle tombe chez nous, pas
 * chez le joueur.
 *
 * @param {string} type
 * @returns {number}
 */
export function prioriteDeLEtiquette(type) {
  const rang = ETIQUETTE_CARTE.ordreDePriorite.indexOf(type);
  return rang === -1 ? ETIQUETTE_CARTE.ordreDePriorite.length : rang;
}

/**
 * Quelles étiquettes dessiner quand plusieurs se recouvrent.
 *
 * ⚠⚠ ETHAN, 04/09 : « les noms des éléments de la carte persistent jusqu'à ce
 * que je dézoome, environ dix cases en largeur ». Le seuil descend à 36 px CSS
 * par case pour le lui donner ; mais le recouvrement, lui, ne disparaît pas —
 * il EMPIRE, le zoom continu pouvant s'arrêter à n'importe quelle échelle,
 * donc juste au pire endroit. Une plaque n'est donc dessinée que si sa boîte ne
 * coupe aucune boîte DÉJÀ retenue.
 *
 * ⚠⚠ ET LES SITES SONT EXAMINÉS PAR PRIORITÉ, PAS DANS L'ORDRE D'ENTRÉE. Sans
 * cela, la plaque qui reste serait celle que `sitesDeLaFenetre` a poussée en
 * premier : deux images identiques n'afficheraient pas les mêmes noms, et le
 * joueur verrait un nom apparaître ou disparaître en défilant d'un pixel. À
 * priorité égale, la case la plus HAUTE puis la plus à GAUCHE — deux critères,
 * parce qu'un seul laisse des ex æquo.
 *
 * ⚠ FONCTION PURE, ET C'EST LA SEULE FAÇON DE TESTER CE POINT : `CLAUDE.md` §3
 * rappelle que l'écran est hors de portée faute de DOM. Celle qui PEINT ne
 * décide plus rien.
 *
 * @param {Array<{x: number, y: number, largeur: number, hauteur: number,
 *   priorite: number, rangee?: number, colonne?: number}>} boites
 * @returns {number[]} les indices retenus, dans l'ordre d'entrée
 */
export function etiquettesRetenues(boites) {
  const coupe = (a, b) => a.x < b.x + b.largeur && b.x < a.x + a.largeur
    && a.y < b.y + b.hauteur && b.y < a.y + a.hauteur;
  const ordre = boites.map((boite, indice) => ({ boite, indice }))
    .sort((a, b) => a.boite.priorite - b.boite.priorite
      || (a.boite.rangee ?? 0) - (b.boite.rangee ?? 0)
      || (a.boite.colonne ?? 0) - (b.boite.colonne ?? 0)
      || a.indice - b.indice);
  const retenues = [];
  const gardees = [];
  for (const { boite, indice } of ordre) {
    if (gardees.some((autre) => coupe(boite, autre))) continue;
    gardees.push(boite);
    retenues.push(indice);
  }
  // ⚠ RENDUES DANS L'ORDRE D'ENTRÉE, pas dans celui de la priorité : l'appelant
  // dessine sa liste, il n'a pas à la réordonner pour savoir qui il peint.
  return retenues.sort((a, b) => a - b);
}

/**
 * Un cache de dalles à éviction de la moins récemment employée.
 *
 * ⚠ PAS « FENÊTRE + MARGE ». Le pavage pose environ cinq tuiles par case ; au
 * cran le plus large la fenêtre fait 31 × 43 cases, soit près de 7 000 poses.
 * Avec une marge, chaque franchissement de bord les referait TOUTES d'un coup,
 * puis encore au retour. Une dalle ne se calcule qu'une fois, et elle reste.
 *
 * @param {number} capacite
 */
export function creerCacheDalles(capacite) {
  // `Map` garde l'ordre d'insertion : réinsérer une entrée lue la remet en
  // queue, et la plus ancienne est toujours la première clé.
  const entrees = new Map();
  return {
    get taille() { return entrees.size; },
    lire(cle) {
      if (!entrees.has(cle)) return undefined;
      const valeur = entrees.get(cle);
      entrees.delete(cle);
      entrees.set(cle, valeur);
      return valeur;
    },
    ecrire(cle, valeur) {
      if (entrees.has(cle)) entrees.delete(cle);
      entrees.set(cle, valeur);
      while (entrees.size > capacite) {
        entrees.delete(entrees.keys().next().value);
      }
    },
    vider() { entrees.clear(); },
  };
}

/**
 * ⚠⚠ `indicesDeTeinte` A ÉTÉ RETIRÉE AU LOT SOL-SATELLITE (05/09), ET SON TEST
 * AVEC — deux assertions en moins, et elles se déclarent.
 *
 * Elle relisait l'atlas de terrain décodé par le navigateur et rendait, pour
 * chaque pixel, son rang dans la rampe du joueur : c'était l'entrée de la
 * moulinette qui accumulait puis requantifiait le fond de carte. Le sol est
 * maintenant fait de huit planches posées telles quelles ; il n'y a plus d'image
 * indexée à relire, plus de rang à retrouver, et surtout **plus un seul pixel du
 * sol qui transite par un tableau JavaScript** — les planches restent des
 * `<img>` que le navigateur pose lui-même.
 *
 * ⚠ ET C'EST CE QUI REND LE LOT PAYABLE EN MÉMOIRE. Décoder les huit planches en
 * `Uint8Array` aurait coûté **50 Mio** à lui seul (8 × 1254² × 4 octets), à côté
 * des 64 Mio du cache de dalles. Ne pas la recréer pour « pouvoir mesurer » : ce
 * qui se mesure du sol se mesure dans `art/sprites/sol/sol-empreintes.json`.
 */

/**
 * Le centre d'une case, en pixels du canevas.
 *
 * ⚠ PUR, ET C'EST CE QUI REND LE HALO ET LA FLÈCHE TESTABLES SANS DOM. Le dépôt
 * n'a ni jsdom ni navigateur ; une géométrie écrite dans la boucle de dessin ne
 * se vérifie qu'à l'œil, et l'écran Monde a déjà payé ça une fois — le
 * `drawImage` aux rectangles non finis du lot RETOURS-DU-31, qui ne dessinait
 * rien et ne levait pas.
 *
 * @param {{rangee: number, colonne: number}} k
 * @param {number} ox origine de la vue, en pixels
 * @param {number} oy
 * @param {number} pas côté d'une case, en pixels
 * @returns {{x: number, y: number}}
 */
export function centreDeLaCase(k, ox, oy, pas) {
  return {
    x: (k.colonne - 1) * pas - ox + pas / 2,
    y: (k.rangee - 1) * pas - oy + pas / 2,
  };
}

/**
 * Le contour qui ÉPOUSE la base attaquante — un cadre sur les bords de sa case.
 *
 * ⚠⚠ C'ÉTAIT UN CERCLE QUI DÉBORDAIT, ET ETHAN L'A RETOURNÉ LE 03/09 : « le
 * halo doit coller la base, faire son contour et clignoter ». L'ancien anneau
 * avait un rayon de 0,72 case, donc il flottait AUTOUR sans rien toucher ; le
 * motif écrit ici disait qu'un cercle inscrit « serait caché par l'emblème qui
 * s'y dessine », et c'était vrai — l'emblème couvre la case ENTIÈRE, mesuré sur
 * `dessinerEmblemeDUneCase`, qui rend `cote: taille`. La réponse n'est pas de
 * déborder, c'est de PASSER AU-DESSUS : le contour se dessine désormais après
 * les emblèmes, comme la flèche.
 *
 * ⚠ LE TRAIT RENTRE D'UNE DEMI-ÉPAISSEUR, et ce n'est pas cosmétique. Un
 * `strokeRect` centre son trait sur le chemin : posé sur le bord exact de la
 * case, la moitié du trait mordrait sur les quatre voisines, et deux bases
 * adjacentes — ce que le lot BASES-1 autorise — se toucheraient par leur halo.
 *
 * ⚠ SA COULEUR N'EST PAS NEUVE. `TEINTES_TERRITOIRE[JOUEUR]` est déjà l'os que
 * `EMBLEMES_CARTE` donne au bord de la base du joueur, et que la frontière de
 * son territoire emploie : le halo se range dans cette convention, il n'en
 * ouvre pas une seconde. Un troisième code de couleur pour la même chose
 * apprendrait au joueur deux langages pour un seul fait.
 *
 * ⚠ AVEC UNE SEULE BASE, C'EST LA SIENNE. Le multi-bases — « si on clique sur
 * une autre base joueur, cette dernière devient halotée » — est hors périmètre :
 * Ethan, 02/09, « il faut aussi brancher le système à plusieurs bases. Après. »
 * Cette fonction prend donc une POSITION et non un état, pour que ce jour-là il
 * n'y ait qu'un appelant à changer.
 *
 * @param {{rangee: number, colonne: number}} position
 * @param {number} ox
 * @param {number} oy
 * @param {number} pas
 * @returns {{x: number, y: number, rayon: number, epaisseur: number}}
 */
export function geometrieDuHalo(position, ox, oy, pas) {
  const epaisseur = Math.max(1, Math.round(pas * EPAISSEUR_HALO));
  const demi = epaisseur / 2;
  return {
    x: (position.colonne - 1) * pas - ox + demi,
    y: (position.rangee - 1) * pas - oy + demi,
    cote: pas - epaisseur,
    epaisseur,
  };
}

/**
 * Son épaisseur, en cases : elle suit le cran, comme celle des frontières.
 *
 * ⚠⚠ ET LA FLÈCHE NE LA PARTAGE PLUS — 11/09. Elle l'a lue jusqu'à ce lot, et
 * c'est ce partage qui a produit le défaut : 0,08 de case fait un CADRE lisible
 * et un TRAIT trop gras, 16 px pour une pointe de 48 px de large à 200 px par
 * case. `EPAISSEUR_FLECHE` porte désormais la sienne. Il reste DEUX lecteurs
 * ici — le halo et le liseré des cases du déplacement, tous deux des cadres.
 */
export const EPAISSEUR_HALO = 0.08;

/**
 * La période du clignotement, en appels de `rafraichir`.
 *
 * ⚠⚠ LE CLIGNOTEMENT NE LIT AUCUNE HORLOGE, ET IL NE POUVAIT PAS. `maintenantMs`
 * est la SEULE lectrice du temps mural de tout `src/`, et la garde §11 de
 * `banc.test.js` exige EXACTEMENT une occurrence, dans `ui/session.js` : une
 * seconde ici ferait tomber la suite. Le compteur est donc celui des appels que
 * la session fait déjà — elle les cadence à `>= 100` millisecondes dans
 * `boucle()`, soit dix par seconde —, si bien que dix ticks valent une seconde.
 * Un tour complet fait donc **une seconde allumé, une seconde éteint**.
 *
 * ⚠ ET SA CADENCE EST LUE, PAS SUPPOSÉE : si `session.js` change son seuil, le
 * clignotement change de vitesse et rien ne casse. C'est un rythme, pas une
 * grandeur de jeu.
 */
export const PERIODE_HALO_TICKS = 10;

/**
 * Le contour est-il allumé à ce tick ? Pure, donc mesurable sans navigateur.
 *
 * ⚠ ELLE EST SÉPARÉE DU DESSIN EXPRÈS. Le dépôt n'a ni jsdom ni navigateur
 * (§3) : une alternance écrite dans la boucle de rendu ne serait vérifiable
 * qu'à l'œil, et c'est exactement ce que la géométrie du halo a déjà payé au
 * lot RETOURS-DU-31.
 *
 * @param {number} tick
 * @returns {boolean}
 */
export function haloAllumeAuTick(tick) {
  return Math.floor(tick / PERIODE_HALO_TICKS) % 2 === 0;
}

/**
 * Le nom affiché d'un site — l'étiquette de la carte ET le titre du panneau.
 *
 * ⚠⚠ ETHAN, 03/09 : « rajouter un petit nom sur fond semi opaque + niveau en
 * dessous de chaque entité de la carte ». C'est un RETOUR SUR L'ARBITRAGE DU
 * 30/08 — « on enlève les lettres quoi qu'il arrive » —, et il faut le dire
 * dans ce sens-là : ce qui avait été retiré, c'était la LETTRE, une
 * désignation d'une seule capitale peinte SUR l'emblème et qu'il fallait
 * décoder. Ce qui revient est un NOM, écrit en toutes lettres, posé SOUS la
 * case. `CSS_MINI_LETTRE` ne reparaît pas et le champ `lettre` n'est toujours
 * pas relu par la carte : les deux gardes qui les surveillent tiennent.
 *
 * ⚠ LE NOM SE LIT DANS `EMBLEMES_CARTE`, QUI LE TIENT LUI-MÊME DE `POI` POUR
 * LES SEPT GISEMENTS. C'est déjà la source du titre du panneau de site — trois
 * lecteurs vivants —, donc l'étiquette et le panneau ne peuvent pas se
 * contredire. En écrire une seconde table donnerait deux noms au même endroit.
 *
 * ⚠⚠ ET C'EST POURQUOI CETTE FONCTION EXISTE DEPUIS LE LOT CARTE-A. Le numéro
 * de base est le PREMIER nom que la table ne porte pas : le calculer dans
 * l'étiquette et dans le panneau ferait deux endroits pour un seul libellé, et
 * le joueur lirait deux noms pour la même base sur le même écran.
 *
 * ⚠ `EMBLEMES_CARTE.baseJoueur.nom` RESTE « Votre base », ET C'EST LE REPLI. Il
 * est aussi la source de la ligne « Type » du panneau et de son test ; y écrire
 * « Base » tout court ferait mentir les deux.
 *
 * @param {{type: string, numeroBase?: number}} site
 * @returns {string}
 */
export function nomDuSite(site) {
  const embleme = EMBLEMES_CARTE[site.type];
  if (embleme === undefined) throw new RangeError(`carte : site sans emblème « ${site.type} »`);
  // ⚠ LE NUMÉRO N'EST POSÉ QUE SUR LES BASES DU JOUEUR, par `sitesDeLaFenetre`.
  // Un site qui n'en porte pas retombe sur le nom de la table — c'est le cas de
  // tout ce que l'Ouvrage tient, et de tout appelant qui monte un site à la
  // main. Le repli n'est donc pas une commodité : c'est le cas ORDINAIRE.
  return site.numeroBase === undefined ? embleme.nom : `Base n°${site.numeroBase}`;
}

/**
 * Les lignes de l'étiquette posée sous une case de la carte.
 *
 * ⚠⚠ ET LA BASE DU JOUEUR PORTE SON NUMÉRO ET SON NIVEAU DEPUIS LE LOT
 * CARTE-A — Ethan, 04/09 : « au lieu d'afficher "votre base" afficher Base n°x
 * niv x ». Le paragraphe ci-dessus disait qu'elle n'avait PAS de ligne de
 * niveau et que ce n'était pas un oubli ; c'est encore vrai de son niveau de
 * CARTE, qui n'existe pas, et c'est devenu faux du niveau de ses BÂTIMENTS, qui
 * est celui que l'emblème dessine déjà.
 *
 * ⚠ `niv` EN MINUSCULES, ET `Niveau` CAPITALISÉ POUR L'OUVRAGE : ce ne sont pas
 * la même grandeur, et deux mots identiques les feraient lire comme telles. Un
 * site de l'Ouvrage porte un niveau ENTIER de carte ; une base du joueur porte
 * une MOYENNE à une décimale.
 *
 * @param {{type: string, niveau: number|null, numeroBase?: number,
 *          niveauBatimentsDixiemes?: number}} site
 * @returns {Array<string>} une ou deux lignes, jamais vides
 */
export function lignesDeLEtiquette(site) {
  const lignes = [nomDuSite(site)];
  if (site.numeroBase !== undefined) {
    // ⚠ LA DÉCIMALE SE MONTRE TOUJOURS, ET LE FORMATAGE NE S'ÉCRIT PAS ICI :
    // `formaterDixiemes` de `ui/chantier.js` porte la règle depuis le 27/08 —
    // « 6,0 », jamais « 6 ». En écrire un second donnerait deux façons d'écrire
    // le même nombre, et la première divergence se lirait comme un bogue.
    if (site.niveauBatimentsDixiemes !== undefined && site.niveauBatimentsDixiemes !== null) {
      lignes.push(`niv ${formaterDixiemes(site.niveauBatimentsDixiemes)}`);
    }
    return lignes;
  }
  if (site.niveau !== null && site.niveau !== undefined) lignes.push(`Niveau ${site.niveau}`);
  return lignes;
}



/**
 * Le trait de la flèche qui va de la base halotée à la cible ouverte.
 *
 * ⚠⚠ ELLE VA D'UN CENTRE À L'AUTRE DEPUIS LE 06/09, ET C'EST UN RENVERSEMENT.
 * Ce paragraphe disait « elle s'arrête au bord des deux cases, pas à leur
 * centre », au motif qu'« un trait qui traverserait les deux emblèmes couperait
 * les seuls dessins qui disent ce qu'il y a là ». Ethan, 06/09 : « flèche de la
 * base à la cible : du centre de l'un au centre de l'autre ». Le retrait tombe,
 * et `RETRAIT_FLECHE` avec lui — il n'avait pas d'autre lecteur.
 *
 * ⚠⚠ ET LE MOTIF ÉCARTÉ DÉCRIT CE QUE ÇA COÛTE, MESURÉ ET NON SUPPOSÉ. Un
 * emblème occupe la case ENTIÈRE — `dessinerEmblemeDUneCase` rend
 * `cote: taille` —, et `dessiner` peint la flèche APRÈS les emblèmes, comme le
 * halo et les étiquettes : le trait passe donc PAR-DESSUS les deux, et masque le
 * centre de la base du joueur comme celui de la cible. C'est ce que la demande
 * implique ; l'ordre de dessin n'a pas été touché pour l'adoucir, et
 * `monde.test.js` le tient déjà de face.
 *
 * ⚠ ELLE REND `null` SI LES DEUX CASES SONT LA MÊME. Pas de flèche vers sa
 * propre base : elle n'aurait ni longueur ni sens, et `Math.atan2(0, 0)` rendrait
 * zéro sans le dire.
 *
 * @param {{rangee: number, colonne: number}} depuis
 * @param {{rangee: number, colonne: number}} vers
 * @param {number} ox
 * @param {number} oy
 * @param {number} pas
 * @returns {{x1: number, y1: number, x2: number, y2: number, angle: number}|null}
 */
export function traitDeLaFleche(depuis, vers, ox, oy, pas) {
  if (depuis.rangee === vers.rangee && depuis.colonne === vers.colonne) return null;
  const a = centreDeLaCase(depuis, ox, oy, pas);
  const b = centreDeLaCase(vers, ox, oy, pas);
  // ⚠⚠ ET LE `Math.sqrt` PART AVEC LE RETRAIT. Il normalisait le vecteur pour
  // reculer les deux bouts d'une fraction de case ; sans recul il n'y a plus
  // rien à normaliser, et l'angle se prend directement en `atan2`. `src/ui/`
  // était le dernier dossier de dessin à porter une racine :
  // `RACINES_DE_DESSIN_TOLEREES` de `transfert.test.js` tombe donc de UN à
  // ZÉRO, et l'interdiction devient totale sur les quatre dossiers.
  return {
    x1: a.x,
    y1: a.y,
    x2: b.x,
    y2: b.y,
    angle: Math.atan2(b.y - a.y, b.x - a.x),
  };
}

/**
 * Le même trait, rogné au bord du canevas.
 *
 * ⚠⚠ ETHAN, 06/09 : LA POINTE ÉTAIT HORS ÉCRAN. Quand la cible sort du cadre, la
 * flèche continuait jusqu'à elle : le joueur ne voyait qu'une BARRE NUE qui
 * traverse la carte sans rien désigner. Une flèche qui touche le bord dit « c'est
 * par là » ; une barre qui sort de l'écran ne dit rien.
 *
 * ⚠⚠ ET LE CAS EST LE CAS COURANT AU ZOOM MAXIMUM, MESURÉ. Une case y vaut
 * `ZOOM_CARTE.crans` au dernier cran — **256 pixels physiques** —, donc un
 * téléphone de 1 080 × 2 340 montre **4,2 × 9,1 cases**. La portée d'un raid est
 * de dix cases : deux sites attaquables ne tiennent PAS ensemble dans le cadre.
 *
 * ⚠⚠ LES DEUX BOUTS SONT ROGNÉS, PAS SEULEMENT L'ARRIVÉE — et le cas du DÉPART
 * hors champ est atteignable pour la même raison. Le joueur promène la carte
 * jusqu'à sa cible ; sa base, à dix cases de là, est alors hors du cadre. Un
 * rognage qui ne traiterait que l'arrivée laisserait le trait partir d'un point
 * imaginaire hors écran, ce qui est le défaut d'aujourd'hui vu par l'autre bout.
 *
 * ⚠⚠ L'ANGLE NE SE RECALCULE PAS : IL SE REPREND. `trait.angle` est celui du
 * segment ENTIER, et c'est lui qui porte la direction de la cible. Le refaire
 * depuis le segment rogné rendrait le même nombre aujourd'hui, par un chemin qui
 * peut diverger demain — un rognage qui rend un point sur un bord et un angle
 * calculé ailleurs est deux vérités pour une grandeur.
 *
 * ⚠ ET `traitDeLaFleche` NE BOUGE PAS D'UN CARACTÈRE. Elle rend le trait de
 * centre à centre — l'arbitrage du 06/09 —, et le rognage est une SECONDE
 * opération posée après elle. Sa garde « même case → `null` » est intacte.
 *
 * ⚠ UN TRAIT ENTIÈREMENT VISIBLE RESSORT IDENTIQUE, ET PAR IDENTITÉ D'OBJET :
 * `t0` et `t1` valent exactement 0 et 1, aucune arithmétique n'est faite, et le
 * cas courant ne paie donc pas un arrondi flottant pour rien.
 *
 * ⚠ ET S'IL EST ENTIÈREMENT DEHORS, ON REND `null`, jamais un segment de
 * longueur nulle : `dessinerFleche` peindrait une pointe sur un point qui ne
 * désigne rien.
 *
 * L'algorithme est Liang–Barsky : le segment est paramétré, chaque bord donne une
 * borne sur le paramètre, et l'intersection des quatre bornes est le morceau
 * visible. Il traite les deux bouts par construction.
 *
 * @param {{x1:number,y1:number,x2:number,y2:number,angle:number}|null} trait
 * @param {number} largeur du canevas, en pixels
 * @param {number} hauteur du canevas, en pixels
 * @returns {{x1:number,y1:number,x2:number,y2:number,angle:number}|null}
 */
export function traitRogne(trait, largeur, hauteur) {
  if (trait === null) return null;
  const dx = trait.x2 - trait.x1;
  const dy = trait.y2 - trait.y1;
  const p = [-dx, dx, -dy, dy];
  const q = [trait.x1, largeur - trait.x1, trait.y1, hauteur - trait.y1];
  let t0 = 0;
  let t1 = 1;
  for (let i = 0; i < 4; i += 1) {
    if (p[i] === 0) {
      // Parallèle à ce bord-là : ou bien on est du bon côté, ou bien rien n'est
      // visible — il n'y a aucune borne à en tirer.
      if (q[i] < 0) return null;
      continue;
    }
    const r = q[i] / p[i];
    if (p[i] < 0) {
      if (r > t1) return null;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return null;
      if (r < t1) t1 = r;
    }
  }
  if (t0 === 0 && t1 === 1) return trait;
  return {
    x1: trait.x1 + t0 * dx,
    y1: trait.y1 + t0 * dy,
    x2: trait.x1 + t1 * dx,
    y2: trait.y1 + t1 * dy,
    angle: trait.angle,
  };
}

/**
 * ⚠⚠ `RETRAIT_FLECHE` N'EXISTE TOUJOURS PAS, ET ELLE A FAILLI REVENIR LE 11/09.
 *
 * Elle valait `0,55` case au lot CARTE-A et reculait les deux bouts de la flèche
 * pour qu'elle ne couvre pas les emblèmes. Ethan l'a fait retirer le 06/09 — « du
 * centre de l'un au centre de l'autre » —, et ce bloc a porté depuis un
 * avertissement : la remettre serait défaire l'arbitrage.
 *
 * ⚠⚠ ELLE A ÉTÉ REMISE, PUIS RETIRÉE LE MÊME JOUR, ET LA LEÇON EST DANS LE
 * MALENTENDU. Trois flèches avaient été rendues à Ethan sur le vrai fond de
 * carte ; il a répondu « flèche A », et la variante A reculait ses bouts EN PLUS
 * de changer sa pointe. J'en ai conclu qu'il choisissait les deux. Il a corrigé :
 * « flèches de centre à centre. Mon problème c'était le bout de la flèche qui
 * était moche. » Un choix fait sur une image porte sur CE QUE L'IMAGE MONTRE, pas
 * sur la liste des changements qui l'ont produite : quand une variante mêle deux
 * modifications, il faut demander laquelle emporte l'adhésion, ou n'en montrer
 * qu'une par image.
 *
 * ⚠ CE QUI RESTE DU LOT, DONC : la POINTE, et elle seule — `EPAISSEUR_FLECHE`,
 * `AILE_FLECHE` et `OUVERTURE_FLECHE` ci-dessous. Les deux bouts sont aux centres
 * des deux cases, comme le 06/09 l'a tranché, et `CARTE-B T3` le garde.
 */

/**
 * L'épaisseur de la hampe, en parts de case.
 *
 * ⚠⚠ 0,04, ET C'EST LE NOMBRE QU'ETHAN A CHOISI SUR PIÈCE — 11/09 : « trait
 * légèrement + épais » que la variante A rendue à 0,03. Trois épaisseurs lui ont
 * été rendues sur le même fond, 6, 8 et 10 pixels à 200 px par case ; il a pris
 * celle du milieu.
 *
 * ⚠ ELLE N'EST PLUS `EPAISSEUR_HALO`. La flèche la partageait avec le halo et
 * les cases du déplacement, soit 0,08 : à 200 px par case, une hampe de 16 px
 * pour une pointe de 48 px de large — la pointe ne dépassait que de 14 px de
 * chaque côté, et Ethan l'a dite « toujours moche » trois lots de suite. Un
 * halo est un CADRE, une flèche est un TRAIT : rien n'exigeait qu'ils aient la
 * même graisse, et les confondre a coûté trois allers-retours.
 */
export const EPAISSEUR_FLECHE = 0.04;

/** L'aile de la pointe, en parts de case, et son demi-angle. */
export const AILE_FLECHE = 0.34;
export const OUVERTURE_FLECHE = Math.PI / 6;

/**
 * Tout ce qu'il faut peindre pour une flèche, en pixels de canevas — SANS DOM.
 *
 * ⚠⚠ ELLE EST PURE, ET C'EST LE SEUL MOYEN DE TENIR LES PROPORTIONS. Le dépôt
 * n'a ni navigateur ni jsdom : une géométrie écrite dans la boucle de dessin ne
 * se vérifie que sur appareil, c'est-à-dire à l'œil, c'est-à-dire pas. Ce qui se
 * garde ici est le rapport entre la pointe et la hampe — le défaut d'hier était
 * un rapport, pas une couleur.
 *
 * ⚠⚠ LES DEUX BOUTS SONT AUX CENTRES DES DEUX CASES, et c'est l'arbitrage du
 * 06/09 qu'on ne touche pas : `traitDeLaFleche` rend le trait de centre à
 * centre, cette fonction ne le raccourcit PAS. Elle ne fait que deux choses —
 * l'épaisseur de la hampe, et la pointe.
 *
 * ⚠ LA HAMPE S'ARRÊTE À LA BASE DE LA POINTE, ce qui n'est pas un retrait mais un
 * recouvrement évité : un trait qui irait jusqu'à la tête ressortirait par elle
 * au premier angle obtus d'antialiasing. Elle peut donc être `null` sans que la
 * pointe le soit, quand la pointe est plus longue que le trait — une pointe seule
 * désigne encore ; un trait sans pointe ne désignerait rien, et c'est ce cas-là
 * qui n'existe pas.
 *
 * @param {{x1:number,y1:number,x2:number,y2:number,angle:number}|null} trait de
 *   centre à centre, tel que `traitDeLaFleche` le rend
 * @param {number} pas pixels de canevas par case
 * @returns {{hampe: {x1:number,y1:number,x2:number,y2:number}|null,
 *   epaisseur: number, pointe: Array<{x:number,y:number}>,
 *   bouton: {x:number,y:number,rayon:number}|null}|null}
 */
export function geometrieDeLaFleche(trait, pas) {
  if (trait === null) return null;
  if (!Number.isFinite(pas) || pas <= 0) {
    throw new RangeError(`geometrieDeLaFleche : pas « ${pas} » — nombre > 0 attendu`);
  }
  const dx = trait.x2 - trait.x1;
  const dy = trait.y2 - trait.y1;
  const longueur = Math.hypot(dx, dy);
  if (longueur === 0) return null;
  const cos = dx / longueur;
  const sin = dy / longueur;
  const depart = { x: trait.x1, y: trait.y1 };
  const bout = { x: trait.x2, y: trait.y2 };
  const epaisseur = Math.max(1, Math.round(pas * EPAISSEUR_FLECHE));
  const aile = Math.max(3, pas * AILE_FLECHE);
  // La hampe s'arrête à la BASE de la pointe, pas à sa tête : sans ça, le trait
  // ressortirait par la pointe au premier angle obtus d'antialiasing.
  const restant = Math.hypot(bout.x - depart.x, bout.y - depart.y)
    - aile * Math.cos(OUVERTURE_FLECHE);
  const hampe = restant <= epaisseur ? null : {
    x1: depart.x,
    y1: depart.y,
    x2: bout.x - aile * Math.cos(OUVERTURE_FLECHE) * cos,
    y2: bout.y - aile * Math.cos(OUVERTURE_FLECHE) * sin,
  };
  return {
    hampe,
    epaisseur,
    // ⚠ LE BOUT ARRONDI EST UN DISQUE, PAS UN `lineCap`. `ctx.lineCap` est un
    // état du contexte : le poser ici obligerait à le rendre, et un contexte
    // rendu à moitié est la faute que `dessinerEtiquette` a déjà payée.
    bouton: hampe === null ? null : { x: depart.x, y: depart.y, rayon: epaisseur / 2 },
    pointe: [
      bout,
      {
        x: bout.x - aile * Math.cos(trait.angle - OUVERTURE_FLECHE),
        y: bout.y - aile * Math.sin(trait.angle - OUVERTURE_FLECHE),
      },
      {
        x: bout.x - aile * Math.cos(trait.angle + OUVERTURE_FLECHE),
        y: bout.y - aile * Math.sin(trait.angle + OUVERTURE_FLECHE),
      },
    ],
  };
}

/**
 * La couleur du trait de frontière de chaque camp.
 *
 * ⚠⚠ ELLES REPRENNENT LA SÉMANTIQUE DÉJÀ POSÉE PAR `EMBLEMES_CARTE`, elles n'en
 * inventent pas une seconde. L'os `#F5F3E8` y borde la base du joueur ; le rouge
 * `#E43E32` y borde EXACTEMENT ce qui attaque le joueur — « le bord rouge est
 * réservé à ce qui attaque le joueur », dit la table, et un test croise déjà cet
 * ensemble avec `attaqueLeJoueur`. Le territoire de l'Ouvrage est précisément
 * l'emprise de ces bases-là : lui donner une troisième couleur apprendrait au
 * joueur un second code pour la même chose.
 *
 * ⚠ LES DEUX SONT DANS LA PALETTE FERMÉE de `FICHE-STYLE.md` — la garde de
 * `banc.test.js` balaie ce fichier et refuse toute teinte hors des trente-trois.
 */
export const TEINTES_TERRITOIRE = {
  [JOUEUR]: '#F5F3E8',
  [OUVRAGE]: '#E43E32',
};

/**
 * ⚠⚠ `epaisseurDeFrontiere` A ÉTÉ RETIRÉE AU LOT TERRITOIRE (03/09), ET SON
 * TEST AVEC — c'est une assertion en moins, et elle se déclare.
 *
 * Elle donnait l'épaisseur, en pixels, du trait de frontière tracé au
 * `strokeStyle` depuis le 31/08 : `max(1, round(cran / 16))`. Depuis que la
 * frontière est faite de SPRITES, il n'y a plus de trait, donc plus d'épaisseur
 * à faire suivre le cran — un dessin de limite est posé à la taille de la case,
 * et son épaisseur est celle que le dessin porte. Aucun appelant de production
 * ne la lisait plus : seul son propre test l'atteignait encore, ce qui est la
 * définition d'une fonction morte.
 *
 * ⚠ `TEINTES_TERRITOIRE` RESTE, ELLE. Le halo de la base attaquante et la flèche
 * du raid s'en servent toujours, et leur test aussi — c'est l'ÉPAISSEUR que la
 * flèche a cessé de partager le 11/09, pas la teinte.
 */


/**
 * La teinte qu'on peint tant qu'une dalle manque.
 *
 * ⚠⚠ ELLE NE PREND PLUS LA RANGÉE, ET C'EST LA DEMANDE D'ETHAN DU 05/09 — « pas
 * de fond ouvrage pour le moment ». Elle rendait l'ardoise en haut de la carte
 * et la terre cuite en bas, parce que le sol basculait de camp à mesure qu'on
 * montait ; il n'y a plus qu'un sol, donc plus qu'une attente.
 *
 * ⚠ ET C'EST LE MILIEU DE LA RAMPE DÉCLARÉE, PAS UNE COULEUR INVENTÉE. Mesuré
 * sur les huit planches livrées : leur moyenne RVB vaut `[198,6 · 144,5 ·
 * 124,8]` quand ce ton-ci vaut `[207 · 154 · 131]` — huit à dix niveaux
 * d'écart, sur un aplat qu'on ne voit qu'une image ou deux. Écrire la moyenne
 * exacte aurait fait entrer une trente-quatrième teinte dans un dépôt dont la
 * palette est fermée, pour un gain que personne ne peut voir.
 */
export function teinteDAttente() {
  return TERRAIN_CARTE.rampes.joueur[2];
}

// ---------------------------------------------------------------------------
// Le câblage au DOM
// ---------------------------------------------------------------------------

/**
 * Câble l'écran Monde dans une page qui porte son balisage.
 *
 * @param {Document} doc
 * @returns {{peindre: Function, rafraichir: Function}}
 */
/**
 * Ce qui, dans l'état, oblige la carte à se redessiner.
 *
 * ⚠⚠ ELLE ÉTAIT ÉCRITE DEUX FOIS — dans `peindre` et dans `rafraichir` — ET LES
 * DEUX AVAIENT DIVERGÉ. Elles lisaient `satellites.prochaineInstance`, qui a
 * quitté la base pour l'état au lot BASES-1 : l'empreinte valait donc
 * « N:undefined », si bien qu'un camp DÉTRUIT puis REMPLACÉ au même compte
 * laissait la carte figée sur l'ancien.
 *
 * ⚠ ELLE PORTE `baseCourante`, ET C'EST CE QUI FAIT SUIVRE LE HALO. Sans lui,
 * basculer ne redessinerait rien — la liste des satellites n'ayant pas bougé.
 *
 * ⚠ ET TOUTES LES BASES, pas seulement la courante : les camps d'une autre base
 * paraissent et disparaissent sur la même carte.
 *
 * ⚠⚠ ELLE PORTE LES RUINES ACTIVES DEPUIS LE LOT CONQUÊTE-24H, ET C'EST LE PIÈGE
 * LE PLUS DISCRET DU LOT — le §8 du brief le nomme comme tel. Une ruine est le
 * PREMIER élément de la carte qui change TOUT SEUL, sans que le joueur ait rien
 * fait : au bout de vingt-quatre heures elle cesse d'émettre et la frontière se
 * déplace. Sans cette ligne, l'empreinte serait restée identique — même base
 * courante, mêmes satellites — et `rafraichir` aurait renvoyé sans redessiner :
 * la carte serait restée juste au chargement et fausse une heure plus tard,
 * jusqu'au prochain mouvement du joueur.
 *
 * ⚠ LES CASES, PAS LE COMPTE. Une ruine qui expirerait le tick où une autre
 * naîtrait laisserait le compte inchangé ; leurs cases, non.
 *
 * ⚠⚠ ELLE EST SORTIE DE LA FERMETURE POUR ÊTRE MESURABLE, ET C'EST TOUT CE QUI
 * A BOUGÉ D'ELLE. Elle ne lit que l'état — aucun canevas, aucun DOM —, et le
 * dépôt ne sait pas monter `creerEcranMonde` (CLAUDE.md §3) : enfermée, le piège
 * du §8 n'aurait été gardé par rien d'autre qu'une relecture. `C24 T17` la
 * confronte à une ruine qui expire.
 *
 * @param {object} etat
 * @returns {string}
 */
/**
 * Ce que la confirmation d'un déplacement annonce, pour un compte donné.
 *
 * ⚠⚠ ZÉRO EST UNE INFORMATION, PAS UNE LIGNE À MASQUER. « Aucune base ne pourra
 * vous attaquer » est souvent le renseignement exact que le joueur cherche en
 * fuyant ; taire la ligne le laisserait croire que le chiffre n'a pas pu être
 * calculé. Ethan, 07/09, point 1.
 *
 * ⚠ ELLE EST PURE ET EXPORTÉE parce que c'est la seule façon d'éprouver le
 * libellé sans monter l'écran, et parce qu'elle n'a rien à savoir de l'état :
 * le COMPTE vient du moteur, elle n'en fait qu'une phrase.
 *
 * ⚠ « POURRONT », PAS « SONT À PORTÉE ». Les deux ensembles ne coïncident pas —
 * la portée d'attaque du joueur et celle de l'Ouvrage sont la même distance,
 * mais toutes les bases de l'Ouvrage n'attaquent pas : il y faut le type ET le
 * niveau minimal. C'est ce qu'Ethan a tranché en précisant « qui pourront
 * attaquer ».
 *
 * @param {number} nombre
 * @returns {string}
 */
export function phraseDesAttaquantes(nombre) {
  if (!Number.isInteger(nombre) || nombre < 0) {
    throw new RangeError(`monde : « ${nombre} » attaquantes — entier ≥ 0 attendu`);
  }
  if (nombre === 0) return 'Aucune base de l\'Ouvrage ne pourra vous attaquer ici.';
  if (nombre === 1) return '1 base de l\'Ouvrage pourra vous attaquer ici.';
  return `${nombre} bases de l'Ouvrage pourront vous attaquer ici.`;
}

/**
 * Le rayon dont on dilate la fenêtre d'un bilan de territoire.
 *
 * ⚠⚠ IL SE LIT DANS `RAYONS`, ET C'EST LE PLUS GRAND DES DEUX. Déplacer la base
 * ne change QUE la contribution du joueur : en toute rigueur, seules les cases à
 * `RAYONS[JOUEUR]` de l'ancienne ou de la nouvelle position peuvent changer de
 * camp, et dilater de deux suffirait. On prend le plus grand parce que c'est un
 * SUR-ensemble — compter une case qui ne peut pas changer coûte une comparaison
 * et ne fausse rien — et parce qu'il reste juste le jour où les deux rayons
 * s'échangeraient. Le sous-estimer, lui, rendrait un bilan plausible et faux :
 * c'est très exactement ce que `PC T2` mesure.
 *
 * ⚠ IL NE SE RECOPIE PAS DEPUIS `GEOGRAPHIE`. `RAYONS` est déjà la lecture que
 * `sim/territoire.js` fait de la table, et c'est elle que le partage emploie ;
 * en écrire une seconde ici ferait la divergence que §4 de `CLAUDE.md` interdit.
 */
export const RAYON_DU_BILAN = Math.max(...Object.values(RAYONS));

/**
 * La fenêtre sur laquelle un bilan de territoire se compte : les deux positions,
 * dilatées du plus grand rayon d'influence.
 *
 * ⚠⚠ ELLE N'EST PAS CELLE QUI EST À L'ÉCRAN, ET C'EST TOUT LE PIÈGE.
 * `territoireDeLaFenetre` dilate déjà d'elle-même pour aller chercher les
 * ÉMETTEURS hors champ — chaque case qu'elle rend est donc juste quelle que soit
 * la fenêtre demandée —, mais elle ne peut pas deviner quelle zone on veut
 * COMPTER. Une fenêtre bornée à la vue amputerait le bilan dès que l'ancienne
 * position sort du cadre, ce qui est le cas COURANT : on se déplace vers ce
 * qu'on regarde, donc l'endroit d'où l'on part est souvent derrière soi.
 *
 * ⚠ ELLE NE SE ROGNE PAS SUR LA CARTE. `territoireDeLaFenetre` le fait déjà, et
 * le refaire ici serait une seconde écriture du même clamp — donc la première à
 * mentir le jour où la carte changerait de taille.
 *
 * @param {{rangee: number, colonne: number}} depuis
 * @param {{rangee: number, colonne: number}} vers
 */
export function fenetreDuBilan(depuis, vers) {
  const r = RAYON_DU_BILAN;
  return {
    premiereRangee: Math.min(depuis.rangee, vers.rangee) - r,
    derniereRangee: Math.max(depuis.rangee, vers.rangee) + r,
    premiereColonne: Math.min(depuis.colonne, vers.colonne) - r,
    derniereColonne: Math.max(depuis.colonne, vers.colonne) + r,
  };
}

/**
 * Ce qu'un déplacement ferait au territoire : cases gagnées, perdues, et solde.
 *
 * ⚠⚠ AUCUNE FORMULE D'INFLUENCE N'EST ÉCRITE ICI, ET C'EST LA CONDITION DU LOT.
 * `sim/territoire.js` porte la seule qui existe — `raison ^ (niveau − distance)`,
 * sommée par camp — et le dépôt a déjà refermé six divergences de ce genre :
 * l'en-tête de `sim/poi.js` en tient le compte, et la sixième a été CRÉÉE par un
 * lot qui avait recopié la règle plutôt que de l'appeler. On simule donc en
 * appelant LA FONCTION QUI PEINT LA CARTE sur un état hypothétique, deux fois,
 * sur la même fenêtre.
 *
 * ⚠⚠ L'HYPOTHÈSE EST UNE COPIE DE SURFACE, ET ELLE NE TOUCHE JAMAIS L'ÉTAT RÉEL.
 * Un `structuredClone` copierait la disposition, la garnison et l'armée de
 * chaque base pour ne changer qu'un couple d'entiers ; ce qui est nécessaire et
 * suffisant, c'est que `etat.bases[k].position` diffère et que rien d'autre ne
 * soit écrit. `territoireDeLaFenetre` ne fait que LIRE — `PC T1` s'en assure en
 * comparant l'état sérialisé avant et après.
 *
 * ⚠ LES DEUX APPELS PORTENT LA MÊME FENÊTRE, DONC LA MÊME GÉOMÉTRIE. `occupant`
 * est indexé sur `(r0, c0)`, tous deux dérivés de la seule fenêtre et des bornes
 * de la carte : deux appels sur la même fenêtre rendent deux tableaux de même
 * longueur, case pour case. La garde ci-dessous n'est pas décorative pour
 * autant — c'est elle qui ferait tomber un lot qui déplacerait le clamp.
 *
 * ⚠ ET C'EST LA BASE COURANTE QUI BOUGE, jamais un indice qu'on choisirait ici :
 * `deplacerLaBase` écrit `baseCourante(etat).position`, et un bilan qui
 * simulerait le déplacement d'une AUTRE base annoncerait un solde qu'aucun geste
 * ne produirait.
 *
 * @param {object} etat
 * @param {{rangee: number, colonne: number}} cible
 * @returns {{gagnees: number, perdues: number, solde: number}}
 */
export function bilanDuTerritoire(etat, cible) {
  const depuis = baseCourante(etat).position;
  const fenetre = fenetreDuBilan(depuis, cible);
  const hypothese = {
    ...etat,
    bases: etat.bases.map((b, k) => (
      k === etat.baseCourante ? { ...b, position: { rangee: cible.rangee, colonne: cible.colonne } } : b
    )),
  };
  const avant = territoireDeLaFenetre(etat, fenetre).occupant;
  const apres = territoireDeLaFenetre(hypothese, fenetre).occupant;
  if (avant.length !== apres.length) {
    throw new Error('monde : les deux cartes du bilan n\'ont pas la même fenêtre');
  }
  let gagnees = 0;
  let perdues = 0;
  for (let i = 0; i < avant.length; i += 1) {
    if (avant[i] === apres[i]) continue;
    if (apres[i] === JOUEUR) gagnees += 1;
    else if (avant[i] === JOUEUR) perdues += 1;
  }
  return { gagnees, perdues, solde: gagnees - perdues };
}

/**
 * Les trois lignes du bilan, à la forme du panneau.
 *
 * ⚠ TROIS NOMBRES, ET RIEN D'AUTRE — §2.3 du brief. Pas de POI annoncés, pas de
 * conseil : le panneau dit ce qu'il SAIT, et il ne sait que ça. C'est la règle
 * que l'en-tête de ce fichier porte depuis le 27/08.
 *
 * ⚠ LE SOLDE PORTE SON SIGNE QUAND IL EST POSITIF. « 4 » et « +4 » disent la
 * même chose, mais la colonne se lit à côté de « perdues » : sans le signe, un
 * solde et un compte se ressemblent trop.
 *
 * ⚠ ET ELLE REND LA MÊME FORME QUE `lignesDuSite` — `{ quoi, valeur }` —, donc
 * `ouvrirPanneau` et `demanderLeDeplacement` peignent par le même chemin. Deux
 * formes de ligne dans le même panneau seraient deux façons de le styler.
 */
/**
 * Les deux lignes d'attente d'un déplacement : ce qu'il facture, et combien de
 * temps la base restera clouée.
 *
 * ⚠⚠ RIEN N'EST CALCULÉ ICI — point 6, 10/09. Les deux nombres viennent de
 * `delaiDuDeplacementVers`, qui est la MÊME fonction que `deplacerLaBase`
 * appelle pour écrire `dernierDeplacementDelaiTicks` : le nombre annoncé est le
 * nombre facturé, par construction et non par vérification. Et la phrase vient
 * d'`enDuree` de `sim/deplacement.js`, celle qui écrit déjà le refus `delai` —
 * la reformuler ici donnerait deux façons de dire la même attente.
 *
 * ⚠ LA DISTANCE EST AFFICHÉE PARCE QU'ELLE EST FACTURÉE. Le barème est
 * `600 + max(0, plafond − 600) × distance / portéeMax` : sans elle, le joueur
 * lirait un délai sans savoir ce qui le fait monter — et il ne pourrait pas
 * voir qu'une case plus près coûte moins.
 *
 * @param {{distance: number, ticks: number}} attente
 * @returns {Array<{quoi: string, valeur: string}>}
 */
export function lignesDeLAttente(attente) {
  return [
    { quoi: 'Distance', valeur: `${attente.distance} case${attente.distance > 1 ? 's' : ''}` },
    { quoi: 'Immobilisée', valeur: enDuree(attente.ticks) },
  ];
}

export function lignesDuBilan(bilan) {
  return [
    { quoi: 'Cases gagnées', valeur: String(bilan.gagnees) },
    { quoi: 'Cases perdues', valeur: String(bilan.perdues) },
    { quoi: 'Solde', valeur: bilan.solde > 0 ? `+${bilan.solde}` : String(bilan.solde) },
  ];
}

/**
 * L'ensemble des gisements déjà acquis, sous la forme « type:bande ».
 *
 * ⚠⚠ ON COMPARE DES IDENTITÉS, JAMAIS DES LONGUEURS — §3.1 du brief.
 * `releverLesPoisAcquis` RETRIE la liste à chaque ajout : deux listes de même
 * longueur peuvent ne pas porter les mêmes gisements, et une comparaison de
 * comptes marcherait par hasard aujourd'hui. Un POI pris est pris pour toujours
 * — Ethan, 07/09 —, donc l'ensemble ne peut que croître ; mais c'est une
 * propriété de la RÈGLE, pas du code d'affichage, et l'écran ne doit pas s'y
 * adosser.
 *
 * ⚠ LA CLÉ EST LE COUPLE, PAS LE TYPE. Un même gisement existe dans les dix
 * bandes de la carte : `poiEstAcquis` compare déjà les deux champs, et n'en
 * comparer qu'un ferait taire les neuf suivants.
 */
export function clesDesPoisAcquis(poisAcquis) {
  const cles = new Set();
  for (const acquis of poisAcquis ?? []) cles.add(cleDuPoi(acquis));
  return cles;
}

/**
 * La clé d'un gisement — son TYPE et sa BANDE, jamais sa position.
 *
 * ⚠⚠ ELLE S'ÉCRIT ICI ET NULLE PART AILLEURS — lot ARRIVÉE-CARTE-ET-BUILD,
 * 10/09. `clesDesPoisAcquis` la composait dans son corps ; depuis que
 * `vueDesPois` reçoit une SÉLECTION faite de ces clés-là, deux endroits auraient
 * eu à s'accorder sur un séparateur. Ils s'accorderaient jusqu'au jour où l'un
 * des deux changerait, et la sélection ne retiendrait plus rien — **en silence**,
 * puisqu'un filtre qui ne retient rien rend une liste vide et pas une erreur.
 *
 * ⚠ TYPE ET BANDE, ET C'EST LA MÊME PAIRE QUE `poiEstAcquis` COMPARE. Un
 * gisement acquis l'est pour toujours et pour toute la bande : sa position ne
 * fait pas partie de son identité.
 *
 * @param {{type: string, bande: number}} poi
 * @returns {string}
 */
export function cleDuPoi(poi) {
  return `${poi.type}:${poi.bande}`;
}

/**
 * Ce que le toast annonce pour un nombre de gisements pris d'un coup.
 *
 * ⚠ UN SEUL TOAST, QUI DIT LE NOMBRE — §3.1 du brief. Plusieurs POI peuvent
 * tomber dans le même tick : c'est même le cas COURANT après un déplacement, la
 * base arrivant d'un coup au-dessus de tout un octogone neuf. Trois messages à
 * la file sur un téléphone, c'est deux de trop.
 *
 * ⚠ ET IL NE NOMME PAS LE GISEMENT. Nommer « la veine de quartz » demanderait
 * d'accorder le participe au genre du nom, et recomposer une phrase française
 * morceau par morceau a déjà produit « aucun unité » puis « aucune unité n'est
 * endommagé », en deux essais, au lot RETOURS-ETHAN. Le compte se dit sans
 * accord.
 *
 * ⚠ ELLE EST PURE ET EXPORTÉE, comme `phraseDesAttaquantes` et pour la même
 * raison : c'est la seule façon d'éprouver un libellé sans monter l'écran.
 */
export function phraseDesPoisAcquis(nombre) {
  if (!Number.isInteger(nombre) || nombre < 1) {
    throw new RangeError(`monde : « ${nombre} » gisements — entier ≥ 1 attendu`);
  }
  return nombre === 1 ? 'Gisement acquis.' : `${nombre} gisements acquis.`;
}

/**
 * Les soixante-dix gisements de la carte, dits un par un.
 *
 * ⚠⚠ ETHAN, 10/09, POINT 11 : « rajouter un petit bouton pour voir les POI
 * acquis. Et non acquis avec coordonnées ». Le joueur savait qu'il en avait pris
 * un — un message le disait, quatre secondes — et n'avait aucun moyen de savoir
 * lesquels, ni où sont les autres. La carte en porte sept types dans dix bandes,
 * et rien à l'écran ne les énumérait.
 *
 * ⚠⚠ ELLE LIT `sim/poi.js`, ELLE NE LE RÉÉCRIT PAS. La liste vient de
 * `carteDesPoi`, l'acquisition de `poiEstAcquis` — celle-là même que le moteur
 * emploie, et qui compare le TYPE **et** la BANDE. Recompter ici « ce type est
 * dans `poisAcquis` » marcherait par accident sur une graine et se tromperait de
 * neuf bandes sur dix.
 *
 * ⚠⚠ ET L'ORDRE NE SE RECALCULE PAS NON PLUS. `tirerLesPoi` pose ses soixante-dix
 * bande par bande, puis type par type dans l'ordre de la table `POI` — c'est
 * exactement le `rang` que `releverLesPoisAcquis` emploie à l'écriture. Trier ici
 * serait écrire une seconde fois un ordre qui existe, et deux ouvertures du
 * panneau pourraient rendre deux listes.
 *
 * ⚠ ELLE EST PURE ET EXPORTÉE, comme `phraseDesPoisAcquis` et `lignesDuBilan` :
 * le dépôt n'a pas de navigateur, donc ce qui peut être éprouvé sans écran doit
 * l'être.
 *
 * ⚠ ET LA COORDONNÉE SE DIT « rangée · colonne », l'ordre de tout le dépôt.
 * `lignesDuSite` écrit déjà la position d'un site dans cette forme-là ; en
 * inventer une seconde ferait lire deux grammaires sur le même écran.
 *
 * ⚠⚠ ET ELLE PREND UNE SÉLECTION DEPUIS LE LOT ARRIVÉE-CARTE-ET-BUILD — Ethan,
 * 10/09, à « le pop-up s'ouvre sur soixante-dix lignes, une acquisition annonce
 * donc la carte entière — le filtrer ? » : **« Oui »**. Les DEUX chemins qui
 * ouvrent ce panneau cessent de dire la même chose :
 *
 * - l'**ACQUISITION** passe l'ensemble des clés qui viennent d'entrer, et la vue
 *   n'annonce que celles-là — le joueur veut savoir ce qu'il vient de prendre,
 *   et rien d'autre ;
 * - le **BOUTON** passe `null` et garde les soixante-dix : là, il demande l'état
 *   des lieux.
 *
 * ⚠⚠ LA SÉLECTION EST UN ENSEMBLE DE CLÉS, PAS UNE LISTE DE GISEMENTS, et c'est
 * ce qui la rend juste. `poisConnus` — la mémoire de session qui porte la
 * différence entre deux relevés — EST déjà un `Set` de ces clés-là : lui faire
 * traverser une seconde forme serait une conversion de plus à tenir d'accord.
 *
 * ⚠⚠ ET FILTRER N'EST PAS L'OCCASION DE RETRIER. L'ordre reste celui de
 * `tirerLesPoi`, parce qu'on filtre la liste ENTIÈRE au lieu de parcourir la
 * sélection : parcourir la sélection rendrait l'ordre d'insertion d'un `Set`,
 * donc l'ordre où les gisements sont ENTRÉS, et deux ouvertures du panneau
 * pourraient rendre deux ordres. `AC T5` compare l'ordre, pas seulement la
 * longueur.
 *
 * ⚠ LE TITRE DIT TOUJOURS L'ÉTAT DES LIEUX, dans les deux cas — c'est le
 * dénominateur que le joueur veut voir en prenant un gisement. Ce qui change,
 * c'est ce que l'appelant met DEVANT : `ouvrirLesPois` préfixe la nouvelle.
 *
 * ⚠ ET UN GISEMENT DE LA SÉLECTION DIT SA COORDONNÉE, PAS « Acquis ». Il vient
 * d'être pris — l'annoncer « acquis » serait redire le titre, quand ce que le
 * joueur cherche est OÙ.
 *
 * @param {number} graine
 * @param {Array<{type: string, bande: number}>} poisAcquis
 * @param {Set<string> | null} selection les clés à retenir, ou `null` pour tout
 * @returns {{titre: string, lignes: Array<object>}} la forme de `peindreLesLignes`
 */
export function vueDesPois(graine, poisAcquis, selection = null) {
  const liste = carteDesPoi(graine).liste;
  const acquis = liste.filter((poi) => poiEstAcquis(poisAcquis, poi));
  const retenus = selection === null
    ? liste
    : liste.filter((poi) => selection.has(cleDuPoi(poi)));
  return {
    titre: `Gisements — ${acquis.length} / ${liste.length}`,
    lignes: retenus.map((poi) => ({
      // ⚠ LE NOM VIENT DE `POI`, il ne se recompose pas — c'est la table qui fait
      // foi sur les libellés, et `EMBLEMES_CARTE` l'y lit déjà pour l'étiquette.
      quoi: `${POI[poi.type].nom} · bande ${poi.bande}`,
      valeur: selection === null && poiEstAcquis(poisAcquis, poi)
        ? 'Acquis'
        : `${poi.rangee} · ${poi.colonne}`,
    })),
  };
}

/**
 * La ruine ENCORE ACTIVE d'une case, ou `null`.
 *
 * ⚠⚠ ELLE PASSE PAR `ruinesActives`, ET C'EST LA SEULE PORTE. Son commentaire le
 * dit de face : « toute lecture qui compterait une ruine sans passer par ici
 * compterait des périmées ». Lire `etat.basesRasees` depuis l'écran aurait ouvert
 * une ruine expirée — juste au chargement, fausse une heure plus tard, et
 * personne pour le voir.
 *
 * @param {object} etat
 * @param {number} rangee
 * @param {number} colonne
 */
export function ruineDeLaCase(etat, rangee, colonne) {
  for (const ruine of ruinesActives(etat)) {
    if (ruine.rangee === rangee && ruine.colonne === colonne) return ruine;
  }
  return null;
}

/**
 * Le titre du panneau d'une ruine.
 *
 * ⚠ LE NOM DE CE QUI EST TOMBÉ VIENT D'`EMBLEMES_CARTE`, comme celui d'un site.
 * `spriteDeLaRuine` n'accepte que `base` et `baseJoueur` — un camp ou un
 * avant-poste RESPAWNE et ne laisse rien —, donc les deux clés existent dans la
 * table ; un type hors table LÈVE plutôt que d'écrire un titre vide.
 */
export function nomDeLaRuine(ruine) {
  const embleme = EMBLEMES_CARTE[ruine.type];
  if (embleme === undefined) throw new Error(`monde : type de ruine inconnu « ${ruine.type} »`);
  return `Ruine — ${embleme.nom}`;
}

/**
 * À qui va le TERRAIN d'une ruine, en toutes lettres.
 *
 * ⚠⚠ LA CARCASSE EST AU VAINCU, LE TERRAIN AU VAINQUEUR, ET UN PANNEAU QUI LES
 * CONFONDRAIT MENTIRAIT À L'ÉCRAN. `dessinerRuines` le dit déjà pour le dessin :
 * une base de l'Ouvrage rasée par le joueur montre une carcasse d'OUVRAGE tout
 * en peignant du territoire JOUEUR autour d'elle. Le titre porte donc le `type`
 * — ce qui est tombé — et cette ligne-ci le `vainqueur` — qui tient le terrain.
 *
 * ⚠ UN CAMP HORS TABLE LÈVE. `NEUTRE` n'est pas un vainqueur : une ruine qui n'a
 * pas de camp n'aurait rien à revendiquer, et `revendique` la refuse en amont.
 */
export const NOM_DU_VAINQUEUR = {
  [JOUEUR]: 'Vous',
  [OUVRAGE]: 'L\'Ouvrage',
};

/**
 * Les lignes du panneau d'une ruine — en LECTURE SEULE.
 *
 * ⚠⚠ CE QU'ETHAN NOMME EN PREMIER EST LE NIVEAU, et c'est celui de la base
 * TOMBÉE, pas celui du vainqueur : `ruineFraiche` le dit en toutes lettres, et
 * c'est ce qui fait qu'abattre une grosse base vaut mieux que d'en abattre deux
 * petites.
 *
 * ⚠⚠ ET LE TEMPS RESTANT SE DÉRIVE DE `TICKS_DE_RUINE`, JAMAIS D'UNE CONSTANTE
 * RÉÉCRITE. Vingt-quatre heures est un arbitrage qui vit dans `src/data/` et que
 * `sim/ruines.js` convertit ; en retaper la valeur ici ferait la seconde vérité
 * que §4 de `CLAUDE.md` interdit, et l'écran annoncerait un compte à rebours que
 * la carte ne suivrait pas.
 *
 * ⚠ `direLaDuree` ARRONDIT VERS LE HAUT par défaut, et c'est le bon sens ici :
 * un compte à rebours annoncé plus court que la vérité ferait croire la ruine
 * partie alors qu'elle tient encore. C'est le même arrondi que les quatre
 * messages de refus qui l'appellent déjà.
 *
 * @param {{type: string, niveau: number, vainqueur: number, tick: number}} ruine
 * @param {number} nbTicks `etat.horloge.nbTicks`
 */
export function resteDeLaRuine(ruine, nbTicks) {
  const reste = TICKS_DE_RUINE - (nbTicks - ruine.tick);
  // ⚠ LE PLANCHER À ZÉRO N'EST PAS DÉCORATIF. `ruineEstActive` a le bord franc et
  // fermé en haut, donc une ruine active porte toujours un reste strictement
  // positif ; mais l'écran rafraîchit dix fois par seconde et le panneau se ferme
  // au tour suivant, si bien qu'une durée NÉGATIVE pourrait s'afficher pendant un
  // dixième de seconde. `PC T10` exige qu'aucune ne le soit jamais.
  return direLaDuree(Math.max(0, reste));
}

export function lignesDeLaRuine(ruine, nbTicks) {
  const vainqueur = NOM_DU_VAINQUEUR[ruine.vainqueur];
  if (vainqueur === undefined) {
    throw new Error(`monde : vainqueur inconnu « ${ruine.vainqueur} » sur une ruine`);
  }
  return [
    { quoi: 'Niveau', valeur: String(ruine.niveau) },
    { quoi: 'Terrain tenu par', valeur: vainqueur },
    { quoi: 'Disparaît dans', valeur: resteDeLaRuine(ruine, nbTicks) },
    { quoi: 'Position', valeur: `rangée ${ruine.rangee}, colonne ${ruine.colonne}` },
  ];
}

export function empreinteDeLaCarte(etat) {
  let empreinte = `${etat.baseCourante}:${etat.prochaineInstanceSatellite}`;
  for (const base of etat.bases) empreinte += `:${base.satellites.presents.length}`;
  for (const ruine of ruinesActives(etat)) empreinte += `:${ruine.rangee},${ruine.colonne}`;
  return empreinte;
}

/**
 * Sur quoi la carte cadre en s'ouvrant, et ce qu'il reste de la demande après.
 *
 * ⚠⚠ PUR, PARCE QUE LE « UNE SEULE FOIS » EST TOUT CE QU'IL Y A À GARDER. Le
 * cadrage lui-même se voit à l'œil et ne se teste pas sans navigateur ; ce qui
 * se casse en silence, c'est une demande qui survit à son ouverture — l'onglet
 * Monde ramènerait alors le joueur sur une ruine, des heures après le raid, et
 * rien ne relierait les deux.
 *
 * @param {{rangee: number, colonne: number}|null} demande
 * @param {{rangee: number, colonne: number}} positionDeLaBase
 * @returns {{position: {rangee: number, colonne: number}, demandeSuivante: null}}
 */
export function cadrageDeLOuverture(demande, positionDeLaBase) {
  if (demande === null || demande === undefined) {
    return { position: positionDeLaBase, demandeSuivante: null };
  }
  return {
    position: { rangee: demande.rangee, colonne: demande.colonne },
    demandeSuivante: null,
  };
}

export function initialiserEcranMonde(doc, crochets = {}) {
  // ⚠ L'ÉCRAN DEMANDE, LA SESSION DÉCIDE — même découpage que `versEcran` de
  // l'écran Chantier. La carte sait QUELLE cible on a touchée deux fois ; seule
  // la session sait changer d'écran.
  const surEntreeRaid = crochets.surEntreeRaid ?? (() => {});
  // ⚠ ENTRER DANS SA BASE SE DEMANDE À LA SESSION, comme entrer dans une cible.
  // Cet écran ne connaît pas `montrerEcran` et ne doit pas l'apprendre : il
  // nomme un GESTE, la session décide de l'écran. Même découpage que
  // `surEntreeRaid`, à côté duquel il est câblé.
  const surEntreeBase = crochets.surEntreeBase ?? (() => {});
  // ⚠ L'ÉCRAN DEMANDE, LA SESSION ÉCRIT — même partage que `apresPose` de
  // l'écran Chantier. Un déplacement change l'état et doit être SAUVEGARDÉ tout
  // de suite : c'est une action irréversible, et la perdre parce que
  // l'application a été tuée serait la pire façon de perdre la confiance du
  // joueur. L'écran ne sait pas sauvegarder ; il le demande.
  const apresDeplacement = crochets.apresDeplacement ?? (() => {});
  // ⚠ MÊME PARTAGE POUR LA BASCULE : l'écran écrit l'indice — c'est du jeu —,
  // la session sauvegarde et repeint les autres écrans. Sans ce crochet, un
  // joueur qui bascule depuis la carte reviendrait sur un Chantier montrant
  // encore l'autre base.
  const apresBascule = crochets.apresBascule ?? (() => {});
  const fenetre = doc.defaultView;
  const $ = (id) => doc.getElementById(id);
  const canvas = $('monde-canvas');
  const ctx = canvas.getContext('2d');
  // ⚠⚠ PAS DE LISSAGE. Un emblème de 64 px source posé sur une case de 32 ou de
  // 256 px physiques serait interpolé, et le pixel art rendrait flou. C'est la
  // décision de `ui/banc.js` reprise ici, chez celui qui CRÉE le contexte —
  // `render/` n'en prend aucune. Les dalles de fond, elles, sont déjà à
  // l'échelle et n'en souffrent pas.
  ctx.imageSmoothingEnabled = false;
  const panneau = $('monde-panneau');
  const panneauTitre = $('monde-panneau-titre');
  const panneauPrix = $('monde-panneau-prix');
  const panneauPrixCout = $('monde-panneau-prix-cout');
  const panneauPrixSolde = $('monde-panneau-prix-solde');
  const panneauCorps = $('monde-panneau-corps');
  const panneauRefus = $('monde-panneau-refus');
  const panneauDeplacer = $('monde-panneau-deplacer');
  const panneauConfirmation = $('monde-panneau-confirmation');
  const panneauMenace = $('monde-panneau-menace');
  const panneauConfirmer = $('monde-panneau-confirmer');
  const panneauRenoncer = $('monde-panneau-renoncer');
  const panneauAttaquer = $('monde-panneau-attaquer');
  const miniPanneau = $('monde-mini-panneau');
  const miniCanvas = $('monde-mini-canvas');
  const miniCorps = $('monde-mini-corps');
  // ⚠⚠ LE MESSAGE DES GISEMENTS N'EST PLUS UN TOAST — Ethan, 10/09, point 11 :
  // « Plutôt qu'un toast mieux vaut avoir un pop-up pour les POI ». Il y avait
  // ici un `<div>` fabriqué à la main, posé dans `#monde-outils`, vidé par une
  // minuterie de quelques secondes ; son propre commentaire disait que « les deux
  // moitiés sont à réunir plus tard ». Elles le sont : le message ouvre désormais
  // LE panneau de l'écran, celui des sites et des ruines, et il y ouvre la LISTE
  // — le joueur apprend qu'il a pris un gisement ET lequel, dans le même geste.
  //
  // ⚠ IL SE FERME AU BOUTON, PLUS À LA MINUTERIE. Un pop-up qu'on n'a pas eu le
  // temps de lire est un toast avec un cadre ; c'est très exactement ce qu'Ethan
  // fait changer. La minuterie et le `<div>` sortent avec lui.
  // ⚠⚠ L'ENSEMBLE DES GISEMENTS CONNUS, ET IL VIT EN MÉMOIRE DE SESSION. Le §6
  // du brief l'exige : le PERSISTER serait un changement de schéma, donc un bump
  // de `SAVE_VERSION` pour un message. `null` veut dire « jamais vu » — et c'est
  // ce qui fait qu'un rechargement ne reparle pas : la liste est déjà pleine à la
  // première mesure, donc il n'y a aucune différence à annoncer.
  let poisConnus = null;
  // ⚠ QUELLE CASE LE PANNEAU DÉCRIT — c'est ce à quoi le SECOND toucher se
  // compare. `null` quand le panneau est fermé.
  // ⚠ LA CASE SUR LAQUELLE LA PROCHAINE OUVERTURE CADRERA, ou `null` pour la
  // base du joueur. Posée par `viserAuProchainAffichage`, consommée par
  // l'ouverture qui suit — voir `cadrageDeLOuverture`.
  let cadrageDemande = null;
  let siteOuvert = null;
  // ⚠⚠ ET QUELLE RUINE, QUAND C'EN EST UNE. Deux variables et non une, parce que
  // ce sont deux chemins de toucher : `siteOuvert` porte le second toucher, la
  // flèche et le bouton d'attaque, et une ruine n'a AUCUN des trois. Les
  // confondre aurait rendu la ruine attaquable par le chemin qu'on garde fermé —
  // voir `ouvrirRuine`.
  let ruineOuverte = null;
  // ⚠ LE CIBLAGE DU SITE OUVERT, RETENU UNE FOIS. La flèche le relit plutôt que
  // de rappeler `ciblageDuSite` — qui monte un combat entier pour chiffrer le
  // butin, à chaque image. Et surtout : deux appels pourraient diverger le jour
  // où le coût dépendrait d'autre chose que de la distance.
  let ciblageOuvert = null;
  // ⚠ LE MODE DE DÉPLACEMENT SUIT LE MODÈLE « ARMER PUIS TOUCHER » DE L'ÉCRAN
  // CHANTIER, et pas un autre : on arme au bouton, on touche une case, et
  // toucher ailleurs désarme sans rien dire. Le joueur n'a qu'une grammaire à
  // apprendre pour les deux écrans.
  let modeDeplacement = false;
  let casesDuDeplacement = [];
  // ⚠ LA CASE VISÉE, RETENUE ENTRE LE TOUCHER ET L'ACCORD. Elle vaut `null`
  // partout ailleurs, et c'est ce qui rend `confirmerLeDeplacement` inerte hors
  // de son moment : un bouton laissé vif par un lot futur ne déplacerait rien.
  let deplacementEnAttente = null;

  let etatCourant = null;
  // Les huit planches du sol, une fois décodées, et ce qu'on en dérive par cran.
  let sols = null;
  let solsDemandes = false;
  /** cran → les huit planches réduites à la taille de bloc de ce cran. */
  const solsParTaille = new Map();
  /** taille de bloc → le masque de fondu, en alpha. */
  const masquesParTaille = new Map();
  /** Le canevas d'un bloc, réemployé d'un bloc à l'autre. */
  let planche = null;
  // ⚠⚠ L'ÉCHELLE EST UN RÉEL, PLUS UN INDICE DE TABLE. Le zoom était par crans
  // jusqu'au 04/09 ; Ethan : « le zoom de la carte ne doit pas être par cran ».
  // Un `cranIndex` gardé à côté d'elle « au cas où » divergerait au premier
  // pincement — il n'y en a plus, et `monde.test.js` refuse qu'il revienne.
  // ⚠⚠ ET ELLE S'OUVRE AU ZOOM MAXIMUM DEPUIS LE 06/09, PLUS AU PLUS LARGE.
  // Ethan : « ouverture de la carte : centrée sur ma base du joueur au zoom
  // maximum ». `ECHELLE_MAX` se LIT dans la table — écrire 256 ici ferait la
  // seconde vérité que §4 de `CLAUDE.md` interdit, et la garde « l'écran ne
  // nomme aucune constante de zoom en dur » de `monde.test.js` tomberait
  // dessus. Cette valeur-ci n'est que le point de départ : `cadrerSurLaBase`
  // la repose à chaque ouverture.
  let echelle = ECHELLE_MAX;
  let vueX = 0;
  let vueY = 0;
  let visible = false;
  let idImage = null;
  const cache = creerCacheDalles(TERRAIN_CARTE.dallesEnCache);
  let sitesAffiches = [];
  let empreinteSatellites = null;
  // Le compteur du clignotement — voir `PERIODE_HALO_TICKS`. Il n'avance que
  // quand la carte est EN SCÈNE : `rafraichir` sort avant sur `!visible`.
  let tickHalo = 0;
  // ⚠ L'IMAGE DES EMBLÈMES, ATTENDUE AVANT LE PREMIER DESSIN. Une image dessinée
  // avant décodage est BLANCHE, et le défaut ne se reproduit qu'au tout premier
  // chargement — donc jamais en essai, toujours chez le joueur. `monde.js`
  // attendait déjà son atlas de terrain de cette façon ; on suit le précédent.
  let emblemes = null;
  let emblemesDemandes = false;
  // ⚠ L'ATLAS DES LIMITES S'ATTEND COMME CELUI DES EMBLÈMES, et pour la même
  // raison : `drawImage` veut une image DÉCODÉE, et une `<img>` avant décodage
  // est blanche. Il ne se décode pas en pixels non plus — on ne fait que
  // découper dedans.
  let limites = null;
  let limitesDemandees = false;
  // ⚠ LA GROSSE BASE EST UNE IMAGE À PART, PAS UNE CELLULE D'ATLAS. Elle couvre
  // trois cases de côté, donc 192 px à la grille 64, quand `coudre` exige des
  // cellules carrées à la taille de case — `tools/atlas.py` l'exclut nommément.
  // Elle voyage donc par son propre marqueur, et s'attend comme l'atlas.
  let grossesBases = null;
  let grossesBasesDemandees = false;

  /** Le cran auquel les dalles se rendent en ce moment. Voir `cranDeRendu`. */
  const cranCourant = () => cranDeRendu(echelle);

  // --- les huit planches du sol ---------------------------------------------
  //
  // ⚠ ELLES S'ATTENDENT À LA PREMIÈRE OUVERTURE DE LA CARTE, PAS AU DÉMARRAGE.
  // Les dépenser au lancement pour un écran que le joueur n'ouvrira peut-être
  // pas retarderait l'affichage de sa base.
  //
  // ⚠⚠ ET ELLES NE SE DÉCODENT PAS EN PIXELS, contrairement à l'atlas de terrain
  // qu'elles remplacent. Lui devait être relu case par case pour être accumulé ;
  // une planche se POSE, et `drawImage` prend l'`<img>` telle quelle. Les lire
  // en `Uint8Array` coûterait 50 Mio pour rien — c'est tout le motif de la
  // réécriture du lot SOL-SATELLITE.
  function chargerSols() {
    if (sols !== null || solsDemandes) return;
    // ⚠ LE DRAPEAU SE POSE AVANT L'ATTENTE, PAS APRÈS. `peindre` rappelle ceci à
    // chaque ouverture de la carte : sans lui, deux ouvertures pendant que les
    // images se décodent poseraient deux jeux d'écouteurs. Il retombe quand la
    // dernière arrive, pour que la seconde tentative fasse le travail.
    solsDemandes = true;
    const images = NOMS_DU_SOL.map((_, i) => $(`sol-${i + 1}`));
    const manquante = images.find((im) => !im.complete || im.naturalWidth === 0);
    if (manquante !== undefined) {
      manquante.addEventListener('load', () => { solsDemandes = false; chargerSols(); }, { once: true });
      return;
    }
    sols = images;
    dessiner();
  }

  /**
   * Les huit planches réduites une fois à la taille de bloc d'un cran.
   *
   * ⚠⚠ ON RÉDUIT UNE FOIS PAR CRAN, PAS UNE FOIS PAR BLOC. Une dalle du cran le
   * plus large demande dix-sept blocs ; les réduire à la volée referait
   * dix-sept fois la réduction d'une image de 1 254², soit vingt-sept millions
   * de pixels lus pour une dalle. Réduites d'avance, les huit coûtent
   * 12,6 millions une fois pour toutes, et un bloc n'est plus qu'un `drawImage`
   * de la bonne taille.
   *
   * ⚠ ET LE 1:1 NE PASSE PAS PAR ICI. Au cran le plus serré, la taille de bloc
   * EST le côté de la planche : réduire serait recopier 50 Mio pour rien, alors
   * que l'`<img>` fait déjà exactement l'affaire.
   *
   * ⚠ `imageSmoothingQuality` À `high`, ET C'EST LA MOITIÉ QUI COMPTE. Une
   * réduction de huit contre un en bilinéaire simple n'échantillonne qu'un pixel
   * sur soixante-quatre : le sol scintillerait au défilement. Le mot demande au
   * navigateur sa réduction par étapes.
   */
  function solsALaTaille(taille) {
    if (taille === COTE_SOURCE) return sols;
    let prets = solsParTaille.get(taille);
    if (prets !== undefined) return prets;
    prets = sols.map((image) => {
      const c = doc.createElement('canvas');
      c.width = taille;
      c.height = taille;
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = 'high';
      g.drawImage(image, 0, 0, taille, taille);
      return c;
    });
    solsParTaille.set(taille, prets);
    return prets;
  }

  /**
   * Le masque de fondu d'un bloc : le produit des deux profils, en ALPHA seul.
   *
   * ⚠⚠ IL EST INVARIANT PAR ROTATION ET PAR MIROIR, ET C'EST CE QUI PERMET DE
   * L'APPLIQUER SANS TOURNER. Le profil est symétrique et le masque en est le
   * produit sur les deux axes : le faire tourner d'un quart de tour rend
   * exactement le même masque. Un seul par taille suffit donc, et il s'applique
   * après la rotation de la planche sans avoir à la suivre.
   *
   * ⚠ IL NE PORTE QUE DE L'ALPHA. `destination-in` ne lit que ce canal ; y
   * peindre une couleur serait écrire un octet que personne ne relit.
   */
  function masqueDeTaille(taille, fondu) {
    let masque = masquesParTaille.get(taille);
    if (masque !== undefined) return masque;
    const profil = profilDuBloc(taille, fondu);
    masque = doc.createElement('canvas');
    masque.width = taille;
    masque.height = taille;
    const image = new fenetre.ImageData(taille, taille);
    const octets = image.data;
    for (let j = 0; j < taille; j += 1) {
      const wy = profil[j];
      for (let i = 0; i < taille; i += 1) {
        octets[(j * taille + i) * 4 + 3] = Math.round(wy * profil[i] * 255);
      }
    }
    masque.getContext('2d').putImageData(image, 0, 0);
    masquesParTaille.set(taille, masque);
    return masque;
  }

  /** Le canevas d'un bloc, redimensionné au besoin et réemployé ensuite. */
  function plancheDeTaille(taille) {
    if (planche === null) planche = doc.createElement('canvas');
    if (planche.width !== taille) {
      planche.width = taille;
      planche.height = taille;
    }
    return planche;
  }

  /**
   * L'atlas des emblèmes, attendu puis gardé.
   *
   * ⚠ CONTRAIREMENT À L'ATLAS DE TERRAIN, IL NE SE DÉCODE PAS EN PIXELS. Le fond
   * de carte a besoin de lire ses tuiles pour les accumuler ; un emblème se
   * découpe et se pose par `drawImage`, qui prend l'`<img>` telle quelle. Il n'y
   * a donc ni canevas tampon ni `getImageData` — seulement l'attente du décodage.
   */
  function chargerEmblemes() {
    if (emblemes !== null || emblemesDemandes) return;
    emblemesDemandes = true;
    const image = $('monde-emblemes');
    if (!image.complete || image.naturalWidth === 0) {
      image.addEventListener('load', () => { emblemesDemandes = false; chargerEmblemes(); }, { once: true });
      return;
    }
    emblemes = image;
    dessiner();
  }

  /** L'atlas des limites de territoire — même attente, même repli. */
  function chargerLimites() {
    if (limites !== null || limitesDemandees) return;
    limitesDemandees = true;
    const image = $('monde-limites');
    if (!image.complete || image.naturalWidth === 0) {
      image.addEventListener('load', () => { limitesDemandees = false; chargerLimites(); }, { once: true });
      return;
    }
    limites = image;
    dessiner();
  }

  /**
   * Les grosses bases, par leur côté en cases — même attente que l'atlas.
   *
   * ⚠ SEULE LA 3 × 3 EST EMPLOYÉE AUJOURD'HUI, et la 2 × 2 est chargée quand
   * même : elle est dans le fichier livré de toute façon — elle y pèse 15 134
   * octets —, et l'attendre ici évite qu'un futur emploi redécouvre le décodage.
   */
  function chargerGrossesBases() {
    if (grossesBases !== null || grossesBasesDemandees) return;
    grossesBasesDemandees = true;
    const images = { 2: $('monde-base-2x2'), 3: $('monde-base-3x3') };
    const enAttente = Object.values(images)
      .filter((im) => !im.complete || im.naturalWidth === 0);
    if (enAttente.length > 0) {
      enAttente[0].addEventListener('load', () => {
        grossesBasesDemandees = false; chargerGrossesBases();
      }, { once: true });
      return;
    }
    grossesBases = images;
    dessiner();
  }

  // --- la vue ---------------------------------------------------------------

  function dimensionner() {
    const cadre = canvas.getBoundingClientRect();
    const dpr = fenetre.devicePixelRatio || 1;
    const largeur = Math.max(1, Math.round(cadre.width * dpr));
    const hauteur = Math.max(1, Math.round(cadre.height * dpr));
    if (canvas.width === largeur && canvas.height === hauteur) return;
    canvas.width = largeur;
    canvas.height = hauteur;
    recadrer();
  }

  function recadrer() {
    const taille = dimensionsDeLaCarte(echelle);
    vueX = bornerDefilement(vueX, taille.largeur, canvas.width);
    vueY = bornerDefilement(vueY, taille.hauteur, canvas.height);
  }

  /** Centre la vue sur une case de la carte. */
  function centrerSur(position) {
    vueX = (position.colonne - 0.5) * echelle - canvas.width / 2;
    vueY = (position.rangee - 0.5) * echelle - canvas.height / 2;
    recadrer();
  }

  /**
   * Le cadrage d'ouverture : la base du joueur, au zoom maximum.
   *
   * ⚠⚠ LES DEUX MOITIÉS SONT LA MÊME PHRASE, ET ELLES NE SE SÉPARENT PAS.
   * Ethan, 06/09 : « ouverture de la carte : centrée sur ma base du joueur au
   * zoom maximum ». Un sujet, deux compléments : appliquer le recentrage à
   * chaque ouverture et l'échelle une seule fois rendrait la phrase à moitié
   * vraie à partir de la deuxième visite, ce qui ne serait la lecture de
   * personne. D'où une fonction, appelée d'un seul endroit — `peindre`.
   *
   * ⚠ L'ÉCHELLE SE POSE AVANT LE CENTRAGE, ET L'ORDRE COMPTE. `centrerSur`
   * calcule sa vue à partir d'`echelle` : centrer d'abord poserait la vue à
   * l'ancienne échelle, et le zoom la ferait fuir juste après.
   *
   * ⚠ ON ÉCRIT `echelle` PLUTÔT QUE D'APPELER `reglerEchelle`. Celle-ci garde un
   * point de l'écran immobile — c'est ce que le pincement demande, et c'est
   * exactement ce qu'on ne veut pas ici : la vue est remplacée, pas ancrée. Elle
   * sort d'ailleurs sans rien faire quand l'échelle ne bouge pas, ce qui
   * laisserait le cadrage à moitié fait une ouverture sur deux.
   *
   * ⚠ ET C'EST LE SEUL ENDROIT QUI FORCE LE ZOOM. `#monde-recentrer` et le
   * recentrage d'après-déplacement appellent `centrerSur` seul, et gardent le
   * cran que le joueur venait de choisir : Ethan n'a parlé que de l'OUVERTURE.
   */
  function cadrerSurLaBase(etat) {
    echelle = ECHELLE_MAX;
    const cadrage = cadrageDeLOuverture(cadrageDemande, baseCourante(etat).position);
    cadrageDemande = cadrage.demandeSuivante;
    centrerSur(cadrage.position);
  }

  /**
   * La carte s'ouvrira sur CETTE case, une fois.
   *
   * ⚠ UNE FOIS, ET C'EST TOUT LE MÉCANISME. La demande est consommée par
   * l'ouverture qui la suit ; la suivante recadre chez le joueur comme avant.
   * Une demande qui resterait collée rendrait l'onglet Monde incapable de
   * ramener le joueur chez lui, et personne ne ferait le lien avec un raid
   * terminé une heure plus tôt.
   *
   * @param {{rangee: number, colonne: number}|null} position
   */
  function viserAuProchainAffichage(position) {
    cadrageDemande = position ?? null;
  }

  /**
   * Porte l'échelle à la valeur demandée, en gardant un point de l'écran
   * immobile — le cœur du zoom continu.
   *
   * ⚠⚠ L'ANCRE N'EST PLUS FORCÉMENT LE CENTRE — c'est ce que le pincement
   * apporte. Zoomer sur le milieu des deux doigts est la seule façon de faire
   * grossir CE QU'ON REGARDE : ancrer au centre de l'écran ferait fuir sous les
   * doigts la case qu'on vise, et sur une carte de 300 rangées on ne la
   * retrouve pas. Le centre reste le défaut, pour tout appel sans ancre.
   *
   * ⚠⚠ ET LE CACHE NE SE VIDE PLUS — C'ÉTAIT LA LIGNE QUI RENDAIT LE CONTINU
   * IMPOSSIBLE. Elle disait : « une dalle est un rendu à un cran donné ; la
   * garder d'un cran à l'autre dessinerait l'ancienne échelle. » Le motif était
   * juste tant que `cleDeDalle` IGNORAIT le cran ; elle le porte depuis le lot
   * ZOOM-CONTINU, si bien que deux crans cohabitent sans se confondre et que
   * l'éviction au plus ancien usage s'en charge. Vider ici referait 19 ms par
   * dalle à chaque image d'un pincement.
   *
   * ⚠ LA CASE SOUS L'ANCRE SE RELÈVE AVANT, ET SE RÉAPPLIQUE APRÈS. Sans ça
   * elle fuit sous les doigts — c'est ce que le pavé ci-dessus décrit, et la
   * bonne nouvelle du continu est que ça ne change pas d'un mot.
   *
   * @param {number} demandee échelle voulue, en pixels physiques par case
   * @param {{x: number, y: number}} [ancre] point à garder fixe, en pixels du
   *   canevas (physiques, origine au coin haut-gauche du canevas)
   * @returns {boolean} vrai si l'échelle a bougé
   */
  function reglerEchelle(demandee, ancre = null) {
    // ⚠ ON BORNE ICI, ET C'EST POURQUOI `cranDeRendu` PEUT LEVER PLUS BAS.
    const voulue = bornerEchelle(demandee);
    if (!Number.isFinite(voulue) || voulue === echelle) return false;
    const point = ancre === null
      ? { x: canvas.width / 2, y: canvas.height / 2 }
      : ancre;
    const vue = vueApresEchelle({ x: vueX, y: vueY }, echelle, voulue, point);
    echelle = voulue;
    vueX = vue.x;
    vueY = vue.y;
    recadrer();
    majBoutons();
    dessiner();
    return true;
  }

  /**
   * L'échelle — qui ne se DESSINE plus, mais qui se lit encore.
   *
   * ⚠⚠ ELLE A QUITTÉ L'ÉCRAN LE 31/08. Ethan : « enlever les pixel/case du
   * haut », capture à l'appui, « en haut à droite ». C'était ce `11 PX / CASE`
   * posé sur le coin de la carte. Elle avait perdu ses deux boutons le 30/08 et
   * gardait son nom ; elle perd maintenant son texte et garde sa fonction.
   *
   * ⚠ CE QUI SORT DE L'ÉCRAN NE SORT PAS DU JEU (CLAUDE.md §6) : la valeur passe
   * dans le `title` de la boîte d'outils. Ethan demande un DESSIN en moins, pas
   * une donnée — c'est ce que le dépôt a déjà fait de la lettre de l'obstacle et
   * du cadre de famille du jeton.
   */
  function majBoutons() {
    const cssParCase = echelle / (fenetre.devicePixelRatio || 1);
    $('monde-outils').title = `${Math.round(cssParCase)} px / case`;
  }

  // --- le dessin -------------------------------------------------------------

  function cleDeDalle(i, j) {
    return `${cranCourant()}:${i}:${j}`;
  }

  /**
   * Fabrique une dalle et la range. Rendue à part pour pouvoir la plafonner.
   *
   * ⚠⚠ `lighter` ADDITIONNE, ET C'EST EXACTEMENT LA FORMULE DU PAVAGE. Chaque
   * bloc est peint dans un canevas à part, son masque de fondu lui est appliqué
   * en `destination-in` — le canevas porte donc `w` en alpha et `v` en couleur
   * —, puis il est ajouté à la dalle. `lighter` somme les canaux PRÉMULTIPLIÉS :
   * la dalle finit avec `Σ w·v` en couleur et `Σ w` en alpha, et `Σ w` vaut
   * exactement 1 (voir `render/terrain.js`). C'est donc `Σ w·v` qu'on obtient,
   * sans division ni normalisation.
   *
   * ⚠ ET `source-over` NE MARCHERAIT PAS. Il rend `w·v + (1 − w)·fond`, ce qui
   * n'est la bonne réponse que pour DEUX blocs, et à condition de les poser dans
   * le bon ordre. Aux coins, quatre blocs se croisent.
   *
   * ⚠ LE CANEVAS DE BLOC EST RÉEMPLOYÉ, PAS RECRÉÉ. Une dalle du cran le plus
   * large en demande dix-sept ; en créer dix-sept par dalle donnerait au
   * ramasse-miettes de quoi hacher le défilement.
   */
  /**
   * La bascule du sol vers l'Ouvrage : une translation par canal, en dégradé.
   *
   * ⚠⚠ LA COULEUR NE DÉPEND QUE DE LA RANGÉE, ET C'EST TOUT LE LOT SOL-OUVRAGE.
   * Le MOTIF change par bloc — `render/terrain.js` tire une famille — mais la
   * TEINTE est une fonction du seul `y` : deux pixels voisins ont donc presque
   * la même rangée, donc presque la même teinte, à toutes les échelles et sur
   * toutes les dalles. **Aucune frontière de couleur ne peut apparaître.**
   *
   * ⚠⚠ LA VOIE ÉVIDENTE A ÉTÉ ESSAYÉE ET ELLE EST INUTILISABLE — faire porter la
   * couleur par la FAMILLE, un bloc étant ocre ou violet. Les deux références
   * sont à 69 niveaux l'une de l'autre sur le rouge et le fondu ne fait que
   * 72 pixels source : la bascule ressort en escalier de rectangles orange et
   * violets, qui se lit comme une tilemap cassée.
   *
   * ⚠ ET ELLE NE COÛTE RIEN À L'ARCHITECTURE. La dalle finit la boucle des blocs
   * avec `Σw·v` en couleur et `Σw = 1` en alpha ; ajouter une constante par
   * canal APRÈS l'accumulation donne exactement `Σw·(v + d)`, puisque `Σw` vaut
   * un. Deux `fillRect` par dalle, et rien par bloc.
   *
   * ⚠⚠ DEUX PASSES, PARCE QU'IL N'Y A PAS DE SOUSTRACTION SATURANTE AU CANEVAS.
   * `difference` rend `|d − s|`, ce qui n'est `d − s` que si le sol reste
   * au-dessus de ce qu'on lui retire : `tools/sols.py` pose un plancher au
   * stockage pour que ce soit vrai partout, et le manifeste porte les minimums
   * relevés APRÈS encodage. `lighter` additionne, ce qui va pour le bleu.
   *
   * ⚠ LES DEUX PASSES PORTENT SUR DES CANAUX DISJOINTS — rouge et vert d'un
   * côté, bleu de l'autre — donc leur ordre est indifférent. C'est dit pour
   * qu'on n'aille pas chercher une raison qui n'existe pas.
   *
   * ⚠ ET LE BAS DE LA CARTE NE PAIE RIEN. Sous la rangée du pivot la teinte vaut
   * zéro partout, donc les deux dégradés seraient noirs — `difference` et
   * `lighter` avec du noir sont l'identité. On sort avant de peindre plutôt que
   * de peindre deux aplats qui ne changent rien : c'est la moitié basse de la
   * carte, celle où le joueur passe son temps.
   */
  function peindreLaTeinte(gDalle, y0, cote, cran) {
    const arrets = arretsDeTeinte(y0, cote, cran);
    if (arrets.every((a) => a.t === 0)) return;

    // ⚠ `|Δ|`, ET IL VIENT DE `render/terrain.js`, JAMAIS D'UN NOMBRE ÉCRIT ICI.
    // Un test confronte cette constante-là au manifeste que `tools/sols.py`
    // écrit : la mesure est dans l'outil, la valeur au code, et l'écran ne fait
    // que la peindre.
    const [dr, dv, db] = DELTA_TEINTE;
    const rampe = (canaux) => {
      const g = gDalle.createLinearGradient(0, 0, 0, cote);
      for (const { s, t } of arrets) g.addColorStop(s, canaux(t));
      return g;
    };

    gDalle.globalCompositeOperation = 'difference';
    gDalle.fillStyle = rampe((t) => `rgb(${Math.round(-dr * t)}, ${Math.round(-dv * t)}, 0)`);
    gDalle.fillRect(0, 0, cote, cote);

    gDalle.globalCompositeOperation = 'lighter';
    gDalle.fillStyle = rampe((t) => `rgb(0, 0, ${Math.round(db * t)})`);
    gDalle.fillRect(0, 0, cote, cote);
  }

  function calculerDalle(i, j) {
    const cote = TERRAIN_CARTE.dalleCotePx;
    const cran = cranCourant();
    const { taille, fondu } = geometrieDuCran(cran);
    const prets = solsALaTaille(taille);
    const masque = masqueDeTaille(taille, fondu);
    const bloc = plancheDeTaille(taille);
    const gBloc = bloc.getContext('2d');

    const tampon = doc.createElement('canvas');
    tampon.width = cote;
    tampon.height = cote;
    const gDalle = tampon.getContext('2d');
    gDalle.globalCompositeOperation = 'lighter';

    for (const b of blocsDeLaDalle({
      graine: etatCourant.graine, cran, x0: i * cote, y0: j * cote, cote,
    })) {
      gBloc.setTransform(1, 0, 0, 1, 0, 0);
      gBloc.globalCompositeOperation = 'source-over';
      gBloc.clearRect(0, 0, taille, taille);
      // La rotation et le miroir se prennent autour du centre : un bloc est
      // carré, donc son encombrement ne bouge pas d'un quart de tour à l'autre.
      gBloc.translate(taille / 2, taille / 2);
      gBloc.rotate((b.rotation * Math.PI) / 2);
      if (b.miroir) gBloc.scale(-1, 1);
      gBloc.drawImage(prets[b.sol], -taille / 2, -taille / 2, taille, taille);
      gBloc.setTransform(1, 0, 0, 1, 0, 0);
      gBloc.globalCompositeOperation = 'destination-in';
      gBloc.drawImage(masque, 0, 0);
      gDalle.drawImage(bloc, b.x, b.y);
    }

    peindreLaTeinte(gDalle, j * cote, cote, cran);

    gDalle.globalCompositeOperation = 'source-over';
    cache.ecrire(cleDeDalle(i, j), tampon);
    return tampon;
  }

  /**
   * L'origine du dessin, en pixels ENTIERS.
   *
   * ⚠ LE DÉFILEMENT SE GARDE EN FLOTTANT, LE DESSIN PART D'UNE ORIGINE ENTIÈRE.
   * Arrondir `vueX` lui-même perdrait un demi-pixel à chaque évènement de
   * glissement, et la carte traînerait derrière le doigt sur un long
   * défilement : on arrondit à la lecture, jamais à l'écriture.
   *
   * ⚠⚠ ET CE QUI SUIT NE VAUT PLUS POUR LES DALLES DEPUIS LE ZOOM CONTINU. Ce
   * pavé disait « le dessin se fait en ENTIERS », au motif qu'un `drawImage`
   * fractionnaire rééchantillonne le pavage et le rend flou. C'est vrai du
   * DÉFILEMENT, et c'est encore ce que cette origine-ci garantit ; ce n'est
   * plus vrai de la TAILLE d'une dalle, qui vaut `cote × facteur` et n'est
   * entière qu'aux crans. Une dalle se pose donc entre deux BORDS arrondis —
   * voir `bordDeDalle` — et non à une position entière d'une largeur entière.
   */
  const origineX = () => Math.round(vueX);
  const origineY = () => Math.round(vueY);

  /**
   * Le fond : les dalles du cran de rendu, posées à l'échelle d'affichage.
   *
   * ⚠⚠ ON ARRONDIT LES BORDS, JAMAIS LES LARGEURS — ET C'EST LE PIÈGE DU LOT.
   * À facteur fractionnaire une dalle mesure `cote × facteur` pixels d'écran,
   * qui n'est pas entier. Arrondir séparément la position ET la largeur de
   * chaque dalle laisse un pixel de fond entre deux voisines une fois sur
   * deux : une grille noire sur toute la carte, c'est-à-dire exactement ce que
   * le semis de `TERRAIN_CARTE` existe pour supprimer. En partant des BORDS, le
   * bord droit d'une dalle EST le bord gauche de sa voisine — le même nombre,
   * par construction et non par chance. `ZOOM T5` le calcule sur 200 facteurs.
   *
   * ⚠ LE LISSAGE EST VRAI ICI, ET FAUX PARTOUT AILLEURS. Une réduction non
   * entière en « plus proche voisin » produit du moiré, pas du pixel art net.
   * Il est remis à sa valeur d'avant en sortant : les emblèmes, eux, gardent la
   * décision du 30/08 — voir la création du contexte.
   */
  function dessinerFond(ox, oy) {
    const cote = TERRAIN_CARTE.dalleCotePx;
    // Une dalle est rendue à `cranCourant()` et posée à `echelle` : sa largeur
    // d'écran suit le même rapport que la case.
    const facteur = facteurDAffichage(echelle);
    const coteAffiche = cote * facteur;
    const i0 = Math.floor(ox / coteAffiche);
    const i1 = Math.floor((ox + canvas.width - 1) / coteAffiche);
    const j0 = Math.floor(oy / coteAffiche);
    const j1 = Math.floor((oy + canvas.height - 1) / coteAffiche);
    const lissageAvant = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = true;
    let budget = DALLES_PAR_IMAGE;
    let restent = false;
    for (let j = j0; j <= j1; j += 1) {
      const y0 = bordDeDalle(j, coteAffiche, oy);
      const y1 = bordDeDalle(j + 1, coteAffiche, oy);
      for (let i = i0; i <= i1; i += 1) {
        const x0 = bordDeDalle(i, coteAffiche, ox);
        const x1 = bordDeDalle(i + 1, coteAffiche, ox);
        let dalle = cache.lire(cleDeDalle(i, j));
        if (dalle === undefined && sols !== null && budget > 0) {
          budget -= 1;
          dalle = calculerDalle(i, j);
        }
        if (dalle !== undefined) {
          ctx.drawImage(dalle, x0, y0, x1 - x0, y1 - y0);
          continue;
        }
        restent = true;
        // ⚠ L'ATTENTE NE DÉPEND PLUS DE LA RANGÉE — lot SOL-SATELLITE. Elle
        // rendait l'ardoise en haut de la carte et la terre cuite en bas, le sol
        // basculant de camp à mesure qu'on montait ; il n'y a plus qu'un sol.
        ctx.fillStyle = teinteDAttente();
        ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      }
    }
    ctx.imageSmoothingEnabled = lissageAvant;
    return restent;
  }

  /**
   * Un emblème : son sprite, et sa lettre au-dessus du seuil.
   *
   * ⚠⚠ LE SPRITE A REMPLACÉ LE CARRÉ ARRONDI AU LOT CARTE-EMBLÈMES. Le
   * commentaire qui était ici disait que « aucun fichier n'existe » : les
   * quarante-cinq sont au dépôt depuis le lot 6, et aucun n'était branché. Le
   * gabarit reste en REPLI tant que l'image n'est pas décodée — une image
   * dessinée trop tôt est blanche, et un carré vaut mieux qu'un trou.
   *
   * ⚠⚠ PLUS AUCUNE LETTRE, À AUCUN ZOOM. Arbitré par Ethan le 30/08 : « on
   * enlève les lettres quoi qu'il arrive. » Ce n'est pas un seuil abaissé, c'est
   * la lettre qui part — `CSS_MINI_LETTRE` est partie avec, faute de lecteur.
   * Le champ `lettre` d'`EMBLEMES_CARTE`, lui, RESTE : c'est la seule
   * désignation courte des cinq types de site, et un panneau futur la
   * reprendra. Le supprimer serait détruire de l'information pour économiser
   * cinq caractères.
   *
   * ⚠ L'ÉCHELLE NE S'ÉCRIT PAS ICI. Un emblème est dessiné à la taille d'une
   * case, quelle que soit la grille source : `drawImage` met la cellule de
   * `COTE_SPRITE` pixels à `taille` pixels, et le rapport suit tout seul le
   * jour où un cran bougera — ou le jour où la couture change de grille, ce
   * qui est arrivé au lot GRILLE-128 et que `render/embleme.js` raconte.
   *
   * ⚠⚠ ET LA BASE TERMINALE NE PASSE PAS PAR ICI. Elle couvre neuf cases ; son
   * dessin a besoin de l'origine de la vue et du cran, que cette fonction-ci ne
   * reçoit pas. `dessiner` la dérive par `cotesDuSite`, qui est une TABLE du
   * module de rendu — pas un `=== 'baseTerminale'` écrit à la main dans la
   * boucle, qui serait le premier cas particulier à diverger.
   */
  function dessinerEmbleme(site, x, y, taille) {
    if (emblemes !== null) {
      // ⚠⚠ LA GÉOMÉTRIE SE DEMANDE, ELLE NE SE CALCULE PLUS ICI. Ces six lignes
      // lisaient `cellule.x`, `cellule.y` et `cellule.cote` sur ce que rend
      // `celluleDuSprite` — qui rend des INDICES (`colonne`, `rangee`) et jamais
      // des pixels. Les trois valaient `undefined`, et `drawImage` avec un
      // rectangle source non fini NE DESSINE RIEN ET NE LÈVE PAS : la carte
      // s'ouvrait vide de tout emblème, base du joueur comprise. Le calcul vit
      // désormais dans `render/embleme.js`, où un test l'atteint.
      const d = dessinerEmblemeDUneCase(
        site, palierDuSite(site, etatCourant), x, y, taille,
      );
      ctx.drawImage(emblemes, d.sx, d.sy, d.sCote, d.sCote, d.x, d.y, d.cote, d.cote);
    } else {
      // Repli d'attente : le gabarit du lot ÉCRAN-CARTE, tel quel.
      const embleme = EMBLEMES_CARTE[site.type];
      const trait = Math.max(1, Math.round(taille / 16));
      const marge = Math.max(1, Math.round(taille / 8));
      const cote = taille - marge * 2;
      const rayon = Math.max(1, Math.round(cote / 5));
      ctx.fillStyle = embleme.fond;
      ctx.lineWidth = trait;
      ctx.strokeStyle = embleme.bord;
      // `roundRect` n'existe que depuis Chrome 99. L'enveloppe vise bien plus
      // haut, mais un gabarit d'attente n'est pas ce pour quoi on veut faire
      // tomber tout un écran sur un appareil ancien : à défaut, un carré net.
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(x + marge, y + marge, cote, cote, rayon);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(x + marge, y + marge, cote, cote);
        ctx.strokeRect(x + marge, y + marge, cote, cote);
      }
    }
  }

  /**
   * Une base qui couvre plusieurs cases — l'hexagone de la terminale.
   *
   * ⚠ L'EMPRISE SE DEMANDE À `render/embleme.js`, elle ne se calcule pas ici.
   * Une 3 × 3 se centre sur sa case ; le module lève si le carré débordait la
   * carte, plutôt que de le rogner en silence.
   *
   * ⚠ ET LE REPLI EST L'EMBLÈME D'UNE CASE. Tant que l'image n'est pas décodée,
   * mieux vaut un gabarit à la bonne place qu'un trou de neuf cases.
   */
  function dessinerGrosse(site, cotes, ox, oy, pas) {
    if (grossesBases === null) {
      dessinerEmbleme(site, (site.colonne - 1) * pas - ox, (site.rangee - 1) * pas - oy, pas);
      return;
    }
    const d = dessinerGrosseBase(cotes, site, pas, { x: ox, y: oy });
    ctx.drawImage(grossesBases[cotes], d.x, d.y, d.cote, d.cote);
  }

  /**
   * Les frontières de territoire — Ethan, 31/08 : « afficher les territoires sur
   * la carte. Cf screenshots, seuls les bordures sont dessinés. »
   *
   * ⚠⚠ SEULS LES CÔTÉS EXPOSÉS SE DESSINENT, JAMAIS LE REMPLISSAGE. Une case
   * peinte couvrirait le terrain, qui est ce qu'on est venu regarder — et sur
   * cette carte-ci l'Ouvrage tient 100 % des rangées au-dessus de la garde de
   * départ (mesuré), donc un aplat noierait l'écran entier.
   *
   * ⚠ ELLES PASSENT SOUS LES EMBLÈMES. Un trait par-dessus une base couperait le
   * seul dessin qui dit ce qu'il y a là.
   *
   * ⚠ ET LES DEUX CAMPS SE DESSINENT L'UN APRÈS L'AUTRE, groupés par couleur :
   * changer `strokeStyle` à chaque segment coûterait un changement d'état de
   * contexte par case, là où la fenêtre en compte des dizaines.
   */
  /**
   * Les ruines actives, dessinées sur leur case — lot CONQUÊTE-24H.
   *
   * ⚠⚠ ELLES NE PASSENT TOUJOURS PAS PAR `sitesDeLaFenetre`, ET LE MOTIF N'A PAS
   * BOUGÉ — SEULE LA CONCLUSION A CHANGÉ. Ce bloc disait, au lot CONQUÊTE-24H :
   * « `sitesAffiches` est ce que le TOUCHER interroge et ce que les ÉTIQUETTES
   * légendent ; y faire entrer une ruine l'aurait rendue cliquable, donc
   * ouvrable, donc — deux touchers plus loin — ATTAQUABLE ». Ethan, 08/09,
   * point 10 : « une base détruite doit être cliquable et voir encore ses stats ».
   *
   * ⚠⚠ LA CRAINTE RESTE ENTIÈREMENT VALABLE, ET C'EST POUR ÇA QUE `sitesAffiches`
   * NE LES REÇOIT PAS DAVANTAGE. Une ruine est désormais cliquable par un SECOND
   * chemin de toucher — `ruineDeLaCase`, à la fin de `relacher` — qui n'aboutit
   * qu'à un panneau en LECTURE SEULE : pas de bouton d'attaque, pas de bouton de
   * fondation, pas de bouton de déplacement, et `siteOuvert` reste `null`. La
   * passe à part garde donc toujours le chemin du raid muet PAR CONSTRUCTION,
   * sans un seul `if (type === 'ruine')` dedans, et `PC T8` le mesure de face.
   *
   * ⚠ ET LE SITE GAGNE TOUJOURS SUR LA RUINE, au toucher comme au dessin : la
   * boucle des sites de `relacher` passe AVANT `ruineDeLaCase`, exactement comme
   * cette passe-ci passe avant les emblèmes.
   *
   * ⚠⚠ ELLE DESSINE CE QUI EST TOMBÉ, PAS QUI TIENT LE TERRAIN. Une base de
   * l'Ouvrage rasée par le joueur montre une carcasse d'OUVRAGE tout en peignant
   * du territoire JOUEUR autour d'elle — le décombre est au vaincu, le terrain au
   * vainqueur. C'est `spriteDeLaRuine` qui porte la règle, et l'entrée porte le
   * `type` pour qu'elle n'ait rien à déduire.
   *
   * ⚠ AVANT LES SITES, comme les frontières : si un site venait un jour à
   * partager la case d'une ruine, c'est le site qui doit se lire.
   */
  function dessinerRuines(ox, oy, pas) {
    if (emblemes === null) return;
    for (const ruine of ruinesActives(etatCourant)) {
      const x = (ruine.colonne - 1) * pas - ox;
      const y = (ruine.rangee - 1) * pas - oy;
      if (x + pas < 0 || y + pas < 0 || x > canvas.width || y > canvas.height) continue;
      const d = dessinerRuineDUneCase(
        ruine.type, palierDeNiveau(ruine.niveau), x, y, pas,
      );
      ctx.drawImage(emblemes, d.sx, d.sy, d.sCote, d.sCote, d.x, d.y, d.cote, d.cote);
    }
  }

  function dessinerFrontieres(ox, oy, pas) {
    const carte = territoireDeLaFenetre(etatCourant, fenetreVisible({
      x: ox, y: oy, largeur: canvas.width, hauteur: canvas.height, cran: pas,
    }));
    const bords = bordsDuTerritoire(carte);
    if (bords.length === 0) return;
    // ⚠⚠ SANS L'ATLAS, ON NE DESSINE PLUS RIEN — ET C'EST UN CHOIX, PAS UN
    // OUBLI. L'ancien repli était le trait au `strokeStyle` ; le garder aurait
    // fait clignoter la carte au premier affichage, une frontière au trait
    // remplacée un dixième de seconde plus tard par une frontière au sprite. Le
    // décodage d'un atlas de 19 Kio prend une image ou deux, et `chargerLimites`
    // redessine quand il arrive.
    if (limites === null) return;
    for (const bord of bords) {
      // ⚠ LA GÉOMÉTRIE SE DEMANDE, ELLE NE SE CALCULE PAS ICI — la règle que
      // `monde.test.js` tient depuis le lot RETOURS-DU-31, et qui a fait tomber
      // le premier jet de ce lot-ci.
      const pieces = dessinerLimiteDUneCase(
        bord.camp, bord, (bord.colonne - 1) * pas - ox, (bord.rangee - 1) * pas - oy, pas,
      );
      for (const d of pieces) {
        ctx.drawImage(limites, d.sx, d.sy, d.sCote, d.sCote, d.x, d.y, d.cote, d.cote);
      }
    }
  }

  /**
   * L'étiquette d'un site : son nom et son niveau, sous sa case, sur une plaque.
   *
   * ⚠⚠ LA PLAQUE EMPLOIE `PALETTE.ombrePortee`, ET C'EST LE SEUL `rgba` DU
   * DÉPÔT. La garde de palette de `banc.test.js` balaie `src/render/`,
   * `src/ui/` et la feuille, et refuse tout `rgba` autre que
   * `rgba(0,0,0,0.31)` : « fond semi opaque » n'a donc qu'une écriture
   * possible, et on la LIT dans `render/scene.js` au lieu de la retaper — une
   * transcription qui ne se confronte pas à sa source est une copie qui
   * vieillit.
   *
   * ⚠ ELLE SE POSE SOUS LA CASE, PAS DESSUS. Par-dessus, elle masquerait
   * l'emblème, c'est-à-dire le seul dessin qui dit ce qu'il y a là — et
   * l'étiquette existe pour le NOMMER, pas pour le remplacer.
   *
   * ⚠ ET ELLE SE DESSINE APRÈS TOUS LES EMBLÈMES, dans une seconde boucle. Dans
   * la première, la plaque d'un site serait recouverte par l'emblème du site
   * juste en dessous de lui — mesuré : 8,4 % des sites ont un voisin à une
   * seule case.
   */
  /**
   * La boîte d'une étiquette, mesurée mais pas dessinée.
   *
   * ⚠⚠ DEUX PASSES OBLIGATOIRES : mesurer TOUTES les boîtes, retenir, puis
   * peindre. Peindre en mesurant ferait dépendre l'affichage de l'ordre de
   * parcours, ce que la règle de priorité interdit — et l'ordre de parcours est
   * celui où `sitesDeLaFenetre` a poussé ses sites, c'est-à-dire un détail
   * d'implémentation.
   *
   * ⚠ LA LARGEUR SE PREND À `ctx.measureText`, JAMAIS AU NOMBRE DE CARACTÈRES.
   * La police est en monospace aujourd'hui, ce qui rendrait l'approximation
   * juste par accident ; elle cesserait de l'être au premier changement de
   * police, et le recouvrement reviendrait sans que rien ne le dise.
   */
  function boiteDeLEtiquette(site, x, y, taille) {
    const lignes = lignesDeLEtiquette(site);
    const police = Math.max(1, Math.round(taille * ETIQUETTE_CARTE.partPolice));
    ctx.font = `${police}px monospace`;
    const marge = Math.round(police * 0.5);
    const interligne = Math.round(police * 1.25);
    const large = Math.max(...lignes.map((l) => ctx.measureText(l).width)) + marge * 2;
    const haut = lignes.length * interligne + marge;
    const cx = Math.round(x + taille / 2);
    return {
      lignes,
      police,
      marge,
      interligne,
      x: Math.round(cx - large / 2),
      y: Math.round(y + taille),
      largeur: Math.round(large),
      hauteur: haut,
      cx,
      priorite: prioriteDeLEtiquette(site.type),
      rangee: site.rangee,
      colonne: site.colonne,
    };
  }

  function dessinerEtiquette(boite) {
    ctx.font = `${boite.police}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = PALETTE.ombrePortee;
    ctx.fillRect(boite.x, boite.y, boite.largeur, boite.hauteur);
    ctx.fillStyle = ETIQUETTE_CARTE.encre;
    boite.lignes.forEach((ligne, i) => {
      ctx.fillText(ligne, boite.cx, boite.y + Math.round(boite.marge / 2) + i * boite.interligne);
    });
  }

  /**
   * Le contour de la base attaquante — PAR-DESSUS les emblèmes, et clignotant.
   *
   * ⚠⚠ IL EST PASSÉ AU-DESSUS, ET C'EST FORCÉ PAR « COLLER LA BASE ». Tant que
   * le halo débordait, le dessiner sous l'emblème n'en cachait rien ; un cadre
   * posé sur les bords de la case, lui, est intégralement recouvert —
   * `dessinerEmblemeDUneCase` rend `cote: taille`, donc l'emblème occupe la
   * case entière. Les frontières, elles, restent dessous : elles ceignent des
   * cases qui n'ont pas toutes un emblème, et couper un dessin qui dit ce qu'il
   * y a là serait la faute que le lot TERRITOIRE nomme déjà.
   *
   * ⚠ ÉTEINT, ON NE DESSINE RIEN — on ne peint pas un cadre transparent. La
   * palette du dépôt est fermée à trente-trois teintes et ne tolère qu'un seul
   * `rgba`, réservé à l'ombre portée ; un halo qui s'estomperait demanderait une
   * transparence de plus, donc une brèche dans la garde de palette.
   */
  function dessinerHalo(ox, oy, pas) {
    if (!haloAllumeAuTick(tickHalo)) return;
    const halo = geometrieDuHalo(baseCourante(etatCourant).position, ox, oy, pas);
    // Hors du canevas : rien à peindre, et un chemin à des milliers de pixels
    // coûterait quand même son tracé.
    if (halo.x + halo.cote < 0 || halo.y + halo.cote < 0
      || halo.x > canvas.width || halo.y > canvas.height) return;
    ctx.lineWidth = halo.epaisseur;
    ctx.strokeStyle = TEINTES_TERRITOIRE[JOUEUR];
    ctx.strokeRect(halo.x, halo.y, halo.cote, halo.cote);
  }

  /**
   * La flèche de la base halotée vers la cible ouverte, et le coût du raid.
   *
   * ⚠⚠ LE COÛT EST LE MÊME OBJET QUE CELUI DU PANNEAU, PAS UN SECOND CALCUL.
   * `ciblageOuvert` est rempli une fois par `ouvrirPanneau` ; la flèche le RELIT.
   * Le commentaire de `ciblageDuSite` interdit déjà d'écrire un second calcul du
   * coût, et il aurait raison de le faire ici : un panneau qui annonce 31 points
   * au-dessus d'une flèche qui en annonce 40 est pire que pas de flèche.
   *
   * ⚠ PAS DE FLÈCHE AU REPOS, ni vers sa propre base. `traitDeLaFleche` rend
   * `null` sur deux cases identiques, et il n'y a rien à dessiner sans panneau
   * ouvert.
   */
  function dessinerFleche(ox, oy, pas) {
    // ⚠⚠ LE TEST RESTE, SA RAISON A CHANGÉ — lot CARTE-A, 04/09. Il disait « pas
    // de flèche sans prix » : la flèche PORTAIT le nombre, et sans lui elle
    // n'aurait plus rien eu à dire. Elle ne le porte plus — Ethan : « ne pas
    // afficher les points d'attaque sur la flèche […] mais en gros dans
    // l'onglet ». Ce que `cout === null` dit maintenant, c'est HORS DE PORTÉE :
    // une flèche vers une cible qu'on ne peut pas atteindre promettrait un raid
    // que `problemesDuRaid` refusera. Le panneau, lui, écrit pourquoi.
    //
    // ⚠ ET LE COMMENTAIRE EST RÉÉCRIT PLUTÔT QUE LAISSÉ : un motif mort sous une
    // conclusion vivante est le mensonge que `CLAUDE.md` §6 raconte trois fois.
    if (siteOuvert === null || ciblageOuvert === null || ciblageOuvert.cout === null) return;
    // ⚠⚠ ROGNÉ AU BORD DU CANEVAS — lot CARTE-C, 06/09. Sans ça, une cible hors
    // du cadre laissait une BARRE NUE qui traverse la carte sans rien désigner :
    // sa pointe était hors écran. Voir `traitRogne` — c'est une SECONDE
    // opération, `traitDeLaFleche` rend toujours son trait de centre à centre.
    //
    // ⚠ EN PIXELS DE BUFFER, PAS EN PIXELS CSS : `ctx` peint dans le référentiel
    // du canevas, et c'est celui-là que `moveTo` et `lineTo` emploient deux
    // lignes plus bas.
    //
    // ⚠⚠ ET LE RETRAIT PASSE AVANT LE ROGNAGE — lot du 11/09. `geometrieDeLaFleche`
    // recule par rapport aux CASES, `traitRogne` coupe au bord du CANEVAS : dans
    // l'autre ordre, une cible hors du cadre aurait fait reculer la pointe à
    // l'intérieur de l'écran, et l'acquis de CARTE-C — « une flèche qui touche le
    // bord dit c'est par là » — serait perdu.
    const trait = traitRogne(
      traitDeLaFleche(baseCourante(etatCourant).position, siteOuvert, ox, oy, pas),
      canvas.width, canvas.height,
    );
    // ⚠⚠ LA GÉOMÉTRIE EST CALCULÉE AILLEURS, ET CETTE FONCTION NE FAIT PLUS QUE
    // PEINDRE. Les proportions de la flèche — le rapport de la pointe à la hampe,
    // qui EST le défaut qu'Ethan a rapporté trois fois — ne se vérifiaient que sur
    // appareil tant qu'elles vivaient dans cette boucle. Elles sont désormais dans
    // une fonction pure, et un test les tient.
    const fleche = geometrieDeLaFleche(trait, pas);
    if (fleche === null) return;
    ctx.strokeStyle = TEINTES_TERRITOIRE[JOUEUR];
    ctx.fillStyle = TEINTES_TERRITOIRE[JOUEUR];
    if (fleche.hampe !== null) {
      ctx.lineWidth = fleche.epaisseur;
      ctx.beginPath();
      ctx.moveTo(fleche.hampe.x1, fleche.hampe.y1);
      ctx.lineTo(fleche.hampe.x2, fleche.hampe.y2);
      ctx.stroke();
      // Le bout de départ, arrondi : un disque, pas un `lineCap` — voir la
      // géométrie, qui dit pourquoi le contexte ne prend pas d'état de plus.
      ctx.beginPath();
      ctx.arc(fleche.bouton.x, fleche.bouton.y, fleche.bouton.rayon, 0, Math.PI * 2);
      ctx.fill();
    }
    // La pointe : un triangle plein, à la tête du trait.
    ctx.beginPath();
    ctx.moveTo(fleche.pointe[0].x, fleche.pointe[0].y);
    ctx.lineTo(fleche.pointe[1].x, fleche.pointe[1].y);
    ctx.lineTo(fleche.pointe[2].x, fleche.pointe[2].y);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Les cases où la base peut aller, tant que le mode est armé.
   *
   * ⚠ ELLES VIENNENT DE `casesAtteignables`, QUI INTERROGE LA RÈGLE. Les
   * recalculer ici ferait une seconde liste de règles, et l'écran finirait par
   * montrer une case que le geste refuse — c'est ce que `casesPosables` de
   * l'écran Chantier évite déjà, avec le même commentaire.
   *
   * ⚠ UN LISERÉ, PAS UN APLAT. La carte est déjà pleine ; un aplat sur 316
   * cases cacherait le terrain et les sites qu'on essaie justement de viser.
   */
  function dessinerCasesDuDeplacement(ox, oy, pas) {
    if (!modeDeplacement || casesDuDeplacement.length === 0) return;
    const epaisseur = Math.max(1, Math.round(pas * EPAISSEUR_HALO));
    ctx.lineWidth = epaisseur;
    ctx.strokeStyle = TEINTES_TERRITOIRE[JOUEUR];
    const demi = epaisseur / 2;
    ctx.beginPath();
    for (const k of casesDuDeplacement) {
      const x = (k.colonne - 1) * pas - ox;
      const y = (k.rangee - 1) * pas - oy;
      if (x < -pas || y < -pas || x > canvas.width || y > canvas.height) continue;
      ctx.rect(x + demi, y + demi, pas - epaisseur, pas - epaisseur);
    }
    ctx.stroke();
  }

  function dessiner() {
    if (etatCourant === null || canvas.width === 0) return;
    const ox = origineX();
    const oy = origineY();
    const restent = dessinerFond(ox, oy);

    const pas = echelle;
    dessinerFrontieres(ox, oy, pas);
    dessinerRuines(ox, oy, pas);
    sitesAffiches = sitesDeLaFenetre(etatCourant, fenetreVisible({
      x: ox, y: oy, largeur: canvas.width, hauteur: canvas.height, cran: pas,
    }));
    for (const site of sitesAffiches) {
      // ⚠ LE NOMBRE DE CASES SE DEMANDE, IL NE SE RECONNAÎT PAS. `cotesDuSite`
      // rend `null` pour ce qui tient dans une case ; ajouter une seconde grosse
      // base sera une ligne dans `render/embleme.js`, pas ici.
      const cotes = cotesDuSite(site.type);
      if (cotes !== null) {
        dessinerGrosse(site, cotes, ox, oy, pas);
        continue;
      }
      dessinerEmbleme(
        site, (site.colonne - 1) * pas - ox, (site.rangee - 1) * pas - oy, pas,
      );
    }

    // ⚠ LES ÉTIQUETTES EN SECONDE PASSE, ET SEULEMENT ASSEZ PRÈS. Voir
    // `ETIQUETTE_CARTE` de `data/sites.js` : le seuil est mesuré sur la DENSITÉ,
    // pas sur la lisibilité d'une plaque isolée.
    if (pas / (fenetre.devicePixelRatio || 1) >= ETIQUETTE_CARTE.cssMiniParCase) {
      // ⚠⚠ MESURER, RETENIR, PEINDRE — trois temps, et ils ne se mélangent pas.
      // Le seuil dit à partir de quand une plaque est LISIBLE ; il ne dit rien
      // du recouvrement, et depuis qu'il est descendu à dix cases de large
      // (04/09) il y a de quoi se recouvrir. C'est `etiquettesRetenues` qui
      // tranche, et elle est pure.
      const boites = sitesAffiches.map((site) => boiteDeLEtiquette(
        site, (site.colonne - 1) * pas - ox, (site.rangee - 1) * pas - oy, pas,
      ));
      for (const indice of etiquettesRetenues(boites)) dessinerEtiquette(boites[indice]);
    }

    // ⚠ APRÈS LES EMBLÈMES, comme le contour de la base et contrairement aux
    // frontières : la flèche DOIT se lire par-dessus, c'est tout ce qu'elle a à
    // dire.
    dessinerHalo(ox, oy, pas);
    dessinerFleche(ox, oy, pas);
    dessinerCasesDuDeplacement(ox, oy, pas);

    // ⚠ ON NE RELANCE PAS D'IMAGE TANT QU'UNE PLANCHE MANQUE. Sans elles, aucune
    // dalle ne peut se calculer : la boucle tournerait à vide soixante fois par
    // seconde pour repeindre le même aplat. `chargerSols` redessine tout seul
    // quand la dernière arrive.
    if (restent && sols !== null && idImage === null && visible) {
      idImage = fenetre.requestAnimationFrame(() => {
        idImage = null;
        dessiner();
      });
    }
  }

  // --- le doigt --------------------------------------------------------------
  //
  // ⚠⚠ UN DOIGT PROMÈNE, DEUX DOIGTS ZOOMENT — 30/08. Ethan : « zoom carte et
  // base : au doigt, pas de zoom fixe avec + − ». Les deux boutons sont partis
  // du balisage ; le pincement les remplace.
  //
  // ⚠⚠ LE ZOOM EST CONTINU DEPUIS LE 04/09, ET LE PAVÉ QUI ÉTAIT ICI AVAIT UN
  // TROU. Ethan : « le zoom de la carte ne doit pas être par cran ». Ce pavé
  // déclarait le continu impossible parce qu'il « demanderait de recalculer les
  // dalles à chaque image — 19 ms pièce, mesuré ». Le raisonnement supposait
  // que l'échelle d'AFFICHAGE et l'échelle de RENDU sont la même grandeur :
  // elles ne le sont pas. `calculerDalle` fabrique une image à un cran de la
  // table, `drawImage` la pose à la taille qu'on veut, et `cranDeRendu` fait le
  // pont. Les dalles ne se recalculent donc qu'aux passages de cran — trois
  // fois sur toute la course.
  //
  // ⚠ CE QUE LE PAVÉ DISAIT DE JUSTE EST GARDÉ : ON NE GROSSIT JAMAIS DU PIXEL
  // ART. C'est la leçon du « gros carré moche » du 30/08. Le cran de rendu est
  // le plus PETIT qui soit ≥ à l'échelle, donc le facteur d'affichage tombe
  // dans (0,5 ; 1] et réduit toujours.
  //
  // ⚠ ET LE POINT DE RÉFÉRENCE SE REMET À CHAQUE IMAGE, sur l'écart RÉEL des
  // doigts. Le ré-ancrer sur une échelle refusée ferait « rendre » le pincement
  // au-delà de la butée avant que le dézoom ne reprenne.

  let pointeur = null;
  // ⚠ LES POINTEURS SE SUIVENT PAR IDENTIFIANT, PAS PAR COMPTEUR. Un doigt qui
  // quitte la dalle n'émet pas toujours `pointerup` ; un compteur qui ne
  // redescendrait jamais laisserait l'écran convaincu qu'on pince encore, et la
  // carte cesserait de se promener jusqu'au rechargement.
  const doigts = new Map();
  let pincement = null;

  /** L'écart entre deux doigts, en pixels CSS. */
  function ecartDesDoigts(deux) {
    return Math.hypot(deux[0].x - deux[1].x, deux[0].y - deux[1].y);
  }

  /** Le milieu des deux doigts, en pixels du CANEVAS. */
  function milieuDesDoigts(deux) {
    const cadre = canvas.getBoundingClientRect();
    const dpr = fenetre.devicePixelRatio || 1;
    return {
      x: ((deux[0].x + deux[1].x) / 2 - cadre.left) * dpr,
      y: ((deux[0].y + deux[1].y) / 2 - cadre.top) * dpr,
    };
  }

  /** Ouvre un pincement sur les deux doigts posés, s'ils sont deux. */
  function ouvrirPincement() {
    if (doigts.size !== 2) { pincement = null; return; }
    const deux = [...doigts.values()];
    const ecart = ecartDesDoigts(deux);
    // Deux doigts joints donneraient un rapport qui explose au premier pixel.
    if (ecart < 1) { pincement = null; return; }
    pincement = { ecart };
    // Le glissement d'un doigt ne doit pas devenir un toucher de site quand le
    // second se lève : un pincement n'ouvre pas de panneau.
    if (pointeur !== null) pointeur.glisse = true;
  }

  canvas.addEventListener('pointerdown', (evenement) => {
    canvas.setPointerCapture(evenement.pointerId);
    doigts.set(evenement.pointerId, { x: evenement.clientX, y: evenement.clientY });
    if (doigts.size >= 2) { ouvrirPincement(); return; }
    pointeur = {
      id: evenement.pointerId,
      x: evenement.clientX,
      y: evenement.clientY,
      departX: evenement.clientX,
      departY: evenement.clientY,
      glisse: false,
    };
  });

  canvas.addEventListener('pointermove', (evenement) => {
    if (doigts.has(evenement.pointerId)) {
      doigts.set(evenement.pointerId, { x: evenement.clientX, y: evenement.clientY });
    }
    if (pincement !== null && doigts.size === 2) {
      const deux = [...doigts.values()];
      const ecart = ecartDesDoigts(deux);
      // ⚠ LE RAPPORT DES ÉCARTS, PAS LEUR DIFFÉRENCE : une différence en pixels
      // zoomerait plus vite sur une grande dalle que sur une petite, pour le
      // même geste de la main.
      const rapport = ecart / pincement.ecart;
      // Deux doigts qui se rejoignent donneraient un rapport qui explose.
      if (ecart >= 1 && Number.isFinite(rapport)) {
        // Le point d'ancrage se relève AVANT le changement : après, les
        // coordonnées de vue ont déjà bougé. `reglerEchelle` borne lui-même.
        reglerEchelle(echelle * rapport, milieuDesDoigts(deux));
      }
      // ⚠ ON RÉ-ANCRE SUR L'ÉCART RÉEL, ET DANS TOUS LES CAS — y compris quand
      // la butée a refusé le changement. Ré-ancrer sur ce que l'échelle a
      // vraiment fait obligerait à « rendre » le pincement excédentaire avant
      // que le dézoom ne reprenne, et la carte resterait collée à la butée
      // pendant que les doigts se referment.
      pincement = { ecart };
      return;
    }
    if (pointeur === null || evenement.pointerId !== pointeur.id) return;
    const dpr = fenetre.devicePixelRatio || 1;
    vueX -= (evenement.clientX - pointeur.x) * dpr;
    vueY -= (evenement.clientY - pointeur.y) * dpr;
    pointeur.x = evenement.clientX;
    pointeur.y = evenement.clientY;
    // Trois pixels CSS de tolérance : un doigt ne se pose jamais parfaitement
    // immobile, et compter le moindre frémissement comme un défilement
    // rendrait le toucher d'un site impossible.
    if (Math.abs(evenement.clientX - pointeur.departX) > 3
      || Math.abs(evenement.clientY - pointeur.departY) > 3) pointeur.glisse = true;
    recadrer();
    dessiner();
  });

  function relacher(evenement) {
    doigts.delete(evenement.pointerId);
    if (doigts.size < 2) pincement = null;
    if (pointeur === null || evenement.pointerId !== pointeur.id) return;
    const aGlisse = pointeur.glisse;
    pointeur = null;
    if (aGlisse) return;
    const cadre = canvas.getBoundingClientRect();
    const dpr = fenetre.devicePixelRatio || 1;
    const px = (evenement.clientX - cadre.left) * dpr + origineX();
    const py = (evenement.clientY - cadre.top) * dpr + origineY();
    const colonne = Math.floor(px / echelle) + 1;
    const rangee = Math.floor(py / echelle) + 1;
    // ⚠ LE MODE DE DÉPLACEMENT PREND LA MAIN AVANT TOUT LE RESTE. Sans ça,
    // toucher une case occupée par un site ouvrirait son panneau au lieu de
    // poser la base, et le geste armé serait avalé par le geste ordinaire.
    if (modeDeplacement) {
      demanderLeDeplacement({ rangee, colonne });
      return;
    }
    // Le dernier dessiné est celui du dessus : on le cherche donc à l'envers.
    for (let i = sitesAffiches.length - 1; i >= 0; i -= 1) {
      const site = sitesAffiches[i];
      if (site.rangee === rangee && site.colonne === colonne) {
        // ⚠⚠ LE SECOND TOUCHER SE COMPARE À LA CASE OUVERTE, IL NE SE COMPTE
        // PAS. Un compteur ferait entrer au deuxième toucher n'importe où :
        // toucher un camp puis une base voisine entrerait dans la base, que le
        // joueur n'a regardée qu'une fois. Ce qui décide, c'est « est-ce la
        // MÊME case que celle dont le panneau parle ».
        if (siteOuvert !== null
          && siteOuvert.rangee === site.rangee && siteOuvert.colonne === site.colonne) {
          // ⚠ ET CE QU'IL FAIT DÉPEND DU TYPE — voir `gesteDuSecondToucher`. Sur
          // sa propre base on ENTRE dans la base ; partout ailleurs on entre
          // dans la cible, inchangé.
          //
          // ⚠ LE PANNEAU SE FERME EN PARTANT, DES DEUX CÔTÉS.
          // `entrerDansLaCible` le fait déjà ; sinon il resterait ouvert sur un
          // site qu'on ne regarde plus — c'est le motif écrit au bouton
          // « Ma base ».
          if (gesteDuSecondToucher(site) === 'base') {
            fermerPanneau();
            surEntreeBase();
            return;
          }
          entrerDansLaCible(site);
          return;
        }
        ouvrirPanneau(site);
        return;
      }
    }
    // ⚠⚠ LE SECOND CHEMIN DE TOUCHER — point 10 d'Ethan, 08/09 : « une base
    // détruite doit être cliquable et voir encore ses stats ». Il vient APRÈS la
    // boucle des sites, et c'est ce qui donne au SITE la priorité : si une case
    // portait les deux, la boucle ci-dessus a déjà rendu la main. C'est l'ordre
    // du DESSIN, où `dessinerRuines` passe avant les emblèmes pour la même
    // raison, et `PC T9` le mesure.
    //
    // ⚠⚠ ET LES RUINES N'ENTRENT PAS DANS `sitesAffiches`. C'est précisément le
    // chemin qui mène au bouton « Attaquer » : `sitesAffiches` est ce que le
    // second toucher interroge, ce que les étiquettes légendent, et ce que
    // `entrerDansLaCible` reçoit. Une passe à part garde la ruine en lecture
    // seule PAR CONSTRUCTION, sans un seul `if (type === 'ruine')` dans le chemin
    // du raid — voir `ouvrirRuine`, et `PC T8`, qui est le test qui compte.
    const ruine = ruineDeLaCase(etatCourant, rangee, colonne);
    if (ruine !== null) {
      ouvrirRuine(ruine);
      return;
    }
    fermerPanneau();
  }

  canvas.addEventListener('pointerup', relacher);
  canvas.addEventListener('pointercancel', (evenement) => {
    doigts.delete(evenement.pointerId);
    if (doigts.size < 2) pincement = null;
    if (pointeur !== null && evenement.pointerId === pointeur.id) pointeur = null;
  });

  // --- le toast des gisements -----------------------------------------------


  /**
   * Ce qui a été pris depuis le dernier passage — et qui le dit une fois.
   *
   * ⚠⚠ LA DÉTECTION SE FAIT PAR DIFFÉRENCE, CÔTÉ ÉCRAN, ET `releverLesPoisAcquis`
   * N'EST PAS TOUCHÉE. Elle est dans le chemin CHAUD — son propre commentaire
   * mesure 1 µs contre 45 µs selon l'ordre de ses gardes —, elle tourne à chaque
   * tick, et elle a trois appelants dont deux appartiennent à d'autres lots. Lui
   * faire émettre un évènement aurait fait payer à la simulation le prix d'un
   * message d'écran.
   *
   * ⚠⚠ LA PREMIÈRE MESURE EST MUETTE, ET C'EST CE QUI FAIT QU'UN RECHARGEMENT NE
   * REPARLE PAS. `poisConnus` vaut `null` tant que rien n'a été vu : on adopte
   * l'ensemble sans rien dire. Une partie chargée avec vingt gisements déjà pris
   * n'annonce donc rien — il n'y a aucune différence à annoncer, et le §6 du
   * brief le demande dans ces mots.
   *
   * ⚠ ELLE SE PLACE AVANT LA SORTIE ANTICIPÉE DE `rafraichir`, ET C'EST
   * OBLIGATOIRE. Prendre un gisement ne change pas `empreinteDeLaCarte` — ni la
   * base courante, ni les satellites, ni les ruines —, donc l'appeler après le
   * `return` l'aurait rendue muette dans le seul cas où elle sert.
   */
  function signalerLesPoisNeufs(etat) {
    const cles = clesDesPoisAcquis(etat.poisAcquis);
    if (poisConnus === null) {
      poisConnus = cles;
      return;
    }
    // ⚠⚠ ON RETIENT LES CLÉS, PLUS SEULEMENT LEUR NOMBRE — lot
    // ARRIVÉE-CARTE-ET-BUILD, 10/09. Le compte suffisait tant que le pop-up
    // disait la carte entière ; il ne dit plus que ce qui vient d'entrer, et un
    // nombre ne sait pas LESQUELS. C'est exactement ce que cette boucle voyait
    // déjà passer et jetait.
    const neufs = new Set();
    for (const cle of cles) if (!poisConnus.has(cle)) neufs.add(cle);
    poisConnus = cles;
    // ⚠ UN SEUL MESSAGE, MÊME POUR PLUSIEURS. Un déplacement fait entrer tout un
    // octogone d'un coup : trois pop-up à la file sur un téléphone, c'est deux de
    // trop. `phraseDesPoisAcquis` dit le nombre.
    //
    // ⚠⚠ ET IL OUVRE LA LISTE, PAS UNE PHRASE SEULE — point 11, 10/09. Ethan
    // demande les deux choses dans la même phrase : un pop-up plutôt qu'un toast,
    // et de quoi voir « les POI acquis. Et non acquis avec coordonnées ». Le
    // message EST donc la liste, titrée par la nouvelle : le joueur apprend qu'il
    // vient d'en prendre un et voit lequel sans un geste de plus.
    if (neufs.size > 0) ouvrirLesPois(phraseDesPoisAcquis(neufs.size), neufs);
  }

  // --- le panneau ------------------------------------------------------------

  /**
   * ⚠⚠ `problemesDuRaid` GARDE L'ENTRÉE, ET LE PANNEAU DIT POURQUOI. C'est
   * exactement ce pour quoi cette fonction rend une LISTE DE PHRASES plutôt
   * qu'un booléen : l'écran doit pouvoir refuser ET expliquer. Entrer puis
   * refuser à l'intérieur ferait faire un aller-retour pour rien.
   */
  function entrerDansLaCible(site) {
    if (etatCourant === null) return;
    const ciblage = ciblageDuSite(etatCourant, site);
    if (ciblage === null || ciblage.problemes.length > 0) {
      panneauRefus.textContent = ciblage === null
        ? 'Plus rien à attaquer ici.'
        : ciblage.problemes.map((p) => p.message).join(' ; ');
      panneauRefus.hidden = false;
      return;
    }
    fermerPanneau();
    surEntreeRaid({ rangee: site.rangee, colonne: site.colonne });
  }

  /**
   * Arme le mode de déplacement — le panneau se ferme, la carte montre où aller.
   *
   * ⚠ ON ARME MÊME QUAND C'EST IMPOSSIBLE, et c'est « un indice n'est pas une
   * interdiction » (§4 de CLAUDE.md). Un bouton mort n'apprend rien ; le refus
   * chiffré de `problemesDuDeplacement` — « il reste 3 h 20 à attendre » — en
   * apprend davantage, et il faut pouvoir le lire en appuyant.
   */
  function armerLeDeplacement() {
    if (etatCourant === null) return;
    modeDeplacement = true;
    casesDuDeplacement = casesAtteignables(etatCourant);
    fermerPanneau();
    // ⚠ LE MOT DIT CE QUI EST VRAI, ET IL SE LIT SUR `casesAtteignables`. Zéro
    // case atteignable signifie que quelque chose s'y oppose — le délai le plus
    // souvent —, et c'est `problemesDuDeplacement` qui sait le formuler. On lui
    // demande sur une case VOISINE, qui est à portée par construction : ce qui
    // reste alors dans la liste est ce qui ne dépend pas de la case.
    panneauRefus.hidden = false;
    panneauRefus.textContent = casesDuDeplacement.length > 0
      ? `Touchez une case à ${DEPLACEMENT.porteeMaxCases} cases au plus.`
      : problemesDuDeplacement(etatCourant, {
        rangee: baseCourante(etatCourant).position.rangee,
        colonne: baseCourante(etatCourant).position.colonne + 1,
      }).map((p) => p.message).join(' ; ');
    panneauTitre.textContent = 'Déplacer la base';
    panneauCorps.textContent = '';
    panneau.hidden = false;
    dessiner();
  }

  function desarmerLeDeplacement() {
    modeDeplacement = false;
    casesDuDeplacement = [];
    dessiner();
  }

  /**
   * Le refus d'un déplacement, dit dans le panneau — et le mode se désarme.
   *
   * ⚠ ELLE EXISTE PARCE QUE DEUX CHEMINS Y MÈNENT depuis la confirmation : le
   * toucher de la case, et l'accord donné. Écrire le refus deux fois aurait
   * donné deux formulations du même fait au premier ajustement.
   */
  function refuserLeDeplacement(problemes) {
    panneauTitre.textContent = 'Déplacer la base';
    panneauCorps.textContent = '';
    panneauConfirmation.hidden = true;
    panneauRefus.hidden = false;
    panneauRefus.textContent = problemes.map((p) => p.message).join(' ; ');
    panneau.hidden = false;
    deplacementEnAttente = null;
    desarmerLeDeplacement();
  }

  /**
   * Le second temps du geste : la case touchée est SOUMISE, elle n'est pas prise.
   *
   * ⚠⚠ LA CONFIRMATION S'INTERCALE ICI, ENTRE LE TOUCHER ET LE DÉPLACEMENT —
   * lot DÉPLACEMENT-ÉCLAIRÉ, 07/09. Ethan, point 1. Elle ne pouvait pas
   * s'intercaler entre le bouton et l'armement : le chiffre qu'elle annonce est
   * celui de la case VISÉE, et cette case n'est pas connue avant qu'on la
   * touche.
   *
   * ⚠ ON DEMANDE, PUIS ON DÉPLACE — jamais un `try` autour de `deplacerLaBase`.
   * `problemesDuDeplacement` rend une LISTE, `deplacerLaBase` LÈVE, et la
   * différence est la règle du dépôt : un déplacement refusé est un fait de JEU
   * qu'on montre au joueur, une levée est un fait de PROGRAMME. Rattraper la
   * levée traiterait la seconde comme la première.
   *
   * ⚠⚠ ET LE REFUS PASSE AVANT LA CONFIRMATION : on ne demande pas d'accord pour
   * un geste qui sera refusé. Un joueur à qui l'on demanderait « êtes-vous
   * sûr ? » avant de répondre « la base vient de se déplacer » aurait fait deux
   * gestes pour un refus.
   */
  function demanderLeDeplacement(cible) {
    if (etatCourant === null) return;
    const problemes = problemesDuDeplacement(etatCourant, cible);
    if (problemes.length > 0) {
      refuserLeDeplacement(problemes);
      return;
    }
    deplacementEnAttente = cible;
    panneauTitre.textContent = 'Déplacer la base';
    // ⚠⚠ LE BILAN SE CALCULE ICI, UNE FOIS, ET IL SE RETIENT DANS LE DOM —
    // point 5 d'Ethan, 08/09 : « lorsqu'on déplace une base, faire une simulation
    // de territoire ». `territoireDeLaFenetre` peint quelques milliers de cases,
    // et il est appelé DEUX fois : c'est payable au moment d'un toucher, ce ne le
    // serait pas à chaque image. Le recalculer dans `dessiner` est très
    // exactement ce que `PC T3` mesure — c'est le motif que `ciblageOuvert` porte
    // déjà, deux fonctions plus bas.
    //
    // ⚠ ET IL ENTRE DANS LE MÊME CORPS DE PANNEAU QUE LES LIGNES D'UN SITE, par
    // le même peintre : le §2.1 du brief dit que la simulation « entre au même
    // endroit, par la même porte » que le chiffre de menace, et il ne s'agit pas
    // d'un second écran.
    // ⚠⚠ LE DÉLAI ENTRE PAR LA MÊME PORTE QUE LE BILAN, ET IL SE CALCULE UNE
    // FOIS — point 6, 10/09, Ethan : « indiquer temps de déplacement avant
    // confirmation ». `peindreLesLignes` est appelée UNE fois avec les cinq
    // lignes ; un second appel, ou un second panneau, remettrait le recalcul à
    // chaque image et casserait la discipline que `PC T3` mesure.
    peindreLesLignes([
      ...lignesDeLAttente(delaiDuDeplacementVers(etatCourant, cible)),
      ...lignesDuBilan(bilanDuTerritoire(etatCourant, cible)),
    ]);
    panneauRefus.hidden = true;
    panneauRefus.textContent = '';
    // ⚠⚠ LE CHIFFRE VIENT DU MOTEUR, ET C'EST TOUT L'ENJEU DU LOT.
    // `nombreDAttaquantes` est la fonction dont `basesAttaquantes` s'exprime
    // elle-même : une seule écriture des trois conditions — portée, type,
    // niveau minimal —, deux lecteurs. Le recompter ici l'aurait rendu faux de
    // la pire façon : plausible, stable, et démenti par le premier raid subi.
    panneauMenace.textContent = phraseDesAttaquantes(
      nombreDAttaquantes(etatCourant, cible),
    );
    panneauConfirmation.hidden = false;
    panneau.hidden = false;
    dessiner();
  }

  /**
   * Renoncer : on revient à l'état d'avant le toucher.
   *
   * ⚠ LE MODE SE DÉSARME, la base ne bouge pas, et rien n'a été engagé — un
   * déplacement ne coûte aucune ressource, et il n'a pas encore consommé son
   * délai, qui s'écrit dans `deplacerLaBase` et nulle part ailleurs.
   */
  function renoncerAuDeplacement() {
    deplacementEnAttente = null;
    panneauConfirmation.hidden = true;
    desarmerLeDeplacement();
    fermerPanneau();
  }

  /**
   * L'accord donné : la case retenue devient la nouvelle position.
   *
   * ⚠⚠ ON REDEMANDE LES PROBLÈMES, ET CE N'EST PAS UNE PRÉCAUTION DÉCORATIVE.
   * Entre le toucher et l'accord, la session continue de tourner : un raid de
   * l'Ouvrage peut se résoudre, et `raserLaBase` DÉPLACE la base de vingt
   * rangées. La case visée devient alors hors de portée — ou celle où la base
   * se trouve déjà. Sans cette relecture, `deplacerLaBase` LÈVERAIT au milieu
   * d'un geste légal au moment où le joueur l'a commencé.
   *
   * ⚠ ET IL EST INERTE SANS CASE RETENUE. `deplacementEnAttente` vaut `null`
   * partout ailleurs : un bouton qu'un lot futur laisserait vif ne déplacerait
   * rien.
   */
  function confirmerLeDeplacement() {
    if (etatCourant === null || deplacementEnAttente === null) return;
    const cible = deplacementEnAttente;
    deplacementEnAttente = null;
    panneauConfirmation.hidden = true;
    const problemes = problemesDuDeplacement(etatCourant, cible);
    if (problemes.length > 0) {
      refuserLeDeplacement(problemes);
      return;
    }
    deplacerLaBase(etatCourant, cible);
    desarmerLeDeplacement();
    fermerPanneau();
    centrerSur(baseCourante(etatCourant).position);
    apresDeplacement();
    dessiner();
  }

  /**
   * Le corps du panneau, peint depuis une liste `{ quoi, valeur }`.
   *
   * ⚠⚠ UN SEUL PEINTRE POUR LES TROIS PANNEAUX — le site, le bilan d'un
   * déplacement, la ruine. Il était écrit une fois, dans `ouvrirPanneau`, du
   * temps où le panneau n'avait qu'un contenu ; ce lot lui en donne deux de plus,
   * et trois boucles voisines qui montent les mêmes trois nœuds finiraient par ne
   * plus les monter pareil — la feuille ne stylant que `.ligne` et `.quoi`, la
   * divergence se verrait à l'écran et pas au diff.
   *
   * ⚠ IL VIDE AVANT DE POSER. Chaque appelant écrivait `panneauCorps.textContent
   * = ''` de son côté ; l'oublier une fois empilerait les lignes à chaque
   * rafraîchissement du compte à rebours d'une ruine, dix fois par seconde.
   */
  function peindreLesLignes(lignes) {
    panneauCorps.textContent = '';
    for (const ligne of lignes) {
      const bloc = doc.createElement('div');
      bloc.className = 'ligne';
      const quoi = doc.createElement('span');
      quoi.className = 'quoi';
      quoi.textContent = ligne.quoi;
      const valeur = doc.createElement('b');
      valeur.textContent = ligne.valeur;
      bloc.append(quoi, valeur);
      panneauCorps.appendChild(bloc);
    }
  }

  function ouvrirPanneau(site) {
    // ⚠⚠ TOUCHER UNE AUTRE DE SES BASES LA HALOTE, ET C'EST ELLE QUI ATTAQUE —
    // point 3 de la spec Carte, ouvert au lot BASES-1. **LECTURE PRISE** :
    // haloter et basculer sont le MÊME geste, donc le toucher écrit
    // `etat.baseCourante` et tous les écrans suivent. Deux notions distinctes —
    // « la base affichée » et « la base qui attaque » — se
    // désynchroniseraient à la première inattention, et le joueur lancerait un
    // raid depuis une base qu'il ne regarde pas.
    //
    // ⚠ AVANT LE CIBLAGE, PAS APRÈS. Le prix d'un raid et la portée se comptent
    // depuis la base COURANTE : ouvrir le panneau puis basculer afficherait le
    // prix de l'ancienne base, et la flèche partirait du mauvais endroit.
    if (site.indiceBase !== undefined && site.indiceBase !== etatCourant.baseCourante) {
      basculerVersLaBase(etatCourant, site.indiceBase);
      apresBascule();
    }
    siteOuvert = { rangee: site.rangee, colonne: site.colonne };
    // ⚠ LE MÊME LIBELLÉ QUE L'ÉTIQUETTE, ET PAR LA MÊME FONCTION. Le joueur ne
    // doit pas lire deux noms pour la même base à deux endroits de l'écran —
    // la plaque sous la case dit « Base n°1 », le titre aussi.
    panneauTitre.textContent = nomDuSite(site);
    // ⚠ LES TROIS NOMBRES DE CIBLAGE VIENNENT DES BRIQUES, PAS DE L'ÉCRAN.
    const ciblage = ciblageDuSite(etatCourant, site);
    // ⚠⚠ ET LA FLÈCHE RELIT CE MÊME OBJET. Le rappeler pour elle donnerait deux
    // valeurs qui peuvent diverger, et le joueur verrait un prix sur la flèche
    // et un autre dans le panneau.
    ciblageOuvert = ciblage;
    // ⚠⚠ LE BLOC RELIT `ciblage`, IL NE RAPPELLE PAS LE BARÈME. C'est ce que le
    // commentaire de `ciblageDuSite` interdit depuis le lot RETOURS-DU-31 : un
    // panneau qui annoncerait 31 points au-dessus d'une flèche qui en annonce 40
    // serait pire que pas de flèche du tout. Un seul calcul, un seul afficheur.
    //
    // ⚠ ET LE SOLDE VIENT DE `etat.attaque`, la paire que la tuile du bandeau
    // montre déjà. Le recomposer donnerait deux comptes du même stock.
    const prix = ciblage === null ? null : ciblage.cout;
    panneauPrix.hidden = prix === null;
    if (prix !== null) {
      panneauPrixCout.textContent = String(prix);
      panneauPrixSolde.textContent = `${etatCourant.attaque.points} / ${etatCourant.attaque.plafond}`;
    }
    panneauRefus.hidden = ciblage === null || ciblage.problemes.length === 0;
    panneauRefus.textContent = ciblage === null ? ''
      : ciblage.problemes.map((p) => p.message).join(' ; ');
    peindreLesLignes(lignesDuSite(
      site, baseCourante(etatCourant).position, etatCourant.poisAcquis, ciblage,
    ));
    // ⚠⚠ LE BOUTON N'APPARAÎT QUE SUR SA PROPRE BASE. Sur un camp ou une base de
    // l'Ouvrage il n'aurait aucun sens, et le panneau retomberait dans la faute
    // qu'il combat depuis le 27/08 : promettre un geste qui n'existe pas là.
    panneauDeplacer.hidden = gesteDuSecondToucher(site) !== 'base';
    // ⚠⚠ LE DISCRIMINANT N'EST PAS INVENTÉ : C'EST CELUI DE LA FLÈCHE. Le bouton
    // ne doit exister que là où `entrerDansLaCible` a un sens, et l'écran le sait
    // déjà — `ciblageDuSite` rend `null` sur sa propre base comme sur une case
    // sans rien à attaquer, et c'est exactement ce que `dessinerFleche` lit deux
    // lignes plus haut pour décider de peindre. En écrire une troisième version
    // ici donnerait un bouton visible sous une flèche absente.
    panneauAttaquer.hidden = ciblage === null;
    // ⚠ HORS DE PORTÉE, IL SE VOIT ET NE SE TOUCHE PAS — `cout === null` EST
    // « hors de portée », le motif que `dessinerFleche` porte depuis CARTE-A. Un
    // bouton absent laisserait le joueur chercher ; un bouton éteint lui dit
    // qu'il y a quelque chose à faire pour l'allumer, et `panneauRefus` écrit
    // déjà quoi, deux lignes plus bas.
    //
    // ⚠ ET LES AUTRES REFUS NE L'ÉTEIGNENT PAS. Manquer de points d'attaque est
    // un fait qui change à la minute : « un indice n'est pas une interdiction »
    // (§4), et `entrerDansLaCible` refuse ET chiffre en appuyant.
    panneauAttaquer.disabled = ciblage === null || ciblage.cout === null;
    panneau.hidden = false;
    // ⚠ LA FLÈCHE NAÎT AVEC LE PANNEAU, donc l'ouverture repeint. Sans ça elle
    // n'apparaîtrait qu'au prochain geste sur la carte — la boucle de dessin ne
    // tourne pas au repos, `dessiner` n'est rappelée que par ce qui bouge.
    dessiner();
  }

  /**
   * Le panneau d'une ruine — EN LECTURE SEULE, et c'est tout ce qu'il est.
   *
   * ⚠⚠ CE QUE LE COMMENTAIRE DE `dessinerRuines` CRAIGNAIT RESTE ENTIÈREMENT
   * VALABLE : une ruine ne doit PAS devenir attaquable. Ce qui change est la
   * conclusion, pas le raisonnement. Elle est cliquable — Ethan, 08/09 — et elle
   * ouvre un panneau qui ne porte AUCUN bouton d'action : ni « Attaquer », ni
   * « Déplacer la base », ni la confirmation d'un déplacement.
   *
   * ⚠⚠ ET `siteOuvert` RESTE `null`, CE QUI N'EST PAS UNE PRÉCAUTION DE PLUS MAIS
   * LA MÊME, PRISE PAR L'AUTRE BOUT. C'est cette variable-là que l'écouteur du
   * bouton d'attaque relit — `if (siteOuvert !== null) entrerDansLaCible(...)` —
   * et c'est elle que le SECOND toucher compare. La laisser pointer sur la case
   * d'une ruine rendrait le chemin du raid atteignable depuis un bouton caché, le
   * jour où un lot futur le sortirait du panneau. `ciblageOuvert` reste `null`
   * avec elle, donc la flèche ne se peint pas non plus.
   *
   * ⚠ IL N'APPELLE PAS `fermerPanneau` D'ABORD. Elle repeint la carte pour rien —
   * on va la repeindre en sortant —, et surtout elle remettrait `panneau.hidden`
   * à vrai entre deux images. Chaque champ est posé explicitement, comme
   * `ouvrirPanneau` le fait déjà.
   */
  /**
   * Le panneau des soixante-dix gisements — ce que le bouton ouvre, et le pop-up.
   *
   * ⚠⚠ C'EST LE PANNEAU DE L'ÉCRAN, PAS UN QUATRIÈME DESSIN — point 11 d'Ethan,
   * 10/09. `#monde-panneau` sert déjà les sites et les ruines, et il pose ses
   * lignes par `peindreLesLignes` : lui en ajouter un second aurait mis deux DOM
   * voisins dans le même coin, dont un seul serait éprouvé. C'est le motif
   * d'`ouvrirRuine`, repris à la lettre — même titre, mêmes lignes, et tout ce
   * qui appartient à un SITE explicitement refermé.
   *
   * ⚠⚠ ET LES DEUX MOITIÉS DU POINT 11 PASSENT PAR ICI. `annonce` porte la
   * nouvelle quand un gisement vient d'être pris — c'est le « pop-up » qui
   * remplace le toast — et vaut `null` quand c'est le bouton qui ouvre. Un
   * second chemin pour la seconde moitié aurait donné deux panneaux qui disent la
   * même chose, dont un seul suivrait le prochain réglage.
   *
   * ⚠⚠ ET DEPUIS LE 10/09 LES DEUX NE DISENT PLUS LA MÊME LISTE. `selection`
   * porte les clés qui viennent d'entrer ; le bouton passe `null` et garde les
   * soixante-dix. Ethan, à « une acquisition annonce donc la carte entière — le
   * filtrer ? » : **« Oui »**. Les deux arguments vont ENSEMBLE — une annonce
   * sans sélection redirait la carte entière sous un titre qui parle d'un seul
   * gisement — et c'est le même appel qui les pose tous les deux.
   *
   * ⚠ RIEN N'EST RECALCULÉ ICI : `vueDesPois` est PURE, elle lit `sim/poi.js`, et
   * elle est éprouvée sans écran. L'écran ne fait que poser ce qu'elle rend.
   */
  /**
   * La mini-carte — l'empreinte de ce qu'elle montre, pour ne pas la repeindre.
   *
   * ⚠⚠ ELLE NE SE DESSINE QU'À L'OUVERTURE, ET C'EST UNE MESURE. Le canevas fait
   * 1080 × 1920, soit 2,07 mégapixels ; le repeindre à chaque image coûterait
   * 1 659 rectangles et deux mégapixels de remplissage soixante fois par seconde
   * pour un panneau qu'on regarde trois secondes. Un dessin à l'ouverture, un
   * autre si l'état change, et rien de plus.
   *
   * ⚠ LES QUATRE TERMES NE FONT QUE CROÎTRE, DONC LEUR LONGUEUR SUFFIT.
   * `poisAcquis` ne se vide jamais — « un POI pris reste pris » —, `basesRasees`
   * non plus — la purge d'une entrée périmée est INTERDITE, elle ferait
   * reparaître la base. La graine ne bouge pas de la partie. Seule la position
   * d'une base bouge vraiment, et elle est écrite en clair.
   */
  function empreinteDeLaMiniCarte(etat) {
    const bases = etat.bases.map((b) => `${b.position.rangee}:${b.position.colonne}`).join(',');
    return `${etat.graine}|${bases}|${(etat.poisAcquis ?? []).length}`
      + `|${(etat.basesRasees ?? []).length}`;
  }

  let empreinteMiniCarte = null;

  /**
   * Le dessin de la mini-carte : les bandes du sol, puis les marqueurs.
   *
   * ⚠⚠ AUCUNE PLANCHE DE SOL ICI, ET C'EST LE POINT LE PLUS COÛTEUX DU §4. Les
   * vingt-deux planches pèsent 2,2 Mo en base64 et se dessinent à 704 pixels de
   * côté : à SIX pixels de haut par rangée, il n'en resterait qu'un bruit. Le
   * sol est donc rendu en APLATS, un par bande de niveaux — celles-là mêmes que
   * le panneau des gisements nomme sur chaque ligne.
   *
   * ⚠ RIEN D'AUTRE NE SE DESSINE : ni territoire peint, ni emblème de site, ni
   * satellite. À six pixels de haut, une carte chargée est une carte illisible,
   * et c'est la consigne du brief à la lettre.
   *
   * ⚠ LE CANEVAS SE DIMENSIONNE ICI, EN PIXELS D'APPAREIL, et il n'est pas
   * question de `devicePixelRatio` : 1080 × 1920 est le TAMPON qu'Ethan demande.
   * C'est le CSS qui décide de la surface, et `height: auto` lui garde le 1:1 sur
   * un écran de 360 px de large à `devicePixelRatio` 3.
   */
  function dessinerLaMiniCarte() {
    if (etatCourant === null) return;
    miniCanvas.width = MINI_LARGEUR;
    miniCanvas.height = MINI_HAUTEUR;
    const g = miniCanvas.getContext('2d');
    for (const bande of bandesDuSol()) {
      g.fillStyle = bande.teinte;
      g.fillRect(0, bande.y, MINI_LARGEUR, bande.hauteur);
    }
    const marqueurs = marqueursDeLaMiniCarte({
      graine: etatCourant.graine,
      poisAcquis: etatCourant.poisAcquis,
      positions: etatCourant.bases.map((b) => b.position),
      rasees: casesRasees(etatCourant),
    });
    for (const m of marqueurs) {
      g.fillStyle = m.teinte;
      g.fillRect(m.x, m.y, m.largeur, m.hauteur);
    }
    empreinteMiniCarte = empreinteDeLaMiniCarte(etatCourant);
  }

  /**
   * Ouvre la mini-carte, et ne la redessine que si ce qu'elle montre a bougé.
   *
   * ⚠ ELLE FERME LE PANNEAU DE SITE. Les deux ne se lisent pas ensemble — la
   * mini-carte couvre le champ — et laisser une fiche ouverte dessous ferait
   * reparaître un « Attaquer » armé sur une cible qu'on ne voit plus.
   */
  function ouvrirLaMiniCarte() {
    if (etatCourant === null) return;
    desarmerLeDeplacement();
    fermerPanneau();
    if (empreinteMiniCarte !== empreinteDeLaMiniCarte(etatCourant)) dessinerLaMiniCarte();
    miniPanneau.hidden = false;
    cadrerLaMiniCarteSurLaBase();
  }

  /**
   * Le cadrage d'ouverture : la base courante, au milieu de ce qui est visible.
   *
   * ⚠⚠ ELLE S'OUVRE SUR SOI, ET C'EST UNE MESURE QUI L'A EXIGÉ. Relevé dans
   * Chromium à la géométrie du S25 FE : le canevas s'affiche sur **640 px CSS**
   * de haut pour un corps qui en montre **588** — il reste 52 px sous le pli. La
   * base de départ est rangée 295 sur 300, donc EXACTEMENT sous ce pli : ouvrir
   * en haut de page montrait tout sauf l'endroit où le joueur se trouve.
   *
   * ⚠ L'ÉCHELLE SE MESURE, ELLE NE SE SUPPOSE PAS. Le tampon fait 1 920 px et le
   * CSS décide de la hauteur affichée : le rapport des deux est le seul lien
   * entre une rangée et un défilement, et écrire `devicePixelRatio` à sa place
   * serait juste sur un écran de 360 px de large et faux partout ailleurs.
   *
   * ⚠ ET LE NAVIGATEUR BORNE `scrollTop` DE LUI-MÊME — une valeur négative vaut
   * zéro, une valeur trop grande vaut le maximum. Le calcul n'a donc rien à
   * borner, et le faux document des tests n'a rien à apprendre.
   */
  function cadrerLaMiniCarteSurLaBase() {
    const hauteurCss = miniCanvas.clientHeight;
    if (!hauteurCss) return;
    const echelle = hauteurCss / MINI_HAUTEUR;
    const y = bordY(baseCourante(etatCourant).position.rangee) * echelle;
    miniCorps.scrollTop = y - miniCorps.clientHeight / 2;
  }

  function fermerLaMiniCarte() {
    miniPanneau.hidden = true;
  }

  function ouvrirLesPois(annonce = null, selection = null) {
    if (etatCourant === null) return;
    // ⚠ CE QUI APPARTIENT À UN SITE S'EN VA, ET LA LISTE EST EXHAUSTIVE — c'est
    // ce qu'`ouvrirRuine` fait juste en dessous, et pour la même raison : le
    // panneau est PARTAGÉ, donc ce qu'on n'éteint pas reste allumé sous une autre
    // matière. Un bouton « Attaquer » laissé là pointerait sur le dernier site
    // ouvert, depuis un panneau qui parle de gisements.
    siteOuvert = null;
    ciblageOuvert = null;
    ruineOuverte = null;
    deplacementEnAttente = null;
    const vue = vueDesPois(etatCourant.graine, etatCourant.poisAcquis, selection);
    panneauTitre.textContent = annonce === null ? vue.titre : `${annonce} ${vue.titre}`;
    peindreLesLignes(vue.lignes);
    panneauPrix.hidden = true;
    panneauRefus.hidden = true;
    panneauRefus.textContent = '';
    panneauConfirmation.hidden = true;
    panneauDeplacer.hidden = true;
    panneauAttaquer.hidden = true;
    panneau.hidden = false;
    dessiner();
  }

  function ouvrirRuine(ruine) {
    siteOuvert = null;
    ciblageOuvert = null;
    deplacementEnAttente = null;
    ruineOuverte = {
      rangee: ruine.rangee,
      colonne: ruine.colonne,
      reste: resteDeLaRuine(ruine, etatCourant.horloge.nbTicks),
    };
    panneauTitre.textContent = nomDeLaRuine(ruine);
    peindreLesLignes(lignesDeLaRuine(ruine, etatCourant.horloge.nbTicks));
    panneauPrix.hidden = true;
    panneauRefus.hidden = true;
    panneauRefus.textContent = '';
    panneauConfirmation.hidden = true;
    panneauDeplacer.hidden = true;
    panneauAttaquer.hidden = true;
    panneau.hidden = false;
    dessiner();
  }

  /**
   * Le compte à rebours d'une ruine ouverte — et sa fermeture quand elle expire.
   *
   * ⚠⚠ LA RUINE EXPIRE PENDANT QUE LE PANNEAU EST OUVERT, ET C'EST LE DÉFAUT LE
   * PLUS PROBABLE DU POINT 10. Vingt-quatre heures se rattrapent hors ligne, mais
   * elles se terminent aussi sous les yeux du joueur : un panneau qui annoncerait
   * « il reste 0 s » pour toujours serait la seule chose que ce § peut laisser à
   * l'écran. `ruineDeLaCase` passe par `ruinesActives`, donc elle rend `null` à
   * l'instant exact où la ruine cesse d'émettre, et le panneau se ferme.
   *
   * ⚠⚠ ET IL NE SE REPEINT QUE QUAND LE TEXTE CHANGE. `rafraichir` passe dix fois
   * par seconde ; remonter quatre nœuds à chaque passage les ferait clignoter
   * sous le doigt pour une image identique — c'est le motif que la mini-fenêtre
   * du tutoriel porte déjà sous le nom de signature. La durée est le seul champ
   * qui bouge, donc c'est elle qu'on compare.
   *
   * ⚠ ELLE SE PLACE AVANT LA SORTIE ANTICIPÉE DE `rafraichir`, comme le relevé
   * des gisements. `empreinteDeLaCarte` porte bien les cases des ruines actives —
   * donc l'expiration la fait changer, et le dessin suit —, mais elle ne porte
   * pas l'HEURE : sans cet appel-ci, le compte à rebours resterait figé sur la
   * valeur qu'il avait à l'ouverture.
   */
  function rafraichirLaRuine(etat) {
    if (ruineOuverte === null) return;
    const ruine = ruineDeLaCase(etat, ruineOuverte.rangee, ruineOuverte.colonne);
    if (ruine === null) {
      fermerPanneau();
      return;
    }
    const reste = resteDeLaRuine(ruine, etat.horloge.nbTicks);
    if (reste === ruineOuverte.reste) return;
    ruineOuverte.reste = reste;
    peindreLesLignes(lignesDeLaRuine(ruine, etat.horloge.nbTicks));
  }

  function fermerPanneau() {
    panneau.hidden = true;
    panneauDeplacer.hidden = true;
    // ⚠ MÊME MOTIF QUE LA LIGNE AU-DESSUS : il est DANS le panneau aujourd'hui,
    // donc le cacher ne se voit pas — mais le premier lot qui le sortirait de là
    // hériterait d'un bouton d'attaque orphelin, pointant sur une case fermée.
    panneauAttaquer.hidden = true;
    // ⚠ LE BLOC DE PRIX SE FERME AVEC LE PANNEAU. Le laisser visible sous un
    // panneau caché ne se verrait pas aujourd'hui — il est DANS le panneau —
    // mais le premier lot qui le sortirait de là hériterait d'un prix orphelin.
    panneauPrix.hidden = true;
    // ⚠⚠ ET LA CONFIRMATION PART AVEC, ACCORD EN ATTENTE COMPRIS. Le bouton
    // « Fermer » est une porte de sortie comme une autre : la laisser fermer le
    // panneau en gardant `deplacementEnAttente` armé rendrait le déplacement
    // exécutable par un bouton que plus personne ne voit.
    panneauConfirmation.hidden = true;
    deplacementEnAttente = null;
    siteOuvert = null;
    ciblageOuvert = null;
    // ⚠ LA RUINE OUVERTE PART AVEC LE RESTE, ET C'EST CE QUI ARRÊTE SON COMPTE À
    // REBOURS. `rafraichirLaRuine` sort sur `null` : la laisser posée ferait
    // réécrire dix fois par seconde le corps d'un panneau que plus personne ne
    // voit, et surtout le rouvrirait tout seul au prochain rafraîchissement.
    ruineOuverte = null;
    dessiner();
  }

  // ⚠⚠ REVENIR SUR SA BASE — Ethan, 31/08. La vue ne se recentre qu'à la
  // PREMIÈRE ouverture de la carte, et c'est délibéré (voir `peindre`) : y
  // revenir de force à chaque visite ferait perdre l'endroit qu'on regardait.
  // Le corollaire, c'est qu'un joueur parti à trente rangées de chez lui n'avait
  // aucun moyen de rentrer — sinon défiler à l'aveugle sur une carte de 300
  // rangées. Ce bouton est ce moyen, et il ne fait QUE ça.
  //
  // ⚠ IL RECENTRE, IL NE CHANGE PAS DE CRAN. Ramener aussi le zoom au défaut
  // ferait deux gestes en un et retirerait au joueur le cran qu'il avait choisi.
  //
  // ⚠ ET IL FERME LE PANNEAU. Il restait ouvert sur le site qu'on regardait
  // avant de partir, donc sur un site qui n'est plus sous les yeux : il
  // décrirait un endroit que la carte ne montre plus.
  $('monde-recentrer').addEventListener('click', () => {
    if (etatCourant === null) return;
    fermerPanneau();
    centrerSur(baseCourante(etatCourant).position);
    dessiner();
  });

  // ⚠⚠ LE BOUTON DES GISEMENTS — point 11, 10/09. Il ouvre la MÊME liste que le
  // pop-up d'acquisition, sans annonce : c'est le second chemin vers un seul
  // panneau, pas un second panneau.
  //
  // ⚠ IL DÉSARME LE DÉPLACEMENT AVANT D'OUVRIR, comme « Ma base » juste
  // au-dessus. Sans ça, le mode resterait armé derrière la liste et le prochain
  // toucher sur la carte déplacerait la base — la faute que le « Fermer »
  // ci-dessous garde déjà.
  $('monde-poi').addEventListener('click', () => {
    if (etatCourant === null) return;
    desarmerLeDeplacement();
    ouvrirLesPois();
  });

  // ⚠⚠ LA MINI-CARTE — point 12, 10/09. Même geste que ses deux voisins : elle
  // désarme le déplacement avant d'ouvrir, sans quoi le mode resterait armé
  // derrière un panneau qui couvre tout le champ, et le premier toucher après la
  // fermeture déplacerait la base.
  $('monde-mini').addEventListener('click', ouvrirLaMiniCarte);
  $('monde-mini-fermer').addEventListener('click', fermerLaMiniCarte);

  $('monde-panneau-fermer').addEventListener('click', () => {
    // ⚠ FERMER DÉSARME AUSSI. Sans ça, le mode resterait armé sous un panneau
    // fermé, et le prochain toucher sur la carte déplacerait la base sans que
    // rien ne l'ait annoncé.
    desarmerLeDeplacement();
    fermerPanneau();
  });
  panneauDeplacer.addEventListener('click', armerLeDeplacement);
  panneauConfirmer.addEventListener('click', confirmerLeDeplacement);
  panneauRenoncer.addEventListener('click', renoncerAuDeplacement);
  // ⚠⚠ LE MÊME CHEMIN QUE LE SECOND TOUCHER, PAS UN SECOND. `entrerDansLaCible`
  // garde déjà l'entrée par `problemesDuRaid` et écrit le refus ; un bouton qui
  // appellerait `surEntreeRaid` lui-même contournerait la garde, et le joueur
  // entrerait sur une cible que l'écran de raid refuserait ensuite.
  //
  // ⚠ ET IL PASSE `siteOuvert`, LA CASE DONT LE PANNEAU PARLE. `ciblageDuSite`
  // et `surEntreeRaid` ne lisent que la rangée et la colonne — vérifié —, donc
  // il n'y a pas de site complet à retenir en plus, ni de risque qu'il vieillisse
  // pendant que le panneau est ouvert.
  panneauAttaquer.addEventListener('click', () => {
    if (siteOuvert !== null) entrerDansLaCible(siteOuvert);
  });
  // ⚠ IL SE FERME EXPLICITEMENT AU CÂBLAGE. Le `hidden` du balisage suffit
  // aujourd'hui, mais il serait la SEULE chose à le tenir fermé au démarrage :
  // un attribut oublié à la prochaine reprise du HTML l'ouvrirait par-dessus la
  // carte sans qu'aucun test le voie.
  fermerPanneau();

  if (typeof fenetre.ResizeObserver === 'function') {
    new fenetre.ResizeObserver(() => { dimensionner(); dessiner(); }).observe(canvas);
  }

  /**
   * Première mise en scène, et chaque ouverture de l'écran.
   *
   * ⚠⚠ LA VUE SE REFAIT À CHAQUE OUVERTURE DEPUIS LE 06/09, ET C'EST UN
   * RENVERSEMENT ASSUMÉ. Ce paragraphe disait l'inverse : « recentrer sur la
   * base du joueur chaque fois qu'on revient à la carte ferait perdre l'endroit
   * qu'on était en train de regarder — c'est la première chose qui agace sur une
   * carte », et le recentrage n'avait lieu qu'une fois, quand la vue n'existait
   * pas encore. Ce raisonnement n'est pas faux ; il est ÉCARTÉ. Ethan, 06/09 :
   * « ouverture de la carte : centrée sur ma base du joueur au zoom maximum », et
   * « ouverture de la carte » se lit à la lettre — chaque entrée dans l'écran
   * Monde.
   *
   * ⚠⚠ ET CE QUE ÇA COÛTE EST NOMMÉ : REVENIR D'UN RAID RAMÈNE LA VUE SUR SA
   * BASE. L'endroit qu'on regardait est perdu, et il l'est aussi en revenant du
   * Chantier, de l'Offense ou de la Recherche — la session appelle `peindre` à
   * chaque `montrerEcran`. C'est le prix de la demande, pas un défaut à corriger
   * de sa propre initiative ; `#monde-recentrer` reste la porte de sortie dans
   * l'autre sens, pour ceux qui se sont éloignés.
   *
   * ⚠ C'EST UN CHOIX RÉVERSIBLE D'UNE LIGNE : remettre le `premiere` d'avant
   * autour de l'appel rend le comportement du 31/08.
   *
   * ⚠ L'ATLAS, LUI, NE SE REFAIT TOUJOURS PAS. Les quatre `charger*` sortent
   * d'eux-mêmes quand leur image est déjà là ; ce sont la VUE et l'ÉCHELLE qui
   * se reposent, rien d'autre.
   */
  function peindre(etat) {
    if (etat === null || etat === undefined) return;
    etatCourant = etat;
    visible = true;
    // ⚠⚠ ICI AUSSI, ET PAS SEULEMENT DANS `rafraichir`. Un gisement peut se
    // prendre pendant que le joueur regarde un AUTRE écran — `rafraichir` sort
    // sur `!visible` —, typiquement quand une ruine expire et rend une case au
    // joueur. Sans cet appel, la différence serait adoptée en silence au premier
    // rafraîchissement de retour, et le message serait perdu pour de bon.
    //
    // ⚠ ET LA TOUTE PREMIÈRE FOIS EST MUETTE. `poisConnus` vaut `null` : on
    // adopte l'ensemble sans rien dire, donc ouvrir la carte sur une partie
    // chargée n'annonce pas les vingt gisements qu'elle porte déjà.
    signalerLesPoisNeufs(etat);
    empreinteSatellites = empreinteDeLaCarte(etat);
    chargerSols();
    chargerEmblemes();
    chargerLimites();
    chargerGrossesBases();
    dimensionner();
    cadrerSurLaBase(etat);
    majBoutons();
    dessiner();
  }

  /** L'écran quitte la scène : la boucle de complétion n'a plus à tourner. */
  function masquer() {
    visible = false;
    // ⚠ LA MINI-CARTE SE REFERME EN SORTANT. `peindre` recadre la vue à chaque
    // ouverture depuis le 06/09 : rouvrir l'écran sur un panneau resté ouvert
    // d'il y a deux écrans montrerait une mini-carte par-dessus une carte qu'on
    // vient de recentrer, et le joueur ne verrait pas le recentrage.
    fermerLaMiniCarte();
    if (idImage !== null) {
      fenetre.cancelAnimationFrame(idImage);
      idImage = null;
    }
  }

  /**
   * Ce qui change avec le temps : les satellites, qui paraissent cinq minutes
   * après la pose d'une base. Le fond, lui, ne bouge jamais — c'est une
   * fonction de la graine.
   */
  function rafraichir(etat) {
    if (!visible || etat === null || etat === undefined) return;
    etatCourant = etat;
    // ⚠⚠ LES DEUX PASSENT AVANT LA SORTIE ANTICIPÉE, ET C'EST OBLIGATOIRE.
    // `empreinteDeLaCarte` porte la base courante, les satellites et les cases
    // des ruines actives — elle ne porte NI les gisements acquis, NI l'heure.
    // Placés après le `return` ci-dessous, le toast se tairait dans le seul cas
    // où il sert, et le compte à rebours d'une ruine resterait figé sur la valeur
    // qu'il avait à l'ouverture du panneau.
    signalerLesPoisNeufs(etat);
    rafraichirLaRuine(etat);
    // ⚠ ON NE REDESSINE QUE SI QUELQUE CHOSE A BOUGÉ. La session appelle ceci
    // dix fois par seconde ; refaire la liste des sites à chaque fois coûte
    // neuf hachages par case de la fenêtre — deux mille cases au cran le plus
    // large — pour redessiner exactement la même image. Le fond, lui, est une
    // fonction de la graine : il ne change jamais.
    // ⚠⚠ LE CLIGNOTEMENT REDESSINE, MAIS SEULEMENT QUAND IL CHANGE D'ÉTAT.
    // Repeindre à chaque appel serait dix cartes par seconde, indéfiniment,
    // pour une image identique neuf fois sur dix — le coût exact que le
    // paragraphe ci-dessous existe pour éviter. On ne redessine qu'aux DEUX
    // instants où le cadre s'allume et s'éteint, soit une fois par seconde.
    const avant = haloAllumeAuTick(tickHalo);
    tickHalo += 1;
    const clignote = haloAllumeAuTick(tickHalo) !== avant;
    const empreinte = empreinteDeLaCarte(etat);
    if (empreinte === empreinteSatellites && !clignote) return;
    empreinteSatellites = empreinte;
    dessiner();
  }

  return { peindre, rafraichir, masquer, viserAuProchainAffichage };
}
