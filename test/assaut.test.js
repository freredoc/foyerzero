// Tests T1 à T8 du brief du lot 4B — bâtiments mesurés et assauts budgétés.
//
// T8 n'assère rien : il IMPRIME le tableau des passes. C'est une mesure
// consignée, pas un seuil ; le brief interdit de recalibrer dans ce lot, donc
// rien ici ne doit pouvoir « échouer » sur une valeur de calibrage.
//
// Chaque seuil porte son calcul.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { UNITES, DEFENSES } from '../src/data/combat.js';
import {
  BATIMENTS, POINTS_ARMEE, PROFILS_ASSAUT, EMPLACEMENTS_ASSAUT,
} from '../src/data/sites.js';
import { NIVEAU } from '../src/data/niveaux.js';
import { creerCombat, resoudre } from '../src/sim/combat.js';
import { genererAssaut, budgetAssaut, genererSite } from '../src/sim/generateur.js';
import { montageDuBanc, executerRaidComplet } from '../src/ui/banc.js';
import { montagePreregle } from './prereglages-lot3a.js';

const PROFILS = Object.keys(PROFILS_ASSAUT);
const CASES_ASSAUT = EMPLACEMENTS_ASSAUT.vagues * EMPLACEMENTS_ASSAUT.parVague;

// ---------------------------------------------------------------------------
// T1 — les cinq bâtiments égalent la source
// ---------------------------------------------------------------------------

test('T1 — les cinq bâtiments de site portent les PV du §6.5 du relevé', () => {
  // Transcription littérale du §6.5 de RELEVE-TA-COURBES-2.md, avec la
  // correspondance que porte déjà le champ `ta` de chaque ligne.
  const RELEVE = {
    souche: { equivalent: 'Construction Yard', pv: 5500 },
    etai: { equivalent: 'Defense Facility', pv: 2500 },
    noeud: { equivalent: 'Harvester', pv: 1500 },
    gangue: { equivalent: 'Silo', pv: 1000 },
    terril: { equivalent: 'Silo', pv: 1000 },
  };
  assert.deepEqual(Object.keys(BATIMENTS), Object.keys(RELEVE));
  for (const [id, r] of Object.entries(RELEVE)) {
    assert.equal(BATIMENTS[id].pv, r.pv, `${id} : PV du ${r.equivalent}`);
    assert.ok(Number.isInteger(BATIMENTS[id].pv), `${id} : PV non entiers`);
  }

  // Les deux silos portent la même valeur, comme au relevé : une seule ligne
  // « Silo » y couvre nos Gangue et Terril, qui ne diffèrent que par la
  // ressource qu'ils rendent.
  assert.equal(BATIMENTS.gangue.pv, BATIMENTS.terril.pv);
  assert.notDeepEqual(BATIMENTS.gangue.ressource, BATIMENTS.terril.ressource);

  // Rien d'autre n'a bougé dans la table : parts, indices de butin, ressources.
  assert.equal(BATIMENTS.souche.raseLeSite, true);
  assert.equal(BATIMENTS.etai.reparationDefenses, true);
  assert.deepEqual(
    Object.values(BATIMENTS).map((b) => b.indiceButin), [1, 1, 2, 3, 3],
  );
  assert.deepEqual(
    Object.values(BATIMENTS).map((b) => b.part), [null, null, 0.4, 0.3, 0.3],
  );
});

// ---------------------------------------------------------------------------
// T2 — le rapport de masse s'est inversé
// ---------------------------------------------------------------------------

/** PV totaux d'un site, séparés bâtiments / défenses, en milli-PV. */
function masseDuSite({ type, niveau, saveur, graine }) {
  const site = genererSite({ type, niveau, saveur, graine });
  const etat = creerCombat({ ...site, vagues: [] });
  let batiments = 0;
  let defenses = 0;
  for (const e of etat.entites) {
    if (e.genre === 'batiment') batiments += e.pvMaxMilli;
    if (e.genre === 'defense') defenses += e.pvMaxMilli;
  }
  return { batiments, defenses };
}

