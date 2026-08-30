// Orientation et chaînage — deux dérivations, donc deux fonctions à falsifier.
//
// CE QUE CE FICHIER DOIT PROUVER, et qui ne va pas de soi :
//
//   1. Que les seize orientations sont ATTEIGNABLES par le résolveur, et pas
//      seulement déclarées. Un sprite qu'aucune configuration de grille ne peut
//      produire serait du poids mort qu'aucun test d'aller-retour ne verrait.
//      L'assertion énumère donc les cases à portée et compte les secteurs
//      touchés — c'est une lecture du MODÈLE, pas de la fonction.
//
//   2. Que la quantification arrondit au plus proche et non vers le bas. Un
//      `floor` passerait tous les tests d'angles pile sur un multiple de 22,5 ;
//      il faut donc asserter au MILIEU des secteurs et juste avant la bascule.
//
//   3. Que le chaînage lit les tables et non une liste recopiée. Le test croise
//      `SE_LIE_AU_MUR` avec `DEFENSES` : si quelqu'un fige la liste à la main,
//      l'ajout d'une défense fera tomber ce test.
//
//   4. Que rien de tout ça n'entre dans la sauvegarde. Une pièce posée puis
//      relue ne doit pas porter d'orientation — c'est ce qui garantit que
//      `SAVE_VERSION` peut rester à 13.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ORIENTATIONS, ORIENTATION_PAR_DEFAUT, SE_LIE_AU_MUR, LIAISONS,
  orientationDeLAngle, orientationVers, orientationDeLaPiece, PORTEE_AVEC_TOURELLE,
  liaisonDuMur, liaisonDuSocle, campChaine,
} from '../src/sim/rendu-pose.js';
import { GRILLE, DEFENSES } from '../src/data/combat.js';
import { creerEtat, poserEffectif } from '../src/sim/state.js';

// ---------------------------------------------------------------------------
// 1. Les seize orientations sont atteignables — lecture du modèle
// ---------------------------------------------------------------------------

test('les seize secteurs sont atteignables aux deux portées de défense', () => {
  // Seules les portées des défenses À TOURELLE : la ronce et la herse ont une
  // portée de 1 sans tourelle, et n'ont donc pas d'orientation à afficher.
  const portees = [...new Set(
    Object.values(DEFENSES).map((d) => d.portee).filter((p) => p >= PORTEE_AVEC_TOURELLE),
  )];
  assert.ok(portees.length >= 2, 'au moins deux portées distinctes attendues');

  for (const portee of portees) {
    const touches = new Set();
    // Toutes les cases de la grille, en écart relatif à un tireur quelconque.
    for (let dr = -(GRILLE.longueur - 1); dr <= GRILLE.longueur - 1; dr += 1) {
      for (let dc = -(GRILLE.largeur - 1); dc <= GRILLE.largeur - 1; dc += 1) {
        if (dr === 0 && dc === 0) continue;
        if (dr * dr + dc * dc > portee * portee) continue;
        touches.add(orientationVers({ rangee: 0, colonne: 0 }, { rangee: dr, colonne: dc }));
      }
    }
    assert.equal(
      touches.size, ORIENTATIONS.length,
      `portée ${portee} : ${touches.size} secteurs atteints sur ${ORIENTATIONS.length} — `
      + `manquants ${ORIENTATIONS.filter((o) => !touches.has(o)).join(', ')}`,
    );
  }
});

// ---------------------------------------------------------------------------
// 2. La quantification arrondit au plus proche
// ---------------------------------------------------------------------------

test('les quatre points cardinaux tombent sur leur clé', () => {
  assert.equal(orientationDeLAngle(0), 'n');
  assert.equal(orientationDeLAngle(90), 'e');
  assert.equal(orientationDeLAngle(180), 's');
  assert.equal(orientationDeLAngle(270), 'o');
});

