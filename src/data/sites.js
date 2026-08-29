// Données de site et de pression ennemie — transcription figée.
//
// SOURCE UNIQUE : SPEC-FOYER-ZERO.md (24/08/2026), complétée par les feuilles
// SITES-BATIMENTS et SITES-DENSITE de FOYER-ZERO-CALIBRAGE-2.xlsx et par
// FOYER-ZERO-PROPORTIONS-IA.xlsx. Mêmes règles que combat.js : les classeurs
// sont des feuilles de saisie, ce fichier porte les valeurs arbitrées.
//
// Les niveaux de déblocage NE SONT PAS dupliqués ici : ils vivent dans
// UNITES[x].apparition et DEFENSES[x].apparition de combat.js, une seule table
// fait foi. Dupliquer était exactement le défaut C4 de l'audit.

// --- bâtiments de site -------------------------------------------------------
// Deux bâtiments uniques, les autres proportionnels. Le générateur n'a besoin
// que du nombre total de bâtiments : la répartition en découle.
// Le retrait des crédits a supprimé la Raffinerie ; sa part de 0,30 a été
// répartie équitablement, +0,10 sur chacun des trois proportionnels
// (arbitrage du 24/08). Les parts somment à 1,00.
export const BATIMENTS = {
  souche: {
    nom: 'Souche', ta: 'Chantier de construction',
    unique: true, part: null, indiceButin: 1, pv: 5500, // Construction Yard
    ressource: { quartz: 1, scorie: 0 },
    // Sa destruction rase le site et livre tout.
    raseLeSite: true,
  },
  etai: {
    nom: 'Étai', ta: 'Complexe de défense',
    unique: true, part: null, indiceButin: 1, pv: 2500, // Defense Facility
    ressource: { quartz: 1, scorie: 0 },
    // Seul QG qui compte côté Ouvrage. Sa chute empêche définitivement la
    // réparation des défenses du site.
    reparationDefenses: true,
  },
  noeud: {
    nom: 'Nœud', ta: 'Collecteur',
    unique: false, part: 0.4, indiceButin: 2, pv: 1500, // Harvester
    ressource: { quartz: 0.5, scorie: 0.5 },
  },
  gangue: {
    nom: 'Gangue', ta: 'Silo de tiberium',
    unique: false, part: 0.3, indiceButin: 3, pv: 1000, // Silo
    ressource: { quartz: 1, scorie: 0 },
  },
  terril: {
    nom: 'Terril', ta: 'Silo de cristal',
    unique: false, part: 0.3, indiceButin: 3, pv: 1000, // Silo
    ressource: { quartz: 0, scorie: 1 },
  },
};

// --- butin -------------------------------------------------------------------
// Ancrage : 300 au niveau 1 pour un indice de 1. Deux régimes — le début de
// partie est plus doux que l'asymptote ne le laisse croire.
// butin(n) = 300 × indice × 1,259^(min(n,12)−1) × 1,32^(max(n−12,0))
// Le butin est proportionnel aux dégâts : un bâtiment détruit à moitié paie
// la moitié.
export const BUTIN = {
  ancrageNiveau1: 300,
  penteBasse: 1.259, // niveaux 1 → 12
  penteHaute: 1.32, // au-delà de 12 ; c'est aussi la pente des coûts de montée
  niveauBascule: 12,
  proportionnelAuxDegats: true,
};

// --- saveurs de site ---------------------------------------------------------
// Deux variantes de camp et d'avant-poste. Les bases restent proportionnelles
// aux ressources de leurs bâtiments. S'articule avec le verrou croisé : monter
// ses foreuses à quartz coûte de la scorie, donc oblige à taper de la scorie.
export const SAVEURS = {
  richeQuartz: { quartz: 0.75, scorie: 0.25 },
  richeScorie: { quartz: 0.25, scorie: 0.75 },
  base: null, // proportionnelle, aucune inclinaison
};

