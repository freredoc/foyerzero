// Les points d'intérêt de la carte — où ils tombent, et ce qu'ils donnent.
//
// ARBITRÉ le 31/08/2026 par Ethan : « chaque POI vaut +10 %, fixe », « le niveau
// du POI ne change pas ce qu'il donne — il dit seulement où il se trouve sur la
// carte, donc à quel prix on va le chercher », « les POI d'un même type
// s'additionnent », « les mettre à droite et à gauche, comme les bases Ouvrage »,
// et « à partir du moment où un POI rentre dans le territoire du joueur, il est
// acquis définitivement ».
//
// ⚠⚠ RIEN N'EST STOCKÉ, SAUF CE QUI EST ACQUIS. Les soixante-dix POSITIONS sont
// une FONCTION de la graine, exactement comme le peuplement et pour la même
// raison : les écrire ferait deux vérités pour la même case. Ce qui va dans la
// sauvegarde, c'est le couple (type, bande) de chaque POI ACQUIS — de
// l'HISTOIRE, au même titre que `satellites` et `basesRasees`, parce qu'il
// dépend de là où le joueur est passé et de rien d'autre.
//
// ⚠⚠ LE POI ESQUIVE LA BASE DE L'OUVRAGE, JAMAIS L'INVERSE. `sim/peuplement.js`
// ne connaît pas ce module et ne doit jamais le connaître : c'est ce qui garantit
// qu'ajouter les POI ne déplace AUCUNE base sur AUCUNE carte existante. La
// dépendance est à sens unique, et un test la mesure en comparant `estBaseOuvrage`
// à ce qu'elle rendait avant le lot.
//
// ⚠ IL IMPORTE `render/embleme.js`, ET C'EST LE PREMIER MODULE DE `sim/` À LE
// FAIRE. La direction habituelle est l'inverse — `render/terrain.js` et
// `render/variante.js` lisent `sim/`. L'emprise de la base terminale n'existe
// qu'à un seul endroit, `empriseDeLaGrosseBase`, et la réécrire en « ±1 » ici
// serait la seconde vérité que tout ce fichier refuse par ailleurs. Il n'y a pas
// de cycle aujourd'hui — `render/embleme.js` ne lit rien de `sim/` —, mais le
// jour où il en lirait, c'est CETTE ligne qu'il faudra défaire, en montant la
// géométrie dans `sim/` plutôt qu'en recopiant le décalage.

import {
  GEOGRAPHIE, POI, NIVEAUX_PAR_BANDE,
} from '../data/sites.js';
import { niveauDeLaRangee, estSurLaCarte, positionBaseTerminale } from './carte.js';
import { hachageBrut, horsDeLaGarde, estBaseOuvrage } from './peuplement.js';
import { basesDuJoueur, RAYONS, JOUEUR } from './territoire.js';
import { dansLOctogoneDInfluence } from './points-attaque.js';
import { empriseDeLaGrosseBase } from '../render/embleme.js';

/**
 * Les deux sels du tirage.
 *
 * ⚠ DEUX SELS DISTINCTS, JAMAIS UN SEUL HACHAGE DÉCOUPÉ EN DEUX MOITIÉS.
 * L'en-tête de `hachageBrut` porte la règle : « un champ qui n'a pas assez de
 * bits se tire d'un second hachage salé, jamais du même en le pressant ». Les
 * sels 0 et 1 sont ceux du peuplement — candidate et départage —, d'où 2 et 3.
 */
export const SEL_RANGEE = 2;
export const SEL_COLONNE = 3;

/**
 * Combien de rejets on tolère avant de déclarer la carte impossible.
 *
 * ⚠ IL LÈVE, IL NE REND PAS `null`. Une carte à qui il manque un POI est un fait
 * de PROGRAMME, pas un fait de jeu : l'amputer en silence priverait le joueur
 * d'un bonus sans que rien ne le dise.
 *
 * ⚠ MESURÉ, PAS CHOISI : sur les graines 1 à 300, le pire tirage a demandé
 * **30 essais** et le pire par graine tombe en moyenne à 8,0. Mille laisse
 * trente-trois fois la marge observée.
 */
