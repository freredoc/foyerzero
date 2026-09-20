// Tests de géométrie du lot 2A, et T16 du brief (cohérence arithmétique).
//
// Chaque seuil porte son calcul en commentaire. Un test dont le seuil n'est
// pas justifié est un test raté.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GRILLE, OBSTACLES, UNITES, DEFENSES, COLONNES_DEGATS } from '../src/data/combat.js';
import { POINTS_RECHERCHE, GEOGRAPHIE } from '../src/data/sites.js';
import {
  MILLI_PAR_CASE,
  PREMIERE_RANGEE,
  PREMIERE_COLONNE,
  DERNIERE_COLONNE,
  DERNIERE_RANGEE,
  enEntier,
  milliDepuisCase,
  caseDepuisMilli,
  distanceCarreeMilli,
  estSortiParLeCote,
  estDansLaGrille,
  estDansLaBande,
  bornesBande,
  estSortiParLeHaut,
  creerOccupation,
  poser,
  retirer,
  occupantDe,
  cleCase,
  indexerObstacles,
  typeObstacleSur,
  obstacleConcerne,
  vitesseSousObstacle,
  DIVISEUR_OBSTACLE_MILLI,
  verifierGrille,
  derniereRangee,
  derniereColonne,
} from '../src/sim/grille.js';
import {
  verifierArithmetique, TICKS_MAX_COMBAT, TICKS_PAR_VAGUE, facteurRechercheMilli,
  creerCombat, rangeeDefenseFranchie, RANGEE_DEFENSE_FRANCHIE, serialiserEtat,
} from '../src/sim/combat.js';
import {
  genererSite, genererVague, tiersDeLaDefense, rangeeLaPlusAvanceeQuiTire,
} from '../src/sim/generateur.js';
import {
  calculerProjection, grilleDeLaProjection, xDeColonne, xDeColonneMilli, yDeRangee,
  yDeRangeeMilli, caseDepuisPixels,
} from '../src/render/projection.js';
import {
  BANDES, bandesDe, voilesDeLaBande, basculeDeBande, bornesDeDefilement, bandeDeLaRangee,
  casesDeLaBande, bornesDuDecalage, bornesDuDecalageX,
} from '../src/render/bandes.js';
import {
  ligneEcranDeLaRangee, rangeeDeLaLigneEcran, ligneEcranDeLaBande,
} from '../src/render/orientation.js';
import { casesAPortee } from '../src/render/portee.js';
import {
  MUR_CASES, LARGEUR_EN_CASES, HAUTEUR_EN_CASES, HAUTEUR_IMAGE_EN_CASES, largeurEnCases,
  hauteurEnCases, rectangleDuFond,
} from '../src/render/fond.js';
import { listeArsenal, listeDefense } from '../src/render/scene.js';

const RACINE_DEPOT = join(dirname(fileURLToPath(import.meta.url)), '..');

