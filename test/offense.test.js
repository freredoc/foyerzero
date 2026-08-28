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

import {
  vagueDAssaut, vaguesDAssaut, unitesDeLaPalette, vueDeLOffense,
  SANS_COMMANDEMENT, messageEnMain,
} from '../src/ui/offense.js';
import {
  creerEtat, poserEffectif, niveauDeCommandement,
} from '../src/sim/state.js';
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
  // ⚠ SANS CENTRE DE COMMANDEMENT, LA PALETTE MONTRE TOUT, ÉTEINT. Il n'y a
  // pas de niveau d'armée — pas un niveau zéro : filtrer sur un niveau inventé
  // cacherait des unités pour une mauvaise raison.
  const palette = unitesDeLaPalette(null);

  // Toutes les unités, et rien d'autre.
  assert.deepEqual(palette.map((u) => u.id).sort(), Object.keys(UNITES).sort());
  assert.ok(palette.every((u) => u.disponible === false), 'la palette est vive sans budget');
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

  // ⚠ ET ELLE EST FILTRÉE PAR NIVEAU DÈS QU'IL Y EN A UN. Ce test a changé de
  // cible au lot GARNISON-ET-ARMÉE, il ne s'est pas assoupli : jusque-là le
  // joueur n'avait AUCUN niveau d'armée, et en choisir un pour pouvoir filtrer
  // aurait été l'inventer. Il en a un maintenant — celui de son Centre de
  // commandement — et le filtre est celui de l'Arsenal, pas un second.
  const verrouillees = palette.filter((u) => UNITES[u.id].apparition > 1);
  assert.ok(verrouillees.length > 0, 'aucune unité verrouillée : le filtrage ne se voit pas');

  const auNiveauUn = unitesDeLaPalette(1);
  assert.ok(auNiveauUn.length < palette.length, 'le filtrage par niveau ne retire rien');
  assert.ok(auNiveauUn.every((u) => UNITES[u.id].apparition <= 1));
  assert.ok(auNiveauUn.every((u) => u.disponible === true));
  // Au plafond, plus rien n'est verrouillé : le filtre laisse tout passer.
  assert.equal(unitesDeLaPalette(50).length, Object.keys(UNITES).length);
});

