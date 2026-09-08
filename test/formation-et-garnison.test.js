// LA FORMATION DE RAID ET LE MODULE GARNISON — lot FORMATION-ET-GARNISON, 08/09.
//
// Trois choses, dans cet ordre, et la troisième dépend des deux premières : la
// formation de raid devient une COPIE DE TRAVAIL, le glisser-déposer gagne la
// PERMUTATION, et le module Garnison est CÂBLÉ — une escouade s'embarque dans un
// véhicule, elle en sort derrière lui quand il a franchi la défense ou quand il
// est détruit.
//
// ⚠⚠ LE TEST QUI REND LE LOT DÉBOGABLE EST `FG T1`, ET CELUI QUI COMPTE EST
// `FG T9`. Le premier dit que la copie est NEUTRE — mêmes vagues, mêmes indices
// que le chemin d'hier ; le second dit que l'alignement des dégâts tient avec un
// porteur chargé au milieu de la formation. Si T1 passe et qu'un raid sort faux
// ensuite, le coupable est l'embarquement, pas la copie.
//
// ⚠ `reporterLesDegats` APPARIE `resultat.attaquants` ET `indices` POSITION PAR
// POSITION, et il ne le dit que si les LONGUEURS diffèrent. Un décalage d'un
// cran fait tomber les dégâts d'un raid sur la mauvaise unité, en silence : c'est
// la faute que ce fichier existe pour attraper, et elle se mesure en croisant les
// identifiants, jamais en comptant.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  creerEtat, rattraperJeu, serialiser, poserEffectif, pointsEngages,
  problemesDeLEffectif,
} from '../src/sim/state.js';
import { baseCourante } from '../src/sim/base-courante.js';
import {
  formationDepuisLArmee, resynchroniserLaFormation, reglerActiviteEnFormation,
  problemesDuDeplacementEnFormation, deplacerEnFormation,
  problemesDeLaPermutationEnFormation, permuterEnFormation,
  problemesDeLEmbarquement, embarquerEnFormation,
  problemesDuDebarquementEnFormation, debarquerEnFormation,
  estPassager, estPorteur, passagerDe, REFUS_DE_L_EMBARQUEMENT,
} from '../src/sim/formation-de-raid.js';
import {
  composerLesVagues, executerRaid, simulerRaid, problemesDuRaid, montageDuRaid,
} from '../src/sim/raid.js';
import {
  creerCombat, tick, resoudre, TICKS_AVANT_REPLI, RANGEE_DEFENSE_FRANCHIE,
} from '../src/sim/combat.js';
import { caseDepuisMilli } from '../src/sim/grille.js';
import { siteDeLaCase } from '../src/sim/site-de-la-case.js';
import { acheter, problemesDeLAchat, moduleEstAcquis } from '../src/sim/recherche.js';
import { moduleEstCable } from '../src/data/modules.js';
import { UNITES, GRILLE } from '../src/data/combat.js';
import { readFileSync } from 'node:fs';
import { vaguesDeLArmee, vueDuRaid, MODES_RAID } from '../src/ui/raid.js';
import { poserLesBatimentsDeProduction } from './batiments-de-production.js';

/** L'instant mural du montage — fixe, pour que deux sérialisations se comparent. */
const INSTANT = 1_800_000_000_000;

/**
 * Une partie avec des satellites parus, les trois bâtiments de production, de
 * quoi acheter, et rien d'autre.
 */
function partie(graine = 2026) {
  const etat = creerEtat(graine);
  rattraperJeu(etat, 3001);
  poserLesBatimentsDeProduction(etat);
  baseCourante(etat).disposition[0].niveau = 12;
  baseCourante(etat).economie.ressources.scorie = 1_000_000_000;
  etat.attaque.points = 100_000;
  // De quoi payer n'importe quelle ligne de l'arbre : le lot ne mesure pas un
  // barème, et un manque de points ferait échouer un montage pour une raison
  // qui ne le regarde pas.
  etat.recherche.pointsMilli = '9999999999999999';
  return etat;
}

/** Pose une pièce dans l'armée, sans passer par le stock ni par le budget. */
function poser(etat, id, vague, colonne, extra = {}) {
  poserEffectif(etat, 'armee', { id, vague, colonne, niveau: 1, ...extra });
  return baseCourante(etat).armee.length - 1;
}

/** Le premier camp autour de la base, ou `null`. */
function premierCamp(etat) {
  const s = baseCourante(etat).satellites.presents.find((x) => x.type === 'camp');
  return s === undefined ? null : { rangee: s.rangee, colonne: s.colonne };
}

/**
 * Une armée de six pièces réparties sur trois vagues, POSÉE DANS LE DÉSORDRE.
 *
 * ⚠ LE DÉSORDRE EST LA MOITIÉ DU MONTAGE. `composerLesVagues` trie par vague
 * puis par colonne ; une armée déjà rangée dans cet ordre rendrait le même
 * résultat qu'une copie qui ne trierait pas, et `FG T1` ne mesurerait rien.
 */
function armeeDeSix(etat) {
  poser(etat, 'meute', 3, 4);
  poser(etat, 'ratisseur', 1, 2);
  poser(etat, 'fendeur', 2, 7);
  poser(etat, 'belier', 1, 5);
  poser(etat, 'perceurs', 3, 1);
  poser(etat, 'busard', 2, 3);
}

// ---------------------------------------------------------------------------
// FG T1 — la copie est neutre
// ---------------------------------------------------------------------------

test('FG T1 — la formation intacte rend EXACTEMENT les mêmes vagues et les mêmes indices', () => {
  const etat = partie();
  armeeDeSix(etat);
  const armee = baseCourante(etat).armee;

  // ⚠ LE MONTAGE MESURE QUELQUE CHOSE : l'ordre de pose n'est PAS l'ordre de
  // montage. Sans cette assertion, une copie qui ne trierait pas passerait.
  const ordreDePose = armee.map((p) => `${p.vague}:${p.colonne}`);
  const ordreTrie = [...ordreDePose].sort();
  assert.notDeepEqual(ordreDePose, ordreTrie, 'montage : l\'armée est déjà rangée');

  const formation = formationDepuisLArmee(etat);
  const parLaCopie = composerLesVagues(etat, formation);
  const parLArmee = composerLesVagues(etat);
  assert.deepEqual(parLaCopie.vagues, parLArmee.vagues, 'la copie réordonne les vagues');
  assert.deepEqual(parLaCopie.indices, parLArmee.indices, 'la copie réordonne les indices');
  // Falsifiable : le montage doit produire des indices non triviaux.
  assert.equal(parLArmee.indices.length, 6);
  assert.notDeepEqual(parLArmee.indices, [0, 1, 2, 3, 4, 5],
    'montage : les indices sortent dans l\'ordre de pose, le tri ne mesure rien');
});

