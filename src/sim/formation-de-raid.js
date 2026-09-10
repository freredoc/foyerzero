// La formation de raid — une COPIE DE TRAVAIL de l'armée, et rien d'autre.
//
// ⚠⚠⚠ DEUX ARBITRAGES D'ETHAN, ET LE SECOND RENVERSE UNE PARTIE DU PREMIER.
// LES DEUX SONT ÉCRITS ICI, DATÉS, PARCE QUE C'EST LA SEULE CHOSE QUI EMPÊCHERA
// UN FUTUR LOT DE « RÉTABLIR » LA REMISE À ZÉRO EN CROYANT RÉPARER.
//
//   • **08/09** — « la formation de raid repart toujours de celle d'Offense, et
//     toutes les unités repartent actives ». La formation vivait alors dans la
//     fermeture de l'écran, mourait avec lui, et ne se sérialisait pas ; c'est
//     cette phrase-là, et elle seule, qui faisait que `SAVE_VERSION` ne bougeait
//     pas.
//
//   • **10/09** — « la position des unités dans le menu Offense revient à chaque
//     fois. Je vais attaquer une cible, je fais un raid, mais il n'est pas
//     terminé. Je reviens sur la cible, les unités restent dans leur position.
//     Je ne suis pas obligé de remettre mes unités à chaque fois. » Et, sur
//     question directe : **le drapeau actif/inactif est retenu aussi.**
//
// ⚠⚠ CE QUI SURVIT DU 08/09 : la formation reste une COPIE DE TRAVAIL, elle
// repart de l'armée d'Offense **dès que la cible change**, et `formationDepuisLArmee`
// pose toujours `actif: true` — c'est le point de départ NEUF. Ce qui tombe :
// « à chaque ouverture ». Sur la MÊME cible, et tant que l'armée n'a pas été
// recomposée, la formation retenue est rendue telle quelle.
//
// ⚠⚠ ET C'EST CE QUI FAIT BOUGER `SAVE_VERSION` DE 31 À 32. La mémoire doit
// survivre à la fermeture du jeu — un raid non terminé est le cas d'usage
// d'Ethan, pas un cas limite —, donc elle entre dans l'état et se sérialise.
// C'est le seul champ neuf du lot.
//
// ⚠⚠ ELLE EST ALIGNÉE PAR INDICE SUR `baseCourante(etat).armee`, ET CE N'EST PAS
// UN CONFORT — C'EST CE QUI EMPÊCHE LE RAID DE LEVER. `executerRaid` appelle
// `reporterLesDegats(etat, resultat, indices)`, qui exige
// `resultat.attaquants.length === indices.length` et apparie les deux listes
// POSITION PAR POSITION ; `indices[i]` est un indice dans `laBase.armee`. Si la
// copie réordonnait quoi que ce soit — un `splice`, un `filter`, un tri qui ne
// rend pas le même ordre —, les dégâts d'un raid tomberaient sur la mauvaise
// unité, EN SILENCE, et aucun message d'erreur ne le dirait. La copie se
// construit donc par `map`, jamais autrement, et rien ici ne retire ni ne
// réordonne une pièce : embarquer déplace un champ, pas une case de liste.
//
// ⚠⚠ LE VALIDATEUR NE SE RÉÉCRIT PAS. `problemesDeLEffectif` de `sim/state.js`
// est déjà LE contrôle d'un effectif — roster, bornes de grille, superposition,
// niveau, dégâts. Il prend une LISTE, pas un état : il travaille donc sur la
// copie tel quel. Une seconde table de refus écrite pour la préparation de raid
// dirait un jour autre chose que celle d'Offense, et les deux vivent sous le
// même doigt.
//
// ⚠⚠ UNE SEULE DIFFÉRENCE ASSUMÉE AVEC OFFENSE, ET ELLE EST ÉCRITE EN CLAIR.
// `problemesDuDeplacementDEffectif` ajoute `problemeDuBatimentDeProduction`, qui
// refuse de bouger une pièce dont le bâtiment de production est tombé. La
// formation de raid NE LE RAPPELLE PAS : on ne compose rien ici, on RANGE ce qui
// est déjà composé, et refuser de réarranger sa formation parce qu'une usine est
// tombée serait un piège au moment où le joueur en a le plus besoin. Décision
// réversible d'UNE ligne — il suffit d'appeler ce voisin dans les deux
// `problemesDe…` ci-dessous pour la renverser.

import { baseCourante } from './base-courante.js';
import { problemesDeLEffectif } from './state.js';
import { UNITES } from '../data/combat.js';
import { nomDuModule, moduleEstAcquis } from './recherche.js';

/**
 * La force que cette formation copie. Une CONSTANTE, pas un littéral répété :
 * `problemesDeLEffectif` se choisit une ligne de `FORCES` par ce nom, et
 * l'écrire cinq fois donnerait cinq occasions d'écrire « garnison ».
 */
