// L'ARRIVÉE D'UNE UNITÉ D'ASSAUT — elle roule depuis la case du dessous.
//
// Ethan, 10/09 : « Lors des raids faire apparaître les unités une case en
// dessous fantôme pour qu'on voit les véhicules arrivés pour pas qu'ils
// apparaissent directement sur la bande du bas. »
//
// ⚠⚠ PUIS, LE MÊME JOUR : « Ils arrivent trop rapidement, et on les voit spawn.
// Ils doivent spawn en dessous et arriver », ET SURTOUT **« Ne pas faire de
// fantôme. »** Les trois moitiés de la demande se séparent donc nettement : le
// DÉCALAGE reste — c'est lui qui fait émerger le véhicule —, l'OPACITÉ part, et
// la DURÉE cesse d'être décrétée. Ce module ne fabrique plus de fantôme : il
// fait rouler une unité à pleine matière depuis une case plus bas.
//
// ⚠⚠ MODULE PUR, ET IL NE TOUCHE PAS `src/sim/`. C'est la contrainte qui prime
// sur tout : l'invariant du dépôt veut que `tickJeu × N` et `rattraperJeu(N)`
// rendent le même état à l'octet, et les deux cents témoins de combat comme les
// huit raids de référence en dépendent. Un fantôme est une affaire de DESSIN —
// il n'a aucune raison de traverser le moteur, et l'y faire passer coûterait une
// recapture de témoins que `CLAUDE.md` n'autorise qu'une fois par siècle.
//
// ⚠⚠ ET LE CROCHET EXISTAIT DÉJÀ, ÉCRIT DANS `interpolation.js` : « Une entité
// d'indice ≥ `instantane.length` est née après la prise : elle se dessine sans
// interpolation, à sa position courante. » C'est très exactement ce qu'Ethan
// voit — l'unité APPARAÎT, elle n'arrive pas. Mesuré sur l'arbre intact avant
// d'écrire une ligne : sur un montage à une vague, le sprite de l'attaquant est
// posé à `y = 594`, c'est-à-dire EXACTEMENT `yDeRangeeMilli` de sa case, sans le
// moindre décalage.
//
// ⚠⚠ LE DÉCALAGE EST RENDU EN MILLI-CASES ET S'APPLIQUE EN PIXELS, JAMAIS EN
// BAISSANT `rangeeMilli` — ET C'EST UNE MESURE, PAS UN GOÛT. `yDeRangeeMilli` de
// `render/projection.js` BORNE sa sortie à la grille : son plancher est
// `margeY + (GRILLE.longueur − 1) × tailleCase`, c'est-à-dire le bord haut de la
// rangée 1. Mesuré sur la projection du raid : `yDeRangeeMilli(p, 0)` et
// `yDeRangeeMilli(p, 1000)` rendent le MÊME nombre, 630. Une entité qu'on
// ferait descendre d'une case en lui donnant `rangeeMilli − 1000` serait donc
// écrasée sur sa propre case, et le fantôme n'existerait pas. Le décalage est
// une grandeur de DESSIN, il s'ajoute après la projection.

import { GRILLE, UNITES } from '../data/combat.js';
import { MILLI_PAR_CASE } from '../sim/grille.js';
import { TICK_MS } from '../sim/clock.js';

