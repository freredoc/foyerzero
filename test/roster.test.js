// Tests T1 à T7 du brief du lot 4A — roster mesuré et échelle de temps.
//
// La source est `RELEVE-TA-COURBES-2.md`, §6. Sa table y est transcrite
// littéralement (RELEVE ci-dessous) et T2 exige que nos données la
// reconstruisent exactement : c'est ce qui empêche `src/data/` de dériver de
// sa source, comme le classeur l'avait fait avant l'audit du 23/08.
//
// Chaque seuil porte son calcul.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  UNITES, DEFENSES, COLONNES_DEGATS, ECHELLE_DEGATS, OBSTACLES,
} from '../src/data/combat.js';
import { NIVEAU } from '../src/data/niveaux.js';
import {
  creerCombat, resoudre, facteurMilli, TICKS_MAX_COMBAT,
} from '../src/sim/combat.js';
import { genererSite } from '../src/sim/generateur.js';
import { executerRaidComplet } from '../src/ui/banc.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// La transcription du §6 du relevé, colonne par colonne.
//
// `bat` est la QUATRIÈME colonne du relevé. Pour une unité offensive elle se
// lit « bâtiment » et la colonne `air` est nulle ; pour une défense c'est
// l'inverse, et le §3 du relevé montre que ce sont les deux faces d'une même
// valeur — la même unité consultée en attaque puis en défense porte les mêmes
// nombres, la quatrième passant du bâtiment à l'aviation. D'où nos trois
// colonnes, dont la troisième est `structureOuAviation`.
// ---------------------------------------------------------------------------

const RELEVE = {
  // §6.1 Infanterie — Caserne
  meute: { ta: 'Rifleman Squad', pv: 700, inf: 3520, veh: 1760, air: 0, bat: 1120, parc: 0, portee: 1.5, vit: 60, mun: 700, rep: 441 },
  perceurs: { ta: 'Missile Squad', pv: 700, inf: 800, veh: 1920, air: 0, bat: 4000, parc: 0, portee: 1.5, vit: 60, mun: 2500, rep: 441 },
  guetteur: { ta: 'Sniper Team', pv: 500, inf: 4800, veh: 800, air: 0, bat: 640, parc: 0, portee: 2.5, vit: 60, mun: 400, rep: 882 },
  carapace: { ta: 'Zone Troopers', pv: 800, inf: 640, veh: 5600, air: 0, bat: 960, parc: 0, portee: 1.5, vit: 60, mun: 600, rep: 441 },
  fouisseurs: { ta: 'Commando', pv: 900, inf: 1280, veh: 640, air: 0, bat: 8000, parc: 0, portee: 1.5, vit: 60, mun: 5000, rep: 882 },
  // §6.2 Véhicules — Usine
  belier: { ta: 'Pitbull', pv: 800, inf: 1120, veh: 1920, air: 0, bat: 4000, parc: 1120, portee: 2.5, vit: 120, mun: 2500, rep: 972 },
  fendeur: { ta: 'Predator', pv: 1000, inf: 960, veh: 3680, air: 0, bat: 1600, parc: 3680, portee: 2.5, vit: 90, mun: 1000, rep: 972 },
  ratisseur: { ta: 'Guardian', pv: 1000, inf: 5120, veh: 1920, air: 0, bat: 2400, parc: 5120, portee: 1.5, vit: 120, mun: 800, rep: 972 },
  broyeur: { ta: 'Mammoth', pv: 2000, inf: 2400, veh: 4480, air: 0, bat: 2880, parc: 4000, portee: 2.5, vit: 90, mun: 1800, rep: 1458 },
  pilon: { ta: 'Juggernaut', pv: 1300, inf: 800, veh: 1600, air: 0, bat: 8000, parc: 6400, portee: 2.5, vit: 60, mun: 5000, rep: 1458 },
  // §6.3 Aviation — Aérodrome
  crecelle: { ta: 'Orca', pv: 900, inf: 5760, veh: 2880, air: 0, bat: 1920, parc: 0, portee: 1.5, vit: 120, mun: 1200, rep: 1070 },
  busard: { ta: 'Paladin', pv: 1050, inf: 640, veh: 3200, air: 0, bat: 1920, parc: 0, portee: 2.5, vit: 120, mun: 1200, rep: 1070 },
  enclume: { ta: 'Kodiak', pv: 1800, inf: 1600, veh: 2400, air: 0, bat: 6400, parc: 0, portee: 2.5, vit: 120, mun: 4000, rep: 1605 },
  frappeur: { ta: 'Firehawk', pv: 550, inf: 0, veh: 0, air: 0, bat: 48_000, parc: 0, portee: 1.5, vit: 240, mun: 4500, rep: 1070 },
};

