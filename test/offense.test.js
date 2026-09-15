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
  couchesDeLUniteDAssaut, initialiserEcranOffense, ligneDeLaReserveDArmee,
  ligneDuCoutDeLaPiece, vueDuDevisDeReparation, TITRE_DEVIS,
} from '../src/ui/offense.js';
import { existeDansAtlas } from '../src/render/sprite.js';
import { couchesDeLEntite } from '../src/render/scene.js';
import {
  creerEtat, poser, poserEffectif, niveauDeCommandement, pointsEngages,
  problemesDeLaPoseDEffectif,
} from '../src/sim/state.js';
import {
  BASE_BATIMENTS, BATIMENT_DE_CHASSIS, messageSansBatiment, FAMILLE_DE_CHASSIS,
} from '../src/data/base.js';
import { acquisesDe } from '../src/sim/recherche.js';
import { ligneAAfficher, posablesDeLaDefense } from '../src/ui/chantier.js';
import { rosterDefensif } from '../src/data/couts-militaires.js';
import { NB_VAGUES, NB_COLONNES, NB_EMPLACEMENTS, budgetDuNiveau } from '../src/ui/arsenal.js';
import { EMPLACEMENTS_ASSAUT, POINTS_ARMEE, GEOGRAPHIE } from '../src/data/sites.js';
import { GRILLE, ORDRE_CHASSIS, UNITES } from '../src/data/combat.js';
import { baseCourante } from '../src/sim/base-courante.js';
import {
  plafondDeLaReserve, plafondDeLaReserveDesBatiments, direLaDuree,
  coutDeLaReparation, reservoirsDeLArmee,
} from '../src/sim/reparation.js';
import { TICKS_PAR_HEURE } from '../src/sim/clock.js';
import { poserLesBatimentsDeProduction } from './batiments-de-production.js';

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

  // ⚠⚠ RÉPARER A GAGNÉ SON MOTEUR LE 10/09, ET CETTE ASSERTION A CHANGÉ DE CIBLE
  // SANS S'ASSOUPLIR — exactement comme celle d'« Améliorer » le 03/09, deux
  // lignes plus bas. Elle exigeait `agir === null`, ce qui était juste tant que
  // le geste renvoyait à l'écran de raid ; le point 6 d'Ethan met « Tout
  // réparer » dans cette barre, et un « Réparer » qui renverrait ailleurs à côté
  // d'un « Tout réparer » qui agit apprendrait deux règles contradictoires sur
  // le même écran. Elle exige donc la PAIRE `problemes` + `agir`, la forme
  // qu'`appliquerAction` sait consommer : un `agir` sans `problemes` la fait
  // tomber, et sans `problemes` l'écran lèverait au premier toucher.
  assert.equal(typeof ACTIONS_ARMEE.reparer.problemes, 'function');
  assert.equal(typeof ACTIONS_ARMEE.reparer.agir, 'function');
  // ⚠ ET IL NE DEMANDE PAS DE SECOND TOUCHER : réparer désigne la pièce qu'on
  // touche. Poser `cible: true` la mettrait « en main » et attendrait une
  // destination que la réparation n'a pas.
  assert.notEqual(ACTIONS_ARMEE.reparer.cible, true);
  // ⚠⚠ ET PLUS AUCUNE ACTION DE CETTE TABLE N'EST SANS MOTEUR — c'était la
  // dernière. Conséquence à dire, et elle est mesurée ici : la branche
  // `action.agir === null` d'`appliquerAction` devient INATTEIGNABLE par la
  // table. La ligne de code reste — c'est le précédent d'`effetNonCable`, « elle
  // parlera du prochain geste écrit avant son moteur » — mais plus rien ne la
  // traverse aujourd'hui, et cette assertion-ci tombera si on rouvre un `null`
  // sans le vouloir.
  for (const [nom, action] of Object.entries(ACTIONS_ARMEE)) {
    assert.equal(typeof action.agir, 'function', `« ${nom} » n'a plus de moteur`);
  }

  // ⚠⚠ AMÉLIORER EN A UN DEPUIS LE 03/09, ET CETTE ASSERTION A CHANGÉ DE CIBLE
  // SANS S'ASSOUPLIR. Elle exigeait `agir === null`, ce qui était juste tant
  // que rien dans `sim/` ne montait une pièce d'un niveau ; elle exige
  // désormais la PAIRE `problemes` + `agir`, qui est la forme qu'`appliquerAction`
  // sait consommer. Un `agir` sans `problemes` la ferait tomber, et c'est ce
  // qui compte : sans `problemes`, l'écran lèverait au premier toucher.
  assert.equal(typeof ACTIONS_ARMEE.ameliorer.problemes, 'function');
  assert.equal(typeof ACTIONS_ARMEE.ameliorer.agir, 'function');
  // ⚠ ET ELLE NE DEMANDE PAS DE SECOND TOUCHER. Poser `cible: true` ici
  // mettrait l'unité « en main » et attendrait une destination qu'une
  // amélioration n'a pas — l'écran LIT ce champ, il ne lit pas le nom.
  assert.notEqual(ACTIONS_ARMEE.ameliorer.cible, true);
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

