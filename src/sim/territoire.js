// Qui tient quoi sur la carte — les zones d'influence, et leurs bordures.
//
// ⚠⚠ RIEN N'EST INVENTÉ ICI : LA RÈGLE EST DANS LA SPEC DEPUIS LE DÉBUT.
// `SPEC-FOYER-ZERO.md` §10 porte « zone d'influence joueur : rayon 2, fixe » et
// « zone d'influence ennemie : rayon 3, fixe », et sa §8 précise que « le
// territoire allié est l'union des zones d'influence de toutes les bases du
// joueur ». `GEOGRAPHIE.rayonInfluenceJoueur` et `rayonInfluenceEnnemie` les
// transcrivent, et `sim/points-attaque.js` lit déjà le premier pour le barème du
// raid. Ce module ne fait qu'en tirer une CARTE.
//
// ⚠⚠ UN OCTOGONE DEPUIS LE 03/09/2026, DICTÉ CASE PAR CASE PAR ETHAN. « le
// territoire doit avoir 8 cases de plus, dans les angles. un carré de 5x5 avec
// chaque coin rogné (4 cases) ; ouvrage idem rogné mais 7x7 donc 3 cases à
// chaque coin. » Soit **21 cases pour le joueur et 37 pour l'Ouvrage**, contre
// 13 et 29 pour les disques de BASES-1 : huit de plus des deux côtés, mesuré.
//
// ⚠ LA FORME A CHANGÉ TROIS FOIS, ET IL FAUT SAVOIR POURQUOI. Carré plein
// jusqu'au 02/09 — ce module remplissait (2r+1)² cases sans le moindre test de
// distance, sous une portée déjà ronde ; DISQUE au lot BASES-1, qui a corrigé la
// divergence ; OCTOGONE aujourd'hui, parce que le disque coupait les angles plus
// que ce qu'Ethan voulait voir. Ce n'est PAS un retour sur EUCLIDE : la portée du
// raid, la garde du peuplement et les anneaux de satellites restent des disques.
//
// ⚠⚠ ET LES DEUX CÔTÉS NE BASCULENT PLUS ENSEMBLE — ILS PARTAGENT LA FONCTION.
// `dansLOctogoneDInfluence` de `sim/points-attaque.js` est appelée ICI pour le
// dessin et par `estEnTerritoireAllie` pour le PRIX. CLAUDE.md prévenait depuis
// EUCLIDE qu'il fallait changer les deux d'accord ; il n'y a plus qu'une écriture
// de la forme, donc plus d'accord à tenir.
//
// ⚠ EN ENTIERS, SANS AUCUNE RACINE. La double boucle reste, mais comme
// ENVELOPPE : elle borne le travail, elle ne décide plus de l'appartenance.
//
// ⚠⚠ IL NE CALCULE JAMAIS SUR LES 9 300 CASES, ET C'EST UNE CONTRAINTE DE COÛT.
// Savoir si une case est sous influence ennemie en interrogeant son voisinage
// demanderait `(2 × 3 + 1)² = 49` appels à `estBaseOuvrage`, soit 441 hachages
// PAR CASE. On fait l'inverse : on demande les bases de la fenêtre UNE fois —
// `basesDeLaFenetre` est écrite pour ça — et on peint leur disque. Le coût
// devient celui des bases présentes, pas celui de la fenêtre.
//
// ⚠ ET LA FENÊTRE SE DILATE AVANT D'ÊTRE PEUPLÉE. Une base située juste hors
// champ projette quand même son influence DANS le champ : ne demander que la
// fenêtre visible ferait apparaître et disparaître des bordures au bord de
// l'écran à chaque défilement.

import { GEOGRAPHIE } from '../data/sites.js';
import { basesDeLaFenetre } from './peuplement.js';
import { distanceOctogonaleDInfluence } from './points-attaque.js';

// ⚠ LES DEUX NIVEAUX D'UNE BASE VIENNENT DE DEUX ENDROITS, ET C'EST LA RÈGLE
// QUE `sim/carte.js` EXISTE POUR TENIR : celui de l'Ouvrage se lit sur la
// RANGÉE, celui du joueur est la moyenne de ses BÂTIMENTS. Les confondre est la
// faute que trois commentaires du dépôt nomment déjà.
import { niveauDeLaRangee } from './carte.js';
import { niveauDesBatiments } from './niveau-de-base.js';

// ⚠⚠ LES RUINES SONT DES ÉMETTEURS DE PLUS, PAS UNE EXCEPTION DANS LE
// CALCUL — lot CONQUÊTE-24H, 07/09/2026. Pendant vingt-quatre heures, une base
// rasée émet pour le camp du vainqueur, au niveau de la base rasée, et sa force
// s'ADDITIONNE à celle des bases de ce camp. La formule ci-dessous ne bouge pas
// d'un caractère : c'est la LISTE des émetteurs qui s'allonge.
import { ruinesActives, casesRasees, cleDeLaCase } from './ruines.js';

