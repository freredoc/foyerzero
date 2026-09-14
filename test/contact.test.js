// test/contact.test.js — LE PAS S'ARRÊTE AU CONTACT (lot CONTACT, 13/09/2026)
// ===========================================================================
//
// Ethan, 13/09 : « Quand deux unités défensives se déplacent, elles semblent
// entrer en collision, puis une ou l'autre est poussée très rapidement », puis,
// l'arbitrage : « **Je ne veux pas de saut, ni de chevauchement.** »
//
// Ce fichier porte les DEUX mots de cet arbitrage, et rien d'autre. Il ne
// double aucun test existant : `mur.test.js` garde la règle DEVANT UNE
// STRUCTURE, `arret.test.js` l'histoire des trois arbitrages, `repli.test.js`
// le compteur. Ici on ne regarde ni qui bloque qui, ni pourquoi — on regarde
// **les positions**, tick par tick, et on refuse deux choses.
//
// ⚠⚠ LE MONTAGE INTERDIT LE BOOSTER, ET CE N'EST PAS UNE PRÉCAUTION. Son ×10
// porterait la borne de l'Éclaireur de 240 à 2 400 : le saut de **920** que ce
// lot corrige y passerait sans être vu. `modulesDebloques` est vide partout, et
// `CONTACT T1` l'asserte sur chaque montage avant de mesurer quoi que ce soit.
//
// ⚠ ET `obstacles: []` PARTOUT, pour la même raison prise par l'autre bout : un
// obstacle DIVISE la vitesse, donc il ne peut que rendre la borne plus large que
// le pas réel — mais il la rendrait imprévisible depuis la table, et la borne
// cesserait d'être lue pour être devinée.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  creerCombat, tick, ECRASEMENT_TICKS, ECRASEMENT_FREIN,
} from '../src/sim/combat.js';
import { MILLI_PAR_CASE } from '../src/sim/grille.js';
import { genererSite } from '../src/sim/generateur.js';
import { DEFENSES, GRILLE, UNITES } from '../src/data/combat.js';

const GANGUE_LOINTAINE = { id: 'gangue', rangee: 18, colonne: 1 };
const SANS_MODULE = {
  ouvrage: { offense: [], defense: [] },
  joueur: { offense: [], defense: [] },
};

const montage = (o) => ({
  niveau: 1,
  saveur: null,
  obstacles: [],
  batiments: [GANGUE_LOINTAINE],
  defenseurs: [],
  vagues: [[]],
  modulesDebloques: SANS_MODULE,
  ...o,
});

// ---------------------------------------------------------------------------
// Ce que la TABLE dit du pas d'une pièce — jamais ce que le moteur en fait
// ---------------------------------------------------------------------------

/**
 * Le pas maximal d'une entité, LU DANS `src/data/combat.js`.
 *
 * ⚠ LES DEUX AXES N'ONT PAS LA MÊME BORNE, et la latérale se DÉRIVE :
 * `floor(vitesse × GRILLE.lateral.numerateur / .denominateur)`. Écrire
 * `vitesse × 2 / 3` ici ferait une seconde vérité sur le ×2/3, que
 * `COL T13` garde déjà côté moteur.
 *
 * ⚠ ET UNE DÉFENSE COMME UN BÂTIMENT RENDENT ZÉRO : ni `DEFENSES` ni les
 * bâtiments ne portent de `vitesse`, donc leur profil a `vitesseMilli` nul et
 * leur pas doit l'être aussi. Une borne nulle est la plus forte des bornes,
 * et c'est bien ce qu'on veut dire — un mur ne se déplace pas d'un millième.
 */
function bornesDuPas(genre, id) {
  if (genre !== 'unite') return { rangee: 0, colonne: 0 };
  const vitesse = UNITES[id].vitesse;
  const { numerateur, denominateur } = GRILLE.lateral;
  return { rangee: vitesse, colonne: Math.floor((vitesse * numerateur) / denominateur) };
}

/**
 * Une entité est-elle BLOQUANTE ? La question se pose à la table de son genre,
 * dans les termes exacts de `profil*` — `masse > 0` pour une unité,
 * `bloque === true` pour une défense, toujours vrai pour un bâtiment.
 *
 * ⚠ L'AVIATION EN SORT, ET CE N'EST PAS UNE FAVEUR : masse nulle, elle ne
 * bloque ni n'est bloquée, donc deux aéronefs superposés ne sont pas un
 * chevauchement mais deux objets qui se croisent à des altitudes différentes.
 */
