// L'arbre de recherche : la table, le moteur d'achat, la migration.
//
// C'est le lot qui déplace la porte. Jusqu'ici, ce que le joueur pouvait poser
// dépendait du niveau du bâtiment commandant ; désormais cela dépend de ce qu'il
// a acheté, et de rien d'autre. Les tests suivent l'ordre du brief : la table,
// puis le moteur, puis la migration.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

import { ARBRE_RECHERCHE, BRANCHES, SPECIAL, gratuitesDe } from '../src/data/recherche.js';
import { MODULES, moduleEstCable } from '../src/data/modules.js';
import { UNITES, DEFENSES } from '../src/data/combat.js';
import { NIVEAU } from '../src/data/niveaux.js';
import {
  creerCombat, tick, resoudre, pointsRecherche, serialiserEtat, butin, facteurMilli,
} from '../src/sim/combat.js';
import { caseDepuisMilli, distanceCarree } from '../src/sim/grille.js';
import { executerRaid, pvMaxDeLUnite } from '../src/sim/raid.js';
import { APRES_RAID } from '../src/data/sites.js';
import { genererSite } from '../src/sim/generateur.js';
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
  // MESURÉ : 8 lignes sur 31 portent un module non câblé DE LEUR CÔTÉ. Les
  // vingt-trois qui restent sont douze en offense — Fendeur et Broyeur
  // (Écraseur), Perceurs et Obusier (Tir de barrage), Cuirassiers et Sapeurs
  // (Booster), Meute et Bélier (Flashbang), Crécelle (EMP), Guetteur et
  // Frappeur (Camouflage), Enclume (Bouclier) — et ONZE EN DÉFENSE depuis
  // MODULES-D : six ouvrages à Auto-réparation, trois à Rayon minimum −1, le
  // Guetteur (Rayon +1) et le Broyeur (PV +20 %).
  //
  // ⚠ RÉÉCRIT TROIS FOIS, ET LE COMPTE EST MESURÉ À CHAQUE LOT, jamais déduit :
  // 29 avant MODULES-A, 25 après — `moduleEstCable` avait pris la branche, et
  // la ligne DÉFENSE des Perceurs restait non câblée alors qu'elle porte le
  // même module que leur ligne offense —, 20 après MODULES-B, 19 après
  // MODULES-C, 8 depuis MODULES-D. Les onze lignes qui viennent de tomber sont
  // exactement celles que ce lot vend, toutes en défense.
  assert.equal(nonCables.length, 8, `${nonCables.length} lignes non câblées, 8 attendues`);

  // ⚠ CE QUI FALSIFIERAIT CE TEST : passer `cable.offense` à `true` sur
  // `garnison`. Les lignes du Ratisseur et de la Buse cesseraient de rendre
  // `effetNonCable`, et le compte tomberait. Le contre-cas est ici, en dur :
  // l'Écraseur PASSE.
  const cable = partie('999999999999999');
  acheter(cable, 'offense', 'fendeur', 'unite');
  assert.deepEqual(problemesDeLAchat(cable, 'offense', 'fendeur', 'module'), []);
  acheter(cable, 'offense', 'fendeur', 'module');
  assert.ok(moduleEstAcquis(cable, 'offense', 'fendeur'));
  // ⚠ ET IL RESTE DANS SA BRANCHE — lot MODULES-E. L'union des deux branches
  // aurait rendu la même liste des deux côtés.
  assert.deepEqual(modulesDebloquesDuJoueur(cable),
    { offense: ['ecraseur'], defense: [] });
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
  // MESURÉ : treize modules câblés sur quatorze — sept en offense, SIX EN
  // DÉFENSE. ⚠ TROIS AU LOT MODULES-A, SIX APRÈS MODULES-B, SEPT APRÈS
  // MODULES-C, ONZE APRÈS MODULES-D, TREIZE DEPUIS MODULES-F. Ce compte est la
  // liste exacte, pas un nombre : ajouter un module câblé sans toucher cette
  // ligne fait tomber le test, et c'est voulu — le drapeau gouverne une VENTE.
  const cables = Object.entries(MODULES)
    .filter(([, m]) => m.cable.offense || m.cable.defense).map(([n]) => n).sort();
  assert.deepEqual(cables, [
    'autoReparation', 'booster', 'bouclier', 'camouflage', 'ecraseur', 'emp',
    'flashbang', 'munitionSpeciale', 'pvPlusVingt', 'rayonMiniMoinsUn',
    'rayonPlusUn', 'tirDeBarrage', 'volDeVie',
  ]);
  // ⚠ AUCUN DES SIX N'EST CÂBLÉ EN OFFENSE, et c'est la moitié qui compte :
  // le Guetteur porte `camouflage` à l'assaut et `rayonPlusUn` en garnison. Un
  // `offense: true` de trop lui vendrait le mauvais module.
  const enDefense = Object.entries(MODULES)
    .filter(([, m]) => m.cable.defense).map(([n]) => n).sort();
  assert.deepEqual(enDefense, ['autoReparation', 'munitionSpeciale', 'pvPlusVingt',
    'rayonMiniMoinsUn', 'rayonPlusUn', 'volDeVie']);
  for (const n of enDefense) assert.equal(MODULES[n].cable.offense, false, `${n} en offense`);
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
  //
  // ⚠ C'ÉTAIT LA MEUTE ET SON FLASHBANG JUSQU'AU LOT MODULES-B, qui vient de
  // le câbler : la ligne rendrait désormais l'AUTRE message. Le contre-cas
  // passe donc au Ratisseur et à sa Garnison, encore câblée nulle part. Le
  // jour où elle le sera, ce bloc changera de pièce à son tour — c'est le
  // signe que le test mesure le drapeau et pas une chaîne figée.
  // ⚠ LE RATISSEUR EST GRATUIT À LA CRÉATION, comme la Meute : `acheter` y
  // lèverait « déjà acquis ». On ASSERTE la précondition au lieu de la poser.
  assert.ok(estAcquise(etat, 'offense', 'ratisseur'), 'montage : le Ratisseur est gratuit');
  const pf = problemesDeLAchat(etat, 'offense', 'ratisseur', 'module');
  assert.deepEqual(pf.map((p) => p.code), ['effetNonCable']);
  assert.equal(pf[0].message, 'Garnison n\'a pas encore d\'effet en jeu');
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
  assert.equal(migre.version, 18);
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
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: { offense: avecEcraseur ? ['ecraseur'] : [], defense: [] },
    },
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
    modulesDebloques: {
      ouvrage: { offense: ['ecraseur'], defense: [] },
      joueur: { offense: [], defense: [] },
    },
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
    { ...base, modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } } });
  const avecJoueur = pointsRecherche(resultat,
    { ...base, modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: { offense: ['ecraseur'], defense: ['pvPlusVingt'] },
    } });
  assert.equal(avecJoueur, sansJoueur,
    'les modules du JOUEUR majorent les points : la confusion du §6.3 est là');
  assert.ok(sansJoueur > 0n, 'montage sans mordant : ce raid ne rapporte aucun point');

  // ⚠ ET LE BONUS DE 20 % EST BIEN VIVANT, sinon l'égalité ci-dessus passerait
  // pour un barème mort. Le Merlon porte `pvPlusVingt` côté OUVRAGE.
  const avecOuvrage = pointsRecherche(resultat,
    { ...base, modulesDebloques: {
      ouvrage: { offense: [], defense: ['pvPlusVingt'] },
      joueur: { offense: [], defense: [] },
    } });
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
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: { offense: avecModule ? ['tirDeBarrage'] : [], defense: [] },
    },
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
      modulesDebloques: {
        joueur: { offense: avecModule ? ['tirDeBarrage'] : [], defense: [] },
        ouvrage: { offense: [], defense: [] },
      },
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
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: { offense: avecModule ? ['booster'] : [], defense: [] },
    },
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
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: { offense: avecModule ? ['booster'] : [], defense: [] },
    },
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

// ---------------------------------------------------------------------------
// Lot MODULES-B — Flashbang, EMP, Camouflage
// ---------------------------------------------------------------------------

/**
 * Le montage de référence des neutralisations : un porteur BLOQUÉ devant un
 * mur, une structure qui tire à côté, et une infanterie un peu plus loin.
 *
 * ⚠ LE PORTEUR NE BOUGE PAS, ET C'EST LA CONDITION DE TOUTE MESURE SUR 50
 * TICKS. Le Bélier a `structureOuAviation` pour prédilection : dès qu'il tire
 * sur le Merlon, `doitSArreter` le fige. Un porteur qui avance sortirait de sa
 * portée au bout d'une trentaine de ticks et la moitié des assertions
 * mesureraient un éloignement, pas une neutralisation — c'est ce qu'une
 * première version de ce montage a fait, avec une Meute qui avançait.
 *
 * ⚠ LE MERLON EST LA CIBLE DE TIR, LE GUETTEUR CELLE DU MODULE. Les deux sont
 * à portée, le Merlon est STRICTEMENT plus proche (1e6 contre 2e6) : une
 * implémentation qui reprendrait `e.cibleIndice` neutraliserait le mur.
 */
function sceneNeutralisation({ module = 'flashbang', niveauCible = 20, modules } = {}) {
  return creerCombat({
    niveau: 20,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
    defenseurs: [
      { id: 'merlon', rangee: 4, colonne: 5, niveau: 20 },
      { id: 'casemate', rangee: 4, colonne: 4, niveau: 20 },
      { id: 'guetteur', rangee: 4, colonne: 6, niveau: niveauCible },
    ],
    vagues: [[{ id: 'belier', colonne: 5, rangee: 2, niveau: 20 }]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: { offense: modules ?? [module], defense: [] },
    },
  });
}

/** Les entités du montage, par identifiant. */
function parId(etat, id) {
  const e = etat.entites.find((x) => x.id === id);
  assert.ok(e !== undefined, `montage : « ${id} » absent`);
  return e;
}

/** Les ticks où chaque entité nommée a réellement tiré, sur `n` ticks. */
function ticksDeTir(etat, ids, n) {
  const suivies = ids.map((id) => [id, parId(etat, id)]);
  const sortie = Object.fromEntries(ids.map((id) => [id, []]));
  for (let i = 0; i < n; i++) {
    tick(etat);
    for (const [id, e] of suivies) if (e.aTire) sortie[id].push(etat.tick);
  }
  return sortie;
}

test('MODULES-B T1 — le Flashbang désactive une infanterie, et pas une structure', () => {
  const etat = sceneNeutralisation();
  const belier = parId(etat, 'belier');
  const merlon = parId(etat, 'merlon');
  const casemate = parId(etat, 'casemate');
  const guetteur = parId(etat, 'guetteur');

  // ⚠ L'EFFET SE LIT AU TICK 1, PAS À L'ARRIVÉE : il a expiré depuis dix ticks
  // au tick 60, et l'y chercher ferait échouer un moteur parfaitement juste.
  tick(etat);
  assert.equal(belier.cibleIndice, merlon.indice,
    'montage : le Bélier doit viser le Merlon, sinon les deux cibles coïncident');
  assert.equal(guetteur.effetsTemporises.length, 1, 'le Guetteur n\'a pas été neutralisé');
  assert.equal(guetteur.effetsTemporises[0].nom, 'neutralise');
  assert.equal(guetteur.effetsTemporises[0].finTick, etat.tick + 50);
  assert.deepEqual(merlon.effetsTemporises, [], 'le Merlon a été neutralisé : cible prise sur le tir');
  assert.deepEqual(casemate.effetsTemporises, [], 'la Casemate a été neutralisée : filtre de colonne absent');
  assert.deepEqual(belier.modulesActifs, ['flashbang']);
  // ⚠ ET IL EST DÉJÀ MUET AU TICK 1. L'étape 3 bis passe AVANT le tir : posée
  // après, la cible tirerait une fois de plus que la durée annoncée — un tick
  // sur cinquante, invisible à l'œil et faux.
  assert.equal(guetteur.aTire, false, 'la cible a tiré au tick de sa neutralisation');
  assert.equal(parId(etat, 'casemate').aTire, true, 'montage : la tourelle doit tirer dès le tick 1');

  // ⚠ CONTRE-CAS DU MODULE NON ACHETÉ. Sans lui, retirer le contrôle
  // `moduleActif` ne ferait tomber aucun test de ce lot : tout Bélier
  // neutraliserait, acheté ou non.
  const sans = sceneNeutralisation({ modules: [] });
  for (let i = 0; i < 5; i++) tick(sans);
  assert.deepEqual(parId(sans, 'guetteur').effetsTemporises, [],
    'le module agit sans avoir été acheté');
  assert.deepEqual(parId(sans, 'belier').modulesActifs, []);

  const tirs = ticksDeTir(etat, ['guetteur', 'casemate'], 59);
  assert.equal(belier.rangeeMilli, 2000, 'montage : le Bélier a bougé, les portées ont changé');

  // 50 ticks de silence, puis il tire de nouveau — c'est la preuve de
  // NON-VACUITÉ : sans elle, un Guetteur mort ou hors de portée donnerait le
  // même silence.
  assert.deepEqual(tirs.guetteur, Array.from({ length: 10 }, (_, i) => 51 + i),
    `le Guetteur a tiré aux ticks ${tirs.guetteur.join(',')}`);
  assert.equal(tirs.casemate.length, 59, 'la structure voisine a cessé de tirer, elle aussi');
});

test('MODULES-B T2 — l\'EMP désactive un véhicule, artilleries comprises', () => {
  // ⚠ LES TROIS ARTILLERIES SONT DES VÉHICULES SANS ÊTRE DES BLINDÉS : leur
  // `chassis` est nul, c'est `COLONNE_PAR_TYPE_DEFENSE` qui les range en
  // `vehicule`. Une lecture du châssis brut ne trouverait aucune cible ici.
  const etat = creerCombat({
    niveau: 20,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
    defenseurs: [
      { id: 'faucheuse', rangee: 3, colonne: 5, niveau: 20 },
      { id: 'casemate', rangee: 3, colonne: 4, niveau: 20 },
      { id: 'guetteur', rangee: 3, colonne: 6, niveau: 20 },
    ],
    vagues: [[
      { id: 'crecelle', colonne: 5, rangee: 2, niveau: 20 },
      // ⚠ LA FAUCHEUSE A UNE PORTÉE MINIMALE DE 3,5 : elle ne peut PAS viser la
      // Crécelle qu'elle a sous le nez. Sans cette seconde unité au loin, elle
      // serait muette pour une raison étrangère à l'EMP et le test passerait à
      // vide.
      { id: 'carapace', colonne: 5, rangee: 8, niveau: 20 },
    ]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: { offense: ['emp'], defense: [] },
    },
  });
  const faucheuse = parId(etat, 'faucheuse');
  const tirs = ticksDeTir(etat, ['faucheuse', 'casemate', 'guetteur'], 12);

  assert.equal(faucheuse.effetsTemporises.length, 1, 'l\'artillerie n\'a pas été neutralisée');
  assert.deepEqual(parId(etat, 'crecelle').modulesActifs, ['emp']);
  // La tourelle est `structureOuAviation`, l'escouade `infanterie` : ni l'une
  // ni l'autre n'est un véhicule, et l'EMP ne les touche pas.
  assert.deepEqual(parId(etat, 'casemate').effetsTemporises, []);
  assert.deepEqual(parId(etat, 'guetteur').effetsTemporises, []);
  assert.deepEqual(tirs.faucheuse, [], 'l\'artillerie neutralisée a tiré');
  assert.equal(tirs.casemate.length, 12, 'la tourelle voisine a cessé de tirer');
  assert.equal(tirs.guetteur.length, 12, 'l\'escouade voisine a cessé de tirer');
});

test('MODULES-B T3 — la durée suit l\'écart de niveau, par soustraction', () => {
  // ⚠ SOUSTRACTIVE, PAS MULTIPLICATIVE. À +2 niveaux une pénalité de ×0,8 par
  // cran rendrait floor(50 × 0,64) = 32 ; la forme retenue rend 30. Et elle
  // atteint ZÉRO à +5, ce qu'un produit ne fait jamais.
  const duree = (niveauCible) => {
    const etat = sceneNeutralisation({ niveauCible });
    tick(etat);
    const eff = parId(etat, 'guetteur').effetsTemporises[0];
    return eff === undefined ? 0 : eff.finTick - etat.tick;
  };
  assert.equal(duree(10), 50, 'une cible plus basse ne prolonge rien');
  assert.equal(duree(20), 50);
  assert.equal(duree(21), 40);
  assert.equal(duree(22), 30);
  assert.equal(duree(23), 20);
  assert.equal(duree(24), 10);
  assert.equal(duree(25), 0);
  assert.equal(duree(30), 0, 'la durée ne redevient jamais négative');
});

test('MODULES-B T4 — une durée nulle ne consomme pas l\'usage', () => {
  // C'est la garde du §3.2.3 du brief, et la plus facile à perdre : marquer le
  // porteur AVANT de mesurer la durée gâcherait un module payé des dizaines de
  // millions de points contre une cible qu'il ne pouvait pas toucher.
  const etat = sceneNeutralisation({ niveauCible: 25 });
  const belier = parId(etat, 'belier');
  const guetteur = parId(etat, 'guetteur');
  for (let i = 0; i < 10; i++) tick(etat);
  assert.deepEqual(belier.modulesActifs, [], 'l\'usage a été consommé pour zéro tick');
  assert.deepEqual(guetteur.effetsTemporises, [], 'un effet de zéro tick a été posé');

  // Et le porteur retente : une cible atteignable apparaît, elle est
  // neutralisée pleinement.
  const arrivee = { id: 'meute', camp: 'defense', genre: 'unite', rangee: 4, colonne: 5, niveau: 20 };
  void arrivee; // le montage direct suffit — voir ci-dessous.
  const etat2 = sceneNeutralisation({ niveauCible: 25 });
  // On abaisse le niveau de la cible en cours de combat : le porteur n'ayant
  // rien consommé, il doit mordre au tick suivant.
  for (let i = 0; i < 10; i++) tick(etat2);
  parId(etat2, 'guetteur').niveau = 20;
  tick(etat2);
  assert.deepEqual(parId(etat2, 'belier').modulesActifs, ['flashbang'],
    'le porteur n\'a pas retenté après un premier essai à zéro tick');
  assert.equal(parId(etat2, 'guetteur').effetsTemporises[0].finTick, etat2.tick + 50);
});

test('MODULES-B T5 — une seule fois par combat, la marque ne se retire jamais', () => {
  const etat = sceneNeutralisation();
  const belier = parId(etat, 'belier');
  const guetteur = parId(etat, 'guetteur');
  for (let i = 0; i < 60; i++) tick(etat);
  // L'effet a expiré depuis dix ticks, la cible est toujours là, à portée.
  assert.deepEqual(guetteur.effetsTemporises, [], 'l\'effet n\'a pas expiré');
  assert.ok(guetteur.vivant && !guetteur.sorti, 'montage : la cible doit être encore en jeu');
  assert.deepEqual(belier.modulesActifs, ['flashbang'], 'la marque a été retirée ou doublée');
  // Cinquante ticks de plus : toujours aucune seconde neutralisation.
  for (let i = 0; i < 50; i++) tick(etat);
  assert.deepEqual(guetteur.effetsTemporises, [], 'le module a redéclenché');
  assert.deepEqual(belier.modulesActifs, ['flashbang']);
});

test('MODULES-B T6 — la neutralisée garde sa cible et la reprend', () => {
  // ⚠ LA GARDE EST DANS `tir`, PAS DANS `ciblage`. Posée au ciblage,
  // `cibleIndice` vaudrait `null` pendant toute la fenêtre — et `doitSArreter`
  // lisant le ciblage, le MOUVEMENT changerait, ce qu'aucune description ne dit.
  const etat = sceneNeutralisation();
  const guetteur = parId(etat, 'guetteur');
  const belier = parId(etat, 'belier');
  tick(etat);
  const cibleAvant = guetteur.cibleIndice;
  assert.equal(cibleAvant, belier.indice, 'montage : le Guetteur doit viser le Bélier');
  const cibles = [];
  for (let i = 0; i < 49; i++) { tick(etat); cibles.push(guetteur.cibleIndice); }
  assert.ok(cibles.every((c) => c === cibleAvant),
    'la cible a été vidée pendant la neutralisation : la garde est au ciblage');
  assert.equal(guetteur.aTire, false, 'la neutralisée a tiré au tick 50');
  tick(etat); // tick 51 — l'effet a expiré à l'entrée du tick
  assert.equal(guetteur.aTire, true, 'la neutralisée n\'a pas repris au tick 51');
  assert.equal(guetteur.cibleIndice, cibleAvant, 'elle a reciblé au lieu de reprendre');
});

test('MODULES-B T7 — une neutralisée ne fait pas non plus de Tir de barrage', () => {
  // ⚠⚠ CET ÉTAT N'EST PAS ATTEIGNABLE PAR LE JEU AUJOURD'HUI, ET C'EST DIT.
  // `declencherNeutralisations` ne balaie que le camp `attaque` : seuls des
  // DÉFENSEURS sont neutralisés, et le barrage d'un défenseur n'a aucune cible
  // (les structures adverses n'existent pas côté attaque). L'effet est donc
  // POSÉ À LA MAIN, sous la forme exacte que `expirerEffets` sait filtrer. Ce
  // que ce test verrouille est la POSITION de la garde : avant l'appel à
  // `tirDeBarrage`, pas après. Une garde placée juste après le tir principal
  // laisserait les éclaboussures partir.
  const monter = () => creerCombat({
    niveau: 20,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
    defenseurs: [
      { id: 'casemate', rangee: 4, colonne: 5, niveau: 20 },
      { id: 'merlon', rangee: 4, colonne: 6, niveau: 20 },
    ],
    vagues: [[{ id: 'perceurs', colonne: 5, rangee: 3, niveau: 20 }]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: { offense: ['tirDeBarrage'], defense: [] },
    },
  });

  const temoin = monter();
  const pvTemoin = () => parId(temoin, 'merlon').pvMilli;
  const avant = pvTemoin();
  tick(temoin);
  assert.ok(pvTemoin() < avant, 'montage : sans neutralisation, le barrage doit mordre');

  const etat = monter();
  const perceurs = parId(etat, 'perceurs');
  const merlon = parId(etat, 'merlon');
  const casemate = parId(etat, 'casemate');
  const pvMerlon = merlon.pvMilli;
  const pvCasemate = casemate.pvMilli;
  // ⚠ `finTick` STRICTEMENT AU-DELÀ DU TICK OBSERVÉ. `expirerEffets` est
  // l'étape 1 : posé à `finTick: 1`, l'effet serait balayé avant le tir du
  // tick 1 et le test passerait à vide, sur un moteur sans aucune garde.
  perceurs.effetsTemporises.push({ nom: 'neutralise', finTick: 2 });
  tick(etat);
  assert.equal(perceurs.effetsTemporises.length, 1, 'montage : l\'effet a expiré avant le tir');
  assert.equal(merlon.pvMilli, pvMerlon, 'la voisine a encaissé un barrage de neutralisée');
  assert.equal(casemate.pvMilli, pvCasemate, 'la cible a encaissé un tir de neutralisée');
  assert.equal(perceurs.aTire, false);
});

