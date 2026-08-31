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

import { GRILLE, UNITES, DEFENSES, COLONNES_DEGATS } from '../data/combat.js';
import {
  BATIMENTS, BUTIN, SAVEURS, POINTS_RECHERCHE, GEOGRAPHIE, TYPES_SITE,
} from '../data/sites.js';
import { NIVEAU } from '../data/niveaux.js';
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

/**
 * Ticks consécutifs sans pouvoir ni avancer ni nuire au terme desquels une
 * unité offensive rentre à la base. Lu des données, jamais écrit en dur.
 */
export const TICKS_AVANT_REPLI = GRILLE.ticksAvantRepli;

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

/**
 * Lit une table de dégâts à trois colonnes et la rend en entiers.
 *
 * LOT 4A — il n'y a plus de matrice de facteurs, donc plus de bornes à 0…1000 :
 * les dégâts sont ABSOLUS. L'invariant qui reste est l'exactitude entière, et
 * elle est dure : le relevé ne contient aucune valeur fractionnaire une fois
 * divisée par 160, et une valeur qui le deviendrait signalerait une saisie
 * fausse, pas un calibrage plus fin.
 *
 * TOUTES les tables sont rendues en MILLI-PV, comme pvMaxMilli. C'est ce qui
 * garantit que la mise à l'échelle de niveau est EXACTE des deux côtés : les PV
 * valent pv × facteurMilli sans reste, et les dégâts degats × facteurMilli de
 * même. Voir tableALEchelle pour la démonstration et ce qu'elle a coûté.
 *
 * @param {object|null} table valeurs par colonne, ou null si l'entité ne tire pas.
 * @param {number} facteur MILLE pour une table écrite en PV entiers (les tirs),
 *   1 pour une table déjà écrite en milli-PV (le franchissement des barrières).
 */
function colonnesDeDegats(table, contexte, facteur = 1) {
  if (table === null || table === undefined) return null;
  const sortie = {};
  for (const colonne of COLONNES_DEGATS) {
    if (table[colonne] === undefined) {
      throw new Error(`combat : ${contexte} — colonne de dégâts « ${colonne} » absente`);
    }
    const valeur = enEntier(table[colonne], facteur, `${contexte}.${colonne}`);
    if (valeur < 0) {
      throw new Error(`combat : ${contexte}.${colonne} = ${valeur} est négatif`);
    }
    sortie[colonne] = valeur;
  }
  return sortie;
}

/**
 * Colonne de PRÉDILECTION : celle où l'entité frappe le plus fort.
 *
 * Remplace le « facteur de matrice égal à 1,0 » du lot 2A, que la disparition
 * de la matrice a privé d'objet. Les deux lectures coïncident sur les 23
 * profils du relevé — vérifié en test, pas supposé.
 *
 * La dominante doit être STRICTEMENT unique : une égalité rendrait la règle
 * d'arrêt ambiguë, et l'ambiguïté se paierait en indéterminisme. Rend null pour
 * une entité qui ne tire pas.
 */
