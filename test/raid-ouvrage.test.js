// L'OUVRAGE ATTAQUE — lot RAID-B, 02/09/2026.
//
// Douze tests, dans l'ordre du brief. Le premier est le seul qui compte
// vraiment : `tickJeu` × n doit rendre exactement `rattraperJeu(n)`, raids
// compris. C'est lui qui prouve que le tirage est PUR — un flux conservé d'un
// tick à l'autre le fait tomber, et c'est la falsification jouée.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { createHash } from 'node:crypto';

import {
  creerEtat, tickJeu, rattraperJeu, serialiser, migrer, SAVE_VERSION, poser,
  ajouterUneBase,
} from '../src/sim/state.js';
import { poserLaBaseSur } from '../src/sim/deplacement.js';
import { niveauDeLaRangee, positionDepartJoueur } from '../src/sim/carte.js';
import { distanceTchebychev, estAPorteeDAttaque } from '../src/sim/points-attaque.js';
import { creerRng, entier } from '../src/sim/rng.js';
import { TICKS_APPARITION } from '../src/sim/satellites.js';
import {
  SEL_RAID_OUVRAGE, TICKS_PAR_MINUTE, minuteDeLHorloge, baseAttaqueALaMinute,
  basesAttaquantes, montageDeLaBaseDuJoueur, subirUnRaid, resoudreLaMinute,
  prochaineMinuteDeRaid,
} from '../src/sim/raid-ouvrage.js';
import { creerCombat, resoudre } from '../src/sim/combat.js';
import { garderLeRapport } from '../src/sim/raid.js';
import { genererSite, budgetRaid } from '../src/sim/generateur.js';
import { RAID_OUVRAGE, TYPES_SITE, APRES_RAID, GEOGRAPHIE } from '../src/data/sites.js';
import { GRILLE } from '../src/data/combat.js';
import { BASE_BATIMENTS } from '../src/data/base.js';
import { TICKS_PAR_HEURE } from '../src/sim/clock.js';
import { estSurLaCarte } from '../src/sim/carte.js';
import { ciblesAPortee } from '../src/sim/site-de-la-case.js';
import { poiDeLaCase, carteDesPoi } from '../src/sim/poi.js';
import { baseCourante } from '../src/sim/base-courante.js';
import { aplatirSauvegarde } from './aplatir-sauvegarde.js';
import { basesDeLaFenetre } from '../src/sim/peuplement.js';
import { caseRasee } from '../src/sim/ruines.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// Montages
// ---------------------------------------------------------------------------
//
// ⚠ LA BASE SE REMONTE PAR DES GESTES PERMIS, PAS PAR UNE ÉCRITURE SAUVAGE.
// `poser` refuse une case illégale, donc ce qui sort d'ici est une base que le
// jeu accepterait. Seuls le NIVEAU et la POSITION sur la carte sont écrits à la
// main : le premier parce qu'améliorer coûte des ressources qu'on n'a pas, le
// second parce que le redéploiement n'existe pas encore — c'est le §5.5 du
// brief pris au mot, aussi loin que le dépôt le permet.

/** Une base plantée à une rangée donnée de la carte, avec bâtiments et garnison. */
function baseALaRangee(graine, rangee, { niveau = 20, garnison = true } = {}) {
  const etat = creerEtat(graine);
  baseCourante(etat).position.rangee = rangee;
  baseCourante(etat).disposition[0].niveau = niveau;

  const pris = new Set(baseCourante(etat).obstacles.cases.map((o) => `${o.rangee}:${o.colonne}`));
  pris.add('18:5');
  const b = GRILLE.bandes.batiments;
  for (const id of ['centreDeCommandement', 'qgDeDefense', 'caserne']) {
    let pose = false;
    for (let r = b.premiere; r <= b.derniere && !pose; r += 1) {
      for (let c = 1; c <= GRILLE.largeur && !pose; c += 1) {
        if (pris.has(`${r}:${c}`)) continue;
        if (poserSansCasser(etat, id, r, c)) { pris.add(`${r}:${c}`); pose = true; }
      }
    }
  }
  for (const bat of baseCourante(etat).disposition) bat.niveau = niveau;

  if (garnison) {
    const d = GRILLE.bandes.defense;
    let i = 0;
    for (let r = d.premiere; r <= d.derniere; r += 1) {
      for (let c = 1; c <= GRILLE.largeur; c += 1) {
        if (pris.has(`${r}:${c}`)) continue;
        baseCourante(etat).garnison.push({
          id: i % 2 ? 'casemate' : 'merlon', rangee: r, colonne: c, niveau, degatsMilli: 0,
        });
        i += 1;
      }
    }
  }
  return etat;
}

function poserSansCasser(etat, id, rangee, colonne) {
  try { poser(etat, id, rangee, colonne); return true; } catch { return false; }
}

/** Une base SYNTHÉTIQUE de l'Ouvrage, pour les montages qui n'ont pas à tirer. */
const ATTAQUANTE = {
  type: 'base', niveau: 20, rangee: 190, colonne: 16, saveur: null, instance: 0,
};

// ---------------------------------------------------------------------------
// T1 — l'équivalence des deux chemins, raids compris
// ---------------------------------------------------------------------------

test('RAID-B T1 — tickJeu × n ≡ rattraperJeu(n), sur une fenêtre à trois raids au moins', () => {
  for (const graine of [7, 42, 101]) {
    // ⚠ BASELINE REMESURÉE AU LOT EUCLIDE : la fenêtre passe de six à neuf
    // heures. La portée est devenue un DISQUE — 316 cases au lieu de 440 —, donc
    // il y a moins de bases attaquantes et les raids tombent plus lentement. Sur
    // la graine 7, six heures n'en portaient plus que deux, et la précondition
    // « au moins trois » de ce test tombait : ce n'est pas l'équivalence qui a
    // cassé, c'est le montage qui a cessé de mesurer. Mesuré sur les trois
    // graines : 9 h en portent 4, 10 et 10.
    const ticks = 9 * TICKS_PAR_HEURE;

    const parTick = baseALaRangee(graine, 200);
    for (let i = 0; i < ticks; i += 1) tickJeu(parTick);
    const parRattrapage = baseALaRangee(graine, 200);
    rattraperJeu(parRattrapage, ticks);

    // ⚠ LE MONTAGE MESURE D'ABORD QU'IL MESURE QUELQUE CHOSE. Une fenêtre sans
    // raid rendrait ce test VERT sur du code où le tirage n'existe pas : c'est
    // exactement la falsification qu'il doit attraper. On l'asserte sur le
    // résultat OBSERVÉ et non sur une estimation faite à l'avance — le rasage
    // déplace la base, donc change la liste des attaquantes en cours de route,
    // et une pré-estimation faite sur la liste de départ serait fausse.
    assert.ok(
      parTick.rapports.length >= 3,
      `graine ${graine} : ${parTick.rapports.length} raid(s) — le montage ne mesure rien`,
    );
    assert.equal(
      serialiser(parTick, 0), serialiser(parRattrapage, 0),
      `graine ${graine} : les deux chemins ont divergé`,
    );
    for (const r of parTick.rapports) assert.equal(r.sens, 'defense');
  }
});

test('RAID-B T1 bis — le tirage ne consomme JAMAIS le flux de l\'état', () => {
  // ⚠ C'EST L'AUTRE MOITIÉ DE LA PURETÉ, et elle ne se voit pas dans T1 : rien
  // d'autre ne consomme `etat.rng` pendant un tick aujourd'hui, si bien qu'un
  // tirage qui le consommerait le consommerait IDENTIQUEMENT des deux côtés et
  // T1 resterait vert. C'est la leçon du lot SATELLITES, reprise telle quelle.
  const etat = baseALaRangee(7, 200);
  const avant = { ...etat.rng };
  rattraperJeu(etat, 6 * TICKS_PAR_HEURE);
  assert.ok(etat.rapports.length > 0, 'le montage ne mesure rien : aucun raid');
  assert.deepEqual(etat.rng, avant, 'le tirage de raid a consommé le flux de la partie');
});

