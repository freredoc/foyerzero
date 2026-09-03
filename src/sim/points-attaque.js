// Les points d'attaque — le régulateur de session.
//
// C'est la seule chose qui empêche un joueur de vider la carte en une soirée :
// un raid coûte des points, les points se régénèrent lentement, et le plafond
// dit combien on peut en mettre de côté. Rien ici ne résout un combat ; ce
// module PAIE le droit d'en lancer un.
//
// ARBITRÉ par Ethan le 29/08/2026, en dictée, et confronté à ce que le dépôt
// portait déjà — `POINTS_ATTAQUE` de `data/sites.js` et `SPEC-FOYER-ZERO.md`
// §3, tous deux transcrits du relevé de Tiberium Alliances :
//
//   — plafond 100 au départ, +10 par niveau, donc 600 au niveau 50 : le dépôt
//     le disait déjà, Ethan l'a redit. Rien n'a bougé.
//   — coût d'un raid : 10 points, +1 par case en territoire allié, +3 par case
//     ailleurs : le dépôt le disait déjà, mot pour mot. Rien n'a bougé.
//   — LE NIVEAU RETENU EST CELUI DE L'ARMÉE, pas celui de la base. La spec
//     disait « la base la plus élevée du joueur » ; Ethan a tranché l'armée, et
//     l'a chiffré lui-même : « ça me va qu'on puisse avoir cent cinquante-huit
//     points », c'est-à-dire une armée moyenne au niveau 5,8.
//   — LE PLAFOND EST À CLIQUET : « une fois qu'un plafond est passé, on ne
//     touche plus au plafond ; si tu supprimes complètement ton armée pour en
//     refaire une autre, ça ne va pas toucher au plafond ». Il ne redescend
//     jamais.
//   — LA RÉGÉNÉRATION EST UNE PART DU PLAFOND PAR HEURE, « quoi qu'il arrive » :
//     la forme est d'Ethan, le taux vient du dépôt. Il a dicté 10 %, puis rétabli
//     20 % le même soir en apprenant que `20 + 2 × niveau` — la table d'origine
//     — VAUT déjà 20 % du plafond à tous les niveaux. Donc 20 points par heure
//     au départ, 120 au niveau 50, et le plein en cinq heures quel que soit le
//     plafond. Le taux se change EN UN SEUL NOMBRE : `partDuPlafondPourCent`.
//   — LE JOUEUR DÉMARRE LE PLEIN : « c'est frustrant de démarrer le jeu puis
//     d'attendre que ça se remplisse ».
//
// ⚠ LE CLIQUET SUPPRIME UN PROBLÈME, IL N'EN CRÉE PAS. Un plafond qui pourrait
// baisser laisserait des points AU-DESSUS de lui — il aurait fallu décider si
// on les rogne (« rien ne se retire en silence » l'interdit) ou si on les garde
// sans régénérer. Avec le cliquet, ce cas n'existe pas : les points ne dépassent
// jamais le plafond, parce que le plafond ne recule jamais.
//
// ⚠ AUCUNE FONCTION D'ICI NE LIT `etat.position` DIRECTEMENT, et c'est la seule
// contrainte d'architecture du lot. Le pluriel des bases est arbitré, il n'est
// pas écrit ; tout ce qui parle de « la base qui attaque » prend une base en
// argument, et `basesDuJoueur` est LE point unique où le singulier d'aujourd'hui
// est écrit. Le jour du pluriel, cette fonction change, et rien d'autre ici.

import { POINTS_ATTAQUE, GEOGRAPHIE } from '../data/sites.js';
import { TICKS_PAR_HEURE } from './clock.js';
import { niveauDeLArmee } from './niveau-de-base.js';

/**
 * Le diviseur de la régénération : le nombre de « plafond × ticks » qu'il faut
 * accumuler pour gagner UN point.
 *
 * ⚠ IL EST DÉRIVÉ, JAMAIS ÉCRIT. Gagner `p / 100 × plafond` points par heure,
 * c'est gagner `plafond / (TICKS_PAR_HEURE × 100 / p)` point par tick. Le
 * diviseur EST cette parenthèse, et il vaut 180 000 pour 20 % à 10 Hz.
 *
 * ⚠ IL DOIT RESTER ENTIER, et le module refuse de se charger sinon. Un diviseur
 * fractionnaire ferait dériver les deux chemins d'avancement l'un de l'autre —
 * exactement le genre de faute que le lot SATELLITES a payée cher.
 */