function estBloquante(genre, id) {
  if (genre === 'batiment') return true;
  if (genre === 'defense') return DEFENSES[id].bloque === true;
  return UNITES[id].masse > 0;
}

const estActive = (e) => e.vivant && !e.sorti && !e.embarquee;

/**
 * La masse d'une entité, LUE DANS LA TABLE. Seules les unités en portent une —
 * `profilDefense` et `profilBatiment` rendent `masse: 0`, et c'est ce qui fait
 * qu'une unité de masse 1 écrase un mur.
 */
const masseDe = (e) => (e.genre === 'unite' ? UNITES[e.id].masse : 0);

/** Un relevé de positions, indexé par indice d'entité. */
const releverPositions = (etat) => {
  const m = new Map();
  for (const e of etat.entites) {
    if (!estActive(e)) continue;
    m.set(e.indice, { r: e.rangeeMilli, c: e.colonneMilli });
  }
  return m;
};

// ---------------------------------------------------------------------------
// Les montages — les trois du brief, plus quatre raids réels
// ---------------------------------------------------------------------------

/**
 * ⚠⚠ LE PREMIER EST CELUI QUI A FAIT LE LOT, et il est reproduit à la lettre du
 * §1 du brief : deux Éclaireurs de garnison en rangée 6, colonnes 3 et 9, une
 * infanterie assaillante en colonne 6. Les deux convergent vers elle, et
 * AVANT le lot le second sautait de **920 millièmes au tick 27** contre un pas
 * nominal de 80 — ×11,5.
 */
const CONVERGENCE = montage({
  defenseurs: [
    { id: 'ratisseur', rangee: 6, colonne: 3 },
    { id: 'ratisseur', rangee: 6, colonne: 9 },
  ],
  vagues: [[{ id: 'meute', colonne: 6 }]],
});

/**
 * ⚠ LE JUMEAU VERTICAL, §1.3 du brief : un Éclaireur rattrape un Obusier dans
 * sa colonne. Avant le lot il avançait neuf ticks, RECULAIT de 80, se figeait
 * six ticks, repartait — l'écart réel au freinage valait 1 520 millièmes, donc
 * 520 de marge libre gâchée.
 */
const FILE = montage({
  defenseurs: [{ id: 'merlon', rangee: 10, colonne: 5 }],
  vagues: [
    [{ id: 'pilon', colonne: 5 }],
    [{ id: 'ratisseur', colonne: 5 }],
  ],
});

/**
 * ⚠ ET LE CAS HORS ALLIÉES, §1.4 : deux Fendeurs opposés, masse égale, dans la
 * même colonne. C'est le montage de `T7 b` de `combat.test.js`, qui assertait
 * `2960` au dépôt avant le lot COLONNE — 960 millièmes de recouvrement, écrits
 * noir sur blanc. ⚠ Il n'assertait plus 2 960 au moment du lot CONTACT mais
 * `2000` : le lot COLONNE l'avait déjà figé par l'arrêt sur prédilection. Le
 * montage est repris quand même, parce que ce qu'il exerce — une bloquante
 * arrêtée devant une ennemie de MÊME MASSE — n'est couvert par aucun autre.
 */
const MASSE_EGALE = montage({
  defenseurs: [{ id: 'fendeur', rangee: 3, colonne: 5 }],
  vagues: [[{ id: 'fendeur', colonne: 5 }]],
});

/** Une armée pleine, une pièce par colonne, sur les quatre vagues. */
function armee(ids, niveau) {
  const vagues = [[], [], [], []];
  ids.forEach((id, i) => {
    vagues[i % 4].push({ id, colonne: (Math.floor(i / 4) % 9) + 1, niveau });
  });
  return vagues.filter((v) => v.length > 0);
}

const TOUTES = Object.keys(UNITES);

/** Quatre raids RÉELS, pour que l'invariant ne tienne pas que sur des scènes nues. */
function raidsReels() {
  const sortie = [];
  for (const [type, saveur, niveau, graine] of [
    ['camp', 'richeQuartz', 5, 1],
    ['avantPoste', 'richeScorie', 20, 2],
    ['base', null, 35, 3],
    ['base', null, 50, 4],
  ]) {
    sortie.push([
      `${type}/n${niveau}/g${graine}`,
      { ...genererSite({ type, saveur, niveau, graine }), vagues: armee(TOUTES, niveau) },
    ]);
  }
  return sortie;
}

