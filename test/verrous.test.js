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

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  GEOGRAPHIE, TYPES_SITE, TYPES_DE_BASE, NIVEAU_MAXIMAL_DUN_SITE, EMBLEMES_CARTE,
} from '../src/data/sites.js';
import {
  positionsDesVerrous, positionBaseTerminale, grossesBasesDeLaCarte,
  grosseBaseDeLaCase, empriseDeLaGrosseBase, niveauDeLaGrosseBase, estSurLaCarte,
  COTES_GROSSE_BASE,
} from '../src/sim/carte.js';
import { estBaseOuvrage } from '../src/sim/peuplement.js';
import { siteDeLaCase, montageDuSite } from '../src/sim/site-de-la-case.js';
import { problemesDuRaid } from '../src/sim/raid.js';
import { verrousDebout, finaleDeverrouillee } from '../src/sim/ruines.js';
import { creerEtat, SAVE_VERSION, migrer } from '../src/sim/state.js';
import { creerCombat } from '../src/sim/combat.js';
import { densite } from '../src/sim/generateur.js';
import { estAPorteeDAttaque } from '../src/sim/points-attaque.js';

const GRAINE = 7;

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
  assert.equal(SAVE_VERSION, 39, 'SAVE_VERSION n\'est plus celle du lot VERROUS');

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
