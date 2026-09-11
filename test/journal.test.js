// LE JOURNAL DE TICK — ce que le moteur publie, et ce qu'il ne change pas.
//
// ⚠⚠ LE SEUL TEST QUI COMPTE VRAIMENT EST LE PREMIER. Un journal qui change un
// résultat de combat ne se rattrape pas : les raids de l'Ouvrage se résolvent
// hors ligne, les rapports sont sauvegardés, et six raids de référence du dépôt
// ont leur butin mesuré au champ près. Les huit autres tests décrivent ce que le
// journal publie ; celui-là dit qu'il ne coûte rien.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

import {
  creerCombat, tick, resoudre, serialiserEtat, butin, pointsRecherche,
  TICKS_PAR_VAGUE,
} from '../src/sim/combat.js';
import { caseDepuisMilli } from '../src/sim/grille.js';
import { genererSite } from '../src/sim/generateur.js';
import { genererSiteAncien } from './generateur-ancien.js';
import { UNITES, GRILLE } from '../src/data/combat.js';
import {
  TEMOINS_COMBAT, TEMOINS_COMBAT_AVANT_PAQUETS,
  COMBATS_DEPLACES_PAR_ARRET, COMBATS_DEPLACES_PAR_COLONNE,
  COMBATS_DEPLACES_PAR_CIBLES_RANGEES,
  COMBATS_DEPLACES_PAR_DISPOSITION_OUVRAGE,
  COMBATS_DEPLACES_PAR_MUR_AVANT_PAQUETS,
} from './temoins-combat.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (...bouts) => readFileSync(join(RACINE, ...bouts), 'utf8');

/** La source, commentaires ôtés — une garde ne lit jamais sa propre prose. */
function sansCommentaires(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
}

const TOUTES = Object.keys(UNITES);

/**
 * ⚠⚠ LE POINT D'APPARITION D'AVANT LE LOT APPROCHE, ET IL NE SERT QU'À `T1 bis`.
 * `RANGEE_APPARITION` de `sim/combat.js` valait le FRONT de la bande de
 * déploiement ; elle vaut désormais la voie d'approche, sous la grille. Écrit
 * ici, il fait rejouer à `T1 bis` EXACTEMENT le comportement d'hier, ce qui est
 * tout ce qu'on lui demande — voir son en-tête.
 *
 * ⚠ IL SE DÉRIVE DE `GRILLE.bandes`, IL NE S'ÉCRIT PAS `2` : c'est exactement ce
 * que l'ancien défaut valait, et un nombre écrit à la main cesserait de le dire.
 */
const DEPART_AVANT_APPROCHE = GRILLE.bandes.deploiement.derniere;

/**
 * Quatre vagues de neuf, remplies dans l'ordre du roster.
 *
 * ⚠ `rangee` À `null` VEUT DIRE « LE POINT D'APPARITION DU JOUR », pas « la
 * rangée nulle » : le champ est alors ABSENT du littéral, et `creerCombat`
 * applique son défaut. C'est ce que `T1` doit jouer — la porte de production.
 */
function armee(ids, niveau, rangee = null) {
  const vagues = [[], [], [], []];
  ids.forEach((id, i) => {
    vagues[i % 4].push({
      ...(rangee === null ? {} : { rangee }),
      id, colonne: (Math.floor(i / 4) % 9) + 1, niveau,
    });
  });
  return vagues.filter((v) => v.length > 0);
}

function montageDe(type, saveur, niveau, graine, ids = TOUTES, gen = genererSite,
  rangee = null) {
  return { ...gen({ type, saveur, niveau, graine }), vagues: armee(ids, niveau, rangee) };
}

const TYPES_TEMOINS = [
  ['camp', 'richeQuartz'], ['camp', 'richeScorie'],
  ['avantPoste', 'richeQuartz'], ['avantPoste', 'richeScorie'], ['base', null],
];

/** Les deux cents montages des témoins, dans l'ordre de la table. */
function* montagesTemoins(gen, rangee = null) {
  for (const graine of [1, 2, 3, 4, 5]) {
    for (const niveau of [5, 20, 35, 50]) {
      for (const [type, saveur] of TYPES_TEMOINS) {
        for (const [nomArmee, ids] of [
          ['toutes', TOUTES], ['moitie', TOUTES.filter((_, k) => k % 2 === 0)],
        ]) {
          yield [
            `${type}/${saveur ?? '-'}/n${niveau}/g${graine}/${nomArmee}`,
            montageDe(type, saveur, niveau, graine, ids, gen, rangee),
          ];
        }
      }
    }
  }
}

// ⚠ L'ÉTAT SE COMPARE SANS SA SORTIE NEUVE. `journal` et `vaguesPosees` sont
// ce que le lot JOURNAL-DE-COMBAT a AJOUTÉ ; les opposer à un témoin qui ne les
// connaît pas ne dirait rien. Tout le reste de l'état y est, à l'octet.
const sansJournal = (etat) => {
  const copie = { ...etat };
  delete copie.journal;
  delete copie.vaguesPosees;
  return serialiserEtat(copie);
};
const empreinte = (x) => createHash('sha256').update(x).digest('hex').slice(0, 32);

