// Lot AVARIES — 20/09/2026.
//
// Les deux grosses bases de l'Ouvrage n'avaient qu'un état. Les sites d'une case
// en portent quatre depuis les lots EMBLÈMES-ABÎMÉS et CONQUÊTE-24H ; sur les
// SEPT bases que le joueur doit casser pour finir la partie, il n'avait aucun
// moyen de voir ce qu'il avait déjà entamé.
//
// ⚠⚠ TROIS TESTS, ET LE TROISIÈME GARDE UN DÉFAUT QUE LE LOT VERROUS AVAIT
// LAISSÉ PASSER. `sitesDeLaFenetre` ne poussait que la base finale : les six
// verrous existaient dans le modèle et n'étaient dessinés nulle part. Aucun
// test ne tombait, la carte s'affichait, et la seule façon de s'en apercevoir
// était de regarder le haut de la carte.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SPRITES_GROSSE_BASE, spriteDeLaGrosseBase, spriteDeLaGrosseRuine,
  dessinerGrosseBase, cotesDuSite,
} from '../src/render/embleme.js';
import { AVARIE } from '../src/sim/site-entame.js';
import { GEOGRAPHIE } from '../src/data/sites.js';
import { grossesBasesDeLaCarte, positionBaseTerminale } from '../src/sim/carte.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Les quatre états d'une grosse base, du sain à la ruine. */
const ETATS = ['aucune', 'fumee', 'feu', 'ruine'];

/** Le nom du sprite d'un état — la ruine ne passe pas par l'avarie. */
function nomDuSprite(cotes, etat) {
  return etat === 'ruine' ? spriteDeLaGrosseRuine(cotes) : spriteDeLaGrosseBase(cotes, etat);
}

// ---------------------------------------------------------------------------
// T1 — les huit sprites existent, et les quatre états d'une base sont distincts
// ---------------------------------------------------------------------------

test('EMB-AV T1 — chaque grosse base a ses quatre états, tous distincts', () => {
  const dossier = join(RACINE, 'art', 'sprites', 'carte', '128');
  const surLeDisque = new Set(readdirSync(dossier));

  // ⚠ LE MONTAGE D'ABORD : deux emprises, sans quoi la boucle ci-dessous
  // balaierait le vide et passerait.
  const cotes = Object.keys(SPRITES_GROSSE_BASE).map(Number);
  assert.deepEqual(cotes.slice().sort(), [2, 3], 'les emprises de grosse base ont changé');

  const tous = new Set();
  for (const c of cotes) {
    for (const etat of ETATS) {
      const nom = nomDuSprite(c, etat);
      assert.ok(surLeDisque.has(`${nom}.webp`),
        `« ${nom}.webp » manque dans carte/128`);
      tous.add(nom);
    }
  }
  // ⚠⚠ FALSIFIABLE, ET C'EST LE POINT : une fonction qui rendrait TOUJOURS le
  // nom du sain passerait toutes les assertions ci-dessus. Huit noms distincts
  // pour deux emprises × quatre états — pas sept, pas deux.
  assert.equal(tous.size, cotes.length * ETATS.length,
    `${tous.size} noms distincts pour ${cotes.length * ETATS.length} sprites attendus`);

  // ⚠ LES SUFFIXES SONT CEUX DES SITES D'UNE CASE, pas une seconde convention.
  assert.equal(spriteDeLaGrosseBase(3, 'aucune'), 'base_o_3x3');
  assert.equal(spriteDeLaGrosseBase(3, 'fumee'), 'base_o_3x3_fumee');
  assert.equal(spriteDeLaGrosseBase(3, 'feu'), 'base_o_3x3_feu');
  assert.equal(spriteDeLaGrosseRuine(3), 'base_o_3x3_ruine');

  // ⚠ ET LES ÉTATS VIENNENT D'`AVARIE`, pas d'une liste écrite ici. Si le
  // modèle en ajoutait un cinquième, ce test le dirait plutôt que de l'ignorer.
  for (const valeur of Object.values(AVARIE)) {
    assert.ok(ETATS.includes(valeur),
      `l'état « ${valeur} » d'AVARIE n'a pas de sprite de grosse base`);
  }

  // Une avarie inconnue LÈVE plutôt que de rendre le sain en silence.
  assert.throws(() => spriteDeLaGrosseBase(3, 'pulverisee'), /avarie inconnue/);
  assert.throws(() => spriteDeLaGrosseBase(4, 'aucune'), /pas de grosse base/);
});

// ---------------------------------------------------------------------------
// T2 — l'état voyage jusqu'au dessin, et le livrable le porte
// ---------------------------------------------------------------------------

