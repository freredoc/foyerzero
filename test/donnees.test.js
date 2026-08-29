// Invariants des tables de `src/data/` — cohérence interne et références
// croisées, sans passer par le moteur.
//
// POURQUOI CE FICHIER EXISTE. Ces contrôles vivaient dans `verif.mjs`, un
// script de la racine qu'aucune commande ne lançait. Il a pourri sans que rien
// ne le dise : il importait `MATRICE_COLONNES`, renommé `COLONNES_DEGATS`
// depuis, et plantait donc à l'import. Pire, sa boucle sur les matrices testait
// `u.matrice` sur des entités qui portent `u.degats` : même l'import réparé,
// elle aurait sauté toutes les entités EN SILENCE et affiché « ok ».
//
// Un audit hors de `npm run check` ne s'exécute pas, donc n'existe pas. Les
// invariants qui suivent sont ceux de `verif.mjs`, remis d'aplomb sur les
// données actuelles, moins ceux que la suite couvrait déjà :
//   - « 14 unités, 9 défenses » → `roster.test.js`
//   - bandes contiguës et 72 cases de bâtiments → `grille.test.js`
// et moins un devenu FAUX : `verif.mjs` bornait les matrices de dégâts à
// [0, 1]. C'étaient des coefficients ; `degats` porte aujourd'hui des dégâts
// ABSOLUS, jusqu'à 300. Le borner à 1 aurait échoué sur 51 valeurs. Ce qui
// reste vérifiable, ce sont les CLÉS.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { GRILLE, UNITES, DEFENSES, MODULES, COLONNES_DEGATS } from '../src/data/combat.js';
import {
  BATIMENTS, DENSITE, GARNISON, VAGUES, POINTS_RECHERCHE, RAID_OUVRAGE,
} from '../src/data/sites.js';
import { NIVEAU } from '../src/data/niveaux.js';
import { ECONOMIE_NIVEAU } from '../src/data/economie.js';

test('données — les colonnes de dégâts sont exactement COLONNES_DEGATS', () => {
  let mesurees = 0;
  for (const [id, e] of Object.entries({ ...UNITES, ...DEFENSES })) {
    if (!e.degats) continue;
    mesurees += 1;
    assert.deepEqual(
      Object.keys(e.degats), COLONNES_DEGATS,
      `${id} : colonnes de dégâts divergentes`,
    );
    for (const [colonne, v] of Object.entries(e.degats)) {
      assert.ok(
        Number.isInteger(v) && v >= 0,
        `${id}.${colonne} = ${v} : un dégât est un entier ≥ 0`,
      );
    }
  }
  // Le montage doit avoir vu la quasi-totalité du roster, sinon il ne mesure
  // rien — c'est exactement l'écueil de `verif.mjs`, qui sautait TOUT.
  // MESURÉ : 20 entités sur 23 portent des dégâts (les 3 autres sont des murs
  // et barrières, qui ne tirent pas).
  assert.equal(mesurees, 20, `${mesurees} entités porteuses de dégâts, 20 attendues`);
});

test('données — la spécialité bascule antiStructure → antiAerien en défense', () => {
  let mesurees = 0;
  for (const [id, u] of Object.entries(UNITES)) {
    if (!u.defense?.present) continue;
    mesurees += 1;
    const attendu = u.specialite === 'antiStructure' ? 'antiAerien' : u.specialite;
    assert.equal(u.defense.cible, attendu, `${id} : ${u.specialite} devrait viser ${attendu}`);
  }
  // MESURÉ : 8 unités sur 14 sont présentes en défense.
  assert.equal(mesurees, 8, `${mesurees} unités présentes en défense, 8 attendues`);
});

test('données — aucun aéronef ne défend', () => {
  for (const [id, u] of Object.entries(UNITES)) {
    assert.ok(
      !(u.chassis === 'aeronef' && u.defense?.present),
      `${id} est un aéronef et il est présent en défense`,
    );
  }
  // Il doit exister des aéronefs, sinon l'invariant est vide de sens.
  // MESURÉ : 4 aéronefs au roster. S'il n'y en avait aucun, l'invariant serait
  // vrai par vacuité et ne prouverait rien.
  const aeronefs = Object.values(UNITES).filter((u) => u.chassis === 'aeronef').length;
  assert.equal(aeronefs, 4, `${aeronefs} aéronefs, 4 attendus`);
});

