// L'écran de raid — la cible en haut, l'armée en bas, et le combat qui se joue.
//
// ⚠⚠ SEPTIÈME ÉCRAN, ET IL S'ALLUME SUR L'ONGLET MONDE. On y vient de la carte,
// par un SECOND toucher sur une cible déjà ouverte, et on y retourne. Il se
// déclare dans `ECRANS` et dans `ONGLET_DE_L_ECRAN` de `ui/session.js`, et
// nulle part ailleurs — c'est ce que dit le commentaire de cette table.
//
// ⚠⚠ L'ÉCRAN A DEUX ÉTATS DE CHROME, ET C'EST LE LOT ASSAUT QUI LES SÉPARE.
// EN PRÉPARATION, le bandeau des ressources et celui des bases sont masqués et
// la rangée d'onglets RESTE — Ethan, 01/09 : « finalement on garde la barre du
// haut… les onglets seuls ». PENDANT LE DÉROULÉ, les onglets partent aussi, et
// `#raid-bas` avec eux — Ethan, 04/09 : « quand on lance un raid, toutes les
// barres disparaissent. On voit juste la simulation en cours. » La seconde
// phrase REVIENT sur la première, et elle ne la remplace pas : la préparation a
// besoin de ses onglets, c'est là qu'on répare, qu'on active, qu'on repart en
// Offense chercher une pièce.
//
// ⚠ LE CHROME COMMUN RESTE ÉCRIT PAR LA SESSION, ET PAR ELLE SEULE. Le déroulé
// n'est pas un écran : cet écran-ci le DEMANDE par le crochet `pendantLeDeroule`
// au lieu de toucher `#tete-onglets`, qui ne lui appartient pas. `#raid-bas`,
// lui, est à lui — il le masque directement.
//
// ⚠⚠ ET LE RETOUR EST GARANTI SUR TOUS LES CHEMINS DE FIN, ce qui est le défaut
// le plus probable du lot : un chrome masqué qui ne revient pas enferme le
// joueur dans un écran sans onglets. `quitterLeDeroule` est appelée par la fin
// normale, par `fermerPanneaux` et par `masquer` — trois portes, une fonction,
// idempotente.
//
// ⚠⚠ L'ÉTAGE PUR PORTE TOUT CE QUI SE MESURE, et il porte surtout
// `lignesDuResultat` : les DEUX panneaux de fin — le petit du simulateur et le
// plein cadre du vrai raid — s'en servent, donc ils affichent les mêmes nombres
// PAR CONSTRUCTION. Calculer un pourcentage dans l'un des deux les ferait
// diverger, et personne ne le verrait : les deux panneaux ne sont jamais à
// l'écran en même temps.
//
// ⚠ AUCUN POURCENTAGE N'EST CALCULÉ ICI. Ils viennent tous du rapport
// d'`executerRaid`, donc du simulateur aussi — c'est la raison d'être de RAID-0.
// Cet écran FORMATE, il ne mesure pas.

import { EMPLACEMENTS_ASSAUT, BATIMENTS, ECRAN_RAID } from '../data/sites.js';
import { UNITES } from '../data/combat.js';
import { TICK_MS } from '../sim/clock.js';
import {
  deplacerEffectif, problemesDuDeplacementDEffectif, reglerActivite,
} from '../sim/state.js';
import {
  reparerUnePiece, toutReparer, problemesDeLaReparationDUnePiece,
} from '../sim/reparation.js';
import {
  problemesDuRaid, executerRaid, simulerRaid, composerLesVagues, montageDuRaid,
  pvMaxDeLUnite,
} from '../sim/raid.js';
import { siteDeLaCase } from '../sim/site-de-la-case.js';
import { coutDUnRaid } from '../sim/points-attaque.js';
import { creerCombat, tick as tickCombat } from '../sim/combat.js';
import {
  creerAccumulateur, ticksDus, alphaMilli, prendrePositions, VITESSES,
} from '../render/interpolation.js';
import { calculerProjection } from '../render/projection.js';
// ⚠⚠ LES BANDES VIENNENT DE `render/`, PAS DE L'ÉCRAN DE LA BASE — lot
// ÉCRAN-RAID, 04/09. Elles y ont déménagé au même lot : les recopier ici aurait
// été la deuxième vérité que §4 interdit, et importer `ui/chantier.js` pour une
// géométrie ferait dépendre le raid de la mise en page de la base.
import {
  BANDES_NAVIGABLES, basculeDeBande, casesDeLaBande,
  bornesDuDecalage, bornesDuDecalageX,
} from '../render/bandes.js';
import { COTE_SPRITE } from '../data/atlas.js';
import { listeAffichage } from '../render/scene.js';
import { MUR_CASES, fondDeLaBase } from '../render/fond.js';
import { executer } from '../render/canvas2d.js';
import { baseCourante } from '../sim/base-courante.js';
import { etatDesUnites, evenementsDuJournal } from '../son/cablage.js';
// ⚠⚠ LE PLAFOND DU ZOOM ET LA POSE D'UN SPRITE SE PRENNENT LÀ OÙ ILS SONT DÉJÀ.
// `COTE_CASE_MAX` est le plafond de la base — « le raid prend le même » —, et
// `poserCouches` porte l'inversion d'ordre entre le canevas et une liste
// `background-image`, qui n'a aucune raison d'être écrite deux fois.
// `couchesDeLUniteDAssaut` porte les QUATRE champs d'une unité d'assaut ; les
// recopier ici serait se donner une seconde occasion d'écrire `garnison` là où
// il faut `attaque`, ce que son propre commentaire annonce.
import { COTE_CASE_MAX, poserCouches } from './chantier.js';
import { couchesDeLUniteDAssaut } from './offense.js';

// ---------------------------------------------------------------------------
// Étage pur
// ---------------------------------------------------------------------------

/** Les quatre vagues et les neuf colonnes — des DONNÉES, jamais des littéraux. */
export const NB_VAGUES = EMPLACEMENTS_ASSAUT.vagues;
export const NB_COLONNES = EMPLACEMENTS_ASSAUT.parVague;

/** Le mot affiché pour chacun des trois verdicts. */
export const LIBELLE_VERDICT = {
  'victoire-totale': 'Victoire totale',
  victoire: 'Victoire',
  // ⚠ « DÉFAITE TOTALE », ET « DÉFAITE » TOUT COURT N'EXISTE PAS ICI : il est
  // réservé à la défense, que ce lot n'ouvre pas. Trois verdicts, trois.
  'defaite-totale': 'Défaite totale',
};

/** Le libellé d'un châssis, pour la ligne de réparation induite. */
const LIBELLE_CHASSIS = {
  escouade: 'Infanterie',
  blinde: 'Véhicules',
  aeronef: 'Aviation',
};

/**
 * Une durée en secondes, dite comme une phrase et non comme un nombre brut.
 *
 * @param {number} secondes
 * @returns {string}
 */
export function formaterDuree(secondes) {
  const s = Math.max(0, Math.round(secondes));
  if (s < 60) return `${s} s`;
  const minutes = Math.floor(s / 60);
  if (minutes < 60) return s % 60 === 0 ? `${minutes} min` : `${minutes} min ${s % 60} s`;
  const heures = Math.floor(minutes / 60);
  return minutes % 60 === 0 ? `${heures} h` : `${heures} h ${minutes % 60} min`;
}

/** Un pourcentage, ou un tiret quand la grandeur n'existe pas. */
function pct(valeur) {
  return valeur === null || valeur === undefined ? '—' : `${valeur} %`;
}

/**
 * Les lignes du panneau de résultat — LES MÊMES pour les deux panneaux.
 *
 * ⚠⚠ C'EST ICI QUE SE JOUE « LE SIMULATEUR ET LE VRAI RAID DISENT LA MÊME
 * CHOSE ». Les deux panneaux appellent cette fonction sur un rapport de même
 * forme, et aucun des deux ne calcule quoi que ce soit : l'égalité est
 * structurelle, pas surveillée. Le jour où l'un des deux voudrait « juste un
 * chiffre de plus », il passera par ici.
 *
 * ⚠ LES NOMS DE BÂTIMENTS VIENNENT DE LA TABLE, ET CE SONT CEUX DE L'OUVRAGE —
 * `BATIMENTS.souche.nom` vaut « Souche », `.ta` vaut « Chantier de
 * construction ». On regarde une base de l'Ouvrage : c'est son vocabulaire qui
 * s'affiche. Les CLÉS du rapport, elles, ne changent jamais de nom.
 *
 * @param {object} rapport rendu par `executerRaid` ou `simulerRaid`
 * @returns {Array<{quoi: string, valeur: string}>}
 */