/**
 * ⚠⚠ LE MONTAGE DE L'ÉCRASEMENT, POUR `CONTACT-2 T1` — ET IL N'ENTRE PAS DANS
 * `MONTAGES`. Les deux invariants de ce fichier (aucun saut, aucun
 * chevauchement hors écrasement différé) sont mesurés sur les sept montages de
 * la table ; celui-ci sert à mesurer la DURÉE d'un écrasement, ce qui est une
 * autre grandeur. L'y ajouter ferait porter à `CONTACT T1` et à `CONTACT-2 T2`
 * des comptes qu'ils n'ont pas mesurés.
 *
 * Un Fendeur assaillant (masse 10) en rangée 2, colonne 5 ; un Meute défensif
 * (masse 1) en rangée 3, même colonne. L'écart vaut 3 000 − 2 000 = une case
 * pile, donc `margeDeContact` rend **zéro dès le premier tick** : le contact est
 * immédiat, et les quatre ticks se comptent à partir de là.
 */
const ECRASEMENT = montage({
  defenseurs: [{ id: 'meute', rangee: 3, colonne: 5 }],
  vagues: [[{ id: 'fendeur', rangee: GRILLE.bandes.deploiement.derniere, colonne: 5 }]],
});

const MONTAGES = [
  ['convergence (§1)', CONVERGENCE],
  ['file verticale (§1.3)', FILE],
  ['masse égale (§1.4)', MASSE_EGALE],
  ...raidsReels(),
];

const TICKS = 900;

// ---------------------------------------------------------------------------
// CONTACT T1 — AUCUN SAUT
// ---------------------------------------------------------------------------

// ⚠⚠ VU ROUGE SUR L'ARBRE INTACT AVANT D'ÊTRE ÉCRIT, comme le §8 du brief
// l'exige. Sur le moteur d'avant le lot, il tombe au premier montage :
//   « convergence (§1), tick 27 : ratisseur a sauté de 920 millièmes en
//     colonne (7 000 → 6 000), son pas vaut 80 »
// — c'est le nombre du §1, au millième.
//
// ⚠ ON NE COMPARE QUE LES ENTITÉS ACTIVES AUX DEUX TICKS, et c'est la seule
// exemption du test. Une entité qui APPARAÎT — une vague qui entre, une
// passagère qui débarque — est POSÉE à une position, elle ne s'y déplace pas :
// mesurer un « pas » entre l'absence et une position n'aurait aucun sens. Une
// entité qui meurt, se replie ou sort du champ quitte l'ensemble de la même
// façon. Ce qui reste est exactement ce que le moteur DÉPLACE.
test('CONTACT T1 — aucune entité ne franchit plus que son pas nominal en un tick', () => {
  let ticksMesures = 0;
  let pasMax = 0;
  for (const [nom, m] of MONTAGES) {
    // ⚠⚠ LE MONTAGE DOIT INTERDIRE LE BOOSTER, ET LA GARDE PORTE SUR LUI SEUL.
    // Son ×10 porterait la borne de l'Éclaireur de 240 à 2 400 : le saut de 920
    // du §1 y passerait sans être vu. C'est le SEUL module qui touche à la
    // vitesse — `vitesseDuTick` n'en lit aucun autre —, donc c'est lui qu'on
    // nomme. ⚠ Une garde « toutes les listes sont vides » aurait paru plus
    // stricte et aurait refusé les quatre raids RÉELS : `genererSite` arme
    // `ouvrage.defense` depuis le lot MODULES-F, avec cinq modules dont aucun
    // n'est le Booster.
    for (const camp of ['joueur', 'ouvrage']) {
      for (const branche of ['offense', 'defense']) {
        assert.ok(!m.modulesDebloques[camp][branche].includes('booster'),
          `montage « ${nom} » : ${camp}.${branche} arme le Booster, la borne sauterait à ×10`);
      }
    }
    // ⚠ LES OBSTACLES, EUX, SONT TOLÉRÉS SUR LES RAIDS RÉELS — et c'est un écart
    // au §8 du brief, déclaré. Il demande `obstacles: []` « pour que le pas soit
    // EXACTEMENT la vitesse de la table » ; l'assertion ci-dessous est une
    // INÉGALITÉ, et `vitesseSousObstacle` DIVISE — un obstacle ne peut donc que
    // rendre la borne plus large que le pas réel, jamais plus étroite. Les
    // retirer d'un site généré en ferait un autre site, et le lot perdrait les
    // quatre seuls montages où les quatorze pièces courent ensemble.
    if (!nom.startsWith('§') && !nom.includes('(§')) {
      assert.ok(Array.isArray(m.obstacles), `montage « ${nom} » : obstacles absents`);
    } else {
      assert.deepEqual(m.obstacles, [], `montage « ${nom} » : un obstacle fausserait la borne`);
    }

    const etat = creerCombat(m);
    let avant = releverPositions(etat);
    for (let t = 1; t <= TICKS; t += 1) {
      tick(etat);
      const apres = releverPositions(etat);
      for (const e of etat.entites) {
        if (!estActive(e)) continue;
        const d = avant.get(e.indice);
        if (d === undefined) continue; // elle vient d'apparaître : posée, pas déplacée
        const borne = bornesDuPas(e.genre, e.id);
        const dr = Math.abs(e.rangeeMilli - d.r);
        const dc = Math.abs(e.colonneMilli - d.c);
        assert.ok(dr <= borne.rangee,
          `${nom}, tick ${t} : ${e.id} a sauté de ${dr} millièmes en rangée `
          + `(${d.r} → ${e.rangeeMilli}), son pas vaut ${borne.rangee}`);
        assert.ok(dc <= borne.colonne,
          `${nom}, tick ${t} : ${e.id} a sauté de ${dc} millièmes en colonne `
          + `(${d.c} → ${e.colonneMilli}), son pas vaut ${borne.colonne}`);
        pasMax = Math.max(pasMax, dr, dc);
      }
      ticksMesures += 1;
      avant = apres;
      if (etat.termine) break;
    }
  }
  // ⚠ ET LE MONTAGE MESURE QUELQUE CHOSE : sans ces deux lignes, un moteur qui
  // ne bougerait plus personne passerait le test la tête haute.
  assert.ok(ticksMesures > 2000, `seulement ${ticksMesures} ticks joués`);
  assert.ok(pasMax > 0, 'aucune entité n\'a bougé d\'un millième : le montage ne mesure rien');
});

