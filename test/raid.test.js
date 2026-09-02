// L'acte de raid — payer, partir, encaisser, revenir abîmé.
//
// C'est le lot qui referme la boucle : après lui, un raid se joue de bout en
// bout en simulation. Les tests suivent l'ordre des cinq écritures.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  problemesDuRaid, executerRaid, simulerRaid, composerLesVagues, pvMaxDeLUnite,
  creerRecherche, rechercheMilli, montageDuRaid,
} from '../src/sim/raid.js';
import { ciblageDuSite, lignesDuSite } from '../src/ui/monde.js';
import { lignesDuResultat, LIBELLE_VERDICT } from '../src/ui/raid.js';
import { butinSiToutTombe, forceDeLaDefense } from '../src/sim/site-de-la-case.js';
import { coutDUnRaid } from '../src/sim/points-attaque.js';
import {
  creerEtat, rattraperJeu, serialiser, charger, migrer, SAVE_VERSION,
  poserEffectif, problemesDeLaPoseDEffectif, reglerActivite,
  problemesDuDeplacementDEffectif, tickJeu,
} from '../src/sim/state.js';
import { niveauDeLArmee } from '../src/sim/niveau-de-base.js';
import { plafondDeLaReserve, crediterLesReserves } from '../src/sim/reparation.js';
import { basesDeLaFenetre as basesFenetre } from '../src/sim/peuplement.js';
import { siteDeLaCase } from '../src/sim/site-de-la-case.js';
import { basesDeLaFenetre } from '../src/sim/peuplement.js';
import { estAPorteeDAttaque } from '../src/sim/points-attaque.js';
import { etatDuSite, montageCourant } from '../src/sim/site-entame.js';
import { capacitesMilli } from '../src/sim/economie-base.js';
import { APRES_RAID, GEOGRAPHIE, BATIMENTS } from '../src/data/sites.js';
import { GRILLE } from '../src/data/combat.js';
import { gratuitesDe } from '../src/data/recherche.js';

/** Une partie dont les satellites sont parus, avec une armée posée. */
function partieArmee(graine = 2026, unites = 6, niveau = 1) {
  const etat = creerEtat(graine);
  rattraperJeu(etat, 3001);
  for (let c = 1; c <= unites; c += 1) {
    etat.armee.push({ id: 'meute', vague: 1, colonne: c, niveau, degatsMilli: 0 });
  }
  assert.equal(etat.satellites.presents.length, 3, 'montage : les satellites ne sont pas parus');
  return etat;
}

/** Le premier camp autour de la base. */
function premierCamp(etat) {
  // ⚠ ELLE REND `null` PLUTÔT QUE DE LEVER SUR UN `undefined`. Un camp peut
  // avoir été rasé — c'est le cas depuis que les tests en enchaînent onze —, et
  // un appelant doit pouvoir le dire dans son propre message plutôt que de
  // buter sur « cannot read properties of undefined ».
  const s = etat.satellites.presents.find((x) => x.type === 'camp');
  return s === undefined ? null : { rangee: s.rangee, colonne: s.colonne };
}

test('refus — les quatre raisons de ne pas partir, et chacune se dit', () => {
  const etat = partieArmee();
  const cible = premierCamp(etat);
  assert.deepEqual(problemesDuRaid(etat, etat, cible), [], 'ce raid-là doit être possible');

  // Une case vide n'est pas une cible.
  const vide = { rangee: etat.position.rangee, colonne: etat.position.colonne + 7 };
  assert.equal(problemesDuRaid(etat, etat, vide)[0].code, 'sans-cible');

  // ⚠ HORS DE PORTÉE SE MESURE SUR UNE VRAIE CIBLE, et le premier jet de ce
  // test ne le faisait pas : une case lointaine et VIDE rend « sans-cible », pas
  // « hors-portee », parce que l'absence de cible se dit en premier. Il faut
  // donc aller chercher une base de l'Ouvrage au-delà du rayon.
  const loin = basesDeLaFenetre(etat.graine, {
    premiereRangee: 200, derniereRangee: 210, premiereColonne: 1, derniereColonne: 31,
  })[0];
  assert.ok(loin, 'montage : aucune base de l\'Ouvrage dans la fenêtre');
  // ⚠ BASELINE REMESURÉE AU LOT EUCLIDE : la portée se teste en ligne droite
  // désormais, et c'est `estAPorteeDAttaque` qui décide. Mesurer ici en
  // Tchebychev laisserait passer un montage où la cible est HORS du carré mais
  // DANS le disque — ou l'inverse —, donc un test qui attend « hors-portee » sur
  // une cible atteignable.
  assert.equal(estAPorteeDAttaque(etat.position, loin), false);
  assert.ok(siteDeLaCase(etat, loin.rangee, loin.colonne), 'la cible lointaine doit exister');
  assert.equal(problemesDuRaid(etat, etat, loin)[0].code, 'hors-portee');

  // Sans points : le message dit combien il en manque, il ne dit pas « non ».
  //
  // ⚠ BASELINE REMESURÉE AU LOT EUCLIDE, ET AUTREMENT QU'EN RECOPIANT LE NOUVEAU
  // NOMBRE. Le manque était figé à 9 ; le camp que `premierCamp` rend a changé de
  // case avec les anneaux, donc le coût aussi. Le figer à nouveau le referait
  // bouger au prochain lot qui touche la carte. Le manque se DÉDUIT du coût, ce
  // qui garde ce que le test gardait — le message porte le CHIFFRE, pas un
  // « non ».
  etat.attaque.points = 3;
  const cout = coutDUnRaid(etat, etat, cible);
  const sansPoints = problemesDuRaid(etat, etat, cible);
  assert.equal(sansPoints[0].code, 'points-insuffisants');
  assert.ok(cout > 3, 'le montage ne mesure rien : le raid est payable avec 3 points');
  assert.match(sansPoints[0].message, new RegExp(`manque ${cout - 3}\\b`), sansPoints[0].message);

  // Sans armée en état de partir.
  etat.attaque.points = 100;
  etat.armee = [];
  assert.equal(problemesDuRaid(etat, etat, cible)[0].code, 'sans-armee');
  // Et `executerRaid` lève sur ce que `problemesDuRaid` refuse.
  assert.throws(() => executerRaid(etat, etat, cible), /raid impossible/);
});

test('vagues — l\'armée posée entre dans l\'ordre, l\'unité au plancher reste', () => {
  const etat = partieArmee(2026, 0);
  // Posées dans le désordre exprès : vague 2 avant vague 1, colonnes mêlées.
  etat.armee.push({ id: 'meute', vague: 2, colonne: 3, niveau: 1, degatsMilli: 0 });
  etat.armee.push({ id: 'meute', vague: 1, colonne: 5, niveau: 1, degatsMilli: 0 });
  etat.armee.push({ id: 'meute', vague: 1, colonne: 2, niveau: 1, degatsMilli: 0 });

  const { vagues, indices } = composerLesVagues(etat);
  assert.equal(vagues.length, 2, 'deux vagues posées, deux vagues montées');
  assert.deepEqual(vagues[0].map((u) => u.colonne), [2, 5], 'la vague 1 n\'est pas triée');
  assert.deepEqual(vagues[1].map((u) => u.colonne), [3]);
  // Les indices suivent le MÊME ordre que les unités montées.
  assert.deepEqual(indices, [2, 1, 0]);

  // ⚠ UNE UNITÉ AU PLANCHER NE PART PAS, ET N'EST PAS RETIRÉE. Montage
  // falsifiable : on l'abîme jusqu'au plancher exact, pas au-delà.
  const pvMax = pvMaxDeLUnite('meute', 1);
  etat.armee[1].degatsMilli = pvMax - APRES_RAID.plancherPvMilli;
  const apres = composerLesVagues(etat);
  assert.equal(apres.indices.length, 2, 'l\'unité au plancher est partie quand même');
  assert.equal(etat.armee.length, 3, 'elle a été retirée de l\'armée');

  // Une unité seulement ABÎMÉE part, avec ses PV.
  etat.armee[1].degatsMilli = Math.floor(pvMax / 2);
  const abimee = composerLesVagues(etat);
  assert.equal(abimee.indices.length, 3);
  assert.equal(abimee.vagues[0].find((u) => u.colonne === 5).pvMilli, pvMax - Math.floor(pvMax / 2));
  // Et une unité INTACTE ne porte pas de `pvMilli` : elle passe par le chemin
  // ordinaire, celui des raids de référence.
  assert.equal(abimee.vagues[0].find((u) => u.colonne === 2).pvMilli, undefined);
});

