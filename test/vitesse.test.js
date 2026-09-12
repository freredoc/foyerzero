// Lot VITESSE — « une heure », c'est le temps de rendre CENT POUR CENT des PV.
//
// ⚠⚠ ARBITRAGE D'ETHAN DU 12/09, ET IL SUPERSÈDE CELUI DU 06/09. Jusqu'ici
// `ticksDeRetour` ne lisait NI les dégâts NI les PV : une pièce éraflée et une
// pièce rasée mettaient le même temps, et ce temps valait une heure à pleine
// santé quoi qu'il arrive. La durée est devenue proportionnelle à ce qu'il reste
// à rendre APRÈS le palier des 70 %, et le Complexe abîmé ne rallonge plus une
// durée fixe : il DIVISE la vitesse.
//
// ⚠⚠ ET LES DEUX GARDES DE CE FICHIER NE MESURENT PAS LA MÊME CHOSE. `VIT T1`
// tient la FORMULE — deux pièces de même niveau, deux attentes différentes — et
// tombe sur toute durée constante. `VIT T1 bis` tient le point de DÉPART GELÉ,
// qui est la faute que la nouvelle règle rend possible et que l'ancienne ne
// pouvait pas commettre : calculer la durée sur `degatsMilli`, qui DÉCROÎT
// pendant la rampe, ferait remonter le compte à rebours sous les yeux du joueur.
//
// ⚠⚠ `VIT T2`, LUI, EST DU RENDU SEUL. Un bâtiment de l'Ouvrage tué par les
// unités disparaissait de la scène au lieu de laisser une ruine — `visible`
// refusait tout ce qui n'est pas `vivant`, et le seul chemin qui en dessinait
// une était l'effondrement de fin de raid, qui ne prend que les SURVIVANTES.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  ticksDeRetour, ticksDeRetourDUnePieceRasee, pvApresRetour, retourDeLaPiece,
  pvMaxDeLaPieceDeGarnisonMilli, palierInstantaneMilli,
} from '../src/sim/reparation.js';
import { TICKS_PAR_HEURE } from '../src/sim/clock.js';
import { RETOUR_DEFENSES } from '../src/data/base.js';
import { RESTE_APRES_DESTRUCTION } from '../src/data/sites.js';
import { creerCombat, tick } from '../src/sim/combat.js';
import { listeAffichage } from '../src/render/scene.js';
import { calculerProjection, xDeColonne, yDeRangee } from '../src/render/projection.js';
import { MUR_CASES } from '../src/render/fond.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Une durée en ticks, dite « 3 min 36 s » — pour que les messages soient lisibles. */
function enMinutes(ticks) {
  const s = ticks / 10;
  return `${Math.floor(s / 60)} min ${(s % 60).toFixed(1)} s`;
}

// ---------------------------------------------------------------------------
// VIT T1 — la serrure de la règle
// ---------------------------------------------------------------------------

