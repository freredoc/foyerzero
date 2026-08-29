// L'écran Monde — `src/ui/monde.js`, sa géométrie, ses sites, et ce que la page
// promet.
//
// ⚠ CE QUI SE TESTE ICI EST TOUT CE QUI N'EST PAS LE DOM. Le dépôt n'a ni jsdom
// ni navigateur (CLAUDE.md §3) : le défilement au doigt, le canevas et le
// dessin des emblèmes se vérifient sur appareil, et un test appareil non
// exécuté se déclare non exécuté. Tout le reste — les bornes, la fenêtre
// visible, la liste des sites, les lignes du panneau, le cache — est PUR, et
// c'est pour ça qu'il l'est.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CRANS, CRAN_PAR_DEFAUT, CSS_MINI_LETTRE, DALLES_PAR_IMAGE,
  dimensionsDeLaCarte, bornerDefilement, fenetreVisible, distanceEnCases,
  sitesDeLaFenetre, lignesDuSite, creerCacheDalles, indicesDeTeinte, teinteDAttente,
} from '../src/ui/monde.js';
import {
  GEOGRAPHIE, ZOOM_CARTE, TERRAIN_CARTE, EMBLEMES_CARTE, TYPES_SITE,
} from '../src/data/sites.js';
import { creerEtat } from '../src/sim/state.js';
import { estBaseOuvrage, basesDeLaFenetre } from '../src/sim/peuplement.js';
import { niveauDeLaRangee, positionBaseTerminale } from '../src/sim/carte.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (...chemin) => readFileSync(join(RACINE, ...chemin), 'utf8');

/** Le code d'un module, commentaires ôtés — une prose n'est pas un geste. */
function sansCommentaires(texte) {
  return texte
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
}

// ---------------------------------------------------------------------------
// Les crans
// ---------------------------------------------------------------------------

test('zoom — les quatre crans sont des puissances de deux et divisent tuile et emblème', () => {
  // ⚠ CE N'EST PAS UNE COQUETTERIE. Une tuile de terrain fait 128 px et un
  // emblème sera dessiné sur une grille de 64 : à chaque cran, les deux doivent
  // rester à un facteur d'échelle ENTIER, sinon on brouille du pixel art. Un
  // cran intermédiaire à 192 conviendrait à l'emblème (×3) et pas à la tuile
  // (×1,5) — et c'est exactement le genre de valeur qu'on ajoute « pour avoir
  // un pas plus doux ».
  assert.equal(CRANS.length, 4, `${CRANS.length} crans`);
  for (const cran of CRANS) {
    assert.ok(Number.isInteger(Math.log2(cran)), `${cran} n'est pas une puissance de deux`);
    const versTuile = ZOOM_CARTE.pixelsParTuile / cran;
    const versEmbleme = ZOOM_CARTE.grilleEmbleme / cran;
    assert.ok(Number.isInteger(versTuile) || Number.isInteger(1 / versTuile),
      `la tuile ne s'échelonne pas entier au cran ${cran}`);
    assert.ok(Number.isInteger(versEmbleme) || Number.isInteger(1 / versEmbleme),
      `l'emblème ne s'échelonne pas entier au cran ${cran}`);
  }
  // Croissants, et la carte s'ouvre sur le plus large.
  for (let i = 1; i < CRANS.length; i += 1) assert.ok(CRANS[i] > CRANS[i - 1]);
  assert.equal(CRAN_PAR_DEFAUT, 0, 'la carte ne s\'ouvre plus sur la vue la plus large');

  // Falsifiable : un cran intermédiaire serait bien refusé par ce montage.
  assert.ok(!Number.isInteger(ZOOM_CARTE.pixelsParTuile / 192)
    && !Number.isInteger(192 / ZOOM_CARTE.pixelsParTuile),
  'le montage accepterait un cran à 192 : il ne mesure rien');
});

