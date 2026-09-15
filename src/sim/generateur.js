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
import { hachageBrut } from './peuplement.js';
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
  FORMES_DE_PAQUET,
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
 * Le sel du flux de PLACEMENT — le second, celui qui ne touche pas au premier.
 *
 * ⚠⚠ HUIT, PARCE QUE LES SEPT PREMIERS SONT PRIS. `sim/peuplement.js` emploie 0
 * et 1, `sim/poi.js` 2 et 3, `sim/saveur.js` 4, `sim/site-de-la-case.js` 5,
 * `sim/raid-ouvrage.js` 6. Deux tirages sans rapport qui partagent un sel
 * finissent par se corréler — c'est écrit dans `render/terrain.js`, qui a retiré
 * 2 et 3 plutôt que de les réemployer.
 *
 * ⚠ LE NOM DIT « DES RANGÉES » ET IL EST GARDÉ TEL QUEL : le sel est une valeur
 * figée dans les tests et dans les sauvegardes dérivées, et le renommer ne
 * changerait rien à ce qu'il hache. Depuis le lot PAQUETS il sème TOUT le
 * placement — paquets, formes, ancres, uniques, tiers, obstacles.
 */
export const SEL_PLACEMENT_DES_RANGEES = 8;

/** Borne d'une clé de tirage : un entier de [0, CLE_MAX]. */
const CLE_MAX = 1000000;

/**
 * Ramène une clé de [0, CLE_MAX] dans [0, n[ — UN SEUL tirage, quel que soit n.
 *
 * ⚠ LE BIAIS DU MODULO EST ÉVITÉ, PAS ACCEPTÉ. Un `cle % n` favoriserait les
 * petites valeurs de 1 pour 10⁶ ; la mise à l'échelle ne favorise personne à
 * mieux que 10⁻⁶ près. `sim/poi.js` accepte le biais par écrit parce qu'il tire
 * une case sur une carte ; ici on tire une rangée sur huit ou une forme sur dix,
 * et un dixième de pour-cent de dérive sur huit valeurs se lirait à l'œil sur
 * mille sites.
 */
function borner(cle, n) {
  return n <= 1 ? 0 : Math.floor((cle * n) / (CLE_MAX + 1));
}

// ---------------------------------------------------------------------------
// Placement par PAQUETS — lot PAQUETS, 09/09/2026
// ---------------------------------------------------------------------------
//
// ⚠⚠ LE MODÈLE LIGNE/COLONNE EST PARTI EN ENTIER. Six fonctions sont sorties —
// `taillesDeRangee`, `contigueDepuisLOrigine`, `profilRealisable`,
// `profilDeCharge`, `repartirLesColonnes`, `placementDesRangees` — parce que
// c'est ce modèle qui produisait « toujours par ligne ou par colonne » : il ne
// savait construire que des rangées remplies jusqu'à un plafond, décalées d'un
// offset. Une seule mécanique sert désormais les deux bandes ; seuls les
// paramètres changent.
//
// ⚠⚠ ET TOUT LE PLACEMENT TIRE SUR LE FLUX `placement`, JAMAIS SUR `rng`. Le
// flux semé par `graine` ne sert plus qu'à la COMPOSITION — `composerRepartition`
// pour la garnison, et rien d'autre. Avant ce lot, `placerBatiments` consommait
// `rng` AVANT que la garnison ne se compose : tout changement de placement
// décalait le flux et changeait la garnison, donc remappait par indice les
// `pvDefensesMilli` de tout site à moitié rasé — c'est pourquoi `SAVE_VERSION`
// passe à 30 ICI, et pourquoi c'est la DERNIÈRE fois qu'un lot de placement la
// fait bouger. `PQ T7` le garde : changer le sel de placement ne change pas la
// liste des identifiants.
//
// ⚠⚠ LE NOMBRE DE TIRAGES NE DÉPEND QUE DE N, JAMAIS DU RÉSULTAT. Tout se tire
// AVANT tout test, pour le nombre MAXIMAL de paquets que N admet — un candidat
// rejeté, un paquet qui n'existe pas, un repli déclenché consomment leurs
// tirages comme un accepté. Un « tire jusqu'à ce que ça passe » ferait diverger
// deux parties identiques ; `PQ T8` compte les tirages sur trois mille montages.

