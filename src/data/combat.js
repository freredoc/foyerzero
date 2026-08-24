// Données de combat de Foyer Zéro — transcription figée.
//
// SOURCE UNIQUE : SPEC-FOYER-ZERO.md (24/08/2026), qui fait autorité, complétée
// pour les valeurs chiffrées par ANNEXE-STATS.md et par les feuilles UNITES et
// DEFENSES de FOYER-ZERO-CALIBRAGE-2.xlsx.
//
// ⚠ Le classeur est une FEUILLE DE SAISIE, pas une source. Il est resté à l'état
// d'avant l'audit du 23/08 : noms manquants, Perceurs déclaré anti-véhicule,
// Broyeur anti-structure, Guetteur anti-véhicule en défense, colonne credit.
// Ce fichier porte les valeurs ARBITRÉES. En cas d'écart avec le classeur,
// c'est ce fichier qui a raison. Ne jamais relire le classeur pour coder.
//
// Convention héritée de params.js : toutes les valeurs de calibrage vivent
// dans src/data/, jamais en dur dans src/sim/.

// --- grille de combat --------------------------------------------------------
// 9 colonnes × 18 rangées, trois bandes contiguës, aucun terrain neutre.
// Les rangées sont numérotées de 1 (bas, côté attaquant) à 18 (haut, fond).
export const GRILLE = {
  largeur: 9,
  longueur: 18,

  bandes: {
    deploiement: { premiere: 1, derniere: 2 }, // les vagues y apparaissent
    defense: { premiere: 3, derniere: 10 }, //  8 rangées
    batiments: { premiere: 11, derniere: 18 }, // 8 rangées = 72 cases
  },

  // 72 = 8 × 9. C'est la base du calcul de remplissage de SITES-DENSITE.
  casesBatiments: 72,

  vaguesParRaid: 4,
  intervalleVagueSec: 5,
  tickSec: 0.1, // 10 Hz
  dureeMaxCombatSec: 90,

  // Une unité offensive ne descend jamais sous ce pourcentage de sa réserve
  // tant qu'elle est dans la bande de défense. Le plancher se lève au passage
  // de ligne : le reliquat part dans les bâtiments.
  plancherReservePct: 10,

  // Un défenseur ne descend jamais sous ce pourcentage de PV. Comme les dégâts
  // sont proportionnels aux PV restants, il ne fait alors plus rien d'utile.
  plancherPvDefenseurPct: 1,

  // Réparation gratuite après un raid, au prorata des PV du complexe de défense.
  reparationGratuitePct: 70,
};

// --- obstacles de terrain ----------------------------------------------------
// 10 cases dispersées au hasard sur la grille. Traversables : elles ne bloquent
// jamais. L'aviation les ignore. On ne peut ni y poser une structure ni y
// placer une unité à la configuration, joueur comme Ouvrage.
export const OBSTACLES = {
  nombre: 10,
  diviseurVitesse: 2.5,
  types: ['infanterie', 'vehicule', 'les_deux'],
};

// --- la matrice unique -------------------------------------------------------
// Trois colonnes pour toutes les entités. La troisième change de sens selon le
// camp : structure en offense, aviation en défense. Les deux lectures ne se
// croisent jamais — aucun aéronef ne défend, aucun défenseur ne rencontre de
// structure amie.
//
// Règle de bascule, sans exception : anti-structure en attaque → anti-aérien en
// défense. Les deux autres spécialités se conservent.
export const MATRICE_COLONNES = ['infanterie', 'vehicule', 'structureOuAviation'];