/**
 * La durée de l'arrivée d'UNE entité, en millisecondes de temps réel.
 *
 * ⚠⚠ ELLE SE DÉRIVE DE L'UNITÉ, ELLE NE SE DÉCRÈTE PLUS — Ethan, 10/09 : « Ils
 * arrivent trop rapidement ». Elle valait `ARRIVEE_MS = 400` pour tout le monde,
 * quatre ticks, et c'était un nombre choisi. C'est désormais **exactement le
 * temps que l'unité met à franchir une case à son propre pas**.
 *
 * ⚠⚠ ET C'EST UNE CONTRAINTE MESURÉE, PAS UNE ÉLÉGANCE. Une unité avance de
 * `vitesseMilli` par tick, une case vaut `MILLI_PAR_CASE`, un tick vaut
 * `TICK_MS` : traverser une case lui prend **1 667 ms à `vitesse: 60`** — la
 * plus lente du roster — et **833 ms à 120**. Une arrivée plus longue que ça
 * ferait mentir le sprite de PLUS D'UNE CASE sur la position réelle d'une unité
 * qui tire déjà et qu'on tire déjà. Le retard est donc borné à une case **par
 * construction**, et il l'est pour chaque unité séparément.
 *
 * ⚠⚠ LA VITESSE SE LIT DANS `UNITES`, ET LE BRIEF SE TROMPAIT — MESURÉ AVANT
 * D'ÉCRIRE UNE LIGNE. Il posait « `vitesseMilli` EST SUR L'ENTITÉ,
 * `src/sim/combat.js` le pose au montage ; le lire, ne pas le recalculer depuis
 * `UNITES` ». **C'est faux** : le littéral d'entité de `ajouterEntite` ne porte
 * pas ce champ — la vitesse vit sur le PROFIL, qui est PARTAGÉ par toutes les
 * pièces d'un identifiant, et `profil` n'est pas exporté. La première écriture a
 * levé sur sept tests de `raid-ecran.test.js`, avec « vitesseMilli
 * « undefined » », sur de VRAIS montages passés par `creerCombat`.
 *
 * ⚠⚠ ET CE N'EST PAS UNE SECONDE ÉCRITURE POUR AUTANT, ce qui est le fond de
 * l'interdiction du brief. `profilUnite` fait `entierDeDonnees(u.vitesse, …)` :
 * `UNITES[id].vitesse` EST la source dont le profil dérive. On lit donc la même
 * table que lui, pas une copie — et `arrivee.js` importait déjà `GRILLE` de ce
 * fichier. Passer par `src/sim/` pour exporter `profil` était l'autre voie, et
 * elle est **interdite au territoire de ce lot**.
 *
 * ⚠ ET C'EST LA VITESSE NOMINALE QU'ON VEUT, pas l'effective. `vitesseObstacleMilli`
 * et le Booster changent le pas EN COURS DE ROUTE ; la durée, elle, est
 * contractée à la naissance et ne bouge plus — voir `creerArrivees`.
 *
 * ⚠⚠ ET CE QUI N'EST PAS UNE UNITÉ LÈVE, IL NE REND PAS `Infinity`. Un bâtiment
 * et une défense n'ont aucune entrée dans `UNITES` : sans garde, la division
 * rendrait `Infinity`, la rampe ne tomberait jamais à zéro, et l'entité resterait
 * une case sous sa case POUR TOUJOURS, sans qu'une seule erreur ne soit levée.
 * ⚠ Le cas n'est pas atteignable aujourd'hui — `arrive` filtre déjà sur le camp
 * `attaque` et sur la bande de déploiement — mais **un fait de programme se dit
 * par une levée, pas par une chance** : la garde s'écrit quand même, et `AC T3`
 * la mesure.
 *
 * ⚠ LE CALCUL EST ENTIER JUSQU'À LA DIVISION, comme partout dans ce module :
 * `MILLI_PAR_CASE × TICK_MS` vaut 100 000, et c'est ce numérateur-là qu'on
 * divise. Écrire `MILLI_PAR_CASE / vitesse * TICK_MS` ferait passer un flottant
 * par un arrondi de plus pour le même résultat.
 *
 * @param {{id: string}} entite
 * @returns {number} la durée, en millisecondes de temps réel
 */
export function dureeDArrivee(entite) {
  const vitesse = UNITES[entite?.id]?.vitesse;
  if (!Number.isFinite(vitesse) || vitesse <= 0) {
    throw new RangeError(
      `dureeDArrivee : « ${entite?.id} » n'a pas de vitesse dans UNITES `
      + `(« ${vitesse} ») — ce qui ne roule pas n'arrive pas`,
    );
  }
  return Math.round((MILLI_PAR_CASE * TICK_MS) / vitesse);
}

