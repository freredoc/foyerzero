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

import {
  creerEtat, tickJeu, rattraperJeu, serialiser, migrer, SAVE_VERSION, poser,
} from '../src/sim/state.js';
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
  etat.position.rangee = rangee;
  etat.disposition[0].niveau = niveau;

  const pris = new Set(etat.obstacles.cases.map((o) => `${o.rangee}:${o.colonne}`));
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
  for (const bat of etat.disposition) bat.niveau = niveau;

  if (garnison) {
    const d = GRILLE.bandes.defense;
    let i = 0;
    for (let r = d.premiere; r <= d.derniere; r += 1) {
      for (let c = 1; c <= GRILLE.largeur; c += 1) {
        if (pris.has(`${r}:${c}`)) continue;
        etat.garnison.push({
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
    const ticks = 6 * TICKS_PAR_HEURE;

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
    JSON.stringify(dansLOrdre.disposition) + JSON.stringify(dansLOrdre.garnison),
    JSON.stringify(aLEnvers.disposition) + JSON.stringify(aLEnvers.garnison),
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
  for (const piece of arme.garnison) piece.id = 'faucheuse';
  for (const piece of etat.garnison) piece.id = 'faucheuse';
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
  etat.disposition[1].degatsMilli = 1_000_000;
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
    etat.disposition.map((b) => `${b.id}@${b.rangee},${b.colonne},${b.niveau}`),
  );
  assert.deepEqual(
    montage.defenseurs.map((d) => `${d.id}@${d.rangee},${d.colonne}`),
    etat.garnison.map((d) => `${d.id}@${d.rangee},${d.colonne}`),
  );

  // Et les PV entamés voyagent : la pièce abîmée porte `pvMilli`, les autres non.
  assert.equal(montage.batiments[1].pvMilli !== undefined, true,
    'les dégâts de la base n\'atteignent pas le montage');
  assert.equal(montage.batiments[0].pvMilli, undefined,
    'un bâtiment intact ne doit pas porter de forçage de PV');

  assert.equal(montage.proprietaireDefense, 'joueur');
  assert.equal(montage.proprietaireAttaque, 'ouvrage');
  assert.equal(montage.obstacles, etat.obstacles.cases);
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
  etat.position.rangee = 255;
  const toutes = ciblesAPortee(etat, etat).filter((s) => TYPES_SITE[s.type].attaqueLeJoueur);
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
  const DEPART = { rangee: 255, colonne: 13 };
  const etat = baseALaRangee(7, 200, { niveau: 1, garnison: false });
  etat.position = { ...DEPART };
  assert.deepEqual(etat.poisAcquis, [], 'le montage ne mesure rien : un POI est déjà acquis');
  assert.equal(poisAutourDe(etat, DEPART).length, 0,
    'le montage ne mesure rien : un POI est déjà sous la base AVANT le rasage');
  const arrivee = {
    rangee: DEPART.rangee + RAID_OUVRAGE.sanctionRasage.redeploiementCases,
    colonne: DEPART.colonne,
  };
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
  const chantier = etat.disposition.find((b) => BASE_BATIMENTS[b.id].raseLeSite === true);
  const pvMax = BASE_BATIMENTS[chantier.id].pv * 1000;
  assert.equal(chantier.degatsMilli, pvMax,
    'le Chantier a gardé un plancher de PV : la base ne serait plus vraiment rasée');
  // Les autres, eux, planchent : ils sont à réparer, pas perdus.
  for (const b of etat.disposition) {
    if (BASE_BATIMENTS[b.id].plancherPv === false) continue;
    const max = BASE_BATIMENTS[b.id].pv * 1000;
    assert.ok(b.degatsMilli <= max - APRES_RAID.plancherPvMilli,
      `« ${b.id} » est tombé sous son plancher de PV`);
  }

  assert.deepEqual(etat.position, arrivee, 'le redéploiement ne fait pas les vingt cases');
  assert.equal(rapport.sanction.cases, RAID_OUVRAGE.sanctionRasage.redeploiementCases);
  assert.deepEqual(etat.economie.ressources, { quartz: 0, scorie: 0, electricite: 0 });
  assert.ok(rapport.sanction.perdu.quartz > 0, 'les stocks perdus ne sont pas rapportés');

  // ⚠ LE TERRAIN NE SUIT PAS : `fondation` ne bouge pas, donc ni les champs ni
  // les obstacles. C'est l'arbitrage du 27/08, et le rasage ne le contredit pas.
  assert.deepEqual(etat.fondation, creerEtat(7).fondation);

  // ⚠ ET LE RELEVÉ DES POI EST REFAIT. La falsification est d'omettre le rappel :
  // `poisAcquis` reste alors VIDE, alors que la base est désormais posée sur un
  // gisement.
  assert.deepEqual(
    [...etat.poisAcquis].sort(comparerPoi),
    [...attendus].sort(comparerPoi),
    'le relevé des POI n\'a pas suivi le déménagement',
  );
});

/** Les POI que le territoire d'une base couvre — rayon 2, la règle de la spec. */
function poisAutourDe(etat, position) {
  const trouves = [];
  for (const poi of carteDesPoi(etat.graine).liste) {
    const d = Math.max(
      Math.abs(poi.rangee - position.rangee), Math.abs(poi.colonne - position.colonne),
    );
    if (d <= 2) trouves.push({ type: poi.type, bande: poi.bande });
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
    etat.position.rangee = rangee;
    const rapport = subirUnRaid(etat, ATTAQUANTE, 5);
    assert.equal(rapport.rase, true, `rangée ${rangee} : le montage ne mesure rien`);
    assert.ok(etat.position.rangee <= hauteur,
      `rangée ${rangee} : la base est sortie de la carte, en ${etat.position.rangee}`);
    assert.equal(estSurLaCarte(etat.position.rangee, etat.position.colonne), true);
    // À la borne, la base descend d'autant qu'elle peut — jamais moins, jamais plus.
    const voulue = rangee + RAID_OUVRAGE.sanctionRasage.redeploiementCases;
    assert.equal(etat.position.rangee, Math.min(voulue, hauteur));
  }
});

// ---------------------------------------------------------------------------
// T9 — la réserve de réparation
// ---------------------------------------------------------------------------

test('RAID-B T9 — un raid qui passe vide la réserve de réparation', () => {
  const etat = baseALaRangee(7, 200, { niveau: 1, garnison: false });
  // ⚠ ON MESURE D'ABORD QU'IL Y A QUELQUE CHOSE À VIDER. Une réserve déjà nulle
  // rendrait ce test vert sur du code qui ne la touche pas.
  for (const chassis of Object.keys(etat.reserveReparation)) {
    etat.reserveReparation[chassis] = 12_345;
  }
  const base = basesAttaquantes(etat)[0];
  const rapport = subirUnRaid(etat, base, 5);
  assert.equal(rapport.reserveVidee, true, 'le montage ne mesure rien : le raid n\'a rien cassé');
  assert.deepEqual(etat.reserveReparation, { escouade: 0, blinde: 0, aeronef: 0 });
});

test('RAID-B T9 bis — un raid ENTIÈREMENT repoussé ne vide rien', () => {
  // ⚠ « UN RAID QUI PASSE » VEUT DIRE « QUI A FAIT DES DÉGÂTS ». Punir une
  // défense qui a fait son travail serait le contraire de ce que la phrase de
  // `MODELE-ECONOMIQUE.md` §7 décrit.
  const etat = baseALaRangee(7, 200, { niveau: 50 });
  for (const chassis of Object.keys(etat.reserveReparation)) {
    etat.reserveReparation[chassis] = 12_345;
  }
  const rapport = subirUnRaid(etat, { ...ATTAQUANTE, niveau: 10 }, 5);
  if (rapport.reserveVidee === false) {
    assert.deepEqual(etat.reserveReparation, { escouade: 12_345, blinde: 12_345, aeronef: 12_345 });
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

  const abimees = etat.garnison.filter((p) => p.degatsMilli > 0);
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

test('RAID-B T12 — SAVE_VERSION passe à 20 et la migration pose des dégâts nuls', () => {
  assert.equal(SAVE_VERSION, 20, 'le bump de la version des sauvegardes a été oublié');

  // Une v19 forgée SANS le champ — c'est ainsi qu'elles étaient toutes.
  const v19 = JSON.parse(serialiser(creerEtat(7), 0));
  v19.version = 19;
  for (const b of v19.disposition) delete b.degatsMilli;
  assert.equal('degatsMilli' in v19.disposition[0], false,
    'le montage ne mesure rien : la v19 porte déjà le champ');

  const migre = migrer(structuredClone(v19));
  assert.equal(migre.version, 20);
  for (const b of migre.disposition) assert.equal(b.degatsMilli, 0);

  // Une v19 qui portait déjà un chiffre — impossible en jeu, mais la migration
  // ne doit pas l'écraser : elle AJOUTE, elle ne refonde pas.
  const avecChiffre = structuredClone(v19);
  avecChiffre.disposition[0].degatsMilli = 42;
  assert.equal(migrer(avecChiffre).disposition[0].degatsMilli, 42);
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
  const roche = etat.obstacles.cases.find((o) => o.rangee >= GRILLE.bandes.defense.premiere
    && o.rangee <= GRILLE.bandes.defense.derniere);
  assert.ok(roche !== undefined, 'le montage ne mesure rien : aucun obstacle en bande de défense');
  etat.garnison.push({
    id: 'merlon', rangee: roche.rangee, colonne: roche.colonne, niveau: 10, degatsMilli: 0,
  });
  const nb = etat.garnison.length;
  const base = basesAttaquantes(etat)[0];
  assert.doesNotThrow(() => subirUnRaid(etat, base, 5));
  // Elle n'est PAS retirée : elle n'a simplement pas combattu.
  assert.equal(etat.garnison.length, nb);
  assert.equal(etat.garnison[nb - 1].degatsMilli, 0);
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
