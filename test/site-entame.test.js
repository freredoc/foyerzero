// L'état d'un site entamé — planchers, ce qui reste debout, ce qui repousse.
//
// Les trois régimes de `MODELE-REPARATION-1.md` §2 et §3 sont assertés ici, et
// l'objectif de calibrage d'Ethan — « un camp se rase en deux passes » — est
// joué pour de bon, avec un vrai combat, à la fin du fichier.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  TICKS_REPARATION_BASE, TICKS_REPARATION_DEFENSES, cleDuSite, plancheAUnPv, pvApresRaid,
  enregistrerLeRaid, etatDuSite, montageCourant, resumeCourant, reparerLesSites,
  problemesDesSitesEntames,
} from '../src/sim/site-entame.js';
import {
  creerEtat, tickJeu, rattraperJeu, serialiser, charger, migrer, SAVE_VERSION,
} from '../src/sim/state.js';
import { siteDeLaCase, montageDuSite } from '../src/sim/site-de-la-case.js';
import { creerCombat, construireResultat, resoudre, butin } from '../src/sim/combat.js';
import { genererAssaut } from '../src/sim/generateur.js';
import { APRES_RAID } from '../src/data/sites.js';

/** Une partie dont les trois satellites sont parus. */
function partie(graine = 2026) {
  const etat = creerEtat(graine);
  rattraperJeu(etat, 3001);
  return etat;
}

/** L'avant-poste de la graine 2026 — niveau 6, onze bâtiments, six défenses. */
function avantPoste(etat) {
  const id = siteDeLaCase(etat, 274, 11);
  assert.ok(id && id.type === 'avantPoste', 'montage : l\'avant-poste attendu n\'est pas là');
  return id;
}

/**
 * Un résultat de combat FABRIQUÉ : le site intact, puis les dégâts qu'on veut.
 * Il porte de vraies lignes — `pvMaxMilli` compris —, ce qu'aucun littéral écrit
 * à la main ne donnerait juste.
 */
function resultatSur(montage, degats = {}) {
  const r = construireResultat(creerCombat(montage));
  r.cause = degats.cause ?? 'attaquants';
  for (const [i, part] of Object.entries(degats.batiments ?? {})) abimer(r.batiments[i], part);
  for (const [i, part] of Object.entries(degats.defenses ?? {})) abimer(r.defenses[i], part);
  return r;
}

/**
 * `part` = fraction de PV RESTANTS ; 0 détruit la pièce.
 *
 * ⚠ ELLE MET À JOUR LES DEUX COMPTEURS DE PERTE, et l'oubli du second a fait
 * tomber un test à zéro sans rien dire : `pvPerdusIciMilli` est figé à la
 * construction du résultat, il ne se recalcule pas tout seul quand on abîme une
 * ligne après coup.
 */
function abimer(ligne, part) {
  ligne.pvMilli = Math.floor(ligne.pvMaxMilli * part);
  ligne.pvPerdusMilli = ligne.pvMaxMilli - ligne.pvMilli;
  ligne.pvPerdusIciMilli = ligne.pvInitialMilli - ligne.pvMilli;
  ligne.detruit = part === 0;
}

test('plancher — la base planche tout sauf la Souche, le camp ne planche rien', () => {
  // `MODELE-REPARATION-1.md` §2. Falsifiable : les trois réponses diffèrent,
  // donc une fonction qui rendrait toujours la même tomberait.
  assert.equal(plancheAUnPv('base', 'noeud'), true);
  assert.equal(plancheAUnPv('base', 'souche'), false, 'une Souche qui planche ne rase plus rien');
  assert.equal(plancheAUnPv('camp', 'noeud'), false);
  assert.equal(plancheAUnPv('avantPoste', 'souche'), false);
});

test('après-raid — trois valeurs de PV, et pas une de plus', () => {
  const ligne = (part) => ({ id: 'noeud', pvMaxMilli: 1_000_000, pvMilli: 1_000_000 * part, detruit: part === 0 });

  assert.equal(pvApresRaid('camp', ligne(1)), null, 'intacte doit se ranger « null »');
  assert.equal(pvApresRaid('camp', ligne(0.5)), 500_000, 'abîmée range ses PV restants');
  assert.equal(pvApresRaid('camp', ligne(0)), 0, 'dans un camp, détruite est détruite');
  // Sur une base, la même pièce détruite revient à 1 PV — elle n'est jamais
  // morte. C'est la ligne qui sépare le renouvelable du définitif.
  assert.equal(pvApresRaid('base', ligne(0)), APRES_RAID.plancherPvMilli);
  assert.equal(APRES_RAID.plancherPvMilli, 1000, '1 PV vaut 1 000 milli-PV');
  // Et la Souche d'une base ne planche pas : elle meurt, donc le site est rasé.
  assert.equal(pvApresRaid('base', { ...ligne(0), id: 'souche' }), 0);
});

