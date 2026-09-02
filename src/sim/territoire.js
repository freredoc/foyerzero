// Qui tient quoi sur la carte — les zones d'influence, et leurs bordures.
//
// ⚠⚠ RIEN N'EST INVENTÉ ICI : LA RÈGLE EST DANS LA SPEC DEPUIS LE DÉBUT.
// `SPEC-FOYER-ZERO.md` §10 porte « zone d'influence joueur : rayon 2, fixe » et
// « zone d'influence ennemie : rayon 3, fixe », et sa §8 précise que « le
// territoire allié est l'union des zones d'influence de toutes les bases du
// joueur ». `GEOGRAPHIE.rayonInfluenceJoueur` et `rayonInfluenceEnnemie` les
// transcrivent, et `sim/points-attaque.js` lit déjà le premier pour le barème du
// raid. Ce module ne fait qu'en tirer une CARTE.
//
// ⚠ TCHEBYCHEV, comme partout ailleurs sur cette carte — la garde du peuplement,
// les anneaux des satellites, la distance du panneau. Sur une grille, une case
// en diagonale n'est pas plus loin qu'une case droit devant ; en mesurer trois
// là où le jeu en compte deux ferait un territoire en losange que personne n'a
// demandé.
//
// ⚠⚠ IL NE CALCULE JAMAIS SUR LES 9 300 CASES, ET C'EST UNE CONTRAINTE DE COÛT.
// Savoir si une case est sous influence ennemie en interrogeant son voisinage
// demanderait `(2 × 3 + 1)² = 49` appels à `estBaseOuvrage`, soit 441 hachages
// PAR CASE. On fait l'inverse : on demande les bases de la fenêtre UNE fois —
// `basesDeLaFenetre` est écrite pour ça — et on peint leur disque. Le coût
// devient celui des bases présentes, pas celui de la fenêtre.
//
// ⚠ ET LA FENÊTRE SE DILATE AVANT D'ÊTRE PEUPLÉE. Une base située juste hors
// champ projette quand même son influence DANS le champ : ne demander que la
// fenêtre visible ferait apparaître et disparaître des bordures au bord de
// l'écran à chaque défilement.

import { GEOGRAPHIE } from '../data/sites.js';
import { basesDeLaFenetre } from './peuplement.js';

/** Ce qu'une case peut porter. Les valeurs servent d'indices, pas de noms. */
export const NEUTRE = 0;
export const JOUEUR = 1;
export const OUVRAGE = 2;

/**
 * Les rayons d'influence, LUS dans `GEOGRAPHIE` et jamais recopiés.
 *
 * ⚠ LE JOUEUR A LE PLUS PETIT, ET C'EST VOULU : rayon 2 contre 3. Le territoire
 * allié est ce qui rend un raid bon marché (spec §8) ; l'élargir changerait un
 * barème sans qu'on s'en aperçoive.
 */
export const RAYONS = {
  [JOUEUR]: GEOGRAPHIE.rayonInfluenceJoueur,
  [OUVRAGE]: GEOGRAPHIE.rayonInfluenceEnnemie,
};

/**
 * Une carte d'occupation pour une fenêtre de la carte du monde.
 *
 * ⚠⚠ LE JOUEUR L'EMPORTE SUR L'OUVRAGE QUAND LES DEUX SE RECOUVRENT, et c'est
 * une LECTURE, pas un arbitrage — Ethan ne s'est pas prononcé. Elle se justifie
 * ainsi : le territoire allié est la seule des deux zones qui ait un effet de
 * jeu écrit (le tarif du raid à +1 par case, spec §8), et une case allié doit se
 * lire comme telle sinon l'écran contredirait le prix affiché. Elle tient en une
 * ligne — la comparaison ci-dessous — si Ethan tranche autrement.
 *
 * ⚠ SEULES LES BASES DE L'OUVRAGE PROJETTENT SON INFLUENCE, pas les camps ni les
 * avant-postes. Là encore c'est une lecture, et elle suit `TYPES_SITE` : la base
 * est le seul type qui « attaque le joueur », les deux autres sont du butin qui
 * suit le joueur et disparaît. Peindre un territoire ennemi autour de ce qu'on
 * vient de faire apparaître à côté de chez soi serait illisible.
 *
 * @param {object} etat
 * @param {{premiereRangee: number, derniereRangee: number,
 *   premiereColonne: number, derniereColonne: number}} fenetre
 * @returns {{premiereRangee: number, premiereColonne: number,
 *   largeur: number, hauteur: number, occupant: Uint8Array}}
 */
