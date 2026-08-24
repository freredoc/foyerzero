// Moteur de résolution d'un combat de Foyer Zéro — lot 2A.
//
// Il reçoit un MONTAGE ENTIÈREMENT SPÉCIFIÉ (grille peuplée, obstacles posés,
// vagues composées) et le résout tick par tick jusqu'à une condition de fin,
// puis en tire le butin et les points de recherche. Il ne génère rien : la
// composition du site, la dispersion des obstacles et la disposition des
// défenses appartiennent au lot 2B.
//
// TROIS CONTRAINTES STRUCTURANTES
//
//   1. Arithmétique entière. Aucun flottant ne survit à un tick. Position,
//      portée et distance en MILLI-CASES ; PV et dégâts en MILLI-PV ; matrice
//      d'efficacité en MILLIÈMES. Les conversions depuis src/data/ se font une
//      seule fois, au chargement du module, et REFUSENT ce qui n'est pas entier.
//      La santé d'un tireur entre dans le calcul des dégâts en millièmes, sur
//      le même barème que la matrice (voir degatsDUnTir).
//      Le butin et les points de recherche, calculés hors de la boucle, sont
//      les seuls à voir des flottants — arrondis une seule fois, en bout de
//      chaîne.
//
//   2. Déterminisme. Le moteur ne tire rien au hasard : aucun générateur
//      pseudo-aléatoire, aucune lecture de l'horloge murale, et le PRNG du
//      lot 1 n'est ni importé ni utilisé. Le ciblage est déterministe par
//      construction (la cible valide la plus proche ; à égalité la plus à
//      gauche). Les itérations sur les entités se font TOUJOURS dans l'ordre
//      d'insertion. La garde du lot 1 (test/clock.test.js, test 4) interdit
//      jusqu'au NOM de ces appels dans src/sim/, commentaires compris.
//
//   3. Ordre du tick. L'ordre des neuf étapes de tick() est normatif : le
//      changer change les résultats.
//
// Les modules (lot 2C) sont hors périmètre, mais l'état porte déjà
// `modulesActifs` et `effetsTemporises` sur chaque entité, vides et inertes,
// pour que 2C n'impose pas de refonte.

import { GRILLE, UNITES, DEFENSES, MATRICE_COLONNES } from '../data/combat.js';
import {
  BATIMENTS, BUTIN, SAVEURS, POINTS_RECHERCHE, GEOGRAPHIE,
} from '../data/sites.js';
import {
  DERNIERE_RANGEE,
  enEntier,
  milliDepuisCase,
  caseDepuisMilli,
  distanceCarree,
  estDansLaGrille,
  estDansLaBande,
  bornesBande,
  estSortiParLeHaut,
  creerOccupation,
  poser,
  retirer,
  occupantDe,
  cleCase,
  indexerObstacles,
  typeObstacleSur,
  obstacleConcerne,
  vitesseSousObstacle,
  TYPES_OBSTACLE,
} from './grille.js';

// ---------------------------------------------------------------------------
// Constantes dérivées des données
// ---------------------------------------------------------------------------

/** Durée maximale d'un combat, en ticks (90 s à 10 Hz → 900). */
export const TICKS_MAX_COMBAT = enEntier(
  GRILLE.dureeMaxCombatSec / GRILLE.tickSec, 1, 'dureeMaxCombatSec / tickSec',
);

/** Intervalle entre deux vagues, en ticks (5 s à 10 Hz → 50). */
export const TICKS_PAR_VAGUE = enEntier(
  GRILLE.intervalleVagueSec / GRILLE.tickSec, 1, 'intervalleVagueSec / tickSec',
);

/** Nombre maximal de vagues d'un raid. */
export const VAGUES_MAX = GRILLE.vaguesParRaid;

/**
 * Rangée d'apparition par défaut d'une vague : le front de la bande de
 * déploiement. Une entrée de vague peut la surcharger (champ `rangee`), ce qui
 * permet de monter un état déjà entamé sans jouer les ticks d'approche.
 */
export const RANGEE_APPARITION = GRILLE.bandes.deploiement.derniere;

/**
 * Facteur commun des trois échelles internes : milli-case, milli-PV, millième.
 * Une seule constante, parce qu'il n'y a qu'une seule convention.
 */
const MILLE = 1000;

/** Facteur de matrice d'une cible de prédilection, en millièmes. */
const PREDILECTION_MILLI = MILLE;

/** Causes de fin, dans l'ordre de priorité du brief §9. */
export const CAUSES = ['souche', 'attaquants', 'batiments', 'duree'];

// ---------------------------------------------------------------------------
// Profils — conversion unique des données de calibrage en entiers
// ---------------------------------------------------------------------------
//
// La troisième colonne de la matrice change de sens selon le camp : structure
// en offense, aviation en défense. Les deux lectures ne se croisent jamais
// (aucun aéronef ne défend, aucun défenseur ne rencontre de structure amie),
// donc une seule table de correspondance suffit : elle dit, pour une CIBLE,
// quelle colonne de matrice le tireur doit lire.

const COLONNE_PAR_CHASSIS = {
  escouade: 'infanterie',
  blinde: 'vehicule',
  aeronef: 'structureOuAviation',
};

// Les trois artilleries sont des VÉHICULES, pas des structures — c'est ce qui
// explique la part de cibles véhicule d'une garnison de haut niveau.
const COLONNE_PAR_TYPE_DEFENSE = {
  mur: 'structureOuAviation',
  barriere: 'structureOuAviation',
  tourelle: 'structureOuAviation',
  artillerie: 'vehicule',
};

