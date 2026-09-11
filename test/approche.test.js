// LA VOIE D'APPROCHE — les deux verrous du lot APPROCHE, 11/09.
//
// Ethan, 11/09 : « qu'elles apparaissent en dessous hors écran, du coup en
// rangée zéro, trois rangées avant la défense en gros, et elles arrivent
// normalement. Et elles peuvent engager le combat dès qu'elles sont visibles. »
// Et le défaut qu'il voyait : « elles arrivent très vite, puis elles arrivent
// dans le tas, comme si elles avaient un boost de vitesse. »
//
// ⚠⚠ CE FICHIER NE GARDE PAS LE CHAMP QUE LE LOT VIENT D'ÉCRIRE. Asserter
// `RANGEE_APPARITION === 0` ne peut pas échouer, et ne dirait rien de ce que le
// lot achète. Les deux tests portent sur les deux VERROUS : **qui peut tirer sur
// qui** (`ciblage`), et **où le sprite tombe** (`yDeRangeeMilli`). Ce sont les
// deux seules choses qu'un futur lot pourrait défaire sans s'en apercevoir.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { DEFENSES, UNITES } from '../src/data/combat.js';
import { creerCombat, tick } from '../src/sim/combat.js';
import { caseDepuisMilli, distanceCarreeMilli } from '../src/sim/grille.js';
import { calculerProjection, yDeRangee, yDeRangeeMilli } from '../src/render/projection.js';
import { casesDeLaBande } from '../src/render/bandes.js';
import { MUR_CASES } from '../src/render/fond.js';
import { listeAffichage } from '../src/render/scene.js';

/** Un montage minimal : un bâtiment hors de portée, pour que le moteur accepte. */
const socle = (defenseurs, vagues) => ({
  niveau: 1,
  saveur: null,
  obstacles: [],
  batiments: [{ id: 'gangue', rangee: 15, colonne: 9 }],
  defenseurs,
  vagues,
  modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
});

// ---------------------------------------------------------------------------
// APPROCHE T1 — hors grille, personne ne touche personne ; visible, tout de suite
// ---------------------------------------------------------------------------

