// Le transfert de ressources entre deux bases du joueur — lot TRANSFERT,
// 02/09/2026.
//
// ⚠⚠ IL EST INSTANTANÉ, ET C'EST CE QUI LE REND SIMPLE. Aucun champ persistant,
// aucun convoi en vol, `SAVE_VERSION` ne bouge pas : on débite ici, on crédite
// là, dans le même appel. Un transfert qui DURE aurait demandé un état, donc une
// migration, donc une équivalence des deux chemins de `rattraperJeu` à tenir —
// c'est trois lots de plus, et Ethan ne l'a pas demandé.
//
// ⚠⚠ LE TRANSFERT EST REFUSÉ S'IL FAIT DÉBORDER, ET C'EST L'EXACT INVERSE DU
// BUTIN. Les deux règles ont été arbitrées le même jour et se lisent ensemble :
// un butin qu'on RAPPORTE d'un raid a le droit de dépasser la capacité — c'est
// le fruit d'un combat, et le gel du surplus le rend tenable —, un transfert
// qu'on ORGANISE ne l'a pas. Sans quoi le plafond de stockage ne voudrait plus
// rien dire : il suffirait de faire tourner ses ressources entre deux bases.
//
// ⚠ IL REND DES PROBLÈMES CHIFFRÉS EN FRANÇAIS, comme `problemesDuDeplacement`,
// `problemesDeLaFondation` et `problemesDeLaPose`. L'écran les affiche tels
// quels ; les reformuler ailleurs ferait une seconde formulation qui finirait
// par dire autre chose que la règle.

import { TRANSFERT } from '../data/sites.js';
import { RESSOURCES, capacitesMilli } from './economie-base.js';
import { distanceCarreeCases } from './points-attaque.js';

/** Le millier qui sépare les unités des milli-unités. */
const MILLE = 1000;

/**
 * Les ressources qu'on a le droit de transférer.
 *
 * ⚠⚠ L'ÉLECTRICITÉ EN EST EXCLUE, ET LE FILTRE EST EXPLICITE PLUTÔT QUE MUET.
 * Arbitré par Ethan le 02/09. `RESSOURCES` en porte TROIS, et un filtre écrit
 * `.slice(0, 2)` ou `.filter((r) => r !== 'electricite')` sans un mot serait
 * « nettoyé » un jour par quelqu'un qui le prendrait pour une maladresse. La
 * liste est donc écrite, et un test la confronte à `RESSOURCES` : une quatrième
 * ressource ajoutée au jeu fait ROUGIR la suite au lieu d'être transférable
 * sans que personne l'ait décidé.
 *
 * ⚠ POURQUOI L'ÉLECTRICITÉ : elle ne se stocke pas comme les deux autres — elle
 * se PRODUIT et se consomme sur place. La faire voyager reviendrait à poser un
 * réseau que le jeu n'a pas.
 */
export const RESSOURCES_TRANSFERABLES = ['quartz', 'scorie'];

/** Celles que `RESSOURCES` porte et que le transfert refuse. */
export const RESSOURCES_INTERDITES = RESSOURCES.filter(
  (r) => !RESSOURCES_TRANSFERABLES.includes(r),
);