export const FORCE_DE_LA_FORMATION = 'armee';

/**
 * Le module qui transporte, et le châssis qui embarque.
 *
 * ⚠⚠ LA RÈGLE SE LIT DANS LA TABLE, ON N'ÉCRIT JAMAIS `ratisseur` NI `busard` EN
 * DUR. Ce sont les deux porteurs d'aujourd'hui — `UNITES.ratisseur.module` et
 * `UNITES.busard.module` valent `garnison` — mais une troisième pièce qui
 * gagnerait le module doit marcher sans qu'on touche à une ligne de ce fichier.
 *
 * ⚠ ET LE PASSAGER EST TOUJOURS UNE INFANTERIE — Ethan, 08/09 : « il est
 * toujours une infanterie ». Le châssis est la grandeur qui le dit ; « escouade »
 * est la clé de `UNITES[id].chassis`, pas un mot d'interface.
 */
export const MODULE_DE_TRANSPORT = 'garnison';
export const CHASSIS_DU_PASSAGER = 'escouade';

/**
 * Les quatre refus de l'embarquement, en français, repris MOT POUR MOT par la
 * ligne d'avis de l'écran.
 *
 * ⚠ ILS SONT ÉCRITS UNE FOIS, ICI. C'est la discipline des `problemesDe…` de
 * `sim/state.js` : les messages sont déjà en français lisible dans `sim/`, et
 * les reformuler côté écran en ferait une seconde formulation qui finirait par
 * dire autre chose que la règle.
 */
export const REFUS_DE_L_EMBARQUEMENT = {
  sansModule: 'cette pièce ne transporte personne',
  moduleNonAcquis: 'le module Garnison n\'est pas acquis',
  dejaCharge: 'ce véhicule transporte déjà une escouade',
  pasUneInfanterie: 'seule une infanterie embarque',
};

/**
 * La formation de départ : l'armée d'Offense, copiée pièce à pièce.
 *
 * ⚠ `actif: true` EST ÉCRIT, PAS OMIS. C'est l'arbitrage d'Ethan — « toutes les
 * unités repartent actives » —, et il doit se LIRE dans le code. Une omission
 * laisserait remonter le `actif: false` d'une sauvegarde d'avant ce lot, et
 * personne ne saurait dire si c'est voulu.
 *
 * ⚠ `embarqueDans` EST POSÉ À `null` SUR TOUTES LES PIÈCES, y compris celles qui
 * ne transporteront jamais rien. « Absent » et « null » diraient la même chose,
 * et c'est justement ce qu'on ne veut pas : un champ toujours présent se teste
 * d'une seule façon.
 *
 * @param {object} etat
 * @returns {Array<object>} la formation, alignée par indice sur `armee`
 */
export function formationDepuisLArmee(etat) {
  return baseCourante(etat).armee.map((piece) => ({
    ...structuredClone(piece),
    actif: true,
    embarqueDans: null,
  }));
}

/**
 * Les QUATRE champs que la formation possède, et qui sont retenus d'un raid à
 * l'autre. La liste est AUTORITATIVE : `resynchroniserLaFormation` la nomme en
 * creux — elle rend `niveau` et `degatsMilli` à l'armée et ne touche à rien
 * d'autre —, et `formationPourLaCible` la relit pour restaurer.
 *
 * ⚠ `niveau` ET `degatsMilli` N'EN SONT PAS, ET C'EST LE POINT. La santé d'une
 * pièce est une grandeur de l'ÉTAT, jamais de la copie de travail : elle se
 * relit dans `armee` à chaque ouverture. Une mémoire qui les porterait ferait
 * repartir au raid une unité réparée entre-temps avec ses anciens dégâts.
 */
export const CHAMPS_RETENUS = Object.freeze(['vague', 'colonne', 'actif', 'embarqueDans']);

/**
 * L'empreinte de l'armée : la suite ORDONNÉE de ses identifiants.
 *
 * ⚠⚠⚠ C'EST LA MOITIÉ DANGEREUSE DU POINT 1, ET ELLE EXISTE POUR UNE
 * DÉFAILLANCE SILENCIEUSE. La formation est alignée PAR INDICE sur
 * `baseCourante(etat).armee` — voir l'en-tête de ce fichier —, et `executerRaid`
 * apparie `resultat.attaquants` et `indices` POSITION PAR POSITION. Si le joueur
 * recompose son armée en Offense entre deux raids, une mémoire alignée par
 * indice devient FAUSSE : les dégâts du raid tomberaient sur la mauvaise unité,
 * et **rien ne lèverait**. L'empreinte permet de le détecter ; la règle est
 * alors de **JETER la mémoire**, jamais de la « réparer au mieux ».
 *
 * ⚠ LA SUITE EST ORDONNÉE, PAS UN ENSEMBLE. Permuter deux unités de châssis
 * différents dans `armee` ne change pas l'ensemble des identifiants et casse
 * pourtant l'alignement : c'est très exactement le décalage d'indice qu'on
 * cherche. `FR T2` monte ce cas-là et pas un changement de niveau.
 *
 * @param {object} etat
 * @returns {string}
 */
