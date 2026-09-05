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

import { GRILLE, UNITES, DEFENSES, COLONNES_DEGATS } from '../src/data/combat.js';
// ⚠ `MODULES` A DÉMÉNAGÉ au lot RECHERCHE : `data/combat.js` dit QUI porte quel
// module, `data/modules.js` dit CE QUE fait ce module. Une seule table pour une
// seule grandeur, CLAUDE.md §4.
import { MODULES } from '../src/data/modules.js';
import {
  BATIMENTS, DENSITE, GARNISON, VAGUES, POINTS_RECHERCHE, RAID_OUVRAGE, REPARATION,
} from '../src/data/sites.js';
import { NIVEAU } from '../src/data/niveaux.js';
import { ECONOMIE_NIVEAU, montantDuPalier, PROFIL } from '../src/data/economie.js';
// Le lot BARÈME, 05/09 — voir le bloc en fin de fichier.
import {
  BASE_BATIMENTS, COUT_NIVEAU_DEUX, COEFFICIENT_DE_REGIME, COUT_ELECTRICITE, coutDeMontee,
} from '../src/data/base.js';
import {
  coutDeMonteeOffense, coutDeMonteeDefense, RAPPORT_COEFFICIENT_OFFENSE,
} from '../src/data/couts-militaires.js';
import { TEMOINS_COUTS } from './temoins-couts.js';

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
  // MESURÉ : 44 références vers 14 modules définis. Le montage a donc bien
  // parcouru les deux tables et les trois emplacements de chaque unité.
  //
  // ⚠ C'ÉTAIT 42 AVANT LE LOT RECHERCHE, et les deux références de plus sont un
  // CORRECTIF DE DONNÉES, pas un ajout : `meute.defense.module` et
  // `perceurs.defense.module` valaient `null` parce que la colonne « Module en
  // défense (si différent) » de CIBLAGE-DEFENSE est VIDE pour ces deux-là —
  // elle disait « le même qu'en offense », le dépôt l'avait lue « aucun ». Voir
  // §3.3 du brief et les commentaires posés dans `data/combat.js`.
  assert.equal(references, 44, `${references} modules référencés, 44 attendus`);
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

// ---------------------------------------------------------------------------
// LE BARÈME — une entité a DEUX nombres, et le dépôt n'en portait qu'un
// ---------------------------------------------------------------------------
//
// Lot BARÈME, 05/09/2026. `RELEVE-TA-REPARATION.md` §1 : le prix d'ACCUEIL au
// niveau 2 et le COEFFICIENT DE RÉGIME qui commande la courbe haute sont deux
// objets différents, et ils ne coïncident que pour le Chantier de construction
// — le seul bâtiment sur lequel `ECONOMIE_NIVEAU.ratios` avait été calée.
//
// ⚠ CES TESTS VIVENT ICI PARCE QU'ILS CROISENT LES TABLES ET LE RELEVÉ, ce qui
// est la raison d'être de ce fichier. Ceux qui ne portent que sur une table
// sont restés chez elle : la rampe de référence dans `couts-militaires.test.js`
// (BARÈME T1, non-régression), la forme de la courbe de réparation dans
// `base.test.js` (BARÈME T11).

/** Le témoin des quatorze ancres d'accueil — `RELEVE-TA-REPARATION.md` §3. */
const ANCRES_RELEVEES = {
  meute: 1, perceurs: 1.6, carapace: 2, ratisseur: 3.2, belier: 3.6, fendeur: 4,
  crecelle: 4.4, busard: 4.8, guetteur: 5, frappeur: 5.6, fouisseurs: 8,
  pilon: 9, broyeur: 12, enclume: 12,
};

test('BARÈME T2 — le Fusilier coûte la MOITIÉ de l\'Exosoldat, pas le tiers', () => {
  // ⚠⚠ C'EST LE TEST QUI DIT LE DÉFAUT EN UN NOMBRE, ET IL TOMBE DE DEUX
  // FAÇONS SUR LE CODE D'AVANT. Le rapport relevé vaut 1 / 2 :
  //   — avant le 05/09, les DEUX ancres valaient 2 et le rapport rendait 1,000 ;
  //   — et substituer l'ancre sans corriger l'arrondi rendrait 0,333, le TIERS
  //     au lieu de la moitié, parce que l'arrondi par palier tire une petite
  //     ancre vers le haut à chaque tour.
  // Un seul arrondi, en sortie, garde le rapport exact.
  const meute = coutDeMonteeOffense('meute', 10).scorie;
  const carapace = coutDeMonteeOffense('carapace', 10).scorie;
  assert.equal(meute / carapace, 0.5, `${meute} / ${carapace} : le rapport relevé est 1/2`);

  // Falsifiable : deux zéros, ou deux nombres égaux, donneraient un rapport
  // lisible sans que rien ne soit juste.
  assert.ok(meute > 1000, 'le montage ne mesure rien : le niveau 10 doit être gros');
  assert.equal(ANCRES_RELEVEES.meute / ANCRES_RELEVEES.carapace, 0.5);
});