export const DIVISEUR_REGENERATION = (TICKS_PAR_HEURE * 100)
  / POINTS_ATTAQUE.regenerationParHeure.partDuPlafondPourCent;

if (!Number.isInteger(DIVISEUR_REGENERATION) || DIVISEUR_REGENERATION <= 0) {
  throw new Error(
    `points-attaque : régénération de ${POINTS_ATTAQUE.regenerationParHeure.partDuPlafondPourCent} %`
      + ` par heure — diviseur ${DIVISEUR_REGENERATION}, entier attendu`,
  );
}

/**
 * Le plafond que vaut un niveau d'armée donné, en points.
 *
 * ⚠ LE NIVEAU EST EN DIXIÈMES, comme tout ce que rend `sim/niveau-de-base.js`,
 * et `null` y veut dire « rien de posé » — pas « niveau zéro ». Une base neuve
 * n'a pas d'armée : elle a le plafond de base, 100, et c'est la bonne réponse.
 *
 * ⚠ LA PROPORTIONNALITÉ VA JUSQU'AU DIXIÈME, et c'est Ethan qui l'a chiffrée :
 * une armée au niveau 5,8 donne 158, pas 150. « 10 points par niveau » se lit
 * donc « 1 point par dixième de niveau ».
 *
 * @param {number|null} dixiemes niveau d'armée en dixièmes, ou null
 * @returns {number} plafond en points
 */
export function plafondDuNiveau(dixiemes) {
  const { base, parNiveau } = POINTS_ATTAQUE.plafond;
  if (dixiemes === null || dixiemes === undefined) return base;
  if (!Number.isInteger(dixiemes) || dixiemes < 0) {
    throw new RangeError(`plafondDuNiveau : « ${dixiemes} » — dixièmes entiers ≥ 0 ou null attendus`);
  }
  return base + Math.floor((parNiveau * dixiemes) / 10);
}

/**
 * Les bases du joueur.
 *
 * ⚠⚠ CETTE FONCTION SEULE A CHANGÉ AU LOT BASES-0, 02/09/2026, ET C'EST CE
 * QU'ELLE ANNONÇAIT. Elle rendait `[etat]` — « l'état ne porte aujourd'hui
 * qu'une base, et cette base EST l'état ; le jour où `etat.bases` existera,
 * cette fonction seule changera ». Ce jour est celui-ci, et rien d'autre de ce
 * module n'a bougé : tout y raisonnait déjà sur une LISTE.
 *
 * ⚠ ELLE REND DES BASES, PAS DES POSITIONS, et son homonyme de
 * `sim/territoire.js` rend des POSITIONS. Deux noms courts identiques, deux
 * types différents : ne jamais importer l'un pour l'autre.
 *
 * @param {object} etat
 * @returns {Array<{ position: { rangee: number, colonne: number }, armee: Array }>}
 */
export function basesDuJoueur(etat) {
  if (etat === null || typeof etat !== 'object' || !Array.isArray(etat.bases)) {
    throw new TypeError('basesDuJoueur : état attendu, portant une liste `bases`');
  }
  return etat.bases;
}

/**
 * Le plafond que MÉRITE le joueur au vu de ses armées — avant cliquet.
 *
 * ⚠ C'EST UN MAXIMUM SUR LES BASES, pas une moyenne des moyennes. Ethan : « le
 * niveau d'armée le plus élevé ». Une seconde base mal équipée ne doit pas
 * faire baisser ce que la première a mérité.
 *
 * @param {Array<{ armee: Array }>} bases
 * @returns {number} plafond en points
 */
export function plafondVise(bases) {
  if (!Array.isArray(bases) || bases.length === 0) {
    throw new RangeError('plafondVise : au moins une base est attendue');
  }
  let meilleur = null;
  for (const base of bases) {
    const niveau = niveauDeLArmee(base.armee);
    if (niveau !== null && (meilleur === null || niveau > meilleur)) meilleur = niveau;
  }
  return plafondDuNiveau(meilleur);
}

/**
 * L'état neuf : le plafond de base, et LE PLEIN.
 *
 * @param {number} [plafond] plafond de départ, en points
 * @returns {{ points: number, plafond: number, residu: number }}
 */
