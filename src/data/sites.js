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
  // ⚠ COMBIEN DE RAPPORTS DE RAID L'ÉTAT GARDE — « les dix derniers, en tout »,
  // arbitré par Ethan le 01/09. EN TOUT, pas par base : le jour du multi-bases,
  // c'est cette ligne-ci qu'il faudra relire, pas l'écran.
  //
  // ⚠ LA BORNE VIT ICI ET PAS DANS L'ÉCRAN. Un « 10 » écrit dans `ui/` ferait
  // deux vérités le jour où Ethan en veut vingt, et la seconde se lirait comme
  // un bogue d'affichage.
  rapportsGardes: 10,
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
  // ⚠⚠ LE PLAFOND DE LA RÉSERVE DE TEMPS — dicté par Ethan le 01/09/2026 :
  // « 12 h en début de partie, +1 h par niveau d'armée ». Le temps qui passe
  // crédite un stock par châssis, et réparer le débite ; ces deux nombres sont
  // les seuls à changer si Ethan revoit la générosité du système.
  //
  // ⚠ « PAR NIVEAU », DONC PAR NIVEAU ENTIER — et `niveauDeLArmee` rend des
  // DIXIÈMES. La division par dix se fait chez l'appelant, en bout de chaîne ;
  // écrire 0,1 ici ferait passer une conversion d'unité pour un réglage de jeu.
  plafondHeures: 12,
  plafondHeuresParNiveauArmee: 1,
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

// ⚠⚠ LE DÉLAI PENDANT LEQUEL « ATTAQUER » RESTE INERTE À CHAQUE ENTRÉE SUR
// L'ÉCRAN DE RAID. Ethan, 04/09, en cherchant à reproduire un raid parti tout
// seul : « si ça se trouve je double-clique et le bouton attaquer apparaissait
// pile poil sous mon doigt ». C'est une HYPOTHÈSE, et elle n'a pas été
// reproduite — voir `RAPPORT-lotASSAUT.md`, qui dit les intervalles essayés.
//
// ⚠ ELLE EST RETENUE POUR UNE RAISON QUI N'A RIEN À VOIR AVEC SA VRAISEMBLANCE :
// le geste qu'elle décrit est IRRÉVERSIBLE et PAYANT. Un raid parti tout seul
// dépense des points d'attaque et engage une armée abîmée. Quelques lignes
// contre une heure de régénération.
//
// ⚠⚠ ET LE LOT QUI POSE CETTE GARDE AGGRAVE D'ABORD LE RISQUE : le bouton passe
// d'un sixième de rangée à un bloc « vraiment en gros », donc il tombe plus
// souvent sous un doigt qui vient de toucher la carte à cet endroit-là. La
// garde est la contrepartie de cette taille, pas une précaution annexe.
//
// ⚠ CE N'EST PAS UNE CONFIRMATION DÉGUISÉE. Ethan n'en veut pas — « il n'y a
// que ça qui déclenche l'attaque », pas « demander confirmation ». Un délai ne
// demande rien, ne s'affiche pas, et au bout de trois cents millisecondes il
// n'existe plus. S'il gêne un joueur qui attaque vite, **c'est ce nombre-ci qui
// baisse**, pas la garde qui part.
//
// ⚠ ET IL VIT DANS `src/data/` PARCE QU'UN NOMBRE SE CHANGE SEUL — règle §4 de
// `CLAUDE.md`. C'est exactement celle qui est tombée sur le seuil d'étiquette au
// lot CONTOUR-ET-ÉTIQUETTES, parce qu'il valait 64 et qu'un cran valait 64.
export const ECRAN_RAID = { delaiArmementMs: 300 };

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
  // ⚠⚠ LA ZONE N'EST NI UN CARRÉ NI UN DISQUE : C'EST UN OCTOGONE, ET
  // ETHAN L'A DESSINÉ CASE PAR CASE LE 03/09/2026. « le territoire doit avoir 8
  // cases de plus, dans les angles. un carré de 5x5 avec chaque coin rogné
  // (4 cases) ; ouvrage idem rogné mais 7x7 donc 3 cases à chaque coin. »
  //
  // ⚠⚠ UNE SEULE RÈGLE REND LES DEUX FORMES, ET C'EST POURQUOI ON N'ÉCRIT PAS
  // DEUX LISTES DE COINS. La zone est l'intersection du carré de Tchebychev de
  // rayon `r` et du losange de Manhattan de rayon `r + margeDiagonaleInfluence` :
  //   r = 2, marge 1 → 25 − 4 = **21 cases**, UN coin retiré par angle ;
  //   r = 3, marge 1 → 49 − 12 = **37 cases**, TROIS coins par angle.
  // Ce sont exactement les deux figures dictées, et exactement **huit cases de
  // plus que le disque** des deux côtés — 13 → 21 et 29 → 37 —, ce qui est le
  // « 8 cases de plus » du message, mesuré et non supposé.
  //
  // ⚠ C'EST DONC UN RETOUR PARTIEL SUR LE DISQUE DU LOT BASES-1, PAS SUR EUCLIDE.
  // La PORTÉE d'un raid, la garde du peuplement et les anneaux de satellites
  // restent des disques ; seule la ZONE D'INFLUENCE reprend ses angles, et elle
  // ne les reprend qu'en partie — le carré plein d'avant EUCLIDE est mort.
  //
  // ⚠ UN SEUL NOMBRE À TOURNER SI ETHAN REVIENT DESSUS. À 0 la zone redevient le
  // losange de Manhattan, à `r` elle redevient le carré plein.
  margeDiagonaleInfluence: 1,
  rayonAttaque: 10, // fixe
  niveauBase: 'moyenne des niveaux de ses bâtiments',
  compositionBase: 'deux niveaux adjacents, répartis pour atteindre la moyenne',
  // ⚠⚠ CE COUPLE EST LU PAR `sim/deplacement.js` DEPUIS LE LOT DÉPLACEMENT
  // (02/09/2026), et il ne s'y recopie pas. Il vient de `SESSION-RELEVE-BUTIN.md`
  // §0 — « délai entre deux déplacements de base : 1 h au départ → 24 h au
  // niveau 50 » — et il dormait ici depuis, sans lecteur.
  delaiEntreSautsHeures: { depart: 1, niveau50: 24 },
  blocageApresAttaqueHeures: 1,
  blocageApresRasageHeures: 24,
  avantPostesParBaseJoueur: { min: 1, max: 2, niveauRelatif: 1, renouvelables: true },
};

