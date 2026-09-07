// Comment un grand nombre s'écrit à l'écran — et rien d'autre.
//
// ⚠⚠ ETHAN, 07/09 : « dès qu'un nombre est supérieur à dix mille, il faudrait
// l'afficher avec trois chiffres et k pour mille, m pour million, g pour
// milliard, et t pour mille milliards ; soit un chiffre puis virgule puis deux
// chiffres, soit deux chiffres puis une virgule, soit trois chiffres. »
//
// ⚠⚠ IL EST DANS `render/` PARCE QUE DEUX COUCHES EN ONT BESOIN, ET QU'AUCUNE
// AUTRE MAISON NE MARCHE. `ui/chantier.js` formate les stocks et les coûts ;
// `sim/recherche.js` formate les points de recherche, et il ne peut pas importer
// d'`ui/`. `src/data/` est réservé aux valeurs de calibrage — « RIEN d'autre n'a
// le droit d'en porter » (§2). Reste `render/`, qui rend des primitives sans
// toucher au DOM : une chaîne d'affichage en est une, et `sim/poi.js` importe
// déjà d'ici.
//
// ⚠⚠ ET IL TRAVAILLE SUR LES CHIFFRES, PAS SUR UN NOMBRE. C'est ce qui lui
// permet de servir les deux appelants sans doublon : `ui/chantier.js` lui passe
// un `number` déjà tronqué, `sim/recherche.js` un `bigint` qui dépasse l'entier
// sûr — et le dépôt porte DÉJÀ deux fonctions de groupement pour cette raison
// exacte, avec un paragraphe qui explique qu'elles ne peuvent pas fusionner.
// Celle-ci ne divise jamais : elle coupe une chaîne de chiffres, donc elle ne
// perd rien, quelle que soit la taille.

/**
 * Le seuil à partir duquel un nombre passe en écriture compacte.
 *
 * ⚠ « SUPÉRIEUR À DIX MILLE » SE LIT ICI « À PARTIR DE DIX MILLE ». Une borne
 * doit tomber d'un côté ; 10 000 rend « 10,0k », qui est très exactement la
 * forme décrite — deux chiffres, une virgule, un chiffre.
 */
export const SEUIL_COMPACT = 10_000;

/**
 * Les quatre paliers, du plus petit au plus grand, avec le nombre de zéros.
 *
 * ⚠⚠ `M`, `G` ET `T` SONT EN CAPITALES, ET C'EST UNE CORRECTION ASSUMÉE DE LA
 * DICTÉE. Ethan les a nommés à l'oral — « k, m, g, t » — où la casse ne se dit
 * pas. En notation SI, `m` est le préfixe de MILLI : « 10,0m » se lirait « dix
 * millièmes » là où on veut dire « dix millions », soit un facteur d'un
 * milliard, dans le mauvais sens. `k` reste minuscule, comme en SI.
 * ⚠ C'est un seul caractère à changer si Ethan préfère l'oral à la norme.
 */
export const PALIERS = [
  { suffixe: 'k', zeros: 3 },
  { suffixe: 'M', zeros: 6 },
  { suffixe: 'G', zeros: 9 },
  { suffixe: 'T', zeros: 12 },
];

/** La virgule décimale du français. Le point serait de l'anglais. */
export const VIRGULE = ',';

/**
 * Trois chiffres significatifs, TRONQUÉS, sur une chaîne de chiffres.
 *
 * Rend `null` sous le seuil : c'est à l'appelant d'écrire la forme groupée, qui
 * n'est pas la même selon qu'il tient un `number` ou un `bigint`.
 *
 * ⚠⚠ TRONQUÉ, JAMAIS ARRONDI, ET C'EST LA RÈGLE DU DÉPÔT. `formaterUnites` la
 * porte déjà — « afficher 1 quand le stock vaut 999 milli ferait croire au
 * joueur qu'il peut dépenser une unité qu'il n'a pas » —, et `formaterPoints` de
 * `sim/recherche.js` aussi. Arrondir ferait dire « 1,00M » à 999 999 points,
 * c'est-à-dire promettre un achat que le moteur refuserait. Conséquence voulue :
 * 999 999 rend « 999k », qui reste à trois chiffres.
 *
 * ⚠ AU-DELÀ DE MILLE MILLIARDS, LA MANTISSE GROSSIT PLUTÔT QUE DE PRENDRE UN
 * CINQUIÈME PALIER. Ethan en a nommé quatre ; en inventer un de plus serait
 * décider à sa place. Mesuré : le prix le plus cher de `ARBRE_RECHERCHE` vaut
 * 2 500 000 000, soit « 2,50G » — on est loin du cas, et le jour où il arrivera
 * la sortie restera lisible (« 1 200T ») au lieu de lever.
 *
 * @param {string} chiffres la valeur ABSOLUE, en base dix, sans signe
 * @param {(n: string) => string} grouper comment l'appelant écrit les milliers
 * @returns {string|null} la forme compacte, ou `null` si le nombre est trop petit
 */
export function compacter(chiffres, grouper) {
  if (!/^[0-9]+$/.test(chiffres)) {
    throw new TypeError(`compacter : « ${chiffres} » n'est pas une suite de chiffres`);
  }
  // ⚠ LE SEUIL SE LIT SUR LA LONGUEUR, PAS SUR UNE COMPARAISON NUMÉRIQUE : un
  // `bigint` de quarante chiffres ne se compare pas à un `number` sans perte.
  const seuil = String(SEUIL_COMPACT).length;
  const utiles = chiffres.replace(/^0+(?=[0-9])/, '');
  if (utiles.length < seuil) return null;

  // Le palier est le plus grand qui laisse au moins un chiffre devant la
  // virgule ; au-delà du dernier, on reste sur lui et la mantisse grossit.
  const rang = Math.min(Math.floor((utiles.length - 1) / 3), PALIERS.length);
  const { suffixe, zeros } = PALIERS[rang - 1];

  const entier = utiles.slice(0, utiles.length - zeros);
  const reste = utiles.slice(utiles.length - zeros);
  const decimales = Math.max(0, 3 - entier.length);
  if (decimales === 0) return `${grouper(entier)}${suffixe}`;
  return `${entier}${VIRGULE}${reste.slice(0, decimales)}${suffixe}`;
}
