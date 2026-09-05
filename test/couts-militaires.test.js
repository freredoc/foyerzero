// Coûts de la défense et de l'offense — invariants de src/data/couts-militaires.js.
//
// CE QUE CES TESTS GARDENT, et qui vient de l'arbitrage d'Ethan du 28/08/2026 :
//   — le niveau 1 est gratuit des deux côtés, et le premier prix est celui du 2 ;
//   — les deux tables couvrent EXACTEMENT leurs rosters, dans les deux sens ;
//   — la même unité ne coûte pas le même prix en garnison et en assaut ;
//   — la défense se paie dans DEUX ressources selon ce qu'elle est ;
//   — la chaîne au-delà du niveau 2 est celle d'ECONOMIE_NIVEAU, pas une autre.
//
// Chaque nombre écrit ici a été relevé EN EXÉCUTANT le module, jamais déduit de
// la formule : c'est la formule qu'on teste. La seule exception est la table du
// premier test, qui est la retranscription de l'arbitrage lui-même — elle est
// écrite à la main exprès, pour que le fichier de données ait un second témoin.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  COUT_NIVEAU_DEUX_OFFENSE, COUT_NIVEAU_DEUX_DEFENSE, rosterDefensif,
  coutDeMonteeOffense, coutDeMonteeDefense, RAPPORT_COEFFICIENT_OFFENSE,
} from '../src/data/couts-militaires.js';
import { ECONOMIE_NIVEAU, montantDuPalier } from '../src/data/economie.js';
import { COUT_ELECTRICITE, RESSOURCE_DE_COUT } from '../src/data/base.js';
import { UNITES, DEFENSES } from '../src/data/combat.js';
import { NIVEAU } from '../src/data/niveaux.js';
import { defensesDisponibles } from '../src/ui/defense.js';

const PREMIER = ECONOMIE_NIVEAU.premierNiveauPayant;

// ---------------------------------------------------------------------------
// L'arbitrage lui-même, retranscrit à la main
// ---------------------------------------------------------------------------