export function empreinteDeLArmee(etat) {
  return baseCourante(etat).armee.map((piece) => piece.id).join('|');
}

/**
 * Retient la formation pour CETTE cible. Un seul créneau, écrasé à chaque fois.
 *
 * ⚠⚠ UN SEUL CRÉNEAU, ET C'EST UNE DÉCISION DE FORME. Une table par cible
 * grandirait sans borne — il y a des milliers de sites sur la carte, et rien ne
 * les purgerait. « Quand on attaque la même cible » : si la cible diffère, la
 * formation repart d'Offense, et c'est tout ce qu'Ethan a demandé.
 *
 * ⚠ LA CIBLE EST UN COUPLE `{rangee, colonne}`, ET CE N'EST PAS UNE SECONDE
 * NOTION D'IDENTITÉ. C'est celle que tout le dépôt emploie — `siteDeLaCase`,
 * `ciblesAPortee`, `cibleCourante` de l'écran — et le §1.2 du brief interdit
 * justement d'en inventer une autre.
 *
 * ⚠⚠ ET LA BASE COURANTE EST RETENUE AVEC. Deux bases du joueur peuvent porter
 * des armées de MÊMES identifiants dans le MÊME ordre : l'empreinte ne les
 * distinguerait pas, et la formation de l'une serait appliquée à l'autre. Ce
 * n'est pas une corruption — l'alignement resterait valide —, mais c'est un
 * rangement que le joueur n'a pas fait sur cette base-là.
 *
 * @param {object} etat modifié en place
 * @param {{rangee: number, colonne: number}} cible
 * @param {Array<object>} formation
 * @returns {object} le même état
 */
export function retenirLaFormation(etat, cible, formation) {
  etat.formationRetenue = {
    base: etat.baseCourante,
    cible: { rangee: cible.rangee, colonne: cible.colonne },
    empreinte: empreinteDeLArmee(etat),
    pieces: formation.map((piece) => {
      const retenu = {};
      for (const champ of CHAMPS_RETENUS) retenu[champ] = piece[champ];
      return retenu;
    }),
  };
  return etat;
}

/**
 * La formation à ouvrir sur cette cible : la retenue si elle vaut encore, une
 * neuve sinon. **La SEULE porte de l'écran de raid.**
 *
 * ⚠⚠ QUATRE RAISONS DE JETER LA MÉMOIRE, ET AUCUNE NE SE « RÉPARE ». Pas de
 * mémoire ; une autre base ; une autre cible ; une armée recomposée. La
 * quatrième est la dangereuse — voir `empreinteDeLArmee`. La cinquième est une
 * CEINTURE : un compte de pièces qui ne correspond pas ne peut pas arriver si
 * l'empreinte correspond, et on la teste quand même, parce que ce qui suit
 * indexe la mémoire par la position de l'armée.
 *
 * ⚠ ELLE REPART TOUJOURS DE `formationDepuisLArmee`, MÊME QUAND ELLE RESTAURE.
 * C'est ce qui rend `niveau` et `degatsMilli` frais par construction : la
 * mémoire ne rend QUE ses quatre champs, et il n'y a pas de chemin où une santé
 * périmée puisse remonter.
 *
 * @param {object} etat
 * @param {{rangee: number, colonne: number}} cible
 * @returns {Array<object>} la formation, alignée par indice sur `armee`
 */
export function formationPourLaCible(etat, cible) {
  const fraiche = formationDepuisLArmee(etat);
  const memoire = etat.formationRetenue;
  if (memoire === null || memoire === undefined) return fraiche;
  if (memoire.base !== etat.baseCourante) return fraiche;
  if (memoire.cible.rangee !== cible.rangee || memoire.cible.colonne !== cible.colonne) {
    return fraiche;
  }
  if (memoire.empreinte !== empreinteDeLArmee(etat)) return fraiche;
  if (memoire.pieces.length !== fraiche.length) return fraiche;
  return fraiche.map((piece, i) => {
    const restaure = { ...piece };
    for (const champ of CHAMPS_RETENUS) restaure[champ] = memoire.pieces[i][champ];
    return restaure;
  });
}