/** Les rangées d'une bande, dans l'ordre croissant. */
function rangeesDeLaBande(bande) {
  const sortie = [];
  for (let r = bande.premiere; r <= bande.derniere; r += 1) sortie.push(r);
  return sortie;
}

/**
 * Le nombre MAXIMAL de paquets que `nb` occupants peuvent former : tous à la
 * taille minimale, le dernier prenant le reste. C'est sur ce nombre que les
 * tirages sont pris, pour qu'ils ne dépendent pas du découpage tiré.
 */
function nbPaquetsMax(nb) {
  const { min, paquetUnique } = DISPOSITION_DEFENSES.tailleDePaquet;
  if (nb < paquetUnique) return 1;
  return Math.ceil(nb / min);
}

/**
 * Découpe `nb` occupants en tailles de paquet — 3 ou 4 tirés un par un, le
 * dernier prenant le reste, de 2 à 5. Sous `paquetUnique`, un seul paquet.
 *
 * ⚠ `nbPaquetsMax(nb)` TIRAGES SONT PRIS, MÊME SI LE DÉCOUPAGE EN EMPLOIE MOINS :
 * le compte ne dépend pas de ce qui sort.
 */
function decouperEnPaquets(placement, nb) {
  const { min, max, resteMin, resteMax, paquetUnique } = DISPOSITION_DEFENSES.tailleDePaquet;
  const tirages = [];
  for (let k = 0; k < nbPaquetsMax(nb); k += 1) tirages.push(entier(placement, min, max));
  if (nb < paquetUnique) return [nb];
  const tailles = [];
  let reste = nb;
  let k = 0;
  while (reste >= paquetUnique) {
    tailles.push(tirages[k]);
    reste -= tirages[k];
    k += 1;
  }
  if (reste < resteMin || reste > resteMax) {
    throw new Error(`générateur : reste de paquet ${reste} hors de ${resteMin}…${resteMax}`);
  }
  tailles.push(reste);
  return tailles;
}

/**
 * Les tiers de la bande de DÉFENSE, dérivés de `GRILLE.bandes.defense` et des
 * largeurs de `tiersDeLaBande` : `{ avant: {premiere, derniere}, … }`.
 */
export function tiersDeLaDefense() {
  const bande = GRILLE.bandes.defense;
  const sortie = {};
  let rangee = bande.premiere;
  for (const [nom, largeur] of DISPOSITION_DEFENSES.tiersDeLaBande) {
    sortie[nom] = { premiere: rangee, derniere: rangee + largeur - 1 };
    rangee += largeur;
  }
  if (rangee - 1 !== bande.derniere) {
    throw new Error(
      `générateur : les tiers couvrent ${rangee - bande.premiere} rangées, `
      + `la bande en fait ${bande.derniere - bande.premiere + 1}`,
    );
  }
  return sortie;
}

/**
 * Tire le tiers préféré d'une catégorie, sur les poids de `poidsDeTiers`.
 * @returns {{premiere:number, derniere:number}}
 */
function tiersPrefere(cle, categorie) {
  const poids = DISPOSITION_DEFENSES.poidsDeTiers[categorie];
  if (poids === undefined) throw new Error(`générateur : catégorie sans poids « ${categorie} »`);
  const tiers = tiersDeLaDefense();
  const total = Object.values(poids).reduce((a, b) => a + b, 0);
  let seuil = borner(cle, total);
  for (const [nom, p] of Object.entries(poids)) {
    if (seuil < p) return tiers[nom];
    seuil -= p;
  }
  throw new Error('générateur : tirage de tiers hors des poids');
}

/** Le catalogue de formes d'une taille, en liste stable. */
function formesDeTaille(taille) {
  const formes = FORMES_DE_PAQUET[taille];
  if (formes === undefined) throw new Error(`générateur : aucune forme de taille ${taille}`);
  return Object.values(formes);
}

