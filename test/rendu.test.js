// Tests T1 à T7 du brief du lot 3A — projection, accumulateur, interpolation,
// scène et exécution. Sans DOM : c'est l'architecture qui le permet, la liste
// d'affichage se calcule et s'exécute sur n'importe quel objet compatible.
//
// Chaque seuil porte son calcul en commentaire.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { GRILLE, UNITES, DEFENSES, COLONNES_DEGATS } from '../src/data/combat.js';
import { TICK_MS } from '../src/sim/clock.js';
import { creerCombat, tick, serialiserEtat } from '../src/sim/combat.js';
import {
  calculerProjection, xDeColonne, yDeRangeeMilli, yDeRangee,
} from '../src/render/projection.js';
import {
  PLAFOND_RATTRAPAGE_MS, TICKS_MAX_PAR_IMAGE, VITESSES,
  intervalleMs, creerAccumulateur, ticksDus, alphaMilli,
  positionInterpolee, prendrePositions,
} from '../src/render/interpolation.js';
import {
  PALETTE, FOND, COULEUR_OBSTACLE, COULEUR_BARRE_PV,
  classeDe, accentDe, NB_PRIMITIVES, listeAffichage,
} from '../src/render/scene.js';
import { executer } from '../src/render/canvas2d.js';
import {
  ligneEcranDeLaRangee, rangeeDeLaLigneEcran, ligneEcranDeLaBande,
} from '../src/render/orientation.js';

// ---------------------------------------------------------------------------
// Montage de référence pour la scène : une entité de chaque classe visuelle.
// ---------------------------------------------------------------------------

function montageDeScene() {
  return {
    niveau: 1,
    saveur: null,
    obstacles: [{ rangee: 5, colonne: 3, type: 'infanterie' }],
    batiments: [{ id: 'gangue', rangee: 11, colonne: 5 }],
    defenseurs: [
      { id: 'casemate', rangee: 3, colonne: 5 }, // tourelle
      { id: 'merlon', rangee: 3, colonne: 4 }, //   mur
      { id: 'ronce', rangee: 4, colonne: 7 }, //    barrière
      { id: 'faucheuse', rangee: 9, colonne: 2 }, // artillerie
    ],
    vagues: [[
      { id: 'meute', colonne: 5 }, //    escouade
      { id: 'fendeur', colonne: 4 }, //  blindé
      { id: 'crecelle', colonne: 6 }, // aéronef
    ]],
    modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
  };
}

// ---------------------------------------------------------------------------
// T1 — projection
// ---------------------------------------------------------------------------

test('T1 — tailleCase, letterboxing, case carrée, rien ne déborde', () => {
  // 412 × 900 : min(floor(412/9) = 45, floor(900/18) = 50) = 45 — la largeur
  // commande. Grille 405 × 810, marges (412−405)/2 = 3 et (900−810)/2 = 45.
  const p = calculerProjection(412, 900);
  assert.equal(p.tailleCase, 45);
  assert.deepEqual([p.margeX, p.margeY], [3, 45]);

  // Le même téléphone avec un HUD de plus de 90 px : 900 − 810 = 90 est la
  // marge exacte, donc à 800 px restants c'est la hauteur qui commande :
  // min(45, floor(800/18) = 44) = 44.
  assert.equal(calculerProjection(412, 800).tailleCase, 44);

  // 360 × 640 : min(floor(360/9) = 40, floor(640/18) = 35) = 35.
  assert.equal(calculerProjection(360, 640).tailleCase, 35);

  // Carré 800 × 800 : min(88, 44) = 44 — la hauteur commande toujours en
  // format non-téléphone, la grille étant deux fois plus haute que large.
  assert.equal(calculerProjection(800, 800).tailleCase, 44);

  // La grille reste centrée et aucune case ne sort du canvas, sur les trois
  // viewports : marges ≥ 0, symétriques au pixel de floor près, et
  // marge + grille ≤ viewport.
  for (const [l, h] of [[412, 900], [360, 640], [800, 800]]) {
    const proj = calculerProjection(l, h);
    const { tailleCase: t, margeX, margeY } = proj;
    assert.ok(margeX >= 0 && margeY >= 0);
    assert.ok(margeX + GRILLE.largeur * t <= l, 'déborde à droite');
    assert.ok(margeY + GRILLE.longueur * t <= h, 'déborde en bas');
    assert.ok(l - (margeX + GRILLE.largeur * t) - margeX <= 1, 'pas centré en X');
    assert.ok(h - (margeY + GRILLE.longueur * t) - margeY <= 1, 'pas centré en Y');
    // La case est CARRÉE : une seule dimension, pas de couple largeur/hauteur.
    assert.ok(Number.isInteger(t) && t > 0);
  }

  // Rangée 1 en bas, rangée 18 en haut : y décroît quand la rangée monte.
  const proj = calculerProjection(412, 900);
  assert.equal(yDeRangee(proj, 18), proj.margeY);
  assert.equal(yDeRangee(proj, 1), proj.margeY + 17 * 45);
  assert.equal(yDeRangeeMilli(proj, 1000), proj.margeY + 17 * 45);
  assert.equal(yDeRangeeMilli(proj, 18_000), proj.margeY);
  // Position intermédiaire : m = 2500 → y = margeY + (18000 − 2500) × 45/1000
  // = margeY + floor(697,5) = margeY + 697.
  assert.equal(yDeRangeeMilli(proj, 2500), proj.margeY + 697);
  // Un stoppeur arrêté à 18950 reste DESSINÉ dans la grille : borné à margeY.
  assert.equal(yDeRangeeMilli(proj, 18_950), proj.margeY);
  // Colonnes : 1 à gauche.
  assert.equal(xDeColonne(proj, 1), proj.margeX);
  assert.equal(xDeColonne(proj, 9), proj.margeX + 8 * 45);
});