export const ESSAIS_MAX = 1000;

/** Le nombre de bandes — DÉRIVÉ du plafond de niveau, jamais écrit. */
export const NOMBRE_DE_BANDES = Math.ceil(GEOGRAPHIE.niveauPlafond / NIVEAUX_PAR_BANDE);

/** L'ordre des types, FIXE : il fait partie du résultat du tirage. */
export const TYPES_POI = Object.keys(POI);

/**
 * La bande d'une rangée — un paquet de `NIVEAUX_PAR_BANDE` niveaux consécutifs.
 *
 * ⚠ LE NIVEAU SE DEMANDE À `sim/carte.js`, IL NE SE RETABULE PAS. Une table de
 * rangées écrite ici divergerait au premier ajustement de `niveauParCase`, et la
 * divergence se lirait comme un POI mal placé plutôt que comme une table
 * périmée.
 *
 * @param {number} rangee
 * @returns {number} 1…`NOMBRE_DE_BANDES`
 */
export function bandeDeLaRangee(rangee) {
  return Math.ceil(niveauDeLaRangee(rangee) / NIVEAUX_PAR_BANDE);
}

/**
 * Les rangées de chaque bande, calculées une fois pour toute la vie du module.
 *
 * C'est une propriété de la GÉOMÉTRIE de la carte, pas de la partie : elle ne
 * dépend d'aucune graine.
 */
const RANGEES_PAR_BANDE = (() => {
  const bandes = new Map();
  for (let rangee = 1; rangee <= GEOGRAPHIE.carte.hauteur; rangee += 1) {
    const bande = bandeDeLaRangee(rangee);
    if (!bandes.has(bande)) bandes.set(bande, []);
    bandes.get(bande).push(rangee);
  }
  return bandes;
})();

/** Les rangées d'une bande, dans l'ordre croissant. */
export function rangeesDeLaBande(bande) {
  const rangees = RANGEES_PAR_BANDE.get(bande);
  if (rangees === undefined) {
    throw new RangeError(`poi : bande ${bande} hors de 1…${NOMBRE_DE_BANDES}`);
  }
  return rangees;
}

/**
 * L'emprise de la base terminale, en cases — calculée une fois.
 *
 * ⚠ ELLE SE DEMANDE À `empriseDeLaGrosseBase`, jamais à un « ±1 » écrit ici. La
 * terminale se dessine en hexagone sur 3 × 3 cases, et cette fonction est la
 * seule qui sache où le carré tombe — un POI posé dessous serait recouvert par
 * l'hexagone sans que rien ne le dise.
 */
const EMPRISE_TERMINALE = (() => {
  const e = empriseDeLaGrosseBase(3, positionBaseTerminale());
  return {
    premiereRangee: e.rangee,
    derniereRangee: e.rangee + e.cotes - 1,
    premiereColonne: e.colonne,
    derniereColonne: e.colonne + e.cotes - 1,
  };
})();

function sousLaTerminale(rangee, colonne) {
  return rangee >= EMPRISE_TERMINALE.premiereRangee && rangee <= EMPRISE_TERMINALE.derniereRangee
    && colonne >= EMPRISE_TERMINALE.premiereColonne
    && colonne <= EMPRISE_TERMINALE.derniereColonne;
}

/**
 * La case peut-elle porter un POI ?
 *
 * Quatre refus, et le quatrième — « un POI déjà tiré l'occupe » — est porté par
 * l'appelant, qui est le seul à savoir ce qui a déjà été posé.
 */
function caseLibrePourUnPoi(graine, rangee, colonne) {
  if (!estSurLaCarte(rangee, colonne)) return false;
  // ⚠ LA MÊME GARDE QUE LES BASES DE L'OUVRAGE — arbitré par Ethan le 31/08 :
  // « les mettre à droite et à gauche, comme les bases Ouvrage ». On RÉEMPLOIE la
  // fonction ; réécrire la distance ici ferait deux gardes qui divergeraient à la
  // première retouche du rayon.
  if (!horsDeLaGarde(rangee, colonne)) return false;
  if (estBaseOuvrage(graine, rangee, colonne)) return false;
  if (sousLaTerminale(rangee, colonne)) return false;
  return true;
}

