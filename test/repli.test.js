// Tests T1 à T8 du brief du lot 3B — écrasement entre camps opposés, repli des
// unités devenues inutiles, légende qui ne peut pas mentir, projection inverse.
//
// Chaque seuil porte son calcul en commentaire.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { GRILLE, UNITES, DEFENSES } from '../src/data/combat.js';
import { BATIMENTS } from '../src/data/sites.js';
import { creerCombat, tick, resoudre, TICKS_AVANT_REPLI } from '../src/sim/combat.js';
import { caseDepuisMilli } from '../src/sim/grille.js';
import {
  calculerProjection, caseDepuisPixels, xDeColonne, yDeRangee,
} from '../src/render/projection.js';
import {
  classeDe, accentDe, listeLegende, ENTREES_LEGENDE, NOMS_CLASSE, NOMS_ACCENT,
} from '../src/render/scene.js';
import { executer } from '../src/render/canvas2d.js';
import { montageDuBanc, executerRaidComplet, entitesSurLaCase, decrireEntite } from '../src/ui/banc.js';

/** Joue jusqu'au tick voulu, ou jusqu'à la fin du combat. */
function jouer(etat, jusquAuTick) {
  while (etat.tick < jusquAuTick && !etat.termine) tick(etat);
  return etat;
}

/** Un bâtiment hors de portée, pour que la fin ne vienne pas d'une grille vide. */
const GANGUE_LOINTAINE = { id: 'gangue', rangee: 18, colonne: 9 };

// ---------------------------------------------------------------------------
// T1 — l'écrasement ne franchit pas la ligne de camp
// ---------------------------------------------------------------------------

