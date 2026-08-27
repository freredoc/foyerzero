// L'écran Offense — ce qui se vérifie sans écran.
//
// Comme pour l'écran Chantier : le dépôt n'a ni jsdom ni navigateur, donc ce qui
// est testé ici, ce sont les fonctions PURES et le balisage du HTML produit. Le
// reste se vérifie à la main sur appareil, et un test appareil non exécuté se
// déclare NON EXÉCUTÉ.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { vagueDAssaut, vaguesDAssaut, unitesDeLaPalette } from '../src/ui/offense.js';
import { NB_VAGUES, NB_COLONNES, NB_EMPLACEMENTS, budgetDuNiveau } from '../src/ui/arsenal.js';
import { EMPLACEMENTS_ASSAUT, POINTS_ARMEE } from '../src/data/sites.js';
import { GRILLE, UNITES } from '../src/data/combat.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

test('offense — trente-six emplacements, comptés depuis la table', () => {
  // ⚠ NI 4 NI 9 NI 36 NE SONT ÉCRITS DANS L'ÉCRAN. Ils viennent
  // d'`EMPLACEMENTS_ASSAUT`, que `ui/arsenal.js` lit déjà : une seconde table
  // dirait un jour autre chose que la première.
  assert.equal(NB_VAGUES, EMPLACEMENTS_ASSAUT.vagues);
  assert.equal(NB_COLONNES, EMPLACEMENTS_ASSAUT.parVague);
  assert.equal(NB_EMPLACEMENTS, EMPLACEMENTS_ASSAUT.vagues * EMPLACEMENTS_ASSAUT.parVague);
  // La donnée était là avant la question : quatre vagues de neuf, trente-six.
  assert.equal(NB_EMPLACEMENTS, 36);

  // Les colonnes de l'assaut SONT celles du champ de bataille — aucune unité ne
  // change de colonne pendant un raid. C'est l'invariant du lot 5A, et il rend
  // la largeur non négociable.
  assert.equal(NB_COLONNES, GRILLE.largeur);
});

test('offense — les vagues suivantes partent décalées, de l\'intervalle de la table', () => {
  const vagues = vaguesDAssaut();
  assert.equal(vagues.length, NB_VAGUES);

  // La première part à l'instant zéro, et son titre ne porte donc pas de retard.
  assert.equal(vagues[0].decalageSec, 0);
  assert.equal(vagues[0].titre, 'Vague d\'attaque 1');
  assert.ok(!vagues[0].titre.includes('+'), 'la première vague affiche un retard');

  // Chaque suivante part un intervalle plus tard que la précédente.
  for (let i = 1; i < vagues.length; i++) {
    assert.equal(vagues[i].decalageSec - vagues[i - 1].decalageSec, GRILLE.intervalleVagueSec);
    assert.ok(vagues[i].titre.includes(`+${vagues[i].decalageSec} s`), vagues[i].titre);
  }

  // ⚠ L'INTERVALLE EST LU, PAS RECOPIÉ D'UNE CAPTURE. La capture de référence
  // fournie avec l'amendement affiche « +10 s » sur la deuxième vague ; la table
  // du dépôt dit 5. C'est un autre jeu. Le test asserte la table, et l'écart est
  // signalé au rapport plutôt que tranché ici.
  assert.equal(GRILLE.intervalleVagueSec, 5);
  assert.equal(vagues[1].titre, 'Vague d\'attaque 2 (+5 s)');
  assert.equal(vagues[3].decalageSec, 3 * GRILLE.intervalleVagueSec);

  // Hors des quatre, ça lève : une cinquième vague n'existe pas.
  assert.throws(() => vagueDAssaut(0), /hors de/);
  assert.throws(() => vagueDAssaut(NB_VAGUES + 1), /hors de/);
});

test('offense — la palette porte le roster entier, sous les noms du JOUEUR', () => {
  const palette = unitesDeLaPalette();

  // Toutes les unités, et rien d'autre.
  assert.deepEqual(palette.map((u) => u.id).sort(), Object.keys(UNITES).sort());
  assert.ok(palette.length > 10, `${palette.length} unités : le montage ne mesure rien`);

  // ⚠ `nom.joueur`, JAMAIS `nom.ouvrage`. C'est un panneau du joueur, qui emploie
  // le vocabulaire d'une armée régulière ; l'Ouvrage a le sien. Les mélanger
  // dans une chaîne affichée est interdit (CLAUDE.md §4), et le croisement est
  // ce qui le prouve : les deux jeux de noms doivent être DIFFÉRENTS ici.
  const nomsOuvrage = new Set(Object.values(UNITES).map((u) => u.nom.ouvrage));
  for (const u of palette) {
    assert.equal(u.nom, UNITES[u.id].nom.joueur);
    assert.ok(!nomsOuvrage.has(u.nom), `« ${u.nom} » est un nom de l'Ouvrage`);
    assert.equal(u.points, UNITES[u.id].points);
    assert.ok(u.points > 0);
  }
  // Falsifiable : si les deux registres étaient identiques, la garde ci-dessus
  // ne prouverait rien.
  assert.notDeepEqual(
    palette.map((u) => u.nom), Object.values(UNITES).map((u) => u.nom.ouvrage),
  );

  // ⚠ LA PALETTE N'EST PAS FILTRÉE PAR NIVEAU, et c'est délibéré.
  // `unitesDisponibles(niveau)` de l'Arsenal ne montre que `apparition <= niveau`
  // — mais le joueur n'A PAS de niveau d'armée, c'est l'un des deux que `sim/`
  // ne porte pas. En choisir un pour pouvoir filtrer reviendrait à l'inventer.
  const verrouillees = palette.filter((u) => UNITES[u.id].apparition > 1);
  assert.ok(verrouillees.length > 0, 'aucune unité verrouillée : le filtrage ne se voit pas');
});

