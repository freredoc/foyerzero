// L'ENCOMBREMENT D'UNE BASE — lot VOISINAGE-ET-MENACE, 08/09/2026.
//
// Ethan, 08/09 : « 8 cases autour peu importe le territoire, aucune base
// joueur/ouvrage ne doit être côte à côte sur les 9 cases ». Soit : le bloc
// 3 × 3 centré sur la case visée doit être vide de toute base, la sienne comme
// celle de l'Ouvrage, QUEL QUE SOIT le camp qui tient le terrain.
//
// ⚠⚠ CE MODULE EXISTE POUR QU'IL N'Y AIT QU'UNE ÉCRITURE, ET C'EST TOUT SON
// OBJET. Deux gestes posent une base sur une case : `problemesDeLaFondation`
// (`sim/fondation.js`) et `problemesDuDeplacement` (`sim/deplacement.js`). Les
// deux appellent la fonction ci-dessous. Écrire la boucle deux fois rendrait la
// règle inutile au premier oubli : le joueur fonderait loin, puis DÉPLACERAIT
// sa base juste à côté de l'Ouvrage au geste suivant, et rien ne l'arrêterait.
//
// ⚠⚠ TCHEBYCHEV, ET SURTOUT PAS UNE PORTÉE EUCLIDIENNE. Le lot EUCLIDE a fait
// de toute PORTÉE un disque ; ceci n'est pas une portée, c'est un ENCOMBREMENT,
// et « les 9 cases » nomme un carré. Les deux ne se ramènent pas l'une à
// l'autre, et il ne faut pas essayer : `d² ≤ 2` couvrirait bien les huit
// voisines aujourd'hui, mais dirait une géométrie qui n'est pas celle de la
// règle. Le rayon vit dans `ENCOMBREMENT_DES_BASES`, sa propre table.
//
// ⚠⚠ LE BLOC CONTIENT SON CENTRE, ET C'EST UN ÉCART DÉCLARÉ AU BRIEF. Celui-ci
// laissait entendre que seules les HUIT voisines étaient en jeu, la case exacte
// étant déjà refusée ailleurs. Elle l'est à la FONDATION ; elle ne l'était PAS
// au DÉPLACEMENT — mesuré : `problemesDuDeplacement` ne connaît que
// `hors-carte`, `sur-place`, `trop-loin` et `delai`, si bien que déplacer sa
// base SUR la case exacte d'une base de l'Ouvrage était permis. Et ce n'est pas
// un cas anodin : `siteDeLaCase` rend `null` sur toute case occupée par une
// base du joueur, donc le geste EFFAÇAIT la base ennemie de la carte. Ethan dit
// « les 9 cases » ; on prend les neuf, et le trou se ferme avec la règle.
//
// ⚠ CONSÉQUENCE ASSUMÉE, CÔTÉ FONDATION : sur la case EXACTE d'une base de
// l'Ouvrage, le joueur lit désormais DEUX refus. Ils répondent à deux questions
// différentes — « y a-t-il ici quelque chose que je ne peux pas écraser ? » et
// « le 3 × 3 est-il libre de bases ? » — et les deux sont vraies. Le dépôt
// rassemble les raisons plutôt que de s'arrêter à la première ; supprimer l'une
// des deux ferait perdre soit la crushabilité, soit la règle.
//
// ⚠ IL REND DES PROBLÈMES CHIFFRÉS EN FRANÇAIS, comme ses deux appelants.
// L'écran les affiche tels quels — `CLAUDE.md` §6 — et les reformuler ailleurs
// ferait une seconde formulation qui finirait par dire autre chose que la règle.

import { ENCOMBREMENT_DES_BASES } from '../data/sites.js';
import { estSurLaCarte } from './carte.js';
import { distanceTchebychev } from './points-attaque.js';
import { siteDeLaCase } from './site-de-la-case.js';

/** Le code que les deux appelants remontent à l'écran. */
export const CODE_VOISINAGE = 'voisinage';

/** La fin de chaque message : ce que le joueur doit faire pour que ça passe. */
const REMEDE = 'il faut au moins une case libre entre deux bases.';

/**
 * Ce qui, dans le voisinage immédiat, empêche de poser une base ici.
 *
 * ⚠⚠ CE QUI COMPTE COMME « BASE », ET CE QUI N'EN EST PAS. Les bases du JOUEUR
 * se lisent dans `etat.bases`, TOUTES — jamais la seule courante, même motif
 * que `distanceCarreeAuPlusProche` de `fondation.js`. Les bases de l'OUVRAGE se
 * lisent par `siteDeLaCase`, et **pas par `estBaseOuvrage` en direct** : c'est
 * la seule fonction qui sache déjà qu'une base RASÉE ne revient pas
 * (`casesRasees`) et qu'un satellite posé gagne sur le site dérivé. La rappeler
 * évite d'écrire une seconde idée de « ce qu'il y a sur cette case ».
 *
 * ⚠ NE COMPTENT PAS : les camps, les avant-postes, les satellites du joueur,
 * les RUINES et les POI. Une ruine n'est pas une base — `TYPES_ECRASABLES` et
 * `ruinesActives` le disent déjà chacun de leur côté —, et un camp est du butin
 * qui suit le joueur, pas un occupant du terrain.
 *
 * ⚠⚠ `baseExclue` EST LA BASE QUI BOUGE, ET C'EST LE SEUL ARGUMENT EN PLUS DE
 * LA CASE. Au déplacement, la case de DÉPART est libérée par le geste : la
 * compter ferait refuser tout saut d'une case, c'est-à-dire ferait dire à la
 * règle que la base s'encombre elle-même. Elle se compare par IDENTITÉ et non
 * par position — deux bases ne peuvent pas partager une case, mais l'identité
 * ne dépend pas de cette garantie-là.
 *
 * ⚠ ELLE REND AU PLUS UN PROBLÈME. Huit voisines fautives rendraient huit fois
 * la même phrase ; « on rassemble, on ne s'arrête pas au premier » vise des
 * raisons DIFFÉRENTES, pas chaque instance d'une même raison. L'ordre de
 * parcours est fixe — les bases du joueur dans l'ordre de `etat.bases`, puis
 * les neuf cases en balayage —, donc le message ne dépend d'aucun hasard.
 *
 * @param {object} etat
 * @param {{rangee: number, colonne: number}} cible
 * @param {object|null} [baseExclue] la base qui bouge, ignorée dans le compte
 * @returns {Array<{code: string, message: string}>} vide si rien
 */
export function problemesDuVoisinageDesBases(etat, cible, baseExclue = null) {
  if (cible === null || typeof cible !== 'object'
    || !Number.isInteger(cible.rangee) || !Number.isInteger(cible.colonne)) {
    throw new TypeError('voisinage : la cible n\'est pas une case entière');
  }
  const rayon = ENCOMBREMENT_DES_BASES.rayonCases;

  for (const base of etat.bases) {
    if (base === baseExclue) continue;
    if (distanceTchebychev(base.position, cible) <= rayon) {
      return [{ code: CODE_VOISINAGE, message: `Une de tes bases est trop près : ${REMEDE}` }];
    }
  }

  for (let r = cible.rangee - rayon; r <= cible.rangee + rayon; r += 1) {
    for (let c = cible.colonne - rayon; c <= cible.colonne + rayon; c += 1) {
      if (!estSurLaCarte(r, c)) continue;
      if (siteDeLaCase(etat, r, c)?.type !== 'base') continue;
      return [{
        code: CODE_VOISINAGE,
        message: `Une base de l'Ouvrage est trop près : ${REMEDE}`,
      }];
    }
  }
  return [];
}