/** Distance de Tchebychev entre deux cases. */
function tchebychev(a, b) {
  return Math.max(Math.abs(a.rangee - b.rangee), Math.abs(a.colonne - b.colonne));
}

/**
 * Le placement d'une bande — l'état qu'un paquet consulte et qu'il modifie.
 * `prises` porte les cases occupées, `parRangee` et `parColonne` les charges.
 */
function ouvrirLaBande(bande, plafondRangee, plafondColonne) {
  return {
    bande,
    plafondRangee,
    plafondColonne,
    prises: new Set(),
    occupees: [],
    parRangee: new Map(),
    parColonne: new Array(GRILLE.largeur + 1).fill(0),
  };
}

/** La distance de répulsion d'un jeu de cases : Tchebychev minimale aux prises, plafonnée. */
function repulsion(etat, cases) {
  const max = DISPOSITION_DEFENSES.repulsionMax;
  let d = max;
  for (const c of cases) {
    for (const o of etat.occupees) {
      d = Math.min(d, tchebychev(c, o));
      if (d === 0) return 0;
    }
  }
  return d;
}

/** La charge de colonne la plus haute qu'un jeu de cases produirait. */
function chargeDeColonne(etat, cases) {
  const ajout = new Map();
  for (const c of cases) ajout.set(c.colonne, (ajout.get(c.colonne) ?? 0) + 1);
  let pire = 0;
  for (const [colonne, n] of ajout) pire = Math.max(pire, etat.parColonne[colonne] + n);
  return pire;
}

/** Un jeu de cases tient-il — bande, grille, cases libres, plafonds ? */
function admissible(etat, cases, avecPlafondColonne = true) {
  const parRangee = new Map();
  const parColonne = new Map();
  for (const c of cases) {
    if (c.rangee < etat.bande.premiere || c.rangee > etat.bande.derniere) return false;
    if (c.colonne < 1 || c.colonne > GRILLE.largeur) return false;
    const cle = cleCase(c.rangee, c.colonne);
    if (etat.prises.has(cle)) return false;
    parRangee.set(c.rangee, (parRangee.get(c.rangee) ?? 0) + 1);
    parColonne.set(c.colonne, (parColonne.get(c.colonne) ?? 0) + 1);
  }
  for (const [r, n] of parRangee) {
    if ((etat.parRangee.get(r) ?? 0) + n > etat.plafondRangee) return false;
  }
  if (avecPlafondColonne) {
    for (const [c, n] of parColonne) {
      if (etat.parColonne[c] + n > etat.plafondColonne) return false;
    }
  }
  return true;
}

/** Prend une case dans la bande. */
function prendre(etat, c) {
  etat.prises.add(cleCase(c.rangee, c.colonne));
  etat.occupees.push(c);
  etat.parRangee.set(c.rangee, (etat.parRangee.get(c.rangee) ?? 0) + 1);
  etat.parColonne[c.colonne] += 1;
}

/**
 * Le repli : les membres d'un paquet se posent CASE PAR CASE, par balayage
 * déterministe de la bande — chaque case prise étant celle qui maximise la
 * même distance de répulsion sous les mêmes plafonds. Il ne tire RIEN.
 *
 * ⚠⚠ IL DOIT ABOUTIR, ET LE PROUVER. La bande de défense offre 6 × 8 = 48 cases
 * sous plafond pour un besoin de 39 au pire ; celle des bâtiments 9 × 8 = 72
 * pour 39. Si aucune case ne tient sous les DEUX plafonds, le plafond de
 * colonne — qui n'est qu'un filtre d'équité, pas un invariant du moteur — est
 * relâché pour cette case-là, et le rapport compte ces relâchements ; si aucune
 * case ne tient sous le seul plafond de rangée, c'est un défaut de programme,
 * et on LÈVE en nommant la bande et les comptes.
 *
 * @returns {Array<{rangee:number, colonne:number}>} une case par membre
 */