// ---------------------------------------------------------------------------
// CONTACT-2 T1 — UN ÉCRASEMENT PREND QUATRE TICKS, ET IL USE LA VICTIME
// ---------------------------------------------------------------------------

// ⚠⚠ VU ROUGE SUR L'ARBRE FUSIONNÉ AVANT D'ÊTRE ÉCRIT — ET PAS PAR L'ASSERTION
// QUE LE BRIEF ANNONÇAIT. Son §5 prévoyait que « la victime est morte au premier
// tick de contact, donc „ vivante au tick 3 “ tombe » ; **mesuré, c'est l'autre
// moitié qui mord d'abord**, parce que le moteur du lot CONTACT ne tue pas au
// contact mais au FRANCHISSEMENT de l'index — sur ce montage, au tick 12. La
// victime y est donc bien vivante au tick 3, et ce qui tombe est la chute de PV :
//   « tick 1 : la chute (6000) doit valoir au moins le quart (175000) »
// — les 6 000 sont le TIR du Fendeur, et rien d'autre : l'écrasement n'a pas
// commencé. C'est l'arbitrage d'Ethan du 13/09 pris à l'envers : « On prend c
// plus vitesse divisée par quatre. »
//
// ⚠⚠ ET LE COMPORTEMENT SE DÉRIVE DES DEUX CONSTANTES, DONC LES DEUX SE PINNENT.
// Le test lit `ECRASEMENT_TICKS` et `ECRASEMENT_FREIN` au lieu de retaper 4 —
// une seule table fait foi par grandeur — mais un test qui ne ferait QUE dériver
// serait vrai sous n'importe quelle valeur : **mesuré, à `ECRASEMENT_TICKS = 1`
// la boucle des trois premiers ticks ne tourne plus et tout le reste passe.** Les
// deux valeurs sont donc ÉPINGLÉES ci-dessous, comme témoins de calibrage, et
// c'est ce qui fait tomber le test quand la règle change de paramètre.
test('CONTACT-2 T1 — un écrasement prend quatre ticks de contact, et il use la victime', () => {
  // ⚠ TÉMOINS DE CALIBRAGE — valeurs arbitrées par Ethan le 13/09, à réaligner
  // au prochain arbitrage sans jamais servir d'argument CONTRE lui. Elles sont
  // épinglées ici, et là seulement : tout le reste du test les DÉRIVE.
  assert.equal(ECRASEMENT_TICKS, 4, 'un écrasement prend quatre ticks de contact');
  assert.equal(ECRASEMENT_FREIN, 4, 'et l\'écraseuse y avance au quart de sa vitesse');

  const etat = creerCombat(ECRASEMENT);
  const ecraseuse = etat.entites.find((e) => e.camp === 'attaque');
  const victime = etat.entites.find((e) => e.camp === 'defense' && e.id === 'meute');

  // ⚠ LE MONTAGE MESURE QUELQUE CHOSE, ET ON LE PROUVE AVANT D'ASSERTER QUOI QUE
  // CE SOIT : la victime est INTACTE, les masses sont strictement ordonnées, et
  // l'écart vaut une case pile — donc le contact est immédiat. Sans ces trois
  // lignes, un montage où personne ne se touche passerait le test.
  assert.equal(victime.pvMilli, victime.pvMaxMilli, 'la victime doit être intacte');
  assert.ok(masseDe(ecraseuse) > masseDe(victime), 'l\'écraseuse doit être plus lourde');
  assert.equal(victime.rangeeMilli - ecraseuse.rangeeMilli, MILLI_PAR_CASE,
    'une case pile : la marge vaut zéro dès le premier tick');

  const depart = ecraseuse.rangeeMilli;
  const quart = Math.ceil(victime.pvMaxMilli / ECRASEMENT_TICKS);
  const pasFreine = Math.floor(UNITES[ecraseuse.id].vitesse / ECRASEMENT_FREIN);

  // ⚠ LES TROIS PREMIERS TICKS DE CONTACT : la victime tient, ses PV décroissent
  // STRICTEMENT, et chaque chute vaut AU MOINS le quart — au moins, parce que
  // l'écraseuse lui tire dessus en même temps, et un test qui exigerait
  // l'égalité mesurerait le barème de tir au lieu de l'écrasement.
  let precedent = victime.pvMilli;
  for (let t = 1; t < ECRASEMENT_TICKS; t += 1) {
    tick(etat);
    assert.ok(victime.pvMilli < precedent,
      `tick ${t} : les PV doivent décroître (${precedent} → ${victime.pvMilli})`);
    assert.ok(precedent - victime.pvMilli >= quart,
      `tick ${t} : la chute (${precedent - victime.pvMilli}) doit valoir au moins le quart (${quart})`);
    assert.equal(victime.vivant, true,
      `la victime doit tenir jusqu'au tick ${ECRASEMENT_TICKS - 1} de contact (tick ${t})`);
    precedent = victime.pvMilli;
  }

  // ⚠ ET ELLE MEURT AU QUATRIÈME, PAR L'ÉCRASEMENT — pas par un tir, pas par
  // `retirerLesMorts` : `ecrase` est vrai, et son fait est au journal DU TICK
  // QUI TUE. C'est la comptabilité que le lot JOURNAL-DE-COMBAT a payée une fois
  // pour l'avoir oubliée — « une pièce sur vingt-trois manquait au journal ».
  tick(etat);
  assert.equal(victime.vivant, false, `morte au tick ${ECRASEMENT_TICKS} de contact`);
  assert.equal(victime.ecrase, true, 'écrasée, et non abattue');
  assert.equal(victime.pvMilli, 0);
  assert.ok(
    etat.journal.destructions.some((f) => f.indice === victime.indice),
    'le fait de la destruction doit être publié au tick qui tue',
  );

  // ⚠⚠ ET LE FREIN EST LA SECONDE MOITIÉ DE L'ARBITRAGE : pendant les quatre
  // ticks, l'écraseuse avance au QUART de sa vitesse. Le pas se dérive de la
  // table — `floor(90 / 4) = 22` — et jamais d'un nombre retapé.
  assert.equal(ecraseuse.rangeeMilli - depart, ECRASEMENT_TICKS * pasFreine,
    'quatre pas freinés, et pas un de plus');
  assert.ok(pasFreine < UNITES[ecraseuse.id].vitesse,
    'le frein doit mordre — sans quoi cette dernière assertion ne dirait rien');

  // ⚠ LE FREIN TOMBE AVEC SA CAUSE : au tick suivant, plus personne à écraser,
  // l'écraseuse reprend sa pleine vitesse. C'est ce qui distingue un frein d'un
  // ralentissement permanent, et rien d'autre ne le mesure.
  const avant = ecraseuse.rangeeMilli;
  tick(etat);
  assert.equal(ecraseuse.rangeeMilli - avant, UNITES[ecraseuse.id].vitesse,
    'le frein doit tomber avec sa cause');
});