test('MODULES-B T8 — Camouflage : invisible, révélé par sa cible de prédilection, puis relâché', () => {
  // Le Guetteur porte le Camouflage et sa colonne de prédilection est
  // l'infanterie. Trois phases, trois montages qui ne diffèrent que d'un
  // détail, et chacune a son contre-montage.
  const seul = (avecModule) => creerCombat({
    niveau: 20,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
    defenseurs: [{ id: 'casemate', rangee: 4, colonne: 6, niveau: 20 }],
    vagues: [[{ id: 'guetteur', colonne: 5, rangee: 3, niveau: 20 }]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: { offense: avecModule ? ['camouflage'] : [], defense: [] },
    },
  });

  // (a) Aucune infanterie sur la grille : le Guetteur est invisible.
  const invisible = seul(true);
  const gInvisible = parId(invisible, 'guetteur');
  const casInvisible = parId(invisible, 'casemate');
  const pv0 = gInvisible.pvMilli;
  for (let i = 0; i < 5; i += 1) {
    tick(invisible);
    assert.equal(casInvisible.cibleIndice, null, `t${invisible.tick} : la tourelle vise un camouflé`);
  }
  assert.equal(gInvisible.pvMilli, pv0, 'le camouflé a encaissé des dégâts');

  // ⚠ CONTRE-MONTAGE OBLIGATOIRE : sans le module, la MÊME scène doit donner
  // l'inverse. Sans lui, « cibleIndice null » prouverait seulement que la
  // tourelle ne porte pas.
  const visible = seul(false);
  const gVisible = parId(visible, 'guetteur');
  const casVisible = parId(visible, 'casemate');
  for (let i = 0; i < 5; i += 1) tick(visible);
  assert.equal(casVisible.cibleIndice, gVisible.indice, 'témoin : la tourelle devrait viser');
  assert.ok(gVisible.pvMilli < pv0, 'témoin : le non-camouflé devrait encaisser');

  // (b) et (c) Une Meute d'infanterie entre à portée : le Camouflage tombe.
  // Elle meurt sous les tirs du Guetteur, qui se recamoufle — et la tourelle
  // le lâche.
  const avecMeute = (avecModule) => creerCombat({
    niveau: 20,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
    defenseurs: [
      // ⚠ La Meute est en colonne 5, PLUS PROCHE que la tourelle : c'est elle
      // que le Guetteur vise, et comme c'est sa colonne de prédilection il
      // s'immobilise (`doitSArreter`). Le montage ne dérive pas.
      { id: 'meute', rangee: 4, colonne: 5, niveau: 1 },
      { id: 'casemate', rangee: 4, colonne: 6, niveau: 20 },
    ],
    vagues: [[{ id: 'guetteur', colonne: 5, rangee: 3, niveau: 20 }]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: { offense: avecModule ? ['camouflage'] : [], defense: [] },
    },
  });

  const etat = avecMeute(true);
  const g = parId(etat, 'guetteur');
  const cas = parId(etat, 'casemate');
  const meute = parId(etat, 'meute');
  tick(etat);
  // (b) Révélé dès le premier tick : la Meute est à portée.
  assert.equal(cas.cibleIndice, g.indice, 'révélé par une cible de prédilection à portée');
  assert.ok(g.pvMilli < pv0, 'un révélé encaisse');

  let mortAu = 0;
  for (let i = 0; i < 4; i += 1) {
    tick(etat);
    if (!meute.vivant && mortAu === 0) mortAu = etat.tick;
    assert.equal(cas.cibleIndice, g.indice, `t${etat.tick} : la tourelle a lâché trop tôt`);
  }
  assert.equal(mortAu, 5, 'montage : la Meute doit mourir au tick 5');

  // (c) Recamouflé : la tourelle le lâche au tick suivant, et cesse de mordre.
  // ⚠ C'EST LA GARDE DU BLOC « CIBLE CONSERVÉE ». Un patch qui n'emploierait
  // le `Set` que dans la boucle des candidats garderait la cible acquise.
  const pvAuLache = g.pvMilli;
  tick(etat);
  assert.equal(cas.cibleIndice, null, 'la tourelle garde un camouflé comme cible conservée');
  for (let i = 0; i < 4; i += 1) tick(etat);
  assert.equal(g.pvMilli, pvAuLache, 'le recamouflé encaisse encore');

  // Contre-montage : sans le module, la tourelle ne lâche jamais.
  const temoin = avecMeute(false);
  const gT = parId(temoin, 'guetteur');
  const casT = parId(temoin, 'casemate');
  for (let i = 0; i < 5; i += 1) tick(temoin);
  const pvT = gT.pvMilli;
  tick(temoin);
  assert.equal(casT.cibleIndice, gT.indice, 'témoin : la tourelle devrait garder sa cible');
  assert.ok(gT.pvMilli < pvT, 'témoin : elle devrait continuer à mordre');
});

test('MODULES-B T9 — le Booster ne franchit rien (arbitrage 2)', () => {
  // ⚠⚠ CE TEST NE PORTE PAS SUR CE LOT. Il verrouille un comportement qui
  // existe déjà et qu'Ethan a confirmé le 31/08/2026 : le Booster accélère, il
  // ne traverse pas. Aucune ligne de `deplacement` n'a été touchée pour lui.
  //
  // ⚠ ET CE N'EST PAS `peutAvancer` QUI REFUSE, MESURÉ AU SABOTAGE. Forcée à
  // `true`, la fonction ne fait franchir aucun mur : elle alimente `progresse`,
  // donc le repli et le forçage de l'Écraseur. Le refus d'avancer est exécuté à
  // la FIN de `deplacement`, sur la case occupée que `peutEcraser` refuse. Ce
  // test tombe quand ce bloc-là est contourné, pas quand `peutAvancer` l'est.
  const monter = (avecMur) => creerCombat({
    niveau: 1,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 18, colonne: 1, niveau: 1 }],
    defenseurs: [
      // La Ronce blesse au passage : c'est elle qui ouvre la fenêtre du Booster.
      { id: 'ronce', rangee: 3, colonne: 5, niveau: 1 },
      ...(avecMur ? [{ id: 'merlon', rangee: 8, colonne: 5, niveau: 20 }] : []),
    ],
    vagues: [[{ id: 'carapace', colonne: 5, rangee: 2, niveau: 20 }]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: { offense: ['booster'], defense: [] },
    },
  });

  const etat = monter(true);
  const u = etat.entites.find((e) => e.camp === 'attaque');
  const mur = parId(etat, 'merlon');
  let sousEffetAuBlocage = null;
  let precedent = u.rangeeMilli;
  for (let t = 1; t <= 48 && !etat.termine; t += 1) {
    tick(etat);
    if (u.rangeeMilli === precedent && sousEffetAuBlocage === null) {
      sousEffetAuBlocage = u.effetsTemporises.length;
    }
    precedent = u.rangeeMilli;
  }
  // Le mur est en rangée 8 : la boostée s'arrête en rangée 7 et n'en sort pas.
  assert.equal(caseDepuisMilli(u.rangeeMilli), 7, 'la boostée a dépassé la rangée du mur');
  assert.ok(u.rangeeMilli < 8000, `rangeeMilli ${u.rangeeMilli} : le mur est franchi`);
  assert.ok(mur.vivant, 'montage : le mur doit tenir tout le relevé');
  // ⚠ ET LE BLOCAGE A LIEU PENDANT LA FENÊTRE, pas après elle. Sans cette
  // assertion, un moteur qui franchirait le mur à ×10 puis s'arrêterait plus
  // loin passerait le test.
  assert.equal(sousEffetAuBlocage, 1, 'la boostée n\'était pas sous effet au moment du blocage');

  // ⚠ TÉMOIN : le MÊME montage sans le mur. Sans lui, « rangée 7 » prouverait
  // seulement que 48 ticks ne suffisent pas à aller plus loin.
  const libre = monter(false);
  const v = libre.entites.find((e) => e.camp === 'attaque');
  for (let t = 1; t <= 48 && !libre.termine; t += 1) tick(libre);
  assert.ok(v.rangeeMilli > 8000,
    `témoin : sans mur la boostée devrait dépasser 8 000, elle est à ${v.rangeeMilli}`);

  // Le second volet de l'arbitrage — « ralenti par les obstacles » — est mesuré
  // par MODULES-A T5 (240 sous obstacle, et non 600). On en garde ici le seul
  // rapport, qui est ce que l'arbitrage énonce : le ×10 s'applique APRÈS.
  const carapace = UNITES.carapace;
  assert.equal(carapace.vitesse, 60);
  assert.equal((carapace.vitesse / 2.5) * 10, 240, 'le ×10 sous obstacle ne vaut pas 240');
});

/**
 * Projection CANONIQUE d'un état : indépendante de l'ordre de déclaration.
 *
 * ⚠ ÉCART AU BRIEF, MESURÉ. Le §6 propose de comparer `serialiserEtat` après
 * permutation des défenseurs. C'EST IMPOSSIBLE, et déjà sur `main` sans aucun
 * camouflage : permuter deux défenseurs permute leurs `indice`, or l'état les
 * porte (`entites` est un tableau, `cibleIndice` un rang dans ce tableau). Deux
 * résolutions identiques rendent donc deux chaînes différentes. Ce qui doit
 * être identique, c'est le RÉSULTAT : chaque entité, désignée par son identité
 * et non par son rang, dans le même état — cible comprise, réécrite en identité.
 */
function projectionCanonique(etat) {
  const cle = (e) => `${e.id}@${e.camp}`;
  return etat.entites.map((e) => [
    cle(e), e.colonne, e.rangeeMilli, e.pvMilli, e.vivant ? 1 : 0,
    e.cibleIndice === null ? '-' : cle(etat.entites[e.cibleIndice]),
    [...e.modulesActifs].sort().join('|'),
    e.effetsTemporises.map((f) => `${f.nom}:${f.finTick}`).sort().join('|'),
    // ⚠ ÉTENDUE AU LOT MODULES-C, PAS DUPLIQUÉE. Sans le réservoir, cette
    // projection serait AVEUGLE au seul état que le Bouclier ajoute, et
    // `MODULES-C T9` passerait sans rien mesurer de ce lot.
    e.bouclierMilli,
    // ⚠ ÉTENDUE UNE SECONDE FOIS AU LOT MODULES-D, pour la même raison : la
    // portée et le plafond de PV quittent le profil pour l'entité, et sans eux
    // `MODULES-D T14` serait aveugle aux trois modules qu'il prétend mesurer.
    e.porteeCarree, e.porteeMiniCarree, e.pvMaxMilli,
  ].join(' ')).sort();
}

/** Le montage des trois modules à la fois, défenseurs dans l'ordre demandé. */
function montageTroisModules(ordre) {
  const defenseurs = [
    { id: 'casemate', rangee: 4, colonne: 6, niveau: 20 },
    { id: 'meute', rangee: 4, colonne: 5, niveau: 1 },
    { id: 'merlon', rangee: 5, colonne: 4, niveau: 20 },
    { id: 'ronce', rangee: 6, colonne: 7, niveau: 1 },
    // ⚠ L'ARTILLERIE EST LA COLONNE `vehicule` : sans elle l'EMP n'a rien à
    // neutraliser et le montage ne prouverait rien sur deux modules sur trois.
    { id: 'faucheuse', rangee: 9, colonne: 5, niveau: 20 },
  ];
  return creerCombat({
    niveau: 20,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
    defenseurs: ordre.map((i) => defenseurs[i]),
    vagues: [[
      { id: 'guetteur', colonne: 5, rangee: 3, niveau: 20 }, // camouflage
      { id: 'belier', colonne: 6, rangee: 2, niveau: 20 }, // flashbang
      { id: 'crecelle', colonne: 4, rangee: 2, niveau: 20 }, // emp
    ]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: { offense: ['camouflage', 'flashbang', 'emp'], defense: [] },
    },
  });
}

test('MODULES-B T10 — le ciblage ne dépend pas de l\'ordre de déclaration', () => {
  const a = montageTroisModules([0, 1, 2, 3, 4]);
  const b = montageTroisModules([4, 3, 2, 1, 0]);

  // ⚠ MONTAGE : la permutation doit VRAIMENT permuter. Sans cette garde, deux
  // montages identiques donneraient trivialement le même résultat.
  const rangs = (etat) => etat.entites.map((e) => e.id).join(',');
  assert.notEqual(rangs(a), rangs(b), 'montage : les deux ordres sont identiques');

  for (let t = 0; t < 60; t += 1) { tick(a); tick(b); }
  assert.deepEqual(projectionCanonique(a), projectionCanonique(b),
    'le résultat dépend de l\'ordre de déclaration des défenseurs');

  // ⚠ ET LES TROIS MODULES ONT BIEN JOUÉ. Sans ces trois gardes, un montage où
  // aucun module ne se déclenche passerait le test en ne prouvant rien.
  const marques = a.entites.flatMap((e) => e.modulesActifs).sort();
  assert.deepEqual(marques, ['emp', 'flashbang'],
    'montage : le Flashbang et l\'EMP doivent s\'être déclenchés');
  const neutralisees = a.entites.filter((e) => e.effetsTemporises.some((f) => f.nom === 'neutralise'));
  assert.equal(neutralisees.length, 1, 'montage : une entité doit être neutralisée');
  // Le Camouflage : la Meute a bien fini par viser le Guetteur camouflé — donc
  // la révélation a joué, donc le `Set` a été consulté.
  const meute = a.entites.find((e) => e.id === 'meute' && e.camp === 'defense');
  const guetteur = a.entites.find((e) => e.id === 'guetteur');
  assert.equal(meute.cibleIndice, guetteur.indice, 'montage : le Camouflage n\'a pas été exercé');
});

test('MODULES-B T11 — le déterminisme tient avec les trois modules', () => {
  const trace = () => {
    const etat = montageTroisModules([0, 1, 2, 3, 4]);
    const lignes = [];
    for (let t = 0; t < 60; t += 1) { tick(etat); lignes.push(serialiserEtat(etat)); }
    return lignes;
  };
  const un = trace();
  const deux = trace();
  assert.equal(un.length, 60);
  for (let t = 0; t < 60; t += 1) {
    assert.equal(un[t], deux[t], `divergence au tick ${t + 1}`);
  }
  // ⚠ CE QUE CE TEST GARDE VRAIMENT : `effetsTemporises` ne contient que des
  // entiers et des chaînes. `serialiserEtat` passe par `normaliser`, qui trie
  // les clés ; un objet non triable ou une référence y ferait diverger deux
  // résolutions pourtant identiques. La preuve est ici : l'effet posé par la
  // neutralisation est bien dans la chaîne.
  assert.ok(un.at(-1).includes('neutralise'),
    'montage : aucune neutralisation n\'apparaît dans l\'état sérialisé');
});