// ---------------------------------------------------------------------------
// T2 — l'accumulateur ne dérive pas
// ---------------------------------------------------------------------------

test('T2 — pas de temps fixe : exact à ×1, ×4, sous plafonds', () => {
  // TICK_MS vient de clock.js, jamais recopié : 100 ms, donc des intervalles
  // de 100 · 50 · 25 ms aux trois vitesses — entiers tous les trois.
  assert.equal(intervalleMs(1), TICK_MS);
  assert.equal(intervalleMs(2), TICK_MS / 2);
  assert.equal(intervalleMs(4), TICK_MS / 4);
  assert.throws(() => intervalleMs(3), /vitesse ×3 inconnue/);
  assert.deepEqual(VITESSES, [1, 2, 4]);

  // 900 images de 100 ms à ×1 : 900 × 100 / 100 = exactement 900 ticks,
  // reliquat nul — aucune dérive d'accumulation.
  const a = creerAccumulateur();
  let ticksRendus = 0;
  for (let image = 0; image < 900; image++) ticksRendus += ticksDus(a, 100, 1);
  assert.equal(ticksRendus, 900);
  assert.equal(a.residuMs, 0);
  assert.equal(alphaMilli(a, 1), 0);

  // 250 ms à ×1 : floor(250/100) = 2 ticks, reste 50 ms → alpha 500 ‰.
  const b = creerAccumulateur();
  assert.equal(ticksDus(b, 250, 1), 2);
  assert.equal(b.residuMs, 50);
  assert.equal(alphaMilli(b, 1), 500);

  // 100 ms à ×4 : l'intervalle vaut 25 ms → 4 ticks. La vitesse divise
  // l'intervalle de tick, elle ne touche à rien d'autre.
  const c = creerAccumulateur();
  assert.equal(ticksDus(c, 100, 4), 4);
  assert.equal(c.residuMs, 0);

  // Le plafond de rattrapage coupe à sa valeur : dix minutes d'onglet caché
  // (600 000 ms) sont ramenées à 250 ms → 2 ticks et 50 ms, pas 6000 ticks.
  const d = creerAccumulateur();
  assert.equal(PLAFOND_RATTRAPAGE_MS, 250);
  assert.equal(ticksDus(d, 600_000, 1), 2);
  assert.equal(d.residuMs, 50);

  // Le plafond de ticks par image abandonne le reliquat SANS boucler. Par le
  // chemin public il est hors d'atteinte — la demande vaut au plus
  // floor((residu < intervalle + 250) / intervalle) ≤ 10 à ×4 — c'est une
  // défense en profondeur : on l'éprouve en gonflant le résidu à la main.
  // 10 000 ms de résidu à ×1 = 100 ticks demandés → 10 rendus, résidu 0.
  const e = creerAccumulateur();
  e.residuMs = 10_000;
  assert.equal(TICKS_MAX_PAR_IMAGE, 10);
  assert.equal(ticksDus(e, 0, 1), 10);
  assert.equal(e.residuMs, 0, 'le reliquat est abandonné, pas reporté');
  assert.equal(alphaMilli(e, 1), 0);

  // Une durée négative est un bug d'appelant : refusée, pas absorbée.
  assert.throws(() => ticksDus(creerAccumulateur(), -1, 1), /durée invalide/);
});

// ---------------------------------------------------------------------------
// T3 — interpolation
// ---------------------------------------------------------------------------