/** La ligne de témoin d'un montage joué : les neuf colonnes de la table. */
function ligneDeTemoin(nom, montage) {
  const etat = creerCombat(montage);
  const r = resoudre(etat);
  return [
    nom,
    empreinte(JSON.stringify(r)),
    empreinte(sansJournal(etat)),
    r.cause, r.tick,
    JSON.stringify(butin(r, montage)), String(pointsRecherche(r, montage)),
    [r.batiments, r.defenses, r.attaquants]
      .map((l) => l.reduce((s, x) => s + x.pvMilli, 0)).join('/'),
    [r.batiments, r.defenses, r.attaquants]
      .map((l) => l.filter((x) => x.detruit).length).join('/'),
  ];
}

// ---------------------------------------------------------------------------
// JOURNAL T1 — l'additivité, contre un témoin capturé au lot PAQUETS
// ---------------------------------------------------------------------------

// ⚠⚠ LOT PAQUETS (09/09) : LA TABLE EST RECAPTURÉE, ET LES QUATRE COUCHES SONT
// DESCENDUES DANS `T1 bis`. Le placement change de modèle, donc les deux cents
// montages ne sont plus les mêmes sites, et une cinquième couche aurait couvert
// 1 267 champs sur 1 600 — plus rien à adosser. Le §7 du brief prescrit la
// procédure : prouver d'abord que l'ANCIEN placement rejoue l'ancienne table
// sur le moteur courant (`T1 bis`, 0 écart), et recapturer ALORS.
//
// ⚠⚠ LOT APPROCHE (11/09) : LA TABLE EST RECAPTURÉE, ET LA COUCHE `MUR` DESCEND
// DANS `T1 bis` AVEC LES QUATRE AUTRES. Les vagues naissent en rangée 0 au lieu
// du front de la bande de déploiement : tout attaquant entre deux cases plus
// bas, donc les deux cents combats changent. Mesuré contre la table du lot MUR,
// couche comprise : **1 132 champs sur 1 600 bougent, 468 tiennent**, et
// **aucun des deux cents combats n'est intact**. Une sixième couche couvrirait
// 71 % de la table — plus rien à adosser, exactement la situation de PAQUETS.
//
// ⚠⚠ ET LA PREUVE QUI L'AUTORISE EST `T1 bis`, JOUÉ À CHAQUE `npm test`. Le §4.1
// du brief exige de montrer, AVANT toute recapture, que le MOTEUR n'a pas bougé.
// Ce test-là rejoue désormais les empreintes d'AVANT PAQUETS avec l'ancien point
// d'apparition ÉCRIT EXPLICITEMENT, et rend 0 écart sous les cinq couches. La
// recapture ci-dessous n'est légitime que tant qu'il est vert.
//
// ⚠ ET LA CONSIGNE NE CHANGE PAS : **le prochain lot qui touchera au combat
// devra EMPILER une couche, jamais recapturer.**
test('JOURNAL T1 — deux cents combats rendent le résultat capturé au lot APPROCHE (falsification n° 1)', () => {
  let i = 0;
  let champs = 0;
  for (const [nom, montage] of montagesTemoins(genererSite)) {
    const vu = ligneDeTemoin(nom, montage);
    const attendu = TEMOINS_COMBAT[i];
    assert.ok(attendu !== undefined, `le témoin n'a que ${TEMOINS_COMBAT.length} lignes`);
    assert.equal(vu[0], attendu[0], `le témoin ${i} n'est pas dans l'ordre`);
    for (let c = 1; c < vu.length; c += 1) {
      assert.equal(vu[c], attendu[c],
        `${vu[0]} : le champ ${c} a bougé depuis le témoin du lot APPROCHE`);
      champs += 1;
    }
    i += 1;
  }
  assert.equal(i, TEMOINS_COMBAT.length, 'le nombre de combats joués a changé');
  assert.equal(i, 200);
  assert.equal(champs, 200 * 8, 'le nombre de champs comparés a changé');
  // ⚠ LA CAPTURE REPART DE ZÉRO, DONC IL N'Y A PLUS DE SURCHARGE À COMPTER ICI.
  // La garde qui comptait les champs couverts descend avec sa couche dans
  // `T1 bis` ; ce qui reste est la comparaison nue, qui est le cas le plus fort.
  // Le prochain lot qui déplacera le combat rouvrira une couche, et rouvrira le
  // compte avec elle.
});

// ---------------------------------------------------------------------------
// JOURNAL T1 bis — l'ANCIEN placement rejoue l'ancienne table, sur le moteur courant
// ---------------------------------------------------------------------------