test('paiement — on paie avant de partir, et un raid raté coûte quand même', () => {
  const etat = partieArmee();
  const cible = premierCamp(etat);
  const avant = etat.attaque.points;

  const rapport = executerRaid(etat, etat, cible);
  // Le camp est dans la zone d'influence : 10 fixes + 1 par case.
  assert.ok(rapport.cout >= 11 && rapport.cout <= 12, `coût ${rapport.cout}`);
  assert.equal(etat.attaque.points, avant - rapport.cout);
  assert.equal(rapport.pointsRestants, etat.attaque.points);

  // ⚠ FALSIFIABLE : le raid ci-dessus ne rase PAS le site — six Meutes de
  // niveau 1 n'en viennent pas à bout. Il a donc coûté ses points pour un
  // résultat partiel, ce qui est exactement la règle.
  assert.equal(rapport.rase, false, 'montage sans mordant : le camp est tombé du premier coup');
  assert.ok(rapport.cause !== 'souche');
});

test('butin — il sature, et le rapport DIT ce qui n\'est pas rentré', () => {
  const etat = partieArmee();
  const capacites = capacitesMilli(etat.disposition);
  const avant = { ...etat.economie.ressources };

  const rapport = executerRaid(etat, etat, premierCamp(etat));

  // ⚠ MONTAGE FALSIFIABLE, ET IL MORD FORT : un camp de niveau 1 rapporte
  // largement plus que le coffre d'une base neuve. Il DOIT donc y avoir de la
  // perte, sinon ce test ne mesurerait rien.
  assert.ok(Object.keys(rapport.butinPerdu).length > 0, 'rien n\'a débordé : montage sans mordant');

  for (const r of ['quartz', 'scorie']) {
    const cap = capacites[r];
    assert.ok(etat.economie.ressources[r] <= Math.max(cap, avant[r]), `${r} au-dessus du plafond`);
    // Ce qui est entré plus ce qui est perdu fait le butin complet — rien ne
    // disparaît sans être compté.
    const entre = (etat.economie.ressources[r] - avant[r]) / 1000;
    assert.equal(entre, rapport.butin[r] ?? 0, `${r} : le rapport ment sur ce qui est entré`);
  }
});

test('butin — un stock DÉJÀ au-dessus du plafond n\'est pas rogné', () => {
  // L'arbitrage du 26/08 : le surplus gèle, il ne se rabat pas. Un raid ne doit
  // pas devenir l'occasion de le rogner.
  const etat = partieArmee();
  const capacites = capacitesMilli(etat.disposition);
  etat.economie.ressources.quartz = capacites.quartz * 3;
  const avant = etat.economie.ressources.quartz;

  const rapport = executerRaid(etat, etat, premierCamp(etat));
  assert.equal(etat.economie.ressources.quartz, avant, 'le surplus a été rogné');
  assert.ok((rapport.butinPerdu.quartz ?? 0) > 0, 'la perte n\'est pas rapportée');
});

test('recherche — elle s\'accumule en chaîne décimale, et reste exacte', () => {
  const etat = partieArmee();
  assert.deepEqual(etat.recherche, creerRecherche());

  const un = executerRaid(etat, etat, premierCamp(etat));
  assert.ok(BigInt(un.rechercheMilli) > 0n, 'ce raid n\'a rapporté aucune recherche');
  assert.equal(rechercheMilli(etat), BigInt(un.rechercheMilli));

  // ⚠ LE COMPTEUR EST UN BigInt, ET LE TEST LE PROUVE AU-DELÀ DE L'ENTIER SÛR.
  // Le total dépasse `Number.MAX_SAFE_INTEGER` : un Number ne garantirait plus
  // le dernier chiffre, la chaîne décimale si.
  const enorme = (BigInt(Number.MAX_SAFE_INTEGER) * 1000n + 1n).toString();
  etat.recherche.pointsMilli = enorme;
  const deux = executerRaid(etat, etat, premierCamp(etat));
  assert.equal(rechercheMilli(etat), BigInt(enorme) + BigInt(deux.rechercheMilli));
  assert.ok(rechercheMilli(etat) > BigInt(Number.MAX_SAFE_INTEGER),
    'montage sans mordant : ce total tient dans un entier sûr');
  assert.notEqual(
    Number(rechercheMilli(etat)).toString(), rechercheMilli(etat).toString(),
    'ce total-là se laisse encore écrire en Number',
  );

  // Et il traverse la sauvegarde sans perdre un chiffre.
  const recharge = charger(serialiser(etat, 3_000_000), 3_000_000);
  assert.equal(recharge.recherche.pointsMilli, etat.recherche.pointsMilli);
});

test('armée — les dégâts reviennent sur les BONNES pièces', () => {
  // ⚠ MONTAGE FALSIFIABLE : deux niveaux très différents dans la même armée,
  // donc deux PV maximaux très différents. Un appariement décalé donnerait à une
  // pièce des dégâts supérieurs à ses propres PV — ce que la dernière assertion
  // interdit.
  const etat = partieArmee(2026, 0);
  for (let c = 1; c <= 4; c += 1) {
    etat.armee.push({ id: 'meute', vague: 1, colonne: c, niveau: c <= 2 ? 1 : 12, degatsMilli: 0 });
  }
  const pvBas = pvMaxDeLUnite('meute', 1);
  const pvHaut = pvMaxDeLUnite('meute', 12);
  assert.ok(pvHaut > pvBas * 2, 'montage sans mordant : les deux niveaux se ressemblent trop');

  const rapport = executerRaid(etat, etat, premierCamp(etat));
  assert.equal(rapport.unitesEngagees, 4);

  for (const piece of etat.armee) {
    const pvMax = pvMaxDeLUnite(piece.id, piece.niveau);
    assert.ok(piece.degatsMilli >= 0, 'dégâts négatifs');
    assert.ok(
      piece.degatsMilli <= pvMax - APRES_RAID.plancherPvMilli,
      `une Meute de niveau ${piece.niveau} porte ${piece.degatsMilli} dégâts sur ${pvMax} PV`,
    );
  }
  // Et au moins une a souffert, sinon rien n'a été mesuré.
  assert.ok(etat.armee.some((p) => p.degatsMilli > 0), 'personne n\'a été touché');
});