// --- densité -----------------------------------------------------------------
// Nombre de bâtiments et de défenses par niveau et par type de site.
// Deux régimes : sous le niveau 15 la défense est en retard sur le bâti ;
// au-delà, une défense par bâtiment. Le camp plafonne à 25, l'avant-poste à 35.
// La base est un avant-poste de même niveau + 10 %.
export const DENSITE = {
  facteurBase: 1.1,
  parNiveau: {
    5: { camp: { batiments: 8, defenses: 3 }, avantPoste: { batiments: 10, defenses: 5 } },
    10: { camp: { batiments: 11, defenses: 8 }, avantPoste: { batiments: 13, defenses: 10 } },
    15: { camp: { batiments: 14, defenses: 12 }, avantPoste: { batiments: 19, defenses: 18 } },
    20: { camp: { batiments: 16, defenses: 15 }, avantPoste: { batiments: 24, defenses: 23 } },
    25: { camp: { batiments: 18, defenses: 18 }, avantPoste: { batiments: 28, defenses: 28 } },
    30: { camp: { batiments: 21, defenses: 21 }, avantPoste: { batiments: 31, defenses: 31 } },
    35: { camp: { batiments: 23, defenses: 23 }, avantPoste: { batiments: 33, defenses: 33 } },
    40: { camp: { batiments: 25, defenses: 25 }, avantPoste: { batiments: 35, defenses: 35 } },
    45: { camp: { batiments: 25, defenses: 25 }, avantPoste: { batiments: 35, defenses: 35 } },
    50: { camp: { batiments: 25, defenses: 25 }, avantPoste: { batiments: 35, defenses: 35 } },
  },
};

// --- types de site -----------------------------------------------------------
export const TYPES_SITE = {
  camp: {
    multiplicateurButin: 1, attaqueLeJoueur: false, indexeSur: 'niveauDuJoueur',
    destructionDefinitive: true, respawn: true, role: 'filet de sécurité',
  },
  avantPoste: {
    multiplicateurButin: 3.25, // 3 à 3,5
    attaqueLeJoueur: false, indexeSur: 'rayon',
    destructionDefinitive: true, respawn: true, role: 'revenu',
  },
  base: {
    multiplicateurButin: null, attaqueLeJoueur: true, indexeSur: 'rayon',
    destructionDefinitive: false, reparationHeures: 1, respawn: false,
    role: 'conquête + recherche',
  },
};

// --- composition des garnisons (IA-DEFENSE) ----------------------------------
// Ce qui garnit un camp, un avant-poste ou une base. Unités mobiles et
// structures dans un seul pool : c'est ce que compte DENSITE.defenses.
// Pourcentages, chaque ligne somme à 100. Interpolation entre deux paliers.
// Variance appliquée par le générateur : ±10 points autour de la courbe.
export const GARNISON = {
  variancePoints: 10,
  parNiveau: {
    0: { meute: 100 },
    5: { meute: 75, perceurs: 25 },
    10: { meute: 40, perceurs: 25, merlon: 15, carapace: 10, casemate: 10 },
    15: { meute: 25, perceurs: 15, merlon: 15, carapace: 10, casemate: 15, fendeur: 10, batterie: 10 },
    20: { meute: 10, perceurs: 10, merlon: 10, carapace: 5, casemate: 12, fendeur: 13, batterie: 10, belier: 10, ratisseur: 10, creneau: 5, herse: 5 },
    25: { meute: 5, perceurs: 5, merlon: 5, carapace: 5, casemate: 10, fendeur: 15, batterie: 10, belier: 10, ratisseur: 10, creneau: 5, herse: 5, guetteur: 7, ronce: 8 },
    30: { meute: 5, perceurs: 5, merlon: 5, carapace: 5, casemate: 10, fendeur: 10, batterie: 10, belier: 10, ratisseur: 10, creneau: 5, herse: 5, guetteur: 7, ronce: 5, faucheuse: 2, broyeur: 5, mortier: 1 },
    35: { meute: 4, perceurs: 4, merlon: 5, carapace: 5, casemate: 8, fendeur: 10, batterie: 10, belier: 10, ratisseur: 10, creneau: 5, herse: 5, guetteur: 8, ronce: 5, faucheuse: 3, broyeur: 5, mortier: 2, harpon: 1 },
    40: { meute: 3, perceurs: 3, merlon: 5, carapace: 5, casemate: 8, fendeur: 8, batterie: 10, belier: 10, ratisseur: 10, creneau: 5, herse: 5, guetteur: 8, ronce: 5, faucheuse: 4, broyeur: 6, mortier: 3, harpon: 2 },
    45: { meute: 2, perceurs: 2, merlon: 5, carapace: 5, casemate: 8, fendeur: 5, batterie: 10, belier: 10, ratisseur: 10, creneau: 5, herse: 5, guetteur: 9, ronce: 5, faucheuse: 4, broyeur: 8, mortier: 4, harpon: 3 },
    50: { meute: 1, perceurs: 1, merlon: 5, carapace: 5, casemate: 8, fendeur: 0, batterie: 10, belier: 10, ratisseur: 10, creneau: 5, herse: 5, guetteur: 10, ronce: 5, faucheuse: 5, broyeur: 10, mortier: 5, harpon: 5 },
  },
};