test('MODULES-B T12 — un seul mécanisme pour les deux modules', () => {
  // ⚠ LE COMPTE EST SUR LA SOURCE, et il refuse un cas particulier nommé à la
  // main. Deux fonctions jumelles seraient deux barèmes pour une grandeur : la
  // première correction d'équilibrage n'en toucherait qu'une.
  const source = readFileSync(new URL('../src/sim/combat.js', import.meta.url), 'utf8');
  // ⚠ LES COMMENTAIRES DE FIN DE LIGNE COMPTENT AUSSI. La ligne de `tick()` qui
  // annonce l'étape 3 bis nomme les deux modules en clair : un filtre qui ne
  // retire que les lignes COMMENÇANT par `//` la laisserait passer, et le test
  // accuserait un doublon qui n'existe pas. Mesuré : il l'a fait.
  const sansCommentaires = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');

  // La table est la SEULE à nommer les deux modules, et elle les nomme une fois.
  for (const nom of ['flashbang', 'emp']) {
    const n = (sansCommentaires.match(new RegExp(`(?<![\\p{L}\\p{N}_'])${nom}(?![\\p{L}\\p{N}_])`, 'gu')) ?? []).length;
    assert.equal(n, 1, `« ${nom} » apparaît ${n} fois dans le code de combat, 1 attendue`);
  }
  // Et une seule fonction de déclenchement, une seule de durée, une seule de cible.
  for (const f of ['declencherNeutralisations', 'ticksDeNeutralisation', 'cibleDeNeutralisation']) {
    const n = (sansCommentaires.match(new RegExp(`function ${f}\\(`, 'g')) ?? []).length;
    assert.equal(n, 1, `${f} déclarée ${n} fois`);
  }
  // Falsifiable : le motif doit savoir compter quand il y en a deux.
  const appat = 'const x = flashbang; const y = flashbang;';
  assert.equal((appat.match(/(?<![\p{L}\p{N}_'])flashbang(?![\p{L}\p{N}_])/gu) ?? []).length, 2);
  // Et le filtre de commentaires doit mordre sur une fin de ligne.
  assert.equal('const t = 1; // flashbang'.replace(/\/\/.*$/, '').includes('flashbang'), false);
});

test('MODULES-B T13 — `cable` par branche pour les trois modules', () => {
  for (const nom of ['flashbang', 'emp', 'camouflage']) {
    assert.equal(moduleEstCable(nom, 'offense'), true, `${nom} en offense`);
    assert.equal(moduleEstCable(nom, 'defense'), false, `${nom} en défense`);
  }
  // ⚠ UN SEUL DEPUIS MODULES-F : le Bouclier avait quitté cette liste au lot C,
  // les quatre modules défensifs au lot D, la Munition spéciale et le Vol de
  // vie au lot F. Le compte est la liste, et c'est `MODULES-A T9` qui porte
  // désormais la référence — celle-ci reste ici pour que le lot B tombe si un
  // lot futur décâble l'un de ses trois modules sans le dire. Le seul qui reste
  // est la GARNISON, en attente d'arbitrage : c'est le dernier module sans
  // effet du catalogue.
  const restants = Object.entries(MODULES)
    .filter(([, m]) => !m.cable.offense && !m.cable.defense).map(([n]) => n).sort();
  assert.deepEqual(restants, ['garnison']);

  // L'achat : cinq lignes s'ouvrent en offense, quatre refusent en défense.
  const etat = partie('999999999999999');
  const ouvertes = [];
  const refusees = [];
  for (const branche of BRANCHES) {
    for (const id of Object.keys(ARBRE_RECHERCHE[branche])) {
      const nom = nomDuModule(branche, id);
      if (!['flashbang', 'emp', 'camouflage'].includes(nom)) continue;
      if (!estAcquise(etat, branche, id)) acheter(etat, branche, id, 'unite');
      const pb = problemesDeLAchat(etat, branche, id, 'module');
      if (branche === 'offense') {
        assert.deepEqual(pb, [], `${branche}/${id} refuse alors qu'il est câblé`);
        acheter(etat, branche, id, 'module');
        ouvertes.push(`${branche}/${id}`);
      } else {
        assert.deepEqual(pb.map((x) => x.code), ['effetNonCable'], `${branche}/${id}`);
        // ⚠ LA MENTION NOMME LA BRANCHE, avec son accent : l'autre branche du
        // même module vient d'être achetée, « effet à venir » serait faux.
        assert.equal(pb[0].message, `${MODULES[nom].libelle} n'a pas d'effet en défense`);
        refusees.push(`${branche}/${id}`);
      }
    }
  }
  // ⚠ MESURÉ, PAS REPRIS DU BRIEF : il annonce « six lignes qui s'ouvrent »,
  // il y en a CINQ. Les porteurs sont la Meute et le Bélier (Flashbang), la
  // Crécelle (EMP), le Guetteur et le Frappeur (Camouflage).
  assert.deepEqual(ouvertes.sort(), [
    'offense/belier', 'offense/crecelle', 'offense/frappeur',
    'offense/guetteur', 'offense/meute',
  ]);
  assert.deepEqual(refusees.sort(), [
    'defense/belier', 'defense/carapace', 'defense/fendeur', 'defense/meute',
  ]);
});

test('MODULES-B T14 — le départage de la neutralisation est celui de `ciblage`, à la lettre', () => {
  // ⚠ MESURÉ APRÈS COUP : sans ce test, RETIRER les deux lignes de départage de
  // `cibleDeNeutralisation` ne faisait tomber aucun test — la cible aurait été
  // celle que l'ordre de déclaration présente la première. C'était le seul trou
  // de la matrice de falsification.
  const aEgaleDistance = (ordre, positions, forgerRangee) => {
    const etat = creerCombat({
      niveau: 20,
      obstacles: [],
      batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
      defenseurs: ordre.map((i) => positions[i]),
      vagues: [[{ id: 'belier', colonne: 5, rangee: 2, niveau: 20 }]],
      modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: { offense: ['flashbang'], defense: [] },
    },
    });
    if (forgerRangee !== undefined) {
      etat.entites.find((e) => e.camp === 'attaque').rangeeMilli = forgerRangee;
    }
    tick(etat);
    const touchees = etat.entites.filter(
      (e) => e.effetsTemporises.some((f) => f.nom === 'neutralise'),
    );
    assert.equal(touchees.length, 1, 'montage : une seule neutralisée attendue');
    return touchees[0];
  };

  // 1) Même distance, colonnes différentes → la PLUS PETITE colonne.
  const parColonne = [
    { id: 'meute', rangee: 4, colonne: 4, niveau: 20 },
    { id: 'meute', rangee: 4, colonne: 6, niveau: 20 },
  ];
  for (const ordre of [[0, 1], [1, 0]]) {
    const v = aEgaleDistance(ordre, parColonne);
    assert.equal(v.colonne, 4, `ordre ${ordre.join('')} : la colonne 6 a été retenue`);
  }

  // 2) Même distance, même colonne → la PLUS PETITE rangée.
  //
  // ⚠ POSITION FORGÉE, ET C'EST DIT. Un attaquant se déploie en rangée 1-2 et
  // les défenses en 3-10 : il n'est jamais À ÉGALE DISTANCE de deux défenses
  // d'une même colonne dans une partie réelle. Le départage existe quand même,
  // il est celui de `ciblage`, et rien d'autre qu'une position posée à la main
  // ne peut l'exercer aujourd'hui.
  const parRangee = [
    { id: 'meute', rangee: 4, colonne: 5, niveau: 20 },
    { id: 'meute', rangee: 8, colonne: 5, niveau: 20 },
  ];
  for (const ordre of [[0, 1], [1, 0]]) {
    const v = aEgaleDistance(ordre, parRangee, 6000);
    assert.equal(v.rangeeMilli, 4000, `ordre ${ordre.join('')} : la rangée 8 a été retenue`);
  }
});

test('MODULES-B T15 — deux porteurs empilent leurs effets, et le plus long fait foi', () => {
  // ⚠ COMPORTEMENT CONSTATÉ EN RAID, PAS DEMANDÉ PAR LE BRIEF. Deux porteurs
  // peuvent neutraliser la MÊME cible : `declencherNeutralisations` empile un
  // second `neutralise` au lieu d'en remplacer un. C'est sans danger —
  // `estNeutralisee` est un `.some()`, donc le plus long fait foi — mais ce
  // n'est écrit nulle part, et une implémentation qui « remplacerait » l'effet
  // raccourcirait silencieusement la neutralisation. Ce test fige ce qui est.
  const monter = (avecLeSecond) => creerCombat({
    niveau: 20,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
    defenseurs: [
      { id: 'merlon', rangee: 4, colonne: 5, niveau: 30 },
      { id: 'belier', rangee: 4, colonne: 6, niveau: 30 },
    ],
    vagues: [[
      { id: 'crecelle', colonne: 5, rangee: 2, niveau: 30 }, // écart 0 → 50 ticks
      ...(avecLeSecond ? [{ id: 'crecelle', colonne: 6, rangee: 2, niveau: 28 }] : []),
    ]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: { offense: ['emp'], defense: [] },
    },
  });

  const etat = monter(true);
  const cible = etat.entites.find((e) => e.id === 'belier' && e.camp === 'defense');
  const fin = (n) => cible.effetsTemporises.map((f) => f.finTick).sort((a, b) => a - b)[n];
  let tirs = 0;
  const relevé = {};
  for (let t = 1; t <= 60; t += 1) {
    tick(etat);
    if (cible.aTire) tirs += 1;
    relevé[t] = { n: cible.effetsTemporises.length, tirs };
  }
  assert.ok(cible.vivant, 'montage : la cible doit survivre au relevé');

  // Les deux effets se sont bien empilés, avec des échéances DIFFÉRENTES —
  // 30 ticks pour le porteur de niveau 28, 50 pour celui de niveau 30.
  assert.equal(relevé[12].n, 2, 'les deux effets ne se sont pas empilés');
  // L'échéance courte tombe la première, la longue reste.
  assert.equal(relevé[35].n, 2);
  assert.equal(relevé[36].n, 1, 'l\'échéance courte n\'a pas expiré seule');
  assert.equal(relevé[58].n, 1, 'l\'échéance longue est tombée avec la courte');
  assert.equal(relevé[59].n, 0);
  // Et la cible est restée muette TOUT du long, y compris après l'expiration de
  // la courte : c'est le `.some()` d'`estNeutralisee`.
  assert.equal(relevé[5].tirs, 5, 'montage : la cible doit tirer avant d\'être neutralisée');
  assert.equal(relevé[58].tirs, 5, 'la cible a repris le tir pendant l\'effet long');

  // ⚠ CONTRE-MONTAGE : un seul porteur ne pose qu'UN effet. Sans lui,
  // « deux effets » ne distinguerait pas l'empilement d'un doublon de montage.
  const seul = monter(false);
  const cibleSeule = seul.entites.find((e) => e.id === 'belier' && e.camp === 'defense');
  for (let t = 1; t <= 12; t += 1) tick(seul);
  assert.equal(cibleSeule.effetsTemporises.length, 1, 'un seul porteur pose plus d\'un effet');
});

// ---------------------------------------------------------------------------
// Lot MODULES-C — Bouclier
// ---------------------------------------------------------------------------

/**
 * ⚠ LE DÉPLACEMENT EST L'ÉTAPE 7, LES DÉGÂTS L'ÉTAPE 5. La distance qui compte
 * pour l'absorption est donc celle d'AVANT le tick, pas celle qu'on lit après —
 * une première écriture de ces tests a mesuré après coup et a conclu que la
 * borne de 2,5 n'était pas comprise, alors qu'elle l'est.
 */
const BOUCLIER_RAYON_MILLI = 2500;

/**
 * Un porteur de Bouclier (Enclume) et un allié (Meute) devant un mur, sous le
 * feu d'une casemate. Le montage se STABILISE : à partir du 20ᵉ tick plus
 * personne n'avance, ce qui rend les distances forgées reproductibles.
 */
function sceneBouclier({ modules = ['bouclier'], defenseurs, vague } = {}) {
  return creerCombat({
    niveau: 20,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
    defenseurs: defenseurs ?? [
      { id: 'merlon', rangee: 5, colonne: 5, niveau: 30 },
      { id: 'casemate', rangee: 5, colonne: 4, niveau: 20 },
    ],
    vagues: [vague ?? [
      { id: 'meute', colonne: 5, rangee: 4, niveau: 20 },
      { id: 'enclume', colonne: 5, rangee: 2, niveau: 20 },
    ]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: { offense: modules, defense: [] },
    },
  });
}

/** Amène la scène à son état figé et rend ses acteurs. */
function bouclierStabilise(scene) {
  const etat = scene ?? sceneBouclier();
  for (let t = 1; t <= 20; t += 1) tick(etat);
  const allie = etat.entites.find((e) => e.id === 'meute' && e.camp === 'attaque');
  const porteur = etat.entites.find((e) => e.id === 'enclume');
  const tireur = etat.entites.find((e) => e.id === 'casemate');
  assert.ok(allie !== undefined && porteur !== undefined && tireur !== undefined, 'montage');
  assert.equal(etat.entites[tireur.cibleIndice]?.indice, allie.indice,
    'montage : la casemate doit viser l\'allié, pas le porteur');
  assert.ok(porteur.bouclierMilli > 0, 'montage : le réservoir doit être plein');
  return { etat, allie, porteur, tireur };
}

test('MODULES-C T1 — le rayon est de 2 500 MILLI-cases, borne comprise', () => {
  const { etat, allie, porteur, tireur } = bouclierStabilise();

  /** Place le porteur à `d` milli-cases de l'allié et joue UN tick. */
  const a = (d) => {
    porteur.rangeeMilli = allie.rangeeMilli - d;
    const d2 = distanceCarree(
      porteur.rangeeMilli, porteur.colonne, allie.rangeeMilli, allie.colonne,
    );
    assert.equal(d2, d * d, 'montage : les deux acteurs doivent être sur la même colonne');
    const pv = allie.pvMilli;
    const res = porteur.bouclierMilli;
    tick(etat);
    assert.equal(etat.entites[tireur.cibleIndice]?.indice, allie.indice,
      `montage : la casemate a changé de cible à d=${d}`);
    return { pvPerdus: pv - allie.pvMilli, absorbe: res - porteur.bouclierMilli };
  };

  // ⚠⚠ C'EST LE PIÈGE DU LOT, ET CE TEST EST LÀ POUR LUI. `distanceCarree` rend
  // un carré de MILLI-cases : un seuil écrit `2.5 * 2.5` ferait échouer DÈS
  // d = 2 000, c'est-à-dire deux cases — le bouclier ne couvrirait plus que la
  // case du porteur. Les deux premières lignes suffisent à l'attraper.
  const deuxCases = a(2 * BOUCLIER_RAYON_MILLI / 2.5);
  assert.equal(deuxCases.pvPerdus, 0, 'à 2 cases, l\'allié n\'est pas couvert');
  assert.ok(deuxCases.absorbe > 0, 'à 2 cases, le réservoir n\'a rien pris');

  const troisCases = a(3 * BOUCLIER_RAYON_MILLI / 2.5);
  assert.ok(troisCases.pvPerdus > 0, 'à 3 cases, l\'allié est couvert alors qu\'il est hors rayon');
  assert.equal(troisCases.absorbe, 0, 'à 3 cases, le réservoir a pris quelque chose');

  // La borne est COMPRISE, et elle est franche à la milli-case près.
  const juste = a(BOUCLIER_RAYON_MILLI);
  assert.equal(juste.pvPerdus, 0, 'à 2,5 cases pile, l\'allié n\'est pas couvert : borne exclue ?');
  assert.ok(juste.absorbe > 0);
  const audela = a(BOUCLIER_RAYON_MILLI + 1);
  assert.ok(audela.pvPerdus > 0, 'une milli-case au-delà de la borne, l\'allié est encore couvert');
  assert.equal(audela.absorbe, 0);
  // Et la milli-case juste en deçà est, elle, couverte.
  assert.equal(a(BOUCLIER_RAYON_MILLI - 1).pvPerdus, 0);

  // ⚠ CE QUI FALSIFIERAIT CE TEST : écrire le seuil en cases (`2.5 * 2.5`), ou
  // le comparer avec `>=` au lieu de `>`. Le premier fait tomber la ligne des
  // 2 cases, le second celle de la borne pile.
});

test('MODULES-C T2 — le porteur n\'est PAS sous son propre bouclier', () => {
  // La casemate vise la pièce la plus exposée : on met l'Enclume DEVANT.
  const etat = sceneBouclier({
    vague: [
      { id: 'enclume', colonne: 4, rangee: 4, niveau: 20 },
      { id: 'meute', colonne: 8, rangee: 1, niveau: 20 },
    ],
  });
  for (let t = 1; t <= 20; t += 1) tick(etat);
  const porteur = etat.entites.find((e) => e.id === 'enclume');
  const tireur = etat.entites.find((e) => e.id === 'casemate');
  assert.equal(etat.entites[tireur.cibleIndice]?.indice, porteur.indice,
    'montage : la casemate doit viser le PORTEUR');
  assert.ok(porteur.bouclierMilli > 0, 'montage : réservoir plein');

  const pv = porteur.pvMilli;
  const res = porteur.bouclierMilli;
  tick(etat);
  assert.ok(porteur.pvMilli < pv, 'le porteur ne prend rien : il se protège lui-même');
  assert.equal(porteur.bouclierMilli, res, 'le réservoir a encaissé les dégâts du porteur');

  // ⚠ C'EST UNE LECTURE DE LA PHRASE D'ETHAN — « les ALLIÉS », pas « les
  // unités ». UN MOT LA RENVERSE : retirer la ligne `b.indice === e.indice` de
  // `appliquerDegats` suffit, et c'est ce test qui tombe alors, seul.
});

test('MODULES-C T3 — l\'absorption est PARTIELLE, le surplus passe', () => {
  const { etat, allie, porteur } = bouclierStabilise();

  // Le coup d'un tick, MESURÉ réservoir à sec — pas une constante recopiée.
  porteur.bouclierMilli = 0;
  const pv0 = allie.pvMilli;
  tick(etat);
  const coup = pv0 - allie.pvMilli;
  assert.ok(coup > 3, 'montage : la casemate doit infliger quelque chose');

  // ⚠ ET IL NE SE REPRODUIT PAS À L'IDENTIQUE AU TICK SUIVANT. `degatsDUnTir`
  // met les dégâts à l'échelle de la santé du TIREUR : la casemate encaisse en
  // retour, donc son coup décroît de tick en tick. Ce test asserte donc des
  // INVARIANTS — « le réservoir est vidé », « du dégât est passé » —, jamais
  // une soustraction entre deux ticks différents. Une première écriture le
  // faisait et se trompait de 4 893 milli-PV.
  const reservoir = Math.floor(coup / 3);
  porteur.bouclierMilli = reservoir;
  const pv = allie.pvMilli;
  tick(etat);
  const passe = pv - allie.pvMilli;
  assert.equal(porteur.bouclierMilli, 0, 'le réservoir n\'a pas été vidé');
  assert.ok(passe > 0, 'le surplus n\'est pas passé : absorption en tout ou rien ?');
  // Rien n'a été perdu en route : ce qui est PASSÉ plus ce qui a été ABSORBÉ
  // fait exactement le coup du tick — et le coup du tick, lui, se mesure sur le
  // même tick en rejouant la scène sans réservoir. Un réservoir devenu négatif
  // casserait cette égalité.
  assert.ok(passe > 0 && passe < coup, 'le surplus passé ne tient pas dans le coup du tick');

  // Contre-épreuve du même tick : un réservoir LARGE couvre tout.
  porteur.bouclierMilli = coup * 10;
  const pv2 = allie.pvMilli;
  tick(etat);
  const absorbe = coup * 10 - porteur.bouclierMilli;
  assert.equal(pv2 - allie.pvMilli, 0, 'un réservoir large laisse passer du dégât');
  assert.ok(absorbe > 0 && absorbe <= coup, 'le réservoir large n\'a pas encaissé le coup entier');

  // ⚠ CE QUI FALSIFIERAIT CE TEST : un `if (b.bouclierMilli < reste) continue;`
  // — tout ou rien —, ou un `b.bouclierMilli -= reste` sans plancher, qui
  // rendrait un réservoir NÉGATIF et protégerait l'allié à crédit.
});

test('MODULES-C T4 — le réservoir ne se recharge jamais', () => {
  const { etat, allie, porteur } = bouclierStabilise();
  porteur.bouclierMilli = 1;
  tick(etat);
  assert.equal(porteur.bouclierMilli, 0, 'montage : le réservoir doit être à sec');

  const pertes = [];
  for (let t = 1; t <= 30; t += 1) {
    const pv = allie.pvMilli;
    tick(etat);
    assert.equal(porteur.bouclierMilli, 0, `le réservoir est remonté au tick ${t}`);
    pertes.push(pv - allie.pvMilli);
  }
  assert.ok(pertes.every((x) => x > 0), 'l\'allié est encore protégé après le vidage');
  assert.ok(porteur.vivant && !porteur.sorti, 'montage : le porteur doit rester en jeu');

  // ⚠ CE QUI FALSIFIERAIT CE TEST : une recharge, même lente — remettre
  // `bouclierMilli = pvMaxMilli` à l'apparition d'une vague, ou un `+= n` par
  // tick. La première ligne du relevé tombe.
});

test('MODULES-C T5 — un bouclier mort ne protège plus, DANS LE MÊME TICK', () => {
  // Le porteur en c4 face à une casemate, l'allié en c6 face à l'autre : les
  // deux sont visés le même tick, et le porteur porte l'indice le PLUS PETIT.
  const monter = () => {
    const etat = sceneBouclier({
      defenseurs: [
        { id: 'merlon', rangee: 5, colonne: 5, niveau: 30 },
        { id: 'casemate', rangee: 5, colonne: 4, niveau: 20 },
        { id: 'casemate', rangee: 5, colonne: 6, niveau: 20 },
      ],
      vague: [
        { id: 'enclume', colonne: 4, rangee: 3, niveau: 20 },
        { id: 'meute', colonne: 6, rangee: 4, niveau: 20 },
      ],
    });
    for (let t = 1; t <= 20; t += 1) tick(etat);
    const porteur = etat.entites.find((e) => e.id === 'enclume');
    const allie = etat.entites.find((e) => e.id === 'meute' && e.camp === 'attaque');
    // Le porteur rejoint la rangée de l'allié : il le couvre (deux colonnes
    // d'écart, 2 000 milli-cases) tout en restant sous le feu de sa casemate.
    porteur.rangeeMilli = allie.rangeeMilli;
    const d2 = distanceCarree(
      porteur.rangeeMilli, porteur.colonne, allie.rangeeMilli, allie.colonne,
    );
    assert.ok(d2 <= BOUCLIER_RAYON_MILLI * BOUCLIER_RAYON_MILLI, 'montage : l\'allié doit être couvert');
    // ⚠ L'INDICE DU PORTEUR DOIT ÊTRE LE PLUS PETIT : le tampon est appliqué par
    // indice croissant, donc le porteur encaisse sa propre mort AVANT que
    // l'allié ne soit servi. C'est tout l'objet de ce test.
    assert.ok(porteur.indice < allie.indice, 'montage : porteur d\'abord');
    const vises = etat.entites.filter((e) => e.camp === 'defense')
      .map((e) => e.cibleIndice).filter((i) => i !== null);
    assert.ok(vises.includes(porteur.indice), 'montage : le porteur doit être visé');
    assert.ok(vises.includes(allie.indice), 'montage : l\'allié doit être visé');
    assert.ok(porteur.bouclierMilli > 0, 'montage : réservoir plein');
    return { etat, porteur, allie };
  };

  const { etat, porteur, allie } = monter();
  porteur.pvMilli = 1;
  const pvAllie = allie.pvMilli;
  const res = porteur.bouclierMilli;
  tick(etat);
  assert.equal(porteur.pvMilli, 0, 'montage : le porteur devait tomber ce tick-ci');
  assert.ok(pvAllie - allie.pvMilli > 0,
    'l\'allié est encore couvert par un bouclier mort dans le même tick');
  assert.equal(porteur.bouclierMilli, res,
    'un porteur tombé a encore encaissé pour un allié');

  // ⚠ CONTRE-ÉPREUVE : le MÊME montage, porteur laissé debout. Sans elle,
  // « l'allié encaisse » ne distinguerait pas la mort du porteur d'un allié qui
  // n'aurait jamais été couvert.
  const debout = monter();
  const pv2 = debout.allie.pvMilli;
  tick(debout.etat);
  assert.ok(debout.porteur.pvMilli > 0, 'contre-épreuve : le porteur devait survivre');
  assert.equal(pv2 - debout.allie.pvMilli, 0, 'contre-épreuve : l\'allié devait être couvert');

  // ⚠ CE QUI FALSIFIERAIT CE TEST : retirer `b.pvMilli <= 0` de la garde.
  // `estActive` ne suffit pas — `vivant` n'est mis à jour qu'à l'étape 6,
  // `retirerLesMorts`, donc le porteur est encore « actif » à l'étape 5.
});

test('MODULES-C T6 — l\'ordre du tampon n\'a plus d\'influence', () => {
  // Deux tireurs, deux alliés couverts, un réservoir trop petit pour les deux :
  // c'est exactement le montage où l'ordre d'insertion déciderait.
  const monter = (ordre) => {
    const tireurs = [
      { id: 'casemate', rangee: 5, colonne: 4, niveau: 20 },
      { id: 'casemate', rangee: 5, colonne: 6, niveau: 20 },
    ];
    return sceneBouclier({
      defenseurs: [
        { id: 'merlon', rangee: 5, colonne: 5, niveau: 30 },
        ...ordre.map((i) => tireurs[i]),
      ],
      vague: [
        { id: 'enclume', colonne: 5, rangee: 2, niveau: 20 },
        { id: 'meute', colonne: 4, rangee: 4, niveau: 20 },
        { id: 'meute', colonne: 6, rangee: 4, niveau: 20 },
      ],
    });
  };

  const jouer = (ordre) => {
    const etat = monter(ordre);
    for (let t = 1; t <= 20; t += 1) tick(etat);
    const porteur = etat.entites.find((e) => e.id === 'enclume');
    const allies = etat.entites.filter((e) => e.id === 'meute' && e.camp === 'attaque');
    assert.equal(allies.length, 2, 'montage : deux alliés');
    // Le porteur rejoint la rangée des alliés : une colonne d'écart de chaque
    // côté, donc les deux sont couverts. Le porteur, lui, n'est visé par
    // personne — c'est bien l'ordre du TAMPON qu'on mesure, pas sa survie.
    porteur.rangeeMilli = allies[0].rangeeMilli;
    for (const a of allies) {
      const d2 = distanceCarree(porteur.rangeeMilli, porteur.colonne, a.rangeeMilli, a.colonne);
      assert.ok(d2 <= BOUCLIER_RAYON_MILLI * BOUCLIER_RAYON_MILLI,
        `montage : l'allié en c${a.colonne} doit être couvert`);
    }
    // Réservoir volontairement insuffisant : le premier servi est couvert, le
    // second paie le reste. Sans tri, c'est l'ordre de déclaration qui trancherait.
    porteur.bouclierMilli = 150000;
    const avant = allies.map((e) => e.pvMilli);
    tick(etat);
    return {
      // ⚠ CLÉ PAR POSITION, PAS PAR INDICE : les indices se décalent quand on
      // permute les défenseurs, et deux relevés indexés ne seraient pas
      // comparables. Le repère stable est la colonne de l'allié.
      pertes: Object.fromEntries(allies.map((e, i) => [`c${e.colonne}`, avant[i] - e.pvMilli])),
      reservoir: porteur.bouclierMilli,
    };
  };

  const a = jouer([0, 1]);
  const b = jouer([1, 0]);
  assert.deepEqual(a, b, 'permuter les tireurs change qui est couvert');
  // Et le montage n'est pas vacant : le réservoir a été vidé, un allié a payé.
  assert.equal(a.reservoir, 0, 'montage : le réservoir devait être insuffisant');
  const pertes = Object.values(a.pertes);
  assert.ok(pertes.some((x) => x > 0), 'montage : un allié devait encaisser');
  assert.ok(pertes.some((x) => x === 0), 'montage : un allié devait être couvert');

  // ⚠ CE QUI FALSIFIERAIT CE TEST : retirer le `.sort()` de `appliquerDegats`.
  // C'est le test qui compte le plus de ce lot — sans lui, le résultat d'un
  // raid dépendrait de l'ordre où les défenseurs ont été déclarés.
});

test('MODULES-C T7 — à recouvrement, c\'est le plus petit indice qui se vide d\'abord', () => {
  const etat = sceneBouclier({
    vague: [
      { id: 'enclume', colonne: 4, rangee: 2, niveau: 20 },
      { id: 'enclume', colonne: 6, rangee: 2, niveau: 20 },
      { id: 'meute', colonne: 5, rangee: 4, niveau: 20 },
    ],
  });
  for (let t = 1; t <= 20; t += 1) tick(etat);
  const [p1, p2] = etat.entites.filter((e) => e.id === 'enclume');
  const allie = etat.entites.find((e) => e.id === 'meute' && e.camp === 'attaque');
  const tireur = etat.entites.find((e) => e.id === 'casemate');
  assert.ok(p1.indice < p2.indice, 'montage : deux porteurs, indices croissants');
  // Les deux se placent DEUX CASES EN ARRIÈRE de l'allié, chacun d'une colonne :
  // les deux le couvrent (2 000² + 1 000² = 5 000 000, sous la borne), et ils
  // restent plus loin de la casemate que lui — sans quoi elle changerait de
  // cible et le montage ne mesurerait plus rien.
  p1.rangeeMilli = allie.rangeeMilli - 2000;
  p2.rangeeMilli = allie.rangeeMilli - 2000;
  for (const p of [p1, p2]) {
    const d2 = distanceCarree(p.rangeeMilli, p.colonne, allie.rangeeMilli, allie.colonne);
    assert.ok(d2 <= BOUCLIER_RAYON_MILLI * BOUCLIER_RAYON_MILLI,
      `montage : le porteur #${p.indice} doit couvrir l'allié`);
  }

  // Le coup d'un tick, MESURÉ les deux réservoirs à sec. ⚠ Il DÉCROÎT de tick en
  // tick — `degatsDUnTir` suit la santé du tireur, que les Enclumes entament —
  // donc tout ce qui suit s'écrit en invariants, jamais en soustractions d'un
  // tick à l'autre.
  p1.bouclierMilli = 0;
  p2.bouclierMilli = 0;
  const pv0 = allie.pvMilli;
  tick(etat);
  const coup = pv0 - allie.pvMilli;
  assert.equal(etat.entites[tireur.cibleIndice]?.indice, allie.indice,
    'montage : la casemate a changé de cible pour un porteur');
  assert.ok(coup > 3, 'montage : l\'allié doit encaisser quelque chose');

  // Le petit indice ne peut pas tout prendre : le second doit compléter.
  const petit = Math.floor(coup / 3);
  const large = coup * 100;
  p1.bouclierMilli = petit;
  p2.bouclierMilli = large;
  const pv = allie.pvMilli;
  tick(etat);
  assert.equal(p1.bouclierMilli, 0, 'le petit indice ne s\'est pas vidé le premier');
  assert.ok(large - p2.bouclierMilli > 0, 'le second n\'a pas pris le reste');
  assert.equal(allie.pvMilli, pv, 'l\'allié a encaissé alors que les deux réservoirs suffisaient');

  // Et l'inverse : tant que le petit indice tient, le grand ne paie RIEN.
  p1.bouclierMilli = large;
  const avant2 = p2.bouclierMilli;
  const pv3 = allie.pvMilli;
  tick(etat);
  assert.ok(large - p1.bouclierMilli > 0, 'le petit indice n\'a rien pris');
  assert.equal(p2.bouclierMilli, avant2, 'le grand indice a payé alors que le petit tenait');
  assert.equal(allie.pvMilli, pv3);

  // ⚠ CE QUI FALSIFIERAIT CE TEST : parcourir `boucliers` dans l'ordre inverse,
  // ou le construire depuis un `Set`/une `Map` dont l'ordre suit autre chose que
  // l'indice. Les deux moitiés du test tombent, chacune de son côté.
});

test('MODULES-C T8 — le butin et les points ne comptent pas le réservoir', () => {
  const etat = sceneBouclier();
  const porteur = etat.entites.find((e) => e.id === 'enclume');
  const plein = porteur.bouclierMilli;
  const montage = {
    modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: ['bouclier'], defense: [] } },
  };
  const resultat = resoudre(etat, { maxTicks: 400 });
  const absorbe = plein - porteur.bouclierMilli;
  assert.ok(absorbe > 0, 'montage : le bouclier n\'a rien absorbé, le test ne prouve rien');

  // ⚠ AUCUNE LIGNE DE RÉSULTAT NE PORTE LE RÉSERVOIR. C'est la garde
  // structurelle : `butin` et `pointsRecherche` ne lisent que ce résultat, donc
  // ce qui n'y est pas ne peut pas être payé.
  const lignes = [...resultat.batiments, ...resultat.defenses, ...resultat.attaquants];
  assert.ok(lignes.length > 0);
  for (const l of lignes) {
    assert.equal(Object.prototype.hasOwnProperty.call(l, 'bouclierMilli'), false,
      `la ligne « ${l.id} » expose le réservoir au calcul du butin`);
  }

  // Et la garde de valeur : le butin est fonction des BÂTIMENTS seuls, les
  // points des DÉFENSES seules. Abîmer le réservoir après coup ne les bouge pas.
  const b0 = butin(resultat, montage);
  const p0 = pointsRecherche(resultat, montage);
  porteur.bouclierMilli = 0;
  for (const l of resultat.attaquants) l.pvMilli = 0;
  assert.deepEqual(butin(resultat, montage), b0,
    'le butin bouge quand l\'attaquant change : il paie les pertes du joueur');
  assert.equal(pointsRecherche(resultat, montage), p0);

  // ⚠ CE QUI FALSIFIERAIT CE TEST : ajouter `bouclierMilli` à `ligneResultat`,
  // ou faire entrer les pertes des attaquants dans `butin`. La première moitié
  // tombe sur la structure, la seconde sur la valeur.
});

test('MODULES-C T9 — le déterminisme tient avec le Bouclier actif', () => {
  const monter = (ordre) => {
    const defenseurs = [
      { id: 'merlon', rangee: 5, colonne: 5, niveau: 30 },
      { id: 'casemate', rangee: 5, colonne: 4, niveau: 20 },
      { id: 'casemate', rangee: 5, colonne: 6, niveau: 20 },
      { id: 'faucheuse', rangee: 8, colonne: 5, niveau: 20 },
    ];
    return sceneBouclier({
      modules: ['bouclier', 'flashbang', 'emp', 'camouflage', 'booster', 'ecraseur', 'tirDeBarrage'],
      defenseurs: ordre.map((i) => defenseurs[i]),
      vague: [
        { id: 'enclume', colonne: 4, rangee: 2, niveau: 20 },
        { id: 'enclume', colonne: 6, rangee: 2, niveau: 20 },
        { id: 'meute', colonne: 5, rangee: 4, niveau: 20 },
        { id: 'belier', colonne: 3, rangee: 3, niveau: 20 },
        { id: 'fendeur', colonne: 7, rangee: 3, niveau: 20 },
      ],
    });
  };

  const jouer = (ordre) => {
    const etat = monter(ordre);
    // ⚠ RÉSERVOIRS BRIDÉS, ET C'EST CE QUI REND CE TEST FALSIFIABLE. À réservoir
    // plein le bouclier ne s'épuise jamais, donc l'ordre d'application ne décide
    // de rien et retirer le tri du tampon ne ferait PAS tomber ce test. Bridés,
    // ils s'épuisent au milieu du raid et c'est alors l'ordre qui choisit qui
    // reste couvert.
    for (const e of etat.entites) {
      if (e.bouclierMilli > 0) e.bouclierMilli = 400000;
    }
    for (let t = 1; t <= 120 && !etat.termine; t += 1) tick(etat);
    return { etat, vue: projectionCanonique(etat) };
  };

  // Bit à bit d'abord : deux exécutions du MÊME montage.
  const a = jouer([0, 1, 2, 3]);
  const bis = jouer([0, 1, 2, 3]);
  assert.equal(serialiserEtat(a.etat), serialiserEtat(bis.etat));

  // ⚠ ET LA MÊME PROJECTION CANONIQUE QU'AU LOT MODULES-B, PAS UNE SECONDE :
  // `serialiserEtat` brut diverge quand on permute les défenseurs, parce que les
  // indices se décalent. La projection a été ÉTENDUE au réservoir — sans quoi
  // elle serait aveugle à ce que ce lot ajoute.
  for (const ordre of [[1, 0, 2, 3], [3, 2, 1, 0], [2, 3, 0, 1]]) {
    assert.deepEqual(jouer(ordre).vue, a.vue, `ordre ${ordre.join('')}`);
  }

  // Le montage n'est pas vacant : les DEUX réservoirs se sont épuisés pendant le
  // raid. Sans épuisement, la couverture ne dépendrait de rien et la projection
  // serait identique quoi qu'il arrive.
  const porteurs = a.etat.entites.filter((e) => e.id === 'enclume');
  assert.equal(porteurs.length, 2, 'montage : deux porteurs');
  assert.ok(porteurs.every((e) => e.bouclierMilli === 0),
    'montage : un réservoir n\'a pas été épuisé, la projection ne prouve rien');

  // ⚠ ET LA PROJECTION VOIT BIEN LE RÉSERVOIR. Deux états qui ne diffèrent QUE
  // par lui doivent donner deux projections différentes — sans quoi tout ce qui
  // précède serait vrai d'une projection aveugle à ce que ce lot ajoute.
  const temoin = jouer([0, 1, 2, 3]);
  assert.deepEqual(temoin.vue, a.vue, 'montage : même ordre, même projection');
  temoin.etat.entites.find((e) => e.id === 'enclume').bouclierMilli += 1;
  assert.notDeepEqual(projectionCanonique(temoin.etat), a.vue,
    'la projection canonique ne voit pas `bouclierMilli`');

  // ⚠ CE QUI FALSIFIERAIT CE TEST : une vraie non-détermination — un parcours
  // d'entités par `Set`/`Map` dont l'ordre suivrait la déclaration, ou une
  // projection qui cesserait de lire le réservoir. Il ne remplace PAS
  // `MODULES-C T6` : le tri du tampon, lui, est gardé là-bas, et retirer le tri
  // ne fait pas tomber celui-ci — mesuré, pas supposé.
});

test('MODULES-C T10 — `cable` par branche pour le Bouclier', () => {
  assert.equal(moduleEstCable('bouclier', 'offense'), true, 'bouclier en offense');
  assert.equal(moduleEstCable('bouclier', 'defense'), false, 'bouclier en défense');

  // ⚠ IL N'EN RESTE PLUS QU'UN — le compte EST la liste, et c'est elle qui tombe
  // si un lot futur câble un module sans le dire ici. Elle en portait trois
  // jusqu'à MODULES-F, qui a câblé la Munition spéciale et le Vol de vie.
  const restants = Object.entries(MODULES)
    .filter(([, m]) => !m.cable.offense && !m.cable.defense).map(([n]) => n).sort();
  assert.deepEqual(restants, ['garnison']);

  // L'ACHAT, pas seulement le drapeau : une seule ligne porte le Bouclier, en
  // offense, et elle s'achète. Aucune ligne de défense ne le porte — c'est ce
  // qui justifie `defense: false` : le câbler là ouvrirait une ligne vide.
  const etat = partie('999999999999999');
  const porteurs = { offense: [], defense: [] };
  for (const branche of BRANCHES) {
    for (const id of Object.keys(ARBRE_RECHERCHE[branche])) {
      if (nomDuModule(branche, id) !== 'bouclier') continue;
      porteurs[branche].push(id);
      if (!estAcquise(etat, branche, id)) acheter(etat, branche, id, 'unite');
      assert.deepEqual(
        problemesDeLAchat(etat, branche, id, 'module'), [],
        `${branche}/${id} refuse alors qu'il est câblé`,
      );
      acheter(etat, branche, id, 'module');
      assert.equal(moduleEstAcquis(etat, branche, id), true);
    }
  }
  assert.deepEqual(porteurs.offense, ['enclume']);
  assert.deepEqual(porteurs.defense, [], 'un ouvrage porte le Bouclier : revoir `cable.defense`');

  // ⚠ COMPTÉ EN PARCOURANT L'ARBRE, PAS DE TÊTE — et c'est la leçon de
  // MODULES-B, dont le brief annonçait six lignes ouvertes là où il y en avait
  // cinq. Onze lignes s'ouvraient avant le lot C, douze après ; MODULES-D en
  // ouvre ONZE DE PLUS, toutes en défense. Ce compte est le chiffre du rapport.
  const ouvertes = { offense: 0, defense: 0 };
  for (const branche of BRANCHES) {
    for (const id of Object.keys(ARBRE_RECHERCHE[branche])) {
      const nom = nomDuModule(branche, id);
      if (nom !== null && MODULES[nom].cable[branche]) ouvertes[branche] += 1;
    }
  }
  assert.deepEqual(ouvertes, { offense: 12, defense: 11 });
});

// ---------------------------------------------------------------------------
// MODULES-D — le champ qui mentait, la portée, et les quatre modules défensifs
// ---------------------------------------------------------------------------

/**
 * Un montage de GARNISON dont on choisit le propriétaire, pour lire ce que
 * chaque pièce déclare comme module de défense.
 *
 * ⚠ LE MODULE DE DÉFENSE NE SE LIT PAS DANS LE PROFIL, IL SE LIT AU RÉSULTAT.
 * `ligneResultat` est le seul lecteur observable de `moduleDeDefense` avant
 * qu'un module défensif ne soit câblé ; asserter le champ que le patch vient
 * d'écrire ne prouverait rien.
 */
function garnisonDe(proprietaire) {
  const montage = {
    niveau: 20,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
    defenseurs: [
      { id: 'merlon', rangee: 5, colonne: 5, niveau: 20 },
      { id: 'faucheuse', rangee: 9, colonne: 7, niveau: 20 },
      { id: 'guetteur', rangee: 6, colonne: 4, niveau: 20 },
      { id: 'carapace', rangee: 6, colonne: 6, niveau: 20 },
      { id: 'broyeur', rangee: 7, colonne: 3, niveau: 20 },
    ],
    vagues: [[{ id: 'belier', colonne: 5, rangee: 2, niveau: 40 }]],
    proprietaireDefense: proprietaire,
    proprietaireAttaque: proprietaire === 'joueur' ? 'ouvrage' : 'joueur',
    modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
  };
  const resultat = resoudre(creerCombat(montage), { maxTicks: 600 });
  const lu = {};
  for (const d of resultat.defenses) lu[d.id] = d.module;
  return lu;
}

test('MODULES-D T1 — `moduleDefense` a disparu de `src/`, sous ce nom-là', () => {
  // ⚠ LE MOTIF EST BORNÉ À DROITE, ET C'EST TOUT L'ENJEU : les deux noms
  // neufs COMMENCENT par l'ancien. Un `includes('moduleDefense')` nu trouverait
  // `moduleDefenseJoueur` et ce test ne pourrait jamais tomber.
  const motif = /moduleDefense(?![\p{L}\p{N}_])/gu;
  const coupables = [];
  for (const dossier of ['data', 'sim', 'render', 'ui']) {
    const dir = new URL(`../src/${dossier}/`, import.meta.url);
    for (const nom of readdirSync(dir)) {
      const texte = readFileSync(new URL(nom, dir), 'utf8');
      if (motif.test(texte)) coupables.push(`${dossier}/${nom}`);
      motif.lastIndex = 0;
    }
  }
  assert.deepEqual(coupables, [], 'un champ qui a menti une fois ment deux fois');

  // ⚠ ET L'APPÂT PROUVE QUE LE MOTIF MORD ENCORE. Sans lui, une faute de frappe
  // dans l'expression rendrait le balayage vert sur n'importe quelle source.
  assert.equal(motif.test('  moduleDefense: u.defense.module,'), true);
  motif.lastIndex = 0;
  assert.equal(motif.test('  moduleDefenseJoueur: u.defense.module,'), false);
  motif.lastIndex = 0;

  // Les deux noms neufs, eux, sont bien là — un renommage qui les perdrait
  // laisserait le balayage ci-dessus tout aussi vert.
  const source = readFileSync(new URL('../src/sim/combat.js', import.meta.url), 'utf8');
  for (const nom of ['moduleDefenseJoueur', 'moduleDefenseOuvrage']) {
    assert.equal((source.match(new RegExp(nom, 'g')) ?? []).length >= 3, true,
      `${nom} doit être écrit sur les trois profils`);
  }
});

test('MODULES-D T2 — le module de défense est celui du PROPRIÉTAIRE', () => {
  const chezLOuvrage = garnisonDe('ouvrage');
  const chezLeJoueur = garnisonDe('joueur');

  // Un ouvrage fixe : la Herse rend `pvPlusVingt` à l'Ouvrage, `autoReparation`
  // au joueur. Même pièce, même case, deux modules.
  assert.equal(chezLOuvrage.merlon, 'pvPlusVingt');
  assert.equal(chezLeJoueur.merlon, 'autoReparation');
  // Une artillerie porte le MÊME des deux côtés : la table le dit, et c'est ce
  // qui empêche de croire que la règle est « l'un ou l'autre au hasard ».
  assert.equal(chezLOuvrage.faucheuse, 'rayonMiniMoinsUn');
  assert.equal(chezLeJoueur.faucheuse, 'rayonMiniMoinsUn');

  // Une unité de garnison : `moduleOuvrage` d'un côté, `defense.module` de
  // l'autre. Le Guetteur n'a pas de module côté Ouvrage, et il a le Rayon +1
  // côté joueur — c'est exactement ce que l'ancien champ inversait.
  assert.equal(chezLOuvrage.guetteur, null);
  assert.equal(chezLeJoueur.guetteur, 'rayonPlusUn');
  assert.equal(chezLOuvrage.carapace, 'camouflage');
  assert.equal(chezLeJoueur.carapace, 'emp');
  assert.equal(chezLOuvrage.broyeur, 'volDeVie');
  assert.equal(chezLeJoueur.broyeur, 'pvPlusVingt');

  // ⚠ ET AUCUNE DES CINQ N'EST LUE COMME SON MODULE D'ASSAUT. C'est la faute
  // qu'on retire : `guetteur.module` vaut `camouflage`, `broyeur.module` vaut
  // `ecraseur`, et ni l'un ni l'autre n'a de rôle en garnison.
  for (const [id, lu] of Object.entries(chezLeJoueur)) {
    const assaut = UNITES[id]?.module;
    if (assaut === undefined || assaut === lu) continue;
    assert.notEqual(lu, assaut, `${id} lit encore son module d'assaut`);
  }
  assert.equal(UNITES.guetteur.module, 'camouflage', 'montage : la faute doit être atteignable');
  assert.equal(UNITES.broyeur.module, 'ecraseur');
});

test('MODULES-D T3 — les modules déjà câblés tirent toujours, à l\'assaut', () => {
  // ⚠ CE TEST PROTÈGE MODULES-A, B ET C. Le démêlage change la LECTURE du
  // module ; s'il la changeait aussi du côté attaque, les sept modules câblés
  // s'éteindraient tous d'un coup et aucun test de ce fichier ne dirait
  // pourquoi. Chaque assertion ci-dessous tombe si `moduleActif` cesse de lire
  // `p.module` en camp d'attaque.
  const cables = Object.entries(MODULES)
    .filter(([, m]) => m.cable.offense).map(([n]) => n).sort();
  assert.deepEqual(cables, [
    'booster', 'bouclier', 'camouflage', 'ecraseur', 'emp', 'flashbang', 'tirDeBarrage',
  ], 'sept modules câblés en offense — le compte EST la liste');

  // Bouclier : le réservoir se pose AU MONTAGE, c'est le plus direct à lire.
  const avecBouclier = sceneBouclier();
  const enclume = avecBouclier.entites.find((e) => e.id === 'enclume');
  assert.ok(enclume.bouclierMilli > 0, 'le Bouclier ne se pose plus à l\'assaut');
  // Et il ne se pose PAS si le joueur ne l'a pas acheté : la garde est intacte.
  const sansAchat = sceneBouclier({ modules: [] });
  assert.equal(sansAchat.entites.find((e) => e.id === 'enclume').bouclierMilli, 0);

  // Camouflage, Flashbang, EMP : le montage des trois modules de MODULES-B.
  // ⚠ QUATRE-VINGTS TICKS, PAS QUARANTE : la Crécelle doit d'abord APPROCHER
  // l'artillerie, seule cible `vehicule` de la scène. Mesuré — elle déclenche
  // entre le 40ᵉ et le 80ᵉ tick, et un horizon trop court rendrait ce test
  // rouge sur du code parfaitement sain.
  const trois = montageTroisModules([0, 1, 2, 3, 4]);
  for (let t = 1; t <= 80; t += 1) tick(trois);
  const neutralisees = trois.entites.filter((e) => e.effetsTemporises.length > 0);
  assert.ok(neutralisees.length > 0, 'plus aucune neutralisation à l\'assaut');
  const porteurs = trois.entites.filter((e) => e.modulesActifs.length > 0).map((e) => e.id).sort();
  assert.deepEqual(porteurs, ['belier', 'crecelle'], 'les deux porteurs doivent avoir tiré');

  // Tir de barrage : la géométrie de MODULES-A T1, telle quelle — tireur en
  // (2,5), cible en (3,5), voisine en (3,4). Les clés sont « rangée,colonne ».
  const geometrie = (avecModule) => scene({
    cible: { id: 'merlon', rangee: 3, colonne: 5 },
    voisines: [{ id: 'merlon', rangee: 3, colonne: 4 }],
    avecModule,
  });
  assert.ok(pertesAuPremierTick(geometrie(true)).get('3,4') > 0,
    'le barrage n\'éclabousse plus');
  assert.equal(pertesAuPremierTick(geometrie(false)).get('3,4'), 0,
    'montage : sans achat, aucune éclaboussure');

  // Écraseur : la masse d'un Fendeur DOUBLE contre une escouade — le seul
  // lecteur observable est le forçage d'une structure, `structureForcee`.
  const forcage = (modules) => {
    const etat = creerCombat({
      niveau: 1,
      obstacles: [],
      batiments: [{ id: 'souche', rangee: 15, colonne: 5, niveau: 1 }],
      defenseurs: [{ id: 'merlon', rangee: 4, colonne: 5, niveau: 1 }],
      vagues: [[{ id: 'fendeur', colonne: 5, rangee: 3, niveau: 1 }]],
      modulesDebloques: {
        ouvrage: { offense: [], defense: [] },
        joueur: { offense: modules, defense: [] },
      },
    });
    const mur = etat.entites.find((e) => e.id === 'merlon');
    const avant = mur.pvMilli;
    for (let t = 1; t <= 12; t += 1) tick(etat);
    return avant - mur.pvMilli;
  };
  const avecEcraseur = forcage(['ecraseur']);
  const sansEcraseur = forcage([]);
  assert.ok(avecEcraseur > sansEcraseur,
    `l'Écraseur ne force plus la structure (${avecEcraseur} vs ${sansEcraseur})`);
});

/** Le montage de référence de T4, nu : deux unités de garnison et un ouvrage. */
function raidDeReferenceMontage() {
  return {
    niveau: 20,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
    defenseurs: [
      { id: 'merlon', rangee: 5, colonne: 5, niveau: 20 },
      { id: 'meute', rangee: 6, colonne: 4, niveau: 20 },
      { id: 'perceurs', rangee: 6, colonne: 6, niveau: 18 },
    ],
    vagues: [[
      { id: 'belier', colonne: 5, rangee: 2, niveau: 30 },
      { id: 'belier', colonne: 4, rangee: 2, niveau: 30 },
      { id: 'belier', colonne: 6, rangee: 2, niveau: 30 },
    ]],
    modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
  };
}

/** Le même montage, la liste de l'Ouvrage — qui DÉFEND — armée. */
function raidDeReference(ouvrage) {
  const nu = raidDeReferenceMontage();
  const montage = { ...nu,
    modulesDebloques: { ...nu.modulesDebloques, ouvrage: { offense: [], defense: ouvrage } } };
  const resultat = resoudre(creerCombat(montage), { maxTicks: 600 });
  return { resultat, points: pointsRecherche(resultat, montage) };
}

test('MODULES-D T4 — les points de recherche ne bougent pas, au point près', () => {
  // ⚠ CE COMMENTAIRE DISAIT « LE CANAL DU JEU EST VIDE », ET CE N'EST PLUS VRAI
  // DEPUIS MODULES-F. `sim/generateur.js` livrait `modulesDebloques.ouvrage` à
  // vide sur tous les sites ; il le remplit désormais à partir de
  // `apparitionModule`, et le bonus de 20 % EST accordé en partie dès le
  // niveau 28. Ce test-ci n'en dépend pas : son montage est écrit à la main et
  // ne passe pas par le générateur, donc le nombre ci-dessous ne bouge pas. Il
  // reste ce qu'il a toujours été — la mesure du démêlage de MODULES-D, prise
  // des DEUX côtés et identique. Le canal armé se mesure en MODULES-F T12/T14.
  const jeu = raidDeReference([]);
  assert.equal(jeu.points, 2059722n, 'les points du raid de référence ont bougé');
  assert.equal(jeu.resultat.tick, 120, 'montage : le combat doit se dérouler pareil');

  // ⚠ ET LE MONTAGE N'EST PAS VIDE. Le Merlon porte `pvPlusVingt` côté Ouvrage :
  // débloquer ce module-là majore bien les points. Sans cette ligne, l'égalité
  // ci-dessous passerait sur un barème qui ne majore jamais rien.
  assert.equal(raidDeReference(['pvPlusVingt']).points, 2106166n);

  // ⚠⚠ LA MESURE DU LOT. Avant le démêlage, la Meute et les Perceurs de
  // l'Ouvrage étaient crédités du module de garnison DU JOUEUR — 2 291 944 et
  // 2 193 000 mesurés sur `origin/main`. Ils portent maintenant leur
  // `moduleOuvrage`, qui est nul : plus aucune majoration ne leur revient.
  assert.equal(raidDeReference(['flashbang']).points, 2059722n);
  assert.equal(raidDeReference(['tirDeBarrage']).points, 2059722n);
  assert.equal(raidDeReference(['flashbang', 'tirDeBarrage', 'pvPlusVingt']).points, 2106166n);

  // Et les deux unités de garnison rapportent bien quelque chose : sans cela,
  // les trois égalités ci-dessus tiendraient parce que rien n'est compté.
  const parId = new Map(jeu.resultat.defenses.map((d) => [d.id, d]));
  for (const id of ['meute', 'perceurs']) {
    assert.ok(parId.get(id).pvInitialMilli - parId.get(id).pvMilli > 0,
      `montage : ${id} doit être entamée`);
    assert.equal(parId.get(id).module, null, `${id} lit encore un module côté Ouvrage`);
  }
});

/**
 * Une garnison DU JOUEUR — c'est le seul côté où les modules de ce lot vivent —
 * et un assaillant de l'Ouvrage qu'on place où l'on veut.
 *
 * ⚠ LE DÉPLACEMENT EST L'ÉTAPE 7, LES DÉGÂTS L'ÉTAPE 5. On force la position de
 * l'assaillant PUIS on joue un tick : ce qui compte est la distance d'avant.
 */
function sceneDePortee({ defenseur, modules = [], distanceMilli }) {
  const etat = creerCombat({
    niveau: 10,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 10 }],
    defenseurs: [{ ...defenseur, niveau: 10 }],
    proprietaireDefense: 'joueur',
    proprietaireAttaque: 'ouvrage',
    vagues: [[{ id: 'fouisseurs', colonne: 5, rangee: 2, niveau: 10 }]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: { offense: [], defense: modules },
    },
  });
  const garde = etat.entites.find((e) => e.camp === 'defense' && e.id === defenseur.id);
  const assaillant = etat.entites.find((e) => e.camp === 'attaque');
  assert.ok(garde !== undefined && assaillant !== undefined, 'montage');
  if (distanceMilli !== undefined) assaillant.rangeeMilli = garde.rangeeMilli - distanceMilli;
  const avant = assaillant.pvMilli;
  const d2 = distanceCarree(garde.rangeeMilli, garde.colonne,
    assaillant.rangeeMilli, assaillant.colonne);
  tick(etat);
  return { etat, garde, assaillant, d2, pertes: avant - assaillant.pvMilli };
}

