// Les points d'intérêt — le tirage, l'acquisition, les deux effets, la sauvegarde.
//
// ⚠ CHAQUE TEST DIT SON MONTAGE FALSIFIABLE, pas seulement son verdict. Un test
// qui asserte un champ que le lot vient d'écrire ne peut pas échouer : la vraie
// porte est nommée avant l'assertion, à chaque fois.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  tirerLesPoi, carteDesPoi, poiDeLaCase, poisDeLaFenetre, bandeDeLaRangee,
  rangeesDeLaBande, releverLesPoisAcquis, poiEstAcquis, problemesDesPoisAcquis,
  majorationsDeProduction, majorationsDeCombat,
  NOMBRE_DE_BANDES, TYPES_POI, ESSAIS_MAX, SEL_RANGEE, SEL_COLONNE,
} from '../src/sim/poi.js';
import { estBaseOuvrage, horsDeLaGarde } from '../src/sim/peuplement.js';
import { niveauDeLaRangee, positionBaseTerminale, positionDepartJoueur } from '../src/sim/carte.js';
import { empriseDeLaGrosseBase } from '../src/render/embleme.js';
import {
  creerEtat, tickJeu, rattraperJeu, serialiser, charger, migrer, SAVE_VERSION, poser,
} from '../src/sim/state.js';
import {
  debitsMilliParHeure, tickEconomieBase, rattrapageEconomieBase, creerEtatEconomie,
} from '../src/sim/economie-base.js';
import { creerCombat } from '../src/sim/combat.js';
import { executerRaid } from '../src/sim/raid.js';
import {
  GEOGRAPHIE, POI, NIVEAUX_PAR_BANDE, PEUPLEMENT,
} from '../src/data/sites.js';
import { RAYONS, JOUEUR } from '../src/sim/territoire.js';
import { baseCourante } from '../src/sim/base-courante.js';
import { aplatirSauvegarde } from './aplatir-sauvegarde.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const T0 = 1_700_000_000_000;

/** Cinquante graines, prises d'affilée pour que le montage soit reproductible. */
const GRAINES = Array.from({ length: 50 }, (_, i) => 1 + i);

// ---------------------------------------------------------------------------
// Le tirage
// ---------------------------------------------------------------------------

test('POI T1 — soixante-dix POI, sept par bande, aucune collision de case', () => {
  // ⚠ FALSIFIABLE : le montage doit d'abord prouver qu'il MESURE quelque chose.
  // Sept types et dix bandes ne se recopient pas ici — ils se dérivent de
  // `POI` et de `niveauPlafond`, et un dépôt qui n'aurait ni l'un ni l'autre
  // rendrait toutes les égalités ci-dessous triviales.
  assert.equal(TYPES_POI.length, 7, 'la table `POI` ne porte plus sept types');
  assert.equal(NOMBRE_DE_BANDES, GEOGRAPHIE.niveauPlafond / NIVEAUX_PAR_BANDE);
  assert.equal(NOMBRE_DE_BANDES, 10);

  for (const graine of GRAINES) {
    const poses = tirerLesPoi(graine);
    assert.equal(poses.length, 70, `graine ${graine} : ${poses.length} POI`);

    const parBande = new Map();
    const cases = new Set();
    for (const p of poses) {
      parBande.set(p.bande, (parBande.get(p.bande) ?? 0) + 1);
      const cle = `${p.rangee}:${p.colonne}`;
      assert.ok(!cases.has(cle), `graine ${graine} : deux POI en (${p.rangee}, ${p.colonne})`);
      cases.add(cle);
    }
    assert.equal(cases.size, 70, `graine ${graine} : ${cases.size} cases distinctes`);
    for (let bande = 1; bande <= NOMBRE_DE_BANDES; bande += 1) {
      assert.equal(parBande.get(bande), 7, `graine ${graine} : bande ${bande} incomplète`);
    }
    // Un type par bande, exactement — le couple (type, bande) est la clé de la
    // sauvegarde, et deux POI du même type dans la même bande la casseraient.
    const couples = new Set(poses.map((p) => `${p.type}:${p.bande}`));
    assert.equal(couples.size, 70, `graine ${graine} : un couple (type, bande) est en double`);
  }
});

test('POI T2 — aucun POI sur une base de l\'Ouvrage, dans la garde, ni sous la terminale', () => {
  const e = empriseDeLaGrosseBase(3, positionBaseTerminale());
  const sousLaTerminale = (r, c) => r >= e.rangee && r <= e.rangee + e.cotes - 1
    && c >= e.colonne && c <= e.colonne + e.cotes - 1;

  // ⚠ FALSIFIABLE : les trois refus doivent porter sur des cases qui EXISTENT,
  // sinon on vérifie trois ensembles vides. On compte donc d'abord ce que chaque
  // règle exclut réellement de la carte.
  let basesRencontrees = 0;
  let dansLaGarde = 0;
  for (let r = 1; r <= GEOGRAPHIE.carte.hauteur; r += 1) {
    for (let c = 1; c <= GEOGRAPHIE.carte.largeur; c += 1) {
      if (!horsDeLaGarde(r, c)) dansLaGarde += 1;
      if (estBaseOuvrage(4242, r, c)) basesRencontrees += 1;
    }
  }
  assert.ok(basesRencontrees > 100, `${basesRencontrees} bases : le montage ne mesure rien`);
  assert.ok(dansLaGarde > 100, `${dansLaGarde} cases dans la garde : le montage ne mesure rien`);
  assert.equal(sousLaTerminale(e.rangee, e.colonne), true, 'l\'emprise ne se reconnaît pas');

  for (const graine of GRAINES) {
    for (const p of tirerLesPoi(graine)) {
      assert.ok(horsDeLaGarde(p.rangee, p.colonne),
        `graine ${graine} : « ${p.type} » en (${p.rangee}, ${p.colonne}) est dans la garde`);
      assert.equal(estBaseOuvrage(graine, p.rangee, p.colonne), false,
        `graine ${graine} : « ${p.type} » en (${p.rangee}, ${p.colonne}) est sur une base`);
      assert.equal(sousLaTerminale(p.rangee, p.colonne), false,
        `graine ${graine} : « ${p.type} » est sous l'emprise de la terminale`);
    }
  }
});

test('POI T3 — la bande d\'un POI est celle de sa rangée, par `niveauDeLaRangee`', () => {
  // ⚠ ON REFAIT LE CALCUL, ON NE RELIT PAS LE CHAMP. Asserter `p.bande ===
  // p.bande` ne mesurerait rien : c'est `niveauDeLaRangee` — la seule vérité sur
  // le niveau d'une rangée — qu'on interroge à la place.
  for (const graine of GRAINES) {
    for (const p of tirerLesPoi(graine)) {
      const attendue = Math.ceil(niveauDeLaRangee(p.rangee) / NIVEAUX_PAR_BANDE);
      assert.equal(p.bande, attendue,
        `graine ${graine} : « ${p.type} » rangée ${p.rangee} — bande ${p.bande} contre ${attendue}`);
      assert.equal(bandeDeLaRangee(p.rangee), attendue);
    }
  }
  // Les dix bandes couvrent la carte entière, sans trou ni recouvrement.
  let couvertes = 0;
  for (let bande = 1; bande <= NOMBRE_DE_BANDES; bande += 1) couvertes += rangeesDeLaBande(bande).length;
  assert.equal(couvertes, GEOGRAPHIE.carte.hauteur, 'les bandes ne pavent pas la carte');
});

