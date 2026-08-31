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
    // Sa destruction rase le site et livre CE QUI RESTE À LIVRER — arbitré par
    // Ethan le 29/08/2026. Un bâtiment déjà entamé a déjà payé sa part ; le
    // rasage solde le reste, il ne repaie pas le plein nominal.
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

// --- après-raid : planchers et réparation -------------------------------------
// Transcrit de `MODELE-REPARATION-1.md`, dicté par Ethan le 24/08/2026. Ce
// document REMPLACE le plancher de 1 % et la réparation de 70 % de la spec.
//
// ⚠ LE PLANCHER EST PLAT, ET LA RAISON EST MÉCANIQUE : les dégâts d'une pièce
// sont proportionnels à ses PV restants. Une Casemate à 1 % de 350 PV tire
// encore cinq fois plus fort qu'à 1 PV. À 1 PV, c'est un sac à points de vie,
// littéralement — ce qui est exactement le rôle voulu.
//
// ⚠ QUI PLANCHE ET QUI MEURT NE SE RANGE PAS ICI, parce que ce n'est pas une
// valeur : c'est une règle par type de site, et elle vit dans
// `sim/site-entame.js`. En deux mots : sur une BASE tout planche sauf la
// Souche ; dans un camp ou un avant-poste, rien ne planche et tout ce qui tombe
// est perdu pour toujours.
export const APRES_RAID = {
  plancherPvMilli: 1000, // 1 PV plat — et 1 PV vaut 1 000 milli-PV
  // L'horloge de l'Étai, qui répare les défenses SURVIVANTES d'un camp ou d'un
  // avant-poste. Celle d'une base entière est `TYPES_SITE.base.reparationHeures`
  // — deux sujets différents, la même heure aujourd'hui.
  reparationDefensesHeures: 1,
};

// --- réparation de l'armée ----------------------------------------------------
// Transcrit de `RELEVE-TA-COURBES-2.md` §4, où la formule restitue les sept
// points de la série Caserne à 0,02 %, et de `MODELE-ECONOMIQUE.md` §7 pour le
// parallélisme des réservoirs.
//
//     T(L, C) = base_unité × 1,15^(L−1) / D(C)
//     D(C)    = 1,09^(min(C,12)−1) × 1,12^max(C−12, 0)
//
// ⚠ LA BASE PAR UNITÉ N'EST PAS ICI : elle est déjà dans `data/combat.js`, champ
// `reparation`, en secondes — 441 pour les Fusiliers, 1 605 pour l'Enclume. Elle
// n'est PAS proportionnelle aux PV, c'est une donnée par unité.
//
// ⚠ LA RUPTURE DU DIVISEUR EST AU NIVEAU 12, PAS AU 11. Quatre autres systèmes
// changent de régime au 11 ; celui-ci fait exception, et le relevé le mesure.
export const REPARATION = {
  penteNiveauUnite: 1.15,
  diviseurBatiment: { penteBasse: 1.09, penteHaute: 1.12, niveauRupture: 12 },
  // ⚠ CE NOMBRE-CI EST LE SEUL DU BLOC QUI NE VIENNE PAS D'UN RELEVÉ.
  // `MODELE-REPARATION-1.md` §3 dit que le coût se paie en scorie et qu'il est
  // indexé sur le niveau de l'unité, « et rien d'autre » — sans donner d'ancre.
  // Retenu : réparer une unité DE FOND EN COMBLE coûte ce que sa dernière montée
  // a coûté. À arbitrer.
  partDuCoutDeMontee: 1,
};