// ⚠⚠ C'EST LE POINT 2 DU §7 DU BRIEF PAQUETS, JOUÉ À CHAQUE `npm test`. Il
// prouve que le MOTEUR n'a pas bougé au lot PAQUETS : `genererSiteAncien` — la
// copie de l'ancien placement, dans `test/generateur-ancien.js`, jamais dans
// `src/` — monte les deux cents sites d'hier, `combat.js` les joue, et les
// empreintes retombent sur `TEMOINS_COMBAT_AVANT_PAQUETS` sous les quatre
// couches empilées depuis JOURNAL-DE-COMBAT : 1 331 surchargés, 269 gardés,
// exactement le compte d'avant le lot. Si ce test tombe un jour, c'est le
// moteur ou la copie qui a bougé, pas le placement.
test('JOURNAL T1 bis — l\'ancien placement rejoué : 0 écart sous les quatre couches d\'avant PAQUETS et celle de MUR', () => {
  let i = 0;
  let champs = 0;
  let surcharges = 0;
  for (const [nom, montage] of montagesTemoins(genererSiteAncien, DEPART_AVANT_APPROCHE)) {
    {
      const vu = ligneDeTemoin(nom, montage);
      const attendu = TEMOINS_COMBAT_AVANT_PAQUETS[i];
      assert.ok(attendu !== undefined, `le témoin n'a que ${TEMOINS_COMBAT_AVANT_PAQUETS.length} lignes`);
      assert.equal(vu[0], attendu[0], `le témoin ${i} n'est pas dans l'ordre`);
          // ⚠⚠ LOT ARRÊT (04/09) : LA SURCHARGE EST NOMMÉE, LE TÉMOIN N'EST PAS
          // RAFRAÎCHI. `COMBATS_DEPLACES_PAR_ARRET` donne, combat par combat et
          // champ par champ, ce que la nouvelle règle d'arrêt déplace ; tout le
          // reste continue d'être comparé à la capture d'AVANT le lot
          // JOURNAL-DE-COMBAT. Même doctrine que les `DEPLACES_PAR_*` de
          // `temoins-bases-0.js`.
          //
          // ⚠⚠ ET LE LOT COLONNE EN AJOUTE UNE SECONDE, IL NE REMPLACE PAS LA
          // PREMIÈRE. Les couches se lisent de la plus RÉCENTE à la plus
          // ancienne : ce que COLONNE déplace l'emporte, sinon ce qu'ARRÊT
          // déplaçait, sinon le témoin d'avant JOURNAL-DE-COMBAT. Empiler
          // plutôt qu'écraser est ce qui garde les 309 champs restants adossés
          // à une capture qu'aucun de ces trois lots n'a produite.
          //
          // ⚠⚠ ET LE LOT CIBLES-RANGÉES EN AJOUTE UNE TROISIÈME, AU-DESSUS DES
          // DEUX AUTRES. Même doctrine : on empile, on ne remplace pas.
          //
          // ⚠⚠ ET LE LOT DISPOSITION-OUVRAGE EN AJOUTE UNE QUATRIÈME. Même
          // doctrine, quatrième fois : on empile, on ne remplace pas.
          const deplaces = COMBATS_DEPLACES_PAR_ARRET[i] ?? {};
          const deplacesColonne = COMBATS_DEPLACES_PAR_COLONNE[i] ?? {};
          const deplacesRangees = COMBATS_DEPLACES_PAR_CIBLES_RANGEES[i] ?? {};
          const deplacesFlottant = COMBATS_DEPLACES_PAR_DISPOSITION_OUVRAGE[i] ?? {};
          // ⚠⚠ ET LE LOT MUR EN AJOUTE UNE CINQUIÈME. Même doctrine, cinquième
          // fois : on empile, on ne remplace pas. ⚠ Le §4 du brief annonçait que ce
          // test-ci resterait VERT sans couche neuve ; **il tombe**, et son §5 le
          // nommait pourtant parmi les vingt-neuf. Un moteur qui change change
          // aussi ce que l'ANCIEN placement rend — c'est mesuré, pas supposé :
          // 127 combats, 686 champs.
          const deplacesMur = COMBATS_DEPLACES_PAR_MUR_AVANT_PAQUETS[i] ?? {};
          for (let c = 1; c < vu.length; c += 1) {
            let reference = attendu[c];
            if (Object.prototype.hasOwnProperty.call(deplaces, c)) reference = deplaces[c];
            if (Object.prototype.hasOwnProperty.call(deplacesColonne, c)) {
              reference = deplacesColonne[c];
            }
            if (Object.prototype.hasOwnProperty.call(deplacesRangees, c)) {
              reference = deplacesRangees[c];
            }
            if (Object.prototype.hasOwnProperty.call(deplacesFlottant, c)) {
              reference = deplacesFlottant[c];
            }
            if (Object.prototype.hasOwnProperty.call(deplacesMur, c)) {
              reference = deplacesMur[c];
            }
            assert.equal(vu[c], reference,
              `${vu[0]} : le champ ${c} a bougé depuis le témoin d'avant le lot`);
            champs += 1;
            if (Object.prototype.hasOwnProperty.call(deplaces, c)
              || Object.prototype.hasOwnProperty.call(deplacesColonne, c)
              || Object.prototype.hasOwnProperty.call(deplacesRangees, c)
              || Object.prototype.hasOwnProperty.call(deplacesFlottant, c)
              || Object.prototype.hasOwnProperty.call(deplacesMur, c)) surcharges += 1;
          }
          i += 1;
    }
  }
  assert.equal(i, TEMOINS_COMBAT_AVANT_PAQUETS.length, 'le nombre de combats joués a changé');
  assert.equal(i, 200);
  assert.equal(champs, 200 * 8, 'le nombre de champs comparés a changé');
  // ⚠⚠ ET LA SURCHARGE SE COMPTE, SINON ELLE POURRAIT TOUT COUVRIR SANS QU'ON
  // LE VOIE. Elle était de 1 032 champs sur 1 600 après le lot ARRÊT, 568
  // restant gardés contre la capture d'avant le lot JOURNAL-DE-COMBAT, dont
  // dix-neuf combats entiers. Le lot COLONNE la porte à **1 233**, et il ne
  // reste que **334 champs gardés** — dont **173 causes de fin sur 200**, mais
  // plus AUCUN combat entier. C'est ce que coûte un lot qui touche les deux
  // moitiés du moteur, et le dire est la moitié du travail : une surcharge qui
  // grandirait sans qu'un lot le déclare fait tomber ce test.
  //
  // ⚠ LE COMPTE EST L'UNION DES DEUX COUCHES, PAS LEUR SOMME : trente-trois
  // champs qu'ARRÊT avait déplacés n'ont pas rebougé, et ils restent surchargés
  // par lui. 1 233 entrées neuves, 1 266 champs couverts, 334 encore adossés au
  // témoin d'avant JOURNAL-DE-COMBAT.
  //
  // ⚠⚠ LOT CIBLES-RANGÉES (07/09) : LA SURCHARGE PASSE DE 1 291 À 1 296, ET IL
  // NE RESTE QUE **304 CHAMPS GARDÉS** contre la capture d'avant
  // JOURNAL-DE-COMBAT. La troisième couche touche les DEUX CENTS combats et
  // déplace 1 208 champs — mais 1 203 d'entre eux étaient DÉJÀ surchargés par
  // COLONNE ou par ARRÊT : le compte est l'UNION des trois couches, pas leur
  // somme, et il ne monte donc que de cinq. Les 304 restants sont pour
  // l'essentiel des CAUSES de fin, que ni la disposition ni la composition ne
  // font changer.
  //
  // ⚠⚠ LOT DISPOSITION-OUVRAGE (08/09) : LA SURCHARGE PASSE DE 1 296 À 1 331, ET
  // IL NE RESTE QUE **269 CHAMPS GARDÉS** contre la capture d'avant
  // JOURNAL-DE-COMBAT. La quatrième couche touche les DEUX CENTS combats et
  // déplace 1 039 champs — mais 1 004 d'entre eux étaient DÉJÀ surchargés par
  // l'une des trois couches d'avant : le compte est l'UNION des quatre, pas leur
  // somme, et il ne monte donc que de trente-cinq. Les 269 restants sont pour
  // l'essentiel des CAUSES de fin, que ni la disposition ni la composition ne
  // font changer.
  //
  // ⚠⚠ LOT MUR (10/09) : LA CINQUIÈME COUCHE TOUCHE 125 COMBATS ET DÉPLACE 681
  // CHAMPS, ET LA SURCHARGE NE MONTE PAS D'UN SEUL — elle reste à **1 331**, les
  // **269 gardés** aussi. Les 681 étaient DÉJÀ surchargés, TOUS, par l'une des
  // quatre d'avant : le compte est l'UNION des cinq, pas leur somme. Les 269
  // restants sont pour l'essentiel des CAUSES de fin, et l'ancien placement n'en
  // fait basculer aucune ici.
  assert.equal(surcharges, 1331, `champs surchargés : ${surcharges}`);
  assert.equal(Object.keys(COMBATS_DEPLACES_PAR_ARRET).length, 181);
  assert.equal(Object.keys(COMBATS_DEPLACES_PAR_COLONNE).length, 200);
  assert.equal(Object.keys(COMBATS_DEPLACES_PAR_CIBLES_RANGEES).length, 200);
  assert.equal(Object.keys(COMBATS_DEPLACES_PAR_DISPOSITION_OUVRAGE).length, 200);
  assert.equal(Object.keys(COMBATS_DEPLACES_PAR_MUR_AVANT_PAQUETS).length, 127);
  assert.ok(champs - surcharges === 269, 'le compte des champs encore gardés a changé');
});

