// Lot CONQUÊTE-24H — une base rasée tient le terrain vingt-quatre heures.
//
// Arbitrage d'Ethan du 07/09, point 13 : « pendant 24 h, la base rasée émet le
// territoire du vainqueur, du niveau de la base rasée. Après, la ruine
// disparaît, et les territoires sont recalculés. »
//
// ⚠⚠ CE FICHIER CHERCHE UNE SEULE FAUTE, ET LA §10 DU BRIEF LA NOMME : un
// endroit qui lit les ruines sans regarder leur expiration. C'est la seule façon
// dont ce lot peut mentir en silence — une carte juste au chargement et fausse
// une heure plus tard. Six des seize montages ci-dessous font donc la MÊME
// mesure deux fois, une fois la ruine fraîche et une fois périmée, et exigent
// deux réponses différentes.
//
// ⚠⚠ LES BASES DE L'OUVRAGE NE SE POSENT PAS OÙ L'ON VEUT : elles sont une
// fonction de la GRAINE. Tous les montages travaillent donc sur des cases
// RÉELLES de la graine 31 082 026, relevées avant d'être écrites, et rasent le
// voisinage plutôt que de forger une carte. `terrainNu` porte ce choix.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  creerEtat, serialiser, charger, migrer, SAVE_VERSION, tickJeu, rattraperJeu,
} from '../src/sim/state.js';
import { TICKS_PAR_HEURE } from '../src/sim/clock.js';
import {
  territoireDeLaFenetre, occupantDeLaCase, campDeLaCase, niveauDUneBaseDuJoueur,
  NEUTRE, JOUEUR, OUVRAGE, RAYONS,
} from '../src/sim/territoire.js';
import {
  caseRasee, ruineFraiche, ruineEstActive, ruinesActives, casesRasees,
  TICKS_DE_RUINE,
} from '../src/sim/ruines.js';
import { basesDeLaFenetre } from '../src/sim/peuplement.js';
import { niveauDeLaRangee } from '../src/sim/carte.js';
import { siteDeLaCase, ciblesAPortee } from '../src/sim/site-de-la-case.js';
import { retirerLeSite } from '../src/sim/site-entame.js';
import { poserLaBaseSur } from '../src/sim/deplacement.js';
import { problemesDeLaFondation } from '../src/sim/fondation.js';
import { poiDeLaCase, releverLesPoisAcquis } from '../src/sim/poi.js';
import { baseCourante } from '../src/sim/base-courante.js';
import { empreinteDeLaCarte, sitesDeLaFenetre } from '../src/ui/monde.js';
import {
  spriteDeLaRuine, dessinerRuineDUneCase, estDansLAtlas,
} from '../src/render/embleme.js';
import { palierDeNiveau } from '../src/data/sites.js';

const GRAINE = 31_082_026;
const T0 = 1_700_000_000_000;

// --- les cases relevées sur la graine ---------------------------------------
//
// ⚠ CHACUNE EST VÉRIFIÉE PAR UNE ASSERTION AVANT DE SERVIR. Une graine qui
// changerait ferait tomber le montage sur un message qui dit LEQUEL, au lieu de
// mesurer autre chose en silence.
const BASE_20 = { rangee: 200, colonne: 9 }; // niveau 20 — `niveauDeLaRangee(200)`
const BASE_17 = { rangee: 215, colonne: 16 }; // niveau 17
const BASE_10 = { rangee: 250, colonne: 17 }; // niveau 10
const VOISINE_20 = { rangee: 200, colonne: 12 }; // niveau 20, gardée debout
const POI_DE_LA_RUINE = { rangee: 202, colonne: 10 }; // à 2 cases de BASE_20
const LOIN = { rangee: 290, colonne: 16 }; // le joueur, hors de tout

/** Une bande de la carte, sur toute sa largeur. */
function bande(premiereRangee, derniereRangee) {
  return {
    premiereRangee, derniereRangee, premiereColonne: 1, derniereColonne: 31,
  };
}

/** Une fenêtre carrée centrée sur une case. */
function autour(centre, rayon) {
  return {
    premiereRangee: centre.rangee - rayon,
    derniereRangee: centre.rangee + rayon,
    premiereColonne: centre.colonne - rayon,
    derniereColonne: centre.colonne + rayon,
  };
}

/**
 * Rase toutes les bases de l'Ouvrage de la bande, SAUF celles qu'on nomme.
 *
 * ⚠⚠ AVEC `caseRasee`, DONC SANS REVENDICATION. Ces bases-là sont ÉCARTÉES du
 * montage, elles ne sont pas CONQUISES : leur donner une ruine fraîche
 * couvrirait la carte de territoire joueur et chaque test mesurerait la somme de
 * cinquante ruines au lieu de ce qu'il annonce. C'est le même choix que
 * `seuleBaseOuvrage` de `territoire.test.js`, pour la même raison.
 *
 * ⚠ LA BANDE DOIT DÉBORDER DE TROIS CASES LA FENÊTRE OBSERVÉE. Une base de
 * l'Ouvrage peint jusqu'à trois cases : une base juste hors bande peindrait
 * dedans, et le compte serait faux sans que rien ne le dise.
 */
function terrainNu(etat, zone, sauf = []) {
  const gardees = new Set(sauf.map((g) => `${g.rangee}:${g.colonne}`));
  for (const b of basesDeLaFenetre(etat.graine, zone)) {
    if (gardees.has(`${b.rangee}:${b.colonne}`)) continue;
    etat.basesRasees.push(caseRasee(b.rangee, b.colonne));
  }
  return etat;
}

/** Une base du joueur posée où l'on veut, au niveau de bâtiments voulu. */
function joueurAu(etat, position, niveau = 1) {
  etat.bases[0].position = { ...position };
  etat.bases[0].disposition = etat.bases[0].disposition.map((b) => ({ ...b, niveau }));
  assert.equal(niveauDUneBaseDuJoueur(etat.bases[0]), niveau,
    'le montage ne donne pas à la base du joueur le niveau qu\'il croit');
  return etat;
}

/** Compte les cases d'un camp sur une carte d'occupation. */
function compter(carte, camp) {
  let n = 0;
  for (const v of carte.occupant) if (v === camp) n += 1;
  return n;
}

/** Le montage commun de T1, T5, T6, T7, T8 : une seule base, rasée par le joueur. */
function uneSeuleBase(cible = BASE_20) {
  const etat = creerEtat(GRAINE);
  joueurAu(etat, LOIN);
  terrainNu(etat, bande(cible.rangee - 10, cible.rangee + 10), [cible]);
  const identite = siteDeLaCase(etat, cible.rangee, cible.colonne);
  assert.equal(identite?.type, 'base',
    `la graine ne porte plus de base de l'Ouvrage en ${cible.rangee}:${cible.colonne}`);
  assert.equal(identite.niveau, niveauDeLaRangee(cible.rangee));
  return { etat, identite };
}

