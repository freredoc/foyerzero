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

/**
 * Le HTML produit, commentaires HTML et CSS ôtés.
 *
 * ⚠ IL EN FAUT UN, ET LA LEÇON EST DÉJÀ PAYÉE. Au lot PANNEAU-ET-MARGES, une
 * garde cherchait `viewport-fit=cover` dans le HTML brut et le trouvait dans le
 * paragraphe qui l'explique : retirer la balise laissait le test VERT. Ici
 * c'est le commentaire qui RACONTE la disparition de l'ancien en-tête qui
 * ferait échouer la garde. Une garde ne doit lire que du code.
 */
function pageSansCommentaires() {
  return readFileSync(join(RACINE, 'dist', 'index.html'), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

test('offense — le HTML produit porte l\'écran, et il n\'a plus d\'en-tête à lui', () => {
  const html = pageSansCommentaires();
  for (const attendu of ['ecran-offense', 'offense-avis', 'offense-vagues', 'offense-palette']) {
    assert.ok(html.includes(attendu), `élément « ${attendu} » absent du HTML final`);
  }

  // ⚠ SON EN-TÊTE ET SA BARRE SONT PARTIS (28/08), et c'est le lot MISE EN PAGE.
  // Il portait un titre, deux chiffres d'armée et une barre de retour jumelle de
  // celle du Chantier. Les onglets, le bandeau des ressources et la barre du bas
  // sont devenus COMMUNS aux trois écrans — Ethan : « garder la barre quartz
  // scories etc et monde option dans le menu offense » — donc le retour se fait
  // par le bouton « Base », qui est là de toute façon, et l'absence de chiffres
  // d'armée se dit une seule fois, dans le compteur du bandeau commun.
  for (const parti of ['offense-tete', 'offense-barre', 'offense-vers-chantier',
    'offense-niveau', 'offense-points', 'chantier-vers-offense']) {
    assert.ok(!html.includes(parti), `« ${parti} » devait disparaître de la page`);
  }
  // Et l'en-tête commun est bien là, lui.
  for (const commun of ['tete-onglets', 'ressources', 'navigation', 'barre-bas', 'ecran-options']) {
    assert.ok(html.includes(commun), `l'en-tête commun a perdu « ${commun} »`);
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

  // Falsifiable, dans les deux sens : le décommenteur retire la prose et rien
  // d'autre, et le montage ne prouverait rien si la prose ne citait plus
  // l'ancien identifiant.
  assert.ok(pageSansCommentaires().includes('<div id="ecran-offense"'));
  assert.ok(readFileSync(join(RACINE, 'dist', 'index.html'), 'utf8').includes('offense-tete'),
    'plus aucune prose ne cite l\'ancien en-tête : le décommenteur ne mesure plus rien');
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
  // ⚠ LES PORTES ONT CHANGÉ DE FORME AU LOT MISE EN PAGE. Il y en avait deux,
  // nommées une par une ; il y en a maintenant quatre — deux onglets du haut et
  // les boutons de la barre du bas, qui passent tous par `montrerEcran`. Ce que
  // le test garde n'a pas changé : AUCUNE d'elles ne doit toucher à
  // `suspendre` / `reprendre`.
  const source = readFileSync(join(RACINE, 'src', 'ui', 'session.js'), 'utf8');
  const lignesDeNavigation = source.split('\n')
    .filter((l) => l.includes('montrerEcran('));
  assert.ok(lignesDeNavigation.length >= 3,
    `${lignesDeNavigation.length} lignes de navigation : le montage ne trouve plus les portes`);
  for (const ligne of lignesDeNavigation) {
    assert.ok(!ligne.includes('suspendre'), `la navigation gèle le jeu : ${ligne.trim()}`);
    assert.ok(!ligne.includes('reprendre'), `la navigation gèle le jeu : ${ligne.trim()}`);
  }
  // Et la fonction elle-même ne gèle pas : on lit son corps, pas seulement les
  // lignes qui l'appellent.
  const corps = source.slice(source.indexOf('function montrerEcran('));
  const fin = corps.indexOf('\n  }');
  const dedans = corps.slice(0, fin);
  assert.ok(!dedans.includes('suspendre'), 'montrerEcran gèle le jeu');
  assert.ok(!dedans.includes('reprendre'), 'montrerEcran reprend le jeu');

  // Falsifiable : le motif doit attraper une vraie faute.
  const appat = "$('onglet-base').addEventListener('click', () => { suspendre(); montrerEcran('x'); });";
  assert.ok(appat.includes('montrerEcran(') && appat.includes('suspendre'),
    'le montage n\'attraperait pas la faute');

  // Et les deux fonctions existent bien, sinon le test passerait sur un fichier
  // qui ne les a jamais eues.
  assert.ok(/function suspendre\(/.test(source));
  assert.ok(/function reprendre\(/.test(source));
});