// --- unités ------------------------------------------------------------------
// 14 unités, trois châssis. Deux jeux de noms : le joueur emploie le vocabulaire
// d'une armée régulière, l'Ouvrage celui des outils et des bêtes. La même ligne
// sert les deux camps ; seul le module peut différer (moduleOuvrage).
//
// Cadence : 10 tirs/s pour tout le monde, DPS = degats × 10. Aucune portée
// minimale offensive — elle n'existe plus que côté défense.
// Les dégâts sont proportionnels au pourcentage de PV restants, partout.
// `apparition` / `apparitionModule` : niveau auquel l'Ouvrage débloque l'unité,
// puis son module. UNITES fait foi (arbitrage du 24/08) ; CIBLAGE-DEFENSE avait
// trois valeurs divergentes, écartées.
export const UNITES = {
  meute: {
    nom: { ouvrage: 'Meute', joueur: 'Fusiliers' }, ta: 'Rifleman Squad',
    chassis: 'escouade', specialite: 'antiInfanterie',
    points: 5, pv: 100, degats: 8, portee: 1.5, porteeMini: 0, vitesse: 0.5,
    reserve: 150, masse: 1, comportementAerien: null,
    matrice: { infanterie: 1, vehicule: 0.2, structureOuAviation: 0.3 },
    module: 'fumigene', moduleOuvrage: null,
    defense: { present: true, cible: 'antiInfanterie', module: null },
    apparition: 0, apparitionModule: 20,
  },
  guetteur: {
    nom: { ouvrage: 'Guetteur', joueur: 'Voltigeurs' }, ta: 'Sniper',
    chassis: 'escouade', specialite: 'antiInfanterie', // longue portée
    points: 10, pv: 100, degats: 20, portee: 2.5, porteeMini: 0, vitesse: 0.5,
    reserve: 150, masse: 1, comportementAerien: null,
    matrice: { infanterie: 1, vehicule: 0.1, structureOuAviation: 0.1 },
    module: 'camouflage', moduleOuvrage: null,
    // Seule unité qui garde son rôle des deux côtés — c'est ce qui la
    // caractérise. Le classeur la donnait anti-véhicule en défense : écarté.
    defense: { present: true, cible: 'antiInfanterie', module: 'rayonPlusUn' },
    apparition: 22, apparitionModule: 40,
  },
  perceurs: {
    nom: { ouvrage: 'Perceurs', joueur: 'Grenadiers' }, ta: 'Missile Squad',
    chassis: 'escouade', specialite: 'antiStructure', // matrice : 1 en structure
    points: 5, pv: 100, degats: 8, portee: 1.5, porteeMini: 0, vitesse: 0.5,
    reserve: 250, masse: 1, comportementAerien: null,
    matrice: { infanterie: 0.2, vehicule: 0.5, structureOuAviation: 1 },
    module: 'tirDeBarrage', moduleOuvrage: null,
    defense: { present: true, cible: 'antiAerien', module: null },
    apparition: 4, apparitionModule: 22,
  },
  fouisseurs: {
    nom: { ouvrage: 'Fouisseurs', joueur: 'Sapeurs' }, ta: 'Commando',
    chassis: 'escouade', specialite: 'antiStructure',
    points: 10, pv: 150, degats: 20, portee: 1.5, porteeMini: 0, vitesse: 0.5,
    reserve: 300, masse: 1, comportementAerien: null,
    matrice: { infanterie: 0.2, vehicule: 0.2, structureOuAviation: 1 },
    module: 'booster', moduleOuvrage: 'camouflage',
    defense: { present: false, cible: null, module: null },
    apparition: 24, apparitionModule: 38,
  },
  carapace: {
    nom: { ouvrage: 'Carapace', joueur: 'Cuirassiers' }, ta: 'Exosoldat',
    chassis: 'escouade', specialite: 'antiVehicule',
    points: 10, pv: 150, degats: 10, portee: 1.5, porteeMini: 0, vitesse: 0.5,
    reserve: 150, masse: 1, comportementAerien: null,
    matrice: { infanterie: 0.2, vehicule: 1, structureOuAviation: 0.2 },
    module: 'booster', moduleOuvrage: 'camouflage',
    defense: { present: true, cible: 'antiVehicule', module: 'emp' },
    apparition: 8, apparitionModule: 28,
  },
  ratisseur: {
    nom: { ouvrage: 'Ratisseur', joueur: 'Éclaireur' }, ta: 'Guardian',
    chassis: 'blinde', specialite: 'antiInfanterie',
    points: 10, pv: 200, degats: 10, portee: 1.5, porteeMini: 0, vitesse: 1.2,
    reserve: 150, masse: 5, comportementAerien: null,
    matrice: { infanterie: 1, vehicule: 0.3, structureOuAviation: 0.4 },
    module: 'garnison', moduleOuvrage: null,
    defense: { present: true, cible: 'antiInfanterie', module: 'garnison' },
    apparition: 18, apparitionModule: 36,
  },
  fendeur: {
    nom: { ouvrage: 'Fendeur', joueur: 'Chasseur' }, ta: 'Predator Tank',
    chassis: 'blinde', specialite: 'antiVehicule',
    points: 10, pv: 300, degats: 12, portee: 2.5, porteeMini: 0, vitesse: 1,
    reserve: 200, masse: 10, comportementAerien: null,
    matrice: { infanterie: 0.3, vehicule: 1, structureOuAviation: 0.4 },
    module: 'ecraseur', moduleOuvrage: null,
    defense: { present: true, cible: 'antiVehicule', module: 'emp' },
    apparition: 12, apparitionModule: 34,
  },
  broyeur: {
    nom: { ouvrage: 'Broyeur', joueur: 'Percheron' }, ta: 'Mammoth Tank',
    chassis: 'blinde', specialite: 'antiVehicule', // lourd ; matrice : 1 en véhicule
    points: 15, pv: 500, degats: 15, portee: 2.5, porteeMini: 0, vitesse: 1,
    reserve: 200, masse: 20, comportementAerien: null,
    matrice: { infanterie: 0.3, vehicule: 1, structureOuAviation: 0.4 },
    module: 'ecraseur', moduleOuvrage: 'volDeVie',
    defense: { present: true, cible: 'antiVehicule', module: 'pvPlusVingt' },
    apparition: 28, apparitionModule: 42,
  },
  belier: {
    nom: { ouvrage: 'Bélier', joueur: 'Pionnier' }, ta: 'Pitbull',
    chassis: 'blinde', specialite: 'antiStructure',
    points: 10, pv: 200, degats: 10, portee: 2.5, porteeMini: 0, vitesse: 1.2,
    reserve: 250, masse: 5, comportementAerien: null,
    matrice: { infanterie: 0.2, vehicule: 0.3, structureOuAviation: 1 },
    module: 'fumigene', moduleOuvrage: null,
    defense: { present: true, cible: 'antiAerien', module: 'fumigene' },
    apparition: 16, apparitionModule: 32,
  },
  pilon: {
    nom: { ouvrage: 'Pilon', joueur: 'Obusier' }, ta: 'Juggernaut',
    chassis: 'blinde', specialite: 'antiStructure', // lourd
    points: 15, pv: 400, degats: 15, portee: 2.5, porteeMini: 0, vitesse: 1,
    reserve: 300, masse: 20, comportementAerien: null,
    matrice: { infanterie: 0.3, vehicule: 0.3, structureOuAviation: 1 },
    module: 'tirDeBarrage', moduleOuvrage: null,
    // Absent de la défense : choix assumé, pas un oubli (une artillerie de
    // siège n'a pas de rôle en défense rapprochée).
    defense: { present: false, cible: null, module: null },
    apparition: 32, apparitionModule: 44,
  },
  crecelle: {
    nom: { ouvrage: 'Crécelle', joueur: 'Milan' }, ta: 'Orca',
    chassis: 'aeronef', specialite: 'antiInfanterie',
    points: 10, pv: 200, degats: 12, portee: 1.5, porteeMini: 0, vitesse: 1.5,
    reserve: 150, masse: 0, comportementAerien: 'traversant',
    matrice: { infanterie: 1, vehicule: 0.2, structureOuAviation: 0.2 },
    module: 'emp', moduleOuvrage: null,
    defense: { present: false, cible: null, module: null },
    apparition: 10, apparitionModule: 32,
  },
  busard: {
    nom: { ouvrage: 'Busard', joueur: 'Épervier' }, ta: 'Paladin',
    chassis: 'aeronef', specialite: 'antiVehicule',
    points: 10, pv: 200, degats: 10, portee: 2.5, porteeMini: 0, vitesse: 1.5,
    reserve: 200, masse: 0, comportementAerien: 'stoppeur',
    matrice: { infanterie: 0.2, vehicule: 1, structureOuAviation: 0.3 },
    module: 'garnison', moduleOuvrage: null,
    defense: { present: false, cible: null, module: null },
    apparition: 14, apparitionModule: 34,
  },
  frappeur: {
    nom: { ouvrage: 'Frappeur', joueur: 'Foudre' }, ta: 'Firehawk',
    chassis: 'aeronef', specialite: 'antiStructure', // rapide
    points: 10, pv: 150, degats: 20, portee: 1.5, porteeMini: 0, vitesse: 3,
    reserve: 300, masse: 0, comportementAerien: 'traversant',
    matrice: { infanterie: 0, vehicule: 0, structureOuAviation: 1 },
    module: 'camouflage', moduleOuvrage: null,
    defense: { present: false, cible: null, module: null },
    apparition: 20, apparitionModule: 36,
  },
  enclume: {
    nom: { ouvrage: 'Enclume', joueur: 'Albatros' }, ta: 'Kodiak',
    chassis: 'aeronef', specialite: 'antiStructure', // lourd
    points: 15, pv: 300, degats: 10, portee: 2.5, porteeMini: 0, vitesse: 1.5,
    reserve: 300, masse: 0, comportementAerien: 'stoppeur',
    matrice: { infanterie: 0.3, vehicule: 0.3, structureOuAviation: 1 },
    module: 'bouclier', moduleOuvrage: 'volDeVie',
    defense: { present: false, cible: null, module: null },
    apparition: 36, apparitionModule: 46,
  },
};

