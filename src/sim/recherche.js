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

import {
  ARBRE_RECHERCHE, gratuitesDe, BRANCHES, SPECIAL, NOEUD_BASE_SUPPLEMENTAIRE,
} from '../data/recherche.js';
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

/**
 * Des milli-points en points ENTIERS groupés — ce que l'en-tête de l'écran
 * Recherche affiche, et ce que les prix de l'arbre emploient.
 *
 * ⚠ ELLE TRONQUE, ELLE N'ARRONDIT PAS. Afficher « 300 000 » alors qu'il en
 * manque 400 milli laisserait le joueur toucher un bouton qui refuse : le
 * compteur doit dire ce qui est DÉPENSABLE, jamais un point de plus. C'est
 * l'arbitrage inverse de celui du message « il manque … », qui arrondit au
 * point SUPÉRIEUR pour la même raison — les deux vont dans le sens du refus.
 *
 * @param {bigint} pointsMilli
 * @returns {string}
 */
export function formaterPoints(pointsMilli) {
  return grouper(pointsMilli / MILLE);
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
  for (const champ of ['acquises', 'modules', 'basesAutorisees']) {
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
 * ⚠⚠ `basesAutorisees` ENTRE ICI AU LOT BASES-1, ET IL VAUT UN. C'est le nombre
 * de bases que le joueur a le DROIT de tenir, pas le nombre qu'il tient : les
 * deux se séparent dès qu'il achète son rang sans avoir encore choisi sa case.
 * Il vit dans `recherche` parce qu'il est ACHETÉ — le mettre à la racine de
 * l'état en ferait une propriété de la partie plutôt que du progrès du joueur.
 *
 * @returns {{acquises: {offense: string[], defense: string[]},
 *            modules: {offense: string[], defense: string[]},
 *            basesAutorisees: number}}
 */
export function creerAcquises() {
  return {
    basesAutorisees: 1,
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
 * Les NOMS de modules que le joueur a achetés, **branche par branche**.
 *
 * C'est ce qui remplit `montage.modulesDebloques.joueur` dans `sim/raid.js`.
 *
 * ⚠ NE PAS CONFONDRE AVEC `modulesDebloques.ouvrage`, qui majore les points de
 * recherche de 20 % et appartient au camp d'en face. Les confondre ferait payer
 * au joueur les modules de l'Ouvrage.
 *
 * ⚠ PLUS D'UNION DEPUIS LE LOT MODULES-E. Elle aplatissait les deux branches en
 * un seul tableau, et **quatre noms existent des deux côtés** de l'arbre —
 * `flashbang`, `tirDeBarrage`, `emp`, `garnison`. Acheter le Tir de barrage à
 * l'assaut l'offrait donc aux Perceurs de la garnison, dont la ligne de défense
 * n'est même pas en vente. Un `Set` par branche, et `moduleActif` choisit celle
 * du camp de l'entité.
 *
 * @param {object} etat
 * @returns {{offense: string[], defense: string[]}} noms triés, sans doublon
 */
export function modulesDebloquesDuJoueur(etat) {
  exigerEtat(etat);
  const parBranche = {};
  for (const branche of BRANCHES) {
    const noms = new Set();
    for (const id of etat.recherche.modules[branche]) {
      const nom = nomDuModule(branche, id);
      if (nom !== null) noms.add(nom);
    }
    parBranche[branche] = [...noms].sort();
  }
  return parBranche;
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
/** Le nom de la branche tel qu'on l'écrit au joueur — la clé n'a pas d'accent. */
const MOT_DE_LA_BRANCHE = { offense: 'offense', defense: 'défense' };

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
    if (nom !== null && !moduleEstCable(nom, branche)) {
      // ⚠ LE MESSAGE DIT LA BRANCHE QUAND L'AUTRE EST CÂBLÉE. « Effet à venir »
      // sur la ligne défense pendant que la ligne offense du même module
      // s'achète serait juste et déroutant : le joueur croirait à une attente,
      // alors que ce module n'aura jamais d'effet de ce côté-là. Le mot vient
      // du MOTEUR, jamais de l'écran — `ui/recherche.js` affiche ce message tel
      // quel, sous la ligne.
      // ⚠ LE MOT AFFICHÉ, PAS LA CLÉ : `branche` vaut `defense`, sans accent, et
      // ce message part tel quel sous la ligne de l'écran.
      const ailleurs = BRANCHES.some((b) => b !== branche && moduleEstCable(nom, b));
      problemes.push({
        code: 'effetNonCable',
        message: ailleurs
          ? `${MODULES[nom].libelle} n'a pas d'effet en ${MOT_DE_LA_BRANCHE[branche]}`
          : `${MODULES[nom].libelle} n'a pas encore d'effet en jeu`,
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

// ---------------------------------------------------------------------------
// Le nœud répétable — le droit de fonder une base de plus
// ---------------------------------------------------------------------------

/**
 * Le rang que le PROCHAIN achat ouvrirait — 2 pour la deuxième base, et ainsi
 * de suite.
 *
 * ⚠⚠ IL SE COMPTE SUR CE QUI EST ACHETÉ, PAS SUR CE QUI EST FONDÉ. Le joueur
 * peut payer son droit et attendre pour choisir sa case ; compter les bases
 * POSÉES lui referait payer le prix du rang 2 une seconde fois, et le rang 3 ne
 * serait jamais atteint tant qu'il n'aurait pas fondé.
 *
 * @param {object} etat
 * @returns {number}
 */
export function rangDeLaBaseSuivante(etat) {
  exigerEtat(etat);
  return etat.recherche.basesAutorisees + 1;
}

/**
 * Le prix, en MILLI-points, du rang que le prochain achat ouvrirait.
 *
 * ⚠⚠ EN ENTIERS, ×5 PUIS ÷2, JAMAIS ×2,5. Le facteur vit dans `SPECIAL`, sous
 * la forme d'une FRACTION, et c'est ce qui rend le prix exact : `2,5 ** 8`
 * calculé en flottant puis converti en `BigInt` se met à mentir bien avant que
 * la chaîne — qui est OUVERTE — n'y arrive. Ici tout reste entier.
 *
 * ⚠ L'EXACTITUDE A UNE BORNE, ET ELLE EST ÉCRITE. Le prix de départ vaut
 * 2 000 000 000 milli, soit 2¹⁰ × 5⁹ : la division par 2 est donc exacte
 * jusqu'au dixième rachat, c'est-à-dire jusqu'au RANG 12. Au-delà, on arrondit
 * au milli-point SUPÉRIEUR — dans le sens du refus, comme partout ici : mieux
 * vaut faire payer un milli-point de trop que d'en offrir un. Le rang 12
 * coûterait déjà 4,8 × 10⁸ points, soit deux cent quarante fois le rang 2.
 *
 * @param {object} etat
 * @returns {bigint} milli-points
 */
export function coutDeLaBaseSuivanteMilli(etat) {
  const ligne = SPECIAL[NOEUD_BASE_SUPPLEMENTAIRE];
  const rachats = BigInt(rangDeLaBaseSuivante(etat) - ligne.premierRang);
  if (rachats < 0n) {
    throw new RangeError(`recherche : rang ${rangDeLaBaseSuivante(etat)} sous le premier rang`);
  }
  const numerateur = BigInt(ligne.cout) * MILLE * BigInt(ligne.facteurNumerateur) ** rachats;
  const denominateur = BigInt(ligne.facteurDenominateur) ** rachats;
  // Division au supérieur : `(a + b - 1) / b` sur des entiers positifs.
  return (numerateur + denominateur - 1n) / denominateur;
}

/**
 * Les refus de l'achat du droit de fonder — une LISTE, comme partout ici.
 *
 * ⚠ ELLE NE REGARDE QUE LES POINTS. Il n'y a rien d'autre à refuser : le nœud
 * est répétable et sans prérequis, et c'est `problemesDeLaFondation` qui dit
 * ensuite OÙ la base peut se poser. Mélanger les deux ferait refuser un ACHAT
 * pour une raison de CARTE.
 *
 * @param {object} etat
 * @returns {Array<{code: string, message: string}>}
 */
export function problemesDeLAchatDUneBase(etat) {
  exigerEtat(etat);
  const du = coutDeLaBaseSuivanteMilli(etat);
  const ai = BigInt(etat.recherche.pointsMilli);
  if (du <= ai) return [];
  const manque = (du - ai + MILLE - 1n) / MILLE;
  return [{
    code: 'pointsInsuffisants',
    message: `il manque ${grouper(manque)} point${manque > 1n ? 's' : ''}`,
  }];
}

/**
 * Achète le droit de fonder une base de plus : débite, et ouvre le rang.
 *
 * ⚠ LE DÉBIT ET L'OUVERTURE SONT INDISSOCIABLES, comme dans `acheter`. Si l'un
 * passait sans l'autre, le joueur paierait sans recevoir, et une sauvegarde
 * garderait la faute.
 *
 * ⚠ IL NE POSE AUCUNE BASE. Acheter donne le DROIT ; fonder est un geste de
 * carte, qui passe par `problemesDeLaFondation` et `fonderUneBase`. Les
 * confondre obligerait l'écran Recherche à connaître une case.
 *
 * @param {object} etat modifié en place
 * @returns {object} le même état
 */
export function acheterUneBaseDePlus(etat) {
  const problemes = problemesDeLAchatDUneBase(etat);
  if (problemes.length > 0) {
    throw new Error(
      `recherche : achat impossible — ${problemes.map((p) => p.message).join(' ; ')}`,
    );
  }
  const reste = BigInt(etat.recherche.pointsMilli) - coutDeLaBaseSuivanteMilli(etat);
  etat.recherche.pointsMilli = reste.toString();
  etat.recherche.basesAutorisees += 1;
  return etat;
}
