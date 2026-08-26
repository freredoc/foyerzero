// Tests T1 à T12 de l'écran de Défense — le jumeau de l'Arsenal.
//
// Aucun DOM : `defense.js` est pur, `listeArsenal` rend des primitives, et le
// moteur se conduit à la main. Chaque seuil porte son calcul.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { GRILLE, DEFENSES, UNITES } from '../src/data/combat.js';
import { POINTS_ARMEE, DISPOSITION_DEFENSES } from '../src/data/sites.js';
import { NIVEAU } from '../src/data/niveaux.js';
import {
  defenseVide, poser, retirer, enDefenseurs, depuisDefenseurs, avecNiveau, purger,
  defensesDisponibles, bilan, budgetDuNiveau, couverture, indicesDeCouverture, estVide,
  NB_RANGEES, NB_COLONNES, NB_EMPLACEMENTS, PREMIERE_RANGEE, DERNIERE_RANGEE,
  OCCUPANTS_MAX_PAR_RANGEE,
} from '../src/ui/defense.js';
import { calculerProjection, xDeColonne, yDeRangee } from '../src/render/projection.js';
import { listeDefense } from '../src/render/scene.js';
import { creerCombat } from '../src/sim/combat.js';
import { genererSite } from '../src/sim/generateur.js';
import { nomAffiche } from '../src/ui/banc.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const VIEWPORTS = [[412, 810], [360, 640], [800, 800]];