test('couts-militaires — l\'ancre du niveau 2 est exactement celle qu\'Ethan a dictée', () => {
  // ⚠ SECOND TÉMOIN, PAS UNE COPIE DÉCORATIVE. La source de ces trente et un
  // nombres est un message, pas un fichier du dépôt : rien d'autre ne peut les
  // confronter. Les réécrire ici fait qu'une retouche distraite de la table de
  // données tombe, au lieu de passer pour un rééquilibrage voulu. C'est la même
  // discipline que la transcription de la palette dans `banc.test.js`.
  //
  // ⚠⚠ ET IL SE CONFRONTE DÉSORMAIS AU PRIX PAYÉ, PAS À L'ANCRE BRUTE. Depuis
  // le 05/09 la table d'offense porte des FRACTIONS — l'ancre d'accueil mesurée
  // sur les captures —, et la dictée du 28/08 portait leurs arrondis. Les deux
  // se rejoignent exactement au niveau 2, parce que `montantDuPalier` arrondit
  // sa sortie : 1,6 rend 2, 3,2 rend 3, 3,6 rend 4, 4,4 rend 4, 4,8 rend 5 et
  // 5,6 rend 6. Comparer l'ancre brute à la dictée ferait tomber ce test pour
  // une raison qui n'est pas la sienne ; comparer le PRIX le rend plus fort,
  // puisqu'il garde ce que le joueur voit.
  //
  // Les noms en commentaire sont ceux de l'arbitrage — noms Tiberium Alliances.
  const offense = {
    meute: 1, //                                    riflemen — DICTÉ 2, corrigé
    carapace: 2, perceurs: 2, //                    exosoldat, lance-roquettes
    ratisseur: 3, //                                guardien
    fendeur: 4, belier: 4, crecelle: 4, //          predator, pitbull, orca
    guetteur: 5, busard: 5, //                      sniper, paladin
    frappeur: 6, //                                 firehawk
    fouisseurs: 8, //                               commando
    pilon: 9, //                                    juggernaut
    broyeur: 12, enclume: 12, //                    mammouth, kodiak
  };
  const defense = {
    merlon: ['quartz', 2], casemate: ['quartz', 2], batterie: ['quartz', 2],
    ronce: ['quartz', 2], herse: ['quartz', 2], //  mur, mg nest, flak, barbelés, barrière AC
    creneau: ['quartz', 3], //                      canon anti-char
    faucheuse: ['scorie', 10], //                   artillerie anti-infanterie
    harpon: ['scorie', 11], //                      artillerie anti-avion
    mortier: ['scorie', 12], //                     artillerie anti-tank
    meute: ['scorie', 1], //                        riflemen
    guetteur: ['scorie', 2], perceurs: ['scorie', 2], carapace: ['scorie', 2],
    ratisseur: ['scorie', 2], fendeur: ['scorie', 2], // sniper, lance-roq., exo, guardien, predator
    belier: ['scorie', 3], //                       pitbull
    broyeur: ['scorie', 12], //                     mammouth
  };

  // ⚠⚠ UNE SEULE VALEUR DE LA DICTÉE A ÉTÉ CORRIGÉE, ET C'EST L'ESCADRON DE
  // TIREURS : 2 → 1. Le rapport coefficient / ancre vaut exactement 2,000 pour
  // les sept unités dont l'ancre était déjà juste, et 1,000 pour lui seul — la
  // dictée portait un plancher. Ethan, 05/09 : « le fusilier coûte moins que
  // l'exosoldat, quoi qu'il arrive ». Voir `RELEVE-TA-REPARATION.md` §3.
  assert.equal(offense.meute, 1, 'la correction du 05/09 a disparu du témoin');
  assert.ok(offense.meute < offense.carapace, 'le Fusilier doit coûter moins que l\'Exosoldat');

  assert.equal(Object.keys(offense).length, 14);
  for (const [id, montant] of Object.entries(offense)) {
    assert.equal(
      coutDeMonteeOffense(id, PREMIER).scorie, montant,
      `${id} : le prix du niveau 2 s'écarte de la dictée du 28/08`,
    );
  }
  // Falsifiable : sans cette ligne, une table d'ancres toutes égales à leur
  // arrondi passerait — c'est-à-dire le code d'AVANT le 05/09. Six ancres sur
  // quatorze sont strictement fractionnaires.
  assert.equal(
    Object.values(COUT_NIVEAU_DEUX_OFFENSE).filter((a) => !Number.isInteger(a)).length, 6,
    'les ancres fractionnaires du relevé ont disparu',
  );

  assert.equal(Object.keys(defense).length, 17);
  for (const [id, [ressource, montant]] of Object.entries(defense)) {
    assert.deepEqual(
      COUT_NIVEAU_DEUX_DEFENSE[id], { montant, ressource },
      `défense « ${id} » : la table ne dit plus ce qui a été arbitré`,
    );
  }
  // Et dans l'autre sens : aucune entrée en trop dans la table de données.
  assert.deepEqual(
    Object.keys(COUT_NIVEAU_DEUX_DEFENSE).sort(), Object.keys(defense).sort(),
  );
});

// ---------------------------------------------------------------------------
// Couverture des rosters
// ---------------------------------------------------------------------------

test('couts-militaires — l\'offense couvre exactement les quatorze unités', () => {
  const attendus = Object.keys(UNITES).sort();
  // Falsifiable : deux listes vides seraient égales.
  assert.equal(attendus.length, 14);
  assert.deepEqual(
    Object.keys(COUT_NIVEAU_DEUX_OFFENSE).sort(), attendus,
    'une unité entrerait dans la palette d\'assaut sans prix — le refus se lirait « undefined »',
  );
});

