// L'arbre de recherche : la table, le moteur d'achat, la migration.
//
// C'est le lot qui déplace la porte. Jusqu'ici, ce que le joueur pouvait poser
// dépendait du niveau du bâtiment commandant ; désormais cela dépend de ce qu'il
// a acheté, et de rien d'autre. Les tests suivent l'ordre du brief : la table,
// puis le moteur, puis la migration.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ARBRE_RECHERCHE, BRANCHES, SPECIAL, gratuitesDe } from '../src/data/recherche.js';
import { MODULES, moduleEstCable } from '../src/data/modules.js';
import { UNITES, DEFENSES } from '../src/data/combat.js';
import { creerCombat, tick, resoudre, pointsRecherche } from '../src/sim/combat.js';
import { rosterDefensif } from '../src/data/couts-militaires.js';
import {
  creerAcquises, estAcquise, moduleEstAcquis, nomDuModule, coutMilli,
  problemesDeLAchat, acheter, acquisesDe, modulesDebloquesDuJoueur,
} from '../src/sim/recherche.js';
import {
  creerEtat, rattraperJeu, serialiser, charger, migrer, SAVE_VERSION, niveauDeCommandement,
  poser as poserBatiment,
} from '../src/sim/state.js';
import { bilan as bilanArmee, arsenalVide } from '../src/ui/arsenal.js';
import { bilan as bilanDefense, defenseVide, defensesDisponibles } from '../src/ui/defense.js';

/** Un état neuf, migré au format courant, avec un compteur qu'on peut charger. */
function partie(pointsMilli = '0') {
  const etat = creerEtat(2026);
  etat.recherche.pointsMilli = pointsMilli;
  return etat;
}

// ---------------------------------------------------------------------------
// T1 — T3bis : la table
// ---------------------------------------------------------------------------

test('T1 — l\'arbre couvre le roster offensif, dans les deux sens', () => {
  const arbre = Object.keys(ARBRE_RECHERCHE.offense).sort();
  const roster = Object.keys(UNITES).sort();
  assert.deepEqual(arbre, roster, 'l\'arbre offensif et le roster divergent');
  // MESURÉ : 14 des deux côtés. Un `deepEqual` sur deux listes vides passerait ;
  // le compte interdit ce vide.
  assert.equal(roster.length, 14, `${roster.length} unités, 14 attendues`);
});

test('T2 — l\'arbre couvre le roster défensif, dans les deux sens', () => {
  const arbre = Object.keys(ARBRE_RECHERCHE.defense).sort();
  // ⚠ DEUX LECTURES INDÉPENDANTES DU ROSTER DÉFENSIF, et c'est voulu :
  // `rosterDefensif` (données) et `aUnRoleDefensif` (écran) doivent dire la même
  // chose. Le jour où une pièce gagne un rôle défensif sans gagner un prix, ce
  // test tombe — c'est exactement la garde demandée au §3.1 du brief.
  const parDonnees = rosterDefensif().sort();
  const parEcran = defensesDisponibles(null).sort();
  assert.deepEqual(arbre, parDonnees, 'l\'arbre défensif et `rosterDefensif` divergent');
  assert.deepEqual(arbre, parEcran, 'l\'arbre défensif et `aUnRoleDefensif` divergent');
  assert.equal(arbre.length, 17, `${arbre.length} pièces défensives, 17 attendues`);
});

test('T3 — aucune entrée de l\'arbre n\'est une pièce sans module', () => {
  // Après les deux corrections du §3.3, les 14 offensives et les 17 défensives
  // ont TOUTES un module. Ce test tombe le jour où quelqu'un vide un module dans
  // `data/combat.js` sans retirer son prix de l'arbre — le joueur paierait alors
  // pour un module qui n'existe pas.
  const sans = [];
  for (const branche of BRANCHES) {
    for (const id of Object.keys(ARBRE_RECHERCHE[branche])) {
      if (nomDuModule(branche, id) === null) sans.push(`${branche}/${id}`);
    }
  }
  assert.deepEqual(sans, [], `pièces avec un prix de module mais sans module : ${sans.join(' ')}`);
  // Et le compte, pour que l'absence de trou ne soit pas une absence de boucle.
  assert.equal(
    Object.keys(ARBRE_RECHERCHE.offense).length + Object.keys(ARBRE_RECHERCHE.defense).length,
    31, 'l\'arbre n\'a plus 14 + 17 lignes',
  );
});