/**
 * Les soixante-dix POI d'une partie — sept types dans chacune des dix bandes.
 *
 * ⚠ TIRAGE PAR REJET, DÉTERMINISTE, DÉRIVÉ DE LA SEULE GRAINE. L'ordre des
 * bandes puis des types est FIXE et fait partie du résultat : le changer
 * déplacerait tous les POI de toutes les parties.
 *
 * ⚠ LE BIAIS DU MODULO EST CONNU ET ACCEPTÉ, UNE FOIS, PAR ÉCRIT. Sur 2³²
 * valeurs et un domaine d'au plus 2 232, il vaut moins de 6 × 10⁻⁷ — une case
 * sur un million et demi. Le « corriger » par un rejet supplémentaire
 * déplacerait tout le monde pour rien.
 *
 * @param {number} graine
 * @returns {Array<{type: string, bande: number, rangee: number, colonne: number}>}
 */
export function tirerLesPoi(graine) {
  const poses = [];
  const prises = new Set();
  const largeur = GEOGRAPHIE.carte.largeur;
  for (let bande = 1; bande <= NOMBRE_DE_BANDES; bande += 1) {
    const rangees = rangeesDeLaBande(bande);
    for (let indexDuType = 0; indexDuType < TYPES_POI.length; indexDuType += 1) {
      const cle = bande * 100 + indexDuType;
      let pose = null;
      for (let k = 0; k < ESSAIS_MAX; k += 1) {
        const rangee = rangees[hachageBrut(graine, cle, k, SEL_RANGEE) % rangees.length];
        const colonne = 1 + (hachageBrut(graine, cle, k, SEL_COLONNE) % largeur);
        const marque = `${rangee}:${colonne}`;
        if (prises.has(marque)) continue;
        if (!caseLibrePourUnPoi(graine, rangee, colonne)) continue;
        prises.add(marque);
        pose = { type: TYPES_POI[indexDuType], bande, rangee, colonne };
        break;
      }
      if (pose === null) {
        throw new Error(
          `poi : aucune case libre pour « ${TYPES_POI[indexDuType]} » en bande ${bande} `
          + `après ${ESSAIS_MAX} essais (graine ${graine})`,
        );
      }
      poses.push(pose);
    }
  }
  return poses;
}

/**
 * La carte des POI d'une graine, MÉMOÏSÉE sur une seule entrée.
 *
 * ⚠ UNE ENTRÉE SUFFIT, ET IL EN FAUT UNE. `poiDeLaCase` est appelée une fois par
 * case dessinée : retirer les soixante-dix positions à chaque appel referait le
 * tirage des milliers de fois par image. Une seule partie est ouverte à la fois,
 * donc une entrée couvre tout — et le cache ne peut pas mentir, puisque la carte
 * est une fonction pure de la graine.
 */
let cache = null;

export function carteDesPoi(graine) {
  if (cache !== null && cache.graine === graine) return cache;
  const liste = tirerLesPoi(graine);
  const parCase = new Map();
  for (const poi of liste) parCase.set(`${poi.rangee}:${poi.colonne}`, poi);
  cache = { graine, liste, parCase };
  return cache;
}

/**
 * Le POI d'une case, ou `null`.
 * @returns {{type: string, bande: number, rangee: number, colonne: number}|null}
 */
export function poiDeLaCase(graine, rangee, colonne) {
  return carteDesPoi(graine).parCase.get(`${rangee}:${colonne}`) ?? null;
}

/**
 * Les POI d'une fenêtre rectangulaire — ce que l'écran Monde demande.
 *
 * ⚠ ON PARCOURT LES SOIXANTE-DIX POI, PAS LES CASES DE LA FENÊTRE. Il y en a
 * soixante-dix sur toute la carte, contre plus de mille cases dans la fenêtre la
 * plus large : c'est le sens qui coûte le moins.
 */