// ---------------------------------------------------------------------------
// C24 T1 — une ruine fraîche émet pour le vainqueur
// ---------------------------------------------------------------------------

test('C24 T1 — une base rasée émet le territoire du JOUEUR, sur son octogone', () => {
  const { etat, identite } = uneSeuleBase();
  assert.equal(identite.niveau, 20, 'la rangée 200 ne vaut plus le niveau 20');
  const fenetre = autour(BASE_20, 6);

  // ⚠ AVANT : la base debout peint les 37 cases de l'octogone de l'OUVRAGE, et
  // le joueur n'a rien. Sans cette moitié, le montage ne dirait pas ce qui a
  // changé — il dirait seulement ce qu'il y a à la fin.
  const avant = territoireDeLaFenetre(etat, fenetre);
  assert.equal(compter(avant, OUVRAGE), 37, 'la base debout ne peint pas son octogone');
  assert.equal(compter(avant, JOUEUR), 0, 'le joueur peint déjà quelque chose ici');

  retirerLeSite(etat, identite, JOUEUR);

  // ⚠⚠ APRÈS : la case et son octogone reviennent au joueur — **37 cases**, et
  // c'est la SECONDE lecture qui s'applique depuis le 10/09 : LA RUINE ÉMET AU
  // RAYON DE CE QU'ELLE ÉTAIT, jamais à celui du camp qui la tient. Le §1 du lot
  // CONQUÊTE-24H avait pris l'autre — « la ruine prend la portée du camp pour
  // lequel elle émet », 21 cases — en la déclarant réversible et en annonçant
  // qu'elle rendrait 37 dans l'autre sens. Elle est retournée : une base de
  // l'Ouvrage rasée garde l'emprise d'une base de l'Ouvrage, ce que le joueur a
  // sous les yeux au moment où il la rase.
  // ⚠⚠ TÉMOIN DE CALIBRAGE, VALEUR ARBITRÉE PAR ETHAN LE 10/09 : à réaligner
  // au prochain arbitrage, et jamais à opposer à celui qui viendra. Ce nombre
  // encode un réglage de territoire, pas une propriété du moteur.
  const apres = territoireDeLaFenetre(etat, fenetre);
  assert.equal(compter(apres, JOUEUR), 37, 'la ruine n\'émet pas l\'octogone de ce qu\'elle ÉTAIT');
  assert.equal(compter(apres, OUVRAGE), 0, 'la base rasée peint encore pour l\'Ouvrage');
  assert.equal(occupantDeLaCase(apres, BASE_20.rangee, BASE_20.colonne), JOUEUR);

  // ⚠ ET LA QUESTION D'UNE SEULE CASE RÉPOND COMME LA CARTE. Les deux fonctions
  // ont deux boucles différentes ; deux vérités sur la même case seraient la
  // divergence que TERRITOIRE-LU vient de refermer.
  for (const [dr, dc] of [[0, 0], [2, 0], [1, 1], [2, 2], [3, 0]]) {
    assert.equal(
      campDeLaCase(etat, BASE_20.rangee + dr, BASE_20.colonne + dc),
      occupantDeLaCase(apres, BASE_20.rangee + dr, BASE_20.colonne + dc),
      `la carte et la case divergent en +${dr},+${dc}`,
    );
  }

  // ⚠⚠ ET LA RUINE GARDE SA PROPRE CASE, COÛTE QUE COÛTE — ASSERTION RETOURNÉE
  // LE 10/09, PAS RETIRÉE. Le lot CONQUÊTE-24H avait lu l'inverse : « une ruine
  // n'est pas une base, donc pas de plancher », si bien qu'une ruine pouvait
  // perdre le carré qu'elle occupe. Ethan, 10/09 : « quoi qu'il arrive la ruine
  // conserve son carré original… juste le petit carré, même pas l'octogone ».
  // Le plancher porte donc sur LA SEULE CASE de la ruine, et il s'arrête là :
  // le reste de son octogone se dispute comme n'importe quel autre.
  //
  // ⚠ LE MONTAGE EST CELUI QUI FAISAIT PERDRE LA CASE, MOT POUR MOT, et c'est ce
  // qui rend le retournement falsifiable : ruine du joueur à 20 sur sa case,
  // ruine de l'Ouvrage à 25 posée juste à côté. Sans le plancher, la case revient
  // à l'Ouvrage — c'est ce que ces deux assertions mesuraient hier.
  etat.basesRasees.push(ruineFraiche(
    BASE_20.rangee + 1, BASE_20.colonne, 'baseJoueur', OUVRAGE, 25, etat.horloge.nbTicks,
  ));
  assert.equal(campDeLaCase(etat, BASE_20.rangee, BASE_20.colonne), JOUEUR,
    'la ruine perd sa propre case : le plancher ne s\'applique plus aux ruines');
  assert.equal(
    occupantDeLaCase(territoireDeLaFenetre(etat, fenetre), BASE_20.rangee, BASE_20.colonne),
    JOUEUR,
    'la carte refuse à la ruine le plancher que la case lui donne',
  );

  // ⚠⚠ ET LE PLANCHER S'ARRÊTE AU CARRÉ : LA CASE VOISINE, ELLE, SE PERD. Sans
  // cette moitié, un plancher élargi à tout l'octogone passerait l'assertion
  // ci-dessus sans qu'un seul test ne bronche — et il rendrait une ruine
  // INDÉLOGEABLE sur trente-sept cases.
  assert.equal(campDeLaCase(etat, BASE_20.rangee + 1, BASE_20.colonne), OUVRAGE,
    'le plancher de la ruine déborde de son propre carré');
});

// ---------------------------------------------------------------------------
// C24 T2 — elle émet AU NIVEAU DE LA RASÉE
// ---------------------------------------------------------------------------

