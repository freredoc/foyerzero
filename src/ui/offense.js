// L'écran Offense — les quatre vagues d'un raid, et ce que le joueur y pose.
//
// ⚠ CE FICHIER DISAIT « C'EST UNE COQUILLE » JUSQU'AU 28/08, ET CE N'EN EST
// PLUS UNE. L'en-tête qu'il portait expliquait longuement pourquoi l'écran
// était vide : `sim/state.js` n'écrivait que `position`, `fondation`,
// `disposition` et `economie`, si bien que `ui/arsenal.js` était un ÉDITEUR
// dont la sortie n'allait nulle part. Composer une armée aurait demandé
// d'inventer la forme de cet état. Elle est arbitrée depuis le lot
// GARNISON-ET-ARMÉE : l'état porte `armee`, l'écran y lit et y écrit.
//
// ⚠ LES RÈGLES DE COMPOSITION NE SONT PAS ICI. Budget, niveau d'apparition,
// occupation d'une case : tout vit dans `ui/arsenal.js`, qui est pur et testé
// depuis le lot 5A. Cet écran l'INTERROGE. Une seconde table de règles, écrite
// pour la commodité d'un rendu, finirait par dire autre chose que la première —
// et la divergence se lirait comme un déséquilibre de jeu, pas comme un défaut.
//
// ⚠ RIEN N'EST ÉCRIT EN DUR ICI NON PLUS. Le nombre de vagues et de colonnes
// vient d'`EMPLACEMENTS_ASSAUT` via `ui/arsenal.js`, qui les lit déjà ;
// l'intervalle entre deux vagues vient de `GRILLE`. Une seconde table dirait un
// jour autre chose que la première.
//
// ⚠ LE GESTE EST CELUI DU CHANTIER, ET LES MOTS AUSSI. Deux touchers pour
// poser — le premier montre, le second engage — et les phrases viennent de
// `ui/chantier.js`, où elles sont déjà écrites et testées. Les reformuler ici
// donnerait au joueur deux vocabulaires pour un seul geste.

import { GRILLE, ORDRE_CHASSIS, UNITES } from '../data/combat.js';
import {
  NB_VAGUES, NB_COLONNES, NB_EMPLACEMENTS, budgetDuNiveau,
  messageSansBatiment, raisonDuVerrou,
} from './arsenal.js';
import { BASE_BATIMENTS } from '../data/base.js';
import {
  pointsEngages, niveauDeCommandement, batimentDeProductionManquant,
  poserEffectif, retirerEffectif, deplacerEffectif,
  problemesDeLaPoseDEffectif, problemesDuDeplacementDEffectif,
  problemesDeLAmeliorationDEffectif, ameliorerEffectif,
} from '../sim/state.js';
import { acquisesDe } from '../sim/recherche.js';
import { niveauDeLArmee } from '../sim/niveau-de-base.js';
// ⚠⚠ LE MÊME POINT D'ENTRÉE QUE LA GRILLE DU CHANTIER ET QUE LE CHAMP DE
// BATAILLE. `couchesDeLEntite` est LE dispatch des couches de sprite depuis le
// lot STRUCTURES-AU-COMBAT ; en dériver ici un nom d'unité de plus aurait fait
// une quatrième vérité sur ce qu'est un Fusilier, et c'est exactement ce que ce
// dispatch existe pour empêcher.
//
// ⚠ ET `poserCouches` EST IMPORTÉ, PAS RECOPIÉ. Il porte l'inversion d'ordre
// entre le canevas et `background-image` — la dernière couche est au-dessus sur
// l'un, la première sur l'autre. Une seconde écriture qui l'oublierait mettrait
// le socle par-dessus la tourelle sur cet écran-ci et pas sur l'autre, sans
// qu'aucun nom soit faux. Ce fichier importe déjà de `chantier.js`.
import { couchesDeLEntite } from '../render/scene.js';
import {
  formaterEntier, ligneAAfficher, messageDeRefus, actionSansMoteur,
  messageDePose, messageDeConfirmation,
  messagePasDeReparation, DUREE_TOAST_MS, poserCouches,
} from './chantier.js';
import { baseCourante } from '../sim/base-courante.js';

/**
 * Le titre d'une vague, et le retard avec lequel elle part.
 *
 * La première vague part à l'instant zéro ; chaque suivante part
 * `GRILLE.intervalleVagueSec` plus tard que la précédente. Le retard s'affiche
 * sur le titre, parce que c'est la seule chose qui distingue les quatre rangées
 * les unes des autres.
 *
 * ⚠ L'INTERVALLE EST LU, PAS RECOPIÉ D'UNE CAPTURE. La capture de référence
 * fournie avec l'amendement affiche « +10 s » ; `GRILLE.intervalleVagueSec` vaut
 * **5**. C'est un autre jeu, et c'est la table du dépôt qui fait foi.
 *
 * @param {number} numero 1…NB_VAGUES
 * @returns {{numero: number, titre: string, decalageSec: number}}
 */
export function vagueDAssaut(numero) {
  if (!Number.isInteger(numero) || numero < 1 || numero > NB_VAGUES) {
    throw new RangeError(`offense : vague ${numero} hors de 1…${NB_VAGUES}`);
  }
  const decalageSec = (numero - 1) * GRILLE.intervalleVagueSec;
  return {
    numero,
    decalageSec,
    titre: decalageSec === 0
      ? `Vague d'attaque ${numero}`
      : `Vague d'attaque ${numero} (+${decalageSec} s)`,
  };
}

/** Les quatre vagues, dans l'ordre où elles partent. */
export function vaguesDAssaut() {
  return Array.from({ length: NB_VAGUES }, (_, i) => vagueDAssaut(i + 1));
}

