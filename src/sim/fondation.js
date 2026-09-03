// Fonder une base de plus — lot BASES-1, 02/09/2026.
//
// ⚠⚠ CE MODULE NE POSE PAS UNE BASE « COMME LA PREMIÈRE », IL POSE LA MÊME.
// `creerBase` de `sim/state.js` fabrique une base neuve depuis le lot BASES-0 ;
// en écrire une seconde ici donnerait deux définitions de ce qu'est une base, et
// la divergence se lirait comme un bogue de jeu — une base fondée sans réserve
// de réparation, ou sans obstacles. C'est ce que le brief demande de face :
// « `creerBase` existe : la RÉUTILISER ».
//
// ⚠⚠ LE TERRAIN EST AUTOMATIQUE, IL N'Y A RIEN À TIRER ICI. `champsDeLaBase` et
// `obstaclesDeLaBase` dérivent de la POSITION, et `fondation` les gèle pour
// toujours — c'est l'arbitrage du 27/08. Une base fondée hérite du terrain de sa
// case ; inventer un tirage lui en donnerait un second.
//
// ⚠ IL REND DES PROBLÈMES CHIFFRÉS EN FRANÇAIS, comme `problemesDuDeplacement`
// et `problemesDeLaPose`. L'écran les affiche tels quels ; les reformuler
// ailleurs ferait une seconde formulation qui finirait par dire autre chose que
// la règle.

import { FONDATION, GEOGRAPHIE } from '../data/sites.js';
import { estSurLaCarte } from './carte.js';
import { distanceCarreeCases } from './points-attaque.js';
import { estBaseOuvrage } from './peuplement.js';
import { poiDeLaCase } from './poi.js';
import { siteDeLaCase, butinSiToutTombe } from './site-de-la-case.js';
import { montageCourant, retirerLeSite } from './site-entame.js';
import { verserLeButin } from './raid.js';
import { rangDeLaBaseSuivante, problemesDeLAchatDUneBase } from './recherche.js';
// ⚠ AUCUN CYCLE : `sim/state.js` n'importe PAS ce module — c'est `src/ui/` qui
// l'appelle. Le jour où `state.js` en aurait besoin, c'est `ajouterUneBase`
// qu'il faudrait descendre, pas ce fichier qu'il faudrait tordre.
import { ajouterUneBase } from './state.js';

/** La portée de fondation, au carré — jamais de racine (lot EUCLIDE). */
export const PORTEE_CARREE = FONDATION.porteeMaxCases * FONDATION.porteeMaxCases;

/** Le rayon d'influence d'une base de l'Ouvrage, au carré. */
const TERRITOIRE_ENNEMI_CARRE = GEOGRAPHIE.rayonInfluenceEnnemie
  * GEOGRAPHIE.rayonInfluenceEnnemie;

/**
 * Les types de site qu'on peut détruire en fondant dessus.
 *
 * ⚠ CAMP ET AVANT-POSTE, ET PAS LA BASE. Ethan, 02/09. Ce n'est pas arbitraire :
 * `territoire.js` dit déjà que ces deux-là ne projettent AUCUNE influence — ils
 * sont du butin qui suit le joueur —, quand la base en projette une de rayon 3.
 * Fonder sur ce qui n'occupe pas le terrain se tient ; fonder sur une base de
 * l'Ouvrage voudrait dire fonder au cœur d'un territoire qu'on vient d'interdire.
 */
export const TYPES_ECRASABLES = new Set(['camp', 'avantPoste']);

/**
 * La distance au carré à la base du joueur la PLUS PROCHE.
 *
 * ⚠⚠ N'IMPORTE LAQUELLE DE SES BASES, PAS LA COURANTE. Le joueur qui en a trois
 * doit pouvoir fonder autour de la troisième sans avoir à basculer d'abord —
 * l'obliger à basculer ferait de la bascule une condition de jeu, ce que
 * personne n'a arbitré et que rien à l'écran ne dirait.
 */
