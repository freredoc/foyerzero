// Lot VERROUS — 20/09/2026.
//
// La base finale existait comme DÉCOR depuis le 30/08 : `ui/monde.js` la
// dessinait, `sim/poi.js` l'esquivait, et `siteDeLaCase` rendait `null` dessus.
// Elle n'était donc pas attaquable. Ce lot lui donne six verrous en hexagone,
// la rend attaquable, et pose la porte : les six d'abord, elle ensuite.
//
// ⚠⚠ SEPT TESTS, ET CHACUN GARDE UNE CHOSE QUE LE LOT PEUT CASSER EN SILENCE.
// Le plus dangereux est `T2` : une géométrie fausse ne lève pas, elle place les
// verrous ailleurs — et « ailleurs » reste jouable, donc personne ne le voit.
//
// ⚠ AUCUN TEST D'ÉQUILIBRAGE ICI, ET C'EST DÉLIBÉRÉ. Ethan, 11/09 : « inutile
// de faire des tests de raid pour l'équilibrage, c'est mon boulot ». Ce fichier
// mesure des faits — où sont les verrous, ce qui est refusé, ce qui est exclu —
// jamais si c'est jouable.
//
// ⚠⚠ DEUX TESTS DE PLUS AU LOT GRILLE LONGUE, 20/09/2026 — `LONGUE T1` et
// `LONGUE T2` —, PARCE QUE CE LOT ACHÈVE CE QUE VERROUS AVAIT LAISSÉ OUVERT :
// les sept bases du bout de carte se combattent sur une grille de 9 × 27, avec
// seize rangées de défense et 78 défenses, et leur grille voyage jusqu'au
// rejeu. Même règle qu'au-dessus : on mesure où sont les rangées et ce qui
// rejoue, jamais si 78 défenses sont jouables — c'est l'affaire d'Ethan.
//
// ⚠⚠ UN TEST DE PLUS AU LOT ÉTAI-RÉTABLI, 25/09/2026 — `VERROU T8` —, ET IL
// GARDE UN DÉFAUT TROUVÉ EN RELISANT, PAS UN ARBITRAGE. `retirerLeSite`
// n'inscrivait parmi les ruines que le type `'base'` écrit en dur : un verrou
// rasé par sa Souche rendait `{ rase: true }` et RESTAIT DEBOUT. Mesuré sur la
// graine 2026 au build 188 : `basesRasees` à zéro entrée, six verrous debout —
// la porte de la base finale ne pouvait donc jamais s'ouvrir.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  GEOGRAPHIE, TYPES_SITE, TYPES_DE_BASE, NIVEAU_MAXIMAL_DUN_SITE, EMBLEMES_CARTE,
} from '../src/data/sites.js';
import { GRILLE, GRILLE_LONGUE } from '../src/data/combat.js';
import {
  positionsDesVerrous, positionBaseTerminale, grossesBasesDeLaCarte,
  grosseBaseDeLaCase, empriseDeLaGrosseBase, niveauDeLaGrosseBase, estSurLaCarte,
  COTES_GROSSE_BASE,
} from '../src/sim/carte.js';
import { estBaseOuvrage } from '../src/sim/peuplement.js';
import { siteDeLaCase, montageDuSite } from '../src/sim/site-de-la-case.js';
import { problemesDuRaid } from '../src/sim/raid.js';
import { verrousDebout, finaleDeverrouillee } from '../src/sim/ruines.js';
import {
  creerEtat, SAVE_VERSION, migrer, rattraperJeu, serialiser, charger, poserEffectif,
} from '../src/sim/state.js';
import { baseCourante } from '../src/sim/base-courante.js';
import {
  creerCombat, resoudre, serialiserEtat, construireResultat,
} from '../src/sim/combat.js';
import { enregistrerLeRaid } from '../src/sim/site-entame.js';
import { campDeLaCase, territoireDeLaFenetre } from '../src/sim/territoire.js';
import { spriteDeLaRuine } from '../src/render/embleme.js';
import {
  densite, genererSite, facteurDeDefenseMilli, effectifDeDefense, tiersDeLaDefense,
  casesDeDefense,
} from '../src/sim/generateur.js';
import { verifierGrille } from '../src/sim/grille.js';
import { estAPorteeDAttaque } from '../src/sim/points-attaque.js';
import {
  executerRaid, montageDuRaid, composerLesVagues, pourLeRejeu,
} from '../src/sim/raid.js';
import { crediterLesReserves, plafondDeLaReserve } from '../src/sim/reparation.js';

const GRAINE = 7;
const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * ⚠ UNE GARDE QUI LIT CE QU'ON A ÉCRIT À SON SUJET NE GARDE RIEN — la doc de
 * `GRILLE_LONGUE` NOMME les champs de calibrage pour dire qu'elle ne les porte
 * pas. La source se lit décommentée, et un appât prouve que le filtre ne mange
 * pas tout.
 */
const sansCommentaires = (code) => code
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

/**
 * Une partie qui peut raider : un Chantier au niveau 12, les trois bâtiments de
 * production, six Meutes en vague 1, des points d'attaque et de la scorie. C'est
 * le montage de `test/journal-raids.test.js`, repris tel quel.
 */
function partieJouable(graine) {
  const etat = creerEtat(graine);
  rattraperJeu(etat, 3001);
  baseCourante(etat).disposition[0].niveau = 12;
  let colonne = 1;
  for (const id of ['caserne', 'depotDeVehicules', 'aerodrome']) {
    baseCourante(etat).disposition.push({ id, rangee: 13, colonne, niveau: 5 });
    baseCourante(etat).economie.residus.push({});
    colonne += 2;
  }
  for (let c = 1; c <= 6; c += 1) {
    poserEffectif(etat, 'armee', { id: 'meute', vague: 1, colonne: c, niveau: 1 });
  }
  baseCourante(etat).economie.ressources.scorie = 1_000_000_000;
  etat.attaque.points = 100_000;
  crediterLesReserves(etat, plafondDeLaReserve(etat));
  return etat;
}

/** Le premier camp posé autour de la base — un site ORDINAIRE, sans grille. */
function premierCamp(etat) {
  const s = baseCourante(etat).satellites.presents.find((x) => x.type === 'camp');
  return s === undefined ? null : { rangee: s.rangee, colonne: s.colonne };
}