// --- points d'attaque et points d'armée --------------------------------------
// ⚠ CETTE TABLE N'A CHANGÉ DE VALEUR NULLE PART LE 29/08, et c'est le fait le
// plus utile à retenir du lot POINTS-D'ATTAQUE : le plafond, la régénération, le
// coût du raid et le rayon disaient déjà, depuis le relevé de Tiberium
// Alliances, ce qu'Ethan a redicté ce jour-là. Deux choses seulement ont bougé,
// et aucune n'est un nombre :
//   — LE NIVEAU RETENU. C'était « la base la plus élevée du joueur », c'est
//     désormais LE NIVEAU D'ARMÉE le plus élevé, en dixièmes, donc 1 point de
//     plafond par dixième : une armée moyenne au niveau 5,8 vaut 158, chiffre
//     donné par Ethan lui-même.
//   — LA FORME DE LA RÉGÉNÉRATION, pas son débit. `20 + 2 × niveau` EST
//     exactement 20 % du plafond, à tous les niveaux — 100 → 20, 600 → 120 —, et
//     c'est cette lecture-là qui est écrite ici parce qu'elle tient en un
//     nombre et qu'elle dit la propriété qui compte : le plein se fait en cinq
//     heures, quel que soit le plafond. Un 10 % dicté le 29/08 a été essayé
//     puis retiré le même soir, la table ayant raison.
// Et une chose est venue s'ajouter : LE PLAFOND EST À CLIQUET. Il ne redescend
// jamais, même si l'armée est démantelée. Le cliquet ne se range pas ici — ce
// n'est pas une valeur de calibrage mais une règle —, il vit dans
// `sim/points-attaque.js`.
export const POINTS_ATTAQUE = {
  // Niveau retenu : le NIVEAU D'ARMÉE le plus élevé du joueur, en dixièmes.
  plafond: { base: 100, parNiveau: 10 }, // 100 → 600
  regenerationParHeure: { partDuPlafondPourCent: 20 }, // 20 → 120, plein en 5 h
  coutRaid: { fixe: 10, parCaseAllie: 1, parCaseEnnemiOuNeutre: 3 },
  // ⚠ PAS DE `rayonMaximal` ICI. Il en portait un, à 10, qui doublait
  // `GEOGRAPHIE.rayonAttaque` juste en dessous. Une seule table par grandeur :
  // le barème lit le rayon là-bas, et 40 points au plus loin s'en déduit.
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
  // ⚠⚠ LE DÉPART A GLISSÉ VERS LE BORD BAS LE 31/08 — arbitré par Ethan :
  // « décaler la base du joueur de 25 cases vers le bas », puis, une fois les
  // deux conventions confrontées, « comptés depuis mon bord : 295 ». Il était à
  // 25 cases du bord bas (rangée 275, strate 5) ; il est à CINQ (rangée 295).
  //
  // ⚠ LA STRATE SUIT, ELLE NE SE CHOISIT PAS. Elle vaut
  // `round(casesDepuisBordBas × niveauParCase)`, plancher à 1 : 5 × 0,2 = 1. Les
  // deux champs restent donc liés, et `test/carte.test.js` les confronte comme
  // avant. Écrire 5 ici ferait mentir la table sur ce que le joueur trouve
  // autour de lui.
  //
  // ⚠ ET LE JOUEUR NE DÉMARRE TOUJOURS PAS SUR LE BORD LUI-MÊME. Cinq cases de
  // marge lui laissent ses anneaux de satellites — l'avant-poste va jusqu'à cinq
  // cases — sans que la moitié tombe hors carte.
  departJoueur: { strate: 1, casesDepuisBordBas: 5 },
  niveauParCase: 0.2,
  niveauPlafond: 50,
  // ⚠⚠ ET LA TERMINALE EST MONTÉE D'AUTANT — même arbitrage : « base terminale
  // 25 cases vers le haut », lue « rangée 15 ». Elle était à 25 cases du bord
  // haut (rangée 26), elle est à QUATORZE (rangée 15).
  //
  // ⚠ ELLE NE PEUT PAS ALLER PLUS HAUT QUE LA RANGÉE 2, ET C'EST MESURÉ. Elle se
  // dessine en hexagone sur 3 × 3 cases depuis le 30/08 ; `empriseDeLaGrosseBase`
  // LÈVE quand le carré déborde la carte, et une levée dans la boucle de dessin
  // viderait tout l'écran Monde. La rangée 15 tient largement.
  baseTerminale: { casesDepuisBordHaut: 14, colonne: 'centre' },
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

// --- les points d'intérêt de la carte ----------------------------------------
// ARBITRÉ le 31/08/2026 par Ethan : « chaque POI vaut +10 %, fixe », « le niveau
// du POI ne change pas ce qu'il donne — il dit seulement où il se trouve sur la
// carte, donc à quel prix on va le chercher », « les POI d'un même type
// s'additionnent », et « à partir du moment où un POI rentre dans le territoire
// du joueur, il est acquis définitivement ». Puis, sur leur répartition : « les
// mettre à droite et à gauche, comme les bases Ouvrage ».
//
// ⚠⚠ UN SEUL ENDROIT FAIT FOI. Les identifiants, les noms affichés, les sprites
// et les effets se lisent tous ICI. `EMBLEMES_CARTE` reprend le `nom` de cette
// table plutôt que de le récrire, et `render/embleme.js` y lit le `sprite` :
// deux tables qui portent le même nom d'affichage divergeraient au premier
// renommage, et le joueur verrait deux libellés pour le même gisement.
//
// ⚠⚠ LE BONUS EST EN POUR-CENT ENTIERS, JAMAIS EN FACTEUR FLOTTANT. Toute
// l'arithmétique en aval est entière — milli-unités pour l'économie, milli-PV
// pour le combat — et c'est ce qui rend le rattrapage hors ligne STRICTEMENT
// égal au tick à tick. Un `1.1` écrit ici ferait diverger les deux chemins, et
// la divergence serait invisible sur les petits nombres.
//
// ⚠ ILS S'ADDITIONNENT, ILS NE SE MULTIPLIENT PAS. Les dix veines de quartz
// réunies font +100 %, pas +159 %. C'est dit par Ethan, et c'est aussi la seule
// composition qui reste exacte en entiers.
//
// ⚠ LE NIVEAU D'UN POI N'EST PAS UN CALIBRAGE, C'EST UNE POSITION. Il n'y a donc
// aucune courbe ici : la bande (1 à 10) se lit sur la rangée, par
// `niveauDeLaRangee` de `sim/carte.js`, et rien d'autre ne la dit.
//
// ⚠ LA CORRESPONDANCE SPRITE ↔ RÔLE N'EST PAS DEVINÉE. Elle est celle
// d'`INVENTAIRE-SPRITES.md` §6.2, confrontée aux images le 31/08 : cristal
// blanc-gris, dépôt vitrifié à fissures orangées, cuve à anneau de
// refroidissement, baraquements à accent blanc, dalle à accent rouge, cercle
// d'appontage à accent jaune, enceinte massive sans accent. Les trois accents
// suivent la règle absolue du §3 de l'inventaire — blanc = infanterie,
// rouge = véhicule, jaune = aérien —, et c'est ce qui dit au joueur, sans texte,
// quelle branche le POI renforce.
export const POI = {
  poiQuartz: {
    nom: 'Veine de quartz',
    sprite: 'poi_ressource_a',
    bonusPct: 10,
    ressource: 'quartz',
    chassis: null,
    defense: false,
    libelleEffet: 'de production de quartz',
  },
  poiScorie: {
    nom: 'Coulée de scorie',
    sprite: 'poi_ressource_b',
    bonusPct: 10,
    ressource: 'scorie',
    chassis: null,
    defense: false,
    libelleEffet: 'de production de scorie',
  },
  poiEnergie: {
    nom: 'Réacteur',
    sprite: 'poi_reacteur',
    bonusPct: 10,
    ressource: 'electricite',
    chassis: null,
    defense: false,
    libelleEffet: 'de production d\'électricité',
  },
  poiCantonnement: {
    nom: 'Cantonnement',
    sprite: 'poi_bonus_a',
    bonusPct: 10,
    ressource: null,
    chassis: 'escouade',
    defense: false,
    libelleEffet: 'de dégâts aux escouades à l\'assaut',
  },
  poiParcRoulant: {
    nom: 'Parc roulant',
    sprite: 'poi_bonus_b',
    bonusPct: 10,
    ressource: null,
    chassis: 'blinde',
    defense: false,
    libelleEffet: 'de dégâts aux blindés à l\'assaut',
  },
  poiPlotAerien: {
    nom: 'Plot aérien',
    sprite: 'poi_bonus_c',
    bonusPct: 10,
    ressource: null,
    chassis: 'aeronef',
    defense: false,
    libelleEffet: 'de dégâts aux aéronefs à l\'assaut',
  },
  poiRedoute: {
    nom: 'Redoute',
    sprite: 'poi_bonus_d',
    bonusPct: 10,
    ressource: null,
    chassis: null,
    defense: true,
    libelleEffet: 'de dégâts à toute la défense',
  },
};

/**
 * Combien de niveaux de carte tient une bande de POI.
 *
 * ⚠ SEPT POI PAR BANDE, DIX BANDES, SOIXANTE-DIX EN TOUT — et le compte se
 * DÉRIVE : `niveauPlafond / NIVEAUX_PAR_BANDE`. Écrire « 10 » ici en ferait une
 * seconde vérité, la première à mentir le jour où le plafond bougera.
 */
export const NIVEAUX_PAR_BANDE = 5;

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

  // --- la relève : un satellite qu'on ignore finit par changer de place -------
  // ARBITRÉ le 31/08/2026 par Ethan : « vérifier que les camps et avant-poste
  // change de spawn aléatoirement si personne ne les attaque ; un camp /
  // avant-poste attaqué, lui, reste plus longtemps — je dirais quelques heures
  // de plus — avant d'être respawn ».
  //
  // ⚠ LA VÉRIFICATION A ÉTÉ FAITE, ET LA RÉPONSE ÉTAIT NON : avant ce lot, un
  // satellite posé ne bougeait JAMAIS. `planifierSatellites` les programmait une
  // fois, `resoudreSatellites` les posait, et plus rien ne les touchait — seule
  // une destruction en raid les faisait réapparaître ailleurs.
  //
  // ⚠⚠ LES DEUX DURÉES SONT UN CHOIX, PAS UNE MESURE, ET IL FAUT LE SAVOIR.
  // Ethan a donné le SENS (« quelques heures de plus ») et pas les nombres. Six
  // heures de vie tiennent la promesse « si tu l'ignores, il bouge » sans que la
  // carte s'agite sous les yeux du joueur ; quatre heures de sursis sont les
  // « quelques heures » de la consigne. Les deux se changent d'une ligne, et le
  // rapport du lot le dit comme tel.
  //
  // ⚠ LE SURSIS SE COMPTE DEPUIS LE RAID, PAS DEPUIS LA POSE. « Reste plus
  // longtemps avant d'être respawn » parle du moment où on l'a attaqué : un camp
  // attaqué à sa dernière minute de vie doit gagner du temps, sinon la règle ne
  // sert précisément pas dans le cas où le joueur y revient.
  dureeDeVieSec: 21600, // 6 h
  sursisApresAttaqueSec: 14400, // 4 h de plus, comptées depuis le raid
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

  /** Côté d'une tuile de terrain dans l'atlas, en pixels SOURCE. */
  coteTuile: 128,

  // ⚠⚠ QUATRE TUILES PAR CASE — 2 PAR AXE —, ET C'EST LE CORRECTIF DU « GROS
  // CARRÉ MOCHE » RAPPORTÉ PAR ETHAN LE 30/08. Une tuile faisait exactement une
  // case : une case valait donc 128 pixels source, et au cran le plus serré
  // (256 px par case) le pavage AGRANDISSAIT sa source d'un facteur deux. Or
  // l'art de l'atlas a un grain de 4 pixels source — mesuré, pas supposé —, si
  // bien que ce grain se lisait à l'écran en carrés de huit pixels, alignés sur
  // les axes. C'est ce qu'on voyait.
  //
  // À deux tuiles par axe, une case vaut 256 pixels source : le cran 256 tombe
  // au rapport 1:1 et les trois autres RÉDUISENT. Plus aucun agrandissement,
  // donc plus de carré.
  //
  // ⚠ ET ÇA NE COÛTE NI UN OCTET NI UNE MILLISECONDE. L'atlas ne bouge pas —
  // c'est le MÊME fichier, lu à une autre échelle — donc la carte ne quadruple
  // pas, ce qu'Ethan redoutait en proposant de « redécouper les planches ». Le
  // temps de rendu ne bouge pas non plus : le pas du réseau est lui aussi en
  // pixels source, si bien que le nombre de tuiles qui se superposent SUR UN
  // PIXEL D'ÉCRAN vaut `(coteTuile / pasSourcePx)²` quelle que soit l'échelle.
  // Mesuré à la livraison, pas déduit.
  //
  // ⚠ IL DIVISE LES CRANS, ET UN TEST L'EXIGE. Un nombre qui ne diviserait pas
  // 32 rendrait une tuile d'écran fractionnaire au cran le plus large, donc du
  // pixel art brouillé — exactement ce que la note des crans refuse plus haut.
  tuilesParCase: 2,

  /** Côté de la grille logique d'un emblème, en pixels. */
  grilleEmbleme: 64,
};