function distanceCarreeAuPlusProche(etat, cible) {
  let mini = Infinity;
  for (const base of etat.bases) {
    const d = distanceCarreeCases(base.position, cible);
    if (d < mini) mini = d;
  }
  return mini;
}

/**
 * Ce qui empêche de fonder ici — liste vide si rien.
 *
 * Les sept codes, dans l'ordre où ils se rencontrent : `hors-carte`,
 * `recherche-manquante`, `points-insuffisants`, `trop-loin`, `case-occupee`,
 * `sur-un-poi`, `territoire-ennemi`.
 *
 * ⚠⚠ `points-insuffisants` NE VIENT JAMAIS SEUL, ET C'EST VOULU. Le droit de
 * fonder s'ACHÈTE — `acheterUneBaseDePlus`, onglet Spécial — et se paie en
 * points de recherche, jamais ici. Ce code n'est donc pas un second paiement :
 * il dit, sous `recherche-manquante`, si le rang manquant est seulement à portée
 * de bourse. Sans lui, le joueur lirait « il te faut la recherche » sans savoir
 * s'il peut l'acheter tout de suite ou s'il doit d'abord raider.
 *
 * ⚠ HORS CARTE, ON REND TOUT DE SUITE. Le reste — territoire, POI, distance —
 * n'a pas de sens sur une case qui n'existe pas, et `poiDeLaCase` la refuserait.
 *
 * ⚠ ON RASSEMBLE, ON NE S'ARRÊTE PAS AU PREMIER. `problemesDeDisposition` rend
 * TOUS les défauts depuis le début : un joueur qui corrige une raison pour
 * découvrir la suivante recommence trois fois le même geste.
 *
 * @param {object} etat
 * @param {{rangee: number, colonne: number}} cible
 * @returns {Array<{code: string, message: string}>}
 */
export function problemesDeLaFondation(etat, cible) {
  if (cible === null || typeof cible !== 'object'
    || !Number.isInteger(cible.rangee) || !Number.isInteger(cible.colonne)) {
    throw new TypeError('fondation : la cible n\'est pas une case entière');
  }
  const problemes = [];

  if (!estSurLaCarte(cible.rangee, cible.colonne)) {
    return [{ code: 'hors-carte', message: 'Cette case est en dehors de la carte.' }];
  }

  if (etat.bases.length >= etat.recherche.basesAutorisees) {
    const rang = rangDeLaBaseSuivante(etat);
    problemes.push({
      code: 'recherche-manquante',
      message: `Il faut d'abord acheter la recherche « Base supplémentaire » (rang ${rang}).`,
    });
    for (const p of problemesDeLAchatDUneBase(etat)) {
      problemes.push({ code: 'points-insuffisants', message: `Pour l'acheter, ${p.message}.` });
    }
  }

  const carre = distanceCarreeAuPlusProche(etat, cible);
  if (carre > PORTEE_CARREE) {
    problemes.push({
      code: 'trop-loin',
      message: `Cette case est à ${casesEnLigneDroite(carre)} cases en ligne droite `
        + `de ta base la plus proche : la limite est de ${FONDATION.porteeMaxCases}.`,
    });
  }

  // ⚠⚠ SEULE LA CASE EXACTE D'UNE BASE EXISTANTE EST REFUSÉE, ET C'EST ARBITRÉ.
  // Ethan, 02/09 : fonder dans son PROPRE territoire est autorisé. **Conséquence
  // signalée et acceptée : deux bases du joueur peuvent être adjacentes.** Il
  // avait d'abord appelé cela un exploit, puis tranché autrement. Si Ethan
  // revient dessus, c'est ce `=== 0` qui devient un rayon.
  if (carre === 0) {
    problemes.push({ code: 'case-occupee', message: 'Une de tes bases est déjà là.' });
  }

  const site = siteDeLaCase(etat, cible.rangee, cible.colonne);
  if (site !== null && !TYPES_ECRASABLES.has(site.type)) {
    problemes.push({
      code: 'case-occupee',
      message: 'Une base de l\'Ouvrage occupe cette case.',
    });
  }

  if (poiDeLaCase(etat.graine, cible.rangee, cible.colonne) !== null) {
    problemes.push({
      code: 'sur-un-poi',
      message: 'On ne fonde pas sur un gisement : il serait perdu.',
    });
  }

  if (dansUnTerritoireEnnemi(etat, cible)) {
    problemes.push({
      code: 'territoire-ennemi',
      message: `Cette case est sous l'influence d'une base de l'Ouvrage `
        + `(${GEOGRAPHIE.rayonInfluenceEnnemie} cases).`,
    });
  }
  return problemes;
}