/**
 * Ce que dit l'écran quand le Centre de commandement n'est pas posé.
 *
 * ⚠ CE N'EST PAS UN REFUS, C'EST UNE EXPLICATION. Le bâtiment est `unique` et
 * n'est pas dans la base neuve : tant qu'il n'est pas là, il n'y a pas de
 * budget d'armée — donc rien à composer. Dire « impossible » sans dire pourquoi
 * ferait chercher au joueur une faute qu'il n'a pas commise.
 */
export const SANS_COMMANDEMENT = 'Aucun Centre de commandement posé :'
  + ' il n\'y a pas encore de budget d\'armée. Posez-en un sur le Chantier.';

/**
 * Ce que l'écran dit quand l'armée coûte plus que le budget ne paie.
 *
 * ⚠⚠ ON SIGNALE, ON N'AMPUTE PAS — ET C'EST LA DÉCISION QUE LE BRIEF DEMANDAIT
 * DE PRENDRE. `purger` existe dans les deux éditeurs depuis le lot 5 ; ce lot
 * décide qu'elle ne s'applique JAMAIS toute seule. C'est CLAUDE.md §4 appliqué :
 * « quand le contexte bouge sous une composition déjà faite — niveau descendu,
 * obstacle apparu — on le SIGNALE dans le bilan et on propose de purger. Jamais
 * d'amputation automatique. »
 *
 * Le cas arrive pour de bon : le budget BAISSE quand le Centre de commandement
 * est démoli, ou tombe au raid, sous une armée déjà posée. Retirer d'office les
 * unités qui dépassent ferait disparaître, sans un mot, ce que le joueur avait
 * composé — et il ne saurait même pas laquelle est partie.
 *
 * @param {number} engages
 * @param {number} budget
 * @returns {string}
 */
export function messageDeDepassement(engages, budget) {
  return `${formaterEntier(engages)} points engagés pour un budget de `
    + `${formaterEntier(budget)} : retirez des unités, ou améliorez le Centre `
    + 'de commandement. Rien n\'est retiré tout seul.';
}

/**
 * Ce que dit la ligne de mode quand une unité posée est « en main ».
 * @param {string} nom nom joueur de l'unité
 * @returns {string}
 */
export function messageEnMain(nom) {
  return `${nom} en main : touchez un emplacement libre pour le déplacer,`
    + ' ou le même une seconde fois pour le retirer.';
}

/**
 * Le roster ENTIER, chaque unité avec la raison qui l'empêche — ou aucune.
 *
 * ⚠⚠ ELLE GRISE, ELLE NE FILTRE PLUS, ET C'EST UN CHANGEMENT DE DÉCISION.
 * Jusqu'au 29/08 cette palette RETIRAIT ce que le niveau verrouillait, au motif
 * qu'« une unité qu'on ne peut pas construire n'a pas à occuper l'écran » (lot
 * 5A). Ethan a rapporté le 29/08 que deux unités étaient « indisponibles »
 * alors qu'il les attendait : une palette qui CACHE ne peut pas répondre à ça.
 * Elle montre donc tout, éteint ce qui ne se construit pas, et DIT pourquoi au
 * toucher. Trois gains, et aucun n'est cosmétique :
 *   — le joueur voit ce qui existe et ce qu'il lui manque pour l'avoir ;
 *   — la règle du bâtiment de production s'apprend au lieu de se deviner ;
 *   — la palette garde une LONGUEUR FIXE, si bien que les vignettes ne se
 *     déplacent plus sous le doigt entre deux gestes. C'est exactement
 *     l'argument qui avait fait griser les uniques du Chantier le 28/08 ; les
 *     deux palettes se comportent enfin pareil.
 *
 * ⚠ TROIS RAISONS, DANS CET ORDRE, ET L'ORDRE COMPTE. Pas de Centre de
 * commandement d'abord — sans lui il n'y a pas de niveau du tout, et parler
 * d'un seuil serait parler d'un nombre qui n'existe pas. Puis le niveau
 * d'apparition. Puis le bâtiment de production. Le joueur lit ce qui le bloque
 * MAINTENANT, pas la liste de tout ce qui le bloquera.
 *
 * ⚠ `nom.joueur`, JAMAIS `nom.ouvrage`. C'est un panneau du joueur : il y emploie
 * le vocabulaire d'une armée régulière (CLAUDE.md §4).
 *
 * ⚠⚠ ET ELLE SORT GROUPÉE PAR CHÂSSIS — Ethan, 03/09 : « ui armée : une barre :
 * d'abord l'infanterie puis véhicule et avion ». Le rang vient de
 * `ORDRE_CHASSIS`, la clé de `UNITES[x].chassis`, et le tri est STABLE : à
 * l'intérieur d'un groupe c'est l'ordre du roster qui fait foi, Ethan n'ayant
 * donné l'ordre que des trois châssis. Un `sort` sur une clé numérique est
 * stable en JS depuis ES2019, donc `map` puis `sort` suffit — pas besoin de
 * porter l'indice.
 *
 * ⚠ ET LE TRI EST L'IDENTITÉ AUJOURD'HUI, MESURÉ : `UNITES` est déjà écrite
 * dans cet ordre-là. Il ne bouge donc rien à l'écran ; ce qu'il change, c'est
 * qu'une quinzième unité insérée au mauvais rang ne casse plus le groupement.
 *
 * @param {object} etat état de jeu
 * @returns {Array<{id: string, nom: string, points: number,
 *   disponible: boolean, raison: string|null}>}
 */
