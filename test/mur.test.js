// LOT MUR — on s'arrête DEVANT le mur, et on ne flue plus DEDANS.
//
// Ethan, 10/09, deux points relevés le même jour et livrés ensemble :
//
//   2. « Un mur, tourelles, structure bloque. Donc une unité s'arrête avant,
//      pas dedans. Ou peut-être que la hitbox est mal faite ? »
//   3. « Une unité anti-structure doit s'arrêter pour détruire mur barrière
//      tourelles. C'est une cible de prédilection » — précisé : « les unités
//      anti-structure s'arrêtent devant les tourelles, les barbelés, les murs
//      et les bâtiments. Les bâtiments de toute façon c'est tout le monde. »
//
// ⚠⚠ LES DEUX MOITIÉS NE SE RECOUVRENT PAS, ET C'EST TOUT LE LOT. Le point 3
// tient les SIX unités dont la prédilection est `structureOuAviation` : elles
// sortent d'`avancer` par le `return` de l'arrêt, avant toute avance. Le point 2
// tient TOUTES LES AUTRES — celles qui restent bloquées devant le mur sans
// s'arrêter, parce qu'elles ne peuvent pas le blesser utilement : elles se
// rangent désormais sur leur case au lieu d'y fluer jusqu'à 999 millièmes.
// `MUR T1` et `MUR T2` gardent la première, `MUR T3` et `MUR T4` la seconde,
// `MUR T5` le piège qui les relie.
//
// ⚠ CE FICHIER NE REMPLACE PAS `arret.test.js` : celui-là garde l'HISTOIRE des
// trois arbitrages, du 04/09 au 10/09, montage par montage. Celui-ci garde la
// règle telle qu'elle est aujourd'hui, et il la garde sur le ROSTER ENTIER.

import test from 'node:test';
import assert from 'node:assert/strict';

import { creerCombat, tick } from '../src/sim/combat.js';
import { MILLI_PAR_CASE } from '../src/sim/grille.js';
import { DEFENSES, GRILLE, UNITES } from '../src/data/combat.js';

/** Un montage nu — la gangue lointaine donne au combat une raison de durer. */
const montage = (o) => ({
  niveau: 1,
  saveur: null,
  obstacles: [],
  batiments: [{ id: 'gangue', rangee: 18, colonne: 1 }],
  defenseurs: [],
  vagues: [[]],
  modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
  ...o,
});

const assaillants = (etat) => etat.entites.filter((e) => e.camp === 'attaque');
const assaillant = (etat) => {
  const e = assaillants(etat)[0];
  assert.ok(e !== undefined, 'montage : aucun assaillant');
  return e;
};
const parId = (etat, id) => etat.entites.find((e) => e.id === id);
const jouer = (etat, n) => { for (let i = 0; i < n; i += 1) tick(etat); };

/**
 * La colonne dominante d'une table de dégâts, recalculée depuis les DONNÉES
 * seules — l'oracle de `MUR T1` et `MUR T2`, et il ne doit rien devoir au
 * moteur. Rend `null` en cas d'ex æquo, comme `colonneDominante`.
 */
function predilectionDe(id) {
  const degats = UNITES[id].degats;
  const max = Math.max(...Object.values(degats));
  const tetes = Object.entries(degats).filter(([, v]) => v === max);
  return tetes.length === 1 ? tetes[0][0] : null;
}

const ANTI_STRUCTURE = Object.keys(UNITES)
  .filter((id) => predilectionDe(id) === 'structureOuAviation');
/**
 * ⚠⚠ LES SIX ANTI-STRUCTURE NE S'ARRÊTENT PAS TOUTES : LE FRAPPEUR EST UN
 * AÉRONEF `traversant`, ET `doitSArreter` L'ÉCARTE À SA PREMIÈRE LIGNE.
 * « L'aviation traversante ne s'arrête jamais » est antérieur au lot MUR et n'a
 * pas été touché : une pièce qui TRAVERSE le champ ne peut pas buter dessus. Le
 * partage se DÉDUIT du roster, il ne s'écrit pas — le jour où une anti-structure
 * de plus vole, elle se range du bon côté toute seule.
 */