export function territoireDeLaFenetre(etat, fenetre) {
  // ⚠⚠ LA CARTE D'OCCUPATION DÉBORDE D'UNE CASE LA FENÊTRE DEMANDÉE, ET C'EST CE
  // QUI ÉVITE UN CADRE AUTOUR DE L'ÉCRAN. Un côté est exposé quand la voisine
  // porte un autre occupant ; sans cette case de contexte, les voisines du bord
  // seraient inconnues, donc lues « neutres », et chaque défilement dessinerait
  // une frontière tout autour de la vue. On calcule donc un anneau de plus qu'on
  // ne rend.
  //
  // ⚠ AU BORD DE LA CARTE, EN REVANCHE, LA FRONTIÈRE EST VRAIE. Le territoire
  // s'y arrête pour de bon ; le clamp ci-dessous fait que la voisine hors carte
  // reste neutre, et le trait se dessine. C'est la différence entre le bord de
  // ce qu'on REGARDE et le bord de ce qui EXISTE.
  const rendu = {
    premiereRangee: Math.max(1, fenetre.premiereRangee),
    derniereRangee: Math.min(GEOGRAPHIE.carte.hauteur, fenetre.derniereRangee),
    premiereColonne: Math.max(1, fenetre.premiereColonne),
    derniereColonne: Math.min(GEOGRAPHIE.carte.largeur, fenetre.derniereColonne),
  };
  const r0 = Math.max(1, rendu.premiereRangee - 1);
  const c0 = Math.max(1, rendu.premiereColonne - 1);
  const r1 = Math.min(GEOGRAPHIE.carte.hauteur, rendu.derniereRangee + 1);
  const c1 = Math.min(GEOGRAPHIE.carte.largeur, rendu.derniereColonne + 1);
  const hauteur = Math.max(0, r1 - r0 + 1);
  const largeur = Math.max(0, c1 - c0 + 1);
  const occupant = new Uint8Array(hauteur * largeur);
  const carte = {
    premiereRangee: r0, premiereColonne: c0, largeur, hauteur, occupant, rendu,
  };
  if (hauteur === 0 || largeur === 0) return carte;

  const peindre = (centre, camp) => {
    const rayon = RAYONS[camp];
    for (let dr = -rayon; dr <= rayon; dr += 1) {
      const rangee = centre.rangee + dr;
      if (rangee < r0 || rangee > r1) continue;
      for (let dc = -rayon; dc <= rayon; dc += 1) {
        const colonne = centre.colonne + dc;
        if (colonne < c0 || colonne > c1) continue;
        const i = (rangee - r0) * largeur + (colonne - c0);
        // Le joueur l'emporte : on n'écrase jamais sa marque.
        if (occupant[i] === JOUEUR) continue;
        occupant[i] = camp;
      }
    }
  };

  // ⚠ LA FENÊTRE SE DILATE DU PLUS GRAND RAYON. Une base hors champ projette
  // dans le champ ; ne demander que le visible ferait clignoter les bordures au
  // bord de l'écran à chaque défilement.
  const marge = Math.max(...Object.values(RAYONS));
  const elargie = {
    premiereRangee: r0 - marge,
    derniereRangee: r1 + marge,
    premiereColonne: c0 - marge,
    derniereColonne: c1 + marge,
  };
  // ⚠⚠ LE JOUEUR EN PREMIER, ET C'EST CE QUI REND LA RÈGLE DE PRIORITÉ RÉELLE.
  // L'ordre inverse — l'Ouvrage d'abord, le joueur par-dessus — donnait le même
  // résultat, mais pour la mauvaise raison : la priorité tenait alors à l'ORDRE
  // DES DEUX BOUCLES, et le garde-fou de `peindre` ne servait à rien. Mesuré par
  // falsification : on pouvait le retirer sans qu'un seul test tombe. En peignant
  // le joueur d'abord, c'est le refus d'écraser qui décide, et il se teste.
  //
  // `etat.position` est sa seule base aujourd'hui ; le jour où il en aura
  // plusieurs, c'est cette boucle-ci qui s'allonge, et rien d'autre.
  for (const base of basesDuJoueur(etat)) peindre(base, JOUEUR);
  for (const base of basesDeLaFenetre(etat.graine, elargie)) peindre(base, OUVRAGE);
  return carte;
}

