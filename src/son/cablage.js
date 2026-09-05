// CE QUE LE JEU DEMANDE AU SON : les boucles que l'état porte, et l'événement
// qu'un geste réclame. Deux questions, un seul module, et aucune ne fait de bruit.
//
// ⚠⚠ L'ENSEMBLE DÉSIRÉ NE SE DÉDUIT D'AUCUN ÉVÉNEMENT, ET C'EST LA RAISON DE CE
// MODULE. Un coup répond à un geste ; une boucle répond à une SITUATION — quel
// écran est affiché, quelles unités roulent, quels bâtiments tournent. Un
// mécanisme fondé sur des événements manquerait tout ce qui commence sans geste
// (un chargement de partie, une unité qui se remet en marche) et surtout tout ce
// qui s'arrête sans geste, ce qui laisserait une boucle sonner pour toujours.
//
// ⚠⚠ IL EST PUR, ET IL N'IMPORTE QUE `src/data/`. Aucun `src/sim/` : il REÇOIT
// des données simples — l'écran, la disposition d'une base, l'état d'un combat —
// et n'appelle aucun moteur. C'est la même frontière que `src/son/politique.js`,
// et deux gardes de `test/son.test.js` la tiennent dans les deux sens.
//
// ⚠⚠ ET IL NE JOUE RIEN. Il rend des NOMS d'événement ; `src/ui/son.js` en fait
// des sources, `src/ui/session.js` les lui demande. La garde `SON T14` refuse un
// appel de `jouer(` ailleurs que dans ces deux fichiers-là, et elle reste vraie.

import { UNITES, DEFENSES } from '../data/combat.js';
import { BASE_BATIMENTS } from '../data/base.js';
import { BATIMENTS } from '../data/sites.js';
import {
  AMBIANCE_PAR_ECRAN, BOUCLES_DE_BATIMENT, EFFONDREMENT_PV, EXPLOSION_PV,
  IMPACT_LOURD_MILLIEMES, ROULEMENT_PAR_CHASSIS, ARCHETYPE_PAR_UNITE, PASSAGE_AERIEN,
  DEPLOIEMENT_PAR_PAIRE, ARME_PAR_PAIRE, ARME_PAR_DEFENSE, MOTEUR_PAR_CHASSIS,
} from '../data/sons.js';

/**
 * Du PROPRIÉTAIRE du dépôt au mot du pack.
 *
 * ⚠⚠ LE DÉPÔT DIT « joueur », LE PACK DIT « player », ET LES DEUX MOTS NE SE
 * DEVINENT PAS L'UN L'AUTRE. Une seule table les relie, ici, et tout le module
 * y passe : `weapon_player_rifle` contre `weapon_ouvrage_rifle`,
 * `explosion_player_small` contre `explosion_ouvrage_small`. ⚠ ET C'EST LE
 * PROPRIÉTAIRE, JAMAIS LE CAMP. Le camp dit un côté de grille — le joueur
 * DÉFEND sa propre base — et lire le camp ferait sonner ses Cuirassiers en
 * Ouvrage. Une garde le mesure des deux côtés.
 */
const MOT_DU_PROPRIETAIRE = { joueur: 'player', ouvrage: 'ouvrage' };

function motDuProprietaire(proprietaire) {
  const mot = MOT_DU_PROPRIETAIRE[proprietaire];
  if (mot === undefined) {
    throw new RangeError(`son : propriétaire « ${proprietaire} » inconnu`);
  }
  return mot;
}

