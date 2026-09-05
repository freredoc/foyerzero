// Quel dessin porte une frontière de territoire — et rien d'autre.
//
// ⚠⚠ LA FRONTIÈRE ÉTAIT UN TRAIT, ELLE DEVIENT UN SPRITE — lot TERRITOIRE,
// 03/09. Ethan : « je t'ai envoyé aussi un zip avec des bordures de territoire
// pour la carte du monde ». `ui/monde.js` traçait les côtés exposés au
// `strokeStyle` depuis le 31/08 ; ce que les dessins apportent, c'est une
// frontière qui a un DEDANS et un DEHORS — bande sombre côté territoire, bande
// claire côté extérieur, repères tournés vers l'intérieur. Un trait de deux
// pixels ne dit pas de quel côté on est.
//
// ⚠⚠ CE MODULE NE DESSINE RIEN ET NE CONNAÎT NI LE DOM NI LE CANEVAS. Il répond
// à une question pure — « quels sprites pose-t-on sur cette case ? » — et rend
// des NOMS. C'est la même place que `render/embleme.js` tient pour les sites et
// `render/contour.js` pour l'anneau de mur d'une base : la géométrie d'un côté,
// le dessin de l'autre.
//
// ⚠ ET IL EST DANS `render/`, PAS DANS `sim/`. `sim/territoire.js` dit QUELLES
// cases sont à qui et quels côtés sont exposés — c'est du modèle, et l'écran de
// raid ne s'en sert pas. Choisir un sprite est du dessin.

import { JOUEUR, OUVRAGE } from '../sim/territoire.js';
import { celluleDuSprite } from './sprite.js';
import { ATLAS, COTE_SPRITE } from '../data/atlas.js';

/** La famille d'atlas où vivent ces dessins. Écrite une fois. */
export const FAMILLE = 'limite';

/**
 * La lettre de camp d'un occupant de territoire.
 *
 * ⚠ ELLE SE LIT DANS UNE TABLE, comme `CAMP_DU_PROPRIETAIRE` de
 * `render/contour.js`. Les occupants sont des NOMBRES ici (`sim/territoire.js`
 * les compte pour tenir une carte d'occupation dans un `Uint8Array`) : il n'y a
 * aucune initiale à en tirer, et un `['', 'j', 'o'][camp]` serait la même table
 * écrite de façon illisible.
 */
export const LETTRE_DU_CAMP = { [JOUEUR]: 'j', [OUVRAGE]: 'o' };

/**
 * L'ordre canonique des côtés — celui de la boussole, dans le sens horaire.
 *
 * ⚠⚠ C'EST LUI QUI NOMME LES FICHIERS, et `tools/limites.py` écrit la même
 * chaîne. Un ensemble de côtés exposés se lit toujours dans cet ordre-là :
 * `{est, nord}` s'écrit `ne` et jamais `en`. Un test confronte les noms rendus
 * ici au contenu RÉEL de l'atlas, dans les deux sens — c'est ce qui empêche les
 * deux tris de diverger sans que rien ne tombe.
 *
 * ⚠ NORD EST LA RANGÉE DÉCROISSANTE, comme partout sur l'écran Monde et comme
 * `bordsDuTerritoire` le pose déjà. Ce n'est PAS la boussole de
 * `sim/rendu-pose.js`, qui décrit la grille de COMBAT et son retournement.
 */
export const COTES = ['nord', 'est', 'sud', 'ouest'];

/** Les initiales, dans le même ordre — le suffixe d'un nom de sprite. */
const INITIALES = ['n', 'e', 's', 'o'];

/**
 * Les quatre coins d'une case, nommés par leurs deux côtés dans l'ordre de
 * `COTES` — le coin nord-est s'écrit `ne`, jamais `en`.
 *
 * ⚠ C'EST LA MÊME RÈGLE DE NOMMAGE QUE `coin`, ET C'EST VOULU : `coin_es` porte
 * l'angle SORTANT du coin sud-est, `pointe_es` son angle RENTRANT. Un seul jeu
 * de suffixes à retenir, et `tourner_cotes` de `tools/limites.py` fait tourner
 * les deux familles ensemble.
 */