test('C24 T2 — la ruine émet au niveau de la base rasée, pas à un autre', () => {
  // ⚠⚠ LE MONTAGE DU BRIEF NE SE CONSTRUIT PAS AVEC DEUX BASES DE L'OUVRAGE, ET
  // C'EST MESURÉ. Il demande « une base de niveau 20 près d'une base Ouvrage de
  // niveau 18 » : or le niveau d'une base de l'Ouvrage est celui de sa RANGÉE,
  // à `GEOGRAPHIE.niveauParCase = 0,2` niveau par case, soit **cinq rangées par
  // niveau**. Deux niveaux d'écart valent dix rangées, et le plus grand rayon
  // d'influence en vaut trois : leurs octogones ne se rencontrent jamais. Ce que
  // le brief décrit ne peut donc pas se peindre avec deux bases.
  //
  // ⚠⚠ ON LE CONSTRUIT AVEC UNE RUINE DE L'OUVRAGE, ET C'EST LÉGITIME : la règle
  // est symétrique (§1 du brief, `C24 T4`), une ruine est un émetteur de plein
  // droit, et son niveau se choisit puisqu'il est STOCKÉ. L'adversaire vaut donc
  // 18 exactement, comme le brief le voulait — 17 depuis le 10/09, voir ci-dessous.
  //
  // ⚠⚠ ET LE MONTAGE TOURNE DEUX FOIS, SUR DEUX BASES DE NIVEAUX DIFFÉRENTS.
  // C'est ce qui distingue « le niveau de la rasée » de n'importe quelle autre
  // valeur : à 20 la ruine l'emporte, à 17 elle perd, TOUT LE RESTE ÉTANT ÉGAL —
  // même géométrie, même adversaire, même vainqueur. Un code qui émettrait au
  // niveau du VAINQUEUR (le joueur est à 1), à un niveau fixe, ou au niveau de la
  // rangée LUE AILLEURS rendrait deux fois la même réponse.
  //
  // ⚠⚠ L'ADVERSAIRE PASSE DE 18 À 17 LE 10/09, ET C'EST LE MONTAGE QU'ON RÉPARE,
  // JAMAIS L'ASSERTION. Le niveau de la rasée n'a pas bougé — c'est la FORCE
  // qu'un niveau porte qui a changé : `raisonDeNiveau` vaut 7/5 et non plus 2,
  // donc un niveau de plus ne DOUBLE plus, et une case d'écart continue de
  // diviser par deux. Mesuré sur `forceDUneBase` : contre un 18, la ruine de 20
  // perd comme celle de 17, et le test cesse alors de distinguer quoi que ce
  // soit — c'est-à-dire qu'il passerait au vert sur un code qui émettrait au
  // niveau du vainqueur. Contre **17**, il départage à nouveau, et il le fait
  // par les deux bouts : trois niveaux d'avance battent une case de retard,
  // l'égalité de niveau non.
  // ⚠ TÉMOIN DE CALIBRAGE, VALEUR ARBITRÉE PAR ETHAN LE 10/09 : à réaligner au
  // prochain arbitrage, jamais à opposer à celui qui viendra.
  const verdict = (cible) => {
    const { etat, identite } = uneSeuleBase(cible);
    const poste = { rangee: cible.rangee + 3, colonne: cible.colonne };
    const disputee = { rangee: cible.rangee + 2, colonne: cible.colonne };
    retirerLeSite(etat, identite, JOUEUR);
    etat.basesRasees.push(
      ruineFraiche(poste.rangee, poste.colonne, 'baseJoueur', OUVRAGE, 17,
        etat.horloge.nbTicks),
    );
    return {
      niveau: identite.niveau,
      camp: campDeLaCase(etat, disputee.rangee, disputee.colonne),
    };
  };

  const fort = verdict(BASE_20);
  assert.equal(fort.niveau, 20, 'la rangée 200 ne vaut plus le niveau 20');
  assert.equal(fort.camp, JOUEUR, 'la ruine de niveau 20 ne l\'emporte pas sur un 17');

  const faible = verdict(BASE_17);
  assert.equal(faible.niveau, 17, 'la rangée 215 ne vaut plus le niveau 17');
  assert.equal(faible.camp, OUVRAGE, 'la ruine de niveau 17 l\'emporte sur un 17 plus proche');
});

// ---------------------------------------------------------------------------
// C24 T3 — elle s'additionne
// ---------------------------------------------------------------------------

test('C24 T3 — une ruine de 10 et une base de 10 valent un 11 face à l\'Ouvrage', () => {
  // ⚠⚠ C'EST LE TEST QUI TRAITE LA RUINE COMME UN ÉMETTEUR DE PLEIN DROIT.
  // « Sa contribution s'additionne à celle des autres bases de ce camp, comme
  // n'importe quelle base » — §1 du brief. `2¹⁰ + 2¹⁰ = 2¹¹`, exactement, et
  // l'égalité va au joueur depuis TERRITOIRE-FORCE.
  //
  // La géométrie, toutes les forces à distance 1 de la case disputée :
  //   ruine du joueur, niveau 10   →  2^(10−1+3) = 2¹²
  //   base du joueur, niveau 10    →  2^(10−1+3) = 2¹²          somme : 2¹³
  //   ruine de l'Ouvrage, niveau 11 →  2^(11−1+3) = 2¹³
  const etat = creerEtat(GRAINE);
  const disputee = { rangee: 251, colonne: 17 };
  const posteOuvrage = { rangee: 251, colonne: 18 };
  joueurAu(etat, { rangee: 252, colonne: 17 }, 10);
  terrainNu(etat, bande(230, 272), [BASE_10]);

  const identite = siteDeLaCase(etat, BASE_10.rangee, BASE_10.colonne);
  assert.equal(identite?.type, 'base', 'la graine ne porte plus de base en 250:17');
  assert.equal(identite.niveau, 10, 'la rangée 250 ne vaut plus le niveau 10');
  retirerLeSite(etat, identite, JOUEUR);
  const posee = etat.horloge.nbTicks;

  // ⚠⚠ LES DEUX RUINES NE NAISSENT PAS AU MÊME TICK, ET C'EST CE QUI REND LE
  // MORDANT RÉEL. Il consiste à faire tomber la case quand la ruine du JOUEUR se
  // tait ; si les deux expiraient ensemble, la case reviendrait au joueur par
  // forfait et le test passerait pour une mauvaise raison — mesuré, il passait.
  // Cent ticks d'écart suffisent, et ils éprouvent au passage que l'expiration
  // se compte PAR ENTRÉE et non pour la liste entière.
  rattraperJeu(etat, 100);
  etat.basesRasees.push(
    ruineFraiche(posteOuvrage.rangee, posteOuvrage.colonne, 'baseJoueur', OUVRAGE, 11,
      etat.horloge.nbTicks),
  );

  assert.equal(campDeLaCase(etat, disputee.rangee, disputee.colonne), JOUEUR,
    'la ruine ne s\'additionne pas à la base : le 11 de l\'Ouvrage l\'emporte');

  // ⚠⚠ ET SANS LA RUINE, LA CASE TOMBE — c'est le mordant du montage. La base du
  // joueur SEULE ne pèse que 2¹², la moitié de ce qu'il faut. On ne retire pas
  // l'entrée : on la fait EXPIRER, ce qui éprouve la lecture au lieu de la purge.
  rattraperJeu(etat, TICKS_DE_RUINE - 100);
  assert.equal(etat.horloge.nbTicks - posee, TICKS_DE_RUINE,
    'le rattrapage n\'a pas amené la ruine du joueur à son échéance exacte');
  assert.deepEqual(baseCourante(etat).position, { rangee: 252, colonne: 17 },
    'la base du joueur a bougé pendant le rattrapage : le montage mesure autre chose');
  assert.equal(ruinesActives(etat).length, 1,
    'les deux ruines ont expiré ensemble : le mordant ne mesure plus rien');
  assert.equal(campDeLaCase(etat, disputee.rangee, disputee.colonne), OUVRAGE,
    'montage sans mordant : la base du joueur suffisait déjà');
});