test('VIT T1 — deux pièces de MÊME niveau, deux attentes : la durée suit les dégâts', () => {
  // ⚠ LE MONTAGE PASSE PAR UNE PIÈCE RÉELLE, PAS PAR UN pvMax écrit ici : le
  // Merlon de niveau 5 en porte 2 928 000, un nombre que la formule n'a pas
  // choisi. Le brief donne ses valeurs en POURCENTAGES de PV, et c'est ce qui
  // les rend vérifiables sur n'importe quelle pièce.
  const pvMaxMilli = pvMaxDeLaPieceDeGarnisonMilli('merlon', 5);
  assert.equal(pvMaxMilli, 2_928_000, 'le montage ne porte plus la pièce qu\'il croit');

  const attente = (part) => ticksDeRetour({
    niveau: 5,
    niveauComplexe: 5,
    santeMilli: 1000,
    perdusMilli: Math.round(pvMaxMilli * part),
    pvMaxMilli,
  });

  // ⚠ LES DEUX VALEURS DU BRIEF, AU TICK. 20 % perdus laissent 6 % à rendre
  // après le palier — 14 % reviennent d'un coup —, donc 6 % d'une heure. Une
  // perte totale en laisse 30 %.
  const erafleee = attente(0.20);
  const rasee = attente(1);
  assert.equal(erafleee, 2160, `une éraflure de 20 % revient en ${enMinutes(erafleee)}`);
  assert.equal(rasee, 10800, `une rasée revient en ${enMinutes(rasee)}`);

  // ⚠⚠ ET C'EST CE COUPLE QUI EST LA SERRURE. La formule d'avant rendait
  // EXACTEMENT une heure pour les deux : ce test tombe des deux côtés sur elle,
  // et il tombe encore le jour où quelqu'un remet une durée qui ne lit pas les
  // dégâts. Les mesurer séparément ne dirait rien — c'est l'ÉCART qui garde.
  assert.notEqual(erafleee, rasee, 'la durée est redevenue constante : elle ne lit plus les dégâts');
  assert.equal(rasee, erafleee * 5, 'la durée n\'est plus proportionnelle à ce qui reste à rendre');
  assert.notEqual(erafleee, TICKS_PAR_HEURE, 'l\'éraflure met encore une heure : la règle du 06/09');
  assert.notEqual(rasee, TICKS_PAR_HEURE, 'la rasée met encore une heure : la règle du 06/09');

  // ⚠ ET LA RAMPE TOMBE D'ACCORD AVEC SON ÉCHÉANCE, ce qu'un palier calculé deux
  // fois ferait diverger. `palierInstantaneMilli` est la seule écriture de
  // « 700 × santé » ; les deux fonctions l'appellent.
  for (const part of [0.20, 0.5, 1]) {
    const perdus = Math.round(pvMaxMilli * part);
    const duree = attente(part);
    const aLaVeille = pvApresRetour({
      pvMaxMilli, pvApresRaidMilli: pvMaxMilli - perdus,
      niveau: 5, niveauComplexe: 5, santeMilli: 1000, ecouleTicks: duree - 1,
    });
    assert.ok(aLaVeille < pvMaxMilli, `perte ${part} : la pièce est entière AVANT son échéance`);
    assert.equal(pvApresRetour({
      pvMaxMilli, pvApresRaidMilli: pvMaxMilli - perdus,
      niveau: 5, niveauComplexe: 5, santeMilli: 1000, ecouleTicks: duree,
    }), pvMaxMilli, `perte ${part} : la pièce n'est pas entière À son échéance`);
  }

  // ⚠ LES QUATRE AUTRES LIGNES DU TABLEAU D'ETHAN, sur une pièce RASÉE, pour que
  // le facteur de santé soit gardé au même endroit que le facteur de dégâts.
  assert.equal(ticksDeRetourDUnePieceRasee(5, 5, 900), 14801, 'Complexe à 90 % : 24 min 40');
  assert.equal(ticksDeRetourDUnePieceRasee(5, 5, 500), 46800, 'Complexe à 50 % : 1 h 18');
  // Perte de 20 % sous un Complexe à 90 % — 4 min 56.
  assert.equal(ticksDeRetour({
    niveau: 5, niveauComplexe: 5, santeMilli: 900,
    perdusMilli: 200_000, pvMaxMilli: 1_000_000,
  }), 2960, 'Complexe à 90 %, perte de 20 % : 4 min 56');
  // Perte de 20 %, Complexe entier, pièce à +1 niveau — 3 min 57,6.
  assert.equal(ticksDeRetour({
    niveau: 6, niveauComplexe: 5, santeMilli: 1000,
    perdusMilli: 200_000, pvMaxMilli: 1_000_000,
  }), 2376, 'le dépassement ne se multiplie plus au reste à rendre');

  // ⚠ ET LE PALIER N'A PAS BOUGÉ D'UN MILLI-PV — c'est la moitié de la règle que
  // le 12/09 ne touche PAS, et une garde qui ne le dirait pas laisserait croire
  // que les 70 % du 05/09 sont partis avec le reste.
  assert.equal(palierInstantaneMilli(1_000_000, 1000), 700_000, 'le palier des 70 % a bougé');
  assert.equal(RETOUR_DEFENSES.partInstantaneeMilli, 700, 'la part instantanée a bougé');
  assert.equal(RETOUR_DEFENSES.heuresAuPlancher, undefined,
    '`heuresAuPlancher` est revenue dans la table : le plancher de 24 h est mort le 12/09');
});

