// Le peuplement de la carte — arbitrages du 29/08/2026.
//
// Ce que ces tests tiennent, dans l'ordre d'importance : aucune base ne touche
// une base, la garde autour du départ est vide MAIS pas plus large qu'annoncé,
// la densité est celle qu'Ethan a demandée, et le tout est fonction de la seule
// graine.
//
// ⚠ LA DENSITÉ SE MESURE HORS DE LA GARDE, et c'est le piège de ce fichier. Une
// fenêtre 12×12 prise dans le rayon de quinze cases porte zéro base par
// construction : les compter ferait tomber la moyenne de 12,2 à 10,8 et
// donnerait l'impression d'un réglage faux. Le test écarte donc les fenêtres qui
// mordent sur la garde — et il vérifie qu'il en reste assez pour que la mesure
// vaille quelque chose.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  estBaseOuvrage, basesDeLaFenetre, horsDeLaGarde, hachageDeCase,
} from '../src/sim/peuplement.js';
import { GEOGRAPHIE, PEUPLEMENT } from '../src/data/sites.js';
import { niveauDeLaRangee, positionDepartJoueur } from '../src/sim/carte.js';

const { largeur: LARGEUR, hauteur: HAUTEUR } = GEOGRAPHIE.carte;

/** Toutes les bases de la carte, pour une graine, en ensemble de clés. */
function carteEntiere(graine) {
  const bases = basesDeLaFenetre(graine, {
    premiereRangee: 1, derniereRangee: HAUTEUR, premiereColonne: 1, derniereColonne: LARGEUR,
  });
  return { liste: bases, cles: new Set(bases.map((k) => `${k.rangee}:${k.colonne}`)) };
}

test('peuplement — aucune base de l\'Ouvrage n\'en jouxte une autre, PAS MÊME PAR UN COIN', () => {
  // ⚠⚠ CETTE GARDE A ÉTÉ DESSERRÉE PUIS RESSERRÉE LE MÊME JOUR, LE 03/09, ET
  // C'EST LA SECONDE VERSION QUI TIENT. Le matin, elle n'interdisait plus que le
  // contact par un CÔTÉ, pour laisser passer une densité de 28 ; Ethan a refusé
  // le procédé de face — « je suis sûr à 100 % qu'on n'est pas obligé de mettre
  // des bases en diagonale ». Les huit cases du 29/08 sont de nouveau
  // interdites, et la densité se prend ailleurs : dans les TOURS.
  //
  // ⚠⚠ ET LA FALSIFIABILITÉ A CHANGÉ DE PORTEUR AVEC ELLE. « Aucun contact » est
  // satisfait trivialement par une carte creuse : c'est la version d'AVANT le
  // 03/09, qui posait 16 bases par 12 × 12, qui passerait ici sans broncher. Le
  // COMPTE est donc asserté juste en dessous, et il n'est atteignable qu'en
  // reposant des bases tour après tour.
  const HUIT = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  let bases = 0;
  for (const graine of [1, 7, 42]) {
    const { cles } = carteEntiere(graine);
    bases += cles.size;
    for (const cle of cles) {
      const [rangee, colonne] = cle.split(':').map(Number);
      for (const [dr, dc] of HUIT) {
        assert.ok(
          !cles.has(`${rangee + dr}:${colonne + dc}`),
          `bases au contact : (${rangee}, ${colonne}) et (${rangee + dr}, ${colonne + dc})`,
        );
      }
    }
  }
  // ⚠ MESURÉ : 1 570 bases pour la graine 9, environ 4 700 sur ces trois-ci. Une
  // sélection en UNE passe en rendrait autour de 3 000 — le seuil de 4 000 est
  // donc franc dans les deux sens : il dit que le balayage porte sur une vraie
  // carte, ET que les tours de peuplement ont bien eu lieu.
  assert.ok(bases > 4000,
    `${bases} bases sur trois graines : les tours de peuplement n'ont pas eu lieu`);
});