export function lignesDuResultat(rapport) {
  const lignes = [
    { quoi: 'Verdict', valeur: LIBELLE_VERDICT[rapport.verdict] ?? rapport.verdict },
    {
      quoi: 'Butin',
      valeur: `${rapport.butin.quartz ?? 0} quartz · ${rapport.butin.scorie ?? 0} scorie`,
    },
    { quoi: 'Défense restante', valeur: pct(rapport.restantDefense) },
    { quoi: 'Bâtiments restants', valeur: pct(rapport.restantBatiments) },
    { quoi: BATIMENTS.souche.nom, valeur: pct(rapport.restantSouche) },
    { quoi: BATIMENTS.etai.nom, valeur: pct(rapport.restantEtai) },
  ];

  // ⚠ LA RÉPARATION INDUITE, CHÂSSIS PAR CHÂSSIS, EN TEMPS **ET** EN POURCENT.
  // ⚠⚠ ET « SANS BÂTIMENT » SE DIT, parce que zéro veut dire deux choses : un
  // châssis intact et un châssis qu'on ne PEUT PAS réparer rendent tous deux
  // `0 s`. Annoncer « aucune réparation » à un joueur dont l'infanterie est en
  // miettes et sans Caserne serait un mensonge par omission.
  for (const [chassis, r] of Object.entries(rapport.reparationInduite ?? {})) {
    if (r.sansBatiment) {
      lignes.push({ quoi: LIBELLE_CHASSIS[chassis] ?? chassis, valeur: 'sans bâtiment' });
    } else if (r.ticks === 0) {
      lignes.push({ quoi: LIBELLE_CHASSIS[chassis] ?? chassis, valeur: 'intacte' });
    } else {
      lignes.push({
        quoi: LIBELLE_CHASSIS[chassis] ?? chassis,
        valeur: `${formaterDuree(r.secondes)} · ${pct(r.pctReserve)} de la réserve`,
      });
    }
  }

  // ⚠ LE TEMPS DE RAID EST `ticks × TICK_MS`, et `TICK_MS` vient de l'horloge,
  // jamais recopié : écrire 0,1 ici ferait un second pas de temps.
  lignes.push({ quoi: 'Durée du combat', valeur: formaterDuree((rapport.ticks * TICK_MS) / 1000) });
  return lignes;
}

/**
 * Ce que l'écran affiche de l'armée : les quatre vagues, occupées ou vides.
 *
 * ⚠ FONCTION PURE, DONC FONCTION TESTÉE — le dépôt n'a ni jsdom ni navigateur,
 * et ce qui peut se vérifier sans écran doit l'être.
 *
 * @param {object} etat
 * @returns {Array<{numero: number, cases: Array<null|object>}>}
 */
export function vaguesDeLArmee(etat) {
  const laBase = baseCourante(etat);
  const vagues = [];
  for (let numero = 1; numero <= NB_VAGUES; numero += 1) {
    const cases = new Array(NB_COLONNES).fill(null);
    vagues.push({ numero, cases });
  }
  laBase.armee.forEach((piece, index) => {
    const v = vagues[piece.vague - 1];
    if (v === undefined || piece.colonne < 1 || piece.colonne > NB_COLONNES) return;
    const pvMax = pvMaxDeLUnite(piece.id, piece.niveau);
    v.cases[piece.colonne - 1] = {
      index,
      id: piece.id,
      nom: UNITES[piece.id].nom.joueur,
      niveau: piece.niveau,
      actif: piece.actif !== false,
      degatsMilli: piece.degatsMilli ?? 0,
      // Ce qui reste de la pièce, en pour-cent — la barre de vie de la vignette.
      pvPct: Math.max(0, Math.round(((pvMax - (piece.degatsMilli ?? 0)) * 100) / pvMax)),
    };
  });
  return vagues;
}

/**
 * Tout ce que l'écran de raid affiche, calculé depuis l'état et la cible.
 *
 * ⚠⚠ ET LE COÛT EN FAIT PARTIE DEPUIS LE LOT ASSAUT, PARCE QUE LE BOUTON LE
 * PORTE. « Lancer l'attaque » ne disait pas le prix ; le joueur venait de la
 * carte, où il l'avait lu, et devait s'en souvenir. Le bouton dit maintenant ce
 * qu'il va dépenser.
 *
 * ⚠ ET C'EST LE SEUL ENDROIT DE CET ÉCRAN QUI APPELLE `coutDUnRaid`. L'étage DOM
 * LIT cette valeur ; la rappeler pour le libellé donnerait deux nombres qui
 * peuvent diverger, et le joueur verrait un prix sur le bouton et un autre dans
 * le panneau de la carte. C'est mot pour mot le motif de `ciblageOuvert` dans
 * `ui/monde.js`, où la flèche RELIT le ciblage au lieu de le recalculer.
 *
 * ⚠⚠ LE COÛT VAUT `null` HORS DE PORTÉE, JAMAIS ZÉRO, et l'ordre des deux
 * lignes n'est pas un détail de style : `coutDUnRaid` LÈVE au-delà du rayon
 * d'attaque. Les problèmes se demandent donc AVANT le coût — c'est le défaut
 * qu'`ciblageDuSite` a payé au lot DÉPLACEMENT, où un panneau ne s'ouvrait plus
 * sur aucun site lointain de toute la carte.
 *
 * @param {object} etat
 * @param {{rangee: number, colonne: number}} cible
 * @returns {object}
 */
export function vueDuRaid(etat, cible) {
  const site = siteDeLaCase(etat, cible.rangee, cible.colonne);
  const problemes = site === null ? [{ code: 'sans-cible', message: 'Plus rien à attaquer ici.' }]
    : problemesDuRaid(etat, baseCourante(etat), cible);
  const horsPortee = site === null || problemes.some((p) => p.code === 'hors-portee');
  return {
    site,
    problemes,
    peutAttaquer: problemes.length === 0,
    cout: horsPortee ? null : coutDUnRaid(etat, baseCourante(etat), cible),
    vagues: vaguesDeLArmee(etat),
    engagees: composerLesVagues(etat).indices.length,
  };
}

/**
 * Ce que le gros bouton d'attaque écrit, en deux lignes.
 *
 * ⚠ LE MOT NE CHANGE PAS, LE PRIX SI. « ATTAQUER » est le geste ; la seconde
 * ligne dit ce qu'il coûte, et elle se tait quand il n'y a pas de prix — hors
 * de portée, ou plus rien à attaquer. « 0 point » se lirait « gratuit », qui est
 * la convention que tout le dépôt refuse depuis `niveauDeCommandement`.
 *
 * @param {number|null} cout
 * @returns {{mot: string, prix: string}}
 */
export function libelleDAttaque(cout) {
  if (cout === null || cout === undefined) return { mot: 'ATTAQUER', prix: '' };
  return { mot: 'ATTAQUER', prix: cout === 1 ? '1 point' : `${cout} points` };
}

/**
 * Le côté de case le plus grand qu'on autorise sur le CANEVAS, en pixels de
 * mémoire d'image.
 *
 * ⚠⚠ LE PLAFOND DE LA BASE EST EN PIXELS CSS, CELUI-CI EN PIXELS DE BUFFER, ET
 * LES CONFONDRE DIVISERAIT LA PLAGE PAR LA DENSITÉ. `#chantier-grille` écrit
 * `--case-cote` en pixels CSS ; ce canevas-ci dessine dans son buffer, qui fait
 * `devicePixelRatio` fois plus. Prendre `COTE_CASE_MAX` tel quel donnerait, sur
 * un téléphone à densité 3, un plafond de 128 buffer là où le plancher en vaut
 * déjà 108 : **une plage de 1,19 fois**, c'est-à-dire très exactement le « zoom
 * chelou, très lent » qu'Ethan a rapporté le 31/08 et que le lot suivant a
 * corrigé en ouvrant la plage.
 *
 * ⚠⚠ ET IL RESTE UN MULTIPLE ENTIER DE `COTE_SPRITE`, PAR CONSTRUCTION. C'est
 * tout le raisonnement de `ZOOM_BASE_MULTIPLE_MAX` : au plafond, un pixel de
 * sprite vaut un nombre ENTIER de pixels dessinés, donc `drawImage`
 * n'interpole pas. On prend donc le multiple le plus PROCHE du plafond de la
 * base converti — jamais le plafond converti lui-même, qu'une densité
 * fractionnaire (2,625 sur certains Android) rendrait non entier.
 *
 * ⚠ UN MULTIPLE AU MOINS, JAMAIS ZÉRO : sur un écran à densité inférieure à 1,
 * l'arrondi tomberait sur zéro et la grille disparaîtrait.
 *
 * @param {number} dpr densité de pixels de l'appareil
 * @returns {number} côté maximal, en pixels de buffer
 */
