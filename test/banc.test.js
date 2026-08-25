// Tests T8 et T10 du brief du lot 3A, plus les balayages de la relecture §11 :
// palette stricte, aucun Math.random dans src/, registres de noms.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  montageDuBanc, executerRaidComplet, nomAffiche,
  formaterPointsMilli, formaterPv, LIBELLES_CAUSE, DPR_MAX,
} from '../src/ui/banc.js';
import { creerCombat, CAUSES } from '../src/sim/combat.js';
import { PROFILS_ASSAUT, EMPLACEMENTS_ASSAUT } from '../src/data/sites.js';
import { DEFENSES } from '../src/data/combat.js';
import { PREREGLAGES, montagePreregle } from './prereglages-lot3a.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Retire commentaires de ligne, de bloc et HTML avant un balayage de code. */
function sansCommentaires(texte) {
  return texte
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

/** Tous les fichiers .js sous un dossier, récursivement. */
function fichiersJs(dossier) {
  return readdirSync(join(RACINE, dossier), { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.js'))
    .map((e) => join(e.parentPath, e.name));
}

// ---------------------------------------------------------------------------
// Préréglages et montage du banc
// ---------------------------------------------------------------------------

test('banc — les trois profils passent creerCombat sur des sites variés', () => {
  assert.deepEqual(Object.keys(PREREGLAGES), ['infanterie', 'blindeLourd', 'mixte']);
  assert.deepEqual(Object.keys(PROFILS_ASSAUT), ['infanterie', 'blindeLourd', 'mixte']);
  for (const assaut of Object.keys(PROFILS_ASSAUT)) {
    for (const [type, niveau, saveur] of [
      ['camp', 5, 'richeQuartz'], ['avantPoste', 30, 'richeScorie'], ['base', 50, null],
    ]) {
      const montage = montageDuBanc({ type, niveau, saveur, graine: 3, assaut });
      assert.doesNotThrow(() => creerCombat(montage), `${assaut} sur ${type} ${niveau}`);
      // ⚠ SEUIL RÉÉCRIT AU LOT 4B. Les préréglages figés portaient toujours 3 ou
      // 4 vagues ; un assaut budgété en porte de 1 à 4 selon ce que le budget
      // permet — une seule vague au niveau 5, où 45 points n'achètent que neuf
      // Fusiliers. Ce que le test doit tenir est le PLAFOND, pas un plancher
      // arbitraire : au plus 4 vagues, au plus 9 par vague.
      assert.ok(montage.vagues.length >= 1 && montage.vagues.length <= EMPLACEMENTS_ASSAUT.vagues,
        `${assaut} sur ${type} ${niveau} : ${montage.vagues.length} vagues`);
      for (const vague of montage.vagues) {
        assert.ok(vague.length >= 1 && vague.length <= EMPLACEMENTS_ASSAUT.parVague);
      }
      // Et le budget est tenu, ce qu'aucun préréglage ne garantissait.
      assert.ok(montage.assaut.pointsEngages <= montage.assaut.budgetPoints);
    }
  }
  assert.throws(
    () => montageDuBanc({ type: 'camp', niveau: 5, saveur: null, graine: 1, assaut: 'horde' }),
    /profil d'assaut inconnu/,
  );
  // Le témoin historique du lot 3A vit hors de `src/` et refuse le même nom
  // inconnu — c'est lui qui porte encore le mot « préréglage ».
  assert.throws(
    () => montagePreregle({ type: 'camp', niveau: 5, saveur: null, graine: 1, assaut: 'horde' }),
    /préréglage d'assaut inconnu/,
  );
});

// ---------------------------------------------------------------------------
// T8 — rejouabilité
// ---------------------------------------------------------------------------

test('T8 — mêmes paramètres, même graine : exactement le même raid', () => {
  const parametres = { type: 'avantPoste', niveau: 15, saveur: 'richeQuartz', graine: 42, assaut: 'mixte' };
  const a = executerRaidComplet(parametres);
  const b = executerRaidComplet(parametres);
  // Même nombre de ticks, même cause de fin, même butin, mêmes points de
  // recherche — les quatre chiffres du panneau de fin, à l'identique.
  assert.equal(a.nbTicks, b.nbTicks);
  assert.equal(a.cause, b.cause);
  assert.deepEqual(a.butin, b.butin);
  assert.equal(a.pointsRechercheMilli, b.pointsRechercheMilli);
  assert.ok(CAUSES.includes(a.cause));
  assert.ok(a.nbTicks > 0 && a.nbTicks <= 900);
  // Et l'état final entier, entité par entité — pas seulement les totaux.
  assert.deepEqual(a.resultat, b.resultat);

  // La vitesse ne change RIEN au résultat : elle divise l'intervalle réel
  // entre deux ticks, pas la simulation. Un raid à ×4 rend le même état final.
  const rapide = executerRaidComplet(parametres, { vitesse: 4 });
  assert.deepEqual(rapide.resultat, a.resultat);

  // Une autre graine rend un autre site, donc (presque sûrement) un autre
  // déroulé — vérifié sur cinq graines : au moins deux résultats distincts.
  const empreintes = new Set([1, 2, 3, 4, 5].map((graine) => JSON.stringify(
    executerRaidComplet({ ...parametres, graine }).butin,
  )));
  assert.ok(empreintes.size > 1, 'cinq graines ne devraient pas rendre cinq butins identiques');
});

// ---------------------------------------------------------------------------
// Registres de noms et formats du panneau
// ---------------------------------------------------------------------------

test('banc — deux jeux de noms, jamais mélangés, et des causes toutes libellées', () => {
  // ⚠ LA CLÉ EST LE PROPRIÉTAIRE, PAS LE CAMP — changement du 25/08/2026. Le
  // camp désigne un côté de la grille, le propriétaire désigne à qui c'est. Les
  // deux se confondaient tant que seul l'Ouvrage défendait ; le jour où le
  // joueur garnit sa base, ses unités passent camp « defense » sans changer de
  // propriétaire, et c'est le propriétaire qui doit décider du nom.
  //
  // Le CROISEMENT est ce qui prouve le changement de clé : la même ligne de
  // données rend les quatre combinaisons, et un seul des quatre suffirait à
  // passer avec l'ancienne implémentation.
  const u = (camp, proprietaire, id) => nomAffiche({ genre: 'unite', camp, proprietaire, id });
  assert.equal(u('attaque', 'joueur', 'meute'), 'Fusiliers');
  assert.equal(u('defense', 'ouvrage', 'meute'), 'Meute');
  assert.equal(u('defense', 'joueur', 'meute'), 'Fusiliers', 'le joueur garnit sa propre base');
  assert.equal(u('attaque', 'ouvrage', 'meute'), 'Meute', 'l\'Ouvrage attaque le joueur');
  assert.equal(u('attaque', 'joueur', 'broyeur'), 'Percheron');

  // Les DÉFENSES ont deux noms depuis le 25/08 : neuf couples, tous distincts.
  const d = (proprietaire, id) => nomAffiche({ genre: 'defense', camp: 'defense', proprietaire, id });
  assert.equal(d('ouvrage', 'casemate'), 'Casemate');
  assert.equal(d('joueur', 'casemate'), 'Tourelle mitrailleuse');
  assert.equal(d('ouvrage', 'harpon'), 'Harpon');
  assert.equal(d('joueur', 'harpon'), 'SAM');
  for (const id of Object.keys(DEFENSES)) {
    assert.ok(Object.prototype.hasOwnProperty.call(DEFENSES[id].nom, 'ouvrage'), `${id}.nom.ouvrage`);
    assert.ok(Object.prototype.hasOwnProperty.call(DEFENSES[id].nom, 'joueur'), `${id}.nom.joueur`);
  }
  const cotes = Object.values(DEFENSES).map((x) => x.nom.joueur);
  assert.equal(new Set(cotes).size, cotes.length, 'les neuf noms joueur sont distincts');

  // Un bâtiment n'a qu'un nom : une Souche est une Souche des deux côtés.
  assert.equal(nomAffiche({ genre: 'batiment', camp: 'defense', proprietaire: 'ouvrage', id: 'souche' }), 'Souche');
  assert.equal(nomAffiche({ genre: 'batiment', camp: 'defense', proprietaire: 'joueur', id: 'souche' }), 'Souche');

  // Chaque cause du moteur a son libellé de panneau — aucune fin muette.
  for (const cause of CAUSES) {
    assert.equal(typeof LIBELLES_CAUSE[cause], 'string', `cause « ${cause} » sans libellé`);
  }

  // Les milli-points BigInt se formatent sans jamais passer par Number :
  // 12 345 milli-points → « 12,345 » ; 999 → « 0,999 » ; et un nombre
  // au-delà de l'entier sûr reste exact — 2^60 = 1152921504606846976 milli
  // → « 1152921504606846,976 ».
  assert.equal(formaterPointsMilli(12_345n), '12,345');
  assert.equal(formaterPointsMilli(999n), '0,999');
  assert.equal(formaterPointsMilli(2n ** 60n), '1152921504606846,976');

  // Les PV s'affichent à la même précision en courant et en maximum — deux
  // arrondis différents feraient croire à des PV au-dessus du plafond.
  // 2 897 400 milli-PV → « 2897,4 » ; 499 → « 0,4 » (plancher, pas d'arrondi
  // au supérieur qui ressusciterait un mourant à l'écran).
  assert.equal(formaterPv(2_897_400), '2897,4');
  assert.equal(formaterPv(499), '0,4');
  assert.equal(formaterPv(100_000), '100,0');
});

// ---------------------------------------------------------------------------
// §11 — balayages de la relecture
// ---------------------------------------------------------------------------

test('§11 — aucun Math.random nulle part dans src/, DOM confiné à ui/', () => {
  const fichiers = [
    ...fichiersJs('src'),
    join(RACINE, 'src', 'index.src.html'),
  ];
  assert.ok(fichiers.length >= 15, `montage cassé : ${fichiers.length} fichiers balayés`);
  for (const fichier of fichiers) {
    const code = sansCommentaires(readFileSync(fichier, 'utf8'));
    assert.ok(!code.includes('Math.random'), `Math.random dans ${fichier}`);
    // La graine est saisie, jamais tirée — et l'horloge murale n'entre pas
    // dans le banc : le temps vient des horodatages de requestAnimationFrame.
    assert.ok(!/Date\s*\.\s*now/.test(code), `horloge murale dans ${fichier}`);
  }
  // Le DOM est confiné : render/ n'y touche jamais, ni au chargement ni après.
  for (const fichier of fichiersJs('src/render')) {
    const code = sansCommentaires(readFileSync(fichier, 'utf8'));
    for (const interdit of ['document', 'window', 'requestAnimationFrame', 'devicePixelRatio']) {
      assert.ok(!code.includes(interdit), `${fichier} touche au DOM : ${interdit}`);
    }
  }
  assert.equal(DPR_MAX, 2, 'le buffer se plafonne à DPR 2');
});

test('§11 — aucune teinte hors de la palette de FICHE-STYLE.md', () => {
  // La palette de la fiche, transcrite ici indépendamment de scene.js pour
  // que le test ne valide pas le module avec lui-même.
  const FICHE = new Set([
    '#161914', '#343A2C', '#4E5742', '#6A7658', '#8C9A72', // châssis kaki
    '#1E2124', '#3E454C', '#68727E', //                       métal
    '#928E80', '#F5F3E8', '#8A1E17', '#E43E32', '#A67018', '#F5B636', // accents
  ].map((h) => h.toUpperCase()));
  const fichiers = [
    ...fichiersJs('src/render'),
    ...fichiersJs('src/ui'),
    join(RACINE, 'src', 'index.src.html'),
  ];
  let trouvees = 0;
  for (const fichier of fichiers) {
    const texte = readFileSync(fichier, 'utf8');
    for (const [hex] of texte.matchAll(/#[0-9A-Fa-f]{6}(?![0-9A-Za-z])/g)) {
      trouvees += 1;
      assert.ok(FICHE.has(hex.toUpperCase()), `teinte hors fiche dans ${fichier} : ${hex}`);
    }
    // La seule valeur non-hex admise est l'ombre portée de la fiche.
    for (const [rgba] of texte.matchAll(/rgba?\([^)]*\)/g)) {
      assert.equal(rgba, 'rgba(0,0,0,0.31)', `rgba hors fiche dans ${fichier} : ${rgba}`);
    }
  }
  // Le balayage doit avoir réellement vu des couleurs, sinon il ne prouve rien.
  assert.ok(trouvees > 30, `seulement ${trouvees} teintes balayées`);
});

// ---------------------------------------------------------------------------
// T10 — le build reste hors ligne
// ---------------------------------------------------------------------------

test('T10 — npm run build passe et le HTML produit ne référence rien d\'extérieur', () => {
  // La garde de tools/build.js sort en erreur sur toute référence externe :
  // un code de sortie 0 est déjà une preuve. On refait le contrôle ici,
  // indépendamment, sur le fichier produit.
  execFileSync('node', [join(RACINE, 'tools', 'build.js')], { stdio: 'pipe' });
  const chemin = join(RACINE, 'dist', 'index.html');
  const html = readFileSync(chemin, 'utf8');

  assert.ok(!/https?:\/\//i.test(html), 'URL réseau dans le HTML final');
  for (const [, valeur] of html.matchAll(/<[^>]+\b(?:src|href)\s*=\s*["']([^"']*)["']/gi)) {
    assert.ok(valeur.startsWith('data:') || valeur.startsWith('#'),
      `ressource externe : ${valeur}`);
  }
  // Le banc y est réellement embarqué : ses contrôles et son canvas.
  for (const attendu of ['banc-canvas', 'banc-graine', 'banc-lancer', 'banc-pas']) {
    assert.ok(html.includes(attendu), `élément « ${attendu} » absent du HTML final`);
  }
  // Taille consignée au rapport ; borne large pour attraper une explosion.
  const octets = statSync(chemin).size;
  assert.ok(octets > 20_000 && octets < 200_000, `taille inattendue : ${octets} octets`);
});

// ---------------------------------------------------------------------------
// T16 — la page porte les éléments du mode Défense
// ---------------------------------------------------------------------------

test('T16 — le HTML produit porte le bloc Défense, sa palette et son sélecteur', () => {
  // ⚠ Le brief dit « étendre la boucle du T10 », mais il attend AUSSI un total
  // de 150 et « aucun des 148 tests d'avant retouché ». Les deux ne tiennent
  // qu'en écrivant un test à part : T10 reste intact, et le compte monte d'un.
  //
  // C'est peu de chose, et c'est exactement ce qui attrape un bloc oublié au
  // build — un `hidden` mal recopié, un id renommé d'un côté seulement, ou un
  // bout de page tombé du bundle. Le mode Défense est INVISIBLE tant qu'on ne
  // clique pas : rien d'autre ici ne le verrait manquer.
  const chemin = join(RACINE, 'dist', 'index.html');
  const html = readFileSync(chemin, 'utf8');
  for (const attendu of ['banc-defense', 'banc-defense-ouvrir', 'banc-palette-defense',
    'banc-compteur-defense', 'banc-sens']) {
    assert.ok(html.includes(attendu), `élément « ${attendu} » absent du HTML final`);
  }
  // Les deux sens du sélecteur, et `raid` par défaut : c'est la première
  // option qui gagne, faute de `selected`.
  const options = [...html.matchAll(/<option value="(raid|defense)"/g)].map((m) => m[1]);
  assert.deepEqual(options, ['raid', 'defense'], 'les deux sens, raid en premier');
});