/**
 * Le nombre de cases entre deux bases — la racine carrée, ARRONDIE, en entiers.
 *
 * ⚠⚠⚠ AUCUN `Math.sqrt`, ET CE N'EST PAS UNE COQUETTERIE : C'EST UN ARRONDI
 * EXACT, PAS UNE APPROXIMATION. Un futur lot lira cette boucle et voudra la
 * « simplifier » en `Math.round(Math.sqrt(d))` — voici pourquoi il ne faut pas.
 * L'identité employée est :
 *
 *     round(√x) = n   ⟺   (2n − 1)² ≤ 4x < (2n + 1)²
 *
 * Elle ne fait intervenir que des entiers, donc elle ne peut pas se tromper
 * d'une unité près d'un demi — ce que `Math.sqrt` peut faire, sa mantisse étant
 * finie. **Vérifié sur les 19 881 couples de 0 à 140 dans les deux axes : zéro
 * désaccord avec `Math.round(Math.sqrt())`** — et c'est le test T5 qui refait la
 * mesure, sur TOUS les couples, plutôt que de la citer.
 *
 * ⚠⚠ LA BOUCLE EST BORNÉE EXPLICITEMENT, ET LA BORNE N'EST PAS DÉCORATIVE. Au
 * -delà de `porteeMaxCases` le transfert est refusé, donc la réponse exacte ne
 * sert plus à rien : on s'arrête. Sans cette borne, une distance absurde —
 * arrivée par une position corrompue — ferait tourner la boucle des milliards de
 * fois. C'est la borne qui rend le coût connu : cent tours au pire, mesurés à
 * 200 000 appels en 37 ms.
 *
 * ⚠ ELLE REND DONC `porteeMaxCases + 1` POUR TOUT CE QUI EST PLUS LOIN, et
 * l'appelant n'a pas à distinguer : c'est déjà « trop loin ».
 *
 * @param {{rangee: number, colonne: number}} a
 * @param {{rangee: number, colonne: number}} b
 * @returns {number} cases entières, ou `porteeMaxCases + 1` au-delà
 */
export function casesEntreDeuxBases(a, b) {
  const carre = distanceCarreeCases(a, b);
  const borne = TRANSFERT.porteeMaxCases + 1;
  let cases = 0;
  while (cases < borne && (2 * cases + 1) ** 2 <= 4 * carre) cases += 1;
  return cases;
}

/**
 * Ce qui ARRIVE vraiment, en milli, pour un envoi et une distance.
 *
 * ⚠⚠ ON MULTIPLIE D'ABORD, ON DIVISE ENSUITE. L'ordre inverse —
 * `(envoye / 100) × (100 − cases)` — perd tout ce qui est sous la centaine de
 * milli, donc écrase les petits envois : mille envois d'une unité n'arriveraient
 * pas au même total qu'un envoi de mille. C'est T14, et sa falsification est
 * exactement cette inversion.
 *
 * ⚠ ARRONDI VERS LE BAS, ET LA TAXE EST PERDUE. Elle ne va nulle part : ni à une
 * autre base, ni à un compteur. C'est un coût de transport, pas un prélèvement
 * qu'on retrouve quelque part — le rapport du lot le confirme.
 *
 * ⚠ À 99 CASES IL RESTE 1 %, ET CE N'EST PAS UN CAS DÉGÉNÉRÉ : c'est la borne du
 * refus, elle doit marcher. À 100 cases il resterait zéro, et c'est précisément
 * pourquoi 99 est la dernière distance permise.
 *
 * @param {number} envoyeMilli
 * @param {number} cases
 * @returns {number} milli reçus
 */
export function recuMilli(envoyeMilli, cases) {
  const restePct = 100 - cases * TRANSFERT.taxeParCasePct;
  if (restePct <= 0) return 0;
  return Math.floor((envoyeMilli * restePct) / 100);
}

/** La place qu'il reste dans une base, pour cette ressource, en milli. */
function placeLibreMilli(base, ressource) {
  const cap = capacitesMilli(base.disposition)[ressource] ?? 0;
  const stock = base.economie.ressources[ressource];
  // ⚠ LE PLAFOND EST `max(cap, stock)`, COMME PARTOUT DEPUIS LE 26/08. Une base
  // déjà au-dessus de sa capacité ne peut donc RIEN recevoir — la place vaut
  // zéro — et c'est cohérent, pas un cas particulier : son surplus est gelé, on
  // ne l'aggrave pas.
  const plafond = stock > cap ? stock : cap;
  return plafond - stock > 0 ? plafond - stock : 0;
}

/** Un entier de milli-unités, strictement positif. */
function estQuantiteValide(q) {
  return Number.isInteger(q) && q > 0;
}