/** Ce qu'une case peut porter. Les valeurs servent d'indices, pas de noms. */
export const NEUTRE = 0;
export const JOUEUR = 1;
export const OUVRAGE = 2;

/**
 * Les rayons d'influence, LUS dans `GEOGRAPHIE` et jamais recopiés.
 *
 * ⚠ LE JOUEUR A LE PLUS PETIT, ET C'EST VOULU : rayon 2 contre 3, soit 21 cases
 * contre 37 une fois les angles rognés. Le territoire allié est ce qui rend un
 * raid bon marché (spec §8) ; l'élargir changerait un barème sans qu'on s'en
 * aperçoive — c'est d'ailleurs ce que ce lot-ci fait, de huit cases, sur ordre.
 */
export const RAYONS = {
  [JOUEUR]: GEOGRAPHIE.rayonInfluenceJoueur,
  [OUVRAGE]: GEOGRAPHIE.rayonInfluenceEnnemie,
};

/**
 * La raison de la progression de force, en `BigInt`, LUE dans `GEOGRAPHIE`.
 *
 * ⚠ ELLE NE SE RECOPIE PAS. `GEOGRAPHIE.raisonDeLaForce` porte le nombre et dit
 * pourquoi c'est deux ; ce module le convertit, il ne le choisit pas.
 */
export const RAISON = BigInt(GEOGRAPHIE.raisonDeLaForce);

/**
 * De combien tous les exposants sont décalés pour rester positifs.
 *
 * ⚠⚠ `niveau − distance` EST NÉGATIF POUR UNE BASE DE NIVEAU 1 À TROIS CASES, ET
 * `BigInt` N'A PAS D'INVERSE : `2n ** -2n` lève. On décale donc tous les
 * exposants du plus grand rayon — la force n'a de sens que COMPARÉE à une autre,
 * et un facteur commun ne change aucune comparaison. L'exposant vaut alors au
 * minimum `1 − rayon + rayon = 1`.
 *
 * ⚠ IL SE DÉRIVE DES RAYONS, il ne s'écrit pas. Un rayon qui monterait sans que
 * ce nombre suive ferait lever la puissance, et la carte entière avec elle.
 */
export const DECALAGE_DES_EXPOSANTS = Math.max(...Object.values(RAYONS));

/**
 * Le niveau d'une base du joueur, en niveaux ENTIERS.
 *
 * ⚠⚠ C'EST LA MOYENNE DE SES BÂTIMENTS, ET LA SPEC LE DIT DÉJÀ :
 * `GEOGRAPHIE.niveauBase` porte « moyenne des niveaux de ses bâtiments ». Ce
 * n'est donc pas une lecture de ce lot-ci, c'est la grandeur du dépôt.
 *
 * ⚠⚠ ET C'EST EXACTEMENT CELLE QUE LA CARTE DESSINE DÉJÀ. `palierDuSite` de
 * `ui/monde.js` choisit le palier d'emblème d'une base du joueur par
 * `Math.max(1, Math.round(dixiemes / 10))` — la même moyenne, le même arrondi.
 * En prendre une autre ici ferait dire deux choses au même dessin : un emblème
 * de palier 3 qui projetterait la force d'un niveau 2.
 *
 * ⚠ SURTOUT PAS `niveauDeLaRangee`. Elle donne le niveau des sites de l'OUVRAGE
 * à cet endroit ; l'employer pour le joueur est la faute que `sim/carte.js`
 * existe pour empêcher, et que trois commentaires du dépôt nomment déjà.
 *
 * @param {{disposition: Array<{niveau: number}>}} base
 * @returns {number} entier ≥ 1
 */
export function niveauDUneBaseDuJoueur(base) {
  return Math.max(1, Math.round(niveauDesBatiments(base.disposition) / 10));
}

/**
 * Les bases du joueur avec leur POSITION et leur NIVEAU.
 *
 * ⚠ `basesDuJoueur` RESTE CE QU'ELLE EST — des positions, et rien d'autre. Son
 * en-tête le dit et `sim/poi.js` l'appelle pour ça ; lui faire rendre autre
 * chose changerait le contrat d'un module qui n'a rien demandé. Deux fonctions,
 * deux types, deux noms.
 *
 * @param {object} etat
 * @returns {Array<{rangee: number, colonne: number, niveau: number}>}
 */
