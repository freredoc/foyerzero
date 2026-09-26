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
  problemesDesSitesEntames, ticksDeRegeneration,
} from '../src/sim/site-entame.js';
import {
  pvApresRetour, pvMaxDeLaPieceDeGarnisonMilli, pvSousUneSanteQuiRemonte,
} from '../src/sim/reparation.js';
import { RETOUR_DEFENSES } from '../src/data/base.js';
import { TICKS_PAR_HEURE } from '../src/sim/clock.js';
import {
  creerEtat, tickJeu, rattraperJeu, serialiser, charger, migrer, SAVE_VERSION,
} from '../src/sim/state.js';
import { siteDeLaCase, montageDuSite } from '../src/sim/site-de-la-case.js';
import {
  creerCombat, construireResultat, resoudre, butin, pointsRecherche,
} from '../src/sim/combat.js';
import { genererAssaut } from '../src/sim/generateur.js';
import { APRES_RAID } from '../src/data/sites.js';
import { baseCourante } from '../src/sim/base-courante.js';
import { caseRasee } from '../src/sim/ruines.js';
import { JOUEUR } from '../src/sim/territoire.js';

/** Une partie dont les trois satellites sont parus. */
function partie(graine = 2026) {
  const etat = creerEtat(graine);
  rattraperJeu(etat, 3001);
  return etat;
}

/**
 * L'avant-poste que la partie a fait paraître.
 *
 * ⚠⚠ SA CASE SE DEMANDE À L'ÉTAT, ELLE NE S'ÉCRIT PLUS. Ce montage portait
 * `siteDeLaCase(etat, 274, 11)` en dur — une case déduite de l'ancienne position
 * de départ. Le 31/08, Ethan a rapproché le départ du bord bas (rangée
 * 275 → 295) : les anneaux ont suivi, la case s'est vidée, et QUATORZE tests de
 * ce fichier sont tombés d'un coup sur un montage qui ne mesurait pas la
 * position. Les satellites savent où ils sont ; on le leur demande.
 */
function avantPoste(etat) {
  const present = baseCourante(etat).satellites.presents.find((s) => s.type === 'avantPoste');
  assert.ok(present, 'montage : aucun avant-poste n\'est paru');
  const id = siteDeLaCase(etat, present.rangee, present.colonne);
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
  const avant = baseCourante(etat).satellites.presents.length;

  const verdict = enregistrerLeRaid(etat, id, resultatSur(montage, { cause: 'souche' }));
  assert.equal(verdict.rase, true);
  assert.equal(baseCourante(etat).satellites.presents.length, avant - 1, 'le satellite est resté sur la carte');
  assert.equal(baseCourante(etat).satellites.attentes.length, 1, 'le respawn n\'a pas été programmé');
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
  // ⚠⚠ L'ENTRÉE PORTE TROIS CHAMPS DE PLUS DEPUIS LE LOT CONQUÊTE-24H : le
  // vainqueur, le niveau de ce qui est tombé, et le tick du rasement. Le fait
  // que ce test garde — « la case ne rend plus rien » — n'a pas bougé d'un cran ;
  // ce qui a changé est que la même liste sert aussi à savoir qui tient le
  // terrain pendant vingt-quatre heures.
  assert.deepEqual(etat.basesRasees, [{
    rangee: 150,
    colonne: 16,
    type: 'base',
    vainqueur: JOUEUR,
    niveau: 30,
    tick: etat.horloge.nbTicks,
  }]);
  assert.equal(siteDeLaCase(etat, 150, 16), null, 'la base rasée est revenue');
});