test('enregistrer — une entrée qui ne dit rien n\'est pas rangée', () => {
  const etat = partie();
  const id = avantPoste(etat);
  const montage = montageDuSite(etat.graine, id);

  // Un raid qui n'a rien abîmé : rien à retenir.
  enregistrerLeRaid(etat, id, resultatSur(montage));
  assert.equal(etatDuSite(etat, id), null, 'un site intact a été rangé pour rien');

  // ⚠ FALSIFIABLE : le même appel avec UN bâtiment égratigné doit, lui, ranger.
  enregistrerLeRaid(etat, id, resultatSur(montage, { batiments: { 0: 0.5 } }));
  const entree = etatDuSite(etat, id);
  assert.ok(entree, 'un site abîmé n\'a pas été rangé');
  assert.equal(entree.pvBatimentsMilli.filter((v) => v !== null).length, 1);
  assert.equal(cleDuSite(entree), cleDuSite(id));
});

test('enregistrer — la Souche tombée rase, et le satellite est reprogrammé', () => {
  const etat = partie();
  const id = avantPoste(etat);
  const montage = montageDuSite(etat.graine, id);
  const avant = etat.satellites.presents.length;

  const verdict = enregistrerLeRaid(etat, id, resultatSur(montage, { cause: 'souche' }));
  assert.equal(verdict.rase, true);
  assert.equal(etat.satellites.presents.length, avant - 1, 'le satellite est resté sur la carte');
  assert.equal(etat.satellites.attentes.length, 1, 'le respawn n\'a pas été programmé');
  assert.equal(siteDeLaCase(etat, id.rangee, id.colonne), null, 'la case porte encore une cible');
  assert.equal(etatDuSite(etat, id), null, 'un site rasé garde une entrée de dégâts');
});

test('enregistrer — une base rasée ne revient pas, alors qu\'elle est dérivée', () => {
  // ⚠ C'EST LE SEUL FAIT QUE LA GRAINE NE PEUT PAS PORTER. Une base de l'Ouvrage
  // se recalcule à chaque appel : sans la liste des rasées, elle reparaîtrait à
  // l'instant même. `TYPES_SITE.base.respawn` vaut `false`.
  const etat = partie();
  const cible = { type: 'base', niveau: 30, saveur: null, instance: 0, rangee: 150, colonne: 16 };
  const montage = montageDuSite(etat.graine, cible);

  enregistrerLeRaid(etat, cible, resultatSur(montage, { cause: 'souche' }));
  assert.deepEqual(etat.basesRasees, ['150:16']);
  assert.equal(siteDeLaCase(etat, 150, 16), null, 'la base rasée est revenue');
});

test('montage — les détruites sont RETIRÉES, les abîmées montées à leurs PV', () => {
  const etat = partie();
  const id = avantPoste(etat);
  const intact = montageDuSite(etat.graine, id);

  enregistrerLeRaid(etat, id, resultatSur(intact, {
    batiments: { 1: 0.25 }, defenses: { 0: 0, 1: 0.5 },
  }));
  const courant = montageCourant(etat, id);

  assert.equal(courant.batiments.length, intact.batiments.length, 'aucun bâtiment n\'était détruit');
  assert.equal(courant.defenseurs.length, intact.defenseurs.length - 1, 'la détruite est restée');
  assert.equal(courant.batiments[1].pvMilli, Math.floor(
    construireResultat(creerCombat(intact)).batiments[1].pvMaxMilli * 0.25,
  ));
  // ⚠ LA VRAIE GARDE : le montage doit se MONTER. `creerCombat` refuse
  // `pvMilli === 0`, refuse un pvMilli au-dessus du maximum, et vérifie les
  // cases ; un montage entamé qui ne passerait pas serait invisible autrement.
  const combat = creerCombat(courant);
  assert.ok(combat.entites.length > 0);
});