test('T3 — alpha 0 : précédent · alpha 1000 : courant · alpha 500 : milieu entier', () => {
  assert.equal(positionInterpolee(2000, 2100, 0), 2000);
  assert.equal(positionInterpolee(2000, 2100, 1000), 2100);
  assert.equal(positionInterpolee(2000, 2100, 500), 2050);
  // Milieu ENTIER : 2000 + floor(75 × 500 / 1000) = 2000 + floor(37,5) = 2037.
  assert.equal(positionInterpolee(2000, 2075, 500), 2037);
  // Une entité immobile reste où elle est, quel que soit l'alpha.
  assert.equal(positionInterpolee(3000, 3000, 731), 3000);

  // Une entité née après l'instantané se dessine SANS interpolation, à sa
  // position courante : indice ≥ instantane.length. On le prouve par la
  // scène : instantané VIDE (tout le monde est « nouveau ») contre instantané
  // plein, à alpha 500, sur un Meute qui vient d'avancer de 50 milli-cases.
  const montage = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [{ id: 'gangue', rangee: 18, colonne: 9 }],
    defenseurs: [],
    vagues: [[{ id: 'meute', colonne: 5 }]],
    modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
  };
  const etat = creerCombat(montage);
  // Ordre d'insertion du moteur : bâtiments d'abord, puis la vague — la
  // Gangue est l'indice 0, le Meute l'indice 1.
  const precedentes = prendrePositions(etat); // [18000, 2000]
  assert.deepEqual(precedentes, [18_000, 2000]);
  tick(etat); // le Meute avance de 60 milli-cases (lot 4A : 50 avant conversion)
  const meute = etat.entites.find((e) => e.camp === 'attaque');
  assert.equal(meute.rangeeMilli, 2060);
  const proj = calculerProjection(412, 900);

  const avecInstantane = listeAffichage(etat, proj, precedentes, 500);
  const sansInstantane = listeAffichage(etat, proj, [], 500);
  // ⚠ LA SONDE A CHANGÉ AU LOT UNITÉS-AU-COMBAT, PAS LE SUJET DU TEST. Elle
  // lisait l'ordonnée de la figure de tête de l'escouade — une primitive
  // `kakiCorps` posée 4 px sous le bord de la case. L'escouade est maintenant UN
  // sprite qui couvre la case entière : la figure n'existe plus, et le `find`
  // rendait `undefined`. Ce que T3 mesure — l'interpolation — est intact, et les
  // deux ordonnées attendues sont recalculées, pas assouplies.
  //
  // Interpolé : position affichée 2000 + floor(60 × 500/1000) = 2030 →
  // y de case = margeY + floor((18000 − 2030) × 45/1000) = margeY + 718.
  // Sans instantané (le Meute est « nouveau ») : position COURANTE 2060 →
  // y de case = margeY + floor(717,3) = margeY + 717.
  // L'écart d'UN pixel entre les deux est ce que le test mesure ; il était de
  // un pixel avant, il l'est encore.
  const ySprite = (liste) => {
    const p = liste.find((q) => q.forme === 'sprite' && q.famille === 'unite');
    assert.ok(p !== undefined, 'la scène ne porte pas de sprite d\'unité : la sonde ne mesure rien');
    return p.y;
  };
  assert.equal(ySprite(avecInstantane) - proj.margeY, 718);
  assert.equal(ySprite(sansInstantane) - proj.margeY, 717);
  assert.notEqual(ySprite(avecInstantane), ySprite(sansInstantane),
    'les deux chemins rendent la même ordonnée : l\'interpolation ne se mesure plus');

  // Les PV ne s'interpolent JAMAIS : la barre de PV a la même largeur de
  // remplissage à alpha 0 et à alpha 999 du même tick.
  const largeursPv = (liste) => liste
    .filter((p) => p.couleur === COULEUR_BARRE_PV)
    .map((p) => p.l);
  assert.deepEqual(
    largeursPv(listeAffichage(etat, proj, precedentes, 0)),
    largeursPv(listeAffichage(etat, proj, precedentes, 999)),
  );
});

// ---------------------------------------------------------------------------
// T4 — le rendu ne mute jamais la simulation
// ---------------------------------------------------------------------------

test('T4 — un raid entier rendu à chaque tick laisse l\'état sérialisé identique', () => {
  const etat = creerCombat(montageDeScene());
  const proj = calculerProjection(412, 900);
  let precedentes = null;
  let nbColonnesFigees = etat.entites.map((e) => e.colonne);

  while (!etat.termine) {
    precedentes = prendrePositions(etat);
    tick(etat);
    // Comparaison PAR SÉRIALISATION, pas à l'œil : la liste d'affichage se
    // construit trois fois à des alphas différents, l'état doit rester
    // strictement identique octet pour octet.
    const avant = serialiserEtat(etat);
    for (const alpha of [0, 500, 999]) listeAffichage(etat, proj, precedentes, alpha);
    assert.equal(serialiserEtat(etat), avant, `mutation par le rendu au tick ${etat.tick}`);

    // Et les deux faits du moteur dont dépend l'interpolation, asseyés en
    // continu : les indices sont stables (le tableau ne fait que croître) et
    // aucune entité ne change jamais de colonne.
    assert.ok(etat.entites.length >= nbColonnesFigees.length, 'une entité a été retirée');
    for (let i = 0; i < nbColonnesFigees.length; i++) {
      assert.equal(etat.entites[i].colonne, nbColonnesFigees[i], `colonne changée sur ${i}`);
      assert.equal(etat.entites[i].indice, i, `indice déplacé sur ${i}`);
    }
    nbColonnesFigees = etat.entites.map((e) => e.colonne);
  }
  assert.ok(etat.tick > 0);
});

// ---------------------------------------------------------------------------
// T5 — la liste d'affichage
// ---------------------------------------------------------------------------

