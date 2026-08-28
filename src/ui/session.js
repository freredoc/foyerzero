// La session de jeu — le temps qui passe, la sauvegarde, et le passage au banc.
//
// C'est la couche qui POSSÈDE l'état : elle le crée ou le charge, le fait
// avancer, l'écrit sur le disque du téléphone, et le donne à peindre à
// `ui/chantier.js`. L'écran ne sait rien de l'heure qu'il est ; le moteur non
// plus. Ce fichier est le seul des deux côtés.
//
// ---------------------------------------------------------------------------
// ⚠ CE FICHIER EST LE PORTEUR DE L'HORLOGE MURALE, ET IL EST LE SEUL
// ---------------------------------------------------------------------------
//
// `test/banc.test.js` §11 interdisait `Date.now` dans TOUT `src/`. La garde a
// été RETOURNÉE au lot ÉCRAN-CHANTIER, et voici pourquoi elle devait l'être :
// `charger(json, instantMs)` et `serialiser(etat, instantMs)` réclament
// l'instant présent depuis la v6 du format de sauvegarde, et personne n'avait
// le droit de le leur donner. Le rattrapage hors ligne — écrit, testé, livré au
// lot HORLOGE-MURALE — ne servait donc à rien : il n'y avait pas d'écran pour
// l'appeler.
//
// La garde retournée dit maintenant, et le test l'asserte dans les deux sens :
//   — interdiction TOTALE sur `src/sim/`, `src/data/` et `src/render/` ;
//   — EXACTEMENT UNE occurrence dans `src/ui/`, dans ce fichier-ci, nommé
//     dans le test. Ni zéro, ni deux : le compte est asserté, pour qu'une
//     seconde lecture soit refusée aussi durement qu'une disparition.
//
// D'où `maintenantMs()` ci-dessous, qui est LE point d'entrée du temps réel
// dans le jeu. Tout ce qui a besoin de l'heure l'appelle ; personne n'écrit une
// seconde fois le nom de l'horloge du langage.
//
// ⚠ ET ON NE CONTOURNE PAS. `performance.timeOrigin + performance.now()` rend
// l'heure murale sans écrire le nom que la garde cherche : ce serait passer
// dessous en silence, ce qui coûte plus cher que la contrainte posée. Le test
// refuse les deux formes de face, comme la garde de palette refuse les hex à
// trois et à huit chiffres.

import { creerEtat, charger, serialiser, tickJeu, rattraperJeu } from '../sim/state.js';
import { accumuler } from '../sim/clock.js';
import { initialiserEcranChantier } from './chantier.js';
import { initialiserEcranOffense } from './offense.js';
import { initialiserBanc } from './banc.js';

/**
 * LA seule lecture de l'horloge murale de tout le dépôt.
 * @returns {number} ms depuis l'époque, entier.
 */
function maintenantMs() {
  return Date.now();
}

// ---------------------------------------------------------------------------
// Sauvegarde locale
// ---------------------------------------------------------------------------
//
// `localStorage`, et c'était déjà décidé : l'enveloppe Android active
// `domStorageEnabled` « pour sa sauvegarde locale » et fixe une ORIGINE STABLE,
// avec le commentaire « en changer perdrait les sauvegardes ». Ce lot est celui
// que l'enveloppe attendait.

/**
 * La clé de la sauvegarde. Le « 1 » est la version de l'EMPLACEMENT, pas celle
 * du contenu.
 *
 * ⚠ NE PAS Y METTRE `SAVE_VERSION`. Le format de sauvegarde en est à sa
 * sixième version et il se MIGRE : une clé qui porterait le numéro du format
 * rendrait toutes les sauvegardes antérieures introuvables, et la chaîne de
 * migrations — écrite, éprouvée, six maillons — ne servirait plus jamais. Ce
 * numéro-ci ne bougera que le jour où l'emplacement lui-même changera de sens
 * (plusieurs parties, plusieurs bases), et ce jour-là l'ancienne clé pourra
 * être lue puis convertie.
 */
