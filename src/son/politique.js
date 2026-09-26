// La POLITIQUE de voix : faut-il jouer, quelle variante, à quel gain.
//
// ⚠⚠ CE MODULE NE FAIT AUCUN BRUIT, ET C'EST TOUT SON INTÉRÊT. Il ne connaît
// ni `AudioContext`, ni le DOM, ni l'horloge du système : on lui passe l'instant
// en argument. C'est ce qui rend les temps de garde éprouvables dans Node, où
// il n'y a pas de Web Audio — un `Date.now()` en dur ici les rendrait
// INTESTABLES, et il n'y aurait plus qu'à croire le code sur parole.
//
// ⚠⚠ ET LA FRONTIÈRE AVEC `src/ui/son.js` EST LE LOT ENTIER. Toute condition
// d'autorisation — muet, plafond, garde — vit ICI. L'adaptateur crée le
// contexte, décode, connecte, joue ; il ne décide de rien, et une garde de
// `test/son.test.js` refuse qu'un nom de cette politique-ci reparaisse là-bas.
//
// ⚠⚠ AUCUN IMPORT DE `src/sim/`, ET AUCUN TIRAGE PRIS AU FLUX DE LA PARTIE.
// Le flux d'`etat.rng` est celui de la SIMULATION : y prendre un nombre pour
// choisir une variante de clic décalerait tout ce que le moteur tire ensuite,
// et la partie cesserait de se rejouer à l'identique. Le tirage de variante a
// donc sa propre graine, portée par l'état des voix — même raisonnement que
// `render/variante.js`, qui salue le hachage du peuplement sans y toucher.
// `Math.random` est interdit dans tout `src/` par la garde §11 de
// `test/banc.test.js` ; on n'en a pas besoin non plus.

import { SONS, EVENEMENTS, BUS, VOIX_PAR_BUS } from '../data/sons.js';

/**
 * L'état des voix : ce qui sonne, ce qui vient de sonner, et la graine du
 * tirage de variante. Rien d'autre. Il n'entre dans AUCUNE sauvegarde — un
 * réglage sonore n'est pas un fait de partie.
 *
 * ⚠ LA GRAINE NE PEUT PAS ÊTRE NULLE. Zéro est le point fixe du xorshift : la
 * variante serait figée pour toute la session, et le tirage n'en serait plus un.
 * On lève plutôt que de la corriger en silence.
 *
 * ⚠⚠ ELLE N'A PLUS DE `gardesBus` — lot SON-MÉLANGE, 26/09. La cadence de
 * 334 ms par bus est partie avec lui : elle laissait passer le PREMIER tir de
 * chaque fenêtre, et le premier était toujours le même, les événements d'une
 * image étant parcourus dans l'ordre alphabétique — `weapon_ouvrage_*` avant
 * `weapon_player_*`. Ce qui borne le bus des armes est désormais un nombre de
 * VOIX, et il se lit sur `instances` : aucune seconde mémoire à tenir.
 *
 * @param {number} graine entier non nul
 * @returns {{graine: number, gardes: Record<string, number>,
 *            instances: Record<string, number[]>}}
 */
export function creerVoix(graine) {
  const g = Math.trunc(graine) >>> 0;
  if (g === 0) throw new RangeError('son : la graine du tirage de variante ne peut pas être nulle');
  return { graine: g, gardes: {}, instances: {} };
}