test('zoom — au cran le plus large, les 31 colonnes tiennent dans un téléphone', () => {
  // 1080 px physiques et DPR 3 : c'est la dalle de référence du projet. La
  // largeur CSS d'un tel écran fait 360 px.
  const DPR = 3;
  const LARGEUR_CSS = 360;
  const cssParCase = CRANS[0] / DPR;
  const largeurCarte = GEOGRAPHIE.carte.largeur * cssParCase;
  assert.ok(largeurCarte <= LARGEUR_CSS,
    `la carte fait ${largeurCarte.toFixed(1)} px CSS de large, ${LARGEUR_CSS} disponibles`);
  // Mesuré : 31 × 32 / 3 = 330,7 px CSS.
  assert.ok(largeurCarte > LARGEUR_CSS * 0.8,
    `${largeurCarte.toFixed(1)} px : le cran le plus large gâche la moitié de l'écran`);

  // Et le cran d'après ne tient PAS : c'est ce qui fait du premier une vue
  // stratégique et non un réglage parmi d'autres.
  assert.ok(GEOGRAPHIE.carte.largeur * (CRANS[1] / DPR) > LARGEUR_CSS,
    'deux crans montrent la carte entière : le plus large ne sert à rien');
});

// ---------------------------------------------------------------------------
// La géométrie de la vue
// ---------------------------------------------------------------------------

test('vue — la carte se mesure aux crans, et ce qui tient entier se centre', () => {
  for (const cran of CRANS) {
    const taille = dimensionsDeLaCarte(cran);
    assert.equal(taille.largeur, GEOGRAPHIE.carte.largeur * cran);
    assert.equal(taille.hauteur, GEOGRAPHIE.carte.hauteur * cran);
  }
  // Le défilement se borne aux deux bouts.
  assert.equal(bornerDefilement(-50, 1000, 400), 0);
  assert.equal(bornerDefilement(5000, 1000, 400), 600);
  assert.equal(bornerDefilement(250, 1000, 400), 250);
  // ⚠ ET CE QUI TIENT ENTIER SE CENTRE, IL NE SE COLLE PAS À GAUCHE. Au cran le
  // plus large les 31 colonnes tiennent dans la largeur : borner à zéro
  // laisserait une bande vide d'un seul côté, ce qui se lit comme un bord de
  // carte qui n'existe pas.
  assert.equal(bornerDefilement(0, 400, 1000), -300);
  assert.equal(bornerDefilement(9999, 400, 1000), -300);
});

test('vue — la fenêtre visible couvre ce qu\'on voit, plus une case de marge', () => {
  const cran = CRANS[2];
  const fenetre = fenetreVisible({ x: 0, y: 0, largeur: cran * 3, hauteur: cran * 5, cran });
  assert.equal(fenetre.premiereColonne, 0);
  assert.equal(fenetre.derniereColonne, 5);
  assert.equal(fenetre.premiereRangee, 0);
  assert.equal(fenetre.derniereRangee, 7);
  // Décalée d'une case et demie : la première colonne visible est la deuxième.
  const decalee = fenetreVisible({
    x: cran * 1.5, y: cran * 9.5, largeur: cran, hauteur: cran, cran,
  });
  assert.equal(decalee.premiereColonne, 1);
  assert.equal(decalee.derniereColonne, 4);
  assert.equal(decalee.premiereRangee, 9);
  assert.equal(decalee.derniereRangee, 12);
});

test('distance — Tchebychev, comme les anneaux et la garde du peuplement', () => {
  // Sur une grille, une case en diagonale n'est pas plus loin qu'une case droit
  // devant. En mesurer trois là où le jeu en compte deux ferait mentir toutes
  // les distances du panneau — et le jeu compte déjà en Tchebychev partout.
  assert.equal(distanceEnCases({ rangee: 10, colonne: 10 }, { rangee: 13, colonne: 13 }), 3);
  assert.equal(distanceEnCases({ rangee: 10, colonne: 10 }, { rangee: 10, colonne: 10 }), 0);
  assert.equal(distanceEnCases({ rangee: 1, colonne: 9 }, { rangee: 5, colonne: 2 }), 7);
  // Falsifiable : une distance euclidienne ou de Manhattan donnerait autre chose
  // sur le premier cas — 4,24 et 6.
  assert.notEqual(distanceEnCases({ rangee: 10, colonne: 10 }, { rangee: 13, colonne: 13 }), 6);
});

