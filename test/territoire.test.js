// Les territoires — les zones d'influence, et les bordures qu'on en dessine.
//
// ⚠ CE QUI SE TESTE ICI EST LE MODÈLE, PAS LE TRAIT. `sim/territoire.js` est
// pur ; le `stroke` vit dans `ui/monde.js`, derrière un canevas que le dépôt ne
// sait pas monter (CLAUDE.md §3). Ce qui SE teste sans navigateur, ce sont les
// deux disques, la règle de recouvrement, et surtout l'indépendance des bordures
// à la fenêtre — qui est la seule faute que ce module puisse vraiment commettre.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  territoireDeLaFenetre, bordsDuTerritoire, occupantDeLaCase, basesDuJoueur,
  forceDUneBase, niveauDUneBaseDuJoueur, campDeLaCase, RAISON,
  RAYONS, NEUTRE, JOUEUR, OUVRAGE,
} from '../src/sim/territoire.js';
import { dansLOctogoneDInfluence, distanceOctogonaleDInfluence } from '../src/sim/points-attaque.js';
import { basesDeLaFenetre } from '../src/sim/peuplement.js';
import { niveauDeLaRangee } from '../src/sim/carte.js';
import { siteDeLaCase } from '../src/sim/site-de-la-case.js';
import { NIVEAU } from '../src/data/niveaux.js';
import { TEINTES_TERRITOIRE } from '../src/ui/monde.js';
import { GEOGRAPHIE, EMBLEMES_CARTE, TYPES_SITE, ZOOM_CARTE } from '../src/data/sites.js';
import { creerEtat } from '../src/sim/state.js';
import { estBaseOuvrage } from '../src/sim/peuplement.js';
import { baseCourante } from '../src/sim/base-courante.js';
import { caseRasee } from '../src/sim/ruines.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const GRAINE = 31_082_026;

/** Une fenêtre centrée sur une case, assez large pour tenir les deux disques. */
function autour(centre, rayon) {
  return {
    premiereRangee: centre.rangee - rayon,
    derniereRangee: centre.rangee + rayon,
    premiereColonne: centre.colonne - rayon,
    derniereColonne: centre.colonne + rayon,
  };
}

test('territoire — le disque du joueur est celui de la spec, mesuré et non écrit', () => {
  // ⚠ LES DEUX RAYONS VIENNENT DE `GEOGRAPHIE`, jamais d'un nombre écrit ici :
  // `SPEC-FOYER-ZERO.md` §10 les arbitre (« rayon 2, fixe » / « rayon 3, fixe »)
  // et `sim/points-attaque.js` lit déjà le premier pour le barème du raid. Un 2
  // recopié dans ce test le rendrait aveugle au jour où le barème changerait.
  assert.equal(RAYONS[JOUEUR], GEOGRAPHIE.rayonInfluenceJoueur);
  assert.equal(RAYONS[OUVRAGE], GEOGRAPHIE.rayonInfluenceEnnemie);

  const etat = creerEtat(GRAINE);
  const centre = baseCourante(etat).position;
  const carte = territoireDeLaFenetre(etat, autour(centre, 8));

  // On COMPTE les cases du joueur, et on les confronte au disque EUCLIDIEN.
  let compte = 0;
  for (let r = centre.rangee - 8; r <= centre.rangee + 8; r += 1) {
    for (let c = centre.colonne - 8; c <= centre.colonne + 8; c += 1) {
      const dr = r - centre.rangee;
      const dc = c - centre.colonne;
      // ⚠ LE TEST NE RECOPIE PAS LA FORMULE DU CODE, IL LA REFAIT — Tchebychev
      // ET Manhattan, écrits ici en toutes lettres. Appeler
      // `dansLOctogoneDInfluence` rendrait le test tautologique : il passerait
      // sur n'importe quelle forme, du moment que les deux côtés s'accordent.
      const dedans = Math.max(Math.abs(dr), Math.abs(dc)) <= RAYONS[JOUEUR]
        && Math.abs(dr) + Math.abs(dc) <= RAYONS[JOUEUR] + 1;
      const occ = occupantDeLaCase(carte, r, c);
      if (dedans) {
        assert.equal(occ, JOUEUR, `(${r}, ${c}) devrait être au joueur`);
        compte += 1;
      } else {
        assert.notEqual(occ, JOUEUR, `(${r}, ${c}) ne devrait pas être au joueur`);
      }
    }
  }
  // ⚠⚠ LE COMPTE A CHANGÉ TROIS FOIS, ET CHAQUE FOIS SUR ORDRE. 25 (carré) →
  // 13 (disque, lot BASES-1) → **21 (octogone, Ethan le 03/09)** : « un carré de
  // 5x5 avec chaque coin rogné (4 cases) ». Le territoire allié décide du prix
  // d'un raid ; c'est pourquoi la valeur est écrite en dur et non dérivée — la
  // dériver de la même formule que le code rendrait le test aveugle aux trois.
  assert.equal(compte, 21, 'l\'octogone de rayon 2 ne fait plus 21 cases');
  assert.notEqual(compte, (2 * RAYONS[JOUEUR] + 1) ** 2,
    'le territoire est redevenu un CARRÉ de 25 cases');
  assert.notEqual(compte, 13, 'le territoire est redevenu le DISQUE de 13 cases');

  // ⚠ LES QUATRE COINS SONT ROGNÉS, ET EUX SEULS. C'est la forme dictée, prise
  // case par case : le coin est dehors, sa voisine immédiate est dedans. Sans
  // cette paire, un losange de Manhattan passerait le compte de 21 sans être la
  // figure demandée.
  for (const [dr, dc] of [[-2, -2], [-2, 2], [2, -2], [2, 2]]) {
    assert.notEqual(occupantDeLaCase(carte, centre.rangee + dr, centre.colonne + dc), JOUEUR,
      `le coin (${dr}, ${dc}) n'est pas rogné`);
  }
  // ⚠ ET LES HUIT CASES GAGNÉES SUR LE DISQUE SONT NOMMÉES, PAS SUPPOSÉES : ce
  // sont exactement les « 8 cases de plus, dans les angles » du message.
  const gagnees = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  for (const [dr, dc] of gagnees) {
    assert.ok(dr * dr + dc * dc > RAYONS[JOUEUR] ** 2,
      `le montage ne mesure rien : (${dr}, ${dc}) était déjà dans le disque`);
    assert.equal(occupantDeLaCase(carte, centre.rangee + dr, centre.colonne + dc), JOUEUR,
      `la case (${dr}, ${dc}) manque à l'octogone`);
  }
  assert.equal(gagnees.length, 8);
});