test('RAID-B T1 ter — la source ne conserve aucun flux d\'un appel à l\'autre', () => {
  // La falsification de T1 est « remplacer le hachage par un RNG conservé entre
  // ticks ». Elle se joue par injection sur une copie ; ce qui se garde ICI,
  // c'est que le module ne porte aucun état de module — pas de `let` de niveau
  // fichier qui pourrait retenir un flux.
  const source = readFileSync(join(RACINE, 'src/sim/raid-ouvrage.js'), 'utf8')
    .split('\n').filter((l) => !l.trimStart().startsWith('//')).join('\n');
  assert.equal(
    /^(let|var) /m.test(source), false,
    'un `let` de niveau module retiendrait un flux d\'un appel à l\'autre',
  );
  assert.match(source, /creerRng\(hachageBrut\(/, 'le PRNG doit naître du hachage, à chaque appel');
});

// ---------------------------------------------------------------------------
// T2 — reproductibilité
// ---------------------------------------------------------------------------

test('RAID-B T2 — même graine, même fenêtre, mêmes raids aux mêmes minutes', () => {
  const a = baseALaRangee(31, 200);
  const b = baseALaRangee(31, 200);
  const basesA = basesAttaquantes(a);
  const basesB = basesAttaquantes(b);
  assert.deepEqual(basesA, basesB);
  assert.ok(basesA.length > 0, 'le montage ne mesure rien : aucune base à portée');

  const minutes = (etat, bases) => {
    const sortie = [];
    for (let m = 1; m <= 24 * 60; m += 1) {
      for (const base of bases) {
        if (baseAttaqueALaMinute(etat.graine, base, m)) {
          sortie.push(`${m}@${base.rangee},${base.colonne}`);
        }
      }
    }
    return sortie;
  };
  const listeA = minutes(a, basesA);
  assert.ok(listeA.length >= 10, `le montage ne mesure rien : ${listeA.length} raids sur 24 h`);
  assert.deepEqual(listeA, minutes(b, basesB));

  // ⚠ ET UNE AUTRE GRAINE NE DONNE PAS LA MÊME LISTE — sans quoi « reproductible »
  // voudrait seulement dire « constant ».
  const c = baseALaRangee(32, 200);
  assert.notDeepEqual(listeA, minutes(c, basesAttaquantes(c)));
});

test('RAID-B T2 bis — la minute est ABSOLUE, elle ne repart pas au chargement', () => {
  assert.equal(TICKS_PAR_MINUTE, TICKS_PAR_HEURE / 60);
  assert.equal(minuteDeLHorloge(0), 0);
  assert.equal(minuteDeLHorloge(TICKS_PAR_MINUTE - 1), 0);
  assert.equal(minuteDeLHorloge(TICKS_PAR_MINUTE), 1);
  assert.equal(minuteDeLHorloge(1234 * TICKS_PAR_MINUTE + 7), 1234);
  assert.throws(() => minuteDeLHorloge(-1), /entier ≥ 0/);

  // Le sel est le sixième, et il n'était pris par personne.
  assert.equal(SEL_RAID_OUVRAGE, 6);
});

// ---------------------------------------------------------------------------
// T3 — l'ordre chronologique
// ---------------------------------------------------------------------------

test('RAID-B T3 — deux raids inversés ne donnent pas le même état, et c\'est l\'ordre chronologique qui est retenu', () => {
  const etat = baseALaRangee(7, 200);
  const bases = basesAttaquantes(etat);
  const trouves = [];
  for (let m = 1; m <= 24 * 60 && trouves.length < 2; m += 1) {
    for (const base of bases) {
      if (baseAttaqueALaMinute(etat.graine, base, m)) { trouves.push({ m, base }); break; }
    }
  }
  assert.equal(trouves.length, 2, 'le montage ne mesure rien : moins de deux raids');
  const [premier, second] = trouves;
  assert.ok(premier.m < second.m);

  const dansLOrdre = baseALaRangee(7, 200);
  subirUnRaid(dansLOrdre, premier.base, premier.m);
  subirUnRaid(dansLOrdre, second.base, second.m);

  const aLEnvers = baseALaRangee(7, 200);
  subirUnRaid(aLEnvers, second.base, second.m);
  subirUnRaid(aLEnvers, premier.base, premier.m);

  // ⚠ CE TEST NE VAUT QUE SI L'ORDRE CHANGE VRAIMENT QUELQUE CHOSE. Il le
  // mesure au lieu de le supposer : une base à moitié détruite ne se défend pas
  // comme une base intacte, donc les dégâts du second raid diffèrent.
  assert.notEqual(
    JSON.stringify(baseCourante(dansLOrdre).disposition) + JSON.stringify(baseCourante(dansLOrdre).garnison),
    JSON.stringify(baseCourante(aLEnvers).disposition) + JSON.stringify(baseCourante(aLEnvers).garnison),
    'l\'ordre des deux raids ne change rien : le montage ne mesure pas l\'ordre',
  );

  // Et c'est bien l'ordre chronologique que le moteur retient.
  const parLeMoteur = baseALaRangee(7, 200);
  rattraperJeu(parLeMoteur, (second.m + 1) * TICKS_PAR_MINUTE);
  const minutesVues = parLeMoteur.rapports.map((r) => r.minute);
  assert.deepEqual([...minutesVues].sort((x, y) => x - y), minutesVues,
    'les rapports ne sont pas dans l\'ordre chronologique');
  assert.equal(minutesVues[0], premier.m);
});

// ---------------------------------------------------------------------------
// T4 — les modules de défense recherchés servent
// ---------------------------------------------------------------------------

test('RAID-B T4 — un module de défense acquis change le combat', () => {
  const etat = baseALaRangee(7, 200);
  const base = basesAttaquantes(etat)[0];
  const budget = budgetRaid(base.niveau);


  // ⚠ ON ÉCRIT DANS L'ÉTAT DE RECHERCHE, PAS DANS LE MONTAGE. C'est le chemin
  // réel : `modulesDebloquesDuJoueur` lit `etat.recherche.modules`, et c'est LUI
  // qui doit arriver jusqu'au combat. Écrire directement dans le montage aurait
  // laissé la branche de recherche inerte sans que rien ne le dise.
  //
  // ⚠ ET LA CASEMATE, PAS LE MERLON : le module se lit sur la LIGNE de la pièce
  // (`DEFENSES[x].moduleJoueur`), et un Mur de défense n'en porte aucun. Un
  // montage qui achète une pièce sans module ne débloque rien, et le test
  // passerait pour la mauvaise raison.
  // ⚠ ET UNE ARTILLERIE, PAS UNE TOURELLE. Les six ouvrages de contact portent
  // `autoReparation`, qui n'est PAS un effet de combat : il se rend APRÈS le
  // raid, dans `reparerLaGarnison`. Un montage qui l'achète voit le module
  // arriver au combat et n'y change RIEN — le test passerait alors pour la
  // mauvaise raison, ou tomberait pour une raison qui n'est pas celle qu'il
  // mesure. `rayonMiniMoinsUn`, lui, mord dans la boucle.
  const arme = baseALaRangee(7, 200);
  for (const piece of baseCourante(arme).garnison) piece.id = 'faucheuse';
  for (const piece of baseCourante(etat).garnison) piece.id = 'faucheuse';
  arme.recherche.modules.defense = [...new Set([...arme.recherche.modules.defense, 'faucheuse'])];
  const nu = montageDeLaBaseDuJoueur(etat, base.niveau, budget, 12345);
  assert.deepEqual(nu.modulesDebloques.joueur.defense, [],
    'le montage ne mesure rien : la branche défense est déjà servie');
  const avec = montageDeLaBaseDuJoueur(arme, base.niveau, budget, 12345);
  assert.ok(avec.modulesDebloques.joueur.defense.length > 0,
    'les modules recherchés n\'atteignent pas le montage — toute la branche serait inerte');

  // Et la forme est celle que `creerCombat` exige depuis MODULES-E.
  assert.deepEqual(Object.keys(avec.modulesDebloques.joueur).sort(), ['defense', 'offense']);
  assert.deepEqual(Object.keys(avec.modulesDebloques.ouvrage).sort(), ['defense', 'offense']);

  // Le combat, lui, ne rend pas la même chose.
  const sansModule = resoudre(creerCombat(nu));
  const avecModule = resoudre(creerCombat(avec));
  assert.notDeepEqual(
    sansModule.defenses.map((d) => d.pvMilli),
    avecModule.defenses.map((d) => d.pvMilli),
    'le module acquis ne change rien au combat',
  );
});

// ---------------------------------------------------------------------------
// T5 — la VRAIE base, pas une base générée
// ---------------------------------------------------------------------------

test('RAID-B T5 — le montage porte les positions et les PV réels de la base', () => {
  const etat = baseALaRangee(7, 200);
  baseCourante(etat).disposition[1].degatsMilli = 1_000_000;
  const base = basesAttaquantes(etat)[0];
  const montage = montageDeLaBaseDuJoueur(etat, base.niveau, budgetRaid(base.niveau), 9);

  // Les identifiants sont ceux du JOUEUR — `genererSite` n'en produit aucun.
  const idsGeneres = new Set(genererSite({
    type: 'base', niveau: base.niveau, saveur: null, graine: 9,
  }).batiments.map((b) => b.id));
  for (const b of montage.batiments) {
    assert.ok(Object.prototype.hasOwnProperty.call(BASE_BATIMENTS, b.id),
      `« ${b.id} » n'est pas un bâtiment du joueur`);
    assert.equal(idsGeneres.has(b.id), false, 'le montage vient de `genererSite`');
  }

  // Les positions sont celles de l'état, une par une.
  assert.deepEqual(
    montage.batiments.map((b) => `${b.id}@${b.rangee},${b.colonne},${b.niveau}`),
    baseCourante(etat).disposition.map((b) => `${b.id}@${b.rangee},${b.colonne},${b.niveau}`),
  );
  assert.deepEqual(
    montage.defenseurs.map((d) => `${d.id}@${d.rangee},${d.colonne}`),
    baseCourante(etat).garnison.map((d) => `${d.id}@${d.rangee},${d.colonne}`),
  );

  // Et les PV entamés voyagent : la pièce abîmée porte `pvMilli`, les autres non.
  assert.equal(montage.batiments[1].pvMilli !== undefined, true,
    'les dégâts de la base n\'atteignent pas le montage');
  assert.equal(montage.batiments[0].pvMilli, undefined,
    'un bâtiment intact ne doit pas porter de forçage de PV');

  assert.equal(montage.proprietaireDefense, 'joueur');
  assert.equal(montage.proprietaireAttaque, 'ouvrage');
  assert.equal(montage.obstacles, baseCourante(etat).obstacles.cases);
});

// ---------------------------------------------------------------------------
// T6 — le niveau minimal
// ---------------------------------------------------------------------------

test('RAID-B T6 — une base de niveau < 10 n\'est jamais attaquante', () => {
  assert.equal(RAID_OUVRAGE.niveauMinimal, 10);

  // ⚠⚠ LA POSITION EST CHOISIE POUR QUE LE FILTRE MORDE, ET LE PREMIER MONTAGE
  // DE CE TEST NE MORDAIT PAS. Il regardait une partie NEUVE : la garde du
  // peuplement écarte toute base de quinze cases du départ, donc il n'y a aucune
  // base à portée, donc « aucune attaquante » est vrai avec ou sans le filtre —
  // vert sur du code cassé. À la rangée 255, la fenêtre porte des bases des DEUX
  // côtés du seuil, et c'est la seule forme qui mesure quelque chose.
  const etat = creerEtat(7);
  baseCourante(etat).position.rangee = 255;
  const toutes = ciblesAPortee(etat, baseCourante(etat)).filter((s) => TYPES_SITE[s.type].attaqueLeJoueur);
  const sousLeSeuil = toutes.filter((b) => b.niveau < RAID_OUVRAGE.niveauMinimal);
  assert.ok(sousLeSeuil.length > 0,
    'le montage ne mesure rien : aucune base sous le seuil dans la fenêtre');
  assert.ok(toutes.length > sousLeSeuil.length,
    'le montage ne mesure rien : aucune base AU-DESSUS du seuil dans la fenêtre');

  const attaquantes = basesAttaquantes(etat);
  assert.equal(attaquantes.length, toutes.length - sousLeSeuil.length,
    'le filtre de niveau minimal ne mord pas');
  for (const a of attaquantes) {
    assert.ok(a.niveau >= RAID_OUVRAGE.niveauMinimal, `niveau ${a.niveau} sous le seuil`);
  }

  // ⚠ ET LE SECOND FILTRE EST DANS LES DONNÉES : seules les BASES attaquent.
  // Camps et avant-postes sont du butin, pas une menace — c'est ce que dit
  // `TYPES_SITE[x].attaqueLeJoueur`, et le bord rouge de la carte le redit déjà
  // au joueur.
  for (const a of attaquantes) {
    assert.equal(TYPES_SITE[a.type].attaqueLeJoueur, true, `« ${a.type} » ne devrait pas attaquer`);
  }
  const nonAttaquants = Object.keys(TYPES_SITE).filter((t) => !TYPES_SITE[t].attaqueLeJoueur);
  assert.deepEqual(nonAttaquants.sort(), ['avantPoste', 'camp']);

  // Une partie neuve, elle, n'est attaquée par personne : le début de partie est
  // à l'abri, et c'est la garde du peuplement autant que le seuil de niveau.
  assert.deepEqual(basesAttaquantes(creerEtat(7)), []);
});

// ---------------------------------------------------------------------------
// T7 — le rasage, et le relevé des POI
// ---------------------------------------------------------------------------

test('RAID-B T7 — le rasage redéploie de 20 cases, vide les stocks, et relève les POI', () => {
  // ⚠⚠ LA POSITION EST CHOISIE POUR QUE LE RELEVÉ CHANGE, ET C'EST TOUT L'ENJEU
  // DE CE TEST. À n'importe quelle position, `poisAcquis` reste vide avant comme
  // après — la garde du peuplement écarte les POI de quinze cases du départ, et
  // le territoire du joueur est un disque de rayon 2 (`POI T24`). Un montage pris
  // au hasard rendrait donc « vide == vide » et passerait VERT même si le rappel
  // de `releverLesPoisAcquis` était omis. On plante la base VINGT CASES au-dessus
  // d'un POI : rien avant, un POI après — c'est la falsification qui décide.
  // ⚠⚠ LA POSITION SE CHERCHE, ELLE NE S'ÉCRIT PLUS. Elle valait
  // `{ rangee: 255, colonne: 13 }` en dur, et le lot du 03/09 — qui a densifié le
  // peuplement — a déplacé les POI, que le tirage fait esquiver les bases de
  // l'Ouvrage. Le montage est alors tombé sur « aucun POI après le rasage »,
  // c'est-à-dire sur son propre garde-fou. **Un montage qui écrit une coordonnée
  // ne garde que lui-même**, et c'est la deuxième fois de ce lot.
  const etat = baseALaRangee(7, 200, { niveau: 1, garnison: false });
  const SAUT = RAID_OUVRAGE.sanctionRasage.redeploiementCases;
  let DEPART = null;
  for (let rangee = 240; rangee <= 270 && DEPART === null; rangee += 1) {
    for (let colonne = 3; colonne <= 29; colonne += 1) {
      const ici = { rangee, colonne };
      const la = { rangee: rangee + SAUT, colonne };
      if (poisAutourDe(etat, ici).length !== 0) continue;
      if (poisAutourDe(etat, la).length === 0) continue;
      DEPART = ici;
      break;
    }
  }
  assert.ok(DEPART !== null,
    'montage : aucune case d\'où le rasage fasse tomber un POI sous la base');
  baseCourante(etat).position = { ...DEPART };
  assert.deepEqual(etat.poisAcquis, [], 'le montage ne mesure rien : un POI est déjà acquis');
  assert.equal(poisAutourDe(etat, DEPART).length, 0,
    'le montage ne mesure rien : un POI est déjà sous la base AVANT le rasage');
  const arrivee = { rangee: DEPART.rangee + SAUT, colonne: DEPART.colonne };
  // ⚠⚠ LE VOISINAGE EST RASÉ, ET C'EST CE QUE LE MONTAGE SUPPOSAIT SANS LE
  // DIRE. Tant que le joueur ne pouvait pas perdre une case, sa PORTÉE était sa
  // PROPRIÉTÉ, et poser une base suffisait à lui donner son octogone. Depuis
  // TERRITOIRE-FORCE la case revient au camp le plus fort, et depuis
  // TERRITOIRE-LU le barème et les POI demandent la propriété : une base de
  // niveau 1 posée au milieu de bases de l'Ouvrage de niveau 30 ne tient plus
  // rien. Ce test-ci mesure une FORME, pas un rapport de force — on écarte donc
  // ce qu'il n'a pas choisi de mesurer.
  for (const o of basesDeLaFenetre(etat.graine, {
    premiereRangee: DEPART.rangee - 8, derniereRangee: arrivee.rangee + 8,
    premiereColonne: 1, derniereColonne: 31,
  })) etat.basesRasees.push(caseRasee(o.rangee, o.colonne));
  const attendus = poisAutourDe(etat, arrivee);
  assert.ok(attendus.length > 0,
    'le montage ne mesure rien : aucun POI ne tombe sous la base APRÈS le rasage');

  const rapport = subirUnRaid(etat, ATTAQUANTE, 5);

  assert.equal(rapport.rase, true, 'le montage ne mesure rien : la base n\'a pas été rasée');
  assert.equal(rapport.verdict, 'defaite-totale');

  // ⚠⚠ LE CHANTIER NE PLANCHE PAS, ET C'EST CE QUI REND LA BASE RASABLE.
  // `BASE_BATIMENTS.chantierDeConstruction.plancherPv` vaut `false` — il est le
  // seul des onze — et le rasage n'a de sens que s'il tombe VRAIMENT à zéro. Le
  // faire plancher comme les autres laisserait `rase` vrai (il est lu sur
  // `detruit`, avant l'écriture) et ne se verrait donc nulle part ailleurs.
  const chantier = baseCourante(etat).disposition.find((b) => BASE_BATIMENTS[b.id].raseLeSite === true);
  const pvMax = BASE_BATIMENTS[chantier.id].pv * 1000;
  assert.equal(chantier.degatsMilli, pvMax,
    'le Chantier a gardé un plancher de PV : la base ne serait plus vraiment rasée');
  // Les autres, eux, planchent : ils sont à réparer, pas perdus.
  for (const b of baseCourante(etat).disposition) {
    if (BASE_BATIMENTS[b.id].plancherPv === false) continue;
    const max = BASE_BATIMENTS[b.id].pv * 1000;
    assert.ok(b.degatsMilli <= max - APRES_RAID.plancherPvMilli,
      `« ${b.id} » est tombé sous son plancher de PV`);
  }

  assert.deepEqual(baseCourante(etat).position, arrivee, 'le redéploiement ne fait pas les vingt cases');
  assert.equal(rapport.sanction.cases, RAID_OUVRAGE.sanctionRasage.redeploiementCases);
  assert.deepEqual(baseCourante(etat).economie.ressources, { quartz: 0, scorie: 0, electricite: 0 });
  assert.ok(rapport.sanction.perdu.quartz > 0, 'les stocks perdus ne sont pas rapportés');

  // ⚠ LE TERRAIN NE SUIT PAS : `fondation` ne bouge pas, donc ni les champs ni
  // les obstacles. C'est l'arbitrage du 27/08, et le rasage ne le contredit pas.
  assert.deepEqual(baseCourante(etat).fondation, baseCourante(creerEtat(7)).fondation);

  // ⚠ ET LE RELEVÉ DES POI EST REFAIT. La falsification est d'omettre le rappel :
  // `poisAcquis` reste alors VIDE, alors que la base est désormais posée sur un
  // gisement.
  assert.deepEqual(
    [...etat.poisAcquis].sort(comparerPoi),
    [...attendus].sort(comparerPoi),
    'le relevé des POI n\'a pas suivi le déménagement',
  );
});

/**
 * Les POI que le territoire d'une base couvre.
 *
 * ⚠⚠ LA FORME EST CELLE DE L'OCTOGONE DEPUIS LE 03/09, ET ELLE EST RÉÉCRITE ICI.
 * Ce garde-fou comparait un CARRÉ de rayon 2 : il englobait donc les quatre
 * coins qu'Ethan fait rogner, et le montage s'est mis à attendre un POI que
 * `releverLesPoisAcquis` n'acquiert plus. Écrire la règle plutôt que d'importer
 * `dansLOctogoneDInfluence` garde le test non tautologique — il tomberait si la
 * forme du code changeait sans que celle-ci suive.
 */
function poisAutourDe(etat, position) {
  const rayon = GEOGRAPHIE.rayonInfluenceJoueur;
  const trouves = [];
  for (const poi of carteDesPoi(etat.graine).liste) {
    const dr = Math.abs(poi.rangee - position.rangee);
    const dc = Math.abs(poi.colonne - position.colonne);
    if (Math.max(dr, dc) <= rayon && dr + dc <= rayon + 1) {
      trouves.push({ type: poi.type, bande: poi.bande });
    }
  }
  return trouves;
}

function comparerPoi(a, b) {
  return a.type.localeCompare(b.type) || a.bande - b.bande;
}

// ---------------------------------------------------------------------------
// T8 — la borne de la carte
// ---------------------------------------------------------------------------

test('RAID-B T8 — un rasage près du bord ne sort pas de la carte', () => {
  const hauteur = GEOGRAPHIE.carte.hauteur;
  // ⚠ LE CAS EST RÉEL, PAS THÉORIQUE : le joueur DÉMARRE rangée 295 sur une
  // carte de 300. Son tout premier rasage bute donc sur le bord, et c'est la
  // situation la plus fréquente du jeu, pas la plus rare.
  for (const rangee of [hauteur, hauteur - 1, hauteur - 5, hauteur - 19, hauteur - 20]) {
    const etat = baseALaRangee(7, 200, { niveau: 1, garnison: false });
    baseCourante(etat).position.rangee = rangee;
    const rapport = subirUnRaid(etat, ATTAQUANTE, 5);
    assert.equal(rapport.rase, true, `rangée ${rangee} : le montage ne mesure rien`);
    assert.ok(baseCourante(etat).position.rangee <= hauteur,
      `rangée ${rangee} : la base est sortie de la carte, en ${baseCourante(etat).position.rangee}`);
    assert.equal(estSurLaCarte(baseCourante(etat).position.rangee, baseCourante(etat).position.colonne), true);
    // À la borne, la base descend d'autant qu'elle peut — jamais moins, jamais plus.
    const voulue = rangee + RAID_OUVRAGE.sanctionRasage.redeploiementCases;
    assert.equal(baseCourante(etat).position.rangee, Math.min(voulue, hauteur));
  }
});

// ---------------------------------------------------------------------------
// T9 — la réserve de réparation
// ---------------------------------------------------------------------------

test('RAID-B T9 — un raid qui passe vide la réserve de réparation', () => {
  const etat = baseALaRangee(7, 200, { niveau: 1, garnison: false });
  // ⚠ ON MESURE D'ABORD QU'IL Y A QUELQUE CHOSE À VIDER. Une réserve déjà nulle
  // rendrait ce test vert sur du code qui ne la touche pas.
  for (const chassis of Object.keys(baseCourante(etat).reserveReparation)) {
    baseCourante(etat).reserveReparation[chassis] = 12_345;
  }
  const base = basesAttaquantes(etat)[0];
  const rapport = subirUnRaid(etat, base, 5);
  assert.equal(rapport.reserveVidee, true, 'le montage ne mesure rien : le raid n\'a rien cassé');
  assert.deepEqual(baseCourante(etat).reserveReparation, { escouade: 0, blinde: 0, aeronef: 0 });
});

test('RAID-B T9 bis — un raid ENTIÈREMENT repoussé ne vide rien', () => {
  // ⚠ « UN RAID QUI PASSE » VEUT DIRE « QUI A FAIT DES DÉGÂTS ». Punir une
  // défense qui a fait son travail serait le contraire de ce que la phrase de
  // `MODELE-ECONOMIQUE.md` §7 décrit.
  const etat = baseALaRangee(7, 200, { niveau: 50 });
  for (const chassis of Object.keys(baseCourante(etat).reserveReparation)) {
    baseCourante(etat).reserveReparation[chassis] = 12_345;
  }
  const rapport = subirUnRaid(etat, { ...ATTAQUANTE, niveau: 10 }, 5);
  if (rapport.reserveVidee === false) {
    assert.deepEqual(baseCourante(etat).reserveReparation, { escouade: 12_345, blinde: 12_345, aeronef: 12_345 });
    assert.equal(rapport.verdict, 'victoire-totale');
    assert.equal(rapport.restantBatiments, 100);
  } else {
    assert.fail('le montage ne mesure rien : la base niveau 50 a encaissé des dégâts');
  }
});

// ---------------------------------------------------------------------------
// T10 — `reparerLaGarnison` est ENFIN atteinte
// ---------------------------------------------------------------------------

test('RAID-B T10 — l\'auto-réparation de garnison est atteignable en jeu', () => {
  // ⚠⚠ C'EST LA MEILLEURE PREUVE DU LOT : l'assertion qui suit ne pouvait pas
  // passer avant, faute d'un seul écrivain de `degatsMilli` sur `etat.garnison`.
  // Elle n'est pas jouée sur un état forgé — la garnison est abîmée par un VRAI
  // raid de l'Ouvrage, et c'est lui qui rend l'effet atteignable.
  const etat = baseALaRangee(7, 200, { niveau: 10 });
  // Les trois tourelles portent `autoReparation` chez le joueur ; il faut
  // l'avoir ACHETÉE pour en profiter — deux contrôles, et il faut les deux.
  // ⚠ DEUX CONTRÔLES, ET IL FAUT LES DEUX : `nomDuModule` dit QUEL module la
  // ligne porte, `moduleEstAcquis` dit si le joueur l'a PAYÉ pour cette ligne.
  // La liste des modules payés est `recherche.modules`, pas `recherche.acquises`
  // — la seconde ne dit que « la pièce est constructible ».
  etat.recherche.modules.defense = [...new Set([...etat.recherche.modules.defense, 'casemate'])];
  const base = basesAttaquantes(etat)[0];
  const rapport = subirUnRaid(etat, base, 5);

  const abimees = baseCourante(etat).garnison.filter((p) => p.degatsMilli > 0);
  assert.ok(abimees.length > 0,
    'le montage ne mesure rien : aucune pièce de garnison n\'a été touchée');
  assert.ok(rapport.autoReparationMilli > 0,
    'l\'auto-réparation n\'a rien rendu — l\'effet reste inatteignable');

  // Et sans l'achat, rien n'est rendu : le module ne se donne pas.
  const sansAchat = baseALaRangee(7, 200, { niveau: 10 });
  const rapportNu = subirUnRaid(sansAchat, base, 5);
  assert.equal(rapportNu.autoReparationMilli, 0,
    'l\'auto-réparation a été rendue sans avoir été payée');
});

test('RAID-B T10 bis — le commentaire périmé de reparerLaGarnison a été corrigé', () => {
  // ⚠ « NE PAS LAISSER UN COMMENTAIRE QUI ANNONCE UN FUTUR DEVENU PRÉSENT » —
  // c'est le §4.4 du brief, et c'est une règle du dépôt depuis le lot POI.
  const source = readFileSync(join(RACINE, 'src/sim/raid.js'), 'utf8');
  assert.equal(
    source.includes('ÉCRIT ET INATTEIGNABLE'), false,
    'raid.js annonce encore que l\'auto-réparation est inatteignable en jeu',
  );
  assert.match(source, /ATTEIGNABLE EN JEU DEPUIS LE LOT RAID-B/);
});

// ---------------------------------------------------------------------------
// T11 — plusieurs raids pendant une absence, bornés à dix
// ---------------------------------------------------------------------------

test('RAID-B T11 — plusieurs raids d\'une absence apparaissent tous, dans la limite des dix', () => {
  const etat = baseALaRangee(7, 200, { niveau: 30 });
  rattraperJeu(etat, 6 * TICKS_PAR_HEURE);
  assert.ok(etat.rapports.length > 1,
    `le montage ne mesure rien : ${etat.rapports.length} rapport(s)`);
  assert.ok(etat.rapports.length <= APRES_RAID.rapportsGardes);
  for (const r of etat.rapports) {
    assert.equal(r.sens, 'defense');
    assert.equal(r.attaquant.type, 'base');
    assert.ok(Number.isInteger(r.minute));
    assert.ok(Number.isInteger(r.tick), 'le rapport porte son horodatage de JEU');
  }

  // ⚠ LA BORNE EST CELLE DES DONNÉES, ET ELLE MORD. Une longue absence en
  // produit plus que dix.
  const longue = baseALaRangee(7, 200, { niveau: 30 });
  rattraperJeu(longue, 72 * TICKS_PAR_HEURE);
  assert.equal(longue.rapports.length, APRES_RAID.rapportsGardes);
  const minutes = longue.rapports.map((r) => r.minute);
  assert.deepEqual([...minutes].sort((a, b) => a - b), minutes);

  // ⚠⚠ ET CE SONT LES DIX DERNIERS, PAS LES DIX PREMIERS. Une file, pas une
  // pile : c'est le plus ANCIEN qui sort. Sans cette assertion, remplacer le
  // `shift` par un `pop` laisse tout le reste vert — la liste reste triée,
  // longue de dix, et pleine de rapports parfaitement valides ; simplement, le
  // joueur qui revient après trois jours lit ce qui lui est arrivé le premier
  // soir et jamais ce qui vient de se passer. Mesuré sur `garderLeRapport`
  // lui-même, qui est l'endroit où la faute se commettrait.
  const journal = baseALaRangee(7, 200, { niveau: 30 });
  journal.rapports = [];
  const combien = APRES_RAID.rapportsGardes + 5;
  for (let i = 1; i <= combien; i += 1) garderLeRapport(journal, { sens: 'defense', rang: i });
  assert.equal(journal.rapports.length, APRES_RAID.rapportsGardes);
  assert.deepEqual(
    journal.rapports.map((r) => r.rang),
    Array.from({ length: APRES_RAID.rapportsGardes }, (u, k) => combien - APRES_RAID.rapportsGardes + k + 1),
    'le journal garde les plus ANCIENS au lieu des plus récents',
  );
});

// ---------------------------------------------------------------------------
// T12 — la sauvegarde
// ---------------------------------------------------------------------------

test('RAID-B T12 — la migration 19 → 20 pose des dégâts nuls', () => {
  // ⚠ LE NUMÉRO N'EST PLUS GARDÉ ICI, ET C'EST LA RÈGLE DU DÉPÔT, PAS UN
  // ASSOUPLISSEMENT. `points-attaque.test.js` l'écrit depuis le lot
  // SITE-ENTAMÉ : « la garde du numéro appartient au maillon le plus RÉCENT
  // de la chaîne, une seule fois ». Ce test-ci avait gardé le sien, et le lot
  // BASES-0 l'aurait rendu rouge pour une raison qui ne le regarde pas. Ce
  // qu'il vérifie vraiment, c'est que SON maillon est encore là.
  assert.ok(SAVE_VERSION >= 20, 'le maillon v19 → 20 n\'est plus dans la chaîne');

  // Une v19 forgée SANS le champ — c'est ainsi qu'elles étaient toutes.
  const v19 = JSON.parse(serialiser(creerEtat(7), 0));
  // ⚠ APLATIE AVANT D'ÊTRE RABAISSÉE — lot BASES-0. Une v19 n'a jamais
  // porté `bases` : lui en donner un ferait tourner la chaîne de migrations
  // sur une forme qui n'a jamais existé.
  aplatirSauvegarde(v19);
  v19.version = 19;
  for (const b of v19.disposition) delete b.degatsMilli;
  assert.equal('degatsMilli' in v19.disposition[0], false,
    'le montage ne mesure rien : la v19 porte déjà le champ');

  const migre = migrer(structuredClone(v19));
  assert.equal(migre.version, SAVE_VERSION);
  for (const b of baseCourante(migre).disposition) assert.equal(b.degatsMilli, 0);

  // Une v19 qui portait déjà un chiffre — impossible en jeu, mais la migration
  // ne doit pas l'écraser : elle AJOUTE, elle ne refonde pas.
  const avecChiffre = structuredClone(v19);
  avecChiffre.disposition[0].degatsMilli = 42;
  assert.equal(migrer(avecChiffre).bases[0].disposition[0].degatsMilli, 42);
});

test('RAID-B T12 bis — le rapport de défense traverse la sauvegarde', () => {
  const etat = baseALaRangee(7, 200, { niveau: 1, garnison: false });
  const base = basesAttaquantes(etat)[0];
  subirUnRaid(etat, base, 5);
  const relu = JSON.parse(serialiser(etat, 0));
  assert.equal(relu.rapports.length, 1);
  assert.equal(relu.rapports[0].sens, 'defense');
  assert.equal(relu.rapports[0].verdict, 'defaite-totale');
  // ⚠ AUCUN `resultat` DE COMBAT NE SE RANGE, et la borne de poids tient : un
  // rapport de défense reste de l'ordre du demi-kilo-octet.
  assert.ok(JSON.stringify(relu.rapports[0]).length < 1024,
    'un rapport de défense pèse plus d\'un kilo-octet');
});

// ---------------------------------------------------------------------------
// Les pièges du §5 — recensés, et mesurés
// ---------------------------------------------------------------------------

test('RAID-B — une pièce posée sur un obstacle ne fait pas lever le raid', () => {
  // ⚠⚠ LE CAS EST TOLÉRÉ AU CHARGEMENT, DONC IL ARRIVE. `CODES_TOLERES_AU_CHARGEMENT`
  // porte `obstacle` parce que le terrain se redéduit à chaque chargement : un
  // obstacle peut se poser sous une pièce placée légalement la veille. Un raid
  // qui LÈVERAIT là-dessus rendrait la partie injouable pour une faute que le
  // joueur n'a pas commise.
  const etat = baseALaRangee(7, 200, { niveau: 10 });
  const roche = baseCourante(etat).obstacles.cases.find((o) => o.rangee >= GRILLE.bandes.defense.premiere
    && o.rangee <= GRILLE.bandes.defense.derniere);
  assert.ok(roche !== undefined, 'le montage ne mesure rien : aucun obstacle en bande de défense');
  baseCourante(etat).garnison.push({
    id: 'merlon', rangee: roche.rangee, colonne: roche.colonne, niveau: 10, degatsMilli: 0,
  });
  const nb = baseCourante(etat).garnison.length;
  const base = basesAttaquantes(etat)[0];
  assert.doesNotThrow(() => subirUnRaid(etat, base, 5));
  // Elle n'est PAS retirée : elle n'a simplement pas combattu.
  assert.equal(baseCourante(etat).garnison.length, nb);
  assert.equal(baseCourante(etat).garnison[nb - 1].degatsMilli, 0);
});

test('RAID-B — un raid ennemi peut tomber pendant un raid du joueur, et ce n\'est pas un problème', () => {
  // ⚠ LE PIÈGE §5.3 DU BRIEF, VÉRIFIÉ ET NON SUPPOSÉ : rien n'empêche les deux
  // de coexister, parce qu'un raid du joueur n'est PAS un état qui dure. Il se
  // résout en un appel synchrone à l'intérieur d'un tick ; il n'y a aucune
  // fenêtre pendant laquelle un raid ennemi pourrait tomber « au milieu ».
  const source = readFileSync(join(RACINE, 'src/sim/raid.js'), 'utf8');
  assert.equal(/raidEnCours|enVol|raidPendant/.test(source), false,
    'un raid du joueur porterait un état qui dure : la coexistence serait à revoir');
  const etat = baseALaRangee(7, 200, { niveau: 10 });
  const base = basesAttaquantes(etat)[0];
  assert.doesNotThrow(() => resoudreLaMinute(etat, 5, [base]));
});

test('RAID-B — les onze bâtiments du joueur se montent au combat, et sans collision de clé', () => {
  // ⚠⚠ C'EST LE TROU QUE `CLAUDE.md` §6 ANNONÇAIT : « un combat où le joueur
  // défend ne peut porter aucun bâtiment ». Il est comblé, et le contrôle porte
  // sur les ONZE, pas sur celui qui se trouve dans le montage du jour.
  const b = GRILLE.bandes.batiments;
  for (const [id, ligne] of Object.entries(BASE_BATIMENTS)) {
    const montage = {
      niveau: 10,
      batiments: [{
        id, rangee: b.derniere, colonne: 5, niveau: 3,
      }],
      defenseurs: [],
      vagues: [],
      proprietaireDefense: 'joueur',
      proprietaireAttaque: 'ouvrage',
    };
    const resultat = resoudre(creerCombat(montage), { maxTicks: 1 });
    assert.equal(resultat.batiments.length, 1, `« ${id} » n'a pas été monté`);
    assert.equal(resultat.batiments[0].pvMaxMilli % ligne.pv, 0,
      `« ${id} » n'a pas ses PV réels`);
  }
  // Aucune clé du joueur ne heurte une clé de l'Ouvrage.
  const source = readFileSync(join(RACINE, 'src/sim/combat.js'), 'utf8');
  assert.match(source, /est à la fois un bâtiment de l'Ouvrage et du joueur/);
});

test('RAID-B — le Chantier tombé rase, et lui seul', () => {
  // La règle vit dans les DONNÉES, sous le même nom que du côté de l'Ouvrage.
  const raseurs = Object.keys(BASE_BATIMENTS).filter((id) => BASE_BATIMENTS[id].raseLeSite === true);
  assert.deepEqual(raseurs, ['chantierDeConstruction']);
  const sansPlancher = Object.keys(BASE_BATIMENTS)
    .filter((id) => BASE_BATIMENTS[id].plancherPv === false);
  assert.deepEqual(sansPlancher, ['chantierDeConstruction'],
    'le seul bâtiment qui rase doit être le seul sans plancher, sinon la base est inrasable');
});

test('RAID-B — prochaineMinuteDeRaid ne résout rien et borne sa fenêtre', () => {
  const etat = baseALaRangee(7, 200);
  const bases = basesAttaquantes(etat);
  assert.equal(prochaineMinuteDeRaid(etat.graine, [], 0, 10_000), null,
    'sans attaquante, il n\'y a pas de raid');
  const m = prochaineMinuteDeRaid(etat.graine, bases, 0, 24 * 60);
  assert.ok(Number.isInteger(m) && m > 0 && m <= 24 * 60);
  assert.equal(prochaineMinuteDeRaid(etat.graine, bases, 0, m - 1) !== m, true,
    'la borne haute est INCLUSE, la borne basse EXCLUE');
  assert.equal(prochaineMinuteDeRaid(etat.graine, bases, m - 1, m), m);
  // Elle ne touche à rien.
  const avant = serialiser(etat, 0);
  prochaineMinuteDeRaid(etat.graine, bases, 0, 5000);
  assert.equal(serialiser(etat, 0), avant);
});

// ---------------------------------------------------------------------------
// RAID-CIBLE-UNIQUE — une base de l'Ouvrage n'en frappe qu'une, 07/09/2026
// ---------------------------------------------------------------------------
//
// ⚠⚠ ARBITRÉ PAR ETHAN LE 07/09 : « elle n'en frappe qu'une, la plus proche »,
// et pour l'égalité « le plus haut, puis gauche à droite ». Le commentaire de
// `basesAttaquantes` portait la LECTURE PRISE — à portée de deux bases du
// joueur, une base de l'Ouvrage les attaquait toutes les deux la même minute —
// et désignait le `for` imbriqué à changer. C'est ce qui est fait.
//
// ⚠ LES MONTAGES POSENT LES BASES DU JOUEUR AUX COORDONNÉES VOULUES, ET LA CARTE
// NE BOUGE PAS SOUS ELLES. Le peuplement se tire de la graine et de la position
// de DÉPART, qui est une constante : déplacer une base ne déplace aucun site,
// et c'est ce qui rend ces géométries reproductibles.

/** Une partie dont les bases du joueur sont aux positions demandées. */
function partieAvecBases(graine, positions) {
  const etat = creerEtat(graine);
  poserLaBaseSur(etat, positions[0].rangee, positions[0].colonne);
  for (const p of positions.slice(1)) ajouterUneBase(etat, { rangee: p.rangee, colonne: p.colonne });
  return etat;
}

/** La clé d'une case — une case porte au plus un site. */
const caseDe = (x) => `${x.rangee},${x.colonne}`;

/** La position de la base du joueur qu'une paire désigne. */
const cibleDe = (etat, paire) => etat.bases[paire.baseVisee].position;

/** Le carré de la distance euclidienne — la mesure QUI DÉCIDE de la portée. */
const d2 = (a, b) => (a.rangee - b.rangee) ** 2 + (a.colonne - b.colonne) ** 2;

/** Deux bases voisines dont beaucoup d'attaquantes voient les DEUX. */
const A_NORD = { rangee: 200, colonne: 16 };
const B_SUD = { rangee: 204, colonne: 19 };

test('RCU T0 — l\'orientation, vérifiée par EXÉCUTION avant tout comparateur', () => {
  // ⚠⚠ C'EST LE PIÈGE DU LOT, ET IL SE PREND À L'ENVERS SANS QUE RIEN NE LE
  // DISE. « Le plus haut » veut dire la plus PETITE rangée : le niveau croît
  // vers le nord, et le nord est la rangée 1. Un signe inversé donnerait un
  // départage qui marche parfaitement et choisit systématiquement la mauvaise
  // base — et un test d'égalité écrit avec la même erreur ne le verrait pas.
  // On ne le déduit donc pas d'un commentaire : on l'exécute.
  assert.equal(niveauDeLaRangee(1), GEOGRAPHIE.niveauPlafond,
    'la rangée 1 devrait être au plafond de niveau : le nord est en haut');
  assert.equal(niveauDeLaRangee(GEOGRAPHIE.carte.hauteur), 1,
    'la dernière rangée devrait être au niveau 1');
  assert.ok(niveauDeLaRangee(100) > niveauDeLaRangee(200),
    'le niveau devrait DÉCROÎTRE quand la rangée croît');
  // Le joueur démarre au sud, au niveau 1 : c'est la moitié qui rend la première
  // assertion non tautologique.
  assert.equal(niveauDeLaRangee(positionDepartJoueur().rangee), 1);

  // ⚠ ET « LA PLUS PROCHE » N'EST PAS TCHEBYCHEV. La portée est un DISQUE depuis
  // le lot EUCLIDE — `estAPorteeDAttaque` teste `d² ≤ rayon²` — et c'est cette
  // mesure-là que `ciblesAPortee` pose sur chaque site sous le nom
  // `distanceCarree`. Mesuré : une case à (10, 10) est à distance 10 de
  // Tchebychev, donc « au rayon », et pourtant HORS de portée.
  const origine = { rangee: 100, colonne: 100 };
  const coin = { rangee: 110, colonne: 110 };
  assert.equal(distanceTchebychev(origine, coin), GEOGRAPHIE.rayonAttaque);
  assert.equal(estAPorteeDAttaque(origine, coin), false,
    'le coin du carré de Tchebychev est hors du disque : les deux mesures diffèrent');
  assert.equal(estAPorteeDAttaque(origine, { rangee: 107, colonne: 107 }), true);
});

test('RCU T1 — une base de l\'Ouvrage ne frappe qu\'UNE base du joueur', () => {
  // ⚠ LES CONTESTÉES SE COMPTENT SUR L'ÉTAT À DEUX BASES, JAMAIS EN CROISANT
  // DEUX ÉTATS À UNE BASE. `siteDeLaCase` rend `null` sur la case d'une base du
  // joueur : la seconde base EFFACE le site qui occupait la sienne, et le
  // croisement aurait compté un site qui n'existe plus. Mesuré — 73 sites d'un
  // côté, 72 de l'autre, et l'écart était le montage, pas le code.
  const etat = partieAvecBases(7, [A_NORD, B_SUD]);
  const rayonCarre = GEOGRAPHIE.rayonAttaque ** 2;
  const paires = basesAttaquantes(etat);
  const contestes = paires.filter(
    (p) => etat.bases.every((b) => d2(b.position, p) <= rayonCarre),
  );
  assert.ok(contestes.length > 0,
    'le montage ne mesure rien : aucune attaquante ne voit les deux bases');

  // ⚠ AUCUNE ATTAQUANTE N'APPARAÎT DEUX FOIS — contestée ou non. C'est le défaut
  // exact que le lot referme : avant lui, chaque contestée produisait DEUX
  // paires, la même minute.
  const cases = paires.map(caseDe);
  assert.equal(new Set(cases).size, cases.length, 'une attaquante paraît deux fois');

  // Falsifiable par le COMPTE : sans le regroupement, la liste ferait la somme
  // des vues, donc exactement une entrée de plus par contestée.
  const sansRegroupement = etat.bases.reduce((n, b) => n + ciblesAPortee(etat, b).filter(
    (s) => TYPES_SITE[s.type]?.attaqueLeJoueur === true && s.niveau >= RAID_OUVRAGE.niveauMinimal,
  ).length, 0);
  assert.ok(sansRegroupement > paires.length, 'le montage ne mesure rien : aucun doublon');
  assert.equal(sansRegroupement - paires.length, contestes.length,
    'le compte des doublons retirés ne tombe pas sur celui des attaquantes contestées');
});

test('RCU T2 — c\'est la PLUS PROCHE qui est frappée', () => {
  const etat = partieAvecBases(7, [A_NORD, B_SUD]);
  const paires = basesAttaquantes(etat);
  let mesurees = 0;
  for (const p of paires) {
    const distances = etat.bases.map((b) => d2(b.position, p));
    const mini = Math.min(...distances.filter((d) => d <= GEOGRAPHIE.rayonAttaque ** 2));
    if (distances[0] === distances[1]) continue; // l'égalité est le sujet de T3
    mesurees += 1;
    assert.equal(d2(cibleDe(etat, p), p), mini,
      `l'attaquante (${caseDe(p)}) ne frappe pas la plus proche`);
  }
  assert.ok(mesurees > 0, 'le montage ne mesure rien : aucune distance différente');
});

test('RCU T3 — à égale distance, la PLUS HAUTE, c\'est-à-dire la plus PETITE rangée', () => {
  // ⚠⚠ POURQUOI LA PLUS PETITE : le nord est en haut, la rangée 1 est au niveau
  // 50 et la rangée 300 au niveau 1 — `RCU T0` l'exécute. « Le plus haut » d'Ethan
  // est donc la rangée qui DÉCROÎT, et c'est le seul endroit du lot où un signe
  // inversé passerait inaperçu.
  const x = basesAttaquantes(partieAvecBases(7, [A_NORD]))[0];
  // Deux bases symétriques autour de l'attaquante : d² = 9 + 16 = 25 des deux
  // côtés, rangées différentes.
  const haute = { rangee: x.rangee - 3, colonne: x.colonne - 4 };
  const basse = { rangee: x.rangee + 3, colonne: x.colonne + 4 };
  assert.equal(d2(haute, x), d2(basse, x), 'le montage ne mesure rien : distances inégales');
  assert.ok(haute.rangee < basse.rangee);

  for (const ordre of [[haute, basse], [basse, haute]]) {
    const etat = partieAvecBases(7, ordre);
    const paire = basesAttaquantes(etat).find((p) => caseDe(p) === caseDe(x));
    assert.notEqual(paire, undefined, 'l\'attaquante a disparu du montage');
    assert.deepEqual(
      { rangee: cibleDe(etat, paire).rangee, colonne: cibleDe(etat, paire).colonne }, haute,
      'à égale distance, c\'est la plus HAUTE — la plus petite rangée — qui est frappée',
    );
  }
});

test('RCU T4 — à égale hauteur, la plus à GAUCHE, c\'est-à-dire la plus petite colonne', () => {
  const x = basesAttaquantes(partieAvecBases(7, [A_NORD]))[0];
  const gauche = { rangee: x.rangee - 3, colonne: x.colonne - 4 };
  const droite = { rangee: x.rangee - 3, colonne: x.colonne + 4 };
  assert.equal(d2(gauche, x), d2(droite, x), 'le montage ne mesure rien : distances inégales');
  assert.equal(gauche.rangee, droite.rangee, 'le montage ne mesure rien : rangées différentes');

  for (const ordre of [[gauche, droite], [droite, gauche]]) {
    const etat = partieAvecBases(7, ordre);
    const paire = basesAttaquantes(etat).find((p) => caseDe(p) === caseDe(x));
    assert.notEqual(paire, undefined, 'l\'attaquante a disparu du montage');
    assert.deepEqual(
      { rangee: cibleDe(etat, paire).rangee, colonne: cibleDe(etat, paire).colonne }, gauche,
      'à égale hauteur, c\'est la plus à GAUCHE qui est frappée',
    );
  }
});

test('RCU T5 — le départage est TOTAL : cent montages, jamais d\'ex æquo', () => {
  // ⚠ LE TIRAGE VIENT DU PRNG DU DÉPÔT, PAS DE `Math.random` — un test qui ne se
  // rejoue pas à l'identique ne prouve rien le jour où il tombe.
  const rng = creerRng(20260907);
  let contestees = 0;
  for (let n = 0; n < 100; n += 1) {
    const nb = entier(rng, 2, 4); // deux à quatre bases
    const positions = [];
    for (let i = 0; i < nb; i += 1) {
      positions.push({ rangee: entier(rng, 190, 210), colonne: entier(rng, 6, 26) });
    }
    // Deux bases sur la même case rendraient le départage impossible, et ce
    // n'est pas un état que le jeu produit : on l'écarte du montage.
    if (new Set(positions.map(caseDe)).size !== nb) continue;

    const etat = partieAvecBases(7, positions);
    const paires = basesAttaquantes(etat); // LÈVE sur un ex æquo
    for (const p of paires) {
      // Le vainqueur se recalcule ICI, indépendamment, sur la clé annoncée.
      const candidates = etat.bases
        .map((b, i) => ({ i, pos: b.position, d: d2(b.position, p) }))
        .filter((c) => c.d <= GEOGRAPHIE.rayonAttaque ** 2);
      candidates.sort((a, b) => a.d - b.d || a.pos.rangee - b.pos.rangee
        || a.pos.colonne - b.pos.colonne);
      assert.equal(paires.filter((q) => caseDe(q) === caseDe(p)).length, 1);
      assert.equal(p.baseVisee, candidates[0].i,
        `(${caseDe(p)}) : le moteur et la règle recalculée ne désignent pas la même base`);
      // Le montage mesure-t-il quelque chose ? On compte les vraies disputes.
      if (candidates.length > 1) contestees += 1;
    }
  }
  assert.ok(contestees > 100,
    `le montage ne mesure rien : ${contestees} attaquantes contestées seulement`);
});

test('RCU T6 — l\'INDICE dans `etat.bases` ne départage rien', () => {
  // ⚠⚠ C'EST LE TEST QUI PROUVE QUE LA RÈGLE EST UNE RÈGLE. Un ordre de tableau
  // n'en est pas une : il change quand le joueur fonde ou perd une base, et la
  // cible d'un raid changerait avec lui, sans que rien ne l'annonce.
  const cibles = (positions) => {
    const etat = partieAvecBases(7, positions);
    const table = new Map();
    for (const p of basesAttaquantes(etat)) {
      table.set(caseDe(p), caseDe(cibleDe(etat, p)));
    }
    return table;
  };
  const dansUnSens = cibles([A_NORD, B_SUD]);
  const dansLAutre = cibles([B_SUD, A_NORD]);

  assert.ok(dansUnSens.size > 0, 'le montage ne mesure rien : aucune attaquante');
  assert.deepEqual([...dansUnSens.entries()].sort(), [...dansLAutre.entries()].sort(),
    'réordonner `etat.bases` a changé une cible : l\'indice départage encore');

  // Falsifiable : le montage doit VRAIMENT porter des attaquantes qui visent
  // chacune des deux bases, sinon l'égalité serait gratuite.
  const visees = new Set(dansUnSens.values());
  assert.equal(visees.size, 2, `le montage ne vise qu'une base sur deux : ${[...visees]}`);
});

test('RCU T7 — à UNE base, rien ne bouge : mêmes raids, aux mêmes minutes', () => {
  // ⚠⚠ C'EST LA NON-RÉGRESSION LA PLUS IMPORTANTE DU LOT. À une seule base il
  // n'y a rien à départager : le tirage ne change pas, et le compte non plus.
  // Les trois nombres ci-dessous ont été relevés sur l'arbre d'AVANT le lot, par
  // `git worktree`, et recopiés ici — pas produits par le code qu'ils gardent.
  const etat = partieAvecBases(7, [A_NORD]);
  const attaquantes = basesAttaquantes(etat);
  assert.equal(attaquantes.length, 58, 'le nombre d\'attaquantes a bougé à une seule base');

  const minutes = [];
  for (let m = 1; m <= 3 * 24 * 60; m += 1) {
    for (const a of attaquantes) {
      if (baseAttaqueALaMinute(etat.graine, a, m)) minutes.push(m);
    }
  }
  assert.equal(minutes.length, 157, 'le nombre de raids subis a bougé à une seule base');
  assert.equal(
    createHash('sha256').update(minutes.join(',')).digest('hex').slice(0, 16),
    '9da2b5139d0cefdb',
    'les MINUTES des raids ont bougé à une seule base',
  );

  // ⚠ ET LE SEUL EFFET MESURABLE À UNE BASE EST L'ORDRE DE LA LISTE, qui suit
  // désormais la case de l'attaquante — la plus haute d'abord, puis de gauche à
  // droite — au lieu de la distance. `resoudreLaMinute` la parcourt dans cet
  // ordre ; c'est une RÈGLE, là où l'ordre d'avant dépendait de la base qui
  // avait demandé le balayage.
  const parCase = [...attaquantes].sort((a, b) => a.rangee - b.rangee || a.colonne - b.colonne);
  assert.deepEqual(attaquantes.map(caseDe), parCase.map(caseDe));
});

test('RCU T8 — le lot limite PAR ATTAQUANTE, pas globalement', () => {
  const etat = partieAvecBases(7, [A_NORD, B_SUD]);
  const paires = basesAttaquantes(etat);
  assert.ok(paires.length > 1, 'une seule paire : le lot a limité globalement');

  // Toutes les bases de l'Ouvrage à portée d'AU MOINS une base du joueur, et de
  // niveau suffisant, doivent être là — le lot ne retire aucune attaquante.
  const attendues = new Set();
  for (const b of etat.bases) {
    for (const s of ciblesAPortee(etat, b)) {
      if (TYPES_SITE[s.type]?.attaqueLeJoueur !== true) continue;
      if (s.niveau < RAID_OUVRAGE.niveauMinimal) continue;
      attendues.add(caseDe(s));
    }
  }
  assert.deepEqual(new Set(paires.map(caseDe)), attendues,
    'le lot a perdu ou inventé une attaquante');
  assert.ok(attendues.size > 1, 'le montage ne mesure rien : une seule attaquante');
});

test('RCU T9 — le niveau minimal tient encore, à plusieurs bases', () => {
  // ⚠ NON-RÉGRESSION DE `RAID-B T6`, QUI N'EST PAS MODIFIÉ : lui mesure une base
  // seule, celui-ci mesure le chemin NEUF, celui du regroupement.
  assert.equal(RAID_OUVRAGE.niveauMinimal, 10);
  const etat = partieAvecBases(7, [{ rangee: 255, colonne: 16 }, { rangee: 258, colonne: 19 }]);
  const toutes = new Set();
  const sousLeSeuil = new Set();
  for (const b of etat.bases) {
    for (const s of ciblesAPortee(etat, b)) {
      if (TYPES_SITE[s.type]?.attaqueLeJoueur !== true) continue;
      toutes.add(caseDe(s));
      if (s.niveau < RAID_OUVRAGE.niveauMinimal) sousLeSeuil.add(caseDe(s));
    }
  }
  assert.ok(sousLeSeuil.size > 0, 'le montage ne mesure rien : aucune base sous le seuil');
  assert.ok(toutes.size > sousLeSeuil.size, 'le montage ne mesure rien : aucune au-dessus');

  const paires = basesAttaquantes(etat);
  assert.equal(paires.length, toutes.size - sousLeSeuil.size, 'le filtre de niveau ne mord plus');
  for (const p of paires) assert.ok(p.niveau >= RAID_OUVRAGE.niveauMinimal);
});

test('RCU T10 — camps et avant-postes n\'attaquent toujours pas', () => {
  const etat = partieAvecBases(7, [A_NORD, B_SUD]);
  // ⚠ LES SATELLITES DOIVENT AVOIR PARU, SINON LE FILTRE NE MESURE RIEN. Camp et
  // avant-poste sont les satellites d'une base, et ils n'apparaissent qu'au bout
  // de `TICKS_APPARITION` : sur une partie au premier tick, il n'y a aucun site
  // non attaquant à portée et l'assertion serait gratuite.
  rattraperJeu(etat, TICKS_APPARITION);
  // Le filtre est dans les DONNÉES, et le test le relit là.
  const paires = basesAttaquantes(etat);
  for (const p of paires) {
    assert.equal(TYPES_SITE[p.type].attaqueLeJoueur, true, `« ${p.type} » ne devrait pas attaquer`);
  }
  // Falsifiable : il DOIT y avoir des camps et des avant-postes à portée, sinon
  // le filtre ne mesure rien.
  const genres = new Set();
  for (const b of etat.bases) {
    for (const s of ciblesAPortee(etat, b)) genres.add(s.type);
  }
  for (const t of Object.keys(TYPES_SITE).filter((x) => !TYPES_SITE[x].attaqueLeJoueur)) {
    assert.ok(genres.has(t), `le montage ne mesure rien : aucun « ${t} » à portée`);
  }
});

test('RCU T11 — le coût n\'explose pas : UN appel à `ciblesAPortee` par base du joueur', () => {
  // ⚠⚠ INVERSER LES BOUCLES AURAIT PU MULTIPLIER LES APPELS, et chacun coûte 441
  // lectures de case. On garde donc le balayage par base du joueur — la distance
  // est symétrique — et on REGROUPE. Mesuré, pas supposé.
  //
  // ⚠ LE COMPTE SE PREND SUR L'APPELANT DIRECT. Chercher le nom dans la pile
  // ENTIÈRE compterait aussi les lectures faites plus bas par `siteDeLaCase`,
  // appelée 316 fois par balayage.
  //
  // ⚠⚠ ET IL A CHANGÉ DE SONDE AU LOT DÉPLACEMENT-ÉCLAIRÉ, 07/09 — IL SE
  // RESSERRE. Il proxyait la BASE et comptait les lectures de `.position` :
  // depuis que `basesAttaquantes` lit cette position elle-même pour la passer à
  // `attaquantesDeLaPosition`, `ciblesAPortee` reçoit un objet nu et la sonde ne
  // voyait plus rien — 0 au lieu de 1, mesuré. La sonde porte désormais sur la
  // POSITION, et elle compte les lectures de `rangee` faites DANS
  // `ciblesAPortee` : c'est sa ligne de déstructuration, une par appel, donc
  // elle mesure les ENTRÉES dans la fonction plutôt qu'une lecture que
  // n'importe quel appelant pouvait faire à sa place.
  const appels = (positions) => {
    const etat = partieAvecBases(7, positions);
    let n = 0;
    for (const b of etat.bases) {
      b.position = new Proxy(b.position, {
        get(cible, prop, recepteur) {
          if (prop === 'rangee') {
            const direct = new Error().stack.split(String.fromCharCode(10))[2] ?? '';
            if (direct.includes('ciblesAPortee')) n += 1;
          }
          return Reflect.get(cible, prop, recepteur);
        },
      });
    }
    basesAttaquantes(etat);
    return n;
  };
  assert.equal(appels([A_NORD]), 1);
  assert.equal(appels([A_NORD, B_SUD]), 2);
  assert.equal(appels([A_NORD, B_SUD, { rangee: 196, colonne: 13 }]), 3);

  // ⚠ ET LE SEUL APPEL DU FICHIER EST CELUI-LÀ. Un second, ajouté un jour dans
  // la boucle intérieure, ne se verrait pas dans le compte ci-dessus s'il
  // portait sur une base de l'Ouvrage.
  const source = readFileSync(join(RACINE, 'src', 'sim', 'raid-ouvrage.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  assert.equal(source.split('ciblesAPortee(').length - 1, 1,
    '`ciblesAPortee` est appelée plus d\'une fois dans raid-ouvrage.js');

  // ⚠⚠ ET LE MAILLON DE PLUS EST GARDÉ AUSSI — lot DÉPLACEMENT-ÉCLAIRÉ. Le seul
  // appel de `ciblesAPortee` vit maintenant dans `attaquantesDeLaPosition`, et
  // `basesAttaquantes` l'appelle une fois. Sans cette assertion, un second appel
  // glissé dans la boucle intérieure passerait par la même unique `ciblesAPortee`
  // et le compte ci-dessus doublerait sans qu'on sache où le chercher.
  assert.equal(source.split('attaquantesDeLaPosition(').length - 1, 3,
    'les appels d\'`attaquantesDeLaPosition` ne sont plus les trois attendus '
    + '(sa déclaration, `basesAttaquantes`, `nombreDAttaquantes`)');
});

test('RCU T12 — `SAVE_VERSION` ne bouge pas : rien n\'est ajouté à l\'état', () => {
  // Le lot ne fait que CHOISIR ; il n'écrit aucun champ. Le §6 du brief demande
  // de le vérifier plutôt que de l'affirmer.
  // ⚠⚠ LE NOMBRE A ÉTÉ CORRIGÉ PAR LE LOT CONQUÊTE-24H, EN LE SACHANT, et
  // c'est très exactement ce que la garde jumelle de `state.js` demandait :
  // « un lot qui bumpe légitimement `SAVE_VERSION` doit passer par cette ligne
  // et la corriger ». CONQUÊTE-24H y est passé — `basesRasees` porte désormais
  // trois champs de plus — et RAID-CIBLE-UNIQUE, lui, n'a toujours rien ajouté :
  // ce que ce test mesure est la ligne DEUX crans plus bas, où une sauvegarde à
  // la version courante traverse `migrer` sans être touchée.
  assert.equal(SAVE_VERSION, 30, 'le lot RAID-CIBLE-UNIQUE ne bumpe pas SAVE_VERSION — PAQUETS, lui, y est passé (09/09)');
  const etat = partieAvecBases(7, [A_NORD, B_SUD]);
  const json = serialiser(etat, 1_700_000_000_000);
  assert.deepEqual(migrer(JSON.parse(json)), JSON.parse(json),
    'une sauvegarde à la version courante a été réécrite par une migration');
  // Et aucune paire ne se range dans l'état : `basesAttaquantes` est un CALCUL.
  basesAttaquantes(etat);
  assert.equal(serialiser(etat, 1_700_000_000_000), json,
    '`basesAttaquantes` a écrit dans l\'état');
});