test('armée — une unité détruite plancher à 1 PV et RESTE dans l\'armée', () => {
  // ⚠⚠ CE MONTAGE A PERDU SON MORDANT LE 31/08, ET IL A FALLU LE LUI RENDRE.
  // Il envoyait six Meutes de niveau 1 sur le camp d'une base neuve, dont le
  // niveau suit celui du JOUEUR — donc 1 lui aussi. Que quelqu'un tombe tenait
  // alors au dessin du site, c'est-à-dire à la CASE : quand Ethan a rapproché le
  // départ du bord bas (rangée 275 → 295), les anneaux ont suivi, le camp a
  // changé de case, et plus personne ne mourait. Le test mesurait le hasard.
  //
  // ⚠ ON MONTE DONC LA BASE, PAS L'ARMÉE, et c'est la règle du jeu qui rend le
  // montage lethal : un camp est indexé sur le niveau du JOUEUR (« le filet de
  // sécurité, il doit rester à sa portée »). Des bâtiments au niveau 12 contre
  // une armée au niveau 1 font une défense qui tue, où que la case tombe.
  //
  // ⚠ ET LA MONTÉE PRÉCÈDE LE RATTRAPAGE : le niveau d'un satellite se fixe au
  // moment où il PARAÎT. La poser après laisserait un camp de niveau 1.
  const etat = creerEtat(2026);
  for (const b of etat.disposition) b.niveau = 12;
  rattraperJeu(etat, 3001);
  for (let c = 1; c <= 6; c += 1) {
    etat.armee.push({ id: 'meute', vague: 1, colonne: c, niveau: 1, degatsMilli: 0 });
  }
  assert.equal(etat.satellites.presents.length, 3, 'montage : les satellites ne sont pas parus');

  const rapport = executerRaid(etat, etat, premierCamp(etat));

  assert.equal(etat.armee.length, 6, 'une pièce a été retirée de l\'armée');
  assert.ok(rapport.unitesAuPlancher > 0, 'montage sans mordant : personne n\'est tombé');
  const pvMax = pvMaxDeLUnite('meute', 1);
  const auPlancher = etat.armee.filter((p) => p.degatsMilli === pvMax - APRES_RAID.plancherPvMilli);
  assert.equal(auPlancher.length, rapport.unitesAuPlancher);
  // ⚠ JAMAIS PLUS QUE LE PLANCHER : `degatsMilli === pvMax` voudrait dire zéro
  // PV, et l'unité ne pourrait plus jamais être montée.
  for (const p of etat.armee) assert.ok(p.degatsMilli < pvMax);
});

test('deux raids — le second part sur ce que le premier a laissé', () => {
  const etat = partieArmee(2026, 6);
  const cible = premierCamp(etat);
  const un = executerRaid(etat, etat, cible);
  assert.equal(un.rase, false);
  const entamé = etatDuSite(etat, siteDeLaCase(etat, cible.rangee, cible.colonne));
  assert.ok(entamé, 'le premier raid n\'a rien laissé derrière lui');

  // On répare l'armée à la main — ce lot ne fait pas la réparation — et on
  // repart. Le second raid doit trouver moins de défense qu'au premier.
  for (const p of etat.armee) p.degatsMilli = 0;
  const deux = executerRaid(etat, etat, cible);
  assert.equal(deux.cout, un.cout, 'le prix ne dépend pas de l\'état du site');
  assert.ok(deux.ticks < un.ticks || deux.rase,
    `second raid : ${deux.ticks} ticks contre ${un.ticks}`);
});

test('rasage — le satellite disparaît et son remplaçant est programmé', () => {
  // Une armée franchement surdimensionnée pour un camp de niveau 1.
  const etat = partieArmee(2026, 0);
  for (let v = 1; v <= 4; v += 1) {
    for (let c = 1; c <= 9; c += 1) {
      etat.armee.push({ id: 'meute', vague: v, colonne: c, niveau: 20, degatsMilli: 0 });
    }
  }
  const cible = premierCamp(etat);
  const avant = etat.satellites.presents.length;
  const rapport = executerRaid(etat, etat, cible);

  assert.equal(rapport.rase, true, `montage sans mordant : ${rapport.cause} au tick ${rapport.ticks}`);
  assert.equal(rapport.cause, 'souche');
  assert.equal(etat.satellites.presents.length, avant - 1);
  assert.equal(etat.satellites.attentes.length, 1, 'aucun remplaçant programmé');
  assert.equal(siteDeLaCase(etat, cible.rangee, cible.colonne), null);
});

test('état — le compteur de recherche se migre depuis une v11', () => {
  // ⚠ LA GARDE DU NUMÉRO APPARTIENT AU MAILLON LE PLUS RÉCENT, une seule fois —
  // trois fichiers l'ont apprise à leurs dépens. Ici on vérifie que le maillon
  // v11 → v12 est dans la chaîne, et que la chaîne va jusqu'au bout.
  assert.ok(SAVE_VERSION >= 12, 'le maillon v11 → v12 n\'est plus dans la chaîne');
  const migre = migrer({ version: 11 });
  assert.equal(migre.version, SAVE_VERSION);
  assert.equal(migre.recherche.pointsMilli, '0');
  assert.equal(typeof migre.recherche.pointsMilli, 'string', 'un nombre ne traverserait pas');
  // ⚠ ET LE MAILLON v13 → v14 A COMPLÉTÉ LA FORME. Une sauvegarde v11 n'a ni
  // Centre de commandement ni QG — `migrer` reçoit ici un objet quasi vide —,
  // donc la migration ne pose que les GRATUITES. Asserter la seule présence des
  // champs laisserait passer une migration qui les crée vides.
  assert.deepEqual(migre.recherche.acquises,
    { offense: gratuitesDe('offense').sort(), defense: gratuitesDe('defense').sort() });
  assert.deepEqual(migre.recherche.modules, { offense: [], defense: [] });
});

// ---------------------------------------------------------------------------
// RAID-0 — simuler sans commettre, et laisser une unité à la maison
// ---------------------------------------------------------------------------

/** L'instant mural des sérialisations de ce bloc. */
const T_RAID0 = 4_000_000;

/**
 * Une partie posée AU MILIEU du couloir, où les bases de l'Ouvrage sont à
 * portée et de niveaux variés.
 *
 * ⚠ AU DÉPART, TROIS NIVEAUX DIFFÉRENTS SONT INATTEIGNABLES, et c'est une
 * propriété de la carte, pas une paresse de montage : la garde du peuplement
 * écarte les bases de l'Ouvrage de quinze cases du départ, et la strate y vaut
 * 1 — il n'y a que deux camps de niveau 1 et un avant-poste de niveau 2 à
 * portée. Mesuré. On déplace donc la base sur le couloir, ce qui est la seule
 * façon honnête d'avoir des cibles de niveaux distincts.
 */
function partieAuMilieu(rangee = 200, graine = 2026) {
  const etat = creerEtat(graine);
  rattraperJeu(etat, 3001);
  for (let c = 1; c <= 6; c += 1) {
    etat.armee.push({ id: 'meute', vague: 1, colonne: c, niveau: 1, degatsMilli: 0 });
  }
  etat.position = { rangee, colonne: 16 };
  etat.attaque.points = 1_000_000;
  return etat;
}

/** Les cibles à portée d'une partie, une par niveau demandé. */
function ciblesParNiveau(etat, niveaux) {
  const r = GEOGRAPHIE.rayonAttaque;
  const p = etat.position;
  const bases = basesFenetre(etat.graine, {
    premiereRangee: p.rangee - r,
    derniereRangee: p.rangee + r,
    premiereColonne: Math.max(1, p.colonne - r),
    derniereColonne: p.colonne + r,
    // ⚠ LE FILTRE SUIT LA RÈGLE, IL NE LA RÉÉCRIT PAS. Il mesurait en Tchebychev
    // et rendait donc des cibles que `problemesDuRaid` refuse depuis le lot
    // EUCLIDE — le montage fabriquait des cas impossibles.
  }).filter((b) => estAPorteeDAttaque(p, b));

  const sortie = [];
  for (const niveau of niveaux) {
    const trouvee = bases.find((b) => {
      const site = siteDeLaCase(etat, b.rangee, b.colonne);
      return site !== null && site.niveau === niveau
        && problemesDuRaid(etat, etat, b).length === 0
        && !sortie.some((x) => x.rangee === b.rangee && x.colonne === b.colonne);
    });
    assert.ok(trouvee, `montage : aucune cible de niveau ${niveau} à portée`);
    sortie.push({ rangee: trouvee.rangee, colonne: trouvee.colonne, niveau });
  }
  return sortie;
}

