// L'écran Offense — les quatre vagues d'un raid.
//
// ⚠ C'EST UNE COQUILLE, ET ELLE SE DIT COQUILLE. L'état du joueur ne porte pas
// d'armée : `serialiser` de `sim/state.js` écrit `position`, `fondation`,
// `disposition` et `economie`, et rien d'autre. `ui/arsenal.js` est un ÉDITEUR
// dont la sortie n'est sauvegardée nulle part — il sert le banc d'essai, pas la
// partie. Composer une armée ici demanderait d'inventer la forme de cet état,
// c'est-à-dire de trancher seul une décision qu'Ethan n'a pas prise.
//
// Alors on montre la place exacte que la composition prendra — trente-six
// emplacements, quatre vagues de neuf — vides, et on écrit qu'elle n'existe pas
// encore. C'est le même parti que les trois boutons d'action de l'écran
// Chantier : présents et désactivés, parce que montrés vifs ils mentiraient et
// absents ils feraient croire à un écran fini.
//
// ⚠ RIEN N'EST ÉCRIT EN DUR ICI NON PLUS. Le nombre de vagues et de colonnes
// vient d'`EMPLACEMENTS_ASSAUT` via `ui/arsenal.js`, qui les lit déjà ;
// l'intervalle entre deux vagues vient de `GRILLE`. Une seconde table dirait un
// jour autre chose que la première.

import { GRILLE, UNITES } from '../data/combat.js';
import { NB_VAGUES, NB_COLONNES, NB_EMPLACEMENTS } from './arsenal.js';

/**
 * Le titre d'une vague, et le retard avec lequel elle part.
 *
 * La première vague part à l'instant zéro ; chaque suivante part
 * `GRILLE.intervalleVagueSec` plus tard que la précédente. Le retard s'affiche
 * sur le titre, parce que c'est la seule chose qui distingue les quatre rangées
 * les unes des autres tant qu'elles sont vides.
 *
 * ⚠ L'INTERVALLE EST LU, PAS RECOPIÉ D'UNE CAPTURE. La capture de référence
 * fournie avec l'amendement affiche « +10 s » ; `GRILLE.intervalleVagueSec` vaut
 * **5**. C'est un autre jeu, et c'est la table du dépôt qui fait foi. L'écart
 * est signalé au rapport plutôt que tranché ici.
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
 * Les unités que la palette montre, avec leur coût en points d'armée.
 *
 * ⚠ TOUTES LES UNITÉS, ET NON CELLES D'UN NIVEAU. `unitesDisponibles(niveau)` de
 * `ui/arsenal.js` filtrerait sur `apparition <= niveau` — mais le joueur n'A PAS
 * de niveau d'armée : c'est l'un des deux niveaux que `sim/` ne porte pas.
 * Choisir un niveau pour pouvoir filtrer reviendrait à en inventer un. La
 * palette montre donc le roster entier, désactivé, et l'écran dit pourquoi.
 *
 * ⚠ `nom.joueur`, JAMAIS `nom.ouvrage`. C'est un panneau du joueur : il y emploie
 * le vocabulaire d'une armée régulière. Les deux jeux de noms ne se mélangent
 * pas dans une chaîne affichée (CLAUDE.md §4).
 *
 * @returns {Array<{id: string, nom: string, points: number}>}
 */
export function unitesDeLaPalette() {
  return Object.entries(UNITES).map(([id, u]) => ({ id, nom: u.nom.joueur, points: u.points }));
}

/**
 * Câble l'écran Offense dans une page qui porte le balisage attendu.
 *
 * Il n'a rien à rafraîchir : tant qu'aucune armée n'existe, rien de ce qu'il
 * montre ne change avec le temps. Il se construit une fois, et c'est tout.
 *
 * @param {Document} doc
 */
export function initialiserEcranOffense(doc) {
  const $ = (id) => doc.getElementById(id);

  // ⚠ L'EN-TÊTE DE CET ÉCRAN A DISPARU LE 28/08, et ses deux chiffres avec.
  // Il portait « Niv. armée — » et « Points 0 / — » ; les onglets et le bandeau
  // des ressources sont devenus COMMUNS aux trois écrans, et c'est le compteur
  // de ce bandeau qui dit maintenant « Pts off. — » quand on est ici. Deux
  // endroits pour la même absence, c'était un de trop.
  // Voir `compteurDeContexte` dans `ui/chantier.js`.

  // --- les quatre vagues ----------------------------------------------------
  const corps = $('offense-vagues');
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
      rangee.appendChild(emplacement);
    }
    bloc.appendChild(rangee);
    corps.appendChild(bloc);
  }

  // --- la palette, présente et désactivée -----------------------------------
  const palette = $('offense-palette');
  palette.textContent = '';
  for (const unite of unitesDeLaPalette()) {
    const bouton = doc.createElement('button');
    bouton.type = 'button';
    bouton.className = 'unite';
    bouton.disabled = true;
    bouton.title = `${unite.nom} — ${unite.points} points d'armée`;
    const nom = doc.createElement('b');
    nom.textContent = unite.nom;
    const cout = doc.createElement('span');
    cout.className = 'cout';
    cout.textContent = `${unite.points} pts`;
    bouton.append(nom, cout);
    palette.appendChild(bouton);
  }

  return { nbEmplacements: NB_EMPLACEMENTS };
}