test('EMB-AV T2 — l\'état traverse `dessinerGrosseBase` et entre dans le livrable', () => {
  const site = positionBaseTerminale();

  // ⚠⚠ SANS CE PASSAGE, LE CÂBLAGE SERAIT COMPLET CÔTÉ CHAÎNE GRAPHIQUE ET MUET
  // À L'ÉCRAN : les huit sprites au dépôt, les huit dans le livrable, et un
  // verrou à moitié cassé dessiné intact. C'est la faute que le lot
  // EMBLÈMES-ABÎMÉS a déjà payée sur les sites d'une case.
  const vus = new Set();
  for (const etat of ETATS) {
    const d = dessinerGrosseBase(3, site, 64, { x: 0, y: 0 }, etat);
    assert.equal(d.nom, nomDuSprite(3, etat), `l'état « ${etat} » ne transporte pas son nom`);
    assert.equal(d.cote, 64 * 3, 'l\'emprise a changé avec l\'état');
    vus.add(d.nom);
  }
  assert.equal(vus.size, ETATS.length, 'deux états rendent le même sprite');

  // ⚠ LE DÉFAUT EST LE SAIN : tout appelant d'avant le lot rend le nom d'avant.
  assert.equal(dessinerGrosseBase(3, site, 64, { x: 0, y: 0 }).nom, 'base_o_3x3');

  // ⚠⚠ ET LES HUIT ENTRENT VRAIMENT DANS LE LIVRABLE. Un marqueur resté en clair
  // dans la page est une image VIDE, sans erreur et sans rien dans la console :
  // on le mesure sur le fichier bâti, pas sur la table qui le fabrique.
  //
  // ⚠⚠ CETTE ASSERTION-CI NE PEUT PAS TOMBER SUR UN ÉTAT D'AUJOURD'HUI, ET ON
  // LE DÉCLARE PLUTÔT QUE DE LA COMPTER. Falsification jouée : retirer les six
  // états de la table de `tools/build.js` laisse ce test VERT — parce que le
  // BUILD lève d'abord, « ressource référencée au lieu d'être inlinée », et que
  // `dist/` garde alors le livrable d'avant. La garde offline est donc la vraie
  // protection ; celle-ci est une seconde ligne, qui mordrait le jour où un
  // marqueur serait substitué par du vide plutôt que laissé en clair.
  //
  // ⚠ LA FALSIFICATION QUI MORD, ELLE, EST PLUS BAS : retirer une BALISE du
  // HTML fait tomber la boucle des identifiants.
  const page = readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8');
  const livrable = readFileSync(join(RACINE, 'dist', 'index.html'), 'utf8');
  for (const c of Object.keys(SPRITES_GROSSE_BASE).map(Number)) {
    for (const suffixe of ['', '_FUMEE', '_FEU', '_RUINE']) {
      const marqueur = `%BASE_O_${c}X${c}${suffixe}%`;
      assert.ok(page.includes(marqueur), `${marqueur} n'est pas déclaré dans le HTML source`);
      assert.ok(!livrable.includes(marqueur), `${marqueur} survit au build : image vide`);
    }
  }

  // ⚠ ET CHAQUE SPRITE A SA BALISE, sous l'identifiant que `ui/monde.js`
  // fabrique. Une balise manquante rend `undefined` à `drawImage`, qui LÈVE —
  // et une levée dans la boucle de dessin vide tout l'écran Monde.
  const ecran = readFileSync(join(RACINE, 'src', 'ui', 'monde.js'), 'utf8');
  assert.match(ecran, /monde-base-\$\{nom\.replace\('base_o_', ''\)\.replace\(\/_\/g, '-'\)\}/,
    'ui/monde.js ne dérive plus l\'identifiant des balises depuis le nom du sprite');
  for (const c of Object.keys(SPRITES_GROSSE_BASE).map(Number)) {
    for (const etat of ETATS) {
      const nom = nomDuSprite(c, etat);
      const id = `monde-base-${nom.replace('base_o_', '').replace(/_/g, '-')}`;
      assert.ok(page.includes(`id="${id}"`), `le HTML ne porte pas la balise « ${id} »`);
    }
  }
});

// ---------------------------------------------------------------------------
// T3 — les sept grosses bases sont DESSINÉES (correction d'un trou de VERROUS)
// ---------------------------------------------------------------------------

test('EMB-AV T3 — les sept grosses bases portent une avarie, et la carte les dessine', async () => {
  // ⚠⚠ CE TEST EXISTE PARCE QUE LE LOT VERROUS A LAISSÉ UN TROU, et qu'aucun
  // test ne le disait. `sitesDeLaFenetre` poussait la base finale et ELLE SEULE :
  // les six verrous existaient dans le modèle — `siteDeLaCase` les rendait,
  // `problemesDuRaid` les gardait, le peuplement les excluait — et n'étaient
  // dessinés nulle part. Le joueur ne pouvait ni les voir, ni les viser, ni donc
  // ouvrir la base finale.
  const { sitesDeLaFenetre } = await import('../src/ui/monde.js');
  const { creerEtat } = await import('../src/sim/state.js');

  const etat = creerEtat(77);
  const sites = sitesDeLaFenetre(etat, {
    premiereRangee: 1, derniereRangee: GEOGRAPHIE.carte.hauteur,
    premiereColonne: 1, derniereColonne: GEOGRAPHIE.carte.largeur,
  });

  const grosses = sites.filter((s) => cotesDuSite(s.type) !== null);
  assert.equal(grosses.length, 1 + GEOGRAPHIE.verrous.nombre,
    `${grosses.length} grosses bases dessinées sur ${1 + GEOGRAPHIE.verrous.nombre}`);
  assert.deepEqual(
    grosses.map((g) => `${g.type} ${g.rangee},${g.colonne}`).sort(),
    grossesBasesDeLaCarte().map((g) => `${g.type} ${g.rangee},${g.colonne}`).sort(),
    'les grosses bases dessinées ne sont pas celles de la carte');

  // ⚠⚠ ET CHACUNE PORTE UNE AVARIE, ce qui est l'autre moitié : sans le champ,
  // `dessinerGrosse` retomberait sur « aucune » pour toutes, et les six états
  // seraient du poids mort dans le livrable.
  for (const g of grosses) {
    assert.ok(Object.values(AVARIE).includes(g.avarie),
      `« ${g.type} » en (${g.rangee}, ${g.colonne}) porte l'avarie « ${g.avarie} »`);
  }
  // Sur une partie neuve, aucune n'est entamée — et c'est le témoin qui dit que
  // le champ vaut quelque chose plutôt que d'être toujours rempli au hasard.
  assert.ok(grosses.every((g) => g.avarie === AVARIE.AUCUNE),
    'une grosse base est entamée sur une partie neuve');
});