/** Convertit une matrice de calibrage en millièmes entiers, multiples de 100. */
function matriceEnMillieme(matrice, contexte) {
  if (matrice === null || matrice === undefined) return null;
  const sortie = {};
  for (const colonne of MATRICE_COLONNES) {
    if (matrice[colonne] === undefined) {
      throw new Error(`combat : ${contexte} — colonne de matrice « ${colonne} » absente`);
    }
    const milli = enEntier(matrice[colonne], MILLE, `${contexte}.${colonne}`);
    if (milli % 100 !== 0) {
      throw new Error(
        `combat : ${contexte}.${colonne} = ${milli} millièmes n'est pas un multiple de 100`,
      );
    }
    sortie[colonne] = milli;
  }
  return sortie;
}

/** Vérifie qu'une valeur de données est un entier positif ou nul. */
function entierDeDonnees(valeur, contexte) {
  if (!Number.isInteger(valeur) || valeur < 0) {
    throw new Error(`combat : ${contexte} = ${valeur} n'est pas un entier ≥ 0`);
  }
  return valeur;
}

function profilUnite(id, u) {
  const contexte = `UNITES.${id}`;
  const vitesseMilli = enEntier(u.vitesse, 100, `${contexte}.vitesse`);
  const porteeMilli = enEntier(u.portee, MILLE, `${contexte}.portee`);
  const porteeMiniMilli = enEntier(u.porteeMini, MILLE, `${contexte}.porteeMini`);
  return {
    genre: 'unite',
    id,
    chassis: u.chassis,
    colonneMatrice: COLONNE_PAR_CHASSIS[u.chassis],
    pvMaxMilli: enEntier(u.pv, MILLE, `${contexte}.pv`),
    degats: entierDeDonnees(u.degats, `${contexte}.degats`),
    porteeCarree: porteeMilli * porteeMilli,
    porteeMiniCarree: porteeMiniMilli * porteeMiniMilli,
    matriceMilli: matriceEnMillieme(u.matrice, `${contexte}.matrice`),
    masse: entierDeDonnees(u.masse, `${contexte}.masse`),
    bloquant: u.masse > 0,
    ecrasable: true,
    franchissement: 0,
    vitesseMilli,
    vitesseObstacleMilli: vitesseSousObstacle(vitesseMilli),
    comportementAerien: u.comportementAerien,
    reserveMax: entierDeDonnees(u.reserve, `${contexte}.reserve`),
    // Plancher de réserve : 10 % de la réserve NOMINALE, jamais de la réserve
    // courante — une unité montée déjà entamée garde le même plancher.
    plancherReserve: Math.floor((u.reserve * GRILLE.plancherReservePct) / 100),
    moduleDefense: u.defense.module,
    presentEnDefense: u.defense.present === true,
  };
}

function profilDefense(id, d) {
  const contexte = `DEFENSES.${id}`;
  const porteeMilli = enEntier(d.portee, MILLE, `${contexte}.portee`);
  const porteeMiniMilli = enEntier(d.porteeMini, MILLE, `${contexte}.porteeMini`);
  if (!COLONNE_PAR_TYPE_DEFENSE[d.type]) {
    throw new Error(`combat : ${contexte} — type de défense inconnu « ${d.type} »`);
  }
  return {
    genre: 'defense',
    id,
    type: d.type,
    chassis: null,
    colonneMatrice: COLONNE_PAR_TYPE_DEFENSE[d.type],
    pvMaxMilli: enEntier(d.pv, MILLE, `${contexte}.pv`),
    degats: entierDeDonnees(d.degats, `${contexte}.degats`),
    porteeCarree: porteeMilli * porteeMilli,
    porteeMiniCarree: porteeMiniMilli * porteeMiniMilli,
    matriceMilli: matriceEnMillieme(d.matrice, `${contexte}.matrice`),
    masse: null,
    bloquant: d.bloque === true,
    ecrasable: false,
    franchissement: entierDeDonnees(
      d.degatsFranchissement, `${contexte}.degatsFranchissement`,
    ),
    vitesseMilli: 0,
    vitesseObstacleMilli: 0,
    comportementAerien: null,
    reserveMax: 0,
    plancherReserve: 0,
    // Le site appartient à l'Ouvrage : c'est son module qui compte pour les
    // points de recherche.
    moduleDefense: d.moduleOuvrage,
    presentEnDefense: true,
  };
}

function profilBatiment(id, b) {
  const contexte = `BATIMENTS.${id}`;
  return {
    genre: 'batiment',
    id,
    chassis: null,
    colonneMatrice: 'structureOuAviation',
    pvMaxMilli: enEntier(b.pv, MILLE, `${contexte}.pv`),
    degats: 0,
    porteeCarree: 0,
    porteeMiniCarree: 0,
    matriceMilli: null,
    masse: null,
    bloquant: true,
    ecrasable: false,
    franchissement: 0,
    vitesseMilli: 0,
    vitesseObstacleMilli: 0,
    comportementAerien: null,
    reserveMax: 0,
    plancherReserve: 0,
    moduleDefense: null,
    presentEnDefense: false,
    indiceButin: b.indiceButin,
    ressource: b.ressource,
    raseLeSite: b.raseLeSite === true,
  };
}

const PROFILS_UNITE = {};
const PROFILS_DEFENSE = {};
const PROFILS_BATIMENT = {};

/**
 * Construit les profils et assied les invariants arithmétiques du brief §4 :
 * vitesses entières en milli-cases par tick, vitesses ralenties par obstacle
 * entières elles aussi, matrices en millièmes multiples de 100, et
 * 2^(niveauPlafond − 1) sous Number.MAX_SAFE_INTEGER.
 * Exécutée une fois au chargement du module ; réexécutable en test.
 */
