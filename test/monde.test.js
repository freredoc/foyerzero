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
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CRANS, CRAN_PAR_DEFAUT, DALLES_PAR_IMAGE,
  dimensionsDeLaCarte, bornerDefilement, fenetreVisible, distanceEnCases,
  sitesDeLaFenetre, lignesDuSite, creerCacheDalles, indicesDeTeinte, teinteDAttente,
  palierDuSite,
} from '../src/ui/monde.js';
import {
  GEOGRAPHIE, ZOOM_CARTE, TERRAIN_CARTE, EMBLEMES_CARTE, TYPES_SITE,
  palierDeNiveau, PALIERS_EMBLEME,
} from '../src/data/sites.js';
import {
  spriteDuSite, SPRITES_POI, SPRITES_GROSSE_BASE, nomsPreBranches,
  empriseDeLaGrosseBase, dessinerGrosseBase, FAMILLE, cotesDuSite,
} from '../src/render/embleme.js';
import { existeDansAtlas } from '../src/render/sprite.js';
import { ATLAS } from '../src/data/atlas.js';
import { saveurDeLaCase } from '../src/sim/site-de-la-case.js';
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
  // ⚠⚠ `assert.ok(CSS_MINI_LETTRE > 0)` ÉTAIT ICI, ET IL EST RETIRÉ AVEC SA
  // CONSTANTE. Arbitré par Ethan le 30/08 : « on enlève les lettres quoi qu'il
  // arrive » — plus de lettre sur la carte, donc plus de seuil, donc plus rien à
  // asserter dessus. Ce n'est pas un assouplissement : le test voisin exige
  // maintenant que ni la constante ni le `fillText` ne reparaissent.
  //
  // ⚠ LE CHAMP `lettre`, LUI, RESTE, ET SES DEUX ASSERTIONS AVEC. Ses lecteurs
  // ont été cherchés avant d'y toucher : `nom` en a TROIS et ils sont vivants —
  // le panneau de site et son titre —, donc la table ne bouge pas ; `lettre` est
  // la seule désignation courte des cinq types, et un panneau futur la
  // reprendra. Le supprimer serait détruire de l'information pour économiser
  // cinq caractères.
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

// ---------------------------------------------------------------------------
// Les emblèmes — lot CARTE-EMBLÈMES
// ---------------------------------------------------------------------------
//
// ⚠⚠ CE QUE CE BLOC GARDE : que chaque site de la carte résolve un dessin qui
// EXISTE. Les 45 sprites de `art/sprites/carte/` étaient au dépôt depuis le lot
// 6 et aucun n'était branché ; l'écran dessinait un carré de couleur et une
// lettre, et rien ne pouvait dire que l'art et le code parlaient du même objet.

test('paliers — les huit bornes de la règle, et neuf paliers distincts sur cinquante niveaux', () => {
  // ⚠ ARBITRÉ PAR ETHAN LE 30/08 : « Emblème de 1 à 9, 10 à 14, 15 à 19 etc.
  // 9 sprites. » Les bornes sont celles du brief, recopiées comme un contrat.
  const BORNES = [[1, 1], [9, 1], [10, 2], [14, 2], [15, 3], [44, 8], [45, 9], [50, 9]];
  for (const [niveau, palier] of BORNES) {
    assert.equal(palierDeNiveau(niveau), palier, `niveau ${niveau}`);
  }

  // ⚠⚠ SANS CETTE MOITIÉ, UNE FONCTION CONSTANTE PASSERAIT LES BORNES UNE À UNE.
  // Le compte des paliers distincts est ce qui mesure la RÈGLE, pas ses points.
  const vus = new Set();
  for (let n = 1; n <= GEOGRAPHIE.niveauPlafond; n += 1) vus.add(palierDeNiveau(n));
  assert.equal(vus.size, PALIERS_EMBLEME.nombre,
    `${vus.size} paliers distincts sur les ${GEOGRAPHIE.niveauPlafond} niveaux`);
  assert.deepEqual([...vus].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9]);

  // ⚠ ET LA NEUVIÈME BANDE ABSORBE LE 50. Huit bandes de cinq après le premier
  // palier s'arrêteraient à 49 ; or `niveauDeLaRangee` rend 50 pour toutes les
  // rangées de 1 à 50, donc de tels sites existent. **Un site sans emblème est
  // le seul résultat exclu.**
  const niveauxReels = new Set();
  for (let r = 1; r <= GEOGRAPHIE.carte.hauteur; r += 1) niveauxReels.add(niveauDeLaRangee(r));
  assert.ok(niveauxReels.has(GEOGRAPHIE.niveauPlafond),
    'aucune rangée n\'atteint le plafond : la neuvième bande ne prouverait rien');
  for (const n of niveauxReels) assert.doesNotThrow(() => palierDeNiveau(n), `niveau ${n}`);
});