test('POI T4 — déterminisme : même graine, même carte ; deux graines, deux cartes', () => {
  for (const graine of GRAINES.slice(0, 10)) {
    assert.deepEqual(tirerLesPoi(graine), tirerLesPoi(graine), `graine ${graine} instable`);
  }
  // ⚠ ET DEUX GRAINES DOIVENT DIVERGER, sinon une fonction constante passerait
  // l'assertion ci-dessus. On exige que les cinquante cartes soient distinctes
  // deux à deux, pas seulement « pas toutes égales ».
  const empreintes = new Set(GRAINES.map((g) => JSON.stringify(tirerLesPoi(g))));
  assert.equal(empreintes.size, GRAINES.length, 'deux graines rendent la même carte');

  // Le cache mémoïsé ne doit pas rendre la carte d'une autre partie.
  assert.equal(carteDesPoi(11).graine, 11);
  assert.equal(carteDesPoi(12).graine, 12);
  assert.equal(carteDesPoi(11).graine, 11);
  assert.deepEqual(carteDesPoi(11).liste, tirerLesPoi(11));
});

test('POI T5 — non-régression du peuplement : `estBaseOuvrage` rend ce qu\'elle rendait', () => {
  // ⚠⚠ C'EST LE TEST QUI PROUVE QUE LA DÉPENDANCE EST À SENS UNIQUE. Le POI
  // esquive la base de l'Ouvrage, jamais l'inverse : ajouter les POI ne doit
  // déplacer AUCUNE base sur AUCUNE carte existante.
  //
  // ⚠⚠ BASELINE REMESURÉE AU LOT EUCLIDE (02/09), ET IL FAUT DIRE CE QUE ÇA
  // COÛTE. Les six comptes venaient d'un `peuplement.js` extrait par
  // `git show` d'AVANT le lot POI : ils prouvaient l'indépendance en comparant à
  // du code qui ne connaissait pas les POI. Le lot EUCLIDE a changé la garde et
  // la densité, donc ces six nombres-là ne veulent plus rien dire, et les
  // remesurer sur le code d'aujourd'hui les rend CIRCULAIRES — un compte relevé
  // sur le code qu'il vérifie ne vérifie rien.
  //
  // ⚠ CE QUI TIENT VRAIMENT LA PROPRIÉTÉ EST DONC LA SECONDE MOITIÉ DU TEST : le
  // balayage de la source, qui exige que `sim/peuplement.js` ne connaisse pas le
  // mot « poi ». Elle est indépendante de toute métrique et n'a pas bougé. Les
  // comptes ci-dessous gardent une chose plus modeste, et qui vaut quand même :
  // que le peuplement soit STABLE d'un lot à l'autre. Le prochain lot qui les
  // fait bouger doit dire pourquoi, comme celui-ci le fait.
  //
  // ⚠⚠ BASELINE REMESURÉE DEUX FOIS LE 03/09, ET LA SECONDE EST LA BONNE. Ethan
  // a demandé « davantage remplir le monde avec des bases ouvrage » : l'exclusion
  // est d'abord passée de huit voisines à quatre, portant les six comptes de
  // **993 · 993 · 996 · 978 · 984 · 986** à 1 719 · 1 704 · 1 711 · 1 662 ·
  // 1 667 · 1 682. Ethan a refusé le procédé le jour même — « je suis sûr à
  // 100 % qu'on n'est pas obligé de mettre des bases en diagonale » —, et
  // l'exclusion est revenue aux HUIT, la densité étant reprise par les tours de
  // peuplement.
  //
  // ⚠ CE QUE LES SIX COMPTES DISENT, DONC : **+59,7 % sur le dépôt d'avant le
  // 03/09**, et −6,6 % sur la carte à contact diagonal qui a existé quelques
  // heures. C'est le réglage qu'Ethan a retenu sur capture, entre 23,5 et 27,7.
  const REFERENCE = [[1, 1590], [7, 1588], [42, 1581], [777, 1569], [2026, 1571], [4242, 1572]];
  for (const [graine, attendu] of REFERENCE) {
    let n = 0;
    for (let r = 1; r <= GEOGRAPHIE.carte.hauteur; r += 1) {
      for (let c = 1; c <= GEOGRAPHIE.carte.largeur; c += 1) {
        if (estBaseOuvrage(graine, r, c)) n += 1;
      }
    }
    assert.equal(n, attendu, `graine ${graine} : ${n} bases de l'Ouvrage au lieu de ${attendu}`);
  }

  // ⚠ ET LE SENS SE LIT AUSSI DANS LA SOURCE. Un compte identique pourrait
  // survivre à un filtre qui ne mord sur aucune de ces six graines ; le module du
  // peuplement ne doit tout simplement pas connaître le mot.
  const source = readFileSync(join(RACINE, 'src', 'sim', 'peuplement.js'), 'utf8');
  const decommente = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(decommente, /poi/i, '`sim/peuplement.js` a appris à connaître les POI');
  // Falsifiable : le motif doit attraper un appât.
  assert.match('import { poiDeLaCase } from "./poi.js";', /poi/i);
});

test('POI T6 — la forme de la garde, remesurée en Euclide', () => {
  // ⚠⚠ BASELINE REMESURÉE AU LOT EUCLIDE (02/09) : LA FORME A CHANGÉ, LA RÈGLE
  // NON. Ce test figeait la forme CARRÉE de la garde — « sur les rangées à
  // hauteur du joueur, SEULES les colonnes 1 et 31 sont hors garde », qui
  // découlait de Tchebychev sur une carte large de 31. La garde est un DISQUE
  // désormais : sur la rangée du départ, une case est hors garde dès que son
  // écart de colonne atteint quinze, ce qui vaut encore les deux bords ; mais
  // une case en diagonale sort bien plus tôt, et les rangées voisines s'ouvrent.
  //
  // Ce que le test garde est inchangé et c'est le seul point qui compte : la
  // garde des POI est CELLE DU PEUPLEMENT, pas une distance réécrite à côté.
  const largeur = GEOGRAPHIE.carte.largeur;
  const depart = positionDepartJoueur();
  const garde = PEUPLEMENT.gardeAutourDuDepart;

  // Aucun POI dans la garde, sur toutes les graines du montage.
  let dedans = 0;
  let total = 0;
  for (const graine of GRAINES) {
    for (const p of tirerLesPoi(graine)) {
      total += 1;
      const dr = p.rangee - depart.rangee;
      const dc = p.colonne - depart.colonne;
      if (dr * dr + dc * dc < garde * garde) dedans += 1;
    }
  }
  assert.ok(total > 0, 'aucun POI tiré : le montage ne mesure rien');
  assert.equal(dedans, 0, `${dedans} POI sous la garde`);

  // ⚠ ET LA GARDE EST BIEN CELLE DU PEUPLEMENT. Sur la rangée du départ, quinze
  // colonnes d'écart suffisent à en sortir ; quatorze n'y suffisent pas.
  assert.ok(horsDeLaGarde(depart.rangee, depart.colonne - garde));
  assert.equal(horsDeLaGarde(depart.rangee, depart.colonne - garde + 1), false);
  // ⚠ ET LA DIAGONALE SORT PLUS TÔT — c'est très exactement ce que le passage à
  // Euclide a changé, et l'ancienne forme carrée l'interdisait. Onze cases de
  // grille en diagonale font 15,56 en ligne droite : dehors. Dix en font 14,14 :
  // dedans.
  assert.ok(horsDeLaGarde(depart.rangee - 11, depart.colonne - 11));
  assert.equal(horsDeLaGarde(depart.rangee - 10, depart.colonne - 10), false);
  assert.ok(largeur === 31, 'la largeur de la carte a bougé : relire ce test');
});