// --- défenses ----------------------------------------------------------------
// Neuf structures. Le joueur et l'Ouvrage construisent les mêmes ; seul le
// module diffère. Les barrières ne bloquent pas : on les traverse en perdant
// des PV (degatsFranchissement, par tick). Le mur bloque et s'attaque jusqu'à
// destruction. Les trois artilleries sont des VÉHICULES, pas des structures :
// c'est ce qui explique la part de cibles véhicule d'une garnison de haut
// niveau. Une unité défensive mobile traverse librement toute sa rangée.
export const DEFENSES = {
  merlon: {
    nom: 'Merlon', ta: 'Mur', type: 'mur', cible: null,
    points: 5, pv: 500, degats: 0, portee: 0, porteeMini: 0,
    degatsFranchissement: 0, bloque: true, matrice: null, // ne tire pas
    moduleJoueur: 'autoReparation', moduleOuvrage: 'pvPlusVingt',
    apparition: 6, apparitionModule: 32,
  },
  ronce: {
    nom: 'Ronce', ta: 'Barbelés', type: 'barriere', cible: 'infanterie',
    points: 5, pv: 200, degats: 0, portee: 1, porteeMini: 0,
    // Divisé par 8 au lot 2B. À 20 PV/tick, un Fusilier mourait quatre fois
    // avant d'avoir franchi la case (20 ticks de traversée, 5 de survie) :
    // « traversable, blesse au passage » n'avait plus de sens.
    degatsFranchissement: 2.5, bloque: false,
    matrice: { infanterie: 1, vehicule: 0.1, structureOuAviation: 0 },
    moduleJoueur: 'autoReparation', moduleOuvrage: 'pvPlusVingt',
    apparition: 24, apparitionModule: 38,
  },
  herse: {
    nom: 'Herse', ta: 'Anti-tank barrier', type: 'barriere', cible: 'vehicule',
    points: 5, pv: 200, degats: 0, portee: 1, porteeMini: 0,
    // 15 PV/tick, et 0,03 seulement contre l'infanterie (arbitrage du lot 2B).
    // La Herse cesse ainsi d'être une meilleure Ronce que la Ronce : elle
    // coûte 9 % à un Fusilier là où la Ronce lui coûte 50 %.
    degatsFranchissement: 15, bloque: false,
    matrice: { infanterie: 0.03, vehicule: 1, structureOuAviation: 0 },
    moduleJoueur: 'autoReparation', moduleOuvrage: 'pvPlusVingt',
    apparition: 20, apparitionModule: 34,
  },
  casemate: {
    nom: 'Casemate', ta: 'MG Nest', type: 'tourelle', cible: 'infanterie',
    points: 8, pv: 350, degats: 15, portee: 2.5, porteeMini: 0,
    degatsFranchissement: 0, bloque: true,
    matrice: { infanterie: 1, vehicule: 0.4, structureOuAviation: 0.6 },
    moduleJoueur: 'autoReparation', moduleOuvrage: 'munitionSpeciale',
    apparition: 8, apparitionModule: 30,
  },
  creneau: {
    nom: 'Créneau', ta: 'Tourelle anti-véhicule', type: 'tourelle', cible: 'vehicule',
    points: 10, pv: 350, degats: 15, portee: 2.5, porteeMini: 0,
    degatsFranchissement: 0, bloque: true,
    matrice: { infanterie: 0.6, vehicule: 1, structureOuAviation: 0 },
    moduleJoueur: 'autoReparation', moduleOuvrage: 'munitionSpeciale',
    apparition: 18, apparitionModule: 38,
  },
  batterie: {
    nom: 'Batterie', ta: 'Flak', type: 'tourelle', cible: 'aviation',
    points: 10, pv: 350, degats: 15, portee: 2.5, porteeMini: 0,
    degatsFranchissement: 0, bloque: true,
    matrice: { infanterie: 0, vehicule: 0, structureOuAviation: 1 },
    moduleJoueur: 'autoReparation', moduleOuvrage: 'munitionSpeciale',
    apparition: 14, apparitionModule: 34,
  },
  faucheuse: {
    nom: 'Faucheuse', ta: 'Reaper', type: 'artillerie', cible: 'infanterie',
    points: 22, pv: 200, degats: 20, portee: 5.5, porteeMini: 3.5,
    degatsFranchissement: 0, bloque: true,
    matrice: { infanterie: 1, vehicule: 0.3, structureOuAviation: 0.4 },
    moduleJoueur: 'rayonMiniMoinsUn', moduleOuvrage: 'rayonMiniMoinsUn',
    apparition: 26, apparitionModule: 42,
  },
  mortier: {
    nom: 'Mortier', ta: 'Demolisher', type: 'artillerie', cible: 'vehicule',
    points: 30, pv: 200, degats: 20, portee: 5.5, porteeMini: 3.5,
    degatsFranchissement: 0, bloque: true,
    matrice: { infanterie: 0.3, vehicule: 1, structureOuAviation: 0 },
    moduleJoueur: 'rayonMiniMoinsUn', moduleOuvrage: 'rayonMiniMoinsUn',
    apparition: 30, apparitionModule: 44,
  },
  harpon: {
    nom: 'Harpon', ta: 'SAM', type: 'artillerie', cible: 'aviation',
    points: 30, pv: 200, degats: 20, portee: 5.5, porteeMini: 3.5,
    degatsFranchissement: 0, bloque: true,
    matrice: { infanterie: 0, vehicule: 0, structureOuAviation: 1 },
    moduleJoueur: 'rayonMiniMoinsUn', moduleOuvrage: 'rayonMiniMoinsUn',
    apparition: 32, apparitionModule: 46,
  },
};

