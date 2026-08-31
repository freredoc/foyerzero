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
  RAYONS, NEUTRE, JOUEUR, OUVRAGE,
} from '../src/sim/territoire.js';
import { TEINTES_TERRITOIRE, epaisseurDeFrontiere } from '../src/ui/monde.js';
import { GEOGRAPHIE, EMBLEMES_CARTE, TYPES_SITE, ZOOM_CARTE } from '../src/data/sites.js';
import { creerEtat } from '../src/sim/state.js';
import { estBaseOuvrage } from '../src/sim/peuplement.js';

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
  const centre = etat.position;
  const carte = territoireDeLaFenetre(etat, autour(centre, 8));

  // On COMPTE les cases du joueur, et on les confronte au disque de Tchebychev.
  let compte = 0;
  for (let r = centre.rangee - 8; r <= centre.rangee + 8; r += 1) {
    for (let c = centre.colonne - 8; c <= centre.colonne + 8; c += 1) {
      const dedans = Math.max(Math.abs(r - centre.rangee), Math.abs(c - centre.colonne))
        <= RAYONS[JOUEUR];
      const occ = occupantDeLaCase(carte, r, c);
      if (dedans) {
        assert.equal(occ, JOUEUR, `(${r}, ${c}) devrait être au joueur`);
        compte += 1;
      } else {
        assert.notEqual(occ, JOUEUR, `(${r}, ${c}) ne devrait pas être au joueur`);
      }
    }
  }
  // ⚠ TCHEBYCHEV, PAS EUCLIDIEN : un disque euclidien de rayon 2 ferait 13 cases,
  // pas 25. Le compte est ce qui distingue les deux, et c'est pour ça qu'il est
  // asserté plutôt que dérivé de la même formule que le code.
  assert.equal(compte, (2 * RAYONS[JOUEUR] + 1) ** 2);
  assert.equal(compte, 25, 'le rayon 2 de la spec ne fait plus 25 cases');
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
  etat.position = { rangee: chevauche.rangee, colonne: chevauche.colonne };
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
  const centre = etat.position;

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

  // ⚠ ET CE QU'ON ATTEND ICI, C'EST ZÉRO BORDURE : les neuf cases regardées sont
  // au cœur du territoire. Une seule suffit à dire que la vue a inventé un cadre.
  assert.deepEqual(serree, [],
    'le bord de la FENÊTRE est compté comme une frontière : l\'anneau de contexte manque');

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

test('territoire — les côtés exposés sont ceux du carré, et rien d\'autre', () => {
  const etat = creerEtat(GRAINE);
  const centre = etat.position;
  const bords = bordsDuTerritoire(territoireDeLaFenetre(etat, autour(centre, 8)))
    .filter((b) => b.camp === JOUEUR);
  const rayon = RAYONS[JOUEUR];

  // Le centre du carré n'est pas une bordure : ses quatre voisines sont à lui.
  assert.ok(!bords.some((b) => b.rangee === centre.rangee && b.colonne === centre.colonne),
    'le centre du territoire est compté comme une bordure');

  // Les 5 × 5 moins le 3 × 3 intérieur : seize cases portent un côté.
  assert.equal(bords.length, (2 * rayon + 1) ** 2 - (2 * rayon - 1) ** 2);

  // Un coin porte DEUX côtés, un milieu de côté n'en porte qu'UN.
  const coin = bords.find((b) => b.rangee === centre.rangee - rayon
    && b.colonne === centre.colonne - rayon);
  assert.ok(coin, 'le coin nord-ouest n\'est pas une bordure');
  assert.deepEqual(
    { nord: coin.nord, ouest: coin.ouest, sud: coin.sud, est: coin.est },
    { nord: true, ouest: true, sud: false, est: false },
  );
  const milieu = bords.find((b) => b.rangee === centre.rangee - rayon
    && b.colonne === centre.colonne);
  assert.deepEqual(
    { nord: milieu.nord, ouest: milieu.ouest, sud: milieu.sud, est: milieu.est },
    { nord: true, ouest: false, sud: false, est: false },
  );
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
    rangee: etat.position.rangee - RAYONS[JOUEUR] - 2,
    colonne: etat.position.colonne,
  };
  assert.ok(!estBaseOuvrage(etat.graine, loin.rangee, loin.colonne),
    'montage : la case choisie porte déjà une base de l\'Ouvrage');
  const avant = territoireDeLaFenetre(etat, autour(etat.position, 8));
  const occAvant = occupantDeLaCase(avant, loin.rangee, loin.colonne);

  etat.satellites.presents.push({
    type: 'camp', rangee: loin.rangee, colonne: loin.colonne, niveau: 1, instance: 1,
    tickDeReleve: 999_999,
  });
  const apres = territoireDeLaFenetre(etat, autour(etat.position, 8));
  assert.equal(occupantDeLaCase(apres, loin.rangee, loin.colonne), occAvant,
    'un camp a peint du territoire : seules les bases doivent le faire');
});

test('territoire — une base du joueur, et la liste est prête pour plusieurs', () => {
  const etat = creerEtat(GRAINE);
  const bases = basesDuJoueur(etat);
  assert.equal(bases.length, 1, 'l\'état ne porte structurellement qu\'une base');
  assert.deepEqual(bases[0], etat.position);
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

test('frontières — l\'épaisseur suit le cran, elle ne s\'écrit pas', () => {
  // Un nombre fixe serait un fil au cran le plus serré et un pâté au plus large.
  const epaisseurs = ZOOM_CARTE.crans.map(epaisseurDeFrontiere);
  for (let i = 1; i < epaisseurs.length; i += 1) {
    assert.ok(epaisseurs[i] > epaisseurs[i - 1],
      `l'épaisseur ne suit pas le cran : ${epaisseurs.join(', ')}`);
  }
  // ⚠ PLANCHER À UN PIXEL : un trait plus fin ne se dessine pas du tout.
  assert.ok(epaisseurs.every((e) => e >= 1));
  assert.equal(epaisseurDeFrontiere(1), 1);
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