test('POI T7 — `ESSAIS_MAX` lève, il ne rend pas une carte amputée', () => {
  // ⚠ UNE CARTE À QUI IL MANQUE UN POI EST UN FAIT DE PROGRAMME. On ne peut pas
  // saturer la vraie carte, donc on mesure la MARGE : le pire nombre d'essais
  // observé doit rester très en dessous du plafond, et le plafond doit exister.
  assert.ok(ESSAIS_MAX >= 100, `ESSAIS_MAX = ${ESSAIS_MAX} : la marge n'est plus une marge`);
  assert.notEqual(SEL_RANGEE, SEL_COLONNE, 'un seul sel pour deux champs');
  assert.ok(SEL_RANGEE >= 2 && SEL_COLONNE >= 2, 'les sels 0 et 1 sont pris par le peuplement');

  // Falsifiable : une bande dont TOUTES les cases sont refusées doit lever. On
  // fabrique le cas en demandant une bande qui n'existe pas — c'est l'autre
  // porte du même module, et elle lève aussi plutôt que de rendre `undefined`.
  assert.throws(() => rangeesDeLaBande(NOMBRE_DE_BANDES + 1), /hors de/);
});

// ---------------------------------------------------------------------------
// L'acquisition
// ---------------------------------------------------------------------------

/**
 * Une partie posée SUR un POI ISOLÉ, sans passer par le redéploiement.
 *
 * ⚠ L'ISOLEMENT EST UNE CONDITION DE MONTAGE, PAS UN DÉTAIL. Deux POI peuvent se
 * toucher — rien ne l'interdit, ils ne s'excluent qu'à la case —, et le premier
 * de la carte de 4242 a effectivement un voisin à une case. Un test qui attendrait
 * « exactement un acquis » y tomberait pour une raison qui n'a rien à voir avec ce
 * qu'il mesure. On choisit donc un POI dont le disque de rayon 5 est vide, et on
 * l'ASSERTE.
 */
function partieSurLePoi(graine, marge = 5) {
  const liste = carteDesPoi(graine).liste;
  const isole = (p) => liste.every((q) => q === p
    || Math.max(Math.abs(q.rangee - p.rangee), Math.abs(q.colonne - p.colonne)) > marge);
  const poi = liste.find(isole);
  assert.ok(poi, `graine ${graine} : aucun POI isolé à ${marge} cases`);
  const etat = creerEtat(graine);
  baseCourante(etat).position = { rangee: poi.rangee, colonne: poi.colonne };
  return { etat, poi };
}

test('POI T8 — un POI dans le territoire est acquis au tick suivant, à trois cases non', () => {
  const { etat, poi } = partieSurLePoi(4242);
  assert.deepEqual(etat.poisAcquis, [], 'montage : la partie neuve doit partir vide');
  tickJeu(etat);
  assert.deepEqual(etat.poisAcquis, [{ type: poi.type, bande: poi.bande }]);

  // ⚠ ET À TROIS CASES, RIEN. Le rayon du joueur vaut 2 (Tchebychev) : trois
  // cases est le premier écart qui doit rester dehors, et c'est ce qui prouve que
  // le relevé lit vraiment le TERRITOIRE et ne ramasse pas toute la carte.
  assert.equal(RAYONS[JOUEUR], 2, 'le rayon d\'influence du joueur a changé — refaire la mesure');
  const loin = creerEtat(4242);
  baseCourante(loin).position = { rangee: poi.rangee, colonne: poi.colonne + RAYONS[JOUEUR] + 1 };
  tickJeu(loin);
  assert.deepEqual(loin.poisAcquis, [], 'un POI à trois cases a été acquis');

  // Falsifiable dans l'autre sens : à DEUX cases, il l'est.
  const juste = creerEtat(4242);
  baseCourante(juste).position = { rangee: poi.rangee, colonne: poi.colonne + RAYONS[JOUEUR] };
  tickJeu(juste);
  assert.deepEqual(juste.poisAcquis, [{ type: poi.type, bande: poi.bande }]);
});

test('POI T9 — acquis une fois, il le reste : rien ne le retire', () => {
  const { etat, poi } = partieSurLePoi(4242);
  tickJeu(etat);
  assert.equal(etat.poisAcquis.length, 1, 'montage : rien n\'a été acquis');

  // On repart à l'autre bout de la carte : « définitivement » veut dire que ni
  // un redéploiement, ni un raid, ni un rasage ne le retire.
  baseCourante(etat).position = { rangee: 40, colonne: 3 };
  for (let i = 0; i < 100; i += 1) tickJeu(etat);
  assert.ok(poiEstAcquis(etat.poisAcquis, poi), 'le POI a disparu de la liste');

  // ⚠ ET LE RELEVÉ N'AJOUTE JAMAIS DE DOUBLON. Mille ticks sur la même case.
  const { etat: bis } = partieSurLePoi(2026);
  rattraperJeu(bis, 1000);
  for (let i = 0; i < 1000; i += 1) tickJeu(bis);
  assert.deepEqual(problemesDesPoisAcquis(bis.poisAcquis), []);
  const couples = new Set(bis.poisAcquis.map((a) => `${a.type}:${a.bande}`));
  assert.equal(couples.size, bis.poisAcquis.length, 'un doublon est entré dans `poisAcquis`');
  assert.ok(bis.poisAcquis.length > 0, 'montage : rien n\'a été acquis, le test ne mesure rien');
});

test('POI T10 — les acquis sont triés, et le tri ne dépend pas de l\'ordre d\'insertion', () => {
  // ⚠ DEUX PARTIES IDENTIQUES DOIVENT PRODUIRE DEUX FICHIERS IDENTIQUES. On
  // insère volontairement dans le désordre — la carte, elle, ne le permet pas —
  // et on exige la même sortie que l'insertion croissante.
  const etat = creerEtat(4242);
  etat.poisAcquis = [
    { type: 'poiRedoute', bande: 3 },
    { type: 'poiQuartz', bande: 3 },
    { type: 'poiScorie', bande: 1 },
  ];
  // Un tick relève, donc trie. La position par défaut n'ajoute rien ici.
  const avant = etat.poisAcquis.length;
  const cible = carteDesPoi(4242).liste.find((p) => p.bande === 2);
  baseCourante(etat).position = { rangee: cible.rangee, colonne: cible.colonne };
  tickJeu(etat);
  assert.ok(etat.poisAcquis.length > avant, 'montage : rien n\'a été ajouté, donc rien n\'a été trié');
  const rangs = etat.poisAcquis.map((a) => a.bande * 1000 + TYPES_POI.indexOf(a.type));
  assert.deepEqual(rangs, [...rangs].sort((x, y) => x - y), '`poisAcquis` n\'est pas trié');
});