// --- déplacement de la base ---------------------------------------------------
// Ce que le joueur peut faire de sa base, et à quel rythme. Deux nombres, et
// aucun n'est neuf : la portée vient d'Ethan le 02/09 (« 10 cases au
// maximum »), le délai dormait dans `GEOGRAPHIE.delaiEntreSautsHeures` depuis
// `SESSION-RELEVE-BUTIN.md` §0 sans que personne ne le lise.
//
// ⚠⚠ LE DÉLAI N'EST PAS RECOPIÉ ICI, IL EST RÉFÉRENCÉ. Deux tables pour une
// grandeur, c'est une occasion de divergence, et `CLAUDE.md` §4 l'interdit :
// « une seule table fait foi par grandeur ».
//
// ⚠ LA PORTÉE SE MESURE EN EUCLIDIEN, comme toute distance de portée de la
// carte depuis le lot EUCLIDE — `d² ≤ 100`, jamais de racine. Un carré de
// Tchebychev rendrait 440 cases atteignables là où le disque en rend 316, et
// la diagonale à (10, 10) — 14,1 cases en ligne droite — passerait pour un
// déplacement de dix.
export const DEPLACEMENT = {
  /** Distance maximale d'un déplacement, en cases, distance EUCLIDIENNE. */
  porteeMaxCases: 10,

  /**
   * Le barème du délai, aux deux bouts, en HEURES — interpolé linéairement
   * entre eux sur le niveau de la base.
   *
   * ⚠ LE NIVEAU D'UNE BASE EST LA MOYENNE DES NIVEAUX DE SES BÂTIMENTS, et
   * `niveauDesBatiments` la rend EN DIXIÈMES. Le lire comme un entier donnerait
   * un délai dix fois faux — c'est le piège que `sim/reparation.js` a déjà payé
   * avec `niveauDeLArmee`.
   */
  delaiHeures: GEOGRAPHIE.delaiEntreSautsHeures,
};

/**
 * La fondation d'une base de plus — lot BASES-1, arbitré par Ethan le 02/09.
 *
 * ⚠⚠ DIX CASES, COMME LE DÉPLACEMENT, ET POURTANT UNE TABLE À PART. C'est la
 * règle §4 de `CLAUDE.md` prise à l'endroit : deux grandeurs qui partagent
 * aujourd'hui une valeur ne sont pas la même grandeur. Le déplacement dit
 * jusqu'où une base SAUTE, la fondation jusqu'où une base neuve peut se poser à
 * partir des anciennes. Écrire `DEPLACEMENT.porteeMaxCases` ici ferait bouger
 * l'une le jour où Ethan règle l'autre, et personne ne verrait pourquoi.
 *
 * ⚠ EUCLIDIENNE, comme tout ce qui est une PORTÉE depuis le lot EUCLIDE — au
 * carré des deux côtés, jamais de racine.
 */