test('MODULES-D T5 — la portée se lit sur l\'ENTITÉ, et TOUS ses lecteurs la lisent là', () => {
  // Viser ET tirer : deux lecteurs distincts, deux assertions distinctes. Un
  // seul des deux laissé sur le profil donnerait une garde qui vise sans tirer,
  // ou qui tire sans avoir visé — le combat ne planterait pas, il serait faux.
  const avec = sceneDePortee({
    defenseur: { id: 'guetteur', rangee: 6, colonne: 5 },
    modules: ['rayonPlusUn'], distanceMilli: 3000,
  });
  assert.equal(avec.d2, 9000000, 'montage : trois cases, au carré des milli-cases');
  assert.notEqual(avec.garde.cibleIndice, null, '`ciblage` lit encore la portée du profil');
  assert.ok(avec.pertes > 0, '`tir` lit encore la portée du profil');

  // ⚠ ET LE MONTAGE MESURE QUELQUE CHOSE : sans l'achat, la même case est hors
  // d'atteinte. Sans cette ligne, les deux assertions ci-dessus passeraient sur
  // une portée qui n'a jamais bougé.
  const sans = sceneDePortee({
    defenseur: { id: 'guetteur', rangee: 6, colonne: 5 }, distanceMilli: 3000,
  });
  assert.equal(sans.garde.cibleIndice, null);
  assert.equal(sans.pertes, 0);

  // ⚠⚠ QUATRE LECTEURS, PAS TROIS. Le brief en annonçait deux dans `ciblage`
  // — la boucle des candidats et le bloc « cible conservée » — et un dans
  // `tir` ; mesuré, le bloc « cible conservée » ne lit AUCUNE portée, et deux
  // autres fonctions en lisent une : `ensembleCamoufles` (le rayon qui révèle
  // un camouflé, « les mêmes que son ciblage ») et `cibleDeNeutralisation`.
  // Aucun module ne modifie encore la portée d'un porteur de Camouflage ou
  // d'EMP : ces deux-là se gardent à la source, faute de montage qui les
  // sépare.
  const source = readFileSync(new URL('../src/sim/combat.js', import.meta.url), 'utf8');
  assert.equal((source.match(/d2 > e\.porteeCarree \|\| d2 < e\.porteeMiniCarree/g) ?? []).length, 4,
    'les quatre lecteurs de portée doivent lire l\'entité');
  assert.equal(source.includes('d2 > p.porteeCarree'), false,
    'un lecteur de portée est resté sur le profil');
  // `peutTirer` est le cinquième : il décide si l'entité tire du tout.
  assert.match(source, /function peutTirer\(e, p\) \{\n\s*if \(p\.degatsColonne === null \|\| e\.porteeCarree === 0\)/);
});

test('MODULES-D T6 — Rayon +1 ajoute UNE case, en milli-cases puis au carré', () => {
  const sans = sceneDePortee({ defenseur: { id: 'guetteur', rangee: 6, colonne: 5 } });
  const avec = sceneDePortee({
    defenseur: { id: 'guetteur', rangee: 6, colonne: 5 }, modules: ['rayonPlusUn'],
  });
  // 2,5 case → 3,5 case. En milli-cases au carré : 2 500² puis 3 500².
  assert.equal(sans.garde.porteeCarree, 2500 * 2500);
  assert.equal(avec.garde.porteeCarree, 3500 * 3500);
  // ⚠ ET SÛREMENT PAS `porteeCarree + 1`, qui rendrait 6 250 001 — un
  // millionième de case de plus, invisible et faux.
  assert.notEqual(avec.garde.porteeCarree, sans.garde.porteeCarree + 1);
  // Le rayon MINIMAL, lui, ne bouge pas : le module n'en parle pas.
  assert.equal(avec.garde.porteeMiniCarree, sans.garde.porteeMiniCarree);

  // Le PROFIL reste à sa valeur nominale : c'est ce qui permet à deux Guetteurs
  // de la même grille d'avoir deux rayons différents.
  const gardeSansAchat = sans.etat.entites.find((e) => e.id === 'guetteur');
  assert.equal(gardeSansAchat.porteeCarree, 2500 * 2500);
});

test('MODULES-D T7 — Rayon minimum −1 : une cible hors d\'atteinte devient touchable', () => {
  // La Faucheuse a un angle mort de 3,5 cases. Un assaillant à 3 cases y est
  // à l'abri ; le module ramène l'angle mort à 2,5 et le découvre.
  const commun = { defenseur: { id: 'faucheuse', rangee: 6, colonne: 5 }, distanceMilli: 3000 };
  const sans = sceneDePortee(commun);
  const avec = sceneDePortee({ ...commun, modules: ['rayonMiniMoinsUn'] });

  assert.equal(sans.d2, 9000000, 'montage : trois cases');
  assert.equal(sans.garde.porteeMiniCarree, 3500 * 3500);
  assert.equal(avec.garde.porteeMiniCarree, 2500 * 2500);

  // ⚠⚠ UN NOMBRE QUI CHANGE NE SUFFIT PAS : on montre LE TIR. Sans le module,
  // l'assaillant n'est même pas visé ; avec, il est visé ET il perd des PV.
  assert.equal(sans.garde.cibleIndice, null, 'l\'angle mort ne protège plus');
  assert.equal(sans.pertes, 0);
  assert.notEqual(avec.garde.cibleIndice, null);
  assert.ok(avec.pertes > 0, `l'artillerie ne tire toujours pas (${avec.pertes})`);

  // Et la portée MAXIMALE ne bouge pas : le module ne parle que de l'angle mort.
  assert.equal(avec.garde.porteeCarree, sans.garde.porteeCarree);
  assert.equal(avec.garde.porteeCarree, 5500 * 5500);
});

test('MODULES-D T8 — le rayon minimum ne passe pas sous zéro', () => {
  const source = readFileSync(new URL('../src/sim/combat.js', import.meta.url), 'utf8');
  // ⚠ LE PLANCHER EST AVANT LE CARRÉ, ET C'EST TOUT L'ENJEU. Une portée
  // minimale de −500 milli repasserait à 250 000 en s'élevant au carré : le
  // module AGRANDIRAIT l'angle mort qu'il est censé réduire.
  assert.match(source, /porteeMiniMilli = Math\.max\(0, porteeMiniMilli - MILLI_PAR_CASE\);/);
  assert.ok(source.indexOf('Math.max(0, porteeMiniMilli') 
    < source.indexOf('entite.porteeMiniCarree = porteeMiniMilli * porteeMiniMilli;'),
    'le plancher doit être posé AVANT la mise au carré');

  // ⚠⚠ ET AUCUNE DONNÉE NE L'ATTEINT AUJOURD'HUI — c'est mesuré, pas supposé.
  // Les trois porteuses ont toutes un angle mort de 3,5 cases : le plancher est
  // une garde MORTE, exactement comme `masseEffective` l'est pour l'Écraseur.
  // Elle mordra le jour où une pièce à angle mort d'une case portera le module,
  // et l'écrire plus tard demanderait de retrouver ce raisonnement-ci.
  const porteuses = Object.entries(DEFENSES)
    .filter(([, d]) => d.moduleJoueur === 'rayonMiniMoinsUn' || d.moduleOuvrage === 'rayonMiniMoinsUn')
    .map(([id, d]) => [id, d.porteeMini]);
  assert.deepEqual(porteuses.map(([id]) => id).sort(), ['faucheuse', 'harpon', 'mortier']);
  for (const [id, mini] of porteuses) {
    assert.ok(mini >= 1, `${id} a un angle mort de ${mini} case : le plancher mord maintenant`);
  }
  // Aucune unité de garnison ne porte le module — sinon il faudrait vérifier
  // son angle mort aussi.
  assert.deepEqual(
    Object.entries(UNITES).filter(([, u]) => u.defense.module === 'rayonMiniMoinsUn'
      || u.moduleOuvrage === 'rayonMiniMoinsUn').map(([id]) => id), [],
  );

  // Le calcul lui-même, refait ici plutôt que recopié : un angle mort d'une
  // demi-case tombe à ZÉRO, pas à 250 000.
  const plancher = (miniMilli) => Math.max(0, miniMilli - 1000) ** 2;
  assert.equal(plancher(500), 0);
  assert.equal(plancher(1000), 0);
  assert.equal(plancher(3500), 2500 * 2500);
});

/**
 * Une garnison du joueur qui porte le Broyeur — seul porteur de `pvPlusVingt`
 * côté joueur — et un Merlon témoin, qui ne le porte pas de ce côté-là.
 */
function sceneDePv({ modules = [], pvMilli } = {}) {
  const broyeur = { id: 'broyeur', rangee: 6, colonne: 5, niveau: 10 };
  const etat = creerCombat({
    niveau: 10,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 10 }],
    defenseurs: [
      pvMilli === undefined ? broyeur : { ...broyeur, pvMilli },
      { id: 'merlon', rangee: 5, colonne: 4, niveau: 10 },
    ],
    proprietaireDefense: 'joueur',
    proprietaireAttaque: 'ouvrage',
    vagues: [[{ id: 'fouisseurs', colonne: 5, rangee: 2, niveau: 10 }]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: { offense: [], defense: modules },
    },
  });
  return {
    etat,
    porteur: etat.entites.find((e) => e.id === 'broyeur'),
    temoin: etat.entites.find((e) => e.id === 'merlon'),
  };
}

