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
  ajouterUneBase,
} from '../src/sim/state.js';
import { subirUnRaid, basesAttaquantes, nombreDAttaquantes } from '../src/sim/raid-ouvrage.js';
import { casesDeLAnneau, ANNEAUX } from '../src/sim/satellites.js';
import { carteDesPoi } from '../src/sim/poi.js';
import { estSurLaCarte, niveauDeLaRangee, positionDepartJoueur } from '../src/sim/carte.js';
import { distanceCarreeCases, casesArrondiesAuSuperieur as casesEnLigneDroite } from '../src/sim/points-attaque.js';
import { niveauDesBatiments } from '../src/sim/niveau-de-base.js';
import { TICKS_PAR_HEURE } from '../src/sim/clock.js';
import {
  DEPLACEMENT, GEOGRAPHIE, RAID_OUVRAGE, ENCOMBREMENT_DES_BASES,
} from '../src/data/sites.js';
import { estBaseOuvrage, basesDeLaFenetre } from '../src/sim/peuplement.js';
import { ciblesAPortee } from '../src/sim/site-de-la-case.js';
import { caseRasee } from '../src/sim/ruines.js';
import { GRILLE } from '../src/data/combat.js';
import {
  centreDeLaCase, traitDeLaFleche, geometrieDuHalo,
  haloAllumeAuTick, PERIODE_HALO_TICKS,
} from '../src/ui/monde.js';
import { baseCourante } from '../src/sim/base-courante.js';
import { campDeLaCase, OUVRAGE } from '../src/sim/territoire.js';
import { problemesDuTerritoireTenu } from '../src/sim/territoire-tenu.js';
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

/**
 * Le rayon de rasage par défaut, et celui d'AVANT ce lot — lot RÈGLES-DE-CARTE.
 *
 * ⚠⚠ LES DEUX SONT NOMMÉS PARCE QUE `RC T7` A BESOIN DU SECOND. La règle du §3
 * refuse une case TENUE par l'Ouvrage ; le rayon par défaut la rend donc
 * INATTEIGNABLE — c'est tout son objet, les sept tests ci-dessous parlant
 * d'autre chose. Le montage qui MESURE la règle est celui d'hier : à onze
 * cases, une base de l'Ouvrage survit juste au-delà du disque et son octogone
 * de rayon `rayonInfluenceEnnemie` peint la couronne, sans que son 3 × 3
 * n'encombre les cases qu'elle tient. **Mesuré, graine 2026 rangée 200 :
 * vingt-trois cases refusées pour CETTE seule raison, et 293 destinations au
 * lieu de 316.**
 */
const RAYON_ENCOMBREMENT = DEPLACEMENT.porteeMaxCases + ENCOMBREMENT_DES_BASES.rayonCases;
const RAYON_DEGAGE = RAYON_ENCOMBREMENT + GEOGRAPHIE.rayonInfluenceEnnemie;

/**
 * La même, mais avec de la PLACE — lot VOISINAGE-ET-MENACE, 08/09/2026.
 *
 * ⚠⚠ SANS ELLE, CES TESTS MESURERAIENT LA DENSITÉ DU PEUPLEMENT ET PLUS LE
 * GESTE. Ethan a tranché le 08/09 : « aucune base joueur/ouvrage ne doit être
 * côte à côte sur les 9 cases ». Or, mesuré au même lot, **0,3 % à 3 % des
 * cases seulement ont un 3 × 3 libre de base de l'Ouvrage** passé la garde du
 * départ — à la rangée 50, ZÉRO sur 290. Une partie posée en rangée 200 n'a
 * donc presque aucune destination légale, et les sept tests ci-dessous, qui
 * parlent de PORTÉE, de TERRAIN, de POI, d'ANNEAUX, de DÉLAI et de MIGRATION,
 * tomberaient tous sur un rapport de force qu'aucun d'eux n'a choisi.
 *
 * ⚠ C'EST LE MOTIF DE `sansVoisinsOuvrage` DE `poi.test.js`, repris à la
 * lettre : on rase le voisinage pour mesurer la FORME. Le rayon couvre le
 * disque de déplacement PLUS l'encombrement, sans quoi la couronne du bord
 * resterait refusée par une base juste au-delà.
 *
 * ⚠⚠ ET IL COUVRE MAINTENANT L'INFLUENCE, EN PLUS — lot RÈGLES-DE-CARTE,
 * 10/09/2026. Le déplacement refuse désormais une case TENUE par l'Ouvrage, et
 * une base de l'Ouvrage tient jusqu'à `rayonInfluenceEnnemie` cases autour
 * d'elle : une base restée à onze cases de la nôtre peindrait encore la couronne
 * du disque de déplacement, et les sept tests ci-dessous mesureraient à nouveau
 * la densité au lieu du geste. Le rayon suit la règle qui vient d'entrer, il ne
 * se choisit pas — c'est la troisième fois que ce montage s'élargit pour la même
 * raison, et à chaque fois par une SOMME de portées nommées.
 */
function partieDegagee(graine = 2026, rangee = 200, rayon = RAYON_DEGAGE) {
  const etat = partie(graine, rangee);
  const p = baseCourante(etat).position;
  for (const o of basesDeLaFenetre(etat.graine, {
    premiereRangee: p.rangee - rayon, derniereRangee: p.rangee + rayon,
    premiereColonne: p.colonne - rayon, derniereColonne: p.colonne + rayon,
  })) etat.basesRasees.push(caseRasee(o.rangee, o.colonne));
  return etat;
}

/**
 * Monte la base au-dessus du niveau 4,2, où la distance CESSE d'être gratuite.
 *
 * ⚠⚠ TROIS MONTAGES ONT PERDU LEUR PRÉMISSE AU LOT EMPRISES-ET-DÉLAI, ET LEURS
 * PROPRES GARDES L'ONT DIT. `DÉPLACEMENT T8`, `RC T5` et `RC T6` portaient
 * chacun un « le montage ne mesure rien : dix cases coûtent autant qu'une » ;
 * les trois ont mordu d'un coup. La cause est la forme d'Ethan : le plafond du
 * délai passe SOUS le plancher d'une heure en dessous du niveau 4,2, donc le
 * terme de distance est écrasé — et une base NEUVE, qui est ce que ces trois
 * montages posaient, est exactement dans ce cas.
 *
 * ⚠ C'EST LE MONTAGE QU'ON RÉPARE, PAS L'ASSERTION. Ces gardes-là existent pour
 * refuser un test qui passerait sur n'importe quel code ; les assouplir aurait
 * retiré la seule chose qui disait que la distance compte.
 *
 * ⚠ ET LE NIVEAU EST CELUI DU CHANTIER SEUL, parce qu'une base neuve n'a que
 * lui : la moyenne vaut donc exactement `niveau × 10` dixièmes.
 */
function baseHorsDuPlancher(etat, niveau = 20) {
  const laBase = baseCourante(etat);
  for (const batiment of laBase.disposition) batiment.niveau = niveau;
  assert.equal(niveauDesBatiments(laBase.disposition), niveau * 10,
    'le montage ne pose pas le niveau voulu');
  assert.ok(delaiDeplacementTicks(etat, 10) > delaiDeplacementTicks(etat, 1),
    'le montage ne discrimine toujours pas : la distance reste gratuite à ce niveau');
  return etat;
}