/** Le combat d'ORIGINE d'un raid, recomposé AVANT qu'il ait lieu, résolu. */
function combatDOrigine(etat, cible) {
  const site = siteDeLaCase(etat, cible.rangee, cible.colonne);
  const montage = { ...montageDuRaid(etat, site), vagues: composerLesVagues(etat).vagues };
  const combat = creerCombat(montage);
  const resultat = resoudre(combat);
  return { montage: pourLeRejeu(montage), combat, resultat };
}

/** Les six verrous rasés, sous la forme que `basesRasees` porte depuis la v28. */
function tousLesVerrousRases(minute = 0) {
  return positionsDesVerrous().map((p) => ({
    rangee: p.rangee, colonne: p.colonne, minute, type: 'baseVerrou', niveau: 50,
  }));
}

// ---------------------------------------------------------------------------
// T1 — la table, et ce qu'elle interdit
// ---------------------------------------------------------------------------

test('VERROU T1 — les sept sont des bases, passives, et aucune ne respawne', () => {
  // ⚠ LE MONTAGE D'ABORD : sans lui, les assertions porteraient sur des types
  // absents et passeraient toutes.
  assert.ok(TYPES_SITE.baseVerrou, 'le type `baseVerrou` n\'existe pas');
  assert.ok(TYPES_SITE.baseTerminale, 'le type `baseTerminale` n\'existe pas');

  for (const type of ['baseVerrou', 'baseTerminale']) {
    // ⚠⚠ ETHAN, 11/09, Q9 : « pas d'attaque ». Les sept attendent qu'on vienne
    // les chercher. Le câblage est GRATUIT — `basesAttaquantes` filtre déjà sur
    // ce champ — et c'est le signe que la table est au bon endroit.
    assert.equal(TYPES_SITE[type].attaqueLeJoueur, false, `« ${type} » attaque le joueur`);
    // Un verrou rasé ne revient pas : c'est `basesRasees` qui porte le fait.
    assert.equal(TYPES_SITE[type].respawn, false, `« ${type} » réapparaît`);
    // Entamé, il se répare — comme une base de l'Ouvrage.
    assert.equal(TYPES_SITE[type].destructionDefinitive, false);
    assert.equal(TYPES_SITE[type].reparationHeures, 1);
    // Et il a un emblème : un site sans gabarit fait lever l'écran au dessin.
    assert.ok(EMBLEMES_CARTE[type], `aucun gabarit pour « ${type} »`);
  }

  // ⚠ `TYPES_DE_BASE` SE DÉRIVE, IL NE S'ÉCRIT PAS. C'est `densiteComme` qui
  // dit « ce type est une base » ; une liste de noms aurait été la seconde
  // vérité que §4 interdit, et elle aurait oublié le quatrième type.
  assert.deepEqual(TYPES_DE_BASE.slice().sort(), ['base', 'baseTerminale', 'baseVerrou']);
  for (const type of TYPES_DE_BASE) {
    assert.equal(TYPES_SITE[type].densiteComme, 'avantPoste');
  }
  // Témoin inverse : camp et avant-poste ne sont pas des bases.
  assert.equal(TYPES_SITE.camp.densiteComme, undefined);
  assert.equal(TYPES_SITE.avantPoste.densiteComme, undefined);
});

// ---------------------------------------------------------------------------
// T2 — la géométrie, et pourquoi le rayon n'est pas dans la fourchette dictée
// ---------------------------------------------------------------------------

test('VERROU T2 — six sommets sur la carte, et le rayon 15 dicté n\'y tient pas', () => {
  const verrous = positionsDesVerrous();
  assert.equal(verrous.length, GEOGRAPHIE.verrous.nombre, 'il n\'y a plus six verrous');

  // ⚠⚠ LES SIX POSITIONS SONT FIGÉES, ET C'EST LE CŒUR DU TEST. Une géométrie
  // fausse ne LÈVE pas : elle place les verrous ailleurs, et « ailleurs » reste
  // parfaitement jouable. Rien d'autre que ces six couples ne le dirait.
  assert.deepEqual(verrous.map((p) => `${p.rangee},${p.colonne}`),
    ['3,16', '9,26', '21,26', '27,16', '21,6', '9,6'],
    'les six sommets ont bougé : le rayon ou l\'orientation a changé');

  // Tous sur la carte, et leur emprise entière aussi.
  for (const v of verrous) {
    assert.ok(estSurLaCarte(v.rangee, v.colonne), `(${v.rangee}, ${v.colonne}) hors carte`);
    assert.doesNotThrow(() => empriseDeLaGrosseBase(GEOGRAPHIE.verrous.cotes, v),
      `l'emprise de (${v.rangee}, ${v.colonne}) déborde`);
  }

  // ⚠⚠ ET VOICI POURQUOI LA FOURCHETTE D'ETHAN — « entre dix et quinze cases » —
  // a été ramenée à DOUZE. À 15, le sommet du haut tombe rangée 0 : hors carte.
  // `empriseDeLaGrosseBase` LÈVE, et une levée dans la boucle de dessin vide
  // tout l'écran Monde. Ce n'est pas un réglage de goût, c'est une borne.
  const centre = positionBaseTerminale();
  const sommetHaut = (rayon) => ({ rangee: centre.rangee - rayon, colonne: centre.colonne });
  assert.ok(!estSurLaCarte(sommetHaut(15).rangee, sommetHaut(15).colonne),
    'le rayon 15 tient sur la carte : la raison écrite dans GEOGRAPHIE.verrous est fausse');
  assert.ok(estSurLaCarte(sommetHaut(GEOGRAPHIE.verrous.rayon).rangee, centre.colonne),
    'le rayon retenu ne tient pas sur la carte');

  // ⚠⚠ ET VOICI POURQUOI IL N'EST PAS DIX NON PLUS — LA PROPRIÉTÉ SE LIT DANS LE
  // CERCLE INSCRIT, ET LE PREMIER JET DU LOT S'ÉTAIT TROMPÉ DE PROPRIÉTÉ. Il
  // avait écrit « à R = 12, aucune case ne porte un verrou ET la finale » :
  // c'est FAUX, il y en a 308, et il ne peut pas en être autrement — deux
  // disques de rayon 10 dont les centres sont à 12 se recoupent largement. Ce
  // test-ci a fait tomber l'affirmation avant qu'elle n'entre au dépôt.
  //
  // ⚠⚠ CE QUI TIENT VRAIMENT : le cercle inscrit de l'hexagone vaut
  // `R × cos(30°)`, soit **10,392 à R = 12** contre un rayon d'attaque de 10.
  // Toute case d'où la finale est atteignable est donc DANS l'hexagone — le
  // joueur doit franchir la ligne qu'il vient d'ouvrir. À R = 10, le cercle
  // inscrit tombe à 8,66 et **76 des 317 cases** permettent de frapper le
  // centre depuis l'extérieur.
  const inscrit = (rayon) => rayon * Math.cos(Math.PI / 6);
  const horsDeLHexagone = (rayon) => {
    let dehors = 0;
    let total = 0;
    for (let r = 1; r <= GEOGRAPHIE.carte.hauteur; r += 1) {
      for (let c = 1; c <= GEOGRAPHIE.carte.largeur; c += 1) {
        if (!estAPorteeDAttaque({ rangee: r, colonne: c }, centre)) continue;
        total += 1;
        if (Math.hypot(r - centre.rangee, c - centre.colonne) > inscrit(rayon)) dehors += 1;
      }
    }
    return { dehors, total };
  };

  const retenu = horsDeLHexagone(GEOGRAPHIE.verrous.rayon);
  // ⚠ FALSIFIABLE : il DOIT exister des cases d'où la finale est atteignable,
  // sinon « zéro dehors » serait vrai pour la mauvaise raison.
  assert.ok(retenu.total > 100,
    `${retenu.total} cases portent la finale : le montage ne mesure rien`);
  assert.equal(retenu.dehors, 0,
    `${retenu.dehors} case(s) frappent la finale depuis hors de l'hexagone`);
  assert.ok(inscrit(GEOGRAPHIE.verrous.rayon) > GEOGRAPHIE.rayonAttaque,
    'le cercle inscrit est passé sous le rayon d\'attaque : la ligne des verrous se contourne');

  // ⚠ ET LE TÉMOIN INVERSE, qui est ce qui rend le choix de 12 démontrable :
  // à 10, la ligne se contourne pour de bon.
  const a10 = horsDeLHexagone(10);
  assert.ok(a10.dehors > 0,
    'à R = 10 la ligne ne se contournerait pas : la raison écrite dans GEOGRAPHIE est fausse');
});