export function verifierArithmetique() {
  for (const [id, u] of Object.entries(UNITES)) PROFILS_UNITE[id] = profilUnite(id, u);
  for (const [id, d] of Object.entries(DEFENSES)) PROFILS_DEFENSE[id] = profilDefense(id, d);
  for (const [id, b] of Object.entries(BATIMENTS)) PROFILS_BATIMENT[id] = profilBatiment(id, b);

  // Les points de recherche doublent par niveau de cible : 2^(50−1) doit
  // rester exactement représentable. L'asserter plutôt que le supposer.
  const plafond = POINTS_RECHERCHE.multiplicateurParNiveau ** (GEOGRAPHIE.niveauPlafond - 1);
  if (!Number.isSafeInteger(plafond)) {
    throw new Error(
      `combat : ${POINTS_RECHERCHE.multiplicateurParNiveau}^(${GEOGRAPHIE.niveauPlafond}−1) `
      + `= ${plafond} n'est pas un entier sûr`,
    );
  }
  return true;
}

verifierArithmetique();

const TABLES_PROFIL = {
  unite: PROFILS_UNITE,
  defense: PROFILS_DEFENSE,
  batiment: PROFILS_BATIMENT,
};

/** Profil de calibrage d'une entité de l'état. */
function profil(entite) {
  return TABLES_PROFIL[entite.genre][entite.id];
}

/** Une entité qui n'a ni dégâts, ni portée, ni matrice ne tire jamais. */
function peutTirer(p) {
  return p.degats > 0 && p.porteeCarree > 0 && p.matriceMilli !== null;
}

/** Une entité vivante et encore sur la grille. */
function estActive(e) {
  return e.vivant && !e.sorti;
}

// ---------------------------------------------------------------------------
// Montage : validation et création de l'état
// ---------------------------------------------------------------------------

/** Genre et profil d'un identifiant de défenseur (structure OU unité mobile). */
function genreDeDefenseur(id) {
  if (Object.prototype.hasOwnProperty.call(PROFILS_DEFENSE, id)) return 'defense';
  if (Object.prototype.hasOwnProperty.call(PROFILS_UNITE, id)) return 'unite';
  return null;
}

function verifierEntierPositif(valeur, contexte) {
  if (!Number.isInteger(valeur) || valeur < 0) {
    throw new Error(`combat : ${contexte} = ${valeur} doit être un entier ≥ 0`);
  }
}

/**
 * Place une entité dans l'état, en validant case, obstacle et voisinage.
 * `casesPrises` porte la validation du MONTAGE (deux entités sur la même
 * case) ; elle vaut null à l'apparition d'une vague, où c'est l'occupation
 * courante qui tranche — l'aviation, elle, partage librement une case.
 */
function ajouterEntite(etat, contexte, { camp, genre, id, rangee, colonne, pvMilli, reserve },
  casesPrises, obstaclesIndex) {
  const p = TABLES_PROFIL[genre][id];
  const ou = `${contexte} « ${id} » en (${rangee}, ${colonne})`;

  if (!estDansLaGrille(rangee, colonne)) {
    throw new Error(
      `combat : ${ou} est hors de la grille `
      + `(rangées 1–${DERNIERE_RANGEE}, colonnes 1–${GRILLE.largeur})`,
    );
  }
  if (typeObstacleSur(obstaclesIndex, rangee, colonne) !== undefined) {
    throw new Error(`combat : ${ou} est posée sur un obstacle`);
  }
  if (casesPrises !== null) {
    const cle = cleCase(rangee, colonne);
    if (casesPrises.has(cle)) {
      throw new Error(`combat : ${ou} occupe la même case que « ${casesPrises.get(cle)} »`);
    }
    casesPrises.set(cle, id);
  }

  let pv = p.pvMaxMilli;
  if (pvMilli !== undefined) {
    verifierEntierPositif(pvMilli, `${ou} — pvMilli`);
    if (pvMilli === 0 || pvMilli > p.pvMaxMilli) {
      throw new Error(`combat : ${ou} — pvMilli ${pvMilli} hors de 1…${p.pvMaxMilli}`);
    }
    pv = pvMilli;
  }
  let res = camp === 'attaque' ? p.reserveMax : 0;
  if (reserve !== undefined) {
    verifierEntierPositif(reserve, `${ou} — reserve`);
    if (reserve > p.reserveMax) {
      throw new Error(`combat : ${ou} — reserve ${reserve} dépasse la réserve nominale ${p.reserveMax}`);
    }
    res = reserve;
  }

  const entite = {
    indice: etat.entites.length,
    camp,
    genre,
    id,
    colonne,
    rangeeMilli: milliDepuisCase(rangee),
    pvMilli: pv,
    pvMaxMilli: p.pvMaxMilli,
    reserve: res,
    plancherReserve: camp === 'attaque' ? p.plancherReserve : 0,
    vivant: true,
    sorti: false,
    ecrase: false,
    cibleIndice: null,
    aTire: false,
    // Lot 2C : ces deux champs restent vides et inertes en 2A.
    modulesActifs: [],
    effetsTemporises: [],
  };
  etat.entites.push(entite);
  return entite;
}

/**
 * Crée l'état initial d'un combat à partir d'un montage entièrement spécifié.
 * Valide et REFUSE : identifiant inconnu, case hors grille, deux entités sur la
 * même case, bâtiment hors de la bande 11–18, défenseur hors de 3–10, entité
 * posée sur un obstacle, plus de 4 vagues. Un montage invalide lève, il ne se
 * répare pas tout seul.
 * @param {object} montage
 * @returns {object} état initial, vague 1 déjà déployée (tick 0).
 */
