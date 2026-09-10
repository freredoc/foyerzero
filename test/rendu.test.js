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
  PALETTE, FOND, COULEUR_BARRE_PV,
  classeDe, accentDe, NB_PRIMITIVES, listeAffichage,
} from '../src/render/scene.js';
import { executer } from '../src/render/canvas2d.js';
import { nomDeVariante } from '../src/render/variante.js';
import {
  ligneEcranDeLaRangee, rangeeDeLaLigneEcran, ligneEcranDeLaBande,
} from '../src/render/orientation.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { casesAPortee, porteeQuiTire } from '../src/render/portee.js';
import {
  dureeDArrivee, OPACITE_PLEINE,
  creerArrivees, noterLesArrivees, etatDeLArrivee, arriveesALEcran,
} from '../src/render/arrivee.js';
import { MUR_CASES } from '../src/render/fond.js';

/** La racine du dépôt, pour les gardes qui lisent la SOURCE. */
const RACINE_RENDU = join(dirname(fileURLToPath(import.meta.url)), '..');
import { distanceCarreeMilli, milliDepuisCase, estDansLaGrille, MILLI_PAR_CASE } from '../src/sim/grille.js';

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
  // ⚠⚠ UN COUPLE PAR ENTITÉ DEPUIS LE LOT COLONNE, PLUS UN SEUL NOMBRE.
  // `prendrePositions` ne relevait que `rangeeMilli` au motif écrit en tête de
  // `render/interpolation.js` qu'« une entité ne change jamais de colonne » : le
  // motif est tombé pour la défense, et un instantané à un seul axe ferait
  // TÉLÉPORTER une défenseuse d'une colonne à l'autre entre deux images.
  const precedentes = prendrePositions(etat);
  assert.deepEqual(precedentes, [
    { rangeeMilli: 18_000, colonneMilli: 9000 },
    { rangeeMilli: 2000, colonneMilli: 5000 },
  ]);
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
  let nbColonnesFigees = etat.entites.map((e) => e.colonneMilli);

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
    // AUCUN ATTAQUANT ne change jamais de colonne.
    //
    // ⚠⚠ LA SECONDE MOITIÉ A CHANGÉ DE CIBLE AU LOT COLONNE, ELLE NE S'EST PAS
    // ASSOUPLIE. Elle disait « aucune entité ne change jamais de colonne », et
    // c'était l'invariant du moteur depuis le lot 2A. Ethan l'a renversé pour la
    // DÉFENSE des deux camps le 06/09 ; il tient toujours, entier, pour
    // l'ATTAQUE — et c'est de l'attaque que dépendaient les conclusions de
    // `peutEcraser` et du blocage de colonne. La garde le NOMME désormais, au
    // lieu de le supposer de tout le monde.
    assert.ok(etat.entites.length >= nbColonnesFigees.length, 'une entité a été retirée');
    for (let i = 0; i < nbColonnesFigees.length; i++) {
      const e = etat.entites[i];
      if (e.camp === 'attaque') {
        assert.equal(e.colonneMilli, nbColonnesFigees[i],
          `un ATTAQUANT a changé de colonne sur ${i}`);
      }
      assert.equal(e.indice, i, `indice déplacé sur ${i}`);
    }
    nbColonnesFigees = etat.entites.map((e) => e.colonneMilli);
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
  // ⚠⚠ L'OBSTACLE EST UN SPRITE DEPUIS LE LOT ERGONOMIE, ET CETTE ASSERTION A
  // CHANGÉ DE CIBLE SANS S'ASSOUPLIR — elle en dit plus qu'avant. Elle lisait
  // une teinte, `COULEUR_OBSTACLE`, qui n'existe plus : Ethan, 04/09, « les
  // sprites obstacles Ouvrage ne sont pas placés, c'est les mêmes que le
  // joueur ». Elle lit maintenant le NOM du dessin, donc le type de l'obstacle
  // ET sa variante — un aplat remis à la place la ferait tomber, un mauvais
  // sprite aussi.
  assert.equal(liste[1].forme, 'sprite');
  assert.equal(liste[1].famille, 'terrain');
  assert.equal(liste[1].nom, nomDeVariante('obs_infanterie', 0, 5, 3));

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
  // ⚠ `save`, `translate`, `rotate` ET `restore` ENTRENT AU LOT
  // SPRITES-V2-JOUEUR : une tourelle du joueur est un seul dessin que le rendu
  // TOURNE, plus l'un de seize sprites nommés. L'enregistreur les porte comme
  // les autres — c'est-à-dire qu'ils sont COMPTÉS et ORDONNÉS eux aussi, et
  // qu'un `save` sans son `restore` fera tomber la séquence exacte ci-dessous.
  for (const methode of ['fillRect', 'strokeRect', 'beginPath', 'arc', 'fill',
    'moveTo', 'lineTo', 'stroke', 'drawImage',
    'save', 'translate', 'rotate', 'restore']) {
    enregistreur[methode] = (...args) => appels.push([methode, ...args]);
  }
  // ⚠ `globalAlpha` ENTRE AU LOT SON-ET-ARRIVÉE, 10/09, et il entre comme les
  // trois autres : COMPTÉ et ORDONNÉ. C'est un ÉTAT du contexte, pas un argument
  // de `drawImage` — l'oublier repeindrait en translucide tout ce que la liste
  // dessine ENSUITE —, et c'est la seule façon de le mesurer sans navigateur.
  for (const propriete of ['fillStyle', 'strokeStyle', 'lineWidth', 'globalAlpha']) {
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
    { forme: 'sprite', famille: 'unite', nom: 'off_j_meute', sx: 64, sy: 0, sl: 64, sh: 64, x: 12, y: 13, l: 14, h: 15, angle: 0 },
    // ⚠⚠ LA MÊME PRIMITIVE, TOURNÉE. Elle prouve les deux moitiés de la branche
    // neuve : le contexte est SAUVÉ puis RESTAURÉ autour du seul `drawImage`, et
    // le dessin est recentré — `-l/2, -h/2` après une translation au CENTRE du
    // sprite, jamais `x, y`. C'est ce recentrage qui fait tourner la tourelle
    // autour de son pivot au lieu de la faire décrire un arc de cercle.
    { forme: 'sprite', famille: 'unite', nom: 'off_j_meute', sx: 64, sy: 0, sl: 64, sh: 64, x: 12, y: 13, l: 14, h: 16, angle: 90 },
  ], { unite: FAUSSE_IMAGE });
  // La séquence exacte, appel pour appel : rect → 2, cadre → 3, disque → 4,
  // ligne → 6, sprite droit → 1, sprite tourné → 5. Ni plus, ni moins, ni
  // réordonnées.
  assert.deepEqual(enregistreur.appels, [
    ['fillStyle', '#161914'], ['fillRect', 1, 2, 3, 4],
    ['strokeStyle', '#343A2C'], ['lineWidth', 2], ['strokeRect', 5, 6, 7, 8],
    ['fillStyle', 'rgba(0,0,0,0.31)'], ['beginPath'], ['arc', 9, 10, 11, 0, 2 * Math.PI], ['fill'],
    ['strokeStyle', '#F5B636'], ['lineWidth', 2], ['beginPath'],
    ['moveTo', 1, 2], ['lineTo', 3, 4], ['stroke'],
    ['drawImage', FAUSSE_IMAGE, 64, 0, 64, 64, 12, 13, 14, 15],
    ['save'], ['translate', 19, 21], ['rotate', Math.PI / 2],
    ['drawImage', FAUSSE_IMAGE, 64, 0, 64, 64, -7, -8, 14, 16], ['restore'],
  ]);

  // ⚠ ET UN ANGLE NUL NE TOUCHE PAS AU CONTEXTE DU TOUT — c'est ce que la
  // première des deux primitives vient de montrer, et c'est délibéré : sinon
  // toute la scène paierait un `save`/`restore` par primitive pour une
  // transformation identité. Un `sprite` sans champ `angle` se dessine comme un
  // angle nul, ce qui laisse `listeDuFond` et le banc intacts.
  const droit = creerEnregistreur();
  executer(droit, [{ forme: 'sprite', famille: 'unite', nom: 'x', sx: 0, sy: 0, sl: 1, sh: 1, x: 0, y: 0, l: 1, h: 1 }],
    { unite: FAUSSE_IMAGE });
  assert.deepEqual(droit.appels.map(([n]) => n), ['drawImage']);

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