test('paliers — hors de 1…50, ça lève', () => {
  for (const mauvais of [0, -1, GEOGRAPHIE.niveauPlafond + 1, 3.5, NaN, null, undefined]) {
    assert.throws(() => palierDeNiveau(mauvais), /hors de/, `« ${mauvais} » passe`);
  }
  // Témoin : les bornes valides ne lèvent pas, sinon une fonction qui lève
  // toujours passerait la boucle ci-dessus.
  assert.doesNotThrow(() => palierDeNiveau(1));
  assert.doesNotThrow(() => palierDeNiveau(GEOGRAPHIE.niveauPlafond));
});

test('emblèmes — le palier de la base du joueur vient de ses BÂTIMENTS, pas de sa rangée', () => {
  // ⚠⚠ C'EST LA FAUTE QUE `sim/carte.js` EXISTE POUR EMPÊCHER, et l'en-tête de
  // `ui/monde.js` la nomme déjà : `niveauDeLaRangee` donne le niveau des sites de
  // l'OUVRAGE à cet endroit de la carte. La base du joueur porte TROIS niveaux
  // qui lui sont propres, chacun une moyenne de ce qu'il a posé, et aucun ne se
  // déduit d'une position.
  //
  // ⚠⚠ ET LE MONTAGE DOIT SÉPARER LES DEUX LECTURES, sans quoi il ne mesure
  // rien. À la rangée de DÉPART — 275, niveau 5, palier 1 — une base neuve donne
  // aussi le palier 1 : les deux lectures coïncident, et une version qui lirait
  // la rangée passerait. Mesuré, pas supposé. On place donc la base là où la
  // rangée donnerait le palier 9.
  const etat = creerEtat(4242);
  etat.position = { rangee: 50, colonne: 16 };
  const parLaRangee = palierDeNiveau(niveauDeLaRangee(50));
  const site = { type: 'baseJoueur', rangee: 50, colonne: 16, niveau: null, saveur: null };
  const rendu = palierDuSite(site, etat);

  assert.equal(parLaRangee, 9, 'la rangée 50 ne donne plus le palier 9 : le montage ne sépare rien');
  assert.notEqual(rendu, parLaRangee,
    'le palier de la base du joueur suit sa rangée — c\'est le niveau de l\'Ouvrage, pas le sien');
  assert.equal(rendu, 1, 'une base neuve n\'a qu\'un Chantier de niveau 1, donc le palier 1');

  // ⚠ ET IL SUIT BIEN LES BÂTIMENTS. Sans ce second montage, une fonction qui
  // rendrait toujours 1 passerait les trois lignes ci-dessus.
  const monte = creerEtat(4242);
  monte.position = { rangee: 50, colonne: 16 };
  for (const b of monte.disposition) b.niveau = 30;
  assert.equal(palierDuSite(site, monte), palierDeNiveau(30),
    'monter les bâtiments ne change pas le palier : il ne les lit pas');
  assert.notEqual(palierDuSite(site, monte), rendu);
});