// ---------------------------------------------------------------------------
// C24 T4 — la symétrie
// ---------------------------------------------------------------------------

test('C24 T4 — une base rasée par l\'OUVRAGE émet pour l\'Ouvrage', () => {
  // ⚠⚠ AUCUN CHEMIN DU DÉPÔT NE PRODUIT CETTE RUINE AUJOURD'HUI, ET C'EST MESURÉ
  // AU RAPPORT. `raserLaBase` de `sim/raid-ouvrage.js` REDÉPLOIE la base du
  // joueur vingt cases plus au sud et lui vide ses stocks ; elle n'est jamais
  // RETIRÉE, donc elle ne laisse rien. La règle est écrite quand même — §1 du
  // brief — parce qu'elle ne coûte pas une ligne de plus et qu'elle sera juste le
  // jour où le chemin arrivera.
  //
  // ⚠ ON PASSE PAR LE VRAI ÉCRIVAIN, `retirerLeSite`, avec l'autre camp. C'est
  // exactement ce qu'il y aura à appeler ce jour-là ; forger l'entrée à la main
  // ne prouverait que la lecture.
  const { etat, identite } = uneSeuleBase();
  const fenetre = autour(BASE_20, 6);
  retirerLeSite(etat, identite, OUVRAGE);

  assert.equal(siteDeLaCase(etat, BASE_20.rangee, BASE_20.colonne), null,
    'la base rasée est encore sur la carte');
  const apres = territoireDeLaFenetre(etat, fenetre);
  assert.equal(compter(apres, OUVRAGE), 37,
    'la ruine de l\'Ouvrage ne tient pas le terrain de son camp');
  assert.equal(compter(apres, JOUEUR), 0);
  assert.equal(occupantDeLaCase(apres, BASE_20.rangee, BASE_20.colonne), OUVRAGE);

  // ⚠⚠ ET CE COMMENTAIRE A CHANGÉ DE SENS LE 10/09, IL N'A PAS ÉTÉ RETIRÉ. Il
  // opposait « 37 cases contre 21 » à `T1`, au temps où une ruine prenait la
  // portée du camp qui la TIENT ; elle prend désormais celle de ce qu'elle
  // ÉTAIT, donc `T1` rend 37 lui aussi. Ce que ce test-ci garde encore, et qui
  // est la moitié qui compte, c'est que les DEUX rayons existent et diffèrent :
  // sans cela, `T1` et `T5` compteraient 37 pour une raison qui n'en est pas une.
  assert.equal(RAYONS[OUVRAGE], 3);
  assert.notEqual(RAYONS[JOUEUR], RAYONS[OUVRAGE]);

  // Le mordant : à l'expiration, il ne reste rien du tout.
  etat.horloge.nbTicks += TICKS_DE_RUINE;
  const expire = territoireDeLaFenetre(etat, fenetre);
  assert.equal(compter(expire, OUVRAGE), 0, 'la ruine de l\'Ouvrage n\'expire pas');
  assert.equal(compter(expire, NEUTRE), expire.occupant.length);
});

// ---------------------------------------------------------------------------
// C24 T5 et T6 — le seuil, gardé par ses DEUX côtés
// ---------------------------------------------------------------------------

test('C24 T5 — à 24 h moins un tick, la ruine émet encore', () => {
  const { etat, identite } = uneSeuleBase();
  retirerLeSite(etat, identite, JOUEUR);
  const pose = etat.horloge.nbTicks;

  rattraperJeu(etat, TICKS_DE_RUINE - 1);
  assert.equal(etat.horloge.nbTicks - pose, TICKS_DE_RUINE - 1,
    'le rattrapage n\'a pas avancé l\'horloge d\'autant qu\'on croit');
  assert.deepEqual(baseCourante(etat).position, LOIN,
    'la base du joueur a bougé pendant le rattrapage : le montage mesure autre chose');

  // ⚠⚠ CE TEST TOMBE SUR UN COMPTE DE CASES, JAMAIS SUR UN SEUIL D'HORLOGE —
  // vérifié avant de toucher au montage. `TICKS_DE_RUINE` n'a pas bougé d'un
  // tick, et `C24 T6` garde l'autre côté du seuil : ce qui change ici est le
  // nombre de cases qu'une ruine peint, parce qu'elle émet désormais au rayon
  // de ce qu'elle ÉTAIT — 21 hier, **37** aujourd'hui.
  // ⚠ TÉMOIN DE CALIBRAGE, VALEUR ARBITRÉE PAR ETHAN LE 10/09 : à réaligner au
  // prochain arbitrage, jamais à opposer à celui qui viendra.
  const carte = territoireDeLaFenetre(etat, autour(BASE_20, 6));
  assert.equal(compter(carte, JOUEUR), 37, 'la ruine s\'est tue avant l\'heure');
});

test('C24 T6 — à 24 h pile, la ruine ne dit plus rien', () => {
  // ⚠⚠ LES DEUX TESTS, PAS UN : un seuil ne se garde que par ses deux côtés. Un
  // `<=` au lieu d'un `<` passe `T5` sans un mot et tombe ici, et l'inverse
  // aussi. C'est la vingt-quatrième heure COMPRISE, pas la suivante.
  const { etat, identite } = uneSeuleBase();
  retirerLeSite(etat, identite, JOUEUR);

  rattraperJeu(etat, TICKS_DE_RUINE);
  const carte = territoireDeLaFenetre(etat, autour(BASE_20, 6));
  assert.equal(compter(carte, JOUEUR), 0, 'la ruine émet encore à 24 h pile');
  assert.equal(compter(carte, OUVRAGE), 0, 'la base rasée est revenue');

  // Et la case, elle, reste retirée — c'est `T8`, vérifié ici aussi parce que
  // c'est la seule chose qui distingue une ruine périmée d'un terrain vierge.
  assert.equal(siteDeLaCase(etat, BASE_20.rangee, BASE_20.colonne), null);
});

// ---------------------------------------------------------------------------
// C24 T7 — l'expiration survit au hors-ligne
// ---------------------------------------------------------------------------

