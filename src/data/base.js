// La base du joueur — transcription figée.
//
// SOURCE : FOYER-ZERO-BATIMENTS-JOUEUR.xlsx, arbitrages d'Ethan des 25/08/2026
// (deux passes). PV et temps de réparation de niveau 1 : RELEVE-TA-COURBES-2.md
// §6.5, valeurs transposées de Tiberium Alliances — le même choix que celui déjà
// fait pour les cinq bâtiments de site de sites.js, où Souche vaut 5 500 comme
// le Construction Yard et Étai 2 500 comme la Defense Facility.
//
// Le classeur est une feuille de saisie. Ce fichier-ci fait foi. CLAUDE.md §1.
//
// Les quatre points laissés ouverts le 25/08 au matin ont été arbitrés le même
// jour : réparation manuelle chez le joueur, noms TA, et le Chantier occupe un
// emplacement. Le quatrième — la courbe de stockage — a été arbitré en
// interpolation linéaire, puis REPRIS : l'interpolation était exacte mais
// l'ancrage la rendait inutilisable aux deux bouts. Voir la section Stockage.

import { GEOGRAPHIE } from './sites.js';
import { ECONOMIE_NIVEAU } from './economie.js';

// ---------------------------------------------------------------------------
// Les onze bâtiments
// ---------------------------------------------------------------------------
//
// `nom.joueur` est le nom affiché. `nom.ouvrage` n'existe que pour les trois
// bâtiments qui ont un pendant côté Ouvrage — les autres n'en ont pas, et la
// clé est absente plutôt que vide : `hasOwnProperty` doit pouvoir trancher.
//
// `pv` et `reparationSec` valent au NIVEAU 1. Ils montent avec facteurMilli de
// sim/combat.js, comme tout le reste des PV du jeu.
//
// `unique` : un seul exemplaire dans la base. Les quatre bâtiments de
// production et de stockage ne le sont pas — c'est le nombre d'emplacements qui
// les limite, et c'est ce qui donne son intérêt au voisinage.

export const BASE_BATIMENTS = {
  chantierDeConstruction: {
    // « Nom TA » arbitré le 25/08 : Construction Yard → Chantier de construction.
    nom: { joueur: 'Chantier de construction', ouvrage: 'Souche' },
    ta: 'Construction Yard',
    role: 'central',
    pv: 5500,
    reparationSec: 88,
    unique: true,
    classeDeCout: 'majeur',
    // Le seul bâtiment sans plancher de PV : sa chute rase la base.
    // MODELE-REPARATION-1.md §2.
    plancherPv: false,
  },
  centreDeCommandement: {
    nom: { joueur: 'Centre de commandement' },
    ta: 'Command Center',
    role: 'qgOffensif',
    pv: 3000,
    reparationSec: 88,
    unique: true,
    classeDeCout: 'majeur',
    plancherPv: true,
  },
  qgDeDefense: {
    nom: { joueur: 'QG de défense' },
    ta: 'Defense HQ',
    role: 'qgDefensif',
    pv: 3000,
    reparationSec: 88,
    unique: true,
    classeDeCout: 'majeur',
    plancherPv: true,
  },
  complexeDeDefense: {
    nom: { joueur: 'Complexe de défense', ouvrage: 'Étai' },
    ta: 'Defense Facility',
    role: 'reparation',
    pv: 2500,
    reparationSec: 88,
    unique: true,
    classeDeCout: 'courant',
    plancherPv: true,
  },
  caserne: {
    // « Nom TA » arbitré le 25/08 : Barracks → Caserne.
    nom: { joueur: 'Caserne' },
    ta: 'Barracks',
    role: 'production',
    chassis: 'escouade',
    pv: 2500,
    reparationSec: 88,
    unique: true,
    classeDeCout: 'courant',
    plancherPv: true,
  },
  usine: {
    // « Nom TA » arbitré le 25/08 : Factory → Usine. Ethan emploie d'ailleurs
    // déjà « usine » dans la ligne des coûts du classeur (EFFETS D28).
    nom: { joueur: 'Usine' },
    ta: 'Factory',
    role: 'production',
    chassis: 'blinde',
    pv: 2500,
    reparationSec: 88,
    unique: true,
    classeDeCout: 'courant',
    plancherPv: true,
  },
  aerodrome: {
    // « Nom TA » arbitré le 25/08 : Airfield → Aérodrome.
    nom: { joueur: 'Aérodrome' },
    ta: 'Airfield',
    role: 'production',
    chassis: 'aeronef',
    pv: 2500,
    reparationSec: 88,
    unique: true,
    classeDeCout: 'courant',
    plancherPv: true,
  },
  centrale: {
    nom: { joueur: 'Centrale' },
    ta: 'Power Plant',
    role: 'producteur',
    ressource: 'electricite',
    pv: 2000,
    reparationSec: 65,
    unique: false,
    classeDeCout: 'modeste',
    plancherPv: true,
  },
  collecteur: {
    nom: { joueur: 'Collecteur', ouvrage: 'Nœud' },
    ta: 'Harvester',
    role: 'producteur',
    ressource: 'quartzOuScorie',
    pv: 1500,
    reparationSec: 65,
    unique: false,
    classeDeCout: 'modeste',
    plancherPv: true,
  },
  raffinerie: {
    // ⚠ « Raffinerie » nomme aussi la Gangue de site (BASE-DU-JOUEUR-1.md §5.1).
    // Collision laissée en l'état : arbitrée sans importance le 25/08.
    nom: { joueur: 'Raffinerie', ouvrage: 'Gangue' },
    ta: 'Tiberium Silo',
    role: 'stockage',
    ressource: 'quartzOuScorie',
    pv: 1000,
    reparationSec: 42,
    unique: false,
    classeDeCout: 'mineur',
    plancherPv: true,
  },
  accumulateur: {
    nom: { joueur: 'Accumulateur' },
    ta: 'Accumulator',
    role: 'stockage',
    ressource: 'electricite',
    pv: 1000,
    reparationSec: 42,
    unique: false,
    classeDeCout: 'mineur',
    plancherPv: true,
  },
};