const ARRETEES = ANTI_STRUCTURE.filter((id) => UNITES[id].comportementAerien !== 'traversant');
const TRAVERSANTES = ANTI_STRUCTURE.filter((id) => UNITES[id].comportementAerien === 'traversant');
const LES_AUTRES = Object.keys(UNITES)
  .filter((id) => predilectionDe(id) !== 'structureOuAviation');

/**
 * Une pièce seule face à un Merlon posé HORS de sa colonne — le montage qui
 * sépare l'ARRÊT du BLOCAGE.
 *
 * ⚠⚠ LE MUR EST EN COLONNE 6, L'UNITÉ EN 5, ET C'EST TOUT CE QUI REND LA MESURE
 * LISIBLE. Dans la colonne de l'unité, un Merlon la retiendrait de toute façon —
 * `peutAvancer` refuse la case occupée, et le rangement du point 2 la clouerait
 * sur la sienne. La colonne de l'unité étant LIBRE, rien ne peut la retenir sauf
 * `doitSArreter` : si elle ne bouge plus, c'est la règle et rien d'autre.
 */
function faceAuMerlon(id) {
  return creerCombat(montage({
    defenseurs: [{ id: 'merlon', rangee: 6, colonne: 6 }],
    vagues: [[{ id, colonne: 5 }]],
  }));
}

// ---------------------------------------------------------------------------
// MUR T1 — les six anti-structure s'arrêtent, et elles cassent
// ---------------------------------------------------------------------------