test('T3bis — la table des modules et les données se recouvrent, dans les deux sens', () => {
  const cites = new Set();
  const inconnus = [];
  const citer = (m, ou) => {
    if (!m) return;
    cites.add(m);
    if (MODULES[m] === undefined) inconnus.push(`${ou} → ${m}`);
  };
  for (const [id, u] of Object.entries(UNITES)) {
    citer(u.module, `unité ${id}`);
    citer(u.moduleOuvrage, `unité ${id} (ouvrage)`);
    citer(u.defense?.module, `unité ${id} (défense)`);
  }
  for (const [id, d] of Object.entries(DEFENSES)) {
    citer(d.moduleJoueur, `défense ${id} (joueur)`);
    citer(d.moduleOuvrage, `défense ${id} (ouvrage)`);
  }
  assert.deepEqual(inconnus, [], `modules cités et non définis : ${inconnus.join(' ; ')}`);

  // ⚠ LE SENS INVERSE EST CELUI QUI ATTRAPE UN RENOMMAGE RATÉ. Si `fumigene`
  // survivait quelque part, `flashbang` ne serait plus cité et cette assertion
  // le dirait — alors que la première passerait, `fumigene` étant absent de
  // MODULES… non : elle tomberait aussi. Les deux ensemble ne laissent rien.
  const jamaisCites = Object.keys(MODULES).filter((m) => !cites.has(m));
  assert.deepEqual(jamaisCites, [], `modules définis et jamais cités : ${jamaisCites.join(' ')}`);
  assert.equal(Object.keys(MODULES).length, 14, 'le glossaire des modules a changé de taille');
  assert.ok(MODULES.flashbang !== undefined, '« flashbang » a disparu de la table');
  assert.equal(MODULES.fumigene, undefined, '« fumigene » est revenu dans la table');
});

test('recherche — l\'onglet Spécial est déclaré et sans mécanique', () => {
  assert.equal(Object.keys(SPECIAL).length, 4, 'l\'onglet Spécial n\'a plus quatre lignes');
  // ⚠ `cout: null` DIT « le classeur n'a pas retenu de prix », pas « gratuit ».
  // Un zéro se lirait « à prendre », et l'écran l'afficherait comme tel.
  const sansPrix = Object.keys(SPECIAL).filter((k) => SPECIAL[k].cout === null);
  assert.deepEqual(sansPrix.sort(),
    ['soutienAntiAerien', 'soutienAntiInfanterie', 'soutienAntiVehicule']);
  assert.equal(SPECIAL.deuxiemeBase.cout, 2000000);
});

// ---------------------------------------------------------------------------
// T7 — T11 : le moteur d'achat
// ---------------------------------------------------------------------------

test('recherche — les gratuites sont acquises à la création, et elles seules', () => {
  const neuf = creerAcquises();
  assert.deepEqual(neuf.acquises.offense, ['busard', 'meute', 'ratisseur']);
  assert.deepEqual(neuf.acquises.defense, ['casemate', 'merlon', 'meute']);
  assert.deepEqual(neuf.modules, { offense: [], defense: [] });
  // Et elles correspondent bien aux lignes à prix nul de la table.
  for (const branche of BRANCHES) {
    assert.deepEqual([...gratuitesDe(branche)].sort(), neuf.acquises[branche]);
  }
  // MESURÉ : trois de chaque côté. Un état neuf qui n'en aurait aucune
  // laisserait le joueur sans rien à poser au premier écran.
  assert.equal(neuf.acquises.offense.length, 3);
  assert.equal(neuf.acquises.defense.length, 3);
});

