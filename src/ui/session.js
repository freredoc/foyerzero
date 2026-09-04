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

import {
  creerEtat, charger, serialiser, tickJeu, rattraperJeu, reglerTutoriel, baseCourante,
} from '../sim/state.js';
import { accumuler } from '../sim/clock.js';
import { initialiserEcranChantier } from './chantier.js';
import { tousLesFonds, nomCssDuFond } from '../render/fond.js';
import { initialiserPanneauDeTransfert } from './transfert.js';
import { initialiserEcranOffense } from './offense.js';
import { initialiserEcranMission, initialiserMiniTutoriel } from './mission.js';
import { initialiserEcranMonde } from './monde.js';
import { initialiserEcranRaid } from './raid.js';
import { initialiserEcranRecherche } from './recherche.js';
import { initialiserBanc } from './banc.js';
import { initialiserLeSon } from './son.js';
import { bouclesDesirees, evenementDuGeste } from '../son/cablage.js';
import { REGLAGES_PAR_DEFAUT } from '../data/sons.js';

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

/**
 * Le magasin des RÉGLAGES — volume, son coupé. Rien de ce qui s'y range n'est
 * un fait de partie.
 *
 * ⚠⚠ IL EST SÉPARÉ DE LA SAUVEGARDE, ET C'EST L'ARBITRAGE DU LOT SON-MOTEUR.
 * Mettre le volume dans l'état obligerait à faire monter `SAVE_VERSION` et à
 * écrire une migration pour un curseur — et surtout, effacer sa partie
 * remettrait le son à fond, ce qui n'a aucun sens. Les réglages survivent à la
 * partie ; c'est ce qui les distingue d'elle.
 *
 * ⚠ NE PAS Y METTRE `SAVE_VERSION`, pour la raison qui vaut déjà pour la clé
 * de sauvegarde juste au-dessus : ce numéro-ci est celui de l'EMPLACEMENT.
 */
export const CLE_REGLAGES = 'foyer-zero/reglages/1';

/**
 * Relit les réglages du magasin, en refusant tout ce qui n'a pas la bonne
 * forme. Fonction PURE, pour être éprouvable sans magasin.
 *
 * ⚠ UN RÉGLAGE ILLISIBLE REVIENT AU DÉFAUT, IL NE LÈVE PAS. Un JSON tronqué par
 * un magasin plein rendrait le jeu instartable pour un curseur de volume ; et
 * le défaut est le son ACTIF, donc l'erreur ne se paie pas d'un silence qu'on
 * ne saurait pas expliquer.
 *
 * @param {string|null} brut
 * @returns {{muet: boolean, volume: number}}
 */
export function lireLesReglages(brut) {
  let lu = null;
  try {
    lu = JSON.parse(brut ?? '');
  } catch {
    return { ...REGLAGES_PAR_DEFAUT };
  }
  if (lu === null || typeof lu !== 'object') return { ...REGLAGES_PAR_DEFAUT };
  const volume = Number(lu.volume);
  return {
    muet: lu.muet === true,
    volume: Number.isFinite(volume) && volume >= 0 && volume <= 1
      ? volume
      : REGLAGES_PAR_DEFAUT.volume,
  };
}

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
// ---------------------------------------------------------------------------
// Les atlas partagés — déclarés dans la feuille, servis aux `<img>` de la page
// ---------------------------------------------------------------------------
//
// ⚠⚠ POURQUOI LE COUPLAGE VA DANS CE SENS-LÀ, ET PAS DANS L'AUTRE. Quatre atlas
// servent des deux côtés : en `background-image` sur des éléments du DOM — le
// sol de la base, les unités de l'écran Offense — et en `drawImage` sur un
// canevas, qui exige un `HTMLImageElement` et pas une URL. Il faut donc que
// chacun existe sous les deux formes, SANS entrer deux fois dans le fichier :
// mesuré, ce serait 507 464 octets de base64 en trop, plus de sept fois la
// marge qui reste sous la borne de T10.
//
// On aurait pu garder le `src` dans le balisage et faire écrire la variable par
// le JS. C'est ce qui a été essayé, et le BUILD l'a refusé, à raison : écrire
// `url("…")` depuis JavaScript met dans le HTML final une chaîne que la garde
// offline ne peut pas distinguer d'une vraie référence externe, et la faire
// taire pour ce cas-là aurait été passer sous un garde-fou en silence —
// exactement ce que CLAUDE.md §6 interdit pour les hex à trois chiffres et
// pour l'espace de noms SVG. Dans ce sens-ci, le JS ne fait que LIRE un `url()`
// que le build a écrit et vérifié.
//
// ⚠ ET LA VALEUR SE DÉBALLE, ELLE NE SE DEVINE PAS. `getPropertyValue` rend
// `url("data:image/png;base64,…")`, guillemets compris ou non selon le
// navigateur : on prend ce qui est entre les parenthèses et on retire une paire
// de guillemets si elle y est.

/**
 * Les atlas qui vivent dans la feuille et qu'un `<img>` de la page doit servir.
 *
 * ⚠ LA CLÉ EST L'IDENTIFIANT DE L'IMAGE, la valeur le nom de la variable. Les
 * trois atlas d'unité gardent les identifiants qu'ils avaient : `ui/banc.js`
 * les demande par ces noms-là depuis le lot UNITÉS-AU-COMBAT, et les renommer
 * aurait été un second changement pour rien.
 */
export const ATLAS_DE_LA_PAGE = {
  'monde-atlas': '--atlas-sol',
  'atlas-unite': '--atlas-unite',
  'atlas-chassis': '--atlas-chassis',
  'atlas-tourelle-unite': '--atlas-tourelle-unite',
  // ⚠ LES TROIS DE L'ÉCRAN DE RAID. Ils étaient déjà dans la feuille pour le
  // fond CSS du Chantier ; leur donner aussi une balise ne les inline pas une
  // seconde fois, `garnirLesAtlas` ne recopiant qu'une adresse.
  'atlas-batiment': '--atlas-batiment',
  'atlas-defense': '--atlas-defense',
  'atlas-socle': '--atlas-socle',
  // ⚠⚠ ET LES HUIT DÉCORS DE BASE — lot MUR-PEINT, 03/09. Ils sont déclarés en
  // variables CSS pour l'écran de la base, qui peint son fond en `background`,
  // et le canevas de l'écran de raid en veut des `HTMLImageElement`. C'est
  // exactement le cas que cette table existe pour traiter : une déclaration, deux
  // formes, aucune image inlinée deux fois.
  //
  // ⚠ LA LISTE SE DÉRIVE DE LA TABLE DES FONDS, elle ne se recopie pas — et
  // l'identifiant comme la variable viennent de `nomCssDuFond`, pour que les
  // deux ne puissent pas diverger d'un tiret.
  ...Object.fromEntries(tousLesFonds().map(
    (nom) => [nom.replaceAll('_', '-'), nomCssDuFond(nom)],
  )),
};