export function unitesDeLaPalette(etat) {
  const niveau = niveauDeCommandement(etat, 'armee');
  const ouvertes = acquisesDe(etat, 'offense');
  const rangDuChassis = (id) => {
    const rang = ORDRE_CHASSIS.indexOf(UNITES[id].chassis);
    // ⚠ UN CHÂSSIS HORS TABLE LÈVE, IL NE SE RANGE PAS EN FIN DE LISTE. `-1`
    // le mettrait EN TÊTE, donc devant l'infanterie : la palette mentirait sur
    // l'ordre qu'Ethan a demandé, et rien ne le dirait.
    if (rang < 0) throw new Error(`châssis inconnu de l'ordre de palette : ${UNITES[id].chassis}`);
    return rang;
  };
  return Object.keys(UNITES).sort((a, b) => rangDuChassis(a) - rangDuChassis(b)).map((id) => {
    const unite = UNITES[id];
    // ⚠ LE VERROU SE DEMANDE À L'ARSENAL, IL NE SE RELIT PAS ICI. Ni
    // `apparition` (qui n'ouvre plus rien depuis le lot RECHERCHE) ni la liste
    // des acquises n'apparaissent en clair dans ce fichier, et un test le
    // balaie : une seconde lecture de la règle finirait par dire autre chose que
    // la première, et la divergence se lirait comme un déséquilibre de jeu.
    let raison = raisonDuVerrou(id, niveau, ouvertes);
    if (raison === null) {
      const manque = batimentDeProductionManquant(etat, id);
      if (manque !== null) {
        raison = messageSansBatiment(BASE_BATIMENTS[manque].nom.joueur, unite.chassis);
      }
    }
    return {
      id,
      nom: unite.nom.joueur,
      points: unite.points,
      disponible: raison === null,
      raison,
    };
  });
}

/**
 * Ce que la ligne d'avis dit quand on touche une vignette éteinte.
 * @param {{nom: string, raison: string}} unite
 * @returns {string}
 */
export function messageIndisponible(unite) {
  return `${unite.nom} — ${unite.raison}.`;
}

/**
 * Les quatre actions de la barre contextuelle de l'Offense.
 *
 * ⚠⚠ ELLE N'EXISTAIT PAS, ET C'EST LE RAPPORT D'ETHAN DU 29/08 : « on ne peut
 * pas supprimer une unité en cliquant dessus. D'ailleurs les boutons réparer,
 * améliorer etc. n'apparaissent pas dans le menu offense. » L'écran retirait
 * bien une unité — mais en DEUX touchers implicites, sans qu'aucun bouton ne le
 * dise. Le modèle « armer puis toucher » du Chantier est repris tel quel, avec
 * les mêmes quatre règles : retoucher l'action armée la désarme, armer une
 * action désarme l'autre, armer défait la palette, et toucher une case vide
 * désarme sans rien dire.
 *
 * ⚠ `agir: null` N'EST PAS UN OUBLI. Réparer et Améliorer n'ont pas de moteur
 * pour une unité — le COÛT d'une amélioration existe depuis le 28/08
 * (`data/couts-militaires.js`), la MÉCANIQUE non : ce que gagne une unité
 * améliorée n'est pas arbitré. Le bouton s'arme quand même et répond, parce
 * qu'« un indice n'est pas une interdiction » (CLAUDE.md §4).
 *
 * ⚠ ET « RETIRER », PAS « DÉMOLIR ». On ne démolit pas des Fusiliers. Le
 * Chantier garde « Démolir » pour ses bâtiments ; les libellés sont ici parce
 * que c'est ici qu'on parle d'unités.
 */
export const MESSAGES_MODE_ARMEE = {
  reparer: 'Mode RÉPARER : touchez l\'unité à réparer. Retouchez le bouton pour annuler.',
  ameliorer: 'Mode AMÉLIORER : touchez l\'unité à améliorer. Retouchez le bouton pour annuler.',
  deplacer: 'Mode DÉPLACER : touchez l\'unité à déplacer. Retouchez le bouton pour annuler.',
  retirer: 'Mode RETIRER : touchez l\'unité à retirer. Retouchez le bouton pour annuler.',
};

/**
 * Ce que dit la ligne de mode quand une unité est en main, attendant sa case.
 * @param {string} nom nom joueur de l'unité
 * @returns {string}
 */
export function messageDeDestinationDUnite(nom) {
  return `Déplacement de ${nom} : touchez l'emplacement d'arrivée.`
    + ' Retouchez le bouton pour annuler.';
}

export const ACTIONS_ARMEE = {
  reparer: { bouton: 'offense-reparer', libelle: 'Réparer', agir: null },
  // ⚠⚠ AMÉLIORER A UN MOTEUR DEPUIS LE 03/09, ET LE `null` QUI TENAIT ICI EST
  // PARTI AVEC. Il disait vrai : le COÛT existait depuis le 28/08 et rien dans
  // `sim/` ne montait une pièce d'un niveau, si bien que `poserEffectif`
  // écrivait `niveau: 1` et que personne ne pouvait le relever. Ethan a arbitré
  // le geste le 03/09 — la pièce se monte une par une, comme un bâtiment.
  //
  // ⚠ ET IL N'A PAS DE CHAMP `cible`. Améliorer désigne la pièce qu'on touche,
  // en UN toucher, exactement comme au Chantier ; seul `deplacer` en demande
  // deux, et c'est son champ `cible` qui le dit, pas son nom.
  ameliorer: {
    bouton: 'offense-ameliorer',
    libelle: 'Améliorer',
    problemes: (etat, index) => problemesDeLAmeliorationDEffectif(etat, 'armee', index),
    agir: (etat, index) => ameliorerEffectif(etat, 'armee', index),
  },
  deplacer: {
    bouton: 'offense-deplacer',
    libelle: 'Déplacer',
    cible: true,
    problemes: (etat, index, position) => problemesDuDeplacementDEffectif(
      etat, 'armee', index, position,
    ),
    agir: (etat, index, position) => deplacerEffectif(etat, 'armee', index, position),
  },
  retirer: {
    bouton: 'offense-retirer',
    libelle: 'Retirer',
    // ⚠ LA TABLE DIT QUE CETTE ACTION FAIT DISPARAÎTRE SA CIBLE. `appliquerAction`
    // lâchait la sélection APRÈS N'IMPORTE QUELLE action ; c'était sans effet
    // tant que « Retirer » était la seule à en avoir une, et faux dès
    // qu'« Améliorer » en a gagné une — le joueur perdait son unité de vue au
    // moment précis où il venait de la monter d'un niveau.
    retireLaPiece: true,
    problemes: () => [],
    agir: (etat, index) => retirerEffectif(etat, 'armee', index),
  },
};

