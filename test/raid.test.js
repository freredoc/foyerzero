// L'acte de raid — payer, partir, encaisser, revenir abîmé.
//
// C'est le lot qui referme la boucle : après lui, un raid se joue de bout en
// bout en simulation. Les tests suivent l'ordre des cinq écritures.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  problemesDuRaid, executerRaid, composerLesVagues, pvMaxDeLUnite, creerRecherche,
  rechercheMilli,
} from '../src/sim/raid.js';
import {
  creerEtat, rattraperJeu, serialiser, charger, migrer, SAVE_VERSION,
} from '../src/sim/state.js';
import { siteDeLaCase } from '../src/sim/site-de-la-case.js';
import { basesDeLaFenetre } from '../src/sim/peuplement.js';
import { distanceTchebychev } from '../src/sim/points-attaque.js';
import { etatDuSite } from '../src/sim/site-entame.js';
import { capacitesMilli } from '../src/sim/economie-base.js';
import { APRES_RAID, GEOGRAPHIE } from '../src/data/sites.js';
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
  const s = etat.satellites.presents.find((x) => x.type === 'camp');
  return { rangee: s.rangee, colonne: s.colonne };
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
  assert.ok(distanceTchebychev(etat.position, loin) > GEOGRAPHIE.rayonAttaque);
  assert.ok(siteDeLaCase(etat, loin.rangee, loin.colonne), 'la cible lointaine doit exister');
  assert.equal(problemesDuRaid(etat, etat, loin)[0].code, 'hors-portee');

  // Sans points : le message dit combien il en manque, il ne dit pas « non ».
  etat.attaque.points = 3;
  const sansPoints = problemesDuRaid(etat, etat, cible);
  assert.equal(sansPoints[0].code, 'points-insuffisants');
  assert.match(sansPoints[0].message, /manque 9/, sansPoints[0].message);

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
  const etat = partieArmee(2026, 6);
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
