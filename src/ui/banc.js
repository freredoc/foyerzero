// Banc d'essai de combat — lot 3A.
//
// Un instrument pour OBSERVER et ARBITRER, pas l'interface du jeu : il monte
// un site généré, y lance un assaut préréglé, et laisse regarder le raid se
// dérouler — en continu, au pas à pas, à ×1 ×2 ×4 — jusqu'au panneau de fin
// qui porte les chiffres sur lesquels Ethan tranchera.
//
// Deux étages dans ce fichier, et la frontière est stricte :
//   - l'étage PUR (préréglages, montage, exécution headless) s'importe sous
//     node --test sans DOM — c'est lui que les tests conduisent ;
//   - l'étage IMPUR (initialiserBanc) reçoit le document en argument et ne
//     touche au DOM que là. Aucun accès au DOM au chargement du module.
//
// LA GRAINE EST SAISIE, JAMAIS TIRÉE. Aucun Math.random nulle part : un banc
// dont on ne peut pas reproduire l'exécution ne sert à rien. Le temps réel
// vient des horodatages de requestAnimationFrame, jamais de l'horloge murale.

import { UNITES, DEFENSES } from '../data/combat.js';
import { BATIMENTS } from '../data/sites.js';
import { NIVEAU } from '../data/niveaux.js';
import {
  creerCombat, tick, construireResultat, butin, pointsRecherche, TICKS_AVANT_REPLI,
} from '../sim/combat.js';
import { caseDepuisMilli } from '../sim/grille.js';
import { genererSite, genererAssaut, budgetAssaut } from '../sim/generateur.js';
import {
  arsenalVide, poser, retirer, enVagues, depuisVagues, avecNiveau,
  unitesDisponibles, bilan, purger, estVide, NB_VAGUES,
} from './arsenal.js';
import {
  creerAccumulateur, ticksDus, alphaMilli, prendrePositions, VITESSES,
} from '../render/interpolation.js';
import { calculerProjection, caseDepuisPixels } from '../render/projection.js';
import { listeAffichage, listeLegende, listeArsenal, classeDe, NOMS_CLASSE } from '../render/scene.js';
import { executer } from '../render/canvas2d.js';

// ---------------------------------------------------------------------------
// Étage pur
// ---------------------------------------------------------------------------


/**
 * Monte le combat du banc : le site vient de `genererSite`, l'assaut de
 * `genererAssaut`. `genererSite` rend `vagues: []` — la force d'assaut est celle
 * du joueur, le générateur de site ne la connaît pas.
 *
 * LOT 4B — l'assaut est BUDGÉTÉ. `assaut` nomme un profil de `PROFILS_ASSAUT`,
 * pas une liste : sa composition est fonction du niveau, et son coût ne dépasse
 * jamais `20 + 5 × niveau`. La graine du site sert aussi à l'assaut, si bien
 * qu'un couple (type, niveau, graine) décrit toujours un raid entier et un seul.
 *
 * LOT 5A — `vagues` prend le pas sur `assaut` quand il est fourni : c'est la
 * composition que le joueur a faite à la main dans l'Arsenal, et elle devient
 * la source de vérité. Le chemin par PROFIL demeure — `genererAssaut` est
 * désormais un bouton de confort, « Remplir », et les tests des lots antérieurs
 * comme `executerRaidComplet` continuent de l'emprunter sans une ligne de
 * changement.
 *
 * Les trois LISTES FIGÉES du lot 3A ne sont plus ici : elles ne servaient plus
 * qu'à mesurer l'écart du lot 4B, et un banc hors ligne n'a pas à emporter deux
 * kilo-octets d'armées mortes. Elles vivent dans `test/prereglages-lot3a.js`.
 *
 * @param {{ type: string, niveau: number, saveur: string|null, graine: number,
 *   assaut?: string, vagues?: Array<Array<object>> }} parametres
 * @returns {object} montage prêt pour creerCombat.
 */