/** Montage minimal : un bâtiment lointain, une vague inoffensive. */
function socle(defenseurs, niveau = 30) {
  return {
    niveau,
    saveur: null,
    obstacles: [],
    batiments: [{ id: 'gangue', rangee: 18, colonne: 9 }],
    defenseurs,
    vagues: [[{ id: 'meute', colonne: 1 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
}

// ---------------------------------------------------------------------------
// T1 — l'alignement
// ---------------------------------------------------------------------------

test('T1 — les neuf abscisses ET les huit ordonnées sont celles du champ', () => {
  // C'EST L'INVARIANT DU LOT. La case où le joueur pose une Casemate EST la case
  // du champ où le moteur la placera. À l'Arsenal seules les colonnes étaient en
  // jeu ; ici les rangées le sont aussi, puisque la bande de défense est une
  // portion RÉELLE du champ et non une file d'attente.
  for (const [largeur, hauteur] of VIEWPORTS) {
    const projection = calculerProjection(largeur, hauteur);
    const abscisses = Array.from({ length: NB_COLONNES }, (_, i) => xDeColonne(projection, i + 1));
    const ordonnees = Array.from({ length: NB_RANGEES },
      (_, i) => yDeRangee(projection, PREMIERE_RANGEE + i));

    // Une pièce dans les neuf colonnes de chaque rangée, puis le montage réel.
    let grille = defenseVide(50);
    for (let rangee = PREMIERE_RANGEE; rangee <= DERNIERE_RANGEE; rangee += 1) {
      for (let colonne = 1; colonne <= NB_COLONNES; colonne += 1) {
        // Six par rangée au plus : on remplit ce que la règle permet.
        if (colonne > OCCUPANTS_MAX_PAR_RANGEE) continue;
        grille = poser(grille, { rangee, colonne, id: 'merlon' });
      }
    }
    const etat = creerCombat(socle(enDefenseurs(grille), 50));

    // Chaque défenseur du moteur retombe sur une abscisse et une ordonnée de
    // l'éditeur — égalité EXACTE, aucune tolérance.
    for (const e of etat.entites.filter((x) => x.genre === 'defense')) {
      assert.ok(abscisses.includes(xDeColonne(projection, e.colonne)),
        `colonne ${e.colonne} hors des abscisses`);
      const rangee = Math.round(e.rangeeMilli / 1000);
      assert.ok(ordonnees.includes(yDeRangee(projection, rangee)),
        `rangée ${rangee} hors des ordonnées`);
    }
  }
});

// ---------------------------------------------------------------------------
// T2 — le budget est une barrière, les emplacements ne mordent jamais
// ---------------------------------------------------------------------------

test('T2 — le budget refuse en entier, et les 72 emplacements ne plafonnent jamais', () => {
  // (a) Au niveau 8 le budget vaut 40 + 5 × 8 = 80. Le Merlon coûte 5 et paraît
  // au niveau 6 : seize Merlons font 80 pile, le dix-septième est refusé.
  // ⚠ Le MERLON et pas la Casemate : le statut « gratuite » de celle-ci reste
  // en suspens au classeur, et un test ne s'adosse pas à un chiffre ouvert.
  assert.equal(budgetDuNiveau(8), 80);
  assert.equal(DEFENSES.merlon.points, 5);
  assert.equal(DEFENSES.merlon.apparition, 6);
  let e = defenseVide(8);
  let poses = 0;
  for (let rangee = PREMIERE_RANGEE; rangee <= DERNIERE_RANGEE && poses < 16; rangee += 1) {
    for (let colonne = 1; colonne <= OCCUPANTS_MAX_PAR_RANGEE && poses < 16; colonne += 1) {
      e = poser(e, { rangee, colonne, id: 'merlon' });
      poses += 1;
    }
  }
  assert.equal(bilan(e).pointsEngages, 80);
  assert.equal(bilan(e).pointsRestants, 0);
  assert.throws(() => poser(e, { rangee: 10, colonne: 9, id: 'merlon' }), /budget de 80/);

  // (b) Le budget mord TOUJOURS le premier, sur les cinquante niveaux. Les deux
  // nombres se lisent dans les tables, jamais ne s'écrivent : ce test tombe le
  // jour où le budget de défense est relevé, et c'est son but.
  const budgetMax = budgetDuNiveau(NIVEAU.plafond);
  const moinsCher = Math.min(
    ...Object.values(DEFENSES).map((d) => d.points),
    ...Object.keys(UNITES).filter((id) => UNITES[id].defense.present).map((id) => UNITES[id].points),
  );
  assert.equal(budgetMax, 290);
  assert.equal(moinsCher, 5);
  assert.ok(Math.floor(budgetMax / moinsCher) <= NB_EMPLACEMENTS,
    `${Math.floor(budgetMax / moinsCher)} pièces au budget contre ${NB_EMPLACEMENTS} emplacements`);
  assert.equal(Math.floor(budgetMax / moinsCher), 58);
});

// ---------------------------------------------------------------------------
// T3 — la disponibilité, et une seule table d'apparition
// ---------------------------------------------------------------------------

test('T3 — la disponibilité suit apparition, et une seule table fait foi', () => {
  // Niveau 1 : la Meute seule (apparition 0). Niveau 6 : + Perceurs (4) et
  // Merlon (6). Niveau 32 : les 9 défenses et les 8 unités défensives = 17.
  assert.equal(defensesDisponibles(1).length, 1);
  assert.equal(defensesDisponibles(6).length, 3);
  assert.equal(defensesDisponibles(32).length, 17);
  assert.equal(defensesDisponibles(50).length, 17);
  assert.deepEqual(defensesDisponibles(1), ['meute']);

  // Huit unités ont un rôle défensif, six n'en ont pas.
  const avec = Object.keys(UNITES).filter((id) => UNITES[id].defense.present === true);
  assert.equal(avec.length, 8);
  assert.equal(Object.keys(UNITES).length - avec.length, 6);

  // ⚠ LE PIÈGE CIBLAGE-DEFENSE. Il n'existe PAS de champ `defense.apparition` :
  // asserter par hasOwnProperty, jamais par `!== undefined` sur une valeur
  // calculée — une propriété absente et une propriété à undefined se lisent
  // pareil de la seconde façon.
  for (const id of Object.keys(UNITES)) {
    assert.ok(!Object.prototype.hasOwnProperty.call(UNITES[id].defense, 'apparition'),
      `${id}.defense ne doit pas porter d'apparition propre`);
  }
});

// ---------------------------------------------------------------------------
// T4 — les bornes sont LUES, jamais recopiées
// ---------------------------------------------------------------------------

test('T4 — les bornes de la bande viennent de la table, pas de littéraux', () => {
  // Asserter par IDENTITÉ avec la table : si la bande de défense bouge un jour
  // dans GRILLE, le module suit sans qu'on y touche, et ce test le prouve.
  assert.equal(PREMIERE_RANGEE, GRILLE.bandes.defense.premiere);
  assert.equal(DERNIERE_RANGEE, GRILLE.bandes.defense.derniere);
  assert.equal(NB_RANGEES, GRILLE.bandes.defense.derniere - GRILLE.bandes.defense.premiere + 1);
  assert.equal(NB_COLONNES, GRILLE.largeur);
  assert.equal(NB_EMPLACEMENTS, NB_RANGEES * NB_COLONNES);
  assert.equal(OCCUPANTS_MAX_PAR_RANGEE, DISPOSITION_DEFENSES.occupantsMaxParRangee);

  // Et les valeurs du jour, pour qu'un déplacement se voie aussi.
  assert.equal(NB_RANGEES, 8);
  assert.equal(NB_EMPLACEMENTS, 72);

  // Hors bande : la rangée 2 (déploiement) et la 11 (bâtiments) sont refusées.
  const e = defenseVide(30);
  assert.throws(() => poser(e, { rangee: PREMIERE_RANGEE - 1, colonne: 1, id: 'merlon' }), /rangée/);
  assert.throws(() => poser(e, { rangee: DERNIERE_RANGEE + 1, colonne: 1, id: 'merlon' }), /rangée/);
});

// ---------------------------------------------------------------------------
// T5 — les cinquante niveaux passent creerCombat
// ---------------------------------------------------------------------------

test('T5 — sur les cinquante niveaux, ce que rend l\'éditeur passe le moteur', () => {
  for (let niveau = 1; niveau <= NIVEAU.plafond; niveau += 1) {
    const dispo = defensesDisponibles(niveau);
    let e = defenseVide(niveau);
    // Remplir au budget avec ce qui est disponible, en respectant la règle des
    // six par rangée. On s'arrête quand plus rien ne rentre.
    let progresse = true;
    while (progresse) {
      progresse = false;
      for (let rangee = PREMIERE_RANGEE; rangee <= DERNIERE_RANGEE && !progresse; rangee += 1) {
        for (let colonne = 1; colonne <= NB_COLONNES && !progresse; colonne += 1) {
          for (const id of dispo) {
            try {
              e = poser(e, { rangee, colonne, id });
              progresse = true;
              break;
            } catch { /* case pleine, rangée pleine ou budget : on essaie ailleurs */ }
          }
        }
      }
    }
    const liste = enDefenseurs(e);
    assert.ok(liste.length > 0, `niveau ${niveau} : rien n'a pu être posé`);
    assert.doesNotThrow(() => creerCombat(socle(liste, niveau)), `niveau ${niveau}`);
    assert.ok(bilan(e).valide, `niveau ${niveau} : bilan invalide`);
  }
});

// ---------------------------------------------------------------------------
// T6 — l'aller-retour
// ---------------------------------------------------------------------------

test('T6 — depuisDefenseurs(enDefenseurs(x)) rend x, et refuse une liste corrompue', () => {
  let e = defenseVide(30);
  e = poser(e, { rangee: 3, colonne: 1, id: 'merlon' });
  e = poser(e, { rangee: 7, colonne: 5, id: 'casemate' });
  e = poser(e, { rangee: 10, colonne: 9, id: 'mortier' });
  assert.deepEqual(depuisDefenseurs(enDefenseurs(e), 30), e);

  // Deux défenseurs sur la même case : la liste est corrompue, pas ambiguë.
  assert.throws(() => depuisDefenseurs([
    { id: 'merlon', rangee: 5, colonne: 5 }, { id: 'ronce', rangee: 5, colonne: 5 },
  ], 30), /deux défenseurs en \(5, 5\)/);

  // retirer puis reposer rend bien l'état de départ.
  const sans = retirer(e, { rangee: 7, colonne: 5 });
  assert.deepEqual(poser(sans, { rangee: 7, colonne: 5, id: 'casemate' }), e);
  assert.ok(estVide(defenseVide(30)));
  assert.ok(!estVide(e));
});

// ---------------------------------------------------------------------------
// T7 — la couverture géométrique
// ---------------------------------------------------------------------------

test('T7 — la couverture se calcule avec le prédicat du moteur, et sature en rangée 6', () => {
  // Table recalculée ici même, colonne 5, Faucheuse (portée 5,5 / mini 3,5).
  assert.equal(DEFENSES.faucheuse.portee, 5.5);
  assert.equal(DEFENSES.faucheuse.porteeMini, 3.5);
  assert.equal(couverture('faucheuse', 3, 5), 32);
  assert.equal(couverture('faucheuse', 4, 5), 38);
  assert.equal(couverture('faucheuse', 5, 5), 45);
  assert.equal(couverture('faucheuse', 6, 5), 50);

  // SATURATION : les rangées 6 à 10 rendent des valeurs égales, colonne par
  // colonne. C'est ce qui fait que le seuil se CALCULE au lieu de se choisir.
  for (let colonne = 1; colonne <= NB_COLONNES; colonne += 1) {
    const reference = couverture('faucheuse', 6, colonne);
    for (let rangee = 7; rangee <= DERNIERE_RANGEE; rangee += 1) {
      assert.equal(couverture('faucheuse', rangee, colonne), reference,
        `saturation rompue en (${rangee}, ${colonne})`);
    }
  }

  // La Casemate (portée 2,5 / mini 0) ne perd rien nulle part : l'indice ne doit
  // JAMAIS la marquer. C'est le contrôle négatif du test.
  assert.equal(DEFENSES.casemate.porteeMini, 0);
  for (let rangee = PREMIERE_RANGEE; rangee <= DERNIERE_RANGEE; rangee += 1) {
    assert.equal(couverture('casemate', rangee, 5), couverture('casemate', DERNIERE_RANGEE, 5));
  }

  // L'indice marque exactement les artilleries des rangées 3, 4 et 5.
  // Niveau 50 : huit Faucheuses à 22 et huit Casemates à 8 font 240 points, et
  // le budget en vaut 290. Au niveau 30 il n'en vaudrait que 190 — le montage
  // qui prouve doit tenir dans le budget, sinon il ne prouve rien.
  let e = defenseVide(50);
  for (let rangee = PREMIERE_RANGEE; rangee <= DERNIERE_RANGEE; rangee += 1) {
    e = poser(e, { rangee, colonne: 5, id: 'faucheuse' });
    e = poser(e, { rangee, colonne: 6, id: 'casemate' });
  }
  const marques = indicesDeCouverture(e);
  assert.deepEqual(marques.map((m) => m.rangee).sort((a, b) => a - b), [3, 4, 5]);
  assert.ok(marques.every((m) => m.id === 'faucheuse'), 'aucune Casemate ne doit être marquée');
  assert.deepEqual(marques.map((m) => m.couverture), [32, 38, 45]);
  assert.ok(marques.every((m) => m.maximale === 50));
});

// ---------------------------------------------------------------------------
// T8 — six occupants par rangée
// ---------------------------------------------------------------------------

test('T8 — la septième pose sur une rangée est refusée, et le message la nomme', () => {
  // « Trois colonnes libres au minimum : sans passage, le terrain ne décide plus
  // rien. » La règle du générateur vaut pour le joueur — arbitrage du 25/08.
  assert.equal(OCCUPANTS_MAX_PAR_RANGEE, 6);
  let e = defenseVide(30);
  for (let colonne = 1; colonne <= 6; colonne += 1) {
    e = poser(e, { rangee: 5, colonne, id: 'merlon' });
  }
  assert.throws(() => poser(e, { rangee: 5, colonne: 7, id: 'merlon' }), /rangée 5/);
  assert.throws(() => poser(e, { rangee: 5, colonne: 9, id: 'merlon' }), /6 occupants/);

  // Une AUTRE rangée reste libre : le plafond est par rangée, pas global.
  assert.doesNotThrow(() => poser(e, { rangee: 6, colonne: 7, id: 'merlon' }));
  assert.deepEqual(bilan(e).rangeesPleines, [5]);
});

// ---------------------------------------------------------------------------
// T9 — les obstacles
// ---------------------------------------------------------------------------

test('T9 — une case d\'obstacle est refusée, et la composition passe le moteur', () => {
  const e = defenseVide(30, [{ rangee: 5, colonne: 3 }, { rangee: 20, colonne: 1 }]);
  // Seules les cases DE LA BANDE sont retenues : la rangée 20 n'y est pas.
  assert.deepEqual(e.interdites, ['5,3']);
  assert.throws(() => poser(e, { rangee: 5, colonne: 3, id: 'merlon' }), /obstacle/);
  assert.doesNotThrow(() => poser(e, { rangee: 5, colonne: 4, id: 'merlon' }));

  // Sur cinq graines, une composition bâtie AVEC les obstacles du site passe
  // `creerCombat` sur ce site — c'est la seule preuve qui vaille, le moteur
  // refusant lui-même un défenseur posé sur un obstacle.
  for (const graine of [1, 2, 3, 4, 5]) {
    const montage = genererSite({ type: 'camp', niveau: 30, saveur: null, graine });
    let grille = defenseVide(30, montage.obstacles);
    let poses = 0;
    for (let rangee = PREMIERE_RANGEE; rangee <= DERNIERE_RANGEE && poses < 12; rangee += 1) {
      for (let colonne = 1; colonne <= NB_COLONNES && poses < 12; colonne += 1) {
        try {
          grille = poser(grille, { rangee, colonne, id: 'merlon' });
          poses += 1;
        } catch { /* obstacle, rangée pleine ou budget */ }
      }
    }
    montage.defenseurs = enDefenseurs(grille);
    assert.ok(montage.defenseurs.length > 0, `graine ${graine} : rien posé`);
    assert.doesNotThrow(() => creerCombat(montage), `graine ${graine}`);
  }
});

// ---------------------------------------------------------------------------
// T10 — le refus d'un identifiant sans rôle défensif
// ---------------------------------------------------------------------------

test('T10 — l\'éditeur ne produit jamais un montage que le moteur refuserait', () => {
  const e = defenseVide(50);
  // Les six unités sans rôle défensif, refusées AVEC LE MESSAGE DU MOTEUR.
  const sansRole = Object.keys(UNITES).filter((id) => UNITES[id].defense.present !== true);
  assert.deepEqual(sansRole.sort(),
    ['busard', 'crecelle', 'enclume', 'fouisseurs', 'frappeur', 'pilon']);
  for (const id of sansRole) {
    assert.throws(() => poser(e, { rangee: 5, colonne: 1, id }),
      /n'a pas de rôle en défense/, id);
    // Et le moteur refuse la même chose, pour la même raison, dite pareil.
    assert.throws(() => creerCombat(socle([{ id, rangee: 5, colonne: 1 }], 50)),
      /n'a pas de rôle en défense/, `moteur ${id}`);
  }
  assert.throws(() => poser(e, { rangee: 5, colonne: 1, id: 'inconnu' }), /identifiant inconnu/);
});

// ---------------------------------------------------------------------------
// T11 — la descente de niveau, et la purge
// ---------------------------------------------------------------------------

test('T11 — descendre de niveau ne retire rien en silence ; purger le fait sur demande', () => {
  let e = defenseVide(30);
  e = poser(e, { rangee: 3, colonne: 1, id: 'mortier' }); // apparition 30
  e = poser(e, { rangee: 4, colonne: 1, id: 'merlon' }); // apparition 6
  assert.ok(bilan(e).valide);

  // Descendre au niveau 10 : le Mortier devient verrouillé, RIEN n'est retiré.
  const bas = avecNiveau(e, 10);
  const b = bilan(bas);
  assert.equal(b.emplacementsOccupes, 2, 'la descente ne retire rien');
  assert.equal(b.verrouilles.length, 1);
  assert.equal(b.verrouilles[0].id, 'mortier');
  assert.equal(b.verrouilles[0].apparition, 30);
  assert.ok(!b.valide);

  // Purger, sur demande explicite : le Mortier part, le Merlon reste.
  const purge = purger(bas);
  assert.equal(bilan(purge).emplacementsOccupes, 1);
  assert.equal(enDefenseurs(purge)[0].id, 'merlon');
  assert.ok(bilan(purge).valide);
});

// ---------------------------------------------------------------------------
// T12 — pureté
// ---------------------------------------------------------------------------

test('T12 — defense.js n\'importe ni page ni surface, et ne tire aucun hasard', () => {
  const source = readFileSync(join(RACINE, 'src/ui/defense.js'), 'utf8')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  for (const interdit of [
    /(?<![\p{L}\p{N}_])document(?![\p{L}\p{N}_])/u,
    /(?<![\p{L}\p{N}_])window(?![\p{L}\p{N}_])/u,
    /(?<![\p{L}\p{N}_])canvas(?![\p{L}\p{N}_])/iu,
    /Math\.random/,
    /Date\.now/,
    /new Date/,
    /performance\.now/,
  ]) {
    assert.ok(!interdit.test(source), `defense.js ne doit pas contenir ${interdit}`);
  }

  // Chaque opération rend un NOUVEL état : l'original n'est jamais touché.
  const avant = defenseVide(30);
  const gele = JSON.stringify(avant);
  const apres = poser(avant, { rangee: 5, colonne: 5, id: 'merlon' });
  assert.equal(JSON.stringify(avant), gele, 'poser a muté son argument');
  assert.notEqual(JSON.stringify(apres), gele);
  retirer(apres, { rangee: 5, colonne: 5 });
  purger(apres);
  avecNiveau(apres, 12);
  assert.equal(JSON.stringify(apres), JSON.stringify(
    poser(defenseVide(30), { rangee: 5, colonne: 5, id: 'merlon' }),
  ), 'une opération a muté son argument');

  // Deux appels identiques rendent le même résultat : aucun hasard.
  assert.deepEqual(defenseVide(30), defenseVide(30));
  assert.equal(couverture('faucheuse', 3, 5), couverture('faucheuse', 3, 5));
});

// ---------------------------------------------------------------------------
// T13 — les deux jeux de noms, bout en bout
// ---------------------------------------------------------------------------

test('T13 — une garnison du joueur porte les noms du joueur', () => {
  // C'est le croisement qui prouve que la clé est le PROPRIÉTAIRE et non le
  // camp : la même ligne de données, du même côté de la grille, rend deux noms.
  const liste = [{ id: 'merlon', rangee: 5, colonne: 1 }, { id: 'meute', rangee: 6, colonne: 2 }];

  const ouvrage = creerCombat({ ...socle(liste), proprietaireDefense: 'ouvrage' });
  const parNom = (etat, id) => nomAffiche(etat.entites.find((e) => e.id === id && e.camp === 'defense'));
  assert.equal(parNom(ouvrage, 'merlon'), 'Merlon');
  assert.equal(parNom(ouvrage, 'meute'), 'Meute');

  const joueur = creerCombat({
    ...socle(liste), proprietaireDefense: 'joueur', proprietaireAttaque: 'ouvrage',
  });
  assert.equal(parNom(joueur, 'merlon'), 'Mur de défense');
  assert.equal(parNom(joueur, 'meute'), 'Fusiliers');

  // Et l'assaut d'en face, qui appartient alors à l'Ouvrage, prend ses noms.
  const attaquant = joueur.entites.find((e) => e.camp === 'attaque');
  assert.equal(nomAffiche(attaquant), 'Meute');

  // Personne ne s'attaque soi-même.
  assert.throws(() => creerCombat({
    ...socle(liste), proprietaireDefense: 'joueur', proprietaireAttaque: 'joueur',
  }), /personne ne s'attaque soi-même/);
  assert.throws(() => creerCombat({ ...socle(liste), proprietaireDefense: 'nimporte' }),
    /attendu « joueur » ou « ouvrage »/);
});

// ---------------------------------------------------------------------------
// T14 — les défauts reproduisent l'ancien comportement
// ---------------------------------------------------------------------------

test('T14 — sans propriétaire déclaré, rien ne change', () => {
  // Les 134 tests d'avant ce lot montaient des combats SANS propriétaire. Le
  // défaut doit donc être exactement l'ancien comportement : défense à
  // l'Ouvrage, assaut au joueur. C'est ce qui a permis de ne toucher aucun de
  // ces tests, et c'est asserté ici plutôt que supposé.
  const etat = creerCombat(socle([{ id: 'merlon', rangee: 5, colonne: 1 }]));
  assert.equal(etat.proprietaireDefense, 'ouvrage');
  assert.equal(etat.proprietaireAttaque, 'joueur');
  for (const e of etat.entites) {
    assert.equal(e.proprietaire, e.camp === 'attaque' ? 'joueur' : 'ouvrage');
  }
});


// ---------------------------------------------------------------------------
// T15 — l'alignement de `listeDefense`
// ---------------------------------------------------------------------------

test('T15 — les cadres de listeDefense tombent sur les 9 × 8 cases du champ', () => {
  // T1 vérifie que le MOTEUR retrouve la case de l'éditeur. T15 vérifie que le
  // DESSIN la retrouve aussi : sans lui, l'éditeur pourrait montrer une grille
  // décalée d'une rangée et poser juste quand même — le joueur viserait à côté.
  //
  // ⚠ On remplit avec une UNITÉ, pas avec une structure : `dessinerStructure`
  // pousse elle aussi un `cadre`, et le filtre compterait 76 cadres au lieu des
  // 72 cases. `dessinerEscouade` ne pousse que des `rect`, le filtre ne voit
  // donc que les cadres de case.
  //
  // ⚠ On remplit les colonnes 1 à 6 dans CHAQUE rangée, jamais en quinconce :
  // un dessin qui ne cadrerait que les cases occupées rendrait alors six
  // abscisses au lieu de neuf, et l'égalité d'ensembles le ferait tomber.
  let grille = defenseVide(50);
  for (let rangee = PREMIERE_RANGEE; rangee <= DERNIERE_RANGEE; rangee += 1) {
    for (let colonne = 1; colonne <= OCCUPANTS_MAX_PAR_RANGEE; colonne += 1) {
      grille = poser(grille, { rangee, colonne, id: 'meute' });
    }
  }
  assert.equal(bilan(grille).emplacementsOccupes, NB_RANGEES * OCCUPANTS_MAX_PAR_RANGEE);

  for (const [largeur, hauteur] of VIEWPORTS) {
    const projection = calculerProjection(largeur, hauteur);
    const cadres = listeDefense(grille, projection).filter((p) => p.forme === 'cadre');
    assert.equal(cadres.length, NB_EMPLACEMENTS,
      `${largeur}×${hauteur} : ${cadres.length} cadres pour ${NB_EMPLACEMENTS} cases`);

    // ÉGALITÉ D'ENSEMBLES, pas inclusion : une rangée oubliée doit tomber.
    const attenduX = new Set(Array.from({ length: NB_COLONNES },
      (_, i) => xDeColonne(projection, i + 1)));
    const attenduY = new Set(Array.from({ length: NB_RANGEES },
      (_, i) => yDeRangee(projection, PREMIERE_RANGEE + i)));
    assert.deepEqual(new Set(cadres.map((c) => c.x)), attenduX,
      `${largeur}×${hauteur} : abscisses`);
    assert.deepEqual(new Set(cadres.map((c) => c.y)), attenduY,
      `${largeur}×${hauteur} : ordonnées`);

    // Et chaque couple (x, y) est unique : neuf colonnes × huit rangées, une
    // seule fois chacun. Deux cadres empilés passeraient les deux ensembles.
    assert.equal(new Set(cadres.map((c) => `${c.x},${c.y}`)).size, NB_EMPLACEMENTS,
      `${largeur}×${hauteur} : couples (x, y) distincts`);

    // Le cadre est bien de la taille d'une case.
    for (const c of cadres) {
      assert.equal(c.l, projection.tailleCase);
      assert.equal(c.h, projection.tailleCase);
    }
  }
});

// ---------------------------------------------------------------------------
// T17 — une pièce prise sous un obstacle est signalée, jamais retirée d'office
// ---------------------------------------------------------------------------

test('T17 — un obstacle apparu sous une pièce se signale et se purge sur demande', () => {
  // LA RÈGLE, arbitrée le 25/08/2026 : un obstacle interdit de POSER dessus,
  // rien d'autre. Il ne bloque le déplacement de personne — pour un attaquant
  // il ne fait que ralentir, `vitesse = p.vitesseObstacleMilli` — et les
  // défenses mobiles pourront y aller comme l'offense le jour où elles
  // bougeront. Aujourd'hui aucune ne bouge : `deplacement()` passe tout ce qui
  // n'est pas `camp === 'attaque'`.
  //
  // Donc `poser` refuse, et LUI SEUL.
  // ⚠ Le montage veut un TYPE d'obstacle —  lève sur un type
  // inconnu. L'éditeur, lui, ne lit que la case : il se moque du type.
  const obstacles = [{ type: 'les_deux', rangee: 5, colonne: 3 }];
  assert.throws(() => poser(defenseVide(30, obstacles), { rangee: 5, colonne: 3, id: 'merlon' }),
    /obstacle/);

  // `depuisDefenseurs` est un CHARGEMENT, pas une pose : il accepte. Les
  // obstacles sont tirés par graine, en changer peut en poser un sous une pièce
  // déjà placée — la pièce n'y est pour rien, c'est le terrain qui a bougé.
  // Lever ici ferait planter le chargement au lieu de dégrader.
  const liste = [{ id: 'merlon', rangee: 5, colonne: 3 }, { id: 'ronce', rangee: 6, colonne: 4 }];
  const charge = depuisDefenseurs(liste, 30, obstacles);
  assert.equal(charge.cases[5 - PREMIERE_RANGEE][2], 'merlon', 'le chargement ne lève pas');

  // C'est `bilan` qui juge — troisième défaut à côté de `verrouilles` et du
  // dépassement de budget, et LE SEUL DES TROIS qui rende le montage impossible.
  const b = bilan(charge);
  assert.equal(b.surObstacle.length, 1);
  assert.deepEqual(b.surObstacle[0], { rangee: 5, colonne: 3, id: 'merlon' });
  assert.equal(b.emplacementsOccupes, 2, 'rien n\'a été retiré');
  assert.ok(!b.valide);
  assert.throws(() => creerCombat({
    ...socle(enDefenseurs(charge)), obstacles,
  }), /obstacle/, 'le moteur, lui, refuse');

  // Et `purger` les retire SUR DEMANDE, comme il retire les verrouillées.
  const purge = purger(charge);
  assert.equal(bilan(purge).surObstacle.length, 0);
  assert.equal(bilan(purge).emplacementsOccupes, 1);
  assert.equal(enDefenseurs(purge)[0].id, 'ronce');
  assert.ok(bilan(purge).valide);
  assert.doesNotThrow(() => creerCombat({ ...socle(enDefenseurs(purge)), obstacles }));

  // Contrôle : hors obstacle, `surObstacle` reste vide et `valide` tient.
  assert.deepEqual(bilan(depuisDefenseurs(liste, 30)).surObstacle, []);
  assert.ok(bilan(depuisDefenseurs(liste, 30)).valide);
});

// ---------------------------------------------------------------------------
// T18 — le panneau de fin nomme les survivants selon leur propriétaire
// ---------------------------------------------------------------------------

test('T18 — un objet forgé à la main doit porter son propriétaire', () => {
  // ⚠ CE TEST GARDE UNE RÉGRESSION RÉELLE, arrivée sur `main` et corrigée après
  // coup. Le panneau de fin construit ses lignes de survivants à la main :
  //   nomAffiche({ genre: 'unite', camp: 'attaque', id })
  // Tant que `nomAffiche` lisait le CAMP, ça rendait « Fusiliers ». Le jour où
  // il est passé au PROPRIÉTAIRE, le champ absent a fait retomber l'appel sur
  // les noms de l'Ouvrage — et les survivants du joueur se sont affichés
  // « Meute » en sens Raid. Aucun test ne couvrait ce texte.
  //
  // La leçon tient en une ligne : changer la clé d'une fonction oblige à suivre
  // TOUS ceux qui la lisent, y compris ceux qui lui forgent leur argument.
  const forge = (proprietaire) => nomAffiche({
    genre: 'unite', camp: 'attaque', proprietaire, id: 'meute',
  });
  assert.equal(forge('joueur'), 'Fusiliers', 'sens Raid');
  assert.equal(forge('ouvrage'), 'Meute', 'sens Défense');

  // Et sans propriétaire, la valeur est celle de l'Ouvrage : c'est le piège.
  // L'asserter, c'est empêcher qu'on le prenne pour un défaut à « corriger »
  // dans nomAffiche — le défaut est chez l'appelant qui oublie le champ.
  assert.equal(nomAffiche({ genre: 'unite', camp: 'attaque', id: 'meute' }), 'Meute');
});
