// L'achat des pièces et de leurs modules — la seule porte qui ouvre ce que le
// joueur peut poser.
//
// ⚠⚠ C'EST LA RECHERCHE, ET ELLE SEULE. Arbitré par Ethan le 30/08/2026 :
// « oui la recherche seule permet de poser des pièces », « non » au niveau seul,
// « non » aux deux. `apparition` redevient une table de l'OUVRAGE, lue par
// `sim/generateur.js` pour peupler ses sites, et par aucun chemin du joueur.
//
// ⚠ QUATRE LISTES, PAS DEUX ENSEMBLES. Le Chasseur s'achète deux fois — 300 000
// en offense, 135 000 en défense — et les deux achats sont indépendants. Et
// l'unité n'ouvre pas son module : ce sont deux lignes de prix distinctes.
//
// ⚠ LE MODULE SE RANGE SOUS L'IDENTIFIANT DE LA PIÈCE, PAS SOUS SON NOM. Deux
// pièces partagent souvent le même nom de module — `booster` est celui de la
// Carapace ET des Fouisseurs — et ce sont deux achats à deux prix. Ranger par
// nom de module offrirait le second dès l'achat du premier.
//
// ⚠ BIGINT DE BOUT EN BOUT, JAMAIS `Number`. Le barème de points dépasse
// `Number.MAX_SAFE_INTEGER` dès le niveau 39 : c'est écrit dans l'en-tête de
// `sim/combat.js`, `RECHERCHE_EN_CHAINE` de `sim/raid.js` le redit, et un test
// de `raid.test.js` l'asserte déjà. Une seule conversion en `Number` quelque
// part sur ce chemin, et le compteur du joueur se met à mentir en fin de partie.
//
// ⚠ CE MODULE NE TOUCHE NI AU DOM NI À L'ÉCRAN. Il rend des problèmes chiffrés
// en français ; l'écran les affiche tels quels, il ne les reformule pas.

import { ARBRE_RECHERCHE, gratuitesDe, BRANCHES } from '../data/recherche.js';
import { UNITES, DEFENSES } from '../data/combat.js';
import { MODULES, moduleEstCable } from '../data/modules.js';

/** Le millier qui sépare les points des milli-points. */
const MILLE = 1000n;

/**
 * Groupe les chiffres par trois, à la française, sur un BigInt.
 *
 * ⚠ CE N'EST PAS UN DOUBLON DE `formaterEntier`, ET ELLE NE PEUT PAS L'ÊTRE :
 * celle de `ui/chantier.js` prend un `number` et passe par `Math.trunc`, ce qui
 * perd des chiffres au-delà de l'entier sûr — précisément le domaine des points
 * de recherche. Et un module de `sim/` n'importe pas de `ui/`. Les deux règles
 * d'écriture doivent rester les mêmes : espace fine insécable, groupes de trois.
 *
 * @param {bigint} n
 * @returns {string}
 */
function grouper(n) {
  const signe = n < 0n ? '-' : '';
  const chiffres = (n < 0n ? -n : n).toString();
  let sortie = '';
  for (let i = 0; i < chiffres.length; i += 1) {
    if (i > 0 && (chiffres.length - i) % 3 === 0) sortie += ' ';
    sortie += chiffres[i];
  }
  return signe + sortie;
}

function exigerBranche(branche) {
  if (ARBRE_RECHERCHE[branche] === undefined) {
    throw new RangeError(`recherche : branche inconnue « ${branche} »`);
  }
}

function exigerQuoi(quoi) {
  if (quoi !== 'unite' && quoi !== 'module') {
    throw new RangeError(`recherche : « ${quoi} » n'est ni « unite » ni « module »`);
  }
}

function exigerEtat(etat) {
  if (etat.recherche === undefined) {
    throw new Error('recherche : champ « recherche » absent de l\'état');
  }
  for (const champ of ['acquises', 'modules']) {
    if (etat.recherche[champ] === undefined) {
      throw new Error(
        `recherche : champ « recherche.${champ} » absent — sauvegarde non migrée ?`,
      );
    }
  }
}

/**
 * Les deux blocs que ce lot ajoute à `etat.recherche` : les pièces acquises et
 * les modules acquis, par branche.
 *
 * ⚠ LES GRATUITES SONT POSÉES ICI, UNE FOIS, ET PAS TRAITÉES EN CAS PARTICULIER
 * À LA LECTURE. Un coût de zéro reste un achat ordinaire : le jour où l'on
 * voudra les faire payer, il n'y aura qu'un prix à changer, pas une exception à
 * retrouver dans `estAcquise`.
 *
 * ⚠ IL NE REND PAS `pointsMilli`. Ce champ appartient à `creerRecherche` de
 * `sim/raid.js` et ne change ni de nom ni de forme dans ce lot.
 *
 * @returns {{acquises: {offense: string[], defense: string[]},
 *            modules: {offense: string[], defense: string[]}}}
 */
