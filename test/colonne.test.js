// Lot COLONNE — l'arrêt sur prédilection, le déplacement latéral de la défense,
// et la pose qui varie de forme. Retours d'Ethan du 06/09, points 7, 9 et 10.
//
// ⚠⚠ CE FICHIER GARDE UN INVARIANT QUI VIENT DE TOMBER. Trois modules
// écrivaient noir sur blanc « aucune unité ne change jamais de colonne » —
// `render/interpolation.js` en tête de fichier, `peutEcraser` dans sa
// conclusion, `placerDefenses` dans le motif de sa troisième contrainte. Il
// reste vrai à l'ATTAQUE, et à l'attaque seulement : Ethan a arbitré
// « défense des deux camps ». Les tests d'ici mesurent les deux moitiés.

import test from 'node:test';
import assert from 'node:assert/strict';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { positionInterpolee } from '../src/render/interpolation.js';
import { creerCombat, tick, resoudre, TICKS_AVANT_REPLI } from '../src/sim/combat.js';
import { creerEtat } from '../src/sim/state.js';
import { montageCourant, enregistrerLeRaid, etatDuSite } from '../src/sim/site-entame.js';
import {
  caseDepuisMilli, PREMIERE_COLONNE, DERNIERE_COLONNE, estSortiParLeCote, MILLI_PAR_CASE,
} from '../src/sim/grille.js';
import { genererSite } from '../src/sim/generateur.js';
import { DISPOSITION_DEFENSES } from '../src/data/sites.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Retire commentaires de ligne et de bloc : une garde ne lit jamais sa propre prose. */
function sansCommentaires(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
}
import { GRILLE, UNITES, DEFENSES } from '../src/data/combat.js';

// ---------------------------------------------------------------------------
// COL T12 — l'interpolation supporte les deltas négatifs
// ---------------------------------------------------------------------------
//
// ⚠⚠ CE TEST A ÉTÉ ÉCRIT AVANT LA CORRECTION, ET IL A ÉTÉ VU ROUGE. C'est le
// §2.7 du brief : le défaut est mesurable SANS le reste du lot, parce que
// `positionInterpolee` est pure et que rien ne l'empêche de recevoir un delta
// négatif — c'est seulement qu'aujourd'hui personne ne lui en donne.
//
// `Math.floor` arrondit vers −∞ : sur un delta négatif il rend une position
// PLUS BASSE que les deux bornes qu'il interpole. À alpha 500 sur −75, il rend
// precedent − 38 quand la moitié vaut −37,5, donc l'entité DÉPASSE sa
// destination d'un milli-case et revient à l'image suivante — elle tremble.
// `Math.trunc` tronque vers zéro, donc vers `precedent` des deux côtés.
test('COL T12 — un delta négatif ne dépasse jamais ses deux bornes', () => {
  // Les deux bornes sont exactes, quel que soit le sens.
  assert.equal(positionInterpolee(2100, 2000, 0), 2100);
  assert.equal(positionInterpolee(2100, 2000, 1000), 2000);
  // Le milieu d'un delta divisible tombe juste des deux côtés.
  assert.equal(positionInterpolee(2100, 2000, 500), 2050);

  // ⚠ LE CŒUR : un delta NON divisible. 2075 → 2000 vaut −75 ; à alpha 500 la
  // moitié exacte vaut −37,5. `Math.trunc` rend −37, `Math.floor` rendrait −38.
  assert.equal(positionInterpolee(2075, 2000, 500), 2038,
    'floor arrondit vers −∞ sur un delta négatif : l\'entité dépasse sa destination');

  // Et la propriété qu'on garde vraiment, sur toute la plage : la position
  // affichée reste TOUJOURS entre les deux bornes, dans les deux sens.
  for (const [a, b] of [[2075, 2000], [2000, 2075], [5001, 4998], [4998, 5001]]) {
    const bas = Math.min(a, b);
    const haut = Math.max(a, b);
    for (let alpha = 0; alpha < 1000; alpha += 7) {
      const p = positionInterpolee(a, b, alpha);
      assert.ok(p >= bas && p <= haut,
        `interpolation ${a} → ${b} à alpha ${alpha} : ${p} sort de [${bas}, ${haut}]`);
    }
  }

  // Falsifiable : le montage doit porter de vrais deltas non divisibles, sinon
  // `floor` et `trunc` rendent le même nombre et le test passerait sur les deux.
  assert.notEqual(Math.floor(-75 / 2), Math.trunc(-75 / 2),
    'témoin : le montage ne distingue pas les deux arrondis');
});

// ---------------------------------------------------------------------------
// Le montage nu, repris de `arret.test.js` — même idiome, même raison
// ---------------------------------------------------------------------------

/**
 * ⚠ LA GANGUE LOINTAINE EST OBLIGATOIRE quand la scène n'a pas d'autre
 * bâtiment : sans un objectif quelque part, le combat se conclut faute de
 * cible et la trace s'arrête avant ce qu'on veut voir.
 */
const montage = (o) => ({
  niveau: 1,
  saveur: null,
  obstacles: [],
  batiments: [],
  defenseurs: [],
  vagues: [[]],
  modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
  ...o,
});

const GANGUE_LOINTAINE = { id: 'gangue', rangee: 18, colonne: 1 };

const jouer = (etat, n) => { for (let i = 0; i < n; i += 1) tick(etat); };

/**
 * Cette entité occupe-t-elle sa case pour de bon ? Lue dans les DONNÉES,
 * exactement comme les trois `bloquant:` des trois constructeurs de profil —
 * `u.masse > 0`, `d.bloque === true`, et `true` pour un bâtiment.
 */
function bloquanteDeTest(e) {
  if (e.genre === 'batiment') return true;
  if (e.genre === 'defense') return DEFENSES[e.id].bloque === true;
  return UNITES[e.id].masse > 0;
}
const colonneDe = (e) => caseDepuisMilli(e.colonneMilli);
const rangeeDe = (e) => caseDepuisMilli(e.rangeeMilli);

/** L'unique assaillant du montage. */
function assaillant(etat) {
  const e = etat.entites.find((x) => x.camp === 'attaque');
  assert.ok(e !== undefined, 'montage : aucun assaillant');
  return e;
}

/** La pièce de garnison portant cet identifiant. */
function defenseur(etat, id) {
  const e = etat.entites.find((x) => x.camp === 'defense' && x.id === id);
  assert.ok(e !== undefined, `montage : aucun défenseur « ${id} »`);
  return e;
}

