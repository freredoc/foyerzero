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
import {
  creerCombat, tick, resoudre, pointsRecherche, serialiserEtat,
} from '../src/sim/combat.js';
import { caseDepuisMilli } from '../src/sim/grille.js';
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
import { ATLAS } from '../src/data/atlas.js';
import {
  initialiserEcranRecherche, lignesDeRecherche, lignesSpeciales, couchesDeLaPiece,
  PANNEAUX, LIBELLE_CONFIRMER,
} from '../src/ui/recherche.js';

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

  // L'unité achetée, plus RIEN ne refuse — la preuve que la porte s'est bien
  // ouverte.
  //
  // ⚠ RÉÉCRIT AU LOT MODULES-A. L'assertion d'origine attendait
  // `['effetNonCable']` : l'Obusier porte le Tir de barrage, qui n'était câblé
  // nulle part. Il l'est en offense depuis ce lot, et ce refus a disparu. Ce
  // que ce test mesure — « le module exige son unité » — n'a pas changé : la
  // liste VIDE le prouve aussi bien, et mieux, puisqu'elle ne dépend plus d'un
  // second refus qui masquait le premier.
  acheter(etat, 'offense', 'pilon', 'unite');
  assert.deepEqual(problemesDeLAchat(etat, 'offense', 'pilon', 'module'), []);
});

test('T11 — un module non câblé ne se vend pas, même unité acquise et points en poche', () => {
  const etat = partie('999999999999999');
  const nonCables = [];
  for (const branche of BRANCHES) {
    for (const id of Object.keys(ARBRE_RECHERCHE[branche])) {
      const nom = nomDuModule(branche, id);
      if (moduleEstCable(nom, branche)) continue;
      nonCables.push(`${branche}/${id}`);
      if (!estAcquise(etat, branche, id)) acheter(etat, branche, id, 'unite');
      const codes = problemesDeLAchat(etat, branche, id, 'module').map((p) => p.code);
      assert.deepEqual(codes, ['effetNonCable'], `${branche}/${id} : ${codes.join(',')}`);
    }
  }
  // MESURÉ : 25 lignes sur 31 portent un module non câblé DE LEUR CÔTÉ. Les six
  // qui restent sont toutes en offense — le Fendeur et le Broyeur pour
  // l'Écraseur, les Perceurs et l'Obusier pour le Tir de barrage, les
  // Cuirassiers et les Sapeurs pour le Booster.
  //
  // ⚠ RÉÉCRIT AU LOT MODULES-A, DE 29 À 25, et le compte est MESURÉ, pas
  // déduit : `moduleEstCable` prend désormais la branche, et la ligne DÉFENSE
  // des Perceurs reste non câblée alors qu'elle porte le même module que leur
  // ligne offense. C'est exactement ce que ce lot vend, et ce compte-là le dit.
  assert.equal(nonCables.length, 25, `${nonCables.length} lignes non câblées, 25 attendues`);

  // ⚠ CE QUI FALSIFIERAIT CE TEST : passer `cable.offense` à `true` sur
  // `flashbang`. Les lignes de la Meute et du Bélier cesseraient de rendre
  // `effetNonCable`, et le compte tomberait. Le contre-cas est ici, en dur :
  // l'Écraseur PASSE.
  const cable = partie('999999999999999');
  acheter(cable, 'offense', 'fendeur', 'unite');
  assert.deepEqual(problemesDeLAchat(cable, 'offense', 'fendeur', 'module'), []);
  acheter(cable, 'offense', 'fendeur', 'module');
  assert.ok(moduleEstAcquis(cable, 'offense', 'fendeur'));
  assert.deepEqual(modulesDebloquesDuJoueur(cable), ['ecraseur']);
});

// ---------------------------------------------------------------------------
// Lot MODULES-A — le drapeau de câblage passe PAR BRANCHE
// ---------------------------------------------------------------------------

test('MODULES-A T9 — `cable` est par branche, et la fonction lève des deux côtés', () => {
  // Le Tir de barrage est le cas qui a imposé la forme : les Perceurs le
  // portent en offense ET en défense, et son effet est vide de sens en défense.
  assert.equal(moduleEstCable('tirDeBarrage', 'offense'), true);
  assert.equal(moduleEstCable('tirDeBarrage', 'defense'), false);
  // L'Écraseur n'a aucun porteur défensif : le second drapeau est faux, et
  // personne ne le lit — il est là pour que la table ait une forme unique.
  assert.equal(moduleEstCable('ecraseur', 'offense'), true);
  assert.equal(moduleEstCable('ecraseur', 'defense'), false);

  // ⚠ ELLE LÈVE, elle ne rend pas `false`. Une branche mal orthographiée
  // refuserait TOUT achat de module sans que rien ne le dise.
  assert.throws(() => moduleEstCable('inexistant', 'offense'), /module inconnu/);
  assert.throws(() => moduleEstCable('ecraseur', 'milieu'), /branche inconnue/);
  assert.throws(() => moduleEstCable('ecraseur', undefined), /branche inconnue/);
  // `toString` existe sur tout objet : sans `Object.hasOwn`, il passerait.
  assert.throws(() => moduleEstCable('ecraseur', 'toString'), /branche inconnue/);

  // Les quatorze lignes ont les DEUX clés, et rien d'autre.
  for (const [nom, m] of Object.entries(MODULES)) {
    assert.deepEqual(Object.keys(m.cable).sort(), ['defense', 'offense'], nom);
    for (const b of BRANCHES) assert.equal(typeof m.cable[b], 'boolean', `${nom}/${b}`);
  }
  // MESURÉ : trois modules câblés sur quatorze, tous en offense, aucun en défense.
  const cables = Object.entries(MODULES)
    .filter(([, m]) => m.cable.offense || m.cable.defense).map(([n]) => n).sort();
  assert.deepEqual(cables, ['booster', 'ecraseur', 'tirDeBarrage']);
  assert.equal(Object.values(MODULES).filter((m) => m.cable.defense).length, 0,
    'aucun module n\'est câblé en défense — le jour où il y en aura un, ce test tombe');
});

