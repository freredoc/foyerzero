// LA BASE BOUGE — lot DÉPLACEMENT, 02/09/2026.
//
// Douze tests dans l'ordre du brief. Les trois qui comptent le plus ne portent
// pas sur le geste mais sur ce qu'il NE fait pas : le terrain ne suit pas, les
// POI ne se perdent pas, et il n'existe qu'un seul code qui déplace la base.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  problemesDuDeplacement, deplacerLaBase, poserLaBaseSur, casesAtteignables,
  delaiDeplacementTicks, ticksAvantProchainDeplacement, PORTEE_CARREE,
} from '../src/sim/deplacement.js';
import {
  creerEtat, serialiser, charger, migrer, SAVE_VERSION, tickJeu, rattraperJeu, poser,
} from '../src/sim/state.js';
import { subirUnRaid, basesAttaquantes } from '../src/sim/raid-ouvrage.js';
import { casesDeLAnneau, ANNEAUX } from '../src/sim/satellites.js';
import { carteDesPoi } from '../src/sim/poi.js';
import { estSurLaCarte, niveauDeLaRangee, positionDepartJoueur } from '../src/sim/carte.js';
import { distanceCarreeCases } from '../src/sim/points-attaque.js';
import { niveauDesBatiments } from '../src/sim/niveau-de-base.js';
import { TICKS_PAR_HEURE } from '../src/sim/clock.js';
import { DEPLACEMENT, GEOGRAPHIE } from '../src/data/sites.js';
import { GRILLE } from '../src/data/combat.js';
import {
  centreDeLaCase, traitDeLaFleche, geometrieDuHalo,
  haloAllumeAuTick, PERIODE_HALO_TICKS,
} from '../src/ui/monde.js';
import { baseCourante } from '../src/sim/base-courante.js';
import { aplatirSauvegarde } from './aplatir-sauvegarde.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const T0 = 4_000_000;