test('peuplement — la fenêtre et la case rendent le MÊME dessin, sur deux graines', () => {
  // ⚠⚠ `basesDeLaFenetre` N'APPELLE PAS `estBaseOuvrage`, ET C'EST POUR ÇA QUE
  // CE TEST EXISTE. Elle ouvre UN mémo pour toute la fenêtre, là où l'appel
  // isolé en ouvre un par case : les récursions de 1 240 cases voisines se
  // recouvrent presque entièrement, et le partage divise le coût par plus de
  // deux (5,5 ms → 2,4 ms, mesuré). C'est un raccourci de performance sur le
  // chemin le plus chaud du jeu, donc exactement le genre de chose qui peut
  // rendre un autre dessin sans qu'aucun écran ne le dise.
  //
  // ⚠⚠ ET LA FAUTE QU'IL ATTRAPE EST CELLE DU MÉMO PARTAGÉ ENTRE DEUX GRAINES.
  // La clé ne porte que la case et le tour ; un mémo qui survivrait d'un appel
  // à l'autre rendrait la carte de la PREMIÈRE graine pour toutes les
  // suivantes. D'où deux graines ici, dans cet ordre, et une assertion qu'elles
  // ne portent pas la même carte.
  const fenetre = {
    premiereRangee: 120, derniereRangee: 180, premiereColonne: 1, derniereColonne: LARGEUR,
  };
  const dessins = [];
  for (const graine of [3, 11]) {
    const parFenetre = new Set(
      basesDeLaFenetre(graine, fenetre).map((k) => `${k.rangee}:${k.colonne}`),
    );
    const parCase = new Set();
    for (let r = fenetre.premiereRangee; r <= fenetre.derniereRangee; r += 1) {
      for (let c = 1; c <= LARGEUR; c += 1) if (estBaseOuvrage(graine, r, c)) parCase.add(`${r}:${c}`);
    }
    assert.deepEqual([...parFenetre].sort(), [...parCase].sort(),
      `graine ${graine} : la fenêtre et l'appel case par case ne s'accordent pas`);
    // Falsifiable : deux ensembles vides s'accorderaient.
    assert.ok(parFenetre.size > 250, `graine ${graine} : ${parFenetre.size} bases, la fenêtre ne mesure rien`);
    dessins.push([...parFenetre].sort().join('|'));
  }
  // ⚠ ET LES DEUX GRAINES DOIVENT DIFFÉRER : sans cette ligne, un mémo qui
  // survit d'un appel à l'autre passerait, les deux cartes étant alors la même.
  assert.notEqual(dessins[0], dessins[1], 'deux graines rendent la même carte');
});