test('offense — le budget dépend d\'un niveau que la partie ne porte pas', () => {
  // Le budget se CALCULE, mais seulement si on a un niveau — et on n'en a pas.
  // C'est pour ça que l'en-tête affiche « — » plutôt qu'un nombre : il n'y a
  // aucune valeur juste à mettre là.
  assert.equal(budgetDuNiveau(1), POINTS_ARMEE.offense.base + POINTS_ARMEE.offense.parNiveau);
  assert.ok(budgetDuNiveau(50) > budgetDuNiveau(1), 'le budget doit dépendre du niveau');
  // Et il n'existe aucun niveau par défaut à lui passer : la fonction refuse.
  assert.throws(() => budgetDuNiveau(0), /hors de/);
  assert.throws(() => budgetDuNiveau(null), /hors de/);
});

test('offense — le HTML produit porte l\'écran, ses deux portes, et rien d\'actif', () => {
  const html = readFileSync(join(RACINE, 'dist', 'index.html'), 'utf8');
  for (const attendu of [
    'ecran-offense', 'offense-tete', 'offense-vers-chantier', 'offense-niveau',
    'offense-points', 'offense-avis', 'offense-vagues', 'offense-palette',
    'chantier-vers-offense',
  ]) {
    assert.ok(html.includes(attendu), `élément « ${attendu} » absent du HTML final`);
  }
  // Le jeu s'ouvre sur la Base : l'écran Offense part caché.
  assert.ok(/<div id="ecran-offense" hidden>/.test(html), 'l\'écran Offense n\'est pas caché');
  assert.ok(!/<div id="ecran-chantier" hidden>/.test(html), 'l\'écran Chantier part caché');

  // Un mot dit que la composition n'existe pas encore — sans quoi trente-six
  // cases vides passeraient pour un écran cassé plutôt que pour une place tenue.
  assert.ok(/La composition d'armée n'existe pas encore/.test(html),
    'rien ne dit que la composition d\'armée n\'existe pas');

  // ⚠ LA BARRE DU BAS NE PROPOSE PLUS « ASSAUT » comme une bande. Le mot désigne
  // un écran maintenant ; le laisser sur un bouton qui fait défiler vers deux
  // rangées de sol nu était la faute qu'on répare.
  assert.ok(!/>Assaut</.test(html), 'un bouton « Assaut » traîne encore dans la page');
});

test('offense — changer d\'écran n\'arrête PAS la boucle de jeu', () => {
  // ⚠ CE TEST LIT LA SOURCE, ET C'EST ASSUMÉ. Le comportement se prouverait sur
  // appareil (vérification n° 11) ; ce qu'on peut faire ici, c'est garder
  // l'erreur précise contre laquelle l'amendement met en garde — brancher la
  // navigation interne sur `suspendre()` / `reprendre()`, qui existent pour le
  // BANC et pour le masquage de l'application.
  //
  // Le défaut serait INVISIBLE à l'œil : au retour, le rattrapage par l'horloge
  // murale rendrait les ressources manquantes, si bien que le gel ne se lirait
  // que sur un chronomètre. C'est exactement le genre de faute qui mérite un
  // garde-fou plutôt qu'une relecture.
  const source = readFileSync(join(RACINE, 'src', 'ui', 'session.js'), 'utf8');
  const lignesDeNavigation = source.split('\n')
    .filter((l) => l.includes('chantier-vers-offense') || l.includes('offense-vers-chantier'));
  assert.equal(lignesDeNavigation.length, 2, 'les deux portes doivent être câblées, une chacune');
  for (const ligne of lignesDeNavigation) {
    assert.ok(ligne.includes('montrerEcran'), `porte non câblée : ${ligne.trim()}`);
    assert.ok(!ligne.includes('suspendre'), `la navigation gèle le jeu : ${ligne.trim()}`);
    assert.ok(!ligne.includes('reprendre'), `la navigation gèle le jeu : ${ligne.trim()}`);
  }
  // Falsifiable : le motif doit attraper une vraie faute.
  const appat = "$('chantier-vers-offense').addEventListener('click', () => { suspendre(); });";
  assert.ok(appat.includes('suspendre'), 'le montage n\'attraperait pas la faute');

  // Et les deux fonctions existent bien, sinon le test passerait sur un fichier
  // qui ne les a jamais eues.
  assert.ok(/function suspendre\(/.test(source));
  assert.ok(/function reprendre\(/.test(source));
});