test('MODULES-A T10 — l\'achat suit le drapeau, branche par branche', () => {
  // Assez de points et l'unité acquise DES DEUX CÔTÉS : ce qui sépare les deux
  // lignes ne peut être que le drapeau.
  const etat = partie('999999999999999');
  acheter(etat, 'offense', 'perceurs', 'unite');
  acheter(etat, 'defense', 'perceurs', 'unite');
  assert.equal(nomDuModule('offense', 'perceurs'), 'tirDeBarrage',
    'montage : les deux lignes portent bien le MÊME module');
  assert.equal(nomDuModule('defense', 'perceurs'), 'tirDeBarrage');

  // Offense : plus aucun refus.
  assert.deepEqual(problemesDeLAchat(etat, 'offense', 'perceurs', 'module'), []);
  acheter(etat, 'offense', 'perceurs', 'module');
  assert.ok(moduleEstAcquis(etat, 'offense', 'perceurs'));

  // Défense : refusé, et le message NOMME la branche — « effet à venir » aurait
  // été juste et déroutant, la ligne offense venant d'être achetée.
  const pb = problemesDeLAchat(etat, 'defense', 'perceurs', 'module');
  assert.deepEqual(pb.map((p) => p.code), ['effetNonCable']);
  // ⚠ « défense » AVEC SON ACCENT : ce message s'affiche au joueur, sous la
  // ligne. La clé de branche, elle, s'écrit sans accent.
  assert.equal(pb[0].message, 'Tir de barrage n\'a pas d\'effet en défense');
  assert.throws(() => acheter(etat, 'defense', 'perceurs', 'module'), /pas d\'effet en défense/);

  // Un module câblé NULLE PART garde l'autre message : celui-là est bien une
  // attente, pas une impossibilité.
  assert.ok(estAcquise(etat, 'offense', 'meute'), 'montage : la Meute est gratuite');
  const pf = problemesDeLAchat(etat, 'offense', 'meute', 'module');
  assert.deepEqual(pf.map((p) => p.code), ['effetNonCable']);
  assert.equal(pf[0].message, 'Flashbang n\'a pas encore d\'effet en jeu');
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

// ---------------------------------------------------------------------------
// Lot MODULES-A — le Tir de barrage
// ---------------------------------------------------------------------------

/**
 * Un tireur porteur du Tir de barrage face à une cible et à des voisines.
 *
 * ⚠ LE MERLON EST CHOISI POUR CE QU'IL NE FAIT PAS : 2 000 PV, `degats: null`,
 * `bloque: true`. Il ne riposte jamais, donc les PV du tireur ne bougent pas et
 * `degatsDUnTir` garde son ratio de santé à 1 000 ‰ — sans quoi la mécanique
 * « plus une unité est blessée, moins elle tape fort » (lot 2A) ferait diverger
 * les deux combats par un second canal.
 */
function scene({ cible, voisines, avecModule, tireur = 'perceurs', colonneTireur = 5 }) {
  return creerCombat({
    niveau: 1,
    obstacles: [],
    // Loin de tout : il empêche seulement le combat de s'arrêter faute de
    // bâtiment debout. Aucune de ses cases ne touche la cible.
    batiments: [{ id: 'souche', rangee: 15, colonne: 1, niveau: 1 }],
    defenseurs: [cible, ...voisines].map((d) => ({ ...d, niveau: 1 })),
    vagues: [[{ id: tireur, colonne: colonneTireur, rangee: 2, niveau: 1 }]],
    modulesDebloques: { ouvrage: [], joueur: avecModule ? ['tirDeBarrage'] : [] },
  });
}

/** Les PV perdus par chaque défenseur au bout d'UN tick, par case. */
function pertesAuPremierTick(etat) {
  const avant = new Map();
  for (const e of etat.entites) {
    if (e.camp !== 'defense') continue;
    avant.set(`${caseDepuisMilli(e.rangeeMilli)},${e.colonne}`, e.pvMilli);
  }
  tick(etat);
  const pertes = new Map();
  for (const e of etat.entites) {
    if (e.camp !== 'defense') continue;
    const cle = `${caseDepuisMilli(e.rangeeMilli)},${e.colonne}`;
    pertes.set(cle, avant.get(cle) - e.pvMilli);
  }
  return pertes;
}

test('MODULES-A T1 — le barrage frappe les VOISINES de la cible, et elles seules', () => {
  // Géométrie, tireur en (2,5) :
  //   (3,5) la cible        — la plus proche, donc élue par le ciblage
  //   (3,4) voisine         — Tchebychev 1 de la CIBLE            → touchée
  //   (3,7) hors de portée  — Tchebychev 2 en colonne             → intacte
  //   (5,5) hors de portée  — Tchebychev 2 en rangée              → intacte
  const etat = scene({
    cible: { id: 'merlon', rangee: 3, colonne: 5 },
    voisines: [
      { id: 'merlon', rangee: 3, colonne: 4 },
      { id: 'merlon', rangee: 3, colonne: 7 },
      { id: 'merlon', rangee: 5, colonne: 5 },
    ],
    avecModule: true,
  });
  const pertes = pertesAuPremierTick(etat);
  // ⚠ APRÈS LE TICK : `cibleIndice` est posé par l'étape 3, il est encore nul
  // au tick 0. La cible élue est celle sur laquelle le tir direct a porté.
  const vise = etat.entites.find((e) => e.camp === 'attaque').cibleIndice;
  assert.equal(`${caseDepuisMilli(etat.entites[vise].rangeeMilli)},${etat.entites[vise].colonne}`,
    '3,5', 'montage : le ciblage n\'a pas élu la case attendue');
  const directe = pertes.get('3,5');
  assert.ok(directe > 0, 'montage sans mordant : le tir direct ne retire rien');
  // Les quatre murs sont identiques et à pleine vie : `degatsContre` leur rend
  // la même valeur, et le barrage en reverse 30 %, un seul `floor`.
  assert.equal(pertes.get('3,4'), Math.floor((directe * 30) / 100));
  assert.equal(pertes.get('3,7'), 0, 'une case à deux colonnes a été touchée');
  assert.equal(pertes.get('5,5'), 0, 'une case à deux rangées a été touchée');

  // ⚠ CE QUI FALSIFIERAIT CE TEST : un rayon de 2. Les deux dernières cases
  // perdraient des PV. Un rayon de 0 le ferait tomber aussi, par la deuxième
  // assertion. Le contre-cas « sans le module » est ici, même géométrie.
  const sans = pertesAuPremierTick(scene({
    cible: { id: 'merlon', rangee: 3, colonne: 5 },
    voisines: [{ id: 'merlon', rangee: 3, colonne: 4 }],
    avecModule: false,
  }));
  assert.equal(sans.get('3,5'), directe, 'le tir direct doit être le même des deux côtés');
  assert.equal(sans.get('3,4'), 0, 'sans le module, la voisine ne doit rien perdre');

  // ⚠ « UNE STRUCTURE AMIE » N'EST PAS MONTABLE ICI, ET C'EST UN FAIT DU
  // MOTEUR, pas un oubli : `creerCombat` range TOUS les défenseurs et TOUS les
  // bâtiments dans le camp `defense`. Un attaquant n'a donc aucune structure
  // alliée sur la grille. Le filtre de camp du barrage est éprouvé là où il
  // mord vraiment — en défense, T4 ci-dessous.
  assert.equal(etat.entites.filter((e) => e.camp === 'attaque' && e.genre !== 'unite').length, 0);
});

test('MODULES-A T2 — le barrage recalcule la COLONNE, il ne reverse pas la cible', () => {
  // Les Grenadiers font 5 à l'infanterie et 25 à la structure (`data/combat.js`).
  // Ils visent une escouade et un mur est voisin :
  //   lecture naïve   → floor(5 000 × 30 / 100) = 1 500 milli-PV
  //   lecture juste   → floor(25 000 × 30 / 100) = 7 500 milli-PV
  // Les deux nombres diffèrent d'un facteur 5, et l'assertion dit lequel a été lu.
  //
  // ⚠ ET LA SECONDE ESCOUADE ÉPROUVE LE FILTRE DE GENRE : « les structures
  // voisines », pas les unités. Elle est adverse, à Tchebychev 1 de la cible,
  // et elle ne doit rien perdre du barrage.
  const etat = scene({
    cible: { id: 'meute', rangee: 3, colonne: 5 },
    voisines: [
      { id: 'merlon', rangee: 3, colonne: 4 },
      { id: 'meute', rangee: 3, colonne: 6 },
    ],
    avecModule: true,
  });
  const pertes = pertesAuPremierTick(etat);
  const surLEscouade = pertes.get('3,5');
  const surLeMur = pertes.get('3,4');
  assert.equal(surLEscouade, 5000, 'montage : la colonne infanterie des Grenadiers a changé');
  assert.equal(surLeMur, 7500,
    `le barrage a lu la colonne de la CIBLE et non celle du mur : ${surLeMur}`);
  assert.ok(surLeMur > surLEscouade,
    'montage sans mordant : les deux colonnes doivent différer pour que ce test prouve quelque chose');
  assert.notEqual(surLeMur, Math.floor((surLEscouade * 30) / 100),
    'la lecture naïve et la lecture juste donnent le même nombre — le montage ne sépare rien');
  assert.equal(pertes.get('3,6'), 0,
    'une UNITÉ voisine a pris le barrage — il ne vise que les structures');

  // Et la contre-épreuve du montage : sans le module, le mur ET l'escouade
  // voisine sont intacts, la cible seule encaisse.
  const sans = pertesAuPremierTick(scene({
    cible: { id: 'meute', rangee: 3, colonne: 5 },
    voisines: [
      { id: 'merlon', rangee: 3, colonne: 4 },
      { id: 'meute', rangee: 3, colonne: 6 },
    ],
    avecModule: false,
  }));
  assert.equal(sans.get('3,5'), surLEscouade);
  assert.equal(sans.get('3,4'), 0);
  assert.equal(sans.get('3,6'), 0);
});

test('MODULES-A T3 — le barrage ne coûte pas une seule munition de plus', () => {
  // Deux combats identiques, un seul drapeau de différence, la réserve du
  // tireur relevée à CHAQUE tick.
  const reserves = (avecModule) => {
    const etat = scene({
      cible: { id: 'merlon', rangee: 3, colonne: 5 },
      voisines: [
        { id: 'merlon', rangee: 3, colonne: 4 },
        { id: 'merlon', rangee: 3, colonne: 6 },
      ],
      avecModule,
    });
    const tireur = etat.entites.find((e) => e.camp === 'attaque');
    const serie = [tireur.reserve];
    for (let t = 0; t < 40 && !etat.termine; t += 1) {
      tick(etat);
      serie.push(tireur.reserve);
    }
    return { serie, etat };
  };
  const avec = reserves(true);
  const sans = reserves(false);
  assert.deepEqual(avec.serie, sans.serie, 'le barrage a consommé de la réserve');
  assert.ok(avec.serie[0] > avec.serie.at(-1), 'montage sans mordant : la réserve n\'a pas bougé');

  // ⚠ SANS CE CONTRE-CAS, LE TEST PASSERAIT SUR UN BARRAGE INERTE. Les deux
  // combats doivent diverger PAR AILLEURS — c'est là toute la mesure.
  const pvVoisines = (etat) => etat.entites
    .filter((e) => e.camp === 'defense' && e.colonne !== 5)
    .reduce((s, e) => s + e.pvMilli, 0);
  assert.ok(pvVoisines(avec.etat) < pvVoisines(sans.etat),
    'les voisines n\'ont pas plus souffert avec le module : le barrage ne fait rien');
});

test('MODULES-A T4 — en DÉFENSE, le barrage n\'a rien à frapper', () => {
  // Les Grenadiers portent le module des deux côtés, et le drapeau `cable` le
  // refuse en défense (T9). Voici POURQUOI, mesuré : même en le forçant dans
  // `modulesDebloques.joueur`, l'attaquant n'a ni structure ni bâtiment.
  //
  // ⚠ ET LE MÊME MONTAGE ÉPROUVE LE FILTRE DE CAMP, qui n'a nulle part ailleurs
  // où mordre : le Grenadier défensif a un MUR ALLIÉ collé à sa cible. Sans le
  // test `v.camp === e.camp`, ce mur-là prendrait le barrage de son propre
  // camp. Aucun montage OFFENSIF ne peut le montrer — `creerCombat` range tous
  // les défenseurs et tous les bâtiments dans le camp `defense`, si bien qu'un
  // attaquant n'a jamais de structure alliée sur la grille.
  //
  // Géométrie : le Grenadier en (3,6) vise l'assaillant en (3,5) ; le mur ami
  // est en (3,4), à Tchebychev 1 de cet assaillant.
  const bataille = (avecModule) => {
    const etat = creerCombat({
      niveau: 1,
      obstacles: [],
      proprietaireDefense: 'joueur',
      proprietaireAttaque: 'ouvrage',
      batiments: [{ id: 'souche', rangee: 15, colonne: 1, niveau: 1 }],
      defenseurs: [
        { id: 'perceurs', rangee: 3, colonne: 6, niveau: 1 },
        { id: 'merlon', rangee: 3, colonne: 4, niveau: 1 },
      ],
      vagues: [[
        { id: 'meute', colonne: 5, rangee: 3, niveau: 1 },
        { id: 'ratisseur', colonne: 7, rangee: 2, niveau: 1 },
      ]],
      modulesDebloques: { joueur: avecModule ? ['tirDeBarrage'] : [], ouvrage: [] },
    });
    const serie = [];
    const mur = [];
    // La géométrie est relevée au PREMIER tick : passé quelques ticks les
    // assaillants ont avancé, et celui que le Grenadier vise peut avoir changé.
    let visee = null;
    for (let t = 0; t < 30 && !etat.termine; t += 1) {
      tick(etat);
      serie.push(etat.entites.filter((e) => e.camp === 'attaque').map((e) => e.pvMilli).join(','));
      mur.push(etat.entites.find((e) => e.id === 'merlon').pvMilli);
      if (visee === null) {
        const g = etat.entites.find((e) => e.id === 'perceurs' && e.camp === 'defense');
        const c = g.cibleIndice === null ? null : etat.entites[g.cibleIndice];
        visee = c === null ? null : {
          camp: c.camp, colonne: c.colonne, rangee: caseDepuisMilli(c.rangeeMilli),
        };
      }
    }
    return { serie, mur, etat, visee };
  };
  const avec = bataille(true);
  const sans = bataille(false);
  assert.deepEqual(avec.serie, sans.serie,
    'le barrage a mordu en défense — il ne devrait rien avoir à frapper');
  assert.deepEqual(avec.mur, sans.mur,
    'le mur ALLIÉ a encaissé le barrage de son propre camp');

  // ⚠ MONTAGE FALSIFIABLE : sans ces trois lignes, un Grenadier qui ne tire
  // jamais donnerait deux séries identiques et le test passerait à vide.
  const grenadier = avec.etat.entites.find((e) => e.id === 'perceurs' && e.camp === 'defense');
  assert.equal(grenadier.proprietaire, 'joueur');
  assert.ok(avec.serie.some((l) => l !== avec.serie[0]),
    'montage sans mordant : le Grenadier défensif n\'a blessé personne');
  assert.equal(avec.visee?.camp, 'attaque', 'montage : le Grenadier ne vise pas un assaillant');
  assert.ok(Math.abs(avec.visee.colonne - 4) <= 1 && Math.abs(avec.visee.rangee - 3) <= 1,
    'montage sans mordant : le mur ami n\'est pas voisin de la cible du Grenadier');
});

// ---------------------------------------------------------------------------
// Lot MODULES-A — le Booster
// ---------------------------------------------------------------------------

/**
 * Un Cuirassier qui traverse un champ d'obstacles, blessé en chemin.
 *
 * ⚠ LES OBSTACLES SONT LE CŒUR DU MONTAGE, PAS UN DÉCOR. Sans eux, un porteur
 * boosté franchit la grille entière en 30 ticks — 18 rangées × 1 000 milli =
 * exactement 30 × 600 — et la fenêtre ne tiendrait pas dans le terrain. Sous
 * obstacle la vitesse tombe à 24, le boosté à 240, et les 30 ticks tiennent
 * largement. Ils font en plus la seule mesure qui sépare « ×10 après la
 * réduction d'obstacle » (240) de « ×10 avant » (600, la vitesse nominale
 * boostée) et de « pas de boost » (24).
 *
 * ⚠ LE CUIRASSIER EST AU NIVEAU 20 ET SES BLESSEURS AU NIVEAU 1 : il doit
 * survivre à toute la fenêtre pour qu'on puisse la mesurer, et être reblessé
 * APRÈS elle pour qu'on puisse vérifier qu'il ne redéclenche pas.
 */
function courseAvecObstacles(avecModule) {
  const obstacles = [];
  for (let r = 4; r <= 17; r += 1) obstacles.push({ rangee: r, colonne: 5, type: 'infanterie' });
  const etat = creerCombat({
    niveau: 1,
    obstacles,
    batiments: [{ id: 'souche', rangee: 18, colonne: 1, niveau: 1 }],
    defenseurs: [
      // La Ronce blesse au passage — deux ticks de franchissement, rien de plus.
      { id: 'ronce', rangee: 3, colonne: 5, niveau: 1 },
      // La Casemate reprend le relais bien plus tard, APRÈS la fenêtre.
      { id: 'casemate', rangee: 10, colonne: 7, niveau: 1 },
    ],
    vagues: [[{ id: 'carapace', colonne: 5, rangee: 2, niveau: 20 }]],
    modulesDebloques: { ouvrage: [], joueur: avecModule ? ['booster'] : [] },
  });
  const u = etat.entites.find((e) => e.camp === 'attaque');
  let position = u.rangeeMilli;
  let pv = u.pvMilli;
  const releve = [];
  for (let t = 1; t <= 90 && !etat.termine; t += 1) {
    tick(etat);
    releve.push({
      tick: t,
      avance: u.rangeeMilli - position,
      blessee: u.pvMilli < pv,
      sousEffet: u.effetsTemporises.length,
      marques: [...u.modulesActifs],
    });
    position = u.rangeeMilli;
    pv = u.pvMilli;
  }
  return { etat, u, releve };
}

/** Le même montage, sérialisé à CHAQUE tick — pour le déterminisme. */
function courseTracee(avecModule) {
  const obstacles = [];
  for (let r = 4; r <= 17; r += 1) obstacles.push({ rangee: r, colonne: 5, type: 'infanterie' });
  const etat = creerCombat({
    niveau: 1,
    obstacles,
    batiments: [{ id: 'souche', rangee: 18, colonne: 1, niveau: 1 }],
    defenseurs: [
      { id: 'ronce', rangee: 3, colonne: 5, niveau: 1 },
      { id: 'casemate', rangee: 10, colonne: 7, niveau: 1 },
    ],
    vagues: [[{ id: 'carapace', colonne: 5, rangee: 2, niveau: 20 }]],
    modulesDebloques: { ouvrage: [], joueur: avecModule ? ['booster'] : [] },
  });
  const lignes = [serialiserEtat(etat)];
  for (let t = 1; t <= 60 && !etat.termine; t += 1) {
    tick(etat);
    lignes.push(serialiserEtat(etat));
  }
  return { etat, lignes };
}

test('MODULES-A T5 — le Booster déclenche UNE fois, dure 30 ticks, et ne revient pas', () => {
  const { u, releve } = courseAvecObstacles(true);
  const boostes = releve.filter((l) => l.sousEffet > 0).map((l) => l.tick);
  const premiere = releve.find((l) => l.blessee);

  // La fenêtre commence AU TICK DE LA BLESSURE — pas au suivant. C'est ce que
  // vaut le déclenchement lu APRÈS l'application des dégâts.
  assert.ok(premiere !== undefined, 'montage sans mordant : le Cuirassier n\'a jamais été blessé');
  assert.equal(boostes[0], premiere.tick, 'la fenêtre ne s\'ouvre pas au tick de la blessure');
  assert.equal(boostes.length, 30, `fenêtre de ${boostes.length} ticks au lieu de 30`);
  assert.deepEqual(boostes, Array.from({ length: 30 }, (_, i) => boostes[0] + i),
    'la fenêtre n\'est pas d\'un seul tenant');

  // Les vitesses, en milli-cases par tick. 60 nominal, 24 sous obstacle.
  const avanceAu = (t) => releve.find((l) => l.tick === t).avance;
  assert.equal(avanceAu(boostes[0] - 1), 60, 'montage : avant la blessure, vitesse nominale');
  assert.equal(avanceAu(boostes[0]), 600, 'le tick de la blessure n\'est pas boosté');
  // ⚠ L'ASSERTION QUI SÉPARE « ×10 APRÈS L'OBSTACLE » DE « ×10 AVANT » : sous
  // obstacle la valeur boostée vaut 240, pas 600. Écrit dans l'autre ordre, un
  // obstacle cesserait de ralentir une unité boostée.
  assert.equal(avanceAu(boostes.at(-1)), 240, 'sous obstacle, le boost ne vaut pas 10 × 24');
  assert.equal(avanceAu(boostes.at(-1) + 1), 24, 'la vitesse n\'est pas retombée après la fenêtre');
  assert.equal(240, 24 * 10);

  // Reblessée APRÈS la fenêtre : aucun second déclenchement.
  const apres = releve.filter((l) => l.tick > boostes.at(-1));
  assert.ok(apres.some((l) => l.blessee),
    'montage sans mordant : rien ne reblesse le Cuirassier après la fenêtre');
  assert.ok(apres.every((l) => l.sousEffet === 0), 'le Booster a redéclenché');
  assert.deepEqual(u.modulesActifs, ['booster'],
    'la marque doit RESTER après l\'expiration — c\'est elle qui interdit le second');

  // ⚠ CE QUI FALSIFIERAIT CE TEST : une marque retirée à l'expiration. La
  // dernière assertion tomberait, et l\'avant-dernière aussi. Le contre-cas
  // sans module est ici : aucune fenêtre, vitesse nominale du début à la fin.
  const sans = courseAvecObstacles(false);
  assert.ok(sans.releve.every((l) => l.sousEffet === 0 && l.marques.length === 0));
  assert.equal(sans.releve.find((l) => l.tick === boostes[0]).avance, 60);
  assert.ok(sans.releve.some((l) => l.blessee), 'le contre-cas doit blesser lui aussi');
});

test('MODULES-A T6 — aucun porteur du Booster ne franchit 1 000 milli-cases par tick', () => {
  // ⚠⚠ CE TEST NE PORTE PAS SUR CE LOT, ET C'EST VOULU. `peutAvancer` repose
  // sur un invariant NON ÉCRIT dans les données : « aucune vitesse n'atteint
  // 1 000 milli-cases par tick », c'est-à-dire que la case de destination ne
  // saute jamais une rangée. Le Booster multiplie par 10. Ses deux porteurs
  // d'aujourd'hui sont des escouades à 60 — 600, l'invariant tient. Il tiendra
  // encore sous obstacle, plus lent. Mais il ne tient QUE PAR ACCIDENT : donner
  // le Booster au Frappeur (240) donnerait 2 400, la destination sauterait une
  // rangée, et une unité passerait À TRAVERS un mur sans qu'aucun autre test
  // n'échoue. Ce test-ci tombe ce jour-là.
  const porteurs = Object.entries(UNITES).filter(([, u]) => u.module === 'booster');
  assert.equal(porteurs.length, 2, `${porteurs.length} porteurs du Booster, 2 attendus`);
  assert.deepEqual(porteurs.map(([id]) => id).sort(), ['carapace', 'fouisseurs']);
  for (const [id, u] of porteurs) {
    assert.ok(u.vitesse * 10 < 1000,
      `${id} : ${u.vitesse} × 10 = ${u.vitesse * 10} ≥ 1 000 — `
      + 'la destination saute une rangée et `peutAvancer` ne protège plus rien');
  }
  // Le seuil est celui de `peutAvancer`, et la marge se dit : 600 sur 1 000.
  assert.equal(Math.max(...porteurs.map(([, u]) => u.vitesse * 10)), 600);
});

test('MODULES-A T8 — le déterminisme tient avec le Booster actif', () => {
  // Deux résolutions du MÊME montage, comparées au caractère près. Ce qui
  // pourrait le rompre : un objet à clés non triables dans `effetsTemporises`,
  // ou une valeur `undefined` que `JSON.stringify` avale.
  //
  // ⚠ LA TRACE EST PRISE À CHAQUE TICK, pas seulement à la fin : la fenêtre du
  // Booster a expiré depuis longtemps au dernier tick, et un état final ne
  // porterait plus aucun `finTick` à comparer.
  const trace = (avecModule) => {
    const { etat, lignes } = courseTracee(avecModule);
    return { lignes, fin: serialiserEtat(etat) };
  };
  const a = trace(true);
  const b = trace(true);
  assert.deepEqual(a.lignes, b.lignes, 'deux résolutions identiques divergent tick à tick');
  assert.equal(a.fin, b.fin, 'deux résolutions identiques divergent à l\'arrivée');

  // ⚠ MONTAGE FALSIFIABLE : la trace doit CONTENIR l'effet, sinon elle ne
  // compare rien de neuf.
  assert.ok(a.lignes.some((l) => l.includes('"finTick"')),
    'la trace ne porte aucun effet temporisé');
  assert.ok(a.lignes.some((l) => l.includes('"booster"')),
    'la trace ne porte aucune marque de module');
  // Et elle diffère de celle du même montage sans le module : le Booster est
  // bien dans l'état comparé.
  assert.notDeepEqual(a.lignes, trace(false).lignes);
});

// ---------------------------------------------------------------------------
// T14 — T15 : l'écran et son onglet
// ---------------------------------------------------------------------------
//
// ⚠⚠ IL N'Y A PAS DE DOM DANS CE DÉPÔT — esbuild est la seule dépendance de
// développement, et aucun test n'a jamais rendu un écran. Les écrans se testent
// donc en DEUX morceaux : leur étage PUR (ce qu'il y a à afficher) et le
// balisage produit. Ici les deux ne suffisaient pas : l'achat en deux touchers
// est un comportement du DOM, et le laisser hors test aurait rendu livrable un
// bouton qui paie au premier toucher. Le faux document ci-dessous est donc
// écrit à la main — une soixantaine de lignes, juste assez pour que
// `initialiserEcranRecherche` s'exécute pour de vrai et qu'un clic soit un clic.
//
// ⚠ IL N'IMITE QUE CE QUE L'ÉCRAN EMPLOIE. Un faux document complet serait une
// seconde implémentation du navigateur, avec ses propres bogues ; celui-ci
// LÈVE sur ce qu'il ne connaît pas, si bien qu'une méthode nouvelle employée
// par l'écran fait tomber le test au lieu de passer en silence.

/** Un élément assez complet pour ce que `ui/recherche.js` en fait. */
function faireElement(tag) {
  const classes = new Set();
  const ecouteurs = {};
  let texte = '';
  const el = {
    tagName: tag.toUpperCase(),
    type: '',
    disabled: false,
    hidden: false,
    children: [],
    style: {},
    clientWidth: 0,
    scrollLeft: 0,
    classList: {
      add: (...n) => { for (const c of n) classes.add(c); },
      remove: (...n) => { for (const c of n) classes.delete(c); },
      contains: (c) => classes.has(c),
      toggle: (c, force) => {
        const veut = force === undefined ? !classes.has(c) : force;
        if (veut) classes.add(c); else classes.delete(c);
        return veut;
      },
    },
    get className() { return [...classes].join(' '); },
    set className(v) {
      classes.clear();
      for (const c of String(v).split(/\s+/)) if (c !== '') classes.add(c);
    },
    // ⚠ ÉCRIRE `textContent` VIDE LES ENFANTS, comme dans un vrai document.
    // C'est exactement ce dont `peindre` se sert pour ne pas empiler deux fois
    // le même arbre : un faux qui garderait les enfants ferait passer un écran
    // qui double à chaque peinture.
    get textContent() { return texte + el.children.map((c) => c.textContent).join(''); },
    set textContent(v) { texte = String(v); el.children.length = 0; },
    appendChild(n) { el.children.push(n); return n; },
    append(...n) { el.children.push(...n); },
    addEventListener(type, fn) { (ecouteurs[type] ??= []).push(fn); },
    click() { for (const fn of ecouteurs.click ?? []) fn(); },
    scrollTo() {},
  };
  return el;
}

const IDS_DE_L_ECRAN = [
  'recherche-points', 'recherche-pastilles', 'recherche-panneaux',
  'recherche-offense', 'recherche-defense', 'recherche-special',
];

/** Le faux document, et les nœuds nommés que le balisage fournit. */
function fauxDocument() {
  const parId = new Map();
  for (const id of IDS_DE_L_ECRAN) parId.set(id, faireElement('div'));
  return {
    getElementById(id) {
      if (!parId.has(id)) throw new Error(`faux document : « ${id} » absent du balisage`);
      return parId.get(id);
    },
    createElement: (tag) => faireElement(tag),
  };
}

/** Toutes les lignes `.piece` d'un panneau, à plat. */
function piecesDuPanneau(doc, nom) {
  return doc.getElementById(`recherche-${nom}`).children;
}

/** Le bouton d'achat d'une rangée. */
function boutonDe(rangee) {
  const bouton = rangee.children.find((c) => c.tagName === 'BUTTON');
  assert.ok(bouton, 'cette rangée n\'a pas de bouton');
  return bouton;
}

test('T15 — les trois panneaux portent l\'arbre entier, dans l\'ordre de la table', () => {
  const doc = fauxDocument();
  const ecran = initialiserEcranRecherche(doc);
  ecran.peindre(partie('0'));

  // MESURÉ : 14 + 17 + 4. Les comptes viennent des tables, pas d'un nombre
  // recopié : c'est ce qui fera tomber le test si une pièce entre dans l'arbre
  // sans entrer dans l'écran.
  assert.equal(piecesDuPanneau(doc, 'offense').length, Object.keys(ARBRE_RECHERCHE.offense).length);
  assert.equal(piecesDuPanneau(doc, 'defense').length, Object.keys(ARBRE_RECHERCHE.defense).length);
  assert.equal(piecesDuPanneau(doc, 'offense').length, 14);
  assert.equal(piecesDuPanneau(doc, 'defense').length, 17);
  assert.equal(piecesDuPanneau(doc, 'special').length, Object.keys(SPECIAL).length);
  assert.equal(piecesDuPanneau(doc, 'special').length, 4);

  // ⚠ L'ORDRE EST CELUI DE LA TABLE, ET RIEN NE LE TRIE. Arbitrage 7 : « l'ordre
  // d'affichage est libre, il n'y a pas de prérequis entre pièces ». MONTAGE QUI
  // LE FAIT TOMBER : ajouter un `.sort()` sur les lignes de `lignesDeRecherche`,
  // ou trier par prix dans l'écran — l'arbre se réorganiserait sous le doigt du
  // joueur à chaque achat.
  for (const branche of BRANCHES) {
    assert.deepEqual(
      lignesDeRecherche(partie('0'), branche).map((l) => l.id),
      Object.keys(ARBRE_RECHERCHE[branche]),
      `l'ordre du panneau ${branche} n'est plus celui de la table`,
    );
  }

  // Chaque pièce porte SA rangée de module, en retrait — aucune n'en manque
  // aujourd'hui, et le jour où l'une n'en aura plus, la rangée disparaîtra
  // plutôt que d'afficher un module vide.
  for (const branche of BRANCHES) {
    let avecModule = 0;
    for (const bloc of piecesDuPanneau(doc, branche)) {
      const mod = bloc.children.filter((c) => c.className.includes('module'));
      assert.ok(mod.length <= 1, 'deux rangées de module sous une pièce');
      avecModule += mod.length;
    }
    assert.equal(avecModule, Object.keys(ARBRE_RECHERCHE[branche]).length,
      `des pièces de ${branche} n'affichent pas leur module`);
  }

  // ⚠ ET REPEINDRE NE DOUBLE PAS. MONTAGE QUI LE FAIT TOMBER : retirer le
  // `panneau.textContent = ''` de `peindre` — l'écran se repeint à CHAQUE
  // ouverture d'onglet, donc l'arbre aurait grossi à chaque visite.
  ecran.peindre(partie('0'));
  assert.equal(piecesDuPanneau(doc, 'offense').length, 14, 'la peinture empile au lieu de remplacer');
});

test('T15 — les sprites nommés par l\'écran existent tous dans les atlas', () => {
  // ⚠ SANS CE TEST, UN NOM DE SPRITE FAUX NE SE VERRAIT QU'À L'ŒIL, DANS UN
  // NAVIGATEUR. `poserCouches` lève sur une famille inconnue mais `fondDuSprite`
  // lève, lui, sur un NOM inconnu — et rien de tout cela ne tourne dans un test
  // sans DOM. On croise donc les noms avec l'atlas, des deux côtés.
  // MONTAGE QUI LE FAIT TOMBER : écrire `def_j_<id>_n` au lieu de `_s`, ou
  // oublier que le Merlon, la Herse et la Ronce n'ont pas d'orientation.
  for (const branche of BRANCHES) {
    for (const ligne of lignesDeRecherche(partie('0'), branche)) {
      assert.equal(ligne.couches.length, 1, `${ligne.id} : une seule couche attendue`);
      const { famille, nom } = ligne.couches[0];
      assert.ok(ATLAS[famille], `famille d'atlas inconnue : ${famille}`);
      assert.ok(ATLAS[famille].noms.includes(nom),
        `${branche}/${ligne.id} : le sprite « ${nom} » n'est pas dans l'atlas ${famille}`);
      // Et la lettre est celle du JOUEUR : `off_o_…` est le vocabulaire de
      // l'Ouvrage, interdit dans un écran du joueur (CLAUDE.md §4).
      assert.ok(nom.startsWith('off_j_') || nom.startsWith('def_j_'),
        `${nom} n'est pas un sprite du joueur`);
    }
  }
  // Les trois ouvrages sans tourelle prennent bien leur nom à eux.
  assert.deepEqual(couchesDeLaPiece('merlon'), [{ famille: 'defense', nom: 'def_j_merlon_isole' }]);
  assert.deepEqual(couchesDeLaPiece('herse'), [{ famille: 'defense', nom: 'def_j_herse' }]);
  assert.deepEqual(couchesDeLaPiece('ronce'), [{ famille: 'defense', nom: 'def_j_ronce' }]);
  assert.deepEqual(couchesDeLaPiece('casemate'), [{ famille: 'defense', nom: 'def_j_casemate_s' }]);
  assert.deepEqual(couchesDeLaPiece('meute'), [{ famille: 'unite', nom: 'off_j_meute' }]);
  assert.throws(() => couchesDeLaPiece('raffinerie'), RangeError);
});

test('T15 — ce qui est acquis se dit, ce qui refuse dit pourquoi', () => {
  const doc = fauxDocument();
  const ecran = initialiserEcranRecherche(doc);
  const etat = partie('0');
  ecran.peindre(etat);

  const ids = Object.keys(ARBRE_RECHERCHE.offense);
  const blocs = piecesDuPanneau(doc, 'offense');
  const bloc = (id) => blocs[ids.indexOf(id)];
  const rangeeDe = (b) => b.children.find((c) => c.className === 'rangee');

  // Une gratuite est ACQUISE dès la création, et son bouton le dit sans être un
  // refus. MONTAGE QUI LE FAIT TOMBER : traiter « déjà acquis » comme une
  // raison de blocage — le joueur lirait un reproche là où il n'y a qu'un état.
  const gratuite = boutonDe(rangeeDe(bloc('meute')));
  assert.equal(gratuite.textContent, 'Acquis');
  assert.ok(gratuite.disabled, 'une pièce acquise se rachète');
  assert.ok(gratuite.classList.contains('acquis'));

  // Une payante sans le sou est refusée, et la ligne PORTE la raison — un
  // bouton `disabled` n'émet aucun clic, donc aucun toast ne pourrait la dire.
  const cher = bloc('enclume');
  assert.ok(boutonDe(rangeeDe(cher)).disabled);
  const raison = cher.children.find((c) => c.className === 'raison');
  assert.ok(raison, 'la ligne refusée ne dit pas pourquoi');
  assert.match(raison.textContent, /il manque/);
  // ⚠ L'ESPACE DES MILLIERS EST FINE ET INSÉCABLE (U+202F), et elle s'écrit en
  // échappement : tapée au clavier, l'assertion dépendrait de l'éditeur qui a
  // enregistré ce fichier.
  assert.match(raison.textContent, /120\u202f000\u202f000/);

  // Le module d'une pièce NON acquise accumule ses deux refus.
  const modBloc = bloc('enclume').children.find((c) => c.className === 'module');
  const modRaison = modBloc.children.find((c) => c.className === 'raison');
  assert.match(modRaison.textContent, /la pièce doit être débloquée avant son module/);
  assert.match(modRaison.textContent, /n'a pas encore d'effet en jeu/);

  // ⚠ ET L'ÉCRASEUR EST LE SEUL QUI NE PORTE PAS CE SECOND REFUS. C'est le seul
  // module câblé du lot ; les treize autres s'affichent et ne s'achètent pas,
  // parce que prendre les points du joueur contre rien serait un vol.
  const ecraseur = bloc('fendeur').children.find((c) => c.className === 'module');
  const ecraseurRaison = ecraseur.children.find((c) => c.className === 'raison');
  assert.ok(!/n'a pas encore d'effet en jeu/.test(ecraseurRaison.textContent),
    'l\'Écraseur est déclaré sans effet alors qu\'il est câblé');
});

test('T15 — l\'achat se fait en DEUX touchers, et le premier ne paie rien', () => {
  const doc = fauxDocument();
  let enregistrements = 0;
  const ecran = initialiserEcranRecherche(doc, { apresAchat: () => { enregistrements += 1; } });
  // De quoi payer le Pionnier (12 500 points) et rien de plus.
  const etat = partie(String(12_500n * 1000n));
  ecran.peindre(etat);

  const ids = Object.keys(ARBRE_RECHERCHE.offense);
  const rangee = piecesDuPanneau(doc, 'offense')[ids.indexOf('belier')]
    .children.find((c) => c.className === 'rangee');
  const bouton = boutonDe(rangee);
  assert.equal(bouton.textContent, '12\u202f500');

  // Premier toucher : le bouton s'arme, RIEN n'est débité, rien n'est acquis.
  // MONTAGE QUI LE FAIT TOMBER : appeler `acheter` dès le premier clic — deux
  // milliards et demi de points partiraient sur un frôlement, sans retour.
  bouton.click();
  assert.equal(bouton.textContent, LIBELLE_CONFIRMER);
  assert.ok(bouton.classList.contains('arme'));
  assert.equal(etat.recherche.pointsMilli, String(12_500n * 1000n));
  assert.ok(!estAcquise(etat, 'offense', 'belier'));
  assert.equal(enregistrements, 0);

  // Second toucher sur le MÊME bouton : il paie.
  bouton.click();
  assert.ok(estAcquise(etat, 'offense', 'belier'));
  assert.equal(etat.recherche.pointsMilli, '0');
  assert.equal(enregistrements, 1, 'l\'achat ne s\'est pas enregistré');
});

test('T15 — toucher un AUTRE bouton désarme le premier', () => {
  const doc = fauxDocument();
  const ecran = initialiserEcranRecherche(doc);
  // De quoi payer les deux premières payantes de l'offense.
  const etat = partie(String(1_000_000n * 1000n));
  ecran.peindre(etat);

  const ids = Object.keys(ARBRE_RECHERCHE.offense);
  const blocs = piecesDuPanneau(doc, 'offense');
  const boutonDeLaPiece = (id) => boutonDe(
    blocs[ids.indexOf(id)].children.find((c) => c.className === 'rangee'),
  );
  const belier = boutonDeLaPiece('belier');
  const perceurs = boutonDeLaPiece('perceurs');

  belier.click();
  assert.equal(belier.textContent, LIBELLE_CONFIRMER);
  // ⚠ LE SECOND TOUCHER PORTE SUR UNE AUTRE LIGNE : il arme celle-ci et
  // DÉSARME l'autre. MONTAGE QUI LE FAIT TOMBER : garder l'armement par bouton
  // au lieu d'un seul armement pour l'écran — le joueur laisserait derrière lui
  // une traînée de boutons armés, dont un frôlement paierait n'importe lequel.
  perceurs.click();
  assert.equal(perceurs.textContent, LIBELLE_CONFIRMER);
  assert.equal(belier.textContent, '12\u202f500', 'le premier bouton est resté armé');
  assert.ok(!estAcquise(etat, 'offense', 'belier'));
  assert.ok(!estAcquise(etat, 'offense', 'perceurs'));

  // Et l'indicateur de position désarme lui aussi : changer de panneau n'est
  // pas une confirmation.
  const pastilles = doc.getElementById('recherche-pastilles');
  assert.equal(pastilles.children.length, PANNEAUX.length);
  pastilles.children[1].click();
  assert.equal(perceurs.textContent, '200\u202f000', 'changer de panneau garde un bouton armé');
});

test('T15 — l\'en-tête montre les points, et une peinture désarme tout', () => {
  const doc = fauxDocument();
  const ecran = initialiserEcranRecherche(doc);
  const etat = partie(String(1_234_567n * 1000n + 999n));
  ecran.peindre(etat);
  // ⚠ LE COMPTEUR TRONQUE. MONTAGE QUI LE FAIT TOMBER : arrondir au point
  // supérieur — l'écran annoncerait 1 234 568 points dépensables alors que le
  // moteur en refuserait le dernier, et le joueur toucherait un bouton mort.
  assert.equal(doc.getElementById('recherche-points').textContent, '1\u202f234\u202f567 points');

  const ids = Object.keys(ARBRE_RECHERCHE.offense);
  const bouton = boutonDe(piecesDuPanneau(doc, 'offense')[ids.indexOf('belier')]
    .children.find((c) => c.className === 'rangee'));
  bouton.click();
  assert.equal(bouton.textContent, LIBELLE_CONFIRMER);
  // ⚠ REPEINDRE DÉTRUIT LES NŒUDS ARMÉS. Garder la référence donnerait un
  // armement qui pointe un bouton absent de la page — et le toucher suivant
  // paierait sur un écran que le joueur ne voit plus.
  ecran.peindre(etat);
  const neuf = boutonDe(piecesDuPanneau(doc, 'offense')[ids.indexOf('belier')]
    .children.find((c) => c.className === 'rangee'));
  assert.equal(neuf.textContent, '12\u202f500');
  neuf.click();
  assert.ok(!estAcquise(etat, 'offense', 'belier'), 'le premier toucher a payé après une peinture');
});

test('T15 — l\'onglet Spécial s\'affiche et ne s\'achète pas', () => {
  const doc = fauxDocument();
  const ecran = initialiserEcranRecherche(doc);
  ecran.peindre(partie(String(10n ** 15n)));
  // ⚠ AUCUN BOUTON, MÊME AVEC DE QUOI PAYER MILLE FOIS. Les quatre lignes n'ont
  // pas de moteur ; leur donner un bouton prendrait les points contre rien.
  // MONTAGE QUI LE FAIT TOMBER : réutiliser `boutonDAchat` pour la deuxième
  // base, dont le classeur donne pourtant un prix.
  for (const bloc of piecesDuPanneau(doc, 'special')) {
    const rangee = bloc.children.find((c) => c.className === 'rangee');
    assert.ok(!rangee.children.some((c) => c.tagName === 'BUTTON'),
      'une ligne du panneau Spécial porte un bouton d\'achat');
    const raison = bloc.children.find((c) => c.className === 'raison');
    assert.match(raison.textContent, /pas encore de moteur/);
  }
  // Trois lignes sur quatre n'ont même pas de prix retenu : elles affichent un
  // tiret, jamais un zéro qui se lirait « gratuit ».
  const prix = lignesSpeciales().map((l) => l.prix);
  assert.equal(prix.filter((p) => p === '—').length, 3);
  assert.equal(prix.filter((p) => p !== '—').length, 1);
  assert.ok(prix.includes('2\u202f000\u202f000'), 'la deuxième base a perdu son prix');
});