// §6.4 Défenses. `portee: null` = « statique » au relevé : elle ne tire pas.
const RELEVE_DEFENSES = {
  merlon: { ta: 'Wall', pv: 2000, inf: 0, veh: 0, air: 0, bat: 0, portee: null, mini: null },
  ronce: { ta: 'Barbwire', pv: 1000, inf: 0, veh: 0, air: 0, bat: 0, portee: null, mini: null },
  herse: { ta: 'Anti-tank barrier', pv: 1500, inf: 0, veh: 0, air: 0, bat: 0, portee: null, mini: null },
  casemate: { ta: 'MG Nest', pv: 1000, inf: 3200, veh: 1120, air: 1280, bat: 0, portee: 2.5, mini: 0 },
  creneau: { ta: 'Guardian Cannon', pv: 1250, inf: 1600, veh: 5600, air: 0, bat: 0, portee: 2.5, mini: 0 },
  batterie: { ta: 'Flak', pv: 1000, inf: 0, veh: 0, air: 6400, bat: 0, portee: 2.5, mini: 0 },
  faucheuse: { ta: 'Watchtower', pv: 600, inf: 1600, veh: 320, air: 160, bat: 0, portee: 5.5, mini: 3.5 },
  mortier: { ta: 'Titan Artillery', pv: 700, inf: 320, veh: 1920, air: 0, bat: 0, portee: 5.5, mini: 3.5 },
  harpon: { ta: 'SAM Site', pv: 650, inf: 0, veh: 0, air: 2560, bat: 0, portee: 5.5, mini: 3.5 },
};

/** Toutes les valeurs de dégâts NON NULLES du §6, dégâts de parcours compris. */
function valeursDeDegats() {
  const valeurs = [];
  for (const u of Object.values(RELEVE)) {
    for (const c of ['inf', 'veh', 'air', 'bat', 'parc']) if (u[c] > 0) valeurs.push(u[c]);
  }
  for (const d of Object.values(RELEVE_DEFENSES)) {
    for (const c of ['inf', 'veh', 'air', 'bat']) if (d[c] > 0) valeurs.push(d[c]);
  }
  return valeurs;
}

// ---------------------------------------------------------------------------
// T1 — la conversion est exacte
// ---------------------------------------------------------------------------