test('BARÈME T3 — les proportions du relevé sont tenues, à un seul arrondi près', () => {
  // ⚠⚠ LA MOITIÉ QUI COMPTE EST LA PREMIÈRE : à CHAQUE palier, de 2 à 50, le
  // prix rendu est à moins de 0,5 du produit exact `ancre × PROFIL × facteur^e`.
  // C'est la définition même de « un seul arrondi », et c'est ce qui rend les
  // proportions exactes ; l'arrondi PAR PALIER se compose et n'a aucune borne
  // de ce genre. Mesuré sur les 42 entités et les 49 paliers : l'écart maximal
  // vaut exactement 0,5, atteint par `defense/merlon` au niveau 3.
  // ⚠⚠ ON APPELLE LA FORMULE, ON NE RELIT PAS LE TÉMOIN — et la falsification
  // l'a exigé. Le premier jet comparait `paliers[i]` au produit exact : le
  // témoin étant lui-même produit par la formule, il ne gardait que lui-même,
  // et retirer le plafond `min(…, 10)` du code le laissait VERT. Le témoin ne
  // sert qu'à porter le couple (ancre, coefficient) des quarante-deux entités ;
  // les nombres comparés viennent du code livré.
  const FACTEUR_MAX = ECONOMIE_NIVEAU.ratios.length;
  for (const [nom, ancre, coefficient] of TEMOINS_COUTS) {
    for (let n = ECONOMIE_NIVEAU.premierNiveauPayant; n <= NIVEAU.plafond; n += 1) {
      const redresse = Math.min(n - ECONOMIE_NIVEAU.premierNiveauPayant, FACTEUR_MAX);
      const exact = ancre * PROFIL(n) * (coefficient / ancre) ** (redresse / FACTEUR_MAX);
      assert.ok(
        Math.abs(montantDuPalier(ancre, coefficient, n) - exact) <= 0.5 + 1e-9,
        `${nom} niv.${n} : plus d'un arrondi sépare le prix du produit exact`,
      );
    }
  }

  // ⚠⚠ ÉCART DÉCLARÉ AU BRIEF : « exactes à 0,05 % DU NIVEAU 5 au niveau 50 »
  // EST FAUX, ET C'EST MESURÉ. Le seuil ne tient qu'à partir du niveau 9. En
  // dessous, l'arrondi unique porte sur de très petits entiers et domine :
  // 4,00 % au niveau 5 (Fusilier 12 contre Exosoldat 25), 0,69 % au 6, 0,20 %
  // au 7, 0,060 % au 8, puis 0,014 % au 9. Aucune formule ne fait mieux — un
  // prix est un entier, et 12 n'est pas la moitié de 25.
  const REFERENCE = 'carapace';
  for (let n = 9; n <= NIVEAU.plafond; n += 1) {
    const ref = coutDeMonteeOffense(REFERENCE, n).scorie;
    for (const [id, ancre] of Object.entries(ANCRES_RELEVEES)) {
      const attendu = ancre / ANCRES_RELEVEES[REFERENCE];
      const rendu = coutDeMonteeOffense(id, n).scorie / ref;
      assert.ok(
        Math.abs(rendu / attendu - 1) < 0.0005,
        `${id} niv.${n} : ${rendu.toFixed(6)} au lieu de ${attendu} — proportion perdue`,
      );
    }
  }

  // Falsifiable : le seuil de 0,05 % doit être HORS D'ATTEINTE du code d'avant.
  // Mesuré : il rendait 33 % d'écart sur le Fusilier au niveau 3 et 50 % au
  // niveau 10. La ligne ci-dessous dit que la mesure porte sur des prix qui ont
  // divergé, pas sur des nombres tous égaux.
  assert.ok(
    new Set(Object.values(ANCRES_RELEVEES)).size > 8,
    'les ancres relevées se sont aplaties : le test ne mesure plus de proportion',
  );
});

