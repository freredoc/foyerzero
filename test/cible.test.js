// Tests T1 à T8 du brief du lot 3C — une cible valide est une cible qu'on peut
// blesser.
//
// Chaque seuil porte son calcul en commentaire.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { UNITES, DEFENSES, COLONNES_DEGATS } from '../src/data/combat.js';
import { creerCombat, tick, resoudre, facteurMilli, TICKS_AVANT_REPLI } from '../src/sim/combat.js';
import { montageDuBanc, executerRaidComplet } from '../src/ui/banc.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Joue jusqu'au tick voulu, ou jusqu'à la fin du combat. */
function jouer(etat, jusquAuTick) {
  while (etat.tick < jusquAuTick && !etat.termine) tick(etat);
  return etat;
}

const trouver = (etat, id) => etat.entites.find((e) => e.id === id);
const cibleDe = (etat, e) => (e.cibleIndice === null ? null : etat.entites[e.cibleIndice].id);

/** Un bâtiment hors de portée, pour que la fin ne vienne pas d'une grille vide. */
const GANGUE_LOINTAINE = { id: 'gangue', rangee: 18, colonne: 1 };

// ---------------------------------------------------------------------------
// Le prédicat, recalculé indépendamment du moteur — c'est lui qui sert d'oracle
// aux balayages T5 et T8.
// ---------------------------------------------------------------------------

const COLONNE_CHASSIS = {
  escouade: 'infanterie', blinde: 'vehicule', aeronef: 'structureOuAviation',
};
const COLONNE_TYPE_DEFENSE = {
  mur: 'structureOuAviation', barriere: 'structureOuAviation',
  tourelle: 'structureOuAviation', artillerie: 'vehicule',
};
const colonneDe = (e) => (e.genre === 'batiment' ? 'structureOuAviation'
  : e.genre === 'defense' ? COLONNE_TYPE_DEFENSE[DEFENSES[e.id].type]
    : COLONNE_CHASSIS[UNITES[e.id].chassis]);
/**
 * LOT 4A — plus de matrice : la table de dégâts, en PV entiers par colonne.
 * Rend null pour une entité qui ne tire pas (bâtiments, Merlon, barrières).
 */
const tableDe = (e) => (e.genre === 'batiment' ? null
  : e.genre === 'defense' ? DEFENSES[e.id].degats : UNITES[e.id].degats);

/**
 * Les dégâts qu'un tir de `x` porterait à `c`, recalculés depuis les DONNÉES
 * seules — c'est l'oracle des balayages T5 et T8, et il ne doit rien devoir au
 * moteur. La colonne se lit en PV entiers dans la table, passe en milli-PV par
 * la courbe de niveau — exactement, sans reste — puis se pondère par la santé.
 */
function degatsAttendus(x, c) {
  const table = tableDe(x);
  if (table === null) return 0;
  if (c.genre === 'batiment' && x.camp === 'attaque' && x.reserve <= 0) return 0;
  const colonneMilli = table[colonneDe(c)] * facteurMilli(x.niveau);
  const sante = Math.floor((x.pvMilli * 1000) / x.pvMaxMilli);
  return Math.floor((colonneMilli * sante) / 1000);
}

/** Les 54 raids du §2 : 3 préréglages × 3 types × 6 graines, niveau 15. */
const GRAINES = [1, 2, 3, 7, 11, 42];
function* balayage() {
  for (const assaut of ['infanterie', 'blindeLourd', 'mixte']) {
    for (const type of ['camp', 'avantPoste', 'base']) {
      for (const graine of GRAINES) {
        yield {
          nom: `${assaut}/${type}/${graine}`,
          montage: montageDuBanc({
            type, niveau: 15, saveur: type === 'base' ? null : 'richeQuartz', graine, assaut,
          }),
        };
      }
    }
  }
}

// ---------------------------------------------------------------------------
// T1 — la DCA tire enfin sur ce qui vole
// ---------------------------------------------------------------------------