/**
 * La clé de `MOUVEMENT_PAR_PAIRE` pour une unité : « nom joueur/nom Ouvrage ».
 *
 * ⚠⚠ LA CARTE DU PACK EST INDEXÉE PAR NOMS AFFICHÉS, PAS PAR IDENTIFIANTS, et
 * c'est le point où la correspondance peut se rompre en silence le jour où un
 * nom bouge. On la reconstruit donc de `UNITES[x].nom`, qui est la table qui
 * fait foi sur les deux noms — jamais d'une liste recopiée. **Mesuré au lot
 * SON-CÂBLAGE : les quatorze paires de la carte se résolvent, et les quatorze
 * unités du jeu ont leur entrée** — la couverture est totale dans les deux sens,
 * et un test la recompte.
 *
 * @param {string} id une clé d'`UNITES`
 * @returns {string|null} la paire, ou null si l'identifiant n'est pas une unité
 */
export function paireDeLUnite(id) {
  const unite = UNITES[id];
  if (unite === undefined) return null;
  return `${unite.nom.joueur}/${unite.nom.ouvrage}`;
}

/**
 * Les unités attaquantes, à qui elles sont, et si elles ont bougé au dernier tick.
 *
 * ⚠⚠ C'EST UNE LECTURE D'ÉTAT, PAS UN ÉVÉNEMENT DE SIMULATION, ET LA NUANCE EST
 * TOUTE LA GARDE `SON T14`. On ne branche rien dans `src/sim/` : on COMPARE deux
 * instantanés que l'écran de raid prend déjà pour son interpolation. Le journal
 * du lot JOURNAL-DE-COMBAT publie des ÉVÉNEMENTS — un tir, un impact, une mort —
 * et un roulement n'en est pas un : c'est un ÉTAT qui dure, donc il se lit comme
 * une ambiance se lit, par réconciliation. Les deux mécanismes coexistent parce
 * qu'ils répondent à deux questions différentes.
 *
 * ⚠ SEUL LE CAMP `attaque` SE DÉPLACE — `deplacement()` de `sim/combat.js`
 * écarte tout le reste depuis toujours —, donc comparer les rangées suffit et
 * il n'y a pas de second critère à inventer.
 *
 * ⚠ UNE UNITÉ QUI VIENT DE PARAÎTRE N'A PAS DE POSITION D'AVANT, ET ELLE NE
 * COMPTE PAS. Les vagues entrent en cours de combat — `ajouterEntite` allonge
 * `entites` —, donc l'instantané pris avant le tick est plus court que la liste
 * d'après. Le tick suivant la comptera si elle avance. Mesuré : `entites` n'est
 * jamais RACCOURCIE — `retirerLesMorts` marque `vivant`, elle ne retire rien —,
 * donc les indices des deux tableaux ne peuvent pas se décaler.
 *
 * ⚠⚠ ET LE PROPRIÉTAIRE SORT AVEC L'IDENTIFIANT, DEPUIS LE LOT
 * JOURNAL-DE-COMBAT. Le lot précédent ne rendait que les unités du joueur, faute
 * de savoir ce que roule une pièce de l'Ouvrage ; la table par CHÂSSIS le dit
 * maintenant dans les deux camps. Toutes les attaquantes d'un combat partagent
 * `proprietaireAttaque`, donc les deux camps ne roulent jamais ensemble — mais
 * c'est une propriété du moteur, pas une hypothèse de ce module.
 *
 * @param {{entites: object[]}|null} combat l'état de combat, ou null
 * @param {number[]|null} precedentes les `rangeeMilli` d'avant le tick
 * ⚠⚠ ET LES DEUX MOITIÉS SORTENT ENSEMBLE, DEPUIS QUE LES MOTEURS À L'ARRÊT
 * SONT CÂBLÉS. « A bougé » et « n'a pas bougé » sont la même lecture prise dans
 * les deux sens ; en faire deux fonctions ferait deux parcours de la même liste,
 * dont un seul serait éprouvé le jour où le critère changerait.
 *
 * @returns {Array<{id: string, proprietaire: string, enMouvement: boolean}>}
 *   triés, sans doublon
 */