/**
 * Les POSITIONS des bases du joueur — l'union de la spec §8, prise au mot.
 *
 * ⚠⚠ ELLE EST DEVENUE VRAIMENT PLURIELLE AU LOT BASES-0, 02/09/2026. Elle
 * rendait `[etat.position]` et se disait « une seule aujourd'hui, et le dire
 * ainsi le prépare » : le jour est venu, et c'est cette fonction seule qui a
 * changé, exactement comme annoncé. Elle rend aujourd'hui une liste d'un
 * élément parce que `etat.bases` en porte un — pas parce qu'elle le suppose.
 *
 * ⚠ ELLE REND DES POSITIONS, PAS DES BASES, et son homonyme de
 * `sim/points-attaque.js` rend des BASES. Les deux noms courts sont identiques
 * et les deux types ne le sont pas : ne jamais importer l'un pour l'autre.
 */
export function basesDuJoueur(etat) {
  return etat.bases.map((b) => b.position);
}

/** L'occupant d'une case de la carte d'occupation, `NEUTRE` hors champ. */
export function occupantDeLaCase(carte, rangee, colonne) {
  if (rangee < carte.premiereRangee || colonne < carte.premiereColonne) return NEUTRE;
  const i = rangee - carte.premiereRangee;
  const j = colonne - carte.premiereColonne;
  if (i >= carte.hauteur || j >= carte.largeur) return NEUTRE;
  return carte.occupant[i * carte.largeur + j];
}

/**
 * Les côtés EXPOSÉS de chaque case occupée — ce qu'on dessine, et rien d'autre.
 *
 * ⚠⚠ ETHAN, 31/08 : « afficher les territoires sur la carte. Cf screenshots,
 * seuls les bordures sont dessinés. » On ne remplit donc pas les cases : on rend
 * les côtés par lesquels une case touche autre chose qu'elle-même. Un remplissage
 * couvrirait le terrain, qui est ce qu'on est venu regarder.
 *
 * ⚠ UN CÔTÉ EST EXPOSÉ DÈS QUE LE VOISIN EST D'UN AUTRE OCCUPANT, neutre compris.
 * Deux territoires qui se touchent portent donc DEUX traits, un de chaque
 * couleur, et c'est ce qu'il faut : la frontière appartient aux deux.
 *
 * ⚠ ET LE BORD DE LA FENÊTRE N'EST PAS UNE FRONTIÈRE. `occupantDeLaCase` rend
 * `NEUTRE` hors champ, ce qui dessinerait un cadre autour de l'écran à chaque
 * défilement. On ne rend donc que les cases dont les quatre voisines sont DANS
 * la carte d'occupation — d'où la dilatation de la fenêtre chez l'appelant.
 *
 * @param {ReturnType<typeof territoireDeLaFenetre>} carte
 * @returns {Array<{rangee: number, colonne: number, camp: number,
 *   nord: boolean, est: boolean, sud: boolean, ouest: boolean}>}
 */
export function bordsDuTerritoire(carte) {
  const bords = [];
  // ⚠ ON PARCOURT LA FENÊTRE DEMANDÉE, PAS LA CARTE D'OCCUPATION. L'anneau de
  // contexte sert à LIRE les voisines, jamais à produire un bord : ses propres
  // voisines lui manquent, donc il en inventerait.
  const { rendu } = carte;
  for (let rangee = rendu.premiereRangee; rangee <= rendu.derniereRangee; rangee += 1) {
    for (let colonne = rendu.premiereColonne; colonne <= rendu.derniereColonne; colonne += 1) {
      const camp = occupantDeLaCase(carte, rangee, colonne);
      if (camp === NEUTRE) continue;
      const autre = (dr, dc) => occupantDeLaCase(carte, rangee + dr, colonne + dc) !== camp;
      // ⚠ NORD EST LA RANGÉE DÉCROISSANTE, comme sur l'écran Monde : la rangée 1
      // s'y dessine en haut. Ce n'est PAS la boussole de `sim/rendu-pose.js`,
      // qui décrit la grille de COMBAT et son retournement — les deux ne parlent
      // pas de la même surface, et les confondre retournerait les bordures.
      const cote = {
        rangee, colonne, camp, nord: autre(-1, 0), est: autre(0, 1), sud: autre(1, 0), ouest: autre(0, -1),
      };
      if (cote.nord || cote.est || cote.sud || cote.ouest) bords.push(cote);
    }
  }
  return bords;
}