test('T1 — les 57 valeurs du relevé se divisent par 160 sans reste', () => {
  const valeurs = valeursDeDegats();
  assert.equal(valeurs.length, 57, '52 valeurs de tir + 5 dégâts de parcours');

  // T = 16 s et 10 tirs/s : le diviseur vaut 160. C'est le SEUL choix exact de
  // la plage utile, et la raison est ici — le PGCD des 57 valeurs vaut 160, de
  // la plus petite (160, le Watchtower contre l'aviation) à la plus grande
  // (48 000, le Firehawk contre les bâtiments). T = 20 donnerait 200, T = 13
  // donnerait 130, T = 10 donnerait 100 : aucun ne divise 160.
  assert.equal(ECHELLE_DEGATS.secondes, 16);
  assert.equal(ECHELLE_DEGATS.parTir, 160);
  assert.equal(ECHELLE_DEGATS.parTir, 10 * ECHELLE_DEGATS.secondes);

  const pgcd = (a, b) => (b === 0 ? a : pgcd(b, a % b));
  assert.equal(valeurs.reduce(pgcd, 0), 160, 'le PGCD des 57 valeurs');
  assert.equal(Math.min(...valeurs), 160);
  assert.equal(Math.max(...valeurs), 48_000);
  for (const v of valeurs) assert.equal(v % ECHELLE_DEGATS.parTir, 0, `${v} ÷ 160`);

  // Aucun des trois diviseurs concurrents ne partage cette propriété.
  for (const t of [10, 13, 20]) {
    assert.ok(valeurs.some((v) => v % (10 * t) !== 0), `T = ${t} devrait demander un arrondi`);
  }

  // Aucune valeur de `degats` du fichier de données n'est fractionnaire.
  for (const [id, u] of Object.entries(UNITES)) {
    for (const c of COLONNES_DEGATS) {
      assert.ok(Number.isInteger(u.degats[c]), `${id}.${c} : ${u.degats[c]} n'est pas entier`);
    }
    // Ni la vitesse, ni la vitesse divisée par 2,5 : 60→24, 90→36, 120→48,
    // 240→96. On le vérifie en entiers, (v × 1000) % 2500 === 0.
    assert.ok(Number.isInteger(u.vitesse), `${id} : vitesse ${u.vitesse} non entière`);
    assert.equal((u.vitesse * 1000) % 2500, 0,
      `${id} : ${u.vitesse} / ${OBSTACLES.diviseurVitesse} non entier`);
  }
  assert.deepEqual([...new Set(Object.values(UNITES).map((u) => u.vitesse))].sort((a, b) => a - b),
    [60, 90, 120, 240]);
  assert.deepEqual([...new Set(Object.values(UNITES).map((u) => u.vitesse / 2.5))]
    .sort((a, b) => a - b), [24, 36, 48, 96]);
});

test('T1 bis — les seuls flottants restants sont ceux que le relevé écrit ainsi', () => {
  // Le §10 du brief demande qu'aucun flottant ne subsiste dans
  // `src/data/combat.js`. Trois familles résistent, et aucune n'est une valeur
  // convertie :
  //
  //   1. les quatre PORTÉES — 1,5 · 2,5 · 5,5 · 3,5. Le §5 du brief les donne
  //      lui-même sous cette forme (« identiques aux nôtres ») et demande de
  //      prendre « la valeur du relevé ». Les écrire en milli-cases serait une
  //      réinterprétation d'unité que le §5 réserve explicitement à la vitesse.
  //   2. `GRILLE.tickSec = 0,1` — la durée d'un tick, antérieure au lot.
  //   3. `OBSTACLES.diviseurVitesse = 2,5` — antérieure au lot elle aussi.
  //
  // Les deux dernières sont hors du périmètre du roster : le §10 lu à la lettre
  // n'est donc satisfaisable par aucun lot qui ne touche pas GRILLE ni
  // OBSTACLES. Ce test énumère les rescapés pour qu'un flottant NOUVEAU se
  // voie, au lieu de se fondre dans un décompte flou.
  const texte = readFileSync(join(RACINE, 'src', 'data', 'combat.js'), 'utf8');
  const flottants = [...texte.matchAll(/(\w+):\s*(-?\d+\.\d+)/g)]
    .map((m) => `${m[1]}=${m[2]}`);
  assert.deepEqual([...new Set(flottants)].sort(), [
    'diviseurVitesse=2.5', 'portee=1.5', 'portee=2.5', 'portee=5.5',
    'porteeMini=3.5', 'tickSec=0.1',
  ]);

  // Et ils tombent tous juste en entiers dans l'échelle du moteur : portées en
  // milli-cases, tick en centièmes de seconde, diviseur en millièmes.
  for (const table of [UNITES, DEFENSES]) {
    for (const [id, e] of Object.entries(table)) {
      assert.ok(Number.isInteger(e.portee * 1000), `${id} : portée non entière en milli`);
      assert.ok(Number.isInteger(e.porteeMini * 1000), `${id} : portée mini non entière`);
    }
  }
  assert.ok(Number.isInteger(OBSTACLES.diviseurVitesse * 1000));
});

// ---------------------------------------------------------------------------
// T2 — les données égalent la source
// ---------------------------------------------------------------------------