export function creerCombat(montage) {
  if (!montage || typeof montage !== 'object') {
    throw new Error('combat : montage absent');
  }
  const { niveau } = montage;
  if (!Number.isInteger(niveau) || niveau < 1 || niveau > GEOGRAPHIE.niveauPlafond) {
    throw new Error(
      `combat : niveau ${niveau} hors de 1…${GEOGRAPHIE.niveauPlafond}`,
    );
  }
  const saveur = montage.saveur ?? null;
  if (saveur !== null && !Object.prototype.hasOwnProperty.call(SAVEURS, saveur)) {
    throw new Error(`combat : saveur inconnue « ${saveur} »`);
  }

  const obstaclesMontage = montage.obstacles ?? [];
  const obstacles = [];
  const clesObstacles = new Set();
  for (const o of obstaclesMontage) {
    const ou = `obstacle « ${o.type} » en (${o.rangee}, ${o.colonne})`;
    if (!estDansLaGrille(o.rangee, o.colonne)) {
      throw new Error(`combat : ${ou} est hors de la grille`);
    }
    if (!TYPES_OBSTACLE.includes(o.type)) {
      throw new Error(`combat : ${ou} — type d'obstacle inconnu`);
    }
    const cle = cleCase(o.rangee, o.colonne);
    if (clesObstacles.has(cle)) throw new Error(`combat : ${ou} — deux obstacles sur la même case`);
    clesObstacles.add(cle);
    obstacles.push({ rangee: o.rangee, colonne: o.colonne, type: o.type });
  }
  const obstaclesIndex = indexerObstacles(obstacles);

  const vaguesMontage = montage.vagues ?? [];
  if (vaguesMontage.length > VAGUES_MAX) {
    throw new Error(
      `combat : ${vaguesMontage.length} vagues déclarées, ${VAGUES_MAX} au plus`,
    );
  }

  const etat = {
    tick: 0,
    termine: false,
    cause: null,
    niveau,
    saveur,
    maxTicks: TICKS_MAX_COMBAT,
    obstacles,
    entites: [],
    vagues: [],
    enAttente: [],
    modulesDebloques: {
      ouvrage: [...(montage.modulesDebloques?.ouvrage ?? [])],
      joueur: [...(montage.modulesDebloques?.joueur ?? [])],
    },
  };

  // Ordre d'insertion, stable et consigné ici : défenseurs, bâtiments, puis
  // les unités de chaque vague dans l'ordre où elles apparaissent.
  const casesPrises = new Map();

  const bandeDefense = bornesBande('defense');
  for (const d of montage.defenseurs ?? []) {
    const genre = genreDeDefenseur(d.id);
    if (genre === null) {
      throw new Error(`combat : défenseur « ${d.id} » — identifiant inconnu`);
    }
    if (genre === 'unite' && !PROFILS_UNITE[d.id].presentEnDefense) {
      throw new Error(`combat : défenseur « ${d.id} » n'a pas de rôle en défense`);
    }
    if (!estDansLaGrille(d.rangee, d.colonne)) {
      throw new Error(
        `combat : défenseur « ${d.id} » en (${d.rangee}, ${d.colonne}) est hors de la grille `
        + `(rangées 1–${DERNIERE_RANGEE}, colonnes 1–${GRILLE.largeur})`,
      );
    }
    if (!estDansLaBande(d.rangee, 'defense')) {
      throw new Error(
        `combat : défenseur « ${d.id} » en (${d.rangee}, ${d.colonne}) hors de la bande `
        + `de défense (${bandeDefense.premiere}–${bandeDefense.derniere})`,
      );
    }
    ajouterEntite(etat, 'défenseur', { ...d, camp: 'defense', genre }, casesPrises, obstaclesIndex);
  }

  const bandeBatiments = bornesBande('batiments');
  for (const b of montage.batiments ?? []) {
    if (!Object.prototype.hasOwnProperty.call(PROFILS_BATIMENT, b.id)) {
      throw new Error(`combat : bâtiment « ${b.id} » — identifiant inconnu`);
    }
    if (!estDansLaGrille(b.rangee, b.colonne)) {
      throw new Error(
        `combat : bâtiment « ${b.id} » en (${b.rangee}, ${b.colonne}) est hors de la grille `
        + `(rangées 1–${DERNIERE_RANGEE}, colonnes 1–${GRILLE.largeur})`,
      );
    }
    if (!estDansLaBande(b.rangee, 'batiments')) {
      throw new Error(
        `combat : bâtiment « ${b.id} » en (${b.rangee}, ${b.colonne}) hors de la bande `
        + `des bâtiments (${bandeBatiments.premiere}–${bandeBatiments.derniere})`,
      );
    }
    ajouterEntite(etat, 'bâtiment', { ...b, camp: 'defense', genre: 'batiment' },
      casesPrises, obstaclesIndex);
  }

  // Les vagues sont validées ici — grille, obstacles, entités statiques,
  // doublons internes — mais seule la première est posée maintenant. Les
  // suivantes ne sont pas confrontées entre elles : leurs unités se seront
  // déplacées d'ici leur apparition.
  for (let v = 0; v < vaguesMontage.length; v++) {
    const cases = new Map(casesPrises);
    const descripteurs = [];
    for (const u of vaguesMontage[v]) {
      if (!Object.prototype.hasOwnProperty.call(PROFILS_UNITE, u.id)) {
        throw new Error(`combat : attaquant « ${u.id} » de la vague ${v + 1} — identifiant inconnu`);
      }
      const rangee = u.rangee ?? RANGEE_APPARITION;
      const ou = `attaquant « ${u.id} » de la vague ${v + 1} en (${rangee}, ${u.colonne})`;
      if (!estDansLaGrille(rangee, u.colonne)) {
        throw new Error(`combat : ${ou} est hors de la grille`);
      }
      if (typeObstacleSur(obstaclesIndex, rangee, u.colonne) !== undefined) {
        throw new Error(`combat : ${ou} est posée sur un obstacle`);
      }
      const cle = cleCase(rangee, u.colonne);
      if (cases.has(cle)) {
        throw new Error(`combat : ${ou} occupe la même case que « ${cases.get(cle)} »`);
      }
      cases.set(cle, u.id);
      descripteurs.push({
        id: u.id,
        colonne: u.colonne,
        rangee,
        pvMilli: u.pvMilli,
        reserve: u.reserve,
      });
    }
    etat.vagues.push(descripteurs);
  }

  // Tick 0 : la première vague apparaît. Les suivantes suivront aux ticks
  // multiples de TICKS_PAR_VAGUE.
  apparitionDeVague(etat, casesPrises);
  return etat;
}