test('peuplement — la garde est vide, et elle s\'arrête où elle le dit', () => {
  const depart = positionDepartJoueur();
  const garde = PEUPLEMENT.gardeAutourDuDepart;
  const { cles } = carteEntiere(42);

  // ⚠ BASELINE REMESURÉE AU LOT EUCLIDE (02/09) : la garde était un CARRÉ, elle
  // est un DISQUE. Ce test mesurait l'écart de Tchebychev ; il mesure désormais
  // le carré de la distance euclidienne, dans la métrique qui décide. Ce qu'il
  // garde n'a pas bougé d'un mot : aucune base sous la garde, et la garde pas
  // plus large qu'annoncée.
  //
  // ⚠ AU CARRÉ, PAS EN RACINE — le test compare comme le code compare, sinon il
  // mesurerait un arrondi plutôt qu'une règle.
  let plusProcheCarre = Number.POSITIVE_INFINITY;
  for (const cle of cles) {
    const [rangee, colonne] = cle.split(':').map(Number);
    const dr = rangee - depart.rangee;
    const dc = colonne - depart.colonne;
    const carre = dr * dr + dc * dc;
    assert.ok(carre >= garde * garde,
      `base à ${Math.sqrt(carre).toFixed(2)} cases du départ, minimum ${garde}`);
    plusProcheCarre = Math.min(plusProcheCarre, carre);
  }

  // ⚠ ET LA MOITIÉ QUI COMPTE VRAIMENT : la garde ne doit pas être plus large
  // qu'annoncée. Sans cette ligne, une garde de cinquante cases passerait le
  // test précédent haut la main — et le joueur n'aurait rien à regarder. On
  // exige donc qu'une base se tienne à la distance EXACTE.
  // ⚠ EN EUCLIDE, LA BORNE N'EST PLUS ATTEINTE EXACTEMENT, et il faut le dire
  // plutôt que d'assouplir. Le carré `d² ≥ 225` n'est un entier atteignable que
  // pour les couples (dr, dc) qui le permettent : 225 tombe juste sur (15, 0) ou
  // (9, 12), et la case la plus proche d'une carte donnée n'est pas forcément
  // l'un de ces couples. On exige donc que la base la plus proche soit SERRÉE
  // contre la garde — au plus une case au-delà —, ce qui garde exactement ce que
  // l'égalité gardait : une garde de cinquante cases échouerait toujours.
  const plusProche = Math.sqrt(plusProcheCarre);
  assert.ok(plusProche >= garde && plusProche < garde + 1,
    `la base la plus proche est à ${plusProche.toFixed(2)}, attendu entre ${garde} et ${garde + 1}`);

  // La fonction elle-même, aux deux bords : à quinze on est dehors, à quatorze
  // dedans. C'est un « au moins », pas un « plus de ».
  assert.ok(horsDeLaGarde(depart.rangee - garde, depart.colonne));
  assert.ok(!horsDeLaGarde(depart.rangee - garde + 1, depart.colonne));
  // ⚠ EUCLIDE ET NON TCHEBYCHEV DEPUIS LE 02/09 : quinze colonnes d'écart
  // suffisent quand l'écart de rangée est NUL, et c'est ce qui donne encore son
  // sens à « de part et d'autre ». Ce qui a changé, c'est la DIAGONALE : elle
  // sort de la garde bien plus tôt, à onze cases de grille au lieu de quinze.
  assert.ok(horsDeLaGarde(depart.rangee, depart.colonne + garde));
  assert.ok(horsDeLaGarde(depart.rangee + 1, depart.colonne + garde));
});

test('peuplement — douze bases par carré de 12×12, mesuré hors de la garde', () => {
  const cible = PEUPLEMENT.basesParDouzeCarre;
  const tolerance = PEUPLEMENT.toleranceMesure;

  for (const graine of [1, 7, 42, 1234]) {
    const { cles } = carteEntiere(graine);
    let somme = 0;
    let fenetres = 0;
    // Pas de 3 : la mesure est une moyenne, la balayer au pas de 1 coûterait
    // neuf fois plus pour trois centièmes de différence.
    for (let r = 1; r + 11 <= HAUTEUR; r += 3) {
      for (let c = 1; c + 11 <= LARGEUR; c += 3) {
        // La fenêtre doit être ENTIÈREMENT hors garde. Les deux colonnes
        // extrêmes suffisent à le décider : la garde est un carré, donc convexe
        // en colonne comme en rangée.
        let dehors = true;
        for (let i = 0; i < 12 && dehors; i++) {
          if (!horsDeLaGarde(r + i, c) || !horsDeLaGarde(r + i, c + 11)) dehors = false;
        }
        if (!dehors) continue;
        let n = 0;
        for (let i = 0; i < 12; i++) {
          for (let j = 0; j < 12; j++) if (cles.has(`${r + i}:${c + j}`)) n += 1;
        }
        somme += n;
        fenetres += 1;
      }
    }
    // Falsifiable : sans fenêtre, la moyenne serait NaN et la comparaison
    // suivante passerait ou lèverait pour la mauvaise raison.
    assert.ok(fenetres > 200, `${fenetres} fenêtres hors garde : la mesure ne vaut rien`);
    const moyenne = somme / fenetres;
    assert.ok(
      Math.abs(moyenne - cible) <= tolerance,
      `graine ${graine} : ${moyenne.toFixed(2)} bases par 12×12, attendu ${cible} ± ${tolerance}`,
    );
  }
});