export function forcesDuJoueur(etat) {
  const forces = etat.bases.map((b) => ({
    rangee: b.position.rangee,
    colonne: b.position.colonne,
    niveau: niveauDUneBaseDuJoueur(b),
  }));
  // ⚠⚠ ET LES RUINES QUE LE JOUEUR TIENT ENCORE — lot CONQUÊTE-24H. Elles
  // entrent par la même porte que les bases parce que le brief le dit dans ces
  // mots : « sa contribution s'additionne à celle des autres bases de ce camp,
  // comme n'importe quelle base ». Une seconde boucle ailleurs, avec sa propre
  // idée du partage, serait exactement la divergence que TERRITOIRE-LU vient de
  // refermer entre le prix et la carte.
  //
  // ⚠ SANS FENÊTRE, COMME LES BASES. Une ruine expire en vingt-quatre
  // heures : la liste des actives est courte par construction, et la borner
  // coûterait plus que de la parcourir.
  for (const ruine of ruinesActives(etat)) {
    if (ruine.vainqueur !== JOUEUR) continue;
    forces.push(ruine);
  }
  return forces;
}

/**
 * Les bases de l'Ouvrage d'une fenêtre, RASÉES EXCLUES, avec leur niveau.
 *
 * ⚠⚠ LE FILTRE DES RASÉES EST UNE CORRECTION DE CE LOT, ET LE DÉFAUT A ÉTÉ
 * MESURÉ AVANT D'ÊTRE CORRIGÉ. `territoireDeLaFenetre` appelait
 * `basesDeLaFenetre(etat.graine, …)` — **la graine seule, sans l'état** —, si
 * bien qu'une base rasée continuait de peindre son octogone : mesuré sur la
 * graine 11, base (1, 2), **trente cases restaient à l'Ouvrage** après le
 * rasage, pendant que `siteDeLaCase` y rendait déjà `null`. La carte montrait un
 * territoire autour d'un site que le joueur avait détruit.
 *
 * ⚠⚠ ET LE DÉFAUT NE FAUSSAIT PAS QU'UN DESSIN, IL FAUSSAIT LES SOMMES : une
 * base rasée pesait `raison ^ niveau` dans le partage du chevauchement. C'est
 * pourquoi il se corrige ICI, et pas au lot qui suit.
 *
 * ⚠ LE NIVEAU D'UNE BASE DE L'OUVRAGE EST CELUI DE SA RANGÉE — `niveauDeLaRangee`,
 * la seule grandeur que la carte lui donne, et celle que `siteDeLaCase` inscrit
 * déjà dans l'identité qu'il rend.
 *
 * @param {object} etat
 * @param {object} fenetre déjà élargie du plus grand rayon
 * @returns {Array<{rangee: number, colonne: number, niveau: number}>}
 */
export function forcesDeLOuvrage(etat, fenetre) {
  const rasees = casesRasees(etat);
  const forces = [];
  for (const base of basesDeLaFenetre(etat.graine, fenetre)) {
    if (rasees.has(cleDeLaCase(base.rangee, base.colonne))) continue;
    forces.push({ rangee: base.rangee, colonne: base.colonne, niveau: niveauDeLaRangee(base.rangee) });
  }
  // ⚠⚠ ET LES RUINES QUE L'OUVRAGE TIENT — lot CONQUÊTE-24H, ET C'EST LA
  // SYMÉTRIE DU §1 DU BRIEF. Aucun chemin du dépôt n'en produit aujourd'hui :
  // `raserLaBase` de `sim/raid-ouvrage.js` REDÉPLOIE la base du joueur vingt
  // cases plus au sud au lieu de la retirer, si bien qu'il n'y a rien à laisser
  // en ruine. La règle est écrite quand même — elle ne coûte que ces trois
  // lignes, et elle sera juste le jour où le chemin arrivera.
  //
  // ⚠ BORNÉES PAR LA FENÊTRE, comme les bases juste au-dessus : c'est le
  // contrat de cette fonction, et une ruine hors fenêtre ne peint pas dedans —
  // les deux appelants dilatent déjà du plus grand rayon.
  for (const ruine of ruinesActives(etat)) {
    if (ruine.vainqueur !== OUVRAGE) continue;
    if (ruine.rangee < fenetre.premiereRangee || ruine.rangee > fenetre.derniereRangee) continue;
    if (ruine.colonne < fenetre.premiereColonne || ruine.colonne > fenetre.derniereColonne) continue;
    forces.push(ruine);
  }
  return forces;
}

/**
 * La force d'une base de ce niveau sur une case à cette distance.
 *
 * ⚠⚠ EN `BigInt`, ET LES ENTIERS SÛRS N'AURAIENT PAS SUFFI. `NIVEAU.plafond`
 * vaut 50, donc 2⁵⁰ ≈ 1,1 × 10¹⁵ ; une somme de plusieurs bases dépasse
 * `Number.MAX_SAFE_INTEGER` (2⁵³ − 1), et un flottant perdrait des unités
 * **exactement dans les cas serrés** — ceux où le partage se décide. Le dépôt
 * emploie déjà des `BigInt` pour les points de recherche : ce n'est pas une
 * nouveauté à introduire, c'est une pratique à reprendre.
 *
 * ⚠ ET LES DEUX SOMMES COMPARÉES SONT DU MÊME TYPE DE BOUT EN BOUT. JavaScript
 * LÈVE sur `1n < 1` ; un zéro écrit `0` au lieu de `0n` ferait tomber la carte
 * entière au premier chevauchement.
 *
 * @param {number} niveau entier ≥ 1
 * @param {number} distance entier ≥ 0, dans la géométrie de l'influence
 * @returns {bigint}
 */