test('T2 — les bâtiments pèsent désormais plus que les défenses, sur quinze sites', () => {
  // ⚠ Le brief annonce « 80 000 contre 348 000 avant, 652 000 contre 348 000
  // après », soit un renversement d'un cinquième à 1,6 fois. Ces nombres-là ne
  // se retrouvent sur aucun de nos sites : ils viennent d'une composition que
  // le brief ne précise pas. Ce qui se retrouve, et bien plus nettement, c'est
  // le RENVERSEMENT lui-même — mesuré ici sur quinze sites plutôt que sur un,
  // pour qu'il ne dépende pas d'un tirage heureux.
  //
  // Les PV se comparent au niveau 1 : à un site de niveau 15, facteurMilli(15)
  // multiplie les deux colonnes par le même 28 974 et le rapport ne bouge pas.
  const ANCIENS = { souche: 400, etai: 300, noeud: 200, gangue: 150, terril: 150 };
  let rapportApresMin = Infinity;
  let rapportAvantMax = 0;

  for (const type of ['camp', 'avantPoste', 'base']) {
    for (const graine of [1, 2, 3, 7, 11]) {
      const site = genererSite({
        type, niveau: 15, saveur: type === 'base' ? null : 'richeQuartz', graine,
      });
      const etat = creerCombat({ ...site, vagues: [] });
      let apres = 0;
      let avant = 0;
      let defenses = 0;
      for (const e of etat.entites) {
        if (e.genre === 'defense') { defenses += e.pvMaxMilli; continue; }
        if (e.genre !== 'batiment') continue;
        apres += e.pvMaxMilli;
        // Le facteur de niveau se retrouve en divisant par les PV de la table,
        // ce qui permet de rejouer les ANCIENNES valeurs sur le même site.
        avant += (e.pvMaxMilli / BATIMENTS[e.id].pv) * ANCIENS[e.id];
      }
      assert.ok(defenses > 0 && apres > 0, `${type}/${graine} : site vide`);
      assert.ok(avant < defenses,
        `${type}/${graine} : avec les anciens PV les bâtiments pesaient déjà plus`);
      assert.ok(apres > defenses,
        `${type}/${graine} : le rapport ne s'est pas inversé`);
      rapportApresMin = Math.min(rapportApresMin, apres / defenses);
      rapportAvantMax = Math.max(rapportAvantMax, avant / defenses);
    }
  }

  // Mesuré : de 0,30–0,46 avant à 2,35–3,75 après. Les défenses pesaient deux à
  // trois fois les bâtiments ; les bâtiments pèsent maintenant deux à quatre
  // fois les défenses. L'objectif redevient le gros du travail — c'est le but
  // du lot, et voici sa borne.
  assert.ok(rapportAvantMax < 0.5, `avant : rapport maximal ${rapportAvantMax.toFixed(3)}`);
  assert.ok(rapportApresMin > 2, `après : rapport minimal ${rapportApresMin.toFixed(3)}`);

  // Le facteur qui sépare les deux régimes est celui des PV eux-mêmes, et il
  // est le même pour les cinq bâtiments à un cheveu près : 5 500/400 = 13,75 ;
  // 2 500/300 = 8,33 ; 1 500/200 = 7,5 ; 1 000/150 = 6,67. La Souche prend le
  // plus gros coup, ce qui est cohérent avec son rôle d'objectif.
  assert.equal(BATIMENTS.souche.pv / ANCIENS.souche, 13.75);
  assert.ok(BATIMENTS.gangue.pv / ANCIENS.gangue > 6);
});

// ---------------------------------------------------------------------------
// T3 — l'assaut tient dans le budget
// ---------------------------------------------------------------------------