/**
 * Le tirage de variante : un xorshift 32 bits, sur la graine des voix.
 *
 * ⚠⚠ CE QUI LE FAIT AVANCER SE DIT EXACTEMENT, ET CE COMMENTAIRE L'A MAL DIT
 * PENDANT QUINZE JOURS. Il affirmait qu'« un son refusé par la garde ou par le
 * plafond ne consomme pas de tirage » : vrai de la GARDE, qui refuse avant le
 * tirage de variante, et faux du PLAFOND, qui refuse APRÈS — le plafond est une
 * propriété du fichier, il faut donc savoir lequel. Le code n'a pas bougé sur ce
 * point ; c'est la phrase qui mentait.
 *
 * ⚠ ET `choisirLesTirs` CONSOMME UN TIRAGE PAR CANDIDAT, QUE LE SON SORTE OU
 * NON, DÉLIBÉRÉMENT. Le tirage pondéré choisit QUEL tir passe ; un refus en aval
 * — garde, plafond de fichier — ne le rend pas. Ce qui compte n'est pas que la
 * graine avance peu, c'est qu'elle avance PAREIL sur deux exécutions du même
 * mélange, et `SB T2` le mesure.
 *
 * @param {{graine: number}} voix
 * @returns {number} entier non signé sur 32 bits
 */
function tirer(voix) {
  let x = voix.graine >>> 0;
  x ^= (x << 13) >>> 0; x >>>= 0;
  x ^= x >>> 17;
  x ^= (x << 5) >>> 0; x >>>= 0;
  voix.graine = x;
  return x;
}

/**
 * Le gain linéaire d'un son : les décibels de son bus, plus les siens, le tout
 * mis à l'échelle du volume du joueur.
 *
 * ⚠ LES DÉCIBELS S'ADDITIONNENT, LE VOLUME MULTIPLIE. Convertir chaque terme en
 * linéaire pour les additionner ferait tout autre chose — et ce serait faux
 * sans que rien ne le dise, les nombres restant plausibles.
 *
 * @param {string} nomDuSon
 * @param {number} volume facteur linéaire, 0 à 1
 * @returns {number} facteur linéaire à donner au nœud de gain
 */
export function gainDuSon(nomDuSon, volume) {
  const son = SONS[nomDuSon];
  if (son === undefined) throw new RangeError(`son : « ${nomDuSon} » n'est pas dans la table`);
  const db = BUS[son.bus] + son.volumeDb;
  return (10 ** (db / 20)) * volume;
}

/**
 * Retire de l'état les instances dont la durée est écoulée.
 *
 * ⚠⚠ UNE INSTANCE EXPIRE PAR SA DURÉE, PAS PAR UN RAPPEL DE L'ADAPTATEUR. Si
 * `ui/son.js` devait annoncer la fin d'un son, il porterait une part de la
 * politique — et un rappel manqué laisserait un plafond fermé pour toujours,
 * c'est-à-dire un son qui se tait sans que rien ne lève. La durée est dans la
 * table, l'instant est passé en argument : la politique se suffit.
 */
function purger(voix, maintenantMs) {
  for (const [nom, fins] of Object.entries(voix.instances)) {
    const vivantes = fins.filter((fin) => fin > maintenantMs);
    if (vivantes.length === 0) delete voix.instances[nom];
    else voix.instances[nom] = vivantes;
  }
}

/**
 * LA question du moteur : cet événement doit-il sonner, sous quelle variante et
 * à quel gain ?
 *
 * Décide ET enregistre, en un seul appel. Les séparer laisserait l'appelant
 * décider quand armer la garde, donc le laisserait l'oublier — et un son
 * autorisé sans que sa garde soit armée est un son qui ne se garde plus.
 *
 * ⚠ UN ÉVÉNEMENT INCONNU LÈVE. C'est un fait de PROGRAMME — un nom mal tapé au
 * câblage —, pas un fait de jeu : le taire rendrait le son muet à un endroit et
 * personne ne le chercherait là.
 *
 * @param {object} voix l'état rendu par `creerVoix`, modifié en place
 * @param {string} evenement une clé d'`EVENEMENTS`
 * @param {number} maintenantMs l'instant, INJECTÉ
 * @param {{muet: boolean, volume: number}} reglages
 * @returns {{jouer: boolean, son?: string, gain?: number, raison?: string}}
 */
