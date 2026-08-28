// Courbe économique des coûts et de la production — transcription figée.
//
// SOURCE : arbitrages d'Ethan du 25/08/2026, onglet EFFETS du classeur
// FOYER-ZERO-BATIMENTS-JOUEUR.xlsx.
//
// POURQUOI CE FICHIER EXISTE. Jusqu'ici `NIVEAU.penteHaute` de niveaux.js
// servait DEUX grandeurs : la mise à l'échelle du combat ET la pente des coûts
// de montée. Elles valaient 1,32 toutes les deux, donc la confusion ne coûtait
// rien et ne se voyait pas. Elles divergent maintenant — le combat passe à une
// pente unique de 1,1, l'économie reste à 1,32 — et une constante ne peut plus
// porter les deux. CLAUDE.md §4 : une table fait foi par grandeur. Séparer les
// fichiers rend la distinction structurelle plutôt que déclarative.

export const ECONOMIE_NIVEAU = {
  // Le niveau 1 est gratuit pour tout bâtiment. Le premier coût est celui du
  // niveau 2, et il dépend de la classe du bâtiment — voir BASE.classeDeCout.
  premierNiveauPayant: 2,

  // Ratios de coût, du niveau (index + 2) vers le suivant. Dix valeurs, puis
  // la pente stable. Ils ne sont PAS ronds : ils restituent une table relevée.
  //   8 → 10 → 20 → 80 → 440 → 1 440 → 4 400 → 12 800 → 35 200 → 89 600 → 192 000
  ratios: [
    1.25, // 2 → 3
    2, // 3 → 4
    4, // 4 → 5
    5.5, // 5 → 6
    36 / 11, // 6 → 7    ≈ 3,2727
    55 / 18, // 7 → 8    ≈ 3,0556
    32 / 11, // 8 → 9    ≈ 2,9091
    2.75, // 9 → 10
    28 / 11, // 10 → 11  ≈ 2,5455
    15 / 7, // 11 → 12   ≈ 2,1429
  ],

  // Au-delà du douzième niveau, une pente unique. C'est l'ancienne
  // `NIVEAU.penteHaute`, désormais chez elle.
  penteStable: 1.32,

  // Production d'un bâtiment : × 1,25 par niveau, sans rupture, sur les
  // cinquante niveaux. Volontairement plus plate que la pente des coûts : sur
  // les 38 niveaux qui séparent 12 de 50, une amélioration finit par coûter
  // 7,9 fois plus d'heures de production qu'au départ. Le jeu pousse donc vers
  // le raid, dont le butin suit la pente des coûts, et non vers l'attente.
  penteProduction: 1.25,
};

// ---------------------------------------------------------------------------
// La rampe elle-même — une seule implémentation, pour deux familles de coûts
// ---------------------------------------------------------------------------
//
// ⚠ CETTE BOUCLE VIVAIT DANS `data/base.js`, EN PRIVÉ, ET ELLE Y ÉTAIT SEULE.
// Elle est remontée ici le 28/08 quand la défense et l'offense ont reçu leurs
// ancres : la recopier à côté aurait fait DEUX implémentations de la même
// rampe, et la première divergence — un arrondi déplacé, un rang décalé — se
// serait lue comme un déséquilibre de jeu, pas comme un défaut de programme.
// Ce qui change de famille en famille, c'est l'ANCRE ; la rampe, jamais.
//
// L'ARRONDI SE FAIT À CHAQUE PALIER, et ce n'est pas un détail de style : les
// ratios ci-dessus ne sont pas ronds (36/11, 55/18, 32/11, 28/11, 15/7) et le
// produit flottant rate la table relevée — 440 × 36/11 rend 1 439,999 999 999
// 999 8. Arrondir une seule fois à la fin ferait diverger la chaîne dès le
// sixième palier.

/**
 * Le montant d'un palier, dans l'unité de la ressource principale, hors
 * électricité. C'est l'ancre du niveau 2 prolongée par la courbe.
 *
 * ⚠ L'ARGUMENT EST LE NIVEAU QU'ON ATTEINT, PAS CELUI D'OÙ L'ON PART.
 * `montantDuPalier(8, 2)` vaut 8 — le prix du passage de 1 à 2. La boucle ne
 * tourne pas au niveau 2, ce qui est exactement ce qu'on veut : l'ancre EST le
 * premier palier.
 *
 * Aucune borne n'est vérifiée ici — c'est le rôle de l'appelant, qui seul sait
 * à quelle table appartient l'entité et donc quel plafond lui opposer.
 *
 * @param {number} ancre le coût du niveau 2, entier
 * @param {number} niveau le niveau ATTEINT, ≥ `premierNiveauPayant`
 * @returns {number} entier
 */
export function montantDuPalier(ancre, niveau) {
  const { ratios, penteStable, premierNiveauPayant } = ECONOMIE_NIVEAU;
  let montant = ancre;
  for (let n = premierNiveauPayant + 1; n <= niveau; n++) {
    const rang = n - premierNiveauPayant - 1;
    montant = Math.round(montant * (rang < ratios.length ? ratios[rang] : penteStable));
  }
  return montant;
}