test('territoire — le joueur l\'emporte quand les deux se recouvrent', () => {
  // ⚠ C'EST UNE LECTURE, PAS UN ARBITRAGE, et le test la NOMME pour qu'on la
  // retrouve : le territoire allié est la seule des deux zones qui ait un effet
  // de jeu écrit (le tarif du raid, spec §8). Le montage se place exprès sur une
  // case couverte par les deux.
  const etat = creerEtat(GRAINE);
  // On cherche une base de l'Ouvrage assez proche pour que les disques mordent.
  let chevauche = null;
  for (let r = 1; r <= GEOGRAPHIE.carte.hauteur && chevauche === null; r += 1) {
    for (let c = 1; c <= GEOGRAPHIE.carte.largeur; c += 1) {
      if (!estBaseOuvrage(etat.graine, r, c)) continue;
      chevauche = { rangee: r, colonne: c };
      break;
    }
  }
  assert.ok(chevauche, 'montage : aucune base de l\'Ouvrage sur cette graine');

  // On déplace le joueur au contact : les deux disques se recouvrent forcément.
  baseCourante(etat).position = { rangee: chevauche.rangee, colonne: chevauche.colonne };
  const carte = territoireDeLaFenetre(etat, autour(chevauche, 6));

  // D'abord : le montage mesure-t-il quelque chose ? Il faut de l'Ouvrage AUTOUR.
  let ouvrage = 0;
  for (let r = chevauche.rangee - 6; r <= chevauche.rangee + 6; r += 1) {
    for (let c = chevauche.colonne - 6; c <= chevauche.colonne + 6; c += 1) {
      if (occupantDeLaCase(carte, r, c) === OUVRAGE) ouvrage += 1;
    }
  }
  assert.ok(ouvrage > 0, 'montage sans mordant : aucune case d\'Ouvrage autour');

  // Et la case de la base elle-même, couverte par les deux, revient au joueur.
  assert.equal(occupantDeLaCase(carte, chevauche.rangee, chevauche.colonne), JOUEUR);
});

test('territoire — les bordures ne dépendent PAS de la fenêtre qu\'on demande', () => {
  // ⚠⚠ C'EST LA SEULE FAUTE QUE CE MODULE PUISSE VRAIMENT COMMETTRE, et elle est
  // invisible à l'œil : un côté est exposé quand la voisine porte un autre
  // occupant, donc une voisine hors du tableau se lit « neutre » et le bord de
  // la VUE devient une frontière. À l'écran, ça dessine un cadre qui suit le
  // défilement. La carte d'occupation déborde donc d'une case ce qu'elle rend.
  const etat = creerEtat(GRAINE);
  const centre = baseCourante(etat).position;

  // ⚠⚠ LA FENÊTRE SERRÉE DOIT COUPER DANS LE TERRITOIRE, sinon le test ne mesure
  // rien — et c'est ce qu'il faisait au premier jet. À rayon 3 autour du joueur,
  // le carré 5 × 5 tient entier avec une case de marge : aucune bordure ne
  // touchait le bord de la vue, et retirer l'anneau de contexte laissait les dix
  // assertions VERTES. Mesuré par falsification. À rayon 1, les neuf cases de la
  // fenêtre sont TOUTES au joueur et leurs voisines aussi : sans anneau, les
  // quatre bords de la vue deviennent une frontière.
  const rayonJoueur = RAYONS[JOUEUR];
  assert.ok(rayonJoueur >= 2, 'le montage suppose un disque plus large que la fenêtre serrée');
  const serree = bordsDuTerritoire(territoireDeLaFenetre(etat, autour(centre, 1)));
  const large = bordsDuTerritoire(territoireDeLaFenetre(etat, autour(centre, 12)));

  // ⚠⚠ LE MONTAGE A CHANGÉ DE FORME AU LOT BASES-1, ET C'EST OBLIGÉ. Il attendait
  // ZÉRO bordure dans la fenêtre serrée, parce que « les neuf cases regardées sont
  // au cœur du territoire » — vrai d'un CARRÉ de rayon 2, faux de son DISQUE : les
  // quatre coins du 3 × 3 y touchent le dehors, donc quatre bordures sont
  // légitimes. Le disque de rayon 2 n'a que CINQ cases strictement intérieures,
  // en croix, et aucune fenêtre carrée plus grande qu'une case n'y tient.
  //
  // ⚠ CE QU'IL MESURE N'A PAS BOUGÉ D'UN POUCE, et c'est même plus strict : la
  // fenêtre serrée doit voir EXACTEMENT ce que la large y voit. Sans l'anneau de
  // contexte, elle invente des bordures sur son propre bord, que la large n'a
  // pas — la comparaison tombe. On ne compare plus à une liste vide écrite à la
  // main, on compare à la vérité.
  const cleDe = (b) => `${b.rangee}:${b.colonne}`;
  const dansLaFenetreSerree = new Set(serree.map(cleDe));
  const laVerite = large.filter(
    (b) => Math.abs(b.rangee - centre.rangee) <= 1 && Math.abs(b.colonne - centre.colonne) <= 1,
  );
  assert.deepEqual(
    [...dansLaFenetreSerree].sort(), laVerite.map(cleDe).sort(),
    'le bord de la FENÊTRE est compté comme une frontière : l\'anneau de contexte manque',
  );
  for (const b of serree) {
    const vraie = laVerite.find((x) => cleDe(x) === cleDe(b));
    assert.deepEqual(b, vraie, `(${b.rangee}, ${b.colonne}) change de côtés selon la fenêtre`);
  }

  const moyenne = bordsDuTerritoire(territoireDeLaFenetre(etat, autour(centre, 3)));
  assert.ok(moyenne.length > 0, 'montage sans mordant : aucune bordure à portée');

  // Chaque case vue par les deux doit porter EXACTEMENT les mêmes côtés.
  const cle = (b) => `${b.rangee}:${b.colonne}`;
  const parCle = new Map(large.map((b) => [cle(b), b]));
  for (const b of moyenne) {
    const ailleurs = parCle.get(cle(b));
    assert.ok(ailleurs, `(${b.rangee}, ${b.colonne}) n'est bordure que dans la fenêtre serrée`);
    assert.deepEqual(b, ailleurs, `(${b.rangee}, ${b.colonne}) change de côtés selon la fenêtre`);
  }
});