// ---------------------------------------------------------------------------
// CONTACT-2 T2 — LA FAMILLE B EST FERMÉE
// ---------------------------------------------------------------------------

// ⚠⚠ C'EST L'ÉNONCÉ GÉOMÉTRIQUE COMPLET, et il ne se scinde pas. Une entité
// occupe `[m, m + MILLI_PAR_CASE)` sur CHACUN des deux axes : deux pavés d'une
// case ne se recouvrent que si les DEUX intervalles se recouvrent. Tester un
// seul axe refuserait deux pièces côte à côte, qui sont l'état normal.
//
// ⚠⚠⚠ CE TEST **EST** L'ANCIEN `CONTACT T2`, PRIVÉ DE SON EXCEPTION B — il n'y
// en a pas un second à côté, le dépôt aurait deux vérités sur le même
// invariant. Ce que le lot CONTACT avait découvert et laissé ouvert, le §9 de
// `rapports/RAPPORT-lotCONTACT.md` le posait à Ethan en deux familles ; son
// arbitrage du 13/09 est **« A : garder — B : à corriger. »**
//
//   famille                        CONTACT   CONTACT-2
//   A — l'écrasement différé            69          26
//   B — le croisement à cheval          22           0
//   TOTAL                               91          26   (−71,4 %)
//
// **B — LE CROISEMENT À CHEVAL SUR DEUX INDEX : FERMÉ.** Les deux axes se
// scannaient séparément, chacun sur son propre index de case, et une entité à
// une position fractionnaire est à cheval sur deux index de son axe : l'autre
// ne scannait pas celui-là. `margeDeContact` balaie désormais la colonne
// PERPENDICULAIRE de part et d'autre — six cellules au lieu de deux — et
// écarte une bloqueuse dont le pavé ne mord pas le sien. **Zéro paire sur les
// quatre raids réels, là où le fusionné en rendait 22, toutes dans
// `avantPoste/n20/g2`.** La branche qui les comptait est devenue un
// `assert.fail` : une paire de cette nature FAIT TOMBER le test au lieu d'être
// tolérée.
//
// **A — L'ÉCRASEMENT DIFFÉRÉ : GARDÉ, SUR ARBITRAGE, ET IL MAIGRIT DE 62 %.**
// `bloqueuseSur` rend `null` sur une occupante ÉCRASABLE — sinon la marge
// bornerait le pas avant que `peutEcraser` ne soit atteint et l'écrasement
// mourrait en silence — donc l'écraseuse entre dans le pavé de sa victime et
// les deux se recouvrent jusqu'à la mort. Ce que CONTACT-2 change est la DURÉE
// de cet épisode, pas son existence : la victime meurt désormais au CONTACT, en
// quatre ticks de `ceil(pvMax / 4)`, là où elle mourait au franchissement de
// l'INDEX, ce qui pouvait prendre bien plus longtemps et enfoncer l'écraseuse
// presque entièrement dans le pavé de sa victime.
// **Mesuré sur les quatre raids réels, même filtre que ce test : profondeur
// maximale 930 → 138 millièmes, durée maximale 22 → 4 ticks.** ⚠ Le brief
// annonçait « 952 millièmes et huit ticks » ; les deux sont faux, et le second
// l'est du simple au double — **écart déclaré**. Le 11 est le pire d'un SEUL
// montage, `base/n35/g3` ; le pire des quatre vaut **22**, dans
// `avantPoste/n20/g2`, qui est aussi celui où la famille B vivait. La fermer demanderait de tuer AVANT d'entrer, donc de renoncer à
// l'écrasement progressif qu'Ethan vient d'arbitrer. **Elle reste ouverte, et
// c'est son choix.**
//
// ⚠⚠ ET CE TEST NE SE DESSERRE PAS — IL EST LE CONTRAIRE D'UNE TOLÉRANCE, ET
// C'EST L'IDIOME DE `DETTES_ACCENT` : la seule famille qui reste est NOMMÉE, son
// compte est EXACT, sa répartition par montage l'est aussi, et elle porte une
// caractérisation POSITIVE qui peut tomber — camps opposés, masses strictement
// différentes. Un chevauchement d'une autre nature tombe par son nom ; un de
// plus ou de moins fait tomber le compte et oblige à remesurer. **Le jour où A
// se ferme à son tour, ce test tombe : c'est ce qu'on lui demande.**
test('CONTACT-2 T2 — la famille B est fermée : seul l\'écrasement différé recouvre, nommé et compté', () => {
  // ⚠ LES TROIS MONTAGES DU BRIEF SONT TENUS EN ABSOLU, SANS AUCUNE EXCEPTION.
  // C'est la scène qu'Ethan a rapportée, et c'est là que le test était rouge sur
  // l'arbre d'avant le lot CONTACT.
  const ABSOLUS = new Set(['convergence (§1)', 'file verticale (§1.3)', 'masse égale (§1.4)']);

  // ⚠ LE COMPTE EST UN RELEVÉ DU 13/09, PAS UN SEUIL. Il se remesure au
  // prochain lot qui touche au déplacement, et il ne se relève JAMAIS pour
  // faire passer un lot. ⚠ Et il n'y a plus de clé `B` : la famille est
  // fermée, donc son exception est RETIRÉE et non mise à zéro — un zéro
  // laisserait une place où la reposer.
  //
  // ⚠⚠ RÉANCRÉ AU LOT PRÉDILECTION (13/09) : **26 → 14, soit −46,2 %**, ET LA
  // FAMILLE A MAIGRIT UNE SECONDE FOIS SANS QU'UNE LIGNE DE L'ÉCRASEMENT NE
  // BOUGE. Le lot ne touche ni `peutEcraser`, ni `bloqueuseSur`, ni
  // `margeDeContact`, ni les masses — il ajoute un critère de tête à `ciblage`.
  // Ce qui change est donc QUI se trouve devant qui : une écraseuse qui élit
  // désormais la pièce de sa prédilection ne va plus se planter dans n'importe
  // quelle victime, et les épisodes de recouvrement se raréfient d'eux-mêmes.
  //
  //   montage                CONTACT-2   PRÉDILECTION
  //   camp/n5/g1                     4              4
  //   avantPoste/n20/g2             15              6
  //   base/n35/g3                    4              4
  //   base/n50/g4                    3              0
  //   TOTAL                         26             14
  //
  // ⚠⚠ ET `base/n50/g4` TOMBE À ZÉRO, CE QUI EST UN FAIT ET NON UNE ABSENCE DE
  // MESURE : le montage joue ses 900 ticks comme les trois autres, et plus une
  // seule paire n'y recouvre. La clé RESTE dans la table, à `{ A: 0 }`, pour
  // exactement la raison inverse de celle qui a fait RETIRER la clé `B` au lot
  // CONTACT-2 — une famille fermée n'a plus de place où la reposer, un montage
  // qui ne produit plus rien en a une, et son zéro doit tomber si une paire y
  // revient.
  //
  // ⚠ ET LA PROFONDEUR COMME LA DURÉE NE BOUGENT PAS D'UN MILLIÈME — **138
  // millièmes et 4 ticks des DEUX côtés**, mesurés sur le même filtre. Ce sont
  // les bornes que l'écrasement en quatre ticks du lot CONTACT-2 a posées, et
  // ce lot-ci ne les touche pas : il réduit le NOMBRE d'épisodes (9 → 4), pas
  // leur forme.
  //
  // ⚠⚠ RÉANCRÉ AU LOT FREIN (14/09) : **14 → 13**, ET C'EST LA TROISIÈME FOIS
  // QUE LA FAMILLE A MAIGRIT SANS QU'UNE LIGNE DE L'ÉCRASEMENT NE BOUGE. Le lot
  // ne touche ni `peutEcraser`, ni `bloqueuseSur`, ni `margeDeContact`, ni les
  // masses — il freine le pas LATÉRAL d'une défenseuse qui a sa prédilection à
  // portée, lui fait tenir sa cible de décalage, et la ramène à son poste quand
  // il n'en reste aucune. Ce qui change est donc encore QUI se trouve devant qui.
  //
  //   montage                CONTACT-2   PRÉDILECTION   FREIN
  //   camp/n5/g1                     4              4       4
  //   avantPoste/n20/g2             15              6       6
  //   base/n35/g3                    4              4       0
  //   base/n50/g4                    3              0       3
  //   TOTAL                         26             14      13
  //
  // ⚠⚠ ET LA BASCULE EST LA MOITIÉ QUI COMPTE : `base/n35/g3` TOMBE À ZÉRO ET
  // `base/n50/g4` REVIENT À TROIS. Un total qui descend de un en cachant deux
  // mouvements de quatre et de trois n'est pas un « léger mieux » ; c'est une
  // autre scène. Les deux clés RESTENT dans la table, y compris celle à zéro,
  // pour la raison écrite au lot précédent — un montage qui ne produit plus rien
  // a une place où son zéro doit tomber si une paire y revient.
  //
  // ⚠ ET LA PROFONDEUR, LA DURÉE ET LE NOMBRE D'ÉPISODES NE BOUGENT PAS D'UN
  // MILLIÈME — **138 millièmes, 4 ticks et 4 épisodes**, mesurés des DEUX côtés
  // sur le même filtre. Ce sont les bornes que l'écrasement en quatre ticks du
  // lot CONTACT-2 a posées ; ce lot-ci ne les touche pas non plus.
  const ATTENDUS = { A: 13 };
  const PAR_MONTAGE = {
    'camp/n5/g1': { A: 4 },
    'avantPoste/n20/g2': { A: 6 },
    'base/n35/g3': { A: 0 },
    'base/n50/g4': { A: 3 },
  };

  let paires = 0;
  let ticksJoues = 0;
  let pasMax = 0;
  const comptes = { A: 0 };
  const parMontage = {};
  for (const [nom, m] of MONTAGES) {
    if (!ABSOLUS.has(nom)) parMontage[nom] = { A: 0 };
    const etat = creerCombat(m);
    let avant = releverPositions(etat);
    for (let t = 1; t <= TICKS; t += 1) {
      tick(etat);
      ticksJoues += 1;
      const apres = releverPositions(etat);
      const actives = etat.entites.filter((e) => estActive(e) && estBloquante(e.genre, e.id));
      for (const e of actives) {
        const d = avant.get(e.indice);
        if (d === undefined) continue; // elle vient d'apparaître : posée, pas déplacée
        pasMax = Math.max(pasMax,
          Math.abs(e.rangeeMilli - d.r), Math.abs(e.colonneMilli - d.c));
      }
      avant = apres;
      for (let i = 0; i < actives.length; i += 1) {
        for (let j = i + 1; j < actives.length; j += 1) {
          const a = actives[i];
          const b = actives[j];
          paires += 1;
          const dr = Math.abs(a.rangeeMilli - b.rangeeMilli);
          const dc = Math.abs(a.colonneMilli - b.colonneMilli);
          if (dr >= MILLI_PAR_CASE || dc >= MILLI_PAR_CASE) continue;

          assert.ok(!ABSOLUS.has(nom),
            `${nom}, tick ${t} : ${a.id} et ${b.id} se recouvrent `
            + `(Δrangée ${dr}, Δcolonne ${dc})`);

          // FAMILLE A — l'une peut écraser l'autre : camps opposés, masses
          // strictement différentes. C'est `peutEcraser` sans la part qui
          // dépend de l'état, et le montage n'arme aucun module de masse.
          const ecrasable = a.camp !== b.camp && masseDe(a) !== masseDe(b);
          if (ecrasable) {
            comptes.A += 1;
            parMontage[nom].A += 1;
            continue;
          }
          // ⚠⚠ TOUT LE RESTE FAIT TOMBER LE TEST. La famille B est fermée depuis
          // le lot CONTACT-2 ; le message garde sa caractérisation — « au moins
          // une des quatre coordonnées n'est pas un multiple de MILLI_PAR_CASE »
          // — pour que la paire qui reviendrait se DIAGNOSTIQUE au lieu de se
          // compter.
          const aCheval = [a.rangeeMilli, a.colonneMilli, b.rangeeMilli, b.colonneMilli]
            .some((v) => v % MILLI_PAR_CASE !== 0);
          assert.fail(
            `${nom}, tick ${t} : ${a.id} et ${b.id} se recouvrent hors écrasement différé `
            + `(${a.rangeeMilli}, ${a.colonneMilli}) et (${b.rangeeMilli}, ${b.colonneMilli}) — `
            + `à cheval sur deux index : ${aCheval}`,
          );
        }
      }
      if (etat.termine) break;
    }
  }
  // ⚠ LES TROIS PLANCHERS DE FALSIFIABILITÉ. Sans eux, un moteur qui ne
  // bougerait plus personne — ou qui ne produirait plus une seule paire à
  // comparer — passerait ce test la tête haute, et « zéro famille B » ne
  // voudrait rien dire.
  assert.ok(ticksJoues > 2000, `seulement ${ticksJoues} ticks joués`);
  assert.ok(paires > 100_000, `seulement ${paires} paires comparées`);
  assert.ok(pasMax > 0, 'aucune bloquante n\'a bougé d\'un millième : le montage ne mesure rien');
  assert.deepEqual(comptes, ATTENDUS,
    'le compte de la famille A a bougé : remesurer et réécrire le pavé ci-dessus, '
    + 'jamais relever le nombre pour faire passer le lot');
  assert.deepEqual(parMontage, PAR_MONTAGE, 'la répartition par montage a bougé');
  // ⚠ ET LA CONTRE-ASSERTION REFUSE LE RETOUR DU COMPTE D'HIER : un lot qui
  // déferait les trois étages du frein rendrait 14, et il repasserait au vert
  // sous une assertion qui ne dirait que « au plus quatorze ».
  assert.notEqual(comptes.A, 14, 'le compte d\'avant le lot FREIN est revenu');
});