test('RAID-0 T1 — simuler et exécuter rendent le MÊME rapport, cible par cible', () => {
  const cibles = ciblesParNiveau(partieAuMilieu(), [18, 20, 22]);
  // Falsifiable : les trois niveaux doivent être DISTINCTS, sinon « trois
  // cibles » ne mesurerait qu'une seule situation répétée.
  assert.equal(new Set(cibles.map((c) => c.niveau)).size, 3);

  for (const cible of cibles) {
    const simule = simulerRaid(partieAuMilieu(), partieAuMilieu(), cible);
    const reel = executerRaid(partieAuMilieu(), partieAuMilieu(), cible);

    assert.equal(simule.simule, true, 'le rapport simulé doit se dire simulé');
    const { simule: drapeau, ...sansDrapeau } = simule;
    assert.equal(drapeau, true);
    // ⚠ CHAMP PAR CHAMP, SUR TOUT LE RAPPORT. Comparer deux ou trois champs
    // choisis laisserait passer une divergence sur celui qu'on n'a pas nommé.
    assert.deepEqual(sansDrapeau, reel, `divergence sur la cible de niveau ${cible.niveau}`);

    // Falsifiable : le raid doit avoir FAIT quelque chose, sinon deux rapports
    // vides seraient égaux sans rien prouver.
    assert.ok(reel.ticks > 0, 'montage sans mordant : le combat n\'a pas eu lieu');
    assert.ok(reel.unitesEngagees > 0, 'montage sans mordant : personne n\'est parti');
  }
});

test('RAID-0 T2 — l\'état réel est INTACT après une simulation', () => {
  const etat = partieAuMilieu();
  const cible = ciblesParNiveau(etat, [20])[0];

  // ⚠ CHAÎNE CONTRE CHAÎNE, PAS `deepEqual`. C'est ce qui prouve que
  // `structuredClone` ne laisse rien fuir : un objet partagé par référence
  // passerait un `deepEqual` fait avant la mutation, pas une sérialisation
  // prise après.
  const avant = serialiser(etat, T_RAID0);
  const rapport = simulerRaid(etat, etat, cible);
  const apres = serialiser(etat, T_RAID0);
  assert.equal(avant, apres, 'la simulation a écrit dans l\'état réel');

  // Falsifiable : le raid simulé doit avoir des CONSÉQUENCES, sinon « rien n'a
  // bougé » serait vrai de n'importe quel code. On le prouve en exécutant le
  // même raid pour de bon, et en mesurant que là, ça bouge.
  assert.ok(rapport.ticks > 0, 'montage sans mordant : le combat simulé n\'a pas eu lieu');
  const temoin = partieAuMilieu();
  const avantTemoin = serialiser(temoin, T_RAID0);
  executerRaid(temoin, temoin, cible);
  assert.notEqual(serialiser(temoin, T_RAID0), avantTemoin,
    'montage sans mordant : même un vrai raid ne change pas l\'état');
});

test('RAID-0 T3 — simuler ne consomme rien, pas même un point d\'attaque', () => {
  const cible = ciblesParNiveau(partieAuMilieu(), [20])[0];

  const avecSimulation = partieAuMilieu();
  const pointsAvant = avecSimulation.attaque.points;
  simulerRaid(avecSimulation, avecSimulation, cible);
  assert.equal(avecSimulation.attaque.points, pointsAvant,
    'la simulation a payé des points d\'attaque');
  // ⚠ ON SIMULE PLUSIEURS FOIS, comme le joueur le fera en ajustant sa
  // composition : c'est le cas où une fuite de paiement se verrait le plus.
  simulerRaid(avecSimulation, avecSimulation, cible);
  simulerRaid(avecSimulation, avecSimulation, cible);
  assert.equal(avecSimulation.attaque.points, pointsAvant);

  const apresSimulation = executerRaid(avecSimulation, avecSimulation, cible);
  const direct = partieAuMilieu();
  const sansSimulation = executerRaid(direct, direct, cible);
  assert.deepEqual(apresSimulation, sansSimulation,
    'trois simulations ont changé ce que le vrai raid rend');
  assert.equal(avecSimulation.attaque.points, direct.attaque.points);
});

test('RAID-0 T4 — une pièce désactivée ne monte pas dans les vagues', () => {
  const etat = partieAuMilieu();
  const avant = composerLesVagues(etat);
  assert.equal(avant.indices.length, 6, 'montage : six unités doivent partir');

  // ⚠ PAR LE GESTE PERMIS, pas en écrivant le champ dans un état fabriqué.
  reglerActivite(etat, 'armee', 2, false);
  const apres = composerLesVagues(etat);
  assert.equal(apres.indices.length, 5, 'la pièce désactivée est quand même partie');
  assert.ok(!apres.indices.includes(2), 'l\'indice de la pièce désactivée est resté');

  // ⚠ ELLE RESTE DANS L'ARMÉE — arbitré le 28/08 pour les unités détruites, et
  // c'est la même règle : « détruites mais pas perdues ». Ni retirée, ni
  // déplacée, ni oubliée.
  assert.equal(etat.armee.length, 6, 'la pièce désactivée a été retirée de l\'armée');
  assert.equal(etat.armee[2].actif, false);

  // Et elle repart dès qu'on la réactive.
  reglerActivite(etat, 'armee', 2, true);
  assert.deepEqual(composerLesVagues(etat).indices, avant.indices);
});

test('RAID-0 T5 — une pièce SANS le champ part quand même', () => {
  // ⚠⚠ C'EST CE TEST QUI ATTRAPE `!piece.actif`, ET T4 NE LE PEUT PAS. Une
  // pièce venue d'une sauvegarde v17 non migrée porte `actif === undefined` :
  // écrit `!piece.actif`, le filtre la garderait à la maison sans que personne
  // l'ait demandé. Le montage la pose donc À LA MAIN, sans le champ, parce
  // qu'aucun geste du jeu ne produit plus une pièce pareille — c'est justement
  // l'état d'une sauvegarde d'avant ce lot.
  const etat = partieAuMilieu();
  for (const piece of etat.armee) {
    assert.equal(piece.actif, undefined, 'montage : les pièces ne doivent pas porter le champ');
  }
  assert.equal(composerLesVagues(etat).indices.length, 6,
    'une pièce sans le champ « actif » est restée à la maison');

  // Et `false` est le SEUL mot qui retient : ni zéro, ni la chaîne vide.
  const bizarre = partieAuMilieu();
  bizarre.armee[0].actif = true;
  bizarre.armee[1].actif = undefined;
  assert.equal(composerLesVagues(bizarre).indices.length, 6);
});

test('RAID-0 T6 — désactiver ne fait pas monter le niveau d\'armée, ni le plafond', () => {
  // ⚠⚠ C'EST UN EXPLOIT QUE CE LOT OUVRE ET QUE CETTE DÉCISION REFERME. Si les
  // inactives sortaient de la moyenne, désactiver ses unités de bas niveau
  // ferait MONTER le niveau d'armée, donc monter le plafond de réserve de
  // réparation — deux clics pour douze heures de réserve en plus.
  const etat = partieAuMilieu();
  etat.armee = [];
  poserEffectif(etat, 'armee', { id: 'meute', vague: 1, colonne: 1, niveau: 1 });
  poserEffectif(etat, 'armee', { id: 'meute', vague: 1, colonne: 2, niveau: 21 });
  // Falsifiable : les deux niveaux doivent être TRÈS différents, sinon retirer
  // le petit ne bougerait pas assez la moyenne pour se voir.
  assert.equal(niveauDeLArmee(etat.armee), 110, 'montage : moyenne 11,0 attendue');
  const plafondAvant = plafondDeLaReserve(etat);

  reglerActivite(etat, 'armee', 0, false); // on laisse le niveau 1 à la maison
  assert.equal(niveauDeLArmee(etat.armee), 110,
    'le niveau d\'armée a bougé : les inactives sont sorties de la moyenne');
  assert.equal(plafondDeLaReserve(etat), plafondAvant,
    'le plafond de réserve a bougé — l\'exploit est ouvert');

  // Et la mesure du contre-exemple : si on la RETIRAIT vraiment, ça monterait.
  // C'est ce qui prouve que le test mesure quelque chose.
  const ampute = { ...etat, armee: etat.armee.filter((p) => p.actif !== false) };
  assert.equal(niveauDeLArmee(ampute.armee), 210);
  assert.ok(plafondDeLaReserve(ampute) > plafondAvant,
    'montage sans mordant : même en retirant la pièce, le plafond ne bouge pas');
});