test('C24 T7 — vingt-cinq heures hors ligne, en UNE fois, et la ruine est morte', () => {
  // ⚠⚠ LE VRAI CHEMIN DU HORS-LIGNE, PAS UNE BOUCLE : `serialiser` puis `charger`
  // vingt-cinq heures plus tard. Aucun tick n'a été joué entre les deux ; c'est
  // `charger` qui rattrape, et l'expiration doit être vraie AU PREMIER APPEL qui
  // suit. Une file d'expirations à traiter tick par tick aurait eu besoin de son
  // propre rattrapage — c'est ce que le §3 du brief interdit d'écrire.
  const etat = creerEtat(GRAINE);
  terrainNu(etat, bande(190, 210), [BASE_20]);
  const identite = siteDeLaCase(etat, BASE_20.rangee, BASE_20.colonne);
  retirerLeSite(etat, identite, JOUEUR);

  const fenetre = autour(BASE_20, 6);
  // ⚠⚠ CE TEST TOMBE SUR UN COMPTE DE CASES, JAMAIS SUR UN SEUIL D'HORLOGE —
  // vérifié avant de toucher au montage. `TICKS_DE_RUINE` n'a pas bougé d'un
  // tick, et `C24 T6` garde l'autre côté du seuil : ce qui change ici est le
  // nombre de cases qu'une ruine peint, parce qu'elle émet désormais au rayon
  // de ce qu'elle ÉTAIT — 21 hier, **37** aujourd'hui.
  // ⚠ TÉMOIN DE CALIBRAGE, VALEUR ARBITRÉE PAR ETHAN LE 10/09 : à réaligner au
  // prochain arbitrage, jamais à opposer à celui qui viendra.
  assert.equal(compter(territoireDeLaFenetre(etat, fenetre), JOUEUR), 37,
    'montage sans mordant : la ruine n\'émettait déjà rien');

  const json = serialiser(etat, T0);
  const revenu = charger(json, T0 + 25 * 3600 * 1000);
  assert.ok(revenu.horloge.nbTicks - etat.horloge.nbTicks >= 25 * TICKS_PAR_HEURE,
    'le rattrapage n\'a pas eu lieu : le montage ne mesure pas le hors-ligne');
  assert.equal(compter(territoireDeLaFenetre(revenu, fenetre), JOUEUR), 0,
    'une ruine créée avant la nuit émet encore au retour');

  // ⚠ ET UNE NUIT PLUS COURTE NE LA TUE PAS. Sans ce second chargement, un code
  // qui expirerait TOUT au chargement passerait le premier.
  const tot = charger(json, T0 + 23 * 3600 * 1000);
  assert.equal(compter(territoireDeLaFenetre(tot, fenetre), JOUEUR), 37,
    'la ruine a expiré au bout de vingt-trois heures');
});

// ---------------------------------------------------------------------------
// C24 T8 — la case reste retirée après expiration
// ---------------------------------------------------------------------------

test('C24 T8 — la case reste retirée après l\'expiration, pour toujours', () => {
  // ⚠⚠ NON-RÉGRESSION, ET C'EST LE PIÈGE SYMÉTRIQUE DE CELUI DU §10. Le lot
  // demande à une lecture de `basesRasees` de regarder l'horloge ; si l'AUTRE
  // lecture s'y mettait aussi, toutes les bases rasées reparaîtraient
  // vingt-quatre heures après l'avoir été. Une base rasée ne revient JAMAIS.
  const { etat, identite } = uneSeuleBase();
  retirerLeSite(etat, identite, JOUEUR);
  const entree = etat.basesRasees.at(-1);

  assert.equal(siteDeLaCase(etat, BASE_20.rangee, BASE_20.colonne), null);
  rattraperJeu(etat, 30 * 24 * TICKS_PAR_HEURE);
  assert.equal(ruineEstActive(entree, etat.horloge.nbTicks), false,
    'la ruine est encore active un mois plus tard');
  assert.equal(siteDeLaCase(etat, BASE_20.rangee, BASE_20.colonne), null,
    'la base rasée est revenue une fois sa ruine périmée');
  assert.ok(casesRasees(etat).has(`${BASE_20.rangee}:${BASE_20.colonne}`),
    'la case a quitté la liste des rasées');
});

// ---------------------------------------------------------------------------
// C24 T9 — on peut fonder sur une case tenue par une ruine
// ---------------------------------------------------------------------------

test('C24 T9 — une case tenue par une ruine du joueur devient fondable', () => {
  // ⚠⚠ LA CASE EST DISPUTÉE, ET C'EST TOUT L'INTÉRÊT. `VOISINE_20` reste DEBOUT
  // à deux cases de la case visée ; sans la ruine, elle la tient et fonder est
  // refusé. La ruine, à une case, pèse deux fois plus et la lui prend :
  //   ruine niveau 20 à 1 case  →  2^(20−1+3) = 2²²
  //   base  niveau 20 à 2 cases →  2^(20−2+3) = 2²¹
  // Un montage qui aurait simplement rasé la seule base du coin n'aurait rien
  // prouvé du territoire : il aurait prouvé qu'une base absente ne refuse rien.
  const visee = { rangee: 200, colonne: 10 };
  const etat = creerEtat(GRAINE);
  joueurAu(etat, { rangee: 208, colonne: 10 });
  terrainNu(etat, bande(190, 215), [BASE_20, VOISINE_20]);

  const refus = () => problemesDeLaFondation(etat, visee)
    .some((p) => p.code === 'territoire-ennemi');

  assert.equal(refus(), true, 'montage sans mordant : la case était déjà libre');
  const identite = siteDeLaCase(etat, BASE_20.rangee, BASE_20.colonne);
  retirerLeSite(etat, identite, JOUEUR);
  assert.equal(campDeLaCase(etat, visee.rangee, visee.colonne), JOUEUR);
  assert.equal(refus(), false, 'la case tenue par la ruine reste « territoire-ennemi »');

  // ⚠ ET LE REFUS REVIENT À L'EXPIRATION, sans qu'on ait rien purgé. C'est la
  // preuve que `fondation.js` LIT la carte au lieu de la retenir.
  etat.horloge.nbTicks += TICKS_DE_RUINE;
  assert.equal(campDeLaCase(etat, visee.rangee, visee.colonne), OUVRAGE);
  assert.equal(refus(), true, 'la case reste fondable une fois la ruine périmée');
});

// ---------------------------------------------------------------------------
// C24 T10 — une ruine donne ses POI
// ---------------------------------------------------------------------------

test('C24 T10 — un gisement tenu par la seule ruine est récolté', () => {
  // ⚠⚠ LA BASE DU JOUEUR EST À QUATRE-VINGT-DIX RANGÉES DE LÀ. Le gisement n'est
  // dans l'octogone d'AUCUNE de ses bases : s'il est récolté, c'est que la
  // récolte part des ÉMETTEURS et pas de `etat.bases`. C'est le défaut que le §4
  // du brief annonçait — « si `releverLesPoisAcquis` boucle sur `etat.bases`, les
  // ruines n'y sont pas » —, et il y était.
  const etat = creerEtat(GRAINE);
  joueurAu(etat, LOIN);
  terrainNu(etat, bande(190, 212), [BASE_20]);
  const gisement = poiDeLaCase(etat.graine, POI_DE_LA_RUINE.rangee, POI_DE_LA_RUINE.colonne);
  assert.ok(gisement !== null, 'la graine ne porte plus de gisement en 202:10');

  tickJeu(etat);
  assert.equal(etat.poisAcquis.length, 0,
    'montage sans mordant : le gisement était déjà acquis avant le rasage');

  retirerLeSite(etat, siteDeLaCase(etat, BASE_20.rangee, BASE_20.colonne), JOUEUR);
  assert.equal(campDeLaCase(etat, POI_DE_LA_RUINE.rangee, POI_DE_LA_RUINE.colonne), JOUEUR,
    'la ruine ne tient pas la case du gisement');
  assert.equal(releverLesPoisAcquis(etat), 1, 'la ruine ne donne pas son gisement');
  assert.deepEqual(etat.poisAcquis, [{ type: gisement.type, bande: gisement.bande }]);
});