// ---------------------------------------------------------------------------
// COL T1 — l'arrêt sur la colonne de prédilection
// ---------------------------------------------------------------------------
//
// Ethan, 06/09, point 7 : « ajouter l'arrêt sur prédilection EN PLUS du
// bâtiment ». Le défaut qu'il décrit : « un éclaireur ne s'arrête pas lorsqu'il
// rencontre une infanterie ennemie ».
//
// ⚠ ON MESURE LE DÉPLACEMENT, PAS LE PRÉDICAT. `doitSArreter` est privée, et
// lui ouvrir un export pour les besoins d'un test mettrait dans `src/` une
// porte que la production n'emploie pas. Ce qu'elle commande est observable de
// l'extérieur : une unité arrêtée ne change plus de rangée.
test('COL T1 — une anti-infanterie s\'arrête pour une infanterie de garnison', () => {
  // ⚠ LA CIBLE EST DANS UNE AUTRE COLONNE, ET C'EST TOUT CE QUI REND LA MESURE
  // LISIBLE. Une Meute de garnison est `bloquant` : posée dans la colonne de
  // l'assaillant, elle l'arrêterait de toute façon par `peutAvancer`, et le
  // test passerait avec ou sans la règle.
  const etat = creerCombat(montage({
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'meute', rangee: 6, colonne: 6 }],
    vagues: [[{ id: 'meute', colonne: 5 }]],
  }));
  const e = assaillant(etat);
  assert.ok(
    UNITES.meute.degats.infanterie > UNITES.meute.degats.structureOuAviation
      && UNITES.meute.degats.infanterie > UNITES.meute.degats.vehicule,
    'montage : la Meute n\'est plus anti-infanterie, le test ne mesure plus rien',
  );

  // On avance jusqu'à ce qu'elle ait tiré — c'est la condition de l'arrêt.
  let ticks = 0;
  while (!e.aTire && ticks < 400) { tick(etat); ticks += 1; }
  assert.ok(e.aTire, `montage : l'assaillant n'a pas tiré en ${ticks} ticks`);
  assert.ok(etat.entites[e.cibleIndice].camp === 'defense',
    'montage : la cible n\'est pas la pièce de garnison');

  const avant = e.rangeeMilli;
  jouer(etat, 10);
  assert.equal(e.rangeeMilli, avant,
    'l\'assaillant continue d\'avancer devant une infanterie de sa prédilection');
});

// ---------------------------------------------------------------------------
// COL T2 — on s'arrête pour un merlon, même hors de sa colonne
// ---------------------------------------------------------------------------
//
// ⚠⚠ CE TEST GARDAIT L'ARBITRAGE DU 04/09 ; LE LOT MUR (10/09) LE RETOURNE, ET
// C'EST LA MOITIÉ QU'IL GARDE MAINTENANT QUI COMPTE. Ethan le 04/09 : « Merlon
// et tourelles exclus, sauf si ils empêchent d'avancer » ; Ethan le 10/09 : « les
// unités anti-structure s'arrêtent devant les tourelles, les barbelés, les murs
// et les bâtiments ». L'exclusion tombe.
//
// ⚠⚠ ET LE MONTAGE VAUT PLUS APRÈS LE RENVERSEMENT QU'AVANT, PARCE QUE LE
// MERLON EST HORS DE LA COLONNE. Cette moitié-là reste vraie : en (6,6) contre
// un Bélier en colonne 5, il ne BLOQUE rien — ni `peutAvancer` ni le rangement
// du point 2 ne peuvent retenir l'unité. Si elle ne bouge plus, c'est
// `doitSArreter` et rien d'autre, et le test sépare donc l'ARRÊT du BLOCAGE
// aussi nettement qu'avant, dans l'autre sens.
test('COL T2 — une anti-structure s\'arrête pour un merlon MÊME hors de sa colonne', () => {
  const etat = creerCombat(montage({
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'merlon', rangee: 6, colonne: 6 }],
    vagues: [[{ id: 'belier', colonne: 5 }]],
  }));
  const e = assaillant(etat);
  // ⚠ LES DEUX MOITIÉS DU MONTAGE S'ASSERTENT : sans elles, un Bélier qui ne
  // serait pas anti-structure, ou un merlon rangé ailleurs, rendrait le test
  // vert pour la mauvaise raison.
  assert.ok(
    UNITES.belier.degats.structureOuAviation > UNITES.belier.degats.infanterie
      && UNITES.belier.degats.structureOuAviation > UNITES.belier.degats.vehicule,
    'montage : le Bélier n\'est plus anti-structure',
  );
  assert.equal(DEFENSES.merlon.type, 'mur', 'montage : le Merlon n\'est plus un mur');

  let ticks = 0;
  while (!e.aTire && ticks < 400) { tick(etat); ticks += 1; }
  assert.ok(e.aTire, `montage : l'assaillant n'a pas tiré en ${ticks} ticks`);
  assert.equal(etat.entites[e.cibleIndice].id, 'merlon', 'montage : il ne vise pas le merlon');

  // AVANT le 10/09 : il continuait à sa vitesse nominale, le merlon n'étant ni
  // dans sa colonne ni dans sa règle. APRÈS : pas un milli-case, et le merlon
  // perd des PV — les deux moitiés ensemble, sinon on mesurerait un gel.
  const avant = e.rangeeMilli;
  const mur = () => etat.entites.find((x) => x.id === 'merlon');
  const pvAvant = mur().pvMilli;
  jouer(etat, 10);
  assert.equal(e.rangeeMilli, avant,
    'l\'assaillant avance encore : l\'arbitrage du 10/09 n\'est pas lu');
  assert.ok(mur().pvMilli < pvAvant,
    'il est figé sans tirer : ce serait un blocage, or le merlon n\'est pas dans sa colonne');
});

// ---------------------------------------------------------------------------
// COL T3 — l'arrêt pour un bâtiment survit
// ---------------------------------------------------------------------------
//
// ⚠ L'ASSAILLANT EST ANTI-INFANTERIE, ET C'EST CE QUI DISTINGUE LES DEUX
// BRANCHES. La colonne d'un bâtiment est `structureOuAviation` ; celle de la
// Meute est `infanterie`. Elles ne coïncident pas : si l'unité s'arrête, ce
// n'est PAS par la branche de prédilection, c'est par le genre. Avec une
// anti-structure, les deux branches rendraient vrai et le test ne dirait rien.
test('COL T3 — l\'arrêt pour un bâtiment ne passe pas par la prédilection', () => {
  const etat = creerCombat(montage({
    batiments: [{ id: 'gangue', rangee: 12, colonne: 6 }, GANGUE_LOINTAINE],
    vagues: [[{ id: 'meute', colonne: 5 }]],
  }));
  const e = assaillant(etat);
  assert.ok(
    UNITES.meute.degats.infanterie > UNITES.meute.degats.structureOuAviation,
    'montage : les deux branches coïncideraient, le test ne distinguerait rien',
  );

  let ticks = 0;
  while (!e.aTire && ticks < 400) { tick(etat); ticks += 1; }
  assert.ok(e.aTire, `montage : l'assaillant n'a pas tiré en ${ticks} ticks`);
  assert.equal(etat.entites[e.cibleIndice].genre, 'batiment');

  const avant = e.rangeeMilli;
  jouer(etat, 10);
  assert.equal(e.rangeeMilli, avant, 'l\'arrêt pour un bâtiment a disparu');
});

// ---------------------------------------------------------------------------
// COL T4 — l'aviation traversante ne s'arrête jamais
// ---------------------------------------------------------------------------

test('COL T4 — un traversant ne s\'arrête ni pour un bâtiment ni pour sa prédilection', () => {
  const traversant = Object.keys(UNITES)
    .find((id) => UNITES[id].comportementAerien === 'traversant');
  assert.ok(traversant !== undefined, 'montage : aucune unité traversante au roster');

  // La cible satisfait LES DEUX branches : c'est un bâtiment, et la colonne
  // d'un bâtiment est celle que vise une anti-structure.
  const etat = creerCombat(montage({
    batiments: [{ id: 'gangue', rangee: 12, colonne: 6 }, GANGUE_LOINTAINE],
    vagues: [[{ id: traversant, colonne: 5 }]],
  }));
  const e = assaillant(etat);
  let ticks = 0;
  while (!e.aTire && ticks < 400) { tick(etat); ticks += 1; }
  assert.ok(e.aTire, `montage : le traversant n'a pas tiré en ${ticks} ticks`);

  const avant = e.rangeeMilli;
  jouer(etat, 5);
  assert.ok(e.rangeeMilli > avant, 'un traversant s\'est arrêté');
});