/**
 * Le côté d'une case de la carte, en pixels SOURCE de l'atlas de terrain.
 *
 * ⚠ IL SE CALCULE, IL NE S'ÉCRIT PAS. C'est le produit des deux nombres
 * ci-dessus, et une troisième constante qui vaudrait 256 serait la seconde
 * vérité que CLAUDE.md §4 interdit — la première à mentir le jour où l'un des
 * deux facteurs bougera.
 */
export const PIXELS_SOURCE_PAR_CASE = ZOOM_CARTE.coteTuile * ZOOM_CARTE.tuilesParCase;

// --- le pavage du fond de carte ----------------------------------------------
// Le fond de la carte n'est PAS une case répétée : c'est un semis de tuiles
// posées sur un réseau plus serré qu'une case, chacune décalée, tournée,
// éventuellement retournée, et fondue dans les autres par un masque. C'est ce
// qui fait disparaître la grille — aucune tuile n'est alignée sur une case,
// donc aucun bord ne se répète à intervalle régulier.
//
// ⚠ LE PAS EST PLUS PETIT QUE LA TUILE, ET C'EST CE QUI BOUCHE LES TROUS. Le
// masque tombe à zéro au bord d'une tuile : à 84 px de pas avec du décalage,
// des pixels ne sont couverts par AUCUNE tuile et rendent du noir. À 56 px, la
// tuile de 128 déborde de 72 px sur ses voisines et la couverture ne peut plus
// s'annuler. Le rendu garde tout de même un plancher — jamais de noir, la
// teinte moyenne — parce qu'une garde qui ne mord jamais coûte moins cher
// qu'un carré noir livré.
//
// ⚠ LE DÉCALAGE EST UNE FRACTION DU PAS, PAS UN NOMBRE DE PIXELS. Écrit en
// pixels, il faudrait le reprendre le jour où le pas bouge, et personne n'y
// penserait : le semis se remettrait à s'aligner sans qu'un test tombe.
export const TERRAIN_CARTE = {
  /** Pas du réseau de pose, en pixels SOURCE. Une case en fait 128. */
  pasSourcePx: 56,

  /** Décalage maximal du centre d'une tuile, en fraction du pas, sur chaque axe. */
  decalageFraction: 0.4,

  /** Côté d'une dalle de rendu, en pixels ÉCRAN. */
  dalleCotePx: 512,

  /** Nombre de dalles gardées en cache, la plus ancienne employée cédant sa place. */
  dallesEnCache: 30,

  // Les deux rampes de cinq teintes de `FICHE-STYLE.md` §3, du creux à la
  // poussière. ⚠ ELLES ONT LA MÊME CLARTÉ RANG PAR RANG — L* 58,1 · 62,9 ·
  // 68,0 · 73,0 · 77,9 —, ce qui est la raison d'être de la seconde : deux sols
  // de clarté différente donneraient à un camp un camouflage que personne n'a
  // décidé. Repeindre à index CONSTANT ne touche donc ni au contraste ni à la
  // lisibilité de ce qui se pose dessus. ⚠ Et jamais un voile de couleur
  // globale à la place : il écraserait le relief et perdrait la garantie.
  rampes: {
    joueur: ['#B87E64', '#C38C73', '#CF9A83', '#D7A995', '#E0B9A8'],
    ouvrage: ['#8E88A4', '#9B95AE', '#A8A3B9', '#B5B1C2', '#C2BFCC'],
  },

  // Les quatre seuils qui découpent le résultat de l'accumulation en cinq
  // teintes d'égale surface.
  //
  // ⚠⚠ ILS SONT MESURÉS, ET ILS NE SE DEVINENT PAS. L'atlas est exactement
  // équilibré — 20,0 % de sa surface par index, mesuré — mais la SORTIE ne l'est
  // pas : elle est la somme pondérée d'environ cinq tuiles, donc à peu près
  // gaussienne là où l'atlas est uniforme. Prendre les seuils de l'atlas
  // (0,5 · 1,5 · 2,5 · 3,5) donnerait 14 % aux teintes extrêmes et 28 % à celle
  // du milieu. Ceux-ci sont les quintiles de la sortie elle-même, relevés sur
  // 2 949 120 pixels — quatre crans × cinq graines × quatre endroits de la
  // carte. Un test refait la mesure et exige 20 % ± 2 par teinte.
  //
  // ⚠ RELEVÉS À NOUVEAU LE 30/08, À QUATRE TUILES PAR CASE. Passer de une tuile
  // par case à quatre change l'échantillonnage de l'atlas, donc la distribution
  // de la sortie : les quatre valeurs ont bougé de 0,004 à 0,026. C'est le cas
  // que CLAUDE.md §5 autorise — « recalculer un seuil parce qu'une constante a
  // bougé : oui » — et non un assouplissement : la tolérance du test n'a pas été
  // touchée. Les précédents étaient 0,660 · 1,586 · 2,444 · 3,363.
  //
  // ⚠ ET L'ACCORD ENTRE CRANS S'EST DESSERRÉ, IL FAUT LE DIRE. Il valait 0,05 ;
  // il vaut 0,094 au pire (premier seuil, 0,631 au cran 32 contre 0,725 au cran
  // 256). Un jeu de seuils PAR CRAN resterait un jeu de seuils de trop — la
  // dispersion tient dans la tolérance, et deux découpages différents feraient
  // deux fonds différents pour la même zone.
  //
  // ⚠ ET ILS SONT GLOBAUX, PAS PAR DALLE. La formule dit « par quantiles de
  // luminance sur la dalle » ; des seuils calculés dalle par dalle feraient
  // deux découpages différents de part et d'autre d'un bord, donc une couture
  // visible — et casseraient l'invariant qui compte le plus ici, celui qui veut
  // qu'une zone rendue en une dalle soit identique à la même rendue en quatre.
  seuilsDeTeinte: [0.656, 1.574, 2.418, 3.338],

  /** Au-dessus de cette part d'Ouvrage, le pixel prend la rampe de l'Ouvrage. */
  seuilOuvrage: 0.5,
};