export function demanderUnSon(voix, evenement, maintenantMs, reglages) {
  const decrit = EVENEMENTS[evenement];
  if (decrit === undefined) {
    throw new RangeError(`son : « ${evenement} » n'est pas un événement connu`);
  }

  // 1. le joueur a coupé — ou mis le volume à zéro, ce qui revient au même à
  // l'oreille. On refuse au lieu de jouer un gain nul : une voix dépensée pour
  // du silence occuperait un plafond et ferait taire le son suivant.
  if (reglages.muet || reglages.volume <= 0) return { jouer: false, raison: 'silence' };

  // 2. le temps de garde, par ÉVÉNEMENT (voir `data/sons.js`).
  const dernier = voix.gardes[evenement];
  if (dernier !== undefined && maintenantMs - dernier < decrit.gardeMs) {
    return { jouer: false, raison: 'garde' };
  }

  purger(voix, maintenantMs);

  // 3. la variante, puis son plafond de voix — dans cet ordre, parce que le
  // plafond est une propriété du FICHIER et qu'il faut donc savoir lequel.
  const variantes = decrit.variantes;
  const nomDuSon = variantes.length === 1
    ? variantes[0]
    : variantes[tirer(voix) % variantes.length];
  const son = SONS[nomDuSon];
  const enCours = voix.instances[nomDuSon] ?? [];
  if (enCours.length >= son.maxInstances) return { jouer: false, raison: 'plafond' };

  // 4. accordé : on arme la garde et on compte l'instance.
  voix.gardes[evenement] = maintenantMs;
  voix.instances[nomDuSon] = [...enCours, maintenantMs + son.dureeMs];
  return { jouer: true, son: nomDuSon, gain: gainDuSon(nomDuSon, reglages.volume) };
}

/**
 * Le bus d'un événement, lu sur ses variantes.
 *
 * ⚠ LE BUS EST UNE PROPRIÉTÉ DU FICHIER, PAS DE L'ÉVÉNEMENT, donc il se lit sur
 * une VARIANTE. On prend la première et on LÈVE si les autres divergent : ce
 * serait un fait de programme — un événement dont les variantes ne partagent pas
 * leur mixage —, et le taire ferait dépendre le plafond du bus du tirage de
 * variante. Mesuré au générateur, les 54 groupes à plusieurs variantes portent
 * tous une catégorie unique, donc un seul bus : la levée est un garde-fou.
 */
function busDeLEvenement(evenement) {
  const decrit = EVENEMENTS[evenement];
  if (decrit === undefined) {
    throw new RangeError(`son : « ${evenement} » n'est pas un événement connu`);
  }
  const bus = SONS[decrit.variantes[0]].bus;
  if (!decrit.variantes.every((v) => SONS[v].bus === bus)) {
    throw new RangeError(`son : « ${evenement} » porte plusieurs bus`);
  }
  return bus;
}

/** Combien d'instances encore vivantes occupent ce bus. À appeler après `purger`. */
function voixOccupees(voix, bus) {
  let n = 0;
  for (const [nom, fins] of Object.entries(voix.instances)) {
    if (SONS[nom].bus === bus) n += fins.length;
  }
  return n;
}