/**
 * Tout ce que l'écran Offense affiche, calculé depuis l'état seul.
 *
 * ⚠ FONCTION PURE, DONC FONCTION TESTÉE. Le dépôt n'a ni jsdom ni navigateur :
 * ce qui peut être vérifié sans écran doit l'être, et ce qui ne le peut pas se
 * déclare non exécuté.
 *
 * @param {object} etat état de jeu de `sim/state.js`
 * @returns {{
 *   niveau: number|null, niveauArmee: number|null,
 *   engages: number, budget: number|null,
 *   vagues: Array<Array<null|{index: number, id: string, nom: string, niveau: number}>>,
 *   palette: Array<object>, avis: string
 * }}
 */
/**
 * Les couches de sprite d'une unité du joueur, à l'assaut.
 *
 * ⚠⚠ ELLE EXISTE POUR QUE LE DESCRIPTEUR NE SOIT ÉCRIT QU'UNE FOIS. Deux
 * endroits en ont besoin — les trente-six emplacements et les quatorze
 * vignettes de la palette — et les quatre champs qu'il porte ne sont pas
 * anodins : `proprietaire` décide de la LETTRE du nom de sprite (`off_j_…`) et
 * `camp` décide de la POSE. Les recopier des deux côtés, c'est se donner deux
 * occasions d'écrire `garnison` là où il faut `attaque`, et la faute se lirait
 * comme un blindé couché sur le flanc dans l'éditeur d'assaut.
 *
 * ⚠ `camp: 'attaque'` PARCE QUE C'EST UN ÉCRAN D'ASSAUT. `forceDuCamp` de
 * `render/scene.js` en tire la force `armee`, donc la pose de marche ; la même
 * unité en garnison prendrait `_def`, chenilles à l'horizontale. C'est bien la
 * FORCE qui décide, pas le propriétaire — CLAUDE.md §4.
 *
 * ⚠ ET LA TOURELLE D'UN BLINDÉ RETOMBE SUR SON ORIENTATION PAR DÉFAUT, faute de
 * cible : il n'y a rien à viser dans un éditeur. `couchesDeLEntite` s'en charge,
 * on ne lui passe pas de contexte.
 *
 * @param {string} id identifiant d'unité
 * @returns {{famille: string, nom: string}[]} du plus BAS au plus haut
 */
export function couchesDeLUniteDAssaut(id) {
  return couchesDeLEntite({
    genre: 'unite', id, proprietaire: 'joueur', camp: 'attaque',
  });
}

export function vueDeLOffense(etat) {
  // ⚠ L'ENVELOPPE SE VÉRIFIE AVANT D'ÊTRE DÉRÉFÉRENCÉE — lot BASES-0, même
  // leçon que `resumeDeLaBase` : `baseCourante(null)` lève un message qui parle
  // de `bases`, quand l'appelant a passé `null`.
  if (!etat || !Array.isArray(etat.bases) || !Array.isArray(baseCourante(etat).armee)) {
    throw new TypeError('offense : état de jeu absent ou malformé');
  }
  const laBase = baseCourante(etat);
  const niveau = niveauDeCommandement(etat, 'armee');

  // Les quatre vagues, pleines de `null` puis remplies : une case vide garde sa
  // place. Une vague vide ne doit pas décaler la suivante — son rang décide de
  // l'instant où elle entre en jeu.
  const vagues = Array.from({ length: NB_VAGUES }, () => Array.from(
    { length: NB_COLONNES }, () => null,
  ));
  laBase.armee.forEach((piece, index) => {
    vagues[piece.vague - 1][piece.colonne - 1] = {
      index,
      id: piece.id,
      nom: UNITES[piece.id].nom.joueur,
      niveau: piece.niveau,
      degatsMilli: piece.degatsMilli,
    };
  });

  const engages = pointsEngages(etat, 'armee');
  const budget = niveau === null ? null : budgetDuNiveau(niveau);
  // ⚠ LE DÉPASSEMENT EST UN ÉTAT NORMAL, PAS UNE FAUTE. `verifierEtat` le laisse
  // passer exprès — refuser le chargement rendrait la partie injouable pour une
  // baisse de budget que le joueur n'a pas provoquée. Il se SIGNALE ici.
  const depasse = budget !== null && engages > budget;

  return {
    niveau,
    niveauArmee: niveauDeLArmee(laBase.armee),
    engages,
    budget,
    depasse,
    vagues,
    palette: unitesDeLaPalette(etat),
    avis: avisDeLOffense(niveau, engages, budget, depasse),
  };
}

/** La phrase qui explique l'état du budget, ou rien s'il n'y a rien à dire. */
function avisDeLOffense(niveau, engages, budget, depasse) {
  if (niveau === null) return SANS_COMMANDEMENT;
  if (depasse) return messageDeDepassement(engages, budget);
  return '';
}

/**
 * Câble l'écran Offense dans une page qui porte le balisage attendu.
 *
 * @param {Document} doc
 * @param {{apresPose?: Function}} crochets — `apresPose` sauvegarde tout de
 *   suite : composer son armée est une action que le joueur ne veut pas
 *   refaire parce que le système a tué l'application.
 * @returns {{peindre: Function, rafraichir: Function, nbEmplacements: number}}
 */
