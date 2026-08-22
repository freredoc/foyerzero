// Tests 1 et 2 du brief : reproductibilité et sérialisation du PRNG.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  creerRng,
  restaurerRng,
  tirer,
  entier,
  choisir,
  melanger,
} from '../src/sim/rng.js';

test('test 1 — deux instances de même graine produisent 10 000 tirages identiques', () => {
  const a = creerRng(123456789);
  const b = creerRng(123456789);
  for (let i = 0; i < 10_000; i++) {
    const va = tirer(a);
    const vb = tirer(b);
    assert.equal(va, vb, `divergence au tirage ${i} : ${va} !== ${vb}`);
    assert.ok(va >= 0 && va < 1, `tirage ${i} hors de [0,1) : ${va}`);
  }
});

test('test 1 — deux graines différentes divergent avant le 10e tirage', () => {
  const a = creerRng(1);
  const b = creerRng(2);
  let divergence = -1;
  for (let i = 0; i < 10; i++) {
    if (tirer(a) !== tirer(b)) {
      divergence = i;
      break;
    }
  }
  assert.notEqual(divergence, -1, 'aucune divergence sur les 10 premiers tirages');
});

test('test 2 — sérialiser après 500 tirages, restaurer, poursuivre : suite identique', () => {
  const temoin = creerRng(987654321);
  const interrompu = creerRng(987654321);

  for (let i = 0; i < 500; i++) {
    tirer(temoin);
    tirer(interrompu);
  }

  // Aller-retour JSON complet, comme dans une vraie sauvegarde.
  const sauvegarde = JSON.stringify(interrompu);
  const restaure = restaurerRng(JSON.parse(sauvegarde));

  for (let i = 0; i < 5_000; i++) {
    const attendu = tirer(temoin);
    const obtenu = tirer(restaure);
    assert.equal(obtenu, attendu, `divergence après restauration, tirage ${500 + i}`);
  }
});

test('helpers — entier(min,max) reste dans les bornes et les atteint', () => {
  const rng = creerRng(42);
  let vuMin = false;
  let vuMax = false;
  for (let i = 0; i < 10_000; i++) {
    const v = entier(rng, 3, 7);
    assert.ok(Number.isInteger(v) && v >= 3 && v <= 7, `valeur hors bornes : ${v}`);
    if (v === 3) vuMin = true;
    if (v === 7) vuMax = true;
  }
  assert.ok(vuMin && vuMax, 'les bornes 3 et 7 ne sont jamais atteintes en 10 000 tirages');
});

test('helpers — choisir ne renvoie que des éléments du tableau', () => {
  const rng = creerRng(7);
  const source = ['quartz', 'scorie', 'foyer'];
  for (let i = 0; i < 1_000; i++) {
    assert.ok(source.includes(choisir(rng, source)));
  }
});

test('helpers — melanger est une permutation, reproductible à graine égale', () => {
  const a = melanger(creerRng(2024), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const b = melanger(creerRng(2024), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(a, b, 'deux mélanges de même graine diffèrent');
  assert.deepEqual([...a].sort((x, y) => x - y), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const c = melanger(creerRng(2025), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.notDeepEqual(a, c, 'deux graines différentes donnent le même mélange');
});
