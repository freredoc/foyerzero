// ---------------------------------------------------------------------------
// LOT BASES-0 — déplier l'état, sans fonder personne.
//
// ⚠⚠ LA RÈGLE DE SUCCÈS DE CE LOT EST BRUTALE : LE JEU DOIT SE COMPORTER
// EXACTEMENT COMME AVANT. Le dépliage touche deux cent cinquante sites d'accès ;
// aucun ne doit changer un nombre. Les tests unitaires ordinaires ne prouvent
// pas grand-chose ici — ils sont réécrits par la même main que le code, donc ils
// suivent l'erreur qu'ils devraient attraper. C'est le TÉMOIN qui garde, et lui
// seul : un scénario de quatorze phases rejoué sur vingt-cinq graines, dont les
// empreintes ont été capturées sur `main` AVANT que rien ne bouge.
//
// ⚠ LE SCÉNARIO N'APPELLE QUE DES FONCTIONS EXPORTÉES. Un seul endroit de ce
// fichier connaît la FORME de l'état — `laBase`, quatre lignes plus bas — et
// c'est tout l'intérêt du découpage : le lot la change, et les nombres que rend
// `releve` ne bougent pas d'une unité.
// ---------------------------------------------------------------------------

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

import {
  creerEtat, tickJeu, rattraperJeu, poser, ameliorer, poserEffectif,
  serialiser, charger, baseCourante, SAVE_VERSION, migrer, CHAMPS_DE_BASE,
} from '../src/sim/state.js';
import { executerRaid, simulerRaid } from '../src/sim/raid.js';
import { ciblesAPortee } from '../src/sim/site-de-la-case.js';
import {
  deplacerLaBase, casesAtteignables, poserLaBaseSur,
} from '../src/sim/deplacement.js';
import {
  basesAttaquantes, prochaineMinuteDeRaid, minuteDeLHorloge, TICKS_PAR_MINUTE,
} from '../src/sim/raid-ouvrage.js';
import { champsDeLaBase, obstaclesDeLaBase } from '../src/sim/champs.js';
import { navigationEntreBases } from '../src/ui/chantier.js';
import { aplatirSauvegarde } from './aplatir-sauvegarde.js';
import {
  GRAINES, PHASES, CHAMPS, EMPREINTES_PAR_CHAMP, EMPREINTES_PAR_GRAINE, SCALAIRES,
  VERSION_AU_TEMOIN, OCTETS_AJOUTES_PAR_LE_DEPLIAGE,
} from './temoins-bases-0.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const H = 36000;   // ticks par heure

// ---------------------------------------------------------------------------
// La lecture — LE SEUL ENDROIT QUI CONNAISSE LA FORME DE L'ÉTAT
// ---------------------------------------------------------------------------

/**
 * La base courante.
 *
 * ⚠ AVANT LE LOT, elle rendait `etat` : la base ÉTAIT l'état. Depuis, elle
 * délègue à l'accesseur du moteur — et c'est la seule ligne du scénario que le
 * dépliage a touchée. Si un témoin tombe alors que celle-ci est juste, c'est le
 * JEU qui a changé, pas le chemin d'accès.
 */
function laBase(etat) {
  return baseCourante(etat);
}

const nb = (x) => (x === undefined ? null : x);

/** Digest ordonné et stable d'une liste de pièces posées. */
function pieces(liste, axe) {
  return (liste ?? []).map((p) => [
    p.id, nb(p[axe]), nb(p.colonne), nb(p.niveau), nb(p.degatsMilli),
    p.actif === undefined ? null : p.actif,
  ]);
}

/** Ce qu'on retient d'une partie — vingt-deux champs, tous nombres ou chaînes. */
function releve(etat) {
  const b = laBase(etat);
  return {
    version: etat.version,
    graine: etat.graine,
    nbTicks: etat.horloge.nbTicks,
    rngEtat: JSON.stringify(etat.rng),
    tutoriel: JSON.stringify(etat.tutoriel),
    recherche: JSON.stringify(etat.recherche),
    sitesEntames: JSON.stringify(etat.sitesEntames),
    basesRasees: JSON.stringify(etat.basesRasees),
    poisAcquis: JSON.stringify(etat.poisAcquis),
    attaque: JSON.stringify(etat.attaque),
    rapports: JSON.stringify(etat.rapports),
    position: `${b.position.rangee},${b.position.colonne}`,
    fondation: `${b.fondation.rangee},${b.fondation.colonne}`,
    champs: JSON.stringify(b.champs),
    obstacles: JSON.stringify(b.obstacles),
    disposition: JSON.stringify(pieces(b.disposition, 'rangee')),
    garnison: JSON.stringify(pieces(b.garnison, 'rangee')),
    armee: JSON.stringify(pieces(b.armee, 'vague')),
    economie: JSON.stringify(b.economie),
    satellites: JSON.stringify(b.satellites),
    reserveReparation: JSON.stringify(b.reserveReparation),
    dernierDeplacementTick: nb(b.dernierDeplacementTick),
  };
}