test('résumé — un site entamé annonce ce qu\'il est devenu', () => {
  const etat = partie();
  const id = avantPoste(etat);
  const avant = resumeCourant(etat, id);
  const intact = montageDuSite(etat.graine, id);

  // Trois défenses sur six tombent : la force annoncée doit chuter.
  enregistrerLeRaid(etat, id, resultatSur(intact, { defenses: { 0: 0, 1: 0, 2: 0 } }));
  const apres = resumeCourant(etat, id);

  assert.equal(apres.defenseurs, avant.defenseurs - 3);
  assert.ok(apres.forceDeLaDefense < avant.forceDeLaDefense, 'la force n\'a pas bougé');
  assert.equal(apres.batiments, avant.batiments, 'aucun bâtiment ne devait tomber');
});

test('réparation — une base revient ENTIÈREMENT au bout d\'une heure, pas avant', () => {
  const etat = partie();
  const cible = { type: 'base', niveau: 30, saveur: null, instance: 0, rangee: 150, colonne: 16 };
  const montage = montageDuSite(etat.graine, cible);
  enregistrerLeRaid(etat, cible, resultatSur(montage, { batiments: { 2: 0.1 }, defenses: { 0: 0 } }));
  assert.ok(etatDuSite(etat, cible), 'montage sans mordant : rien n\'a été rangé');

  // Un tick avant l'heure : rien n'a bougé.
  rattraperJeu(etat, TICKS_REPARATION_BASE - 1);
  assert.ok(etatDuSite(etat, cible), 'la base s\'est réparée avant l\'heure');

  rattraperJeu(etat, 1);
  assert.equal(etatDuSite(etat, cible), null, 'la base ne s\'est pas réparée à l\'heure');
  // Et tout est revenu, y compris la défense « détruite » — elle planchait.
  assert.deepEqual(montageCourant(etat, cible), montage);
});

test('réparation — un camp ne répare que ses défenses SURVIVANTES', () => {
  const etat = partie();
  const id = avantPoste(etat);
  const intact = montageDuSite(etat.graine, id);
  enregistrerLeRaid(etat, id, resultatSur(intact, {
    batiments: { 3: 0.5 }, defenses: { 0: 0, 1: 0.2 },
  }));

  rattraperJeu(etat, TICKS_REPARATION_DEFENSES);
  const entree = etatDuSite(etat, id);
  assert.ok(entree, 'l\'entrée a disparu : les bâtiments abîmés ont été oubliés');
  assert.equal(entree.pvDefensesMilli[1], null, 'la défense survivante n\'a pas été réparée');
  assert.equal(entree.pvDefensesMilli[0], 0, 'une défense détruite est revenue d\'entre les morts');
  // ⚠ ET LES BÂTIMENTS NE SE RÉPARENT JAMAIS DANS UN CAMP. Cent heures plus
  // tard, l'égratignure est toujours là.
  rattraperJeu(etat, TICKS_REPARATION_DEFENSES * 100);
  assert.notEqual(etatDuSite(etat, id).pvBatimentsMilli[3], null, 'le bâtiment s\'est réparé');
});

test('réparation — l\'Étai tombé, les défenses ne repoussent JAMAIS', () => {
  // ⚠ MONTAGE FALSIFIABLE, ET C'EST LE CŒUR DE L'ARBITRAGE DE CALIBRAGE : le
  // même raid, à ceci près que l'Étai tombe. Sans lui, la défense survivante
  // doit rester abîmée pour toujours — c'est ce qui rend la seconde passe peu
  // coûteuse.
  const etat = partie();
  const id = avantPoste(etat);
  const intact = montageDuSite(etat.graine, id);
  const indexEtai = intact.batiments.findIndex((b) => b.id === 'etai');
  assert.ok(indexEtai >= 0, 'montage : pas d\'Étai dans ce site');

  enregistrerLeRaid(etat, id, resultatSur(intact, {
    batiments: { [indexEtai]: 0 }, defenses: { 1: 0.2 },
  }));
  rattraperJeu(etat, TICKS_REPARATION_DEFENSES * 50);

  const entree = etatDuSite(etat, id);
  assert.ok(entree, 'l\'entrée a disparu alors que l\'Étai est tombé');
  assert.notEqual(entree.pvDefensesMilli[1], null, 'les défenses ont repoussé sans Étai');
  assert.equal(entree.pvBatimentsMilli[indexEtai], 0);
});