export function poisDeLaFenetre(graine, fenetre) {
  return carteDesPoi(graine).liste.filter((poi) => poi.rangee >= fenetre.premiereRangee
    && poi.rangee <= fenetre.derniereRangee
    && poi.colonne >= fenetre.premiereColonne
    && poi.colonne <= fenetre.derniereColonne);
}

// ---------------------------------------------------------------------------
// L'acquisition
// ---------------------------------------------------------------------------

/** L'ordre de tri des acquis : bande, puis ordre de la table `POI`. */
function rang(acquis) {
  return acquis.bande * 1000 + TYPES_POI.indexOf(acquis.type);
}

/** Un POI de ce type et de cette bande est-il acquis ? */
export function poiEstAcquis(poisAcquis, poi) {
  return poisAcquis.some((a) => a.type === poi.type && a.bande === poi.bande);
}

/**
 * Inscrit les POI qui se trouvent dans le territoire du joueur.
 *
 * ⚠⚠ « DÉFINITIVEMENT » VEUT DIRE QUE RIEN NE LE RETIRE — Ethan, 31/08. Ni un
 * redéploiement, ni un raid, ni un rasage. Cette fonction n'AJOUTE jamais que.
 *
 * ⚠ ON PARCOURT LE TERRITOIRE, PAS LES SOIXANTE-DIX POI. Le territoire fait
 * vingt-cinq cases aujourd'hui ; demander à la carte mémoïsée ce que chacune
 * porte fait suivre le coût à la taille du territoire, jamais à celle de la
 * carte. C'est le renversement que `sim/territoire.js` a déjà fait.
 *
 * ⚠ LE TERRITOIRE SE DEMANDE, IL NE SE RECOPIE PAS. `basesDuJoueur` et
 * `RAYONS[JOUEUR]` viennent de `sim/territoire.js`, qui lit lui-même
 * `GEOGRAPHIE.rayonInfluenceJoueur` — écrire « 2 » ici en ferait une troisième
 * vérité sur la même distance.
 *
 * ⚠ TRIÉ À L'ÉCRITURE (bande, puis ordre de la table) : deux parties identiques
 * doivent produire deux fichiers identiques.
 *
 * @param {object} etat modifié en place
 * @returns {number} combien de POI viennent d'être acquis
 */
export function releverLesPoisAcquis(etat) {
  if (!Array.isArray(etat.poisAcquis)) {
    throw new TypeError('poi : `poisAcquis` absent de l\'état');
  }
  const rayon = RAYONS[JOUEUR];
  let ajoutes = 0;
  for (const base of basesDuJoueur(etat)) {
    for (let dr = -rayon; dr <= rayon; dr += 1) {
      for (let dc = -rayon; dc <= rayon; dc += 1) {
        // ⚠⚠ CE FILTRE MANQUAIT DEPUIS TOUJOURS, ET IL A SURVÉCU À DEUX LOTS QUI
        // LE CHERCHAIENT. Cette boucle peignait le CARRÉ plein de (2r+1)² cases
        // sans le moindre test de forme : un POI dans un coin était donc ACQUIS
        // alors que ni la carte ne montre cette case comme alliée, ni le barème
        // du raid ne la facture ainsi. EUCLIDE a énuméré trois sites de bascule
        // et n'a pas vu celui-ci ; BASES-1 en a corrigé un quatrième
        // (`territoire.js`) sans le voir non plus. Il est le CINQUIÈME, trouvé le
        // 03/09 en faisant passer toute la zone à l'octogone.
        //
        // ⚠ CONSÉQUENCE : un POI dans un angle rogné n'est plus acquis. C'est le
        // comportement juste — la zone d'influence est ce que la spec §10 définit
        // et ce que l'écran Monde dessine — mais c'est un changement de RÈGLE, pas
        // un simple nettoyage, et il se déclare comme tel.
        if (!dansLOctogoneDInfluence(dr, dc, rayon)) continue;
        const rangee = base.rangee + dr;
        const colonne = base.colonne + dc;
        if (!estSurLaCarte(rangee, colonne)) continue;
        const poi = poiDeLaCase(etat.graine, rangee, colonne);
        if (poi === null) continue;
        if (poiEstAcquis(etat.poisAcquis, poi)) continue;
        etat.poisAcquis.push({ type: poi.type, bande: poi.bande });
        ajoutes += 1;
      }
    }
  }
  if (ajoutes > 0) etat.poisAcquis.sort((a, b) => rang(a) - rang(b));
  return ajoutes;
}

