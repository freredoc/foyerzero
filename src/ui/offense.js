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

import { GRILLE, UNITES } from '../data/combat.js';
import {
  NB_VAGUES, NB_COLONNES, NB_EMPLACEMENTS, budgetDuNiveau, unitesDisponibles,
} from './arsenal.js';
import {
  pointsEngages, niveauDeCommandement,
  poserEffectif, retirerEffectif, deplacerEffectif,
  problemesDeLaPoseDEffectif, problemesDuDeplacementDEffectif,
} from '../sim/state.js';
import { niveauDeLArmee } from '../sim/niveau-de-base.js';
import {
  formaterEntier, ligneAAfficher, messageDeRefus,
  messageDePose, messageDeConfirmation, DUREE_TOAST_MS,
} from './chantier.js';

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
 * Les unités que la palette montre à ce niveau d'armée.
 *
 * ⚠ LE FILTRE EST CELUI DE L'ARSENAL, PAS UN SECOND. `unitesDisponibles` ne
 * montre que `apparition <= niveau` — « une unité qu'on ne peut pas construire
 * n'a pas à occuper l'écran », décidé au lot 5A. Ce n'est PAS le cas des
 * bâtiments uniques du Chantier, qui restent grisés : là-bas la vignette
 * disparaîtrait au milieu d'une palette de longueur fixe et déplacerait les
 * autres sous le doigt ; ici la palette s'allonge en début de partie et personne
 * ne vise une vignette qui n'existe pas encore.
 *
 * ⚠ `niveau === null` MONTRE TOUT, DÉSACTIVÉ. Sans Centre de commandement il
 * n'y a pas de niveau d'armée — pas un niveau zéro. Filtrer sur un niveau
 * inventé cacherait des unités pour une mauvaise raison ; montrer le roster
 * entier, éteint, dit ce qui est vrai : rien n'est composable pour l'instant.
 *
 * ⚠ `nom.joueur`, JAMAIS `nom.ouvrage`. C'est un panneau du joueur : il y emploie
 * le vocabulaire d'une armée régulière (CLAUDE.md §4).
 *
 * @param {number|null} niveau niveau du Centre de commandement
 * @returns {Array<{id: string, nom: string, points: number, disponible: boolean}>}
 */
