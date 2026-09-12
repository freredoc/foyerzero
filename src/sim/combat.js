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
// ⚠⚠ LA SEULE DÉPENDANCE DE CE MOTEUR VERS LA BASE DU JOUEUR, ET ELLE EST
// ENTRÉE LE 02/09 AVEC LE LOT RAID-B. Jusque-là le moteur ne connaissait que
// les CINQ bâtiments de l'Ouvrage : monter un `chantierDeConstruction` levait
// « identifiant inconnu », ce que `CLAUDE.md` §6 annonçait déjà comme « le trou
// que le raid sur la base du joueur comblera ». Le jour est venu. L'import ne
// crée aucun cycle : `data/base.js` ne lit que `data/`.
import { BASE_BATIMENTS } from '../data/base.js';
import {
  PREMIERE_RANGEE,
  DERNIERE_RANGEE,
  PREMIERE_COLONNE,
  DERNIERE_COLONNE,
  RANGEE_APPROCHE,
  estEnApproche,
  enEntier,
  milliDepuisCase,
  caseDepuisMilli,
  distanceCarreeMilli,
  estDansLaGrille,
  estDansLaBande,
  bornesBande,
  estSortiParLeHaut,
  estSortiParLeCote,
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
  MILLI_PAR_CASE,
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
 * Rangée d'apparition par défaut d'une vague : **la voie d'approche, sous la
 * grille**. Une entrée de vague peut la surcharger (champ `rangee`), ce qui
 * permet de monter un état déjà entamé sans jouer les ticks d'approche.
 *
 * ⚠⚠ ELLE VALAIT `GRILLE.bandes.deploiement.derniere` — LA RANGÉE 2 — JUSQU'AU
 * 11/09, ET IL N'Y AVAIT DONC JAMAIS EU D'APPROCHE. La défense commence en
 * rangée 3 : une vague naissait collée à elle. Ethan : « elles arrivent très
 * vite, puis elles arrivent dans le tas, comme si elles avaient un boost de
 * vitesse », puis « qu'elles apparaissent en dessous hors écran, du coup en
 * rangée zéro, trois rangées avant la défense en gros ».
 *
 * ⚠⚠ ET LE « BOOST » ÉTAIT DE L'ARITHMÉTIQUE, PAS UNE IMPRESSION. Une rampe de
 * DESSIN — `render/arrivee.js`, retiré par ce lot — posait le sprite une case
 * plus bas et le rattrapait en `dureeDArrivee`, qui vaut exactement le temps de
 * franchir une case à ×1. Pendant cette fenêtre l'unité avançait VRAIMENT d'une
 * case et la rampe en rattrapait une autre : **le sprite parcourait deux cases
 * dans le temps d'une**, ×3 à la vitesse de déroulé ×2, ×5 à ×4. Le sprite est
 * désormais exactement là où l'unité est.
 *
 * ⚠ LE NOM NE CHANGE PAS. C'est lui que `src/ui/banc.js` documente et que les
 * montages citent ; le renommer aurait fait un lot de renommage par-dessus un
 * lot de comportement.
 */
export const RANGEE_APPARITION = RANGEE_APPROCHE;

/**
 * La première rangée AU-DELÀ de la défense — « a traversé la défense » vaut
 * l'avoir atteinte.
 *
 * ⚠⚠ LE SEUIL SE LIT DANS `GRILLE.bandes`, IL NE S'ÉCRIT JAMAIS `11`. La bande
 * de défense va des rangées 3 à 10 — les huit rangées d'Ethan, 08/09 : « a
 * traversé la défense = les huit rangées de défense franchies » — et la première
 * rangée des bâtiments est ce qui est au-delà. Un `11` en dur serait faux le
 * jour où une bande change d'un cran, et rien ne le dirait.
 */
export const RANGEE_DEFENSE_FRANCHIE = GRILLE.bandes.batiments.premiere;

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
    // ⚠ LES DEUX FORMES, ET LES DEUX SERVENT. Le carré est ce que compare
    // `distanceCarree` ; la forme LINÉAIRE est la seule sur laquelle un module
    // sait ajouter ou retirer une case. `porteeCarree + 1` n'ajouterait pas
    // une case, il ajouterait un millionième de case au carré.
    porteeMilli,
    porteeMiniMilli,
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
    porteeMilli,
    porteeMiniMilli,
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
    porteeMilli: 0,
    porteeMiniMilli: 0,
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

/**
 * Le profil de combat d'un bâtiment DU JOUEUR — les onze de `data/base.js`.
 *
 * ⚠⚠ IL N'EN EXISTE PAS DEUX VERSIONS : c'est `profilBatiment` qu'on appelle,
 * après avoir traduit la ligne du joueur dans le vocabulaire qu'il attend. Les
 * deux tables ne portent pas les mêmes clés — `BATIMENTS` a `indiceButin` et
 * `ressource`, `BASE_BATIMENTS` a `role`, `classeDeCout` et `plancherPv` — mais
 * ce que le PROFIL demande se réduit à quatre choses : les PV, l'indice de
 * butin, la ressource, et le drapeau de rasage. Écrire un second constructeur
 * aurait donné deux profils de bâtiment voisins dont un seul serait éprouvé, et
 * la première divergence se serait lue comme un bogue de combat.
 *
 * ⚠⚠ `indiceButin` ET `ressource` NE SONT JAMAIS LUS SUR UN BÂTIMENT DU JOUEUR,
 * ET C'EST MESURABLE. Leur unique lecteur est `butin`, qui verse à l'ATTAQUANT ;
 * quand l'Ouvrage attaque, le seul transfert de richesse est
 * `RAID_OUVRAGE.sanctionRasage.perteRessourcesStockees`, qui ne passe pas par
 * là. Leur donner un barème ici reviendrait donc à inventer un butin que rien
 * ne verse — et à figer, sous l'apparence d'une donnée relevée, un arbitrage
 * qu'Ethan n'a pas rendu. `indiceButin` vaut donc `null` et `ressource` un objet
 * VIDE : les deux font lever `butinPlein` au lieu de payer en silence si
 * quelqu'un appelait `butin` sur un combat de défense.
 *
 * ⚠ LE RASAGE, LUI, EST LU. `raseLeSite` est la clé que le résolveur teste pour
 * conclure `cause: 'souche'` ; `BASE_BATIMENTS.chantierDeConstruction` la porte
 * sous le MÊME nom que `BATIMENTS.souche`, ce qui rend cette ligne-ci muette sur
 * la règle. Le Chantier tombé rase la base du joueur exactement comme la Souche
 * rase un site de l'Ouvrage, sans qu'aucun code ne le redise.
 */
function profilBatimentJoueur(id, b) {
  return {
    ...profilBatiment(id, { pv: b.pv, indiceButin: null, ressource: {}, raseLeSite: b.raseLeSite }),
    id,
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
  // ⚠ LES ONZE DU JOUEUR DANS LA MÊME TABLE, ET AUCUNE CLÉ NE SE HEURTE —
  // mesuré : `souche`, `etai`, `noeud`, `gangue`, `terril` d'un côté,
  // `chantierDeConstruction`, `collecteurQuartz`, … de l'autre. Une table séparée
  // aurait obligé `TABLES_PROFIL` à porter un sixième genre, donc `profil(e)` à
  // choisir — et un bâtiment est un bâtiment, quel que soit son propriétaire.
  // Un test asserte l'absence de collision plutôt que de la supposer.
  for (const [id, b] of Object.entries(BASE_BATIMENTS)) {
    // ⚠ LA COLLISION SE CHERCHE DANS `BATIMENTS`, PAS DANS LA TABLE QU'ON
    // REMPLIT. `verifierArithmetique` est RÉEXÉCUTABLE — un test de
    // `grille.test.js` la rappelle —, et la table garde ce que le passage
    // précédent y a mis : se comparer à elle-même ferait lever au deuxième
    // appel, sur une collision de la clé avec ELLE-MÊME. Payé une fois.
    if (Object.prototype.hasOwnProperty.call(BATIMENTS, id)) {
      throw new Error(`combat : « ${id} » est à la fois un bâtiment de l'Ouvrage et du joueur`);
    }
    PROFILS_BATIMENT[id] = profilBatimentJoueur(id, b);
  }

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

/**
 * La même table, majorée d'un pourcentage ENTIER.
 *
 * ⚠ UN SEUL `floor`, SUR LE PRODUIT — la forme déjà écrite et déjà testée de la
 * majoration de PV du module `pvPlusVingt`. Arrondir avant de multiplier
 * perdrait jusqu'à une unité par colonne, à chaque niveau.
 *
 * ⚠ ZÉRO REND LA TABLE TELLE QUELLE, à l'objet près : sans ce court-circuit, une
 * entité sans POI verrait quand même passer ses quatre colonnes dans un `floor`
 * — sans changement de valeur, mais pour rien.
 */
function tableMajoree(table, pct) {
  if (table === null || pct === 0) return table;
  const sortie = {};
  for (const colonne of COLONNES_DEGATS) {
    sortie[colonne] = Math.floor((table[colonne] * (100 + pct)) / 100);
  }
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

/**
 * Une entité vivante, encore sur la grille, et pas embarquée.
 *
 * ⚠⚠ CETTE NÉGATION-LÀ FAIT CINQ COMPORTEMENTS D'UN COUP, ET IL FAUT SAVOIR
 * LESQUELS. `estActive` est lue par `construireOccupation` — un passager ne
 * prend donc aucune case et n'en bloque aucune —, par `ciblage` — personne ne le
 * vise —, par `tir` — il ne tire pas —, par `deplacement` — il n'avance pas — et
 * par `conditionsDeFin` — un raid ne se termine pas « attaquants » parce qu'il
 * ne reste que des passagers. Écrire cinq gardes séparées aurait été cinq
 * occasions d'en oublier une.
 *
 * ⚠ ET IL S'ENSUIT QU'UN PASSAGER NE PREND AUCUN DÉGÂT PENDANT LE TRAJET :
 * `appliquerDegats` le saute aussi. « Elle sort avec ses PV du départ » est donc
 * vrai sans une ligne de plus — Ethan, 08/09.
 */
function estActive(e) {
  return e.vivant && !e.sorti && !e.embarquee;
}

/**
 * La CASE de la colonne d'une entité.
 *
 * ⚠⚠ ELLE SE DEMANDE, ELLE NE SE STOCKE PAS — c'est exactement le motif de
 * `caseDepuisMilli(e.rangeeMilli)`, qui n'a jamais eu de champ `e.rangee` à
 * côté. Depuis le lot COLONNE l'entité ne porte plus qu'un `colonneMilli` ;
 * ranger la case à côté de lui ferait DEUX vérités pour une grandeur, et
 * l'occupation dérivée serait la première à diverger. Le coût est un `floor`.
 */
function caseColonne(e) {
  return caseDepuisMilli(e.colonneMilli);
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
/**
 * La case est-elle posable pour ce camp ? — lot APPROCHE, 11/09.
 *
 * ⚠⚠ L'OUVERTURE EST RÉSERVÉE AUX ATTAQUANTS, ET C'EST TOUT LE POINT. Seule une
 * vague entre par la voie d'approche ; un défenseur garde sa bande `defense` et
 * un bâtiment sa bande `batiments`, gardes qui ne bougent pas d'un caractère.
 * Sans ce test de camp, un montage pourrait poser un mur en rangée 0 et plus
 * rien ne le dirait.
 *
 * ⚠ ET CE N'EST PAS `estDansLaGrille` QUI S'ÉLARGIT : elle répond d'une
 * GÉOMÉTRIE que `render/portee.js` et `caseDepuisPixels` lisent, où une rangée 0
 * ferait désigner au doigt une case qui n'est pas à l'écran. Ce prédicat-ci
 * répond d'un DROIT DE SÉJOUR, il vit dans le moteur, et il compose l'autre.
 */
function posePermise(camp, rangee, colonne) {
  if (camp === 'attaque' && rangee === RANGEE_APPROCHE) {
    return Number.isInteger(colonne)
      && colonne >= PREMIERE_COLONNE && colonne <= DERNIERE_COLONNE;
  }
  return estDansLaGrille(rangee, colonne);
}

/**
 * Les bornes de rangée à NOMMER dans un refus de pose.
 *
 * ⚠ UN MESSAGE QUI MENT COÛTE UNE DEMI-SESSION À QUELQU'UN DANS SIX MOIS.
 * Celui-ci énumérait « rangées 1–18 » pour tout le monde ; il est devenu faux
 * pour un attaquant le jour où la voie d'approche s'est ouverte.
 */
function bornesDePose(camp) {
  const premiere = camp === 'attaque' ? RANGEE_APPROCHE : PREMIERE_RANGEE;
  return `rangées ${premiere}–${DERNIERE_RANGEE}`;
}

function ajouterEntite(
  etat, contexte,
  { camp, genre, id, rangee, colonne, pvMilli, reserve, niveau, proprietaire, embarquee },
  casesPrises, obstaclesIndex,
) {
  const p = TABLES_PROFIL[genre][id];
  const ou = `${contexte} « ${id} » en (${rangee}, ${colonne})`;

  if (!posePermise(camp, rangee, colonne)) {
    throw new Error(
      `combat : ${ou} est hors de la grille `
      + `(${bornesDePose(camp)}, colonnes 1–${GRILLE.largeur})`,
    );
  }
  if (typeObstacleSur(obstaclesIndex, rangee, colonne) !== undefined) {
    throw new Error(`combat : ${ou} est posée sur un obstacle`);
  }
  // ⚠ UN PASSAGER EST LE SEUL CAS LÉGITIME DE DEUX UNITÉS SUR UNE CASE, et
  // l'exemption ne va pas d'un pouce plus loin : il est monté SUR la case de son
  // porteur, il n'y occupe rien, et `estActive` le tient hors de l'occupation
  // dérivée. Sans cette exception, le montage lèverait sur la pièce même qu'il
  // vient de composer.
  if (casesPrises !== null && embarquee !== true) {
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
  const pvBaseMilli = (p.pvMaxMilli / MILLE) * facteur;

  // ⚠ LE PROPRIÉTAIRE SE CALCULE ICI, AVANT L'ENTITÉ. `moduleActif` en a besoin
  // pour trancher, la majoration de PV doit être connue avant de fixer les PV de
  // départ, et depuis le lot POI les DÉGÂTS en dépendent aussi. La même valeur
  // est reprise plus bas dans le littéral.
  const proprietaireEntite = proprietaire ?? (camp === 'attaque' ? 'joueur' : 'ouvrage');
  const commeEntite = { camp, proprietaire: proprietaireEntite };
  // ⚠ LES POI MAJORENT LES DÉGÂTS, PAS LE FRANCHISSEMENT. C'est le précédent
  // exact de la Munition spéciale : le franchissement des barrières passe par
  // `degatsDeFranchissement`, sa propre table en milli-PV et son propre barème.
  // Aucune ligne d'Ethan ne rattache les POI au franchissement — choix réversible
  // d'une ligne, dit comme tel au rapport du lot.
  const pctPoi = majorationPoi(etat, commeEntite, p);
  const degatsColonne = tableMajoree(tableALEchelle(p.degatsColonne, facteur), pctPoi);
  const franchissementColonne = tableALEchelle(p.franchissementColonne, facteur);
  // ⚠ UN SEUL `floor`, SUR LE PRODUIT — comme partout ailleurs dans ce moteur.
  const pvMaxMilli = moduleActif(etat, commeEntite, p, 'pvPlusVingt')
    ? Math.floor((pvBaseMilli * (100 + PV_PLUS_VINGT_PCT)) / 100)
    : pvBaseMilli;

  let pv = pvMaxMilli;
  if (pvMilli !== undefined) {
    // Forçage explicite, PRIORITAIRE sur l'échelle : c'est ce qui permet de
    // monter un état déjà entamé.
    //
    // ⚠⚠ ET LA BORNE EST CELLE D'AVANT LA MAJORATION. L'appelant compte en PV
    // NOMINAUX — `pvMaxDeLUnite` et `site-entame.js` ignorent tous deux les
    // modules —, si bien qu'un site plein se déclare à `pvBaseMilli`. Borner
    // sur le plafond MAJORÉ laisserait passer des PV que personne ne sait
    // produire ; borner l'entamé sur la base est ce qui le garde entamé.
    verifierEntierPositif(pvMilli, `${ou} — pvMilli`);
    if (pvMilli === 0 || pvMilli > pvBaseMilli) {
      throw new Error(`combat : ${ou} — pvMilli ${pvMilli} hors de 1…${pvBaseMilli}`);
    }
    // ⚠⚠ LES PV COURANTS NE MONTENT QUE SI LA PIÈCE EST MONTÉE PLEINE. Une
    // pièce entamée voit son PLAFOND monter, pas sa vie : la majorer soignerait
    // un site que le raid précédent a abîmé, et un joueur qui achète le module
    // réparerait toutes les garnisons de la carte d'un coup.
    pv = pvMilli === pvBaseMilli ? pvMaxMilli : pvMilli;
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
    proprietaire: proprietaireEntite,
    genre,
    id,
    // ⚠⚠ `colonneMilli`, ET PLUS `colonne` — LOT COLONNE, 06/09. La position
    // latérale est devenue CONTINUE pour la défense des deux camps, exactement
    // comme la position verticale l'est depuis le lot 2A. Une seule vérité par
    // grandeur : il n'y a PAS de champ `colonne` à côté qu'il faudrait tenir
    // synchronisé — la case se DEMANDE par `caseColonne(e)`, comme la rangée se
    // demande par `caseDepuisMilli(e.rangeeMilli)`. Un index dérivé stocké
    // serait la source de divergence que `construireOccupation` refuse déjà.
    colonneMilli: milliDepuisCase(colonne),
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
  // ⚠⚠ `embarquee` N'EST POSÉ QUE SUR UNE PASSAGÈRE, ET C'EST DÉLIBÉRÉ. Un champ
  // écrit sur TOUTES les entités entrerait dans `serialiserEtat`, donc dans
  // l'empreinte d'état des deux cents témoins de `test/temoins-combat.js` : les
  // deux cents rougiraient d'un coup, sur des montages où pas un seul passager
  // n'embarque. Le témoin ne se rafraîchit pas — « un témoin régénéré par la
  // même main que le code suivrait l'erreur qu'il devrait attraper » —, donc
  // c'est le CHAMP qui reste absent là où il n'a rien à dire. Il passe à `false`
  // au débarquement : sur les entités qui embarquent, il porte la vérité
  // courante et rien d'autre.
  if (embarquee === true) entite.embarquee = true;
  if (moduleActif(etat, entite, p, 'bouclier')) entite.bouclierMilli = pvMaxMilli;
  // ⚠⚠ EN MILLI-CASES, PUIS AU CARRÉ — jamais l'inverse. Une case vaut 1 000
  // milli, et `distanceCarree` compare des carrés de milli-cases : deux cases
  // voisines sont à 1 000 000. On ajoute donc la case AVANT d'élever au carré.
  //
  // ⚠ ET LE PLANCHER EST À ZÉRO, AVANT LE CARRÉ. Une portée minimale négative
  // repasserait positive en s'élevant au carré, et l'angle mort reviendrait
  // plus grand qu'il n'était.
  let porteeMilli = p.porteeMilli;
  let porteeMiniMilli = p.porteeMiniMilli;
  if (moduleActif(etat, entite, p, 'rayonPlusUn')) porteeMilli += MILLI_PAR_CASE;
  if (moduleActif(etat, entite, p, 'rayonMiniMoinsUn')) {
    porteeMiniMilli = Math.max(0, porteeMiniMilli - MILLI_PAR_CASE);
  }
  entite.porteeCarree = porteeMilli * porteeMilli;
  entite.porteeMiniCarree = porteeMiniMilli * porteeMiniMilli;
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
    // ⚠⚠ LE JOURNAL EST POSÉ AVANT LA MOINDRE ENTITÉ, parce que la première
    // vague apparaît DANS cette fonction — voir sa dernière ligne. Un journal
    // créé après serait vide au moment où l'appelant le lit, et l'entrée en
    // scène de la vague 1 ne sonnerait jamais.
    //
    // ⚠ ET LE JOURNAL DE LA CRÉATION EST CELUI DU « TICK 0 » : `tick()` le vide
    // à son entrée, donc il vit exactement le temps qu'un journal de tick vit.
    journal: journalVide(),
    // Combien de vagues sont DÉJÀ entrées. Un compteur, pas une liste : il ne
    // sert qu'à numéroter le fait de journal, et `vagues` ne fait que diminuer.
    vaguesPosees: 0,
    modulesDebloques: {
      ouvrage: modulesDunProprietaire(montage.modulesDebloques?.ouvrage, 'ouvrage'),
      joueur: modulesDunProprietaire(montage.modulesDebloques?.joueur, 'joueur'),
    },
    // ⚠⚠ LES POI ENTRENT PAR LE MONTAGE, JAMAIS PAR L'ÉTAT DE JEU LU AU VOL —
    // exactement comme les modules, et pour la même raison écrite dans
    // `executerRaid` : le combat est déterministe et rejouable, donc tout ce qui
    // gouverne la boucle doit être dans le montage, qui est sérialisé.
    //
    // ⚠ ET IL EST POSÉ AVANT LA MOINDRE ENTITÉ. `ajouterEntite` le lit pour
    // majorer les dégâts ; le remplir après monterait toutes les entités sans
    // bonus, et rien ne le dirait.
    majorationsPoi: {
      ouvrage: majorationsDunProprietaire(montage.majorationsPoi?.ouvrage, 'ouvrage'),
      joueur: majorationsDunProprietaire(montage.majorationsPoi?.joueur, 'joueur'),
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
      // ⚠ LA SECONDE DES DEUX VALIDATIONS, ET IL FAUT LES DEUX : celle-ci juge
      // les vagues 2 à 4 que `creerCombat` ne pose pas encore, `ajouterEntite`
      // juge ce qui entre pour de bon. Une seule des deux ouverte laisserait la
      // vague 1 passer et les suivantes lever au tick de leur apparition.
      if (!posePermise('attaque', rangee, u.colonne)) {
        throw new Error(
          `combat : ${ou} est hors de la grille `
          + `(${bornesDePose('attaque')}, colonnes 1–${GRILLE.largeur})`,
        );
      }
      if (typeObstacleSur(obstaclesIndex, rangee, u.colonne) !== undefined) {
        throw new Error(`combat : ${ou} est posée sur un obstacle`);
      }
      // ⚠⚠ UNE PASSAGÈRE DOIT SUIVRE IMMÉDIATEMENT SON PORTEUR, ET C'EST LE
      // MONTAGE QUI LE GARANTIT. Tout le reste en dépend : `apparitionDeVague`
      // la fait entrer avec la descripteure qui la précède, et `indices` de
      // `composerLesVagues` compte sur cet ordre-là pour apparier les dégâts.
      // Un montage qui l'ouvrirait en tête de vague, ou après une autre
      // passagère, donnerait un passager sans porteur — et le report des dégâts
      // tomberait d'un cran sans qu'aucun message ne le dise.
      if (u.embarquee === true && (descripteurs.length === 0
        || descripteurs[descripteurs.length - 1].embarquee === true)) {
        throw new Error(`combat : ${ou} est embarquée et ne suit aucun porteur`);
      }
      const cle = cleCase(rangee, u.colonne);
      // ⚠ ET ELLE NE PREND PAS DE CASE : c'est le seul cas légitime de deux
      // unités sur une case, et il ne s'étend pas d'un pouce.
      if (u.embarquee !== true) {
        if (cases.has(cle)) {
          throw new Error(`combat : ${ou} occupe la même case que « ${cases.get(cle)} »`);
        }
        cases.set(cle, u.id);
      }
      descripteurs.push({
        id: u.id,
        colonne: u.colonne,
        rangee,
        pvMilli: u.pvMilli,
        reserve: u.reserve,
        niveau: u.niveau,
        // ⚠ `u.embarquee` TEL QUEL, JAMAIS `u.embarquee === true`. Il vaut
        // `undefined` pour toute unité ordinaire — comme `pvMilli` et `reserve`
        // juste au-dessus —, et `JSON.stringify` laisse tomber une clé
        // `undefined` : les descripteures d'un montage sans passager rendent
        // donc les MÊMES octets qu'avant ce lot. Écrire `false` ferait rougir
        // les deux cents témoins par `etat.vagues` et `etat.enAttente`.
        embarquee: u.embarquee,
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
    poser(occupation, caseDepuisMilli(e.rangeeMilli), caseColonne(e), e.indice);
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
// Le journal du tick — une SORTIE, jamais une entrée
// ---------------------------------------------------------------------------
//
// ⚠⚠ LE MOTEUR CALCULAIT DÉJÀ TOUT CELA, ET IL LE JETAIT. `tir` construit un
// tampon de tous les coups du tick et le détruit en sortant ; `retirerLesMorts`
// bascule `vivant` sans dire quand ; `apparitionDeVague` fait entrer une vague
// sans dire laquelle. Ce lot ne calcule RIEN de neuf — il cesse de jeter. C'est
// ce qui rend l'additivité démontrable : aucune décision nouvelle, aucun tirage
// nouveau, aucune phase déplacée.
//
// ⚠⚠ ET IL NE S'ACCUMULE PAS. `resoudre` boucle jusqu'à 900 ticks d'affilée et
// l'écran de raid en résout autant en une image sous « Instantané » : un journal
// qui empilerait produirait des dizaines de milliers d'objets avant le premier
// dessin. Il est VIDÉ à l'entrée de chaque tick, exactement comme le tampon de
// `tir` l'était déjà — sa durée de vie est celle d'un tick, et un test le mesure
// sur un combat complet plutôt que de le supposer.
//
// ⚠⚠ IL NE PORTE AUCUN NOM DE SON, ET C'EST LA FRONTIÈRE DU DÉPÔT. Il publie
// des FAITS — qui, quoi, où, combien —, et `src/son/cablage.js` seul les traduit
// en événements du pack. La garde « aucun module de `src/sim/` n'importe le
// son » reste verte, et le même canal servira les effets visuels du raid : il ne
// se construit pas deux fois.
//
// ⚠ LES FAITS SONT DES COPIES, JAMAIS DES RÉFÉRENCES. `faitDeLEntite` compose un
// objet neuf de primitives : un lecteur qui muterait ce qu'on lui rend ne peut
// pas atteindre l'état. C'est la seule façon dont ce journal pourrait changer un
// résultat, et elle est fermée ici.

/**
 * Le journal d'un tick, vide. SIX listes, et rien qui vive plus d'un tick.
 *
 * ⚠⚠ LE SIXIÈME CANAL ENTRE AU LOT NEUTRALISATION, 08/09/2026, ET IL NE COÛTE
 * RIEN À LA SAUVEGARDE. `etat.journal` est remis à zéro en TÊTE de `tick`,
 * étape 0 : il ne traverse ni `serialiser` ni une migration, et `SAVE_VERSION`
 * ne bouge pas. C'est la même raison qui rend les deux cents témoins de combat
 * insensibles à cette ligne — leur empreinte d'état écarte `journal`.
 */
function journalVide() {
  return {
    apparitions: [], vagues: [], tirs: [], impacts: [], destructions: [],
    neutralisations: [],
  };
}

/**
 * L'identité et la place d'une entité, en primitives copiées.
 *
 * ⚠ `proprietaire` ET NON `camp`. Le camp dit un côté de la grille, le
 * propriétaire dit à qui la pièce appartient — et les sons se choisissent sur le
 * PROPRIÉTAIRE : `weapon_player_*` contre `weapon_ouvrage_*`. Prendre le camp
 * ferait sonner en Ouvrage les Cuirassiers que le joueur met en garnison, le
 * jour où sa base est attaquée. Une garde le mesure des deux côtés.
 */
function faitDeLEntite(e) {
  return {
    indice: e.indice,
    id: e.id,
    genre: e.genre,
    proprietaire: e.proprietaire,
    rangee: caseDepuisMilli(e.rangeeMilli),
    colonne: caseColonne(e),
  };
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
    const vague = etat.vagues.shift();
    // ⚠ LE NUMÉRO SE COMPTE SUR CE QUI RESTE, pas sur un compteur de plus dans
    // l'état : `vagues` ne fait que diminuer, et `VAGUES_MAX` borne le montage.
    etat.journal.vagues.push({
      numero: etat.vaguesPosees + 1,
      effectif: vague.length,
      proprietaire: etat.proprietaireAttaque,
    });
    etat.vaguesPosees += 1;
    etat.enAttente.push(...vague);
  }
  if (etat.enAttente.length === 0) return;

  const occupation = construireOccupation(etat);
  const restants = [];
  // La dernière entité entrée qui puisse porter quelqu'un, et le fait que la
  // descripteure d'avant soit restée en attente.
  //
  // ⚠⚠ UNE PASSAGÈRE ENTRE AVEC SON PORTEUR, OU PAS DU TOUT, ET C'EST CE QUI
  // GARDE L'APPARIEMENT DES DÉGÂTS. `construireResultat` rend les attaquants
  // dans l'ORDRE D'INSERTION ; `composerLesVagues` a rangé la passagère juste
  // derrière son porteur dans `indices`. Une passagère qui entrerait pendant que
  // son porteur attend une case libre s'insérerait AVANT lui, et le raid
  // reporterait les dégâts d'un cran de travers, en silence. Elle n'a par
  // ailleurs aucune case à prendre : la sienne est celle du porteur.
  let porteur = null;
  let precedenteRetenue = false;
  for (const d of etat.enAttente) {
    const p = PROFILS_UNITE[d.id];
    const embarquee = d.embarquee === true;
    const libre = embarquee
      ? !precedenteRetenue
      : (!p.bloquant || occupantDe(occupation, d.rangee, d.colonne) === undefined);
    if (!libre) {
      restants.push(d);
      precedenteRetenue = true;
      continue;
    }
    precedenteRetenue = false;
    const entite = ajouterEntite(
      etat,
      'attaquant',
      { ...d, camp: 'attaque', genre: 'unite', proprietaire: etat.proprietaireAttaque },
      casesPrises ?? null,
      obtenirIndexObstacles(etat),
    );
    if (embarquee) {
      // ⚠ LE LIEN SE POSE ICI, ET IL SE LIT DE L'ORDRE D'ENTRÉE. `creerCombat`
      // refuse déjà un montage où une passagère ne suit pas un porteur : ce
      // `porteur` ne peut donc pas être nul, et le débarquement a l'ancrage
      // qu'il lui faut — la position du porteur, morte ou vive.
      entite.porteurIndice = porteur.indice;
      continue;
    }
    porteur = entite;
    if (p.bloquant) poser(occupation, d.rangee, d.colonne, entite.indice);
    // ⚠ L'APPARITION EST UN FAIT DU MOTEUR, PAS UN DIFF. Une unité qui reste en
    // attente faute de case libre n'apparaît pas — elle sera journalisée le tick
    // où elle entre vraiment, et jamais deux fois.
    //
    // ⚠ ET UNE PASSAGÈRE N'APPARAÎT PAS AU MONTAGE : elle est présente et pas
    // encore là. Elle entre au journal le tick où elle DÉBARQUE, une seule fois,
    // par le même canal qu'une vague.
    etat.journal.apparitions.push(faitDeLEntite(entite));
  }
  etat.enAttente = restants;
}

/** La majoration de la Munition spéciale, en pour-cent du tir nu. */
const MUNITION_PCT = 120;

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
function degatsContre(etat, e, p, cible) {
  const pc = profil(cible);
  if (pc.genre === 'batiment' && e.camp === 'attaque' && e.reserve <= 0) return 0;
  const degats = degatsDUnTir(e.degatsColonne[pc.colonneMatrice], e.pvMilli, e.pvMaxMilli);
  // MUNITION SPÉCIALE — « +0,2 sur la matrice de la cible de prédilection ».
  //
  // ⚠ IL N'Y A PLUS DE MATRICE, ET L'ÉQUIVALENCE EST DÉJÀ ÉTABLIE. Le lot 4A a
  // supprimé les facteurs bornés à 0…1000 ; `colonneDominante` note, deux cents
  // lignes plus haut, qu'elle « remplace le facteur de matrice égal à 1,0 » et
  // que les deux lectures coïncident sur les 23 profils. Porter ce facteur de
  // 1,0 à 1,2, c'est donc majorer de 20 % les dégâts portés dans la colonne de
  // PRÉDILECTION, et rien d'autre : les autres colonnes ne bougent pas. Le
  // module n'ouvre pas la pièce, il aiguise ce qu'elle fait déjà le mieux.
  //
  // ⚠⚠ ICI ET PAS DANS `tir`. Le tir appelle `degatsContre` DEUX fois — une
  // pour sa cible, une par voisine du Tir de barrage — et le ciblage l'appelle
  // en prédicat de validité. Majorer dans `tir` ne toucherait que la première.
  // Le barrage en profite donc sans qu'une ligne l'y branche ; aucune des trois
  // porteuses (Casemate, Batterie, Créneau) ne porte le barrage, le cas reste
  // théorique, et un test le fige.
  //
  // ⚠ LE FRANCHISSEMENT DES BARRIÈRES N'EST PAS CONCERNÉ : il passe par
  // `degatsDeFranchissement`, sa propre table en milli-PV et son propre barème.
  // Aucune ligne d'Ethan ne l'y rattache.
  //
  // ⚠ `colonnePredilection` VAUT `null` pour une entité qui ne tire pas — la
  // comparaison est donc écrite dans ce sens, jamais `p.colonnePredilection ===
  // pc.colonneMatrice` seul, qui serait vrai si les deux valaient `null`.
  if (p.colonnePredilection === null) return degats;
  if (pc.colonneMatrice !== p.colonnePredilection) return degats;
  if (!moduleActif(etat, e, p, 'munitionSpeciale')) return degats;
  // Un seul `floor`, sur le produit, comme partout ailleurs dans ce moteur.
  return Math.floor((degats * MUNITION_PCT) / 100);
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
        const d2 = distanceCarreeMilli(
          e.rangeeMilli, e.colonneMilli, c.rangeeMilli, c.colonneMilli,
        );
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
    // ⚠⚠ LE VERROU DE LA VOIE D'APPROCHE — ETHAN, 11/09 : « elles peuvent
    // engager le combat dès qu'elles sont VISIBLES ». Hors grille, une unité ne
    // tire pas ; deux lignes plus bas, elle n'est pas tirable non plus. Elle
    // entre au combat en atteignant la rangée 1, et le seuil est le même des
    // deux côtés parce que c'est le même prédicat.
    //
    // ⚠⚠ ET IL EST DANS `ciblage`, PAS DANS `estActive`, MÊME SI C'ÉTAIT
    // TENTANT. `estActive` est lue par `construireOccupation`, `ciblage`, `tir`,
    // `deplacement`, `appliquerDegats` et `conditionsDeFin` — c'est écrit dans
    // son propre commentaire. L'approche y ferait D'UN COUP trois choses qu'on
    // ne veut pas : l'unité n'AVANCERAIT plus (elle resterait en rangée 0 pour
    // toujours), elle ne BLOQUERAIT plus (donc plus de file hors écran, et deux
    // unités sur une case), et un raid où il ne resterait que des approchantes
    // se TERMINERAIT « attaquants éliminés ». `ciblage` est la seule étape qui
    // décide de qui touche qui.
    //
    // ⚠ ET LA BRANCHE DE CIBLE CONSERVÉE N'A RIEN À RECEVOIR : aucune entité ne
    // redescend sous la rangée 1 — le repli fait `sorti = true`, il ne fait pas
    // marche arrière. Une condition de plus y serait une condition qu'on croit
    // lue.
    if (estEnApproche(e.rangeeMilli)) {
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
      // ⚠⚠ L'AUTRE MOITIÉ DU VERROU, ET ELLE N'EST PAS VACUEUSE — MESURÉ AVANT
      // D'ÉCRIRE UNE LIGNE. Première intuition : « rien ne porte à trois cases,
      // la garde sera morte ». **Faux.** Les trois artilleries — Faucheuse,
      // Mortier, Harpon — portent à 5,5 avec un mini de 3,5 : posée en rangée 4
      // ou 5, une artillerie est à distance 4 ou 5 de la rangée 0, donc DANS sa
      // fourchette. Sans cette ligne, elle tirerait dans la voie d'approche et
      // tuerait hors écran. Et le module `rayonMiniMoinsUn`, que les trois
      // portent des deux camps, ramène le mini à 2,5 : depuis la rangée 3 aussi.
      if (estEnApproche(c.rangeeMilli)) continue;
      if (masque !== null && masque.has(c.indice)) continue;
      const d2 = distanceCarreeMilli(
        e.rangeeMilli, e.colonneMilli, c.rangeeMilli, c.colonneMilli,
      );
      if (d2 > e.porteeCarree || d2 < e.porteeMiniCarree) continue;
      // UNE CIBLE VALIDE EST UNE CIBLE QU'ON PEUT BLESSER. Sans cette ligne, une
      // Batterie de matrice {0, 0, 1} passe le raid à viser l'infanterie qui la
      // serre de plus près, et toute la couche anti-aérienne est inerte.
      if (degatsContre(etat, e, p, c) === 0) continue;
      if (
        meilleur === null
        || d2 < meilleureDistance
        || (d2 === meilleureDistance && c.colonneMilli < meilleureColonne)
        || (d2 === meilleureDistance && c.colonneMilli === meilleureColonne
            && c.rangeeMilli < meilleureRangee)
      ) {
        meilleur = c.indice;
        meilleureDistance = d2;
        meilleureColonne = c.colonneMilli;
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
      if (!estActive(ancienne) || degatsContre(etat, e, p, ancienne) === 0
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

/**
 * PV +20 % — « les PV du bâtiment de défense sont augmentés de 20 % ».
 *
 * ⚠ IL S'APPLIQUE AU MONTAGE, PAS AU TICK. Le plafond de PV d'une entité ne
 * change jamais en cours de combat ; le poser une fois est aussi la seule façon
 * d'en tenir compte dans les PV de départ.
 */
const PV_PLUS_VINGT_PCT = 20;

/** 5 s à 10 Hz, et la pénalité par niveau d'écart, en pour cent. */
const NEUTRALISATION_TICKS = 50;
const NEUTRALISATION_PENALITE_PCT = 20;

/**
 * L'entité est-elle désactivée en ce moment ?
 *
 * ⚠⚠ EXPORTÉE AU LOT NEUTRALISATION, 08/09/2026, ET `render/scene.js` L'APPELLE
 * — il ne la réécrit pas. Retester `effetsTemporises` à la main dans le rendu
 * ferait DEUX vérités pour une question, et c'est le rendu qui divergerait le
 * jour où l'effet changerait de nom, sans que rien ne le dise. La couche est
 * admise : `render/scene.js` importe déjà `sim/rendu-pose.js` et `sim/grille.js`,
 * et `combat.js` n'importe rien de `render/` — il n'y a donc pas de cycle.
 */
export function estNeutralisee(e) {
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
 *
 * ⚠⚠ UNE CIBLE DÉJÀ NEUTRALISÉE EST SAUTÉE ICI, ET PAS DANS LE DÉCLENCHEUR —
 * lot NEUTRALISATION, 08/09/2026. Ethan, sur le doublon : « c'est pareil », à
 * résoudre. Le filtre est dans la RECHERCHE parce que c'est la seule position
 * qui laisse le porteur en viser une AUTRE : mis dans
 * `declencherNeutralisations`, un porteur dont la plus proche est déjà marquée
 * passerait son tour alors qu'une seconde cible l'attend deux cases plus loin.
 * Et s'il n'en trouve aucune, `cible === null` — donc il ne consomme pas son
 * usage et retentera au tick suivant, exactement comme le fait déjà la garde
 * « une durée nulle ne consomme pas l'usage » quelques lignes plus bas. Les deux
 * doivent se comporter pareil ; `NEUT T3` et `NEUT T4` les mesurent ensemble.
 */
function cibleDeNeutralisation(etat, e, p, colonneVisee) {
  let meilleur = null;
  let meilleureDistance = 0;
  let meilleureColonne = 0;
  let meilleureRangee = 0;
  for (const c of etat.entites) {
    if (c.camp === e.camp || !estActive(c)) continue;
    if (estNeutralisee(c)) continue;
    if (profil(c).colonneMatrice !== colonneVisee) continue;
    const d2 = distanceCarreeMilli(
      e.rangeeMilli, e.colonneMilli, c.rangeeMilli, c.colonneMilli,
    );
    if (d2 > e.porteeCarree || d2 < e.porteeMiniCarree) continue;
    if (
      meilleur === null
      || d2 < meilleureDistance
      || (d2 === meilleureDistance && c.colonneMilli < meilleureColonne)
      || (d2 === meilleureDistance && c.colonneMilli === meilleureColonne
          && c.rangeeMilli < meilleureRangee)
    ) {
      meilleur = c;
      meilleureDistance = d2;
      meilleureColonne = c.colonneMilli;
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
 *
 * ⚠⚠ LA BOUCLE BALAIE LES DEUX CAMPS DEPUIS LE LOT NEUTRALISATION, 08/09/2026.
 * Ethan : « la ligne défense, il faut l'implanter. » Elle portait
 * `e.camp !== 'attaque'` depuis MODULES-B, si bien que les quatre lignes de
 * défense du Flashbang et de l'EMP étaient EN VENTE et inertes. Le module se lit
 * désormais par `moduleDuCamp` — voir le paragraphe de cette fonction-là, c'est
 * elle qui empêche la moitié qui marche de masquer l'autre.
 *
 * ⚠⚠ ET UN PORTEUR NEUTRALISÉ GARDE LE DROIT DE DÉCLENCHER SON MODULE. La garde
 * `estNeutralisee` est dans `tir`, elle n'entre PAS ici, et c'est une DÉCISION,
 * pas un reste : Ethan, 08/09, sur ce point exact — « non, on s'en fiche
 * justement, ça c'est bien. Il faut le garder comme ça. » Jusqu'à ce lot le cas
 * était inatteignable, aucun défenseur ne neutralisant personne ; il devient
 * atteignable à la ligne du dessus, donc il s'écrit. Deux porteurs adverses qui
 * se voient se neutralisent mutuellement au même tick — la simultanéité
 * normative du moteur —, et `NEUT T7` l'asserte pour qu'on ne la « corrige » pas
 * un jour en croyant réparer un oubli.
 */
function declencherNeutralisations(etat) {
  for (const e of etat.entites) {
    if (!estActive(e)) continue;
    const p = profil(e);
    const porte = moduleDuCamp(e, p);
    const colonneVisee = NEUTRALISATION[porte];
    if (colonneVisee === undefined) continue;
    if (e.modulesActifs.includes(porte)) continue;
    if (!moduleActif(etat, e, p, porte)) continue;
    const cible = cibleDeNeutralisation(etat, e, p, colonneVisee);
    if (cible === null) continue;
    const ticks = ticksDeNeutralisation(e, cible);
    if (ticks === 0) continue;
    cible.effetsTemporises.push({ nom: 'neutralise', finTick: etat.tick + ticks });
    // ⚠ APRÈS LA GARDE `ticks === 0`, JAMAIS AVANT. Une neutralisation de durée
    // nulle n'a pas lieu — le porteur ne consomme même pas son usage : la
    // journaliser ferait clignoter un cadre pour rien.
    // ⚠ `faitDeLEntite` PORTE DÉJÀ `proprietaire`, donc le canal dit de quel
    // côté est la neutralisée sans qu'on ajoute un champ — ce qui servira le
    // jour où un son de brouillage entrera au catalogue.
    etat.journal.neutralisations.push({
      ...faitDeLEntite(cible), porteur: e.indice, ticks,
    });
    e.modulesActifs.push(porte);
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
    if (Math.abs(caseColonne(v) - caseColonne(cible)) > 1) continue;
    // Un seul `floor`, sur le produit — comme partout ailleurs dans ce moteur.
    const degats = Math.floor((degatsContre(etat, e, p, v) * BARRAGE_PCT) / 100);
    if (degats > 0) ajouter(v.indice, degats, e.indice);
  }
}

/**
 * 4. Tir. Les dégâts sont calculés sur l'état de DÉBUT de tick et accumulés
 * dans un tampon : le tir est simultané, l'ordre d'itération ne peut pas
 * influer. Le franchissement des barrières est compté ici, du même tampon.
 *
 * ⚠ LE TAMPON GARDE LA TRACE DU TIREUR, et pas seulement le total. Le Vol de
 * vie rend au TIREUR une part de ce que la cible a ENCAISSÉ ; un total anonyme
 * par cible ne dit pas à qui rendre. Chaque coup est donc rangé à part. Le
 * total par cible reste la somme des coups, dans l'ordre d'insertion, qui suit
 * `etat.entites` : la somme est exacte, entière, et l'ordre ne peut pas varier.
 *
 * @returns {Map<number, Array<{tireur: number, degats: number}>>} indice de
 *   cible → les coups qu'elle prend ce tick, en milli-PV.
 */
function tir(etat) {
  const tampon = new Map();
  const ajouter = (indice, degats, tireur) => {
    const coups = tampon.get(indice);
    if (coups === undefined) tampon.set(indice, [{ tireur, degats }]);
    else coups.push({ tireur, degats });
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
    const d2 = distanceCarreeMilli(
      e.rangeeMilli, e.colonneMilli, cible.rangeeMilli, cible.colonneMilli,
    );
    if (d2 > e.porteeCarree || d2 < e.porteeMiniCarree) continue;
    // Le MÊME prédicat que le ciblage — dont la réserve : le plancher porte sur
    // la nature de la cible, jamais sur la position du tireur (brief 2A §8). Sur
    // un bâtiment la réserve descend jusqu'à 0 et l'unité vidée ne tire plus ;
    // sur une entité de la défense elle s'arrête au plancher et le tir continue.
    // Depuis le lot 3C le ciblage a déjà écarté les cibles à zéro dégât : ce
    // test ne peut plus mordre, et il vaut comme énoncé de l'invariant.
    const degats = degatsContre(etat, e, p, cible);
    if (degats === 0) continue;
    ajouter(e.cibleIndice, degats, e.indice);
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
    barrieres.set(cleCase(caseDepuisMilli(b.rangeeMilli), caseColonne(b)), b);
  }
  if (barrieres.size > 0) {
    for (const e of etat.entites) {
      if (!estActive(e) || e.camp !== 'attaque') continue;
      const b = barrieres.get(cleCase(caseDepuisMilli(e.rangeeMilli), caseColonne(e)));
      if (b === undefined) continue;
      // ⚠ LE TIREUR EST LA BARRIÈRE. Le franchissement passe par le même
      // tampon que les tirs ; sans indice, cette ligne serait la seule sans
      // origine et le Vol de vie devrait la traiter à part. Aucune barrière ne
      // porte le module aujourd'hui — la ligne est correcte, pas seulement
      // commode.
      ajouter(
        e.indice,
        degatsDeFranchissement(
          b.franchissementColonne[profil(e).colonneMatrice],
          b.pvMilli,
          b.pvMaxMilli,
        ),
        b.indice,
      );
    }
  }

  // JOURNAL — un tir par TIREUR, relevé APRÈS coup et jamais au fil de la
  // boucle.
  //
  // ⚠⚠ UNE SECONDE PASSE, ET C'EST DÉLIBÉRÉ. Écrire le fait dans la boucle
  // ci-dessus l'entrelacerait avec les `continue` qui décident QUI tire ; ici il
  // ne reste qu'à lire `aTire`, que la boucle vient de poser et que rien d'autre
  // ne touche avant l'étape 8. Aucune décision n'est prise deux fois, et l'ordre
  // des faits est celui de `etat.entites`, qui ne varie pas.
  //
  // ⚠ LE BARRAGE N'EST PAS UN SECOND TIR, et le franchissement n'en est pas un
  // du tout — `consommerReserve` compte déjà un tir par tireur, et le moteur le
  // dit en toutes lettres. Le journal compte comme la réserve.
  for (const e of etat.entites) {
    if (!e.aTire) continue;
    const cible = etat.entites[e.cibleIndice];
    etat.journal.tirs.push({
      ...faitDeLEntite(e),
      cibleIndice: cible.indice,
      cibleRangee: caseDepuisMilli(cible.rangeeMilli),
      cibleColonne: caseColonne(cible),
    });
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

/** Le Vol de vie, en pour-cent de ce que la cible a ENCAISSÉ. */
const VOL_PCT = 20;

/**
 * 5. Application du tampon. Le seul plancher de PV est 0 : toute entité,
 * défense comprise, se détruit à 0 et sort de la grille. Le plancher de 1 %
 * de la spec §2 est un plancher d'APRÈS-RAID, écrit par le lot 2B ; le moteur
 * rapporte les PV bruts et ne plafonne rien.
 *
 * ⚠⚠ DEUX PASSES, ET L'ORDRE EST TOUT L'ENJEU. La passe 1 retire les PV de
 * TOUTES les cibles ; la passe 2 seulement rend les PV volés. Soigner au fil de
 * la passe 1 ferait dépendre le résultat de l'ordre des cibles : un voleur qui
 * est LUI-MÊME cible plus loin dans le tampon encaisserait ses coups sur des PV
 * déjà regonflés, et le tick cesserait d'être simultané. Un voleur tombé dans
 * ce tampon ne se soigne donc pas — c'est la conséquence voulue, pas un effet
 * de bord.
 *
 * ⚠ LE VOL PORTE SUR CE QUI A ÉTÉ ENCAISSÉ, JAMAIS SUR LE NOMINAL : les PV
 * réellement retirés, PLUS la part qu'un Bouclier a absorbée. Un tir de 500 sur
 * une cible à 100 PV ne vole que 100 ; un tir de 500 entièrement absorbé en
 * vole bien 500. En priver le voleur ferait du Bouclier une contre-mesure au
 * Vol de vie, ce qu'aucune ligne ne dit.
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

  // PASSE 2 en attente : indice de TIREUR → milli-PV que ses cibles ont
  // réellement encaissés ce tick. Seuls les porteurs du Vol de vie y entrent —
  // la répartition, elle, parcourt tous les coups, sans quoi un voleur se
  // verrait créditer les dégâts d'un voisin qui n'en porte pas.
  const encaisseParTireur = new Map();

  for (const [indice, coups] of entrees) {
    const e = etat.entites[indice];
    if (!estActive(e)) continue;

    // Le total encaissable par la cible, coups compris — la somme est entière
    // et l'ordre d'insertion, donc elle ne peut pas varier d'une passe à l'autre.
    let reste = 0;
    for (const coup of coups) reste += coup.degats;
    const nominal = reste;
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
      const d2 = distanceCarreeMilli(
        b.rangeeMilli, b.colonneMilli, e.rangeeMilli, e.colonneMilli,
      );
      if (d2 > BOUCLIER_RAYON_CARRE) continue;

      // Absorption PARTIELLE : le réservoir prend ce qu'il peut, le reste
      // passe. Pas de tout-ou-rien. Il ne se recharge jamais.
      const pris = Math.min(b.bouclierMilli, reste);
      b.bouclierMilli -= pris;
      reste -= pris;
    }

    const pvAvant = e.pvMilli;
    e.pvMilli = Math.max(0, e.pvMilli - reste);

    // Ce que la cible a VRAIMENT encaissé : la part absorbée par les boucliers
    // plus les PV réellement retirés. Un surplus qui dépasse les PV restants
    // n'est encaissé par personne, donc volé par personne.
    const encaisse = (nominal - reste) + (pvAvant - e.pvMilli);
    if (encaisse <= 0) continue;

    // JOURNAL — ce que la cible a VRAIMENT encaissé, part de bouclier comprise.
    // Le nominal dirait la force du coup, pas ce qui a été reçu.
    //
    // ⚠⚠ ET SES PV MAXIMUM AVEC, PARCE QUE L'ENCAISSÉ SEUL NE VEUT RIEN DIRE.
    // `facteurMilli` met dégâts ET PV à l'échelle du niveau : mesuré sur 57 864
    // impacts, l'encaissé va de 67 à 34 683 675 milli-PV, cinq ordres de
    // grandeur. Le seul rapport invariant est `encaisse / pvMaxMilli` — médiane
    // 12 · 13 · 13 · 14 millièmes aux niveaux 5, 20, 35 et 50 —, et il ne se
    // calcule qu'ici : c'est le moteur, et lui seul, qui connaît les PV d'une
    // pièce montée à son niveau.
    etat.journal.impacts.push({
      ...faitDeLEntite(e), encaisseMilli: encaisse, pvMaxMilli: e.pvMaxMilli,
    });

    // ⚠ SERVIR PAR INDICE DE TIREUR CROISSANT, PAS AU PRORATA. Le prorata
    // demanderait un arrondi par tireur et une règle de reste — deux occasions
    // de diverger, pour un partage que rien dans le jeu ne rend visible. Le
    // premier tireur est servi jusqu'à son nominal, puis le suivant, jusqu'à
    // épuisement de l'encaissé. La clé de tri est l'indice, la seule stable.
    let aRepartir = encaisse;
    const parIndice = [...coups].sort((x, y) => x.tireur - y.tireur);
    for (const coup of parIndice) {
      if (aRepartir <= 0) break;
      const part = Math.min(coup.degats, aRepartir);
      aRepartir -= part;
      const t = etat.entites[coup.tireur];
      if (t === undefined) continue;
      const pt = profil(t);
      if (!moduleActif(etat, t, pt, 'volDeVie')) continue;
      encaisseParTireur.set(coup.tireur, (encaisseParTireur.get(coup.tireur) ?? 0) + part);
    }
  }

  // PASSE 2 — les soins, une fois la passe 1 ENTIÈRE terminée.
  for (const [tireur, encaisse] of [...encaisseParTireur].sort((a, b) => a[0] - b[0])) {
    const t = etat.entites[tireur];
    // ⚠ UN TIREUR À ZÉRO PV NE SE SOIGNE PAS. `estActive` ne suffit pas :
    // `vivant` n'est écrit qu'à l'étape 6, donc un mort de CE tick y passerait
    // encore pour actif. Le second test est le seul qui le voie.
    if (!estActive(t) || t.pvMilli <= 0) continue;
    // Un seul `floor`, sur le produit, comme partout ailleurs dans ce moteur.
    const soin = Math.floor((encaisse * VOL_PCT) / 100);
    if (soin <= 0) continue;
    t.pvMilli = Math.min(t.pvMaxMilli, t.pvMilli + soin);
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

/**
 * 6. Retrait des entités mortes.
 *
 * ⚠ LA DESTRUCTION A UN INSTANT PRÉCIS, ET C'EST L'UN DES DEUX. Le journal s'y
 * accroche plutôt que de comparer deux ticks, ce qui manquerait tout ce qui naît
 * et meurt dans le même tick. ⚠ Et la POSITION relevée est celle d'avant le
 * déplacement, qui est l'étape 7 : la pièce meurt là où elle a été touchée.
 *
 * ⚠⚠ L'AUTRE EST L'ÉCRASEMENT, DANS `deplacement`, ET LE PREMIER JET DE CE LOT
 * L'AVAIT MANQUÉ. Une pièce écrasée passe `vivant` à faux à l'étape 7, donc
 * après celle-ci ; s'accrocher ici seulement laissait une mort sur vingt-trois
 * hors du journal. C'est un test qui l'a dit, pas une relecture.
 */
function retirerLesMorts(etat) {
  for (const e of etat.entites) {
    if (e.vivant && e.pvMilli === 0) {
      e.vivant = false;
      etat.journal.destructions.push(faitDeLEntite(e));
    }
  }
}

/**
 * L'entité s'arrête-t-elle ? Elle s'arrête pour un BÂTIMENT, et pour sa CIBLE
 * DE PRÉDILECTION, quelle qu'elle soit. L'aviation traversante ne s'arrête
 * jamais.
 *
 * ⚠⚠ TROIS ARBITRAGES, DANS L'ORDRE, ET LE TROISIÈME RENVERSE LE PREMIER.
 *
 * 04/09 — « Chaque unité s'arrête pour casser des bâtiments. Merlon et
 * tourelles exclus, sauf si ils empêchent d'avancer. » La règle d'AVANT ce
 * jour-là comparait `colonnePredilection` à la colonne de la cible, et elle
 * était fausse : `COLONNE_PAR_TYPE_DEFENSE` range mur, barrière et tourelle
 * sous `structureOuAviation`, la MÊME colonne que `profilBatiment`, si bien
 * qu'une anti-structure s'arrêtait pour un mur, pour une tourelle ET pour un
 * bâtiment sans que rien ne pût les séparer. Le lot ARRÊT a donc REMPLACÉ la
 * colonne par le genre.
 *
 * 06/09 — « **Ajouter l'arrêt sur prédilection EN PLUS du bâtiment.** », sur le
 * défaut rapporté « un éclaireur ne s'arrête pas lorsqu'il rencontre une
 * infanterie ennemie ». La prédilection revient donc, mais elle ne remplace
 * rien : elle s'AJOUTE — et elle portait alors son exclusion avec elle, tenue
 * par un couple genre × colonne, `estStructureDefensive`.
 *
 * 10/09 — « Une unité anti-structure doit s'arrêter pour détruire mur barrière
 * tourelles. C'est une cible de prédilection », précisé le même jour : « les
 * unités anti-structure s'arrêtent devant les tourelles, les barbelés, les murs
 * et les bâtiments. Les bâtiments de toute façon c'est tout le monde. »
 * L'EXCLUSION DU 04/09 TOMBE. La seconde branche ne porte plus de « sauf », et
 * `estStructureDefensive` est PARTIE avec son dernier lecteur plutôt que de
 * rester morte dans le fichier.
 *
 * ⚠⚠ ET CE RENVERSEMENT N'EST PAS UNE RÉGRESSION À « RÉTABLIR ». Un lot futur
 * retrouvera la trace de l'exclusion — dans `RAPPORT-lotARRET.md`, dans le
 * commentaire d'`ARRÊT T2`, dans un témoin — et voudra remettre
 * `!estStructureDefensive(pc)` en croyant réparer une régression. C'est
 * exactement ce que ce bloc existe pour empêcher : le 04/09 demandait de ne PAS
 * s'arrêter devant un mur, le 10/09 demande le contraire, les deux viennent
 * d'Ethan, et la plus récente fait foi. `MUR T1` garde la règle neuve, `MUR T2`
 * sa contre-épreuve.
 *
 * ⚠⚠ ET IL N'Y A AUCUNE GARDE « SEULEMENT LES ANTI-STRUCTURE » À ÉCRIRE — c'est
 * le point à comprendre avant de toucher à cette fonction. La seconde branche
 * ne se déclenche que si `pc.colonneMatrice === p.colonnePredilection`, et
 * `structureOuAviation` n'est la prédilection que de SIX unités du roster,
 * mesuré sur `UNITES` : perceurs, fouisseurs, bélier, pilon, frappeur, enclume.
 * Toutes les autres continuent de ne pas s'arrêter devant un mur sans qu'une
 * seule condition neuve existe. Une garde explicite serait une SECONDE écriture
 * de la prédilection, et elle divergerait au premier réglage de roster.
 *
 * ⚠⚠ ET ELLES NE SONT QUE **CINQ** À S'ARRÊTER POUR DE BON — MESURÉ, PAS DÉDUIT.
 * Le **Frappeur** est un aéronef `traversant` : la garde aérienne de la première
 * ligne l'écarte AVANT que la prédilection ne soit lue, et une pièce qui traverse
 * le champ ne peut pas buter dessus. Six prédilections, cinq arrêts. `MUR T1`
 * asserte le partage plutôt que de le supposer, et il porte la contre-épreuve :
 * le Frappeur, même mur, même colonne libre, continue d'avancer.
 *
 * ⚠ LES BÂTIMENTS RESTENT LA PREMIÈRE BRANCHE, ET ELLE VAUT POUR TOUT LE MONDE
 * — « les bâtiments de toute façon c'est tout le monde », 10/09. Elle est
 * antérieure aux trois arbitrages, aucun ne l'a touchée, et elle n'a jamais rien
 * eu à voir avec la prédilection.
 *
 * ⚠ `colonnePredilection` VAUT `null` pour toute entité qui ne tire pas, et la
 * comparaison est écrite dans le sens qui protège du `null` : on refuse
 * d'abord, on compare ensuite. Écrire `p.colonnePredilection ===
 * pc.colonneMatrice` seul serait vrai si les deux valaient `null` — c'est
 * l'avertissement que `degatsDUnTir` porte déjà quelques centaines de lignes
 * plus haut, et il vaut ici mot pour mot.
 *
 * ⚠⚠ « SAUF SI ILS EMPÊCHENT D'AVANCER » NE DEMANDE TOUJOURS AUCUN CODE, ET LE
 * MÉCANISME S'EST DÉDOUBLÉ AU 10/09. Pour les SIX, la clause est absorbée : une
 * anti-structure s'arrête devant le merlon qu'il barre ou non sa colonne, et
 * elle sort d'`avancer` par le `return` de l'arrêt. Pour TOUTES LES AUTRES,
 * rien n'a changé — elles ne s'arrêtent pas au sens de cette fonction, mais
 * `peutAvancer` les retient et elles TIRENT, donc `nuit(e)`, c'est-à-dire
 * `aTire`, remet `ticksInutiles` à zéro et elles ne se replient pas. Ce qui a
 * changé pour elles est ailleurs : elles se RANGENT désormais sur leur case au
 * lieu de fluer dans le mur — voir `chevauchementInterditSur`, lu par les deux axes.
 *
 * ⚠⚠ ET LE REPLI NE PEUT TOUJOURS PAS EMPIRER PAR CETTE FONCTION, PAR
 * CONSTRUCTION — vérifié explicitement au lot COLONNE plutôt que reconduit, et
 * l'argument survit intact au renversement du 10/09. `doitSArreter` implique
 * `e.aTire`, qui EST `nuit(e)` : la condition est restée EN TÊTE, avant les deux
 * branches, donc une bascule de faux à vrai ne peut qu'ôter une chance de
 * progresser à une entité qui nuit DÉJÀ, jamais lui retirer sa raison de rester
 * utile. Ce que la mesure doit chercher est l'autre chemin — une unité arrêtée
 * bloque sa colonne, et c'est l'alliée DERRIÈRE elle, sans cible à portée, qui
 * se replierait. Le lot COLONNE l'a mesuré sur les 162 montages du banc plutôt
 * que de le raisonner ; `ARRÊT T8` le garde depuis, et il est remesuré ici.
 */
function doitSArreter(etat, e, p) {
  if (p.comportementAerien === 'traversant') return false;
  if (!e.aTire || e.cibleIndice === null) return false;
  const pc = profil(etat.entites[e.cibleIndice]);
  if (pc.genre === 'batiment') return true;
  if (p.colonnePredilection === null) return false;
  if (pc.colonneMatrice !== p.colonnePredilection) return false;
  return true;
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
 * unité D'ASSAUT ne change jamais de colonne.
 *
 * ⚠ LES DEUX MOTS EN CAPITALES SONT DU LOT COLONNE, 06/09. La phrase disait
 * « aucune unité », et c'était vrai tant que le déplacement était strictement
 * vertical pour tout le monde. La DÉFENSE des deux camps se décale désormais
 * latéralement ; l'assaut, lui, ne bouge toujours que vers le fond, et c'est
 * de lui seul que ce paragraphe parle.
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
 * Le module que cette entité emploie DANS LE CAMP OÙ ELLE SE BAT.
 *
 * ⚠⚠⚠ EXTRAITE DE `moduleActif` AU LOT NEUTRALISATION, 08/09/2026, ET
 * `declencherNeutralisations` L'APPELLE AUSSI — sans quoi la ligne défense ne
 * marcherait QU'À MOITIÉ, et la moitié qui marche masquerait l'autre. Le
 * déclencheur lisait `p.module`, c'est-à-dire le module d'ATTAQUE de la pièce.
 * Pour la Meute et le Bélier, le module d'attaque et celui de défense sont tous
 * deux le Flashbang : ouvrir la boucle à la défense les armerait, et tout
 * paraîtrait fonctionner. Pour la Carapace et le Fendeur, `p.module` vaut
 * `booster` et `ecraseur` — leur EMP est sur la ligne de DÉFENSE.
 * `NEUTRALISATION['booster']` vaut `undefined`, donc `continue` : **deux des
 * quatre lignes vendues auraient été inertes**, ce qui est très exactement le
 * défaut que ce lot ferme. `NEUT T5` tombe si l'appel redevient `p.module`.
 */
function moduleDuCamp(e, p) {
  return e.camp === 'attaque' ? p.module : moduleDeDefense(e, p);
}

/**
 * Le camp d'une entité, traduit en BRANCHE d'achat.
 *
 * ⚠⚠ `camp` ET `branche` NE PORTENT PAS LES MÊMES MOTS, ET C'EST TOUT L'INTÉRÊT
 * DE CETTE TABLE. Le camp vaut `attaque` ou `defense` ; la branche d'achat vaut
 * `offense` ou `defense`. Le second terme coïncide, le premier NON. Une
 * indexation directe par `e.camp` rendrait `undefined` pour toute entité
 * attaquante — et `undefined?.includes` ne lève pas, il vaut `undefined` : TOUS
 * les modules offensifs s'éteindraient EN SILENCE.
 */
const BRANCHE_DU_CAMP = { attaque: 'offense', defense: 'defense' };

/** Les deux branches d'achat, dans l'ordre de `data/recherche.js`. */
const BRANCHES_MODULE = ['offense', 'defense'];

/**
 * Recopie et VALIDE les modules débloqués d'un propriétaire.
 *
 * ⚠ LA FORME PLATE LÈVE, ELLE NE SE RÉPARE PAS. Jusqu'au lot MODULES-E, un
 * propriétaire portait UN tableau de noms, et les quatre noms qui existent des
 * deux côtés — `flashbang`, `tirDeBarrage`, `emp`, `garnison` — fuyaient d'une
 * branche à l'autre. Accepter encore un tableau laisserait un appelant oublié
 * fuir exactement comme avant, sans que personne ne le sache.
 *
 * ⚠ ABSENT RESTE PERMIS, et ce n'est pas la même chose. De nombreux montages —
 * mesuré : ceux d'`assaut`, de `banc`, de `site-entame` et onze de
 * `combat.test.js` — n'ont aucun module à déclarer. C'est la forme PRÉSENTE ET
 * FAUSSE qu'on refuse, pas l'absence.
 */
function modulesDunProprietaire(brut, qui) {
  if (brut === undefined || brut === null) return { offense: [], defense: [] };
  if (Array.isArray(brut) || typeof brut !== 'object') {
    throw new Error(
      `combat : modulesDebloques.${qui} est une liste plate — il faut `
      + '{ offense: [...], defense: [...] } depuis le lot MODULES-E',
    );
  }
  const sortie = {};
  for (const branche of BRANCHES_MODULE) {
    const liste = brut[branche];
    if (liste === undefined) {
      throw new Error(`combat : modulesDebloques.${qui} n'a pas de branche « ${branche} »`);
    }
    if (!Array.isArray(liste) || liste.some((n) => typeof n !== 'string')) {
      throw new Error(`combat : modulesDebloques.${qui}.${branche} n'est pas une liste de noms`);
    }
    sortie[branche] = [...liste];
  }
  return sortie;
}

/**
 * Recopie et VALIDE les majorations de POI d'un propriétaire.
 *
 * ⚠ MÊME FORME POUR LES DEUX PROPRIÉTAIRES, comme `modulesDebloques` depuis
 * MODULES-E. Aucun POI ne bénéficie à l'Ouvrage aujourd'hui, et sa table reste
 * donc à zéro — mais une forme asymétrique obligerait le lecteur à connaître
 * l'exception, et le premier qui l'oublierait lirait `undefined`.
 *
 * ⚠ ABSENT EST PERMIS ET VAUT ZÉRO PARTOUT. Le banc, `assaut` et les montages de
 * `combat.test.js` n'ont aucun POI à déclarer ; c'est la forme PRÉSENTE ET
 * FAUSSE qu'on refuse, pas l'absence.
 *
 * ⚠ ET LES POUR-CENT SONT DES ENTIERS ≥ 0. Un flottant ferait sortir les dégâts
 * des entiers, donc le combat du déterminisme.
 */
const CLES_MAJORATION_POI = ['escouade', 'blinde', 'aeronef', 'defense'];

function majorationsDunProprietaire(brut, qui) {
  const sortie = {};
  for (const cle of CLES_MAJORATION_POI) sortie[cle] = 0;
  if (brut === undefined || brut === null) return sortie;
  if (Array.isArray(brut) || typeof brut !== 'object') {
    throw new Error(
      `combat : majorationsPoi.${qui} n'est pas un objet `
      + `{ ${CLES_MAJORATION_POI.join(', ')} }`,
    );
  }
  for (const cle of Object.keys(brut)) {
    if (!CLES_MAJORATION_POI.includes(cle)) {
      throw new Error(`combat : majorationsPoi.${qui} porte une clé inconnue « ${cle} »`);
    }
    const v = brut[cle];
    if (!Number.isInteger(v) || v < 0) {
      throw new Error(
        `combat : majorationsPoi.${qui}.${cle} = ${v} — pour-cent entier ≥ 0 attendu`,
      );
    }
    sortie[cle] = v;
  }
  return sortie;
}

/**
 * Le pourcentage de dégâts que les POI donnent à cette entité.
 *
 * ⚠⚠ `camp` ET `proprietaire` SONT DEUX CHOSES, et les trois POI offensifs
 * demandent LES DEUX. Sans la condition de camp, les Cuirassiers que le joueur
 * met en garnison profiteraient d'un bonus d'assaut ; sans celle de
 * propriétaire, l'Ouvrage profiterait des POI qu'il n'a pas pris.
 *
 * ⚠ `p.chassis` VAUT `null` POUR UNE DÉFENSE ET POUR UN BÂTIMENT. La comparaison
 * part donc du châssis et REFUSE `null` — jamais une égalité entre deux valeurs
 * qui pourraient être nulles toutes les deux, qui est la faute que le
 * commentaire de `colonnePredilection` nomme déjà.
 *
 * ⚠ LA REDOUTE MAJORE TOUT CE QUE LE JOUEUR POSE EN DÉFENSE, quel que soit le
 * genre — c'est ce qu'Ethan a écrit, et un bâtiment du joueur en défense en
 * profiterait aussi le jour où sa base sera attaquée.
 */
function majorationPoi(etat, e, p) {
  const table = etat.majorationsPoi?.[e.proprietaire];
  if (table === undefined) return 0;
  if (e.camp === 'defense') return table.defense;
  if (typeof p.chassis !== 'string') return 0;
  return table[p.chassis] ?? 0;
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
 *
 * ⚠⚠ QUATRIÈME CONDITION DEPUIS MODULES-E : LA BRANCHE D'ACHAT. Quatre noms
 * existent des deux côtés de l'arbre, et une liste plate ne pouvait pas les
 * distinguer — acheter le Tir de barrage à l'assaut l'offrait aux Perceurs de
 * la garnison, dont la ligne de défense n'est même pas en vente.
 */
function moduleActif(etat, e, p, nom) {
  const porte = moduleDuCamp(e, p);
  if (porte !== nom) return false;
  const liste = etat.modulesDebloques?.[e.proprietaire]?.[BRANCHE_DU_CAMP[e.camp]];
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
  const indice = occupantDe(occupation, caseDestination, caseColonne(e));
  if (indice === undefined) return undefined;
  const occupante = etat.entites[indice];
  if (occupante.camp === e.camp || occupante.genre !== 'defense') return undefined;
  return occupante;
}

/**
 * La case VISÉE porte-t-elle quelque chose qu'on ne doit pas CHEVAUCHER —
 * c'est-à-dire devant quoi l'entité doit se ranger sur sa propre case plutôt que
 * de fluer jusqu'au bord ?
 *
 * DEUX cas, et deux seulement :
 *   — une STRUCTURE IMMOBILE, de n'importe quel camp : un mur, une barrière, une
 *     tourelle, une artillerie, un bâtiment. C'est le périmètre du lot MUR ;
 *   — une ALLIÉE, quelle que soit sa vitesse. C'est ce que le lot
 *     BARÈME-ET-REJEU ajoute.
 *
 * ⚠⚠ L'ALLIÉE EST UN ARBITRAGE D'ETHAN DU 12/09/2026, ET IL RENVERSE CELUI DU
 * 10/09 QUE CE BLOC PORTAIT. Il avait vu, sur une vraie partie : « les véhicules
 * étaient à 80 % sur l'infanterie, plutôt que d'attendre derrière », puis,
 * mis devant la mesure : « pas de chevauchement allié ni horizontal ni vertical.
 * Totalement interdit. » Le raisonnement d'hier — « devant une alliée MOBILE, la
 * case se libérera d'elle-même, et ranger lui coûterait à chaque fois les
 * millièmes qu'elle vient de gagner » — n'est pas faux : il est ÉCARTÉ. Ce qu'il
 * coûtait est ce qu'Ethan a vu à l'écran, et `caseDepuisMilli` est un `floor`,
 * si bien qu'une entité à 8 920 est en case 8 pour le moteur et DESSINÉE à 92 %
 * sur la case 9.
 *
 * ⚠⚠ L'ENNEMIE MOBILE GARDE LE COMPORTEMENT D'HIER, ET CE N'EST PAS UN OUBLI.
 * Ethan dit « chevauchement ALLIÉ » : deux pièces d'un même camp ne doivent pas
 * se superposer, et c'est une règle de LISIBILITÉ. Face à une ennemie, fluer
 * jusqu'au contact EST le dessin juste — le corps à corps se joue au bord des
 * cases, pas à un demi-pas. `T7` de `test/combat.test.js` le mesure depuis le lot
 * 4A, Ratisseur figé à 2 960 derrière un Bélier défensif, et il reste vert SANS
 * QU'UNE LIGNE Y SOIT TOUCHÉE : c'est la moitié qui dit que le lot n'a pas
 * élargi au-delà de ce qu'Ethan a nommé.
 *
 * ⚠ LE DISCRIMINANT DE LA PREMIÈRE MOITIÉ RESTE LA VITESSE, PAS LE GENRE.
 * `profilDefense` et `profilBatiment` posent tous deux `vitesseMilli: 0` :
 * murs, barrières, tourelles, artilleries et bâtiments y tombent tous, sans
 * qu'une table de genres soit écrite une seconde fois. C'est la même lecture
 * que le `if (p.vitesseMilli === 0) continue;` de l'étape 7.
 *
 * ⚠⚠ UNE SEULE ÉCRITURE, DEUX LECTEURS, ET C'EST L'ACQUIS DU LOT MUR QU'ON NE
 * DÉFAIT PAS. `avancer` regarde `caseDevant, colonne`, `seDecaler` regarde
 * `rangee, caseACote` — l'appelant nomme la case, la fonction porte la règle.
 * Une seconde fonction « à côté » aurait été deux lectures de la même grandeur,
 * dont une seule recevrait la prochaine correction ; ce lot-ci en est la preuve,
 * il change UNE ligne et les deux axes suivent.
 *
 * ⚠ ELLE PREND `e` DEPUIS CE LOT : sans l'entité, elle ne peut pas connaître son
 * camp, donc pas distinguer une alliée d'une ennemie. Le paramètre est le
 * deuxième, à côté de `p`, comme partout ailleurs dans ce module.
 *
 * ⚠ L'AVIATION N'EST JAMAIS RANGÉE : `!p.bloquant` sort en tête. Elle ignore
 * l'occupation partout ailleurs — `peutAvancer`, `avancer` et `seDecaler` —, et
 * la ranger devant un mur qu'elle survole serait un défaut neuf.
 *
 * ⚠ ET ELLE NE REGARDE PAS SI L'OCCUPANTE EST ÉCRASABLE, délibérément. Écraser
 * est un fait de COMBAT que `peutAvancer` et `structureForcee` tranchent à leur
 * place ; ranger est un fait de DESSIN. Une porteuse de l'Écraseur devant un mur
 * se range ET force au même tick — `MUR T5` le mesure par différence — et
 * l'ordre des deux n'a pas changé.
 */
function chevauchementInterditSur(etat, e, p, occupation, rangee, colonne) {
  if (!p.bloquant) return false;
  const indice = occupantDe(occupation, rangee, colonne);
  if (indice === undefined) return false;
  const occupante = etat.entites[indice];
  if (occupante.camp === e.camp) return true;
  return profil(occupante).vitesseMilli === 0;
}

/**
 * La case VISÉE est-elle tenue par une ALLIÉE — c'est-à-dire par quelqu'un qui
 * finira par s'en aller, et dont l'attente ne doit donc pas compter comme de
 * l'inutilité ?
 *
 * ⚠⚠ ELLE NE SE DÉDUIT PAS DE `chevauchementInterditSur`, ET LE CONFONDRE
 * FERAIT DISPARAÎTRE LE REPLI. Ce prédicat-là est vrai AUSSI devant une
 * structure immobile ; or devant un mur, l'attente est éternelle — c'est très
 * exactement le cas où `TICKS_AVANT_REPLI` doit mordre, et le lot ARRÊT l'a
 * mesuré. Deux questions voisines, deux réponses, deux fonctions.
 *
 * ⚠⚠ LE GEL EST UN ARBITRAGE D'ETHAN DU 12/09/2026, ET IL VIENT DE CE QU'IL A
 * VU : « puis ils ont disparu. Mais 0 détruit. » Ce sont ses véhicules qui se
 * REPLIAIENT — `sorti = true`, donc comptés parmi les survivants et absents du
 * décompte des pertes. Une unité bloquée derrière une alliée ne progresse pas,
 * ne nuit pas — elle tire sur ce qu'elle a à portée, et une alliée devant elle
 * n'est pas une cible — et ne force rien : au trentième tick elle rentrait à la
 * base, PARCE QU'UNE DES SIENNES LUI BARRAIT LE PASSAGE.
 *
 * ⚠ ET C'EST LE MÊME RAISONNEMENT QUE LE GEL DE LA VOIE D'APPROCHE, ÉLARGI À
 * TOUTE LA GRILLE. Le lot APPROCHE gelait le compteur sous `estEnApproche` pour
 * exactement cette raison — « elle quitterait le raid SANS Y ÊTRE JAMAIS
 * ENTRÉE » —, et il n'avait aucune raison de s'arrêter à la rangée 1. Les deux
 * gels coexistent : l'approche couvre l'entrée, celui-ci couvre l'embouteillage.
 *
 * ⚠ DEVANT UNE STRUCTURE, ON NE GÈLE PAS. Un mur ne s'en va pas, et une unité
 * qui ne sait pas l'abattre doit pouvoir rentrer : c'est ce que `MUR T3` et
 * `ARRÊT T8` mesurent, et le gel les ferait tomber. Devant une ENNEMIE mobile
 * non plus — elle est une cible, donc `nuit(e)` remet le compteur à zéro tout
 * seul quand la pièce peut la frapper, et l'entité qui ne peut pas la frapper
 * doit se replier.
 */
function allieeDevant(etat, e, p, occupation, rangee, colonne) {
  if (!p.bloquant) return false;
  const indice = occupantDe(occupation, rangee, colonne);
  if (indice === undefined) return false;
  return etat.entites[indice].camp === e.camp;
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
 *
 * ⚠⚠ ELLE RESTE VERTICALE, ET ON NE LUI AJOUTE PAS D'AXE — LOT COLONNE. Sa
 * première ligne teste `rangee >= DERNIERE_RANGEE` et rend le comportement
 * aérien : un paramètre d'axe en ferait deux fonctions dans une, dont l'une des
 * deux branches ne serait jamais relue. Le latéral a sa borne à part,
 * `estSortiParLeCote` de `grille.js`, et sa propre étape de déplacement.
 */
function peutAvancer(etat, e, p, occupation, rangee, caseDestination) {
  if (rangee >= DERNIERE_RANGEE) return p.comportementAerien === 'traversant';
  if (caseDestination === rangee) return true;
  if (!p.bloquant) return true; // l'aviation ignore l'occupation
  const indiceOccupante = occupantDe(occupation, caseDestination, caseColonne(e));
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
 * 7. Déplacement. DEUX AXES DEPUIS LE LOT COLONNE, ET UN SEUL PAR CAMP.
 *
 * ⚠⚠ L'ATTAQUE AVANCE, LA DÉFENSE SE DÉCALE — ETHAN, 06/09, POINT 10 :
 * « déplacement latéral identique au déplacement vertical, vitesse multipliée
 * par 2/3, même règle de collision », sur le périmètre « défense des deux
 * camps ». Une unité d'ASSAUT ne change TOUJOURS JAMAIS de colonne, et tout ce
 * que `peutEcraser` en déduit — « poser un blindé derrière une infanterie dans
 * la même colonne gâche le blindé » — reste vrai côté offense.
 *
 * ⚠⚠ ET CETTE ÉTAPE S'OUVRE POUR LA PREMIÈRE FOIS AU CAMP `defense`. Sa boucle
 * portait `e.camp !== 'attaque'` en tête depuis le lot 2A : rien de ce qui suit
 * n'avait jamais été exécuté par un défenseur. Ce qui est écrit POUR L'ASSAUT
 * reste donc sous garde de camp, et le rapport du lot les nomme un par un — le
 * REPLI (`ticksInutiles`, `TICKS_AVANT_REPLI`), l'ÉCRASEUR (`structureForcee`,
 * qui refuse déjà `e.camp !== 'attaque'`), la SORTIE PAR LE HAUT et le
 * franchissement du fond. Ouvert tel quel, le repli ferait quitter le terrain
 * aux défenseuses bloquées — `COL T9` le mesure.
 *
 * ⚠ LES STRUCTURES NE BOUGENT PAS, ET C'EST GRATUIT. `profilDefense` et
 * `profilBatiment` posent tous deux `vitesseMilli: 0`, et le
 * `if (p.vitesseMilli === 0) continue;` d'en dessous suffit : murs, barrières,
 * tourelles, artilleries et bâtiments restent immobiles SANS qu'une seule garde
 * neuve soit écrite. Seules les unités posées en garnison se décalent, et
 * `COL T8` le vérifie plutôt que de le croire.
 *
 * Écrasement, une seule règle : masse mobile strictement supérieure → la
 * bloquante meurt et la mobile continue ; masse égale ou inférieure → blocage.
 * L'écrasement est indépendant de la prédilection.
 */
function deplacement(etat) {
  const occupation = construireOccupation(etat);
  const obstacles = obtenirIndexObstacles(etat);

  for (const e of etat.entites) {
    if (!estActive(e)) continue;
    // ⚠⚠⚠ ICI, ET SURTOUT PAS DANS `avancer` — lot NEUTRALISATION, 08/09/2026.
    // Ethan : « il faut neutraliser non seulement le tir, mais aussi le
    // déplacement. » La position de cette ligne est ce qui empêche l'EMP de
    // RETIRER un blindé du raid pour de bon : la neutralisation dure
    // `NEUTRALISATION_TICKS` (50) et le repli se déclenche à
    // `TICKS_AVANT_REPLI` (30). Une unité qui entre dans `avancer` sans avancer,
    // sans tirer et sans rien forcer y voit `ticksInutiles` monter — au trentième
    // tick de l'effet elle QUITTE LE CHAMP définitivement et compte parmi les
    // survivantes. Un module annoncé « désactive 5 s » supprimerait donc
    // l'unité. En sortant ici, `avancer` n'est jamais appelée, le compteur ne
    // monte pas, et l'unité repart au 51ᵉ tick — ce que la description promet.
    // `NEUT T2` monte les deux cas et tombe si la garde descend d'un cran.
    //
    // ⚠ ET ELLE SERT LES DEUX CAMPS GRATUITEMENT : la même boucle route la
    // défense vers `seDecaler` depuis le lot COLONNE. Une défenseuse neutralisée
    // cesse donc aussi de se décaler, ce que la ligne défense de ce lot-ci rend
    // atteignable pour la première fois.
    if (estNeutralisee(e)) continue;
    const p = profil(e);
    if (p.vitesseMilli === 0) continue;
    if (e.camp === 'attaque') avancer(etat, e, p, occupation, obstacles);
    else seDecaler(etat, e, p, occupation, obstacles);
  }
}

/**
 * La vitesse d'un tick, obstacle et Booster appliqués — la valeur d'où PART le
 * déplacement, quel que soit son axe.
 *
 * ⚠ L'OBSTACLE SE LIT SUR LA CASE OÙ L'ENTITÉ EST, jamais sur celle où elle va :
 * c'est le terrain qu'elle traverse qui la ralentit.
 *
 * BOOSTER — ×10 APRÈS la réduction d'obstacle, sur la valeur retenue.
 *
 * ⚠ APPLIQUÉ AVANT, UN OBSTACLE CESSERAIT DE RALENTIR UNE UNITÉ BOOSTÉE, ce
 * qu'aucune règle ne dit : 60 → 600 → 240 sous obstacle serait plus rapide que
 * la vitesse nominale. Ici c'est 24 → 240, le rapport est gardé.
 *
 * ⚠⚠ ET IL EXISTE UN INVARIANT NON ÉCRIT QUE CE ×10 FRÔLE — voir `peutAvancer` :
 * « aucune vitesse n'atteint 1 000 milli-cases par tick ». Les deux porteurs du
 * Booster sont des escouades à 60, donc 600, et l'invariant tient. Il ne tient
 * QUE PAR ACCIDENT : au Frappeur (240), 2 400 ferait sauter une rangée à la
 * destination et `peutAvancer` laisserait passer une unité À TRAVERS un mur,
 * sans qu'aucun test n'échoue. Un test de données garde ce seuil
 * (`recherche.test.js`, MODULES-A T6), et `COL T14` le garde LATÉRALEMENT.
 */
function vitesseDuTick(etat, e, p, obstacles, rangee) {
  let vitesse = p.vitesseMilli;
  const type = typeObstacleSur(obstacles, rangee, caseColonne(e));
  if (type !== undefined && obstacleConcerne(type, p.chassis)) {
    vitesse = p.vitesseObstacleMilli;
  }
  if (boosterActif(e)) vitesse *= BOOSTER_FACTEUR;
  return vitesse;
}

/**
 * La vitesse LATÉRALE d'un tick : celle du tick, au facteur près.
 *
 * ⚠⚠ LE ×2/3 SE POSE EN DERNIER, SUR LA VALEUR RETENUE — c'est l'ordre que le
 * commentaire du Booster impose déjà pour lui-même. Posé avant la réduction
 * d'obstacle, il ferait cesser l'obstacle de ralentir ; posé avant le Booster,
 * il rendrait le rapport des deux faux. En dernier, TOUS les rapports sont
 * gardés : 60 → 40, 24 sous obstacle → 16, 600 boosté → 400.
 *
 * ⚠ LE QUOTIENT EST ENTIER PAR CONSTRUCTION, ET `COL T13` LE GARDE. Les quatre
 * vitesses du relevé sont divisibles par 3, et les deux transformations d'amont
 * conservent cette divisibilité — l'obstacle divise par 2,5 en multipliant par
 * 1 000 puis en divisant par 2 500, le Booster multiplie par 10. Le `floor`
 * ci-dessous ne tronque donc rien aujourd'hui ; il est écrit pour que le jour où
 * une vitesse indivisible entrerait, le moteur reste entier et le TEST de
 * données le dise, plutôt qu'un flottant ne se glisse dans `colonneMilli`.
 */
function vitesseLaterale(etat, e, p, obstacles, rangee) {
  const { numerateur, denominateur } = GRILLE.lateral;
  return Math.floor((vitesseDuTick(etat, e, p, obstacles, rangee) * numerateur) / denominateur);
}

/**
 * La cible vers laquelle une défenseuse veut se décaler — la plus proche de sa
 * COLONNE DE PRÉDILECTION —, ou `null`.
 *
 * ⚠⚠ « LA CIBLE LA PLUS PROCHE » S'ENTEND DANS SA PRÉDILECTION, ET C'EST UNE
 * LECTURE DÉCLARÉE. Le point 10 d'Ethan dit « quand une cible de prédilection
 * arrive » ; la règle qu'il donne ensuite dit « la cible la plus proche, peu
 * importe si elle se bloque ». Prises ensemble, elles décrivent un décalage vers
 * la prédilection et rien d'autre : **sans cible de prédilection, l'entité ne se
 * décale pas.** Une ligne suffit à ouvrir le décalage à n'importe quelle cible.
 *
 * ⚠ ET CE N'EST PAS `e.cibleIndice`. Celle-là est la cible de TIR, que `ciblage`
 * conserve hors de portée et choisit en repli hors prédilection quand aucune
 * cible de prédilection n'est à portée : s'en servir ferait courir la défenseuse
 * vers une cible qu'elle n'a prise que faute de mieux. On cherche donc à part,
 * avec le MÊME départage que `ciblage` — distance, puis colonne, puis rangée —
 * pour que deux cibles à égalité ne dépendent pas de l'ordre d'insertion.
 *
 * ⚠ AUCUNE CONDITION DE PORTÉE. « Peu importe si elle se bloque » : elle veut y
 * aller, qu'elle puisse tirer ou non.
 */
function cibleDuDecalage(etat, e, p) {
  if (p.colonnePredilection === null) return null;
  let meilleure = null;
  let meilleureDistance = Infinity;
  let meilleureColonne = Infinity;
  let meilleureRangee = Infinity;
  for (const c of etat.entites) {
    if (!estActive(c) || c.camp === e.camp) continue;
    if (profil(c).colonneMatrice !== p.colonnePredilection) continue;
    const d2 = distanceCarreeMilli(
      e.rangeeMilli, e.colonneMilli, c.rangeeMilli, c.colonneMilli,
    );
    if (
      d2 < meilleureDistance
      || (d2 === meilleureDistance && c.colonneMilli < meilleureColonne)
      || (d2 === meilleureDistance && c.colonneMilli === meilleureColonne
        && c.rangeeMilli < meilleureRangee)
    ) {
      meilleure = c;
      meilleureDistance = d2;
      meilleureColonne = c.colonneMilli;
      meilleureRangee = c.rangeeMilli;
    }
  }
  return meilleure;
}

/**
 * Le déplacement LATÉRAL d'une pièce de garnison — lot COLONNE.
 *
 * ⚠⚠ IL NE PORTE NI REPLI, NI ÉCRASEUR, NI SORTIE. Les quatre mécanismes que
 * `avancer` exécute sont écrits pour l'ASSAUT, et ils restent chez lui : le
 * repli parce qu'une défenseuse bloquée n'a pas de base où rentrer et que
 * l'ouvrir ferait quitter le terrain à la garnison (`COL T9`) ; l'Écraseur parce
 * que `structureForcee` refuse déjà tout ce qui n'est pas `attaque` ; la sortie
 * par le haut et le franchissement du fond parce qu'ils décrivent un assaut qui
 * traverse la base. Le latéral, lui, N'A AUCUNE SORTIE : `estSortiParLeCote`
 * REFUSE le pas qui quitterait la grille, elle ne fait sortir personne.
 *
 * ⚠ ET `ticksInutiles` N'EST PAS TOUCHÉ ICI, même pas remis à zéro. Il ne sert
 * qu'au repli ; l'écrire côté défense mettrait dans l'état une grandeur que
 * personne ne lit, et inviterait le lot suivant à brancher le repli dessus.
 */
function seDecaler(etat, e, p, occupation, obstacles) {
  const cible = cibleDuDecalage(etat, e, p);
  if (cible === null) return;
  const sens = Math.sign(cible.colonneMilli - e.colonneMilli);
  if (sens === 0) return;

  const rangee = caseDepuisMilli(e.rangeeMilli);
  const colonne = caseColonne(e);
  // ⚠⚠ LA CASE À CÔTÉ, NOMMÉE UNE FOIS — le pendant exact de `caseDevant` dans
  // `avancer`. Elle se prend dans le SENS DU DÉPLACEMENT et non à droite : une
  // défenseuse se décale vers sa cible, qui peut être de l'un ou l'autre bord.
  // Hors grille, `occupantDe` rend `undefined` et la garde tombe d'elle-même.
  //
  // ⚠⚠ ET AUCUN TEST NE PEUT DISTINGUER `+ sens` DE `+ 1` AUJOURD'HUI — MESURÉ,
  // ET DÉCLARÉ PLUTÔT QUE TU. Le flottement n'existe QUE vers la droite : une case
  // couvre `[c × 1 000, c × 1 000 + 999]`, donc le bord extrême dans le sens du pas
  // vaut `+999` à droite mais EXACTEMENT la position rangée à gauche. Une pièce qui
  // se décale vers la gauche depuis sa case ne rampe donc jamais : son premier pas
  // franchit déjà la frontière, et il est refusé. Mesuré des deux côtés, soixante
  // ticks : `6 000 → 6 000`, une seule position distincte, avec `+ sens` comme avec
  // `+ 1`. On écrit quand même `+ sens`, parce que c'est ce que la ligne VEUT dire
  // et que la symétrie cessera d'être gratuite le jour où une pièce partira d'un
  // milieu de case. *Un test qui ne peut tomber sur aucun état d'aujourd'hui se
  // déclare, il ne se compte pas.*
  const caseACote = colonne + sens;
  const chevauchementInterdit = chevauchementInterditSur(etat, e, p, occupation, rangee, caseACote);
  // ⚠⚠ LE PAS NE DÉPASSE JAMAIS SA CIBLE, ET SANS CETTE BORNE ELLE TREMBLERAIT.
  // Trouvé à la relecture hostile du §7, pas à l'écriture. Un attaquant ne
  // change pas de colonne : sa colonne est FIXE, et une défenseuse qui la
  // dépasse repart en sens inverse au tick suivant, puis revient — elle
  // oscille pour toujours. Mesuré sur le cas nu : cible en 5 000, défenseuse en
  // 4 970, pas de 40 → 5 010 (case 5), puis 4 970 (case 4), puis 5 010… Deux
  // cases qu'elle prend et rend à chaque tick, avec l'occupation qui suit.
  //
  // ⚠ ET C'EST LA MÊME FAUTE QUE `Math.floor` DANS `positionInterpolee`, VUE PAR
  // L'AUTRE BOUT : là-bas le DESSIN dépassait sa destination, ici c'est le
  // MODÈLE. Les deux naissent du même fait — la colonne a cessé d'être
  // monotone — et le lot doit les corriger toutes les deux.
  const ecart = Math.abs(cible.colonneMilli - e.colonneMilli);
  const pas = Math.min(vitesseLaterale(etat, e, p, obstacles, rangee), ecart);
  const destinationMilli = e.colonneMilli + sens * pas;
  if (estSortiParLeCote(destinationMilli)) return;

  const caseDestination = caseDepuisMilli(destinationMilli);
  if (caseDestination === colonne) {
    // ⚠⚠⚠ ELLE NE FLUE PLUS DANS LE MUR NON PLUS — ETHAN, 10/09, LE JUMEAU
    // LATÉRAL DU POINT 2. Le premier jet du lot MUR n'a corrigé qu'`avancer`,
    // donc le camp qui ATTAQUE ; la défense des DEUX camps passe ici depuis le
    // lot COLONNE, et cette branche-ci portait EXACTEMENT le même défaut, tourné
    // de quatre-vingt-dix degrés. Elle est le raccourci « je bouge dans ma
    // propre case » : elle écrivait `colonneMilli` SANS jamais regarder
    // l'occupation, si bien que la pièce rampait jusqu'au bord extrême de sa
    // case, puis calait quand le pas suivant aurait franchi la frontière.
    //
    // ⚠⚠ MESURÉ AVANT DE TOUCHER UNE LIGNE, défenseuse en colonne 4, merlon en
    // colonne 5, cible en colonne 8 : elle partait de 4 000 et se figeait à
    // **4 960** — 96 % dans la case du merlon. Le MÊME 960 millièmes que le
    // Meute à la verticale, qui montait à 2 960. Trois montages sur trois
    // (`meute`, `guetteur`, `ratisseur`) rendent le même nombre.
    //
    // ⚠ ET LE PÉRIMÈTRE EST CELUI DE LA VERTICALE, PAS UN AUTRE : on ne se range
    // que devant une STRUCTURE IMMOBILE. Ethan nomme « un mur, tourelles,
    // structure » — les trois sont à `vitesseMilli === 0`. Devant une alliée
    // MOBILE, la case se libérera d'elle-même, et ranger lui coûterait à chaque
    // fois les millièmes qu'elle vient de gagner. `MUR T6 bis` mesure les deux.
    if (chevauchementInterdit) {
      e.colonneMilli = milliDepuisCase(colonne);
      return;
    }
    // Elle se décale À L'INTÉRIEUR de sa case : rien à réserver, rien à libérer.
    e.colonneMilli = destinationMilli;
    return;
  }
  if (!p.bloquant) {
    // Aviation : ni bloquée ni bloquante, elle ignore l'occupation. Aucune ne
    // défend aujourd'hui — `presentEnDefense` est faux pour les trois aéronefs —
    // mais la branche est écrite là où elle l'est déjà pour la verticale.
    e.colonneMilli = destinationMilli;
    return;
  }
  const indiceOccupante = occupantDe(occupation, rangee, caseDestination);
  if (indiceOccupante === undefined) {
    retirer(occupation, rangee, colonne);
    poser(occupation, rangee, caseDestination, e.indice);
    e.colonneMilli = destinationMilli;
    return;
  }
  const occupante = etat.entites[indiceOccupante];
  const po = profil(occupante);
  if (peutEcraser(etat, e, p, occupante, po)) {
    occupante.pvMilli = 0;
    occupante.vivant = false;
    occupante.ecrase = true;
    // ⚠ LA TROISIÈME MORT DU MOTEUR, ET ELLE EST DU MÊME GENRE QUE LA DEUXIÈME :
    // un écrasement tue à l'étape 7, donc APRÈS `retirerLesMorts`. Le journal
    // s'y accroche ici comme il s'y accroche dans `avancer`, faute de quoi une
    // mort latérale manquerait au relevé — c'est la faute que le lot
    // JOURNAL-DE-COMBAT a payée une fois.
    etat.journal.destructions.push(faitDeLEntite(occupante));
    retirer(occupation, rangee, caseDestination);
    retirer(occupation, rangee, colonne);
    poser(occupation, rangee, caseDestination, e.indice);
    e.colonneMilli = destinationMilli;
  }
  // Masse égale ou inférieure : blocage, aucun décalage. « Peu importe si elle
  // se bloque » — Ethan, 06/09. Elle reste où elle est et retentera au tick
  // suivant.
}

/**
 * Le déplacement VERTICAL d'un attaquant — le corps de l'étape 7 tel qu'il
 * existe depuis le lot 2A, EXTRAIT sans qu'une ligne de sa logique ne change.
 * Strictement vertical, des rangées basses vers les hautes : aucun pathfinding,
 * aucune sortie de colonne. C'est ce que le terrain est censé compenser.
 * Itération dans l'ordre d'insertion, stable et consigné.
 */
function avancer(etat, e, p, occupation, obstacles) {
  const rangee = caseDepuisMilli(e.rangeeMilli);
  const colonne = caseColonne(e);
  const vitesse = vitesseDuTick(etat, e, p, obstacles, rangee);

  const destinationMilli = e.rangeeMilli + vitesse;
  const caseDestination = caseDepuisMilli(destinationMilli);
  // ⚠⚠⚠ LA CASE DEVANT, NOMMÉE UNE FOIS ET DONNÉE À SES DEUX LECTEURS — LE
  // PIÈGE DE L'ÉCRASEUR, TROUVÉ PAR EXÉCUTION ET PAS PAR RELECTURE.
  // `caseDestination` NE la désigne pas : une entité RANGÉE sur sa case repart
  // de `rangee * 1 000`, donc `caseDestination` revaut `rangee` tant que la
  // vitesse est sous 1 000 millièmes — et aucune ne l'atteint, 300 au plus.
  // Laissé au forçage, il ferait chercher la structure SOUS l'entité
  // elle-même : `structureForcee` y trouverait l'entité, la refuserait sur
  // `occupante.camp === e.camp`, et l'Écraseur cesserait d'ouvrir la brèche EN
  // SILENCE. `ARRÊT T7` tombe si on l'ignore, `MUR T5` le double côté « case
  // devant ».
  const caseDevant = rangee + 1;
  const chevauchementInterdit = chevauchementInterditSur(etat, e, p, occupation, caseDevant, colonne);
  const gelParUneAlliee = allieeDevant(etat, e, p, occupation, caseDevant, colonne);

  // Une unité arrêtée pour casser un bâtiment ne PROGRESSE pas : elle a choisi
  // de combattre plutôt que d'avancer. Son tir porte forcément — `doitSArreter`
  // exige `aTire` —, donc `nuit` la garde en jeu et elle ne se replie pas.
  //
  // ⚠⚠⚠ ET UNE UNITÉ QUI SE RANGE NE PROGRESSE PAS NON PLUS — C'EST L'AUTRE
  // MOITIÉ DU PIÈGE DE L'ÉCRASEUR, ET ELLE A ÉTÉ TROUVÉE PAR EXÉCUTION APRÈS QUE
  // LA PREMIÈRE EUT ÉTÉ CORRIGÉE. `peutAvancer` rend VRAI dès que
  // `caseDestination === rangee` — « avancer à l'intérieur de sa case compte,
  // elle progresse » —, or une entité rangée ne bouge plus d'un millième. Sans
  // ce terme, `progresse` resterait VRAI pour toujours devant le mur, le
  // forçage ne serait JAMAIS calculé, et l'Écraseur cesserait d'ouvrir la brèche
  // — en silence, exactement comme si `caseDestination` était resté au forçage.
  // Mesuré sur la scène d'`ARRÊT T7` avant correction : écart de forçage ZERO sur
  // cent-vingt ticks. `MUR T5` monte cette scène-là.
  //
  // ⚠ ET LE REPLI NE S'EN TROUVE PAS OUVERT POUR AUTANT : `ticksInutiles` est
  // remis à zéro par `nuit(e)` dès que la pièce TIRE sur ce qui la bloque, ce
  // qu'elle fait toujours. `ARRÊT T8` le mesure sur les deux pièces — celle qui
  // force et celle qui ne fait que tirer.
  const arrete = doitSArreter(etat, e, p);
  const progresse = !arrete && !chevauchementInterdit
    && peutAvancer(etat, e, p, occupation, rangee, caseDestination);

  // ÉCRASEUR — forcer la structure qui barre la colonne.
  //
  // ⚠ AVANT LE REPLI, ET AVANT LE `return` DE L'ARRÊT. « En plus de ses tirs
  // ordinaires » : une unité qui force n'est pas inutile — sans ce calcul ici,
  // `TICKS_AVANT_REPLI` (30) la ferait rentrer à la base bien avant les 100
  // ticks qu'il faut pour ouvrir la brèche.
  //
  // ⚠⚠ ET LE MOTIF A CHANGÉ AU LOT ARRÊT, PAS LE CODE. Il disait « une unité
  // arrêtée pour tirer sur le mur le force AUSSI » : depuis que `doitSArreter`
  // lit le genre, personne ne s'arrête plus POUR un mur. Ce qui retient l'unité
  // devant lui est `peutAvancer`, et ce qui la garde utile est son TIR. Le
  // forçage reste ce qui ouvre la brèche, et il reste réservé aux porteurs de
  // l'Écraseur.
  const forcee = progresse
    ? undefined
    : structureForcee(etat, e, p, occupation, caseDevant);
  if (forcee !== undefined) {
    const degats = Math.max(1, Math.floor((forcee.pvMaxMilli * ECRASEUR_PCT_PAR_TICK) / 100));
    forcee.pvMilli = Math.max(0, forcee.pvMilli - degats);
  }

  // REPLI. Une unité offensive qui ne peut ni avancer ni nuire pendant
  // TICKS_AVANT_REPLI ticks consécutifs rentre à la base : elle sort du champ
  // sans être détruite, et compte parmi les survivants. Le compteur se remet
  // à zéro dès qu'une des deux conditions cesse d'être vraie — un blocage est
  // souvent transitoire.
  //
  // ⚠⚠ IL RESTE SOUS GARDE DE CAMP PARCE QU'IL EST DANS `avancer`, ET C'EST LA
  // MOITIÉ DU LOT COLONNE. Son commentaire dit « une unité OFFENSIVE […] rentre
  // à la base » ; ouvert à la garnison, il ferait quitter le terrain à une
  // défenseuse bloquée, qui n'a pas de base où rentrer.
  //
  // ⚠⚠ ET LE COMPTEUR EST GELÉ DANS LA VOIE D'APPROCHE — LOT APPROCHE, 11/09.
  // Le cas nominal n'en a pas besoin : une approchante PROGRESSE à chaque tick,
  // donc son compteur retombe à zéro tout seul. **Mais une approchante BLOQUÉE
  // derrière une alliée dans sa colonne ne progresse pas, ne nuit pas — le
  // verrou de `ciblage` l'en empêche — et ne force rien : au trentième tick elle
  // passerait `sorti = true` et quitterait le raid SANS Y ÊTRE JAMAIS ENTRÉE.**
  // La vague 2 naît au tick 50, c'est-à-dire à l'instant où une lente finit tout
  // juste d'entrer : la voie va se congestionner chez les unités à `vitesse: 60`,
  // et ce gel n'est donc pas une précaution.
  //
  // ⚠ ON NE REMET PAS À ZÉRO, ON N'INCRÉMENTE PAS : le compteur est LAISSÉ TEL
  // QUEL, pour qu'une unité qui entre déjà bloquée reprenne son décompte là où
  // la grille commence, et non trente ticks plus tard.
  //
  // ⚠⚠ ET IL EST GELÉ DERRIÈRE UNE ALLIÉE, PARTOUT SUR LA GRILLE — LOT
  // BARÈME-ET-REJEU, 12/09. C'est le SECOND gel, et il ne remplace pas celui de
  // la voie d'approche : celui-là tient une case précise, celui-ci une RELATION.
  // Ethan, sur une vraie partie : « les véhicules étaient à 80 % sur
  // l'infanterie, plutôt que d'attendre derrière. Puis ils ont disparu. Mais 0
  // détruit. » Les deux moitiés de la phrase sont deux règles distinctes — le
  // chevauchement, corrigé par `chevauchementInterditSur` plus haut, et la DISPARITION,
  // qui est ce gel-ci. Une unité qui attend derrière une alliée ne progresse pas,
  // ne nuit pas et ne force rien : au trentième tick elle passait `sorti = true`
  // et quittait le raid, ce qu'Ethan lisait « elles ont disparu, mais 0
  // détruit ». **Attendre son tour n'est pas être inutile.**
  //
  // ⚠⚠ ET IL NE VAUT QUE DERRIÈRE UNE ALLIÉE, JAMAIS DEVANT UNE STRUCTURE. Les
  // deux prédicats sont donc DEUX fonctions, et `allieeDevant` ne se dérive pas
  // de `chevauchementInterditSur` : celle-ci est vraie aussi devant une structure
  // immobile, et c'est très exactement le cas où `TICKS_AVANT_REPLI` DOIT mordre
  // — une unité plantée devant un mur qu'elle ne sait pas ouvrir doit rentrer, et
  // `MUR T6 bis` le garde. Deux questions voisines, deux fonctions ; les fondre
  // rendrait le repli inatteignable devant un mur.
  //
  // ⚠ ET IL NE GÈLE PAS DEVANT UNE ENNEMIE NON PLUS : `allieeDevant` compare les
  // CAMPS. Une attaquante bloquée par une défenseuse qu'elle ne peut pas viser
  // rentre à la base comme avant — c'est le montage de `test/combat.test.js`, un
  // Ratisseur derrière un Bélier, et il est resté vert sans qu'une ligne y change.
  if (progresse || nuit(e) || forcee !== undefined) {
    e.ticksInutiles = 0;
  } else if (!estEnApproche(e.rangeeMilli) && !gelParUneAlliee) {
    e.ticksInutiles += 1;
    if (e.ticksInutiles >= TICKS_AVANT_REPLI) {
      e.sorti = true;
      // Sa case se libère immédiatement : un allié derrière elle peut
      // repartir dès ce tick.
      retirer(occupation, rangee, colonne);
      return;
    }
  }
  if (arrete) return;

  if (caseDestination === rangee) {
    // ⚠⚠ ELLE NE FLUE PLUS DANS LE MUR — ETHAN, 10/09, POINT 2 : « Un mur,
    // tourelles, structure bloque. Donc une unité s'arrête avant, pas dedans.
    // Ou peut-être que la hitbox est mal faite ? » CE N'EST PAS LA HITBOX,
    // C'EST LA POSITION. `MILLI_PAR_CASE` vaut 1 000 et `caseDepuisMilli` est
    // un `floor` : cette branche faisait avancer l'entité À L'INTÉRIEUR de sa
    // propre case, jusqu'à 999 millièmes, sans jamais regarder si la case
    // suivante était franchissable. Une unité arrêtée à 5 900 est en case 5
    // pour le moteur et DESSINÉE à 90 % sur la case 6 — celle du mur — par
    // `yDeRangeeMilli`, qui projette la position et non l'index.
    //
    // ⚠ ET ELLE SE RANGE, ELLE NE S'IMMOBILISE PAS : `rangeeMilli` retombe sur
    // le multiple exact, donc l'entité repart de sa case entière dès que la
    // structure tombe. Rien n'est mémorisé, aucun champ n'entre dans l'état, et
    // `SAVE_VERSION` n'a pas à bouger.
    if (chevauchementInterdit) {
      e.rangeeMilli = milliDepuisCase(rangee);
      return;
    }
    e.rangeeMilli = destinationMilli;
    return;
  }
  if (caseDestination > DERNIERE_RANGEE) {
    // Seule l'aviation traversante franchit le fond : elle sort du combat et
    // n'y revient pas. Le sol et l'aviation stoppeuse s'arrêtent au fond.
    if (p.comportementAerien === 'traversant') {
      e.rangeeMilli = destinationMilli;
      e.sorti = estSortiParLeHaut(destinationMilli);
    }
    return;
  }
  if (!p.bloquant) {
    // Aviation : ni bloquée ni bloquante, elle ignore l'occupation.
    e.rangeeMilli = destinationMilli;
    return;
  }

  const indiceOccupante = occupantDe(occupation, caseDestination, colonne);
  if (indiceOccupante === undefined) {
    retirer(occupation, rangee, colonne);
    poser(occupation, caseDestination, colonne, e.indice);
    e.rangeeMilli = destinationMilli;
    return;
  }
  const occupante = etat.entites[indiceOccupante];
  const po = profil(occupante);
  if (peutEcraser(etat, e, p, occupante, po)) {
    occupante.pvMilli = 0;
    occupante.vivant = false;
    occupante.ecrase = true;
    // ⚠⚠ LA SECONDE MORT DU MOTEUR, ET ELLE A ÉTÉ TROUVÉE PAR UN TEST, PAS PAR
    // RELECTURE. Le premier jet du lot JOURNAL-DE-COMBAT n'accrochait le journal
    // qu'à `retirerLesMorts` en écrivant que c'était « la seule ligne qui fasse
    // passer `vivant` à faux » — c'était FAUX, un écrasement tue à l'étape 7.
    // Mesuré : une pièce sur vingt-trois manquait au journal sur la graine 9,
    // et rien d'autre ne l'aurait dit.
    //
    // ⚠ ET LA POSITION EST CELLE DE L'ÉCRASÉE, PAS DE L'ÉCRASEUSE : elle meurt
    // là où elle était, sur la case que l'autre vient de lui prendre.
    etat.journal.destructions.push(faitDeLEntite(occupante));
    retirer(occupation, caseDestination, colonne);
    retirer(occupation, rangee, colonne);
    poser(occupation, caseDestination, colonne, e.indice);
    e.rangeeMilli = destinationMilli;
  }
  // Masse égale ou inférieure : blocage, aucune avance. La structure forcée,
  // elle, a déjà encaissé ses 1 % plus haut : elle tombera, et l'unité
  // avancera au tick suivant — `retirerLesMorts` passe avant `deplacement`.
}

/**
 * Une case peut-elle accueillir une entité qui y SORTIRAIT ?
 *
 * ⚠ C'EST LE TEST D'`apparitionDeVague`, ÉCRIT UNE FOIS DE PLUS ET PAS UNE FOIS
 * AUTREMENT : dans la grille, sans obstacle, et sans occupante bloquante. La
 * différence est qu'ici on ne peut pas LEVER — `ajouterEntite` refuse une case
 * hors grille ou sur un obstacle par une exception, ce qui serait la fin du
 * combat au lieu d'une sortie retardée d'un tick.
 */
function caseAccueille(occupation, obstacles, p, rangee, colonne) {
  if (!estDansLaGrille(rangee, colonne)) return false;
  if (typeObstacleSur(obstacles, rangee, colonne) !== undefined) return false;
  return !p.bloquant || occupantDe(occupation, rangee, colonne) === undefined;
}

/**
 * 7 bis. Le débarquement des passagers du module Garnison.
 *
 * ⚠⚠ APRÈS `retirerLesMorts` ET APRÈS `deplacement`, ET LES DEUX COMPTENT.
 * Après le retrait des morts, parce qu'un porteur détruit à l'étape 6 doit
 * rendre son passager AU MÊME TICK ; après le déplacement, parce qu'un porteur
 * qui franchit la ligne à l'étape 7 doit la rendre au tick du franchissement, et
 * pas au suivant. Le passager sort donc de la rangée où le porteur EST, jamais
 * de celle où il était.
 *
 * DEUX CONDITIONS, ET UNE SEULE SUFFIT — Ethan, 08/09 : « elle débarque derrière
 * lui quand il a franchi les huit rangées de défense, ou quand il est détruit,
 * sans pénalité ».
 *
 * ⚠⚠ LE PORTEUR QUI RENTRE À LA BASE EMMÈNE SON PASSAGER. Un porteur qui passe
 * `sorti` par le repli n'a rien débarqué : le passager rentre AVEC lui, et il
 * compte parmi les survivants. Sans cette règle, il resterait embarqué pour
 * toujours dans un porteur absent, et il compterait parmi les survivants sans
 * qu'on sache où il est.
 *
 * ⚠ AUCUNE CASE LIBRE : IL RESTE EMBARQUÉ, ET ON RÉESSAIE AU TICK SUIVANT. C'est
 * le comportement d'`etat.enAttente`, et c'est le seul qui ne perde personne.
 *
 * ⚠ ET SI LE PORTEUR EST MORT, SA DERNIÈRE POSITION SERT D'ANCRAGE : une entité
 * morte ne bouge plus, `rangeeMilli` et `colonneMilli` disent donc où elle est
 * tombée.
 */
function debarquements(etat) {
  let occupation = null;
  let obstacles = null;
  for (const e of etat.entites) {
    if (e.embarquee !== true) continue;
    const porteur = etat.entites[e.porteurIndice];
    if (porteur.sorti) {
      // Il n'a pas débarqué, il est rentré : `embarquee` reste vrai, il est
      // toujours dans le véhicule.
      e.sorti = true;
      continue;
    }
    const rangeePorteur = caseDepuisMilli(porteur.rangeeMilli);
    if (porteur.vivant && rangeePorteur < RANGEE_DEFENSE_FRANCHIE) continue;

    // ⚠ L'OCCUPATION SE CONSTRUIT AU PREMIER DÉBARQUEMENT, PAS À CHAQUE TICK.
    // Elle est dérivée, donc chère ; la plupart des ticks n'en ont aucun besoin.
    if (occupation === null) {
      occupation = construireOccupation(etat);
      obstacles = obtenirIndexObstacles(etat);
    }
    const p = profil(e);
    const colonne = caseColonne(porteur);
    // ⚠⚠ L'AÉRONEF LARGUE DESSOUS S'IL Y A DE LA PLACE, SINON DERRIÈRE — Ethan,
    // 08/09. Le discriminant est `bloquant`, c'est-à-dire la masse nulle, et pas
    // une liste de châssis : une pièce qui deviendrait aérienne suivrait la
    // règle sans qu'on y touche. Un porteur terrestre, lui, occupe sa propre
    // case : il n'a que celle de derrière à offrir.
    const essais = profil(porteur).bloquant
      ? [rangeePorteur - 1]
      : [rangeePorteur, rangeePorteur - 1];
    for (const rangee of essais) {
      if (!caseAccueille(occupation, obstacles, p, rangee, colonne)) continue;
      e.rangeeMilli = milliDepuisCase(rangee);
      e.colonneMilli = milliDepuisCase(colonne);
      e.embarquee = false;
      if (p.bloquant) poser(occupation, rangee, colonne, e.indice);
      // ⚠ ELLE ENTRE PAR LE CANAL D'UNE VAGUE, ET C'EST TOUT CE QU'IL FALLAIT.
      // Le rendu et le pack sonore voient une unité entrer sans que ni l'un ni
      // l'autre ait à connaître le module Garnison.
      etat.journal.apparitions.push(faitDeLEntite(e));
      break;
    }
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
  // ⚠⚠ LE JOURNAL SE VIDE ICI, ET NULLE PART AILLEURS. C'est ce qui borne sa
  // durée de vie à UN tick — la même que celle du tampon de `tir`, qui existait
  // déjà. Le vider en fin de tick le rendrait illisible à l'appelant ; le
  // laisser courir en ferait une liste de dizaines de milliers d'objets sous
  // « Instantané ».
  etat.journal = journalVide(); //               0. le journal ne s'accumule pas
  expirerEffets(etat); //                        1. expiration des effets
  apparitionDeVague(etat); //                    2. apparition de vague
  ciblage(etat); //                              3. ciblage
  declencherNeutralisations(etat); //            3 bis. flashbang et EMP
  const tampon = tir(etat); //                   4. tir, simultané
  appliquerDegats(etat, tampon); //              5. application du tampon
  retirerLesMorts(etat); //                      6. retrait des morts
  declencherBoosters(etat); //                   6 bis. réaction aux blessures
  deplacement(etat); //                          7. déplacement
  debarquements(etat); //                        7 bis. débarquement des passagers
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
    // ⚠ LA CASE OÙ ELLE FINIT, ET ELLE PEUT AVOIR CHANGÉ DEPUIS LE LOT COLONNE.
    // Une défenseuse se décale ; le champ dit donc où elle est à la fin du
    // raid. C'est informatif et rien ne s'y adosse : `reprojeter` de
    // `site-entame.js` apparie par INDICE, jamais par position — vérifié —, et
    // `raid-ouvrage.js` recopie les PV sur la garnison par `indicesDefenseurs`.
    // Une pièce que le joueur a posée ne bouge donc pas de sa case.
    colonne: caseColonne(e),
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
  // ⚠ LA BRANCHE `defense`, ET PAS `offense`. Le bonus porte sur le module qu'une
  // pièce de GARNISON emploie ; lire l'offense ici referait, côté liste, le
  // mensonge que MODULES-D a démêlé côté profil.
  //
  // ⚠ ET `montage.proprietaireDefense`, PAS `'ouvrage'` EN DUR. Le banc monte
  // des combats où le joueur défend, et c'est le seul chemin qui exercera ce
  // code le jour où les attaques sur la base existeront.
  const quiDefend = montage.proprietaireDefense ?? 'ouvrage';
  const debloques = new Set(montage.modulesDebloques?.[quiDefend]?.defense ?? []);
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