test('T5 — composition et ordre de dessin stables', () => {
  const etat = creerCombat(montageDeScene());
  const proj = calculerProjection(412, 900);
  const liste = listeAffichage(etat, proj, null, 0);

  // Composition au tick 0, comptée classe par classe (table NB_PRIMITIVES) :
  //   fond 1 + obstacle 1
  //   + gangue (batiment 1) + casemate (tourelle 2) + merlon (mur 1)
  //   + ronce (barriere 1) + faucheuse (artillerie 2)
  //   + meute (escouade 1) + fendeur (blinde 2) + crecelle (aeronef 1)
  //   + barres de PV : 8 vivants × 2 = 16
  //   + barres de réserve : 3 attaquants × 2 = 6
  //   + traits de tir : 0 (personne n'a tiré au tick 0)
  // = 1 + 1 + 1 + 2 + 1 + 1 + 2 + 1 + 2 + 1 + 16 + 6 = 35.
  //
  // ⚠ LE COMPTE EST PASSÉ DE 53 À 44 AU LOT UNITÉS-AU-COMBAT, PUIS DE 44 À 35 AU
  // LOT STRUCTURES-AU-COMBAT, et les deux BAISSES sont le fait. Les trois
  // classes d'unité émettaient 6, 4 et 3 primitives géométriques ; les quatre
  // classes de structure et le bâtiment en émettaient 2, 3, 4, 5 et 2. Toutes
  // émettent maintenant leurs COUCHES — une, sauf le blindé du joueur, la
  // tourelle et l'artillerie, qui en portent deux.
  //
  // ⚠ CE TEST AVAIT RAISON DE TOMBER, et c'est pour ça qu'on le recalcule au
  // lieu de l'assouplir : il mesure exactement la chose que le lot change. Le
  // nombre se LIT dans `NB_PRIMITIVES`, il n'est pas recopié — la ligne
  // ci-dessous tomberait si la table changeait sans que ce commentaire suive.
  const attendu = 1 + 1
    + NB_PRIMITIVES.batiment + NB_PRIMITIVES.tourelle + NB_PRIMITIVES.mur
    + NB_PRIMITIVES.barriere + NB_PRIMITIVES.artillerie
    + NB_PRIMITIVES.escouade + NB_PRIMITIVES.blinde + NB_PRIMITIVES.aeronef
    + 8 * 2 + 3 * 2;
  assert.equal(attendu, 35);
  assert.equal(liste.length, 35);

  // L'ordre de dessin est stable et normatif : fond, obstacles, bâtiments,
  // structures, unités, barres, traits — une barre ne passe jamais sous une
  // unité. Le fond est LA première primitive et couvre tout le canvas.
  assert.equal(liste[0].forme, 'rect');
  assert.equal(liste[0].couleur, FOND);
  assert.deepEqual([liste[0].x, liste[0].y, liste[0].l, liste[0].h], [0, 0, 412, 900]);
  assert.equal(liste[1].couleur, COULEUR_OBSTACLE);

  // Le bâtiment vient avant la première structure, qui vient avant la
  // première unité, qui vient avant la première barre.
  const indexOu = (predicat) => liste.findIndex(predicat);
  // ⚠ LES DEUX SONDES SONT PASSÉES AU SPRITE, L'ORDRE TESTÉ N'A PAS BOUGÉ. Celle
  // des unités a suivi au lot UNITÉS-AU-COMBAT, celle des bâtiments à ce lot-ci :
  // elle cherchait un `rect` en `metalMoyen`, que `dessinerBatiment` émettait et
  // qu'un bâtiment n'émet plus au combat. Ce que T5 asserte — bâtiments, puis
  // structures, puis unités, puis barres — est intact, et il est même plus
  // exigeant : les trois genres se distinguent maintenant par la FAMILLE
  // d'atlas de leur sprite, qui est une information de jeu et non une teinte.
  const iBatiment = indexOu((p) => p.forme === 'sprite' && p.famille === 'batiment');
  const iStructure = indexOu((p) => p.forme === 'sprite'
    && (p.famille === 'defense' || p.famille === 'socle'));
  const iUnite = indexOu((p) => p.forme === 'sprite'
    && (p.famille === 'unite' || p.famille === 'chassis'));
  const iBarre = indexOu((p) => p.couleur === COULEUR_BARRE_PV);
  // Le montage doit porter les trois genres, sans quoi l'ordre ne mesure rien.
  assert.ok(iBatiment > 1, 'aucun bâtiment dans la scène : l\'ordre ne prouve rien');
  assert.ok(iStructure > 1, 'aucune structure dans la scène : l\'ordre ne prouve rien');
  assert.ok(iUnite > 1, 'aucune unité dans la scène : l\'ordre ne prouve rien');
  assert.ok(iBatiment < iStructure, 'bâtiments avant structures');
  assert.ok(iStructure < iUnite, 'structures avant unités');
  assert.ok(iUnite < iBarre, 'unités avant barres');

  // Après un tick, les tireurs ajoutent leurs traits, TOUS en queue de liste.
  tick(etat);
  const apres = listeAffichage(etat, proj, null, 0);
  const traits = apres.filter((p) => p.forme === 'ligne');
  assert.ok(traits.length > 0, 'personne n\'a tiré : le montage ne prouve rien');
  assert.deepEqual(apres.slice(apres.length - traits.length), traits, 'les traits ferment la liste');

  // Deux appels aux mêmes arguments rendent la même liste : la scène est pure.
  assert.deepEqual(listeAffichage(etat, proj, null, 0), apres);

  // Une entité morte ne produit plus rien : on abat le Merlon à la main
  // (hors moteur, sur une copie de travail) et ses 2 primitives disparaissent.
  const merlon = etat.entites.find((e) => e.id === 'merlon');
  merlon.vivant = false;
  const sansMerlon = listeAffichage(etat, proj, null, 0);
  // Le Merlon portait : mur 2 + barre de PV 2 = 4 primitives.
  assert.equal(apres.length - sansMerlon.length, NB_PRIMITIVES.mur + 2);
});