/**
 * Resynchronise ce que la formation ne DÉCIDE pas : le niveau et les dégâts.
 *
 * ⚠⚠ ELLE EXISTE PARCE QUE L'ÉCRAN DE RAID RÉPARE, ET QUE RÉPARER ÉCRIT DANS
 * `etat.armee`. La formation est une copie de travail de la DISPOSITION — qui
 * part, dans quel ordre, dans quel véhicule — et rien de plus : la santé d'une
 * pièce reste une grandeur de l'état, et c'est bien elle qu'un raid doit
 * emporter. Sans cette remise à niveau, une unité réparée juste avant le départ
 * partirait avec les dégâts qu'elle avait à l'OUVERTURE de l'écran, et une
 * unité remontée au-dessus du plancher resterait à la maison. Aucun test ne
 * l'aurait dit : les deux chemins sont muets.
 *
 * ⚠ ELLE NE TOUCHE NI `vague`, NI `colonne`, NI `actif`, NI `embarqueDans` —
 * ce sont exactement les quatre champs que la formation possède, et les rendre
 * à l'armée annulerait le geste que le joueur vient de faire.
 *
 * @param {object} etat
 * @param {Array<object>} formation modifiée en place
 * @returns {Array<object>} la même formation
 */
export function resynchroniserLaFormation(etat, formation) {
  const armee = baseCourante(etat).armee;
  for (let i = 0; i < formation.length && i < armee.length; i += 1) {
    formation[i].niveau = armee[i].niveau;
    formation[i].degatsMilli = armee[i].degatsMilli;
  }
  return formation;
}

/**
 * Laisse une unité à la maison, ou la renvoie au raid — DANS LA FORMATION.
 *
 * ⚠⚠ ELLE REMPLACE `reglerActivite` SUR CET ÉCRAN, ET C'EST TOUT L'ARBITRAGE
 * D'ETHAN. Le drapeau n'écrit plus dans `etat.armee` : il vit dans la copie de
 * travail, donc il repart à `true` à la prochaine ouverture. `reglerActivite`
 * reste l'écrivain de l'ÉTAT, pour qui en a besoin ailleurs.
 *
 * ⚠ ELLE LÈVE SUR AUTRE CHOSE QU'UN BOOLÉEN, comme son homologue de
 * `sim/state.js` : un `undefined` glissé là mettrait la pièce dans un troisième
 * état, ni active ni retenue.
 *
 * @param {Array<object>} formation modifiée en place
 * @param {number} index
 * @param {boolean} actif
 * @returns {Array<object>} la même formation
 */
export function reglerActiviteEnFormation(formation, index, actif) {
  const piece = exigerPiece(formation, index, 'activité');
  if (typeof actif !== 'boolean') {
    throw new RangeError(`formation de raid : activité — « ${actif} » — booléen attendu`);
  }
  piece.actif = actif;
  return formation;
}

/** La pièce à cet indice, ou une levée — un indice hors liste est une faute de programme. */
function exigerPiece(formation, index, quoi) {
  const piece = formation[index];
  if (piece === undefined) {
    throw new RangeError(`formation de raid : ${quoi} — indice ${index} hors de la formation`);
  }
  return piece;
}

/** Cette pièce est-elle embarquée dans une autre ? */
export function estPassager(piece) {
  return piece.embarqueDans !== null && piece.embarqueDans !== undefined;
}

/**
 * Cette pièce peut-elle transporter, pour CE joueur-là ?
 *
 * ⚠ DEUX CONTRÔLES, ET IL FAUT LES DEUX — c'est le couple exact de
 * `reparerLaGarnison` : `nomDuModule` dit QUEL module la ligne porte,
 * `moduleEstAcquis` dit si le joueur l'a payé POUR CETTE LIGNE.
 *
 * @param {object} etat
 * @param {string} id identifiant d'unité
 * @returns {boolean}
 */
export function estPorteur(etat, id) {
  if (nomDuModule('offense', id) !== MODULE_DE_TRANSPORT) return false;
  return moduleEstAcquis(etat, 'offense', id);
}

/**
 * L'indice du passager d'un porteur, ou `null`.
 *
 * ⚠ UN SEUL PASSAGER PAR PORTEUR — Ethan, 08/09 : « une escouade par véhicule ».
 * La recherche s'arrête donc au premier, et `problemesDeLEmbarquement` refuse le
 * second par `dejaCharge` : c'est la même règle, dite en lecture et en écriture.
 *
 * @param {Array<object>} formation
 * @param {number} indexPorteur
 * @returns {number|null}
 */
export function passagerDe(formation, indexPorteur) {
  const trouve = formation.findIndex((piece) => piece.embarqueDans === indexPorteur);
  return trouve === -1 ? null : trouve;
}

