// Tests T1 à T8 du brief du lot 3C — une cible valide est une cible qu'on peut
// blesser.
//
// Chaque seuil porte son calcul en commentaire.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { UNITES, DEFENSES } from '../src/data/combat.js';
import { creerCombat, tick, resoudre, TICKS_AVANT_REPLI } from '../src/sim/combat.js';
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
const matriceDe = (e) => (e.genre === 'batiment' ? null
  : e.genre === 'defense' ? DEFENSES[e.id].matrice : UNITES[e.id].matrice);

/** Les dégâts qu'un tir de `x` porterait à `c`, recalculés depuis les données. */
function degatsAttendus(x, c) {
  const matrice = matriceDe(x);
  if (matrice === null) return 0;
  if (c.genre === 'batiment' && x.camp === 'attaque' && x.reserve <= 0) return 0;
  const facteur = Math.round(matrice[colonneDe(c)] * 1000);
  const sante = Math.floor((x.pvMilli * 1000) / x.pvMaxMilli);
  return Math.floor((x.degats * facteur * sante) / 1000);
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
    modulesDebloques: { ouvrage: [], joueur: [] },
  };
  assert.deepEqual(DEFENSES.batterie.matrice, {
    infanterie: 0, vehicule: 0, structureOuAviation: 1,
  });

  const etat = creerCombat(montage);
  const batterie = trouver(etat, 'batterie');
  const fusilier = trouver(etat, 'meute');
  const crecelle = trouver(etat, 'crecelle');

  jouer(etat, 1);
  assert.equal(cibleDe(etat, batterie), 'crecelle', 'dès le premier ciblage');

  // ⚠ Les dégâts NE SONT PAS constants, et c'est le piège de ce montage : les
  // trois pièces se tirent dessus au même tick, et la formule pondère chaque
  // tir par la santé COURANTE du tireur. Le calcul se conduit donc à trois
  // décroissances couplées, reproduites ici depuis les seules données :
  //
  //   Batterie → Crécelle  15 × 1000‰ × santé(B) / 1000  (aéronef, facteur 1,0)
  //   Crécelle → Batterie  12 ×  200‰ × santé(C) / 1000  (tourelle, facteur 0,2)
  //   Fusilier → Batterie   8 ×  300‰ × santé(F) / 1000  (tourelle, facteur 0,3)
  //
  // Le Fusilier ne reçoit rien : sa santé reste à 1000 ‰ et ses 2 400 milli-PV
  // par tick sont constants. La Crécelle, elle, s'affaiblit, donc rend de moins
  // en moins à la Batterie, qui s'affaiblit quand même et frappe de moins en
  // moins fort. Le premier tir seul est rond : 15 × 1000 × 1000/1000 = 15 000.
  assert.equal(crecelle.pvMilli, 200_000 - 15_000, 'premier tir à pleine santé');

  // On rejoue la même mécanique à la main et on exige que le moteur la suive
  // tick par tick. Une lecture naïve à dégâts constants annoncerait la mort au
  // tick 14 — ceil(200 000 / 15 000) — ; la décroissance la repousse au 15e.
  const sante = (pv, pvMax) => Math.floor((pv * 1000) / pvMax);
  const modele = { b: 350_000, c: 200_000, f: 100_000 };
  let mortAttendue = null;
  for (let t = 1; t <= 33 && mortAttendue === null; t += 1) {
    const versC = Math.floor((15 * 1000 * sante(modele.b, 350_000)) / 1000);
    const versB = Math.floor((12 * 200 * sante(modele.c, 200_000)) / 1000)
      + Math.floor((8 * 300 * sante(modele.f, 100_000)) / 1000);
    modele.c = Math.max(0, modele.c - versC);
    modele.b = Math.max(0, modele.b - versB);
    if (modele.c === 0) mortAttendue = t;
    else {
      jouer(etat, t);
      assert.equal(crecelle.pvMilli, modele.c, `PV de la Crécelle au tick ${t}`);
    }
  }
  assert.equal(mortAttendue, 15, 'la Crécelle tombe au 15e tick, pas au 14e');

  jouer(etat, 14);
  assert.equal(crecelle.vivant, true, 'elle tient encore au tick 14');
  assert.equal(crecelle.pvMilli, 6080, '200 000 moins les quatorze premiers tirs');
  jouer(etat, 15);
  assert.equal(crecelle.pvMilli, 0, 'abattue au tick 15');
  assert.equal(crecelle.vivant, false);

  // Et le Fusilier, lui, n'a JAMAIS rien perdu — avant le lot 3C, ni lui ni la
  // Crécelle ne perdaient un seul point de vie en 33 ticks.
  jouer(etat, 33);
  assert.equal(fusilier.pvMilli, 100_000, 'le Fusilier reste intact de bout en bout');
  assert.equal(fusilier.vivant, true);
  // La Crécelle morte, la Batterie n'a plus de cible valide du tout : le
  // Fusilier est collé à elle, mais son facteur contre l'infanterie est nul.
  assert.equal(batterie.cibleIndice, null);
});

// ---------------------------------------------------------------------------
// T2 — le facteur nul en général, des deux côtés du champ
// ---------------------------------------------------------------------------