// ---------------------------------------------------------------------------
// L'effet sur la production
// ---------------------------------------------------------------------------

/** Une base neuve avec un collecteur posé sur un vrai champ de quartz. */
function baseQuiProduit(graine = 20260826) {
  const etat = creerEtat(graine);
  const champ = baseCourante(etat).champs.cases.find((k) => k.ressource === 'quartz');
  assert.ok(champ, 'montage : aucun champ de quartz sous cette base');
  poser(etat, 'collecteur', champ.rangee, champ.colonne);
  return etat;
}

test('POI T11 — trois veines de quartz font exactement +30 %, en entiers', () => {
  const etat = baseQuiProduit();
  const nu = debitsMilliParHeure(baseCourante(etat).disposition, baseCourante(etat).champs);
  const totalNu = nu.reduce((s, d) => s + (d.quartz ?? 0), 0);
  // ⚠ FALSIFIABLE : sans production, +30 % de zéro vaut zéro et le test passerait
  // sur n'importe quel code.
  assert.ok(totalNu > 0, 'montage : la base ne produit pas de quartz');

  const trois = [
    { type: 'poiQuartz', bande: 1 }, { type: 'poiQuartz', bande: 2 }, { type: 'poiQuartz', bande: 3 },
  ];
  const pct = majorationsDeProduction(trois);
  // ⚠ ILS S'ADDITIONNENT : +30, jamais ×1,1³ = +33,1.
  assert.deepEqual(pct, { quartz: 30 });

  const majore = debitsMilliParHeure(baseCourante(etat).disposition, baseCourante(etat).champs, pct);
  const totalMajore = majore.reduce((s, d) => s + (d.quartz ?? 0), 0);
  assert.equal(totalMajore, Math.floor((totalNu * 130) / 100));
  assert.ok(Number.isInteger(totalMajore), 'le débit majoré a quitté les entiers');

  // ⚠ ET SEULE LA RESSOURCE VISÉE BOUGE. Une majoration de quartz qui toucherait
  // la scorie ferait produire un collecteur mal posé.
  for (let i = 0; i < nu.length; i += 1) {
    assert.equal(majore[i].scorie ?? 0, nu[i].scorie ?? 0, `bâtiment ${i} : la scorie a bougé`);
    assert.equal(majore[i].electricite ?? 0, nu[i].electricite ?? 0, `bâtiment ${i} : l'électricité a bougé`);
  }

  // Les sept types répartissent bien leurs effets entre les deux canaux.
  assert.deepEqual(majorationsDeProduction([{ type: 'poiCantonnement', bande: 1 }]), {});
  assert.deepEqual(
    majorationsDeProduction(Object.keys(POI).map((type) => ({ type, bande: 1 }))),
    { quartz: 10, scorie: 10, electricite: 10 },
  );
});

test('POI T12 — équivalence tick / rattrapage AVEC majoration active', () => {
  // ⚠⚠ C'EST LE TEST QUI TIENT TOUT LE CHOIX DE MAJORER LE DÉBIT.
  // `rattrapageEconomieBase` doit produire un état STRICTEMENT identique à N
  // appels de `tickEconomieBase` ; majorer le GAIN d'un tick ou le STOCK ferait
  // diverger les deux, et la divergence serait invisible sur les petits nombres.
  const modele = baseQuiProduit();
  // ⚠⚠ LE TAUX N'EST PAS PRIS AU HASARD, ET LE PREMIER JET Y EST TOMBÉ. À +20 %,
  // le débit du collecteur passe de 120 000 à 144 000 milli/h, soit EXACTEMENT
  // quatre fois `TICKS_PAR_HEURE` : le résidu retombe à zéro à chaque tick, et la
  // comparaison des deux chemins ne mesure plus l'arrondi — c'est-à-dire la seule
  // chose qui puisse les faire diverger. À +30 % il vaut 156 000, qui n'est pas un
  // multiple, et le résidu vit. **Un montage qui tombe rond ne mesure pas un
  // arrondi**, pour la deuxième fois dans ce dépôt.
  const pct = majorationsDeProduction([
    { type: 'poiQuartz', bande: 1 }, { type: 'poiQuartz', bande: 2 },
    { type: 'poiQuartz', bande: 3 },
    { type: 'poiScorie', bande: 1 }, { type: 'poiEnergie', bande: 1 },
  ]);
  assert.deepEqual(pct, { quartz: 30, scorie: 10, electricite: 10 });

  // ⚠ FALSIFIABLE : la majoration doit CHANGER quelque chose, sinon les deux
  // chemins seraient comparés sur un effet nul.
  const nu = debitsMilliParHeure(baseCourante(modele).disposition, baseCourante(modele).champs);
  const majore = debitsMilliParHeure(baseCourante(modele).disposition, baseCourante(modele).champs, pct);
  assert.notDeepEqual(nu, majore, 'la majoration ne change rien : le montage ne mesure rien');
  const parTicks = creerEtatEconomie(baseCourante(modele).disposition);
  const parRattrapage = creerEtatEconomie(baseCourante(modele).disposition);
  for (let i = 0; i < 1000; i += 1) {
    tickEconomieBase(parTicks, baseCourante(modele).disposition, baseCourante(modele).champs, pct);
  }
  rattrapageEconomieBase(parRattrapage, baseCourante(modele).disposition, baseCourante(modele).champs, 1000, pct);
  assert.deepEqual(parRattrapage, parTicks, 'les deux chemins divergent sous majoration');
  assert.ok(parTicks.ressources.quartz > 0, 'montage : aucun quartz produit');
  // ⚠ ET LE RÉSIDU DOIT ÊTRE NON NUL, sinon le seul endroit où les deux chemins
  // peuvent diverger reste à zéro des deux côtés et la comparaison ne prouve
  // rien. C'est la même leçon que « un montage qui tombe rond ne mesure pas un
  // arrondi ».
  assert.ok(parTicks.residus.some((r) => Object.values(r).some((v) => v > 0)),
    'tous les résidus sont nuls : la comparaison ne mesure pas l\'arrondi');

  // Et par le VRAI chemin de jeu, `tickJeu` contre `rattraperJeu`.
  const a = baseQuiProduit();
  const b = baseQuiProduit();
  const acquis = [
    { type: 'poiQuartz', bande: 4 }, { type: 'poiQuartz', bande: 5 },
    { type: 'poiQuartz', bande: 6 },
  ];
  a.poisAcquis = acquis.map((x) => ({ ...x }));
  b.poisAcquis = acquis.map((x) => ({ ...x }));
  for (let i = 0; i < 1000; i += 1) tickJeu(a);
  rattraperJeu(b, 1000);
  assert.deepEqual(baseCourante(b).economie, baseCourante(a).economie, '`tickJeu` et `rattraperJeu` divergent sous majoration');

  // ⚠ ET LA MAJORATION DOIT AVOIR MORDU SUR CE CHEMIN-LÀ AUSSI.
  const temoin = baseQuiProduit();
  for (let i = 0; i < 1000; i += 1) tickJeu(temoin);
  assert.ok(baseCourante(a).economie.ressources.quartz > baseCourante(temoin).economie.ressources.quartz,
    'le jeu majoré ne produit pas plus que le jeu nu');
});