export function creerPointsAttaque(plafond = POINTS_ATTAQUE.plafond.base) {
  if (!Number.isInteger(plafond) || plafond < 1) {
    throw new RangeError(`creerPointsAttaque : plafond « ${plafond} » — entier ≥ 1 attendu`);
  }
  return { points: plafond, plafond, residu: 0 };
}

/**
 * Le cliquet : le plafond monte, ne descend jamais.
 *
 * @param {{ plafond: number }} pa
 * @param {number} vise plafond mérité par les armées du moment
 * @returns {boolean} vrai si le plafond a monté
 */
export function releverPlafond(pa, vise) {
  if (!Number.isInteger(vise) || vise < 1) {
    throw new RangeError(`releverPlafond : plafond visé « ${vise} » — entier ≥ 1 attendu`);
  }
  if (vise <= pa.plafond) return false;
  pa.plafond = vise;
  return true;
}

/**
 * La régénération, sur un nombre quelconque de ticks.
 *
 * ⚠ UN SEUL APPEL DE n TICKS DONNE EXACTEMENT n APPELS D'UN TICK, et c'est ce
 * qui rend le rattrapage hors ligne honnête. Le résidu porte la fraction de
 * point non encore acquise : `plafond × n + résidu` est le numérateur exact,
 * et il ne connaît ni arrondi ni flottant. Une implémentation qui ferait
 * `Math.floor(plafond / DIVISEUR)` à chaque tick rendrait ZÉRO pour toujours —
 * 158 / 180 000 est nul en entiers — et les deux chemins divergeraient.
 *
 * ⚠ LE RÉSIDU RETOMBE À ZÉRO QUAND LE PLEIN EST ATTEINT. Sans ça, un joueur
 * resté longtemps au plafond dépenserait dix points et en récupérerait un
 * gratuitement à l'instant suivant. Ça ne casse pas l'équivalence des deux
 * chemins : les deux finissent au plein, donc les deux finissent à zéro.
 *
 * @param {{ points: number, plafond: number, residu: number }} pa
 * @param {number} nbTicks
 */
export function regenerer(pa, nbTicks) {
  if (!Number.isInteger(nbTicks) || nbTicks < 0) {
    throw new RangeError(`regenerer : « ${nbTicks} » ticks — entier ≥ 0 attendu`);
  }
  if (nbTicks === 0) return;
  const numerateur = pa.plafond * nbTicks + pa.residu;
  const gain = Math.floor(numerateur / DIVISEUR_REGENERATION);
  pa.residu = numerateur - gain * DIVISEUR_REGENERATION;
  pa.points = Math.min(pa.plafond, pa.points + gain);
  if (pa.points === pa.plafond) pa.residu = 0;
}

/**
 * Un tick — ou n — vu de l'état : on relève le plafond, puis on régénère.
 *
 * ⚠ DANS CET ORDRE. Une armée améliorée fait monter le plafond, et la
 * régénération de l'instant suivant doit déjà porter sur le nouveau. L'inverse
 * ferait perdre un tick à chaque montée ; ce n'est rien, mais c'est faux, et
 * l'ordre inverse n'a aucun avantage.
 *
 * @param {object} etat
 * @param {number} nbTicks
 */
export function avancerPointsAttaque(etat, nbTicks) {
  releverPlafond(etat.attaque, plafondVise(basesDuJoueur(etat)));
  regenerer(etat.attaque, nbTicks);
}

// ---------------------------------------------------------------------------
// Le barème d'un raid
// ---------------------------------------------------------------------------