export function montageDuBanc({ type, niveau, saveur, graine, assaut, vagues }) {
  const montage = genererSite({ type, niveau, saveur, graine });
  if (vagues !== undefined) {
    montage.vagues = vagues.map((vague) => vague.map((u) => ({ ...u })));
    const engages = montage.vagues.flat()
      .reduce((somme, u) => somme + UNITES[u.id].points, 0);
    const budget = budgetAssaut(niveau);
    montage.assaut = {
      profil: null,
      budgetPoints: budget,
      pointsEngages: engages,
      pointsRestants: budget - engages,
      profilRespecte: true,
    };
    return montage;
  }
  const force = genererAssaut({ niveau, profil: assaut, graine });
  montage.vagues = force.vagues;
  montage.assaut = {
    profil: assaut,
    budgetPoints: force.budgetPoints,
    pointsEngages: force.pointsEngages,
    pointsRestants: force.pointsRestants,
    profilRespecte: force.profilRespecte,
  };
  return montage;
}

/**
 * Exécute un raid complet SANS DOM, conduit par le même accumulateur que la
 * page : des images synthétiques de 100 ms jusqu'à la fin du combat. C'est le
 * chemin de la rejouabilité (T8) — mêmes paramètres, même graine, même
 * résultat, au tick près.
 * @returns {{ cause: string, nbTicks: number, resultat: object,
 *   butin: { quartz: number, scorie: number }, pointsRechercheMilli: bigint }}
 */
export function executerRaidComplet(parametres, { vitesse = 1, dureeImageMs = 100 } = {}) {
  const montage = montageDuBanc(parametres);
  const etat = creerCombat(montage);
  const accumulateur = creerAccumulateur();
  // 900 ticks au plus (fin « duree » du moteur) : à ×1 en images de 100 ms,
  // 900 images suffisent. 100 000 est un garde-fou, pas une attente.
  for (let image = 0; image < 100_000 && !etat.termine; image++) {
    const dus = ticksDus(accumulateur, dureeImageMs, vitesse);
    for (let k = 0; k < dus && !etat.termine; k++) {
      prendrePositions(etat); // l'instantané se prend AVANT le tick, comme la page
      tick(etat);
    }
  }
  if (!etat.termine) throw new Error('banc : le raid ne s\'est pas terminé');
  const resultat = construireResultat(etat);
  return {
    cause: resultat.cause,
    nbTicks: resultat.tick,
    resultat,
    butin: butin(resultat, montage),
    pointsRechercheMilli: pointsRecherche(resultat, montage),
  };
}

/**
 * Nom affiché d'une entité — DEUX JEUX DE NOMS, jamais mélangés : le joueur
 * emploie le vocabulaire d'une armée régulière, l'Ouvrage celui des outils et
 * des bêtes.
 *
 * ⚠ LA CLÉ EST LE PROPRIÉTAIRE, PAS LE CAMP. Elle a longtemps été le camp, et
 * ça marchait tant que seul l'Ouvrage défendait. Le jour où le joueur garnit sa
 * propre base, le camp de ses unités devient « defense » sans qu'elles changent
 * de propriétaire — et elles s'afficheraient sous le nom de l'Ouvrage.
 *
 * Les BÂTIMENTS n'ont qu'un nom : une Souche est une Souche des deux côtés.
 * Les DÉFENSES en ont deux depuis le 25/08/2026.
 */
export function nomAffiche(entite) {
  if (entite.genre === 'batiment') return BATIMENTS[entite.id].nom;
  const joueur = entite.proprietaire === 'joueur';
  if (entite.genre === 'defense') {
    const noms = DEFENSES[entite.id].nom;
    return joueur ? noms.joueur : noms.ouvrage;
  }
  const noms = UNITES[entite.id].nom;
  return joueur ? noms.joueur : noms.ouvrage;
}

/**
 * Entités actives occupant une case. L'aviation ne bloque rien et peut donc
 * partager sa case avec une entité au sol : la liste peut en compter deux.
 */
export function entitesSurLaCase(etat, rangee, colonne) {
  return etat.entites.filter((e) => e.vivant && !e.sorti
    && e.colonne === colonne && caseDepuisMilli(e.rangeeMilli) === rangee);
}

/**
 * Décrit une entité pour l'inspecteur : nom selon le camp, classe, PV, réserve,
 * cible visée, et le compteur de repli s'il a commencé à courir.
 */
export function decrireEntite(etat, e) {
  const morceaux = [
    `${nomAffiche(e)} (${NOMS_CLASSE[classeDe(e.genre, e.id)]})`,
    e.camp === 'attaque' ? 'assaut' : 'Ouvrage',
    `${formaterPv(e.pvMilli)} / ${formaterPv(e.pvMaxMilli)} PV`,
  ];
  if (e.camp === 'attaque' && e.genre === 'unite') morceaux.push(`réserve ${e.reserve}`);
  morceaux.push(e.cibleIndice === null
    ? 'aucune cible'
    : `vise ${nomAffiche(etat.entites[e.cibleIndice])}`);
  if (e.ticksInutiles > 0) morceaux.push(`repli dans ${TICKS_AVANT_REPLI - e.ticksInutiles} ticks`);
  return morceaux.join(' · ');
}