// ---------------------------------------------------------------------------
// Les sites
// ---------------------------------------------------------------------------

test('sites — une base de l\'Ouvrage se dessine là où le peuplement la met, et nulle part ailleurs', () => {
  // ⚠ L'ÉCRAN NE DÉCIDE RIEN DU PEUPLEMENT. Les bases sont une FONCTION de la
  // graine ; si cette liste s'en écartait — filtrée, dédoublonnée, arrondie —
  // le joueur verrait une carte et en attaquerait une autre.
  const etat = creerEtat(20260829);
  const fenetre = {
    premiereRangee: 180, derniereRangee: 230, premiereColonne: 1, derniereColonne: 31,
  };
  const sites = sitesDeLaFenetre(etat, fenetre);
  const dessinees = sites.filter((s) => s.type === 'base')
    .map((s) => `${s.rangee}:${s.colonne}`).sort();

  const attendues = [];
  for (let rangee = fenetre.premiereRangee; rangee <= fenetre.derniereRangee; rangee += 1) {
    for (let colonne = fenetre.premiereColonne; colonne <= fenetre.derniereColonne; colonne += 1) {
      if (estBaseOuvrage(etat.graine, rangee, colonne)) attendues.push(`${rangee}:${colonne}`);
    }
  }
  // Le montage doit mesurer quelque chose : une fenêtre vide passerait.
  assert.ok(attendues.length > 20, `${attendues.length} bases dans la fenêtre : trop peu pour mesurer`);
  assert.deepEqual(dessinees, attendues.slice().sort());

  // Et le niveau affiché est celui de la RANGÉE, pas un niveau inventé.
  for (const site of sites.filter((s) => s.type === 'base')) {
    assert.equal(site.niveau, niveauDeLaRangee(site.rangee));
  }
});

test('sites — les satellites PRÉSENTS se dessinent, les attentes non', () => {
  // ⚠ UNE ATTENTE N'EST PAS UN SITE. `satellites.attentes` porte des
  // apparitions PROGRAMMÉES — cinq minutes après la pose d'une base — et elles
  // n'ont même pas de case : les dessiner ferait paraître des camps qui
  // n'existent pas encore, et à un endroit choisi par l'écran.
  const etat = creerEtat(4242);
  assert.ok(etat.satellites.attentes.length > 0,
    'une base neuve doit avoir des attentes : le montage ne mesure rien');
  assert.equal(etat.satellites.presents.length, 0);

  const fenetre = {
    premiereRangee: 1, derniereRangee: GEOGRAPHIE.carte.hauteur,
    premiereColonne: 1, derniereColonne: GEOGRAPHIE.carte.largeur,
  };
  const avant = sitesDeLaFenetre(etat, fenetre)
    .filter((s) => s.type === 'camp' || s.type === 'avantPoste');
  assert.deepEqual(avant, [], 'une attente est dessinée comme un site');

  // Les mêmes attentes, une fois PARUES, se dessinent.
  etat.satellites.presents.push(
    { type: 'camp', rangee: etat.position.rangee + 1, colonne: etat.position.colonne, niveau: 3, instance: 1 },
    { type: 'avantPoste', rangee: etat.position.rangee - 3, colonne: etat.position.colonne + 2, niveau: 6, instance: 2 },
  );
  etat.satellites.prochaineInstance = 3;
  const apres = sitesDeLaFenetre(etat, fenetre)
    .filter((s) => s.type === 'camp' || s.type === 'avantPoste');
  assert.equal(apres.length, 2, 'les satellites parus ne sont pas dessinés');
  assert.deepEqual(apres.map((s) => s.niveau), [3, 6], 'le niveau du satellite n\'est pas le sien');

  // Et un satellite hors de la fenêtre n'entre pas dans la liste.
  const etroite = sitesDeLaFenetre(etat, {
    premiereRangee: 1, derniereRangee: 10, premiereColonne: 1, derniereColonne: 31,
  }).filter((s) => s.type === 'camp' || s.type === 'avantPoste');
  assert.deepEqual(etroite, []);
});