test('données — tout module référencé est défini dans MODULES', () => {
  let references = 0;
  const verifier = (m, ou) => {
    if (!m) return;
    references += 1;
    assert.ok(MODULES[m] !== undefined, `${ou} référence le module inconnu « ${m} »`);
  };
  for (const [id, u] of Object.entries(UNITES)) {
    verifier(u.module, `unité ${id}`);
    verifier(u.moduleOuvrage, `unité ${id} (ouvrage)`);
    verifier(u.defense?.module, `unité ${id} (défense)`);
  }
  for (const [id, d] of Object.entries(DEFENSES)) {
    verifier(d.moduleJoueur, `défense ${id} (joueur)`);
    verifier(d.moduleOuvrage, `défense ${id} (ouvrage)`);
  }
  // MESURÉ : 42 références vers 14 modules définis. Le montage a donc bien
  // parcouru les deux tables et les trois emplacements de chaque unité.
  assert.equal(references, 42, `${references} modules référencés, 42 attendus`);
  assert.equal(Object.keys(MODULES).length, 14, 'le glossaire des modules a changé de taille');
});

test('données — les parts des bâtiments proportionnels somment à 1, et deux sont uniques', () => {
  const proportionnels = Object.values(BATIMENTS).filter((b) => !b.unique);
  const somme = proportionnels.reduce((s, b) => s + b.part, 0);
  assert.ok(
    Math.abs(somme - 1) < 1e-9,
    `somme des parts = ${somme}, attendue 1 (à 1e-9 près, les parts sont des réels)`,
  );
  // MESURÉ : exactement 3 proportionnels — noeud 0,4 · gangue 0,3 · terril 0,3.
  // Un seuil « au moins 5 » aurait été deviné, et il était FAUX.
  assert.equal(proportionnels.length, 3, `${proportionnels.length} bâtiments proportionnels, 3 attendus`);
  assert.equal(
    Object.values(BATIMENTS).filter((b) => b.unique).length, 2,
    'exactement deux bâtiments uniques attendus',
  );
});

test('données — GARNISON et VAGUES : sommes à 100, ids connus, déblocage respecté', () => {
  const connus = new Set([...Object.keys(UNITES), ...Object.keys(DEFENSES)]);
  let lignes = 0;
  for (const [nom, table] of [['GARNISON', GARNISON], ['VAGUES', VAGUES]]) {
    for (const [niveau, ligne] of Object.entries(table.parNiveau)) {
      lignes += 1;
      const somme = Object.values(ligne).reduce((s, x) => s + x, 0);
      assert.ok(
        Math.abs(somme - 100) < 1e-9,
        `${nom} niveau ${niveau} : somme ${somme}, attendue 100`,
      );
      for (const id of Object.keys(ligne)) {
        assert.ok(connus.has(id), `${nom} niveau ${niveau} : id inconnu « ${id} »`);
        const apparition = (UNITES[id] ?? DEFENSES[id]).apparition;
        assert.ok(
          Number(niveau) >= apparition,
          `${nom} niveau ${niveau} : ${id} n'apparaît qu'au niveau ${apparition}`,
        );
      }
    }
  }
  // MESURÉ : 11 lignes de part et d'autre, soit 22 au total.
  assert.equal(lignes, 22, `${lignes} lignes de composition parcourues, 22 attendues`);
});

test('données — la garnison ne tire que des entités présentes en défense, les vagues aucune structure', () => {
  for (const [niveau, ligne] of Object.entries(GARNISON.parNiveau)) {
    for (const id of Object.keys(ligne)) {
      if (!UNITES[id]) continue; // une DEFENSE est par nature défensive
      assert.ok(
        UNITES[id].defense?.present,
        `GARNISON niveau ${niveau} : ${id} n'est pas présent en défense`,
      );
    }
  }
  for (const [niveau, ligne] of Object.entries(VAGUES.parNiveau)) {
    for (const id of Object.keys(ligne)) {
      assert.ok(
        DEFENSES[id] === undefined,
        `VAGUES niveau ${niveau} : ${id} est une structure, elle n'attaque pas`,
      );
    }
  }
});

test('données — le barème de recherche est EXACTEMENT le pool défensif', () => {
  const pool = new Set();
  for (const ligne of Object.values(GARNISON.parNiveau)) {
    for (const id of Object.keys(ligne)) pool.add(id);
  }
  const bareme = new Set(Object.keys(POINTS_RECHERCHE.parCible));
  const manquants = [...pool].filter((id) => !bareme.has(id));
  const enTrop = [...bareme].filter((id) => !pool.has(id));
  assert.deepEqual(manquants, [], 'des cibles du pool défensif ne rapportent aucun point');
  assert.deepEqual(enTrop, [], 'le barème paie des cibles qui n’apparaissent jamais en garnison');
  // MESURÉ : 17 entités dans le pool défensif, donc 17 au barème.
  assert.equal(pool.size, 17, `pool défensif de ${pool.size} entités, 17 attendues`);
});