/** L'opacité pleine, en millièmes — la valeur que porte tout autre sprite. */
export const OPACITE_PLEINE = 1000;

/**
 * L'état d'affichage des arrivées. Il ne va NULLE PART : il vit dans la
 * fermeture de l'écran de raid et meurt avec le déroulé, comme `mesure` et
 * comme l'ensemble des tombées de l'effondrement. Pas un champ n'entre dans la
 * sauvegarde, et `SAVE_VERSION` ne bouge pas.
 *
 * ⚠ `vus` EST UNE MARQUE HAUTE SUR L'INDICE, PAS UN COMPTE D'ENTITÉS VIVANTES.
 * Les indices sont STABLES et le tableau ne rétrécit jamais — une entité morte
 * y reste avec `vivant: false` (lot 2A) —, donc « née depuis le dernier
 * relevé » se lit exactement « indice ≥ vus ». C'est le même fait sur lequel
 * `positionAffichee` s'appuie déjà pour ne pas interpoler une entité neuve.
 *
 * ⚠⚠ ET `depuis` PORTE DEUX NOMBRES DEPUIS LE LOT ARRIVÉE-CARTE-ET-BUILD :
 * l'instant du stamp ET LA DURÉE CONTRACTÉE. La durée dépend de l'unité, donc
 * elle ne peut plus être une constante du module ; et elle est FIGÉE au moment
 * de l'arrivée plutôt que relue à chaque image, exactement comme
 * `dernierDeplacementDelaiTicks` l'est au moment du saut. La relire ferait
 * changer l'arrivée EN COURS DE ROUTE le jour où une unité ralentit sous un
 * obstacle — `vitesseObstacleMilli` existe —, et la rampe s'étirerait sous les
 * yeux du joueur.
 *
 * @returns {{vus: number, depuis: Map<number, {ms: number, dureeMs: number}>}}
 */
export function creerArrivees() {
  return { vus: 0, depuis: new Map() };
}

/**
 * Cette entité arrive-t-elle, ou est-elle simplement neuve ?
 *
 * ⚠⚠ LA CONDITION DE CAMP EST CELLE QUI TRAVAILLE. Une défenseuse n'arrive pas :
 * elle est là depuis le début du raid, et la faire monter du bas de l'écran
 * ferait descendre la garnison entière d'une case au premier tick. Mesuré sur
 * douze graines, quatre vagues chacune : **372 naissances de défenseurs contre
 * 60 d'attaquants**, donc c'est le gros du filtre.
 *
 * ⚠⚠ ET LA CONDITION DE RANGÉE EST UNE CEINTURE, VACUEUSE AUJOURD'HUI — MESURÉ,
 * ET IL FAUT LE DIRE DANS CE SENS-LÀ. Le brief la demande pour écarter les
 * passagères ; mesuré sur les mêmes douze graines, **zéro attaquant sur 60 naît
 * hors de la bande de déploiement** — les 60 naissent aux rangées 1 et 2. Une
 * passagère n'échappe donc PAS à ce filtre : `sim/combat.js` la crée AVEC son
 * porteur, dans la bande, et ce qu'il ne journalise qu'au débarquement est
 * l'événement SONORE, pas l'entité. Retirer cette ligne ne fait tomber aucun
 * test, et c'est déclaré plutôt que compté comme une garde.
 *
 * ⚠ ELLE RESTE PARCE QU'ELLE EST LA SEULE À TENIR LE JOUR OÙ UN ATTAQUANT
 * NAÎTRAIT AILLEURS — un renfort, un largage, une pièce créée en cours de
 * combat. `ajouterEntite` ne l'interdit pas ; ce qui l'empêche aujourd'hui est
 * que personne ne l'appelle hors de l'apparition de vague.
 *
 * ⚠⚠ CE QUI ÉCARTE VRAIMENT LA PASSAGÈRE AU DÉBARQUEMENT, C'EST L'EXPIRATION DU
 * STAMP, ET ELLE EST MESURÉE SUR UN MONTAGE. Un Éclaireur portant une Meute
 * débarque au **tick 75**, soit 7 500 ms de temps réel à ×1 et **1 875 ms à
 * ×4**, contre 400 ms de montée : marge **×4,69** au pire. La borne THÉORIQUE
 * est plus serrée et tient aussi — neuf cases au moins (rangée 2 → rangée 11) à
 * 240 milli-cases par tick pour la plus rapide, donc 37,5 ticks, soit 940 ms à
 * ×4 : marge ×2,35.
 *
 * ⚠ ET LA PASSAGÈRE N'EST PAS EXCLUE À SA NAISSANCE, DÉLIBÉRÉMENT. `visible` de
 * `render/scene.js` vaut `e.vivant && !e.sorti` — il ne regarde PAS `embarquee`,
 * contrairement à `estActive` du moteur —, donc une passagère EST dessinée, à la
 * case de son porteur. La stamper comme lui est la seule façon qu'ils montent
 * ENSEMBLE : l'exclure ferait apparaître la passagère à pleine opacité sur la
 * case d'arrivée pendant que son porteur, une case plus bas, monte encore.
 *
 * ⚠ LES DEUX SE VÉRIFIENT DANS `SB T5 bis` : le porteur et sa passagère rendent
 * la MÊME rampe à la naissance, et la passagère n'en a plus aucune au
 * débarquement.
 */