// ---------------------------------------------------------------------------
// T6 — la couleur code la colonne de matrice dominante
// ---------------------------------------------------------------------------

test('T6 — l\'accent est la colonne dominante, dans les trois teintes de la fiche', () => {
  const TEINTES = {
    infanterie: { sombre: '#928E80', clair: '#F5F3E8' },
    vehicule: { sombre: '#8A1E17', clair: '#E43E32' },
    structureOuAviation: { sombre: '#A67018', clair: '#F5B636' },
  };
  const clairsAdmis = new Set(Object.values(TEINTES).map((t) => t.clair));

  // Les 14 unités : l'accent est celui de la colonne dominante, recalculée
  // ici indépendamment, et il appartient aux trois teintes.
  // LOT 4A — la dominante se lit désormais dans `degats`, en PV absolus, et
  // non plus dans une matrice de facteurs. Les 14 dominantes sont les mêmes
  // qu'avant la conversion : aucun accent ne change à l'écran.
  for (const [id, u] of Object.entries(UNITES)) {
    const accent = accentDe('unite', id);
    assert.ok(accent !== null, `${id} : une unité a toujours une table de dégâts`);
    let dominante = COLONNES_DEGATS[0];
    for (const c of COLONNES_DEGATS) if (u.degats[c] > u.degats[dominante]) dominante = c;
    assert.equal(accent.colonne, dominante, `${id} : colonne dominante`);
    assert.deepEqual({ sombre: accent.sombre, clair: accent.clair }, TEINTES[dominante]);
    assert.ok(clairsAdmis.has(accent.clair));
    // La dominante est UNIQUE sur tout le calibrage : aucune égalité de tête,
    // sinon l'accent dépendrait de l'ordre des colonnes.
    const valeurs = COLONNES_DEGATS.map((c) => u.degats[c]);
    assert.equal(valeurs.filter((v) => v === Math.max(...valeurs)).length, 1,
      `${id} : deux colonnes à égalité en tête`);
  }

  // Les 9 défenses : même règle, sur `degats` pour celles qui tirent et sur
  // `degatsFranchissement` pour les deux barrières, qui ne tirent pas mais
  // saignent — et saignent de façon typée. Le Merlon, qui ne fait ni l'un ni
  // l'autre, est le seul sans accent.
  for (const [id, d] of Object.entries(DEFENSES)) {
    const accent = accentDe('defense', id);
    const table = d.degats ?? d.degatsFranchissement ?? null;
    if (table === null) {
      assert.equal(id, 'merlon', 'seul le Merlon ne nuit à personne');
      assert.equal(accent, null);
      continue;
    }
    let dominante = COLONNES_DEGATS[0];
    for (const c of COLONNES_DEGATS) if (table[c] > table[dominante]) dominante = c;
    assert.equal(accent.colonne, dominante, `${id} : colonne dominante`);
    assert.ok(clairsAdmis.has(accent.clair));
  }

  // Les cas nommés par le brief. Perceurs et Bélier, anti-structure en
  // attaque, prennent le JAUNE — la troisième colonne n'a qu'une couleur pour
  // ses deux lectures, structure en attaque et aviation en défense.
  assert.equal(accentDe('unite', 'perceurs').clair, '#F5B636');
  assert.equal(accentDe('unite', 'belier').clair, '#F5B636');
  // Le Guetteur garde le blanc des deux côtés : l'accent ne dépend pas du
  // camp — accentDe ne prend même pas le camp en argument.
  assert.equal(accentDe('unite', 'guetteur').clair, '#F5F3E8');
  // Et la Batterie, anti-aérienne en défense, lit la même 3ᵉ colonne : jaune.
  assert.equal(accentDe('defense', 'batterie').clair, '#F5B636');
  // Les bâtiments ne tuent rien : aucun accent.
  assert.equal(accentDe('batiment', 'gangue'), null);

  // Aucune autre valeur ne sort du module : sur la scène complète d'un raid,
  // toute couleur émise appartient à la palette de la fiche.
  const admises = new Set([
    ...Object.values(PALETTE).filter((v) => typeof v === 'string'),
    ...Object.values(PALETTE.accents).flatMap((t) => [t.sombre, t.clair]),
  ]);
  const etat = creerCombat(montageDeScene());
  const proj = calculerProjection(412, 900);
  // ⚠ UN SPRITE NE PORTE PAS DE COULEUR, ET C'EST NORMAL : ses pixels viennent
  // de l'atlas, pas de la palette. La garde ne les compte donc pas — mais elle
  // ASSERTE qu'elle en a vu, sinon un jour où toute la scène passerait aux
  // sprites elle ne mesurerait plus rien tout en restant verte.
  let peints = 0;
  let sprites = 0;
  for (let t = 0; t < 40 && !etat.termine; t++) {
    tick(etat);
    for (const p of listeAffichage(etat, proj, null, 0)) {
      if (p.forme === 'sprite') {
        assert.equal(p.couleur, undefined, 'un sprite ne doit pas porter de couleur');
        sprites += 1;
        continue;
      }
      assert.ok(admises.has(p.couleur), `teinte hors palette : ${p.couleur}`);
      peints += 1;
    }
  }
  assert.ok(sprites > 0, 'la scène ne porte aucun sprite : le saut ci-dessus cache tout');
  assert.ok(peints > 0, 'la scène ne porte aucune primitive colorée : la garde ne mesure rien');
});