// ---------------------------------------------------------------------------
// Occupation dérivée
// ---------------------------------------------------------------------------

/**
 * Reconstruit la carte d'occupation à partir des entités vivantes. L'aviation
 * (masse 0) et les barrières (bloque: false) n'y figurent pas : elles ne sont
 * ni bloquées ni bloquantes.
 */
function construireOccupation(etat) {
  const occupation = creerOccupation();
  for (const e of etat.entites) {
    if (!estActive(e)) continue;
    if (!profil(e).bloquant) continue;
    poser(occupation, caseDepuisMilli(e.rangeeMilli), e.colonne, e.indice);
  }
  return occupation;
}

/**
 * Index des obstacles, reconstruit à la demande. Il est DÉRIVÉ : le stocker
 * dans l'état y mettrait une Map non sérialisable, et un index désynchronisé
 * serait une source de divergence. Dix cases au plus, le coût est nul.
 */
function obtenirIndexObstacles(etat) {
  return indexerObstacles(etat.obstacles);
}

// ---------------------------------------------------------------------------
// Les neuf étapes d'un tick — ordre NORMATIF (brief §6)
// ---------------------------------------------------------------------------

/** 1. Expiration des effets temporisés. Inerte en 2A ; l'étape existe. */
function expirerEffets(etat) {
  for (const e of etat.entites) {
    if (e.effetsTemporises.length === 0) continue;
    e.effetsTemporises = e.effetsTemporises.filter((effet) => effet.finTick > etat.tick);
  }
}

/**
 * 2. Apparition de vague, aux ticks multiples de TICKS_PAR_VAGUE.
 * Une unité dont la case d'apparition est occupée reste en attente et retente
 * au tick suivant : l'invariant « deux entités bloquantes ne partagent pas une
 * case » ne cède jamais.
 */
function apparitionDeVague(etat, casesPrises = null) {
  if (etat.tick % TICKS_PAR_VAGUE === 0 && etat.vagues.length > 0) {
    etat.enAttente.push(...etat.vagues.shift());
  }
  if (etat.enAttente.length === 0) return;

  const occupation = construireOccupation(etat);
  const restants = [];
  for (const d of etat.enAttente) {
    const p = PROFILS_UNITE[d.id];
    const libre = !p.bloquant || occupantDe(occupation, d.rangee, d.colonne) === undefined;
    if (!libre) {
      restants.push(d);
      continue;
    }
    const entite = ajouterEntite(
      etat,
      'attaquant',
      { ...d, camp: 'attaque', genre: 'unite' },
      casesPrises ?? null,
      obtenirIndexObstacles(etat),
    );
    if (p.bloquant) poser(occupation, d.rangee, d.colonne, entite.indice);
  }
  etat.enAttente = restants;
}

/**
 * 3. Ciblage : la cible valide la plus proche ; à égalité, la plus à gauche.
 * L'ordre total est complété par la rangée puis l'indice d'insertion — deux
 * cibles peuvent partager distance et colonne (au-dessus et au-dessous du
 * tireur), le brief n'ayant retenu que les deux premiers critères.
 * Une entité sans cible à portée garde sa cible précédente si elle est encore
 * valide, sinon n'en a pas.
 */
function ciblage(etat) {
  for (const e of etat.entites) {
    if (!estActive(e)) continue;
    const p = profil(e);
    if (!peutTirer(p)) {
      e.cibleIndice = null;
      continue;
    }
    let meilleur = null;
    let meilleureDistance = 0;
    let meilleureColonne = 0;
    let meilleureRangee = 0;
    for (const c of etat.entites) {
      if (c.camp === e.camp || !estActive(c)) continue;
      const d2 = distanceCarree(e.rangeeMilli, e.colonne, c.rangeeMilli, c.colonne);
      if (d2 > p.porteeCarree || d2 < p.porteeMiniCarree) continue;
      if (
        meilleur === null
        || d2 < meilleureDistance
        || (d2 === meilleureDistance && c.colonne < meilleureColonne)
        || (d2 === meilleureDistance && c.colonne === meilleureColonne
            && c.rangeeMilli < meilleureRangee)
      ) {
        meilleur = c.indice;
        meilleureDistance = d2;
        meilleureColonne = c.colonne;
        meilleureRangee = c.rangeeMilli;
      }
    }
    if (meilleur !== null) {
      e.cibleIndice = meilleur;
    } else if (e.cibleIndice !== null && !estActive(etat.entites[e.cibleIndice])) {
      e.cibleIndice = null;
    }
  }
}