export function plafondDuZoom(dpr) {
  const densite = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
  const multiple = Math.max(1, Math.round((COTE_CASE_MAX * densite) / COTE_SPRITE));
  return COTE_SPRITE * multiple;
}

// ---------------------------------------------------------------------------
// Étage DOM
// ---------------------------------------------------------------------------
//
// ⚠ LE MODE « RÉPARER » A EXACTEMENT LA FORME DES MODES D'`offense.js` : un
// bouton s'arme, le geste suivant désigne la pièce, retoucher le bouton désarme.
// En inventer une seconde forme sur la même grille 4 × 9 apprendrait deux
// grammaires au joueur pour le même doigt.
//
// ⚠⚠ ET LE GLISSER-DÉPOSER COEXISTE AVEC ELLE, CE QUI EST UNE DETTE ASSUMÉE.
// `ui/offense.js` compose la MÊME grille par modes tactiles — « Mode DÉPLACER :
// touchez l'unité à déplacer ». Ethan a demandé le glisser-déposer ici, deux
// fois : ce lot l'exécute, et le rapport le signale comme une dette
// d'ergonomie plutôt que de la résoudre d'initiative.
//
// ⚠ AUCUNE EXCEPTION NE REMONTE À L'ÉCRAN. `reparerUnePiece`, `toutReparer` et
// `deplacerEffectif` LÈVENT ; c'est `problemesDe…` qui grise et qui dit le
// manque. On demande, puis on agit — jamais un `try` autour du geste.

/** Les modes de la barre du raid — même forme que `ACTIONS_ARMEE` d'Offense. */
export const MODES_RAID = {
  reparer: {
    bouton: 'raid-reparer',
    libelle: 'Réparer',
    invite: 'Mode RÉPARER : touchez l\'unité à réparer. Retouchez le bouton pour annuler.',
    problemes: (etat, index) => problemesDeLaReparationDUnePiece(etat, index),
    agir: (etat, index) => reparerUnePiece(etat, index),
  },
  activer: {
    bouton: 'raid-activer',
    libelle: 'Activer / désactiver',
    invite: 'Mode ACTIVER : touchez l\'unité à laisser à la maison, ou à renvoyer au raid.',
    problemes: () => [],
    agir: (etat, index) => reglerActivite(
      etat, 'armee', index, baseCourante(etat).armee[index].actif === false,
    ),
  },
};

/**
 * Câble l'écran de raid.
 *
 * @param {Document} doc
 * @param {{versEcran: Function, apresGeste: Function}} crochets
 */
