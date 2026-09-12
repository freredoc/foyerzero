// LE CHEVAUCHEMENT ALLIÉ INTERDIT, ET LE REPLI QUI NE MORD PLUS DERRIÈRE UNE
// ALLIÉE — lot BARÈME-ET-REJEU, 12/09/2026.
//
// ⚠⚠ CE FICHIER NE PORTE QU'UN TEST, ET C'EST DÉCLARÉ. Le §7 du brief en
// demande DEUX : T1 sur le chevauchement, T2 sur le rejeu d'un raid depuis le
// journal. **LE T2 DU BRIEF N'EST PAS ÉCRIT, parce que le §4 s'est arrêté sur sa
// propre condition d'arrêt** — « mesurer le coût AVANT de le faire, et le publier
// […] si le surcoût d'une sauvegarde dépasse ce qui paraît raisonnable, s'arrêter
// et le dire à Ethan plutôt que de tailler dans le montage : un montage incomplet
// rejoue faux, et un rejeu faux est pire qu'aucun rejeu. » Le coût mesuré porte
// la sauvegarde à **dix fois** sa taille ; il n'y a donc rien à garder, et écrire
// un T2 sur un rejeu qu'on n'a pas fait serait pire que de n'en pas écrire. Tout
// est chiffré dans `RAPPORT-lotBAREME-ET-REJEU.md`.
//
// ⚠⚠ ET LE SECOND TEST DU LOT EXISTE, SOUS LE NOM `BR T2`, DANS
// `test/monde.test.js` — LE POINT 5 À LA PLACE DU REJEU. Le compte du brief est
// donc tenu, deux tests entrent, et la SUBSTITUTION est déclarée : le §5 corrige
// une régression qu'Ethan a vue, et une régression corrigée sans garde revient.
// Il n'est pas ici parce qu'il a besoin du FAUX DOCUMENT de l'écran Monde, qui
// est local à ce fichier-là : le recopier ici en aurait fait deux, dont un seul
// aurait reçu la prochaine correction — `CLAUDE.md` §4 le refuse. Les guides de
// l'écran vivent dans le fichier de leur écran, à côté de `PC T3`, dont `BR T2`
// est la moitié comportementale.
//
// ⚠ ET LES DEUX AUTRES MOITIÉS DU LOT SONT GARDÉES AILLEURS, LÀ OÙ ELLES
// VIVENT : le barème de défense par `test/defense.test.js` (T2 et T7 réécrits),
// le refus d'améliorer une pièce abîmée par `test/state.test.js` et `CH-F T8` de
// `test/chantier.test.js`, et le déplacement du combat par les deux témoins —
// `JOURNAL T1`, `JOURNAL T1 bis` et les trois `BASES-0 T1`.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { creerCombat, tick, TICKS_AVANT_REPLI } from '../src/sim/combat.js';
import { MILLI_PAR_CASE } from '../src/sim/grille.js';
import { GRILLE, UNITES } from '../src/data/combat.js';

/** Joue jusqu'au tick voulu, ou jusqu'à la fin du combat. */
function jouer(etat, jusquAuTick) {
  while (etat.tick < jusquAuTick && !etat.termine) tick(etat);
  return etat;
}

// ---------------------------------------------------------------------------
// T1 — aucun chevauchement allié, et pas de repli derrière une alliée
// ---------------------------------------------------------------------------