/**
 * La case est-elle dans le disque d'influence d'une base de l'Ouvrage ?
 *
 * ⚠⚠ LE DISQUE, PAS LE CARRÉ, ET LA MÊME MÉTRIQUE QUE `territoire.js`. C'est
 * tout l'objet du §4.1 : depuis ce lot, la carte peinte et la règle appliquée
 * décrivent la même géométrie. Une garde carrée ici referait exactement
 * l'incohérence qu'on vient de retirer, et le joueur verrait un refus sur une
 * case que la carte lui montre libre.
 *
 * ⚠ ON BALAIE LES CENTRES POSSIBLES, PAS LA CARTE. Une base de l'Ouvrage
 * influence à trois cases : il suffit donc de regarder le carré de rayon 3
 * autour de la cible et de demander à chaque case si elle EST une base. C'est
 * 49 lectures, contre 9 300 pour un balayage.
 *
 * ⚠ UNE BASE RASÉE N'INFLUENCE PLUS RIEN, et c'est `siteDeLaCase` qui le sait —
 * `estBaseOuvrage` est dérivé de la graine et la ferait reparaître.
 */
function dansUnTerritoireEnnemi(etat, cible) {
  const r = GEOGRAPHIE.rayonInfluenceEnnemie;
  for (let dr = -r; dr <= r; dr += 1) {
    for (let dc = -r; dc <= r; dc += 1) {
      if (dr * dr + dc * dc > TERRITOIRE_ENNEMI_CARRE) continue;
      const rangee = cible.rangee + dr;
      const colonne = cible.colonne + dc;
      if (!estSurLaCarte(rangee, colonne)) continue;
      if (!estBaseOuvrage(etat.graine, rangee, colonne)) continue;
      const site = siteDeLaCase(etat, rangee, colonne);
      if (site !== null && site.type === 'base') return true;
    }
  }
  return false;
}

/**
 * La distance en cases entières, arrondie au supérieur — POUR L'AFFICHAGE.
 *
 * ⚠ SANS `Math.sqrt`, comme `casesArrondiesAuSuperieur` de `points-attaque.js`
 * et sa jumelle de `deplacement.js`. ⚠ ELLES SONT DÉSORMAIS TROIS, ce que le
 * commentaire de `deplacement.js` annonçait comme le seuil de réunion — mais
 * réunir demanderait à `deplacement.js` et à ce module d'importer
 * `points-attaque.js` pour trois lignes, et `points-attaque.js` traîne
 * `clock.js` et `niveau-de-base.js`. **Point laissé en suspens, signalé au
 * rapport** : c'est un rangement, pas une règle, et il vaut son propre lot.
 */
function casesEnLigneDroite(carre) {
  let n = 0;
  while (n * n < carre) n += 1;
  return n;
}

/**
 * Le butin qu'on récupérerait en fondant ici — `null` s'il n'y a rien à écraser.
 *
 * ⚠ ELLE NE VERSE RIEN, elle ANNONCE. L'écran a besoin de dire au joueur ce
 * qu'il gagne AVANT qu'il touche une seconde fois ; `fonderUneBase` refait le
 * même calcul au moment d'agir, par la même fonction.
 */
export function butinDeLaFondation(etat, cible) {
  const site = siteDeLaCase(etat, cible.rangee, cible.colonne);
  if (site === null || !TYPES_ECRASABLES.has(site.type)) return null;
  // ⚠⚠ LE MONTAGE **COURANT**, PAS LE MONTAGE PLEIN. Un camp à moitié rasé par un
  // raid précédent ne rend pas ce qu'il rendait neuf : `montageCourant` applique
  // les PV rangés dans `sitesEntames`. `montageDuSite` est le site INTACT, et
  // c'est ce que `butinSiToutTombe` reçoit quand le panneau annonce un raid.
  return butinSiToutTombe(montageCourant(etat, site));
}