function replierCaseParCase(etat, taille, rangeesPreferees, quoi, compteur) {
  const sortie = [];
  const rangees = [
    ...rangeesPreferees,
    ...rangeesDeLaBande(etat.bande).filter((r) => !rangeesPreferees.includes(r)),
  ];
  for (let m = 0; m < taille; m += 1) {
    let meilleure = null;
    for (const strict of [true, false]) {
      for (const rangee of rangees) {
        for (let colonne = 1; colonne <= GRILLE.largeur; colonne += 1) {
          const c = { rangee, colonne };
          if (!admissible(etat, [c], strict)) continue;
          const score = [repulsion(etat, [c]), -chargeDeColonne(etat, [c])];
          if (meilleure === null
            || score[0] > meilleure.score[0]
            || (score[0] === meilleure.score[0] && score[1] > meilleure.score[1])) {
            meilleure = { c, score };
          }
        }
      }
      if (meilleure !== null) {
        if (!strict) compteur.colonneRelachee += 1;
        break;
      }
    }
    if (meilleure === null) {
      throw new Error(
        `générateur : ${quoi} — ${etat.occupees.length} posés, `
        + `${taille - m} restent sans case sous le plafond de ${etat.plafondRangee} par rangée`,
      );
    }
    prendre(etat, meilleure.c);
    sortie.push(meilleure.c);
  }
  compteur.replis += 1;
  return sortie;
}

/**
 * Pose une suite de paquets dans une bande, par répulsion, à nombre de tirages
 * FIXE.
 *
 * Pour chaque paquet, `candidatsParPaquet` jeux `(forme, clé de rangée, colonne
 * d'ancre)` sont tirés AVANT tout test. Un candidat est rejeté s'il sort de la
 * bande ou de la grille, recouvre une case prise, fait dépasser le plafond de
 * sa rangée, ou porte une colonne au-delà du plafond de colonne. Parmi ceux qui
 * restent, on garde celui qui MAXIMISE la distance de Tchebychev minimale aux
 * cases déjà prises, plafonnée à `repulsionMax` ; à égalité, la charge de
 * colonne la plus faible tranche, puis le rang du tirage. Si les dix sont
 * rejetés, `replierCaseParCase`.
 *
 * ⚠ LA RANGÉE D'ANCRE SE TIRE DANS LE TIERS PRÉFÉRÉ quand la bande en a — la
 * défense —, dans la bande entière sinon. La forme, elle, peut déborder du tiers :
 * seule la bande la borne. C'est ce qui rend le biais MOU.
 *
 * @param {object} placement le flux de PLACEMENT
 * @param {Array<{taille:number, categorie:string|null}>} paquets
 * @param {object} bande `{premiere, derniere}`
 * @param {number} plafondRangee
 * @param {number} nb occupants de la bande en tout
 * @param {string} quoi pour les messages
 * @returns {{ cases: Array<Array<{rangee,colonne}>>, compteur: object }}
 */
function poserLesPaquets(placement, paquets, bande, plafondRangee, nb, quoi) {
  const K = DISPOSITION_DEFENSES.candidatsParPaquet;
  const plafondColonne = Math.ceil(nb / GRILLE.largeur) + DISPOSITION_DEFENSES.margeDeColonne;
  const etat = ouvrirLaBande(bande, plafondRangee, plafondColonne);
  const compteur = { replis: 0, colonneRelachee: 0, candidatsRetenus: [] };

  // Tous les tirages d'abord, pour le nombre MAXIMAL de paquets.
  const tirages = [];
  for (let p = 0; p < nbPaquetsMax(nb); p += 1) {
    const cleTiers = entier(placement, 0, CLE_MAX);
    const candidats = [];
    for (let k = 0; k < K; k += 1) {
      candidats.push({
        cleForme: entier(placement, 0, CLE_MAX),
        cleRangee: entier(placement, 0, CLE_MAX),
        colonne: entier(placement, 1, GRILLE.largeur),
      });
    }
    tirages.push({ cleTiers, candidats });
  }

  const cases = [];
  paquets.forEach((paquet, p) => {
    const { cleTiers, candidats } = tirages[p];
    const formes = formesDeTaille(paquet.taille);
    const zone = paquet.categorie === null ? bande : tiersPrefere(cleTiers, paquet.categorie);
    const hauteur = zone.derniere - zone.premiere + 1;
    let meilleur = null;
    candidats.forEach((cand, k) => {
      const forme = formes[borner(cand.cleForme, formes.length)];
      const ancre = { rangee: zone.premiere + borner(cand.cleRangee, hauteur), colonne: cand.colonne };
      const jeu = forme.map(([dr, dc]) => ({ rangee: ancre.rangee + dr, colonne: ancre.colonne + dc }));
      if (!admissible(etat, jeu)) return;
      const score = [repulsion(etat, jeu), -chargeDeColonne(etat, jeu), -k];
      if (meilleur === null
        || score[0] > meilleur.score[0]
        || (score[0] === meilleur.score[0] && score[1] > meilleur.score[1])) {
        meilleur = { jeu, score, k };
      }
    });
    if (meilleur !== null) {
      for (const c of meilleur.jeu) prendre(etat, c);
      cases.push(meilleur.jeu);
      compteur.candidatsRetenus.push(meilleur.k);
    } else {
      cases.push(replierCaseParCase(etat, paquet.taille, rangeesDeLaBande(zone), quoi, compteur));
      compteur.candidatsRetenus.push(null);
    }
  });
  return { cases, compteur };
}