function colonneDominante(table, contexte) {
  if (table === null) return null;
  let meilleure = null;
  let valeurMax = 0;
  let exAequo = false;
  for (const colonne of COLONNES_DEGATS) {
    if (table[colonne] > valeurMax) {
      valeurMax = table[colonne];
      meilleure = colonne;
      exAequo = false;
    } else if (table[colonne] === valeurMax && valeurMax > 0) {
      exAequo = true;
    }
  }
  if (exAequo) {
    throw new Error(`combat : ${contexte} — deux colonnes à ${valeurMax}, prédilection ambiguë`);
  }
  return meilleure;
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
  // LOT 4A — la vitesse du relevé EST le milli-case par tick : 60 · 90 · 120 ·
  // 240. Plus de conversion, plus de flottant. Le facteur 100 du lot 2A servait
  // à passer de cases/s (0,5 · 1,2 · 3) à milli/tick, et le relevé donne
  // directement la seconde forme.
  const vitesseMilli = entierDeDonnees(u.vitesse, `${contexte}.vitesse`);
  const porteeMilli = enEntier(u.portee, MILLE, `${contexte}.portee`);
  const porteeMiniMilli = enEntier(u.porteeMini, MILLE, `${contexte}.porteeMini`);
  const degatsUnite = colonnesDeDegats(u.degats, `${contexte}.degats`, MILLE);
  return {
    genre: 'unite',
    id,
    chassis: u.chassis,
    colonneMatrice: COLONNE_PAR_CHASSIS[u.chassis],
    pvMaxMilli: enEntier(u.pv, MILLE, `${contexte}.pv`),
    degatsColonne: degatsUnite,
    colonnePredilection: colonneDominante(degatsUnite, contexte),
    porteeCarree: porteeMilli * porteeMilli,
    porteeMiniCarree: porteeMiniMilli * porteeMiniMilli,
    franchissementColonne: null,
    masse: entierDeDonnees(u.masse, `${contexte}.masse`),
    bloquant: u.masse > 0,
    ecrasable: true,
    vitesseMilli,
    vitesseObstacleMilli: vitesseSousObstacle(vitesseMilli),
    comportementAerien: u.comportementAerien,
    reserveMax: entierDeDonnees(u.reserve, `${contexte}.reserve`),
    // Plancher de réserve : 10 % de la réserve NOMINALE, jamais de la réserve
    // courante — une unité montée déjà entamée garde le même plancher.
    plancherReserve: Math.floor((u.reserve * GRILLE.plancherReservePct) / 100),
    // ⚠⚠ TROIS CHAMPS, TROIS SENS, ET AUCUN NOM AMBIGU. Une pièce porte
    // jusqu'à trois modules différents : celui qu'elle emploie à l'assaut, celui
    // qu'elle emploie en garnison CHEZ LE JOUEUR, celui qu'elle emploie en
    // garnison CHEZ L'OUVRAGE. Un seul champ portait les deux derniers — le
    // joueur ici, l'Ouvrage dans `profilDefense` : le même nom pour deux
    // grandeurs, donc un lecteur sur deux qui se trompe sans le savoir.
    moduleDefenseJoueur: u.defense.module,
    moduleDefenseOuvrage: u.moduleOuvrage,
    module: u.module,
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
  const degatsDefense = colonnesDeDegats(d.degats, `${contexte}.degats`, MILLE);
  return {
    genre: 'defense',
    id,
    type: d.type,
    chassis: null,
    colonneMatrice: COLONNE_PAR_TYPE_DEFENSE[d.type],
    pvMaxMilli: enEntier(d.pv, MILLE, `${contexte}.pv`),
    degatsColonne: degatsDefense,
    colonnePredilection: colonneDominante(degatsDefense, contexte),
    porteeCarree: porteeMilli * porteeMilli,
    porteeMiniCarree: porteeMiniMilli * porteeMiniMilli,
    masse: null,
    bloquant: d.bloque === true,
    ecrasable: false,
    // En MILLI-PV et par colonne : la Ronce vaut 2,5 PV/tick contre l'infanterie
    // depuis le lot 2B, et 2,5 n'est pas un entier. Les données portent donc
    // 2500 directement — c'est la seule table de dégâts qui ne soit pas en PV
    // entiers, et la seule que le lot 4A ne reprenne pas du relevé.
    franchissementColonne: colonnesDeDegats(
      d.degatsFranchissement, `${contexte}.degatsFranchissement`,
    ),
    vitesseMilli: 0,
    vitesseObstacleMilli: 0,
    comportementAerien: null,
    reserveMax: 0,
    plancherReserve: 0,
    // Un ouvrage fixe n'a pas le même module selon qui le possède : la table
    // porte les deux, le profil aussi.
    moduleDefenseJoueur: d.moduleJoueur,
    moduleDefenseOuvrage: d.moduleOuvrage,
    // Une structure ne se déplace pas : elle ne force rien.
    module: null,
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
    degatsColonne: null,
    colonnePredilection: null,
    porteeCarree: 0,
    porteeMiniCarree: 0,
    masse: null,
    bloquant: true,
    ecrasable: false,
    franchissementColonne: null,
    vitesseMilli: 0,
    vitesseObstacleMilli: 0,
    comportementAerien: null,
    reserveMax: 0,
    plancherReserve: 0,
    moduleDefenseJoueur: null,
    moduleDefenseOuvrage: null,
    module: null,
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

  // Les points de recherche suivent la courbe économique. Le produit le plus
  // lourd du barème est bareme × facteurEconomiqueMilli(plafond) × bonus : il
  // doit rester un entier sûr. L'asserter plutôt que le supposer.
  const bareme = Math.max(...Object.values(POINTS_RECHERCHE.parCible));
  const bonus = MILLE + Math.round(MILLE * POINTS_RECHERCHE.bonusModuleDebloque);
  const plafond = bareme * facteurEconomiqueMilli(GEOGRAPHIE.niveauPlafond) * bonus;
  if (!Number.isSafeInteger(plafond)) {
    throw new Error(
      `combat : ${bareme} × ${facteurEconomiqueMilli(GEOGRAPHIE.niveauPlafond)} × ${bonus} `
      + `= ${plafond} n'est pas un entier sûr`,
    );
  }
  return true;
}

verifierArithmetique();

// ---------------------------------------------------------------------------
// Courbe de niveau
// ---------------------------------------------------------------------------

/**
 * Facteur d'échelle d'un niveau, en MILLIÈMES. Vaut exactement 1000 au niveau 1.
 *
 *   facteurMilli(n) = round(1000 × penteBasse^(min(n,12)−1) × penteHaute^max(n−12,0))
 *
 * Si NIVEAU.deuxRegimes vaut false, penteHaute s'applique partout.
 * Seuls les PV et les dégâts s'y adossent : réserve, portée, portée minimale,
 * vitesse, masse et points d'armée ne montent jamais.
 * @param {number} niveau
 * @returns {number} entier de millièmes.
 */
export function facteurMilli(niveau) {
  if (!Number.isInteger(niveau) || niveau < 1 || niveau > NIVEAU.plafond) {
    throw new Error(`combat : niveau ${niveau} hors de 1…${NIVEAU.plafond}`);
  }
  const exposantBas = NIVEAU.deuxRegimes ? Math.min(niveau, NIVEAU.niveauBascule) - 1 : 0;
  const exposantHaut = NIVEAU.deuxRegimes
    ? Math.max(niveau - NIVEAU.niveauBascule, 0)
    : niveau - 1;
  return Math.round(
    MILLE * NIVEAU.penteBasse ** exposantBas * NIVEAU.penteHaute ** exposantHaut,
  );
}

/**
 * Met une valeur de dégâts à l'échelle d'un niveau.
 * Les PV, eux, se calculent depuis les PV BRUTS : `pv × facteurMilli` est exact
 * par construction (pvMaxMilli = pv × 1000, donc × facteurMilli / 1000 = pv ×
 * facteurMilli), là où un dégât doit être arrondi.
 */
function aLEchelle(valeur, facteur) {
  return Math.floor((valeur * facteur) / MILLE);
}

/**
 * La même mise à l'échelle, colonne par colonne. Rend null pour une table nulle.
 *
 * Les tables étant en MILLI-PV, `aLEchelle` y est EXACTE : la colonne vaut
 * degats × 1000, donc floor(degats × 1000 × facteur / 1000) = degats × facteur,
 * sans reste. C'est la même exactitude que pvMaxMilli, et c'est ce qui conserve
 * le rapport PV/dégâts d'un niveau à l'autre.
 *
 * Écrite en PV entiers, la colonne perdrait au contraire son reste à chaque
 * niveau : au 12e, où le facteur vaut 2683, une colonne de 5 PV rendrait
 * floor(13,415) = 13 au lieu de 13,415 — 1,56 % de moins, quand les PV, eux,
 * ne perdent rien. Mesuré : l'invariance en miroir passait de 0 à 2 ticks.
 */
function tableALEchelle(table, facteur) {
  if (table === null) return null;
  const sortie = {};
  for (const colonne of COLONNES_DEGATS) sortie[colonne] = aLEchelle(table[colonne], facteur);
  return sortie;
}

const TABLES_PROFIL = {
  unite: PROFILS_UNITE,
  defense: PROFILS_DEFENSE,
  batiment: PROFILS_BATIMENT,
};

/** Profil de calibrage d'une entité de l'état. */
function profil(entite) {
  return TABLES_PROFIL[entite.genre][entite.id];
}

/**
 * Une entité sans table de dégâts, sans portée, ou à table nulle, ne tire jamais.
 *
 * ⚠ LA PORTÉE SE LIT SUR L'ENTITÉ, PAS SUR LE PROFIL. Depuis MODULES-D elle
 * peut varier d'une pièce à l'autre ; laisser CE lecteur-ci sur le profil
 * donnerait une entité qui vise au-delà de sa portée sans jamais tirer.
 */
function peutTirer(e, p) {
  if (p.degatsColonne === null || e.porteeCarree === 0) return false;
  return COLONNES_DEGATS.some((colonne) => p.degatsColonne[colonne] > 0);
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
function ajouterEntite(
  etat, contexte,
  { camp, genre, id, rangee, colonne, pvMilli, reserve, niveau, proprietaire },
  casesPrises, obstaclesIndex,
) {
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

  // Niveau de l'ENTITÉ : celui du site par défaut, surchargeable ligne à ligne
  // — une base est « composée de deux niveaux adjacents », ce que le niveau de
  // site seul ne sait pas exprimer.
  const niveauEntite = niveau ?? etat.niveau;
  if (!Number.isInteger(niveauEntite) || niveauEntite < 1 || niveauEntite > NIVEAU.plafond) {
    throw new Error(`combat : ${ou} — niveau ${niveauEntite} hors de 1…${NIVEAU.plafond}`);
  }
  const facteur = facteurMilli(niveauEntite);
  // pvMaxMilli = pv × 1000 × facteurMilli / 1000 = pv × facteurMilli. Exact.
  const pvMaxMilli = (p.pvMaxMilli / MILLE) * facteur;
  const degatsColonne = tableALEchelle(p.degatsColonne, facteur);
  const franchissementColonne = tableALEchelle(p.franchissementColonne, facteur);

  let pv = pvMaxMilli;
  if (pvMilli !== undefined) {
    // Forçage explicite, PRIORITAIRE sur l'échelle : c'est ce qui permet de
    // monter un état déjà entamé.
    verifierEntierPositif(pvMilli, `${ou} — pvMilli`);
    if (pvMilli === 0 || pvMilli > pvMaxMilli) {
      throw new Error(`combat : ${ou} — pvMilli ${pvMilli} hors de 1…${pvMaxMilli}`);
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
    // ⚠ LE CAMP EST UN CÔTÉ DE GRILLE, LE PROPRIÉTAIRE EST À QUI C'EST. La
    // destructuration ci-dessus est une LISTE FERMÉE : un champ passé par
    // l'appelant et absent de cette liste disparaît en silence — c'est ce qui
    // s'est produit à la première écriture de ce lot, et deux tests l'ont
    // attrapé. Ajouter un champ ici, c'est l'ajouter AUX DEUX endroits.
    proprietaire: proprietaire ?? (camp === 'attaque' ? 'joueur' : 'ouvrage'),
    genre,
    id,
    colonne,
    niveau: niveauEntite,
    rangeeMilli: milliDepuisCase(rangee),
    pvMilli: pv,
    pvMaxMilli,
    // ⚠ LES PV DE DÉPART DE CE COMBAT-CI, ET ILS NE VALENT PAS TOUJOURS
    // `pvMaxMilli`. Un site entamé se monte avec le `pvMilli` que la passe
    // précédente lui a laissé ; sans cette trace, le butin de la seconde passe
    // repaierait les dégâts de la première. C'est de la comptabilité, pas du
    // combat : rien dans la boucle ne la lit.
    pvInitialMilli: pv,
    // Les deux seules grandeurs de combat qui suivent le niveau. Elles vivent
    // sur l'entité, pas sur le profil : deux entités du même identifiant
    // peuvent être à deux niveaux différents sur la même grille.
    degatsColonne,
    franchissementColonne,
    // ⚠⚠ LA PORTÉE AUSSI, DEPUIS MODULES-D — mais elle ne suit pas le niveau,
    // elle suit le MODULE. Deux Guetteurs de la même garnison n'ont pas le
    // même rayon si l'un est du joueur et l'autre de l'Ouvrage ; un profil est
    // PARTAGÉ par toutes les pièces d'un identifiant, il ne peut donc pas
    // porter une grandeur qui varie de l'une à l'autre.
    porteeCarree: p.porteeCarree,
    porteeMiniCarree: p.porteeMiniCarree,
    reserve: res,
    plancherReserve: camp === 'attaque' ? p.plancherReserve : 0,
    vivant: true,
    sorti: false,
    ecrase: false,
    // Ticks consécutifs passés sans pouvoir ni avancer ni nuire. À
    // TICKS_AVANT_REPLI, l'unité offensive rentre à la base. Visible au pas à
    // pas et dans l'état sérialisé.
    ticksInutiles: 0,
    cibleIndice: null,
    aTire: false,
    // Réservoir du module Bouclier ; 0 si la pièce ne le porte pas. Un entier,
    // comme les autres champs : `serialiserEtat` le voit, il entre donc dans la
    // comparaison de déterminisme. Il ne se recharge jamais et ne survit pas au
    // raid — aucune sauvegarde ne le lit, `SAVE_VERSION` ne bouge pas.
    bouclierMilli: 0,
    // Lot 2C : ces deux champs restent vides et inertes en 2A.
    modulesActifs: [],
    effetsTemporises: [],
  };
  // ⚠ LE RÉSERVOIR EST POSÉ AU MONTAGE, PAS AU PREMIER TICK. `creerCombat`
  // remplit `etat.modulesDebloques` AVANT de monter la moindre entité (voir
  // plus bas), donc `moduleActif` est appelable ici. Le poser au premier tick
  // laisserait passer un tick de tir sans la moindre protection.
  if (moduleActif(etat, entite, p, 'bouclier')) entite.bouclierMilli = pvMaxMilli;
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

  // ⚠ CAMP ET PROPRIÉTAIRE SONT DEUX CHOSES. `camp` désigne un CÔTÉ DE LA
  // GRILLE — qui défend, qui attaque — et il ne bouge jamais. `proprietaire`
  // désigne À QUI APPARTIENNENT les entités, et c'est lui qui décide du jeu de
  // noms affiché. Tant que seul l'Ouvrage défendait, les deux se confondaient ;
  // le jour où le joueur garnit sa propre base, ses Cuirassiers s'afficheraient
  // « Carapace » si l'on continuait de lire le camp.
  //
  // Les DÉFAUTS reproduisent exactement le comportement d'avant : la défense
  // appartient à l'Ouvrage, l'assaut au joueur.
  const proprietaireDefense = montage.proprietaireDefense ?? 'ouvrage';
  const proprietaireAttaque = montage.proprietaireAttaque ?? 'joueur';
  for (const [cle, valeur] of [['proprietaireDefense', proprietaireDefense],
    ['proprietaireAttaque', proprietaireAttaque]]) {
    if (valeur !== 'joueur' && valeur !== 'ouvrage') {
      throw new Error(`combat : ${cle} vaut « ${valeur} », attendu « joueur » ou « ouvrage »`);
    }
  }
  if (proprietaireDefense === proprietaireAttaque) {
    throw new Error(
      `combat : les deux camps appartiennent à « ${proprietaireDefense} » — personne ne s'attaque soi-même`,
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
    proprietaireDefense,
    proprietaireAttaque,
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
    ajouterEntite(etat, 'défenseur', { ...d, camp: 'defense', genre, proprietaire: proprietaireDefense },
      casesPrises, obstaclesIndex);
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
    ajouterEntite(etat, 'bâtiment', { ...b, camp: 'defense', genre: 'batiment', proprietaire: proprietaireDefense },
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
        niveau: u.niveau,
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
      { ...d, camp: 'attaque', genre: 'unite', proprietaire: etat.proprietaireAttaque },
      casesPrises ?? null,
      obtenirIndexObstacles(etat),
    );
    if (p.bloquant) poser(occupation, d.rangee, d.colonne, entite.indice);
  }
  etat.enAttente = restants;
}

/**
 * Dégâts effectifs qu'un tir de `e` porterait à `cible`, en milli-PV.
 *
 * C'est le SEUL prédicat de validité du moteur. Le ciblage l'emploie pour
 * n'élire qu'une cible qu'on peut blesser, et le repli pour savoir si l'unité
 * nuit encore : les deux questions sont la même, et deux prédicats parallèles
 * finiraient par répondre différemment.
 *
 * Il rend zéro dans trois cas, tous déjà connus de tir() :
 *   — la colonne de dégâts du tireur est nulle contre le châssis de la cible ;
 *   — les PV du tireur sont tombés sous 1 ‰ de son maximum, sa santé arrondie
 *     vaut alors 0 et son tir ne retire plus rien ;
 *   — la cible est un bâtiment et la réserve de l'attaquant est épuisée. Le
 *     plancher de réserve ne protège que les bâtiments : le tir sur une entité
 *     de la défense reste gratuit, donc toujours valide.
 */
function degatsContre(e, p, cible) {
  const pc = profil(cible);
  if (pc.genre === 'batiment' && e.camp === 'attaque' && e.reserve <= 0) return 0;
  return degatsDUnTir(e.degatsColonne[pc.colonneMatrice], e.pvMilli, e.pvMaxMilli);
}

/**
 * CAMOUFLAGE — « invisible pour la défense ; sort du camouflage si une cible de
 * prédilection est à portée ».
 *
 * Rend l'ensemble des INDICES que le ciblage adverse doit ignorer à ce tick.
 *
 * ⚠⚠ CALCULÉ UNE FOIS, EN TÊTE DE `ciblage`, AVANT LA BOUCLE. Le ciblage est
 * simultané comme le tir : il se lit sur l'état de DÉBUT de tick. Rien dans
 * `ciblage` ne modifie aujourd'hui ce que ce prédicat lit — positions, camps,
 * vie —, si bien qu'une évaluation au fil de la boucle rendrait les mêmes
 * réponses ; mais elle les rendrait n fois au lieu d'une, et surtout elle
 * cesserait d'être vraie le jour où le ciblage écrira autre chose que
 * `cibleIndice`. La forme qui ne peut pas se tromper est celle-ci.
 *
 * ⚠ NI DURÉE, NI USAGE UNIQUE. L'état se recalcule intégralement à chaque
 * tick : rien ne va dans `modulesActifs`, rien dans `effetsTemporises`. Une
 * unité qui se recamoufle est un cas normal, pas une exception.
 *
 * ⚠ « À PORTÉE » EST LA PORTÉE DU CAMOUFLÉ, bornes minimale et maximale
 * comprises — les mêmes que son ciblage. Ce n'est pas la portée de celui qui
 * regarde : c'est l'unité qui se découvre en s'approchant de sa proie, pas le
 * défenseur qui la débusque.
 *
 * ⚠ LE CAMOUFLÉ CIBLE ET TIRE NORMALEMENT. Le module change la façon dont il
 * est VU, pas ce qu'il fait ; `doitSArreter` n'est pas touché.
 *
 * ⚠ ATTAQUANTS SEULEMENT. « Invisible pour la DÉFENSE » : un ouvrage camouflé
 * serait invisible pour l'attaquant, ce que la description ne dit pas. Les deux
 * porteurs — Guetteur et Frappeur — n'ont d'ailleurs aucun rôle défensif.
 */
function ensembleCamoufles(etat) {
  const camoufles = new Set();
  for (const e of etat.entites) {
    if (e.camp !== 'attaque' || !estActive(e)) continue;
    const p = profil(e);
    if (!moduleActif(etat, e, p, 'camouflage')) continue;
    // Une entité sans prédilection ne tire pas : rien ne peut la découvrir.
    // Aucun porteur n'est dans ce cas aujourd'hui ; la garde évite d'avoir à
    // le redécouvrir si l'un d'eux perdait sa table de dégâts.
    let revele = false;
    if (p.colonnePredilection !== null) {
      for (const c of etat.entites) {
        if (c.camp === e.camp || !estActive(c)) continue;
        if (profil(c).colonneMatrice !== p.colonnePredilection) continue;
        const d2 = distanceCarree(e.rangeeMilli, e.colonne, c.rangeeMilli, c.colonne);
        if (d2 > e.porteeCarree || d2 < e.porteeMiniCarree) continue;
        revele = true;
        break;
      }
    }
    if (!revele) camoufles.add(e.indice);
  }
  return camoufles;
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
  const camoufles = ensembleCamoufles(etat);
  for (const e of etat.entites) {
    if (!estActive(e)) continue;
    const p = profil(e);
    if (!peutTirer(e, p)) {
      e.cibleIndice = null;
      continue;
    }
    // Seule la DÉFENSE est aveugle au camouflage. `null` là où il n'y a rien à
    // masquer évite un test de camp par candidat.
    const masque = e.camp === 'defense' ? camoufles : null;
    let meilleur = null;
    let meilleureDistance = 0;
    let meilleureColonne = 0;
    let meilleureRangee = 0;
    for (const c of etat.entites) {
      if (c.camp === e.camp || !estActive(c)) continue;
      if (masque !== null && masque.has(c.indice)) continue;
      const d2 = distanceCarree(e.rangeeMilli, e.colonne, c.rangeeMilli, c.colonne);
      if (d2 > e.porteeCarree || d2 < e.porteeMiniCarree) continue;
      // UNE CIBLE VALIDE EST UNE CIBLE QU'ON PEUT BLESSER. Sans cette ligne, une
      // Batterie de matrice {0, 0, 1} passe le raid à viser l'infanterie qui la
      // serre de plus près, et toute la couche anti-aérienne est inerte.
      if (degatsContre(e, p, c) === 0) continue;
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
    } else if (e.cibleIndice !== null) {
      // La cible conservée suit la MÊME règle : devenue insensible — réserve
      // épuisée, tireur sous 1 ‰ de vie — elle n'est plus conservée.
      const ancienne = etat.entites[e.cibleIndice];
      // ⚠⚠ ET LE CAMOUFLAGE COMPTE ICI AUSSI, C'EST LA MOITIÉ DE L'EFFET. Ce
      // bloc garde l'ancienne cible quand aucune nouvelle n'est trouvée : un
      // défenseur qui visait une unité au moment où elle se recamoufle
      // continuerait de la viser indéfiniment, et le module serait sans effet
      // dans tous les cas où il compte le plus — celui où le camouflé est la
      // seule chose à portée.
      if (!estActive(ancienne) || degatsContre(e, p, ancienne) === 0
          || (masque !== null && masque.has(ancienne.indice))) {
        e.cibleIndice = null;
      }
    }
  }
}

/**
 * FLASHBANG et EMP — « désactive une infanterie / un véhicule à portée pendant
 * 5 s, une seule fois par raid, effet −20 % sur une unité de niveau n+1 ».
 *
 * ⚠⚠ UN SEUL MÉCANISME, DEUX ENTRÉES DE TABLE. Les deux modules ne diffèrent
 * QUE par la colonne de matrice visée. Deux fonctions jumelles seraient deux
 * barèmes pour une même grandeur — ce que les conventions du dépôt refusent — et
 * la première correction d'équilibrage n'en toucherait qu'une.
 */
const NEUTRALISATION = {
  flashbang: 'infanterie',
  emp: 'vehicule',
};

/** 5 s à 10 Hz, et la pénalité par niveau d'écart, en pour cent. */
const NEUTRALISATION_TICKS = 50;
const NEUTRALISATION_PENALITE_PCT = 20;

/** L'entité est-elle désactivée en ce moment ? */
function estNeutralisee(e) {
  return e.effetsTemporises.some((f) => f.nom === 'neutralise');
}

/**
 * La durée de neutralisation, en ticks — 0 si la cible est trop haute.
 *
 * ⚠ LE −20 % PORTE SUR LA DURÉE (arbitrage 1 d'Ethan, 31/08). La description
 * dit « effet −20 % sur une unité de niveau n+1 » sans nommer la grandeur ; les
 * deux lectures possibles étaient la durée et la portée, et c'est la durée.
 *
 * ⚠ SOUSTRACTIVE, PAS MULTIPLICATIVE, ET PLANCHER À ZÉRO. 50 · 40 · 30 · 20 ·
 * 10 · 0 : l'effet s'éteint franchement à +5 niveaux. Une forme multiplicative
 * (×0,8 par cran) rendrait 32 à +2 au lieu de 30, et ne toucherait jamais zéro
 * — une neutralisation d'un tick contre une cible de vingt niveaux au-dessus
 * serait absurde.
 */
function ticksDeNeutralisation(porteur, cible) {
  const ecart = Math.max(0, cible.niveau - porteur.niveau);
  const pct = Math.max(0, 100 - NEUTRALISATION_PENALITE_PCT * ecart);
  return Math.floor((NEUTRALISATION_TICKS * pct) / 100);
}

/**
 * La cible d'une neutralisation : l'adverse active la plus proche, à portée,
 * dont la COLONNE DE MATRICE est celle du module.
 *
 * ⚠⚠ CE N'EST PAS `e.cibleIndice`. La cible de TIR s'élit sur les dégâts qu'on
 * peut lui faire (`degatsContre`) ; celle-ci s'élit sur le châssis. Les deux
 * coïncident souvent et divergent parfois — reprendre la cible de tir donnerait
 * un Flashbang qui « désactive » un mur dès qu'un mur est plus proche.
 *
 * ⚠ « INFANTERIE » ET « VÉHICULE » SE LISENT SUR LA COLONNE DE MATRICE, jamais
 * sur le châssis brut : les trois artilleries sont des VÉHICULES sans être des
 * blindés (voir `COLONNE_PAR_TYPE_DEFENSE`), et une lecture du châssis les
 * mettrait hors de portée de l'EMP.
 *
 * ⚠ LE DÉPARTAGE EST CELUI DE `ciblage`, À LA LETTRE — distance carrée, puis
 * colonne, puis rangée. Un autre ordre rendrait le résultat dépendant de
 * l'ordre d'itération, et le test de déterminisme ne le dirait pas : les deux
 * résolutions seraient stables et fausses de la même façon.
 */
function cibleDeNeutralisation(etat, e, p, colonneVisee) {
  let meilleur = null;
  let meilleureDistance = 0;
  let meilleureColonne = 0;
  let meilleureRangee = 0;
  for (const c of etat.entites) {
    if (c.camp === e.camp || !estActive(c)) continue;
    if (profil(c).colonneMatrice !== colonneVisee) continue;
    const d2 = distanceCarree(e.rangeeMilli, e.colonne, c.rangeeMilli, c.colonne);
    if (d2 > e.porteeCarree || d2 < e.porteeMiniCarree) continue;
    if (
      meilleur === null
      || d2 < meilleureDistance
      || (d2 === meilleureDistance && c.colonne < meilleureColonne)
      || (d2 === meilleureDistance && c.colonne === meilleureColonne
          && c.rangeeMilli < meilleureRangee)
    ) {
      meilleur = c;
      meilleureDistance = d2;
      meilleureColonne = c.colonne;
      meilleureRangee = c.rangeeMilli;
    }
  }
  return meilleur;
}

/**
 * 3 bis. Déclenchement des neutralisations, juste après le ciblage.
 *
 * ⚠ APRÈS `ciblage` ET AVANT `tir`, pour que l'effet posé à ce tick coupe le
 * tir du MÊME tick. Posé après `tir`, la cible tirerait une fois de plus que la
 * durée annoncée — un tick sur cinquante, invisible à l'œil et faux.
 *
 * ⚠⚠ UNE DURÉE NULLE NE CONSOMME PAS L'USAGE. C'est la garde la plus
 * importante de ce bloc : poser la marque pour un effet de zéro tick gâcherait
 * un module payé des dizaines de millions de points contre une cible qu'il ne
 * pouvait pas toucher. Le porteur retente au tick suivant, sur une autre cible.
 * L'ordre des trois lignes finales est donc normatif — chercher, mesurer, PUIS
 * marquer.
 *
 * ⚠ LA MARQUE N'EST JAMAIS RETIRÉE, exactement comme le Booster : « une seule
 * fois par raid » = une fois par combat et par entité.
 */
function declencherNeutralisations(etat) {
  for (const e of etat.entites) {
    if (e.camp !== 'attaque' || !estActive(e)) continue;
    const p = profil(e);
    const colonneVisee = NEUTRALISATION[p.module];
    if (colonneVisee === undefined) continue;
    if (e.modulesActifs.includes(p.module)) continue;
    if (!moduleActif(etat, e, p, p.module)) continue;
    const cible = cibleDeNeutralisation(etat, e, p, colonneVisee);
    if (cible === null) continue;
    const ticks = ticksDeNeutralisation(e, cible);
    if (ticks === 0) continue;
    cible.effetsTemporises.push({ nom: 'neutralise', finTick: etat.tick + ticks });
    e.modulesActifs.push(p.module);
  }
}

/**
 * Dégâts d'un tir, formule unique.
 *
 *   ratioMilli  = floor(pvCourantMilli × 1000 / pvMaxMilli)   // 0 à 1000
 *   degatsMilli = floor(degatsColonneMilli × ratioMilli / 1000)
 *
 * LOT 4A — la multiplication par le facteur de matrice a disparu avec la
 * matrice : une opération de moins, et aucun arrondi intermédiaire de plus.
 *
 * ⚠ Le brief écrit la formule `floor(degatsColonne × ratioMilli)`, la colonne
 * étant lue en PV entiers. Elle est exacte au niveau 1 et fausse ailleurs : une
 * colonne en PV entiers perd son reste à chaque mise à l'échelle de niveau,
 * alors que les PV, eux, vivent en milli et n'en perdent aucun. Cette asymétrie
 * cassait l'invariance en miroir du T12 du lot 2B — 2 ticks d'écart, contre 0
 * avant la conversion, et le brief exige justement qu'elle ne bouge pas. Les
 * colonnes sont donc portées en MILLI-PV dès le profil, exactement comme
 * pvMaxMilli, d'où la division par 1000 ici. Au niveau 1 les deux écritures
 * coïncident au milli-PV près ; au-delà, seule celle-ci conserve le rapport.
 *
 * La santé du tireur passe en MILLIÈMES : les dégâts ne dépendent pas de la
 * magnitude des PV maximaux, seulement du pourcentage de vie restant.
 *
 * Arbitrage d'Ethan reçu en cours d'exécution du lot 2A : il remplace le
 * « un seul Math.floor, jamais d'arrondi intermédiaire » du brief §4. Aucun
 * des seuils chiffrés du §12 ne bouge — ils portent tous sur des ratios ronds
 * (100 %, 50 %, 10 %), où les deux écritures coïncident exactement.
 */
function degatsDUnTir(degatsColonneMilli, pvCourantMilli, pvMaxMilli) {
  const ratioMilli = Math.floor((pvCourantMilli * MILLE) / pvMaxMilli);
  return Math.floor((degatsColonneMilli * ratioMilli) / MILLE);
}

/**
 * Dégâts de franchissement d'une barrière, par tick de présence.
 *
 *   ratioMilli  = floor(pvCourantMilli × 1000 / pvMaxMilli)
 *   degatsMilli = floor(franchissementColonne × ratioMilli / 1000)
 *
 * Même forme que degatsDUnTir, à ceci près que le franchissement est DÉJÀ en
 * milli-PV — la Ronce vaut 2,5 PV/tick contre l'infanterie, qui ne s'écrit pas
 * en entier autrement. D'où la division par 1000, qui ramène le produit d'une
 * grandeur en milli et d'un ratio en millièmes à des milli-PV. À barrière pleine
 * vie : floor(2500 × 1000 / 1000) = 2500 milli-PV, soit 2,5 PV.
 */
function degatsDeFranchissement(franchissementColonne, pvCourantMilli, pvMaxMilli) {
  const ratioMilli = Math.floor((pvCourantMilli * MILLE) / pvMaxMilli);
  return Math.floor((franchissementColonne * ratioMilli) / MILLE);
}

/** Le pourcentage des dégâts qu'un Tir de barrage reverse à chaque voisine. */
const BARRAGE_PCT = 30;

/**
 * TIR DE BARRAGE — « inflige 30 % des dégâts sur les structures voisines ».
 *
 * Chaque entité adverse de genre `defense` ou `batiment` dont la case touche
 * celle de la cible encaisse 30 % de ce que le tireur ferait À ELLE.
 *
 * ⚠⚠ RECALCULÉ POUR CHAQUE VOISINE, JAMAIS REVERSÉ DEPUIS LA CIBLE. Un tir sur
 * une escouade porte les dégâts de la colonne `escouade` ; les donner tels
 * quels à un mur accorderait à des Grenadiers anti-véhicule une puissance
 * anti-structure qu'aucune table ne leur reconnaît. Chaque cible a sa colonne,
 * le barrage aussi. `degatsContre` porte déjà la santé du tireur et le plancher
 * de réserve sur les bâtiments : il n'y a rien à rejouer ici.
 *
 * ⚠ VOISINE = TCHEBYCHEV 1, LA CIBLE EXCLUE — les huit cases autour d'elle.
 * `distanceTchebychev` de `sim/points-attaque.js` ferait le calcul, mais elle
 * prend deux cases ENTIÈRES et lève sinon, alors qu'une entité de combat porte
 * un `rangeeMilli` ; et elle tire `clock.js` et `niveau-de-base.js` derrière
 * elle, que le moteur de combat ne connaît pas — `combat.js` n'importe de
 * `sim/` que `grille.js`. Deux `Math.abs` sur des cases déjà calculées ne
 * valent pas d'élargir cette dépendance.
 *
 * ⚠ LES BÂTIMENTS SONT TOUCHÉS, contrairement à l'Écraseur. L'Écraseur les
 * exclut parce qu'un bâtiment ne barre pas une colonne ; le barrage n'a pas
 * cette raison, et l'Obusier est anti-structure : il tire dans la bande des
 * bâtiments, où il n'y a aucune défense. L'y restreindre aux défenses ôterait
 * tout effet au porteur le plus cher de l'arbre, à un milliard de points.
 *
 * ⚠ LE MÊME TIR, DONC UNE SEULE RÉSERVE. Rien n'est décompté ici et `aTire`
 * n'est pas retouché : `consommerReserve` compte un tir par tireur, et le
 * barrage n'est pas un second tir. Le ciblage n'est pas touché non plus — le
 * barrage est un effet du tir, pas un choix de cible.
 */
function tirDeBarrage(etat, e, p, cible, ajouter) {
  if (!moduleActif(etat, e, p, 'tirDeBarrage')) return;
  const rangeeCible = caseDepuisMilli(cible.rangeeMilli);
  for (const v of etat.entites) {
    if (v.indice === cible.indice || v.camp === e.camp || !estActive(v)) continue;
    if (v.genre !== 'defense' && v.genre !== 'batiment') continue;
    if (Math.abs(caseDepuisMilli(v.rangeeMilli) - rangeeCible) > 1) continue;
    if (Math.abs(v.colonne - cible.colonne) > 1) continue;
    // Un seul `floor`, sur le produit — comme partout ailleurs dans ce moteur.
    const degats = Math.floor((degatsContre(e, p, v) * BARRAGE_PCT) / 100);
    if (degats > 0) ajouter(v.indice, degats);
  }
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
    // NEUTRALISÉE — ni tir, ni barrage. `aTire` reste faux, donc la réserve
    // n'est pas entamée et `nuit` la voit inutile ; c'est bien ce que « on ne
    // tire pas » veut dire partout ailleurs dans ce moteur.
    //
    // ⚠⚠ LA GARDE EST ICI, PAS DANS `ciblage`. Une entité neutralisée GARDE sa
    // cible et la reprend à l'expiration. Vider `cibleIndice` la ferait aussi
    // recibler à zéro en sortant de l'effet — mais surtout `doitSArreter` lit
    // le ciblage pour décider si une unité AVANCE : neutraliser au ciblage
    // changerait le mouvement, ce qu'aucune description ne dit. « Désactive »
    // = ne tire plus, rien d'autre.
    if (estNeutralisee(e)) continue;
    if (!estActive(e) || e.cibleIndice === null) continue;
    const cible = etat.entites[e.cibleIndice];
    if (!estActive(cible)) continue;
    const p = profil(e);
    const d2 = distanceCarree(e.rangeeMilli, e.colonne, cible.rangeeMilli, cible.colonne);
    if (d2 > e.porteeCarree || d2 < e.porteeMiniCarree) continue;
    // Le MÊME prédicat que le ciblage — dont la réserve : le plancher porte sur
    // la nature de la cible, jamais sur la position du tireur (brief 2A §8). Sur
    // un bâtiment la réserve descend jusqu'à 0 et l'unité vidée ne tire plus ;
    // sur une entité de la défense elle s'arrête au plancher et le tir continue.
    // Depuis le lot 3C le ciblage a déjà écarté les cibles à zéro dégât : ce
    // test ne peut plus mordre, et il vaut comme énoncé de l'invariant.
    const degats = degatsContre(e, p, cible);
    if (degats === 0) continue;
    ajouter(e.cibleIndice, degats);
    e.aTire = true;
    tirDeBarrage(etat, e, p, cible, ajouter);
  }

  // Franchissement : une barrière ne bloque pas, elle saigne. Dégâts par tick
  // de présence, lus dans la colonne de la barrière qui correspond au châssis
  // qui la franchit — la table met déjà l'aviation à zéro.
  const barrieres = new Map();
  for (const b of etat.entites) {
    if (!estActive(b) || b.genre !== 'defense') continue;
    const pb = profil(b);
    if (pb.bloquant || b.franchissementColonne === null) continue;
    barrieres.set(cleCase(caseDepuisMilli(b.rangeeMilli), b.colonne), b);
  }
  if (barrieres.size > 0) {
    for (const e of etat.entites) {
      if (!estActive(e) || e.camp !== 'attaque') continue;
      const b = barrieres.get(cleCase(caseDepuisMilli(e.rangeeMilli), e.colonne));
      if (b === undefined) continue;
      ajouter(
        e.indice,
        degatsDeFranchissement(
          b.franchissementColonne[profil(e).colonneMatrice],
          b.pvMilli,
          b.pvMaxMilli,
        ),
      );
    }
  }
  return tampon;
}

/**
 * Rayon du module Bouclier, en MILLI-CASES AU CARRÉ.
 *
 * ⚠⚠ 2 500 × 2 500, ET SURTOUT PAS 2,5 × 2,5. `distanceCarree` rend un carré de
 * MILLI-cases : deux cases voisines sont à 1 000 000, pas à 1. Une comparaison
 * à `6.25` passerait `node --check`, passerait le build, et le bouclier ne
 * couvrirait plus que la case du porteur — sans qu'aucune erreur ne le dise.
 *
 * ⚠ LA BORNE EST COMPRISE : une case pile à 2,5 est protégée. C'est pour cela
 * que le rejet s'écrit `d2 > BOUCLIER_RAYON_CARRE` et non `>=`.
 */
const BOUCLIER_RAYON_CARRE = 2500 * 2500;

/**
 * 5. Application du tampon. Le seul plancher de PV est 0 : toute entité,
 * défense comprise, se détruit à 0 et sort de la grille. Le plancher de 1 %
 * de la spec §2 est un plancher d'APRÈS-RAID, écrit par le lot 2B ; le moteur
 * rapporte les PV bruts et ne plafonne rien.
 */
function appliquerDegats(etat, tampon) {
  // ⚠ LE TAMPON EST UNE `Map`, ET SON ORDRE D'ITÉRATION EST L'ORDRE
  // D'INSERTION — donc l'ordre où les tireurs ont été déclarés. Tant que
  // chaque cible ne touchait que ses propres PV, cet ordre était SANS EFFET :
  // les soustractions sont indépendantes, elles commutent. Le Bouclier casse
  // cette indifférence, parce qu'il introduit un RÉSERVOIR PARTAGÉ entre
  // plusieurs cibles : selon qui passe le premier, ce n'est pas le même allié
  // qui est couvert et pas le même qui prend le reste. L'ordre d'itération ne
  // doit jamais décider de cela — on trie donc par indice de cible croissant,
  // qui est la seule clé stable de l'état.
  const entrees = [...tampon].sort((a, b) => a[0] - b[0]);

  // Les porteurs d'un réservoir non vide, INDICE CROISSANT. Ce sont des
  // références vives, pas une copie : les réservoirs se vident au fil de la
  // boucle et la suivante doit le voir. L'ordre est celui du §1.1.6 — à
  // recouvrement, c'est le plus petit indice qui encaisse d'abord.
  const boucliers = etat.entites.filter((b) => b.bouclierMilli > 0);

  for (const [indice, degats] of entrees) {
    const e = etat.entites[indice];
    if (!estActive(e)) continue;

    let reste = degats;
    for (const b of boucliers) {
      if (reste <= 0) break;
      // Un bouclier vidé plus tôt dans CE tick ne protège plus.
      if (b.bouclierMilli <= 0) continue;
      // ⚠ UN BOUCLIER MORT NE PROTÈGE PLUS, CE TICK-CI COMPRIS. Le tampon est
      // simultané, mais son application est SÉQUENTIELLE : si le porteur est
      // tombé quelques entrées plus haut, ce qui suit n'est plus couvert.
      // `estActive` ne suffit PAS pour ce cas : `vivant` n'est mis à jour qu'à
      // l'étape 6, `retirerLesMorts`, donc un porteur à zéro PV serait encore
      // « actif » jusqu'à la fin de l'étape 5. D'où le second test.
      if (!estActive(b) || b.pvMilli <= 0) continue;
      // ⚠ LE PORTEUR N'EST PAS SOUS SON PROPRE BOUCLIER. Lecture de la phrase
      // d'Ethan — « les ALLIÉS », pas « les unités ». L'y inclure lui donnerait
      // deux fois ses PV. C'est la SEULE ligne à retirer si l'arbitrage tombe
      // dans l'autre sens.
      if (b.indice === e.indice) continue;
      // « Allié » = MÊME CAMP, et c'est la notion que tout le moteur emploie :
      // chaque test d'ennemi s'y écrit `c.camp === e.camp`. `proprietaire` dit
      // à qui la pièce appartient, pas de quel côté de la grille elle se bat.
      if (b.camp !== e.camp) continue;
      const d2 = distanceCarree(b.rangeeMilli, b.colonne, e.rangeeMilli, e.colonne);
      if (d2 > BOUCLIER_RAYON_CARRE) continue;

      // Absorption PARTIELLE : le réservoir prend ce qu'il peut, le reste
      // passe. Pas de tout-ou-rien. Il ne se recharge jamais.
      const pris = Math.min(b.bouclierMilli, reste);
      b.bouclierMilli -= pris;
      reste -= pris;
    }

    e.pvMilli = Math.max(0, e.pvMilli - reste);
  }
}

/** Le multiplicateur de vitesse du Booster, et sa durée — 3 s à 10 Hz. */
const BOOSTER_FACTEUR = 10;
const BOOSTER_TICKS = 30;

/** L'entité court-elle sous Booster en ce moment ? */
function boosterActif(e) {
  return e.effetsTemporises.some((f) => f.nom === 'booster');
}

/**
 * BOOSTER — « après avoir été blessée, vitesse ×10 pendant 3 s, une seule fois
 * par raid ».
 *
 * ⚠⚠ APPELÉ APRÈS L'APPLICATION DES DÉGÂTS, JAMAIS AVANT. Lu avant, le tick de
 * la blessure ne compterait pas et l'effet démarrerait avec un tick de retard :
 * deux montages qui devraient coïncider divergeraient. Il est aussi appelé
 * après le RETRAIT DES MORTS, pour qu'une unité tombée dans le même tampon ne
 * déclenche pas un sprint qu'elle ne courra jamais.
 *
 * ⚠ « UNE SEULE FOIS PAR RAID » = UNE FOIS PAR COMBAT ET PAR ENTITÉ. Un raid
 * EST un combat ; quatre vagues ne sont pas quatre raids. La marque vit dans
 * `e.modulesActifs` — c'est son premier usage — et **elle n'est jamais
 * retirée**, même après l'expiration de l'effet : une unité soignée puis
 * reblessée ne redéclenche pas.
 *
 * ⚠ L'EFFET VIT DANS `e.effetsTemporises`, sous la forme que l'étape 1 sait
 * déjà filtrer — un objet portant `finTick`. `expirerEffets` n'a AUCUNE ligne à
 * changer. Il ne porte que des chaînes et des entiers : `serialiserEtat` trie
 * les clés et compare le tout, une valeur non triable y casserait le
 * déterminisme sans dire pourquoi.
 *
 * ⚠ TRENTE MOUVEMENTS, À PARTIR DU TICK DE LA BLESSURE INCLUS. `expirerEffets`
 * garde ce dont le `finTick` est STRICTEMENT supérieur au tick courant : posé à
 * `tick + 30` au tick N, l'effet couvre les déplacements des ticks N à N+29 et
 * disparaît à l'entrée du tick N+30. C'est bien 3 s à 10 Hz.
 */
function declencherBoosters(etat) {
  for (const e of etat.entites) {
    if (e.camp !== 'attaque' || !estActive(e)) continue;
    if (e.pvMilli >= e.pvMaxMilli) continue;
    if (e.modulesActifs.includes('booster')) continue;
    if (!moduleActif(etat, e, profil(e), 'booster')) continue;
    e.modulesActifs.push('booster');
    e.effetsTemporises.push({ nom: 'booster', finTick: etat.tick + BOOSTER_TICKS });
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
  return p.colonnePredilection === pc.colonneMatrice;
}

/**
 * L'entité mobile peut-elle ÉCRASER l'occupante de sa case de destination ?
 *
 * L'écrasement ne s'applique qu'entre camps OPPOSÉS. Entre alliés, blocage :
 * celle de derrière attend, elle ne double jamais et ne tue jamais. Le brief du
 * lot 2A énonçait la règle sans mentionner le camp, et un blindé attaquant
 * écrasait donc l'infanterie ALLIÉE qui le précédait dans sa colonne — 18 % des
 * écrasements mesurés. Corrigé au lot 3B.
 *
 * Conséquence de jeu, assumée : la colonne devient un choix. Poser un blindé
 * derrière une infanterie dans la même colonne gâche le blindé, puisqu'aucune
 * unité ne change jamais de colonne.
 */
function peutEcraser(etat, e, p, occupante, po) {
  return occupante.camp !== e.camp && po.ecrasable && masseEffective(etat, e, p, po) > po.masse;
}

/**
 * Le module que cette entité emploie EN DÉFENSE — celui de son PROPRIÉTAIRE.
 *
 * ⚠⚠ LE DISCRIMINANT EST LE PROPRIÉTAIRE, PAS LE CAMP. Le camp dit de quel côté
 * de la grille on est ; le propriétaire dit à qui la pièce appartient. Une même
 * Herse rend `autoReparation` chez le joueur et `pvPlusVingt` chez l'Ouvrage.
 */
function moduleDeDefense(e, p) {
  return e.proprietaire === 'joueur' ? p.moduleDefenseJoueur : p.moduleDefenseOuvrage;
}

/**
 * Le module de cette entité est-il acquis par SON propriétaire ?
 *
 * ⚠ TROIS CONDITIONS, ET AUCUNE N'EST DE TROP. La pièce doit PORTER le module
 * (`data/combat.js`), son propriétaire doit l'avoir ACHETÉ (`modulesDebloques`),
 * et l'on regarde la liste de CE camp-là. Sans la troisième, un joueur qui
 * achète l'Écraseur l'offrirait aux Fendeurs de l'Ouvrage en face de lui.
 *
 * ⚠⚠ ET « PORTER » DÉPEND DU CAMP. À l'assaut c'est `p.module` ; en défense
 * c'est le module de garnison du propriétaire. Lire `p.module` des deux côtés
 * donnait au Guetteur de garnison le Camouflage qu'il n'emploie qu'à l'assaut,
 * et lui refusait le Rayon +1 qui est le sien.
 *
 * ⚠ ET `modulesDebloques.ouvrage` NE SERT PAS ICI. Il majore les points de
 * recherche de 20 % sur une cible dont le module est débloqué — une autre
 * grandeur, dans l'autre sens. Voir `pointsRecherche`.
 */
function moduleActif(etat, e, p, nom) {
  const porte = e.camp === 'attaque' ? p.module : moduleDeDefense(e, p);
  if (porte !== nom) return false;
  const liste = etat.modulesDebloques?.[e.proprietaire];
  return Array.isArray(liste) && liste.includes(nom);
}

/**
 * La masse d'une entité pour l'écrasement — DOUBLÉE contre une escouade quand
 * l'Écraseur est acquis.
 *
 * ⚠⚠ CET EFFET EST NUL AVEC LES MASSES D'AUJOURD'HUI, ET C'EST NORMAL. Les
 * blindés valent 5, 10 ou 20 ; les escouades valent toutes 1. Un blindé écrase
 * déjà toute escouade, doublé ou non — aucun montage ne sépare les deux
 * comportements. La règle s'écrit quand même : elle mordra le jour où une
 * escouade prendra de la masse, et l'écrire plus tard demanderait de retrouver
 * la phrase d'Ethan. **Ne pas croire qu'un test la couvre.**
 */
function masseEffective(etat, e, p, po) {
  if (po.colonneMatrice !== 'escouade') return p.masse;
  return moduleActif(etat, e, p, 'ecraseur') ? p.masse * 2 : p.masse;
}

/** Le pourcentage des PV MAXIMAUX qu'une unité à Écraseur retire par tick. */
const ECRASEUR_PCT_PAR_TICK = 1;

/**
 * L'entité qu'une unité à Écraseur est en train de FORCER — ou `undefined`.
 *
 * ⚠ SUR LES PV MAXIMAUX, PAS SUR LES PV RESTANTS. Sur les restants, une
 * structure ne tomberait jamais : chaque tick n'en retire qu'un centième et il
 * en reste toujours. Sur les maximaux, **toute structure tombe en 10 s
 * exactement**, quelle que soit sa taille — c'est ce que dit la phrase d'Ethan
 * du 30/08, et c'est la seule lecture qui termine.
 *
 * ⚠ LES STRUCTURES SEULEMENT, PAS LES BÂTIMENTS. « Forcer les structures
 * défensives » : un mur, une herse, une tourelle. Les bâtiments de site sont du
 * butin, pas un obstacle, et rien ne les met en travers d'une colonne.
 *
 * ⚠ `degatsParcours` N'ENTRE PAS ICI. C'est une autre grandeur, en PV ABSOLUS,
 * toujours non câblée après ce lot. Ne pas la confondre avec les 10 %.
 */
function structureForcee(etat, e, p, occupation, caseDestination) {
  if (e.camp !== 'attaque' || !p.bloquant) return undefined;
  if (!moduleActif(etat, e, p, 'ecraseur')) return undefined;
  const indice = occupantDe(occupation, caseDestination, e.colonne);
  if (indice === undefined) return undefined;
  const occupante = etat.entites[indice];
  if (occupante.camp === e.camp || occupante.genre !== 'defense') return undefined;
  return occupante;
}

/**
 * L'entité peut-elle AVANCER ? Non dans deux cas, et deux seulement : elle est
 * sur la dernière rangée, ou sa case de destination est occupée par une entité
 * qu'elle ne peut pas écraser.
 *
 * Sur la dernière rangée il n'y a plus rien devant, et ramper dans sa propre
 * case ne compte pas comme progresser : seule l'aviation traversante franchit
 * le fond. Ailleurs, avancer à l'intérieur de sa case compte — elle progresse.
 *
 * Aucune vitesse n'atteignant 1000 milli-cases par tick (300 au plus, pour le
 * Frappeur), la case de destination ne saute jamais une rangée : depuis une
 * rangée avant la dernière, elle vaut toujours la rangée ou la suivante.
 */
function peutAvancer(etat, e, p, occupation, rangee, caseDestination) {
  if (rangee >= DERNIERE_RANGEE) return p.comportementAerien === 'traversant';
  if (caseDestination === rangee) return true;
  if (!p.bloquant) return true; // l'aviation ignore l'occupation
  const indiceOccupante = occupantDe(occupation, caseDestination, e.colonne);
  if (indiceOccupante === undefined) return true;
  const occupante = etat.entites[indiceOccupante];
  return peutEcraser(etat, e, p, occupante, profil(occupante));
}

/**
 * L'entité NUIT-ELLE ? Depuis le lot 3C, plus aucun balayage indépendant ne
 * répond à cette question : l'étape 4 y a déjà répondu, et `aTire` porte la
 * réponse. Une entité a tiré si et seulement si elle avait une cible active, à
 * portée, et des dégâts effectifs non nuls — c'est-à-dire exactement « elle
 * nuit ». L'ordre du tick garantit que l'étape 4 précède l'étape 7.
 *
 * ⚠ Le brief du lot 3C propose `e.cibleIndice !== null`. Ce serait trop
 * généreux : une entité CONSERVE sa cible précédente quand aucune n'est à
 * portée (règle du lot 2A), et une cible conservée hors de portée ferait croire
 * indéfiniment à l'unité qu'elle nuit — elle ne se replierait plus jamais.
 * `aTire` ajoute la seule condition qui manque, la portée, sans second balayage.
 *
 * MONOTONIE. Le prédicat de validité ne remonte jamais : en combat les PV du
 * tireur ne croissent pas, sa réserve ne croît pas, sa matrice est constante.
 * Une cible devenue invalide ne redevient donc jamais valide, et une unité ne
 * reprend jamais une cible abandonnée pour cette raison. C'est ce qui autorise
 * à ne mémoriser aucun état supplémentaire.
 */
function nuit(e) {
  return e.aTire;
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

    const rangee = caseDepuisMilli(e.rangeeMilli);
    let vitesse = p.vitesseMilli;
    const type = typeObstacleSur(obstacles, rangee, e.colonne);
    if (type !== undefined && obstacleConcerne(type, p.chassis)) {
      vitesse = p.vitesseObstacleMilli;
    }
    // BOOSTER — ×10 APRÈS la réduction d'obstacle, sur la valeur retenue.
    //
    // ⚠ APPLIQUÉ AVANT, UN OBSTACLE CESSERAIT DE RALENTIR UNE UNITÉ BOOSTÉE,
    // ce qu'aucune règle ne dit : 60 → 600 → 240 sous obstacle serait plus
    // rapide que la vitesse nominale. Ici c'est 24 → 240, le rapport est gardé.
    //
    // ⚠⚠ ET IL EXISTE UN INVARIANT NON ÉCRIT QUE CE ×10 FRÔLE — voir
    // `peutAvancer` : « aucune vitesse n'atteint 1 000 milli-cases par tick ».
    // Les deux porteurs du Booster sont des escouades à 60, donc 600, et
    // l'invariant tient. Il ne tient QUE PAR ACCIDENT : au Frappeur (240), 2 400
    // ferait sauter une rangée à la destination et `peutAvancer` laisserait
    // passer une unité À TRAVERS un mur, sans qu'aucun test n'échoue. Un test de
    // données garde ce seuil (`recherche.test.js`, MODULES-A T6).
    if (boosterActif(e)) vitesse *= BOOSTER_FACTEUR;

    const destinationMilli = e.rangeeMilli + vitesse;
    const caseDestination = caseDepuisMilli(destinationMilli);

    // Une unité arrêtée pour sa cible de prédilection ne PROGRESSE pas : elle a
    // choisi de combattre plutôt que d'avancer. Si son tir porte, `nuit` la
    // garde en jeu ; s'il ne porte pas, elle ne fait plus rien du tout — c'est
    // exactement le cas que le raid C exhibait.
    const arrete = doitSArreter(etat, e, p);
    const progresse = !arrete
      && peutAvancer(etat, e, p, occupation, rangee, caseDestination);

    // ÉCRASEUR — forcer la structure qui barre la colonne.
    //
    // ⚠ AVANT LE REPLI, ET AVANT LE `continue` DE L'ARRÊT. « En plus de ses
    // tirs ordinaires » : une unité arrêtée pour tirer sur le mur le force
    // AUSSI, et une unité qui force n'est pas inutile — sans ce calcul ici,
    // `TICKS_AVANT_REPLI` (30) la ferait rentrer à la base bien avant les
    // 100 ticks qu'il faut pour ouvrir la brèche.
    const forcee = progresse
      ? undefined
      : structureForcee(etat, e, p, occupation, caseDestination);
    if (forcee !== undefined) {
      const degats = Math.max(1, Math.floor((forcee.pvMaxMilli * ECRASEUR_PCT_PAR_TICK) / 100));
      forcee.pvMilli = Math.max(0, forcee.pvMilli - degats);
    }

    // REPLI. Une unité offensive qui ne peut ni avancer ni nuire pendant
    // TICKS_AVANT_REPLI ticks consécutifs rentre à la base : elle sort du champ
    // sans être détruite, et compte parmi les survivants. Le compteur se remet
    // à zéro dès qu'une des deux conditions cesse d'être vraie — un blocage est
    // souvent transitoire.
    if (progresse || nuit(e) || forcee !== undefined) {
      e.ticksInutiles = 0;
    } else {
      e.ticksInutiles += 1;
      if (e.ticksInutiles >= TICKS_AVANT_REPLI) {
        e.sorti = true;
        // Sa case se libère immédiatement : un allié derrière elle peut
        // repartir dès ce tick.
        retirer(occupation, rangee, e.colonne);
        continue;
      }
    }
    if (arrete) continue;

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
    if (peutEcraser(etat, e, p, occupante, po)) {
      occupante.pvMilli = 0;
      occupante.vivant = false;
      occupante.ecrase = true;
      retirer(occupation, caseDestination, e.colonne);
      retirer(occupation, rangee, e.colonne);
      poser(occupation, caseDestination, e.colonne, e.indice);
      e.rangeeMilli = destinationMilli;
    }
    // Masse égale ou inférieure : blocage, aucune avance. La structure forcée,
    // elle, a déjà encaissé ses 1 % plus haut : elle tombera, et l'unité
    // avancera au tick suivant — `retirerLesMorts` passe avant `deplacement`.
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
  declencherNeutralisations(etat); //            3 bis. flashbang et EMP
  const tampon = tir(etat); //                   4. tir, simultané
  appliquerDegats(etat, tampon); //              5. application du tampon
  retirerLesMorts(etat); //                      6. retrait des morts
  declencherBoosters(etat); //                   6 bis. réaction aux blessures
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
    niveau: e.niveau,
    rangee: caseDepuisMilli(e.rangeeMilli),
    colonne: e.colonne,
    pvMaxMilli: e.pvMaxMilli,
    pvMilli: e.pvMilli,
    pvPerdusMilli: e.pvMaxMilli - e.pvMilli,
    // ⚠ CE QUE CE RAID-CI A FAIT, distinct de ce que la pièce a perdu DEPUIS
    // SON PLEIN. Les deux coïncident sur un site intact, et divergent dès la
    // seconde passe.
    pvInitialMilli: e.pvInitialMilli,
    pvPerdusIciMilli: e.pvInitialMilli - e.pvMilli,
    detruit: !e.vivant,
    module: moduleDeDefense(e, profil(e)) ?? null,
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
 * Facteur d'échelle ÉCONOMIQUE d'un niveau. Deux régimes, penteBasse jusqu'à la
 * bascule et penteHaute au-delà. Vaut exactement 1 au niveau 1.
 *
 * ⚠ À NE PAS CONFONDRE AVEC `facteurMilli`, qui est la courbe de COMBAT. Les
 * deux ont porté les mêmes pentes jusqu'au 25/08/2026 ; elles divergent depuis
 * — le combat est descendu à une pente unique de 1,1, l'économie est restée à
 * 1,259/1,32. `test/generateur.test.js` T10 asserte que la divergence est bien
 * celle qu'on a voulue.
 *
 * Servent tous deux la courbe économique : le butin et les points de recherche.
 * @param {number} niveau
 * @returns {number} réel, 1 au niveau 1.
 */
export function facteurEconomique(niveau) {
  const bas = Math.min(niveau, BUTIN.niveauBascule) - 1;
  const haut = Math.max(niveau - BUTIN.niveauBascule, 0);
  return BUTIN.penteBasse ** bas * BUTIN.penteHaute ** haut;
}

/**
 * Le même, en MILLIÈMES et entier — la forme qu'exige un calcul en BigInt.
 * Vaut exactement 1000 au niveau 1, 480 941 681 au niveau 50.
 * @param {number} niveau
 * @returns {number} entier de millièmes.
 */
export function facteurEconomiqueMilli(niveau) {
  return Math.round(MILLE * facteurEconomique(niveau));
}

/**
 * Butin plein d'un bâtiment, avant proportionnalité aux dégâts.
 * butinPlein = ancrage × indice × penteBasse^(min(n,12)−1) × penteHaute^max(n−12,0)
 *
 * ⚠ L'ORDRE DES PRODUITS EST CELUI D'ORIGINE, à dessein : le passer par
 * `facteurEconomique` regrouperait autrement les flottants et déplacerait le
 * butin d'une unité sur les raids de référence. La multiplication flottante
 * n'est pas associative, et six tests mesurent ce butin au champ près.
 */
export function butinPlein(niveau, indice) {
  const bas = Math.min(niveau, BUTIN.niveauBascule) - 1;
  const haut = Math.max(niveau - BUTIN.niveauBascule, 0);
  return BUTIN.ancrageNiveau1 * indice * BUTIN.penteBasse ** bas * BUTIN.penteHaute ** haut;
}

/**
 * Butin d'un raid, proportionnel aux dégâts que CE raid a faits — et, si la
 * Souche est tombée, augmenté de tout ce qui était encore debout en arrivant.
 * Sur un site intact les deux règles coïncident avec les anciennes ; sur un site
 * entamé, elles empêchent de payer deux fois les mêmes dégâts.
 * @returns {{ quartz: number, scorie: number }} entiers.
 */
export function butin(resultat, montage) {
  const rase = resultat.cause === 'souche';
  let quartz = 0;
  let scorie = 0;
  for (const b of resultat.batiments) {
    const p = PROFILS_BATIMENT[b.id];
    // Le niveau du BÂTIMENT, plus celui du site : une base mêle deux niveaux
    // adjacents, et chacun paie le sien.
    const plein = butinPlein(b.niveau, p.indiceButin);
    // ⚠ « LIVRE CE QUI RESTE À LIVRER », ARBITRÉ PAR ETHAN LE 29/08. Un bâtiment
    // entamé à la passe précédente a DÉJÀ payé ce qu'on lui avait pris : il ne
    // le repaie pas. Le raid encaisse donc ce que LUI a fait — `pvPerdusIci` —,
    // et un rasage livre ce qui était encore debout en arrivant, pas le plein
    // nominal. Sur deux passes, la somme fait exactement la valeur du site ; la
    // règle d'avant la faisait dépasser de 16 % sur un rasage en deux temps, et
    // d'autant plus qu'on cassait avant le coup de grâce.
    //
    // ⚠ LE CAS INTACT EST TRAITÉ À PART, ET CE N'EST PAS UNE OPTIMISATION.
    // `plein × pvInitial / pvMax` vaut mathématiquement `plein` quand les deux
    // sont égaux, mais pas en flottant : le produit intermédiaire déplace le
    // dernier chiffre. Six tests mesurent ce butin AU CHAMP PRÈS sur des sites
    // intacts, et c'est cette ligne qui les laisse exacts.
    const intact = (b.pvInitialMilli ?? b.pvMaxMilli) >= b.pvMaxMilli;
    // ⚠ RECALCULÉ ICI, PAS LU DANS `pvPerdusIciMilli`. La ligne porte le champ,
    // mais il est FIGÉ à la construction du résultat : un appelant qui abîme une
    // ligne après coup — c'est ce que font les montages de test — le laisserait
    // à zéro et le butin tomberait à zéro sans rien dire. Deux soustractions ne
    // valent pas ce risque.
    const perduIci = b.pvInitialMilli === undefined
      ? b.pvPerdusMilli : b.pvInitialMilli - b.pvMilli;
    let gagne;
    if (rase) gagne = intact ? plein : (plein * b.pvInitialMilli) / b.pvMaxMilli;
    else gagne = (plein * perduIci) / b.pvMaxMilli;
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
  // ⚠ LE MULTIPLICATEUR DE TYPE, APPLIQUÉ EN DERNIER — et il ne l'était PAS
  // AVANT LE 29/08. `TYPES_SITE.avantPoste.multiplicateurButin` valait 3,25 dans
  // la table depuis le relevé de Tiberium Alliances, et personne ne le lisait :
  // un avant-poste rapportait donc autant qu'un camp de même niveau, et 10 % de
  // moins qu'une base, alors que son rôle déclaré est « revenu ». C'est ce qui
  // fait que le joueur préfère un avant-poste à une base, et sans lui la
  // géographie économique du jeu n'existait pas.
  //
  // ⚠ `null` VEUT DIRE « PAS DE MULTIPLICATEUR », PAS ZÉRO. Une base porte
  // `multiplicateurButin: null` — le tiret de la §10 de la spec —, et c'est un
  // facteur 1. Le lire comme un zéro rendrait toute base sans butin.
  //
  // ⚠ UN MONTAGE SANS `type` VAUT 1, et c'est ce qui laisse les raids de
  // référence exacts : les montages écrits à la main dans les tests n'en
  // portent pas, et `× 1` est exact en IEEE 754 — pas approché, exact.
  const facteurType = TYPES_SITE[montage.type]?.multiplicateurButin ?? 1;
  return {
    quartz: Math.floor(quartz * facteurType),
    scorie: Math.floor(scorie * facteurType),
  };
}

/**
 * Points de recherche d'un raid, en MILLI-POINTS, sous forme de **BigInt**.
 *
 * Ils se prennent sur les cibles défensives endommagées ; les bâtiments ne
 * rapportent rien. Casser des murs rapporte 2 : ce n'est pas une erreur, c'est
 * le point du modèle.
 *
 * ⚠ POURQUOI UN BigInt. Le barème double par niveau de cible quand tout le
 * reste croît en ×1,32 : `bareme × 1000 × 2^(niveau−1)` dépasse
 * Number.MAX_SAFE_INTEGER dès le niveau 39 pour le Broyeur. Un Number
 * deviendrait alors approximatif — un compteur de points ne peut pas l'être.
 * BigInt est exact quelle que soit la taille.
 *
 * ⚠ JSON.stringify LÈVE sur un BigInt. Il reste donc confiné à cette valeur de
 * retour : il n'entre ni dans l'état du combat, ni dans l'objet rendu par
 * resoudre — un test le verrouille. Toute écriture en sauvegarde passe par une
 * chaîne décimale, jamais par le nombre.
 *
 * @returns {bigint} milli-points exacts.
 */
export function pointsRecherche(resultat, montage) {
  const bonusMilli = BigInt(
    MILLE + enEntier(POINTS_RECHERCHE.bonusModuleDebloque, MILLE, 'bonusModuleDebloque'),
  );
  const neutre = BigInt(MILLE);
  const mille = BigInt(MILLE);
  const debloques = new Set(montage.modulesDebloques?.ouvrage ?? []);
  let total = 0n;
  for (const d of resultat.defenses) {
    const bareme = POINTS_RECHERCHE.parCible[d.id];
    if (bareme === undefined) continue;
    // ⚠ CE QUE CE RAID-CI A CASSÉ, PAS CE QUE LA CIBLE A PERDU DEPUIS SON PLEIN.
    // Même arbitrage que le butin, rendu par Ethan le 29/08 : « tu tapes une
    // défense à qui il reste cinquante pour cent, tu l'achèves, tu n'es pas
    // censé avoir le double ; tu as cinquante plus cinquante ». Lire
    // `pvPerdusMilli` faisait marquer 50 % à la première passe puis 100 % à la
    // seconde, soit 150 % pour une cible qui n'a qu'une vie. Sur un site intact
    // les deux quantités coïncident, donc les raids de référence ne bougent pas.
    //
    // ⚠ ET UNE CIBLE RÉPARÉE REMARQUE, c'est voulu et c'est la même phrase :
    // « sauf si elle est réparée ». Ses PV de départ sont revenus au plein, donc
    // la casser à nouveau est un travail à nouveau.
    const perduIci = d.pvInitialMilli === undefined
      ? d.pvPerdusMilli : d.pvInitialMilli - d.pvMilli;
    if (perduIci <= 0) continue;
    const facteur = d.module !== null && debloques.has(d.module) ? bonusMilli : neutre;
    // Niveau de la CIBLE, plus celui du site. La division BigInt tronque vers
    // zéro : sur des grandeurs positives, c'est exactement le plancher voulu.
    // Le facteur économique est en millièmes, d'où le MILLE au dénominateur ;
    // il est placé là, avec l'autre division, pour que TOUS les produits se
    // fassent avant la moindre troncature.
    total += (BigInt(bareme) * BigInt(facteurEconomiqueMilli(d.niveau)) * facteur
      * BigInt(perduIci)) / (BigInt(d.pvMaxMilli) * mille);
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
