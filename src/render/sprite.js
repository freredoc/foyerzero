// Où tombe un sprite dans son atlas — et rien d'autre.
//
// Le livrable est un HTML autonome : les sprites y entrent cousus en atlas,
// inlinés en `data:` par `tools/build.js`. Un élément carré porte donc l'atlas
// ENTIER en fond, agrandi et décalé pour que seule la cellule voulue tombe dans
// le cadre. Ce module calcule cet agrandissement et ce décalage, en pourcentages
// — jamais en pixels : la case de la grille est élastique (`--case-max`, et
// `margin-inline: auto` répartit le reste), donc un nombre de pixels serait
// juste sur un téléphone et faux sur le suivant.
//
// ⚠⚠ IL S'APPELLE `sprite.js`, PAS `atlas.js`, ET CE N'EST PAS NÉGOCIABLE.
// `src/data/atlas.js` porte déjà ce nom court. Le dépôt se met à jour depuis un
// téléphone, dont le sélecteur n'affiche que les noms courts : c'est exactement
// l'accident du 27/08, où le moteur de combat a été écrasé par la table de
// données du même nom court (CLAUDE.md §6, homonymes).
//
// ⚠ IL NE CONNAÎT NI LA GRILLE, NI LES BÂTIMENTS, NI LE JEU. Il traduit un rang
// dans une liste en deux chaînes CSS. Ce qui décide QUEL sprite va sur QUELLE
// case vit dans `src/ui/`, qui seul connaît l'état.
//
// ⚠ ET IL NE PORTE AUCUNE COORDONNÉE ÉCRITE. `src/data/atlas.js` est généré par
// `tools/atlas.py` et ne dit que les noms, dans l'ordre de couture, plus la
// géométrie de la grille : la cellule se DÉDUIT du rang. Écrire les paires de
// nombres dans l'index, ce serait deux calculs qui peuvent diverger — et la
// divergence se lirait comme un sprite qui dessine son voisin.

import { ATLAS } from '../data/atlas.js';

/**
 * La famille demandée existe-t-elle dans l'index ?
 *
 * ⚠ ON LÈVE, ON NE REND PAS UN FOND VIDE. Une cellule transparente est
 * exactement ce que personne ne remarque : l'écran s'ouvrirait, la case serait
 * nue, et rien ne dirait que l'atlas a été recousu sans ce sprite. Un sprite qui
 * manque doit se voir à la première ouverture de l'écran.
 *
 * @param {string} famille clé de `ATLAS`
 * @returns {{colonnes: number, rangees: number, noms: string[]}}
 */
function exigerFamille(famille) {
  const table = ATLAS[famille];
  if (!table) {
    throw new RangeError(
      `sprite : famille « ${famille} » absente de l'atlas — ` +
        `familles cousues : ${Object.keys(ATLAS).join(', ')}`,
    );
  }
  return table;
}

/**
 * Ce nom est-il cousu dans cet atlas ?
 *
 * ⚠⚠ C'EST UNE QUESTION, PAS UN ACCÈS, ET C'EST POUR ÇA QU'ELLE NE LÈVE PAS.
 * `celluleDuSprite` et `fondDuSprite` lèvent sur un nom absent, et gardent ce
 * comportement : un sprite qu'on croit poser et qui manque doit se voir à la
 * première ouverture de l'écran. Celle-ci sert à l'appelant qui a un CHOIX à
 * faire — poser la variante si elle existe, retomber sur la forme de base
 * sinon — et pour qui l'absence est une réponse, pas une faute.
 *
 * ⚠ ELLE EXISTE PARCE QUE L'ART EST INCOMPLET, ET DÉLIBÉRÉMENT. Six défenses du
 * joueur portent une tourelle, trois seulement ont des socles de liaison : la
 * planche `socles_j_tourelles_connexions_3x4.png` est un 3 × 4 — trois
 * tourelles, quatre états — et il n'en existe pas pour les trois artilleries.
 * L'écran LIT donc l'atlas au lieu de porter une liste de trois noms : le jour
 * où la planche arrive et où les outils tournent, les artilleries prennent leurs
 * liaisons SANS QU'UNE LIGNE DE CODE CHANGE. Une liste écrite à la main serait
 * la première à diverger, et il faudrait se souvenir de la modifier.
 *
 * ⚠ UNE FAMILLE INCONNUE REND `false`, elle ne lève pas non plus. La question
 * « ce sprite est-il là » a une réponse même quand la famille n'est pas cousue,
 * et c'est « non ».
 *
 * @param {string} famille clé de `ATLAS`
 * @param {string} nom nom du sprite, sans son `.png`
 * @returns {boolean}
 */
export function existeDansAtlas(famille, nom) {
  const table = ATLAS[famille];
  return table !== undefined && table.noms.includes(nom);
}

/**
 * La cellule d'un sprite, en colonne et rangée de son atlas.
 *
 * La couture remplit ligne par ligne, dans l'ordre de `noms` : le rang `i` tombe
 * donc en colonne `i % colonnes`, rangée `i / colonnes`. C'est la seule fois où
 * cette division est écrite dans `src/`.
 *
 * @param {string} famille clé de `ATLAS`
 * @param {string} nom nom du sprite, sans son `.png`
 * @returns {{colonne: number, rangee: number, colonnes: number, rangees: number}}
 */