/**
 * Le CARRÉ de la distance euclidienne entre deux cases de la carte.
 *
 * ⚠⚠ EUCLIDE, PAS TCHEBYCHEV — ARBITRÉ PAR ETHAN LE 02/09/2026, et l'ancien
 * commentaire de ce bloc disait exactement l'inverse. Il argumentait :
 * « TCHEBYCHEV, PAS EUCLIDE, et c'est la cohérence avec le reste de la carte :
 * la garde de quinze cases du peuplement compte comme ça, et les anneaux des
 * satellites aussi. Une distance euclidienne rendrait une diagonale plus chère
 * qu'une ligne droite de même rayon, ce qu'aucune autre règle du jeu ne fait. »
 *
 * ⚠ CET ARGUMENT ÉTAIT JUSTE, ET IL EST TOMBÉ POUR UNE RAISON PRÉCISE : les
 * TROIS règles ont changé ENSEMBLE au lot EUCLIDE — la portée du raid, la garde
 * du peuplement et les anneaux des satellites. La cohérence qu'il défendait
 * n'est donc pas perdue : elle a changé de métrique. Une diagonale est
 * désormais plus loin qu'une ligne droite partout où le jeu compte une
 * distance de CARTE, et nulle part elle ne l'est d'un seul côté.
 *
 * ⚠ ELLE REND LE CARRÉ, ET C'EST TOUT L'INTÉRÊT. `Math.sqrt` ferait entrer un
 * flottant là où il n'y en avait aucun, et un arrondi à débattre avec lui. Une
 * portée se teste `d² ≤ rayon²` : deux entiers, une comparaison exacte.
 *
 * ⚠⚠ ET CE N'EST PAS LA DISTANCE DU COMBAT DE `sim/grille.js`, qui porte presque le
 * même nom. Celle-là travaille en MILLI-CASES et sert le ciblage à l'intérieur
 * d'un combat ; deux cases voisines y sont à 1 000 000, pas à 1. Les confondre
 * donnerait un résultat faux d'un facteur un million sans que rien ne lève.
 * Un test tient les deux échelles séparées.
 *
 * @param {{ rangee: number, colonne: number }} a
 * @param {{ rangee: number, colonne: number }} b
 * @returns {number} (Δrangée)² + (Δcolonne)², entier
 */
export function distanceCarreeCases(a, b) {
  for (const [nom, p] of [['a', a], ['b', b]]) {
    if (p === null || typeof p !== 'object'
      || !Number.isInteger(p.rangee) || !Number.isInteger(p.colonne)) {
      throw new TypeError(`distanceCarreeCases : ${nom} n'est pas une case entière`);
    }
  }
  const dr = a.rangee - b.rangee;
  const dc = a.colonne - b.colonne;
  return dr * dr + dc * dc;
}

/**
 * La distance de Tchebychev — le plus grand des deux écarts.
 *
 * ⚠⚠ CE BLOC A ANNONCÉ PENDANT UN JOUR QUE LES ZONES D'INFLUENCE ÉTAIENT SON
 * DERNIER PÉRIMÈTRE, ET C'ÉTAIT FAUX DEPUIS BASES-1. Il écrivait : « son
 * périmètre s'est rétréci à une seule chose : les ZONES D'INFLUENCE […] ce sont
 * des CARRÉS que sim/territoire.js peint case par case ». BASES-1 les a fait
 * passer au DISQUE le lendemain, des deux côtés à la fois, et ce lot-ci les fait
 * passer à l'OCTOGONE — voir `dansLOctogoneDInfluence` ci-dessous. Le
 * commentaire décrivait donc une géométrie que le fichier ne portait plus. **Ne
 * jamais laisser un commentaire qui annonce un périmètre qu'on vient de lui
 * retirer.**
 *
 * ⚠ CE QUI LUI RESTE SE COMPTE, ET C'EST DEUX APPELS. Le BARÈME du raid —
 * `coutDuRaid` prend un nombre de cases de GRILLE, arbitrage d'EUCLIDE intact —
 * et `siteDeLaCase`, pour une égalité à ZÉRO (« cette case est-elle celle de ma
 * base ? »), qui ne choisit aucune métrique : une distance nulle est nulle dans
 * les trois.
 *
 * @param {{ rangee: number, colonne: number }} a
 * @param {{ rangee: number, colonne: number }} b
 * @returns {number}
 */
export function distanceTchebychev(a, b) {
  for (const [nom, p] of [['a', a], ['b', b]]) {
    if (p === null || typeof p !== 'object'
      || !Number.isInteger(p.rangee) || !Number.isInteger(p.colonne)) {
      throw new TypeError(`distanceTchebychev : ${nom} n'est pas une case entière`);
    }
  }
  return Math.max(Math.abs(a.rangee - b.rangee), Math.abs(a.colonne - b.colonne));
}

/**
 * Le rayon d'attaque, AU CARRÉ — la borne contre laquelle toute portée se teste.
 *
 * ⚠ CALCULÉ, JAMAIS ÉCRIT. `GEOGRAPHIE.rayonAttaque` reste la seule table qui
 * dise 10 ; en ranger le carré dans les données ferait deux nombres à tenir
 * d'accord.
 */