export function forceDUneBase(niveau, distance) {
  return RAISON ** BigInt(niveau - distance + DECALAGE_DES_EXPOSANTS);
}

/**
 * Qui l'emporte, entre deux sommes de force — et l'égalité va au joueur.
 *
 * ⚠⚠ ÉCRITE UNE FOIS, ET DEUX LECTEURS LA DEMANDENT : la carte d'une fenêtre et
 * la question d'UNE case. Deux écritures du même arbitrage seraient exactement la
 * divergence que le lot TERRITOIRE-LU vient de refermer entre le prix et la
 * carte — il serait absurde de la rouvrir un cran plus bas.
 *
 * ⚠⚠ L'ÉGALITÉ VA AU JOUEUR, ET IL FALLAIT TRANCHER. Deux sommes peuvent tomber
 * juste — 2¹¹ contre 2¹⁰ + 2¹⁰. C'est le seul reste de l'ancienne priorité
 * inconditionnelle, et il tient à la même raison qu'elle : le territoire allié
 * est la seule des deux zones qui ait un effet de jeu écrit — le tarif du raid —
 * et une case qui se paie comme alliée doit se lire comme telle.
 *
 * ⚠ `undefined` VEUT DIRE « PERSONNE NE PEINT ICI », PAS « ZÉRO ». Les deux
 * sommes sont des `BigInt` ou rien ; comparer `0n` à `undefined` serait un
 * mélange de types, et JavaScript lève dessus.
 *
 * @param {bigint|undefined} forceJoueur
 * @param {bigint|undefined} forceOuvrage
 * @returns {number} `NEUTRE`, `JOUEUR` ou `OUVRAGE`
 */
export function campQuiLEmporte(forceJoueur, forceOuvrage) {
  if (forceJoueur === undefined && forceOuvrage === undefined) return NEUTRE;
  if (forceOuvrage === undefined) return JOUEUR;
  if (forceJoueur === undefined) return OUVRAGE;
  return forceJoueur >= forceOuvrage ? JOUEUR : OUVRAGE;
}

/**
 * À qui appartient UNE case — la même règle que la carte, sur une seule case.
 *
 * ⚠⚠ ELLE EXISTE PARCE QUE LE PRIX DU RAID ET LA RÉCOLTE DES POI DEMANDENT LA
 * PROPRIÉTÉ DEPUIS LE LOT TERRITOIRE-LU, et qu'ils ne peuvent pas peindre une
 * fenêtre entière pour une case. `territoireDeLaFenetre` calcule 2 139 cases ;
 * celle-ci en calcule UNE, en interrogeant les bases d'un carré de 7 × 7 autour
 * d'elle.
 *
 * ⚠⚠ ET ELLE DOIT RENDRE EXACTEMENT CE QUE LA CARTE PEINT, SINON ON A DEUX
 * VÉRITÉS SUR LA MÊME CASE — c'est-à-dire la faute qu'on vient de corriger, un
 * cran plus bas. Les deux partagent `forceDUneBase`, `campQuiLEmporte`, les mêmes
 * planchers et la même distance ; `TL T1` les confronte case par case sur une
 * fenêtre entière.
 *
 * ⚠ SON COÛT TIENT AU MÉMO PARTAGÉ DU LOT MÉMO-DES-TOURS. Sans lui, elle
 * rouvrait un mémo vide par case — 153 µs pour une seule —, soit très exactement
 * le « 441 hachages PAR CASE » que l'en-tête de ce fichier existe pour refuser.
 * Avec lui, 24 µs.
 *
 * @param {object} etat
 * @param {number} rangee
 * @param {number} colonne
 * @returns {number} `NEUTRE`, `JOUEUR` ou `OUVRAGE`
 */