test('T2 — les 23 profils reconstruisent exactement la table du §6', () => {
  const PAS = ECHELLE_DEGATS.parTir;
  assert.equal(Object.keys(UNITES).length, 14);
  assert.equal(Object.keys(DEFENSES).length, 9);
  assert.equal(Object.keys(RELEVE).length + Object.keys(RELEVE_DEFENSES).length, 23);

  for (const [id, r] of Object.entries(RELEVE)) {
    const u = UNITES[id];
    assert.ok(u !== undefined, `${id} absent de UNITES`);
    assert.equal(u.ta, r.ta, `${id} : nom d'origine`);
    assert.equal(u.pv, r.pv, `${id} : PV`);
    assert.equal(u.portee, r.portee, `${id} : portée`);
    assert.equal(u.vitesse, r.vit, `${id} : vitesse`);
    assert.equal(u.reparation, r.rep, `${id} : réparation`);
    assert.equal(u.degatsParcours * PAS, r.parc, `${id} : dégâts de parcours`);
    // La reconstruction : degatsColonne × 160 doit rendre la valeur lue.
    assert.equal(u.degats.infanterie * PAS, r.inf, `${id} : colonne infanterie`);
    assert.equal(u.degats.vehicule * PAS, r.veh, `${id} : colonne véhicule`);
    // Pour une unité offensive, la troisième colonne est la colonne BÂTIMENT du
    // relevé — et sa colonne aviation y est nulle, par la bascule du §3.
    assert.equal(u.degats.structureOuAviation * PAS, r.bat, `${id} : colonne structure`);
    assert.equal(r.air, 0, `${id} : une unité consultée en attaque a sa colonne air à zéro`);
    // ⚠ La RÉSERVE est le seul champ non mesuré : le relevé ÷ 10. Voir T7.
    assert.equal(u.reserve * 10, r.mun, `${id} : réserve = munitions ÷ 10`);
  }

  for (const [id, r] of Object.entries(RELEVE_DEFENSES)) {
    const d = DEFENSES[id];
    assert.ok(d !== undefined, `${id} absent de DEFENSES`);
    assert.equal(d.ta, r.ta, `${id} : nom d'origine`);
    assert.equal(d.pv, r.pv, `${id} : PV`);
    assert.equal(r.bat, 0, `${id} : une défense ne vise jamais de bâtiment`);
    if (r.portee === null) {
      // « Statique » au relevé : elle ne tire pas du tout.
      assert.equal(d.degats, null, `${id} : une barrière ne tire pas`);
      continue;
    }
    assert.equal(d.portee, r.portee, `${id} : portée`);
    assert.equal(d.porteeMini, r.mini, `${id} : portée minimale`);
    assert.equal(d.degats.infanterie * PAS, r.inf, `${id} : colonne infanterie`);
    assert.equal(d.degats.vehicule * PAS, r.veh, `${id} : colonne véhicule`);
    // Pour une DÉFENSE, la troisième colonne est la colonne AVIATION.
    assert.equal(d.degats.structureOuAviation * PAS, r.air, `${id} : colonne aviation`);
  }

  // Les trois artilleries du relevé sont les nôtres, portée minimale comprise.
  // Le §6.4 et le §9.4 du relevé affirment que cette mécanique nous manque :
  // c'est FAUX depuis le lot 2A, et les deux passages sont corrigés dans le
  // même lot que ce test.
  for (const id of ['faucheuse', 'mortier', 'harpon']) {
    assert.equal(DEFENSES[id].portee, 5.5, `${id} : portée`);
    assert.equal(DEFENSES[id].porteeMini, 3.5, `${id} : portée minimale`);
  }
});

// ---------------------------------------------------------------------------
// T3 — aucune égalité de colonne
// ---------------------------------------------------------------------------

/** La colonne strictement dominante d'une table, ou null si égalité en tête. */
function dominanteUnique(table) {
  const valeurs = COLONNES_DEGATS.map((c) => table[c]);
  const max = Math.max(...valeurs);
  if (max === 0) return null;
  if (valeurs.filter((v) => v === max).length > 1) return null;
  return COLONNES_DEGATS[valeurs.indexOf(max)];
}