// ---------------------------------------------------------------------------
// ÉD T6 et T7 — le rayon d'attaque, lot ÉCRAN-DÉFENSE.
//
// ⚠⚠ ILS VIVENT ICI ET NON DANS `chantier.test.js`, ET C'EST LE PARTAGE DU
// DÉPÔT. `render/portee.js` est PUR : il ne connaît ni case du DOM, ni classe,
// ni écran. Ce que l'écran en fait — poser `a-portee` sur la case, et rien
// d'autre — se mesure là-bas, sur le document monté.
// ---------------------------------------------------------------------------

/**
 * L'ensemble des cases à portée, recalculé à la main sur TOUTE la grille.
 *
 * ⚠ IL BALAIE LES 18 × 9 CASES, LÀ OÙ LE MODULE BORNE SON BALAYAGE À UN CARRÉ.
 * C'est ce qui rend la comparaison utile : une borne trop serrée retirerait des
 * cases que ce témoin-ci trouve encore.
 */
function aPorteeALaMain(depuis, portee, porteeMini) {
  const porteeCarree = Math.round(portee * 1000) ** 2;
  const miniCarree = Math.round(porteeMini * 1000) ** 2;
  const cles = new Set();
  for (let rangee = 1; rangee <= GRILLE.longueur; rangee += 1) {
    for (let colonne = 1; colonne <= GRILLE.largeur; colonne += 1) {
      if (!estDansLaGrille(rangee, colonne)) continue;
      const d2 = distanceCarreeMilli(
        milliDepuisCase(depuis.rangee), milliDepuisCase(depuis.colonne),
        milliDepuisCase(rangee), milliDepuisCase(colonne),
      );
      if (d2 > porteeCarree || d2 < miniCarree) continue;
      cles.add(`${rangee};${colonne}`);
    }
  }
  return cles;
}

const clesDe = (cases) => new Set(cases.map((c) => `${c.rangee};${c.colonne}`));

test('ÉD T6 — le rayon est celui du moteur, sur DEUX portées et depuis un bord', () => {
  // ⚠⚠ LE BRIEF EXIGE DEUX PORTÉES, ET IL A RAISON : « un test sur une seule
  // portée passerait sur un rayon écrit en dur ». Les deux retenues sont la
  // casemate (2,5 case, sans trou) et la faucheuse (5,5 case, trou de 3,5) —
  // elles ne partagent ni le rayon, ni le nombre de cases, ni la forme.
  const montages = [
    { id: 'casemate', ligne: DEFENSES.casemate },
    { id: 'faucheuse', ligne: DEFENSES.faucheuse },
  ];
  const tailles = new Set();
  for (const { id, ligne } of montages) {
    const portees = porteeQuiTire(ligne);
    assert.ok(portees !== null, `${id} ne tire pas : le montage ne mesure rien`);
    // ⚠ DEUX ORIGINES, DONT UNE CONTRE LE BORD. Au milieu de la grille, une
    // borne fausse d'une case se voit ; contre un bord, c'est le ROGNAGE qui se
    // mesure — un module qui rendrait des cases hors grille passerait l'autre.
    for (const depuis of [{ rangee: 6, colonne: 5 }, { rangee: 3, colonne: 1 }]) {
      const rendues = clesDe(casesAPortee(depuis, portees));
      const attendues = aPorteeALaMain(depuis, ligne.portee, ligne.porteeMini ?? 0);
      assert.ok(attendues.size > 0, `${id} en ${depuis.rangee};${depuis.colonne} ne couvre rien`);
      assert.deepEqual([...rendues].sort(), [...attendues].sort(),
        `${id} en ${depuis.rangee};${depuis.colonne} : le rayon diverge du moteur`);
      // Et rien ne sort de la grille.
      for (const c of casesAPortee(depuis, portees)) {
        assert.ok(estDansLaGrille(c.rangee, c.colonne),
          `${id} marque ${c.rangee};${c.colonne}, hors grille`);
      }
      tailles.add(`${id}:${rendues.size}`);
    }
  }
  // ⚠ LES DEUX PORTÉES NE RENDENT PAS LE MÊME COMPTE : sans ça, les deux moitiés
  // du test mesureraient la même chose et « deux portées » ne vaudrait rien.
  const casemate = clesDe(casesAPortee({ rangee: 6, colonne: 5 },
    porteeQuiTire(DEFENSES.casemate)));
  const faucheuse = clesDe(casesAPortee({ rangee: 6, colonne: 5 },
    porteeQuiTire(DEFENSES.faucheuse)));
  assert.notEqual(casemate.size, faucheuse.size,
    'les deux portées couvrent le même nombre de cases : le test ne discrimine rien');
  // ⚠⚠ ET LE DISQUE N'EST PAS LE CARRÉ, MESURÉ. Un rayon écrit en Tchebychev —
  // la faute la plus probable — rendrait 25 cases pour la casemate au milieu de
  // la grille ; le disque euclidien en rend 21. Sans cette ligne, un carré
  // passerait tant que les deux témoins seraient calculés pareil.
  const carre = new Set();
  for (let r = 6 - 2; r <= 6 + 2; r += 1) {
    for (let c = 5 - 2; c <= 5 + 2; c += 1) carre.add(`${r};${c}`);
  }
  assert.notEqual(carre.size, casemate.size,
    'le disque et le carré rendent le même compte : le montage ne les sépare pas');
});

