// Générateur de site déterministe — lot 2B.
//
// À partir de (type, niveau, saveur, graine), produit un MONTAGE valide pour
// creerCombat : grille peuplée, obstacles posés, densités et compositions
// tirées des tables de src/data/. C'est la pièce qui manquait pour jouer un
// raid de bout en bout.
//
// DÉTERMINISME. Le seul hasard est le PRNG du lot 1, semé par `graine` :
// mêmes paramètres, même graine, même site, au bit près. Aucun autre tirage,
// aucune lecture de l'horloge murale.
//
// ARITHMÉTIQUE. Aucun flottant ne sort d'ici. Les pourcentages des tables sont
// convertis en MILLIÈMES entiers dès la lecture, les interpolations se font
// numérateur et dénominateur entiers avec un seul arrondi en bout, et les
// répartitions retombent juste par la méthode du plus grand reste. C'est aussi
// pourquoi la base ne se calcule pas en « × 1,1 » : au niveau 40, 35 × 1,1
// tombe exactement sur 38,5, que JavaScript arrondit à 39 et qu'un autre
// langage arrondirait à 38. Un effectif ne peut pas dépendre de ça.

import { creerRng, entier, melanger } from './rng.js';
import { GRILLE, OBSTACLES, UNITES, DEFENSES } from '../data/combat.js';
import {
  BATIMENTS,
  DENSITE,
  GARNISON,
  VAGUES,
  SAVEURS,
  TYPES_SITE,
  RAID_OUVRAGE,
  DISPOSITION_DEFENSES,
  POINTS_ARMEE,
  PROFILS_ASSAUT,
  EMPLACEMENTS_ASSAUT,
} from '../data/sites.js';
import { NIVEAU } from '../data/niveaux.js';
import { enEntier, cleCase, estDansLaBande } from './grille.js';

const MILLE = 1000;

// ---------------------------------------------------------------------------
// Outils entiers
// ---------------------------------------------------------------------------

/** Paliers d'une table indexée par niveau, triés croissants. */
function paliers(table) {
  return Object.keys(table).map(Number).sort((a, b) => a - b);
}

/**
 * Interpolation linéaire entière, arrondie au demi supérieur.
 * `floor((2 × (bas × portee + (haut − bas) × delta) + portee) / (2 × portee))`
 * — un seul arrondi, en bout, et pas un flottant en chemin.
 */
function interpolerEntier(bas, haut, delta, portee) {
  if (portee === 0) return bas;
  const numerateur = bas * portee + (haut - bas) * delta;
  return Math.floor((2 * numerateur + portee) / (2 * portee));
}

/** Encadre un niveau par deux paliers de la table, bornes comprises. */
function encadrer(table, niveau) {
  const cles = paliers(table);
  const premier = cles[0];
  const dernier = cles[cles.length - 1];
  if (niveau <= premier) return { bas: premier, haut: premier, delta: 0, portee: 0 };
  if (niveau >= dernier) return { bas: dernier, haut: dernier, delta: 0, portee: 0 };
  let bas = premier;
  for (const c of cles) {
    if (c <= niveau) bas = c;
    else return { bas, haut: c, delta: niveau - bas, portee: c - bas };
  }
  return { bas: dernier, haut: dernier, delta: 0, portee: 0 };
}

/**
 * Répartit `total` unités selon des poids en millièmes, au PLUS GRAND RESTE :
 * la somme retombe exactement sur `total`. À égalité de reste, l'ordre
 * d'insertion tranche — stable, donc reproductible.
 * @returns {Map<string, number>}
 */
function auPlusGrandReste(poidsMilli, total) {
  const somme = [...poidsMilli.values()].reduce((a, b) => a + b, 0);
  if (somme !== MILLE) {
    throw new Error(`générateur : poids sommant à ${somme} millièmes au lieu de ${MILLE}`);
  }
  const lignes = [];
  let attribue = 0;
  let rang = 0;
  for (const [id, poids] of poidsMilli) {
    const exact = poids * total;
    const part = Math.floor(exact / MILLE);
    lignes.push({ id, part, reste: exact - part * MILLE, rang: rang++ });
    attribue += part;
  }
  const ordre = [...lignes].sort((a, b) => b.reste - a.reste || a.rang - b.rang);
  for (let k = 0; k < total - attribue; k++) ordre[k].part += 1;
  const sortie = new Map();
  for (const l of lignes) if (l.part > 0) sortie.set(l.id, l.part);
  return sortie;
}