test('MUR T1 — les CINQ anti-structure NON traversantes s\'arrêtent devant un merlon, et le frappent', () => {
  // ⚠ LE COMPTE EST ASSERTÉ AVANT LA RÈGLE. Le bloc de `doitSArreter` écrit que
  // « `structureOuAviation` n'est la prédilection que de SIX unités du roster » :
  // si le roster en gagnait une septième, ce test la prendrait en silence et la
  // phrase deviendrait fausse sans que rien ne tombe.
  assert.deepEqual(
    ANTI_STRUCTURE,
    ['perceurs', 'fouisseurs', 'belier', 'pilon', 'frappeur', 'enclume'],
    'le roster anti-structure a changé : la prose de `doitSArreter` est à relire',
  );
  assert.equal(DEFENSES.merlon.type, 'mur', 'montage : le Merlon n\'est plus un mur');

  // ⚠ LE PARTAGE EST ASSERTÉ AVANT LA RÈGLE, POUR LA MÊME RAISON QUE LE
  // COMPTE : cinq s'arrêtent, une traverse, et la traversante est mesurée ICI —
  // `MUR T2` ne la couvre pas, elle EST anti-structure.
  assert.deepEqual(ARRETEES, ['perceurs', 'fouisseurs', 'belier', 'pilon', 'enclume']);
  assert.deepEqual(TRAVERSANTES, ['frappeur']);

  for (const id of ARRETEES) {
    const etat = faceAuMerlon(id);
    const e = assaillant(etat);
    const mur = () => parId(etat, 'merlon');

    // On joue jusqu'au premier TIR sur le mur, on ne l'écrit pas : les six n'ont
    // ni la même vitesse ni la même portée, donc pas le même tick.
    //
    // ⚠⚠ LA CONDITION EST `aTire`, PAS `cibleIndice`, ET LE FRAPPEUR L'A PROUVÉ.
    // `doitSArreter` exige `e.aTire` en tête : une pièce qui a ACQUIS le mur sans
    // avoir encore tiré dessus avance d'un tick de plus. Attendre la cible seule
    // relève donc un « gel » un tick trop tôt, et le Frappeur — 240 milli-cases
    // par tick, le plus rapide du roster — le fait voir : 5 360 relevé, 5 600
    // mesuré au tick suivant.
    let ticks = 0;
    while (!(e.aTire && e.cibleIndice !== null) && ticks < 400) { tick(etat); ticks += 1; }
    assert.equal(etat.entites[e.cibleIndice]?.id, 'merlon',
      `${id} : montage — le Merlon doit être tiré, vu en ${ticks} ticks`);

    // ⚠ LES DEUX MOITIÉS ENSEMBLE : figée SANS tirer serait un blocage, or rien
    // ne la bloque ici. Elle s'arrête, et elle travaille.
    //
    // ⚠ LA FENÊTRE S'ARRÊTE QUAND LE MUR TOMBE, ET C'EST NÉCESSAIRE : l'Enclume
    // le met à terre en moins de vingt ticks, et l'arrêt LÈVE avec sa cause —
    // une fenêtre fixe mesurerait alors la reprise, pas l'arrêt. On exige au
    // moins cinq ticks mesurés, faute de quoi la mesure ne dirait rien.
    const gel = e.rangeeMilli;
    const pvAvant = mur().pvMilli;
    let mesures = 0;
    while (mesures < 20 && mur().vivant) {
      tick(etat);
      mesures += 1;
      assert.equal(e.rangeeMilli, gel,
        `${id} : elle avance encore au tick ${mesures} de l'arrêt, mur debout`);
    }
    assert.ok(mesures >= 5, `${id} : ${mesures} tick(s) mesurés, le mur tombe trop vite`);
    assert.ok(mur().pvMilli < pvAvant, `${id} : elle est figée sans tirer, ce n'est pas un arrêt`);
    assert.equal(e.sorti, false, `${id} : elle s'est repliée devant le mur`);
    assert.equal(e.ticksInutiles, 0, `${id} : son compteur de repli est monté`);
  }

  // ⚠⚠ ET LA CONTRE-ÉPREUVE DE LA GARDE AÉRIENNE EST DANS LE MÊME MONTAGE. Le
  // Frappeur est anti-structure comme les cinq autres — même prédilection, même
  // mur, même colonne libre — et il NE s'arrête PAS : `doitSArreter` l'écarte à sa
  // première ligne. Sans cette moitié, retirer la garde `comportementAerien` ne
  // ferait tomber aucun test de ce fichier.
  for (const id of TRAVERSANTES) {
    const etat = faceAuMerlon(id);
    const e = assaillant(etat);
    const mur = () => parId(etat, 'merlon');
    let ticks = 0;
    while (!(e.aTire && e.cibleIndice !== null) && ticks < 400) { tick(etat); ticks += 1; }
    assert.equal(etat.entites[e.cibleIndice]?.id, 'merlon',
      `${id} : montage — le Merlon doit être tiré, vu en ${ticks} ticks`);

    // ⚠⚠ ELLE AVANCE À CHAQUE TICK, ET « ELLE FINIT PAR AVANCER » NE SUFFIT
    // PAS — MESURÉ. Le premier jet relevait la position dix ticks plus tard et
    // exigeait qu'elle ait monté : la falsification était MUETTE. Sans la garde
    // aérienne le Frappeur ne se FIGE pas, il RALENTIT — il s'arrête le temps
    // que le mur tienne, l'abat, et l'arrêt lève avec sa cause. 2 400
    // milli-cases sur dix ticks contre 960, et l'assertion passait des deux
    // côtés. La fenêtre est donc bornée par `mur().vivant`, comme celle des
    // cinq autres, et la mesure porte sur CHAQUE tick : six pas de 240 contre
    // six zéros.
    let mesures = 0;
    while (mesures < 20 && mur().vivant) {
      const avantLeTick = e.rangeeMilli;
      tick(etat);
      mesures += 1;
      assert.ok(e.rangeeMilli > avantLeTick,
        `${id} : une traversante s'arrête pour un mur au tick ${mesures} — la garde aérienne est tombée`);
    }
    assert.ok(mesures >= 5, `${id} : ${mesures} tick(s) mesurés, le mur tombe trop vite`);
  }
});