/**
 * Pose les bâtiments par paquets. Souche et Étai sont deux occupants comme les
 * autres, et rejoignent des paquets — le MÊME une fois sur
 * `uniquesDansLeMemePaquetUneFoisSur`, deux paquets distincts sinon.
 *
 * ⚠⚠ ILS NE SONT PLUS CLOUÉS À LA RANGÉE 18 — lot PAQUETS, arbitré par Ethan le
 * 09/09. Le motif d'avant — « ce sont les deux objectifs du raid, ils doivent
 * coûter la traversée complète » — était presque inerte, et c'est MESURÉ : en
 * les déplaçant de la rangée 18 vers 15, 13 puis 11, 120 raids par ligne, le
 * taux de rasage ne bouge pas (±1 sur 120 ; joueur 30 vs base 15 : 118 · 118 ·
 * 116 · 118) et seule la durée tombe de 20 à 30 % (173 → 122 ticks). À niveau
 * égal c'est 0 rasage sur 120 quelle que soit la rangée : l'assaut meurt dans la
 * bande de défense. La traversée ne protégeait rien.
 *
 * ⚠ « DEVANT » VEUT DIRE RANGÉE 11, PAS RANGÉE 3 : `creerCombat` refuse un
 * bâtiment hors de sa bande, et `RANGEE_DEFENSE_FRANCHIE` pilote le plancher de
 * réserve à la rangée 11. Les bandes ne bougent pas ; c'est un autre lot.
 *
 * @returns {{ poses: object[], compteur: object }}
 */
function placerBatiments(placement, liste, niveau) {
  const bande = GRILLE.bandes.batiments;
  const nb = liste.length;
  const tailles = decouperEnPaquets(placement, nb);
  // Les trois tirages des uniques, toujours pris — même à un seul paquet.
  const memePaquet = entier(placement, 1, DISPOSITION_DEFENSES.uniquesDansLeMemePaquetUneFoisSur) === 1;
  const cle1 = entier(placement, 0, CLE_MAX);
  const cle2 = entier(placement, 0, CLE_MAX);

  const uniques = [];
  const proportionnels = [];
  liste.forEach((id, i) => (BATIMENTS[id].unique ? uniques : proportionnels).push(i));
  if (uniques.length > 2) throw new Error(`générateur : ${uniques.length} uniques, deux attendus`);

  // Les créneaux de chaque paquet, remplis par les uniques puis les autres.
  const creneaux = tailles.map((t) => new Array(t).fill(null));
  const p1 = borner(cle1, tailles.length);
  let p2;
  if (memePaquet || tailles.length === 1) {
    p2 = p1;
  } else {
    p2 = borner(cle2, tailles.length - 1);
    if (p2 >= p1) p2 += 1;
  }
  const paquetDesUniques = [p1, p2];
  uniques.forEach((i, u) => {
    const paquet = creneaux[paquetDesUniques[u]];
    paquet[paquet.indexOf(null)] = i;
  });
  let suivant = 0;
  for (const paquet of creneaux) {
    for (let s = 0; s < paquet.length; s += 1) {
      if (paquet[s] === null) paquet[s] = proportionnels[suivant++];
    }
  }
  if (suivant !== proportionnels.length) {
    throw new Error(`générateur : ${suivant} créneaux pour ${proportionnels.length} bâtiments`);
  }

  const paquets = tailles.map((taille) => ({ taille, categorie: null }));
  const { cases, compteur } = poserLesPaquets(
    placement, paquets, bande, GRILLE.largeur, nb, 'bâtiments',
  );
  const poses = new Array(nb);
  creneaux.forEach((paquet, p) => {
    paquet.forEach((i, s) => {
      poses[i] = { id: liste[i], rangee: cases[p][s].rangee, colonne: cases[p][s].colonne, niveau };
    });
  });
  return { poses, compteur };
}