// ---------------------------------------------------------------------------
// Emplacements — ce que le Chantier de construction ouvre
// ---------------------------------------------------------------------------
//
// Deux emplacements par niveau jusqu'au dixième, puis un seul, plafonné à
// quarante. Le plafond tombe donc au niveau 30, et les vingt derniers niveaux
// du Chantier n'ouvrent plus rien : ils ne servent plus qu'au temps de
// réparation. Conséquence à voir, pas défaut à corriger.
//
//   niveau  1 →  2      niveau 11 → 21      niveau 30 → 40
//   niveau  5 → 10      niveau 20 → 30      niveau 50 → 40
//
// ⚠ Sept bâtiments sont uniques et obligatoires, et le Chantier occupe un
// emplacement. La base démarre donc à UN emplacement libre au niveau 1, et il
// faut monter le Chantier au niveau 4 pour poser les sept obligatoires.
// L'ordre dans lequel le joueur les pose est une vraie décision.

export const EMPLACEMENTS = {
  parNiveauJusqua: { niveau: 10, pas: 2 },
  parNiveauEnsuite: 1,
  plafond: 40,
  // Arbitré le 25/08 : le Chantier occupe lui-même un emplacement. Au niveau 1
  // il en ouvre deux et en prend un — il reste UN emplacement libre, et le
  // deuxième bâtiment de la partie est donc un vrai choix.
  chantierOccupeUnEmplacement: true,
};

/**
 * Nombre d'emplacements ouverts par un Chantier de construction de ce niveau.
 * @param {number} niveau
 * @returns {number} entier, plafonné.
 */
export function emplacementsDuNiveau(niveau) {
  if (!Number.isInteger(niveau) || niveau < 1 || niveau > GEOGRAPHIE.niveauPlafond) {
    throw new Error(`base : niveau ${niveau} hors de 1…${GEOGRAPHIE.niveauPlafond}`);
  }
  const { parNiveauJusqua: seuil, parNiveauEnsuite, plafond } = EMPLACEMENTS;
  const ouverts = niveau <= seuil.niveau
    ? seuil.pas * niveau
    : seuil.pas * seuil.niveau + parNiveauEnsuite * (niveau - seuil.niveau);
  return ouverts > plafond ? plafond : ouverts;
}