/**
 * Dégâts d'un tir, formule unique.
 *
 *   ratioMilli  = floor(pvCourantMilli × 1000 / pvMaxMilli)   // 0 à 1000
 *   degatsMilli = floor(degats × facteurMatrice × ratioMilli / 1000)
 *
 * La santé du tireur passe d'abord en MILLIÈMES, la même échelle que la
 * matrice : les trois grandeurs du produit vivent alors sur le même barème,
 * et les dégâts ne dépendent plus de la magnitude des PV maximaux, seulement
 * du pourcentage de vie restant.
 *
 * Arbitrage d'Ethan reçu en cours d'exécution du lot 2A : il remplace le
 * « un seul Math.floor, jamais d'arrondi intermédiaire » du brief §4. Aucun
 * des seuils chiffrés du §12 ne bouge — ils portent tous sur des ratios ronds
 * (100 %, 50 %, 10 %), où les deux écritures coïncident exactement.
 */
function degatsDUnTir(degats, facteurMatrice, pvCourantMilli, pvMaxMilli) {
  const ratioMilli = Math.floor((pvCourantMilli * MILLE) / pvMaxMilli);
  return Math.floor((degats * facteurMatrice * ratioMilli) / MILLE);
}

/**
 * 4. Tir. Les dégâts sont calculés sur l'état de DÉBUT de tick et accumulés
 * dans un tampon : le tir est simultané, l'ordre d'itération ne peut pas
 * influer. Le franchissement des barrières est compté ici, du même tampon.
 * @returns {Map<number, number>} indice d'entité → dégâts milli-PV cumulés.
 */
function tir(etat) {
  const tampon = new Map();
  const ajouter = (indice, degats) => {
    tampon.set(indice, (tampon.get(indice) ?? 0) + degats);
  };

  for (const e of etat.entites) {
    e.aTire = false;
    if (!estActive(e) || e.cibleIndice === null) continue;
    const cible = etat.entites[e.cibleIndice];
    if (!estActive(cible)) continue;
    const p = profil(e);
    const pc = profil(cible);
    const d2 = distanceCarree(e.rangeeMilli, e.colonne, cible.rangeeMilli, cible.colonne);
    if (d2 > p.porteeCarree || d2 < p.porteeMiniCarree) continue;
    // Réserve : le plancher porte sur la NATURE DE LA CIBLE, jamais sur la
    // position du tireur (brief §8). Sur un bâtiment, la réserve descend
    // jusqu'à 0 et l'unité vidée ne tire plus du tout ; sur une entité de la
    // défense, elle s'arrête au plancher et l'unité continue de tirer.
    if (e.camp === 'attaque' && pc.genre === 'batiment' && e.reserve <= 0) continue;
    ajouter(
      e.cibleIndice,
      degatsDUnTir(p.degats, p.matriceMilli[pc.colonneMatrice], e.pvMilli, p.pvMaxMilli),
    );
    e.aTire = true;
  }

  // Franchissement : une barrière ne bloque pas, elle saigne. Dégâts par tick
  // de présence, pondérés par la matrice de la barrière contre le châssis qui
  // la franchit — la matrice met déjà l'aviation à zéro.
  const barrieres = new Map();
  for (const b of etat.entites) {
    if (!estActive(b) || b.genre !== 'defense') continue;
    const pb = profil(b);
    if (pb.bloquant || pb.franchissement === 0) continue;
    barrieres.set(cleCase(caseDepuisMilli(b.rangeeMilli), b.colonne), b);
  }
  if (barrieres.size > 0) {
    for (const e of etat.entites) {
      if (!estActive(e) || e.camp !== 'attaque') continue;
      const b = barrieres.get(cleCase(caseDepuisMilli(e.rangeeMilli), e.colonne));
      if (b === undefined) continue;
      const pb = profil(b);
      ajouter(
        e.indice,
        degatsDUnTir(
          pb.franchissement,
          pb.matriceMilli[profil(e).colonneMatrice],
          b.pvMilli,
          pb.pvMaxMilli,
        ),
      );
    }
  }
  return tampon;
}

/**
 * 5. Application du tampon. Le seul plancher de PV est 0 : toute entité,
 * défense comprise, se détruit à 0 et sort de la grille. Le plancher de 1 %
 * de la spec §2 est un plancher d'APRÈS-RAID, écrit par le lot 2B ; le moteur
 * rapporte les PV bruts et ne plafonne rien.
 */
function appliquerDegats(etat, tampon) {
  for (const [indice, degats] of tampon) {
    const e = etat.entites[indice];
    if (!estActive(e)) continue;
    e.pvMilli = Math.max(0, e.pvMilli - degats);
  }
}

/** 6. Retrait des entités mortes. */
function retirerLesMorts(etat) {
  for (const e of etat.entites) {
    if (e.vivant && e.pvMilli === 0) e.vivant = false;
  }
}

/**
 * L'entité s'arrête-t-elle ? Une unité s'arrête pour sa CIBLE DE PRÉDILECTION
 * — celle dont la colonne de matrice vaut 1,0 pour elle. Les autres cibles
 * sont engagées sans s'arrêter : elle tire en marchant. L'aviation traversante
 * ne s'arrête jamais.
 */
function doitSArreter(etat, e, p) {
  if (p.comportementAerien === 'traversant') return false;
  if (!e.aTire || e.cibleIndice === null) return false;
  const pc = profil(etat.entites[e.cibleIndice]);
  return p.matriceMilli[pc.colonneMatrice] === PREDILECTION_MILLI;
}

/**
 * 7. Déplacement. Strictement vertical, des rangées basses vers les hautes :
 * aucun pathfinding, aucune sortie de colonne. C'est ce que le terrain est
 * censé compenser. Itération dans l'ordre d'insertion, stable et consigné.
 *
 * Écrasement, une seule règle : masse mobile strictement supérieure → la
 * bloquante meurt et la mobile continue ; masse égale ou inférieure → blocage.
 * L'écrasement est indépendant de la prédilection.
 */