/** Renormalise des poids entiers quelconques en millièmes sommant à 1000. */
function renormaliser(poids) {
  const somme = [...poids.values()].reduce((a, b) => a + b, 0);
  if (somme <= 0) throw new Error('générateur : répartition vide, rien à renormaliser');
  const lignes = [];
  let attribue = 0;
  let rang = 0;
  for (const [id, p] of poids) {
    const exact = p * MILLE;
    const part = Math.floor(exact / somme);
    lignes.push({ id, part, reste: exact - part * somme, rang: rang++ });
    attribue += part;
  }
  const ordre = [...lignes].sort((a, b) => b.reste - a.reste || a.rang - b.rang);
  for (let k = 0; k < MILLE - attribue; k++) ordre[k % ordre.length].part += 1;
  const sortie = new Map();
  for (const l of lignes) if (l.part > 0) sortie.set(l.id, l.part);
  return sortie;
}

// ---------------------------------------------------------------------------
// Lecture des tables
// ---------------------------------------------------------------------------

/** Niveau d'apparition d'un identifiant, unité mobile ou structure. */
function apparitionDe(id) {
  if (Object.prototype.hasOwnProperty.call(DEFENSES, id)) return DEFENSES[id].apparition;
  if (Object.prototype.hasOwnProperty.call(UNITES, id)) return UNITES[id].apparition;
  throw new Error(`générateur : identifiant inconnu « ${id} »`);
}

/** Catégorie de placement d'un défenseur : type de structure, ou « unite ». */
function categorieDe(id) {
  if (Object.prototype.hasOwnProperty.call(DEFENSES, id)) return DEFENSES[id].type;
  return 'unite';
}

/**
 * Répartition interpolée d'une table de pourcentages, en millièmes — la
 * COURBE NUE, avant variance. Exportée : c'est la référence à laquelle une
 * garnison tirée doit rester comparable, et l'interface aura besoin de la même
 * chose pour annoncer une composition attendue.
 * Les pourcentages des tables portent des demis (12,5 · 7,5 · 17,5) : ils
 * passent en dixièmes de point, donc en millièmes, sans perte.
 */
export function repartitionInterpolee(table, niveau) {
  const { bas, haut, delta, portee } = encadrer(table, niveau);
  const ids = new Set([...Object.keys(table[bas]), ...Object.keys(table[haut])]);
  const poids = new Map();
  for (const id of ids) {
    const pBas = enEntier(table[bas][id] ?? 0, 10, `répartition ${id} au palier ${bas}`);
    const pHaut = enEntier(table[haut][id] ?? 0, 10, `répartition ${id} au palier ${haut}`);
    const p = interpolerEntier(pBas, pHaut, delta, portee);
    if (p > 0) poids.set(id, p);
  }
  return poids;
}

/**
 * Variance de ±`points` autour de la courbe, tirée au PRNG, puis filtrage des
 * entités encore verrouillées et renormalisation à 1000.
 *
 * Le filtrage est fait AVANT et APRÈS la variance : c'est par ce chemin qu'une
 * entité verrouillée se glisse dans une garnison, la variance pouvant faire
 * remonter une ligne à zéro.
 */
function composerRepartition(rng, table, niveau, variancePoints) {
  const brut = repartitionInterpolee(table, niveau);
  const varianceMilli = variancePoints * 10;

  const filtree = new Map();
  for (const [id, p] of brut) if (apparitionDe(id) <= niveau) filtree.set(id, p);
  if (filtree.size === 0) {
    throw new Error(`générateur : aucune entité débloquée au niveau ${niveau}`);
  }

  const variee = new Map();
  for (const [id, p] of filtree) {
    const ecart = entier(rng, -varianceMilli, varianceMilli);
    const valeur = Math.max(0, p + ecart);
    if (valeur > 0) variee.set(id, valeur);
  }
  // La variance peut tout ramener à zéro : on retombe alors sur la courbe nue.
  const base = variee.size > 0 ? variee : filtree;

  const sure = new Map();
  for (const [id, p] of base) if (apparitionDe(id) <= niveau) sure.set(id, p);
  return renormaliser(sure);
}