// ---------------------------------------------------------------------------
// FG T2 — rien ne remonte en Offense
// ---------------------------------------------------------------------------

test('FG T2 — cinq gestes sur la formation laissent l\'état identique OCTET POUR OCTET', () => {
  const etat = partie();
  armeeDeSix(etat);
  acheter(etat, 'offense', 'ratisseur', 'module');
  const avant = serialiser(etat, INSTANT);

  const formation = formationDepuisLArmee(etat);
  const iEclaireur = formation.findIndex((p) => p.id === 'ratisseur');
  const iEscouade = formation.findIndex((p) => p.id === 'meute');
  const iBelier = formation.findIndex((p) => p.id === 'belier');
  const iFendeur = formation.findIndex((p) => p.id === 'fendeur');
  const iPerceurs = formation.findIndex((p) => p.id === 'perceurs');

  deplacerEnFormation(formation, iBelier, { vague: 4, colonne: 9 });
  deplacerEnFormation(formation, iFendeur, { vague: 4, colonne: 8 });
  permuterEnFormation(formation, iPerceurs, iEclaireur);
  reglerActiviteEnFormation(formation, iFendeur, false);
  embarquerEnFormation(etat, formation, iEscouade, iEclaireur);

  const apres = serialiser(etat, INSTANT);
  assert.equal(apres, avant, 'un geste de la formation a fui vers `etat.armee`');
  // Falsifiable : les cinq gestes ont bien changé la FORMATION.
  assert.notDeepEqual(
    formation.map((p) => `${p.vague}:${p.colonne}:${p.actif}:${p.embarqueDans}`),
    formationDepuisLArmee(etat).map((p) => `${p.vague}:${p.colonne}:${p.actif}:${p.embarqueDans}`),
    'montage sans mordant : les gestes n\'ont rien changé',
  );
});

// ---------------------------------------------------------------------------
// FG T3 — la formation repart d'Offense
// ---------------------------------------------------------------------------

test('FG T3 — reconstruite, elle rend les positions d\'Offense et TOUTES les pièces actives', () => {
  const etat = partie();
  armeeDeSix(etat);
  acheter(etat, 'offense', 'ratisseur', 'module');
  // ⚠ UNE PIÈCE PORTE `actif: false` DANS L'ÉTAT — c'est le cas d'une sauvegarde
  // d'AVANT ce lot, où l'écran de raid écrivait le drapeau dans `etat.armee`.
  baseCourante(etat).armee[0].actif = false;

  const premiere = formationDepuisLArmee(etat);
  deplacerEnFormation(premiere, premiere.findIndex((p) => p.id === 'belier'),
    { vague: 4, colonne: 9 });
  reglerActiviteEnFormation(premiere, 2, false);
  embarquerEnFormation(etat, premiere,
    premiere.findIndex((p) => p.id === 'meute'),
    premiere.findIndex((p) => p.id === 'ratisseur'));

  const seconde = formationDepuisLArmee(etat);
  baseCourante(etat).armee.forEach((piece, i) => {
    assert.equal(seconde[i].id, piece.id, `pièce ${i} : identité`);
    assert.equal(seconde[i].vague, piece.vague, `pièce ${i} : vague`);
    assert.equal(seconde[i].colonne, piece.colonne, `pièce ${i} : colonne`);
    assert.equal(seconde[i].actif, true, `pièce ${i} : toutes repartent actives`);
    assert.equal(seconde[i].embarqueDans, null, `pièce ${i} : personne n'est embarqué`);
  });
  // Falsifiable : la première formation, elle, portait bien les trois écarts.
  assert.equal(premiere[2].actif, false);
  assert.notEqual(premiere.find((p) => p.id === 'meute').embarqueDans, null);
});

// ---------------------------------------------------------------------------
// FG T4 — le simulateur reçoit la même formation
// ---------------------------------------------------------------------------

test('FG T4 — `simulerRaid` et `executerRaid` rendent le même rapport sous la même formation', () => {
  const etat = partie(7);
  armeeDeSix(etat);
  acheter(etat, 'offense', 'ratisseur', 'module');
  const cible = premierCamp(etat);
  assert.ok(cible !== null, 'montage : aucun camp autour de la base');

  const formation = formationDepuisLArmee(etat);
  // Une formation VRAIMENT modifiée : sans écart, les deux chemins rendraient le
  // même rapport que la formation passe ou non.
  deplacerEnFormation(formation, formation.findIndex((p) => p.id === 'belier'),
    { vague: 4, colonne: 9 });
  embarquerEnFormation(etat, formation,
    formation.findIndex((p) => p.id === 'meute'),
    formation.findIndex((p) => p.id === 'ratisseur'));

  const copie = structuredClone(etat);
  const reel = executerRaid(copie, copie.bases[copie.baseCourante], cible, { formation });
  const { simule, ...simulee } = simulerRaid(
    etat, baseCourante(etat), cible, { formation },
  );
  assert.equal(simule, true);
  assert.deepEqual(simulee, reel, '`options` ne passe pas en entier');

  // ⚠ ET LA FORMATION MORD : le même raid SANS elle rend un autre rapport.
  const autre = structuredClone(etat);
  const sansFormation = executerRaid(autre, autre.bases[autre.baseCourante], cible);
  assert.notDeepEqual(sansFormation, reel,
    'montage sans mordant : la formation ne change rien à ce raid');
});

// ---------------------------------------------------------------------------
// FG T5 — la permutation est géométrique et gratuite
// ---------------------------------------------------------------------------