export const COINS = ['ne', 'es', 'so', 'no'];

/**
 * Les sprites à poser sur une case, pour un camp et ses côtés exposés.
 *
 * ⚠⚠ QUATRE FORMES COUVRENT LES SEIZE CAS, ET LE SEIZIÈME EST LE VIDE. Une case
 * a quatre côtés, donc seize combinaisons d'exposition : aucune (rien à
 * dessiner), une (`trait`), deux adjacentes (`coin`), deux OPPOSÉES (deux
 * `trait`), trois (`u`), quatre (`carre`).
 *
 * ⚠⚠ LE CAS DES DEUX CÔTÉS OPPOSÉS N'A PAS DE DESSIN, ET IL N'EN A PAS BESOIN.
 * C'est un couloir d'une case de large ; deux `trait` face à face le rendent
 * exactement, et chacun porte déjà sa bande claire du bon côté. Lui dessiner une
 * cinquième forme aurait ajouté deux sprites par camp pour un résultat que la
 * composition donne au pixel près. C'est aussi pour ça que cette fonction rend
 * une LISTE et non un nom : le cas à deux pièces existe.
 *
 * ⚠⚠ ET LE SOMMET RENTRANT PORTE SA PROPRE PIÈCE DEPUIS LE 05/09, PARCE QU'IL
 * MANQUAIT. Ce commentaire affirmait le contraire — « les deux traits se
 * joignent au sommet sans qu'aucune pièce ne s'y pose » — et Ethan l'a vu à
 * l'écran : « quand tu dessines un territoire en U il manque les deux points ».
 * Les deux traits se joignent au POINT, pas en surface : une bande a deux pixels
 * logiques d'épaisseur, et à un sommet rentrant elle laisse un carré de 2 × 2
 * que ni l'une ni l'autre ne peint. **Reproduit avant d'écrire une ligne** en
 * rendant le U `XXX / X.X / X.X` : deux sommets, 0 pixel logique sur 4 à chacun.
 *
 * ⚠ LES SOMMETS SE LISENT DANS `cotes.rentrants`, ET ILS NE SE DÉDUISENT PAS DES
 * CÔTÉS. Un sommet rentrant demande de connaître la DIAGONALE, que les quatre
 * booléens de côté ne disent pas : une case entourée des quatre côtés par son
 * camp peut très bien toucher l'extérieur par un coin — mesuré, c'est même le
 * cas de 360 sommets sur 360 en jeu réel. C'est `sim/territoire.js` qui les
 * calcule, comme il calcule les côtés.
 *
 * ⚠ ET IL PEUT N'Y AVOIR QUE ÇA : une case sans aucun côté exposé rend une
 * liste d'une seule pointe, jamais une liste vide.
 *
 * @param {number} camp `JOUEUR` ou `OUVRAGE` de `sim/territoire.js`
 * @param {{nord: boolean, est: boolean, sud: boolean, ouest: boolean,
 *   rentrants?: {ne: boolean, es: boolean, so: boolean, no: boolean}}} cotes
 * @returns {string[]} noms de sprites de la famille `limite`, jamais `null`
 */