test('sites — la base du joueur et la base terminale se dessinent en dernier', () => {
  const etat = creerEtat(77);
  const fenetre = {
    premiereRangee: 1, derniereRangee: GEOGRAPHIE.carte.hauteur,
    premiereColonne: 1, derniereColonne: GEOGRAPHIE.carte.largeur,
  };
  const sites = sitesDeLaFenetre(etat, fenetre);
  const dernier = sites[sites.length - 1];
  assert.equal(dernier.type, 'baseJoueur', 'le joueur n\'est plus dessiné en dernier');
  assert.equal(dernier.rangee, etat.position.rangee);
  assert.equal(dernier.colonne, etat.position.colonne);
  assert.equal(dernier.niveau, null,
    'la base du joueur porte un niveau de carte : c\'est exactement la faute à ne pas faire');

  const terminale = sites.find((s) => s.type === 'baseTerminale');
  assert.deepEqual(
    { rangee: terminale.rangee, colonne: terminale.colonne }, positionBaseTerminale(),
  );
  assert.equal(terminale.niveau, GEOGRAPHIE.niveauPlafond);
  assert.ok(sites.indexOf(terminale) > sites.findIndex((s) => s.type === 'base'),
    'la base terminale passe sous les bases de l\'Ouvrage');

  // ⚠ ON NE DÉDOUBLONNE PAS, ET C'EST VOULU. La liste des bases de l'Ouvrage
  // reste exactement celle du peuplement, quoi qu'il y ait sur la même case.
  assert.equal(
    sites.filter((s) => s.type === 'base').length,
    basesDeLaFenetre(etat.graine, fenetre).length,
  );
});

// ---------------------------------------------------------------------------
// Le panneau
// ---------------------------------------------------------------------------

test('panneau — il dit ce qu\'on sait, et le niveau du joueur n\'est pas celui de sa rangée', () => {
  const depuis = { rangee: 275, colonne: 16 };
  const base = { type: 'base', rangee: 270, colonne: 13, niveau: 6 };
  const lignes = lignesDuSite(base, depuis);
  assert.deepEqual(lignes.map((l) => l.quoi), ['Type', 'Niveau', 'Distance', 'Position']);
  assert.equal(lignes[0].valeur, EMBLEMES_CARTE.base.nom);
  assert.equal(lignes[1].valeur, '6');
  assert.equal(lignes[2].valeur, '5 cases');

  // ⚠⚠ LA BASE DU JOUEUR N'A PAS DE NIVEAU DE CARTE. Elle en porte TROIS, qui
  // sont des moyennes de ce qu'il a posé, et aucun ne se déduit d'une position.
  // Afficher ici le niveau de sa rangée lui apprendrait une grandeur fausse —
  // c'est la faute que `sim/carte.js` existe pour empêcher.
  const joueur = { type: 'baseJoueur', rangee: 275, colonne: 16, niveau: null };
  const sien = lignesDuSite(joueur, depuis);
  assert.equal(sien[2].valeur, '0 cases');
  assert.ok(!/\b5\b/.test(sien[1].valeur),
    `le panneau du joueur affiche « ${sien[1].valeur} » : le niveau de sa rangée`);
  assert.ok(/moyennes/.test(sien[1].valeur), 'il ne dit pas pourquoi il n\'y a pas de niveau');

  // Le singulier, parce qu'un « 1 cases » se remarque.
  assert.equal(lignesDuSite({ ...base, rangee: 274, colonne: 16 }, depuis)[2].valeur, '1 case');

  // Un type inconnu LÈVE : c'est un fait de programme, pas un fait de jeu.
  assert.throws(() => lignesDuSite({ ...base, type: 'inconnu' }, depuis), /type de site inconnu/);
});

