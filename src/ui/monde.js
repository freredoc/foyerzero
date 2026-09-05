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
// d'autre. Aucun bouton « Attaquer » : le raid n'existe pas. C'est la faute du
// bouton « Assaut » du lot ÉCRAN-CHANTIER, retiré le 27/08, et elle ne se refait
// pas. Un test balaie le panneau pour qu'aucun bouton d'action n'y entre.

import {
  GEOGRAPHIE, ZOOM_CARTE, TERRAIN_CARTE, EMBLEMES_CARTE, ETIQUETTE_CARTE, POI,
  palierDeNiveau, DEPLACEMENT,
} from '../data/sites.js';
import { niveauDeLaRangee, positionBaseTerminale } from '../sim/carte.js';
import { basesDeLaFenetre } from '../sim/peuplement.js';
import { poisDeLaFenetre, poiEstAcquis } from '../sim/poi.js';
import {
  saveurDeLaCase, siteDeLaCase, butinSiToutTombe, forceDeLaDefense,
} from '../sim/site-de-la-case.js';
import { avariesParCase, avarieDeLaBase, montageCourant } from '../sim/site-entame.js';
import {
  coutDUnRaid, distanceCarreeCases, casesArrondiesAuSuperieur,
} from '../sim/points-attaque.js';
import { problemesDuRaid } from '../sim/raid.js';
import {
  problemesDuDeplacement, deplacerLaBase, casesAtteignables,
  ticksAvantProchainDeplacement,
} from '../sim/deplacement.js';
import { creerAtlas, rendreDalle, partOuvrageDeLaRangee, NB_TEINTES } from '../render/terrain.js';
import {
  cotesDuSite, dessinerGrosseBase, dessinerEmblemeDUneCase,
} from '../render/embleme.js';
import { niveauDesBatiments } from '../sim/niveau-de-base.js';
// ⚠ LE FORMATAGE D'UN NIVEAU EN DIXIÈMES VIT DANS `ui/chantier.js`, ET IL N'Y
// EN A QU'UN. `src/ui/recherche.js` importe déjà de là pour la même raison : ce
// sont des fonctions PURES d'un module d'écran, pas son DOM.
import { formaterDixiemes } from './chantier.js';
import {
  territoireDeLaFenetre, bordsDuTerritoire, JOUEUR, OUVRAGE,
} from '../sim/territoire.js';
import { dessinerLimiteDUneCase } from '../render/limite.js';
import { PALETTE } from '../render/scene.js';
import { baseCourante } from '../sim/base-courante.js';
import { basculerVersLaBase } from '../sim/state.js';
import { satellitesPresents } from '../sim/satellites.js';

/** Les crans de zoom, du plus large au plus serré. Lus, jamais recopiés. */
export const CRANS = ZOOM_CARTE.crans;

/** Le cran sur lequel la carte s'ouvre : celui qui montre le plus. */
export const CRAN_PAR_DEFAUT = 0;

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
 * TOUT CE QUI REND LE ZOOM CONTINU PAYABLE. `rendreDalle` fabrique une image à
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
 * qu'Ethan a rapporté le 30/08 et que `tuilesParCase: 2` a corrigé. Ici le
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

  const sites = basesDeLaFenetre(etat.graine, fenetre).map((base) => ({
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
    { quoi: 'Distance', valeur: distance === 1 ? '1 case' : `${distance} cases` },
    { quoi: 'Position', valeur: `rangée ${site.rangee}, colonne ${site.colonne}` },
  ];
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
 * Convertit une image d'atlas décodée par le navigateur en indices de teinte.
 *
 * ⚠ ON APPARIE PAR LA COULEUR EXACTE, ET ON RETOMBE SUR LA PLUS PROCHE. L'atlas
 * livré est un PNG indexé sur la rampe du joueur et ne porte AUCUN chunk de
 * gestion de couleur — un navigateur rend donc les octets tels quels, et
 * l'appariement exact suffit. La retombée existe pour le jour où un appareil
 * appliquerait quand même un profil : mieux vaut une teinte voisine qu'un
 * atlas refusé et une carte noire.
 *
 * @param {Uint8ClampedArray} rvba
 * @returns {Uint8Array} indices de 0 à `NB_TEINTES − 1`
 */
export function indicesDeTeinte(rvba) {
  const exact = new Map();
  const reperes = TERRAIN_CARTE.rampes.joueur.map((hex, i) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const v = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    exact.set((r << 16) | (v << 8) | b, i);
    return r + v + b;
  });
  const indices = new Uint8Array(rvba.length / 4);
  for (let p = 0, k = 0; p < rvba.length; p += 4, k += 1) {
    const cle = (rvba[p] << 16) | (rvba[p + 1] << 8) | rvba[p + 2];
    const trouve = exact.get(cle);
    if (trouve !== undefined) {
      indices[k] = trouve;
      continue;
    }
    const somme = rvba[p] + rvba[p + 1] + rvba[p + 2];
    let meilleur = 0;
    let ecart = Infinity;
    for (let i = 0; i < reperes.length; i += 1) {
      const d = Math.abs(reperes[i] - somme);
      if (d < ecart) { ecart = d; meilleur = i; }
    }
    indices[k] = meilleur;
  }
  return indices;
}

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

/** Son épaisseur, en cases : elle suit le cran, comme celle des frontières. */
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
 * ⚠ ELLE S'ARRÊTE AU BORD DES DEUX CASES, pas à leur centre. Un trait qui
 * traverserait les deux emblèmes couperait les seuls dessins qui disent ce qu'il
 * y a là — c'est la raison pour laquelle les frontières passent déjà SOUS les
 * emblèmes.
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
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const longueur = Math.sqrt(dx * dx + dy * dy);
  // ⚠ ICI UNE RACINE EST LÉGITIME, ET IL FAUT LE DIRE : on est dans le DESSIN,
  // en pixels, pas dans une règle de jeu. Les distances de la carte se comparent
  // au carré depuis le lot EUCLIDE parce qu'elles décident ; celle-ci ne décide
  // de rien, elle normalise un vecteur d'écran.
  const marge = pas * RETRAIT_FLECHE;
  const ux = dx / longueur;
  const uy = dy / longueur;
  return {
    x1: a.x + ux * marge,
    y1: a.y + uy * marge,
    x2: b.x - ux * marge,
    y2: b.y - uy * marge,
    angle: Math.atan2(dy, dx),
  };
}

