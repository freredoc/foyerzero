// Les satellites — les camps et l'avant-poste qui suivent la base du joueur.
//
// ARBITRÉ le 29/08/2026 par Ethan : « 5 min après la pose d'une base joueur ou
// déplacement d'une base joueur, 2 camps et 1 avant-poste ouvrage apparaissent.
// Respawn automatique en cas de destruction camp/AP. » Puis : « camp dans le
// rayon d'influence de la base, 1 à 2 cases », « avant-poste : de 2 à 5 cases ».
//
// ⚠ CE MODULE EST LE PREMIER À ÉCRIRE DE L'HISTOIRE DANS L'ÉTAT, et c'est ce qui
// le sépare de `sim/peuplement.js`. Les bases de l'Ouvrage sont une FONCTION de
// la graine : on ne les stocke pas, on les recalcule. Les satellites, eux,
// dépendent de ce que le joueur a FAIT — où il s'est posé, quand, combien de
// fois il a rasé le même camp. Aucune graine ne peut rendre ça, donc ils vivent
// dans la sauvegarde.
//
// ⚠ LE NUMÉRO D'INSTANCE EST TOUT LE JOURNAL, ET IL TIENT DANS UN ENTIER.
// Ethan, le 29/08 : « 2 camps qui apparaissent sur la même case l'un après
// l'autre auront les mêmes dispositions quartz scories obstacles, mais
// disposition bâtiment défense différentes. Forcément si on revient sur le même
// camp les bâtiments n'ont pas changé de place. » Le terrain se dérive de la
// CASE, les bâtiments de la case ET de l'instance. Stocker l'entier suffit à
// rendre les deux moitiés reproductibles ; stocker les bâtiments serait ranger
// ce qu'on sait recalculer.
//
// ⚠⚠ LE COMPTEUR D'INSTANCE EST GLOBAL À LA PARTIE, PAS PROPRE À UNE BASE — lot
// BASES-1, 02/09/2026, ET C'EST UNE CORRECTION D'UNICITÉ. Il vivait dans
// `satellites`, donc dans la BASE ; deux bases seraient toutes deux parties de
// l'instance 1, avec la MÊME graine d'apparition, et leurs satellites auraient
// été tirés du même flux — même indice tiré dans deux anneaux différents, donc
// les mêmes relèvements aux mêmes moments, au même point de la boussole. Un
// joueur l'aurait vu sans pouvoir l'expliquer.
//
// ⚠ ET LA BASE UNIQUE NE BOUGE PAS D'UN BIT. Avec une seule base, le compteur
// global rend exactement la suite 1, 2, 3… qu'elle tirait déjà. C'est ce qui
// distingue cette forme de l'autre correction possible — mêler la FONDATION à la
// graine —, qui aurait déplacé tous les satellites de toutes les parties.
//
// ⚠ AUCUN TIRAGE NE PASSE PAR `etat.rng`, et c'est une contrainte de correction,
// pas de style. `rattraperJeu` est ANALYTIQUE : il avance de mille ticks d'un
// coup, là où `tickJeu` en fait mille. Un tirage qui consommerait le flux de
// l'état donnerait deux résultats différents selon le chemin dès qu'une autre
// mécanique se mettra à tirer pendant un tick. La graine d'une apparition se
// dérive donc de la partie et du numéro d'instance, qui sont les mêmes des deux
// côtés.
//
// ⚠ ET LE TEST DES DEUX CHEMINS NE SUFFIT PAS À LE TENIR, mesuré par
// falsification : rien d'autre ne consomme le flux pendant un tick aujourd'hui,
// donc les deux chemins le consomment identiquement et l'égalité passe même sur
// du code qui viole la règle. C'est un test dédié qui la mesure — il compare
// l'état du flux avant et après une apparition.

import { SATELLITES, GEOGRAPHIE } from '../data/sites.js';
import { NIVEAU } from '../data/niveaux.js';
import { TICKS_PAR_SECONDE } from './clock.js';
import { estSurLaCarte, niveauDeLaRangee } from './carte.js';
import { estBaseOuvrage } from './peuplement.js';
import { poiDeLaCase } from './poi.js';
import { niveauDesBatiments } from './niveau-de-base.js';
import { creerRng, entier } from './rng.js';
import { baseCourante } from './base-courante.js';