function deplacement(etat) {
  const occupation = construireOccupation(etat);
  const obstacles = obtenirIndexObstacles(etat);

  for (const e of etat.entites) {
    if (!estActive(e) || e.camp !== 'attaque') continue;
    const p = profil(e);
    if (p.vitesseMilli === 0) continue;
    if (doitSArreter(etat, e, p)) continue;

    const rangee = caseDepuisMilli(e.rangeeMilli);
    let vitesse = p.vitesseMilli;
    const type = typeObstacleSur(obstacles, rangee, e.colonne);
    if (type !== undefined && obstacleConcerne(type, p.chassis)) {
      vitesse = p.vitesseObstacleMilli;
    }

    const destinationMilli = e.rangeeMilli + vitesse;
    const caseDestination = caseDepuisMilli(destinationMilli);

    if (caseDestination === rangee) {
      e.rangeeMilli = destinationMilli;
      continue;
    }
    if (caseDestination > DERNIERE_RANGEE) {
      // Seule l'aviation traversante franchit le fond : elle sort du combat et
      // n'y revient pas. Le sol et l'aviation stoppeuse s'arrêtent au fond.
      if (p.comportementAerien === 'traversant') {
        e.rangeeMilli = destinationMilli;
        e.sorti = estSortiParLeHaut(destinationMilli);
      }
      continue;
    }
    if (!p.bloquant) {
      // Aviation : ni bloquée ni bloquante, elle ignore l'occupation.
      e.rangeeMilli = destinationMilli;
      continue;
    }

    const indiceOccupante = occupantDe(occupation, caseDestination, e.colonne);
    if (indiceOccupante === undefined) {
      retirer(occupation, rangee, e.colonne);
      poser(occupation, caseDestination, e.colonne, e.indice);
      e.rangeeMilli = destinationMilli;
      continue;
    }
    const occupante = etat.entites[indiceOccupante];
    const po = profil(occupante);
    if (po.ecrasable && p.masse > po.masse) {
      occupante.pvMilli = 0;
      occupante.vivant = false;
      occupante.ecrase = true;
      retirer(occupation, caseDestination, e.colonne);
      retirer(occupation, rangee, e.colonne);
      poser(occupation, caseDestination, e.colonne, e.indice);
      e.rangeeMilli = destinationMilli;
    }
    // Masse égale ou inférieure : blocage, aucune avance.
  }
}

/**
 * 8. Consommation de réserve : un tir consommé par tir effectué. Seuls les
 * attaquants ont une réserve ; la défense tire sans compter.
 */
function consommerReserve(etat) {
  for (const e of etat.entites) {
    if (!e.aTire || e.camp !== 'attaque') continue;
    const pc = profil(etat.entites[e.cibleIndice]);
    if (pc.genre === 'batiment') {
      if (e.reserve > 0) e.reserve -= 1;
    } else if (e.reserve > e.plancherReserve) {
      e.reserve -= 1;
    }
  }
}

/** 9. Conditions de fin, au premier des quatre événements du brief §9. */
function conditionsDeFin(etat) {
  let souche = false;
  let batimentDebout = false;
  let attaquantPresent = false;
  for (const e of etat.entites) {
    if (e.genre === 'batiment') {
      if (profil(e).raseLeSite && !e.vivant) souche = true;
      if (e.vivant) batimentDebout = true;
    } else if (e.camp === 'attaque' && estActive(e)) {
      attaquantPresent = true;
    }
  }
  if (souche) return terminer(etat, 'souche');
  // Un raid ne s'achève pas parce que la première vague est tombée : les
  // vagues encore à venir font partie de l'assaut.
  if (!attaquantPresent && etat.vagues.length === 0 && etat.enAttente.length === 0) {
    return terminer(etat, 'attaquants');
  }
  if (!batimentDebout) return terminer(etat, 'batiments');
  if (etat.tick >= etat.maxTicks) return terminer(etat, 'duree');
  return false;
}

function terminer(etat, cause) {
  etat.termine = true;
  etat.cause = cause;
  return true;
}

/**
 * Avance d'un tick (0,1 s), en mutant l'état.
 * L'ordre des neuf étapes est NORMATIF : le changer change les résultats.
 * @param {object} etat
 * @returns {object} le même état.
 */
export function tick(etat) {
  if (etat.termine) return etat;
  etat.tick += 1;
  expirerEffets(etat); //                        1. expiration des effets
  apparitionDeVague(etat); //                    2. apparition de vague
  ciblage(etat); //                              3. ciblage
  const tampon = tir(etat); //                   4. tir, simultané
  appliquerDegats(etat, tampon); //              5. application du tampon
  retirerLesMorts(etat); //                      6. retrait des morts
  deplacement(etat); //                          7. déplacement
  consommerReserve(etat); //                     8. consommation de réserve
  conditionsDeFin(etat); //                      9. conditions de fin
  return etat;
}

// ---------------------------------------------------------------------------
// Résolution et résultat
// ---------------------------------------------------------------------------

function ligneResultat(e) {
  return {
    indice: e.indice,
    id: e.id,
    genre: e.genre,
    rangee: caseDepuisMilli(e.rangeeMilli),
    colonne: e.colonne,
    pvMaxMilli: e.pvMaxMilli,
    pvMilli: e.pvMilli,
    pvPerdusMilli: e.pvMaxMilli - e.pvMilli,
    detruit: !e.vivant,
    module: profil(e).moduleDefense ?? null,
  };
}