test('VIT T1 bis — le rebours DESCEND d\'un tick par tick, il ne remonte jamais', () => {
  // ⚠⚠ LA FAUTE QUE LA NOUVELLE RÈGLE REND POSSIBLE, ET QUE L'ANCIENNE NE POUVAIT
  // PAS COMMETTRE. La durée dépend désormais des dégâts ; `degatsMilli` DÉCROÎT
  // pendant la rampe. Calculée dessus, l'attente rétrécirait à chaque tick et
  // l'échéance `tickDuRaid + durée` reculerait plus vite que le temps n'avance —
  // le compte à rebours de l'écran REMONTERAIT. C'est `retour.degatsAuDebutMilli`
  // qu'il faut lire, et c'est ce test qui le dit.
  const pvMaxMilli = pvMaxDeLaPieceDeGarnisonMilli('merlon', 5);
  const degatsAuDebutMilli = Math.round(pvMaxMilli * 0.5);
  const piece = {
    id: 'merlon',
    niveau: 5,
    degatsMilli: degatsAuDebutMilli,
    retour: {
      tickDuRaid: 0, santeMilli: 1000, niveauComplexe: 5, degatsAuDebutMilli,
    },
  };
  const laBase = { disposition: [{ id: 'complexeDeDefense', niveau: 5, degatsMilli: 0 }] };

  const duree = retourDeLaPiece(laBase, piece, 0).ticks;
  assert.ok(duree > 60, `le montage ne mesure rien : ${duree} ticks à parcourir`);

  let precedent = Infinity;
  for (let t = 0; t < duree; t += 1) {
    // La rampe fait décroître les dégâts — c'est exactement ce que le tick écrit.
    piece.degatsMilli = pvMaxMilli - pvApresRetour({
      pvMaxMilli, pvApresRaidMilli: pvMaxMilli - degatsAuDebutMilli,
      niveau: 5, niveauComplexe: 5, santeMilli: 1000, ecouleTicks: t,
    });
    const reste = retourDeLaPiece(laBase, piece, t).ticks;
    assert.equal(reste, duree - t, `au tick ${t} le rebours dit ${reste} au lieu de ${duree - t}`);
    assert.ok(reste < precedent, `au tick ${t} le rebours a REMONTÉ, de ${precedent} à ${reste}`);
    precedent = reste;
  }

  // ⚠ ET LE MONTAGE A BIEN FAIT DÉCROÎTRE LES DÉGÂTS : sans ça, « il ne remonte
  // pas » serait vrai d'un code qui lit n'importe lequel des deux champs.
  assert.ok(piece.degatsMilli < degatsAuDebutMilli * 0.1,
    `les dégâts n'ont pas fondu : ${piece.degatsMilli} sur ${degatsAuDebutMilli}`);
});

// ---------------------------------------------------------------------------
// VIT T2 — la ruine
// ---------------------------------------------------------------------------

/**
 * Un combat où la vague a DE QUOI abattre le bâtiment, et rien d'autre à faire.
 *
 * ⚠⚠ LE MONTAGE A DÛ ÊTRE MESURÉ AVANT D'ÊTRE CRU. Une Meute seule contre une
 * Souche vide sa réserve — 70 points pour 5 500 PV —, cesse de pouvoir blesser
 * un bâtiment, compte ses ticks inutiles et RENTRE À LA BASE : relevé, le
 * bâtiment finit à 5 010 000 milli-PV sur 5 500 000, le combat se termine sur
 * « attaquants », et la garde n'aurait rien mesuré. Neuf Fouisseurs — 500 de
 * réserve chacun — contre une Gangue de 1 000 PV la tuent en 187 ticks.
 */
function montageDeRuine() {
  return creerCombat({
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [{ id: 'gangue', rangee: 12, colonne: 5 }],
    defenseurs: [],
    vagues: [Array.from({ length: 9 }, (unused, i) => ({ id: 'fouisseurs', colonne: i + 1 }))],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] },
    },
  });
}