// ---------------------------------------------------------------------------
// C24 T11 — un POI pris reste pris
// ---------------------------------------------------------------------------

test('C24 T11 — le gisement reste acquis quand la ruine expire', () => {
  // Arbitrage d'Ethan du 07/09 : « un poi pris est validé de façon permanente ».
  const etat = creerEtat(GRAINE);
  joueurAu(etat, LOIN);
  terrainNu(etat, bande(190, 212), [BASE_20]);
  retirerLeSite(etat, siteDeLaCase(etat, BASE_20.rangee, BASE_20.colonne), JOUEUR);
  releverLesPoisAcquis(etat);
  const pris = structuredClone(etat.poisAcquis);
  assert.equal(pris.length, 1, 'montage sans mordant : rien n\'a été récolté');

  rattraperJeu(etat, TICKS_DE_RUINE + 1);
  assert.equal(campDeLaCase(etat, POI_DE_LA_RUINE.rangee, POI_DE_LA_RUINE.colonne), NEUTRE,
    'la case du gisement est encore tenue : le montage ne mesure pas la perte');
  assert.deepEqual(etat.poisAcquis, pris, 'un gisement acquis a été rendu');
  releverLesPoisAcquis(etat);
  assert.deepEqual(etat.poisAcquis, pris, 'un relevé de plus a changé les acquis');
});

// ---------------------------------------------------------------------------
// C24 T12 — les anciennes sauvegardes se chargent, et n'émettent rien
// ---------------------------------------------------------------------------

test('C24 T12 — une v27 se charge, et ses bases rasées n\'émettent rien', () => {
  // ⚠ LA GARDE DU NUMÉRO APPARTIENT AU MAILLON LE PLUS RÉCENT, une seule fois —
  // la règle du dépôt depuis le lot SITE-ENTAMÉ. Elle vivait sous `SAT-R T11` à
  // `=== 27`, puis ici à `=== 28` ; elle est passée à `B4 T7` le 08/09, avec le
  // maillon v28 → v29 du lot BÂTIMENTS-QUATRE-ÉTATS. Ce qui RESTE ici est ce que
  // ce test-ci a toujours mesuré : que SON maillon existe encore.
  assert.ok(SAVE_VERSION >= 28, 'le maillon v27 → v28 n\'est plus dans la chaîne');

  const etat = creerEtat(GRAINE);
  terrainNu(etat, bande(190, 210), [BASE_20]);
  retirerLeSite(etat, siteDeLaCase(etat, BASE_20.rangee, BASE_20.colonne), JOUEUR);
  const fenetre = autour(BASE_20, 6);
  // ⚠⚠ CE TEST TOMBE SUR UN COMPTE DE CASES, JAMAIS SUR UN SEUIL D'HORLOGE —
  // vérifié avant de toucher au montage. `TICKS_DE_RUINE` n'a pas bougé d'un
  // tick, et `C24 T6` garde l'autre côté du seuil : ce qui change ici est le
  // nombre de cases qu'une ruine peint, parce qu'elle émet désormais au rayon
  // de ce qu'elle ÉTAIT — 21 hier, **37** aujourd'hui.
  // ⚠ TÉMOIN DE CALIBRAGE, VALEUR ARBITRÉE PAR ETHAN LE 10/09 : à réaligner au
  // prochain arbitrage, jamais à opposer à celui qui viendra.
  assert.equal(compter(territoireDeLaFenetre(etat, fenetre), JOUEUR), 37,
    'montage sans mordant : la v28 n\'émettait déjà rien');

  // La même partie, telle qu'une v27 l'aurait écrite : des CASES, rien d'autre.
  const v27 = JSON.parse(serialiser(etat, T0));
  v27.version = 27;
  v27.basesRasees = v27.basesRasees.map((e) => `${e.rangee}:${e.colonne}`);
  assert.ok(v27.basesRasees.every((e) => typeof e === 'string'), 'le montage n\'est pas une v27');

  const charge = charger(JSON.stringify(v27), T0);
  assert.equal(charge.version, SAVE_VERSION, 'la v27 ne se charge pas');
  assert.equal(charge.basesRasees.length, v27.basesRasees.length, 'des cases rasées ont disparu');
  assert.equal(compter(territoireDeLaFenetre(charge, fenetre), JOUEUR), 0,
    'une entrée héritée émet du territoire que personne n\'a conquis');
  assert.equal(siteDeLaCase(charge, BASE_20.rangee, BASE_20.colonne), null,
    'une base rasée sous la v27 est revenue');
});

// ---------------------------------------------------------------------------
// C24 T13 — aucun niveau inventé
// ---------------------------------------------------------------------------

test('C24 T13 — la migration n\'invente ni niveau ni vainqueur', () => {
  // ⚠⚠ UNE RUINE À QUI L'ON DONNERAIT UN NIVEAU PLAUSIBLE — celui de sa rangée,
  // par exemple — PEINDRAIT AU PREMIER CHARGEMENT UN TERRITOIRE QUE PERSONNE N'A
  // CONQUIS, et il durerait vingt-quatre heures.
  const migre = migrer({ version: 27, basesRasees: ['200:9', '215:16'] });
  assert.equal(migre.version, SAVE_VERSION);
  assert.deepEqual(migre.basesRasees, [
    { rangee: 200, colonne: 9 }, { rangee: 215, colonne: 16 },
  ]);
  for (const entree of migre.basesRasees) {
    assert.equal(entree.type, undefined, 'la migration a inventé un type de site');
    assert.equal(entree.vainqueur, undefined, 'la migration a inventé un vainqueur');
    assert.equal(entree.niveau, undefined, 'la migration a inventé un niveau');
    assert.equal(entree.tick, undefined, 'la migration a inventé une date de rasement');
  }
  assert.deepEqual(ruinesActives({ basesRasees: migre.basesRasees, horloge: { nbTicks: 0 } }), []);

  // ⚠ ET UNE REVENDICATION HÉRITÉE EST RETIRÉE, comme les v25 et v26 retirent
  // les champs malformés : une v27 ne peut pas en porter, un état fabriqué à la
  // main en montage, si.
  const tordue = migrer({
    version: 27,
    basesRasees: [{
      rangee: 200, colonne: 9, type: 'base', vainqueur: JOUEUR, niveau: 20, tick: 0,
    }],
  });
  assert.deepEqual(tordue.basesRasees, [{ rangee: 200, colonne: 9 }]);

  // Et ce qui ne tient pas sur la carte est retiré plutôt que recopié.
  assert.deepEqual(
    migrer({ version: 27, basesRasees: ['0:0', 'x:y', null, '200:9'] }).basesRasees,
    [{ rangee: 200, colonne: 9 }],
  );
});