test('emblèmes — chaque site de la fenêtre résout un sprite qui est dans l\'atlas', () => {
  // Balayage direct : les types D'UNE CASE × les deux saveurs × les neuf paliers.
  //
  // ⚠⚠ LA TERMINALE EST SORTIE DU BALAYAGE, ET ELLE Y EST REMPLACÉE PAR UNE
  // LEVÉE. Elle prenait `site_base_o_n9` et se confondait exactement avec une
  // base de l'Ouvrage au dernier palier ; depuis l'arbitrage du 30/08 elle se
  // dessine en hexagone sur neuf cases, et `spriteDuSite` LÈVE pour elle — un
  // appelant oublié doit se voir, pas retomber sur l'ancien nom.
  const noms = new Set();
  for (const type of Object.keys(EMBLEMES_CARTE)) {
    if (cotesDuSite(type) !== null) continue;
    for (const saveur of ['richeQuartz', 'richeScorie']) {
      for (let palier = 1; palier <= PALIERS_EMBLEME.nombre; palier += 1) {
        const nom = spriteDuSite(type, palier, saveur);
        assert.ok(existeDansAtlas(FAMILLE, nom),
          `${type}/${saveur}/n${palier} demande « ${nom} », absent de l'atlas`);
        noms.add(nom);
      }
    }
  }
  // ⚠ FALSIFIABLE : une fonction qui rendrait toujours le même nom passerait
  // toutes les assertions ci-dessus. Le compte est **36**, RECOMPTÉ et non
  // recopié : 9 `site_base_o_n*`, 9 `site_base_j_n*`, 9 `site_quartz_n*` et
  // 9 `site_scorie_n*`.
  //
  // ⚠⚠ IL VALAIT DÉJÀ 36 AVANT CE LOT, ET POUR UNE AUTRE RAISON. La terminale
  // partageait alors `site_base_o_n9` — elle n'ajoutait donc aucun nom tout en
  // étant balayée ; elle est maintenant HORS du balayage, et le total ne bouge
  // pas. Deux causes différentes pour le même nombre : c'est exactement le genre
  // de coïncidence qui ferait croire qu'un test n'a pas bougé, d'où ce
  // paragraphe et l'assertion de levée ci-dessous.
  assert.equal(noms.size, 36, `${noms.size} noms distincts composés`);
  assert.equal(new Set(Object.keys(EMBLEMES_CARTE)).size - 1,
    Object.keys(EMBLEMES_CARTE).filter((t) => cotesDuSite(t) === null).length,
    'un second type de site couvre plusieurs cases — recompter le balayage');

  // Et par la VRAIE liste de sites, celle que l'écran dessine.
  const etat = creerEtat(4242);
  const sites = sitesDeLaFenetre(etat, fenetreVisible({
    x: 0, y: 0, largeur: 1200, hauteur: 1600, cran: CRANS[0],
  }));
  assert.ok(sites.length > 1, `${sites.length} site(s) dans la fenêtre : le balayage ne mesure rien`);
  for (const site of sites) {
    if (cotesDuSite(site.type) !== null) continue;
    const nom = spriteDuSite(site.type, palierDuSite(site, etat), site.saveur);
    assert.ok(existeDansAtlas(FAMILLE, nom),
      `site ${site.type} en (${site.rangee}, ${site.colonne}) → « ${nom} », absent`);
  }
});