export const CLE_SAUVEGARDE = 'foyer-zero/partie/1';

/**
 * Où va une sauvegarde qu'on n'a pas su relire, si le joueur choisit de
 * repartir de zéro. Elle N'EST PAS SUPPRIMÉE : « rien ne se retire en
 * silence » vaut d'abord pour ce que le joueur a de plus précieux.
 */
export const CLE_SECOURS = 'foyer-zero/partie/1.illisible';

/** Intervalle d'écriture périodique, en plus de l'écriture au masquage. */
export const PERIODE_SAUVEGARDE_MS = 30_000;

/**
 * Au-delà de ce nombre de ticks dus d'un coup, on rattrape analytiquement au
 * lieu de boucler.
 *
 * ⚠ LES DEUX CHEMINS RENDENT LE MÊME ÉTAT AU BIT PRÈS — c'est l'invariant que
 * `test/state.test.js` et `test/economie-base.test.js` gardent. Le seuil n'est
 * donc pas un compromis d'exactitude, seulement de coût : boucler reste le
 * chemin normal parce que c'est lui qui portera le combat quand `tickJeu`
 * fera plus que l'économie, et le rattrapage prend le relais quand la boucle
 * coûterait trop cher — au retour d'un onglet masqué, par exemple, où
 * `requestAnimationFrame` s'est tu pendant des minutes.
 *
 * Une minute de jeu à 10 Hz. À 280,7 µs le tick sur une base pleine, 600 ticks
 * font 0,17 s : c'est la limite de ce qu'on peut faire tenir dans une image
 * sans que ça se voie.
 */
export const SEUIL_RATTRAPAGE_TICKS = 600;

/** Durée de l'appui long qui ouvre le banc d'essai. */
export const DUREE_APPUI_DEBUG_MS = 1500;

/**
 * Un chronomètre de temps RÉEL, à source injectée.
 *
 * ⚠ POURQUOI IL EXISTE, ET C'EST LE DÉFAUT LE PLUS COÛTEUX DE CET ÉCRAN.
 * La boucle mesurait le temps écoulé sur les horodatages de
 * `requestAnimationFrame`. Ils sont MONOTONES : ils ne courent pas pendant que
 * la page est gelée. Tant qu'un `visibilitychange` encadrait le gel, le
 * rattrapage de `reprendre()` réparait — mais **quand l'évènement ne se
 * déclenche pas, le temps est perdu pour toujours**. Sur Android c'est le cas
 * courant, pas le cas rare : le système fige un onglet sans le masquer, et la
 * restauration passe par le cache de page.
 *
 * Mesuré le 27/08 sur le HTML livré, deux minutes de gel sans évènement :
 * **0,006 unité produite au lieu de 8.** C'est exactement ce qu'Ethan a vu sur
 * son téléphone — un compteur qui n'avance que pendant qu'on le regarde.
 *
 * ⚠ LE REMÈDE N'EST PAS UN ÉVÈNEMENT DE PLUS. En ajouter un — `pageshow`,
 * `focus`, `resume` — c'est parier que celui-là se déclenchera toujours. Le
 * remède est de n'en dépendre d'AUCUN : `requestAnimationFrame` dit QUAND
 * dessiner, l'horloge murale dit COMBIEN de temps a passé. Un gel manqué se
 * répare alors tout seul à la première image du retour, où l'écart mesuré est
 * simplement grand.
 *
 * ⚠ IL NE LIT PAS L'HEURE LUI-MÊME. La source est injectée, ce qui le rend
 * testable sans DOM et sans horloge système — et ce qui laisse `maintenantMs`
 * seule lectrice de l'horloge dans tout `src/`, comme la garde §11 l'exige.
 *
 * @param {() => number} lireInstant
 * @returns {{ ecoule: () => number }}
 */