test('données — la densité tient dans les 72 cases, et un camp n’est jamais plus dense qu’un avant-poste', () => {
  let niveaux = 0;
  for (const [niveau, d] of Object.entries(DENSITE.parNiveau)) {
    niveaux += 1;
    const base = Math.round(d.avantPoste.batiments * DENSITE.facteurBase);
    assert.ok(
      base <= GRILLE.casesBatiments,
      `niveau ${niveau} : une base ferait ${base} bâtiments pour ${GRILLE.casesBatiments} cases`,
    );
    assert.ok(
      d.camp.batiments <= d.avantPoste.batiments,
      `niveau ${niveau} : le camp (${d.camp.batiments}) dépasse l'avant-poste (${d.avantPoste.batiments})`,
    );
  }
  // MESURÉ : 10 paliers de densité.
  assert.equal(niveaux, 10, `${niveaux} paliers de densité, 10 attendus`);
});

test('données — les budgets de raid de l’Ouvrage sont monotones', () => {
  const budgets = Object.entries(RAID_OUVRAGE.budgetParNiveau)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([, v]) => v);
  // MESURÉ : 9 paliers, de 30 au niveau 1 à 250 au plafond.
  assert.equal(budgets.length, 9, `${budgets.length} paliers de budget, 9 attendus`);
  for (let i = 1; i < budgets.length; i++) {
    assert.ok(
      budgets[i] >= budgets[i - 1],
      `budget non monotone : ${budgets[i - 1]} puis ${budgets[i]}`,
    );
  }
  // Et il doit réellement croître, sinon « monotone » serait vrai à plat.
  assert.ok(budgets[budgets.length - 1] > budgets[0], 'les budgets ne croissent pas du tout');
});

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

test('package.json — les types que le build Android exige, et qu\'aucun test JS ne voyait', () => {
  // ⚠ CE TEST NAÎT D'UNE CI ROUGE, ET D'UNE SEULE LIGNE DE PYTHON. Le lot
  // TUTORIEL a réécrit `package.json` avec un sérialiseur JSON, qui a rendu
  // `config.build` sous forme de NOMBRE là où il était une CHAÎNE. Côté
  // JavaScript, personne n'a rien vu : `tools/build.js` fait
  // `pkg.config?.build ?? '0'` et l'interpole, le workflow l'interpole aussi.
  // Côté Kotlin, `android/app/build.gradle.kts` fait `as String`, et le build
  // est tombé sur « class java.lang.Integer cannot be cast to
  // class java.lang.String » — dans le seul job qui ne tourne pas ici.
  //
  // Le remède n'est pas « faire attention » : c'est de faire lire au test JS
  // ce que le fichier Gradle EXIGE, plutôt que de recopier la liste des champs.
  const paquet = JSON.parse(readFileSync(join(RACINE, 'package.json'), 'utf8'));
  const gradle = readFileSync(join(RACINE, 'android', 'app', 'build.gradle.kts'), 'utf8');

  // Les champs que le Gradle lit dans `package.json` et coule en String.
  const versions = [...gradle.matchAll(/paquet\["([a-zA-Z]+)"\] as String/g)].map((m) => m[1]);
  const dansConfig = [...gradle.matchAll(/\(paquet\["config"\] as Map<\*, \*>\)\["([a-zA-Z]+)"\] as String/g)]
    .map((m) => m[1]);

  // Montage falsifiable : si les motifs n'attrapent plus rien, le test ne
  // prouve rien — et c'est justement ce qui arriverait si quelqu'un
  // reformatait le fichier Gradle.
  assert.ok(
    versions.length + dansConfig.length >= 2,
    'aucun champ lu « as String » trouvé dans build.gradle.kts : les motifs ont vieilli, '
      + 'ce test ne garde plus rien',
  );

  for (const champ of versions) {
    assert.equal(
      typeof paquet[champ], 'string',
      `package.json « ${champ} » doit être une CHAÎNE : build.gradle.kts le lit « as String »`,
    );
  }
  for (const champ of dansConfig) {
    assert.equal(
      typeof paquet.config[champ], 'string',
      `package.json « config.${champ} » doit être une CHAÎNE : build.gradle.kts le lit « as String »`,
    );
  }

  // Et `config.build` reste un entier LISIBLE : le Gradle fait `.toInt()`
  // dessus, et le manifeste de Pages l'interpole SANS guillemets — le client
  // Android le relit alors comme un nombre JSON (`Manifeste.analyser`).
  assert.match(paquet.config.build, /^[1-9][0-9]*$/, 'config.build n\'est pas un entier décimal');
});