export function etatDesUnites(combat, precedentes) {
  if (combat === null || combat === undefined || precedentes === null
      || precedentes === undefined) return [];
  const vus = new Map();
  combat.entites.forEach((e, i) => {
    if (e.camp !== 'attaque') return;
    if (e.vivant !== true || e.sorti === true) return;
    // ⚠ UNE UNITÉ QUI VIENT DE PARAÎTRE N'A PAS DE POSITION D'AVANT : elle n'est
    // ni en mouvement ni à l'arrêt, elle n'est pas encore comparable.
    if (precedentes[i] === undefined) return;
    const enMouvement = e.rangeeMilli !== precedentes[i];
    const cle = `${e.id}|${e.proprietaire}|${enMouvement}`;
    vus.set(cle, { id: e.id, proprietaire: e.proprietaire, enMouvement });
  });
  return [...vus.keys()].sort().map((cle) => vus.get(cle));
}

/**
 * La boucle qu'une unité porte à cet instant, ou `null` si elle n'en a pas.
 *
 * ⚠⚠ LA RÈGLE EST « PAR CHÂSSIS », ET ELLE SE COMPOSE DE LA DONNÉE QUI FAIT FOI.
 * `UNITES[x].chassis` classe les quatorze en escouade, blindé et aéronef ;
 * `comportementAerien` coupe les aéronefs en deux. Les poids des blindés et des
 * stoppeurs sont dans `ARCHETYPE_PAR_UNITE`, où trois des sept lignes sont
 * confrontées à la carte du pack par le générateur.
 *
 * ⚠ UN AÉRONEF `traversant` NE ROULE PAS : il PASSE. Son coup est
 * `PASSAGE_AERIEN`, joué à l'apparition, et le pack ne marque pas
 * `movement_player_flyby` comme une boucle — c'est la donnée qui l'interdit.
 *
 * @param {string} id une clé d'`UNITES`
 * @param {string} proprietaire 'joueur' ou 'ouvrage'
 * @returns {string|null} une clé d'`EVENEMENTS`
 */
export function boucleDeLUnite(id, proprietaire, enMouvement) {
  const unite = UNITES[id];
  if (unite === undefined) return null;
  if (unite.chassis === 'aeronef' && unite.comportementAerien === 'traversant') return null;
  const archetype = unite.chassis === 'escouade' ? 'escouade' : ARCHETYPE_PAR_UNITE[id];
  if (archetype === undefined) {
    throw new RangeError(`son : l'unité « ${id} » n'a pas d'archétype déclaré`);
  }
  // ⚠⚠ À L'ARRÊT, SEUL UN BLINDÉ FAIT DU BRUIT — et `MOTEUR_PAR_CHASSIS` le dit
  // en ne portant que les trois poids de blindé. Une escouade immobile se tait ;
  // un stoppeur immobile tient l'air, donc son `dard` continue. C'est pourquoi
  // on retombe sur le roulement plutôt que de rendre `null` : pour eux, la
  // boucle ne change pas selon qu'ils avancent ou non.
  if (!enMouvement) {
    const moteur = MOTEUR_PAR_CHASSIS[archetype];
    if (moteur !== undefined) return moteur[proprietaire] ?? null;
    if (unite.chassis === 'escouade') return null;
  }
  const couple = ROULEMENT_PAR_CHASSIS[archetype];
  if (couple === undefined) {
    throw new RangeError(`son : l'unité « ${id} » n'a pas de roulement déclaré`);
  }
  return couple[proprietaire] ?? null;
}