// ---------------------------------------------------------------------------
// T3 — les emprises, et ce qu'elles retirent au peuplement
// ---------------------------------------------------------------------------

test('VERROU T3 — les sept emprises couvrent 33 cases, et rien n\'y est tiré', () => {
  const sept = grossesBasesDeLaCarte();
  assert.equal(sept.length, 1 + GEOGRAPHIE.verrous.nombre, 'il n\'y a plus sept grosses bases');
  assert.equal(sept[0].type, 'baseTerminale', 'la finale n\'est plus la première');

  // 9 pour la finale, 4 par verrou. Le compte se calcule, il ne s'écrit pas.
  const attendu = 3 ** 2 + GEOGRAPHIE.verrous.nombre * GEOGRAPHIE.verrous.cotes ** 2;
  let couvertes = 0;
  for (let r = 1; r <= GEOGRAPHIE.carte.hauteur; r += 1) {
    for (let c = 1; c <= GEOGRAPHIE.carte.largeur; c += 1) {
      if (grosseBaseDeLaCase(r, c) !== null) couvertes += 1;
    }
  }
  assert.equal(couvertes, attendu, `${couvertes} cases couvertes au lieu de ${attendu}`);
  assert.equal(attendu, 33);

  // ⚠⚠ AUCUNE BASE PROCÉDURALE SOUS UNE EMPRISE, SUR DIX GRAINES. Sans cette
  // garde, `siteDeLaCase` rendrait deux sites pour une même case — et c'est le
  // site FIXE qui gagnerait, donc la base de la graine disparaîtrait en
  // silence, sans que le joueur puisse la prendre ni comprendre pourquoi.
  for (let graine = 1; graine <= 10; graine += 1) {
    for (const base of grossesBasesDeLaCarte()) {
      const e = empriseDeLaGrosseBase(base.cotes, base);
      for (let r = e.rangee; r < e.rangee + e.cotes; r += 1) {
        for (let c = e.colonne; c < e.colonne + e.cotes; c += 1) {
          assert.equal(estBaseOuvrage(graine, r, c), false,
            `graine ${graine} : une base de l'Ouvrage en (${r}, ${c}), sous « ${base.type} »`);
        }
      }
    }
  }
  // ⚠ FALSIFIABLE : le peuplement DOIT poser des bases ailleurs, sinon la boucle
  // ci-dessus passerait sur une carte vide.
  let ailleurs = 0;
  for (let r = 1; r <= 40; r += 1) {
    for (let c = 1; c <= GEOGRAPHIE.carte.largeur; c += 1) {
      if (grosseBaseDeLaCase(r, c) === null && estBaseOuvrage(1, r, c)) ailleurs += 1;
    }
  }
  assert.ok(ailleurs > 10, `${ailleurs} bases hors emprise : le montage ne mesure rien`);

  // Les deux formats de grosse base sont employés, et l'un n'est pas l'autre.
  assert.deepEqual(COTES_GROSSE_BASE, [GEOGRAPHIE.verrous.cotes, 3]);
  assert.notEqual(GEOGRAPHIE.verrous.cotes, 3, 'un verrou a la taille de la base finale');
});

// ---------------------------------------------------------------------------
// T4 — une grosse base rend le MÊME site depuis chacune de ses cases
// ---------------------------------------------------------------------------

test('VERROU T4 — les neuf cases de la finale rendent un seul site, pas neuf', () => {
  const etat = creerEtat(GRAINE);

  // ⚠⚠ C'EST LA FAUTE QUI SE SERAIT VUE LE PLUS TARD. Si chaque case rendait un
  // site à SA position, le joueur pourrait raser le même verrou par chacun de
  // ses quatre coins : `basesRasees` porterait quatre entrées pour une base, le
  // compteur des verrous tomberait à zéro après un seul rasage, et la porte de
  // la base finale s'ouvrirait trop tôt.
  for (const base of grossesBasesDeLaCarte()) {
    const e = empriseDeLaGrosseBase(base.cotes, base);
    const vus = new Set();
    for (let r = e.rangee; r < e.rangee + e.cotes; r += 1) {
      for (let c = e.colonne; c < e.colonne + e.cotes; c += 1) {
        const site = siteDeLaCase(etat, r, c);
        assert.ok(site, `(${r}, ${c}) ne rend aucun site sous « ${base.type} »`);
        assert.equal(site.type, base.type);
        vus.add(`${site.rangee}:${site.colonne}`);
      }
    }
    assert.equal(vus.size, 1,
      `« ${base.type} » rend ${vus.size} sites distincts pour une seule base`);
    assert.ok(vus.has(`${base.rangee}:${base.colonne}`),
      `« ${base.type} » ne rend pas la case de son site`);
  }

  // Les niveaux : 60 pour la finale, 50 pour un verrou — et le premier dépasse
  // bien le plafond de la carte, ce qui est tout l'arbitrage Q8.
  const T = positionBaseTerminale();
  assert.equal(siteDeLaCase(etat, T.rangee, T.colonne).niveau,
    GEOGRAPHIE.niveauDeLaBaseFinale);
  assert.equal(niveauDeLaGrosseBase('baseTerminale', T.rangee), 60);
  assert.ok(GEOGRAPHIE.niveauDeLaBaseFinale > GEOGRAPHIE.niveauPlafond,
    'la finale ne dépasse plus le plafond de la carte : Q8 a été défaite');
  for (const v of positionsDesVerrous()) {
    assert.equal(siteDeLaCase(etat, v.rangee, v.colonne).niveau, GEOGRAPHIE.niveauPlafond);
  }
});