test('T3 — pour les 50 niveaux et les 3 profils, budget, déblocage et emplacements', () => {
  assert.deepEqual(POINTS_ARMEE.offense.base, 20);
  assert.deepEqual(POINTS_ARMEE.offense.parNiveau, 5);

  for (let niveau = 1; niveau <= NIVEAU.plafond; niveau += 1) {
    const budget = budgetAssaut(niveau);
    assert.equal(budget, 20 + 5 * niveau, `niveau ${niveau} : budget`);
    for (const profil of PROFILS) {
      const a = genererAssaut({ niveau, profil, graine: niveau * 7 + 1 });
      const plat = a.vagues.flat();

      const cout = plat.reduce((somme, u) => somme + UNITES[u.id].points, 0);
      assert.equal(cout, a.pointsEngages, `${profil}/${niveau} : le coût annoncé`);
      assert.ok(cout <= budget, `${profil}/${niveau} : ${cout} points pour un budget de ${budget}`);
      assert.equal(a.pointsRestants, budget - cout);

      for (const u of plat) {
        assert.ok(UNITES[u.id].apparition <= niveau,
          `${profil}/${niveau} : ${u.id} est verrouillé (apparition ${UNITES[u.id].apparition})`);
        assert.equal(u.niveau, niveau);
      }

      assert.ok(plat.length <= CASES_ASSAUT, `${profil}/${niveau} : ${plat.length} emplacements`);
      assert.ok(a.vagues.length <= EMPLACEMENTS_ASSAUT.vagues);
      for (const vague of a.vagues) {
        assert.ok(vague.length <= EMPLACEMENTS_ASSAUT.parVague);
        // Une colonne par unité, de 1 à 9, sans doublon : le moteur refuse deux
        // entités bloquantes sur la même case d'apparition.
        const colonnes = vague.map((u) => u.colonne);
        assert.deepEqual([...new Set(colonnes)], colonnes, `${profil}/${niveau} : colonne en double`);
        for (const c of colonnes) assert.ok(c >= 1 && c <= EMPLACEMENTS_ASSAUT.parVague);
      }
      // Et le montage passe le moteur, ce qui est le seul vrai contrôle.
      assert.doesNotThrow(() => creerCombat({
        ...genererSite({ type: 'camp', niveau, saveur: null, graine: 1 }), vagues: a.vagues,
      }), `${profil}/${niveau} : creerCombat`);
    }
  }
});

// ---------------------------------------------------------------------------
// T4 — l'assaut grandit avec le niveau
// ---------------------------------------------------------------------------

test('T4 — un assaut de niveau 40 coûte strictement plus qu\'un de niveau 10', () => {
  // C'est ce qui manquait aux préréglages figés : 105 points au niveau 1 comme
  // au niveau 50. Le budget passe de 70 à 220 points, l'assaut doit suivre.
  for (const profil of PROFILS) {
    const bas = genererAssaut({ niveau: 10, profil, graine: 1 });
    const haut = genererAssaut({ niveau: 40, profil, graine: 1 });
    assert.ok(haut.pointsEngages > bas.pointsEngages,
      `${profil} : ${bas.pointsEngages} au niveau 10, ${haut.pointsEngages} au niveau 40`);
    assert.equal(bas.budgetPoints, 70);
    assert.equal(haut.budgetPoints, 220);
  }

  // Et la croissance est monotone au sens large sur toute la plage : le budget
  // engagé ne redescend jamais durablement. On le vérifie de dix en dix, pour
  // que le bruit du tirage ne fasse pas échouer une mesure de tendance.
  for (const profil of PROFILS) {
    const paliers = [10, 20, 30, 40, 50].map(
      (n) => genererAssaut({ niveau: n, profil, graine: 5 }).pointsEngages,
    );
    for (let i = 1; i < paliers.length; i += 1) {
      assert.ok(paliers[i] > paliers[i - 1],
        `${profil} : ${paliers.join(' → ')} n'est pas croissant`);
    }
  }
});

// ---------------------------------------------------------------------------
// T5 — déterminisme
// ---------------------------------------------------------------------------

test('T5 — même graine, même assaut ; deux graines, deux assauts', () => {
  for (const profil of PROFILS) {
    const a = genererAssaut({ niveau: 25, profil, graine: 42 });
    const b = genererAssaut({ niveau: 25, profil, graine: 42 });
    assert.deepEqual(a, b, `${profil} : deux appels de même graine doivent coïncider`);
  }

  // Deux graines distinctes doivent donner des assauts distincts. Sur un profil
  // pur au niveau où une seule unité est disponible, elles coïncideraient
  // légitimement ; on éprouve donc au niveau 25, où le choix est large.
  let differents = 0;
  for (const profil of PROFILS) {
    const a = genererAssaut({ niveau: 25, profil, graine: 1 });
    const b = genererAssaut({ niveau: 25, profil, graine: 2 });
    if (JSON.stringify(a.vagues) !== JSON.stringify(b.vagues)) differents += 1;
  }
  assert.equal(differents, PROFILS.length, 'la graine ne fait pas varier la composition');

  // Le déterminisme vaut aussi de bout en bout : le montage du banc, qui tire
  // le site ET l'assaut de la même graine, se reproduit à l'identique.
  const p = { type: 'camp', niveau: 20, saveur: 'richeQuartz', graine: 7, assaut: 'mixte' };
  assert.deepEqual(montageDuBanc(p), montageDuBanc(p));
});