test('T3 — la colonne dominante est unique sur les 23 profils', () => {
  // Sans quoi la prédilection — donc la règle d'arrêt, donc le déterminisme du
  // déplacement — dépendrait de l'ordre d'énumération des colonnes.
  for (const [id, u] of Object.entries(UNITES)) {
    assert.ok(dominanteUnique(u.degats) !== null, `${id} : deux colonnes à égalité en tête`);
  }
  for (const [id, d] of Object.entries(DEFENSES)) {
    const table = d.degats ?? d.degatsFranchissement ?? null;
    if (table === null) {
      assert.equal(id, 'merlon', 'seul le Merlon ne nuit à personne');
      continue;
    }
    assert.ok(dominanteUnique(table) !== null, `${id} : deux colonnes à égalité en tête`);
  }

  // Et la dominante mesurée est la MÊME que la prédilection devinée du lot 2A,
  // qui était « le facteur de matrice vaut 1,0 ». Vingt profils sur vingt-trois
  // portaient une matrice ; les trois barrières n'en avaient pas de tir. La
  // conversion n'a donc reclassé personne, et aucune règle d'arrêt ne change.
  const PREDILECTION_2A = {
    meute: 'infanterie', guetteur: 'infanterie', perceurs: 'structureOuAviation',
    fouisseurs: 'structureOuAviation', carapace: 'vehicule', ratisseur: 'infanterie',
    fendeur: 'vehicule', broyeur: 'vehicule', belier: 'structureOuAviation',
    pilon: 'structureOuAviation', crecelle: 'infanterie', busard: 'vehicule',
    frappeur: 'structureOuAviation', enclume: 'structureOuAviation',
    casemate: 'infanterie', creneau: 'vehicule', batterie: 'structureOuAviation',
    faucheuse: 'infanterie', mortier: 'vehicule', harpon: 'structureOuAviation',
  };
  assert.equal(Object.keys(PREDILECTION_2A).length, 20);
  for (const [id, attendue] of Object.entries(PREDILECTION_2A)) {
    const table = (UNITES[id] ?? DEFENSES[id]).degats;
    assert.equal(dominanteUnique(table), attendue, `${id} : la prédilection a changé`);
  }

  // La `cible` déclarée des six défenses qui tirent dit la même chose.
  const COLONNE_PAR_CIBLE = {
    infanterie: 'infanterie', vehicule: 'vehicule', aviation: 'structureOuAviation',
  };
  for (const [id, d] of Object.entries(DEFENSES)) {
    if (d.degats === null) continue;
    assert.equal(dominanteUnique(d.degats), COLONNE_PAR_CIBLE[d.cible],
      `${id} : la dominante contredit sa cible déclarée « ${d.cible} »`);
  }
});

// ---------------------------------------------------------------------------
// T4 — pas de débordement
// ---------------------------------------------------------------------------