test('VIT T2 — un bâtiment de l\'Ouvrage tué au combat laisse sa ruine à l\'écran', () => {
  const etat = montageDeRuine();
  const proj = calculerProjection(1080, 4000, MUR_CASES);
  const batiment = etat.entites.find((e) => e.genre === 'batiment');
  assert.ok(batiment, 'le montage ne porte aucun bâtiment');
  assert.equal(batiment.proprietaire, 'ouvrage', 'le montage n\'oppose pas l\'Ouvrage');

  const rendu = () => listeAffichage(etat, proj, null, 0, null, 0, null);
  const spritesDu = (liste) => liste.filter((p) => p.forme === 'sprite').map((p) => p.nom);

  // ⚠ LE MONTAGE MESURE QUELQUE CHOSE AVANT DE MESURER LE LOT : le bâtiment est
  // à l'écran, INTACT, tant qu'il est vivant.
  const auDepartListe = rendu();
  const auDepart = spritesDu(auDepartListe);
  assert.ok(auDepart.includes('bat_o_gangue'),
    `le bâtiment vivant n'est pas dessiné : ${auDepart.join(' · ')}`);
  assert.ok(!auDepart.some((n) => n.endsWith('_detruit')), 'un bâtiment vivant se dessine détruit');

  // ⚠ LE COMBAT LE TUE POUR DE BON — on ne force pas `vivant` à la main : c'est
  // `sim/combat.js` qui décide, et c'est sa décision qu'on mesure.
  let tours = 0;
  while (batiment.vivant && tours < 20_000) { tick(etat); tours += 1; }
  assert.equal(batiment.vivant, false, `les Fouisseurs n'ont pas tué la Gangue en ${tours} ticks`);
  assert.equal(batiment.pvMilli, 0, 'le bâtiment est « mort » sans être à zéro PV');

  // ⚠⚠ LE LOT : l'entité reste dessinée, et dans son état DÉTRUIT.
  const apres = spritesDu(rendu());
  assert.ok(apres.some((n) => n.startsWith('bat_o_gangue') && n.endsWith('_detruit')),
    `le bâtiment mort a disparu de la scène : ${apres.join(' · ')}`);

  // ⚠⚠ ET IL N'A NI BARRE DE VIE NI CIBLAGE — c'est la moitié qui distingue une
  // ruine d'un bâtiment à zéro PV, et c'est ce qui interdisait d'élargir
  // `visible` : ses trois autres lecteurs — la barre, le trait de tir et la
  // cible affichée — doivent continuer de refuser ce qui est mort.
  //
  // ⚠ LA MESURE PORTE SUR LA CASE DU BÂTIMENT, PAS SUR LA LISTE ENTIÈRE. Les
  // neuf Fouisseurs sont vivants et portent LEURS barres : compter tous les
  // rectangles mesurerait la vague, pas la ruine.
  // ⚠ UNE ENTITÉ DE COMBAT PORTE `rangeeMilli` ET `colonneMilli`, JAMAIS
  // `rangee` — c'est ce qui avait tué le chaînage des murs au lot
  // STRUCTURES-AU-COMBAT, et la faute se répète sans lever : `xDeColonne(NaN)`
  // rend `NaN`, aucun rectangle ne tombe dessus, et la garde passerait au vert
  // en ne mesurant rien. C'est la première assertion qui l'a dit.
  const x = xDeColonne(proj, batiment.colonneMilli / 1000);
  const y = yDeRangee(proj, batiment.rangeeMilli / 1000);
  const t = proj.tailleCase;
  assert.ok(Number.isFinite(x) && Number.isFinite(y), 'la case du bâtiment n\'a pas de pixels');
  const surLaCase = (p) => p.x >= x && p.x < x + t && p.y >= y && p.y < y + t;

  const barresAvant = auDepartListe.filter((p) => p.forme === 'rect' && surLaCase(p));
  assert.ok(barresAvant.length > 0,
    'le montage ne mesure rien : le bâtiment VIVANT n\'avait déjà pas de barre');
  const barresApres = rendu().filter((p) => p.forme === 'rect' && surLaCase(p));
  assert.equal(barresApres.length, 0,
    `la ruine porte ${barresApres.length} rectangle(s) de barre`);

  // ⚠⚠ ET LA SECONDE MOITIÉ — « une ruine n'est pas CIBLÉE » — N'EST MESURABLE
  // SUR AUCUN MONTAGE D'AUJOURD'HUI, ET ELLE SE DÉCLARE. `cibleAffichee` est le
  // champ qui fait pivoter une TOURELLE vers ce qu'elle vise ; or seules les
  // pièces à tourelle le portent, et aucune ne vise un bâtiment — les défenseurs
  // tirent sur les attaquants. **Mesuré : zéro primitive de ce montage porte un
  // `cible`, avant comme après la mort du bâtiment.** Ce qui garde la propriété
  // est donc STRUCTUREL et non comportemental : `cibleAffichee` lit `visible` et
  // non `dessinee`, et `VIT T2 ter` le mesure dans la source. *Un test qui ne
  // peut tomber sur aucun état d'aujourd'hui se déclare, il ne se compte pas.*
  assert.equal(auDepartListe.filter((p) => p.cible).length, 0,
    'une primitive porte enfin un ciblage : la garde du ciblage devient mesurable');
});