test('G1 — conversions en milli-cases, exactes et réversibles', () => {
  assert.equal(MILLI_PAR_CASE, 1000);
  assert.equal(milliDepuisCase(3), 3000);
  assert.equal(milliDepuisCase(18), 18000);
  // La case d'une position est celle qui la contient : [3000, 3999] → 3.
  assert.equal(caseDepuisMilli(3000), 3);
  assert.equal(caseDepuisMilli(3999), 3);
  assert.equal(caseDepuisMilli(4000), 4);
  for (let n = PREMIERE_RANGEE; n <= DERNIERE_RANGEE; n++) {
    assert.equal(caseDepuisMilli(milliDepuisCase(n)), n, `aller-retour cassé en ${n}`);
  }

  // enEntier refuse ce qui n'est pas entier plutôt que d'arrondir en silence.
  assert.equal(enEntier(1.5, 1000, 'essai'), 1500);
  assert.throws(() => enEntier(1.0005, 1000, 'essai'), /n'est pas entier/);
});

test('G2 — distances au carré, en milli-case², sans racine, LES DEUX AXES EN MILLI', () => {
  // ⚠⚠ LES DEUX AXES EN MILLI DEPUIS LE LOT COLONNE. La fonction s'appelait
  // `distanceCarree` et prenait la colonne en CASES, qu'elle convertissait
  // elle-même. Elle a été RENOMMÉE plutôt qu'élargie en place : sous l'ancien
  // nom, un appelant oublié aurait passé une colonne en cases et le carré aurait
  // été faux d'un facteur 1 000 000 sur l'axe horizontal, SANS LEVER.
  // (3,5) → (4,4) : dr = 1000, dc = 1000 → 1000² + 1000² = 2 000 000.
  assert.equal(distanceCarreeMilli(3000, 5000, 4000, 4000), 2_000_000);
  // (3,5) → (4,6) : strictement la même distance, l'ordre total tranche ailleurs.
  assert.equal(distanceCarreeMilli(3000, 5000, 4000, 6000), 2_000_000);
  // Même colonne, trois cases d'écart : 3000² = 9 000 000.
  assert.equal(distanceCarreeMilli(5000, 5000, 8000, 5000), 9_000_000);
  // Portée 5,5 → 5500² = 30 250 000 ; portée mini 3,5 → 3500² = 12 250 000.
  assert.equal(5500 * 5500, 30_250_000);
  assert.equal(3500 * 3500, 12_250_000);
  // La distance est symétrique et nulle sur soi-même.
  assert.equal(distanceCarreeMilli(4000, 2000, 4000, 2000), 0);
  assert.equal(
    distanceCarreeMilli(1000, 1000, 9000, 9000),
    distanceCarreeMilli(9000, 9000, 1000, 1000),
  );
  // ⚠ ET UNE DEMI-CASE LATÉRALE SE MESURE, ce qu'aucune colonne entière ne
  // pouvait exprimer : c'est très exactement ce que le lot COLONNE achète.
  assert.equal(distanceCarreeMilli(3000, 5000, 3000, 5500), 250_000);
});

test('COL T10 — la borne latérale refuse les deux côtés, et rien entre les deux', () => {
  // ⚠ ELLE EST PURE ET EXPORTÉE POUR QU'UN TEST L'ATTEIGNE SANS MONTER UN
  // COMBAT — §2.5 du brief. `peutAvancer` reste verticale : on ne lui ajoute pas
  // un paramètre d'axe qui en ferait deux fonctions dans une.
  for (let c = PREMIERE_COLONNE; c <= DERNIERE_COLONNE; c += 1) {
    assert.equal(estSortiParLeCote(c * 1000), false, `colonne ${c} est sur la grille`);
    assert.equal(estSortiParLeCote(c * 1000 + 999), false, `colonne ${c} au bord droit`);
  }
  // Un milli-case au-delà de chaque bord, des deux côtés.
  assert.equal(estSortiParLeCote(PREMIERE_COLONNE * 1000 - 1), true);
  assert.equal(estSortiParLeCote(DERNIERE_COLONNE * 1000 + 1000), true);
  assert.equal(estSortiParLeCote(0), true);
  // Falsifiable : le montage doit voir de vrais refus ET de vraies acceptations.
  assert.equal(DERNIERE_COLONNE, GRILLE.largeur);
});

test('G3 — bornes de la grille et des trois bandes contiguës', () => {
  assert.equal(GRILLE.largeur, 9);
  assert.equal(GRILLE.longueur, 18);
  assert.ok(estDansLaGrille(1, 1) && estDansLaGrille(18, 9));
  assert.ok(!estDansLaGrille(0, 1) && !estDansLaGrille(19, 1));
  assert.ok(!estDansLaGrille(1, 0) && !estDansLaGrille(1, 10));
  assert.ok(!estDansLaGrille(1.5, 1), 'une rangée non entière n\'est pas une case');

  // Trois bandes contiguës, aucun terrain neutre : 2 + 8 + 8 = 18 rangées.
  const deploiement = bornesBande('deploiement');
  const defense = bornesBande('defense');
  const batiments = bornesBande('batiments');
  assert.deepEqual([deploiement.premiere, deploiement.derniere], [1, 2]);
  assert.deepEqual([defense.premiere, defense.derniere], [3, 10]);
  assert.deepEqual([batiments.premiere, batiments.derniere], [11, 18]);
  assert.equal(defense.premiere, deploiement.derniere + 1);
  assert.equal(batiments.premiere, defense.derniere + 1);
  assert.equal(batiments.derniere, GRILLE.longueur);
  // 8 rangées × 9 colonnes = 72 cases de bâtiments, base de SITES-DENSITE.
  assert.equal((batiments.derniere - batiments.premiere + 1) * GRILLE.largeur, GRILLE.casesBatiments);

  assert.ok(estDansLaBande(3, 'defense') && estDansLaBande(10, 'defense'));
  assert.ok(!estDansLaBande(2, 'defense') && !estDansLaBande(11, 'defense'));
  assert.throws(() => estDansLaBande(3, 'nulle_part'), /bande inconnue/);
});

test('G4 — une case, une entité bloquante', () => {
  const occupation = creerOccupation();
  assert.equal(occupantDe(occupation, 4, 5), undefined);
  poser(occupation, 4, 5, 7);
  assert.equal(occupantDe(occupation, 4, 5), 7);
  // La clé sépare bien rangée et colonne : (4,5) et (5,4) ne se confondent pas.
  assert.notEqual(cleCase(4, 5), cleCase(5, 4));
  assert.equal(occupantDe(occupation, 5, 4), undefined);
  retirer(occupation, 4, 5);
  assert.equal(occupantDe(occupation, 4, 5), undefined);
});

test('G5 — obstacles : index, châssis concerné, ralentissement', () => {
  const index = indexerObstacles([
    { rangee: 4, colonne: 2, type: 'infanterie' },
    { rangee: 5, colonne: 6, type: 'vehicule' },
    { rangee: 7, colonne: 4, type: 'les_deux' },
  ]);
  assert.equal(typeObstacleSur(index, 4, 2), 'infanterie');
  assert.equal(typeObstacleSur(index, 4, 3), undefined);

  assert.ok(obstacleConcerne('infanterie', 'escouade'));
  assert.ok(!obstacleConcerne('infanterie', 'blinde'));
  assert.ok(obstacleConcerne('vehicule', 'blinde'));
  assert.ok(!obstacleConcerne('vehicule', 'escouade'));
  assert.ok(obstacleConcerne('les_deux', 'escouade') && obstacleConcerne('les_deux', 'blinde'));
  // L'aviation ignore le terrain, quel que soit le type de l'obstacle.
  for (const type of OBSTACLES.types) {
    assert.ok(!obstacleConcerne(type, 'aeronef'), `l'aviation subit l'obstacle ${type}`);
  }
  assert.throws(() => obstacleConcerne('marecage', 'escouade'), /type d'obstacle inconnu/);

  // 2,5 en millièmes = 2500 ; 50 → 20, 120 → 48, 300 → 120.
  assert.equal(DIVISEUR_OBSTACLE_MILLI, 2500);
  assert.equal(vitesseSousObstacle(50), 20);
  assert.equal(vitesseSousObstacle(120), 48);
  assert.equal(vitesseSousObstacle(300), 120);
  // 30 / 2,5 = 12 est entier, 31 / 2,5 = 12,4 ne l'est pas : le module refuse.
  assert.throws(() => vitesseSousObstacle(31), /ne donne pas un entier/);
});

test('G6 — au-delà de la dernière rangée, on sort du combat', () => {
  // La rangée 18 va de 18000 à 18999 ; on en sort à 19000.
  assert.ok(!estSortiParLeHaut(18000));
  assert.ok(!estSortiParLeHaut(18999));
  assert.ok(estSortiParLeHaut(19000));
  assert.ok(estSortiParLeHaut(19500));
});

test('T16 — cohérence arithmétique de tout le calibrage', () => {
  // Un tick vaut 0,1 s : 90 s → 900 ticks, 5 s → 50 ticks.
  assert.equal(TICKS_MAX_COMBAT, 900);
  assert.equal(TICKS_PAR_VAGUE, 50);
  assert.equal(GRILLE.vaguesParRaid, 4);

  for (const [id, u] of Object.entries(UNITES)) {
    // LOT 4A — la vitesse EST le milli-case par tick, plus de conversion :
    // 60 · 90 · 120 · 240, quatre valeurs, toutes entières par construction.
    const vitesseMilli = u.vitesse;
    assert.ok(Number.isInteger(vitesseMilli), `${id} : vitesse ${u.vitesse} non entière`);
    // La même vitesse divisée par 2,5 doit rester entière : 60 → 24, 90 → 36,
    // 120 → 48, 240 → 96. On le vérifie en entiers : (v × 1000) % 2500 === 0.
    assert.equal(
      (vitesseMilli * 1000) % 2500, 0,
      `${id} : ${vitesseMilli} / ${OBSTACLES.diviseurVitesse} non entier`,
    );
    assert.equal(vitesseSousObstacle(vitesseMilli), (vitesseMilli * 1000) / 2500);

    // Portées et PV passent aussi en entiers.
    assert.ok(Number.isInteger(u.portee * 1000), `${id} : portée non entière en milli-cases`);
    assert.ok(Number.isInteger(u.porteeMini * 1000), `${id} : portée mini non entière`);
    assert.ok(Number.isInteger(u.pv), `${id} : PV non entiers`);
    assert.ok(Number.isInteger(u.masse), `${id} : masse non entière`);
    assert.ok(Number.isInteger(u.reserve), `${id} : réserve non entière`);
    assert.ok(Number.isInteger(u.degatsParcours), `${id} : dégâts de parcours non entiers`);
    assert.ok(Number.isInteger(u.reparation), `${id} : réparation non entière`);

    // ⚠ SEUIL RÉÉCRIT AU LOT 4A. Le lot 2A exigeait des facteurs de matrice
    // multiples de 100 en millièmes ; le lot 2B a ramené le pas à la dizaine
    // pour la Herse à 0,03. La matrice ayant disparu, l'invariant n'a plus
    // d'objet : ce qui le remplace est plus dur, pas plus lâche — TOUTE valeur
    // de dégâts est un entier de PV, sans échelle ni arrondi.
    for (const colonne of COLONNES_DEGATS) {
      const valeur = u.degats[colonne];
      assert.ok(Number.isInteger(valeur), `${id}.${colonne} : ${valeur} n'est pas entier`);
      assert.ok(valeur >= 0, `${id}.${colonne} : ${valeur} est négatif`);
    }
  }

  for (const [id, d] of Object.entries(DEFENSES)) {
    assert.ok(Number.isInteger(d.pv), `${id} : PV non entiers`);
    assert.ok(Number.isInteger(d.portee * 1000), `${id} : portée non entière`);
    assert.ok(Number.isInteger(d.porteeMini * 1000), `${id} : portée mini non entière`);
    for (const table of ['degats', 'degatsFranchissement']) {
      if (d[table] === null) continue;
      for (const colonne of COLONNES_DEGATS) {
        const valeur = d[table][colonne];
        assert.ok(Number.isInteger(valeur), `${id}.${table}.${colonne} : ${valeur} non entier`);
        assert.ok(valeur >= 0, `${id}.${table}.${colonne} : ${valeur} est négatif`);
      }
    }
    // Une défense tire OU saigne, jamais les deux : la table de franchissement
    // est en milli-PV, celle de tir en PV, et les confondre serait un facteur
    // 1000 d'écart silencieux.
    assert.ok(d.degats === null || d.degatsFranchissement === null,
      `${id} : une défense ne peut pas porter les deux tables à la fois`);
  }

  // Le franchissement des barrières se lit en MILLI-PV par tick et par colonne,
  // seule table du calibrage qui ne soit pas en PV entiers : la Ronce vaut
  // 2,5 PV/tick contre l'infanterie, qui ne s'écrit pas en entier autrement.
  // Report exact des arbitrages du lot 2B — ÷8 sur la Ronce, 15 PV/tick sur la
  // Herse et 0,03 contre l'infanterie — dans la forme absolue du lot 4A :
  //   Ronce   2,5 × {1 · 0,1 · 0}    = {2500 · 250 · 0}
  //   Herse   15  × {0,03 · 1 · 0}   = {450 · 15000 · 0}
  assert.deepEqual(DEFENSES.ronce.degatsFranchissement,
    { infanterie: 2500, vehicule: 250, structureOuAviation: 0 });
  assert.deepEqual(DEFENSES.herse.degatsFranchissement,
    { infanterie: 450, vehicule: 15_000, structureOuAviation: 0 });

  // ⚠ LOT RECHERCHE (25/08/2026). Les points de recherche NE DOUBLENT PLUS par
  // niveau : ils suivent la courbe économique. La constante
  // `multiplicateurParNiveau` a disparu de la table, et ce test asserte sa
  // disparition — un test qui ne vérifierait plus rien passerait aussi bien si
  // quelqu'un la remettait en douce.
  assert.equal(GEOGRAPHIE.niveauPlafond, 50);
  assert.ok(
    !Object.prototype.hasOwnProperty.call(POINTS_RECHERCHE, 'multiplicateurParNiveau'),
    'le barème ne doit plus porter de multiplicateur propre',
  );

  // Le produit le plus lourd du barème, celui que garde `verifierArithmetique` :
  // 60 (Broyeur) × 480 941 681 (facteur économique au niveau 50) × 1200 (module
  // débloqué) = 34 627 801 032 000, soit 260 fois sous
  // Number.MAX_SAFE_INTEGER = 9 007 199 254 740 991. Sous l'ancien barème le
  // même produit valait 4 × 10¹⁹ : il débordait de 4 500 fois.
  const bareme = Math.max(...Object.values(POINTS_RECHERCHE.parCible));
  assert.equal(bareme, 60, 'le Broyeur est la cible la mieux payée');
  const bonus = 1000 + Math.round(1000 * POINTS_RECHERCHE.bonusModuleDebloque);
  assert.equal(bonus, 1200);
  // ⚠ LE FACTEUR EST CELUI DE LA RECHERCHE DEPUIS LE 14/09/2026, et il doit
  // rester celui-là : c'est la grandeur que le garde-fou surveille. Le remettre
  // sur `facteurEconomiqueMilli` laisserait ce test vert sans rien garder.
  const plafond = bareme * facteurRechercheMilli(GEOGRAPHIE.niveauPlafond) * bonus;
  assert.equal(facteurRechercheMilli(GEOGRAPHIE.niveauPlafond), 392_976_879);
  assert.equal(plafond, 28_294_335_288_000);
  assert.ok(Number.isSafeInteger(plafond), 'le plafond du barème doit rester un entier sûr');
  assert.ok(Number.MAX_SAFE_INTEGER / plafond > 318, 'la marge du barème est de 318×');

  // Et le moteur assied les mêmes invariants à son chargement.
  assert.equal(verifierArithmetique(), true);
});

// ---------------------------------------------------------------------------
// PORTÉE T1 / T2 — la géométrie est PORTABLE — lot GRILLE-PORTÉE, 20/09/2026
// ---------------------------------------------------------------------------
//
// ⚠⚠ LE LOT NE CRÉE AUCUNE NOTION, IL PARAMÈTRE UNE GÉOMÉTRIE QUE CE FICHIER
// GARDE DÉJÀ — d'où deux tests ici et pas un fichier de plus. Ce qui lit
// `GRILLE` accepte désormais une grille en argument, `GRILLE` en défaut ;
// `GRILLE` reste l'objet 9 × 18, et une autre grille est un SECOND objet, jamais
// une mutation. `T1` garde le défaut, `T2` garde le paramètre.
//
// ⚠ LES GRILLES SYNTHÉTIQUES SONT CONSTRUITES ICI, JAMAIS IMPORTÉES DE `src/` :
// il n'en existe aucune au dépôt, et c'est voulu — la grille longue est le lot
// GRILLE LONGUE. Une aide les dérive de trois hauteurs de bande pour que ni
// `longueur` ni `casesBatiments` ne soient retapés.

/** Une grille aux bandes contiguës, dérivée de ses trois hauteurs. */
function grilleAvec(deploiement, defense, batiments, largeur = GRILLE.largeur) {
  return {
    largeur,
    longueur: deploiement + defense + batiments,
    bandes: {
      deploiement: { premiere: 1, derniere: deploiement },
      defense: { premiere: deploiement + 1, derniere: deploiement + defense },
      batiments: { premiere: deploiement + defense + 1, derniere: deploiement + defense + batiments },
    },
    casesBatiments: batiments * largeur,
  };
}

/** La source d'un fichier, commentaires ôtés — une garde ne lit pas sa prose. */
function decommentee(chemin) {
  return readFileSync(join(RACINE_DEPOT, chemin), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
}

test('PORTÉE T1 — sans argument, tout rend exactement ce que cela rendait', () => {
  // ⚠⚠ CHAQUE ASSERTION NOMME SON EXPORT : la falsification du lot est « une
  // seule des signatures change de défaut », et le message doit dire laquelle.
  assert.equal(DERNIERE_RANGEE, 18, 'DERNIERE_RANGEE a bougé');
  assert.equal(DERNIERE_COLONNE, 9, 'DERNIERE_COLONNE a bougé');
  assert.equal(derniereRangee(), 18, 'derniereRangee() sans argument');
  assert.equal(derniereColonne(), 9, 'derniereColonne() sans argument');
  assert.equal(estDansLaGrille(18, 9), true, 'estDansLaGrille(18, 9) sans argument');
  assert.equal(estDansLaGrille(19, 1), false, 'estDansLaGrille(19, 1) sans argument');
  assert.equal(estDansLaBande(10, 'defense'), true, 'estDansLaBande(10, defense) sans argument');
  assert.equal(estDansLaBande(11, 'defense'), false, 'estDansLaBande(11, defense) sans argument');
  assert.deepEqual(bornesBande('defense'), { premiere: 3, derniere: 10 },
    'bornesBande(defense) sans argument');
  assert.equal(estSortiParLeHaut(19_000), true, 'estSortiParLeHaut(19000) sans argument');
  assert.equal(estSortiParLeHaut(18_999), false, 'estSortiParLeHaut(18999) sans argument');
  assert.equal(estSortiParLeCote(9_999), false, 'estSortiParLeCote(9999) sans argument');
  assert.equal(estSortiParLeCote(10_000), true, 'estSortiParLeCote(10000) sans argument');

  // Les deux constantes du moteur restent celles de la grille par défaut, et
  // leurs jumelles paramétrées les rendent sans argument.
  assert.equal(RANGEE_DEFENSE_FRANCHIE, 11, 'RANGEE_DEFENSE_FRANCHIE a bougé');
  assert.equal(rangeeDefenseFranchie(), RANGEE_DEFENSE_FRANCHIE, 'rangeeDefenseFranchie() sans argument');

  // Le rendu sans grille : la projection porte `GRILLE`, et les bandes sont
  // l'objet `BANDES` lui-même — l'identité, pas seulement l'égalité.
  const p = calculerProjection(412, 820);
  assert.equal(p.grille, GRILLE, 'calculerProjection sans vue.grille ne porte pas GRILLE');
  assert.equal(grilleDeLaProjection({ tailleCase: 1, margeX: 0, margeY: 0 }), GRILLE,
    'une projection forgée sans grille ne retombe pas sur GRILLE');
  assert.equal(bandesDe(), BANDES, 'bandesDe() sans argument ne rend pas BANDES');
  assert.equal(casesDeLaBande(null), GRILLE.longueur, 'casesDeLaBande(null) sans argument');
  assert.equal(ligneEcranDeLaRangee(1), GRILLE.longueur, 'ligneEcranDeLaRangee(1) sans argument');
  assert.equal(rangeeDeLaLigneEcran(1), GRILLE.longueur, 'rangeeDeLaLigneEcran(1) sans argument');
  assert.equal(largeurEnCases(), LARGEUR_EN_CASES, 'largeurEnCases() sans argument');
  assert.equal(hauteurEnCases(), HAUTEUR_EN_CASES, 'hauteurEnCases() sans argument');
  assert.deepEqual(tiersDeLaDefense(), {
    avant: { premiere: 3, derniere: 5 }, milieu: { premiere: 6, derniere: 7 }, arriere: { premiere: 8, derniere: 10 },
  }, 'tiersDeLaDefense() sans argument');

  // ⚠⚠ L'INVARIANT DU LOT : `GRILLE` N'A PAS ÉTÉ MUTÉE. Les nombres sont écrits
  // ici EXPRÈS — c'est ce qui épingle l'objet 9 × 18 contre une mutation faite
  // « pour voir » par un lot futur ; les lire dans `GRILLE` ne garderait rien.
  assert.equal(GRILLE.longueur, 18, 'GRILLE.longueur a été mutée');
  assert.equal(GRILLE.largeur, 9, 'GRILLE.largeur a été mutée');
  assert.deepEqual(GRILLE.bandes, {
    deploiement: { premiere: 1, derniere: 2 },
    defense: { premiere: 3, derniere: 10 },
    batiments: { premiere: 11, derniere: 18 },
  }, 'GRILLE.bandes a été mutée');
  assert.equal(GRILLE.casesBatiments, 72, 'GRILLE.casesBatiments a été muté');
  // Et `verifierGrille` rend la grille par défaut telle quelle : c'est sa
  // référence, elle n'a rien à prouver.
  assert.equal(verifierGrille(GRILLE), GRILLE);
});

test('PORTÉE T2 — une grille passée change le résultat, et `creerCombat` est seul à la poser', () => {
  // Trois grilles synthétiques, construites ici : la LONGUE du dossier des
  // fonds (9 × 27, seize rangées de défense), une LARGE (11 × 18) pour ce qui ne
  // lit que la largeur, une DÉCALÉE (9 × 20, défense en 5–12) pour ce qui ne
  // lit que la position des bandes. Chacune est vérifiée par le lot lui-même.
  const longue = verifierGrille(grilleAvec(2, 16, 9), 'T2 longue');
  const large = verifierGrille(grilleAvec(2, 8, 8, 11), 'T2 large');
  const decalee = verifierGrille(grilleAvec(4, 8, 8), 'T2 décalée');
  assert.deepEqual(longue, {
    largeur: 9,
    longueur: 27,
    bandes: {
      deploiement: { premiere: 1, derniere: 2 },
      defense: { premiere: 3, derniere: 18 },
      batiments: { premiere: 19, derniere: 27 },
    },
    casesBatiments: 81,
  }, 'le montage ne construit pas la grille 9 × 27 du dossier');

  // ⚠ ET `verifierGrille` MORD : une bande absente, une bande non contiguë, un
  // compte de cases faux lèvent en nommant le contexte. Sans ces trois-là, une
  // grille malformée traverserait jusqu'à un `NaN` de marge.
  assert.throws(() => verifierGrille({ ...longue, bandes: { ...longue.bandes, defense: undefined } }, 'T2'),
    /T2 : bande « defense » absente/);
  assert.throws(() => verifierGrille({ ...longue, casesBatiments: 72 }, 'T2'),
    /T2 : casesBatiments vaut 72, la bande des bâtiments en fait 81/);
  assert.throws(() => verifierGrille({ ...longue, longueur: 26 }, 'T2'),
    /les trois bandes couvrent 27 rangées, la grille en fait 26/);

  // --- 1. le paramètre est branché, pas décoratif — les sept de `sim/grille.js`
  assert.equal(estDansLaGrille(27, 9, longue), true, 'estDansLaGrille ignore sa grille');
  assert.equal(estDansLaGrille(27, 9), false, 'estDansLaGrille sans argument accepte la rangée 27');
  assert.equal(estDansLaGrille(18, 11, large), true, 'estDansLaGrille ignore la largeur de sa grille');
  assert.equal(estDansLaBande(12, 'defense', decalee), true, 'estDansLaBande ignore sa grille');
  assert.equal(estDansLaBande(12, 'defense'), false);
  // --- 2. les bornes d'une bande sont celles de la grille passée
  assert.deepEqual(bornesBande('batiments', longue), { premiere: 19, derniere: 27 },
    'bornesBande ignore sa grille');
  assert.equal(estSortiParLeHaut(19_000, longue), false, 'estSortiParLeHaut ignore sa grille');
  assert.equal(estSortiParLeHaut(28_000, longue), true);
  assert.equal(estSortiParLeCote(11_500, large), false, 'estSortiParLeCote ignore sa grille');
  assert.equal(estSortiParLeCote(11_500), true);
  assert.equal(derniereRangee(longue), 27, 'derniereRangee ignore sa grille');
  assert.equal(derniereColonne(large), 11, 'derniereColonne ignore sa grille');

  // --- le moteur : le seuil de débarquement suit la grille, et `creerCombat`
  // accepte un montage long SEULEMENT si le montage porte sa grille.
  assert.equal(rangeeDefenseFranchie(longue), 19, 'rangeeDefenseFranchie ignore sa grille');
  const site = genererSite({ type: 'base', niveau: 50, graine: 777 });
  const montageLong = {
    ...site,
    // Les bâtiments d'un site par défaut, décalés de neuf rangées : 11–18 →
    // 20–27, dans la bande des bâtiments de la grille longue. Défenseurs et
    // obstacles restent en 3–10 ⊂ 3–18.
    batiments: site.batiments.map((b) => ({ ...b, rangee: b.rangee + 9 })),
    vagues: [[{ id: 'meute', colonne: 5, niveau: 50 }]],
  };
  assert.throws(() => creerCombat(montageLong), /hors de la grille \(rangées 1–18, colonnes 1–9\)/,
    'un montage long SANS grille doit être refusé sur la grille par défaut');
  const etat = creerCombat({ ...montageLong, grille: longue });
  assert.equal(etat.grille, longue, 'creerCombat ne pose pas la grille du montage sur l\'état');
  const rangeesBat = etat.entites.filter((e) => e.genre === 'batiment')
    .map((e) => caseDepuisMilli(e.rangeeMilli));
  assert.equal(Math.max(...rangeesBat), 27, 'le bâtiment de la rangée 27 n\'est pas monté');
  assert.ok(serialiserEtat(etat).includes('"grille"'), 'la grille portée ne traverse pas serialiserEtat');
  // ⚠⚠ ET SANS GRILLE AU MONTAGE, LE CHAMP N'EST PAS POSÉ — ni `null`, ni
  // `GRILLE` : `serialiserEtat` trie les clés PROPRES, donc un champ posé
  // partout entrerait dans l'empreinte des deux cents témoins. C'est la garde
  // que `JOURNAL T1` porte pour de bon ; celle-ci nomme le mécanisme.
  const etatDefaut = creerCombat({ ...site, vagues: montageLong.vagues });
  assert.equal(Object.hasOwn(etatDefaut, 'grille'), false,
    'creerCombat pose `etat.grille` sur un montage qui n\'en porte pas');
  assert.ok(!serialiserEtat(etatDefaut).includes('"grille"'));
  // Et une grille malformée au montage lève en nommant le contexte.
  assert.throws(() => creerCombat({ ...montageLong, grille: { ...longue, casesBatiments: 72 } }),
    /combat : montage\.grille : casesBatiments vaut 72/);
  // ⚠ LES BORNES DES DEUX BANDES NOMMÉES DANS LES REFUS SONT CELLES DE LA
  // GRILLE DU MONTAGE — trouvé par la relecture hostile : `bornesBande` sans
  // argument dans `creerCombat` ne se voyait que dans le TEXTE du refus, et
  // c'est le texte qu'un joueur lit. Une souche en rangée 18 est dans la grille
  // longue et hors de sa bande ; un merlon en rangée 19, l'inverse.
  assert.throws(() => creerCombat({
    ...montageLong, grille: longue, batiments: [{ id: 'souche', rangee: 18, colonne: 5 }],
  }), /hors de la bande des bâtiments \(19–27\)/, 'le refus nomme les bornes de la grille par défaut');
  assert.throws(() => creerCombat({
    ...montageLong, grille: longue, defenseurs: [{ id: 'merlon', rangee: 19, colonne: 5 }],
  }), /hors de la bande de défense \(3–18\)/, 'le refus nomme les bornes de la grille par défaut');

  // --- le générateur : les tiers, la rangée d'artillerie et la vague suivent.
  assert.deepEqual(tiersDeLaDefense(decalee), {
    avant: { premiere: 5, derniere: 7 }, milieu: { premiere: 8, derniere: 9 }, arriere: { premiere: 10, derniere: 12 },
  }, 'tiersDeLaDefense ignore sa grille');
  // ⚠⚠ RETOURNÉE AU LOT GRILLE LONGUE, 20/09/2026. Elle exigeait que la table à
  // huit LÈVE sur seize rangées — « le point d'arrêt voulu, l'arbitrage du lot
  // GRILLE LONGUE ». L'arbitrage est rendu : les largeurs se multiplient par le
  // rapport ENTIER de la hauteur à la somme de la table, donc `[6, 4, 6]` sur
  // seize, et la garde ne mord plus que sur une hauteur qui n'est PAS un
  // multiple — `LONGUE T1` de `test/verrous.test.js` la fait lever sur douze.
  assert.deepEqual(tiersDeLaDefense(longue), {
    avant: { premiere: 3, derniere: 8 }, milieu: { premiere: 9, derniere: 12 }, arriere: { premiere: 13, derniere: 18 },
  }, 'les tiers de seize rangées ne se dérivent plus de la table à huit');
  assert.notDeepEqual(tiersDeLaDefense(longue), tiersDeLaDefense(),
    'tiersDeLaDefense ignore la grille longue');
  assert.equal(rangeeLaPlusAvanceeQuiTire('faucheuse', decalee), 5,
    'rangeeLaPlusAvanceeQuiTire ignore sa grille');
  assert.equal(rangeeLaPlusAvanceeQuiTire('faucheuse'), 3);
  const vagueDefaut = genererVague({ niveau: 50, budgetPoints: 100_000, graine: 1 });
  const vagueLarge = genererVague({ niveau: 50, budgetPoints: 100_000, graine: 1 }, large);
  const casesDeploiement = (GRILLE.bandes.deploiement.derniere - GRILLE.bandes.deploiement.premiere + 1)
    * GRILLE.largeur;
  assert.equal(vagueDefaut.unites.length, casesDeploiement, 'le montage ne sature pas le déploiement');
  assert.equal(vagueLarge.unites.length, 22, 'genererVague ignore la largeur de sa grille');
  assert.equal(Math.max(...vagueLarge.unites.map((u) => u.colonne)), 11);

  // --- le rendu : la projection PORTE sa grille, et ses lecteurs la reprennent.
  const pDefaut = calculerProjection(1080, 2000, MUR_CASES);
  const pLongue = calculerProjection(1080, 2000, MUR_CASES, { grille: longue });
  const pLarge = calculerProjection(1200, 2000, MUR_CASES, { grille: large });
  assert.equal(pDefaut.tailleCase, 108);
  assert.equal(pLongue.tailleCase, 72, 'calculerProjection ignore vue.grille');
  assert.equal(pLongue.grille, longue, 'la projection ne porte pas sa grille');
  // Et la LARGEUR de la grille commande la taille de case et le centrage : sur
  // 1200 px, douze colonnes de boîte font une case de 100 (et non 108, où dix
  // colonnes tiendraient), collée aux bords — la marge est le seul mur.
  assert.equal(pLarge.tailleCase, 100, 'calculerProjection ignore la largeur de vue.grille');
  assert.equal(pLarge.margeX, MUR_CASES * pLarge.tailleCase, 'la boîte large est centrée comme une boîte de dix');
  assert.equal(yDeRangee(pLongue, 27), pLongue.margeY, 'yDeRangee ignore la grille de la projection');
  assert.equal(yDeRangeeMilli(pLongue, 27_000), yDeRangee(pLongue, 27), 'yDeRangeeMilli ignore la grille');
  assert.deepEqual(caseDepuisPixels(pLongue, pLongue.margeX + 1, pLongue.margeY + 1), { rangee: 27, colonne: 1 },
    'caseDepuisPixels ignore la grille de la projection');
  assert.deepEqual(caseDepuisPixels(pDefaut, pDefaut.margeX + 1, pDefaut.margeY + 1), { rangee: 18, colonne: 1 });
  assert.equal(xDeColonneMilli(pLarge, 11_000), xDeColonne(pLarge, 11), 'xDeColonneMilli borne à la largeur par défaut');
  assert.equal(xDeColonneMilli(pDefaut, 11_000), xDeColonne(pDefaut, 9));
  assert.throws(() => calculerProjection(1080, 2000, MUR_CASES, { grille: { ...longue, longueur: 26 } }),
    /projection : vue\.grille/);
  // fond.js — la boîte suit la grille, et l'IMAGE suit son DÉCOR. ⚠⚠ RÉANCRÉ AU
  // LOT GRILLE LONGUE, 20/09/2026 : `rectangleDuFond` prend le décor, le `× 2`
  // d'hier est devenu le format `court`, et un décor long fait trente cases.
  // Une boîte de DOUZE n'a aucun décor de sa largeur — `rectangleDuFond` LÈVE
  // au lieu d'étirer, et c'est ce que la garde de largeur existe pour dire.
  assert.equal(largeurEnCases(large), 12, 'largeurEnCases ignore sa grille');
  assert.equal(hauteurEnCases(longue), 27 + MUR_CASES, 'hauteurEnCases ignore sa grille');
  assert.throws(() => rectangleDuFond(pLarge, 'fond_o_hostile'),
    /« fond_o_hostile » fait 10 cases de large, la boîte projetée en fait 12/,
    'rectangleDuFond pose un décor de dix cases sur une boîte de douze');
  const rLong = rectangleDuFond(pLongue, 'fond_o_finale');
  assert.equal(rLong.l, 10 * pLongue.tailleCase, 'rectangleDuFond ignore la grille de la projection');
  assert.equal(rLong.h, 30 * pLongue.tailleCase, 'la hauteur d\'un décor long ne suit pas son format');
  assert.equal(rLong.sh, 3240);
  // C'est le DÉCOR qui donne la hauteur, pas la grille : un décor court sur
  // la projection longue garde ses vingt cases — c'est la garde de
  // `test/sprite.test.js` qui interdit ce couple-là au niveau de la table.
  assert.equal(rectangleDuFond(pLongue, 'fond_o_hostile').h, HAUTEUR_IMAGE_EN_CASES * pLongue.tailleCase,
    'la hauteur de l\'image suit la grille et non le décor');
  assert.notEqual(rLong.h, rectangleDuFond(pLongue, 'fond_o_hostile').h);
  // bandes.js
  assert.deepEqual(bandesDe(longue)[2], { cle: 'batiments', nom: 'Chantier', premiere: 19, derniere: 27 },
    'bandesDe ignore sa grille');
  assert.deepEqual(voilesDeLaBande('batiments', longue), [{ premiereLigne: 10, nbLignes: 18 }],
    'voilesDeLaBande ignore sa grille');
  assert.deepEqual(voilesDeLaBande('batiments'), [{ premiereLigne: 9, nbLignes: 10 }]);
  assert.equal(basculeDeBande('batiments', longue).cible, 'defense');
  // ⚠ `basculeDeBande` rend la MÊME cible sur toute grille — l'ordre des bandes
  // ne dépend pas de leurs bornes —, donc sa grille ne se falsifie pas par la
  // valeur : elle se falsifie par la GARDE, qui n'existe que si la grille
  // passée est bien celle qui est lue.
  assert.throws(() => basculeDeBande('batiments', { ...longue, longueur: 26 }), /bandes : les trois bandes couvrent/,
    'basculeDeBande ignore sa grille');
  assert.deepEqual(bornesDeDefilement('defense', 10, 100, 0, longue), { min: 90, max: 170 },
    'bornesDeDefilement ignore sa grille');
  assert.deepEqual(bornesDeDefilement('defense', 10, 100), { min: 80, max: 80 });
  assert.equal(bandeDeLaRangee(12, decalee), 'defense', 'bandeDeLaRangee ignore sa grille');
  assert.equal(bandeDeLaRangee(12), 'batiments');
  assert.equal(casesDeLaBande(null, 0, longue), 27, 'casesDeLaBande ignore sa grille');
  assert.equal(casesDeLaBande('defense', 0, longue), 16);
  assert.deepEqual(bornesDuDecalage(null, 10, 100, 0, longue), { min: 0, max: 170 },
    'bornesDuDecalage ignore sa grille');
  assert.deepEqual(bornesDuDecalageX(10, 100, 0, large), { min: 0, max: 10 },
    'bornesDuDecalageX ignore sa grille');
  assert.deepEqual(bornesDuDecalageX(10, 100), { min: 0, max: 0 });
  assert.throws(() => bandesDe({ ...longue, longueur: 26 }), /bandes : les trois bandes couvrent/);
  // orientation.js
  assert.equal(ligneEcranDeLaRangee(27, longue), 1, 'ligneEcranDeLaRangee ignore sa grille');
  assert.throws(() => ligneEcranDeLaRangee(27), /hors de 1…18/);
  assert.equal(rangeeDeLaLigneEcran(1, longue), 27, 'rangeeDeLaLigneEcran ignore sa grille');
  assert.deepEqual(ligneEcranDeLaBande(longue.bandes.batiments, longue), { premiereLigne: 1, nbLignes: 9 },
    'ligneEcranDeLaBande ignore sa grille');
  // portee.js — le balayage s'arrête au bord de la grille PASSÉE.
  const portee = { portee: 2.5, porteeMini: 0 };
  assert.equal(casesAPortee({ rangee: 6, colonne: 9 }, portee).length, 13);
  assert.equal(casesAPortee({ rangee: 6, colonne: 9 }, portee, large).length, 21,
    'casesAPortee ignore sa grille');
  // scene.js — les numéros de colonne suivent la largeur de la projection.
  const editeur = { cases: [Array(9).fill(null)] };
  const colonnesDe = (liste) => liste.filter((p) => p.forme === 'texte').length;
  assert.equal(colonnesDe(listeArsenal(editeur, pDefaut)), 9);
  assert.equal(colonnesDe(listeArsenal(editeur, pLarge)), 11, 'listeArsenal ignore la grille de la projection');
  assert.equal(colonnesDe(listeDefense(editeur, pLarge)), 11, 'listeDefense ignore la grille de la projection');

  // --- 3. GARDE DE SOURCE : `creerCombat` est le SEUL endroit de `src/` qui
  // écrit `etat.grille`. Sur la source DÉCOMMENTÉE — le motif est épelé en
  // commentaire à côté de l'écriture unique —, et sur l'ÉCRITURE (`=` non
  // suivi de `=`), jamais la comparaison.
  const ecriture = /\.grille\s*=(?!=)/g;
  const porteurs = [];
  for (const dossier of ['data', 'sim', 'render', 'ui', 'son']) {
    for (const fichier of readdirSync(join(RACINE_DEPOT, 'src', dossier))) {
      const source = decommentee(join('src', dossier, fichier));
      const occurrences = source.match(ecriture) ?? [];
      if (occurrences.length > 0) porteurs.push([`${dossier}/${fichier}`, occurrences.length]);
    }
  }
  assert.deepEqual(porteurs, [['sim/combat.js', 1]],
    `\`.grille =\` est écrit ailleurs que dans creerCombat : ${JSON.stringify(porteurs)}`);
  // ⚠ ET L'ÉCRITURE UNIQUE EST DANS `creerCombat`, CONDITIONNELLE : le corps de
  // la fonction porte la ligne, et la ligne est gardée par `montage.grille`.
  const combat = decommentee('src/sim/combat.js');
  const debut = combat.indexOf('export function creerCombat(');
  const fin = combat.indexOf('\nexport function', debut + 1);
  const corps = combat.slice(debut, fin);
  assert.match(corps, /if \(montage\.grille !== undefined\) etat\.grille = grille;/,
    'l\'écriture de etat.grille a quitté creerCombat, ou a perdu sa condition');
  // Le motif reconnaît bien une écriture et laisse passer une comparaison.
  assert.equal(('etat.grille = x'.match(ecriture) ?? []).length, 1);
  assert.equal(('etat.grille === x'.match(ecriture) ?? []).length, 0);

  // ⚠⚠ ET `GRILLE` EST INTACTE APRÈS TOUT ÇA — trois grilles passées, un combat
  // monté, une projection calculée : pas une mutation.
  assert.equal(GRILLE.longueur, 18);
  assert.equal(GRILLE.casesBatiments, 72);
  assert.deepEqual(GRILLE.bandes.batiments, { premiere: 11, derniere: 18 });
});