test('T4 — au niveau 50, le Frappeur reste loin sous l\'entier sûr', () => {
  const facteur = facteurMilli(NIVEAU.plafond);
  // ⚠ Lot COURBE : pente unique de 1,1, donc round(1000 × 1,1⁴⁹) = 106 719 au
  // lieu de 480 941 681. C'est très exactement la raison d'être du changement —
  // toutes les marges de ce test s'ouvrent de trois à quatre ordres de grandeur.
  assert.equal(facteur, 106_719);

  // Le plus gros dégât du roster : le Firehawk contre les bâtiments,
  // 48 000 ÷ 160 = 300 PV par tir.
  assert.equal(UNITES.frappeur.degats.structureOuAviation, 300);
  const colonneMilli = 300 * facteur;
  assert.equal(colonneMilli, 32_015_700);
  assert.ok(Number.isSafeInteger(colonneMilli));

  // Produit de la formule de tir, santé au maximum :
  // 32 015 700 × 1000 = 3,20 × 10¹⁰, soit 281 336 fois sous
  // MAX_SAFE_INTEGER = 9 007 199 254 740 991. C'était 62,4 fois.
  const produitTir = colonneMilli * 1000;
  assert.ok(Number.isSafeInteger(produitTir));
  assert.ok(Number.MAX_SAFE_INTEGER / produitTir > 281_000);

  // ⚠ Et voici la vraie contrainte, qui n'est PAS celle-là. Le produit le plus
  // lourd du moteur est le numérateur du ratio de santé, pvCourantMilli × 1000.
  // Le plus gros PV du roster vaut 2 000 (Mammoth et Wall), donc
  // 2000 × 106 719 × 1000 = 2,13 × 10¹¹ : 42 200 fois sous l'entier sûr, là où
  // les deux régimes ne laissaient que 9,36 fois. Le point de rupture passe de
  // 18 728 à floor(MAX_SAFE_INTEGER / (facteurMilli(50) × 1000)) = 84 401 083
  // PV de base — quarante-deux mille fois le plus gros du roster. Cette
  // contrainte cesse d'en être une, et c'est le gain principal du lot.
  const pvMax = Math.max(
    ...Object.values(UNITES).map((u) => u.pv), ...Object.values(DEFENSES).map((d) => d.pv),
  );
  assert.equal(pvMax, 2000);
  const produitSante = pvMax * facteur * 1000;
  assert.ok(Number.isSafeInteger(produitSante));
  assert.ok(Number.MAX_SAFE_INTEGER / produitSante > 42_000, 'marge du ratio de santé : 42 200×');
  assert.equal(Math.floor(Number.MAX_SAFE_INTEGER / (facteur * 1000)), 84_401_083);
  assert.ok(pvMax < 84_401_083, 'aucun profil ne doit dépasser 84 401 083 PV de base');

  // Éprouvé dans le moteur, pas seulement sur le papier : un Frappeur de niveau
  // 50 contre un Merlon de niveau 50, un tick, aucun débordement.
  const etat = creerCombat({
    niveau: 50,
    saveur: null,
    obstacles: [],
    batiments: [{ id: 'gangue', rangee: 18, colonne: 9, niveau: 50 }],
    defenseurs: [{ id: 'merlon', rangee: 3, colonne: 5, niveau: 50 }],
    vagues: [[{ id: 'frappeur', rangee: 2, colonne: 5, niveau: 50 }]],
    modulesDebloques: { ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] } },
  });
  const merlon = etat.entites.find((e) => e.id === 'merlon');
  const avant = merlon.pvMilli;
  resoudre(etat, { maxTicks: 1 });
  // Un tir à pleine santé : floor(144 282 504 300 × 1000 / 1000) milli-PV.
  assert.equal(avant - merlon.pvMilli, colonneMilli);
  assert.ok(Number.isSafeInteger(merlon.pvMilli));
  assert.equal(merlon.pvMaxMilli, 2000 * facteur);
});

// ---------------------------------------------------------------------------
// T5 — le miroir tient toujours
// ---------------------------------------------------------------------------

test('T5 — un même site à deux niveaux se résout dans le même temps', () => {
  // Le T12 du lot 2B, rejoué ici parce que le §9 du brief en fait le garde-fou
  // de la conversion : les courbes n'ayant pas bougé, ce test ne doit PAS
  // bouger. Un écart signalerait une asymétrie entre PV et dégâts.
  //
  // Il en est apparu une, et elle est corrigée : les PV vivent en milli-PV et
  // se mettent à l'échelle sans reste, là où une colonne de dégâts écrite en PV
  // entiers perdait le sien à chaque niveau — au 12e, une colonne de 5 PV
  // rendait floor(5 × 2683 / 1000) = 13 au lieu de 13,415, soit 1,56 % de
  // moins. Mesuré : 2 ticks d'écart. Les colonnes sont donc portées en milli-PV
  // dès le profil, comme pvMaxMilli, et l'écart retombe à ZÉRO.
  const assaut = [
    { id: 'pilon', colonne: 2 }, { id: 'pilon', colonne: 4 },
    { id: 'broyeur', colonne: 6 }, { id: 'broyeur', colonne: 8 },
    { id: 'fendeur', colonne: 3 }, { id: 'fendeur', colonne: 7 },
  ];
  const reference = genererSite({ type: 'avantPoste', niveau: 20, saveur: null, graine: 99 });
  const auNiveau = (n) => {
    const copie = structuredClone(reference);
    copie.niveau = n;
    for (const e of [...copie.batiments, ...copie.defenseurs]) e.niveau = n;
    copie.vagues = [assaut.map((u) => ({ ...u, niveau: n }))];
    return copie;
  };

  const ticks = new Set();
  for (const n of [1, 8, 11, 12, 16, 20, 30, 40, NIVEAU.plafond]) {
    const r = resoudre(creerCombat(auNiveau(n)));
    assert.equal(r.cause, 'attaquants', `niveau ${n} : cause`);
    assert.ok(r.tick > 50, `niveau ${n} : combat trop court (${r.tick}) pour valoir preuve`);
    ticks.add(r.tick);
  }
  // Neuf niveaux, dont les deux qui encadrent la bascule du 12 et le plafond :
  // une seule durée. La tolérance d'un tick du lot 2B n'a PAS été élargie, et
  // elle n'est même plus consommée.
  // Lot CARTE : 174 au lieu de 175. UN tick, et c'est le terrain qui l'explique
  // — les obstacles du site se posent maintenant dans la seule bande de
  // défense. Ce que ce test mesure est intact : NEUF niveaux, une SEULE durée.
  // L'invariance en miroir ne dit pas quelle est la durée, elle dit qu'elle ne
  // dépend pas du niveau.
  assert.deepEqual([...ticks], [174], `durées observées : ${[...ticks].join(', ')}`);
});