// ---------------------------------------------------------------------------
// C24 T14 — une ruine expirée n'est JAMAIS comptée
// ---------------------------------------------------------------------------

test('C24 T14 — une entrée expirée non purgée est ignorée par la carte', () => {
  // ⚠⚠ LE TEST DU §3 DU BRIEF, ET LA RAISON D'ÊTRE DE `sim/ruines.js`. La purge
  // n'est pas seulement facultative ici : elle est INTERDITE — retirer l'entrée
  // ferait reparaître la base, qui est dérivée de la graine. La lecture est donc
  // le seul rempart, et ce montage vérifie qu'elle tient sans elle.
  const etat = creerEtat(GRAINE);
  joueurAu(etat, LOIN);
  terrainNu(etat, bande(190, 210), [BASE_20]);
  retirerLeSite(etat, siteDeLaCase(etat, BASE_20.rangee, BASE_20.colonne), JOUEUR);
  const avant = etat.basesRasees.length;

  rattraperJeu(etat, TICKS_DE_RUINE);
  assert.equal(etat.basesRasees.length, avant,
    'le lot purge : ce test ne mesure plus la lecture');
  assert.equal(ruinesActives(etat).length, 0, 'une entrée périmée est encore active');
  assert.equal(compter(territoireDeLaFenetre(etat, autour(BASE_20, 6)), JOUEUR), 0,
    'la carte compte une ruine périmée');
  assert.equal(campDeLaCase(etat, BASE_20.rangee, BASE_20.colonne), NEUTRE,
    'la case compte une ruine périmée');
});

// ---------------------------------------------------------------------------
// C24 T15 — une ruine n'est pas une base
// ---------------------------------------------------------------------------

test('C24 T15 — une ruine n\'est ni une base, ni une cible', () => {
  // §4 du brief : elle ne se déplace pas, ne s'améliore pas, ne compte pas dans
  // `BASE 1 / 1`, n'a ni disposition ni garnison, et ne peut pas être attaquée.
  const etat = creerEtat(GRAINE);
  poserLaBaseSur(etat, 206, 9);
  terrainNu(etat, bande(190, 215), [BASE_20]);
  const bases = etat.bases.length;

  const cible = (liste) => liste.some((c) => c.rangee === BASE_20.rangee
    && c.colonne === BASE_20.colonne);
  assert.equal(cible(ciblesAPortee(etat, baseCourante(etat))), true,
    'montage sans mordant : la base n\'était pas attaquable avant d\'être rasée');

  retirerLeSite(etat, siteDeLaCase(etat, BASE_20.rangee, BASE_20.colonne), JOUEUR);
  assert.equal(campDeLaCase(etat, BASE_20.rangee, BASE_20.colonne), JOUEUR,
    'la ruine ne tient même pas sa case : le montage ne mesure rien');

  assert.equal(etat.bases.length, bases, 'la ruine est entrée dans le compte des bases');
  assert.equal(etat.bases.some((b) => b.position.rangee === BASE_20.rangee
    && b.position.colonne === BASE_20.colonne), false, 'la ruine est entrée dans `bases`');
  assert.equal(cible(ciblesAPortee(etat, baseCourante(etat))), false,
    'une ruine est attaquable');
  assert.equal(siteDeLaCase(etat, BASE_20.rangee, BASE_20.colonne), null);
});

// ---------------------------------------------------------------------------
// C24 T16 — le déterminisme tient
// ---------------------------------------------------------------------------

test('C24 T16 — même graine, même séquence de rasements, même état', () => {
  const partie = (cibles) => {
    const etat = creerEtat(GRAINE);
    terrainNu(etat, bande(190, 260), cibles);
    for (const c of cibles) {
      rattraperJeu(etat, 100);
      retirerLeSite(etat, siteDeLaCase(etat, c.rangee, c.colonne), JOUEUR);
    }
    return serialiser(etat, T0);
  };

  assert.equal(partie([BASE_20, BASE_17]), partie([BASE_20, BASE_17]));
  // ⚠ MORDANT : l'ORDRE compte, donc le montage mesure bien une séquence. Les
  // ticks de rasement diffèrent, et c'est exactement ce que l'état retient.
  assert.notEqual(partie([BASE_20, BASE_17]), partie([BASE_17, BASE_20]));
  // Et une ruine se relit à l'identique après un aller-retour par le texte.
  const json = partie([BASE_20]);
  assert.equal(serialiser(charger(json, T0), T0), json);
});

// ---------------------------------------------------------------------------
// C24 T17 — le §8 du brief : l'empreinte du cache de carte porte les ruines
// ---------------------------------------------------------------------------

test('C24 T17 — l\'empreinte de la carte change quand une ruine expire', () => {
  // ⚠⚠ « LE PIÈGE LE PLUS DISCRET DU LOT », §8 DU BRIEF, ET IL EST RÉEL : mesuré
  // avant correction, `empreinteDeLaCarte` ne portait que `baseCourante`,
  // `prochaineInstanceSatellite` et le nombre de satellites par base. Une ruine
  // est le PREMIER élément de la carte qui change tout seul : à son expiration,
  // aucune de ces trois grandeurs ne bouge, `rafraichir` serait donc reparti sans
  // redessiner, et la frontière serait restée fausse jusqu'au prochain geste du
  // joueur — une carte juste au chargement et fausse une heure plus tard.
  //
  // ⚠ CE QUI SE TESTE EST L'EMPREINTE, PAS LE TRAIT. Le dépôt ne sait pas monter
  // un canevas (CLAUDE.md §3) ; l'empreinte, elle, est une fonction pure de
  // l'état, et c'est ELLE qui décide du redessin.
  const etat = creerEtat(GRAINE);
  terrainNu(etat, bande(190, 210), [BASE_20]);
  const nue = empreinteDeLaCarte(etat);

  retirerLeSite(etat, siteDeLaCase(etat, BASE_20.rangee, BASE_20.colonne), JOUEUR);
  const avecRuine = empreinteDeLaCarte(etat);
  assert.notEqual(avecRuine, nue, 'une ruine qui paraît ne déclenche aucun redessin');

  // ⚠⚠ L'HORLOGE AVANCE À LA MAIN, ET C'EST CE QUI ISOLE LA MESURE. Un vrai
  // rattrapage de vingt-quatre heures fait AUSSI paraître les camps du joueur :
  // mesuré, l'empreinte passait de « 0:1:0 » à « 0:13:3 » pour cette raison-là,
  // et le test aurait été vert sans rien savoir des ruines. Ce qu'on veut savoir
  // est si l'empreinte dépend de l'HORLOGE : on ne bouge donc que l'horloge.
  const pose = etat.horloge.nbTicks;
  etat.horloge.nbTicks = pose + TICKS_DE_RUINE - 1;
  assert.equal(empreinteDeLaCarte(etat), avecRuine,
    'l\'empreinte bouge alors que rien n\'a changé : le cache ne sert plus à rien');

  etat.horloge.nbTicks = pose + TICKS_DE_RUINE;
  assert.equal(empreinteDeLaCarte(etat), nue,
    'une ruine qui expire ne déclenche aucun redessin : la carte ment jusqu\'au prochain geste');
});