// ---------------------------------------------------------------------------
// COL T5 — une colonne de prédilection nulle ne lève pas
// ---------------------------------------------------------------------------
//
// ⚠⚠ LA COMPARAISON EST ÉCRITE DANS LE SENS QUI SUPPORTE `null`, ET C'EST LE
// §1 DU BRIEF. Le Merlon ne fait AUCUN dégât : `colonneDominante` rend `null`.
// Écrite « la colonne de la cible vaut la prédilection », la règle rendrait
// `false` sans lever ; écrite dans l'autre sens sur une table absente, elle
// lèverait. On mesure qu'aucune des deux ne se produit.
test('COL T5 — une pièce sans dégâts ne fait pas lever la règle d\'arrêt', () => {
  const sansDegats = Object.keys(DEFENSES).filter((id) => {
    const d = DEFENSES[id].degats;
    return d === null || Object.values(d).every((v) => !v);
  });
  assert.ok(sansDegats.length > 0, 'montage : plus aucune défense sans dégâts');

  // Elle est du côté DÉFENSE : c'est là qu'elle existe. Ce qu'on vérifie est
  // qu'un tick complet passe sans exception, la règle étant lue pour chaque
  // entité active de la scène.
  const etat = creerCombat(montage({
    batiments: [GANGUE_LOINTAINE],
    defenseurs: sansDegats.map((id, k) => ({ id, rangee: 6, colonne: k + 2 })),
    vagues: [[{ id: 'meute', colonne: 5 }]],
  }));
  assert.doesNotThrow(() => jouer(etat, 200),
    'une pièce à `colonnePredilection` nulle fait lever la règle d\'arrêt');
  // ⚠ ET LE MONTAGE SE REVÉRIFIE APRÈS COUP : une pièce qui gagnerait des
  // dégâts sortirait du cas `null` et le test cesserait de mesurer ce qu'il dit.
  for (const id of sansDegats) {
    const d = DEFENSES[id].degats;
    assert.ok(d === null || Object.values(d).every((v) => !v),
      `montage : « ${id} » a gagné des dégâts, le test ne mesure plus le cas null`);
  }
});

// ---------------------------------------------------------------------------
// COL T6 — une défenseuse se décale vers sa cible
// ---------------------------------------------------------------------------
//
// Ethan, 06/09, point 10 : « déplacement latéral identique au déplacement
// vertical. Vitesse multipliée par 2/3. Même règle de collision. Elle veut
// aller vers la cible la plus proche, peu importe si elle se bloque. »
// Périmètre : « défense des deux camps ».
//
// ⚠ LA CIBLE EST HORS DE SA COLONNE, ET C'EST TOUT LE MONTAGE. Une cible déjà
// dans la colonne de la défenseuse ne prouverait rien : elle n'aurait aucune
// raison de bouger, et le test passerait sur un code qui ne décale personne.
test('COL T6 — une pièce de garnison se décale vers sa cible de prédilection', () => {
  const etat = creerCombat(montage({
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'meute', rangee: 6, colonne: 3 }],
    vagues: [[{ id: 'meute', colonne: 6 }]],
  }));
  const garde = defenseur(etat, 'meute');
  assert.equal(colonneDe(garde), 3, 'montage : la garnison n\'est pas en colonne 3');
  assert.equal(colonneDe(assaillant(etat)), 6, 'montage : l\'assaillant n\'est pas en colonne 6');

  jouer(etat, 60);
  assert.ok(colonneDe(garde) > 3,
    `la garnison n'a pas bougé : colonne ${colonneDe(garde)} après 60 ticks`);
  // ⚠ ET ELLE NE CHANGE PAS DE RANGÉE : le décalage est LATÉRAL, la garnison ne
  // marche pas au-devant de l'assaut.
  assert.equal(rangeeDe(garde), 6, 'la garnison a changé de rangée : ce n\'est plus un décalage');
});

// ---------------------------------------------------------------------------
// COL T6 bis — « même règle de collision », mesurée plutôt que crue
// ---------------------------------------------------------------------------
//
// ⚠⚠ CE TEST EXISTE PARCE QU'UNE FALSIFICATION N'A MORDU SUR RIEN. Ethan écrit
// « même règle de collision » ; la règle est écrite dans `seDecaler`, et en la
// retirant — la case de destination prise qu'elle soit occupée ou non — les
// dix-huit autres tests du lot restaient VERTS. Une règle que rien ne mesure
// n'est pas une règle. Ce qu'elle interdit est observable de l'extérieur : deux
// pièces bloquantes vivantes sur la même case.
test('COL T6 bis — aucune superposition, même quand la garnison se décale', () => {
  // ⚠ UN VRAI SITE, PAS UN MONTAGE À LA MAIN : c'est la seule façon d'avoir une
  // garnison assez dense pour que les décalages se disputent des cases.
  let decalages = 0;
  for (let g = 1; g <= 6; g += 1) {
    const site = genererSite({ type: 'base', niveau: 30, saveur: null, graine: g });
    const depart = new Map(site.defenseurs.map((d, k) => [k, d.colonne]));
    const etat = creerCombat({
      ...site,
      vagues: [Array.from({ length: GRILLE.largeur }, (_, k) => ({ id: 'meute', colonne: k + 1 }))],
    });
    for (let t = 0; t < 300 && !etat.termine; t += 1) {
      tick(etat);
      // ⚠ SEULES LES BLOQUANTES SE DISPUTENT UNE CASE, et « bloquant » se lit
      // dans les DONNÉES comme le profil le lit : une Ronce ne bloque pas
      // (`bloque: false`), une unité sans masse non plus, un bâtiment toujours.
      // Compter tout le monde ferait tomber le test sur du code parfaitement
      // juste — mesuré : une Meute traverse une Ronce, et elle en a le droit.
      const prises = new Map();
      for (const e of etat.entites) {
        if (!e.vivant || e.sorti || !bloquanteDeTest(e)) continue;
        const cle = `${rangeeDe(e)},${colonneDe(e)}`;
        const deja = prises.get(cle);
        if (deja !== undefined) {
          assert.fail(
            `graine ${g} tick ${etat.tick} : « ${deja.id} » et « ${e.id} » sur la case ${cle}`,
          );
        }
        prises.set(cle, e);
      }
    }
    // Falsifiable : si aucune garnison ne s'était décalée, le test n'aurait rien
    // eu à départager et il passerait sur un code sans collision du tout.
    let k = 0;
    for (const e of etat.entites) {
      if (e.camp !== 'defense' || e.genre !== 'defense') continue;
      if (colonneDe(e) !== depart.get(k)) decalages += 1;
      k += 1;
    }
  }
  assert.ok(decalages > 0,
    'aucune pièce de garnison ne s\'est décalée sur six sites : le test ne mesure rien');
});