test('FG T5 — permuter échange les cases, jamais le niveau ni les dégâts, et ne coûte rien', () => {
  const etat = partie();
  poser(etat, 'meute', 1, 1, { niveau: 3 });
  poser(etat, 'fendeur', 2, 5, { niveau: 7 });
  baseCourante(etat).armee[0].degatsMilli = 12_345;
  baseCourante(etat).armee[1].degatsMilli = 6_789;

  const formation = formationDepuisLArmee(etat);
  const pointsAvant = pointsEngages(etat, 'armee');
  const sommeAvant = formation.reduce((s, p) => s + UNITES[p.id].points, 0);

  permuterEnFormation(formation, 0, 1);

  assert.deepEqual(
    { vague: formation[0].vague, colonne: formation[0].colonne }, { vague: 2, colonne: 5 });
  assert.deepEqual(
    { vague: formation[1].vague, colonne: formation[1].colonne }, { vague: 1, colonne: 1 });
  // ⚠ NIVEAU ET DÉGÂTS SUIVENT LEUR PIÈCE : ce sont les MÊMES pièces qui
  // changent de case, pas deux cases qui échangent leur contenu.
  assert.equal(formation[0].niveau, 3);
  assert.equal(formation[0].degatsMilli, 12_345);
  assert.equal(formation[1].niveau, 7);
  assert.equal(formation[1].degatsMilli, 6_789);
  assert.equal(pointsEngages(etat, 'armee'), pointsAvant, 'la permutation a coûté au budget');
  assert.equal(formation.reduce((s, p) => s + UNITES[p.id].points, 0), sommeAvant);
  // Falsifiable : les deux pièces ne portaient ni le même niveau ni les mêmes
  // dégâts — sans ça, « ils suivent » serait vrai de n'importe quel code.
  assert.notEqual(formation[0].niveau, formation[1].niveau);
  assert.notEqual(formation[0].degatsMilli, formation[1].degatsMilli);
});

// ---------------------------------------------------------------------------
// FG T6 — une escouade embarquée libère sa case et compte toujours
// ---------------------------------------------------------------------------

test('FG T6 — embarquée, elle libère sa case, ne se superpose à rien, et garde ses points', () => {
  const etat = partie();
  acheter(etat, 'offense', 'ratisseur', 'module');
  poser(etat, 'ratisseur', 1, 3);
  poser(etat, 'meute', 1, 4);
  poser(etat, 'fendeur', 4, 9);

  const formation = formationDepuisLArmee(etat);
  const pointsAvant = formation.reduce((s, p) => s + UNITES[p.id].points, 0);
  // Montage : avant l'embarquement, la colonne 4 est bien PRISE.
  assert.ok(
    problemesDuDeplacementEnFormation(formation, 2, { vague: 1, colonne: 4 })
      .some((p) => p.code === 'superposition'),
    'montage : la case témoin est déjà libre',
  );

  embarquerEnFormation(etat, formation, 1, 0);

  assert.deepEqual(problemesDuDeplacementEnFormation(formation, 2, { vague: 1, colonne: 4 }), [],
    'la case de la passagère reste occupée');
  // ⚠ ET LA SUPERPOSITION EST IMPOSSIBLE PAR CONSTRUCTION : `vague: null` ne
  // peut égaler aucune vague. On le mesure sur le validateur lui-même.
  const troisieme = { ...formation[2], vague: 1, colonne: 4 };
  assert.deepEqual(
    problemesDeLEffectif('armee', formation, troisieme, 2).filter((p) => p.code === 'superposition'),
    [], 'la passagère occupe encore une case aux yeux du validateur');
  assert.equal(formation.reduce((s, p) => s + UNITES[p.id].points, 0), pointsAvant,
    'la passagère a quitté le budget');
  assert.equal(formation.length, 3, 'la passagère a quitté la formation');
});

// ---------------------------------------------------------------------------
// FG T7 — les quatre refus, mot pour mot
// ---------------------------------------------------------------------------

test('FG T7 — les quatre codes de refus, et les quatre messages mot pour mot', () => {
  const etat = partie();
  acheter(etat, 'offense', 'broyeur', 'unite');
  poser(etat, 'meute', 1, 1); //     0 — l'escouade
  poser(etat, 'broyeur', 1, 2); //   1 — Percheron, module Écraseur
  poser(etat, 'ratisseur', 1, 3); // 2 — Éclaireur, module Garnison NON acquis
  poser(etat, 'fendeur', 1, 4); //   3 — un blindé, candidat passager illégal
  poser(etat, 'meute', 1, 5); //     4 — une seconde escouade
  const formation = formationDepuisLArmee(etat);

  // 1 — cette pièce ne transporte personne
  assert.deepEqual(problemesDeLEmbarquement(etat, formation, 0, 1), [
    { code: 'sansModule', message: REFUS_DE_L_EMBARQUEMENT.sansModule },
  ]);
  assert.equal(REFUS_DE_L_EMBARQUEMENT.sansModule, 'cette pièce ne transporte personne');

  // 2 — le module Garnison n'est pas acquis
  assert.equal(moduleEstAcquis(etat, 'offense', 'ratisseur'), false, 'montage : module déjà payé');
  assert.deepEqual(problemesDeLEmbarquement(etat, formation, 0, 2), [
    { code: 'moduleNonAcquis', message: REFUS_DE_L_EMBARQUEMENT.moduleNonAcquis },
  ]);
  assert.equal(REFUS_DE_L_EMBARQUEMENT.moduleNonAcquis, 'le module Garnison n\'est pas acquis');

  // 3 — ce véhicule transporte déjà une escouade
  acheter(etat, 'offense', 'ratisseur', 'module');
  embarquerEnFormation(etat, formation, 0, 2);
  assert.deepEqual(problemesDeLEmbarquement(etat, formation, 4, 2), [
    { code: 'dejaCharge', message: REFUS_DE_L_EMBARQUEMENT.dejaCharge },
  ]);
  assert.equal(REFUS_DE_L_EMBARQUEMENT.dejaCharge, 'ce véhicule transporte déjà une escouade');

  // 4 — seule une infanterie embarque
  const libre = formationDepuisLArmee(etat);
  assert.deepEqual(problemesDeLEmbarquement(etat, libre, 3, 2), [
    { code: 'pasUneInfanterie', message: REFUS_DE_L_EMBARQUEMENT.pasUneInfanterie },
  ]);
  assert.equal(REFUS_DE_L_EMBARQUEMENT.pasUneInfanterie, 'seule une infanterie embarque');

  // Et le geste LÈVE quand il est refusé — la liste se demande d'abord.
  assert.throws(() => embarquerEnFormation(etat, libre, 3, 2), /embarquement illégal/);
});

// ---------------------------------------------------------------------------
// FG T8 — le passager part dans la vague du porteur
// ---------------------------------------------------------------------------