/** Libellés des causes de fin, pour le panneau. */
export const LIBELLES_CAUSE = {
  souche: 'Souche détruite — butin intégral',
  attaquants: 'Plus aucun attaquant sur la grille',
  batiments: 'Plus aucun bâtiment debout',
  duree: 'Temps écoulé (90 s)',
};

/**
 * Formate des milli-PV en PV à une décimale, virgule française : 2 897 400 →
 * « 2897,4 ». Même précision pour la valeur courante et le maximum — deux
 * arrondis différents feraient croire à des PV au-dessus du plafond.
 */
export function formaterPv(pvMilli) {
  const entier = Math.floor(pvMilli / 1000);
  const decimale = Math.floor((pvMilli % 1000) / 100);
  return `${entier},${decimale}`;
}

/** Formate des milli-points de recherche BigInt en « 12,345 » — sans Number. */
export function formaterPointsMilli(pointsMilli) {
  const entier = pointsMilli / 1000n;
  const milli = pointsMilli % 1000n;
  return `${entier},${milli.toString().padStart(3, '0')}`;
}

// ---------------------------------------------------------------------------
// Étage impur — tout le DOM vit ici, et seulement ici
// ---------------------------------------------------------------------------

/** Plafond de devicePixelRatio : au-delà de 2, le gain est invisible et le
 * coût de remplissage triple (un S25 FE est en DPR 3). */
export const DPR_MAX = 2;

/**
 * Câble le banc dans une page qui porte les éléments attendus (voir
 * index.src.html). Appelée une fois au chargement ; c'est le SEUL endroit du
 * dépôt qui touche au DOM.
 * @param {Document} doc
 */