/**
 * Pose les défenses par paquets. La liste arrive groupée par catégorie
 * (`ordonnerDefenses`), si bien qu'un paquet est homogène — au plus deux
 * catégories à la couture — et que son tiers préféré, tiré sur la catégorie de
 * son premier membre, a un sens.
 *
 * ⚠⚠ L'ORDRE DES CATÉGORIES N'EST PLUS UN INTERDIT, C'EST UN BIAIS — §1.3 du
 * brief. Mesuré avant le lot, base 40, 500 graines : l'artillerie jamais devant
 * la rangée 8, la barrière jamais derrière la 6. Ethan : « un peu plus mou, de
 * l'artillerie au milieu et des barrières au milieu ». Le gradient reste — les
 * poids de `poidsDeTiers` —, l'interdit tombe.
 *
 * ⚠ CE QUI NE BOUGE PAS : six occupants par rangée (`occupantsMaxParRangee`),
 * la bande, le déterminisme, et la moitié GÉOMÉTRIQUE de
 * `verifierLeRetraitDesPortees`.
 */
function placerDefenses(placement, liste, niveau) {
  const bande = GRILLE.bandes.defense;
  const nb = liste.length;
  if (nb === 0) return { poses: [], compteur: { replis: 0, colonneRelachee: 0, candidatsRetenus: [] } };
  const tailles = decouperEnPaquets(placement, nb);
  const paquets = [];
  let debut = 0;
  for (const taille of tailles) {
    paquets.push({ taille, categorie: categorieDe(liste[debut]) });
    debut += taille;
  }
  const { cases, compteur } = poserLesPaquets(
    placement, paquets, bande, DISPOSITION_DEFENSES.occupantsMaxParRangee, nb, 'défenses',
  );
  const poses = [];
  let i = 0;
  cases.forEach((jeu) => {
    for (const c of jeu) {
      poses.push({ id: liste[i], rangee: c.rangee, colonne: c.colonne, niveau });
      i += 1;
    }
  });
  verifierLeRetraitDesPortees(poses);
  return { poses, compteur };
}

/**
 * La rangée la plus AVANCÉE d'où cette pièce atteint encore quelque chose.
 *
 * ⚠⚠ ELLE EST DÉRIVÉE, ET LE RELEVÉ QUI LA FONDE EST DANS LE RAPPORT. Une pièce
 * à portée minimale ne peut pas tirer sur ce qui la touche : `creerCombat`
 * compare `porteeMiniCarree ≤ d² ≤ porteeCarree`, les deux axes en milli-cases.
 * On cherche donc, pour chaque rangée, s'il existe UNE case de la grille dans
 * cette couronne — et on rend la plus avancée qui en porte une.
 *
 * ⚠⚠ ET LE RÉSULTAT EST VACUEUX AUJOURD'HUI, CE QUI EST UN FAIT ET NON UN
 * ÉCHEC. Les trois artilleries portent `porteeMini: 3.5` et `portee: 5.5` :
 * depuis n'importe quelle rangée de la bande, la couronne `[12,25 ; 30,25]`
 * contient des cases — quatre rangées devant, par exemple. **Aucune rangée de la
 * bande de défense n'est donc géométriquement interdite à aucune pièce.** C'est
 * ce que `data/sites.js` mesure déjà depuis le 25/08 : « une Faucheuse en rangée
 * 3 atteint les colonnes lointaines dès l'apparition […] Elle n'est PAS
 * inerte. » La phrase « posée à l'avant, elle ne tirerait jamais » est fausse, et
 * l'en-tête de `placerDefenses` la portait encore.
 *
 * ⚠ CE QUI BORNE VRAIMENT L'ARTILLERIE EST L'ORDRE, PAS LA GÉOMÉTRIE — et c'est
 * `verifierLeRetraitDesPortees` juste dessous qui le garde. Cette fonction-ci
 * reste écrite parce qu'elle deviendra mordante le jour où une portée minimale
 * montera : elle se lit dans les données, elle ne recopie aucun nombre.
 *
 * @param {string} id
 * @returns {number} la rangée la plus avancée qui garde une cible atteignable
 */