test('FG T8 — la passagère est montée dans la vague de son porteur, JUSTE derrière lui', () => {
  const etat = partie();
  acheter(etat, 'offense', 'ratisseur', 'module');
  const iAutre = poser(etat, 'belier', 1, 1);
  const iPorteur = poser(etat, 'ratisseur', 3, 6);
  const iPassagere = poser(etat, 'meute', 1, 2);

  const formation = formationDepuisLArmee(etat);
  embarquerEnFormation(etat, formation, iPassagere, iPorteur);
  const { vagues, indices } = composerLesVagues(etat, formation);

  // Deux vagues émises : la 1 (le Pionnier seul) et la 3 (le porteur et sa
  // passagère). La vague 2 n'existe pas — `parVague` ne crée que ce qui est posé.
  assert.equal(vagues.length, 2, 'deux vagues attendues');
  const vagueDuPorteur = vagues[1];
  assert.equal(vagueDuPorteur.length, 2);
  assert.equal(vagueDuPorteur[0].id, 'ratisseur');
  assert.equal(vagueDuPorteur[1].id, 'meute');
  assert.equal(vagueDuPorteur[1].embarquee, true, 'la passagère n\'est pas marquée embarquée');
  assert.equal(vagueDuPorteur[1].colonne, 6, 'la passagère ne prend pas la colonne du porteur');
  assert.equal(vagueDuPorteur[0].embarquee, undefined, 'le porteur est marqué embarqué');

  // ⚠ ET SON INDICE D'ARMÉE EST À CETTE POSITION-LÀ. C'est ce qui apparie les
  // dégâts : `indices[i]` doit désigner la pièce que `attaquants[i]` décrit.
  assert.deepEqual(indices, [iAutre, iPorteur, iPassagere]);
});

// ---------------------------------------------------------------------------
// FG T9 — l'alignement des dégâts tient
// ---------------------------------------------------------------------------

test('FG T9 — un raid complet avec un porteur chargé apparie les dégâts, pièce par pièce', () => {
  const etat = partie(11);
  acheter(etat, 'offense', 'ratisseur', 'module');
  for (const id of ['perceurs', 'fendeur', 'crecelle', 'belier', 'broyeur']) {
    acheter(etat, 'offense', id, 'unite');
  }
  // ⚠ SIX IDENTIFIANTS DISTINCTS, ET LE PORTEUR AU MILIEU. Sans identifiants
  // distincts, un décalage d'un cran apparierait deux pièces du même nom et
  // passerait inaperçu ; sans porteur au milieu, il n'y aurait rien à décaler.
  poser(etat, 'perceurs', 1, 1);
  poser(etat, 'belier', 1, 2);
  poser(etat, 'ratisseur', 1, 3);
  poser(etat, 'fendeur', 1, 4);
  poser(etat, 'crecelle', 1, 5);
  poser(etat, 'meute', 1, 6);
  const cible = premierCamp(etat);
  assert.ok(cible !== null, 'montage : aucun camp autour de la base');

  const formation = formationDepuisLArmee(etat);
  embarquerEnFormation(etat, formation, 5, 2);
  const { vagues, indices } = composerLesVagues(etat, formation);
  assert.equal(indices.length, 6, 'montage : les six pièces doivent partir');

  // Le MÊME combat que celui qu'`executerRaid` va monter — même montage, mêmes
  // vagues, moteur déterministe.
  const site = siteDeLaCase(etat, cible.rangee, cible.colonne);
  const resultat = resoudre(creerCombat({ ...montageDuRaid(etat, site), vagues }));
  assert.equal(resultat.attaquants.length, indices.length,
    'le moteur ne rend pas autant d\'attaquants que d\'engagés');
  const armee = baseCourante(etat).armee;
  for (let i = 0; i < indices.length; i += 1) {
    assert.equal(resultat.attaquants[i].id, armee[indices[i]].id,
      `l'attaquant ${i} ne décrit pas la pièce ${indices[i]}`);
  }

  // Et le vrai raid ne lève pas.
  const copie = structuredClone(etat);
  assert.doesNotThrow(
    () => executerRaid(copie, copie.bases[copie.baseCourante], cible, { formation }),
    'le raid lève sur l\'appariement des dégâts',
  );
});

// ---------------------------------------------------------------------------
// Les montages de combat du module Garnison
// ---------------------------------------------------------------------------

/** Un montage de combat minimal : un bâtiment au fond, rien d'autre. */
function montage(vagues, extra = {}) {
  return creerCombat({
    niveau: 5,
    batiments: [{ id: 'gangue', rangee: 18, colonne: 1 }],
    vagues,
    ...extra,
  });
}

/** Le couple porteur + passagère, monté à la rangée voulue. */
function couple(id, colonne, rangee, extra = {}) {
  return [
    { id, colonne, rangee, ...extra },
    { id: 'meute', colonne, rangee, embarquee: true },
  ];
}

// ---------------------------------------------------------------------------
// FG T10 — la passagère est inerte
// ---------------------------------------------------------------------------

test('FG T10 — pendant le trajet elle ne tire pas, n\'est pas visée, ne prend rien, et ne bloque rien', () => {
  const etat = montage([couple('ratisseur', 5, 2)], {
    defenseurs: [{ id: 'casemate', rangee: 6, colonne: 5 }],
    // ⚠ UNE SECONDE VAGUE, MÊME COLONNE, MÊME RANGÉE D'APPARITION : c'est ce qui
    // MESURE `construireOccupation`. La passagère reste à la rangée 2 — elle ne
    // se déplace pas —, donc si elle occupait sa case, l'unité de la vague 2
    // resterait en attente au tick 50. C'est la seule façon d'observer
    // l'occupation depuis l'extérieur du moteur.
    vagues: [couple('ratisseur', 5, 2), [{ id: 'meute', colonne: 5, rangee: 2 }]],
  });
  const passagere = etat.entites.find((e) => e.embarquee === true);
  const porteur = etat.entites[passagere.porteurIndice];
  assert.equal(porteur.id, 'ratisseur', 'montage : la passagère ne suit pas son porteur');
  const pvAuDepart = passagere.pvMilli;

  for (let t = 1; t <= 20; t += 1) {
    tick(etat);
    assert.equal(passagere.aTire, false, `tick ${t} : la passagère a tiré`);
    assert.equal(passagere.embarquee, true, `tick ${t} : elle a débarqué trop tôt`);
    for (const d of etat.entites) {
      if (d.camp !== 'defense') continue;
      assert.notEqual(d.cibleIndice, passagere.indice, `tick ${t} : un défenseur la vise`);
    }
  }
  assert.equal(passagere.pvMilli, pvAuDepart, 'la passagère a encaissé des dégâts');
  assert.equal(passagere.pvMilli, passagere.pvInitialMilli);
  // Falsifiable : le montage MORD — le porteur, lui, a été visé et touché.
  assert.ok(porteur.pvMilli < porteur.pvInitialMilli, 'montage : personne n\'a tiré sur le porteur');
  assert.ok(
    etat.entites.some((d) => d.camp === 'defense' && d.cibleIndice === porteur.indice),
    'montage : aucun défenseur ne vise le porteur',
  );

  // ⚠ ET SA CASE EST LIBRE : la vague 2 entre au tick 50, sur la case même où
  // la passagère se tient.
  assert.equal(caseDepuisMilli(passagere.rangeeMilli), 2, 'la passagère a bougé');
  while (etat.tick < 50 && !etat.termine) tick(etat);
  assert.equal(etat.entites.filter((e) => e.camp === 'attaque').length, 3,
    'la seconde vague est restée en attente : la passagère occupe sa case');
});