// ---------------------------------------------------------------------------
// JOURNAL T2 — il ne s'accumule pas
// ---------------------------------------------------------------------------

test('JOURNAL T2 — le journal vit UN tick, y compris quand personne ne le lit (falsification n° 2)', () => {
  // ⚠⚠ `resoudre` BOUCLE SANS LECTEUR, et c'est le cas qui compte : l'écran de
  // raid résout un combat entier en une image sous « Instantané », et
  // `rattraperJeu` résout les raids de l'Ouvrage hors ligne. Un journal qui
  // empilerait produirait des dizaines de milliers d'objets sans que rien ne
  // le dise.
  const etat = creerCombat(montageDe('camp', 'richeQuartz', 25, 11));
  let pic = 0;
  let ticks = 0;
  let totalTirs = 0;
  while (!etat.termine && ticks < 900) {
    tick(etat);
    ticks += 1;
    const taille = Object.values(etat.journal).reduce((s, l) => s + l.length, 0);
    totalTirs += etat.journal.tirs.length;
    pic = Math.max(pic, taille);
  }
  assert.ok(ticks > 200, `montage : ${ticks} ticks, trop court pour mesurer une accumulation`);
  // ⚠ LE MONTAGE DOIT PRODUIRE BEAUCOUP PLUS QUE CE QUI RESTE, sans quoi
  // « il ne s'accumule pas » serait vrai d'un journal toujours vide.
  assert.ok(totalTirs > 1000, `montage : ${totalTirs} tirs, pas de quoi voir une pile`);
  assert.ok(pic > 0 && pic < 200,
    `un tick a laissé ${pic} faits : le journal s'accumule`);
  // À la fin, il ne reste que le DERNIER tick.
  const dernier = Object.values(etat.journal).reduce((s, l) => s + l.length, 0);
  assert.ok(dernier < 200, `le journal final porte ${dernier} faits`);

  // Et le même combat résolu d'un bloc laisse exactement la même chose.
  const bis = creerCombat(montageDe('camp', 'richeQuartz', 25, 11));
  resoudre(bis);
  assert.equal(serialiserEtat(bis), serialiserEtat(etat),
    'résoudre d\'un bloc et tick à tick ne laissent pas le même état');
});

