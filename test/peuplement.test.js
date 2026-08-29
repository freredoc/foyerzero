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

test('peuplement — aucune base de l\'Ouvrage n\'en touche une autre', () => {
  // La règle des huit cases, balayée sur la carte entière et sur trois graines.
  // C'est la seule des quatre propriétés qui doit tenir SANS AUCUNE exception :
  // une moyenne se discute, un contact non.
  let bases = 0;
  for (const graine of [1, 7, 42]) {
    const { cles } = carteEntiere(graine);
    bases += cles.size;
    for (const cle of cles) {
      const [rangee, colonne] = cle.split(':').map(Number);
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          assert.ok(
            !cles.has(`${rangee + dr}:${colonne + dc}`),
            `bases en contact : (${rangee}, ${colonne}) et (${rangee + dr}, ${colonne + dc})`,
          );
        }
      }
    }
  }
  // Falsifiable : une carte vide satisferait la boucle ci-dessus sans rien dire.
  assert.ok(bases > 1500, `${bases} bases sur trois graines : le balayage ne mesure rien`);
});

test('peuplement — la garde est vide, et elle s\'arrête où elle le dit', () => {
  const depart = positionDepartJoueur();
  const garde = PEUPLEMENT.gardeAutourDuDepart;
  const { cles } = carteEntiere(42);

  // Aucune base à moins de quinze cases.
  let plusProche = Number.POSITIVE_INFINITY;
  for (const cle of cles) {
    const [rangee, colonne] = cle.split(':').map(Number);
    const ecart = Math.max(Math.abs(rangee - depart.rangee), Math.abs(colonne - depart.colonne));
    assert.ok(ecart >= garde, `base à ${ecart} cases du départ, minimum ${garde}`);
    plusProche = Math.min(plusProche, ecart);
  }

  // ⚠ ET LA MOITIÉ QUI COMPTE VRAIMENT : la garde ne doit pas être plus large
  // qu'annoncée. Sans cette ligne, une garde de cinquante cases passerait le
  // test précédent haut la main — et le joueur n'aurait rien à regarder. On
  // exige donc qu'une base se tienne à la distance EXACTE.
  assert.equal(plusProche, garde, `la base la plus proche est à ${plusProche}, pas à ${garde}`);

  // La fonction elle-même, aux deux bords : à quinze on est dehors, à quatorze
  // dedans. C'est un « au moins », pas un « plus de ».
  assert.ok(horsDeLaGarde(depart.rangee - garde, depart.colonne));
  assert.ok(!horsDeLaGarde(depart.rangee - garde + 1, depart.colonne));
  // Tchebychev et non euclidien : quinze colonnes suffisent, quel que soit
  // l'écart de rangée. C'est ce qui donne son sens à « de part et d'autre ».
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