test('T1 — un blindé n\'écrase plus son infanterie alliée, mais écrase l\'ennemie', () => {
  // ⚠ Seuils déplacés au lot 4A : le Fendeur (Predator) avance à 90 milli/tick
  // et le Fusilier à 60, le premier ayant 1 000 PV et le second 700. Le rapport
  // des vitesses passe de 2,0 à 1,5 — le Fendeur rattrape toujours l'allié, un
  // peu moins vite, et c'est tout ce dont ce test a besoin.
  // Fendeur masse 10 en (1,5), Fusilier allié masse 1 en (2,5).
  const allie = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [],
    vagues: [[{ id: 'fendeur', rangee: 1, colonne: 5 }, { id: 'meute', rangee: 2, colonne: 5 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const etat = creerCombat(allie);
  const fendeur = etat.entites.find((e) => e.id === 'fendeur');
  const fusilier = etat.entites.find((e) => e.id === 'meute');

  jouer(etat, 60);
  // Le Fusilier est INTACT : entre alliés, blocage, jamais écrasement.
  assert.equal(fusilier.vivant, true, 'le Fusilier allié doit survivre');
  assert.equal(fusilier.ecrase, false);
  assert.equal(fusilier.pvMilli, 700_000, 'et ne rien avoir perdu — nul ne lui tire dessus');

  // Et le Fendeur ne l'a pas doublé : il reste sous lui. Le Fusilier progresse
  // de 60/tick depuis 2000 sans jamais être bloqué ; le Fendeur le suit et se
  // retrouve collé au plafond de la case qu'occupe l'allié.
  assert.ok(
    caseDepuisMilli(fendeur.rangeeMilli) < caseDepuisMilli(fusilier.rangeeMilli),
    `le Fendeur (${fendeur.rangeeMilli}) a doublé le Fusilier (${fusilier.rangeeMilli})`,
  );

  // Montage inverse : même Fendeur attaquant, Fusilier DÉFENSEUR en (3,5).
  // Là, l'écrasement a bien lieu — 10 > 1, camps opposés.
  const ennemi = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'meute', rangee: 3, colonne: 5 }],
    vagues: [[{ id: 'fendeur', colonne: 5 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const combat = creerCombat(ennemi);
  const attaquant = combat.entites.find((e) => e.camp === 'attaque');
  const defenseur = combat.entites.find((e) => e.camp === 'defense' && e.id === 'meute');
  // 2000 + 11 × 90 = 2990, encore en case 2 ; le pas suivant viserait 3080,
  // donc la case 3 : la rencontre a lieu au tick 12.
  jouer(combat, 11);
  assert.equal(defenseur.vivant, true, 'pas encore au contact au tick 11');
  jouer(combat, 12);
  assert.equal(defenseur.vivant, false, 'écrasé au tick de la rencontre');
  assert.equal(defenseur.ecrase, true);
  assert.equal(attaquant.rangeeMilli, 3080, 'et la mobile continue sans s\'arrêter');
});

// ---------------------------------------------------------------------------
// T2 — le cas réel qu'Ethan a vu sur l'appareil
// ---------------------------------------------------------------------------

test('T2 — plus aucun fratricide sur le montage qui le produisait', () => {
  // Préréglage `mixte`, camp niveau 15. Avant le correctif, un Fusilier se
  // faisait écraser en COLONNE 5 aux quatre graines — c'est la colonne où le
  // préréglage aligne un Fusilier (vague 1) derrière un Bélier (vague 2).
  const COLONNE_DU_FRATRICIDE = 5;
  assert.equal(
    montageDuBanc({ type: 'camp', niveau: 15, saveur: 'richeQuartz', graine: 1, assaut: 'mixte' })
      .vagues[0].filter((u) => u.colonne === COLONNE_DU_FRATRICIDE).length, 1,
    'le préréglage doit bien poser une unité en colonne 5 à la première vague',
  );

  let legitimesEnTout = 0;
  for (const graine of [1, 2, 3, 42]) {
    const montage = montageDuBanc({
      type: 'camp', niveau: 15, saveur: 'richeQuartz', graine, assaut: 'mixte',
    });
    const etat = creerCombat(montage);
    resoudre(etat);
    const ecrases = etat.entites.filter((e) => e.camp === 'attaque' && e.ecrase);
    assert.deepEqual(
      ecrases.map((e) => `${e.id} en colonne ${e.colonne}`), [],
      `graine ${graine} : un attaquant a été écrasé par les siens`,
    );
    legitimesEnTout += etat.entites.filter((e) => e.camp === 'defense' && e.ecrase).length;
  }
  // Le test ne passe pas à vide : l'écrasement légitime, lui, opère toujours.
  // Il ne se produit pas à chaque graine — la garnison tirée varie — mais bien
  // sur l'ensemble des quatre.
  assert.ok(legitimesEnTout > 0, 'aucun écrasement légitime sur les quatre graines');
});

// ---------------------------------------------------------------------------
// T3 — le repli
// ---------------------------------------------------------------------------

test('T3 — une unité qui ne peut plus rien faire rentre à la base', () => {
  // Un Fusilier seul en colonne 1 ; le seul bâtiment est en (18,9), à huit
  // colonnes, soit 8000² = 64 000 000 contre une portée² de 2 250 000 : il ne
  // l'atteindra jamais. Il monte donc jusqu'au fond et s'y trouve inutile.
  const montage = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [],
    vagues: [[{ id: 'meute', colonne: 1 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const etat = creerCombat(montage);
  const meute = etat.entites.find((e) => e.camp === 'attaque');

  // ⚠ Seuil déplacé au lot 4A : vitesse 60 milli/tick au lieu de 50. Départ à
  // 2000, la rangée 18 commence à 18 000 : t₁₈ = ceil(16 000 / 60) = 267, le
  // pas de 266 ne portant qu'à 17 960. Au tick 267 il ENTRE en rangée 18 —
  // c'est encore un tick de progrès. Le premier tick sans avancer ni nuire est
  // le 268e.
  const t18 = Math.ceil((18_000 - 2000) / UNITES.meute.vitesse);
  assert.equal(t18, 267);
  jouer(etat, t18);
  assert.equal(meute.rangeeMilli, 18_020);
  assert.equal(meute.ticksInutiles, 0, 'il progressait encore jusqu\'ici');

  jouer(etat, t18 + 1);
  assert.equal(meute.ticksInutiles, 1);

  // Le compteur court 30 ticks : sortie au tick t₁₈ + 30 = 297.
  jouer(etat, t18 + TICKS_AVANT_REPLI - 1);
  assert.equal(meute.ticksInutiles, TICKS_AVANT_REPLI - 1);
  assert.equal(meute.sorti, false);

  jouer(etat, t18 + TICKS_AVANT_REPLI);
  assert.equal(etat.tick, 297);
  assert.equal(meute.sorti, true, 'sortie exactement au tick t₁₈ + 30');
  assert.equal(meute.vivant, true, 'rentrer à la base n\'est pas mourir');

  // Elle compte parmi les survivants, et le raid s'arrête faute d'attaquants.
  const resultat = resoudre(etat);
  assert.equal(resultat.cause, 'attaquants');
  assert.equal(resultat.tick, 297);
  const survivants = resultat.attaquants.filter((a) => !a.detruit);
  assert.equal(survivants.length, 1);
  assert.equal(survivants[0].sorti, true);
});

// ---------------------------------------------------------------------------
// T4 — le repli ne se déclenche pas trop tôt
// ---------------------------------------------------------------------------

test('T4 — un blocage transitoire remet le compteur à zéro', () => {
  // Deux alliés en file dans la colonne 5, loin de toute cible : le seul
  // bâtiment est en (18,9), à quatre colonnes.
  //
  //   A — Fusilier posé D'EMBLÉE en rangée 18. Il ne peut ni avancer (c'est le
  //       fond) ni nuire (4000² = 16 000 000 contre une portée² de 2 250 000) :
  //       son compteur part au tick 1 et il rentre à la base au tick 30.
  //   B — Chasseur en rangée 17, vitesse 90 milli/tick depuis le lot 4A. Parti
  //       de 17 000, il est à 17 990 au tick 11 ; au tick 12 sa destination,
  //       18 080, tombe en rangée 18, occupée par A. Entre alliés c'est un
  //       BLOCAGE, jamais un écrasement — et sa portée² de 6 250 000 ne couvre
  //       pas davantage la Gangue. Son compteur part donc au tick 12.
  //
  // ⚠ Seuils déplacés au lot 4A : de 12 à 29 inclus, B accumule 18 ticks
  // inutiles au lieu de 20, sa vitesse de 90 lui laissant deux pas de plus
  // avant le contact. Au tick 30 A libère la case en rentrant, B repart, et son
  // compteur retombe à zéro — ce que ce test tient, inchangé.
  const montage = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [],
    vagues: [[
      { id: 'meute', rangee: 18, colonne: 5 },
      { id: 'fendeur', rangee: 17, colonne: 5 },
    ]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const etat = creerCombat(montage);
  const bloqueur = etat.entites.find((e) => e.id === 'meute');
  const bloque = etat.entites.find((e) => e.id === 'fendeur');

  jouer(etat, 11);
  assert.equal(bloque.rangeeMilli, 17_990, '17 000 + 11 × 90');
  assert.equal(bloque.ticksInutiles, 0, 'il progressait encore');

  jouer(etat, 29);
  assert.equal(bloque.ticksInutiles, 18, 'dix-huit ticks bloqué derrière son allié');
  assert.equal(bloque.rangeeMilli, 17_990, 'et pas d\'un milli-case de plus');
  assert.equal(bloque.sorti, false, 'il n\'est pas encore rentré');
  assert.equal(bloqueur.vivant, true, 'et son allié est toujours vivant : blocage, pas écrasement');
  assert.equal(bloqueur.ecrase, false);
  assert.equal(bloqueur.ticksInutiles, 29);

  // Au tick 30 A rentre à la base et libère la case dans le même tick.
  jouer(etat, 30);
  assert.equal(bloqueur.sorti, true);
  assert.equal(bloque.ticksInutiles, 0, 'le compteur est remis à zéro');
  assert.equal(bloque.rangeeMilli, 18_080, 'et B a repris sa marche dès ce tick');
  assert.equal(bloque.sorti, false);
});

// ---------------------------------------------------------------------------
// T5 — une unité qui tire ne se replie jamais
// ---------------------------------------------------------------------------

test('T5 — nuire suffit à rester, même bloqué contre un mur', () => {
  // ⚠ Seuils déplacés au lot 4A. Le montage du lot 2A : Meute en (2,5), Merlon
  // en (3,5). Dégâts par tir 7000 milli-PV, mur de 2 000 000 →
  // ceil(2 000 000 / 7000) = 286 ticks. Le Meute est bloqué dès le tick 17 et
  // le reste jusqu'au bout : il ne peut pas avancer, mais il nuit, donc il ne
  // compte aucun tick inutile. C'est bien plus long qu'avant (209 ticks) — et
  // c'est justement ce que le test doit couvrir : le repli à 30 ticks ne doit
  // jamais mordre sur une unité qui travaille, si lente soit-elle.
  const montage = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'merlon', rangee: 3, colonne: 5 }],
    vagues: [[{ id: 'meute', colonne: 5 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const etat = creerCombat(montage);
  const meute = etat.entites.find((e) => e.camp === 'attaque');
  const merlon = etat.entites.find((e) => e.id === 'merlon');

  for (const t of [30, 100, 285]) {
    jouer(etat, t);
    assert.equal(meute.ticksInutiles, 0, `tick ${t} : il tire, il ne compte rien`);
    assert.equal(meute.sorti, false);
  }
  jouer(etat, 286);
  assert.equal(merlon.pvMilli, 0, 'le mur tombe au tick 286');
  assert.equal(meute.sorti, false, 'et il ne s\'est jamais replié');
  assert.equal(meute.ticksInutiles, 0);
});

// ---------------------------------------------------------------------------
// T6 — le raid C du rapport 3A
// ---------------------------------------------------------------------------

test('T6 — le raid C ne se traîne plus jusqu\'au tick 900', () => {
  // Camp niveau 15, graine 1, préréglage infanterie. Au lot 3A : `duree` au
  // tick 900, six unités plantées, butin 65 190 quartz et 21 730 scorie.
  const parametres = {
    type: 'camp', niveau: 15, saveur: 'richeQuartz', graine: 1, assaut: 'infanterie',
  };
  const r = executerRaidComplet(parametres);
  assert.equal(r.cause, 'attaquants', 'la cause n\'est plus l\'expiration');
  assert.ok(r.nbTicks < 900, `${r.nbTicks} ticks, il en fallait moins de 900`);
  assert.equal(r.nbTicks, 315);
  // ⚠ Seuils déplacés à chaque lot, et à chaque fois par un changement de RÈGLE,
  // jamais par une régression du repli. Lot 3B : 65 190 quartz + 21 730 scorie,
  // six survivants, tick 566. Lot 3C : 82 849 + 27 616, cinq survivants, même
  // tick — les tirs stériles allaient enfin sur des cibles qu'ils entamaient.
  // Lot 4A, roster mesuré : 66 992 + 22 330, six survivants, tick 471.
  // Lot 4B : 26 319 + 8 773, sept survivants, tick 315. Deux causes cumulées —
  // les bâtiments quintuplent de PV, donc la même infanterie en entame une
  // fraction cinq fois moindre ; et l'assaut, désormais borné aux 95 points du
  // niveau 15, ne peut plus aligner des Guetteurs et des Fouisseurs verrouillés
  // jusqu'aux niveaux 22 et 24.
  // Lot COURBE : 26 321 au lieu de 26 319. DEUX unités de quartz. Le tick 315,
  // la cause et les sept survivants sont bit pour bit les mêmes sous une courbe
  // 4 500 fois plus plate — c'est l'invariance en miroir qui se montre.
  assert.deepEqual(r.butin, { quartz: 26_321, scorie: 8773 });
  assert.equal(r.resultat.attaquants.filter((a) => !a.detruit).length, 7);
  assert.ok(
    r.resultat.attaquants.some((a) => a.sorti),
    'au moins une unité doit être rentrée à la base',
  );
});

// ---------------------------------------------------------------------------
// T7 — la légende ne peut pas mentir
// ---------------------------------------------------------------------------

/**
 * Énumère depuis les données l'ensemble des couples (classe, accent) que la
 * scène peut produire. Prend les tables en argument pour que le test puisse
 * lui en présenter une augmentée d'une entité fictive.
 */
function couplesEmis(unites, defenses, batiments) {
  const couples = new Set();
  for (const id of Object.keys(unites)) {
    couples.add(`${classeDe('unite', id)}/${accentDe('unite', id)?.colonne ?? 'aucun'}`);
  }
  for (const id of Object.keys(defenses)) {
    couples.add(`${classeDe('defense', id)}/${accentDe('defense', id)?.colonne ?? 'aucun'}`);
  }
  for (const id of Object.keys(batiments)) {
    couples.add(`${classeDe('batiment', id)}/${accentDe('batiment', id)?.colonne ?? 'aucun'}`);
  }
  return couples;
}

test('T7 — la légende présente exactement ce que la scène peut émettre', () => {
  const emis = couplesEmis(UNITES, DEFENSES, BATIMENTS);
  const presentes = new Set(ENTREES_LEGENDE.map((e) => `${e.classe}/${e.accent ?? 'aucun'}`));

  // Ni manque ni surplus. 14 unités + 9 défenses + 5 bâtiments se ramènent à
  // 19 couples distincts.
  assert.equal(emis.size, 19);
  assert.deepEqual(
    [...emis].sort(), [...presentes].sort(),
    'la légende et la scène ne présentent pas le même ensemble',
  );

  // Chaque entrée porte un libellé : une vignette muette n'apprend rien.
  for (const entree of ENTREES_LEGENDE) {
    assert.ok(NOMS_CLASSE[entree.classe], `classe « ${entree.classe} » sans libellé`);
    assert.ok(NOMS_ACCENT[entree.accent ?? 'aucun'], `accent « ${entree.accent} » sans libellé`);
  }

  // FALSIFIABILITÉ. Une entité fictive d'une classe non présentée doit faire
  // tomber le test — sans quoi celui-ci ne verrouille rien.
  const fictive = {
    mirage: {
      chassis: 'orbital',
      degats: { infanterie: 1, vehicule: 0, structureOuAviation: 0 },
    },
  };
  const memoire = UNITES.mirage;
  try {
    UNITES.mirage = fictive.mirage;
    const augmente = couplesEmis(UNITES, DEFENSES, BATIMENTS);
    assert.ok(augmente.has('orbital/infanterie'), 'l\'appât n\'a pas été enrôlé');
    assert.notDeepEqual([...augmente].sort(), [...presentes].sort(),
      'une classe inconnue passerait inaperçue : le test ne verrouille rien');
  } finally {
    if (memoire === undefined) delete UNITES.mirage; else UNITES.mirage = memoire;
  }
  // Et la table est bien rendue : le contrôle qui précède n'a rien laissé.
  assert.deepEqual([...couplesEmis(UNITES, DEFENSES, BATIMENTS)].sort(), [...emis].sort());
});

test('T7 bis — la légende se dessine avec les primitives de la scène', () => {
  const projection = calculerProjection(412, 810);
  const liste = listeLegende(projection);

  // Le fond couvre tout le canvas, comme sur le champ de bataille.
  assert.equal(liste[0].forme, 'rect');
  assert.deepEqual([liste[0].x, liste[0].y, liste[0].l, liste[0].h], [0, 0, 412, 810]);

  // Aucune primitive d'un type que canvas2d ne connaît pas, et aucune teinte
  // qui ne vienne de la palette : la légende n'écrit rien en propre.
  const formes = new Set(liste.map((p) => p.forme));
  for (const f of formes) assert.ok(['rect', 'cadre', 'disque', 'ligne', 'texte'].includes(f), f);

  // Elle s'exécute par le MÊME executer, sans lever, et produit autant
  // d'appels que de primitives.
  const appels = [];
  const enregistreur = { appels };
  for (const m of ['fillRect', 'strokeRect', 'beginPath', 'arc', 'fill', 'moveTo', 'lineTo',
    'stroke', 'fillText']) enregistreur[m] = (...a) => appels.push([m, ...a]);
  for (const prop of ['fillStyle', 'strokeStyle', 'lineWidth', 'font', 'textBaseline']) {
    Object.defineProperty(enregistreur, prop, { set(v) { appels.push([prop, v]); } });
  }
  executer(enregistreur, liste);
  const compter = (nom) => appels.filter(([n]) => n === nom).length;
  assert.equal(compter('fillRect'), liste.filter((p) => p.forme === 'rect').length);
  assert.equal(compter('fillText'), liste.filter((p) => p.forme === 'texte').length);
  assert.equal(compter('arc'), liste.filter((p) => p.forme === 'disque').length);
  // Une vignette par entrée, plus les camps, les divers et les titres.
  assert.equal(compter('fillText'), ENTREES_LEGENDE.length + 2 + 4 + 4);
});

// ---------------------------------------------------------------------------
// T8 — projection inverse
// ---------------------------------------------------------------------------

test('T8 — pixel → case est l\'exacte réciproque de case → pixel', () => {
  for (const [largeur, hauteur] of [[412, 810], [360, 640], [800, 800]]) {
    const projection = calculerProjection(largeur, hauteur);
    const { tailleCase: t, margeX, margeY } = projection;

    // Les 18 × 9 = 162 cases font l'aller-retour sans perte.
    let visitees = 0;
    for (let rangee = 1; rangee <= GRILLE.longueur; rangee++) {
      for (let colonne = 1; colonne <= GRILLE.largeur; colonne++) {
        const x = xDeColonne(projection, colonne);
        const y = yDeRangee(projection, rangee);
        // Le coin supérieur gauche appartient à la case, pas à sa voisine.
        assert.deepEqual(caseDepuisPixels(projection, x, y), { rangee, colonne },
          `coin de (${rangee}, ${colonne}) en ${largeur}×${hauteur}`);
        // Le centre aussi, et le dernier pixel de la case également.
        assert.deepEqual(
          caseDepuisPixels(projection, x + Math.floor(t / 2), y + Math.floor(t / 2)),
          { rangee, colonne },
        );
        assert.deepEqual(caseDepuisPixels(projection, x + t - 1, y + t - 1), { rangee, colonne });
        visitees += 1;
      }
    }
    assert.equal(visitees, GRILLE.longueur * GRILLE.largeur);
    assert.equal(visitees, 162);

    // Les marges de letterboxing ne rendent AUCUNE case, pas la plus proche.
    if (margeX > 0) {
      assert.equal(caseDepuisPixels(projection, margeX - 1, margeY + 1), null, 'marge gauche');
      assert.equal(caseDepuisPixels(projection, margeX + GRILLE.largeur * t, margeY + 1), null,
        'marge droite');
    }
    if (margeY > 0) {
      assert.equal(caseDepuisPixels(projection, margeX + 1, margeY - 1), null, 'marge haute');
      assert.equal(caseDepuisPixels(projection, margeX + 1, margeY + GRILLE.longueur * t), null,
        'marge basse');
    }
    // Un pixel hors canvas ne rend rien non plus.
    assert.equal(caseDepuisPixels(projection, -1, -1), null);
    assert.equal(caseDepuisPixels(projection, largeur + 10, hauteur + 10), null);
    assert.equal(caseDepuisPixels(projection, Number.NaN, 0), null);
  }
});

test('T8 bis — l\'inspecteur nomme ce qu\'il y a sur la case', () => {
  const montage = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'meute', rangee: 3, colonne: 5 }],
    vagues: [[{ id: 'meute', colonne: 5 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  const etat = creerCombat(montage);

  // Deux jeux de noms, jamais mélangés : le même identifiant se lit
  // « Fusiliers » côté assaut et « Meute » côté Ouvrage.
  const assaut = entitesSurLaCase(etat, 2, 5);
  assert.equal(assaut.length, 1);
  assert.match(decrireEntite(etat, assaut[0]), /^Fusiliers \(Escouade\) · assaut · 700,0 \/ 700,0 PV/);

  const ouvrage = entitesSurLaCase(etat, 3, 5);
  assert.equal(ouvrage.length, 1);
  assert.match(decrireEntite(etat, ouvrage[0]), /^Meute \(Escouade\) · Ouvrage/);

  // Une case vide ne rend personne.
  assert.deepEqual(entitesSurLaCase(etat, 7, 1), []);

  // Après un tick, la cible visée apparaît dans la description.
  tick(etat);
  assert.match(decrireEntite(etat, assaut[0]), /vise Meute/);

  // Et le compteur de repli s'affiche dès qu'il court. ⚠ Seuil déplacé au lot
  // 4A : à 60 milli/tick, un Fusilier seul en colonne 1 entre en rangée 18 au
  // tick 267 et compte à partir du tick 268.
  const seul = creerCombat({
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [],
    vagues: [[{ id: 'meute', colonne: 1 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  });
  jouer(seul, 272);
  const isole = seul.entites.find((e) => e.camp === 'attaque');
  assert.equal(isole.ticksInutiles, 5);
  // 30 − 5 = 25 ticks avant qu'il ne rentre.
  assert.match(decrireEntite(seul, isole), /repli dans 25 ticks/);
});