test('BARÈME T4 — la Caserne au palier 11 coûte 144 000, la mesure du relevé', () => {
  // `RELEVE-TA-COURBES-2.md` §5 : « Caserne, tibérium, coût au palier 11 :
  // 144 000 ». Palier 11 = prix pour ATTEINDRE le niveau 12 = coefficient ×
  // 24 000, donc 144 000 / 24 000 = 6,000 — et c'est exactement ce que rendent
  // les panneaux d'optimisation de la Caserne au niveau 45, mesurés séparément.
  // ⚠ DEUX CHEMINS INDÉPENDANTS POUR LE MÊME NOMBRE, dans deux documents dont
  // le premier est écrit avant les captures du second.
  assert.equal(coutDeMontee('caserne', 12).quartz, 144000);
  assert.equal(COEFFICIENT_DE_REGIME.caserne, 6);
  // Le code d'avant rendait 115 200 : l'ancre d'accueil, 5, prolongée sans
  // redressement. C'est 20 % de moins, et l'écart se creuse ensuite.
  assert.notEqual(coutDeMontee('caserne', 12).quartz, 115200);
});

test('BARÈME T5 — l\'Exosoldat au palier 11 coûte 96 000, la mesure du relevé', () => {
  // `RELEVE-TA-COURBES-2.md` §5 : « Exosoldat, cristaux, coût au palier 11 :
  // 96 000 ». C'est LE seul point absolu du relevé côté unités, et c'est de lui
  // que sort le rapport coefficient / ancre de 2 : 96 000 / 24 000 = 4, pour
  // une ancre d'accueil de 2.
  assert.equal(coutDeMonteeOffense('carapace', 12).scorie, 96000);
  assert.equal(RAPPORT_COEFFICIENT_OFFENSE, 2);
  // Le code d'avant rendait 57 600 — 40 % de moins.
  assert.notEqual(coutDeMonteeOffense('carapace', 12).scorie, 57600);
});

test('BARÈME T6 — le raccord au niveau 12 est EXACT, pour les quarante-deux', () => {
  // ⚠⚠ C'EST LE PLAFOND `min(n − 2, 10)` QUE CE TEST GARDE, et il est le cœur
  // de la formule, pas une protection. Sans lui, le redressement continuerait
  // au-delà du niveau 12 et rendrait `coefficient² / ancre × 24 000` au lieu de
  // `coefficient × 24 000`. Avec lui, les deux zones se raccordent exactement :
  // `facteur^1` rend `ancre × 24 000 × coefficient / ancre`.
  //
  // ⚠ 24 000 N'EST PAS ÉCRIT EN DUR, IL EST LU DANS LA COURBE — et confronté au
  // relevé une seule fois, juste ici.
  assert.equal(PROFIL(12), 24000, 'le profil au niveau 12 a quitté la mesure du relevé');

  // ⚠⚠ ET C'EST LA FORMULE QU'ON INTERROGE, PAS LE TÉMOIN. Le premier jet lisait
  // `paliers[10]` du fichier figé — qui est produit par cette même formule,
  // donc retirer le plafond du code laissait ce test VERT. C'est la falsification
  // qui l'a dit, pas la relecture. Le témoin ne fournit que le couple
  // (ancre, coefficient).
  let redresses = 0;
  for (const [nom, ancre, coefficient] of TEMOINS_COUTS) {
    assert.equal(
      montantDuPalier(ancre, coefficient, 12), Math.round(coefficient * PROFIL(12)),
      `${nom} : le raccord au niveau 12 rate le coefficient de régime`,
    );
    if (coefficient !== ancre) redresses += 1;
  }
  // ⚠⚠ ÉCART DÉCLARÉ AU BRIEF : LE RACCORD SEUL NE PEUT PAS GARDER LE PLAFOND,
  // et c'est la falsification qui l'a dit. Le brief annonçait qu'en retirant le
  // `min(…, 10)` « le test tombe sur les dix-neuf entités dont le facteur
  // diffère de 1 ». Mesuré : il ne tombe pas du tout. Au niveau 12, l'exposant
  // vaut `(12 − 2)/10 = 1` AVEC ou SANS plafond — c'est exactement là que le
  // plafond est un non-événement. Il ne mord qu'AU-DELÀ.
  //
  // D'où la seconde moitié, qui est la vraie garde : à partir du niveau 12,
  // tout le monde monte de `penteStable` et de RIEN D'AUTRE. Sans le plafond,
  // chaque palier au-dessus multiplierait en plus par `facteur^(1/10)`, et le
  // prix au niveau 50 partirait à `coefficient^(4,8) / ancre^(3,8)`.
  for (const [nom, ancre, coefficient] of TEMOINS_COUTS) {
    for (let n = 12; n <= NIVEAU.plafond; n += 1) {
      assert.equal(
        montantDuPalier(ancre, coefficient, n), Math.round(coefficient * PROFIL(n)),
        `${nom} niv.${n} : la zone de régime n'est plus le coefficient × la courbe`,
      );
    }
  }

  // Falsifiable : tout cela serait vide de sens si aucun facteur ne différait
  // de 1. Mesuré : dix-neuf entités sont redressées — les quatorze unités et
  // cinq bâtiments.
  assert.equal(redresses, 19, `${redresses} entités redressées au lieu de 19`);
});