/**
 * LE MÉLANGE DES TIRS — lot SON-MÉLANGE, 26/09. Ethan : « j'entends toujours
 * les premiers bruits qui font tamtam […] certains n'ont plus de sons. »
 *
 * Reçoit la LISTE des tirs d'un relevé, un par tir publié, et rend les décisions
 * accordées. Cinq temps :
 *   1. le POIDS d'un événement est son nombre d'occurrences dans la liste ;
 *   2. on tire un candidat au hasard, pondéré par ce poids, SANS REMISE, par
 *      `tirer` — jamais par l'ordre de la liste ni par son tri ;
 *   3. si son bus a un plafond de voix et qu'aucune n'est libre, on le saute ;
 *   4. sinon il passe par `demanderUnSon`, qui peut encore refuser — garde de
 *      l'événement, plafond du fichier ;
 *   5. on s'arrête quand la liste des candidats est vide.
 *
 * ⚠⚠ C'EST LE TIRAGE QUI CHOISIT, PAS LE TRI. Les candidats sont triés avant de
 * tirer pour que le résultat ne dépende pas de l'ordre où le journal les a
 * publiés — deux relevés qui portent les mêmes tirs rendent la même suite —,
 * mais c'est le POIDS qui décide lequel sort. Prendre le premier candidat trié
 * serait l'ordre alphabétique qu'on retire, et `MIX T1` le fait tomber.
 *
 * ⚠⚠ ET LE PLAFOND SE COMPTE SUR LES INSTANCES VIVANTES DU BUS, pas sur un
 * compteur à part. Chaque voix accordée y entre par `demanderUnSon`, qui décide
 * ET enregistre : le candidat suivant voit donc une voix de moins, sans qu'une
 * ligne d'ici ne décrémente rien. Un compteur local aurait été une seconde
 * mémoire du même fait, juste pendant un relevé et fausse au suivant.
 *
 * ⚠ UN BUS SANS PLAFOND NE SAUTE RIEN. Les explosions que tirent les Sapeurs et
 * l'Albatros sont sur le bus `impacts` : elles passent par le même tirage et
 * restent soumises à la garde et au plafond de leur fichier, rien de plus.
 *
 * ⚠ UN TIRAGE EST CONSOMMÉ PAR CANDIDAT, QUE LE SON SORTE OU NON — voir `tirer`.
 *
 * @param {object} voix l'état rendu par `creerVoix`, modifié en place
 * @param {string[]} tirs un événement par tir, dans l'ordre du journal
 * @param {number} maintenantMs l'instant, INJECTÉ
 * @param {{muet: boolean, volume: number}} reglages
 * @returns {Array<{jouer: true, son: string, gain: number}>} les accordées
 */
export function choisirLesTirs(voix, tirs, maintenantMs, reglages) {
  const poids = new Map();
  for (const evenement of tirs) {
    busDeLEvenement(evenement);
    poids.set(evenement, (poids.get(evenement) ?? 0) + 1);
  }
  const candidats = [...poids.keys()].sort();
  const accordees = [];
  while (candidats.length > 0) {
    let total = 0;
    for (const nom of candidats) total += poids.get(nom);
    let reste = tirer(voix) % total;
    let i = 0;
    while (reste >= poids.get(candidats[i])) {
      reste -= poids.get(candidats[i]);
      i += 1;
    }
    const [evenement] = candidats.splice(i, 1);
    const bus = busDeLEvenement(evenement);
    const plafond = VOIX_PAR_BUS[bus];
    if (plafond !== undefined) {
      purger(voix, maintenantMs);
      if (voixOccupees(voix, bus) >= plafond) continue;
    }
    const decision = demanderUnSon(voix, evenement, maintenantMs, reglages);
    if (decision.jouer) accordees.push(decision);
  }
  return accordees;
}

