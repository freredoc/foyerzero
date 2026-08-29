// La carte monde — position, niveau, extrémités.
//
// CE QUE CE FICHIER DOIT PROUVER : que la traduction d'une DISTANCE
// (« 25 cases depuis le bord bas ») en COORDONNÉE (rangée 275) est la bonne, et
// qu'elle n'a pas été choisie mais déduite.
//
// ⚠ L'INVARIANT QUI FIXE TOUT. `GEOGRAPHIE.departJoueur` porte deux faits liés :
// `strate: 5` et `casesDepuisBordBas: 25`. Avec `niveauParCase: 0.2`, un seul
// décalage de rangée les rend tous les deux vrais. Ce n'est donc pas un « plus
// ou moins un » tranché à la main : c'est le seul qui passe. Le test l'asserte
// de face — décaler d'une rangée fait tomber la strate à 4,8 arrondie, et la
// suite avec.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  colonneCentre, niveauDeLaRangee, casesDepuisBordBas,
  positionDepartJoueur, positionBaseTerminale, estSurLaCarte,
} from '../src/sim/carte.js';
import { GEOGRAPHIE } from '../src/data/sites.js';

test('carte — le départ du joueur tombe sur la strate arbitrée, sans réglage', () => {
  const depart = positionDepartJoueur();

  // MESURÉ : rangée 275, colonne 16. Les deux faits de GEOGRAPHIE doivent être
  // vrais EN MÊME TEMPS, et c'est ça qui vaut preuve.
  assert.equal(
    casesDepuisBordBas(depart.rangee), GEOGRAPHIE.departJoueur.casesDepuisBordBas,
    'la distance au bord bas ne vaut plus 25',
  );
  assert.equal(
    niveauDeLaRangee(depart.rangee), GEOGRAPHIE.departJoueur.strate,
    'la strate de départ ne vaut plus 5',
  );
  assert.equal(depart.rangee, 275);
  assert.equal(depart.colonne, 16);

  // Falsifiable : une rangée voisine ne doit PAS satisfaire les deux à la fois.
  // Sans ça, l'accord ci-dessus ne prouverait pas que le décalage est unique.
  for (const voisine of [depart.rangee - 1, depart.rangee + 1]) {
    const memeDistance = casesDepuisBordBas(voisine) === GEOGRAPHIE.departJoueur.casesDepuisBordBas;
    const memeStrate = niveauDeLaRangee(voisine) === GEOGRAPHIE.departJoueur.strate;
    assert.ok(
      !(memeDistance && memeStrate),
      `la rangée ${voisine} satisfait aussi les deux : le décalage n'est pas unique`,
    );
  }
});

test('carte — le niveau monte en s\'éloignant du bord bas, et se plafonne', () => {
  // Le bord bas vaudrait le niveau 0, qui n'existe pas : il est ramené à 1.
  // C'est pour ça que le joueur ne peut PAS démarrer « tout en bas » au sens
  // littéral, et c'est la raison pour laquelle GEOGRAPHIE dit 25 cases.
  assert.equal(casesDepuisBordBas(GEOGRAPHIE.carte.hauteur), 0);
  assert.equal(niveauDeLaRangee(GEOGRAPHIE.carte.hauteur), 1, 'le bord bas doit valoir 1, pas 0');

  // Le haut est plafonné.
  assert.equal(niveauDeLaRangee(1), GEOGRAPHIE.niveauPlafond);

  // Croissance large sur toute la hauteur : jamais décroissante en montant.
  for (let r = GEOGRAPHIE.carte.hauteur; r > 1; r--) {
    assert.ok(
      niveauDeLaRangee(r - 1) >= niveauDeLaRangee(r),
      `le niveau baisse en montant, entre les rangées ${r} et ${r - 1}`,
    );
  }
  // Et strictement croissante quelque part, sinon « jamais décroissante »
  // passerait sur une fonction constante.
  assert.ok(niveauDeLaRangee(275) > niveauDeLaRangee(299));

  // MESURÉ : le plafond mord à la rangée 52, soit 248 cases du bas. Au-delà,
  // 250 cases donneraient 50 aussi — c'est le plafond, pas la pente.
  assert.equal(niveauDeLaRangee(52), 50);
  assert.equal(niveauDeLaRangee(53), 49);
  assert.equal(casesDepuisBordBas(52), 248);

  assert.throws(() => niveauDeLaRangee(0), RangeError);
  assert.throws(() => niveauDeLaRangee(GEOGRAPHIE.carte.hauteur + 1), RangeError);
  assert.throws(() => niveauDeLaRangee(12.5), RangeError);
});