// ---------------------------------------------------------------------------
// MUR T2 — la contre-épreuve : les huit autres ne s'arrêtent pas
// ---------------------------------------------------------------------------

test('MUR T2 — aucune des HUIT autres unités ne s\'arrête devant le même merlon', () => {
  // ⚠⚠ SANS CE TEST, LE LOT POURRAIT AVOIR OUVERT L'ARRÊT À TOUT LE MONDE SANS
  // QU'ON LE SACHE. `MUR T1` passerait mot pour mot si `doitSArreter` rendait
  // `true` en tête : c'est celui-ci qui dit que la prédilection discrimine
  // encore, et il porte sur les HUIT, pas sur un échantillon.
  assert.equal(ANTI_STRUCTURE.length + LES_AUTRES.length, Object.keys(UNITES).length);
  assert.equal(LES_AUTRES.length, 8, 'le roster a changé : ce test ne couvre plus tout le reste');

  for (const id of LES_AUTRES) {
    const etat = faceAuMerlon(id);
    const e = assaillant(etat);

    // Trente ticks après l'acquisition — s'il y en a une —, elle a AVANCÉ. Les
    // aéronefs traversants ne visent même pas le mur : ils ne s'arrêtent pas
    // davantage, et la même assertion les couvre.
    let ticks = 0;
    while (e.cibleIndice === null && ticks < 200) { tick(etat); ticks += 1; }
    const depart = e.rangeeMilli;
    jouer(etat, 30);
    assert.ok(e.rangeeMilli > depart,
      `${id} : elle s'arrête pour un mur alors que sa prédilection est « ${predilectionDe(id)} »`);
  }
});

// ---------------------------------------------------------------------------
// MUR T3 — bloquée, elle est SUR sa case, au millième
// ---------------------------------------------------------------------------

test('MUR T3 — bloquée par un mur, l\'unité reste sur sa case au millième près', () => {
  // ⚠⚠ LE MUR EST DANS LA COLONNE, CETTE FOIS, ET L'UNITÉ N'EST PAS
  // ANTI-STRUCTURE : c'est le point 2 tout seul, sans le point 3. La Meute vise
  // l'infanterie ; le Merlon ne l'arrête pas, il la BLOQUE.
  const etat = creerCombat(montage({
    defenseurs: [{ id: 'merlon', rangee: 3, colonne: 5 }],
    vagues: [[{ id: 'meute', colonne: 5, rangee: 2 }]],
  }));
  const meute = assaillant(etat);
  assert.notEqual(predilectionDe('meute'), 'structureOuAviation',
    'montage : la Meute est devenue anti-structure, le test mesure l\'autre moitié');
  assert.equal(meute.rangeeMilli, 2 * MILLI_PAR_CASE, 'montage : elle ne part pas de sa case');

  // ⚠ LE SEUIL SE CALCULE, IL NE S'APPROXIME PAS. Sans le correctif, la Meute
  // fluait à l'intérieur de sa case jusqu'au plus grand `k` qui l'y laisse :
  // `2 000 + k × 60 < 3 000`, donc k = 16 et 2 960 — soit 96 % de la case du
  // mur, dessinés par-dessus lui. C'est le défaut d'Ethan, en un nombre.
  const vitesse = UNITES.meute.vitesse;
  const k = Math.floor((MILLI_PAR_CASE - 1) / vitesse);
  const avantLeLot = 2 * MILLI_PAR_CASE + k * vitesse;
  assert.equal(avantLeLot, 2960, 'le calcul du seuil d\'avant le lot a changé');

  jouer(etat, 60);
  assert.equal(meute.rangeeMilli % MILLI_PAR_CASE, 0, 'elle flue encore dans la case du mur');
  assert.equal(meute.rangeeMilli, 2 * MILLI_PAR_CASE);
  assert.notEqual(meute.rangeeMilli, avantLeLot);
  assert.equal(parId(etat, 'merlon').vivant, true, 'montage : le mur doit tenir la fenêtre');
  // Et elle n'est pas partie : rangée n'est pas repliée.
  assert.equal(meute.sorti, false, 'elle s\'est repliée : le rangement ne doit pas ouvrir le repli');
});