// ---------------------------------------------------------------------------
// T6 — les trois raids de référence
// ---------------------------------------------------------------------------

test('T6 — A, B et C, mesurés après conversion', () => {
  // ⚠ SEUILS DÉPLACÉS AU LOT 4B. Deux changements les déplacent ensemble : les
  // cinq bâtiments de site prennent leurs PV mesurés (la Souche passe de 400 à
  // 5 500), et l'assaut du banc passe par `genererAssaut`, donc tient dans le
  // budget d'armée et n'aligne plus d'unité verrouillée.
  //
  // Ce test-ci tient ce que le BANC produit aujourd'hui. La comparaison terme à
  // terme avec les préréglages figés du lot 3A est le T7 du lot 4B, dans
  // `assaut.test.js` — c'est là qu'elle a sa place, pas dupliquée ici.
  const cas = [
    // ⚠ LOT CARTE (29/08) : les trois butins et deux des trois ticks bougent, et
    // dans les DEUX sens — A perd 26 % de butin, B en gagne 6 %. Un allongement
    // uniforme n'aurait pas fait ça. Les obstacles cantonnés à la bande de
    // défense changent QUI meurt et QUAND, pas seulement la durée.
    // ⚠ LOT MULTIPLICATEUR (29/08) : A est un AVANT-POSTE, son butin est
    // multiplié par 3,25 — 237 → 772, 79 → 257. B et C sont des camps et ne
    // bougent pas d'une unité : c'est la meilleure preuve que le multiplicateur
    // ne touche que ce qu'il doit toucher. Ni les causes, ni les trois ticks,
    // ni les comptes de survivants ne changent : il s'applique après le combat.
    { nom: 'A', type: 'avantPoste', assaut: 'infanterie', cause: 'attaquants', tick: 429, butin: { quartz: 772, scorie: 257 }, survivants: 3 },
    { nom: 'B', type: 'camp', assaut: 'blindeLourd', cause: 'attaquants', tick: 409, butin: { quartz: 37_221, scorie: 12_407 }, survivants: 8 },
    // ⚠ Lot COURBE : le quartz de C passe de 26 319 à 26 321. C'est le SEUL
    // déplacement des trois raids — A et B sont identiques au champ près, et
    // les trois causes, les trois ticks et les trois comptes de survivants ne
    // bougent pas. C'est l'invariance en miroir : les PV et les dégâts partagent
    // la même courbe, donc changer la courbe ne change pas l'issue du combat,
    // seulement l'arrondi du butin qui s'en déduit.
    { nom: 'C', type: 'camp', assaut: 'infanterie', cause: 'attaquants', tick: 305, butin: { quartz: 24_796, scorie: 8265 }, survivants: 7 },
  ];
  for (const c of cas) {
    const r = executerRaidComplet({
      type: c.type, niveau: 15, saveur: 'richeQuartz', graine: 1, assaut: c.assaut,
    });
    assert.equal(r.cause, c.cause, `raid ${c.nom} : cause`);
    assert.equal(r.nbTicks, c.tick, `raid ${c.nom} : durée`);
    assert.deepEqual(r.butin, c.butin, `raid ${c.nom} : butin`);
    assert.equal(r.resultat.attaquants.filter((a) => !a.detruit).length, c.survivants,
      `raid ${c.nom} : survivants`);
    assert.ok(r.nbTicks < TICKS_MAX_COMBAT, `raid ${c.nom} : ${r.nbTicks} ticks`);
  }

  // Le fait qui compte : à assaut budgété, B ne rase PLUS la Souche. Le
  // préréglage figé y parvenait en alignant au niveau 15 un Broyeur (débloqué
  // au 28) et un Pilon (au 32) — deux unités que le joueur ne peut pas posséder
  // avant treize et dix-sept niveaux de plus. C'est ce que ce lot corrige.
  for (const id of ['broyeur', 'pilon']) {
    assert.ok(UNITES[id].apparition > 15, `${id} devrait être verrouillé au niveau 15`);
  }
});