// ---------------------------------------------------------------------------
// C24 T18 — la carte : la rasée s'en va, la ruine s'y met
// ---------------------------------------------------------------------------

test('C24 T18 — la base rasée quitte la carte, et la ruine s\'y dessine', () => {
  // ⚠⚠ LA CARTE DESSINAIT ENCORE LES BASES RASÉES, ET C'EST UN DÉFAUT
  // ANTÉRIEUR AU LOT, mesuré en le cherchant. `sitesDeLaFenetre` partait de
  // `basesDeLaFenetre(etat.graine, …)` — la graine seule, sans l'état — si bien
  // qu'une base détruite restait peinte INTACTE pendant que `siteDeLaCase` y
  // rendait déjà `null` : le joueur voyait une base qu'il venait de raser, et la
  // toucher n'ouvrait rien. C'est le jumeau exact du défaut que `TF T10` a
  // corrigé dans `forcesDeLOuvrage`, pris par l'autre bout.
  const etat = creerEtat(GRAINE);
  joueurAu(etat, LOIN);
  terrainNu(etat, bande(190, 210), [BASE_20]);
  const fenetre = autour(BASE_20, 6);
  const surLaCase = (liste) => liste.filter(
    (x) => x.rangee === BASE_20.rangee && x.colonne === BASE_20.colonne,
  );

  assert.equal(surLaCase(sitesDeLaFenetre(etat, fenetre)).length, 1,
    'montage sans mordant : la base n\'était pas dessinée avant d\'être rasée');

  retirerLeSite(etat, siteDeLaCase(etat, BASE_20.rangee, BASE_20.colonne), JOUEUR);
  assert.equal(surLaCase(sitesDeLaFenetre(etat, fenetre)).length, 0,
    'la carte dessine encore une base rasée');

  // ⚠ ET LA RUINE, ELLE, A SON DESSIN — au palier de SON niveau, celui de la
  // base tombée, et dans l'atlas : un nom que la couture ne porte pas ferait
  // dessiner un rectangle vide sans que rien ne lève.
  const [ruine] = ruinesActives(etat);
  const nom = spriteDeLaRuine(ruine.type, palierDeNiveau(ruine.niveau));
  assert.equal(nom, `site_base_o_n${palierDeNiveau(20)}_ruine`);
  assert.ok(estDansLAtlas(nom), `${nom} n\'est pas cousu dans l'atlas`);

  // ⚠⚠ À L'EXPIRATION, LA RUINE PART ET LA BASE NE REVIENT PAS. Les deux moitiés
  // comptent : c'est ici que se verrait une lecture qui aurait confondu les deux
  // durées de vie de `basesRasees`.
  rattraperJeu(etat, TICKS_DE_RUINE);
  assert.equal(ruinesActives(etat).length, 0, 'la ruine se dessine encore après 24 h');
  assert.equal(surLaCase(sitesDeLaFenetre(etat, fenetre)).length, 0,
    'la base rasée est revenue sur la carte à l\'expiration de sa ruine');
});

// ---------------------------------------------------------------------------
// C24 T19 — la carcasse est celle du VAINCU
// ---------------------------------------------------------------------------

test('C24 T19 — la carcasse est celle du vaincu, et seules les bases en laissent', () => {
  // ⚠⚠ LE DÉCOMBRE AU VAINCU, LE TERRAIN AU VAINQUEUR. Les deux planches d'Ethan
  // sont « base joueur détruite » et « base Ouvrage détruite » : une base de
  // l'Ouvrage rasée par le joueur montre donc une carcasse d'OUVRAGE tout en
  // peignant du territoire JOUEUR. Les deux faits sont opposés dans les deux cas
  // d'aujourd'hui, et c'est pour ça que l'entrée porte le `type` au lieu de le
  // déduire du `vainqueur`.
  assert.equal(spriteDeLaRuine('base', 5), 'site_base_o_n5_ruine');
  assert.equal(spriteDeLaRuine('baseJoueur', 5), 'site_base_j_n5_ruine');

  // ⚠ SEULES LES BASES EN LAISSENT — un camp ou un avant-poste RESPAWNE, et
  // l'art n'a pas de ruine pour eux. L'appel lève plutôt que de rendre un nom
  // absent de l'atlas, qui ne se verrait qu'au dessin.
  for (const type of ['camp', 'avantPoste', 'baseTerminale', 'poiQuartz', 'inconnu']) {
    assert.throws(() => spriteDeLaRuine(type, 5), /ne laisse pas de ruine/,
      `« ${type} » rend un nom de ruine`);
  }
  for (const palier of [0, 10, 1.5, '5']) {
    assert.throws(() => spriteDeLaRuine('base', palier), /palier/);
  }

  // ⚠ LES DIX-HUIT SONT COUSUS. Neuf paliers, deux camps ; un trou dans la
  // série ne se verrait qu'au palier concerné, donc à un niveau précis.
  for (let palier = 1; palier <= 9; palier += 1) {
    for (const type of ['base', 'baseJoueur']) {
      assert.ok(estDansLAtlas(spriteDeLaRuine(type, palier)),
        `${spriteDeLaRuine(type, palier)} manque à l'atlas`);
    }
  }

  // ⚠⚠ ET LA GÉOMÉTRIE REND DES NOMBRES FINIS. C'est la garde que l'en-tête de
  // `dessinerRuineDUneCase` nomme : `drawImage` avec un rectangle source non
  // fini NE DESSINE RIEN ET NE LÈVE PAS — c'est ainsi que la carte s'était
  // ouverte vide de tout emblème, et rien ne l'avait dit.
  const d = dessinerRuineDUneCase('base', 5, 12.4, 30.6, 32);
  for (const champ of ['sx', 'sy', 'sCote', 'x', 'y', 'cote']) {
    assert.ok(Number.isFinite(d[champ]), `dessinerRuineDUneCase : ${champ} n'est pas fini`);
  }
  assert.equal(d.x, 12);
  assert.equal(d.y, 31);
});