export const RAYON_ATTAQUE_CARRE = GEOGRAPHIE.rayonAttaque * GEOGRAPHIE.rayonAttaque;

/**
 * La case décalée de (dr, dc) est-elle dans la ZONE D'INFLUENCE de rayon donné ?
 *
 * ⚠⚠ C'EST LA SEULE ÉCRITURE DE CETTE FORME DANS LE DÉPÔT, ET ELLE SERT LES DEUX
 * CÔTÉS. `estEnTerritoireAllie` la FACTURE — le tarif de raid à +1 par case au
 * lieu de +3 —, la boucle `peindre` de `sim/territoire.js` la DESSINE. CLAUDE.md
 * l'écrit depuis EUCLIDE : « ce sont `estEnTerritoireAllie` ET la boucle de
 * `territoire.js` qui changent, ensemble » ; en changer un seul ferait payer le
 * tarif de proximité sur des cases que la carte ne montre pas comme siennes.
 * Depuis ce lot-ci il n'y a plus deux lignes à changer ensemble, il y en a UNE.
 *
 * ⚠⚠ UN OCTOGONE, DICTÉ CASE PAR CASE PAR ETHAN LE 03/09/2026 : « un carré de
 * 5x5 avec chaque coin rogné (4 cases) ; ouvrage idem rogné mais 7x7 donc 3
 * cases à chaque coin ». C'est l'intersection du carré de Tchebychev de rayon
 * `r` et du losange de Manhattan de rayon `r + margeDiagonaleInfluence` — 21
 * cases au rayon 2, 37 au rayon 3, soit **huit de plus que le disque des deux
 * côtés**, ce qui est exactement le « 8 cases de plus, dans les angles » du
 * message.
 *
 * ⚠ EN ENTIERS, SANS AUCUNE RACINE — deux valeurs absolues, deux comparaisons.
 * La doctrine d'EUCLIDE tient : `src/sim/` ne prend jamais de racine.
 *
 * @param {number} dr écart de rangée, entier
 * @param {number} dc écart de colonne, entier
 * @param {number} rayon rayon de la zone, en cases
 * @returns {boolean}
 */
export function dansLOctogoneDInfluence(dr, dc, rayon) {
  // ⚠ LES ÉCARTS SE VALIDENT ICI, PARCE QU'ILS ÉTAIENT VALIDÉS AVANT. Jusqu'à ce
  // lot, `estEnTerritoireAllie` passait par `distanceCarreeCases`, qui LÈVE sur
  // une case non entière. Sans cette garde, une case mal formée ferait rendre
  // `NaN` aux deux comparaisons, donc `false` — la cible sortirait du territoire
  // en silence et le raid coûterait le tarif lointain sans que rien ne le dise.
  if (!Number.isInteger(dr) || !Number.isInteger(dc)) {
    throw new TypeError(`dansLOctogoneDInfluence : écarts « ${dr}, ${dc} » — entiers attendus`);
  }
  const ar = Math.abs(dr);
  const ac = Math.abs(dc);
  if (ar > rayon || ac > rayon) return false;
  return ar + ac <= rayon + GEOGRAPHIE.margeDiagonaleInfluence;
}

/**
 * Cette case est-elle à portée d'attaque de cette base ?
 *
 * ⚠ UN SEUL ENDROIT POSE LA QUESTION, ET TOUS LES APPELANTS PASSENT PAR LUI.
 * Trois lecteurs la posaient chacun à sa façon avant le lot EUCLIDE — le
 * balayage de `ciblesAPortee`, le refus de `problemesDuRaid`, le panneau de
 * l'écran Monde — et trois écritures d'une même règle finissent toujours par
 * diverger d'un cas limite.
 *
 * @param {{ rangee: number, colonne: number }} depuis
 * @param {{ rangee: number, colonne: number }} vers
 * @returns {boolean}
 */
export function estAPorteeDAttaque(depuis, vers) {
  return distanceCarreeCases(depuis, vers) <= RAYON_ATTAQUE_CARRE;
}