export function rangeeLaPlusAvanceeQuiTire(id) {
  const ligne = DEFENSES[id] ?? UNITES[id];
  if (ligne === undefined) throw new Error(`générateur : « ${id} » n'est ni défense ni unité`);
  const mini = enEntier(ligne.porteeMini ?? 0, MILLE, `${id}.porteeMini`);
  const maxi = enEntier(ligne.portee ?? 0, MILLE, `${id}.portee`);
  const bande = GRILLE.bandes.defense;
  // ⚠⚠ UNE PIÈCE QUI NE TIRE PAS N'A AUCUNE CONTRAINTE DE RANGÉE, et l'oublier
  // donnait l'inverse exact de la règle. Un Mur a `portee: 0` : la couronne
  // `[0 ; 0]` ne contient aucune case, la boucle ci-dessous n'aboutissait jamais
  // et le repli rendait la rangée du FOND — c'est-à-dire qu'un Merlon n'aurait
  // eu le droit de se poser que collé aux bâtiments. Mesuré par `CR T3`, qui
  // lisait 10 là où il attendait 3.
  if (maxi === 0) return bande.premiere;
  for (let rangee = bande.premiere; rangee <= bande.derniere; rangee++) {
    for (let colonne = 1; colonne <= GRILLE.largeur; colonne++) {
      for (let r = 1; r <= GRILLE.longueur; r++) {
        for (let c = 1; c <= GRILLE.largeur; c++) {
          const dr = (rangee - r) * MILLE;
          const dc = (colonne - c) * MILLE;
          const d2 = dr * dr + dc * dc;
          if (d2 >= mini * mini && d2 <= maxi * maxi && d2 > 0) return rangee;
        }
      }
    }
  }
  return bande.derniere;
}

/**
 * La moitié GÉOMÉTRIQUE de l'ancienne garde de retrait des portées : aucune
 * artillerie ne se pose devant la rangée d'où elle ne tirerait plus.
 *
 * ⚠⚠ ELLE EST VACUEUSE AUJOURD'HUI, ET ELLE RESTE — lot PAQUETS, §4 du brief.
 * Mesuré au lot CIBLES-RANGÉES : aucune rangée de la bande n'est interdite à
 * aucune pièce, donc elle ne lève pas. Elle deviendra mordante le jour où une
 * portée minimale montera, et c'est précisément le jour où le placement libre
 * serait dangereux. La garder coûte zéro.
 *
 * ⚠⚠ SA MOITIÉ D'ORDRE — « l'artillerie reste DERRIÈRE tout le reste » — EST
 * PARTIE AVEC LE LOT PAQUETS. C'est l'interdit que le §1.3 annule : l'ordre des
 * catégories est devenu un biais MOU, porté par `poidsDeTiers`, et `PQ T6` le
 * mesure dans les deux sens. Une garde qui lèverait sur une artillerie en
 * rangée 5 rendrait ce biais impossible.
 */
function verifierLeRetraitDesPortees(poses) {
  for (const a of poses) {
    if (categorieDe(a.id) !== 'artillerie') continue;
    if (a.rangee < rangeeLaPlusAvanceeQuiTire(a.id)) {
      throw new Error(
        `générateur : ${a.id} en rangée ${a.rangee}, devant sa rangée `
        + `${rangeeLaPlusAvanceeQuiTire(a.id)} — elle n'aurait aucune cible`,
      );
    }
  }
}