/** Le délai d'apparition, en ticks — cinq minutes. */
export const TICKS_APPARITION = SATELLITES.delaiApparitionSec * TICKS_PAR_SECONDE;

/** Combien de temps un satellite qu'on laisse tranquille reste où il est. */
export const TICKS_DUREE_DE_VIE = SATELLITES.dureeDeVieSec * TICKS_PAR_SECONDE;

/** Ce qu'un raid lui achète en plus, compté depuis le raid. */
export const TICKS_SURSIS = SATELLITES.sursisApresAttaqueSec * TICKS_PAR_SECONDE;

/**
 * Les deux types, avec leur anneau et leur nombre.
 *
 * ⚠ LES CLÉS SONT CELLES DE `TYPES_SITE` de data/sites.js — `camp` et
 * `avantPoste` —, pas celles de `SATELLITES`, qui sont des pluriels de comptage.
 * Un test croise les deux tables : un type qui n'existerait que d'un côté
 * produirait des satellites que le générateur de sites ne saurait pas peupler.
 */
export const ANNEAUX = {
  camp: { nombre: SATELLITES.camps.nombre, ...SATELLITES.camps.anneau },
  avantPoste: { nombre: SATELLITES.avantPostes.nombre, ...SATELLITES.avantPostes.anneau },
};

/**
 * TOUS les satellites présents, toutes bases confondues.
 *
 * ⚠⚠ ELLE EXISTE POUR LA MÊME RAISON QUE `trouverSatellite` — lot BASES-1. Les
 * camps et l'avant-poste sont PAR BASE ; lire `baseCourante(etat).satellites`
 * faisait disparaître de la carte, et du jeu, ceux d'une base que le joueur ne
 * regardait pas. Un site invisible n'est pas seulement un défaut d'affichage :
 * `siteDeLaCase` rend alors `null`, donc la case cesse d'être attaquable.
 *
 * ⚠ CHAQUE ENTRÉE PORTE SA BASE, parce que l'appelant en a besoin — pour la
 * détruire, pour la prolonger, ou pour dire à quelle base elle se rattache. On
 * rend l'OBJET base et non son indice : ces listes sont lues, jamais
 * sérialisées, et le rappel ne survit pas à l'appel.
 *
 * @param {object} etat
 * @returns {Array<{satellite: object, base: object, index: number}>}
 */
export function satellitesPresents(etat) {
  const tous = [];
  for (const base of etat.bases) {
    const presents = base.satellites?.presents ?? [];
    for (let i = 0; i < presents.length; i += 1) {
      tous.push({ satellite: presents[i], base, index: i });
    }
  }
  return tous;
}

/**
 * Le satellite d'une identité, dans QUELLE QUE SOIT la base qui le porte.
 *
 * ⚠⚠ ELLE EXISTE PARCE QU'UN SATELLITE N'APPARTIENT PAS À LA BASE COURANTE —
 * lot BASES-1. Il appartient à celle autour de laquelle il est paru. Chercher
 * dans la seule base courante faisait qu'un raid sur le camp d'une AUTRE base ne
 * détruisait rien et ne prolongeait rien, sans rien dire.
 *
 * ⚠ L'IDENTITÉ PORTE L'INSTANCE, donc elle est unique : deux camps successifs au
 * même endroit ne se confondent pas, et le compteur global de BASES-1 garantit
 * qu'aucun numéro ne sert deux fois dans une partie.
 *
 * @param {object} etat
 * @param {{rangee: number, colonne: number, instance: number}} identite
 * @returns {{base: object, index: number, satellite: object}|null}
 */
export function trouverSatellite(etat, identite) {
  for (const base of etat.bases) {
    const index = base.satellites?.presents?.findIndex(
      (s) => s.rangee === identite.rangee && s.colonne === identite.colonne
        && s.instance === identite.instance,
    ) ?? -1;
    if (index >= 0) return { base, index, satellite: base.satellites.presents[index] };
  }
  return null;
}