/**
 * Ce qui empêche ce transfert — liste vide si rien.
 *
 * Les sept codes : `base-inconnue`, `meme-base`, `ressource-interdite`,
 * `quantite-nulle`, `trop-loin`, `stock-insuffisant`, `debordement`.
 *
 * ⚠ ON RASSEMBLE, ON NE S'ARRÊTE PAS AU PREMIER — sauf quand le reste n'est plus
 * calculable. Un joueur qui corrige une raison pour découvrir la suivante
 * recommence trois fois le même geste.
 *
 * ⚠⚠ `debordement` DIT COMBIEN IL FAUDRAIT DE PLACE EN PLUS, pas « impossible ».
 * Un refus qui ne chiffre rien envoie le joueur essayer au hasard.
 *
 * @param {object} etat
 * @param {number} source indice dans `etat.bases`
 * @param {number} destination indice dans `etat.bases`
 * @param {string} ressource
 * @param {number} quantiteMilli ce que la source ENVOIE, en milli
 * @returns {Array<{code: string, message: string}>}
 */
export function problemesDuTransfert(etat, source, destination, ressource, quantiteMilli) {
  const problemes = [];
  const nbBases = etat.bases.length;
  const indiceValide = (i) => Number.isInteger(i) && i >= 0 && i < nbBases;

  // ⚠ SANS DEUX BASES VALIDES, RIEN D'AUTRE N'EST CALCULABLE — ni la distance,
  // ni le stock, ni la place. On rend tout de suite.
  if (!indiceValide(source) || !indiceValide(destination)) {
    return [{
      code: 'base-inconnue',
      message: `Base inconnue : il n'y en a que ${nbBases}.`,
    }];
  }

  // ⚠⚠ `meme-base` N'EST PAS THÉORIQUE : l'écran propose la liste des bases, et
  // la COURANTE y est. Sans ce refus, envoyer à soi-même paierait la taxe de
  // zéro case — donc rien — mais ferait un geste qui ne fait rien, ce qui est
  // pire qu'un refus.
  if (source === destination) {
    problemes.push({ code: 'meme-base', message: 'La source et la destination sont la même base.' });
  }

  if (!RESSOURCES_TRANSFERABLES.includes(ressource)) {
    // ⚠ LE MESSAGE NOMME LA RESSOURCE ET DIT POURQUOI. « Ressource interdite »
    // tout court enverrait le joueur chercher un déblocage qui n'existe pas.
    const connue = RESSOURCES.includes(ressource);
    problemes.push({
      code: 'ressource-interdite',
      message: connue
        ? 'L\'électricité ne se transfère pas : elle se produit et se consomme sur place.'
        : `« ${ressource} » n'est pas une ressource du jeu.`,
    });
  }

  if (!estQuantiteValide(quantiteMilli)) {
    problemes.push({ code: 'quantite-nulle', message: 'Il n\'y a rien à envoyer.' });
  }

  const cases = casesEntreDeuxBases(etat.bases[source].position, etat.bases[destination].position);
  if (cases > TRANSFERT.porteeMaxCases) {
    problemes.push({
      code: 'trop-loin',
      message: `Ces deux bases sont à ${cases} cases, au-delà des ${TRANSFERT.porteeMaxCases} `
        + 'que le convoi peut franchir.',
    });
  }

  // ⚠ CE QUI SUIT A BESOIN D'UNE RESSOURCE RÉELLE ET D'UNE QUANTITÉ RÉELLE.
  // Les demander à une ressource inconnue lèverait ; on a déjà dit pourquoi.
  if (!RESSOURCES.includes(ressource) || !estQuantiteValide(quantiteMilli)) return problemes;

  const stock = etat.bases[source].economie.ressources[ressource];
  if (quantiteMilli > stock) {
    problemes.push({
      code: 'stock-insuffisant',
      message: `Cette base n'a que ${Math.floor(stock / MILLE)} de ${ressource}.`,
    });
  }

  // ⚠⚠ LE DÉBORDEMENT SE MESURE SUR LE REÇU, PAS SUR L'ENVOYÉ. C'est ce qui
  // arrive après la taxe qui doit tenir dans la destination : comparer l'envoyé
  // refuserait des transferts parfaitement valables — à 50 cases, un envoi de
  // 200 n'en fait arriver que 100, et une place de 100 suffit.
  if (source !== destination && cases <= TRANSFERT.porteeMaxCases) {
    const recu = recuMilli(quantiteMilli, cases);
    const place = placeLibreMilli(etat.bases[destination], ressource);
    if (recu > place) {
      const manqueMilli = recu - place;
      // Arrondi au SUPÉRIEUR : annoncer « il manque 0 » alors qu'il manque
      // 400 milli bloquerait le joueur sans rien lui dire. Même arbitrage que
      // le message « il manque … » de `sim/recherche.js`.
      const manque = Math.ceil(manqueMilli / MILLE);
      problemes.push({
        code: 'debordement',
        message: `La base de destination n'a pas la place : il lui manque ${manque} `
          + `de capacité de ${ressource}.`,
      });
    }
  }
  return problemes;
}