export function unitesDeLaPalette(niveau) {
  const ids = niveau === null ? Object.keys(UNITES) : unitesDisponibles(niveau);
  return ids.map((id) => ({
    id,
    nom: UNITES[id].nom.joueur,
    points: UNITES[id].points,
    disponible: niveau !== null,
  }));
}

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
export function vueDeLOffense(etat) {
  if (!etat || !Array.isArray(etat.armee)) {
    throw new TypeError('offense : état de jeu absent ou malformé');
  }
  const niveau = niveauDeCommandement(etat, 'armee');

  // Les quatre vagues, pleines de `null` puis remplies : une case vide garde sa
  // place. Une vague vide ne doit pas décaler la suivante — son rang décide de
  // l'instant où elle entre en jeu.
  const vagues = Array.from({ length: NB_VAGUES }, () => Array.from(
    { length: NB_COLONNES }, () => null,
  ));
  etat.armee.forEach((piece, index) => {
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
    niveauArmee: niveauDeLArmee(etat.armee),
    engages,
    budget,
    depasse,
    vagues,
    palette: unitesDeLaPalette(niveau),
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
    rangee.style.gridTemplateColumns = `repeat(${NB_COLONNES}, 1fr)`;
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
    enMain = null;
    ligneDeMode('');
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
    enMain = null;
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
    // ⚠ LE BUDGET EST DEMANDÉ À PART, PARCE QU'IL N'EST PAS DANS `sim/`. Une
    // composition trop chère est un fait de jeu, pas un fait de programme :
    // `verifierEtat` ne la refuse pas, et c'est voulu — le budget BAISSE quand
    // le QG tombe, sous une armée déjà posée. C'est donc ici, au geste, qu'on
    // l'oppose au joueur.
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

  /** Le second toucher d'un déplacement, ou d'un retrait. */
  function agirSurLaPieceEnMain(vague, colonne) {
    const piece = etatCourant.armee[enMain];
    // Le MÊME emplacement une seconde fois : on retire.
    if (piece.vague === vague && piece.colonne === colonne) {
      retirerEffectif(etatCourant, 'armee', enMain);
      desarmer();
      peindre(etatCourant);
      if (apresPose) apresPose();
      return;
    }
    const problemes = problemesDuDeplacementDEffectif(
      etatCourant, 'armee', enMain, { vague, colonne },
    );
    if (problemes.length > 0) {
      toast(messageDeRefus(problemes));
      desarmer();
      peindre(etatCourant);
      return;
    }
    // ⚠ DÉPLACER NE COÛTE RIEN — Ethan, 28/08 : « déplacement gratuit, comme
    // bâtiment ». Le budget ne bouge pas : la même unité change de case.
    deplacerEffectif(etatCourant, 'armee', enMain, { vague, colonne });
    desarmer();
    peindre(etatCourant);
    if (apresPose) apresPose();
  }

  corps.addEventListener('click', (evenement) => {
    const emplacement = evenement.target.closest('.emplacement');
    if (emplacement === null || etatCourant === null) return;
    const vague = Number(emplacement.dataset.vague);
    const colonne = Number(emplacement.dataset.colonne);
    const occupant = etatCourant.armee.findIndex(
      (p) => p.vague === vague && p.colonne === colonne,
    );

    if (enMain !== null) {
      agirSurLaPieceEnMain(vague, colonne);
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

    // Rien d'armé : toucher une unité posée la prend en main. Toucher une case
    // vide ne dit rien — c'est le geste « à côté du menu », pas une erreur.
    if (occupant === -1) {
      desarmer();
      peindre(etatCourant);
      return;
    }
    enMain = occupant;
    ligneDeMode(messageEnMain(UNITES[etatCourant.armee[occupant].id].nom.joueur));
    peindre(etatCourant);
  });

  palette.addEventListener('click', (evenement) => {
    const bouton = evenement.target.closest('.unite');
    if (bouton === null || etatCourant === null) return;
    if (bouton.disabled) return;
    choisirUnite(bouton.dataset.id);
  });

  /** Reconstruit la palette — sa longueur suit le niveau, donc elle change. */
  function peindrePalette(vue) {
    palette.textContent = '';
    vignettes.clear();
    for (const unite of vue.palette) {
      const bouton = doc.createElement('button');
      bouton.type = 'button';
      bouton.className = 'unite';
      bouton.dataset.id = unite.id;
      bouton.disabled = !unite.disponible;
      bouton.title = `${unite.nom} — ${unite.points} points d'armée`;
      const nom = doc.createElement('b');
      nom.textContent = unite.nom;
      const cout = doc.createElement('span');
      cout.className = 'cout';
      cout.textContent = `${unite.points} pts`;
      bouton.append(nom, cout);
      bouton.classList.toggle('choisie', choisie === unite.id);
      palette.appendChild(bouton);
      vignettes.set(unite.id, bouton);
    }
  }

  /** Repeint les trente-six emplacements et la palette. */
  function peindre(etat) {
    if (etat === null || etat === undefined) return;
    etatCourant = etat;
    const vue = vueDeLOffense(etat);

    vue.vagues.forEach((vague, indice) => {
      vague.forEach((occupant, colonneIndice) => {
        const element = cellules.get(cle(indice + 1, colonneIndice + 1));
        const enApercu = apercu !== null
          && apercu.vague === indice + 1 && apercu.colonne === colonneIndice + 1;
        element.textContent = occupant === null ? '' : occupant.nom;
        element.classList.toggle('occupe', occupant !== null);
        element.classList.toggle('apercu', enApercu);
        element.classList.toggle('enmain', enMain !== null && occupant !== null
          && occupant.index === enMain);
      });
    });

    peindrePalette(vue);

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
    if (choisie === null && enMain === null) ligneDeMode(vue.avis);
    else rendreLigne();
  }

  /**
   * Ce qui change avec le temps : rien, ici. L'armée ne bouge que sous le doigt
   * du joueur, et `peindre` suit chaque geste. La fonction existe pour que la
   * session traite les trois écrans de la même façon.
   */
  function rafraichir(etat) {
    if (etatCourant === null) peindre(etat);
  }

  return { peindre, rafraichir, nbEmplacements: NB_EMPLACEMENTS };
}