// ---------------------------------------------------------------------------
// JOURNAL T3 — les neuf étapes n'ont pas bougé, et le vidage est en tête
// ---------------------------------------------------------------------------

test('JOURNAL T3 — l\'ordre du tick est intact et le journal se vide à l\'entrée (falsification n° 3)', () => {
  const source = sansCommentaires(lire('src', 'sim', 'combat.js'));
  const corps = source.slice(source.indexOf('export function tick(etat) {'));
  const fin = corps.indexOf('\n}');
  const dansLeTick = corps.slice(0, fin);

  const attendues = [
    'etat.journal = journalVide()', 'expirerEffets(etat)', 'apparitionDeVague(etat)',
    'ciblage(etat)', 'declencherNeutralisations(etat)', 'tir(etat)',
    'appliquerDegats(etat, tampon)', 'retirerLesMorts(etat)', 'declencherBoosters(etat)',
    'deplacement(etat)', 'consommerReserve(etat)', 'conditionsDeFin(etat)',
  ];
  let precedent = -1;
  for (const appel of attendues) {
    const ou = dansLeTick.indexOf(appel);
    assert.ok(ou >= 0, `« ${appel} » a disparu du tick`);
    assert.ok(ou > precedent, `« ${appel} » a changé de place dans le tick`);
    precedent = ou;
  }
  // ⚠ LE VIDAGE EST LE PREMIER, ET IL EST SEUL À L'ÊTRE. Le mettre en fin de
  // tick rendrait le journal illisible à l'appelant sans rien casser d'autre :
  // c'est la faute que cette ligne-ci attrape.
  assert.equal(dansLeTick.indexOf('etat.journal = journalVide()'),
    Math.min(...attendues.map((a) => dansLeTick.indexOf(a))),
    'le journal ne se vide plus en TÊTE du tick');
  assert.equal((dansLeTick.match(/journalVide\(\)/g) ?? []).length, 1,
    'le journal se vide plus d\'une fois par tick');
});

// ---------------------------------------------------------------------------
// JOURNAL T4 — les faits sont des copies
// ---------------------------------------------------------------------------

test('JOURNAL T4 — muter un fait n\'atteint pas l\'état (falsification n° 4)', () => {
  const etat = creerCombat(montageDe('camp', 'richeQuartz', 30, 4));
  let ticks = 0;
  while (!etat.termine && ticks < 60 && etat.journal.tirs.length === 0) { tick(etat); ticks += 1; }
  assert.ok(etat.journal.tirs.length > 0, 'montage : aucun tir publié en 60 ticks');

  const avant = serialiserEtat(etat);
  for (const liste of Object.values(etat.journal)) {
    for (const fait of liste) {
      for (const cle of Object.keys(fait)) {
        fait[cle] = typeof fait[cle] === 'number' ? -999999 : 'saccagé';
      }
    }
  }
  // ⚠ ON COMPARE APRÈS AVOIR SACCAGÉ LE JOURNAL LUI-MÊME, donc `serialiserEtat`
  // le voit changé : on retire le journal des deux côtés.
  const sans = (chaine) => chaine.replace(/"journal":\{.*?\},"maxTicks"/, '"maxTicks"');
  assert.equal(sans(serialiserEtat(etat)), sans(avant),
    'un fait du journal partage une référence avec l\'état');

  // Et l'entité, elle, n'a rien senti : ses champs sont ceux d'avant.
  const cible = etat.entites[0];
  assert.equal(typeof cible.id, 'string');
  assert.notEqual(cible.id, 'saccagé');
  assert.ok(Number.isInteger(cible.pvMilli) && cible.pvMilli >= 0);
});

// ---------------------------------------------------------------------------
// JOURNAL T5 — un tir publié est un tir compté, ni plus ni moins
// ---------------------------------------------------------------------------

test('JOURNAL T5 — le journal compte les tirs comme la réserve, barrage exclu (falsification n° 5)', () => {
  const etat = creerCombat(montageDe('base', null, 40, 6));
  let ticks = 0;
  let vus = 0;
  while (!etat.termine && ticks < 300) {
    tick(etat);
    ticks += 1;
    // ⚠⚠ L'ÉQUIVALENCE EXACTE, TICK PAR TICK : un fait `tir` pour chaque entité
    // qui porte `aTire`, et pour aucune autre. C'est ce qui garantit que le
    // barrage — qui frappe jusqu'à huit voisines — n'a pas fait naître huit
    // tirs, et que le franchissement d'une barrière n'en a fait naître aucun.
    const aTire = etat.entites.filter((e) => e.aTire).map((e) => e.indice).sort((a, b) => a - b);
    const journalises = etat.journal.tirs.map((t) => t.indice).sort((a, b) => a - b);
    assert.deepEqual(journalises, aTire, `tick ${ticks} : le journal des tirs diverge d'aTire`);
    vus += journalises.length;
    for (const t of etat.journal.tirs) {
      const e = etat.entites[t.indice];
      assert.equal(t.id, e.id);
      assert.equal(t.proprietaire, e.proprietaire);
      assert.equal(t.cibleIndice, e.cibleIndice, 'le tir ne vise pas la cible du moteur');
      assert.ok(etat.entites[t.cibleIndice] !== undefined, 'le tir vise un indice inexistant');
    }
  }
  assert.ok(vus > 500, `montage : ${vus} tirs, trop peu pour mesurer`);
});

// ---------------------------------------------------------------------------
// JOURNAL T6 — une destruction, une seule fois, à l'instant et à la place
// ---------------------------------------------------------------------------