export function campDeLaCase(etat, rangee, colonne) {
  if (rangee < 1 || rangee > GEOGRAPHIE.carte.hauteur
    || colonne < 1 || colonne > GEOGRAPHIE.carte.largeur) return NEUTRE;

  // ⚠ LA FENÊTRE INTERROGÉE EST CELLE DU PLUS GRAND RAYON : une base peint au
  // plus à `DECALAGE_DES_EXPOSANTS` cases, donc aucune base plus loin ne compte.
  const marge = DECALAGE_DES_EXPOSANTS;
  const autour = {
    premiereRangee: rangee - marge, derniereRangee: rangee + marge,
    premiereColonne: colonne - marge, derniereColonne: colonne + marge,
  };
  const sommes = { [JOUEUR]: undefined, [OUVRAGE]: undefined };
  let plancher = NEUTRE;
  const ajouter = (base, camp) => {
    // ⚠⚠ UNE RUINE N'A PAS DE PLANCHER, ET C'EST UNE LECTURE — lot
    // CONQUÊTE-24H. Le plancher dit « le territoire où la BASE se trouve ne
    // change pas » ; une ruine n'est pas une base (§4 du brief), elle n'est
    // qu'une contribution de plus dans la somme de son camp. Elle peut donc
    // perdre sa propre case face à plus fort qu'elle — ce qui est exactement ce
    // que dit le §5 : « sa frontière suit celle des autres, sans traitement
    // particulier ». L'autre lecture — la ruine tient sa case coûte que coûte —
    // tient au retrait de ces deux mots.
    if (!base.ruine && base.rangee === rangee && base.colonne === colonne) {
      // ⚠ LE PLANCHER D'ETHAN : « le territoire où la base se trouve ne change
      // pas ». Le joueur l'emporte si les deux s'y trouvaient — cas impossible
      // aujourd'hui, `fondation.js` refusant de fonder sur un site de l'Ouvrage.
      if (plancher !== JOUEUR) plancher = camp;
    }
    const distance = distanceOctogonaleDInfluence(base.rangee - rangee, base.colonne - colonne);
    if (distance > RAYONS[camp]) return;
    const force = forceDUneBase(base.niveau, distance);
    sommes[camp] = sommes[camp] === undefined ? force : sommes[camp] + force;
  };
  for (const base of forcesDuJoueur(etat)) ajouter(base, JOUEUR);
  for (const base of forcesDeLOuvrage(etat, autour)) ajouter(base, OUVRAGE);
  if (plancher !== NEUTRE) return plancher;
  return campQuiLEmporte(sommes[JOUEUR], sommes[OUVRAGE]);
}

/**
 * Une carte d'occupation pour une fenêtre de la carte du monde.
 *
 * ⚠⚠ LA RÈGLE A ÉTÉ RENVERSÉE LE 07/09, POINT 13 D'ETHAN, ET CE BLOC RACONTE LES
 * DEUX. **L'ancienne :** « le joueur l'emporte sur l'Ouvrage quand les deux se
 * recouvrent », une LECTURE prise faute d'arbitrage, justifiée par le fait que le
 * territoire allié est la seule des deux zones qui ait un effet de jeu écrit — le
 * tarif du raid à +1 par case. **La nouvelle :**
 *
 *     influence d'une base sur une case = raison ^ (niveau − distance)
 *     influence d'un camp sur une case  = somme de ses bases
 *     la case revient au camp dont la somme est la plus forte
 *
 * **Pourquoi le renversement.** Ethan : « deux bases 10 est moins fort qu'une
 * base 20 ». Un joueur qui ne peut pas perdre une case ne peut pas non plus en
 * gagner une : la priorité inconditionnelle rendait tout le partage muet. Le
 * joueur PEUT donc désormais perdre une case face à une base de l'Ouvrage plus
 * forte, et c'est le point du lot.
 *
 * ⚠⚠ TROIS PLANCHERS SE POSENT PAR-DESSUS LE CALCUL, ET LE PREMIER EST UN
 * ARBITRAGE : « le territoire où la base se trouve ne change pas ». Ce n'est PAS
 * un cas particulier de la formule — sans lui, un niveau 20 à trois cases prendrait
 * le pied d'un niveau 1. Les deux autres sont des invariants : la portée ne bouge
 * pas (chaque base ne peint que son octogone, seul le PARTAGE dépend du niveau),
 * et une case hors de tout octogone reste `NEUTRE`.
 *
 * ⚠ SEULES LES BASES DE L'OUVRAGE PROJETTENT SON INFLUENCE, pas les camps ni les
 * avant-postes. Là encore c'est une lecture, et elle suit `TYPES_SITE` : la base
 * est le seul type qui « attaque le joueur », les deux autres sont du butin qui
 * suit le joueur et disparaît.
 *
 * @param {object} etat
 * @param {{premiereRangee: number, derniereRangee: number,
 *   premiereColonne: number, derniereColonne: number}} fenetre
 * @returns {{premiereRangee: number, premiereColonne: number,
 *   largeur: number, hauteur: number, occupant: Uint8Array}}
 */