test('APPROCHE T1 — une artillerie à portée ne touche pas la voie d\'approche, et frappe dès l\'entrée', () => {
  // ⚠⚠ LE MONTAGE EST CHOISI POUR QUE LA GARDE SOIT ATTEIGNABLE, ET C'EST TOUT
  // CE QUI REND CE TEST FALSIFIABLE. La première intuition — « rien ne porte à
  // trois cases, le verrou sera vacueux » — est FAUSSE : les trois artilleries
  // du roster portent à 5,5 avec un minimum de 3,5. Posée en rangée 5, la
  // Faucheuse est à distance 5 de la rangée 0, donc DANS sa fourchette. Sans
  // elle, l'artillerie tirerait dans la voie d'approche et tuerait hors écran.
  const combat = creerCombat(socle(
    [{ id: 'faucheuse', rangee: 5, colonne: 4 }],
    [[{ id: 'meute', colonne: 4 }]],
  ));
  const faucheuse = combat.entites.find((e) => e.id === 'faucheuse');
  const meute = combat.entites.find((e) => e.id === 'meute');

  // ⚠⚠ L'ASSERTION PRÉALABLE, SANS LAQUELLE LE TEST PASSE À VIDE, ET ELLE SE
  // MESURE SUR L'ENTITÉ MONTÉE — jamais de tête. Si un lot futur touchait à la
  // portée de la Faucheuse ou au point d'apparition, la Meute sortirait de la
  // fourchette et ce test deviendrait VERT sans plus rien garder. C'est la faute
  // que le dépôt a déjà payée deux fois.
  assert.equal(caseDepuisMilli(meute.rangeeMilli), 0,
    'montage : la Meute ne naît pas sur la voie d\'approche');
  const d2 = distanceCarreeMilli(
    faucheuse.rangeeMilli, faucheuse.colonneMilli, meute.rangeeMilli, meute.colonneMilli,
  );
  assert.ok(d2 <= faucheuse.porteeCarree,
    `montage : la Meute est HORS de portée (${d2} > ${faucheuse.porteeCarree})`);
  assert.ok(d2 >= faucheuse.porteeMiniCarree,
    `montage : la Meute est SOUS la portée minimale (${d2} < ${faucheuse.porteeMiniCarree})`);
  // ⚠ ET LA FAUCHEUSE DOIT POUVOIR LUI FAIRE MAL : une cible qu'on ne peut pas
  // blesser est écartée par une AUTRE garde, et le test mesurerait celle-là.
  assert.ok(DEFENSES.faucheuse.degats.infanterie > 0,
    'montage : la Faucheuse ne blesse pas l\'infanterie');
  // ⚠⚠ ET LA MOITIÉ SYMÉTRIQUE DU VERROU — « celui qui approche ne vise
  // personne » — EST INERTE AUJOURD'HUI, ET C'EST MESURÉ PLUTÔT QUE SUPPOSÉ. Un
  // attaquant en rangée 0 ne peut atteindre que la bande de défense, dont la
  // première rangée est la TROISIÈME : il lui faudrait une portée de 3 au moins.
  // **La plus longue du roster vaut 2,5**, et `creerCombat` refuse d'ailleurs un
  // défenseur hors de la bande — il n'existe donc AUCUN montage d'aujourd'hui où
  // cette ligne morde. Elle est écrite quand même : c'est l'énoncé symétrique de
  // la règle, et le jour où une unité portera plus loin elle décidera toute
  // seule. `CLAUDE.md` §5 : *un test qui ne peut tomber sur aucun état
  // d'aujourd'hui se déclare, il ne se compte pas.*
  //
  // ⚠ CE QUI EST GARDÉ ICI, C'EST DONC LA PRÉMISSE, PAS L'EFFET : le jour où un
  // attaquant atteindra la bande de défense depuis la voie d'approche, cette
  // assertion tombera et obligera à remesurer la falsification.
  const PREMIERE_RANGEE_DEFENDUE = 3;
  const plusLoin = Math.max(...Object.values(UNITES).map((u) => u.portee));
  assert.ok(plusLoin < PREMIERE_RANGEE_DEFENDUE,
    `une unité porte à ${plusLoin} case(s) : depuis la rangée 0 elle atteint la bande `
    + 'de défense, donc la moitié « celui qui approche ne vise personne » cesse d\'être '
    + 'inerte — remesurer la falsification avant de croire ce test');

  // Au tick 1 : la Meute est encore sur la voie d'approche, et intacte.
  tick(combat);
  assert.equal(caseDepuisMilli(meute.rangeeMilli), 0, 'la Meute a déjà quitté l\'approche');
  assert.equal(meute.pvMilli, meute.pvInitialMilli,
    'la Meute a encaissé alors qu\'elle est hors grille');
  assert.equal(faucheuse.cibleIndice, null,
    'la Faucheuse vise une unité qui n\'est pas encore entrée');
  // ⚠ LA MEUTE NE VISE PERSONNE NON PLUS, et c'est vrai des DEUX côtés — par le
  // verrou, et par le fait qu'elle n'a rien à portée (voir la prémisse ci-dessus).
  // La ligne est gardée quand même : elle sera le premier témoin du jour où la
  // seconde moitié cessera d'être inerte.
  assert.equal(meute.cibleIndice, null,
    'la Meute vise depuis la voie d\'approche');

  // ⚠ LE TICK D'ENTRÉE SE DEMANDE AU MOTEUR, IL NE S'ÉCRIT PAS. À `vitesse: 60`
  // il vaut dix-sept ; l'écrire figerait une vitesse d'équilibrage dans un test
  // qui ne mesure pas l'équilibrage.
  let entree = null;
  for (let t = 2; t <= 200 && entree === null; t += 1) {
    tick(combat);
    if (caseDepuisMilli(meute.rangeeMilli) >= 1) entree = t;
  }
  assert.notEqual(entree, null, 'la Meute n\'est jamais entrée en grille');
  assert.equal(meute.pvMilli, meute.pvInitialMilli,
    'la Meute a encaissé AVANT d\'entrer en grille');

  // ⚠⚠ ET ELLE ENCAISSE DÈS QU'ELLE EST VISIBLE — c'est la seconde moitié de la
  // demande d'Ethan, « elles peuvent engager le combat dès qu'elles sont
  // visibles ». Un verrou qui gèlerait le combat une case de plus passerait la
  // première moitié de ce test et raterait celle-ci.
  tick(combat);
  assert.ok(meute.pvMilli < meute.pvInitialMilli,
    `la Meute entrée en rangée ${caseDepuisMilli(meute.rangeeMilli)} n'encaisse toujours pas`);
  assert.equal(UNITES.meute.vitesse > 0, true, 'montage : la Meute ne roule pas');
});