// ---------------------------------------------------------------------------
// Réparation — une seule ligne neuve
// ---------------------------------------------------------------------------
//
// Arbitré le 25/08. Quatre régimes, dont TROIS SONT DÉJÀ CODÉS dans
// TYPES_SITE de sites.js — ne pas les recopier ici, une table fait foi par
// grandeur (CLAUDE.md §4) :
//   base de l'Ouvrage ....... `base.reparationHeures: 1` — 0 % à 100 % en 60 min
//   camp .................... `camp.destructionDefinitive: true` — jamais réparé
//   avant-poste ............. `avantPoste.destructionDefinitive: true` — idem
//
// Le seul régime qui n'avait nulle part où vivre est celui du joueur : sa base
// n'est pas un type de site. Il est ici, et il est ici seulement.

export const REPARATION_BASE_JOUEUR = {
  // MANUELLE : rien ne se répare tout seul chez le joueur. C'est la contrepartie
  // du plancher à 1 PV — ses bâtiments survivent toujours, mais il paie pour les
  // remettre debout, là où la base de l'Ouvrage se relève seule en une heure.
  mode: 'manuelle',
};

// ---------------------------------------------------------------------------
// Coûts de construction
// ---------------------------------------------------------------------------
//
// Le niveau 1 est gratuit pour tous. Le premier coût est celui du niveau 2, et
// il dépend de la classe. Au-delà, les ratios d'ECONOMIE_NIVEAU s'appliquent,
// identiques pour les quatre classes : elles ne diffèrent que par l'ancrage.
//
//   majeur   8 → 10 → 20 → 80 → 440 → 1 440 → 4 400 → 12 800 → 35 200 → …
//   courant  5 → …    modeste  3 → …    mineur  2 → …

export const COUT_NIVEAU_DEUX = {
  majeur: 8, // chantier, centre de commandement, QG de défense
  courant: 5, // caserne, dépôt de véhicules, aérodrome, complexe de défense
  modeste: 3, // centrale, collecteur
  mineur: 2, // raffinerie, accumulateur
};

// Coût en électricité d'une amélioration, à partir du niveau 3. Exprimé en
// fraction du coût en quartz du même palier.
// ⚠ « à partir du niveau 3 » : les niveaux 1 et 2 ne coûtent aucune électricité.
export const COUT_ELECTRICITE = {
  premierNiveauPayant: 3,
  fraction: { centrale: 0.1, collecteur: 0.5, autres: 0.25 },
};

// ---------------------------------------------------------------------------
// Débits — production et stockage
// ---------------------------------------------------------------------------
//
// Tout est exprimé PAR HEURE au niveau 1, et monte en × 1,25 par niveau du
// bâtiment qui produit (ECONOMIE_NIVEAU.penteProduction).
//
// Deux canaux, et le second est ce qui donne son sens à la disposition :
//   `propre`   — ce que le bâtiment produit seul ;
//   `parVoisin`— ce qu'il produit EN PLUS pour chaque voisin qualifiant, dans
//                les huit cases qui l'entourent.
// Les deux couples sont réciproques : centrale ↔ accumulateur, collecteur ↔
// raffinerie. Chacun nourrit l'autre.
//
// ⚠ Aucun de ces débits ne tombe rond sur un tick, et c'est SANS IMPORTANCE :
// economy.js arrondit une fois par couple (niveau, voisins), et le tick comme
// le rattrapage lisent le même entier. Chercher des débits divisibles serait de
// toute façon vain — × 1,25 vaut 5/4, il faudrait que la base contienne 4⁴⁹ en
// facteur pour rester entière jusqu'au niveau 50.

export const DEBITS = {
  centrale: {
    propre: 120, // /h au niveau 1
    parVoisin: { champDeScorie: 60, accumulateur: 72 },
  },
  accumulateur: {
    parVoisin: { centrale: 48 },
  },
  collecteur: {
    propre: 240,
    parVoisin: { raffinerie: 72 },
  },
  raffinerie: {
    parVoisin: { collecteur: 72 },
  },
};