export function territoireDeLaFenetre(etat, fenetre) {
  // ⚠⚠ LA CARTE D'OCCUPATION DÉBORDE D'UNE CASE LA FENÊTRE DEMANDÉE, ET C'EST CE
  // QUI ÉVITE UN CADRE AUTOUR DE L'ÉCRAN. Un côté est exposé quand la voisine
  // porte un autre occupant ; sans cette case de contexte, les voisines du bord
  // seraient inconnues, donc lues « neutres », et chaque défilement dessinerait
  // une frontière tout autour de la vue. On calcule donc un anneau de plus qu'on
  // ne rend.
  //
  // ⚠ AU BORD DE LA CARTE, EN REVANCHE, LA FRONTIÈRE EST VRAIE. Le territoire
  // s'y arrête pour de bon ; le clamp ci-dessous fait que la voisine hors carte
  // reste neutre, et le trait se dessine. C'est la différence entre le bord de
  // ce qu'on REGARDE et le bord de ce qui EXISTE.
  const rendu = {
    premiereRangee: Math.max(1, fenetre.premiereRangee),
    derniereRangee: Math.min(GEOGRAPHIE.carte.hauteur, fenetre.derniereRangee),
    premiereColonne: Math.max(1, fenetre.premiereColonne),
    derniereColonne: Math.min(GEOGRAPHIE.carte.largeur, fenetre.derniereColonne),
  };
  const r0 = Math.max(1, rendu.premiereRangee - 1);
  const c0 = Math.max(1, rendu.premiereColonne - 1);
  const r1 = Math.min(GEOGRAPHIE.carte.hauteur, rendu.derniereRangee + 1);
  const c1 = Math.min(GEOGRAPHIE.carte.largeur, rendu.derniereColonne + 1);
  const hauteur = Math.max(0, r1 - r0 + 1);
  const largeur = Math.max(0, c1 - c0 + 1);
  const occupant = new Uint8Array(hauteur * largeur);
  const carte = {
    premiereRangee: r0, premiereColonne: c0, largeur, hauteur, occupant, rendu,
  };
  if (hauteur === 0 || largeur === 0) return carte;

  // ⚠⚠ DEUX SOMMES PAR CASE, ET RIEN N'EST ALLOUÉ LÀ OÙ PERSONNE NE PEINT. Un
  // `Array` creux laisse `undefined` sur les cases vides ; les remplir de `0n`
  // coûterait deux `BigInt` par case de fenêtre, dont la plupart resteraient
  // nuls. `occupant` reste un `Uint8Array` : ce qu'on y écrit est toujours un
  // CAMP, jamais une force — les `BigInt` sont des intermédiaires de calcul.
  const sommes = { [JOUEUR]: new Array(hauteur * largeur), [OUVRAGE]: new Array(hauteur * largeur) };
  const planchers = [];

  const peindre = (centre, camp) => {
    const rayon = RAYONS[camp];
    const somme = sommes[camp];
    for (let dr = -rayon; dr <= rayon; dr += 1) {
      const rangee = centre.rangee + dr;
      if (rangee < r0 || rangee > r1) continue;
      for (let dc = -rayon; dc <= rayon; dc += 1) {
        const colonne = centre.colonne + dc;
        if (colonne < c0 || colonne > c1) continue;
        // ⚠⚠ LA DISTANCE EST CELLE DE L'OCTOGONE, ET C'EST LA MÊME FONCTION QUE
        // LE BARÈME DU RAID. `dansLOctogoneDInfluence` s'exprime par elle depuis
        // ce lot : le filtre d'appartenance et le partage du chevauchement
        // lisent donc UNE géométrie. Deux écritures de la même forme, c'est la
        // divergence que CLAUDE.md nomme depuis EUCLIDE — le prix affiché et la
        // carte peinte décrivant deux figures.
        //
        // ⚠ ET ELLE NE VAUT PAS TCHEBYCHEV DANS LES ANGLES : (2, 2) est à
        // distance 3, (3, 3) à distance 5. C'est précisément là que le partage
        // se joue, et un montage aligné ne distinguerait pas les deux.
        const distance = distanceOctogonaleDInfluence(dr, dc);
        if (distance > rayon) continue;
        const i = (rangee - r0) * largeur + (colonne - c0);
        somme[i] = (somme[i] ?? 0n) + forceDUneBase(centre.niveau, distance);
      }
    }
    // ⚠ LE PLANCHER SE RETIENT ICI ET S'APPLIQUE APRÈS LE PARTAGE. L'écrire dans
    // `occupant` maintenant ne servirait à rien : la boucle de partage repasse
    // ensuite sur toutes les cases et l'écraserait.
    //
    // ⚠ ET PAS POUR LES RUINES — même lecture qu'au-dessus, dans
    // `campDeLaCase` : les deux fonctions doivent rendre la même case, donc le
    // même refus. `C24 T1` les confronte.
    if (!centre.ruine && centre.rangee >= r0 && centre.rangee <= r1
      && centre.colonne >= c0 && centre.colonne <= c1) {
      planchers.push({ i: (centre.rangee - r0) * largeur + (centre.colonne - c0), camp });
    }
  };

  // ⚠ LA FENÊTRE SE DILATE DU PLUS GRAND RAYON. Une base hors champ projette
  // dans le champ ; ne demander que le visible ferait clignoter les bordures au
  // bord de l'écran à chaque défilement.
  const marge = DECALAGE_DES_EXPOSANTS;
  const elargie = {
    premiereRangee: r0 - marge,
    derniereRangee: r1 + marge,
    premiereColonne: c0 - marge,
    derniereColonne: c1 + marge,
  };
  // ⚠⚠ L'ORDRE DES DEUX BOUCLES N'A PLUS AUCUN EFFET, ET C'EST LE SIGNE QUE LE
  // RENVERSEMENT EST RÉEL. Ce bloc disait le contraire : « le joueur en premier,
  // et c'est ce qui rend la règle de priorité réelle » — parce qu'une priorité
  // qui tient à l'ordre de deux boucles n'est pas une règle, et qu'on pouvait
  // alors retirer le garde-fou sans qu'un seul test tombe. Il n'y a plus de
  // garde-fou, plus de priorité, et plus d'ordre à tenir : chaque base AJOUTE sa
  // force à la somme de son camp, et l'addition est commutative. `TF T6` inverse
  // les deux boucles et exige le même résultat — c'est la falsification qui
  // prouve que c'est bien la somme qui décide.
  for (const base of forcesDuJoueur(etat)) peindre(base, JOUEUR);
  for (const base of forcesDeLOuvrage(etat, elargie)) peindre(base, OUVRAGE);

  // ⚠⚠ LE PARTAGE, ET L'ÉGALITÉ VA AU JOUEUR. Deux sommes peuvent tomber juste
  // — 2¹¹ contre 2¹⁰ + 2¹⁰ — et il faut trancher. C'est le seul reste de
  // l'ancienne priorité, et il tient à la même raison qu'elle : le territoire
  // allié est la seule des deux zones qui ait un effet de jeu écrit, le tarif du
  // raid à +1 par case, et une case qui se paie comme alliée doit se lire comme
  // telle. Ça tient en un caractère si Ethan tranche autrement.
  //
  // ⚠ UNE CASE OÙ PERSONNE NE PEINT RESTE `NEUTRE`, et c'est le troisième
  // plancher : la somme ne décide que là où au moins une base peint.
  const forceJoueur = sommes[JOUEUR];
  const forceOuvrage = sommes[OUVRAGE];
  for (let i = 0; i < occupant.length; i += 1) {
    occupant[i] = campQuiLEmporte(forceJoueur[i], forceOuvrage[i]);
  }

  // ⚠⚠ LE PLANCHER D'ETHAN : « le territoire où la base se trouve ne change pas ».
  // Il se pose APRÈS le partage et il l'écrase — sans lui, un niveau 20 à trois
  // cases prendrait le pied d'un niveau 1, qui est le seul endroit de la carte
  // qu'une base ne peut pas perdre.
  //
  // ⚠ LE JOUEUR EN DERNIER, ET C'EST LE SEUL ENDROIT OÙ UN ORDRE COMPTE ENCORE.
  // Deux bases de camps différents ne peuvent pas partager une case aujourd'hui —
  // `fondation.js` refuse de fonder sur un site de l'Ouvrage —, donc la question
  // ne se pose pas ; le jour où elle se posera, le joueur garde le pied de sa
  // propre base, ce qui est la seule lecture défendable du plancher.
  for (const { i, camp } of planchers) if (camp === OUVRAGE) occupant[i] = camp;
  for (const { i, camp } of planchers) if (camp === JOUEUR) occupant[i] = camp;
  return carte;
}