/**
 * Ce qui empêche de déplacer cette pièce là, dans la formation. Liste vide =
 * déplacement légal.
 *
 * ⚠⚠ UN PASSAGER NE SE DÉPLACE PAS, ET LA GARDE EST ÉCRITE PLUTÔT QU'ESPÉRÉE.
 * On attendait que ses `vague` et `colonne` à `null` suffisent — ils ne
 * suffisent pas, MESURÉ : le candidat est `{ ...piece, ...position }`, et la
 * position ÉCRASE les deux `null`. `problemesDeLEffectif` rendait donc une liste
 * vide, `deplacerEnFormation` posait la pièce sur une case, et elle gardait son
 * `embarqueDans` : une pièce à la fois posée et embarquée, que
 * `composerLesVagues` monterait quand même derrière son porteur en ignorant sa
 * case. Une incohérence silencieuse, exactement celle que ce module existe pour
 * empêcher.
 *
 * ⚠ ELLE LÈVE, ELLE NE REFUSE PAS. L'écran route un passager vers le
 * DÉBARQUEMENT ou vers un autre véhicule, jamais ici : un appelant qui arrive
 * avec un passager s'est trompé de chemin, et c'est un fait de programme — la
 * même discipline que `problemesDuDebarquementEnFormation` sur une pièce qui
 * n'est embarquée nulle part.
 *
 * @param {Array<object>} formation
 * @param {number} index
 * @param {{vague: number, colonne: number}} position
 * @returns {Array<{code: string, message: string}>}
 */
export function problemesDuDeplacementEnFormation(formation, index, position) {
  const piece = exigerPiece(formation, index, 'déplacement');
  if (estPassager(piece)) {
    throw new RangeError(
      `formation de raid : déplacement — la pièce ${index} est embarquée, il faut la débarquer`,
    );
  }
  return problemesDeLEffectif(
    FORCE_DE_LA_FORMATION, formation, { ...piece, ...position }, index,
  );
}

/**
 * Déplace une pièce dans la formation. LÈVE sur un refus, comme
 * `deplacerEffectif` : un déplacement refusé est un fait de JEU que l'appelant
 * doit DEMANDER d'abord, et montrer au joueur.
 *
 * ⚠ LA CASE EST MODIFIÉE EN PLACE, JAMAIS PAR `splice` PUIS `push` — même
 * discipline que `deplacerEffectif`, et elle compte doublement ici :
 * l'alignement par indice sur `etat.armee` est ce qui apparie les dégâts du
 * raid.
 *
 * ⚠ ET LE PASSAGER SUIT, SANS UNE ÉCRITURE. Il n'a pas de case à lui : sa place
 * est celle de son porteur, et `composerLesVagues` la lui donne au montage.
 *
 * @param {Array<object>} formation modifiée en place
 * @param {number} index
 * @param {{vague: number, colonne: number}} position
 * @returns {Array<object>} la même formation
 */
export function deplacerEnFormation(formation, index, position) {
  const problemes = problemesDuDeplacementEnFormation(formation, index, position);
  if (problemes.length > 0) {
    throw new Error(
      'deplacerEnFormation : déplacement illégal — '
        + problemes.map((p) => p.message).join(' ; '),
    );
  }
  const piece = formation[index];
  piece.vague = position.vague;
  piece.colonne = position.colonne;
  return formation;
}

/**
 * Ce qui empêche d'échanger les positions de deux pièces de la formation.
 *
 * ⚠⚠ UNE PERMUTATION N'EST PAS DEUX DÉPLACEMENTS — même motif que
 * `problemesDeLaPermutationDEffectif` : enchaîner deux déplacements passerait
 * par un état intermédiaire où DEUX pièces occupent la même case, et la première
 * des deux validations le refuserait sur un geste parfaitement légal. On
 * construit donc l'état d'ARRIVÉE, une fois, et on le juge.
 *
 * ⚠ ELLE JUGE LES DEUX ARRIVÉES, DONC ELLE REFUSE EN ENTIER. Une demi-permutation
 * laisserait la formation dans un état que le montage du raid refuserait.
 *
 * ⚠ ET ELLE LÈVE SUR DEUX FOIS LE MÊME INDICE : une pièce n'a pas de raison de
 * se permuter avec elle-même, et l'écran route ce cas-là vers le DÉPLACEMENT.
 *
 * @param {Array<object>} formation
 * @param {number} indexA
 * @param {number} indexB
 * @returns {Array<{code: string, message: string}>}
 */