test('réparation — les deux chemins d\'avancement réparent pareil', () => {
  // ⚠ MÊME GARDE QUE POUR LES SATELLITES ET LES POINTS D'ATTAQUE : le
  // rattrapage hors ligne ne doit pas rendre autre chose que la boucle. Le
  // montage traverse l'échéance de réparation, sinon il ne mesurerait rien.
  const montages = [];
  for (const parBoucle of [true, false]) {
    const etat = partie();
    const id = avantPoste(etat);
    const intact = montageDuSite(etat.graine, id);
    enregistrerLeRaid(etat, id, resultatSur(intact, { defenses: { 0: 0, 2: 0.4 } }));
    const n = TICKS_REPARATION_DEFENSES + 500;
    if (parBoucle) for (let i = 0; i < n; i += 1) tickJeu(etat);
    else rattraperJeu(etat, n);
    montages.push(etat.sitesEntames);
  }
  assert.deepEqual(montages[0], montages[1], 'boucle et rattrapage divergent');
  assert.ok(Object.keys(montages[0]).length > 0, 'montage sans mordant : plus rien à comparer');
});

test('état — les sites entamés traversent la sauvegarde, et la v10 se migre', () => {
  assert.equal(SAVE_VERSION, 11, 'le bump de la version des sauvegardes a été oublié');

  const etat = partie();
  const id = avantPoste(etat);
  enregistrerLeRaid(etat, id, resultatSur(montageDuSite(etat.graine, id), { defenses: { 0: 0 } }));
  etat.basesRasees.push('150:16');
  const attendu = structuredClone(etat.sitesEntames);

  const recharge = charger(serialiser(etat, 2_000_000), 2_000_000);
  assert.deepEqual(recharge.sitesEntames, attendu, 'les dégâts n\'ont pas survécu au tour');
  assert.deepEqual(recharge.basesRasees, ['150:16']);

  // Une v10 n'a jamais rien entamé : deux tables vides, et rien de converti.
  const migre = migrer({ version: 10 });
  assert.equal(migre.version, 11);
  assert.deepEqual(migre.sitesEntames, {});
  assert.deepEqual(migre.basesRasees, []);
});

test('état — une table de sites illisible fait lever au chargement', () => {
  assert.deepEqual(problemesDesSitesEntames({}), []);
  assert.equal(problemesDesSitesEntames([]).length, 1, 'une liste n\'est pas une table');
  assert.ok(problemesDesSitesEntames({ 'a:b:c': { type: 'chateau' } }).length > 0);
  assert.ok(problemesDesSitesEntames({
    '1:2:3': { type: 'camp', rangee: 9, colonne: 9, instance: 9, tickDuRaid: 0, pvBatimentsMilli: [], pvDefensesMilli: [] },
  }).length > 0, 'une entrée rangée sous la mauvaise clé passe');
  assert.ok(problemesDesSitesEntames({
    '1:2:3': { type: 'camp', rangee: 1, colonne: 2, instance: 3, tickDuRaid: 0, pvBatimentsMilli: [-5], pvDefensesMilli: [] },
  }).length > 0, 'des PV négatifs passent');
});

test('deux passes — le site s\'use pour de bon, et le butin ne se paie pas deux fois', () => {
  // ⚠ CE TEST JOUE DE VRAIS COMBATS, et c'est le seul du fichier. Tout le reste
  // fabrique ses dégâts ; ici, c'est le moteur qui les fait, sur le montage que
  // ce module lui rend. C'est la seule manière de savoir que le montage entamé
  // est jouable, pas seulement bien formé.
  const etat = partie();
  const id = avantPoste(etat);

  const passe = (graineAssaut, niveau) => {
    const montage = montageCourant(etat, id);
    const assaut = genererAssaut({ niveau, profil: 'mixte', graine: graineAssaut });
    const r = resoudre(creerCombat({ ...montage, vagues: assaut.vagues }), { maxTicks: 20_000 });
    const gagne = butin(r, montage);
    enregistrerLeRaid(etat, id, r);
    return { r, gagne, montage };
  };

  const avant = resumeCourant(etat, id);
  const un = passe(1, 8);
  const apres = resumeCourant(etat, id);

  // La première passe a mordu : il reste moins de défense qu'avant.
  assert.ok(apres.forceDeLaDefense < avant.forceDeLaDefense,
    `force ${apres.forceDeLaDefense} contre ${avant.forceDeLaDefense}`);
  assert.ok(un.gagne.quartz > 0, 'la première passe n\'a rien rapporté');

  // ⚠ ET LA SECONDE PASSE PART DE CE QUI RESTE : son montage porte strictement
  // moins de défenseurs que la première. C'est ce qui rend « deux passes »
  // possible, et un code qui régénérerait le site intact le ferait tomber.
  const deux = passe(2, 30);
  assert.ok(deux.montage.defenseurs.length < un.montage.defenseurs.length,
    'la seconde passe a retrouvé la garnison de la première');
});