// ---------------------------------------------------------------------------
// Le scénario — quatorze phases, identiques avant et après le dépliage
// ---------------------------------------------------------------------------

function empreinte(valeur) {
  return createHash('sha256').update(String(valeur)).digest('hex').slice(0, 16);
}

/** Monte le Chantier autant que les stocks le permettent. */
function monterLeChantier(etat, journal) {
  for (let i = 0; i < 8; i += 1) {
    try { ameliorer(etat, 0); } catch { break; }
  }
  journal.push(`chantier→${laBase(etat).disposition[0].niveau}`);
}

/** Pose un bâtiment sur la première case légale trouvée. */
function poserOuDire(etat, id, journal) {
  for (let r = 11; r <= 18; r += 1) {
    for (let c = 1; c <= 9; c += 1) {
      try {
        poser(etat, id, r, c);
        journal.push(`${id}@${r},${c}`);
        return;
      } catch { /* case illégale : la suivante */ }
    }
  }
  journal.push(`${id}: aucune case`);
}

/**
 * La garnison et l'armée.
 *
 * ⚠ LES IDENTIFIANTS SONT LES CLÉS DES TABLES — les noms de l'Ouvrage —, et la
 * bande de défense est rangées 3…10, pas 11…18. La garnison porte les DEUX
 * genres, `DEFENSES` et `UNITES` : c'est le trou qui faisait écran blanc le
 * 30/08, et un montage qui ne poserait que des défenses ne garderait que lui.
 */
function armer(etat) {
  const journal = [];
  const garnison = [
    ['merlon', 4, 2], ['casemate', 5, 4], ['meute', 6, 3],
    ['perceurs', 6, 5], ['ronce', 3, 6], ['batterie', 8, 7],
  ];
  for (const [id, rangee, colonne] of garnison) {
    try {
      poserEffectif(etat, 'garnison', { id, rangee, colonne, niveau: 6 });
      journal.push(`gar ${id}@${rangee},${colonne}`);
    } catch (e) { journal.push(`gar ${id} refusé: ${e.message.slice(0, 40)}`); }
  }
  const armee = [
    ['meute', 1, 2, 8], ['perceurs', 1, 4, 8], ['carapace', 2, 3, 7],
    ['guetteur', 2, 5, 9], ['crecelle', 3, 4, 6], ['meute', 4, 6, 5],
  ];
  for (const [id, vague, colonne, niveau] of armee) {
    try {
      poserEffectif(etat, 'armee', { id, vague, colonne, niveau });
      journal.push(`arm ${id}@v${vague},${colonne}`);
    } catch (e) { journal.push(`arm ${id} refusé: ${e.message.slice(0, 40)}`); }
  }
  return journal;
}

/** Les champs d'un rapport de raid, aplatis en scalaires. */
function releveDuRapport(rapport) {
  const plat = {};
  for (const [k, v] of Object.entries(rapport)) {
    plat[k] = (v !== null && typeof v === 'object') ? JSON.stringify(v) : v;
  }
  return plat;
}

/** Un raid sur la cible la plus proche, s'il y en a une. */
function raider(etat, t, prefixe) {
  const base = laBase(etat);
  const cibles = ciblesAPortee(etat, base);
  t[`${prefixe}NbCibles`] = cibles.length;
  if (cibles.length === 0) { t[`${prefixe}Cible`] = null; return; }
  const c = cibles[0];
  t[`${prefixe}Cible`] = `${c.rangee},${c.colonne}:${c.type}:n${c.niveau}`;
  const avant = releve(etat);
  try {
    const simule = simulerRaid(etat, base, { rangee: c.rangee, colonne: c.colonne });
    t[`${prefixe}SimuleNeFuitPas`] = JSON.stringify(releve(etat)) === JSON.stringify(avant);
    const rapport = executerRaid(etat, base, { rangee: c.rangee, colonne: c.colonne });
    t[`${prefixe}Rapport`] = releveDuRapport(rapport);
    t[`${prefixe}SimuleExact`] = JSON.stringify(releveDuRapport({ ...simule, simule: undefined }))
      === JSON.stringify(releveDuRapport({ ...rapport, simule: undefined }));
  } catch (e) { t[`${prefixe}Rapport`] = `refusé: ${e.message.slice(0, 90)}`; }
  t[`${prefixe}Apres`] = releve(etat);
}