test('couts-militaires — la défense couvre exactement le roster défensif', () => {
  const roster = rosterDefensif();
  assert.equal(roster.length, 17, 'neuf ouvrages plus huit unités');
  assert.deepEqual(Object.keys(COUT_NIVEAU_DEUX_DEFENSE).sort(), [...roster].sort());

  // ⚠ ET C'EST BIEN LE MÊME ROSTER QUE CELUI DE L'ÉCRAN. `ui/defense.js` filtre
  // en plus par ce que la RECHERCHE a ouvert (lot RECHERCHE, 30/08 — c'était le
  // niveau d'apparition jusque-là) ; sans filtre, les deux lectures de « qui a
  // un rôle en défense » doivent coïncider. Sans ce croisement, les deux
  // pourraient diverger sans qu'un test tombe.
  assert.deepEqual(
    [...defensesDisponibles(null)].sort(), [...roster].sort(),
    'le roster des coûts et celui de l\'écran de défense ont divergé',
  );
});

// ---------------------------------------------------------------------------
// Le piège n° 1 : deux tables, pas une
// ---------------------------------------------------------------------------

test('couts-militaires — la même unité ne coûte pas le même prix des deux côtés', () => {
  const communs = Object.keys(COUT_NIVEAU_DEUX_OFFENSE)
    .filter((id) => COUT_NIVEAU_DEUX_DEFENSE[id] !== undefined);
  assert.deepEqual(
    communs.sort(),
    ['belier', 'broyeur', 'carapace', 'fendeur', 'guetteur', 'meute', 'perceurs', 'ratisseur'],
  );

  // ⚠⚠ LA COMPARAISON PORTE SUR LE PRIX PAYÉ, PAS SUR L'ANCRE BRUTE, DEPUIS LE
  // 05/09. Les deux tables ne sont plus commensurables : l'offense porte des
  // ancres d'ACCUEIL mesurées, qui peuvent être fractionnaires, la défense des
  // entiers dictés. Ce que ce test garde est le piège n° 1 du fichier — « la
  // même unité ne coûte pas le même prix des deux côtés » —, et ce piège se lit
  // sur ce que le joueur paie.
  //
  // ⚠ REMESURÉ LE 05/09 : QUATRE unités changent de prix selon le rôle, QUATRE
  // coïncident. C'était cinq et trois. DEUX mouvements en sens contraire, et
  // ils s'expliquent tous les deux : `meute` quitte la liste des différentes,
  // parce que sa correction à 1 la fait tomber sur le prix de garnison ; et
  // `perceurs` la quitte aussi, parce que 1,6 s'arrondit sur le 2 de la
  // défense. Une table unique indexée par unité aurait donc paru marcher sur
  // quatre cas sur huit, et faussé les quatre autres en silence.
  const prixOffense = (id) => coutDeMonteeOffense(id, PREMIER).scorie;
  const prixDefense = (id) => coutDeMonteeDefense(id, PREMIER)[COUT_NIVEAU_DEUX_DEFENSE[id].ressource];
  const different = communs.filter((id) => prixOffense(id) !== prixDefense(id));
  assert.deepEqual(different.sort(), ['belier', 'fendeur', 'guetteur', 'ratisseur']);

  // Le pire écart, de face : le Voltigeur vaut 5 en assaut et 2 en garnison.
  assert.equal(prixOffense('guetteur'), 5);
  assert.equal(prixDefense('guetteur'), 2);
  // Et le Fusilier vaut 1 des DEUX côtés depuis la correction du 05/09.
  assert.equal(COUT_NIVEAU_DEUX_DEFENSE.meute.montant, 1);
  assert.equal(prixOffense('meute'), 1);
  assert.equal(
    Object.values(COUT_NIVEAU_DEUX_DEFENSE).filter((l) => l.montant === 1).length, 1,
  );
});

// ---------------------------------------------------------------------------
// Le piège n° 2 : deux ressources en défense
// ---------------------------------------------------------------------------