// ---------------------------------------------------------------------------
// Densité
// ---------------------------------------------------------------------------

/** Facteur de la base, en millièmes : un avant-poste de même niveau + 10 %. */
const FACTEUR_BASE_MILLI = enEntier(DENSITE.facteurBase, MILLE, 'DENSITE.facteurBase');

/**
 * Effectifs d'un site : bâtiments et défenses.
 * Sous le premier palier on borne au premier, au-delà du dernier au dernier.
 * @param {string} type 'camp' | 'avantPoste' | 'base'
 * @param {number} niveau
 */
export function densite(type, niveau) {
  const { bas, haut, delta, portee } = encadrer(DENSITE.parNiveau, niveau);
  const lire = (palier, cle, champ) => DENSITE.parNiveau[palier][cle][champ];
  const cle = type === 'base' ? 'avantPoste' : type;
  const brut = {
    batiments: interpolerEntier(lire(bas, cle, 'batiments'), lire(haut, cle, 'batiments'), delta, portee),
    defenses: interpolerEntier(lire(bas, cle, 'defenses'), lire(haut, cle, 'defenses'), delta, portee),
  };
  if (type !== 'base') return brut;
  // Arrondi au demi supérieur, en entiers : jamais « × 1,1 » en flottant.
  const majorer = (n) => Math.floor((n * FACTEUR_BASE_MILLI + MILLE / 2) / MILLE);
  return { batiments: majorer(brut.batiments), defenses: majorer(brut.defenses) };
}

// ---------------------------------------------------------------------------
// Composition et placement
// ---------------------------------------------------------------------------

/** Les colonnes de la grille, dans l'ordre. */
function colonnes() {
  return Array.from({ length: GRILLE.largeur }, (_, i) => i + 1);
}

/**
 * Composition des bâtiments : exactement une Souche et un Étai, le reste
 * réparti selon BATIMENTS[x].part au plus grand reste.
 */
export function composerBatiments(nbBatiments) {
  const uniques = Object.entries(BATIMENTS).filter(([, b]) => b.unique).map(([id]) => id);
  if (nbBatiments < uniques.length) {
    throw new Error(
      `générateur : ${nbBatiments} bâtiments demandés, ${uniques.length} uniques obligatoires`,
    );
  }
  const parts = new Map();
  for (const [id, b] of Object.entries(BATIMENTS)) {
    if (b.unique) continue;
    parts.set(id, enEntier(b.part, MILLE, `BATIMENTS.${id}.part`));
  }
  const proportionnels = auPlusGrandReste(parts, nbBatiments - uniques.length);
  const liste = [...uniques];
  for (const [id, n] of proportionnels) for (let k = 0; k < n; k++) liste.push(id);
  return liste;
}

/**
 * Pose les bâtiments. Souche et Étai au FOND, rangée 18, aussi centrés que
 * possible : ce sont les deux objectifs du raid, ils doivent coûter la
 * traversée complète. Le reste se répartit sur les rangées 11 à 17, en
 * tourniquet sur une permutation des colonnes.
 */
function placerBatiments(rng, liste, niveau) {
  const fond = GRILLE.bandes.batiments.derniere;
  const premiere = GRILLE.bandes.batiments.premiere;
  const centre = Math.ceil(GRILLE.largeur / 2);
  const permutation = melanger(rng, colonnes());
  const poses = [];
  let rang = 0;
  for (const id of liste) {
    if (BATIMENTS[id].unique) {
      // Souche au centre exact, Étai immédiatement à sa gauche.
      const colonne = poses.length === 0 ? centre : centre - 1;
      poses.push({ id, rangee: fond, colonne, niveau });
      continue;
    }
    const colonne = permutation[rang % GRILLE.largeur];
    const rangee = premiere + Math.floor(rang / GRILLE.largeur);
    if (rangee >= fond) {
      throw new Error(`générateur : ${liste.length} bâtiments ne tiennent pas dans la bande`);
    }
    poses.push({ id, rangee, colonne, niveau });
    rang += 1;
  }
  return poses;
}

