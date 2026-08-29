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
import { niveauDesBatiments } from './niveau-de-base.js';
import { creerRng, entier } from './rng.js';

/** Le délai d'apparition, en ticks — cinq minutes. */
export const TICKS_APPARITION = SATELLITES.delaiApparitionSec * TICKS_PAR_SECONDE;

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

/** L'état vide, pour une base qui n'a encore rien autour d'elle. */
export function satellitesVides() {
  return { presents: [], attentes: [], prochaineInstance: 1 };
}

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
 * Les cases d'un anneau autour d'une position, en distance de TCHEBYCHEV.
 *
 * ⚠ TCHEBYCHEV ET NON EUCLIDIEN, comme la garde du peuplement. Sur une grille,
 * une case en diagonale n'est pas plus loin qu'une case droit devant : la
 * mesurer plus loin creuserait des anneaux en losange que personne n'a demandés.
 *
 * @param {{rangee: number, colonne: number}} centre
 * @param {number} min distance minimale, incluse
 * @param {number} max distance maximale, incluse
 * @returns {Array<{rangee: number, colonne: number}>}
 */
export function casesDeLAnneau(centre, min, max) {
  const cases = [];
  for (let dr = -max; dr <= max; dr += 1) {
    for (let dc = -max; dc <= max; dc += 1) {
      const distance = Math.max(Math.abs(dr), Math.abs(dc));
      if (distance < min || distance > max) continue;
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
export function niveauDuSatellite(type, etat, rng) {
  if (type === 'camp') {
    const dixiemes = niveauDesBatiments(etat.disposition);
    return borner(Math.round(dixiemes / 10));
  }
  // « De niveau égal au rayon ±1 » — spec §10. Le rayon, ici, c'est le niveau de
  // la rangée : la carte ne connaît pas d'autre distance.
  const rayon = niveauDeLaRangee(etat.position.rangee);
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
export function planifierSatellites(etat) {
  const du = etat.horloge.nbTicks + TICKS_APPARITION;
  etat.satellites.presents = [];
  etat.satellites.attentes = [];
  for (const [type, anneau] of Object.entries(ANNEAUX)) {
    for (let n = 0; n < anneau.nombre; n += 1) {
      etat.satellites.attentes.push({ type, tickDu: du });
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
export function detruireSatellite(etat, index) {
  const present = etat.satellites.presents[index];
  if (present === undefined) {
    throw new RangeError(`satellites : aucun satellite à l'indice ${index}`);
  }
  etat.satellites.presents.splice(index, 1);
  etat.satellites.attentes.push({
    type: present.type,
    tickDu: etat.horloge.nbTicks + TICKS_APPARITION,
  });
  return etat;
}

/**
 * Fait paraître les satellites dont l'heure est venue.
 *
 * ⚠ APPELÉE PAR LES DEUX CHEMINS D'AVANCEMENT, ET SANS BOUCLE PAR TICK. Elle ne
 * regarde que l'horloge courante : mille ticks d'un coup font paraître
 * exactement ce que mille ticks un par un auraient fait paraître. C'est ce qui
 * la rend compatible avec le rattrapage analytique — et c'est aussi pourquoi
 * elle ne peut RIEN faire qui dépende de l'instant précis de l'apparition.
 *
 * @param {object} etat modifié en place
 * @returns {number} nombre de satellites parus
 */
export function resoudreSatellites(etat) {
  // ⚠ ELLE NOMME LE CHAMP MANQUANT AU LIEU DE LEVER UNE TypeError QUATRE LIGNES
  // PLUS BAS. C'est la leçon du lot GARNISON-ET-ARMÉE, où un montage de test
  // amputé faisait tomber `resumeDeLaBase` sur `undefined.length` : ça levait
  // dans les deux cas, un seul des deux messages était lisible.
  if (etat.satellites === undefined) {
    throw new Error('satellites : champ « satellites » absent de l\'état');
  }
  const maintenant = etat.horloge.nbTicks;
  const restent = [];
  let parus = 0;
  // ⚠ L'ORDRE EST CELUI DE LA FILE, PAS CELUI DES ÉCHÉANCES. Deux attentes dues
  // au même tick doivent paraître dans l'ordre où elles ont été programmées,
  // sinon deux chemins d'avancement rendraient les mêmes satellites dans deux
  // ordres, et `serialiser` les déclarerait différents.
  for (const attente of etat.satellites.attentes) {
    if (attente.tickDu > maintenant) {
      restent.push(attente);
      continue;
    }
    const pose = poserUnSatellite(etat, attente.type);
    // Aucune case libre dans l'anneau : on ne perd pas l'attente, on la reporte.
    // Le cas est possible — un anneau saturé de bases de l'Ouvrage — et perdre
    // l'attente ferait disparaître un camp en silence.
    if (pose === null) restent.push(attente);
    else parus += 1;
  }
  etat.satellites.attentes = restent;
  return parus;
}

/**
 * Tire une case libre de l'anneau et y pose un satellite.
 * @returns {object|null} le satellite posé, ou null si l'anneau est plein
 */
function poserUnSatellite(etat, type) {
  const anneau = ANNEAUX[type];
  if (anneau === undefined) throw new Error(`satellites : type inconnu « ${type} »`);
  const instance = etat.satellites.prochaineInstance;
  const rng = creerRng(graineDeLApparition(etat.graine, instance));

  const prises = new Set(etat.satellites.presents.map((s) => `${s.rangee}:${s.colonne}`));
  const libres = casesDeLAnneau(etat.position, anneau.min, anneau.max).filter((k) => {
    // ⚠ JAMAIS SUR UNE BASE DE L'OUVRAGE. Elles sont dérivées de la graine, donc
    // elles étaient là AVANT : un camp posé dessus ferait deux sites sur une
    // case. La règle des huit cases, elle, ne s'applique pas — Ethan, le 29/08 :
    // « les camps et avant-postes peuvent coller les bases ».
    if (estBaseOuvrage(etat.graine, k.rangee, k.colonne)) return false;
    return !prises.has(`${k.rangee}:${k.colonne}`);
  });
  if (libres.length === 0) return null;

  const choisie = libres[entier(rng, 0, libres.length - 1)];
  const satellite = {
    type,
    rangee: choisie.rangee,
    colonne: choisie.colonne,
    niveau: niveauDuSatellite(type, etat, rng),
    instance,
  };
  etat.satellites.presents.push(satellite);
  etat.satellites.prochaineInstance = instance + 1;
  return satellite;
}

/**
 * Les défauts STRUCTURELS de la table des satellites — ce qui empêcherait la
 * sauvegarde d'être relue.
 * @param {object} satellites
 * @returns {Array<string>} messages, vide si tout va bien
 */
export function problemesDesSatellites(satellites) {
  const problemes = [];
  if (satellites === null || typeof satellites !== 'object') {
    return ['« satellites » n\'est pas une table'];
  }
  for (const champ of ['presents', 'attentes']) {
    if (!Array.isArray(satellites[champ])) problemes.push(`« satellites.${champ} » n'est pas une liste`);
  }
  if (!Number.isInteger(satellites.prochaineInstance) || satellites.prochaineInstance < 1) {
    problemes.push(`prochaine instance « ${satellites.prochaineInstance} » — entier ≥ 1 attendu`);
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
    // ⚠ DEUX SATELLITES SUR UNE CASE, C'EST UN FAIT DE PROGRAMME. Le tirage les
    // évite ; s'il en reste, c'est que la sauvegarde a été écrite de travers.
    const cle = `${s.rangee}:${s.colonne}`;
    if (vues.has(cle)) problemes.push(`deux satellites en (${s.rangee}, ${s.colonne})`);
    vues.add(cle);
    if (s.instance >= satellites.prochaineInstance) {
      problemes.push(
        `instance ${s.instance} au-delà du compteur ${satellites.prochaineInstance}`,
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