test('offense — le budget vient du Centre de commandement, et de lui seul', () => {
  assert.equal(budgetDuNiveau(1), POINTS_ARMEE.offense.base + POINTS_ARMEE.offense.parNiveau);
  assert.ok(budgetDuNiveau(50) > budgetDuNiveau(1), 'le budget doit dépendre du niveau');
  // Aucun niveau par défaut n'existe : la fonction refuse zéro et null.
  assert.throws(() => budgetDuNiveau(0), /hors de/);
  assert.throws(() => budgetDuNiveau(null), /hors de/);

  // ⚠ ET C'EST L'ÉTAT QUI DIT S'IL Y EN A UN. Une base neuve ne porte pas de
  // Centre de commandement — il est `unique` et absent de `BASE_NEUVE` — donc
  // il n'y a pas de budget du tout, ce qui n'est pas un budget nul.
  const neuve = creerEtat(5);
  assert.equal(niveauDeCommandement(neuve, 'armee'), null);
  assert.equal(vueDeLOffense(neuve).budget, null);
  assert.equal(vueDeLOffense(neuve).avis, SANS_COMMANDEMENT);
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

  // ⚠ LE MOT GRAVÉ A DISPARU, ET C'EST LE LOT GARNISON-ET-ARMÉE. La page
  // affirmait « La composition d'armée n'existe pas encore » ; elle existe.
  // La ligne est maintenant ÉCRITE PAR L'ÉCRAN, qui y met ce qui est vrai à cet
  // instant — d'où un paragraphe VIDE et caché dans le balisage.
  assert.ok(!/La composition d'armée n'existe pas encore/.test(html),
    'la page affirme encore que la composition d\'armée n\'existe pas');
  assert.ok(/<p id="offense-avis" hidden><\/p>/.test(html),
    'la ligne d\'avis de l\'Offense doit partir vide et cachée');

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

// ---------------------------------------------------------------------------
// L'écran compose — lot GARNISON-ET-ARMÉE, 28/08
// ---------------------------------------------------------------------------

/** Une base qui porte un Centre de commandement, donc un budget d'armée. */
function baseAvecCommandement(niveau = 12) {
  const etat = creerEtat(20260828);
  etat.disposition[0].niveau = 5; // dix emplacements
  etat.disposition.push({ id: 'centreDeCommandement', rangee: 11, colonne: 1, niveau });
  etat.economie.residus.push({ quartz: 0, scorie: 0, electricite: 0 });
  return etat;
}

test('offense — la vue lit l\'armée de l\'état, case par case', () => {
  const etat = baseAvecCommandement();
  poserEffectif(etat, 'armee', { id: 'meute', vague: 1, colonne: 3, niveau: 2 });
  poserEffectif(etat, 'armee', { id: 'fendeur', vague: 4, colonne: 9, niveau: 6 });

  const vue = vueDeLOffense(etat);
  assert.equal(vue.vagues.length, NB_VAGUES);
  assert.ok(vue.vagues.every((v) => v.length === NB_COLONNES));

  // ⚠ UNE VAGUE VIDE GARDE SON RANG. La vague 2 laissée vide ne doit pas
  // décaler la 3 : le rang décide de l'instant où la vague entre en jeu.
  assert.equal(vue.vagues[1].filter((c) => c !== null).length, 0);
  assert.equal(vue.vagues[0][2].id, 'meute');
  assert.equal(vue.vagues[0][2].nom, UNITES.meute.nom.joueur);
  assert.equal(vue.vagues[0][2].niveau, 2);
  assert.equal(vue.vagues[3][8].id, 'fendeur');
  // L'indice rend la pièce retrouvable dans `etat.armee` — c'est ce qui permet
  // de la déplacer ou de la retirer sans la rechercher par coordonnées.
  assert.equal(etat.armee[vue.vagues[3][8].index].id, 'fendeur');

  // Les points engagés et le budget, tous deux réels.
  assert.equal(vue.engages, UNITES.meute.points + UNITES.fendeur.points);
  assert.equal(vue.budget, budgetDuNiveau(12));
  assert.equal(vue.avis, '', 'l\'écran s\'excuse alors qu\'il a un budget');
  // Le niveau de l'armée est la moyenne de ce qui est posé : 2 et 6 font 4,0.
  assert.equal(vue.niveauArmee, 40);

  // Falsifiable : une base sans armée doit rendre autre chose.
  const vide = vueDeLOffense(baseAvecCommandement());
  assert.equal(vide.engages, 0);
  assert.equal(vide.niveauArmee, null);
  assert.notEqual(vide.vagues[0][2], vue.vagues[0][2]);
});

test('offense — l\'écran refuse un état malformé au lieu de rendre du vide', () => {
  assert.throws(() => vueDeLOffense(null), /état de jeu absent ou malformé/);
  const ampute = { ...creerEtat(3) };
  delete ampute.armee;
  assert.throws(() => vueDeLOffense(ampute), /état de jeu absent ou malformé/);
});

test('offense — le mot « en main » nomme l\'unité, en vocabulaire joueur', () => {
  const phrase = messageEnMain(UNITES.meute.nom.joueur);
  assert.ok(phrase.includes(UNITES.meute.nom.joueur));
  assert.ok(!phrase.includes(UNITES.meute.nom.ouvrage), 'un nom de l\'Ouvrage a fui à l\'écran');
  // Les deux issues du second toucher sont annoncées : déplacer, ou retirer.
  assert.ok(/déplacer/.test(phrase) && /retirer/.test(phrase), phrase);
});

test('offense — l\'écran ne grave aucune constante de grille', () => {
  // ⚠ NI 4, NI 9, NI 36. Ils viennent d'`EMPLACEMENTS_ASSAUT` par
  // `ui/arsenal.js` ; une seconde table dirait un jour autre chose. La garde
  // lit la source décommentée : les commentaires citent les nombres exprès.
  const source = readFileSync(join(RACINE, 'src', 'ui', 'offense.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');

  for (const grave of ['36', 'EMPLACEMENTS_ASSAUT']) {
    assert.ok(!source.includes(grave), `« ${grave} » est gravé dans l'écran Offense`);
  }
  // Les deux constantes viennent bien de l'Arsenal, importées et non réécrites.
  assert.match(source, /NB_VAGUES/);
  assert.match(source, /NB_COLONNES/);
  assert.match(source, /from '\.\/arsenal\.js'/);

  // Falsifiable : le décommenteur doit vraiment retirer de la prose, sinon la
  // garde lirait ses propres commentaires — la faute du lot PANNEAU-ET-MARGES.
  const brute = readFileSync(join(RACINE, 'src', 'ui', 'offense.js'), 'utf8');
  assert.ok(brute.length > source.length, 'le décommenteur ne retire rien');
  assert.ok(brute.includes('trente-six') || brute.includes('quatre vagues'),
    'plus aucune prose ne cite les nombres : la falsification ne mesure rien');
});

test('offense — les règles de composition ne sont pas réécrites dans l\'écran', () => {
  // ⚠ L'ÉCRAN INTERROGE, IL NE TRANCHE PAS. Budget, apparition et occupation
  // vivent dans `ui/arsenal.js` et `sim/state.js`. Une seconde table de règles
  // écrite pour la commodité d'un rendu finirait par dire autre chose.
  const source = readFileSync(join(RACINE, 'src', 'ui', 'offense.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');

  // Il demande avant d'agir, des deux côtés.
  assert.match(source, /problemesDeLaPoseDEffectif/);
  assert.match(source, /problemesDuDeplacementDEffectif/);
  // Et il ne relit pas `apparition` lui-même : c'est le filtre de l'Arsenal.
  assert.ok(!source.includes('apparition'), 'l\'écran refait le filtrage par niveau');
  // ⚠ JAMAIS DE `try` AUTOUR D'UNE POSE — même règle qu'au Chantier. Une pose
  // refusée est un fait de jeu qu'on montre ; une levée est un fait de
  // programme qu'on ne masque pas.
  assert.ok(!/try\s*\{[\s\S]*?poserEffectif/.test(source), 'un try entoure poserEffectif');
});