// ---------------------------------------------------------------------------
// MUR T4 — un embouteillage ALLIÉ ne range personne
// ---------------------------------------------------------------------------

test('MUR T4 — derrière une alliée bloquée, la suivante GARDE sa position intermédiaire', () => {
  // ⚠⚠ C'EST LA GARDE DU PÉRIMÈTRE, ET ELLE VAUT UNE MESURE : ranger l'entité
  // dès que la case devant est occupée — alliée comprise — déplace 1 041 champs
  // sur 1 600 des témoins de combat et 198 combats sur 200. Restreint aux
  // occupantes de `vitesseMilli === 0`, il en déplace 339. Sans ce test, un lot
  // futur élargirait le rangement à tout blocage sans voir ce qu'il casse.
  const etat = creerCombat(montage({
    defenseurs: [{ id: 'merlon', rangee: 4, colonne: 5 }],
    vagues: [[
      { id: 'meute', colonne: 5, rangee: 3 },
      { id: 'meute', colonne: 5, rangee: 2 },
    ]],
  }));
  const [devant, derriere] = assaillants(etat).sort((a, b) => b.rangeeMilli - a.rangeeMilli);
  assert.equal(devant.rangeeMilli, 3 * MILLI_PAR_CASE, 'montage : la première n\'est pas en 3');
  assert.equal(derriere.rangeeMilli, 2 * MILLI_PAR_CASE, 'montage : la seconde n\'est pas en 2');

  jouer(etat, 60);

  // Celle de DEVANT est bloquée par une structure immobile : elle se range.
  assert.equal(devant.rangeeMilli, 3 * MILLI_PAR_CASE,
    'la première ne s\'est pas rangée : le montage ne mesure rien');

  // Celle de DERRIÈRE est bloquée par une ALLIÉE, qui n'est pas immobile au sens
  // du lot — `vitesseMilli` non nul. Elle garde donc sa position intermédiaire.
  assert.notEqual(derriere.rangeeMilli % MILLI_PAR_CASE, 0,
    'la seconde a été rangée : le rangement a débordé sur un blocage ALLIÉ');
  assert.equal(derriere.rangeeMilli, 2960);
  assert.equal(derriere.sorti, false, 'la seconde s\'est repliée');
});

// ---------------------------------------------------------------------------
// MUR T5 — l'Écraseur ouvre encore la brèche, et il l'ouvre PLUS TÔT
// ---------------------------------------------------------------------------