// ---------------------------------------------------------------------------
// T6 — le plafond de 36
// ---------------------------------------------------------------------------

test('T6 — le plafond de 36 emplacements est tenu, mais le budget mord avant', () => {
  // ⚠ ÉCART AVEC LE BRIEF, ET C'EST UNE MESURE, PAS UN CHOIX.
  //
  // Le §3 annonce qu'au niveau 50, profil `infanterie`, budget 270, « la
  // composition atteint 36 emplacements ». Elle ne les atteint pas : au niveau
  // 50 les seules escouades que `VAGUES.parNiveau` retient sont le Guetteur et
  // les Fouisseurs, à 10 points pièce. 270 / 10 = 27 unités au plus.
  //
  // Le calcul du brief — 36 × 5 = 180 ≤ 20 + 5 × 32 — suppose que l'unité à
  // 5 points reste disponible. Le Fusilier et les Grenadiers le sont bien au
  // sens du DÉBLOCAGE (apparitions 0 et 4), mais la table des vagues cesse de
  // les aligner : plus de Fusilier au-delà du niveau 30, plus de Grenadiers
  // au-delà du 35. Le plafond de 36 ne mord donc JAMAIS au budget nominal.
  const auBudget = genererAssaut({ niveau: 50, profil: 'infanterie', graine: 1 });
  assert.equal(auBudget.budgetPoints, 270);
  assert.equal(auBudget.vagues.flat().length, 27);
  assert.equal(auBudget.pointsEngages, 270, 'le budget, lui, est épuisé au point près');
  for (const u of auBudget.vagues.flat()) {
    assert.equal(UNITES[u.id].points, 10, `${u.id} : plus d'unité à 5 points au niveau 50`);
  }

  // Le plafond EXISTE quand même, et il est tenu. On le prouve en desserrant la
  // seule contrainte qui mordait : un budget délibérément hors d'échelle.
  for (const budgetPoints of [1000, 10_000]) {
    const large = genererAssaut({
      niveau: 50, profil: 'infanterie', budgetPoints, graine: 1,
    });
    assert.equal(large.vagues.flat().length, CASES_ASSAUT, `budget ${budgetPoints}`);
    assert.equal(large.vagues.length, EMPLACEMENTS_ASSAUT.vagues);
    assert.deepEqual(large.vagues.map((v) => v.length), [9, 9, 9, 9]);
    // 36 unités à 10 points : 360 engagés, le reste rendu. Aucun 37ᵉ n'est tenté.
    assert.equal(large.pointsEngages, 360);
    assert.equal(large.pointsRestants, budgetPoints - 360);
  }

  // Et la borne est la même sur les trois profils.
  for (const profil of PROFILS) {
    const large = genererAssaut({ niveau: 50, profil, budgetPoints: 10_000, graine: 3 });
    assert.equal(large.vagues.flat().length, CASES_ASSAUT, profil);
  }
});

// ---------------------------------------------------------------------------
// T7 — les trois raids de référence, deux séries
// ---------------------------------------------------------------------------