test('offense — UNE bande qui défile, la hauteur gardée, et les châssis dans l\'ordre', () => {
  // ⚠⚠ CETTE GARDE EST RETOURNÉE, ET C'EST LE TROISIÈME ARBITRAGE SUR LA MÊME
  // LIGNE. Le lot 5A filtrait et n'en montrait que trois ou quatre, sur des
  // colonnes de 82 px qui défilaient ; le 29/08 elle a cessé de filtrer, donc
  // montré quatorze unités, donc passé à DEUX rangées qui tiennent — « tu
  // compresses tout dans l'ui ». Le motif était juste et avait un prix qu'on ne
  // mesurait pas : dans 86 px, deux rangées laissent 38 px par vignette, sprite
  // et libellé compris. Ethan, 03/09 : « ui armée : une barre : d'abord
  // l'infanterie puis véhicule et avion ». Une seule rangée en laisse 76.
  const feuille = readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const bloc = feuille.match(/#offense-palette\s*\{([^}]*)\}/)[1];
  assert.match(bloc, /overflow-x:\s*auto/, 'la palette de l\'Offense ne défile pas');
  assert.match(bloc, /grid-auto-flow:\s*column/, 'la palette n\'est pas en colonnes');
  assert.match(bloc, /grid-template-rows:\s*1fr/, 'la palette a plus d\'une rangée');
  assert.match(bloc, /grid-auto-columns:\s*\d+px/, 'la largeur d\'une colonne n\'est pas fixée');
  // ⚠ ET LA HAUTEUR EST LA MOITIÉ DE LA DEMANDE — « garder la hauteur, comme ça
  // les boutons seront gros », dit de la palette du Chantier le même jour et
  // vrai des deux. Sans elle, les 288 px de chrome de l'Offense bougeraient.
  assert.match(bloc, /flex:\s*0 0 86px/, 'la palette de l\'Offense a changé de hauteur');
  // ⚠ LE DÉFILEMENT VERTICAL RESTE FERMÉ : une bande qui défilerait dans les
  // deux sens cacherait le bas d'une vignette sans que rien ne le rende.
  assert.match(bloc, /overflow-y:\s*hidden/);

  // ⚠⚠ ET LA LARGEUR D'UNE COLONNE QUITTE LE JS POUR LA FEUILLE. Tant que la
  // palette devait TENIR, seul le JS savait combien de vignettes il y avait ;
  // depuis qu'elle défile, leur nombre n'a plus à être connu de personne.
  const source = readFileSync(join(RACINE, 'src', 'ui', 'offense.js'), 'utf8');
  assert.ok(!/palette\.style\.gridTemplateColumns/.test(source),
    'l\'écran pose encore les colonnes de la palette');

  // ⚠⚠ LES CHÂSSIS SORTENT DANS L'ORDRE DEMANDÉ, ET LA MESURE PORTE SUR LA
  // PALETTE, PAS SUR LA TABLE. `UNITES` est déjà écrite dans cet ordre-là —
  // c'est mesuré ci-dessous —, donc une garde qui lirait la table serait verte
  // même si la palette la brassait.
  const etat = creerEtat(7);
  baseCourante(etat).disposition[0].niveau = GEOGRAPHIE.niveauPlafond;
  poser(etat, 'centreDeCommandement', 12, 1);
  baseCourante(etat).disposition[1].niveau = GEOGRAPHIE.niveauPlafond;
  const rangs = unitesDeLaPalette(etat).map((u) => ORDRE_CHASSIS.indexOf(UNITES[u.id].chassis));
  assert.ok(rangs.every((r) => r >= 0), 'une unité de la palette a un châssis hors de l\'ordre');
  for (let i = 1; i < rangs.length; i += 1) {
    assert.ok(rangs[i] >= rangs[i - 1],
      `la palette casse l'ordre des châssis au rang ${i} : ${rangs.join(' ')}`);
  }
  // Les trois groupes sont non vides : sans ça, la monotonie ci-dessus serait
  // vraie d'une palette qui ne montrerait qu'un seul châssis.
  assert.equal(new Set(rangs).size, ORDRE_CHASSIS.length);

  // ⚠⚠ ET LE TRI EST L'IDENTITÉ SUR LE ROSTER D'AUJOURD'HUI — relevé, pas
  // supposé : c'est ce qui dit que ce lot ne déplace AUCUNE vignette à l'écran.
  // ⚠⚠ D'OÙ UNE FALSIFICATION QUI NE MORD PAS, ET ELLE SE DÉCLARE : retirer le
  // `sort` d'`unitesDeLaPalette` laisse ce test ENTIÈREMENT VERT — mesuré, 22
  // pass / 0 fail —, `UNITES` étant déjà écrite escouades, blindés, aéronefs.
  // Ce que la garde attrape, c'est l'ordre lui-même : renverser `ORDRE_CHASSIS`
  // la fait tomber, et un châssis hors de la table fait LEVER la palette. Elle
  // tombera pour de bon le jour où quelqu'un insérera une quinzième unité au
  // mauvais rang, et c'est précisément ce qu'on lui demande de garder.
  assert.deepEqual(unitesDeLaPalette(etat).map((u) => u.id), Object.keys(UNITES));

  // ⚠ L'ORDRE DES CHÂSSIS EST DANS `data/`, PAS DANS L'ÉCRAN. Un tableau écrit
  // à la main dans `ui/offense.js` serait une seconde table de calibrage.
  assert.ok(!/'escouade'/.test(source), 'l\'écran nomme un châssis en dur');
});

test('offense — les quatre vagues occupent tout le bassin, sans déformer les pièces', () => {
  // ⚠⚠ ETHAN, 03/09 : « repartir les unités de l'armée en quinconce comme sur le
  // screen pour utiliser toute la place ». Les quatre rangées s'empilaient en
  // haut du bassin et la moitié basse restait du sol nu — c'est ce que montre sa
  // capture. Le quinconce, lui, ne bouge pas : il était déjà là depuis le lot
  // OFFENSE, et ce qu'il demande est la répartition VERTICALE.
  const feuille = readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const bassin = feuille.match(/#offense-vagues\s*\{([^}]*)\}/)[1];
  assert.match(bassin, /display:\s*flex/);
  assert.match(bassin, /flex-direction:\s*column/);
  assert.match(bassin, /justify-content:\s*space-between/,
    'les vagues ne se répartissent pas sur la hauteur');
  // ⚠ ET UN ÉCART MINIMUM SUBSISTE : sur un écran court, `space-between` n'a
  // plus de mou à distribuer, et deux vagues collées se liraient comme une.
  assert.match(bassin, /gap:\s*\d+px/, 'les vagues peuvent se coller sur un écran court');

  // ⚠⚠ ET C'EST LA MOITIÉ QUI COMPTE : LES CASES RESTENT CARRÉES. L'autre façon
  // d'occuper la place — laisser les emplacements GRANDIR en hauteur — a été
  // écartée par la mesure, pas par goût : `.piece` prend sa largeur ET sa
  // hauteur en POURCENTAGE de son emplacement, donc une case haute et étroite
  // étire le sprite. Le test lit les deux propriétés plutôt que de le croire.
  // ⚠ LE SÉLECTEUR PORTE DEUX BLOCS — l'un pose la colonne du quinconce,
  // l'autre le dessin — et ne lire que le premier faisait tomber ce test sur du
  // code juste. On les joint.
  const emplacement = [...feuille.matchAll(/#ecran-offense \.emplacement \{([^}]*)\}/g)]
    .map((m) => m[1]).join('\n');
  assert.match(emplacement, /aspect-ratio:\s*1/,
    'les emplacements ne sont plus carrés : les sprites vont s\'étirer');
  // ⚠ `[^{]*` ET NON UNE ESPACE : la règle porte deux sélecteurs depuis que les
  // vagues du raid la partagent (lot ÉCRAN-RAID). Le motif d'hier ne trouvait
  // plus le bloc et faisait tomber ce test sur du CSS juste.
  const piece = feuille.match(/#ecran-offense \.emplacement \.piece[^{]*\{([^}]*)\}/)[1];
  const largeur = piece.match(/width:\s*([^;]+);/)[1].trim();
  const hauteur = piece.match(/height:\s*([^;]+);/)[1].trim();
  assert.equal(largeur, hauteur,
    'la pièce ne prend plus la même fraction en largeur et en hauteur');
  // ⚠ ET LA FRACTION PARTAGÉE EST BIEN UN POURCENTAGE — c'est de là que vient
  // la déformation : un pourcentage se résout sur la LARGEUR du bloc pour
  // `width` et sur sa HAUTEUR pour `height`. En pixels, une case rectangulaire
  // ne déformerait rien, et cette garde n'aurait plus de raison d'être.
  assert.match(piece, /--jeton-part:\s*\d+%/,
    'la pièce ne se mesure plus en pourcentage de sa case');

  // ⚠⚠ ET LE PREMIER EMPLACEMENT FAIT LA MÊME LARGEUR QUE LES HUIT AUTRES —
  // DÉFAUT ANTÉRIEUR AU LOT, TROUVÉ AU BOOT SANS TÊTE, PAS À LA RELECTURE.
  // `grid-column: span 2` est le raccourci de `grid-column-start: span 2` +
  // `grid-column-end: auto` : la règle qui posait ensuite `grid-column-start: 1`
  // écrasait le `span 2` du START et laissait le END à `auto`, donc UNE colonne.
  // Mesuré dans Chromium à 360 px CSS : première case 15,5 px, les huit autres
  // 34, et 37 px perdus au bord droit. Les deux règles écrivent donc la position
  // ET la portée d'un coup.
  for (const regle of [/\.emplacements \.emplacement:first-child \{([^}]*)\}/,
    /\.emplacements\.decalee \.emplacement:first-child \{([^}]*)\}/]) {
    const bloc = feuille.match(regle)[1];
    assert.match(bloc, /grid-column:\s*\d+ \/ span 2/,
      `le premier emplacement perd sa portée : ${bloc.trim()}`);
    assert.doesNotMatch(bloc, /grid-column-start/,
      'la position seule écrase la portée — c\'est le défaut du 03/09');
  }

  // ⚠ ET UNE VAGUE NE SE LAISSE PAS ÉCRASER : sans ça, quatre vagues dans un
  // bassin trop court rétréciraient au lieu de faire défiler, et le carré
  // ci-dessus ne tiendrait plus.
  const vague = feuille.match(/#ecran-offense \.vague \{([^}]*)\}/)[1];
  assert.match(vague, /flex:\s*0 0 auto/, 'une vague peut encore se faire écraser');
  assert.match(bassin, /overflow-y:\s*auto/, 'le bassin ne défile plus quand il déborde');
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
/**
 * ⚠⚠ LE LIVRABLE N'A PLUS AUCUN COMMENTAIRE, ET CETTE FONCTION EST DEVENUE UN
 * NO-OP — lot ARRIVÉE-CARTE-ET-BUILD, 10/09. Elle retirait la prose HTML et CSS
 * de `dist/index.html` pour que les assertions d'absence ci-dessous ne tombent
 * pas sur un identifiant cité dans un commentaire. Ethan : « Les virer du
 * build. » `tools/build.js` retire désormais les DEUX, donc **mesuré : zéro `/*`
 * et zéro `<!--` dans la page produite**.
 *
 * ⚠ ELLE EST DONC RETIRÉE, PAS GARDÉE VIDE : une fonction qui ne fait plus rien
 * laisse croire qu'elle protège de quelque chose. Ce qui la remplace est plus
 * fort — les assertions portent sur le fichier BRUT, et c'est l'absence totale
 * de commentaire qui les rend honnêtes. Le témoin de non-vacuité qui prouvait
 * que le décommenteur mordait est réécrit en conséquence.
 */
function pageBrute() {
  return readFileSync(join(RACINE, 'dist', 'index.html'), 'utf8');
}

test('offense — le HTML produit porte l\'écran, et il n\'a plus d\'en-tête à lui', () => {
  const html = pageBrute();
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

  // ⚠⚠ FALSIFIABLE DANS LES DEUX SENS, ET LE TÉMOIN A CHANGÉ DE NATURE — lot
  // ARRIVÉE-CARTE-ET-BUILD. Il exigeait que la PROSE du livrable cite encore
  // `offense-tete`, sans quoi le décommenteur ne mesurait rien ; les commentaires
  // ne sont plus dans le livrable, donc ce témoin-là est mort avec eux. Ce qui le
  // remplace est ce qui rend les assertions d'absence honnêtes MAINTENANT : la
  // page produite ne porte **aucun** commentaire, d'aucune sorte, donc un
  // identifiant qu'on n'y trouve pas est réellement absent et pas seulement
  // « absent du code ».
  assert.ok(html.includes('<div id="ecran-offense"'));
  assert.doesNotMatch(html, /\/\*/, 'le livrable porte encore un commentaire CSS');
  assert.doesNotMatch(html, /<!--/, 'le livrable porte encore un commentaire HTML');
  // ⚠ ET LA SOURCE, ELLE, LES GARDE TOUS — c'est l'autre moitié, et c'est celle
  // qu'un lot pourrait casser en croyant bien faire. Ils sortent du LIVRABLE,
  // jamais du dépôt.
  const source = readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8');
  assert.ok(source.includes('offense-tete'),
    'la prose de la source ne cite plus l\'ancien en-tête : le retrait a mordu sur le dépôt');
  assert.ok((source.match(/\/\*/g) ?? []).length > 100,
    'la source a perdu ses commentaires de feuille : ils sortent du livrable, pas du dépôt');
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
  // ⚠⚠ ET LES TROIS BÂTIMENTS DE PRODUCTION — lot PRODUCTION-EN-DÉFENSE. La
  // règle « infanterie inconstructible sans caserne » est descendue dans le
  // modèle : un montage qui pose une Meute doit porter la Caserne, exactement
  // comme il porte le Centre de commandement pour avoir un budget. Sans eux,
  // chaque test de cet écran tomberait sur un refus qui n'est pas son sujet.
  poserLesBatimentsDeProduction(etat);
  return etat;
}

test('offense — la vue lit l\'armée de l\'état, case par case', () => {
  const etat = baseAvecCommandement(12);
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
  // ⚠ LE MOTIF LIT LE BLOC D'IMPORT, PLUS LA DERNIÈRE LIGNE. Il exigeait que
  // `poserCouches` soit le DERNIER nom avant l'accolade : un nom ajouté après
  // lui — ce que le lot ERGONOMIE a fait en important le panneau — le faisait
  // tomber sans qu'aucune règle soit enfreinte. Ce qui compte est
  // l'APPARTENANCE au bloc, pas la position dans la liste.
  const blocChantier = ecran.match(/import \{([^}]*)\} from '\.\/chantier\.js';/);
  assert.ok(blocChantier !== null, 'l\'Offense n\'importe plus rien du Chantier');
  const importes = blocChantier[1].split(',').map((n) => n.trim());
  assert.ok(importes.includes('poserCouches'),
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
  // ⚠ ON LIT L'INSTRUCTION ENTIÈRE, PAS LA LIGNE. L'affectation tient sur deux
  // lignes depuis que le niveau visé s'écrit pour de bon ; s'arrêter au premier
  // saut de ligne ne montrerait que la garde et jamais ce qui est affiché,
  // c'est-à-dire précisément la moitié que ce test existe pour voir.
  const debutEm = ecran.indexOf('offense-ameliorer-cible');
  const ecriture = ecran.slice(debutEm, ecran.indexOf(';', debutEm));
  assert.ok(!/engages|budget/.test(ecriture),
    `le compteur de points est reparti dans le bouton Améliorer : ${ecriture.trim()}`);

  // ⚠⚠ ET LE JOUR ANNONCÉ EST ARRIVÉ. Cette assertion était un PIÈGE POSÉ
  // EXPRÈS le 31/08 : elle exigeait `agir === null` avec, pour message, « vérifier
  // ce que le bouton annonce désormais ». Elle a fait exactement son travail —
  // elle est tombée au lot qui branche le moteur, et pas avant. Ce qu'elle
  // garde maintenant est la MOITIÉ QUI RESTAIT INVÉRIFIÉE : l'`<em>` écrit bien
  // le niveau VISÉ, c'est-à-dire `niveau + 1` et non le niveau courant.
  assert.equal(typeof ACTIONS_ARMEE.ameliorer.agir, 'function',
    'améliorer a reperdu son moteur : cet `<em>` doit redevenir vide');
  assert.match(ecriture, /niveau\s*\+\s*1/,
    `le bouton n'annonce pas le niveau visé : ${ecriture.trim()}`);
  assert.match(ecriture, /vers niv\./,
    'le bouton n\'écrit plus « vers niv. » — le joueur ne sait plus ce qu\'il achète');
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
  // ⚠ CETTE ASSERTION A CHANGÉ DE FORME LE 03/09, ET ELLE S'EST RESSERRÉE. Elle
  // cherchait `grid-column-start: 2` — la position SEULE, qui écrasait la portée
  // et rendait le premier emplacement deux fois trop étroit (voir le test des
  // quatre vagues). Elle exige maintenant la position ET la portée.
  assert.match(bloc, /\.decalee \.emplacement:first-child \{ grid-column: 2 \/ span 2/,
    'la rangée décalée ne commence plus une demi-case plus loin, ou perd sa portée');
  assert.doesNotMatch(bloc, /repeat\(\s*\d/,
    'le nombre de demi-colonnes est écrit dans la feuille : c\'est une seconde vérité');
});

test('offense — la sélection survit à l\'amélioration, et la ligne ne dit pas une demi-phrase', () => {
  // ⚠⚠ DEUX DÉFAUTS QUE LE BOOT SANS TÊTE A TROUVÉS, ET QUE CE LOT AVAIT
  // INTRODUITS LUI-MÊME EN BRANCHANT LE MOTEUR. Les deux étaient invisibles
  // tant qu'`ACTIONS_ARMEE.ameliorer.agir` valait `null`.
  const ecran = readFileSync(join(RACINE, 'src', 'ui', 'offense.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !l.trimStart().startsWith('//')).join('\n');

  // (1) `appliquerAction` lâchait la sélection après N'IMPORTE QUELLE action.
  // Sans effet tant que « Retirer » était la seule à agir — elle fait vraiment
  // disparaître la pièce —, et faux dès qu'« Améliorer » a eu un moteur : le
  // joueur perdait son unité de vue au moment même où il venait de la monter.
  // Mesuré dans Chromium avant le correctif : la barre repassait à « aucune
  // unité sélectionnée » et l'`<em>` à « vers niv. » tout seul.
  //
  // ⚠ ET C'EST LA TABLE QUI LE DIT, comme `cible`. Un `nom === 'retirer'` aurait
  // été le second cas particulier écrit à la main du dépôt sur cette question.
  assert.equal(ACTIONS_ARMEE.retirer.retireLaPiece, true);
  for (const nom of ['ameliorer', 'reparer', 'deplacer']) {
    assert.notEqual(ACTIONS_ARMEE[nom].retireLaPiece, true,
      `« ${nom} » se dit destructrice : la sélection serait lâchée pour rien`);
  }
  assert.ok(!/=== 'retirer'/.test(ecran), 'l\'écran reconnaît « retirer » par son nom');
  assert.match(ecran, /retireLaPiece === true/,
    'la sélection ne lit pas la table : elle est lâchée après chaque action');
  assert.ok(!/\n\s*selection = null;\n\s*peindre\(etatCourant\);/.test(ecran),
    'la sélection est encore lâchée inconditionnellement après une action');

  // (2) L'`<em>` interpolait le niveau visé À L'INTÉRIEUR du gabarit, si bien
  // qu'une barre sans unité choisie annonçait « vers niv. » — une demi-phrase.
  // La garde nomme la propriété : le gabarit ne s'écrit PAS quand il n'y a rien
  // à viser.
  const debutEm = ecran.indexOf('offense-ameliorer-cible');
  const ecriture = ecran.slice(debutEm, ecran.indexOf(';', debutEm));
  assert.match(ecriture, /piece === null/,
    'la ligne s\'écrit sans savoir s\'il y a une unité choisie');
  const gabarit = ecriture.slice(ecriture.indexOf('vers niv.'));
  assert.ok(!/\?|:/.test(gabarit),
    `le niveau visé est encore conditionnel DANS le gabarit : ${gabarit.trim()}`);
});

// ---------------------------------------------------------------------------
// ERGO T8 — le refus d'armement sort plus gros et en rouge
// ---------------------------------------------------------------------------

/** La source, commentaires ôtés — une garde ne lit jamais sa propre prose. */
const sansCommentaires = (source) => source
  .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');

test('ERGO T8 — `ligneAAfficher` rend un TON, et aucune taille n\'est écrite dans le JS', () => {
  // ⚠⚠ C'EST UN TON DE PLUS, PAS UNE TAILLE SUR UN APPEL. La fonction est pure
  // et testée ; y écrire « 14 px » mettrait une décision de feuille dans un
  // module que le dépôt garde justement pour sa pureté.
  assert.deepEqual(ligneAAfficher({ toast: 'x', tonDuToast: 'refus' }),
    { texte: 'x', ton: 'refus' });
  // Le défaut ne bouge pas : un toast sans ton reste une alerte.
  assert.deepEqual(ligneAAfficher({ toast: 'x' }), { texte: 'x', ton: 'alerte' });
  // Et la priorité n'a pas changé : la session passe devant tout.
  assert.deepEqual(ligneAAfficher({ session: 's', toast: 'x', tonDuToast: 'refus' }),
    { texte: 's', ton: 'alerte' });
  assert.deepEqual(ligneAAfficher({ mode: 'm' }), { texte: 'm', ton: 'mode' });
  assert.deepEqual(ligneAAfficher({}), { texte: '', ton: null });

  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'offense.js'), 'utf8'));
  const pur = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'chantier.js'), 'utf8'));
  const fonction = pur.match(/export function ligneAAfficher\([\s\S]*?\n\}/);
  assert.ok(fonction !== null);
  assert.doesNotMatch(fonction[0], /px|font-size|color/, 'une décision de feuille est entrée dans la fonction pure');

  // ⚠⚠ UN SEUL TOAST SORT EN `refus`, ET C'EST CELUI QU'ETHAN NOMME : le
  // dépassement de budget d'armée. Un second ferait du ton un synonyme
  // d'« alerte », donc rien du tout.
  assert.equal((ecran.match(/, 'refus'\)/g) ?? []).length, 1,
    'un second toast sort en refus : le ton cesse de distinguer');
  assert.match(ecran, /points dépasseraient le budget[\s\S]{0,80}, 'refus'\)/,
    'ce n\'est pas le refus de budget qui sort en rouge');
  assert.match(ecran, /ligne\.classList\.toggle\('refus', ton === 'refus'\);/,
    'l\'écran ne peint plus le ton de refus');

  // ⚠ ET LA FEUILLE PORTE LA TAILLE ET LA TEINTE. `#E43E32` est déjà la teinte
  // des refus de l'interface — quatre emplois avant celui-ci — et le test qui
  // la « réserve » porte sur les BORDS D'EMBLÈME de la carte, pas sur l'écran.
  const feuille = readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const regle = feuille.match(/#offense-avis\.refus[^{]*\{[^}]*\}/);
  assert.ok(regle !== null, 'le ton de refus n\'a pas de règle');
  assert.match(regle[0], /#E43E32/, 'le refus n\'est pas rouge');
  const taille = Number((regle[0].match(/font-size: (\d+)px/) ?? [])[1]);
  const normale = Number((feuille.match(/#offense-avis \{[^}]*font-size: (\d+)px/) ?? [])[1]);
  assert.ok(Number.isFinite(taille) && Number.isFinite(normale), 'les deux tailles doivent se lire');
  assert.ok(taille > normale, `refus à ${taille} px contre ${normale} px : ce n'est pas « plus gros »`);
});

// ---------------------------------------------------------------------------
// RETOUR-DE-RAID — points 6 et 21 d'Ethan, 06/09, sur l'écran Offense
// ---------------------------------------------------------------------------
//
// ⚠⚠ CE FICHIER NE MONTAIT AUCUN ÉCRAN, ET DEUX POINTS DE CE LOT-CI SONT DANS
// LE DOM. Le niveau peint sur une case et le routage d'un dépôt vers la
// permutation ne se lisent pas dans une fonction pure : asserter que la source
// CONTIENT un appel prouve la ligne, pas le chemin — c'est le proxy que ce dépôt
// a déjà payé quatre fois. Le faux document est écrit à la main, sur le modèle
// de ceux de `chantier.test.js`, `recherche.test.js`, `monde.test.js` et
// `raid-ecran.test.js` ; **aucune dépendance n'entre** (CLAUDE.md §3).

/** Un document de papier qui porte exactement les identifiants de l'écran. */
function fauxDocumentOffense() {
  const IDS = [
    'offense-vagues', 'offense-palette', 'offense-avis', 'offense-champ',
    'offense-contexte', 'offense-selection-nom', 'offense-selection-detail',
    // ⚠ LE DEVIS DE RÉPARATION DE LA PIÈCE SÉLECTIONNÉE — point 8, 11/09.
    'offense-selection-cout',
    'offense-ameliorer-cible', 'offense-reparer', 'offense-ameliorer',
    'offense-deplacer', 'offense-retirer', 'offense-panneau',
    'offense-panneau-titre', 'offense-panneau-corps', 'offense-panneau-fermer',
    'offense-panneau-ameliorer', 'offense-reserve',
    // ⚠ « TOUT RÉPARER » — Ethan, 10/09, point 6. La confrontation ci-dessous le
    // cherche AUSSI dans le balisage : la liste et la page se tiennent l'une
    // l'autre, dans les deux sens.
    'offense-tout-reparer',
    // ⚠ LE JOURNAL DES RAIDS N'EST PLUS DE CET ÉCRAN — Ethan, 10/09, point 4.
    // Ses cinq identifiants ont quitté cette liste avec le balisage : c'est
    // exactement ce que la confrontation ci-dessous existe pour dire, et elle
    // l'a dit — les cinq y sont restés le temps d'un `npm test`.
  ];
  // ⚠ LA LISTE SE CONFRONTE AU BALISAGE, elle ne se croit pas sur parole : le
  // faux garde donc aussi que l'écran ne demande rien que la page n'ait pas.
  const html = readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8');
  for (const id of IDS) {
    assert.match(html, new RegExp(`id="${id}"`), `« ${id} » n'est pas dans le balisage`);
  }

  const faire = (tag) => {
    const el = {
      tag,
      hidden: false,
      disabled: false,
      type: '',
      title: '',
      style: {},
      dataset: {},
      classes: new Set(),
      children: [],
      parent: null,
      _texte: '',
      classList: {
        add(...n) { for (const c of n) el.classes.add(c); },
        remove(...n) { for (const c of n) el.classes.delete(c); },
        contains(c) { return el.classes.has(c); },
        toggle(c, force) {
          const veut = force === undefined ? !el.classes.has(c) : force;
          if (veut) el.classes.add(c); else el.classes.delete(c);
          return veut;
        },
      },
      set className(v) { el.classes = new Set(String(v).split(/\s+/).filter(Boolean)); },
      get className() { return [...el.classes].join(' '); },
      // ⚠ ÉCRIRE `textContent` VIDE LES ENFANTS : les deux peintres repartent
      // d'une grille vide par `hote.textContent = ''`, et un faux qui garderait
      // ses enfants ferait s'empiler quatre vagues à chaque repeint.
      set textContent(v) { el.children.length = 0; el._texte = String(v); },
      get textContent() { return el._texte; },
      appendChild(n) { el.children.push(n); n.parent = el; return n; },
      append(...n) { for (const x of n) el.appendChild(x); },
      attributs: new Map(),
      setAttribute(nom, valeur) { el.attributs.set(nom, valeur); },
      removeAttribute(nom) { el.attributs.delete(nom); if (nom === 'title') el.title = ''; },
      /** Remonte l'arbre, sur une classe — c'est tout ce que l'écran demande. */
      closest(selecteur) {
        const classe = selecteur.replace(/^\./, '');
        let noeud = el;
        while (noeud !== null) {
          if (noeud.classes.has(classe)) return noeud;
          noeud = noeud.parent;
        }
        return null;
      },
      ecouteurs: new Map(),
      addEventListener(type, fn) {
        if (!el.ecouteurs.has(type)) el.ecouteurs.set(type, []);
        el.ecouteurs.get(type).push(fn);
      },
      envoyer(type, evenement = {}) {
        const fns = el.ecouteurs.get(type);
        assert.ok(fns && fns.length > 0, `rien n'écoute « ${type} » ici`);
        for (const fn of fns) fn(evenement);
      },
    };
    return el;
  };

  const parId = new Map(IDS.map((id) => [id, faire('div')]));
  const doc = {
    head: faire('head'),
    documentElement: faire('html'),
    getElementById(id) {
      if (!parId.has(id)) {
        throw new Error(`faux document : « ${id} » n'est pas dans src/index.src.html`);
      }
      return parId.get(id);
    },
    createElement: (tag) => { const el = faire(tag); el.ownerDocument = doc; return el; },
    createTextNode: (texte) => ({ textContent: String(texte) }),
    defaultView: {
      getComputedStyle: () => ({ getPropertyValue: (nom) => `url("${nom}")` }),
      // ⚠ LE TOAST POSE UNE MINUTERIE, ET LE FAUX N'EN AVAIT PAS — tout geste
      // qui dit son bilan levait « fenetre.setTimeout is not a function » à des
      // lieues de sa cause. Elle ne se DÉCLENCHE jamais ici : ce qu'on garde,
      // c'est qu'un geste s'exécute, pas qu'un message s'efface quatre secondes
      // plus tard. Faire échoir ce qui traîne est le travail de `PC T5`, sur un
      // autre écran et avec une horloge à lui.
      setTimeout: () => 0,
      clearTimeout: () => {},
    },
  };
  for (const el of parId.values()) el.ownerDocument = doc;
  doc.head.ownerDocument = doc;
  return { doc, parId };
}

/** Les trente-six cases de la grille des vagues, à plat. */
function casesDesVagues(parId) {
  // ⚠⚠ LE TITRE D'UNE VAGUE A DES ENFANTS DEPUIS LE LOT CÂBLAGE, 07/09, ET
  // CETTE FONCTION DESCENDAIT DEDANS. Le `h2` ne portait que du texte ; il porte
  // maintenant son pictogramme et un nœud de texte, et le balayage à plat
  // rendait deux nœuds de plus par vague — dont un sans `dataset`, d'où un
  // « lecture de `vague` sur `undefined` » à des lieues de sa cause. On ne
  // descend donc plus que dans la RANGÉE d'emplacements, qui est nommée.
  return parId.get('offense-vagues').children
    .flatMap((vague) => vague.children.filter((c) => c.classList.contains('emplacements')))
    .flatMap((rangee) => rangee.children);
}

/** La case d'une vague et d'une colonne. */
function caseDe(parId, vague, colonne) {
  const trouvee = casesDesVagues(parId).find(
    (c) => c.dataset.vague === String(vague) && c.dataset.colonne === String(colonne),
  );
  assert.ok(trouvee !== undefined, `pas de case en vague ${vague}, colonne ${colonne}`);
  return trouvee;
}


/**
 * Un doigt sur une case de la grille des vagues.
 *
 * ⚠ L'ÉCOUTEUR EST DÉLÉGUÉ À `#offense-vagues`, PAS POSÉ SUR CHAQUE CASE — la
 * grille se repeint à chaque geste, et un écouteur par case serait reposé
 * trente-six fois par repeint. L'évènement part donc de l'hôte, avec la case
 * pour cible, exactement comme le navigateur le livre.
 */
function toucher(parId, vague, colonne) {
  parId.get('offense-vagues').envoyer('click', { target: caseDe(parId, vague, colonne) });
}

test('RDR T8 bis — le niveau d\'une pièce se lit sur sa case, et il vient de l\'aperçu', () => {
  // ⚠⚠ ETHAN, 06/09 : « le niveau des unités offensives ne s'affiche pas dans
  // l'ui ». Il était dans le `title`, et un `title` ne s'ouvre pas au doigt.
  //
  // ⚠ LE MONTAGE MONTE DEUX PIÈCES À DES NIVEAUX DIFFÉRENTS ET DIFFÉRENTS DE 1 :
  // à niveau 1 partout, un « 1 » écrit en dur passerait le test.
  const etat = baseAvecCommandement(12);
  poserEffectif(etat, 'armee', { id: 'meute', vague: 1, colonne: 2, niveau: 4 });
  poserEffectif(etat, 'armee', { id: 'meute', vague: 2, colonne: 5, niveau: 9 });
  const { doc, parId } = fauxDocumentOffense();
  const ecran = initialiserEcranOffense(doc);
  ecran.peindre(etat);

  const pastilleDe = (vague, colonne) => {
    const trouvee = caseDe(parId, vague, colonne).children
      .find((e) => e.classList.contains('niveau'));
    return trouvee === undefined ? null : trouvee.textContent;
  };
  assert.equal(pastilleDe(1, 2), '4', 'la case ne porte pas le niveau de sa pièce');
  assert.equal(pastilleDe(2, 5), '9', 'la seconde case ne porte pas le niveau de sa pièce');
  // ⚠ ET UNE CASE VIDE N'EN PORTE PAS : la pastille n'est pas un décor de case.
  assert.equal(pastilleDe(4, 9), null, 'une case vide porte une pastille de niveau');

  // ⚠⚠ ET LE NOMBRE SUIT LE MOTEUR, IL N'EST PAS FIGÉ AU PREMIER PEINT. C'est
  // ce qui manquait vraiment : `ACTIONS_ARMEE.ameliorer` a un moteur depuis le
  // 03/09, et le joueur montait une pièce sans jamais voir le résultat.
  ACTIONS_ARMEE.ameliorer.agir(etat, 0);
  ecran.peindre(etat);
  assert.equal(pastilleDe(1, 2), '5', 'la pastille ne suit pas l\'amélioration');
});

test('RDR T9 bis — déposer sur une case occupée PERMUTE, au lieu de refuser', () => {
  // ⚠⚠ ETHAN, 06/09 : « on peut permuter des unités lors du glisser déposer. »
  // Le geste ne change pas — on prend, on dépose ; ce qui change est ce que
  // « déposer sur une case prise » veut dire.
  const etat = baseAvecCommandement(12);
  poserEffectif(etat, 'armee', { id: 'meute', vague: 1, colonne: 2, niveau: 1 });
  poserEffectif(etat, 'armee', { id: 'ratisseur', vague: 3, colonne: 7, niveau: 1 });
  const { doc, parId } = fauxDocumentOffense();
  const ecran = initialiserEcranOffense(doc);
  ecran.peindre(etat);
  const armee = baseCourante(etat).armee;
  const engagesAvant = pointsEngages(etat, 'armee');

  // Premier temps : on SÉLECTIONNE la pièce, puis on arme « Déplacer », qui la
  // prend en main. C'est le chemin du doigt, pas un raccourci.
  toucher(parId, 1, 2);
  parId.get('offense-deplacer').envoyer('click');
  toucher(parId, 1, 2);
  assert.equal(parId.get('offense-avis').textContent,
    messageDeDestinationDUnite(UNITES.meute.nom.joueur),
    'la pièce n\'est pas en main : le montage ne mesure pas un dépôt');

  // Second temps : on dépose sur la case OCCUPÉE par l'autre.
  toucher(parId, 3, 7);

  assert.equal(armee.length, 2, 'une pièce a disparu dans la permutation');
  assert.deepEqual(
    { v: armee[0].vague, c: armee[0].colonne }, { v: 3, c: 7 },
    'la pièce en main n\'a pas pris la case de l\'autre',
  );
  assert.deepEqual(
    { v: armee[1].vague, c: armee[1].colonne }, { v: 1, c: 2 },
    'l\'occupante n\'a pas pris la case de la pièce en main',
  );
  // ⚠ ET LE REFUS D'AVANT A DISPARU : aucun toast ne s'est écrit.
  assert.ok(!/occup/i.test(parId.get('offense-avis').textContent),
    `le dépôt a été refusé : « ${parId.get('offense-avis').textContent} »`);
  // ⚠ ET ÇA NE COÛTE RIEN.
  assert.equal(pointsEngages(etat, 'armee'), engagesAvant, 'la permutation a changé le budget');

  // ⚠⚠ ET LE DÉPÔT SUR SA PROPRE CASE RESTE UN DÉPLACEMENT, PAS UNE PERMUTATION.
  // Router ce cas-là vers l'échange le ferait LEVER — une pièce ne se permute
  // pas avec elle-même — et le joueur perdrait son annulation.
  parId.get('offense-deplacer').envoyer('click');
  toucher(parId, 3, 7);
  toucher(parId, 3, 7);
  assert.deepEqual(
    { v: armee[0].vague, c: armee[0].colonne }, { v: 3, c: 7 },
    'reposer une pièce sur sa propre case ne la laisse plus en place',
  );
});

// ---------------------------------------------------------------------------
// PRODUCTION-EN-DÉFENSE — l'autre palette, 07/09/2026
// ---------------------------------------------------------------------------

test('PD T9 — non-régression : la palette d\'Offense ne retire pas non plus, elle GRISE', () => {
  // ⚠⚠ LE BRIEF DEMANDAIT « LA PALETTE D'OFFENSE RETIRE TOUJOURS », ET C'EST LA
  // PRÉMISSE QUI ÉTAIT PÉRIMÉE — mesuré, pas supposé. Cette palette a cessé de
  // filtrer le 29/08 : Ethan avait rapporté deux unités « indisponibles » qu'il
  // attendait, et une palette qui CACHE ne peut pas répondre à ça. Les deux
  // écrans grisent donc, et depuis ce lot les deux sont gardés par le modèle. Le
  // commentaire de `posablesDeLaDefense` qui affirmait le contraire est parti
  // avec cette mesure — un commentaire qui décrit un état révolu envoie chercher
  // une différence qui n'existe plus.
  const roster = Object.keys(UNITES).length;

  const sansRien = unitesDeLaPalette(creerEtat(7));
  assert.equal(sansRien.length, roster, 'la palette d\'Offense a changé de longueur');

  const avecQg = baseAvecCommandement(GEOGRAPHIE.niveauPlafond);
  avecQg.recherche.acquises.offense = Object.keys(UNITES).sort();
  const armee = unitesDeLaPalette(avecQg);
  assert.equal(armee.length, roster, 'la palette d\'Offense a changé de longueur');
  assert.deepEqual(sansRien.map((u) => u.id), armee.map((u) => u.id),
    'la palette d\'Offense ne montre plus les mêmes unités dans le même ordre');

  // ⚠ ET LA LONGUEUR NE BOUGE PAS ENTRE « AVEC » ET « SANS » BÂTIMENT DE
  // PRODUCTION : c'est la propriété que ce test garde, et la seule qui
  // distinguerait un filtrage revenu d'un grisage.
  const sansProduction = { ...avecQg };
  sansProduction.bases = avecQg.bases.map((b) => ({
    ...b, disposition: b.disposition.filter((x) => !Object.values(BATIMENT_DE_CHASSIS).includes(x.id)),
  }));
  const eteinte = unitesDeLaPalette(sansProduction);
  assert.equal(eteinte.length, roster, 'retirer les bâtiments a raccourci la palette');
  assert.ok(eteinte.every((u) => !u.disponible), 'sans bâtiment, une unité reste constructible');
  assert.ok(armee.some((u) => u.disponible), 'avec les bâtiments, rien n\'est constructible');

  // Chaque vignette éteinte DIT pourquoi, et c'est la phrase du modèle.
  const meute = eteinte.find((u) => u.id === 'meute');
  assert.equal(meute.raison, messageSansBatiment(BASE_BATIMENTS.caserne.nom.joueur, 'escouade'));
  assert.deepEqual(
    problemesDeLaPoseDEffectif(sansProduction, 'armee', {
      id: 'meute', vague: 1, colonne: 1, niveau: 1,
    }).map((p) => p.message),
    [meute.raison],
    'le modèle et la palette ne disent plus la même phrase',
  );
});

// ---------------------------------------------------------------------------
// lot RETOUCHES — 07/09/2026 : points 16 et 10
// ---------------------------------------------------------------------------

/** Une base qui porte un budget d'armée ET deux pièces posées. */
function partieAvecBudget() {
  const etat = baseAvecCommandement(12);
  poserEffectif(etat, 'armee', { id: 'meute', vague: 1, colonne: 1, niveau: 3 });
  poserEffectif(etat, 'armee', { id: 'meute', vague: 2, colonne: 4, niveau: 5 });
  return etat;
}

/** L'écran Offense monté sur un faux document, peint une fois. */
function ecranOffenseMonte(etat) {
  const { doc, parId } = fauxDocumentOffense();
  const ecran = initialiserEcranOffense(doc);
  ecran.peindre(etat);
  return { doc, parId, ecran };
}

/**
 * Le texte d'un nœud du faux document, enfants compris.
 *
 * ⚠ `peindreVueDuPanneau` COMPOSE SON TITRE, il ne l'écrit pas d'un trait :
 * `textContent = ''` puis `append(createTextNode(...))`. Lire `textContent` sur
 * l'hôte rend donc la chaîne VIDE, et une assertion écrite ainsi passerait au
 * vert le jour où le panneau cesserait de peindre.
 */
function texteDe(el) {
  if (el === null || el === undefined) return '';
  const enfants = (el.children ?? []).map(texteDe).join('');
  return `${el.textContent ?? ''}${enfants}`;
}

/** La feuille, commentaires ôtés — une garde ne lit pas sa propre prose. */
function feuilleDecommentee() {
  return readFileSync(join(RACINE, 'src', 'index.src.html'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Le corps d'une règle CSS, par sélecteur exact. */
function regleCss(selecteur) {
  const motif = new RegExp(`${selecteur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`);
  const trouvee = feuilleDecommentee().match(motif);
  assert.ok(trouvee, `la règle « ${selecteur} » a disparu de la feuille`);
  return trouvee[1];
}

test('RET T5 — la palette de l\'Offense n\'a plus de fond plein', () => {
  // ⚠⚠ ETHAN, 07/09, POINT 16, PRÉCISÉ « DANS LE MENU OFFENSE ». Le lot
  // ÉCRAN-DÉFENSE avait traité la palette du CHANTIER ; celle-ci portait encore
  // un aplat kaki et un liseré plein.
  //
  // ⚠⚠ `background: transparent` EST OBLIGATOIRE, PAS COSMÉTIQUE — c'est la
  // mesure du lot ÉCRAN-DÉFENSE : un `<button>` sans fond DÉCLARÉ retombe sur
  // le gris clair du navigateur, et les vignettes ressortiraient EN CLAIR sur le
  // bandeau sombre. « Enlever les fonds pleins » se dit en toutes lettres.
  for (const selecteur of ['#ecran-offense .unite', '#offense-palette .unite']) {
    const corps = regleCss(selecteur);
    assert.match(corps, /background:\s*transparent/,
      `« ${selecteur} » ne déclare pas son fond : le navigateur le peindra en clair`);
    assert.ok(!/background:\s*#[0-9A-Fa-f]{6}/.test(corps),
      `« ${selecteur} » porte encore un aplat plein`);
    // ⚠ ET AUCUNE BORDURE PROPRE : elle vient de la règle partagée.
    assert.ok(!/border:\s/.test(corps),
      `« ${selecteur} » écrit sa propre bordure au lieu de prendre la règle partagée`);
  }
});

test('RET T6 — le pointillé vient d\'UNE définition, partagée par les quatre grilles', () => {
  // ⚠⚠ TROIS ÉCRITURES DU MÊME POINTILLÉ AURAIENT DIVERGÉ AU PREMIER RÉGLAGE.
  // C'est `ÉD T12` vu depuis l'autre écran, et il faut les DEUX : celui-là
  // nomme la liste exacte, celui-ci vérifie qu'elle couvre bien les deux
  // palettes ET les deux grilles d'emplacements.
  const feuille = feuilleDecommentee();
  const porteuses = [...feuille.matchAll(/([^{}]+)\{([^}]*border:\s*1px dashed[^}]*)\}/g)]
    .filter(([, , corps]) => /border:\s*1px dashed #4E5742/.test(corps));
  assert.equal(porteuses.length, 1,
    `le pointillé de composition est écrit ${porteuses.length} fois`);
  const selecteurs = porteuses[0][1].split(',').map((x) => x.trim());
  for (const attendu of ['#offense-palette .unite', '.posable',
    '#ecran-offense .emplacement', '#ecran-raid .emplacement']) {
    assert.ok(selecteurs.includes(attendu),
      `« ${attendu} » ne partage plus la règle du pointillé`);
  }
});

test('RET T7 — les trois états de la vignette restent deux à deux différents', () => {
  // ⚠ RETIRER LE FOND RETIRE UN SUPPORT DE LA DISTINCTION. Ce qui la porte
  // désormais est le LISERÉ, comme à la palette du Chantier : `#4E5742` au
  // repos, `#1E2124` verrouillée, `#F5F3E8` armée.
  const repos = regleCss('#offense-palette .unite,\n  .posable')
    ?? null;
  // Le repos se lit sur la règle partagée, les deux autres sur leur propre règle.
  const feuille = feuilleDecommentee();
  const partagee = [...feuille.matchAll(/([^{}]+)\{([^}]*border:\s*1px dashed[^}]*)\}/g)]
    .find(([, , corps]) => /border:\s*1px dashed #4E5742/.test(corps));
  assert.ok(partagee, 'la règle partagée a disparu');
  const teintes = {
    repos: partagee[2].match(/#[0-9A-Fa-f]{6}/)[0].toUpperCase(),
    verrouillee: regleCss('#offense-palette .unite.verrouillee')
      .match(/border-color:\s*(#[0-9A-Fa-f]{6})/)[1].toUpperCase(),
    armee: regleCss('#ecran-offense .unite.choisie')
      .match(/border-color:\s*(#[0-9A-Fa-f]{6})/)[1].toUpperCase(),
  };
  const valeurs = Object.values(teintes);
  assert.equal(new Set(valeurs).size, 3,
    `deux états partagent un liseré : ${JSON.stringify(teintes)}`);
  // ⚠ ET LES TROIS SONT CELLES DU CHANTIER — aucune teinte neuve. `banc.test.js`
  // refuse déjà tout hex hors de la palette ; ici on exige en plus que ce soient
  // les MÊMES trois, pour qu'un seul vocabulaire visuel serve les deux palettes.
  assert.deepEqual(valeurs.slice().sort(), ['#1E2124', '#4E5742', '#F5F3E8']);
  // ⚠ ET L'ARMÉE GARDE DEUX SIGNAUX DE PLUS : le libellé et l'anneau du sprite.
  assert.match(regleCss('#ecran-offense .unite.choisie b'), /color:\s*#F5F3E8/);
  assert.match(regleCss('#ecran-offense .unite.choisie i'), /box-shadow/);
});

test('RET T8 — l\'Offense RETIRE toujours, elle ne grise pas : non-régression', () => {
  // ⚠ ARBITRAGE DU 28/08, INTACT ET NON TOUCHÉ PAR CE LOT : « une palette qui
  // change de longueur déplace les vignettes sous le doigt ». L'Offense grise —
  // classe `verrouillee` — et la vignette reste TOUCHABLE pour dire pourquoi.
  const etat = partieAvecBudget();
  const vue = vueDeLOffense(etat);
  assert.equal(vue.palette.length, Object.keys(UNITES).length,
    'la palette de l\'Offense ne montre plus tout le roster');
  assert.ok(vue.palette.some((u) => !u.disponible),
    'le montage ne mesure rien : aucune unité verrouillée');
  assert.ok(vue.palette.some((u) => u.disponible),
    'le montage ne mesure rien : tout est verrouillé');
  for (const u of vue.palette.filter((x) => !x.disponible)) {
    assert.equal(typeof u.raison, 'string', `« ${u.id} » est verrouillée sans raison`);
  }
  // ⚠ ET LA VIGNETTE ÉTEINTE N'EST PAS `disabled` : elle doit répondre au
  // toucher. La feuille la grise par une classe, jamais par l'attribut.
  assert.match(regleCss('#offense-palette .unite.verrouillee'), /opacity/);
});

test('RET T9 — la réserve de réparation de l\'armée s\'affiche, avec ses trois stocks', () => {
  // ⚠⚠ ETHAN, 07/09, POINT 10 : « Compteur de réparation offensive nulle part ».
  // Mesuré avant d'écrire : AUCUN fichier de `src/ui/` ne lisait
  // `plafondDeLaReserve` ni `reserveReparation` — seul le plafond des BÂTIMENTS
  // était affiché, et au Chantier.
  const etat = partieAvecBudget();
  const laBase = baseCourante(etat);
  // ⚠⚠ LES TROIS RÉSERVES SONT DIFFÉRENTES ENTRE ELLES ET DIFFÉRENTES DE CELLE
  // DES BÂTIMENTS. Deux réserves égales ne distingueraient pas les deux
  // lectures, et c'est le piège que le brief nomme.
  laBase.reserveReparation.escouade = 3 * TICKS_PAR_HEURE;
  laBase.reserveReparation.blinde = 5 * TICKS_PAR_HEURE;
  laBase.reserveReparation.aeronef = 7 * TICKS_PAR_HEURE;
  laBase.reserveReparationBatiments = 11 * TICKS_PAR_HEURE;
  assert.equal(new Set(Object.values(laBase.reserveReparation)).size, 3,
    'le montage ne discrimine pas les trois châssis');

  const { doc, ecran } = ecranOffenseMonte(etat);
  const ligne = doc.getElementById('offense-reserve').textContent;
  assert.equal(ligne, ligneDeLaReserveDArmee(etat), 'l\'écran n\'écrit pas ce que la fonction rend');
  // Les trois familles se disent, avec les mots d'Ethan.
  for (const mot of ['infanterie', 'véhicule', 'avion']) {
    assert.ok(ligne.includes(mot), `« ${mot} » manque à la ligne : ${ligne}`);
  }
  // ⚠ ET LE PLAFOND VIENT DU MOTEUR, il ne se recalcule pas.
  assert.ok(ligne.includes(direLaDuree(plafondDeLaReserve(etat), Math.floor)),
    `le plafond annoncé n'est pas celui du moteur : ${ligne}`);
  // ⚠ ET CE N'EST PAS CELUI DES BÂTIMENTS — la falsification la plus probable.
  assert.ok(!ligne.includes(direLaDuree(11 * TICKS_PAR_HEURE, Math.floor)),
    `la ligne annonce la réserve des BÂTIMENTS : ${ligne}`);
  assert.ok(ecran !== null);
});

test('RET T10 — le nombre vient du moteur : changer l\'état change ce qui est peint', () => {
  // ⚠ UN MONTAGE À ÉTAT CONSTANT NE DISTINGUERAIT PAS UN CHAMP LU D'UN CHAMP
  // ÉCRIT EN DUR.
  const etat = partieAvecBudget();
  const laBase = baseCourante(etat);
  laBase.reserveReparation.escouade = 2 * TICKS_PAR_HEURE;
  const { doc, ecran } = ecranOffenseMonte(etat);
  const avant = doc.getElementById('offense-reserve').textContent;

  laBase.reserveReparation.escouade = 9 * TICKS_PAR_HEURE;
  ecran.peindre(etat);
  const apres = doc.getElementById('offense-reserve').textContent;
  assert.notEqual(apres, avant, 'la ligne n\'a pas suivi la réserve');
  assert.equal(apres, ligneDeLaReserveDArmee(etat));

  // ⚠ ET LE PLAFOND SUIT LE NIVEAU DE L'ARMÉE, ce qui est l'autre moitié.
  const plafondAvant = plafondDeLaReserve(etat);
  for (const piece of laBase.armee) piece.niveau = 20;
  assert.ok(plafondDeLaReserve(etat) > plafondAvant,
    'le montage ne mesure rien : le plafond n\'a pas bougé');
  ecran.peindre(etat);
  assert.notEqual(doc.getElementById('offense-reserve').textContent, apres,
    'la ligne n\'a pas suivi le plafond');
});

test('RET T11 — une armée VIDE ne fige rien, et c\'est mesuré', () => {
  // ⚠⚠ `plafondDeLaReserveDesBatiments` LÈVE SUR UNE DISPOSITION VIDE —
  // `niveauDesBatiments` refuse une liste vide, « une base a toujours son
  // Chantier ». **Mesuré : l'équivalent côté ARMÉE ne lève PAS** — il passe par
  // `niveauDeLArmee(base.armee) ?? 0`, et le plafond vaut alors douze heures
  // tout rond. Une base neuve sans la moindre pièce n'a donc rien à figer, et ce
  // test le prouve plutôt que de le supposer.
  const etat = creerEtat(7);
  assert.deepEqual(baseCourante(etat).armee, [], 'le montage porte déjà une armée');
  assert.doesNotThrow(() => plafondDeLaReserve(etat),
    'le plafond de l\'armée lève sur une armée vide');

  const { doc } = ecranOffenseMonte(etat);
  const ligne = doc.getElementById('offense-reserve').textContent;
  assert.ok(ligne.length > 0, 'la ligne est vide sur une base neuve');
  assert.equal(ligne, ligneDeLaReserveDArmee(etat));
  // ⚠ ET LE CONTRE-EXEMPLE EST ASSERTÉ : côté BÂTIMENTS, la même question lève.
  const sansBatiment = creerEtat(7);
  baseCourante(sansBatiment).disposition = [];
  assert.throws(() => plafondDeLaReserveDesBatiments(baseCourante(sansBatiment)),
    'le montage ne discrimine rien : les deux plafonds se comportent pareil');
});

// ---------------------------------------------------------------------------
// VITESSE — le point 8 : l'écran Offense se repeint pendant qu'on le regarde
// ---------------------------------------------------------------------------

test('VIT T4 — `rafraichir` repeint la réserve d\'armée, qui monte toute seule', () => {
  // ⚠⚠ ETHAN, 11/09, POINT 8 : « le bouton améliorer de l'onglet offense ne se
  // met pas à jour ». La cause racine est plus large que le bouton :
  // `rafraichir` s'écrivait `if (etatCourant === null) peindre(etat);` — donc
  // l'écran ouvert restait figé sur l'image de son ouverture, indéfiniment.
  // C'est aussi la cause du point 13, où la ligne de réserve ne bougeait jamais.
  //
  // ⚠ CE TEST EST UN ÉCART AU §7 DU BRIEF, DÉCLARÉ. Il annonce « aucun test sur
  // le §4 — le dépôt n'a ni jsdom ni navigateur » : c'est vrai de cinq écrans et
  // FAUX de celui-ci, qui porte un faux document écrit à la main depuis le lot
  // RETOUR-DE-RAID. Un défaut de cycle de vie ne se lit pas dans une fonction
  // pure ; il se monte.
  const etat = partieAvecBudget();
  const laBase = baseCourante(etat);
  laBase.reserveReparation.escouade = 2 * TICKS_PAR_HEURE;

  const { doc, ecran } = ecranOffenseMonte(etat);
  const avant = doc.getElementById('offense-reserve').textContent;

  // La réserve monte, comme le tick la fait monter — et on N'APPELLE PAS
  // `peindre`, qui est le geste du joueur. Seul `rafraichir` passe.
  laBase.reserveReparation.escouade = 9 * TICKS_PAR_HEURE;
  ecran.rafraichir(etat);
  const apres = doc.getElementById('offense-reserve').textContent;

  assert.notEqual(apres, avant,
    'la ligne de réserve n\'a pas suivi : `rafraichir` ne repeint rien');
  assert.equal(apres, ligneDeLaReserveDArmee(etat),
    'la ligne ne dit pas ce que le moteur rend');

  // ⚠ ET `etatCourant` SUIT, ce qui est l'autre moitié : sans lui, la barre
  // contextuelle lirait indéfiniment l'état de l'ouverture.
  const neuf = partieAvecBudget();
  baseCourante(neuf).reserveReparation.blinde = 6 * TICKS_PAR_HEURE;
  ecran.rafraichir(neuf);
  assert.equal(doc.getElementById('offense-reserve').textContent,
    ligneDeLaReserveDArmee(neuf),
    '`rafraichir` peint encore l\'ancien état : `etatCourant` n\'a pas été repris');
});

test('VIT T4 bis — la barre contextuelle dit le devis de la pièce sélectionnée', () => {
  // ⚠⚠ LA LECTURE (a) DU POINT 8, ET ELLE EST DÉCLARÉE. « N'indique pas d'heure
  // restante » a deux sens : (a) le temps de réparation de la pièce choisie,
  // (b) une durée d'amélioration. **(b) n'existe pas** — `ameliorerEffectif` est
  // instantané et se paie d'avance, donc annoncer une attente promettrait un
  // mécanisme que le moteur n'a pas.
  const etat = partieAvecBudget();
  const laBase = baseCourante(etat);
  poserLesBatimentsDeProduction(etat);
  // ⚠ LA PIÈCE EST ABÎMÉE POUR DE BON, ET LE MONTAGE LE PROUVE AVANT
  // D'ASSERTER : un devis nul ne distinguerait pas « lu » de « écrit en dur ».
  //
  // ⚠⚠ ET LE NIVEAU 12 N'EST PAS DÉCORATIF — « un montage qui tombe rond ne
  // mesure pas un arrondi », et le dépôt l'a déjà payé trois fois. Au niveau 3
  // la scorie d'une Meute vaut **0,0000245** : `Math.ceil` rend 1, `Math.round`
  // rend 0, et les deux nombres se confondent avec les chiffres de la DURÉE dans
  // la même phrase. À 12 et 50 000 milli-PV de dégâts, le devis vaut **62,355** —
  // `ceil` 63, `round` 62, durée « 52 s » : les trois se distinguent.
  laBase.armee[0].niveau = 12;
  laBase.armee[0].degatsMilli = 50000;
  const devis = coutDeLaReparation(etat, 0);
  assert.ok(devis !== null && devis.ticks > 0 && devis.scorie > 0,
    'le montage ne mesure rien : la pièce ne coûte ni temps ni scorie');
  assert.notEqual(Math.ceil(devis.scorie), Math.round(devis.scorie),
    'le montage ne mesure pas l\'arrondi : `ceil` et `round` rendent le même nombre');

  const { doc, parId, ecran } = ecranOffenseMonte(etat);
  assert.equal(doc.getElementById('offense-selection-cout').textContent, '',
    'le devis s\'écrit sans sélection');

  toucher(parId, laBase.armee[0].vague, laBase.armee[0].colonne);

  const ligne = doc.getElementById('offense-selection-cout').textContent;
  assert.equal(ligne, ligneDuCoutDeLaPiece(etat, 0),
    'la barre n\'écrit pas ce que la fonction rend');
  // ⚠ LE TEMPS ET LA SCORIE VIENNENT DU MOTEUR, ILS NE SE RECALCULENT PAS —
  // et la scorie s'arrondit comme `reparerUnePiece` débite : `Math.ceil`.
  assert.ok(ligne.includes(direLaDuree(devis.ticks)),
    `le temps annoncé n'est pas celui du moteur : ${ligne}`);
  // ⚠ LA SONDE PORTE LE MOT, PAS LE SEUL CHIFFRE. « includes('63') » se
  // satisferait d'un 63 venu de la durée, qui est dans la même phrase.
  assert.ok(ligne.includes(`${Math.ceil(devis.scorie)} scorie`),
    `la scorie annoncée n'est pas celle que le moteur débitera : ${ligne}`);
  assert.ok(!ligne.includes(`${Math.round(devis.scorie)} scorie`),
    `la scorie est arrondie au plus proche, pas comme `
    + `\`reparerUnePiece\` débite : ${ligne}`);

  // ⚠ ET UNE PIÈCE INTACTE N'ÉCRIT RIEN — « réparer : 0 s · 0 scorie » sur
  // quatorze unités saines serait quatorze fois la même absence d'information.
  laBase.armee[0].degatsMilli = 0;
  assert.equal(ligneDuCoutDeLaPiece(etat, 0), null,
    'une pièce intacte porte encore un devis');
  ecran.peindre(etat);
  assert.equal(doc.getElementById('offense-selection-cout').textContent, '',
    'le devis survit à la réparation');
});

// ---------------------------------------------------------------------------
// PALETTES-ET-DEFENSE — l'assaut ne bouge pas, 08/09/2026
// ---------------------------------------------------------------------------

test('PAL T10 — l\'OFFENSE refuse toujours faute de Caserne, sur la base qui ouvre la DÉFENSE', () => {
  // ⚠⚠ SANS CE TEST, LE LOT CASSE UN ARBITRAGE QU'ETHAN N'A PAS RETIRÉ. Le 08/09
  // il retire le verrou du bâtiment de production « en défense » — point 7,
  // « caserne usine aérodrome ». Le 29/08 il avait dit « infanterie
  // inconstructible sans caserne, même règle pour véhicule et avion », et il
  // n'est pas revenu dessus pour l'assaut. Les deux tiennent ensemble ou le lot
  // est faux.
  //
  // ⚠⚠ ET C'EST LE MÊME ÉTAT QUI PORTE LES DEUX MOITIÉS. Deux montages séparés
  // laisseraient passer un lot qui basculerait les DEUX forces : ici la même
  // base, au même instant, ouvre la garnison et ferme l'armée.
  const etat = creerEtat(20260908);
  baseCourante(etat).disposition[0].niveau = 12;
  baseCourante(etat).disposition.push(
    { id: 'centreDeCommandement', rangee: 11, colonne: 1, niveau: 8, degatsMilli: 0 },
    { id: 'qgDeDefense', rangee: 11, colonne: 8, niveau: 8, degatsMilli: 0 },
  );
  while (baseCourante(etat).economie.residus.length < baseCourante(etat).disposition.length) {
    baseCourante(etat).economie.residus.push({ quartz: 0, scorie: 0, electricite: 0 });
  }
  etat.recherche.acquises.offense = Object.keys(UNITES).sort();
  etat.recherche.acquises.defense = [...rosterDefensif()].sort();

  // ⚠ FALSIFIABILITÉ : les trois bâtiments manquent, les deux QG sont là, tout
  // est cherché. Ce qui reste est le verrou, et lui seul.
  for (const id of Object.values(BATIMENT_DE_CHASSIS)) {
    assert.ok(!baseCourante(etat).disposition.some((b) => b.id === id),
      `montage : ${id} est posé`);
  }
  assert.notEqual(niveauDeCommandement(etat, 'armee'), null, 'montage : pas de Centre');
  assert.notEqual(niveauDeCommandement(etat, 'garnison'), null, 'montage : pas de QG de défense');

  // La DÉFENSE s'ouvre — c'est le point 7, mesuré ici pour que le couple existe.
  assert.ok(posablesDeLaDefense(etat).every((p) => !p.verrouille),
    'la garnison verrouille encore : le montage ne discrimine rien');
  assert.deepEqual(
    problemesDeLaPoseDEffectif(etat, 'garnison', { id: 'meute', rangee: 6, colonne: 3, niveau: 1 }),
    [], 'le modèle refuse encore la garnison sans Caserne',
  );

  // L'ARMÉE, elle, reste fermée — palette ET geste, comme le 29/08.
  const palette = unitesDeLaPalette(etat);
  assert.equal(palette.length, Object.keys(UNITES).length, 'la palette d\'Offense a filtré');
  assert.ok(palette.every((u) => !u.disponible),
    'une unité d\'assaut est constructible sans son bâtiment de production');
  const meute = palette.find((u) => u.id === 'meute');
  assert.equal(meute.raison,
    messageSansBatiment(BASE_BATIMENTS.caserne.nom.joueur, UNITES.meute.chassis));

  const refus = problemesDeLaPoseDEffectif(etat, 'armee', {
    id: 'meute', vague: 1, colonne: 1, niveau: 1,
  });
  assert.deepEqual(refus.map((p) => p.code), ['sans-batiment-de-production'],
    'l\'assaut accepte une Meute sans Caserne');
  assert.equal(refus[0].message, meute.raison, 'la palette et le modèle divergent');
  assert.throws(() => poserEffectif(etat, 'armee', {
    id: 'meute', vague: 1, colonne: 1, niveau: 1,
  }), /Caserne/);

  // ⚠ ET LES TROIS CHÂSSIS DE L'ARMÉE, PAS LA SEULE INFANTERIE : le roster
  // offensif porte les trois, là où le défensif n'en porte que deux.
  const chassis = new Set(Object.keys(UNITES).map((id) => UNITES[id].chassis));
  assert.deepEqual([...chassis].sort(), Object.keys(BATIMENT_DE_CHASSIS).sort(),
    'un châssis de l\'armée n\'a plus de bâtiment de production');
  for (const id of Object.keys(UNITES)) {
    assert.deepEqual(
      problemesDeLaPoseDEffectif(etat, 'armee', { id, vague: 2, colonne: 2, niveau: 1 })
        .map((p) => p.code), ['sans-batiment-de-production'],
      `${id} : l'assaut l'accepte sans son bâtiment`,
    );
  }
});

// ---------------------------------------------------------------------------
// EC T4 — « Tout réparer » entre dans l'armée, et « Réparer » gagne son moteur
// ---------------------------------------------------------------------------

test('EC T4 — l\'armée répare : quatre actions, quatre moteurs, un bouton global', () => {
  // ⚠⚠ ETHAN, 10/09, POINT 6 : « Rajouter un bouton tout réparer dans l'onglet
  // armée ». Le Chantier en a un depuis le lot RÉPARER-ÉCRAN ; l'armée n'avait ni
  // le bouton global ni même le geste UNITAIRE — `ACTIONS_ARMEE.reparer` portait
  // `agir: null` et le bouton répondait par une phrase.
  //
  // ⚠ LA PREMIÈRE ASSERTION NOMME LA CLÉ, et c'est ce que le brief demande :
  // « laisser `agir: null` fait tomber la première assertion ». Un test qui
  // parcourrait la table sans la nommer dirait « une action est sans moteur »
  // sans dire laquelle.
  assert.equal(typeof ACTIONS_ARMEE.reparer.agir, 'function',
    '`ACTIONS_ARMEE.reparer.agir` est encore nul : le bouton Réparer répond par une phrase');
  assert.equal(typeof ACTIONS_ARMEE.reparer.problemes, 'function',
    '`ACTIONS_ARMEE.reparer.problemes` est nul : le refus ne serait pas chiffré');

  // ⚠⚠ ET PLUS AUCUNE DES QUATRE N'EST SANS MOTEUR. C'est la moitié qui compte :
  // « Réparer » était la dernière, donc la branche `agir === null` de l'écran est
  // devenue INATTEIGNABLE par la table. Elle reste écrite — c'est le précédent
  // d'`effetNonCable` au lot FORMATION-ET-GARNISON, la ligne qui parlera de la
  // prochaine action écrite avant son moteur — et ce test dit qu'aujourd'hui elle
  // ne parle de personne.
  for (const [nom, action] of Object.entries(ACTIONS_ARMEE)) {
    assert.equal(typeof action.agir, 'function', `« ${nom} » n'a pas de moteur`);
    assert.equal(typeof action.problemes, 'function', `« ${nom} » ne sait pas refuser`);
    // La garde existe déjà, on la relit : une action sans message de mode
    // laisserait la ligne d'avis muette au moment où le joueur vient d'armer.
    assert.equal(typeof MESSAGES_MODE_ARMEE[nom], 'string',
      `« ${nom} » n'a pas de message de mode`);
  }
  assert.deepEqual(Object.keys(ACTIONS_ARMEE).sort(), Object.keys(MESSAGES_MODE_ARMEE).sort(),
    'la table des actions et celle des messages ont divergé');

  // ⚠⚠ ET LE BOUTON GLOBAL EST PERMANENT, PAS SOUS MODE. C'est la différence
  // avec `#raid-tout-reparer`, replié tant que « Réparer » n'est pas armé :
  // l'écran d'armée n'a pas de mode « réparation » à ouvrir, et un bouton qu'il
  // faut armer pour voir serait un bouton qu'on ne trouve pas. Il n'a donc ni
  // `hidden` ni `repliee` dans le balisage.
  const html = feuilleDecommentee();
  assert.match(html, /id="offense-tout-reparer"/, 'le bouton « Tout réparer » manque à l\'armée');
  assert.doesNotMatch(html, /id="offense-tout-reparer"[^>]*\shidden/,
    'le bouton « Tout réparer » de l\'armée naît caché');
  assert.doesNotMatch(html, /id="offense-tout-reparer"[^>]*class="[^"]*repliee/,
    'le bouton « Tout réparer » de l\'armée naît replié');

  // ⚠⚠ ET `REPARATION_AILLEURS` A DISPARU AVEC SON DERNIER LECTEUR. Elle disait
  // « les unités se réparent sur l'écran de raid » — vrai jusqu'à ce lot, faux
  // depuis. Une phrase qui décrit un état révolu est le mensonge que `CLAUDE.md`
  // §6 raconte trois fois ; la garder « au cas où » l'aurait fait relire comme
  // une règle.
  //
  // ⚠⚠ ET ELLE LIT LA SOURCE DÉCOMMENTÉE — NEUVIÈME FOIS DU DÉPÔT. Le premier
  // jet de cette ligne est tombé sur DEUX commentaires d'`ui/offense.js` qui
  // NOMMENT la constante pour dire qu'elle est partie. Une garde qui lit ce
  // qu'on a écrit à son sujet ne garde rien ; c'est le TEXTE qui a raison ici,
  // pas le motif, et l'appât ci-dessous prouve que le filtre n'a pas tout mangé.
  const brut = readFileSync(join(RACINE, 'src', 'ui', 'offense.js'), 'utf8');
  const ecran = brut.replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !l.trimStart().startsWith('//')).join('\n');
  assert.match(brut, /REPARATION_AILLEURS/,
    'plus aucun commentaire ne dit pourquoi la constante est partie : le filtre ne mesure plus rien');
  assert.ok(!/REPARATION_AILLEURS/.test(ecran),
    '`REPARATION_AILLEURS` survit : l\'écran annonce encore que l\'armée se répare ailleurs');
  assert.match(ecran, /export function vueDeLOffense/,
    'le filtre de commentaires a mangé le code : la garde ne lit plus rien');
});

// ---------------------------------------------------------------------------
// EC T5 — la vignette de la palette de l'Offense a une taille, et elle est dite
// ---------------------------------------------------------------------------

test('EC T5 — la vignette de la palette de l\'Offense porte une taille explicite', () => {
  // ⚠⚠ ETHAN, 10/09, POINT 7 : « Sprites trop petit dans la barre du bas
  // construction ». Les deux palettes portaient 26 px ; le lot RETOUCHES a porté
  // celle du Chantier à 52 le 08/09 et son jumeau n'a pas suivi.
  //
  // ⚠⚠ ET « AU MOINS AUTANT QUE `.posable i` » EST GÉOMÉTRIQUEMENT IMPOSSIBLE —
  // ÉCART DÉCLARÉ AU BRIEF, MESURÉ AVANT D'ÊTRE ÉCRIT. La bande de l'Offense fait
  // 86 px et porte, EN PLUS du sprite, un libellé et un coût que celle du
  // Chantier n'a pas : `86 − 1` de liseré `− 2 × 5` de `padding` = 75 pour la
  // vignette, `− 2 × 1` de liseré et RIEN en `padding` vertical = 73, `− 2 × 2`
  // de `gap` entre trois enfants = 69, moins le libellé 15,4 et le coût 9,2 —
  // il reste **44,4**. À 52 la vignette déborderait de 7,6 px et serait rognée
  // par l'`overflow-y: hidden` de la bande. On prend **40**, le plus grand
  // multiple de huit qui tienne — un sprite de 128 s'y réduit d'un facteur
  // entier.
  const vignette = regleCss('#offense-palette .unite i');
  const cote = Number(vignette.match(/width:\s*(\d+)px/)?.[1]);
  assert.equal(cote, 40, `la vignette de l'Offense mesure ${cote} px`);
  assert.match(vignette, new RegExp(`height:\\s*${cote}px`),
    'la vignette de l\'Offense n\'est plus carrée');

  // ⚠⚠ ET LE TEST NE SE CONTENTE PAS DE « UNE TAILLE EST ÉCRITE » — c'est la
  // falsification que le brief nomme : un tel test resterait VERT à 12 px. Il
  // exige donc le nombre, et il exige qu'il ait GRANDI par rapport à ce que la
  // bande portait avant le lot.
  assert.ok(cote > 26, 'la vignette n\'a pas grandi : le point 7 n\'est pas traité');

  // ⚠ ET LE BUDGET EST TENU : la vignette plus ses deux lignes de texte doivent
  // tenir dans la bande. Le nombre se DÉRIVE de la feuille, il ne se recopie pas.
  const bande = Number(regleCss('#offense-palette').match(/flex:\s*0 0 (\d+)px/)?.[1]);
  assert.equal(bande, 86, `la bande de la palette mesure ${bande} px : le budget de la vignette a bougé`);
  assert.ok(cote < bande, 'la vignette est plus haute que la bande qui la porte');

  // ⚠ ET CELLE DU CHANTIER N'A PAS BOUGÉ : ce lot corrige un retard, il ne
  // renverse pas l'arbitrage du 08/09.
  assert.match(regleCss('.posable i'), /width:\s*52px/,
    'la vignette du Chantier a changé de taille : ce lot ne devait pas y toucher');
});

// ---------------------------------------------------------------------------
// EC T8 — le libellé d'une vignette d'Offense se lit sur le sprite
// ---------------------------------------------------------------------------

test('EC T8 — le libellé de la palette de l\'Offense se lit, et les trois états restent distincts', () => {
  // ⚠⚠ ETHAN, 10/09, POINT 14 : le nom d'une unité se peint SUR le sprite, et à
  // 40 px le sprite occupe la moitié de la vignette. Mesuré : l'os `#F5F3E8` rend
  // **14,53** de contraste sur le fond `#1E2124` de la bande et **2,70** sur
  // `#8C9A72`, le ton clair de la rampe kaki dont les sprites du joueur sont
  // faits — sous les 3 qu'un texte de 11 px demande. Ce n'est donc pas
  // la COULEUR du libellé qu'il faut changer, c'est son FOND : une ombre portée
  // `#161914` rend 15,95 contre l'os, et elle suit le texte où qu'il tombe.
  const libelle = regleCss('#offense-palette .unite b');
  assert.match(libelle, /text-shadow:/, 'le libellé de la palette n\'a pas d\'ombre : il se perd sur le sprite');
  // ⚠ L'OMBRE CERNE LE TEXTE DES QUATRE CÔTÉS. Une ombre d'un seul côté laisse
  // trois bords du glyphe sur le sprite, et c'est précisément là qu'il disparaît.
  const cotes = (libelle.match(/text-shadow:([^;]*);/)[1].match(/#161914/g) ?? []).length;
  assert.equal(cotes, 4, `l'ombre du libellé ne cerne le texte que de ${cotes} côtés`);
  // ⚠ ET AUCUNE TEINTE NEUVE : `#161914` est l'ombre des pastilles de niveau
  // depuis le lot RETOUR-DE-RAID. `banc.test.js` refuse déjà tout hex hors
  // palette ; ici on exige que ce soit CELUI-LÀ.
  assert.match(libelle, /text-shadow:[^;]*#161914/, 'l\'ombre du libellé emploie une autre teinte');
  // ⚠ LE COÛT PORTE LA MÊME, pour la même raison : il tombe au même endroit.
  assert.match(regleCss('#offense-palette .unite .cout'), /text-shadow:[^;]*#161914/,
    'le coût d\'une vignette n\'a pas l\'ombre du libellé');

  // ⚠⚠ ET LES TROIS ÉTATS RESTENT DEUX À DEUX DIFFÉRENTS — LE MONTAGE DE `RET T7`,
  // REPRIS ET NON RÉÉCRIT. Le libellé d'une vignette VERROUILLÉE change de teinte
  // dans ce lot : `#68727E` ne se distinguait plus une fois cerné de noir. Sans
  // cette moitié-ci, éclaircir le libellé aurait pu effacer le signal du verrou.
  const teintes = {
    repos: regleCss('#offense-palette .unite b').match(/color:\s*(#[0-9A-Fa-f]{6})/)[1].toUpperCase(),
    verrouillee: regleCss('#offense-palette .unite.verrouillee b').match(/color:\s*(#[0-9A-Fa-f]{6})/)[1].toUpperCase(),
    armee: regleCss('#ecran-offense .unite.choisie b').match(/color:\s*(#[0-9A-Fa-f]{6})/)[1].toUpperCase(),
  };
  assert.notEqual(teintes.repos, teintes.verrouillee,
    `le libellé verrouillé ne se distingue plus du libellé au repos : ${teintes.repos}`);
  // ⚠ ET LE VERROU GARDE SON SECOND SIGNAL, l'opacité — un seul support de
  // distinction serait perdu au premier réglage de teinte.
  assert.match(regleCss('#offense-palette .unite.verrouillee'), /opacity/,
    'la vignette verrouillée a perdu son opacité : la teinte du libellé la porte seule');
});

test('VIT T9 — « Réparer » ouvre un dépliant qui dit le coût de chaque unité', () => {
  // ⚠⚠ ETHAN, 11/09, POINT 13. `#offense-reserve` était COMPLÈTE et seulement
  // TRONQUÉE par le bouton — mesuré dans Chromium à la géométrie du S25 FE :
  // **345,91 px demandés pour 235,48 reçus, donc 110,42 px coupés, 32 % de la
  // phrase**. Ethan lisait « Réparation, max 12.0 h — infanterie 43 min · véh… »
  // et croyait voir trois maxima. Deux choses, et les deux sont gardées ici : la
  // ligne ne se coupe plus, et « Réparer » ouvre le DÉTAIL.
  //
  // ⚠ ÉCART AU §7, DÉCLARÉ, comme `VIT T4` : le brief annonce « aucun test sur
  // le §4 », ce qui est vrai de cinq écrans et FAUX de celui-ci, qui porte un
  // faux document depuis le lot RETOUR-DE-RAID.
  const etat = partieAvecBudget();
  const laBase = baseCourante(etat);
  poserLesBatimentsDeProduction(etat);
  // ⚠⚠ TRENTE MINUTES ET UN TICK, ET NI LE « 30 » NI LE « + 1 » NE SONT
  // DÉCORATIFS. « Un montage qui tombe rond ne mesure pas un arrondi » —
  // quatrième fois du dépôt, et la première où le montage ROND était le mien :
  // à trois heures pile, `Math.floor` et `Math.ceil` rendent « 3.0 h » tous les
  // deux. ⚠ Et **au-delà de l'heure ils rendraient le même nombre QUOI QU'IL
  // ARRIVE** : `direLaDuree` le dit en toutes lettres — passé 3 600 s, c'est la
  // DÉCIMALE qui arrondit, et le paramètre cesse de mordre. L'assertion ne peut
  // donc vivre que sous l'heure, et 30 min + 1 tick y rend 30 contre 31.
  laBase.reserveReparation.escouade = Math.round(TICKS_PAR_HEURE / 2) + 1;

  // ⚠⚠ DEUX PIÈCES ABÎMÉES, DE DEUX NIVEAUX DIFFÉRENTS ET DIFFÉRENTS DE 1. À
  // niveau égal les deux lignes rendraient la même chaîne, et une boucle qui
  // écrirait deux fois la PREMIÈRE pièce passerait le test.
  laBase.armee[0].niveau = 12;
  laBase.armee[0].degatsMilli = 50000;
  laBase.armee[1].degatsMilli = 9000;

  const devisA = coutDeLaReparation(etat, 0);
  const devisB = coutDeLaReparation(etat, 1);
  assert.ok(devisA !== null && devisB !== null, 'le montage n\'abîme rien');
  assert.notEqual(direLaDuree(devisA.ticks), direLaDuree(devisB.ticks),
    'le montage ne distingue pas les deux pièces : elles coûtent le même temps');

  const vue = vueDuDevisDeReparation(etat);
  assert.equal(vue.titre, TITRE_DEVIS);

  const section = vue.sections.find((s) => s.lignes.length > 0);
  assert.ok(section !== undefined, 'le dépliant ne porte aucune ligne');

  // ⚠⚠ LE STOCK EN TÊTE — c'est ce qu'Ethan cherchait dans la ligne coupée, et
  // c'est la SEULE chose que la ligne de la barre portait vraiment.
  assert.equal(section.lignes[0].avant,
    direLaDuree(laBase.reserveReparation.escouade, Math.floor),
    'le stock du châssis n\'est pas en tête du dépliant');
  // ⚠ ET IL S'ARRONDIT VERS LE BAS : c'est un STOCK, pas un manque. `Math.ceil`
  // annoncerait « 4 h » sur 3 h 00 min 01 s de réserve, et le joueur tenterait
  // une réparation que le moteur refuse.
  assert.notEqual(section.lignes[0].avant,
    direLaDuree(laBase.reserveReparation.escouade, Math.ceil),
    'le montage ne mesure pas l\'arrondi : les deux sens rendent la même durée');

  // ⚠⚠ AUCUN COÛT N'EST RECALCULÉ DANS L'UI — CONSIGNE DU BRIEF. Les deux
  // nombres se confrontent à ce que le MOTEUR rend, et la scorie à l'arrondi
  // EXACT que `reparerUnePiece` débite.
  const texteDuDevis = vue.sections
    .flatMap((s) => s.lignes).map((l) => `${l.libelle} ${l.avant}`).join('\n');
  for (const devis of [devisA, devisB]) {
    assert.ok(texteDuDevis.includes(
      `${direLaDuree(devis.ticks)} · ${Math.ceil(devis.scorie)} scorie`),
    `le dépliant n'annonce pas le coût du moteur : ${texteDuDevis}`);
  }

  // ⚠ ET UNE ARMÉE INTACTE NE REND PAS TROIS SECTIONS VIDES : une phrase.
  laBase.armee[0].degatsMilli = 0;
  laBase.armee[1].degatsMilli = 0;
  const saine = vueDuDevisDeReparation(etat);
  assert.equal(saine.sections.length, 1, 'une armée intacte rend plusieurs sections');
  assert.equal(saine.sections[0].lignes.length, 0,
    'la section du « rien à réparer » porte des lignes');
});

test('VIT T9 bis — le bouton de la barre OUVRE, celui du panneau répare', () => {
  // ⚠⚠ LE GESTE A CHANGÉ DE PORTEUR, ET C'EST TOUT LE POINT 13. `Tout réparer`
  // dépensait la scorie au premier toucher, sans que le joueur ait lu un prix ;
  // il OUVRE désormais le dépliant, et c'est le bouton du panneau qui agit —
  // sous les yeux de celui qui vient d'en lire le devis.
  const etat = partieAvecBudget();
  const laBase = baseCourante(etat);
  poserLesBatimentsDeProduction(etat);
  laBase.reserveReparation.escouade = 12 * TICKS_PAR_HEURE;
  laBase.economie.ressources.scorie = 1e9;
  laBase.armee[0].niveau = 12;
  laBase.armee[0].degatsMilli = 50000;

  const { doc, parId } = ecranOffenseMonte(etat);
  assert.equal(doc.getElementById('offense-panneau').hidden, true,
    'le panneau part ouvert');

  parId.get('offense-tout-reparer').envoyer('click');

  // ⚠ LE PREMIER TOUCHER N'A RIEN DÉPENSÉ. C'est la moitié qui compte : un
  // bouton qui ouvrirait ET réparerait passerait l'assertion d'ouverture.
  assert.equal(laBase.armee[0].degatsMilli, 50000,
    'le bouton de la barre a réparé au lieu d\'ouvrir');
  assert.equal(doc.getElementById('offense-panneau').hidden, false,
    'le bouton de la barre n\'ouvre pas le dépliant');
  assert.equal(texteDe(doc.getElementById('offense-panneau-titre')), TITRE_DEVIS,
    'le panneau montre autre chose que le dépliant de réparation');

  // ⚠ ET LE BOUTON DU PANNEAU RÉPARE POUR DE BON — il n'améliore pas, ce qui
  // est l'autre faute possible : c'est le SEUL bouton d'action du panneau, et
  // il porte deux gestes selon le mode.
  const niveauAvant = laBase.armee[0].niveau;
  parId.get('offense-panneau-ameliorer').envoyer('click');
  assert.equal(laBase.armee[0].degatsMilli, 0,
    'le bouton du dépliant n\'a pas réparé');
  assert.equal(laBase.armee[0].niveau, niveauAvant,
    'le bouton du dépliant a AMÉLIORÉ : le mode ne route pas le geste');
});

test('VIT T9 ter — la ligne de réserve d\'armée ne se coupe plus', () => {
  // ⚠⚠ MESURÉ AVANT DE TOUCHER UNE LIGNE, ET C'EST CE QUI A DÉCIDÉ DU REMÈDE.
  // Dans Chromium, à la géométrie du S25 FE (360 × 780, dpr 3), la phrase
  // demandait **345,91 px** et sa boîte en faisait **235,48** : **110,42 px
  // coupés**. Elle n'était pas incomplète, elle était TRONQUÉE — d'où un
  // correctif de feuille et non de texte.
  const regle = regleCss('#offense-reserve');
  assert.doesNotMatch(regle, /white-space:\s*nowrap/,
    'la ligne de réserve est encore tenue sur une seule ligne : elle se coupera');
  assert.doesNotMatch(regle, /text-overflow:\s*ellipsis/,
    'la ligne de réserve porte encore l\'ellipse qui cachait ses trois stocks');
  assert.doesNotMatch(regle, /overflow:\s*hidden/,
    'la ligne de réserve rogne encore ce qui dépasse');

  // ⚠ ET LA GARDE N'EST PAS VACUEUSE : la règle existe, et elle porte bien la
  // ligne dont on parle. Sans ces deux-là, le test passerait sur un sélecteur
  // disparu — c'est `regleCss` qui lève, et il faut le dire.
  assert.match(regle, /font-size/, 'la règle mesurée n\'est plus celle de la ligne');

  // ⚠ LA LIGNE PORTE TOUJOURS SES TROIS STOCKS — le remède est d'AFFICHAGE, le
  // texte n'a pas été raccourci pour tenir.
  const etat = partieAvecBudget();
  const texte = ligneDeLaReserveDArmee(etat);
  for (const chassis of ORDRE_CHASSIS) {
    assert.ok(texte.includes(FAMILLE_DE_CHASSIS[chassis]),
      `la ligne a perdu le stock « ${chassis} » : ${texte}`);
  }
});

test('VIT T4 ter — la boucle repeint l\'écran Offense, pas seulement la base', () => {
  // ⚠⚠ LA CAUSE RACINE DU POINT 8 ÉTAIT DANS LA SESSION, PAS DANS L'ÉCRAN, ET
  // `VIT T4` NE POUVAIT PAS LA VOIR. Il monte l'écran et appelle `rafraichir`
  // lui-même : il garde que la fonction REPEINT, jamais qu'elle est APPELÉE.
  // Mesuré au boot sans tête, onglet Offense ouvert huit secondes : la ligne de
  // réserve restait à « 39 s » pendant que le moteur créditait quatre-vingts
  // ticks — la boucle ne rafraîchissait que le Chantier et la carte.
  const source = readFileSync(join(RACINE, 'src', 'ui', 'session.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');

  // ⚠ ON BORNE SUR LE BLOC DES 100 ms, ET ON PROUVE QUE LA TRANCHE EST BORNÉE :
  // sans ça, le test trouverait l'appel de `rafraichirTousLesEcrans`, qui est
  // le geste de la BASCULE et ne passe jamais dans la boucle.
  const debut = source.indexOf('dernierAffichageMs >= 100');
  assert.ok(debut > 0, 'le bloc d\'affichage de la boucle a changé de forme');
  const fin = source.indexOf('PERIODE_SAUVEGARDE_MS', debut);
  assert.ok(fin > debut, 'la borne du bloc d\'affichage a disparu');
  const bloc = source.slice(debut, fin);
  assert.ok(bloc.length > 40 && bloc.length < source.length / 4,
    `la tranche mesurée n'est ni vide ni le fichier entier : ${bloc.length} octets`);

  assert.ok(bloc.includes('ecranOffense.rafraichir('),
    'la boucle ne rafraîchit pas l\'écran Offense : sa réserve restera figée');
  // ⚠ ET ELLE NE LE REPEINT PAS : `peindre` refait les trente-six emplacements,
  // dix fois par seconde. C'est l'autre moitié, et elle se garde ici parce que
  // la faute serait invisible — l'écran serait JUSTE, et coûterait cent fois son
  // prix.
  assert.ok(!bloc.includes('ecranOffense.peindre('),
    'la boucle REPEINT l\'écran Offense : trente-six emplacements dix fois par seconde');
  // ⚠ L'APPÂT : la bascule, elle, repeint pour de bon — donc le motif que l'on
  // cherche existe ailleurs dans le fichier, et la tranche l'a bien écarté.
  assert.ok(source.includes('ecranOffense.peindre('),
    'plus personne ne repeint l\'Offense : la bascule a perdu son appel');
});
