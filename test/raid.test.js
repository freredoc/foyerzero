// L'acte de raid — payer, partir, encaisser, revenir abîmé.
//
// C'est le lot qui referme la boucle : après lui, un raid se joue de bout en
// bout en simulation. Les tests suivent l'ordre des cinq écritures.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  problemesDuRaid, executerRaid, simulerRaid, composerLesVagues, pvMaxDeLUnite,
  creerRecherche, rechercheMilli,
} from '../src/sim/raid.js';
import {
  creerEtat, rattraperJeu, serialiser, charger, migrer, SAVE_VERSION,
  poserEffectif, problemesDeLaPoseDEffectif, reglerActivite,
} from '../src/sim/state.js';
import { niveauDeLArmee } from '../src/sim/niveau-de-base.js';
import { plafondDeLaReserve } from '../src/sim/reparation.js';
import { basesDeLaFenetre as basesFenetre } from '../src/sim/peuplement.js';
import { siteDeLaCase } from '../src/sim/site-de-la-case.js';
import { basesDeLaFenetre } from '../src/sim/peuplement.js';
import { distanceTchebychev } from '../src/sim/points-attaque.js';
import { etatDuSite } from '../src/sim/site-entame.js';
import { capacitesMilli } from '../src/sim/economie-base.js';
import { APRES_RAID, GEOGRAPHIE } from '../src/data/sites.js';
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
  }).filter((b) => distanceTchebychev(p, b) <= r);

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
  assert.equal(SAVE_VERSION, 18, 'le bump de la version des sauvegardes a été oublié');

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