test('BARÈME T7 — les quatorze coûts de réparation relevés sont reproduits', () => {
  // ⚠⚠ CE TEST EST LE SEUL À RELIER LA CHAÎNE ENTIÈRE À UNE OBSERVATION
  // EXTÉRIEURE. Ancre d'accueil, coefficient de régime, redressement, arrondi
  // unique et part du coût de montée doivent TOUS être justes pour qu'il passe.
  // S'il tombe, ne pas ajuster `partDuCoutDeMontee` pour le faire passer :
  // chercher lequel des cinq maillons a bougé.
  //
  // Les quatorze unités ont été relevées au niveau 10, intégralement détruites
  // — ce que prouve l'exactitude du rapport, 397,5 × l'ancre sans une
  // exception. `RELEVE-TA-REPARATION.md` §3 et §5.
  const RELEVE = {
    meute: 398, perceurs: 636, carapace: 795, ratisseur: 1272, belier: 1431,
    fendeur: 1590, crecelle: 1749, busard: 1908, guetteur: 1988, frappeur: 2226,
    fouisseurs: 3180, pilon: 3578, broyeur: 4770, enclume: 4770,
  };
  let exactes = 0;
  for (const [id, attendu] of Object.entries(RELEVE)) {
    const rendu = Math.round(
      coutDeMonteeOffense(id, 10).scorie * REPARATION.partDuCoutDeMontee,
    );
    // ⚠ TOLÉRANCE DE ±1, ET SEULEMENT ±1. Une tolérance plus large laisserait
    // passer une erreur de barème.
    assert.ok(
      Math.abs(rendu - attendu) <= 1,
      `${id} : réparation ${rendu} au lieu de ${attendu} — un maillon a bougé`,
    );
    if (rendu === attendu) exactes += 1;
  }
  // ⚠ TREIZE SUR QUATORZE TOMBENT EXACTEMENT ; `guetteur` rend 1 987 pour
  // 1 988, parce que le produit exact vaut 1 987,5 et que l'affichage du jeu de
  // référence arrondit au-dessus. Asserter le COMPTE d'exactes empêche la
  // tolérance de couvrir une dérive générale.
  assert.equal(exactes, 13, `${exactes} réparations exactes au lieu de 13`);
  assert.equal(
    Math.round(coutDeMonteeOffense('guetteur', 10).scorie * REPARATION.partDuCoutDeMontee),
    1987,
  );
});

test('BARÈME T8 — l\'électricité est une seconde ancre, pas le quart pour tous', () => {
  // `RELEVE-TA-REPARATION.md` §6 : mesuré sur les sept panneaux d'optimisation,
  // `autres` tombe bien à 0,2500 sur quatre bâtiments, mais le Collecteur donne
  // 0,7503 et la Centrale 0,0962. Le quart était une COÏNCIDENCE sur les quatre
  // bâtiments qui partagent ce rapport.
  const rapport = (id, n) => {
    const c = coutDeMontee(id, n);
    return c.electricite / c.quartz;
  };
  assert.ok(Math.abs(rapport('collecteur', 40) - 0.75) < 1e-6,
    `collecteur : ${rapport('collecteur', 40)} au lieu de 0,75`);
  assert.ok(Math.abs(rapport('centrale', 40) - 0.5 / 5.2) < 1e-6,
    `centrale : ${rapport('centrale', 40)} au lieu de 0,5/5,2`);
  assert.ok(Math.abs(rapport('caserne', 40) - 0.25) < 1e-6, 'les autres gardent le quart');

  // ⚠ LA FRACTION DE LA CENTRALE EST ÉCRITE COMME UN QUOTIENT DANS LA SOURCE, et
  // c'est ce qui rend la dérivation lisible : 0,5 d'électricité pour 5,2 de
  // tibérium. Écrire 0,09615 la perdrait, et la prochaine personne y lirait un
  // réglage.
  const source = readFileSync(join(RACINE, 'src', 'data', 'base.js'), 'utf8');
  assert.match(source, /centrale:\s*0\.5\s*\/\s*5\.2/,
    'la fraction de la Centrale a été aplatie en décimale : sa dérivation est perdue');

  // Le code d'avant rendait 0,5 pour le Collecteur et 0,1 pour la Centrale.
  assert.notEqual(COUT_ELECTRICITE.fraction.collecteur, 0.5);
  assert.notEqual(COUT_ELECTRICITE.fraction.centrale, 0.1);
});