// ---------------------------------------------------------------------------
// APPROCHE T2 — en rangée 0, aucun pixel du sprite n'est dans le champ
// ---------------------------------------------------------------------------

test('APPROCHE T2 — le sprite de la voie d\'approche tombe sous la grille, celui de la rangée 1 ne bouge pas', () => {
  // ⚠⚠ LA PROJECTION EST CELLE DU DÉROULÉ, PAS UNE RONDE. Les nombres se
  // DÉRIVENT d'elle — ni 70, ni 1303 ne sont écrits : un viewport figé ferait
  // passer ce test sur une géométrie que personne ne joue.
  const projection = calculerProjection(1159, 1311, MUR_CASES, {
    lignesVisibles: casesDeLaBande(null, MUR_CASES),
  });
  const combat = creerCombat(socle([], [[
    { id: 'meute', colonne: 3 },
    { id: 'fendeur', colonne: 6, rangee: 1 },
  ]]));
  const approchante = combat.entites.find((e) => e.id === 'meute');
  const entree = combat.entites.find((e) => e.id === 'fendeur');
  assert.equal(caseDepuisMilli(approchante.rangeeMilli), 0, 'montage : la Meute n\'est pas en rangée 0');
  assert.equal(caseDepuisMilli(entree.rangeeMilli), 1, 'montage : le Fendeur n\'est pas en rangée 1');

  const liste = listeAffichage(combat, projection);
  const yDe = (id) => {
    const siens = liste.filter((p) => p.forme === 'sprite' && p.nom.includes(id));
    assert.ok(siens.length > 0, `aucun sprite pour « ${id} »`);
    return Math.min(...siens.map((p) => p.y));
  };

  // ⚠⚠ AUCUN PIXEL DE L'UNITÉ EN RANGÉE 0 N'EST DANS LA GRILLE. Son bord HAUT
  // est au moins le bord BAS de la rangée 1 — c'est ce que « hors écran » veut
  // dire, et c'est tout ce que la levée de borne achète.
  const basDeLaGrille = yDeRangee(projection, 1) + projection.tailleCase;
  assert.ok(yDe('meute') >= basDeLaGrille,
    `la Meute en rangée 0 se dessine à ${yDe('meute')}, au-dessus du bas de grille ${basDeLaGrille}`);

  // ⚠⚠ ET LA LEVÉE N'A RIEN DÉPLACÉ LÀ OÙ LA BORNE MORDAIT. L'unité de rangée 1
  // tombe EXACTEMENT sur `yDeRangeeMilli(projection, 1000)` : c'est la moitié
  // qui prouve qu'on a retiré un plancher et pas décalé la projection.
  assert.equal(yDe('fendeur'), yDeRangeeMilli(projection, 1000),
    'la rangée 1 ne tombe plus sur sa propre case');

  // ⚠ FALSIFIABLE : les deux `y` doivent DIFFÉRER. Avec le `Math.min(brut, bas)`
  // d'hier ils étaient ÉGAUX — les soixante-dix pixels de l'unité en rangée 0
  // étaient dans le champ, et c'est très exactement le défaut que ce lot ferme.
  assert.notEqual(yDe('meute'), yDe('fendeur'),
    'les deux sprites tombent au même endroit : la borne basse est revenue');
  assert.equal(yDe('meute') - yDe('fendeur'), projection.tailleCase,
    'l\'écart entre la voie d\'approche et la rangée 1 n\'est pas d\'une case');
});