/**
 * Les POSITIONS des bases du joueur — l'union de la spec §8, prise au mot.
 *
 * ⚠⚠ ELLE EST DEVENUE VRAIMENT PLURIELLE AU LOT BASES-0, 02/09/2026. Elle
 * rendait `[etat.position]` et se disait « une seule aujourd'hui, et le dire
 * ainsi le prépare » : le jour est venu, et c'est cette fonction seule qui a
 * changé, exactement comme annoncé. Elle rend aujourd'hui une liste d'un
 * élément parce que `etat.bases` en porte un — pas parce qu'elle le suppose.
 *
 * ⚠ ELLE REND DES POSITIONS, PAS DES BASES, et son homonyme de
 * `sim/points-attaque.js` rend des BASES. Les deux noms courts sont identiques
 * et les deux types ne le sont pas : ne jamais importer l'un pour l'autre.
 */
export function basesDuJoueur(etat) {
  return etat.bases.map((b) => b.position);
}

/** L'occupant d'une case de la carte d'occupation, `NEUTRE` hors champ. */
export function occupantDeLaCase(carte, rangee, colonne) {
  if (rangee < carte.premiereRangee || colonne < carte.premiereColonne) return NEUTRE;
  const i = rangee - carte.premiereRangee;
  const j = colonne - carte.premiereColonne;
  if (i >= carte.hauteur || j >= carte.largeur) return NEUTRE;
  return carte.occupant[i * carte.largeur + j];
}