export function problemesDeLaPermutationEnFormation(formation, indexA, indexB) {
  const a = exigerPiece(formation, indexA, 'permutation');
  const b = exigerPiece(formation, indexB, 'permutation');
  if (indexA === indexB) {
    throw new RangeError(`formation de raid : permutation — deux fois l'indice ${indexA}`);
  }
  // ⚠ MÊME GARDE QUE LE DÉPLACEMENT, ET POUR LA MÊME MESURE : la position de
  // l'autre écraserait les deux `null` d'un passager. Un PORTEUR chargé, lui, se
  // permute librement — sa passagère n'a pas de case, elle suit sans une
  // écriture.
  for (const [i, piece] of [[indexA, a], [indexB, b]]) {
    if (estPassager(piece)) {
      throw new RangeError(
        `formation de raid : permutation — la pièce ${i} est embarquée`,
      );
    }
  }
  const apres = formation.map((piece, i) => {
    if (i === indexA) return { ...a, vague: b.vague, colonne: b.colonne };
    if (i === indexB) return { ...b, vague: a.vague, colonne: a.colonne };
    return piece;
  });
  const tous = [
    ...problemesDeLEffectif(FORCE_DE_LA_FORMATION, apres, apres[indexA], indexA),
    ...problemesDeLEffectif(FORCE_DE_LA_FORMATION, apres, apres[indexB], indexB),
  ];
  // Les deux arrivées peuvent produire mot pour mot le même refus ; la phrase
  // répétée n'apprend rien de plus que la première. Le dédoublonnage porte sur
  // le COUPLE code+message — même règle qu'en Offense.
  const vus = new Set();
  return tous.filter((p) => {
    const signature = `${p.code} ${p.message}`;
    if (vus.has(signature)) return false;
    vus.add(signature);
    return true;
  });
}

/**
 * Échange les positions de deux pièces. Gratuit, comme le déplacement : ce sont
 * les MÊMES pièces, aux mêmes niveaux, qui changent de case. Le budget ne bouge
 * pas d'un point, et `niveau` comme `degatsMilli` suivent leur pièce.
 *
 * @param {Array<object>} formation modifiée en place
 * @param {number} indexA
 * @param {number} indexB
 * @returns {Array<object>} la même formation
 */
export function permuterEnFormation(formation, indexA, indexB) {
  const problemes = problemesDeLaPermutationEnFormation(formation, indexA, indexB);
  if (problemes.length > 0) {
    throw new Error(
      'permuterEnFormation : permutation illégale — '
        + problemes.map((p) => p.message).join(' ; '),
    );
  }
  const a = formation[indexA];
  const b = formation[indexB];
  const vagueDeA = a.vague;
  const colonneDeA = a.colonne;
  a.vague = b.vague;
  a.colonne = b.colonne;
  b.vague = vagueDeA;
  b.colonne = colonneDeA;
  return formation;
}

/**
 * Les quatre sens d'une translation, et le pas de chacun.
 *
 * ⚠⚠ « HAUT » EST LA VAGUE QUI DÉCROÎT, ET CE N'EST PAS UNE CONVENTION LIBRE :
 * `peindreVagues` de `ui/raid.js` empile les vagues dans l'ordre rendu par
 * `vaguesDeLArmee`, donc la vague 1 est en HAUT de l'écran. Le sens qu'un doigt
 * lit et le sens que la donnée porte sont donc opposés en signe, et c'est cette
 * table — pas l'écran — qui les réconcilie une fois pour toutes.
 *
 * ⚠ ELLE EST DANS `sim/`, PAS DANS L'ÉCRAN. Un jour où l'ordre des vagues
 * changerait à l'affichage, c'est ici qu'on le corrige, et les deux flèches
 * verticales suivraient ensemble.
 */
export const SENS_DE_TRANSLATION = Object.freeze({
  gauche: Object.freeze({ vague: 0, colonne: -1 }),
  droite: Object.freeze({ vague: 0, colonne: 1 }),
  haut: Object.freeze({ vague: -1, colonne: 0 }),
  bas: Object.freeze({ vague: 1, colonne: 0 }),
});

/**
 * Ce qui empêche de décaler TOUTE la formation d'un cran dans ce sens.
 *
 * ⚠⚠⚠ ELLE JUGE LA FORMATION D'ARRIVÉE, JAMAIS UNE PIÈCE À LA FOIS — ET LA
 * DIFFÉRENCE A ÉTÉ MESURÉE AVANT D'ÊTRE ÉCRITE. `problemesDeLEffectif` compare
 * la pièce candidate à la LISTE qu'on lui donne : appelé pièce par pièce sur la
 * formation COURANTE, il refuse une translation parfaitement légale dès que deux
 * pièces se suivent. Mesuré sur deux Meutes en (1, 1) et (1, 2), décalées d'une
 * colonne vers la droite : la première rend **`superposition`**, la seconde rend
 * une liste vide. On construit donc l'ARRIVÉE une fois, et on la juge — c'est le
 * motif exact de `problemesDeLaPermutationEnFormation`, pour la même raison.
 *
 * ⚠⚠ ET LE REFUS EST EN BLOC. Si une seule pièce sortait de la grille ou tombait
 * sur une occupée, RIEN ne bouge : une formation déplacée à moitié est pire que
 * rien — le joueur ne saurait plus ce qu'il a composé, et il n'aurait aucun
 * geste pour revenir en arrière. C'est la même discipline que la permutation,
 * qui refuse ses deux arrivées ensemble.
 *
 * ⚠ LES PASSAGÈRES NE SE COMPTENT PAS, ET ELLES NE BOUGENT PAS. Une embarquée
 * n'a pas de case — `embarquerEnFormation` lui retire la sienne pour la libérer
 * — donc elle ne peut ni sortir de la grille ni entrer en collision, et elle
 * suit son porteur sans une écriture. Les inclure ferait refuser la translation
 * sur un `hors-grille` de `colonne null`, c'est-à-dire sur rien.
 *
 * ⚠ UNE FORMATION SANS UNE SEULE PIÈCE POSÉE SE REFUSE, ELLE NE RÉUSSIT PAS EN
 * SILENCE. Sans ce refus, la flèche répondrait « fait » à un geste qui n'a rien
 * déplacé, ce qui est exactement l'inverse de ce qu'on demande à un avis.
 *
 * @param {Array<object>} formation
 * @param {string} sens clé de `SENS_DE_TRANSLATION`
 * @returns {Array<{code: string, message: string}>}
 */