/**
 * L'état vide, pour une base qui n'a encore rien autour d'elle.
 *
 * ⚠ PLUS DE `prochaineInstance` ICI DEPUIS BASES-1 : le compteur est GLOBAL,
 * dans `etat.prochaineInstanceSatellite`. Voir l'en-tête.
 */
export function satellitesVides() {
  return { presents: [], attentes: [] };
}

/** La valeur de départ du compteur global d'instances. */
export const PREMIERE_INSTANCE = 1;

/**
 * Graine d'une apparition. Elle ne dépend QUE de faits déjà dans l'état, et
 * jamais du flux courant — voir l'en-tête.
 * @param {number} graine graine de la partie
 * @param {number} instance numéro d'instance, unique et croissant
 * @returns {number}
 */
function graineDeLApparition(graine, instance) {
  let h = 0x811c9dc5;
  for (const v of [graine, instance]) {
    h = Math.imul(h ^ (v & 0xffff), 0x01000193) >>> 0;
    h = Math.imul(h ^ ((v >>> 16) & 0xffff), 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Les cases d'un anneau autour d'une position, en distance EUCLIDIENNE.
 *
 * ⚠⚠ EUCLIDE DEPUIS LE LOT EUCLIDE (02/09/2026), ARBITRÉ PAR ETHAN. Ce
 * commentaire disait : « TCHEBYCHEV ET NON EUCLIDIEN, comme la garde du
 * peuplement. Sur une grille, une case en diagonale n'est pas plus loin qu'une
 * case droit devant : la mesurer plus loin creuserait des anneaux en losange
 * que personne n'a demandés. » Ce n'est plus un losange qu'on creuse, c'est un
 * DISQUE — et les trois règles de distance de la carte ont basculé ensemble, si
 * bien que l'anneau d'un satellite a exactement la forme de la portée d'un raid.
 *
 * ⚠ LE BALAYAGE RESTE UN CARRÉ, ET LE TEST SEUL EST UN DISQUE. Boucler sur
 * `[-max, max]²` puis filtrer coûte le même prix qu'avant et se lit en une
 * ligne ; chercher à ne parcourir que le disque demanderait une seconde
 * géométrie pour économiser des cases qu'on jette de toute façon.
 *
 * ⚠ AU CARRÉ DES DEUX CÔTÉS, JAMAIS DE RACINE — même discipline que la garde du
 * peuplement et que la portée du raid.
 *
 * @param {{rangee: number, colonne: number}} centre
 * @param {number} min distance minimale, incluse
 * @param {number} max distance maximale, incluse
 * @returns {Array<{rangee: number, colonne: number}>}
 */
export function casesDeLAnneau(centre, min, max) {
  const cases = [];
  const minCarre = min * min;
  const maxCarre = max * max;
  for (let dr = -max; dr <= max; dr += 1) {
    for (let dc = -max; dc <= max; dc += 1) {
      // ⚠ PAS `distanceCarree` : c'est le nom de la distance du COMBAT, en
      // milli-cases, et une garde de `euclide.test.js` refuse ce mot ici même.
      const carreDeLaDistance = dr * dr + dc * dc;
      if (carreDeLaDistance < minCarre || carreDeLaDistance > maxCarre) continue;
      const rangee = centre.rangee + dr;
      const colonne = centre.colonne + dc;
      if (!estSurLaCarte(rangee, colonne)) continue;
      cases.push({ rangee, colonne });
    }
  }
  return cases;
}

/**
 * Le niveau d'un satellite qui apparaît maintenant.
 *
 * Les deux règles viennent de la §10 de la spec, et elles ne se ressemblent
 * pas : un camp est indexé sur le NIVEAU DU JOUEUR — c'est le filet de sécurité,
 * il doit rester à sa portée — quand un avant-poste est indexé sur le RAYON,
 * c'est-à-dire sur l'endroit de la carte. `TYPES_SITE[x].indexeSur` porte déjà
 * cette distinction ; ce qui suit la traduit en nombre.
 *
 * ⚠ LE NIVEAU DU JOUEUR EST EN DIXIÈMES, et l'oublier donnerait des camps de
 * niveau 46 devant une base de niveau 4,6.
 *
 * @param {string} type
 * @param {object} etat
 * @param {{s: number}} rng flux propre à cette apparition
 * @returns {number} entier de 1 à NIVEAU.plafond
 */
export function niveauDuSatellite(type, etat, rng, base = null) {
  // ⚠ LA BASE EST CELLE AUTOUR DE LAQUELLE LE SATELLITE PARAÎT — lot BASES-1.
  // Un camp est de niveau égal aux BÂTIMENTS de sa base, et un avant-poste du
  // niveau de SA rangée : les lire sur la base courante donnerait à la seconde
  // base des satellites calibrés sur la première.
  const laBase = base ?? baseCourante(etat);
  if (type === 'camp') {
    const dixiemes = niveauDesBatiments(laBase.disposition);
    return borner(Math.round(dixiemes / 10));
  }
  // « De niveau égal au rayon ±1 » — spec §10. Le rayon, ici, c'est le niveau de
  // la rangée : la carte ne connaît pas d'autre distance.
  const rayon = niveauDeLaRangee(laBase.position.rangee);
  return borner(rayon + entier(rng, -1, 1));
}

function borner(niveau) {
  return Math.max(1, Math.min(NIVEAU.plafond, niveau));
}

/**
 * Programme les trois apparitions — deux camps et un avant-poste — pour dans
 * cinq minutes, et RETIRE ce qui entourait la base auparavant.
 *
 * ⚠ LES ANCIENS DISPARAISSENT, et c'est une lecture de la spec plutôt qu'un
 * arbitrage explicite : l'avant-poste y est « indexé sur le rayon **et la
 * présence du joueur** », et le camp sur le niveau du joueur. Ni l'un ni l'autre
 * n'a de raison de survivre à quinze cases de la base qui les justifiait. Si
 * Ethan veut qu'ils restent, c'est cette fonction-ci qui change, et elle seule.
 *
 * @param {object} etat modifié en place
 * @returns {object} le même état
 */
export function planifierSatellites(etat, base = null) {
  // ⚠ ELLE PLANIFIE POUR UNE BASE, ET LA BASE COURANTE EST SON DÉFAUT. Fonder
  // appelle avec la base NEUVE, qui n'est pas encore la courante : lui faire
  // planifier autour de la mauvaise base donnerait à la nouvelle des satellites
  // qui ne sont pas les siens.
  const laBase = base ?? baseCourante(etat);
  const du = etat.horloge.nbTicks + TICKS_APPARITION;
  laBase.satellites.presents = [];
  laBase.satellites.attentes = [];
  for (const [type, anneau] of Object.entries(ANNEAUX)) {
    for (let n = 0; n < anneau.nombre; n += 1) {
      laBase.satellites.attentes.push({ type, tickDu: du });
    }
  }
  return etat;
}

/**
 * Un satellite détruit réapparaît, sans intervention du joueur.
 *
 * ⚠ LE DÉLAI ET LA CASE DU RESPAWN NE SONT PAS ARBITRÉS. Ethan a dit « respawn
 * automatique », sans dire au bout de combien de temps ni où. Retenu, et
 * SIGNALÉ comme tel : le même délai de cinq minutes, et un nouveau tirage dans
 * l'anneau — c'est le même mécanisme rejoué, ce qui est la lecture la plus
 * simple. Les deux tiennent en une ligne chacun si la réponse est autre.
 *
 * @param {object} etat modifié en place
 * @param {number} index dans `satellites.presents`
 * @returns {object} le même état
 */
export function detruireSatellite(etat, index, base = null) {
  const laBase = base ?? baseCourante(etat);
  const present = laBase.satellites.presents[index];
  if (present === undefined) {
    throw new RangeError(`satellites : aucun satellite à l'indice ${index}`);
  }
  laBase.satellites.presents.splice(index, 1);
  // ⚠⚠ ON COMPTE, PARCE QUE RIEN D'AUTRE NE GARDE LA TRACE — lot BASES-1. Un
  // camp détruit quitte `presents` et n'entre nulle part : la partie ne saurait
  // plus jamais que le joueur en a rasé un, et le tutoriel ne pourrait pas
  // cocher « Attaquer et détruire un camp ». `basesRasees` fait déjà exactement
  // ça pour les BASES de l'Ouvrage, et pour la même raison.
  //
  // ⚠ CETTE FONCTION N'EST APPELÉE QUE PAR LE JOUEUR. La relève naturelle d'un
  // satellite passe par `resoudreSatellites`, pas par ici : le compteur mesure
  // donc bien des destructions, jamais des expirations.
  etat.satellitesDetruits[present.type] = (etat.satellitesDetruits[present.type] ?? 0) + 1;
  laBase.satellites.attentes.push({
    type: present.type,
    tickDu: etat.horloge.nbTicks + TICKS_APPARITION,
  });
  return etat;
}

/**
 * Fait paraître les satellites dont l'heure est venue, et relève ceux dont le
 * temps est écoulé.
 *
 * ⚠⚠ ELLE BOUCLE MAINTENANT SUR LES ÉVÈNEMENTS, ET C'EST LE JOUR QUE L'EN-TÊTE
 * DE CE MODULE ANNONÇAIT. Elle disait : « elle ne peut RIEN faire qui dépende de
 * l'instant précis d'une apparition — le jour où ce sera nécessaire, cette
 * équivalence tombe ». La relève en dépend : un satellite posé à T meurt à
 * T + durée, donc il faut savoir QUAND il a été posé, pas seulement qu'il l'a
 * été. La boucle rend l'équivalence des deux chemins non plus gratuite mais
 * CONSTRUITE : on rejoue les évènements dans l'ordre, à leur date.
 *
 * ⚠ ELLE AVANCE PAR ÉVÈNEMENT, JAMAIS PAR TICK. Le pas est la prochaine
 * échéance, pas le tick suivant : une absence de dix ans ne coûte donc pas
 * 3,15 milliards d'itérations mais une par relève. **Mesuré, pas estimé** : une
 * pose d'avant-poste coûte 13,3 µs, donc dix ans à six heures de vie — 14 600
 * relèves de trois satellites — coûtent **581 ms**, une fois, au chargement. Un
 * mois d'absence en coûte 7.
 *
 * ⚠ ET L'ORDRE À L'INTÉRIEUR D'UN TICK EST FIXÉ : les relèves d'abord, les
 * apparitions ensuite. Sans cet ordre, un satellite relevé et un autre attendu
 * au même tick se disputeraient une case selon l'ordre où on les traite, et deux
 * chemins d'avancement rendraient deux cartes.
 *
 * @param {object} etat modifié en place
 * @returns {number} nombre de satellites parus
 */
export function resoudreSatellites(etat) {
  // ⚠⚠ TOUTES LES BASES, PAS SEULEMENT LA COURANTE — lot BASES-1, 02/09/2026.
  // C'est l'une des trois conditions de rupture que le rapport de BASES-0 avait
  // NOMMÉES : les satellites sont par base, et cette fonction n'en résolvait
  // qu'une. Au pluriel, les satellites de la base qu'on ne regarde pas
  // n'auraient jamais paru, ni ne se seraient jamais relevés.
  //
  // ⚠ ET ELLE RESTE COMPATIBLE AVEC LE RATTRAPAGE. Chaque base avance par
  // ÉVÈNEMENT, à sa propre date ; la boucle ne fait qu'appliquer le même corps
  // plusieurs fois, et le compteur d'instances étant GLOBAL, l'ordre des bases
  // décide de qui prend quel numéro. C'est déterministe : `etat.bases` est une
  // liste dont l'ordre ne dépend que de l'ordre des fondations.
  let parus = 0;
  for (const base of etat.bases) parus += resoudreSatellitesDeLaBase(etat, base);
  return parus;
}

/** La résolution d'UNE base — le corps d'avant BASES-1, inchangé. */
function resoudreSatellitesDeLaBase(etat, laBase) {
  // ⚠ ELLE NOMME LE CHAMP MANQUANT AU LIEU DE LEVER UNE TypeError QUATRE LIGNES
  // PLUS BAS. C'est la leçon du lot GARNISON-ET-ARMÉE, où un montage de test
  // amputé faisait tomber `resumeDeLaBase` sur `undefined.length` : ça levait
  // dans les deux cas, un seul des deux messages était lisible.
  if (laBase.satellites === undefined) {
    throw new Error('satellites : champ « satellites » absent de l\'état');
  }
  const maintenant = etat.horloge.nbTicks;
  let parus = 0;
  // ⚠⚠ LES ATTENTES QU'ON N'A PAS PU SATISFAIRE SORTENT DE LA BOUCLE, ELLES NE
  // SE REPROGRAMMENT PAS. Un anneau plein est un état du MONDE, pas un délai :
  // l'attente doit repartir dès qu'une place se libère, ce qui peut être au tick
  // suivant. Lui donner une nouvelle échéance la ferait attendre cinq minutes de
  // plus pour rien — et un test le mesure.
  //
  // ⚠ ET ELLES DOIVENT QUITTER `attentes` PENDANT LA BOUCLE, sinon `retenir`
  // reprendrait indéfiniment la même échéance déjà passée : la boucle ne
  // terminerait pas. Elles y reviennent à la sortie, avec leur `tickDu`
  // d'origine intact.
  const reportees = [];

  for (;;) {
    // La prochaine date à laquelle quelque chose se passe, si elle est passée.
    let quand = null;
    const retenir = (t) => {
      if (t > maintenant) return;
      if (quand === null || t < quand) quand = t;
    };
    for (const attente of laBase.satellites.attentes) retenir(attente.tickDu);
    // ⚠ UNE SAUVEGARDE PEUT NE PAS PORTER `tickDeReleve` — la migration l'ajoute,
    // mais un satellite forgé par un test n'en a pas. On ne relève alors pas :
    // mieux vaut un satellite immortel qu'une boucle sur `NaN`.
    for (const present of laBase.satellites.presents) {
      if (Number.isInteger(present.tickDeReleve)) retenir(present.tickDeReleve);
    }
    if (quand === null) break;

    // 1. LES RELÈVES. Le satellite s'en va et une attente le remplace : c'est
    //    exactement ce que fait une destruction, et c'est voulu — « change de
    //    spawn » veut dire qu'il reparaît ailleurs, pas qu'il disparaît.
    const restants = [];
    for (const present of laBase.satellites.presents) {
      if (Number.isInteger(present.tickDeReleve) && present.tickDeReleve <= quand) {
        laBase.satellites.attentes.push({ type: present.type, tickDu: quand + TICKS_APPARITION });
      } else {
        restants.push(present);
      }
    }
    laBase.satellites.presents = restants;

    // 2. LES APPARITIONS dues à ce tick.
    // ⚠ L'ORDRE EST CELUI DE LA FILE, PAS CELUI DES ÉCHÉANCES. Deux attentes
    // dues au même tick doivent paraître dans l'ordre où elles ont été
    // programmées, sinon deux chemins d'avancement rendraient les mêmes
    // satellites dans deux ordres, et `serialiser` les déclarerait différents.
    const enAttente = [];
    for (const attente of laBase.satellites.attentes) {
      if (attente.tickDu > quand) { enAttente.push(attente); continue; }
      const pose = poserUnSatellite(etat, attente.type, quand, laBase);
      // Aucune case libre dans l'anneau : on ne perd pas l'attente, on la met
      // de côté. Le cas est possible — un anneau saturé de bases de l'Ouvrage —
      // et perdre l'attente ferait disparaître un camp en silence.
      if (pose === null) reportees.push(attente);
      else parus += 1;
    }
    laBase.satellites.attentes = enAttente;
  }
  laBase.satellites.attentes.push(...reportees);
  return parus;
}

/**
 * Un raid vient de toucher ce satellite : il gagne du temps.
 *
 * ⚠⚠ ETHAN, 31/08 : « un camp / avant-poste attaqué reste plus longtemps, je
 * dirais quelques heures de plus, avant d'être respawn ». Le sursis se compte
 * DEPUIS LE RAID, pas depuis la pose : un camp attaqué à sa dernière minute doit
 * gagner du temps, sinon la règle ne sert pas dans le cas où elle compte — celui
 * où le joueur revient sur un site qu'il a entamé.
 *
 * ⚠ ELLE NE RACCOURCIT JAMAIS UNE VIE. Un satellite frais a déjà une échéance
 * plus lointaine que `raid + vie + sursis` ne le donnerait ; écraser sans
 * comparer punirait le joueur qui attaque tôt.
 *
 * ⚠ ET ELLE NE LÈVE PAS SI LE SATELLITE A DISPARU. Comme `enregistrerLeRaid`, ce
 * module ne peut pas garantir qu'il est encore là : le raid se résout sur un
 * montage, pas sur la table.
 *
 * @param {object} etat modifié en place
 * @param {{rangee: number, colonne: number, instance: number}} identite
 * @param {number} tickDuRaid
 * @returns {boolean} vrai si un satellite a été prolongé
 */
export function prolongerApresAttaque(etat, identite, tickDuRaid) {
  // ⚠⚠ ON CHERCHE DANS TOUTES LES BASES — lot BASES-1. Un satellite appartient à
  // la base autour de laquelle il est paru, pas à celle que le joueur regarde :
  // attaquer le camp de sa seconde base pendant que la première est courante
  // n'aurait rien prolongé, en silence.
  const trouve = trouverSatellite(etat, identite);
  if (trouve === null) return false;
  const present = trouve.satellite;
  const echeance = tickDuRaid + TICKS_DUREE_DE_VIE + TICKS_SURSIS;
  if (Number.isInteger(present.tickDeReleve) && present.tickDeReleve >= echeance) return false;
  present.tickDeReleve = echeance;
  return true;
}

/**
 * Tire une case libre de l'anneau et y pose un satellite.
 * @returns {object|null} le satellite posé, ou null si l'anneau est plein
 */
function poserUnSatellite(etat, type, tickDeLaPose, laBase) {
  const anneau = ANNEAUX[type];
  if (anneau === undefined) throw new Error(`satellites : type inconnu « ${type} »`);
  const instance = etat.prochaineInstanceSatellite;
  const rng = creerRng(graineDeLApparition(etat.graine, instance));

  const prises = new Set(laBase.satellites.presents.map((s) => `${s.rangee}:${s.colonne}`));
  const libres = casesDeLAnneau(laBase.position, anneau.min, anneau.max).filter((k) => {
    // ⚠ JAMAIS SUR UNE BASE DE L'OUVRAGE. Elles sont dérivées de la graine, donc
    // elles étaient là AVANT : un camp posé dessus ferait deux sites sur une
    // case. La règle des huit cases, elle, ne s'applique pas — Ethan, le 29/08 :
    // « les camps et avant-postes peuvent coller les bases ».
    if (estBaseOuvrage(etat.graine, k.rangee, k.colonne)) return false;
    // ⚠ NI SUR UN POI, ET LE MOTIF EST LE MÊME MOT POUR MOT. Les POI sont
    // dérivés de la graine, donc ils étaient là AVANT : un camp posé dessus
    // ferait deux sites sur une case.
    //
    // ⚠ CONSÉQUENCE ASSUMÉE : le filtre rétrécit `libres`, donc l'indice tiré
    // change, donc les FUTURES apparitions d'une partie en cours ne tombent plus
    // aux mêmes cases qu'avant le lot POI. Les satellites DÉJÀ POSÉS ne bougent
    // pas — ils sont dans la sauvegarde. C'est le prix de la règle, et il est dit
    // au rapport du lot.
    if (poiDeLaCase(etat.graine, k.rangee, k.colonne) !== null) return false;
    return !prises.has(`${k.rangee}:${k.colonne}`);
  });
  if (libres.length === 0) return null;

  const choisie = libres[entier(rng, 0, libres.length - 1)];
  const satellite = {
    type,
    rangee: choisie.rangee,
    colonne: choisie.colonne,
    niveau: niveauDuSatellite(type, etat, rng, laBase),
    instance,
    // ⚠⚠ L'ÉCHÉANCE SE COMPTE DEPUIS LE TICK DE LA POSE, JAMAIS DEPUIS
    // `etat.horloge.nbTicks`. Les deux coïncident quand on avance tick par
    // tick ; ils DIVERGENT au rattrapage, qui saute mille ticks d'un coup et
    // pose alors, en une fois, ce que mille ticks auraient posé à des instants
    // différents. Lire l'horloge courante ici ferait donc vivre plus longtemps
    // les satellites d'une partie rechargée que ceux d'une partie restée
    // ouverte — et les deux chemins cesseraient de rendre le même état.
    tickDeReleve: tickDeLaPose + TICKS_DUREE_DE_VIE,
  };
  laBase.satellites.presents.push(satellite);
  etat.prochaineInstanceSatellite = instance + 1;
  return satellite;
}

/**
 * Les défauts STRUCTURELS de la table des satellites — ce qui empêcherait la
 * sauvegarde d'être relue.
 * @param {object} satellites
 * @returns {Array<string>} messages, vide si tout va bien
 */
export function problemesDesSatellites(satellites, prochaineInstance) {
  const problemes = [];
  if (satellites === null || typeof satellites !== 'object') {
    return ['« satellites » n\'est pas une table'];
  }
  for (const champ of ['presents', 'attentes']) {
    if (!Array.isArray(satellites[champ])) problemes.push(`« satellites.${champ} » n'est pas une liste`);
  }
  // ⚠ LE COMPTEUR EST PASSÉ EN ARGUMENT DEPUIS BASES-1 : il est GLOBAL, donc il
  // n'est plus dans la table qu'on valide. Le vérifier ici quand même — plutôt
  // que de le laisser à `verifierEtat` — garde ensemble les deux moitiés d'un
  // même invariant : aucun satellite ne peut porter une instance que le compteur
  // n'a pas encore distribuée.
  if (!Number.isInteger(prochaineInstance) || prochaineInstance < 1) {
    problemes.push(`prochaine instance « ${prochaineInstance} » — entier ≥ 1 attendu`);
  }
  if (problemes.length > 0) return problemes;

  const vues = new Set();
  for (const s of satellites.presents) {
    if (ANNEAUX[s.type] === undefined) problemes.push(`type de satellite inconnu « ${s.type} »`);
    if (!estSurLaCarte(s.rangee, s.colonne)) {
      problemes.push(`satellite hors carte en (${s.rangee}, ${s.colonne})`);
    }
    if (!Number.isInteger(s.niveau) || s.niveau < 1 || s.niveau > NIVEAU.plafond) {
      problemes.push(`niveau de satellite « ${s.niveau} » hors de 1…${NIVEAU.plafond}`);
    }
    if (!Number.isInteger(s.instance) || s.instance < 1) {
      problemes.push(`instance « ${s.instance} » — entier ≥ 1 attendu`);
    }
    // ⚠ L'ÉCHÉANCE DE RELÈVE EST STRUCTURELLE DEPUIS LA v15 : sans elle, un
    // satellite ne serait jamais relevé, et rien à l'écran ne le dirait.
    if (!Number.isInteger(s.tickDeReleve) || s.tickDeReleve < 0) {
      problemes.push(`échéance de relève « ${s.tickDeReleve} » — entier de ticks ≥ 0 attendu`);
    }
    // ⚠ DEUX SATELLITES SUR UNE CASE, C'EST UN FAIT DE PROGRAMME. Le tirage les
    // évite ; s'il en reste, c'est que la sauvegarde a été écrite de travers.
    const cle = `${s.rangee}:${s.colonne}`;
    if (vues.has(cle)) problemes.push(`deux satellites en (${s.rangee}, ${s.colonne})`);
    vues.add(cle);
    if (s.instance >= prochaineInstance) {
      problemes.push(
        `instance ${s.instance} au-delà du compteur ${prochaineInstance}`,
      );
    }
  }
  for (const a of satellites.attentes) {
    if (ANNEAUX[a.type] === undefined) problemes.push(`type attendu inconnu « ${a.type} »`);
    if (!Number.isInteger(a.tickDu) || a.tickDu < 0) {
      problemes.push(`échéance « ${a.tickDu} » — entier de ticks ≥ 0 attendu`);
    }
  }
  return problemes;
}

/** La carte est-elle assez grande pour les anneaux ? Vérifié par un test. */
export const RAYON_MAX_ANNEAU = Math.max(
  ...Object.values(ANNEAUX).map((a) => a.max),
);

/** Exporté pour le test qui croise anneaux et largeur de carte. */
export const LARGEUR_CARTE = GEOGRAPHIE.carte.largeur;
