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

// ---------------------------------------------------------------------------
// Vecteur de référence figé.
//
// Les tests 1 et 2 vérifient la REPRODUCTIBILITÉ et la SÉRIALISATION : deux
// propriétés qui restent vraies même si l'algorithme change entièrement. Elles
// ne protègent donc de rien si mulberry32 est un jour remplacé ou modifié.
//
// Or une graine est une promesse de compatibilité : un combat rejoué depuis sa
// graine, une sauvegarde reprise, un batch de calibrage reproduit — tout casse
// en silence si la suite produite change. Ce test fige la suite elle-même.
//
// Vérifié par sabotage : modifier une constante interne de tirer() (par exemple
// `t | 61` en `t | 63`) ne faisait échouer AUCUN test avant celui-ci.
//
// Si ce test échoue, ce n'est PAS un test à mettre à jour : c'est une rupture
// de compatibilité à décider explicitement, et à accompagner d'une migration.
// ---------------------------------------------------------------------------
test('vecteur figé — la suite produite par une graine ne doit jamais changer', () => {
  const r = creerRng(12345);
  const obtenu = Array.from({ length: 8 }, () => Number(tirer(r).toFixed(12)));
  assert.deepStrictEqual(obtenu, [
    0.979728267761, 0.3067522645, 0.484205421526, 0.817934412509,
    0.509428369347, 0.34747186047, 0.073757541832, 0.766396467341,
  ]);

  const r2 = creerRng(1);
  assert.deepStrictEqual(
    Array.from({ length: 4 }, () => Number(tirer(r2).toFixed(12))),
    [0.627073940588, 0.00273572118, 0.52744703996, 0.981050967472],
  );

  // Le helper entier() est figé lui aussi : c'est lui que le combat utilisera.
  const r3 = creerRng(2026);
  assert.deepStrictEqual(
    Array.from({ length: 10 }, () => entier(r3, 1, 6)),
    [3, 2, 4, 4, 1, 2, 5, 5, 2, 1],
  );
});
