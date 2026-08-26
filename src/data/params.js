// Paramètres du modèle économique de Chantier.
//
// TOUTES les valeurs de calibrage vivent ici, jamais en dur dans src/sim/.
// Source : MODELE-ECONOMIQUE.md (courbes hyperboliques coût/production,
// coût croisé, plancher d'amorçage), repris dans le brief du lot 1.

// Coût croisé : quartz(n) = C(n)·ρ/(1+ρ), scorie(n) = C(n)/(1+ρ).
// ρ est une constante de la CLASSE du bâtiment. Table extraite du littéral
// pour que les bâtiments la RÉFÉRENCENT au lieu d'en recopier la valeur :
// une seule source de vérité, impossible de la faire diverger en silence.
export const RHO = {
  producteurQuartz: 0.45,
  neutre: 1.2,
  defensif: 1.5,
  producteurScorie: 3.5,
};

export const PARAMS = {
  courbes: {
    // ratio_C(n) = RInfC + (R1c − RInfC) / n — ratio de coût du niveau n vers n+1.
    cout: { R1: 2.4, RInf: 1.7 },
    // ratio_P(n) = RInfP + (R1p − RInfP) / n — ratio de production du niveau n vers n+1.
    production: { R1: 1.45, RInf: 1.12 },
  },

  // Fenêtre de calcul du facteur de temps de retour moyen (test 6).
  facteurTempsRetour: { niveaux: 25 },

  rho: RHO,

  // Plancher d'amorçage : les niveaux 1 à N coûtent 100 % quartz (scorie = 0),
  // sinon rien n'est constructible avant d'avoir pris du terrain contaminé.
  plancherAmorcageNiveaux: 3,

  // Bâtiments du lot 1. echelleCout = coût total du niveau 1 (E), en unités.
  batiments: {
    foreuse: { rho: RHO.producteurQuartz, echelleCout: 20, ressource: 'quartz' },
    decapeuse: { rho: RHO.producteurScorie, echelleCout: 35, ressource: 'scorie' },
  },

  // Colis : un toutes les 5 minutes, 2 en attente maximum, puis arrêt.
  colis: { intervalleMs: 5 * 60 * 1000, maxEnAttente: 2 },

  // Adjacence : bonus constant par voisin qualifiant, ne monte JAMAIS avec le
  // niveau. facteur × P(1), 2 voisins maximum.
  adjacence: { facteur: 0.5, maxVoisins: 2 },

  // Flux continu : production de base d'un bâtiment niveau 1, en MILLI-unités
  // PAR HEURE. Entier obligatoire : toute l'économie par tick est en
  // arithmétique entière pour que le rattrapage analytique soit exact au bit
  // près.
  //
  // ⚠ CETTE VALEUR ÉTAIT EXPRIMÉE PAR TICK (20 milli/tick) jusqu'au lot RÉSIDU.
  // 20 × 36 000 ticks/heure = 720 000 milli/h = 720 unités/h : le niveau 1 est
  // rigoureusement inchangé. Ce qui change, c'est que le débit ne dépend plus
  // de la fréquence du tick — un débit par tick devait être arrondi, et cet
  // arrondi coûtait jusqu'à 0,71 % de production (niveau 3). Le débit horaire
  // s'arrondit une fois par niveau, pour moins d'un millionième de pour cent
  // au-delà du niveau 4.
  //
  // C'est aussi ce qui rend le passage du hors-combat à 1 Hz sans effet sur
  // l'économie : la conversion passe par TICKS_PAR_HEURE de sim/clock.js.
  fluxContinu: { baseMilliParHeureNiveau1: 720_000 },

  // Stockage : capacité par ressource, en milli-unités. Le flux continu
  // s'arrête stockage plein.
  stockage: { capaciteMilli: 10_000_000 },
};