/**
 * Les côtés EXPOSÉS de chaque case occupée — ce qu'on dessine, et rien d'autre.
 *
 * ⚠⚠ ETHAN, 31/08 : « afficher les territoires sur la carte. Cf screenshots,
 * seuls les bordures sont dessinés. » On ne remplit donc pas les cases : on rend
 * les côtés par lesquels une case touche autre chose qu'elle-même. Un remplissage
 * couvrirait le terrain, qui est ce qu'on est venu regarder.
 *
 * ⚠ UN CÔTÉ EST EXPOSÉ DÈS QUE LE VOISIN EST D'UN AUTRE OCCUPANT, neutre compris.
 * Deux territoires qui se touchent portent donc DEUX traits, un de chaque
 * couleur, et c'est ce qu'il faut : la frontière appartient aux deux.
 *
 * ⚠ ET LE BORD DE LA FENÊTRE N'EST PAS UNE FRONTIÈRE. `occupantDeLaCase` rend
 * `NEUTRE` hors champ, ce qui dessinerait un cadre autour de l'écran à chaque
 * défilement. On ne rend donc que les cases dont les quatre voisines sont DANS
 * la carte d'occupation — d'où la dilatation de la fenêtre chez l'appelant.
 *
 * ⚠⚠ ET UNE CASE PORTE AUSSI SES SOMMETS RENTRANTS — 05/09, sur rapport d'Ethan :
 * « quand tu dessines un territoire en U il manque les deux points, je pense
 * qu'il manque les coins en 270 degrés ». Un sommet est RENTRANT quand les deux
 * voisines orthogonales du coin sont du même camp et que la DIAGONALE ne l'est
 * pas : la frontière y tourne de 270° vu du dedans, et les deux bandes qui s'y
 * rejoignent appartiennent à deux cases voisines, si bien qu'aucune des deux ne
 * peint le carré de raccord. C'est un fait de MODÈLE — quel sommet tourne — et
 * `render/limite.js` en tire un sprite.
 *
 * ⚠⚠ UNE CASE PEUT PORTER UN SOMMET RENTRANT SANS AUCUN CÔTÉ EXPOSÉ, ET C'EST LE
 * CAS COURANT, PAS LE CAS RARE. Elle est alors entourée des quatre côtés par son
 * propre camp et ne touche l'extérieur que par un coin. Mesuré sur vingt graines
 * et quatre-vingts vues, 50 940 cases occupées : **360 sommets rentrants, et les
 * 360 sont sur des cases dont les quatre côtés sont intérieurs**. Une liste qui
 * ne retiendrait que les cases à côté exposé — ce que celle-ci faisait jusqu'au
 * 05/09 — n'en verrait donc AUCUN sur une vraie carte.
 *
 * @param {ReturnType<typeof territoireDeLaFenetre>} carte
 * @returns {Array<{rangee: number, colonne: number, camp: number,
 *   nord: boolean, est: boolean, sud: boolean, ouest: boolean,
 *   rentrants: {ne: boolean, es: boolean, so: boolean, no: boolean}}>}
 */
export function bordsDuTerritoire(carte) {
  const bords = [];
  // ⚠ ON PARCOURT LA FENÊTRE DEMANDÉE, PAS LA CARTE D'OCCUPATION. L'anneau de
  // contexte sert à LIRE les voisines, jamais à produire un bord : ses propres
  // voisines lui manquent, donc il en inventerait.
  const { rendu } = carte;
  for (let rangee = rendu.premiereRangee; rangee <= rendu.derniereRangee; rangee += 1) {
    for (let colonne = rendu.premiereColonne; colonne <= rendu.derniereColonne; colonne += 1) {
      const camp = occupantDeLaCase(carte, rangee, colonne);
      if (camp === NEUTRE) continue;
      const autre = (dr, dc) => occupantDeLaCase(carte, rangee + dr, colonne + dc) !== camp;
      // ⚠ NORD EST LA RANGÉE DÉCROISSANTE, comme sur l'écran Monde : la rangée 1
      // s'y dessine en haut. Ce n'est PAS la boussole de `sim/rendu-pose.js`,
      // qui décrit la grille de COMBAT et son retournement — les deux ne parlent
      // pas de la même surface, et les confondre retournerait les bordures.
      // ⚠ LES QUATRE COINS SE NOMMENT COMME LES SPRITES, dans l'ordre canonique
      // `n e s o` : le coin nord-est s'écrit `ne`, jamais `en`. C'est l'ordre de
      // `COTES` de `render/limite.js`, et un test confronte les deux.
      const rentrant = (dr, dc) => !autre(dr, 0) && !autre(0, dc) && autre(dr, dc);
      const cote = {
        rangee, colonne, camp, nord: autre(-1, 0), est: autre(0, 1), sud: autre(1, 0), ouest: autre(0, -1),
        rentrants: {
          ne: rentrant(-1, 1), es: rentrant(1, 1), so: rentrant(1, -1), no: rentrant(-1, -1),
        },
      };
      const unSommet = cote.rentrants.ne || cote.rentrants.es
        || cote.rentrants.so || cote.rentrants.no;
      if (cote.nord || cote.est || cote.sud || cote.ouest || unSommet) bords.push(cote);
    }
  }
  return bords;
}