test('RAID-0 T7 — les dégâts retombent sur les BONNES pièces, une unité du milieu désactivée', () => {
  // ⚠ DES UNITÉS DE TYPES DIFFÉRENTS, EXPRÈS. `reporterLesDegats` calcule
  // `degatsMilli = pvMaxMilli - pv` sur la ligne de combat de CHAQUE pièce : si
  // les indices glissaient, une pièce recevrait les dégâts calculés sur le
  // `pvMax` d'une autre, et l'assertion « jamais plus que ses propres PV » le
  // dirait. Avec six Meutes identiques, un décalage serait invisible.
  const etat = partieAuMilieu();
  etat.armee = [];
  const roster = ['meute', 'perceurs', 'carapace', 'meute', 'perceurs'];
  roster.forEach((id, i) => {
    etat.armee.push({ id, vague: 1, colonne: i + 1, niveau: 1, degatsMilli: 0, actif: true });
  });
  const cible = ciblesParNiveau(etat, [18])[0];

  // La pièce du MILIEU reste à la maison — pas la première, pas la dernière :
  // un décalage d'indice ne se verrait pas sur un bout de liste.
  reglerActivite(etat, 'armee', 2, false);
  const { indices } = composerLesVagues(etat);
  assert.deepEqual(indices, [0, 1, 3, 4], 'les indices ne sautent pas la pièce inactive');

  const rapport = executerRaid(etat, etat, cible);
  assert.equal(rapport.unitesEngagees, 4);

  // La pièce inactive ressort EXACTEMENT comme elle est partie.
  assert.equal(etat.armee[2].degatsMilli, 0, 'la pièce restée à la maison a été abîmée');
  // Et aucune pièce ne porte plus de dégâts que ses propres PV — ce qui
  // arriverait si les dégâts d'une grosse unité retombaient sur une petite.
  for (const piece of etat.armee) {
    assert.ok(piece.degatsMilli <= pvMaxDeLUnite(piece.id, piece.niveau),
      `la pièce « ${piece.id} » porte plus de dégâts que ses PV — les indices ont glissé`);
  }
  // Falsifiable : au moins une des quatre parties doit être revenue abîmée.
  assert.ok(etat.armee.some((p, i) => i !== 2 && p.degatsMilli > 0),
    'montage sans mordant : personne n\'est revenu abîmé');
});

test('RAID-0 T8 — tout désactiver donne « sans-armee », et le message dit les trois causes', () => {
  const etat = partieAuMilieu();
  const cible = ciblesParNiveau(etat, [20])[0];
  assert.deepEqual(problemesDuRaid(etat, etat, cible), [], 'montage : ce raid doit être possible');

  for (let i = 0; i < etat.armee.length; i += 1) reglerActivite(etat, 'armee', i, false);
  const problemes = problemesDuRaid(etat, etat, cible);
  assert.equal(problemes.length, 1);
  assert.equal(problemes[0].code, 'sans-armee');

  // ⚠ TROIS CAUSES POUR UN SEUL CODE, ET LE MESSAGE DOIT LES DIRE. Un message
  // qui n'en cite que deux enverrait le joueur réparer une armée intacte.
  const message = problemes[0].message;
  assert.match(message, /compose/, 'le message ne dit pas « composer »');
  assert.match(message, /répare/, 'le message ne dit pas « réparer »');
  assert.match(message, /réactive/, 'le message ne dit pas « réactiver »');

  // Et `executerRaid` lève dessus, comme sur les trois autres refus.
  assert.throws(() => executerRaid(etat, etat, cible), /raid impossible/);
});

test('RAID-0 T9 — le champ traverse la sauvegarde, et une v17 ressort toute active', () => {
  // ⚠ LA GARDE DU NUMÉRO APPARTIENT AU MAILLON LE PLUS RÉCENT, une seule fois.
  // Elle arrive ici avec le maillon v17 → v18 ; elle vivait dans
  // `reparation.test.js` du temps où v16 → v17 était le dernier.
  assert.equal(SAVE_VERSION, 22, 'le bump de la version des sauvegardes a été oublié');

  const etat = partieAuMilieu();
  etat.armee = [];
  poserEffectif(etat, 'armee', { id: 'meute', vague: 1, colonne: 1, niveau: 1 });
  poserEffectif(etat, 'armee', { id: 'meute', vague: 1, colonne: 2, niveau: 1 });
  reglerActivite(etat, 'armee', 1, false);

  // ⚠ POSER DOIT DÉJÀ SERVIR LE DÉFAUT. La liste que `poserEffectif` pousse est
  // FERMÉE : un champ absent de cette liste disparaîtrait en silence, et le
  // drapeau ne retiendrait jamais rien.
  assert.equal(etat.armee[0].actif, true, 'poserEffectif ne sert pas le défaut « actif »');

  const recharge = charger(serialiser(etat, T_RAID0), T_RAID0);
  assert.equal(recharge.armee[0].actif, true, 'le champ ne traverse pas la sauvegarde');
  assert.equal(recharge.armee[1].actif, false, 'la désactivation ne traverse pas la sauvegarde');
  assert.equal(composerLesVagues(recharge).indices.length, 1);

  // ⚠ UNE v17 N'AVAIT AUCUN MOYEN DE DÉSACTIVER : toutes ses unités partaient,
  // donc toutes sont actives. La migration reproduit sa situation au poil.
  const v17 = JSON.parse(serialiser(etat, T_RAID0));
  v17.version = 17;
  for (const piece of v17.armee) delete piece.actif;
  const migre = migrer(structuredClone(v17));
  assert.equal(migre.version, SAVE_VERSION);
  assert.deepEqual(migre.armee.map((p) => p.actif), [true, true],
    'la migration a laissé une unité à la maison');

  // ⚠ ET LA GARNISON N'EN REÇOIT PAS : le drapeau dit « part au raid ».
  // ⚠ LA RANGÉE SE LIT DANS LA TABLE, elle ne s'écrit pas : un montage qui pose
  // une coordonnée en dur ne garde que lui-même, et la bande de défense a déjà
  // bougé une fois.
  const rangeeDefense = GRILLE.bandes.defense.premiere;
  let colonneLibre = 0;
  for (let c = 1; c <= GRILLE.largeur; c += 1) {
    const piece = { id: 'merlon', rangee: rangeeDefense, colonne: c, niveau: 1 };
    if (problemesDeLaPoseDEffectif(etat, 'garnison', piece).length === 0) { colonneLibre = c; break; }
  }
  assert.ok(colonneLibre > 0, 'montage : aucune case libre dans la bande de défense');
  poserEffectif(etat, 'garnison', {
    id: 'merlon', rangee: rangeeDefense, colonne: colonneLibre, niveau: 1,
  });
  assert.equal('actif' in etat.garnison[0], false,
    'une pièce de garnison porte un drapeau d\'activité, qui ne veut rien dire pour elle');
  assert.throws(() => reglerActivite(etat, 'garnison', 0, false), /ne part pas au raid/);
});

// ---------------------------------------------------------------------------
// RAID-A — l'écran de raid : le panneau, l'entrée, le rapport, le journal
// ---------------------------------------------------------------------------