test('couts-militaires — la défense se paie en quartz pour ce qui est bâti, en scorie pour ce qui roule', () => {
  const parRessource = { quartz: [], scorie: [] };
  for (const [id, ligne] of Object.entries(COUT_NIVEAU_DEUX_DEFENSE)) {
    assert.ok(
      parRessource[ligne.ressource] !== undefined,
      `${id} : ressource « ${ligne.ressource} » inconnue`,
    );
    parRessource[ligne.ressource].push(id);
  }
  assert.deepEqual(
    parRessource.quartz.sort(),
    ['batterie', 'casemate', 'creneau', 'herse', 'merlon', 'ronce'],
  );
  assert.equal(parRessource.scorie.length, 11, 'trois artilleries et huit unités');

  // ⚠ LA CORRÉLATION AVEC LE TYPE EST ASSERTÉE, PAS EXPLOITÉE. La ressource est
  // écrite ligne par ligne dans la table — c'est la forme de l'arbitrage. Ce
  // test ne la déduit pas du type : il vérifie que les deux racontent la même
  // histoire, pour que le jour où une donnée s'en écarte, quelqu'un ait à le
  // décider. `data/combat.js` dit déjà que les trois artilleries sont des
  // VÉHICULES et non des structures ; c'est ce qui explique le partage.
  for (const [id, ligne] of Object.entries(COUT_NIVEAU_DEUX_DEFENSE)) {
    const type = DEFENSES[id] === undefined ? 'unite' : DEFENSES[id].type;
    const attendue = (type === 'mur' || type === 'barriere' || type === 'tourelle')
      ? 'quartz' : 'scorie';
    assert.equal(
      ligne.ressource, attendue,
      `${id} (type ${type}) : ce qui est bâti se paie en quartz, ce qui roule en scorie`,
    );
  }
  // Falsifiable : les quatre familles doivent être représentées, sinon la
  // boucle ci-dessus ne mesurerait qu'un seul cas.
  const types = new Set(Object.keys(COUT_NIVEAU_DEUX_DEFENSE)
    .map((id) => (DEFENSES[id] === undefined ? 'unite' : DEFENSES[id].type)));
  assert.deepEqual([...types].sort(), ['artillerie', 'barriere', 'mur', 'tourelle', 'unite']);
});

test('couts-militaires — l\'offense se paie entièrement en scorie', () => {
  assert.equal(RESSOURCE_DE_COUT.offense, 'scorie');
  for (const id of Object.keys(COUT_NIVEAU_DEUX_OFFENSE)) {
    for (const niveau of [2, 5, 12]) {
      const cout = coutDeMonteeOffense(id, niveau);
      assert.equal(cout.quartz, 0, `${id} niv.${niveau} : l'assaut ne coûte pas de quartz`);
      assert.ok(cout.scorie > 0, `${id} niv.${niveau} : coût en scorie nul`);
    }
  }
});

test('couts-militaires — `RESSOURCE_DE_COUT` n\'annonce plus UNE ressource pour la défense', () => {
  // ⚠ C'EST L'ABSENCE QUI EST LE MESSAGE. La clé `defense` valait « scorie »
  // depuis le 27/08, en anticipation et sans que rien ne la lise. L'arbitrage
  // du 28/08 l'a falsifiée pour six entités sur dix-sept. La laisser, même
  // juste pour la majorité, donnerait une réponse fausse à qui l'interroge sans
  // lire plus loin.
  assert.equal(
    Object.prototype.hasOwnProperty.call(RESSOURCE_DE_COUT, 'defense'), false,
    'la défense se paie dans deux ressources — la table qui fait foi est celle des ancres',
  );
  assert.equal(RESSOURCE_DE_COUT.batiment, 'quartz');
  assert.equal(RESSOURCE_DE_COUT.offense, 'scorie');
});

// ---------------------------------------------------------------------------
// Le piège n° 3 : le niveau 1 est gratuit, et ne se demande pas
// ---------------------------------------------------------------------------

test('couts-militaires — le niveau 1 lève au lieu de rendre zéro', () => {
  assert.equal(PREMIER, 2, 'le premier niveau payant est le 2, pour tout le monde');
  assert.throws(() => coutDeMonteeOffense('meute', 1), /gratuit/);
  assert.throws(() => coutDeMonteeDefense('merlon', 1), /gratuit/);
  assert.throws(() => coutDeMonteeOffense('meute', 0), /hors de/);
});