test('T1 — une Batterie vise l\'aéronef lointain, pas l\'infanterie collée', () => {
  // Le montage minimal du §2. Batterie en (5,5), portée 2,5 → 6 250 000.
  //   Fusilier en (4,5) : 1000² = 1 000 000, soit 1,00 case.
  //   Crécelle en (4,6) : 1000² + 1000² = 2 000 000, soit 1,41 case.
  // Les deux sont à portée et le Fusilier est le plus proche — mais la matrice
  // de la Batterie vaut {0, 0, 1} : elle ne peut toucher que ce qui vole.
  const montage = {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'batterie', rangee: 5, colonne: 5 }],
    vagues: [[{ id: 'meute', rangee: 4, colonne: 5 }, { id: 'crecelle', rangee: 4, colonne: 6 }]],
    modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
  };
  assert.deepEqual(DEFENSES.batterie.degats, {
    infanterie: 0, vehicule: 0, structureOuAviation: 40,
  });

  const etat = creerCombat(montage);
  const batterie = trouver(etat, 'batterie');
  const fusilier = trouver(etat, 'meute');
  const crecelle = trouver(etat, 'crecelle');

  jouer(etat, 1);
  assert.equal(cibleDe(etat, batterie), 'crecelle', 'dès le premier ciblage');

  // ⚠ Seuils déplacés au lot 4A, roster mesuré. La Batterie (Flak) tire 6 400 ÷
  // 160 = 40 PV contre l'aviation, la Crécelle (Orca) a 900 PV, le Fusilier 700.
  // Premier tir à pleine santé : floor(40 × 1000 × 1000 / 1000) = 40 000.
  assert.equal(crecelle.pvMilli, 900_000 - 40_000, 'premier tir à pleine santé');

  // Les dégâts décroissent ensuite, la Batterie étant elle-même sous le feu des
  // deux : le Fusilier lui rend 7 PV et la Crécelle 12, tous deux en colonne
  // « structure » — une tourelle se lit là. 19 000 milli-PV par tick au départ.
  //
  // ⚠ Et la Crécelle S'EN TIRE, ce qu'elle ne faisait pas avant la conversion :
  // traversante à 120 milli-cases par tick, elle passe au-dessus de la Batterie
  // et sort de sa portée de 2,5 avant d'être abattue. Au début du tick 28 elle
  // est en 7360, à 2360 milli-cases de rangée et 1000 de colonne, soit
  // 2360² + 1000² = 6 569 600 > 6 250 000. Le dernier tir est celui du tick 28.
  jouer(etat, 27);
  assert.equal(crecelle.rangeeMilli, 7240);
  assert.equal((7240 - 5000) ** 2 + 1000 ** 2, 6_017_600, 'encore à portée au tick 27');
  assert.ok(6_017_600 <= (DEFENSES.batterie.portee * 1000) ** 2);

  jouer(etat, 28);
  assert.equal(crecelle.pvMilli, 160, 'le dernier tir la laisse à 160 milli-PV sur 900 000');
  assert.equal((7360 - 5000) ** 2 + 1000 ** 2, 6_569_600, 'hors de portée au tick 28');
  assert.ok(6_569_600 > (DEFENSES.batterie.portee * 1000) ** 2);

  // Elle file, intouchable, et garde ses 160 milli-PV — 0,018 % de sa vie.
  jouer(etat, 33);
  assert.equal(crecelle.pvMilli, 160);
  assert.equal(crecelle.vivant, true, 'elle s\'échappe, à un cheveu près');

  // Et le Fusilier, lui, n'a JAMAIS rien perdu — avant le lot 3C, ni lui ni la
  // Crécelle ne perdaient un seul point de vie en 33 ticks. C'est ce que ce
  // test tient, et la conversion ne l'a pas changé.
  assert.equal(fusilier.pvMilli, 700_000, 'le Fusilier reste intact de bout en bout');
  assert.equal(fusilier.vivant, true);
});

// ---------------------------------------------------------------------------
// T2 — la colonne nulle en général, des deux côtés du champ
// ---------------------------------------------------------------------------

test('T2 — une colonne de dégâts nulle disqualifie la cible, si proche soit-elle', () => {
  // CÔTÉ ATTAQUE. Frappeur en (4,5), dégâts {0, 0, 300}, portée 1,5 → 2 250 000.
  //   Meute défensive en (5,5) : 1000² = 1 000 000, soit 1,000 case.
  //   Merlon en (5,6)          : 1000² + 1000² = 2 000 000, soit 1,414 case.
  // Les DEUX sont à portée — 2 000 000 ≤ 2 250 000 — et la Meute est la plus
  // proche. Il doit viser le Merlon. (Poser le Merlon en (6,5) le mettrait à
  // 2,0 cases, hors de portée : le test passerait pour la mauvaise raison.)
  assert.deepEqual(UNITES.frappeur.degats, {
    infanterie: 0, vehicule: 0, structureOuAviation: 300,
  });
  assert.ok(2_000_000 <= (UNITES.frappeur.portee * 1000) ** 2, 'le Merlon doit être à portée');

  const offense = creerCombat({
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'meute', rangee: 5, colonne: 5 }, { id: 'merlon', rangee: 5, colonne: 6 }],
    vagues: [[{ id: 'frappeur', rangee: 4, colonne: 5 }]],
    modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
  });
  jouer(offense, 1);
  assert.equal(cibleDe(offense, trouver(offense, 'frappeur')), 'merlon');
  // Et la Meute, plus proche mais insensible, n'a rien perdu. 700 PV mesurés.
  assert.equal(trouver(offense, 'meute').pvMilli, 700_000);

  // CÔTÉ DÉFENSE. Harpon en (8,5), dégâts {0, 0, 16}, portée 5,5 → 30 250 000, portée minimale
  // 3,5 → 12 250 000.
  //   Fendeur en (4,5) : 4000² = 16 000 000, soit 4,000 cases.
  //   Crécelle en (4,7) : 4000² + 2000² = 20 000 000, soit 4,472 cases.
  // Les deux sont dans la fenêtre, le Fendeur est le plus proche, et le Harpon
  // doit viser la Crécelle.
  assert.deepEqual(DEFENSES.harpon.degats, {
    infanterie: 0, vehicule: 0, structureOuAviation: 16,
  });
  for (const d2 of [16_000_000, 20_000_000]) {
    assert.ok(d2 >= (DEFENSES.harpon.porteeMini * 1000) ** 2, 'au-delà de la portée minimale');
    assert.ok(d2 <= (DEFENSES.harpon.portee * 1000) ** 2, 'en deçà de la portée');
  }

  const defense = creerCombat({
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'harpon', rangee: 8, colonne: 5 }],
    vagues: [[{ id: 'fendeur', rangee: 4, colonne: 5 }, { id: 'crecelle', rangee: 4, colonne: 7 }]],
    modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
  });
  jouer(defense, 1);
  assert.equal(cibleDe(defense, trouver(defense, 'harpon')), 'crecelle');
  assert.equal(trouver(defense, 'fendeur').pvMilli, 1_000_000, 'le Fendeur reste intact');
});

// ---------------------------------------------------------------------------
// T3 — la réserve vide invalide le bâtiment, pas le défenseur
// ---------------------------------------------------------------------------