export const FONDATION = {
  /** Distance maximale à la base existante la plus proche, en cases. */
  porteeMaxCases: 10,
};

/**
 * Le transfert de ressources entre deux bases — lot TRANSFERT, arbitré par
 * Ethan le 02/09.
 *
 * ⚠⚠ UNE TABLE À PART, ET PAS UN CHAMP DE `DEPLACEMENT` NI DE `FONDATION`.
 * C'est la règle §4 de `CLAUDE.md` : deux grandeurs qui parlent de distance ne
 * sont pas la même grandeur. Le déplacement dit jusqu'où une base SAUTE (10),
 * la fondation jusqu'où on en POSE une (10), le transfert jusqu'où une
 * ressource VOYAGE (99). Les trois se règlent séparément.
 *
 * ⚠ 99 EST LA BORNE DU REFUS, ET ELLE EST LIÉE À LA TAXE : à 1 % par case, une
 * centième case ferait arriver ZÉRO. Refuser au-delà de 99 est donc la même
 * décision que « la taxe vaut 1 % », vue par l'autre bout — les changer
 * séparément ferait apparaître des transferts qui ne livrent rien.
 *
 * ⚠ EN POUR-CENT ENTIERS, JAMAIS EN FACTEUR FLOTTANT. Toute l'arithmétique en
 * aval est entière — milli-unités — et un `0.99` écrit ici ferait diverger
 * l'arrondi d'un envoi à l'autre.
 */
export const TRANSFERT = {
  /** Ce que chaque case de distance prélève, en pour-cent de l'envoi. */
  taxeParCasePct: 1,
  /** Au-delà, le transfert est refusé. Distance EUCLIDIENNE, arrondie. */
  porteeMaxCases: 99,
};