/**
 * LA RÉCONCILIATION DES BOUCLES : ce qu'il faut démarrer, ce qu'il faut arrêter.
 *
 * ⚠⚠ ELLE EST PURE, ET C'EST TOUT LE LOT SON-CÂBLAGE. Le moteur des trois lots
 * précédents ne savait jouer qu'un COUP ; une boucle commence, dure, et
 * s'arrête. L'ensemble qui DOIT sonner se déduit de l'état — quel écran, quelles
 * unités bougent, quels bâtiments tournent — et jamais d'un événement. La
 * différence entre le désiré et le courant se calcule donc ici, où Node peut la
 * mesurer ; `src/ui/son.js` l'EXÉCUTE, il ne la calcule pas.
 *
 * ⚠⚠ ET L'HORLOGE N'EST PAS UN ARGUMENT, CONTRAIREMENT À `demanderUnSon`. Il
 * faut le dire plutôt que de le laisser deviner : une garde ou un plafond de
 * voix sur une boucle refuserait un démarrage que l'ÉTAT demande, et la boucle
 * resterait muette jusqu'au prochain changement d'état — c'est-à-dire un refus
 * qui ne se rattrape pas, là où un clic refusé se rejoue au clic suivant. Une
 * boucle n'a ni garde ni plafond : elle a une raison de sonner, ou elle n'en a
 * pas.
 *
 * ⚠ LE MUET PASSE PAR ICI, PAS PAR L'APPELANT. « Toute condition d'autorisation
 * vit dans la politique » : couper le son doit ARRÊTER les boucles en cours, pas
 * seulement empêcher les suivantes. On vide donc le désiré, ce qui rend
 * l'ensemble des arrêts sans qu'une seconde règle soit écrite.
 *
 * ⚠ UN NOM QUI N'EST PAS UNE BOUCLE LÈVE. C'est un fait de PROGRAMME — un
 * câblage qui demande un coup en continu —, et le taire donnerait une boucle qui
 * se couperait net à la fin du fichier, sans que rien ne le dise.
 *
 * @param {string[]} desire les événements de boucle que l'état demande
 * @param {Iterable<string>} enCours ceux qui sonnent déjà
 * @param {{muet: boolean, volume: number}} reglages
 * @returns {{demarrer: string[], arreter: string[]}} deux listes triées
 */
export function reconcilierLesBoucles(desire, enCours, reglages) {
  const silence = reglages.muet || reglages.volume <= 0;
  const voulu = new Set(silence ? [] : desire);
  for (const nom of voulu) {
    const decrit = EVENEMENTS[nom];
    if (decrit === undefined) {
      throw new RangeError(`son : « ${nom} » n'est pas un événement connu`);
    }
    if (!decrit.variantes.every((v) => SONS[v].boucle === true)) {
      throw new RangeError(`son : « ${nom} » n'est pas une boucle`);
    }
  }
  const joue = new Set(enCours);
  const demarrer = [...voulu].filter((nom) => !joue.has(nom)).sort();
  const arreter = [...joue].filter((nom) => !voulu.has(nom)).sort();
  return { demarrer, arreter };
}

/**
 * Le gain d'une boucle : celui de son unique variante.
 *
 * ⚠ UNE BOUCLE NE SE TIRE PAS AU SORT. Mesuré sur les 35 boucles du pack :
 * **les 35 sont seules dans leur événement**. Passer par le tirage de variante
 * ferait avancer la graine du xorshift à chaque changement d'écran, donc
 * changerait la suite des variantes des clics — un couplage entre deux
 * mécanismes qui n'ont rien à voir. On lève si le fait mesuré cesse d'être vrai.
 *
 * ⚠ ELLE REÇOIT LES RÉGLAGES, PAS LE VOLUME, ET LA GARDE `SON T11` L'EXIGE.
 * L'adaptateur n'a pas le droit de lire un champ de `reglages` — ni `muet`, ni
 * `volume` : il TRANSMET l'objet. Prendre un nombre ici obligerait
 * `src/ui/son.js` à écrire `reglages.volume`, c'est-à-dire à porter une part de
 * la décision, et la garde tomberait — à raison.
 *
 * @param {string} evenement une clé d'`EVENEMENTS` marquée boucle
 * @param {{muet: boolean, volume: number}} reglages
 * @returns {{son: string, gain: number}}
 */
export function boucleDeLEvenement(evenement, reglages) {
  const decrit = EVENEMENTS[evenement];
  if (decrit === undefined) {
    throw new RangeError(`son : « ${evenement} » n'est pas un événement connu`);
  }
  if (decrit.variantes.length !== 1) {
    throw new RangeError(`son : la boucle « ${evenement} » porte plusieurs variantes`);
  }
  const nomDuSon = decrit.variantes[0];
  if (SONS[nomDuSon].boucle !== true) {
    throw new RangeError(`son : « ${evenement} » n'est pas une boucle`);
  }
  return { son: nomDuSon, gain: gainDuSon(nomDuSon, reglages.volume) };
}