/**
 * Extrait l'URL d'une valeur CSS `url(…)`.
 *
 * @param {string} valeur
 * @returns {string} l'URL, sans les parenthèses ni les guillemets
 */
export function urlDeLaValeurCss(valeur) {
  const brut = (valeur ?? '').trim();
  const ouvre = brut.indexOf('(');
  const ferme = brut.lastIndexOf(')');
  if (ouvre < 0 || ferme <= ouvre) return '';
  return brut.slice(ouvre + 1, ferme).trim().replace(/^["']|["']$/g, '');
}

/**
 * Donne son `src` à chaque `<img>` d'atlas, depuis la variable qui le porte.
 *
 * ⚠ ON LÈVE PLUTÔT QUE DE LAISSER UNE IMAGE VIDE. Un atlas absent rendrait le
 * champ de bataille muet — des unités invisibles, une carte noire — et rien ne
 * le dirait. C'est la règle de `executer` dans `render/canvas2d.js` : « une
 * unité invisible est un défaut qu'on doit voir ».
 *
 * @param {Document} doc
 */
export function garnirLesAtlas(doc) {
  const style = doc.defaultView.getComputedStyle(doc.documentElement);
  for (const [id, variable] of Object.entries(ATLAS_DE_LA_PAGE)) {
    const image = doc.getElementById(id);
    if (image === null) throw new RangeError(`session : l'image « ${id} » manque à la page`);
    const source = urlDeLaValeurCss(style.getPropertyValue(variable));
    if (source === '') throw new RangeError(`session : la variable « ${variable} » est vide`);
    image.src = source;
  }
}

/**
 * Les atlas dont le champ de bataille a besoin, par le slug de `tools/atlas.py`.
 *
 * ⚠ LA CLÉ EST LE SLUG, DONC `tourelle_unite` À SOULIGNÉ, quand l'identifiant
 * HTML garde son tiret. Les deux ne se ressemblent qu'à l'œil : le slug devient
 * une clé JavaScript, l'identifiant reste du HTML. Même table que celle du banc,
 * augmentée des trois que seul un SITE porte — un champ de bataille de l'Ouvrage
 * a des bâtiments et des défenses, ce que le banc n'avait jamais à dessiner.
 *
 * @param {Document} doc
 * @returns {Object<string, HTMLImageElement>}
 */
export function atlasDeLaScene(doc) {
  const scene = {
    unite: doc.getElementById('atlas-unite'),
    chassis: doc.getElementById('atlas-chassis'),
    tourelle_unite: doc.getElementById('atlas-tourelle-unite'),
    batiment: doc.getElementById('atlas-batiment'),
    defense: doc.getElementById('atlas-defense'),
    socle: doc.getElementById('atlas-socle'),
  };
  // ⚠⚠ ET LES HUIT DÉCORS DE BASE, UNE FAMILLE PAR IMAGE — lot MUR-PEINT,
  // 03/09. Ils remplacent les six pièces de mur de l'Ouvrage qui étaient ici.
  // Un décor fait 1080 × 2160 : il n'est dans aucun atlas et ne peut pas y être,
  // `tools/atlas.py` n'acceptant que des cellules carrées d'un même côté. La
  // primitive `sprite` prend donc son nom pour famille, et chaque image est une
  // famille d'une seule — ce qui est exactement ce que « hors atlas » veut dire.
  //
  // ⚠⚠ LES HUIT, ET PLUS SEULEMENT UN CAMP. L'anneau ne donnait de balise qu'à
  // l'Ouvrage, l'écran de raid ne montrant que ses bases ; mais le décor du
  // JOUEUR devra se dessiner sur ce même canevas le jour où
  // `sim/raid-ouvrage.js` aura son écran, et les huit sont déjà déclarés pour
  // l'écran de la base — les donner tous ne coûte donc pas un octet de plus.
  //
  // ⚠ LA LISTE SE DÉRIVE DE LA TABLE DES FONDS, elle ne se recopie pas. Une
  // liste écrite à la main serait la première à oublier un décor le jour où un
  // neuvième entrerait, et `executer` LÈVE sur une famille absente plutôt que de
  // dessiner un fond vide : « une unité invisible est un défaut qu'on doit voir ».
  for (const nom of tousLesFonds()) {
    scene[nom] = doc.getElementById(nom.replaceAll('_', '-'));
  }
  return scene;
}

/**
 * Ce que la ligne de mise à jour affiche quand l'enveloppe Android n'est pas là.
 *
 * ⚠ ELLE DIT POURQUOI, PAS « INDISPONIBLE ». Un joueur qui ouvre le jeu dans un
 * navigateur n'a pas d'installation à mettre à jour : il recharge la page et il
 * a la dernière version. Le lui dire vaut mieux qu'un bouton mort.
 */
export const MAJ_SANS_PONT = 'Dans un navigateur, rechargez la page : '
  + 'la vérification automatique n\'existe que dans l\'application.';

/** Entre deux lectures de l'état d'une vérification qui tourne. */
export const MAJ_PERIODE_MS = 1000;

/**
 * Lit l'état rendu par le pont de mise à jour de l'enveloppe Android.
 *
 * ⚠⚠ IL NE FAIT JAMAIS CONFIANCE À CE QU'IL REÇOIT. Le pont rend une chaîne ;
 * une version d'enveloppe plus ancienne que cette page peut rendre autre chose
 * que ce qu'on attend, ou rien du tout — c'est exactement le cas d'un joueur
 * dont l'APK date d'avant ce lot et dont le HTML s'est mis à jour tout seul par
 * Pages, ce qui est le fonctionnement NORMAL du projet. Une exception ici
 * tomberait au milieu du câblage de l'écran Options.
 *
 * ⚠ ET LE REPLI EST UNE PHRASE, PAS UN CHAMP VIDE. Une ligne blanche se lirait
 * comme un bouton sans effet.
 *
 * @param {string} brut le JSON rendu par le pont
 * @returns {{etape: string, build: number|null, buildServi: number|null, message: string}}
 */
export function lireEtatDeMaj(brut) {
  const repli = {
    etape: 'INCONNUE', build: null, buildServi: null, message: 'État de mise à jour illisible.',
  };
  if (typeof brut !== 'string' || brut === '') return repli;
  let lu;
  try {
    lu = JSON.parse(brut);
  } catch {
    return repli;
  }
  if (lu === null || typeof lu !== 'object') return repli;
  const message = typeof lu.message === 'string' && lu.message !== '' ? lu.message : repli.message;
  return {
    etape: typeof lu.etape === 'string' ? lu.etape : repli.etape,
    build: Number.isFinite(lu.build) ? lu.build : null,
    // ⚠ ABSENT D'UNE ENVELOPPE D'AVANT LE 03/09, ET C'EST PRÉVU : `null`, jamais
    // zéro. Un zéro se lirait « build 0 en cours » sur l'écran d'un joueur dont
    // l'APK est ancien.
    buildServi: Number.isFinite(lu.buildServi) ? lu.buildServi : null,
    message,
  };
}

/**
 * La phrase que l'écran Options affiche, à partir de l'état du pont ET du build
 * de la page qui l'affiche.
 *
 * ⚠⚠ ELLE EXISTE PARCE QUE LE PONT SEUL NE PEUT PAS DIRE LA VÉRITÉ SUR UNE VIEILLE
 * ENVELOPPE. Ethan, le 03/09 : « le jeu détecte la mise à jour mais refuse de
 * l'implanter ». Sa capture montrait « v0.67.0 b68 » et, deux lignes plus bas,
 * « À jour — build 70 » — deux nombres qui se contredisaient. La cause est dans
 * l'enveloppe : le verdict était calculé sur le build du DISQUE, pas sur celui
 * qui TOURNE, et une mise à jour installée qui attend une relance se lisait
 * « à jour ». C'est corrigé côté Kotlin (`EtatMiseAJour.verdictSansTelechargement`).
 *
 * ⚠⚠ MAIS LE KOTLIN N'ARRIVE QUE PAR UN NOUVEL APK, ET LE HTML ARRIVE TOUT SEUL.
 * C'est tout le sens du projet : Pages met la page à jour, l'enveloppe reste
 * celle qu'on a installée. Cette page-ci doit donc pouvoir dire la vérité
 * SEULE, sous l'enveloppe qu'Ethan a déjà — et elle le peut, parce qu'elle
 * connaît son propre build et que le pont lui donne celui du disque.
 *
 * ⚠ ELLE EST PURE, ET C'EST CE QUI LA REND TESTABLE ICI. Le dépôt n'a ni jsdom ni
 * navigateur (CLAUDE.md §3) : une décision écrite dans le câblage de l'écran ne
 * se serait mesurée nulle part.
 *
 * @param {{etape: string, build: number|null, message: string}} lu
 * @param {number|null} monBuild le build de CETTE page, ou `null` s'il est illisible
 * @returns {string}
 */
export function ligneDeMiseAJour(lu, monBuild) {
  if (Number.isFinite(monBuild) && Number.isFinite(lu.build) && lu.build > monBuild) {
    // ⚠ ON NOMME LES DEUX NOMBRES ET ON DIT LE GESTE. « Build 70 installé » seul
    // laisserait le joueur devant le même écart inexpliqué ; c'est « relance le
    // jeu » qui transforme un constat en action.
    return `Build ${lu.build} installé — relance le jeu pour l'activer `
      + `(build ${monBuild} en cours).`;
  }
  return lu.message;
}

export function initialiserSession(doc) {
  const fenetre = doc.defaultView;
  const $ = (id) => doc.getElementById(id);

  let etat = null;
  let ecran = null;
  let ecranMission = null;
  let ecranOffense = null;
  let ecranMonde = null;
  let ecranRaid = null;
  let ecranRecherche = null;
  let miniTutoriel = null;
  let panneauTransfert = null;
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

  // --- les réglages, et le son ---------------------------------------------
  //
  // ⚠ L'OBJET EST VIVANT : la session le modifie, `ui/son.js` le transmet à la
  // politique sans jamais en lire un champ. C'est ce qui garde l'adaptateur
  // sans décision — il ne sait pas ce qu'est « muet ».
  let reglages = { ...REGLAGES_PAR_DEFAUT };
  try {
    if (magasin !== null) reglages = lireLesReglages(magasin.getItem(CLE_REGLAGES));
  } catch { /* magasin illisible : on garde le défaut, et le jeu démarre */ }

  function enregistrerLesReglages() {
    if (magasin === null) return;
    try {
      magasin.setItem(CLE_REGLAGES, JSON.stringify(reglages));
    } catch { /* magasin plein : le réglage vaut pour la session, et c'est tout */ }
  }

  // ⚠ LA GRAINE DU TIRAGE DE VARIANTE VIENT DE L'HORLOGE MURALE, PAS DU FLUX DE
  // LA PARTIE. `etat.rng` est le flux de la SIMULATION : y prendre un nombre
  // pour choisir une variante de clic décalerait tout ce que le moteur tire
  // ensuite. On passe par `maintenantMs`, le seul lecteur d'horloge du dépôt,
  // et le `|| 1` écarte le zéro, qui est le point fixe du xorshift.
  const son = initialiserLeSon(doc, {
    reglages,
    graine: (maintenantMs() & 0x7fffffff) || 1,
  });

  /**
   * Ce que le son doit faire d'un GESTE de l'écran.
   *
   * ⚠⚠ L'ÉCRAN NOMME UN GESTE, LE CÂBLAGE NOMME LE SON, LA SESSION LE JOUE.
   * Trois responsabilités, trois endroits : `src/ui/chantier.js` ne connaît
   * aucun identifiant du pack, `src/son/cablage.js` décide sans faire de bruit,
   * et `jouer(` reste groupé ici — ce que la garde `SON T14` exige.
   *
   * ⚠ UN GESTE SANS SON NE LÈVE PAS. Retirer une pièce de garnison n'est pas un
   * effondrement de bâtiment, et le pack n'a rien à dire là-dessus : `cablage`
   * rend `null`, et on se tait plutôt que de détourner un son.
   */
  function sonDeGeste(geste, quoi) {
    const evenement = evenementDuGeste(geste, quoi);
    if (evenement !== null) son.jouer(evenement);
  }

  /**
   * Met les boucles d'accord avec l'état, dix fois par seconde.
   *
   * ⚠⚠ C'EST UNE RÉCONCILIATION, PAS UN ÉVÉNEMENT, ET C'EST TOUT LE LOT
   * SON-CÂBLAGE. Une ambiance ne « commence » sur aucun geste : elle est vraie
   * tant qu'un écran est affiché. Un mécanisme fondé sur des transitions
   * manquerait tout ce qui commence sans geste — un chargement de partie, une
   * unité qui se remet en marche — et surtout tout ce qui s'arrête sans geste,
   * ce qui laisserait une boucle sonner pour toujours.
   *
   * ⚠ ELLE PASSE PAR LA MÊME PORTE QUE LE RESTE DE L'AFFICHAGE — dix fois par
   * seconde, pas soixante. La différence est presque toujours vide, et
   * `reconcilier` ne fait rien quand elle l'est.
   *
   * ⚠ ET LES UNITÉS NE SE LISENT QUE SUR L'ÉCRAN DE RAID. Ailleurs il n'y a pas
   * de combat en cours ; demander leur roulement depuis la carte ferait rouler
   * une armée que personne ne regarde.
   */
  function reconcilierLeSon() {
    const surLeRaid = ecranCourant === 'raid' && ecranRaid !== null;
    son.reconcilier(bouclesDesirees({
      ecran: ecranCourant,
      disposition: etat === null ? [] : baseCourante(etat).disposition,
      unites: surLeRaid ? ecranRaid.enMouvement() : [],
    }));
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
      rafraichirLaBase();
      reconcilierLeSon();
      // ⚠ LA CARTE AUSSI, ET ELLE SEULE PARMI LES AUTRES ÉCRANS. Les satellites
      // paraissent cinq minutes après la pose d'une base : c'est la seule chose
      // de ces écrans-là qui change SANS que le joueur touche à rien, et elle
      // se verrait apparaître sous ses yeux. `rafraichir` ne fait rien quand la
      // carte n'est pas en scène.
      if (ecranMonde !== null) ecranMonde.rafraichir(etat);
    }
    if (instant - derniereSauvegardeMs >= PERIODE_SAUVEGARDE_MS) sauvegarder();
  }

  /**
   * Repeint ce qui bouge sans que le joueur change d'écran : l'écran de la base
   * et la mini-fenêtre du tutoriel qui y est posée.
   *
   * ⚠ UN SEUL POINT D'APPEL POUR LES DEUX. Ils se rafraîchissent aux trois
   * mêmes instants — chaque image, un retour de veille, un chargement — et
   * trois paires d'appels côte à côte finissent toujours par n'en être plus que
   * deux : le compteur du tutoriel serait resté figé après un retour de veille,
   * et rien à la relecture ne l'aurait dit.
   */
  function rafraichirLaBase() {
    ecran.rafraichir(etat);
    if (miniTutoriel !== null) miniTutoriel.rafraichir(etat);
  }

  /**
   * Tout repeindre — appelé par la BASCULE, et par elle seule.
   *
   * ⚠⚠ IL NE SE BRANCHE PAS SUR LA BOUCLE. `rafraichir` passe dix fois par
   * seconde ; y repeindre les cinq écrans reconstruirait des centaines de nœuds
   * pour rien, et l'écran Monde referait ses dalles. La bascule, elle, est un
   * geste rare qui change ce que TOUS les écrans montrent : c'est le seul
   * instant où l'image qu'ils gardent devient fausse d'un coup.
   *
   * ⚠ L'ÉCRAN DE RAID N'EST PAS DEDANS : il est ouvert sur une cible, pas sur
   * une base, et il porte sa propre armée montée. Le repeindre au milieu d'un
   * raid reviendrait à changer l'armée sous le joueur.
   */
  function rafraichirTousLesEcrans() {
    if (etat === null) return;
    ecran.peindre(etat);
    rafraichirLaBase();
    if (ecranOffense !== null) ecranOffense.peindre(etat);
    if (ecranMission !== null) ecranMission.peindre(etat);
    if (ecranRecherche !== null) ecranRecherche.peindre(etat);
    if (ecranMonde !== null) ecranMonde.rafraichir(etat);
    // ⚠ LE PANNEAU DE TRANSFERT SUIT LA BASCULE COMME LES AUTRES : il annonce
    // « depuis la base N », et la liste des destinations exclut la courante.
    if (panneauTransfert !== null) panneauTransfert.peindre(etat);
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
    // ⚠⚠ ET LES BOUCLES SE TAISENT. `arreterBoucle` arrête la boucle d'IMAGES,
    // donc plus rien ne réconcilie — une ambiance lancée continuerait de tourner
    // pendant que l'application est masquée, ou pendant que le banc d'essai
    // remplace la page. Ce n'est pas un événement de plus : c'est la même
    // réconciliation, sur un ensemble désiré vide. Le retour la refait, et tout
    // ce qui a une raison de sonner repart.
    son.reconcilier([]);
    sauvegarder();
    instantSuspensionMs = maintenantMs();
  }

  function reprendre() {
    if (etat === null) return;
    if (instantSuspensionMs !== null) {
      avancer(etat, maintenantMs() - instantSuspensionMs);
      instantSuspensionMs = null;
      rafraichirLaBase();
    }
    demarrerBoucle();
  }

  // --- démarrage -------------------------------------------------------------

  function installer(nouvel) {
    etat = nouvel;
    sauvegardeArmee = true;
    $('chantier-alerte').hidden = true;
    ecran.peindre(etat);
    rafraichirLaBase();
    // Les deux autres écrans se peignent aussi une première fois : ils sont
    // cachés, mais `montrerEcran` ne les repeindrait qu'à la première visite,
    // et un écran qui n'a jamais vu l'état n'a rien à montrer si on l'ouvre
    // avant qu'un geste ne l'ait rafraîchi.
    if (ecranOffense !== null) ecranOffense.peindre(etat);
    if (panneauTransfert !== null) panneauTransfert.peindre(etat);
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

  // ⚠ SIX ÉCRANS DEPUIS LE LOT RECHERCHE, et un en-tête COMMUN au-dessus d'eux.
  // Mission s'est ouvert le 28/08, le Monde au lot ÉCRAN-CARTE, et RECHERCHE à
  // celui-ci : plus aucun onglet n'est mort. Les onglets, les ressources, la
  // bascule entre bases et la barre du bas ont quitté `#ecran-chantier` :
  // changer d'écran ne les fait plus disparaître, ce qu'Ethan demandait
  // (« garder la barre quartz scories etc et monde option dans le menu
  // offense »).
  // ⚠ SEPT ÉCRANS DEPUIS LE LOT RAID-A. Le raid s'ouvre depuis la carte, par un
  // SECOND toucher sur une cible déjà ouverte.
  const ECRANS = ['chantier', 'mission', 'offense', 'recherche', 'monde', 'options', 'raid'];

  // ⚠⚠ LES DEUX BANDEAUX QUE L'ÉCRAN DE RAID MASQUE — et il est le seul.
  // Ethan, 01/09 : « on garde la barre du haut… les onglets seuls ». Le bandeau
  // des ressources part donc, et celui des bases avec lui : « BASE 1 / 1 » est
  // un compteur des bases DU JOUEUR, et il n'a aucun sens devant une base
  // ennemie. Ce second retrait est une LECTURE, pas une dictée d'Ethan ; s'il
  // le veut visible, c'est cette liste-ci qui change, et rien d'autre.
  const CHROME_MASQUE_PAR = { raid: ['ressources', 'navigation'] };

  // ⚠ QUEL ONGLET S'ALLUME POUR QUEL ÉCRAN — UNE TABLE, PAS DES CONDITIONS.
  // La version précédente écrivait « actif si ce n'est pas Options », ce qui
  // allumait « Base » sur l'écran Mission le jour où il est arrivé. Un quatrième
  // écran se déclare ici, et nulle part ailleurs.
  const ONGLET_DE_L_ECRAN = {
    chantier: 'onglet-base',
    // ⚠ LE RAID S'ALLUME SUR L'ONGLET MONDE : on y vient de la carte, on y
    // retourne. Il n'a pas d'onglet à lui — on n'y entre pas par le haut.
    raid: 'onglet-monde',
    offense: 'onglet-base',
    mission: 'onglet-mission',
    recherche: 'onglet-recherche',
    monde: 'onglet-monde',
    options: 'onglet-options',
  };

  function montrerEcran(nom) {
    ecranCourant = nom;
    for (const autre of ECRANS) $(`ecran-${autre}`).hidden = autre !== nom;
    // ⚠ LE CHROME COMMUN SE MASQUE ICI, ET NULLE PART AILLEURS. `#ressources` et
    // `#navigation` sont frères de `#ecrans` : un écran ne peut pas les cacher
    // lui-même sans les déplacer, et les déplacer casserait l'ordre du document
    // — donc la navigation au clavier et la lecture d'écran.
    const masques = new Set(CHROME_MASQUE_PAR[nom] ?? []);
    for (const bloc of ['ressources', 'navigation']) $(bloc).hidden = masques.has(bloc);
    // Les onglets du haut ET la barre du bas doivent dire où l'on est. Le
    // premier est à la session ; le second appartient à l'écran Chantier, qui
    // le construit — d'où l'appel, plutôt qu'une seconde écriture ici.
    const allume = ONGLET_DE_L_ECRAN[nom];
    for (const onglet of new Set(Object.values(ONGLET_DE_L_ECRAN))) {
      $(onglet).classList.toggle('actif', onglet === allume);
    }
    if (ecran !== null) ecran.marquerEcran(nom);
    // Le tutoriel se relit à l'ouverture : il a pu avancer pendant qu'on
    // regardait ailleurs, et il ne se repeint pas tant qu'il est caché.
    if (nom === 'mission' && ecranMission !== null && etat !== null) ecranMission.peindre(etat);
    // ⚠ ET L'OFFENSE AUSSI, POUR LA MÊME RAISON. Elle a pu changer pendant
    // qu'on regardait ailleurs — une amélioration du Centre de commandement
    // ouvre du budget et allonge la palette — et elle ne se repeint pas tant
    // qu'elle est cachée.
    if (nom === 'offense' && ecranOffense !== null && etat !== null) ecranOffense.peindre(etat);
    // ⚠ ET LA RECHERCHE AUSSI, ET POUR ELLE C'EST LE CŒUR DU SUJET. Les points
    // MONTENT pendant qu'on regarde ailleurs — chaque raid en rapporte — et un
    // arbre peint à la construction afficherait pour toujours le compteur du
    // démarrage, donc des boutons refusés dont le joueur a les moyens.
    if (nom === 'recherche' && ecranRecherche !== null && etat !== null) {
      ecranRecherche.peindre(etat);
    }
    // ⚠ ET LA LIGNE DE MISE À JOUR SE RELIT À L'OUVERTURE DES OPTIONS. La
    // vérification automatique part au LANCEMENT, bien avant que le joueur ouvre
    // cet écran : sans ce rappel, il y trouverait un tiret alors que le verdict
    // est tombé depuis longtemps, et il croirait la ligne morte.
    if (nom === 'options') suivreLaMaj();
    // ⚠ ET LA CARTE SE MET EN SCÈNE ET SE RETIRE, LES DEUX. Elle est le seul
    // écran qui porte une boucle à lui : les dalles du fond se calculent deux
    // par image tant qu'il en manque. La laisser tourner derrière un autre
    // écran ferait travailler l'appareil pour des pixels que personne ne
    // regarde — et un canevas caché mesure zéro, donc elle ne saurait même pas
    // quoi calculer.
    if (ecranMonde !== null) {
      if (nom === 'monde' && etat !== null) ecranMonde.peindre(etat);
      else ecranMonde.masquer();
    }
    // ⚠ ET LE RAID SE RETIRE QUAND ON LE QUITTE, pour la raison exacte de la
    // carte : il porte une boucle d'animation à lui, et la laisser tourner
    // derrière un autre écran ferait travailler l'appareil pour des pixels que
    // personne ne regarde.
    if (ecranRaid !== null && nom !== 'raid') ecranRaid.masquer();
  }

  $('onglet-base').addEventListener('click', () => montrerEcran('chantier'));
  $('onglet-options').addEventListener('click', () => montrerEcran('options'));
  $('onglet-mission').addEventListener('click', () => montrerEcran('mission'));
  $('onglet-recherche').addEventListener('click', () => montrerEcran('recherche'));
  $('onglet-monde').addEventListener('click', () => montrerEcran('monde'));

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
    // ⚠ ET LA CARTE SE RETIRE AUSSI. Le banc cache `#jeu` sans passer par
    // `montrerEcran` : sans cette ligne, la boucle de complétion des dalles
    // continuerait de calculer derrière lui, pour un canevas que plus personne
    // ne regarde. `fermerLeBanc` la remet en scène par `montrerEcran`.
    if (ecranMonde !== null) ecranMonde.masquer();
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

  // --- la vérification de mise à jour ---------------------------------------
  //
  // ⚠⚠ LA PAGE NE TÉLÉCHARGE RIEN, ET ELLE NE LE PEUT PAS. `tools/build.js`
  // refuse tout `https?://` dans le HTML produit, et CLAUDE.md §6 interdit
  // d'assembler l'adresse à l'exécution pour passer sous la garde. L'adresse du
  // manifeste, l'allowlist et l'empreinte vivent donc dans l'enveloppe Android,
  // qui les porte déjà ; ici on ne fait que DEMANDER et LIRE.
  //
  // ⚠ ET HORS DE L'ENVELOPPE, LE PONT N'EXISTE PAS. Dans un navigateur, la ligne
  // le dit en toutes lettres plutôt que de laisser un bouton sans effet — « un
  // indice n'est pas une interdiction », et un bouton muet n'apprend rien.
  const majEtat = $('options-maj-etat');
  const majBouton = $('options-maj-verifier');
  let majMinuterie = null;

  // ⚠⚠ LE BUILD DE CETTE PAGE, LU DANS LE BALISAGE ET PAS DANS SON TEXTE.
  // `tools/build.js` remplace `%BUILD%` aux deux endroits ; l'attribut existe
  // pour que le JS ait un NOMBRE plutôt qu'à découper « v0.69.0 b70 ». Sans lui,
  // la page ne saurait pas ce qu'elle est, et ne pourrait pas dire au joueur
  // qu'une version plus récente l'attend.
  const monBuild = Number.parseInt($('options-version').dataset.build, 10);

  function pontDeMaj() {
    const pont = fenetre.FoyerZeroMaj;
    if (pont === undefined || pont === null) return null;
    return typeof pont.verifier === 'function' && typeof pont.etat === 'function' ? pont : null;
  }

  function afficherEtatDeMaj() {
    const pont = pontDeMaj();
    if (pont === null) {
      majEtat.textContent = MAJ_SANS_PONT;
      majBouton.disabled = false;
      return false;
    }
    const lu = lireEtatDeMaj(pont.etat());
    majEtat.textContent = ligneDeMiseAJour(lu, Number.isFinite(monBuild) ? monBuild : null);
    // ⚠ LE BOUTON SE RETIRE DU GESTE PENDANT LA VÉRIFICATION, IL NE DISPARAÎT
    // PAS : la ligne bougerait sous le doigt. Et il revient dans tous les cas —
    // succès comme échec —, sinon un réseau absent le figerait pour de bon.
    majBouton.disabled = lu.etape === 'EN_COURS';
    return lu.etape === 'EN_COURS';
  }

  function suivreLaMaj() {
    if (majMinuterie !== null) {
      fenetre.clearTimeout(majMinuterie);
      majMinuterie = null;
    }
    if (!afficherEtatDeMaj()) return;
    // ⚠ ON INTERROGE, ON N'ATTEND PAS D'ÊTRE RAPPELÉ. Le pont ne rend que des
    // valeurs : lui faire rappeler la page demanderait de lui passer une
    // fonction, donc d'ouvrir le sens qu'on a précisément refusé (voir
    // `MainActivity`). Une seconde entre deux lectures suffit largement.
    majMinuterie = fenetre.setTimeout(suivreLaMaj, MAJ_PERIODE_MS);
  }

  majBouton.addEventListener('click', () => {
    const pont = pontDeMaj();
    if (pont === null) { afficherEtatDeMaj(); return; }
    pont.verifier();
    suivreLaMaj();
  });

  // --- la remise à zéro ------------------------------------------------------
  //
  // ⚠⚠ LE BOUTON LE PLUS DESTRUCTEUR DU JEU, DANS L'ÉCRAN QU'ON OUVRE POUR LIRE
  // UN NUMÉRO DE VERSION. La confirmation est en DEUX TEMPS et elle DIT CE QUI
  // SERA PERDU — pas « êtes-vous sûr ? », qui n'apprend rien à celui qui a
  // touché par erreur. Ce que le joueur perd n'est pas abstrait : sa base, sa
  // carte, ses recherches payées en points, tout.
  //
  // ⚠ ET IL REPART PAR LE CHEMIN NORMAL. `partieNeuve` est exactement ce
  // qu'appelle déjà le bouton de l'écran d'alerte : nouvelle graine, nouvelle
  // fondation, tout l'état recréé par `creerEtat`. Bricoler un état à la main
  // ici en ferait un second constructeur, qui divergerait au premier champ
  // ajouté — c'est la faute que `dispositionNouvelleBase` évite déjà.
  const zeroBouton = $('options-zero');
  const zeroConfirmer = $('options-zero-confirmer');
  const zeroAnnuler = $('options-zero-annuler');
  const zeroAvertissement = $('options-zero-avertissement');

  /** Le libellé de la confirmation — il NOMME ce qui disparaît. */
  const AVERTISSEMENT_ZERO = 'Toute la partie sera effacée : ta base et sa '
    + 'disposition, ta garnison, ton armée, tes recherches, ta position sur la '
    + 'carte et les dix derniers rapports de raid. La carte sera tirée à neuf. '
    + 'C\'est définitif, et rien n\'est mis de côté.';

  function armerLaRemiseAZero(arme) {
    zeroAvertissement.hidden = !arme;
    zeroAvertissement.textContent = arme ? AVERTISSEMENT_ZERO : '';
    zeroConfirmer.hidden = !arme;
    zeroAnnuler.hidden = !arme;
    zeroBouton.hidden = arme;
  }

  zeroBouton.addEventListener('click', () => armerLaRemiseAZero(true));
  zeroAnnuler.addEventListener('click', () => armerLaRemiseAZero(false));
  zeroConfirmer.addEventListener('click', () => {
    armerLaRemiseAZero(false);
    partieNeuve();
    montrerEcran('chantier');
  });
  // ⚠ DÉSARMÉE AU CÂBLAGE, comme le panneau de l'écran Monde : le `hidden` du
  // balisage serait la SEULE chose à tenir la confirmation fermée au démarrage.
  armerLaRemiseAZero(false);

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

  // --- le son : quatre points d'accroche, et c'est tout ---------------------
  //
  // ⚠⚠ QUATRE, ET AUCUN N'EST NEUF. Le clic délégué, les DEUX registres `toast`
  // — celui du Chantier depuis le lot SON-MOTEUR, celui de l'Offense depuis
  // celui-ci — et la bascule d'OPTIONS. Vingt-trois sons de la famille `ui`
  // entrent au livrable ; CINQ sont atteignables, et les dix-huit autres n'ont
  // pas de point d'accroche EXISTANT dans le code. On n'en crée aucun : « ne
  // créer aucun événement de jeu pour donner un emploi à un son » — le rapport
  // les nomme un par un avec leur raison.
  //
  // ⚠⚠ UN SEUL ÉCOUTEUR POUR TOUS LES BOUTONS DE LA PAGE. Poser un écouteur par
  // bouton dans six écrans serait la dette que ce lot existe pour éviter : il
  // faudrait y penser à chaque bouton ajouté, et le premier oublié serait muet
  // sans que rien ne le dise. La délégation prend le clic à la racine et
  // remonte au bouton le plus proche — un bouton qui n'existe pas encore sonne
  // déjà.
  //
  // ⚠ ET C'EST AUSSI CE QUI RÉVEILLE LE CONTEXTE. Un `AudioContext` créé avant
  // un geste naît suspendu ; celui-ci naît DANS le geste. `jouer` réveille
  // lui-même, donc il n'y a pas deux chemins à tenir d'accord.
  doc.addEventListener('click', (evenement) => {
    const cible = evenement.target;
    if (cible !== null && typeof cible.closest === 'function' && cible.closest('button') !== null) {
      son.jouer('ui_click');
    }
  });

  // ⚠⚠ L'INTERRUPTEUR SONNE EN S'ALLUMANT, ET PAS EN S'ÉTEIGNANT. « Le couper
  // ne joue rien, évidemment » — un son qui accompagnerait la coupure serait la
  // dernière chose qu'on entend après avoir demandé le silence. L'ordre compte :
  // on écrit le réglage AVANT de demander le son, sinon la politique refuserait
  // encore sur l'ancien état.
  const sonMuet = $('options-son-muet');
  const sonVolume = $('options-son-volume');
  const sonVolumeValeur = $('options-son-volume-valeur');

  function rendreLesReglages() {
    sonMuet.textContent = reglages.muet ? 'Coupé' : 'Activé';
    sonMuet.setAttribute('aria-pressed', String(reglages.muet));
    sonMuet.classList.toggle('coupe', reglages.muet);
    sonVolume.value = String(Math.round(reglages.volume * 100));
    sonVolumeValeur.textContent = `${Math.round(reglages.volume * 100)} %`;
  }

  sonMuet.addEventListener('click', () => {
    reglages.muet = !reglages.muet;
    rendreLesReglages();
    enregistrerLesReglages();
    if (!reglages.muet) son.jouer('ui_toggle_on');
  });
  // `input` et non `change` : le volume suit le doigt, sinon le joueur règle à
  // l'aveugle et ne s'entend qu'après avoir lâché.
  sonVolume.addEventListener('input', () => {
    reglages.volume = Number(sonVolume.value) / 100;
    rendreLesReglages();
    enregistrerLesReglages();
  });
  rendreLesReglages();

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

  // ⚠ AVANT TOUT ÉCRAN : les quatre atlas partagés doivent avoir leur `src`
  // avant qu'un canevas ne les demande.
  garnirLesAtlas(doc);

  ecran = initialiserEcranChantier(doc, {
    // La pose est la première action irréversible du jeu : elle s'écrit tout de
    // suite, sans attendre l'enregistrement périodique.
    apresPose: () => sauvegarder(),
    // ⚠⚠ LE SON DE REFUS PASSE PAR LE REGISTRE `toast`, QUI EST LE POINT
    // UNIQUE OÙ UN REFUS ATTEINT LE JOUEUR sur cet écran — sept appelants y
    // convergent déjà. Le brancher aux sept aurait fait sept points d'accroche
    // à tenir d'accord, c'est-à-dire la dette que le clic délégué évite.
    // ⚠ `ui/offense.js` PORTE SON PROPRE `toast`, ET IL N'EST PAS BRANCHÉ ICI —
    // écart déclaré : le brief pose TROIS points de câblage, pas quatre, et le
    // lot du catalogue unifiera les deux registres.
    sonDeRefus: () => son.jouer('ui_error'),
    // ⚠⚠ ET LES CINQ GESTES DE L'ÉCRAN DE LA BASE PASSENT PAR UN SEUL CROCHET.
    // L'écran nomme un geste — sélection, pose, amélioration, déplacement,
    // retrait — et `src/son/cablage.js` décide s'il fait du bruit et lequel.
    // Cinq crochets nommés par leur son auraient mis cinq identifiants du pack
    // dans un écran, c'est-à-dire la dette que le clic délégué évite déjà.
    sonDeGeste,
    // ⚠ L'ÉCRAN DEMANDE, LA SESSION DÉCIDE. La barre du bas appartient à
    // l'écran Chantier — c'est lui qui la construit et qui y affiche les
    // niveaux — mais un de ses trois boutons change d'ÉCRAN, ce que seule la
    // session sait faire. Même découpage que `apresPose`.
    versEcran: (nom) => montrerEcran(nom),
    // ⚠⚠ BASCULER EST UNE DÉCISION DU JOUEUR, DONC ELLE S'ÉCRIT TOUT DE SUITE.
    // `baseCourante` gouverne ce que tous les écrans montrent ET quelle base
    // part au raid (§4.6 : haloter et basculer sont le même geste) : la perdre
    // parce que le système a tué l'application ferait attaquer depuis la
    // mauvaise base au retour. Même raisonnement que `apresPose`.
    //
    // ⚠ ET LES AUTRES ÉCRANS SE REPEIGNENT. Chacun relit l'état à sa peinture,
    // mais ceux qui sont déjà construits gardent l'image de l'ancienne base
    // tant qu'on ne les redemande pas — la carte en particulier, qui ne
    // redessine que si les satellites ont bougé.
    apresBascule: () => {
      sauvegarder();
      rafraichirTousLesEcrans();
    },
  });
  // ⚠ L'ÉCRAN OFFENSE SE REPEINT MAINTENANT, ET IL ÉCRIT. Il se construisait
  // une fois et ne se rafraîchissait jamais, « tant qu'aucune armée n'existe ».
  // L'état en porte une depuis le lot GARNISON-ET-ARMÉE : il compose, et chaque
  // geste s'enregistre tout de suite — composer son armée est une action que le
  // joueur ne veut pas refaire parce que le système a tué l'application.
  // ⚠⚠ UN TRANSFERT SE SAUVEGARDE TOUT DE SUITE, comme une pose. Il est
  // IRRÉVERSIBLE — la taxe est prise et ne se rend pas —, donc le perdre parce
  // que le système a tué l'application serait la pire façon de perdre la
  // confiance du joueur. Et l'écran de la base se rafraîchit avec : le bandeau
  // des ressources porte le stock de la base courante, qui vient de changer.
  panneauTransfert = initialiserPanneauDeTransfert(doc, {
    apresTransfert: () => {
      sauvegarder();
      rafraichirLaBase();
    },
  });
  // ⚠⚠ ET L'OFFENSE REÇOIT LE MÊME `sonDeRefus` QUE LE CHANTIER — écart déclaré
  // par le lot SON-MOTEUR, refermé ici. Les deux écrans portent chacun leur
  // registre `toast` ; n'en brancher qu'un rendait le refus sonore sur la base
  // et muet sur l'armée, pour la même faute du joueur.
  ecranOffense = initialiserEcranOffense(doc, {
    apresPose: () => sauvegarder(),
    sonDeRefus: () => son.jouer('ui_error'),
  });
  // ⚠ LES DEUX VUES DU TUTORIEL SE CÂBLENT ENSEMBLE, et chacune agit sur
  // l'autre : la croix ferme la mini-fenêtre, le bouton de l'onglet Mission la
  // rouvre. Écrire dans l'état est le travail de `sim/state.js` ; l'enregistrer
  // tout de suite est celui de la session — un choix du joueur perdu parce que
  // le système a tué l'application est exactement ce que `apresPose` évite déjà.
  miniTutoriel = initialiserMiniTutoriel(doc, {
    surFermeture: () => {
      reglerTutoriel(etat, true);
      sauvegarder();
      rafraichirLaBase();
    },
  });
  ecranMission = initialiserEcranMission(doc, {
    // ⚠ ON ROUVRE ET ON Y VA. Rouvrir en restant sur l'onglet Mission ne
    // montrerait rien au joueur : la fenêtre qu'il vient de redemander est en
    // bas d'un AUTRE écran, et il croirait le bouton mort.
    surReouverture: () => {
      reglerTutoriel(etat, false);
      sauvegarder();
      rafraichirLaBase();
      montrerEcran('chantier');
    },
  });
  // ⚠ L'ACHAT S'ENREGISTRE TOUT DE SUITE. Dépenser deux milliards de points est
  // exactement le genre de geste qu'un joueur ne veut pas refaire parce que le
  // système a tué l'application — même raisonnement que `apresPose`.
  ecranRecherche = initialiserEcranRecherche(doc, { apresAchat: () => sauvegarder() });
  // ⚠ L'ÉCRAN DEMANDE, LA SESSION DÉCIDE — même découpage que `apresPose` et
  // `versEcran` ailleurs. Le raid ÉCRIT dans l'état (réparation, activité,
  // déplacement, et le raid lui-même) : chaque geste s'enregistre tout de suite,
  // parce qu'un raid perdu parce que le système a tué l'application est
  // exactement ce que `apresPose` évite déjà pour la pose.
  ecranRaid = initialiserEcranRaid(doc, {
    versEcran: (nom) => montrerEcran(nom),
    apresGeste: () => sauvegarder(),
    // ⚠ SEULE LA VRAIE ATTAQUE SONNE — l'écran le décide, pas la session : lui
    // seul sait si le déroulé est une simulation.
    sonDeGeste,
  });
  // ⚠ LE SECOND TOUCHER ENTRE DANS LA CIBLE, et c'est la carte qui le détecte :
  // elle seule sait quelle case son panneau décrit. `problemesDuRaid` garde
  // l'entrée — si la liste n'est pas vide, on n'entre pas, et le panneau dit
  // pourquoi.
  ecranMonde = initialiserEcranMonde(doc, {
    surEntreeRaid: (cible) => {
      if (etat === null || ecranRaid === null) return;
      ecranRaid.ouvrir(etat, cible, atlasDeLaScene(doc));
      montrerEcran('raid');
    },
    // ⚠⚠ UN DÉPLACEMENT SE SAUVEGARDE TOUT DE SUITE, comme une pose. C'est une
    // action irréversible du joueur ; la perdre parce que l'application a été
    // tuée avant l'enregistrement périodique serait la pire façon de perdre sa
    // confiance — c'est mot pour mot ce que `CLAUDE.md` §6 dit de la pose.
    //
    // ⚠ ET L'ÉCRAN DE LA BASE SE RAFRAÎCHIT AVEC. Le bandeau porte des nombres
    // qui dépendent de la position — rien aujourd'hui, mais le niveau des sites
    // alentour en dépendra —, et surtout le tutoriel lit la base à chaque image.
    apresDeplacement: () => {
      // ⚠ DÉPLACER SA BASE EST UN ORDRE, ET C'EST LE MÊME SON QUE DÉPLACER UNE
      // PIÈCE : le pack n'en a qu'un, `order_player_move`, et lui en inventer
      // un second reviendrait à détourner un autre son de sa famille.
      sonDeGeste('deplacement', {});
      sauvegarder();
      rafraichirLaBase();
    },
    // ⚠ TOUCHER UNE AUTRE DE SES BASES SUR LA CARTE LA REND COURANTE : c'est le
    // même geste que les flèches de bascule, donc le même traitement.
    apresBascule: () => {
      sauvegarder();
      rafraichirTousLesEcrans();
    },
  });
  montrerEcran('chantier');
  demarrer();
}