// ---------------------------------------------------------------------------
// Les deux courbes, confrontées à leur relevé — 29/08
// ---------------------------------------------------------------------------
//
// ⚠⚠ CE TEST EXISTE PARCE QU'UNE CITATION A COÛTÉ UNE SESSION ENTIÈRE.
// L'en-tête de `data/niveaux.js` a annoncé pendant quatre jours que sa pente
// venait d'un « onglet COURBE du classeur FOYER-ZERO-BATIMENTS-JOUEUR.xlsx » —
// c'est-à-dire d'une source que le §1 du CLAUDE.md interdit de lire pour coder
// et déclare périmée. La source était donc INVÉRIFIABLE, la pente a eu l'air
// inventée, et il a fallu remonter toute la piste pour retrouver qu'elle était
// MESURÉE — dans `RELEVE-TA-COURBES-2.md`, qui est au dépôt depuis le 24/08.
//
// Corriger les mots ne suffisait pas : la prochaine session aurait cru un
// commentaire, comme celle-ci l'a fait. C'est la règle du dépôt appliquée —
// « une transcription qui ne se confronte pas à sa source est une copie qui
// vieillit » — la même que pour la palette (`banc.test.js` contre
// `FICHE-STYLE.md`) et pour les types de `package.json` (contre le Gradle).

/**
 * Les facteurs « ×n,nn » d'une ligne du tableau des cinq lois, désignée par un
 * morceau de son premier libellé.
 */
function loiDuReleve(nom) {
  const doc = readFileSync(join(RACINE, 'RELEVE-TA-COURBES-2.md'), 'utf8');
  const ligne = doc.split('\n').find((l) => l.startsWith('|') && l.includes(nom));
  assert.ok(ligne, `RELEVE-TA-COURBES-2.md : plus de ligne « ${nom} » dans le tableau des lois`);
  const facteurs = [...ligne.matchAll(/×(\d+,\d+)/g)].map((m) => Number(m[1].replace(',', '.')));
  assert.ok(facteurs.length > 0, `ligne « ${nom} » : aucun facteur lisible`);
  return facteurs;
}

test('données — la courbe de COMBAT est celle que le relevé a mesurée', () => {
  // Le relevé : « Points de vie (unités) | ×1,10 | unique, 1→50 | 0,02 % ».
  const [pv] = loiDuReleve('Points de vie');
  assert.equal(pv, 1.1);
  assert.equal(NIVEAU.penteHaute, pv, 'la pente du combat a quitté sa mesure');
  assert.equal(NIVEAU.penteBasse, pv);
  // « régime unique » : les deux pentes coïncident, et le drapeau le dit.
  assert.equal(NIVEAU.deuxRegimes, false);

  // Falsifiable : le montage doit vraiment LIRE le document, pas se contenter
  // d'une constante. Une ligne absente ferait tomber `loiDuReleve`, et un
  // facteur différent ferait tomber l'égalité ci-dessus.
  assert.notEqual(pv, ECONOMIE_NIVEAU.penteStable, 'les deux courbes se sont réalignées');
});

test('données — la courbe ÉCONOMIQUE est celle que le relevé a mesurée', () => {
  // Le relevé : « Coût d'amélioration — bâtiments et unités | ×1,32 ».
  const [cout] = loiDuReleve('Coût d\'amélioration');
  assert.equal(cout, 1.32);
  assert.equal(
    ECONOMIE_NIVEAU.penteStable, cout,
    'la pente des coûts a quitté sa mesure — elle vaut pour les bâtiments ET les unités',
  );
});

test('données — l\'écart voulu sur les DÉGÂTS est déclaré, pas subi', () => {
  // ⚠ LE RELEVÉ MESURE DEUX FACTEURS SUR CETTE LIGNE : ×1,10 puis, amorti,
  // ×1,086 à partir du niveau 11. Le code garde 1,1 pour les dégâts comme pour
  // les PV, et c'est DÉLIBÉRÉ : PV et dégâts doivent partager la même courbe,
  // sinon un combat à niveaux égaux cesse d'être identique à lui-même.
  const degats = loiDuReleve('| Dégâts');
  assert.deepEqual(degats, [1.1, 1.086], 'la ligne des dégâts du relevé a changé');

  // Ce que la garde tient : l'écart doit rester ÉCRIT dans le fichier qui le
  // commet. Un écart documenté est une décision ; le même écart sans un mot est
  // une approximation que personne ne saura relire.
  const source = readFileSync(join(RACINE, 'src', 'data', 'niveaux.js'), 'utf8');
  assert.ok(
    source.includes('1,086'),
    'niveaux.js ne dit plus qu\'il s\'écarte des dégâts mesurés par le relevé',
  );
  assert.ok(
    source.includes('RELEVE-TA-COURBES-2.md'),
    'niveaux.js ne cite plus le document qui porte sa mesure',
  );
  // ⚠ ET IL NE CITE PLUS LE CLASSEUR COMME SOURCE. C'est la faute d'origine :
  // le CLAUDE.md §1 interdit de lire un `.xlsx` pour coder.
  assert.ok(
    !/SOURCE[\s\S]{0,200}\.xlsx/.test(source),
    'niveaux.js cite de nouveau un classeur comme source',
  );
});