/**
 * Fonde une base sur cette case — ou lève.
 *
 * ⚠ ELLE LÈVE là où `problemesDeLaFondation` rend une liste, et c'est la
 * distinction du dépôt : une fondation refusée est un fait de JEU qu'on montre
 * au joueur ; appeler celle-ci sans avoir regardé est un fait de PROGRAMME.
 *
 * ⚠⚠ LE BUTIN VA À LA BASE QUI FONDE, ET SA JUSTIFICATION EST TOMBÉE AU LOT
 * TRANSFERT — **DÉCISION À ROUVRIR PAR ETHAN**. Elle disait : « une base neuve
 * n'a qu'un Chantier de niveau 1, donc 50 · 50 · 40 de capacité ; y verser le
 * butin d'un avant-poste de niveau 40 le ferait déborder EN ENTIER, et
 * `butinPerdu` annoncerait la perte de la quasi-totalité. » Depuis le 02/09 le
 * butin **a le droit de dépasser la capacité** : il tiendrait très bien dans la
 * base neuve, gelé au-dessus du plafond, et rien ne serait perdu.
 *
 * ⚠⚠ LE COMPORTEMENT N'A DONC PAS CHANGÉ, ET C'EST DÉLIBÉRÉ : le brief du lot
 * TRANSFERT demande de garder le geste et de réécrire l'argument, pas de
 * trancher. Ce qui reste vrai en faveur de la base qui fonde : elle est BÂTIE,
 * donc ce qu'elle reçoit est immédiatement dépensable, et son stock ne bloque la
 * production que des ressources déjà pleines. Ce qui parle maintenant pour la
 * base neuve : le butin l'amorcerait bien mieux que les 30 · 30 · 20 qu'elle
 * reçoit, au prix d'une base qui démarre avec sa production gelée.
 * **Les deux se tiennent, et le choix appartient à Ethan.** Si l'inverse est
 * retenu, c'est l'argument de `verserLeButin` ci-dessous qui change — `quiFonde`
 * devient `etat.bases[indice]` —, et rien d'autre.
 *
 * ⚠ QUELLE BASE FONDE ? LA COURANTE. C'est la seule que le joueur regarde au
 * moment du geste, et c'est déjà ce que veut dire « courante » partout ailleurs.
 *
 * ⚠⚠ ET LA NOUVELLE BASE DEVIENT COURANTE. Fonder puis rester sur l'ancienne
 * obligerait le joueur à basculer pour voir ce qu'il vient de poser ; et le
 * butin est DÉJÀ versé quand la bascule a lieu, donc l'ordre ci-dessous compte.
 *
 * @param {object} etat modifié en place
 * @param {{rangee: number, colonne: number}} cible
 * @returns {{indice: number, butin: {verse: object}|null,
 *   siteDetruit: object|null}}
 */
export function fonderUneBase(etat, cible) {
  const problemes = problemesDeLaFondation(etat, cible);
  if (problemes.length > 0) {
    throw new Error(
      `fondation impossible — ${problemes.map((p) => p.message).join(' ; ')}`,
    );
  }
  const quiFonde = etat.bases[etat.baseCourante];

  // --- ce qu'on écrase, s'il y a quelque chose ------------------------------
  const site = siteDeLaCase(etat, cible.rangee, cible.colonne);
  let butin = null;
  let siteDetruit = null;
  if (site !== null) {
    butin = verserLeButin(quiFonde, butinSiToutTombe(montageCourant(etat, site)));
    retirerLeSite(etat, site);
    siteDetruit = site;
  }

  // --- la base neuve, par le même code que la première ----------------------
  const indice = ajouterUneBase(etat, cible);
  etat.baseCourante = indice;
  return { indice, butin, siteDetruit };
}
