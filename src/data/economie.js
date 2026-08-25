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