export function creerAcquises() {
  return {
    // ⚠ TRIÉES, comme toute liste rangée par `acheter`. `gratuitesDe` rend
    // l'ordre de la table ; deux sauvegardes du même joueur doivent se comparer
    // au caractère près, quelle que soit la route par laquelle une pièce est
    // entrée. L'ordre d'AFFICHAGE, lui, se lit dans `ARBRE_RECHERCHE` (§5.2).
    acquises: {
      offense: gratuitesDe('offense').sort(),
      defense: gratuitesDe('defense').sort(),
    },
    modules: { offense: [], defense: [] },
  };
}

/**
 * Le nom du module de cette pièce, dans cette branche — ou `null`.
 *
 * ⚠ IL SE LIT DANS `data/combat.js`, PAS DANS L'ARBRE. L'arbre porte le PRIX du
 * module ; son nom vit avec la pièce qui le porte, et sa définition dans
 * `data/modules.js`. Le classeur de recherche nomme mal cinq modules — c'est le
 * classeur de CALIBRAGE qui fait foi, et il confirme le code.
 *
 * @param {string} branche
 * @param {string} id
 * @returns {string|null}
 */
export function nomDuModule(branche, id) {
  exigerBranche(branche);
  if (branche === 'offense') return UNITES[id]?.module ?? null;
  return DEFENSES[id]?.moduleJoueur ?? UNITES[id]?.defense?.module ?? null;
}

/**
 * Le coût, en MILLI-points, d'une ligne de l'arbre.
 *
 * ⚠ LE FACTEUR MILLE EST ICI ET NULLE PART AILLEURS. `ARBRE_RECHERCHE` est en
 * points, `etat.recherche.pointsMilli` en milli-points : une comparaison qui
 * oublie le ×1000 achète mille fois trop tôt, et rien à l'écran ne le dirait.
 *
 * @param {string} branche
 * @param {string} id
 * @param {'unite'|'module'} quoi
 * @returns {bigint} milli-points
 */
export function coutMilli(branche, id, quoi) {
  exigerBranche(branche);
  exigerQuoi(quoi);
  const ligne = ARBRE_RECHERCHE[branche][id];
  if (ligne === undefined) {
    throw new RangeError(`recherche : pièce inconnue « ${id} » en ${branche}`);
  }
  return BigInt(ligne[quoi]) * MILLE;
}

/** Cette pièce est-elle acquise dans cette branche ? */
export function estAcquise(etat, branche, id) {
  exigerBranche(branche);
  exigerEtat(etat);
  return etat.recherche.acquises[branche].includes(id);
}

/** Le module de cette pièce est-il acquis dans cette branche ? */
export function moduleEstAcquis(etat, branche, id) {
  exigerBranche(branche);
  exigerEtat(etat);
  return etat.recherche.modules[branche].includes(id);
}

/** La liste des pièces acquises d'une branche — une COPIE, jamais la liste vive. */
export function acquisesDe(etat, branche) {
  exigerBranche(branche);
  exigerEtat(etat);
  return [...etat.recherche.acquises[branche]];
}

/**
 * Les NOMS de modules que le joueur a achetés, toutes branches confondues.
 *
 * C'est ce qui remplit `montage.modulesDebloques.joueur` dans `sim/raid.js`.
 *
 * ⚠ NE PAS CONFONDRE AVEC `modulesDebloques.ouvrage`, qui majore les points de
 * recherche de 20 % et appartient au camp d'en face. Les confondre ferait payer
 * au joueur les modules de l'Ouvrage.
 *
 * ⚠ L'UNION DES DEUX BRANCHES EST VOULUE, et elle est sans danger aujourd'hui :
 * le seul module câblé, l'Écraseur, n'existe qu'en offense (Fendeur et Broyeur)
 * — en défense le Broyeur porte `pvPlusVingt`. Un nom venu de la branche défense
 * n'a donc aucun lecteur. Le jour où un module câblé existera des deux côtés, il
 * faudra choisir la branche selon le camp du montage.
 *
 * @param {object} etat
 * @returns {string[]} noms de modules, triés, sans doublon
 */
export function modulesDebloquesDuJoueur(etat) {
  exigerEtat(etat);
  const noms = new Set();
  for (const branche of BRANCHES) {
    for (const id of etat.recherche.modules[branche]) {
      const nom = nomDuModule(branche, id);
      if (nom !== null) noms.add(nom);
    }
  }
  return [...noms].sort();
}