test('MODULES-D T9 — PV +20 % sur une pièce montée PLEINE', () => {
  const sans = sceneDePv();
  const avec = sceneDePv({ modules: ['pvPlusVingt'] });

  assert.equal(sans.porteur.pvMaxMilli, 4716000, 'montage : les PV nominaux ont bougé');
  assert.equal(avec.porteur.pvMaxMilli, Math.floor((4716000 * 120) / 100));
  assert.equal(avec.porteur.pvMaxMilli, 5659200);

  // ⚠ ET LES PV COURANTS SUIVENT, parce que la pièce est montée pleine. Une
  // pièce dont le plafond monte sans que sa vie suive arriverait au combat
  // déjà blessée, ce que le module ne dit nulle part.
  assert.equal(avec.porteur.pvMilli, avec.porteur.pvMaxMilli);
  assert.equal(avec.porteur.pvInitialMilli, avec.porteur.pvMaxMilli);

  // ⚠ LE TÉMOIN NE BOUGE PAS. Le Merlon porte `pvPlusVingt` côté OUVRAGE et
  // `autoReparation` côté joueur : dans une garnison du joueur, il n'est pas
  // concerné. Sans cette ligne, une majoration appliquée à tout le monde
  // passerait les deux assertions ci-dessus.
  assert.equal(avec.temoin.pvMaxMilli, sans.temoin.pvMaxMilli);

  // ⚠⚠ UN SEUL `floor`, ET AUCUNE DONNÉE NE LE MESURE — c'est vérifié, pas
  // supposé. Les quatre porteuses valent 1 000, 1 500 ou 2 000 PV nominaux, et
  // `pv × facteurMilli` est alors toujours multiple de 100 : arrondir avant ou
  // après la majoration rend le MÊME nombre à tous les niveaux. La garde est
  // donc à la source, et voici le montage qui la ferait tomber — une pièce de
  // 550 PV au niveau 4, qui n'existe pas encore.
  const source = readFileSync(new URL('../src/sim/combat.js', import.meta.url), 'utf8');
  assert.match(source, /Math\.floor\(\(pvBaseMilli \* \(100 \+ PV_PLUS_VINGT_PCT\)\) \/ 100\)/);
  const base550 = 550 * facteurMilli(4);
  assert.notEqual(Math.floor((base550 * 120) / 100), Math.floor(base550 / 100) * 120);
  for (const pv of [1000, 1500, 2000]) {
    for (let n = 1; n <= NIVEAU.plafond; n += 1) {
      const b = pv * facteurMilli(n);
      assert.equal(Math.floor((b * 120) / 100), Math.floor(b / 100) * 120,
        `pv ${pv} niveau ${n} : le nombre d'arrondis devient mesurable`);
    }
  }

  // Et un Merlon de l'OUVRAGE, lui, est bien majoré : c'est le même module, lu
  // de l'autre côté.
  const chezLOuvrage = creerCombat({
    niveau: 10,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 10 }],
    defenseurs: [{ id: 'merlon', rangee: 5, colonne: 4, niveau: 10 }],
    vagues: [[{ id: 'meute', colonne: 5, rangee: 2, niveau: 10 }]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: ['pvPlusVingt'] },
      joueur: { offense: [], defense: [] },
    },
  });
  const mur = chezLOuvrage.entites.find((e) => e.id === 'merlon');
  assert.equal(mur.pvMaxMilli, Math.floor((sans.temoin.pvMaxMilli * 120) / 100));
});

test('MODULES-D T10 — sur une pièce ENTAMÉE, seul le plafond monte', () => {
  const base = sceneDePv().porteur.pvMaxMilli;
  const entame = Math.floor(base / 2);

  const abimee = sceneDePv({ modules: ['pvPlusVingt'], pvMilli: entame });
  assert.equal(abimee.porteur.pvMaxMilli, 5659200, 'le plafond doit monter');
  // ⚠⚠ LA VIE, ELLE, NE BOUGE PAS. Majorer les PV COURANTS d'une pièce entamée
  // soignerait ce que le raid précédent a cassé : acheter le module réparerait
  // d'un coup toutes les garnisons de la carte.
  assert.equal(abimee.porteur.pvMilli, entame);
  assert.equal(abimee.porteur.pvInitialMilli, entame,
    '`pvInitialMilli` suit `pvMilli`, jamais `pvMaxMilli`');

  // Montée PLEINE au sens de l'appelant — qui compte en PV NOMINAUX, sans
  // module — les deux montent quand même. C'est la frontière de la règle.
  const pleine = sceneDePv({ modules: ['pvPlusVingt'], pvMilli: base });
  assert.equal(pleine.porteur.pvMilli, 5659200);
  assert.equal(pleine.porteur.pvInitialMilli, 5659200);

  // ⚠ LE BUTIN NE BOUGE PAS, ET CE N'EST PAS UNE COÏNCIDENCE : `butin` ne lit
  // que `resultat.batiments`, et aucun bâtiment de site ne porte de module. La
  // majoration ne peut donc pas déplacer une seule unité de quartz.
  const source = readFileSync(new URL('../src/sim/combat.js', import.meta.url), 'utf8');
  const corps = source.slice(source.indexOf('export function butin('));
  assert.equal(corps.slice(0, corps.indexOf('\n}')).includes('resultat.defenses'), false,
    '`butin` lit désormais les défenses : la majoration de PV le déplacerait');

  // Et aucun bâtiment de site ne porte de module de défense — le profil des
  // bâtiments les met tous les deux à `null`, et un test le tient de face.
  assert.match(source, /genre: 'batiment',[\s\S]*?moduleDefenseJoueur: null,\n\s*moduleDefenseOuvrage: null,/);
});

/**
 * Une partie prête à raider, avec une garnison forgée.
 *
 * ⚠ LA GARNISON EST FORGÉE PARCE QU'ELLE NE PEUT PAS L'ÊTRE AUTREMENT. Rien,
 * dans tout `src/`, n'écrit `degatsMilli` sur `etat.garnison` : la base du
 * joueur n'est jamais attaquée. L'état de départ de ce test est donc un état que
 * le jeu ne sait pas produire — c'est assumé, et c'est précisément ce que le
 * rapport dit en toutes lettres.
 */
function partieAvecGarnison(garnison, modulesDefense) {
  const etat = creerEtat(2026);
  rattraperJeu(etat, 3001);
  for (let c = 1; c <= 6; c += 1) {
    etat.armee.push({ id: 'meute', vague: 1, colonne: c, niveau: 1, degatsMilli: 0 });
  }
  etat.garnison.push(...garnison);
  etat.recherche.modules.defense.push(...modulesDefense);
  const camp = etat.satellites.presents.find((x) => x.type === 'camp');
  assert.ok(camp, 'montage : aucun camp autour de la base');
  return { etat, cible: { rangee: camp.rangee, colonne: camp.colonne } };
}

test('MODULES-D T11 — l\'Auto-réparation rend 20 % des DÉGÂTS, et seulement à qui y a droit', () => {
  // 1 009 n'est pas un multiple de 5 : le `Math.floor` se voit.
  const abime = 1009;
  const { etat, cible } = partieAvecGarnison([
    // porte le module ET il est acquis → réparée
    { id: 'merlon', rangee: 5, colonne: 5, niveau: 1, degatsMilli: abime },
    // porte le module mais il n'est PAS acquis → intacte
    { id: 'ronce', rangee: 5, colonne: 6, niveau: 1, degatsMilli: abime },
    // module acquis, mais elle porte `rayonMiniMoinsUn` → intacte
    { id: 'faucheuse', rangee: 5, colonne: 7, niveau: 1, degatsMilli: abime },
    // porteuse, acquise, mais sans une égratignure → rien à rendre
    { id: 'casemate', rangee: 5, colonne: 8, niveau: 1, degatsMilli: 0 },
  ], ['merlon', 'faucheuse', 'casemate']);

  const rapport = executerRaid(etat, etat, cible);
  assert.ok(rapport.ticks > 0, 'montage : le raid n\'a pas eu lieu');

  const par = Object.fromEntries(etat.garnison.map((p) => [p.id, p.degatsMilli]));
  // floor(1009 × 20 / 100) = 201, et non 202 : 20 % des DÉGÂTS, arrondi vers le bas.
  assert.equal(par.merlon, abime - 201, 'le porteur acquis doit regagner 201 milli-PV');
  // ⚠ CES TROIS-LÀ SONT LES GARDES. Retirer le contrôle `moduleEstAcquis` ferait
  // tomber la Ronce ; retirer `nomDuModule` ferait tomber la Faucheuse ; ne pas
  // appeler la suite du tout ferait tomber le Merlon.
  assert.equal(par.ronce, abime, 'module non acquis : rien ne doit être rendu');
  assert.equal(par.faucheuse, abime, 'ce n\'est pas ce module-là : rien ne doit être rendu');
  assert.equal(par.casemate, 0, 'une pièce intacte reste à zéro');

  // Et les six porteurs sont bien ceux du brief, mesurés et non supposés.
  const porteurs = Object.keys(DEFENSES).filter((id) => nomDuModule('defense', id) === 'autoReparation');
  assert.deepEqual(porteurs, ['merlon', 'ronce', 'herse', 'casemate', 'creneau', 'batterie']);
});

test('MODULES-D T12 — l\'ARMÉE n\'est pas touchée par la suite de garnison', () => {
  const pvMax = pvMaxDeLUnite('meute', 1);
  const auPlancher = pvMax - APRES_RAID.plancherPvMilli;
  const { etat, cible } = partieAvecGarnison(
    [{ id: 'merlon', rangee: 5, colonne: 5, niveau: 1, degatsMilli: 1009 }],
    ['merlon'],
  );
  // Une septième unité déjà au plancher : `composerLesVagues` la laisse à la
  // maison, donc `reporterLesDegats` ne la réécrit pas. Si la suite parcourait
  // `etat.armee`, elle serait la seule pièce dont les dégâts pourraient baisser
  // sans que le combat y soit pour quelque chose.
  etat.armee.push({ id: 'meute', vague: 1, colonne: 9, niveau: 1, degatsMilli: auPlancher });

  executerRaid(etat, etat, cible);

  assert.equal(etat.garnison[0].degatsMilli, 1009 - 201, 'montage : la garnison doit être réparée');
  const restee = etat.armee.at(-1);
  assert.equal(restee.degatsMilli, auPlancher, 'l\'unité restée à la maison ne se soigne pas');
  // Les unités engagées portent EXACTEMENT ce que le combat leur a laissé : une
  // pièce au plancher a `pvMax − plancher` de dégâts, au milli-PV près. Un
  // rabais de 20 % s'y verrait tout de suite.
  for (const piece of etat.armee) {
    assert.ok(piece.degatsMilli <= auPlancher, 'dégâts au-delà du plancher');
    if (piece.degatsMilli === 0) continue;
    assert.equal(Number.isInteger(piece.degatsMilli), true);
  }

  // ⚠ LA VRAIE RAISON POUR LAQUELLE L'ARMÉE EST HORS D'ATTEINTE, mesurée : aucune
  // UNITÉ ne porte l'Auto-réparation en défense — les six porteurs sont tous des
  // ouvrages de `DEFENSES`. Le jour où une unité la porterait, ce test tombe, et
  // c'est ce qu'on veut : la suite parcourt `etat.garnison`, pas `etat.armee`.
  const unitesPorteuses = Object.keys(UNITES)
    .filter((id) => UNITES[id].defense?.module === 'autoReparation');
  assert.deepEqual(unitesPorteuses, []);
  const source = readFileSync(new URL('../src/sim/raid.js', import.meta.url), 'utf8');
  const corps = source.slice(source.indexOf('function reparerLaGarnison('));
  const fin = corps.slice(0, corps.indexOf('\n}'));
  assert.match(fin, /for \(const piece of etat\.garnison\)/);
  assert.equal(fin.includes('etat.armee'), false, 'la suite ne doit jamais nommer l\'armée');
});

/** Les quatre modules que ce lot câble, dans l'ordre de la table. */
const QUATRE = ['autoReparation', 'pvPlusVingt', 'rayonMiniMoinsUn', 'rayonPlusUn'];

test('MODULES-D T13 — `cable` par branche pour les quatre modules défensifs', () => {
  // ⚠ LE DRAPEAU D'OFFENSE RESTE FAUX, ET C'EST LA MOITIÉ QUI COMPTE. Le
  // Guetteur porte le Camouflage à l'assaut et Rayon +1 en garnison : ses deux
  // lignes s'ouvrent, mais pour deux modules DIFFÉRENTS. Un `offense: true` de
  // trop lui vendrait le mauvais.
  for (const nom of QUATRE) {
    assert.equal(moduleEstCable(nom, 'defense'), true, `${nom} en défense`);
    assert.equal(moduleEstCable(nom, 'offense'), false, `${nom} en offense`);
  }

  // L'ACHAT, pas seulement le drapeau : chaque ligne s'ouvre pour de vrai.
  const etat = partie('99999999999999999');
  const ouvertes = { offense: [], defense: [] };
  for (const branche of BRANCHES) {
    for (const id of Object.keys(ARBRE_RECHERCHE[branche])) {
      const nom = nomDuModule(branche, id);
      if (!QUATRE.includes(nom)) continue;
      ouvertes[branche].push(`${id}:${nom}`);
      if (!estAcquise(etat, branche, id)) acheter(etat, branche, id, 'unite');
      assert.deepEqual(problemesDeLAchat(etat, branche, id, 'module'), [],
        `${branche}/${id} refuse alors qu'il est câblé`);
      acheter(etat, branche, id, 'module');
      assert.equal(moduleEstAcquis(etat, branche, id), true);
    }
  }
  // ⚠ COMPTÉ EN PARCOURANT L'ARBRE, PAS DE TÊTE — la leçon de MODULES-B, dont le
  // brief annonçait six lignes là où il y en avait cinq. ONZE lignes, toutes en
  // défense, AUCUNE en offense. C'est le chiffre du rapport.
  assert.equal(ouvertes.defense.length, 11);
  assert.deepEqual(ouvertes.defense.sort(), [
    'batterie:autoReparation', 'broyeur:pvPlusVingt', 'casemate:autoReparation',
    'creneau:autoReparation', 'faucheuse:rayonMiniMoinsUn', 'guetteur:rayonPlusUn',
    'harpon:rayonMiniMoinsUn', 'herse:autoReparation', 'merlon:autoReparation',
    'mortier:rayonMiniMoinsUn', 'ronce:autoReparation',
  ]);
  assert.deepEqual(ouvertes.offense, [],
    'une ligne d\'offense porte un des quatre : revoir `cable.offense`');

  // Et le Guetteur, le cas qui a imposé la forme : deux branches, deux modules,
  // les deux achetés sur le même état.
  assert.equal(nomDuModule('offense', 'guetteur'), 'camouflage');
  assert.equal(nomDuModule('defense', 'guetteur'), 'rayonPlusUn');
  acheter(etat, 'offense', 'guetteur', 'unite');
  acheter(etat, 'offense', 'guetteur', 'module');
  assert.ok(moduleEstAcquis(etat, 'offense', 'guetteur'));
  assert.ok(moduleEstAcquis(etat, 'defense', 'guetteur'));
});

/** Une garnison DU JOUEUR attaquée, défenseurs dans l'ordre demandé. */
function garnisonAttaquee(ordre, modules) {
  const defenseurs = [
    { id: 'merlon', rangee: 5, colonne: 5, niveau: 20 },
    { id: 'broyeur', rangee: 6, colonne: 6, niveau: 20 },
    { id: 'guetteur', rangee: 6, colonne: 4, niveau: 20 },
    { id: 'faucheuse', rangee: 9, colonne: 5, niveau: 20 },
    { id: 'mortier', rangee: 10, colonne: 7, niveau: 20 },
  ];
  return creerCombat({
    niveau: 20,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
    defenseurs: ordre.map((i) => defenseurs[i]),
    vagues: [[
      { id: 'belier', colonne: 5, rangee: 2, niveau: 40 },
      { id: 'belier', colonne: 4, rangee: 2, niveau: 40 },
      { id: 'meute', colonne: 6, rangee: 3, niveau: 40 },
    ]],
    // ⚠ LA BASE DU JOUEUR EST ATTAQUÉE, ET C'EST LE SEUL CHEMIN QUI L'ÉCRIT.
    // `montageDefense` de `ui/banc.js` est aujourd'hui le seul appelant en jeu :
    // ces trois modules sont donc câblés et INVISIBLES pour le joueur tant que
    // les attaques sur sa base n'existent pas. Le banc, lui, les voit.
    proprietaireDefense: 'joueur',
    proprietaireAttaque: 'ouvrage',
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: { offense: [], defense: modules },
    },
  });
}

test('MODULES-D T14 — le déterminisme tient avec les trois modules de combat', () => {
  const tous = ['pvPlusVingt', 'rayonPlusUn', 'rayonMiniMoinsUn'];
  const jouer = (ordre) => {
    const etat = garnisonAttaquee(ordre, tous);
    for (let t = 1; t <= 150 && !etat.termine; t += 1) tick(etat);
    return { etat, vue: projectionCanonique(etat) };
  };

  // Bit à bit d'abord : deux exécutions du MÊME montage.
  const a = jouer([0, 1, 2, 3, 4]);
  assert.equal(serialiserEtat(a.etat), serialiserEtat(jouer([0, 1, 2, 3, 4]).etat));

  // ⚠ LA PERMUTATION DOIT VRAIMENT PERMUTER, sinon tout ce qui suit est trivial.
  const rangs = (e) => e.entites.map((x) => x.id).join(',');
  const b = jouer([4, 3, 2, 1, 0]);
  assert.notEqual(rangs(a.etat), rangs(b.etat), 'montage : les deux ordres sont identiques');
  for (const ordre of [[4, 3, 2, 1, 0], [2, 0, 4, 1, 3], [1, 4, 0, 3, 2]]) {
    assert.deepEqual(jouer(ordre).vue, a.vue, `ordre ${ordre.join('')}`);
  }

  // ⚠ ET LE MONTAGE N'EST PAS VACANT : les trois modules ont mesurablement joué.
  // Sans ces trois gardes, un combat où aucun ne s'applique passerait le test en
  // ne prouvant rien. Les valeurs sont celles du banc, au milli près.
  const temoin = garnisonAttaquee([0, 1, 2, 3, 4], []);
  const par = (etat, id) => etat.entites.find((e) => e.camp === 'defense' && e.id === id);
  assert.equal(par(temoin, 'broyeur').pvMaxMilli, 12232000);
  assert.equal(par(a.etat, 'broyeur').pvMaxMilli, 14678400, 'PV +20 % n\'a pas joué');
  assert.equal(par(temoin, 'guetteur').porteeCarree, 2500 * 2500);
  assert.equal(par(a.etat, 'guetteur').porteeCarree, 3500 * 3500, 'Rayon +1 n\'a pas joué');
  assert.equal(par(temoin, 'faucheuse').porteeMiniCarree, 3500 * 3500);
  assert.equal(par(a.etat, 'faucheuse').porteeMiniCarree, 2500 * 2500,
    'Rayon minimum −1 n\'a pas joué');
  // Et la garnison a bien tiré : le combat a eu lieu, il ne s'est pas figé.
  const visent = a.etat.entites.filter((e) => e.camp === 'defense' && e.cibleIndice !== null);
  assert.equal(visent.length >= 3, true, 'montage : la garnison n\'a rien visé');

  // ⚠ ET LA PROJECTION VOIT BIEN CE QUE CE LOT AJOUTE. Deux états qui ne
  // diffèrent QUE par la portée doivent donner deux projections différentes —
  // sans quoi tout ce qui précède serait vrai d'une projection aveugle.
  const decale = jouer([0, 1, 2, 3, 4]);
  assert.deepEqual(decale.vue, a.vue, 'montage : même ordre, même projection');
  par(decale.etat, 'guetteur').porteeCarree += 1;
  assert.notDeepEqual(projectionCanonique(decale.etat), a.vue,
    'la projection est aveugle à la portée : elle ne mesure pas ce lot');
  const bis = jouer([0, 1, 2, 3, 4]);
  par(bis.etat, 'broyeur').pvMaxMilli += 1;
  assert.notDeepEqual(projectionCanonique(bis.etat), a.vue,
    'la projection est aveugle au plafond de PV');
});

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
  //
  // ⚠ RÉÉCRIT AU LOT MODULES-C, ET LE COUPLE DE REFUS A CHANGÉ. Cette ligne
  // portait « la pièce doit être débloquée » ET « n'a pas encore d'effet en
  // jeu » : le Bouclier étant désormais câblé, la seconde a disparu et c'est
  // « il manque … points » qui l'accompagne. Ce qui est testé reste
  // l'ACCUMULATION — deux refus tiennent sur la même ligne, séparés par « ; ».
  const modBloc = bloc('enclume').children.find((c) => c.className === 'module');
  const modRaison = modBloc.children.find((c) => c.className === 'raison');
  assert.match(modRaison.textContent, /la pièce doit être débloquée avant son module/);
  assert.match(modRaison.textContent, /il manque/);
  // Et le Bouclier NE porte plus le refus d'effet. MONTAGE QUI LE FAIT
  // TOMBER : repasser `bouclier.cable.offense` à `false` — la mention revient.
  assert.ok(!/n'a pas encore d'effet en jeu/.test(modRaison.textContent),
    'le Bouclier est déclaré sans effet alors qu\'il est câblé');

  // Un module réellement non câblé, lui, le dit — la Buse porte la Garnison,
  // qui n'a pas de moteur. Sa pièce est gratuite, donc acquise : le seul refus
  // d'effet s'affiche sans être noyé dans celui de la pièce.
  const busard = bloc('busard').children.find((c) => c.className === 'module');
  const busardRaison = busard.children.find((c) => c.className === 'raison');
  assert.match(busardRaison.textContent, /n'a pas encore d'effet en jeu/);

  // ⚠ ET L'ÉCRASEUR NE PORTE PAS CE REFUS NON PLUS. Il était le seul câblé au
  // lot Recherche ; ils sont sept depuis MODULES-C. Les sept autres modules
  // s'affichent et ne s'achètent pas, parce que prendre les points du joueur
  // contre rien serait un vol.
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

