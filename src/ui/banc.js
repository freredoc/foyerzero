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
import { genererSite } from '../sim/generateur.js';
import {
  creerAccumulateur, ticksDus, alphaMilli, prendrePositions, VITESSES,
} from '../render/interpolation.js';
import { calculerProjection, caseDepuisPixels } from '../render/projection.js';
import { listeAffichage, listeLegende, classeDe, NOMS_CLASSE } from '../render/scene.js';
import { executer } from '../render/canvas2d.js';

// ---------------------------------------------------------------------------
// Étage pur
// ---------------------------------------------------------------------------

/**
 * Trois compositions d'assaut suffisent au banc : infanterie, blindé lourd,
 * mixte. Des vagues de { id, colonne }, aux cases toutes distinctes — le
 * moteur refuse deux entités bloquantes sur une case d'apparition.
 */
export const PREREGLAGES = {
  infanterie: {
    nom: 'Infanterie',
    vagues: [
      [{ id: 'meute', colonne: 1 }, { id: 'meute', colonne: 3 }, { id: 'meute', colonne: 5 },
        { id: 'meute', colonne: 7 }, { id: 'meute', colonne: 9 }],
      [{ id: 'perceurs', colonne: 2 }, { id: 'perceurs', colonne: 4 },
        { id: 'perceurs', colonne: 6 }, { id: 'perceurs', colonne: 8 }],
      [{ id: 'guetteur', colonne: 3 }, { id: 'guetteur', colonne: 7 },
        { id: 'meute', colonne: 1 }, { id: 'meute', colonne: 9 }],
      [{ id: 'fouisseurs', colonne: 2 }, { id: 'fouisseurs', colonne: 5 },
        { id: 'fouisseurs', colonne: 8 }],
    ],
  },
  blindeLourd: {
    nom: 'Blindé lourd',
    vagues: [
      [{ id: 'fendeur', colonne: 2 }, { id: 'fendeur', colonne: 5 }, { id: 'fendeur', colonne: 8 }],
      [{ id: 'broyeur', colonne: 3 }, { id: 'broyeur', colonne: 7 }],
      [{ id: 'pilon', colonne: 4 }, { id: 'pilon', colonne: 6 }],
    ],
  },
  mixte: {
    nom: 'Mixte',
    vagues: [
      [{ id: 'meute', colonne: 1 }, { id: 'meute', colonne: 5 }, { id: 'meute', colonne: 9 },
        { id: 'carapace', colonne: 3 }, { id: 'carapace', colonne: 7 }],
      [{ id: 'fendeur', colonne: 2 }, { id: 'fendeur', colonne: 8 }, { id: 'belier', colonne: 5 }],
      [{ id: 'crecelle', colonne: 4 }, { id: 'frappeur', colonne: 5 }, { id: 'busard', colonne: 6 }],
      [{ id: 'pilon', colonne: 5 }],
    ],
  },
};

/**
 * Monte le combat du banc : le site vient de genererSite, l'assaut du
 * préréglage. genererSite rend vagues: [] — la force d'assaut est celle du
 * joueur, le générateur de site ne la connaît pas.
 * @param {{ type: string, niveau: number, saveur: string|null, graine: number,
 *   assaut: string }} parametres
 * @returns {object} montage prêt pour creerCombat.
 */
export function montageDuBanc({ type, niveau, saveur, graine, assaut }) {
  const prereglage = PREREGLAGES[assaut];
  if (!prereglage) {
    throw new Error(`banc : préréglage d'assaut inconnu « ${assaut} »`);
  }
  const montage = genererSite({ type, niveau, saveur, graine });
  montage.vagues = prereglage.vagues.map((vague) => vague.map((u) => ({ ...u })));
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
 * (l'attaquant) emploie le vocabulaire d'une armée régulière, l'Ouvrage (la
 * défense entière, unités mobiles comprises) celui des outils et des bêtes.
 */
export function nomAffiche(entite) {
  if (entite.genre === 'batiment') return BATIMENTS[entite.id].nom;
  if (entite.genre === 'defense') return DEFENSES[entite.id].nom;
  const noms = UNITES[entite.id].nom;
  return entite.camp === 'attaque' ? noms.joueur : noms.ouvrage;
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

  /** Inspecteur : une case touchée dit qui l'occupe. */
  function inspecter(evenement) {
    if (legendeOuverte || !etat || !projection) return;
    const cadre = canvas.getBoundingClientRect();
    const point = evenement.touches?.[0] ?? evenement.changedTouches?.[0] ?? evenement;
    const cible = caseDepuisPixels(
      projection, point.clientX - cadre.left, point.clientY - cadre.top,
    );
    if (cible === null) {
      majStatut('hors de la grille');
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
      assaut: $('banc-assaut').value,
    };
  }

  function lancer(parametres) {
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
  dimensionner();
  majStatut('prêt — choisir les paramètres et lancer');
}
