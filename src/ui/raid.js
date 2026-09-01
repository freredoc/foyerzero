// L'écran de raid — la cible en haut, l'armée en bas, et le combat qui se joue.
//
// ⚠⚠ SEPTIÈME ÉCRAN, ET IL S'ALLUME SUR L'ONGLET MONDE. On y vient de la carte,
// par un SECOND toucher sur une cible déjà ouverte, et on y retourne. Il se
// déclare dans `ECRANS` et dans `ONGLET_DE_L_ECRAN` de `ui/session.js`, et
// nulle part ailleurs — c'est ce que dit le commentaire de cette table.
//
// ⚠ LE BANDEAU DES RESSOURCES ET CELUI DES BASES SONT MASQUÉS ICI, la rangée
// d'onglets RESTE. Ethan, 01/09 : « finalement on garde la barre du haut… les
// onglets seuls ». Le masquage se fait dans `montrerEcran`, chez la session, qui
// est la seule à connaître le chrome commun.
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

import { EMPLACEMENTS_ASSAUT, BATIMENTS } from '../data/sites.js';
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
import { creerCombat, tick as tickCombat } from '../sim/combat.js';
import {
  creerAccumulateur, ticksDus, alphaMilli, prendrePositions, VITESSES,
} from '../render/interpolation.js';
import { calculerProjection } from '../render/projection.js';
import { listeAffichage } from '../render/scene.js';
import { executer } from '../render/canvas2d.js';

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
  const vagues = [];
  for (let numero = 1; numero <= NB_VAGUES; numero += 1) {
    const cases = new Array(NB_COLONNES).fill(null);
    vagues.push({ numero, cases });
  }
  etat.armee.forEach((piece, index) => {
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
 * @param {object} etat
 * @param {{rangee: number, colonne: number}} cible
 * @returns {object}
 */
export function vueDuRaid(etat, cible) {
  const site = siteDeLaCase(etat, cible.rangee, cible.colonne);
  const problemes = site === null ? [{ code: 'sans-cible', message: 'Plus rien à attaquer ici.' }]
    : problemesDuRaid(etat, etat, cible);
  return {
    site,
    problemes,
    peutAttaquer: problemes.length === 0,
    vagues: vaguesDeLArmee(etat),
    engagees: composerLesVagues(etat).indices.length,
  };
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
    agir: (etat, index) => reglerActivite(etat, 'armee', index, etat.armee[index].actif === false),
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

  const canvas = $('raid-canvas');
  const ctx = canvas === null ? null : canvas.getContext('2d');
  // ⚠ LE PIXEL ART NE S'INTERPOLE PAS, et c'est ici que ça se décide — chez
  // celui qui crée le contexte. `render/canvas2d.js` n'en prend aucune.
  if (ctx !== null) ctx.imageSmoothingEnabled = false;

  let etatCourant = null;
  let cibleCourante = null;
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
  /** Combien de fois une image a été calculée, et le temps total — mesure M2. */
  const mesure = { images: 0, totalMs: 0 };

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
  function dimensionner() {
    if (canvas === null) return false;
    const dpr = (doc.defaultView && doc.defaultView.devicePixelRatio) || 1;
    const largeur = Math.round(canvas.clientWidth * dpr);
    const hauteur = Math.round(canvas.clientHeight * dpr);
    if (largeur <= 0 || hauteur <= 0) { projection = null; return false; }
    if (canvas.width !== largeur) canvas.width = largeur;
    if (canvas.height !== hauteur) canvas.height = hauteur;
    projection = calculerProjection(largeur, hauteur);
    return true;
  }

  function dessiner() {
    if (ctx === null || combat === null || projection === null) return;
    const debut = (doc.defaultView?.performance ?? globalThis.performance)?.now() ?? 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    executer(
      ctx,
      listeAffichage(combat, projection, precedentes,
        combat.termine ? 0 : alphaMilli(accumulateur, vitesse)),
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
        // compare à la position d'après.
        precedentes = prendrePositions(combat);
        tickCombat(combat);
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
    precedentes = prendrePositions(combat);
    accumulateur = creerAccumulateur();
    enPause = false;
    dimensionner();
    demarrerBoucle();
  }

  function finDuDeroule() {
    arreterBoucle();
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
        && problemesDuRaid(etatCourant, etatCourant, cibleCourante).length === 0;
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
          emplacement.textContent = occupant.nom;
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
    for (const id of ['raid-sim', 'raid-fin', 'raid-bandeau', 'raid-vitesses']) {
      const bloc = $(id);
      if (bloc !== null) bloc.hidden = true;
    }
  }

  /** Lance un raid — pour de bon, ou en simulation. */
  function lancer(simule) {
    if (etatCourant === null || cibleCourante === null) return;
    const problemes = problemesDuRaid(etatCourant, etatCourant, cibleCourante);
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
      ? simulerRaid(etatCourant, etatCourant, cibleCourante)
      : executerRaid(etatCourant, etatCourant, cibleCourante);
    if (!simule) apresGeste();
    peindreVagues();
    // ⚠ UN BANDEAU « SIMULATEUR » COUVRE LA VUE PENDANT TOUT LE DÉROULÉ SIMULÉ,
    // pour qu'on ne le confonde jamais avec la vraie attaque.
    $('raid-bandeau').hidden = !simule;
    // ⚠ LE VRAI RAID SE REGARDE EN TEMPS RÉEL, SANS CONTRÔLE DE VITESSE — Ethan.
    // `dureeMaxCombatSec` vaut 90 : il ne peut pas durer plus d'une minute
    // trente, donc il n'y a pas de durée à gérer.
    $('raid-vitesses').hidden = !simule;
    vitesse = 1;
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
    precedentes = prendrePositions(combat);
    tickCombat(combat);
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
      fermerPanneaux();
      desarmer();
      peindreVagues();
      const site = siteDeLaCase(etat, cible.rangee, cible.colonne);
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
        precedentes = prendrePositions(combat);
        dimensionner();
        dessiner();
      }
    },
    peindre(etat) { etatCourant = etat; peindreVagues(); },
    masquer() { arreterBoucle(); },
    /** La mesure M2 : le coût moyen d'une image du déroulé. */
    mesureImages() {
      return { images: mesure.images, moyenneMs: mesure.images === 0 ? 0 : mesure.totalMs / mesure.images };
    },
  };
}