export function problemesDeLaTranslationEnFormation(formation, sens) {
  const pas = SENS_DE_TRANSLATION[sens];
  if (pas === undefined) {
    throw new RangeError(`formation de raid : translation — sens « ${sens} » inconnu`);
  }
  const posees = [];
  for (let i = 0; i < formation.length; i += 1) {
    if (!estPassager(formation[i])) posees.push(i);
  }
  if (posees.length === 0) {
    return [{ code: 'formation-vide', message: 'aucune unité posée à déplacer' }];
  }
  const apres = formation.map((piece) => (estPassager(piece) ? piece : {
    ...piece, vague: piece.vague + pas.vague, colonne: piece.colonne + pas.colonne,
  }));
  const tous = [];
  for (const i of posees) {
    tous.push(...problemesDeLEffectif(FORCE_DE_LA_FORMATION, apres, apres[i], i));
  }
  // Neuf pièces qui sortent du bord rendent neuf fois la même phrase ; la
  // répétition n'apprend rien de plus que la première. Le dédoublonnage porte
  // sur le COUPLE code+message, comme en permutation.
  const vus = new Set();
  return tous.filter((p) => {
    const signature = `${p.code}\u0000${p.message}`;
    if (vus.has(signature)) return false;
    vus.add(signature);
    return true;
  });
}

/**
 * Décale toute la formation d'un cran. LÈVE sur un refus, comme ses voisines :
 * l'appelant DEMANDE d'abord, et montre le refus au joueur.
 *
 * ⚠ LES CASES SONT MODIFIÉES EN PLACE, JAMAIS PAR UNE NOUVELLE LISTE — c'est
 * l'alignement par indice sur `baseCourante(etat).armee` qui apparie les dégâts
 * du raid, et ce module entier existe pour qu'il ne bouge pas.
 *
 * ⚠ ET LE PAS EST APPLIQUÉ APRÈS QUE TOUT A ÉTÉ JUGÉ. Le juger au fil de
 * l'écriture rendrait le refus dépendant de l'ordre des pièces.
 *
 * @param {Array<object>} formation modifiée en place
 * @param {string} sens clé de `SENS_DE_TRANSLATION`
 * @returns {Array<object>} la même formation
 */
export function translaterLaFormation(formation, sens) {
  const problemes = problemesDeLaTranslationEnFormation(formation, sens);
  if (problemes.length > 0) {
    throw new Error(
      'translaterLaFormation : translation illégale — '
        + problemes.map((p) => p.message).join(' ; '),
    );
  }
  const pas = SENS_DE_TRANSLATION[sens];
  for (const piece of formation) {
    if (estPassager(piece)) continue;
    piece.vague += pas.vague;
    piece.colonne += pas.colonne;
  }
  return formation;
}

/**
 * Ce qui empêche cette escouade d'embarquer dans ce véhicule.
 *
 * ⚠ LES DEUX PREMIERS REFUS SONT EN CHAÎNE, LES DEUX AUTRES S'ACCUMULENT. Une
 * pièce qui ne porte PAS le module Garnison ne peut pas l'avoir « non acquis » :
 * annoncer les deux enverrait le joueur acheter un module qui n'existe pas sur
 * cette ligne. « Déjà chargé » et « pas une infanterie » sont, eux, deux faits
 * indépendants, et le joueur doit lire les deux — c'est la doctrine de
 * `problemesDeLAchat`.
 *
 * @param {object} etat pour la branche de recherche
 * @param {Array<object>} formation
 * @param {number} indexPassager
 * @param {number} indexPorteur
 * @returns {Array<{code: string, message: string}>}
 */
