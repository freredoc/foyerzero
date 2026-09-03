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
  basculerVersLaBase,
} from '../src/sim/state.js';
import { executerRaid, simulerRaid } from '../src/sim/raid.js';
import { ciblesAPortee, siteDeLaCase } from '../src/sim/site-de-la-case.js';
import {
  deplacerLaBase, casesAtteignables, poserLaBaseSur,
} from '../src/sim/deplacement.js';
import {
  basesAttaquantes, prochaineMinuteDeRaid, minuteDeLHorloge, TICKS_PAR_MINUTE,
  subirUnRaid,
} from '../src/sim/raid-ouvrage.js';
import { satellitesPresents } from '../src/sim/satellites.js';
import { champsDeLaBase, obstaclesDeLaBase } from '../src/sim/champs.js';
import { navigationEntreBases } from '../src/ui/chantier.js';
import { sitesDeLaFenetre } from '../src/ui/monde.js';
import {
  fonderUneBase, problemesDeLaFondation, butinDeLaFondation, PORTEE_CARREE,
} from '../src/sim/fondation.js';
import {
  coutDeLaBaseSuivanteMilli, acheterUneBaseDePlus, problemesDeLAchatDUneBase,
  rangDeLaBaseSuivante,
} from '../src/sim/recherche.js';
import { SPECIAL, NOEUD_BASE_SUPPLEMENTAIRE } from '../src/data/recherche.js';
import { territoireDeLaFenetre, occupantDeLaCase, OUVRAGE, JOUEUR } from '../src/sim/territoire.js';
import { coutDUnRaid, distanceCarreeCases } from '../src/sim/points-attaque.js';
import { estBaseOuvrage } from '../src/sim/peuplement.js';
import { poiDeLaCase } from '../src/sim/poi.js';
import { GEOGRAPHIE, FONDATION, POINTS_ATTAQUE } from '../src/data/sites.js';
import { retirerLeSite } from '../src/sim/site-entame.js';
import { plafondDeLaReserveDeLaBase } from '../src/sim/reparation.js';
import { capacitesMilli } from '../src/sim/economie-base.js';
import { etatDesMissions, avancement } from '../src/sim/missions.js';
import { CHAINE_TUTORIEL } from '../src/data/missions.js';
import { aplatirSauvegarde } from './aplatir-sauvegarde.js';
import {
  GRAINES, PHASES, CHAMPS, CHAMPS_AJOUTES_PAR_BASES_1, EMPREINTES_PAR_CHAMP, SCALAIRES,
  VERSION_AU_TEMOIN, OCTETS_AJOUTES_PAR_LE_DEPLIAGE, OCTETS_AJOUTES_PAR_BASES_1,
  DEPLACES_PAR_BASES_1, EMPREINTES_DES_CHAMPS_AJOUTES,
  EMPREINTES_PAR_GRAINE_BASES_1,
  DEPLACES_PAR_TRANSFERT, OCTETS_AJOUTES_PAR_TRANSFERT,
  RAPPORTS_TRANSFERT,
  CLES_DU_RAPPORT_AVANT_TRANSFERT,
  DEPLACES_PAR_RETOURS_DU_03, EMPREINTES_PAR_GRAINE_RETOURS_DU_03,
  SCALAIRES_RETOURS_DU_03,
} from './temoins-bases-0.js';

/** Les vingt-trois champs relevés : les vingt-deux d'origine, plus celui de BASES-1. */
const TOUS_LES_CHAMPS = [...CHAMPS, ...CHAMPS_AJOUTES_PAR_BASES_1];

/**
 * L'empreinte attendue d'un couple (phase, champ).
 *
 * ⚠⚠ CELLE DE LA CAPTURE D'ORIGINE, SAUF POUR LES COUPLES QUE BASES-1 A
 * LÉGITIMEMENT DÉPLACÉS OU AJOUTÉS. Le témoin ne se rafraîchit pas en bloc : un
 * lot qui change un comportement NOMME ce qui bouge, et laisse tout le reste
 * gardé contre la référence d'avant.
 *
 * ⚠⚠ TRENTE-SEPT COUPLES DE PLUS AU LOT RETOURS-DU-03, tous à partir de la
 * phase 10 : deux des trois retours d'Ethan changent la CARTE de chaque graine —
 * l'octogone des territoires et la densité du peuplement. Les neuf premières
 * phases, le premier raid compris, sont identiques au bit.
 *
 * ⚠ QUINZE COUPLES DE PLUS AU LOT TRANSFERT — `rapports` et `economie` à partir
 * de la phase 7, qui est le premier raid : le rapport a perdu `butinPerdu`, et
 * le butin ne se plafonne plus. Les surcharges s'EMPILENT, de la plus récente à
 * la plus ancienne : un couple que RETOURS-DU-03 n'a pas nommé reste gardé
 * contre TRANSFERT, puis contre BASES-1, et à défaut contre la capture
 * d'origine.
 *
 * ⚠ SEPT COUPLES DÉPLACÉS PAR BASES-1 — `attaque` et `rapports` à partir de la phase 11,
 * parce que le prix d'un raid a monté quand la zone d'influence est passée du
 * carré au disque. QUATORZE AJOUTÉS, tous sur le champ neuf. Les 301 autres
 * n'ont pas le droit de bouger — `satellites` COMPRIS, dont la clé a pourtant
 * déménagé : le relevé la recompose, donc son empreinte d'origine doit tenir.
 */
function empreinteAttendue(phase, champ) {
  return DEPLACES_PAR_RETOURS_DU_03[phase]?.[champ]
    ?? DEPLACES_PAR_TRANSFERT[phase]?.[champ]
    ?? EMPREINTES_DES_CHAMPS_AJOUTES[phase]?.[champ]
    ?? DEPLACES_PAR_BASES_1[phase]?.[champ]
    ?? EMPREINTES_PAR_CHAMP[phase][champ];
}

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
    // ⚠⚠ `basesAutorisees` EST RETIRÉ DU RELEVÉ DE `recherche` ET GARDÉ À PART,
    // pour la même raison que le compteur de satellites : c'est une clé NEUVE,
    // et la laisser dedans ferait bouger les quatorze empreintes d'origine, si
    // bien qu'un point de recherche qui aurait changé de valeur se cacherait
    // derrière l'ajout. Recomposé sans elle, `recherche` doit retomber JUSTE.
    recherche: JSON.stringify(
      Object.fromEntries(
        Object.entries(etat.recherche).filter(([c]) => c !== 'basesAutorisees'),
      ),
    ),
    sitesEntames: JSON.stringify(etat.sitesEntames),
    basesRasees: JSON.stringify(etat.basesRasees),
    poisAcquis: JSON.stringify(etat.poisAcquis),
    // ⚠ CHAMP AJOUTÉ AU RELEVÉ PAR BASES-1 : le compteur d'instance des
    // satellites a quitté la base pour l'état, parce qu'une seconde base qui
    // repartirait de l'instance 1 rejouerait les graines d'apparition de la
    // première. Le relever est ce qui fera tomber le témoin le jour où le
    // compteur reculera ; ne pas le relever l'aurait laissé sortir de la garde.
    prochaineInstanceSatellite: etat.prochaineInstanceSatellite,
    // ⚠ SECOND CHAMP AJOUTÉ PAR BASES-1 : le droit de fonder. Le relever est ce
    // qui fera tomber le témoin si un lot futur en distribuait sans le dire.
    basesAutorisees: etat.recherche.basesAutorisees,
    // ⚠ TROISIÈME CHAMP AJOUTÉ PAR BASES-1 : ce que le joueur a rasé. C'est le
    // seul endroit qui le retienne — un camp détruit ne laisse aucune autre
    // trace —, donc un lot qui le remettrait à zéro effacerait une mission du
    // tutoriel sans que rien d'autre ne bronche.
    satellitesDetruits: JSON.stringify(etat.satellitesDetruits),
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
    // ⚠⚠ LE COMPTEUR EST RÉINSÉRÉ À SA PLACE D'AVANT, IL N'EST PAS EXEMPTÉ.
    // C'est la substitution de `version` appliquée à une clé qui a DÉMÉNAGÉ :
    // on recompose la forme d'avant BASES-1 — `prochaineInstance` en dernier,
    // comme la rendait `satellitesVides()` — et on exige que les quatorze
    // empreintes d'origine retombent JUSTES. Si elles retombent, c'est qu'aucun
    // TIRAGE n'a bougé : ni une case d'apparition, ni une échéance, ni un
    // niveau. Surcharger les quatorze empreintes à la place aurait rendu le
    // déménagement indiscernable d'un satellite qui se serait posé ailleurs.
    satellites: JSON.stringify({
      ...b.satellites, prochaineInstance: etat.prochaineInstanceSatellite,
    }),
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
  assert.deepEqual(Object.keys(t[GRAINES[0]][PHASES[0]]).sort(), [...TOUS_LES_CHAMPS].sort());
});