export function spritesDeLaLimite(camp, cotes) {
  const lettre = LETTRE_DU_CAMP[camp];
  if (lettre === undefined) {
    throw new RangeError(`limite : camp de territoire « ${camp} » inconnu`);
  }
  const exposes = COTES.map((c) => cotes[c] === true);
  const combien = exposes.filter(Boolean).length;
  // Le suffixe d'un sous-ensemble de côtés, dans l'ordre canonique.
  const suffixe = (garde) => INITIALES.filter((_, i) => garde(i)).join('');
  const tous = suffixe((i) => exposes[i]);

  // ⚠ LES POINTES SE POSENT DANS L'ORDRE DE `COINS`, ET ELLES VIENNENT APRÈS.
  // Elles n'occupent que le carré de coin, donc elles ne recouvrent aucune
  // bande ; l'ordre est fixé pour que deux images du même état soient
  // identiques à l'octet, pas parce qu'un dessin passe sur l'autre.
  const rentrants = cotes.rentrants ?? {};
  const pointes = COINS.filter((c) => rentrants[c] === true)
    .map((c) => `limite_${lettre}_pointe_${c}`);

  const bandes = (() => {
    if (combien === 0) return [];
    if (combien === 4) return [`limite_${lettre}_carre`];
    if (combien === 3) return [`limite_${lettre}_u_${tous}`];
    if (combien === 1) return [`limite_${lettre}_trait_${tous}`];
    // Deux côtés : adjacents si leurs indices ne sont pas à deux d'écart dans la
    // boussole — nord/sud et est/ouest sont les deux seules paires opposées.
    const opposes = (exposes[0] && exposes[2]) || (exposes[1] && exposes[3]);
    if (!opposes) return [`limite_${lettre}_coin_${tous}`];
    return INITIALES.filter((_, i) => exposes[i]).map((c) => `limite_${lettre}_trait_${c}`);
  })();
  return bandes.concat(pointes);
}

/**
 * Où découper et où poser chaque pièce de la frontière d'une case.
 *
 * ⚠⚠ LA GÉOMÉTRIE VIT ICI, PAS DANS L'ÉCRAN, ET C'EST UNE GARDE QUI L'A EXIGÉ.
 * `monde.test.js` refuse depuis le lot RETOURS-DU-31 que `ui/monde.js` appelle
 * `celluleDuSprite` : elle rend des INDICES — `colonne`, `rangee` — et jamais
 * des pixels, et l'écran avait lu `cellule.x`, `cellule.y`, `cellule.cote`, qui
 * valaient tous trois `undefined`. `drawImage` avec un rectangle source non fini
 * **ne dessine rien et ne lève pas** : la carte s'était ouverte sans un seul
 * emblème. La garde a fait tomber le premier jet de ce lot-ci, qui refaisait
 * exactement le calcul dans l'écran — elle a eu raison, et c'est le même remède.
 *
 * ⚠ ELLE REND UNE LISTE, comme `spritesDeLaLimite` : le cas des deux côtés
 * opposés pose deux pièces sur la même case.
 *
 * @param {number} camp
 * @param {{nord: boolean, est: boolean, sud: boolean, ouest: boolean}} cotes
 * @param {number} x Bord gauche de la case, en pixels
 * @param {number} y Bord haut de la case, en pixels
 * @param {number} taille Côté de la case à l'écran, en pixels
 * @returns {Array<{nom: string, sx: number, sy: number, sCote: number,
 *   x: number, y: number, cote: number}>}
 */
export function dessinerLimiteDUneCase(camp, cotes, x, y, taille) {
  // ⚠ LE CÔTÉ DE CELLULE EST CELUI DE L'INDEX, PAS UN CHAMP DE LA FAMILLE.
  // `tools/atlas.py` coud toutes les familles à `COTE_INDEX` et n'écrit ce
  // nombre qu'UNE fois, dans `COTE_SPRITE` : le lire par famille laisserait
  // croire qu'une famille pourrait avoir sa propre taille de cellule, ce que le
  // couseur refuse de face.
  const sCote = COTE_SPRITE;
  return spritesDeLaLimite(camp, cotes).map((nom) => {
    const cellule = celluleDuSprite(FAMILLE, nom);
    return {
      nom,
      sx: cellule.colonne * sCote,
      sy: cellule.rangee * sCote,
      sCote,
      // ⚠ ENTIERS, comme l'emblème et la grosse base : un `drawImage` à une
      // position fractionnaire rééchantillonne et rend le pixel art flou.
      x: Math.round(x),
      y: Math.round(y),
      cote: taille,
    };
  });
}
