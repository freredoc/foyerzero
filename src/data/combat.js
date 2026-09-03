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
// Convention du dépôt (CLAUDE.md §4) : toutes les valeurs de calibrage vivent
// dans src/data/, jamais en dur dans src/sim/. Elle est née dans l'ancien
// data/params.js, retiré le 27/08 — la convention, elle, n'a pas bougé.

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


  // Une unité offensive qui ne peut NI avancer NI nuire pendant ce nombre de
  // ticks consécutifs rentre à la base : elle sort du champ sans être détruite,
  // et compte parmi les survivants. 30 ticks = 3 s, soit 3,3 % des 900 ticks
  // d'un raid — assez pour qu'un blocage transitoire (un allié qui repart, une
  // cible qui meurt et en libère une autre) ne renvoie pas chez elle une unité
  // qui allait percer. Le compteur se remet à zéro dès qu'une des deux
  // conditions cesse d'être vraie.
  ticksAvantRepli: 30,
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

// --- les trois colonnes de dégâts --------------------------------------------
// Trois colonnes pour toutes les entités. La troisième change de sens selon le
// camp : structure en offense, aviation en défense. Les deux lectures ne se
// croisent jamais — aucun aéronef ne défend, aucun défenseur ne rencontre de
// structure amie. Le §3 du relevé valide cette bascule sur le moteur d'origine :
// la même unité, consultée en attaque puis en défense, porte les mêmes nombres à
// une case près, la quatrième passant du bâtiment à l'aviation. Trois colonnes
// suffisent, une quatrième serait redondante.
//
// Règle de bascule, sans exception : anti-structure en attaque → anti-aérien en
// défense. Les deux autres spécialités se conservent.
//
// ⚠ LOT 4A — il n'y a PLUS de matrice de facteurs. Les dégâts sont ABSOLUS, un
// entier par colonne, en PV par tir. La raison est arithmétique : le Fusilier
// mesuré fait 3 520 · 1 760 · 1 120, dont les ratios valent 1 · 0,5 · 0,31818…,
// qui ne tient dans aucun entier ; en absolu, 22 · 11 · 7 est exact. Aucune des
// 57 valeurs de dégâts du relevé n'a de ratio propre, toutes sont multiples de
// 160. La prédilection n'est donc plus « le facteur vaut 1 » mais « la colonne
// la plus élevée » — les deux lectures coïncident sur les 23 profils.
export const COLONNES_DEGATS = ['infanterie', 'vehicule', 'structureOuAviation'];

// --- l'échelle de temps ------------------------------------------------------
// Le relevé donne des dégâts délivrés sur T secondes ; notre moteur tire 10 fois
// par seconde. Donc degats = valeur_relevée / (10 × T).
//
// T = 16 s n'est pas un compromis, c'est le seul choix EXACT de la plage utile :
// les 57 valeurs de dégâts du relevé ont 160 pour PGCD, de la plus petite (160,
// le Watchtower contre l'aviation) à la plus grande (48 000, le Firehawk contre
// les bâtiments). La conversion est entière si et seulement si 10 × T divise
// 160. T = 20 donnerait 200, T = 13 donnerait 130, T = 10 donnerait 100 — aucun
// ne divise 160, et chaque profil demanderait un arrondi.
export const ECHELLE_DEGATS = {
  secondes: 16,
  parTir: 160, // 10 tirs/s × 16 s : le diviseur des valeurs du relevé
};