/**
 * L'ensemble des boucles que l'état DEMANDE, à cet instant.
 *
 * ⚠ TROIS SOURCES, ET ELLES NE SE CHEVAUCHENT PAS : l'écran donne l'ambiance,
 * la disposition donne les machineries, le combat donne les roulements. Un même
 * nom demandé deux fois ne sonne qu'une : l'ensemble est dédoublonné ici, ce qui
 * est la forme que prend « une boucle par TYPE de bâtiment, pas par bâtiment ».
 * Six usines ne font pas six fois le même bruit ; compter sur le plafond de voix
 * pour les refuser marcherait, et demanderait de savoir combien il en autorise.
 *
 * ⚠ UN ÉCRAN SANS AMBIANCE NE LÈVE PAS. `AMBIANCE_PAR_ECRAN` couvre les sept
 * écrans d'aujourd'hui, et un test l'exige ; mais l'appelant peut passer `null`
 * avant que le premier écran soit montré, et ce n'est pas une faute.
 *
 * @param {{ecran: string|null, disposition: object[],
 *   unites: Array<{id: string, proprietaire: string, enMouvement: boolean}>}} vue
 * @returns {string[]} des clés d'`EVENEMENTS`, triées, sans doublon
 */
export function bouclesDesirees({ ecran = null, disposition = [], unites = [] } = {}) {
  const voulu = new Set();
  const ambiance = ecran === null ? undefined : AMBIANCE_PAR_ECRAN[ecran];
  if (ambiance !== undefined) voulu.add(ambiance);
  for (const piece of disposition) {
    const boucle = BOUCLES_DE_BATIMENT[piece.id];
    if (boucle !== undefined) voulu.add(boucle);
  }
  for (const { id, proprietaire, enMouvement } of unites) {
    const boucle = boucleDeLUnite(id, proprietaire, enMouvement === true);
    if (boucle !== null) voulu.add(boucle);
  }
  return [...voulu].sort();
}

/**
 * La taille d'un effondrement, lue sur les PV du bâtiment.
 *
 * ⚠⚠ C'EST UNE PROPOSITION, PAS UN ARBITRAGE, ET ELLE SE CHANGE EN DEUX
 * NOMBRES. Le pack porte trois tailles ; le dépôt ne porte AUCUNE notion de
 * taille de bâtiment. Le brief donnait « l'empreinte » comme candidat naturel :
 * mesuré, elle ne discrimine rien — les onze bâtiments occupent une case. Les PV
 * discriminent et se coupent net : **{1000, 1000, 1500} · {2000, 2500 ×4} ·
 * {3000, 3000, 5500}**, d'où les seuils 2 000 et 3 000 d'`EFFONDREMENT_PV`, qui
 * rendent 3 · 5 · 3. ⚠ `classeDeCout` donnerait presque la même partition — elle
 * ne diverge que sur la Centrale — mais elle a QUATRE classes pour trois
 * tailles : il faudrait en grouper deux, ce qui est le même choix, déguisé en
 * donnée. **Ethan tranche.**
 *
 * ⚠ ET ELLE SERT LES DEUX CAMPS DEPUIS LE LOT JOURNAL-DE-COMBAT : un raid fait
 * tomber les bâtiments de l'Ouvrage, dont les PV — 1 000 à 5 500 — se partagent
 * sur les mêmes seuils. Mesuré : 3 · 1 · 1 côté Ouvrage, 3 · 5 · 3 côté joueur.
 *
 * @param {string} id une clé de `BASE_BATIMENTS` ou de `BATIMENTS`
 * @param {string} proprietaire 'joueur' ou 'ouvrage'
 * @returns {string} une clé d'`EVENEMENTS`
 */
export function effondrementDuBatiment(id, proprietaire = 'joueur') {
  // ⚠ LES DEUX TABLES, ET DANS CET ORDRE-LÀ N'IMPORTE PAS : `verifierArithmetique`
  // de `sim/combat.js` LÈVE si un identifiant est à la fois un bâtiment de
  // l'Ouvrage et du joueur, donc les deux jeux de clés sont disjoints. Une seule
  // table aurait rendu muet l'effondrement d'une Souche, qui est très exactement
  // ce qu'un raid fait tomber en premier.
  const batiment = BASE_BATIMENTS[id] ?? BATIMENTS[id];
  if (batiment === undefined) {
    throw new RangeError(`son : « ${id} » n'est pas un bâtiment`);
  }
  const mot = motDuProprietaire(proprietaire);
  const [moyen, grand] = EFFONDREMENT_PV;
  if (batiment.pv >= grand) return `building_${mot}_collapse_large`;
  if (batiment.pv >= moyen) return `building_${mot}_collapse_medium`;
  return `building_${mot}_collapse_small`;
}