test('MUR T5 — le porteur de l\'Écraseur force dès le tick où il se range', () => {
  // ⚠⚠⚠ C'EST LE TEST DU PIÈGE, ET IL DOUBLE `ARRÊT T7` CÔTÉ « CASE DEVANT ».
  // Une entité rangée sur sa case repart de `rangee × 1 000` : `caseDestination`
  // revaut `rangee` tant que la vitesse est sous 1 000 millièmes, et aucune ne
  // l'atteint. DEUX lectures en dépendent, et les deux tuent la brèche EN
  // SILENCE si on les laisse au `caseDestination` :
  //   — `structureForcee`, qui chercherait la structure SOUS l'entité et la
  //     refuserait sur `occupante.camp === e.camp` ;
  //   — `peutAvancer`, qui rend VRAI dès que `caseDestination === rangee`, si
  //     bien que `progresse` resterait vrai pour toujours et que le forçage ne
  //     serait même pas CALCULÉ.
  // Mesuré sur cette scène avec la seconde moitié oubliée : écart de forçage
  // ZERO sur cent-vingt ticks, et le Merlon debout. C'est ce que ce test
  // attrape.
  //
  // ⚠ LE FORÇAGE SE MESURE PAR DIFFÉRENCE, PAS PAR LECTURE : le Broyeur TIRE
  // aussi sur le mur. La seule façon d'isoler `structureForcee` est de rejouer
  // la même scène sans le module et de soustraire — même méthode qu'`ARRÊT T7`.
  const scene = (modules) => creerCombat(montage({
    defenseurs: [{ id: 'merlon', rangee: 6, colonne: 5 }],
    vagues: [[{ id: 'broyeur', colonne: 5 }]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: { offense: modules, defense: [] },
    },
  }));
  assert.equal(UNITES.broyeur.module, 'ecraseur', 'montage : le porteur n\'a plus l\'Écraseur');
  assert.notEqual(predilectionDe('broyeur'), 'structureOuAviation',
    'montage : le Broyeur est devenu anti-structure — il s\'arrêterait au lieu de buter');

  const avec = scene(['ecraseur']);
  const sans = scene([]);
  const unite = (etat) => assaillant(etat);
  const mur = (etat) => parId(etat, 'merlon');
  const pas = Math.floor(mur(avec).pvMaxMilli / 100);
  assert.equal(pas, 20_000, 'montage : les PV max du Merlon ont changé');

  // On joue jusqu'au tick où le porteur SE RANGE, on ne l'écrit pas.
  let precedente = -1;
  let rangement = 0;
  while (unite(avec).rangeeMilli !== precedente && rangement < 200) {
    precedente = unite(avec).rangeeMilli;
    tick(avec); tick(sans);
    rangement += 1;
  }
  assert.equal(unite(avec).rangeeMilli % MILLI_PAR_CASE, 0,
    'le porteur n\'est pas sur sa case : il flue encore dans le mur');
  assert.equal(unite(avec).rangeeMilli, 5 * MILLI_PAR_CASE);

  // ⚠⚠ ET LE FORÇAGE A DÉJÀ COMMENCÉ AU TICK DU RANGEMENT — c'est le cœur du
  // test. Avant le lot, le porteur fluait jusqu'au bord de sa case et le forçage
  // ne tombait qu'ensuite ; la « case devant » le rend disponible dès le premier
  // tick de blocage. Un écart nul ici, c'est le piège refermé sur le lot.
  const ecartAuRangement = mur(sans).pvMilli - mur(avec).pvMilli;
  assert.ok(ecartAuRangement > 0, 'le forçage n\'a pas commencé au tick du rangement');

  // Puis vingt ticks bloqués : l'écart croît d'EXACTEMENT 1 % des PV max par
  // tick. Le facteur est celui du NOMBRE de ticks joués, pas un nombre choisi.
  const bloques = 20;
  jouer(avec, bloques);
  jouer(sans, bloques);
  const ecart = mur(sans).pvMilli - mur(avec).pvMilli;
  assert.equal(ecart - ecartAuRangement, bloques * pas, `écart mesuré : ${ecart}`);

  // Et la conséquence, en clair : à 1 % des PV MAXIMAUX par tick, le forçage
  // seul abat le Merlon en cent ticks, quelle que soit sa taille.
  assert.equal(mur(avec).pvMaxMilli / pas, 100);
  assert.equal(unite(avec).rangeeMilli, 5 * MILLI_PAR_CASE, 'le porteur a bougé pendant le forçage');
  assert.equal(unite(avec).ticksInutiles, 0, 'le compteur de repli est monté alors qu\'il force');
});

// ---------------------------------------------------------------------------
// MUR T6 — le JUMEAU LATÉRAL : une défenseuse bloquée se range aussi
// ---------------------------------------------------------------------------

// ⚠⚠ SECOND GESTE DU LOT, ET IL VIENT D'ETHAN. Le premier jet n'a corrigé
// qu'`avancer`, donc le camp qui ATTAQUE ; la défense des DEUX camps passe par
// `seDecaler` depuis le lot COLONNE, et cette fonction-là portait EXACTEMENT le
// même défaut, tourné de quatre-vingt-dix degrés. Mesuré et porté au rapport,
// Ethan a tranché : « à corriger maintenant ».
//
// ⚠ LE MONTAGE EST LE MIROIR DE `MUR T3`, AXE POUR AXE : la défenseuse est en
// colonne 4, le merlon en colonne 5, et sa cible en colonne 8 — donc elle se
// décale vers la droite et le mur lui barre la route. Ce qui change d'avec T3,
// c'est que la pièce qui bouge est une DÉFENSEUSE : un attaquant ne change
// jamais de colonne, sa colonne est fixe.