test('panneau — aucun bouton d\'action, ni dans le balisage ni dans l\'écran', () => {
  // ⚠ RIEN NE DOIT PROMETTRE CE QUI N'EXISTE PAS. Le raid n'existe pas ; un
  // bouton « Attaquer » sur le panneau d'un site serait exactement le bouton
  // « Assaut » du lot ÉCRAN-CHANTIER, qui pointait sur du sol nu et a été
  // retiré. On lit la page DÉCOMMENTÉE — le commentaire du lot raconte
  // justement cette faute et cite le mot.
  const html = lire('dist', 'index.html').replace(/<!--[\s\S]*?-->/g, '');
  const debut = html.indexOf('id="monde-panneau"');
  assert.ok(debut > 0, 'le panneau de site a disparu du balisage');
  const fin = html.indexOf('</div>', html.indexOf('id="monde-panneau-corps"'));
  const bloc = html.slice(debut, fin);
  const boutons = [...bloc.matchAll(/<button[^>]*id="([^"]*)"/g)].map((m) => m[1]);
  assert.deepEqual(boutons, ['monde-panneau-fermer'],
    `le panneau porte d'autres boutons que « Fermer » : ${boutons.join(', ')}`);

  // Et l'écran n'en fabrique pas non plus : il n'écrit que des lignes.
  const ecran = sansCommentaires(lire('src', 'ui', 'monde.js'));
  for (const interdit of ['Attaquer', 'Raider', 'Piller', 'Conquérir']) {
    assert.ok(!ecran.includes(interdit), `l'écran Monde promet « ${interdit} »`);
  }
  // Falsifiable : le découpage doit bien voir le bouton qui EST là.
  assert.ok(bloc.includes('monde-panneau-fermer'), 'le découpage du bloc ne mesure rien');
});

// ---------------------------------------------------------------------------
// Ce que l'écran n'a pas le droit d'écrire en dur
// ---------------------------------------------------------------------------

test('écran — il ne nomme aucune constante de grille ni de zoom en dur', () => {
  // ⚠ UNE CONSTANTE RECOPIÉE EST UNE SECONDE TABLE. Le jour où la carte
  // passerait de 31 à 33 colonnes, ou les crans de zoom à cinq, l'écran
  // continuerait de dessiner l'ancienne carte sans qu'un test tombe : il n'y a
  // pas de navigateur ici pour le voir.
  const code = sansCommentaires(lire('src', 'ui', 'monde.js'));
  const interdits = new Map([
    [GEOGRAPHIE.carte.largeur, 'la largeur de la carte'],
    [GEOGRAPHIE.carte.hauteur, 'la hauteur de la carte'],
    [ZOOM_CARTE.pixelsParTuile, 'le côté d\'une tuile'],
    [ZOOM_CARTE.grilleEmbleme, 'la grille d\'un emblème'],
    [GEOGRAPHIE.niveauPlafond, 'le plafond de niveau'],
    [TERRAIN_CARTE.dalleCotePx, 'le côté d\'une dalle'],
    [TERRAIN_CARTE.dallesEnCache, 'la taille du cache'],
    [TERRAIN_CARTE.pasSourcePx, 'le pas du réseau'],
  ]);
  for (const cran of CRANS) interdits.set(cran, `le cran de zoom ${cran}`);

  for (const [valeur, quoi] of interdits) {
    const motif = new RegExp(`(?<![\\w.])${valeur}(?![\\w.])`);
    const trouve = code.match(motif);
    assert.equal(trouve, null,
      `l'écran Monde écrit ${valeur} en dur — ${quoi} — au lieu de le lire dans src/data/`);
  }

  // Falsifiable dans les deux sens : le motif doit attraper une vraie
  // occurrence, et laisser passer un nombre qui la contient.
  const cran = CRANS[CRANS.length - 1];
  assert.ok(new RegExp(`(?<![\\w.])${cran}(?![\\w.])`).test(`const c = ${cran};`),
    'le motif n\'attrape même pas un appât');
  assert.equal(`const c = 1${cran}0;`.match(new RegExp(`(?<![\\w.])${cran}(?![\\w.])`)), null,
    'le motif attrape un nombre qui contient seulement la valeur');

  // Et il LIT bien les tables : sans import, l'absence de littéraux ne
  // prouverait rien — un écran vide passerait aussi.
  for (const table of ['GEOGRAPHIE', 'ZOOM_CARTE', 'TERRAIN_CARTE', 'EMBLEMES_CARTE']) {
    assert.ok(code.includes(table), `l'écran Monde n'importe plus ${table}`);
  }
});