/**
 * Quel événement un GESTE du joueur demande — ou `null` s'il n'en demande aucun.
 *
 * ⚠⚠ L'ÉCRAN NOMME UN GESTE, JAMAIS UN SON. C'est la même frontière que
 * `sonDeRefus` du lot SON-MOTEUR, poussée d'un cran : `src/ui/chantier.js` dit
 * « le joueur a démoli une pièce de tel genre », et c'est ici qu'on décide si ça
 * fait du bruit et lequel. La garde `SON T14` refuse de toute façon un appel de
 * `jouer(` dans un écran ; sans ce module, la session porterait la décision.
 *
 * ⚠⚠ ET LE GENRE VIENT DE LA TABLE `TERRAINS`, PAS D'UN `=== 'batiments'` ÉCRIT
 * DANS L'ÉCRAN. Le dépôt a déjà payé ce cas particulier deux fois — `demolir` et
 * `deplacer` reconnus par leur nom —, et deux gardes de `chantier.test.js` le
 * refusent nommément. Démolir une garnison n'est pas un effondrement de
 * bâtiment : le pack n'a pas de son pour ça, et on n'en détourne aucun.
 *
 * ⚠⚠ ET « RÉPARER » EST UN GESTE À PART ENTIÈRE, PAS UN `'amelioration'`
 * EMPRUNTÉ — lot RÉPARER-ÉCRAN, 05/09. L'écran aurait pu passer le geste voisin
 * pour obtenir le même son : il aurait alors MENTI sur ce que le joueur vient de
 * faire, et le jour où le pack donnera un son propre à la réparation, il aurait
 * fallu retrouver lequel des deux appels était lequel. Le geste dit ce qui s'est
 * passé ; c'est ici, et ici seulement, qu'on décide du bruit.
 *
 * ⚠⚠ ET LE SON EST CELUI DE LA CONSTRUCTION ACHEVÉE, PARCE QUE LES DEUX SONS DE
 * RÉPARATION DU PACK SONT DES BOUCLES. `building_player_repair_loop` porte
 * `boucle: true` : il décrit une réparation qui DURE, et il reste muet pour la
 * raison écrite au lot SON-CÂBLAGE — le modèle n'a « ni réparation qui dure »,
 * c'est un stock qui se dépense en un tick. Le jouer en coup unique inventerait
 * une mécanique que le pack ne demande pas. Ce qui est vrai, en revanche, c'est
 * qu'un bâtiment vient de se retrouver debout et entier : c'est exactement ce
 * que `building_player_complete` dit déjà de la pose et de l'amélioration.
 *
 * @param {string} geste 'selection' · 'pose' · 'amelioration' · 'reparation'
 *   · 'deplacement' · 'retrait' · 'attaque'
 * @param {{genre?: string, id?: string}} quoi ce sur quoi le geste porte
 * @returns {string|null}
 */
export function evenementDuGeste(geste, { genre = null, id = null } = {}) {
  switch (geste) {
    case 'selection': return 'order_player_select';
    case 'deplacement': return 'order_player_move';
    case 'attaque': return 'order_player_attack';
    case 'pose':
    case 'amelioration':
    case 'reparation':
      return genre === 'batiment' ? 'building_player_complete' : null;
    case 'retrait':
      return genre === 'batiment' ? effondrementDuBatiment(id) : null;
    default:
      throw new RangeError(`son : geste « ${geste} » inconnu`);
  }
}