// ---------------------------------------------------------------------------
// T7 — canvas sans canvas
// ---------------------------------------------------------------------------

/** Contexte enregistreur : note chaque appel et chaque affectation de style. */
/**
 * L'atlas des tests : un objet quelconque, parce que l'enregistreur ne décode
 * rien. `executer` ne fait que le passer à `drawImage` — c'est ce qui permet de
 * tester le chemin des sprites sans DOM ni image.
 */
const FAUSSE_IMAGE = { estUneFausseImage: true };
const ATLAS_FACTICE = {
  unite: FAUSSE_IMAGE,
  chassis: FAUSSE_IMAGE,
  tourelle_unite: FAUSSE_IMAGE,
  batiment: FAUSSE_IMAGE,
  terrain: FAUSSE_IMAGE,
  defense: FAUSSE_IMAGE,
  socle: FAUSSE_IMAGE,
};

function creerEnregistreur() {
  const appels = [];
  const enregistreur = { appels };
  for (const methode of ['fillRect', 'strokeRect', 'beginPath', 'arc', 'fill',
    'moveTo', 'lineTo', 'stroke', 'drawImage']) {
    enregistreur[methode] = (...args) => appels.push([methode, ...args]);
  }
  for (const propriete of ['fillStyle', 'strokeStyle', 'lineWidth']) {
    Object.defineProperty(enregistreur, propriete, {
      set(valeur) { appels.push([propriete, valeur]); },
    });
  }
  return enregistreur;
}