test('POI T13 — la majoration ne touche pas le stockage', () => {
  // Ethan a écrit « production bonus », pas « stockage bonus ». Un POI fait
  // produire plus vite ; il n'agrandit aucun entrepôt.
  const source = readFileSync(join(RACINE, 'src', 'sim', 'economie-base.js'), 'utf8');
  const capacites = source.slice(
    source.indexOf('export function capacitesMilli'),
    source.indexOf(' * Débits de chaque bâtiment'),
  );
  assert.ok(capacites.length > 200, 'le découpage de la source a raté');
  assert.doesNotMatch(capacites, /majorations/, '`capacitesMilli` a appris les majorations');
  // Falsifiable : le motif attrape bien le mot là où il est.
  assert.match(source, /majorationsPct/);
});

// ---------------------------------------------------------------------------
// L'effet sur le combat
// ---------------------------------------------------------------------------

/**
 * Un montage de combat où le joueur attaque avec un châssis de chaque genre.
 *
 * ⚠ LES IDENTIFIANTS SONT CEUX DE `UNITES`, c'est-à-dire les noms de l'OUVRAGE —
 * `meute` est l'escouade que le joueur appelle Fusiliers. Écrire ici le nom
 * joueur ferait lever `creerCombat` sur « identifiant inconnu », ce qui est
 * exactement ce qui est arrivé au premier jet de ce test.
 */
const TROIS_CHASSIS = { escouade: 'meute', blinde: 'fendeur', aeronef: 'busard' };

function montageTroisChassis(majorationsPoi) {
  return {
    niveau: 10,
    saveur: 'richeQuartz',
    defenseurs: [{ id: 'merlon', rangee: 6, colonne: 5 }],
    vagues: [[
      { id: TROIS_CHASSIS.escouade, colonne: 1 },
      { id: TROIS_CHASSIS.blinde, colonne: 3 },
      { id: TROIS_CHASSIS.aeronef, colonne: 5 },
    ]],
    ...(majorationsPoi === undefined ? {} : { majorationsPoi }),
  };
}

test('POI T14 — le Cantonnement majore les escouades du joueur, et rien d\'autre', () => {
  const nu = creerCombat(montageTroisChassis());
  const avec = creerCombat(montageTroisChassis({ joueur: { escouade: 10 } }));

  const par = (etat, id) => etat.entites.find((e) => e.id === id);
  const escouade = TROIS_CHASSIS.escouade;
  // ⚠ FALSIFIABLE : les trois châssis doivent être là, et leurs dégâts non nuls.
  for (const id of [...Object.values(TROIS_CHASSIS), 'merlon']) {
    assert.ok(par(nu, id), `montage : « ${id} » absent`);
  }
  const colonnes = Object.keys(par(nu, escouade).degatsColonne);
  assert.ok(colonnes.length > 0, 'aucune colonne de dégâts');
  assert.ok(colonnes.some((c) => par(nu, escouade).degatsColonne[c] > 0),
    'montage : l\'escouade ne fait aucun dégât');

  // L'escouade monte, d'un `floor` sur le produit.
  for (const c of colonnes) {
    assert.equal(
      par(avec, escouade).degatsColonne[c],
      Math.floor((par(nu, escouade).degatsColonne[c] * 110) / 100),
      `${escouade}, colonne ${c}`,
    );
  }
  // Le blindé, l'aéronef et le défenseur de l'Ouvrage : rien de plus.
  for (const id of [TROIS_CHASSIS.blinde, TROIS_CHASSIS.aeronef, 'merlon']) {
    assert.deepEqual(par(avec, id).degatsColonne, par(nu, id).degatsColonne,
      `« ${id} » a profité d'un bonus d'escouade`);
  }

  // ⚠ ET LES TROIS CHÂSSIS SONT BIEN SÉPARÉS : chacun a son POI.
  for (const chassis of ['blinde', 'aeronef']) {
    const id = TROIS_CHASSIS[chassis];
    const cible = creerCombat(montageTroisChassis({ joueur: { [chassis]: 10 } }));
    assert.notDeepEqual(par(cible, id).degatsColonne, par(nu, id).degatsColonne,
      `le POI « ${chassis} » ne majore pas « ${id} »`);
    assert.deepEqual(par(cible, escouade).degatsColonne, par(nu, escouade).degatsColonne,
      `le POI « ${chassis} » majore aussi les escouades`);
  }
});

test('POI T15 — `camp` ET `proprietaire` : la garnison du joueur ne touche pas le bonus d\'assaut', () => {
  // ⚠⚠ LES TROIS POI OFFENSIFS DEMANDENT LES DEUX. Sans la condition de camp,
  // les Cuirassiers que le joueur met en GARNISON profiteraient d'un bonus
  // d'assaut — c'est la faute que ce test attrape.
  const montage = (majorationsPoi) => ({
    niveau: 10,
    saveur: 'richeQuartz',
    proprietaireDefense: 'joueur',
    proprietaireAttaque: 'ouvrage',
    defenseurs: [
      // ⚠ `fendeur` EST UN BLINDÉ PRÉSENT EN DÉFENSE — la garnison n'accepte que
      // les huit unités dont `defense.present` est vrai, et il en fait partie.
      { id: 'fendeur', rangee: 6, colonne: 5 },
      { id: 'casemate', rangee: 6, colonne: 7 },
    ],
    vagues: [[{ id: 'meute', colonne: 1 }]],
    ...(majorationsPoi === undefined ? {} : { majorationsPoi }),
  });
  const nu = creerCombat(montage());
  const parChassis = creerCombat(montage({ joueur: { blinde: 10 } }));
  const parRedoute = creerCombat(montage({ joueur: { defense: 10 } }));
  const par = (etat, id) => etat.entites.find((e) => e.id === id);

  assert.ok(Object.values(par(nu, 'fendeur').degatsColonne).some((v) => v > 0),
    'montage : le blindé de garnison ne fait aucun dégât');
  assert.ok(Object.values(par(nu, 'casemate').degatsColonne).some((v) => v > 0),
    'montage : la tourelle de garnison ne fait aucun dégât');

  // Un POI de CHÂSSIS ne touche rien en défense : le camp n'est pas « attaque ».
  assert.deepEqual(par(parChassis, 'fendeur').degatsColonne,
    par(nu, 'fendeur').degatsColonne, 'le bonus d\'assaut a fui vers la garnison');

  // La Redoute, elle, majore TOUT ce que le joueur pose en défense — unité de
  // garnison comme ouvrage fixe, « quel que soit le genre ».
  for (const id of ['fendeur', 'casemate']) {
    for (const c of Object.keys(par(nu, id).degatsColonne)) {
      assert.equal(
        par(parRedoute, id).degatsColonne[c],
        Math.floor((par(nu, id).degatsColonne[c] * 110) / 100),
        `redoute, « ${id} », colonne ${c}`,
      );
    }
  }
  // ⚠ ET L'ATTAQUANT DE L'OUVRAGE NE TOUCHE RIEN, dans aucun des deux cas.
  for (const etat of [parChassis, parRedoute]) {
    assert.deepEqual(par(etat, 'meute').degatsColonne, par(nu, 'meute').degatsColonne,
      'l\'Ouvrage a profité d\'un POI du joueur');
  }
});