/** Construit le résultat d'un combat terminé (ou arrêté) à partir de l'état. */
export function construireResultat(etat) {
  const resultat = {
    cause: etat.cause,
    tick: etat.tick,
    batiments: [],
    defenses: [],
    attaquants: [],
  };
  for (const e of etat.entites) {
    if (e.genre === 'batiment') resultat.batiments.push(ligneResultat(e));
    else if (e.camp === 'defense') resultat.defenses.push(ligneResultat(e));
    else {
      resultat.attaquants.push({
        ...ligneResultat(e),
        reserve: e.reserve,
        sorti: e.sorti,
        ecrase: e.ecrase,
      });
    }
  }
  return resultat;
}

/**
 * Boucle jusqu'à la fin et rend le résultat.
 * @param {object} etat
 * @param {{ maxTicks?: number }} [options]
 */
export function resoudre(etat, options = {}) {
  const maxTicks = options.maxTicks ?? TICKS_MAX_COMBAT;
  if (!Number.isInteger(maxTicks) || maxTicks < 0) {
    throw new Error(`combat : maxTicks ${maxTicks} doit être un entier ≥ 0`);
  }
  etat.maxTicks = maxTicks;
  if (!etat.termine && etat.tick >= maxTicks) terminer(etat, 'duree');
  while (!etat.termine) tick(etat);
  return construireResultat(etat);
}

// ---------------------------------------------------------------------------
// Butin et points de recherche — calculés APRÈS la boucle
// ---------------------------------------------------------------------------
//
// C'est ici, et seulement ici, que des flottants apparaissent : les pentes de
// BUTIN sont des réels. L'arrondi est unique et en bout de chaîne, et chaque
// produit est fait AVANT sa division pour que les cas exacts le restent.

/**
 * Butin plein d'un bâtiment, avant proportionnalité aux dégâts.
 * butinPlein = ancrage × indice × penteBasse^(min(n,12)−1) × penteHaute^max(n−12,0)
 */
export function butinPlein(niveau, indice) {
  const bas = Math.min(niveau, BUTIN.niveauBascule) - 1;
  const haut = Math.max(niveau - BUTIN.niveauBascule, 0);
  return BUTIN.ancrageNiveau1 * indice * BUTIN.penteBasse ** bas * BUTIN.penteHaute ** haut;
}

/**
 * Butin d'un raid, proportionnel aux dégâts subis par chaque bâtiment — sauf
 * si la Souche est tombée : sa destruction rase le site et livre tout, quel
 * que soit l'état des autres bâtiments.
 * @returns {{ quartz: number, scorie: number }} entiers.
 */
export function butin(resultat, montage) {
  const rase = resultat.cause === 'souche';
  let quartz = 0;
  let scorie = 0;
  for (const b of resultat.batiments) {
    const p = PROFILS_BATIMENT[b.id];
    const plein = butinPlein(montage.niveau, p.indiceButin);
    const gagne = rase ? plein : (plein * b.pvPerdusMilli) / b.pvMaxMilli;
    quartz += gagne * p.ressource.quartz;
    scorie += gagne * p.ressource.scorie;
  }
  const saveur = montage.saveur ? SAVEURS[montage.saveur] : null;
  if (saveur) {
    // La saveur incline le partage du site entier ; sans saveur, le butin
    // reste proportionnel aux ressources de ses bâtiments.
    const somme = quartz + scorie;
    quartz = somme * saveur.quartz;
    scorie = somme * saveur.scorie;
  }
  return { quartz: Math.floor(quartz), scorie: Math.floor(scorie) };
}

/**
 * Points de recherche d'un raid, en MILLI-POINTS. Ils se prennent sur les
 * cibles défensives endommagées ; les bâtiments ne rapportent rien. Casser des
 * murs rapporte 2 : ce n'est pas une erreur, c'est le point du modèle.
 * @returns {number} milli-points entiers.
 */
export function pointsRecherche(resultat, montage) {
  const multiplicateur = POINTS_RECHERCHE.multiplicateurParNiveau ** (montage.niveau - 1);
  const bonusMilli = MILLE
    + enEntier(POINTS_RECHERCHE.bonusModuleDebloque, MILLE, 'bonusModuleDebloque');
  const debloques = new Set(montage.modulesDebloques?.ouvrage ?? []);
  let total = 0;
  for (const d of resultat.defenses) {
    const bareme = POINTS_RECHERCHE.parCible[d.id];
    if (bareme === undefined || d.pvPerdusMilli === 0) continue;
    const facteur = d.module !== null && debloques.has(d.module) ? bonusMilli : MILLE;
    total += Math.floor(
      (bareme * multiplicateur * facteur * d.pvPerdusMilli) / d.pvMaxMilli,
    );
  }
  return total;
}

// ---------------------------------------------------------------------------
// Sérialisation stable
// ---------------------------------------------------------------------------

function normaliser(valeur) {
  if (Array.isArray(valeur)) return valeur.map(normaliser);
  if (valeur !== null && typeof valeur === 'object') {
    const sortie = {};
    for (const cle of Object.keys(valeur).sort()) sortie[cle] = normaliser(valeur[cle]);
    return sortie;
  }
  return valeur;
}

/**
 * Sérialise l'état sous une forme stable (clés triées), indépendante de
 * l'ordre de construction des objets. C'est la forme comparée par le test de
 * déterminisme, et l'état ne contient QUE des entiers, des booléens, des
 * chaînes et des tableaux : rien qui ne survive à un aller-retour JSON.
 * @param {object} etat
 * @returns {string}
 */
export function serialiserEtat(etat) {
  return JSON.stringify(normaliser(etat));
}
