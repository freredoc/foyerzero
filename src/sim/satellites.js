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
  // ⚠ ELLE NOMME LE CHAMP MANQUANT AU LIEU DE LEVER UNE TypeError QUATRE LIGNES
  // PLUS BAS. C'est la leçon du lot GARNISON-ET-ARMÉE, où un montage de test
  // amputé faisait tomber `resumeDeLaBase` sur `undefined.length` : ça levait
  // dans les deux cas, un seul des deux messages était lisible.
  if (etat.satellites === undefined) {
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
    for (const attente of etat.satellites.attentes) retenir(attente.tickDu);
    // ⚠ UNE SAUVEGARDE PEUT NE PAS PORTER `tickDeReleve` — la migration l'ajoute,
    // mais un satellite forgé par un test n'en a pas. On ne relève alors pas :
    // mieux vaut un satellite immortel qu'une boucle sur `NaN`.
    for (const present of etat.satellites.presents) {
      if (Number.isInteger(present.tickDeReleve)) retenir(present.tickDeReleve);
    }
    if (quand === null) break;

    // 1. LES RELÈVES. Le satellite s'en va et une attente le remplace : c'est
    //    exactement ce que fait une destruction, et c'est voulu — « change de
    //    spawn » veut dire qu'il reparaît ailleurs, pas qu'il disparaît.
    const restants = [];
    for (const present of etat.satellites.presents) {
      if (Number.isInteger(present.tickDeReleve) && present.tickDeReleve <= quand) {
        etat.satellites.attentes.push({ type: present.type, tickDu: quand + TICKS_APPARITION });
      } else {
        restants.push(present);
      }
    }
    etat.satellites.presents = restants;

    // 2. LES APPARITIONS dues à ce tick.
    // ⚠ L'ORDRE EST CELUI DE LA FILE, PAS CELUI DES ÉCHÉANCES. Deux attentes
    // dues au même tick doivent paraître dans l'ordre où elles ont été
    // programmées, sinon deux chemins d'avancement rendraient les mêmes
    // satellites dans deux ordres, et `serialiser` les déclarerait différents.
    const enAttente = [];
    for (const attente of etat.satellites.attentes) {
      if (attente.tickDu > quand) { enAttente.push(attente); continue; }
      const pose = poserUnSatellite(etat, attente.type, quand);
      // Aucune case libre dans l'anneau : on ne perd pas l'attente, on la met
      // de côté. Le cas est possible — un anneau saturé de bases de l'Ouvrage —
      // et perdre l'attente ferait disparaître un camp en silence.
      if (pose === null) reportees.push(attente);
      else parus += 1;
    }
    etat.satellites.attentes = enAttente;
  }
  etat.satellites.attentes.push(...reportees);
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
  const present = etat.satellites?.presents?.find(
    (s) => s.rangee === identite.rangee && s.colonne === identite.colonne
      && s.instance === identite.instance,
  );
  if (present === undefined) return false;
  const echeance = tickDuRaid + TICKS_DUREE_DE_VIE + TICKS_SURSIS;
  if (Number.isInteger(present.tickDeReleve) && present.tickDeReleve >= echeance) return false;
  present.tickDeReleve = echeance;
  return true;
}

/**
 * Tire une case libre de l'anneau et y pose un satellite.
 * @returns {object|null} le satellite posé, ou null si l'anneau est plein
 */
function poserUnSatellite(etat, type, tickDeLaPose) {
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
    // ⚠⚠ L'ÉCHÉANCE SE COMPTE DEPUIS LE TICK DE LA POSE, JAMAIS DEPUIS
    // `etat.horloge.nbTicks`. Les deux coïncident quand on avance tick par
    // tick ; ils DIVERGENT au rattrapage, qui saute mille ticks d'un coup et
    // pose alors, en une fois, ce que mille ticks auraient posé à des instants
    // différents. Lire l'horloge courante ici ferait donc vivre plus longtemps
    // les satellites d'une partie rechargée que ceux d'une partie restée
    // ouverte — et les deux chemins cesseraient de rendre le même état.
    tickDeReleve: tickDeLaPose + TICKS_DUREE_DE_VIE,
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