// --- unités ------------------------------------------------------------------
// 14 unités, trois châssis. Deux jeux de noms : le joueur emploie le vocabulaire
// d'une armée régulière, l'Ouvrage celui des outils et des bêtes. La même ligne
// sert les deux camps ; seul le module peut différer (moduleOuvrage).
//
// Cadence : 10 tirs/s pour tout le monde, DPS = degats × 10, par colonne.
// Aucune portée minimale offensive — elle n'existe plus que côté défense.
// Les dégâts sont proportionnels au pourcentage de PV restants, partout.
//
// LOT 4A — profils MESURÉS, plus aucune valeur devinée. PV, dégâts, portée et
// vitesse sortent tels quels du §6 de RELEVE-TA-COURBES-2.md.
//   degats         PV par tir et par colonne = valeur du relevé ÷ 160.
//   vitesse        MILLI-CASES par tick, directement la valeur du relevé.
//                  60 · 90 · 120 · 240, toutes divisibles par 2,5 (24 · 36 ·
//                  48 · 96), donc exactes aussi sous obstacle.
//   reserve        SEULE valeur non mesurée : le relevé ÷ 10. Prise au pied de
//                  la lettre elle donnerait de 40 à 500 secondes de tir pour un
//                  raid qui en dure 90 — dix unités sur quatorze auraient de
//                  quoi tirer plus longtemps que le combat entier, et le
//                  plancher de 10 % ne mordrait plus sur personne. Divisée par
//                  10 : de 4 s (Guetteur) à 50 s (Fouisseurs, Pilon).
//   degatsParcours dégâts d'écrasement mesurés, propriété des VÉHICULES et non
//                  des barrières. Rangés ici, PAS câblés : notre écrasement
//                  reste au seuil de masse, arbitrage d'Ethan (§8 du brief).
//   reparation     secondes au bâtiment producteur de niveau 1, §4 du relevé.
//                  Hors périmètre du moteur de combat, rangé en données.
// `apparition` / `apparitionModule` : niveau auquel l'Ouvrage débloque l'unité,
// puis son module. UNITES fait foi (arbitrage du 24/08) ; CIBLAGE-DEFENSE avait
// trois valeurs divergentes, écartées.
export const UNITES = {
  meute: {
    nom: { ouvrage: 'Meute', joueur: 'Fusiliers' }, ta: 'Rifleman Squad',
    chassis: 'escouade', specialite: 'antiInfanterie',
    points: 5, pv: 700, portee: 1.5, porteeMini: 0, vitesse: 60,
    reserve: 70, masse: 1, comportementAerien: null,
    degats: { infanterie: 22, vehicule: 11, structureOuAviation: 7 },
    degatsParcours: 0, reparation: 441,
    module: 'flashbang', moduleOuvrage: null,
    // ⚠ « SI DIFFÉRENT » NE VEUT PAS DIRE « AUCUN ». La colonne « Module en
    // défense (si différent) » de CIBLAGE-DEFENSE est VIDE pour la Meute : elle
    // dit « le même qu'en offense », et le dépôt l'avait lue comme une absence.
    // Corrigé au lot RECHERCHE, où le prix d'un module sans module n'a pas de sens.
    defense: { present: true, cible: 'antiInfanterie', module: 'flashbang' },
    apparition: 0, apparitionModule: 20,
  },
  guetteur: {
    nom: { ouvrage: 'Guetteur', joueur: 'Voltigeurs' }, ta: 'Sniper Team',
    chassis: 'escouade', specialite: 'antiInfanterie', // longue portée
    points: 10, pv: 500, portee: 2.5, porteeMini: 0, vitesse: 60,
    reserve: 40, masse: 1, comportementAerien: null,
    degats: { infanterie: 30, vehicule: 5, structureOuAviation: 4 },
    degatsParcours: 0, reparation: 882,
    module: 'camouflage', moduleOuvrage: null,
    // Seule unité qui garde son rôle des deux côtés — c'est ce qui la
    // caractérise. Le classeur la donnait anti-véhicule en défense : écarté.
    defense: { present: true, cible: 'antiInfanterie', module: 'rayonPlusUn' },
    apparition: 22, apparitionModule: 40,
  },
  perceurs: {
    nom: { ouvrage: 'Perceurs', joueur: 'Grenadiers' }, ta: 'Missile Squad',
    chassis: 'escouade', specialite: 'antiStructure', // matrice : 1 en structure
    points: 5, pv: 700, portee: 1.5, porteeMini: 0, vitesse: 60,
    reserve: 250, masse: 1, comportementAerien: null,
    degats: { infanterie: 5, vehicule: 12, structureOuAviation: 25 },
    degatsParcours: 0, reparation: 441,
    module: 'tirDeBarrage', moduleOuvrage: null,
    // Même correction que la Meute : la colonne vide de CIBLAGE-DEFENSE disait
    // « identique à l'offense », pas « aucun module ». Voir data/modules.js.
    defense: { present: true, cible: 'antiAerien', module: 'tirDeBarrage' },
    apparition: 4, apparitionModule: 22,
  },
  fouisseurs: {
    nom: { ouvrage: 'Fouisseurs', joueur: 'Sapeurs' }, ta: 'Commando',
    chassis: 'escouade', specialite: 'antiStructure',
    points: 10, pv: 900, portee: 1.5, porteeMini: 0, vitesse: 60,
    reserve: 500, masse: 1, comportementAerien: null,
    degats: { infanterie: 8, vehicule: 4, structureOuAviation: 50 },
    degatsParcours: 0, reparation: 882,
    module: 'booster', moduleOuvrage: 'camouflage',
    defense: { present: false, cible: null, module: null },
    apparition: 24, apparitionModule: 38,
  },
  carapace: {
    nom: { ouvrage: 'Carapace', joueur: 'Cuirassiers' }, ta: 'Zone Troopers',
    chassis: 'escouade', specialite: 'antiVehicule',
    points: 10, pv: 800, portee: 1.5, porteeMini: 0, vitesse: 60,
    reserve: 60, masse: 1, comportementAerien: null,
    degats: { infanterie: 4, vehicule: 35, structureOuAviation: 6 },
    degatsParcours: 0, reparation: 441,
    module: 'booster', moduleOuvrage: 'camouflage',
    defense: { present: true, cible: 'antiVehicule', module: 'emp' },
    apparition: 8, apparitionModule: 28,
  },
  ratisseur: {
    nom: { ouvrage: 'Ratisseur', joueur: 'Éclaireur' }, ta: 'Guardian',
    chassis: 'blinde', specialite: 'antiInfanterie',
    points: 10, pv: 1000, portee: 1.5, porteeMini: 0, vitesse: 120,
    reserve: 80, masse: 5, comportementAerien: null,
    degats: { infanterie: 32, vehicule: 12, structureOuAviation: 15 },
    degatsParcours: 32, reparation: 972,
    module: 'garnison', moduleOuvrage: null,
    defense: { present: true, cible: 'antiInfanterie', module: 'garnison' },
    apparition: 18, apparitionModule: 36,
  },
  fendeur: {
    nom: { ouvrage: 'Fendeur', joueur: 'Chasseur' }, ta: 'Predator',
    chassis: 'blinde', specialite: 'antiVehicule',
    points: 10, pv: 1000, portee: 2.5, porteeMini: 0, vitesse: 90,
    reserve: 100, masse: 10, comportementAerien: null,
    degats: { infanterie: 6, vehicule: 23, structureOuAviation: 10 },
    degatsParcours: 23, reparation: 972,
    module: 'ecraseur', moduleOuvrage: null,
    defense: { present: true, cible: 'antiVehicule', module: 'emp' },
    apparition: 12, apparitionModule: 34,
  },
  broyeur: {
    nom: { ouvrage: 'Broyeur', joueur: 'Percheron' }, ta: 'Mammoth',
    chassis: 'blinde', specialite: 'antiVehicule', // lourd ; matrice : 1 en véhicule
    points: 15, pv: 2000, portee: 2.5, porteeMini: 0, vitesse: 90,
    reserve: 180, masse: 20, comportementAerien: null,
    degats: { infanterie: 15, vehicule: 28, structureOuAviation: 18 },
    degatsParcours: 25, reparation: 1458,
    module: 'ecraseur', moduleOuvrage: 'volDeVie',
    defense: { present: true, cible: 'antiVehicule', module: 'pvPlusVingt' },
    apparition: 28, apparitionModule: 42,
  },
  belier: {
    nom: { ouvrage: 'Bélier', joueur: 'Pionnier' }, ta: 'Pitbull',
    chassis: 'blinde', specialite: 'antiStructure',
    points: 10, pv: 800, portee: 2.5, porteeMini: 0, vitesse: 120,
    reserve: 250, masse: 5, comportementAerien: null,
    degats: { infanterie: 7, vehicule: 12, structureOuAviation: 25 },
    degatsParcours: 7, reparation: 972,
    module: 'flashbang', moduleOuvrage: null,
    defense: { present: true, cible: 'antiAerien', module: 'flashbang' },
    apparition: 16, apparitionModule: 32,
  },
  pilon: {
    nom: { ouvrage: 'Pilon', joueur: 'Obusier' }, ta: 'Juggernaut',
    chassis: 'blinde', specialite: 'antiStructure', // lourd
    points: 15, pv: 1300, portee: 2.5, porteeMini: 0, vitesse: 60,
    reserve: 500, masse: 20, comportementAerien: null,
    degats: { infanterie: 5, vehicule: 10, structureOuAviation: 50 },
    degatsParcours: 40, reparation: 1458,
    module: 'tirDeBarrage', moduleOuvrage: null,
    // Absent de la défense : choix assumé, pas un oubli (une artillerie de
    // siège n'a pas de rôle en défense rapprochée).
    defense: { present: false, cible: null, module: null },
    apparition: 32, apparitionModule: 44,
  },
  crecelle: {
    nom: { ouvrage: 'Crécelle', joueur: 'Milan' }, ta: 'Orca',
    chassis: 'aeronef', specialite: 'antiInfanterie',
    points: 10, pv: 900, portee: 1.5, porteeMini: 0, vitesse: 120,
    reserve: 120, masse: 0, comportementAerien: 'traversant',
    degats: { infanterie: 36, vehicule: 18, structureOuAviation: 12 },
    degatsParcours: 0, reparation: 1070,
    module: 'emp', moduleOuvrage: null,
    defense: { present: false, cible: null, module: null },
    apparition: 10, apparitionModule: 32,
  },
  busard: {
    nom: { ouvrage: 'Busard', joueur: 'Épervier' }, ta: 'Paladin',
    chassis: 'aeronef', specialite: 'antiVehicule',
    points: 10, pv: 1050, portee: 2.5, porteeMini: 0, vitesse: 120,
    reserve: 120, masse: 0, comportementAerien: 'stoppeur',
    degats: { infanterie: 4, vehicule: 20, structureOuAviation: 12 },
    degatsParcours: 0, reparation: 1070,
    module: 'garnison', moduleOuvrage: null,
    defense: { present: false, cible: null, module: null },
    apparition: 14, apparitionModule: 34,
  },
  frappeur: {
    nom: { ouvrage: 'Frappeur', joueur: 'Foudre' }, ta: 'Firehawk',
    chassis: 'aeronef', specialite: 'antiStructure', // rapide
    points: 10, pv: 550, portee: 1.5, porteeMini: 0, vitesse: 240,
    reserve: 450, masse: 0, comportementAerien: 'traversant',
    degats: { infanterie: 0, vehicule: 0, structureOuAviation: 300 },
    degatsParcours: 0, reparation: 1070,
    module: 'camouflage', moduleOuvrage: null,
    defense: { present: false, cible: null, module: null },
    apparition: 20, apparitionModule: 36,
  },
  enclume: {
    nom: { ouvrage: 'Enclume', joueur: 'Albatros' }, ta: 'Kodiak',
    chassis: 'aeronef', specialite: 'antiStructure', // lourd
    points: 15, pv: 1800, portee: 2.5, porteeMini: 0, vitesse: 120,
    reserve: 400, masse: 0, comportementAerien: 'stoppeur',
    degats: { infanterie: 10, vehicule: 15, structureOuAviation: 40 },
    degatsParcours: 0, reparation: 1605,
    module: 'bouclier', moduleOuvrage: 'volDeVie',
    defense: { present: false, cible: null, module: null },
    apparition: 36, apparitionModule: 46,
  },
};