test('JOURNAL T6 — chaque pièce détruite est publiée une fois et une seule (falsification n° 6)', () => {
  const etat = creerCombat(montageDe('camp', 'richeScorie', 30, 9));
  const vues = new Map();
  let ticks = 0;
  while (!etat.termine && ticks < 900) {
    const vivantsAvant = new Set(etat.entites.filter((e) => e.vivant).map((e) => e.indice));
    // Les positions d'AVANT le tick : le déplacement est l'étape 7, la mort la 6.
    const placesAvant = new Map(etat.entites.map((e) => [e.indice, e.rangeeMilli]));
    tick(etat);
    ticks += 1;
    for (const d of etat.journal.destructions) {
      assert.ok(!vues.has(d.indice), `l'entité ${d.indice} est publiée morte deux fois`);
      vues.set(d.indice, ticks);
      assert.ok(vivantsAvant.has(d.indice), 'une entité déjà morte est publiée morte');
      assert.equal(etat.entites[d.indice].vivant, false);
      // ⚠ LA POSITION EST CELLE D'AVANT LE DÉPLACEMENT — la pièce meurt là où
      // elle a été touchée, pas là où le tick l'aurait menée.
      assert.equal(d.rangee, caseDepuisMilli(placesAvant.get(d.indice)),
        'la position publiée n\'est pas celle de la mort');
    }
  }
  const morts = etat.entites.filter((e) => !e.vivant).map((e) => e.indice).sort((a, b) => a - b);
  assert.ok(morts.length > 10, `montage : ${morts.length} morts, trop peu pour mesurer`);
  assert.deepEqual([...vues.keys()].sort((a, b) => a - b), morts,
    'le journal des destructions ne couvre pas exactement les morts');
});

// ---------------------------------------------------------------------------
// JOURNAL T7 — les apparitions et les vagues
// ---------------------------------------------------------------------------

test('JOURNAL T7 — une vague entre une fois, et chaque unité paraît une fois (falsification n° 7)', () => {
  const montage = montageDe('camp', 'richeQuartz', 20, 2);
  const etat = creerCombat(montage);
  // La vague 1 entre DANS `creerCombat` : son journal est celui du « tick 0 ».
  assert.deepEqual(etat.journal.vagues.map((v) => v.numero), [1],
    'la vague 1 n\'est pas publiée à la création');
  assert.equal(etat.journal.vagues[0].effectif, montage.vagues[0].length);
  assert.equal(etat.journal.vagues[0].proprietaire, etat.proprietaireAttaque);
  assert.equal(etat.journal.apparitions.length, montage.vagues[0].length);

  const parues = new Set(etat.journal.apparitions.map((a) => a.indice));
  const numeros = [1];
  let ticks = 0;
  while (!etat.termine && ticks < 900) {
    tick(etat);
    ticks += 1;
    for (const v of etat.journal.vagues) {
      numeros.push(v.numero);
      assert.equal(ticks % TICKS_PAR_VAGUE, 0, 'une vague entre hors de son tick');
    }
    for (const a of etat.journal.apparitions) {
      assert.ok(!parues.has(a.indice), `l'entité ${a.indice} paraît deux fois`);
      parues.add(a.indice);
      assert.equal(etat.entites[a.indice].camp, 'attaque', 'un défenseur est publié comme apparu');
    }
  }
  assert.deepEqual(numeros, [1, 2, 3, 4], 'les vagues ne sont pas numérotées dans l\'ordre');
  const attaquants = etat.entites.filter((e) => e.camp === 'attaque').length;
  assert.equal(parues.size, attaquants, 'toutes les attaquantes ne sont pas publiées');
  assert.equal(attaquants, montage.vagues.flat().length);
});

// ---------------------------------------------------------------------------
// JOURNAL T8 — l'impact publie ce qui a été ENCAISSÉ, et de quoi le rapporter
// ---------------------------------------------------------------------------

