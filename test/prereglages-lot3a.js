// Les trois préréglages d'assaut FIGÉS du lot 3A — témoin historique.
//
// Des listes d'unités écrites à la main : les mêmes seize Fusiliers au niveau 1
// qu'au niveau 50. Elles ignoraient `POINTS_ARMEE.offense` — 105 points quand le
// budget en vaut 70 au niveau 10, 105 quand il en vaut 220 au niveau 40 — et
// alignaient au niveau 15 des unités verrouillées jusqu'au niveau 32. Toute
// courbe lue au banc mélangeait donc l'effet du niveau, celui d'un budget qui ne
// suivait pas, et celui d'unités que le joueur ne pouvait pas posséder.
//
// Le lot 4B les remplace par `genererAssaut`. Elles ne sont conservées ICI, hors
// de `src/`, que pour mesurer l'écart : le banc hors ligne n'a pas à les
// emporter. Ce fichier n'est pas un `*.test.js` et n'est donc pas exécuté comme
// une suite ; il ne sert qu'à ceux qui l'importent.
//
// À supprimer quand cette comparaison n'intéressera plus personne.

import { genererSite } from '../src/sim/generateur.js';

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

/** Monte un combat du banc avec l'assaut FIGÉ du lot 3A. */
export function montagePreregle({ type, niveau, saveur, graine, assaut }) {
  const prereglage = PREREGLAGES[assaut];
  if (!prereglage) {
    throw new Error(`préréglage d'assaut inconnu « ${assaut} »`);
  }
  const montage = genererSite({ type, niveau, saveur, graine });
  montage.vagues = prereglage.vagues.map((vague) => vague.map((u) => ({ ...u })));
  return montage;
}