test('T7 — A, B et C : préréglages figés puis assauts budgétés', () => {
  const cas = [
    { nom: 'A', type: 'avantPoste', assaut: 'infanterie' },
    { nom: 'B', type: 'camp', assaut: 'blindeLourd' },
    { nom: 'C', type: 'camp', assaut: 'infanterie' },
  ];
  const parametres = (c) => ({
    type: c.type, niveau: 15, saveur: 'richeQuartz', graine: 1, assaut: c.assaut,
  });

  // Série 1 — bâtiments convertis, assaut FIGÉ du lot 3A. C'est la ligne du §2
  // du brief, reproduite au tick près : elle valide la conversion des PV
  // isolément, avant que le budget ne vienne s'y ajouter.
  //
  // ⚠ LOT CARTE (29/08) : LES SIX TICKS ONT BOUGÉ, LES TROIS CAUSES NON. Les dix
  // obstacles sont cantonnés à la bande de DÉFENSE — arbitré par Ethan — donc
  // tous sur le chemin de l'assaut au lieu de la moitié. A s'allonge beaucoup
  // (321 → 669), B un peu (583 → 608), et C raccourcit (551 → 524) parce qu'il
  // perd ses unités plus tôt qu'il n'aurait fini.
  //
  // ⚠⚠ LOT ARRÊT (04/09) : LE CONTRASTE QUE CE TEST TENAIT A DISPARU, ET IL
  // FAUT LE DIRE PLUTÔT QUE DE RÉANCRER SANS RIEN ÉCRIRE. Ce bloc portait « le
  // figé rase la Souche, le budgété non » ; depuis que `doitSArreter` lit le
  // genre, le préréglage figé de B ne rase PLUS — il se termine par
  // `attaquants` au tick 408 au lieu de `souche` au 608. Ce n'est pas une
  // régression du budget : c'est l'assaut lourd qui traverse la défense sans
  // s'y arrêter, y meurt davantage, et n'arrive plus au bout. Ce que ce test
  // garde encore est la SÉRIE : les deux ne rendent pas les mêmes durées, et
  // c'est ce que la seconde moitié mesure.
  //
  // A passe de 669 à 338 ticks — presque la moitié —, C de 524 à 529.
  const figes = cas.map((c) => resoudre(creerCombat(montagePreregle(parametres(c)))));
  assert.equal(figes[0].cause, 'attaquants');
  assert.equal(figes[0].tick, 338);
  assert.equal(figes[1].cause, 'attaquants');
  assert.equal(figes[1].tick, 408);
  assert.equal(figes[2].cause, 'attaquants');
  assert.equal(figes[2].tick, 529);

  // Série 2 — assauts BUDGÉTÉS. Aucun des deux ne rase plus la Souche depuis le
  // lot ARRÊT : les deux séries se distinguent par leurs durées, plus par leur
  // issue.
  const budgetes = cas.map((c) => executerRaidComplet(parametres(c)));
  assert.equal(budgetes[0].cause, 'attaquants');
  assert.equal(budgetes[0].nbTicks, 380);
  //
  // ⚠ LOT MULTIPLICATEUR (29/08) : le butin d'un AVANT-POSTE est multiplié par
  // 3,25. `TYPES_SITE.avantPoste.multiplicateurButin` portait ce nombre depuis
  // le relevé TA et n'était lu par personne. Rien d'autre ne bouge — ni la
  // cause, ni le tick, ni les survivants : le multiplicateur s'applique APRÈS le
  // combat, il ne change pas un seul tir. Les raids sur camp, eux, ne bougent
  // pas d'une unité, leur facteur valant 1.
  //
  // ⚠⚠ LOT ARRÊT : LE BUTIN DE A TOMBE À ZÉRO, ET C'EST LE RELEVÉ LE PLUS DUR
  // DU LOT. L'assaut d'infanterie budgété contre un avant-poste rapportait 772
  // de quartz et 257 de scorie ; il ne rapporte plus RIEN, et il ne laisse plus
  // un survivant — trois avant. Les six unités traversent la défense sans s'y
  // arrêter, arrivent entamées devant les bâtiments et tombent avant d'en
  // griffer un. C'est du calibrage, pas un défaut : voir `RAPPORT-lotARRET.md`.
  assert.deepEqual(budgetes[0].butin, { quartz: 0, scorie: 0 });
  assert.equal(budgetes[1].cause, 'attaquants');
  assert.equal(budgetes[1].nbTicks, 440);
  assert.equal(budgetes[2].cause, 'attaquants');
  assert.equal(budgetes[2].nbTicks, 335);
  // Lot COURBE : 26 321 au lieu de 26 319, les six ticks inchangés sous une
  // courbe de combat divisée par 4 500 au niveau 50.
  // Lot CARTE : 24 796. Le butin baisse parce que le raid est plus court — 305
  // ticks au lieu de 315 — et non parce que les dégâts ont changé.
  // Lot ARRÊT : 24 640, soit 156 de moins pour trente ticks de PLUS. Le raid
  // s'allonge et rapporte un peu moins : les unités passent leur temps devant
  // des bâtiments qu'elles entament à peine au lieu d'abattre la défense.
  assert.equal(budgetes[2].butin.quartz, 24_640);

  // Ce que le préréglage figé alignait et que le budget refuse — deux unités
  // que le joueur ne peut pas posséder au niveau 15. C'est ce qui faisait raser
  // B jusqu'au lot ARRÊT ; depuis, plus aucune des deux séries ne rase, mais
  // l'écart de composition, lui, est intact et se mesure toujours ici.
  const fige = montagePreregle(parametres(cas[1]));
  const verrouillees = [...new Set(
    fige.vagues.flat().map((u) => u.id).filter((id) => UNITES[id].apparition > 15),
  )].sort();
  assert.deepEqual(verrouillees, ['broyeur', 'pilon']);
  assert.equal(UNITES.broyeur.apparition, 28);
  assert.equal(UNITES.pilon.apparition, 32);

  const budgete = montageDuBanc(parametres(cas[1]));
  for (const u of budgete.vagues.flat()) {
    assert.ok(UNITES[u.id].apparition <= 15, `${u.id} ne devrait pas être aligné au niveau 15`);
  }
});

