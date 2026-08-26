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
import { GRILLE } from './combat.js';

// ---------------------------------------------------------------------------
// Les onze bâtiments
// ---------------------------------------------------------------------------
//
// `nom.joueur` est le nom affiché. `nom.ouvrage` n'existe que pour les
// bâtiments qui ont un pendant côté Ouvrage — les autres n'en ont pas, et la
// clé est absente plutôt que vide : `hasOwnProperty` doit pouvoir trancher.
//
// ⚠ ILS SONT TROIS — Souche, Étai, Nœud — et l'histoire de ce nombre mérite
// d'être lue avant de le changer :
//   25/08  la ligne annonce « trois » ; la table en porte QUATRE.
//   26/08  le décompte tombe : quatre. La ligne est corrigée en « quatre ».
//   26/08  Ethan arbitre que le quatrième n'existe pas — la raffinerie n'a pas
//          de pendant. La table repasse à trois, et la ligne avec.
// Les deux corrections étaient justes à leur date. La première réparait un
// décompte, la seconde une donnée. Ce n'est pas un aller-retour.
//
// LE RENVOI SE VÉRIFIE DANS LES DEUX SENS. `sites.js` porte l'appariement de
// l'autre côté : `BATIMENTS.souche.ta` vaut « Chantier de construction »,
// `etai.ta` « Complexe de défense », `noeud.ta` « Collecteur ». Les trois
// bouclent sur `nom.joueur` d'ici. `gangue.ta` vaut « Silo de tiberium » et
// `terril.ta` « Silo de cristal » : ni l'un ni l'autre ne renvoie vers la
// raffinerie, et c'est cette non-boucle qui a révélé l'appariement de trop.
// Un test croise les deux tables ; il tombera si quelqu'un en ajoute un sans
// l'écrire des deux côtés.
//
// ⚠ ATTENTION AU CHAMP `ta`, IL NE VEUT PAS DIRE LA MÊME CHOSE ICI ET LÀ-BAS.
// Dans ce fichier, `ta` est le nom Tiberium Alliances en anglais (« Factory »,
// « Harvester »). Dans `sites.js`, `ta` porte le nom FRANÇAIS du pendant
// joueur, et le nom TA anglais est en commentaire de fin de ligne. Deux
// fichiers, un même nom de champ, deux contenus : ne pas les comparer entre
// eux sans le savoir.
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
  depotDeVehicules: {
    // ⚠ TROIS NOMS ONT COEXISTÉ pour ce bâtiment, et c'est ce qui a fait perdre
    // du temps : la clé disait `usine` / « Usine » (nom TA, Factory), le
    // commentaire de COUT_NIVEAU_DEUX du même fichier disait « dépôt de
    // véhicules », et MODELE-REPARATION-1.md §3 disait « atelier » (corrigé
    // le 26/08, en même temps que ses §6.2 et §6.3).
    // ARBITRÉ le 26/08 par Ethan : c'est **Dépôt de véhicules**, ce qui
    // reprend le nom qu'il avait déjà donné le 24/08 (BASE-DU-JOUEUR-1.md §2).
    // `ta` garde Factory : c'est l'équivalent, pas le nom.
    nom: { joueur: 'Dépôt de véhicules' },
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
    // ⚠ PAS DE `nom.ouvrage`, ET C'EST UN ARBITRAGE, pas un oubli.
    // Ce fichier lui a porté `ouvrage: 'Gangue'` du 25 au 26/08. C'était faux,
    // et sites.js le disait déjà : `BATIMENTS.gangue.ta` vaut « Silo de
    // tiberium », pas « Raffinerie » — le seul des quatre appariements dont le
    // renvoi ne bouclait pas. Un test croisé le garde maintenant.
    //
    // POURQUOI L'APPARIEMENT N'EXISTE PAS. Ethan, le 26/08 : « ce n'est pas
    // vraiment du parallèle, ce n'est pas le miroir ». Côté Ouvrage, le
    // stockage est DEUX bâtiments — Gangue pour le quartz, Terril pour la
    // scorie — parce que c'est du BUTIN, et qu'un butin de quartz n'est pas un
    // butin de scorie. Côté joueur c'est UN bâtiment qui tient les deux. Un
    // vers deux : aucun nom ne convient, et en choisir un serait faux la moitié
    // du temps.
    nom: { joueur: 'Raffinerie' },
    ta: 'Tiberium Silo',
    role: 'stockage',
    // ⚠ `quartzEtScorie`, PAS `quartzOuScorie` — et la nuance porte tout.
    // Le collecteur produit l'un OU l'autre : le champ sous lui tranche, et il
    // ne fera jamais les deux. La raffinerie tient les deux À LA FOIS, et
    // `capaciteDuNiveau` s'applique À CHACUNE séparément : une raffinerie qui
    // affiche 100 stocke 100 de quartz ET 100 de scorie, pas 100 en tout.
    // Arbitré le 26/08. Deux chaînes distinctes parce que deux sens distincts —
    // les écrire pareil, c'est se préparer à additionner deux capacités qui ne
    // s'additionnent pas.
    ressource: 'quartzEtScorie',
    capaciteParRessource: true,
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
// Géométrie — la base du joueur EST la bande « bâtiments » de la grille
// ---------------------------------------------------------------------------
//
// ARBITRÉ le 26/08 par Ethan : « la base du joueur, une base ennemie, un camp,
// un avant-poste, c'est la même géométrie ». Il n'y a donc PAS de grille propre
// à la base du joueur, et il ne faut surtout pas en écrire une : les
// dimensions vivent dans GRILLE de data/combat.js, et elles y vivent seules.
// CLAUDE.md §4 — une table fait foi par grandeur.
//
//   grille complète    9 colonnes × 18 rangées
//   déploiement        rangées  1–2    les vagues y apparaissent
//   défense            rangées  3–10   8 rangées
//   bâtiments          rangées 11–18   8 rangées × 9 colonnes = 72 cases
//
// La base du joueur occupe les 72 cases de la bande « bâtiments ». Le plafond
// d'emplacements du Chantier (40) est donc TOUJOURS le plafond mordant : il
// reste 32 cases que le Chantier n'ouvrira jamais, même au niveau 50. Ce n'est
// pas un défaut — c'est ce qui laisse de la place aux champs et aux passages.

export const GEOMETRIE_BASE = {
  // Références, pas copies. Un changement de GRILLE se propage tout seul.
  premiereRangee: GRILLE.bandes.batiments.premiere,
  derniereRangee: GRILLE.bandes.batiments.derniere,
  premiereColonne: 1,
  derniereColonne: GRILLE.largeur,
};

// ---------------------------------------------------------------------------
// Champs de ressource — le socle des collecteurs
// ---------------------------------------------------------------------------
//
// ARBITRÉ le 26/08 par Ethan. Un champ est une case de terrain, quartz ou
// scorie, et il est le SOCLE d'un collecteur : seul le collecteur peut se poser
// dessus, et c'est la seule chose qui puisse s'y poser. Le nombre de cases de
// champ plafonne donc directement le nombre de collecteurs — DOUZE, dont cinq
// à sept en quartz. Sur une base qui n'ouvrira jamais plus de quarante
// emplacements, c'est un plafond qui mord.
//
// TIRAGE DÉTERMINISTE PAR LA POSITION. « Une base posée à un endroit aura
// toujours les mêmes champs. » La graine du tirage est la position sur la
// carte, pas l'horloge ni la partie : deux joueurs qui s'installeraient au même
// endroit y trouveraient le même terrain. C'est la même discipline que le reste
// du moteur — aucun Math.random, aucune horloge murale.
//
// LA FORME N'EST PAS LIBRE. Les douze cases se groupent en blocs de 1, 2 ou 3
// cases contiguës ; un triplet est droit (I) ou coudé (L), jamais autre chose.
// C'est ce qui fait qu'un collecteur a des voisins de même nature et que la
// disposition se lit à l'œil.
//
// ⚠ JAMAIS SUR LE POURTOUR. Les champs se tiennent à l'intérieur de la bande,
// une case de marge sur les quatre côtés. L'intérieur d'un 8 × 9 vaut donc
// 6 × 7 = 42 cases — rangées 12 à 17, colonnes 2 à 8. (Ethan avait dit « sept
// fois cinq » de mémoire : c'est l'intérieur d'un 9 × 7, l'orientation
// inversée. Corrigé le 26/08, mesuré sur GRILLE.)
//
// ARBITRÉ le 26/08 par Ethan : **ASYMÉTRIE VOULUE**. Le Collecteur ne touche
// AUCUN bonus par champ de ressource voisin. Le champ sous lui décide de ce
// qu'il produit, et c'est tout ce que le terrain lui donne.
//
// Ce n'est pas un trou laissé ouvert, c'est une décision, et elle a une raison
// mécanique : la production suit ×1,25 par niveau quand les coûts suivent
// ×1,32. Sur les 38 niveaux qui séparent 12 de 50, une amélioration finit par
// coûter 7,9 fois plus d'heures de production qu'au départ — c'est ce
// décrochage qui pousse le joueur vers le raid, dont le butin suit la pente des
// coûts (voir ECONOMIE_NIVEAU.penteProduction). Ajouter un multiplicateur de
// terrain au Collecteur amplifierait précisément le canal qu'on a délibérément
// laissé décrocher.
//
// ⚠ `champDeScorie: 60` sur la Centrale reste donc LE SEUL bonus de terrain de
// toute la table, et ce n'est pas un oubli non plus : il est né avec
// l'électricité, quatrième grandeur non pillable, comme son unique ancrage au
// sol. Tout le reste est bâtiment-à-bâtiment.
//
// Un test asserte la forme EXACTE de `collecteur.parVoisin` : ajouter une clé
// de terrain ici fera tomber la suite, plutôt que de glisser dans l'équilibrage
// sans que personne ne revoie la décision.
//
// ⚠ CE QUI N'EST PAS ENCORE ARBITRÉ, et qui n'est donc PAS écrit ici :
//   - si le redéploiement du joueur (Chantier détruit, 20 cases vers le bas)
//     retire les champs. La position change, donc le tirage change : ça
//     découle du code de sim/champs.js, mais ça n'a jamais été dit.
//
// ⚠ ET CE N'EST PAS LA SEULE VALEUR MANQUANTE DU PROJET — seulement la
// dernière de DEBITS, qui est maintenant COMPLÈTE (sept valeurs). Restent
// ouverts, ailleurs : coûts de réparation des bâtiments et des unités, plafonds
// de stockage d'électricité, taux d'accumulation et plafond de la réserve de
// temps de réparation, formule du dépassement de l'heure quand les défenses
// passent le niveau du Complexe. Voir l'onglet TROUS du classeur.

export const CHAMPS = {
  /** Cases de champ posées dans une base, toutes ressources confondues. */
  total: 12,

  /**
   * Les trois répartitions possibles des douze cases. Le tirage en choisit une.
   * La somme vaut `total` dans les trois cas, et un test l'asserte.
   */
  repartitions: [
    { quartz: 5, scorie: 7 },
    { quartz: 6, scorie: 6 },
    { quartz: 7, scorie: 5 },
  ],

  /** Tailles de bloc admises, en cases contiguës. */
  taillesBloc: [1, 2, 3],

  /**
   * Formes admises pour un bloc de trois : droit ou coudé. Un bloc de deux n'a
   * qu'une forme (le domino), un bloc d'un non plus — la contrainte ne porte
   * que sur les triplets.
   */
  formesTriplet: ['droit', 'coude'],

  /** Cases de marge laissées libres sur chaque bord de la bande. */
  margeBord: 1,

  /**
   * Ce qui peut se poser sur une case de champ. Liste fermée, et volontairement
   * une liste : si un jour un second bâtiment y a droit, il s'ajoute ici et
   * nulle part ailleurs.
   */
  posableDessus: ['collecteur'],

  /**
   * LE CHAMP DÉCIDE DE LA RESSOURCE — arbitré le 26/08 par Ethan.
   * Un collecteur ne choisit pas ce qu'il produit : il produit ce qu'il y a
   * sous lui. C'est ce qui donne leur poids aux cinq à sept cases de quartz
   * d'une base — elles fixent, à la case près, combien de quartz on peut en
   * tirer, et ce plafond-là ne se déplace qu'en déménageant.
   * `BASE_BATIMENTS.collecteur.ressource` vaut `quartzOuScorie` justement parce
   * que la réponse n'est pas dans la ligne du bâtiment : elle est sous lui.
   */
  ressourceDonneeParLeChamp: true,

  /**
   * Tentatives de placement avant abandon. Le tirage pose les blocs un par un
   * et peut se coincer : une tentative qui échoue est intégralement rejouée
   * avec un flux dérivé, jamais rafistolée — un rafistolage romprait le
   * déterminisme par position.
   *
   * ⚠ MESURÉ, et le résultat est plus franc qu'un facteur de marge : sur les
   * 9 000 positions de la carte (30 × 300), le tirage réussit **du premier
   * coup, partout**. Maximum 1, médiane 1, moyenne 1,0000. Ce garde-fou ne se
   * déclenche donc JAMAIS aux valeurs actuelles — et le dire est plus utile que
   * d'annoncer une marge qui n'a pas de sens.
   *
   * Là où il commence à mordre, mesuré en saturant la zone : 24 cases sur 42
   * demandent 2 tentatives au pire, 28 en demandent 4, 30 en demandent 9. Zéro
   * échec jusqu'à 30/42. Douze cases sont donc très loin du point de rupture,
   * et 64 couvre confortablement le jour où quelqu'un doublerait le compte.
   */
  tentativesMax: 64,

  /**
   * DÉDUIT, PAS DICTÉ — et c'est important de le savoir en le lisant.
   * Deux blocs de MÊME ressource ne se touchent jamais par un côté. Sans cette
   * règle, deux blocs de deux cases posés côte à côte formeraient un bloc de
   * quatre à l'œil, et « les champs viennent par un, deux ou trois » cesserait
   * d'être vrai à l'écran alors qu'il le resterait dans les données.
   * Le contact en DIAGONALE reste permis : il ne fusionne rien visuellement.
   * Deux blocs de ressources DIFFÉRENTES peuvent se toucher librement — un
   * quartz contre une scorie reste lisible.
   */
  contactLateralEntreBlocsDeMemeRessource: false,
};

/**
 * Bornes de la zone où les champs ont le droit de tomber : la bande des
 * bâtiments, moins la marge de bord. Calculée depuis GRILLE, jamais écrite en
 * dur — c'est tout l'intérêt de la faire passer par une fonction.
 * @returns {{ premiereRangee: number, derniereRangee: number,
 *   premiereColonne: number, derniereColonne: number, nombre: number }}
 */
export function zoneDesChamps() {
  const m = CHAMPS.margeBord;
  const premiereRangee = GEOMETRIE_BASE.premiereRangee + m;
  const derniereRangee = GEOMETRIE_BASE.derniereRangee - m;
  const premiereColonne = GEOMETRIE_BASE.premiereColonne + m;
  const derniereColonne = GEOMETRIE_BASE.derniereColonne - m;
  return {
    premiereRangee,
    derniereRangee,
    premiereColonne,
    derniereColonne,
    nombre:
      (derniereRangee - premiereRangee + 1) * (derniereColonne - premiereColonne + 1),
  };
}

/**
 * La case (rangee, colonne) est-elle dans la base du joueur ?
 * @param {number} rangee
 * @param {number} colonne
 * @returns {boolean}
 */
export function estDansLaBase(rangee, colonne) {
  return (
    rangee >= GEOMETRIE_BASE.premiereRangee
    && rangee <= GEOMETRIE_BASE.derniereRangee
    && colonne >= GEOMETRIE_BASE.premiereColonne
    && colonne <= GEOMETRIE_BASE.derniereColonne
  );
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
//
// ⚠ La ligne « courant » ci-dessous était le SEUL endroit du fichier à écrire
// « dépôt de véhicules » quand la clé du bâtiment disait `usine`. Elle avait
// raison — c'est la clé qui a été corrigée le 26/08, pas elle. Un test asserte
// maintenant que les quatre classes couvrent exactement les onze bâtiments,
// pour que la prochaine divergence tombe au lieu de dormir dans un commentaire.

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
// ⚠ LES COLIS SONT MORTS — reconfirmé par Ethan le 26/08 : « ils sont bien
// abandonnés, tous les bâtiments font de la production continue ». Il n'y a
// donc plus qu'un seul canal de production dans le jeu, et le pack/colis n'en
// est plus un. Deux conséquences à solder, aucune ici :
//   - `params.colis` de data/params.js et le bloc colis de tickEconomie /
//     rattrapageEconomie sont un RELIQUAT du lot 1. Ils tournent encore et
//     quatre tests les gardent : les retirer est un lot à part entière, pas un
//     effet de bord.
//   - BASE-DU-JOUEUR-1.md §3 affirme l'inverse (« le couple pack + flux continu
//     + voisinage est déjà implémenté »). Ce document est du 24/08 et de rang 4 :
//     il a un jour de retard sur l'arbitrage. Ne pas le suivre sur ce point.
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
 *
 * ⚠ POUR LA RAFFINERIE, C'EST UNE CAPACITÉ PAR RESSOURCE, PAS UN TOTAL.
 * Elle stocke le quartz ET la scorie, chacun jusqu'à ce plafond : une
 * raffinerie qui rend 2 880 tient 2 880 de quartz et 2 880 de scorie, soit
 * 5 760 unités en tout. Arbitré le 26/08. L'accumulateur n'a qu'une ressource,
 * donc la question ne se pose pas pour lui — et c'est justement pour ça que la
 * fonction ne peut pas rendre « le total » sans mentir sur l'un des deux.
 * `BASE_BATIMENTS[id].capaciteParRessource` dit lequel est concerné.
 *
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
// `sim/economy.js` rangeait un débit en milli-unités PAR TICK, arrondi une fois
// par couple (niveau, voisins). L'arrondi était cohérent — tick et rattrapage
// lisaient le même entier — mais il était gros : à 10 Hz, 240/h tombe sur
// 6,67 milli/tick, et arrondir coûte 5 % ; 48/h coûte 25 %.
//
// ✅ LE CORRECTIF EST EN PLACE (lot RÉSIDU). Plus aucun débit n'est arrondi par
// tick : `sim/economy.js` range un débit PAR HEURE, entier, et chaque bâtiment
// porte un résidu dans l'état de jeu (`residuFlux`, SAVE_VERSION 2).
//
//   residu += debitParHeure
//   gain    = Math.floor(residu / TICKS_PAR_HEURE)
//   residu  = residu % TICKS_PAR_HEURE
//
// L'erreur d'arrondi par tick est EXACTEMENT NULLE, à n'importe quelle
// fréquence — c'est ce qui rend le passage du hors-combat à 1 Hz sans effet sur
// l'économie.
//
// ⚠ RECTIFICATIF SUR LE DÉBORDEMENT. La rédaction précédente annonçait que le
// pire cas — dix ans hors ligne au débit du niveau 50 — restait « deux fois
// sous l'entier sûr ». C'EST FAUX, et de loin : le produit naïf
// `N × debitParHeure` y vaut 4,2 × 10¹⁸, soit 470 fois AU-DESSUS. Le rattrapage
// ne calcule donc pas ce produit. Il décompose N en heures pleines + reste
// (arithmétique modulaire) et borne les heures pleines à ce qu'il faut pour
// saturer le stockage — au-delà le stock vaut la capacité de toute façon.
// Les deux produits qui subsistent sont bornés, et le seuil au-delà duquel
// l'exactitude tomberait est calculé et exporté : `DEBIT_MILLI_PAR_HEURE_MAX`,
// soit 2,5 × 10¹¹ milli/h à 10 Hz. Le débit du niveau 50 ci-dessus — 1,345 × 10⁷
// unités/h, le plus lourd du jeu — reste dessous d'un facteur 19 SEULEMENT.
// La marge est réelle mais pas confortable : `rattrapageEconomie` lève si elle
// est franchie, plutôt que de dériver en silence.
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