test('territoire — les côtés exposés sont ceux de l\'OCTOGONE, et rien d\'autre', () => {
  // ⚠⚠ LE TITRE A DIT « DU CARRÉ », PUIS « DU DISQUE », ET DIT MAINTENANT
  // « DE L'OCTOGONE ». Les trois étaient exacts à leur date ; les valeurs
  // attendues changent avec la forme, pour la raison écrite en tête de
  // `sim/territoire.js`.
  const etat = creerEtat(GRAINE);
  const centre = baseCourante(etat).position;
  const bords = bordsDuTerritoire(territoireDeLaFenetre(etat, autour(centre, 8)))
    .filter((b) => b.camp === JOUEUR);
  const rayon = RAYONS[JOUEUR];

  // Le centre n'est pas une bordure : ses quatre voisines sont à lui.
  assert.ok(!bords.some((b) => b.rangee === centre.rangee && b.colonne === centre.colonne),
    'le centre du territoire est compté comme une bordure');

  // ⚠ VINGT ET UNE CASES, DONT NEUF STRICTEMENT INTÉRIEURES — le bloc 3 × 3 du
  // milieu au complet, là où le disque n'en avait que cinq en croix. Il reste
  // donc DOUZE cases à côté exposé, contre huit sous le disque et seize au
  // carré. Le nombre est écrit plutôt que dérivé : dérivé de la formule du code,
  // il ne distinguerait plus les trois figures.
  const aUnCote = bords.filter((b) => b.nord || b.est || b.sud || b.ouest);
  assert.equal(aUnCote.length, 12,
    'le pourtour de l\'octogone de rayon 2 ne fait plus douze cases');
  assert.notEqual(aUnCote.length, (2 * rayon + 1) ** 2 - (2 * rayon - 1) ** 2,
    'le pourtour est redevenu celui du CARRÉ');
  assert.notEqual(aUnCote.length, 8, 'le pourtour est redevenu celui du DISQUE');

  // ⚠⚠ ET QUATRE CASES DE PLUS ENTRENT DANS LA LISTE DEPUIS LE 05/09, SANS
  // PORTER UN SEUL CÔTÉ EXPOSÉ. Ce sont les quatre cases en diagonale du centre :
  // leurs quatre voisines orthogonales sont dans l'octogone, et le COIN qu'elles
  // touchent est justement la case rognée. C'est un sommet rentrant, et c'est là
  // que la frontière manquait « les deux points » qu'Ethan a vus sur un U.
  // Seize entrées, donc, dont quatre muettes en côtés — le compte du pourtour
  // ci-dessus est écrit à part exprès, sans quoi cette ligne l'aurait déplacé
  // sans qu'on sache laquelle des deux grandeurs a bougé.
  assert.equal(bords.length, 16,
    'la liste ne porte plus les quatre cases à sommet rentrant de l\'octogone');
  const sansCote = bords.filter((b) => !b.nord && !b.est && !b.sud && !b.ouest);
  assert.equal(sansCote.length, 4, 'les quatre sommets rentrants de l\'octogone ont bougé');
  for (const b of sansCote) {
    const dr = b.rangee - centre.rangee;
    const dc = b.colonne - centre.colonne;
    assert.deepEqual([Math.abs(dr), Math.abs(dc)], [1, 1],
      `(${dr}, ${dc}) n'est pas une des quatre diagonales du centre`);
    const coin = `${dr < 0 ? 'n' : 's'}${dc > 0 ? 'e' : 'o'}`;
    const attendu = coin === 'ne' ? 'ne' : coin === 'se' ? 'es' : coin === 'so' ? 'so' : 'no';
    assert.ok(b.rentrants[attendu],
      `(${dr}, ${dc}) devrait porter le sommet rentrant « ${attendu} »`);
    assert.equal(Object.values(b.rentrants).filter(Boolean).length, 1,
      `(${dr}, ${dc}) porte plus d'un sommet rentrant`);
  }

  // ⚠ LE COIN RESTE DEHORS — c'est le seul point commun des trois figures qui
  // survit : (−2, −2) est rogné, exactement comme le disque le rejetait.
  assert.ok(
    !bords.some((b) => b.rangee === centre.rangee - rayon && b.colonne === centre.colonne - rayon),
    'le coin du carré est redevenu une bordure : la zone est repassée carrée',
  );

  // La pointe nord ne porte plus qu'UN côté, le nord : ses voisines est et ouest
  // sont rentrées dans la zone avec les huit cases gagnées. Sous le disque elle
  // en portait trois — c'est la mesure qui distingue le mieux les deux formes.
  const pointe = bords.find((b) => b.rangee === centre.rangee - rayon
    && b.colonne === centre.colonne);
  assert.ok(pointe, 'la pointe nord n\'est pas une bordure');
  assert.deepEqual(
    { nord: pointe.nord, ouest: pointe.ouest, sud: pointe.sud, est: pointe.est },
    { nord: true, ouest: false, sud: false, est: false },
  );

  // Et l'épaule — l'une des huit cases gagnées — porte deux côtés : le nord vers
  // le dehors, l'ouest vers le coin rogné. C'est elle qui tient désormais le
  // rôle que la diagonale intérieure tenait sous le disque.
  const epaule = bords.find((b) => b.rangee === centre.rangee - rayon
    && b.colonne === centre.colonne - 1);
  assert.ok(epaule, 'l\'épaule (−2, −1) n\'est pas une bordure');
  assert.deepEqual(
    { nord: epaule.nord, ouest: epaule.ouest, sud: epaule.sud, est: epaule.est },
    { nord: true, ouest: true, sud: false, est: false },
  );

  // ⚠ ET LA DIAGONALE À (−1, −1) N'A PLUS UN SEUL CÔTÉ EXPOSÉ, ce qui est la
  // conséquence la moins visible du rognage : sous le disque elle était au bord,
  // sous l'octogone ses quatre voisines sont toutes au joueur.
  //
  // ⚠⚠ CETTE GARDE A CHANGÉ DE CIBLE LE 05/09, ET ELLE NE S'EST PAS ASSOUPLIE.
  // Elle exigeait l'ABSENCE de cette case dans la liste ; la case y est revenue,
  // pour son sommet rentrant et pour rien d'autre. Ce qu'elle défendait — « le
  // rognage a rentré ses quatre voisines » — se dit sur les côtés, qui sont la
  // grandeur dont elle parle. L'exiger absente ferait tomber cette ligne le jour
  // où le dessin d'un coin arrive, ce qui n'a aucun rapport avec les angles.
  const diagonale = bords.find((b) => b.rangee === centre.rangee - 1
    && b.colonne === centre.colonne - 1);
  assert.ok(diagonale, 'la diagonale intérieure a disparu de la liste');
  assert.deepEqual(
    { nord: diagonale.nord, ouest: diagonale.ouest, sud: diagonale.sud, est: diagonale.est },
    { nord: false, ouest: false, sud: false, est: false },
    'la diagonale intérieure porte encore un côté exposé : les angles ne sont pas revenus',
  );
  assert.ok(diagonale.rentrants.no, 'la diagonale intérieure ne porte pas son sommet rentrant');
});

test('territoire — seules les BASES de l\'Ouvrage projettent son influence', () => {
  // ⚠ LECTURE, ET LE TEST LA NOMME : `TYPES_SITE` dit que la base est le seul
  // type qui « attaque le joueur ». Camps et avant-postes sont du butin qui suit
  // le joueur et disparaît ; peindre un territoire ennemi autour de ce qu'on
  // vient de faire paraître à côté de chez soi serait illisible.
  assert.equal(TYPES_SITE.base.attaqueLeJoueur, true);
  assert.equal(TYPES_SITE.camp.attaqueLeJoueur, false);
  assert.equal(TYPES_SITE.avantPoste.attaqueLeJoueur, false);

  const etat = creerEtat(GRAINE);
  // On pose un camp à côté de la base, hors du disque du joueur, et on vérifie
  // qu'il ne peint RIEN. Sans ce montage, « seules les bases » serait une phrase.
  const loin = {
    rangee: baseCourante(etat).position.rangee - RAYONS[JOUEUR] - 2,
    colonne: baseCourante(etat).position.colonne,
  };
  assert.ok(!estBaseOuvrage(etat.graine, loin.rangee, loin.colonne),
    'montage : la case choisie porte déjà une base de l\'Ouvrage');
  const avant = territoireDeLaFenetre(etat, autour(baseCourante(etat).position, 8));
  const occAvant = occupantDeLaCase(avant, loin.rangee, loin.colonne);

  baseCourante(etat).satellites.presents.push({
    type: 'camp', rangee: loin.rangee, colonne: loin.colonne, niveau: 1, instance: 1,
    tickDeReleve: 999_999,
  });
  const apres = territoireDeLaFenetre(etat, autour(baseCourante(etat).position, 8));
  assert.equal(occupantDeLaCase(apres, loin.rangee, loin.colonne), occAvant,
    'un camp a peint du territoire : seules les bases doivent le faire');
});