// ---------------------------------------------------------------------------
// FG T11 — elle débarque au franchissement, derrière
// ---------------------------------------------------------------------------

test('FG T11 — au franchissement des huit rangées de défense, elle sort DERRIÈRE le porteur', () => {
  // ⚠ LE SEUIL SE LIT DANS LA TABLE, IL NE S'ÉCRIT PAS `11`.
  assert.equal(RANGEE_DEFENSE_FRANCHIE, GRILLE.bandes.batiments.premiere);
  const depart = RANGEE_DEFENSE_FRANCHIE - 1;
  const etat = montage([couple('ratisseur', 5, depart)]);
  const passagere = etat.entites.find((e) => e.embarquee === true);
  const porteur = etat.entites[passagere.porteurIndice];
  const pvAuDepart = passagere.pvMilli;

  let tickDuDebarquement = null;
  for (let t = 1; t <= 60 && tickDuDebarquement === null; t += 1) {
    tick(etat);
    if (passagere.embarquee === false) tickDuDebarquement = t;
  }
  assert.ok(tickDuDebarquement !== null, 'la passagère n\'a jamais débarqué');
  assert.equal(caseDepuisMilli(porteur.rangeeMilli), RANGEE_DEFENSE_FRANCHIE,
    'le porteur n\'était pas sur la première rangée au-delà de la défense');
  assert.equal(caseDepuisMilli(passagere.rangeeMilli), RANGEE_DEFENSE_FRANCHIE - 1,
    'elle ne sort pas derrière le porteur');
  assert.equal(caseDepuisMilli(passagere.colonneMilli), 5, 'elle a changé de colonne');
  assert.equal(passagere.pvMilli, pvAuDepart, 'elle sort abîmée');
  assert.equal(passagere.pvMilli, passagere.pvInitialMilli);
  // ⚠ ET LE JOURNAL LA VOIT ENTRER, par le canal d'une vague : le rendu et le
  // pack sonore n'ont pas à connaître le module.
  assert.ok(
    etat.journal.apparitions.some((f) => f.indice === passagere.indice),
    'la sortie n\'est pas entrée au journal',
  );
});

// ---------------------------------------------------------------------------
// FG T12 — elle débarque à la destruction, sans pénalité
// ---------------------------------------------------------------------------

test('FG T12 — le porteur détruit la rend intacte, une rangée derrière', () => {
  // Le porteur est monté à 1 milli-PV : la Casemate le tue au premier tir.
  const etat = montage([couple('ratisseur', 5, 6, { pvMilli: 1 })], {
    defenseurs: [{ id: 'casemate', rangee: 8, colonne: 5 }],
  });
  const passagere = etat.entites.find((e) => e.embarquee === true);
  const porteur = etat.entites[passagere.porteurIndice];
  const pvAuDepart = passagere.pvMilli;

  tick(etat);
  assert.equal(porteur.vivant, false, 'montage : le porteur a survécu au premier tick');
  assert.equal(passagere.embarquee, false, 'elle est restée dans une épave');
  assert.equal(caseDepuisMilli(passagere.rangeeMilli), 5, 'elle ne sort pas derrière l\'épave');
  assert.equal(caseDepuisMilli(passagere.colonneMilli), 5);
  // ⚠ SANS PÉNALITÉ — Ethan, 08/09 : « dans ce cas, pas de pénalité sur
  // l'infanterie ». Pas un milli-PV n'est retiré.
  assert.equal(passagere.pvMilli, pvAuDepart);
  assert.equal(passagere.pvMilli, passagere.pvInitialMilli);
  assert.equal(passagere.vivant, true);
});

// ---------------------------------------------------------------------------
// FG T13 — l'aéronef largue dessous, sinon derrière
// ---------------------------------------------------------------------------

test('FG T13 — l\'Épervier largue SUR sa case si elle est libre, DERRIÈRE sinon', () => {
  const seuil = RANGEE_DEFENSE_FRANCHIE;

  // ⚠⚠ RÉSERVE VIDE, ET CE N'EST PAS UN DÉTAIL DE MONTAGE. `doitSArreter` rend
  // vrai devant un BÂTIMENT : à réserve pleine, l'Épervier s'arrête à la rangée
  // 10 pour tirer sur celui qui barre sa case et ne franchit JAMAIS la défense —
  // mesuré, la passe 2 restait embarquée soixante ticks. Réserve à zéro,
  // `degatsContre` rend 0 contre un bâtiment, `ciblage` ne lui trouve aucune
  // cible, et il vole.
  function voler(batiments) {
    const etat = montage([couple('busard', 5, seuil - 1, { reserve: 0 })], { batiments });
    const passagere = etat.entites.find((e) => e.embarquee === true);
    for (let t = 1; t <= 60 && passagere.embarquee === true; t += 1) tick(etat);
    return { etat, passagere };
  }

  // Passe 1 — la case du porteur est LIBRE : elle y sort.
  const libre = voler([{ id: 'gangue', rangee: 18, colonne: 1 }]);
  assert.equal(libre.passagere.embarquee, false, 'passe 1 : elle n\'a pas débarqué');
  assert.equal(caseDepuisMilli(libre.passagere.rangeeMilli), seuil,
    'passe 1 : elle ne sort pas SOUS l\'aéronef');

  // Passe 2 — un bâtiment occupe la case du porteur : elle sort derrière.
  const occupee = voler([
    { id: 'gangue', rangee: 18, colonne: 1 },
    { id: 'terril', rangee: seuil, colonne: 5 },
  ]);
  assert.equal(occupee.passagere.embarquee, false, 'passe 2 : elle n\'a pas débarqué');
  assert.equal(caseDepuisMilli(occupee.passagere.rangeeMilli), seuil - 1,
    'passe 2 : elle sort sur une case occupée');
  // ⚠ L'ORDRE DES DEUX ESSAIS EST CE QUI SÉPARE LES DEUX PASSES : inversé, la
  // passe 1 sortirait derrière et la passe 2 aussi.
  assert.notEqual(
    caseDepuisMilli(libre.passagere.rangeeMilli),
    caseDepuisMilli(occupee.passagere.rangeeMilli),
    'les deux passes rendent la même rangée : le montage ne discrimine pas',
  );
});

