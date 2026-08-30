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
 * Le couple `background-size` / `background-position` qui cadre ce sprite.
 *
 * L'agrandissement est le compte de cellules : à 4 colonnes, l'atlas fait 400 %
 * de la largeur de la case, si bien qu'une cellule en fait exactement 100 %.
 *
 * Le décalage se dit en pourcentage, et un pourcentage de `background-position`
 * ne se lit pas comme un pourcentage de largeur : il aligne le point situé à
 * P % de l'IMAGE sur le point situé à P % du CADRE. Le décalage effectif vaut
 * donc `P/100 × (largeurCadre − largeurImage)`, soit `P/100 × côté × (1 −
 * colonnes)`. Le vouloir égal à `−colonne × côté` donne
 * `P = colonne × 100 / (colonnes − 1)`, et c'est cette formule-ci. Vérifiée par
 * exécution, et un test la refait sur trois cellules plutôt que de la recopier.
 *
 * ⚠ `colonnes − 1` VAUT ZÉRO DÈS QU'UNE FAMILLE TIENT SUR UNE COLONNE. Aucune
 * des deux familles cousues aujourd'hui n'est dans ce cas — 4 et 5 colonnes —
 * mais la garde s'écrit maintenant, pas le jour où elle divisera par zéro en
 * silence : un total de 1 n'a qu'une cellule, elle est déjà cadrée, et 0 % est
 * la seule réponse juste.
 *
 * @param {string} famille clé de `ATLAS`
 * @param {string} nom nom du sprite, sans son `.png`
 * @returns {{taille: string, position: string}} deux valeurs CSS
 */
export function fondDuSprite(famille, nom) {
  const { colonne, rangee, colonnes, rangees } = celluleDuSprite(famille, nom);
  const part = (indice, total) => (total > 1 ? (indice * 100) / (total - 1) : 0);
  return {
    taille: `${colonnes * 100}% ${rangees * 100}%`,
    position: `${part(colonne, colonnes)}% ${part(rangee, rangees)}%`,
  };
}