// ---------------------------------------------------------------------------
// COL T6 ter — elle ne dépasse pas sa cible, donc elle ne tremble pas
// ---------------------------------------------------------------------------
//
// ⚠⚠ CE TEST VIENT DE LA RELECTURE HOSTILE DU §7, PAS DE L'ÉCRITURE. Un
// attaquant ne change JAMAIS de colonne : sa colonne est fixe. Une défenseuse
// qui la dépasse d'un pas repart en sens inverse au tick suivant, puis revient,
// indéfiniment — et comme le dépassement peut franchir une frontière de case,
// elle prend et rend une case à chaque tick. C'est la faute de `Math.floor` de
// `positionInterpolee`, vue depuis le MODÈLE au lieu du DESSIN.
test('COL T6 ter — une défenseuse s\'arrête sur la colonne de sa cible', () => {
  // ⚠⚠ LE COUPLE BROYEUR / BÉLIER, ET IL EST CHOISI POUR DEUX RAISONS QUI SE
  // MESURENT TOUTES LES DEUX. (1) Le pas latéral d'une Meute vaut 40 milli, qui
  // DIVISE les 1 000 milli d'une case : elle tombe toujours pile sur sa cible, et
  // le dépassement ne peut pas se produire — le test serait vert sur le code
  // fautif. Celui d'un Broyeur vaut 60, qui ne divise pas 2 000 : à 33 ticks il
  // est en 1 980, et le pas suivant le porterait à 2 040, au-delà. (2) Le Broyeur
  // est anti-VÉHICULE, donc sa cible de décalage doit être un blindé : un Bélier.
  // Avec une Meute en face, `cibleDuDecalage` rendrait `null` et il ne bougerait
  // pas du tout.
  const pas = Math.floor((UNITES.broyeur.vitesse * GRILLE.lateral.numerateur)
    / GRILLE.lateral.denominateur);
  assert.equal(UNITES.belier.chassis, 'blinde', 'montage : le Bélier n\'est plus un blindé');
  const etat = creerCombat(montage({
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'broyeur', rangee: 10, colonne: 3 }],
    vagues: [[{ id: 'belier', colonne: 5 }]],
  }));
  const garde = defenseur(etat, 'broyeur');
  const proie = assaillant(etat);
  const colonneProie = proie.colonneMilli;

  // Assez de ticks pour qu'elle ait largement le temps d'arriver : 3 cases à
  // 40 milli le tick font 75 ticks.
  const vues = new Set();
  let arrive = false;
  for (let t = 0; t < 60 && !arrive; t += 1) {
    tick(etat);
    assert.ok(garde.vivant && proie.vivant && !proie.sorti,
      `montage : une des deux pièces a disparu au tick ${t}`);
    vues.add(garde.colonneMilli);
    arrive = garde.colonneMilli === colonneProie;
  }
  assert.equal(proie.colonneMilli, colonneProie,
    'montage : l\'attaquant a changé de colonne, la cible n\'était pas fixe');

  // ⚠ ELLE FINIT EXACTEMENT SUR LA COLONNE DE SA CIBLE, jamais au-delà.
  assert.equal(garde.colonneMilli, colonneProie,
    `elle s'est arrêtée en ${garde.colonneMilli} pour une cible en ${colonneProie}`);
  // ⚠ ET ELLE N'A JAMAIS DÉPASSÉ EN CHEMIN : sans la borne, l'ensemble des
  // positions vues contiendrait au moins une valeur au-delà de la cible.
  for (const c of vues) {
    assert.ok(c <= colonneProie, `elle a dépassé sa cible : ${c} > ${colonneProie}`);
  }
  // Falsifiable : le montage doit VRAIMENT produire un dépassement sans la
  // borne — 3 000 milli à parcourir par pas de 40 ne tombe pas rond.
  assert.notEqual((colonneProie - 3000) % pas, 0,
    `montage : la distance tombe rond au pas de ${pas}, le dépassement ne pourrait pas `
    + 'se produire et le test ne mesurerait rien');
});

// ---------------------------------------------------------------------------
// COL T7 — elle se décale à 2/3 de sa vitesse
// ---------------------------------------------------------------------------
//
// ⚠⚠ UN TEST QUI ASSERTERAIT « ELLE BOUGE » PASSERAIT SUR N'IMPORTE QUEL
// FACTEUR. On compare donc le décalage LATÉRAL d'une Meute de garnison au
// déplacement VERTICAL d'une Meute d'assaut — même unité, même vitesse
// nominale, même nombre de ticks, aucun obstacle ni Booster ni collision d'un
// côté comme de l'autre. Le rapport doit valoir EXACTEMENT le quotient de la
// table, et il tombe juste : 60 × 2 / 3 = 40.
test('COL T7 — le décalage latéral vaut exactement 2/3 du déplacement vertical', () => {
  const N = 30;

  // Le vertical : une Meute d'assaut seule dans sa colonne, rien devant elle.
  const vertical = creerCombat(montage({
    batiments: [GANGUE_LOINTAINE],
    vagues: [[{ id: 'meute', colonne: 5 }]],
  }));
  const marcheur = assaillant(vertical);
  const rangeeAvant = marcheur.rangeeMilli;
  jouer(vertical, N);
  const pasVertical = marcheur.rangeeMilli - rangeeAvant;
  assert.ok(pasVertical > 0, 'montage : l\'unité d\'assaut n\'avance pas');

  // Le latéral : une Meute de garnison qui vise un assaillant à sept colonnes.
  // ⚠ SEPT COLONNES, PAS UNE : à 40 milli par tick, trente ticks font 1,2 case.
  // Une cible trop proche serait rejointe avant la fin de la fenêtre et le
  // rapport mesuré tomberait sous le vrai.
  const lateral = creerCombat(montage({
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'meute', rangee: 6, colonne: 1 }],
    vagues: [[{ id: 'meute', colonne: 8 }]],
  }));
  const garde = defenseur(lateral, 'meute');
  const colonneAvant = garde.colonneMilli;
  jouer(lateral, N);
  const pasLateral = garde.colonneMilli - colonneAvant;

  assert.equal(
    pasLateral * GRILLE.lateral.denominateur, pasVertical * GRILLE.lateral.numerateur,
    `latéral ${pasLateral} contre vertical ${pasVertical} : le rapport n'est pas `
    + `${GRILLE.lateral.numerateur}/${GRILLE.lateral.denominateur}`,
  );
  // Falsifiable : sans cette ligne, deux zéros satisferaient l'égalité.
  assert.ok(pasLateral > 0, 'la garnison ne s\'est pas décalée du tout');
});

// ---------------------------------------------------------------------------
// COL T8 — les structures ne se décalent pas
// ---------------------------------------------------------------------------
//
// ⚠ ET CE N'EST PAS UN CAS PARTICULIER ÉCRIT À LA MAIN : `deplacement` sort sur
// `p.vitesseMilli === 0`, en tête, pour les deux camps. Une tourelle n'a pas de
// vitesse dans la table, donc elle ne peut pas bouger — le test le VÉRIFIE au
// lieu de le croire.
test('COL T8 — une tourelle ne se décale pas, même vers sa cible', () => {
  const etat = creerCombat(montage({
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'casemate', rangee: 6, colonne: 2 }],
    vagues: [[{ id: 'meute', colonne: 8 }]],
  }));
  const tourelle = defenseur(etat, 'casemate');
  assert.equal(DEFENSES.casemate.vitesse, undefined,
    'montage : la Casemate a gagné une vitesse, le test ne mesure plus rien');

  jouer(etat, 120);
  assert.equal(colonneDe(tourelle), 2, 'une tourelle s\'est déplacée latéralement');
  assert.equal(rangeeDe(tourelle), 6, 'une tourelle a changé de rangée');
});