test('un angle au milieu de son secteur y reste, un angle juste après bascule', () => {
  // Le secteur `n` couvre -11,25 à +11,25. Un `floor` rendrait `n` pour 20°,
  // qui appartient à `nne` : c'est exactement ce que cette assertion attrape.
  assert.equal(orientationDeLAngle(11), 'n');
  assert.equal(orientationDeLAngle(12), 'nne');
  assert.equal(orientationDeLAngle(20), 'nne');
  assert.equal(orientationDeLAngle(-11), 'n');
  assert.equal(orientationDeLAngle(-12), 'nno');
});

test('un angle hors de zéro à trois-cent-soixante est ramené', () => {
  assert.equal(orientationDeLAngle(360), 'n');
  assert.equal(orientationDeLAngle(450), 'e');
  assert.equal(orientationDeLAngle(-90), 'o');
});

test('la rangée croît vers le bas, donc le nord est la rangée décroissante', () => {
  const tireur = { rangee: 10, colonne: 5 };
  assert.equal(orientationVers(tireur, { rangee: 5, colonne: 5 }), 'n');
  assert.equal(orientationVers(tireur, { rangee: 15, colonne: 5 }), 's');
  assert.equal(orientationVers(tireur, { rangee: 10, colonne: 9 }), 'e');
  assert.equal(orientationVers(tireur, { rangee: 10, colonne: 1 }), 'o');
  assert.equal(orientationVers(tireur, { rangee: 5, colonne: 10 }), 'ne');
});

test('sans cible, la garnison regarde au sud et l’armée au nord', () => {
  const p = { rangee: 4, colonne: 4 };
  assert.equal(orientationDeLaPiece('garnison', p, null), 's');
  assert.equal(orientationDeLaPiece('armee', p, null), 'n');
  assert.equal(ORIENTATION_PAR_DEFAUT.garnison, 's');
  assert.equal(ORIENTATION_PAR_DEFAUT.armee, 'n');
});

test('une force inconnue est refusée au lieu d’orienter au nord en silence', () => {
  assert.throws(() => orientationDeLaPiece('milice', { rangee: 1, colonne: 1 }, null), /force/);
});

test('une cible sur la case du tireur rend le défaut, pas un angle inventé', () => {
  const p = { rangee: 3, colonne: 3 };
  assert.equal(orientationVers(p, p, 's'), 's');
});

// ---------------------------------------------------------------------------
// 3. Le chaînage lit les tables
// ---------------------------------------------------------------------------

test('toute défense à tourelle se lie au mur, sans liste recopiée', () => {
  for (const [id, d] of Object.entries(DEFENSES)) {
    if (d.portee >= PORTEE_AVEC_TOURELLE) {
      assert.ok(SE_LIE_AU_MUR.has(id), `${id} a une tourelle mais ne se lie pas`);
    }
  }
  assert.ok(SE_LIE_AU_MUR.has('merlon'), 'un mur se lie à un mur');
  assert.equal(SE_LIE_AU_MUR.size, 7, 'six défenses à tourelle plus le merlon');
});

test('la ronce et la herse ont une portée mais pas de tourelle, donc ne lient pas', () => {
  // C'est le piège du premier jet : filtrer sur « portée non nulle » les faisait
  // entrer. Elles blessent au contact, elles n'ont ni socle ni tourelle.
  for (const id of ['ronce', 'herse']) {
    assert.ok(DEFENSES[id].portee > 0, `${id} devrait avoir une portée non nulle`);
    assert.ok(!SE_LIE_AU_MUR.has(id), `${id} n'a pas de tourelle et ne devrait pas se lier`);
  }
  assert.ok(!SE_LIE_AU_MUR.has('merlon_inexistant'));
});

test('les quatre états de liaison, et le camp Ouvrage n’en lit qu’un', () => {
  assert.deepEqual(LIAISONS, ['isole', 'est', 'ouest', 'traversant']);
  assert.ok(campChaine('joueur'));
  assert.ok(!campChaine('ouvrage'));
});

const rangee = GRILLE.bandes.defense.premiere;