/**
 * L'ordre dans lequel les trois châssis se présentent au joueur.
 *
 * ⚠⚠ ETHAN, 03/09/2026 : « ui armée : une barre : d'abord l'infanterie puis
 * véhicule et avion ». C'est un ordre d'AFFICHAGE, et il porte sur le châssis —
 * pas sur l'unité. Il vit donc ici, à côté de la clé qu'il trie.
 *
 * ⚠⚠ ET IL EST DÉJÀ CELUI DE `UNITES`, MESURÉ : les cinq escouades y viennent
 * d'abord, puis les cinq blindés, puis les quatre aéronefs. Ce que cette table
 * change à l'écran AUJOURD'HUI est donc RIEN — et c'est exactement ce qu'on lui
 * demande. Ce qu'elle change, c'est le statut du fait : l'ordre cesse d'être
 * une coïncidence de la table pour devenir une propriété de la palette, qui
 * tient encore si quelqu'un insère une quinzième unité au mauvais rang.
 *
 * ⚠ ET C'EST L'INVERSE DE `ORDRE_PALETTE` DE `data/base.js`, ÉCRITE LA VEILLE.
 * Là-bas, AUCUNE clé du roster ne disait « ce bâtiment vient tôt » : il a fallu
 * écrire les onze noms à la main, faute de grandeur à trier. Ici la clé existe
 * depuis toujours — `UNITES[x].chassis` classe les quatorze —, donc on trie, on
 * ne recopie pas. Une seconde liste de quatorze noms serait la première à
 * oublier une unité.
 *
 * ⚠ LE TRI EST STABLE, ET C'EST LA MOITIÉ QUI COMPTE. Ethan a donné l'ordre des
 * TROIS châssis, pas celui des quatorze unités : à l'intérieur d'un groupe,
 * l'ordre du roster fait foi. Un tri instable réordonnerait les cinq escouades
 * entre elles sans que personne l'ait décidé.
 */