// --- peuplement de la carte --------------------------------------------------
// ARBITRÉ le 29/08/2026 par Ethan : « dans un carré de 12×12, il y a environ 12
// bases ouvrage », « aucune base ouvrage et joueur ne peuvent être côte à côte
// avec une autre base ouvrage joueur, 8 cases autour », « disposition
// irrégulière », et « spawn des bases ouvrage de part et d'autre du joueur,
// base de niveau 1 à 10, à au moins 15 cases du joueur ».
//
// ⚠⚠ LA DENSITÉ A ÉTÉ POUSSÉE AU LOT EUCLIDE (02/09/2026), ET LE « 12 » DU
// 29/08 EST CADUC. Ethan : « ignorer le 24 bases par un carré de 12 × 12,
// c'était une mesure mais sur un jeu périmé ; en réalité sur une partie neuve il
// y a beaucoup plus de bases et beaucoup plus de densité. Tu conserves la règle
// du 3 × 3 et tu augmentes la densité au maximum, je retire le maximum un peu
// moins pour que ce soit pas un cadre parfaitement rectangulaire comme une
// sylviculture. »
//
// ⚠ `probabiliteCandidate` N'EST PAS LA DENSITÉ, et confondre les deux ferait
// poser presque trois fois trop de bases. C'est la probabilité qu'une case soit
// CANDIDATE ; l'exclusion des huit voisines en élimine ensuite une partie, tour
// après tour.
//
// ⚠⚠ LE « PLAFOND DE 16 » APPARTENAIT À L'ALGORITHME, PAS À LA RÈGLE — ET LA
// DISTINCTION A COÛTÉ UN LOT. Cette section a affirmé, le 02/09 puis le 03/09,
// que l'exclusion des huit voisines PLAFONNAIT la carte à 16 bases par 12 × 12,
// « quelle que soit la probabilité ». C'est vrai d'une sélection en UNE passe :
// la densité des maxima locaux d'un champ indépendant dans un voisinage de neuf
// vaut exactement 1/9. Ce n'est PAS vrai de la règle « aucune base dans les huit
// cases autour », dont l'empilement maximal est un damier au pas de deux, soit
// **36 par 12 × 12**. Ethan, 03/09 : « je suis sûr à 100 % qu'on n'est pas
// obligé de mettre des bases en diagonale. » Il avait raison.
//
// ⚠⚠ D'OÙ LES PASSES. On repose une base sur ce qui reste libre, puis encore,
// jusqu'à `toursDePeuplement`. Chaque tour est le même maximum local, appliqué
// aux seules cases qu'aucun tour précédent n'a prises ni voisinées ; le résultat
// est un ensemble indépendant MAXIMAL, et la carte remonte à 25,4 sans qu'une
// seule paire de bases se touche, fût-ce par un coin. Mesuré, moyenne des
// fenêtres 12 × 12 entièrement hors de la garde, sur 20 graines :
//
//     tours   1      2      3      4      5      6      8
//     bases   16,24  23,88  25,31  25,42  25,43  25,43  25,43
//
//     p       0,30   0,40   0,50   0,60   0,70   0,80   0,90   1,00
//     bases   19,09  21,50  23,28  24,52  25,42  26,13  26,83  27,28
//
// ⚠⚠ D'OÙ 0,70, ET C'EST ETHAN QUI L'A CHOISI SUR MESURE (03/09), entre trois
// valeurs qui lui ont été montrées en capture. Le compromis est celui du 02/09
// — « je retire le maximum un peu moins pour que ce soit pas un cadre
// parfaitement rectangulaire comme une sylviculture » —, et il se chiffre : les
// blocs 3 × 3 entièrement vides tombent de 4,7 % à p = 0,5 à **1,6 % à 0,7** et
// à 0,0 % à p = 1. Au-delà de 0,7 la carte cesse d'avoir des trous, ce qui est
// exactement ce qu'il refuse ; en deçà elle rend deux bases de moins.
//
// ⚠ ET IL RESTE ONZE CASES SOUS L'EMPILEMENT MAXIMAL. 25,4 contre 36 : la marge
// n'est pas perdue, c'est elle qui fait l'irrégularité. Un lot qui voudrait plus
// de densité devra dire ce qu'il fait des trous.
//
// Un test refait la mesure. ⚠ ET IL LA FAIT HORS DE LA GARDE : une fenêtre prise
// dans le rayon de quinze cases autour du départ porte zéro base, par
// construction. La compter ferait tomber la moyenne et donnerait l'impression
// que le réglage est faux alors qu'il est juste.
//
// ⚠ « ENVIRON 25 » EST UNE MOYENNE, ET L'ÉCART RESTE LARGE — écart-type 1,93
// par fenêtre, de 19 à 31 sur 40 graines. C'est le prix de la disposition irrégulière, préférée le 29/08 à un
// pavage régulier qui aurait donné un compte presque constant. Un test borne la
// moyenne, jamais une fenêtre isolée.
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
// de « de part et d'autre ».
//
// ⚠⚠ ET LA GARDE EST EUCLIDIENNE DEPUIS LE LOT EUCLIDE (02/09/2026). Cette
// phrase disait « la garde est une distance de Tchebychev, pas un nombre de
// rangées » ; la seconde moitié reste vraie, la première a changé en même temps
// que la portée du raid et que les anneaux des satellites. Le carré de 31 × 31
// est devenu un DISQUE : mesuré, **841 cases interdites deviennent 697**, donc
// 144 cases libérées, toutes dans les diagonales, et la base la plus proche du
// départ peut se poser à onze cases de grille au lieu de quinze.
export const PEUPLEMENT = {
  // ⚠⚠ 0,70 EST UN CHOIX D'ETHAN, RENDU LE 03/09 SUR MESURE ET SUR CAPTURE.
  // Trois réglages lui ont été montrés — 23,5, 25,8 et 27,7 bases par 12 × 12,
  // tous SANS contact diagonal —, et il a retenu le milieu. C'est le même
  // critère que le 02/09, « un peu moins que le maximum pour que ce soit pas un
  // cadre parfaitement rectangulaire », appliqué à une règle qui, elle, peut
  // enfin monter : voir le bloc au-dessus pour les deux courbes.
  /** Probabilité qu'une case soit candidate, AVANT exclusion des voisines. */
  probabiliteCandidate: 0.7,

  /** Ce que la probabilité ci-dessus est censée produire, et que le test mesure. */
  basesParDouzeCarre: 25,

  // ⚠⚠ QUATRE TOURS, ET C'EST LE POINT FIXE À UN CENTIÈME PRÈS. La suite des
  // densités est 16,24 · 23,88 · 25,31 · 25,42 · 25,43, et elle ne bouge plus
  // ensuite : au-delà de quatre tours il ne reste presque aucune case libre à
  // prendre. Ce nombre est donc un PLAFOND DE TRAVAIL, pas un réglage
  // d'équilibrage — le monter ne changerait quasiment rien à la carte, le
  // descendre la viderait.
  //
  // ⚠ ET IL BORNE LE RAYON QUE LA RÈGLE REGARDE. Le tour `k` d'une case dépend
  // du tour `k − 1` de ses voisines : quatre tours, quatre cases de rayon. C'est
  // ce qui garde le peuplement DÉRIVÉ et local — aucune passe sur la carte,
  // rien de stocké —, et c'est ce qui en fixe le coût : 59 hachages par appel
  // isolé au lieu de 9, mesuré, et 2,4 ms pour une fenêtre d'écran contre 0,9.
  toursDePeuplement: 4,

  // ⚠⚠ IL N'Y A PLUS DE `contactDiagonalPermis`, ET SON RETRAIT EST LA
  // DÉCISION DU 03/09. Il a vécu quelques heures, à `true`, pour desserrer
  // l'exclusion aux quatre voisines orthogonales : c'était la seule façon de
  // remplir davantage TANT QUE LA SÉLECTION SE FAISAIT EN UNE PASSE. Ethan l'a
  // refusé de face — « je suis sûr à 100 % qu'on n'est pas obligé de mettre des
  // bases en diagonale » —, et la mesure lui a donné raison : les tours rendent
  // la même densité sous l'exclusion des HUIT. Le laisser en place à `false`
  // aurait laissé au dépôt un levier qui ne sert plus qu'à défaire un
  // arbitrage ; la règle du 29/08 est de nouveau entière, et sans variante.

  /** Tolérance de la mesure : la moyenne doit tomber dans 25 ± 1. */
  toleranceMesure: 1,

  /**
   * Aucune base de l'Ouvrage à moins de cette distance de la position de
   * DÉPART du joueur. Distance EUCLIDIENNE depuis le lot EUCLIDE — voir
   * `horsDeLaGarde`, qui compare les carrés et ne prend jamais de racine.
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

/**
 * L'écart minimal entre deux POI, en cases.
 *
 * ⚠⚠ ARBITRÉ PAR ETHAN LE 03/09, DEVANT LA CARTE : « éparpille les poi. jamais
 * 2 poi collé, au moins 4 cases d'écart ». Le tirage n'écartait jusque-là que
 * la case EXACTE d'un POI déjà posé : deux gisements pouvaient se toucher par
 * un côté ou par un coin, et la carte en montrait des paires collées.
 *
 * ⚠ « QUATRE CASES D'ÉCART » EST LU COMME UNE DISTANCE, PAS COMME UN NOMBRE DE
 * CASES VIDES. Deux POI à distance 4 laissent trois cases entre eux ; l'autre
 * lecture — quatre cases VIDES, donc distance 5 — se prend en changeant ce seul
 * nombre. C'est écrit ici pour que le choix se voie et se défasse d'un chiffre.
 *
 * ⚠⚠ ET LA DISTANCE EST EUCLIDIENNE, comme toutes les portées du dépôt depuis
 * le lot EUCLIDE — c'est déjà la métrique de `horsDeLaGarde`, que ce même
 * tirage appelle deux lignes plus haut. En prendre une autre ici donnerait à
 * `sim/poi.js` deux géométries pour deux refus voisins.
 */
export const ECART_MINIMAL_POI = 4;

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

  // ⚠⚠ `coteTuile` ET `tuilesParCase` SONT PARTIS AVEC L'ATLAS DE TERRAIN — lot
  // SOL-SATELLITE, 05/09. Ils disaient le côté d'une tuile et combien il en
  // fallait pour couvrir une case ; le sol n'est plus fait de tuiles mais de
  // planches entières, et `PIXELS_SOURCE_PAR_CASE` ci-dessous porte seul
  // l'échelle qu'ils portaient à deux.
  //
  // ⚠ CE QU'ILS DISAIENT RESTE VRAI ET DOIT LE RESTER : le cran le plus serré
  // vaut 256 pixels physiques par case, l'échelle source y tombe donc au 1:1, et
  // AUCUN cran n'agrandit jamais la source. C'est l'acquis du « gros carré
  // moche » qu'Ethan a rapporté le 30/08 — un pavage qui doublait son grain —,
  // et c'est `echelleDuCran` de `render/terrain.js` qui le tient désormais.

  // ⚠⚠ `grilleEmbleme` A ÉTÉ RETIRÉE ICI LE 03/09, ET SON ABSENCE EST LE
  // MESSAGE. Elle valait 64 et disait « le côté d'une cellule d'emblème » —
  // c'est-à-dire la grille de couture des atlas, que `COTE_SPRITE` de
  // `data/atlas.js` porte déjà et que `tools/atlas.py` GÉNÈRE. Deux vérités
  // pour une grandeur, dont une écrite à la main : le lot GRILLE-128 a fait
  // passer la couture à 128 sans que celle-ci suive, et pendant deux lots la
  // carte du monde a lu ses emblèmes dans la mauvaise cellule, au quart de
  // leur taille. `render/embleme.js` lit `COTE_SPRITE`, comme
  // `render/limite.js` le faisait déjà. Ne pas la recréer.
};

