// L'écran de transfert — lot TRANSFERT, 02/09/2026.
//
// ⚠⚠ IL DEMANDE, IL NE DÉCIDE PAS. Toutes les règles — la portée, la taxe, les
// sept refus, la place qui reste — vivent dans `sim/transfert.js` ; ce fichier
// les AFFICHE. Recalculer une taxe ici ferait une seconde vérité, et la première
// divergence se lirait comme un bogue de jeu.
//
// ⚠⚠ IL ANNONCE LE **REÇU**, PAS SEULEMENT L'ENVOYÉ. C'est la seule chose que le
// joueur ne peut pas deviner : la taxe se prend en chemin, et un panneau qui
// n'afficherait que ce qui part la lui ferait découvrir après coup.
//
// ⚠ L'ÉLECTRICITÉ N'EST PAS DANS LA LISTE, et c'est une ABSENCE, pas un bouton
// grisé. Un choix grisé invite à chercher comment le dégriser.

import {
  problemesDuTransfert, apercuDuTransfert, transferer, RESSOURCES_TRANSFERABLES,
} from '../sim/transfert.js';
import { capacitesMilli } from '../sim/economie-base.js';
import { TRANSFERT } from '../data/sites.js';

/** Le millier qui sépare les unités des milli-unités. */
const MILLE = 1000;

/** Ce que dit le bouton armé, en attente de son second toucher. */
export const LIBELLE_CONFIRMER = 'Confirmer ?';

/** Le nom d'une base, tel que le joueur la lit dans les deux listes. */
export function nomDeLaBase(etat, indice) {
  const p = etat.bases[indice].position;
  return `Base ${indice + 1} — ${p.rangee}, ${p.colonne}`;
}

/**
 * Ce que le panneau montre, pour un réglage donné — fonction PURE.
 *
 * ⚠ ELLE REND `null` QUAND IL N'Y A PAS DEUX BASES : le panneau n'a alors rien à
 * dire, et l'appelant le cache. Rendre un bilan vide obligerait l'écran à
 * distinguer « zéro » de « rien ».
 *
 * @returns {{cases: number, taxePct: number, envoye: number, recu: number,
 *   perdu: number, place: number, problemes: Array, possible: boolean}|null}
 */
export function vueDuTransfert(etat, destination, ressource, quantiteUnites) {
  if (etat === null || etat === undefined || etat.bases.length < 2) return null;
  const source = etat.baseCourante;
  const quantiteMilli = Math.round(quantiteUnites * MILLE);
  const problemes = problemesDuTransfert(etat, source, destination, ressource, quantiteMilli);
  const apercu = apercuDuTransfert(etat, source, destination, quantiteMilli);
  const cap = capacitesMilli(etat.bases[destination].disposition)[ressource] ?? 0;
  const stock = etat.bases[destination].economie.ressources[ressource];
  const plafond = stock > cap ? stock : cap;
  return {
    cases: apercu.cases,
    taxePct: apercu.taxePct,
    envoye: Math.floor(apercu.envoyeMilli / MILLE),
    recu: Math.floor(apercu.recuMilli / MILLE),
    perdu: Math.floor(apercu.perduMilli / MILLE),
    place: Math.floor(Math.max(plafond - stock, 0) / MILLE),
    problemes,
    possible: problemes.length === 0,
  };
}

/**
 * Câble le panneau dans une page qui porte le balisage attendu.
 *
 * @param {Document} doc
 * @param {{apresTransfert: () => void}} rappels
 */