// ---------------------------------------------------------------------------
// FG T14 — aucune case libre : elle attend
// ---------------------------------------------------------------------------

test('FG T14 — sans case libre elle reste embarquée, et elle sort dès qu\'une case se libère', () => {
  const seuil = RANGEE_DEFENSE_FRANCHIE;
  // Le porteur meurt une rangée au-dessus du seuil ; la case DERRIÈRE lui porte
  // un bâtiment, donc il n'y a nulle part où sortir.
  // ⚠ UNE ALLIÉE DANS UNE AUTRE COLONNE, ET ELLE EST OBLIGATOIRE. Une passagère
  // qui attend n'est PAS un attaquant actif — c'est tout l'objet de `estActive` —
  // donc sans elle `conditionsDeFin` conclut « attaquants » au tick où le
  // porteur meurt, et le combat s'arrête avant qu'aucune case ne se libère.
  const etat = creerCombat({
    niveau: 5,
    batiments: [
      { id: 'terril', rangee: seuil, colonne: 5 },
      { id: 'gangue', rangee: 18, colonne: 1 },
    ],
    defenseurs: [{ id: 'casemate', rangee: 10, colonne: 5 }],
    vagues: [[
      ...couple('ratisseur', 5, seuil + 1, { pvMilli: 1 }),
      { id: 'meute', colonne: 1, rangee: 2 },
    ]],
  });
  const passagere = etat.entites.find((e) => e.embarquee === true);
  const porteur = etat.entites[passagere.porteurIndice];
  const bloqueur = etat.entites.find(
    (e) => e.genre === 'batiment' && caseDepuisMilli(e.rangeeMilli) === seuil,
  );

  tick(etat);
  assert.equal(porteur.vivant, false, 'montage : le porteur a survécu');
  assert.equal(passagere.embarquee, true, 'elle est sortie sur une case occupée');
  assert.equal(passagere.vivant, true, 'elle a été perdue');
  // On réessaie, plusieurs ticks : elle attend, et le combat ne lève pas.
  for (let t = 0; t < 5; t += 1) tick(etat);
  assert.equal(passagere.embarquee, true, 'elle est sortie alors que rien ne s\'est libéré');

  // ⚠ LA CASE SE LIBÈRE — le bâtiment tombe. Le montage force ses PV à zéro :
  // rien dans ce combat-ci ne peut l'abattre, la passagère étant inerte et le
  // porteur mort. C'est l'ÉVÉNEMENT qu'on veut, pas le chemin qui y mène.
  bloqueur.pvMilli = 0;
  tick(etat);
  assert.equal(bloqueur.vivant, false, 'montage : le bâtiment tient encore');
  assert.equal(passagere.embarquee, false, 'elle n\'est pas sortie quand la case s\'est libérée');
  assert.equal(caseDepuisMilli(passagere.rangeeMilli), seuil);
  assert.equal(passagere.pvMilli, passagere.pvInitialMilli);
});

// ---------------------------------------------------------------------------
// FG T15 — le porteur qui rentre emmène sa passagère
// ---------------------------------------------------------------------------

test('FG T15 — replié, le porteur emporte sa passagère, et les deux comptent parmi les survivants', () => {
  const seuil = RANGEE_DEFENSE_FRANCHIE;
  // ⚠ LE PORTEUR NE PEUT NI AVANCER NI NUIRE : un bâtiment lui barre la colonne,
  // et sa réserve est VIDE — `degatsContre` rend 0 contre un bâtiment quand la
  // réserve est épuisée, donc `ciblage` ne lui trouve aucune cible et `aTire`
  // reste faux. C'est la seule façon d'atteindre le repli sans forger l'entité.
  const etat = creerCombat({
    niveau: 5,
    batiments: [{ id: 'gangue', rangee: seuil, colonne: 5 }],
    vagues: [couple('ratisseur', 5, seuil - 1, { reserve: 0 })],
  });
  const passagere = etat.entites.find((e) => e.embarquee === true);
  const porteur = etat.entites[passagere.porteurIndice];

  // ⚠ LE COMPTEUR NE PART QU'AU BLOCAGE, PAS AU PREMIER TICK. Le porteur avance
  // D'ABORD À L'INTÉRIEUR de sa case — `peutAvancer` appelle cela progresser —
  // et ne bute sur le bâtiment qu'au tick où sa case de destination change. Le
  // repli tombe donc une dizaine de ticks après `TICKS_AVANT_REPLI`.
  for (let t = 1; t <= 3 * TICKS_AVANT_REPLI && !porteur.sorti; t += 1) tick(etat);
  assert.equal(porteur.sorti, true, 'le porteur ne s\'est pas replié');
  assert.equal(porteur.aTire, false, 'montage : le porteur a tiré, il ne se replierait pas');
  assert.equal(passagere.sorti, true, 'la passagère est restée sur le terrain');
  // ⚠ ELLE N'A PAS DÉBARQUÉ : elle est RENTRÉE, dans le véhicule.
  assert.equal(passagere.embarquee, true, 'elle a débarqué au lieu de rentrer');
  assert.equal(passagere.vivant, true);

  // Et les deux comptent parmi les survivants du rapport.
  const resultat = resoudre(etat);
  const lignes = resultat.attaquants;
  assert.equal(lignes.length, 2);
  for (const ligne of lignes) {
    assert.equal(ligne.sorti, true, `${ligne.id} n'est pas rentrée`);
    assert.equal(ligne.detruit, false, `${ligne.id} est comptée détruite`);
  }
});