// ---------------------------------------------------------------------------
// Le cache, la teinte d'attente, l'atlas
// ---------------------------------------------------------------------------

test('cache — la dalle la moins récemment employée cède sa place, jamais la plus lue', () => {
  // ⚠ PAS « FENÊTRE + MARGE ». Le pavage pose environ cinq tuiles par case ; au
  // cran le plus large la fenêtre fait 31 × 43 cases, soit près de 7 000 poses.
  // Avec une marge, chaque franchissement de bord les referait toutes.
  const cache = creerCacheDalles(3);
  cache.ecrire('a', 1);
  cache.ecrire('b', 2);
  cache.ecrire('c', 3);
  assert.equal(cache.taille, 3);
  // Relire « a » la remet en queue : c'est « d » qui doit évincer « b ».
  assert.equal(cache.lire('a'), 1);
  cache.ecrire('d', 4);
  assert.equal(cache.taille, 3);
  assert.equal(cache.lire('b'), undefined, 'la dalle relue a été évincée à la place de l\'autre');
  assert.equal(cache.lire('a'), 1);
  assert.equal(cache.lire('d'), 4);
  // Réécrire une clé existante ne la duplique pas.
  cache.ecrire('a', 9);
  assert.equal(cache.taille, 3);
  assert.equal(cache.lire('a'), 9);
  cache.vider();
  assert.equal(cache.taille, 0);
  // La capacité du jeu tient une pleine fenêtre au cran le plus serré et de
  // quoi défiler : c'est ce que la table dit, et l'écran la lit.
  assert.ok(TERRAIN_CARTE.dallesEnCache >= 12, 'le cache ne tient plus une fenêtre');
});

test('attente — une dalle qui manque se peint de la teinte moyenne de son camp, jamais en noir', () => {
  const auDepart = teinteDAttente(GEOGRAPHIE.carte.hauteur);
  const auBout = teinteDAttente(1);
  assert.ok(TERRAIN_CARTE.rampes.joueur.includes(auDepart), `teinte d'attente ${auDepart}`);
  assert.ok(TERRAIN_CARTE.rampes.ouvrage.includes(auBout), `teinte d'attente ${auBout}`);
  // C'est bien le MILIEU des rampes, pas un bout : une attente au ton extrême
  // sauterait aux yeux quand la dalle arrive par-dessus.
  assert.equal(auDepart, TERRAIN_CARTE.rampes.joueur[2]);
  assert.equal(auBout, TERRAIN_CARTE.rampes.ouvrage[2]);
  assert.ok(DALLES_PAR_IMAGE >= 1 && DALLES_PAR_IMAGE <= 4,
    `${DALLES_PAR_IMAGE} dalles par image : l'à-coup n'est plus borné`);
});

test('atlas — l\'appariement d\'une couleur est exact, et retombe sur la plus proche', () => {
  // Le PNG livré est indexé sur la rampe du joueur et ne porte aucun chunk de
  // gestion de couleur : l'appariement exact suffit. La retombée existe pour le
  // jour où un appareil appliquerait quand même un profil — mieux vaut une
  // teinte voisine qu'un atlas refusé et une carte noire.
  const hex = TERRAIN_CARTE.rampes.joueur;
  const rvba = new Uint8ClampedArray(4 * (hex.length + 1));
  hex.forEach((h, i) => {
    rvba[i * 4] = parseInt(h.slice(1, 3), 16);
    rvba[i * 4 + 1] = parseInt(h.slice(3, 5), 16);
    rvba[i * 4 + 2] = parseInt(h.slice(5, 7), 16);
    rvba[i * 4 + 3] = 255;
  });
  // Une couleur décalée de deux niveaux sur chaque canal : le plus proche est
  // encore le sien.
  const dernier = hex.length;
  rvba[dernier * 4] = parseInt(hex[1].slice(1, 3), 16) + 2;
  rvba[dernier * 4 + 1] = parseInt(hex[1].slice(3, 5), 16) - 2;
  rvba[dernier * 4 + 2] = parseInt(hex[1].slice(5, 7), 16) + 1;
  const indices = indicesDeTeinte(rvba);
  assert.deepEqual(Array.from(indices.slice(0, hex.length)), [0, 1, 2, 3, 4]);
  assert.equal(indices[dernier], 1, 'la retombée ne trouve pas la teinte la plus proche');
});