/**
 * Le côté d'une case de la carte, en pixels SOURCE du sol.
 *
 * ⚠⚠ IL S'ÉCRIT MAINTENANT, ET C'EST UN RECUL ASSUMÉ. Il était le PRODUIT de
 * `coteTuile` et `tuilesParCase`, pour qu'une troisième constante ne puisse pas
 * mentir le jour où l'un des deux bougerait. Ces deux-là sont partis avec
 * l'atlas de tuiles : il n'y a plus de facteurs dont dériver, et écrire
 * `1254 / 4,8984…` pour se donner l'air de calculer serait pire.
 *
 * ⚠ CE NOMBRE EST LA SEULE CHOSE QUI RELIE LE SOL AU ZOOM, et il est adossé au
 * cran le plus serré de `ZOOM_CARTE.crans` : les deux valent 256, donc ce cran
 * tombe au 1:1 et aucun n'agrandit. Un test l'exige plutôt que de le supposer —
 * les faire diverger rendrait le sol flou au maximum du zoom, ce qui est très
 * exactement le défaut du 30/08.
 *
 * ⚠ ET IL NE DIT RIEN DU CÔTÉ D'UNE PLANCHE. Une planche fait 1 254 pixels, soit
 * 4,898 cases : le pavage se compte en PIXELS, jamais en cases, et rien
 * n'oblige un bloc à tomber sur une frontière de case.
 */