test('butin — une pièce entamée ne repaie pas ce qu\'elle a déjà payé', () => {
  // ⚠ MONTAGE FALSIFIABLE ET SANS COMBAT : on fabrique les deux passes à la
  // main pour que la mesure soit exacte, pas approchée. Passe 1, tous les
  // bâtiments tombent à la moitié de leurs PV. Passe 2, ce qui reste est rasé.
  // Chaque passe doit rendre LA MOITIÉ de la valeur du site, et les deux
  // ensemble exactement sa valeur.
  const etat = partie();
  const id = avantPoste(etat);
  const intact = montageDuSite(etat.graine, id);
  const valeur = butin(resultatSur(intact, { cause: 'souche' }), intact);

  const moitie = {};
  for (let i = 0; i < intact.batiments.length; i += 1) moitie[i] = 0.5;
  const un = butin(resultatSur(intact, { batiments: moitie }), intact);
  enregistrerLeRaid(etat, id, resultatSur(intact, { batiments: moitie }));

  const reste = montageCourant(etat, id);
  const deux = butin(resultatSur(reste, { cause: 'souche' }), reste);

  for (const r of ['quartz', 'scorie']) {
    assert.ok(Math.abs(un[r] - valeur[r] / 2) <= 1, `${r} : première passe ${un[r]} sur ${valeur[r]}`);
    assert.ok(Math.abs(deux[r] - valeur[r] / 2) <= 1, `${r} : seconde passe ${deux[r]} sur ${valeur[r]}`);
    assert.ok(un[r] + deux[r] <= valeur[r], `${r} : ${un[r]} + ${deux[r]} dépasse ${valeur[r]}`);
  }
  // Falsifiable : le site doit valoir quelque chose, sinon tout ça vaut 0 = 0.
  assert.ok(valeur.quartz > 1000);
});

test('butin — un site rasé en deux passes rend EXACTEMENT ce qu\'il vaut', () => {
  // ⚠ CE TEST A ÉTÉ ÉCRIT À L'ENVERS, ET C'ÉTAIT VOULU. Il mesurait une fuite :
  // « livre tout » payait le plein nominal au rasage, si bien qu'un bâtiment
  // cassé à moitié à la première passe repayait son plein à la seconde — 16 % de
  // trop sur ce site-ci, et d'autant plus qu'on cassait avant le coup de grâce.
  // Ethan a tranché le 29/08 : « ce qui reste à livrer ». Le témoin est donc
  // devenu une garde, et c'est le même montage qui sert aux deux.
  const etat = partie();
  const id = avantPoste(etat);
  const plafond = resumeCourant(etat, id).butinSiToutTombe;
  let total = 0;

  for (const [graineAssaut, niveau] of [[1, 8], [2, 30]]) {
    const montage = montageCourant(etat, id);
    const r = resoudre(
      creerCombat({ ...montage, vagues: genererAssaut({ niveau, profil: 'mixte', graine: graineAssaut }).vagues }),
      { maxTicks: 20_000 },
    );
    const gagne = butin(r, montage);
    total += gagne.quartz + gagne.scorie;
    enregistrerLeRaid(etat, id, r);
  }

  const valeur = plafond.quartz + plafond.scorie;
  // ⚠ L'ÉGALITÉ EST À L'ARRONDI PRÈS, ET PAS À MIEUX. Chaque passe arrondit son
  // butin au plancher, une fois par ressource : deux passes peuvent donc perdre
  // jusqu'à quatre unités en route. Ce qui est asserté, c'est qu'on ne dépasse
  // JAMAIS la valeur du site — la fuite — et qu'on n'en perd pas non plus la
  // moitié en chemin.
  assert.ok(total <= valeur, `${total} encaissé pour un site qui en vaut ${valeur}`);
  assert.ok(total > valeur - 8, `${total} encaissé sur ${valeur} : trop perdu en route`);
  assert.ok(total > valeur * 0.9, 'montage sans mordant : le site n\'a pas été rasé');
});