// ---------------------------------------------------------------------------
// T8 — le tableau des passes : une MESURE, pas une assertion
// ---------------------------------------------------------------------------

const MAX_PASSES = 6;

/**
 * Combien de passes pour raser un site, faute d'état persistant : on rejoue le
 * montage en retirant les entités détruites et en reportant les PV des
 * survivantes. Un camp ne répare rien, donc aucun soin entre les passes ;
 * l'assaut, lui, est refait à chaque fois — le joueur reconstruit son armée, et
 * à graine fixe il reconstruit la même.
 *
 * Fin quand la Souche tombe, ou qu'il ne reste aucun bâtiment.
 */
export function passesPourRaser({ type, niveau, assaut, graine, monter = montageDuBanc }) {
  const parametres = {
    type, niveau, saveur: type === 'base' ? null : 'richeQuartz', graine, assaut,
  };
  let montage = monter(parametres);
  for (let passe = 1; passe <= MAX_PASSES; passe += 1) {
    const frais = monter(parametres);
    const r = resoudre(creerCombat({ ...montage, vagues: frais.vagues }));
    if (r.cause === 'souche') return passe;
    const batiments = [];
    const defenseurs = [];
    for (const b of r.batiments) {
      if (b.detruit) continue;
      const ligne = montage.batiments.find(
        (x) => x.id === b.id && x.rangee === b.rangee && x.colonne === b.colonne,
      );
      batiments.push({ ...ligne, pvMilli: b.pvMilli });
    }
    for (const d of r.defenses) {
      if (d.detruit) continue;
      const ligne = montage.defenseurs.find(
        (x) => x.id === d.id && x.rangee === d.rangee && x.colonne === d.colonne,
      );
      defenseurs.push({ ...ligne, pvMilli: d.pvMilli });
    }
    if (batiments.length === 0) return passe;
    montage = { ...montage, batiments, defenseurs };
  }
  return null; // au-delà de MAX_PASSES
}

test('T8 — tableau des passes, mesure consignée', () => {
  // ⚠ CE TEST N'ASSÈRE AUCUN SEUIL DE CALIBRAGE. Le §4 du brief interdit de
  // recalibrer dans ce lot : on mesure, on rapporte, Ethan tranche. Le seul
  // contrôle ici est que la mesure ABOUTIT — sans quoi le rapport serait vide.
  const NIVEAUX = [10, 15, 25, 40];
  const CAS = [
    ['camp', 'blindeLourd'], ['camp', 'infanterie'],
    ['avantPoste', 'blindeLourd'], ['avantPoste', 'infanterie'],
  ];
  const lignes = [];
  for (const [type, assaut] of CAS) {
    const cellules = NIVEAUX.map((niveau) => {
      const p = passesPourRaser({ type, niveau, assaut, graine: 1 });
      return p === null ? `> ${MAX_PASSES}` : String(p);
    });
    lignes.push(`  ${(`${type} · ${assaut}`).padEnd(26)} ${cellules.map((c) => c.padStart(5)).join(' ')}`);
  }
  const tableau = [
    '',
    'PASSES POUR RASER — assauts budgétés, graine 1',
    `  ${'cas'.padEnd(26)} ${NIVEAUX.map((n) => `niv${n}`.padStart(5)).join(' ')}`,
    ...lignes,
    '',
  ].join('\n');
  // eslint-disable-next-line no-console
  console.log(tableau);

  assert.equal(lignes.length, CAS.length, 'la mesure doit produire une ligne par cas');
  for (const l of lignes) assert.match(l, /\d/, 'chaque ligne porte au moins un chiffre');
});