export const PIXELS_SOURCE_PAR_CASE = 256;

/**
 * L'étiquette d'un site sur la carte du monde — son nom, et son niveau dessous.
 *
 * ⚠⚠ ETHAN, 03/09 : « rajouter un petit nom sur fond semi opaque + niveau en
 * dessous de chaque entité de la carte ». C'est un RETOUR SUR L'ARBITRAGE DU
 * 30/08, et il se lit dans ce sens-là : ce qui avait été retiré ce jour-là
 * (« on enlève les lettres quoi qu'il arrive »), c'était la LETTRE — une
 * capitale peinte SUR l'emblème, qu'il fallait décoder. Ce qui revient est un
 * NOM écrit en toutes lettres, posé SOUS la case. `CSS_MINI_LETTRE` ne
 * reparaît pas, et le champ `lettre` n'est toujours lu par aucun écran.
 *
 * ⚠⚠ ET C'EST DU CALIBRAGE, DONC ÇA VIT ICI. La première écriture posait ces
 * trois nombres dans `ui/monde.js` — et la garde « l'écran ne nomme aucune
 * constante de zoom en dur » est TOMBÉE dessus, parce que le seuil valait 64 et
 * que 64 est aussi un cran de zoom. Elle avait raison pour une raison qu'elle
 * ne connaissait pas : un seuil d'affichage est une valeur de réglage, et §4
 * les veut toutes dans `src/data/`.
 */