export function creerChronometre(lireInstant) {
  let precedent = null;
  return {
    ecoule() {
      const maintenant = lireInstant();
      if (precedent === null) {
        precedent = maintenant;
        return 0;
      }
      const delta = maintenant - precedent;
      precedent = maintenant;
      return delta > 0 ? delta : 0;
    },
  };
}

/**
 * Fait avancer un état d'une durée réelle écoulée.
 *
 * ⚠ UNE DURÉE NÉGATIVE NE FAIT RIEN, ELLE NE LÈVE PAS. Fuseau, NTP, joueur qui
 * change la date de son téléphone : la même règle que `charger`, et pour la
 * même raison — punir le joueur pour l'heure de son appareil n'a jamais rendu
 * une ressource à personne.
 *
 * @param {object} etat
 * @param {number} ecouleMs
 * @returns {number} ticks exécutés
 */
export function avancer(etat, ecouleMs) {
  const dus = accumuler(etat.horloge, ecouleMs > 0 ? ecouleMs : 0);
  if (dus === 0) return 0;
  if (dus > SEUIL_RATTRAPAGE_TICKS) {
    rattraperJeu(etat, dus);
  } else {
    for (let i = 0; i < dus; i++) tickJeu(etat);
  }
  return dus;
}

// ---------------------------------------------------------------------------
// Le câblage
// ---------------------------------------------------------------------------

/**
 * Démarre la session dans une page qui porte le balisage attendu.
 * @param {Document} doc
 */