test('T7 — le facteur mille : 12 499 999 milli-points n\'achètent pas 12 500 points', () => {
  const juste = partie('12499999');
  const pb = problemesDeLAchat(juste, 'offense', 'belier', 'unite');
  assert.equal(pb.length, 1, `refus attendu, obtenu : ${JSON.stringify(pb)}`);
  assert.equal(pb[0].code, 'pointsInsuffisants');
  // Le manque est arrondi au point supérieur : il manque 1 milli-point, donc
  // « 1 point ». Annoncer « 0 » bloquerait le joueur sans rien lui dire.
  assert.equal(pb[0].message, 'il manque 1 point');

  const pile = partie('12500000');
  assert.deepEqual(problemesDeLAchat(pile, 'offense', 'belier', 'unite'), []);
  acheter(pile, 'offense', 'belier', 'unite');
  assert.ok(estAcquise(pile, 'offense', 'belier'));
  assert.equal(pile.recherche.pointsMilli, '0');

  // ⚠ CE QUI FALSIFIERAIT CE TEST : une comparaison qui oublie le ×1000. Elle
  // achèterait au premier cas, et la première assertion tomberait.
  assert.equal(coutMilli('offense', 'belier', 'unite'), 12500000n);
});

test('T8 — pas de `Number` sur le compteur : un total hors entier sûr reste exact', () => {
  const enorme = (BigInt(Number.MAX_SAFE_INTEGER) * 1000n + 7n).toString();
  const etat = partie(enorme);
  assert.notEqual(Number(enorme).toString(), enorme, 'montage sans mordant : ce total tient en Number');

  acheter(etat, 'offense', 'belier', 'unite');
  assert.equal(etat.recherche.pointsMilli, (BigInt(enorme) - 12500000n).toString());
  // Le dernier chiffre est celui qui tombe le premier si un `Number` s'est
  // glissé sur le chemin : il vaut 7, il doit valoir 7.
  assert.ok(etat.recherche.pointsMilli.endsWith('7'), etat.recherche.pointsMilli);

  // Et il traverse la sauvegarde sans perdre un chiffre.
  const recharge = charger(serialiser(etat, 3_000_000), 3_000_000);
  assert.equal(recharge.recherche.pointsMilli, etat.recherche.pointsMilli);
  assert.deepEqual(acquisesDe(recharge, 'offense'), acquisesDe(etat, 'offense'));
});

test('T9 — deux branches, deux prix : le Chasseur s\'achète des deux côtés', () => {
  assert.equal(coutMilli('defense', 'fendeur', 'unite'), 135000000n);
  assert.equal(coutMilli('offense', 'fendeur', 'unite'), 300000000n);

  const etat = partie('135000000');
  acheter(etat, 'defense', 'fendeur', 'unite');
  assert.ok(estAcquise(etat, 'defense', 'fendeur'), 'le Chasseur défensif devrait être acquis');
  assert.equal(estAcquise(etat, 'offense', 'fendeur'), false,
    'acheter en défense a ouvert l\'offense — les deux listes n\'en font qu\'une');

  // Et le second achat coûte son propre prix, pas la différence.
  const pb = problemesDeLAchat(etat, 'offense', 'fendeur', 'unite');
  assert.equal(pb[0].code, 'pointsInsuffisants');
  // ⚠ L'ESPACE DES MILLIERS EST UNE FINE INSÉCABLE, U+202F, écrite ici en
  // ÉCHAPPEMENT. Tapée au clavier elle se confond avec une espace ordinaire, et
  // le test passerait ou tomberait selon l'éditeur qui a enregistré le fichier.
  assert.equal(pb[0].message, `il manque 300\u202f000 points`);

  // Le doublon est refusé, dans la branche où l'achat a eu lieu.
  etat.recherche.pointsMilli = '999999999999';
  assert.equal(problemesDeLAchat(etat, 'defense', 'fendeur', 'unite')[0].code, 'dejaAcquise');
});