test('JOURNAL T8 — l\'encaissé est publié avec les PV max de la cible (falsification n° 8)', () => {
  // ⚠⚠ LA GRAINE PASSE DE 8 À 12 AU LOT COLONNE, ET C'EST UNE RÉPARATION DE
  // PRÉMISSE. La garde du bas exige que le montage ÉCRASE vraiment quelqu'un,
  // sans quoi l'exception « une pièce écrasée perd plus que son impact » ne se
  // mesurerait plus. L'arrêt sur prédilection du 06/09 fige les attaquantes
  // devant les défenseuses de leur colonne : sur la graine 8 elles n'écrasent
  // plus personne — mesuré, 0 écrasée contre 2 avant. La graine 12 en rend
  // deux, au même type, au même niveau, avec la même armée. Le seuil d'impacts
  // (> 500) tient aussi : 855 contre 955.
  //
  // ⚠⚠ ET LA GRAINE PASSE DE 12 À 35 AU LOT CIBLES-RANGÉES, POUR LA MÊME RAISON
  // EXACTEMENT. Les tailles de rangée se tirent à leur tour : sur la graine 12,
  // le montage n'écrase plus personne — zéro contre deux, mesuré — et
  // l'exception « une pièce écrasée perd plus que son impact » cessait d'être
  // mesurée. La graine 35 en écrase deux, au même type, au même niveau, avec la
  // même armée, et rend 821 impacts pour un seuil de 500. Balayage à l'appui sur
  // les graines 1 à 60 : cinq en donnent exactement deux. **C'est la deuxième
  // fois que ce montage perd sa prémisse ; un montage qui dépend d'une
  // disposition tirée la reperdra au prochain lot qui y touche.**
  const etat = creerCombat(montageDe('base', null, 45, 35));
  let ticks = 0;
  let vus = 0;
  let parts = [];
  while (!etat.termine && ticks < 400) {
    const pvAvant = new Map(etat.entites.map((e) => [e.indice, e.pvMilli]));
    tick(etat);
    ticks += 1;
    for (const i of etat.journal.impacts) {
      const e = etat.entites[i.indice];
      assert.equal(i.pvMaxMilli, e.pvMaxMilli, 'les PV max publiés ne sont pas ceux de la cible');
      assert.ok(i.encaisseMilli > 0, 'un impact nul est publié');
      // ⚠ L'ENCAISSÉ N'EST PAS LA PERTE DE PV : il compte AUSSI ce qu'un
      // Bouclier a absorbé, donc il est toujours au moins égal à la perte.
      //
      // ⚠⚠ SAUF SUR UNE PIÈCE ÉCRASÉE, ET LE LOT ARRÊT L'A RENDU ATTEIGNABLE.
      // L'écrasement est la SECONDE mort du moteur : il met les PV à zéro à
      // l'étape 7, hors de `appliquerDegats`, donc sans publier d'impact. Une
      // pièce touchée ET écrasée dans le même tick perd donc plus que ce que
      // son impact annonce, sans que rien ne soit faux. Le montage n'en
      // produisait aucune tant que les attaquants s'arrêtaient devant la
      // défense ; ils la traversent désormais et l'écrasent. Mesuré sur ce
      // montage-ci : un Ratisseur de garnison, 38 904 140 milli-PV perdus pour
      // 309 452 encaissés, au tick 140.
      // ⚠⚠ UNE ENTITÉ POSÉE PENDANT CE TICK N'A PAS DE « AVANT », ET LE LOT
      // CIBLES-RANGÉES L'A RENDU ATTEIGNABLE. `pvAvant` est relevé au DÉBUT du
      // tick ; une vague qui se dépose ensuite y est absente, et la soustraction
      // rendait `NaN` — une comparaison avec `NaN` est toujours fausse, donc
      // l'assertion serait tombée en accusant le journal d'une faute qu'il n'a
      // pas. On saute ces impacts-là : ils n'ont pas de perte à comparer.
      if (!pvAvant.has(i.indice)) {
        parts.push(Math.round((1000 * i.encaisseMilli) / i.pvMaxMilli));
        vus += 1;
        continue;
      }
      const perdu = pvAvant.get(i.indice) - e.pvMilli;
      if (e.ecrase !== true) {
        assert.ok(i.encaisseMilli >= perdu,
          `encaissé ${i.encaisseMilli} < PV perdus ${perdu}`);
      }
      parts.push(Math.round((1000 * i.encaisseMilli) / i.pvMaxMilli));
      vus += 1;
    }
  }
  assert.ok(vus > 500, `montage : ${vus} impacts, trop peu pour mesurer`);
  // ⚠ ET L'EXCEPTION N'EST PAS UNE PORTE OUVERTE : le montage doit vraiment
  // écraser quelqu'un, sinon la garde ci-dessus se relâcherait sans qu'on le
  // sache. Mesuré : deux pièces écrasées dans la fenêtre de quatre cents ticks.
  assert.equal(etat.entites.filter((e) => e.ecrase === true).length, 2,
    'le montage n\'écrase plus personne : l\'exception ci-dessus ne se mesure plus');
  // ⚠⚠ ET LA PART EST BORNÉE, CE QUE LE MONTANT N'EST PAS. C'est la mesure qui
  // justifie `IMPACT_LOURD_MILLIEMES` : un seuil ABSOLU serait ininterprétable,
  // `facteurMilli` mettant dégâts et PV à l'échelle ensemble.
  parts = parts.sort((a, b) => a - b);
  assert.ok(parts[parts.length - 1] <= 1000, 'une part dépasse les PV max de la cible');
  assert.ok(parts[Math.floor(parts.length / 2)] > 0, 'la médiane des parts est nulle');
});

// ---------------------------------------------------------------------------
// JOURNAL T9 — le moteur ne connaît toujours aucun nom de son
// ---------------------------------------------------------------------------