// ---------------------------------------------------------------------------
// FG T16 — le drapeau ouvre l'achat, et lui seul
// ---------------------------------------------------------------------------

test('FG T16 — la Garnison s\'achète en offense, refuse en défense, et le prix vient de la table', () => {
  assert.equal(moduleEstCable('garnison', 'offense'), true);
  assert.equal(moduleEstCable('garnison', 'defense'), false);

  const etat = partie();
  assert.deepEqual(problemesDeLAchat(etat, 'offense', 'ratisseur', 'module'), [],
    'la ligne module de l\'Éclaireur refuse encore en offense');
  acheter(etat, 'offense', 'ratisseur', 'module');
  assert.equal(moduleEstAcquis(etat, 'offense', 'ratisseur'), true);

  // La même ligne EN DÉFENSE refuse toujours — une pièce de garnison n'avance
  // pas, donc elle n'a nulle part où transporter qui que ce soit.
  acheter(etat, 'defense', 'ratisseur', 'unite');
  assert.deepEqual(
    problemesDeLAchat(etat, 'defense', 'ratisseur', 'module').map((p) => p.code),
    ['effetNonCable'],
  );
});

// ---------------------------------------------------------------------------
// FG T17 — ce que l'écran montre de la formation
// ---------------------------------------------------------------------------

test('FG T17 — l\'écran lit la formation, et la case d\'un porteur chargé porte sa passagère', () => {
  const etat = partie();
  acheter(etat, 'offense', 'ratisseur', 'module');
  poser(etat, 'ratisseur', 1, 3);
  poser(etat, 'meute', 1, 4);

  const formation = formationDepuisLArmee(etat);
  const avant = vaguesDeLArmee(etat, formation);
  assert.notEqual(avant[0].cases[3], null, 'montage : la colonne 4 est déjà vide');
  assert.equal(avant[0].cases[2].passager, null);
  assert.equal(avant[0].cases[2].porteur, true, 'l\'Éclaireur n\'est pas reconnu porteur');

  embarquerEnFormation(etat, formation, 1, 0);
  const apres = vaguesDeLArmee(etat, formation);
  assert.equal(apres[0].cases[3], null, 'la passagère occupe encore sa case à l\'écran');
  assert.equal(apres[0].cases[2].passager.id, 'meute', 'le badge ne porte pas la passagère');
  assert.equal(apres[0].cases[2].passager.index, 1);

  // ⚠ ET LA VUE COMPTE CE QUI PART, PAS CE QUI EST POSÉ. Les deux pièces
  // partent, mais une seule occupe une case.
  const vue = vueDuRaid(etat, { rangee: baseCourante(etat).position.rangee, colonne: 1 }, formation);
  assert.equal(vue.engagees, 2, 'la passagère ne compte plus parmi les engagées');

  // ⚠ ET LE REFUS `sans-armee` SE JUGE SUR LA FORMATION : tout désactiver doit
  // le faire apparaître, alors que `etat.armee` reste intacte.
  reglerActiviteEnFormation(formation, 0, false);
  reglerActiviteEnFormation(formation, 1, false);
  const cible = premierCamp(etat);
  assert.ok(cible !== null, 'montage : aucun camp autour de la base');
  assert.ok(
    problemesDuRaid(etat, baseCourante(etat), cible, formation).some((p) => p.code === 'sans-armee'),
    'une formation entièrement désactivée laisse passer le raid',
  );
  assert.deepEqual(
    problemesDuRaid(etat, baseCourante(etat), cible).filter((p) => p.code === 'sans-armee'), [],
    'montage sans mordant : l\'armée elle-même est vide',
  );
});

// ---------------------------------------------------------------------------
// FG T18 — la formation suit ce que l'état change sous elle
// ---------------------------------------------------------------------------