test('T2 — un facteur de matrice nul disqualifie la cible, si proche soit-elle', () => {
  // CÔTÉ ATTAQUE. Frappeur en (4,5), matrice {0, 0, 1}, portée 1,5 → 2 250 000.
  //   Meute défensive en (5,5) : 1000² = 1 000 000, soit 1,000 case.
  //   Merlon en (5,6)          : 1000² + 1000² = 2 000 000, soit 1,414 case.
  // Les DEUX sont à portée — 2 000 000 ≤ 2 250 000 — et la Meute est la plus
  // proche. Il doit viser le Merlon. (Poser le Merlon en (6,5) le mettrait à
  // 2,0 cases, hors de portée : le test passerait pour la mauvaise raison.)
  assert.deepEqual(UNITES.frappeur.matrice, {
    infanterie: 0, vehicule: 0, structureOuAviation: 1,
  });
  assert.ok(2_000_000 <= (UNITES.frappeur.portee * 1000) ** 2, 'le Merlon doit être à portée');

  const offense = creerCombat({
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [GANGUE_LOINTAINE],
    defenseurs: [{ id: 'meute', rangee: 5, colonne: 5 }, { id: 'merlon', rangee: 5, colonne: 6 }],
    vagues: [[{ id: 'frappeur', rangee: 4, colonne: 5 }]],
    modulesDebloques: { ouvrage: [], joueur: [] },
  });
  jouer(offense, 1);
  assert.equal(cibleDe(offense, trouver(offense, 'frappeur')), 'merlon');
  // Et la Meute, plus proche mais insensible, n'a rien perdu.
  assert.equal(trouver(offense, 'meute').pvMilli, 100_000);

  // CÔTÉ DÉFENSE. Harpon en (8,5), portée 5,5 → 30 250 000, portée minimale
  // 3,5 → 12 250 000.
  //   Fendeur en (4,5) : 4000² = 16 000 000, soit 4,000 cases.
  //   Crécelle en (4,7) : 4000² + 2000² = 20 000 000, soit 4,472 cases.
  // Les deux sont dans la fenêtre, le Fendeur est le plus proche, et le Harpon
  // doit viser la Crécelle.
  assert.deepEqual(DEFENSES.harpon.matrice, {
    infanterie: 0, vehicule: 0, structureOuAviation: 1,
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
    modulesDebloques: { ouvrage: [], joueur: [] },
  });
  jouer(defense, 1);
  assert.equal(cibleDe(defense, trouver(defense, 'harpon')), 'crecelle');
  assert.equal(trouver(defense, 'fendeur').pvMilli, 300_000, 'le Fendeur reste intact');
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
    modulesDebloques: { ouvrage: [], joueur: [] },
  });

  // À réserve 0 : le plancher ne protège que les bâtiments, le tir sur la
  // défense reste gratuit. La Casemate est la seule cible valide.
  const vide = creerCombat(montageAvec(0));
  jouer(vide, 1);
  assert.equal(cibleDe(vide, trouver(vide, 'perceurs')), 'casemate');
  assert.equal(trouver(vide, 'gangue').pvMilli, 150_000, 'la Gangue n\'a rien reçu');

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
  // Avant le lot 3C : `duree` au tick 900. Après : `attaquants` au tick 542.
  assert.notEqual(r.cause, 'duree', 'le raid ne doit plus expirer faute de mieux');
  assert.equal(r.cause, 'attaquants');
  assert.equal(r.nbTicks, 542);
  // Le butin ne bouge pas : le Percheron gelé ne rapportait rien, et les tirs
  // qu'il place désormais vont sur la défense, qui ne paie pas de butin.
  assert.deepEqual(r.butin, { quartz: 55_251, scorie: 18_417 });
  assert.equal(r.resultat.attaquants.filter((a) => !a.detruit).length, 2);
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
  let expires = 0;
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
        if (!c.vivant || c.sorti || matriceDe(x) === null) continue;
        ticksVises += 1;
        if (dca.has(x.indice)) {
          dcaVises += 1;
          if (degatsAttendus(x, c) === 0) dcaSteriles += 1;
        }
        if (degatsAttendus(x, c) === 0) precedent.set(x.indice, x.cibleIndice);
      }
    }
    if (etat.cause === 'duree') expires += 1;
  }

  assert.equal(raids, 54, '3 préréglages × 3 types × 6 graines');
  assert.ok(ticksVises > 40_000, `balayage trop maigre : ${ticksVises} ticks-entités`);
  assert.equal(survivants, 0, 'aucune cible stérile ne doit survivre à un ciblage');
  // Plus aucun raid ne se termine faute de mieux : avant le lot 3C, un
  // Percheron gelé en faisait expirer un.
  assert.equal(expires, 0, 'aucun raid ne doit plus finir par « duree »');
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
    modulesDebloques: { ouvrage: [], joueur: [] },
  });
  const grenadier = trouver(etat, 'perceurs');

  jouer(etat, 1);
  assert.equal(cibleDe(etat, grenadier), 'gangue', 'la plus proche, et valide');
  assert.equal(grenadier.reserve, 0, 'le tir a vidé la réserve');
  // Dégâts : 8 × 1000 × 1000/1000 = 8000 milli-PV. Gangue 150 000 → 142 000.
  assert.equal(trouver(etat, 'gangue').pvMilli, 150_000 - 8000);

  jouer(etat, 2);
  assert.equal(cibleDe(etat, grenadier), 'casemate', 'il CHANGE de cible');
  assert.equal(trouver(etat, 'gangue').pvMilli, 150_000 - 8000, 'et la Gangue ne reçoit plus rien');
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
        if (!c.vivant || c.sorti || matriceDe(x) === null) continue;
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
          if (c.camp === x.camp || !c.vivant || c.sorti || matriceDe(x) === null) continue;
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