export function initialiserEcranRaid(doc, crochets = {}) {
  const $ = (id) => doc.getElementById(id);
  const versEcran = crochets.versEcran ?? (() => {});
  const apresGeste = crochets.apresGeste ?? (() => {});
  // ⚠ L'ÉCRAN NOMME UN GESTE, JAMAIS UN SON — même frontière que `sonDeRefus`
  // du lot SON-MOTEUR, et la garde `SON T14` refuse de toute façon un appel de
  // `jouer(` ici. Le déroulé, lui, n'a rien à annoncer : les 174 sons de combat
  // attendent un journal de tick qui n'existe pas, et ce journal est un chantier
  // de simulation.
  const sonDeGeste = crochets.sonDeGeste ?? (() => {});
  // ⚠⚠ LE CHROME COMMUN N'EST PAS À CET ÉCRAN, ET LE DÉROULÉ N'EST PAS UN
  // ÉCRAN. `#tete-onglets`, `#ressources` et `#navigation` sont frères de
  // `#ecrans` : les masquer d'ici demanderait à l'écran de raid de connaître le
  // balisage de la page, ce que la règle de `montrerEcran` refuse depuis le lot
  // MISE-EN-PAGE. On DEMANDE, la session écrit — même découpage que `versEcran`.
  const pendantLeDeroule = crochets.pendantLeDeroule ?? (() => {});
  /**
   * Ce que le DÉROULÉ a fait entendre depuis le dernier relevé de la session.
   *
   * ⚠⚠ UN ENSEMBLE, PAS UNE FILE, ET C'EST LA RÉPONSE AU POINT DUR DU LOT. La
   * simulation avance par TICKS, l'écran par IMAGES, et `ticksDus` en résout
   * jusqu'à douze dans la même image en ×4. Une file demanderait cent cinquante
   * coups de canon dans la même milliseconde ; la politique de voix les
   * refuserait, mais compter sur un refus n'est pas une conception. **Un
   * événement distinct ne sonne qu'une fois par relevé**, quel que soit le
   * nombre de ticks qui l'ont réclamé — et l'ensemble est borné par le pack,
   * donc il ne peut pas grossir.
   */
  const evenementsSonores = new Set();

  const canvas = $('raid-canvas');
  const ctx = canvas === null ? null : canvas.getContext('2d');
  // ⚠ LE PIXEL ART NE S'INTERPOLE PAS, et c'est ici que ça se décide — chez
  // celui qui crée le contexte. `render/canvas2d.js` n'en prend aucune.
  if (ctx !== null) ctx.imageSmoothingEnabled = false;

  let etatCourant = null;
  let cibleCourante = null;
  // ⚠ LE DÉCOR DE LA BASE REGARDÉE — lot MUR-PEINT. Il ne change pas tant qu'on
  // reste sur la même cible, donc il se calcule à l'ouverture et pas à chaque
  // image : `dessiner` passe dix fois par seconde.
  let fondCourant = null;
  let atlas = null;
  let mode = null;
  let rapportCourant = null;

  // --- le déroulé ------------------------------------------------------------
  let combat = null;
  let precedentes = null;
  let accumulateur = creerAccumulateur();
  let vitesse = 1;
  let derniereImageMs = null;
  let idImage = null;
  let enPause = false;
  let projection = null;
  let simulation = false;

  // --- la vue : quelle bande, à quelle taille, et où -------------------------
  //
  // ⚠⚠ TROIS ÉTATS ET PAS UN DE PLUS, ET C'EST CE QUE `calculerProjection`
  // ATTEND. La bande décide de ce qui doit TENIR en hauteur, le côté de case de
  // la TAILLE, les deux décalages de l'ENDROIT. Rien d'autre n'est retenu : la
  // projection se recalcule à chaque image à partir de ces trois-là et de la
  // taille du canevas, si bien qu'une rotation d'écran ne peut pas laisser
  // derrière elle une marge périmée.
  //
  // ⚠⚠ ET `null` DÉSIGNE LA VUE D'ENSEMBLE, QUI EST CELLE DU DÉROULÉ. C'est une
  // LECTURE, et le rapport la déclare comme telle : Ethan a dit « mode Raid »
  // sans distinguer la préparation du combat. Un raid part des rangées 1–2,
  // traverse la défense en 3–10 et atteint les bâtiments en 11–18 : cadrer une
  // seule bande pendant qu'il se joue serait regarder ailleurs pendant que ça
  // se passe. Le zoom et le défilement, eux, RESTENT disponibles — si le joueur
  // veut regarder de près, rien ne l'en empêche. Un mot d'Ethan renverse ça, et
  // c'est le nombre de départ qui change, pas l'architecture.
  let bandeCourante = 'batiments';
  /** Le côté imposé par le doigt, en pixels de buffer ; `null` = celui qui tient. */
  let coteVoulu = null;
  let decalageX = 0;
  let decalageY = 0;
  /** Vrai tant qu'un combat se déroule à l'écran — la préparation est l'autre état. */
  let deroule = false;
  /** La minuterie qui rend le bouton d'attaque vif — voir `armerLAttaque`. */
  let minuterieArmement = null;
  /** Combien de fois une image a été calculée, et le temps total — mesure M2. */
  const mesure = { images: 0, totalMs: 0 };

  /**
   * Avance d'UN tick, et relève ce que ce tick a publié.
   *
   * ⚠⚠ LE RELEVÉ SE FAIT LÀ OÙ L'INSTANTANÉ SE PREND, ET NULLE PART AILLEURS.
   * Les deux vont ensemble : `precedentes` sert l'interpolation, le journal sert
   * le son, et tous deux ne valent que pour le tick qu'on vient de jouer. C'est
   * pourquoi « Instantané » ne fait sonner RIEN — il boucle sur `tickCombat`
   * sans prendre d'instantané, exactement comme il le faisait déjà avant ce lot,
   * et un combat résolu d'un coup n'a pas de déroulé. Ce n'est pas un cas
   * particulier écrit à la main : c'est une conséquence de l'endroit.
   */
  function avancerDUnTick() {
    precedentes = prendrePositions(combat);
    tickCombat(combat);
    relever();
  }

  /** Verse le journal du dernier tick dans l'ensemble en attente. */
  function relever() {
    if (combat === null) return;
    for (const evenement of evenementsDuJournal(combat.journal)) {
      evenementsSonores.add(evenement);
    }
  }

  function arreterBoucle() {
    if (idImage !== null && typeof globalThis.cancelAnimationFrame === 'function') {
      globalThis.cancelAnimationFrame(idImage);
    }
    idImage = null;
  }

  /**
   * ⚠⚠ UN ÉLÉMENT CACHÉ MESURE ZÉRO, ET `calculerProjection` LÈVE DESSUS. Trouvé
   * au boot sans tête, pas à la relecture : le `ResizeObserver` se déclenche au
   * câblage, alors que `#ecran-raid` est encore `hidden`, et la page partait en
   * « viewport 1 × 1 trop petit pour une case » AVANT que le joueur ait rien
   * touché. C'est le piège que `initialiserBanc` évite en n'étant appelé qu'à
   * l'ouverture ; ici l'écran se câble au démarrage, donc la garde est dans la
   * mesure elle-même.
   *
   * ⚠ ON REND `false` ET ON NE DESSINE PAS, plutôt que de forcer une taille
   * minimale : une projection calculée sur un canevas invisible serait fausse,
   * et il faudrait la refaire de toute façon à l'ouverture.
   *
   * @returns {boolean} vrai si le canevas a une taille utilisable
   */
  /**
   * La bande que la vue cadre : celle qu'on a choisie, ou la vue d'ensemble
   * pendant le déroulé.
   *
   * ⚠ ELLE SE DEMANDE, ELLE NE SE RETIENT PAS. Écrire `bandeCourante = null` en
   * entrant dans le déroulé obligerait à la restaurer aux QUATRE portes de
   * sortie — fin normale, « Instantané », pas-à-pas, abandon — et c'est très
   * exactement le défaut que le lot ASSAUT a payé sur le chrome.
   */
  const bandeDeLaVue = () => (deroule ? null : bandeCourante);

  function dimensionner() {
    if (canvas === null) return false;
    const dpr = (doc.defaultView && doc.defaultView.devicePixelRatio) || 1;
    const largeur = Math.round(canvas.clientWidth * dpr);
    const hauteur = Math.round(canvas.clientHeight * dpr);
    if (largeur <= 0 || hauteur <= 0) { projection = null; return false; }
    if (canvas.width !== largeur) canvas.width = largeur;
    if (canvas.height !== hauteur) canvas.height = hauteur;
    // ⚠⚠ `MUR_CASES` — LA PLACE DU MUR PEINT, ET C'EST L'ÉCRAN QUI LE DIT. Le
    // champ de bataille montre une BASE, et une base porte son mur DANS son
    // décor : la projection réserve donc une demi-case à gauche, à droite et en
    // haut, pour que le fond se pose d'un mur à l'autre sans recouvrir une case
    // de contenu. Le banc d'essai n'a pas de décor et ne réserve rien.
    //
    // ⚠ IL VALAIT `1` JUSQU'AU LOT MUR-PEINT, quand le mur était un ANNEAU de
    // blocs dessinés case par case. La demi-case rend au champ de bataille
    // environ 10 % de taille de case à surface d'écran égale.
    //
    // ⚠⚠ LA BANDE DÉCIDE DU CADRAGE, ET C'EST TOUT LE §2 DU LOT. Avant elle, la
    // projection devait faire tenir DIX-HUIT rangées et demie dans un canevas
    // que `#raid-bas` laisse à 466 px CSS sur un S25 FE : c'était la HAUTEUR qui
    // commandait, la case tombait à 75 pixels de buffer au lieu de 108, et
    // **165 pixels de noir restaient de chaque côté du décor — 30,6 % de la
    // largeur**. Ethan : « de sorte que le fond remplisse toute la largeur ».
    // Huit rangées et demie font passer la limite du côté de la largeur, sans
    // condition.
    const lignesVisibles = casesDeLaBande(bandeDeLaVue(), MUR_CASES);
    // ⚠ LE PLANCHER SE DÉRIVE, IL NE S'ÉCRIT PAS : c'est la taille que la MÊME
    // formule rend quand on ne lui impose rien, donc celle qui fait tenir la
    // bande entière. L'écrire à la main donnerait un second letterboxing.
    const plancher = calculerProjection(largeur, hauteur, MUR_CASES, { lignesVisibles })
      .tailleCase;
    const plafond = plafondDuZoom(dpr);
    // ⚠ LE PLANCHER L'EMPORTE SUR LE PLAFOND, et l'ordre des bornes le dit : sur
    // un écran très large, la taille qui fait tenir la bande peut dépasser le
    // plafond de netteté. Montrer la bande entière est la contrainte forte ; du
    // pixel art légèrement interpolé est le prix, et il ne se paie que là.
    const cote = Math.max(plancher, Math.min(plafond, coteVoulu ?? plancher));
    const bornesY = bornesDuDecalage(bandeDeLaVue(), cote, hauteur, MUR_CASES);
    const bornesX = bornesDuDecalageX(cote, largeur, MUR_CASES);
    decalageY = Math.min(bornesY.max, Math.max(bornesY.min, decalageY));
    decalageX = Math.min(bornesX.max, Math.max(bornesX.min, decalageX));
    projection = calculerProjection(largeur, hauteur, MUR_CASES, {
      lignesVisibles, coteCase: cote, decalageX, decalageY,
    });
    return true;
  }

  /**
   * Va à une bande, et se pose à son début.
   *
   * ⚠ LE DÉCALAGE SE REMET À LA BORNE BASSE DE LA BANDE VISÉE, jamais à zéro :
   * la borne basse de la Défense est le haut de la Défense, et zéro serait le
   * haut de la base. Un joueur qui demande la défense et qui voit les bâtiments
   * croirait le bouton cassé.
   */
  function allerALaBande(cle) {
    if (!BANDES_NAVIGABLES.includes(cle)) return;
    bandeCourante = cle;
    // On force le décalage hors bornes : `dimensionner` le rabat sur le `min` de
    // la bande neuve, quel qu'il soit, sans que ce code-ci ait à le recalculer.
    decalageY = -Infinity;
    marquerBascule();
    dimensionner();
    dessiner();
  }

  function dessiner() {
    if (ctx === null || combat === null || projection === null) return;
    const debut = (doc.defaultView?.performance ?? globalThis.performance)?.now() ?? 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    executer(
      ctx,
      // ⚠⚠ LA GRAINE DE LA PARTIE, ET C'EST LA MÊME QUE L'ÉCRAN DE LA BASE
      // DONNE À SES CASES. Elle ne choisit pas QUELS obstacles sont là — ça,
      // c'est le montage du site — mais LEQUEL de leurs deux dessins se pose.
      // Passer la graine du site à la place ferait un second tirage : le même
      // obstacle, à la même case, n'aurait plus le même dessin des deux côtés,
      // et c'est très exactement ce que ce point d'Ethan demande de refermer.
      listeAffichage(combat, projection, precedentes,
        combat.termine ? 0 : alphaMilli(accumulateur, vitesse), fondCourant,
        etatCourant.graine),
      atlas ?? {},
    );
    const fin = (doc.defaultView?.performance ?? globalThis.performance)?.now() ?? 0;
    mesure.images += 1;
    mesure.totalMs += fin - debut;
  }

  function image(horodatageMs) {
    idImage = null;
    const ecoule = derniereImageMs === null ? 0 : horodatageMs - derniereImageMs;
    derniereImageMs = horodatageMs;
    if (combat !== null && !combat.termine && !enPause) {
      const dus = ticksDus(accumulateur, ecoule, vitesse);
      for (let k = 0; k < dus && !combat.termine; k += 1) {
        // L'instantané se prend AVANT le tick : c'est lui que l'interpolation
        // compare à la position d'après. Le journal se relève après.
        avancerDUnTick();
      }
    }
    dessiner();
    if (combat !== null && combat.termine) { finDuDeroule(); return; }
    if (!enPause) idImage = doc.defaultView.requestAnimationFrame(image);
  }

  function demarrerBoucle() {
    if (idImage !== null || combat === null || combat.termine) return;
    derniereImageMs = null; // pas de rattrapage du temps passé arrêté
    idImage = doc.defaultView.requestAnimationFrame(image);
  }

  /**
   * ⚠ LE DÉROULÉ EST UN REJEU, PAS LA SOURCE DE VÉRITÉ. L'état a déjà été commis
   * par `executerRaid` avant la première image — arbitrage « A » du 01/09. Si
   * l'application est tuée pendant l'animation, rien n'est perdu, et « passer »
   * est gratuit puisqu'il n'interrompt aucun calcul.
   *
   * ⚠ ET LE REJEU EST EXACT PARCE QUE LE COMBAT N'A AUCUN HASARD :
   * `Math.random` n'apparaît pas une fois dans `sim/combat.js`. S'il divergeait
   * du rapport, ce serait un bogue de MONTAGE, jamais une fatalité.
   */
  function rejouer(montage, vagues) {
    combat = creerCombat({ ...montage, vagues });
    // ⚠ LE JOURNAL DE LA CRÉATION PORTE L'ENTRÉE DE LA VAGUE 1. `creerCombat` la
    // pose au tick 0 — c'est sa dernière ligne — et `tick()` viderait ce journal
    // à la première image. Sans ce relevé-ci, la première vague serait la seule
    // des quatre à entrer en silence.
    relever();
    precedentes = prendrePositions(combat);
    accumulateur = creerAccumulateur();
    enPause = false;
    dimensionner();
    demarrerBoucle();
  }

  // --- les deux états de l'écran --------------------------------------------
  //
  // ⚠⚠ PRÉPARATION ET DÉROULÉ, ET LA FIN EST LA PRÉPARATION. Ethan, 04/09 :
  // « quand on lance un raid, toutes les barres disparaissent. On voit juste la
  // simulation en cours. » Ce qui part : les onglets et les deux bandeaux, que
  // la session écrit, et `#raid-bas`, que cet écran-ci possède. Ce qui RESTE :
  // les vitesses, qui sont le contrôle du déroulé lui-même.
  //
  // ⚠ LES DEUX SONT IDEMPOTENTES, et ce n'est pas de la coquetterie :
  // `quitterLeDeroule` est appelée par trois portes — la fin du combat,
  // `fermerPanneaux` et `masquer` — dont deux passent aussi au câblage et à
  // chaque ouverture. Sans le garde-fou, la session recevrait un « le déroulé
  // est fini » avant qu'aucun n'ait commencé.

  function entrerDansLeDeroule() {
    deroule = true;
    const bas = $('raid-bas');
    if (bas !== null) bas.hidden = true;
    // ⚠⚠ LE DÉROULÉ S'OUVRE SUR LA VUE D'ENSEMBLE, ZOOM COMPRIS. C'est la moitié
    // de la lecture du §3.1 : garder le gros plan de la préparation ferait
    // regarder trois colonnes pendant que le combat traverse les dix-huit
    // rangées. Le pincement reste disponible — le joueur peut se rapprocher
    // s'il le veut —, il ne s'applique simplement pas de lui-même.
    coteVoulu = null;
    marquerBascule();
    pendantLeDeroule(true);
  }

  function quitterLeDeroule() {
    if (!deroule) return;
    deroule = false;
    const bas = $('raid-bas');
    if (bas !== null) bas.hidden = false;
    // Les vitesses sont un contrôle du déroulé : elles s'en vont avec lui.
    const vitesses = $('raid-vitesses');
    if (vitesses !== null) vitesses.hidden = true;
    // ⚠ ON REVIENT À LA BANDE, DONC LE CADRAGE CHANGE : `#raid-bas` reparaît et
    // la vue redevient celle d'une bande. Le `ResizeObserver` verra la hauteur
    // bouger, mais pas la bande — c'est ici qu'on le dit.
    coteVoulu = null;
    decalageY = -Infinity;
    marquerBascule();
    dimensionner();
    dessiner();
    pendantLeDeroule(false);
  }

  /**
   * Le gros bouton d'attaque : son prix, et le court délai qui le rend vif.
   *
   * ⚠⚠ IL NAÎT INERTE À CHAQUE ENTRÉE SUR L'ÉCRAN. Voir `ECRAN_RAID` dans
   * `src/data/sites.js` pour le motif entier : le bouton est gros et il est
   * posé à l'endroit de la carte qu'on vient de toucher deux fois.
   *
   * ⚠ INERTE, ET QUI SE VOIT. Un bouton qui ne répond pas sans le dire est un
   * bouton cassé — l'attribut `disabled` porte l'aspect que le dépôt emploie
   * déjà pour `#raid-fin .boutons button[disabled]`, et il n'en faut pas une
   * seconde.
   *
   * @param {number|null} cout
   */
  function armerLAttaque(cout) {
    const bouton = $('raid-attaquer');
    if (bouton === null) return;
    const { mot, prix } = libelleDAttaque(cout);
    const grand = bouton.querySelector('b');
    const petit = bouton.querySelector('small');
    if (grand !== null) grand.textContent = mot;
    if (petit !== null) { petit.textContent = prix; petit.hidden = prix === ''; }
    bouton.disabled = true;
    const fenetre = doc.defaultView;
    if (fenetre === null || typeof fenetre.setTimeout !== 'function') {
      bouton.disabled = false;
      return;
    }
    if (minuterieArmement !== null) fenetre.clearTimeout(minuterieArmement);
    minuterieArmement = fenetre.setTimeout(() => {
      minuterieArmement = null;
      bouton.disabled = false;
    }, ECRAN_RAID.delaiArmementMs);
  }

  function finDuDeroule() {
    arreterBoucle();
    quitterLeDeroule();
    if (rapportCourant !== null) montrerResultat(rapportCourant, simulation);
  }

  // --- les panneaux de résultat ---------------------------------------------
  //
  // ⚠⚠ DEUX TAILLES, UN SEUL CONTENU. Les deux panneaux rendent
  // `lignesDuResultat` du MÊME rapport : ils ne peuvent pas diverger, puisqu'ils
  // n'ont rien à calculer. C'est ce que le test T7 vérifie.

  function remplirLignes(hote, rapport) {
    hote.textContent = '';
    for (const ligne of lignesDuResultat(rapport)) {
      const bloc = doc.createElement('div');
      bloc.className = 'ligne';
      const quoi = doc.createElement('span');
      quoi.className = 'quoi';
      quoi.textContent = ligne.quoi;
      const valeur = doc.createElement('b');
      valeur.textContent = ligne.valeur;
      bloc.append(quoi, valeur);
      hote.appendChild(bloc);
    }
  }

  function montrerResultat(rapport, petit) {
    const hote = petit ? $('raid-sim-corps') : $('raid-fin-corps');
    if (hote === null) return;
    remplirLignes(hote, rapport);
    if (petit) {
      $('raid-sim').hidden = false;
    } else {
      // ⚠ « RÉ-ATTAQUER » N'APPARAÎT QUE SI LA BASE N'EST PAS RASÉE — il n'y a
      // plus rien à attaquer sinon. Et il repasse par `problemesDuRaid` : un
      // second raid coûte encore des points, et l'armée qui revient est abîmée.
      const rejouable = !rapport.rase && etatCourant !== null && cibleCourante !== null
        && problemesDuRaid(etatCourant, baseCourante(etatCourant), cibleCourante).length === 0;
      $('raid-reattaquer').hidden = rapport.rase;
      $('raid-reattaquer').disabled = !rejouable;
      $('raid-fin').hidden = false;
    }
  }

  // --- l'armée ---------------------------------------------------------------
  const cellules = new Map();
  const cle = (vague, colonne) => `${vague}:${colonne}`;

  function peindreVagues() {
    const hote = $('raid-vagues');
    if (hote === null || etatCourant === null) return;
    hote.textContent = '';
    cellules.clear();
    for (const vague of vaguesDeLArmee(etatCourant)) {
      const bloc = doc.createElement('div');
      bloc.className = 'vague';
      const rangee = doc.createElement('div');
      rangee.className = 'emplacements';
      rangee.style.gridTemplateColumns = `repeat(${NB_COLONNES}, 1fr)`;
      for (let colonne = 1; colonne <= NB_COLONNES; colonne += 1) {
        const occupant = vague.cases[colonne - 1];
        const emplacement = doc.createElement('div');
        emplacement.className = 'emplacement';
        emplacement.dataset.vague = String(vague.numero);
        emplacement.dataset.colonne = String(colonne);
        if (occupant !== null) {
          emplacement.classList.add('occupe');
          emplacement.dataset.index = String(occupant.index);
          if (!occupant.actif) emplacement.classList.add('inactive');
          if (occupant.degatsMilli > 0) emplacement.classList.add('abimee');
          emplacement.title = `${occupant.nom} · niveau ${occupant.niveau}`
            + ` · ${occupant.pvPct} % de PV${occupant.actif ? '' : ' · reste à la maison'}`;
          // ⚠⚠ LE SPRITE A REMPLACÉ LE NOM — Ethan, 04/09 : « il n'y a pas les
          // sprites de nos unités en bas ». L'emplacement portait le nom en 6 px
          // sur un bloc noir : six « Fusiliers » côte à côte se lisaient comme
          // six étiquettes, pas comme une armée. C'est le geste que l'écran
          // Offense a reçu le 30/08, et c'est la MÊME vignette — même fonction
          // de couches, même pose, même part de 84 %.
          //
          // ⚠ LE NOM N'EST PAS PERDU : il est déjà dans le `title` ci-dessus,
          // avec le niveau et les PV. « Rien ne se retire en silence » (§4).
          const piece = doc.createElement('div');
          piece.className = 'piece';
          poserCouches(piece, couchesDeLUniteDAssaut(occupant.id));
          emplacement.appendChild(piece);
        }
        cellules.set(cle(vague.numero, colonne), emplacement);
        rangee.appendChild(emplacement);
      }
      bloc.appendChild(rangee);
      hote.appendChild(bloc);
    }
  }

  function avis(texte) {
    const ligne = $('raid-avis');
    if (ligne === null) return;
    ligne.textContent = texte;
    ligne.hidden = texte === '';
  }

  // --- les modes -------------------------------------------------------------
  function desarmer() {
    mode = null;
    for (const m of Object.values(MODES_RAID)) {
      const bouton = $(m.bouton);
      if (bouton !== null) bouton.classList.remove('arme');
    }
    const tout = $('raid-tout-reparer');
    if (tout !== null) tout.hidden = true;
    avis('');
  }

  function armer(nom) {
    if (mode === nom) { desarmer(); return; }
    desarmer();
    mode = nom;
    const m = MODES_RAID[nom];
    $(m.bouton).classList.add('arme');
    // ⚠ « TOUT RÉPARER » N'APPARAÎT QUE LE MODE RÉPARER ARMÉ, et AU-DESSUS de la
    // rangée — Ethan, 01/09.
    if (nom === 'reparer') $('raid-tout-reparer').hidden = false;
    avis(m.invite);
  }

  /** Le geste d'un mode sur une pièce : on demande, puis on agit. */
  function agirSur(index) {
    const m = MODES_RAID[mode];
    if (m === undefined || etatCourant === null) return;
    const problemes = m.problemes(etatCourant, index);
    if (problemes.length > 0) {
      // Les messages de refus se reprennent MOT POUR MOT : ils sont déjà écrits
      // en français lisible dans `sim/`, et les reformuler ici en ferait une
      // seconde formulation qui finirait par dire autre chose que la règle.
      avis(problemes.map((p) => p.message).join(' ; '));
      desarmer();
      peindreVagues();
      return;
    }
    m.agir(etatCourant, index);
    desarmer();
    peindreVagues();
    apresGeste();
  }

  // --- le glisser-déposer ----------------------------------------------------
  //
  // ⚠ POINTER EVENTS, PAS SOURIS. La cible est un téléphone : les événements de
  // souris n'y arrivent qu'en émulation, et jamais pendant un vrai glissement.
  //
  // ⚠⚠ ET IL PASSE PAR `deplacerEffectif`, TOUJOURS. Le glisser-déposer est un
  // GESTE D'ENTRÉE ; écrire la case d'arrivée en direct donnerait une seconde
  // vérité sur qui peut aller où, et le premier désaccord se lirait comme un
  // bogue de jeu. On demande à `problemesDuDeplacementDEffectif`, puis on agit.
  let saisie = null;

  function surPointerDown(evenement) {
    const emplacement = evenement.target.closest?.('.emplacement');
    if (emplacement === null || emplacement === undefined || etatCourant === null) return;
    const index = emplacement.dataset.index;
    // Un mode armé l'emporte sur le glissement : le doigt désigne, il ne traîne
    // pas.
    if (mode !== null) {
      if (index !== undefined) agirSur(Number(index));
      else desarmer();
      return;
    }
    if (index === undefined) return;
    saisie = { index: Number(index), depuis: emplacement };
    emplacement.classList.add('enmain');
    if (typeof emplacement.setPointerCapture === 'function') {
      emplacement.setPointerCapture(evenement.pointerId);
    }
  }

  function surPointerUp(evenement) {
    if (saisie === null || etatCourant === null) return;
    const { index, depuis } = saisie;
    saisie = null;
    depuis.classList.remove('enmain');
    const arrivee = doc.elementFromPoint?.(evenement.clientX, evenement.clientY)
      ?.closest?.('.emplacement');
    if (arrivee === null || arrivee === undefined) return;
    const position = {
      vague: Number(arrivee.dataset.vague),
      colonne: Number(arrivee.dataset.colonne),
    };
    const problemes = problemesDuDeplacementDEffectif(etatCourant, 'armee', index, position);
    if (problemes.length > 0) {
      avis(problemes.map((p) => p.message).join(' ; '));
      return;
    }
    deplacerEffectif(etatCourant, 'armee', index, position);
    avis('');
    peindreVagues();
    apresGeste();
  }

  const hoteVagues = $('raid-vagues');
  if (hoteVagues !== null) {
    hoteVagues.addEventListener('pointerdown', surPointerDown);
    hoteVagues.addEventListener('pointerup', surPointerUp);
    hoteVagues.addEventListener('pointercancel', () => {
      if (saisie !== null) saisie.depuis.classList.remove('enmain');
      saisie = null;
    });
  }

  // --- la bascule de bande, et le zoom au doigt -------------------------------
  //
  // ⚠⚠ LE GESTE EST CELUI DE LA CARTE, PAS CELUI DE LA BASE, ET LA RAISON EST
  // LA SURFACE. `#raid-canvas` porte `touch-action: none` : le navigateur n'a
  // aucun geste à lui disputer, donc les évènements de POINTEUR y sont fiables —
  // c'est exactement ce que `ui/monde.js` explique pour son propre canevas.
  // L'écran de la base, lui, passe par `touchmove` parce que son conteneur
  // défile NATIVEMENT et que le navigateur lui prend la main à deux doigts.
  // Écrire les deux pareil aurait demandé de repeindre un défilement à la main.
  //
  // ⚠⚠ ET LE GLISSER-DÉPOSER NE VIT PAS SUR CETTE SURFACE — MESURÉ, PAS SUPPOSÉ.
  // Il est posé sur `#raid-vagues`, la rangée du bas, et pas une ligne de ce
  // fichier n'écoute le canevas avant ce lot. Les deux gestes ne peuvent donc
  // pas se disputer un contact : ce sont deux éléments, et un contact tombe sur
  // un seul. La dette d'ergonomie déclarée en tête de ce fichier — les modes
  // tactiles et le glissement sur la même grille 4 × 9 — reste entière, et ce
  // lot ne l'aggrave pas d'un pixel.
  //
  // ⚠ UN DOIGT PROMÈNE, DEUX DOIGTS ZOOMENT — la règle du 30/08, la même
  // partout.

  const boutonBascule = $('raid-bascule-bande');

  function marquerBascule() {
    if (boutonBascule === null) return;
    // Pendant le déroulé il n'y a pas de bande : la vue est d'ensemble, et un
    // bouton qui emmènerait ailleurs pendant qu'un combat se joue n'a pas de
    // sens. Il revient avec `#raid-bas`, par la même porte.
    boutonBascule.hidden = deroule;
    const bascule = basculeDeBande(bandeCourante);
    boutonBascule.textContent = bascule.glyphe;
    boutonBascule.title = bascule.libelle;
    boutonBascule.setAttribute('aria-label', bascule.libelle);
  }

  if (boutonBascule !== null) {
    boutonBascule.addEventListener('click', () => {
      allerALaBande(basculeDeBande(bandeCourante).cible);
    });
  }

  /** Les contacts en cours, par identifiant — jamais un compteur. */
  const doigts = new Map();
  let pincement = null;
  let pointeur = null;

  const ecartDesDoigts = (deux) => Math.hypot(deux[0].x - deux[1].x, deux[0].y - deux[1].y);

  /** Le milieu des deux doigts, en pixels du BUFFER du canevas. */
  function milieuDesDoigts(deux) {
    const cadre = canvas.getBoundingClientRect();
    const dpr = (doc.defaultView && doc.defaultView.devicePixelRatio) || 1;
    return {
      x: ((deux[0].x + deux[1].x) / 2 - cadre.left) * dpr,
      y: ((deux[0].y + deux[1].y) / 2 - cadre.top) * dpr,
    };
  }

  /**
   * Change le côté de case en gardant la case sous les doigts sous les doigts.
   *
   * ⚠⚠ ON RELIT LA PROJECTION AU LIEU DE REFAIRE SON CENTRAGE. Le décalage qui
   * garde l'ancre dépend du centrage, et le centrage est une ligne de
   * `calculerProjection` : la recopier ici en ferait une seconde vérité, et la
   * divergence se lirait comme une vue qui saute d'un demi-écran au premier
   * pincement. On applique, on relit où l'ancre est tombée, on corrige, on
   * réapplique — trois calculs purs, et aucune formule dupliquée.
   */
  function reglerCote(nouveau, ancre) {
    if (projection === null || !Number.isFinite(nouveau)) return;
    const u = (ancre.x - projection.margeX) / projection.tailleCase;
    const v = (ancre.y - projection.margeY) / projection.tailleCase;
    coteVoulu = nouveau;
    if (!dimensionner()) return;
    decalageX += projection.margeX - ancre.x + u * projection.tailleCase;
    decalageY += projection.margeY - ancre.y + v * projection.tailleCase;
    dimensionner();
    dessiner();
  }

  function ouvrirPincement() {
    if (doigts.size !== 2) { pincement = null; return; }
    const deux = [...doigts.values()];
    const ecart = ecartDesDoigts(deux);
    // Deux doigts joints donneraient un rapport qui explose au premier pixel.
    if (ecart < 1) { pincement = null; return; }
    pincement = { ecart };
  }

  if (canvas !== null) {
    canvas.addEventListener('pointerdown', (evenement) => {
      if (typeof canvas.setPointerCapture === 'function') {
        canvas.setPointerCapture(evenement.pointerId);
      }
      doigts.set(evenement.pointerId, { x: evenement.clientX, y: evenement.clientY });
      if (doigts.size >= 2) { ouvrirPincement(); return; }
      pointeur = { id: evenement.pointerId, x: evenement.clientX, y: evenement.clientY };
    });

    canvas.addEventListener('pointermove', (evenement) => {
      if (doigts.has(evenement.pointerId)) {
        doigts.set(evenement.pointerId, { x: evenement.clientX, y: evenement.clientY });
      }
      if (pincement !== null && doigts.size === 2) {
        const deux = [...doigts.values()];
        const ecart = ecartDesDoigts(deux);
        const rapport = ecart / pincement.ecart;
        // ⚠ LE RAPPORT DES ÉCARTS, PAS LEUR DIFFÉRENCE : une différence en
        // pixels zoomerait plus vite sur un grand écran que sur un petit, pour
        // le même geste de la main.
        if (ecart >= 1 && Number.isFinite(rapport) && projection !== null) {
          reglerCote(projection.tailleCase * rapport, milieuDesDoigts(deux));
        }
        // On ré-ancre sur l'écart RÉEL, y compris quand la butée a refusé le
        // changement : sinon il faudrait « rendre » le pincement excédentaire
        // avant que le dézoom ne reprenne.
        pincement = { ecart };
        return;
      }
      if (pointeur === null || evenement.pointerId !== pointeur.id) return;
      const dpr = (doc.defaultView && doc.defaultView.devicePixelRatio) || 1;
      decalageX -= (evenement.clientX - pointeur.x) * dpr;
      decalageY -= (evenement.clientY - pointeur.y) * dpr;
      pointeur.x = evenement.clientX;
      pointeur.y = evenement.clientY;
      dimensionner();
      dessiner();
    });

    const relacher = (evenement) => {
      doigts.delete(evenement.pointerId);
      if (doigts.size < 2) pincement = null;
      if (pointeur !== null && evenement.pointerId === pointeur.id) pointeur = null;
    };
    canvas.addEventListener('pointerup', relacher);
    canvas.addEventListener('pointercancel', relacher);
  }

  // --- les six boutons -------------------------------------------------------
  function brancher(id, action) {
    const bouton = $(id);
    if (bouton !== null) bouton.addEventListener('click', action);
  }

  brancher('raid-reparer', () => armer('reparer'));
  brancher('raid-activer', () => armer('activer'));

  brancher('raid-tout-reparer', () => {
    if (etatCourant === null) return;
    const bilan = toutReparer(etatCourant);
    desarmer();
    peindreVagues();
    apresGeste();
    // ⚠ `toutReparer` NE S'ARRÊTE PAS À LA PREMIÈRE IMPAYABLE : elle répare tout
    // ce qui est payable et COMPTE le reste. On le dit, sinon le joueur croirait
    // que rien ne s'est passé.
    avis(bilan.impayables === 0
      ? `${bilan.reparees} unité(s) réparée(s).`
      : `${bilan.reparees} réparée(s), ${bilan.impayables} hors de portée de la réserve.`);
  });

  brancher('raid-retour-carte', () => { fermerPanneaux(); versEcran('monde'); });
  brancher('raid-retour-offense', () => { fermerPanneaux(); versEcran('offense'); });

  function fermerPanneaux() {
    arreterBoucle();
    // ⚠ ET LE CHROME REVIENT. C'est la porte d'ABANDON : « Carte », « Offense »,
    // « Ré-attaquer » et les deux boutons du rapport passent par ici, et
    // l'ouverture d'une cible aussi. Un chrome masqué qui ne revient pas laisse
    // le joueur enfermé dans un écran sans onglets.
    quitterLeDeroule();
    for (const id of ['raid-sim', 'raid-fin', 'raid-bandeau', 'raid-vitesses']) {
      const bloc = $(id);
      if (bloc !== null) bloc.hidden = true;
    }
  }

  /** Lance un raid — pour de bon, ou en simulation. */
  function lancer(simule) {
    if (etatCourant === null || cibleCourante === null) return;
    const problemes = problemesDuRaid(etatCourant, baseCourante(etatCourant), cibleCourante);
    if (problemes.length > 0) { avis(problemes.map((p) => p.message).join(' ; ')); return; }
    desarmer();
    simulation = simule;
    // ⚠ LE MONTAGE SE PREND AVANT, et par `montageDuRaid` : après le raid, le
    // site porte ses dégâts et le rejeu ne montrerait plus le combat qui a eu
    // lieu. Le recomposer ici en donnerait un second, voisin et non éprouvé.
    const site = siteDeLaCase(etatCourant, cibleCourante.rangee, cibleCourante.colonne);
    const montage = montageDuRaid(etatCourant, site);
    const { vagues } = composerLesVagues(etatCourant);
    rapportCourant = simule
      ? simulerRaid(etatCourant, baseCourante(etatCourant), cibleCourante)
      : executerRaid(etatCourant, baseCourante(etatCourant), cibleCourante);
    // ⚠ LE SON NE PART QUE SUR LA VRAIE ATTAQUE. Une simulation ne commande
    // rien à personne : la faire sonner comme un ordre ferait croire au joueur
    // qu'il vient d'engager son armée. Un bandeau couvre déjà la vue pour la
    // même raison.
    if (!simule) { sonDeGeste('attaque', {}); apresGeste(); }
    peindreVagues();
    // ⚠ UN BANDEAU « SIMULATEUR » COUVRE LA VUE PENDANT TOUT LE DÉROULÉ SIMULÉ,
    // pour qu'on ne le confonde jamais avec la vraie attaque.
    $('raid-bandeau').hidden = !simule;
    // ⚠ LE VRAI RAID SE REGARDE EN TEMPS RÉEL, SANS CONTRÔLE DE VITESSE — Ethan.
    // `dureeMaxCombatSec` vaut 90 : il ne peut pas durer plus d'une minute
    // trente, donc il n'y a pas de durée à gérer.
    $('raid-vitesses').hidden = !simule;
    vitesse = 1;
    // ⚠ AVANT `rejouer`, ET C'EST UNE QUESTION DE MESURE : masquer `#raid-bas`
    // agrandit le canevas, et `rejouer` appelle `dimensionner`. Dans l'autre
    // ordre, la première image serait projetée sur l'ancienne taille et le
    // `ResizeObserver` la referait aussitôt.
    entrerDansLeDeroule();
    rejouer(montage, vagues);
  }

  brancher('raid-attaquer', () => lancer(false));
  brancher('raid-simuler', () => lancer(true));
  brancher('raid-reattaquer', () => { fermerPanneaux(); lancer(false); });

  brancher('raid-sim-fermer', () => { $('raid-sim').hidden = true; });
  brancher('raid-fin-carte', () => { fermerPanneaux(); versEcran('monde'); });
  brancher('raid-fin-base', () => { fermerPanneaux(); versEcran('offense'); });

  // Les vitesses du simulateur, et le pas-à-pas.
  for (const v of VITESSES) {
    brancher(`raid-vitesse-${v}`, () => { vitesse = v; enPause = false; demarrerBoucle(); });
  }
  brancher('raid-pas', () => {
    if (combat === null || combat.termine) return;
    enPause = true;
    arreterBoucle();
    avancerDUnTick();
    dessiner();
    if (combat.termine) finDuDeroule();
  });
  brancher('raid-instantane', () => {
    if (combat === null) return;
    enPause = false;
    arreterBoucle();
    while (!combat.termine) tickCombat(combat);
    dessiner();
    finDuDeroule();
  });

  if (typeof doc.defaultView?.ResizeObserver === 'function' && canvas !== null) {
    new doc.defaultView.ResizeObserver(() => { dimensionner(); dessiner(); }).observe(canvas);
  }

  fermerPanneaux();

  return {
    /** Entre dans l'écran de raid sur une cible. */
    ouvrir(etat, cible, atlasFournis = null) {
      etatCourant = etat;
      cibleCourante = { rangee: cible.rangee, colonne: cible.colonne };
      if (atlasFournis !== null) atlas = atlasFournis;
      rapportCourant = null;
      combat = null;
      fondCourant = null;
      // ⚠ LA VUE SE REMET À NEUF À CHAQUE CIBLE. Garder le zoom et la bande de
      // la cible précédente ferait s'ouvrir un raid sur trois colonnes de la
      // défense d'une autre base — un état que le joueur n'a pas demandé et
      // qu'il ne peut pas relier à son geste.
      bandeCourante = 'batiments';
      coteVoulu = null;
      decalageX = 0;
      decalageY = 0;
      marquerBascule();
      fermerPanneaux();
      desarmer();
      peindreVagues();
      const site = siteDeLaCase(etat, cible.rangee, cible.colonne);
      // ⚠⚠ LE PRIX SE PREND DANS `vueDuRaid`, ET NULLE PART AILLEURS. C'est
      // elle qui appelle `coutDUnRaid`, une fois ; le libellé LIT ce qu'elle
      // rend. Rappeler le barème ici donnerait deux nombres qui peuvent
      // diverger — le motif de `ciblageOuvert` dans `ui/monde.js`.
      //
      // ⚠ ET LE PRIX NE BOUGE PAS TANT QU'ON RESTE SUR LA CIBLE : il est
      // fonction de la distance et du niveau du site, que ni une réparation ni
      // une activation ne changent. Il se peint donc à l'ouverture, comme le
      // titre, et pas à chaque image.
      armerLAttaque(vueDuRaid(etat, cibleCourante).cout);
      const titre = $('raid-titre');
      if (titre !== null && site !== null) {
        titre.textContent = `${site.type} · niveau ${site.niveau}`
          + ` · rangée ${site.rangee}, colonne ${site.colonne}`;
      }
      // ⚠ ON MONTRE LA CIBLE AVANT MÊME D'ATTAQUER : le montage courant, donc la
      // garnison RÉELLE et les bâtiments à leurs PV du jour. Aucune information
      // n'est cachée — arbitrage d'Ethan du 01/09.
      if (site !== null) {
        combat = creerCombat({ ...montageDuRaid(etat, site), vagues: [] });
        // ⚠⚠ LE PROPRIÉTAIRE SE LIT SUR LE MONTAGE, JAMAIS `'ouvrage'` EN DUR.
        // `sim/raid-ouvrage.js` monte des combats où la défense appartient au
        // JOUEUR ; l'écrire en dur passerait le test d'aujourd'hui et donnerait
        // un décor de l'Ouvrage à la base du joueur le jour où cet écran-là
        // s'ouvrira. Même leçon que `pointsRecherche` au lot MODULES-E, et que
        // le camp du mur au lot MURS-OUVRAGE.
        //
        // ⚠ ET CE JOUR-LÀ, LA CASE À PASSER SERA `fondation`, PAS LA CIBLE :
        // c'est elle qui identifie une base du joueur, comme sur l'écran de la
        // base. Ici la cible EST le site, qui ne se déplace pas.
        fondCourant = fondDeLaBase(
          combat.proprietaireDefense, site.type, site.rangee, site.colonne,
        );
        precedentes = prendrePositions(combat);
        dimensionner();
        dessiner();
      }
    },
    peindre(etat) { etatCourant = etat; peindreVagues(); },
    // ⚠ QUITTER L'ÉCRAN REND LE CHROME. Sans cette ligne, changer d'onglet
    // pendant un déroulé laisserait la page sans onglets — donc sans moyen d'en
    // revenir. Troisième porte, la même fonction idempotente.
    masquer() { arreterBoucle(); quitterLeDeroule(); },
    /**
     * Les unités attaquantes et leur état de mouvement — pour le son.
     *
     * ⚠⚠ C'EST UNE LECTURE, PAS UN ÉVÉNEMENT, ET LA NUANCE EST TOUTE LA GARDE
     * `SON T14`. Le moteur ne publie rien et n'a pas bougé d'une ligne : on
     * compare les deux instantanés que cet écran prend DÉJÀ pour son
     * interpolation. Le calcul lui-même vit dans `src/son/cablage.js`, qui est
     * pur ; ici il n'y a qu'un accès aux deux variables locales.
     */
    unitesDuCombat() { return etatDesUnites(combat, precedentes); },
    /**
     * Ce que le déroulé a publié depuis le dernier appel — et il VIDE.
     *
     * ⚠ IL VIDE, PARCE QU'UN COUP NE SE REJOUE PAS. Une ambiance se réconcilie
     * — on la redemande tant qu'elle est vraie ; un tir est un fait, il a lieu
     * une fois. Ne pas vider referait sonner le même coup dix fois par seconde
     * jusqu'à la fin du combat.
     */
    evenementsSonores() {
      const sortie = [...evenementsSonores].sort();
      evenementsSonores.clear();
      return sortie;
    },
    /** La mesure M2 : le coût moyen d'une image du déroulé. */
    mesureImages() {
      return { images: mesure.images, moyenneMs: mesure.images === 0 ? 0 : mesure.totalMs / mesure.images };
    },
  };
}