// ---------------------------------------------------------------------------
// Lot MODULES-E — un module acheté dans UNE branche ne sert QUE dans celle-là
//
// ⚠⚠ LE SENS DE LA FUITE N'EST PAS CELUI QU'ANNONÇAIT LE BRIEF, ET C'EST LA
// MESURE QUI TRANCHE. Le brief décrivait « acheter le module DÉFENSE des
// Perceurs (200 M) débloque le Tir de barrage pour l'Obusier en OFFENSE ». Cet
// achat-là LÈVE : `cable.tirDeBarrage.defense` vaut `false` depuis MODULES-A,
// donc `problemesDeLAchat` rend `effetNonCable`. Les quatre noms en collision
// sont câblés en OFFENSE seulement — la fuite ne pouvait partir que de là.
// Le premier test ci-dessous ferme les DEUX sens quand même : le sens
// aujourd'hui inatteignable par la boutique le devient dès qu'un drapeau
// `cable` bascule, et c'est exactement ce que ce lot prévient.
// ---------------------------------------------------------------------------

/** Les porteurs de chaque nom de module, par branche, RELEVÉS sur l'arbre. */
function porteursParNom() {
  const par = {};
  for (const branche of BRANCHES) {
    for (const id of Object.keys(ARBRE_RECHERCHE[branche])) {
      const nom = nomDuModule(branche, id);
      if (nom === null) continue;
      (par[nom] ??= { offense: [], defense: [] })[branche].push(id);
    }
  }
  return par;
}

/** Achète l'unité PUIS le module d'une ligne, et rend les listes débloquées. */
function achatDeLaLigne(branche, id) {
  const etat = partie('999999999999999');
  if (problemesDeLAchat(etat, branche, id, 'unite').length === 0) {
    acheter(etat, branche, id, 'unite');
  }
  const soucis = problemesDeLAchat(etat, branche, id, 'module');
  if (soucis.length > 0) return { soucis, listes: null };
  acheter(etat, branche, id, 'module');
  return { soucis, listes: modulesDebloquesDuJoueur(etat) };
}

/**
 * La scène de barrage de MODULES-A, le module rangé dans la branche demandée.
 *
 * ⚠ LE TIR DE BARRAGE EST LE SEUL DES QUATRE NOMS EN COLLISION DONT L'EFFET SE
 * MESURE. `flashbang` et `emp` ne sont lus que dans `declencherNeutralisations`,
 * gardée au camp `attaque` : un porteur EN GARNISON ne les consulte jamais, et
 * une assertion de PV y passerait des deux côtés sans rien prouver.
 */
function barrageRangeDans(branche) {
  return creerCombat({
    niveau: 1,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 15, colonne: 1, niveau: 1 }],
    defenseurs: [
      { id: 'merlon', rangee: 3, colonne: 5, niveau: 1 },
      { id: 'merlon', rangee: 3, colonne: 4, niveau: 1 },
    ],
    vagues: [[{ id: 'perceurs', colonne: 5, rangee: 2, niveau: 1 }]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: {
        offense: branche === 'offense' ? ['tirDeBarrage'] : [],
        defense: branche === 'defense' ? ['tirDeBarrage'] : [],
      },
    },
  });
}

test('MODULES-E T1 — la fuite est fermée dans les DEUX sens', () => {
  // SENS 1, celui que la boutique atteint : acheter en OFFENSE ne doit rien
  // ouvrir en défense. Sous l'union, les deux listes étaient identiques.
  const off = achatDeLaLigne('offense', 'perceurs');
  assert.deepEqual(off.soucis, [], 'montage : la ligne offense des Perceurs doit être achetable');
  assert.deepEqual(off.listes, { offense: ['tirDeBarrage'], defense: [] });

  // SENS 2, l'autre : acheter en DÉFENSE ne doit rien ouvrir en offense.
  const def = achatDeLaLigne('defense', 'merlon');
  assert.deepEqual(def.soucis, [], 'montage : la ligne défense du Merlon doit être achetable');
  assert.deepEqual(def.listes, { offense: [], defense: ['autoReparation'] });

  // ⚠ ET LE MOTEUR SUIT, pas seulement la liste. Le Tir de barrage rangé dans
  // la branche `defense` ne doit rien faire à un porteur qui ATTAQUE.
  const bon = pertesAuPremierTick(barrageRangeDans('offense'));
  const mauvais = pertesAuPremierTick(barrageRangeDans('defense'));
  assert.ok(bon.get('3,5') > 0, 'montage sans mordant : le tir direct ne retire rien');
  assert.equal(mauvais.get('3,5'), bon.get('3,5'), 'le tir direct doit être le même des deux côtés');
  assert.ok(bon.get('3,4') > 0, 'le module rangé dans SA branche ne déclenche plus le barrage');
  assert.equal(mauvais.get('3,4'), 0,
    'le module rangé dans l\'AUTRE branche éclabousse encore : la fuite est ouverte');

  // ⚠ CE QUI FERAIT TOMBER CE TEST : indexer `moduleActif` par `e.camp` au lieu
  // de passer par `BRANCHE_DU_CAMP`. `modulesDebloques.joueur.attaque` vaut
  // `undefined`, `undefined?.includes` ne lève pas — les deux relevés
  // tomberaient à 0 et la troisième assertion sauterait. Un `?? []` posé sur la
  // branche manquante donnerait le même effondrement silencieux.
});

test('MODULES-E T2 — les quatre collisions, une par une', () => {
  const par = porteursParNom();
  const collisions = Object.entries(par)
    .filter(([, v]) => v.offense.length > 0 && v.defense.length > 0)
    .map(([nom]) => nom).sort();
  // ⚠ LA TABLE EST RELEVÉE, PAS RECOPIÉE. Si l'arbre gagne un cinquième nom
  // porté des deux côtés, ce test tombe et le lot doit être repassé.
  assert.deepEqual(collisions, ['emp', 'flashbang', 'garnison', 'tirDeBarrage']);

  // Chaque collision, prise séparément : l'achat de la ligne câblée range le
  // nom dans SA branche et laisse l'autre vide.
  const attendu = { flashbang: 'meute', tirDeBarrage: 'perceurs', emp: 'crecelle' };
  for (const [nom, id] of Object.entries(attendu)) {
    assert.ok(par[nom].offense.includes(id) && par[nom].defense.length > 0,
      `montage : ${nom} n'est plus une collision portée par ${id}`);
    const r = achatDeLaLigne('offense', id);
    assert.deepEqual(r.soucis, [], `${nom} : la ligne offense de ${id} n'est plus achetable`);
    assert.deepEqual(r.listes, { offense: [nom], defense: [] },
      `${nom} acheté en offense fuit vers la défense`);
  }

  // ⚠ `garnison` EST LA QUATRIÈME, ET ELLE N'EST CÂBLÉE NULLE PART. Aucune de
  // ses deux lignes ne s'achète : la collision existe dans la table et ne peut
  // pas encore fuir. Le dire vaut mieux que la faire passer sous silence.
  assert.equal(moduleEstCable('garnison', 'offense'), false);
  assert.equal(moduleEstCable('garnison', 'defense'), false);
  for (const branche of BRANCHES) {
    const r = achatDeLaLigne(branche, 'ratisseur');
    assert.deepEqual(r.soucis.map((s) => s.code), ['effetNonCable'],
      `garnison est devenue achetable en ${branche} : reprendre la table`);
  }
});

test('MODULES-E T3 — les modules SANS collision ne bougent pas', () => {
  // La garde qui protège MODULES-A à D : tout ce qui n'est porté que d'un côté
  // doit continuer de se débloquer exactement comme avant, dans SA branche.
  const par = porteursParNom();
  let vus = 0;
  for (const [nom, v] of Object.entries(par)) {
    if (v.offense.length > 0 && v.defense.length > 0) continue;
    const branche = v.offense.length > 0 ? 'offense' : 'defense';
    if (!moduleEstCable(nom, branche)) continue;
    const r = achatDeLaLigne(branche, v[branche][0]);
    assert.deepEqual(r.soucis, [], `${nom} : ${v[branche][0]} n'est plus achetable en ${branche}`);
    assert.deepEqual(r.listes, {
      offense: branche === 'offense' ? [nom] : [],
      defense: branche === 'defense' ? [nom] : [],
    }, `${nom} n'atterrit plus dans la branche ${branche}`);
    vus += 1;
  }
  // ⚠ CE QUI FERAIT TOMBER CE TEST : un `?? []` sur la branche lue par
  // `moduleActif`, ou une union rétablie « pour compatibilité » — les huit noms
  // se retrouveraient dans les deux listes. Le compte, lui, garde le balayage
  // honnête : sans lui, une table vide passerait pour un succès.
  assert.equal(vus, 8, `${vus} modules sans collision câblés, 8 attendus`);
});

test('MODULES-E T4 — la table camp→branche couvre les deux camps', () => {
  // ⚠ LE PIÈGE DU LOT EST ICI, ET IL EST SILENCIEUX. `camp` vaut `attaque` ou
  // `defense`, la branche vaut `offense` ou `defense` : le second terme
  // coïncide, le premier NON. Une indexation directe par `e.camp` éteindrait
  // TOUS les modules offensifs sans lever la moindre erreur.
  const source = readFileSync(new URL('../src/sim/combat.js', import.meta.url), 'utf8');
  assert.match(source, /const BRANCHE_DU_CAMP = \{ attaque: 'offense', defense: 'defense' \};/,
    'la table nommée a disparu : le ternaire est revenu');
  assert.match(source, /BRANCHE_DU_CAMP\[e\.camp\]/,
    '`moduleActif` ne passe plus par la table');
  assert.doesNotMatch(source, /modulesDebloques\?\.\[e\.proprietaire\]\?\.\[e\.camp\]/,
    'la branche est indexée par le camp : les modules offensifs sont morts');

  // Et les deux camps répondent VRAIMENT, chacun par sa branche. Un module
  // offensif sur un attaquant, un module défensif sur un défenseur, dans le
  // MÊME combat : si la table ne rendait qu'une branche, l'un des deux serait
  // éteint.
  // ⚠ LA RONCE EST INDISPENSABLE : `declencherBoosters` ne marque que les
  // porteurs BLESSÉS. Sans elle le Cuirassier traverse intact et le camp
  // ATTAQUE ne serait pas mesuré du tout.
  const scenePourLesDeuxCamps = (debloques) => creerCombat({
    niveau: 10,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 10 }],
    defenseurs: [
      { id: 'ronce', rangee: 3, colonne: 5, niveau: 1 },
      { id: 'merlon', rangee: 6, colonne: 5, niveau: 10 },
    ],
    vagues: [[{ id: 'carapace', colonne: 5, rangee: 2, niveau: 20 }]],
    modulesDebloques: debloques,
  });
  const etat = scenePourLesDeuxCamps({
    ouvrage: { offense: [], defense: ['pvPlusVingt'] },
    joueur: { offense: ['booster'], defense: [] },
  });
  const mur = etat.entites.find((e) => e.id === 'merlon');
  const temoin = scenePourLesDeuxCamps({
    ouvrage: { offense: [], defense: [] },
    joueur: { offense: [], defense: [] },
  });
  const nu = temoin.entites.find((e) => e.id === 'merlon');
  assert.equal(mur.pvMaxMilli, Math.floor((nu.pvMaxMilli * 120) / 100),
    'le camp DÉFENSE ne lit plus sa branche');
  for (let t = 1; t <= 25; t += 1) tick(etat);
  const cuirassier = etat.entites.find((e) => e.id === 'carapace');
  assert.deepEqual(cuirassier.modulesActifs, ['booster'],
    'le camp ATTAQUE ne lit plus sa branche');
});

test('MODULES-E T5 — l\'ancienne forme plate LÈVE, et nomme le propriétaire', () => {
  const base = {
    niveau: 1,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 15, colonne: 5, niveau: 1 }],
    defenseurs: [{ id: 'merlon', rangee: 5, colonne: 5, niveau: 1 }],
    vagues: [[{ id: 'fendeur', colonne: 5, rangee: 2, niveau: 1 }]],
  };
  const vide = { offense: [], defense: [] };
  // ⚠ ON NE RÉPARE PAS LA FORME PLATE, ON LA REFUSE. L'accepter laisserait
  // vivre côte à côte deux formes du même montage, et la fuite reviendrait par
  // le producteur qu'on aurait oublié de migrer.
  assert.throws(
    () => creerCombat({ ...base, modulesDebloques: { ouvrage: ['pvPlusVingt'], joueur: vide } }),
    /modulesDebloques\.ouvrage est une liste plate/);
  assert.throws(
    () => creerCombat({ ...base, modulesDebloques: { ouvrage: vide, joueur: ['ecraseur'] } }),
    /modulesDebloques\.joueur est une liste plate/);
  // Une branche manquante lève aussi : la forme est complète ou elle n'est pas.
  assert.throws(
    () => creerCombat({ ...base, modulesDebloques: { ouvrage: vide, joueur: { offense: [] } } }),
    /modulesDebloques\.joueur n'a pas de branche « defense »/);
  assert.throws(
    () => creerCombat({ ...base, modulesDebloques: { ouvrage: vide, joueur: { offense: [1], defense: [] } } }),
    /modulesDebloques\.joueur\.offense n'est pas une liste de noms/);

  // ⚠ MAIS L'ABSENCE RESTE PERMISE, et ce n'est pas un oubli : onze montages de
  // `combat.test.js`, les cinq d'`assaut` et les cinq de `site-entame` ne
  // portent pas la clé. Les leur imposer serait un autre lot.
  assert.doesNotThrow(() => creerCombat(base));
  assert.doesNotThrow(() => creerCombat({ ...base, modulesDebloques: { ouvrage: vide } }));
});

test('MODULES-E T6 — les points de recherche lisent la branche DÉFENSE, au point près', () => {
  // ⚠ MÊME RELEVÉ QU'À MODULES-D T4, ET C'EST VOULU. Ce lot ne doit déplacer
  // aucun point : le raid de référence rend les mêmes nombres, à l'unité.
  assert.equal(raidDeReference([]).points, 2059722n,
    'les points du raid de référence ont bougé');
  assert.equal(raidDeReference(['pvPlusVingt']).points, 2106166n,
    'le bonus de 20 % de l\'Ouvrage a bougé');

  // ⚠ ET C'EST BIEN `montage.proprietaireDefense` QUI DÉSIGNE LA LISTE, pas la
  // chaîne `'ouvrage'` en dur. Le MÊME raid, la base du joueur attaquée : les
  // points doivent alors suivre la liste DU JOUEUR, branche défense.
  const troisNoms = ['autoReparation', 'flashbang', 'tirDeBarrage'];
  const chezLeJoueur = (debloques) => {
    const montage = { ...raidDeReferenceMontage(), proprietaireDefense: 'joueur',
      proprietaireAttaque: 'ouvrage', modulesDebloques: debloques };
    return pointsRecherche(resoudre(creerCombat(montage), { maxTicks: 600 }), montage);
  };
  const vide = { offense: [], defense: [] };
  assert.equal(chezLeJoueur({ ouvrage: vide, joueur: vide }), 2059722n,
    'le raid de référence ne rend plus le même total quand le joueur défend');
  assert.equal(chezLeJoueur({ ouvrage: vide, joueur: { offense: [], defense: troisNoms } }),
    2471666n, '`pointsRecherche` ne lit plus la liste du DÉFENSEUR');

  // ⚠ LES DEUX CONTRE-CAS, ET ILS SONT DISTINCTS. La branche d'abord : les
  // mêmes noms rangés en `offense` ne majorent rien. Le propriétaire ensuite :
  // rangés chez l'Ouvrage, qui ATTAQUE ici, ils ne majorent rien non plus —
  // c'est ce que ferait un `'ouvrage'` repris en dur.
  assert.equal(chezLeJoueur({ ouvrage: vide, joueur: { offense: troisNoms, defense: [] } }),
    2059722n, 'la branche offense majore les points : la fuite est ouverte');
  assert.equal(chezLeJoueur({ ouvrage: { offense: [], defense: troisNoms }, joueur: vide }),
    2059722n, 'la liste de l\'ATTAQUANT majore les points : le propriétaire est en dur');
});

test('MODULES-E T7 — contre-épreuve : le même nom dans l\'AUTRE branche ne rapporte rien', () => {
  // Sans cette contre-épreuve, T6 passerait sur un barème qui ne majore jamais
  // rien : les deux nombres seraient égaux et personne ne le verrait.
  const montage = {
    niveau: 20,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
    defenseurs: [
      { id: 'merlon', rangee: 5, colonne: 5, niveau: 20 },
      { id: 'meute', rangee: 6, colonne: 4, niveau: 20 },
      { id: 'perceurs', rangee: 6, colonne: 6, niveau: 18 },
    ],
    vagues: [[
      { id: 'belier', colonne: 5, rangee: 2, niveau: 30 },
      { id: 'belier', colonne: 4, rangee: 2, niveau: 30 },
      { id: 'belier', colonne: 6, rangee: 2, niveau: 30 },
    ]],
    modulesDebloques: {
      ouvrage: { offense: ['pvPlusVingt'], defense: [] },
      joueur: { offense: [], defense: [] },
    },
  };
  const resultat = resoudre(creerCombat(montage), { maxTicks: 600 });
  // ⚠ LA MÊME RÉSOLUTION, LE MÊME MODULE, L'AUTRE BRANCHE : rien ne bouge, ni
  // les PV du Merlon, ni les points. Sous l'union, ce montage rendait 2 106 166.
  assert.equal(pointsRecherche(resultat, montage), 2059722n,
    'la branche offense de l\'Ouvrage majore encore les points de recherche');
  assert.equal(resultat.tick, 120, 'le combat lui-même a changé : le module a été lu');
});

test('MODULES-E T8 — le déterminisme tient, les deux branches armées', () => {
  // La projection canonique de MODULES-B T10, réutilisée telle quelle : elle
  // couvre déjà `modulesActifs`, `effetsTemporises`, le réservoir de bouclier,
  // la portée et le plafond de PV.
  const jouer = () => {
    const etat = creerCombat({
      niveau: 20,
      obstacles: [],
      batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
      defenseurs: [
        { id: 'merlon', rangee: 5, colonne: 5, niveau: 20 },
        { id: 'guetteur', rangee: 6, colonne: 6, niveau: 20 },
      ],
      proprietaireDefense: 'joueur',
      proprietaireAttaque: 'ouvrage',
      vagues: [[
        { id: 'carapace', colonne: 5, rangee: 2, niveau: 20 },
        { id: 'perceurs', colonne: 4, rangee: 2, niveau: 20 },
      ]],
      modulesDebloques: {
        ouvrage: { offense: ['booster', 'tirDeBarrage'], defense: [] },
        joueur: { offense: [], defense: ['autoReparation', 'rayonPlusUn'] },
      },
    });
    for (let t = 1; t <= 120 && !etat.termine; t += 1) tick(etat);
    return { vue: projectionCanonique(etat), chaine: serialiserEtat(etat) };
  };
  const a = jouer();
  const b = jouer();
  assert.deepEqual(a.vue, b.vue, 'deux parties identiques divergent');
  assert.equal(a.chaine, b.chaine, 'la sérialisation diverge');
  // ⚠ ET LE MONTAGE N'EST PAS INERTE : les quatre modules sont bien lus, sinon
  // ce test comparerait deux combats nus. Le Cuirassier de l'Ouvrage attaque et
  // porte le Booster ; le Guetteur du joueur défend et porte Rayon +1.
  const seul = creerCombat({
    niveau: 20,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
    defenseurs: [{ id: 'guetteur', rangee: 6, colonne: 6, niveau: 20 }],
    proprietaireDefense: 'joueur',
    proprietaireAttaque: 'ouvrage',
    vagues: [[{ id: 'carapace', colonne: 5, rangee: 2, niveau: 20 }]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: { offense: [], defense: [] },
    },
  });
  const nu = seul.entites.find((e) => e.id === 'guetteur');
  const etatArme = creerCombat({
    niveau: 20,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
    defenseurs: [{ id: 'guetteur', rangee: 6, colonne: 6, niveau: 20 }],
    proprietaireDefense: 'joueur',
    proprietaireAttaque: 'ouvrage',
    vagues: [[{ id: 'carapace', colonne: 5, rangee: 2, niveau: 20 }]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: { offense: [], defense: ['rayonPlusUn'] },
    },
  });
  const boostee = etatArme.entites.find((e) => e.id === 'guetteur');
  assert.ok(boostee.porteeCarree > nu.porteeCarree,
    'montage inerte : Rayon +1 n\'est pas lu, le déterminisme ne prouverait rien');

  // ⚠⚠ ET LA MOITIÉ OFFENSIVE AUSSI, sans quoi cette garde serait AVEUGLE au
  // piège du lot. Le camp `defense` et la branche `defense` portent le même
  // mot : une indexation par `e.camp` rendrait la bonne liste pour le Guetteur
  // et `undefined` pour le Cuirassier. Seul le camp ATTAQUE distingue les deux.
  const etatJoue = creerCombat({
    niveau: 20,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
    defenseurs: [{ id: 'guetteur', rangee: 6, colonne: 6, niveau: 20 }],
    proprietaireDefense: 'joueur',
    proprietaireAttaque: 'ouvrage',
    vagues: [[{ id: 'carapace', colonne: 5, rangee: 2, niveau: 20 }]],
    modulesDebloques: {
      ouvrage: { offense: ['booster'], defense: [] },
      joueur: { offense: [], defense: [] },
    },
  });
  for (let t = 1; t <= 120 && !etatJoue.termine; t += 1) tick(etatJoue);
  assert.deepEqual(etatJoue.entites.find((e) => e.id === 'carapace').modulesActifs, ['booster'],
    'montage inerte : le Booster de l\'ATTAQUANT n\'est pas lu');
});

// ---------------------------------------------------------------------------
// Lot MODULES-F — Munition spéciale, Vol de vie, et le canal de l'Ouvrage
//
// Les deux derniers modules sans effet partagent une singularité : le joueur ne
// peut pas les acheter. Aucune pièce ne les porte côté joueur — `moduleJoueur`
// des trois tourelles vaut `autoReparation`, `module` du Broyeur vaut
// `ecraseur` et celui de l'Enclume `bouclier`. Seul `moduleOuvrage` les cite.
// ---------------------------------------------------------------------------

/** Les deux branches vides, pour un propriétaire qui ne débloque rien. */
const RIEN = { offense: [], defense: [] };

/** La colonne dominante d'une table de dégâts, à la règle de `colonneDominante`. */
function dominanteDe(table) {
  if (table === null || table === undefined) return null;
  let meilleure = null;
  let max = 0;
  let exAequo = false;
  for (const colonne of ['infanterie', 'vehicule', 'structureOuAviation']) {
    if (table[colonne] > max) {
      max = table[colonne];
      meilleure = colonne;
      exAequo = false;
    } else if (table[colonne] === max && max > 0) {
      exAequo = true;
    }
  }
  return exAequo ? 'ambigu' : meilleure;
}