// ---------------------------------------------------------------------------
// T7 — la réserve reste mordante
// ---------------------------------------------------------------------------

test('T7 — aucune unité ne peut tirer plus longtemps que le raid', () => {
  // ⚠ LE SEUL NOMBRE NON MESURÉ DU LOT. Le relevé donne les munitions au pied
  // de la lettre ; à un tir par tick et 10 tirs/s, elles vaudraient de 40 s
  // (Sniper) à 500 s (Commando et Juggernaut) de tir continu, pour un raid qui
  // en dure 90. DIX unités sur quatorze auraient de quoi tirer plus longtemps
  // que le combat entier, et le plancher de 10 % — le cœur du modèle offensif —
  // ne mordrait plus sur personne.
  //
  // Retenu : ÷ 10. Les quatorze valeurs sont des multiples de 100, la division
  // est donc exacte, et l'ordre relatif du relevé est conservé.
  const secondes = {};
  for (const [id, u] of Object.entries(UNITES)) {
    assert.equal(RELEVE[id].mun % 100, 0, `${id} : munitions non multiples de 100`);
    assert.equal(u.reserve * 10, RELEVE[id].mun, `${id} : réserve = munitions ÷ 10`);
    // Un tir par tick, 10 ticks par seconde.
    secondes[id] = u.reserve / 10;
  }

  const dureeRaid = TICKS_MAX_COMBAT / 10;
  assert.equal(dureeRaid, 90);
  for (const [id, s] of Object.entries(secondes)) {
    assert.ok(s <= dureeRaid, `${id} : ${s} s de tir pour un raid de ${dureeRaid} s`);
  }

  // La plage obtenue : de 4 s à 50 s, contre 15 à 30 s avant la conversion.
  // ⚠ Le §6 du brief annonce « de 7 s pour le Guetteur à 50 s pour les
  // Fouisseurs ». Le plancher est bien celui du Guetteur, mais il vaut 4 s et
  // non 7 : 400 munitions ÷ 10 = 40 de réserve, soit 4 s. Les 7 s sont celles
  // du Fusilier (700 ÷ 10 = 70). Et le plafond de 50 s est partagé par les
  // Fouisseurs ET le Pilon, tous deux à 5 000 munitions. Consigné au rapport.
  const valeurs = Object.values(secondes);
  assert.equal(Math.min(...valeurs), 4);
  assert.equal(Math.max(...valeurs), 50);
  assert.equal(secondes.guetteur, 4, 'le plancher, et c\'est bien le Guetteur');
  assert.equal(secondes.meute, 7, 'les 7 s du brief sont celles du Fusilier');
  assert.deepEqual(
    Object.keys(secondes).filter((id) => secondes[id] === 50).sort(),
    ['fouisseurs', 'pilon'],
  );

  // Et le plancher de 10 % mord bien : il vaut au moins 1 pour les quatorze,
  // donc aucune n'échappe à la règle par un arrondi à zéro.
  for (const [id, u] of Object.entries(UNITES)) {
    assert.ok(Math.floor(u.reserve * 0.1) >= 1, `${id} : plancher nul, la règle ne mord pas`);
  }
});