export function initialiserPanneauDeTransfert(doc, { apresTransfert } = {}) {
  const $ = (id) => doc.getElementById(id);
  const panneau = $('transfert-panneau');
  const bouton = $('navigation-transfert');
  const listeDestination = $('transfert-destination');
  const listeRessources = $('transfert-ressources');
  const champQuantite = $('transfert-quantite');
  const bilan = $('transfert-bilan');
  const refus = $('transfert-refus');
  const agir = $('transfert-agir');

  let etatCourant = null;
  let ressource = RESSOURCES_TRANSFERABLES[0];
  let destination = null;
  // ⚠ L'ARMEMENT SE DÉFAIT À CHAQUE REPEINT, comme sur l'écran Recherche : un
  // bouton armé dont le nœud a été détruit resterait armé sans être dans la page.
  let arme = false;

  function desarmer() {
    arme = false;
    agir.classList.remove('arme');
    agir.textContent = 'Transférer';
  }

  /** La liste des destinations : toutes les bases SAUF la courante. */
  function garnirLesDestinations() {
    listeDestination.textContent = '';
    for (let i = 0; i < etatCourant.bases.length; i += 1) {
      if (i === etatCourant.baseCourante) continue;
      const option = doc.createElement('option');
      option.value = String(i);
      option.textContent = nomDeLaBase(etatCourant, i);
      listeDestination.appendChild(option);
    }
    // ⚠ LA DESTINATION RETENUE DOIT RESTER VALIDE. Basculer de base, ou en
    // fonder une, change la liste : sans ce rattrapage, le panneau garderait un
    // indice qui désigne maintenant la source, et tous les refus diraient
    // « même base ».
    const possibles = [...listeDestination.options].map((o) => Number(o.value));
    if (!possibles.includes(destination)) destination = possibles[0] ?? null;
    if (destination !== null) listeDestination.value = String(destination);
  }

  function garnirLesRessources() {
    listeRessources.textContent = '';
    for (const r of RESSOURCES_TRANSFERABLES) {
      const b = doc.createElement('button');
      b.type = 'button';
      b.textContent = r;
      b.classList.toggle('choisie', r === ressource);
      b.addEventListener('click', () => {
        ressource = r;
        desarmer();
        peindre(etatCourant);
      });
      listeRessources.appendChild(b);
    }
  }

  function ligneDeBilan(quoi, valeur, classe) {
    const l = doc.createElement('div');
    l.className = classe === undefined ? 'ligne' : `ligne ${classe}`;
    const q = doc.createElement('span');
    q.className = 'quoi';
    q.textContent = quoi;
    const b = doc.createElement('b');
    b.textContent = valeur;
    l.append(q, b);
    return l;
  }

  function peindre(etat) {
    etatCourant = etat;
    if (etat === null || etat === undefined) return;
    // ⚠ LE BOUTON N'EXISTE QU'À DEUX BASES. Sur une partie qui n'en a qu'une, il
    // promettrait un geste qui n'existe pas.
    bouton.hidden = etat.bases.length < 2;
    if (bouton.hidden) {
      panneau.hidden = true;
      return;
    }
    if (panneau.hidden) return;

    $('transfert-source').textContent = nomDeLaBase(etat, etat.baseCourante);
    garnirLesDestinations();
    garnirLesRessources();
    if (destination === null) return;

    const quantite = Number(champQuantite.value) || 0;
    const vue = vueDuTransfert(etat, destination, ressource, quantite);

    bilan.textContent = '';
    bilan.append(
      ligneDeBilan('Distance', `${vue.cases} cases`),
      ligneDeBilan('Taxe', `${vue.taxePct} %`),
      ligneDeBilan('Place à l\'arrivée', String(vue.place)),
      // ⚠ LE REÇU EN DERNIER ET EN GROS : c'est le chiffre qui décide.
      ligneDeBilan('Il arrivera', String(vue.recu), 'recu'),
    );
    refus.textContent = vue.problemes.map((p) => p.message).join(' ; ');
    agir.disabled = !vue.possible;
    if (!vue.possible) desarmer();
  }

  bouton.addEventListener('click', () => {
    panneau.hidden = !panneau.hidden;
    desarmer();
    peindre(etatCourant);
  });
  $('transfert-fermer').addEventListener('click', () => {
    panneau.hidden = true;
    desarmer();
  });
  listeDestination.addEventListener('change', () => {
    destination = Number(listeDestination.value);
    desarmer();
    peindre(etatCourant);
  });
  champQuantite.addEventListener('input', () => {
    desarmer();
    peindre(etatCourant);
  });

  agir.addEventListener('click', () => {
    if (etatCourant === null || destination === null) return;
    const quantiteMilli = Math.round((Number(champQuantite.value) || 0) * MILLE);
    if (!arme) {
      arme = true;
      agir.classList.add('arme');
      agir.textContent = LIBELLE_CONFIRMER;
      return;
    }
    desarmer();
    // ⚠⚠ ON REDEMANDE AVANT D'AGIR. Les stocks bougent dix fois par seconde : ce
    // qui était possible au premier toucher peut ne plus l'être au second, et
    // `transferer` LÈVE sur un refus — une exception non attrapée fige l'écran.
    if (problemesDuTransfert(etatCourant, etatCourant.baseCourante, destination,
      ressource, quantiteMilli).length > 0) {
      peindre(etatCourant);
      return;
    }
    transferer(etatCourant, etatCourant.baseCourante, destination, ressource, quantiteMilli);
    if (apresTransfert !== undefined) apresTransfert();
    peindre(etatCourant);
  });

  return {
    peindre,
    /** Pour la session : le panneau est-il ouvert ? */
    estOuvert: () => !panneau.hidden,
    /** La borne de portée, pour un test qui veut la citer sans la retaper. */
    porteeMaxCases: TRANSFERT.porteeMaxCases,
  };
}
