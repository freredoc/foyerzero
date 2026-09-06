// L'ANGLE d'une pièce posée — une dérivation, donc une fonction à falsifier.
//
// CE QUE CE FICHIER DOIT PROUVER, et qui ne va pas de soi :
//
//   1. Que la boussole s'accorde au SENS D'AFFICHAGE. C'est l'absence de cette
//      confrontation qui a laissé passer, jusqu'au 30/08, deux conventions de
//      nord contradictoires dans le dépôt, chacune gardée de son côté. Le test
//      ne connaît aucune valeur d'angle : il compare un sens à une ligne
//      d'écran, et il resterait vrai si les nombres changeaient.
//
//   2. Que l'angle est CONTINU, et pas quantifié. C'est ce que la v2 des sprites
//      achète : la tourelle suit sa cible au degré, là où seize orientations la
//      faisaient sauter par crans de 22,5°. Un test qui n'asserterait que les
//      quatre points cardinaux passerait sur une quantification remise.
//
//   3. Que rien de tout ça n'entre dans la sauvegarde. Une pièce posée puis
//      relue ne doit porter ni angle ni orientation.
//
// ⚠⚠ NEUF TESTS SONT PARTIS AVEC LEUR SUJET AU LOT SPRITES-V2-JOUEUR, ET C'EST
// DÉCLARÉ. Ils gardaient le CHAÎNAGE des murs — `liaisonDuMur`, `liaisonDuSocle`,
// `SE_LIE_AU_MUR`, `PORTEE_AVEC_TOURELLE`, `proprietaireChaine` —, qu'Ethan a
// arbitré supprimé le 05/09 : les pièces ne se raccordent plus, les vingt-quatre
// socles à amorce et les quatre merlons de liaison ne sont plus dessinés, et le
// module ne porte plus une ligne de ce mécanisme. Quatre autres gardaient la
// QUANTIFICATION sur seize secteurs, qui n'a plus rien à quantifier. Aucune
// assertion n'a été assouplie : celles qui disparaissent sont celles dont le
// sujet a disparu, et la garde du sens d'affichage — la plus importante des
// dix-neuf — est REPRISE telle quelle, en degrés au lieu de noms.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ANGLE_PAR_DEFAUT, angleVers, angleDeLaPiece } from '../src/sim/rendu-pose.js';
import { GRILLE } from '../src/data/combat.js';
import { ligneEcranDeLaRangee } from '../src/render/orientation.js';
import { creerEtat, poserEffectif } from '../src/sim/state.js';
import { baseCourante } from '../src/sim/base-courante.js';

const rangee = GRILLE.bandes.defense.premiere;

// ---------------------------------------------------------------------------
// 1. Les quatre points cardinaux, et le sens de rotation
// ---------------------------------------------------------------------------

test('les quatre points cardinaux tombent sur leur angle', () => {
  const t = { rangee: 10, colonne: 5 };
  assert.equal(angleVers(t, { rangee: 15, colonne: 5 }), 0);
  assert.equal(angleVers(t, { rangee: 10, colonne: 9 }), 90);
  assert.equal(angleVers(t, { rangee: 5, colonne: 5 }), 180);
  assert.equal(angleVers(t, { rangee: 10, colonne: 1 }), -90);
});

test('l\'angle est CONTINU, et c\'est ce que la v2 achète', () => {
  // ⚠⚠ SANS CE TEST, UNE QUANTIFICATION REMISE PASSERAIT INAPERÇUE. Les quatre
  // cardinaux ci-dessus sont des multiples de 22,5 : ils tombent juste avec ou
  // sans les seize secteurs. On mesure donc le nombre d'angles DISTINCTS que la
  // grille produit — un modèle à seize secteurs en rendrait au plus seize.
  const t = { rangee: 10, colonne: 5 };
  const angles = new Set();
  for (let r = 1; r <= GRILLE.longueur; r += 1) {
    for (let c = 1; c <= GRILLE.largeur; c += 1) {
      angles.add(angleVers(t, { rangee: r, colonne: c }));
    }
  }
  assert.ok(angles.size > 16,
    `${angles.size} angles distincts sur la grille : la quantification est revenue`);

  // Et il suit une cible qui avance en milli-cases, sans à-coup : deux
  // positions distantes d'un millième de rangée rendent DEUX angles.
  const a = angleVers(t, { rangee: 4.000, colonne: 8 });
  const b = angleVers(t, { rangee: 4.001, colonne: 8 });
  assert.notEqual(a, b, 'un déplacement d\'un millième de rangée ne change pas l\'angle');
});

test('sans cible, la garnison regarde au sud et l\'armée au nord', () => {
  const p = { rangee, colonne: 5 };
  assert.equal(angleDeLaPiece('garnison', p, null), 180);
  assert.equal(angleDeLaPiece('armee', p, null), 0);
  assert.equal(ANGLE_PAR_DEFAUT.garnison, 180);
  assert.equal(ANGLE_PAR_DEFAUT.armee, 0);
});

test('une force inconnue est refusée au lieu d\'orienter au nord en silence', () => {
  assert.throws(() => angleDeLaPiece('milice', { rangee: 1, colonne: 1 }, null), /force/);
});

test('une cible sur la case du tireur rend le défaut, pas un angle inventé', () => {
  const p = { rangee, colonne: 5 };
  assert.equal(angleVers(p, p, 180), 180);
  assert.equal(angleVers(p, p), 0);
  assert.equal(angleDeLaPiece('garnison', p, { ...p }), 180,
    'une tourelle qui se vise elle-même doit garder son angle de repos');
});

