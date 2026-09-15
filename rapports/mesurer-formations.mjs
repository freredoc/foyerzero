import { createHash } from 'node:crypto';
import { genererVague, budgetRaid } from '../src/sim/generateur.js';

const niveaux = [10, 20, 30, 40, 50];
const resultat = {};
for (const niveau of niveaux) {
  const compositions = [];
  const placements = [];
  const geometries = [];
  const tailles = [];
  for (let graine = 1; graine <= 64; graine += 1) {
    const vague = genererVague({ niveau, budgetPoints: budgetRaid(niveau), graine });
    compositions.push(vague.unites.map((u) => u.id).sort().join(','));
    placements.push(vague.unites.map((u) => `${u.id}:${u.rangee}:${u.colonne}`).join(','));
    geometries.push(vague.unites.map((u) => `${u.rangee}:${u.colonne}`).sort().join(','));
    tailles.push(vague.unites.length);
  }
  resultat[niveau] = {
    compositions: new Set(compositions).size,
    placements: new Set(placements).size,
    geometries: new Set(geometries).size,
    empreinteCompositions: createHash('sha256').update(compositions.join('|')).digest('hex'),
    tailleMin: Math.min(...tailles),
    tailleMax: Math.max(...tailles),
    empreintePlacements: createHash('sha256').update(placements.join('|')).digest('hex'),
  };
}
process.stdout.write(`${JSON.stringify(resultat, null, 2)}\n`);
