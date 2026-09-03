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
  SANS_COMMANDEMENT, messageEnMain, messageDeDepassement,
  ACTIONS_ARMEE, MESSAGES_MODE_ARMEE, messageDeDestinationDUnite, messageIndisponible,
  couchesDeLUniteDAssaut,
} from '../src/ui/offense.js';
import { existeDansAtlas } from '../src/render/sprite.js';
import { couchesDeLEntite } from '../src/render/scene.js';
import {
  creerEtat, poser, poserEffectif, niveauDeCommandement,
} from '../src/sim/state.js';
import { acquisesDe } from '../src/sim/recherche.js';
import { NB_VAGUES, NB_COLONNES, NB_EMPLACEMENTS, budgetDuNiveau } from '../src/ui/arsenal.js';
import { EMPLACEMENTS_ASSAUT, POINTS_ARMEE, GEOGRAPHIE } from '../src/data/sites.js';
import { GRILLE, UNITES } from '../src/data/combat.js';
import { baseCourante } from '../src/sim/base-courante.js';

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
  const palette = unitesDeLaPalette(creerEtat(7));

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

  // ⚠⚠ ELLE GRISE, ELLE NE FILTRE PLUS — CHANGEMENT DE DÉCISION DU 29/08. Ce
  // test a changé de cible pour la seconde fois, et il ne s'est pas assoupli :
  // il asserte MAINTENANT une propriété plus forte qu'avant, la longueur
  // CONSTANTE de la palette. Ethan a rapporté deux unités « indisponibles »
  // qu'il attendait ; une palette qui les CACHE ne peut pas répondre à ça, et
  // une palette qui change de longueur déplace les vignettes sous le doigt —
  // c'est exactement l'argument qui avait fait griser les uniques du Chantier.
  const roster = Object.keys(UNITES).length;
  for (const [niveau, quoi] of [[1, 'au niveau 1'], [50, 'au plafond']]) {
    const etat = creerEtat(7);
    baseCourante(etat).disposition[0].niveau = GEOGRAPHIE.niveauPlafond;
    poser(etat, 'centreDeCommandement', 12, 1);
    baseCourante(etat).disposition[1].niveau = niveau;
    const vue = unitesDeLaPalette(etat);
    assert.equal(vue.length, roster, `la palette a changé de longueur ${quoi}`);
  }

  // Chaque unité éteinte DIT pourquoi, et chaque unité vive ne dit rien.
  for (const u of palette) {
    assert.equal(u.disponible, u.raison === null, `${u.nom} : disponible et raison divergent`);
    if (!u.disponible) assert.ok(u.raison.length > 5, `${u.nom} : raison trop courte`);
  }

  // ⚠ ET LES TROIS RAISONS SE PRODUISENT VRAIMENT, dans l'ordre où elles
  // priment. Le montage doit les voir toutes les trois, sinon deux des trois
  // branches ne seraient jamais exécutées et le test ne prouverait rien.
  assert.ok(palette.every((u) => /Centre de commandement/.test(u.raison)),
    'sans QG, toutes les raisons devraient nommer le Centre de commandement');

  const avecQg = creerEtat(7);
  baseCourante(avecQg).disposition[0].niveau = GEOGRAPHIE.niveauPlafond;
  poser(avecQg, 'centreDeCommandement', 12, 1);
  baseCourante(avecQg).disposition[1].niveau = GEOGRAPHIE.niveauPlafond;
  const sansCaserne = unitesDeLaPalette(avecQg);
  assert.ok(sansCaserne.every((u) => !u.disponible),
    'au plafond sans aucun bâtiment de production, rien ne doit être constructible');
  // ⚠ ET LES TROIS RAISONS DE BÂTIMENT SE PRODUISENT ENCORE APRÈS LE LOT
  // RECHERCHE, parce que les trois pièces GRATUITES en offense sont une de
  // chaque châssis : Fusiliers (escouade), Éclaireur (blindé), Épervier
  // (aéronef). Si les gratuites changeaient, ces trois assertions tomberaient —
  // ce qui est le bon comportement : elles mesureraient alors le verrou de
  // recherche en croyant mesurer celui du bâtiment.
  assert.ok(sansCaserne.some((u) => /Caserne/.test(u.raison)), 'aucune unité ne réclame la Caserne');
  assert.ok(sansCaserne.some((u) => /Dépôt de véhicules/.test(u.raison)), 'aucune ne réclame le Dépôt');
  assert.ok(sansCaserne.some((u) => /Aérodrome/.test(u.raison)), 'aucune ne réclame l\'Aérodrome');

  // Et la Caserne posée débloque EXACTEMENT l'infanterie, rien d'autre.
  //
  // ⚠ TOUT L'ARBRE EST ACHETÉ POUR CE BLOC, et c'est ce qui le rend concluant :
  // sans ça, une unité indisponible le serait pour DEUX raisons à la fois, et
  // l'assertion ne dirait plus laquelle. On isole le verrou du bâtiment en
  // levant celui de la recherche.
  avecQg.recherche.acquises.offense = Object.keys(UNITES).sort();
  poser(avecQg, 'caserne', 12, 3);
  const avecCaserne = unitesDeLaPalette(avecQg);
  for (const u of avecCaserne) {
    const infanterie = UNITES[u.id].chassis === 'escouade';
    assert.equal(u.disponible, infanterie,
      `${u.nom} (${UNITES[u.id].chassis}) : la Caserne ne débloque que l'infanterie`);
  }

  // ⚠⚠ LE TROISIÈME VERROU A CHANGÉ DE NATURE AU LOT RECHERCHE, PAS DE RANG.
  // C'était « apparaît au niveau N » ; c'est désormais la recherche, et le
  // message ne porte plus de nombre — le coût vit dans l'écran Recherche, le
  // redire ici en ferait une seconde lecture de la même table.
  const bas = creerEtat(7);
  baseCourante(bas).disposition[0].niveau = GEOGRAPHIE.niveauPlafond;
  poser(bas, 'centreDeCommandement', 12, 1);
  poser(bas, 'caserne', 12, 3);
  const auNiveauUn = unitesDeLaPalette(bas);
  const verrouNiveau = auNiveauUn.filter((u) => /se débloque par la recherche/.test(u.raison ?? ''));
  assert.ok(verrouNiveau.length > 0, 'aucun verrou de recherche : le montage ne mesure rien');
  // Aucune de celles-là n'est acquise en début de partie — et les gratuites,
  // elles, ne portent PAS ce verrou. Sans cette seconde moitié, un filtre qui
  // verrouillerait tout passerait aussi.
  const acquises = acquisesDe(bas, 'offense');
  for (const u of verrouNiveau) assert.ok(!acquises.includes(u.id), `${u.id} est pourtant acquis`);
  assert.ok(auNiveauUn.some((u) => acquises.includes(u.id) && !/recherche/.test(u.raison ?? '')),
    'même les gratuites portent le verrou de recherche');

  // Et le message que le joueur lit au toucher porte les DEUX : le nom de
  // l'unité et la raison. Un « indisponible » nu n'apprendrait rien — c'est
  // exactement ce qui manquait quand Ethan a signalé deux unités absentes.
  const dit = messageIndisponible(verrouNiveau[0]);
  assert.ok(dit.includes(verrouNiveau[0].nom), 'le message ne nomme pas l\'unité');
  assert.ok(dit.includes(verrouNiveau[0].raison), 'le message ne dit pas la raison');
});