// ---------------------------------------------------------------------------
// T5 — la porte
// ---------------------------------------------------------------------------

test('VERROU T5 — la finale refuse le raid tant qu\'un seul verrou tient', () => {
  const etat = creerEtat(GRAINE);
  const T = positionBaseTerminale();
  // Une base attaquante posée à portée : le refus mesuré doit être le VERROU,
  // pas la distance.
  const attaquante = { position: { rangee: T.rangee + 5, colonne: T.colonne } };
  assert.ok(estAPorteeDAttaque(attaquante.position, T),
    'le montage ne mesure rien : la cible est hors de portée');

  const codes = (e) => problemesDuRaid(e, attaquante, T).map((p) => p.code);

  assert.equal(verrousDebout(etat), GEOGRAPHIE.verrous.nombre);
  assert.equal(finaleDeverrouillee(etat), false);
  assert.ok(codes(etat).includes('verrou-terminale'), 'la finale s\'attaque verrouillée');

  // ⚠⚠ CINQ SUR SIX NE SUFFIT PAS — c'est une porte, pas une jauge. Ethan,
  // 10/09 : « il faut d'abord avoir rasé les six ». Sans cette assertion, un
  // `>= 5` passerait le test du haut comme celui du bas.
  etat.basesRasees = tousLesVerrousRases().slice(0, 5);
  assert.equal(verrousDebout(etat), 1);
  assert.equal(finaleDeverrouillee(etat), false);
  assert.ok(codes(etat).includes('verrou-terminale'),
    'la finale s\'ouvre à cinq verrous sur six');

  // Six sur six : la porte s'ouvre.
  etat.basesRasees = tousLesVerrousRases();
  assert.equal(verrousDebout(etat), 0);
  assert.equal(finaleDeverrouillee(etat), true);
  assert.ok(!codes(etat).includes('verrou-terminale'),
    'la finale reste verrouillée alors que les six sont rasés');

  // ⚠ ET LE VERROU NE MORD QUE SUR LA FINALE. Un verrou s'attaque dès le début,
  // sinon le jeu n'aurait aucune entrée.
  const neuf = creerEtat(GRAINE);
  const v = positionsDesVerrous()[0];
  const versVerrou = problemesDuRaid(neuf, { position: { rangee: v.rangee + 3, colonne: v.colonne } }, v);
  assert.ok(!versVerrou.map((p) => p.code).includes('verrou-terminale'),
    'un verrou est lui-même verrouillé : le jeu n\'a plus d\'entrée');
});

// ---------------------------------------------------------------------------
// T6 — les sept se combattent vraiment
// ---------------------------------------------------------------------------

test('VERROU T6 — la finale se compose et se combat au niveau 60', () => {
  const etat = creerEtat(GRAINE);

  // ⚠⚠ LE NIVEAU 60 TRAVERSE SEPT BORNES, ET CHACUNE LEVAIT AVANT CE LOT :
  // `palierDeNiveau`, `creerCombat`, la validation d'entité, `facteurMilli`,
  // `genererSite`, `genererVague` et celle des ruines. Ce test les traverse
  // toutes d'un coup — si l'une se referme, il tombe.
  for (const base of grossesBasesDeLaCarte()) {
    const site = siteDeLaCase(etat, base.rangee, base.colonne);
    const montage = montageDuSite(etat.graine, site);
    assert.equal(montage.niveau, site.niveau);
    assert.ok(montage.batiments.length > 0, `« ${base.type} » n'a aucun bâtiment`);
    assert.ok(montage.defenseurs.length > 0, `« ${base.type} » n'a aucun défenseur`);
    assert.doesNotThrow(() => creerCombat(montage),
      `« ${base.type} » ne se combat pas au niveau ${site.niveau}`);
  }

  // ⚠ LA DENSITÉ EST CELLE D'UNE BASE, ET ELLE NE MONTE PAS AVEC LE NIVEAU 60.
  // `DENSITE.parNiveau` s'arrête à 50 et `encadrer` borne au dernier palier :
  // la finale a donc les MÊMES effectifs qu'un verrou. Ce qui les sépare est la
  // force de chaque unité, pas leur nombre — un fait d'équilibrage, dit ici
  // pour qu'un lot futur ne le découvre pas comme un défaut.
  assert.deepEqual(densite('baseTerminale', GEOGRAPHIE.niveauDeLaBaseFinale),
    densite('baseVerrou', GEOGRAPHIE.niveauPlafond));
  // Et c'est bien la densité d'une base — avant-poste + 10 % —, pas celle d'un
  // avant-poste nu.
  assert.notDeepEqual(densite('baseVerrou', GEOGRAPHIE.niveauPlafond),
    densite('avantPoste', GEOGRAPHIE.niveauPlafond));
  assert.deepEqual(densite('baseVerrou', GEOGRAPHIE.niveauPlafond),
    densite('base', GEOGRAPHIE.niveauPlafond));

  // La borne maximale d'un site est bien celle de la finale, et elle dépasse
  // celle de la carte.
  assert.equal(NIVEAU_MAXIMAL_DUN_SITE, GEOGRAPHIE.niveauDeLaBaseFinale);
  assert.ok(NIVEAU_MAXIMAL_DUN_SITE > GEOGRAPHIE.niveauPlafond);
});

// ---------------------------------------------------------------------------
// T7 — la migration
// ---------------------------------------------------------------------------