test('POI T16 — `franchissementColonne` est inchangé, quel que soit le nombre de POI', () => {
  // ⚠ CHOIX RÉVERSIBLE D'UNE LIGNE, DIT COMME TEL. C'est le précédent exact de
  // la Munition spéciale : le franchissement passe par `degatsDeFranchissement`,
  // sa propre table et son propre barème, et aucune ligne d'Ethan ne rattache les
  // POI au franchissement.
  //
  // ⚠ LE PORTEUR EST UNE BARRIÈRE, PAS UNE UNITÉ. `franchissementColonne` ne vit
  // que sur les DÉFENSES qui se franchissent — mesuré : `ronce` et `herse`, et
  // elles seules. Et aucune défense ne porte à la fois du franchissement et des
  // dégâts : il faut donc DEUX entités, la barrière pour le témoin négatif, la
  // tourelle pour prouver que la majoration mord bien dans le même combat.
  const montage = (majorationsPoi) => ({
    niveau: 20,
    saveur: 'richeQuartz',
    proprietaireDefense: 'joueur',
    proprietaireAttaque: 'ouvrage',
    defenseurs: [
      { id: 'ronce', rangee: 6, colonne: 5 },
      { id: 'casemate', rangee: 6, colonne: 7 },
    ],
    vagues: [[{ id: 'meute', colonne: 1 }]],
    ...(majorationsPoi === undefined ? {} : { majorationsPoi }),
  });
  const nu = creerCombat(montage());
  const par = (etat, id) => etat.entites.find((e) => e.id === id);
  const porteur = par(nu, 'ronce');
  // ⚠ FALSIFIABLE : il FAUT une entité qui franchit, sinon on compare deux `null`.
  assert.ok(porteur.franchissementColonne !== null,
    'montage : la barrière ne porte pas de table de franchissement');
  assert.ok(Object.values(porteur.franchissementColonne).some((v) => v > 0),
    'montage : la table de franchissement est nulle partout');
  assert.ok(Object.values(par(nu, 'casemate').degatsColonne).some((v) => v > 0),
    'montage : la tourelle ne fait aucun dégât');

  for (const pct of [10, 70]) {
    const avec = creerCombat(montage({ joueur: { defense: pct } }));
    assert.deepEqual(par(avec, 'ronce').franchissementColonne, porteur.franchissementColonne,
      `+${pct} % a déteint sur le franchissement`);
    // …alors que les DÉGÂTS, eux, ont bien bougé — sans quoi ce test passerait
    // aussi sur un lot qui n'aurait rien branché du tout.
    assert.notDeepEqual(par(avec, 'casemate').degatsColonne, par(nu, 'casemate').degatsColonne,
      `+${pct} % ne majore même pas les dégâts`);
  }
});

test('POI T17 — le montage refuse une forme fausse, et accepte l\'absence', () => {
  const base = {
    niveau: 5, saveur: 'richeQuartz', defenseurs: [], vagues: [[{ id: 'meute', colonne: 1 }]],
  };
  // Absent : zéro partout, pour les deux propriétaires — la même forme des deux
  // côtés, comme `modulesDebloques` depuis MODULES-E.
  const nu = creerCombat(base);
  assert.deepEqual(nu.majorationsPoi, {
    ouvrage: { escouade: 0, blinde: 0, aeronef: 0, defense: 0 },
    joueur: { escouade: 0, blinde: 0, aeronef: 0, defense: 0 },
  });
  // Présent et faux : ça lève, ça ne se répare pas tout seul.
  assert.throws(() => creerCombat({ ...base, majorationsPoi: { joueur: ['escouade'] } }), /majorationsPoi/);
  assert.throws(() => creerCombat({ ...base, majorationsPoi: { joueur: { chassis: 10 } } }), /clé inconnue/);
  assert.throws(() => creerCombat({ ...base, majorationsPoi: { joueur: { escouade: 1.5 } } }), /entier/);
  assert.throws(() => creerCombat({ ...base, majorationsPoi: { joueur: { escouade: -10 } } }), /entier/);
});

test('POI T18 — un raid du joueur emporte ses POI, et ça se mesure sur la cible', () => {
  // ⚠⚠ LES POI ENTRENT PAR LE MONTAGE, JAMAIS PAR L'ÉTAT LU AU VOL. Le seul
  // moyen de le VÉRIFIER de l'extérieur est de jouer deux raids identiques et de
  // regarder ce qu'ils laissent du site : si `executerRaid` oubliait de remplir
  // `majorationsPoi`, les deux seraient identiques au bit près.
  const partie = (acquis) => {
    const etat = creerEtat(2026);
    rattraperJeu(etat, 3001);
    for (let c = 1; c <= 6; c += 1) {
      baseCourante(etat).armee.push({ id: 'meute', vague: 1, colonne: c, niveau: 1, degatsMilli: 0 });
    }
    etat.poisAcquis = acquis;
    return etat;
  };
  const camp = (etat) => {
    const s = baseCourante(etat).satellites.presents.find((x) => x.type === 'camp');
    return { rangee: s.rangee, colonne: s.colonne };
  };

  const nu = partie([]);
  const avec = partie([{ type: 'poiCantonnement', bande: 1 }]);
  // ⚠ FALSIFIABLE : les deux parties doivent être IDENTIQUES hors POI, sinon
  // l'écart mesuré ne dirait rien. On le vérifie sur la cible et sur l'armée.
  assert.deepEqual(camp(nu), camp(avec), 'montage : les deux parties ne visent pas le même camp');
  assert.deepEqual(nu.armee, avec.armee, 'montage : les deux armées diffèrent');
  assert.equal(majorationsDeCombat(avec.poisAcquis).escouade, 10);
  assert.equal(majorationsDeCombat(nu.poisAcquis).escouade, 0);

  const rNu = executerRaid(nu, baseCourante(nu), camp(nu));
  const rAvec = executerRaid(avec, baseCourante(avec), camp(avec));
  // ⚠ MESURÉ SUR CE MONTAGE-CI : 378 ticks contre 376, et un site laissé dans un
  // autre état. Le BUTIN, lui, est identique — six Meutes ne renversent pas un
  // camp, et +10 % ne change pas ce qu'elles en rapportent. Asserter sur le seul
  // butin aurait donc rendu ce test VERT sur un `executerRaid` qui n'emporte rien.
  assert.notEqual(rAvec.ticks, rNu.ticks,
    'le raid dure exactement autant avec et sans POI — le montage ne les emporte pas');
  assert.notEqual(
    JSON.stringify(nu.sitesEntames), JSON.stringify(avec.sitesEntames),
    'le raid laisse le site dans le même état avec et sans POI',
  );
});