test('carte — le centre est EXACT depuis que la largeur est impaire', () => {
  // ⚠ CE TEST A CHANGÉ DE SENS LE 29/08, ET C'EST LE POINT. Il s'appelait « le
  // centre d'une largeur PAIRE est tranché une seule fois » et commençait par
  // exiger `largeur % 2 === 0` : à 30 colonnes il n'y a pas de centre, il fallait
  // choisir entre 15 et 16, et tout ce que le test pouvait vérifier c'est que
  // les deux bouts du couloir employaient LE MÊME choix.
  //
  // À 31, le centre existe : c'est (31 + 1) / 2 = 16, exactement ce que la
  // fonction rendait déjà. Le passage de 30 à 31 n'a donc déplacé NI le départ
  // du joueur NI la base terminale — c'est la raison pour laquelle 31 a été
  // retenu plutôt que 29, qui aurait mis le centre en 15 et déplacé les deux.
  //
  // On asserte maintenant l'égalité au centre exact, ce qui est strictement plus
  // fort : l'ancienne version acceptait 15 comme 16.
  assert.equal(GEOGRAPHIE.carte.largeur % 2, 1, 'largeur paire : le centre exact n\'existe plus');
  assert.equal(colonneCentre(), (GEOGRAPHIE.carte.largeur + 1) / 2);
  assert.equal(colonneCentre(), 16);
  assert.equal(positionDepartJoueur().colonne, colonneCentre());
  assert.equal(positionBaseTerminale().colonne, colonneCentre());

  // Le centre doit être sur la carte, et à peu près au milieu : à une colonne
  // près des deux bords, la moitié de la largeur.
  assert.ok(colonneCentre() >= 1 && colonneCentre() <= GEOGRAPHIE.carte.largeur);
  // Autant de colonnes à gauche qu'à droite : c'est ce que « centre exact » veut
  // dire, et une largeur paire ne peut pas le satisfaire.
  assert.equal(colonneCentre() - 1, GEOGRAPHIE.carte.largeur - colonneCentre());
});

test('carte — la base terminale est au bout du couloir, au plafond de niveau', () => {
  const bout = positionBaseTerminale();
  // 25 cases depuis le bord HAUT, donc rangée 26.
  assert.equal(bout.rangee, 1 + GEOGRAPHIE.baseTerminale.casesDepuisBordHaut);
  assert.equal(bout.rangee, 26);
  assert.equal(niveauDeLaRangee(bout.rangee), GEOGRAPHIE.niveauPlafond);

  // Elle est bien à l'autre bout que le joueur, et de loin : le couloir doit
  // faire plus de deux cents cases, sinon la progression n'a pas de place.
  const depart = positionDepartJoueur();
  assert.ok(depart.rangee > bout.rangee, 'le joueur doit démarrer PLUS BAS que le bout');
  assert.ok(depart.rangee - bout.rangee > 200, `${depart.rangee - bout.rangee} cases de couloir`);

  // Si quelqu'un écrit une colonne autre que « centre » dans GEOGRAPHIE sans
  // dire laquelle, la fonction doit lever plutôt que d'inventer.
  const sauvegarde = GEOGRAPHIE.baseTerminale.colonne;
  GEOGRAPHIE.baseTerminale.colonne = 'gauche';
  assert.throws(() => positionBaseTerminale(), /non traduite/);
  GEOGRAPHIE.baseTerminale.colonne = sauvegarde;
  assert.equal(positionBaseTerminale().colonne, 16, 'la table doit être rendue intacte');
});

test('carte — estSurLaCarte connaît ses quatre bords', () => {
  const { largeur, hauteur } = GEOGRAPHIE.carte;
  assert.ok(estSurLaCarte(1, 1) && estSurLaCarte(hauteur, largeur));
  assert.ok(estSurLaCarte(1, largeur) && estSurLaCarte(hauteur, 1));
  assert.ok(!estSurLaCarte(0, 1) && !estSurLaCarte(1, 0));
  assert.ok(!estSurLaCarte(hauteur + 1, 1) && !estSurLaCarte(1, largeur + 1));
  assert.ok(!estSurLaCarte(1.5, 1) && !estSurLaCarte(1, NaN));

  // Les deux positions remarquables sont sur la carte : ça n'a l'air de rien,
  // mais c'est le premier contrôle qui tomberait si une distance dépassait la
  // hauteur.
  assert.ok(estSurLaCarte(positionDepartJoueur().rangee, positionDepartJoueur().colonne));
  assert.ok(estSurLaCarte(positionBaseTerminale().rangee, positionBaseTerminale().colonne));
});