test('VERROU T7 — la v39 retire les ruines tombées sous les sept emprises', () => {
  // ⚠ LE NUMÉRO EST CELUI DU LOT GRILLE LONGUE (40) DEPUIS LE 20/09/2026 ; ce que
  // ce test garde est que SON maillon, 38 → 39, est encore dans la chaîne.
  // ⚠ RÉANCRÉ AU LOT ARTILLERIE-RECHERCHE, 23/09/2026 : 40 → 41. Ce que ce test
  // garde est que SON maillon, 38 → 39, est encore dans la chaîne — pas le nombre.
  // ⚠ RÉANCRÉ AU LOT ÉTAI-RÉTABLI, 25/09/2026 : 41 → 42, maillon VIDE — le
  // champ `retour.sansPalier` est facultatif, donc aucune v41 n'a rien à gagner
  // à une conversion ; le numéro dit seulement qu'une v42 peut le porter.
  assert.equal(SAVE_VERSION, 42, 'SAVE_VERSION n\'est plus celle du lot ÉTAI-RÉTABLI');

  // ⚠⚠ CE QUE CE MAILLON ÉVITE EST UNE PANNE MUETTE. `siteDeLaCase` interroge
  // `casesRasees` AVANT de rendre une grosse base : une case rasée sous une
  // emprise rendrait `null` là où le jeu doit rendre un verrou. Le joueur
  // trouverait un trou au bout de la carte, et une base finale à jamais
  // inattaquable — sans qu'aucune ligne ne l'explique.
  const sousLaFinale = positionBaseTerminale();
  const sousUnVerrou = positionsDesVerrous()[2];
  const ailleurs = { rangee: 200, colonne: 10 };
  assert.equal(grosseBaseDeLaCase(ailleurs.rangee, ailleurs.colonne), null,
    'le montage ne mesure rien : la case témoin est sous une emprise');

  const ancienne = JSON.parse(JSON.stringify({
    ...creerEtat(GRAINE),
    version: 38,
    basesRasees: [
      { rangee: sousLaFinale.rangee, colonne: sousLaFinale.colonne, minute: 1, type: 'base', niveau: 50 },
      { rangee: ailleurs.rangee, colonne: ailleurs.colonne, minute: 2, type: 'base', niveau: 12 },
      { rangee: sousUnVerrou.rangee, colonne: sousUnVerrou.colonne, minute: 3, type: 'base', niveau: 50 },
    ],
  }));
  assert.equal(ancienne.basesRasees.length, 3, 'le montage ne mesure rien : pas trois ruines');

  const migree = migrer(ancienne);
  assert.equal(migree.version, SAVE_VERSION);
  // ⚠ LES DEUX ORPHELINES PARTENT, LA TROISIÈME RESTE : le lot ne rend au
  // joueur aucune conquête qu'il a faite ailleurs.
  assert.deepEqual(migree.basesRasees.map((e) => `${e.rangee},${e.colonne}`),
    [`${ailleurs.rangee},${ailleurs.colonne}`],
    'la migration n\'a pas retiré exactement les ruines sous emprise');

  // Et après migration, les sept bases se rendent bien.
  const etat = { ...creerEtat(GRAINE), basesRasees: migree.basesRasees };
  for (const base of grossesBasesDeLaCarte()) {
    assert.ok(siteDeLaCase(etat, base.rangee, base.colonne),
      `« ${base.type} » reste introuvable après migration`);
  }
});

// ---------------------------------------------------------------------------
// T8 — un verrou rasé est une ruine, pas un rapport qui ment
// ---------------------------------------------------------------------------

test('VERROU T8 — raser un verrou par sa Souche l\'inscrit parmi les ruines', () => {
  // ⚠⚠ C'EST LA PORTE DE LA BASE FINALE QUI EST EN JEU. `verrousDebout` compte
  // les ancres qui ne sont PAS dans `casesRasees` : un verrou rasé que
  // `retirerLeSite` n'inscrit pas reste compté debout pour toujours, et
  // `finaleDeverrouillee` ne peut jamais rendre vrai. Rien ne lève — le raid
  // dit « rasé », le joueur voit le verrou revenir, et la partie ne peut plus
  // finir.
  const etat = creerEtat(2026);
  rattraperJeu(etat, 3001);
  const p = positionsDesVerrous()[0];
  const identite = siteDeLaCase(etat, p.rangee, p.colonne);
  assert.ok(identite !== null, 'le montage ne mesure rien : aucun site sur le premier verrou');
  assert.equal(identite.type, 'baseVerrou',
    'le montage ne mesure rien : le premier verrou ne rend pas un verrou');

  const avant = verrousDebout(etat);
  const ruinesAvant = etat.basesRasees.length;
  assert.equal(avant, positionsDesVerrous().length,
    'le montage ne mesure rien : un verrou était déjà tombé');

  // Un résultat de combat vrai — le montage régénéré du site —, dont on ne
  // retient que la cause : c'est la seule chose que `enregistrerLeRaid` lise
  // avant de raser.
  const resultat = construireResultat(creerCombat(montageDuSite(etat.graine, identite)));
  resultat.cause = 'souche';

  assert.deepEqual(enregistrerLeRaid(etat, identite, resultat), { rase: true });
  assert.equal(etat.basesRasees.length, ruinesAvant + 1,
    'le verrou rasé n\'a pas rejoint les ruines');
  assert.equal(verrousDebout(etat), avant - 1,
    `le verrou rasé est toujours compté debout : ${verrousDebout(etat)} sur ${avant}`);

  // ⚠ ET CHACUNE DES CASES DE SON EMPRISE CESSE DE LE RENDRE — pas seulement
  // l'ancre. Une grosse base rend le MÊME site depuis chacune de ses cases
  // (`VERROU T4`) ; une ruine qui ne mordrait que l'ancre laisserait le verrou
  // attaquable par ses trois autres cases.
  const e = empriseDeLaGrosseBase(GEOGRAPHIE.verrous.cotes, p);
  assert.ok(e.cotes > 1, 'le montage ne mesure rien : un verrou d\'une seule case');
  for (let r = e.rangee; r < e.rangee + e.cotes; r++) {
    for (let c = e.colonne; c < e.colonne + e.cotes; c++) {
      assert.equal(siteDeLaCase(etat, r, c), null,
        `la case (${r}, ${c}) du verrou rasé porte toujours un site`);
    }
  }

  // Et la ruine se dessine, et elle émet — le type qu'elle porte est celui du
  // VAINCU, et les deux lecteurs doivent le connaître.
  const ruine = etat.basesRasees.at(-1);
  assert.equal(ruine.type, 'baseVerrou', 'la ruine n\'a pas le type du verrou');
  assert.doesNotThrow(() => spriteDeLaRuine(ruine.type, 1));
  assert.doesNotThrow(() => campDeLaCase(etat, p.rangee, p.colonne));
  assert.doesNotThrow(() => territoireDeLaFenetre(etat, {
    premiereRangee: Math.max(1, p.rangee - 5),
    derniereRangee: p.rangee + 5,
    premiereColonne: 1,
    derniereColonne: GEOGRAPHIE.carte.largeur,
  }));
});