test('T3 — à réserve nulle, le bâtiment sort du jeu et la défense y reste', () => {
  // Grenadier en (11,5), portée 1,5 → 2 250 000, matrice structure 1,0.
  //   Casemate en (10,5) : 1000² = 1 000 000, soit 1,00 case.
  //   Gangue en (12,5)   : 1000² = 1 000 000, soit 1,00 case.
  // Les deux sont à ÉGALE distance : seule la validité peut les départager.
  const montageAvec = (reserve) => ({
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [{ id: 'gangue', rangee: 12, colonne: 5 }],
    defenseurs: [{ id: 'casemate', rangee: 10, colonne: 5 }],
    vagues: [[{ id: 'perceurs', rangee: 11, colonne: 5, reserve }]],
    modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
  });

  // À réserve 0 : le plancher ne protège que les bâtiments, le tir sur la
  // défense reste gratuit. La Casemate est la seule cible valide.
  const vide = creerCombat(montageAvec(0));
  jouer(vide, 1);
  assert.equal(cibleDe(vide, trouver(vide, 'perceurs')), 'casemate');
  assert.equal(trouver(vide, 'gangue').pvMilli, 1_000_000, 'la Gangue n\'a rien reçu');

  // À réserve 1, les deux redeviennent valides et c'est la règle du lot 2A qui
  // tranche : « la plus proche, à égalité la plus à gauche ». Distances égales,
  // colonne égale — c'est le troisième critère, la rangée la plus basse, qui
  // sort la CASEMATE. Et ce n'est pas un hasard de montage : un défenseur vit
  // entre les rangées 3 et 10, un bâtiment entre 11 et 18, donc sur une égalité
  // parfaite le défenseur est toujours le plus bas.
  const pleine = creerCombat(montageAvec(1));
  jouer(pleine, 1);
  assert.equal(cibleDe(pleine, trouver(pleine, 'perceurs')), 'casemate');

  // Pour montrer que la réserve rend bien le bâtiment de nouveau valide, on
  // retire la Casemate : à réserve 1 le Grenadier vise la Gangue, à réserve 0
  // il n'a plus aucune cible.
  const sansDefense = (reserve) => {
    const m = montageAvec(reserve);
    m.defenseurs = [];
    const etat = creerCombat(m);
    jouer(etat, 1);
    return cibleDe(etat, trouver(etat, 'perceurs'));
  };
  assert.equal(sansDefense(1), 'gangue');
  assert.equal(sansDefense(0), null, 'réserve vide et rien d\'autre : aucune cible');
});

// ---------------------------------------------------------------------------
// T4 — le Broyeur ne gèle plus
// ---------------------------------------------------------------------------