test('ÉD T6 bis — la conversion en milli-cases est celle du moteur, pas une seconde', () => {
  // ⚠⚠ C'EST LA TROUVAILLE DE LA RELECTURE HOSTILE DU §10 : un endroit où
  // l'écran RECALCULAIT un nombre que le moteur détient. `casesAPortee` faisait
  // `Math.round(portee × 1000)` ; `creerCombat` fait `enEntier(u.portee, MILLE)`.
  // Deux conversions de la même grandeur, et elles ne rendent pas la même chose.
  const source = readFileSync(join(RACINE_RENDU, 'src', 'render', 'portee.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  assert.ok(!/1000/.test(source),
    'le module réécrit le millier au lieu de nommer `MILLI_PAR_CASE`');
  assert.ok(!/Math\.round/.test(source),
    'le module arrondit lui-même une portée que le moteur convertit déjà');
  assert.match(source, /enEntier\(/, 'le module ne passe plus par la conversion du moteur');

  // ⚠ ET LA DIFFÉRENCE EST OBSERVABLE, pas seulement écrite. `Math.round`
  // accepte une portée de 2,5001 et l'arrondit EN SILENCE ; `enEntier` lève en
  // nommant la table fautive. Sans cette moitié, un `Math.round` réécrit sous
  // un autre nom passerait le balayage de source ci-dessus.
  assert.throws(
    () => casesAPortee({ rangee: 6, colonne: 5 }, { portee: 2.5001, porteeMini: 0 }),
    /portee\.portee/,
    'une portée qui n\'est pas un multiple du milli passe en silence',
  );
  // Et une portée honnête, elle, passe : la garde n'est pas un mur.
  assert.ok(casesAPortee({ rangee: 6, colonne: 5 }, { portee: 2.5, porteeMini: 0 }).length > 0);
});

test('ÉD T7 — une artillerie porte son trou, et une tourelle n\'en a pas', () => {
  // ⚠⚠ LA PORTÉE MINIMALE EST UNE RÈGLE DU MOTEUR, PAS UNE COQUETTERIE :
  // `tir` exige `d2 >= porteeMiniCarree`, donc une faucheuse ne touche RIEN de
  // ce qui lui colle dessus. Peindre un disque plein promettrait un tir qui
  // n'aura pas lieu — c'est exactement ce que le §3 du brief demande de traiter.
  const depuis = { rangee: 6, colonne: 5 };
  const artillerie = clesDe(casesAPortee(depuis, porteeQuiTire(DEFENSES.faucheuse)));
  const tourelle = clesDe(casesAPortee(depuis, porteeQuiTire(DEFENSES.casemate)));

  // Sa propre case : la tourelle la couvre, l'artillerie non.
  assert.ok(tourelle.has('6;5'), 'la tourelle ne couvre plus sa propre case');
  assert.ok(!artillerie.has('6;5'), 'l\'artillerie couvre sa propre case : le trou a disparu');

  // ⚠ ET LE TROU N'EST PAS QU'UNE CASE — il vaut 3,5 cases de rayon. Le compter
  // est ce qui fait tomber un module qui n'exclurait que le centre.
  const trou = [];
  for (let r = 1; r <= GRILLE.longueur; r += 1) {
    for (let c = 1; c <= GRILLE.largeur; c += 1) {
      const d2 = distanceCarreeMilli(
        milliDepuisCase(depuis.rangee), milliDepuisCase(depuis.colonne),
        milliDepuisCase(r), milliDepuisCase(c),
      );
      if (d2 < 3500 ** 2) trou.push(`${r};${c}`);
    }
  }
  assert.ok(trou.length > 10, `le trou ne fait que ${trou.length} cases : le montage est trop petit`);
  for (const cle of trou) {
    assert.ok(!artillerie.has(cle), `${cle} est marquée alors qu'elle est dans le trou`);
  }
  // Et le trou est bien CREUSÉ dans quelque chose : la couronne existe.
  assert.ok(artillerie.size > 0, 'l\'artillerie ne couvre plus rien du tout');

  // ⚠⚠ ET « QUI TIRE » SE MESURE ICI AUSSI, PARCE QUE C'EST LA MÊME FONCTION.
  // Un Mur n'a pas de table de dégâts ; une Ronce a une portée de 1 et ne tire
  // JAMAIS — elle franchit. Les deux rendent `null`, et un rayon autour d'elles
  // promettrait un tir qui n'existe pas.
  assert.equal(porteeQuiTire(DEFENSES.merlon), null, 'le Mur s\'est mis à tirer');
  assert.equal(porteeQuiTire(DEFENSES.ronce), null, 'la Ronce s\'est mise à tirer');
  assert.equal(porteeQuiTire(DEFENSES.herse), null, 'la Herse s\'est mise à tirer');
  assert.equal(porteeQuiTire(null), null);
  assert.equal(porteeQuiTire(undefined), null);
  // ⚠ ET LA GARDE N'EST PAS VACUEUSE : les huit unités de garnison tirent, elles.
  const tirent = Object.values(UNITES)
    .filter((u) => u.defense?.present)
    .filter((u) => porteeQuiTire(u) !== null);
  assert.equal(tirent.length, 8,
    `${tirent.length} unités de garnison sur 8 tirent : le prédicat refuse trop`);
  // Et le prédicat mord bien sur la table de dégâts, pas seulement sur la portée.
  assert.equal(porteeQuiTire({ portee: 3, porteeMini: 0, degats: { infanterie: 0, vehicule: 0, structureOuAviation: 0 } }),
    null, 'une pièce à portée non nulle et sans dégât se met à tirer');
  assert.ok(COLONNES_DEGATS.length === 3);
});

// ---------------------------------------------------------------------------
// SB T4 / SB T5 — l'arrivée fantôme des unités (lot SON-ET-ARRIVÉE, 10/09).
//
// Ethan : « Lors des raids faire apparaître les unités une case en dessous
// fantôme pour qu'on voit les véhicules arrivés pour pas qu'ils apparaissent
// directement sur la bande du bas. »
// ---------------------------------------------------------------------------

/** Un montage à UNE unité d'assaut, pour que « le sprite de l'attaquant » ne
 *  soit pas ambigu. Le Fendeur est un blindé : c'est le « véhicule » du point. */
function montageDArrivee(vagues = [[{ id: 'fendeur', colonne: 4 }]]) {
  return {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [{ id: 'gangue', rangee: 11, colonne: 5 }],
    defenseurs: [{ id: 'merlon', rangee: 3, colonne: 4 }],
    vagues,
    modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
  };
}

/** La projection du raid, à la géométrie mesurée du S25 FE en plein cadre. */
function projectionDuRaid() {
  return calculerProjection(1080, 2160, MUR_CASES, { lignesVisibles: GRILLE.longueur + MUR_CASES });
}

test('SB T4 — l\'arrivée est une rampe monotone qui tombe juste aux deux bouts', () => {
  const arrivees = creerArrivees();
  const combat = creerCombat(montageDArrivee());
  const attaquant = combat.entites.find((e) => e.camp === 'attaque');
  assert.ok(attaquant !== undefined, 'le montage ne porte aucun attaquant');

  noterLesArrivees(arrivees, combat, 0);

  // ⚠⚠ LES INSTANTS SE DÉRIVENT DE LA DURÉE, ILS NE SE RETAPENT PLUS — lot
  // ARRIVÉE-CARTE-ET-BUILD, 10/09. Elle valait `ARRIVEE_MS = 400` pour tout le
  // monde ; elle vaut désormais le temps que CETTE unité met à franchir une
  // case. Le montage monte un `fendeur`, donc **1 111 ms** — et le test le
  // DEMANDE plutôt que de l'écrire, sans quoi il figerait un roster.
  const duree = dureeDArrivee(attaquant);
  const instants = [0, Math.round(duree / 4), Math.round(duree / 2),
    Math.round((3 * duree) / 4), duree, duree + 1];
  const releve = instants.map((t) => etatDeLArrivee(arrivees, attaquant.indice, t));

  // ⚠ LA RAMPE PART D'UNE CASE ENTIÈRE ET TOMBE EXACTEMENT SUR ZÉRO. Une rampe
  // qui manquerait le zéro laisserait l'unité posée sous sa case pour toujours.
  assert.equal(releve[0].decalageMilli, MILLI_PAR_CASE, 'l\'unité ne part pas d\'une case');
  assert.equal(releve[4].decalageMilli, 0, 'l\'unité n\'arrive pas exactement sur sa case');
  assert.equal(releve[5], null, 'l\'arrivée ne finit jamais');

  // Strictement décroissant sur les cinq premiers : une rampe plate passerait
  // les deux égalités de bout.
  for (let i = 1; i < 5; i += 1) {
    assert.ok(releve[i].decalageMilli < releve[i - 1].decalageMilli,
      `décalage non décroissant entre ${instants[i - 1]} et ${instants[i]} ms`);
  }

  // ⚠⚠ ET IL N'Y A PLUS D'OPACITÉ DU TOUT — Ethan, 10/09 : « Ne pas faire de
  // fantôme. » Ce test exigeait 350 ‰ au départ et 1 000 ‰ à l'arrivée ; le
  // champ n'existe plus, et l'assertion est **retournée** : elle exige
  // désormais son ABSENCE. Une opacité qui reviendrait, à quelque valeur que ce
  // soit, la fait tomber.
  for (const e of releve.slice(0, 5)) {
    assert.deepEqual(Object.keys(e), ['decalageMilli'],
      `l'arrivée rend autre chose qu'un décalage : ${Object.keys(e).join(', ')}`);
  }

  // ⚠ EN ENTIERS SUR TOUTE LA PLAGE — pas seulement aux instants ronds : un
  // flottant ferait diverger deux exécutions de la même image.
  for (let t = 0; t <= duree; t += 7) {
    const e = etatDeLArrivee(arrivees, attaquant.indice, t);
    assert.ok(Number.isInteger(e.decalageMilli), `rampe non entière à ${t} ms`);
    assert.ok(e.decalageMilli >= 0 && e.decalageMilli <= MILLI_PAR_CASE, `décalage hors case à ${t} ms`);
  }

  // ⚠ UN INSTANT ANTÉRIEUR AU STAMP REND LE DÉPART, il ne lève pas : le
  // pas-à-pas peut redessiner le même instant, et l'unité doit rester dans
  // sa case plutôt que de sauter au-delà.
  assert.equal(etatDeLArrivee(arrivees, attaquant.indice, -50).decalageMilli, MILLI_PAR_CASE);

  // Une entité jamais notée n'arrive pas.
  assert.equal(etatDeLArrivee(arrivees, 9999, 0), null);

  // ⚠⚠ LES DEUX CONDITIONS DE `arrive` SE MESURENT SUR UN ÉTAT FORGÉ, ET IL
  // FAUT DIRE POURQUOI. Sur un vrai combat elles se couvrent l'une l'autre :
  // mesuré sur douze graines et quatre vagues, **les 60 attaquants naissent
  // tous aux rangées 1 et 2**, et les défenseurs naissent tous hors de cette
  // bande. Retirer l'une ou l'autre ne fait donc tomber AUCUN montage de
  // combat — vérifié par falsification, les deux sont muettes. Un état forgé
  // est la seule façon de les séparer, et c'est l'idiome que le dépôt emploie
  // déjà pour un cas inatteignable (`F-J T5`, le `parVoisin` monté à la main).
  // ⚠⚠ LES ENTITÉS FORGÉES PORTENT UN `id`, ET C'EST LE LOT ARRIVÉE-CARTE-ET-BUILD
  // QUI L'A EXIGÉ. `noterLesArrivees` contracte désormais une DURÉE au stamp, et
  // la durée se lit dans `UNITES[id].vitesse` : une entité forgée sans
  // identifiant fait lever `dureeDArrivee`, ce qui est le bon comportement — ce
  // qui ne roule pas n'arrive pas. Le montage le donne donc, et c'est un
  // identifiant RÉEL du roster, jamais un nom inventé : le prendre au hasard
  // ferait passer ce test sur une table que personne ne lit.
  const forge = (entites) => ({
    entites: entites.map((e, indice) => ({ indice, id: 'fendeur', ...e })),
  });
  const rampes = (entites) => {
    const a = creerArrivees();
    noterLesArrivees(a, forge(entites), 0);
    return forge(entites).entites.map((e) => etatDeLArrivee(a, e.indice, 0) !== null);
  };

  // Un attaquant dans la bande de déploiement arrive ; un DÉFENSEUR de la même
  // rangée, non. C'est la condition de CAMP, et elle seule.
  assert.deepEqual(rampes([
    { camp: 'attaque', rangeeMilli: 1000 },
    { camp: 'defense', rangeeMilli: 1000 },
    { camp: 'attaque', rangeeMilli: 2000 },
    { camp: 'defense', rangeeMilli: 2000 },
  ]), [true, false, true, false], 'la condition de camp ne mord pas');

  // ⚠ ET UN ATTAQUANT NÉ HORS DE LA BANDE N'ARRIVE PAS — c'est la condition de
  // RANGÉE. Elle est VACUEUSE aujourd'hui : aucun chemin du moteur ne crée un
  // attaquant ailleurs qu'aux rangées 1 et 2, et c'est écrit dans
  // `render/arrivee.js`. Elle tiendra le jour où un renfort, un largage ou une
  // pièce créée en cours de combat naîtrait au milieu du terrain — et cette
  // ligne-ci est ce qui l'empêchera de monter du bas de l'écran.
  const bande = GRILLE.bandes.deploiement;
  assert.deepEqual(rampes([
    { camp: 'attaque', rangeeMilli: bande.premiere * 1000 },
    { camp: 'attaque', rangeeMilli: (bande.derniere + 1) * 1000 },
    { camp: 'attaque', rangeeMilli: 11_000 },
    { camp: 'attaque', rangeeMilli: 0 },
  ]), [true, false, false, false], 'la condition de rangée ne mord pas');
});

test('SB T5 — l\'unité arrivée est dessinée PLUS BAS que sa case, puis dessus', () => {
  const projection = projectionDuRaid();
  const combat = creerCombat(montageDArrivee());
  const attaquant = combat.entites.find((e) => e.camp === 'attaque');
  const arrivees = creerArrivees();
  noterLesArrivees(arrivees, combat, 0);

  /** Le `y` du sprite de l'attaquant dans la liste, à cet instant. */
  const yDuSprite = (maintenantMs) => {
    const liste = listeAffichage(combat, projection, null, 0, null, 0, null,
      arriveesALEcran(arrivees, maintenantMs));
    const siens = liste.filter((p) => p.forme === 'sprite' && p.nom.startsWith('off_j_'));
    assert.ok(siens.length > 0, 'aucun sprite d\'attaquant dans la liste');
    return Math.min(...siens.map((p) => p.y));
  };

  // La case de l'attaquant, telle que la projection la pose — c'est la VALEUR
  // de référence, jamais une présence.
  const yDeSaCase = yDeRangeeMilli(projection, attaquant.rangeeMilli);

  // ⚠⚠ AU TICK D'APPARITION, IL EST PLUS BAS — donc `y` PLUS GRAND, l'axe des y
  // descendant quand la rangée monte. Mesuré sur l'arbre intact avant le lot :
  // les deux valeurs étaient ÉGALES, et c'est très exactement le défaut
  // qu'Ethan décrit — l'unité apparaît directement sur la bande du bas.
  assert.ok(yDuSprite(0) > yDeSaCase,
    `l'unité apparaît directement sur sa case : y = ${yDuSprite(0)}, case = ${yDeSaCase}`);

  // Et d'une CASE ENTIÈRE, pas d'un pixel : le décalage vaut `tailleCase`.
  assert.equal(yDuSprite(0) - yDeSaCase, projection.tailleCase,
    'le fantôme ne part pas d\'une case entière sous sa case');

  // ⚠ LA MONTÉE EST MONOTONE À L'ÉCRAN AUSSI, pas seulement dans la rampe pure.
  const duree = dureeDArrivee(attaquant);
  const milieu = Math.round(duree / 2);
  assert.ok(yDuSprite(milieu) > yDeSaCase && yDuSprite(milieu) < yDuSprite(0),
    'la montée n\'est pas monotone');

  // ⚠⚠ ET À LA FIN IL EST EXACTEMENT SUR SA CASE — l'égalité, pas un voisinage.
  // ⚠ L'ÉCHÉANCE SE DEMANDE, ELLE NE S'ÉCRIT PLUS : elle valait `ARRIVEE_MS`
  // pour tout le monde, elle vaut désormais ce que CETTE unité a contracté.
  assert.equal(yDuSprite(duree), yDeSaCase, 'l\'unité ne se pose pas sur sa case');
  assert.equal(yDuSprite(duree + 1), yDeSaCase, 'l\'unité rebouge après son arrivée');
  assert.equal(yDuSprite(duree * 2), yDeSaCase, 'l\'unité rebouge longtemps après son arrivée');

  // ⚠⚠ ET LE SPRITE EST PLEIN DU DÉBUT À LA FIN — Ethan, 10/09 : « Ne pas faire
  // de fantôme. » Cette assertion est **RETOURNÉE, pas retirée** : elle exigeait
  // `OPACITE_ARRIVEE` pendant la montée et `OPACITE_PLEINE` après, c'est-à-dire
  // très exactement le fantôme qu'Ethan fait disparaître. Elle exige maintenant
  // la pleine opacité **aux deux bouts et au milieu** — ce qui est plus difficile
  // à obtenir par accident qu'une valeur qui varie.
  const alphaAu = (maintenantMs) => listeAffichage(combat, projection, null, 0, null, 0, null,
    arriveesALEcran(arrivees, maintenantMs))
    .filter((p) => p.forme === 'sprite' && p.nom.startsWith('off_j_'))
    .map((p) => p.alpha);
  for (const t of [0, milieu, duree, duree + 1]) {
    assert.deepEqual([...new Set(alphaAu(t))], [OPACITE_PLEINE],
      `l'unité n'est pas à pleine opacité à ${t} ms : le fantôme est revenu`);
  }

  // ⚠ LE DÉFENSEUR ET LE BÂTIMENT NE BOUGENT PAS D'UN PIXEL, eux : le fantôme
  // ne vaut que pour ce qui ARRIVE, et un décalage qui fuirait sur toute la
  // scène ferait descendre la base entière pendant quatre dixièmes de seconde.
  const yDesAutres = (maintenantMs) => listeAffichage(combat, projection, null, 0, null, 0, null,
    arriveesALEcran(arrivees, maintenantMs))
    .filter((p) => p.forme === 'sprite' && !p.nom.startsWith('off_j_'))
    .map((p) => `${p.nom}:${p.y}`);
  assert.deepEqual(yDesAutres(0), yDesAutres(duree + 1),
    'l\'arrivée a déplacé autre chose que celui qui arrive');
});

// ---------------------------------------------------------------------------
// SB T6 — `globalAlpha` est posé, puis REMIS À UN
// ---------------------------------------------------------------------------

test('SB T6 — un sprite translucide ne laisse pas le contexte translucide', () => {
  const enregistreur = creerEnregistreur();
  const spriteNu = (alpha, angle = 0) => ({
    forme: 'sprite', famille: 'unite', nom: 'off_j_meute',
    sx: 64, sy: 0, sl: 64, sh: 64, x: 12, y: 13, l: 14, h: 15, angle, alpha,
  });

  executer(enregistreur, [spriteNu(400)], ATLAS_FACTICE);
  const ecritures = enregistreur.appels.filter(([m]) => m === 'globalAlpha').map(([, v]) => v);

  // ⚠⚠ LA DERNIÈRE ÉCRITURE VAUT UN, ET C'EST TOUT L'OBJET DE CE TEST. Un
  // `globalAlpha` posé et non remis repeindrait la moitié de la scène en
  // translucide — barres de vie et traits de tir compris —, et **aucun test sans
  // navigateur ne le verrait** : la liste d'affichage serait juste, seule
  // l'image serait fausse.
  assert.deepEqual(ecritures, [0.4, 1],
    'le contexte n\'est pas rendu opaque après un sprite translucide');

  // ⚠ ET LE MILLIÈME EST TRADUIT, PAS RECOPIÉ : 400 ‰ vaut 0,4 sur le contexte.
  assert.equal(ecritures[0], 0.4);

  // ⚠⚠ LA MÊME CHOSE AVEC UNE ROTATION, ET C'EST LE CAS QUI PIÈGE. `save`
  // capture `globalAlpha` avec le reste du contexte, donc `restore` le REMET à
  // la valeur translucide qu'on venait de poser : remettre l'opacité AVANT le
  // `restore` la laisserait à 0,4 pour toute la suite de la liste. L'ordre des
  // écritures le dit.
  const tournant = creerEnregistreur();
  executer(tournant, [spriteNu(400, 90)], ATLAS_FACTICE);
  const sequence = tournant.appels
    .filter(([m]) => ['globalAlpha', 'save', 'restore', 'drawImage'].includes(m))
    .map(([m, v]) => (m === 'globalAlpha' ? `globalAlpha=${v}` : m));
  assert.deepEqual(sequence,
    ['globalAlpha=0.4', 'save', 'drawImage', 'restore', 'globalAlpha=1'],
    'l\'opacité est remise avant le `restore`, qui la défait');

  // ⚠ UN SPRITE OPAQUE NE TOUCHE PAS AU CONTEXTE DU TOUT, exactement comme un
  // angle nul : sinon la scène entière paierait deux écritures par primitive
  // pour une valeur qu'elle a déjà.
  for (const alpha of [undefined, 1000]) {
    const muet = creerEnregistreur();
    executer(muet, [spriteNu(alpha)], ATLAS_FACTICE);
    assert.deepEqual(muet.appels.filter(([m]) => m === 'globalAlpha'), [],
      `un sprite à alpha ${alpha} écrit sur le contexte`);
  }

  // ⚠⚠ ET LE CONTEXTE REDEVIENT OPAQUE ENTRE DEUX PRIMITIVES, pas seulement à
  // la fin : c'est ce qui garantit qu'un sprite translucide ne teinte pas celui
  // qui le suit dans la MÊME liste.
  const deux = creerEnregistreur();
  executer(deux, [spriteNu(350), spriteNu(1000)], ATLAS_FACTICE);
  assert.deepEqual(deux.appels.filter(([m]) => m === 'globalAlpha').map(([, v]) => v),
    [0.35, 1], 'le second sprite hérite de l\'opacité du premier');
});

test('SB T5 bis — la passagère monte AVEC son porteur, et ne remonte pas en débarquant', () => {
  // ⚠⚠ CE MONTAGE EST EXIGÉ PAR LE BRIEF, ET IL MESURE CE QU'ON NE DOIT PAS
  // DEVINER. `sim/combat.js` fait entrer une unité EMBARQUÉE avec son porteur et
  // ne la DÉBARQUE qu'au franchissement de la ligne : si le fantôme la reprenait
  // à ce moment-là, elle monterait du bas de l'écran jusqu'au milieu du terrain.
  // ⚠ LA COLONNE DU PORTEUR EST LIBRE, ET C'EST LE MONTAGE QUI LE DIT. Le
  // montage d'arrivée ordinaire pose sa Gangue en colonne 5, rangée 11 : le
  // porteur s'y arrête et ne franchit jamais la ligne, donc la passagère ne
  // débarque pas et le test mesurerait le contraire de ce qu'il annonce. On
  // dégage donc sa colonne — la Gangue va au coin, hors de son chemin.
  const combat = creerCombat({
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [{ id: 'gangue', rangee: 18, colonne: 1 }],
    defenseurs: [],
    vagues: [[
      { id: 'ratisseur', colonne: 5, rangee: 2 },
      { id: 'meute', colonne: 5, rangee: 2, embarquee: true },
    ]],
    modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
  });
  const arrivees = creerArrivees();
  noterLesArrivees(arrivees, combat, 0);

  const passagere = combat.entites.find((e) => e.embarquee === true);
  assert.ok(passagere !== undefined, 'montage : aucune passagère embarquée');
  const porteur = combat.entites[passagere.porteurIndice];
  assert.equal(porteur.id, 'ratisseur', 'montage : la passagère ne suit pas son porteur');

  // ⚠⚠ À LA NAISSANCE, ILS MONTENT ENSEMBLE — LA MÊME RAMPE, AU NOMBRE PRÈS.
  // `visible` de `render/scene.js` vaut `e.vivant && !e.sorti` : il ne regarde
  // PAS `embarquee`, donc la passagère EST dessinée, à la case de son porteur.
  // L'exclure du fantôme la ferait apparaître à pleine opacité sur la case
  // d'arrivée pendant que son porteur, une case plus bas, monte encore.
  assert.deepEqual(etatDeLArrivee(arrivees, passagere.indice, 0),
    etatDeLArrivee(arrivees, porteur.indice, 0),
    'la passagère et son porteur ne montent pas ensemble');

  // On fait tourner jusqu'au débarquement, en notant à chaque tick comme le fait
  // la boucle d'images. À ×1, un tick vaut 100 ms de temps réel.
  let tickDuDebarquement = null;
  for (let t = 1; t <= 200 && tickDuDebarquement === null; t += 1) {
    tick(combat);
    noterLesArrivees(arrivees, combat, t * 100);
    if (passagere.embarquee === false) tickDuDebarquement = t;
  }
  assert.ok(tickDuDebarquement !== null, 'montage : la passagère n\'a jamais débarqué');

  // ⚠⚠ ET AU DÉBARQUEMENT ELLE N'A PLUS AUCUNE RAMPE. La marge se DEMANDE
  // désormais, elle ne s'écrit plus : la montée durait 400 ms pour tout le monde,
  // elle vaut ce que LA PASSAGÈRE met à franchir une case — lot
  // ARRIVÉE-CARTE-ET-BUILD, 10/09. C'est la borne la plus serrée qui compte, et
  // c'est celle-ci : une montée plus longue mordrait sur le débarquement.
  //
  // ⚠ ET LE FACTEUR QUATRE EST LA VITESSE MAXIMALE DU SIMULATEUR : à ×4, cent
  // millisecondes de temps réel valent quatre ticks, donc le débarquement arrive
  // quatre fois plus tôt en temps réel pendant que la montée, elle, ne raccourcit
  // pas. C'est le pire des trois régimes.
  const monteeDeLaPassagere = dureeDArrivee(passagere);
  assert.ok(tickDuDebarquement * 100 > monteeDeLaPassagere * 4,
    `débarquement au tick ${tickDuDebarquement} : la marge sur la montée `
    + `(${monteeDeLaPassagere} ms) est trop mince à ×4`);
  assert.equal(etatDeLArrivee(arrivees, passagere.indice, tickDuDebarquement * 100), null,
    'la passagère remonte du bas de l\'écran en débarquant');

  // ⚠ ET ELLE DÉBARQUE BIEN LOIN DE LA BANDE DE DÉPLOIEMENT — sans quoi le test
  // serait vert parce que le montage ne mesure rien.
  assert.ok(passagere.rangeeMilli / 1000 > GRILLE.bandes.deploiement.derniere + 5,
    'montage : la passagère débarque au ras de sa bande de départ');
});

// ---------------------------------------------------------------------------
// AC T2 / AC T3 / AC T4 — l'arrivée après « ne pas faire de fantôme »
// ---------------------------------------------------------------------------
//
// Ethan, 10/09 : « Ils arrivent trop rapidement, et on les voit spawn. Ils
// doivent spawn en dessous et arriver », et **« Ne pas faire de fantôme. »**

test('AC T2 — plus aucune entité ne se dessine à une opacité partielle', () => {
  // ⚠⚠ LA MESURE PORTE SUR LA LISTE ENTIÈRE, PAS SUR CELUI QUI ARRIVE. `SB T5`
  // garde déjà l'attaquant à ses quatre instants ; ce test-ci prend **tous** les
  // sprites de la scène, au tick d'apparition d'une vague — l'instant où le
  // fantôme existait —, et exige la pleine opacité sur chacun. C'est la seule
  // forme qui attrape une `OPACITE_ARRIVEE` restée branchée AILLEURS que sur
  // l'unité qui monte : sur son ombre, sur un socle, sur une passagère.
  const projection = projectionDuRaid();
  const combat = creerCombat(montageDArrivee([
    [{ id: 'fendeur', colonne: 4 }, { id: 'meute', colonne: 5 }],
    [{ id: 'busard', colonne: 6 }],
  ]));
  const arrivees = creerArrivees();
  noterLesArrivees(arrivees, combat, 0);

  const attaquants = combat.entites.filter((e) => e.camp === 'attaque');
  assert.ok(attaquants.length >= 2, 'le montage ne monte pas assez d\'attaquants');
  const duree = Math.max(...attaquants.map((e) => dureeDArrivee(e)));

  let sprites = 0;
  for (const t of [0, 1, Math.round(duree / 3), Math.round(duree / 2), duree - 1, duree, duree + 1]) {
    const liste = listeAffichage(combat, projection, null, 0, null, 0, null,
      arriveesALEcran(arrivees, t));
    const partiels = liste.filter((p) => p.alpha !== undefined && p.alpha !== OPACITE_PLEINE);
    sprites += liste.filter((p) => p.forme === 'sprite').length;
    assert.deepEqual(partiels.map((p) => `${p.nom ?? p.forme}@${p.alpha}`), [],
      `des primitives translucides à ${t} ms : le fantôme est revenu`);
  }
  // ⚠ FALSIFIABLE : la scène doit avoir porté des sprites. Une liste vide
  // passerait « aucune primitive translucide » sur n'importe quel code.
  assert.ok(sprites > 20, `seulement ${sprites} sprites balayés sur les sept instants`);

  // ⚠⚠ ET LE MODULE NE PORTE PLUS DE CONSTANTE D'OPACITÉ D'ARRIVÉE. C'est la
  // moitié que la liste d'affichage ne peut pas dire : une valeur laissée dans
  // la source, non branchée, serait la première à revenir. `OPACITE_PLEINE`,
  // elle, RESTE — `canvas2d.js` s'en sert pour savoir quand ne PAS toucher à
  // `globalAlpha`, et `SB T6` en dépend.
  //
  // ⚠⚠ ET ON LIT LA SOURCE DÉCOMMENTÉE, PARCE QUE LES DEUX MODULES NOMMENT CE
  // QU'ILS ONT RETIRÉ. `render/arrivee.js` explique en toutes lettres que le
  // champ « valait `OPACITE_ARRIVEE` (350 ‰) », et `render/scene.js` que
  // « `alphaDe` a disparu avec le fantôme » : une garde qui lirait le brut
  // tomberait sur sa propre explication. C'est la faute que `CLAUDE.md` §6
  // raconte huit fois, et le remède est toujours le même — décommenter, et
  // prouver que le filtre n'a pas tout mangé.
  const nu = (texte) => texte
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n');

  const source = nu(readFileSync(join(RACINE_RENDU, 'src', 'render', 'arrivee.js'), 'utf8'));
  assert.ok(source.includes('export function dureeDArrivee'),
    'témoin : le filtre a mangé le corps de `render/arrivee.js`');
  assert.ok(!source.includes('OPACITE_ARRIVEE'),
    'l\'opacité d\'arrivée est revenue dans `render/arrivee.js`');

  const scene = nu(readFileSync(join(RACINE_RENDU, 'src', 'render', 'scene.js'), 'utf8'));
  assert.ok(scene.includes('export function listeAffichage'),
    'témoin : le filtre a mangé le corps de `render/scene.js`');
  assert.ok(!scene.includes('alphaDe'),
    '`alphaDe` est revenue dans `render/scene.js` : elle ne pouvait plus rendre que 1 000');
  assert.ok(scene.includes('OPACITE_PLEINE'),
    'témoin : `OPACITE_PLEINE` a disparu de la scène, et le balayage ne prouve plus rien');

  // ⚠ ET LE FILTRE SE FALSIFIE : il doit encore VOIR une occurrence hors
  // commentaire. Sans cet appât, « décommenté » pourrait vouloir dire « vide ».
  assert.ok(nu('const OPACITE_ARRIVEE = 350; // ...').includes('OPACITE_ARRIVEE'),
    'le filtre mange le code en même temps que les commentaires');
  assert.ok(!nu('// const OPACITE_ARRIVEE = 350;').includes('OPACITE_ARRIVEE'),
    'le filtre ne retire pas une ligne entièrement commentée');
});

test('AC T3 — l\'arrivée dure ce que l\'unité met à franchir une case', () => {
  // ⚠⚠ LA DURÉE N'EST PLUS DÉCRÉTÉE — Ethan : « ils arrivent trop rapidement ».
  // Elle valait `ARRIVEE_MS = 400` pour les quatorze unités du roster ; elle
  // vaut désormais le temps qu'il faut à CELLE-CI pour franchir une case, ce qui
  // est la seule durée que le modèle sache déjà donner.
  //
  // ⚠⚠ LES DEUX NOMBRES SE CALCULENT ICI, ILS NE SE RECOPIENT PAS. Les écrire
  // en dur figerait `MILLI_PAR_CASE`, `TICK_MS` et la table des vitesses d'un
  // seul coup, et le test cesserait de dire d'où le nombre vient.
  const attendu = (vitesse) => Math.round((MILLI_PAR_CASE * TICK_MS) / vitesse);

  // Deux vitesses que le roster porte pour de bon, et qui diffèrent d'un
  // facteur deux — sans quoi « la durée dépend de l'unité » serait invérifiable.
  const lents = Object.entries(UNITES).filter(([, u]) => u.vitesse === 60);
  const vifs = Object.entries(UNITES).filter(([, u]) => u.vitesse === 120);
  assert.ok(lents.length > 0 && vifs.length > 0,
    'le roster ne porte plus les deux vitesses 60 et 120 : réancrer le montage');

  const duree = (id) => dureeDArrivee({ id });
  assert.equal(duree(lents[0][0]), attendu(60), 'la durée d\'une unité à 60 n\'est pas 1 667 ms');
  assert.equal(duree(vifs[0][0]), attendu(120), 'la durée d\'une unité à 120 n\'est pas 833 ms');
  // ⚠ ET LE RAPPORT EST EXACTEMENT DEUX — c'est ce qu'une durée fixe ne peut pas
  // rendre : elle donnerait le même nombre pour les deux, et ce test dit lequel.
  assert.equal(duree(lents[0][0]), 2 * duree(vifs[0][0]) + 1,
    'les deux vitesses ne rendent pas deux durées dans le rapport de leurs vitesses');

  // ⚠ LES QUATORZE UNITÉS ONT UNE DURÉE, ET AUCUNE N'EST NULLE. Le roster porte
  // quatre vitesses ; une unité sans vitesse ferait lever au premier raid qui
  // l'engage, donc chez le joueur et pas au dépôt.
  const durees = new Set();
  for (const id of Object.keys(UNITES)) {
    const d = dureeDArrivee({ id });
    assert.ok(Number.isInteger(d) && d > 0, `« ${id} » n'a pas de durée d'arrivée entière`);
    durees.add(d);
  }
  assert.equal(durees.size, new Set(Object.values(UNITES).map((u) => u.vitesse)).size,
    'deux vitesses distinctes rendent la même durée, ou l\'inverse');

  // ⚠⚠ ET CE QUI NE ROULE PAS N'ARRIVE PAS : la fonction LÈVE plutôt que de
  // rendre un nombre. Une vitesse nulle rendrait l'infini et une entité sans
  // identifiant `NaN` — les deux poseraient l'unité sous sa case pour toujours,
  // en silence. Trois formes de la même faute, refusées de face.
  for (const entite of [{ id: 'inconnu' }, { id: null }, {}, null, undefined]) {
    assert.throws(() => dureeDArrivee(entite), RangeError,
      `« ${JSON.stringify(entite)} » ne fait pas lever la durée d'arrivée`);
  }
});

test('AC T4 — l\'arrivée finit à la milliseconde près sur la durée de l\'unité', () => {
  // ⚠⚠ LE POINT EST LA FIN, PAS LE DÉBUT. Une rampe qui n'atteint pas zéro
  // laisse l'unité un dixième de case sous sa case, POUR TOUJOURS — et ce n'est
  // pas visible sur une capture : c'est un décalage constant qu'on prend pour un
  // choix de dessin. Le test l'exige à la milliseconde, et il exige que la
  // milliseconde en question soit celle du `AC T3`.
  const projection = projectionDuRaid();
  for (const id of ['fendeur', 'meute', 'busard']) {
    const combat = creerCombat(montageDArrivee([[{ id, colonne: 4 }]]));
    const attaquant = combat.entites.find((e) => e.camp === 'attaque');
    const arrivees = creerArrivees();
    noterLesArrivees(arrivees, combat, 0);
    const duree = dureeDArrivee(attaquant);
    assert.equal(duree, Math.round((MILLI_PAR_CASE * TICK_MS) / UNITES[id].vitesse),
      `la durée de « ${id} » ne vient pas de sa vitesse`);

    // Au début : une case ENTIÈRE plus bas. À la fin : zéro, exactement.
    assert.equal(etatDeLArrivee(arrivees, attaquant.indice, 0).decalageMilli, MILLI_PAR_CASE);
    assert.equal(etatDeLArrivee(arrivees, attaquant.indice, duree - 1).decalageMilli > 0, true,
      `« ${id} » est déjà arrivé une milliseconde avant son échéance`);
    assert.equal(etatDeLArrivee(arrivees, attaquant.indice, duree).decalageMilli, 0,
      `« ${id} » n'atteint pas exactement sa case`);
    assert.equal(etatDeLArrivee(arrivees, attaquant.indice, duree + 1), null,
      `« ${id} » arrive encore après son échéance`);

    // ⚠ ET LE MÊME FAIT SE MESURE À L'ÉCRAN, en pixels : le sprite tombe sur le
    // `y` de sa case et n'en rebouge plus. La rampe pure et la liste
    // d'affichage sont deux étages, et un décalage peut se perdre entre eux.
    const yDuSprite = (t) => {
      const siens = listeAffichage(combat, projection, null, 0, null, 0, null,
        arriveesALEcran(arrivees, t))
        .filter((p) => p.forme === 'sprite' && p.nom.startsWith('off_j_'));
      assert.ok(siens.length > 0, `aucun sprite pour « ${id} »`);
      return Math.min(...siens.map((p) => p.y));
    };
    const yDeSaCase = yDeRangeeMilli(projection, attaquant.rangeeMilli);
    assert.equal(yDuSprite(0) - yDeSaCase, projection.tailleCase,
      `« ${id} » ne part pas d'une case entière plus bas`);
    assert.equal(yDuSprite(duree), yDeSaCase, `« ${id} » ne se pose pas sur sa case`);
    assert.equal(yDuSprite(duree * 3), yDeSaCase, `« ${id} » rebouge longtemps après`);
  }
});