export function initialiserBanc(doc) {
  const fenetre = doc.defaultView;
  const $ = (id) => doc.getElementById(id);
  const canvas = $('banc-canvas');
  const ctx = canvas.getContext('2d');

  // --- état du banc ---------------------------------------------------------
  let etat = null;
  let montage = null;
  let parametresCourants = null;
  let accumulateur = creerAccumulateur();
  let precedentes = null;
  let vitesse = 1;
  let enPause = false;
  let idImage = null;
  let derniereImageMs = null;
  let projection = null;
  let legendeOuverte = false;
  // --- Arsenal (lot 5A) ---
  let arsenal = arsenalVide(10);
  let arsenalOuvert = false;
  let uniteChoisie = null;

  // --- projection et buffer -------------------------------------------------
  //
  // ⚠ Le canvas ne change pas de taille qu'au redimensionnement de la fenêtre :
  // il est en `flex: 1`, et le panneau de tick qui se remplit sous lui le fait
  // rétrécir de 681 à 411 px dès la première pause. Une projection calculée une
  // fois au chargement devient alors fausse — le dessin comme le pointage. D'où
  // le ResizeObserver sur l'élément lui-même, et non le seul écouteur `resize`.
  let dernieresDimensions = '';

  function dimensionner() {
    const largeur = canvas.clientWidth;
    const hauteur = canvas.clientHeight;
    if (largeur < 9 || hauteur < 18) return;
    const empreinte = `${largeur}×${hauteur}×${fenetre.devicePixelRatio || 1}`;
    if (empreinte === dernieresDimensions) return;
    dernieresDimensions = empreinte;
    const dpr = Math.min(fenetre.devicePixelRatio || 1, DPR_MAX);
    canvas.width = Math.round(largeur * dpr);
    canvas.height = Math.round(hauteur * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    projection = calculerProjection(largeur, hauteur);
    dessiner();
  }

  function dessiner() {
    if (!projection) return;
    if (legendeOuverte) {
      executer(ctx, listeLegende(projection));
      return;
    }
    if (arsenalOuvert) {
      executer(ctx, listeArsenal(arsenal, projection,
        bilan(arsenal).indices.map((i) => i.colonne)));
      return;
    }
    if (!etat) return;
    executer(ctx, listeAffichage(etat, projection, precedentes,
      etat.termine ? 0 : alphaMilli(accumulateur, vitesse)));
  }

  function basculerLegende() {
    legendeOuverte = !legendeOuverte;
    $('banc-legende').classList.toggle('actif', legendeOuverte);
    // Le banc se met en pause pendant la lecture : elle occupe tout le canvas,
    // personne ne regarde le combat. Le panneau de tick s'efface avec lui —
    // sinon il ampute le canvas de 270 px et les vignettes tombent à 10 px de
    // côté. Le ResizeObserver reprend la projection tout seul.
    if (legendeOuverte && etat && !etat.termine) mettreEnPause(true);
    $('banc-tick').hidden = legendeOuverte;
    dimensionner();
    dessiner();
    if (legendeOuverte) majStatut('légende — retoucher le bouton pour revenir');
    else if (etat) majStatut(`tick ${etat.tick}`);
  }

  // --- Arsenal -------------------------------------------------------------

  /**
   * Rangée du champ ↔ vague de l'Arsenal.
   *
   * Le bloc occupe les quatre rangées basses. La vague 1 — celle qui part la
   * première — est la rangée du HAUT du bloc, soit la rangée 4 du champ ; la
   * vague 4 est la rangée 1. Rend null hors du bloc.
   */
  function vagueDeRangee(rangee) {
    if (rangee < 1 || rangee > NB_VAGUES) return null;
    return NB_VAGUES - rangee + 1;
  }

  function majPalette() {
    const disponibles = unitesDisponibles(arsenal.niveau);
    if (uniteChoisie !== null && !disponibles.includes(uniteChoisie)) uniteChoisie = null;
    $('banc-palette').innerHTML = disponibles.map((id) => {
      const u = UNITES[id];
      const actif = id === uniteChoisie ? ' actif' : '';
      return `<button type="button" class="unite${actif}" data-unite="${id}">`
        + `<span>${u.nom.joueur}</span><span class="cout">${u.points} pts</span></button>`;
    }).join('');
    for (const bouton of $('banc-palette').querySelectorAll('button[data-unite]')) {
      bouton.addEventListener('click', () => {
        uniteChoisie = uniteChoisie === bouton.dataset.unite ? null : bouton.dataset.unite;
        majPalette();
      });
    }
  }

  function majCompteur() {
    const b = bilan(arsenal);
    const compteur = $('banc-compteur');
    const file = b.indices.length === 0 ? ''
      : ` · file : colonne${b.indices.length > 1 ? 's' : ''} `
        + b.indices.map((i) => i.colonne).join(', ');
    compteur.textContent = `${b.pointsEngages} / ${b.budgetPoints} points`
      + ` · ${b.emplacementsOccupes}/36 emplacements${file}`;
    compteur.classList.toggle('depasse', !b.valide);
  }

  function majArsenal() {
    majPalette();
    majCompteur();
    dessiner();
  }

  function basculerArsenal() {
    arsenalOuvert = !arsenalOuvert;
    $('banc-arsenal-ouvrir').classList.toggle('actif', arsenalOuvert);
    $('banc-arsenal').hidden = !arsenalOuvert;
    // Comme la légende : le banc se met en pause, l'Arsenal prend tout le
    // canvas, et le panneau de tick s'efface pour ne pas amputer la grille.
    if (arsenalOuvert && etat && !etat.termine) mettreEnPause(true);
    if (arsenalOuvert && legendeOuverte) basculerLegende();
    $('banc-tick').hidden = arsenalOuvert;
    dimensionner();
    majArsenal();
    if (arsenalOuvert) {
      majStatut('Arsenal — la rangée du haut part la première. '
        + 'Choisir une unité, toucher une case pour la poser ; toucher une case pleine la retire.');
    } else if (etat) majStatut(`tick ${etat.tick}`);
    else majStatut('prêt — choisir les paramètres et lancer');
  }

  /** Toucher une case de l'Arsenal : poser si vide, retirer si pleine. */
  function toucherArsenal(cible) {
    const vague = vagueDeRangee(cible.rangee);
    if (vague === null) {
      majStatut(`la grille de composition tient sur les ${NB_VAGUES} rangées du bas`);
      return;
    }
    const occupee = arsenal.cases[vague - 1][cible.colonne - 1];
    if (occupee !== null) {
      arsenal = retirer(arsenal, { vague, colonne: cible.colonne });
      majArsenal();
      majStatut(`retiré : ${UNITES[occupee].nom.joueur} (vague ${vague}, colonne ${cible.colonne})`);
      return;
    }
    if (uniteChoisie === null) {
      majStatut('choisir d\'abord une unité dans la palette');
      return;
    }
    try {
      arsenal = poser(arsenal, { vague, colonne: cible.colonne, id: uniteChoisie });
    } catch (erreur) {
      majStatut(erreur.message);
      return;
    }
    majArsenal();
    const b = bilan(arsenal);
    const enFile = b.indices.find((i) => i.colonne === cible.colonne);
    if (enFile === undefined) {
      majStatut(`${UNITES[uniteChoisie].nom.joueur} en vague ${vague}, colonne ${cible.colonne}`
        + ` · ${b.pointsRestants} points restants`);
    } else {
      // L'indice, expliqué en une phrase — c'est un avertissement, pas un refus.
      majStatut(`⚠ colonne ${cible.colonne} : ${UNITES[enFile.derriere.id].nom.joueur}`
        + ` (vague ${enFile.derriere.vague}) est plus rapide que`
        + ` ${UNITES[enFile.devant.id].nom.joueur} (vague ${enFile.devant.vague})`
        + ' devant lui — il sera retenu derrière toute la traversée.');
    }
  }

  /** Inspecteur : une case touchée dit qui l'occupe. */
  function inspecter(evenement) {
    if (legendeOuverte || !projection) return;
    if (!arsenalOuvert && !etat) return;
    const cadre = canvas.getBoundingClientRect();
    const point = evenement.touches?.[0] ?? evenement.changedTouches?.[0] ?? evenement;
    const cible = caseDepuisPixels(
      projection, point.clientX - cadre.left, point.clientY - cadre.top,
    );
    if (cible === null) {
      majStatut('hors de la grille');
      return;
    }
    if (arsenalOuvert) {
      toucherArsenal(cible);
      return;
    }
    const occupants = entitesSurLaCase(etat, cible.rangee, cible.colonne);
    if (occupants.length === 0) {
      majStatut(`case (${cible.rangee}, ${cible.colonne}) — vide`);
      return;
    }
    majStatut(`(${cible.rangee}, ${cible.colonne}) `
      + occupants.map((e) => decrireEntite(etat, e)).join('  ||  '));
  }

  // --- panneaux -------------------------------------------------------------
  function majStatut(texte) {
    $('banc-statut').textContent = texte;
  }

  function majPanneauTick() {
    if (!etat) return;
    const lignes = etat.entites
      .filter((e) => e.vivant && !e.sorti)
      .map((e) => {
        const cible = e.cibleIndice === null ? '—' : nomAffiche(etat.entites[e.cibleIndice]);
        const reserve = e.camp === 'attaque' && e.genre === 'unite' ? String(e.reserve) : '—';
        return `<tr><td>${nomAffiche(e)}</td><td>${e.camp === 'attaque' ? 'assaut' : 'Ouvrage'}</td>`
          + `<td>${formaterPv(e.pvMilli)} / ${formaterPv(e.pvMaxMilli)}</td>`
          + `<td>${reserve}</td><td>${cible}</td><td>${e.aTire ? '● tir' : ''}</td></tr>`;
      })
      .join('');
    $('banc-tick').innerHTML = `<table><thead><tr><th>entité</th><th>camp</th><th>PV</th>`
      + `<th>réserve</th><th>cible</th><th></th></tr></thead><tbody>${lignes}</tbody></table>`;
  }

  function majPanneauFin() {
    const resultat = construireResultat(etat);
    const gain = butin(resultat, montage);
    const points = pointsRecherche(resultat, montage);
    const survivants = resultat.attaquants
      .filter((a) => !a.detruit)
      .map((a) => `${nomAffiche({ genre: 'unite', camp: 'attaque', id: a.id })}`
        + ` — ${formaterPv(a.pvMilli)} PV${a.sorti ? ' (sorti)' : ''}`)
      .join('<br>') || 'aucun';
    $('banc-fin').innerHTML = `<h2>${LIBELLES_CAUSE[resultat.cause]}</h2>`
      + `<p>tick ${resultat.tick} · butin <strong>${gain.quartz}</strong> quartz`
      + ` + <strong>${gain.scorie}</strong> scorie`
      + ` · <strong>${formaterPointsMilli(points)}</strong> points de recherche</p>`
      + `<p>survivants : ${survivants}</p>`;
    $('banc-fin').hidden = false;
  }

  // --- boucle ---------------------------------------------------------------
  function image(horodatageMs) {
    idImage = null;
    const ecoule = derniereImageMs === null ? 0 : horodatageMs - derniereImageMs;
    derniereImageMs = horodatageMs;
    if (etat && !etat.termine && !enPause) {
      const dus = ticksDus(accumulateur, ecoule, vitesse);
      for (let k = 0; k < dus && !etat.termine; k++) {
        precedentes = prendrePositions(etat);
        tick(etat);
      }
      if (etat.termine) {
        dessiner();
        majPanneauTick();
        majPanneauFin();
        majStatut(`terminé au tick ${etat.tick}`);
        return;
      }
    }
    dessiner();
    if (!enPause) {
      majStatut(`tick ${etat.tick} · ×${vitesse}`);
      idImage = fenetre.requestAnimationFrame(image);
    }
  }

  function demarrerBoucle() {
    if (idImage === null && etat && !etat.termine) {
      derniereImageMs = null; // pas de rattrapage du temps passé arrêté
      idImage = fenetre.requestAnimationFrame(image);
    }
  }

  function arreterBoucle() {
    if (idImage !== null) {
      fenetre.cancelAnimationFrame(idImage);
      idImage = null;
    }
  }

  function mettreEnPause(valeur) {
    if (!etat || etat.termine) return;
    enPause = valeur;
    $('banc-pause').textContent = enPause ? 'Reprendre' : 'Pause';
    if (enPause) {
      arreterBoucle();
      dessiner();
      majPanneauTick();
      majStatut(`pause au tick ${etat.tick}`);
    } else {
      demarrerBoucle();
    }
  }

  // --- actions --------------------------------------------------------------
  function lireParametres() {
    const type = $('banc-type').value;
    return {
      type,
      niveau: Math.min(NIVEAU.plafond, Math.max(1, Number($('banc-niveau').value) | 0)),
      saveur: type === 'base' ? null
        : ($('banc-saveur').value === 'aucune' ? null : $('banc-saveur').value),
      graine: Number($('banc-graine').value) | 0, // saisie, jamais tirée
      // LOT 5A — la composition du joueur est la source de vérité. Le profil
      // ne sert plus qu'au bouton « Remplir ».
      vagues: enVagues(arsenal),
    };
  }

  function lancer(parametres) {
    const b = bilan(arsenal);
    if (estVide(arsenal)) {
      majStatut('Arsenal vide — poser au moins une unité, ou toucher « Remplir »');
      if (!arsenalOuvert) basculerArsenal();
      return;
    }
    if (!b.valide) {
      majStatut(`composition invalide au niveau ${arsenal.niveau} — `
        + 'toucher « Vider » ou corriger à la main');
      if (!arsenalOuvert) basculerArsenal();
      return;
    }
    try {
      montage = montageDuBanc(parametres);
      etat = creerCombat(montage);
    } catch (erreur) {
      majStatut(`montage refusé : ${erreur.message}`);
      return;
    }
    parametresCourants = parametres;
    if (legendeOuverte) basculerLegende();
    accumulateur = creerAccumulateur();
    precedentes = null;
    enPause = false;
    $('banc-pause').textContent = 'Pause';
    $('banc-fin').hidden = true;
    $('banc-tick').innerHTML = '';
    arreterBoucle();
    demarrerBoucle();
  }

  function pasAPas() {
    if (!etat || etat.termine) return;
    if (!enPause) mettreEnPause(true);
    precedentes = prendrePositions(etat);
    tick(etat); // exactement UN tick
    accumulateur.residuMs = 0;
    dessiner();
    majPanneauTick();
    if (etat.termine) {
      majPanneauFin();
      majStatut(`terminé au tick ${etat.tick}`);
    } else {
      majStatut(`pas à pas — tick ${etat.tick}`);
    }
  }

  function choisirVitesse(v) {
    vitesse = v;
    for (const candidate of VITESSES) {
      $(`banc-v${candidate}`).classList.toggle('actif', candidate === v);
    }
  }

  // --- câblage --------------------------------------------------------------
  $('banc-lancer').addEventListener('click', () => lancer(lireParametres()));
  $('banc-rejouer').addEventListener('click', () => {
    // Rejouer reprend les MÊMES paramètres — même graine — et doit rendre
    // exactement le même résultat : la simulation est déterministe de bout
    // en bout, c'est ce que le bouton démontre.
    if (parametresCourants) lancer(parametresCourants);
  });
  $('banc-pause').addEventListener('click', () => mettreEnPause(!enPause));
  $('banc-legende').addEventListener('click', basculerLegende);
  // Au doigt comme à la souris ; passive: false pour empêcher le double
  // événement clic que le navigateur synthétise après un toucher.
  canvas.addEventListener('click', inspecter);
  canvas.addEventListener('touchstart', (evenement) => {
    evenement.preventDefault();
    inspecter(evenement);
  }, { passive: false });
  $('banc-pas').addEventListener('click', pasAPas);
  for (const v of VITESSES) {
    $(`banc-v${v}`).addEventListener('click', () => choisirVitesse(v));
  }
  $('banc-type').addEventListener('change', () => {
    // Une base ne porte pas de saveur : le générateur refuse, le banc prévient.
    $('banc-saveur').disabled = $('banc-type').value === 'base';
  });
  $('banc-arsenal-ouvrir').addEventListener('click', basculerArsenal);
  $('banc-remplir').addEventListener('click', () => {
    // « Remplir » est un CONFORT : il verse une composition de genererAssaut
    // dans la grille, que le joueur corrige ensuite. Ses compositions ne sont
    // pas optimales, et c'est sans conséquence dès lors qu'on peut les reprendre.
    const force = genererAssaut({
      niveau: arsenal.niveau,
      profil: $('banc-assaut').value,
      graine: Number($('banc-graine').value) | 0,
    });
    arsenal = depuisVagues(force.vagues, arsenal.niveau);
    majArsenal();
    majStatut(`rempli — ${force.pointsEngages} / ${force.budgetPoints} points`
      + `${force.profilRespecte ? '' : ' (profil non tenu : aucun châssis débloqué)'}`);
  });
  $('banc-vider').addEventListener('click', () => {
    arsenal = arsenalVide(arsenal.niveau);
    majArsenal();
    majStatut('Arsenal vidé');
  });
  $('banc-niveau').addEventListener('change', () => {
    const niveau = Math.min(NIVEAU.plafond, Math.max(1, Number($('banc-niveau').value) | 0));
    if (niveau === arsenal.niveau) return;
    arsenal = avecNiveau(arsenal, niveau);
    const b = bilan(arsenal);
    majArsenal();
    if (b.valide) return;
    // ⚠ JAMAIS de retrait en silence. On dit ce qui ne va plus, et on propose.
    const raisons = [];
    if (b.verrouillees.length > 0) {
      raisons.push(`${b.verrouillees.length} unité(s) verrouillée(s) au niveau ${niveau} : `
        + [...new Set(b.verrouillees.map((v) => UNITES[v.id].nom.joueur))].join(', '));
    }
    if (b.depassementBudget) {
      raisons.push(`${b.pointsEngages} points pour un budget de ${b.budgetPoints}`);
    }
    if (fenetre.confirm(`Composition invalide au niveau ${niveau} —\n${raisons.join('\n')}\n\n`
      + 'Purger les unités en trop ?')) {
      arsenal = purger(arsenal);
      majArsenal();
      majStatut('composition purgée');
    } else {
      majStatut(`composition invalide : ${raisons.join(' ; ')}`);
    }
  });
  doc.addEventListener('visibilitychange', () => {
    // Un banc d'essai qui tourne dans le vide n'a aucun intérêt — et la pause
    // supprime le cas du rattrapage massif au retour d'onglet.
    if (doc.hidden) mettreEnPause(true);
  });
  // Le ResizeObserver couvre tout ce qui change la taille du canvas — panneau
  // qui se remplit, rotation, clavier virtuel. L'écouteur `resize` reste pour
  // le seul cas qu'il ne voit pas : un changement de devicePixelRatio à taille
  // CSS constante, au passage d'un écran à l'autre.
  if (typeof fenetre.ResizeObserver === 'function') {
    new fenetre.ResizeObserver(() => dimensionner()).observe(canvas);
  }
  fenetre.addEventListener('resize', dimensionner);

  choisirVitesse(1);
  arsenal = arsenalVide(Math.min(NIVEAU.plafond,
    Math.max(1, Number($('banc-niveau').value) | 0)));
  majArsenal();
  dimensionner();
  majStatut('prêt — ouvrir l\'Arsenal pour composer, puis lancer');
}