// --- composition des vagues d'attaque (IA-OFFENSE) ---------------------------
// Ce que l'Ouvrage envoie quand une de ses bases attaque le joueur.
// Pourcentages, chaque ligne somme à 100.
export const VAGUES = {
  variancePoints: 10,
  parNiveau: {
    0: { meute: 100 },
    5: { meute: 75, perceurs: 25 },
    10: { meute: 60, perceurs: 25, carapace: 10, crecelle: 5 },
    15: { meute: 40, perceurs: 20, carapace: 12.5, crecelle: 10, fendeur: 10, busard: 7.5 },
    20: { meute: 20, perceurs: 15, carapace: 10, crecelle: 15, fendeur: 15, busard: 10, belier: 5, ratisseur: 5, frappeur: 5 },
    25: { meute: 5, perceurs: 10, carapace: 10, crecelle: 12.5, fendeur: 12.5, busard: 10, belier: 10, ratisseur: 10, frappeur: 10, guetteur: 5, fouisseurs: 5 },
    30: { perceurs: 5, carapace: 5, crecelle: 10, fendeur: 5, busard: 10, belier: 15, ratisseur: 13, frappeur: 15, guetteur: 10, fouisseurs: 7, broyeur: 5 },
    35: { carapace: 5, crecelle: 5, fendeur: 3, busard: 8, belier: 10, ratisseur: 15, frappeur: 15, guetteur: 15, fouisseurs: 9, broyeur: 10, pilon: 5 },
    40: { carapace: 5, crecelle: 5, busard: 5, belier: 7, ratisseur: 13, frappeur: 10, guetteur: 17.5, fouisseurs: 10, broyeur: 12.5, pilon: 10, enclume: 5 },
    45: { carapace: 5, crecelle: 5, busard: 5, belier: 5, ratisseur: 10, frappeur: 10, guetteur: 15, fouisseurs: 10, broyeur: 15, pilon: 10, enclume: 10 },
    50: { crecelle: 5, busard: 5, belier: 5, ratisseur: 10, frappeur: 10, guetteur: 15, fouisseurs: 10, broyeur: 20, pilon: 10, enclume: 10 },
  },
};

// --- raids de l'Ouvrage ------------------------------------------------------
// Seules les bases attaquent, et seulement à partir du niveau 10.
// Budget de points d'armée engagés, par niveau de la base attaquante.
// Ordre des vagues : d'abord anti-infanterie et anti-véhicule, ensuite
// anti-structure — les unités qui s'arrêtent passent devant, celles qui doivent
// arriver avec des munitions passent derrière.
export const RAID_OUVRAGE = {
  niveauMinimal: 10,
  // Chaque minute, chaque base ennemie à portée a 1 chance sur 1440 d'attaquer.
  chanceParMinute: 1 / 1440,
  budgetParNiveau: { 10: 30, 15: 70, 20: 105, 25: 140, 30: 170, 35: 200, 40: 225, 45: 250, 50: 250 },
  ordreCibles: ['centreDeCommandement', 'complexeDeDefense', 'chantierDeConstruction'],
  ordreVagues: ['antiInfanterie', 'antiVehicule', 'antiStructure'],
  // Si le chantier de construction tombe, la base du joueur est rasée :
  // redéploiement 20 cases vers le bas, tout à réparer, ressources stockées
  // perdues. Sanction la plus lourde du jeu, réversible sans être indolore.
  sanctionRasage: { redeploiementCases: 20, perteRessourcesStockees: true },
};