/**
 * L'arme d'une pièce qui vient de tirer, ou `null` si elle n'en a pas.
 *
 * ⚠⚠ DEUX PROVENANCES, DEUX TABLES, ET C'EST VOULU. Celle des quatorze unités
 * est DÉRIVÉE d'`art/sources/unit_audio_map.json` ; celle des six défenses qui
 * tirent est un ARBITRAGE d'Ethan, parce que la carte du pack ne décrit aucune
 * défense — mesuré, aucune de ses clés n'en nomme une. Les fondre en une seule
 * ferait croire que les deux moitiés se lisent au même endroit.
 *
 * ⚠ MERLON, RONCE ET HERSE RENDENT `null`, ET C'EST LA DONNÉE QUI LE DIT : leur
 * `degats` vaut `null`, elles ne tirent pas. Le moteur ne publiera jamais de tir
 * pour elles — `tir()` sort sur `degats === 0` — donc cette branche est une
 * ceinture, et un test la mesure des deux côtés.
 *
 * @param {{id: string, genre: string, proprietaire: string}} fait
 * @returns {string|null} une clé d'`EVENEMENTS`
 */
export function armeDuTireur({ id, genre, proprietaire }) {
  if (genre === 'unite') {
    const paire = paireDeLUnite(id);
    const couple = paire === null ? undefined : ARME_PAR_PAIRE[paire];
    return couple === undefined ? null : (couple[proprietaire] ?? null);
  }
  if (genre === 'defense') {
    const couple = ARME_PAR_DEFENSE[id];
    return couple === undefined ? null : (couple[proprietaire] ?? null);
  }
  // Un bâtiment ne tire pas : `profilBatiment` pose `degatsColonne: null`.
  return null;
}

/**
 * L'explosion d'une PIÈCE détruite au combat — jamais l'effondrement d'un
 * bâtiment.
 *
 * ⚠⚠ SES SEUILS NE SONT PAS CEUX D'UN BÂTIMENT, ET C'EST MESURÉ. Les vingt-trois
 * unités et défenses vont de 500 à 2 000 PV : `EFFONDREMENT_PV` en classerait
 * **21 en `small`, 2 en `medium`, 0 en `large`**. `EXPLOSION_PV` rend 9 · 10 · 4.
 * Deux paires de nombres, deux échelles, et les deux se changent seules.
 *
 * @param {{id: string, genre: string, proprietaire: string}} fait
 * @returns {string} une clé d'`EVENEMENTS`
 */
export function explosionDeLaPiece({ id, genre, proprietaire }) {
  const piece = genre === 'unite' ? UNITES[id] : DEFENSES[id];
  if (piece === undefined) {
    throw new RangeError(`son : « ${id} » n'est ni une unité ni une défense`);
  }
  const mot = motDuProprietaire(proprietaire);
  const [moyenne, grande] = EXPLOSION_PV;
  if (piece.pv >= grande) return `explosion_${mot}_large`;
  if (piece.pv >= moyenne) return `explosion_${mot}_medium`;
  return `explosion_${mot}_small`;
}

