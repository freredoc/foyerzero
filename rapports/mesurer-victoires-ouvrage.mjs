import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const racineSrc = resolve(process.argv[2] ?? 'src');
const importer = (nom) => import(pathToFileURL(resolve(racineSrc, nom)).href);
const { creerEtat } = await importer('sim/state.js');
const { subirUnRaid } = await importer('sim/raid-ouvrage.js');

const resultat = {};
for (const niveau of [10, 20, 30, 40, 50]) {
  const verdicts = { 'victoire-totale': 0, defaite: 0, 'defaite-totale': 0 };
  for (let graine = 1; graine <= 32; graine += 1) {
    const etat = creerEtat(graine);
    const base = etat.bases[0];
    base.position = { rangee: 200, colonne: 5 };
    base.disposition[0].niveau = niveau;
    base.disposition.push(
      { id: 'centreDeCommandement', rangee: 16, colonne: 3, niveau, degatsMilli: 0 },
      { id: 'qgDeDefense', rangee: 16, colonne: 7, niveau, degatsMilli: 0 },
      { id: 'caserne', rangee: 17, colonne: 5, niveau, degatsMilli: 0 },
    );
    base.garnison = Array.from({ length: 12 }, (_, i) => ({
      id: i % 2 ? 'casemate' : 'merlon',
      rangee: 5 + Math.floor(i / 6), colonne: 2 + (i % 6), niveau, degatsMilli: 0,
    }));
    const attaquant = { type: 'base', niveau, rangee: 196, colonne: 5, baseVisee: 0 };
    const rapport = subirUnRaid(etat, attaquant, 100 + graine);
    verdicts[rapport.verdict] += 1;
  }
  resultat[niveau] = verdicts;
}
process.stdout.write(`${JSON.stringify(resultat, null, 2)}\n`);