test('T10 — le module exige son unité, même avec assez de points', () => {
  const etat = partie('999999999999999');
  assert.equal(estAcquise(etat, 'offense', 'pilon'), false, 'montage : l\'Obusier ne doit pas être acquis');
  const pb = problemesDeLAchat(etat, 'offense', 'pilon', 'module');
  assert.equal(pb[0].code, 'uniteNonAcquise', `obtenu : ${JSON.stringify(pb)}`);
  assert.ok(pb.every((p) => p.code !== 'pointsInsuffisants'),
    'montage sans mordant : ce refus-là aurait pu venir du prix');
  assert.throws(() => acheter(etat, 'offense', 'pilon', 'module'), /avant son module/);

  // L'unité achetée, il ne reste que le refus de câblage — la preuve que la
  // porte s'est bien ouverte.
  acheter(etat, 'offense', 'pilon', 'unite');
  const apres = problemesDeLAchat(etat, 'offense', 'pilon', 'module');
  assert.deepEqual(apres.map((p) => p.code), ['effetNonCable']);
});

test('T11 — un module non câblé ne se vend pas, même unité acquise et points en poche', () => {
  const etat = partie('999999999999999');
  const nonCables = [];
  for (const branche of BRANCHES) {
    for (const id of Object.keys(ARBRE_RECHERCHE[branche])) {
      const nom = nomDuModule(branche, id);
      if (moduleEstCable(nom)) continue;
      nonCables.push(`${branche}/${id}`);
      if (!estAcquise(etat, branche, id)) acheter(etat, branche, id, 'unite');
      const codes = problemesDeLAchat(etat, branche, id, 'module').map((p) => p.code);
      assert.deepEqual(codes, ['effetNonCable'], `${branche}/${id} : ${codes.join(',')}`);
    }
  }
  // MESURÉ : 29 lignes sur 31 portent un module non câblé — seuls le Fendeur et
  // le Broyeur en offense portent l'Écraseur, le seul câblé du dépôt.
  assert.equal(nonCables.length, 29, `${nonCables.length} lignes non câblées, 29 attendues`);

  // ⚠ CE QUI FALSIFIERAIT CE TEST : passer `cable: true` sur `flashbang`. Les
  // lignes de la Meute et du Bélier cesseraient de rendre `effetNonCable`, et
  // le compte tomberait. Le contre-cas est ici, en dur : l'Écraseur PASSE.
  const cable = partie('999999999999999');
  acheter(cable, 'offense', 'fendeur', 'unite');
  assert.deepEqual(problemesDeLAchat(cable, 'offense', 'fendeur', 'module'), []);
  acheter(cable, 'offense', 'fendeur', 'module');
  assert.ok(moduleEstAcquis(cable, 'offense', 'fendeur'));
  assert.deepEqual(modulesDebloquesDuJoueur(cable), ['ecraseur']);
});