test('emblèmes — la saveur voyage jusqu\'au sprite, et elle vient de la case', () => {
  // ⚠⚠ IL FAUT DEUX CASES DE SAVEURS DIFFÉRENTES, ET IL FAUT L'ASSERTER AVANT.
  // Sans ça, le test passerait sur une coïncidence de graine : deux cases de
  // même saveur donneraient deux fois le même sprite et l'égalité serait vraie
  // pour la mauvaise raison.
  const GRAINE = 4242;
  let quartz = null;
  let scorie = null;
  for (let r = 100; r <= 260 && (quartz === null || scorie === null); r += 1) {
    for (let c = 1; c <= 31; c += 1) {
      const s = saveurDeLaCase(GRAINE, r, c, 'camp');
      if (s === 'richeQuartz' && quartz === null) quartz = { rangee: r, colonne: c };
      if (s === 'richeScorie' && scorie === null) scorie = { rangee: r, colonne: c };
    }
  }
  assert.ok(quartz !== null && scorie !== null, 'le balayage n\'a pas trouvé les deux saveurs');

  const nomQuartz = spriteDuSite('camp', 5, saveurDeLaCase(GRAINE, quartz.rangee, quartz.colonne, 'camp'));
  const nomScorie = spriteDuSite('camp', 5, saveurDeLaCase(GRAINE, scorie.rangee, scorie.colonne, 'camp'));
  assert.notEqual(nomQuartz, nomScorie,
    'deux saveurs différentes donnent le même sprite : la saveur ne voyage pas');
  assert.equal(nomQuartz, 'site_quartz_n5');
  assert.equal(nomScorie, 'site_scorie_n5');

  // ⚠⚠ ET IL FAUT DES SATELLITES POSÉS, SANS QUOI LE MONTAGE NE MESURE RIEN.
  // Une partie neuve n'en a AUCUN — `creerEtat` les met en attente, à 3 000
  // ticks. Le premier jet de ce test bouclait donc sur des bases seules, dont la
  // saveur est `null` des deux côtés : remplacer la saveur d'un satellite par
  // une constante, ou la lire sur la mauvaise rangée, le laissait VERT. C'est la
  // faute que CLAUDE.md nomme déjà — « un montage écrit à la main ne garde que
  // lui-même » —, et les deux camps ci-dessous sont posés À LA MAIN, comme un
  // état HÉRITÉ, ce que le dépôt autorise explicitement pour cette raison.
  const etat = creerEtat(GRAINE);
  etat.satellites.presents.push(
    { type: 'camp', rangee: quartz.rangee, colonne: quartz.colonne, niveau: 5, instance: 1 },
    { type: 'camp', rangee: scorie.rangee, colonne: scorie.colonne, niveau: 5, instance: 2 },
  );
  const fenetreLarge = {
    premiereRangee: 1, derniereRangee: GEOGRAPHIE.carte.hauteur,
    premiereColonne: 1, derniereColonne: GEOGRAPHIE.carte.largeur,
  };
  const sites = sitesDeLaFenetre(etat, fenetreLarge);
  assert.ok(sites.length > 0, 'aucun site : le contrôle ne mesure rien');

  // ⚠ LE TÉMOIN QUI MANQUAIT : au moins un site porte une saveur NON nulle, et
  // les deux saveurs sont représentées. Sans lui, tout ce qui suit comparerait
  // `null` à `null`.
  const saveursVues = new Set(sites.map((x) => x.saveur));
  assert.ok(saveursVues.has('richeQuartz') && saveursVues.has('richeScorie'),
    `saveurs vues : ${[...saveursVues].join(', ')} — le montage ne porte pas les deux`);
  for (const site of sites) {
    const attendu = saveurDeLaCase(
      etat.graine, site.rangee, site.colonne,
      site.type === 'camp' || site.type === 'avantPoste' ? site.type : 'base',
    );
    assert.equal(site.saveur, attendu, `saveur divergente en (${site.rangee}, ${site.colonne})`);
  }

  // Le témoin : `sitesDeLaFenetre` porte bien le champ. Sans lui, `undefined`
  // égalerait `undefined` pour les bases et le test passerait sur du vide.
  for (const site of sites) {
    assert.ok(Object.prototype.hasOwnProperty.call(site, 'saveur'),
      `le site ${site.type} ne porte pas de champ « saveur »`);
  }
});