test('montage — les détruites sont RETIRÉES, les abîmées montées à leurs PV', () => {
  const etat = partie();
  const id = avantPoste(etat);
  const intact = montageDuSite(etat.graine, id);

  // ⚠⚠ L'ÉTAI TOMBE, ET C'EST CE QUI FAIT QUE LA DÉTRUITE RESTE DÉTRUITE.
  // Depuis le lot RETOUR-DÉFENSES, une défense à zéro se relève à 70 % à la fin
  // du raid — donc `appliquer` ne la retirerait plus, et ce test cesserait de
  // mesurer ce qu'il annonce. La PRÉMISSE a changé, pas la propriété : avec
  // l'Étai à terre, rien ne revient jamais, et le retrait redevient observable.
  const indexEtai = intact.batiments.findIndex((b) => b.id === 'etai');
  assert.ok(indexEtai >= 0, 'montage : pas d\'Étai dans ce site');
  // ⚠ ET LE BÂTIMENT ABÎMÉ N'EST PAS L'ÉTAI : deux clés identiques dans le même
  // littéral s'écraseraient, et le test se falsifierait tout seul.
  const indexAbime = intact.batiments.findIndex((b, i) => i !== indexEtai);
  assert.ok(indexAbime >= 0, 'montage : un seul bâtiment dans ce site');

  enregistrerLeRaid(etat, id, resultatSur(intact, {
    batiments: { [indexAbime]: 0.25, [indexEtai]: 0 }, defenses: { 0: 0, 1: 0.5 },
  }));
  const courant = montageCourant(etat, id);

  assert.equal(courant.batiments.length, intact.batiments.length - 1, 'l\'Étai détruit est resté');
  assert.equal(courant.defenseurs.length, intact.defenseurs.length - 1, 'la détruite est restée');
  // ⚠ L'ABÎMÉ SE RETROUVE PAR SA CASE, PAS PAR SON RANG : l'Étai retiré, les
  // indices du montage courant ont glissé.
  const vu = courant.batiments.find(
    (b) => b.rangee === intact.batiments[indexAbime].rangee
      && b.colonne === intact.batiments[indexAbime].colonne,
  );
  assert.ok(vu, 'le bâtiment abîmé a disparu du montage');
  assert.equal(vu.pvMilli, Math.floor(
    construireResultat(creerCombat(intact)).batiments[indexAbime].pvMaxMilli * 0.25,
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

  // Trois défenses sur six tombent, ET L'ÉTAI AVEC : la force annoncée doit
  // chuter. ⚠ Sans l'Étai à terre, la règle du 05/09 relève les trois à 70 % à
  // la fin du raid et le résumé ne bouge plus — la prémisse a changé, la
  // propriété mesurée est la même.
  const indexEtai = intact.batiments.findIndex((b) => b.id === 'etai');
  assert.ok(indexEtai >= 0, 'montage : pas d\'Étai dans ce site');
  enregistrerLeRaid(etat, id, resultatSur(intact, {
    batiments: { [indexEtai]: 0 }, defenses: { 0: 0, 1: 0, 2: 0 },
  }));
  const apres = resumeCourant(etat, id);

  assert.equal(apres.defenseurs, avant.defenseurs - 3);
  assert.ok(apres.forceDeLaDefense < avant.forceDeLaDefense, 'la force n\'a pas bougé');
  assert.equal(apres.batiments, avant.batiments - 1, 'seul l\'Étai devait tomber');
});

test('réparation — une base revient ENTIÈREMENT au bout d\'une heure, pas avant', () => {
  const etat = partie();
  const cible = { type: 'base', niveau: 30, saveur: null, instance: 0, rangee: 150, colonne: 16 };
  const montage = montageDuSite(etat.graine, cible);
  enregistrerLeRaid(etat, cible, resultatSur(montage, { batiments: { 2: 0.1 }, defenses: { 0: 0 } }));
  assert.ok(etatDuSite(etat, cible), 'montage sans mordant : rien n\'a été rangé');

  // Un tick avant l'heure, l'entrée tient encore. ⚠ « RIEN N'A BOUGÉ » ÉTAIT
  // ÉCRIT ICI, ET C'EST FAUX DEPUIS LE LOT ÉTAI-RÉTABLI : les bâtiments d'une
  // base MONTENT pendant l'heure au lieu de sauter à son terme, et la défense
  // détruite a déjà reçu son palier. Ce qui n'a pas eu lieu, c'est la PURGE.
  rattraperJeu(etat, TICKS_REPARATION_BASE - 1);
  assert.ok(etatDuSite(etat, cible), 'la base s\'est réparée avant l\'heure');

  rattraperJeu(etat, 1);
  assert.equal(etatDuSite(etat, cible), null, 'la base ne s\'est pas réparée à l\'heure');
  // Et tout est revenu, y compris la défense « détruite » — elle planchait.
  assert.deepEqual(montageCourant(etat, cible), montage);
});

// ⚠⚠ DEUX TESTS ONT ÉTÉ RETIRÉS ICI, PAS AJUSTÉS — lot RETOUR-DÉFENSES, 06/09.
// « réparation — un camp ne répare que ses défenses SURVIVANTES » et
// « réparation — l'Étai tombé, les défenses ne repoussent JAMAIS » figeaient la
// règle d'AVANT : seules les survivantes revenaient, en une heure sèche. La
// règle arbitrée le 05/09 rend 70 % d'un coup à CHAQUE pièce, détruite comprise,
// puis le reste en rampe. Ce qu'ils gardaient de vrai est repris par
// `RETOUR-D T14` (Étai tombé : jamais) et `RETOUR-D T15` (les bâtiments d'un
// camp ne reviennent jamais), ci-dessous.

test('RETOUR-D T13 — sur une BASE de l\'Ouvrage aussi, l\'Étai commande les défenses', () => {
  // ⚠⚠ RÉÉCRIT PAR LE LOT ÉTAI-RÉTABLI, 25/09 — et il tourne sur TROIS types. Ethan :
  // « j'ai rasé un étai lors d'un raid puis AFK. Il est revenu à 100 %, mais les
  // défenses détruites ne se sont pas régénérées. » Ce test figeait exactement
  // cela : l'Étai à 1 PV valait zéro millième, la rampe des défenses planchait sa
  // division à un millième, et le site ne redevenait entier qu'au bout de MILLE
  // heures. La règle d'Ethan : « l'étai se restaure en 1 h, et donc sa puissance
  // de récupération » — et « il ne récupère pas 100 % d'un coup ».
  //
  // ⚠ CE QU'IL MESURE, AU MILLI-PV PRÈS : l'Étai remonte en ligne droite pendant
  // l'heure ; les défenses le suivent, si bien qu'une pièce rasée a reçu la
  // MOITIÉ de ses PV à l'heure et TOUT à une heure et demie. Les trois bornes
  // sont des égalités : une lecture « à peu près » laisserait passer une vitesse
  // restée sur la santé figée du raid.
  //
  // ⚠ ET UN VERROU EST UNE BASE — `baseVerrou` porte la même heure que `base` dans
  // `TYPES_SITE`. Le code écrivait `=== 'base'` : son Étai ne planchait pas, donc
  // il tombait à zéro, et plus rien ne revenait jamais.
  //
  // ⚠⚠ ET IL PORTE LES DEUX RÉPONSES DE LA RELECTURE HOSTILE DU BRIEF, OBTENUES EN
  // LANÇANT LA SUITE ET NON EN LISANT LE CODE. « La forme neuve de la rampe
  // peut-elle s'appliquer à un Étai intact ? » et « un produit de l'intégrale
  // passe-t-il quelque part hors de `BigInt` ? » — les deux falsifications ont
  // d'abord été jouées sur la version précédente de ce test, et la suite est restée
  // VERTE sur les deux : 1 667 pass, le seul rouge étant le compte de tests de
  // `CLAUDE.md`. Ce test ne répondait donc à aucune des deux questions. Il y répond
  // maintenant par deux morceaux écrits APRÈS la mesure — l'Étai intact, et la
  // seconde heure de la base finale —, et chacun prouve d'abord qu'il discrimine.
  //
  // ⚠ LA BASE FINALE EST LÀ POUR LE SECOND, ET SON NIVEAU N'EST PAS UN CHOIX : c'est
  // `GEOGRAPHIE.niveauDeLaBaseFinale`, le plus haut du jeu, donc les plus gros PV.
  // Au niveau 30 le produit sort bien des entiers sûrs, mais le flottant retombe
  // sur le bon entier à chaque tick de la seconde heure — mesuré, zéro écart : un
  // montage au niveau 30 seul ne pouvait pas voir un `Number` à la place du `BigInt`.
  const H = RETOUR_DEFENSES.heuresDeBase * TICKS_PAR_HEURE;
  let ecartsDuFlottant = 0;
  for (const [type, niveau] of [['base', 30], ['baseVerrou', 30], ['baseTerminale', 60]]) {
    const etat = partie();
    const cible = { type, niveau, saveur: null, instance: 0, rangee: 150, colonne: 16 };
    const intact = montageDuSite(etat.graine, cible);
    const indexEtai = intact.batiments.findIndex((b) => b.id === 'etai');
    assert.ok(indexEtai >= 0, `montage : pas d'Étai dans ce site ${type}`);
    const d0 = intact.defenseurs[0];
    // Le facteur de dépassement vaut mille quand la pièce est au niveau de
    // l'Étai : c'est ce qui fait tomber la moitié à l'heure pile.
    assert.equal(d0.niveau, cible.niveau,
      `montage : la défense de ${type} n'est pas au niveau du site`);
    const maxD0 = pvMaxDeLaPieceDeGarnisonMilli(d0.id, d0.niveau);
    assert.equal(maxD0 % 2, 0,
      `montage : ${maxD0} est impair, « la moitié à l'heure » ne tombe plus sur un entier`);

    // L'Étai tombe à 1 PV — sur une base, tout planche, donc il ne meurt pas —
    // et la première défense est rasée.
    const resultat = resultatSur(intact, { batiments: { [indexEtai]: 0 }, defenses: { 0: 0 } });
    const maxEtai = resultat.batiments[indexEtai].pvMaxMilli;
    enregistrerLeRaid(etat, cible, resultat);
    const entree = etatDuSite(etat, cible);
    assert.ok(entree, `${type} : montage sans mordant, rien n'a été rangé`);
    const plancher = APRES_RAID.plancherPvMilli;
    assert.equal(entree.pvBatimentsMilli[indexEtai], plancher,
      `${type} : l'Étai ne planche pas à 1 PV`);
    assert.equal(entree.pvDefensesMilli[0], plancher,
      `${type} : la défense rasée ne planche pas à 1 PV`);
    assert.equal(entree.santeComplexeMilli, 0,
      `${type} : la santé figée d'un Étai à 1 PV ne vaut pas zéro millième`);

    const T = ticksDeRegeneration(type);
    assert.equal(T, TICKS_REPARATION_BASE,
      `${type} : l'Étai ne se régénère pas en une heure`);
    assert.equal(T % 2, 0, 'montage : une heure impaire en ticks n\'a pas de demi-heure');

    // À LA DEMI-HEURE : l'Étai a fait exactement la moitié du chemin.
    rattraperJeu(etat, T / 2);
    const etaiDemi = montageCourant(etat, cible).batiments.find((b) => b.id === 'etai');
    assert.equal(etaiDemi.pvMilli, plancher + Math.floor((maxEtai - plancher) / 2),
      `${type} : l'Étai ne remonte pas linéairement (${etaiDemi.pvMilli} sur ${maxEtai})`);

    // À L'HEURE : l'Étai est entier — tous les bâtiments le sont —, et la défense
    // rasée a reçu la moitié de ses PV, pas un de plus.
    rattraperJeu(etat, T / 2);
    const aLHeure = montageCourant(etat, cible);
    assert.deepEqual(aLHeure.batiments, intact.batiments,
      `${type} : les bâtiments ne sont pas entiers à l'heure`);
    const attenduALHeure = plancher + maxD0 / 2;
    assert.equal(aLHeure.defenseurs[0].pvMilli, attenduALHeure,
      `${type} : la défense n'a pas reçu la moitié de ses PV à l'heure `
      + `(${aLHeure.defenseurs[0].pvMilli}, attendu ${attenduALHeure})`);

    let ecoule = T;

    // AU BOUT : l'Étai est plein, donc la vitesse l'est aussi — il reste
    // `maxD0 / 2 − plancher` à rendre, à `maxD0` par heure.
    const reste = Math.ceil(((maxD0 / 2 - plancher) * T) / maxD0);

    // LA SECONDE HEURE, EN ENTIERS EXACTS. Le produit `pvMax × intégrale` y sort des
    // entiers sûrs ; on cherche les ticks où un `Number` retomberait d'un milli-PV
    // à côté — l'expression est celle qu'écrirait quelqu'un qui retirerait les
    // `BigInt`, au caractère près —, et on exige que le SITE rende le quotient
    // exact à chacun d'eux. La référence est calculée ici en `BigInt`, jamais lue
    // dans le module qu'on garde.
    for (let e = T + 1; e < T + reste; e += 1) {
      const sigma = T * T * 1000 + 2 * T * 1000 * (e - T);
      const exact = Number((BigInt(maxD0) * BigInt(sigma)) / BigInt(2 * T * H * 1000));
      const flottant = Math.floor((maxD0 * sigma) / (2 * T * H * 1000));
      if (flottant === exact) continue;
      assert.ok(maxD0 * sigma > Number.MAX_SAFE_INTEGER,
        `${type} : le flottant se trompe au tick ${e} SANS être sorti des entiers sûrs`);
      ecartsDuFlottant += 1;
      rattraperJeu(etat, e - ecoule);
      ecoule = e;
      assert.equal(montageCourant(etat, cible).defenseurs[0].pvMilli, plancher + exact,
        `${type} : au tick ${e} de la rampe, la défense ne porte pas le quotient EXACT `
        + `(attendu ${plancher + exact}, un produit en flottant rendrait ${plancher + flottant}) `
        + '— l\'intégrale est passée hors de `BigInt`');
    }

    rattraperJeu(etat, T + reste - 1 - ecoule);
    assert.ok(etatDuSite(etat, cible),
      `${type} : l'entrée a été purgée un tick AVANT le bout de la rampe`);
    rattraperJeu(etat, 1);
    assert.equal(etatDuSite(etat, cible), null,
      `${type} : l'entrée n'est pas purgée au bout de la rampe (${T + reste} ticks)`);
    assert.deepEqual(montageCourant(etat, cible), intact, `${type} : le site n'est pas revenu entier`);

    // L'ÉTAI INTACT GARDE LA RAMPE D'AVANT, AU MILLI-PV PRÈS. Les deux formes
    // coïncident à l'arrondi près quand la santé vaut déjà mille ; on cherche le
    // premier tick où elles s'écartent — il faut qu'il existe, sinon ce morceau ne
    // distingue rien — et le site doit y rendre l'ancienne.
    const etatIntact = partie();
    enregistrerLeRaid(etatIntact, cible, resultatSur(intact, { defenses: { 0: 0 } }));
    const entreeIntacte = etatDuSite(etatIntact, cible);
    assert.ok(entreeIntacte, `${type} : montage sans mordant, rien n'a été rangé sous un Étai intact`);
    assert.equal(entreeIntacte.santeComplexeMilli, 1000,
      `${type} : la santé figée d'un Étai intact ne vaut pas mille millièmes`);
    const rampe = {
      pvMaxMilli: maxD0, pvApresRaidMilli: plancher, niveau: d0.niveau,
      niveauComplexe: entreeIntacte.niveau, santeMilli: 1000,
    };
    let tickQuiDiscrimine = null;
    let ancienne = null;
    for (let e = 1; e <= T && tickQuiDiscrimine === null; e += 1) {
      const a = pvApresRetour({ ...rampe, ecouleTicks: e });
      const n = pvSousUneSanteQuiRemonte({ ...rampe, ticksDeRemontee: T, ecouleTicks: e });
      if (a !== n) { tickQuiDiscrimine = e; ancienne = a; }
    }
    assert.ok(tickQuiDiscrimine !== null,
      `${type} : montage sans mordant — sous un Étai intact, les deux rampes coïncident à chaque tick`);
    rattraperJeu(etatIntact, tickQuiDiscrimine);
    assert.equal(montageCourant(etatIntact, cible).defenseurs[0].pvMilli, ancienne,
      `${type} : un Étai INTACT a pris la rampe de la remontée au tick ${tickQuiDiscrimine} `
      + `(attendu ${ancienne}, la formule d'avant)`);
  }
  assert.ok(ecartsDuFlottant > 0,
    'montage sans mordant : le flottant ne se trompe sur aucun tick de la seconde heure, '
    + 'donc ce test ne distinguerait pas un produit hors de `BigInt`');
});

test('RETOUR-D T15 — aucun bâtiment de camp ne revient, abîmé comme détruit', () => {
  // ⚠ C'EST LE SEUL DES TROIS TESTS D'AVANT QUI SURVIT À CE LOT, et il survit
  // ENTIER : §3 du brief le confirme comme règle, pas comme oubli. Il vivait
  // dans « un camp ne répare que ses défenses SURVIVANTES » ; il a sa place à
  // lui maintenant que le reste de ce test-là est parti.
  const etat = partie();
  const id = avantPoste(etat);
  const intact = montageDuSite(etat.graine, id);
  enregistrerLeRaid(etat, id, resultatSur(intact, { batiments: { 3: 0.5, 4: 0 } }));
  assert.ok(etatDuSite(etat, id), 'montage sans mordant : rien n\'a été rangé');

  rattraperJeu(etat, TICKS_REPARATION_DEFENSES * 100);
  const entree = etatDuSite(etat, id);
  assert.ok(entree, 'l\'entrée a disparu : les bâtiments abîmés ont été oubliés');
  assert.notEqual(entree.pvBatimentsMilli[3], null, 'le bâtiment abîmé s\'est réparé');
  assert.equal(entree.pvBatimentsMilli[4], 0, 'le bâtiment détruit est revenu d\'entre les morts');
});

test('RETOUR-D T14 — l\'Étai tombé sur un camp, les défenses ne repoussent JAMAIS', () => {
  // ⚠⚠ LA GARDE, PAS LA FORMULE. À santé nulle la pénalité vaut son maximum —
  // vingt-quatre heures — et non « jamais » : c'est `pvApresRetour` qui refuse
  // de rendre quoi que ce soit sur une santé `null`. Cent heures plus tard, la
  // détruite est toujours détruite et l'abîmée toujours abîmée.
  const etat = partie();
  const id = avantPoste(etat);
  const intact = montageDuSite(etat.graine, id);
  const indexEtai = intact.batiments.findIndex((b) => b.id === 'etai');
  assert.ok(indexEtai >= 0, 'montage : pas d\'Étai dans ce site');

  enregistrerLeRaid(etat, id, resultatSur(intact, {
    batiments: { [indexEtai]: 0 }, defenses: { 0: 0, 1: 0.2 },
  }));
  const avant = structuredClone(etatDuSite(etat, id).pvDefensesMilli);
  rattraperJeu(etat, TICKS_REPARATION_DEFENSES * 100);

  const entree = etatDuSite(etat, id);
  assert.ok(entree, 'l\'entrée a disparu alors que l\'Étai est tombé');
  assert.equal(entree.santeComplexeMilli, null, 'l\'Étai tombé n\'a pas figé une santé nulle');
  assert.deepEqual(entree.pvDefensesMilli, avant, 'les défenses ont repoussé sans Étai');
  assert.equal(entree.pvDefensesMilli[0], 0, 'la détruite est revenue sans Étai');
  // ⚠ ET LE MONTAGE LU LE DIT AUSSI — la rampe se calcule à la LECTURE côté
  // Ouvrage, donc c'est là qu'une garde absente se verrait.
  assert.equal(
    montageCourant(etat, id).defenseurs.length, intact.defenseurs.length - 1,
    'la détruite est remontée dans le montage',
  );
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
    // ⚠ UN BÂTIMENT ABÎMÉ ENTRE DANS LE MONTAGE, ET C'EST OBLIGATOIRE DEPUIS LE
    // LOT RETOUR-DÉFENSES. Les défenses reviennent TOUTES au bout de la rampe,
    // détruites comprises : sans un bâtiment de camp — qui, lui, ne revient
    // jamais — l'entrée « ne dit plus rien » et disparaît, si bien que la
    // dernière assertion de ce test n'aurait plus rien à comparer.
    enregistrerLeRaid(etat, id, resultatSur(intact, {
      batiments: { 3: 0.5 }, defenses: { 0: 0, 2: 0.4 },
    }));
    const n = TICKS_REPARATION_DEFENSES + 500;
    if (parBoucle) for (let i = 0; i < n; i += 1) tickJeu(etat);
    else rattraperJeu(etat, n);
    montages.push(etat.sitesEntames);
  }
  assert.deepEqual(montages[0], montages[1], 'boucle et rattrapage divergent');
  assert.ok(Object.keys(montages[0]).length > 0, 'montage sans mordant : plus rien à comparer');
});

test('état — les sites entamés traversent la sauvegarde, et la v10 se migre', () => {
  // ⚠ CE TEST NE GARDE PAS LE NUMÉRO — la leçon du lot SITE-ENTAMÉ, appliquée à
  // lui-même : la garde du numéro appartient au maillon le plus RÉCENT, une
  // seule fois. Ici on vérifie que le maillon v10 → v11 existe et que la chaîne
  // va jusqu'au bout, quel que soit son bout.
  assert.ok(SAVE_VERSION >= 11, 'le maillon v10 → v11 n\'est plus dans la chaîne');

  const etat = partie();
  const id = avantPoste(etat);
  enregistrerLeRaid(etat, id, resultatSur(montageDuSite(etat.graine, id), { defenses: { 0: 0 } }));
  etat.basesRasees.push(caseRasee(150, 16));
  const attendu = structuredClone(etat.sitesEntames);

  const recharge = charger(serialiser(etat, 2_000_000), 2_000_000);
  assert.deepEqual(recharge.sitesEntames, attendu, 'les dégâts n\'ont pas survécu au tour');
  assert.deepEqual(recharge.basesRasees, [{ rangee: 150, colonne: 16 }]);

  // Une v10 n'a jamais rien entamé : deux tables vides, et rien de converti.
  const migre = migrer({ version: 10 });
  assert.equal(migre.version, SAVE_VERSION);
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

  assert.ok(un.gagne.quartz > 0, 'la première passe n\'a rien rapporté');

  // ⚠⚠ LA MESURE A CHANGÉ DE GRANDEUR, ET LA PROPRIÉTÉ EST LA MÊME. `force`
  // compte des PIÈCES : depuis le lot RETOUR-DÉFENSES, une défense à zéro se
  // relève à 70 % à la fin du raid tant que l'Étai tient, donc le COMPTE ne
  // bouge plus alors que le site s'est bel et bien usé. Ce qu'on mesure
  // désormais est ce qui ne revient pas : les PV que le site porte encore, et
  // les bâtiments d'un camp, qui ne se réparent jamais.
  const pvDuMontage = (m) => {
    const r = construireResultat(creerCombat(m));
    return [...r.batiments, ...r.defenses].reduce((t, l) => t + l.pvMilli, 0);
  };
  const intact = montageDuSite(etat.graine, id);
  assert.ok(pvDuMontage(montageCourant(etat, id)) < pvDuMontage(intact),
    'la première passe n\'a rien usé du tout');
  assert.ok(apres.forceDeLaDefense <= avant.forceDeLaDefense,
    `force ${apres.forceDeLaDefense} contre ${avant.forceDeLaDefense}`);

  // ⚠ ET LA SECONDE PASSE PART DE CE QUI RESTE : son montage porte strictement
  // moins de PV que le site intact. C'est ce qui rend « deux passes » possible,
  // et un code qui régénérerait le site intact le ferait tomber.
  const deux = passe(2, 30);
  assert.ok(pvDuMontage(deux.montage) < pvDuMontage(intact),
    'la seconde passe a retrouvé le site intact');
  assert.ok(deux.montage.batiments.length <= un.montage.batiments.length,
    'un bâtiment de camp est revenu d\'entre les morts');
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

test('recherche — cinquante pour cent plus cinquante pour cent, pas le double', () => {
  // ⚠ LA PHRASE D'ETHAN, MESURÉE : « tu tapes une défense à qui il reste
  // cinquante pour cent, tu l'achèves, tu n'es pas censé avoir le double ; tu as
  // cinquante plus cinquante ». On casse donc la moitié d'une garnison, on
  // range, puis on achève ce qui reste — et la somme des deux passes doit valoir
  // ce qu'une passe unique aurait rendu en la détruisant d'un coup.
  const etat = partie();
  const id = avantPoste(etat);
  const intact = montageDuSite(etat.graine, id);

  const toutes = (part) => {
    const d = {};
    for (let i = 0; i < intact.defenseurs.length; i += 1) d[i] = part;
    return d;
  };

  // La référence : tout détruit en une seule passe.
  const dUnCoup = pointsRecherche(resultatSur(intact, { defenses: toutes(0) }), intact);
  assert.ok(dUnCoup > 0n, 'montage sans mordant : cette garnison ne rapporte rien');

  // ⚠⚠ L'ÉTAI TOMBE DANS LA PREMIÈRE PASSE, ET SANS LUI CE TEST NE MESURE PLUS
  // RIEN. La phrase d'Ethan parle du MÊME instant ; depuis le lot
  // RETOUR-DÉFENSES, une défense laissée à 50 % remonte à 85 % à la fin du raid
  // si l'Étai tient — donc la seconde passe casse 85 % et la somme dépasse
  // légitimement le tout. Ce n'est pas un double paiement, c'est le travail
  // refait sur une cible RÉPARÉE, ce que le test voisin dit déjà. L'Étai à terre,
  // rien ne revient, et l'égalité qu'on garde ici redevient observable.
  const indexEtai = intact.batiments.findIndex((b) => b.id === 'etai');
  assert.ok(indexEtai >= 0, 'montage : pas d\'Étai dans ce site');
  const passeUn = { batiments: { [indexEtai]: 0 }, defenses: toutes(0.5) };

  // Passe 1 : la moitié des PV de chaque défense.
  const un = pointsRecherche(resultatSur(intact, { defenses: toutes(0.5) }), intact);
  enregistrerLeRaid(etat, id, resultatSur(intact, passeUn));

  // Passe 2 : on achève ce qui reste, monté à ses PV rangés.
  const reste = montageCourant(etat, id);
  const deux = pointsRecherche(resultatSur(reste, { defenses: toutes(0) }), reste);

  // ⚠ L'ÉGALITÉ EST À LA TRONCATURE PRÈS, une par cible et par passe : la
  // division BigInt tronque vers zéro, donc deux moitiés peuvent rendre un
  // milli-point de moins que le tout. Ce qui est asserté, c'est qu'on ne
  // DÉPASSE jamais — la règle d'avant rendait une fois et demie.
  assert.ok(un + deux <= dUnCoup, `${un} + ${deux} dépasse ${dUnCoup}`);
  assert.ok(un + deux > (dUnCoup * 99n) / 100n, `${un} + ${deux} contre ${dUnCoup}`);
  assert.ok(un > 0n && deux > 0n, 'une des deux passes n\'a rien rapporté');
});

test('recherche — une cible RÉPARÉE remarque, et c\'est voulu', () => {
  // « Sauf si elle est réparée. » L'Étai debout rend leurs PV aux défenses
  // survivantes en une heure ; les casser à nouveau est un travail à nouveau.
  const etat = partie();
  const id = avantPoste(etat);
  const intact = montageDuSite(etat.graine, id);

  const un = pointsRecherche(resultatSur(intact, { defenses: { 1: 0.5 } }), intact);
  enregistrerLeRaid(etat, id, resultatSur(intact, { defenses: { 1: 0.5 } }));
  assert.ok(un > 0n);

  // Avant l'heure, la cible est encore à moitié : l'achever ne rend que l'autre
  // moitié.
  const avant = montageCourant(etat, id);
  const entamee = pointsRecherche(resultatSur(avant, { defenses: { 1: 0 } }), avant);

  // Après l'heure, elle est pleine : la casser rend le plein.
  rattraperJeu(etat, TICKS_REPARATION_DEFENSES);
  const apres = montageCourant(etat, id);
  const reparee = pointsRecherche(resultatSur(apres, { defenses: { 1: 0 } }), apres);

  assert.ok(reparee > entamee, `réparée ${reparee}, entamée ${entamee}`);
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
