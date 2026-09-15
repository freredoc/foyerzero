import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { genererVague, budgetRaid } from '../src/sim/generateur.js';
import { GRILLE } from '../src/data/combat.js';
import { creerEtat } from '../src/sim/state.js';
import { subirUnRaid } from '../src/sim/raid-ouvrage.js';

const EMPREINTES_COMPOSITION = {
  10: '2d91ee20f057d333636f9062f6261a538e1915c213fd981d3e6689256d2e2e85',
  20: 'b5c8f0c5c16f6ee94a2559fbbb828449f5fa3b566f90cdab16ba808357f60dca',
  30: '9c4e1dc3949ec57d0b65bc882c8c2667d7f44472ec38b2dd2aa499604719ba68',
  40: '8d3523c86fbde83e09ba6379f1a057613e14a9423118ce39960470cad40a4fc7',
  50: 'c218f5007abf9bbe59874f503ec5a9e2dc738ce60a63685960b3239ae51e38e4',
};
const PLACEMENTS_AVANT = {
  10: '394a3a4e126a85d21662c2d8d9bcc8e779cebec11b74d0b44a60e9025796994e',
  20: '5b1f70b57d03ebaa5174078f1f668fff0e60e9cbfe4d9cce326d643494404efd',
  30: '7664e5c8c951f6397af8c5f3b3a1a09b606e2a5bddac2dc2468c4a0be54e3e91',
  40: '756be38f64c0d2854a6d374fd551dfbd5057b1b8e81135a5aee8c4df61e92a40',
  50: '860c9f4627faaac7405d1956eb49f862bb6a9325cd4aa0a8da2de174de0eb71d',
};
const EMPREINTES_PLACEMENT = {
  10: '35fa2d78c18d8d6a287bf3cb6892ff9abcafba2c95cfaccc7e5e4e77c23ff4c4',
  20: '1ec142076fb95b616321809e1c66f8d05ebff788fdf8d090e9f14c274d0e20a7',
  30: '46c76e62e3ba60c7cd52842907c53fb49f5d772ba7f0167693a32b1119ba6e52',
  40: '75fce3111bad64c5e0872658d4f0c97ae61ad845ef80486555e737bf506f6e06',
  50: 'c7bf38026f29863e215c15739171bba4bb8da60359378fbae64ad7a54221a9c3',
};

test('FORMATION OUVRAGE T1 — 64 graines par niveau gardent exactement leur composition', () => {
  for (const niveau of [10, 20, 30, 40, 50]) {
    const signatures = [];
    for (let graine = 1; graine <= 64; graine += 1) {
      const { unites } = genererVague({ niveau, budgetPoints: budgetRaid(niveau), graine });
      signatures.push(unites.map((u) => u.id).sort().join(','));
    }
    assert.equal(createHash('sha256').update(signatures.join('|')).digest('hex'),
      EMPREINTES_COMPOSITION[niveau], `niveau ${niveau}`);
  }
});

test('FORMATION OUVRAGE T2 — placement déterministe, borné et varié', () => {
  for (const niveau of [10, 20, 30, 40, 50]) {
    const geometries = new Set();
    const placements = [];
    for (let graine = 1; graine <= 64; graine += 1) {
      const entree = { niveau, budgetPoints: budgetRaid(niveau), graine };
      const vague = genererVague(entree);
      assert.deepEqual(vague, genererVague(entree));
      assert.ok(vague.unites.length <= 18);
      assert.ok(vague.pointsEngages <= entree.budgetPoints);
      const cases = vague.unites.map((u) => `${u.rangee}:${u.colonne}`);
      assert.equal(new Set(cases).size, cases.length);
      for (const u of vague.unites) {
        assert.ok(u.colonne >= 1 && u.colonne <= GRILLE.largeur);
        assert.ok(u.rangee >= GRILLE.bandes.deploiement.premiere
          && u.rangee <= GRILLE.bandes.deploiement.derniere);
      }
      geometries.add(cases.sort().join(','));
      placements.push(vague.unites.map((u) => `${u.id}:${u.rangee}:${u.colonne}`).join(','));
    }
    assert.ok(geometries.size >= ({ 10: 8, 20: 8, 30: 8, 40: 2, 50: 1 })[niveau],
      `niveau ${niveau} : seulement ${geometries.size} formes`);
    const empreinte = createHash('sha256').update(placements.join('|')).digest('hex');
    assert.equal(empreinte, EMPREINTES_PLACEMENT[niveau],
      `niveau ${niveau} : le placement déterministe a dérivé`);
    assert.notEqual(empreinte, PLACEMENTS_AVANT[niveau],
      `niveau ${niveau} : ancien placement inchangé`);
  }
});

test('FORMATION OUVRAGE T3 — même graine et même minute rendent le même raid', () => {
  const attaquant = { type: 'base', niveau: 30, rangee: 196, colonne: 5, baseVisee: 0 };
  const signatures = new Set();
  for (let graine = 1; graine <= 48; graine += 1) {
    const minute = 10_000 + graine;
    const premier = subirUnRaid(creerEtat(graine), attaquant, minute);
    const second = subirUnRaid(creerEtat(graine), attaquant, minute);
    assert.deepEqual(second, premier, `graine ${graine}, minute ${minute}`);
    signatures.add(JSON.stringify(premier.rejeu.vagues));
  }
  assert.ok(signatures.size >= 32,
    `${signatures.size} formations seulement sur 48 couples graine/minute`);
});