/**
 * Pourquoi cet achat ne passe pas — liste vide s'il passe.
 *
 * ⚠ ELLE ACCUMULE, elle ne s'arrête pas au premier refus, et c'est la doctrine
 * de `problemesDeLAmelioration` : « le joueur doit pouvoir lire les DEUX raisons
 * d'un refus, pas seulement la première ». L'ordre est celui de l'utilité :
 * `dejaAcquise`, `sansModule`, `uniteNonAcquise`, `effetNonCable`,
 * `pointsInsuffisants`.
 *
 * ⚠ UNE BRANCHE OU UN `quoi` INCONNU LÈVE, il ne rend pas un refus. Ce sont des
 * fautes de PROGRAMME : les rendre sous forme de message les afficherait au
 * joueur comme une règle de jeu. Une PIÈCE inconnue, elle, rend `inconnue` —
 * une sauvegarde trafiquée ou un identifiant retiré des données peut la
 * produire sans qu'aucun code ne soit fautif.
 *
 * @param {object} etat
 * @param {string} branche
 * @param {string} id
 * @param {'unite'|'module'} quoi
 * @returns {{code: string, message: string}[]}
 */
export function problemesDeLAchat(etat, branche, id, quoi) {
  exigerBranche(branche);
  exigerQuoi(quoi);
  exigerEtat(etat);

  if (ARBRE_RECHERCHE[branche][id] === undefined) {
    // Rien d'autre n'est calculable : ni prix, ni module, ni possession.
    return [{ code: 'inconnue', message: `« ${id} » n'existe pas en ${branche}` }];
  }

  const problemes = [];
  const deja = quoi === 'unite' ? estAcquise(etat, branche, id) : moduleEstAcquis(etat, branche, id);
  if (deja) problemes.push({ code: 'dejaAcquise', message: 'déjà acquis' });

  if (quoi === 'module') {
    const nom = nomDuModule(branche, id);
    if (nom === null) {
      problemes.push({ code: 'sansModule', message: 'cette pièce n\'a pas de module' });
    }
    if (!estAcquise(etat, branche, id)) {
      problemes.push({
        code: 'uniteNonAcquise',
        message: 'la pièce doit être débloquée avant son module',
      });
    }
    if (nom !== null && !moduleEstCable(nom)) {
      problemes.push({
        code: 'effetNonCable',
        message: `${MODULES[nom].libelle} n'a pas encore d'effet en jeu`,
      });
    }
  }

  const du = coutMilli(branche, id, quoi);
  const ai = BigInt(etat.recherche.pointsMilli);
  if (du > ai) {
    // ⚠ ARRONDI AU POINT SUPÉRIEUR. Le manque est en milli-points ; annoncer
    // « il manque 0 point » alors qu'il en manque 400 milli serait un mensonge
    // qui bloque le joueur sans rien lui dire. Même arbitrage que `LIBELLE_MANQUE`.
    const manqueMilli = du - ai;
    const manque = (manqueMilli + MILLE - 1n) / MILLE;
    problemes.push({
      code: 'pointsInsuffisants',
      message: `il manque ${grouper(manque)} point${manque > 1n ? 's' : ''}`,
    });
  }
  return problemes;
}

/**
 * Achète, débite, range — ou lève.
 *
 * ⚠ LE CHEMIN EST : problèmes → si vide, agir ; sinon, toast. Ne jamais appeler
 * `acheter` sans `problemesDeLAchat` d'abord : une exception non attrapée fige
 * l'écran. Même consigne qu'au lot ÉCRAN-ACTIONS.
 *
 * ⚠ LE DÉBIT ET LE RANGEMENT SONT INDISSOCIABLES. Si l'un passait sans l'autre,
 * le joueur paierait sans recevoir, ou recevrait sans payer — et une sauvegarde
 * garderait la faute.
 *
 * @param {object} etat modifié en place
 * @param {string} branche
 * @param {string} id
 * @param {'unite'|'module'} quoi
 * @returns {object} le même état
 */
export function acheter(etat, branche, id, quoi) {
  const problemes = problemesDeLAchat(etat, branche, id, quoi);
  if (problemes.length > 0) {
    throw new Error(
      `recherche : achat impossible — ${problemes.map((p) => p.message).join(' ; ')}`,
    );
  }
  const reste = BigInt(etat.recherche.pointsMilli) - coutMilli(branche, id, quoi);
  etat.recherche.pointsMilli = reste.toString();
  const liste = quoi === 'unite' ? etat.recherche.acquises[branche] : etat.recherche.modules[branche];
  liste.push(id);
  // Triées et sans doublon : `problemesDeLAchat` a déjà refusé le doublon, le
  // tri rend la sauvegarde comparable d'une partie à l'autre.
  liste.sort();
  return etat;
}