// --- modules -----------------------------------------------------------------
// Améliorations PERMANENTES, appliquées à toutes les unités du type concerné.
// Glossaire : ce dictionnaire ne dit pas qui les porte — les affectations sont
// dans UNITES.module / moduleOuvrage et DEFENSES.moduleJoueur / moduleOuvrage.
export const MODULES = {
  fumigene: 'Désactive une infanterie 5 s, une fois par raid. Effet −20 % si la cible est de niveau supérieur.',
  emp: 'Désactive un véhicule 5 s, une fois par raid. Même pénalité de niveau.',
  tirDeBarrage: 'Inflige 30 % des dégâts aux structures voisines.',
  booster: 'Après avoir été blessée, vitesse ×10 pendant 3 s, une fois par raid.',
  garnison: "Embarque une infanterie et la débarque derrière la ligne, ou à la destruction du porteur, sans pénalité.",
  ecraseur: 'Force les murs — 10 % de dégâts par seconde — et masse ×2 pour l’écrasement.',
  autoReparation: 'Répare 20 % des PV manquants après le raid, indépendamment du QG.',
  bouclier: 'Encaisse les dégâts des alliés dans un rayon de 2,5. PV du bouclier = 100 % des PV du porteur.',
  camouflage: 'Invisible pour la défense ; sort du camouflage si une cible de prédilection entre à portée.',
  munitionSpeciale: 'Ajoute 0,2 à la matrice contre la cible de prédilection.',
  volDeVie: 'Convertit 20 % des dégâts infligés en PV.',
  pvPlusVingt: 'Ajoute 20 % de PV.',
  rayonMiniMoinsUn: 'Réduit la portée minimale de 1.',
  rayonPlusUn: "Ajoute 1 de portée.",
};

// --- écrasement --------------------------------------------------------------
// Un seul seuil, trois cas : masse supérieure → écrasement, donc pas de blocage.
// Masse égale → blocage mutuel. L'écrasement est indépendant de la prédilection :
// bloquer et tuer sont deux rôles distincts. Masse 0 = aéronef, ne bloque rien
// et n'est bloqué par rien.
export const ECRASEMENT = { regle: 'masse strictement supérieure écrase, masse égale bloque' };

// --- ciblage -----------------------------------------------------------------
// Une seule règle pour les deux camps, aucun tirage aléatoire : la cible valide
// la plus proche ; à égalité, la plus à gauche. Deux entités ne pouvant occuper
// la même case, le couple (rangée, colonne) forme un ordre total et stable.
export const CIBLAGE = { regle: 'plus proche, puis plus à gauche', deterministe: true };