/**
 * La distance en cases ENTIÈRES, arrondie au supérieur — POUR L'AFFICHAGE.
 *
 * ⚠⚠ ELLE NE SERT QU'À ÉCRIRE UNE PHRASE, ET JAMAIS À DÉCIDER. Aucune règle du
 * jeu ne l'appelle : la portée se teste sur `d² ≤ rayon²`, le barème se lit sur
 * la distance de grille. Elle existe parce qu'un refus doit dire un NOMBRE au
 * joueur — « un indice n'est pas une interdiction » —, et que ce nombre doit
 * être dans la métrique qui a décidé du refus. Citer la distance de grille dans
 * un refus euclidien produirait « cette cible est à 8 cases, le rayon est de
 * 10 », c'est-à-dire un message qui donne tort au jeu.
 *
 * ⚠ SANS `Math.sqrt`, ET CE N'EST PAS UNE COQUETTERIE. Une racine flottante
 * rendrait 5,000000000000001 sur un carré parfait une fois sur mille, donc
 * « 6 cases » là où il y en a cinq. La boucle entière est exacte par
 * construction et coûte au plus une trentaine de tours sur cette carte.
 *
 * ⚠ SON PARAMÈTRE NE S'APPELLE PAS `distanceCarree`, ET CE N'EST PAS UNE
 * COQUETTERIE : c'est le nom EXACT de la distance du COMBAT, en milli-cases.
 * Une garde balaie ces trois modules pour qu'il n'y apparaisse jamais, et elle a
 * attrapé ce paramètre-ci au premier jet. Un nom qui invite à la confusion la
 * produit tôt ou tard.
 *
 * @param {number} carreDeLaDistance
 * @returns {number} le plus petit entier n tel que n² ≥ carreDeLaDistance
 */
export function casesArrondiesAuSuperieur(carreDeLaDistance) {
  if (!Number.isInteger(carreDeLaDistance) || carreDeLaDistance < 0) {
    throw new RangeError(
      `casesArrondiesAuSuperieur : « ${carreDeLaDistance} » — entier ≥ 0 attendu`,
    );
  }
  let n = 0;
  while (n * n < carreDeLaDistance) n += 1;
  return n;
}

/**
 * La cible est-elle en TERRITOIRE ALLIÉ ?
 *
 * ⚠ LE TERRITOIRE EST LA ZONE D'INFLUENCE, celle qui existe déjà dans
 * `GEOGRAPHIE` : rayon 2 autour d'une base du joueur, « fixe, ne croît jamais »
 * dans le relevé. Arbitré le 29/08 : « on garde deux ». Conséquence assumée et
 * mesurable : le tarif à +1 ne touche que les cases à 1 ou 2 cases, donc 11 ou
 * 12 points, et tout le reste de la carte est à +3.
 *
 * ⚠ C'EST L'UNION DES ZONES DE TOUTES LES BASES, pas celle de la base qui
 * attaque. Ethan : « sauf si tu as plein de bases les unes à côté des autres, et
 * dans ce cas il n'y a pas de problème ». Le territoire est au JOUEUR ; la
 * distance, elle, se mesure depuis la base qui part.
 *
 * ⚠⚠ EN OCTOGONE DEPUIS LE 03/09/2026, ET LES DEUX CÔTÉS N'ONT PLUS À BASCULER
 * ENSEMBLE : ILS PARTAGENT LA MÊME FONCTION. Cette fonction et la boucle
 * `peindre` de `sim/territoire.js` portent la MÊME zone — l'une la facture,
 * l'autre la dessine — et appellent toutes deux `dansLOctogoneDInfluence`.
 * EUCLIDE avait laissé les deux en Tchebychev, BASES-1 les a passées au disque
 * en changeant DEUX lignes d'accord ; il n'y en a plus qu'une à changer.
 *
 * ⚠ LE PRIX CHANGE DANS L'AUTRE SENS, ET IL N'EST PAS COMPENSÉ. Le disque de
 * BASES-1 avait fait passer 3,33 % des cibles de +1 à +3 par case ; l'octogone
 * en rend une partie — huit cases par base reviennent au tarif de proximité.
 * Voir le rapport du lot pour la mesure sur les mêmes 150 graines.
 *
 * ⚠ LA DISTANCE DU BARÈME, ELLE, RESTE EN CASES DE GRILLE — `coutDUnRaid`
 * ci-dessous emploie toujours `distanceTchebychev`. C'est l'arbitrage d'EUCLIDE,
 * intact : la PORTÉE est un disque, le PRIX se compte en cases de grille, et un
 * raid en diagonale ne renchérit pas pour la seule raison qu'il est en diagonale.
 *
 * @param {{ rangee: number, colonne: number }} cible
 * @param {Array<{ position: object }>} bases
 * @returns {boolean}
 */