// Rayon de voisinage : les huit cases qui entourent le bâtiment.
export const VOISINAGE = { rayon: 1, casesMax: 8 };

// ---------------------------------------------------------------------------
// Stockage — ancré sur une AUTONOMIE, pas sur un nombre d'unités
// ---------------------------------------------------------------------------
//
// POURQUOI L'ANCRAGE A CHANGÉ. La première écriture reprenait les 20 et 15
// unités de Tiberium Alliances, montées en × 2 jusqu'au niveau 10 puis
// interpolées vers × 1,333. Elle donnait ceci :
//
//   niveau  1 : 20 unités contre 240/h de production → PLEIN EN CINQ MINUTES
//   niveau 20 : 7,1 millions contre 16 653/h         → plein en dix-huit jours
//   niveau 50 : 7,2 × 10¹²                           → plein en soixante ans
//
// Le stockage croissait six millions de fois plus vite que la production. Aux
// deux bouts il ratait sa cible : au début il punissait le joueur en permanence,
// à la fin il ne le limitait plus jamais. Et sa capacité de niveau 50 arrivait à
// 1,26 fois seulement sous l'entier sûr en milli-unités — donc incompatible avec
// une boucle en micro-unités.
//
// LE PRINCIPE RETENU. Le stockage n'est pas un nombre d'unités, c'est une DURÉE
// D'ABSENCE TOLÉRÉE. C'est le rôle qu'il a récupéré des colis abandonnés : il
// borne ce qui s'accumule pendant qu'on ne joue pas. On l'écrit donc en heures,
// et la capacité s'en déduit :
//
//   capacité(niveau) = autonomieHeures × débitPropre(niveau du bâtiment)
//
// Le stockage suit donc EXACTEMENT la pente de production, × 1,25, sans rupture
// ni interpolation. Deux conséquences, toutes deux voulues :
//
//   1. À niveau égal entre le producteur et son stockage, l'autonomie est la
//      MÊME sur les cinquante niveaux. Le régulateur est enfin uniforme — ce que
//      le plafond à deux colis n'a jamais su être.
//   2. Elle ne l'est plus dès que le joueur laisse son stockage en retard :
//      autonomie réelle = 12 h × 1,25^(niveau stockage − niveau producteur).
//      Trois niveaux de retard ramènent à 6 h, six niveaux à 3 h. Monter sa
//      raffinerie devient de l'entretien qu'on sent, pas une case à cocher.
//
// LE MUR ARITHMÉTIQUE TOMBE AUSSI. Capacité de niveau 50 : 1,6 × 10⁸ unités au
// lieu de 7,2 × 10¹². Vingt raffineries de niveau 50 plafonnent à 3,2 × 10⁹
// unités, soit 2 790 fois de marge en milli-unités.

export const STOCKAGE = {
  // ⚠ LE réglage de confort du jeu. Douze heures couvrent une nuit et la
  // matinée qui suit. Six heures rendraient le jeu exigeant, vingt-quatre le
  // rendraient permissif : c'est une ligne à changer, et rien d'autre.
  autonomieHeures: 12,
};

/**
 * Capacité de stockage d'un bâtiment de stockage, à ce niveau, en UNITÉS.
 * Elle vaut l'autonomie voulue multipliée par le débit propre du PRODUCTEUR
 * apparié, pris au même niveau — la raffinerie se règle sur le collecteur,
 * l'accumulateur sur la centrale.
 * @param {'raffinerie'|'accumulateur'} id
 * @param {number} niveau
 * @returns {number} arrondi à l'entier, une seule fois, à la fin.
 */
export function capaciteDuNiveau(id, niveau) {
  const def = BASE_BATIMENTS[id];
  if (def === undefined || def.role !== 'stockage') {
    throw new Error(`base : ${id} n'est pas un bâtiment de stockage`);
  }
  if (!Number.isInteger(niveau) || niveau < 1 || niveau > GEOGRAPHIE.niveauPlafond) {
    throw new Error(`base : niveau ${niveau} hors de 1…${GEOGRAPHIE.niveauPlafond}`);
  }
  const producteur = PRODUCTEUR_APPARIE[id];
  return Math.round(
    STOCKAGE.autonomieHeures * debitParHeure(producteur, niveau),
  );
}