// ---------------------------------------------------------------------------
// T1 — dix cases, en euclidien
// ---------------------------------------------------------------------------

test('DÉPLACEMENT T1 — dix cases en EUCLIDE : (10, 0) passe, (10, 10) est refusé', () => {
  assert.equal(DEPLACEMENT.porteeMaxCases, 10);
  assert.equal(PORTEE_CARREE, 100);
  const etat = partieDegagee();
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
  const etat = partieDegagee(7, GEOGRAPHIE.carte.hauteur - 2);
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
  const disque = casesAtteignables(partieDegagee(7, 150)).length;
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
  // ⚠ ON DÉGAGE LES DEUX POI, ET SEULEMENT L'OUVRAGE — lot VOISINAGE-ET-MENACE.
  // Un POI n'est pas une base et n'encombre rien ; ce qui empêcherait le
  // déplacement est une base de l'Ouvrage collée à l'arrivée. Raser les bases
  // du voisinage laisse les deux gisements intacts, donc mesure toujours le
  // RELEVÉ et pas un rapport de force.
  // ⚠ ET LE RAYON COUVRE AUSSI L'INFLUENCE — lot RÈGLES-DE-CARTE, 10/09/2026.
  // Le déplacement refuse maintenant une case TENUE par l'Ouvrage, et une base
  // tient jusqu'à `rayonInfluenceEnnemie` cases : dégager le seul encombrement
  // laisserait l'arrivée en territoire violet, et ce test mesurerait à nouveau la
  // densité au lieu du relevé des POI.
  for (const k of [depart, arrivee]) {
    const rayon = ENCOMBREMENT_DES_BASES.rayonCases + 1 + GEOGRAPHIE.rayonInfluenceEnnemie;
    for (const o of basesDeLaFenetre(graine, {
      premiereRangee: k.rangee - rayon, derniereRangee: k.rangee + rayon,
      premiereColonne: k.colonne - rayon, derniereColonne: k.colonne + rayon,
    })) etat.basesRasees.push(caseRasee(o.rangee, o.colonne));
  }
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
  const etat = partieDegagee(2026, 200);
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
  const etat = partieDegagee(2026, 200);
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

test('DÉPLACEMENT T7 — le délai DOUBLE tous les dix niveaux, et il ne descend jamais sous 1 h', () => {
  // ⚠⚠ CE TEST EST RETOURNÉ POUR LA SECONDE FOIS EN UN JOUR, ET C'EST À DIRE
  // AVANT TOUT LE RESTE. Il figeait d'abord « 1 h à bas niveau, 24 h au niveau
  // 50, interpolé entre les deux » ; le lot RÈGLES-DE-CARTE l'a retourné le
  // 10/09 au matin sur la droite `60 + niveau + (distance − 1)` d'Ethan ; Ethan
  // est revenu dessus le SOIR MÊME en dictant cinq ancrages qui DOUBLENT tous
  // les dix niveaux — « 1 h 30 niv 10 distance 10 ; 3 h niv 20 d10 ; 6 h niv 30
  // d10 ; 12 h niv 40 d10 ; 24 h niv 50 d10 » — plus un plancher, « 1 h mini ».
  // C'est donc la PRÉMISSE qui a cessé d'être vraie, pas le code du test.
  //
  // ⚠⚠ ET LES 24 HEURES DU NIVEAU 50 SONT RENDUES. La droite du matin plafonnait
  // le jeu entier à 1 h 59 ; le pire cas vaut de nouveau **24 h**, par une
  // géométrique et non par l'interpolation qu'il avait jadis.
  //
  // ⚠⚠ IL FALSIFIE LES DEUX RÈGLES MORTES DE FACE. Sans les `notEqual`, un
  // retour silencieux à l'une ou à l'autre passerait : la droite du matin rend
  // 1 h 01 là où on attend 1 h 00, et l'interpolation d'avant rendait 24 h à
  // distance 1 comme à distance 10.
  const etat = creerEtat(7);
  // Une base neuve : un seul Chantier de niveau 1.
  assert.equal(niveauDesBatiments(baseCourante(etat).disposition), 10, 'le niveau se lit en DIXIÈMES');
  assert.equal(delaiDeplacementTicks(etat, 1), Math.round(600 * TICKS_PAR_HEURE / 600), '1 h 00');

  // ⚠⚠ AU PLUS BAS NIVEAU, LA DISTANCE EST GRATUITE, ET C'EST UNE CONSÉQUENCE DE
  // LA FORME D'ETHAN QU'IL FAUT DIRE. Le plafond du niveau 1 vaut 482 dixièmes de
  // minute, donc SOUS le plancher de 600 : le `max(0, plafond − plancher)` du
  // terme de distance écrase alors le surplus, et dix cases coûtent autant
  // qu'une. Le plancher cesse de mordre au niveau 4,2 — mesuré, `ED T7`.
  // ⚠ Une base NEUVE est exactement dans ce cas : c'est le premier déplacement
  // de toute partie. Ethan tranche s'il veut la distance payante dès le niveau 1.
  assert.equal(delaiDeplacementTicks(etat, 10), Math.round(600 * TICKS_PAR_HEURE / 600),
    'au niveau 1, dix cases coûtent autant qu\'une : le plancher les couvre');
  assert.equal(
    delaiDeplacementTicks(etat, 10) - delaiDeplacementTicks(etat, 1), 0,
    'la distance a cessé d\'être gratuite au plancher',
  );
  // ⚠ LA FALSIFICATION DE LA DROITE DU MATIN, DE FACE : elle rendait 1 h 01 à
  // distance 1 et 1 h 10 à distance 10.
  assert.notEqual(delaiDeplacementTicks(etat, 1), Math.round(610 * TICKS_PAR_HEURE / 600),
    'le barème est revenu à la droite « 60 + niveau + (distance − 1) »');
  assert.notEqual(delaiDeplacementTicks(etat, 10), Math.round(700 * TICKS_PAR_HEURE / 600));

  // Au plafond de niveau, et à la distance maximale : le PIRE cas du jeu.
  baseCourante(etat).disposition[0].niveau = GEOGRAPHIE.niveauPlafond;
  assert.equal(niveauDesBatiments(baseCourante(etat).disposition), 500);
  assert.equal(delaiDeplacementTicks(etat, 10), 24 * TICKS_PAR_HEURE, '24 h tout rond');
  // ⚠ ET LÀ, LA DISTANCE COMPTE POUR DE BON : à distance 1 le même niveau rend
  // 3 h 18. Sans cette ligne, une lecture qui ignorerait la distance passerait.
  assert.equal(delaiDeplacementTicks(etat, 1), Math.round(1980 * TICKS_PAR_HEURE / 600), '3 h 18');
  assert.ok(delaiDeplacementTicks(etat, 10) > 7 * delaiDeplacementTicks(etat, 1),
    'au plafond, dix cases ne coûtent plus sept fois une case');
  // ⚠ LA FALSIFICATION DE LA DROITE, AU PLAFOND : elle rendait 1 h 59.
  assert.notEqual(delaiDeplacementTicks(etat, 10), Math.round(1190 * TICKS_PAR_HEURE / 600),
    'le barème est revenu à la droite du lot RÈGLES-DE-CARTE');
  // ⚠ ET CELLE DE L'INTERPOLATION D'AVANT : elle rendait 24 h à TOUTE distance.
  assert.notEqual(delaiDeplacementTicks(etat, 1), 24 * TICKS_PAR_HEURE,
    'le barème est revenu à l\'interpolation 1 h → 24 h du relevé de TA');

  // ⚠⚠ LES CINQ ANCRAGES D'ETHAN, UN PAR UN, ET LE DOUBLEMENT ENTRE EUX.
  for (const [niveau, heures] of [[10, 1.5], [20, 3], [30, 6], [40, 12], [50, 24]]) {
    baseCourante(etat).disposition[0].niveau = niveau;
    assert.equal(delaiDeplacementTicks(etat, 10), heures * TICKS_PAR_HEURE,
      `niveau ${niveau}, dix cases : ${heures} h attendues`);
  }

  // ⚠⚠ ET AU MILIEU, C'EST LÀ QUE LE PIÈGE DES DIXIÈMES MORD — il n'a changé ni
  // de nature ni d'endroit, seulement de valeur attendue. Une base de niveau
  // 25,5 interpole entre les plafonds du 25 (2546) et du 26 (2728), soit 2637,
  // puis paie un dixième de sa marge : 600 + 204 = **804**. Lire
  // `niveauDesBatiments` comme un ENTIER donnerait 255, hors de la table, donc
  // `NaN` — c'est-à-dire un délai qui ne LÈVE pas et qui déverrouille le geste.
  baseCourante(etat).disposition[0].niveau = 25;
  baseCourante(etat).disposition.push({
    id: 'caserne', rangee: 13, colonne: 1, niveau: 26, degatsMilli: 0,
  });
  baseCourante(etat).economie.residus.push({ quartz: 0, scorie: 0, electricite: 0 });
  assert.equal(niveauDesBatiments(baseCourante(etat).disposition), 255, 'moyenne de 25 et 26 : 25,5');
  const milieu = delaiDeplacementTicks(etat, 1);
  assert.equal(milieu, Math.round(804 * TICKS_PAR_HEURE / 600), '80,4 minutes, au dixième');
  assert.ok(Number.isFinite(milieu), 'le niveau est lu comme un entier : la table rend NaN');
  // ⚠ ET LE DEMI-NIVEAU SE VOIT : arrondir à 25 ou à 26 rendrait un autre nombre.
  // ⚠ LES DEUX BÂTIMENTS CHANGENT ENSEMBLE : n'en bouger qu'un laisse la moyenne
  // à 25,5, donc rend le même nombre et ne mesure rien. Le premier jet de cette
  // ligne l'a fait, et l'assertion l'a dit.
  for (const b of baseCourante(etat).disposition) b.niveau = 25;
  assert.equal(niveauDesBatiments(baseCourante(etat).disposition), 250);
  const a25 = delaiDeplacementTicks(etat, 1);
  for (const b of baseCourante(etat).disposition) b.niveau = 26;
  assert.equal(niveauDesBatiments(baseCourante(etat).disposition), 260);
  const a26 = delaiDeplacementTicks(etat, 1);
  assert.notEqual(milieu, a25, 'le niveau est arrondi vers le bas');
  assert.notEqual(milieu, a26, 'le niveau est arrondi vers le haut');
  assert.ok(a25 < milieu && milieu < a26, 'le demi-niveau ne tombe plus entre ses deux voisins');

  // La distance est bornée des deux côtés — un déplacement de zéro case n'existe
  // pas, et onze cases sont hors de portée.
  assert.throws(() => delaiDeplacementTicks(etat, 0), RangeError);
  assert.throws(() => delaiDeplacementTicks(etat, DEPLACEMENT.porteeMaxCases + 1), RangeError);

  // Le barème vient des DONNÉES, il n'est pas écrit dans le module.
  assert.equal(DEPLACEMENT.delai, GEOGRAPHIE.delaiDeplacement,
    'le délai est recopié au lieu d\'être référencé');
  assert.equal(DEPLACEMENT.delai.plancherDixiemesDeMinute, 600);
  assert.equal(DEPLACEMENT.delai.plafondsParNiveau.length, GEOGRAPHIE.niveauPlafond);
  // ⚠ ET LES ANCIENNES TABLES NE TRAÎNENT PAS À CÔTÉ DE LA NEUVE. Deux tables
  // pour une grandeur, c'est une occasion de divergence, et `CLAUDE.md` §4
  // l'interdit. Les DEUX qui précèdent sont nommées : celle en heures du lot
  // DÉPLACEMENT, celle en minutes du lot RÈGLES-DE-CARTE.
  assert.equal(GEOGRAPHIE.delaiEntreSautsHeures, undefined,
    'l\'ancien couple en heures est resté dans GEOGRAPHIE à côté du neuf');
  assert.equal(GEOGRAPHIE.delaiDeplacementMinutes, undefined,
    'les trois coefficients en minutes sont restés à côté de la table des plafonds');
  assert.equal(DEPLACEMENT.delaiHeures, undefined);
  assert.equal(DEPLACEMENT.delaiMinutes, undefined);
});

// ---------------------------------------------------------------------------
// T8 — le refus dit le temps qui reste
// ---------------------------------------------------------------------------

test('DÉPLACEMENT T8 — un second déplacement trop tôt est refusé, et le refus CHIFFRE l\'attente', () => {
  // ⚠⚠ LA BASE EST MONTÉE AU-DESSUS DU PLANCHER, SANS QUOI CE TEST NE MESURE
  // RIEN — et c'est SA PROPRE GARDE qui l'a dit au lot EMPRISES-ET-DÉLAI. Sous
  // le niveau 4,2 le plancher d'une heure couvre toute la distance, donc « trois
  // cases » et « une case » rendent le même nombre.
  const etat = baseHorsDuPlancher(partieDegagee(2026, 200));
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
  // ⚠⚠ LA DURÉE SE RELIT SUR LA BASE, ELLE NE SE RECALCULE PLUS — lot
  // RÈGLES-DE-CARTE, 10/09/2026. Le saut ci-dessus faisait TROIS cases : le
  // délai qu'il a contracté est celui de trois cases, et rien dans l'état ne le
  // dirait si le geste ne l'avait pas écrit. Le test le confronte au barème pour
  // que les deux ne puissent pas diverger.
  const du = baseCourante(etat).dernierDeplacementDelaiTicks;
  assert.equal(du, delaiDeplacementTicks(etat, 3),
    'la durée écrite au saut n\'est pas celle du barème pour trois cases');
  assert.ok(du > delaiDeplacementTicks(etat, 1),
    'le montage ne mesure rien : trois cases coûtent autant qu\'une');
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

  // ⚠ ET SA DURÉE EST `null` AUSSI — lot RÈGLES-DE-CARTE, 10/09/2026. Les deux
  // champs vont ensemble, dans les deux sens : une base qui ne s'est jamais
  // déplacée n'a contracté aucun délai.
  assert.equal(baseCourante(etat).dernierDeplacementDelaiTicks, null);
  assert.equal(baseCourante(vieux).dernierDeplacementDelaiTicks, null);

  // Falsifiable : un zéro écrit à la place de `null` ferait attendre.
  // ⚠ LE MONTAGE POSE LES DEUX CHAMPS, PARCE QUE LE GESTE LES POSE TOUS LES
  // DEUX. Un horodatage seul ne fait plus attendre — `ticksAvantProchainDeplacement`
  // sort sur la durée absente —, et c'est voulu : une durée manquante n'enferme
  // personne. Ce que ce bloc falsifie est le `null` de l'HORODATAGE ; la garde
  // symétrique, celle de la durée, est juste en dessous.
  const forge = creerEtat(7);
  baseCourante(forge).dernierDeplacementTick = 0;
  baseCourante(forge).dernierDeplacementDelaiTicks = delaiDeplacementTicks(forge, 1);
  rattraperJeu(forge, 10);
  assert.ok(ticksAvantProchainDeplacement(forge) > 0,
    'le montage ne mesure rien : un horodatage à zéro n\'attend pas non plus');

  // ⚠⚠ ET UNE DURÉE ABSENTE N'ENFERME PERSONNE. C'est la moitié qui protège les
  // vieilles sauvegardes et les montages écrits à la main : `null` vaut « aucune
  // attente », jamais « attente infinie ». Le contraire bloquerait pour toujours
  // une base dont le champ manque.
  const sansDuree = creerEtat(7);
  baseCourante(sansDuree).dernierDeplacementTick = 0;
  baseCourante(sansDuree).dernierDeplacementDelaiTicks = null;
  rattraperJeu(sansDuree, 10);
  assert.equal(ticksAvantProchainDeplacement(sansDuree), 0);
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

  // ⚠⚠ LA FLÈCHE VA D'UN CENTRE À L'AUTRE — lot CARTE-B, 06/09, ET CES DEUX
  // ASSERTIONS SE RESSERRENT AU LIEU DE SE RELÂCHER. Elles disaient
  // « retirée aux deux bouts » et se contentaient d'un `x1 > 45` / `x2 < 145`,
  // c'est-à-dire de N'IMPORTE QUEL retrait ; Ethan : « du centre de l'un au
  // centre de l'autre ». Elles nomment donc les deux centres à l'ÉGALITÉ
  // STRICTE, ce qu'un retrait, même divisé par cent, ferait tomber.
  const trait = traitDeLaFleche({ rangee: 3, colonne: 5 }, { rangee: 3, colonne: 15 }, 0, 0, 10);
  assert.equal(trait.x1, 45, 'la flèche ne part pas du centre exact de la case');
  assert.equal(trait.x2, 145, 'la flèche n\'arrive pas au centre exact de la cible');
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
  const etat = partieDegagee(2026, 200);
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
  //
  // ⚠⚠ IL MESURE ENFIN CE QUE SON TITRE ANNONCE — lot RÈGLES-DE-CARTE,
  // 10/09/2026. Il disait « les CIBLES À PORTÉE » et comptait `basesAttaquantes`,
  // c'est-à-dire l'inverse : qui peut m'attaquer, MOI. Les deux mesuraient bien
  // un effet du déplacement tant que la rangée 220 était atteignable ; elle ne
  // l'est plus — le refus `territoire-ennemi` immobilise le joueur passé la
  // rangée 275, mesuré 20/20 —, et le montage a perdu sa prémisse.
  //
  // ⚠⚠ ET LÀ OÙ LE JOUEUR PEUT ENCORE BOUGER, `basesAttaquantes` NE PEUT PAS
  // BOUGER : c'est la bande immunisée de 28 rangées mesurée au lot
  // VOISINAGE-ET-MENACE — `RAID_OUVRAGE.niveauMinimal` vaut 10, et aucune base de
  // l'Ouvrage ne le vaut au-dessus de la rangée 262. Zéro avant, zéro après, sur
  // les vingt graines : le test aurait été VERT sans rien mesurer. C'est un fait
  // à porter au rapport, pas un montage à bricoler.
  //
  // ⚠ CE QU'IL GARDE EST DONC PLUS FORT QU'AVANT : il exigeait que 10 graines sur
  // 20 voient un changement, il les exige TOUTES LES VINGT.
  let bougees = 0;
  for (let graine = 1; graine <= 20; graine += 1) {
    const etat = partie(graine, 280);
    const atteignables = casesAtteignables(etat);
    assert.ok(atteignables.length > 0, 'aucune case atteignable : le montage ne mesure rien');
    const avantCibles = ciblesAPortee(etat, baseCourante(etat)).length;
    assert.ok(avantCibles > 0, 'aucune cible à portée : le montage ne mesure rien');
    // ⚠⚠ LA DESTINATION SE DEMANDE AU MOTEUR, ELLE NE S'ÉCRIT PLUS — lot
    // VOISINAGE-ET-MENACE, 08/09/2026. Le montage sautait « dix cases plein
    // nord » ; depuis qu'aucune base ne peut se coller à une autre, cette case
    // est refusée presque partout, et un montage qui écrit une coordonnée ne
    // garde que lui-même. On prend la plus LOINTAINE des cases légales — c'est
    // celle qui déplace le plus la carte, donc celle que le test veut.
    const dest = atteignables.reduce((a, b) => (
      distanceCarreeCases(baseCourante(etat).position, b)
        > distanceCarreeCases(baseCourante(etat).position, a) ? b : a));
    deplacerLaBase(etat, dest);
    if (ciblesAPortee(etat, baseCourante(etat)).length !== avantCibles) bougees += 1;
  }
  assert.equal(bougees, 20,
    `${bougees} graines sur 20 seulement voient leurs cibles changer : le déplacement ne mord pas`);
});

// ---------------------------------------------------------------------------
// lot DÉPLACEMENT-ÉCLAIRÉ — 07/09/2026
//
// Ethan, point 1 : « confirmation avant de bouger la base + indiquer le nombre
// de base ouvrage à portée », précisé le même jour : « nombre de base ouvrage
// qui pourront attaquer ».
//
// ⚠⚠ CE N'EST PAS « LES BASES À PORTÉE DE RAID », ET LES DEUX ENSEMBLES NE
// COÏNCIDENT PAS. Il faut le TYPE et le NIVEAU MINIMAL en plus de la portée :
// mesuré ci-dessous, un camp et un avant-poste à trois cases comptent pour
// ZÉRO, et une base de niveau 9 aussi.
//
// ⚠ LES CINQ TESTS QUI SUIVENT SONT DES TESTS DE MOTEUR, et ils vivent ici
// plutôt que dans `raid-ouvrage.test.js` parce que c'est le DÉPLACEMENT qui a
// demandé la fonction. `DÉ T4` est celui qui compte : il confronte le chiffre
// annoncé à ce que `basesAttaquantes` produirait.
// ---------------------------------------------------------------------------

/**
 * Les bases de l'Ouvrage réellement présentes dans le carré de balayage d'une
 * position, avec leur distance au carré et leur niveau.
 *
 * ⚠ ELLE INTERROGE LE MONDE, ELLE NE LE FABRIQUE PAS. Une base de l'Ouvrage est
 * DÉRIVÉE de la graine : écrire « une base en (190, 16) » dans un montage ne la
 * ferait pas exister. Ce qu'on peut choisir, c'est ce qu'on RASE.
 */
function ouvragesAutour(etat, position) {
  const rayon = GEOGRAPHIE.rayonAttaque;
  const trouvees = [];
  for (let r = position.rangee - rayon; r <= position.rangee + rayon; r += 1) {
    for (let c = position.colonne - rayon; c <= position.colonne + rayon; c += 1) {
      if (!estSurLaCarte(r, c)) continue;
      if (r === position.rangee && c === position.colonne) continue;
      if (!estBaseOuvrage(etat.graine, r, c)) continue;
      trouvees.push({
        rangee: r,
        colonne: c,
        niveau: niveauDeLaRangee(r),
        d2: distanceCarreeCases(position, { rangee: r, colonne: c }),
      });
    }
  }
  return trouvees;
}

/** Rase tout ce que la liste ne garde pas, pour que le montage soit exact. */
function neGarderQue(etat, position, gardees) {
  const cles = new Set(gardees.map((b) => `${b.rangee}:${b.colonne}`));
  for (const b of ouvragesAutour(etat, position)) {
    if (cles.has(`${b.rangee}:${b.colonne}`)) continue;
    etat.basesRasees.push(caseRasee(b.rangee, b.colonne));
  }
}

test('DÉ T1 — le compte suit la PORTÉE : une dedans, une dehors, il en reste une', () => {
  // ⚠⚠ LE MONTAGE PORTE LA BORNE, ET C'EST TOUTE SA VALEUR. Deux bases toutes
  // les deux DEDANS ne diraient rien de la portée — elles compteraient toutes
  // les deux quelle que soit la règle. Il faut une base juste dedans et une
  // juste dehors, et le « dehors » doit rester DANS le carré de balayage :
  // au-delà, `ciblesAPortee` ne la regarde même pas, et le test mesurerait le
  // balayage au lieu de la portée.
  const rayon = GEOGRAPHIE.rayonAttaque;
  const carre = rayon * rayon;
  let montage = null;
  for (let graine = 1; graine <= 400 && montage === null; graine += 1) {
    const etat = partie(graine, 200);
    const position = baseCourante(etat).position;
    const autour = ouvragesAutour(etat, position)
      .filter((b) => b.niveau >= RAID_OUVRAGE.niveauMinimal);
    const dedans = autour.find((b) => b.d2 <= carre);
    const dehors = autour.find((b) => b.d2 > carre);
    if (dedans === undefined || dehors === undefined) continue;
    neGarderQue(etat, position, [dedans, dehors]);
    montage = { etat, position, dedans, dehors };
  }
  assert.ok(montage !== null, 'aucune graine ne porte le couple dedans/dehors cherché');

  // Le montage mesure quelque chose : les deux bases sont bien dans le CARRÉ,
  // et une seule dans le DISQUE.
  assert.ok(montage.dedans.d2 <= carre && montage.dehors.d2 > carre);
  assert.ok(Math.max(
    Math.abs(montage.dehors.rangee - montage.position.rangee),
    Math.abs(montage.dehors.colonne - montage.position.colonne),
  ) <= rayon, 'la base « dehors » est hors du balayage : le test mesurerait autre chose');

  assert.equal(nombreDAttaquantes(montage.etat, montage.position), 1);
});

test('DÉ T2 — le NIVEAU MINIMAL compte : niveau 9 ne compte pas, niveau 10 si', () => {
  // ⚠ LE NIVEAU D'UNE BASE DE L'OUVRAGE SE LIT SUR SA RANGÉE, et il n'y a pas
  // d'autre règle. Mesuré : les rangées 248 à 252 rendent 10, les rangées 253 à
  // 257 rendent 9 — la frontière est donc atteignable dans un même disque de
  // rayon 10.
  const seuil = RAID_OUVRAGE.niveauMinimal;
  const carre = GEOGRAPHIE.rayonAttaque * GEOGRAPHIE.rayonAttaque;
  let montage = null;
  for (let graine = 1; graine <= 400 && montage === null; graine += 1) {
    const etat = partie(graine, 252);
    const position = baseCourante(etat).position;
    const autour = ouvragesAutour(etat, position).filter((b) => b.d2 <= carre);
    const dessus = autour.find((b) => b.niveau >= seuil);
    const dessous = autour.find((b) => b.niveau === seuil - 1);
    if (dessus === undefined || dessous === undefined) continue;
    neGarderQue(etat, position, [dessus, dessous]);
    montage = { etat, position, dessus, dessous };
  }
  assert.ok(montage !== null, 'aucune graine ne porte le couple niveau 9 / niveau 10 cherché');
  assert.equal(montage.dessous.niveau, seuil - 1, 'le montage ne mesure pas la borne');
  assert.ok(montage.dessus.niveau >= seuil);
  assert.equal(nombreDAttaquantes(montage.etat, montage.position), 1);
});

test('DÉ T3 — le TYPE compte : un camp et un avant-poste à portée valent ZÉRO', () => {
  // ⚠ LE FILTRE EST DANS LES DONNÉES — `TYPES_SITE[x].attaqueLeJoueur`. Un camp
  // et un avant-poste sont du BUTIN, pas une menace, et le bord ambre de la
  // carte le dit déjà au joueur.
  const etat = partie(7, 200);
  const position = baseCourante(etat).position;
  neGarderQue(etat, position, []);
  assert.equal(nombreDAttaquantes(etat, position), 0, 'le montage part d\'un monde vide');

  // Les satellites, eux, SE POSENT : ce sont de l'histoire, pas une dérivation.
  const laBase = baseCourante(etat);
  laBase.satellites.presents = [
    {
      type: 'camp', niveau: 30, rangee: position.rangee - 3, colonne: position.colonne,
      instance: 1, tickDu: 0,
    },
    {
      type: 'avantPoste', niveau: 40, rangee: position.rangee + 4, colonne: position.colonne,
      instance: 2, tickDu: 0,
    },
  ];
  // Le montage mesure quelque chose : les deux sites sont bien VUS à portée.
  const vus = ciblesAPortee(etat, { position }).filter((s) => s.type !== 'base');
  assert.equal(vus.length, 2, 'le montage ne pose pas ses deux satellites à portée');
  for (const s of vus) assert.ok(s.niveau >= RAID_OUVRAGE.niveauMinimal, 'le niveau ne discrimine pas ici');

  assert.equal(nombreDAttaquantes(etat, position), 0);
});

test('DÉ T4 — UNE SEULE ÉCRITURE : le compte annoncé égale ce que `basesAttaquantes` produit', () => {
  // ⚠⚠ C'EST LE TEST CENTRAL DU LOT. Sans lui, rien ne garantit que l'annonce
  // faite au joueur et le moteur qui la démentira disent la même chose — et la
  // divergence serait plausible, stable, et découverte au premier raid subi.
  // C'est ce que le lot FICHE-JUSTE a réparé entre `voisinsQualifiants` et
  // `voisinsQualifiantsParCase`, où un commentaire affirmait l'accord sans que
  // rien ne le mesure.
  const etat = partie(2026, 200);
  const laBase = baseCourante(etat);
  let vus = 0;
  let nonNuls = 0;
  for (let i = 0; i < 100; i += 1) {
    const rangee = 20 + ((i * 37) % 260);
    const colonne = 1 + ((i * 13) % GEOGRAPHIE.carte.largeur);
    laBase.position.rangee = rangee;
    laBase.position.colonne = colonne;
    const attendu = new Set(
      basesAttaquantes(etat).map((s) => `${s.rangee}:${s.colonne}`),
    ).size;
    assert.equal(
      nombreDAttaquantes(etat, { rangee, colonne }), attendu,
      `(${rangee}, ${colonne}) : l'annonce et le moteur ont divergé`,
    );
    vus += 1;
    if (attendu > 0) nonNuls += 1;
  }
  // ⚠ ET LE BALAYAGE MESURE QUELQUE CHOSE. Cent positions qui rendraient toutes
  // zéro passeraient sur n'importe quel code — c'est la faute que ce fichier
  // s'est déjà faite au lot SATELLITES-RESPAWN, où une graine unique laissait
  // la falsification muette.
  assert.equal(vus, 100);
  assert.ok(nonNuls >= 50, `seulement ${nonNuls} positions sur 100 portent une attaquante`);
});

test('DÉ T5 — une attaquante compte pour UNE, même à portée de deux bases du joueur', () => {
  // ⚠ DEPUIS RAID-CIBLE-UNIQUE, une base de l'Ouvrage ne frappe qu'une cible.
  // Ce qu'on annonce, ce sont les BASES OUVRAGE qui pourront frapper CETTE
  // position — une par base, jamais une par paire.
  const etat = partie(2026, 200);
  const position = { rangee: 200, colonne: 16 };
  baseCourante(etat).position.rangee = position.rangee;
  baseCourante(etat).position.colonne = position.colonne;
  const seule = nombreDAttaquantes(etat, position);
  assert.ok(seule > 0, 'le montage ne mesure rien : aucune attaquante');

  // ⚠⚠ LA SECONDE BASE NE SE POSE PAS SUR UNE ATTAQUANTE, ET LA PREMIÈRE
  // ÉCRITURE DU MONTAGE L'A FAIT. Mesuré : le compte tombait de 49 à 48, dans le
  // sens INVERSE de la faute qu'on cherche — `siteDeLaCase` rend `null` sur
  // toute case occupée par une base du joueur, donc fonder sur une base de
  // l'Ouvrage l'efface de la carte. Le montage cherche donc une case libre.
  const carreDePortee = GEOGRAPHIE.rayonAttaque * GEOGRAPHIE.rayonAttaque;
  const occupees = new Set(
    ouvragesAutour(etat, position).map((b) => `${b.rangee}:${b.colonne}`),
  );
  let seconde = null;
  for (let d = 1; d <= 4 && seconde === null; d += 1) {
    for (const candidate of [
      { rangee: position.rangee + d, colonne: position.colonne },
      { rangee: position.rangee, colonne: position.colonne + d },
      { rangee: position.rangee - d, colonne: position.colonne },
    ]) {
      if (occupees.has(`${candidate.rangee}:${candidate.colonne}`)) continue;
      if (!estSurLaCarte(candidate.rangee, candidate.colonne)) continue;
      seconde = candidate;
      break;
    }
  }
  assert.ok(seconde !== null, 'aucune case libre pour poser la seconde base');
  ajouterUneBase(etat, seconde);
  assert.equal(etat.bases.length, 2, 'la seconde base n\'a pas été fondée');
  const partagees = ouvragesAutour(etat, position)
    .filter((b) => b.d2 <= carreDePortee
      && b.niveau >= RAID_OUVRAGE.niveauMinimal
      && distanceCarreeCases(seconde, b) <= carreDePortee);
  assert.ok(partagees.length > 0, 'le montage ne partage aucune attaquante entre les deux bases');

  assert.equal(nombreDAttaquantes(etat, position), seule,
    'le compte d\'une position a doublé quand une seconde base est arrivée à portée');
});

// ---------------------------------------------------------------------------
// RC T4, RC T5 et RC T7 — lot RÈGLES-DE-CARTE, 10/09/2026
// ---------------------------------------------------------------------------

/** Une base dont `niveauDesBatiments` rend EXACTEMENT les dixièmes voulus. */
function baseAuNiveau(etat, dixiemes) {
  const laBase = baseCourante(etat);
  const entier = Math.floor(dixiemes / 10);
  const hauts = dixiemes % 10;
  laBase.disposition.length = 0;
  laBase.economie.residus.length = 0;
  for (let i = 0; i < 10; i += 1) {
    laBase.disposition.push({
      id: i === 0 ? 'chantierDeConstruction' : 'accumulateur',
      rangee: 11 + Math.floor(i / 9), colonne: 1 + (i % 9),
      niveau: i < hauts ? entier + 1 : entier, degatsMilli: 0,
    });
    laBase.economie.residus.push({ quartz: 0, scorie: 0, electricite: 0 });
  }
  assert.equal(niveauDesBatiments(laBase.disposition), dixiemes,
    `le montage ne pose pas le niveau ${dixiemes / 10}`);
  return etat;
}

test('RC T4 — la table de contrôle du barème tombe juste, ligne par ligne', () => {
  // ⚠⚠ CES CINQ LIGNES SONT RÉANCRÉES AU LOT EMPRISES-ET-DÉLAI, ET LE NOMBRE
  // D'AVANT EST ÉCRIT À CÔTÉ DE CELUI D'APRÈS. Elles figeaient la droite
  // `60 + niveau + (distance − 1)` qu'Ethan avait dictée le 10/09 au matin ; il
  // est revenu dessus le SOIR MÊME — cinq ancrages qui DOUBLENT tous les dix
  // niveaux, plus un plancher d'une heure. C'est la PRÉMISSE qui a cessé d'être
  // vraie, et ce test-ci garde ce qu'il gardait déjà : que le barème vient des
  // données, que les cinq montages discriminent, et que les dixièmes vivent.
  //
  // ⚠ LE CALCUL RESTE ENTIÈREMENT EN ENTIERS, et on remonte des ticks aux
  // dixièmes de minute plutôt que de recopier `TICKS_PAR_HEURE`.
  //
  // ⚠⚠ ET LA LIGNE « 1 / 1 » A CHANGÉ DE NATURE, PAS SEULEMENT DE VALEUR : elle
  // rendait 610 par la droite, elle rend **600** parce que le PLANCHER la
  // couvre. C'est le « 1 h mini » d'Ethan, et il mord jusqu'au niveau 4,2 —
  // `ED T7` le mesure. La ligne « 5 / 4 » est dans le même cas : 614 au lieu de
  // 680, dont 14 seulement de distance.
  //
  // ⚠ LA LIGNE 8,6 RESTE CELLE QUI COMPTE — la seule qui prouve que les DIXIÈMES
  // ne sont pas lus comme des entiers. Elle passe de 686 à **622**, et son
  // chemin complet est refait dans `ED T6`.
  const table = [
    // [dixièmes de niveau, distance, dixièmes de minute attendus, libellé]
    [10, 1, 600, '1 h 00'],       // 610 sous la droite de RÈGLES-DE-CARTE
    [50, 4, 614, '1 h 01,4'],     // 680 sous la droite
    [86, 1, 622, '1 h 02,2'],     // 686 sous la droite
    [200, 1, 720, '1 h 12'],      // 800 sous la droite
    [500, 10, 14400, '24 h 00'],  // 1190 sous la droite, soit 1 h 59
  ];
  for (const [dixiemes, distance, attendu, libelle] of table) {
    const etat = baseAuNiveau(creerEtat(7), dixiemes);
    const ticks = delaiDeplacementTicks(etat, distance);
    // ⚠ ON REMONTE DES TICKS AUX DIXIÈMES DE MINUTE, ET C'EST EXACT : un dixième
    // de minute vaut six secondes, donc soixante ticks à 10 Hz. Comparer des
    // ticks à un nombre écrit à la main ferait recopier `TICKS_PAR_HEURE`.
    assert.equal(ticks * 600, attendu * TICKS_PAR_HEURE,
      `niveau ${dixiemes / 10}, distance ${distance} : ${libelle} attendu`);
  }
  // ⚠ ET LES CINQ LIGNES SONT DEUX À DEUX DIFFÉRENTES, sans quoi la table ne
  // mesurerait qu'une constante.
  const rendus = table.map(([d, dist]) => delaiDeplacementTicks(baseAuNiveau(creerEtat(7), d), dist));
  assert.equal(new Set(rendus).size, table.length, 'deux lignes de la table rendent le même délai');
});

test('RC T5 — la durée est FIGÉE au saut : améliorer sa base ne rallonge pas l\'attente', () => {
  // ⚠⚠ C'EST LA RAISON DU BUMP DE `SAVE_VERSION`. Tant que le délai ne dépendait
  // que du niveau, `ticksAvantProchainDeplacement` pouvait le recalculer ; depuis
  // qu'il dépend de la DISTANCE PARCOURUE, le recalcul ne sait plus de combien la
  // base a sauté — et un saut de dix cases se déverrouillerait au tarif d'un saut
  // d'une case. La base porte donc la durée qu'elle a CONTRACTÉE.
  // ⚠ MONTÉE AU-DESSUS DU PLANCHER : voir `baseHorsDuPlancher`. Sa garde « dix
  // cases coûtent autant qu'une » a mordu au lot EMPRISES-ET-DÉLAI, et elle
  // avait raison — la distance est gratuite sous le niveau 4,2.
  const etat = baseHorsDuPlancher(partieDegagee(2026, 200));
  const depart = { ...baseCourante(etat).position };
  const cible = { rangee: depart.rangee - 10, colonne: depart.colonne };
  assert.deepEqual(problemesDuDeplacement(etat, cible), [], 'le montage ne peut pas sauter de dix cases');
  deplacerLaBase(etat, cible);

  const contracte = baseCourante(etat).dernierDeplacementDelaiTicks;
  assert.equal(contracte, delaiDeplacementTicks(etat, 10), 'la durée écrite n\'est pas celle de dix cases');
  // ⚠ ET DIX CASES COÛTENT PLUS QU'UNE, sans quoi ce test ne mesurerait rien.
  assert.ok(contracte > delaiDeplacementTicks(etat, 1),
    'le montage ne discrimine pas : dix cases coûtent autant qu\'une');

  // Le temps passe, l'attente FOND, un tick par tick.
  assert.equal(ticksAvantProchainDeplacement(etat), contracte);
  rattraperJeu(etat, 100);
  assert.equal(ticksAvantProchainDeplacement(etat), contracte - 100);

  // ⚠⚠ ET ON MONTE LA BASE DE PLUSIEURS NIVEAUX : L'ATTENTE NE DOIT PAS
  // RALLONGER. Un recalcul à chaque lecture la ferait grandir — le joueur se
  // retrouverait plus bloqué qu'au moment où il a sauté, pour avoir amélioré ses
  // bâtiments. C'est la falsification de ce test.
  const avant = ticksAvantProchainDeplacement(etat);
  for (const batiment of baseCourante(etat).disposition) batiment.niveau += 20;
  assert.ok(niveauDesBatiments(baseCourante(etat).disposition) > 200,
    'le montage ne mesure rien : le niveau n\'a pas monté');
  assert.equal(ticksAvantProchainDeplacement(etat), avant,
    'le délai se recalcule à la lecture : monter sa base rallonge l\'attente');
  assert.ok(delaiDeplacementTicks(etat, 10) > contracte,
    'le montage ne discrimine pas : le barème rend le même nombre après la montée');

  // Et elle finit par tomber à zéro, sans jamais remonter.
  rattraperJeu(etat, contracte);
  assert.equal(ticksAvantProchainDeplacement(etat), 0);

  // ⚠⚠ ET LA DISTANCE EST EUCLIDIENNE, PAS TCHEBYCHEV — LA DIAGONALE EST LE SEUL
  // ENDROIT OÙ LES DEUX DIVERGENT, DONC LE SEUL QUI LES DÉPARTAGE. Un saut de
  // (7, 7) fait SEPT cases de Tchebychev et DIX en ligne droite : le tarif d'un
  // saut au coin du disque est celui du coin, pas celui du côté. Sans cette
  // moitié-ci, lire la distance au carré de Tchebychev ne ferait tomber aucun
  // test — mesuré.
  // ⚠ SUR UN MONTAGE NEUF : la base d'à côté a déjà sauté de dix cases, et le
  // dégagement était centré sur son point de DÉPART.
  const second = baseHorsDuPlancher(partieDegagee(2026, 200));
  const oblique = { ...baseCourante(second).position };
  const coin = { rangee: oblique.rangee - 7, colonne: oblique.colonne - 7 };
  assert.deepEqual(problemesDuDeplacement(second, coin), [], 'le montage ne peut pas sauter en diagonale');
  const tchebychev = Math.max(
    Math.abs(oblique.rangee - coin.rangee), Math.abs(oblique.colonne - coin.colonne),
  );
  const ligneDroite = casesEnLigneDroite(distanceCarreeCases(oblique, coin));
  assert.equal(tchebychev, 7);
  assert.equal(ligneDroite, 10, 'le montage ne discrimine pas : les deux distances coïncident');
  deplacerLaBase(second, coin);
  assert.equal(baseCourante(second).dernierDeplacementDelaiTicks,
    delaiDeplacementTicks(second, ligneDroite),
    'la distance du saut est prise en Tchebychev au lieu de la ligne droite');
});

test('RC T7 — on ne déplace pas sa base en territoire de l\'Ouvrage', () => {
  // ⚠⚠ POINT 16 D'ETHAN, 10/09 : « Je ne dois pas pouvoir poser ma base dans [le]
  // territoire ouvrage ». La règle existait à la FONDATION et manquait au
  // DÉPLACEMENT : on fondait loin, puis on sautait dans le violet au geste
  // suivant, et le contournement était à un toucher.
  // ⚠⚠ LE MONTAGE EST CELUI D'AVANT LE LOT, ET C'EST TOUT SON INTÉRÊT. Le rayon
  // par défaut de `partieDegagee` s'est élargi CE JOUR-CI jusqu'à
  // `rayonInfluenceEnnemie` pour que les sept tests d'à côté cessent de mesurer
  // la densité ; ici, c'est justement la règle qu'on mesure, donc on reprend le
  // rayon d'hier. À onze cases, la base de l'Ouvrage la plus proche survit juste
  // au-delà du disque : son octogone peint la couronne sans que son 3 × 3
  // n'encombre les cases qu'elle tient, si bien qu'un refus y est le refus de
  // territoire ET RIEN D'AUTRE. **Mesuré : 23 cases violettes, 293 destinations
  // au lieu des 316 du disque — l'écart EST le nombre de cases violettes.**
  const etat = partieDegagee(2026, 200, RAYON_ENCOMBREMENT);
  const laBase = baseCourante(etat);
  const ici = laBase.position;

  // On cherche une case à portée que la carte donne à l'OUVRAGE, et qui ne soit
  // refusée par rien d'autre — sinon ce test mesurerait le voisinage.
  let violette = null;
  let violettes = 0;
  for (let r = ici.rangee - DEPLACEMENT.porteeMaxCases; r <= ici.rangee + DEPLACEMENT.porteeMaxCases; r += 1) {
    for (let c = ici.colonne - DEPLACEMENT.porteeMaxCases; c <= ici.colonne + DEPLACEMENT.porteeMaxCases; c += 1) {
      if (campDeLaCase(etat, r, c) !== OUVRAGE) continue;
      const codes = problemesDuDeplacement(etat, { rangee: r, colonne: c }).map((p) => p.code);
      if (codes.length !== 1 || codes[0] !== 'territoire-ennemi') continue;
      violettes += 1;
      if (violette === null) violette = { rangee: r, colonne: c };
    }
  }
  assert.ok(violette !== null,
    'le montage ne mesure rien : aucune case tenue par l\'Ouvrage refusée pour CETTE seule raison');

  // ⚠ LE MESSAGE EST CELUI DE LA FONDATION, MOT POUR MOT — une seule écriture,
  // deux lecteurs. Deux formulations divergeraient au premier réglage.
  const refus = problemesDuDeplacement(etat, violette);
  assert.deepEqual(refus, problemesDuTerritoireTenu(etat, violette));
  assert.match(refus[0].message, /tenue par l'Ouvrage/);
  assert.throws(() => deplacerLaBase(etat, violette), /tenue par l'Ouvrage/);

  // ⚠⚠ ET `casesAtteignables` SUIT PAR CONSTRUCTION : elle INTERROGE
  // `problemesDuDeplacement` au lieu de réécrire ses règles. C'est ce que `VM T8`
  // garde depuis VOISINAGE ; ce test-ci le vérifie sur la case exacte, parce que
  // proposer une case que le geste refuse est le défaut le plus probable du lot.
  const atteignables = casesAtteignables(etat);
  assert.ok(atteignables.length > 0, 'le montage ne mesure rien : aucune destination');
  // ⚠⚠ ET LE COMPTE TOMBE JUSTE : le disque de dix cases en porte 316, la règle
  // en retire EXACTEMENT les violettes. Sans cette égalité, « la case n'est plus
  // proposée » passerait sur une `casesAtteignables` qui aurait cessé de
  // proposer quoi que ce soit.
  assert.equal(violettes, 23, 'le montage a changé : recompter les cases violettes');
  assert.equal(atteignables.length, 316 - violettes,
    'l\'écart entre le disque et les destinations n\'est pas le compte des cases violettes');
  assert.equal(
    atteignables.some((k) => k.rangee === violette.rangee && k.colonne === violette.colonne),
    false,
    'casesAtteignables propose une case tenue par l\'Ouvrage',
  );
  // ⚠ ET AUCUNE des cases proposées n'est violette — la propriété entière, pas
  // seulement celle qu'on vient de nommer.
  for (const k of atteignables) {
    assert.notEqual(campDeLaCase(etat, k.rangee, k.colonne), OUVRAGE,
      `casesAtteignables propose (${k.rangee}, ${k.colonne}), tenue par l'Ouvrage`);
  }

  // ⚠⚠ ET L'ORDRE DES TROIS REFUS EST CELUI DU BRIEF : voisinage, PUIS
  // territoire, PUIS délai. Il se lit sur une partie ORDINAIRE, pas sur le
  // montage dégagé — mesuré, **432 cases de la graine 2026 en rangée 200 portent
  // les deux premiers codes à la fois**, et le dégagement les fait toutes
  // disparaître par construction. Sans cette moitié-ci, déplacer le refus au
  // premier rang ne ferait tomber aucun test, et le joueur lirait « tenue par
  // l'Ouvrage » devant une case que le voisinage refuse de toute façon.
  const dense = partie(2026, 200);
  const laDense = baseCourante(dense);
  rattraperJeu(dense, TICKS_PAR_HEURE);
  laDense.dernierDeplacementTick = dense.horloge.nbTicks;
  laDense.dernierDeplacementDelaiTicks = delaiDeplacementTicks(dense, 1);
  const p0 = laDense.position;
  let trois = null;
  for (let r = p0.rangee - 10; r <= p0.rangee + 10 && trois === null; r += 1) {
    for (let c = p0.colonne - 10; c <= p0.colonne + 10; c += 1) {
      const codes = problemesDuDeplacement(dense, { rangee: r, colonne: c }).map((x) => x.code);
      if (codes.includes('voisinage') && codes.includes('territoire-ennemi')
        && codes.includes('delai')) { trois = codes; break; }
    }
  }
  assert.ok(trois !== null,
    'le montage ne mesure rien : aucune case ne porte les trois refus à la fois');
  assert.ok(trois.indexOf('voisinage') < trois.indexOf('territoire-ennemi'),
    `le refus de territoire passe devant le voisinage : ${trois.join(', ')}`);
  assert.ok(trois.indexOf('territoire-ennemi') < trois.indexOf('delai'),
    `le délai passe devant le refus de territoire : ${trois.join(', ')}`);

  // ⚠⚠ ET LE DÉPART N'EST PAS TOUCHÉ, MESURÉ : la garde du peuplement écarte
  // l'Ouvrage de quinze cases autour de la base de départ, donc la règle n'y
  // retire pas une seule destination. C'est le même nombre qu'au lot VOISINAGE.
  const neuve = creerEtat(2026);
  assert.equal(casesAtteignables(neuve).length, 261,
    'le refus mord au DÉPART : ce n\'est pas ce que la règle doit faire');
});