test('couts-militaires — le niveau 2 vaut l\'ancre, à l\'unité près et sans électricité', () => {
  // ⚠ « À L'UNITÉ PRÈS » A PRIS SON SENS PLEIN LE 05/09 : l'ancre d'accueil peut
  // être fractionnaire, et le prix est son ARRONDI. Au niveau 2 le profil vaut 1
  // et l'exposant du redressement est nul, donc le coefficient de régime ne peut
  // pas intervenir — c'est ce que cette ligne garde.
  for (const [id, ancre] of Object.entries(COUT_NIVEAU_DEUX_OFFENSE)) {
    const cout = coutDeMonteeOffense(id, 2);
    assert.equal(cout.scorie, Math.round(ancre), `${id} : le niveau 2 doit valoir son ancre`);
    assert.equal(cout.electricite, 0, `${id} : pas d'électricité avant le niveau 3`);
  }
  for (const [id, ligne] of Object.entries(COUT_NIVEAU_DEUX_DEFENSE)) {
    const cout = coutDeMonteeDefense(id, 2);
    assert.equal(cout[ligne.ressource], ligne.montant);
    assert.equal(cout.electricite, 0);
  }
});

// ---------------------------------------------------------------------------
// La chaîne : celle d'ECONOMIE_NIVEAU, et aucune autre
// ---------------------------------------------------------------------------

test('couts-militaires — la chaîne est celle des bâtiments, seule l\'ancre change', () => {
  // Relevé par exécution. ⚠ REMESURÉ LE 05/09 : le Fusilier passe d'une ancre
  // de 2 à une ancre d'accueil de 1 et d'un coefficient de 2, donc sa chaîne
  // n'est plus la moitié de celle de l'Exosoldat par arrondis successifs mais
  // par construction. C'était [2, 3, 6, 24, 132, 432].
  const attendus = [1, 1, 3, 12, 73, 255];
  const obtenus = [2, 3, 4, 5, 6, 7].map((n) => coutDeMonteeOffense('meute', n).scorie);
  assert.deepEqual(obtenus, attendus);

  // Falsifiable : la chaîne doit MONTER vite, sinon comparer à `montantDuPalier`
  // ne prouverait rien — deux fonctions plates coïncident aussi.
  assert.ok(obtenus[5] / obtenus[0] > 200, 'la chaîne ne monte pas : le montage ne mesure rien');

  // Et la même rampe, sur toutes les entités et tous les paliers.
  //
  // ⚠ LE COEFFICIENT DE L'OFFENSE EST UN SCALAIRE, ET IL EST LU, PAS RECOPIÉ.
  // `RAPPORT_COEFFICIENT_OFFENSE` vaut 2 pour les quatorze — mesuré. Écrire une
  // seconde table de quatorze coefficients ici en ferait une copie, et sa
  // première divergence se lirait comme un déséquilibre de jeu.
  for (const [id, ancre] of Object.entries(COUT_NIVEAU_DEUX_OFFENSE)) {
    for (let n = PREMIER; n <= NIVEAU.plafond; n += 1) {
      assert.equal(
        coutDeMonteeOffense(id, n).scorie,
        montantDuPalier(ancre, ancre * RAPPORT_COEFFICIENT_OFFENSE, n),
        `${id} niv.${n} : l'assaut a sa propre rampe, ce qui est interdit`,
      );
    }
  }
  // ⚠ ET LA DÉFENSE PREND SON ANCRE POUR COEFFICIENT — facteur 1, donc aucun
  // redressement. Choix conservateur du 05/09 : aucune capture n'a jamais
  // confronté ces dix-sept ancres à quoi que ce soit.
  for (const [id, ligne] of Object.entries(COUT_NIVEAU_DEUX_DEFENSE)) {
    for (let n = PREMIER; n <= NIVEAU.plafond; n += 1) {
      assert.equal(
        coutDeMonteeDefense(id, n)[ligne.ressource],
        montantDuPalier(ligne.montant, ligne.montant, n),
      );
    }
  }
});