/** La source d'un fichier, commentaires ôtés — une garde ne lit pas sa prose. */
function decommentee(chemin) {
  return readFileSync(join(RACINE, chemin), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
}

/** Une partie posée assez haut pour que la carte ait quelque chose à montrer. */
function partie(graine = 2026, rangee = 200) {
  const etat = creerEtat(graine);
  baseCourante(etat).position.rangee = rangee;
  return etat;
}

// ---------------------------------------------------------------------------
// T1 — dix cases, en euclidien
// ---------------------------------------------------------------------------

test('DÉPLACEMENT T1 — dix cases en EUCLIDE : (10, 0) passe, (10, 10) est refusé', () => {
  assert.equal(DEPLACEMENT.porteeMaxCases, 10);
  assert.equal(PORTEE_CARREE, 100);
  const etat = partie();
  const { rangee: r, colonne: c } = baseCourante(etat).position;

  assert.deepEqual(problemesDuDeplacement(etat, { rangee: r - 10, colonne: c }), []);
  assert.deepEqual(problemesDuDeplacement(etat, { rangee: r, colonne: c - 10 }), []);
  // ⚠ LA DIAGONALE EST LE CAS QUI DISTINGUE LES DEUX MÉTRIQUES. (10, 10) vaut 10
  // en Tchebychev et 14,1 en ligne droite : sous l'ancienne métrique il serait
  // passé. C'est la falsification de ce test.
  const loin = problemesDuDeplacement(etat, { rangee: r - 10, colonne: c - 10 });
  assert.equal(loin.some((p) => p.code === 'trop-loin'), true);
  assert.match(loin[0].message, /15 cases en ligne droite/);

  // La borne se lit des deux côtés : (6, 8) fait exactement 10, (7, 8) fait 10,6.
  assert.deepEqual(problemesDuDeplacement(etat, { rangee: r - 6, colonne: c - 8 }), []);
  assert.equal(
    problemesDuDeplacement(etat, { rangee: r - 7, colonne: c - 8 })
      .some((p) => p.code === 'trop-loin'),
    true,
  );
  assert.equal(distanceCarreeCases(baseCourante(etat).position, { rangee: r - 6, colonne: c - 8 }), 100);

  // Rester sur place n'est pas un déplacement.
  assert.equal(
    problemesDuDeplacement(etat, { rangee: r, colonne: c })[0].code, 'sur-place',
  );
});

// ---------------------------------------------------------------------------
// T2 — hors carte : refusé, pas raboté
// ---------------------------------------------------------------------------

test('DÉPLACEMENT T2 — une destination hors carte est REFUSÉE, pas rabotée', () => {
  const etat = partie(7, GEOGRAPHIE.carte.hauteur - 2);
  const hors = { rangee: GEOGRAPHIE.carte.hauteur + 3, colonne: baseCourante(etat).position.colonne };
  assert.equal(estSurLaCarte(hors.rangee, hors.colonne), false,
    'le montage ne mesure rien : la case est sur la carte');

  const problemes = problemesDuDeplacement(etat, hors);
  assert.equal(problemes[0].code, 'hors-carte');
  assert.throws(() => deplacerLaBase(etat, hors), /deplacement impossible/);

  // ⚠⚠ ET LA POSITION N'A PAS BOUGÉ D'UNE CASE. C'est toute la différence avec
  // `raserLaBase`, qui rabote : le joueur a DÉSIGNÉ une case, il obtient
  // celle-là ou un refus. Une rabatte silencieuse le poserait ailleurs qu'où il
  // a touché, et il ne saurait jamais pourquoi.
  assert.deepEqual(baseCourante(etat).position, { rangee: GEOGRAPHIE.carte.hauteur - 2, colonne: 16 });

  // Aucune case hors carte ne sort de `casesAtteignables`.
  for (const k of casesAtteignables(etat)) {
    assert.equal(estSurLaCarte(k.rangee, k.colonne), true,
      `(${k.rangee}, ${k.colonne}) est hors carte`);
  }
  // Et le montage mesure quelque chose : au bord, il en manque forcément.
  const disque = casesAtteignables(partie(7, 150)).length;
  assert.ok(casesAtteignables(etat).length < disque,
    'au bord de la carte, la liste doit être rognée');
});

// ---------------------------------------------------------------------------
// T3 — un seul code déplace la base
// ---------------------------------------------------------------------------

test('DÉPLACEMENT T3 — `raserLaBase` passe par la fonction commune, et il n\'y a qu\'un écrivain', () => {
  // ⚠⚠ LA GARDE PORTE SUR L'ÉCRITURE, PAS SUR LE NOM. Ce qui doit n'exister
  // qu'en un exemplaire, c'est la ligne qui écrit `etat.position` — deux codes
  // qui déplacent la base divergeraient, et ce dépôt a déjà payé cette faute
  // deux fois.
  // ⚠ LE MOTIF A SUIVI LE DÉPLIAGE DE BASES-0, ET IL S'EST RESSERRÉ, PAS
  // ÉLARGI. Il cherchait `etat.position.rangee =` ; la position vit maintenant
  // dans la base, donc il cherche `<quelque chose>.position.rangee =`. Le
  // receveur est LIBRE — `laBase`, `base`, `etat.bases[0]` — et c'est
  // délibéré : ce qu'on interdit, c'est d'ÉCRIRE une position de base ailleurs
  // que dans le module qui en a le droit, quel que soit le nom du chemin.
  // ⚠ LE RECEVEUR PEUT FINIR PAR UNE PARENTHÈSE — `baseCourante(etat).position`
  // — autant que par une lettre. Le premier jet ne prenait que `\w` et laissait
  // passer très exactement la forme que le dépliage a rendue la plus probable.
  const ECRITURE = /[\w)]\.position\.(rangee|colonne)\s*=[^=]/;
  const raidOuvrage = decommentee('src/sim/raid-ouvrage.js');
  assert.doesNotMatch(raidOuvrage, ECRITURE,
    '`raid-ouvrage.js` écrit encore la position lui-même');
  assert.match(raidOuvrage, /poserLaBaseSur\(/,
    '`raserLaBase` n\'appelle pas la fonction commune');

  // Falsifiable : le motif doit attraper l'appât, sous les deux formes.
  assert.match('baseCourante(etat).position.rangee = 12;', ECRITURE);
  assert.match('  laBase.position.colonne = c;', ECRITURE);
  // Et il ne doit PAS attraper une simple lecture, ni une comparaison.
  assert.doesNotMatch('if (laBase.position.rangee === 12) {', ECRITURE);

  // Et un seul fichier de `src/sim/` écrit la position.
  const ecrivains = [];
  for (const chemin of ['src/sim/deplacement.js', 'src/sim/raid-ouvrage.js', 'src/sim/state.js']) {
    if (ECRITURE.test(decommentee(chemin))) ecrivains.push(chemin);
  }
  assert.deepEqual(ecrivains, ['src/sim/deplacement.js']);
});

test('DÉPLACEMENT T3 bis — le comportement de `raserLaBase` n\'a pas changé', () => {
  // ⚠ SON COMPORTEMENT FAIT FOI, il est testé depuis RAID-B. Vingt cases vers le
  // bas, rabotées sur le bord, et les stocks perdus.
  for (const depart of [200, GEOGRAPHIE.carte.hauteur - 5, GEOGRAPHIE.carte.hauteur]) {
    const etat = creerEtat(7);
    baseCourante(etat).position.rangee = depart;
    const attendue = Math.min(GEOGRAPHIE.carte.hauteur, depart + 20);
    const rapport = subirUnRaid(etat, {
      type: 'base', niveau: 20, rangee: 190, colonne: 16, saveur: null, instance: 0,
    }, 5);
    assert.equal(rapport.rase, true, `départ ${depart} : le montage ne mesure rien`);
    assert.equal(baseCourante(etat).position.rangee, attendue,
      `départ ${depart} : la base est en ${baseCourante(etat).position.rangee}, attendu ${attendue}`);
    assert.equal(rapport.sanction.cases, attendue - depart);
    assert.deepEqual(baseCourante(etat).economie.ressources, { quartz: 0, scorie: 0, electricite: 0 });
    // ⚠ ET UN RASAGE NE CONSOMME PAS LE DÉLAI DU JOUEUR. LECTURE PRISE : la
    // sanction est déjà la plus lourde du jeu ; lui retirer aussi le droit de
    // bouger le punirait deux fois, et l'empêcherait de fuir l'endroit où il
    // vient d'être rasé.
    assert.equal(baseCourante(etat).dernierDeplacementTick, null,
      'le rasage a consommé le délai de déplacement du joueur');
  }
});

// ---------------------------------------------------------------------------
// T4 — les POI
// ---------------------------------------------------------------------------

test('DÉPLACEMENT T4 — après un déplacement, les POI de l\'arrivée sont acquis ET les anciens gardés', () => {
  // ⚠⚠ LE MONTAGE EST CHOISI POUR QUE LE RELEVÉ CHANGE, sans quoi ce test
  // comparerait « vide » à « vide » et passerait sur du code où le rappel est
  // omis. On pose la base SUR un premier POI, on note ce qu'elle acquiert, puis
  // on la déplace sur un second — et les deux doivent être là.
  const graine = 7;
  const liste = carteDesPoi(graine).liste;
  let paire = null;
  for (const a of liste) {
    for (const b of liste) {
      if (a === b) continue;
      const d2 = distanceCarreeCases(a, b);
      if (d2 > 0 && d2 <= PORTEE_CARREE && a.type !== b.type) { paire = [a, b]; break; }
    }
    if (paire !== null) break;
  }
  assert.ok(paire, 'le montage ne mesure rien : aucun couple de POI à portée l\'un de l\'autre');
  const [depart, arrivee] = paire;

  const etat = creerEtat(graine);
  poserLaBaseSur(etat, depart.rangee, depart.colonne);
  const premiers = [...etat.poisAcquis];
  assert.ok(premiers.length > 0, 'le montage ne mesure rien : aucun POI sous la base de départ');

  deplacerLaBase(etat, { rangee: arrivee.rangee, colonne: arrivee.colonne });

  // Les nouveaux sont là…
  assert.ok(
    etat.poisAcquis.some((p) => p.type === arrivee.type && p.bande === arrivee.bande),
    'le POI de la nouvelle position n\'a pas été relevé',
  );
  // …et les anciens n'ont pas disparu. ⚠ LES POI SONT ACQUIS DÉFINITIVEMENT —
  // arbitrage du 31/08. Un déplacement AJOUTE, il ne recalcule pas.
  for (const p of premiers) {
    assert.ok(
      etat.poisAcquis.some((q) => q.type === p.type && q.bande === p.bande),
      `le POI ${p.type}/${p.bande} de l'ancienne position a été perdu`,
    );
  }
  assert.ok(etat.poisAcquis.length > premiers.length, 'le relevé n\'a rien ajouté');
});

// ---------------------------------------------------------------------------
// T5 — ce qui ne bouge pas
// ---------------------------------------------------------------------------

test('DÉPLACEMENT T5 — le terrain ne suit pas la base, et aucun bâtiment ne bascule sur un obstacle', () => {
  const etat = partie(2026, 200);
  // Une base réellement construite : sans bâtiments, « aucun ne bascule » ne
  // mesurerait rien.
  const pris = new Set(baseCourante(etat).obstacles.cases.map((o) => `${o.rangee}:${o.colonne}`));
  pris.add('18:5');
  let poses = 0;
  for (const id of ['centreDeCommandement', 'qgDeDefense', 'caserne']) {
    for (let r = GRILLE.bandes.batiments.premiere; r <= GRILLE.bandes.batiments.derniere; r += 1) {
      let fait = false;
      for (let c = 1; c <= GRILLE.largeur && !fait; c += 1) {
        if (pris.has(`${r}:${c}`)) continue;
        try { poser(etat, id, r, c); pris.add(`${r}:${c}`); poses += 1; fait = true; } catch { /* case refusée */ }
      }
      if (fait) break;
    }
  }
  assert.ok(poses >= 2, `le montage ne mesure rien : ${poses} bâtiment(s) posé(s)`);

  const champsAvant = JSON.stringify(baseCourante(etat).champs);
  const obstaclesAvant = JSON.stringify(baseCourante(etat).obstacles);
  const fondationAvant = { ...baseCourante(etat).fondation };
  const dispositionAvant = JSON.stringify(baseCourante(etat).disposition);

  deplacerLaBase(etat, { rangee: baseCourante(etat).position.rangee - 9, colonne: baseCourante(etat).position.colonne + 4 });

  assert.deepEqual(baseCourante(etat).fondation, fondationAvant, '`fondation` a bougé');
  assert.equal(JSON.stringify(baseCourante(etat).champs), champsAvant, 'les champs ont bougé');
  assert.equal(JSON.stringify(baseCourante(etat).obstacles), obstaclesAvant, 'les obstacles ont bougé');
  assert.equal(JSON.stringify(baseCourante(etat).disposition), dispositionAvant, 'la disposition a bougé');

  // ⚠ ET AUCUN BÂTIMENT N'EST SUR UN OBSTACLE — c'est la conséquence pratique du
  // terrain gelé, et le §7 du brief en fait un point d'arrêt.
  const roches = new Set(baseCourante(etat).obstacles.cases.map((o) => `${o.rangee}:${o.colonne}`));
  for (const b of baseCourante(etat).disposition) {
    assert.equal(roches.has(`${b.rangee}:${b.colonne}`), false,
      `« ${b.id} » est sur un obstacle après le déplacement`);
  }

  // ⚠ ET LE TERRAIN SURVIT À LA SAUVEGARDE, qui le redéduit de `fondation`.
  const relu = charger(serialiser(etat, T0), T0);
  assert.equal(JSON.stringify(baseCourante(relu).champs), champsAvant);
  assert.equal(JSON.stringify(baseCourante(relu).obstacles), obstaclesAvant);
  assert.deepEqual(baseCourante(relu).fondation, fondationAvant);
  assert.deepEqual(baseCourante(relu).position, baseCourante(etat).position);
});

test('DÉPLACEMENT T5 bis — `sim/deplacement.js` ne lit jamais `fondation` pour en tirer un terrain', () => {
  const source = decommentee('src/sim/deplacement.js');
  assert.doesNotMatch(source, /champsDeLaBase|obstaclesDeLaBase/,
    'le module régénère le terrain : il ne doit pas y toucher');
  assert.doesNotMatch(source, /etat\.fondation\s*=/, 'le module écrit `fondation`');
});

// ---------------------------------------------------------------------------
// T6 — les anneaux de satellites suivent
// ---------------------------------------------------------------------------

test('DÉPLACEMENT T6 — le rayon des anneaux de satellites suit la nouvelle rangée', () => {
  // ⚠ LE RAYON D'UN ANNEAU SE LIT SUR LA RANGÉE — `satellites.js` fait
  // `niveauDeLaRangee(etat.position.rangee)`. Deux rangées assez éloignées
  // doivent donc donner deux niveaux, sinon le test ne mesure rien.
  const etat = partie(2026, 200);
  const avant = niveauDeLaRangee(baseCourante(etat).position.rangee);
  deplacerLaBase(etat, { rangee: baseCourante(etat).position.rangee - 10, colonne: baseCourante(etat).position.colonne });
  const apres = niveauDeLaRangee(baseCourante(etat).position.rangee);
  assert.notEqual(apres, avant, 'le montage ne mesure rien : le niveau de rangée n\'a pas changé');

  // Et l'anneau se calcule bien autour de la NOUVELLE position.
  const anneau = casesDeLAnneau(baseCourante(etat).position, ANNEAUX.camp.min, ANNEAUX.camp.max);
  for (const k of anneau) {
    const d2 = distanceCarreeCases(baseCourante(etat).position, k);
    assert.ok(d2 >= ANNEAUX.camp.min ** 2 && d2 <= ANNEAUX.camp.max ** 2);
  }
  assert.ok(anneau.length > 0);
  // La source le dit : c'est la POSITION qui décide, pas `fondation`.
  // ⚠ LE MOTIF A SUIVI LE DÉPLIAGE DE BASES-0 : la position vit dans la base.
  // Il reste aussi strict — il nomme `position`, et refuserait `fondation`.
  assert.match(
    decommentee('src/sim/satellites.js'),
    /niveauDeLaRangee\(laBase\.position\.rangee\)/,
  );
  assert.doesNotMatch(
    decommentee('src/sim/satellites.js'),
    /niveauDeLaRangee\(\w+\.fondation\.rangee\)/,
  );
});

// ---------------------------------------------------------------------------
// T7 — le barème du délai
// ---------------------------------------------------------------------------

test('DÉPLACEMENT T7 — 1 h à bas niveau, 24 h au niveau 50, interpolé entre les deux', () => {
  const etat = creerEtat(7);
  // Une base neuve : un seul Chantier de niveau 1.
  assert.equal(niveauDesBatiments(baseCourante(etat).disposition), 10, 'le niveau se lit en DIXIÈMES');
  assert.equal(delaiDeplacementTicks(etat), 1 * TICKS_PAR_HEURE);

  // Au plafond.
  baseCourante(etat).disposition[0].niveau = GEOGRAPHIE.niveauPlafond;
  assert.equal(niveauDesBatiments(baseCourante(etat).disposition), 500);
  assert.equal(delaiDeplacementTicks(etat), 24 * TICKS_PAR_HEURE);

  // ⚠⚠ ET AU MILIEU, C'EST LÀ QUE LE PIÈGE DES DIXIÈMES MORD. Une base de
  // niveau 25,5 est à la moitié exacte du barème : 12,5 h. Lire
  // `niveauDesBatiments` comme un ENTIER donnerait 255, donc le plafond, donc
  // 24 h — un délai presque deux fois trop long, et dix fois trop tôt.
  baseCourante(etat).disposition[0].niveau = 25;
  baseCourante(etat).disposition.push({
    id: 'caserne', rangee: 13, colonne: 1, niveau: 26, degatsMilli: 0,
  });
  baseCourante(etat).economie.residus.push({ quartz: 0, scorie: 0, electricite: 0 });
  assert.equal(niveauDesBatiments(baseCourante(etat).disposition), 255, 'moyenne de 25 et 26 : 25,5');
  const milieu = delaiDeplacementTicks(etat);
  assert.equal(milieu, Math.round(12.5 * TICKS_PAR_HEURE));
  assert.ok(milieu > 1 * TICKS_PAR_HEURE && milieu < 24 * TICKS_PAR_HEURE);
  // La falsification : lu en entier, le délai serait celui du plafond.
  assert.notEqual(milieu, 24 * TICKS_PAR_HEURE,
    '`niveauDesBatiments` est lu comme un entier : le délai est dix fois faux');

  // Le barème vient des DONNÉES, il n'est pas écrit dans le module.
  assert.equal(DEPLACEMENT.delaiHeures.depart, 1);
  assert.equal(DEPLACEMENT.delaiHeures.niveau50, 24);
  assert.equal(DEPLACEMENT.delaiHeures, GEOGRAPHIE.delaiEntreSautsHeures,
    'le délai est recopié au lieu d\'être référencé');
});

// ---------------------------------------------------------------------------
// T8 — le refus dit le temps qui reste
// ---------------------------------------------------------------------------

test('DÉPLACEMENT T8 — un second déplacement trop tôt est refusé, et le refus CHIFFRE l\'attente', () => {
  const etat = partie(2026, 200);
  const cible = { rangee: baseCourante(etat).position.rangee - 3, colonne: baseCourante(etat).position.colonne };
  deplacerLaBase(etat, cible);
  assert.equal(baseCourante(etat).dernierDeplacementTick, etat.horloge.nbTicks);

  const encore = { rangee: baseCourante(etat).position.rangee - 3, colonne: baseCourante(etat).position.colonne };
  const problemes = problemesDuDeplacement(etat, encore);
  assert.equal(problemes.some((p) => p.code === 'delai'), true);
  // ⚠ UNE PHRASE, PAS UN BOOLÉEN. « Il reste 1 h » est une phrase ; `false` n'en
  // est pas une, et l'écran ne peut rien en faire d'autre qu'un bouton muet.
  const message = problemes.find((p) => p.code === 'delai').message;
  assert.match(message, /\d/, 'le refus ne chiffre pas l\'attente');
  assert.match(message, /1 h|min/);
  assert.throws(() => deplacerLaBase(etat, encore), /deplacement impossible/);

  // Le temps passe, et l'attente fond.
  const du = delaiDeplacementTicks(etat);
  assert.equal(ticksAvantProchainDeplacement(etat), du);
  rattraperJeu(etat, Math.floor(du / 2));
  assert.equal(ticksAvantProchainDeplacement(etat), du - Math.floor(du / 2));
  rattraperJeu(etat, du);
  assert.equal(ticksAvantProchainDeplacement(etat), 0);
  // ⚠⚠ LA CIBLE SE RECALCULE ICI, ET C'EST LE 03/09 QUI L'A EXIGÉ. Elle était
  // celle d'avant le rattrapage ; or l'Ouvrage attaque PENDANT ces heures-là, et
  // un rasage déplace la base de vingt cases. Depuis que la carte porte 28 bases
  // par 12 × 12 au lieu de 16, ce rasage arrive pour de bon sur cette graine :
  // le refus rendu devenait `trop-loin` — 83 cases —, c'est-à-dire une raison qui
  // ne regarde pas ce test. Ce qu'il mesure est le DÉLAI, pas une position.
  const voisine = {
    rangee: baseCourante(etat).position.rangee - 1,
    colonne: baseCourante(etat).position.colonne,
  };
  assert.deepEqual(problemesDuDeplacement(etat, voisine), []);
});

// ---------------------------------------------------------------------------
// T9 — le premier déplacement n'attend pas
// ---------------------------------------------------------------------------

test('DÉPLACEMENT T9 — le PREMIER déplacement d\'une partie neuve n\'attend rien', () => {
  const etat = creerEtat(7);
  // ⚠ `null`, PAS ZÉRO, et c'est la moitié qui compte. Un zéro se lirait
  // « déplacée au tick 0 » : vrai par accident aujourd'hui, faux le jour où une
  // partie commencerait ailleurs qu'au tick zéro.
  assert.equal(baseCourante(etat).dernierDeplacementTick, null);
  assert.equal(ticksAvantProchainDeplacement(etat), 0);

  // Et il n'attend pas non plus après trois jours d'absence sans avoir bougé.
  const vieux = creerEtat(7);
  rattraperJeu(vieux, 72 * TICKS_PAR_HEURE);
  assert.equal(baseCourante(vieux).dernierDeplacementTick, null);
  assert.equal(ticksAvantProchainDeplacement(vieux), 0);

  // Falsifiable : un zéro écrit à la place de `null` ferait attendre.
  const forge = creerEtat(7);
  baseCourante(forge).dernierDeplacementTick = 0;
  rattraperJeu(forge, 10);
  assert.ok(ticksAvantProchainDeplacement(forge) > 0,
    'le montage ne mesure rien : un horodatage à zéro n\'attend pas non plus');
});

// ---------------------------------------------------------------------------
// T10 — la remise à zéro
// ---------------------------------------------------------------------------

test('DÉPLACEMENT T10 — la remise à zéro repart du chemin NORMAL, et rien n\'est bricolé', () => {
  const session = decommentee('src/ui/session.js');
  // ⚠⚠ ELLE APPELLE `partieNeuve`, la MÊME fonction que le bouton de l'écran
  // d'alerte — donc `creerEtat`, donc une graine neuve et une fondation neuve.
  // Un état bricolé à la main serait un second constructeur, qui divergerait au
  // premier champ ajouté.
  const bloc = session.slice(
    session.indexOf('zeroConfirmer.addEventListener'),
    session.indexOf('const version = $(\'options-version\')'),
  );
  assert.ok(bloc.length > 40, 'le bouton de remise à zéro est introuvable');
  assert.match(bloc, /partieNeuve\(\)/, 'la remise à zéro ne passe pas par `partieNeuve`');
  assert.doesNotMatch(bloc, /creerEtat|position\s*=|disposition\s*=/,
    'la remise à zéro bricole un état à la main');

  // ⚠ ET LA CONFIRMATION EST EN DEUX TEMPS, avec un libellé qui DIT ce qui sera
  // perdu — pas un « êtes-vous sûr ? », qui n'apprend rien.
  const html = readFileSync(join(RACINE, 'dist', 'index.html'), 'utf8');
  for (const id of ['options-zero', 'options-zero-confirmer', 'options-zero-annuler']) {
    assert.ok(html.includes(`id="${id}"`), `le bouton « ${id} » manque`);
  }
  assert.match(session, /AVERTISSEMENT_ZERO/);
  const libelle = session.slice(session.indexOf('AVERTISSEMENT_ZERO ='), session.indexOf('function armerLaRemiseAZero'));
  for (const mot of ['base', 'garnison', 'armée', 'recherches', 'définitif']) {
    assert.ok(libelle.includes(mot), `l'avertissement ne nomme pas « ${mot} »`);
  }
  assert.doesNotMatch(libelle, /êtes-vous sûr/i);

  // Et le chemin normal rend bien un état neuf et jouable, graine comprise.
  const a = creerEtat(111);
  const b = creerEtat(222);
  assert.notDeepEqual(baseCourante(a).position, undefined);
  assert.deepEqual(baseCourante(a).position, baseCourante(b).position, 'toute base neuve part du même endroit');
  assert.notEqual(a.graine, b.graine);
  assert.equal(baseCourante(a).dernierDeplacementTick, null);
  assert.deepEqual(a.poisAcquis, []);
});

// ---------------------------------------------------------------------------
// T11 — le halo et la flèche
// ---------------------------------------------------------------------------

test('DÉPLACEMENT T11 — la flèche relit le coût du panneau, elle ne le recalcule pas', () => {
  const ecran = decommentee('src/ui/monde.js');
  const debut = ecran.indexOf('function dessinerFleche(');
  assert.ok(debut > 0, '`dessinerFleche` est introuvable');
  const fin = ecran.indexOf('function dessiner(', debut);
  const corps = ecran.slice(debut, fin);
  // ⚠⚠ ELLE LIT `ciblageOuvert`, l'objet que `ouvrirPanneau` a rempli. Un second
  // appel à `coutDUnRaid` donnerait deux valeurs qui peuvent diverger, et le
  // joueur verrait un prix sur la flèche et un autre dans le panneau.
  assert.match(corps, /ciblageOuvert\.cout/, 'la flèche ne relit pas le coût du panneau');
  assert.doesNotMatch(corps, /coutDUnRaid|coutDuRaid/, 'la flèche recalcule le coût');

  // Et le panneau range bien l'objet pour elle.
  assert.match(ecran, /ciblageOuvert = ciblage;/);
});

test('DÉPLACEMENT T11 bis — la géométrie du halo et de la flèche, sans DOM', () => {
  // ⚠ ELLES SONT PURES, et c'est ce qui les rend vérifiables : le dépôt n'a ni
  // jsdom ni navigateur, et l'écran Monde a déjà payé une géométrie écrite dans
  // la boucle de dessin — le `drawImage` aux rectangles non finis du lot
  // RETOURS-DU-31, qui ne dessinait rien et ne levait pas.
  const centre = centreDeLaCase({ rangee: 3, colonne: 5 }, 0, 0, 10);
  assert.deepEqual(centre, { x: 45, y: 25 });

  // ⚠⚠ CETTE ASSERTION EST RETOURNÉE, PAS ASSOUPLIE, ET C'EST UN ARBITRAGE
  // D'ETHAN DU 03/09 : « le halo doit coller la base, faire son contour et
  // clignoter ». Elle exigeait l'INVERSE — `rayon > 5` sur une case de 10,
  // c'est-à-dire un anneau qui déborde —, au motif qu'un cercle inscrit serait
  // caché par l'emblème. Le motif était juste et la conclusion ne l'était plus :
  // le contour passe maintenant PAR-DESSUS les emblèmes, donc il n'a plus à
  // déborder pour se voir. Ce qui est asserté ici est strictement plus fort
  // qu'avant : le cadre tient DANS la case, il ne mord sur aucune voisine.
  const halo = geometrieDuHalo({ rangee: 3, colonne: 5 }, 0, 0, 10);
  assert.ok(halo.epaisseur >= 1);
  // Le trait se centre sur son chemin : le cadre rentre d'une demi-épaisseur,
  // donc le trait tient tout entier entre les bords de la case.
  assert.equal(halo.x - halo.epaisseur / 2, 40, 'le cadre ne part pas du bord de la case');
  assert.equal(halo.y - halo.epaisseur / 2, 20);
  assert.equal(halo.cote + halo.epaisseur, 10, 'le cadre ne fait pas la taille d\'une case');
  // ⚠ ET LA FALSIFICATION QUI COMPTE : un cadre posé SUR le bord déborderait de
  // la moitié de son trait. On mesure donc le débordement, qui doit être NUL.
  assert.equal(halo.x - halo.epaisseur / 2 - 40, 0, 'le cadre déborde à gauche');
  assert.equal(40 + 10 - (halo.x + halo.cote + halo.epaisseur / 2), 0, 'le cadre déborde à droite');
  assert.equal(halo.rayon, undefined, 'le halo est encore un cercle');

  // ⚠⚠ ET IL CLIGNOTE SANS LIRE D'HORLOGE. `maintenantMs` est la seule lectrice
  // du temps mural de tout `src/`, et la garde §11 de `banc.test.js` en exige
  // EXACTEMENT une, dans `ui/session.js` : le clignotement compte donc les
  // appels que la session fait déjà, cadencés à 100 ms dans sa boucle.
  assert.equal(haloAllumeAuTick(0), true, 'le contour part éteint');
  assert.equal(haloAllumeAuTick(PERIODE_HALO_TICKS - 1), true);
  assert.equal(haloAllumeAuTick(PERIODE_HALO_TICKS), false, 'le contour ne s\'éteint jamais');
  assert.equal(haloAllumeAuTick(PERIODE_HALO_TICKS * 2), true, 'le contour ne se rallume pas');
  // Il alterne pour de bon sur une longue série — un `true` constant passerait
  // les quatre lignes ci-dessus si la période était énorme.
  const serie = Array.from({ length: PERIODE_HALO_TICKS * 6 }, (_, i) => haloAllumeAuTick(i));
  assert.equal(serie.filter(Boolean).length, PERIODE_HALO_TICKS * 3,
    'le contour ne passe pas la moitié du temps allumé');

  // ⚠ ET L'ÉCRAN NE REDESSINE QU'AUX DEUX BASCULES, pas à chaque appel : dix
  // cartes par seconde pour une image identique neuf fois sur dix est le coût
  // exact que `rafraichir` existe pour éviter.
  const ecranSource = readFileSync(join(RACINE, 'src', 'ui', 'monde.js'), 'utf8');
  assert.match(ecranSource, /haloAllumeAuTick\(tickHalo\) !== avant/,
    'le clignotement redessine sans regarder s\'il a changé d\'état');

  // La flèche part de la base et arrive à la cible, retirée aux deux bouts.
  const trait = traitDeLaFleche({ rangee: 3, colonne: 5 }, { rangee: 3, colonne: 15 }, 0, 0, 10);
  assert.ok(trait.x1 > 45, 'la flèche part du centre de la case');
  assert.ok(trait.x2 < 145, 'la flèche arrive au centre de la cible');
  assert.equal(Math.round(trait.y1), 25);
  assert.equal(Math.round(trait.y2), 25);
  assert.equal(trait.angle, 0);

  // ⚠ PAS DE FLÈCHE VERS SA PROPRE BASE.
  assert.equal(traitDeLaFleche({ rangee: 3, colonne: 5 }, { rangee: 3, colonne: 5 }, 0, 0, 10), null);
});

// ---------------------------------------------------------------------------
// T12 — la sauvegarde et les deux chemins
// ---------------------------------------------------------------------------

test('DÉPLACEMENT T12 — SAVE_VERSION passe à 22, et la migration pose `null`', () => {
  // ⚠ LE NUMÉRO N'EST PLUS GARDÉ ICI, ET C'EST LA RÈGLE DU DÉPÔT, PAS UN
  // ASSOUPLISSEMENT. `points-attaque.test.js` l'écrit depuis le lot
  // SITE-ENTAMÉ : « la garde du numéro appartient au maillon le plus RÉCENT
  // de la chaîne, une seule fois ». Ce test-ci avait gardé le sien, et le lot
  // BASES-0 l'aurait rendu rouge pour une raison qui ne le regarde pas. Ce
  // qu'il vérifie vraiment, c'est que SON maillon est encore là.
  assert.ok(SAVE_VERSION >= 22, 'le maillon v21 → 22 n\'est plus dans la chaîne');

  const v21 = JSON.parse(serialiser(creerEtat(7), T0));
  // ⚠ APLATIE AVANT D'ÊTRE RABAISSÉE — lot BASES-0. Une v21 n'a jamais
  // porté `bases` : lui en donner un ferait tourner la chaîne de migrations
  // sur une forme qui n'a jamais existé.
  aplatirSauvegarde(v21);
  v21.version = 21;
  delete v21.dernierDeplacementTick;
  assert.equal('dernierDeplacementTick' in v21, false, 'le montage ne mesure rien');

  const migre = migrer(structuredClone(v21));
  assert.equal(migre.version, SAVE_VERSION);
  assert.equal(baseCourante(migre).dernierDeplacementTick, null,
    'la migration a posé un zéro : le premier déplacement attendrait');

  // Le champ traverse la sauvegarde.
  const etat = partie(2026, 200);
  deplacerLaBase(etat, { rangee: baseCourante(etat).position.rangee - 4, colonne: baseCourante(etat).position.colonne });
  const relu = charger(serialiser(etat, T0), T0);
  assert.equal(baseCourante(relu).dernierDeplacementTick, baseCourante(etat).dernierDeplacementTick);
  assert.deepEqual(baseCourante(relu).position, baseCourante(etat).position);
});

test('DÉPLACEMENT T12 bis — un déplacement n\'arrive jamais pendant un rattrapage', () => {
  // ⚠⚠ LE PIÈGE §5.3 DU BRIEF, VÉRIFIÉ ET NON SUPPOSÉ. Un déplacement est un
  // GESTE du joueur : rien dans la boucle de jeu ne l'appelle. On le mesure sur
  // la source plutôt que de l'affirmer — c'est la faute que ce dépôt a commise
  // trois fois, « justifier une propriété par un mécanisme non ouvert ».
  const etatJs = decommentee('src/sim/state.js');
  assert.doesNotMatch(etatJs, /deplacerLaBase/,
    'la boucle de jeu appelle le déplacement : il pourrait tomber pendant un rattrapage');

  // Et l'équivalence des deux chemins tient toujours, sur une fenêtre où des
  // raids tombent — donc où `raserLaBase`, elle, déplace bien la base.
  for (const graine of [7, 42]) {
    const N = 9 * TICKS_PAR_HEURE;
    const a = partie(graine, 200);
    for (let i = 0; i < N; i += 1) tickJeu(a);
    const b = partie(graine, 200);
    rattraperJeu(b, N);
    assert.ok(a.rapports.length >= 2, `graine ${graine} : le montage ne mesure rien`);
    assert.equal(serialiser(a, T0), serialiser(b, T0),
      `graine ${graine} : les deux chemins ont divergé`);
  }
});

// ---------------------------------------------------------------------------
// M1 — ce que le déplacement ouvre
// ---------------------------------------------------------------------------

test('DÉPLACEMENT — un déplacement change les cibles à portée, et ça se mesure', () => {
  // ⚠ C'EST UN CONSTAT, PAS UN RÉGLAGE. Ce que ce test garde, c'est que le
  // déplacement a bien un EFFET sur la carte de jeu — un déplacement qui ne
  // changerait rien serait un geste pour rien.
  let bougees = 0;
  for (let graine = 1; graine <= 20; graine += 1) {
    const etat = partie(graine, 220);
    const avant = casesAtteignables(etat).length;
    assert.ok(avant > 0, 'aucune case atteignable : le montage ne mesure rien');
    const avantCibles = basesAttaquantes(etat).length;
    deplacerLaBase(etat, { rangee: baseCourante(etat).position.rangee - 10, colonne: baseCourante(etat).position.colonne });
    if (basesAttaquantes(etat).length !== avantCibles) bougees += 1;
  }
  assert.ok(bougees > 10,
    `${bougees} graines sur 20 seulement voient leurs cibles changer : le déplacement ne mord pas`);
});