function arrive(e) {
  if (e.camp !== 'attaque') return false;
  const rangee = Math.floor(e.rangeeMilli / MILLI_PAR_CASE);
  const { premiere, derniere } = GRILLE.bandes.deploiement;
  return rangee >= premiere && rangee <= derniere;
}

/**
 * Note l'instant d'apparition de tout ce qui est né depuis le dernier relevé.
 *
 * ⚠⚠ L'INSTANT EST INJECTÉ, comme partout dans `render/` et dans `src/son/`.
 * Aucun module hors de `src/ui/session.js` n'a le droit de lire l'horloge —
 * garde §11 de `test/banc.test.js` —, et c'est aussi ce qui rend la rampe
 * éprouvable sous `node --test`, où il n'y a ni écran ni image.
 *
 * ⚠ ELLE MUTE, ET ELLE LE DIT DANS SON NOM. « Noter » est un geste ; la lecture
 * est `etatDeLArrivee`, qui ne touche à rien.
 *
 * @param {{vus: number, depuis: Map<number, number>}} arrivees modifié en place
 * @param {{entites: Array<object>}} etat l'état de combat, LU seulement
 * @param {number} maintenantMs l'instant, INJECTÉ
 */
export function noterLesArrivees(arrivees, etat, maintenantMs) {
  for (let i = arrivees.vus; i < etat.entites.length; i += 1) {
    const e = etat.entites[i];
    // ⚠ LA DURÉE SE CONTRACTE ICI, UNE FOIS. C'est le seul endroit qui voit
    // l'entité au moment où elle naît, donc le seul qui puisse figer sa vitesse
    // d'alors ; `etatDeLArrivee` ne reçoit qu'un indice et ne pourrait pas la
    // retrouver sans relire l'état, ce que ce module ne fait pas.
    if (arrive(e)) arrivees.depuis.set(e.indice, { ms: maintenantMs, dureeMs: dureeDArrivee(e) });
  }
  arrivees.vus = etat.entites.length;
}

