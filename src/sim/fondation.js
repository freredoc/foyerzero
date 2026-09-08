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

import { FONDATION } from '../data/sites.js';
import { estSurLaCarte } from './carte.js';
import { distanceCarreeCases } from './points-attaque.js';
import { campDeLaCase, OUVRAGE, JOUEUR } from './territoire.js';
import { poiDeLaCase } from './poi.js';
import { siteDeLaCase, butinSiToutTombe } from './site-de-la-case.js';
import { problemesDuVoisinageDesBases } from './voisinage-des-bases.js';
import { montageCourant, retirerLeSite } from './site-entame.js';
import { verserLeButin } from './raid.js';
import { rangDeLaBaseSuivante, problemesDeLAchatDUneBase } from './recherche.js';
// ⚠ AUCUN CYCLE : `sim/state.js` n'importe PAS ce module — c'est `src/ui/` qui
// l'appelle. Le jour où `state.js` en aurait besoin, c'est `ajouterUneBase`
// qu'il faudrait descendre, pas ce fichier qu'il faudrait tordre.
import { ajouterUneBase } from './state.js';

/** La portée de fondation, au carré — jamais de racine (lot EUCLIDE). */
export const PORTEE_CARREE = FONDATION.porteeMaxCases * FONDATION.porteeMaxCases;


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
 * Les huit codes, dans l'ordre où ils se rencontrent : `hors-carte`,
 * `recherche-manquante`, `points-insuffisants`, `trop-loin`, `voisinage`,
 * `case-occupee`, `sur-un-poi`, `territoire-ennemi`.
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

  // ⚠⚠ ETHAN EST REVENU DESSUS LE 08/09, ET CE BLOC AVAIT PRÉVU LE GESTE.
  // Il disait : « seule la case EXACTE d'une base existante est refusée, et
  // c'est arbitré — Ethan, 02/09 : fonder dans son PROPRE territoire est
  // autorisé, conséquence signalée et acceptée : deux bases du joueur peuvent
  // être adjacentes. Il avait d'abord appelé cela un exploit, puis tranché
  // autrement. Si Ethan revient dessus, c'est ce `=== 0` qui devient un rayon. »
  //
  // C'est fait : « 8 cases autour peu importe le territoire, aucune base
  // joueur/ouvrage ne doit être côte à côte sur les 9 cases ». Le `=== 0` EST
  // devenu un rayon, et il a changé de camp en même temps — la règle ne
  // distingue plus les bases du joueur de celles de l'Ouvrage, ni le territoire
  // qui tient la case.
  //
  // ⚠⚠ ET LE RAYON N'EST PAS ÉCRIT ICI, PARCE QUE LE DÉPLACEMENT LE LIT AUSSI.
  // `problemesDuDeplacement` appelle la MÊME fonction : sans elle, le joueur
  // fonderait loin, puis déplacerait sa base juste à côté de l'Ouvrage au geste
  // suivant, et la règle ne vaudrait plus rien. Voir `sim/voisinage-des-bases.js`.
  //
  // ⚠⚠ ET LA CASE EXACTE GARDE SON REFUS PROPRE, DES DEUX CÔTÉS. Le voisinage
  // couvre le 3 × 3 CENTRE COMPRIS, donc il parle aussi sur la case elle-même ;
  // mais « une de tes bases est DÉJÀ LÀ » et « il faut une case libre entre
  // deux bases » ne disent pas la même chose au joueur, et la première est la
  // plus utile quand c'est elle qui s'applique. Le bloc ci-dessous est donc
  // conservé, et son pendant Ouvrage juste en dessous aussi : sur la case
  // exacte, le joueur lit DEUX raisons, et les deux sont vraies. C'est la règle
  // « on rassemble, on ne s'arrête pas au premier », prise à l'endroit.
  if (carre === 0) {
    problemes.push({ code: 'case-occupee', message: 'Une de tes bases est déjà là.' });
  }

  for (const p of problemesDuVoisinageDesBases(etat, cible)) problemes.push(p);

  const site = siteDeLaCase(etat, cible.rangee, cible.colonne);
  if (site !== null && !TYPES_ECRASABLES.has(site.type)) {
    problemes.push({
      code: 'case-occupee',
      message: 'Une base de l\'Ouvrage occupe cette case.',
    });
  }

  // ⚠⚠ CE MODULE LIT LA CARTE, IL NE LA REFAIT PLUS — lot CONQUÊTE-24H,
  // 07/09/2026, ET C'EST LE §4 DU BRIEF. Il portait sa propre boucle : quarante-
  // neuf cases interrogées autour de la cible, `estBaseOuvrage` puis
  // `siteDeLaCase`, pour redemander « une base de l'Ouvrage est-elle À PORTÉE ».
  // Trois choses s'y jouaient de travers :
  //
  //   1. il ne voyait pas les RUINES — elles ne sont pas des bases, et une case
  //      tenue par une ruine du joueur doit être fondable ;
  //   2. il demandait la PORTÉE quand la carte, depuis TERRITOIRE-FORCE, répond
  //      la PROPRIÉTÉ : une case atteinte par une base de l'Ouvrage mais tenue
  //      par le joueur était refusée alors que la carte la montrait alliée ;
  //   3. c'était une seconde écriture du territoire, la faute que ce dépôt a
  //      déjà retirée deux fois — de `points-attaque.js` à EUCLIDE, des POI à
  //      TERRITOIRE-LU.
  //
  // ⚠⚠ CONSÉQUENCE MESURÉE ET ASSUMÉE : LE REFUS SE DESSERRE. Fonder est
  // désormais permis partout où l'Ouvrage ne TIENT pas, y compris à deux cases
  // d'une de ses petites bases si le joueur y est plus fort. C'est la même
  // bascule que la récolte des POI a subie au lot précédent, et c'est ce
  // qu'Ethan a demandé le 07/09 : « le territoire de 24 h sert à fonder ».
  //
  // ⚠ ET LE MESSAGE NE PARLE PLUS DE TROIS CASES, parce que ce n'est plus
  // une distance. Il dit ce que le refus dit vraiment : la case est à eux.
  if (poiDeLaCase(etat.graine, cible.rangee, cible.colonne) !== null) {
    problemes.push({
      code: 'sur-un-poi',
      message: 'On ne fonde pas sur un gisement : il serait perdu.',
    });
  }

  if (campDeLaCase(etat, cible.rangee, cible.colonne) === OUVRAGE) {
    problemes.push({
      code: 'territoire-ennemi',
      message: 'Cette case est tenue par l\'Ouvrage.',
    });
  }
  return problemes;
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
    retirerLeSite(etat, site, JOUEUR);
    siteDetruit = site;
  }

  // --- la base neuve, par le même code que la première ----------------------
  const indice = ajouterUneBase(etat, cible);
  etat.baseCourante = indice;
  return { indice, butin, siteDetruit };
}