test('FG T18 — une réparation faite après l\'ouverture remonte dans la formation', () => {
  const etat = partie();
  poser(etat, 'meute', 1, 1);
  baseCourante(etat).armee[0].degatsMilli = 400_000;

  const formation = formationDepuisLArmee(etat);
  assert.equal(formation[0].degatsMilli, 400_000, 'montage : la pièce n\'est pas abîmée');

  // L'écran répare : c'est `etat.armee` qui bouge, pas la copie de travail.
  baseCourante(etat).armee[0].degatsMilli = 0;
  assert.equal(formation[0].degatsMilli, 400_000, 'montage : la copie a suivi toute seule');

  resynchroniserLaFormation(etat, formation);
  assert.equal(formation[0].degatsMilli, 0, 'la formation emporterait des dégâts périmés');
  // ⚠ ET ELLE NE REND NI LA CASE NI LE DRAPEAU : ce sont les quatre champs que
  // la formation possède, et les rendre annulerait le geste du joueur.
  deplacerEnFormation(formation, 0, { vague: 4, colonne: 9 });
  reglerActiviteEnFormation(formation, 0, false);
  resynchroniserLaFormation(etat, formation);
  assert.equal(formation[0].vague, 4);
  assert.equal(formation[0].colonne, 9);
  assert.equal(formation[0].actif, false);

  // ⚠⚠ ET L'ÉCRAN L'APPELLE — sans cette moitié, ce test n'assurerait que la
  // fonction que le correctif vient d'écrire, donc il ne pourrait pas échouer.
  // Le dépôt n'a ni jsdom ni navigateur (§3) : la garde lit la SOURCE, comme
  // `RAID-A T6` et `SON T24`.
  const src = readFileSync(new URL('../src/ui/raid.js', import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
  // ⚠⚠ ET ELLE LIT LA CONDITION, PAS SEULEMENT LE NOM. Une première écriture
  // comptait les occurrences : un appel enfermé dans un `if (false)` la laissait
  // VERTE — mesuré. C'est le proxy que le dépôt a déjà payé au lot ÉCRAN-CARTE,
  // et il se referme en nommant le drapeau qui déclenche l'appel.
  assert.match(src, /if \(m\.ecritSurLArmee\) resynchroniserLaFormation\(/,
    'la remise à niveau ne suit plus le drapeau du mode');
  assert.equal((src.match(/resynchroniserLaFormation\(/g) ?? []).length, 2,
    'la remise à niveau n’est plus appelée après les DEUX gestes qui réparent');
  // ⚠ ET LE DRAPEAU QUI LA DÉCLENCHE DIT LA VÉRITÉ SUR LES DEUX MODES : l'un
  // écrit dans l'état, l'autre dans la copie. Les inverser ferait emporter au
  // raid une formation que rien ne remet à niveau, ou écraserait le drapeau
  // d'activité à chaque réparation.
  assert.equal(MODES_RAID.reparer.ecritSurLArmee, true);
  assert.equal(MODES_RAID.activer.ecritSurLArmee, false);
});

// ---------------------------------------------------------------------------
// FG T19 — débarquer en préparation
// ---------------------------------------------------------------------------

test('FG T19 — une passagère se débarque sur une case libre, et pas sur une case prise', () => {
  const etat = partie();
  acheter(etat, 'offense', 'ratisseur', 'module');
  poser(etat, 'ratisseur', 1, 3);
  poser(etat, 'meute', 1, 4);
  poser(etat, 'fendeur', 2, 2);

  const formation = formationDepuisLArmee(etat);
  embarquerEnFormation(etat, formation, 1, 0);
  assert.equal(estPassager(formation[1]), true);
  assert.equal(passagerDe(formation, 0), 1);
  assert.equal(estPorteur(etat, 'ratisseur'), true);
  assert.equal(estPorteur(etat, 'fendeur'), false);

  // Une case prise refuse.
  assert.ok(
    problemesDuDebarquementEnFormation(formation, 1, { vague: 2, colonne: 2 })
      .some((p) => p.code === 'superposition'),
    'débarquer sur une case occupée est accepté',
  );
  // Une case libre accepte, et la passagère y reprend sa place.
  debarquerEnFormation(formation, 1, { vague: 2, colonne: 5 });
  assert.equal(formation[1].embarqueDans, null);
  assert.deepEqual(
    { vague: formation[1].vague, colonne: formation[1].colonne }, { vague: 2, colonne: 5 });
  assert.equal(passagerDe(formation, 0), null, 'le porteur transporte encore quelqu\'un');
  // ⚠⚠ ET UNE PASSAGÈRE NE SE DÉPLACE NI NE SE PERMUTE DIRECTEMENT : les deux
  // LÈVENT. On attendait que ses `null` suffisent ; ils ne suffisent pas — la
  // position donnée les écrase — et la garde est donc écrite. Un porteur CHARGÉ,
  // lui, se permute : sa passagère n'a pas de case et le suit sans écriture.
  const seconde = formationDepuisLArmee(etat);
  embarquerEnFormation(etat, seconde, 1, 0);
  assert.throws(
    () => problemesDuDeplacementEnFormation(seconde, 1, { vague: 2, colonne: 5 }),
    /est embarquée/, 'une passagère se déplace sans débarquer',
  );
  assert.throws(
    () => problemesDeLaPermutationEnFormation(seconde, 1, 2),
    /est embarquée/, 'une passagère se permute sans débarquer',
  );
  assert.deepEqual(problemesDeLaPermutationEnFormation(seconde, 0, 2), [],
    'un porteur chargé ne se permute plus');
  permuterEnFormation(seconde, 0, 2);
  assert.equal(passagerDe(seconde, 0), 1, 'la passagère a perdu son porteur à la permutation');
});

// ---------------------------------------------------------------------------
// FG T20 — une passagère n'entre jamais avant son porteur
// ---------------------------------------------------------------------------

test('FG T20 — porteur retenu à l\'apparition : la passagère attend avec lui, puis entre derrière', () => {
  // ⚠⚠ C'EST LE SEUL MONTAGE OÙ LA GARDE D'APPARITION MORD, ET IL A FALLU LE
  // CHERCHER. Un porteur n'est retenu que si sa case d'entrée est PRISE au
  // moment où sa vague paraît : impossible en vague 1 — `creerCombat` refuse
  // deux entités sur une case —, donc il faut une vague 2 dont la colonne est
  // encore tenue par une alliée de la vague 1. Sans ce montage, `libre = true`
  // pour une passagère passait toutes les autres mesures du lot.
  //
  // ⚠ LE MUR NE TIRE PAS — `merlon.degats` vaut `null` —, donc l'alliée de la
  // vague 1 reste plantée devant lui au lieu d'être tuée : le blocage dure ce
  // qu'on veut, et il ne dépend d'aucune table de dégâts.
  const etat = creerCombat({
    niveau: 5,
    batiments: [{ id: 'gangue', rangee: 18, colonne: 1 }],
    defenseurs: [{ id: 'merlon', rangee: 3, colonne: 5 }],
    vagues: [
      [{ id: 'meute', colonne: 5, rangee: 2 }],
      couple('ratisseur', 5, 2),
    ],
  });
  const attaquants = () => etat.entites.filter((e) => e.camp === 'attaque');
  assert.equal(attaquants().length, 1, 'montage : la vague 1 n\'est pas entrée seule');

  // Au tick de la vague 2, la case (2, 5) est encore prise : les DEUX attendent.
  while (etat.tick < 55 && !etat.termine) tick(etat);
  assert.equal(attaquants().length, 1,
    'la passagère est entrée sans son porteur : l\'appariement des dégâts est rompu');
  assert.equal(etat.enAttente.length, 2, 'les deux descripteures n\'attendent pas ensemble');
  assert.equal(etat.enAttente[0].embarquee, undefined);
  assert.equal(etat.enAttente[1].embarquee, true);

  // ⚠ LA CASE SE LIBÈRE — le mur tombe, l'alliée repart. Le montage force ses PV
  // à zéro : rien ici ne peut l'abattre, et c'est l'ÉVÉNEMENT qu'on veut.
  const mur = etat.entites.find((e) => e.id === 'merlon');
  mur.pvMilli = 0;
  while (etat.tick < 120 && attaquants().length < 3 && !etat.termine) tick(etat);

  assert.equal(attaquants().length, 3, 'le porteur et sa passagère ne sont jamais entrés');
  const [porteur, passagere] = attaquants().slice(1);
  assert.equal(porteur.id, 'ratisseur', 'le porteur n\'est pas entré le premier');
  assert.equal(passagere.embarquee, true);
  // ⚠ ET LEURS INDICES SONT CONSÉCUTIFS, DANS CET ORDRE : c'est très exactement
  // ce que `composerLesVagues` a rangé dans `indices`, et ce que
  // `construireResultat` rendra.
  assert.equal(passagere.indice, porteur.indice + 1);
  assert.equal(passagere.porteurIndice, porteur.indice);
});