/**
 * Où en est l'arrivée de cette entité — ou `null` si elle n'arrive pas (ou
 * plus).
 *
 * `decalageMilli` va d'une case entière à ZÉRO, linéairement, sur la durée que
 * l'entité a CONTRACTÉE en naissant.
 *
 * ⚠⚠ ELLE NE REND PLUS D'OPACITÉ — Ethan, 10/09 : **« Ne pas faire de
 * fantôme. »** Le second champ valait `OPACITE_ARRIVEE` (350 ‰) et montait à
 * 1 000 ; il n'existe plus, et une unité en arrivée se dessine **au même alpha
 * que tout le reste**. Ce qui reste est le seul mouvement : elle roule depuis la
 * case du dessous, à pleine matière.
 *
 * ⚠ `OPACITE_PLEINE` ET LE CHAMP `alpha` DE `sprite()` RESTENT, EUX. Le champ est
 * générique, il vaut mille par défaut, et `SB T6` garde la restauration de
 * `globalAlpha`. Retirer la plomberie parce que son premier client s'en va
 * obligerait le suivant à la réécrire — et un `globalAlpha` non restauré est une
 * faute qu'aucun test sans navigateur ne verrait deux fois.
 *
 * ⚠⚠ LA RAMPE TOMBE EXACTEMENT SUR ZÉRO À L'ÉCHÉANCE, ET C'EST CE QUI COMPTE.
 * Une rampe qui n'arriverait pas juste laisserait l'unité posée un dixième de
 * case sous sa case — POUR TOUJOURS, puisque plus rien ne la corrigerait
 * ensuite. L'expression est donc écrite en ENTIERS, division en dernier : à
 * `ecoule === dureeMs`, le numérateur est nul.
 *
 * ⚠ LE DÉCALAGE EST VERS LE BAS DE LA GRILLE, ET LE SENS DE LECTURE N'EST PAS
 * DEVINABLE. Sur cet écran la bande de déploiement — rangées 1 et 2 — est EN
 * BAS : l'attaquant MONTE vers les bâtiments, et `estSortiParLeHaut` du moteur
 * teste `rangeeMilli >= DERNIERE_RANGEE + 1`. « Une case en dessous » est donc
 * la rangée `r − 1`, hors grille, c'est-à-dire un `y` PLUS GRAND à l'écran.
 * L'appelant ajoute, il ne retranche pas.
 *
 * ⚠ UN INSTANT ANTÉRIEUR AU STAMP REND LE DÉPART, il ne lève pas et ne rend pas
 * un décalage plus grand qu'une case. Le pas-à-pas du simulateur peut dessiner
 * deux fois le même instant, et une horloge d'image n'est pas garantie
 * strictement croissante ; l'unité doit rester dans sa case, pas sauter.
 *
 * @returns {{decalageMilli: number} | null}
 */
export function etatDeLArrivee(arrivees, indice, maintenantMs) {
  const depuis = arrivees.depuis.get(indice);
  if (depuis === undefined) return null;
  const { ms, dureeMs } = depuis;
  const ecoule = Math.min(Math.max(maintenantMs - ms, 0), dureeMs);
  if (maintenantMs - ms > dureeMs) return null;
  return {
    decalageMilli: Math.round((MILLI_PAR_CASE * (dureeMs - ecoule)) / dureeMs),
  };
}

/**
 * La table des arrivées EN COURS à cet instant, pour une image.
 *
 * ⚠⚠ C'EST L'IDIOME DE `tombeesALEcran`, ET C'EST POURQUOI `listeAffichage` NE
 * REÇOIT QU'UN PARAMÈTRE DE PLUS. L'effondrement passe déjà « un ENSEMBLE
 * d'indices, pas une copie de l'état » ; les arrivées passent une TABLE
 * d'indices, résolue par l'appelant. `render/scene.js` reste donc sans horloge —
 * il ne saurait pas quoi faire d'un instant, et lui en donner un aurait mis le
 * temps dans le module qui décrit une image.
 *
 * @returns {Map<number, {decalageMilli: number}>}
 */
export function arriveesALEcran(arrivees, maintenantMs) {
  const table = new Map();
  for (const indice of arrivees.depuis.keys()) {
    const etat = etatDeLArrivee(arrivees, indice, maintenantMs);
    if (etat !== null) table.set(indice, etat);
  }
  return table;
}