// --- gabarits d'emblèmes ------------------------------------------------------
// ⚠ CE SONT DES GABARITS, ET ILS LE DISENT. Les treize emblèmes du lot 6 sont
// spécifiés par `INVENTAIRE-SPRITES.md` et AUCUN fichier n'est produit. En
// attendant, un site se dessine comme un carré arrondi tenu par un bord et une
// lettre — ce qui est lisible à tous les crans et ne prétend pas être l'image
// définitive.
//
// ⚠ LE BORD ROUGE EST RÉSERVÉ AUX BASES DE L'OUVRAGE, et c'est une information
// de JEU, pas un choix de style : ce sont les seules qui attaquent le joueur —
// `TYPES_SITE.base.attaqueLeJoueur` le dit déjà. Camp et avant-poste sont en
// ambre parce qu'ils sont du butin, pas une menace. Un test croise les deux
// tables plutôt que de recopier la liste.
// --- les paliers d'emblème ----------------------------------------------------
// ⚠⚠ ARBITRÉ PAR ETHAN LE 30/08 : « Emblème de 1 à 9, 10 à 14, 15 à 19 etc.
// 9 sprites. » Le premier palier couvre neuf niveaux, les suivants cinq.
//
// ⚠ ELLE SE CALCULE, ELLE NE SE TABULE PAS. Une table de cinquante lignes serait
// une SECONDE vérité sur la même règle — celle que CLAUDE.md §4 interdit — et la
// première à diverger le jour où le plafond de niveau bougerait.
//
// ⚠⚠ ET LA NEUVIÈME BANDE ABSORBE LE 50. Huit bandes de cinq après le premier
// palier s'arrêteraient à 49 ; or `niveauDeLaRangee` rend 50 pour TOUTES les
// rangées de 1 à 50 — mesuré —, donc un site de niveau 50 n'aurait pas
// d'emblème. La borne haute est le niveau maximum, pas 49. **Un site sans
// emblème est le seul résultat exclu** ; si Ethan veut autre chose, c'est lui
// qui tranche, et c'est cette ligne-ci qui change.
export const PALIERS_EMBLEME = {
  /** Le dernier niveau du premier palier — celui qui en couvre neuf. */
  premierPalierJusqua: 9,
  /** Largeur de chaque bande suivante. */
  largeurDeBande: 5,
  /** Combien de paliers en tout — le nombre de sprites `n1`…`n9`. */
  nombre: 9,
};