test('T4 — le raid qui expirait au tick 900 se conclut maintenant', () => {
  // Le cas réel du §2 : un Percheron à réserve nulle, collé à une Gangue, la
  // visait éternellement sans jamais tirer, alors qu'une Batterie et un
  // Fusilier étaient à portée et frappables gratuitement.
  const parametres = {
    type: 'avantPoste', niveau: 15, saveur: 'richeQuartz', graine: 1, assaut: 'blindeLourd',
  };
  const r = executerRaidComplet(parametres);
  // ⚠ SEUILS DÉPLACÉS DEUX FOIS. Avant le lot 3C : `duree` au tick 900. Lot 3C :
  // `attaquants` au tick 542. Lot 4A, roster mesuré : `souche` au tick 419, le
  // même assaut lourd rasant le site.
  //
  // Lot 4B : `attaquants` au tick 383, 2 656 quartz. L'assaut s'effondre, et
  // pour DEUX raisons cumulées. Les bâtiments quintuplent de PV, donc l'objectif
  // demande cinq fois plus de travail ; et surtout le préréglage figé alignait
  // au niveau 15 un Broyeur (débloqué au 28) et un Pilon (au 32), que le budget
  // refuse désormais. Ce que ce test tient est inchangé depuis le lot 3C : le
  // raid ne se termine pas faute de mieux.
  //
  // Lot CARTE (29/08) : `attaquants` au tick 313, et plus AUCUN survivant. Les
  // dix obstacles sont cantonnés à la bande de défense : l'assaut lourd s'y
  // fait retenir plus longtemps sous le feu, il y laisse les deux unités qui
  // rentraient à la base, et le raid se termine plus tôt faute de combattants.
  // Le butin monte pourtant — 2 766 contre 2 655 — parce que ces deux unités-là
  // ont tiré avant de tomber. Ce que ce test tient est inchangé depuis le lot
  // 3C : le raid ne se termine pas faute de mieux.
  //
  // ⚠⚠ LOT ARRÊT (04/09) : 193 ticks, et le raid RACCOURCIT de 120. L'assaut
  // lourd ne s'arrête plus pour les tourelles ni pour les murs qu'il croisait :
  // il entre dans la bande de défense, y prend tout le feu de face et s'y
  // défait.
  //
  // ⚠⚠ LOT COLONNE (06/09) : 594 ticks, et le raid RALLONGE DE 401 — plus du
  // triple. C'est l'exact symétrique de ce qu'ARRÊT avait mesuré : l'arrêt sur
  // prédilection revient « EN PLUS du bâtiment », donc l'assaut lourd se fige de
  // nouveau devant les pièces de garnison de sa colonne au lieu de les
  // traverser. Il ne les traverse plus, il les casse — et il y met le temps.
  //
  // Ce que ce test tient est inchangé depuis le lot 3C, à travers les cinq
  // réancrages : **le raid ne se termine pas faute de mieux.**
  assert.notEqual(r.cause, 'duree', 'le raid ne doit plus expirer faute de mieux');
  assert.equal(r.cause, 'attaquants');
  //
  // ⚠⚠ ET LE POINT 9 DU MÊME LOT LE RAMÈNE À 164 TICKS, SOIT SOUS SA VALEUR
  // D'AVANT LE LOT. Il faut le dire dans ce sens-là : les deux moitiés du lot
  // tirent en sens contraire sur ce raid-ci, et la seconde l'emporte largement.
  // La disposition du site ne se contente pas de changer de forme — la
  // composition de la garnison bouge avec elle, `composerRepartition` tirant
  // APRÈS `placerBatiments`, dont le nombre de tirages a changé. L'assaut lourd
  // de la graine 1 tombe désormais très vite. **Aucun barème n'a été touché**,
  // et ce que ce test tient est toujours la même chose : le raid ne se termine
  // pas faute de mieux.
  //
  // ⚠⚠ LOT CIBLES-RANGÉES (07/09) : LES TAILLES DE RANGÉE SE TIRENT À LEUR TOUR.
  // Le lot COLONNE avait rendu la charge par COLONNE variable ; la rangée restait
  // une fonction pure du rang, si bien qu'un site portait toujours le même nombre
  // d'occupants sur les mêmes lignes — mesuré, UN SEUL profil d'occupation par
  // rangée sur 200 graines. `taillesDeRangee` consomme donc désormais des
  // tirages, et tout ce qui tire APRÈS `placerDefenses` et `placerBatiments` se
  // décale : obstacles, composition, vagues. Le brief l'annonçait, le rapport le
  // chiffre, et ce que ce test tient ne change pas.
  //
  // ⚠⚠ LOT DISPOSITION-OUVRAGE (08/09) : 414 TICKS, CINQ DE PLUS — ET LA CAUSE
  // N'EST PAS CELLE DES QUATRE RÉANCRAGES PRÉCÉDENTS. Ceux-là déplaçaient le
  // FLUX de tirages, donc RECOMPOSAIENT la garnison ; ce lot-ci tire sur un
  // SECOND flux, salé, précisément pour que la composition ne bouge pas d'un
  // identifiant. Ce qui change est la POSITION des mêmes pièces : les deux blocs
  // FLOTTENT désormais dans leur bande au lieu d'être collés à son bord. Cinq
  // ticks d'écart contre 401 puis 245 aux lots précédents — la mesure dit
  // elle-même que ce lot déplace moins que ceux qui recomposaient.
  // ⚠⚠ LOT PAQUETS (09/09) : LE SITE CHANGE DE DISPOSITION ET DE GARNISON. Le
  // placement passe par paquets ET retire ses tirages du flux de composition,
  // donc la garnison de toute graine change avec sa forme. 414 → 308, butin
  // 21 542 · 7 180 → 18 610 · 6 203, survivants 6 → 4.
  //
  // ⚠ LOT MUR (10/09) : 308 → 309. UN TICK, et rien d'autre — ni la cause, ni le
  // butin, ni les survivants. Le site n'a changé ni de composition ni de forme ;
  // seul le déroulé bouge, et à peine. Ce que ce test existe pour tenir — le raid
  // ne se traîne plus jusqu'au plafond de 900 — est intact.
  //
  // ⚠⚠ LOT APPROCHE (11/09) : 309 → 334, ET LA CAUSE EST LE POINT DE DÉPART.
  // `executerRaidComplet` passe par la porte de PRODUCTION — `genererAssaut`
  // compose des vagues SANS `rangee` —, donc l'assaut naît désormais sur la voie
  // d'approche et joue deux cases avant d'entrer en grille. Vingt-cinq ticks, et
  // ce n'est ni le flux, ni la position, ni le déroulé : c'est l'ENTRÉE. Ce que
  // ce test tient est inchangé depuis le lot 3C, à travers les huit réancrages :
  // **le raid ne se termine pas faute de mieux**, et la cause reste
  // `attaquants`.
  assert.equal(r.nbTicks, 334);
  // Lot COURBE : 2 655 au lieu de 2 656. UNE unité de quartz, et rien d'autre —
  // ni la cause, ni le tick 383, ni les deux survivants. Le butin est
  // proportionnel aux dégâts en milli-PV, qui s'arrondissent une fois de plus.
  //
  // ⚠ LOT MULTIPLICATEUR (29/08) : le butin d'un AVANT-POSTE est multiplié par
  // 3,25. `TYPES_SITE.avantPoste.multiplicateurButin` portait ce nombre depuis
  // le relevé TA et n'était lu par personne. Rien d'autre ne bouge — ni la
  // cause, ni le tick, ni les survivants : le multiplicateur s'applique APRÈS le
  // combat, il ne change pas un seul tir. Les raids sur camp, eux, ne bougent
  // pas d'une unité, leur facteur valant 1.
  //
  // ⚠ LOT ARRÊT : 2 094 et 698, soit 77 % de moins. Le raid durait 120 ticks de
  // moins, donc il tirait moins, donc il rapportait moins — et le multiplicateur
  // de 3,25 de l'avant-poste amplifiait la baisse comme il amplifiait la hausse.
  //
  // ⚠ LOT COLONNE, POINT 7 : 12 182 et 4 060, soit près de SIX FOIS le lot ARRÊT
  // et quatre fois et demie ce que le raid rapportait avant lui. Même mécanique
  // dans l'autre sens : trois fois plus de ticks, donc trois fois plus de tirs,
  // amplifiés par le 3,25 de l'avant-poste.
  //
  // ⚠⚠ ET LE POINT 9 LE RAMÈNE À ZÉRO. Cent soixante-quatre ticks ne suffisent
  // pas à griffer un bâtiment : l'assaut lourd meurt dans la bande de défense.
  // C'est le même renversement que sur le tick, mesuré sur l'autre grandeur.
  // **Aucun barème n'a été touché.**
  //
  // ⚠⚠ ET LE LOT CIBLES-RANGÉES LE REMONTE À 31 028 ET 10 342. Quatre cent neuf
  // ticks au lieu de cent soixante-quatre : l'assaut lourd de la graine 1
  // traverse de nouveau la bande de défense et griffe les bâtiments, et le
  // multiplicateur de 3,25 de l'avant-poste amplifie la remontée comme il avait
  // amplifié la chute. **Aucun barème n'a été touché**, et ce que ce test tient
  // — le raid ne se termine pas faute de mieux — ne bouge pas.
  //
  // ⚠ LOT DISPOSITION-OUVRAGE (08/09) : 21 542 et 7 180, soit −30,6 %, pour
  // cinq ticks de PLUS. Le raid dure à peine plus longtemps et rapporte moins :
  // les blocs flottent, donc l'assaut lourd de la graine 1 met plus de temps à
  // atteindre les bâtiments et en griffe moins avant de tomber. **Aucun barème
  // n'a été touché.**
  //
  // ⚠ LOT MUR (10/09) : 15 636 et 5 212, soit −16 %, pour UN tick de plus. Même
  // mécanique qu'au lot d'avant, en plus petit : le raid s'arrête davantage dans
  // la bande de défense — les anti-structure y ouvrent murs et tourelles au lieu
  // de les longer — et griffe donc moins de bâtiments avant de tomber. Le
  // multiplicateur de 3,25 de l'avant-poste amplifie la baisse comme toujours.
  // **Aucun barème n'a été touché**, et ce que ce test tient — le raid ne se
  // termine pas faute de mieux — ne bouge pas : la cause reste `attaquants`.
  // ⚠⚠ ET LE SECOND GESTE DU LOT MUR LE REMONTE À **18 540 ET 6 180**, POUR LE
  // MÊME NOMBRE DE TICKS — 309 des deux côtés. C'est le rangement LATÉRAL de
  // `seDecaler`, le jumeau du point 2 sur l'axe des colonnes : une défenseuse
  // qui se range sur sa case au lieu de fluer à 96 % dans celle du merlon cesse
  // d'être là où l'assaut la croyait. La défense de cet avant-poste s'écarte
  // donc autrement, l'assaut lourd atteint davantage de bâtiments, et le
  // multiplicateur de 3,25 amplifie la remontée comme il amplifiait la baisse.
  // **Aucun barème n'a été touché**, et la cause reste `attaquants`.
  // ⚠ LOT APPROCHE (11/09) : 17 962 et 5 987, soit −3,1 %, pour vingt-cinq ticks
  // de PLUS. L'assaut lourd passe ces ticks-là sur la voie d'approche, où il n'a
  // rien à griffer, et il y entre déjà sous le feu des artilleries — les trois
  // portent 5,5 de portée et atteignent la rangée 0 depuis la 4 ou la 5. Il
  // arrive donc un peu plus entamé devant les bâtiments, et le multiplicateur de
  // 3,25 de l'avant-poste amplifie la baisse comme il amplifiait la hausse.
  // **Aucun barème n'a été touché**, et la cause reste `attaquants`.
  assert.deepEqual(r.butin, { quartz: 17_962, scorie: 5_987 });
  // ⚠ ET LE SURVIVANT REVIENT — trois au premier geste, **quatre** au second.
  // La première moitié du lot faisait s'arrêter les anti-structure sous le feu
  // des tourelles ; la seconde écarte les défenseuses de leur trajet. Les deux
  // effets jouent en sens contraire, et le second l'emporte ici.
  assert.equal(r.resultat.attaquants.filter((a) => !a.detruit).length, 4);
});