test('recherche — les refus de programme lèvent, les refus de jeu se disent', () => {
  const etat = partie('0');
  // Branche et « quoi » inconnus : fautes de PROGRAMME, elles lèvent.
  assert.throws(() => problemesDeLAchat(etat, 'milieu', 'meute', 'unite'), /branche inconnue/);
  assert.throws(() => problemesDeLAchat(etat, 'offense', 'meute', 'tourelle'), /n'est ni/);
  // Pièce inconnue : une sauvegarde trafiquée peut la produire, elle se DIT.
  const pb = problemesDeLAchat(etat, 'offense', 'dragon', 'unite');
  assert.deepEqual(pb.map((p) => p.code), ['inconnue']);
  // Un état non migré se signale au lieu de répondre faux.
  assert.throws(() => estAcquise({ recherche: { pointsMilli: '0' } }, 'offense', 'meute'),
    /sauvegarde non migrée/);
});

// ---------------------------------------------------------------------------
// T6 : la migration
// ---------------------------------------------------------------------------

test('T6 — la migration v13 → v14 ne verrouille rien de ce qui est déjà posé', () => {
  // Une partie où le joueur a monté ses deux QG et posé ce que l'ANCIENNE règle
  // autorisait : `apparition <= niveau`.
  const etat = creerEtat(2026);
  rattraperJeu(etat, 3001);
  // Une base neuve ne porte que le Chantier : on pose les deux commandants par
  // le VRAI chemin, puis on les monte. Les poser à la main dans `disposition`
  // produirait une base que `charger` refuserait plus bas.
  poserBatiment(etat, 'centreDeCommandement', 14, 1);
  poserBatiment(etat, 'qgDeDefense', 14, 3);
  for (const id of ['chantierDeConstruction', 'centreDeCommandement', 'qgDeDefense']) {
    const b = etat.disposition.find((x) => x.id === id);
    assert.ok(b, `montage : ${id} absent de la disposition`);
    b.niveau = 12;
  }
  const nOff = niveauDeCommandement(etat, 'armee');
  const nDef = niveauDeCommandement(etat, 'garnison');
  assert.equal(nOff, 12);
  assert.equal(nDef, 12);

  // Ce que l'ancienne règle ouvrait, et qui n'est PAS gratuit aujourd'hui.
  const ouvertesJadis = Object.keys(UNITES).filter((id) => UNITES[id].apparition <= nOff);
  const payantes = ouvertesJadis.filter((id) => ARBRE_RECHERCHE.offense[id].unite > 0);
  assert.ok(payantes.length >= 4,
    `montage sans mordant : seulement ${payantes.length} pièce(s) payante(s) à ce niveau`);
  for (let i = 0; i < payantes.length && i < 6; i += 1) {
    etat.armee.push({ id: payantes[i], vague: 1, colonne: i + 1, niveau: 1, degatsMilli: 0 });
  }
  const rangee = 4; // bande de défense : rangées 3 à 10
  const defPayantes = Object.keys(ARBRE_RECHERCHE.defense)
    .filter((id) => (DEFENSES[id] ?? UNITES[id]).apparition <= nDef
      && ARBRE_RECHERCHE.defense[id].unite > 0);
  assert.ok(defPayantes.length >= 3, `montage sans mordant : ${defPayantes.length} défense(s) payante(s)`);
  for (let i = 0; i < defPayantes.length && i < 3; i += 1) {
    etat.garnison.push({ id: defPayantes[i], rangee, colonne: i + 2, niveau: 1, degatsMilli: 0 });
  }

  // On rétrograde la sauvegarde en v13 : compteur seul, pas d'acquises.
  const v13 = JSON.parse(serialiser(etat, 2_000_000));
  v13.version = 13;
  v13.recherche = { pointsMilli: '4242' };

  const migre = migrer(v13);
  assert.equal(migre.version, SAVE_VERSION);
  assert.equal(migre.version, 14);
  assert.equal(migre.recherche.pointsMilli, '4242', 'la migration a touché au compteur');
  assert.deepEqual(migre.recherche.modules, { offense: [], defense: [] },
    'la migration a offert des modules que le joueur n\'a jamais achetés');

  // ⚠ LE CŒUR DU TEST : rien de ce qui était posé n'est devenu illégal.
  const charge = charger(JSON.stringify(migre), 2_000_000);

  // ⚠ LA GRILLE DE L'ÉDITEUR EST REMPLIE À LA MAIN, ET C'EST OBLIGÉ ICI :
  // `poser` REFUSE ce qui n'est pas ouvert, donc y passer masquerait le défaut
  // qu'on cherche. Ce qu'on mesure, c'est ce que `bilan` dit d'une composition
  // DÉJÀ FAITE — exactement la situation d'un joueur qui recharge sa partie.
  const remplirArmee = (acquises) => {
    const g = arsenalVide(nOff, acquises);
    for (const p of charge.armee) g.cases[p.vague - 1][p.colonne - 1] = p.id;
    return g;
  };
  assert.deepEqual(bilanArmee(remplirArmee(acquisesDe(charge, 'offense'))).verrouillees, [],
    'la migration a verrouillé des unités déjà posées');

  const garn = defenseVide(nDef, [], acquisesDe(charge, 'defense'));
  for (const p of charge.garnison) garn.cases[p.rangee - 3][p.colonne - 1] = p.id;
  assert.deepEqual(bilanDefense(garn).verrouilles, [],
    'la migration a verrouillé des défenses déjà posées');

  // ⚠ CE QUI FALSIFIERAIT CE TEST : une migration qui ne pose que les gratuites.
  // Les deux listes ci-dessus deviendraient non vides — on le vérifie ici même,
  // avec le même montage et les seules gratuites. Sans cette contre-épreuve, un
  // `deepEqual` avec une liste vide passerait aussi sur une grille vide.
  const maigre = bilanArmee(remplirArmee(gratuitesDe('offense'))).verrouillees;
  assert.ok(maigre.length > 0,
    'montage sans mordant : même les gratuites suffisaient à tout garder légal');
  assert.equal(maigre.length, charge.armee.filter(
    (p) => !gratuitesDe('offense').includes(p.id),
  ).length, 'la contre-épreuve ne verrouille pas ce qu\'elle devrait');
});

// ---------------------------------------------------------------------------
// T12 — T13 : l'Écraseur, le seul module câblé
// ---------------------------------------------------------------------------

/**
 * Un combat d'un Fendeur contre UNE structure plantée en travers de sa colonne,
 * avec un bâtiment derrière pour que le combat ne s'arrête pas au premier tick.
 */
function duel(structure, avecEcraseur, attaquant = 'fendeur') {
  return creerCombat({
    niveau: 1,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 15, colonne: 5, niveau: 1 }],
    defenseurs: [{ id: structure, rangee: 5, colonne: 5, niveau: 1 }],
    vagues: [[{ id: attaquant, colonne: 5, niveau: 1 }]],
    modulesDebloques: { ouvrage: [], joueur: avecEcraseur ? ['ecraseur'] : [] },
  });
}

