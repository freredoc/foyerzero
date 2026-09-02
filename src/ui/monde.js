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
  GEOGRAPHIE, ZOOM_CARTE, TERRAIN_CARTE, EMBLEMES_CARTE, POI, palierDeNiveau, DEPLACEMENT,
} from '../data/sites.js';
import { niveauDeLaRangee, positionBaseTerminale } from '../sim/carte.js';
import { basesDeLaFenetre } from '../sim/peuplement.js';
import { poisDeLaFenetre, poiEstAcquis } from '../sim/poi.js';
import {
  saveurDeLaCase, siteDeLaCase, butinSiToutTombe, forceDeLaDefense,
} from '../sim/site-de-la-case.js';
import { montageCourant } from '../sim/site-entame.js';
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
import {
  territoireDeLaFenetre, bordsDuTerritoire, JOUEUR, OUVRAGE,
} from '../sim/territoire.js';

/** Les crans de zoom, du plus large au plus serré. Lus, jamais recopiés. */
export const CRANS = ZOOM_CARTE.crans;

/** Le cran sur lequel la carte s'ouvre : celui qui montre le plus. */
export const CRAN_PAR_DEFAUT = 0;

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

  const sites = basesDeLaFenetre(etat.graine, fenetre).map((base) => ({
    type: 'base',
    rangee: base.rangee,
    colonne: base.colonne,
    niveau: niveauDeLaRangee(base.rangee),
    saveur: saveur(base.rangee, base.colonne, 'base'),
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

  for (const satellite of etat.satellites.presents) {
    if (!dedans(satellite.rangee, satellite.colonne)) continue;
    sites.push({
      type: satellite.type,
      rangee: satellite.rangee,
      colonne: satellite.colonne,
      niveau: satellite.niveau,
      saveur: saveur(satellite.rangee, satellite.colonne, satellite.type),
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

  // Le joueur en dernier : c'est le seul site qu'il ne doit jamais perdre de vue.
  if (dedans(etat.position.rangee, etat.position.colonne)) {
    sites.push({
      type: 'baseJoueur',
      rangee: etat.position.rangee,
      colonne: etat.position.colonne,
      niveau: null,
      saveur: saveur(etat.position.rangee, etat.position.colonne, 'base'),
    });
  }
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
  const dixiemes = niveauDesBatiments(etat.disposition);
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
  const problemes = problemesDuRaid(etat, etat, identite);
  const horsPortee = problemes.some((p) => p.code === 'hors-portee');
  return {
    butin: butinSiToutTombe(montage),
    force: forceDeLaDefense(montage.defenseurs),
    cout: horsPortee ? null : coutDUnRaid(etat, etat, identite),
    problemes,
  };
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
    // ⚠ `null` VEUT DIRE « HORS DE PORTÉE », et la ligne le dit plutôt que
    // d'écrire « null points d'attaque ».
    lignes.push({
      quoi: 'Coût du raid',
      valeur: ciblage.cout === null
        ? 'hors de portée' : `${ciblage.cout} points d'attaque`,
    });
  }
  return lignes;
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
 * Le halo qui entoure la base ATTAQUANTE — un anneau, pas un aplat.
 *
 * ⚠⚠ IL NE FAIT PAS LA TAILLE D'UNE CASE, IL DÉBORDE. Un cercle inscrit dans la
 * case serait caché par l'emblème qui s'y dessine ; le halo doit se lire AUTOUR,
 * sinon il ne dit rien de plus que la base elle-même.
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
  const centre = centreDeLaCase(position, ox, oy, pas);
  return {
    x: centre.x,
    y: centre.y,
    rayon: pas * RAYON_HALO,
    epaisseur: Math.max(1, Math.round(pas * EPAISSEUR_HALO)),
  };
}

/** Le rayon du halo, en CASES — il déborde, sinon l'emblème le cacherait. */
export const RAYON_HALO = 0.72;

/** Son épaisseur, en cases : elle suit le cran, comme celle des frontières. */
export const EPAISSEUR_HALO = 0.08;

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
 * L'épaisseur d'un trait de frontière, en pixels physiques.
 *
 * ⚠ ELLE SUIT LE CRAN, elle ne s'écrit pas en pixels. Un nombre fixe serait un
 * fil au cran 256 et un pâté au cran 32 — c'est le même raisonnement que
 * l'épaisseur des traits de voisinage du Chantier, qui est une fraction de case.
 * Le plancher à 1 existe parce qu'un trait de moins d'un pixel ne se dessine pas.
 */
export function epaisseurDeFrontiere(cran) {
  return Math.max(1, Math.round(cran / 16));
}

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
  // ⚠ L'ÉCRAN DEMANDE, LA SESSION ÉCRIT — même partage que `apresPose` de
  // l'écran Chantier. Un déplacement change l'état et doit être SAUVEGARDÉ tout
  // de suite : c'est une action irréversible, et la perdre parce que
  // l'application a été tuée serait la pire façon de perdre la confiance du
  // joueur. L'écran ne sait pas sauvegarder ; il le demande.
  const apresDeplacement = crochets.apresDeplacement ?? (() => {});
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
  let cranIndex = CRAN_PAR_DEFAUT;
  let vueX = 0;
  let vueY = 0;
  let visible = false;
  let idImage = null;
  const cache = creerCacheDalles(TERRAIN_CARTE.dallesEnCache);
  let sitesAffiches = [];
  let empreinteSatellites = null;
  // ⚠ L'IMAGE DES EMBLÈMES, ATTENDUE AVANT LE PREMIER DESSIN. Une image dessinée
  // avant décodage est BLANCHE, et le défaut ne se reproduit qu'au tout premier
  // chargement — donc jamais en essai, toujours chez le joueur. `monde.js`
  // attendait déjà son atlas de terrain de cette façon ; on suit le précédent.
  let emblemes = null;
  let emblemesDemandes = false;
  // ⚠ LA GROSSE BASE EST UNE IMAGE À PART, PAS UNE CELLULE D'ATLAS. Elle couvre
  // trois cases de côté, donc 192 px à la grille 64, quand `coudre` exige des
  // cellules carrées à la taille de case — `tools/atlas.py` l'exclut nommément.
  // Elle voyage donc par son propre marqueur, et s'attend comme l'atlas.
  let grossesBases = null;
  let grossesBasesDemandees = false;

  const cran = () => CRANS[cranIndex];

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
    const taille = dimensionsDeLaCarte(cran());
    vueX = bornerDefilement(vueX, taille.largeur, canvas.width);
    vueY = bornerDefilement(vueY, taille.hauteur, canvas.height);
  }

  /** Centre la vue sur une case de la carte. */
  function centrerSur(position) {
    vueX = (position.colonne - 0.5) * cran() - canvas.width / 2;
    vueY = (position.rangee - 0.5) * cran() - canvas.height / 2;
    recadrer();
  }

  /**
   * Change de cran en gardant un point de l'écran immobile.
   *
   * ⚠⚠ L'ANCRE N'EST PLUS FORCÉMENT LE CENTRE — c'est ce que le pincement
   * apporte. Zoomer sur le milieu des deux doigts est la seule façon de faire
   * grossir CE QU'ON REGARDE : ancrer au centre de l'écran ferait fuir sous les
   * doigts la case qu'on vise, et sur une carte de 300 rangées on ne la
   * retrouve pas. Le centre reste le défaut, pour tout appel sans ancre.
   *
   * @param {number} pas −1 ou +1
   * @param {{x: number, y: number}} [ancre] point à garder fixe, en pixels du
   *   canevas (physiques, origine au coin haut-gauche du canevas)
   * @returns {boolean} vrai si le cran a changé
   */
  function changerDeCran(pas, ancre = null) {
    const suivant = cranIndex + pas;
    if (suivant < 0 || suivant >= CRANS.length) return false;
    const point = ancre === null
      ? { x: canvas.width / 2, y: canvas.height / 2 }
      : ancre;
    const ancien = cran();
    const colonne = (vueX + point.x) / ancien;
    const rangee = (vueY + point.y) / ancien;
    cranIndex = suivant;
    // ⚠ LE CACHE SE VIDE, IL NE SE TRIE PAS. Une dalle est un rendu à un cran
    // donné ; la garder d'un cran à l'autre dessinerait l'ancienne échelle.
    cache.vider();
    vueX = colonne * cran() - point.x;
    vueY = rangee * cran() - point.y;
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
    const cssParCase = cran() / (fenetre.devicePixelRatio || 1);
    $('monde-outils').title = `${Math.round(cssParCase)} px / case`;
  }

  // --- le dessin -------------------------------------------------------------

  function cleDeDalle(i, j) {
    return `${cran()}:${i}:${j}`;
  }

  /** Fabrique une dalle et la range. Rendue à part pour pouvoir la plafonner. */
  function calculerDalle(i, j) {
    const cote = TERRAIN_CARTE.dalleCotePx;
    const { donnees } = rendreDalle({
      atlas, graine: etatCourant.graine, cran: cran(), x0: i * cote, y0: j * cote, cote,
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
   * ⚠ LE DÉFILEMENT SE GARDE EN FLOTTANT, LE DESSIN SE FAIT EN ENTIERS. Un
   * `drawImage` à une position fractionnaire rééchantillonne la dalle : le
   * pavage, qui est du pixel art, deviendrait flou dès qu'on pose le doigt
   * dessus. Arrondir `vueX` lui-même perdrait un demi-pixel à chaque évènement
   * de glissement, et la carte traînerait derrière le doigt sur un long
   * défilement.
   */
  const origineX = () => Math.round(vueX);
  const origineY = () => Math.round(vueY);

  function dessinerFond(ox, oy) {
    const cote = TERRAIN_CARTE.dalleCotePx;
    const i0 = Math.floor(ox / cote);
    const i1 = Math.floor((ox + canvas.width - 1) / cote);
    const j0 = Math.floor(oy / cote);
    const j1 = Math.floor((oy + canvas.height - 1) / cote);
    let budget = DALLES_PAR_IMAGE;
    let restent = false;
    for (let j = j0; j <= j1; j += 1) {
      for (let i = i0; i <= i1; i += 1) {
        const x = i * cote - ox;
        const y = j * cote - oy;
        let dalle = cache.lire(cleDeDalle(i, j));
        if (dalle === undefined && atlas !== null && budget > 0) {
          budget -= 1;
          dalle = calculerDalle(i, j);
        }
        if (dalle !== undefined) {
          ctx.drawImage(dalle, x, y);
          continue;
        }
        restent = true;
        // Le centre de la dalle donne la rangée, donc le camp du sol : une
        // attente violette au bout de la carte et terre cuite au départ vaut
        // mieux qu'un aplat qui change de couleur quand la dalle arrive.
        const rangeeCentre = Math.min(
          GEOGRAPHIE.carte.hauteur,
          Math.max(1, Math.floor((j * cote + cote / 2) / cran()) + 1),
        );
        ctx.fillStyle = teinteDAttente(rangeeCentre);
        ctx.fillRect(x, y, cote, cote);
      }
    }
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
   * ⚠ L'ÉCHELLE SE LIT DANS `ZOOM_CARTE`. Un emblème est dessiné à la taille
   * d'une case, quelle que soit la grille source : `drawImage` met la cellule de
   * `grilleEmbleme` pixels à `taille` pixels, et le rapport suit tout seul le
   * jour où un cran bougera.
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
    const epaisseur = epaisseurDeFrontiere(pas);
    ctx.lineWidth = epaisseur;
    // ⚠ LE TRAIT SE POSE SUR LA LIGNE DE LA CASE, donc à un demi-pixel près : un
    // `strokeRect` centre le trait sur le chemin, et un chemin sur un entier
    // rendrait un trait à cheval, donc flou. On décale d'une demi-épaisseur.
    const demi = epaisseur / 2;
    for (const camp of [OUVRAGE, JOUEUR]) {
      ctx.strokeStyle = TEINTES_TERRITOIRE[camp];
      ctx.beginPath();
      for (const bord of bords) {
        if (bord.camp !== camp) continue;
        const x = (bord.colonne - 1) * pas - ox;
        const y = (bord.rangee - 1) * pas - oy;
        if (bord.nord) { ctx.moveTo(x, y + demi); ctx.lineTo(x + pas, y + demi); }
        if (bord.sud) { ctx.moveTo(x, y + pas - demi); ctx.lineTo(x + pas, y + pas - demi); }
        if (bord.ouest) { ctx.moveTo(x + demi, y); ctx.lineTo(x + demi, y + pas); }
        if (bord.est) { ctx.moveTo(x + pas - demi, y); ctx.lineTo(x + pas - demi, y + pas); }
      }
      ctx.stroke();
    }
  }

  /**
   * Le halo autour de la base attaquante — sous les emblèmes, comme les
   * frontières, pour ne pas couper le dessin qui dit ce qu'il y a là.
   */
  function dessinerHalo(ox, oy, pas) {
    const halo = geometrieDuHalo(etatCourant.position, ox, oy, pas);
    // Hors du canevas : rien à peindre, et un arc à des milliers de pixels
    // coûterait quand même son chemin.
    if (halo.x < -halo.rayon || halo.y < -halo.rayon
      || halo.x > canvas.width + halo.rayon || halo.y > canvas.height + halo.rayon) return;
    ctx.lineWidth = halo.epaisseur;
    ctx.strokeStyle = TEINTES_TERRITOIRE[JOUEUR];
    ctx.beginPath();
    ctx.arc(halo.x, halo.y, halo.rayon, 0, Math.PI * 2);
    ctx.stroke();
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
    // ⚠ PAS DE FLÈCHE SANS PRIX. Hors de portée, `cout` vaut `null` : une flèche
    // qui ne porterait aucun nombre n'aurait plus rien à dire, et le panneau
    // écrit déjà « hors de portée ».
    if (siteOuvert === null || ciblageOuvert === null || ciblageOuvert.cout === null) return;
    const trait = traitDeLaFleche(etatCourant.position, siteOuvert, ox, oy, pas);
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

    // Le coût, au milieu du trait.
    const mx = (trait.x1 + trait.x2) / 2;
    const my = (trait.y1 + trait.y2) / 2;
    const taille = Math.max(9, Math.round(pas * 0.32));
    ctx.font = `${taille}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const texte = `${ciblageOuvert.cout}`;
    const large = ctx.measureText(texte).width + taille * 0.6;
    ctx.fillStyle = '#161914';
    ctx.fillRect(mx - large / 2, my - taille * 0.7, large, taille * 1.4);
    ctx.fillStyle = TEINTES_TERRITOIRE[JOUEUR];
    ctx.fillText(texte, mx, my);
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

    const pas = cran();
    dessinerFrontieres(ox, oy, pas);
    dessinerHalo(ox, oy, pas);
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

    // ⚠ APRÈS LES EMBLÈMES, contrairement au halo et aux frontières : la flèche
    // DOIT se lire par-dessus, c'est tout ce qu'elle a à dire.
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
  // ⚠⚠ LE ZOOM RESTE PAR CRANS, ET CE N'EST PAS UN DEMI-TRAVAIL. `rendreDalle`
  // LÈVE sur un cran hors table, et pour une raison qui tient : à chaque cran,
  // la tuile de terrain comme l'emblème restent à un facteur d'échelle ENTIER,
  // seule façon de ne pas brouiller du pixel art (voir `ZOOM_CARTE`). Un zoom
  // continu demanderait de recalculer les dalles à chaque image — 19 ms pièce,
  // mesuré — pour rendre du flou. Le geste est donc continu, son EFFET est
  // discret : on franchit un cran quand les doigts se sont écartés de √2, la
  // moyenne géométrique entre deux crans qui vont du simple au double. C'est le
  // point où le cran d'arrivée est plus proche que celui de départ.
  //
  // ⚠ ET LE POINT DE RÉFÉRENCE SE REMET À CHAQUE FRANCHISSEMENT, pour qu'un
  // pincement continu enchaîne les crans sans qu'on relâche.

  /** Écart des doigts au-delà duquel on change de cran. Voir ci-dessus. */
  const SEUIL_PINCEMENT = Math.SQRT2;

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
      const rapport = ecartDesDoigts(deux) / pincement.ecart;
      // ⚠ LE RAPPORT DES ÉCARTS, PAS LEUR DIFFÉRENCE : une différence en pixels
      // zoomerait plus vite sur une grande dalle que sur une petite, pour le
      // même geste de la main.
      if (rapport >= SEUIL_PINCEMENT || rapport <= 1 / SEUIL_PINCEMENT) {
        const sens = rapport >= SEUIL_PINCEMENT ? 1 : -1;
        // Le point d'ancrage se relève AVANT le changement : après, les
        // coordonnées de vue ont déjà bougé.
        if (changerDeCran(sens, milieuDesDoigts(deux))) {
          pincement = { ecart: ecartDesDoigts(deux) };
        } else {
          // Au bout de la table, on ré-ancre quand même : sinon le rapport
          // reste franchi et chaque image redemande un cran qui n'existe pas.
          pincement = { ecart: ecartDesDoigts(deux) };
        }
      }
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
    const colonne = Math.floor(px / cran()) + 1;
    const rangee = Math.floor(py / cran()) + 1;
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
        rangee: etatCourant.position.rangee,
        colonne: etatCourant.position.colonne + 1,
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
    centrerSur(etatCourant.position);
    apresDeplacement();
    dessiner();
  }

  function ouvrirPanneau(site) {
    siteOuvert = { rangee: site.rangee, colonne: site.colonne };
    panneauTitre.textContent = EMBLEMES_CARTE[site.type].nom;
    panneauCorps.textContent = '';
    // ⚠ LES TROIS NOMBRES DE CIBLAGE VIENNENT DES BRIQUES, PAS DE L'ÉCRAN.
    const ciblage = ciblageDuSite(etatCourant, site);
    // ⚠⚠ ET LA FLÈCHE RELIT CE MÊME OBJET. Le rappeler pour elle donnerait deux
    // valeurs qui peuvent diverger, et le joueur verrait un prix sur la flèche
    // et un autre dans le panneau.
    ciblageOuvert = ciblage;
    panneauRefus.hidden = ciblage === null || ciblage.problemes.length === 0;
    panneauRefus.textContent = ciblage === null ? ''
      : ciblage.problemes.map((p) => p.message).join(' ; ');
    for (const ligne of lignesDuSite(site, etatCourant.position, etatCourant.poisAcquis, ciblage)) {
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
    panneauDeplacer.hidden = site.type !== 'baseJoueur';
    panneau.hidden = false;
    // ⚠ LA FLÈCHE NAÎT AVEC LE PANNEAU, donc l'ouverture repeint. Sans ça elle
    // n'apparaîtrait qu'au prochain geste sur la carte — la boucle de dessin ne
    // tourne pas au repos, `dessiner` n'est rappelée que par ce qui bouge.
    dessiner();
  }

  function fermerPanneau() {
    panneau.hidden = true;
    panneauDeplacer.hidden = true;
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
    centrerSur(etatCourant.position);
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
    empreinteSatellites = `${etat.satellites.presents.length}:${etat.satellites.prochaineInstance}`;
    chargerAtlas();
    chargerEmblemes();
    chargerGrossesBases();
    dimensionner();
    if (premiere) centrerSur(etat.position);
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
    const empreinte = `${etat.satellites.presents.length}:${etat.satellites.prochaineInstance}`;
    if (empreinte === empreinteSatellites) return;
    empreinteSatellites = empreinte;
    dessiner();
  }

  return { peindre, rafraichir, masquer };
}