// --- points d'attaque et points d'armée --------------------------------------
export const POINTS_ATTAQUE = {
  // Niveau retenu : celui de la base la plus élevée du joueur.
  plafond: { base: 100, parNiveau: 10 }, // 100 → 600
  regenerationParHeure: { base: 20, parNiveau: 2 }, // 20 → 120
  coutRaid: { fixe: 10, parCaseAllie: 1, parCaseEnnemiOuNeutre: 3 },
  rayonMaximal: 10, // donc 40 points au plus loin
};

// Plafond d'unités CONSTRUCTIBLES PAR BASE, pas par raid. Chaque budget est
// adossé à son bâtiment, qui fixe aussi le niveau maximal des unités de son côté.
export const POINTS_ARMEE = {
  offense: { base: 20, parNiveau: 5, batiment: 'centreDeCommandement' },
  defense: { base: 40, parNiveau: 5, batiment: 'qgDeDefense' },
};

// --- profils d'assaut du joueur ----------------------------------------------
// LOT 4B. Les trois assauts du banc étaient des LISTES D'UNITÉS figées, écrites
// au lot 3A : mêmes seize Fusiliers au niveau 1 qu'au niveau 50. Elles
// dépassaient le budget d'armée en dessous du niveau 15 et n'en utilisaient que
// la moitié au-delà de 25, si bien qu'une courbe de difficulté lue au banc
// mélangeait l'effet du niveau et celui d'un budget qui ne suivait pas.
//
// Un profil n'est donc plus une liste mais des PROPORTIONS DE CHÂSSIS, en
// pour-cent. La composition se redimensionne au budget au lieu d'être tronquée,
// et le CHOIX des unités dans un châssis reste gouverné par `VAGUES.parNiveau` —
// la seule table qui dise quelle unité a sa place à quel niveau. En écrire une
// seconde pour le joueur dupliquerait un barème, ce que les conventions
// interdisent.
//
// Les trois proportions viennent des préréglages du lot 3A, mesurées en POINTS
// d'armée et arrondies au dixième : Infanterie 100 % escouade, Blindé lourd
// 100 % blindé, Mixte 32/41/27 → 30/40/30. Les profils gardent ainsi l'identité
// qu'Ethan leur a donnée ; seule leur taille devient fonction du niveau.
//
// ⚠ Un profil n'est pas toujours honorable. AUCUN blindé n'est débloqué avant le
// niveau 12, AUCUN aéronef avant le 10. En dessous, la part du châssis manquant
// se reporte sur les châssis présents ; si aucun n'est présent — un assault
// blindé au niveau 5 —, le générateur retombe sur la répartition nue et le
// signale par `profilRespecte: false`. Il ne fabrique jamais une unité qui
// n'existe pas encore.
export const PROFILS_ASSAUT = {
  infanterie: { nom: 'Infanterie', chassis: { escouade: 100, blinde: 0, aeronef: 0 } },
  blindeLourd: { nom: 'Blindé lourd', chassis: { escouade: 0, blinde: 100, aeronef: 0 } },
  mixte: { nom: 'Mixte', chassis: { escouade: 30, blinde: 40, aeronef: 30 } },
};

// Plafond STRUCTUREL de l'assaut : quatre vagues de neuf colonnes. Il mord avant
// le budget dès le niveau 32 — 36 emplacements × 5 points l'unité la moins
// chère = 180 ≤ 20 + 5 × 32. Au-delà, un joueur ne peut plus dépenser tout son
// budget d'armée en un seul raid. La spec ne mentionne pas cette contrainte.
export const EMPLACEMENTS_ASSAUT = { vagues: 4, parVague: 9 };

// --- points de recherche -----------------------------------------------------
// Ils ne se produisent pas, ils se prennent sur les défenses détruites.
// Barème au niveau 1, +20 % si le module de la cible est débloqué, et
// proportionnel au pourcentage de PV détruits.
// Casser des murs ne paie pas ; tuer des défenseurs paie.
//
// ⚠ LE BARÈME NE DOUBLE PLUS PAR NIVEAU. Il portait `multiplicateurParNiveau: 2`
// depuis le lot 2B, seule grandeur du jeu à croître en 2^(n−1) quand tout le
// reste suivait 1,259/1,32 — d'où un débordement de l'entier sûr dès le niveau
// 39, consigné et jamais réparé. Arbitré par Ethan le 25/08/2026 : les points de
// recherche sont une récompense ÉCONOMIQUE, ils suivent donc la courbe
// économique, celle de BUTIN ci-dessus. Une table fait foi par grandeur, et il
// n'y a plus de constante ici — `facteurEconomiqueMilli` de sim/combat.js lit
// BUTIN directement.
export const POINTS_RECHERCHE = {
  bonusModuleDebloque: 0.2,
  proportionnelAuxDegats: true,
  parCible: {
    merlon: 2, herse: 2, ronce: 2,
    meute: 10, perceurs: 10,
    carapace: 20, casemate: 20, belier: 20, batterie: 20,
    ratisseur: 25,
    creneau: 30, fendeur: 30, guetteur: 30,
    faucheuse: 40, mortier: 40, harpon: 40,
    broyeur: 60,
  },
};