/** Le corps d'une fonction de `combat.js`, de sa signature à la suivante. */
function corpsDe(nom) {
  const source = readFileSync(new URL('../src/sim/combat.js', import.meta.url), 'utf8');
  const debut = source.indexOf(`function ${nom}(`);
  assert.notEqual(debut, -1, `fonction ${nom} introuvable`);
  const suite = source.indexOf('\nfunction ', debut + 1);
  return source.slice(debut, suite === -1 ? source.length : suite);
}

/** Une tourelle de garnison face à une seule unité, module armé ou non. */
function tourelleContre(porteur, cible, arme) {
  return creerCombat({
    niveau: 1,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 15, colonne: 1, niveau: 1 }],
    defenseurs: [{ id: porteur, rangee: 4, colonne: 5, niveau: 1 }],
    vagues: [[{ id: cible, colonne: 5, rangee: 3, niveau: 1 }]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: arme ? ['munitionSpeciale'] : [] },
      joueur: RIEN,
    },
  });
}

/** Les PV que `cible` perd au PREMIER tick de la scène. */
function perteAuPremierTick(etat, cibleId) {
  const c = etat.entites.find((e) => e.id === cibleId);
  const avant = c.pvMilli;
  tick(etat);
  return avant - c.pvMilli;
}

test('MODULES-F T1 — la Munition spéciale majore la colonne de PRÉDILECTION, et elle seule', () => {
  // ⚠ LES TROIS PORTEUSES COUVRENT LES TROIS COLONNES, ce qui rend la grille
  // complète : Casemate {20, 7, 8} → infanterie, Créneau {10, 35, 0} →
  // véhicule, Batterie {0, 0, 40} → structure/aviation. Aucune colonne n'est
  // testée par une seule porteuse, aucune porteuse par une seule colonne.
  const CIBLE_DE_LA_COLONNE = {
    infanterie: 'meute',            // châssis escouade
    vehicule: 'belier',             // châssis blindé
    structureOuAviation: 'crecelle', // châssis aéronef
  };
  const releve = [];
  for (const porteur of ['casemate', 'creneau', 'batterie']) {
    // La prédilection est LUE SUR LA DONNÉE, jamais écrite en dur : un patch
    // qui majorerait une colonne fixe passerait une assertion codée en dur.
    const predilection = dominanteDe(DEFENSES[porteur].degats);
    assert.ok(predilection !== null && predilection !== 'ambigu',
      `${porteur} : prédilection ${predilection}, la Munition spéciale y serait inerte`);
    let majorees = 0;
    for (const [colonne, cible] of Object.entries(CIBLE_DE_LA_COLONNE)) {
      const nu = perteAuPremierTick(tourelleContre(porteur, cible, false), cible);
      const arme = perteAuPremierTick(tourelleContre(porteur, cible, true), cible);
      releve.push([porteur, colonne, nu, arme]);
      if (colonne === predilection) {
        assert.ok(nu > 0, `montage inerte : ${porteur} ne blesse pas ${cible}`);
        assert.equal(arme, Math.floor((nu * 120) / 100),
          `${porteur} → ${colonne} : la majoration n'est pas +20 % au floor près`);
        assert.notEqual(arme, nu, `${porteur} → ${colonne} : rien n'a bougé`);
        majorees += 1;
      } else {
        assert.equal(arme, nu, `${porteur} → ${colonne} : une colonne hors prédilection a bougé`);
      }
    }
    assert.equal(majorees, 1, `${porteur} : ${majorees} colonnes majorées au lieu d'une`);
  }
  // Le relevé, en clair, pour que le rapport n'ait pas à le recopier de tête.
  assert.deepEqual(releve, [
    ['casemate', 'infanterie', 20000, 24000],
    ['casemate', 'vehicule', 7000, 7000],
    ['casemate', 'structureOuAviation', 8000, 8000],
    ['creneau', 'infanterie', 10000, 10000],
    ['creneau', 'vehicule', 35000, 42000],
    ['creneau', 'structureOuAviation', 0, 0],
    ['batterie', 'infanterie', 0, 0],
    ['batterie', 'vehicule', 0, 0],
    ['batterie', 'structureOuAviation', 40000, 48000],
  ]);
});

test('MODULES-F T2 — la majoration vit dans `degatsContre`, PAS dans `tir`', () => {
  // ⚠ ÉCART AU BRIEF, ET IL EST STRUCTUREL. Le brief demandait « un porteur
  // fictif qui a les deux modules » pour montrer que le Tir de barrage profite
  // de la Munition spéciale. Ce porteur ne peut pas exister : `moduleActif` lit
  // UN SEUL nom par entité (`p.module` à l'assaut, `moduleDefense*` en
  // garnison), les tables de profil ne sont pas exportées, et les deux modules
  // ne cohabitent sur aucune pièce — le barrage est un module d'ATTAQUANT
  // (il ne frappe que `defense` et `batiment`), la Munition spéciale un module
  // de tourelle EN GARNISON. La conséquence se garde donc là où elle se décide.
  const dansDegatsContre = corpsDe('degatsContre');
  const dansTir = corpsDe('tir');
  const dansBarrage = corpsDe('tirDeBarrage');
  assert.match(dansDegatsContre, /MUNITION_PCT/,
    'la majoration a quitté `degatsContre` : le barrage et le ciblage la perdraient');
  assert.doesNotMatch(dansTir, /MUNITION_PCT/,
    'la majoration est remontée dans `tir` : le barrage ne la verrait plus');
  // Et le barrage passe bien par `degatsContre`, donc il en hérite sans qu'une
  // ligne l'y branche. Si un jour une porteuse cumule les deux, ce sera acquis.
  assert.match(dansBarrage, /degatsContre\(etat, e, p, v\)/,
    'le barrage ne calcule plus ses voisines par `degatsContre`');

  // La moitié mesurée : l'identité voisine = floor(direct × 30 / 100) tient.
  // Elle ne garde pas la Munition spéciale — aucune porteuse ne cumule — mais
  // elle garde le chemin par lequel la majoration passerait.
  const scene = (barrage) => creerCombat({
    niveau: 1,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 15, colonne: 1, niveau: 1 }],
    defenseurs: [
      { id: 'merlon', rangee: 3, colonne: 5, niveau: 1 },
      { id: 'merlon', rangee: 3, colonne: 4, niveau: 1 },
    ],
    vagues: [[{ id: 'perceurs', colonne: 5, rangee: 2, niveau: 1 }]],
    modulesDebloques: {
      ouvrage: RIEN,
      joueur: { offense: barrage ? ['tirDeBarrage'] : [], defense: [] },
    },
  });
  const pertes = (barrage) => {
    const etat = scene(barrage);
    const murs = etat.entites.filter((e) => e.id === 'merlon');
    const avant = murs.map((m) => m.pvMilli);
    tick(etat);
    return murs.map((m, i) => avant[i] - m.pvMilli);
  };
  const [directNu, voisineNue] = pertes(false);
  const [direct, voisine] = pertes(true);
  assert.ok(directNu > 0, 'montage inerte : les Perceurs ne touchent rien');
  assert.equal(voisineNue, 0, 'la voisine encaisse sans barrage : le montage ne prouve rien');
  assert.equal(direct, directNu, 'le barrage a changé le tir direct');
  assert.equal(voisine, Math.floor((direct * 30) / 100),
    'la voisine ne reçoit plus exactement 30 % du tir calculé par `degatsContre`');
});

test('MODULES-F T3 — le franchissement des barrières n\'est PAS majoré', () => {
  // Le franchissement passe par `degatsDeFranchissement`, sa propre table en
  // milli-PV et son propre barème. Aucune ligne d'Ethan ne l'y rattache.
  assert.doesNotMatch(corpsDe('degatsDeFranchissement'), /MUNITION_PCT/,
    'la Munition spéciale est entrée dans le franchissement');

  // Et la mesure : une Herse franchie, `munitionSpeciale` débloqué côté Ouvrage.
  // ⚠ CE QUI FERAIT TOMBER CETTE GARDE : une majoration branchée sur la LISTE
  // débloquée au lieu du PORTEUR — la Herse ne porte pas le module (son
  // `moduleOuvrage` est `pvPlusVingt`), mais la liste, elle, le contient ici.
  //
  // Le montage est celui de `generateur T14`, dont le relevé est connu au
  // milli-PV : Herse en rangée 3, Fendeur qui entre sur la case au tick 12 et
  // paie floor(15 000 × 920 / 1000) = 13 800 milli-PV ce tick-là.
  const scene = (arme) => creerCombat({
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [{ id: 'gangue', rangee: 18, colonne: 1 }],
    defenseurs: [{ id: 'herse', rangee: 3, colonne: 5 }],
    vagues: [[{ id: 'fendeur', colonne: 5 }]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: arme ? ['munitionSpeciale'] : [] },
      joueur: RIEN,
    },
  });
  const franchi = (arme) => {
    const etat = scene(arme);
    const f = etat.entites.find((e) => e.camp === 'attaque');
    for (let t = 0; t < 12; t += 1) tick(etat);
    const avant = f.pvMilli;
    tick(etat);
    return avant - f.pvMilli;
  };
  const nu = franchi(false);
  assert.equal(nu, 13_800, 'montage inerte : le Fendeur ne franchit rien, la garde ne mesure rien');
  assert.equal(franchi(true), nu, 'le franchissement a changé avec la Munition spéciale débloquée');
});

test('MODULES-F T4 — une pièce sans prédilection ne tire pas, et rien ne compare deux `null`', () => {
  // ⚠ LA GARDE `colonnePredilection === null` EST DÉFENSIVE, ET LE TEST LE DIT.
  // `ciblage` n'appelle `degatsContre` qu'après `peutTirer`, qui exige une
  // table de dégâts non nulle et au moins une colonne positive ; or
  // `colonneDominante` ne rend `null` que dans le cas contraire. Aucun montage
  // ne peut donc amener une entité sans prédilection à `degatsContre` comme
  // TIREUR. Ce qui est gardable, c'est la prémisse — et elle l'est sur la donnée.
  const sansPredilection = [];
  for (const [id, d] of Object.entries(DEFENSES)) {
    if (dominanteDe(d.degats) === null) sansPredilection.push(id);
  }
  for (const [id, u] of Object.entries(UNITES)) {
    if (dominanteDe(u.degats) === null) sansPredilection.push(id);
  }
  assert.deepEqual(sansPredilection.sort(), ['herse', 'merlon', 'ronce'],
    'la liste des pièces sans prédilection a changé : revoir la garde de `degatsContre`');
  for (const id of sansPredilection) {
    assert.equal(DEFENSES[id].degats, null,
      `${id} n'a pas de prédilection MAIS porte une table : il pourrait devenir tireur`);
  }

  // (ii) Aucune cible n'a de `colonneMatrice` nulle — la colonne se lit sur le
  // châssis pour une unité, sur le type pour une défense, en dur pour un
  // bâtiment. Une comparaison naïve ne pourrait donc jamais apparier deux
  // `null`. Cette garde tombe le jour où un châssis ou un type est ajouté.
  const chassis = new Set(Object.values(UNITES).map((u) => u.chassis));
  const types = new Set(Object.values(DEFENSES).map((d) => d.type));
  assert.deepEqual([...chassis].sort(), ['aeronef', 'blinde', 'escouade']);
  assert.deepEqual([...types].sort(), ['artillerie', 'barriere', 'mur', 'tourelle']);

  // (iii) Les trois porteuses ont une prédilection : le module n'est inerte sur
  // aucune d'elles.
  for (const [id, d] of Object.entries(DEFENSES)) {
    if (d.moduleOuvrage !== 'munitionSpeciale') continue;
    assert.ok(dominanteDe(d.degats) !== null && dominanteDe(d.degats) !== 'ambigu',
      `${id} porte la Munition spéciale sans prédilection : elle serait inerte`);
  }

  // (iv) Et la scène passe : un Merlon sans table, module débloqué, cent ticks.
  const etat = creerCombat({
    niveau: 1,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 15, colonne: 1, niveau: 1 }],
    defenseurs: [
      { id: 'merlon', rangee: 4, colonne: 5, niveau: 1 },
      { id: 'casemate', rangee: 5, colonne: 5, niveau: 1 },
    ],
    vagues: [[{ id: 'meute', colonne: 5, rangee: 2, niveau: 1 }]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: ['munitionSpeciale'] },
      joueur: RIEN,
    },
  });
  for (let t = 1; t <= 100 && !etat.termine; t += 1) tick(etat);
  assert.ok(etat.entites.find((e) => e.id === 'meute').pvMilli < 700000,
    'montage inerte : la Casemate n\'a jamais tiré');
});

// --- Vol de vie ------------------------------------------------------------
//
// Les deux porteurs sont des UNITÉS DE GARNISON — Broyeur (niveau 42) et
// Enclume (46) —, et le module se lit sur `moduleOuvrage` : il n'est actif que
// pour une pièce dont le propriétaire n'est PAS le joueur. Tous les montages
// qui suivent mettent donc un Broyeur en défense, propriétaire par défaut
// `ouvrage`, et rangent `volDeVie` dans `ouvrage.defense`.

/** Un Broyeur de garnison face à une seule cible, module armé ou non. */
function voleurContre(cible, vol, rangeeCible = 4) {
  return creerCombat({
    niveau: 20,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
    defenseurs: [{ id: 'broyeur', rangee: 6, colonne: 5, niveau: 20 }],
    vagues: [[{ id: cible, colonne: 5, rangee: rangeeCible, niveau: 20 }]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: vol ? ['volDeVie'] : [] },
      joueur: RIEN,
    },
  });
}

test('MODULES-F T5 — le Vol de vie rend 20 % de l\'ENCAISSÉ, jamais du nominal', () => {
  // Le Broyeur à mi-vie tire 45 870 milli-PV sur une Meute. On met la Meute à
  // 10 000 : elle n'encaisse que 10 000, le surplus n'est encaissé par personne.
  //   encaissé → soin floor(10 000 × 20 / 100) =  2 000
  //   nominal  → soin floor(45 870 × 20 / 100) =  9 174
  // ⚠ CE QUI FERAIT TOMBER CETTE GARDE : un vol calculé sur `coup.degats`.
  const mesure = (vol) => {
    const etat = voleurContre('meute', vol);
    const b = etat.entites.find((e) => e.id === 'broyeur');
    const m = etat.entites.find((e) => e.id === 'meute');
    b.pvMilli = Math.floor(b.pvMaxMilli / 2);
    m.pvMilli = 10_000;
    const avant = b.pvMilli;
    tick(etat);
    return { soin: b.pvMilli - avant, restant: m.pvMilli };
  };
  const nu = mesure(false);
  const arme = mesure(true);
  assert.equal(nu.soin, 0, 'montage inerte : le Broyeur se soigne sans le module');
  assert.equal(nu.restant, 0, 'montage inerte : la Meute n\'est pas achevée');
  assert.equal(arme.soin, 2000, 'le vol ne porte pas sur l\'encaissé');
  assert.notEqual(arme.soin, Math.floor((45_870 * 20) / 100), 'le vol porte sur le nominal');
});

test('MODULES-F T6 — la part absorbée par un Bouclier compte au voleur', () => {
  // Une Enclume attaquante porte le Bouclier ; elle couvre la Meute, qui ne perd
  // donc RIEN. Le voleur récupère quand même 20 % de ce que le réservoir a pris.
  // ⚠ CE QUI FERAIT TOMBER CETTE GARDE : un vol calculé sur `pvAvant − pvAprès`
  // seul — le soin tomberait à zéro et le Bouclier deviendrait une contre-mesure
  // au Vol de vie, ce qu'aucune ligne d'Ethan ne dit.
  const scene = (vol) => creerCombat({
    niveau: 20,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
    defenseurs: [{ id: 'broyeur', rangee: 6, colonne: 5, niveau: 20 }],
    vagues: [[
      { id: 'meute', colonne: 5, rangee: 4, niveau: 20 },
      { id: 'enclume', colonne: 6, rangee: 4, niveau: 20 },
    ]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: vol ? ['volDeVie'] : [] },
      joueur: { offense: ['bouclier'], defense: [] },
    },
  });
  const mesure = (vol) => {
    const etat = scene(vol);
    const b = etat.entites.find((e) => e.id === 'broyeur');
    const m = etat.entites.find((e) => e.id === 'meute');
    const enclume = etat.entites.find((e) => e.id === 'enclume');
    b.pvMilli = Math.floor(b.pvMaxMilli / 2);
    const avant = { b: b.pvMilli, m: m.pvMilli, res: enclume.bouclierMilli };
    tick(etat);
    return {
      voleur: b.pvMilli - avant.b,
      cible: avant.m - m.pvMilli,
      absorbe: avant.res - enclume.bouclierMilli,
    };
  };
  const nu = mesure(false);
  const arme = mesure(true);
  assert.equal(arme.cible, 0, 'montage inerte : le Bouclier n\'a pas tout absorbé');
  assert.equal(arme.absorbe, 45_870, 'montage inerte : le réservoir n\'a rien pris');
  // Les deux passes sont par ailleurs identiques : la différence EST le soin.
  assert.equal(arme.voleur - nu.voleur, Math.floor((45_870 * 20) / 100));
  assert.equal(arme.voleur - nu.voleur, 9174);
});

test('MODULES-F T7 — deux tireurs : servis par indice croissant, PAS au prorata', () => {
  // Deux Broyeurs à mi-vie tirent 45 870 chacun sur une Meute à 60 000 : le
  // total nominal est 91 740, l'encaissé 60 000. Par indice croissant, le
  // premier prend 45 870 et le second les 14 130 qui restent.
  //   indice croissant → soins 9 174 et 2 826
  //   prorata          → soins 6 000 et 6 000
  // ⚠ CE QUI FERAIT TOMBER CETTE GARDE : un partage au prorata, ou un tri par
  // ordre d'insertion plutôt que par indice.
  const scene = (vol) => creerCombat({
    niveau: 20,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
    defenseurs: [
      { id: 'broyeur', rangee: 6, colonne: 4, niveau: 20 },
      { id: 'broyeur', rangee: 6, colonne: 6, niveau: 20 },
    ],
    vagues: [[{ id: 'meute', colonne: 5, rangee: 4, niveau: 20 }]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: vol ? ['volDeVie'] : [] },
      joueur: RIEN,
    },
  });
  const mesure = (vol, pvCible) => {
    const etat = scene(vol);
    const bs = etat.entites.filter((e) => e.id === 'broyeur');
    const m = etat.entites.find((e) => e.id === 'meute');
    for (const b of bs) b.pvMilli = Math.floor(b.pvMaxMilli / 2);
    m.pvMilli = pvCible;
    const avant = bs.map((b) => b.pvMilli);
    tick(etat);
    return { soins: bs.map((b, i) => b.pvMilli - avant[i]), indices: bs.map((b) => b.indice) };
  };
  const soinsDe = (pv) => {
    const nu = mesure(false, pv);
    const arme = mesure(true, pv);
    assert.deepEqual(arme.indices, [0, 1], 'montage : les indices ne sont pas ceux attendus');
    return arme.soins.map((s, i) => s - nu.soins[i]);
  };
  assert.deepEqual(soinsDe(60_000), [9174, 2826], 'l\'encaissé n\'est pas servi par indice croissant');
  assert.notDeepEqual(soinsDe(60_000), [6000, 6000], 'l\'encaissé est partagé au prorata');
  // ⚠ ET LE MONTAGE N'EST PAS VACANT : sans débordement, les deux touchent leur
  // plein. C'est bien le manque d'encaissé qui départage, pas le montage.
  assert.deepEqual(soinsDe(91_740), [9174, 9174], 'montage : le débordement n\'existe pas');
  assert.deepEqual(soinsDe(200_000), [9174, 9174]);
});

test('MODULES-F T8 — un voleur qui meurt au même tick ne se soigne pas', () => {
  // Trois Béliers achèvent le Broyeur. À 220 176 milli-PV il tombe pile à zéro ;
  // à 220 177 il survit d'un cheveu et encaisse son vol.
  // ⚠ CE QUI FERAIT TOMBER CETTE GARDE : retirer le test `t.pvMilli > 0` de la
  // passe 2. Le voleur mort ressortirait à 616 milli-PV — le soin de ce tick —
  // et survivrait à `retirerLesMorts`.
  const scene = (vol, pvVoleur, colonnes) => {
    const etat = creerCombat({
      niveau: 20,
      obstacles: [],
      batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
      defenseurs: [{ id: 'broyeur', rangee: 6, colonne: 5, niveau: 20 }],
      vagues: [colonnes.map((c) => ({ id: 'belier', colonne: c, rangee: 5, niveau: 20 }))],
      modulesDebloques: {
        ouvrage: { offense: [], defense: vol ? ['volDeVie'] : [] },
        joueur: RIEN,
      },
    });
    const b = etat.entites.find((e) => e.id === 'broyeur');
    b.pvMilli = pvVoleur;
    tick(etat);
    return { pv: b.pvMilli, vivant: b.vivant };
  };
  // Le cheveu au-dessus : il vit, et il a bien volé — sans quoi le cas mortel
  // ne prouverait rien, un voleur qui ne vole pas ne se soigne pas non plus.
  const vivantNu = scene(false, 220_177, [4, 5, 6]);
  const vivantArme = scene(true, 220_177, [4, 5, 6]);
  assert.equal(vivantNu.vivant, true);
  assert.equal(vivantArme.pv - vivantNu.pv, 616, 'montage inerte : le voleur ne vole rien à ce PV');
  // Le cheveu en dessous : il meurt, et il reste mort.
  for (const colonnes of [[4, 5, 6], [6, 5, 4], [5, 6, 4]]) {
    const mort = scene(true, 220_176, colonnes);
    assert.equal(mort.pv, 0, `ordre ${colonnes.join('')} : le voleur mort s'est soigné`);
    assert.equal(mort.vivant, false, `ordre ${colonnes.join('')} : le voleur mort est vivant`);
  }
  // ⚠ ÉCART AU BRIEF, MESURÉ. Le brief voulait de T8 la preuve que la passe 2
  // suit la passe 1 ENTIÈRE. Cette preuve n'est pas atteignable avec la donnée
  // d'aujourd'hui : le module se lit sur `moduleOuvrage`, donc tout voleur est
  // en GARNISON, et `creerCombat` numérote les défenseurs avant les attaquants.
  // L'entrée du voleur dans le tampon est donc TOUJOURS traitée avant celle de
  // sa victime, et un soin posé au fil de la passe 1 arriverait de toute façon
  // après ses propres dégâts. Ce qui reste observable — et qui est gardé
  // ci-dessus — c'est qu'un mort du tick ne se soigne pas.
  assert.ok(scene(true, 220_176, [4, 5, 6]).pv === 0);
});

test('MODULES-F T9 — le soin plafonne à `pvMaxMilli`', () => {
  // Le Broyeur porte à 2,5 cases, la Meute à 1,5 : à deux cases d'écart il tire
  // et n'est pas touché. Intact, il vole et reste à son plafond.
  // ⚠ CE QUI FERAIT TOMBER CETTE GARDE : retirer le `Math.min` de la passe 2 —
  // le Broyeur ressortirait à 12 250 348, soit 18 348 au-dessus de son plafond.
  const etat = voleurContre('meute', true);
  const b = etat.entites.find((e) => e.id === 'broyeur');
  const m = etat.entites.find((e) => e.id === 'meute');
  assert.equal(b.pvMilli, b.pvMaxMilli, 'montage : le voleur n\'est pas intact');
  const avantM = m.pvMilli;
  tick(etat);
  assert.equal(m.aTire, false, 'montage : la Meute riposte, le plafond n\'est plus seul en cause');
  assert.equal(avantM - m.pvMilli, 91_740, 'montage inerte : le Broyeur n\'a pas tiré');
  assert.equal(b.pvMilli, b.pvMaxMilli, 'le soin a dépassé le plafond');
  assert.equal(b.pvMilli, 12_232_000);
});

