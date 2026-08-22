// Tests 3 et 4 du brief : déterminisme de la boucle, absence de dépendance navigateur.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  TICK_MS,
  creerHorloge,
  tick,
  accumuler,
  avancerTicks,
} from '../src/sim/clock.js';
import { creerRng, tirer } from '../src/sim/rng.js';

test('horloge — tick() avance d’exactement 100 ms simulées', () => {
  const h = creerHorloge();
  assert.equal(TICK_MS, 100);
  for (let i = 1; i <= 1000; i++) {
    tick(h);
    assert.equal(h.tempsSimuleMs, i * 100, `dérive au tick ${i}`);
    assert.equal(h.nbTicks, i);
  }
});

test('horloge — le temps réel injecté est converti en ticks sans perte ni invention', () => {
  const h = creerHorloge();
  // Injections irrégulières : 37 ms, 63 ms, 250 ms, 1 ms… le total fait foi.
  const injections = [37, 63, 250, 1, 49, 100, 9999, 1];
  let totalMs = 0;
  let totalTicks = 0;
  for (const ms of injections) {
    totalMs += ms;
    totalTicks += accumuler(h, ms);
  }
  assert.equal(totalTicks, Math.floor(totalMs / TICK_MS), 'ticks dus incorrects');
  assert.equal(h.residuMs, totalMs - totalTicks * TICK_MS, 'reliquat incorrect');
  assert.ok(h.residuMs >= 0 && h.residuMs < TICK_MS);
});

test('horloge — avancerTicks(n) est strictement équivalent à n tick()', () => {
  const a = creerHorloge();
  const b = creerHorloge();
  for (let i = 0; i < 12_345; i++) tick(a);
  avancerTicks(b, 12_345);
  assert.deepEqual(a, b);
});

test('test 3 — 10 000 ticks, même graine, même état initial : états strictement égaux', async () => {
  // La boucle complète (état de jeu + économie) est branchée dès que state.js
  // existe ; l'import est dynamique pour que ce test désigne explicitement la
  // boucle réelle du jeu et non un montage ad hoc.
  const { creerEtat, tickJeu } = await import('../src/sim/state.js');
  const { PARAMS } = await import('../src/data/params.js');

  const faireTourner = () => {
    const etat = creerEtat(424242, PARAMS);
    for (let i = 0; i < 10_000; i++) tickJeu(etat, PARAMS);
    return etat;
  };

  const a = faireTourner();
  const b = faireTourner();
  assert.equal(JSON.stringify(a), JSON.stringify(b), 'deux exécutions identiques divergent');

  // Montage falsifiable : une graine différente doit produire un état différent
  // (la graine est dans l'état), sinon la comparaison ne prouve rien.
  const c = creerEtat(424243, PARAMS);
  for (let i = 0; i < 10_000; i++) tickJeu(c, PARAMS);
  assert.notEqual(JSON.stringify(a), JSON.stringify(c));
});

test('test 3 bis — le déterminisme tient aussi quand le PRNG est consommé dans la boucle', () => {
  // Aucun combat dans ce lot : la boucle économique ne tire pas encore de
  // nombres. On vérifie donc séparément que clock + rng combinés restent
  // reproductibles quand chaque tick consomme un tirage.
  const faireTourner = (graine) => {
    const h = creerHorloge();
    const rng = creerRng(graine);
    let temoin = 0;
    for (let i = 0; i < 10_000; i++) {
      tick(h);
      temoin += tirer(rng);
    }
    return JSON.stringify({ h, rng, temoin });
  };
  assert.equal(faireTourner(31337), faireTourner(31337));
  assert.notEqual(faireTourner(31337), faireTourner(31338));
});

test('test 4 — src/sim/ ne contient aucune référence navigateur ni horloge système', () => {
  const racineSim = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'sim');
  const interdits = [
    /\bwindow\b/,
    /\bdocument\b/,
    /\blocalStorage\b/,
    /\bsetTimeout\b/,
    /\bsetInterval\b/,
    /\brequestAnimationFrame\b/,
    /\bXMLHttpRequest\b/,
    /\bfetch\b/,
    /\bnavigator\b/,
    /Math\s*\.\s*random/,
    /Date\s*\.\s*now/,
    /performance\s*\.\s*now/,
    /new\s+Date\b/,
  ];

  const fichiers = readdirSync(racineSim, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.js'))
    .map((e) => join(e.parentPath, e.name));

  assert.ok(fichiers.length >= 4, `montage cassé : ${fichiers.length} fichier(s) trouvé(s) dans src/sim/`);

  const violations = [];
  for (const fichier of fichiers) {
    const contenu = readFileSync(fichier, 'utf8');
    for (const motif of interdits) {
      const m = contenu.match(motif);
      if (m) violations.push(`${fichier} : « ${m[0]} »`);
    }
  }
  assert.deepEqual(violations, [], `références interdites dans src/sim/ :\n${violations.join('\n')}`);

  // Montage falsifiable : les motifs doivent effectivement détecter une
  // violation si on leur en présente une.
  const appat = 'const t = Date.now(); window.x = 1;';
  assert.ok(
    interdits.some((motif) => motif.test(appat)),
    'les motifs interdits ne détectent même pas un appât évident',
  );
});