test('emblèmes — les neuf pré-branchés sont joignables, pas seulement présents', () => {
  // ⚠⚠ RIEN NE LES DESSINE, ET C'EST DIT. Le modèle ne produit aucun site de
  // type POI, et une base ne connaît pas sa taille — `sim/peuplement.js` pose
  // des bases d'UNE case. Ce test est ce qui empêche l'art de pourrir en
  // attendant son modèle : le jour où le modèle en produira, SEUL le modèle
  // changera.
  assert.equal(SPRITES_POI.length, 7, `${SPRITES_POI.length} POI — le compte a changé`);
  assert.equal(Object.keys(SPRITES_GROSSE_BASE).length, 2);
  assert.equal(nomsPreBranches().length, 9);

  // Les sept POI sont DANS l'atlas.
  for (const nom of SPRITES_POI) {
    assert.ok(existeDansAtlas(FAMILLE, nom), `« ${nom} » n'est pas dans l'atlas`);
  }

  // ⚠ LES DEUX GROSSES BASES N'Y SONT PAS, ET C'EST LE POINT. Elles ne sont pas
  // carrées à la taille de case, donc `coudre` les refuse ; elles voyagent par
  // leur propre marqueur. Leur joignabilité se mesure sur le DISQUE.
  for (const nom of Object.values(SPRITES_GROSSE_BASE)) {
    assert.ok(!existeDansAtlas(FAMILLE, nom),
      `« ${nom} » est dans l'atlas : il n'a plus besoin de son marqueur`);
    const chemin = join(RACINE, 'art', 'sprites', 'carte', '64', `${nom}.png`);
    assert.ok(readFileSync(chemin).length > 0, `« ${nom} » est absent du disque`);
  }

  // Et leur emprise. Une 3 × 3 se centre ; une 2 × 2 n'a pas de centre, donc la
  // case du site est son coin HAUT-GAUCHE — choix réversible, dit au rapport.
  assert.deepEqual(empriseDeLaGrosseBase(3, { rangee: 10, colonne: 10 }),
    { rangee: 9, colonne: 9, cotes: 3 });
  assert.deepEqual(empriseDeLaGrosseBase(2, { rangee: 10, colonne: 10 }),
    { rangee: 10, colonne: 10, cotes: 2 });
  assert.throws(() => empriseDeLaGrosseBase(4, { rangee: 1, colonne: 1 }), /grosse base/);
});

test('emblèmes — `ZOOM_CARTE` est la source des échelles, et le dessin la suit', () => {
  // ⚠ CE TEST TOMBE SI UN CRAN CHANGE DANS LES DONNÉES SANS QUE LE DESSIN SUIVE.
  // Les nombres ne sont pas recopiés : ils se LISENT dans `ZOOM_CARTE`.
  assert.ok(ZOOM_CARTE.crans.length > 1, 'un seul cran : l\'échelle ne mesure rien');
  assert.equal(CRANS, ZOOM_CARTE.crans, 'l\'écran a recopié les crans au lieu de les lire');

  for (const cran of ZOOM_CARTE.crans) {
    const d = dessinerGrosseBase(3, { rangee: 10, colonne: 10 }, cran, { x: 0, y: 0 });
    // Une grosse base couvre `cotes` cases, donc `cran × cotes` pixels de côté.
    assert.equal(d.cote, cran * 3, `cran ${cran} : côté ${d.cote}`);
    // Et elle se pose à son coin, en pixels ENTIERS — un `drawImage` à une
    // position fractionnaire rééchantillonne et rend le pixel art flou.
    assert.ok(Number.isInteger(d.x) && Number.isInteger(d.y), `cran ${cran} : coin non entier`);
    assert.equal(d.x, (10 - 1 - 1) * cran, `cran ${cran} : la 3 × 3 ne se centre pas`);
  }
  // Un cran hors table est refusé : le dessin ne s'invente pas une échelle.
  assert.throws(() => dessinerGrosseBase(3, { rangee: 10, colonne: 10 }, 99, { x: 0, y: 0 }), /cran/);

  // ⚠ ET LA GRILLE SOURCE EST LUE, ELLE AUSSI. `grilleEmbleme` dit la taille
  // d'une cellule d'emblème ; c'est elle que `celluleDuSprite` doit rendre.
  assert.equal(ZOOM_CARTE.grilleEmbleme, ATLAS[FAMILLE] === undefined ? null : 64,
    'la grille d\'emblème ne correspond plus à la grille de couture');
});