/**
 * Le palier d'emblème d'un niveau de site — de 1 à 9.
 *
 * ⚠ ELLE LÈVE HORS DE 1…50 plutôt que de rendre un palier par défaut. Un niveau
 * hors bornes est une faute de programme, pas un fait de jeu : le masquer
 * dessinerait le mauvais emblème sans que rien ne le dise.
 *
 * @param {number} niveau 1…`GEOGRAPHIE.niveauPlafond`
 * @returns {number} 1…9
 */
export function palierDeNiveau(niveau) {
  if (!Number.isInteger(niveau) || niveau < 1 || niveau > GEOGRAPHIE.niveauPlafond) {
    throw new RangeError(
      `emblème : niveau ${niveau} hors de 1…${GEOGRAPHIE.niveauPlafond}`,
    );
  }
  const { premierPalierJusqua, largeurDeBande, nombre } = PALIERS_EMBLEME;
  if (niveau <= premierPalierJusqua) return 1;
  const palier = 2 + Math.floor((niveau - premierPalierJusqua - 1) / largeurDeBande);
  return palier > nombre ? nombre : palier;
}

// ⚠⚠ LES SEPT POI ONT LEUR GABARIT DEPUIS LE 31/08, ET LEUR `nom` NE S'ÉCRIT
// PAS ICI. Il se LIT dans `POI`, qui fait foi (voir son pavé) : deux tables qui
// porteraient le même libellé divergeraient au premier renommage, et le joueur
// verrait deux noms pour le même gisement. Le reste — fond, bord, lettre — est
// du GABARIT DE REPLI : il ne se dessine que tant que l'atlas n'est pas décodé.
//
// ⚠ AUCUN BORD ROUGE, ET CE N'EST PAS UN OUBLI. `#E43E32` est réservé à ce qui
// ATTAQUE le joueur, et un POI n'attaque pas — un test croise les deux tables et
// tomberait. L'accent de branche (blanc, rouge, jaune) vit dans le SPRITE, pas
// dans le bord du gabarit.
//
// ⚠ UN SEUL COUPLE FOND/BORD POUR LES SEPT : le métal, qui n'est ni le sol du
// joueur ni celui de l'Ouvrage — un POI n'appartient à personne tant qu'il n'est
// pas entré dans un territoire. Ce qui les distingue dans le repli, c'est la
// LETTRE, et les sept sont distinctes des cinq déjà prises (B, C, A, J, T).
const GABARIT_POI = { fond: '#3E454C', bord: '#68727E' };