// ---------------------------------------------------------------------------
// La sauvegarde
// ---------------------------------------------------------------------------

test('POI T19 — `poisAcquis` traverse `serialiser` → `charger` à l\'identique', () => {
  const { etat } = partieSurLePoi(4242);
  tickJeu(etat);
  etat.poisAcquis.push({ type: 'poiRedoute', bande: 7 });
  const attendu = etat.poisAcquis.map((a) => ({ ...a }));
  assert.ok(attendu.length >= 2, 'montage : moins de deux acquis, le test ne mesure rien');

  const recharge = charger(serialiser(etat, T0), T0);
  for (const a of attendu) {
    assert.ok(poiEstAcquis(recharge.poisAcquis, a), `« ${a.type} » bande ${a.bande} a été perdu`);
  }

  // ⚠ ET LES COORDONNÉES NE SONT PAS STOCKÉES. Les écrire ferait deux vérités
  // pour la même case — ce que `serialiser` refuse déjà pour `champs` et
  // `obstacles`.
  const json = JSON.parse(serialiser(etat, T0));
  for (const a of json.poisAcquis) {
    assert.deepEqual(Object.keys(a).sort(), ['bande', 'type'],
      'une coordonnée s\'est glissée dans `poisAcquis`');
  }

  // Un champ ABSENT est une faute de programme ; une liste VIDE est l'état de
  // toute partie neuve.
  const ampute = JSON.parse(serialiser(creerEtat(1), T0));
  delete ampute.poisAcquis;
  assert.throws(() => charger(JSON.stringify(ampute), T0), /poisAcquis/);
  assert.doesNotThrow(() => charger(serialiser(creerEtat(1), T0), T0));
});

test('POI T20 — une sauvegarde v15 se charge, se joue, et ressort à jour', () => {
  // ⚠ LA GARDE DU NUMÉRO APPARTIENT AU MAILLON LE PLUS RÉCENT, une seule fois.
  // Elle vivait ici quand v15 → v16 était le dernier ; elle est passée à
  // `reparation.test.js` avec le maillon v16 → v17 du lot RÉSERVE. Ce qui reste
  // à vérifier ici, c'est que NOTRE maillon est toujours dans la chaîne.
  assert.ok(SAVE_VERSION >= 16, 'le maillon v15 → v16 n\'est plus dans la chaîne');

  const { etat } = partieSurLePoi(4242);
  const v15 = JSON.parse(serialiser(etat, T0));
  // ⚠ APLATIE AVANT D'ÊTRE RABAISSÉE — lot BASES-0. Une v15 n'a jamais
  // porté `bases` : lui en donner un ferait tourner la chaîne de migrations
  // sur une forme qui n'a jamais existé.
  aplatirSauvegarde(v15);
  v15.version = 15;
  delete v15.poisAcquis;

  // ⚠ LA MIGRATION N'ACCORDE RIEN RÉTROACTIVEMENT : elle pose une liste VIDE.
  const migre = migrer(JSON.parse(JSON.stringify(v15)));
  assert.equal(migre.version, SAVE_VERSION);
  assert.deepEqual(migre.poisAcquis, [], 'la migration a accordé un POI');

  // …et le PREMIER TICK relève de lui-même ce que le territoire porte.
  const charge = charger(JSON.stringify(v15), T0);
  assert.equal(charge.version, SAVE_VERSION);
  tickJeu(charge);
  assert.ok(charge.poisAcquis.length > 0,
    'le premier tick n\'a rien relevé — le POI sous la base a été perdu');

  // ⚠⚠ UNE ASSERTION A ÉTÉ RETIRÉE ICI, ET ELLE SE DÉCLARE. Elle vérifiait que
  // la chaîne TOLÈRE un `poisAcquis` déjà présent — « la chaîne remonte depuis
  // la v0, rien ne garantit la forme d'un objet à mi-parcours ». Le maillon
  // v15 → v16 la respecte toujours ; c'est le maillon v20 → v21 du lot EUCLIDE
  // qui la contredit EN BOUT DE CHAÎNE, délibérément : la carte a changé sous
  // les sauvegardes, donc un gisement compté acquis serait désormais ailleurs,
  // et le recopier produirait un état syntaxiquement valide et sémantiquement
  // faux.
  //
  // ⚠ ET ELLE N'A PAS ÉTÉ REMPLACÉE PAR UNE VERSION « ISOLÉE » DU MAILLON. La
  // table des migrations n'est pas exportée ; rejouer un seul maillon
  // demanderait de la dupliquer dans le test, c'est-à-dire d'écrire une seconde
  // chaîne qui vieillirait à côté de la vraie. Un premier jet de ce test l'avait
  // fait avec un faux « avance d'un cran » qui ne rejouait rien : il passait sur
  // n'importe quel code. Mieux vaut une assertion en moins, déclarée, qu'une
  // assertion qui ne mesure rien.
  //
  // Ce qui est asserté à la place est le fait de ce lot : le bout de la chaîne
  // rend une liste VIDE, quoi qu'on lui donne.
  const dejaLa = { ...v15, poisAcquis: [{ type: 'poiScorie', bande: 2 }] };
  assert.deepEqual(migrer(dejaLa).poisAcquis, [],
    'le maillon v20 → v21 n\'a pas vidé les POI acquis');
});

// ---------------------------------------------------------------------------
// Les satellites et l'écran
// ---------------------------------------------------------------------------

test('POI T21 — un satellite ne se pose jamais sur un POI', () => {
  // ⚠ LE MOTIF EST CELUI DES BASES DE L'OUVRAGE, MOT POUR MOT : les POI sont
  // dérivés de la graine, donc ils étaient là AVANT ; un camp posé dessus ferait
  // deux sites sur une case.
  let poses = 0;
  for (const graine of GRAINES) {
    const etat = creerEtat(graine);
    rattraperJeu(etat, 3001);
    for (const s of baseCourante(etat).satellites.presents) {
      poses += 1;
      assert.equal(poiDeLaCase(graine, s.rangee, s.colonne), null,
        `graine ${graine} : un ${s.type} est posé sur un POI en (${s.rangee}, ${s.colonne})`);
    }
  }
  // Falsifiable : sans satellite posé, l'assertion ci-dessus est vide.
  assert.ok(poses > 100, `${poses} satellites posés : le montage ne mesure rien`);
});