test('BARÈME T9 — le coefficient de régime couvre exactement les onze bâtiments', () => {
  // Même garde que celle des quatre classes de coût, et pour la même raison :
  // sans elle, un douzième bâtiment entrerait sans coefficient et
  // `coutDeMontee` rendrait `NaN` au lieu de lever.
  assert.deepEqual(
    Object.keys(COEFFICIENT_DE_REGIME).sort(), Object.keys(BASE_BATIMENTS).sort(),
  );
  for (const [id, coefficient] of Object.entries(COEFFICIENT_DE_REGIME)) {
    assert.ok(Number.isFinite(coefficient) && coefficient > 0, `${id} : coefficient absent`);
  }

  // ⚠⚠ ET `classeDeCout` NE SUFFIT PLUS : la Centrale et le Collecteur sont
  // tous deux `modeste`, ancre 3, et leurs coefficients diffèrent d'un facteur
  // 2,6. C'est ce fait-là qui interdit de dériver le coefficient de la classe.
  assert.equal(BASE_BATIMENTS.centrale.classeDeCout, BASE_BATIMENTS.collecteur.classeDeCout);
  assert.equal(COEFFICIENT_DE_REGIME.centrale / COEFFICIENT_DE_REGIME.collecteur, 2.6);

  // Et les trois `majeur` gardent un facteur de 1 : c'est sur eux que la rampe
  // a été calée, et c'est pourquoi elle passait pour juste.
  for (const id of ['chantierDeConstruction', 'centreDeCommandement', 'qgDeDefense']) {
    assert.equal(COEFFICIENT_DE_REGIME[id], COUT_NIVEAU_DEUX[BASE_BATIMENTS[id].classeDeCout]);
  }
});

test('BARÈME T10 — la formule et les témoins coïncident, palier par palier', () => {
  // ⚠⚠ LA TABLE EST FIGÉE DANS `test/`, PAS DANS `dist/`. Ethan a demandé qu'il
  // n'y ait aucun écart entre ce qui est voulu et ce qui est joué, et que le jeu
  // lise des entiers pré-calculés : la formule à arrondi unique rend exactement
  // les mêmes entiers qu'une table pré-calculée, et ce test EST cette preuve.
  // L'embarquer dans le livrable coûterait des dizaines de kilo-octets pour zéro
  // nombre différent.
  assert.equal(TEMOINS_COUTS.length, 42, 'quatorze unités, dix-sept défenses, onze bâtiments');
  const attendus = NIVEAU.plafond - ECONOMIE_NIVEAU.premierNiveauPayant + 1;

  for (const [nom, ancre, coefficient, ...paliers] of TEMOINS_COUTS) {
    assert.equal(paliers.length, attendus, `${nom} : ${paliers.length} paliers au lieu de ${attendus}`);
    for (let i = 0; i < paliers.length; i += 1) {
      const niveau = i + ECONOMIE_NIVEAU.premierNiveauPayant;
      assert.equal(
        montantDuPalier(ancre, coefficient, niveau), paliers[i],
        `${nom} niv.${niveau} : la formule s'écarte du témoin`,
      );
    }
  }

  // ⚠ ET LES DEUX BOUTS PASSENT PAR LES FONCTIONS PUBLIQUES, pas seulement par
  // la rampe : un témoin qui ne garderait que `montantDuPalier` laisserait
  // passer une ancre débranchée dans `coutDeMontee`.
  const parNom = new Map(TEMOINS_COUTS.map((l) => [l[0], l]));
  for (const niveau of [2, 12, 30, NIVEAU.plafond]) {
    const i = niveau - ECONOMIE_NIVEAU.premierNiveauPayant;
    assert.equal(coutDeMontee('caserne', niveau).quartz, parNom.get('batiment/caserne')[3 + i]);
    assert.equal(coutDeMonteeOffense('pilon', niveau).scorie, parNom.get('offense/pilon')[3 + i]);
    assert.equal(coutDeMonteeDefense('merlon', niveau).quartz, parNom.get('defense/merlon')[3 + i]);
  }
});