const RACINE_RAID_A = dirname(dirname(fileURLToPath(import.meta.url)));
const lireSource = (...bouts) => readFileSync(join(RACINE_RAID_A, ...bouts), 'utf8');
/** La source sans ses commentaires — une garde qui lit sa propre prose ne garde rien. */
const sansCommentairesRaidA = (code) => code
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/** Une partie jouable : satellites parus, armée posée, points et réserve pleins. */
function partieJouable(graine = 2026) {
  const etat = creerEtat(graine);
  rattraperJeu(etat, 3001);
  etat.disposition[0].niveau = 12;
  let colonne = 1;
  for (const id of ['caserne', 'depotDeVehicules', 'aerodrome']) {
    etat.disposition.push({ id, rangee: 13, colonne, niveau: 5 });
    etat.economie.residus.push({});
    colonne += 2;
  }
  for (let c = 1; c <= 6; c += 1) {
    poserEffectif(etat, 'armee', { id: 'meute', vague: 1, colonne: c, niveau: 1 });
  }
  etat.economie.ressources.scorie = 1_000_000_000;
  etat.attaque.points = 100_000;
  crediterLesReserves(etat, plafondDeLaReserve(etat));
  return etat;
}

test('RAID-A T1 — le panneau tire ses trois nombres des briques, il ne les refait pas', () => {
  const etat = partieJouable();
  const camp = premierCamp(etat);
  const site = siteDeLaCase(etat, camp.rangee, camp.colonne);

  // ⚠⚠ LES TROIS BRIQUES EXISTAIENT, ÉCRITES ET TESTÉES, ET AUCUN ÉCRAN NE LES
  // APPELAIT. On mesure que `ciblageDuSite` rend EXACTEMENT ce qu'elles rendent :
  // un recalcul à la main dans l'écran donnerait un second barème, et le panneau
  // finirait par annoncer autre chose que ce que le raid verse.
  const montage = montageCourant(etat, site);
  const ciblage = ciblageDuSite(etat, camp);
  assert.deepEqual(ciblage.butin, butinSiToutTombe(montage));
  assert.equal(ciblage.force, forceDeLaDefense(montage.defenseurs));
  assert.equal(ciblage.cout, coutDUnRaid(etat, etat, site));

  // Falsifiable : les trois doivent valoir quelque chose, sinon l'égalité
  // tiendrait sur des zéros.
  assert.ok(ciblage.butin.quartz > 0 && ciblage.force > 0 && ciblage.cout > 0,
    'montage sans mordant : la cible ne vaut rien');

  // Et les quatre lignes s'ajoutent bien à celles du site.
  const sans = lignesDuSite(site, etat.position, etat.poisAcquis);
  const avec = lignesDuSite(site, etat.position, etat.poisAcquis, ciblage);
  assert.equal(avec.length, sans.length + 4, 'le panneau ne gagne pas ses quatre lignes');
  const quoi = avec.map((l) => l.quoi);
  for (const attendu of ['Butin si tout tombe', 'Force de la défense', 'Coût du raid']) {
    assert.ok(quoi.includes(attendu), `le panneau ne dit pas « ${attendu} »`);
  }
  // ⚠ ET LA FONCTION RESTE PURE : sans ciblage, elle rend ce qu'elle rendait.
  assert.deepEqual(sans, lignesDuSite(site, etat.position, etat.poisAcquis, null));
});

test('RAID-A T2 — le second toucher se COMPARE à la case ouverte, il ne se compte pas', () => {
  // ⚠ UN COMPTEUR FERAIT ENTRER N'IMPORTE OÙ : toucher un camp puis une base
  // voisine entrerait dans la base, que le joueur n'a regardée qu'une fois.
  const source = sansCommentairesRaidA(lireSource('src', 'ui', 'monde.js'));
  assert.match(source, /siteOuvert\s*!==\s*null/, 'la carte ne retient plus quelle case est ouverte');
  assert.match(source, /siteOuvert\.rangee === site\.rangee/,
    'le second toucher ne se compare pas à la case ouverte');
  assert.match(source, /siteOuvert = null/, 'fermer le panneau n\'oublie pas la case');
  // Un compteur de touchers serait la faute : on refuse d'en voir un.
  assert.doesNotMatch(source, /(touchers|clics)\s*\+\+/, 'la carte compte les touchers');
});

test('RAID-A T3 — `problemesDuRaid` garde l\'entrée, et la raison s\'affiche', () => {
  const etat = partieJouable();
  const camp = premierCamp(etat);
  assert.deepEqual(ciblageDuSite(etat, camp).problemes, [], 'montage : ce raid doit être possible');

  // Sans points d'attaque, on n'entre pas — et la liste dit pourquoi.
  etat.attaque.points = 0;
  const problemes = ciblageDuSite(etat, camp).problemes;
  assert.ok(problemes.length > 0, 'le garde ne mord pas');
  assert.equal(problemes[0].code, 'points-insuffisants');
  assert.match(problemes[0].message, /manque/);

  // L'écran interroge ce garde avant d'entrer, et il a un endroit pour l'écrire.
  const source = sansCommentairesRaidA(lireSource('src', 'ui', 'monde.js'));
  assert.match(source, /ciblage\.problemes\.length > 0/, 'l\'écran n\'interroge plus le garde');
  assert.match(lireSource('src', 'index.src.html'), /id="monde-panneau-refus"/,
    'le panneau n\'a plus où dire pourquoi');
});

test('RAID-A T4 — sur l\'écran de raid, deux bandeaux partent, les onglets restent', () => {
  const source = sansCommentairesRaidA(lireSource('src', 'ui', 'session.js'));
  // ⚠ « LES ONGLETS SEULS » — Ethan, 01/09. Les ressources et la bascule entre
  // bases s'en vont ; la rangée d'onglets RESTE.
  assert.match(source, /CHROME_MASQUE_PAR = \{ raid: \['ressources', 'navigation'\] \}/,
    'la liste des bandeaux masqués a changé sans qu\'on le dise');
  assert.doesNotMatch(source, /CHROME_MASQUE_PAR\[[^\]]*\][^;]*tete-onglets/,
    'la barre d\'onglets est masquée : « les onglets seuls » veut dire l\'inverse');
  // Le masquage est fait par la SESSION, pas par l'écran : ces deux blocs sont
  // du chrome commun, frères de `#ecrans`.
  assert.doesNotMatch(sansCommentairesRaidA(lireSource('src', 'ui', 'raid.js')),
    /getElementById\('(ressources|navigation)'\)/,
    'l\'écran de raid touche au chrome commun au lieu de le laisser à la session');
  // Et le raid est bien le septième écran, déclaré aux DEUX endroits.
  assert.match(source, /'options', 'raid'\]/, 'le raid n\'est pas dans ECRANS');
  assert.match(source, /raid: 'onglet-monde'/, 'le raid n\'allume pas l\'onglet Monde');
});