test('peuplement — le niveau d\'une base est celui de sa rangée, de 1 à 50', () => {
  // ⚠ AUCUNE RÈGLE NE FIXE LE NIVEAU DES BASES BASSES, et c'est le point de ce
  // test. « De niveau 1 à 10 » sort tout seul des rangées basses, puisque le
  // niveau se lit sur la rangée. S'il fallait une seconde table pour l'obtenir,
  // c'est qu'on aurait dupliqué la courbe.
  const { liste } = carteEntiere(42);
  const basses = liste.filter((k) => niveauDeLaRangee(k.rangee) <= 10);
  const hautes = liste.filter((k) => niveauDeLaRangee(k.rangee) > 10);

  // Les deux camps existent : « de part et d'autre du joueur », arbitré le
  // 29/08. Sans base basse, le joueur n'aurait rien à attaquer avant longtemps ;
  // sans base haute, la carte n'aurait pas de progression.
  assert.ok(basses.length > 20, `${basses.length} bases de niveau ≤ 10, trop peu`);
  assert.ok(hautes.length > 500, `${hautes.length} bases au-dessus du niveau 10, trop peu`);

  // Et il y en a des deux côtés du joueur, au sens propre : au-dessus et
  // au-dessous de sa rangée de départ.
  const depart = positionDepartJoueur();
  assert.ok(liste.some((k) => k.rangee < depart.rangee), 'aucune base au-dessus du joueur');
  assert.ok(liste.some((k) => k.rangee > depart.rangee), 'aucune base au-dessous du joueur');
});

test('peuplement — deux graines donnent deux cartes, la même graine la même carte', () => {
  const a = carteEntiere(1);
  const b = carteEntiere(1);
  const c = carteEntiere(2);

  assert.deepEqual(a.liste, b.liste, 'le peuplement doit être fonction de la seule graine');
  assert.notDeepEqual(a.liste, c.liste, 'deux parties porteraient la même carte');

  // Falsifiable dans l'autre sens : les deux cartes doivent tout de même se
  // ressembler en NOMBRE, sinon la différence viendrait d'un bug de densité et
  // pas du hasard.
  assert.ok(Math.abs(a.cles.size - c.cles.size) < a.cles.size / 5);

  // Les deux sels doivent être indépendants. S'ils rendaient la même valeur, la
  // case la plus susceptible d'être candidate serait aussi celle qui gagne ses
  // duels, et les bases se regrouperaient au lieu de se répartir.
  let identiques = 0;
  for (let r = 200; r < 260; r++) {
    for (let c2 = 1; c2 <= LARGEUR; c2++) {
      if (hachageDeCase(1, r, c2, 0) === hachageDeCase(1, r, c2, 1)) identiques += 1;
    }
  }
  assert.equal(identiques, 0, 'les deux sels rendent la même valeur : le départage est truqué');
});

test('peuplement — la fenêtre se rogne sur la carte, elle ne lève pas', () => {
  // Un écran qui défile au doigt demande naturellement des rangées au-delà du
  // bord. Lever obligerait chaque appelant à borner lui-même.
  const debordante = basesDeLaFenetre(42, {
    premiereRangee: -50, derniereRangee: 12, premiereColonne: -10, derniereColonne: LARGEUR + 40,
  });
  for (const k of debordante) {
    assert.ok(k.rangee >= 1 && k.rangee <= HAUTEUR, `rangée ${k.rangee} hors carte`);
    assert.ok(k.colonne >= 1 && k.colonne <= LARGEUR, `colonne ${k.colonne} hors carte`);
  }
  // Falsifiable : une fenêtre débordante qui ne rendrait RIEN passerait la
  // boucle ci-dessus. Elle doit contenir les mêmes bases que sa version bornée.
  const bornee = basesDeLaFenetre(42, {
    premiereRangee: 1, derniereRangee: 12, premiereColonne: 1, derniereColonne: LARGEUR,
  });
  assert.ok(bornee.length > 0, 'la fenêtre de référence est vide : rien n\'est mesuré');
  assert.deepEqual(debordante, bornee);

  // Et une case hors carte ne porte jamais de base, interrogée directement.
  assert.equal(estBaseOuvrage(42, 0, 5), false);
  assert.equal(estBaseOuvrage(42, HAUTEUR + 1, 5), false);
  assert.equal(estBaseOuvrage(42, 100, LARGEUR + 1), false);
});