/**
 * Pose les défenses.
 *
 * Trois contraintes, satisfaites par CONSTRUCTION plutôt que par rattrapage :
 *
 *   1. les défenses occupent les rangées les plus ARRIÈRE de la bande, collées
 *      aux bâtiments — l'attaquant traverse d'abord du vide ;
 *   2. six occupants au plus par rangée de neuf colonnes, donc trois colonnes
 *      libres au minimum : sans passage, le terrain ne décide plus rien ;
 *   3. l'écart de charge entre colonnes n'excède jamais 2 — les unités ne
 *      changent jamais de colonne, une colonne à huit structures serait
 *      infranchissable et une colonne vide une autoroute.
 *
 * L'indice global i donne la colonne par `permutation[i % 9]` et la rangée par
 * `rangees[floor(i / 6)]`. Six indices consécutifs modulo neuf sont distincts,
 * donc aucune collision dans une rangée ; et chaque colonne reçoit floor(N/9)
 * ou ceil(N/9) défenses, donc un écart de 1 au plus.
 *
 * L'ordre de la liste porte le reste : artilleries d'abord, donc au fond. Une
 * artillerie a une portée minimale de 3,5 — posée à l'avant, elle ne tirerait
 * jamais.
 */
function placerDefenses(rng, liste, niveau) {
  const parRangee = DISPOSITION_DEFENSES.occupantsMaxParRangee;
  const bande = GRILLE.bandes.defense;
  const rangeesMax = bande.derniere - bande.premiere + 1;
  const nb = liste.length;
  const rangees = Math.min(rangeesMax, Math.ceil(nb / parRangee));
  if (nb > rangees * parRangee) {
    throw new Error(
      `générateur : ${nb} défenses ne tiennent pas en ${rangeesMax} rangées `
      + `à ${parRangee} occupants`,
    );
  }
  // Du fond vers l'avant : 10, 9, 8…
  const ordreRangees = [];
  for (let k = 0; k < rangees; k++) ordreRangees.push(bande.derniere - k);

  const permutation = melanger(rng, colonnes());
  const poses = [];
  for (let i = 0; i < nb; i++) {
    poses.push({
      id: liste[i],
      rangee: ordreRangees[Math.floor(i / parRangee)],
      colonne: permutation[i % GRILLE.largeur],
      niveau,
    });
  }
  return poses;
}

/** Trie les défenses du fond vers l'avant selon DISPOSITION_DEFENSES. */
function ordonnerDefenses(liste) {
  const ordre = DISPOSITION_DEFENSES.ordreCategories;
  return [...liste]
    .map((id, rang) => ({ id, rang, categorie: ordre.indexOf(categorieDe(id)) }))
    .sort((a, b) => a.categorie - b.categorie || a.rang - b.rang)
    .map((l) => l.id);
}

/**
 * Disperse les obstacles dans la bande de DÉFENSE, et sur aucune case déjà
 * occupée.
 *
 * ⚠ ILS COUVRAIENT LES RANGÉES 3 À 18 JUSQU'AU 29/08. Ethan : « obstacles
 * seulement en défense, réparti au hasard ». Le motif est un motif de jeu : un
 * obstacle dans la bande des bâtiments mange un emplacement de construction,
 * c'est-à-dire une décision d'urbanisme, alors qu'un obstacle dans la bande de
 * défense ralentit l'assaillant, c'est-à-dire une décision tactique.
 *
 * ⚠ CE N'EST PLUS QU'UNE MOITIÉ DE CE MODULE. Ces obstacles-ci se tirent de la
 * graine du SITE, donc changent à chaque instance. `obstaclesDeLaBase` de
 * sim/champs.js les tire de la CASE, donc les garde d'une instance à l'autre —
 * ce qu'Ethan a arbitré le 29/08 pour les camps successifs. Les deux devront se
 * rejoindre le jour où un site de l'Ouvrage saura d'où il est ; ce n'est pas
 * fait, et le savoir vaut mieux que de le découvrir.
 *
 * ⚠ LA BANDE DE DÉPLOIEMENT RESTE EXCLUE, mais elle l'est maintenant DEUX FOIS —
 * par elle-même et parce qu'elle n'est pas la bande de défense. Le test T9 qui
 * l'assertait continue de passer sans rien mesurer de nouveau : c'est
 * l'assertion sur la bande de défense, ajoutée le 29/08, qui porte la règle.
 */