// ---------------------------------------------------------------------------
// T5 — plus aucun ciblage stérile
// ---------------------------------------------------------------------------

test('T5 — sur les 54 raids, aucune cible stérile ne survit à un ciblage', () => {
  // ⚠ Ce qu'on mesure, et pourquoi. Une cible peut devenir stérile PENDANT le
  // tick où elle a été légitimement visée : l'étape 5 fait tomber les PV du
  // tireur sous 1 ‰, ou l'étape 8 vide sa réserve. Lire l'état en fin de tick
  // compte donc des stérilités qui n'existaient pas au moment du ciblage.
  // Le vrai critère est : une cible stérile SURVIT-ELLE au ciblage suivant ?
  // C'est ce que ferme le lot 3C, et la réponse doit être non, jamais.
  let survivants = 0;
  let raids = 0;
  const expires = [];
  let ticksVises = 0;
  let dcaVises = 0;
  let dcaSteriles = 0;

  for (const { nom, montage } of balayage()) {
    const etat = creerCombat(montage);
    raids += 1;
    const dca = new Set(etat.entites.filter((e) => e.id === 'batterie' || e.id === 'harpon')
      .map((e) => e.indice));
    let precedent = new Map();
    while (!etat.termine) {
      tick(etat);
      for (const [indice, cible] of precedent) {
        const x = etat.entites[indice];
        if (!x.vivant || x.sorti || x.cibleIndice !== cible) continue;
        const c = etat.entites[x.cibleIndice];
        if (c.vivant && !c.sorti && degatsAttendus(x, c) === 0) {
          survivants += 1;
          assert.fail(`${nom} tick ${etat.tick} : « ${x.id} » garde « ${c.id} », zéro dégât`);
        }
      }
      precedent = new Map();
      for (const x of etat.entites) {
        if (!x.vivant || x.sorti || x.cibleIndice === null) continue;
        const c = etat.entites[x.cibleIndice];
        if (!c.vivant || c.sorti || tableDe(x) === null) continue;
        ticksVises += 1;
        if (dca.has(x.indice)) {
          dcaVises += 1;
          if (degatsAttendus(x, c) === 0) dcaSteriles += 1;
        }
        if (degatsAttendus(x, c) === 0) precedent.set(x.indice, x.cibleIndice);
      }
    }
    if (etat.cause === 'duree') expires.push(nom);
  }

  assert.equal(raids, 54, '3 préréglages × 3 types × 6 graines');
  assert.ok(ticksVises > 40_000, `balayage trop maigre : ${ticksVises} ticks-entités`);
  assert.equal(survivants, 0, 'aucune cible stérile ne doit survivre à un ciblage');

  // ⚠ SEUIL DÉPLACÉ DEUX FOIS, et il faut dire exactement ce qu'il mesure.
  // Le lot 3C exigeait zéro raid terminé par `duree`, et c'était le bon critère
  // TANT QUE la seule cause d'expiration était une unité gelée sur une cible
  // qu'elle ne pouvait pas blesser. Cette cause-là a disparu et ne revient pas —
  // c'est ce que les assertions ci-dessus tiennent, et elles tiennent toujours.
  //
  // Ce qui bouge est la DURÉE des combats. Au lot 4A, l'échelle T = 16 s en
  // faisait déjà dépasser un sur 54. Au lot 4B, les bâtiments quintuplent de PV
  // et les assauts rentrent dans leur budget : deux raids dépassent les 90
  // secondes, `infanterie/base/11` et `blindeLourd/base/11`.
  //
  // Aucun des deux n'est un gel. Vérifié en levant le plafond : ils se
  // concluent d'eux-mêmes aux ticks 1084 et 1964, par `attaquants`. Ce sont des
  // combats trop longs, pas des combats sans issue — un fait à remonter, pas à
  // corriger en douce. Voir le rapport.
  //
  // ⚠ LOT CARTE (29/08) : ILS SONT QUATRE, ET LE COUPABLE EST LE TERRAIN. Les
  // dix obstacles ne se dispersent plus sur les rangées 3 à 18 mais sur les
  // huit rangées de DÉFENSE seules — arbitré par Ethan. Leur densité y double,
  // et ils sont désormais TOUS sur le chemin de l'assaut, là où la moitié
  // d'entre eux ralentissait auparavant une traversée déjà gagnée. Les raids
  // s'allongent, mécaniquement.
  //
  // La liste change des deux côtés, et c'est cohérent : `infanterie/base/11` en
  // SORT — il se conclut maintenant au tick 861, sous le plafond — pendant que
  // trois autres y entrent. Un simple allongement uniforme n'aurait fait
  // qu'ajouter.
  //
  // Aucun des quatre n'est un gel, vérifié comme la fois précédente en portant
  // `dureeMaxCombatSec` à 600 : ils se concluent tous par `attaquants`, aux
  // ticks 1080 (blindeLourd/camp/2), 4645 (blindeLourd/base/11), 948
  // (mixte/camp/11) et 2019 (mixte/base/11). Le 4645 était à remonter : 464
  // secondes de combat, c'est cinq fois le plafond.
  //
  // ⚠⚠ LOT ARRÊT (04/09) : IL N'EN RESTAIT AUCUN, ET C'ÉTAIT LA MEILLEURE MESURE
  // DE CE LOT-LÀ. Les quatre raids qui touchaient le plafond se concluaient
  // d'eux-mêmes ; le « autre régime » à 4 645 ticks avait disparu avec eux.
  //
  // ⚠⚠ LOT COLONNE (06/09) : ILS SONT TROIS, ET C'EST LE PRIX DE L'ARRÊT SUR
  // PRÉDILECTION. Ethan rétablit l'arrêt sur la cible de prédilection « EN PLUS
  // du bâtiment » : une unité qui croise une pièce de garnison de sa colonne se
  // fige devant elle au lieu de la traverser, donc l'assaut reste plus longtemps
  // sous le feu et les combats s'allongent. C'est mécanique, et c'est l'exact
  // symétrique de ce que le lot ARRÊT avait mesuré en sens inverse.
  //
  // ⚠⚠ ET LE POINT 9 DU MÊME LOT N'EN LAISSE QU'UN, EN CHANGEANT SON NOM. La liste bouge des DEUX côtés — les trois du point 7 sortent, deux
  // autres entrent — et c'est cohérent : la disposition ET la composition d'un
  // site changent ensemble, donc un raid qui traînait peut désormais s'achever
  // et un raid qui s'achevait peut traîner. Un allongement uniforme n'aurait
  // fait qu'ajouter.
  //
  // ⚠ IL N'EST PAS UN GEL, vérifié comme les fois précédentes en portant
  // `maxTicks` à 20 000 : il se conclut par `attaquants` au tick 5 478. C'est un
  // combat trop long, pas un combat sans issue.
  //
  // ⚠⚠ ET LE 5 478 EST À REMONTER, COMME LE 4 645 DU LOT CARTE L'AVAIT ÉTÉ :
  // 547 secondes de combat, c'est six fois le plafond. Ce n'est plus un
  // dépassement, c'est un autre régime. Voir `RAPPORT-lotCOLONNE.md`.
  //
  // ⚠⚠ LOT CIBLES-RANGÉES (07/09) : ILS SONT TROIS, ET LES TROIS SONT NEUFS. La
  // liste bouge entièrement des deux côtés — `blindeLourd/base/1` en sort, trois
  // assauts MIXTES y entrent. Les tailles de rangée se tirent désormais, donc la
  // disposition ET la composition d'un site changent ensemble : un raid qui
  // traînait s'achève, un raid qui s'achevait traîne. Un allongement uniforme
  // n'aurait fait qu'ajouter.
  //
  // ⚠⚠ ET LE « AUTRE RÉGIME » A DISPARU, CE QUI EST LA BONNE NOUVELLE DU RELEVÉ.
  // Aucun des trois n'est un gel, vérifié en portant `maxTicks` à 20 000 : ils
  // se concluent tous par `attaquants`, aux ticks **1 478** (mixte/base/11),
  // **1 101** (mixte/camp/11) et **945** (mixte/camp/3). Le 5 478 du lot COLONNE
  // — six fois le plafond, « à remonter » — n'a plus d'équivalent : le pire des
  // trois vaut une fois et demie le plafond.
  //
  // ⚠⚠ LOT DISPOSITION-OUVRAGE (08/09) : ILS SONT DEUX, ET LA LISTE BOUGE DES
  // DEUX CÔTÉS. `mixte/base/11` et `mixte/camp/3` en sortent, `blindeLourd/camp/42`
  // y entre ; `mixte/camp/11` reste, au même tick. Les deux blocs flottent
  // désormais dans leur bande : un raid qui traînait s'achève, un raid qui
  // s'achevait traîne — un allongement uniforme n'aurait fait qu'ajouter.
  //
  // ⚠⚠ ET LE « AUTRE RÉGIME » EST DE RETOUR SUR UN RAID, CE QU'IL FAUT DIRE
  // PLUTÔT QUE DE LE TAIRE. Aucun des deux n'est un gel, vérifié en portant
  // `maxTicks` à 20 000 : ils se concluent par `attaquants`, aux ticks **3 539**
  // (blindeLourd/camp/42) et **1 101** (mixte/camp/11). Le premier vaut
  // **quatre fois le plafond** — 354 secondes de combat. C'est le troisième du
  // genre après le 4 645 du lot CARTE et le 5 478 du lot COLONNE, et il est à
  // remonter pour la même raison : ce n'est plus un dépassement, c'est un autre
  // régime. **Aucun barème n'a été touché**, et l'arbitrage revient à Ethan.
  //
  // ⚠ ET LA LISTE EST NOMMÉE, PAS BORNÉE : « au plus deux » laisserait entrer
  // n'importe quel autre raid. Ceux-là, et personne d'autre.
  // ⚠⚠ LOT PAQUETS (09/09) : TROIS RAIDS TOUCHENT LE PLAFOND, ET AUCUN N'EST UN
  // GEL — mesuré en portant `maxTicks` à 20 000 : ils se concluent par
  // `attaquants` aux ticks **1 035** (blindeLourd/base/7), **978** (mixte/camp/7)
  // et **2 104** (mixte/base/1). Le pire vaut 2,3 fois le plafond, contre 4 fois
  // au lot d'avant. La liste change parce que la disposition ET la garnison de
  // chaque site changent ; le calibrage reste à Ethan.
  // ⚠⚠ LOT MUR (10/09) : ILS NE SONT PLUS QU'UN, ET C'EST LE MEILLEUR CHIFFRE
  // QUE CETTE LISTE AIT PORTÉ. `blindeLourd/base/7` et `mixte/base/1` en
  // SORTENT — ils se concluent désormais dans le plafond —, `mixte/camp/7`
  // reste. Deux règles tirent dans le même sens ici : les anti-structure
  // s'arrêtent pour OUVRIR les murs au lieu de les longer, et le forçage de
  // l'Écraseur retrouve la case devant lui, donc les brèches se font. Un raid
  // qui n'a plus de mur devant lui ne traîne plus.
  //
  // ⚠ ET LE SURVIVANT N'EST PAS UN GEL, vérifié en portant `maxTicks` à 20 000 :
  // il se conclut par `attaquants` au tick **2 618**, soit 2,9 fois le plafond —
  // contre 2,3 fois au lot PAQUETS. C'est le quatrième du genre après le 4 645
  // du lot CARTE, le 5 478 du lot COLONNE et le 2 104 du lot PAQUETS, et il est
  // à remonter pour la même raison : ce n'est pas un dépassement, c'est un autre
  // régime. **Aucun barème n'a été touché**, et l'arbitrage revient à Ethan.
  //
  // ⚠⚠ LOT APPROCHE (11/09) : IL Y EN A TOUJOURS UN, ET CE N'EST PLUS LE MÊME.
  // `mixte/camp/7` sort, `mixte/base/42` entre — la liste bouge des DEUX côtés,
  // ce qu'un allongement uniforme ne ferait pas. La cause est le POINT DE
  // DÉPART : les vagues naissent sur la voie d'approche et jouent deux cases
  // avant d'entrer, donc chaque raid arrive autrement entamé devant la défense.
  // Un raid qui traînait s'achève, un raid qui s'achevait traîne.
  //
  // ⚠⚠ ET C'EST LE MEILLEUR DÉPASSEMENT QUE CE TEST AIT JAMAIS RELEVÉ. Il n'est
  // pas un gel, vérifié comme les fois précédentes en portant `maxTicks` à
  // 20 000 : il se conclut par `attaquants` au tick **940**, soit **1,04 fois le
  // plafond**. Le « autre régime » n'a plus d'équivalent — 4 645 au lot CARTE,
  // 5 478 au lot COLONNE, 3 539 au lot DISPOSITION-OUVRAGE, 2 618 au lot MUR, et
  // quarante ticks ici. **Aucun barème n'a été touché.**
  //
  // ⚠ ET LA LISTE RESTE NOMMÉE, PAS BORNÉE : « au plus un » laisserait entrer
  // n'importe quel autre raid. Celui-là, et personne d'autre.
  assert.deepEqual(
    expires.sort(), ['mixte/base/42'],
    'la liste des raids qui touchent le plafond de 900 a changé',
  );
  // Et la couche anti-aérienne, qui passait 96,7 % de ses ticks à viser du sol.
  assert.ok(dcaVises > 0, 'le balayage doit contenir des pièces anti-aériennes');
  assert.equal(dcaSteriles, 0, 'la DCA ne vise plus rien qu\'elle ne puisse abattre');
});