test('POI T22 — la fenêtre rend les POI qu\'elle contient, et eux seuls', () => {
  const graine = 4242;
  const liste = carteDesPoi(graine).liste;
  const fenetre = {
    premiereRangee: 200, derniereRangee: 260, premiereColonne: 1, derniereColonne: 31,
  };
  const dedans = poisDeLaFenetre(graine, fenetre);
  const attendus = liste.filter((p) => p.rangee >= 200 && p.rangee <= 260);
  assert.deepEqual(dedans, attendus);
  // Falsifiable : une fenêtre vide rendrait deux listes vides égales.
  assert.ok(dedans.length > 0, 'aucun POI dans la fenêtre : le montage ne mesure rien');
  assert.ok(dedans.length < liste.length, 'la fenêtre rend toute la carte');
});

test('POI T23 — un POI n\'est pas une cible : ni site attaquable, ni emprise', () => {
  // ⚠ AUCUNE INTERACTION AVEC LE RAID. `TYPES_ATTAQUABLES` se dérive de
  // `TYPES_SITE`, où les POI ne sont pas — et ils n'ont pas à y entrer.
  for (const type of Object.keys(POI)) {
    assert.equal(POI[type].bonusPct, 10, `« ${type} » ne vaut plus +10 %`);
    assert.ok(POI[type].sprite.startsWith('poi_'), `« ${type} » n'a pas de sprite de POI`);
  }
  // Les sept sprites sont distincts : deux POI qui partageraient un dessin
  // seraient indiscernables sur la carte.
  const sprites = Object.values(POI).map((p) => p.sprite);
  assert.equal(new Set(sprites).size, 7, 'deux POI partagent le même sprite');

  // Chaque effet tombe dans un canal et un seul.
  for (const [type, def] of Object.entries(POI)) {
    const canaux = [def.ressource !== null, def.chassis !== null, def.defense].filter(Boolean);
    assert.equal(canaux.length, 1, `« ${type} » agit sur ${canaux.length} canaux`);
  }
  assert.deepEqual(
    majorationsDeCombat(Object.keys(POI).map((type) => ({ type, bande: 1 }))),
    {
      escouade: 10, blinde: 10, aeronef: 10, defense: 10,
    },
  );
});

test('POI T25 — un POI dans un ANGLE ROGNÉ n\'est pas acquis, sa voisine l\'est', () => {
  // ⚠⚠ CE TEST NAÎT D'UN DÉFAUT QUE DEUX LOTS ONT CHERCHÉ SANS LE TROUVER.
  // `releverLesPoisAcquis` peignait un CARRÉ plein de (2r+1)² cases, sans le
  // moindre test de forme : un POI dans un coin était donc ACQUIS alors que ni
  // la carte ne montre cette case comme alliée, ni le barème du raid ne la
  // facture ainsi. EUCLIDE avait énuméré trois sites de bascule sans le voir,
  // BASES-1 en a corrigé un quatrième sans le voir non plus. Corrigé le 03/09,
  // en faisant passer toute la zone d'influence à l'octogone dicté par Ethan.
  //
  // ⚠ LE MONTAGE POSE LA BASE AUTOUR D'UN VRAI POI DE LA CARTE, il n'en
  // fabrique pas : c'est `poiDeLaCase` qui doit décider, pas une table à nous.
  const etat = creerEtat(3);
  const carte = carteDesPoi(etat.graine);
  const rayon = GEOGRAPHIE.rayonInfluenceJoueur;

  // Le coin rogné : (−2, −2) depuis la base. On place donc la base en
  // (poi.rangee + 2, poi.colonne + 2).
  const dansLaCarte = (r, c) => r >= 1 && r <= GEOGRAPHIE.carte.hauteur
    && c >= 1 && c <= GEOGRAPHIE.carte.largeur;
  const poi = carte.liste.find((x) => dansLaCarte(x.rangee + rayon, x.colonne + rayon));
  assert.ok(poi, 'montage : aucun POI ne laisse la place à une base en diagonale');

  const auCoin = () => {
    const e = creerEtat(3);
    baseCourante(e).position = { rangee: poi.rangee + rayon, colonne: poi.colonne + rayon };
    releverLesPoisAcquis(e);
    return e.poisAcquis;
  };
  // ⚠ ET LA MOITIÉ QUI FAIT MESURER QUELQUE CHOSE : depuis l'ÉPAULE — une case
  // plus près en colonne —, le même POI EST acquis. Sans elle, un relevé cassé
  // qui n'acquerrait jamais rien passerait au vert.
  const aLEpaule = () => {
    const e = creerEtat(3);
    baseCourante(e).position = { rangee: poi.rangee + rayon, colonne: poi.colonne + rayon - 1 };
    releverLesPoisAcquis(e);
    return e.poisAcquis;
  };

  assert.deepEqual(auCoin(), [], 'un POI dans un angle rogné est encore acquis');
  assert.deepEqual(aLEpaule(), [{ type: poi.type, bande: poi.bande }],
    'le POI n\'est pas acquis depuis l\'épaule : le montage ne mesure rien');
});

test('POI T24 — en partie normale, AUCUN POI n\'est acquérable, et ce n\'est pas un hasard', () => {
  // ⚠⚠ LE BRIEF DU LOT ANNONÇAIT « seuls les POI qui tombent dans les vingt-cinq
  // cases autour de la rangée 295 / colonne 16 pourront être acquis ». MESURÉ :
  // il n'y en a AUCUN, et il ne peut pas y en avoir. Les deux règles sont
  // disjointes par construction — un POI est hors de la garde, donc à quinze
  // cases au moins du DÉPART ; le territoire du joueur est le disque de rayon 2
  // autour de sa base, qui est le départ tant que le redéploiement n'existe pas.
  // Quinze et deux ne se rencontrent jamais.
  //
  // Ce test EXISTE pour que la phrase reste vraie de la bonne façon : le jour où
  // la base pourra bouger, il tombera, et c'est exactement ce qu'on veut qu'il
  // fasse — il dira que le système est devenu jouable.
  const depart = baseCourante(creerEtat(1)).position;
  for (let dr = -RAYONS[JOUEUR]; dr <= RAYONS[JOUEUR]; dr += 1) {
    for (let dc = -RAYONS[JOUEUR]; dc <= RAYONS[JOUEUR]; dc += 1) {
      assert.equal(horsDeLaGarde(depart.rangee + dr, depart.colonne + dc), false,
        `(${depart.rangee + dr}, ${depart.colonne + dc}) est hors garde : la géométrie a changé`);
    }
  }

  // Et la conséquence, mesurée sur cinquante parties plutôt que déduite.
  for (const graine of GRAINES) {
    const etat = creerEtat(graine);
    tickJeu(etat);
    assert.deepEqual(etat.poisAcquis, [],
      `graine ${graine} : un POI est acquis en partie neuve — la mobilité est-elle arrivée ?`);
  }
  // ⚠ FALSIFIABLE : le relevé DOIT savoir acquérir, sinon ce test passerait sur
  // un `releverLesPoisAcquis` vide. `POI T8` le prouve par la porte d'à côté ;
  // ici on le redit en une ligne, en posant la base sur un POI.
  const { etat } = partieSurLePoi(4242);
  tickJeu(etat);
  assert.equal(etat.poisAcquis.length, 1, 'le relevé n\'acquiert rien du tout');
});