test('RAID-A T5 — les six boutons, et « tout réparer » sous condition', () => {
  const html = lireSource('src', 'index.src.html');
  for (const id of ['raid-reparer', 'raid-activer', 'raid-simuler', 'raid-attaquer',
    'raid-retour-carte', 'raid-retour-offense']) {
    assert.match(html, new RegExp(`id="${id}"`), `le bouton « ${id} » manque`);
  }
  // ⚠ « TOUT RÉPARER » EST CACHÉ DANS LE BALISAGE, et il n'apparaît qu'armé.
  assert.match(html, /id="raid-tout-reparer" hidden/,
    '« tout réparer » est visible sans que le mode soit armé');
  const source = sansCommentairesRaidA(lireSource('src', 'ui', 'raid.js'));
  assert.match(source, /if \(nom === 'reparer'\) \$\('raid-tout-reparer'\)\.hidden = false/,
    '« tout réparer » n\'apparaît plus avec le mode Réparer');
  assert.match(source, /tout\.hidden = true/, '« tout réparer » ne se recache plus au désarmement');
  // ⚠ AUCUNE EXCEPTION NE REMONTE : on demande, puis on agit. Jamais de `try`
  // autour d'un appel de `sim/`.
  assert.doesNotMatch(source, /try\s*\{/, 'l\'écran de raid rattrape une levée de la simulation');
});

test('RAID-A T6 — le glisser-déposer passe par `deplacerEffectif`, pas par une écriture', () => {
  const source = sansCommentairesRaidA(lireSource('src', 'ui', 'raid.js'));
  // ⚠ LE GESTE EST UNE ENTRÉE ; la règle de qui peut aller où reste dans `sim/`.
  assert.match(source, /problemesDuDeplacementDEffectif\(etatCourant, 'armee', index, position\)/,
    'le glisser-déposer ne demande plus si le déplacement est légal');
  assert.match(source, /deplacerEffectif\(etatCourant, 'armee', index, position\)/,
    'le glisser-déposer n\'appelle plus `deplacerEffectif`');
  // ⚠ AUCUNE ÉCRITURE DIRECTE DANS UNE PIÈCE D'ARMÉE. Le motif vise l'écriture
  // dans l'ÉTAT, pas les `dataset` du DOM — une vignette porte légitimement sa
  // vague et sa colonne en attributs, c'est ce qui permet de savoir où le doigt
  // s'est posé.
  assert.doesNotMatch(source, /etatCourant\.armee\[[^\]]*\]\.\w+\s*=[^=]/,
    'l\'écran écrit directement dans une pièce d\'armée');
  // ⚠ POINTER EVENTS, PAS SOURIS : la cible est un téléphone.
  assert.match(source, /addEventListener\('pointerdown'/, 'le geste n\'écoute plus le pointeur');
  assert.doesNotMatch(source, /addEventListener\('mousedown'/, 'le geste écoute la souris');

  // Et le refus est bien celui du moteur, sur une vraie tentative illégale.
  const etat = partieJouable();
  const occupee = { vague: etat.armee[1].vague, colonne: etat.armee[1].colonne };
  const problemes = problemesDuDeplacementDEffectif(etat, 'armee', 0, occupee);
  assert.ok(problemes.length > 0, 'poser sur une case occupée devrait être refusé');
});

test('RAID-A T7 — les deux panneaux affichent les MÊMES nombres', () => {
  const etat = partieJouable();
  const cible = premierCamp(etat);
  // Le simulateur ne commet rien : le vrai raid part donc du même état, et les
  // deux rapports doivent être identiques champ par champ.
  const simule = simulerRaid(etat, etat, cible);
  const reel = executerRaid(etat, etat, cible);
  const { simule: drapeau, ...sansDrapeau } = simule;
  assert.equal(drapeau, true);
  assert.deepEqual(sansDrapeau, reel, 'le simulateur et le vrai raid divergent');

  // ⚠⚠ ET C'EST STRUCTUREL, PAS SURVEILLÉ : les deux panneaux rendent la MÊME
  // fonction pure sur le même rapport, donc ils ne peuvent pas diverger.
  assert.deepEqual(lignesDuResultat(simule), lignesDuResultat(reel));
  const source = sansCommentairesRaidA(lireSource('src', 'ui', 'raid.js'));
  assert.equal((source.match(/lignesDuResultat\(/g) ?? []).length, 2,
    'les deux panneaux ne partagent plus une seule fonction de rendu');
  // ⚠⚠ AUCUN DES QUATRE POURCENTAGES DU RAPPORT N'EST CALCULÉ DANS L'ÉCRAN : ils
  // ne s'y LISENT que sur `rapport`. C'est ce qui les rend exacts dans le
  // simulateur par construction. (La barre de vie d'une vignette, elle, est bien
  // calculée ici — c'est l'état d'une pièce du JOUEUR, pas une mesure du site.)
  for (const champ of ['restantDefense', 'restantBatiments', 'restantSouche', 'restantEtai']) {
    for (const trouve of source.matchAll(new RegExp(`[\\w.]*${champ}`, 'g'))) {
      assert.match(trouve[0], new RegExp(`^rapport\\.${champ}$`),
        `l'écran fabrique « ${champ} » au lieu de le lire sur le rapport : ${trouve[0]}`);
    }
  }

  // Falsifiable : le rapport doit porter de vrais nombres.
  assert.ok(reel.restantBatiments !== null && reel.ticks > 0,
    'montage sans mordant : le raid n\'a rien mesuré');

  // ⚠⚠ ET LES LIGNES DOIVENT PORTER LES VALEURS DU RAPPORT, PAS SEULEMENT ÊTRE
  // LES MÊMES DES DEUX CÔTÉS. La première version de ce test comparait les deux
  // panneaux et surveillait la façon dont `restantDefense` était employé : une
  // falsification qui REMPLAÇAIT la ligne par un autre calcul passait au VERT —
  // les deux panneaux partageant la fonction, ils restaient d'accord... sur un
  // nombre faux. Deux panneaux qui mentent pareil sont toujours d'accord.
  const forge = {
    verdict: 'victoire', butin: { quartz: 11, scorie: 22 },
    restantDefense: 33, restantBatiments: 44, restantSouche: 55, restantEtai: 66,
    reparationInduite: {
      escouade: { secondes: 90, ticks: 900, pctReserve: 77, sansBatiment: false },
      blinde: { secondes: 0, ticks: 0, pctReserve: 0, sansBatiment: true },
      aeronef: { secondes: 0, ticks: 0, pctReserve: 0, sansBatiment: false },
    },
    ticks: 880,
  };
  const rendu = new Map(lignesDuResultat(forge).map((l) => [l.quoi, l.valeur]));
  assert.equal(rendu.get('Défense restante'), '33 %');
  assert.equal(rendu.get('Bâtiments restants'), '44 %');
  assert.equal(rendu.get(BATIMENTS.souche.nom), '55 %');
  assert.equal(rendu.get(BATIMENTS.etai.nom), '66 %');
  assert.equal(rendu.get('Butin'), '11 quartz · 22 scorie');
  assert.equal(rendu.get('Infanterie'), '1 min 30 s · 77 % de la réserve');
  // ⚠ « SANS BÂTIMENT » SE DIT, parce que zéro veut dire deux choses : intacte,
  // ou impossible à réparer faute de Dépôt de véhicules.
  assert.equal(rendu.get('Véhicules'), 'sans bâtiment');
  assert.equal(rendu.get('Aviation'), 'intacte');
  // ⚠ LA DURÉE EST `ticks × TICK_MS`, jamais un 0,1 recopié.
  assert.equal(rendu.get('Durée du combat'), '1 min 28 s');
  // Et un pourcentage absent se dit « — », jamais « 0 % ».
  const sansDefense = new Map(
    lignesDuResultat({ ...forge, restantDefense: null }).map((l) => [l.quoi, l.valeur]),
  );
  assert.equal(sansDefense.get('Défense restante'), '—');
});

test('RAID-A T8 — les trois verdicts, et « défense seule touchée » est une DÉFAITE', () => {
  // ⚠ LA RÈGLE D'ETHAN, TELLE QUELLE : une armée qui n'a griffé que la garnison
  // n'a rien pris. Trois verdicts, et « Défaite » sans « totale » n'existe pas.
  assert.deepEqual(Object.keys(LIBELLE_VERDICT).sort(),
    ['defaite-totale', 'victoire', 'victoire-totale']);
  assert.equal(LIBELLE_VERDICT['defaite-totale'], 'Défaite totale');
  assert.ok(!Object.values(LIBELLE_VERDICT).includes('Défaite'),
    '« Défaite » sans « totale » est réservé à la défense');

  // Une armée trop faible pour entamer un bâtiment : défaite totale.
  const faible = partieJouable();
  faible.armee = [];
  poserEffectif(faible, 'armee', { id: 'meute', vague: 4, colonne: 1, niveau: 1 });
  const rate = executerRaid(faible, faible, premierCamp(faible));
  assert.equal(rate.verdict, 'defaite-totale', 'un raid sans dégât de bâtiment n\'est pas une défaite');
  assert.equal(rate.restantBatiments, 100, 'montage : aucun bâtiment ne devait tomber');

  // Une armée qui entame un bâtiment : victoire.
  const bonne = partieJouable();
  const gagne = executerRaid(bonne, bonne, premierCamp(bonne));
  assert.equal(gagne.verdict, 'victoire');
  assert.ok(gagne.restantBatiments < 100, 'montage : un bâtiment devait être griffé');

  // Et le rasage : victoire totale. On insiste jusqu'à ce que le camp tombe.
  const acharne = partieJouable();
  const cible = premierCamp(acharne);
  let dernier = null;
  for (let n = 0; n < 30 && (dernier === null || !dernier.rase); n += 1) {
    acharne.attaque.points = 100_000;
    dernier = executerRaid(acharne, acharne, cible);
  }
  assert.ok(dernier.rase, 'montage : le camp n\'est jamais tombé');
  assert.equal(dernier.verdict, 'victoire-totale');
});

test('RAID-A T9 — simuler ne range AUCUN rapport dans le journal', () => {
  const etat = partieJouable();
  const cible = premierCamp(etat);
  const avant = serialiser(etat, 4_000_000);
  simulerRaid(etat, etat, cible);
  simulerRaid(etat, etat, cible);
  // ⚠ CHAÎNE CONTRE CHAÎNE : le journal est dans la sauvegarde, donc une fuite
  // s'y verrait. Ranger le rapport simulé aurait été le seul moyen de se tromper.
  assert.equal(serialiser(etat, 4_000_000), avant, 'la simulation a écrit dans l\'état');
  assert.equal(etat.rapports.length, 0, 'la simulation a rangé un rapport');
  // Falsifiable : un VRAI raid, lui, en range un.
  executerRaid(etat, etat, cible);
  assert.equal(etat.rapports.length, 1, 'un vrai raid ne range rien');
});

test('RAID-A T10 — onze raids ne gardent que les dix derniers, le plus ancien sort', () => {
  const etat = partieJouable();
  const ticks = [];
  for (let n = 0; n < 11; n += 1) {
    etat.attaque.points = 100_000;
    // Un tick entre deux raids : les horodatages doivent différer, sinon
    // « le plus ancien est sorti » ne se mesurerait pas.
    tickJeu(etat);
    // ⚠ BASELINE REMESURÉE AU LOT EUCLIDE : LA CIBLE SE RELIT À CHAQUE TOUR.
    // Elle était prise UNE fois avant la boucle, ce qui supposait qu'un même
    // camp survive à onze raids. Les anneaux ayant changé de forme, le camp que
    // le montage trouve n'est plus le même, il tombe avant le onzième, et
    // `executerRaid` lève « il n'y a rien à attaquer sur cette case ». Ce que ce
    // test mesure est la FILE des dix rapports, pas l'endurance d'un camp : il
    // relit donc une cible vivante à chaque tour.
    const cible = premierCamp(etat);
    assert.ok(cible, `tour ${n} : plus aucun camp à attaquer, le montage ne mesure rien`);
    executerRaid(etat, etat, cible);
    ticks.push(etat.rapports[etat.rapports.length - 1].tick);
  }
  assert.equal(etat.rapports.length, APRES_RAID.rapportsGardes, 'la borne ne mord pas');
  assert.equal(APRES_RAID.rapportsGardes, 10);
  // ⚠ UNE FILE, PAS UNE PILE : le plus ancien sort en premier, et ce sont les
  // DIX DERNIERS qui restent, dans l'ordre où les raids ont eu lieu.
  assert.deepEqual(etat.rapports.map((r) => r.tick), ticks.slice(1));
  assert.ok(!etat.rapports.some((r) => r.tick === ticks[0]), 'le plus ancien est resté');
  // ⚠ ON GARDE LE RAPPORT, JAMAIS LE COMBAT : ni vagues, ni positions.
  for (const r of etat.rapports) {
    assert.equal(r.attaquants, undefined, 'le journal garde le combat, pas seulement le rapport');
    assert.equal(r.defenses, undefined, 'le journal garde le combat, pas seulement le rapport');
    assert.ok(r.verdict !== undefined && r.cible !== undefined);
  }
});

test('RAID-A T11 — le journal traverse la sauvegarde, une v18 ressort à vide', () => {
  const etat = partieJouable();
  etat.attaque.points = 100_000;
  executerRaid(etat, etat, premierCamp(etat));
  assert.equal(etat.rapports.length, 1);

  const recharge = charger(serialiser(etat, 4_000_000), 4_000_000);
  assert.deepEqual(recharge.rapports, etat.rapports, 'le journal ne traverse pas la sauvegarde');

  // ⚠ UNE v18 N'AVAIT AUCUN MOYEN DE GARDER UN RAPPORT : elle n'en a pas, et
  // lui en inventer un fabriquerait un raid qui n'a pas eu lieu.
  const v18 = JSON.parse(serialiser(etat, 4_000_000));
  v18.version = 18;
  delete v18.rapports;
  const migre = migrer(structuredClone(v18));
  assert.equal(migre.version, SAVE_VERSION);
  assert.deepEqual(migre.rapports, [], 'la migration a inventé un rapport');
  assert.doesNotThrow(() => charger(JSON.stringify(v18), 4_000_000));

  // Et un journal trop long est un fait de PROGRAMME : le chargement le refuse.
  const trop = JSON.parse(serialiser(etat, 4_000_000));
  trop.rapports = new Array(APRES_RAID.rapportsGardes + 1).fill({ verdict: 'victoire' });
  assert.throws(() => charger(JSON.stringify(trop), 4_000_000), /rapports gardés/);
});

test('RAID-A — trois raids d\'affilée sur la même cible, et le pourcentage DESCEND', () => {
  // ⚠⚠ CE TEST EXISTE PARCE QUE LE TROISIÈME RAID LEVAIT. Trouvé au boot sans
  // tête, reproduit en simulation pure : le raid 1 tue les trois défenseurs et
  // range `[0,0,0]` ; les morts quittent le montage, donc le raid 2 ne range
  // plus que `[]` ; le raid 3 régénère les trois et n'a plus rien à leur
  // appliquer — « 0 PV rangés pour 3 pièces ». Le bogue est ANTÉRIEUR à l'écran,
  // qui n'a fait que le rendre atteignable : aucun test n'enchaînait trois raids.
  const etat = partieJouable();
  const cible = premierCamp(etat);
  const restants = [];
  for (let n = 0; n < 5; n += 1) {
    etat.attaque.points = 100_000;
    restants.push(executerRaid(etat, etat, cible).restantBatiments);
  }
  assert.equal(restants.length, 5, 'un raid a levé avant le cinquième');

  // ⚠ ET LE POURCENTAGE NE REMONTE JAMAIS. Rapporté aux seules survivantes il
  // MONTAIT — 74 % puis 76 % après une passe qui avait détruit un bâtiment de
  // plus — parce qu'une pièce détruite quitte le montage, donc le dénominateur.
  // Le dénominateur est le site PLEIN, et un nombre qui grimpe quand on casse
  // est illisible.
  for (let i = 1; i < restants.length; i += 1) {
    assert.ok(restants[i] <= restants[i - 1],
      `le restant remonte : ${restants.join(' → ')}`);
  }
  assert.ok(restants[4] < restants[0], 'montage sans mordant : rien n\'a été détruit');
});