// --- géographie --------------------------------------------------------------
// Couloir 31 de large × 300 de haut, format téléphone. Le « 9 » de la §10 de la
// spec était une contamination de la largeur de la grille de combat : arbitré
// le 24/08, la carte est un couloir étroit et haut.
//
// ⚠ LA LARGEUR EST PASSÉE DE 30 À 31 LE 29/08, ET C'EST UN CHANGEMENT QUI NE
// DÉPLACE RIEN. Une largeur paire n'a pas de centre : `colonneCentre()` devait
// trancher entre 15 et 16, et avait retenu 16. Avec 31, 16 EST le centre — la
// fonction rend le même nombre, le départ du joueur (275, 16) et la base
// terminale ne bougent pas d'une case, et le commentaire qui expliquait
// l'arbitraire du choix devient sans objet. La colonne ajoutée est la 31e.
// Passer à 29 aurait déplacé le centre en 15, donc TOUT ce qui est déjà arbitré.
export const GEOGRAPHIE = {
  carte: { largeur: 31, hauteur: 300 },
  departJoueur: { strate: 5, casesDepuisBordBas: 25 },
  niveauParCase: 0.2,
  niveauPlafond: 50,
  baseTerminale: { casesDepuisBordHaut: 25, colonne: 'centre' },
  rayonInfluenceJoueur: 2, // fixe
  rayonInfluenceEnnemie: 3, // fixe
  rayonAttaque: 10, // fixe
  niveauBase: 'moyenne des niveaux de ses bâtiments',
  compositionBase: 'deux niveaux adjacents, répartis pour atteindre la moyenne',
  delaiEntreSautsHeures: { depart: 1, niveau50: 24 },
  blocageApresAttaqueHeures: 1,
  blocageApresRasageHeures: 24,
  avantPostesParBaseJoueur: { min: 1, max: 2, niveauRelatif: 1, renouvelables: true },
};