// ---------------------------------------------------------------------------
// Les emblèmes et la page
// ---------------------------------------------------------------------------

test('emblèmes — le bord rouge est réservé à ce qui attaque le joueur', () => {
  // ⚠ C'EST UNE INFORMATION DE JEU, PAS UN CHOIX DE STYLE. Les bases de
  // l'Ouvrage sont les seules qui attaquent — `TYPES_SITE.base.attaqueLeJoueur`
  // le dit déjà. Camp et avant-poste sont du BUTIN : les peindre en rouge
  // ferait fuir le joueur devant ce qu'il doit aller chercher.
  const ROUGE = '#E43E32';
  const enRouge = Object.entries(EMBLEMES_CARTE)
    .filter(([, e]) => e.bord.toUpperCase() === ROUGE)
    .map(([nom]) => nom);
  const agressifs = Object.entries(TYPES_SITE)
    .filter(([, t]) => t.attaqueLeJoueur)
    .map(([nom]) => nom);
  assert.deepEqual(enRouge.slice().sort(), agressifs.slice().sort(),
    'le bord rouge ne désigne plus exactement les sites qui attaquent');
  assert.ok(agressifs.length > 0, 'le montage ne mesure rien : aucun site n\'attaque');

  // Chaque type de site connu de l'écran a son gabarit, lettre comprise, et
  // deux gabarits ne partagent pas la même lettre — sinon ils seraient
  // indiscernables au-delà de la taille où la lettre apparaît.
  const lettres = Object.values(EMBLEMES_CARTE).map((e) => e.lettre);
  assert.equal(new Set(lettres).size, lettres.length, 'deux emblèmes portent la même lettre');
  for (const [nom, e] of Object.entries(EMBLEMES_CARTE)) {
    assert.match(e.lettre, /^[A-Z]$/, `${nom} n'a pas de lettre lisible`);
    assert.ok(e.nom.length > 2, `${nom} n'a pas de nom affichable`);
  }
  // Les trois types de `TYPES_SITE` ont tous leur gabarit : un site généré sans
  // emblème ferait lever l'écran au moment de le dessiner.
  for (const type of Object.keys(TYPES_SITE)) {
    assert.ok(EMBLEMES_CARTE[type] !== undefined, `aucun gabarit pour le site « ${type} »`);
  }
  assert.ok(CSS_MINI_LETTRE > 0);
});

test('page — l\'onglet Monde est vivant, l\'écran existe, et l\'atlas y est inliné', () => {
  const html = lire('dist', 'index.html');
  for (const id of ['onglet-monde', 'ecran-monde', 'monde-atlas', 'monde-canvas',
    'monde-champ', 'monde-outils', 'monde-zoom-moins', 'monde-zoom-plus', 'monde-echelle',
    'monde-panneau', 'monde-panneau-titre', 'monde-panneau-fermer', 'monde-panneau-corps']) {
    assert.ok(html.includes(`id="${id}"`), `#${id} manque à la page`);
  }
  // L'onglet n'est plus mort.
  const onglet = html.match(/<button[^>]*id="onglet-monde"[^>]*>/)[0];
  assert.ok(!/disabled/.test(onglet), 'l\'onglet Monde est encore désactivé');
  assert.ok(!/class="[^"]*\bfutur\b/.test(onglet), 'l\'onglet Monde se dit encore « futur »');
  // L'écran part caché : le jeu s'ouvre sur la Base.
  assert.match(html, /<div id="ecran-monde" hidden>/);

  // ⚠ L'ATLAS EST DANS LE HTML, EN `data:`. C'est le prix de l'offline, qui
  // n'est pas négociable : une image à côté serait une référence externe et le
  // build sortirait en erreur. Le marqueur du source ne doit plus s'y trouver.
  assert.ok(!html.includes('%ATLAS_TERRAIN%'), 'le marqueur de l\'atlas n\'a pas été remplacé');
  const src = html.match(/<img[^>]*id="monde-atlas"[^>]*src="([^"]{0,64})/);
  assert.ok(src, 'l\'image de l\'atlas a disparu');
  assert.ok(src[1].startsWith('data:image/png;base64,'), `src « ${src[1]} » : l'atlas n'est pas inliné`);
  // Et il pèse ce qu'il pèse : au moins deux cent mille octets de base64,
  // sinon c'est qu'un fichier vide a été inliné sans que rien ne le dise.
  const entier = html.match(/<img[^>]*id="monde-atlas"[^>]*src="([^"]*)"/)[1];
  assert.ok(entier.length > 200_000, `l'atlas inliné ne fait que ${entier.length} caractères`);
});