function jouerUneGraine(graine) {
  const t = { graine };
  const etat = creerEtat(graine);
  const journal = [];

  // --- 1. bâtir en trois temps, entrecoupés de production -------------------
  monterLeChantier(etat, journal);
  for (const id of ['collecteur', 'collecteur', 'raffinerie']) poserOuDire(etat, id, journal);
  t.p01_batir = releve(etat);

  rattraperJeu(etat, 6 * H);
  t.p02_6h = releve(etat);

  monterLeChantier(etat, journal);
  for (const id of ['centraleElectrique', 'centreDeCommandement', 'qgDeDefense']) {
    poserOuDire(etat, id, journal);
  }
  rattraperJeu(etat, 6 * H);
  monterLeChantier(etat, journal);
  for (const id of ['caserne', 'depotDeVehicules', 'accumulateur']) poserOuDire(etat, id, journal);
  t.gestes = journal;
  t.p03_batiComplet = releve(etat);

  // --- 2. armer -------------------------------------------------------------
  t.gestesArmer = armer(etat);
  t.p04_arme = releve(etat);

  rattraperJeu(etat, 6 * H);
  t.p05_18h = releve(etat);

  // --- 3. sauvegarder puis relire, sans absence -----------------------------
  const json = serialiser(etat, 1_000_000);
  t.tailleSauvegarde = json.length;
  t.p06_relu = releve(charger(json, 1_000_000));

  // --- 4. un raid sur un satellite ------------------------------------------
  raider(etat, t, 'p07_raidProche');

  // --- 5. cent ticks un par un ----------------------------------------------
  for (let i = 0; i < 100; i += 1) tickJeu(etat);
  t.p08_100ticks = releve(etat);

  // --- 6. un déplacement légal ----------------------------------------------
  const atteignables = casesAtteignables(etat);
  t.nbCasesAtteignables = atteignables.length;
  if (atteignables.length > 0) {
    const c = atteignables[Math.floor(atteignables.length / 2)];
    try {
      deplacerLaBase(etat, { rangee: c.rangee, colonne: c.colonne });
      t.deplacement = `${c.rangee},${c.colonne}`;
    } catch (e) { t.deplacement = `refusé: ${e.message.slice(0, 60)}`; }
  } else { t.deplacement = null; }
  t.p09_deplace = releve(etat);

  // --- 7. la base monte en pays ennemi --------------------------------------
  // ⚠ `poserLaBaseSur` ET NON `deplacerLaBase` : on veut le TERRAIN de jeu, pas
  // le délai. À la rangée 200 la strate vaut 17, donc `RAID_OUVRAGE.niveauMinimal`
  // est franchi et les bases voisines attaquent. À la rangée 295, il n'y a
  // aucune base ennemie à portée et rien de tout ceci ne se joue.
  poserLaBaseSur(etat, 200, 16);
  t.p10_montee = releve(etat);
  raider(etat, t, 'p11_raidOuvrage');

  // --- 8. l'équivalence des deux chemins, mesurée et non supposée -----------
  //
  // ⚠⚠ ON AVANCE JUSQU'À LA VEILLE DU RAID, PUIS ON JOUE CINQ MINUTES TICK PAR
  // TICK. C'est le SEUL endroit où les deux chemins peuvent diverger : hors
  // raid, `rattraperJeu` avance d'un seul bloc analytique et l'égalité est
  // gratuite. Une fenêtre de trois heures prise au hasard coûtait 1 694 ms par
  // graine et ne couvrait un raid qu'une fois sur douze — mesuré. Ici elle en
  // couvre un sur vingt-cinq graines sur vingt-cinq, pour 3 000 ticks.
  const minuteCourante = minuteDeLHorloge(etat.horloge.nbTicks);
  const prochaine = prochaineMinuteDeRaid(
    etat.graine, basesAttaquantes(etat), minuteCourante, minuteCourante + 1440,
  );
  t.nbAttaquantes = basesAttaquantes(etat).length;
  t.fenetreCouvreUnRaid = prochaine !== null;
  if (prochaine !== null && prochaine > minuteCourante + 1) {
    rattraperJeu(etat, (prochaine - minuteCourante - 1) * TICKS_PAR_MINUTE);
  }
  t.p12_veilleDuRaid = releve(etat);
  const json2 = serialiser(etat, 2_000_000);
  const parRattrapage = charger(json2, 2_000_000);
  const parTicks = charger(json2, 2_000_000);
  const fenetre = 5 * TICKS_PAR_MINUTE;
  rattraperJeu(parRattrapage, fenetre);
  for (let i = 0; i < fenetre; i += 1) tickJeu(parTicks);
  t.p13_apresLeRaid = releve(parRattrapage);
  t.deuxCheminsIdentiques = JSON.stringify(releve(parRattrapage))
    === JSON.stringify(releve(parTicks));

  // --- 9. vingt-quatre heures sous le feu, rasages compris -------------------
  rattraperJeu(etat, 24 * H);
  t.p14_sousLeFeu = releve(etat);

  return t;
}

/** Le scénario joué une fois pour toutes — il coûte trois secondes. */
let TEMOINS = null;
function temoins() {
  if (TEMOINS === null) {
    TEMOINS = {};
    for (const g of GRAINES) TEMOINS[g] = jouerUneGraine(g);
  }
  return TEMOINS;
}