/**
 * Les PV de la structure ET ceux de l'attaquant, tick par tick — indice 0 =
 * avant le tick 1.
 *
 * ⚠ LES PV DE L'ATTAQUANT SERVENT DE FENÊTRE DE MESURE, ET C'EST NÉCESSAIRE.
 * Le lot 2A a câblé « plus une unité subit de dégâts, moins elle tape fort » :
 * dès que la structure forcée riposte, les deux combats divergent AUSSI par ce
 * canal-là, et la différence de PV cesse d'être le seul forçage. MESURÉ sur la
 * Casemate : 10 010 milli-PV d'écart au tick 39 au lieu de 10 000. On ne compare
 * donc que tant que l'attaquant est dans le MÊME état des deux côtés.
 */
function pvParTick(structure, avecEcraseur, attaquant, max = 400) {
  const etat = duel(structure, avecEcraseur, attaquant);
  const cible = etat.entites.find((e) => e.id === structure);
  const assaillant = etat.entites.find((e) => e.camp === 'attaque');
  const serie = [cible.pvMilli];
  const assaut = [assaillant.pvMilli];
  for (let t = 1; t <= max; t += 1) {
    tick(etat);
    serie.push(cible.pvMilli);
    assaut.push(assaillant.pvMilli);
    if (etat.termine) break;
  }
  return { pvMax: cible.pvMaxMilli, serie, assaut };
}