/** Groupe les défenses par catégorie, dans l'ordre de DISPOSITION_DEFENSES. */
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
 * ⚠ `offense` RESTE VIDE ICI, et ce n'est pas un oubli. Un module d'attaquant se
 * lit sur `p.module`, que `moduleOuvrage` ne renseigne pas ; et dans un raid sur
 * un SITE, l'Ouvrage est le défenseur — sa liste d'offense n'y a personne pour
 * la lire. Y verser cette liste armerait des modules sur des pièces qui ne les
 * portent pas.
 *
 * ⚠⚠ L'AUTRE CANAL SE REMPLIT DEPUIS LE LOT NEUTRALISATION, 08/09/2026, ET
 * AILLEURS : `modulesOuvrageOffenseAu` de `sim/raid-ouvrage.js`, appelée par
 * `montageDeLaBaseDuJoueur` — le seul chemin du dépôt où l'Ouvrage ATTAQUE.
 * **Ce fichier-ci n'a pas une ligne de changée**, et `NEUT T10` l'exige : il
 * asserte que `genererSite(...).modulesDebloques.ouvrage.offense` reste vide à
 * tous les niveaux, ce qui est le seul garde-fou qui dise, avant les deux cents
 * témoins, que le §6 a été appliqué au bon fichier.
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
  // ⚠⚠ UN SECOND FLUX, ET C'EST LA CONDITION POUR NE PAS BUMPER `SAVE_VERSION`
  // — lot DISPOSITION-OUVRAGE, 08/09. Le placement des rangées et les colonnes
  // des deux uniques tirent ICI, jamais dans `rng`. Un seul tirage ajouté au
  // premier flux déplacerait la position à laquelle `composerRepartition`
  // compose la garnison, donc changerait la SUITE des défenseurs pour une graine
  // donnée — mesuré, elle varie avec la graine sur 18 des 21 couples
  // (type, niveau) essayés. Or `sim/site-entame.js` range `pvDefensesMilli` PAR
  // INDICE dans le montage régénéré : les dégâts de tout site à moitié rasé
  // d'une sauvegarde existante se retrouveraient sur d'autres pièces, sans
  // erreur, sans message et sans test rouge. Le second flux laisse le premier
  // intact d'un bout à l'autre.
  //
  // ⚠ IL SE DÉRIVE PAR `hachageBrut`, PAS PAR UNE ARITHMÉTIQUE SUR LA GRAINE.
  // `creerRng` pose `s = graine >>> 0` et `tirer` avance de `0x6d2b79f5` : deux
  // graines qui diffèrent d'un multiple de ce pas rendent le MÊME flux décalé.
  // Un `graine + 1` aurait donc pu recoller au premier flux ; l'avalanche de
  // `hachageBrut` ne le peut pas.
  const placement = creerRng(hachageBrut(graine, 0, 0, SEL_PLACEMENT_DES_RANGEES));
  const effectifs = densite(type, niveau);

  // ⚠⚠ LA COMPOSITION TIRE SUR `rng`, LE PLACEMENT SUR `placement`, ET LES DEUX
  // NE SE CROISENT PLUS — lot PAQUETS, 09/09. La garnison se compose AVANT
  // toute pose et après aucune : `rng` n'est plus consommé par personne d'autre.
  const garnison = composerRepartition(rng, GARNISON.parNiveau, niveau, GARNISON.variancePoints);
  const listeDefenses = [];
  for (const [id, n] of auPlusGrandReste(garnison, effectifs.defenses)) {
    for (let k = 0; k < n; k++) listeDefenses.push(id);
  }

  const batiments = placerBatiments(placement, composerBatiments(effectifs.batiments), niveau).poses;
  const defenseurs = placerDefenses(placement, ordonnerDefenses(listeDefenses), niveau).poses;

  const casesPrises = new Set();
  for (const e of [...batiments, ...defenseurs]) casesPrises.add(cleCase(e.rangee, e.colonne));
  const obstacles = placerObstacles(placement, casesPrises);

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