test('BASES-0 T1 — empreinte par champ : le dépliage n\'a bougé aucune valeur', () => {
  const t = temoins();
  const ecarts = [];
  for (const phase of PHASES) {
    for (const champ of TOUS_LES_CHAMPS) {
      // ⚠ `version` EST SUBSTITUÉE, PAS EXEMPTÉE. Le témoin a été capturé en
      // v22 et le lot fait passer à la v23 : on recalcule l'empreinte AVEC 22, et
      // si elle retombe juste, c'est que seul le NOMBRE a bougé — uniformément
      // sur les vingt-cinq graines et les quatorze phases. Sauter le champ
      // retirerait une assertion en silence.
      const valeur = (g) => (champ === 'version' ? VERSION_AU_TEMOIN : t[g][phase][champ]);
      const obtenue = empreinte(GRAINES.map((g) => `${g} ${valeur(g)}`).join(''));
      if (obtenue !== empreinteAttendue(phase, champ)) ecarts.push(`${phase}.${champ}`);
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
      PHASES.map((p) => TOUS_LES_CHAMPS.map(
        (c) => (c === 'version' ? VERSION_AU_TEMOIN : t[g][p][c]),
      ).join('')).join(''),
    );
    if (obtenue !== EMPREINTES_PAR_GRAINE_RETOURS_DU_03[g]) ecarts.push(g);
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
      x.tailleSauvegarde,
      attendu.tailleSauvegarde + OCTETS_AJOUTES_PAR_LE_DEPLIAGE + OCTETS_AJOUTES_PAR_BASES_1
        + OCTETS_AJOUTES_PAR_TRANSFERT,
      `graine ${g} : taille de la sauvegarde`,
    );
    assert.equal(x.nbCasesAtteignables, attendu.nbCasesAtteignables, `graine ${g} : cases atteignables`);
    assert.equal(x.deplacement, attendu.deplacement, `graine ${g} : déplacement`);
    // ⚠⚠ QUATRE SCALAIRES SONT SURCHARGÉS PAR RETOURS-DU-03, ET LES AUTRES NON.
    // Une carte plus dense met plus de bases à portée : `nbAttaquantes` et le
    // nombre de cibles du raid lointain bougent sur les vingt-cinq graines. Les
    // gestes, la sauvegarde, les cases atteignables, le déplacement et TOUT le
    // raid de proximité restent gardés contre la capture d'origine — c'est cette
    // moitié-là qui prouve que le lot ne touche ni l'économie ni la pose.
    const surcharge = SCALAIRES_RETOURS_DU_03[g];
    assert.equal(x.nbAttaquantes, surcharge.nbAttaquantes, `graine ${g} : bases attaquantes`);
    for (const [prefixe, cle] of [['p07_raidProche', 'raidProche'], ['p11_raidOuvrage', 'raidOuvrage']]) {
      const a = cle === 'raidOuvrage'
        ? {
          ...attendu[cle],
          nbCibles: surcharge.raidOuvrageNbCibles,
          cible: surcharge.raidOuvrageCible,
        }
        : attendu[cle];
      assert.equal(x[`${prefixe}NbCibles`], a.nbCibles, `graine ${g} : ${cle} — nombre de cibles`);
      assert.equal(x[`${prefixe}Cible`], a.cible, `graine ${g} : ${cle} — cible choisie`);
      assert.equal(x[`${prefixe}SimuleNeFuitPas`], a.neFuitPas, `graine ${g} : ${cle} — la simulation ne fuit pas`);
      assert.equal(x[`${prefixe}SimuleExact`], a.exact, `graine ${g} : ${cle} — la simulation est exacte`);
      // ⚠⚠ LES CINQUANTE EMPREINTES DE RAPPORT ONT BOUGÉ AU LOT TRANSFERT, et
      // c'est pour ça qu'elles ne portent plus la preuve à elles seules : un
      // rapport qui perd une clé change d'empreinte quoi qu'il arrive. Ce qui
      // PROUVE, c'est l'assertion structurelle ci-dessous — la seule clé partie
      // est `butinPerdu`. Les empreintes, elles, gardent l'AVENIR.
      //
      // ⚠ ELLES REMPLACENT `RAPPORTS_DEPLACES_PAR_BASES_1`, qui ne nommait que
      // trois graines : les vingt-deux autres étaient gardées contre la capture
      // d'origine, ce qui n'est plus possible.
      // ⚠ LE RAPPORT DU RAID LOINTAIN CHANGE SUR NEUF GRAINES — la cible n'est
      // plus la même sur six d'entre elles, et le prix a bougé sur les autres.
      // Celui du raid de PROXIMITÉ, lui, reste gardé contre TRANSFERT : un camp
      // est de l'histoire, pas du tirage de carte.
      const attenduRapport = cle === 'raidOuvrage'
        ? surcharge.raidOuvrageRapport
        : RAPPORTS_TRANSFERT[g][`${cle}Rapport`];
      assert.equal(
        empreinte(JSON.stringify(x[`${prefixe}Rapport`])), attenduRapport,
        `graine ${g} : ${cle} — le rapport de raid a changé`,
      );
      // ⚠⚠ ET VOICI LA PREUVE, STRUCTURELLE PLUTÔT QUE PAR EMPREINTE : le
      // rapport porte EXACTEMENT les clés d'avant, moins `butinPerdu`. Une
      // seconde clé retirée — ou ajoutée — fait tomber ce test en la NOMMANT,
      // là où une empreinte dirait seulement « ça a bougé ».
      const clesAttendues = CLES_DU_RAPPORT_AVANT_TRANSFERT.filter((k) => k !== 'butinPerdu');
      assert.deepEqual(
        Object.keys(x[`${prefixe}Rapport`]).sort(), [...clesAttendues].sort(),
        `graine ${g} : ${cle} — le rapport a gagné ou perdu une clé autre que butinPerdu`,
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
  // ⚠ LE NUMÉRO N'EST PLUS GARDÉ ICI, ET IL N'A PAS ÉTÉ RETIRÉ — il a DÉMÉNAGÉ.
  // La règle du dépôt, écrite dans `points-attaque.test.js` depuis le lot
  // SITE-ENTAMÉ : « la garde du numéro appartient au maillon le plus RÉCENT de
  // la chaîne, une seule fois ». Ce maillon-ci est le 22 → 23 ; le plus récent
  // est le 23 → 24, et c'est « BASES-1 T14 » qui porte le `SAVE_VERSION === 24`.
  // Ce test-ci vérifie donc que SON maillon est encore là, ce qui est ce qu'il
  // mesure vraiment.
  // Le maillon lui-même est gardé par ce qui suit : une v22 qui ne serait plus
  // migrée n'aurait ni `bases`, ni `baseCourante`, et les assertions tomberaient.
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
// T7 — la bascule de l'interface est VIVE (elle était morte à BASES-0)
// ---------------------------------------------------------------------------

test('BASES-1 T7 — les flèches de bascule sont vives dès la seconde base', () => {
  // ⚠⚠ CE TEST DISAIT L'INVERSE À BASES-0, et il annonçait ce jour : « elles
  // s'ouvriront à BASES-1, avec ce qu'il faut derrière ». Ce qu'il faut derrière
  // est là — `fonderUneBase`, `basculerVersLaBase` —, donc la garde est
  // RETOURNÉE et non retirée : elle exige maintenant que l'écran LISE la vue au
  // lieu de désarmer en dur.
  const ecran = readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8')
    .split('\n').filter((l) => !l.trimStart().startsWith('//')).join('\n');
  assert.doesNotMatch(ecran, /navigation-precedente'\)\.disabled = true/);
  assert.match(ecran, /navigation-precedente'\)\.disabled = !navigation\.precedente/);
  assert.match(ecran, /navigation-suivante'\)\.disabled = !navigation\.suivante/);

  // Une seule base : les flèches restent mortes. Sans cette moitié, un code qui
  // les rendrait TOUJOURS vives passerait.
  const seule = navigationEntreBases(creerEtat(3));
  assert.equal(seule.libelle, 'Base 1 / 1');
  assert.equal(seule.precedente, false);

  const etat = creerEtat(3);
  etat.recherche.basesAutorisees = 2;
  fonderUneBase(etat, { rangee: 293, colonne: 16 });
  assert.equal(navigationEntreBases(etat).libelle, 'Base 2 / 2');
  assert.equal(navigationEntreBases(etat).precedente, true);
  basculerVersLaBase(etat, 0);
  assert.equal(navigationEntreBases(etat).libelle, 'Base 1 / 2');
  assert.throws(() => basculerVersLaBase(etat, 2), /hors de 0…1/);
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

// ===========================================================================
// BASES-1 — fonder, basculer, haloter
// ===========================================================================

/** Une partie posée en pays peuplé, avec le droit de fonder une base de plus. */
function partieAvecDroit(graine = 3, rangee = 285) {
  const etat = creerEtat(graine);
  poserLaBaseSur(etat, rangee, 16);
  etat.recherche.basesAutorisees = 2;
  return etat;
}

/**
 * Une case où la fondation est PERMISE, demandée au moteur.
 *
 * ⚠⚠ ELLE ÉTAIT ÉCRITE EN DUR — `{ rangee: 283, colonne: 22 }` — DANS DEUX
 * MONTAGES, ET LES DEUX SONT TOMBÉS LE 03/09. Le lot qui a densifié le
 * peuplement et élargi les territoires a mis une base de l'Ouvrage à portée de
 * cette case-là ; les deux tests ont alors échoué sur « fondation impossible »,
 * c'est-à-dire pour une raison qui ne les regardait pas. **Un montage qui écrit
 * une coordonnée ne garde que lui-même** — c'est écrit dans CLAUDE.md depuis le
 * 31/08, et c'est la troisième fois que le dépôt le paye.
 *
 * ⚠ ELLE LÈVE PLUTÔT QUE DE RENDRE `null`. Un test qui continuerait sans base à
 * fonder mesurerait une partie à une seule base et passerait au vert sans rien
 * garder.
 */
function caseFondable(etat, rayon = 10) {
  const centre = baseCourante(etat).position;
  for (let dr = -rayon; dr <= rayon; dr += 1) {
    for (let dc = -rayon; dc <= rayon; dc += 1) {
      const cible = { rangee: centre.rangee + dr, colonne: centre.colonne + dc };
      if (problemesDeLaFondation(etat, cible).length === 0) return cible;
    }
  }
  throw new Error('montage : aucune case fondable autour de la base');
}

// ---------------------------------------------------------------------------
// T1 — le territoire est ROND
// ---------------------------------------------------------------------------

test('BASES-1 T1 — le territoire est un OCTOGONE, ni carré ni disque', () => {
  // ⚠⚠ LA FORME A CHANGÉ DEUX FOIS DEPUIS QUE CE TEST EXISTE, ET IL A SUIVI LES
  // DEUX. EUCLIDE avait manqué `territoire.js` — `peindre` remplissait un carré
  // de (2r+1)² cases sans le moindre test de distance ; BASES-1 l'a passé au
  // disque ; Ethan, le 03/09 : « le territoire doit avoir 8 cases de plus, dans
  // les angles ». Ce n'est pas cosmétique — le territoire allié est ce qui rend
  // un raid moins cher, donc la carte peinte et le prix affiché doivent décrire
  // la même géométrie.
  //
  // ⚠ ON COMPTE LES CASES, ON N'EN REGARDE PAS UNE. Rayon 2 : 25 au carré, 13 au
  // disque, **21** à l'octogone. Rayon 3 : 49, 29, **37**. Le compte est ce que
  // le lot change, et il ne peut pas passer par hasard.
  const etat = creerEtat(3);
  const chezMoi = baseCourante(etat).position;
  const compter = (centre, rayon, camp) => {
    const carte = territoireDeLaFenetre(etat, {
      premiereRangee: centre.rangee - rayon - 1,
      derniereRangee: centre.rangee + rayon + 1,
      premiereColonne: centre.colonne - rayon - 1,
      derniereColonne: centre.colonne + rayon + 1,
    });
    let n = 0;
    for (let r = centre.rangee - rayon; r <= centre.rangee + rayon; r += 1) {
      for (let c = centre.colonne - rayon; c <= centre.colonne + rayon; c += 1) {
        if (occupantDeLaCase(carte, r, c) === camp) n += 1;
      }
    }
    return n;
  };

  // ⚠ AU DÉPART, LE JOUEUR EST SEUL : la garde du peuplement tient les bases de
  // l'Ouvrage à quinze cases, donc rien d'autre ne peint dans cette fenêtre.
  assert.equal(GEOGRAPHIE.rayonInfluenceJoueur, 2);
  assert.equal(compter(chezMoi, 2, JOUEUR), 21,
    'le territoire du joueur ne compte plus 21 cases : la forme a changé');
  // La ligne droite à 2 est dedans, l'épaule (2, 1) aussi depuis le rognage, et
  // le coin (2, 2) est dehors — c'est la case qu'Ethan fait rogner.
  const carte = territoireDeLaFenetre(etat, {
    premiereRangee: chezMoi.rangee - 3,
    derniereRangee: chezMoi.rangee + 3,
    premiereColonne: chezMoi.colonne - 3,
    derniereColonne: chezMoi.colonne + 3,
  });
  assert.equal(occupantDeLaCase(carte, chezMoi.rangee - 2, chezMoi.colonne), JOUEUR);
  assert.equal(occupantDeLaCase(carte, chezMoi.rangee - 2, chezMoi.colonne - 1), JOUEUR);
  assert.equal(occupantDeLaCase(carte, chezMoi.rangee - 2, chezMoi.colonne - 2), NEUTRE);

  // ⚠⚠ ET POUR L'OUVRAGE, ON COMPARE CASE PAR CASE À LA RÈGLE. Compter autour
  // d'UNE base était impossible : la carte est trop dense — mesuré, sur 596
  // bases de la graine 3, AUCUNE n'a ses deux diagonales à (3, 3) libres de
  // toute autre — et `basesDeLaFenetre` ignore `basesRasees`, donc on ne peut
  // pas non plus faire le vide. On mesure alors l'équivalence exacte : une case
  // est ennemie SI ET SEULEMENT SI une base de l'Ouvrage est dans son octogone.
  // C'est plus fort qu'un compte, et insensible aux recouvrements.
  const R = GEOGRAPHIE.rayonInfluenceEnnemie;
  assert.equal(R, 3);
  // ⚠⚠ LA FENÊTRE A ÉTÉ CHOISIE PAR MESURE, PAS PAR COMMODITÉ, ET ELLE DESCEND
  // JUSQU'AU BORD DE LA GARDE. Sur une fenêtre uniquement dense — rangées 120 à
  // 150 —, les trois formes peignent EXACTEMENT la même chose : quand les bases
  // sont à 28 par 12 × 12, une case qui n'a aucune base dans son octogone n'en a
  // jamais une dans un coin rogné. Les seules cases qui distinguent les formes
  // sont contre la GARDE, vers les rangées 283–285, là où le semis s'arrête net :
  // mesuré, une dizaine par graine dans chaque sens. La fenêtre les contient —
  // sans elles, les deux gardes ci-dessous passeraient au vert sans rien mesurer.
  const fenetre = {
    premiereRangee: 120, derniereRangee: 300, premiereColonne: 1, derniereColonne: 31,
  };
  const zone = territoireDeLaFenetre(etat, fenetre);
  // ⚠ LES TROIS FORMES SONT ÉCRITES ICI, PAS IMPORTÉES. Appeler
  // `dansLOctogoneDInfluence` rendrait le test tautologique — il passerait sur
  // n'importe quelle forme du moment que le code et lui s'accordent.
  const dedans = {
    carre: () => true,
    disque: (dr, dc) => dr * dr + dc * dc <= R * R,
    octogone: (dr, dc) => Math.abs(dr) + Math.abs(dc) <= R + 1,
  };
  const aPortee = (r, c, forme) => {
    for (let dr = -R; dr <= R; dr += 1) {
      for (let dc = -R; dc <= R; dc += 1) {
        if (!dedans[forme](dr, dc)) continue;
        if (estBaseOuvrage(etat.graine, r + dr, c + dc)) return true;
      }
    }
    return false;
  };
  let ecartsOctogone = 0;
  let contreLeCarre = 0;
  let contreLeDisque = 0;
  for (let r = fenetre.premiereRangee; r <= fenetre.derniereRangee; r += 1) {
    for (let c = fenetre.premiereColonne; c <= fenetre.derniereColonne; c += 1) {
      const peint = occupantDeLaCase(zone, r, c) === OUVRAGE;
      const octogone = aPortee(r, c, 'octogone');
      if (peint !== octogone) ecartsOctogone += 1;
      if (octogone !== aPortee(r, c, 'carre')) contreLeCarre += 1;
      if (octogone !== aPortee(r, c, 'disque')) contreLeDisque += 1;
    }
  }
  // ⚠⚠ LE MONTAGE MESURE QUELQUE CHOSE, ET DANS LES DEUX SENS. L'octogone doit
  // se distinguer du carré ET du disque sur cette fenêtre-ci ; sans ces deux
  // lignes, une fenêtre où les trois coïncideraient rendrait le test vert sur
  // l'un ou l'autre des deux codes précédents.
  assert.ok(contreLeCarre > 0,
    'octogone et carré coïncident sur cette fenêtre : le montage ne mesure rien');
  assert.ok(contreLeDisque > 0,
    'octogone et disque coïncident sur cette fenêtre : le montage ne mesure rien');
  assert.equal(ecartsOctogone, 0,
    `${ecartsOctogone} case(s) peintes hors de l'octogone : la forme n'est pas la bonne`);
});

/** Le neutre de `occupantDeLaCase` — hors de tout territoire. */
const NEUTRE = 0;

/**
 * Une base de l'Ouvrage dont on a RASÉ toutes les voisines à sept cases.
 *
 * ⚠ ON RASE PAR LE MÉCANISME DU JEU. `basesRasees` est exactement ce qui fait
 * qu'une base dérivée de la graine cesse d'exister — `siteDeLaCase` la lit, et
 * `territoire.js` passe par lui. Écrire un faux peuplement à la place aurait
 * mesuré le montage plutôt que le code.
 */
function basePeinteSeule(etat) {
  let choisie = null;
  for (let r = 40; r <= 260 && choisie === null; r += 1) {
    for (let c = 8; c <= 24; c += 1) {
      if (estBaseOuvrage(etat.graine, r, c)) { choisie = { rangee: r, colonne: c }; break; }
    }
  }
  assert.ok(choisie !== null, 'aucune base de l\'Ouvrage au milieu de la carte');
  for (let dr = -7; dr <= 7; dr += 1) {
    for (let dc = -7; dc <= 7; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const r = choisie.rangee + dr; const c = choisie.colonne + dc;
      if (estBaseOuvrage(etat.graine, r, c)) etat.basesRasees.push(`${r}:${c}`);
    }
  }
  return choisie;
}

// ---------------------------------------------------------------------------
// T2 — le prix d'un raid suit, et SEULEMENT en conséquence
// ---------------------------------------------------------------------------

test('BASES-1 T2 — le prix d\'un raid ne change QUE dans les angles', () => {
  // ⚠⚠ CE QUI EST MESURÉ : le barème n'a pas bougé d'un point, ni à BASES-1 ni
  // au rognage du 03/09. Ce qui bouge à chaque fois, c'est l'ensemble des cases
  // ALLIÉES — donc seuls les raids dont la cible est dans un angle changent de
  // tarif, et ils changent de la différence entre les deux, jamais d'autre chose.
  // BASES-1 les faisait renchérir (le disque retire les coins) ; l'octogone en
  // rend huit par base au tarif de proximité.
  const etat = creerEtat(3);
  poserLaBaseSur(etat, 200, 16);
  const base = baseCourante(etat);
  const cibles = ciblesAPortee(etat, base);
  assert.ok(cibles.length > 5, 'le montage ne mesure rien : trop peu de cibles');

  for (const c of cibles) {
    const dr = base.position.rangee - c.rangee;
    const dc = base.position.colonne - c.colonne;
    const distance = Math.max(Math.abs(dr), Math.abs(dc));
    // ⚠ LA FORME EST RÉÉCRITE ICI, PAS IMPORTÉE — Tchebychev ET Manhattan, en
    // toutes lettres. Appeler `dansLOctogoneDInfluence` rendrait le test
    // tautologique : il passerait sur n'importe quelle zone.
    const chezMoi = distance <= GEOGRAPHIE.rayonInfluenceJoueur
      && Math.abs(dr) + Math.abs(dc) <= GEOGRAPHIE.rayonInfluenceJoueur + 1;
    const { fixe, parCaseAllie, parCaseEnnemiOuNeutre } = POINTS_ATTAQUE.coutRaid;
    const attendu = fixe + distance * (chezMoi ? parCaseAllie : parCaseEnnemiOuNeutre);
    assert.equal(coutDUnRaid(etat, base, c), attendu,
      `prix faux pour (${c.rangee}, ${c.colonne})`);
  }

  // ⚠ ET LA DISTANCE RESTE CELLE DE LA GRILLE — arbitrage d'EUCLIDE, intact. La
  // PORTÉE est euclidienne, le PRIX se compte en cases de grille : une cible en
  // diagonale à (7, 7) coûte le tarif de SEPT cases, pas de dix.
  const loin = cibles.find((c) => Math.abs(base.position.rangee - c.rangee) > 3
    && Math.abs(base.position.colonne - c.colonne) > 3);
  if (loin !== undefined) {
    const d = Math.max(Math.abs(base.position.rangee - loin.rangee),
      Math.abs(base.position.colonne - loin.colonne));
    const euclide = Math.ceil(Math.hypot(base.position.rangee - loin.rangee,
      base.position.colonne - loin.colonne));
    assert.ok(euclide > d, 'le montage ne distingue pas les deux distances');
    assert.equal(coutDUnRaid(etat, base, loin),
      POINTS_ATTAQUE.coutRaid.fixe + d * POINTS_ATTAQUE.coutRaid.parCaseEnnemiOuNeutre);
  }
});

// ---------------------------------------------------------------------------
// T3 — le prix des rangs, en entiers
// ---------------------------------------------------------------------------

test('BASES-1 T3 — 2 M, 5 M, 12,5 M, et EXACT au rang 10', () => {
  const etat = creerEtat(3);
  const prixDuRang = (rang) => {
    etat.recherche.basesAutorisees = rang - 1;
    return coutDeLaBaseSuivanteMilli(etat);
  };
  assert.equal(rangDeLaBaseSuivante(etat), 2, 'une partie neuve vise la deuxième base');
  assert.equal(prixDuRang(2), 2_000_000_000n);
  assert.equal(prixDuRang(3), 5_000_000_000n);
  assert.equal(prixDuRang(4), 12_500_000_000n);

  // ⚠⚠ LE RANG 10, EN ENTIERS. 2 000 000 × 2,5⁸ = 3 051 757 812,5 points, soit
  // 3 051 757 812 500 MILLI — un entier exact. Le même calcul en `Number` passe
  // par 2.5 ** 8 et par une conversion, et c'est là qu'il se met à mentir :
  // la falsification qui écrit `BigInt(Math.round(2e9 * 2.5 ** 8))` rend
  // 3 051 757 812 500 ici mais diverge plus haut. On mesure donc les DEUX : la
  // valeur exacte, et le fait qu'aucun rang ne perde un milli-point.
  assert.equal(prixDuRang(10), 3_051_757_812_500n);

  // ⚠ EXACTITUDE JUSQU'AU RANG 12, ÉCRITE ET MESURÉE : 2 000 000 000 milli vaut
  // 2¹⁰ × 5⁹, donc la division par 2 tombe juste dix fois. Au-delà, on arrondit
  // au milli-point SUPÉRIEUR — dans le sens du refus.
  for (let rang = 2; rang <= 12; rang += 1) {
    const prix = prixDuRang(rang);
    const rachats = BigInt(rang - 2);
    assert.equal(prix * 2n ** rachats, 2_000_000_000n * 5n ** rachats,
      `le rang ${rang} n'est pas exact en entiers`);
  }
  // ⚠⚠ ET LE RANG 25, QUE `Number` NE SAIT PLUS ÉCRIRE. C'est là que la
  // falsification mord vraiment : `Math.round(2e9 * 2,5²³)` rend
  // 2 842 170 943 040 400 384 — 360 milli-points de moins que la vérité, parce
  // que le produit a dépassé l'entier sûr. Au rang 10, les deux coïncident
  // encore : un test qui s'arrêterait là passerait sur le code faux.
  assert.equal(prixDuRang(25), 2_842_170_943_040_400_744n);
  assert.notEqual(prixDuRang(25), BigInt(Math.round(2e9 * 2.5 ** 23)),
    'le montage ne distingue pas les deux calculs : il ne mesure pas la précision');

  // Et la chaîne est OUVERTE : aucun plafond ne la coupe.
  assert.ok(prixDuRang(20) > prixDuRang(19));
  assert.ok(prixDuRang(30) > 0n);

  // Le facteur vit dans les DONNÉES, pas dans le moteur.
  const moteur = readFileSync(join(RACINE, 'src', 'sim', 'recherche.js'), 'utf8');
  assert.doesNotMatch(moteur, /2\.5/, 'le facteur ×2,5 est écrit en dur dans le moteur');
  assert.equal(SPECIAL[NOEUD_BASE_SUPPLEMENTAIRE].facteurNumerateur, 5);
  assert.equal(SPECIAL[NOEUD_BASE_SUPPLEMENTAIRE].facteurDenominateur, 2);
});

test('BASES-1 T3 bis — acheter débite, ouvre le rang, et refuse sans les points', () => {
  const etat = creerEtat(3);
  assert.deepEqual(problemesDeLAchatDUneBase(etat).map((p) => p.code), ['pointsInsuffisants']);
  assert.throws(() => acheterUneBaseDePlus(etat), /il manque/);

  etat.recherche.pointsMilli = '3000000000';
  assert.deepEqual(problemesDeLAchatDUneBase(etat), []);
  acheterUneBaseDePlus(etat);
  assert.equal(etat.recherche.basesAutorisees, 2);
  assert.equal(etat.recherche.pointsMilli, '1000000000', 'le débit n\'est pas exact');
  // Le rang suivant coûte 2,5 fois plus : on ne peut plus l'acheter.
  assert.deepEqual(problemesDeLAchatDUneBase(etat).map((p) => p.code), ['pointsInsuffisants']);
});

// ---------------------------------------------------------------------------
// T4 / T5 / T6 — où l'on peut fonder
// ---------------------------------------------------------------------------

test('BASES-1 T4 — dix cases oui, onze non, et la diagonale compte', () => {
  const etat = partieAvecDroit(3, 293);
  const ici = baseCourante(etat).position;
  const codes = (dr, dc) => problemesDeLaFondation(
    etat, { rangee: ici.rangee + dr, colonne: ici.colonne + dc },
  ).map((p) => p.code);

  assert.deepEqual(codes(0, 10), [], 'dix cases en ligne devraient passer');
  assert.ok(codes(0, 11).includes('trop-loin'), 'onze cases devraient être refusées');

  // ⚠⚠ EUCLIDE, PAS TCHEBYCHEV, ET C'EST LA FALSIFICATION DU BRIEF. En
  // Tchebychev, (7, 7) est à SEPT cases et passerait ; en euclidien il est à
  // 9,9 — donc il passe aussi. C'est (8, 8) qui sépare les deux : Tchebychev
  // dit 8, Euclide dit 11,3.
  assert.equal(PORTEE_CARREE, FONDATION.porteeMaxCases ** 2);
  assert.deepEqual(codes(7, -7), [], '(7, 7) est à 9,9 cases : il devrait passer');
  assert.ok(codes(-8, 8).includes('trop-loin'),
    '(8, 8) est à 11,3 cases en euclidien : Tchebychev le laisserait passer');
});

test('BASES-1 T5 — refusé chez l\'Ouvrage, ACCEPTÉ chez soi', () => {
  const etat = partieAvecDroit(3, 293);
  const ici = baseCourante(etat).position;

  // ⚠⚠ CHEZ SOI, C'EST OUI — Ethan, 02/09, explicitement. Conséquence signalée
  // et acceptée : deux bases du joueur peuvent être ADJACENTES. Seule la case
  // EXACTE d'une base existante est refusée.
  assert.deepEqual(
    problemesDeLaFondation(etat, { rangee: ici.rangee - 1, colonne: ici.colonne }), [],
    'fonder à côté de sa propre base est autorisé (arbitrage du 02/09)',
  );
  assert.ok(
    problemesDeLaFondation(etat, { ...ici }).some((p) => p.code === 'case-occupee'),
    'la case exacte d\'une base existante doit être refusée',
  );

  // ⚠⚠ CHEZ L'OUVRAGE, C'EST NON — ET ON COMPARE CASE PAR CASE À LA RÈGLE, comme
  // à T1 et pour la même raison : la carte est trop dense pour qu'une base y
  // soit isolée. Une case est refusée SI ET SEULEMENT SI une base de l'Ouvrage
  // est dans son OCTOGONE d'influence. C'est plus fort qu'un cas choisi, et
  // insensible aux recouvrements.
  //
  // ⚠⚠ `fondation.js` PORTAIT SA PROPRE COPIE DE LA FORME, et c'est le troisième
  // module à l'avoir fait. Depuis le 03/09 il appelle la même fonction que la
  // carte et que le barème ; le refus s'élargit donc de huit cases par base de
  // l'Ouvrage, mécaniquement.
  //
  // ⚠ LA RANGÉE EST CHOISIE POUR QUE LES RÈGLES DIVERGENT, et c'est MESURÉ :
  // plus haut sur la carte, la densité est telle que toute case est à trois
  // cases d'une base — les trois formes y disent la même chose, et le test
  // passerait sur le code d'avant. L'assertion `separent > 0` le tient.
  const aupres = creerEtat(3);
  poserLaBaseSur(aupres, 285, 16);
  aupres.recherche.basesAutorisees = 2;
  const R = GEOGRAPHIE.rayonInfluenceEnnemie;
  // Les trois formes, écrites ici et pas importées : importer la fonction du
  // code rendrait la comparaison tautologique.
  const formes = {
    carre: () => true,
    disque: (dr, dc) => dr * dr + dc * dc <= R * R,
    octogone: (dr, dc) => Math.abs(dr) + Math.abs(dc) <= R + 1,
  };
  const proche = (r, c, forme) => {
    for (let dr = -R; dr <= R; dr += 1) {
      for (let dc = -R; dc <= R; dc += 1) {
        if (!formes[forme](dr, dc)) continue;
        if (estBaseOuvrage(aupres.graine, r + dr, c + dc)) return true;
      }
    }
    return false;
  };
  let ecarts = 0;
  let separent = 0;
  let vus = 0;
  for (let dr = -10; dr <= 10; dr += 1) {
    for (let dc = -10; dc <= 10; dc += 1) {
      if (dr * dr + dc * dc > PORTEE_CARREE) continue;
      const r = 285 + dr;
      const c = 16 + dc;
      if (c < 1 || c > GEOGRAPHIE.carte.largeur) continue;
      vus += 1;
      const refuse = problemesDeLaFondation(aupres, { rangee: r, colonne: c })
        .some((p) => p.code === 'territoire-ennemi');
      const octogone = proche(r, c, 'octogone');
      if (refuse !== octogone) ecarts += 1;
      if (octogone !== proche(r, c, 'disque') || octogone !== proche(r, c, 'carre')) {
        separent += 1;
      }
    }
  }
  assert.ok(vus > 200, 'la fenêtre est trop petite pour mesurer quoi que ce soit');
  assert.ok(separent > 0,
    'les trois formes coïncident sur cette fenêtre : le montage ne mesure rien');
  assert.equal(ecarts, 0,
    `${ecarts} case(s) refusées hors de l'octogone : la garde de fondation n'a pas suivi`);
});

test('BASES-1 T6 — refusé sur un POI, accepté sur un camp', () => {
  // ⚠ ON CHERCHE UN VRAI POI SUR LA CARTE, on n'en fabrique pas : le refus doit
  // porter sur ce que `poiDeLaCase` rend, pas sur un montage à nous.
  const etat = creerEtat(3);
  let poi = null;
  for (let r = 1; r <= 300 && poi === null; r += 1) {
    for (let c = 1; c <= 31; c += 1) {
      const p = poiDeLaCase(etat.graine, r, c);
      if (p !== null) { poi = { rangee: r, colonne: c }; break; }
    }
  }
  assert.ok(poi !== null, 'aucun POI sur cette carte : le montage ne mesure rien');
  poserLaBaseSur(etat, poi.rangee + 2, poi.colonne);
  etat.recherche.basesAutorisees = 2;
  assert.ok(problemesDeLaFondation(etat, poi).map((p) => p.code).includes('sur-un-poi'));

  // Et sur un camp : accepté. On fait paraître les satellites par le vrai tick.
  const surCamp = creerEtat(11);
  rattraperJeu(surCamp, 6 * TICKS_PAR_MINUTE);
  surCamp.recherche.basesAutorisees = 2;
  const camp = baseCourante(surCamp).satellites.presents.find((x) => x.type === 'camp');
  assert.ok(camp !== undefined, 'aucun camp paru : le montage ne mesure rien');
  assert.deepEqual(
    problemesDeLaFondation(surCamp, { rangee: camp.rangee, colonne: camp.colonne }), [],
    'fonder sur un camp doit être autorisé',
  );
});

// ---------------------------------------------------------------------------
// T7 bis — le camp écrasé disparaît, et son butin va à la base QUI FONDE
// ---------------------------------------------------------------------------

test('BASES-1 T7 bis — le camp fondé dessus disparaît, son butin va à la base qui fonde', () => {
  const etat = creerEtat(11);
  rattraperJeu(etat, 6 * TICKS_PAR_MINUTE);
  etat.recherche.basesAutorisees = 2;
  const laBase = baseCourante(etat);
  const camp = laBase.satellites.presents.find((x) => x.type === 'camp');
  assert.ok(camp !== undefined, 'aucun camp paru : le montage ne mesure rien');
  const cible = { rangee: camp.rangee, colonne: camp.colonne };

  const promis = butinDeLaFondation(etat, cible);
  assert.ok(promis !== null && (promis.quartz ?? 0) > 0,
    'le camp ne rend rien : le montage ne mesure pas le versement');
  const avant = { ...laBase.economie.ressources };
  const combien = laBase.satellites.presents.length;

  const { indice, butin, siteDetruit } = fonderUneBase(etat, cible);

  // ⚠⚠ LE BUTIN VA À LA BASE QUI FONDE, PAS À LA NEUVE. **LECTURE PRISE.** Une
  // base neuve n'a qu'un Chantier de niveau 1 — 50 · 50 · 40 de capacité — et le
  // butin d'un camp la ferait déborder EN ENTIER. **CETTE PRÉMISSE EST TOMBÉE AU
  // LOT TRANSFERT** — le butin a le droit de dépasser, donc il tiendrait dans la
  // neuve — et le COMPORTEMENT est gardé tel quel, décision remontée à Ethan.
  assert.ok(
    laBase.economie.ressources.quartz > avant.quartz,
    'le butin n\'est pas arrivé dans la base qui fonde',
  );
  const neuve = etat.bases[indice];
  assert.equal(neuve.economie.ressources.quartz, 30_000,
    'la base neuve a reçu du butin : elle ne doit porter que l\'amorce');

  // ⚠⚠ LE PLAFOND NE MORD PLUS, ET C'EST LE LOT TRANSFERT. Ce bloc exigeait
  // l'inverse — « le plafonnement ne se signale pas » sur un `butin.perdu` non
  // vide. Il est RETOURNÉ : `verserLeButin` verse TOUT, donc le butin promis
  // arrive en entier, et `perdu` n'existe plus.
  assert.equal(butin.perdu, undefined, '`perdu` est revenu dans le versement');
  assert.equal(butin.verse.quartz ?? 0, promis.quartz, 'le butin promis n\'est pas arrivé en entier');
  assert.equal(
    laBase.economie.ressources.quartz - avant.quartz, promis.quartz * 1000,
    'ce qui est entré ne vaut pas le butin promis',
  );
  // ⚠ ET IL PASSE VRAIMENT AU-DESSUS DU PLAFOND — sans quoi ce test ne
  // distinguerait pas les deux règles.
  assert.ok(
    laBase.economie.ressources.quartz > capacitesMilli(laBase.disposition).quartz,
    'le montage ne mesure rien : le stock reste sous le plafond',
  );

  // ⚠ ET LE CAMP A DISPARU DE LA CARTE, comme après un rasage.
  assert.equal(siteDetruit.type, 'camp');
  assert.equal(etat.bases[0].satellites.presents.length, combien - 1);
  assert.equal(etat.satellitesDetruits.camp, 1, 'la destruction n\'est pas comptée');
  assert.equal(
    problemesDeLaFondation(etat, cible).some((p) => p.code === 'case-occupee'), true,
    'la case est maintenant celle d\'une base à soi',
  );
});

// ---------------------------------------------------------------------------
// T8 — la distance se mesure depuis N'IMPORTE LAQUELLE de ses bases
// ---------------------------------------------------------------------------

test('BASES-1 T8 — fonder se mesure depuis la base la plus proche, pas la courante', () => {
  const etat = partieAvecDroit(3, 293);
  fonderUneBase(etat, { rangee: 293, colonne: 26 });
  assert.equal(etat.bases.length, 2);
  // ⚠ FONDER REND LA NEUVE COURANTE : on revient sur la première, exprès, pour
  // que la cible ci-dessous soit HORS de portée de la courante.
  basculerVersLaBase(etat, 0);
  etat.recherche.basesAutorisees = 3;

  const cible = { rangee: 293, colonne: 30 };
  assert.ok(
    distanceCarreeCases(etat.bases[0].position, cible) > PORTEE_CARREE,
    'le montage ne mesure rien : la cible est déjà à portée de la base courante',
  );
  assert.ok(distanceCarreeCases(etat.bases[1].position, cible) <= PORTEE_CARREE);
  assert.deepEqual(
    problemesDeLaFondation(etat, cible).filter((p) => p.code === 'trop-loin'), [],
    'la distance n\'est mesurée que depuis la base courante',
  );
});

// ---------------------------------------------------------------------------
// T10 — réserve et satellites restent PROPRES à chaque base
// ---------------------------------------------------------------------------

test('BASES-1 T10 — réserve de réparation et satellites ne se mélangent pas', () => {
  const etat = partieAvecDroit(3, 293);
  fonderUneBase(etat, { rangee: 293, colonne: 24 });
  const [a, b] = etat.bases;

  // ⚠ DEUX OBJETS DISTINCTS, PAS DEUX VUES DU MÊME. Un raccourci partagé se
  // verrait ici et nulle part ailleurs.
  assert.notEqual(a.reserveReparation, b.reserveReparation);
  assert.notEqual(a.satellites, b.satellites);
  a.reserveReparation.escouade = 12_345;
  assert.equal(b.reserveReparation.escouade, 0, 'les deux réserves sont le même objet');

  // ⚠ ET LE PLAFOND SUIT L'ARMÉE DE **CETTE** BASE. On arme la première, pas la
  // seconde : leurs plafonds doivent diverger.
  poserEffectif(etat, 'armee', {
    id: 'ratisseur', vague: 1, colonne: 1, niveau: 20,
  });
  const armee = etat.bases[etat.baseCourante];
  assert.ok(armee.armee.length > 0, 'le montage ne pose rien : il ne mesure rien');
  assert.notEqual(
    plafondDeLaReserveDeLaBase(a), plafondDeLaReserveDeLaBase(b),
    'les deux plafonds sont égaux : la réserve lit la mauvaise armée',
  );

  // ⚠ LE CRÉDIT VA AUX DEUX, ET CHACUNE À SON PLAFOND — c'est la boucle du §5.2.
  const avantA = { ...a.reserveReparation };
  const avantB = { ...b.reserveReparation };
  tickJeu(etat);
  assert.notDeepEqual(a.reserveReparation, avantA, 'la base A n\'est pas créditée');
  assert.notDeepEqual(b.reserveReparation, avantB, 'la base B n\'est pas créditée');
});

// ---------------------------------------------------------------------------
// T11 — les quatre missions ont un moteur, et le dénominateur est MESURÉ
// ---------------------------------------------------------------------------

test('BASES-1 T11 — les dix-sept missions ont un moteur (M2)', () => {
  const etat = creerEtat(3);
  const { total } = avancement(etat);
  assert.equal(total, CHAINE_TUTORIEL.length,
    'des missions restent hors du compteur : il leur manque un moteur');
  assert.equal(total, 17, 'la chaîne d\'Ethan n\'a plus dix-sept missions');

  const lignes = etatDesMissions(etat);
  for (const l of lignes) assert.equal(l.verifiable, true, `${l.id} n'a pas de moteur`);

  // ⚠ ET LES QUATRE QUI VIENNENT D'EN RECEVOIR UN SE COCHENT VRAIMENT. On les
  // joue par les vrais gestes, un par un, et on vérifie que CHACUNE bascule.
  const coche = (id) => etatDesMissions(etat).find((m) => m.id === id).faite;
  assert.equal(coche('detruire-un-camp'), false);
  rattraperJeu(etat, 6 * TICKS_PAR_MINUTE);
  const camp = baseCourante(etat).satellites.presents.find((x) => x.type === 'camp');
  retirerLeSite(etat, {
    type: 'camp', rangee: camp.rangee, colonne: camp.colonne, instance: camp.instance,
  });
  assert.equal(coche('detruire-un-camp'), true, 'détruire un camp ne coche pas');

  assert.equal(coche('se-rapprocher-de-l-ouvrage'), false);
  poserLaBaseSur(etat, baseCourante(etat).position.rangee - 10, 16);
  assert.equal(coche('se-rapprocher-de-l-ouvrage'), true, 'monter au nord ne coche pas');

  assert.equal(coche('detruire-une-base-de-l-ouvrage'), false);
  const ennemie = ciblesAPortee(etat, baseCourante(etat)).find((c) => c.type === 'base')
    ?? baseOuvrageIsolee(etat);
  retirerLeSite(etat, ennemie);
  assert.equal(coche('detruire-une-base-de-l-ouvrage'), true, 'raser une base ne coche pas');

  assert.equal(coche('seconde-base'), false);
  etat.recherche.basesAutorisees = 2;
  fonderUneBase(etat, {
    rangee: baseCourante(etat).position.rangee + 1,
    colonne: baseCourante(etat).position.colonne,
  });
  assert.equal(coche('seconde-base'), true, 'fonder ne coche pas');

  // ⚠⚠ ET FONDER NE DÉCOCHE RIEN. C'est le défaut que ce lot aurait introduit
  // sans la règle « la meilleure base » : la base neuve n'a qu'un Chantier de
  // niveau 1, et les douze missions de construction se seraient vidées d'un
  // coup — pour avoir fait exactement ce que le tutoriel demandait.
  const surLaNeuve = etatDesMissions(etat).filter((m) => m.faite).length;
  basculerVersLaBase(etat, 0);
  assert.equal(etatDesMissions(etat).filter((m) => m.faite).length, surLaNeuve,
    'basculer change le compte des missions faites');
});

// ---------------------------------------------------------------------------
// T12 — `structuredClone` puis `serialiser` ≡ `serialiser`, à PLUSIEURS bases
// ---------------------------------------------------------------------------

test('BASES-1 T12 — plusieurs bases traversent structuredClone sans se dédoubler', () => {
  const etat = partieAvecDroit(3, 293);
  fonderUneBase(etat, { rangee: 293, colonne: 22 });
  basculerVersLaBase(etat, 0);
  poser(etat, 'collecteur', ...premierChampLibre(etat));
  rattraperJeu(etat, 3 * TICKS_PAR_MINUTE);

  const avant = serialiser(etat, 1_000_000);
  const copie = structuredClone(etat);
  assert.equal(serialiser(copie, 1_000_000), avant,
    'la copie ne se sérialise pas comme l\'original');

  // ⚠⚠ AUCUN RACCOURCI VERS UN OBJET BASE. `baseCourante` est un INDICE, et
  // c'est la règle que BASES-0 a écrite : `structuredClone` ne rétablit aucune
  // identité de référence, donc un raccourci se dédoublerait — la liste et le
  // raccourci désigneraient deux objets différents, et l'un des deux cesserait
  // d'être écrit. La falsification du brief pose ce raccourci ; ce test tombe.
  assert.equal(typeof copie.baseCourante, 'number');
  const parLIndice = copie.bases[copie.baseCourante];
  parLIndice.economie.ressources.quartz += 1234;
  assert.equal(
    serialiser(copie, 1_000_000) !== avant, true,
    'écrire par l\'indice ne change pas la sérialisation : il y a une seconde vue',
  );
  // Et les deux bases restent DEUX objets après la copie.
  assert.notEqual(copie.bases[0], copie.bases[1]);
  copie.bases[0].economie.ressources.scorie = 42;
  assert.notEqual(copie.bases[1].economie.ressources.scorie, 42);
});

/** La première case de champ libre de la base courante — pour un montage. */
function premierChampLibre(etat) {
  const laBase = baseCourante(etat);
  const prises = new Set(laBase.disposition.map((b) => `${b.rangee}:${b.colonne}`));
  for (const c of laBase.champs.cases) {
    if (!prises.has(`${c.rangee}:${c.colonne}`)) return [c.rangee, c.colonne];
  }
  throw new Error('aucun champ libre');
}

// ---------------------------------------------------------------------------
// T14 — la migration 23 → 24, et le numéro de version
// ---------------------------------------------------------------------------

test('BASES-1 T14 — la migration 23 → 24 remonte les trois champs neufs', () => {
  // ⚠ LA GARDE DU NUMÉRO APPARTIENT AU MAILLON LE PLUS RÉCENT, UNE SEULE FOIS —
  // règle écrite dans `points-attaque.test.js` depuis le lot SITE-ENTAMÉ. Le
  // maillon 22 → 23 l'a laissée en descendant d'un cran.
  assert.equal(SAVE_VERSION, 24, 'le bump de la version des sauvegardes a été oublié');

  const etat = creerEtat(4321);
  rattraperJeu(etat, 2 * H);
  const v24 = JSON.parse(serialiser(etat, 5_000_000));

  // Une v23 : le compteur redescend dans la base, les deux autres champs sortent.
  const v23 = structuredClone(v24);
  v23.version = 23;
  v23.bases[0].satellites.prochaineInstance = v23.prochaineInstanceSatellite;
  delete v23.prochaineInstanceSatellite;
  delete v23.satellitesDetruits;
  delete v23.recherche.basesAutorisees;

  const migre = migrer(structuredClone(v23));
  assert.equal(migre.version, 24);
  assert.equal(migre.prochaineInstanceSatellite, v24.prochaineInstanceSatellite,
    'le compteur d\'instance n\'a pas remonté');
  assert.equal(migre.bases[0].satellites.prochaineInstance, undefined,
    'le compteur est resté dans la base');
  assert.equal(migre.recherche.basesAutorisees, 1, 'une v23 n\'a qu\'une base');
  assert.deepEqual(migre.satellitesDetruits, { camp: 0, avantPoste: 0 },
    'la migration invente des destructions');

  // ⚠⚠ UN COMPTEUR NE RECULE JAMAIS. Une sauvegarde qui porte DÉJÀ le champ
  // global — parce qu'elle a été fabriquée à partir d'une v24 rabaissée — ne
  // doit pas se le faire écraser : distribuer une seconde fois des numéros déjà
  // pris ferait partager leur tirage à deux camps successifs.
  const rabaissee = structuredClone(v24);
  rabaissee.version = 23;
  rabaissee.bases[0].satellites.prochaineInstance = 1;
  assert.equal(
    migrer(rabaissee).prochaineInstanceSatellite, v24.prochaineInstanceSatellite,
    'la migration a fait reculer le compteur',
  );

  // ⚠ ET LE DROIT DE FONDER SUIT CE QUI EST POSÉ, pas un 1 écrit en dur.
  const aDeuxBases = structuredClone(v24);
  aDeuxBases.version = 23;
  aDeuxBases.bases.push(structuredClone(v24.bases[0]));
  delete aDeuxBases.recherche.basesAutorisees;
  assert.equal(migrer(aDeuxBases).recherche.basesAutorisees, 2,
    'la migration retire le droit d\'avoir les bases qu\'on a déjà');
});

// ---------------------------------------------------------------------------
// T9 — la bascule change l'indice, et TOUS les écrans suivent
// ---------------------------------------------------------------------------

test('BASES-1 T9 — la bascule change l\'indice, et les écrans lisent la courante', () => {
  const etat = partieAvecDroit(3, 293);
  poser(etat, 'collecteur', ...premierChampLibre(etat));
  fonderUneBase(etat, { rangee: 293, colonne: 22 });

  // ⚠ FONDER REND LA NEUVE COURANTE : c'est ce qu'on veut voir bouger.
  assert.equal(etat.baseCourante, 1);
  assert.equal(baseCourante(etat), etat.bases[1]);
  basculerVersLaBase(etat, 0);
  assert.equal(baseCourante(etat), etat.bases[0]);

  // ⚠⚠ CHAQUE ÉCRAN LIT LA COURANTE, ET AUCUN NE GARDE `etat.bases[0]` EN DUR.
  // C'est la faute que ce lot pouvait commettre partout : un écran qui indexe la
  // liste au lieu de demander la base courante montrerait toujours la première,
  // et rien ne casserait. Le balayage porte sur les cinq écrans plus la session.
  const fautifs = [];
  for (const nom of readdirSync(join(RACINE, 'src', 'ui'))) {
    const source = readFileSync(join(RACINE, 'src', 'ui', nom), 'utf8')
      .split('\n')
      .filter((l) => !l.trimStart().startsWith('//') && !l.trimStart().startsWith('*'))
      .join('\n');
    if (/\betat(?:Courant)?\.bases\[\s*0\s*\]/.test(source)) fautifs.push(`src/ui/${nom}`);
  }
  assert.deepEqual(fautifs, [], `écran(s) qui indexent la première base en dur : ${fautifs}`);
  // Falsifiable : le motif attrape l'appât et laisse passer le bon chemin.
  assert.match('const b = etat.bases[0];', /\betat(?:Courant)?\.bases\[\s*0\s*\]/);
  assert.doesNotMatch('const b = baseCourante(etat);', /\betat(?:Courant)?\.bases\[\s*0\s*\]/);

  // ⚠ ET LES CINQ ÉCRANS PASSENT BIEN PAR L'ACCESSEUR. Un écran qui ne le
  // nommerait nulle part ne pourrait pas suivre la bascule.
  for (const nom of ['chantier.js', 'offense.js', 'mission.js', 'monde.js', 'recherche.js']) {
    const source = readFileSync(join(RACINE, 'src', 'ui', nom), 'utf8');
    const suit = source.includes('baseCourante') || source.includes('etatDesMissions')
      || source.includes('etat.recherche');
    assert.ok(suit, `src/ui/${nom} ne lit la base par aucun chemin qui suive la bascule`);
  }
});

test('BASES-1 T9 bis — la carte redessine à la bascule, et le halo suit', () => {
  // ⚠⚠ L'EMPREINTE DE `rafraichir` DÉCIDE SI LA CARTE SE REDESSINE, et elle
  // était CASSÉE avant ce lot : elle lisait `satellites.prochaineInstance`, qui
  // a déménagé dans l'état, donc elle valait « N:undefined ». Elle porte
  // maintenant `baseCourante` — sans quoi basculer ne déplacerait pas le halo,
  // la liste des satellites n'ayant pas bougé.
  const source = readFileSync(join(RACINE, 'src', 'ui', 'monde.js'), 'utf8')
    .split('\n').filter((l) => !l.trimStart().startsWith('//')).join('\n');
  assert.match(source, /empreinte = `\$\{etat\.baseCourante\}/);
  // ⚠ ET ELLE N'EST ÉCRITE QU'UNE FOIS : elle l'était deux, et les deux copies
  // avaient divergé. Un test qui compte les occurrences est ce qui empêche la
  // seconde de revenir.
  assert.equal((source.match(/empreinte \+= `:\$\{base\.satellites/g) ?? []).length, 1,
    'l\'empreinte de la carte est écrite plus d\'une fois');
  assert.doesNotMatch(source, /sat\.prochaineInstance/);

  // ⚠ ET LE HALO SE DESSINE AUTOUR DE LA BASE COURANTE, pas de la première.
  assert.match(source, /geometrieDuHalo\(baseCourante\(etatCourant\)\.position/);

  // ⚠ TOUCHER UNE AUTRE DE SES BASES BASCULE : `sitesDeLaFenetre` porte
  // l'indice, et `ouvrirPanneau` l'emploie.
  const etat = partieAvecDroit(3, 293);
  fonderUneBase(etat, { rangee: 293, colonne: 22 });
  const fenetre = {
    premiereRangee: 288, derniereRangee: 298, premiereColonne: 10, derniereColonne: 28,
  };
  const miennes = sitesDeLaFenetre(etat, fenetre).filter((s) => s.type === 'baseJoueur');
  assert.equal(miennes.length, 2, 'la carte ne montre pas les deux bases');
  assert.deepEqual(miennes.map((s) => s.indiceBase), [0, 1]);
  assert.deepEqual(miennes.map((s) => s.courante), [false, true]);
  assert.match(source, /basculerVersLaBase\(etatCourant, site\.indiceBase\)/);
});

// ---------------------------------------------------------------------------
// T15 — les trois boucles du pluriel (§5.2 du brief)
// ---------------------------------------------------------------------------

test('BASES-1 T15 — l\'Ouvrage attaque TOUTES les bases, pas la courante', () => {
  // ⚠⚠ C'ÉTAIT LA SIXIÈME CONDITION DE RUPTURE, celle que le rapport de BASES-0
  // disait « la plus profonde » : `basesAttaquantes` interrogeait
  // `ciblesAPortee(etat, baseCourante(etat))`. Au pluriel, une seconde base
  // aurait été un SANCTUAIRE — invisible pour l'Ouvrage —, et rien n'aurait
  // cassé. Le montage pose donc la seconde base LOIN de la première, en pays
  // peuplé, et exige que l'Ouvrage la voie pendant qu'on regarde l'autre.
  const etat = partieAvecDroit(3, 285);
  fonderUneBase(etat, caseFondable(etat));
  // ⚠⚠ ON MONTE LA SECONDE BASE EN PAYS PEUPLÉ, ET IL FAUT LE DIRE : on ne peut
  // PAS la fonder là-haut. `RAID_OUVRAGE.niveauMinimal` vaut 10 — les bases du
  // début sont là pour être attaquées, pas pour attaquer — et fonder est
  // interdit dans le territoire de l'Ouvrage, qui couvre tout au-delà de la
  // rangée 270 environ. Les deux règles sont disjointes près du départ : il faut
  // fonder en bas puis MONTER. `poserLaBaseSur` est le seul écrivain de
  // `position`, celui-là même qu'emploie le rasage.
  poserLaBaseSur(etat, 200, 16, etat.bases[1]);
  basculerVersLaBase(etat, 0);

  const paires = basesAttaquantes(etat);
  const visees = new Set(paires.map((p) => p.baseVisee));
  assert.ok(visees.has(1), 'la seconde base est un sanctuaire : l\'Ouvrage ne la voit pas');
  assert.ok(paires.length > 0);

  // ⚠ ET CHAQUE PAIRE EST BIEN À PORTÉE DE LA BASE QU'ELLE VISE, pas d'une
  // autre : sans `baseVisee`, `subirUnRaid` retomberait sur la courante et
  // frapperait celle que le joueur regarde.
  for (const p of paires) {
    const cible = etat.bases[p.baseVisee].position;
    const d = Math.max(Math.abs(cible.rangee - p.rangee), Math.abs(cible.colonne - p.colonne));
    assert.ok(d <= 10, `la paire (${p.rangee}, ${p.colonne}) vise une base hors de portée`);
  }

  // ⚠⚠ ET LE RAID FRAPPE LA BASE VISÉE, PAS LA COURANTE. On prend une paire qui
  // vise la SECONDE base pendant que la PREMIÈRE est courante : les dégâts
  // doivent tomber sur la seconde.
  const contreLaSeconde = paires.find((p) => p.baseVisee === 1);
  if (contreLaSeconde !== undefined) {
    assert.equal(etat.baseCourante, 0, 'le montage ne mesure rien : la visée est la courante');
    const avant = JSON.stringify(etat.bases[0].disposition);
    const rapport = subirUnRaid(etat, contreLaSeconde, 5);
    assert.equal(JSON.stringify(etat.bases[0].disposition), avant,
      'la base courante a encaissé un raid destiné à l\'autre');
    assert.equal(typeof rapport.verdict, 'string');
  }
});

test('BASES-1 T15 bis — les satellites de TOUTES les bases sont sur la carte', () => {
  // ⚠⚠ `siteDeLaCase` NE LISAIT QUE LA BASE COURANTE, et ce n'était pas qu'un
  // défaut d'affichage : sur le camp d'une autre base, il rendait `null`, donc
  // la case cessait d'être ATTAQUABLE en même temps qu'elle devenait invisible.
  const etat = partieAvecDroit(3, 285);
  fonderUneBase(etat, caseFondable(etat));
  rattraperJeu(etat, 6 * TICKS_PAR_MINUTE);
  basculerVersLaBase(etat, 0);

  const tous = satellitesPresents(etat);
  const parBase = new Set(tous.map((x) => etat.bases.indexOf(x.base)));
  assert.ok(parBase.has(0) && parBase.has(1),
    'le montage ne mesure rien : une des deux bases n\'a aucun satellite');

  const ailleurs = tous.find((x) => x.base !== baseCourante(etat));
  assert.ok(ailleurs !== undefined);
  const site = siteDeLaCase(etat, ailleurs.satellite.rangee, ailleurs.satellite.colonne);
  assert.ok(site !== null,
    'le camp d\'une autre base est invisible, donc inattaquable');
  assert.equal(site.type, ailleurs.satellite.type);

  // ⚠ ET LA CARTE LES DESSINE TOUS. `sitesDeLaFenetre` est ce que l'écran Monde
  // lit ; n'en montrer qu'une base ferait disparaître des sites qui existent.
  const fenetre = {
    premiereRangee: 260, derniereRangee: 300, premiereColonne: 1, derniereColonne: 31,
  };
  const dessines = sitesDeLaFenetre(etat, fenetre)
    .filter((s) => s.type === 'camp' || s.type === 'avantPoste').length;
  assert.equal(dessines, tous.length, 'la carte ne dessine pas tous les satellites');
});