test('T12 — l\'Écraseur retire 1 % des PV MAXIMAUX par tick, soit 100 ticks quelle que soit la taille', () => {
  // ⚠⚠ ÉCART AU BRIEF, ET C'EST UN TEST PLUS FORT, PAS PLUS FAIBLE. Le brief
  // proposait « avec le module, le Merlon tombe en 100 ticks ; sans, il tient ».
  // MESURÉ : c'est faux des deux côtés — le Fendeur TIRE aussi sur le mur, donc
  // avec le module il tombe au tick 91 et sans le module au tick 206. Aucun
  // attaquant du roster n'a 0 dégât contre une structure, et `reserve: 0` ne
  // traverse pas `creerCombat` : le tir ne peut pas être annulé par un montage.
  //
  // Ce test isole donc la contribution DU MODULE par la DIFFÉRENCE entre deux
  // combats identiques à la graine près. Cette différence est le forçage, et
  // rien d'autre. Elle prouve les deux choses que le brief voulait prouver :
  // l'incrément vaut 1 % des PV MAXIMAUX, et il faudrait exactement 100 ticks
  // pour abattre le Merlon (2 000 PV) COMME la Casemate (1 000 PV).
  // ⚠ LA FENÊTRE DE MESURE DIFFÈRE, ET C'EST LA STRUCTURE QUI LA DICTE. Le
  // Merlon est un MUR : il ne riposte pas, l'attaquant reste identique des deux
  // côtés, et le forçage se mesure sur 57 ticks d'affilée. La Casemate est une
  // TOURELLE : elle tire dès le premier tick de blocage, la rétroaction du lot
  // 2A brouille l'écart au tick suivant, et il ne reste qu'UN tick propre. Ce
  // tick-là suffit à ce qu'il faut prouver — 20 000 milli-PV pour le Merlon
  // contre 10 000 pour la Casemate, soit le MÊME pourcentage de PV maximaux.
  for (const [structure, pv, fenetreMin] of [['merlon', 2000, 20], ['casemate', 1000, 1]]) {
    const avec = pvParTick(structure, true);
    const sans = pvParTick(structure, false);
    assert.equal(avec.pvMax, pv * 1000, `${structure} : PV max inattendus`);
    const pas = Math.floor(avec.pvMax / 100);

    // Le forçage commence quand l'unité se fait bloquer, et pas avant.
    let debut = null;
    let increments = 0;
    for (let t = 1; t < Math.min(avec.serie.length, sans.serie.length); t += 1) {
      if (avec.serie[t] === 0) break; // au-delà, les deux combats divergent
      // ⚠ FENÊTRE DE MESURE : tant que l'attaquant est identique des deux
      // côtés. Au-delà, la boucle de rétroaction du lot 2A brouille l'écart.
      if (avec.assaut[t] !== sans.assaut[t]) break;
      const ecart = sans.serie[t] - avec.serie[t];
      const precedent = sans.serie[t - 1] - avec.serie[t - 1];
      if (ecart === precedent) continue;
      if (debut === null) debut = t;
      increments += 1;
      assert.equal(ecart - precedent, pas,
        `${structure} : au tick ${t}, le forçage retire ${ecart - precedent} et non ${pas}`);
    }
    assert.equal(debut, 34, `${structure} : le forçage commence au tick ${debut}`);
    assert.ok(increments >= fenetreMin,
      `${structure} : ${increments} tick(s) de forçage mesurables, ${fenetreMin} attendus`);

    // ⚠ ET C'EST LÀ QUE SE PROUVE « SUR LES PV MAXIMAUX ». Le nombre de ticks
    // qu'il faudrait au SEUL forçage vaut 100 pour les DEUX structures, alors
    // qu'elles n'ont pas la même taille. Sur les PV RESTANTS, il ne tomberait
    // jamais ; sur une valeur absolue, les deux nombres différeraient.
    assert.equal(avec.pvMax / pas, 100, `${structure} : ${avec.pvMax / pas} ticks, 100 attendus`);

    // Et le module fait quelque chose : la structure tombe strictement plus tôt.
    const mortAvec = avec.serie.indexOf(0);
    const mortSans = sans.serie.indexOf(0);
    assert.ok(mortAvec > 0 && mortSans > 0, `${structure} : elle ne tombe pas dans un des deux combats`);
    assert.ok(mortAvec < mortSans,
      `${structure} : elle tombe au tick ${mortAvec} avec le module et ${mortSans} sans`);
  }
});

test('T12 — sans le module acquis, ou sur une pièce qui ne le porte pas, rien n\'est forcé', () => {
  // ⚠ TROIS CONDITIONS, TROIS CONTRE-CAS. La pièce doit PORTER l'Écraseur, le
  // JOUEUR doit l'avoir acheté, et c'est bien la liste de SON camp qu'on lit.
  const pas = 20000; // 1 % des 2 000 PV du Merlon, en milli-PV

  // (a) le Bélier porte `flashbang`, pas `ecraseur` : acheté ou non, il ne force pas.
  const belierAvec = pvParTick('merlon', true, 'belier');
  const belierSans = pvParTick('merlon', false, 'belier');
  const n = Math.min(belierAvec.serie.length, belierSans.serie.length);
  for (let t = 0; t < n; t += 1) {
    assert.equal(belierAvec.serie[t], belierSans.serie[t],
      `le Bélier force au tick ${t} alors qu'il ne porte pas l'Écraseur`);
  }
  assert.equal(UNITES.belier.module, 'flashbang', 'montage sans mordant : le Bélier a changé de module');
  assert.equal(UNITES.fendeur.module, 'ecraseur', 'montage sans mordant : le Fendeur a changé de module');

  // (b) l'Écraseur mis dans la liste de l'OUVRAGE ne force rien pour le joueur.
  const etat = creerCombat({
    niveau: 1,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 15, colonne: 5, niveau: 1 }],
    defenseurs: [{ id: 'merlon', rangee: 5, colonne: 5, niveau: 1 }],
    vagues: [[{ id: 'fendeur', colonne: 5, niveau: 1 }]],
    modulesDebloques: { ouvrage: ['ecraseur'], joueur: [] },
  });
  const mur = etat.entites.find((e) => e.id === 'merlon');
  const temoin = pvParTick('merlon', false);
  for (let t = 1; t <= 60; t += 1) {
    tick(etat);
    assert.equal(mur.pvMilli, temoin.serie[t],
      `l'Écraseur de l'OUVRAGE force pour le joueur, au tick ${t} (écart ${temoin.serie[t] - mur.pvMilli} ≈ ${pas})`);
    if (etat.termine) break;
  }
});