export const ORDRE_CHASSIS = ['escouade', 'blinde', 'aeronef'];


// --- défenses ----------------------------------------------------------------
// Neuf structures. Le joueur et l'Ouvrage construisent les mêmes ; seul le
// module diffère. Les barrières ne bloquent pas : on les traverse en perdant
// des PV (degatsFranchissement, par tick et par colonne, en MILLI-PV — la Ronce
// vaut 2,5 PV/tick contre l'infanterie, qui ne s'écrit pas en entier autrement).
//
// ⚠ Le franchissement est la seule grandeur de combat que le lot 4A NE reprend
// PAS du relevé. Son §6.4 affiche zéro pour les trois barrières et dit la valeur
// non exposée par le jeu d'origine : le ÷8 de la Ronce et les 15 PV/tick de la
// Herse restent nos choix, arbitrés au lot 2B, et sont reportés à l'identique
// dans la nouvelle forme (ancien degatsFranchissement × ancienne matrice).
//
// Pour une défense, la troisième colonne se lit AVIATION : une défense ne vise
// jamais de bâtiment. C'est la quatrième colonne du relevé, pas sa colonne bât.
//
// Le mur bloque et s'attaque jusqu'à destruction. Les trois artilleries — la
// Faucheuse, le Mortier et le Harpon — sont des VÉHICULES, pas des structures :
// c'est ce qui explique la part de cibles véhicule d'une garnison de haut
// niveau. Une unité défensive mobile traverse librement toute sa rangée.
export const DEFENSES = {
  merlon: {
    nom: { ouvrage: 'Merlon', joueur: 'Mur de défense' }, ta: 'Wall', type: 'mur', cible: null,
    points: 5, pv: 2000, portee: 0, porteeMini: 0,
    degatsFranchissement: null, bloque: true,
    degats: null, // ne tire pas
    moduleJoueur: 'autoReparation', moduleOuvrage: 'pvPlusVingt',
    apparition: 6, apparitionModule: 32,
  },
  ronce: {
    nom: { ouvrage: 'Ronce', joueur: 'Barbelés' }, ta: 'Barbwire', type: 'barriere', cible: 'infanterie',
    points: 5, pv: 1000, portee: 1, porteeMini: 0,
    // Divisé par 8 au lot 2B. À 20 PV/tick, un Fusilier mourait quatre fois
    // avant d'avoir franchi la case (20 ticks de traversée, 5 de survie) :
    // « traversable, blesse au passage » n'avait plus de sens.
    degatsFranchissement: {
      infanterie: 2500, vehicule: 250, structureOuAviation: 0,
    },
    bloque: false,
    degats: null,
    moduleJoueur: 'autoReparation', moduleOuvrage: 'pvPlusVingt',
    apparition: 24, apparitionModule: 38,
  },
  herse: {
    nom: { ouvrage: 'Herse', joueur: 'Barrière anti-char' }, ta: 'Anti-tank barrier', type: 'barriere', cible: 'vehicule',
    points: 5, pv: 1500, portee: 1, porteeMini: 0,
    // 15 PV/tick, et 0,03 seulement contre l'infanterie (arbitrage du lot 2B).
    // La Herse cesse ainsi d'être une meilleure Ronce que la Ronce : elle
    // coûte 9 % à un Fusilier là où la Ronce lui coûte 50 %.
    degatsFranchissement: {
      infanterie: 450, vehicule: 15000, structureOuAviation: 0,
    },
    bloque: false,
    degats: null,
    moduleJoueur: 'autoReparation', moduleOuvrage: 'pvPlusVingt',
    apparition: 20, apparitionModule: 34,
  },
  casemate: {
    nom: { ouvrage: 'Casemate', joueur: 'Tourelle mitrailleuse' }, ta: 'MG Nest', type: 'tourelle', cible: 'infanterie',
    points: 8, pv: 1000, portee: 2.5, porteeMini: 0,
    degatsFranchissement: null, bloque: true,
    degats: { infanterie: 20, vehicule: 7, structureOuAviation: 8 },
    moduleJoueur: 'autoReparation', moduleOuvrage: 'munitionSpeciale',
    apparition: 8, apparitionModule: 30,
  },
  creneau: {
    nom: { ouvrage: 'Créneau', joueur: 'Canon anti-char' }, ta: 'Guardian Cannon', type: 'tourelle', cible: 'vehicule',
    points: 10, pv: 1250, portee: 2.5, porteeMini: 0,
    degatsFranchissement: null, bloque: true,
    degats: { infanterie: 10, vehicule: 35, structureOuAviation: 0 },
    moduleJoueur: 'autoReparation', moduleOuvrage: 'munitionSpeciale',
    apparition: 18, apparitionModule: 38,
  },
  batterie: {
    nom: { ouvrage: 'Batterie', joueur: 'DCA' }, ta: 'Flak', type: 'tourelle', cible: 'aviation',
    points: 10, pv: 1000, portee: 2.5, porteeMini: 0,
    degatsFranchissement: null, bloque: true,
    degats: { infanterie: 0, vehicule: 0, structureOuAviation: 40 },
    moduleJoueur: 'autoReparation', moduleOuvrage: 'munitionSpeciale',
    apparition: 14, apparitionModule: 34,
  },
  faucheuse: {
    nom: { ouvrage: 'Faucheuse', joueur: 'Mirador' }, ta: 'Watchtower', type: 'artillerie', cible: 'infanterie',
    points: 22, pv: 600, portee: 5.5, porteeMini: 3.5,
    degatsFranchissement: null, bloque: true,
    degats: { infanterie: 10, vehicule: 2, structureOuAviation: 1 },
    moduleJoueur: 'rayonMiniMoinsUn', moduleOuvrage: 'rayonMiniMoinsUn',
    apparition: 26, apparitionModule: 42,
  },
  mortier: {
    nom: { ouvrage: 'Mortier', joueur: 'Artillerie lourde' }, ta: 'Titan Artillery', type: 'artillerie', cible: 'vehicule',
    points: 30, pv: 700, portee: 5.5, porteeMini: 3.5,
    degatsFranchissement: null, bloque: true,
    degats: { infanterie: 2, vehicule: 12, structureOuAviation: 0 },
    moduleJoueur: 'rayonMiniMoinsUn', moduleOuvrage: 'rayonMiniMoinsUn',
    apparition: 30, apparitionModule: 44,
  },
  harpon: {
    nom: { ouvrage: 'Harpon', joueur: 'SAM' }, ta: 'SAM Site', type: 'artillerie', cible: 'aviation',
    points: 30, pv: 650, portee: 5.5, porteeMini: 3.5,
    degatsFranchissement: null, bloque: true,
    degats: { infanterie: 0, vehicule: 0, structureOuAviation: 16 },
    moduleJoueur: 'rayonMiniMoinsUn', moduleOuvrage: 'rayonMiniMoinsUn',
    apparition: 32, apparitionModule: 46,
  },
};

// --- modules -----------------------------------------------------------------
// ⚠⚠ LE GLOSSAIRE A DÉMÉNAGÉ DANS `data/modules.js` AU LOT RECHERCHE, ET IL N'EN
// RESTE PAS DE COPIE ICI. Il portait une paraphrase d'une ligne par module, sans
// un seul nombre ; l'écran Recherche a besoin des définitions chiffrées, et deux
// tables pour une même grandeur sont ce que CLAUDE.md §4 refuse. Ce fichier
// garde ce qui lui appartient : QUI porte quel module — `UNITES[x].module`,
// `moduleOuvrage`, `defense.module`, `DEFENSES[x].moduleJoueur`, `moduleOuvrage`.
// Le glossaire ne l'a jamais dit, et il le disait lui-même.

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