/** Quel producteur alimente quel stockage. Les deux couples sont réciproques. */
export const PRODUCTEUR_APPARIE = { raffinerie: 'collecteur', accumulateur: 'centrale' };

// ---------------------------------------------------------------------------
// Débit horaire — et pourquoi il n'est PAS exprimé par tick
// ---------------------------------------------------------------------------
//
// `sim/economy.js` range aujourd'hui un débit en milli-unités PAR TICK, arrondi
// une fois par couple (niveau, voisins). L'arrondi est cohérent — tick et
// rattrapage lisent le même entier — mais il est gros : à 10 Hz, 240/h tombe
// sur 6,67 milli/tick, et arrondir coûte 5 % ; 48/h coûte 25 %.
//
// LE CORRECTIF est de ne plus jamais arrondir un débit par tick. On garde le
// débit PAR HEURE, entier, et on porte un résidu :
//
//   residu += debitParHeure
//   gain    = Math.floor(residu / TICKS_PAR_HEURE)
//   residu  = residu % TICKS_PAR_HEURE
//
// L'erreur d'arrondi par tick devient EXACTEMENT NULLE, à n'importe quelle
// fréquence. Le rattrapage reste en O(1) et reste exact au bit près :
//
//   total  = residu + N × debitParHeure
//   gain   = Math.floor(total / TICKS_PAR_HEURE)
//   residu = total % TICKS_PAR_HEURE
//
// Vérifié par tirage aléatoire : 200 couples (résidu, débit, N), pas-à-pas
// contre formule fermée, identiques à chaque fois. Pire cas de débordement —
// dix ans hors ligne à 1 Hz au débit du niveau 50 — reste deux fois sous
// l'entier sûr, et le plafond de stockage borne bien avant.
//
// ⚠ CE CORRECTIF EST UN CHANGEMENT DE `sim/economy.js`, PAS DE CE FICHIER. Il
// touche fluxMilliParTick, le rattrapage analytique et le format d'état. Il
// n'est pas dans ce lot : les données ci-dessous sont écrites pour lui, et
// restent lisibles par le code actuel en attendant.
//
// Le seul arrondi qui subsiste est celui du débit horaire lui-même, fait une
// fois par niveau : nul aux niveaux 1 à 3, 0,053 % au niveau 4, et sous le
// millionième de pour cent au niveau 50.

/**
 * Débit propre d'un producteur à ce niveau, en unités PAR HEURE.
 * @param {'centrale'|'collecteur'} id
 * @param {number} niveau
 * @returns {number} entier.
 */
export function debitParHeure(id, niveau) {
  const def = DEBITS[id];
  if (def === undefined || def.propre === undefined) {
    throw new Error(`base : ${id} n'est pas un producteur`);
  }
  if (!Number.isInteger(niveau) || niveau < 1 || niveau > GEOGRAPHIE.niveauPlafond) {
    throw new Error(`base : niveau ${niveau} hors de 1…${GEOGRAPHIE.niveauPlafond}`);
  }
  return Math.round(def.propre * ECONOMIE_NIVEAU.penteProduction ** (niveau - 1));
}

/**
 * Débit d'un voisin qualifiant, en unités PAR HEURE. Le bonus se règle sur le
 * niveau du bâtiment QUI PRODUIT, pas sur celui du voisin.
 * @param {string} id bâtiment producteur du bonus
 * @param {string} voisin type de voisin qualifiant
 * @param {number} niveau niveau du bâtiment producteur
 * @returns {number} entier.
 */
export function debitVoisinParHeure(id, voisin, niveau) {
  const base = DEBITS[id]?.parVoisin?.[voisin];
  if (base === undefined) {
    throw new Error(`base : ${id} ne tire aucun bonus d'un voisin ${voisin}`);
  }
  if (!Number.isInteger(niveau) || niveau < 1 || niveau > GEOGRAPHIE.niveauPlafond) {
    throw new Error(`base : niveau ${niveau} hors de 1…${GEOGRAPHIE.niveauPlafond}`);
  }
  return Math.round(base * ECONOMIE_NIVEAU.penteProduction ** (niveau - 1));
}