// ---------------------------------------------------------------------------
// L'hexagone et les lettres — lot FINITIONS
// ---------------------------------------------------------------------------

test('terminale — elle se dessine sur neuf cases, une base ordinaire sur une', () => {
  // ⚠ ARBITRÉ PAR ETHAN LE 30/08 : « la base terminale c'est la base en
  // hexagone, sur 9 tuiles monde. »
  //
  // ⚠ FALSIFIABLE : on asserte D'ABORD qu'une base ORDINAIRE n'occupe qu'une
  // case. Sans ce témoin, une fonction qui rendrait 3 pour tout le monde
  // passerait l'assertion qui suit.
  assert.equal(cotesDuSite('base'), null, 'une base de l\'Ouvrage occupe plus d\'une case');
  assert.equal(cotesDuSite('camp'), null);
  assert.equal(cotesDuSite('avantPoste'), null);
  assert.equal(cotesDuSite('baseJoueur'), null);
  assert.equal(cotesDuSite('baseTerminale'), 3, 'la terminale n\'est plus une 3 × 3');

  // La primitive rendue couvre bien neuf cases et porte le bon nom.
  const site = positionBaseTerminale();
  for (const cran of ZOOM_CARTE.crans) {
    const d = dessinerGrosseBase(3, site, cran, { x: 0, y: 0 });
    assert.equal(d.nom, SPRITES_GROSSE_BASE[3], `cran ${cran} : mauvais sprite`);
    assert.equal(d.cote, cran * 3, `cran ${cran} : ${d.cote} px de côté au lieu de ${cran * 3}`);
  }

  // ⚠ ET LA 2 × 2 RESTE SANS EMPLOI. Ethan : « la base 2 × 2 sera pour autre
  // chose. » Aucun type de site ne la demande.
  const cotesDemandes = Object.keys(EMBLEMES_CARTE).map(cotesDuSite).filter((c) => c !== null);
  assert.deepEqual(cotesDemandes, [3], 'un type de site demande une grosse base autre que la 3 × 3');
});

test('terminale — `spriteDuSite` LÈVE pour elle, elle ne retombe pas sur l\'ancien nom', () => {
  // ⚠ ELLE PRENAIT `site_base_o_n9` ET SE CONFONDAIT EXACTEMENT avec une base de
  // l'Ouvrage au dernier palier. Rendre l'ancien nom par compatibilité la
  // dessinerait deux fois — en petit sous son hexagone — et rien ne le dirait.
  for (let palier = 1; palier <= PALIERS_EMBLEME.nombre; palier += 1) {
    assert.throws(() => spriteDuSite('baseTerminale', palier, null), /hexagone/,
      `palier ${palier} : la terminale rend encore un nom d'emblème`);
  }
  // Témoin : les autres types en rendent toujours un.
  assert.doesNotThrow(() => spriteDuSite('base', 9, null));
  assert.doesNotThrow(() => spriteDuSite('baseJoueur', 1, null));
});

test('terminale — son emprise tient dans la carte, et déborder LÈVE', () => {
  const site = positionBaseTerminale();
  const e = empriseDeLaGrosseBase(3, site);
  // Mesuré : rangées 25 à 27, colonnes 15 à 17, sur une carte de 300 × 31.
  assert.ok(e.rangee >= 1 && e.rangee + 2 <= GEOGRAPHIE.carte.hauteur,
    `l'emprise sort de la carte en rangée : ${e.rangee}…${e.rangee + 2}`);
  assert.ok(e.colonne >= 1 && e.colonne + 2 <= GEOGRAPHIE.carte.largeur,
    `l'emprise sort de la carte en colonne : ${e.colonne}…${e.colonne + 2}`);

  // ⚠⚠ ET C'EST UNE PROPRIÉTÉ DE SA POSITION, PAS DE LA FONCTION. Poussée au
  // bord, elle LÈVE plutôt que de rogner : un carré tronqué en silence
  // dessinerait une base que personne ne saurait expliquer.
  for (const bord of [
    { rangee: 1, colonne: 16 },
    { rangee: GEOGRAPHIE.carte.hauteur, colonne: 16 },
    { rangee: 26, colonne: 1 },
    { rangee: 26, colonne: GEOGRAPHIE.carte.largeur },
  ]) {
    assert.throws(() => empriseDeLaGrosseBase(3, bord), /déborde la carte/,
      `(${bord.rangee}, ${bord.colonne}) ne lève pas`);
  }
  // Témoin : une case d'un cran à l'intérieur, elle, passe.
  assert.doesNotThrow(() => empriseDeLaGrosseBase(3, { rangee: 2, colonne: 2 }));
});