// --- peuplement de la carte --------------------------------------------------
// ARBITRÉ le 29/08/2026 par Ethan : « dans un carré de 12×12, il y a environ 12
// bases ouvrage », « aucune base ouvrage et joueur ne peuvent être côte à côte
// avec une autre base ouvrage joueur, 8 cases autour », « disposition
// irrégulière », et « spawn des bases ouvrage de part et d'autre du joueur,
// base de niveau 1 à 10, à au moins 15 cases du joueur ».
//
// ⚠ `probabiliteCandidate` N'EST PAS LA DENSITÉ, et confondre les deux ferait
// poser presque deux fois trop de bases. C'est la probabilité qu'une case soit
// CANDIDATE ; l'exclusion des huit voisines en élimine ensuite une partie. La
// valeur a été MESURÉE sur quatre graines, pas choisie — moyenne des fenêtres
// 12×12 entièrement hors de la garde :
//
//     p      0,10   0,12   0,14   0,16   0,20
//     bases   9,9   11,1   12,1   12,8   14,0
//
// Un test refait la mesure. ⚠ ET IL LA FAIT HORS DE LA GARDE : une fenêtre prise
// dans le rayon de quinze cases autour du départ porte zéro base, par
// construction. La compter ferait tomber la moyenne à 10,8 et donnerait
// l'impression que le réglage est faux alors qu'il est juste.
//
// ⚠ « ENVIRON 12 » EST UNE MOYENNE, ET L'ÉCART EST LARGE. Sur les fenêtres hors
// garde, le compte va de 4 à 20. C'est le prix de la disposition irrégulière,
// préférée le 29/08 à un pavage régulier qui aurait donné un compte presque
// constant. Un test borne la moyenne, jamais une fenêtre isolée.
//
// ⚠ LA GARDE SE MESURE DEPUIS LA POSITION DE DÉPART, QUI EST FIXE. C'est ce qui
// permet au peuplement de rester entièrement DÉRIVÉ : si la garde suivait la
// base du joueur, les bases apparaîtraient et disparaîtraient à chaque
// redéploiement, et il faudrait les journaliser. Le joueur qui se déplace
// s'approche des bases ; les bases ne s'écartent pas de lui.
//
// ⚠ ET 15, C'EST EXACTEMENT LA DEMI-LARGEUR DU COULOIR. Le joueur part en
// colonne 16 sur 31 : une base à 15 cases peut donc se tenir presque sur sa
// rangée, pourvu qu'elle soit contre un bord. Elle ne l'attaque pas — le rayon
// d'attaque vaut 10 — mais elle est visible dès le premier écran. C'est le sens
// de « de part et d'autre » : la garde est une distance de Tchebychev, pas un
// nombre de rangées.
export const PEUPLEMENT = {
  /** Probabilité qu'une case soit candidate, AVANT exclusion des voisines. */
  probabiliteCandidate: 0.14,

  /** Ce que la probabilité ci-dessus est censée produire, et que le test mesure. */
  basesParDouzeCarre: 12,

  /** Tolérance de la mesure : la moyenne doit tomber dans 12 ± 1. */
  toleranceMesure: 1,

  /**
   * Aucune base de l'Ouvrage à moins de cette distance de la position de
   * DÉPART du joueur. Distance de Tchebychev — le maximum des deux écarts.
   */
  gardeAutourDuDepart: 15,

  /**
   * Le niveau d'une base n'est PAS tiré : il se lit sur sa rangée, comme
   * partout. « De niveau 1 à 10 » sort donc tout seul des rangées basses, sans
   * aucune règle supplémentaire. Ce champ ne sert qu'à documenter que la
   * question a été posée et qu'elle n'appelait pas de code.
   */
  niveauDUneBase: 'celui de sa rangée — voir niveauDeLaRangee()',
};

// --- satellites d'une base du joueur -----------------------------------------
// ARBITRÉ le 29/08/2026 : « 5 min après la pose d'une base joueur ou déplacement
// d'une base joueur, 2 camps et 1 avant-poste ouvrage apparaissent. Respawn
// automatique en cas de destruction camp/AP. » Puis : « camp dans le rayon
// d'influence de la base, 1 à 2 cases », « avant-poste : de 2 à 5 cases ».
//
// ⚠ CECI REMPLACE le « 1 à 2 avant-postes par base du joueur » de la §10 de la
// spec, et `GEOGRAPHIE.avantPostesParBaseJoueur` qui le transcrit. Les deux
// restent au fichier tant que la spec n'est pas repliée, mais c'est CETTE table
// qui fait foi — un test croise les deux et signale la divergence plutôt que de
// la laisser dormir.
//
// ⚠ CES SITES NE SONT PAS SUR LA CARTE, ILS SUIVENT LE JOUEUR. Ils ne se
// dérivent donc pas de la graine seule : leur existence dépend de l'histoire de
// la partie, et c'est le JOURNAL qui les portera. Rien ici ne les pose ; cette
// table dit seulement combien, où, et au bout de combien de temps.
export const SATELLITES = {
  camps: { nombre: 2, anneau: { min: 1, max: 2 } },
  avantPostes: { nombre: 1, anneau: { min: 2, max: 5 } },

  /** Cinq minutes après la pose ou le déplacement de la base. */
  delaiApparitionSec: 300,

  /** Un camp ou un avant-poste détruit réapparaît, sans intervention. */
  respawnAutomatique: true,
};