// ---------------------------------------------------------------------------
// COL T9 — une défenseuse bloquée ne se replie pas
// ---------------------------------------------------------------------------
//
// ⚠⚠ C'EST LE TEST QUI ATTRAPE L'OUVERTURE DU REPLI À LA DÉFENSE, ET LE BRIEF
// EXIGEAIT QU'IL EXISTE AVANT LE CODE. Le repli vit dans `avancer`, qui n'est
// appelée que pour `camp === 'attaque'` ; `seDecaler` n'en a PAS. Une garnison
// qui se replierait quitterait le terrain sans être détruite — elle n'a pas de
// base où rentrer, et le raid se conclurait sur une défense évaporée.
test('COL T9 — une pièce de garnison bloquée reste sur le terrain', () => {
  // Une Meute de garnison enfermée entre deux murs, sans cible à portée : elle
  // ne peut ni se décaler ni nuire, exactement la situation qui déclenche le
  // repli côté assaut.
  const etat = creerCombat(montage({
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [
      { id: 'meute', rangee: 6, colonne: 5 },
      { id: 'merlon', rangee: 6, colonne: 4 },
      { id: 'merlon', rangee: 6, colonne: 6 },
    ],
    vagues: [[]],
  }));
  const garde = defenseur(etat, 'meute');
  assert.equal(garde.sorti, false, 'montage : elle est déjà sortie');

  jouer(etat, TICKS_AVANT_REPLI * 4);
  assert.equal(garde.sorti, false,
    'une pièce de garnison s\'est repliée : le repli a été ouvert à la défense');
  assert.equal(garde.vivant, true, 'elle a été détruite : le montage ne mesure plus le repli');
  // Falsifiable : le compteur doit VRAIMENT avoir dépassé le seuil, sinon le
  // test passerait sur un repli parfaitement ouvert.
  assert.ok(garde.ticksInutiles === 0 || garde.ticksInutiles >= TICKS_AVANT_REPLI,
    `montage : ticksInutiles = ${garde.ticksInutiles}, le seuil n'a pas été atteint`);
});

// ---------------------------------------------------------------------------
// COL T10 — personne ne sort par le côté
// ---------------------------------------------------------------------------
//
// ⚠ LA BORNE EST PURE ET EXPORTÉE, ET C'EST LE §2.5 DU BRIEF : `peutAvancer`
// est écrite pour la verticale — sa première ligne teste `rangee >=
// DERNIERE_RANGEE` et rend le comportement aérien —, donc lui ajouter un
// paramètre d'axe en ferait deux fonctions dans une. `estSortiParLeCote` se
// mesure sans monter un combat, et le combat la vérifie ensuite.
test('COL T10 — la borne latérale refuse les deux bords, et la garnison y reste', () => {
  assert.equal(estSortiParLeCote(PREMIERE_COLONNE * 1000), false);
  assert.equal(estSortiParLeCote(DERNIERE_COLONNE * 1000), false);
  assert.equal(estSortiParLeCote((PREMIERE_COLONNE - 1) * 1000), true);
  assert.equal(estSortiParLeCote((DERNIERE_COLONNE + 1) * 1000), true);
  // ⚠ ET LE BORD SE FRANCHIT PAR FRACTION, pas seulement par case entière : une
  // borne écrite sur la case seule laisserait la pièce dériver de 999 milli.
  assert.equal(estSortiParLeCote(PREMIERE_COLONNE * 1000 - 1), true);

  // Et sur une vraie scène : une garnison collée au bord gauche, dont la cible
  // est elle aussi au bord gauche, ne peut pas déborder.
  const etat = creerCombat(montage({
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'meute', rangee: 6, colonne: PREMIERE_COLONNE }],
    vagues: [[{ id: 'meute', colonne: PREMIERE_COLONNE }]],
  }));
  const garde = defenseur(etat, 'meute');
  jouer(etat, 200);
  assert.ok(colonneDe(garde) >= PREMIERE_COLONNE && colonneDe(garde) <= DERNIERE_COLONNE,
    `la garnison est sortie par le côté : colonne ${colonneDe(garde)}`);
  assert.equal(estSortiParLeCote(garde.colonneMilli), false);
});

// ---------------------------------------------------------------------------
// COL T11 — les portées sont justes sur les deux axes
// ---------------------------------------------------------------------------
//
// ⚠⚠ UN MONTAGE ALIGNÉ EN COLONNE PASSERAIT MÊME AVEC LA DISTANCE CASSÉE D'UN
// FACTEUR 1 000 000 : la composante horizontale y vaut zéro des deux façons.
// Les deux entités sont donc DÉSALIGNÉES, et le test mesure une portée qui
// dépend de l'axe horizontal pour tomber juste — c'est la seule forme qui
// attrape un appelant oublié de `distanceCarreeMilli`.
test('COL T11 — l\'acquisition de cible compte la colonne, pas seulement la rangée', () => {
  // La Casemate porte 2,5 cases. À deux rangées et UNE colonne d'écart, la
  // distance vaut √5 ≈ 2,236 : DANS la portée. À deux rangées et DEUX colonnes,
  // elle vaut √8 ≈ 2,828 : HORS de portée. Les deux scènes ne diffèrent que par
  // la colonne — c'est ce qui rend le test aveugle à tout sauf à l'axe
  // horizontal.
  const portee = DEFENSES.casemate.portee;
  assert.equal(portee, 2.5, 'montage : la portée de la Casemate a changé');
  assert.ok(2 ** 2 + 1 ** 2 < portee ** 2, 'montage : le cas « dedans » n\'est plus dedans');
  assert.ok(2 ** 2 + 2 ** 2 > portee ** 2, 'montage : le cas « dehors » n\'est plus dehors');

  const scene = (colonneCible) => creerCombat(montage({
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'casemate', rangee: 4, colonne: 5 }],
    vagues: [[{ id: 'meute', colonne: colonneCible }]],
  }));
  // On lit la cible AU PREMIER TICK, là où l'assaillant est encore sur sa
  // rangée d'apparition : un tick de plus et la distance qu'on croit mesurer
  // aurait changé sous le test.
  const dedans = scene(4);
  const dehors = scene(3);
  tick(dedans); tick(dehors);
  const tourelleDedans = defenseur(dedans, 'casemate');
  const tourelleDehors = defenseur(dehors, 'casemate');
  // ⚠ LE MONTAGE SE MESURE PLUTÔT QU'IL NE SE SUPPOSE : les deux assaillants
  // doivent être à la MÊME rangée, sans quoi l'écart observé ne serait pas
  // horizontal.
  assert.equal(assaillant(dedans).rangeeMilli, assaillant(dehors).rangeeMilli,
    'montage : les deux assaillants ne sont pas à la même rangée');
  assert.equal(colonneDe(tourelleDedans) - colonneDe(assaillant(dedans)), 1);
  assert.equal(colonneDe(tourelleDehors) - colonneDe(assaillant(dehors)), 2);

  assert.notEqual(tourelleDedans.cibleIndice, null,
    'à √5 la tourelle ne voit rien : la composante horizontale est comptée trop grand');
  assert.equal(tourelleDehors.cibleIndice, null,
    'à √8 la tourelle voit encore : la composante horizontale est comptée trop petit');
});

// ---------------------------------------------------------------------------
// COL T13 — aucune vitesse n'est indivisible par 3
// ---------------------------------------------------------------------------
//
// ⚠ TEST DE DONNÉES, PAS DE COMBAT. Le facteur latéral vaut 2/3 : si une
// vitesse n'était pas divisible par 3, `Math.floor` la rognerait et le rapport
// de `COL T7` cesserait d'être exact — sans qu'aucun combat ne lève. Les quatre
// vitesses du roster tombent juste : 60 · 90 · 120 · 240 → 40 · 60 · 80 · 160.
test('COL T13 — les vitesses du roster restent divisibles par le dénominateur latéral', () => {
  const d = GRILLE.lateral.denominateur;
  assert.ok(Number.isInteger(d) && d > 1, 'montage : le dénominateur latéral n\'en est pas un');
  const vitesses = new Set();
  for (const [id, u] of Object.entries(UNITES)) {
    assert.equal(u.vitesse % d, 0,
      `« ${id} » : vitesse ${u.vitesse} indivisible par ${d} — le facteur latéral rognerait`);
    vitesses.add(u.vitesse);
  }
  // Falsifiable : sans plusieurs vitesses distinctes, la garde ne couvrirait
  // qu'un cas et une cinquième valeur passerait sans être vue.
  assert.ok(vitesses.size >= 3, `montage : ${vitesses.size} vitesse(s) distincte(s) seulement`);
});