// ---------------------------------------------------------------------------
// LONGUE T1 — les sept jouent long, les autres ne bougent pas
// ---------------------------------------------------------------------------

test('LONGUE T1 — les sept jouent long, les autres ne bougent pas', () => {
  // ⚠⚠ LA GRILLE LONGUE EST UN SECOND OBJET, GÉOMÉTRIE SEULE, ET `GRILLE` N'EST
  // PAS MUTÉE — c'est l'invariant du lot GRILLE-PORTÉE, mesuré par `PORTÉE T1`,
  // et il est le préalable de tout ce qui suit. Ses quatre clés se NOMMENT : un
  // champ de calibrage recopié ici serait une seconde vérité, et surtout il
  // VOYAGERAIT dans chaque rapport rejouable de la sauvegarde.
  assert.equal(TYPES_SITE.baseVerrou.grille, GRILLE_LONGUE);
  assert.equal(TYPES_SITE.baseTerminale.grille, GRILLE_LONGUE);
  assert.notEqual(GRILLE_LONGUE, GRILLE, 'la grille longue est la grille par défaut');
  assert.deepEqual(Object.keys(GRILLE_LONGUE).sort(), ['bandes', 'casesBatiments', 'largeur', 'longueur'],
    'GRILLE_LONGUE porte autre chose que sa géométrie');
  assert.deepEqual(GRILLE_LONGUE, {
    largeur: 9, longueur: 27,
    bandes: {
      deploiement: { premiere: 1, derniere: 2 },
      defense: { premiere: 3, derniere: 18 },
      batiments: { premiere: 19, derniere: 27 },
    },
    casesBatiments: 81,
  });
  assert.doesNotThrow(() => verifierGrille(GRILLE_LONGUE, 'LONGUE T1'));
  assert.deepEqual(GRILLE.bandes.defense, { premiere: 3, derniere: 10 }, 'GRILLE a été mutée');
  assert.equal(GRILLE.longueur, 18, 'GRILLE a été mutée');
  // Les cinq autres types n'ont pas le champ — donc prennent le défaut.
  for (const type of ['camp', 'avantPoste', 'base']) {
    assert.equal(Object.hasOwn(TYPES_SITE[type], 'grille'), false,
      `« ${type} » porte une grille : il jouerait long`);
  }

  // ⚠⚠ ET AUCUNE LIGNE DE `src/` NE LIT UN CALIBRAGE SUR UNE GRILLE REÇUE EN
  // ARGUMENT. Mesuré avant d'écrire la table : les treize lectures de
  // `vaguesParRaid`, `intervalleVagueSec`, `tickSec`, `dureeMaxCombatSec`,
  // `plancherReservePct`, `ticksAvantRepli` et `lateral` nomment toutes
  // `GRILLE`. Le jour où une lecture `grille.<calibrage>` entrera, ce test la
  // nommera, et c'est ce jour-là que l'étalement deviendra juste.
  const CALIBRAGE = ['vaguesParRaid', 'intervalleVagueSec', 'tickSec', 'dureeMaxCombatSec',
    'plancherReservePct', 'ticksAvantRepli', 'lateral'];
  const motif = new RegExp(`(?<![A-Za-z0-9_$])grille\\??\\.(${CALIBRAGE.join('|')})(?![A-Za-z0-9_$])`);
  assert.match('const n = grille.vaguesParRaid;', motif, 'le motif ne reconnaît pas la faute');
  assert.match('etat.grille?.tickSec', motif, 'le motif ne reconnaît pas la faute optionnelle');
  assert.doesNotMatch('GRILLE.vaguesParRaid', motif, 'le motif accuse la grille par défaut');
  const fautives = [];
  for (const dossier of ['data', 'sim', 'render', 'ui']) {
    for (const fichier of readdirSync(join(RACINE, 'src', dossier))) {
      const source = sansCommentaires(readFileSync(join(RACINE, 'src', dossier, fichier), 'utf8'));
      if (motif.test(source)) fautives.push(`${dossier}/${fichier}`);
    }
  }
  assert.deepEqual(fautives, [], 'une grille reçue en argument porte du calibrage : l\'étalement devient juste');

  // ⚠⚠ LES TIERS SE DÉRIVENT PAR LE RAPPORT ENTIER DES HAUTEURS, ET LE RESTE EST
  // UN REFUS. Seize sur huit font 2, donc `[6, 4, 6]` — les proportions 3/2/3
  // tiennent par construction, pas par recopie. Une bande de DOUZE n'est pas un
  // multiple : elle demande sa propre table, et répartir un reste serait choisir
  // OÙ vont les rangées en trop, c'est-à-dire de l'équilibrage.
  assert.deepEqual(tiersDeLaDefense(GRILLE_LONGUE), {
    avant: { premiere: 3, derniere: 8 }, milieu: { premiere: 9, derniere: 12 }, arriere: { premiere: 13, derniere: 18 },
  });
  assert.deepEqual(tiersDeLaDefense(), {
    avant: { premiere: 3, derniere: 5 }, milieu: { premiere: 6, derniere: 7 }, arriere: { premiere: 8, derniere: 10 },
  }, 'les tiers de la grille par défaut ont bougé');
  const douze = verifierGrille({
    ...GRILLE_LONGUE,
    longueur: 23,
    bandes: { ...GRILLE_LONGUE.bandes, defense: { premiere: 3, derniere: 14 }, batiments: { premiere: 15, derniere: 23 } },
  }, 'LONGUE T1 douze');
  assert.throws(() => tiersDeLaDefense(douze), /les tiers couvrent 8 rangées, la bande en fait 12/,
    'une bande de douze se répartit au lieu d\'être refusée');

  // ⚠⚠ LE FACTEUR SE DÉRIVE DES CASES DE DÉFENSE, IL NE S'ÉCRIT PAS « × 2 » —
  // et il est en MILLIÈMES, ce qui est un écart déclaré au brief (« === 1 ») :
  // c'est l'unité de tout le moteur. 144 cases de défense pour 72 font 2000 ;
  // la grille par défaut rend 1000, et `effectifDeDefense` y est l'identité.
  assert.equal(casesDeDefense(GRILLE), 72);
  assert.equal(casesDeDefense(GRILLE_LONGUE), 144);
  assert.equal(facteurDeDefenseMilli(GRILLE), 1000);
  assert.equal(facteurDeDefenseMilli(), 1000);
  assert.equal(facteurDeDefenseMilli(GRILLE_LONGUE), 2000);
  const defensesDUneBase = densite('base', GEOGRAPHIE.niveauPlafond).defenses;
  assert.equal(defensesDUneBase, 39, 'le montage ne mesure rien : une base de niveau 50 ne fait plus 39 défenses');
  assert.equal(effectifDeDefense(defensesDUneBase, GRILLE), defensesDUneBase);
  // Le 78 est CALCULÉ — deux fois, par deux chemins — et jamais écrit.
  assert.equal(effectifDeDefense(defensesDUneBase, GRILLE_LONGUE), defensesDUneBase * 2);
  assert.equal(effectifDeDefense(defensesDUneBase, GRILLE_LONGUE),
    Math.floor((defensesDUneBase * facteurDeDefenseMilli(GRILLE_LONGUE) + 500) / 1000));
  // ⚠ ET C'EST 78, PAS 77 : `DENSITE.parNiveau` sert les cinq types et ne bouge
  // pas — doubler la table donnerait 77, l'arrondi au demi supérieur donne 78.
  assert.equal(effectifDeDefense(39, GRILLE_LONGUE), 78);
  assert.notEqual(effectifDeDefense(39, GRILLE_LONGUE), 77);

  // ⚠⚠ LES SITES, SUR PLUSIEURS GRAINES : les sept jouent long, les trois autres
  // ne bougent pas — 39 bâtiments dans la bande 19–27 et 78 défenses dans la
  // bande 3–18 d'un côté, les bandes d'hier de l'autre. « Identique au bit à ce
  // que `main` rendait » est ce que les deux cents témoins de `JOURNAL T1`
  // mesurent ; ici on nomme les bandes, et on exige que la bande LONGUE serve
  // vraiment — au moins une défense au-delà de la rangée 10, qui n'existe pas
  // sur la grille par défaut. ⚠ Le premier jet écrivait les rangées EXACTES
  // (12–18 pour un camp) : elles varient avec la graine depuis PAQUETS, et c'est
  // la bande qui est la règle, pas la rangée où le tirage a posé le premier
  // paquet.
  const mesure = (site, grille) => {
    const rb = site.batiments.map((b) => b.rangee);
    const rd = site.defenseurs.map((d) => d.rangee);
    const dans = (r, bande) => r >= bande.premiere && r <= bande.derniere;
    return {
      batiments: site.batiments.length,
      defenses: site.defenseurs.length,
      batimentsDansLaBande: rb.every((r) => dans(r, grille.bandes.batiments)),
      defensesDansLaBande: rd.every((r) => dans(r, grille.bandes.defense)),
      derniereRangeeDeDefense: Math.max(...rd),
    };
  };
  const ATTENDU = {
    camp: { grille: GRILLE, batiments: 25, defenses: 25 },
    avantPoste: { grille: GRILLE, batiments: 35, defenses: 35 },
    base: { grille: GRILLE, batiments: 39, defenses: 39 },
    baseVerrou: { grille: GRILLE_LONGUE, batiments: 39, defenses: 78 },
    baseTerminale: { grille: GRILLE_LONGUE, batiments: 39, defenses: 78 },
  };
  assert.deepEqual(Object.keys(ATTENDU).sort(), Object.keys(TYPES_SITE).sort(), 'un type du roster n\'est pas mesuré');
  for (const graine of [7, 11, 42, 1234, 99991]) {
    for (const [type, attendu] of Object.entries(ATTENDU)) {
      const site = genererSite({ type, niveau: GEOGRAPHIE.niveauPlafond, graine });
      const m = mesure(site, attendu.grille);
      assert.equal(m.batiments, attendu.batiments, `« ${type} » graine ${graine} : bâtiments`);
      assert.equal(m.defenses, attendu.defenses, `« ${type} » graine ${graine} : défenses`);
      assert.ok(m.batimentsDansLaBande, `« ${type} » graine ${graine} : un bâtiment hors de sa bande`);
      assert.ok(m.defensesDansLaBande, `« ${type} » graine ${graine} : une défense hors de sa bande`);
      if (attendu.grille === GRILLE_LONGUE) {
        assert.ok(m.derniereRangeeDeDefense > GRILLE.bandes.defense.derniere,
          `« ${type} » graine ${graine} : la bande longue ne sert pas, tout tient en 3–10`);
        assert.ok(Math.min(...site.batiments.map((b) => b.rangee)) >= 19,
          `« ${type} » graine ${graine} : un bâtiment sous la rangée 19`);
      } else {
        assert.ok(m.derniereRangeeDeDefense <= GRILLE.bandes.defense.derniere);
      }
      // ⚠ LA GRILLE EST SUR LE MONTAGE DES SEPT, ET ABSENTE — PAS `undefined`,
      // ABSENTE — DES AUTRES : `serialiserEtat` trie les clés PROPRES, et un
      // champ posé partout entrerait dans l'empreinte des deux cents témoins.
      if (Object.hasOwn(TYPES_SITE[type], 'grille')) {
        assert.equal(site.grille, GRILLE_LONGUE, `« ${type} » ne porte pas sa grille`);
        // Et le site long se combat : `creerCombat` accepte les rangées 19–27.
        assert.doesNotThrow(() => creerCombat({ ...site, vagues: [] }), `« ${type} » ne se combat pas`);
      } else {
        assert.equal(Object.hasOwn(site, 'grille'), false, `« ${type} » porte une clé grille`);
      }
    }
  }
  // Et la finale au niveau 60 joue long aussi — c'est le niveau qu'elle a.
  const finale = genererSite({ type: 'baseTerminale', niveau: GEOGRAPHIE.niveauDeLaBaseFinale, graine: GRAINE });
  const mf = mesure(finale, GRILLE_LONGUE);
  assert.equal(mf.batiments, 39);
  assert.equal(mf.defenses, 78);
  assert.ok(mf.batimentsDansLaBande && mf.defensesDansLaBande && mf.derniereRangeeDeDefense > 10);
});