test('territoire — une base du joueur, et la liste est prête pour plusieurs', () => {
  const etat = creerEtat(GRAINE);
  const bases = basesDuJoueur(etat);
  assert.equal(bases.length, 1, 'l\'état ne porte structurellement qu\'une base');
  assert.deepEqual(bases[0], baseCourante(etat).position);
});

test('territoire — une fenêtre hors carte ne lève pas et ne rend rien', () => {
  const etat = creerEtat(GRAINE);
  const dehors = {
    premiereRangee: GEOGRAPHIE.carte.hauteur + 10,
    derniereRangee: GEOGRAPHIE.carte.hauteur + 20,
    premiereColonne: 1, derniereColonne: 5,
  };
  const carte = territoireDeLaFenetre(etat, dehors);
  assert.deepEqual(bordsDuTerritoire(carte), []);
  assert.equal(occupantDeLaCase(carte, 1, 1), NEUTRE);
});

test('frontières — les deux teintes reprennent la sémantique des emblèmes', () => {
  // ⚠⚠ LE ROUGE EST RÉSERVÉ À CE QUI ATTAQUE LE JOUEUR, et `EMBLEMES_CARTE` le
  // tient déjà — un test de `monde.test.js` croise l'ensemble des bords rouges
  // avec `attaqueLeJoueur`. Le territoire de l'Ouvrage est exactement l'emprise
  // de ces bases-là : lui donner une troisième couleur apprendrait au joueur un
  // second code pour la même chose.
  assert.equal(TEINTES_TERRITOIRE[OUVRAGE], EMBLEMES_CARTE.base.bord);
  assert.equal(TEINTES_TERRITOIRE[JOUEUR], EMBLEMES_CARTE.baseJoueur.bord);
  assert.notEqual(TEINTES_TERRITOIRE[JOUEUR], TEINTES_TERRITOIRE[OUVRAGE]);

  // ⚠ ET LES DEUX SONT DANS LA PALETTE FERMÉE. La garde de `banc.test.js` balaie
  // `src/ui/` et refuse toute teinte hors des trente-trois de `FICHE-STYLE.md` ;
  // on le vérifie ici de face plutôt que de compter dessus.
  const fiche = readFileSync(join(RACINE, 'FICHE-STYLE.md'), 'utf8');
  for (const teinte of Object.values(TEINTES_TERRITOIRE)) {
    assert.ok(fiche.includes(teinte), `${teinte} n'est pas dans FICHE-STYLE.md`);
  }
});

test('frontières — le calcul tient dans le budget d\'une image', () => {
  // ⚠ IL NE PARCOURT JAMAIS LES 9 300 CASES. Demander « cette case est-elle sous
  // influence ? » à chaque case coûterait 49 appels à `estBaseOuvrage`, soit 441
  // hachages PAR CASE. On peint les disques des bases de la fenêtre à la place.
  const etat = creerEtat(GRAINE);
  const fenetre = {
    premiereRangee: 100, derniereRangee: 160,
    premiereColonne: 1, derniereColonne: GEOGRAPHIE.carte.largeur,
  };
  const t0 = process.hrtime.bigint();
  const bords = bordsDuTerritoire(territoireDeLaFenetre(etat, fenetre));
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  assert.ok(Array.isArray(bords));
  // Le seuil est large : il n'est pas là pour mesurer la machine, il est là pour
  // attraper un retour au parcours par case, qui serait cent fois plus lent.
  assert.ok(ms < 200, `${ms.toFixed(1)} ms pour une fenêtre de 61 rangées`);
});

// ---------------------------------------------------------------------------
// Lot TERRITOIRE-FORCE — le niveau devient une force, et les bases s'additionnent
// ---------------------------------------------------------------------------
//
// ⚠⚠ ETHAN, 07/09, POINT 13 : « deux bases 10 est moins fort qu'une base 20 ».
// La règle centrale du module est RENVERSÉE — le joueur ne l'emporte plus
// d'office —, et ces douze montages la reprennent depuis le début.

/**
 * Un état où UNE SEULE base de l'Ouvrage subsiste dans la fenêtre.
 *
 * ⚠⚠ ON RASE LES AUTRES PLUTÔT QUE DE FORGER UNE CARTE. Les positions des bases
 * de l'Ouvrage sont une fonction de la GRAINE — `basesDeLaFenetre` ne lit que
 * ça —, donc on ne peut pas en poser une où l'on veut. `basesRasees` est déjà
 * dans l'état et le module le lit depuis ce lot : raser le voisinage donne un
 * montage EXACT sans une seule ligne de code de production écrite pour le test.
 *
 * ⚠ ET ÇA ÉPROUVE LE FILTRE DU MÊME COUP. Si `forcesDeLOuvrage` cessait de lire
 * `basesRasees`, tous les montages ci-dessous verraient reparaître des dizaines
 * de bases et tomberaient — c'est `TF T10` qui le dit de face, mais les autres
 * le tiennent par la manche.
 */
function seuleBaseOuvrage(etat, gardee, autour) {
  for (const b of basesDeLaFenetre(etat.graine, autour)) {
    if (b.rangee === gardee.rangee && b.colonne === gardee.colonne) continue;
    // ⚠⚠ `caseRasee` ET NON `ruineFraiche` — lot CONQUÊTE-24H, ET C'EST CE QUI
    // GARDE CES DOUZE MONTAGES INCHANGÉS. Une entrée SANS revendication rase la
    // base sans rien émettre : c'est exactement ce que la chaîne `'r:c'` faisait
    // avant la v28, et ces tests-ci mesurent le partage entre bases DEBOUT, pas
    // la conquête. Une ruine fraîche y ajouterait vingt et une cases de
    // territoire joueur par base rasée, et douze montages mesureraient autre
    // chose que ce qu'ils annoncent.
    etat.basesRasees.push(caseRasee(b.rangee, b.colonne));
  }
  return etat;
}