export function celluleDuSprite(famille, nom) {
  const { colonnes, rangees, noms } = exigerFamille(famille);
  const rang = noms.indexOf(nom);
  if (rang < 0) {
    throw new RangeError(
      `sprite : « ${nom} » absent de la famille « ${famille} » — ` +
        `relancer tools/atlas.py si le sprite vient d'entrer au dépôt`,
    );
  }
  return { colonne: rang % colonnes, rangee: Math.floor(rang / colonnes), colonnes, rangees };
}

/**
 * Le couple `background-size` / `background-position` qui cadre UNE cellule
 * d'une grille, éventuellement dans un QUARTIER de l'élément.
 *
 * ---------------------------------------------------------------------------
 * La formule, écrite une seule fois pour tout le dépôt
 * ---------------------------------------------------------------------------
 *
 * L'élément est découpé en `divisions × divisions` quartiers égaux ; on veut
 * poser la cellule `(colonne, rangee)` dans le quartier `(sousColonne,
 * sousRangee)`. Une cellule occupe donc `1/divisions` de l'élément sur chaque
 * axe, ce qui fixe l'agrandissement : `background-size` vaut
 * `colonnes × 100 / divisions` pour cent de la largeur.
 *
 * Le décalage se dit en pourcentage, et un pourcentage de `background-position`
 * ne se lit pas comme un pourcentage de largeur : il aligne le point situé à
 * P % de l'IMAGE sur le point situé à P % du CADRE. Le décalage effectif vaut
 * donc `P/100 × (largeurCadre − largeurImage)`, soit
 * `P/100 × E × (1 − colonnes/divisions)`. Le vouloir égal à
 * `(sousColonne − colonne) × E / divisions` donne
 *
 *     P = 100 × (colonne − sousColonne) / (colonnes − divisions)
 *
 * et c'est cette formule-ci. À `divisions = 1` et `sousColonne = 0` elle rend
 * exactement `100 × colonne / (colonnes − 1)`, la formule d'avant : le cas
 * d'une cellule qui remplit l'élément entier n'est pas un cas particulier, il
 * est la valeur par défaut. Vérifiée par exécution, et un test la refait sur
 * plusieurs cellules plutôt que de la recopier.
 *
 * ⚠ `colonnes − divisions` VAUT ZÉRO QUAND LA GRILLE A EXACTEMENT AUTANT DE
 * COLONNES QUE DE QUARTIERS. L'image fait alors très précisément la largeur de
 * l'élément, si bien qu'AUCUN pourcentage ne la déplace : la cellule `c` tombe
 * dans le quartier `c`, et rien ne peut l'en faire bouger. On rend 0, qui est
 * la seule valeur possible — et juste seulement si `colonne === sousColonne`.
 * Aucune grille du dépôt n'est dans ce cas ; la garde s'écrit maintenant, pas
 * le jour où elle divisera par zéro en silence.
 *
 * @param {{colonne: number, rangee: number, colonnes: number, rangees: number,
 *   divisions?: number, sousColonne?: number, sousRangee?: number}} cellule
 * @returns {{taille: string, position: string}} deux valeurs CSS
 */
export function fondDeCellule({
  colonne, rangee, colonnes, rangees,
  divisions = 1, sousColonne = 0, sousRangee = 0,
}) {
  if (!Number.isInteger(divisions) || divisions < 1) {
    throw new RangeError(`sprite : divisions « ${divisions} » invalide`);
  }
  if (sousColonne < 0 || sousColonne >= divisions || sousRangee < 0 || sousRangee >= divisions) {
    throw new RangeError(
      `sprite : quartier (${sousColonne}, ${sousRangee}) hors d'un découpage en ${divisions}`,
    );
  }
  const part = (indice, total, sous) => (
    total === divisions ? 0 : ((indice - sous) * 100) / (total - divisions)
  );
  return {
    taille: `${(colonnes * 100) / divisions}% ${(rangees * 100) / divisions}%`,
    position: `${part(colonne, colonnes, sousColonne)}% ${part(rangee, rangees, sousRangee)}%`,
  };
}

/**
 * Le couple `background-size` / `background-position` qui cadre ce sprite.
 *
 * ⚠ IL NE PORTE PLUS LA FORMULE, IL LA DEMANDE. `fondDeCellule` la tient, pour
 * que la pose d'un sprite NOMMÉ et celle d'une cellule prise au rang — le sol
 * de la base, qui pioche dans l'atlas du monde et n'a pas de noms — soient le
 * même calcul. Deux écritures de la même géométrie auraient divergé au premier
 * ajustement, et la divergence se lirait comme un sprite qui dessine son voisin.
 *
 * @param {string} famille clé de `ATLAS`
 * @param {string} nom nom du sprite, sans son `.png`
 * @param {{divisions?: number, sousColonne?: number, sousRangee?: number}} [quartier]
 * @returns {{taille: string, position: string}} deux valeurs CSS
 */
export function fondDuSprite(famille, nom, quartier = {}) {
  return fondDeCellule({ ...celluleDuSprite(famille, nom), ...quartier });
}