// ---------------------------------------------------------------------------
// T1 — les témoins, reproduits à l'identique
// ---------------------------------------------------------------------------

test('BASES-0 T1 — le scénario mesure quelque chose : quatorze phases toutes distinctes', () => {
  // ⚠ FALSIFIABILITÉ D'ABORD. Un témoin dont toutes les graines rendent la même
  // chose passerait sur n'importe quel code : il faut prouver qu'il DISTINGUE
  // avant de s'en servir comme référence.
  const t = temoins();
  assert.equal(Object.keys(t).length, 25, 'vingt-cinq graines attendues');
  for (const phase of PHASES) {
    const distincts = new Set(GRAINES.map((g) => JSON.stringify(t[g][phase])));
    assert.equal(
      distincts.size, GRAINES.length,
      `phase ${phase} : ${distincts.size} valeurs distinctes sur ${GRAINES.length} graines — `
        + 'un témoin qui ne distingue pas les graines ne garde rien',
    );
  }
  // Et le témoin doit porter les vingt-deux champs annoncés, ni plus ni moins :
  // un champ ajouté à l'état sans être relevé sortirait de la garde en silence.
  assert.deepEqual(Object.keys(t[GRAINES[0]][PHASES[0]]).sort(), [...CHAMPS].sort());
});

test('BASES-0 T1 — empreinte par champ : le dépliage n\'a bougé aucune valeur', () => {
  const t = temoins();
  const ecarts = [];
  for (const phase of PHASES) {
    for (const champ of CHAMPS) {
      // ⚠ `version` EST SUBSTITUÉE, PAS EXEMPTÉE. Le témoin a été capturé en
      // v22 et le lot fait passer à la v23 : on recalcule l'empreinte AVEC 22, et
      // si elle retombe juste, c'est que seul le NOMBRE a bougé — uniformément
      // sur les vingt-cinq graines et les quatorze phases. Sauter le champ
      // retirerait une assertion en silence.
      const valeur = (g) => (champ === 'version' ? VERSION_AU_TEMOIN : t[g][phase][champ]);
      const obtenue = empreinte(GRAINES.map((g) => `${g} ${valeur(g)}`).join(''));
      if (obtenue !== EMPREINTES_PAR_CHAMP[phase][champ]) ecarts.push(`${phase}.${champ}`);
    }
  }
  assert.deepEqual(
    ecarts, [],
    `champ(s) dont la valeur a changé : ${ecarts.join(', ')} — le lot BASES-0 `
      + 'déplie la forme de l\'état, il ne change AUCUN comportement. Un témoin '
      + 'qui tombe se corrige dans le CODE, jamais dans le témoin.',
  );
});

test('BASES-0 T1 — empreinte par graine : aucune graine ne diverge', () => {
  const t = temoins();
  const ecarts = [];
  for (const g of GRAINES) {
    const obtenue = empreinte(
      PHASES.map((p) => CHAMPS.map(
        (c) => (c === 'version' ? VERSION_AU_TEMOIN : t[g][p][c]),
      ).join('')).join(''),
    );
    if (obtenue !== EMPREINTES_PAR_GRAINE[g]) ecarts.push(g);
  }
  assert.deepEqual(ecarts, [], `graine(s) divergente(s) : ${ecarts.join(', ')}`);
});

test('BASES-0 T1 — les scalaires en clair, gestes et raids compris', () => {
  const t = temoins();
  for (const g of GRAINES) {
    const attendu = SCALAIRES[g];
    const x = t[g];
    assert.equal(x.gestes.join(' | '), attendu.gestes, `graine ${g} : gestes de construction`);
    assert.equal(x.gestesArmer.join(' | '), attendu.gestesArmer, `graine ${g} : gestes d'armement`);
    // ⚠ LA SAUVEGARDE GRANDIT D'UN NOMBRE FIXE, ET C'EST TOUT CE QU'ON LUI
    // PERMET. `{"bases":[…],"baseCourante":0}` enveloppe onze champs qui, eux,
    // n'ont pas changé d'un octet : si l'écart dépendait de la partie, c'est que
    // le dépliage aurait modifié un CONTENU.
    assert.equal(
      x.tailleSauvegarde, attendu.tailleSauvegarde + OCTETS_AJOUTES_PAR_LE_DEPLIAGE,
      `graine ${g} : taille de la sauvegarde`,
    );
    assert.equal(x.nbCasesAtteignables, attendu.nbCasesAtteignables, `graine ${g} : cases atteignables`);
    assert.equal(x.deplacement, attendu.deplacement, `graine ${g} : déplacement`);
    assert.equal(x.nbAttaquantes, attendu.nbAttaquantes, `graine ${g} : bases attaquantes`);
    for (const [prefixe, cle] of [['p07_raidProche', 'raidProche'], ['p11_raidOuvrage', 'raidOuvrage']]) {
      const a = attendu[cle];
      assert.equal(x[`${prefixe}NbCibles`], a.nbCibles, `graine ${g} : ${cle} — nombre de cibles`);
      assert.equal(x[`${prefixe}Cible`], a.cible, `graine ${g} : ${cle} — cible choisie`);
      assert.equal(x[`${prefixe}SimuleNeFuitPas`], a.neFuitPas, `graine ${g} : ${cle} — la simulation ne fuit pas`);
      assert.equal(x[`${prefixe}SimuleExact`], a.exact, `graine ${g} : ${cle} — la simulation est exacte`);
      assert.equal(
        empreinte(JSON.stringify(x[`${prefixe}Rapport`])), a.rapport,
        `graine ${g} : ${cle} — le rapport de raid a changé`,
      );
    }
  }
});