/** Une base du joueur posée où l'on veut, au niveau de bâtiments voulu. */
function joueurAu(etat, position, niveau) {
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

test('TF T1 — deux bases de niveau 10 valent EXACTEMENT une base de niveau 11', () => {
  // ⚠⚠ C'EST LA PREMIÈRE MOITIÉ DE L'ARBITRAGE, ET ELLE TIENT À LA RAISON 2.
  // `2¹⁰ + 2¹⁰ = 2¹¹` : l'essaimage rapporte. L'égalité est STRICTE et en
  // `BigInt` — un flottant la rendrait vraie ici et fausse au niveau 50, où la
  // somme dépasse `Number.MAX_SAFE_INTEGER`.
  assert.equal(forceDUneBase(10, 0) + forceDUneBase(10, 0), forceDUneBase(11, 0));
  assert.equal(typeof forceDUneBase(10, 0), 'bigint');

  // ⚠ ET ELLE TIENT À TOUS LES NIVEAUX, PAS SEULEMENT À DIX. Un montage à un
  // seul palier passerait sur un formateur qui aurait codé ce cas-là en dur.
  for (let n = 1; n < NIVEAU.plafond; n += 1) {
    assert.equal(forceDUneBase(n, 0) + forceDUneBase(n, 0), forceDUneBase(n + 1, 0),
      `deux bases de niveau ${n} ne valent pas une de niveau ${n + 1}`);
  }

  // ⚠ FALSIFIABLE : TROIS bases de niveau 10 ne valent PAS une de niveau 11.
  // Sans cette ligne, une force constante passerait l'égalité ci-dessus.
  assert.notEqual(forceDUneBase(10, 0) * 3n, forceDUneBase(11, 0));

  // ⚠ ET LA RAISON SE LIT DANS `GEOGRAPHIE`, elle ne s'écrit pas ici : c'est le
  // seul nombre à tourner si Ethan veut une progression plus douce.
  assert.equal(RAISON, BigInt(GEOGRAPHIE.raisonDeLaForce));
  assert.equal(GEOGRAPHIE.raisonDeLaForce, 2);
});

test('TF T2 — une base de niveau 20 en vaut 1 024 de niveau 10', () => {
  // ⚠⚠ C'EST LA SECONDE MOITIÉ, ET ELLE DIT LE CONTRAIRE DE LA PREMIÈRE SANS LA
  // CONTREDIRE : l'essaimage rapporte, et il ne rattrape JAMAIS la montée en
  // niveau. Un test à deux bases ne montrerait pas la domination.
  const dix = forceDUneBase(10, 0);
  const vingt = forceDUneBase(20, 0);
  assert.equal(vingt / dix, 1024n);
  assert.equal(dix * 1024n, vingt);

  // Mille bases de niveau 10 restent SOUS une base de niveau 20.
  assert.ok(dix * 1000n < vingt, 'mille bases de niveau 10 dépassent une base de 20');
  // Et mille vingt-cinq la dépassent — la borne est là, pas ailleurs.
  assert.ok(dix * 1025n > vingt, 'la borne des 1 024 n\'est pas serrée');
});

test('TF T3 — le niveau 15 rogne le territoire du niveau 13, à trois cases', () => {
  // ⚠⚠ LE CAS D'ETHAN, MONTÉ EXACTEMENT, ET LE COMPTE N'EST PAS CELUI QUE LE
  // BRIEF ANNONÇAIT. Il prévoyait « le 15 prend deux cases au 13 » ; mesuré, il
  // lui en prend **onze**. La raison est géométrique et elle est vérifiable :
  // les deux rayons ne sont pas les mêmes — 2 pour le joueur, 3 pour l'Ouvrage —
  // et le chevauchement de leurs octogones à trois cases d'écart fait onze
  // cases, pas deux. Le « deux cases » valait pour deux bases de MÊME rayon.
  //
  // ⚠⚠ ET LES DEUX BASES NE PEUVENT PAS ÊTRE DEUX BASES DE L'OUVRAGE, C'EST
  // MESURABLE. Le niveau d'un site de l'Ouvrage est celui de sa RANGÉE et monte
  // de `niveauParCase` = 0,2 par case : il faut **cinq rangées pour un niveau**,
  // donc dix pour aller de 13 à 15. Deux bases de l'Ouvrage distantes de trois
  // cases ne peuvent pas différer de deux niveaux. Le cas d'Ethan n'existe donc
  // qu'entre le joueur et l'Ouvrage — ce qui est justement ce que ce lot ouvre.
  const etat = creerEtat(GRAINE);
  const bande = { premiereRangee: 233, derniereRangee: 237, premiereColonne: 1, derniereColonne: 31 };
  const ouvrage = basesDeLaFenetre(etat.graine, bande).find(
    (b) => b.colonne >= 8 && b.colonne <= 24 && !estBaseOuvrage(etat.graine, b.rangee, b.colonne - 3),
  );
  assert.ok(ouvrage !== undefined, 'la graine ne porte pas la base attendue');
  assert.equal(niveauDeLaRangee(ouvrage.rangee), 13, 'la base retenue n\'est pas de niveau 13');
  const position = { rangee: ouvrage.rangee, colonne: ouvrage.colonne - 3 };
  joueurAu(etat, position, 15);
  seuleBaseOuvrage(etat, ouvrage, {
    premiereRangee: ouvrage.rangee - 10, derniereRangee: ouvrage.rangee + 10,
    premiereColonne: 1, derniereColonne: 31,
  });

  const carte = territoireDeLaFenetre(etat, {
    premiereRangee: ouvrage.rangee - 6, derniereRangee: ouvrage.rangee + 6,
    premiereColonne: position.colonne - 6, derniereColonne: ouvrage.colonne + 6,
  });

  // ⚠ CASE PAR CASE, PAS PAR COMPTE SEUL. Un total juste peut cacher deux cases
  // échangées ; c'est le test qui relie la formule à l'arbitrage.
  const qui = (dr, dc) => occupantDeLaCase(carte, ouvrage.rangee + dr, ouvrage.colonne + dc);
  assert.equal(qui(0, 0), OUVRAGE, 'le 13 a perdu sa propre case');
  assert.equal(qui(0, -3), JOUEUR, 'le 15 a perdu sa propre case');
  assert.equal(qui(0, -1), JOUEUR, 'la case collée au 13, mais à deux du 15, ne va pas au 15');
  assert.equal(qui(0, -2), JOUEUR);
  assert.equal(qui(0, 1), OUVRAGE, 'une case que le 15 ne peint pas lui revient quand même');
  assert.equal(qui(1, -1), JOUEUR);
  assert.equal(qui(-1, -1), JOUEUR);

  // ⚠ LE 15 GARDE SON OCTOGONE ENTIER — 21 cases — et le 13 tombe de 37 à 26.
  assert.equal(compter(carte, JOUEUR), 21, 'le niveau 15 ne garde pas tout son octogone');
  assert.equal(compter(carte, OUVRAGE), 26, 'le niveau 13 ne perd pas onze cases');
});

test('TF T4 — une base garde SA case face à un niveau 20 collé à elle', () => {
  // ⚠⚠ C'EST LE TEST DU PLANCHER, ET SANS LUI LA FORMULE PREND LE PIED DU
  // FAIBLE. Ethan, 07/09 : « le territoire où la base se trouve ne change pas ».
  // Un niveau 20 à trois cases pèse `2^(20−3)` là où un niveau 1 chez lui pèse
  // `2^(1−0)` : la somme donne la case au fort, et le plancher la lui reprend.
  const etat = creerEtat(GRAINE);
  const bande = { premiereRangee: 198, derniereRangee: 202, premiereColonne: 1, derniereColonne: 31 };
  const ouvrage = basesDeLaFenetre(etat.graine, bande).find(
    (b) => b.colonne >= 8 && b.colonne <= 24 && !estBaseOuvrage(etat.graine, b.rangee, b.colonne - 3),
  );
  assert.ok(ouvrage !== undefined, 'la graine ne porte pas la base attendue');
  assert.equal(niveauDeLaRangee(ouvrage.rangee), 20, 'la base retenue n\'est pas de niveau 20');
  const position = { rangee: ouvrage.rangee, colonne: ouvrage.colonne - 3 };
  joueurAu(etat, position, 1);
  seuleBaseOuvrage(etat, ouvrage, {
    premiereRangee: ouvrage.rangee - 10, derniereRangee: ouvrage.rangee + 10,
    premiereColonne: 1, derniereColonne: 31,
  });

  const carte = territoireDeLaFenetre(etat, {
    premiereRangee: ouvrage.rangee - 6, derniereRangee: ouvrage.rangee + 6,
    premiereColonne: position.colonne - 6, derniereColonne: ouvrage.colonne + 6,
  });
  assert.equal(occupantDeLaCase(carte, position.rangee, position.colonne), JOUEUR,
    'la base de niveau 1 a perdu son propre pied');

  // ⚠⚠ FALSIFIABLE, ET LA PREMIÈRE ÉCRITURE DE CETTE LIGNE ÉTAIT FAUSSE. Elle
  // exigeait que le joueur ne garde QUE sa case — c'était confondre « perdre le
  // chevauchement » et « perdre son octogone ». Le niveau 20 ne peint que dans
  // SON octogone : les dix cases que le joueur peint et que l'Ouvrage n'atteint
  // pas ne sont disputées par personne et lui restent. Mesuré : 11 = 10 + le
  // pied. Ce que le plancher protège, c'est UNE case, et c'est la voisine qui le
  // dit.
  assert.equal(occupantDeLaCase(carte, position.rangee, position.colonne + 1), OUVRAGE,
    'le plancher déborde sur la case voisine : il protège plus que la base');
  assert.equal(compter(carte, JOUEUR), 11,
    'le joueur ne garde pas exactement les dix cases hors de portée du 20, plus son pied');
  assert.equal(compter(carte, OUVRAGE), 36,
    'le niveau 20 perd autre chose que le seul pied du niveau 1');
});

test('TF T5 — le joueur PEUT perdre une case, et ce test remplace celui de l\'ancienne priorité', () => {
  // ⚠⚠ IL REMPLACE EXPLICITEMENT LA RÈGLE MORTE. `territoireDeLaFenetre` portait
  // « le joueur l'emporte : on n'écrase jamais sa marque », une LECTURE prise
  // faute d'arbitrage. Ethan a tranché le 07/09 : c'est la somme des forces qui
  // décide, et le joueur peut donc perdre. Un joueur qui ne peut pas perdre une
  // case ne peut pas non plus en gagner une — la priorité rendait tout le
  // partage muet.
  const etat = creerEtat(GRAINE);
  const bande = { premiereRangee: 98, derniereRangee: 102, premiereColonne: 1, derniereColonne: 31 };
  const ouvrage = basesDeLaFenetre(etat.graine, bande).find(
    (b) => b.colonne >= 8 && b.colonne <= 24 && !estBaseOuvrage(etat.graine, b.rangee, b.colonne - 2),
  );
  assert.ok(ouvrage !== undefined, 'la graine ne porte pas la base attendue');
  const position = { rangee: ouvrage.rangee, colonne: ouvrage.colonne - 2 };
  joueurAu(etat, position, 1);
  seuleBaseOuvrage(etat, ouvrage, {
    premiereRangee: ouvrage.rangee - 10, derniereRangee: ouvrage.rangee + 10,
    premiereColonne: 1, derniereColonne: 31,
  });

  const carte = territoireDeLaFenetre(etat, {
    premiereRangee: ouvrage.rangee - 6, derniereRangee: ouvrage.rangee + 6,
    premiereColonne: position.colonne - 6, derniereColonne: ouvrage.colonne + 6,
  });

  // La case juste à l'est de la base du joueur : il la peint (distance 1), et
  // l'Ouvrage la peint aussi (distance 1). Le plus fort l'emporte.
  const disputee = { rangee: position.rangee, colonne: position.colonne + 1 };
  assert.equal(occupantDeLaCase(carte, disputee.rangee, disputee.colonne), OUVRAGE,
    'le joueur garde une case qu\'une base bien plus forte lui dispute');

  // ⚠ ET SON PIED LUI RESTE : perdre du territoire n'est pas perdre sa base.
  assert.equal(occupantDeLaCase(carte, position.rangee, position.colonne), JOUEUR);
});

test('TF T6 — c\'est la SOMME qui décide, pas l\'ordre des deux boucles', () => {
  // ⚠⚠ LE MONTAGE NE RETOURNE PAS LES BOUCLES, IL RETOURNE LES NIVEAUX, ET C'EST
  // PLUS FORT. Inverser l'ordre de peinture demanderait un drapeau de test dans
  // le code de production — exactement ce que ce dépôt refuse. On monte donc
  // DEUX configurations où seul le rapport de force change, l'ordre de peinture
  // restant identique : si l'ordre décidait, la même case irait au même camp
  // dans les deux. Sous l'ANCIENNE règle, la seconde aurait donné la case au
  // joueur ; elle la donne à l'Ouvrage.
  const bande = { premiereRangee: 148, derniereRangee: 152, premiereColonne: 1, derniereColonne: 31 };
  const graine = creerEtat(GRAINE).graine;
  const ouvrage = basesDeLaFenetre(graine, bande).find(
    (b) => b.colonne >= 8 && b.colonne <= 24 && !estBaseOuvrage(graine, b.rangee, b.colonne - 2),
  );
  assert.ok(ouvrage !== undefined, 'la graine ne porte pas la base attendue');
  const position = { rangee: ouvrage.rangee, colonne: ouvrage.colonne - 2 };
  const disputee = { rangee: position.rangee, colonne: position.colonne + 1 };

  const campDeLaDisputee = (niveauDuJoueur) => {
    const etat = creerEtat(GRAINE);
    joueurAu(etat, position, niveauDuJoueur);
    seuleBaseOuvrage(etat, ouvrage, {
      premiereRangee: ouvrage.rangee - 10, derniereRangee: ouvrage.rangee + 10,
      premiereColonne: 1, derniereColonne: 31,
    });
    const carte = territoireDeLaFenetre(etat, {
      premiereRangee: ouvrage.rangee - 6, derniereRangee: ouvrage.rangee + 6,
      premiereColonne: position.colonne - 6, derniereColonne: ouvrage.colonne + 6,
    });
    return occupantDeLaCase(carte, disputee.rangee, disputee.colonne);
  };

  assert.equal(niveauDeLaRangee(ouvrage.rangee), 30, 'la base retenue n\'est pas de niveau 30');
  assert.equal(campDeLaDisputee(NIVEAU.plafond), JOUEUR, 'un joueur de niveau 50 perd contre un 30');
  assert.equal(campDeLaDisputee(1), OUVRAGE, 'un joueur de niveau 1 gagne contre un 30');

  // ⚠ ET LE GARDE-FOU DE L'ANCIENNE RÈGLE N'EST PLUS DANS LA SOURCE. Il tenait
  // en une ligne — « si la case est au joueur, ne pas l'écraser » — et sa
  // disparition est ce qui rend l'ordre des boucles sans effet.
  const source = readFileSync(join(RACINE, 'src', 'sim', 'territoire.js'), 'utf8');
  assert.doesNotMatch(source, /if \(occupant\[i\] === JOUEUR\) continue;/,
    'la priorité inconditionnelle du joueur est revenue dans la source');
});

test('TF T7 — la géométrie est UNIQUE, et elle se vérifie dans les angles', () => {
  // ⚠⚠ UN MONTAGE ALIGNÉ NE DISTINGUERAIT PAS TCHEBYCHEV D'UN OCTOGONE. Les deux
  // ne diffèrent QUE dans les coins — et c'est précisément là que le partage se
  // joue, puisque la distance entre dans l'exposant de la force.
  assert.equal(distanceOctogonaleDInfluence(2, 2), 3, 'Tchebychev dirait 2');
  assert.equal(distanceOctogonaleDInfluence(3, 3), 5, 'Tchebychev dirait 3');
  assert.equal(distanceOctogonaleDInfluence(1, 1), 1);
  assert.equal(distanceOctogonaleDInfluence(2, 1), 2);
  assert.equal(distanceOctogonaleDInfluence(0, 0), 0);

  // ⚠⚠ ET LE BOOLÉEN EST EXACTEMENT LA BOULE DE CETTE DISTANCE, sur tous les
  // écarts et tous les rayons utiles — coins compris. C'est l'assertion qui dit
  // « une seule géométrie » ; sans elle, les deux pourraient dériver l'une de
  // l'autre en théorie et diverger en pratique.
  let couples = 0;
  let diagonales = 0;
  for (let rayon = 0; rayon <= 6; rayon += 1) {
    for (let dr = -8; dr <= 8; dr += 1) {
      for (let dc = -8; dc <= 8; dc += 1) {
        assert.equal(
          dansLOctogoneDInfluence(dr, dc, rayon),
          distanceOctogonaleDInfluence(dr, dc) <= rayon,
          `(${dr}, ${dc}) au rayon ${rayon} : le booléen et la distance divergent`,
        );
        couples += 1;
        if (dr !== 0 && dc !== 0) diagonales += 1;
      }
    }
  }
  assert.equal(couples, 7 * 17 * 17);
  assert.ok(diagonales > 1500, `${diagonales} écarts en diagonale : le balayage évite les coins`);

  // ⚠ ET LES DEUX FIGURES SE RECOMPTENT — 21 et 37, les nombres dictés par Ethan.
  for (const [rayon, attendu] of [[GEOGRAPHIE.rayonInfluenceJoueur, 21],
    [GEOGRAPHIE.rayonInfluenceEnnemie, 37]]) {
    let dedans = 0;
    for (let dr = -rayon; dr <= rayon; dr += 1) {
      for (let dc = -rayon; dc <= rayon; dc += 1) {
        if (distanceOctogonaleDInfluence(dr, dc) <= rayon) dedans += 1;
      }
    }
    assert.equal(dedans, attendu);
  }
});

test('TF T8 — la portée ne bouge pas : un niveau 50 ne peint pas une case de plus', () => {
  // ⚠⚠ SEUL LE PARTAGE DÉPEND DU NIVEAU, JAMAIS LA PORTÉE. Deux modules lisent
  // le rayon en dur — `sim/poi.js` parcourt le territoire, `sim/points-attaque.js`
  // en tire le barème du raid — et une portée qui croîtrait avec le niveau
  // changerait leur coût et leur prix sans que personne ne l'ait demandé.
  const etat = creerEtat(GRAINE);
  const position = { rangee: 150, colonne: 16 };
  joueurAu(etat, position, NIVEAU.plafond);
  seuleBaseOuvrage(etat, { rangee: -1, colonne: -1 }, {
    premiereRangee: 130, derniereRangee: 170, premiereColonne: 1, derniereColonne: 31,
  });
  const carte = territoireDeLaFenetre(etat, {
    premiereRangee: 140, derniereRangee: 160, premiereColonne: 6, derniereColonne: 26,
  });
  assert.equal(compter(carte, JOUEUR), 21,
    'une base de niveau 50 peint autre chose que son octogone de 21 cases');

  // Aucune case au-delà du rayon, sur les deux axes ET en diagonale.
  for (const [dr, dc] of [[0, 3], [3, 0], [-3, 0], [0, -3], [2, 2], [-2, -2], [2, -2]]) {
    assert.equal(occupantDeLaCase(carte, position.rangee + dr, position.colonne + dc), NEUTRE,
      `(${dr}, ${dc}) est peinte alors qu'elle est hors de l'octogone`);
  }
  assert.equal(RAYONS[JOUEUR], GEOGRAPHIE.rayonInfluenceJoueur);
  assert.equal(RAYONS[OUVRAGE], GEOGRAPHIE.rayonInfluenceEnnemie);
});

test('TF T9 — hors de tout octogone, la case reste NEUTRE', () => {
  // Non-régression : la somme ne décide que là où au moins une base peint.
  const etat = creerEtat(GRAINE);
  const position = { rangee: 150, colonne: 16 };
  joueurAu(etat, position, 20);
  seuleBaseOuvrage(etat, { rangee: -1, colonne: -1 }, {
    premiereRangee: 130, derniereRangee: 170, premiereColonne: 1, derniereColonne: 31,
  });
  const carte = territoireDeLaFenetre(etat, {
    premiereRangee: 140, derniereRangee: 160, premiereColonne: 6, derniereColonne: 26,
  });
  assert.equal(compter(carte, NEUTRE), carte.occupant.length - 21);
  assert.equal(occupantDeLaCase(carte, 145, 10), NEUTRE);
});

test('TF T10 — une base RASÉE ne peint plus, et le défaut a été mesuré avant', () => {
  // ⚠⚠ CE MONTAGE ÉTAIT ROUGE AVANT LA CORRECTION, ET C'EST ÉCRIT AU RAPPORT.
  // `territoireDeLaFenetre` appelait `basesDeLaFenetre(etat.graine, …)` — la
  // graine seule, sans l'état — alors que `basesRasees` retient les cases rasées
  // et que `siteDeLaCase` y rend déjà `null`. Mesuré sur la graine 11, base
  // (1, 2) : **trente cases restaient à l'Ouvrage** après le rasage.
  //
  // ⚠ ET LE DÉFAUT NE FAUSSAIT PAS QU'UN DESSIN : une base rasée pesait
  // `raison ^ niveau` dans le partage. C'est pour ça qu'il se corrige dans ce
  // lot-ci et pas au suivant.
  const etat = creerEtat(GRAINE);
  const bande = { premiereRangee: 148, derniereRangee: 152, premiereColonne: 1, derniereColonne: 31 };
  const ouvrage = basesDeLaFenetre(etat.graine, bande).find((b) => b.colonne >= 6 && b.colonne <= 26);
  assert.ok(ouvrage !== undefined, 'la graine ne porte pas la base attendue');
  const fenetre = {
    premiereRangee: ouvrage.rangee - 6, derniereRangee: ouvrage.rangee + 6,
    premiereColonne: ouvrage.colonne - 6, derniereColonne: ouvrage.colonne + 6,
  };
  // Le joueur au loin : ce montage ne parle que de l'Ouvrage.
  joueurAu(etat, { rangee: 290, colonne: 16 }, 1);
  seuleBaseOuvrage(etat, ouvrage, {
    premiereRangee: ouvrage.rangee - 10, derniereRangee: ouvrage.rangee + 10,
    premiereColonne: 1, derniereColonne: 31,
  });

  const avant = territoireDeLaFenetre(etat, fenetre);
  assert.equal(compter(avant, OUVRAGE), 37, 'la base debout ne peint pas son octogone');
  assert.equal(siteDeLaCase(etat, ouvrage.rangee, ouvrage.colonne).type, 'base');

  etat.basesRasees.push(caseRasee(ouvrage.rangee, ouvrage.colonne));
  assert.equal(siteDeLaCase(etat, ouvrage.rangee, ouvrage.colonne), null,
    'le montage ne rase pas vraiment la base');

  const apres = territoireDeLaFenetre(etat, fenetre);
  assert.equal(compter(apres, OUVRAGE), 0, 'une base rasée peint encore son territoire');
  assert.equal(occupantDeLaCase(apres, ouvrage.rangee, ouvrage.colonne), NEUTRE,
    'le plancher garde sa case à une base qui n\'existe plus');
});

test('TF T11 — aucun mélange `BigInt` et `Number`, aux deux extrêmes du niveau', () => {
  // ⚠⚠ JAVASCRIPT LÈVE SUR `1n < 1`, ET C'EST LA FAUTE QUE CE TEST ATTRAPE. Un
  // zéro écrit `0` au lieu de `0n` dans la comparaison ferait tomber la carte
  // entière au premier chevauchement — pas une case de travers, une exception.
  //
  // ⚠ AUX DEUX EXTRÊMES, parce que c'est là que les types se mélangent : au
  // niveau 1 les forces sont petites et un `Number` passerait inaperçu, au
  // niveau 50 la somme dépasse `Number.MAX_SAFE_INTEGER` et un `Number` perdrait
  // des unités **exactement dans les cas serrés**.
  for (const niveau of [1, NIVEAU.plafond]) {
    const etat = creerEtat(GRAINE);
    const bande = { premiereRangee: 98, derniereRangee: 102, premiereColonne: 1, derniereColonne: 31 };
    const ouvrage = basesDeLaFenetre(etat.graine, bande).find(
      (b) => b.colonne >= 8 && b.colonne <= 24 && !estBaseOuvrage(etat.graine, b.rangee, b.colonne - 2),
    );
    joueurAu(etat, { rangee: ouvrage.rangee, colonne: ouvrage.colonne - 2 }, niveau);
    assert.doesNotThrow(() => territoireDeLaFenetre(etat, {
      premiereRangee: ouvrage.rangee - 6, derniereRangee: ouvrage.rangee + 6,
      premiereColonne: ouvrage.colonne - 8, derniereColonne: ouvrage.colonne + 6,
    }), `un mélange de types au niveau ${niveau}`);
  }

  // ⚠ LA SOMME DE DEUX FORCES AU PLAFOND DÉPASSE L'ENTIER SÛR, et c'est ce qui
  // rend les `BigInt` obligatoires plutôt que confortables. Sans cette ligne, on
  // pourrait croire que des flottants auraient suffi.
  const plafond = forceDUneBase(NIVEAU.plafond, 0);
  assert.ok(plafond > BigInt(Number.MAX_SAFE_INTEGER),
    'la force au plafond tient dans un entier sûr : la précision exacte serait gratuite');
  assert.equal(typeof plafond, 'bigint');
});

// ---------------------------------------------------------------------------
// Lot TERRITOIRE-LU — la récolte des POI demande la PROPRIÉTÉ, pas la portée
// ---------------------------------------------------------------------------

test('TL T1 — `campDeLaCase` rend EXACTEMENT ce que la carte peint', () => {
  // ⚠⚠ DEUX FONCTIONS POUR UNE MÊME RÈGLE, ET C'EST LE RISQUE QUE CE TEST PORTE.
  // `territoireDeLaFenetre` peint 2 139 cases d'un coup ; `campDeLaCase` en
  // calcule UNE, parce que la récolte des POI ne peut pas peindre une fenêtre
  // entière pour savoir si un gisement est à elle. Si les deux divergeaient d'une
  // case, on aurait deux vérités sur la même case — c'est-à-dire la faute que ce
  // lot existe pour corriger, un cran plus bas.
  const etat = creerEtat(GRAINE);
  // ⚠ LA FENÊTRE EST PRISE AU BAS DE LA CARTE, AUTOUR DU DÉPART DU JOUEUR, et
  // c'est ce qui lui fait porter les TROIS occupants. Au milieu de la carte
  // l'Ouvrage tient 100 % des rangées — mesuré, et son en-tête le dit — donc un
  // balayage là-haut ne comparerait que des cases ennemies.
  const fenetre = {
    premiereRangee: 285, derniereRangee: 300, premiereColonne: 1, derniereColonne: 31,
  };
  const carte = territoireDeLaFenetre(etat, fenetre);
  let comparees = 0;
  const vus = new Set();
  for (let r = fenetre.premiereRangee; r <= fenetre.derniereRangee; r += 1) {
    for (let c = fenetre.premiereColonne; c <= fenetre.derniereColonne; c += 1) {
      const parLaCarte = occupantDeLaCase(carte, r, c);
      assert.equal(campDeLaCase(etat, r, c), parLaCarte,
        `(${r}, ${c}) : la carte et la case ne disent pas la même chose`);
      vus.add(parLaCarte);
      comparees += 1;
    }
  }
  assert.ok(comparees > 400, `${comparees} cases comparées : le balayage ne mesure rien`);
  // ⚠ FALSIFIABLE : la fenêtre doit porter les TROIS réponses. Un balayage tout
  // neutre — ou tout à l'Ouvrage — passerait sur deux fonctions qui rendraient
  // toujours la même chose.
  assert.deepEqual([...vus].sort(), [NEUTRE, JOUEUR, OUVRAGE].sort(),
    'la fenêtre ne porte pas les trois occupants : le montage ne discrimine rien');

  // Et hors carte, `NEUTRE` — comme `occupantDeLaCase`.
  assert.equal(campDeLaCase(etat, 0, 5), NEUTRE);
  assert.equal(campDeLaCase(etat, 5, 0), NEUTRE);
  assert.equal(campDeLaCase(etat, GEOGRAPHIE.carte.hauteur + 1, 5), NEUTRE);
});

test('TL T2 — le plancher tient aussi sur UNE case : une base garde la sienne', () => {
  // ⚠ LE PLANCHER EST ÉCRIT DEUX FOIS PARCE QUE LES DEUX CHEMINS L'APPLIQUENT
  // DIFFÉREMMENT — la carte l'écrase après le partage, la case le rend avant.
  // C'est exactement le genre d'écart que `TL T1` attraperait en masse ; ce
  // test-ci le nomme.
  const etat = creerEtat(GRAINE);
  const bande = { premiereRangee: 198, derniereRangee: 202, premiereColonne: 1, derniereColonne: 31 };
  const ouvrage = basesDeLaFenetre(etat.graine, bande).find(
    (b) => b.colonne >= 8 && b.colonne <= 24 && !estBaseOuvrage(etat.graine, b.rangee, b.colonne - 3),
  );
  const position = { rangee: ouvrage.rangee, colonne: ouvrage.colonne - 3 };
  etat.bases[0].position = { ...position };
  etat.bases[0].disposition = etat.bases[0].disposition.map((b) => ({ ...b, niveau: 1 }));

  assert.equal(campDeLaCase(etat, position.rangee, position.colonne), JOUEUR,
    'la base de niveau 1 a perdu son propre pied');
  assert.equal(campDeLaCase(etat, ouvrage.rangee, ouvrage.colonne), OUVRAGE,
    'la base de l\'Ouvrage a perdu son propre pied');
  // ⚠ ET LA VOISINE, ELLE, TOMBE — sans quoi le plancher protégerait l'octogone.
  assert.equal(campDeLaCase(etat, position.rangee, position.colonne + 1), OUVRAGE);
});