test('un mur seul est isolé, avec un voisin il pointe du bon côté', () => {
  const mur = { id: 'merlon', rangee, colonne: 4 };
  assert.equal(liaisonDuMur([mur], mur), 'isole');
  assert.equal(
    liaisonDuMur([mur, { id: 'casemate', rangee, colonne: 5 }], mur), 'est',
  );
  assert.equal(
    liaisonDuMur([mur, { id: 'casemate', rangee, colonne: 3 }], mur), 'ouest',
  );
  assert.equal(
    liaisonDuMur(
      [mur, { id: 'casemate', rangee, colonne: 3 }, { id: 'merlon', rangee, colonne: 5 }],
      mur,
    ),
    'traversant',
  );
});

test('une voisine d’une AUTRE rangée ne compte pas', () => {
  const mur = { id: 'merlon', rangee, colonne: 4 };
  assert.equal(
    liaisonDuMur([mur, { id: 'casemate', rangee: rangee + 1, colonne: 5 }], mur), 'isole',
  );
});

test('une défense sans portée ne raccorde pas le mur', () => {
  const mur = { id: 'merlon', rangee, colonne: 4 };
  assert.equal(liaisonDuMur([mur, { id: 'ronce', rangee, colonne: 5 }], mur), 'isole');
});

test('le bord de grille n’est pas une voisine', () => {
  const bord = { id: 'merlon', rangee, colonne: 1 };
  assert.equal(liaisonDuMur([bord], bord), 'isole');
  const droite = { id: 'merlon', rangee, colonne: GRILLE.largeur };
  assert.equal(liaisonDuMur([droite], droite), 'isole');
});

test('le camp Ouvrage reste isolé quelles que soient ses voisines', () => {
  const mur = { id: 'merlon', rangee, colonne: 4 };
  const garnison = [
    mur,
    { id: 'casemate', rangee, colonne: 3 },
    { id: 'casemate', rangee, colonne: 5 },
  ];
  assert.equal(liaisonDuMur(garnison, mur, 'joueur'), 'traversant');
  assert.equal(liaisonDuMur(garnison, mur, 'ouvrage'), 'isole');
});

test('le socle d’une tourelle ne pousse une amorce que vers un MUR', () => {
  const tourelle = { id: 'casemate', rangee, colonne: 4 };
  // Deux tourelles côte à côte ne se soudent pas — c'est la différence avec
  // `liaisonDuMur`, qui rendrait `est` sur la même configuration.
  const deuxTourelles = [tourelle, { id: 'batterie', rangee, colonne: 5 }];
  assert.equal(liaisonDuSocle(deuxTourelles, tourelle), 'isole');
  assert.equal(liaisonDuMur(deuxTourelles, tourelle), 'est');

  assert.equal(
    liaisonDuSocle([tourelle, { id: 'merlon', rangee, colonne: 5 }], tourelle), 'est',
  );
  assert.equal(
    liaisonDuSocle(
      [tourelle, { id: 'merlon', rangee, colonne: 3 }, { id: 'merlon', rangee, colonne: 5 }],
      tourelle,
    ),
    'traversant',
  );
});

// ---------------------------------------------------------------------------
// 4. Rien n'entre dans la sauvegarde
// ---------------------------------------------------------------------------

test('poser une pièce avec une orientation ne la sauvegarde pas', () => {
  // C'est l'assertion qui garantit que SAVE_VERSION peut rester où il est. Elle
  // documente aussi le piège : `poserEffectif` recopie champ par champ, donc le
  // champ surnuméraire disparaît SANS ERREUR. Si un jour l'orientation devait
  // être stockée, ce test tomberait et dirait pourquoi.
  const etat = creerEtat();
  poserEffectif(etat, 'garnison', {
    id: 'merlon', rangee, colonne: 4, niveau: 1, orientation: 'ese',
  });
  const posee = etat.garnison[etat.garnison.length - 1];
  assert.equal(posee.orientation, undefined,
    'une orientation posée a été sauvegardée — SAVE_VERSION et la migration sont à revoir');
  assert.deepEqual(
    Object.keys(posee).sort(),
    ['colonne', 'degatsMilli', 'id', 'niveau', 'rangee'],
  );
});