export const EMBLEMES_CARTE = {
  base: { fond: '#231D2E', bord: '#E43E32', lettre: 'B', nom: 'Base de l\'Ouvrage' },
  camp: { fond: '#231D2E', bord: '#F5B636', lettre: 'C', nom: 'Camp' },
  avantPoste: { fond: '#231D2E', bord: '#F5B636', lettre: 'A', nom: 'Avant-poste' },
  baseJoueur: { fond: '#4E5742', bord: '#F5F3E8', lettre: 'J', nom: 'Votre base' },
  baseTerminale: { fond: '#382E47', bord: '#F5F3E8', lettre: 'T', nom: 'Base terminale' },
  poiQuartz: { ...GABARIT_POI, lettre: 'Q', nom: POI.poiQuartz.nom },
  poiScorie: { ...GABARIT_POI, lettre: 'S', nom: POI.poiScorie.nom },
  poiEnergie: { ...GABARIT_POI, lettre: 'E', nom: POI.poiEnergie.nom },
  poiCantonnement: { ...GABARIT_POI, lettre: 'N', nom: POI.poiCantonnement.nom },
  poiParcRoulant: { ...GABARIT_POI, lettre: 'R', nom: POI.poiParcRoulant.nom },
  poiPlotAerien: { ...GABARIT_POI, lettre: 'P', nom: POI.poiPlotAerien.nom },
  poiRedoute: { ...GABARIT_POI, lettre: 'D', nom: POI.poiRedoute.nom },
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