export const ETIQUETTE_CARTE = {
  // ⚠⚠ EN DEÇÀ DE CETTE LARGEUR DE CASE, EN PIXELS CSS, AUCUNE ÉTIQUETTE.
  //
  // ⚠⚠ IL DESCEND DE 64 À 36 AU LOT ERGONOMIE, ET LA MESURE DU 30/08 QUI L'AVAIT
  // POSÉ À 64 RESTE VRAIE — ELLE EST TRAITÉE AUTREMENT. Ethan, 04/09 : « les
  // noms des éléments de la carte persistent jusqu'à ce que je dézoome, environ
  // dix cases en largeur ». Dix cases sur 360 px CSS font 36 px par case, et
  // c'est ce nombre-là qui est écrit ici.
  //
  // ⚠⚠ CE QUE LE 30/08 AVAIT MESURÉ NE DISPARAÎT PAS. Fenêtre de 360 × 512 px
  // CSS, vingt graines, fenêtres centrées sur les rangées 250, 150 et 50 : le
  // nombre de sites À L'ÉCRAN vaut 296 au cran de 10,7 px CSS par case, 98 à
  // 21,3, 33 à 42,7 et 13 à 85,3. À 33 les plaques SE RECOUVRENT — c'était la
  // capture d'Ethan, et ça l'est toujours. Ce qui a changé, c'est la RÉPONSE :
  // le seuil ne sert plus à éviter le recouvrement, il ne sert qu'à dire à
  // partir de quand une plaque est lisible. Le recouvrement, lui, est réglé au
  // dessin par `etiquettesRetenues` de `ui/monde.js`, qui écarte toute boîte
  // qui en coupe une déjà retenue.
  //
  // ⚠ ET LE ZOOM CONTINU RENDAIT L'ANCIENNE RÉPONSE INSUFFISANTE DE TOUTE
  // FAÇON. Avec des crans, un seuil tombait entre deux paliers ; depuis le lot
  // ZOOM-CONTINU, l'échelle s'arrête où le doigt la laisse — donc juste au pire
  // endroit si le seuil est le seul rempart.
  //
  // ⚠ EN PIXELS CSS ET NON EN CRANS, et c'est ce qui le rend juste sur tous les
  // appareils : les crans de `ZOOM_CARTE` sont en pixels PHYSIQUES, donc le
  // même cran n'a pas la même taille apparente à densité d'écran différente.
  cssMiniParCase: 36,

  // ⚠⚠ L'ORDRE DE PRIORITÉ DES ÉTIQUETTES, du plus important au moins. Quand
  // deux plaques se coupent, c'est la plus prioritaire qui reste — sans cette
  // table, celle qui reste serait celle que `sitesDeLaFenetre` a poussée en
  // premier, et deux images identiques n'afficheraient pas les mêmes noms.
  //
  // ⚠ ELLE EST ICI ET NON DANS L'ÉCRAN : c'est du calibrage d'affichage, au
  // même titre que le seuil au-dessus, et `monde.test.js` refuse déjà qu'un
  // écran nomme une constante de zoom en dur.
  ordreDePriorite: [
    'baseJoueur', 'baseTerminale', 'base',
    'poiQuartz', 'poiScorie', 'poiEnergie', 'poiCantonnement',
    'poiParcRoulant', 'poiPlotAerien', 'poiRedoute',
    'avantPoste', 'camp',
  ],

  /** La police, en fraction de case : elle suit le cran, comme les frontières. */
  partPolice: 0.09,

  // ⚠ L'ENCRE EST NEUTRE, ET CE N'EST PAS `TEINTES_TERRITOIRE`, qui porte
  // pourtant la même valeur pour le joueur. Cette table-là dit « ceci
  // appartient au joueur » ; une étiquette nomme aussi bien une base de
  // l'Ouvrage qu'un gisement. Deux grandeurs qui partagent une valeur ne
  // partagent pas une constante — règle §4, celle qui a séparé `economie.js`
  // de `niveaux.js`.
  encre: '#F5F3E8',
};

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
  // ⚠⚠ LA LARGEUR DU FONDU ENTRE DEUX BLOCS VOISINS, EN PIXELS SOURCE — lot
  // SOL-SATELLITE, 05/09. Le sol de la carte est pavé par BLOCS d'une planche
  // entière de 1 254 pixels, qui se chevauchent de ce nombre-ci : c'est la SEULE
  // bande où deux dessins se mélangent, et tout le reste est la planche telle
  // qu'Ethan l'a rendue. `128 / 1 254` par axe, donc **78,6 % de la surface est
  // le pixel source à l'octet** — `render/terrain.js` le calcule et un test le
  // mesure sur le pavage.
  //
  // ⚠ 128 EST MESURÉ, PAS CHOISI ROND. Écart-type des moyennes locales sur une
  // vue large de 1 200 × 1 200 au cran 64, fenêtre d'un demi-bloc : le fondu 128
  // rend **2,509**, le fondu 256 rend 2,369 — soit 5,6 % de raccord en moins —
  // mais il coûte 3,8 % de contraste (14,064 → 13,519) et surtout il double la
  // part de surface mélangée. À 128, la couture ne se voit déjà pas à 1:1 sur la
  // planche la plus heurtée des huit ; élargir ne rachète rien qui se voie.
  //
  // ⚠ ET CE QUI ÉTAIT ICI EST PARTI AVEC LA MOULINETTE. `pasSourcePx: 56` était
  // le pas d'un réseau où CINQ tuiles se superposaient sur chaque pixel, et
  // `decalageFraction: 0.4` la gigue qui empêchait ce réseau de se lire comme
  // une grille. Un bloc d'une planche entière n'a besoin ni de l'un ni de
  // l'autre : ce qui casse la répétition, c'est huit dessins et huit
  // orientations, pas un semis.
  fonduSourcePx: 128,

  /** Côté d'une dalle de rendu, en pixels ÉCRAN. */
  dalleCotePx: 512,

  // ⚠⚠ IL PASSE DE 30 À 64 AU LOT ZOOM-CONTINU, ET LE NOMBRE EST MESURÉ. 30
  // avait été calibré quand un SEUL cran vivait à la fois : le cache se vidait
  // à chaque changement de cran. Depuis que le zoom est continu, deux crans
  // cohabitent et — surtout — UNE SEULE IMAGE pose jusqu'à 32 dalles, mesuré
  // dans Chromium sur un canevas de 1080 × 1692 (360 × 564 px CSS à dpr 3).
  // À 30, une image évinçait donc deux dalles dont elle avait encore besoin, et
  // l'image suivante les recalculait — indéfiniment.
  //
  // ⚠ MESURÉ SUR LE GESTE, PAS SUR UNE IMAGE FIXE. Médiane par image d'un
  // pincement qui REVIENT du plus serré au plus large — la direction exigeante,
  // celle qui redemande ce que l'aller a calculé —, trois exécutions :
  // capacité 30 → 26,6 ms · 32 → 28,2 · 40 → 18,7 · 48 → 19,0 · **64 → 8,1** ·
  // 96 → 7,0. Le budget d'une image à 60 Hz est de 16,7 ms : 64 est la première
  // valeur qui passe dessous, et elle vaut le double de la fenêtre d'une image.
  //
  // ⚠⚠ ET ÇA SE PAIE EN MÉMOIRE, IL FAUT LE DIRE. Une dalle est un canevas de
  // 512 × 512 en RVBA, soit 1 Mio exactement : le cache passe donc de 30 à
  // 64 Mio. C'est le prix du zoom continu, et le seul curseur qui rendrait la
  // même fluidité pour moins est `dalleCotePx` — 512 → 256 divise la dalle par
  // quatre en surface —, ce qui est un autre lot. **Ethan tranche s'il juge
  // 64 Mio trop cher ; le jeu tient sous 64 Mio de dalles sur son Galaxy S25 FE.**
  dallesEnCache: 64,

  // Les deux rampes de cinq teintes de `FICHE-STYLE.md` §3, du creux à la
  // poussière. ⚠ ELLES ONT LA MÊME CLARTÉ RANG PAR RANG — L* 58,1 · 62,9 ·
  // 68,0 · 73,0 · 77,9 —, ce qui est la raison d'être de la seconde : deux sols
  // de clarté différente donneraient à un camp un camouflage que personne n'a
  // décidé.
  //
  // ⚠⚠ ELLES NE PEIGNENT PLUS RIEN, ET ELLES RESTENT — lot SOL-SATELLITE, 05/09.
  // Le sol de la carte était REQUANTIFIÉ sur elles ; il est maintenant l'art
  // d'Ethan tel quel. Ce qu'elles sont désormais, c'est la RÉFÉRENCE DÉCLARÉE
  // du sol, celle contre laquelle le lot ARMÉE-ET-FRONTIÈRE a calibré les
  // frontières de territoire — « le sol de la carte est CLAIR des deux côtés »,
  // et les quatre tons les plus sombres de chaque rampe ont été retenus pour
  // ressortir dessus. Les retirer ferait tomber cette calibration sans que rien
  // ne la remplace.
  //
  // ⚠⚠ ET LE NOUVEL ART TOMBE DESSUS, C'EST MESURÉ. Sur les huit planches
  // livrées, la distance RVB au ton de rampe le plus proche vaut **9,0 en
  // médiane et 14,0 au neuvième décile**, et la bande de clarté du sol
  // (p5 = 132, p95 = 181) tient dans celle de la rampe (137 → 192). La
  // frontière garde donc exactement le contraste pour lequel elle a été
  // recolorisée. C'est un CONSTAT, pas une contrainte imposée à l'art : le jour
  // où Ethan livrera un sol d'une autre famille, ce sont ces deux mesures-là
  // qu'il faudra refaire, et la frontière avec.
  rampes: {
    joueur: ['#B87E64', '#C38C73', '#CF9A83', '#D7A995', '#E0B9A8'],
    ouvrage: ['#8E88A4', '#9B95AE', '#A8A3B9', '#B5B1C2', '#C2BFCC'],
  },

  // ⚠⚠ `seuilsDeTeinte` ET `seuilOuvrage` SONT PARTIS AVEC LA MOULINETTE — lot
  // SOL-SATELLITE. Les quatre seuils découpaient l'accumulation en cinq teintes
  // d'égale surface, et le cinquième décidait quelle rampe peignait un pixel :
  // il n'y a plus ni accumulation, ni quantification, ni rampe peinte. Ne pas
  // les recréer sans le sol procédural qui allait avec.
  //
  // ⚠ ET LE FOND DE L'OUVRAGE AVEC EUX, SUR DEMANDE D'ETHAN — 05/09, « pas de
  // fond ouvrage pour le moment ». `partOuvrageDeLaRangee` faisait basculer le
  // sol vers l'ardoise à mesure qu'on montait vers la base terminale ; c'était
  // une PROPOSITION, elle le disait, et elle est retirée le temps qu'il regarde
  // le sol satellite sur la carte. La rampe `ouvrage` ci-dessus reste, elle : la
  // frontière de territoire s'en sert toujours.
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