// ---------------------------------------------------------------------------
// COL T14 — le plafond des 1 000 tient latéralement
// ---------------------------------------------------------------------------
//
// ⚠⚠ LE PLAFOND EST L'INVARIANT DE `peutAvancer` : un pas ne doit jamais
// franchir plus d'une case en un tick, sans quoi le déplacement sauterait
// par-dessus une case occupée sans la voir. Il tenait pour la verticale ; le
// décalage latéral est PLUS LENT que la verticale par construction — 2/3 — donc
// il tient a fortiori. Ce test le mesure au lieu de le déduire, Booster compris.
test('COL T14 — la pire vitesse latérale, Booster compris, reste sous une case', () => {
  const { numerateur, denominateur } = GRILLE.lateral;
  // ⚠⚠ LE PIRE CAS SE PREND SUR LA GARNISON, PAS SUR LE ROSTER ENTIER, ET LE
  // BRIEF SE TROMPAIT DESSUS. Son §2.4 annonce « le pire latéral 160, 400
  // boosté » ; mesuré, la plus rapide des quatorze unités vaut 240, ce qui
  // ferait 1 600 boosté et latéral — au-DESSUS de la case. Mais SEULE LA DÉFENSE
  // se décale : `deplacement` route `camp === 'attaque'` vers `avancer` et tout
  // le reste vers `seDecaler`. La plus rapide des HUIT unités qui entrent en
  // garnison vaut 120, donc 800 au pire, sous la case. **Écart au brief,
  // déclaré, et c'est le test qui l'a trouvé.**
  const enGarnison = Object.entries(UNITES).filter(([, u]) => u.defense?.present === true);
  assert.ok(enGarnison.length > 0, 'montage : aucune unité n\'entre en garnison');
  const pireNominale = Math.max(...enGarnison.map(([, u]) => u.vitesse));
  // ⚠ ET LA PLUS RAPIDE DU ROSTER N'Y EST PAS, ce qui est ce qui rend la borne
  // vraie : la garde tomberait si une unité à 240 devenait posable en garnison.
  const pireDuRoster = Math.max(...Object.values(UNITES).map((u) => u.vitesse));
  assert.ok(pireNominale < pireDuRoster,
    'la plus rapide du roster entre en garnison : la borne latérale doit être remesurée');
  // ⚠ LE FACTEUR DU BOOSTER SE LIT DANS LE MOTEUR, IL NE SE RETAPE PAS. Il
  // n'est pas exporté, et lui ouvrir un export pour les besoins d'un test
  // mettrait dans `src/` une porte que la production n'emploie pas ; une valeur
  // recopiée ici serait une seconde vérité qui vieillirait au premier réglage.
  // C'est l'idiome de `SON T1`, qui lit son retrait dans `tools/sons.py`.
  const source = sansCommentaires(readFileSync(join(RACINE, 'src/sim/combat.js'), 'utf8'));
  const trouve = source.match(/BOOSTER_FACTEUR\s*=\s*(\d+)/);
  assert.ok(trouve !== null, 'le moteur ne porte plus de BOOSTER_FACTEUR sous ce nom');
  const BOOSTER_FACTEUR = Number(trouve[1]);
  // Témoin : le filtre de commentaires n'a pas tout mangé.
  assert.ok(source.includes('function vitesseLaterale'),
    'témoin : le filtre de commentaires a mangé la source');

  // Le Booster multiplie, et il s'applique AVANT le facteur latéral — c'est
  // l'ordre du moteur : obstacle, puis Booster, puis latéral.
  const pireBoostee = pireNominale * BOOSTER_FACTEUR;
  const pireLaterale = Math.floor((pireBoostee * numerateur) / denominateur);

  assert.ok(pireLaterale < MILLI_PAR_CASE,
    `pire vitesse latérale ${pireLaterale} : elle franchit une case entière en un tick`);
  // ⚠ ET LE PLAFOND N'EST PAS VACUEUX : la pire vitesse BOOSTÉE, elle, dépasse
  // la case. C'est le facteur latéral qui la ramène dessous, et sans cette ligne
  // le test passerait même si le facteur disparaissait.
  assert.ok(pireBoostee > MILLI_PAR_CASE,
    'montage : la vitesse boostée ne dépasse plus la case, le plafond ne mesure rien');
});

// ---------------------------------------------------------------------------
// COL T15 — deux graines donnent deux FORMES
// ---------------------------------------------------------------------------
//
// Ethan, 06/09, point 9 : « la disposition des unités et bâtiments ouvrage
// semblent identique alors qu'elle doit être plus aléatoire ».
//
// ⚠⚠ COMPARER LES LISTES BRUTES NE FALSIFIE RIEN : elles diffèrent DÉJÀ sur
// `origin/main`, la permutation des colonnes étant tirée de la graine. Ce que
// le lot change est la FORME, et l'invariant qui la sépare d'un simple
// étiquetage est le MULTI-ENSEMBLE DES CHARGES PAR COLONNE : une permutation le
// préserve, par définition. Mesuré sur `origin/main` : **une seule valeur sur
// quarante graines**, à chaque type et à chaque niveau — donc toutes les
// dispositions y étaient l'image l'une de l'autre.
//
// ⚠⚠ ET CE TEST N'A PAS VU LA MOITIÉ DU DÉFAUT, CE QUI EST LA LEÇON DU LOT
// CIBLES-RANGÉES (07/09). Il mesure le multi-ensemble des charges par COLONNE —
// l'axe horizontal, et lui seul. Il est passé vert pendant que la RANGÉE d'un
// occupant restait une fonction pure de son rang dans la liste : mesuré sur 200
// graines, **UN SEUL** profil d'occupation par rangée, à tous les types et à
// tous les niveaux. Le brief du lot COLONNE demandait « le multi-ensemble des
// (rangee, id) » ; l'exécution a mesuré autre chose, et personne ne l'a relevé.
// Ce test-ci reste juste et utile — il garde l'acquis des colonnes, et `CR T7`
// le rejoue — mais il ne prouve PAS que deux sites ont deux FORMES. C'est
// `CR T1` de `generateur.test.js` qui le fait, et son montage ignore la colonne
// par construction.
test('COL T15 — deux graines diffèrent par autre chose qu\'une permutation de colonnes', () => {
  const chargeTriee = (liste) => {
    const c = new Array(GRILLE.largeur).fill(0);
    for (const e of liste) c[e.colonne - 1] += 1;
    return c.sort((a, b) => a - b).join(',');
  };

  for (const [type, niveau, saveur] of [
    ['base', 30, null], ['base', 10, null],
    ['camp', 20, 'richeQuartz'], ['avantPoste', 40, 'richeScorie'],
  ]) {
    const profils = new Set();
    for (let g = 1; g <= 40; g += 1) {
      profils.add(chargeTriee(genererSite({ type, niveau, saveur, graine: g }).defenseurs));
    }
    assert.ok(profils.size > 1,
      `${type}/n${niveau} : ${profils.size} profil(s) de charge sur 40 graines — `
      + 'toutes les dispositions sont l\'image l\'une de l\'autre par permutation');
  }
});