// ---------------------------------------------------------------------------
// LONGUE T2 — la grille longue voyage jusqu'au rejeu, et le maillon la laisse passer
// ---------------------------------------------------------------------------

test('LONGUE T2 — la grille longue voyage jusqu\'au rejeu, et le maillon la laisse passer', () => {
  // ⚠ LE MONTAGE : une partie qui peut raider, posée à cinq cases sous le
  // premier verrou. `position` bouge, `fondation` non — le terrain reste celui
  // du départ, et c'est la règle du dépôt depuis le 27/08.
  const etat = partieJouable(GRAINE);
  const verrou = positionsDesVerrous()[0];
  baseCourante(etat).position = { rangee: verrou.rangee + 5, colonne: verrou.colonne };
  assert.ok(estAPorteeDAttaque(baseCourante(etat).position, verrou),
    'le montage ne mesure rien : le verrou est hors de portée');
  const site = siteDeLaCase(etat, verrou.rangee, verrou.colonne);
  assert.equal(site.type, 'baseVerrou', 'le montage ne mesure rien : la case n\'est pas un verrou');

  // 1. Un combat monté sur un verrou porte `etat.grille` ; un combat sur une base
  //    ordinaire N'A PAS LA CLÉ — c'est `creerCombat` qui l'écrit, seul, et
  //    seulement si le montage en porte une (`PORTÉE T2`, par la source).
  const origine = combatDOrigine(etat, verrou);
  assert.equal(Object.hasOwn(origine.combat, 'grille'), true, 'un combat sur un verrou ne porte pas sa grille');
  assert.equal(origine.combat.grille.longueur, 27);
  assert.equal(origine.montage.grille, GRILLE_LONGUE, 'le montage rangé ne porte pas la grille longue');
  const camp = premierCamp(etat);
  assert.ok(camp !== null, 'le montage ne mesure rien : aucun camp autour de la base');
  const ordinaire = combatDOrigine(etat, camp);
  assert.equal(Object.hasOwn(ordinaire.combat, 'grille'), false, 'un combat ordinaire porte une clé grille');
  assert.equal(Object.hasOwn(ordinaire.montage, 'grille'), false, 'un montage ordinaire porte une clé grille');

  // 2. Le rapport rangé par `pourLeRejeu` PORTE LA GRILLE, et le rejeu du rapport
  //    rend le même résultat que le combat d'origine — au tick près, et à
  //    l'octet près sur l'état sérialisé.
  const rapport = executerRaid(etat, baseCourante(etat), verrou);
  assert.equal(etat.rapports.length, 1);
  assert.deepEqual(rapport.rejeu, origine.montage, 'le montage rangé n\'est pas celui du combat d\'origine');
  assert.deepEqual(rapport.rejeu.grille, GRILLE_LONGUE, 'le rapport ne porte pas la grille longue');
  const rejoue = creerCombat(rapport.rejeu);
  assert.equal(Object.hasOwn(rejoue, 'grille'), true);
  const resultatRejoue = resoudre(rejoue);
  assert.equal(resultatRejoue.cause, rapport.cause);
  assert.equal(resultatRejoue.tick, rapport.ticks);
  assert.equal(serialiserEtat(rejoue), serialiserEtat(origine.combat),
    'le rejeu du rapport ne rend pas le combat d\'origine');
  // Et le montage n'est pas dégénéré : le combat a eu lieu, sur une grille où
  // les défenses vont jusqu'en rangée 18.
  assert.ok(rapport.ticks > 0, 'le montage ne mesure rien : aucun tick joué');
  assert.equal(Math.max(...rapport.rejeu.defenseurs.map((d) => d.rangee)), 18);
  // ⚠ ET LA GRILLE TRAVERSE LA SAUVEGARDE — c'est TOUT le motif de SAVE_VERSION 40.
  const relu = charger(serialiser(etat, 1_700_000_000_000), 1_700_000_000_000);
  assert.deepEqual(relu.rapports[0].rejeu.grille, GRILLE_LONGUE, 'la grille ne traverse pas la sauvegarde');
  const rejoueRelu = creerCombat(relu.rapports[0].rejeu);
  resoudre(rejoueRelu);
  assert.equal(serialiserEtat(rejoueRelu), serialiserEtat(origine.combat), 'le rejeu après rechargement diverge');

  // 3. Le maillon 39 → 40 LAISSE INTACTS les rapports d'avant : un rapport sans
  //    grille rejoue sur `GRILLE`, et rend le même résultat — c'est ce que sa
  //    doc annonce, « une montée de version sans transformation ».
  const ancien = partieJouable(GRAINE);
  const campAncien = premierCamp(ancien);
  const origineAncienne = combatDOrigine(ancien, campAncien);
  const rapportAncien = executerRaid(ancien, baseCourante(ancien), campAncien);
  assert.equal(Object.hasOwn(rapportAncien.rejeu, 'grille'), false, 'un raid ordinaire range une grille');
  const v39 = JSON.parse(serialiser(ancien, 1_700_000_000_000));
  v39.version = 39;
  const migre = migrer(v39);
  // ⚠ RÉANCRÉ AU LOT ARTILLERIE-RECHERCHE : la chaîne ne s'arrête plus à 40.
  // ⚠ RÉANCRÉ AU LOT ÉTAI-RÉTABLI, 25/09/2026 : ni à 41 — maillon vide 41 → 42.
  assert.equal(migre.version, 42);
  assert.deepEqual(migre.rapports, JSON.parse(serialiser(ancien, 1_700_000_000_000)).rapports,
    'le maillon 39 → 40 a réécrit les rapports');
  assert.equal(JSON.stringify(migre.rapports[0].rejeu), JSON.stringify(rapportAncien.rejeu),
    'le montage d\'un vieux rapport a bougé d\'un octet');
  assert.equal(Object.hasOwn(migre.rapports[0].rejeu, 'grille'), false, 'le maillon a posé une grille sur un vieux rapport');
  const vieux = creerCombat(migre.rapports[0].rejeu);
  assert.equal(Object.hasOwn(vieux, 'grille'), false, 'un vieux rapport rejoue sur une grille posée');
  const resultatVieux = resoudre(vieux);
  assert.equal(resultatVieux.cause, rapportAncien.cause);
  assert.equal(resultatVieux.tick, rapportAncien.ticks);
  assert.equal(serialiserEtat(vieux), serialiserEtat(origineAncienne.combat),
    'un vieux rapport ne rejoue plus le combat qui a eu lieu');
  // ⚠ ET LE MAILLON EXISTE — un `SAVE_VERSION` à 40 sans maillon 39 ferait lever
  // la chaîne sur toute sauvegarde d'avant le lot.
  assert.doesNotThrow(() => migrer({ ...JSON.parse(serialiser(ancien, 1_700_000_000_000)), version: 39 }));
});