// ---------------------------------------------------------------------------
// T6 — la cible conservée suit la même règle
// ---------------------------------------------------------------------------

test('T6 — la réserve épuisée fait CHANGER de cible, pas conserver l\'ancienne', () => {
  // Grenadier en (11,5) à réserve 1, portée 1,5 → 2 250 000.
  //   Gangue en (12,5)   : 1 000 000, la plus proche.
  //   Casemate en (10,4) : 1000² + 1000² = 2 000 000, à portée mais plus loin.
  // Au tick 1 la Gangue est valide (réserve 1) et la plus proche : il la vise,
  // tire, et l'étape 8 vide sa réserve. Au tick 2 la Gangue est disqualifiée et
  // il doit basculer sur la Casemate.
  const etat = creerCombat({
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [{ id: 'gangue', rangee: 12, colonne: 5 }],
    defenseurs: [{ id: 'casemate', rangee: 10, colonne: 4 }],
    vagues: [[{ id: 'perceurs', rangee: 11, colonne: 5, reserve: 1 }]],
    modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
  });
  const grenadier = trouver(etat, 'perceurs');

  jouer(etat, 1);
  assert.equal(cibleDe(etat, grenadier), 'gangue', 'la plus proche, et valide');
  assert.equal(grenadier.reserve, 0, 'le tir a vidé la réserve');
  // Le Grenadier (Missile Squad) tire 4 000 ÷ 160 = 25 PV contre une structure,
  // soit 25 000 milli-PV à pleine santé (lot 4A).
  // ⚠ Seuil déplacé au lot 4B : la Gangue passe de 150 à 1 000 PV.
  // 1 000 000 → 975 000.
  assert.equal(trouver(etat, 'gangue').pvMilli, 1_000_000 - 25_000);

  jouer(etat, 2);
  assert.equal(cibleDe(etat, grenadier), 'casemate', 'il CHANGE de cible');
  assert.equal(trouver(etat, 'gangue').pvMilli, 975_000, 'et la Gangue ne reçoit plus rien');
});

