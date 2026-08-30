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
  GEOGRAPHIE, ZOOM_CARTE, TERRAIN_CARTE, EMBLEMES_CARTE, palierDeNiveau,
} from '../data/sites.js';
import { niveauDeLaRangee, positionBaseTerminale } from '../sim/carte.js';
import { basesDeLaFenetre } from '../sim/peuplement.js';
import { saveurDeLaCase } from '../sim/site-de-la-case.js';
import { creerAtlas, rendreDalle, partOuvrageDeLaRangee, NB_TEINTES } from '../render/terrain.js';
import { spriteDuSite, FAMILLE } from '../render/embleme.js';
import { celluleDuSprite } from '../render/sprite.js';
import { niveauDesBatiments } from '../sim/niveau-de-base.js';

/** Les crans de zoom, du plus large au plus serré. Lus, jamais recopiés. */
export const CRANS = ZOOM_CARTE.crans;

/** Le cran sur lequel la carte s'ouvre : celui qui montre le plus. */
export const CRAN_PAR_DEFAUT = 0;

/**
 * À partir de quelle taille de case, en pixels CSS, l'emblème porte sa lettre.
 *
 * En dessous, la pastille reste — c'est la couleur du bord qui dit ce qu'elle
 * est —, mais une lettre de six pixels ne se lit pas et fait une tache.
 */
export const CSS_MINI_LETTRE = 40;

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
 * TCHEBYCHEV — le maximum des deux écarts —, comme la garde du peuplement et
 * les anneaux des satellites. Sur une grille, une case en diagonale n'est pas
 * plus loin qu'une case droit devant ; en mesurer trois là où le jeu en compte
 * deux ferait mentir toutes les distances du panneau.
 *
 * @param {{rangee: number, colonne: number}} a
 * @param {{rangee: number, colonne: number}} b
 * @returns {number}
 */
export function distanceEnCases(a, b) {
  return Math.max(Math.abs(a.rangee - b.rangee), Math.abs(a.colonne - b.colonne));
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
export function lignesDuSite(site, depuis) {
  const embleme = EMBLEMES_CARTE[site.type];
  if (embleme === undefined) throw new Error(`monde : type de site inconnu « ${site.type} »`);
  const distance = distanceEnCases(site, depuis);
  return [
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
export function initialiserEcranMonde(doc) {
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
      indicesDeTeinte(rvba), ZOOM_CARTE.pixelsParTuile, image.naturalWidth,
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

  function changerDeCran(pas) {
    const suivant = cranIndex + pas;
    if (suivant < 0 || suivant >= CRANS.length) return;
    // Ce qui est au centre de l'écran y reste : c'est la seule façon de zoomer
    // sans perdre ce qu'on regardait.
    const ancien = cran();
    const centreColonne = (vueX + canvas.width / 2) / ancien;
    const centreRangee = (vueY + canvas.height / 2) / ancien;
    cranIndex = suivant;
    // ⚠ LE CACHE SE VIDE, IL NE SE TRIE PAS. Une dalle est un rendu à un cran
    // donné ; la garder d'un cran à l'autre dessinerait l'ancienne échelle.
    cache.vider();
    vueX = centreColonne * cran() - canvas.width / 2;
    vueY = centreRangee * cran() - canvas.height / 2;
    recadrer();
    majBoutons();
    dessiner();
  }

  function majBoutons() {
    $('monde-zoom-moins').disabled = cranIndex === 0;
    $('monde-zoom-plus').disabled = cranIndex === CRANS.length - 1;
    const cssParCase = cran() / (fenetre.devicePixelRatio || 1);
    $('monde-echelle').textContent = `${Math.round(cssParCase)} px / case`;
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
   * ⚠ LA LETTRE RESTE, ET SON SEUIL NE BOUGE PAS. `CSS_MINI_LETTRE` existe
   * depuis le lot ÉCRAN-CARTE et vaut 40 px CSS : à `devicePixelRatio` 2, les
   * deux crans les plus SERRÉS (128 et 256 px physiques) la portent, les deux
   * plus larges non. C'est exactement le comportement voulu — un emblème vaut
   * 10,7 px CSS au cran le plus large, où une lettre ferait une tache. **Aucun
   * second seuil n'a été créé** ; celui-là a été cherché et trouvé.
   *
   * ⚠ L'ÉCHELLE SE LIT DANS `ZOOM_CARTE`. Un emblème est dessiné à la taille
   * d'une case, quelle que soit la grille source : `drawImage` met la cellule de
   * `grilleEmbleme` pixels à `taille` pixels, et le rapport suit tout seul le
   * jour où un cran bougera.
   */
  function dessinerEmbleme(site, x, y, taille) {
    const embleme = EMBLEMES_CARTE[site.type];
    const trait = Math.max(1, Math.round(taille / 16));

    if (emblemes !== null) {
      const cellule = celluleDuSprite(FAMILLE, spriteDuSite(
        site.type, palierDuSite(site, etatCourant), site.saveur,
      ));
      ctx.drawImage(
        emblemes,
        cellule.x, cellule.y, cellule.cote, cellule.cote,
        Math.round(x), Math.round(y), taille, taille,
      );
    } else {
      // Repli d'attente : le gabarit du lot ÉCRAN-CARTE, tel quel.
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

    if (taille / (fenetre.devicePixelRatio || 1) < CSS_MINI_LETTRE) return;
    ctx.fillStyle = embleme.bord;
    ctx.font = `600 ${Math.round(taille * 0.45)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(embleme.lettre, x + taille / 2, y + taille / 2 + trait / 2);
  }

  function dessiner() {
    if (etatCourant === null || canvas.width === 0) return;
    const ox = origineX();
    const oy = origineY();
    const restent = dessinerFond(ox, oy);

    const pas = cran();
    sitesAffiches = sitesDeLaFenetre(etatCourant, fenetreVisible({
      x: ox, y: oy, largeur: canvas.width, hauteur: canvas.height, cran: pas,
    }));
    for (const site of sitesAffiches) {
      dessinerEmbleme(
        site, (site.colonne - 1) * pas - ox, (site.rangee - 1) * pas - oy, pas,
      );
    }

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

  let pointeur = null;

  canvas.addEventListener('pointerdown', (evenement) => {
    canvas.setPointerCapture(evenement.pointerId);
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
    // Le dernier dessiné est celui du dessus : on le cherche donc à l'envers.
    for (let i = sitesAffiches.length - 1; i >= 0; i -= 1) {
      const site = sitesAffiches[i];
      if (site.rangee === rangee && site.colonne === colonne) {
        ouvrirPanneau(site);
        return;
      }
    }
    fermerPanneau();
  }

  canvas.addEventListener('pointerup', relacher);
  canvas.addEventListener('pointercancel', () => { pointeur = null; });

  // --- le panneau ------------------------------------------------------------

  function ouvrirPanneau(site) {
    panneauTitre.textContent = EMBLEMES_CARTE[site.type].nom;
    panneauCorps.textContent = '';
    for (const ligne of lignesDuSite(site, etatCourant.position)) {
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
    panneau.hidden = false;
  }

  function fermerPanneau() {
    panneau.hidden = true;
  }

  $('monde-panneau-fermer').addEventListener('click', fermerPanneau);
  $('monde-zoom-moins').addEventListener('click', () => changerDeCran(-1));
  $('monde-zoom-plus').addEventListener('click', () => changerDeCran(1));
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