function placerObstacles(rng, casesPrises) {
  const libres = [];
  for (let rangee = 1; rangee <= GRILLE.longueur; rangee++) {
    if (!estDansLaBande(rangee, 'defense')) continue;
    for (let colonne = 1; colonne <= GRILLE.largeur; colonne++) {
      if (!casesPrises.has(cleCase(rangee, colonne))) libres.push({ rangee, colonne });
    }
  }
  if (libres.length < OBSTACLES.nombre) {
    throw new Error(
      `générateur : ${libres.length} cases libres pour ${OBSTACLES.nombre} obstacles`,
    );
  }
  melanger(rng, libres);
  return libres.slice(0, OBSTACLES.nombre).map((c) => ({
    rangee: c.rangee,
    colonne: c.colonne,
    type: OBSTACLES.types[entier(rng, 0, OBSTACLES.types.length - 1)],
  }));
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

function verifierParametres({ type, niveau, saveur, graine }) {
  if (!Object.prototype.hasOwnProperty.call(TYPES_SITE, type)) {
    throw new Error(`générateur : type de site inconnu « ${type} »`);
  }
  if (!Number.isInteger(niveau) || niveau < 1 || niveau > NIVEAU.plafond) {
    throw new Error(`générateur : niveau ${niveau} hors de 1…${NIVEAU.plafond}`);
  }
  if (!Number.isInteger(graine)) {
    throw new Error(`générateur : graine ${graine} n'est pas un entier`);
  }
  if (saveur !== null && saveur !== undefined
      && !Object.prototype.hasOwnProperty.call(SAVEURS, saveur)) {
    throw new Error(`générateur : saveur inconnue « ${saveur} »`);
  }
  // La saveur est TRANSMISE, pas calculée — mais une base n'en porte pas.
  if (type === 'base' && saveur !== null && saveur !== undefined) {
    throw new Error(`générateur : une base ne porte pas de saveur (« ${saveur} »)`);
  }
}

/**
 * Les modules que l'Ouvrage a débloqués à un niveau de site donné.
 *
 * ⚠⚠ C'EST LE CANAL QUI N'AVAIT JAMAIS SERVI. `modulesDebloques.ouvrage` sortait
 * de `genererSite` avec ses deux branches VIDES depuis le lot 2B ; cinq modules
 * — Camouflage, Munition spéciale, PV +20 %, Rayon minimum −1, Vol de vie — ne
 * sont portés que par `moduleOuvrage`, donc inatteignables par la boutique. Sans
 * cette fonction, la moitié du catalogue restait décorative.
 *
 * ⚠ TOUTES LES PIÈCES DE LA TABLE, pas seulement celles que ce site-ci a tirées.
 * `apparitionModule` est un palier de progression de l'Ouvrage, pas une
 * propriété de la garnison du jour : deux sites de même niveau et de graines
 * différentes doivent débloquer les mêmes modules, sinon la liste devient un
 * effet de tirage et le joueur ne peut rien en apprendre.
 *
 * ⚠ `offense` RESTE VIDE, et ce n'est pas un oubli. Un module d'attaquant se lit
 * sur `p.module`, que `moduleOuvrage` ne renseigne pas ; les raids de l'Ouvrage
 * sur la base du joueur passent par un autre chemin. Y verser cette liste
 * armerait des modules sur des pièces qui ne les portent pas.
 *
 * @param {number} niveau niveau du site.
 * @returns {string[]} noms triés, sans doublon.
 */
function modulesOuvrageAu(niveau) {
  const noms = new Set();
  for (const table of [UNITES, DEFENSES]) {
    for (const piece of Object.values(table)) {
      if (!piece.moduleOuvrage) continue;
      if (piece.apparitionModule > niveau) continue;
      noms.add(piece.moduleOuvrage);
    }
  }
  return [...noms].sort();
}

/**
 * Produit un montage valide pour creerCombat.
 *
 * `vagues` est vide : la force d'assaut est celle du joueur, le générateur de
 * site ne la connaît pas. C'est à l'appelant de la composer — genererVague la
 * fournit pour les raids de l'Ouvrage.
 *
 * @param {{ type: string, niveau: number, saveur?: string|null, graine: number }} parametres
 * @returns {object} montage
 */
export function genererSite({ type, niveau, saveur = null, graine }) {
  verifierParametres({ type, niveau, saveur, graine });
  const rng = creerRng(graine);
  const effectifs = densite(type, niveau);

  const batiments = placerBatiments(rng, composerBatiments(effectifs.batiments), niveau);

  const garnison = composerRepartition(rng, GARNISON.parNiveau, niveau, GARNISON.variancePoints);
  const listeDefenses = [];
  for (const [id, n] of auPlusGrandReste(garnison, effectifs.defenses)) {
    for (let k = 0; k < n; k++) listeDefenses.push(id);
  }
  const defenseurs = placerDefenses(rng, ordonnerDefenses(listeDefenses), niveau);

  const casesPrises = new Set();
  for (const e of [...batiments, ...defenseurs]) casesPrises.add(cleCase(e.rangee, e.colonne));
  const obstacles = placerObstacles(rng, casesPrises);

  return {
    // ⚠ LE TYPE VOYAGE AVEC LE MONTAGE DEPUIS LE LOT MULTIPLICATEUR (29/08), et
    // il ne sert qu'à UNE chose : `butin` a besoin de savoir s'il paie un camp,
    // un avant-poste ou une base, puisque `TYPES_SITE[x].multiplicateurButin`
    // diffère de l'un à l'autre. Rien dans la boucle de combat ne le lit — un
    // avant-poste ne se bat pas autrement qu'un camp.
    type,
    niveau,
    saveur: saveur ?? null,
    obstacles,
    batiments,
    defenseurs,
    vagues: [],
    modulesDebloques: {
      ouvrage: { offense: [], defense: modulesOuvrageAu(niveau) },
      joueur: { offense: [], defense: [] },
    },
  };
}

/** Capacité de la bande de déploiement : deux rangées de neuf colonnes. */
const CASES_DEPLOIEMENT = (GRILLE.bandes.deploiement.derniere
  - GRILLE.bandes.deploiement.premiere + 1) * GRILLE.largeur;

/**
 * Tirage pondéré d'unités sous contrainte de budget et d'emplacements.
 *
 * C'est le cœur commun de `genererVague` (l'Ouvrage) et de `genererAssaut` (le
 * joueur) : une seule mécanique, pas deux. On tire une unité à la fois, par
 * ticket entier — un ticket par millième de la répartition —, en ne gardant
 * comme candidates que celles qui tiennent encore dans ce qui reste du budget.
 * La renormalisation aux seules candidates abordables est ce qui fait converger
 * le remplissage : quand il ne reste que 5 points, seules les unités à 5 points
 * peuvent sortir.
 *
 * @param {object} rng PRNG explicite, consommé dans l'ordre.
 * @param {Map<string, number>} repartition identifiant → poids en millièmes.
 * @param {number} budget points d'armée disponibles.
 * @param {number} maxEmplacements bornage physique, indépendant du budget.
 * @returns {{ choisis: string[], reste: number }}
 */
function tirerSousBudget(rng, repartition, budget, maxEmplacements) {
  const choisis = [];
  let reste = budget;
  while (choisis.length < maxEmplacements) {
    const candidats = [...repartition].filter(([id]) => UNITES[id].points <= reste);
    if (candidats.length === 0) break;
    const total = candidats.reduce((somme, [, p]) => somme + p, 0);
    let ticket = entier(rng, 1, total);
    let choisi = candidats[candidats.length - 1][0];
    for (const [id, p] of candidats) {
      ticket -= p;
      if (ticket <= 0) { choisi = id; break; }
    }
    choisis.push(choisi);
    reste -= UNITES[choisi].points;
  }
  return { choisis, reste };
}

/** Rang d'une unité dans l'ordre de vagues de l'Ouvrage. */
function rangSpecialite(id) {
  const rang = RAID_OUVRAGE.ordreVagues.indexOf(UNITES[id].specialite);
  return rang === -1 ? RAID_OUVRAGE.ordreVagues.length : rang;
}

/**
 * Compose une vague de l'Ouvrage : tirage dans VAGUES.parNiveau selon la même
 * mécanique que la garnison, puis remplissage jusqu'au budget de points
 * d'armée, SANS jamais le dépasser.
 *
 * Les entrées sortent triées par RAID_OUVRAGE.ordreVagues — anti-infanterie et
 * anti-véhicule d'abord, anti-structure ensuite : les unités qui s'arrêtent
 * passent devant, celles qui doivent arriver avec des munitions derrière.
 *
 * La vague est bornée par la bande de déploiement, dix-huit cases : au-delà, il
 * n'y a physiquement plus où poser une unité, et le budget restant est rendu.
 *
 * @returns {{ unites: Array<{id,colonne,rangee,niveau}>, pointsEngages: number,
 *   pointsRestants: number }}
 */
export function genererVague({ niveau, budgetPoints, graine }) {
  if (!Number.isInteger(niveau) || niveau < 1 || niveau > NIVEAU.plafond) {
    throw new Error(`générateur : niveau ${niveau} hors de 1…${NIVEAU.plafond}`);
  }
  if (!Number.isInteger(budgetPoints) || budgetPoints < 0) {
    throw new Error(`générateur : budget ${budgetPoints} doit être un entier ≥ 0`);
  }
  if (!Number.isInteger(graine)) {
    throw new Error(`générateur : graine ${graine} n'est pas un entier`);
  }
  const rng = creerRng(graine);
  const repartition = composerRepartition(rng, VAGUES.parNiveau, niveau, VAGUES.variancePoints);

  const { choisis, reste } = tirerSousBudget(rng, repartition, budgetPoints, CASES_DEPLOIEMENT);

  choisis.sort((a, b) => rangSpecialite(a) - rangSpecialite(b));
  const rangeeFront = GRILLE.bandes.deploiement.derniere;
  const unites = choisis.map((id, i) => ({
    id,
    colonne: (i % GRILLE.largeur) + 1,
    rangee: rangeeFront - Math.floor(i / GRILLE.largeur),
    niveau,
  }));
  return { unites, pointsEngages: budgetPoints - reste, pointsRestants: reste };
}

/** Budget de raid de l'Ouvrage pour un niveau de base, interpolé. */
export function budgetRaid(niveau) {
  const { bas, haut, delta, portee } = encadrer(RAID_OUVRAGE.budgetParNiveau, niveau);
  return interpolerEntier(
    RAID_OUVRAGE.budgetParNiveau[bas], RAID_OUVRAGE.budgetParNiveau[haut], delta, portee,
  );
}

// ---------------------------------------------------------------------------
// L'assaut du joueur — lot 4B
// ---------------------------------------------------------------------------

/** Emplacements d'un assaut : quatre vagues de neuf, soit 36. */
const CASES_ASSAUT = EMPLACEMENTS_ASSAUT.vagues * EMPLACEMENTS_ASSAUT.parVague;

/** Budget d'armée du joueur à un niveau donné : `base + parNiveau × niveau`. */
export function budgetAssaut(niveau) {
  if (!Number.isInteger(niveau) || niveau < 1 || niveau > NIVEAU.plafond) {
    throw new Error(`générateur : niveau ${niveau} hors de 1…${NIVEAU.plafond}`);
  }
  return POINTS_ARMEE.offense.base + POINTS_ARMEE.offense.parNiveau * niveau;
}

/**
 * Repondère une répartition d'unités selon des proportions de CHÂSSIS.
 *
 * La répartition d'entrée dit quelle unité a sa place à ce niveau ; le profil
 * dit quelle part revient à chaque châssis. On regroupe donc par châssis, on
 * renormalise la part de chacun sur les seuls châssis PRÉSENTS — un blindé
 * n'existe pas avant le niveau 12, sa part doit bien aller quelque part —, puis
 * on redistribue cette part entre les unités du châssis au prorata de leur poids
 * d'origine.
 *
 * Tout en entiers : le facteur MILLE² donne assez de marge pour que le plancher
 * n'écrase aucune unité, et `renormaliser` ramène la somme à 1000 millièmes.
 *
 * @returns {Map<string, number>|null} null si AUCUN châssis du profil n'est
 *   représenté — l'appelant retombe alors sur la répartition nue.
 */
function pondererParChassis(repartition, proportions) {
  const parChassis = new Map();
  for (const [id, p] of repartition) {
    const c = UNITES[id].chassis;
    if (!parChassis.has(c)) parChassis.set(c, []);
    parChassis.get(c).push([id, p]);
  }

  const actifs = [...parChassis.keys()].filter((c) => (proportions[c] ?? 0) > 0);
  if (actifs.length === 0) return null;
  const totalActif = actifs.reduce((somme, c) => somme + proportions[c], 0);

  const sortie = new Map();
  for (const c of actifs) {
    const lignes = parChassis.get(c);
    const sommeChassis = lignes.reduce((somme, [, p]) => somme + p, 0);
    for (const [id, p] of lignes) {
      const poids = Math.floor(
        (proportions[c] * MILLE * MILLE * p) / (totalActif * sommeChassis),
      );
      if (poids > 0) sortie.set(id, poids);
    }
  }
  return sortie.size > 0 ? renormaliser(sortie) : null;
}

/**
 * Compose l'assaut du joueur : même mécanique que `genererVague`, à deux
 * différences près — la répartition passe par les proportions de châssis du
 * profil, et le plafond d'emplacements est celui des quatre vagues et non de la
 * bande de déploiement.
 *
 * Trois garanties, éprouvées en test :
 *   — le coût total ne dépasse JAMAIS le budget ;
 *   — aucune unité dont `apparition > niveau` n'est retenue, le filtre étant
 *     celui de `composerRepartition` ;
 *   — au plus 36 emplacements, au plus 9 par vague.
 *
 * `profilRespecte` vaut false quand aucun châssis du profil n'est débloqué —
 * un assaut blindé sous le niveau 12. Le générateur retombe alors sur la
 * répartition nue plutôt que de rendre une armée vide, et le dit.
 *
 * @returns {{ vagues: Array<Array<{id,colonne,niveau}>>, pointsEngages: number,
 *   pointsRestants: number, budgetPoints: number, profilRespecte: boolean }}
 */
export function genererAssaut({ niveau, budgetPoints, profil, graine }) {
  if (!Number.isInteger(niveau) || niveau < 1 || niveau > NIVEAU.plafond) {
    throw new Error(`générateur : niveau ${niveau} hors de 1…${NIVEAU.plafond}`);
  }
  const modele = PROFILS_ASSAUT[profil];
  if (modele === undefined) {
    throw new Error(`générateur : profil d'assaut inconnu « ${profil} »`);
  }
  const budget = budgetPoints ?? budgetAssaut(niveau);
  if (!Number.isInteger(budget) || budget < 0) {
    throw new Error(`générateur : budget ${budget} doit être un entier ≥ 0`);
  }
  if (!Number.isInteger(graine)) {
    throw new Error(`générateur : graine ${graine} n'est pas un entier`);
  }

  const rng = creerRng(graine);
  const nue = composerRepartition(rng, VAGUES.parNiveau, niveau, VAGUES.variancePoints);
  const pondere = pondererParChassis(nue, modele.chassis);
  const profilRespecte = pondere !== null;

  const { choisis, reste } = tirerSousBudget(
    rng, pondere ?? nue, budget, CASES_ASSAUT,
  );
  choisis.sort((a, b) => rangSpecialite(a) - rangSpecialite(b));

  // Quatre vagues de neuf. La colonne suit le rang dans la vague, si bien que
  // l'ordre de spécialité se lit de gauche à droite puis de vague en vague.
  const vagues = [];
  for (let v = 0; v * EMPLACEMENTS_ASSAUT.parVague < choisis.length; v += 1) {
    const debut = v * EMPLACEMENTS_ASSAUT.parVague;
    vagues.push(
      choisis.slice(debut, debut + EMPLACEMENTS_ASSAUT.parVague).map((id, i) => ({
        id, colonne: i + 1, niveau,
      })),
    );
  }
  return {
    vagues,
    pointsEngages: budget - reste,
    pointsRestants: reste,
    budgetPoints: budget,
    profilRespecte,
  };
}