// --- crans de zoom de la carte -----------------------------------------------
// ARBITRÉ le 29/08/2026, après mesure. Les crans sont donnés en pixels
// PHYSIQUES par case, jamais en pixels CSS : la taille CSS se déduit en
// divisant par `devicePixelRatio`, qui n'est pas une valeur de calibrage.
//
// ⚠ POURQUOI CES QUATRE-LÀ ET PAS D'AUTRES. Une tuile de terrain fait 128 px et
// un emblème est dessiné sur une grille logique de 64. Les quatre crans sont
// des puissances de deux : à chacun, la tuile ET l'emblème restent à un facteur
// d'échelle ENTIER, ce qui est la seule façon de ne pas brouiller du pixel art.
// Un cran intermédiaire à 192 px conviendrait à l'emblème (×3) et pas à la
// tuile (×1,5). Un test le vérifie sur les quatre.
//
// ⚠ LE CRAN LE PLUS BAS EST UNE VUE STRATÉGIQUE, PAS UNE CARTE LUE DE LOIN. À
// 32 px physiques, l'emblème vaut 10,7 px CSS sur un appareil à DPR 3 : une
// pastille. C'est aussi le seul cran qui montre les 31 colonnes à la fois —
// 31 × 10,7 = 331 px CSS, sous les 360 d'un téléphone de 1080 px à DPR 3.
export const ZOOM_CARTE = {
  /** Pixels physiques par case, du plus large au plus serré. */
  crans: [32, 64, 128, 256],

  /** Côté d'une tuile de terrain, en pixels. */
  pixelsParTuile: 128,

  /** Côté de la grille logique d'un emblème, en pixels. */
  grilleEmbleme: 64,
};

// --- disposition des défenses ------------------------------------------------
// ARBITRÉ au lot 2B. Le texte de SITES-DENSITE annonçait 7/9, mais ses deux
// exemples chiffrés — camp 5 à 1 rangée et 33 %, avant-poste 40 à 6 rangées et
// 65 % — n'admettent que 6/9. C'est 6/9 qui fait foi.
//
// Le nombre maximal de rangées n'est PAS dupliqué ici : c'est la hauteur de
// GRILLE.bandes.defense, une seule table fait foi.
export const DISPOSITION_DEFENSES = {
  // Six occupants au plus par rangée de neuf colonnes : trois colonnes libres
  // au minimum, jamais 100 %. Sans passage, le terrain ne décide plus rien.
  occupantsMaxParRangee: 6,

  // Les défenses se collent aux bâtiments : les rangées les plus ARRIÈRE de la
  // bande sont garnies les premières, l'attaquant traverse d'abord du vide.
  versLeFond: true,

  // Ordre de garnissage, du fond vers l'avant.
  //
  // ⚠ CE COMMENTAIRE ÉTAIT FAUX ET A ÉTÉ CORRIGÉ LE 25/08/2026. Il disait :
  // « en rangée 3 [l'artillerie] engagerait entre −2,5 et −0,5, c'est-à-dire
  // jamais. Toute artillerie avancée est inerte. » Le raisonnement est en
  // RANGÉES ; le moteur, lui, teste une distance EUCLIDIENNE 2D et sans
  // direction — `d² = (Δrangée)² + (Δcolonne)²` contre `porteeCarree` et
  // `porteeMiniCarree`. Une Faucheuse en rangée 3 atteint donc les colonnes
  // lointaines dès l'apparition, puis tire dans le dos de ce qui l'a dépassée.
  // Mesuré sur cinq graines au niveau 30 : 23 ticks de tir, premier tir au
  // tick 1. Elle n'est PAS inerte.
  //
  // Ce qui est vrai, et qui suffit à fonder l'ordre : elle engage MOINS. La
  // couverture géométrique sature à partir de la rangée 6 — 50 cases en
  // colonne 5 — et les rangées 3, 4 et 5 tombent à 32, 38 et 45 par
  // débordement de la grille sous la rangée 1. Le gradient dynamique est
  // encore plus marqué : 23 ticks de tir en rangée 3 contre 110 en rangée 10.
  // `src/ui/defense.js` recalcule cette couverture pour en faire un indice
  // montré au joueur, et son T7 la vérifie case par case.
  //
  // Les unités mobiles de garnison s'intercalent entre tourelles et murs : la
  // ligne de murs les couvre, et elles restent devant les tourelles qu'elles
  // protègent. Les barrières viennent en tête, puisqu'on les franchit d'abord.
  ordreCategories: ['artillerie', 'tourelle', 'unite', 'mur', 'barriere'],

  // Écart maximal de charge entre la colonne la plus garnie et la moins garnie.
  // Les unités ne changent jamais de colonne : une colonne à huit structures
  // serait infranchissable et une colonne vide une autoroute.
  ecartColonnesMax: 2,
};
