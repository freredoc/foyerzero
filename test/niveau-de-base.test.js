// Le niveau d'une base du joueur — moyenne, une décimale, ce qui est posé.
//
// Arbitrages du 27/08 assertés ici : la décimale, l'arrondi, et le périmètre
// (seulement ce qui est posé, Chantier compris).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { moyenneEnDixiemes, niveauDesBatiments } from '../src/sim/niveau-de-base.js';
import { dispositionNouvelleBase } from '../src/sim/disposition.js';
import { creerRng, entier } from '../src/sim/rng.js';

test('niveau — la moyenne se rend à UNE décimale, en dixièmes entiers', () => {
  // Montage falsifiable : il faut des cas dont la moyenne N'EST PAS entière,
  // sinon la décimale ne serait jamais mise à l'épreuve.
  assert.equal(moyenneEnDixiemes([5, 6]), 55, '5 et 6 font 5,5');
  assert.equal(moyenneEnDixiemes([5, 5, 6]), 53, '16/3 = 5,333… donne 5,3');
  assert.equal(moyenneEnDixiemes([7]), 70, 'une seule valeur vaut dix fois elle-même');

  // Et le résultat est TOUJOURS un entier : un flottant qui traînerait se
  // sérialiserait en 5.799999999999999.
  const rng = creerRng(2026);
  for (let i = 0; i < 200; i++) {
    const liste = [];
    for (let k = entier(rng, 1, 12); k > 0; k--) liste.push(entier(rng, 1, 50));
    const d = moyenneEnDixiemes(liste);
    assert.ok(Number.isInteger(d), `${d} n'est pas un entier`);
    assert.ok(d >= 10 && d <= 500, `${d} hors des bornes 1,0 – 50,0`);
  }
});

test('niveau — l\'arrondi se fait à la DEMIE SUPÉRIEURE, en entiers', () => {
  // Le cas pile sur la demie de dixième : 23/4 = 5,75 → 57,5 dixièmes.
  assert.equal(moyenneEnDixiemes([5, 6, 6, 6]), 58, '5,75 doit monter à 5,8');
  // Et son symétrique juste en dessous : 21/4 = 5,25 → 52,5 dixièmes.
  assert.equal(moyenneEnDixiemes([5, 5, 5, 6]), 53, '5,25 doit monter à 5,3');

  // Falsifiable contre le chemin flottant : sur 3 000 listes tirées, la formule
  // entière et `Math.round(somme * 10 / n)` doivent coïncider partout. Si elles
  // divergent un jour, c'est le flottant qui a tort, et on veut le savoir.
  const rng = creerRng(7);
  let demies = 0;
  for (let i = 0; i < 3000; i++) {
    const liste = [];
    for (let k = entier(rng, 1, 40); k > 0; k--) liste.push(entier(rng, 1, 50));
    const somme = liste.reduce((a, b) => a + b, 0);
    if ((somme * 20) % (2 * liste.length) === liste.length) demies++;
    assert.equal(
      moyenneEnDixiemes(liste), Math.round((somme * 10) / liste.length),
      `divergence sur ${JSON.stringify(liste)}`,
    );
  }
  // Le montage ne prouve l'arrondi que s'il a RENCONTRÉ des demies exactes.
  assert.ok(demies > 0, 'aucun cas pile sur la demie : le tirage ne teste pas l\'arrondi');
});

test('niveau — la moyenne ne dépend pas de l\'ordre', () => {
  const rng = creerRng(99);
  for (let i = 0; i < 100; i++) {
    const liste = [];
    for (let k = entier(rng, 2, 20); k > 0; k--) liste.push(entier(rng, 1, 50));
    const melangee = [...liste].reverse();
    // Falsifiable : une liste déjà symétrique ne mesurerait rien.
    if (JSON.stringify(liste) === JSON.stringify(melangee)) continue;
    assert.equal(moyenneEnDixiemes(liste), moyenneEnDixiemes(melangee));
  }
});

test('niveau — SEUL CE QUI EST POSÉ compte, Chantier compris', () => {
  // Une base neuve : un seul bâtiment, le Chantier niveau 1.
  const neuve = dispositionNouvelleBase();
  assert.equal(neuve.length, 1, 'une base neuve porte exactement un bâtiment');
  assert.equal(niveauDesBatiments(neuve), 10, 'un Chantier niveau 1 fait une base 1,0');

  // Trois bâtiments posés, de niveaux différents.
  const posee = [
    { id: 'chantierDeConstruction', rangee: 18, colonne: 5, niveau: 1 },
    { id: 'collecteur', rangee: 14, colonne: 3, niveau: 8 },
    { id: 'raffinerie', rangee: 15, colonne: 3, niveau: 6 },
  ];
  assert.equal(niveauDesBatiments(posee), 50, '15/3 = 5,0');

  // ⚠ LES DEUX FAÇONS DE SE TROMPER, ASSERTÉES DE FACE — sans elles, le 50
  // ci-dessus pourrait sortir d'un calcul faux qui tombe juste.
  //
  // Compter les emplacements vides pour zéro : la base neuve ouvre deux
  // emplacements et n'en occupe qu'un, donc la moyenne tomberait à 0,5.
  assert.notEqual(niveauDesBatiments(neuve), 5, 'les emplacements vides sont comptés');
  //
  // Exclure le Chantier : il reste 14/2 = 7,0 au lieu de 5,0.
  const sansChantier = posee.filter((b) => b.id !== 'chantierDeConstruction');
  assert.equal(moyenneEnDixiemes(sansChantier.map((b) => b.niveau)), 70);
  assert.notEqual(niveauDesBatiments(posee), 70, 'le Chantier a été exclu de la moyenne');
});

test('niveau — une base sans bâtiment LÈVE, elle ne vaut pas zéro', () => {
  // Rendre 0 ferait passer un état impossible pour une base de niveau zéro.
  assert.throws(() => moyenneEnDixiemes([]), RangeError);
  assert.throws(() => niveauDesBatiments([]), RangeError);

  // Et une entrée qui n'est pas une liste de niveaux entiers ≥ 1 est refusée,
  // plutôt que de produire un NaN qui voyagerait jusqu'à l'écran.
  assert.throws(() => moyenneEnDixiemes([5, 0]), RangeError);
  assert.throws(() => moyenneEnDixiemes([5, 2.5]), RangeError);
  assert.throws(() => moyenneEnDixiemes([5, undefined]), RangeError);
  assert.throws(() => moyenneEnDixiemes('5'), TypeError);
  assert.throws(() => niveauDesBatiments(null), TypeError);
});