test('VIT T2 ter — les trois lecteurs qui refusent une ruine sont NOMMÉS dans la source', () => {
  // ⚠⚠ CE QUE `VIT T2` NE PEUT PAS VOIR. Élargir `visible` au lieu d'ajouter
  // `dessinee` ferait passer `VIT T2` mot pour mot — la ruine serait dessinée —
  // et donnerait du même geste une barre de vie à un tas de gravats, un trait de
  // tir qui en part, et une tourelle qui pointe dessus. Les trois lectures
  // doivent rester sur `visible` ; seules les positions et le dessin passent par
  // `dessinee`.
  const source = readFileSync(join(RACINE, 'src/render/scene.js'), 'utf8');
  const sansProse = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

  assert.match(sansProse, /function dessinee\(/, '`dessinee` a disparu de la source');
  assert.match(sansProse, /function estUneRuine\(/, '`estUneRuine` a disparu de la source');

  // ⚠ LES DÉCLARATIONS SE RETIRENT AVANT DE COMPTER — c'est l'idiome du dépôt,
  // et une garde qui compte sa propre définition a déjà menti cinq fois ici.
  const sansDeclarations = sansProse
    .replace(/function (visible|dessinee|estUneRuine)\(/g, 'function DECLARATION_(');
  const compter = (motif) => (sansDeclarations.match(motif) ?? []).length;

  // Deux lecteurs de `dessinee` : les positions, et la boucle de dessin.
  assert.equal(compter(/[^a-zA-Z]dessinee\(/g), 2,
    '`dessinee` n\'a plus exactement deux lecteurs : positions et dessin');
  // Quatre appels de `visible` : les TROIS qui doivent refuser une ruine — la
  // barre de PV, le trait de tir, la cible affichée — et celui de `dessinee`.
  assert.equal(compter(/[^a-zA-Z]visible\(/g), 4,
    '`visible` a changé de nombre de lecteurs : la barre, le tir ou la cible a bougé');

  // ⚠ ET L'APPÂT : le motif reconnaît encore ce qu'il cherche, déclaration ôtée.
  assert.equal(compter(/[^a-zA-Z]DECLARATION_\(/g), 3,
    'les trois déclarations n\'ont pas été retirées : le compte porte sur autre chose');
});

test('VIT T2 bis — la règle se lit dans la TABLE, elle n\'est pas écrite pour les bâtiments', () => {
  // ⚠⚠ LA FALSIFICATION QUE `VIT T2` NE VOIT PAS. Un `=== 'batiment'` écrit dans
  // `render/scene.js` passerait `VIT T2` mot pour mot. Ce qui le distingue, c'est
  // que la règle est lue dans `RESTE_APRES_DESTRUCTION` : ouvrir `defense` à
  // `'ruine'` — ce que la table annonce en toutes lettres depuis le lot
  // EFFONDREMENT — doit suffire à faire rester les structures mortes.
  assert.equal(RESTE_APRES_DESTRUCTION.defense, 'rien',
    'la table a changé : ce test mesure la bascule, pas la valeur du jour');

  const monter = () => creerCombat({
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 18, colonne: 8 }],
    defenseurs: [{ id: 'merlon', rangee: 10, colonne: 5 }],
    vagues: [[{ id: 'meute', colonne: 5 }]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] },
    },
  });
  const proj = calculerProjection(1080, 4000, MUR_CASES);
  const nbSprites = (etat) => listeAffichage(etat, proj, null, 0, null, 0, null)
    .filter((p) => p.forme === 'sprite').length;

  const etat = monter();
  const mur = etat.entites.find((e) => e.id === 'merlon');
  let tours = 0;
  while (mur.vivant && tours < 20_000) { tick(etat); tours += 1; }
  assert.equal(mur.vivant, false, `la Meute n'a pas abattu le Merlon en ${tours} ticks`);

  const ferme = nbSprites(etat);
  const memoire = RESTE_APRES_DESTRUCTION.defense;
  let ouvert;
  try {
    RESTE_APRES_DESTRUCTION.defense = 'ruine';
    ouvert = nbSprites(etat);
  } finally {
    RESTE_APRES_DESTRUCTION.defense = memoire;
  }
  assert.ok(ouvert > ferme,
    `la table ouverte ne change rien (${ferme} → ${ouvert}) : la règle est écrite en dur`);
  assert.equal(nbSprites(etat), ferme, 'le montage n\'a pas rendu la table');
});