test('BASES-0 T1 — la fenêtre couvre bien un raid, et les deux chemins s\'accordent', () => {
  // ⚠ LES DEUX ASSERTIONS VONT ENSEMBLE. Sans la première, la seconde serait
  // vraie pour rien : hors raid, `rattraperJeu` avance d'un bloc analytique et
  // l'égalité est gratuite. C'est la falsification du témoin, écrite dedans.
  const t = temoins();
  for (const g of GRAINES) {
    assert.equal(t[g].fenetreCouvreUnRaid, true, `graine ${g} : aucun raid dans la fenêtre mesurée`);
    assert.equal(t[g].deuxCheminsIdentiques, true, `graine ${g} : tickJeu × n ≠ rattraperJeu(n)`);
    assert.equal(t[g].fenetreCouvreUnRaid, SCALAIRES[g].fenetreCouvreUnRaid);
    assert.equal(t[g].deuxCheminsIdentiques, SCALAIRES[g].deuxCheminsIdentiques);
  }
});

// ---------------------------------------------------------------------------
// T2 — une seule base, et c'est tout le découpage du lot
// ---------------------------------------------------------------------------

test('BASES-0 T2 — `etat.bases` a EXACTEMENT un élément, partout', () => {
  // ⚠⚠ CE LOT NE FONDE PERSONNE. Fonder, basculer, transférer sont `BASES-1` et
  // `TRANSFERT` ; ce qui est livré ici est la FORME. Le test le mesure au bout
  // des chemins qui pourraient en créer une seconde sans le dire.
  const etat = creerEtat(5);
  assert.equal(etat.bases.length, 1);
  assert.equal(etat.baseCourante, 0);

  rattraperJeu(etat, 3 * H);
  assert.equal(etat.bases.length, 1, 'le rattrapage a fondé une base');

  const relu = charger(serialiser(etat, 1_000_000), 1_000_000);
  assert.equal(relu.bases.length, 1, 'l\'aller-retour a fondé une base');
  assert.equal(relu.baseCourante, 0);

  // Et une v0 qui traverse toute la chaîne n'en fonde pas non plus.
  const v0 = migrer({ version: 0 });
  assert.equal(v0.bases.length, 1, 'la chaîne de migrations a fondé une base');
  assert.equal(v0.baseCourante, 0);
});

// ---------------------------------------------------------------------------
// T3 — des DONNÉES SIMPLES : aucun getter, aucun Proxy, aucun defineProperty
// ---------------------------------------------------------------------------