test('T12bis — la masse ×2 est écrite, et aujourd\'hui INDISTINGUABLE', () => {
  // ⚠⚠ CE TEST NE PROUVE PAS L'EFFET, IL CONSIGNE POURQUOI IL NE PEUT PAS. Les
  // blindés valent 5, 10 ou 20 de masse ; les ESCOUADES valent toutes 1. Un
  // blindé écrase donc déjà toute escouade, doublé ou non — aucun montage ne
  // sépare les deux comportements. Écrire un test « vert » là-dessus serait
  // faire semblant.
  //
  // CE QU'IL FAUDRAIT pour que la règle devienne falsifiable : une escouade de
  // masse ≥ 5, face à un blindé de masse 5 — sans le module elle bloquerait,
  // avec elle serait écrasée. Le jour où cette ligne existe, ce test tombe et
  // dit quoi écrire.
  const massesEscouades = Object.values(UNITES)
    .filter((u) => u.chassis === 'escouade').map((u) => u.masse);
  const massesBlindes = Object.values(UNITES)
    .filter((u) => u.chassis === 'blinde').map((u) => u.masse);
  assert.deepEqual([...new Set(massesEscouades)], [1],
    'une escouade a pris de la masse : la masse ×2 devient mesurable, écrire le test');
  assert.ok(Math.min(...massesBlindes) > 1,
    'un blindé est descendu à la masse d\'une escouade : revoir l\'écrasement');
});

test('T13 — l\'Écraseur du JOUEUR ne touche pas les points de recherche', () => {
  // ⚠ MÊME RÉSULTAT DE COMBAT, DEUX MONTAGES. Rejouer deux combats ferait
  // diverger les PV — la structure forcée tombe plus tôt — et l'on mesurerait
  // ce décalage-là au lieu de la confusion `joueur` / `ouvrage`. On calcule
  // donc les points DEUX FOIS sur le MÊME résultat.
  const etat = duel('merlon', true);
  const resultat = resoudre(etat, { maxTicks: 400 });
  const base = { niveau: 1, defenseurs: [], batiments: [], vagues: [] };

  const sansJoueur = pointsRecherche(resultat,
    { ...base, modulesDebloques: { ouvrage: [], joueur: [] } });
  const avecJoueur = pointsRecherche(resultat,
    { ...base, modulesDebloques: { ouvrage: [], joueur: ['ecraseur', 'pvPlusVingt'] } });
  assert.equal(avecJoueur, sansJoueur,
    'les modules du JOUEUR majorent les points : la confusion du §6.3 est là');
  assert.ok(sansJoueur > 0n, 'montage sans mordant : ce raid ne rapporte aucun point');

  // ⚠ ET LE BONUS DE 20 % EST BIEN VIVANT, sinon l'égalité ci-dessus passerait
  // pour un barème mort. Le Merlon porte `pvPlusVingt` côté OUVRAGE.
  const avecOuvrage = pointsRecherche(resultat,
    { ...base, modulesDebloques: { ouvrage: ['pvPlusVingt'], joueur: [] } });
  assert.equal(avecOuvrage, (sansJoueur * 12n) / 10n,
    `le bonus de l'Ouvrage ne vaut pas +20 % : ${sansJoueur} → ${avecOuvrage}`);
});