/** Le retrait aux deux bouts de la flèche, en cases : elle ne couvre pas les emblèmes. */
export const RETRAIT_FLECHE = 0.55;

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
 * du raid s'en servent toujours, et leur test aussi.
 */


/** La teinte du milieu d'une rampe : ce qu'on peint tant qu'une dalle manque. */
export function teinteDAttente(rangee) {
  const rampe = partOuvrageDeLaRangee(rangee) >= TERRAIN_CARTE.seuilOuvrage
    ? TERRAIN_CARTE.rampes.ouvrage
    : TERRAIN_CARTE.rampes.joueur;
  return rampe[(NB_TEINTES - 1) / 2];
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
  // ⚠ QUELLE CASE LE PANNEAU DÉCRIT — c'est ce à quoi le SECOND toucher se
  // compare. `null` quand le panneau est fermé.
  let siteOuvert = null;
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

  let etatCourant = null;
  let atlas = null;
  let atlasDemande = false;
  // ⚠⚠ L'ÉCHELLE EST UN RÉEL, PLUS UN INDICE DE TABLE. Le zoom était par crans
  // jusqu'au 04/09 ; Ethan : « le zoom de la carte ne doit pas être par cran ».
  // Un `cranIndex` gardé à côté d'elle « au cas où » divergerait au premier
  // pincement — il n'y en a plus, et `monde.test.js` refuse qu'il revienne.
  let echelle = CRANS[CRAN_PAR_DEFAUT];
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

  // --- l'atlas, décodé une fois ---------------------------------------------
  //
  // ⚠ IL SE DÉCODE À LA PREMIÈRE OUVERTURE DE LA CARTE, PAS AU DÉMARRAGE. Un
  // million de pixels à relire coûte quelques millisecondes ; les dépenser au
  // lancement pour un écran que le joueur n'ouvrira peut-être pas retarderait
  // l'affichage de sa base.
  function chargerAtlas() {
    if (atlas !== null || atlasDemande) return;
    // ⚠ LE DRAPEAU SE POSE AVANT L'ATTENTE, PAS APRÈS. `peindre` rappelle ceci à
    // chaque ouverture de la carte : sans lui, deux ouvertures pendant que
    // l'image se décode poseraient deux écouteurs, donc deux décodages d'un
    // million de pixels. Il retombe quand l'image arrive, pour que la seconde
    // tentative fasse le travail.
    atlasDemande = true;
    const image = $('monde-atlas');
    if (!image.complete || image.naturalWidth === 0) {
      image.addEventListener('load', () => { atlasDemande = false; chargerAtlas(); }, { once: true });
      return;
    }
    const tampon = doc.createElement('canvas');
    tampon.width = image.naturalWidth;
    tampon.height = image.naturalHeight;
    const ctxTampon = tampon.getContext('2d', { willReadFrequently: true });
    ctxTampon.drawImage(image, 0, 0);
    const rvba = ctxTampon.getImageData(0, 0, tampon.width, tampon.height).data;
    atlas = creerAtlas(
      indicesDeTeinte(rvba), ZOOM_CARTE.coteTuile, image.naturalWidth,
    );
    dessiner();
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

  /** Fabrique une dalle et la range. Rendue à part pour pouvoir la plafonner. */
  function calculerDalle(i, j) {
    const cote = TERRAIN_CARTE.dalleCotePx;
    const { donnees } = rendreDalle({
      atlas, graine: etatCourant.graine, cran: cranCourant(), x0: i * cote, y0: j * cote, cote,
    });
    const tampon = doc.createElement('canvas');
    tampon.width = cote;
    tampon.height = cote;
    tampon.getContext('2d').putImageData(new fenetre.ImageData(donnees, cote, cote), 0, 0);
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
        if (dalle === undefined && atlas !== null && budget > 0) {
          budget -= 1;
          dalle = calculerDalle(i, j);
        }
        if (dalle !== undefined) {
          ctx.drawImage(dalle, x0, y0, x1 - x0, y1 - y0);
          continue;
        }
        restent = true;
        // Le centre de la dalle donne la rangée, donc le camp du sol : une
        // attente violette au bout de la carte et terre cuite au départ vaut
        // mieux qu'un aplat qui change de couleur quand la dalle arrive.
        //
        // ⚠ LE CENTRE SE COMPTE DANS L'ESPACE DE RENDU, DONC SUR LE CRAN DE
        // RENDU. La dalle fait `cote` pixels À CE CRAN-LÀ ; la diviser par
        // l'échelle d'affichage donnerait une rangée fausse d'un facteur
        // jusqu'à deux, donc la mauvaise teinte d'attente.
        const rangeeCentre = Math.min(
          GEOGRAPHIE.carte.hauteur,
          Math.max(1, Math.floor((j * cote + cote / 2) / cranCourant()) + 1),
        );
        ctx.fillStyle = teinteDAttente(rangeeCentre);
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
    const trait = traitDeLaFleche(baseCourante(etatCourant).position, siteOuvert, ox, oy, pas);
    if (trait === null) return;
    ctx.lineWidth = Math.max(1, Math.round(pas * EPAISSEUR_HALO));
    ctx.strokeStyle = TEINTES_TERRITOIRE[JOUEUR];
    ctx.fillStyle = TEINTES_TERRITOIRE[JOUEUR];
    ctx.beginPath();
    ctx.moveTo(trait.x1, trait.y1);
    ctx.lineTo(trait.x2, trait.y2);
    ctx.stroke();

    // La pointe : deux côtés d'un triangle, à la pointe du trait.
    const aile = Math.max(3, pas * 0.22);
    const ouverture = Math.PI / 7;
    ctx.beginPath();
    ctx.moveTo(trait.x2, trait.y2);
    ctx.lineTo(
      trait.x2 - aile * Math.cos(trait.angle - ouverture),
      trait.y2 - aile * Math.sin(trait.angle - ouverture),
    );
    ctx.lineTo(
      trait.x2 - aile * Math.cos(trait.angle + ouverture),
      trait.y2 - aile * Math.sin(trait.angle + ouverture),
    );
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

    // ⚠ ON NE RELANCE PAS D'IMAGE TANT QUE L'ATLAS MANQUE. Sans lui, aucune
    // dalle ne peut se calculer : la boucle tournerait à vide soixante fois par
    // seconde pour repeindre le même aplat. `chargerAtlas` redessine tout seul
    // quand l'image arrive.
    if (restent && atlas !== null && idImage === null && visible) {
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
  // elles ne le sont pas. `rendreDalle` fabrique une image à un cran de la
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
      poserLaBase({ rangee, colonne });
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
    fermerPanneau();
  }

  canvas.addEventListener('pointerup', relacher);
  canvas.addEventListener('pointercancel', (evenement) => {
    doigts.delete(evenement.pointerId);
    if (doigts.size < 2) pincement = null;
    if (pointeur !== null && evenement.pointerId === pointeur.id) pointeur = null;
  });

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
   * Le second temps du geste : la case touchée devient la nouvelle position.
   *
   * ⚠ ON DEMANDE, PUIS ON DÉPLACE — jamais un `try` autour de `deplacerLaBase`.
   * `problemesDuDeplacement` rend une LISTE, `deplacerLaBase` LÈVE, et la
   * différence est la règle du dépôt : un déplacement refusé est un fait de JEU
   * qu'on montre au joueur, une levée est un fait de PROGRAMME. Rattraper la
   * levée traiterait la seconde comme la première.
   */
  function poserLaBase(cible) {
    if (etatCourant === null) return;
    const problemes = problemesDuDeplacement(etatCourant, cible);
    if (problemes.length > 0) {
      panneauTitre.textContent = 'Déplacer la base';
      panneauCorps.textContent = '';
      panneauRefus.hidden = false;
      panneauRefus.textContent = problemes.map((p) => p.message).join(' ; ');
      panneau.hidden = false;
      desarmerLeDeplacement();
      return;
    }
    deplacerLaBase(etatCourant, cible);
    desarmerLeDeplacement();
    fermerPanneau();
    centrerSur(baseCourante(etatCourant).position);
    apresDeplacement();
    dessiner();
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
    panneauCorps.textContent = '';
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
    for (const ligne of lignesDuSite(site, baseCourante(etatCourant).position, etatCourant.poisAcquis, ciblage)) {
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
    // ⚠⚠ LE BOUTON N'APPARAÎT QUE SUR SA PROPRE BASE. Sur un camp ou une base de
    // l'Ouvrage il n'aurait aucun sens, et le panneau retomberait dans la faute
    // qu'il combat depuis le 27/08 : promettre un geste qui n'existe pas là.
    panneauDeplacer.hidden = gesteDuSecondToucher(site) !== 'base';
    panneau.hidden = false;
    // ⚠ LA FLÈCHE NAÎT AVEC LE PANNEAU, donc l'ouverture repeint. Sans ça elle
    // n'apparaîtrait qu'au prochain geste sur la carte — la boucle de dessin ne
    // tourne pas au repos, `dessiner` n'est rappelée que par ce qui bouge.
    dessiner();
  }

  function fermerPanneau() {
    panneau.hidden = true;
    panneauDeplacer.hidden = true;
    // ⚠ LE BLOC DE PRIX SE FERME AVEC LE PANNEAU. Le laisser visible sous un
    // panneau caché ne se verrait pas aujourd'hui — il est DANS le panneau —
    // mais le premier lot qui le sortirait de là hériterait d'un prix orphelin.
    panneauPrix.hidden = true;
    siteOuvert = null;
    ciblageOuvert = null;
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

  $('monde-panneau-fermer').addEventListener('click', () => {
    // ⚠ FERMER DÉSARME AUSSI. Sans ça, le mode resterait armé sous un panneau
    // fermé, et le prochain toucher sur la carte déplacerait la base sans que
    // rien ne l'ait annoncé.
    desarmerLeDeplacement();
    fermerPanneau();
  });
  panneauDeplacer.addEventListener('click', armerLeDeplacement);
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
   * ⚠ L'ATLAS ET LA VUE NE SE REFONT PAS À CHAQUE OUVERTURE. Recentrer sur la
   * base du joueur chaque fois qu'on revient à la carte ferait perdre l'endroit
   * qu'on était en train de regarder — c'est la première chose qui agace sur une
   * carte. Le recentrage n'a lieu qu'une fois, quand la vue n'existe pas encore.
   */
  function peindre(etat) {
    if (etat === null || etat === undefined) return;
    const premiere = etatCourant === null;
    etatCourant = etat;
    visible = true;
    empreinteSatellites = empreinteDeLaCarte(etat);
    chargerAtlas();
    chargerEmblemes();
    chargerLimites();
    chargerGrossesBases();
    dimensionner();
    if (premiere) centrerSur(baseCourante(etat).position);
    majBoutons();
    dessiner();
  }

  /** L'écran quitte la scène : la boucle de complétion n'a plus à tourner. */
  function masquer() {
    visible = false;
    if (idImage !== null) {
      fenetre.cancelAnimationFrame(idImage);
      idImage = null;
    }
  }

  /**
   * Ce qui, dans l'état, oblige la carte à se redessiner.
   *
   * ⚠⚠ ELLE ÉTAIT ÉCRITE DEUX FOIS — dans `peindre` et dans `rafraichir` — ET
   * LES DEUX AVAIENT DIVERGÉ. Elles lisaient `satellites.prochaineInstance`,
   * qui a quitté la base pour l'état au lot BASES-1 : l'empreinte valait donc
   * « N:undefined », si bien qu'un camp DÉTRUIT puis REMPLACÉ au même compte
   * laissait la carte figée sur l'ancien.
   *
   * ⚠ ELLE PORTE `baseCourante`, ET C'EST CE QUI FAIT SUIVRE LE HALO. Sans lui,
   * basculer ne redessinerait rien — la liste des satellites n'ayant pas bougé.
   *
   * ⚠ ET TOUTES LES BASES, pas seulement la courante : les camps d'une autre
   * base paraissent et disparaissent sur la même carte.
   */
  function empreinteDeLaCarte(etat) {
    let empreinte = `${etat.baseCourante}:${etat.prochaineInstanceSatellite}`;
    for (const base of etat.bases) empreinte += `:${base.satellites.presents.length}`;
    return empreinte;
  }

  /**
   * Ce qui change avec le temps : les satellites, qui paraissent cinq minutes
   * après la pose d'une base. Le fond, lui, ne bouge jamais — c'est une
   * fonction de la graine.
   */
  function rafraichir(etat) {
    if (!visible || etat === null || etat === undefined) return;
    etatCourant = etat;
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

  return { peindre, rafraichir, masquer };
}