export function problemesDeLEmbarquement(etat, formation, indexPassager, indexPorteur) {
  const passager = exigerPiece(formation, indexPassager, 'embarquement');
  const porteur = exigerPiece(formation, indexPorteur, 'embarquement');
  if (indexPassager === indexPorteur) {
    throw new RangeError(
      `formation de raid : embarquement — deux fois l'indice ${indexPassager}`,
    );
  }
  const problemes = [];
  if (nomDuModule('offense', porteur.id) !== MODULE_DE_TRANSPORT) {
    problemes.push({ code: 'sansModule', message: REFUS_DE_L_EMBARQUEMENT.sansModule });
  } else if (!moduleEstAcquis(etat, 'offense', porteur.id)) {
    problemes.push({ code: 'moduleNonAcquis', message: REFUS_DE_L_EMBARQUEMENT.moduleNonAcquis });
  }
  const occupant = passagerDe(formation, indexPorteur);
  if (occupant !== null && occupant !== indexPassager) {
    problemes.push({ code: 'dejaCharge', message: REFUS_DE_L_EMBARQUEMENT.dejaCharge });
  }
  if (UNITES[passager.id]?.chassis !== CHASSIS_DU_PASSAGER) {
    problemes.push({ code: 'pasUneInfanterie', message: REFUS_DE_L_EMBARQUEMENT.pasUneInfanterie });
  }
  return problemes;
}

/**
 * Fait embarquer une escouade dans un véhicule. LÈVE sur un refus.
 *
 * ⚠⚠ `vague: null, colonne: null` N'EST PAS UNE COMMODITÉ D'AFFICHAGE, C'EST CE
 * QUI REND LA SUPERPOSITION IMPOSSIBLE. Le test d'occupation de
 * `problemesDeLEffectif` compare `autre[f.axe] === axe` ; avec `null`, un
 * passager ne peut STRUCTURELLEMENT occuper aucune case, donc « elle libère sa
 * case » est vrai PAR CONSTRUCTION et non par une garde qu'on pourrait oublier.
 * Le même `null` fait refuser tout déplacement direct du passager.
 *
 * ⚠ ET IL RESTE DANS LA FORMATION, DONC DANS LE BUDGET. Ethan, 08/09 :
 * « l'escouade embarquée compte toujours au budget de points, et libère sa
 * case ». La retirer de la liste ferait sauter l'alignement par indice ET le
 * compteur de points, d'un seul geste.
 *
 * @param {object} etat
 * @param {Array<object>} formation modifiée en place
 * @param {number} indexPassager
 * @param {number} indexPorteur
 * @returns {Array<object>} la même formation
 */
export function embarquerEnFormation(etat, formation, indexPassager, indexPorteur) {
  const problemes = problemesDeLEmbarquement(etat, formation, indexPassager, indexPorteur);
  if (problemes.length > 0) {
    throw new Error(
      'embarquerEnFormation : embarquement illégal — '
        + problemes.map((p) => p.message).join(' ; '),
    );
  }
  const passager = formation[indexPassager];
  passager.embarqueDans = indexPorteur;
  passager.vague = null;
  passager.colonne = null;
  return formation;
}

/**
 * Ce qui empêche ce passager de débarquer sur cette case, en PRÉPARATION.
 *
 * ⚠ C'EST LE DÉBARQUEMENT DE L'ÉCRAN, PAS CELUI DU COMBAT. Celui du combat vit
 * dans `sim/combat.js` et se juge sur la grille de bataille ; celui-ci rend une
 * escouade à sa vague, avant que le raid parte.
 *
 * @param {Array<object>} formation
 * @param {number} index
 * @param {{vague: number, colonne: number}} position
 * @returns {Array<{code: string, message: string}>}
 */
export function problemesDuDebarquementEnFormation(formation, index, position) {
  const piece = exigerPiece(formation, index, 'débarquement');
  if (!estPassager(piece)) {
    throw new RangeError(
      `formation de raid : débarquement — la pièce ${index} n'est embarquée nulle part`,
    );
  }
  return problemesDeLEffectif(
    FORCE_DE_LA_FORMATION, formation, { ...piece, embarqueDans: null, ...position }, index,
  );
}

/**
 * Rend un passager à sa vague. LÈVE sur un refus.
 *
 * @param {Array<object>} formation modifiée en place
 * @param {number} index
 * @param {{vague: number, colonne: number}} position
 * @returns {Array<object>} la même formation
 */
export function debarquerEnFormation(formation, index, position) {
  const problemes = problemesDuDebarquementEnFormation(formation, index, position);
  if (problemes.length > 0) {
    throw new Error(
      'debarquerEnFormation : débarquement illégal — '
        + problemes.map((p) => p.message).join(' ; '),
    );
  }
  const piece = formation[index];
  piece.embarqueDans = null;
  piece.vague = position.vague;
  piece.colonne = position.colonne;
  return formation;
}