test('T7 — canvas2d exécute sans décider : un enregistreur suffit à le prouver', () => {
  const enregistreur = creerEnregistreur();
  executer(enregistreur, [
    { forme: 'rect', x: 1, y: 2, l: 3, h: 4, couleur: '#161914' },
    { forme: 'cadre', x: 5, y: 6, l: 7, h: 8, couleur: '#343A2C', epaisseur: 2 },
    { forme: 'disque', x: 9, y: 10, rayon: 11, couleur: 'rgba(0,0,0,0.31)' },
    { forme: 'ligne', x1: 1, y1: 2, x2: 3, y2: 4, couleur: '#F5B636', epaisseur: 2 },
    // ⚠ LA PRIMITIVE OUVERTE AU LOT UNITÉS-AU-COMBAT. Elle porte son rectangle
    // SOURCE — `sx sy sl sh` — parce que le découpage dans l'atlas est un calcul
    // de position, et que ce module-ci n'en fait aucun : `scene.js` le fait une
    // fois, `canvas2d` recopie les huit nombres dans `drawImage`.
    { forme: 'sprite', famille: 'unite', nom: 'off_j_meute', sx: 64, sy: 0, sl: 64, sh: 64, x: 12, y: 13, l: 14, h: 15 },
  ], { unite: FAUSSE_IMAGE });
  // La séquence exacte, appel pour appel : rect → 2, cadre → 3, disque → 4,
  // ligne → 6, sprite → 1, soit 16 entrées. Ni plus, ni moins, ni réordonnées.
  assert.deepEqual(enregistreur.appels, [
    ['fillStyle', '#161914'], ['fillRect', 1, 2, 3, 4],
    ['strokeStyle', '#343A2C'], ['lineWidth', 2], ['strokeRect', 5, 6, 7, 8],
    ['fillStyle', 'rgba(0,0,0,0.31)'], ['beginPath'], ['arc', 9, 10, 11, 0, 2 * Math.PI], ['fill'],
    ['strokeStyle', '#F5B636'], ['lineWidth', 2], ['beginPath'],
    ['moveTo', 1, 2], ['lineTo', 3, 4], ['stroke'],
    ['drawImage', FAUSSE_IMAGE, 64, 0, 64, 64, 12, 13, 14, 15],
  ]);

  // ⚠ UNE PRIMITIVE `sprite` SANS SON ATLAS LÈVE, ET LE MESSAGE NOMME LA
  // FAMILLE. Une unité invisible est un défaut qu'on doit voir à la première
  // image, pas un trou que personne ne remarque. Le témoin est au-dessus : la
  // MÊME primitive, avec l'atlas, vient de passer.
  const seule = [{ forme: 'sprite', famille: 'unite', nom: 'off_j_meute', sx: 0, sy: 0, sl: 64, sh: 64, x: 0, y: 0, l: 8, h: 8 }];
  assert.throws(() => executer(creerEnregistreur(), seule), /famille d'atlas « unite »/);
  assert.throws(() => executer(creerEnregistreur(), seule, {}), /famille d'atlas « unite »/);
  assert.doesNotThrow(() => executer(creerEnregistreur(), seule, { unite: FAUSSE_IMAGE }));

  // Une forme inconnue lève : l'exécutant ne rattrape pas, il refuse.
  assert.throws(
    () => executer(creerEnregistreur(), [{ forme: 'etoile' }]),
    /forme inconnue « etoile »/,
  );

  // Et sur une scène réelle : autant de fillRect que de primitives rect,
  // autant de strokeRect que de cadres, autant de arc que de disques, autant
  // de stroke que de cadres + lignes... non : stroke ne clôt que les lignes,
  // strokeRect porte les cadres. Compté depuis la liste elle-même.
  const etat = creerCombat(montageDeScene());
  tick(etat);
  const liste = listeAffichage(etat, calculerProjection(412, 900), null, 0);
  const reel = creerEnregistreur();
  executer(reel, liste, ATLAS_FACTICE);
  const compter = (nom) => reel.appels.filter(([n]) => n === nom).length;
  assert.equal(compter('fillRect'), liste.filter((p) => p.forme === 'rect').length);
  assert.equal(compter('strokeRect'), liste.filter((p) => p.forme === 'cadre').length);
  assert.equal(compter('arc'), liste.filter((p) => p.forme === 'disque').length);
  assert.equal(compter('stroke'), liste.filter((p) => p.forme === 'ligne').length);
  // ⚠ ET AUTANT DE `drawImage` QUE DE PRIMITIVES `sprite`. Sans cette ligne, la
  // forme ouverte au lot UNITÉS-AU-COMBAT échapperait au comptage qui fait tout
  // l'intérêt de T7.
  assert.equal(compter('drawImage'), liste.filter((p) => p.forme === 'sprite').length);
  assert.ok(liste.some((p) => p.forme === 'sprite'),
    'la scène ne porte aucun sprite : le comptage ci-dessus ne mesure rien');
});


// ---------------------------------------------------------------------------
// Orientation — où une rangée tombe à l'écran
// ---------------------------------------------------------------------------

test('orientation — la rangée du fond tombe en PREMIÈRE ligne d\'écran', () => {
  // ⚠ L'ALLER-RETOUR NE SUFFIT PAS, ET C'EST LE PIÈGE DE CE TEST. L'identité
  // (`ligne = rangee`) passerait un aller-retour parfait : elle est sa propre
  // réciproque. Ce qu'il faut asserter, c'est la POSITION — que la rangée la
  // plus haute en numéro occupe la ligne 1, et la rangée 1 la dernière ligne.
  assert.equal(ligneEcranDeLaRangee(GRILLE.longueur), 1);
  assert.equal(ligneEcranDeLaRangee(1), GRILLE.longueur);
  // Et que ce ne soit PAS l'identité, sur une rangée qui n'est pas au milieu.
  assert.notEqual(ligneEcranDeLaRangee(2), 2);

  // L'aller-retour, ensuite : la transformation est une involution, donc elle
  // est sa propre inverse, et les deux fonctions doivent l'être aussi.
  for (let rangee = 1; rangee <= GRILLE.longueur; rangee++) {
    assert.equal(rangeeDeLaLigneEcran(ligneEcranDeLaRangee(rangee)), rangee);
    assert.equal(ligneEcranDeLaRangee(rangeeDeLaLigneEcran(rangee)), rangee);
  }
  // Une bijection : dix-huit rangées donnent dix-huit lignes distinctes.
  const lignes = new Set();
  for (let rangee = 1; rangee <= GRILLE.longueur; rangee++) {
    lignes.add(ligneEcranDeLaRangee(rangee));
  }
  assert.equal(lignes.size, GRILLE.longueur);
  assert.equal(Math.min(...lignes), 1);
  assert.equal(Math.max(...lignes), GRILLE.longueur);

  // Hors grille, ça lève des deux côtés : une ligne d'écran inventée
  // désignerait une rangée qui n'existe pas.
  assert.throws(() => ligneEcranDeLaRangee(0), /hors de/);
  assert.throws(() => ligneEcranDeLaRangee(GRILLE.longueur + 1), /hors de/);
  assert.throws(() => rangeeDeLaLigneEcran(0), /hors de/);
  assert.throws(() => rangeeDeLaLigneEcran(GRILLE.longueur + 1), /hors de/);
});

test('orientation — les trois bandes se suivent : base, défense, déploiement', () => {
  // Les bornes viennent de `GRILLE.bandes`, jamais écrites ici. Un changement
  // de découpage doit se propager, pas faire tomber ce test sur des nombres.
  const batiments = ligneEcranDeLaBande(GRILLE.bandes.batiments);
  const defense = ligneEcranDeLaBande(GRILLE.bandes.defense);
  const deploiement = ligneEcranDeLaBande(GRILLE.bandes.deploiement);

  // La base occupe les premières lignes, le déploiement les dernières.
  assert.equal(batiments.premiereLigne, 1);
  assert.equal(deploiement.premiereLigne + deploiement.nbLignes - 1, GRILLE.longueur);

  // Les trois se suivent sans trou ni recouvrement, dans cet ordre.
  assert.equal(defense.premiereLigne, batiments.premiereLigne + batiments.nbLignes);
  assert.equal(deploiement.premiereLigne, defense.premiereLigne + defense.nbLignes);
  assert.equal(
    batiments.nbLignes + defense.nbLignes + deploiement.nbLignes, GRILLE.longueur,
  );

  // ⚠ LES QUATRE FRONTIÈRES, LUES DEPUIS LA TABLE. C'est là que se voit l'erreur
  // qu'on ne verrait pas autrement : calculer la ligne de départ d'une bande
  // depuis sa `premiere` au lieu de sa `derniere` décale chaque bande de sa
  // propre longueur — la défense se poserait sur les bâtiments, et le rail
  // désignerait la mauvaise bande sans que rien ne casse.
  const bandeDe = (rangee) => Object.entries(GRILLE.bandes)
    .find(([, b]) => rangee >= b.premiere && rangee <= b.derniere)[0];
  for (const [avant, apres] of [
    [GRILLE.bandes.deploiement.derniere, GRILLE.bandes.defense.premiere],
    [GRILLE.bandes.defense.derniere, GRILLE.bandes.batiments.premiere],
  ]) {
    assert.notEqual(bandeDe(avant), bandeDe(apres), `${avant}/${apres} : même bande`);
    // À l'écran, la rangée du NUMÉRO SUPÉRIEUR est celle du DESSUS : sa ligne
    // est la plus petite des deux.
    assert.ok(
      ligneEcranDeLaRangee(apres) < ligneEcranDeLaRangee(avant),
      `la frontière ${avant}/${apres} est retournée à l'envers`,
    );
    // Et elles restent contiguës : une frontière ne crée pas d'interstice.
    assert.equal(ligneEcranDeLaRangee(avant) - ligneEcranDeLaRangee(apres), 1);
  }

  // Une bande malformée lève plutôt que de rendre un span négatif.
  assert.throws(() => ligneEcranDeLaBande({ premiere: 10, derniere: 3 }), /bornes inversées/);
  assert.throws(() => ligneEcranDeLaBande(null), /absente ou malformée/);
});

test('orientation — le canvas et la grille CSS placent les rangées PAREIL', () => {
  // ⚠ CE TEST EXISTE PARCE QUE LES DEUX AVAIENT DIVERGÉ. `render/projection.js`
  // place la rangée du fond en tête du canvas depuis le lot 3A — le banc
  // d'essai dessinait donc déjà dans le bon sens. L'écran Chantier, écrit au lot
  // ÉCRAN-CHANTIER, posait ses cases dans l'ordre naturel de la boucle et se
  // retrouvait retourné : déploiement d'abord, base en dernier. Personne ne l'a
  // vu tant que les deux vues n'ont pas été regardées côte à côte.
  //
  // On asserte donc l'ACCORD des deux chemins, pour qu'on ne puisse plus en
  // corriger un seul. Le canvas rend des pixels et la grille des numéros de
  // ligne : ce qui se compare, c'est l'ORDRE.
  const projection = calculerProjection(360, 720);
  let precedentY = -Infinity;
  for (let ligne = 1; ligne <= GRILLE.longueur; ligne++) {
    const rangee = rangeeDeLaLigneEcran(ligne);
    const y = yDeRangee(projection, rangee);
    assert.ok(y > precedentY, `ligne ${ligne} (rangée ${rangee}) : le canvas la place plus haut`);
    precedentY = y;
  }
  // Falsifiable : le montage doit voir de vrais écarts, pas dix-huit zéros.
  assert.ok(
    yDeRangee(projection, 1) - yDeRangee(projection, GRILLE.longueur) > 0,
    'la projection ne sépare pas les rangées',
  );
  // Et les deux extrêmes, nommément : la rangée du fond est la plus proche du
  // bord d'où l'on commence à lire, des deux côtés.
  assert.equal(ligneEcranDeLaRangee(GRILLE.longueur), 1);
  assert.equal(yDeRangee(projection, GRILLE.longueur), projection.margeY);
});