export function initialiserEcranOffense(doc, { apresPose } = {}) {
  const $ = (id) => doc.getElementById(id);
  const corps = $('offense-vagues');
  const palette = $('offense-palette');
  const fenetre = doc.defaultView;

  let etatCourant = null;
  // L'unité choisie à la palette, ou null. Exclusif avec `enMain` : un seul
  // mode à la fois, sinon un toucher voudrait dire deux choses.
  let choisie = null;
  // L'emplacement où l'unité choisie est en APERÇU — premier des deux touchers.
  let apercu = null;
  // L'indice, dans `etat.armee`, de l'unité en main pendant un déplacement.
  let enMain = null;
  // L'action armée, ou null. Exclusive avec `choisie` : un seul mode à la fois.
  let actionArmee = null;
  // L'unité SÉLECTIONNÉE — celle dont la barre contextuelle parle. Elle n'arme
  // rien : c'est le bouton qu'on touche ensuite qui décide de ce qu'on en fait.
  let selection = null;
  let minuterieToast = null;
  // ⚠ `session` RESTE VIDE ICI, et ce n'est pas un oubli : les messages de
  // session — sauvegarde impossible, sauvegarde illisible — appartiennent à la
  // ligne du Chantier, qui a un propriétaire unique depuis le lot
  // PANNEAU-ET-MARGES. Le champ est gardé pour que `ligneAAfficher` soit
  // interrogée avec la même forme des deux côtés.
  const registres = { session: '', toast: '', mode: '' };
  const cellules = new Map(); // « vague:colonne » → élément
  const vignettes = new Map(); // id → bouton

  const cle = (vague, colonne) => `${vague}:${colonne}`;

  function rendreLigne() {
    const { texte, ton } = ligneAAfficher(registres);
    const ligne = $('offense-avis');
    ligne.textContent = texte;
    ligne.hidden = texte === '';
    ligne.classList.toggle('mode', ton === 'mode');
  }

  /** Un message qui répond à un geste, et qui s'efface tout seul. */
  function toast(texte) {
    if (minuterieToast !== null) {
      fenetre.clearTimeout(minuterieToast);
      minuterieToast = null;
    }
    registres.toast = texte;
    rendreLigne();
    if (texte === '') return;
    minuterieToast = fenetre.setTimeout(() => {
      minuterieToast = null;
      // Il ne s'efface que s'il est encore le sien : entre l'affichage et
      // l'échéance, un autre refus a pu s'écrire.
      if (registres.toast !== texte) return;
      registres.toast = '';
      rendreLigne();
    }, DUREE_TOAST_MS);
  }

  function ligneDeMode(texte) {
    registres.mode = texte;
    rendreLigne();
  }

  // --- les quatre vagues, construites une fois ------------------------------
  //
  // Elles ne changent jamais de place, seul leur contenu bouge : reconstruire
  // le balisage à chaque image ferait perdre l'aperçu et le défilement.
  corps.textContent = '';
  for (const vague of vaguesDAssaut()) {
    const bloc = doc.createElement('section');
    bloc.className = 'vague';
    const titre = doc.createElement('h2');
    titre.textContent = vague.titre;
    bloc.appendChild(titre);

    const rangee = doc.createElement('div');
    rangee.className = 'emplacements';
    // ⚠⚠ EN QUINCONCE — Ethan, 03/09 : « toujours 4 rangées de 9, mais les neuf
    // tu les mets en quinconce pour que ça passe ». Une rangée sur deux est
    // décalée d'une DEMI-case, et le décalage se fait par la GRILLE : on pose
    // deux fois plus de colonnes, plus une, chaque emplacement en occupant
    // deux. Un `transform: translateX` aurait déplacé le dessin sans déplacer
    // la géométrie du pointage — la faute que le dépôt refuse depuis toujours
    // sur la grille du Chantier.
    if (vague.numero % 2 === 0) rangee.classList.add('decalee');
    rangee.style.gridTemplateColumns = `repeat(${NB_COLONNES * 2 + 1}, 1fr)`;
    for (let colonne = 1; colonne <= NB_COLONNES; colonne++) {
      const emplacement = doc.createElement('div');
      emplacement.className = 'emplacement';
      emplacement.dataset.vague = String(vague.numero);
      emplacement.dataset.colonne = String(colonne);
      cellules.set(cle(vague.numero, colonne), emplacement);
      rangee.appendChild(emplacement);
    }
    bloc.appendChild(rangee);
    corps.appendChild(bloc);
  }

  /** Défait tous les modes — après une pose, un retrait, ou un geste à côté. */
  function desarmer() {
    choisie = null;
    apercu = null;
    actionArmee = null;
    enMain = null;
    ligneDeMode('');
    marquerBoutonsAction();
  }

  /** Le bouton d'une action armée s'allume ; les autres s'éteignent. */
  function marquerBoutonsAction() {
    for (const [nom, action] of Object.entries(ACTIONS_ARMEE)) {
      $(action.bouton).classList.toggle('arme', actionArmee === nom);
    }
  }

  /**
   * Arme ou désarme une action.
   *
   * Les quatre règles du Chantier, reprises telles quelles : retoucher l'action
   * armée la désarme ; armer une action désarme l'autre ; armer défait la
   * palette — un seul mode à la fois ; et l'action se désarme dans tous les cas
   * après un toucher, réussite comme refus.
   */
  function armer(nom) {
    const suivant = actionArmee === nom ? null : nom;
    actionArmee = suivant;
    choisie = null;
    apercu = null;
    enMain = null;
    // ⚠ PAS DE REPLI SUR UN AUTRE MESSAGE. Une première écriture reprenait
    // `MESSAGES_MODE` du Chantier avec un `??` de secours : « Retirer » n'y a
    // pas de clé, et le bouton annonçait « Mode DÉPLACER : touchez le BÂTIMENT
    // à déplacer ». Vu en essayant l'écran, pas en le relisant. Une table qui
    // ne couvre pas ses actions doit LEVER — et un test asserte que les deux
    // jeux de clés sont les mêmes.
    ligneDeMode(suivant === null ? '' : MESSAGES_MODE_ARMEE[suivant]);
    marquerBoutonsAction();
    peindre(etatCourant);
  }

  function choisirUnite(id) {
    // Retoucher la vignette choisie l'annule, comme au Chantier.
    if (choisie === id) {
      desarmer();
      peindre(etatCourant);
      return;
    }
    choisie = id;
    apercu = null;
    actionArmee = null;
    enMain = null;
    marquerBoutonsAction();
    ligneDeMode(messageDePose(UNITES[id].nom.joueur));
    peindre(etatCourant);
  }

  /**
   * Le second toucher d'une pose : celui qui engage.
   *
   * ⚠ ON DEMANDE, PUIS ON POSE — ET JAMAIS DE `try` AUTOUR DE `poserEffectif`.
   * `problemesDeLaPoseDEffectif` rend une LISTE, `poserEffectif` LÈVE, et la
   * différence est la règle du dépôt : une pose refusée est un fait de JEU
   * qu'on montre au joueur, une levée est un fait de PROGRAMME. Rattraper la
   * levée traiterait la seconde comme la première.
   */
  function poserIci(vague, colonne) {
    const piece = { id: choisie, vague, colonne, niveau: 1 };
    const problemes = problemesDeLaPoseDEffectif(etatCourant, 'armee', piece);
    if (problemes.length > 0) {
      toast(messageDeRefus(problemes));
      desarmer();
      peindre(etatCourant);
      return;
    }
    // ⚠ LE BUDGET ET LE BÂTIMENT DE PRODUCTION SONT DEMANDÉS À PART, PARCE
    // QU'AUCUN DES DEUX N'EST DANS `problemesDeLEffectif`. Les deux peuvent
    // devenir faux SOUS une armée déjà posée — le QG démoli, la Caserne rasée —
    // et `verifierEtat` les laisse passer exprès. C'est donc ici, au geste,
    // qu'on les oppose au joueur.
    const indisponible = unitesDeLaPalette(etatCourant).find((u) => u.id === choisie);
    if (!indisponible.disponible) {
      toast(messageIndisponible(indisponible));
      desarmer();
      peindre(etatCourant);
      return;
    }
    const budget = budgetDuNiveau(niveauDeCommandement(etatCourant, 'armee'));
    const apres = pointsEngages(etatCourant, 'armee') + UNITES[choisie].points;
    if (apres > budget) {
      toast(`${formaterEntier(apres)} points dépasseraient le budget`
        + ` de ${formaterEntier(budget)}`);
      desarmer();
      peindre(etatCourant);
      return;
    }
    poserEffectif(etatCourant, 'armee', piece);
    desarmer();
    peindre(etatCourant);
    if (apresPose) apresPose();
  }

  /**
   * Une action armée s'applique à l'unité touchée.
   *
   * ⚠ `agir: null` RÉPOND, IL NE RESTE PAS MUET. Réparer et Améliorer n'ont pas
   * de moteur pour une unité ; le bouton s'arme, on touche, et l'écran dit ce
   * qui manque. Un bouton inerte n'apprendrait rien.
   */
  function appliquerAction(index) {
    const nom = actionArmee;
    const action = ACTIONS_ARMEE[nom];
    // Quoi qu'il arrive, le mode se désarme : réussite comme refus.
    actionArmee = null;
    ligneDeMode('');
    marquerBoutonsAction();

    if (action.agir === null) {
      // ⚠ « L'ARMÉE », PAS « LA DÉFENSE » — et « unité », pas « bâtiment ». Les
      // deux messages disaient l'un et l'autre en dur, ce qui allait tant que
      // la barre contextuelle n'existait qu'au Chantier. Vu en essayant cet
      // écran-ci, pas en le relisant.
      toast(nom === 'reparer'
        ? messagePasDeReparation('aucune unité n\'est endommagée')
        : actionSansMoteur(action.libelle, 'l\'armée'));
      peindre(etatCourant);
      return;
    }
    if (action.cible === true) {
      // Deux touchers : celui-ci prend la pièce en main, le suivant l'emmène.
      enMain = index;
      ligneDeMode(messageDeDestinationDUnite(UNITES[baseCourante(etatCourant).armee[index].id].nom.joueur));
      peindre(etatCourant);
      return;
    }
    const problemes = action.problemes(etatCourant, index);
    if (problemes.length > 0) {
      toast(messageDeRefus(problemes));
      peindre(etatCourant);
      return;
    }
    action.agir(etatCourant, index);
    selection = action.retireLaPiece === true ? null : index;
    peindre(etatCourant);
    if (apresPose) apresPose();
  }

  /** Le second toucher d'un déplacement. */
  function deposerLaPieceEnMain(vague, colonne) {
    const index = enMain;
    const action = ACTIONS_ARMEE.deplacer;
    enMain = null;
    ligneDeMode('');
    const problemes = action.problemes(etatCourant, index, { vague, colonne });
    if (problemes.length > 0) {
      toast(messageDeRefus(problemes));
      peindre(etatCourant);
      return;
    }
    // ⚠ DÉPLACER NE COÛTE RIEN — Ethan, 28/08 : « déplacement gratuit, comme
    // bâtiment ». Le budget ne bouge pas : la même unité change de case.
    action.agir(etatCourant, index, { vague, colonne });
    peindre(etatCourant);
    if (apresPose) apresPose();
  }

  corps.addEventListener('click', (evenement) => {
    const emplacement = evenement.target.closest('.emplacement');
    if (emplacement === null || etatCourant === null) return;
    const vague = Number(emplacement.dataset.vague);
    const colonne = Number(emplacement.dataset.colonne);
    const occupant = baseCourante(etatCourant).armee.findIndex(
      (p) => p.vague === vague && p.colonne === colonne,
    );

    // Une pièce en main cherche sa destination : c'est le second temps du
    // déplacement, et il passe avant tout le reste.
    if (enMain !== null) {
      deposerLaPieceEnMain(vague, colonne);
      return;
    }

    if (choisie !== null) {
      // Premier toucher : on MONTRE. Second sur la même case : on pose.
      if (apercu !== null && apercu.vague === vague && apercu.colonne === colonne) {
        poserIci(vague, colonne);
        return;
      }
      if (occupant !== -1) {
        toast('cet emplacement est déjà occupé');
        return;
      }
      apercu = { vague, colonne };
      ligneDeMode(messageDeConfirmation(UNITES[choisie].nom.joueur));
      peindre(etatCourant);
      return;
    }

    // Toucher une case VIDE désarme, sans rien dire : c'est le geste « à côté
    // du menu », pas une erreur.
    if (occupant === -1) {
      selection = null;
      desarmer();
      peindre(etatCourant);
      return;
    }

    // Une action armée s'applique. Sinon, le toucher SÉLECTIONNE : la barre
    // contextuelle dit alors sur quoi ses quatre boutons agiront.
    if (actionArmee !== null) {
      selection = occupant;
      appliquerAction(occupant);
      return;
    }
    selection = occupant;
    peindre(etatCourant);
  });

  palette.addEventListener('click', (evenement) => {
    const bouton = evenement.target.closest('.unite');
    if (bouton === null || etatCourant === null) return;
    // ⚠ UNE VIGNETTE ÉTEINTE RÉPOND QUAND ON LA TOUCHE. « Un indice n'est pas
    // une interdiction » (CLAUDE.md §4) : un bouton inerte n'apprend rien, un
    // toast qui dit « sans Caserne, pas d'infanterie » apprend la règle. C'est
    // le geste qui manquait quand Ethan a rapporté deux unités « indisponibles »
    // sans savoir pourquoi.
    const unite = unitesDeLaPalette(etatCourant).find((u) => u.id === bouton.dataset.id);
    if (!unite.disponible) {
      toast(messageIndisponible(unite));
      return;
    }
    choisirUnite(bouton.dataset.id);
  });

  for (const [nom, action] of Object.entries(ACTIONS_ARMEE)) {
    $(action.bouton).addEventListener('click', () => {
      if (etatCourant === null) return;
      armer(nom);
    });
  }


  function peindrePalette(vue) {
    palette.textContent = '';
    vignettes.clear();
    // ⚠⚠ AUCUNE COLONNE N'EST ÉCRITE ICI, ET C'EST L'INVERSE DU LOT
    // MISE-EN-PAGE. Tant que la palette devait TENIR, seul le JS savait combien
    // de vignettes il y avait, donc lui seul pouvait poser le nombre de
    // colonnes. Depuis qu'elle DÉFILE — Ethan, 03/09 : « ui armée : une barre »
    // —, la largeur d'une colonne est une constante de la feuille et leur
    // nombre n'a plus à être connu de personne. Même geste que la palette du
    // Chantier, le même jour et pour la même raison.
    for (const unite of vue.palette) {
      const bouton = doc.createElement('button');
      bouton.type = 'button';
      bouton.className = 'unite';
      bouton.dataset.id = unite.id;
      // ⚠ LA VIGNETTE ÉTEINTE N'EST PAS `disabled`, ET C'EST LE POINT. Un
      // bouton désactivé n'émet aucun clic : le joueur n'apprendrait jamais
      // POURQUOI l'unité est hors de portée. Elle porte une classe qui la
      // grise, et son toucher dit la raison — exactement comme les uniques déjà
      // posés du Chantier depuis le 28/08.
      bouton.classList.toggle('verrouillee', !unite.disponible);
      bouton.title = unite.disponible
        ? `${unite.nom} — ${unite.points} points d'armée`
        : `${unite.nom} — ${unite.raison}`;
      // ⚠ MÊME PASTILLE QUE LA PALETTE DU CHANTIER — Ethan nomme les trois
      // barres du bas d'un coup : « base def off ». Le sprite est celui que
      // l'emplacement posera, par le même point d'entrée : une palette qui
      // dériverait ses noms de son côté finirait par montrer autre chose que ce
      // qu'on pose.
      const vignette = doc.createElement('i');
      poserCouches(vignette, couchesDeLUniteDAssaut(unite.id));
      const nom = doc.createElement('b');
      nom.textContent = unite.nom;
      const cout = doc.createElement('span');
      cout.className = 'cout';
      cout.textContent = `${unite.points} pts`;
      bouton.append(vignette, nom, cout);
      bouton.classList.toggle('choisie', choisie === unite.id);
      palette.appendChild(bouton);
      vignettes.set(unite.id, bouton);
    }
  }

  /** Repeint les trente-six emplacements et la palette. */
  function peindre(etat) {
    if (etat === null || etat === undefined) return;
    etatCourant = etat;
    // ⚠ UNE SÉLECTION QUI DÉSIGNE UNE PIÈCE PARTIE MENTIRAIT, OU PIRE :
    // désignerait sa voisine. `retirerEffectif` décale la liste, donc l'indice
    // retenu ne vaut plus rien — on le lâche plutôt que de le laisser glisser.
    if (selection !== null && selection >= baseCourante(etat).armee.length) selection = null;
    const vue = vueDeLOffense(etat);

    vue.vagues.forEach((vague, indice) => {
      vague.forEach((occupant, colonneIndice) => {
        const element = cellules.get(cle(indice + 1, colonneIndice + 1));
        const enApercu = apercu !== null
          && apercu.vague === indice + 1 && apercu.colonne === colonneIndice + 1;
        // ⚠⚠ LE SPRITE A REMPLACÉ LE NOM — Ethan, 30/08 : « onglet offense :
        // aucun sprite unités de joueur ». L'emplacement portait le nom de
        // l'unité en 7 px sur un bloc kaki : deux « Fusiliers » côte à côte se
        // lisaient comme deux étiquettes, pas comme une armée, et le joueur
        // composait à l'aveugle des silhouettes qu'il ne verrait qu'au combat.
        //
        // ⚠ LE NOM N'EST PAS PERDU POUR AUTANT : il passe dans le `title`, comme
        // la famille du jeton du Chantier et la lettre de l'obstacle le même
        // jour. « Rien ne se retire en silence » (CLAUDE.md §4).
        element.textContent = '';
        if (occupant !== null) {
          const piece = doc.createElement('div');
          piece.className = 'piece';
          poserCouches(piece, couchesDeLUniteDAssaut(occupant.id));
          element.appendChild(piece);
          element.title = `${occupant.nom} — niveau ${occupant.niveau}`;
        } else {
          element.removeAttribute('title');
        }
        element.classList.toggle('occupe', occupant !== null);
        element.classList.toggle('apercu', enApercu);
        element.classList.toggle('enmain', enMain !== null && occupant !== null
          && occupant.index === enMain);
      });
    });

    peindrePalette(vue);
    peindreContexte(vue);

    // ⚠⚠ L'EXPLICATION DU BUDGET ABSENT VA DANS LE REGISTRE `mode`, PAS DANS
    // `session`, ET C'EST UNE CORRECTION FAITE AVANT LIVRAISON. Elle décrit
    // bien un état qui dure — pas de Centre de commandement — mais `session`
    // est le registre PRIORITAIRE de `ligneAAfficher` : il aurait masqué les
    // refus, qui répondent, eux, au doigt qui vient de se poser. Le cas arrive
    // pour de bon — une armée posée puis le QG démoli — et le joueur aurait vu
    // ses gestes refusés sans un mot. `mode` est aussi le bon TON : métal, pas
    // rouge ; rien n'est cassé, il manque un bâtiment.
    //
    // Elle ne s'écrit que si aucun mode n'est en cours, sinon elle effacerait
    // le rappel du geste qu'on est en train de faire.
    if (choisie === null && enMain === null && actionArmee === null) ligneDeMode(vue.avis);
    else rendreLigne();
  }

  /**
   * La barre contextuelle : de quoi on parle, et les quatre boutons.
   *
   * ⚠ LES BOUTONS NE SONT JAMAIS DÉSACTIVÉS. C'est le bouton qu'on touche EN
   * PREMIER dans le modèle « armer puis toucher » : les rendre inertes tant
   * qu'aucune unité n'est choisie rendrait toute la barre inatteignable au
   * doigt. C'est la leçon du lot ÉCRAN-ACTIONS, et elle vaut ici mot pour mot.
   */
  function peindreContexte(vue) {
    const piece = selection === null ? null : baseCourante(etatCourant).armee[selection];
    $('offense-selection-nom').textContent = piece === null
      ? '—' : UNITES[piece.id].nom.joueur;
    $('offense-selection-detail').textContent = piece === null
      ? 'aucune unité sélectionnée'
      : `vague ${piece.vague} · niveau ${piece.niveau} · ${UNITES[piece.id].points} pts`;
    // ⚠⚠ LE COMPTEUR DE POINTS D'ARMÉE N'A RIEN À FAIRE DANS UN BOUTON D'ACTION,
    // et il y était. Cet `<em>` est le pendant de celui du Chantier, qui écrit
    // « vers niv. N+1 » : il dit ce que l'amélioration VISE. Y ranger
    // « engagés / budget » mettait la grandeur du BANDEAU dans le bouton, à deux
    // endroits à la fois, et sous un libellé qui ne la nomme pas — Ethan l'a
    // relevé le 31/08 (« il y a le compteur armée dans le bouton améliorer »).
    //
    // ⚠ ET IL RESTE VIDE PLUTÔT QUE DE DIRE AUTRE CHOSE. C'est la règle déjà
    // écrite au Chantier : « vers niv. N+1 » ne s'écrit QUE là où améliorer
    // existe. `ACTIONS_ARMEE.ameliorer.agir` vaut `null` — le moteur ne monte
    // aucune unité —, donc annoncer un niveau visé promettrait un geste que le
    // bouton refuse ensuite.
    //
    // ⚠ LA GRANDEUR N'EST PAS PERDUE : le bandeau du haut la porte dans les
    // trois contextes depuis le 28/08, et c'est lui qui la nomme (« PTS OFF. »).
    // ⚠ SANS SÉLECTION, LA LIGNE EST VIDE — PAS « vers niv. » TOUT SEUL. Le
    // niveau visé était interpolé à l'intérieur du gabarit, si bien qu'une
    // barre sans unité choisie annonçait une demi-phrase. Invisible tant
    // qu'`agir` valait `null` et que la ligne restait vide en toute
    // circonstance ; vu au boot sans tête dès que le moteur a été branché.
    $('offense-ameliorer-cible').textContent
      = (ACTIONS_ARMEE.ameliorer.agir === null || piece === null)
        ? '' : `vers niv. ${piece.niveau + 1}`;
    marquerBoutonsAction();
  }

  /**
   * Ce qui change avec le temps : rien, ici. L'armée ne bouge que sous le doigt
   * du joueur, et `peindre` suit chaque geste. La fonction existe pour que la
   * session traite les trois écrans de la même façon.
   */
  function rafraichir(etat) {
    if (etatCourant === null) peindre(etat);
  }

  // ⚠ LE PANNEAU CONTEXTUEL PART VIDE, EXPLICITEMENT. Comme celui du Chantier :
  // le balisage suffit aujourd'hui, mais il serait la SEULE chose à le tenir
  // ainsi, et un attribut oublié à la prochaine reprise du HTML le laisserait
  // annoncer une sélection qui n'existe pas.
  marquerBoutonsAction();

  return { peindre, rafraichir, nbEmplacements: NB_EMPLACEMENTS };
}