test('couts-militaires — la rampe partagée restitue la table relevée des bâtiments', () => {
  // ⚠⚠ C'EST LE **BARÈME T1**, ET C'EST UNE NON-RÉGRESSION, PAS UNE
  // FALSIFICATION : il passait avant le lot BARÈME du 05/09 et il passe après,
  // délibérément. Le Chantier a un coefficient de régime ÉGAL à son ancre
  // d'accueil — facteur 1 —, donc sa rampe doit être restituée à l'identique
  // par la formule redressée. C'est la vérification qui passe avant toutes les
  // autres : si elle tombait, le redressement aurait changé la référence
  // elle-même.
  //
  // ⚠ CE TEST GARDE LE DÉPLACEMENT DE LA RAMPE. Elle vivait en privé dans
  // `data/base.js` ; elle est passée dans `data/economie.js` le 28/08 pour que
  // la défense et l'offense s'en servent sans la recopier. Si le déplacement
  // avait changé un arrondi, c'est ici que ça se verrait — la suite relevée est
  // celle que `COUT_NIVEAU_DEUX.majeur` produit depuis le 27/08.
  assert.deepEqual(
    [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => montantDuPalier(8, 8, n)),
    [8, 10, 20, 80, 440, 1440, 4400, 12800, 35200, 89600, 192000],
  );
  // L'ancre EST le premier palier : le profil vaut 1 au niveau 2.
  assert.equal(montantDuPalier(7, 7, PREMIER), 7);
  // ⚠ ET ELLE L'EST QUEL QUE SOIT LE COEFFICIENT : au niveau 2 l'exposant du
  // redressement est nul. Sans cette ligne, une formule qui appliquerait le
  // facteur dès le premier palier passerait le test ci-dessus, où le Chantier a
  // justement un facteur de 1.
  assert.equal(montantDuPalier(7, 21, PREMIER), 7);
});

// ---------------------------------------------------------------------------
// L'électricité
// ---------------------------------------------------------------------------

test('couts-militaires — l\'électricité commence au niveau 3 et vaut le quart', () => {
  // La règle est UNE, et elle vient de `data/base.js` : elle n'est pas recopiée
  // pour le militaire. RELEVE-TA-COURBES-2.md §5 : « L'électricité vaut
  // systématiquement le quart de la monnaie principale. »
  assert.equal(COUT_ELECTRICITE.premierNiveauPayant, 3);
  assert.equal(COUT_ELECTRICITE.fraction.autres, 0.25);
  // ⚠ LE QUART VAUT POUR LE MILITAIRE, PAS POUR TOUT LE MONDE. Depuis le 05/09
  // le Collecteur prend 0,75 et la Centrale 0,5/5,2 — mesurés. Les entités
  // militaires ne figurent pas dans la table par bâtiment et prennent donc
  // `autres`, qui est resté le quart et qui est le seul nombre confirmé.
  assert.notEqual(COUT_ELECTRICITE.fraction.collecteur, COUT_ELECTRICITE.fraction.autres);

  let arrondisNonTriviaux = 0;
  for (const [id, ancre] of Object.entries(COUT_NIVEAU_DEUX_OFFENSE)) {
    for (let n = PREMIER; n <= NIVEAU.plafond; n += 1) {
      const cout = coutDeMonteeOffense(id, n);
      const principal = montantDuPalier(ancre, ancre * RAPPORT_COEFFICIENT_OFFENSE, n);
      const attendue = n < 3 ? 0 : Math.round(principal / 4);
      assert.equal(cout.electricite, attendue, `${id} niv.${n} : électricité`);
      if (n >= 3 && principal % 4 !== 0) arrondisNonTriviaux += 1;
    }
  }
  // Falsifiable : si aucun palier ne tombait de travers, `Math.round` et une
  // division entière rendraient partout la même chose et le test passerait sur
  // les deux. Relevé le 28/08 : il y en a des centaines.
  assert.ok(
    arrondisNonTriviaux > 50,
    `${arrondisNonTriviaux} paliers à arrondi non trivial : le montage ne mesure pas l'arrondi`,
  );

  // Les petites ancres font mordre l'arrondi tout de suite. ⚠ REMESURÉ LE
  // 05/09 : le Fusilier coûte 1 de scorie au niveau 3, donc 0,25
  // d'électricité, donc ZÉRO. C'était 3 et 1 — l'ancre a été corrigée de 2 à 1,
  // et son coefficient de régime la redresse trop tard pour que ce palier-là
  // bouge. Le premier palier où l'électricité mord est le 4.
  assert.equal(coutDeMonteeOffense('meute', 3).scorie, 1);
  assert.equal(coutDeMonteeOffense('meute', 3).electricite, 0);
  assert.equal(coutDeMonteeOffense('meute', 4).scorie, 3);
  assert.equal(coutDeMonteeOffense('meute', 4).electricite, 1);
});