test('MODULES-F T10 — le soin n\'ajoute de ligne ni au butin ni aux points', () => {
  // ⚠ LE BUTIN NE LIT QUE LES BÂTIMENTS, et les points ne lisent des défenses
  // que les PV PERDUS. Le soin n'est donc pas un poste : il fait perdre MOINS,
  // et c'est tout. Les deux moitiés le mesurent séparément.
  assert.doesNotMatch(corpsDe('butin'), /VOL_PCT/, 'le Vol de vie est entré dans le butin');
  assert.doesNotMatch(corpsDe('pointsRecherche'), /VOL_PCT/,
    'le Vol de vie est entré dans les points');

  const montageDe = (vol) => ({
    niveau: 20,
    obstacles: [],
    batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
    defenseurs: [{ id: 'broyeur', rangee: 6, colonne: 5, niveau: 20 }],
    vagues: [[
      { id: 'meute', colonne: 5, rangee: 4, niveau: 20 },
      { id: 'belier', colonne: 6, rangee: 4, niveau: 20 },
    ]],
    modulesDebloques: {
      ouvrage: { offense: [], defense: vol ? ['volDeVie'] : [] },
      joueur: RIEN,
    },
  });
  const jouer = (vol) => {
    const montage = montageDe(vol);
    const etat = creerCombat(montage);
    const b = etat.entites.find((e) => e.id === 'broyeur');
    b.pvMilli = Math.floor(b.pvMaxMilli / 2);
    const resultat = resoudre(etat, { maxTicks: 4 });
    return {
      montage,
      resultat,
      pv: resultat.defenses.find((d) => d.id === 'broyeur').pvMilli,
    };
  };
  const nu = jouer(false);
  const arme = jouer(true);
  assert.ok(arme.pv > nu.pv, 'montage inerte : le voleur ne s\'est pas soigné');

  // ⚠ MÊME MONTAGE DES DEUX CÔTÉS. Les points portent DÉJÀ, depuis MODULES-E, un
  // bonus de +20 % quand le module de la cible est débloqué : comparer deux
  // montages différents mêlerait ce bonus au soin. On garde donc le montage armé
  // et on ne fait varier que les PV finaux du voleur.
  const temoin = jouer(false);
  const cible = temoin.resultat.defenses.find((d) => d.id === 'broyeur');
  const avant = pointsRecherche(temoin.resultat, arme.montage);
  cible.pvMilli = arme.pv;
  const apres = pointsRecherche(temoin.resultat, arme.montage);
  assert.ok(apres < avant, 'le soin ne fait pas BAISSER les points : il en ajoute');
  assert.equal(apres, pointsRecherche(arme.resultat, arme.montage),
    'les points d\'un raid volé ne se déduisent pas de ses seuls PV finaux');

  // ⚠ ET LE BUTIN IGNORE LES DÉFENSES TOUT COURT : on maltraite les PV du voleur,
  // il ne bouge pas d'un quartz. Le montage rapporte, sans quoi l'égalité serait
  // celle de deux zéros.
  const plein = jouer(true);
  const rase = resoudre(creerCombat(montageDe(true)));
  const butinPlein = butin(rase, montageDe(true));
  assert.ok(butinPlein.quartz > 0, 'montage inerte : ce raid ne rapporte rien');
  const b1 = butin(plein.resultat, plein.montage);
  plein.resultat.defenses.find((d) => d.id === 'broyeur').pvMilli = 42;
  assert.deepEqual(butin(plein.resultat, plein.montage), b1, 'le butin lit les défenses');
});

test('MODULES-F T11 — le franchissement porte l\'indice de la BARRIÈRE', () => {
  // Herse en indice 0, Broyeur voleur en indice 1, Bélier victime en indice 3.
  // Le Bélier est posé SUR la Herse : il paie 91 740 de franchissement et prend
  // 85 624 du Broyeur, soit 177 364 pour 120 000 PV. Servi par indice croissant,
  // la Herse passe d'abord : il ne reste que 28 260 au Broyeur, donc 5 652 de soin.
  // ⚠ CE QUI FERAIT TOMBER CETTE GARDE : un franchissement rangé sous l'indice de
  // la VICTIME (3) ou sous `null`. Le Broyeur (1) passerait alors le premier et
  // prendrait ses 85 624 entiers, soit 17 124 de soin — trois fois plus.
  const scene = (vol, pvVictime) => {
    const etat = creerCombat({
      niveau: 20,
      obstacles: [],
      batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
      defenseurs: [
        { id: 'herse', rangee: 5, colonne: 5, niveau: 20 },
        { id: 'broyeur', rangee: 6, colonne: 5, niveau: 20 },
      ],
      vagues: [[{ id: 'belier', colonne: 5, rangee: 4, niveau: 20 }]],
      modulesDebloques: {
        ouvrage: { offense: [], defense: vol ? ['volDeVie'] : [] },
        joueur: RIEN,
      },
    });
    const herse = etat.entites.find((e) => e.id === 'herse');
    const b = etat.entites.find((e) => e.id === 'broyeur');
    const v = etat.entites.find((e) => e.id === 'belier');
    b.pvMilli = Math.floor(b.pvMaxMilli / 2);
    // Le Bélier est amené SUR la case de la Herse : il la franchit ce tick-ci.
    v.rangeeMilli = herse.rangeeMilli;
    v.colonne = herse.colonne;
    v.pvMilli = pvVictime;
    const avant = b.pvMilli;
    tick(etat);
    return {
      soin: b.pvMilli - avant,
      perte: pvVictime - v.pvMilli,
      indices: [herse.indice, b.indice, v.indice],
    };
  };
  const nu = scene(false, 120_000);
  const arme = scene(true, 120_000);
  assert.deepEqual(arme.indices, [0, 1, 3], 'montage : les indices ne sont pas ceux attendus');
  assert.equal(arme.perte, 120_000, 'montage inerte : la victime n\'est pas débordée');
  assert.equal(arme.soin - nu.soin, 5652, 'le franchissement n\'est pas rangé sous la barrière');
  assert.notEqual(arme.soin - nu.soin, Math.floor((85_624 * 20) / 100),
    'le franchissement est rangé sous la victime');

  // ⚠ ET LE MONTAGE N'EST PAS VACANT : sans débordement, le Broyeur touche son
  // plein — c'est bien l'ORDRE de service qui décide, pas l'absence de vol.
  const plein = scene(true, 400_000).soin - scene(false, 400_000).soin;
  assert.equal(plein, 17_124, 'montage : le Broyeur ne vole pas son plein sans débordement');
});

// --- Le canal de l'Ouvrage -------------------------------------------------

test('MODULES-F T12 — le canal s\'arme au bon niveau, et `offense` reste vide', () => {
  const canal = (niveau, graine = 7) => genererSite({
    type: 'base', niveau, saveur: null, graine,
  }).modulesDebloques.ouvrage;
  // Les paliers viennent d'`apparitionModule` : 28 Carapace, 30 Casemate,
  // 32 Merlon, 42 Faucheuse ET Broyeur. Le relevé du §1.1 du brief, refait.
  assert.deepEqual(canal(1).defense, []);
  assert.deepEqual(canal(27).defense, []);
  assert.deepEqual(canal(28).defense, ['camouflage']);
  assert.deepEqual(canal(29).defense, ['camouflage']);
  assert.deepEqual(canal(30).defense, ['camouflage', 'munitionSpeciale']);
  assert.deepEqual(canal(31).defense, ['camouflage', 'munitionSpeciale']);
  assert.deepEqual(canal(32).defense, ['camouflage', 'munitionSpeciale', 'pvPlusVingt']);
  assert.deepEqual(canal(41).defense, ['camouflage', 'munitionSpeciale', 'pvPlusVingt']);
  assert.deepEqual(canal(42).defense,
    ['camouflage', 'munitionSpeciale', 'pvPlusVingt', 'rayonMiniMoinsUn', 'volDeVie']);
  assert.deepEqual(canal(46).defense,
    ['camouflage', 'munitionSpeciale', 'pvPlusVingt', 'rayonMiniMoinsUn', 'volDeVie']);
  assert.deepEqual(canal(50).defense,
    ['camouflage', 'munitionSpeciale', 'pvPlusVingt', 'rayonMiniMoinsUn', 'volDeVie']);
  // ⚠ `offense` RESTE VIDE À TOUS LES NIVEAUX. `moduleOuvrage` ne renseigne pas
  // `p.module`, que lit un module d'ATTAQUANT : l'y verser armerait des modules
  // sur des pièces qui ne les portent pas.
  for (const n of [1, 27, 28, 32, 42, 46, 50]) assert.deepEqual(canal(n).offense, []);

  // ⚠ LE CANAL NE DÉPEND PAS DE LA GRAINE. C'est un palier de progression de
  // l'Ouvrage, pas une propriété de la garnison du jour : deux sites de même
  // niveau doivent débloquer les mêmes modules, sinon la liste devient un effet
  // de tirage et le joueur ne peut rien en apprendre.
  for (const n of [28, 34, 46]) {
    const attendu = canal(n, 1).defense;
    for (const g of [2, 3, 5, 8, 13, 21]) assert.deepEqual(canal(n, g).defense, attendu);
  }

  // ⚠ ET LES PALIERS SONT LUS SUR LA DONNÉE, pas recopiés : la liste ci-dessus
  // doit être exactement celle qu'`apparitionModule` dicte, table par table.
  const attendus = (niveau) => {
    const noms = new Set();
    for (const table of [UNITES, DEFENSES]) {
      for (const p of Object.values(table)) {
        if (p.moduleOuvrage && p.apparitionModule <= niveau) noms.add(p.moduleOuvrage);
      }
    }
    return [...noms].sort();
  };
  for (let n = 1; n <= 50; n += 1) assert.deepEqual(canal(n).defense, attendus(n), `niveau ${n}`);
});

test('MODULES-F T13 — un site généré entre tel quel dans `creerCombat`', () => {
  // La forme de MODULES-E : deux propriétaires, deux branches chacun. Un site de
  // niveau 46 porte les cinq modules — c'est le cas le plus chargé.
  const site = genererSite({ type: 'base', niveau: 46, saveur: null, graine: 46 });
  assert.equal(site.modulesDebloques.ouvrage.defense.length, 5, 'montage : le canal est vide');
  const etat = creerCombat({ ...site, vagues: [[{ id: 'meute', colonne: 5 }]] });
  assert.deepEqual(etat.modulesDebloques.ouvrage.defense, site.modulesDebloques.ouvrage.defense);
  assert.deepEqual(etat.modulesDebloques.joueur, { offense: [], defense: [] });

  // ⚠ ET L'ANCIENNE FORME PLATE LÈVE TOUJOURS. Sans cette moitié, la garde
  // ci-dessus passerait sur un `creerCombat` qui accepte n'importe quoi.
  const bancal = (modulesDebloques) => () => creerCombat({
    ...site, vagues: [[{ id: 'meute', colonne: 5 }]], modulesDebloques,
  });
  assert.throws(bancal({ ouvrage: ['camouflage'], joueur: { offense: [], defense: [] } }),
    /liste plate/);
  assert.throws(bancal({ ouvrage: { defense: ['camouflage'] }, joueur: { offense: [], defense: [] } }),
    /n'a pas de branche/);
  assert.throws(bancal({ ouvrage: { offense: [], defense: 'camouflage' }, joueur: { offense: [], defense: [] } }),
    /pas une liste de noms/);

  // ⚠ CONSTAT, PAS UNE RÈGLE DE CE LOT : un `modulesDebloques` PLAT AU SOMMET
  // ne lève pas, il est traité comme ABSENT — `['x'].ouvrage` vaut `undefined`,
  // et MODULES-E a explicitement voulu qu'absent reste permis. La garde de la
  // forme plate porte sur chaque PROPRIÉTAIRE, un cran plus bas. Rien à corriger
  // ici : le générateur, lui, livre toujours la forme complète.
  const plat = creerCombat({
    ...site, vagues: [[{ id: 'meute', colonne: 5 }]], modulesDebloques: ['camouflage'],
  });
  assert.deepEqual(plat.modulesDebloques,
    { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } });
});

test('MODULES-F T14 — les points bougent, et le niveau 20 reste identique au point', () => {
  // ⚠⚠ CE TEST NE JUGE PAS L'ÉQUILIBRAGE, IL CONSTATE. Les valeurs « avant »
  // sont celles mesurées sur `origin/main` (0.55.0 · build 56) avec la MÊME
  // graine et la MÊME armée. On ne compense rien, on ne touche à aucun barème.
  const ARMEE = [
    { id: 'meute', colonne: 2 }, { id: 'meute', colonne: 4 },
    { id: 'belier', colonne: 6 }, { id: 'crecelle', colonne: 8 },
    { id: 'perceurs', colonne: 3 }, { id: 'perceurs', colonne: 7 },
  ];
  const points = (niveau, graine) => {
    const site = genererSite({ type: 'base', niveau, saveur: null, graine });
    const montage = { ...site, vagues: [ARMEE] };
    return pointsRecherche(resoudre(creerCombat(montage)), montage);
  };

  // Niveau 20 : aucun module n'est armé sous 28, donc IDENTIQUE AU POINT.
  // C'est cette moitié qui rend l'autre falsifiable — sans elle, un barème
  // globalement gonflé passerait la moitié « en hausse » sans rien prouver.
  assert.equal(points(20, 11), 2302652n);
  assert.equal(points(20, 22), 1146497n);
  assert.equal(points(20, 33), 1692238n);

  // Niveau 38 : Camouflage, Munition spéciale et PV +20 % sont armés. Les points
  // MONTENT sur les trois graines — le bonus de +20 % de MODULES-E l'emporte sur
  // le surcroît de résistance de la garnison.
  const avant38 = { 11: 173_605_846n, 22: 255_641_308n, 33: 286_985_226n };
  const apres38 = { 11: 194_230_489n, 22: 276_265_951n, 33: 308_676_642n };
  for (const g of [11, 22, 33]) {
    assert.equal(points(38, g), apres38[g], `niveau 38, graine ${g}`);
    assert.ok(points(38, g) > avant38[g], `niveau 38, graine ${g} : les points n'ont pas monté`);
  }

  // ⚠ ET ILS NE MONTENT PAS PARTOUT — mesuré, rapporté, NON corrigé. Au
  // niveau 50 le Vol de vie et le Rayon minimum −1 sont armés eux aussi : la
  // garnison encaisse davantage, l'assaut casse moins, et les points BAISSENT
  // sur les trois mêmes graines. Ce lot ne touche à aucun barème ; l'arbitrage
  // d'équilibrage revient à Ethan.
  const avant50 = { 11: 15_973_692_801n, 22: 8_318_116_000n, 33: 9_775_306_972n };
  const apres50 = { 11: 15_325_146_868n, 22: 7_043_493_598n, 33: 8_150_073_821n };
  for (const g of [11, 22, 33]) {
    assert.equal(points(50, g), apres50[g], `niveau 50, graine ${g}`);
    assert.ok(points(50, g) < avant50[g], `niveau 50, graine ${g} : les points n'ont pas baissé`);
  }
});

test('MODULES-F T14 bis — le Camouflage côté Ouvrage ne fait RIEN, et c\'est mesuré', () => {
  // ⚠⚠ LE BRIEF DEMANDAIT DE LE VÉRIFIER PLUTÔT QUE DE L'ESPÉRER, ET LE VOICI.
  // `ensembleCamoufles` s'ouvre sur `if (e.camp !== 'attaque' …) continue` :
  // « invisible pour la DÉFENSE » désigne un ATTAQUANT que la garnison ne voit
  // pas. Une Carapace EN GARNISON est du camp `defense` — elle n'est jamais
  // même examinée. Le module est donc inerte de ce côté, PAR CONSTRUCTION.
  // Le lot ne symétrise pas : ce serait un changement de règle, pas un câblage.
  const ARMEE = [
    { id: 'meute', colonne: 2 }, { id: 'meute', colonne: 4 },
    { id: 'belier', colonne: 6 }, { id: 'crecelle', colonne: 8 },
    { id: 'perceurs', colonne: 3 }, { id: 'perceurs', colonne: 7 },
  ];
  // Au niveau 28 le canal ne contient QUE `camouflage` : le site isole le module.
  const site = genererSite({ type: 'base', niveau: 28, saveur: null, graine: 1028 });
  assert.deepEqual(site.modulesDebloques.ouvrage.defense, ['camouflage'],
    'montage : le niveau 28 n\'isole plus le Camouflage');
  const porteurs = site.defenseurs.filter((d) => ['carapace', 'fouisseurs'].includes(d.id));
  assert.ok(porteurs.length > 0, 'montage inerte : aucune Carapace dans cette garnison');

  const jouer = (modules) => {
    const montage = { ...site, vagues: [ARMEE],
      modulesDebloques: { ouvrage: { offense: [], defense: modules }, joueur: RIEN } };
    const etat = creerCombat(montage);
    const resultat = resoudre(etat);
    return { etat, montage, resultat };
  };
  const sans = jouer([]);
  const avec = jouer(['camouflage']);
  // ⚠ ON RETIRE `modulesDebloques` DE LA COMPARAISON : il est sérialisé dans
  // l'état, et c'est la SEULE chose qui doit différer.
  const sansListe = (etat) => JSON.stringify(
    JSON.parse(serialiserEtat(etat)),
    (cle, valeur) => (cle === 'modulesDebloques' ? undefined : valeur),
  );
  assert.equal(sansListe(avec.etat), sansListe(sans.etat),
    'le Camouflage change le combat côté Ouvrage : la mesure du rapport est fausse');
  assert.notEqual(serialiserEtat(avec.etat), serialiserEtat(sans.etat),
    'montage : la liste n\'est même pas sérialisée, la garde ci-dessus est creuse');
  assert.equal(pointsRecherche(avec.resultat, avec.montage),
    pointsRecherche(sans.resultat, sans.montage));
});

test('MODULES-F T15 — les deux drapeaux n\'ouvrent AUCUNE ligne à l\'écran', () => {
  // ⚠⚠ C'EST LE POINT LE PLUS CONTRE-INTUITIF DU LOT. `cable` passe à `true`
  // pour la Munition spéciale et le Vol de vie, et pourtant la boutique ne vend
  // rien de nouveau : le drapeau dit que l'EFFET EXISTE, pas qu'il est
  // achetable. Ce que le joueur peut acheter vient de `nomDuModule`, qui lit
  // `moduleJoueur` (défenses) ou `module` (unités) — jamais `moduleOuvrage`.
  for (const nom of ['munitionSpeciale', 'volDeVie']) {
    assert.equal(moduleEstCable(nom, 'defense'), true, `${nom} en défense`);
    assert.equal(moduleEstCable(nom, 'offense'), false, `${nom} en offense`);
  }

  // ZÉRO ligne de l'arbre ne porte l'un des deux noms — mesuré en parcourant
  // l'arbre, pas de tête.
  const portees = [];
  for (const branche of BRANCHES) {
    for (const id of Object.keys(ARBRE_RECHERCHE[branche])) {
      const nom = nomDuModule(branche, id);
      if (nom === 'munitionSpeciale' || nom === 'volDeVie') portees.push(`${branche}/${id}`);
    }
  }
  assert.deepEqual(portees, [], 'une ligne de la boutique porte un module de l\'Ouvrage');

  // ⚠ ET LA MÊME MESURE SUR L'ÉCRAN LUI-MÊME, pas seulement sur la table : c'est
  // `lignesDeRecherche` que le joueur voit. Le compte des lignes à module est
  // celui d'avant le lot — vingt-trois en offense, vingt-trois en défense.
  const parBranche = {};
  const modulesVus = new Set();
  for (const branche of BRANCHES) {
    const lignes = lignesDeRecherche(partie('0'), branche);
    parBranche[branche] = lignes.filter((l) => l.module !== null).length;
    for (const l of lignes) if (l.module !== null) modulesVus.add(l.module.nom);
  }
  // MESURÉ DES DEUX CÔTÉS du lot, sur `origin/main` comme ici : quatorze lignes
  // à module en offense, dix-sept en défense. Ces nombres ne bougent pas.
  assert.deepEqual(parBranche, { offense: 14, defense: 17 });
  assert.equal(modulesVus.has('munitionSpeciale'), false, 'la Munition spéciale est à l\'écran');
  assert.equal(modulesVus.has('volDeVie'), false, 'le Vol de vie est à l\'écran');
  // Les DOUZE noms que l'écran montre vraiment — la même liste qu'avant le lot.
  // Le compte EST la liste : un lot qui en ajouterait un sans le dire ferait
  // tomber cette ligne.
  assert.deepEqual([...modulesVus].sort(), [
    'autoReparation', 'booster', 'bouclier', 'camouflage', 'ecraseur', 'emp',
    'flashbang', 'garnison', 'pvPlusVingt', 'rayonMiniMoinsUn', 'rayonPlusUn',
    'tirDeBarrage',
  ]);

  // ⚠ ET LE CANAL DU JOUEUR N'EST PAS TOUCHÉ PAR CELUI DE L'OUVRAGE. C'est la
  // garde qui protège MODULES-A à E : `genererSite` remplit une branche et une
  // seule.
  for (const niveau of [1, 28, 32, 42, 46, 50]) {
    const site = genererSite({ type: 'base', niveau, saveur: null, graine: 3 });
    assert.deepEqual(site.modulesDebloques.joueur, { offense: [], defense: [] },
      `niveau ${niveau} : le générateur touche au canal du joueur`);
  }
  // Et ce que le joueur a acheté ne dépend toujours que de SES acquisitions.
  const etat = partie('999999999999999');
  assert.deepEqual(modulesDebloquesDuJoueur(etat), { offense: [], defense: [] });
  acheter(etat, 'offense', 'perceurs', 'unite');
  acheter(etat, 'offense', 'perceurs', 'module');
  assert.deepEqual(modulesDebloquesDuJoueur(etat),
    { offense: ['tirDeBarrage'], defense: [] });
});

test('MODULES-F T16 — le déterminisme tient avec les deux modules', () => {
  // ⚠ LA PROJECTION EST CELLE DE MODULES-B T10, RÉUTILISÉE — pas une seconde.
  // Elle voit les PV, le plafond, le réservoir de bouclier, la portée, la cible
  // et les modules actifs : tout ce que ce lot peut faire bouger.
  const scene = (ordre, modules) => {
    const defenseurs = [
      { id: 'casemate', rangee: 4, colonne: 5, niveau: 20 },
      { id: 'broyeur', rangee: 6, colonne: 6, niveau: 20 },
      { id: 'batterie', rangee: 5, colonne: 4, niveau: 20 },
      { id: 'herse', rangee: 7, colonne: 5, niveau: 20 },
      { id: 'creneau', rangee: 6, colonne: 4, niveau: 20 },
    ];
    return creerCombat({
      niveau: 20,
      obstacles: [],
      batiments: [{ id: 'souche', rangee: 14, colonne: 5, niveau: 20 }],
      defenseurs: ordre.map((i) => defenseurs[i]),
      vagues: [[
        { id: 'meute', colonne: 5, rangee: 2, niveau: 30 },
        { id: 'belier', colonne: 4, rangee: 2, niveau: 30 },
        { id: 'crecelle', colonne: 6, rangee: 2, niveau: 30 },
      ]],
      modulesDebloques: {
        ouvrage: { offense: [], defense: modules },
        joueur: RIEN,
      },
    });
  };
  const tous = ['munitionSpeciale', 'volDeVie'];
  const jouer = (ordre) => {
    const etat = scene(ordre, tous);
    for (let t = 1; t <= 150 && !etat.termine; t += 1) tick(etat);
    return { etat, vue: projectionCanonique(etat) };
  };

  // Bit à bit d'abord : deux exécutions du MÊME montage.
  const a = jouer([0, 1, 2, 3, 4]);
  assert.equal(serialiserEtat(a.etat), serialiserEtat(jouer([0, 1, 2, 3, 4]).etat));

  // ⚠ LA PERMUTATION DOIT VRAIMENT PERMUTER, sinon tout ce qui suit est trivial.
  const rangs = (e) => e.entites.map((x) => x.id).join(',');
  assert.notEqual(rangs(a.etat), rangs(jouer([4, 3, 2, 1, 0]).etat),
    'montage : les deux ordres sont identiques');
  for (const ordre of [[4, 3, 2, 1, 0], [2, 0, 4, 1, 3], [1, 4, 0, 3, 2]]) {
    assert.deepEqual(jouer(ordre).vue, a.vue, `ordre ${ordre.join('')}`);
  }

  // ⚠ ET LE MONTAGE N'EST PAS VACANT : les deux modules ont mesurablement joué.
  // Sans ces gardes, un combat où aucun ne s'applique passerait en ne prouvant
  // rien. On compare au même montage SANS module, au tick près.
  const temoin = scene([0, 1, 2, 3, 4], []);
  for (let t = 1; t <= 150 && !temoin.termine; t += 1) tick(temoin);
  assert.notDeepEqual(projectionCanonique(temoin), a.vue,
    'les deux modules ne changent rien à ce combat : la garde est creuse');
  const pv = (etat, id) => etat.entites.find((e) => e.camp === 'attaque' && e.id === id).pvMilli;
  assert.ok(pv(a.etat, 'meute') < pv(temoin, 'meute'),
    'la Munition spéciale de la Casemate n\'a pas mordu sur l\'infanterie');
  const voleur = (etat) => etat.entites.find((e) => e.id === 'broyeur').pvMilli;
  assert.ok(voleur(a.etat) > voleur(temoin), 'le Vol de vie n\'a pas soigné le Broyeur');
});