test('page — l\'écran Monde n\'ajoute aucune barre à hauteur fixe', () => {
  // ⚠ CONSIGNE D'ETHAN, 28/08 : « tu compresses tout dans l'ui ». Le chrome
  // fixe de la colonne de jeu est gardé ailleurs, à 288 px pour six barres ;
  // une septième le ferait tomber. Les deux contrôles de zoom et le panneau de
  // site se POSENT sur la carte, en `absolute`.
  const feuille = lire('src', 'index.src.html').replace(/\/\*[\s\S]*?\*\//g, '');
  const fixes = [...feuille.matchAll(/#([a-zA-Z-]+)\s*\{[^}]*flex:\s*0 0 \d+px/g)]
    .map((m) => m[1]);
  assert.deepEqual(fixes.filter((id) => id.startsWith('monde')), [],
    'l\'écran Monde a pris une hauteur fixe dans la colonne de jeu');
  for (const id of ['monde-outils', 'monde-panneau']) {
    assert.match(feuille, new RegExp(`#${id}\\s*\\{[^}]*position:\\s*absolute`),
      `#${id} n'est plus posé sur la carte : il prend de la place à la grille`);
  }
  // Le canevas doit prendre le geste : sans `touch-action: none`, le navigateur
  // avale le glissement pour faire défiler la page et la carte ne suit plus.
  assert.match(feuille, /#monde-canvas\s*\{[^}]*touch-action:\s*none/,
    'le canevas de la carte laisse le navigateur avaler le glissement');
});

test('session — l\'écran Monde est déclaré, allumé, et retiré quand on le quitte', () => {
  const session = sansCommentaires(lire('src', 'ui', 'session.js'));
  assert.ok(/const ECRANS = \[[^\]]*'monde'/.test(session), '« monde » n\'est pas un écran');
  assert.ok(/monde: 'onglet-monde'/.test(session), 'l\'écran Monde n\'allume aucun onglet');
  // ⚠ ET IL SE RETIRE. La carte est le seul écran qui porte une boucle à lui :
  // les dalles se calculent deux par image tant qu'il en manque. La laisser
  // tourner derrière un autre écran ferait travailler l'appareil pour des
  // pixels que personne ne regarde.
  // ⚠ LA FORME EXACTE, PAS LA SEULE PRÉSENCE DU NOM. Première version : elle
  // cherchait `ecranMonde.masquer()` n'importe où, et une falsification qui
  // l'enfermait derrière un `if (false)` passait au VERT. Un appel qu'on ne
  // peut pas atteindre n'est pas un appel — on exige donc la branche `else`,
  // sans condition, celle qui s'exécute pour tout écran autre que la carte.
  assert.ok(/else ecranMonde\.masquer\(\);/.test(session),
    'rien ne retire l\'écran Monde de la scène : sa boucle tournerait derrière les autres');
  assert.ok(/if \(nom === 'monde'[^\n]*\) ecranMonde\.peindre\(etat\);/.test(session),
    'la carte ne se met plus en scène quand on l\'ouvre');
  assert.ok(/ecranMonde\.rafraichir\(etat\)/.test(session),
    'la carte ne se rafraîchit pas : les satellites paraîtraient sans qu\'elle le voie');
});