test('BASES-0 T3 — l\'état survit à `structuredClone` : que des données simples', () => {
  // ⚠⚠ C'EST LE PIÈGE CENTRAL DU LOT, ET IL EST MÉCANIQUE. Laisser
  // `etat.disposition` vivre comme un GETTER qui délègue à `etat.bases[…]`
  // aurait fait ce lot en dix lignes — les deux cent cinquante sites auraient
  // continué de marcher. Mais `simulerRaid` fait `structuredClone(etat)`, et
  // `structuredClone` NE PRÉSERVE PAS LES GETTERS : il copie des valeurs. La
  // copie se retrouverait avec des champs plats figés, le simulateur cesserait
  // silencieusement d'être exact, et le test de non-fuite ne verrait rien —
  // l'état réel, lui, resterait intact.
  const etat = creerEtat(9);
  rattraperJeu(etat, 2 * H);

  // La copie et l'original se sérialisent à l'identique, chaîne contre chaîne.
  assert.equal(
    serialiser(structuredClone(etat), 42), serialiser(etat, 42),
    'le clone diverge de l\'original : quelque chose n\'est pas une donnée simple',
  );

  // Et la copie reste MODIFIABLE par le chemin normal, ce qu'un getter perdu
  // rendrait faux : `baseCourante(copie)` doit désigner la base de la COPIE.
  const copie = structuredClone(etat);
  baseCourante(copie).disposition[0].niveau += 1;
  assert.notEqual(
    baseCourante(copie).disposition[0].niveau,
    baseCourante(etat).disposition[0].niveau,
    'écrire dans la copie a touché l\'original',
  );

  // ⚠ ET LA GARDE DE SOURCE, parce que le défaut ne se voit pas au résultat.
  // Un `defineProperty` posé sur l'état passerait les deux assertions ci-dessus
  // tant que personne ne clone : c'est la SOURCE qui doit l'interdire.
  const sim = readFileSync(join(RACINE, 'src', 'sim', 'state.js'), 'utf8')
    .split('\n').filter((l) => !l.trimStart().startsWith('//')
      && !l.trimStart().startsWith('*') && !l.trimStart().startsWith('/*')).join('\n');
  assert.doesNotMatch(sim, /Object\.defineProperty/, '`state.js` pose un accesseur sur l\'état');
  assert.doesNotMatch(sim, /new Proxy\b/, '`state.js` enveloppe l\'état dans un Proxy');
  assert.doesNotMatch(sim, /\bget \w+\s*\(\s*\)\s*\{/, '`state.js` déclare un getter');

  // Falsifiable : les trois motifs doivent attraper leur appât.
  assert.match('Object.defineProperty(etat, "x", {});', /Object\.defineProperty/);
  assert.match('const p = new Proxy(etat, {});', /new Proxy\b/);
  assert.match('  get disposition() {', /\bget \w+\s*\(\s*\)\s*\{/);
});

// ---------------------------------------------------------------------------
// T4 — la ceinture de `simulerRaid` désigne la base de la COPIE
// ---------------------------------------------------------------------------

test('BASES-0 T4 — `simulerRaid` prend la base de la copie, jamais celle de l\'original', () => {
  // ⚠⚠ CETTE GARDE EST STRUCTURELLE, ET IL FAUT SAVOIR POURQUOI. Le
  // comportement, lui, n'est PAS observable : `executerRaid` ne LIT que
  // `baseAttaquante.position`, donc partager la base avec l'original ne fait
  // fuir rien du tout aujourd'hui. Mesuré à la falsification — en remplaçant la
  // ligne par `const base = baseAttaquante;`, AUCUN test ne tombe, celui de
  // non-fuite compris. C'est exactement ce que RAID-0 écrivait en posant la
  // ceinture : « rien ne fuit à cette heure ; mais le jour où elle écrira sur la
  // base attaquante, passer l'original ferait fuir la simulation sur l'état
  // réel ». Une ceinture qu'aucun test ne tient est une ceinture qui partira.
  const source = readFileSync(join(RACINE, 'src', 'sim', 'raid.js'), 'utf8')
    .split('\n').filter((l) => !l.trimStart().startsWith('//')
      && !l.trimStart().startsWith('*') && !l.trimStart().startsWith('/*')).join('\n');
  const debut = source.indexOf('export function simulerRaid');
  assert.ok(debut > 0, '`simulerRaid` a disparu');
  const corps = source.slice(debut, source.indexOf('\n}', debut));
  assert.match(corps, /copie\.bases\[/,
    'la base attaquante ne se retrouve plus dans la COPIE : la simulation peut fuir');
  assert.match(corps, /indexOf\(baseAttaquante\)/,
    'la base ne se retrouve plus par son INDICE — `structuredClone` ne rétablit '
    + 'aucune identité de référence, donc chercher dans la copie rendrait −1');

  // Falsifiable : le motif doit refuser la forme fautive.
  assert.doesNotMatch('  const base = baseAttaquante;', /copie\.bases\[/);

  // Et le comportement qu'on peut, lui, mesurer : la simulation ne touche rien.
  // ⚠ UNE ARMÉE, SINON LE RAID EST REFUSÉ ET LA SIMULATION NE TOUCHE RIEN POUR
  // LA MAUVAISE RAISON — « aucune unité en état de partir ». Un montage qui ne
  // part pas ne mesure pas une fuite.
  const etat = creerEtat(31);
  rattraperJeu(etat, 2 * H);
  for (const [id, vague, colonne] of [['meute', 1, 2], ['perceurs', 1, 4], ['carapace', 2, 3]]) {
    poserEffectif(etat, 'armee', { id, vague, colonne, niveau: 8 });
  }
  const cibles = ciblesAPortee(etat, baseCourante(etat));
  assert.ok(cibles.length > 0, 'le montage ne mesure rien : aucune cible à portée');
  const avant = serialiser(etat, 7_000_000);
  const rapport = simulerRaid(
    etat, baseCourante(etat), { rangee: cibles[0].rangee, colonne: cibles[0].colonne },
  );
  assert.equal(rapport.simule, true, 'le montage ne mesure rien : le raid n\'a pas été simulé');
  assert.ok(rapport.ticks > 0, 'le montage ne mesure rien : aucun combat n\'a eu lieu');
  assert.equal(serialiser(etat, 7_000_000), avant, 'la simulation a écrit dans l\'état réel');
});

// ---------------------------------------------------------------------------
// T5 — l'accesseur lève, et il NOMME
// ---------------------------------------------------------------------------

test('BASES-0 T5 — `baseCourante` lève hors bornes, en nommant l\'indice et le compte', () => {
  const etat = creerEtat(3);
  assert.equal(baseCourante(etat), etat.bases[0]);

  // ⚠ ON ASSERTE LE MESSAGE, PAS SEULEMENT QUE ÇA LÈVE. Sans nom, l'appelant
  // reçoit un `TypeError` sur `undefined.disposition` trois appels plus loin, et
  // le refus ne dit plus rien — c'est la leçon de la garde `fondation` de
  // `charger`, payée le 27/08.
  assert.throws(() => baseCourante({ bases: [{}], baseCourante: 3 }), /indice 3 hors de 0…0/);
  assert.throws(() => baseCourante({ bases: [{}, {}], baseCourante: 5 }), /\(2 bases\)/);
  assert.throws(() => baseCourante({ bases: [{}], baseCourante: -1 }), /indice -1/);
  assert.throws(() => baseCourante({ bases: [{}], baseCourante: 0.5 }), /indice 0\.5/);
  assert.throws(() => baseCourante(null), /état attendu/);
  assert.throws(() => baseCourante({}), /liste `bases`/);

  // Le singulier au singulier : « (1 base) », pas « (1 bases) ».
  assert.throws(() => baseCourante({ bases: [{}], baseCourante: 1 }), /\(1 base\)/);
});

// ---------------------------------------------------------------------------
// T6 — la migration 22 → 23 déplace, et le terrain se REDÉRIVE
// ---------------------------------------------------------------------------

test('BASES-0 T6 — la migration 22 → 23 place les onze champs dans `bases[0]`', () => {
  assert.equal(SAVE_VERSION, 23, 'le bump de la version des sauvegardes a été oublié');

  const etat = creerEtat(1234);
  rattraperJeu(etat, 4 * H);
  const v23 = JSON.parse(serialiser(etat, 5_000_000));

  // Une vraie v22 : à plat, telle qu'elle était avant le dépliage.
  const v22 = aplatirSauvegarde(structuredClone(v23));
  v22.version = 22;
  assert.equal(v22.bases, undefined, 'le montage ne mesure rien : la v22 porte déjà `bases`');

  const migre = migrer(structuredClone(v22));
  assert.equal(migre.version, SAVE_VERSION);
  assert.equal(migre.bases.length, 1);
  assert.equal(migre.baseCourante, 0);

  // ⚠⚠ ET LA MIGRATION NE PRODUIT PAS LE TERRAIN. On interroge `migrer` SEUL,
  // pas `charger` : ce dernier redéduit `champs` et `obstacles` de toute façon,
  // si bien qu'une migration qui les fabriquerait resterait invisible — mesuré
  // à la falsification, aucun test ne tombait. Le terrain n'a jamais eu le droit
  // d'exister dans une sauvegarde, et c'est ici qu'on le dit.
  assert.equal(migre.bases[0].champs, undefined, 'la migration fabrique un terrain');
  assert.equal(migre.bases[0].obstacles, undefined, 'la migration fabrique des obstacles');

  // ⚠ CHAMP PAR CHAMP, ET DANS LES DEUX SENS. Ce qui doit descendre est dans la
  // base ; ce qui doit rester ne doit PAS y être. Une migration qui descend un
  // champ global de trop rendrait `poisAcquis` propre à une base, ce qui est un
  // changement de RÈGLE.
  for (const champ of CHAMPS_DE_BASE) {
    if (champ === 'champs' || champ === 'obstacles') continue;   // jamais sauvegardés
    assert.deepEqual(migre.bases[0][champ], v22[champ], `« ${champ} » n'a pas suivi`);
    assert.equal(migre[champ], undefined, `« ${champ} » est resté à la racine`);
  }
  for (const champ of ['graine', 'rng', 'horloge', 'tutoriel', 'recherche',
    'sitesEntames', 'basesRasees', 'poisAcquis', 'rapports', 'attaque']) {
    assert.deepEqual(migre[champ], v22[champ], `« ${champ} » a bougé alors qu'il est GLOBAL`);
    assert.equal(migre.bases[0][champ], undefined, `« ${champ} » est descendu dans la base`);
  }
});

test('BASES-0 T6 bis — `champs` et `obstacles` REDÉRIVÉS sont identiques aux anciens', () => {
  // ⚠⚠ SI CE TEST TOMBE, C'EST UN POINT D'ARRÊT, PAS UN BOGUE DE MIGRATION : il
  // voudrait dire que le terrain n'est pas gelé comme trois documents
  // l'affirment. La migration ne recopie donc RIEN — elle laisse `charger`
  // redéduire, exactement comme il le fait depuis le lot FONDATION-GELÉE.
  const etat = creerEtat(777);
  const avantChamps = structuredClone(baseCourante(etat).champs);
  const avantObstacles = structuredClone(baseCourante(etat).obstacles);

  const v22 = aplatirSauvegarde(JSON.parse(serialiser(etat, 6_000_000)));
  v22.version = 22;
  assert.equal(v22.champs, undefined, 'le terrain ne doit jamais entrer dans la sauvegarde');
  assert.equal(v22.obstacles, undefined);

  const relu = charger(JSON.stringify(v22), 6_000_000);
  assert.deepEqual(baseCourante(relu).champs, avantChamps, 'le terrain a changé au dépliage');
  assert.deepEqual(baseCourante(relu).obstacles, avantObstacles);

  // Et c'est bien la FONDATION qui les rend, pas la position courante.
  const { rangee, colonne } = baseCourante(relu).fondation;
  assert.deepEqual(baseCourante(relu).champs, champsDeLaBase(rangee, colonne));
  assert.deepEqual(baseCourante(relu).obstacles, obstaclesDeLaBase(rangee, colonne));
});

// ---------------------------------------------------------------------------
// T7 — la bascule de l'interface reste MORTE
// ---------------------------------------------------------------------------

test('BASES-0 T7 — les flèches de bascule entre bases restent désactivées', () => {
  // ⚠⚠ CE JOUR N'EST PAS CELUI-CI. L'état porte une LISTE, d'un seul élément :
  // rendre les flèches vives promettrait une bascule qui n'existe pas, ce qui
  // est la faute exacte du bouton « Assaut » du lot ÉCRAN-CHANTIER. Elles
  // s'ouvriront à `BASES-1`, avec ce qu'il faut derrière.
  const ecran = readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8')
    .split('\n').filter((l) => !l.trimStart().startsWith('//')).join('\n');
  assert.match(ecran, /navigation-precedente'\)\.disabled = true/);
  assert.match(ecran, /navigation-suivante'\)\.disabled = true/);

  // Et le libellé dit toujours « 1 / 1 » — il ne lit pas `etat.bases.length`,
  // qui vaudrait 1 aujourd'hui et mentirait le jour de la seconde base sans que
  // les flèches suivent.
  const vue = navigationEntreBases(creerEtat(3));
  assert.equal(vue.libelle, 'Base 1 / 1');
  assert.equal(vue.precedente, false);
  assert.equal(vue.suivante, false);
});

// ---------------------------------------------------------------------------
// T8 — plus un seul champ par-base ne se lit à la racine de l'état
// ---------------------------------------------------------------------------

test('BASES-0 T8 — aucun `etat.<champ par base>` ne subsiste dans `src/`', () => {
  // ⚠⚠ C'EST LA GARDE DE COMPLÉTUDE DU DÉPLIAGE, et elle vaut plus que le
  // compte : deux cent cinquante sites réécrits à la main, il suffit d'un oubli
  // pour qu'un champ lu à la racine rende `undefined` — silencieusement, sur un
  // chemin qu'aucun test ne traverse. Elle balaie la SOURCE, commentaires ôtés.
  const motif = new RegExp(
    `\\betat\\.(${CHAMPS_DE_BASE.join('|')})\\b`,
  );
  const fautifs = [];
  for (const dossier of ['sim', 'render', 'ui']) {
    const base = join(RACINE, 'src', dossier);
    for (const nom of readdirSync(base).filter((n) => n.endsWith('.js'))) {
      // ⚠ `sim/combat.js` EST EXCLU, ET C'EST NOMMÉ. Son `etat` est l'état d'un
      // COMBAT, pas celui du jeu : `etat.obstacles` y désigne les rochers du
      // champ de bataille, et `etat.entites` n'existe nulle part ailleurs. Le
      // confondre avec l'état de jeu serait la faute que ce test cherche.
      if (dossier === 'sim' && nom === 'combat.js') continue;
      if (dossier === 'render' && nom === 'scene.js') continue;   // idem : état de combat
      const source = readFileSync(join(base, nom), 'utf8')
        .split('\n')
        .filter((l) => !l.trimStart().startsWith('//') && !l.trimStart().startsWith('*')
          && !l.trimStart().startsWith('/*'))
        .join('\n');
      if (motif.test(source)) fautifs.push(`src/${dossier}/${nom}`);
    }
  }
  assert.deepEqual(
    fautifs, [],
    `fichier(s) lisant encore un champ par-base à la racine : ${fautifs.join(', ')}`,
  );

  // Falsifiable : le motif doit attraper l'appât, et laisser passer le bon chemin.
  assert.match('const d = etat.disposition;', motif);
  assert.doesNotMatch('const d = baseCourante(etat).disposition;', motif);
});