/**
 * Ce qu'un transfert donnerait — sans rien déplacer.
 *
 * ⚠ ELLE NE VÉRIFIE RIEN ET NE REFUSE RIEN : c'est `problemesDuTransfert` qui
 * décide. L'écran a besoin d'annoncer la distance, la taxe et le REÇU pendant
 * que le joueur règle sa quantité, donc avant même que le geste soit légal.
 *
 * @returns {{cases: number, taxePct: number, envoyeMilli: number, recuMilli: number,
 *   perduMilli: number}}
 */
export function apercuDuTransfert(etat, source, destination, quantiteMilli) {
  const cases = casesEntreDeuxBases(etat.bases[source].position, etat.bases[destination].position);
  const recu = recuMilli(quantiteMilli, cases);
  return {
    cases,
    taxePct: cases * TRANSFERT.taxeParCasePct,
    envoyeMilli: quantiteMilli,
    recuMilli: recu,
    // ⚠ CE QUI EST PERDU EST PERDU : la taxe ne va nulle part. Ce champ existe
    // pour que l'écran puisse l'ÉCRIRE, pas parce que quelqu'un l'encaisse.
    perduMilli: quantiteMilli - recu,
  };
}

/**
 * Transfère — ou lève.
 *
 * ⚠ ELLE LÈVE là où `problemesDuTransfert` rend une liste, et c'est la
 * distinction du dépôt : un transfert refusé est un fait de JEU qu'on montre au
 * joueur ; appeler celle-ci sans avoir regardé est un fait de PROGRAMME.
 *
 * ⚠⚠ RIEN NE BOUGE SI QUOI QUE CE SOIT EMPÊCHE, ET L'ORDRE DES DEUX ÉCRITURES
 * NE SUFFIT PAS À LE GARANTIR. La règle apprise au lot RÉSERVE — « le débit se
 * fait avant le versement, et rien ne bouge si l'un des deux est impossible » —
 * se tient ici en refusant AVANT d'écrire quoi que ce soit, jamais en défaisant
 * après coup. Les deux écritures qui suivent ne peuvent plus échouer : elles
 * sont deux additions sur des champs dont on vient de vérifier l'existence.
 *
 * ⚠ ET LA TAXE N'EST PAS UNE TROISIÈME ÉCRITURE. Elle est la DIFFÉRENCE entre
 * ce qu'on débite et ce qu'on crédite : elle disparaît, il n'y a rien à ranger.
 *
 * @param {object} etat modifié en place
 * @returns {{cases: number, taxePct: number, envoyeMilli: number,
 *   recuMilli: number, perduMilli: number}}
 */
export function transferer(etat, source, destination, ressource, quantiteMilli) {
  const problemes = problemesDuTransfert(etat, source, destination, ressource, quantiteMilli);
  if (problemes.length > 0) {
    throw new Error(
      `transfert impossible — ${problemes.map((p) => p.message).join(' ; ')}`,
    );
  }
  const apercu = apercuDuTransfert(etat, source, destination, quantiteMilli);
  etat.bases[source].economie.ressources[ressource] -= quantiteMilli;
  etat.bases[destination].economie.ressources[ressource] += apercu.recuMilli;
  return apercu;
}