/**
 * Ce que le journal d'UN tick demande au son.
 *
 * ⚠⚠ UN ENSEMBLE, PAS UNE LISTE, ET C'EST LA RÉPONSE AU POINT DUR DU LOT. La
 * simulation avance par TICKS, l'écran par IMAGES, et `ticksDus` en résout
 * jusqu'à douze dans la même image en ×4. Demander un son par tir publié ferait
 * cent cinquante coups de canon dans la même milliseconde ; la politique de voix
 * les refuserait, mais compter sur un refus n'est pas une conception — ce serait
 * demander cent cinquante sons pour en obtenir deux, à chaque image. **Un
 * événement distinct sonne au plus une fois par relevé**, quel que soit le
 * nombre de faits qui le réclament.
 *
 * ⚠ ET C'EST L'APPELANT QUI DÉCIDE DE LA FENÊTRE. `src/ui/raid.js` relève le
 * journal là où il prend son instantané d'interpolation — donc une fois par tick
 * joué à l'image — et accumule jusqu'à ce que la session vienne le vider. Le
 * mode « Instantané », lui, ne prend aucun instantané et ne relève rien : un
 * combat résolu d'un coup n'a pas de déroulé, donc rien à sonner. C'est une
 * conséquence de l'endroit, pas un cas particulier écrit à la main.
 *
 * ⚠⚠ ET LES ALERTES SUIVENT LE PROPRIÉTAIRE DE CE QUI TOMBE, pas celui qui
 * regarde. `alert_ouvrage_unit_lost` est ce que l'Ouvrage « dit » quand il perd
 * une pièce ; le pack porte les deux camps pour les dix-huit alertes, et choisir
 * le spectateur demanderait de savoir qui regarde — ce que la simulation ne
 * publie pas et n'a pas à publier.
 *
 * @param {{apparitions: object[], vagues: object[], tirs: object[],
 *   impacts: object[], destructions: object[]}|null} journal
 * @returns {string[]} des clés d'`EVENEMENTS`, triées, sans doublon
 */
export function evenementsDuJournal(journal) {
  if (journal === null || journal === undefined) return [];
  const voulu = new Set();

  for (const vague of journal.vagues) {
    voulu.add(`alert_${motDuProprietaire(vague.proprietaire)}_wave_start`);
  }

  for (const fait of journal.apparitions) {
    const unite = UNITES[fait.id];
    if (unite === undefined) continue;
    // Le PASSAGE d'un traversant : un coup, à l'entrée en scène.
    if (unite.chassis === 'aeronef' && unite.comportementAerien === 'traversant') {
      voulu.add(PASSAGE_AERIEN[fait.proprietaire]);
    }
    const paire = paireDeLUnite(fait.id);
    const deploiement = paire === null ? undefined : DEPLOIEMENT_PAR_PAIRE[paire];
    if (deploiement !== undefined) voulu.add(deploiement[fait.proprietaire]);
  }

  for (const fait of journal.tirs) {
    const arme = armeDuTireur(fait);
    if (arme !== null) voulu.add(arme);
  }

  // ⚠⚠ TOUT IMPACT EST DU MÉTAL, ET C'EST MESURÉ, PAS SUPPOSÉ. Le moteur ne
  // publie un impact que sur une ENTITÉ touchée : il n'a ni tir manqué, ni
  // projectile qui retombe à côté, donc aucune case vide n'est jamais frappée.
  // `impact_dirt_*`, `impact_quartz_*` et `impact_scoria_*` restent muets — le
  // champ de bataille ne connaît d'ailleurs ni quartz ni scorie, mesuré : le
  // montage porte `obstacles`, jamais un champ de ressource.
  for (const fait of journal.impacts) {
    // ⚠ EN MILLIÈMES DES PV MAX DE LA CIBLE, JAMAIS EN MILLI-PV ABSOLUS — voir
    // `IMPACT_LOURD_MILLIEMES`. Un produit puis une comparaison : pas de
    // division, donc pas d'arrondi à discuter.
    const lourd = fait.encaisseMilli * 1000 >= fait.pvMaxMilli * IMPACT_LOURD_MILLIEMES;
    voulu.add(lourd ? 'impact_metal_heavy' : 'impact_metal_small');
  }

  for (const fait of journal.destructions) {
    const mot = motDuProprietaire(fait.proprietaire);
    if (fait.genre === 'batiment') {
      voulu.add(effondrementDuBatiment(fait.id, fait.proprietaire));
      voulu.add(`alert_${mot}_structure_lost`);
    } else {
      voulu.add(explosionDeLaPiece(fait));
      voulu.add(fait.genre === 'unite' ? `alert_${mot}_unit_lost` : `alert_${mot}_structure_lost`);
    }
  }

  return [...voulu].sort();
}