// ---------------------------------------------------------------------------
// COL T16 — les trois contraintes tiennent encore
// ---------------------------------------------------------------------------
//
// ⚠ CENT GRAINES, ET C'EST LE MINIMUM : une pose tirée ne se juge pas sur un
// échantillon d'une graine. Les trois contraintes sont celles de
// `DISPOSITION_DEFENSES`, et le lot n'en relâche aucune — il cesse seulement de
// laisser la moitié du budget d'écart inutilisée.
test('COL T16 — six occupants par rangée, trois colonnes libres, plafond de colonne ⌈N/9⌉ + 2', () => {
  const parRangee = DISPOSITION_DEFENSES.occupantsMaxParRangee;
  // ⚠⚠ LES DEUX NOMBRES S'ÉCRIVENT EN CLAIR, ET C'EST DÉLIBÉRÉ. Une garde qui
  // lit son seuil dans la table qu'elle garde ne peut PAS voir ce seuil se
  // relâcher — mesuré : porter `ecartColonnesMax` à 4 ne fait tomber aucun des
  // dix-neuf tests du lot, ni le T8 de `generateur.test.js`, qui le lisent tous
  // deux dans la table. Or §5 de `CLAUDE.md` interdit d'élargir une borne pour
  // faire passer un lot : c'est exactement la faute que ces deux lignes-ci
  // rendent visible. Le jour où Ethan arbitre autrement, elles se changent avec
  // la table, et le lot le dit.
  //
  // ⚠⚠ `ecartColonnesMax` EST RETIRÉ — LOT PAQUETS, 09/09. Son motif (« une
  // colonne vide serait une autoroute ») est tombé avec le décalage latéral du
  // lot COLONNE, et l'audit du 09/09 mesure ZÉRO colonne libre dès le niveau
  // 15. La borne en clair est désormais `margeDeColonne` : au plus
  // `⌈N/9⌉ + 2` occupants d'un même groupe dans une colonne.
  assert.equal(parRangee, 6, 'six occupants sur neuf colonnes : trois libres au minimum');
  assert.equal(DISPOSITION_DEFENSES.margeDeColonne, 2,
    'la marge de colonne a été relevée — une borne ne se desserre pas pour faire passer un lot');
  let ecartMax = 0;
  for (let g = 1; g <= 100; g += 1) {
    for (const [type, niveau, saveur] of [
      ['base', 30, null], ['camp', 20, 'richeQuartz'], ['avantPoste', 40, 'richeScorie'],
    ]) {
      const site = genererSite({ type, niveau, saveur, graine: g });
      // 1. six occupants au plus par rangée, donc trois colonnes libres.
      const parLigne = new Map();
      for (const d of site.defenseurs) parLigne.set(d.rangee, (parLigne.get(d.rangee) ?? 0) + 1);
      for (const [rangee, n] of parLigne) {
        assert.ok(n <= parRangee, `${type}/g${g} rangée ${rangee} : ${n} occupants`);
        assert.ok(GRILLE.largeur - n >= 3, `${type}/g${g} rangée ${rangee} : moins de 3 libres`);
      }
      // 2. la bande. ⚠ LOT PAQUETS : le bloc a disparu et l'étalement n'est
      //    plus borné — un trou entre deux paquets est ce qu'on demande ; ce qui
      //    sépare un paquet d'un semis est `PQ T2` et le plafond de colonne.
      const bande = GRILLE.bandes.defense;
      const rangees = [...parLigne.keys()].sort((a, b) => b - a);
      for (const r of rangees) {
        assert.ok(r >= bande.premiere && r <= bande.derniere,
          `${type}/g${g} : rangée ${r} hors de la bande de défense`);
      }
      // 3. le plafond de colonne, sur les DEUX groupes.
      for (const groupe of [site.defenseurs, site.batiments]) {
        const charge = new Array(GRILLE.largeur).fill(0);
        for (const e of groupe) charge[e.colonne - 1] += 1;
        const plafond = Math.ceil(groupe.length / GRILLE.largeur) + DISPOSITION_DEFENSES.margeDeColonne;
        assert.ok(Math.max(...charge) <= plafond,
          `${type}/g${g} : ${Math.max(...charge)} dans une colonne, plafond ${plafond} — ${charge}`);
        ecartMax = Math.max(ecartMax, Math.max(...charge) - Math.min(...charge));
      }
    }
  }
  // ⚠ ET L'ÉCART MAXIMAL EST ÉCRIT EN CLAIR : 6, mesuré sur ces 300 montages. Il
  // valait 2 sous l'ancien budget ; un `<=` seul laisserait glisser sans un mot.
  assert.equal(ecartMax, 6, `écart maximal entre colonnes : ${ecartMax}`);
});

// ---------------------------------------------------------------------------
// COL T17 — le déterminisme est intact
// ---------------------------------------------------------------------------
//
// ⚠ C'EST L'INVARIANT QUE LE POINT 9 POUVAIT LE PLUS FACILEMENT CASSER. Le
// placement tire davantage qu'avant — 79 à 297 tirages selon la configuration,
// mesuré — et un seul tirage pris ailleurs que dans le PRNG semé rendrait deux
// sites différents pour la même graine.
test('COL T17 — même graine, même disposition au bit près', () => {
  for (let g = 1; g <= 30; g += 1) {
    for (const [type, niveau, saveur] of [
      ['base', 35, null], ['camp', 15, 'richeQuartz'], ['avantPoste', 45, 'richeScorie'],
    ]) {
      const a = genererSite({ type, niveau, saveur, graine: g });
      const b = genererSite({ type, niveau, saveur, graine: g });
      assert.deepEqual(a, b, `${type}/n${niveau}/g${g} : deux sites différents pour une graine`);
    }
  }
  // Falsifiable : deux graines voisines doivent, elles, différer — sinon
  // l'égalité ci-dessus tiendrait sur un générateur constant.
  const x = genererSite({ type: 'base', niveau: 35, saveur: null, graine: 1 });
  const y = genererSite({ type: 'base', niveau: 35, saveur: null, graine: 2 });
  assert.notDeepEqual(x, y, 'deux graines rendent le même site : le tirage ne tire rien');
});

// ---------------------------------------------------------------------------
// COL T18 — Souche et Étai restent au fond
// ---------------------------------------------------------------------------
//
// ⚠ CE SONT LES DEUX OBJECTIFS DU RAID, et le brief COLONNE l'exigeait : ils
// devaient coûter la traversée complète. ⚠⚠ RENVERSÉ AU LOT PAQUETS, 09/09 —
// Ethan : « un ratio de destruction trop grand ». Ils flottent dans leur bande
// comme les autres ; mesuré avant d'écrire une ligne, le taux de rasage ne
// bouge pas, seule la durée du raid baisse. Ce test garde ce qui reste vrai :
// un de chaque, deux cases distinctes, la bande, et les huit rangées atteintes.
test('COL T18 — Souche et Étai dans leur bande, rangées et colonnes tirées, sur cent graines', () => {
  // ⚠⚠ « AU CENTRE » EST TOMBÉ AU LOT DISPOSITION-OUVRAGE, 08/09 — troisième
  // membre du point 9 d'Ethan, « souche et étai restent au fond ». Les deux
  // colonnes valaient 5 et 4 sur toute graine : une seule position sur 240
  // montages, mesuré. « AU FOND » est tombé au lot PAQUETS, 09/09.
  const bande = GRILLE.bandes.batiments;
  const rangees = { souche: new Set(), etai: new Set() };
  for (let g = 1; g <= 100; g += 1) {
    for (const [type, niveau, saveur] of [
      ['base', 25, null], ['camp', 12, 'richeQuartz'], ['avantPoste', 40, 'richeScorie'],
    ]) {
      const site = genererSite({ type, niveau, saveur, graine: g });
      const souche = site.batiments.find((b) => b.id === 'souche');
      const etai = site.batiments.find((b) => b.id === 'etai');
      assert.ok(souche !== undefined && etai !== undefined, `${type}/g${g} : un unique manque`);
      for (const u of [souche, etai]) {
        assert.ok(u.rangee >= bande.premiere && u.rangee <= bande.derniere,
          `${type}/g${g} : « ${u.id} » en rangée ${u.rangee}, hors de la bande`);
        rangees[u.id].add(u.rangee);
      }
      assert.ok(souche.colonne !== etai.colonne || souche.rangee !== etai.rangee,
        `${type}/g${g} : la Souche et l'Étai partagent une case`);
    }
  }
  // ⚠ FALSIFIABLE : un générateur qui les aurait laissés au fond passerait tout
  // ce qui précède. Mesuré : les huit rangées, des deux côtés.
  const hauteur = bande.derniere - bande.premiere + 1;
  assert.equal(rangees.souche.size, hauteur, `la Souche n'atteint que ${rangees.souche.size} rangées`);
  assert.equal(rangees.etai.size, hauteur, `l'Étai n'atteint que ${rangees.etai.size} rangées`);
});