export function estEnTerritoireAllie(cible, bases) {
  if (!Array.isArray(bases) || bases.length === 0) {
    throw new RangeError('estEnTerritoireAllie : au moins une base est attendue');
  }
  const rayon = GEOGRAPHIE.rayonInfluenceJoueur;
  return bases.some((base) => dansLOctogoneDInfluence(
    base.position.rangee - cible.rangee,
    base.position.colonne - cible.colonne,
    rayon,
  ));
}

/**
 * Le coût d'un raid, en points, à distance et territoire connus.
 *
 * 10 fixes, plus la distance : +1 par case chez soi, +3 par case ailleurs.
 * Donc 11 au plus près chez soi, 40 au bout du rayon d'attaque ailleurs.
 *
 * ⚠ LE RAYON MAXIMAL SE LIT DANS `GEOGRAPHIE.rayonAttaque`, ET NULLE PART
 * AILLEURS. `POINTS_ATTAQUE` en portait une seconde copie, `rayonMaximal: 10` ;
 * elle a été retirée au lot POINTS-D'ATTAQUE. Deux tables pour une grandeur,
 * c'est une occasion de divergence, et CLAUDE.md §4 l'interdit.
 *
 * @param {number} distance en cases, ≥ 1
 * @param {boolean} enTerritoireAllie
 * @returns {number} coût en points
 */
export function coutDuRaid(distance, enTerritoireAllie) {
  if (typeof enTerritoireAllie !== 'boolean') {
    throw new TypeError('coutDuRaid : le territoire est un booléen');
  }
  if (!Number.isInteger(distance) || distance < 1) {
    throw new RangeError(`coutDuRaid : distance « ${distance} » — entier ≥ 1 attendu`);
  }
  if (distance > GEOGRAPHIE.rayonAttaque) {
    throw new RangeError(
      `coutDuRaid : ${distance} cases — hors du rayon d'attaque (${GEOGRAPHIE.rayonAttaque})`,
    );
  }
  const { fixe, parCaseAllie, parCaseEnnemiOuNeutre } = POINTS_ATTAQUE.coutRaid;
  return fixe + (enTerritoireAllie ? parCaseAllie : parCaseEnnemiOuNeutre) * distance;
}

/**
 * Le coût d'un raid tel que l'écran le montrera : une base qui part, une case
 * visée, et l'état pour dire ce qui est à nous.
 *
 * @param {object} etat
 * @param {{ position: object }} baseAttaquante
 * @param {{ rangee: number, colonne: number }} cible
 * @returns {number} coût en points
 */
export function coutDUnRaid(etat, baseAttaquante, cible) {
  const distance = distanceTchebychev(baseAttaquante.position, cible);
  return coutDuRaid(distance, estEnTerritoireAllie(cible, basesDuJoueur(etat)));
}

// ---------------------------------------------------------------------------
// Payer
// ---------------------------------------------------------------------------

/**
 * Ce qui manque pour lancer un raid à ce prix — `null` si rien ne manque.
 *
 * ⚠ ELLE REND LE MANQUE, PAS UN BOOLÉEN, et c'est la convention du dépôt : les
 * `problemesDe…` de `sim/state.js` disent CE QUI cloche pour que l'écran
 * l'écrive. « Il te manque 7 points » est une phrase ; « false » n'en est pas
 * une.
 *
 * @param {{ points: number }} pa
 * @param {number} cout
 * @returns {number|null} points manquants, ou null
 */
export function manquePourPayer(pa, cout) {
  if (!Number.isInteger(cout) || cout < 1) {
    throw new RangeError(`manquePourPayer : coût « ${cout} » — entier ≥ 1 attendu`);
  }
  return pa.points >= cout ? null : cout - pa.points;
}

/**
 * Paie un raid. Lève si les points n'y sont pas — l'écran a `manquePourPayer`
 * pour ne pas en arriver là.
 *
 * @param {{ points: number }} pa
 * @param {number} cout
 */
export function payer(pa, cout) {
  const manque = manquePourPayer(pa, cout);
  if (manque !== null) {
    throw new RangeError(`payer : ${cout} points demandés, ${pa.points} disponibles`);
  }
  pa.points -= cout;
}