test('un écart non fini LÈVE au lieu de rendre NaN', () => {
  // ⚠ C'EST LA FAUTE QUI SE COMMET VRAIMENT : une entité de combat range son
  // ordonnée dans `rangeeMilli`, et lui passer l'entité telle quelle donne
  // `undefined - 10`, donc `NaN`. Un `NaN` passé à `rotate()` ne lève pas et ne
  // dessine pas — la tourelle disparaîtrait sans un mot. Trouvé au lot
  // STRUCTURES-AU-COMBAT sur l'ancienne fonction, gardé ici sur la neuve.
  const t = { rangee: 10, colonne: 5 };
  assert.throws(() => angleVers(t, { colonne: 5 }), /écart de case/);
  assert.throws(() => angleVers(t, { rangee: 5 }), /écart de case/);
});

// ---------------------------------------------------------------------------
// 2. Rien n'entre dans la sauvegarde
// ---------------------------------------------------------------------------

test('poser une pièce avec un angle ne le sauvegarde pas', () => {
  // C'est l'assertion qui garantit que SAVE_VERSION peut rester où il est. Elle
  // documente aussi le piège : `poserEffectif` recopie champ par champ, donc le
  // champ surnuméraire disparaît SANS ERREUR. Si un jour l'angle devait être
  // stocké, ce test tomberait et dirait pourquoi.
  const etat = creerEtat();
  poserEffectif(etat, 'garnison', {
    id: 'merlon', rangee, colonne: 4, niveau: 1, angle: 112.5,
  });
  const posee = baseCourante(etat).garnison[baseCourante(etat).garnison.length - 1];
  assert.equal(posee.angle, undefined,
    'un angle posé a été sauvegardé — SAVE_VERSION et la migration sont à revoir');
  assert.deepEqual(
    Object.keys(posee).sort(),
    ['colonne', 'degatsMilli', 'id', 'niveau', 'rangee'],
  );
});

// ---------------------------------------------------------------------------
// 3. La boussole confrontée au sens d'affichage
// ---------------------------------------------------------------------------

test('la boussole s\'accorde à l\'écran — la composante verticale suit la ligne', () => {
  // ⚠⚠ C'EST L'ABSENCE DE CE TEST-LÀ QUI A LAISSÉ PASSER LA CONTRADICTION.
  // `rendu-pose.js` et `render/orientation.js` portaient chacun un sens, tous
  // deux gardés, et RIEN ne les confrontait : le premier disait que le nord est
  // la rangée décroissante, le second que la rangée 18 se dessine en première
  // ligne. Deux modules justes séparément, faux ensemble.
  //
  // Ce test ne connaît aucune valeur d'angle : il compare un SENS à un autre. Il
  // resterait vrai si l'unité changeait — c'est d'ailleurs ce qui vient
  // d'arriver, il est passé des seize noms aux degrés sans qu'une assertion
  // bouge.
  const verticale = (a) => {
    const d = ((a % 360) + 360) % 360;
    if (d < 90 || d > 270) return 'haut';
    if (d > 90 && d < 270) return 'bas';
    return 'aucune';
  };

  const cas = [
    ['garnison vers l\'assaut', { rangee: 5, colonne: 5 }, { rangee: 2, colonne: 5 }],
    ['garnison vers le déploiement', { rangee: 5, colonne: 5 }, { rangee: 1, colonne: 5 }],
    ['armée vers la base', { rangee: 2, colonne: 5 }, { rangee: 15, colonne: 5 }],
    ['tourelle du fond vers l\'avant', { rangee: 10, colonne: 3 }, { rangee: 3, colonne: 3 }],
  ];

  for (const [quoi, tireur, cible] of cas) {
    const ligneTireur = ligneEcranDeLaRangee(tireur.rangee);
    const ligneCible = ligneEcranDeLaRangee(cible.rangee);

    // ⚠ D'ABORD : LE MONTAGE MESURE-T-IL QUELQUE CHOSE ? Deux pièces sur la
    // même ligne d'écran ne diraient rien du sens vertical, et la comparaison
    // ci-dessous passerait sur n'importe quel code.
    assert.notEqual(ligneCible, ligneTireur, `${quoi} : les deux lignes d'écran sont égales`);

    const attendu = ligneCible > ligneTireur ? 'bas' : 'haut';
    const rendu = verticale(angleVers(tireur, cible));
    assert.equal(rendu, attendu,
      `${quoi} : la cible est en ligne ${ligneCible} contre ${ligneTireur} pour le tireur, `
      + `donc vers le ${attendu} de l'écran, et la boussole rend « ${rendu} »`);
  }

  // Et les deux ANGLES PAR DÉFAUT s'accordent au même sens : au repos, la
  // garnison fait face au déploiement, l'armée fait face à la base.
  const bandeDefense = GRILLE.bandes.defense;
  const garnison = { rangee: bandeDefense.premiere, colonne: 5 };
  const versLAssaut = { rangee: 1, colonne: 5 };
  assert.ok(ligneEcranDeLaRangee(versLAssaut.rangee) > ligneEcranDeLaRangee(garnison.rangee),
    'le déploiement doit se dessiner plus bas que la bande de défense');
  assert.equal(verticale(ANGLE_PAR_DEFAUT.garnison), 'bas',
    'la garnison au repos doit regarder vers le bas de l\'écran');
  assert.equal(verticale(ANGLE_PAR_DEFAUT.armee), 'haut',
    'l\'armée au repos doit regarder vers le haut de l\'écran');

  // Falsifiable : le lecteur de composante verticale distingue bien les trois
  // cas, sinon toutes les assertions ci-dessus compareraient « aucune » à
  // « aucune ».
  assert.deepEqual([verticale(0), verticale(180), verticale(90)], ['haut', 'bas', 'aucune']);
});