test('offense — la barre contextuelle existe, et ses quatre boutons répondent', () => {
  // ⚠⚠ ETHAN, LE 29/08 : « on ne peut pas supprimer une unité en cliquant
  // dessus. D'ailleurs les boutons réparer, améliorer etc. n'apparaissent pas
  // dans le menu offense. » L'écran retirait bien une unité — mais en DEUX
  // touchers implicites qu'aucun bouton n'annonçait.
  const html = readFileSync(join(RACINE, 'dist', 'index.html'), 'utf8');
  for (const id of ['offense-contexte', 'offense-selection-nom', 'offense-selection-detail',
    'offense-reparer', 'offense-ameliorer', 'offense-ameliorer-cible',
    'offense-deplacer', 'offense-retirer']) {
    assert.ok(html.includes(`id="${id}"`), `#${id} manque à la page`);
  }

  // ⚠ AUCUN N'EST DÉSACTIVÉ, ET C'EST LE MODÈLE ENTIER. « Armer puis toucher »
  // veut dire que le bouton se touche EN PREMIER : le rendre inerte tant
  // qu'aucune unité n'est choisie rendrait la barre inatteignable au doigt.
  // C'est la leçon du lot ÉCRAN-ACTIONS, et elle vaut ici mot pour mot.
  for (const action of Object.values(ACTIONS_ARMEE)) {
    assert.doesNotMatch(html, new RegExp(`id="${action.bouton}"[^>]*disabled`),
      `${action.bouton} est désactivé : le modèle « armer puis toucher » ne démarre pas`);
  }

  // ⚠ LA TABLE DES MESSAGES COUVRE EXACTEMENT LES ACTIONS. Une première
  // écriture reprenait `MESSAGES_MODE` du Chantier avec un repli en `??` :
  // « Retirer » n'y a pas de clé, et le bouton annonçait « Mode DÉPLACER :
  // touchez le BÂTIMENT à déplacer ». Vu en essayant l'écran, pas en le
  // relisant — d'où cette égalité, qui fait tomber la suite au prochain oubli.
  assert.deepEqual(
    Object.keys(MESSAGES_MODE_ARMEE).slice().sort(),
    Object.keys(ACTIONS_ARMEE).slice().sort(),
    'une action n\'a pas de message de mode, ou l\'inverse',
  );
  // Et ces messages parlent d'UNITÉS, jamais de bâtiments : ce sont deux
  // vocabulaires, et CLAUDE.md §4 interdit de les mélanger dans une chaîne
  // affichée.
  for (const [nom, message] of Object.entries(MESSAGES_MODE_ARMEE)) {
    assert.ok(!/bâtiment/i.test(message), `« ${nom} » parle de bâtiments`);
    assert.match(message, /unité/, `« ${nom} » ne dit pas sur quoi toucher`);
  }
  assert.ok(!/bâtiment/i.test(messageDeDestinationDUnite('Fusiliers')));

  // ⚠ RÉPARER ET AMÉLIORER N'ONT PAS DE MOTEUR, ET LA TABLE LE DIT PAR `null`.
  // Le coût d'une amélioration existe depuis le 28/08 ; la mécanique non — ce
  // que gagne une unité améliorée n'est pas arbitré. Le bouton s'arme quand
  // même et répond : « un indice n'est pas une interdiction » (CLAUDE.md §4).
  assert.equal(ACTIONS_ARMEE.reparer.agir, null);
  assert.equal(ACTIONS_ARMEE.ameliorer.agir, null);
  assert.equal(typeof ACTIONS_ARMEE.retirer.agir, 'function');
  assert.equal(typeof ACTIONS_ARMEE.deplacer.agir, 'function');
  // Déplacer se fait en DEUX touchers, et la table le dit — l'écran lit ce
  // champ au lieu de reconnaître « deplacer » par son nom.
  assert.equal(ACTIONS_ARMEE.deplacer.cible, true);
  const source = readFileSync(join(RACINE, 'src', 'ui', 'offense.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  assert.ok(!/=== 'deplacer'/.test(source), 'l\'écran reconnaît « deplacer » par son nom');

  // ⚠ ET « RETIRER », PAS « DÉMOLIR ». On ne démolit pas des Fusiliers.
  assert.equal(ACTIONS_ARMEE.retirer.libelle, 'Retirer');
  assert.ok(!/Démolir/.test(html.slice(html.indexOf('id="offense-contexte"'),
    html.indexOf('id="offense-palette"'))), 'la barre de l\'Offense parle de démolition');
});

test('offense — la palette ne défile pas : ses colonnes se calculent', () => {
  // ⚠ CONSIGNE D'ETHAN, 28/08 : « tu compresses tout dans l'ui ». La palette
  // avait des colonnes de 82 px et un `overflow-x: auto` — tolérable tant
  // qu'elle FILTRAIT et n'en montrait que trois ou quatre, insupportable depuis
  // qu'elle grise et en montre quatorze. Vu à l'essai, sur appareil simulé.
  const feuille = readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const bloc = feuille.match(/#offense-palette\s*\{([^}]*)\}/)[1];
  assert.ok(!/overflow-x:\s*auto/.test(bloc), 'la palette de l\'Offense défile encore');
  assert.ok(!/grid-auto-columns/.test(bloc), 'la palette a encore des colonnes de largeur fixe');
  assert.match(bloc, /overflow:\s*hidden/);

  // ⚠ ET LE NOMBRE DE COLONNES SE CALCULE, IL NE S'ÉCRIT PAS. Écrire « 7 »
  // marcherait aujourd'hui et mentirait à la quinzième unité.
  const source = readFileSync(join(RACINE, 'src', 'ui', 'offense.js'), 'utf8');
  assert.match(source, /gridTemplateColumns[^\n]*Math\.ceil\(/,
    'le nombre de colonnes de la palette est écrit en dur');
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
  baseCourante(etat).disposition[0].niveau = 5; // dix emplacements
  baseCourante(etat).disposition.push({ id: 'centreDeCommandement', rangee: 11, colonne: 1, niveau });
  baseCourante(etat).economie.residus.push({ quartz: 0, scorie: 0, electricite: 0 });
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
  assert.equal(baseCourante(etat).armee[vue.vagues[3][8].index].id, 'fendeur');

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
  // ⚠ ON AMPUTE LA BASE, PAS LA RACINE — lot BASES-0 : `armee` y a descendu.
  // Amputer la racine ne retirerait plus rien, et le test passerait pour la
  // mauvaise raison, ou pas du tout.
  const etatAmpute = creerEtat(3);
  const ampute = {
    ...etatAmpute,
    bases: [{ ...baseCourante(etatAmpute), armee: undefined }],
  };
  delete ampute.bases[0].armee;
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

test('offense — une armée trop chère est SIGNALÉE, jamais amputée', () => {
  // ⚠⚠ C'EST LA DÉCISION QUE LE BRIEF DEMANDAIT DE PRENDRE, ET ELLE EST CELLE
  // DU DÉPÔT : `purger` ne s'applique JAMAIS toute seule. CLAUDE.md §4 —
  // « quand le contexte bouge sous une composition déjà faite, on le SIGNALE
  // dans le bilan et on propose de purger. Jamais d'amputation automatique. »
  //
  // Le cas arrive pour de bon : le budget BAISSE quand le Centre de
  // commandement est démoli ou tombe au raid, sous une armée déjà posée.
  const etat = baseAvecCommandement(50);
  for (let colonne = 1; colonne <= 9; colonne += 1) {
    poserEffectif(etat, 'armee', { id: 'enclume', vague: 1, colonne, niveau: 1 });
  }
  const riche = vueDeLOffense(etat);
  assert.equal(riche.depasse, false, 'le montage dépasse déjà au niveau 50');
  assert.equal(riche.avis, '');

  // Le QG redescend au niveau 1 : le budget s'effondre sous l'armée posée.
  const indice = baseCourante(etat).disposition.findIndex((b) => b.id === 'centreDeCommandement');
  baseCourante(etat).disposition[indice].niveau = 1;
  const pauvre = vueDeLOffense(etat);

  // Falsifiable : le montage doit VRAIMENT dépasser, sinon il ne mesure rien.
  assert.ok(pauvre.engages > pauvre.budget,
    `${pauvre.engages} points pour ${pauvre.budget} : le montage ne dépasse pas`);
  assert.equal(pauvre.depasse, true);
  assert.equal(pauvre.avis, messageDeDepassement(pauvre.engages, pauvre.budget));
  assert.match(pauvre.avis, /Rien n'est retiré tout seul/);

  // ⚠ ET RIEN N'A ÉTÉ RETIRÉ. Les neuf unités sont toujours là, à leur place.
  assert.equal(baseCourante(etat).armee.length, 9, 'des unités ont disparu toutes seules');
  assert.equal(pauvre.vagues[0].filter((c) => c !== null).length, 9);
});

test('offense — aucun écran n\'appelle `purger` de lui-même', () => {
  // La fonction existe dans les deux éditeurs depuis le lot 5, et elle doit
  // rester à la main du joueur. Un appel automatique ferait disparaître sa
  // composition sans qu'il sache laquelle est partie.
  for (const nom of ['offense.js', 'chantier.js', 'session.js']) {
    const source = readFileSync(join(RACINE, 'src', 'ui', nom), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    assert.ok(!/\bpurger\s*\(/.test(source), `${nom} purge la composition tout seul`);
  }
  // Falsifiable : la fonction existe bien, sinon la garde ne garde rien.
  const editeur = readFileSync(join(RACINE, 'src', 'ui', 'arsenal.js'), 'utf8');
  assert.match(editeur, /export function purger\(/, 'purger a disparu de l\'Arsenal');
});

// ---------------------------------------------------------------------------
// Le lot SPRITES-ET-ZOOM : l'Offense cesse d'afficher des étiquettes
// ---------------------------------------------------------------------------

test('offense — une unité posée porte son SPRITE, plus son nom écrit', () => {
  // ⚠⚠ ETHAN, 30/08 : « onglet offense : aucun sprite unités de joueur ».
  // L'emplacement portait `occupant.nom` en 7 px sur un bloc kaki : deux
  // « Fusiliers » côte à côte se lisaient comme deux étiquettes, et le joueur
  // composait à l'aveugle des silhouettes qu'il ne verrait qu'au combat.
  const ecran = readFileSync(join(RACINE, 'src', 'ui', 'offense.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');

  assert.doesNotMatch(ecran, /element\.textContent = occupant === null/,
    'l\'emplacement réécrit le nom de l\'unité au lieu de poser son sprite');
  assert.match(ecran, /piece\.className = 'piece'/, 'l\'unité posée n\'a plus d\'élément de sprite');
  assert.match(ecran, /poserCouches\(piece, couchesDeLUniteDAssaut\(occupant\.id\)\)/,
    'l\'emplacement ne pose plus les couches de l\'unité');

  // ⚠ ET LE NOM N'EST PAS PERDU : il passe dans le `title`. « Rien ne se retire
  // en silence » (CLAUDE.md §4) — le lot remplace un DESSIN, pas une donnée.
  assert.match(ecran, /element\.title = `\$\{occupant\.nom\}/,
    'le nom de l\'unité n\'est plus joignable nulle part');
  assert.match(ecran, /element\.removeAttribute\('title'\)/,
    'le titre survit à l\'unité qu\'il nommait');

  // ⚠⚠ ET IL EST IMPORTÉ, PAS RÉÉCRIT. `poserCouches` porte l'inversion d'ordre
  // entre le canevas et `background-image` ; une seconde écriture qui
  // l'oublierait poserait le socle par-dessus la tourelle sur cet écran-ci et
  // pas sur l'autre, sans qu'aucun nom de sprite soit faux.
  assert.match(ecran, /poserCouches,?\s*\n?\s*\} from '\.\/chantier\.js'/,
    '`poserCouches` n\'est plus importé du Chantier : il a peut-être été recopié');
  assert.doesNotMatch(ecran, /function poserCouches/,
    'l\'Offense a réécrit sa propre pose de couches');
});

test('offense — les quatorze unités résolvent toutes un sprite qui EXISTE', () => {
  // ⚠⚠ SANS CE TEST, UNE UNITÉ MANQUANTE SE VERRAIT À L'OUVERTURE DE L'ÉCRAN,
  // et pas avant. La palette montre les quatorze — elle GRISE au lieu de
  // filtrer depuis le 29/08 —, donc les quatorze posent un sprite dès le
  // premier affichage, verrouillées comprises.
  const roster = Object.keys(UNITES);
  assert.equal(roster.length, 14, `${roster.length} unités : le roster a changé`);
  for (const id of roster) {
    const couches = couchesDeLUniteDAssaut(id);
    assert.ok(Array.isArray(couches) && couches.length >= 1, `${id} ne rend aucune couche`);
    for (const { famille, nom } of couches) {
      assert.ok(existeDansAtlas(famille, nom),
        `${id} demande « ${nom} », absent de l'atlas « ${famille} »`);
    }
  }

  // ⚠ ET C'EST LE MÊME DESCRIPTEUR QUE PARTOUT AILLEURS. Le point d'entrée
  // unique de `render/scene.js` existe pour qu'une unité se dessine pareil dans
  // l'éditeur et au combat ; un descripteur écrit à la main ici serait la
  // quatrième vérité que ce dispatch existe pour empêcher.
  for (const id of roster) {
    assert.deepEqual(
      couchesDeLUniteDAssaut(id),
      couchesDeLEntite({ genre: 'unite', id, proprietaire: 'joueur', camp: 'attaque' }),
      `${id} : l'écran Offense a sa propre dérivation de sprite`,
    );
  }

  // ⚠⚠ ET LA POSE EST CELLE DE L'ASSAUT, PAS DE LA GARNISON. `camp: 'attaque'`
  // donne la force `armee`, donc la pose de marche ; `garnison` donnerait `_def`
  // — chenilles à l'horizontale — sur les huit unités qui en ont une. Le
  // montage le MESURE : si aucune unité ne changeait de nom entre les deux
  // poses, ce test ne dirait rien du choix qu'il garde.
  const differentes = roster.filter((id) => {
    const assaut = couchesDeLUniteDAssaut(id);
    const garnison = couchesDeLEntite({
      genre: 'unite', id, proprietaire: 'joueur', camp: 'defense',
    });
    return JSON.stringify(assaut) !== JSON.stringify(garnison);
  });
  assert.ok(differentes.length > 0,
    'aucune unité ne distingue l\'assaut de la garnison : le test ne mesure rien');
});

test('offense — la palette montre la pièce, plus un carré', () => {
  // ⚠ ETHAN NOMME LES TROIS BARRES D'UN COUP, 30/08 : « dans les barres de
  // construction du bas (base def off) remplacer les carrés par les sprites
  // correspondant ». Celle de l'Offense n'avait même pas de carré : elle ne
  // portait que deux lignes de texte.
  const ecran = readFileSync(join(RACINE, 'src', 'ui', 'offense.js'), 'utf8');
  assert.match(ecran, /poserCouches\(vignette, couchesDeLUniteDAssaut\(unite\.id\)\)/,
    'la vignette de la palette ne porte pas le sprite de son unité');
  assert.match(ecran, /bouton\.append\(vignette, nom, cout\)/,
    'la pastille n\'est pas dans la vignette, ou pas en premier');

  // Et la feuille la dessine — une classe que le JS pose et que le CSS ignore
  // est un lot entier qui ne se voit pas (lot ÉCRAN-ACTIONS, 28/08).
  const feuille = readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(feuille, /#offense-palette \.unite i\s*\{[^}]*image-rendering: pixelated/,
    'la pastille de la palette de l\'Offense n\'a pas de règle, ou lisse son sprite');
});

test('offense — le compteur de points n\'est pas dans le bouton Améliorer', () => {
  // ⚠⚠ CE QU'ETHAN A VU LE 31/08 : « dans le menu offense, il y a le compteur
  // armée dans le bouton améliorer ». L'`<em>` du bouton recevait
  // « engagés / budget » — la grandeur du BANDEAU, affichée une seconde fois,
  // dans un bouton dont le libellé ne la nomme pas. Mesuré dans Chromium avec
  // un Centre de commandement posé : le bouton disait « Améliorer 0/25 ».
  //
  // ⚠ LA RÈGLE EST CELLE DU CHANTIER, MOT POUR MOT : cet `<em>` dit ce que
  // l'amélioration VISE, et il ne s'écrit QUE là où améliorer existe.
  const ecran = readFileSync(join(RACINE, 'src', 'ui', 'offense.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !l.trimStart().startsWith('//')).join('\n');

  const ligne = ecran.split('\n').filter((l) => l.includes('offense-ameliorer-cible'));
  assert.equal(ligne.length, 1, 'un seul point d\'écriture pour cet `<em>`');
  assert.ok(!/engages|budget/.test(ligne[0]),
    `le compteur de points est reparti dans le bouton Améliorer : ${ligne[0].trim()}`);

  // ⚠ ET LA RAISON POUR LAQUELLE IL RESTE VIDE EST DANS LA TABLE, pas dans une
  // constante à part : améliorer n'a pas de moteur en offense. Le jour où il en
  // aura un, `agir` cessera d'être `null` et la ligne écrira le niveau visé —
  // ce test-ci n'aura pas à changer.
  assert.equal(ACTIONS_ARMEE.ameliorer.agir, null,
    'améliorer a gagné un moteur : vérifier ce que le bouton annonce désormais');
});

test('offense — le bandeau du haut porte toujours, lui, les points engagés', () => {
  // La contre-épreuve du test précédent : on retire le compteur du BOUTON, donc
  // il faut prouver qu'il reste ailleurs. Sans ça, « ne plus l'afficher » aurait
  // été une réponse valable à Ethan, et elle aurait perdu une information de jeu.
  // ⚠ `CONTEXTES` d'`ui/chantier.js` porte la fonction qui la calcule, et le
  // bandeau la lit dans les trois contextes depuis le 28/08.
  const chantier = readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !l.trimStart().startsWith('//')).join('\n');
  const bloc = chantier.slice(chantier.indexOf('CONTEXTES'), chantier.indexOf('CONTEXTES') + 2200);
  assert.match(bloc, /offense/, 'le contexte Offense a disparu du bandeau');
  assert.match(bloc, /chiffre:\s*true/, 'le bandeau n\'affiche plus de nombre');
});

// ---------------------------------------------------------------------------
// OFFENSE-03/09 — le bassin, et les neuf en quinconce
// ---------------------------------------------------------------------------

test('offense — l\'écran porte le bassin, et il est INLINÉ', () => {
  // ⚠⚠ CE QU'ETHAN A DEMANDÉ LE 03/09 : « je t'ai envoyé un sprite pour combler
  // le menu armée ou offense ». L'écran des quatre vagues montrait trente-six
  // cases tiretées sur du noir, et sa moitié basse ne montrait rien du tout.
  //
  // ⚠ LE TEST LIT LE HTML **PRODUIT**, pas la source : c'est le seul endroit où
  // « l'image est inlinée » veut dire quelque chose. Dans la source il n'y a
  // qu'un marqueur, `%FOND_OFFENSE%`, que le build remplace.
  const livrable = readFileSync(join(RACINE, 'dist', 'index.html'), 'utf8');
  const debut = livrable.indexOf('#offense-vagues {');
  assert.ok(debut > 0, 'la règle du fond des vagues a disparu de la feuille');
  const regle = livrable.slice(debut, livrable.indexOf('}', debut));

  assert.match(regle, /background-image:\s*url\('data:image\/webp;base64,/,
    'le bassin n\'est plus inliné en WebP — une URL ici serait une référence externe');

  // ⚠ `cover`, JAMAIS `100% 100%`. Le décor a un rapport de 0,84 et l'écran
  // non : l'étirer déformerait des tuyaux et des grilles d'aération, que l'œil
  // lit comme des objets. On rogne, on ne déforme pas.
  assert.match(regle, /background-size:\s*cover/,
    'le bassin est étiré au lieu d\'être rogné');
  assert.doesNotMatch(regle, /background-repeat:\s*repeat/,
    'un bassin qui se répète ferait une couture au milieu de l\'écran');
});

test('offense — les neuf sont en quinconce, et le décalage passe par la GRILLE', () => {
  // ⚠⚠ ETHAN, 03/09 : « toujours 4 rangées de 9, mais les neuf tu les mets en
  // quinconce pour que ça passe à peu près ». Une rangée sur deux est décalée
  // d'une DEMI-case.
  //
  // ⚠⚠ ET LE DÉCALAGE NE SE FAIT PAS PAR UN `transform`. Un `translateX`
  // déplacerait le dessin sans déplacer la géométrie du pointage, et le doigt
  // cesserait de tomber sur l'emplacement qu'il vise — c'est exactement ce que
  // le dépôt refuse depuis toujours sur la grille du Chantier. On compte donc
  // en demi-colonnes.
  const ecran = readFileSync(join(RACINE, 'src', 'ui', 'offense.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !l.trimStart().startsWith('//')).join('\n');

  const pose = ecran.match(/gridTemplateColumns = `repeat\(\$\{([^}]+)\}, 1fr\)`/);
  assert.ok(pose, 'l\'écran ne pose plus le nombre de colonnes des vagues');

  // ⚠ LE NOMBRE SE CALCULE, IL NE SE RECOPIE PAS. Écrire `19` passerait cette
  // égalité aujourd'hui et mentirait le jour où une vague changerait de
  // largeur : on exige donc que l'expression NOMME la donnée.
  assert.match(pose[1], /NB_COLONNES/,
    'le nombre de demi-colonnes est écrit en dur : il ne suivrait plus NB_COLONNES');
  const demiColonnes = Function('NB_COLONNES', `return ${pose[1]};`)(NB_COLONNES);
  assert.equal(demiColonnes, NB_COLONNES * 2 + 1,
    `${demiColonnes} demi-colonnes pour ${NB_COLONNES} emplacements : sans la demi-case`
    + ' de mou, la rangée décalée déborde ; avec deux, elle n\'est plus au ras du bord');

  // La rangée décalée est marquée dans le balisage, pas devinée par sa place
  // dans le document : `:nth-child` aurait lié le quinconce à la structure du
  // DOM, qu'un titre inséré un jour aurait décalée en silence.
  assert.match(ecran, /classList\.add\('decalee'\)/,
    'plus rien ne marque la rangée décalée');
  assert.doesNotMatch(ecran, /transform/,
    'un `transform` décrocherait le doigt de l\'emplacement qu\'il vise');

  const feuille = readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8');
  const bloc = feuille.slice(feuille.indexOf('#ecran-offense .emplacements'),
    feuille.indexOf('aspect-ratio: 1', feuille.indexOf('#ecran-offense .emplacements')));
  assert.match(bloc, /grid-column:\s*span 2/,
    'un emplacement n\'occupe plus deux demi-colonnes');
  assert.match(bloc, /\.decalee .emplacement:first-child \{ grid-column-start: 2/,
    'la rangée décalée ne commence plus une demi-case plus loin');
  assert.doesNotMatch(bloc, /repeat\(\s*\d/,
    'le nombre de demi-colonnes est écrit dans la feuille : c\'est une seconde vérité');
});