test('BR T1 — derrière une alliée : rangée sur un multiple exact, et encore là au double du délai de repli', () => {
  // ⚠⚠ CE MONTAGE EST LA REPRODUCTION LITTÉRALE DE CE QU'ETHAN A VU SUR UNE
  // VRAIE PARTIE, LE 12/09 : « les véhicules étaient à 80 % sur l'infanterie,
  // plutôt que d'attendre derrière. Puis ils ont disparu. Mais 0 détruit. »
  // **Les deux moitiés de sa phrase sont DEUX règles distinctes**, et ce test les
  // garde ensemble parce qu'elles se produisent ensemble — mais chaque assertion
  // NOMME la sienne, pour qu'un lot qui ne défait qu'une des deux corrections
  // sache laquelle il a défaite.
  //
  //   A — un Guetteur, la plus LENTE du roster (60 milli/tick), posé au FOND en
  //       rangée 18 : il ne peut plus avancer. Le bâtiment est à DEUX colonnes de
  //       lui, donc dans sa portée de 2,5 (4 ≤ 6,25) : il TIRE, donc son compteur
  //       d'inutilité reste à zéro et il ne quitte pas le champ. C'est ce qui
  //       tient la file bloquée plus longtemps que le délai de repli.
  //   B — un Ratisseur, DEUX FOIS plus rapide (120 milli/tick), en rangée 17,
  //       derrière A dans la même colonne. Sa portée ne vaut que 1,5, et le
  //       bâtiment est à distance carrée 5 de lui : **aucun ennemi à sa portée**,
  //       donc rien ne remettrait son compteur à zéro de lui-même.
  //
  // ⚠⚠ ET LE MONTAGE SE PROUVE AVANT D'ASSERTER QUOI QUE CE SOIT : les quatre
  // faits dont il dépend — A au fond, A qui tire, B qui ne tire pas, B derrière A
  // — sont vérifiés plus bas. Sans eux, ce test passerait sur n'importe quel code.
  //
  // ⚠⚠ FALSIFICATION, MESURÉE SUR LE LIVRABLE PRISTINE DE `main` = `f6fb04e` :
  //
  //                                   AVANT          APRÈS
  //   position de B                   **17 960**     **17 000**
  //   figée à partir du tick          9              2
  //   son compteur part au tick       9              79
  //   `sorti = true`                  **tick 38**    **jamais**
  //
  // 17 960, c'est **96 % dans la case 18 — celle de A**, et c'est très exactement
  // le « à 80 % sur l'infanterie » d'Ethan : `yDeRangeeMilli` projette la
  // POSITION et non l'index, donc le sprite se dessine là où le nombre le met.
  // Et `sorti = true` au tick 38, c'est « puis ils ont disparu. Mais 0 détruit » :
  // une unité sortie compte parmi les SURVIVANTS, donc elle n'apparaît dans aucun
  // décompte de pertes.
  //
  // ⚠ LE BRIEF ANNONÇAIT « `sorti = true` AU TICK 30 » : mesuré, c'est le **38**.
  // Son compteur ne part qu'au tick 9, une fois le fluage terminé — pendant les
  // huit premiers ticks B AVANCE pour de bon, donc `progresse` est vrai et le
  // compteur reste à zéro. Écart déclaré ; il ne change rien à la propriété.
  const A = { id: 'guetteur', rangee: GRILLE.bandes.batiments.derniere, colonne: 5 };
  const B = { id: 'ratisseur', rangee: GRILLE.bandes.batiments.derniere - 1, colonne: 5 };
  const montage = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [{ id: 'gangue', rangee: GRILLE.bandes.batiments.derniere, colonne: 7 }],
    defenseurs: [],
    vagues: [[A, B]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] },
    },
  };

  // ⚠⚠ LE MONTAGE MESURE-T-IL QUELQUE CHOSE ? LES QUATRE PRÉMISSES D'ABORD.
  // Un test qui asserte le champ que le patch vient d'écrire ne peut pas échouer ;
  // celles-ci disent que le cas visé est bien le cas monté.
  assert.ok(UNITES[A.id].vitesse < UNITES[B.id].vitesse,
    'la seconde doit être plus RAPIDE que la première, sinon elle ne la rattrape pas');
  const dcA = montage.batiments[0].colonne - A.colonne;
  const dcB = montage.batiments[0].colonne - B.colonne;
  const drB = montage.batiments[0].rangee - B.rangee;
  assert.ok(dcA * dcA <= UNITES[A.id].portee * UNITES[A.id].portee,
    'A doit avoir le bâtiment à sa portée, sinon son compteur monte et elle rentre');
  assert.ok(drB * drB + dcB * dcB > UNITES[B.id].portee * UNITES[B.id].portee,
    'B ne doit AVOIR AUCUN ennemi à sa portée, sinon son tir remettrait son compteur à zéro');
  assert.equal(A.rangee, GRILLE.bandes.batiments.derniere,
    'A doit être au FOND : ailleurs elle avancerait et libérerait la case');

  const etat = creerCombat(montage);
  const devant = etat.entites.find((e) => e.id === A.id);
  const derriere = etat.entites.find((e) => e.id === B.id);
  assert.equal(derriere.colonne ?? derriere.colonneMilli / MILLI_PAR_CASE, A.colonne,
    'les deux doivent être dans la MÊME colonne, sinon B n\'est pas derrière A');

  // --- PREMIÈRE MOITIÉ : B se RANGE sur sa case, elle ne flue pas -------------
  //
  // ⚠ MESURÉE AU TICK 2 PARCE QUE C'EST LÀ QUE LE FLUAGE COMMENÇAIT. Avant le
  // lot, B partait à 17 120 dès le premier tick puis montait jusqu'à 17 960 ;
  // désormais elle ne bouge plus d'un millième dès qu'elle est au contact.
  jouer(etat, 2);
  // ⚠ ET C'EST ICI QUE LA PRÉMISSE « A TIRE » SE MESURE, pas au tick 60 : sa
  // réserve de munitions s'épuise vers le quarantième tick, ce qui suffit
  // largement — elle tient la file bien au-delà des trente ticks du repli, et
  // elle ne quitte le champ qu'au tick 70. Asserter son tir au tick 60 serait
  // asserter un fait qui a cessé d'être vrai, et le test tomberait sur un code
  // juste.
  assert.equal(devant.aTire, true,
    'A ne tire pas : son compteur monterait dès le premier tick et la file se '
      + 'dénouerait avant les trente ticks du repli — le montage ne mesure rien');
  assert.equal(derriere.rangeeMilli % MILLI_PAR_CASE, 0,
    'CHEVAUCHEMENT : B flue dans la sous-case de son alliée au lieu de se ranger '
      + `(${derriere.rangeeMilli} n'est pas un multiple de ${MILLI_PAR_CASE})`);
  assert.equal(derriere.rangeeMilli, B.rangee * MILLI_PAR_CASE,
    'CHEVAUCHEMENT : B n\'est pas rangée sur SA case');

  // --- SECONDE MOITIÉ : son compteur est GELÉ, elle ne rentre pas -------------
  //
  // ⚠⚠ AU TICK 60, C'EST-À-DIRE LE DOUBLE DU DÉLAI DE REPLI. Le double, et non
  // le délai lui-même : au tick 30 exactement, une régression qui ferait repartir
  // le compteur d'un tick plus tard passerait encore. Le nombre se DÉRIVE de
  // `TICKS_AVANT_REPLI`, il ne s'écrit pas 60 — le jour où Ethan déplace le
  // délai, ce test suit.
  jouer(etat, 2 * TICKS_AVANT_REPLI);
  assert.equal(derriere.sorti, false,
    'REPLI : B a quitté le champ alors qu\'une ALLIÉE lui barrait le passage — '
      + 'c\'est le « puis ils ont disparu, mais 0 détruit » d\'Ethan');
  assert.equal(derriere.ticksInutiles, 0,
    'REPLI : le compteur de B monte derrière une alliée — il doit être GELÉ');
  assert.equal(derriere.rangeeMilli, B.rangee * MILLI_PAR_CASE,
    'CHEVAUCHEMENT : B a fini par fluer dans la case de son alliée');
  assert.equal(derriere.vivant, true, 'B doit être vivante : on mesure un blocage, pas une mort');
  assert.equal(devant.vivant, true, 'A doit être vivante : un blocage, pas un écrasement');
  assert.equal(devant.ecrase, false, 'A ne doit pas être écrasée par son alliée');

  // ⚠⚠ ET LE GEL NE DÉBORDE PAS SUR CELLE QUI BLOQUE — c'est ce qui fait qu'une
  // file se dénoue au lieu de durer tout le raid. A n'a personne devant elle : son
  // compteur, lui, a le droit de monter, et il ne monte pas ici uniquement parce
  // qu'elle TIRE. Un gel écrit sans condition figerait les deux.
  assert.equal(devant.sorti, false, 'A a quitté le champ : la file s\'est dénouée trop tôt');
  assert.ok(devant.ticksInutiles > 0,
    'le gel a débordé sur celle qui BLOQUE : A n\'a personne devant elle, son '
      + 'compteur doit monter — sans quoi la file ne se dénouerait jamais');
  assert.ok(devant.ticksInutiles < TICKS_AVANT_REPLI,
    'A est à un tick de rentrer : le montage ne tient plus la file au tick mesuré');

  // ⚠⚠ ET LA CONTRE-ÉPREUVE : LE GEL N'EST PAS UN MUR, IL EST CONDITIONNEL. Une
  // fois A partie, B repart — et son compteur repart avec elle. Sans cette
  // moitié-là, un gel écrit inconditionnellement passerait tout ce qui précède.
  jouer(etat, 400);
  assert.ok(derriere.rangeeMilli > B.rangee * MILLI_PAR_CASE,
    'B n\'a jamais repris sa route : le gel est devenu un mur');
});