// ---------------------------------------------------------------------------
// Bornes et refus
// ---------------------------------------------------------------------------

test('couts-militaires — le plafond est celui du jeu, et au-delà ça lève', () => {
  assert.equal(NIVEAU.plafond, 50);
  assert.ok(coutDeMonteeOffense('enclume', NIVEAU.plafond).scorie > 0);
  assert.ok(coutDeMonteeDefense('mortier', NIVEAU.plafond).scorie > 0);
  assert.throws(() => coutDeMonteeOffense('enclume', 51), /hors de/);
  assert.throws(() => coutDeMonteeDefense('mortier', 51), /hors de/);
  assert.throws(() => coutDeMonteeOffense('meute', 2.5), /hors de/);
});

test('couts-militaires — une entité hors roster lève, et le dit', () => {
  assert.throws(() => coutDeMonteeOffense('merlon', 2), /n'est pas une unité d'assaut/);
  // Le Pilon et la Crécelle n'ont pas de rôle défensif — `defense.present` vaut
  // false. Ils ont donc un prix d'assaut et aucun prix de garnison.
  assert.equal(UNITES.pilon.defense.present, false);
  assert.ok(COUT_NIVEAU_DEUX_OFFENSE.pilon > 0);
  assert.throws(() => coutDeMonteeDefense('pilon', 2), /n'a pas de rôle en défense/);
  assert.throws(() => coutDeMonteeDefense('inconnu', 2), /n'a pas de rôle en défense/);
});

test('couts-militaires — le plus gros coût du jeu tient loin sous l\'entier sûr', () => {
  // ⚠ MESURÉ, PAS SUPPOSÉ. C'est la règle qui a coûté le plus cher au projet :
  // deux bornes de débordement ont été annoncées de tête et mesurées fausses.
  let pire = 0;
  for (const [id, ancre] of Object.entries(COUT_NIVEAU_DEUX_OFFENSE)) {
    const cout = coutDeMonteeOffense(id, NIVEAU.plafond);
    pire = Math.max(pire, cout.scorie + cout.electricite);
    assert.equal(Number.isSafeInteger(cout.scorie), true, `${id} : coût non entier sûr`);
    assert.ok(ancre > 0);
  }
  for (const [id, ligne] of Object.entries(COUT_NIVEAU_DEUX_DEFENSE)) {
    const cout = coutDeMonteeDefense(id, NIVEAU.plafond);
    pire = Math.max(pire, cout[ligne.ressource] + cout.electricite);
  }
  // Relevé le 28/08 : 16,5 milliards, soit 546 000 fois sous l'entier sûr.
  assert.ok(pire > 1e9, `${pire} : la mesure semble cassée, le plafond devrait être énorme`);
  assert.ok(
    pire * 1000 < Number.MAX_SAFE_INTEGER,
    `${pire} : même en milli-unités, un coût doit rester un entier sûr`,
  );
});