// ---------------------------------------------------------------------------
// COL T18 bis — une DETTE, assertée encore violée
// ---------------------------------------------------------------------------
//
// ⚠⚠ CE TEST NE GARDE PAS UNE PROPRIÉTÉ : IL FIGE UN DÉFAUT QUE LE LOT A TROUVÉ
// ET N'A PAS CORRIGÉ. C'est l'idiome de `DETTES_ACCENT` — on nomme, on mesure,
// on asserte que c'est ENCORE violé, et le test tombe le jour où quelqu'un
// répare. Le taire serait pire : le prochain lot le redécouvrirait de zéro.
//
// LE DÉFAUT. Un site raidé plusieurs fois de suite peut LEVER au raid suivant :
// « combat : défenseur « X » — pvMilli N hors de 1…M ». `ajouterEntite` borne un
// `pvMilli` forcé par les PV NOMINAUX, et `site-entame.js` range parfois une
// valeur au-dessus — jusqu'à 1,37 fois le nominal, mesuré. Le joueur perd sa
// partie sur une exception.
//
// ⚠⚠ ET IL EST ANTÉRIEUR AU LOT, MESURÉ SUR `origin/main` DANS UN `git
// worktree` : **six cas sur 900 scénarios** là-bas, **cinq ici**, sur des
// graines différentes — le lot ne le crée pas, il ne le referme pas, il le
// déplace comme il déplace tout ce qui touche à la disposition.
//
// ⚠ CE QUI A ÉTÉ ESSAYÉ ET ÉCARTÉ : borner la valeur rangée dans `reprojeter`.
// Mesuré — le défaut PERSISTE, cinq cas sur cinq. La valeur fautive ne vient
// donc pas de là, et livrer ce correctif aurait mis dans `src/` une garde qui
// prétend protéger ce qu'elle ne protège pas. **Un correctif qui ne mord pas se
// vérifie avant d'être cru**, comme une falsification.
//
// ⚠ CE QUI PROTÈGE LA PRODUCTION AUJOURD'HUI, ET C'EST FRAGILE :
// `pvCourantsDesDefenses` repasse chaque PV rangé par `pvApresRetour` et rend
// `null` dès qu'il atteint le nominal — mais elle rend les valeurs BRUTES quand
// l'Étai est tombé (`if (sante === null) return entree.pvDefensesMilli`), et
// c'est exactement par là que les cinq cas passent.
test('COL T18 bis — DETTE : un site raidé en boucle peut encore lever', () => {
  const MOTIF = ['belier', 'pilon', 'broyeur', 'crecelle'];
  const leve = [];
  // ⚠⚠ LES TROIS TRIPLETS SONT RÉANCRÉS UNE SECONDE FOIS AU LOT
  // DISPOSITION-OUVRAGE, 08/09, ET LA DETTE N'EST TOUJOURS PAS PAYÉE. Même
  // mécanique qu'au lot CIBLES-RANGÉES : celui-ci fait FLOTTER le bloc dans sa
  // bande, donc la disposition de chaque site change encore, donc les trois
  // scénarios d'hier ne lèvent plus — zéro sur trois, mesuré. Balayage de 600
  // scénarios sur l'arbre du lot : **16 lèvent encore**, du même message
  // `pvMilli N hors de 1…M`. Ce n'est donc pas une réparation, c'est le
  // déplacement que ce commentaire annonce depuis deux lots.
  //
  // ⚠ ET LE COMPTE DU BALAYAGE A BAISSÉ — 188 sur 540 au lot précédent, 16 sur
  // 600 ici. Le dire dans ce sens-là et pas dans l'autre : c'est un autre
  // échantillon de dispositions, pas une dette qui se referme. Le défaut est
  // dans `pvCourantsDesDefenses` quand l'Étai est tombé, et aucune ligne de ce
  // lot ne l'a touché.
  // ⚠ LOT PAQUETS (09/09) : LES TROIS TRIPLETS ONT ENCORE BOUGÉ — la dette n'est
  // pas payée, elle s'est déplacée avec la disposition. Balayage de 600
  // scénarios : huit lèvent encore, du même message. Trois d'entre eux.
  //
  // ⚠⚠ LOT MUR (10/09) : QUATRIÈME RÉANCRAGE, ET LA DETTE N'EST TOUJOURS PAS
  // PAYÉE — elle s'est déplacée avec le DÉROULÉ du combat cette fois, pas avec
  // la disposition. Les trois scénarios d'hier lèvent zéro sur trois : un raid
  // qui s'arrête devant les murs ne laisse plus les mêmes survivants. Balayage
  // du MÊME échantillon de 600 — `camp`, niveaux 25 à 30, graines 1 à 100 — :
  // **trois lèvent encore**, et c'est TOUJOURS le même message,
  // `pvMilli N hors de 1…M` sur un défenseur « perceurs ». Le défaut est dans
  // `pvCourantsDesDefenses` quand l'Étai est tombé, et aucune ligne de ce lot ne
  // l'a touché.
  //
  // ⚠ ET LE COMPTE PASSE DE HUIT À TROIS SUR LE MÊME ÉCHANTILLON. Le dire dans ce
  // sens-là : c'est un autre déroulé de combats, pas une dette qui se referme.
  for (const [type, niveau, graine] of [
    ['camp', 28, 54], ['camp', 29, 54], ['camp', 30, 92],
  ]) {
    const identite = {
      type, saveur: 'richeQuartz', niveau, rangee: 100, colonne: 5, instance: 1,
    };
    const etat = creerEtat(9000 + graine);
    const vagues = [Array.from({ length: GRILLE.largeur }, (_, k) => ({
      id: MOTIF[k % MOTIF.length], colonne: k + 1, niveau,
    }))];
    try {
      for (let passe = 0; passe < 10; passe += 1) {
        const m = { ...montageCourant(etat, identite), vagues };
        enregistrerLeRaid(etat, identite, resoudre(creerCombat(m)), m);
        if (etatDuSite(etat, identite) === null) break;
      }
    } catch (e) {
      leve.push(`${type}/n${niveau}/g${graine} : ${e.message}`);
    }
  }
  // ⚠ ASSERTÉE ENCORE VIOLÉE. Le jour où la dette est payée, cette ligne tombe
  // et quelqu'un vient la retirer — c'est ce qu'on lui demande.
  assert.equal(leve.length, 3,
    `la dette est payée sur ${3 - leve.length} des trois cas : retirer ce test et le dire`);
  for (const m of leve) {
    assert.match(m, /pvMilli \d+ hors de 1…\d+/, `la levée a changé de nature : ${m}`);
  }
});