/** Une défenseuse mobile qui se décale vers un assaillant, et ce qui la gêne. */
function faceAuBlocageLateral(idGene) {
  return creerCombat(montage({
    defenseurs: [
      { id: idGene, rangee: 3, colonne: 5 },
      { id: 'meute', rangee: 3, colonne: 4 },
    ],
    vagues: [[{ id: 'meute', colonne: 8 }]],
  }));
}

/** La défenseuse du montage — celle de la colonne 4, jamais le gêneur. */
const decaleuse = (etat) => etat.entites.find(
  (e) => e.camp !== 'attaque' && e.id === 'meute' && caseColonneDe(e) === 4,
);
const caseColonneDe = (e) => Math.floor(e.colonneMilli / MILLI_PAR_CASE);

test('MUR T6 — bloquée LATÉRALEMENT par un mur, la défenseuse reste sur sa case au millième', () => {
  const etat = faceAuBlocageLateral('merlon');
  const d = decaleuse(etat);
  assert.ok(d !== undefined, 'montage : la défenseuse est introuvable');
  assert.equal(d.colonneMilli, 4 * MILLI_PAR_CASE, 'montage : elle ne part pas de sa case');
  assert.equal(DEFENSES.merlon.vitesse ?? 0, 0, 'montage : le Merlon s\'est mis à bouger');
  // ⚠⚠ LA RANGÉE ET LA COLONNE DOIVENT DIFFÉRER, ET CE N'EST PAS UNE COQUETTERIE
  // DE MONTAGE. `structureImmobileSur` prend `(rangee, colonne)` dans cet ordre ;
  // le premier jet posait tout en rangée 5 ET colonne 5, si bien qu'INTERVERTIR
  // les deux arguments ne changeait rien et que la falsification était MUETTE.
  // Mesuré, puis corrigé : rangée 3, colonne 4.
  assert.notEqual(caseColonneDe(d), Math.floor(d.rangeeMilli / MILLI_PAR_CASE),
    'montage dégénéré : rangée et colonne égales, une inversion d\'arguments passerait');

  // ⚠ LE SEUIL SE CALCULE, IL NE S'APPROXIME PAS — même règle qu'en `MUR T3`.
  // La vitesse LATÉRALE vaut les deux tiers de la vitesse, tronqués : la Meute
  // va à 60, donc 40 de côté. Sans le correctif, elle fluait jusqu'au plus grand
  // `k` qui la laisse dans sa case — `4 000 + k × 40 < 5 000`, donc k = 24 et
  // **4 960**, soit 96 % de la case du merlon. C'est le MÊME 960 millièmes que
  // le Meute à la verticale, et c'est ce qui dit que les deux défauts n'en font
  // qu'un.
  const { numerateur, denominateur } = GRILLE.lateral;
  const pas = Math.floor((UNITES.meute.vitesse * numerateur) / denominateur);
  assert.equal(pas, 40, 'la vitesse latérale de la Meute a changé');
  const k = Math.floor((MILLI_PAR_CASE - 1) / pas);
  const avantLeLot = 4 * MILLI_PAR_CASE + k * pas;
  assert.equal(avantLeLot, 4960, 'le calcul du seuil d\'avant le second geste a changé');

  jouer(etat, 60);
  assert.equal(d.colonneMilli % MILLI_PAR_CASE, 0, 'elle flue encore dans la case du mur');
  assert.equal(d.colonneMilli, 4 * MILLI_PAR_CASE);
  assert.notEqual(d.colonneMilli, avantLeLot);
  assert.equal(parId(etat, 'merlon').vivant, true, 'montage : le mur doit tenir la fenêtre');
  // ⚠ ET ELLE NE CHANGE PAS DE CASE : le rangement remet la POSITION sur le
  // multiple exact, il ne déplace pas la pièce d'une case. L'occupation ne bouge
  // donc pas, et rien de ce que le moteur indexe par case n'est touché.
  assert.equal(caseColonneDe(d), 4, 'elle a changé de case : le rangement doit être un recadrage');
});