test('carte — plus aucune lettre n\'est dessinée, à aucun cran', () => {
  const source = lire('src', 'ui', 'monde.js');
  const nu = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

  // ⚠⚠ ARBITRÉ PAR ETHAN LE 30/08 : « on enlève les lettres quoi qu'il arrive. »
  // Pas de seuil, pas de cran, pas de condition.
  //
  // ⚠ LE BALAYAGE LIT LA SOURCE DÉCOMMENTÉE, et c'est la cinquième fois que le
  // dépôt en a besoin — après `viewport-fit=cover`, `MENTION_SATURE`,
  // `etat.rng` et `campChaine`. Le commentaire qui EXPLIQUE le retrait nomme
  // `CSS_MINI_LETTRE` ; une garde qui lit ce qu'on a écrit à son sujet ne garde
  // rien.
  assert.doesNotMatch(nu, /fillText/, 'l\'écran Monde dessine encore du texte sur la carte');
  assert.doesNotMatch(nu, /CSS_MINI_LETTRE/, '`CSS_MINI_LETTRE` est revenue dans le code');
  assert.doesNotMatch(nu, /\.lettre/, 'le champ `lettre` est relu par l\'écran');

  // ⚠ L'APPÂT : le décommentage doit encore reconnaître la vraie faute. Sans
  // lui, un motif trop gourmand rendrait les trois lignes ci-dessus muettes.
  const decommente = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  assert.match(decommente('ctx.fillText(x); // fillText'), /fillText/);
  assert.doesNotMatch(decommente('// CSS_MINI_LETTRE est partie'), /CSS_MINI_LETTRE/);

  // ⚠⚠ ET IL Y EN AVAIT BIEN AVANT, sinon ce test ne mesurerait rien. Le champ
  // `lettre` est TOUJOURS dans les données — c'est la seule désignation courte
  // des cinq types, et un panneau futur la reprendra —, il n'est simplement plus
  // lu par la carte.
  for (const [type, e] of Object.entries(EMBLEMES_CARTE)) {
    assert.match(e.lettre, /^[A-Z]$/, `${type} a perdu sa lettre`);
  }
  assert.equal(new Set(Object.values(EMBLEMES_CARTE).map((e) => e.lettre)).size,
    Object.keys(EMBLEMES_CARTE).length, 'deux types partagent une lettre');
});

test('carte — `CSS_MINI_LETTRE` n\'existe plus nulle part dans `src/`', () => {
  const fichiers = [];
  const parcourir = (dossier) => {
    for (const e of readdirSync(dossier, { withFileTypes: true })) {
      const p = join(dossier, e.name);
      if (e.isDirectory()) parcourir(p);
      else if (e.name.endsWith('.js') || e.name.endsWith('.html')) fichiers.push(p);
    }
  };
  parcourir(join(RACINE, 'src'));
  assert.ok(fichiers.length > 30, `${fichiers.length} fichiers balayés : le parcours ne voit rien`);

  let hors = 0;
  for (const p of fichiers) {
    const nu = readFileSync(p, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/<!--[\s\S]*?-->/g, '');
    assert.doesNotMatch(nu, /CSS_MINI_LETTRE/, `${p} la nomme encore`);
    hors += 1;
  }
  assert.equal(hors, fichiers.length);
});