// ---------------------------------------------------------------------------
// T7 — un seul prédicat
// ---------------------------------------------------------------------------

/** Retire commentaires de ligne et de bloc avant un balayage de code. */
function sansCommentaires(texte) {
  return texte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

test('T7 — « puis-je nuire » n\'a plus qu\'une seule réponse dans le moteur', () => {
  const code = sansCommentaires(readFileSync(join(RACINE, 'src', 'sim', 'combat.js'), 'utf8'));

  // peutNuire a disparu, jusqu'à son nom.
  assert.ok(!code.includes('peutNuire'), 'peutNuire subsiste');

  // Le prédicat est défini UNE fois.
  const definitions = code.match(/function degatsContre\s*\(/g) ?? [];
  assert.equal(definitions.length, 1, 'degatsContre doit être défini une seule fois');

  // La règle de réserve — le seul morceau du prédicat qui ne soit pas la
  // formule de dégâts — n'est écrite qu'une fois, dans degatsContre.
  const regleReserve = code.match(/genre === 'batiment' && e\.camp === 'attaque' && e\.reserve/g) ?? [];
  assert.equal(regleReserve.length, 1, 'la règle de réserve est dupliquée');

  // Et la formule de dégâts n'est appelée que deux fois : par le prédicat, et
  // par le franchissement des barrières — qui est un autre mécanisme, pas un
  // second prédicat de validité.
  const appels = code.match(/degatsDUnTir\(/g) ?? [];
  assert.equal(appels.length, 2, 'degatsDUnTir appelé ailleurs que par le prédicat');
  assert.ok(code.includes('degatsDeFranchissement'), 'le franchissement a bien sa propre fonction');

  // Le repli n'a plus de balayage à lui : il lit `aTire`, que l'étape 4 a posé.
  assert.ok(/function nuit\(e\)\s*\{\s*return e\.aTire;\s*\}/.test(code),
    'nuit() doit se réduire à aTire');
});

// ---------------------------------------------------------------------------
// T8 — monotonie
// ---------------------------------------------------------------------------

test('T8 — aucune entité ne reprend une cible abandonnée pour invalidité', () => {
  // Le prédicat est monotone : en combat les PV du tireur ne remontent jamais,
  // sa réserve non plus, et sa matrice est constante. Une cible devenue
  // invalide ne peut donc jamais redevenir valide — c'est ce qui autorise à ne
  // mémoriser aucun état supplémentaire. On le vérifie sur des raids entiers :
  // dès qu'un couple (tireur, cible) a été stérile une fois, le tireur ne doit
  // plus jamais élire cette cible.
  let couplesSteriles = 0;
  let reprises = 0;

  for (const { nom, montage } of balayage()) {
    const etat = creerCombat(montage);
    const invalides = new Set();
    while (!etat.termine) {
      tick(etat);
      for (const x of etat.entites) {
        if (!x.vivant || x.sorti || x.cibleIndice === null) continue;
        const c = etat.entites[x.cibleIndice];
        if (!c.vivant || c.sorti || tableDe(x) === null) continue;
        const cle = `${x.indice}→${c.indice}`;
        if (invalides.has(cle)) {
          reprises += 1;
          assert.fail(`${nom} tick ${etat.tick} : « ${x.id} » reprend « ${c.id} », déjà invalide`);
        }
      }
      // On enregistre APRÈS avoir vérifié : un couple devenu stérile en cours
      // de tick n'est pas une reprise, c'est l'état qui a changé sous lui.
      for (const x of etat.entites) {
        if (!x.vivant || x.sorti) continue;
        for (const c of etat.entites) {
          if (c.camp === x.camp || !c.vivant || c.sorti || tableDe(x) === null) continue;
          if (degatsAttendus(x, c) === 0) {
            const cle = `${x.indice}→${c.indice}`;
            if (!invalides.has(cle)) { invalides.add(cle); couplesSteriles += 1; }
          }
        }
      }
    }
  }
  assert.equal(reprises, 0);
  // Le test ne passe pas à vide : des couples deviennent bel et bien stériles.
  assert.ok(couplesSteriles > 100, `seulement ${couplesSteriles} couples stériles observés`);
});