test('JOURNAL T9 — le journal publie des FAITS, jamais un son (falsification n° 9)', () => {
  const source = sansCommentaires(lire('src', 'sim', 'combat.js'));
  for (const mot of ['weapon_', 'impact_', 'explosion_', 'alert_', 'movement_',
    'building_', 'ambience_', 'order_', 'ui_click']) {
    assert.ok(!source.includes(mot),
      `src/sim/combat.js nomme « ${mot} » : la simulation connaît un son du pack`);
  }
  // ⚠ ET AUCUN CHEMIN VERS `src/son/` NI `src/data/sons.js`, sous AUCUNE forme —
  // import nommé, import à effet de bord, import dynamique. C'est la garde du
  // lot SON-MOTEUR, reprise ici parce que c'est ce lot-ci qui ouvre le canal.
  for (const motif of [/from\s+['"][^'"]*\/son\//, /import\s+['"][^'"]*\/son\//,
    /import\(\s*['"][^'"]*\/son\//, /data\/sons\.js/]) {
    assert.ok(!motif.test(source), `src/sim/combat.js importe le son (${motif})`);
  }
  // ⚠⚠ ET LE JOURNAL NE TIRE RIEN. « Le générateur n'est pas touché » se mesure
  // ici de la façon la plus forte qui soit : `src/sim/combat.js` ne porte AUCUNE
  // source d'aléa, et n'en portait aucune avant le lot — le moteur de combat est
  // déterministe par construction depuis toujours. Un `tirer(etat.rng)` glissé
  // dans un fait de journal décalerait tout ce que la PARTIE tire ensuite, et la
  // partie cesserait de se rejouer à l'identique.
  for (const motif of [/(?<![\p{L}\p{N}_])rng(?![\p{L}\p{N}_])/u,
    /Math\.random/, /(?<![\p{L}\p{N}_])tirer\s*\(/u, /Date\.now/]) {
    assert.ok(!motif.test(source), `src/sim/combat.js a gagné une source d'aléa (${motif})`);
  }
  // L'appât dans les deux sens : le motif reconnaît la vraie faute.
  assert.ok(/(?<![\p{L}\p{N}_])rng(?![\p{L}\p{N}_])/u.test('const x = tirer(etat.rng);'),
    'le motif ne voit plus la vraie faute');

  // Et le journal ne porte que des primitives, comme le reste de l'état.
  const etat = creerCombat(montageDe('camp', 'richeQuartz', 25, 3));
  for (let i = 0; i < 40 && !etat.termine; i += 1) tick(etat);
  for (const [famille, liste] of Object.entries(etat.journal)) {
    assert.ok(Array.isArray(liste), `journal.${famille} n'est pas une liste`);
    for (const fait of liste) {
      for (const [cle, valeur] of Object.entries(fait)) {
        assert.ok(['number', 'string'].includes(typeof valeur),
          `journal.${famille}.${cle} n'est ni un nombre ni une chaîne`);
      }
    }
  }
});

// ---------------------------------------------------------------------------
// JOURNAL T10 — le fait porte le PROPRIÉTAIRE, jamais le camp
// ---------------------------------------------------------------------------

test('JOURNAL T10 — quand le joueur DÉFEND, ses pièces restent à lui (falsification n° 10)', () => {
  // ⚠⚠ CETTE GARDE A ÉTÉ ÉCRITE APRÈS AVOIR MESURÉ QU'ELLE MANQUAIT. Remplacer
  // `e.proprietaire` par `e.camp === 'attaque' ? 'joueur' : 'ouvrage'` dans
  // `faitDeLEntite` laissait la suite ENTIÈREMENT VERTE — **mesuré : 37 pass / 0
  // fail** — parce que TOUS les montages du dépôt font attaquer le joueur, si
  // bien que camp et propriétaire coïncident partout. Le seul état où ils
  // divergent est celui que `sim/raid-ouvrage.js` produit : l'Ouvrage attaque, et
  // c'est le joueur qui défend sa propre base. Sans ce montage-là, « les sons se
  // choisissent sur le propriétaire » serait une phrase que rien ne vérifie.
  //
  // ⚠ ET LA CONSÉQUENCE EST AUDIBLE, PAS THÉORIQUE : lire le camp ferait sonner
  // les Cuirassiers du joueur en `weapon_ouvrage_machinegun` dès le premier raid
  // sur sa base, et ses bâtiments s'effondreraient en `building_ouvrage_*`.
  const montage = {
    type: 'base',
    niveau: 20,
    saveur: null,
    obstacles: [],
    batiments: [{ id: 'caserne', rangee: 14, colonne: 5, niveau: 20 }],
    defenseurs: [{ id: 'carapace', rangee: 9, colonne: 5, niveau: 20 }],
    vagues: [[{ id: 'meute', rangee: 2, colonne: 5, niveau: 20 }]],
    proprietaireDefense: 'joueur',
    proprietaireAttaque: 'ouvrage',
  };
  const etat = creerCombat(montage);
  // Le montage mesure d'abord qu'il met bien les deux camps en désaccord avec
  // les deux propriétaires — sans quoi il ne prouverait rien.
  const parCamp = new Map(etat.entites.map((e) => [e.camp, e.proprietaire]));
  assert.equal(parCamp.get('defense'), 'joueur', 'montage : le joueur ne défend pas');
  assert.equal(parCamp.get('attaque'), 'ouvrage', 'montage : l\'Ouvrage n\'attaque pas');

  const vus = { tirs: new Set(), impacts: new Set(), destructions: new Set() };
  const parProprietaire = new Map(etat.entites.map((e) => [e.indice, e.proprietaire]));
  etat.maxTicks = 900;
  while (!etat.termine) {
    tick(etat);
    for (const cle of ['tirs', 'impacts', 'destructions']) {
      for (const fait of etat.journal[cle]) {
        assert.equal(fait.proprietaire, parProprietaire.get(fait.indice),
          `${cle} : le fait ${fait.id} ne porte plus le propriétaire de sa pièce`);
        vus[cle].add(fait.proprietaire);
      }
    }
  }
  // ⚠ ET LES DEUX PROPRIÉTAIRES SONT VUS POUR DE BON : un combat où seul l'un
  // des deux tire laisserait la moitié de la garde inerte.
  assert.deepEqual([...vus.tirs].sort(), ['joueur', 'ouvrage'],
    'montage : un seul propriétaire a tiré');
  assert.deepEqual([...vus.impacts].sort(), ['joueur', 'ouvrage'],
    'montage : un seul propriétaire a encaissé');
  assert.ok(vus.destructions.size > 0, 'montage : personne n\'est tombé');
});
