// Courbe de niveau des statistiques de combat — transcription figée.
//
// SOURCE : arbitrage du lot 2B. Les PV et les dégâts croissent comme le butin
// et les coûts : mêmes pentes, même bascule. C'est une DÉCISION, pas une
// coïncidence — mais les deux grandeurs restent distinctes, et un test assied
// leur égalité pour qu'une divergence future soit délibérée et visible plutôt
// que silencieuse (voir test/generateur.test.js, T10).
//
// Ne montent PAS avec le niveau : réserve, portée, portée minimale, vitesse,
// masse, points d'armée, cadence. Un test le vérifie ligne à ligne — sans lui,
// la première mise à l'échelle distraite les emporterait.

export const NIVEAU = {
  // ⚠ À CONFIRMER PAR ETHAN.
  //   true  — deux régimes : penteBasse jusqu'à la bascule, penteHaute ensuite.
  //           Au niveau 50, × 480 942.
  //   false — penteHaute partout. Au niveau 50, × 809 324.
  // Le drapeau existe pour que le choix soit UNE LIGNE, pas une réécriture.
  deuxRegimes: true,

  penteBasse: 1.259, // niveaux 1 → 12
  penteHaute: 1.32, // au-delà de la bascule ; aussi la pente des coûts de montée
  niveauBascule: 12,

  // Plafond de niveau du jeu. Même valeur que GEOGRAPHIE.niveauPlafond de
  // sites.js, et un test l'assied : deux tables qui parlent du même plafond ne
  // doivent jamais pouvoir diverger en silence.
  plafond: 50,
};