/**
 * Les défauts STRUCTURELS de la liste des acquis — ce qui la rendrait illisible.
 *
 * ⚠ « CHAMP ABSENT » ET « LISTE VIDE » NE SONT PAS LA MÊME CHOSE. Une liste vide
 * est l'état de toute partie neuve ; un champ absent est une faute de programme.
 * C'est `verifierEtat` de `sim/state.js` qui tient la première distinction, ici
 * on ne juge que le contenu.
 */
export function problemesDesPoisAcquis(poisAcquis) {
  const defauts = [];
  if (!Array.isArray(poisAcquis)) return ['`poisAcquis` n\'est pas une liste'];
  const vus = new Set();
  for (const a of poisAcquis) {
    if (a === null || typeof a !== 'object') {
      defauts.push('une entrée n\'est pas un objet');
      continue;
    }
    if (POI[a.type] === undefined) {
      defauts.push(`type de POI inconnu « ${a.type} »`);
      continue;
    }
    if (!Number.isInteger(a.bande) || a.bande < 1 || a.bande > NOMBRE_DE_BANDES) {
      defauts.push(`bande ${a.bande} hors de 1…${NOMBRE_DE_BANDES} pour « ${a.type} »`);
      continue;
    }
    const cle = `${a.type}:${a.bande}`;
    if (vus.has(cle)) defauts.push(`« ${a.type} » de la bande ${a.bande} est en double`);
    vus.add(cle);
  }
  return defauts;
}

// ---------------------------------------------------------------------------
// Ce que les acquis donnent
// ---------------------------------------------------------------------------

/**
 * Les majorations de PRODUCTION, en pour-cent ENTIERS, par ressource.
 *
 * ⚠ ILS S'ADDITIONNENT. Trois veines de quartz font +30 %, jamais ×1,1³.
 *
 * @param {Array<{type: string}>} poisAcquis
 * @returns {Record<string, number>} les ressources non majorées sont ABSENTES
 */
export function majorationsDeProduction(poisAcquis) {
  const pct = {};
  for (const a of poisAcquis) {
    const def = POI[a.type];
    if (def === undefined) throw new Error(`poi : type inconnu « ${a.type} »`);
    if (def.ressource === null) continue;
    pct[def.ressource] = (pct[def.ressource] ?? 0) + def.bonusPct;
  }
  return pct;
}

/**
 * Les majorations de COMBAT, en pour-cent entiers, par châssis et pour la
 * défense.
 *
 * ⚠ LES QUATRE CLÉS SONT TOUJOURS LÀ, À ZÉRO PAR DÉFAUT. Une clé absente
 * obligerait chaque lecteur à écrire son propre `?? 0`, et le premier qui
 * l'oublierait rendrait `NaN` sans lever.
 *
 * @param {Array<{type: string}>} poisAcquis
 * @returns {{escouade: number, blinde: number, aeronef: number, defense: number}}
 */
export function majorationsDeCombat(poisAcquis) {
  const pct = {
    escouade: 0, blinde: 0, aeronef: 0, defense: 0,
  };
  for (const a of poisAcquis) {
    const def = POI[a.type];
    if (def === undefined) throw new Error(`poi : type inconnu « ${a.type} »`);
    if (def.defense) pct.defense += def.bonusPct;
    if (def.chassis !== null) pct[def.chassis] += def.bonusPct;
  }
  return pct;
}