export function initialiserSession(doc) {
  const fenetre = doc.defaultView;
  const $ = (id) => doc.getElementById(id);

  let etat = null;
  let ecran = null;
  let idImage = null;
  const chrono = creerChronometre(maintenantMs);
  let dernierAffichageMs = 0;
  let instantSuspensionMs = null;
  let derniereSauvegardeMs = 0;
  let sauvegardeArmee = false;
  let bancInitialise = false;
  // Lequel des deux écrans de JEU est en scène. Le banc, lui, les remplace tous
  // les deux et n'entre pas dans cette variable : il a sa propre porte.
  let ecranCourant = 'chantier';

  // --- le magasin, qui peut ne pas exister ---------------------------------
  //
  // Lire `localStorage` LÈVE dans certains modes de confidentialité — ce n'est
  // pas un `null` qu'on récupère, c'est une exception à l'accès. On la prend
  // ici, une fois, et le jeu tourne quand même : une partie sans sauvegarde
  // vaut mieux qu'un écran blanc, à condition de le DIRE.
  let magasin = null;
  try {
    magasin = fenetre.localStorage;
  } catch {
    magasin = null;
  }

  // Le bandeau d'avis appartient à l'écran Chantier — c'est son élément. La
  // session lui parle au lieu d'écrire dedans : depuis que la pose s'y exprime
  // aussi, deux modules qui écriraient la même ligne sans se connaître
  // finiraient par s'effacer l'un l'autre.
  function avis(texte) {
    if (ecran !== null) ecran.avis(texte);
  }

  function lireSauvegarde() {
    if (magasin === null) return null;
    try {
      return magasin.getItem(CLE_SAUVEGARDE);
    } catch (erreur) {
      avis(`Sauvegarde illisible sur cet appareil : ${erreur.message}`);
      return null;
    }
  }

  function sauvegarder() {
    if (!sauvegardeArmee || etat === null || magasin === null) return;
    try {
      magasin.setItem(CLE_SAUVEGARDE, serialiser(etat, maintenantMs()));
      derniereSauvegardeMs = maintenantMs();
      avis('');
    } catch (erreur) {
      // On ne réessaie pas en boucle et on ne supprime rien : on le dit.
      avis(`Sauvegarde impossible : ${erreur.message}`);
    }
  }

  // --- la boucle -------------------------------------------------------------

  function image() {
    idImage = fenetre.requestAnimationFrame(image);
    // ⚠ LE TEMPS VIENT DE L'HORLOGE, PAS DE L'HORODATAGE D'IMAGE. Voir
    // `creerChronometre` : un gel non signalé se répare ici tout seul, la
    // première image du retour mesurant simplement un grand écart.
    avancer(etat, chrono.ecoule());

    // ⚠ L'AFFICHAGE NE SUIT PAS LA SIMULATION. Le moteur tourne à 10 Hz, l'écran
    // à celle de l'appareil ; réécrire six nombres soixante fois par seconde
    // coûte du texte que personne ne lit. Un rafraîchissement par tick suffit à
    // voir les stocks monter, et c'est exactement ce que la vérification
    // appareil n° 3 demande.
    const instant = maintenantMs();
    if (instant - dernierAffichageMs >= 100) {
      dernierAffichageMs = instant;
      ecran.rafraichir(etat);
    }
    if (instant - derniereSauvegardeMs >= PERIODE_SAUVEGARDE_MS) sauvegarder();
  }

  function demarrerBoucle() {
    // ⚠ PAS DE BOUCLE SANS ÉTAT. Tant que le joueur n'a pas tranché devant le
    // panneau « sauvegarde illisible », `etat` vaut null : un aller-retour
    // d'application relancerait sinon la boucle sur `undefined.horloge`, et
    // l'écran tomberait au lieu de garder sa question posée.
    if (idImage !== null || etat === null) return;
    // Le chronomètre repart de l'instant présent : ce qui s'est écoulé pendant
    // l'arrêt a déjà été soldé par `reprendre()`, ou le sera par la première
    // image si aucun évènement n'a encadré le gel.
    chrono.ecoule();
    idImage = fenetre.requestAnimationFrame(image);
  }

  function arreterBoucle() {
    if (idImage === null) return;
    fenetre.cancelAnimationFrame(idImage);
    idImage = null;
  }

  /**
   * Suspend le jeu et retient l'heure qu'il était.
   *
   * ⚠ POURQUOI L'HORLOGE MURALE ET PAS `requestAnimationFrame`. Les horodatages
   * d'image sont MONOTONES : ils ne courent pas pendant que la page est
   * masquée. Une application repliée puis rouverte sans être tuée ne repasserait
   * donc par aucun rattrapage, et les stocks resteraient ceux d'il y a une
   * heure — alors même que le rattrapage de `charger` marche parfaitement quand
   * l'application, elle, a été TUÉE. Deux chemins de retour, un seul devait
   * suffire à réparer les deux.
   */
  function suspendre() {
    arreterBoucle();
    sauvegarder();
    instantSuspensionMs = maintenantMs();
  }

  function reprendre() {
    if (etat === null) return;
    if (instantSuspensionMs !== null) {
      avancer(etat, maintenantMs() - instantSuspensionMs);
      instantSuspensionMs = null;
      ecran.rafraichir(etat);
    }
    demarrerBoucle();
  }

  // --- démarrage -------------------------------------------------------------

  function installer(nouvel) {
    etat = nouvel;
    sauvegardeArmee = true;
    $('chantier-alerte').hidden = true;
    ecran.peindre(etat);
    ecran.rafraichir(etat);
    ecran.ouvrirSurLaBase();
    sauvegarder();
    demarrerBoucle();
  }

  function partieNeuve() {
    // ⚠ LA GRAINE VIENT DE L'HORLOGE, ET C'EST LE SEUL ENDROIT OÙ CE SERAIT
    // ACCEPTABLE. Le déterminisme du projet porte sur la SIMULATION : une fois
    // la graine choisie elle est écrite dans l'état, sauvegardée, et tout ce qui
    // en découle est reproductible pour toujours. Ce qu'on interdit, c'est
    // qu'un tick lise l'heure — pas qu'une partie neuve tire son numéro. Sans
    // ça il faudrait `Math.random`, que le dépôt refuse partout, ou une graine
    // fixe, qui donnerait la même partie à tout le monde.
    installer(creerEtat(maintenantMs() >>> 0));
  }

  function signalerSauvegardeIllisible(brut, erreur) {
    // ⚠ ON NE SUPPRIME RIEN ET ON NE DÉCIDE RIEN. Une sauvegarde qu'on n'a pas
    // su relire reste sur l'appareil ; on dit ce qui s'est passé, et on propose.
    // C'est « rien ne se retire en silence » appliqué à ce que le joueur a de
    // plus précieux — et tant qu'il n'a pas choisi, l'écriture reste DÉSARMÉE,
    // pour qu'aucune partie neuve ne vienne écraser ce qui est peut-être
    // récupérable.
    sauvegardeArmee = false;
    $('chantier-alerte-message').textContent = erreur.message;
    $('chantier-alerte').hidden = false;
    $('chantier-alerte-neuve').onclick = () => {
      try {
        if (brut !== null && magasin !== null) magasin.setItem(CLE_SECOURS, brut);
      } catch (echec) {
        avis(`L'ancienne sauvegarde n'a pas pu être mise de côté : ${echec.message}`);
      }
      partieNeuve();
    };
    $('chantier-alerte-reessayer').onclick = () => demarrer();
  }

  function demarrer() {
    const brut = lireSauvegarde();
    if (brut === null) {
      partieNeuve();
      return;
    }
    try {
      // ⚠ `charger` RATTRAPE, il ne fait pas que restaurer. C'est le seul moment
      // où l'on connaît à la fois la sauvegarde et l'instant présent.
      installer(charger(brut, maintenantMs()));
    } catch (erreur) {
      signalerSauvegardeIllisible(brut, erreur);
    }
  }

  // --- les deux écrans de jeu -----------------------------------------------
  //
  // ⚠ LE JEU NE S'ARRÊTE PAS QUAND ON CHANGE D'ÉCRAN. `suspendre()` et
  // `reprendre()` existent pour le BANC, qui remplace la page et n'a aucune
  // raison de laisser tourner une base derrière lui, et pour le masquage de
  // l'application. Les appeler ici gèlerait l'économie du joueur chaque fois
  // qu'il va regarder ses vagues — et pire, il ne le verrait pas : au retour,
  // le rattrapage par l'horloge murale rendrait les ressources manquantes, si
  // bien que le défaut ne se lirait que sur un chronomètre. On se contente donc
  // de montrer l'un et de cacher l'autre.

  // ⚠ TROIS ÉCRANS DEPUIS LE 28/08, et un en-tête COMMUN au-dessus d'eux. Les
  // onglets, les ressources, la bascule entre bases et la barre du bas ont
  // quitté `#ecran-chantier` : changer d'écran ne les fait plus disparaître,
  // ce qu'Ethan demandait (« garder la barre quartz scories etc et monde option
  // dans le menu offense »).
  const ECRANS = ['chantier', 'offense', 'options'];

  function montrerEcran(nom) {
    ecranCourant = nom;
    for (const autre of ECRANS) $(`ecran-${autre}`).hidden = autre !== nom;
    // Les onglets du haut ET la barre du bas doivent dire où l'on est. Le
    // premier est à la session ; le second appartient à l'écran Chantier, qui
    // le construit — d'où l'appel, plutôt qu'une seconde écriture ici.
    $('onglet-base').classList.toggle('actif', nom !== 'options');
    $('onglet-options').classList.toggle('actif', nom === 'options');
    if (ecran !== null) ecran.marquerEcran(nom);
  }

  $('onglet-base').addEventListener('click', () => montrerEcran('chantier'));
  $('onglet-options').addEventListener('click', () => montrerEcran('options'));

  // --- le banc d'essai, derrière un appui long -------------------------------
  //
  // ARBITRÉ le 27/08 : le banc RESTE dans le HTML livré, caché derrière un geste
  // de debug. C'est aussi ce que T10 exige déjà — il asserte la présence de ses
  // contrôles dans `dist/index.html`.
  //
  // ⚠ `initialiserBanc` N'EST APPELÉ QU'À L'OUVERTURE, jamais au chargement : il
  // pose des écouteurs, un ResizeObserver et une projection, et n'a rien à faire
  // tourner derrière l'écran de jeu. Une seule fois, ensuite le balisage reste
  // câblé.

  function ouvrirLeBanc() {
    suspendre();
    // ⚠ UN SEUL ÉLÉMENT À CACHER DEPUIS LE 28/08. Le banc masquait les écrans
    // un par un ; avec trois écrans et deux barres communes, en oublier un
    // serait une question de temps. `#jeu` les contient tous.
    $('jeu').hidden = true;
    $('banc').hidden = false;
    if (!bancInitialise) {
      // Après le démasquage, pas avant : le banc mesure son canvas au câblage,
      // et un élément caché mesure zéro.
      initialiserBanc(doc);
      bancInitialise = true;
    }
    fenetre.dispatchEvent(new fenetre.Event('resize'));
  }

  function fermerLeBanc() {
    $('banc').hidden = true;
    $('jeu').hidden = false;
    // On rend l'écran qu'on avait pris, pas systématiquement le Chantier :
    // revenir du banc ne doit pas déplacer le joueur.
    montrerEcran(ecranCourant);
    reprendre();
  }

  const version = $('options-version');
  let minuterieDebug = null;
  const annulerAppui = () => {
    if (minuterieDebug === null) return;
    fenetre.clearTimeout(minuterieDebug);
    minuterieDebug = null;
    version.classList.remove('appui');
  };
  version.addEventListener('pointerdown', () => {
    annulerAppui();
    version.classList.add('appui');
    minuterieDebug = fenetre.setTimeout(() => {
      minuterieDebug = null;
      version.classList.remove('appui');
      ouvrirLeBanc();
    }, DUREE_APPUI_DEBUG_MS);
  });
  for (const fin of ['pointerup', 'pointercancel', 'pointerleave']) {
    version.addEventListener(fin, annulerAppui);
  }
  // Un appui long fait sortir le menu de sélection de texte sur Android : il
  // masquerait le banc au moment même où il s'ouvre.
  version.addEventListener('contextmenu', (evenement) => evenement.preventDefault());
  $('banc-fermer').addEventListener('click', fermerLeBanc);

  // --- le temps qui passe pendant qu'on ne regarde pas -----------------------

  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden) {
      suspendre();
    } else if ($('banc').hidden) {
      reprendre();
    }
  });
  // `pagehide` est le dernier moment garanti avant qu'une WebView Android ne
  // soit rendue : `visibilitychange` ne suffit pas quand le système tue
  // l'application sans la masquer d'abord.
  fenetre.addEventListener('pagehide', () => sauvegarder());

  ecran = initialiserEcranChantier(doc, {
    // La pose est la première action irréversible du jeu : elle s'écrit tout de
    // suite, sans attendre l'enregistrement périodique.
    apresPose: () => sauvegarder(),
    // ⚠ L'ÉCRAN DEMANDE, LA SESSION DÉCIDE. La barre du bas appartient à
    // l'écran Chantier — c'est lui qui la construit et qui y affiche les
    // niveaux — mais un de ses trois boutons change d'ÉCRAN, ce que seule la
    // session sait faire. Même découpage que `apresPose`.
    versEcran: (nom) => montrerEcran(nom),
  });
  // L'écran Offense se construit une fois et ne se rafraîchit jamais : tant
  // qu'aucune armée n'existe, rien de ce qu'il montre ne change avec le temps.
  initialiserEcranOffense(doc);
  montrerEcran('chantier');
  demarrer();
}