// ---------------------------------------------------------------------------
// MUR T6 bis — le PÉRIMÈTRE : devant une alliée MOBILE, elle garde sa position
// ---------------------------------------------------------------------------

test('MUR T6 bis — gênée par une alliée MOBILE, la défenseuse GARDE sa position intermédiaire', () => {
  // ⚠⚠ C'EST LE PENDANT LATÉRAL DE `MUR T4`, ET IL GARDE LE PÉRIMÈTRE. On ne se
  // range que devant une STRUCTURE IMMOBILE : Ethan nomme « un mur, tourelles,
  // structure », et les trois sont à `vitesseMilli === 0`. Devant une alliée
  // MOBILE, la case se libérera d'elle-même, et ranger lui coûterait à chaque
  // fois les millièmes qu'elle vient de gagner — c'est très exactement le prix
  // que `combat.test.js` mesure à la verticale, 960 millièmes rendus.
  //
  // ⚠ SANS CE TEST, ÉLARGIR LE RANGEMENT À TOUT BLOCAGE PASSERAIT INAPERÇU.
  // `MUR T6` seul serait vert, et tout embouteillage de colonne se mettrait à
  // claquer sur les deux cents témoins.
  // ⚠⚠ LE GÊNEUR EST UNE CARAPACE, ET LE MONTAGE A DÛ ÊTRE REPRIS APRÈS MESURE.
  // Le premier jet prenait un Guetteur : MOBILE, mais il vise l'infanterie comme
  // la décaleuse, donc il se décale LUI AUSSI vers le même assaillant, libère la
  // case, et la décaleuse la franchit — 5 920 mesuré, et le test ne disait plus
  // rien du périmètre. La Carapace vise les VÉHICULES : face à un assaut
  // d'infanterie, `cibleDuDecalage` ne lui rend personne et elle ne bouge pas
  // d'un millième. **Un gêneur qui s'écarte ne gêne rien.**
  const etat = faceAuBlocageLateral('carapace');
  const d = decaleuse(etat);
  assert.ok(d !== undefined, 'montage : la défenseuse est introuvable');
  const geneur = etat.entites.find((e) => e.camp !== 'attaque' && e.id === 'carapace');
  assert.ok(geneur !== undefined, 'montage : le gêneur est introuvable');
  assert.ok(UNITES.carapace.vitesse > 0, 'montage : le gêneur doit être MOBILE');
  assert.notEqual(predilectionDe('carapace'), predilectionDe('meute'),
    'montage : le gêneur vise la même chose que la décaleuse, il va s\'écarter');

  const { numerateur, denominateur } = GRILLE.lateral;
  const pas = Math.floor((UNITES.meute.vitesse * numerateur) / denominateur);
  const k = Math.floor((MILLI_PAR_CASE - 1) / pas);
  const attendu = 4 * MILLI_PAR_CASE + k * pas;

  jouer(etat, 60);
  // ⚠ LE GÊNEUR N'A PAS BOUGÉ — sans quoi la mesure porterait sur autre chose.
  assert.equal(geneur.colonneMilli, 5 * MILLI_PAR_CASE,
    'montage : le gêneur s\'est décalé, il ne gêne plus');
  assert.equal(d.colonneMilli, attendu,
    'la défenseuse s\'est rangée devant une alliée mobile : le rangement déborde de son périmètre');
  assert.notEqual(d.colonneMilli % MILLI_PAR_CASE, 0);
  assert.equal(caseColonneDe(d), 4, 'elle a franchi la case de son alliée');
});
