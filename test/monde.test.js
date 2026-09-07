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
  CRANS, DALLES_PAR_IMAGE,
  ECHELLE_MIN, ECHELLE_MAX, cranDeRendu, facteurDAffichage,
  bornerEchelle, vueApresEchelle, bordDeDalle,
  dimensionsDeLaCarte, bornerDefilement, fenetreVisible, distanceEnCases,
  sitesDeLaFenetre, lignesDuSite, lignesDeLEtiquette, creerCacheDalles,
  teinteDAttente,
  palierDuSite, nomDuSite, etiquettesRetenues, prioriteDeLEtiquette,
  traitDeLaFleche, traitRogne, centreDeLaCase, initialiserEcranMonde, EPAISSEUR_HALO,
  ciblageDuSite,
} from '../src/ui/monde.js';
import {
  GEOGRAPHIE, ZOOM_CARTE, TERRAIN_CARTE, EMBLEMES_CARTE, TYPES_SITE, ETIQUETTE_CARTE,
  palierDeNiveau, PALIERS_EMBLEME, ORIGINE_DU_NIVEAU,
} from '../src/data/sites.js';
import { echelleDuCran, geometrieDuCran, NOMS_DU_SOL } from '../src/render/terrain.js';

/** Le manifeste des huit planches — Node n'a pas de décodeur WebP. */
const MANIFESTE_SOL = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..',
    'art', 'sprites', 'sol', 'sol-empreintes.json'), 'utf8'),
);
import {
  spriteDuSite, SPRITES_POI, SPRITES_GROSSE_BASE, nomsPreBranches,
  empriseDeLaGrosseBase, dessinerGrosseBase, FAMILLE, cotesDuSite,
  dessinerEmblemeDUneCase,
} from '../src/render/embleme.js';
import { existeDansAtlas } from '../src/render/sprite.js';
import { ATLAS, COTE_SPRITE } from '../src/data/atlas.js';
import { saveurDeLaCase } from '../src/sim/site-de-la-case.js';
import { creerEtat, rattraperJeu, poserEffectif } from '../src/sim/state.js';
import { poserLesBatimentsDeProduction } from './batiments-de-production.js';
import { estBaseOuvrage, basesDeLaFenetre } from '../src/sim/peuplement.js';
import { ATLAS_DE_LA_PAGE, urlDeLaValeurCss } from '../src/ui/session.js';
import { tousLesFonds } from '../src/render/fond.js';
import { niveauDeLaRangee, positionBaseTerminale } from '../src/sim/carte.js';
import { baseCourante } from '../src/sim/base-courante.js';
import { TICKS_APPARITION } from '../src/sim/satellites.js';

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

test('zoom — les quatre crans sont des puissances de deux, et le sol y tombe juste', () => {
  // ⚠ CE N'EST PAS UNE COQUETTERIE. L'emblème est dessiné sur une grille de
  // `COTE_SPRITE` : à chaque cran, il doit rester à un facteur d'échelle ENTIER,
  // sinon on brouille du pixel art. Un cran intermédiaire à 192 conviendrait à
  // l'emblème (×3) et pas au reste — et c'est exactement le genre de valeur
  // qu'on ajoute « pour avoir un pas plus doux ».
  //
  // ⚠⚠ CE QUI A CHANGÉ AU LOT SOL-SATELLITE : la moitié « tuile » de ce test
  // portait sur `coteTuile` et `tuilesParCase`, qui sont partis avec l'atlas
  // indexé. Le sol est fait de planches de 1 254 px, qui ne divisent aucun cran
  // et n'ont pas à le faire — un bloc n'est pas indexé sur une case. Ce qu'on
  // exige de lui à la place, c'est de ne JAMAIS agrandir sa source, ce que
  // `render/terrain.js` tient par `echelleDuCran`.
  assert.equal(CRANS.length, 4, `${CRANS.length} crans`);
  for (const cran of CRANS) {
    assert.ok(Number.isInteger(Math.log2(cran)), `${cran} n'est pas une puissance de deux`);
    const versEmbleme = COTE_SPRITE / cran;
    assert.ok(Number.isInteger(versEmbleme) || Number.isInteger(1 / versEmbleme),
      `l'emblème ne s'échelonne pas entier au cran ${cran}`);
    assert.ok(echelleDuCran(cran) <= 1, `le sol est agrandi au cran ${cran}`);
    // ⚠ ET LA GÉOMÉTRIE DU PAVAGE RESTE ENTIÈRE, ce qui est ce qui rend le
    // fondu exact — voir `SOL T7`.
    const g = geometrieDuCran(cran);
    assert.ok(Number.isInteger(g.taille) && Number.isInteger(g.pas),
      `la géométrie du sol est fractionnaire au cran ${cran}`);
  }
  // Croissants — c'est ce qui donne un sens aux deux bouts de la table.
  for (let i = 1; i < CRANS.length; i += 1) assert.ok(CRANS[i] > CRANS[i - 1]);
  // ⚠⚠ L'ASSERTION SUR `CRAN_PAR_DEFAUT` EST RETIRÉE, ET ELLE SE DÉCLARE — lot
  // CARTE-B, 06/09. Elle exigeait `CRAN_PAR_DEFAUT === 0` sous le message « la
  // carte ne s'ouvre plus sur la vue la plus large » : c'est très exactement ce
  // qu'Ethan a renversé — « ouverture de la carte : centrée sur ma base du
  // joueur au zoom maximum ». La constante n'existe plus, et la propriété
  // qu'elle gardait — sur quoi la carte s'ouvre — est reprise par `CARTE-B T1`,
  // qui la mesure sur l'ÉCRAN MONTÉ au lieu de la lire dans une constante.

  // Falsifiable : un cran intermédiaire serait bien refusé par ce montage.
  const embleme192 = COTE_SPRITE / 192;
  assert.ok(!Number.isInteger(embleme192) && !Number.isInteger(1 / embleme192),
    'le montage accepterait un cran à 192 : il ne mesure rien');
  assert.throws(() => echelleDuCran(192), RangeError, 'un cran hors table ne lève plus');
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

test('distance — Euclide, comme les anneaux et la garde du peuplement', () => {
  // ⚠ BASELINE REMESURÉE AU LOT EUCLIDE (02/09), pas un comportement qui casse.
  // Ce test figeait trois nombres de Tchebychev ; la métrique de la carte a
  // changé, donc les trois nombres changent. Ce qu'il garde n'a pas bougé : le
  // panneau doit compter dans la MÊME métrique que la portée, sans quoi il
  // annoncerait « 8 cases » sous un rayon de 10 pour une cible que le jeu
  // refuse.
  //
  // Arrondi au SUPÉRIEUR : une cible à 4,24 cases est annoncée à 5, jamais à 4.
  assert.equal(distanceEnCases({ rangee: 10, colonne: 10 }, { rangee: 13, colonne: 13 }), 5);
  assert.equal(distanceEnCases({ rangee: 10, colonne: 10 }, { rangee: 10, colonne: 10 }), 0);
  // Un carré parfait tombe juste, sans le demi-pixel d'une racine flottante.
  assert.equal(distanceEnCases({ rangee: 0, colonne: 0 }, { rangee: 3, colonne: 4 }), 5);
  assert.equal(distanceEnCases({ rangee: 1, colonne: 9 }, { rangee: 5, colonne: 2 }), 9);
  // Falsifiable : Tchebychev rendrait 3 et 7 sur ces deux cas, Manhattan 6 et 11.
  assert.notEqual(distanceEnCases({ rangee: 10, colonne: 10 }, { rangee: 13, colonne: 13 }), 3);
  assert.notEqual(distanceEnCases({ rangee: 1, colonne: 9 }, { rangee: 5, colonne: 2 }), 7);
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
  assert.ok(baseCourante(etat).satellites.attentes.length > 0,
    'une base neuve doit avoir des attentes : le montage ne mesure rien');
  assert.equal(baseCourante(etat).satellites.presents.length, 0);

  const fenetre = {
    premiereRangee: 1, derniereRangee: GEOGRAPHIE.carte.hauteur,
    premiereColonne: 1, derniereColonne: GEOGRAPHIE.carte.largeur,
  };
  const avant = sitesDeLaFenetre(etat, fenetre)
    .filter((s) => s.type === 'camp' || s.type === 'avantPoste');
  assert.deepEqual(avant, [], 'une attente est dessinée comme un site');

  // Les mêmes attentes, une fois PARUES, se dessinent.
  baseCourante(etat).satellites.presents.push(
    { type: 'camp', rangee: baseCourante(etat).position.rangee + 1, colonne: baseCourante(etat).position.colonne, niveau: 3, instance: 1 },
    { type: 'avantPoste', rangee: baseCourante(etat).position.rangee - 3, colonne: baseCourante(etat).position.colonne + 2, niveau: 6, instance: 2 },
  );
  etat.prochaineInstanceSatellite = 3;
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
  assert.equal(dernier.rangee, baseCourante(etat).position.rangee);
  assert.equal(dernier.colonne, baseCourante(etat).position.colonne);
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
  // ⚠⚠ RÉANCRÉ AU LOT CARTE-C, ET LES DEUX LISTES SONT ÉCRITES. Elle valait
  // `['Type', 'Niveau', 'Distance', 'Position']` ; « Indexé sur » entre entre le
  // niveau et la distance — Ethan, 06/09, a demandé d'où vient le niveau d'un
  // site. L'assertion n'est pas assouplie : la liste reste EXACTE.
  //
  // ⚠ ET LES VALEURS SE CHERCHENT PAR NOM DÉSORMAIS, PLUS PAR INDICE. Une ligne
  // insérée au milieu décalait trois assertions qui n'avaient rien à voir avec
  // elle ; par nom, elles ne peuvent plus se tromper de ligne en silence.
  const valeurDe = (l, quoi) => l.find((x) => x.quoi === quoi)?.valeur;
  const lignes = lignesDuSite(base, depuis);
  assert.deepEqual(lignes.map((l) => l.quoi), ['Type', 'Niveau', 'Indexé sur', 'Distance', 'Position']);
  assert.equal(valeurDe(lignes, 'Type'), EMBLEMES_CARTE.base.nom);
  assert.equal(valeurDe(lignes, 'Niveau'), '6');
  // ⚠ BASELINE REMESURÉE AU LOT EUCLIDE : 5 rangées et 3 colonnes font 5,83
  // cases en ligne droite, arrondies à 6. Tchebychev en comptait 5.
  assert.equal(valeurDe(lignes, 'Distance'), '6 cases');

  // ⚠⚠ LA BASE DU JOUEUR N'A PAS DE NIVEAU DE CARTE. Elle en porte TROIS, qui
  // sont des moyennes de ce qu'il a posé, et aucun ne se déduit d'une position.
  // Afficher ici le niveau de sa rangée lui apprendrait une grandeur fausse —
  // c'est la faute que `sim/carte.js` existe pour empêcher.
  const joueur = { type: 'baseJoueur', rangee: 275, colonne: 16, niveau: null };
  const sien = lignesDuSite(joueur, depuis);
  assert.equal(valeurDe(sien, 'Distance'), '0 cases');
  assert.ok(!/\b5\b/.test(valeurDe(sien, 'Niveau')),
    `le panneau du joueur affiche « ${valeurDe(sien, 'Niveau')} » : le niveau de sa rangée`);
  assert.ok(/moyennes/.test(valeurDe(sien, 'Niveau')), 'il ne dit pas pourquoi il n\'y a pas de niveau');
  // ⚠ ET IL NE DIT PAS D'OÙ VIENT UN NIVEAU QU'IL N'A PAS. Sa base n'est pas dans
  // `TYPES_SITE`, et elle en porte TROIS : une ligne « Indexé sur » y désignerait
  // une grandeur qui n'existe pas.
  assert.equal(valeurDe(sien, 'Indexé sur'), undefined, 'le panneau du joueur dit d\'où vient son niveau');

  // Le singulier, parce qu'un « 1 cases » se remarque.
  assert.equal(valeurDe(lignesDuSite({ ...base, rangee: 274, colonne: 16 }, depuis), 'Distance'), '1 case');

  // Un type inconnu LÈVE : c'est un fait de programme, pas un fait de jeu.
  assert.throws(() => lignesDuSite({ ...base, type: 'inconnu' }, depuis), /type de site inconnu/);
});

test('panneau — la liste des boutons est close, et trois mots restent interdits', () => {
  // ⚠ RIEN NE DOIT PROMETTRE CE QUI N'EXISTE PAS. C'était écrit le 27/08 contre
  // le bouton « Assaut » du lot ÉCRAN-CHANTIER, qui pointait sur du sol nu.
  //
  // ⚠⚠ ET LA RÈGLE A ÉTÉ RENVERSÉE AU LOT CARTE-C, PAS ASSOUPLIE. Elle exigeait
  // la liste EXACTE `['monde-panneau-fermer']` et interdisait QUATRE mots —
  // Attaquer, Raider, Piller, Conquérir —, au motif qu'on entre dans une cible
  // par un SECOND TOUCHER. Ce motif tenait tant que le second toucher
  // SUFFISAIT ; Ethan, 06/09 : « rajouter un bouton attaquer sur la fiche car ça
  // bloque ». Le panneau occupe la moitié basse de l'écran, donc la cible est
  // SOUS lui dès qu'elle est au sud de la vue.
  //
  // ⚠⚠ CE QUE LA GARDE PERD, ELLE LE REPREND AILLEURS, ET ELLE NE SE RELÂCHE PAS.
  // La liste reste EXACTE — deux boutons nommés, aucun autre —, les TROIS autres
  // mots restent interdits, et le bouton doit passer par `entrerDansLaCible`,
  // c'est-à-dire par la garde `problemesDuRaid`. Un bouton qui appellerait
  // `surEntreeRaid` lui-même ferait tomber cette dernière assertion.
  //
  // ⚠ CE QUI RESTE DE L'AUTRE MOITIÉ : le panneau doit pouvoir REFUSER ET DIRE
  // POURQUOI. `problemesDuRaid` rend une liste de phrases justement pour ça.
  //
  // On lit la page DÉCOMMENTÉE — le commentaire du lot raconte justement cette
  // histoire et cite les mots.
  const html = lire('dist', 'index.html').replace(/<!--[\s\S]*?-->/g, '');
  const debut = html.indexOf('id="monde-panneau"');
  assert.ok(debut > 0, 'le panneau de site a disparu du balisage');
  const fin = html.indexOf('</div>', html.indexOf('id="monde-panneau-corps"'));
  const bloc = html.slice(debut, fin);
  const boutons = [...bloc.matchAll(/<button[^>]*id="([^"]*)"/g)].map((m) => m[1]);
  assert.deepEqual(boutons, ['monde-panneau-attaquer', 'monde-panneau-fermer'],
    `le panneau porte d'autres boutons que les deux nommés : ${boutons.join(', ')}`);

  // Et l'écran n'en fabrique pas non plus : il n'écrit que des lignes.
  const ecran = sansCommentaires(lire('src', 'ui', 'monde.js'));
  for (const interdit of ['Raider', 'Piller', 'Conquérir']) {
    assert.ok(!ecran.includes(interdit), `l'écran Monde promet « ${interdit} »`);
  }
  // ⚠ ET « ATTAQUER » NE REVIENT PAS PAR L'ÉCRAN : le libellé est dans le
  // BALISAGE, comme les deux autres boutons du panneau. L'écrire en JavaScript
  // mettrait le mot à deux endroits, et le premier renommage n'en changerait
  // qu'un.
  //
  // ⚠ ET LE MOTIF CHERCHE UN LITTÉRAL, PAS LE MOT NU : `panneauAttaquer` porte
  // « Attaquer » dans son propre nom, et un `includes` tombait dessus. C'est la
  // faute du `\b` ASCII de §6, vue sous un autre jour — un motif non borné
  // accuse un innocent.
  assert.ok(!/['"`]Attaquer/.test(ecran), 'l\'écran Monde écrit le libellé du bouton');
  assert.match(html, /id="monde-panneau-attaquer"[^>]*>Attaquer</, 'le libellé a quitté le balisage');

  // ⚠ ET IL PASSE PAR LA GARDE DU RAID, jamais directement par l'entrée : c'est
  // `entrerDansLaCible` qui interroge `problemesDuRaid` et écrit le refus.
  assert.match(ecran, /panneauAttaquer\.addEventListener\('click',[\s\S]{0,160}?entrerDansLaCible\(/,
    'le bouton Attaquer ne passe pas par `entrerDansLaCible`');

  // Falsifiable : le découpage doit bien voir le bouton qui EST là.
  assert.ok(bloc.includes('monde-panneau-fermer'), 'le découpage du bloc ne mesure rien');

  // ⚠ ET LE REFUS SE DIT. On entre au second toucher ; quand `problemesDuRaid`
  // s'y oppose, le panneau doit l'écrire, sinon le geste serait muet.
  assert.ok(html.includes('id="monde-panneau-refus"'),
    'le panneau ne peut plus dire pourquoi on n\'entre pas');
  assert.match(ecran, /problemesDuRaid/,
    'l\'écran Monde n\'interroge plus le garde du raid');
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

    [COTE_SPRITE, 'la grille de couture d\'un emblème'],
    [GEOGRAPHIE.niveauPlafond, 'le plafond de niveau'],
    [TERRAIN_CARTE.dalleCotePx, 'le côté d\'une dalle'],
    [TERRAIN_CARTE.dallesEnCache, 'la taille du cache'],
    // ⚠ `coteTuile` ET `pasSourcePx` ONT QUITTÉ CETTE LISTE au lot
    // SOL-SATELLITE : ils n'existent plus. Le fondu du pavage les remplace, et
    // il est du même genre — une longueur de `src/data/` que l'écran ne doit
    // pas recopier.
    [TERRAIN_CARTE.fonduSourcePx, 'la largeur du fondu'],
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

test('attente — une dalle qui manque se peint d\'un ton du sol, jamais en noir', () => {
  // ⚠⚠ ELLE NE PREND PLUS LA RANGÉE — lot SOL-SATELLITE, 05/09, sur demande
  // d'Ethan : « pas de fond ouvrage pour le moment ». Elle rendait l'ardoise en
  // haut de la carte et la terre cuite en bas, le sol basculant de camp à mesure
  // qu'on montait. Il n'y a plus qu'un sol, donc plus qu'une attente — et c'est
  // une assertion en MOINS sur la rampe de l'Ouvrage, déclarée ici.
  const teinte = teinteDAttente();
  assert.ok(TERRAIN_CARTE.rampes.joueur.includes(teinte), `teinte d'attente ${teinte}`);
  // C'est bien le MILIEU de la rampe, pas un bout : une attente au ton extrême
  // sauterait aux yeux quand la dalle arrive par-dessus.
  assert.equal(teinte, TERRAIN_CARTE.rampes.joueur[2]);
  // ⚠ ET ELLE NE PREND PLUS D'ARGUMENT : lui en passer un ne doit rien changer,
  // sans quoi un appelant resté sur l'ancienne forme croirait choisir un camp.
  assert.equal(teinteDAttente(1), teinte, 'la teinte d\'attente écoute encore un argument');
  assert.ok(DALLES_PAR_IMAGE >= 1 && DALLES_PAR_IMAGE <= 4,
    `${DALLES_PAR_IMAGE} dalles par image : l'à-coup n'est plus borné`);
});

test('sol — les huit planches s\'attendent, et rien ne se dessine sans elles', () => {
  // ⚠⚠ CE TEST REMPLACE CELUI DE L'APPARIEMENT DES COULEURS D'ATLAS. Il
  // vérifiait qu'`indicesDeTeinte` retrouvait le rang d'une couleur dans la
  // rampe, à l'exact puis au plus proche : la fonction est partie avec la
  // moulinette, et il n'y a plus d'image indexée à relire.
  const ecran = sansCommentaires(readFileSync(join(RACINE, 'src', 'ui', 'monde.js'), 'utf8'));
  // Les huit balises se demandent par leur rang, pas par une liste écrite.
  assert.match(ecran, /\$\(`sol-\$\{i \+ 1\}`\)/,
    'les huit planches ne se demandent plus par leur rang');
  // ⚠ ON ATTEND LA DERNIÈRE, PAS LA PREMIÈRE. Huit images se décodent dans un
  // ordre que rien ne garantit ; poser l'écouteur sur la première et se déclarer
  // prêt dessinerait la carte avec des blocs manquants.
  assert.match(ecran, /const manquante = images\.find/,
    'l\'écran ne cherche plus une planche manquante avant de se déclarer prêt');
  assert.ok(/restent && sols !== null/.test(ecran),
    'la boucle se relance alors qu\'une planche manque : elle tournerait à vide');
  assert.ok(/dalle === undefined && sols !== null/.test(ecran),
    'une dalle se calcule sans que les planches soient là');
  // ⚠ ET AUCUN PIXEL DU SOL NE TRANSITE PAR UN TABLEAU : `getImageData` sur les
  // planches coûterait 50 Mio, et c'est tout le motif de la réécriture.
  assert.ok(!/getImageData/.test(ecran),
    'l\'écran relit des pixels : les huit planches pèsent 50 Mio décodées');
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

test('page — l\'onglet Monde est vivant, l\'écran existe, et l\'atlas y est inliné UNE fois', () => {
  const html = lire('dist', 'index.html');
  for (const id of ['onglet-monde', 'ecran-monde', 'monde-canvas',
    'monde-champ', 'monde-outils', 'monde-recentrer',
    'monde-panneau', 'monde-panneau-titre', 'monde-panneau-fermer', 'monde-panneau-corps']) {
    assert.ok(html.includes(`id="${id}"`), `#${id} manque à la page`);
  }
  // ⚠⚠ `monde-atlas` A QUITTÉ CETTE LISTE — lot SOL-SATELLITE, 05/09. Il portait
  // l'atlas indexé du fond de carte ; les huit planches qui le remplacent ont
  // chacune leur balise, et c'est LEUR présence qu'on exige maintenant.
  for (let i = 1; i <= NOMS_DU_SOL.length; i += 1) {
    assert.ok(html.includes(`id="sol-${i}"`), `#sol-${i} manque à la page`);
  }
  assert.ok(!html.includes('id="monde-atlas"'), 'la balise de l\'atlas de terrain est revenue');
  // ⚠⚠ LES DEUX BOUTONS DE ZOOM SONT PARTIS LE 30/08, et cette garde le tient
  // par l'autre bout : Ethan a demandé « au doigt, pas de zoom fixe avec + − »,
  // donc leur RETOUR est ce qu'on refuse, pas leur absence.
  //
  // ⚠⚠ ET L'ÉCHELLE LES A REJOINTS LE 31/08. Ethan : « enlever les pixel/case du
  // haut », capture à l'appui, « en haut à droite ». C'était le `11 PX / CASE`
  // posé sur le coin de la carte. Ce test EXIGEAIT sa présence ; il exige
  // maintenant son absence, et il a eu raison de tomber au moment du retrait.
  for (const id of ['monde-zoom-moins', 'monde-zoom-plus', 'monde-echelle']) {
    assert.ok(!html.includes(`id="${id}"`), `#${id} est revenu sur le coin de la carte`);
  }

  // ⚠ MAIS LA GRANDEUR N'EST PAS PERDUE — « ce qui sort de l'écran ne sort pas du
  // jeu » (CLAUDE.md §6). Elle passe dans le `title` de la boîte d'outils, comme
  // la lettre de l'obstacle et le cadre de famille du jeton avant elle. Sans
  // cette moitié-ci, « retirer » se confondrait avec « supprimer ».
  const ecran = lire('src', 'ui', 'monde.js')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !l.trimStart().startsWith('//')).join('\n');
  assert.match(ecran, /\$\('monde-outils'\)\.title\s*=/,
    'l\'échelle a été supprimée au lieu d\'être déplacée dans le `title`');
  assert.ok(!/textContent\s*=\s*`\$\{Math\.round\(cssParCase\)\}/.test(ecran),
    'l\'échelle est redessinée à l\'écran');

  // L'onglet n'est plus mort.
  const onglet = html.match(/<button[^>]*id="onglet-monde"[^>]*>/)[0];
  assert.ok(!/disabled/.test(onglet), 'l\'onglet Monde est encore désactivé');
  assert.ok(!/class="[^"]*\bfutur\b/.test(onglet), 'l\'onglet Monde se dit encore « futur »');
  // L'écran part caché : le jeu s'ouvre sur la Base.
  assert.match(html, /<div id="ecran-monde" hidden>/);

  // ⚠ LE SOL EST DANS LE HTML, EN `data:`. C'est le prix de l'offline, qui n'est
  // pas négociable : une image à côté serait une référence externe et le build
  // sortirait en erreur. Les marqueurs du source ne doivent plus s'y trouver.
  assert.ok(!html.includes('%ATLAS_TERRAIN%'),
    'le marqueur de l\'atlas de fond de carte est revenu : il est parti au lot SOL-SATELLITE');
  for (let i = 1; i <= NOMS_DU_SOL.length; i += 1) {
    assert.ok(!html.includes(`%SOL_CARTE_${i}%`), `le marqueur %SOL_CARTE_${i}% n'a pas été remplacé`);
  }

  // ⚠⚠ ET CHACUNE DES HUIT N'Y EST QU'UNE FOIS. C'est l'assertion qui compte :
  // à 200 Kio de WebP la planche, une seule copie de trop coûterait à elle seule
  // plus que la marge sous la borne de T10. On identifie chaque planche par les
  // 64 premiers caractères de SON base64, qui la distinguent des sept autres.
  const debut = 'data:image/webp;base64,';
  const empreintes = new Set();
  for (let i = 1; i <= NOMS_DU_SOL.length; i += 1) {
    const balise = html.match(new RegExp(`<img[^>]*id="sol-${i}"[^>]*>`))[0];
    const adresse = balise.match(/src="([^"]*)"/)[1];
    assert.ok(adresse.startsWith(debut), `sol-${i} : « ${adresse.slice(0, 40)} » n'est pas un WebP inliné`);
    // ⚠ ET ELLE PÈSE CE QU'ELLE PÈSE. Le manifeste donne les octets du fichier ;
    // le base64 en fait quatre tiers, au rembourrage près. Sans cette moitié-ci,
    // un fichier vide passerait pour une planche.
    const octets = MANIFESTE_SOL.sols[`sol_carte_${i}`].octets;
    const attendu = Math.ceil(octets / 3) * 4;
    const utile = adresse.length - debut.length;
    assert.equal(utile, attendu, `sol-${i} : ${utile} caractères de base64 pour ${octets} octets`);
    const empreinte = adresse.slice(debut.length, debut.length + 64);
    assert.ok(!empreintes.has(empreinte), `deux planches partagent leurs 64 premiers caractères`);
    empreintes.add(empreinte);
    assert.equal(html.split(empreinte).length - 1, 1, `sol-${i} est inliné deux fois`);
  }
});

// ⚠⚠ `page — la taille déclarée de l'atlas est celle du fichier, à l'octet` A
// ÉTÉ RETIRÉ AU LOT SOL-SATELLITE (05/09), ET C'EST UNE ASSERTION EN MOINS,
// DÉCLARÉE. Il confrontait les attributs `width` et `height` de `<img
// id="monde-atlas">` à l'en-tête du PNG. Ces attributs existaient parce que le
// SOL DE LA BASE lisait la largeur de l'atlas de façon SYNCHRONE, avant tout
// décodage ; ce sol est le décor peint depuis le lot MUR-PEINT, et l'atlas
// lui-même est parti avec celui-ci. Plus rien ne lit la taille d'une image du
// sol : la géométrie du pavage vit dans `render/terrain.js`, qui est pur, et
// `SOL T2` confronte sa constante au manifeste de `tools/sols.py`. La
// confrontation n'a donc pas disparu — elle a changé de côté.

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
  baseCourante(etat).position = { rangee: 50, colonne: 16 };
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
  baseCourante(monte).position = { rangee: 50, colonne: 16 };
  for (const b of baseCourante(monte).disposition) b.niveau = 30;
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
  // toutes les assertions ci-dessus. Le compte est **43**, RECOMPTÉ et non
  // recopié : 9 `site_base_o_n*`, 9 `site_base_j_n*`, 9 `site_quartz_n*`,
  // 9 `site_scorie_n*` et les **7 POI**, qui n'ont qu'un dessin chacun.
  //
  // ⚠⚠ IL VALAIT 36 JUSQU'AU LOT POI, ET IL A EU RAISON DE MONTER — c'est un
  // RECALCUL, pas un assouplissement : `EMBLEMES_CARTE` porte sept types de plus,
  // le balayage les traverse, et le compte les compte. Un test qui serait resté à
  // 36 aurait exigé que les POI ne résolvent aucun sprite.
  //
  // ⚠ ET LES SEPT NE MULTIPLIENT NI PAR SAVEUR NI PAR PALIER, ce que ce compte
  // mesure de face : 36 + 7 et non 36 + 7 × 2 × 9. Un POI ignore son palier —
  // l'art n'en a produit qu'un par type — et sa saveur est `null`. Si l'un des
  // deux axes reparaissait, ce nombre-ci monterait à 162 et le dirait.
  //
  // ⚠⚠ IL VALAIT DÉJÀ 36 AVANT LE LOT DU 30/08, ET POUR UNE AUTRE RAISON. La
  // terminale partageait alors `site_base_o_n9` — elle n'ajoutait donc aucun nom
  // tout en étant balayée ; elle est maintenant HORS du balayage, et le total
  // n'avait pas bougé. Deux causes différentes pour le même nombre : c'est
  // exactement le genre de coïncidence qui ferait croire qu'un test n'a pas
  // bougé, d'où ce paragraphe et l'assertion de levée ci-dessous.
  assert.equal(noms.size, 43, `${noms.size} noms distincts composés`);
  assert.equal(SPRITES_POI.length, 7, 'les sept POI ne sont plus sept');
  for (const nom of SPRITES_POI) {
    assert.ok(noms.has(nom), `le sprite « ${nom} » n'est demandé par aucun type de site`);
  }
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
  baseCourante(etat).satellites.presents.push(
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

  // ⚠⚠ ET UNE ÉCHELLE INTERMÉDIAIRE EST ACCEPTÉE DEPUIS LE LOT ZOOM-CONTINU —
  // C'EST LA MOITIÉ QUI A CHANGÉ DE CIBLE. Cette ligne exigeait qu'un cran hors
  // de `ZOOM_CARTE.crans` LÈVE, ce qui était juste tant que la carte zoomait
  // par crans. Depuis le 04/09 l'échelle est un réel, et cette garde-là faisait
  // lever `dessinerGrosseBase` à toute échelle intermédiaire : pas un décalage
  // d'un pixel, mais une levée DANS LA BOUCLE DE DESSIN, qui vide tout l'écran
  // Monde — et la base terminale est à l'écran dès qu'on regarde le haut de la
  // carte. Mesuré avant correction : « cran 97.3 hors de 32, 64, 128, 256 ».
  const intermediaire = dessinerGrosseBase(3, { rangee: 10, colonne: 10 }, 97.3, { x: 0, y: 0 });
  assert.equal(intermediaire.cote, 97.3 * 3, 'la 3 × 3 ne suit pas une échelle intermédiaire');
  assert.ok(Number.isInteger(intermediaire.x) && Number.isInteger(intermediaire.y),
    'le coin d\'une 3 × 3 cesse d\'être entier à échelle intermédiaire');

  // ⚠ CE QUE LA GARDE DÉFEND N'A PAS CHANGÉ : « le dessin ne s'invente pas une
  // échelle ». La faute qui peut arriver aujourd'hui n'est plus un cran hors
  // table — il n'y en a plus — mais une échelle qui n'est pas un nombre : un
  // `NaN` rendrait `drawImage` MUET, sans lever et sans dessiner, ce qui est la
  // faute que ce module tout entier raconte.
  for (const absurde of [0, -5, NaN, Infinity]) {
    assert.throws(
      () => dessinerGrosseBase(3, { rangee: 10, colonne: 10 }, absurde, { x: 0, y: 0 }),
      /échelle/,
      `l'échelle ${absurde} passe : le dessin s'invente une échelle`,
    );
  }

  // ⚠⚠ ET LA GRILLE SOURCE EST MESURÉE CONTRE LA COUTURE, PLUS COMPARÉE À UN
  // NOMBRE ÉCRIT. Cette garde-ci disait, mot pour mot, « la grille d'emblème ne
  // correspond plus à la grille de couture » — et elle comparait à **64**, un
  // littéral, sans jamais lire la couture. Le lot GRILLE-128 a porté la couture
  // à 128 : la garde est restée VERTE pendant que la phrase qu'elle porte
  // devenait fausse, et la carte du monde a dessiné ses emblèmes dans la
  // mauvaise cellule pendant deux lots. C'est le défaut que `ZOOM_BASE_MULTIPLE_MAX`
  // avait déjà commis au même lot — une garde qui mesure un PROXY.
  //
  // Elle lit maintenant les deux côtés, et la grandeur qu'elle défend est
  // celle-ci : les cellules d'emblème doivent PAVER l'atlas cousu, sans en
  // laisser un bord ni en sortir.
  const geo = ATLAS[FAMILLE];
  const dernier = dessinerEmblemeDUneCase(
    { type: 'camp', saveur: 'richeScorie' }, PALIERS_EMBLEME.nombre, 0, 0, 32,
  );
  assert.equal(dernier.sCote, COTE_SPRITE,
    'la grille d\'emblème ne correspond plus à la grille de couture');
  const bordDroit = (geo.colonnes - 1) * dernier.sCote + dernier.sCote;
  const bordBas = (geo.rangees - 1) * dernier.sCote + dernier.sCote;
  assert.equal(bordDroit, geo.colonnes * COTE_SPRITE,
    'les cellules d\'emblème ne pavent pas la largeur de l\'atlas');
  assert.equal(bordBas, geo.rangees * COTE_SPRITE,
    'les cellules d\'emblème ne pavent pas la hauteur de l\'atlas');
  // Falsifiable de face : au côté d'AVANT le correctif, le pavage s'arrête à
  // la moitié de l'atlas — c'est exactement ce qui se dessinait à l'écran.
  assert.notEqual(geo.colonnes * 64, geo.colonnes * COTE_SPRITE,
    'le montage ne distingue plus l\'ancienne grille de la nouvelle');
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

test('carte — chaque entité porte son nom et son niveau, et le seuil suit la DENSITÉ', () => {
  // ⚠⚠ ETHAN, 03/09 : « rajouter un petit nom sur fond semi opaque + niveau en
  // dessous de chaque entité de la carte ».
  //
  // ⚠ LE NOM VIENT DE LA TABLE, IL N'EST PAS RECOPIÉ. `EMBLEMES_CARTE` est déjà
  // la source du titre du panneau de site : l'étiquette et le panneau ne peuvent
  // donc pas se contredire.
  for (const [type, embleme] of Object.entries(EMBLEMES_CARTE)) {
    const lignes = lignesDeLEtiquette({ type, niveau: 7 });
    assert.equal(lignes[0], embleme.nom, `${type} : l'étiquette n'écrit pas le nom de la table`);
    assert.match(lignes[1], /7/, `${type} : l'étiquette n'écrit pas le niveau`);
  }

  // ⚠⚠ LA BASE DU JOUEUR N'A PAS DE LIGNE DE NIVEAU, ET C'EST LA RÈGLE, PAS UN
  // OUBLI. Elle en a TROIS — bâtiments, défense, armée —, et aucun ne vient de
  // sa rangée : `sitesDeLaFenetre` lui pose `niveau: null` exprès. Y écrire le
  // niveau de la rangée serait la faute que `sim/carte.js` existe pour
  // empêcher, et que le test du panneau refuse déjà.
  const sienne = lignesDeLEtiquette({ type: 'baseJoueur', niveau: null });
  assert.equal(sienne.length, 1, 'la base du joueur s\'est vu inventer un niveau');
  assert.equal(sienne[0], EMBLEMES_CARTE.baseJoueur.nom);

  // Un type inconnu LÈVE : une étiquette muette serait un site sans nom, et
  // c'est un défaut qu'on doit voir.
  assert.throws(() => lignesDeLEtiquette({ type: 'inexistant', niveau: 1 }), RangeError);

  // ⚠⚠ ET LE SEUIL EST MESURÉ SUR CE QU'IL DÉFEND — LA DENSITÉ —, PAS SUR UN
  // PROXY. Un test qui figerait « cssMiniParCase === 64 » serait vert quelle que
  // soit la valeur qu'on y écrit. Celui-ci recompte les sites À L'ÉCRAN aux
  // quatre crans, et exige que le seuil tombe là où les plaques cessent de se
  // recouvrir.
  const dpr = 3;
  const canvas = { largeur: 360 * dpr, hauteur: (800 - 288) * dpr };
  const comptes = new Map();
  for (const cran of CRANS) {
    let pire = 0;
    for (const graine of [1, 2, 3]) {
      const etat = creerEtat(graine);
      const n = sitesDeLaFenetre(etat, fenetreVisible({
        x: (16 - 1) * cran - canvas.largeur / 2,
        y: (150 - 1) * cran - canvas.hauteur / 2,
        largeur: canvas.largeur, hauteur: canvas.hauteur, cran,
      })).length;
      pire = Math.max(pire, n);
    }
    comptes.set(cran, pire);
  }
  // Le montage mesure bien quelque chose : la densité DOIT s'effondrer avec le
  // zoom, sinon le seuil ne trierait rien.
  const parCran = CRANS.map((c) => comptes.get(c));
  for (let i = 1; i < parCran.length; i += 1) {
    assert.ok(parCran[i] < parCran[i - 1],
      `la densité ne baisse pas du cran ${CRANS[i - 1]} au ${CRANS[i]}`);
  }
  const ouverts = CRANS.filter((c) => c / dpr >= ETIQUETTE_CARTE.cssMiniParCase);
  assert.ok(ouverts.length >= 1, 'aucun cran n\'ouvre les étiquettes');
  const pireOuvert = Math.max(...ouverts.map((c) => comptes.get(c)));

  // ⚠⚠ CETTE GARDE A CHANGÉ DE CIBLE AU LOT ERGONOMIE, ET ELLE NE S'EST PAS
  // ASSOUPLIE — ELLE MESURE LE CONTRAIRE. Elle exigeait « au plus 20 sites
  // étiquetés à l'écran », parce que le SEUIL était alors le seul rempart contre
  // le recouvrement : il achetait la lisibilité en fermant les crans denses.
  // Ethan, 04/09 : « les noms des éléments de la carte persistent jusqu'à ce que
  // je dézoome, environ dix cases en largeur ». Le seuil descend donc à dix
  // cases, et ce qu'il laisse passer n'est plus borné à vingt.
  //
  // ⚠⚠ ET CE QUI SE PASSE ALORS EST MESURÉ À L'ÉCRAN, PAS DÉDUIT ICI. Relevé
  // dans Chromium en instrumentant `fillRect`, douze vues à chaque échelle : à
  // DIX cases de large, 510 plaques peintes et ZÉRO recouvrement — le seuil
  // seul suffirait encore ; à SIX cases, la police relative grandit avec
  // l'arrondi et 12 vues sur 12 portent un recouvrement, que `etiquettesRetenues`
  // retire toutes. La garde ne peut donc pas affirmer « ça se recouvre » : ce
  // qu'elle tient, c'est que le seuil a cessé d'être un plafond de densité, donc
  // qu'il ne peut plus être ce rempart-là. Le rempart est au DESSIN, et
  // `ERGO T9` à `T13` le tiennent.
  assert.ok(pireOuvert > 20,
    `${pireOuvert} sites au cran le plus ouvert : le seuil borne encore la densité, `
    + 'donc il n\'a pas été descendu');

  // ⚠ ET LE SEUIL SE MESURE DANS L'UNITÉ OÙ ETHAN L'A DONNÉ : des CASES sur la
  // largeur d'un téléphone. 360 px CSS de large, dix cases, donc 36 px par
  // case. Figer « cssMiniParCase === 36 » serait vert quelle que soit la valeur
  // écrite ; ceci tombe dans les deux sens — à 64 l'écran n'en montrerait que
  // 5,6, à 20 il en montrerait 18.
  const casesEnLargeur = 360 / ETIQUETTE_CARTE.cssMiniParCase;
  assert.ok(casesEnLargeur >= 9 && casesEnLargeur <= 11,
    `${casesEnLargeur.toFixed(1)} cases en largeur au seuil : ce n'est pas «\u00a0environ dix\u00a0»`);

  // ⚠ LES CRANS FERMÉS LE RESTENT POUR LA RAISON D'ORIGINE : sous le seuil, la
  // plaque n'est plus lisible, et il y en a bien trop.
  const meilleurFerme = Math.min(...CRANS
    .filter((c) => c / dpr < ETIQUETTE_CARTE.cssMiniParCase).map((c) => comptes.get(c)));
  assert.ok(meilleurFerme > 20,
    `le seuil ferme un cran qui ne portait que ${meilleurFerme} sites — il est trop haut`);

  // ⚠ LE SEUIL VIT DANS `src/data/`, ET L'ÉCRAN LE LIT. La première écriture le
  // posait dans `ui/monde.js`, et la garde « aucune constante de zoom en dur »
  // est tombée dessus : 64 est aussi un cran. Elle avait raison — un seuil
  // d'affichage est du calibrage (§4).
  const ecran = sansCommentaires(lire('src', 'ui', 'monde.js'));
  assert.match(ecran, /ETIQUETTE_CARTE\.cssMiniParCase/,
    'l\'écran ne lit pas le seuil dans les données');
  assert.match(ecran, /ETIQUETTE_CARTE\.encre/);

  // ⚠⚠ ET LE CONTOUR DE LA BASE SE DESSINE APRÈS LES EMBLÈMES, COMME LES
  // ÉTIQUETTES. C'est ce qui rend « coller la base » possible : l'emblème
  // occupe la case ENTIÈRE — `dessinerEmblemeDUneCase` rend `cote: taille` —,
  // donc un cadre posé sur ses bords et peint dessous est intégralement
  // recouvert. Remis avant, le contour disparaît de l'écran sans qu'aucune
  // autre garde ne bronche : mesuré, la falsification passait VERTE.
  //
  // ⚠ ON LIT L'ORDRE DANS LE CORPS DE `dessiner`, PAS DANS LE MODULE ENTIER.
  // Comparer deux `indexOf` sur tout le fichier ferait tomber la garde le jour
  // où une déclaration remonte — le dépôt l'a déjà payé au lot
  // GARNISON-ET-ARMÉE.
  const corpsDessiner = extraireFonction(ecran, 'dessiner');
  assert.ok(corpsDessiner.length > 200, 'la fonction `dessiner` est introuvable');
  const rangDe = (motif, quoi) => {
    const i = corpsDessiner.search(motif);
    assert.ok(i >= 0, `\`dessiner\` n'appelle plus ${quoi}`);
    return i;
  };
  const rangEmbleme = rangDe(/dessinerEmbleme\(/, 'les emblèmes');
  assert.ok(rangDe(/dessinerHalo\(/, 'le contour de la base') > rangEmbleme,
    'le contour de la base repasse sous les emblèmes : il redevient invisible');
  assert.ok(rangDe(/dessinerEtiquette\(/, 'les étiquettes') > rangEmbleme,
    'les étiquettes repassent sous les emblèmes');
  // La flèche, elle, était déjà après — on relève l'accord plutôt que de le
  // supposer, les trois ayant la même raison d'être au-dessus.
  assert.ok(rangDe(/dessinerFleche\(/, 'la flèche') > rangEmbleme);
  // ⚠ ET LES FRONTIÈRES RESTENT DESSOUS, elles : elles ceignent des cases qui
  // n'ont pas toutes un emblème, et couper le dessin qui dit ce qu'il y a là
  // est très exactement ce que le lot TERRITOIRE refuse.
  assert.ok(rangDe(/dessinerFrontieres\(/, 'les frontières') < rangEmbleme,
    'les frontières sont passées par-dessus les emblèmes');

  // ⚠⚠ ET LE FOND SEMI-OPAQUE EST LE SEUL `rgba` DU DÉPÔT, LU ET NON RETAPÉ.
  // La garde de palette de `banc.test.js` n'en tolère qu'un ; l'écran le prend
  // dans `render/scene.js` plutôt que d'en écrire une seconde copie.
  assert.match(ecran, /PALETTE\.ombrePortee/,
    'la plaque n\'emploie pas l\'ombre portée de la fiche');
  assert.doesNotMatch(ecran, /rgba\(/, 'l\'écran Monde retape un rgba au lieu de le lire');
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
  // ⚠⚠ CE GARDE-FOU A ÉTÉ RESSERRÉ AU LOT DÉPLACEMENT (02/09), PAS ASSOUPLI, ET
  // IL FAUT DIRE POURQUOI. Il interdisait `fillText` PARTOUT dans l'écran Monde.
  // Ce qu'Ethan a arbitré le 30/08, ce sont les LETTRES DES EMBLÈMES — la
  // désignation courte peinte sur chaque site au-delà d'un certain cran ; et il
  // a demandé le 02/09 que la flèche d'attaque « porte le coût d'attaque »,
  // c'est-à-dire un nombre, sur un trait qui n'existe que tant qu'un panneau est
  // ouvert. Les deux ne parlent pas de la même chose.
  //
  // ⚠ L'INTERDICTION RESTE TOTALE HORS DE `dessinerFleche`. Une lettre ne peut
  // donc pas revenir sur un emblème sans faire tomber ce test — c'est très
  // exactement ce que la version large protégeait, et rien n'en est perdu. Ce
  // qui change, c'est qu'elle NOMME son unique exception au lieu de l'interdire
  // en bloc.
  // ⚠⚠ ET IL A UNE SECONDE EXCEPTION DEPUIS LE 03/09, POUR LA MÊME RAISON QUE LA
  // PREMIÈRE : parce qu'Ethan a demandé du texte, et que ce texte-là n'est pas
  // la lettre. « rajouter un petit nom sur fond semi opaque + niveau en dessous
  // de chaque entité de la carte ». Ce qu'il avait fait retirer le 30/08 était
  // une CAPITALE peinte SUR l'emblème, qu'il fallait décoder ; ce qui entre est
  // un NOM en toutes lettres, posé SOUS la case, avec son niveau. Les deux ne
  // parlent pas de la même chose, exactement comme le coût de la flèche.
  //
  // ⚠⚠ ET LA PREMIÈRE EXCEPTION EST RETIRÉE AU LOT CARTE-A (04/09) : LA GARDE SE
  // RESSERRE, ELLE NE S'ASSOUPLIT PAS. Ethan : « ne pas afficher les points
  // d'attaque sur la flèche qui apparaît quand on clique sur une cible, mais en
  // gros dans l'onglet ». La flèche n'écrit plus de texte du tout — elle n'a
  // plus qu'un trait et une pointe —, donc l'exception qu'elle avait obtenue le
  // 02/09 n'a plus d'objet. Il en reste UNE, et l'interdiction couvre à nouveau
  // `dessinerFleche`.
  //
  // ⚠ ET LA BOUCLE EXIGE QUE CHAQUE EXCEPTION S'EN SERVE VRAIMENT. Une
  // exception qui n'écrirait plus rien serait une porte laissée ouverte pour
  // personne : c'est cette ligne-là qui est tombée quand la flèche a perdu son
  // cartouche, et c'est ce qu'on lui demande.
  const AVEC_TEXTE = ['dessinerEtiquette'];
  let horsExceptions = nu;
  for (const nom of AVEC_TEXTE) {
    const corps = extraireFonction(nu, nom);
    assert.ok(corps.length > 200, `la fonction \`${nom}\` est introuvable`);
    assert.match(corps, /fillText/, `\`${nom}\` n'écrit plus de texte`);
    horsExceptions = horsExceptions.replace(corps, '');
  }
  assert.doesNotMatch(horsExceptions, /fillText/,
    'l\'écran Monde dessine du texte hors de l\'étiquette');
  // ⚠ ET LA FLÈCHE EST NOMMÉMENT MUETTE. Sans cette ligne, remettre un
  // cartouche sur le trait serait attrapé par le balayage — mais le message
  // parlerait d'« un texte hors de l'étiquette » sans dire lequel.
  const fleche = extraireFonction(nu, 'dessinerFleche');
  assert.ok(fleche.length > 200, 'la fonction `dessinerFleche` est introuvable');
  assert.doesNotMatch(fleche, /fillText|measureText/,
    'la flèche écrit à nouveau le prix : il vit dans le panneau depuis CARTE-A');
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

// ---------------------------------------------------------------------------
// Le lot SPRITES-ET-ZOOM : le zoom se fait au doigt, et l'atlas n'entre qu'une fois
// ---------------------------------------------------------------------------

test('zoom — le pincement a remplacé les deux boutons, et il est CONTINU', () => {
  // ⚠⚠ ETHAN, 30/08 : « zoom carte et base : au doigt, pas de zoom fixe avec
  // + − ». Les deux boutons sont partis du balisage et de l'écran.
  const ecran = sansCommentaires(lire('src', 'ui', 'monde.js'));
  assert.doesNotMatch(ecran, /monde-zoom-(moins|plus)/,
    'l\'écran Monde parle encore de ses boutons de zoom');

  // ⚠⚠ CE TEST A CHANGÉ DE CIBLE AU LOT ZOOM-CONTINU, IL N'A PERDU AUCUNE
  // ASSERTION QUI TIENT ENCORE. Il exigeait ici trois choses — `cranIndex + pas`,
  // l'arrêt aux bouts de la table, et `SEUIL_PINCEMENT = Math.SQRT2` — au motif
  // qu'« un zoom continu recalculerait les dalles à chaque image, 19 ms pièce,
  // pour rendre du flou ». Ethan, 04/09 : « le zoom de la carte ne doit pas être
  // par cran ». Et le motif avait un trou : il confondait l'échelle
  // d'AFFICHAGE et l'échelle de RENDU. Les dalles se rendent toujours à un cran
  // de la table — `cranDeRendu` —, elles se POSENT à l'échelle réelle.
  // ⚠ LA CIBLE A CHANGÉ AU LOT CARTE-B, LA PROPRIÉTÉ NON : l'échelle de départ
  // se LIT dans la table. Elle valait `CRANS[CRAN_PAR_DEFAUT]`, elle vaut
  // `ECHELLE_MAX` — l'autre bout de la même table. Écrire 256 ici la ferait
  // tomber, ce qu'on lui demande.
  assert.match(ecran, /let echelle = ECHELLE_MAX;/,
    'l\'échelle n\'est plus une valeur réelle initialisée sur la table');
  assert.doesNotMatch(ecran, /let echelle = \d/,
    'l\'échelle de départ est écrite en dur');
  assert.match(ecran, /reglerEchelle\(echelle \* rapport, milieuDesDoigts\(deux\)\)/,
    'le pincement ne multiplie plus l\'échelle par le rapport des écarts');
  assert.match(ecran, /function reglerEchelle\(demandee, ancre = null\)/,
    '`reglerEchelle` ne prend plus de point d\'ancrage');

  // ⚠ ET LES BORNES SE LISENT DANS LA TABLE. Écrire 32 et 256 ici ferait la
  // seconde vérité que §4 de `CLAUDE.md` interdit.
  assert.match(ecran, /Math\.min\(ECHELLE_MAX, Math\.max\(ECHELLE_MIN, demandee\)\)/,
    'le pincement ne borne plus l\'échelle sur les bouts de la table');

  // ⚠⚠ L'ASSERTION DU SIMPLE AU DOUBLE RESTE, ET ELLE DÉFEND AUTRE CHOSE. Elle
  // justifiait le seuil √2 ; elle garantit désormais que le facteur
  // d'affichage tombe dans (0,5 ; 1] — donc qu'on RÉDUIT toujours, et qu'on ne
  // grossit jamais du pixel art. Des crans qui n'iraient plus du simple au
  // double casseraient cette borne-là.
  for (let i = 1; i < CRANS.length; i += 1) {
    assert.equal(CRANS[i] / CRANS[i - 1], 2,
      'les crans ne vont plus du simple au double : le facteur peut dépasser 1');
  }

  // ⚠ LE RAPPORT, PAS LA DIFFÉRENCE — même raison que sur la base.
  assert.match(ecran, /ecart \/ pincement\.ecart/,
    'le pincement de la carte ne se mesure plus en rapport');

  // ⚠⚠ ET LE ZOOM S'ANCRE SUR LE MILIEU DES DOIGTS, PAS SUR LE CENTRE DE
  // L'ÉCRAN. C'est la seule façon de faire grossir CE QU'ON REGARDE : ancré au
  // centre, la case visée fuit sous les doigts, et sur une carte de 300 rangées
  // on ne la retrouve pas.
  assert.match(ecran, /milieuDesDoigts\(deux\)/,
    'le pincement ne zoome plus sur le milieu des doigts');

  // ⚠ ET LES DOIGTS SE SUIVENT PAR IDENTIFIANT, pas par compteur : un doigt
  // parti hors de la dalle n'émet pas toujours `pointerup`, et la carte
  // cesserait de se promener jusqu'au rechargement.
  assert.match(ecran, /const doigts = new Map\(\)/, 'les doigts ne se suivent plus par identifiant');
  assert.match(ecran, /pointercancel[\s\S]{0,200}?doigts\.delete/,
    'un doigt annulé ne se retire plus de la liste');

  // ⚠ UN PINCEMENT N'OUVRE PAS DE PANNEAU. Sans ça, lever le second doigt sur
  // un site l'ouvrirait à la fin de chaque zoom.
  assert.match(ecran, /if \(pointeur !== null\) pointeur\.glisse = true/,
    'un pincement peut encore se terminer par un toucher de site');
});

test('atlas — la page les déclare UNE fois, et l\'image reçoit son adresse au démarrage', () => {
  // ⚠⚠ LE COUPLAGE A ÉTÉ RETOURNÉ LE 30/08, ET IL FAUT SAVOIR POURQUOI. Quatre
  // atlas servent des deux côtés : en fond CSS sur des éléments du DOM — le sol
  // de la base, les unités de l'Offense — et en `drawImage` sur un canevas, qui
  // exige un élément. Les déclarer aux DEUX endroits les inlinerait deux fois :
  // mesuré, 507 464 octets de base64 en trop, plus de sept fois la marge qui
  // reste sous la borne de T10.
  //
  // ⚠ ET LE SENS COMPTE. On aurait pu garder le `src` dans le balisage et faire
  // ÉCRIRE la variable par le JS : le build l'a refusé, à raison — une adresse
  // d'image assemblée à l'exécution est indistinguable d'une vraie référence
  // externe pour la garde offline, et la faire taire aurait été passer sous un
  // garde-fou en silence. Dans ce sens-ci, le JS ne fait que LIRE ce que le
  // build a écrit et vérifié.
  const source = sansCommentaires(lire('src', 'ui', 'session.js'));
  const balisage = lire('src', 'index.src.html');

  // ⚠⚠ LE MARQUEUR N'EST PLUS FORCÉMENT UN `%ATLAS_…%` — lot MUR-PEINT, 03/09.
  // Les huit décors de base entrent par `%FOND_…%` : un décor n'est pas un atlas
  // et n'en sera jamais un, `tools/atlas.py` ne cousant que des cellules carrées
  // d'un même côté. Ce que la garde défend n'a pas bougé d'un mot — la
  // déclaration est UNIQUE et la balise n'a pas de `src` —, seul le préfixe du
  // marqueur s'élargit. Il reste NOMMÉ : un `url()` quelconque ne passerait pas.
  for (const [id, variable] of Object.entries(ATLAS_DE_LA_PAGE)) {
    assert.match(balisage, new RegExp(`--${variable.slice(2)}:\\s*url\\('%(?:ATLAS|FOND)_[A-Z0-9_]+%'\\)`),
      `${variable} ne porte plus de marqueur dans la feuille`);
    const balise = balisage.match(new RegExp(`<img[^>]*id="${id}"[^>]*>`));
    assert.ok(balise, `l'image « ${id} » a disparu du balisage`);
    assert.ok(!/\bsrc=/.test(balise[0]),
      `l'image « ${id} » porte un \`src\` : son atlas est inliné deux fois`);
  }
  // ⚠ QUINZE DEPUIS LE LOT SOL-SATELLITE : seize la veille, moins `monde-atlas`.
  // Il servait l'atlas indexé du fond de carte depuis `--atlas-sol` ; les huit
  // planches qui le remplacent portent leur marqueur directement en `src`,
  // aucune règle de la feuille ne s'en servant. Une entrée sans variable en face
  // ferait lever `garnirLesAtlas`.
  //
  // ⚠ ET LE COMPTE SE DÉRIVE À MOITIÉ, pour qu'il ne mente pas tout seul : sept
  // atlas, plus autant d'entrées que la table des fonds en porte.
  assert.equal(Object.keys(ATLAS_DE_LA_PAGE).length, 7 + tousLesFonds().length);
  assert.ok(!('monde-atlas' in ATLAS_DE_LA_PAGE),
    'l\'atlas du fond de carte est revenu dans la table : il n\'a plus de variable');
  assert.equal(tousLesFonds().length, 8, 'les huit décors ne sont plus huit');
  assert.match(source, /export function garnirLesAtlas\(doc\)/, '`garnirLesAtlas` a disparu');
  assert.match(source, /garnirLesAtlas\(doc\);/, 'la session ne garnit plus les atlas au démarrage');

  // ⚠ ON LÈVE PLUTÔT QUE DE LAISSER UNE IMAGE VIDE : un atlas absent rendrait
  // le champ de bataille muet, et rien ne le dirait. C'est la règle
  // d'`executer` dans `render/canvas2d.js`.
  assert.match(source, /throw new RangeError\(`session : la variable/,
    'une variable vide passe maintenant en silence');

  // ⚠⚠ ET AUCUN `url\(` NE S'ÉCRIT DEPUIS LE JS. C'est ce qui garde la garde
  // offline entière : le JS déballe une valeur, il n'en fabrique pas.
  for (const nom of readdirSync(join(RACINE, 'src', 'ui')).filter((n) => n.endsWith('.js'))) {
    const code = sansCommentaires(lire('src', 'ui', nom));
    assert.doesNotMatch(code, /['"`]url\(/,
      `${nom} fabrique une adresse d'image : la garde offline ne peut plus la vérifier`);
  }
});

test('atlas — la valeur CSS se déballe, guillemets ou pas', () => {
  // Les navigateurs ne s'accordent pas sur les guillemets que rend
  // `getPropertyValue` : les trois formes doivent donner la même adresse.
  const attendu = 'data:image/png;base64,iVBORw0KGgo=';
  for (const forme of [
    `url("${attendu}")`,
    `url('${attendu}')`,
    `url(${attendu})`,
    `  url( "${attendu}" )  `,
  ]) {
    assert.equal(urlDeLaValeurCss(forme), attendu, `mal déballé : ${forme}`);
  }
  // Et ce qui n'est pas une adresse d'image rend une chaîne vide, que
  // `garnirLesAtlas` refuse — plutôt qu'un `src` absurde posé en silence.
  for (const rien of ['', 'none', undefined, null, 'url(']) {
    assert.equal(urlDeLaValeurCss(rien), '');
  }
});

// ---------------------------------------------------------------------------
// L'EMBLÈME D'UNE CASE — le défaut du 31/08, et les deux gardes qui le tiennent
// ---------------------------------------------------------------------------
//
// ⚠⚠ CE QUI S'EST PASSÉ. `ui/monde.js` lisait `cellule.x`, `cellule.y` et
// `cellule.cote` sur ce que rend `celluleDuSprite`, qui rend `colonne`,
// `rangee`, `colonnes` et `rangees` — des INDICES, jamais des pixels. Les trois
// valaient `undefined` ; `drawImage` avec un rectangle source non fini NE
// DESSINE RIEN ET NE LÈVE PAS. La carte s'ouvrait donc avec son fond et
// AUCUN emblème — ni les bases de l'Ouvrage, ni les camps, ni celle du joueur.
// Rapporté par Ethan (« pas de base sur la carte »), reproduit dans Chromium :
// 88 appels, 88 rectangles sources non finis.
//
// ⚠ AUCUN TEST NE POUVAIT LE VOIR, et c'est ça qu'on répare ici. Le calcul
// vivait dans l'écran, donc derrière le DOM que le dépôt ne sait pas monter. Il
// est descendu dans `render/embleme.js`, qui est pur — et les deux gardes
// ci-dessous mesurent les deux moitiés de la faute : que la primitive rende des
// NOMBRES FINIS, et que l'écran ne refasse plus le calcul lui-même.

test('emblème — la primitive d\'une case rend un rectangle source FINI', () => {
  // ⚠ LE MONTAGE PART DE L'ATLAS RÉEL, pas d'un site écrit à la main : c'est ce
  // qui fait qu'il couvre les quarante et un noms d'une case, et pas trois.
  const cotes = COTE_SPRITE;
  const cas = [];
  for (let palier = 1; palier <= PALIERS_EMBLEME.nombre; palier += 1) {
    cas.push({ site: { type: 'base', saveur: null }, palier });
    cas.push({ site: { type: 'baseJoueur', saveur: null }, palier });
    cas.push({ site: { type: 'camp', saveur: 'richeQuartz' }, palier });
    cas.push({ site: { type: 'avantPoste', saveur: 'richeScorie' }, palier });
  }
  assert.ok(cas.length >= 36, 'le montage doit couvrir les neuf paliers');

  for (const { site, palier } of cas) {
    const d = dessinerEmblemeDUneCase(site, palier, 12.7, -3.4, 32);
    // Le cœur de la garde : SIX nombres finis. C'est exactement ce qui manquait.
    for (const champ of ['sx', 'sy', 'sCote', 'x', 'y', 'cote']) {
      assert.ok(Number.isFinite(d[champ]),
        `${site.type} palier ${palier} : « ${champ} » vaut ${d[champ]}`);
    }
    // Et le rectangle source tombe DANS l'atlas, sur une cellule entière.
    assert.equal(d.sCote, cotes);
    assert.equal(d.sx % cotes, 0);
    assert.equal(d.sy % cotes, 0);
    assert.ok(d.sx >= 0 && d.sx < ATLAS[FAMILLE].colonnes * cotes);
    assert.ok(d.sy >= 0 && d.sy < ATLAS[FAMILLE].rangees * cotes);
    // La destination s'arrondit — un `drawImage` fractionnaire rend du flou.
    assert.ok(Number.isInteger(d.x) && Number.isInteger(d.y));
  }

  // ⚠ L'APPÂT. Sans lui, la garde passerait sur une primitive qui rendrait
  // n'importe quels nombres : on vérifie qu'elle DÉSIGNE bien la cellule du nom
  // qu'elle annonce, en refaisant le calcul depuis le rang dans l'atlas.
  const d = dessinerEmblemeDUneCase({ type: 'camp', saveur: 'richeScorie' }, 4, 0, 0, 64);
  const rang = ATLAS[FAMILLE].noms.indexOf('site_scorie_n4');
  assert.ok(rang >= 0);
  assert.equal(d.nom, 'site_scorie_n4');
  assert.equal(d.sx, (rang % ATLAS[FAMILLE].colonnes) * cotes);
  assert.equal(d.sy, Math.floor(rang / ATLAS[FAMILLE].colonnes) * cotes);
});

test('emblème — l\'écran ne recalcule plus la cellule lui-même', () => {
  const source = lire('src', 'ui', 'monde.js');
  // ⚠ ON LIT LA SOURCE DÉCOMMENTÉE. Le commentaire qui raconte le défaut nomme
  // `celluleDuSprite` et `cellule.x` : une garde qui lirait ce qu'on a écrit à
  // son sujet ne garderait rien. C'est la leçon de `viewport-fit=cover` et de
  // `MENTION_SATURE` (CLAUDE.md §6), payée deux fois déjà.
  const nue = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !l.trimStart().startsWith('//')).join('\n');

  assert.ok(!/celluleDuSprite/.test(nue),
    'monde.js ne doit plus appeler celluleDuSprite : la géométrie vient de render/embleme.js');
  assert.ok(!/cellule\.(x|y|cote)\b/.test(nue),
    'monde.js lit un champ de pixels sur une cellule, qui n\'en porte pas');
  assert.ok(/dessinerEmblemeDUneCase/.test(nue),
    'monde.js doit demander sa géométrie à render/embleme.js');

  // L'appât : le motif reconnaît-il encore la vraie faute ?
  const faute = 'const c = celluleDuSprite(F, n); ctx.drawImage(i, c.x, c.y, c.cote, c.cote);';
  assert.ok(/celluleDuSprite/.test(faute) && /cellule\.(x|y|cote)\b/.test(faute.replace(/\bc\./g, 'cellule.')));
});

test('monde — un bouton ramène toujours à la base du joueur', () => {
  // ⚠⚠ ETHAN, 31/08 : « toujours une possibilité de revenir sur sa base quand on
  // se balade sur la carte ». Le motif d'origine est PÉRIMÉ depuis le lot
  // CARTE-B : il disait que « la vue ne se recentre qu'à la PREMIÈRE
  // ouverture », donc qu'il fallait une porte de sortie, faute de quoi on
  // restait perdu sur 300 rangées. La carte se recentre désormais à CHAQUE
  // ouverture — Ethan, 06/09. Le bouton reste, et son emploi s'est déplacé :
  // il sert maintenant DANS une visite, à revenir de la balade sans quitter
  // l'écran. Les assertions ci-dessous ne bougent pas d'un caractère.
  const html = lire('dist', 'index.html');
  assert.match(html, /id="monde-recentrer"/,
    'le bouton de retour à la base a disparu du livrable');

  const ecran = lire('src', 'ui', 'monde.js')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !l.trimStart().startsWith('//')).join('\n');
  const debut = ecran.indexOf("$('monde-recentrer')");
  assert.ok(debut > 0, 'rien ne câble le bouton de retour');
  const bloc = ecran.slice(debut, debut + 320);
  // ⚠ LE MOTIF SUIT LE CHEMIN D'ACCÈS, IL NE S'ÉLARGIT PAS. Depuis le lot
  // BASES-0 la position vit dans la base ; `centrerSur(...)` avec n'importe
  // quel argument passerait, `centrerSur(baseCourante(etatCourant).position)`
  // nomme toujours exactement la position du joueur.
  assert.match(bloc, /centrerSur\(baseCourante\(etatCourant\)\.position\)/,
    'le bouton doit recentrer sur la position du joueur, pas sur autre chose');
  // ⚠ IL NE TOUCHE PAS AU ZOOM : ramener aussi le cran ferait deux gestes en un
  // et retirerait au joueur celui qu'il venait de choisir.
  assert.ok(!/changerDeCran|cranIndex/.test(bloc),
    'le retour à la base ne doit pas changer le cran de zoom');

  // ⚠ ET IL N'AJOUTE PAS DE BARRE À HAUTEUR FIXE. Le chrome de l'écran est déjà
  // à son plafond ; le bouton se POSE sur la carte, comme le panneau et
  // l'échelle. La règle CSS de la boîte qui le porte doit rester `absolute`.
  const feuille = html.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const outils = feuille.match(/#monde-outils\s*\{([^}]*)\}/);
  assert.ok(outils, '#monde-outils n\'a plus de règle');
  assert.match(outils[1], /position:\s*absolute/,
    'la boîte d\'outils de la carte est passée dans le flux : elle mange la carte');
});

/**
 * Le corps d'une fonction nommée, extrait d'une source décommentée.
 *
 * ⚠ ELLE COMPTE LES ACCOLADES, elle ne cherche pas une accolade fermante en
 * colonne 0 : `dessinerFleche` est imbriquée dans `initialiserEcranMonde`, donc
 * indentée, et un motif de fin de ligne y prendrait la première fonction voisine.
 */
function extraireFonction(source, nom) {
  const debut = source.indexOf(`function ${nom}(`);
  if (debut === -1) return '';
  const ouvrante = source.indexOf('{', debut);
  let profondeur = 0;
  for (let i = ouvrante; i < source.length; i += 1) {
    if (source[i] === '{') profondeur += 1;
    else if (source[i] === '}') {
      profondeur -= 1;
      if (profondeur === 0) return source.slice(debut, i + 1);
    }
  }
  return '';
}

// ---------------------------------------------------------------------------
// Le zoom continu — lot ZOOM-CONTINU, 04/09
//
// ⚠⚠ ETHAN, 04/09 : « le zoom de la carte ne doit pas être par cran », puis
// « on met ça en stand-by et on fait le zoom continu ». Ce que ce bloc mesure
// est la distinction qui rend le continu payable : l'échelle d'AFFICHAGE est un
// réel, l'échelle de RENDU reste dans la table, et le facteur entre les deux ne
// dépasse jamais 1 — on ne grossit jamais du pixel art.
// ---------------------------------------------------------------------------

test('ZOOM T1 — un cran exact se rend à lui-même, et son facteur vaut 1', () => {
  // ⚠ AUX CRANS, LE ZOOM CONTINU DOIT ÊTRE L'ANCIEN, AU BIT PRÈS. C'est ce qui
  // garantit que le lot ne dégrade rien là où la carte était déjà nette : à
  // facteur 1 le `drawImage` est un 1:1 et ne rééchantillonne rien.
  for (const cran of CRANS) {
    assert.equal(cranDeRendu(cran), cran, `le cran ${cran} ne se rend pas à lui-même`);
    assert.equal(facteurDAffichage(cran), 1, `le cran ${cran} n'a pas un facteur de 1`);
  }
  // Falsifiable : un « plus petit cran STRICTEMENT supérieur » rendrait 64 ici.
  assert.notEqual(cranDeRendu(CRANS[0]), CRANS[1],
    'un cran exact monte au cran suivant : le rendu double pour rien');
});

test('ZOOM T2 — une échelle à peine au-dessus d\'un cran monte au suivant', () => {
  // ⚠⚠ LE PLUS PETIT CRAN ≥ L'ÉCHELLE, ET JAMAIS LE PLUS PROCHE. Le plus proche
  // rendrait 64 pour 65, donc un facteur de 1,016 — c'est-à-dire un
  // AGRANDISSEMENT de pixel art, le « gros carré moche » du 30/08.
  assert.equal(cranDeRendu(65), 128, 'une échelle de 65 se rend à 64 : on grossit');
  assert.ok(facteurDAffichage(65) < 1, 'le facteur de 65 dépasse 1');
  // Et juste au-dessus du plus petit cran, de même.
  assert.equal(cranDeRendu(ECHELLE_MIN + 0.5), CRANS[1],
    'une échelle à peine au-dessus du plus petit cran reste au plus petit');
});

test('ZOOM T3 — sur toute la course, le facteur reste dans (0,5 ; 1]', () => {
  // ⚠⚠ C'EST L'INVARIANT DU LOT : ON RÉDUIT TOUJOURS, ON NE GROSSIT JAMAIS. Il
  // tient parce que les crans vont du simple au double — la borne basse est
  // ouverte, la haute fermée et atteinte aux quatre crans exacts.
  let pire = 1;
  for (let k = 0; k < 100; k += 1) {
    const echelle = ECHELLE_MIN + ((ECHELLE_MAX - ECHELLE_MIN) * k) / 99;
    const facteur = facteurDAffichage(echelle);
    assert.ok(facteur > 0.5, `échelle ${echelle} : facteur ${facteur} ≤ 0,5`);
    assert.ok(facteur <= 1, `échelle ${echelle} : facteur ${facteur} > 1 — on grossit`);
    assert.ok(CRANS.includes(cranDeRendu(echelle)),
      `échelle ${echelle} : le cran de rendu n'est pas dans la table`);
    pire = Math.min(pire, facteur);
  }
  // Le montage mesure bien quelque chose : il descend franchement sous 1.
  assert.ok(pire < 0.55, `le pire facteur vaut ${pire} : le balayage n'atteint pas la borne basse`);
});

test('ZOOM T4 — une échelle hors course LÈVE, elle ne se replie pas', () => {
  // ⚠ UN REPLI SILENCIEUX FERAIT DESSINER LA CARTE À UNE ÉCHELLE QUE PERSONNE
  // N'A DEMANDÉE. Le pincement borne avant d'arriver ici : ce qui passe quand
  // même est un fait de PROGRAMME.
  for (const absurde of [16, 400, 0, -32, NaN, Infinity]) {
    assert.throws(() => cranDeRendu(absurde), /échelle/,
      `l'échelle ${absurde} passe : le rendu s'invente un cran`);
  }
  // Et les deux bouts EXACTS sont acceptés — une borne fermée des deux côtés.
  assert.equal(cranDeRendu(ECHELLE_MIN), ECHELLE_MIN);
  assert.equal(cranDeRendu(ECHELLE_MAX), ECHELLE_MAX);
  // Les bornes se LISENT dans la table : elles ne sont pas une seconde vérité.
  assert.equal(ECHELLE_MIN, CRANS[0], 'ECHELLE_MIN a été recopiée au lieu d\'être lue');
  assert.equal(ECHELLE_MAX, CRANS[CRANS.length - 1], 'ECHELLE_MAX a été recopiée');
});

test('ZOOM T5 — deux dalles voisines partagent leur bord : ni trou ni recouvrement', () => {
  // ⚠⚠ C'EST LE TEST QUI COMPTE, ET IL SE CALCULE. À facteur fractionnaire une
  // dalle mesure `cote × facteur` pixels, qui n'est pas entier : arrondir
  // séparément la position ET la largeur laisse un pixel de fond entre deux
  // voisines une image sur deux — une grille noire sur toute la carte. Une
  // capture peut rater une couture d'un pixel ; l'arithmétique ne la rate pas.
  const cote = TERRAIN_CARTE.dalleCotePx;
  let fractionnaires = 0;
  for (let f = 0; f < 200; f += 1) {
    const echelle = ECHELLE_MIN + ((ECHELLE_MAX - ECHELLE_MIN) * f) / 199;
    const coteAffiche = cote * facteurDAffichage(echelle);
    if (!Number.isInteger(coteAffiche)) fractionnaires += 1;
    // Une origine fractionnaire elle aussi : le défilement ne tombe pas rond.
    for (const origine of [0, 1, 137, -58, 4096]) {
      // ⚠ ON REJOUE LA BOUCLE DE DESSIN, ON NE COMPARE PAS UNE EXPRESSION À
      // ELLE-MÊME. Chaque dalle est posée en `(x0, largeur)` exactement comme
      // `dessinerFond` le fait ; ce qu'on vérifie est que le bord DROIT de la
      // dalle `i` — c'est-à-dire `x0 + largeur`, ce que `drawImage` a
      // réellement couvert — retombe sur le bord GAUCHE de la `i + 1`.
      const poses = [];
      for (let i = 0; i < 20; i += 1) {
        const x0 = bordDeDalle(i, coteAffiche, origine);
        const x1 = bordDeDalle(i + 1, coteAffiche, origine);
        poses.push({ x0, largeur: x1 - x0 });
      }
      for (let i = 0; i < poses.length - 1; i += 1) {
        assert.equal(poses[i].x0 + poses[i].largeur, poses[i + 1].x0,
          `facteur ${coteAffiche / cote}, origine ${origine} : la dalle ${i} laisse `
          + `${poses[i + 1].x0 - (poses[i].x0 + poses[i].largeur)} px de couture`);
        // Et les bords sont ENTIERS — un `drawImage` fractionnaire rééchantillonne.
        assert.ok(Number.isInteger(poses[i].x0) && Number.isInteger(poses[i].largeur),
          `bord ou largeur non entiers à l'indice ${i}`);
        // Aucune dalle ne se retourne : les largeurs sont positives.
        assert.ok(poses[i].largeur > 0, `largeur ${poses[i].largeur} à l'indice ${i}`);
      }
    }
  }

  // ⚠⚠ ET LE MONTAGE DISCRIMINE — MESURÉ, PAS SUPPOSÉ. La façon de faire
  // naïve, celle qui arrondit la position ET la largeur chacune de son côté,
  // DOIT laisser des coutures ; sans cette contre-épreuve, « les bords se
  // partagent » pourrait être vrai d'à peu près n'importe quel code.
  let facteursAvecCouture = 0;
  let pireCouture = 0;
  for (let f = 0; f < 200; f += 1) {
    const echelle = ECHELLE_MIN + ((ECHELLE_MAX - ECHELLE_MIN) * f) / 199;
    const coteNaif = cote * facteurDAffichage(echelle);
    let coutures = 0;
    for (let i = 0; i < 200; i += 1) {
      const x0 = Math.round(i * coteNaif - 137);
      const suivant = Math.round((i + 1) * coteNaif - 137);
      if (x0 + Math.round(coteNaif) !== suivant) coutures += 1;
    }
    if (coutures > 0) facteursAvecCouture += 1;
    pireCouture = Math.max(pireCouture, coutures);
  }
  // Mesuré au lot : 198 facteurs sur 200 laissent au moins une couture, médiane
  // 39 sur 200 dalles, pire cas 99 — c'est-à-dire une dalle sur deux. Les deux
  // facteurs indemnes sont les crans EXACTS que le balayage touche, où la
  // largeur d'affichage est entière et où le défaut ne peut pas exister.
  assert.ok(facteursAvecCouture >= 190,
    `la pose naïve n'échoue que sur ${facteursAvecCouture} facteurs sur 200 : le test ne mesure rien`);
  assert.ok(pireCouture >= 50,
    `la pose naïve ne laisse au pire que ${pireCouture} coutures sur 200 dalles`);

  // ⚠⚠ ET CETTE FALSIFICATION-LÀ N'A PAS MORDU AU PREMIER RELEVÉ — LA GARDE
  // QUI SUIT EST NÉE DE LÀ. Remplacer, DANS `dessinerFond`, la largeur
  // `x1 - x0` par `Math.round(coteAffiche)` — c'est-à-dire commettre pour de
  // bon le défaut que tout ce test existe pour empêcher — laissait la suite
  // ENTIÈREMENT VERTE : 49 pass / 0 fail, mesuré. L'arithmétique ci-dessus ne
  // regarde que `bordDeDalle` ; le SITE DE POSE, lui, est hors de portée des
  // tests faute de DOM (§3 de `CLAUDE.md`), et rien ne le lisait. Même leçon
  // que `SON T24`, qui lit les trois lignes d'`avancerDUnTick` parce qu'un
  // appel juste peut avoir un corps vide.
  const corps = sansCommentaires(lire('src', 'ui', 'monde.js'))
    .split('function dessinerFond(')[1]
    .split('\n  }')[0];
  assert.match(corps, /const x0 = bordDeDalle\(i, coteAffiche, ox\);/,
    '`dessinerFond` ne prend plus son bord gauche dans `bordDeDalle`');
  assert.match(corps, /const x1 = bordDeDalle\(i \+ 1, coteAffiche, ox\);/,
    '`dessinerFond` ne prend plus son bord droit dans `bordDeDalle`');
  assert.match(corps, /const y0 = bordDeDalle\(j, coteAffiche, oy\);/,
    '`dessinerFond` ne prend plus son bord haut dans `bordDeDalle`');
  assert.match(corps, /const y1 = bordDeDalle\(j \+ 1, coteAffiche, oy\);/,
    '`dessinerFond` ne prend plus son bord bas dans `bordDeDalle`');
  // ⚠ LA LARGEUR SE DÉDUIT DE DEUX BORDS, ELLE NE S'ARRONDIT JAMAIS. Les deux
  // sites de pose — la dalle et l'aplat d'attente — sont lus, parce qu'une
  // couture sur l'attente est une couture quand même.
  assert.match(corps, /ctx\.drawImage\(dalle, x0, y0, x1 - x0, y1 - y0\);/,
    '`dessinerFond` pose sa dalle autrement qu'
    + ' entre ses deux bords : les coutures reviennent');
  assert.match(corps, /ctx\.fillRect\(x0, y0, x1 - x0, y1 - y0\);/,
    'l\'aplat d\'attente ne se pose plus entre ses deux bords');
  assert.ok(!/Math\.round\(coteAffiche\)/.test(corps),
    '`dessinerFond` arrondit la largeur d\'une dalle : c\'est le défaut même');
  // ⚠ LE MONTAGE MESURE BIEN LE CAS DIFFICILE : la plupart des facteurs
  // balayés donnent une largeur de dalle NON entière. Sans ça, il ne
  // vérifierait que les quatre crans, où le problème n'existe pas.
  assert.ok(fractionnaires > 150,
    `${fractionnaires} facteurs fractionnaires sur 200 : le montage ne mesure pas les coutures`);
});

test('ZOOM T6 — la somme des largeurs vaut la largeur totale, à l\'unité près', () => {
  // ⚠ C'EST L'AUTRE MOITIÉ DE T5 : des bords partagés pourraient dériver
  // ensemble et rendre une bande plus étroite que la carte. La somme des
  // largeurs de N dalles doit valoir la largeur totale arrondie.
  const cote = TERRAIN_CARTE.dalleCotePx;
  for (let f = 0; f < 200; f += 1) {
    const echelle = ECHELLE_MIN + ((ECHELLE_MAX - ECHELLE_MIN) * f) / 199;
    const coteAffiche = cote * facteurDAffichage(echelle);
    for (const origine of [0, 137, -58]) {
      const n = 20;
      let somme = 0;
      for (let i = 0; i < n; i += 1) {
        somme += bordDeDalle(i + 1, coteAffiche, origine) - bordDeDalle(i, coteAffiche, origine);
      }
      const attendue = bordDeDalle(n, coteAffiche, origine) - bordDeDalle(0, coteAffiche, origine);
      assert.equal(somme, attendue,
        `facteur ${coteAffiche / cote} : ${n} dalles couvrent ${somme} au lieu de ${attendue}`);
      // Et ce total ne s'écarte jamais de plus d'un pixel de la vérité réelle.
      assert.ok(Math.abs(attendue - n * coteAffiche) <= 1,
        `facteur ${coteAffiche / cote} : ${attendue} contre ${n * coteAffiche} attendus`);
    }
  }
});

test('ZOOM T7 — la case sous l\'ancre ne bouge pas quand l\'échelle change', () => {
  // ⚠⚠ SANS ÇA, LA CASE VISÉE FUIT SOUS LES DOIGTS. C'est ce que l'ancrage au
  // milieu des deux doigts existe pour empêcher, et sur une carte de 300
  // rangées on ne retrouve pas ce qu'on a perdu de vue.
  const ancre = { x: 317, y: 209 };
  const vue = { x: 1234.5, y: 5678.25 };
  for (const depart of [ECHELLE_MIN, 47.3, 64, 97.7, 180, ECHELLE_MAX / 1.3]) {
    const arrivee = bornerEchelle(depart * 1.3);
    const avant = {
      colonne: (vue.x + ancre.x) / depart,
      rangee: (vue.y + ancre.y) / depart,
    };
    const neuve = vueApresEchelle(vue, depart, arrivee, ancre);
    const apres = {
      colonne: (neuve.x + ancre.x) / arrivee,
      rangee: (neuve.y + ancre.y) / arrivee,
    };
    assert.ok(Math.abs(apres.colonne - avant.colonne) < 0.01,
      `échelle ${depart} : la colonne sous l'ancre passe de ${avant.colonne} à ${apres.colonne}`);
    assert.ok(Math.abs(apres.rangee - avant.rangee) < 0.01,
      `échelle ${depart} : la rangée sous l'ancre passe de ${avant.rangee} à ${apres.rangee}`);
  }
  // Falsifiable : ancrer au centre plutôt qu'aux doigts DÉPLACE la case visée.
  const centre = { x: 0, y: 0 };
  const fautif = vueApresEchelle(vue, 64, 83.2, centre);
  assert.ok(Math.abs((fautif.x + ancre.x) / 83.2 - (vue.x + ancre.x) / 64) > 0.01,
    'le montage ne distingue pas une ancre juste d\'une ancre fausse');
});

test('ZOOM T8 — à la butée, l\'échelle ne dépasse pas et la vue ne saute pas', () => {
  // ⚠ LA BUTÉE EST FRANCHE : une échelle déjà collée à un bout, multipliée puis
  // re-bornée, reste où elle est. Ce qui ne doit pas arriver, c'est que la VUE
  // saute alors que l'échelle n'a pas bougé.
  assert.equal(bornerEchelle(ECHELLE_MAX * 4), ECHELLE_MAX, 'la butée haute cède');
  assert.equal(bornerEchelle(ECHELLE_MIN / 4), ECHELLE_MIN, 'la butée basse cède');
  assert.equal(bornerEchelle(ECHELLE_MAX), ECHELLE_MAX);

  const ancre = { x: 200, y: 150 };
  const vue = { x: 900.75, y: 400.5 };
  // Une échelle inchangée laisse la vue EXACTEMENT où elle est : c'est ce qui
  // fait que pincer au-delà de la butée ne fait rien bouger du tout.
  const immobile = vueApresEchelle(vue, ECHELLE_MAX, bornerEchelle(ECHELLE_MAX * 2), ancre);
  assert.equal(immobile.x, vue.x, 'la vue saute alors que l\'échelle est à la butée');
  assert.equal(immobile.y, vue.y, 'la vue saute alors que l\'échelle est à la butée');

  // Et le cran de rendu reste défini aux deux bouts : `cranDeRendu` ne lève pas
  // sur ce que `bornerEchelle` laisse passer. Les deux doivent s'accorder,
  // sinon la butée produirait une levée dans la boucle de dessin.
  for (const demandee of [-1e9, 0, ECHELLE_MIN / 2, ECHELLE_MAX * 9, 1e9]) {
    assert.doesNotThrow(() => cranDeRendu(bornerEchelle(demandee)),
      `l'échelle bornée de ${demandee} fait lever le rendu`);
  }
});

test('ZOOM T9 — à échelle fractionnaire, le défilement reste un nombre', () => {
  // ⚠ AUCUN `NaN` NE DOIT SORTIR DE LÀ. Un défilement `NaN` se propage à
  // l'origine, donc à tous les `drawImage` : la carte disparaîtrait sans lever.
  const VUE = 1080;
  for (let f = 0; f < 60; f += 1) {
    const echelle = ECHELLE_MIN + ((ECHELLE_MAX - ECHELLE_MIN) * f) / 59;
    const taille = dimensionsDeLaCarte(echelle);
    for (const demande of [-5000, 0, 123.75, 1e9]) {
      const x = bornerDefilement(demande, taille.largeur, VUE);
      const y = bornerDefilement(demande, taille.hauteur, VUE);
      assert.ok(Number.isFinite(x) && Number.isFinite(y),
        `échelle ${echelle}, demande ${demande} : défilement non fini`);
      assert.ok(x <= Math.max(0, taille.largeur - VUE),
        `échelle ${echelle} : le défilement dépasse le bord de la carte`);
    }
  }

  // ⚠⚠ ÉCART DÉCLARÉ AU BRIEF, QUI ATTENDAIT « PAS DE VUE NÉGATIVE ». Une vue
  // NÉGATIVE est ici le comportement VOULU et déjà testé plus haut : quand la
  // carte tient entière dans le canevas, `bornerDefilement` la CENTRE plutôt
  // que de la coller à gauche, et centrer se dit par un décalage négatif.
  // L'exiger positif casserait une décision du lot ÉCRAN-CARTE. Ce qui se
  // vérifie ici est donc la valeur exacte du centrage, à échelle fractionnaire.
  const etroite = dimensionsDeLaCarte(ECHELLE_MIN);
  assert.ok(etroite.largeur < VUE, 'le montage ne mesure pas le cas « plus étroite que le canevas »');
  assert.equal(bornerDefilement(0, etroite.largeur, VUE), -(VUE - etroite.largeur) / 2,
    'une carte plus étroite que le canevas ne se centre plus');
});

test('ZOOM T10 — le mécanisme par crans a disparu de l\'écran', () => {
  // ⚠ UN INDICE DE CRAN GARDÉ « AU CAS OÙ » À CÔTÉ D'UNE ÉCHELLE RÉELLE
  // DIVERGERAIT AU PREMIER PINCEMENT. Le grep de fin de lot ne doit plus le
  // trouver — ni lui, ni le seuil √2, ni la fonction qui les employait.
  const ecran = sansCommentaires(lire('src', 'ui', 'monde.js'));
  for (const reliquat of ['cranIndex', 'SEUIL_PINCEMENT', 'changerDeCran']) {
    assert.ok(!ecran.includes(reliquat),
      `l'écran Monde porte encore « ${reliquat} » : deux mécanismes de zoom cohabitent`);
  }
  // Et il porte bien le neuf : sans ça, un écran vide passerait aussi.
  for (const attendu of ['cranDeRendu', 'facteurDAffichage', 'reglerEchelle', 'bordDeDalle']) {
    assert.ok(ecran.includes(attendu), `l'écran Monde n'emploie pas ${attendu}`);
  }
  // ⚠ ET LA GARDE LIT LA SOURCE DÉCOMMENTÉE — le fichier NOMME `cranIndex` dans
  // le commentaire qui explique sa disparition, et une garde qui lit ce qu'on a
  // écrit à son sujet ne garde rien. C'est la faute que le dépôt a commise cinq
  // fois, de `viewport-fit=cover` à `render/contour.js`.
  assert.ok(lire('src', 'ui', 'monde.js').includes('cranIndex'),
    'le commentaire qui explique la disparition de `cranIndex` est parti aussi');
});

test('ZOOM T11 — le cache ne se vide plus, il porte le cran dans sa clé', () => {
  // ⚠⚠ C'ÉTAIT LA LIGNE QUI RENDAIT LE ZOOM CONTINU IMPOSSIBLE. `cache.vider()`
  // au changement de cran forçait 19 ms par dalle à chaque image d'un
  // pincement. Elle part parce que `cleDeDalle` porte désormais le cran : deux
  // crans cohabitent sans se confondre, et l'éviction s'en charge.
  const ecran = sansCommentaires(lire('src', 'ui', 'monde.js'));
  assert.ok(!ecran.includes('cache.vider()'),
    'l\'écran Monde vide encore son cache : le zoom continu recalcule tout à chaque image');
  // ⚠ LA MÉTHODE, ELLE, RESTE — et la garde ne compte pas sa propre définition.
  // C'est la faute « une garde a compté sa propre définition », vue cinq fois.
  assert.match(ecran, /vider\(\) \{ entrees\.clear\(\); \}/,
    'le cache a perdu sa méthode `vider` : `monde.test.js` l\'emploie');
  // Falsifiable : le motif attrape bien un vrai appel.
  assert.ok('  cache.vider();'.includes('cache.vider()'),
    'le motif ne reconnaît même pas un appât');

  // ⚠ ET LA CLÉ PORTE LE CRAN DE RENDU, PAS L'ÉCHELLE. Une clé à l'échelle
  // réelle ferait une entrée de cache par image de pincement — le cache
  // deviendrait un tas de dalles jamais relues.
  assert.match(ecran, /return `\$\{cranCourant\(\)\}:\$\{i\}:\$\{j\}`/,
    'la clé de dalle ne porte plus le cran de rendu');
});

// ---------------------------------------------------------------------------
// La lecture de la carte — lot CARTE-A, 04/09
//
// ⚠⚠ TROIS RETOURS D'ETHAN, TOUS SUR CE QU'ON LIT ET AUCUN SUR UN GESTE.
// « au lieu d'afficher "votre base" afficher Base n°x niv x » · « ne pas
// afficher les points d'attaque sur la flèche qui apparaît quand on clique sur
// une cible, mais en gros dans l'onglet » · « afficher les points d'attaque
// entre l'électricité et emplacement. Enlever emplacement/compteur ressources
// quand on est sur la carte ». Aucune règle de jeu ne bouge.
//
// ⚠ `CARTE-A T5` ET `T6` SONT DES GARDES DE SOURCE, ET IL FAUT SAVOIR CE
// QU'ELLES NE PROUVENT PAS : qu'un afficheur a disparu du fichier, pas que la
// flèche se dessine encore. Le dépôt n'a ni jsdom ni navigateur (§3), et le lot
// JOURNAL a montré qu'une garde qui ne lit que l'APPEL reste verte quand le
// corps est tronqué. La preuve du rendu est dans `RAPPORT-lotCARTE-A.md`,
// relevée dans Chromium.
// ---------------------------------------------------------------------------

test('CARTE-A T1 — la base du joueur porte son numéro et son niveau', () => {
  // ⚠ LE MONTAGE PORTE LES DEUX CHAMPS QUE `sitesDeLaFenetre` POSE, et rien de
  // plus : c'est exactement ce que l'étiquette reçoit à l'écran.
  const site = {
    type: 'baseJoueur', rangee: 295, colonne: 16, niveau: null,
    numeroBase: 2, niveauBatimentsDixiemes: 58,
  };
  assert.deepEqual(lignesDeLEtiquette(site), ['Base n°2', 'niv 5,8']);

  // ⚠⚠ ET LE TITRE DU PANNEAU DIT LA MÊME CHOSE, PAR LA MÊME FONCTION. Le
  // joueur ne doit pas lire deux noms pour la même base à deux endroits de
  // l'écran ; c'est pour ça que `nomDuSite` existe.
  assert.equal(nomDuSite(site), 'Base n°2');
  const ecran = sansCommentaires(lire('src', 'ui', 'monde.js'));
  assert.match(ecran, /panneauTitre\.textContent = nomDuSite\(site\)/,
    'le titre du panneau ne suit plus le libellé de l\'étiquette');

  // ⚠ `EMBLEMES_CARTE.baseJoueur.nom` RESTE le repli — il est aussi la source
  // de la ligne « Type » du panneau, et d'un test voisin.
  assert.equal(EMBLEMES_CARTE.baseJoueur.nom, 'Votre base');
  assert.equal(nomDuSite({ type: 'baseJoueur' }), 'Votre base',
    'un site sans numéro ne retombe plus sur le nom de la table');

  // ⚠ ET SURTOUT PAS LE NIVEAU DE LA RANGÉE : `niv` en minuscules dit que ce
  // n'est pas la grandeur des sites de l'Ouvrage, qui portent `Niveau`.
  assert.ok(!lignesDeLEtiquette(site).some((l) => l.includes('Niveau')),
    'la base du joueur porte le mot des sites de l\'Ouvrage');
});

test('CARTE-A T2 — la décimale du niveau ne se perd pas', () => {
  // ⚠⚠ « 6,0 », JAMAIS « 6 ». Arbitré le 27/08 : un niveau moyen qui tombe rond
  // reste une moyenne, et l'écrire sans décimale le ferait lire comme un niveau
  // entier de bâtiment. Le formatage n'est pas réécrit ici — `formaterDixiemes`
  // de `ui/chantier.js` le porte, et l'étiquette l'appelle.
  const site = { type: 'baseJoueur', niveau: null, numeroBase: 1, niveauBatimentsDixiemes: 60 };
  assert.deepEqual(lignesDeLEtiquette(site), ['Base n°1', 'niv 6,0']);
  assert.equal(lignesDeLEtiquette({ ...site, niveauBatimentsDixiemes: 10 })[1], 'niv 1,0');
  assert.equal(lignesDeLEtiquette({ ...site, niveauBatimentsDixiemes: 507 })[1], 'niv 50,7');

  // ⚠ ET IL N'Y EN A QU'UN. Un second formateur écrit dans `ui/monde.js`
  // donnerait deux façons d'écrire le même nombre.
  const ecran = sansCommentaires(lire('src', 'ui', 'monde.js'));
  assert.match(ecran, /formaterDixiemes/, 'l\'étiquette n\'emploie plus le formateur du dépôt');
  assert.doesNotMatch(ecran, /toFixed|replace\(['"`]\.['"`]/,
    'l\'écran Monde formate un décimal à la main');
});

test('CARTE-A T3 — les sites de l\'Ouvrage ne bougent pas d\'un mot', () => {
  // ⚠⚠ LE LOT NE TOUCHE QU'À UN TYPE, ET CE TEST EST CE QUI LE DIT. Une
  // écriture qui aurait dérouté tous les sites vers « Base n°… » passerait T1
  // sans broncher.
  assert.deepEqual(lignesDeLEtiquette({ type: 'camp', niveau: 12 }), ['Camp', 'Niveau 12']);
  assert.deepEqual(lignesDeLEtiquette({ type: 'base', niveau: 40 }),
    ['Base de l\'Ouvrage', 'Niveau 40']);
  assert.deepEqual(lignesDeLEtiquette({ type: 'avantPoste', niveau: 3 }),
    ['Avant-poste', 'Niveau 3']);
  // Un POI porte le nom que `POI` lui donne, et sa bande fait office de niveau.
  assert.deepEqual(lignesDeLEtiquette({ type: 'poiQuartz', niveau: 3 }),
    [EMBLEMES_CARTE.poiQuartz.nom, 'Niveau 3']);
  for (const type of Object.keys(EMBLEMES_CARTE)) {
    if (type === 'baseJoueur') continue;
    assert.equal(nomDuSite({ type }), EMBLEMES_CARTE[type].nom, type);
  }
});

test('CARTE-A T4 — chaque base porte son numéro, et il part de un', () => {
  const etat = creerEtat(2026);
  // Une seconde base, à côté de la première — le numéro est l'INDICE + 1.
  etat.bases.push(structuredClone(etat.bases[0]));
  etat.bases[1].position = {
    rangee: etat.bases[0].position.rangee - 3, colonne: etat.bases[0].position.colonne,
  };
  const miennes = sitesDeLaFenetre(etat, {
    premiereRangee: 1, derniereRangee: 300, premiereColonne: 1, derniereColonne: 31,
  }).filter((s) => s.type === 'baseJoueur');
  assert.equal(miennes.length, 2, 'le montage ne mesure rien : il faut deux bases');
  assert.deepEqual(miennes.map((s) => s.numeroBase).sort(), [1, 2],
    'les numéros ne sont pas 1 et 2 — un indice a fuité tel quel');
  assert.ok(!miennes.some((s) => s.numeroBase === 0), 'un numéro vaut zéro');
  // ⚠ ET LE NIVEAU EST CELUI DE CHAQUE BASE, PAS DE LA COURANTE. Sans ça, deux
  // bases de niveaux différents porteraient la même plaque.
  for (const b of etat.bases[1].disposition) b.niveau = 30;
  const apres = sitesDeLaFenetre(etat, {
    premiereRangee: 1, derniereRangee: 300, premiereColonne: 1, derniereColonne: 31,
  }).filter((s) => s.type === 'baseJoueur');
  const niveaux = apres.map((s) => s.niveauBatimentsDixiemes);
  assert.notEqual(niveaux[0], niveaux[1], 'les deux bases portent le même niveau');
  // ⚠⚠ ET L'EMBLÈME LIT LA MÊME GRANDEUR QUE SA PLAQUE. `palierDuSite` prenait
  // la base COURANTE : avec deux bases, le dessin et sa légende se seraient
  // contredits dès la seconde.
  assert.notEqual(palierDuSite(apres[0], etat), palierDuSite(apres[1], etat),
    'les deux bases se dessinent au même palier : l\'emblème ne lit pas le site');
});

test('CARTE-A T5 — la flèche a perdu son cartouche, et pour de bon', () => {
  // ⚠ ETHAN, 04/09 : « ne pas afficher les points d'attaque sur la flèche ».
  // La flèche garde son trait et sa pointe ; elle n'écrit plus rien.
  const nu = sansCommentaires(lire('src', 'ui', 'monde.js'));
  const fleche = extraireFonction(nu, 'dessinerFleche');
  assert.ok(fleche.length > 200, 'la fonction `dessinerFleche` est introuvable');
  assert.doesNotMatch(fleche, /fillText|measureText/, 'la flèche écrit encore le prix');
  // Falsifiable : le trait et la pointe, eux, sont toujours là.
  assert.match(fleche, /ctx\.stroke\(\)/, 'la flèche n\'a plus de trait');
  assert.match(fleche, /ctx\.fill\(\)/, 'la flèche n\'a plus de pointe');

  // ⚠⚠ ET LE TEST DE LA GARDE RESTE, SA RAISON A CHANGÉ. `cout === null` ne dit
  // plus « pas de nombre à peindre » mais « hors de portée » : une flèche vers
  // une cible inatteignable promettrait un raid que `problemesDuRaid` refusera.
  assert.match(fleche, /ciblageOuvert\.cout === null/,
    'la flèche pointe désormais des cibles hors de portée');
});

test('CARTE-A T6 — un seul afficheur du prix, et un seul calcul', () => {
  // ⚠⚠ DEUX AFFICHEURS DU MÊME NOMBRE DANS LE MÊME PANNEAU FINIRAIENT PAR NE
  // PLUS DIRE LA MÊME CHOSE. Le prix est peint par le bloc, et il a quitté la
  // liste de `lignesDuSite`.
  const nu = sansCommentaires(lire('src', 'ui', 'monde.js'));
  assert.equal((nu.match(/coutDUnRaid\(/g) ?? []).length, 1,
    'l\'écran Monde calcule le coût plus d\'une fois');
  assert.doesNotMatch(nu, /Coût du raid/, 'le coût est revenu dans la liste du panneau');
  assert.equal((nu.match(/panneauPrixCout\.textContent/g) ?? []).length, 1,
    'le prix s\'écrit à plus d\'un endroit');

  // Le balisage porte le bloc, une fois, AU-DESSUS du corps.
  const html = lire('dist', 'index.html').replace(/<!--[\s\S]*?-->/g, '');
  for (const id of ['monde-panneau-prix', 'monde-panneau-prix-cout',
    'monde-panneau-prix-solde', 'monde-panneau-prix-nom']) {
    assert.equal((html.match(new RegExp(`id="${id}"`, 'g')) ?? []).length, 1,
      `« ${id} » n'apparaît pas exactement une fois dans la page`);
  }
  assert.ok(html.indexOf('id="monde-panneau-prix"') < html.indexOf('id="monde-panneau-corps"'),
    'le prix est passé sous le corps du panneau');
  // ⚠ ET IL NAÎT CACHÉ : hors de portée, `cout` vaut `null`, le refus est déjà
  // écrit, et un tiret en corps 28 crierait un vide.
  assert.match(html, /<div id="monde-panneau-prix" hidden>/,
    'le bloc de prix naît visible');
  assert.match(nu, /panneauPrix\.hidden = prix === null/,
    'le bloc de prix ne se cache plus hors de portée');
});


// ---------------------------------------------------------------------------
// Les étiquettes de la carte — lot ERGONOMIE, point 7, 04/09
//
// ⚠⚠ ETHAN, 04/09 : « les noms des éléments de la carte persistent jusqu'à ce
// que je dézoome, environ dix cases en largeur ». Le stand-by du 04/09 est levé,
// et le point se décompose en deux moitiés qui ne se remplacent pas : le SEUIL
// dit à partir de quand une plaque est lisible, l'ANTI-RECOUVREMENT dit
// laquelle survit quand deux se coupent. Baisser le seuil sans la seconde
// moitié rendrait la carte illisible au lieu de la nommer.
// ---------------------------------------------------------------------------

/** Une boîte d'étiquette de test : rien que ce que `etiquettesRetenues` lit. */
function boite(x, y, largeur, hauteur, priorite, rangee = 0, colonne = 0) {
  return { x, y, largeur, hauteur, priorite, rangee, colonne };
}

test('ERGO T9 — deux plaques qui se coupent d\'un seul pixel : la seconde tombe', () => {
  // Elles se chevauchent d'UN pixel en x et en y. Un test qui les ferait se
  // couvrir de moitié passerait avec un prédicat trop lâche.
  const a = boite(0, 0, 100, 20, 0);
  const b = boite(99, 19, 100, 20, 1);
  assert.deepEqual(etiquettesRetenues([a, b]), [0],
    'une plaque qui coupe une retenue d\'un pixel est dessinée quand même');

  // ⚠ ET LE CONTACT PAR LE BORD N'EST PAS UN RECOUVREMENT — sinon deux plaques
  // qui se touchent sans se cacher se refuseraient l'une l'autre, et la carte
  // perdrait des noms pour rien. Un pixel plus loin, les deux passent.
  const c = boite(100, 20, 100, 20, 1);
  assert.deepEqual(etiquettesRetenues([a, c]), [0, 1],
    'deux plaques qui se touchent par le coin s\'excluent : le prédicat est trop large');
});

test('ERGO T10 — c\'est la PRIORITÉ qui tranche, pas l\'ordre d\'entrée', () => {
  // ⚠⚠ LE MONTAGE MET LA MOINS PRIORITAIRE EN PREMIER, ET C'EST TOUT L'ENJEU.
  // Sans la table, la plaque qui reste serait celle que `sitesDeLaFenetre` a
  // poussée en premier : deux images identiques n'afficheraient pas les mêmes
  // noms, et un nom apparaîtrait ou disparaîtrait en défilant d'un pixel.
  const camp = boite(0, 0, 100, 20, prioriteDeLEtiquette('camp'));
  const sienne = boite(10, 5, 100, 20, prioriteDeLEtiquette('baseJoueur'));
  assert.ok(camp.priorite > sienne.priorite, 'le montage ne discrimine rien');
  assert.deepEqual(etiquettesRetenues([camp, sienne]), [1],
    'la plaque du camp l\'emporte sur celle de la base du joueur');

  // Et l'ordre RENDU est celui d'entrée, pas celui de la priorité : l'appelant
  // dessine sa liste, il n'a pas à la réordonner.
  const loin = boite(400, 400, 100, 20, prioriteDeLEtiquette('camp'));
  assert.deepEqual(etiquettesRetenues([camp, sienne, loin]), [1, 2]);

  // ⚠ LA TABLE EST UNE PERMUTATION EXACTE DES TYPES DESSINÉS, et c'est la garde
  // qui autorise `prioriteDeLEtiquette` à ne pas LEVER : une levée dans la
  // boucle de dessin tronquerait tout l'écran Monde — le lot ZOOM-CONTINU l'a
  // payé sur `dessinerGrosseBase`. Le cas tombe donc au dépôt, pas chez le
  // joueur.
  const ordre = ETIQUETTE_CARTE.ordreDePriorite;
  assert.deepEqual([...ordre].sort(), Object.keys(EMBLEMES_CARTE).sort(),
    'la table de priorité et la table des emblèmes ne portent pas les mêmes types');
  assert.equal(new Set(ordre).size, ordre.length, 'un type est écrit deux fois');

  // ⚠⚠ ET UN TYPE HORS TABLE PASSE EN DERNIER, JAMAIS EN TÊTE. `indexOf` rend
  // −1, qui trierait AVANT la base du joueur : c'est la faute exacte
  // qu'`ORDRE_CHASSIS` a payée, où un châssis inconnu se rangeait devant
  // l'infanterie.
  assert.ok(prioriteDeLEtiquette('inexistant') > prioriteDeLEtiquette('camp'),
    'un type inconnu passe devant les types connus');
});

test('ERGO T11 — à priorité égale, la case la plus haute puis la plus à gauche', () => {
  const p = prioriteDeLEtiquette('base');
  // Même rangée, colonnes 4 et 2 : c'est la 2 qui reste, et elle est SECONDE
  // dans le tableau — un départage qui suivrait l'ordre d'entrée garderait la 4.
  const droite = boite(0, 0, 100, 20, p, 30, 4);
  const gauche = boite(10, 0, 100, 20, p, 30, 2);
  assert.deepEqual(etiquettesRetenues([droite, gauche]), [1],
    'à colonnes égales de priorité, la plus à gauche ne l\'emporte pas');

  // Et la rangée passe AVANT la colonne : la plus haute gagne même si elle est
  // plus à droite.
  const bas = boite(0, 0, 100, 20, p, 31, 1);
  const haut = boite(10, 0, 100, 20, p, 30, 9);
  assert.deepEqual(etiquettesRetenues([bas, haut]), [1],
    'la rangée ne passe pas avant la colonne');
});

test('ERGO T12 — des plaques disjointes sont TOUTES dessinées', () => {
  // ⚠⚠ C'EST LE TEST QUI MORD. Une règle d'anti-recouvrement qui écarterait
  // tout — « ne garder que la première », « ne garder qu'une par rangée » —
  // passerait T9, T10 et T11 sans rien valoir, et la carte perdrait les noms
  // qu'Ethan demande justement à voir.
  const boites = [];
  for (let i = 0; i < 12; i += 1) {
    boites.push(boite(i * 120, (i % 3) * 40, 100, 20,
      prioriteDeLEtiquette(i % 2 === 0 ? 'camp' : 'base'), 10 + i, 1 + i));
  }
  assert.deepEqual(etiquettesRetenues(boites), boites.map((_, i) => i),
    'des plaques qui ne se coupent pas sont écartées');

  // Une liste vide ne lève pas et ne rend rien.
  assert.deepEqual(etiquettesRetenues([]), []);

  // ⚠ ET UNE SEULE PLAQUE PASSE TOUJOURS : une règle qui comparerait une boîte
  // à elle-même n'en dessinerait aucune.
  assert.deepEqual(etiquettesRetenues([boite(0, 0, 100, 20, 0)]), [0]);
});

test('ERGO T13 — le seuil ouvre dix cases, et l\'écran mesure avant de peindre', () => {
  // ⚠⚠ LE ZOOM EST CONTINU DEPUIS LE 04/09, DONC LE SEUIL NE SE LIT PLUS SUR UN
  // CRAN. L'échelle s'arrête où le doigt la laisse : on balaie la course
  // entière et on relève à partir d'où les noms tiennent.
  const dpr = 3;
  const largeurCss = 360;
  const ouvre = (echelle) => echelle / dpr >= ETIQUETTE_CARTE.cssMiniParCase;
  // Dix cases sur la largeur, c'est la demande d'Ethan mot pour mot.
  const echelleDixCases = (largeurCss / 10) * dpr;
  assert.ok(ouvre(echelleDixCases),
    'à dix cases de large, les noms ne s\'affichent pas');
  // Onze cases : c'est déjà « dézoomé », et les noms doivent partir. Sans cette
  // moitié, un seuil de zéro passerait la première.
  assert.ok(!ouvre((largeurCss / 11) * dpr),
    'les noms tiennent encore au-delà de dix cases de large');

  // ⚠ ET LE SEUIL RESTE DANS `src/data/` : « l'écran ne nomme aucune constante
  // de zoom en dur » est tombée dessus au lot CONTOUR-ET-ÉTIQUETTES, parce que
  // 64 était aussi un cran. Elle avait raison.
  const ecran = sansCommentaires(lire('src', 'ui', 'monde.js'));
  assert.match(ecran, /ETIQUETTE_CARTE\.ordreDePriorite/,
    'l\'écran écrit son ordre de priorité au lieu de le lire dans les données');
  assert.doesNotMatch(ecran, /'baseTerminale', 'base'/,
    'l\'ordre de priorité est recopié dans l\'écran');

  // ⚠⚠ MESURER, RETENIR, PEINDRE — TROIS TEMPS, DANS CET ORDRE. Peindre en
  // mesurant ferait dépendre l'affichage de l'ordre de parcours de
  // `sitesDeLaFenetre`, c'est-à-dire d'un détail d'implémentation, et la règle
  // de priorité ne déciderait plus rien.
  const corps = extraireFonction(ecran, 'dessiner');
  assert.ok(corps.length > 200, 'la fonction `dessiner` est introuvable');
  const rangMesure = corps.indexOf('boiteDeLEtiquette(');
  const rangTri = corps.indexOf('etiquettesRetenues(');
  const rangPeinture = corps.indexOf('dessinerEtiquette(');
  assert.ok(rangMesure >= 0 && rangTri >= 0 && rangPeinture >= 0,
    '`dessiner` ne fait plus les trois temps');
  assert.ok(rangMesure < rangTri && rangTri < rangPeinture,
    'l\'écran peint avant d\'avoir retenu : la priorité ne tranche plus rien');

  // ⚠ ET LA LARGEUR SE PREND À `measureText`, JAMAIS AU NOMBRE DE CARACTÈRES.
  // La police est monospace, ce qui rendrait l'approximation juste par accident
  // — et fausse au premier changement de police, sans que rien ne le dise.
  const mesure = extraireFonction(ecran, 'boiteDeLEtiquette');
  assert.match(mesure, /measureText/,
    'la boîte d\'une étiquette ne se mesure pas sur la police');
  assert.doesNotMatch(extraireFonction(ecran, 'dessinerEtiquette'), /measureText/,
    'la peinture remesure : les deux passes se sont remélangées');
});

// ---------------------------------------------------------------------------
// Le lot CARTE-B — l'ouverture cadre la base au zoom maximum, et la flèche va
// d'un centre à l'autre. Retours d'Ethan du 06/09, points 3 et 4.
// ---------------------------------------------------------------------------

test('CARTE-B T4 — la flèche vers sa propre case rend `null`', () => {
  // ⚠⚠ CE TEST EXISTAIT AVANT LA MODIFICATION, ET IL EST ÉCRIT POUR ÇA. Il ne
  // décrit aucune nouveauté : il attrape une RÉGRESSION. Le retrait aux deux
  // bouts disparaît au lot CARTE-B, et la première façon de se tromper en le
  // retirant est de retirer aussi la garde qui le précède — `Math.atan2(0, 0)`
  // rend alors zéro sans le dire, et la carte peint une pointe de flèche posée
  // sur la base du joueur, sans trait et sans cible.
  const k = { rangee: 295, colonne: 16 };
  assert.equal(traitDeLaFleche(k, { ...k }, 0, 0, 64), null,
    'une flèche part de la base du joueur vers elle-même');

  // ⚠ ET LE MONTAGE MESURE QUELQUE CHOSE : deux cases DIFFÉRENTES rendent bien
  // un trait. Sans cette moitié, un `traitDeLaFleche` qui rendrait `null`
  // partout passerait le test ci-dessus.
  const voisine = { rangee: 295, colonne: 17 };
  assert.notEqual(traitDeLaFleche(k, voisine, 0, 0, 64), null,
    'aucune flèche ne se dessine plus, même vers une autre case');
});

/**
 * Le faux document de l'écran Monde.
 *
 * ⚠⚠ IL LÈVE SUR TOUT IDENTIFIANT QUE `src/index.src.html` NE DÉCLARE PAS, et
 * c'est la seconde chose qu'il garde : l'écran ne peut pas demander un élément
 * que le balisage n'a pas. Même idiome que le faux document de
 * `test/chantier.test.js` et celui de `test/recherche.test.js` — **aucune
 * dépendance n'entre**, `esbuild` reste la seule (CLAUDE.md §3).
 *
 * ⚠⚠ ET IL NE REND DÉCODÉE QUE L'IMAGE DES EMBLÈMES. Les huit planches de sol,
 * l'atlas des limites et les deux grosses bases restent « en attente » : sans
 * elles, `dessiner` peint l'aplat d'attente et sort, là où les rendre prêtes
 * ferait calculer de vraies dalles de 512² dans un canevas de papier. Les
 * emblèmes, eux, DOIVENT être prêts — leur repli d'attente peint un
 * `strokeRect` par site, et le halo cesserait d'être le seul de la scène.
 */
function fauxDocumentMonde({ largeurCss = 360, hauteurCss = 640, dpr = 3 } = {}) {
  const IDS = [
    'monde-canvas', 'monde-emblemes', 'monde-limites', 'monde-outils',
    'monde-panneau', 'monde-panneau-titre', 'monde-panneau-prix',
    'monde-panneau-prix-cout', 'monde-panneau-prix-solde', 'monde-panneau-corps',
    'monde-panneau-refus', 'monde-panneau-deplacer', 'monde-panneau-fermer',
    'monde-panneau-attaquer',
    'monde-recentrer', 'monde-base-2x2', 'monde-base-3x3',
    'sol-1', 'sol-2', 'sol-3', 'sol-4', 'sol-5', 'sol-6', 'sol-7', 'sol-8',
  ];
  // ⚠ LA LISTE SE CONFRONTE AU BALISAGE, elle ne se croit pas sur parole.
  const balisage = lire('src', 'index.src.html');
  for (const id of IDS) {
    assert.match(balisage, new RegExp(`id="${id}"`), `« ${id} » n'est pas dans le balisage`);
  }

  /** Ce que le canevas a reçu : on ne relit que `strokeRect`, voir plus bas. */
  const appels = [];
  const ctx = new Proxy({}, {
    get(_, nom) {
      if (nom === 'measureText') return () => ({ width: 40 });
      return (...args) => { appels.push({ nom, args }); };
    },
    set(_, nom, valeur) { appels.push({ nom, args: [valeur] }); return true; },
  });

  const faire = (id) => ({
    id,
    // Les images : seuls les emblèmes sont décodés.
    complete: id === 'monde-emblemes',
    naturalWidth: id === 'monde-emblemes' ? 512 : 0,
    hidden: false,
    textContent: '',
    title: '',
    style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    children: [],
    appendChild(n) { this.children.push(n); },
    // ⚠ `append` PREND PLUSIEURS NŒUDS, ET IL MANQUAIT — `ouvrirPanneau` s'en
    // sert pour poser le couple libellé/valeur de chaque ligne. Le faux document
    // ne montait donc aucun panneau.
    append(...n) { this.children.push(...n); },
    replaceChildren(...n) { this.children = n; },
    disabled: false,
    ecouteurs: new Map(),
    addEventListener(type, fn) {
      if (!this.ecouteurs.has(type)) this.ecouteurs.set(type, []);
      this.ecouteurs.get(type).push(fn);
    },
    /** Rejoue un évènement sur cet élément — c'est ce qui fait le doigt. */
    envoyer(type, evenement) {
      const fns = this.ecouteurs.get(type);
      assert.ok(fns && fns.length > 0, `rien n'écoute « ${type} » sur ${this.id}`);
      for (const fn of fns) fn(evenement);
    },
    setPointerCapture() {},
    getContext: () => ctx,
    getBoundingClientRect: () => ({ width: largeurCss, height: hauteurCss, left: 0, top: 0 }),
    width: 0,
    height: 0,
  });

  const parId = new Map(IDS.map((id) => [id, faire(id)]));
  const doc = {
    getElementById(id) {
      if (!parId.has(id)) throw new Error(`faux document : « ${id} » n'est pas dans src/index.src.html`);
      return parId.get(id);
    },
    createElement: (tag) => faire(tag),
    defaultView: {
      devicePixelRatio: dpr,
      requestAnimationFrame: () => 0,
      cancelAnimationFrame() {},
    },
  };
  return { doc, appels, canvas: parId.get('monde-canvas'), dpr, parId };
}

/**
 * Le cadre du halo tel que la dernière image l'a peint.
 *
 * ⚠⚠ C'EST LA SEULE FENÊTRE SUR LA VUE, ET ELLE EST HONNÊTE. `initialiserEcranMonde`
 * ne rend que `peindre`, `rafraichir` et `masquer` : ni l'origine ni l'échelle
 * ne sortent du module, et leur ouvrir un accesseur pour les besoins d'un test
 * mettrait dans `src/` une porte que la production n'emploie pas. Le halo, lui,
 * est peint À la position de la base du joueur et À l'échelle courante — il
 * porte donc les deux grandeurs qu'on cherche, telles que l'écran les a
 * réellement employées.
 *
 * ⚠ ET IL EST LE SEUL `strokeRect` DE LA SCÈNE dans ce montage : le seul autre
 * du module est le repli d'attente des emblèmes, que le faux document rend
 * inatteignable en livrant leur image décodée.
 */
function cadreDuHalo(appels) {
  const traces = appels.filter((a) => a.nom === 'strokeRect');
  assert.equal(traces.length, 1,
    `${traces.length} strokeRect dans la scène : le halo n'est plus seul, le montage ne mesure rien`);
  const [x, y, cote] = traces[traces.length - 1].args;
  return { x, y, cote };
}

test('CARTE-B T1 — la carte s\'ouvre au zoom MAXIMUM, pas au plus large', () => {
  // ⚠⚠ ETHAN, 06/09 : « ouverture de la carte : centrée sur ma base du joueur au
  // ZOOM MAXIMUM ». Elle s'ouvrait sur `CRANS[0]`, le dézoom maximal.
  const { doc, appels, dpr } = fauxDocumentMonde();
  const ecran = initialiserEcranMonde(doc);
  const etat = creerEtat(20260906);
  ecran.peindre(etat);

  // ⚠⚠ ON MESURE L'ÉCHELLE SUR CE QUE L'ÉCRAN A PEINT, PAS SUR UNE CONSTANTE.
  // Le côté du halo vaut `pas - epaisseur`, et l'épaisseur `max(1, round(pas ×
  // EPAISSEUR_HALO))` : l'échelle s'en déduit exactement, et elle est celle que
  // `dessiner` a réellement employée.
  const attendu = (pas) => pas - Math.max(1, Math.round(pas * EPAISSEUR_HALO));
  const { cote } = cadreDuHalo(appels);
  assert.equal(cote, attendu(ECHELLE_MAX),
    'la carte ne s\'ouvre pas au zoom maximum');

  // ⚠⚠ ET LE MONTAGE DISCRIMINE : le cran d'AVANT rendrait un autre nombre, et
  // un cran INTERMÉDIAIRE aussi. Sans ces deux lignes, `cote !== attendu(CRANS[0])`
  // passerait sur n'importe quel cran de la table sauf le plus large.
  assert.notEqual(attendu(CRANS[0]), attendu(ECHELLE_MAX),
    'les deux bouts de la table rendent le même halo : le montage ne mesure rien');
  for (const cran of CRANS) {
    if (cran === ECHELLE_MAX) continue;
    assert.notEqual(cote, attendu(cran), `la carte s'ouvre au cran ${cran}`);
  }

  // ⚠ ET C'EST BIEN LE HAUT DE LA COURSE, pas un nombre écrit ici : `ECHELLE_MAX`
  // est le dernier élément de la table, qui est croissante.
  assert.equal(ECHELLE_MAX, CRANS[CRANS.length - 1]);
  assert.equal(doc.getElementById('monde-outils').title,
    `${Math.round(ECHELLE_MAX / dpr)} px / case`,
    'l\'échelle annoncée à l\'écran n\'est pas celle du zoom maximum');
});

/**
 * Un pincement à deux doigts sur le canevas, du rapport demandé.
 *
 * ⚠ LES DEUX DOIGTS SE RETIRENT PAR `pointercancel`, PAS PAR `pointerup`.
 * `relacher` ouvre le panneau du site touché quand le doigt n'a pas glissé — et
 * pendant un pincement il n'a pas glissé, la branche du zoom sortant avant le
 * promenage. `pointercancel` est l'évènement que le navigateur envoie
 * réellement quand le geste change de main, et il ne fait que rendre l'état.
 */
function pincer(canvas, rapport) {
  const a = { pointerId: 1, clientX: 100, clientY: 300 };
  const b = { pointerId: 2, clientX: 300, clientY: 300 };
  canvas.envoyer('pointerdown', a);
  canvas.envoyer('pointerdown', b);
  canvas.envoyer('pointermove', { ...b, clientX: 100 + 200 * rapport });
  canvas.envoyer('pointercancel', a);
  canvas.envoyer('pointercancel', b);
}

test('CARTE-B T2 — la carte se recadre à CHAQUE ouverture, pas seulement à la première', () => {
  // ⚠⚠ RENVERSEMENT DU 06/09. `peindre` ne recentrait que quand `etatCourant`
  // valait `null`, c'est-à-dire UNE FOIS pour toute la partie : le commentaire
  // qui le défendait est réécrit dans `monde.js`, il n'est pas supprimé.
  const { doc, appels } = fauxDocumentMonde();
  const ecran = initialiserEcranMonde(doc);
  const canvas = doc.getElementById('monde-canvas');

  const etat = creerEtat(20260906);
  ecran.peindre(etat);
  const premier = cadreDuHalo(appels);

  // ⚠⚠ ON DÉPLACE LA VUE COMME LE JOUEUR LA DÉPLACE : AU DOIGT. Un pincement
  // qui referme les doigts dézoome ET promène la vue — `reglerEchelle` ancre sur
  // le milieu des deux doigts —, donc les DEUX moitiés du cadrage d'ouverture
  // sont défaites avant qu'on ne rouvre.
  appels.length = 0;
  pincer(canvas, 0.25);
  const perdu = cadreDuHalo(appels);
  assert.notEqual(perdu.cote, premier.cote,
    'le pincement n\'a pas changé l\'échelle : le montage ne défait rien');
  // ⚠ ET LE PINCEMENT DÉCENTRE AUSSI, PARCE QU'IL S'ANCRE SUR LE MILIEU DES
  // DOIGTS — qui n'est pas le milieu de l'écran. Sans cette moitié, le test ne
  // mesurerait que le retour du zoom.
  assert.ok(Math.abs((perdu.x + perdu.cote / 2) - canvas.width / 2) > 1,
    'la vue est restée centrée sur la base : il n\'y a rien à recentrer');

  // ⚠ ET LA BASE CHANGE AUSSI DE CASE, pour que « centré » ne puisse pas être
  // vrai par accident sur l'ancienne vue.
  const ailleurs = creerEtat(20260906);
  baseCourante(ailleurs).position = { rangee: 250, colonne: 8 };

  ecran.masquer();
  appels.length = 0;
  ecran.peindre(ailleurs);
  const second = cadreDuHalo(appels);

  // ⚠⚠ ET L'ÉCHELLE EST REVENUE AU MAXIMUM, PAS SEULEMENT LE CENTRE. C'est la
  // seconde moitié de la phrase d'Ethan — « centrée sur ma base du joueur au
  // zoom maximum » —, et elle vaut à la seconde ouverture comme à la première.
  // Sans cette assertion, un `cadrerSurLaBase` qui ne reposerait que la vue
  // passerait : la première ouverture hérite déjà de l'échelle d'origine.
  assert.equal(second.cote, premier.cote,
    'la seconde ouverture ne revient pas au zoom maximum');
  assert.equal(second.cote,
    ECHELLE_MAX - Math.max(1, Math.round(ECHELLE_MAX * EPAISSEUR_HALO)));

  // ⚠⚠ CENTRÉ, ET MESURÉ COMME TEL : le cadre du halo est au milieu du canevas
  // aux deux ouvertures. C'est ce que « centrée sur ma base du joueur » dit, et
  // ça ne dépend d'aucune des deux positions.
  for (const [quand, cadre] of [['première', premier], ['seconde', second]]) {
    assert.equal(Math.round(cadre.x + cadre.cote / 2), Math.round(canvas.width / 2),
      `la ${quand} ouverture ne centre pas la base horizontalement`);
    assert.equal(Math.round(cadre.y + cadre.cote / 2), Math.round(canvas.height / 2),
      `la ${quand} ouverture ne centre pas la base verticalement`);
  }

  // ⚠ ET LE MONTAGE PROUVE D'ABORD QU'IL BOUGE QUELQUE CHOSE. Les deux bases
  // sont à des cases DIFFÉRENTES : sans recadrage, le second halo tomberait à
  // `(colonne − 1) × pas − vueX` de la première vue, soit très loin du centre.
  const a = baseCourante(etat).position;
  const b = baseCourante(ailleurs).position;
  assert.notDeepEqual({ rangee: a.rangee, colonne: a.colonne },
    { rangee: b.rangee, colonne: b.colonne },
    'les deux ouvertures regardent la même case : le montage ne mesure rien');
  const sansRecadrage = (b.colonne - 1) * ECHELLE_MAX - (premier.x - (a.colonne - 1) * ECHELLE_MAX);
  assert.ok(Math.abs(sansRecadrage - second.x) > ECHELLE_MAX,
    'la vue d\'avant et la vue d\'après se confondent : le test passerait sans recadrage');
});

test('CARTE-B T3 — la flèche part et finit aux CENTRES des deux cases', () => {
  // ⚠⚠ ETHAN, 06/09 : « flèche de la base à la cible : du centre de l'un au
  // centre de l'autre ». Elle reculait de `RETRAIT_FLECHE = 0,55` case à chaque
  // bout — la constante est retirée, et `monde.js` dit pourquoi.
  const depuis = { rangee: 295, colonne: 16 };
  const vers = { rangee: 288, colonne: 21 };
  const ox = 137;
  const oy = 4211;
  const pas = 64;

  const trait = traitDeLaFleche(depuis, vers, ox, oy, pas);
  const a = centreDeLaCase(depuis, ox, oy, pas);
  const b = centreDeLaCase(vers, ox, oy, pas);

  // ⚠⚠ À L'ÉGALITÉ STRICTE, PAS À UNE TOLÉRANCE. Un test qui vérifierait « la
  // flèche est plus longue qu'avant » passerait sur un retrait divisé par deux ;
  // celui-ci ne passe que sur un retrait EXACTEMENT nul.
  assert.equal(trait.x1, a.x);
  assert.equal(trait.y1, a.y);
  assert.equal(trait.x2, b.x);
  assert.equal(trait.y2, b.y);

  // ⚠ ET LE MONTAGE MESURE UN RETRAIT : les deux centres sont à plus d'une case
  // l'un de l'autre dans les deux axes, donc un recul même petit se lirait. Sur
  // deux cases voisines en ligne, un retrait sur l'axe mort ne changerait rien.
  assert.ok(Math.abs(b.x - a.x) > pas && Math.abs(b.y - a.y) > pas,
    'les deux cases sont trop proches ou alignées : un retrait passerait inaperçu');

  // ⚠ L'ANGLE NE BOUGE PAS D'UN RADIAN : reculer les deux bouts du MÊME vecteur
  // ne changeait jamais la direction, et la pointe reste orientée pareil.
  assert.equal(trait.angle, Math.atan2(b.y - a.y, b.x - a.x));

  // ⚠ ET LA CONSTANTE EST PARTIE POUR DE BON — un `RETRAIT_FLECHE` remis à zéro
  // serait un nom qui ment, et le prochain lecteur le croirait vivant.
  const source = sansCommentaires(lire('src', 'ui', 'monde.js'));
  assert.doesNotMatch(source, /RETRAIT_FLECHE/,
    'le retrait de la flèche est encore nommé dans l\'écran');
});

// ---------------------------------------------------------------------------
// Le lot CARTE-C — la flèche s'arrête au bord, la fiche dit d'où vient le
// niveau, et un bouton entre dans la cible. Retours d'Ethan du 06/09.
// ---------------------------------------------------------------------------

/** Un trait droit, horizontal, du point A au point B. */
const trait = (x1, y1, x2, y2) => ({
  x1, y1, x2, y2, angle: Math.atan2(y2 - y1, x2 - x1),
});

const CADRE = { largeur: 400, hauteur: 800 };
const surUnBord = (x, y) => x === 0 || y === 0
  || Math.abs(x - CADRE.largeur) < 1e-9 || Math.abs(y - CADRE.hauteur) < 1e-9;

test('CARTE-C T1 — une flèche dont la cible est hors champ est rognée au bord', () => {
  // ⚠⚠ ETHAN, 06/09 : la POINTE était hors écran, et le joueur ne voyait qu'une
  // barre nue qui traverse la carte sans rien désigner.
  //
  // ⚠ LE MONTAGE DOIT SORTIR DU CADRE : une cible DANS le champ est le cas qui
  // marchait déjà, et il ne prouverait rien.
  const entier = trait(200, 400, 900, 400);
  assert.ok(entier.x2 > CADRE.largeur, 'montage : la cible est dans le cadre');

  const rogne = traitRogne(entier, CADRE.largeur, CADRE.hauteur);
  assert.ok(rogne !== null, 'la flèche a disparu au lieu d\'être rognée');
  assert.ok(surUnBord(rogne.x2, rogne.y2),
    `la pointe est en (${rogne.x2}, ${rogne.y2}) : elle n'est pas sur un bord`);
  assert.equal(rogne.x2, CADRE.largeur);
  // Le départ, lui, ne bouge pas : il était déjà dans le cadre.
  assert.equal(rogne.x1, entier.x1);
  assert.equal(rogne.y1, entier.y1);

  // ⚠ ET SUR L'AUTRE AXE AUSSI, sans quoi le test ne mesurerait qu'un bord.
  const versLeBas = traitRogne(trait(200, 400, 200, 2000), CADRE.largeur, CADRE.hauteur);
  assert.equal(versLeBas.y2, CADRE.hauteur);
  const versLeHaut = traitRogne(trait(200, 400, 200, -900), CADRE.largeur, CADRE.hauteur);
  assert.equal(versLeHaut.y2, 0);
});

test('CARTE-C T2 — l\'angle survit au rognage, et il n\'est pas recalculé', () => {
  // ⚠⚠ UN TEST QUI REFERAIT L'ANGLE DEPUIS LE SEGMENT ROGNÉ SE VALIDERAIT
  // LUI-MÊME. On compare à l'angle du trait ENTIER, qui est la grandeur que la
  // pointe doit porter : la direction de la CIBLE, pas celle du bout visible.
  const entier = trait(200, 400, 900, 100);
  const rogne = traitRogne(entier, CADRE.largeur, CADRE.hauteur);
  assert.equal(rogne.angle, entier.angle, 'l\'angle a été recalculé');

  // ⚠ ET IL EST PRIS À L'IDENTIQUE, PAS « À PEU PRÈS » : une égalité stricte
  // refuse un chemin de calcul qui rendrait le même nombre à l'epsilon près
  // aujourd'hui et un autre demain.
  assert.notEqual(
    Math.atan2(rogne.y2 - rogne.y1, rogne.x2 - rogne.x1), Number.NaN,
    'montage : le segment rogné est dégénéré',
  );
});

test('CARTE-C T3 — une flèche entièrement visible n\'est pas touchée', () => {
  // Non-régression du cas courant. L'égalité est STRICTE sur les quatre
  // coordonnées : un rognage qui « corrigerait » un flottant au passage se
  // verrait ici.
  const entier = trait(50, 100, 300, 700);
  const rogne = traitRogne(entier, CADRE.largeur, CADRE.hauteur);
  assert.equal(rogne.x1, entier.x1);
  assert.equal(rogne.y1, entier.y1);
  assert.equal(rogne.x2, entier.x2);
  assert.equal(rogne.y2, entier.y2);
  assert.equal(rogne.angle, entier.angle);
  // ⚠ ET C'EST LE MÊME OBJET : aucune arithmétique n'est faite dans ce cas-là.
  assert.equal(rogne, entier, 'le cas courant paie un recalcul pour rien');
});

test('CARTE-C T4 — les deux bouts hors champ du même côté rendent `null`', () => {
  // ⚠ `null`, PAS UN SEGMENT DE LONGUEUR NULLE : `dessinerFleche` peindrait une
  // pointe sur un point qui ne désigne rien.
  assert.equal(traitRogne(trait(-500, 400, -200, 400), CADRE.largeur, CADRE.hauteur), null);
  assert.equal(traitRogne(trait(900, 400, 1200, 400), CADRE.largeur, CADRE.hauteur), null);
  assert.equal(traitRogne(trait(200, -500, 300, -100), CADRE.largeur, CADRE.hauteur), null);
  assert.equal(traitRogne(trait(200, 900, 300, 1200), CADRE.largeur, CADRE.hauteur), null);
  // ⚠ ET EN DIAGONALE, où le segment passe À CÔTÉ du cadre sans qu'aucun de ses
  // deux bouts ne soit du même côté d'un bord unique. C'est le cas que le test
  // manquerait s'il ne balayait que les quatre directions droites.
  assert.equal(traitRogne(trait(-100, -100, -50, 1000), CADRE.largeur, CADRE.hauteur), null);
  // Falsifiable : le même montage décalé DANS le cadre rend bien quelque chose.
  assert.ok(traitRogne(trait(100, -100, 150, 1000), CADRE.largeur, CADRE.hauteur) !== null,
    'le montage refuse tout : il ne discrimine pas');
  // Et `null` traverse : la garde « même case » de `traitDeLaFleche` survit.
  assert.equal(traitRogne(null, CADRE.largeur, CADRE.hauteur), null);
});

test('CARTE-C T5 — le DÉPART hors champ est rogné lui aussi, et le cas est réel', () => {
  // ⚠⚠ CE N'EST PAS UN CAS D'ÉCOLE, ET C'EST MESURÉ. Au zoom maximum une case
  // vaut `ECHELLE_MAX` pixels physiques ; un téléphone de 1 080 × 2 340 montre
  // donc moins de cinq cases de large. La portée d'un raid est de dix cases :
  // le joueur qui promène la carte jusqu'à sa cible a sa base HORS du cadre.
  const casesVisibles = 1080 / ECHELLE_MAX;
  assert.ok(casesVisibles < 10,
    `${casesVisibles} cases tiennent en largeur : les deux bouts pourraient être visibles`);

  const entier = trait(-600, 400, 300, 400);
  const rogne = traitRogne(entier, CADRE.largeur, CADRE.hauteur);
  assert.ok(rogne !== null, 'la flèche disparaît quand sa base est hors champ');
  assert.equal(rogne.x1, 0, 'le départ n\'a pas été rogné');
  assert.equal(rogne.x2, entier.x2, 'l\'arrivée a bougé alors qu\'elle était visible');
  assert.equal(rogne.angle, entier.angle);

  // ⚠ ET LES DEUX BOUTS À LA FOIS, quand le trait traverse le cadre de part en
  // part — c'est ce que « les deux bouts sont rognés » veut dire.
  const traverse = traitRogne(trait(-600, 400, 1200, 400), CADRE.largeur, CADRE.hauteur);
  assert.equal(traverse.x1, 0);
  assert.equal(traverse.x2, CADRE.largeur);
});

test('CARTE-C T6 — `traitDeLaFleche` est intacte : centre à centre, et `null` sur sa case', () => {
  // ⚠ LE ROGNAGE EST UNE SECONDE OPÉRATION. Le contrat de centre à centre est
  // l'arbitrage du 06/09 et il ne bouge pas ; si cette assertion doit changer,
  // c'est que le lot a débordé.
  const a = { rangee: 10, colonne: 10 };
  const b = { rangee: 10, colonne: 14 };
  const t = traitDeLaFleche(a, b, 0, 0, 100);
  assert.deepEqual({ x: t.x1, y: t.y1 }, centreDeLaCase(a, 0, 0, 100),
    'le départ n\'est plus le centre de la case');
  assert.deepEqual({ x: t.x2, y: t.y2 }, centreDeLaCase(b, 0, 0, 100),
    'l\'arrivée n\'est plus le centre de la case');
  assert.equal(traitDeLaFleche(a, { ...a }, 0, 0, 100), null, 'la garde « même case » est tombée');

  // ⚠ ET LE ROGNAGE NE MUTE PAS SON ENTRÉE : une flèche rognée pour l'écran ne
  // doit pas changer le trait que l'appelant tient encore.
  const entier = trait(200, 400, 900, 400);
  const copie = { ...entier };
  traitRogne(entier, CADRE.largeur, CADRE.hauteur);
  assert.deepEqual(entier, copie, '`traitRogne` a modifié le trait qu\'on lui a donné');
});

test('CARTE-C T7 — l\'épaisseur du trait suit toujours le zoom', () => {
  // ⚠⚠ CE TEST FIGE UN ARBITRAGE, ET C'EST TOUT CE QU'IL FAIT. Ethan, 06/09 :
  // « on fait croître avec le zoom ». Une proposition de borner l'épaisseur en
  // pixels d'écran a été faite et REFUSÉE ; sans cette garde, un lot futur la
  // plafonnerait sans que rien ne le dise.
  const largeur = (pas) => Math.max(1, Math.round(pas * EPAISSEUR_HALO));
  const petit = CRANS[0];
  const grand = ECHELLE_MAX;
  assert.ok(grand > petit, 'la table de zoom ne monte plus : le montage ne mesure rien');

  // ⚠ LA PROPORTIONNALITÉ SE MESURE À L'ARRONDI PRÈS, PAS SUR LE RAPPORT DES
  // DEUX ÉPAISSEURS — mesuré : à `pas = 32` l'épaisseur exacte vaut 2,56 et
  // l'arrondi rend 3, si bien que le rapport des ENTIERS vaut 6,67 quand celui
  // des pas vaut 8. C'est l'arrondi du petit bout, pas un plafond ; ce qu'il faut
  // asserter est que chaque épaisseur est celle de son pas à un demi-pixel près.
  for (const cran of CRANS) {
    assert.ok(
      Math.abs(largeur(cran) - cran * EPAISSEUR_HALO) <= 0.5,
      `au cran ${cran} l'épaisseur vaut ${largeur(cran)} pour ${cran * EPAISSEUR_HALO} attendus`,
    );
  }
  assert.ok(largeur(grand) > largeur(petit), 'l\'épaisseur a été plafonnée');
  // ⚠ ET ELLE CROÎT SUR TOUTE LA TABLE, pas seulement entre les deux bouts : un
  // plafond posé au milieu passerait la ligne d'au-dessus.
  for (let i = 1; i < CRANS.length; i += 1) {
    assert.ok(largeur(CRANS[i]) > largeur(CRANS[i - 1]),
      `l'épaisseur ne monte plus entre ${CRANS[i - 1]} et ${CRANS[i]}`);
  }

  // ⚠ ET L'ÉCRAN EMPLOIE BIEN CETTE FORMULE-LÀ, sans plafond glissé au passage.
  const dessin = extraireFonction(sansCommentaires(lire('src', 'ui', 'monde.js')), 'dessinerFleche');
  assert.match(dessin, /lineWidth = Math\.max\(1, Math\.round\(pas \* EPAISSEUR_HALO\)\)/,
    'l\'épaisseur de la flèche ne se dérive plus de `pas` et d\'`EPAISSEUR_HALO`');
  assert.doesNotMatch(dessin, /Math\.min\(/, 'un plafond a été posé sur l\'épaisseur de la flèche');
});

test('CARTE-C T8 — la fiche dit d\'où vient le niveau, et les deux types diffèrent', () => {
  // ⚠⚠ UN TEST SUR UN SEUL TYPE PASSERAIT SUR UN TEXTE ÉCRIT EN DUR. Ethan a vu
  // un avant-poste de niveau 1 collé à une base de niveau 7,6 : ce qu'il faut
  // montrer, c'est que les deux ne se calculent PAS de la même façon.
  const depuis = { rangee: 295, colonne: 16 };
  const valeurDe = (l, quoi) => l.find((x) => x.quoi === quoi)?.valeur;
  const camp = valeurDe(lignesDuSite({ type: 'camp', rangee: 293, colonne: 16, niveau: 3 }, depuis), 'Indexé sur');
  const poste = valeurDe(lignesDuSite({ type: 'avantPoste', rangee: 291, colonne: 16, niveau: 1 }, depuis), 'Indexé sur');
  assert.ok(camp, 'un camp ne dit pas d\'où vient son niveau');
  assert.ok(poste, 'un avant-poste ne dit pas d\'où vient son niveau');
  assert.notEqual(camp, poste, 'les deux types rendent le même libellé : la ligne est écrite en dur');

  // ⚠ ET LA LIGNE EST SOUS « Niveau », là où le joueur la cherche.
  const lignes = lignesDuSite({ type: 'camp', rangee: 293, colonne: 16, niveau: 3 }, depuis);
  const rangs = lignes.map((l) => l.quoi);
  assert.equal(rangs.indexOf('Indexé sur'), rangs.indexOf('Niveau') + 1);
});

test('CARTE-C T9 — le libellé se dérive d\'`indexeSur`, il n\'est pas un `if` sur le type', () => {
  // ⚠⚠ C'EST LE TEST QUI ATTRAPE UN `site.type === 'camp'` RECOPIÉ DANS L'ÉCRAN.
  // On change `indexeSur` dans un montage : si la ligne suit, elle se dérive ;
  // si elle ne suit pas, l'écran porte sa propre table.
  const depuis = { rangee: 295, colonne: 16 };
  const valeurDe = (l, quoi) => l.find((x) => x.quoi === quoi)?.valeur;
  const site = { type: 'camp', rangee: 293, colonne: 16, niveau: 3 };
  const avant = valeurDe(lignesDuSite(site, depuis), 'Indexé sur');

  const memoire = TYPES_SITE.camp.indexeSur;
  try {
    TYPES_SITE.camp.indexeSur = 'rayon';
    assert.equal(
      valeurDe(lignesDuSite(site, depuis), 'Indexé sur'), ORIGINE_DU_NIVEAU.rayon,
      'la ligne ne suit pas `indexeSur` : l\'écran a sa propre table',
    );
  } finally {
    TYPES_SITE.camp.indexeSur = memoire;
  }
  assert.equal(valeurDe(lignesDuSite(site, depuis), 'Indexé sur'), avant, 'le montage n\'a pas rendu la table');

  // ⚠ ET LA TABLE DES LIBELLÉS COUVRE EXACTEMENT LES VALEURS D'`indexeSur`, dans
  // les DEUX sens : un troisième type indexé autrement ferait tomber cette
  // ligne, et obligerait à écrire sa phrase plutôt qu'à afficher un vide.
  const employees = new Set(Object.values(TYPES_SITE).map((t) => t.indexeSur));
  assert.deepEqual(
    [...employees].sort(), Object.keys(ORIGINE_DU_NIVEAU).sort(),
    'la table des origines et les valeurs d\'`indexeSur` ont divergé',
  );
  // Et un `indexeSur` sans libellé LÈVE, il ne rend pas un vide.
  try {
    TYPES_SITE.camp.indexeSur = 'inconnu';
    assert.throws(() => lignesDuSite(site, depuis), /n'a pas de libellé d'origine/);
  } finally {
    TYPES_SITE.camp.indexeSur = memoire;
  }
});

/**
 * Un toucher franc sur une case, à partir de ce que le halo a peint.
 *
 * ⚠⚠ LE MONTAGE NE CONNAÎT NI L'ORIGINE NI L'ÉCHELLE — le module ne les sort
 * pas, et leur ouvrir un accesseur pour les besoins d'un test mettrait dans
 * `src/` une porte que la production n'emploie pas. Le halo, lui, est peint À la
 * position de la base et À l'échelle courante : il donne les deux, telles que
 * l'écran les a employées, et toute autre case s'en déduit.
 *
 * ⚠ ET C'EST UN TOUCHER, PAS UN GLISSEMENT : `relacher` sort sur `glisse`, donc
 * les deux évènements portent le MÊME point.
 */
function toucher(canvas, halo, dpr, echelle, base, cible) {
  const epaisseur = Math.max(1, Math.round(echelle * EPAISSEUR_HALO));
  const coinX = halo.x - epaisseur / 2;
  const coinY = halo.y - epaisseur / 2;
  const point = {
    pointerId: 7,
    clientX: (coinX + (cible.colonne - base.colonne) * echelle + echelle / 2) / dpr,
    clientY: (coinY + (cible.rangee - base.rangee) * echelle + echelle / 2) / dpr,
  };
  canvas.envoyer('pointerdown', point);
  canvas.envoyer('pointerup', point);
}

/**
 * Une partie où les trois satellites sont parus autour de la base.
 *
 * ⚠⚠ ET ELLE PORTE UNE ARMÉE, SANS QUOI RIEN N'EST ATTAQUABLE — mesuré : une
 * partie neuve rend `problemes: ['sans-armee']` sur les trois satellites, donc
 * `entrerDansLaCible` refuse et le montage ne mesurerait que ce refus-là. La
 * pièce se pose par le MOTEUR, jamais en écrivant dans `etat.armee` : une pose à
 * la main sauterait `problemesDeLaPoseDEffectif`, et le montage garderait alors
 * une composition que le jeu n'accepte pas.
 */
function partiePeuplee(graine = 20260906, avecArmee = true) {
  const etat = creerEtat(graine);
  rattraperJeu(etat, TICKS_APPARITION);
  assert.equal(baseCourante(etat).satellites.presents.length, 3, 'montage : les trois n\'ont pas paru');
  // ⚠ ET LA CASERNE VA AVEC — lot PRODUCTION-EN-DÉFENSE. La règle est descendue
  // dans le modèle : sans elle, `poserEffectif` refuse la Meute et le montage
  // retomberait sur `sans-armee`, le refus même qu'il existe pour écarter.
  if (avecArmee) poserLesBatimentsDeProduction(etat);
  if (avecArmee) poserEffectif(etat, 'armee', { id: 'meute', vague: 1, colonne: 1, niveau: 1 });
  return etat;
}

/** La base de l'Ouvrage la plus proche AU-DELÀ de la portée d'un raid. */
function baseHorsDePortee(etat) {
  const base = baseCourante(etat).position;
  for (let r = base.rangee - 15; r > base.rangee - 80; r -= 1) {
    for (let c = 1; c <= GEOGRAPHIE.carte.largeur; c += 1) {
      if (estBaseOuvrage(etat.graine, r, c)) return { rangee: r, colonne: c };
    }
  }
  return null;
}

/** Ouvre le panneau sur un satellite, et rend ce qu'il faut pour le lire. */
function ouvrirSurUnSatellite(graine = 20260906) {
  const { doc, appels, dpr, parId } = fauxDocumentMonde();
  const entrees = [];
  const ecran = initialiserEcranMonde(doc, { surEntreeRaid: (c) => entrees.push(c) });
  const canvas = doc.getElementById('monde-canvas');
  const etat = partiePeuplee(graine);
  ecran.peindre(etat);

  const halo = cadreDuHalo(appels);
  const base = baseCourante(etat).position;
  const cible = baseCourante(etat).satellites.presents
    .find((s) => Math.abs(s.rangee - base.rangee) <= 1 && Math.abs(s.colonne - base.colonne) <= 1)
    ?? baseCourante(etat).satellites.presents[0];
  toucher(canvas, halo, dpr, ECHELLE_MAX, base, cible);
  return { doc, parId, canvas, ecran, etat, entrees, cible, halo, base, appels, dpr };
}

test('CARTE-C T10 — le bouton entre dans la cible OUVERTE, pas dans une autre', () => {
  const { parId, entrees, cible } = ouvrirSurUnSatellite();
  const panneau = parId.get('monde-panneau');
  assert.equal(panneau.hidden, false, 'montage : le panneau ne s\'est pas ouvert');

  const bouton = parId.get('monde-panneau-attaquer');
  assert.equal(bouton.hidden, false, 'le bouton Attaquer n\'apparaît pas sur une cible');
  assert.equal(bouton.disabled, false, 'le bouton est éteint sur une cible à portée');

  assert.deepEqual(entrees, [], 'montage : on est déjà entré avant de toucher le bouton');
  bouton.envoyer('click', {});
  assert.deepEqual(
    entrees, [{ rangee: cible.rangee, colonne: cible.colonne }],
    'le bouton n\'entre pas dans la cible que le panneau décrit',
  );
  // ⚠ ET LE PANNEAU SE FERME EN PARTANT, comme au second toucher : sinon il
  // resterait ouvert sur un site qu'on ne regarde plus.
  assert.equal(parId.get('monde-panneau').hidden, true, 'le panneau reste ouvert après l\'entrée');
});

test('CARTE-C T11 — pas de bouton actif sur sa propre base', () => {
  const { doc, appels, dpr, parId } = fauxDocumentMonde();
  const ecran = initialiserEcranMonde(doc);
  const canvas = doc.getElementById('monde-canvas');
  const etat = partiePeuplee();
  ecran.peindre(etat);
  const base = baseCourante(etat).position;
  toucher(canvas, cadreDuHalo(appels), dpr, ECHELLE_MAX, base, base);

  assert.equal(parId.get('monde-panneau').hidden, false, 'montage : le panneau de sa base ne s\'ouvre pas');
  assert.equal(parId.get('monde-panneau-attaquer').hidden, true,
    'le panneau de sa propre base propose de l\'attaquer');
  // Falsifiable : c'est bien le panneau de SA base — l'autre bouton y est.
  assert.equal(parId.get('monde-panneau-deplacer').hidden, false,
    'montage : ce n\'est pas le panneau de la base du joueur');
});

test('CARTE-C T12 — hors de portée, le bouton se voit et ne se touche pas', () => {
  const { doc, appels, dpr, parId } = fauxDocumentMonde();
  const ecran = initialiserEcranMonde(doc);
  const canvas = doc.getElementById('monde-canvas');
  const etat = partiePeuplee();
  ecran.peindre(etat);

  // ⚠⚠ ON DÉPENSE LES POINTS D'ATTAQUE PLUTÔT QUE DE FORGER UN `cout` : ce que le
  // bouton lit est `ciblage.cout === null`, qui vaut « hors de portée » — et un
  // manque de points, lui, NE DOIT PAS l'éteindre. Le montage porte donc les deux
  // moitiés : à portée sans le sou, il reste vif.
  etat.attaque.points = 0;
  const halo = cadreDuHalo(appels);
  const base = baseCourante(etat).position;
  const proche = baseCourante(etat).satellites.presents[0];
  toucher(canvas, halo, dpr, ECHELLE_MAX, base, proche);
  const bouton = parId.get('monde-panneau-attaquer');
  assert.equal(bouton.hidden, false, 'montage : le panneau ne s\'est pas ouvert sur une cible');
  assert.equal(bouton.disabled, false,
    'un manque de points éteint le bouton : « un indice n\'est pas une interdiction »');
  assert.equal(parId.get('monde-panneau-refus').hidden, false, 'montage : rien ne refuse');

  // ⚠ ET HORS DE PORTÉE, IL EST PRÉSENT **ET** DÉSACTIVÉ. Un test qui n'asserterait
  // que « pas cliquable » passerait sur un bouton retiré.
  const ciblage = ciblageDuSite(etat, proche);
  assert.notEqual(ciblage.cout, null, 'montage : la cible proche est déjà hors de portée');
});

/**
 * L'échelle courante, lue à l'écran plutôt que devinée.
 *
 * ⚠ `initialiserEcranMonde` ne sort ni l'origine ni l'échelle, et leur ouvrir un
 * accesseur pour un test mettrait dans `src/` une porte que la production
 * n'emploie pas. La bulle de `#monde-outils`, elle, ANNONCE l'échelle en pixels
 * CSS par case : c'est une sortie que le joueur lit, donc une mesure honnête.
 */
function echelleAffichee(doc, dpr) {
  const titre = doc.getElementById('monde-outils').title;
  const px = Number(titre.split(' ')[0]);
  assert.ok(Number.isFinite(px) && px > 0, `l'échelle annoncée est illisible : « ${titre} »`);
  return px * dpr;
}

/**
 * Promène la vue d'un glissement, et rend le halo tel qu'elle le peint ensuite.
 *
 * ⚠ UN GLISSEMENT, PAS UN TOUCHER : `relacher` sort sur `glisse`, donc le doigt
 * ne peut pas ouvrir un panneau en chemin. C'est ce que fait le joueur qui
 * remonte la carte jusqu'à une cible lointaine.
 */
function promener(canvas, appels, dxCss, dyCss) {
  const id = 11;
  canvas.envoyer('pointerdown', { pointerId: id, clientX: 200, clientY: 400 });
  const pas = 20;
  for (let i = 1; i <= pas; i += 1) {
    canvas.envoyer('pointermove', {
      pointerId: id,
      clientX: 200 + (dxCss * i) / pas,
      clientY: 400 + (dyCss * i) / pas,
    });
  }
  // ⚠ LE HALO SE RELÈVE SUR LA DERNIÈRE IMAGE SEULEMENT : `cadreDuHalo` exige
  // d'être seul dans `appels` pour prouver qu'il mesure bien le halo.
  appels.length = 0;
  canvas.envoyer('pointermove', { pointerId: id, clientX: 200 + dxCss, clientY: 400 + dyCss });
  const halo = cadreDuHalo(appels);
  canvas.envoyer('pointerup', { pointerId: id, clientX: 200 + dxCss, clientY: 400 + dyCss });
  return halo;
}

test('CARTE-C T12 bis — hors de portée : présent ET désactivé, mesuré à l\'écran', () => {
  // ⚠⚠ LA PREMIÈRE ÉCRITURE DE CE TEST LISAIT LA SOURCE, ET ELLE NE MESURAIT
  // RIEN DE CE QUI SE PEINT. Le hors-portée se prend sur un VRAI site lointain :
  // `ciblageDuSite` rend `cout: null` quand `problemesDuRaid` porte
  // « hors-portee », et le joueur y arrive en PROMENANT la carte — c'est le geste
  // que le montage rejoue.
  const { doc, appels, dpr, parId } = fauxDocumentMonde();
  const ecran = initialiserEcranMonde(doc);
  const canvas = doc.getElementById('monde-canvas');
  const etat = partiePeuplee();
  ecran.peindre(etat);

  const base = baseCourante(etat).position;
  const loin = baseHorsDePortee(etat);
  assert.ok(loin, 'montage : aucune base de l\'Ouvrage au-delà de la portée');
  assert.equal(ciblageDuSite(etat, loin).cout, null, 'montage : la cible lointaine est à portée');

  // ⚠⚠ ON DÉZOOME PLUTÔT QUE DE PROMENER, ET C'EST MESURÉ. Promener jusqu'à la
  // cible sort la BASE du cadre, donc le halo cesse d'être peint — et le halo est
  // la seule fenêtre honnête sur la vue. Au cran le plus large les deux tiennent
  // ensemble : une case y vaut `CRANS[0]` pixels, et quinze cases font moins d'un
  // tiers de la hauteur du canevas.
  pincer(canvas, CRANS[0] / ECHELLE_MAX);
  // ⚠ ET UN GLISSEMENT D'UN PIXEL FORCE L'IMAGE où le halo se relève : le
  // pincement se termine par des `pointercancel`, qui ne repeignent pas.
  const halo = promener(canvas, appels, 0, 1);
  const echelle = echelleAffichee(doc, dpr);
  assert.ok(echelle < ECHELLE_MAX, 'le pincement n\'a pas dézoomé : la cible reste hors du cadre');
  toucher(canvas, halo, dpr, echelle, base, loin);

  const bouton = parId.get('monde-panneau-attaquer');
  assert.equal(parId.get('monde-panneau').hidden, false, 'montage : le panneau ne s\'est pas ouvert sur la cible lointaine');
  assert.equal(parId.get('monde-panneau-titre').textContent, EMBLEMES_CARTE.base.nom,
    'montage : ce n\'est pas la base de l\'Ouvrage qui s\'est ouverte');
  // ⚠ PRÉSENT **ET** DÉSACTIVÉ. Un test qui n'asserterait que « pas cliquable »
  // passerait sur un bouton retiré, et un bouton absent laisserait le joueur
  // chercher ce qu'il a fait de travers.
  assert.equal(bouton.hidden, false, 'hors de portée, le bouton disparaît au lieu de s\'éteindre');
  assert.equal(bouton.disabled, true, 'hors de portée, le bouton reste touchable');
  // Et le panneau écrit pourquoi.
  assert.equal(parId.get('monde-panneau-refus').hidden, false, 'le panneau ne dit pas pourquoi');
});

test('CARTE-C T13 — le second toucher marche encore', () => {
  // ⚠ LE BOUTON S'AJOUTE, IL NE REMPLACE PAS. Le chemin d'origine reste vert, et
  // le commentaire d'`ouvrirPanneau` qui explique pourquoi il se COMPARE à la
  // case ouverte plutôt que de se compter n'a pas bougé.
  const { canvas, halo, base, cible, dpr, entrees } = ouvrirSurUnSatellite();
  assert.deepEqual(entrees, [], 'montage : on est entré au premier toucher');
  toucher(canvas, halo, dpr, ECHELLE_MAX, base, cible);
  assert.deepEqual(
    entrees, [{ rangee: cible.rangee, colonne: cible.colonne }],
    'le second toucher n\'entre plus dans la cible',
  );
});

test('CARTE-C T14 — le mode de déplacement éteint le bouton, et rien ne peut le rallumer', () => {
  // ⚠⚠ LE BRIEF DEMANDAIT QUE « ATTAQUER » DÉSARME LE DÉPLACEMENT. **MESURÉ, LA
  // QUESTION NE SE POSE PAS COMME ÇA**, et ce que le relevé a trouvé est plus
  // intéressant : `armerLeDeplacement` FERME le panneau puis le ROUVRE pour y
  // écrire son propre message — titre « Déplacer la base », corps vide. Le
  // panneau reste donc VISIBLE pendant que le mode est armé, ce que le brief ne
  // disait pas.
  //
  // ⚠⚠ CE QUI REND LE CAS IMPOSSIBLE EST DONC AUTRE CHOSE : `fermerPanneau` cache
  // le bouton Attaquer, et `armerLeDeplacement` ne le rouvre pas. Y appeler
  // `desarmerLeDeplacement` serait du code mort ; ce test garde les DEUX lignes
  // qui rendent le cas inatteignable, et il tombe le jour où l'une cède.
  const { doc, appels, dpr, parId } = fauxDocumentMonde();
  const ecran = initialiserEcranMonde(doc);
  const canvas = doc.getElementById('monde-canvas');
  const etat = partiePeuplee();
  ecran.peindre(etat);
  const base = baseCourante(etat).position;
  // ⚠ LE HALO SE RELÈVE UNE FOIS : `appels` s'accumule d'une image à l'autre, et
  // `cadreDuHalo` exige d'être seul pour prouver qu'il mesure bien le halo.
  const halo = cadreDuHalo(appels);
  toucher(canvas, halo, dpr, ECHELLE_MAX, base, base);
  assert.equal(parId.get('monde-panneau').hidden, false, 'montage : le panneau ne s\'est pas ouvert');

  parId.get('monde-panneau-deplacer').envoyer('click', {});
  // ⚠ LE PANNEAU RESTE OUVERT — c'est le mode qui s'y écrit. Relevé, pas supposé.
  assert.equal(parId.get('monde-panneau').hidden, false,
    'le mode de déplacement n\'écrit plus dans le panneau : le montage ne mesure plus rien');
  assert.equal(parId.get('monde-panneau-titre').textContent, 'Déplacer la base');
  // ⚠ ET LE BOUTON EST ÉTEINT, parce que `fermerPanneau` l'a caché et que
  // l'armement ne le rouvre pas. C'est la première des deux lignes.
  assert.equal(parId.get('monde-panneau-attaquer').hidden, true,
    'le bouton Attaquer survit à l\'armement du déplacement');

  // ⚠ ET RIEN NE PEUT LE RALLUMER TANT QUE LE MODE EST ARMÉ : c'est la seconde.
  // Un toucher sur un site pose la base au lieu d'ouvrir son panneau.
  const cible = baseCourante(etat).satellites.presents[0];
  toucher(canvas, halo, dpr, ECHELLE_MAX, base, cible);
  assert.equal(parId.get('monde-panneau-attaquer').hidden, true,
    'un toucher a rouvert un panneau de site pendant que le déplacement est armé');

  // Et la garde de source qui dit POURQUOI, dans les deux fonctions concernées.
  const source = sansCommentaires(lire('src', 'ui', 'monde.js'));
  assert.match(extraireFonction(source, 'fermerPanneau'), /panneauAttaquer\.hidden = true;/,
    '`fermerPanneau` ne cache plus le bouton Attaquer');
  assert.match(extraireFonction(source, 'relacher'), /if \(modeDeplacement\) \{[\s\S]{0,120}?return;/,
    'le mode de déplacement ne prend plus la main avant l\'ouverture d\'un panneau');
});

test('CARTE-C T1 bis — et l\'écran peint bien une flèche qui reste dans le cadre', () => {
  // ⚠⚠ LES TESTS PURS NE PROUVENT QUE LA FONCTION, PAS LE CHEMIN — c'est le proxy
  // que le dépôt a déjà payé plusieurs fois. Sans celui-ci, retirer l'appel à
  // `traitRogne` dans `dessinerFleche` laisserait T1 à T5 entièrement verts
  // pendant que la pointe repartirait hors écran.
  //
  // ⚠ LE CADRE EST PETIT EXPRÈS : à `ECHELLE_MAX` une case fait 256 pixels de
  // buffer, donc un canevas de 100 × 200 CSS à densité 3 en montre à peine plus
  // d'une. Une cible à deux cases est alors dehors à coup sûr, et c'est ce que le
  // montage doit garantir avant de mesurer.
  const { doc, appels, dpr, parId } = fauxDocumentMonde({ largeurCss: 100, hauteurCss: 200 });
  const ecran = initialiserEcranMonde(doc);
  const canvas = doc.getElementById('monde-canvas');
  const etat = partiePeuplee();
  ecran.peindre(etat);

  const halo = cadreDuHalo(appels);
  const base = baseCourante(etat).position;
  const cible = baseCourante(etat).satellites.presents[0];
  toucher(canvas, halo, dpr, ECHELLE_MAX, base, cible);
  assert.equal(parId.get('monde-panneau').hidden, false, 'montage : le panneau ne s\'est pas ouvert');

  // La cible est bien HORS du cadre : sans ça, il n'y a rien à rogner.
  const centreCible = {
    x: halo.x + (cible.colonne - base.colonne) * ECHELLE_MAX,
    y: halo.y + (cible.rangee - base.rangee) * ECHELLE_MAX,
  };
  assert.ok(
    centreCible.x < 0 || centreCible.y < 0
      || centreCible.x > canvas.width || centreCible.y > canvas.height,
    `la cible est dans le cadre (${centreCible.x}, ${centreCible.y}) : le montage ne mesure rien`,
  );

  // ⚠ ET ON MESURE CE QUI A ÉTÉ PEINT : tous les points du tracé tiennent dans le
  // canevas, à un pixel près — l'épaisseur du trait mord un peu de chaque côté.
  const points = appels.filter((a) => a.nom === 'moveTo' || a.nom === 'lineTo');
  assert.ok(points.length >= 2, 'aucune flèche n\'a été peinte : le montage ne mesure rien');
  for (const { nom, args: [x, y] } of points) {
    assert.ok(x >= -1 && x <= canvas.width + 1 && y >= -1 && y <= canvas.height + 1,
      `${nom}(${x}, ${y}) sort du canevas de ${canvas.width} × ${canvas.height}`);
  }

  // ⚠⚠ ET LES BORNES SONT CELLES DU CANEVAS, CE QUE LE MONTAGE SEUL NE DIT PAS —
  // mesuré. Sur cette graine les trois satellites sont AU-DESSUS et À GAUCHE de
  // la base, donc la flèche ne sort que par les bords 0 : une falsification qui
  // remplace `canvas.width, canvas.height` par `Infinity, Infinity` laisse ce
  // test VERT, les deux bords zéro rognant encore. La ligne suivante ferme le
  // trou, et le rapport le déclare.
  assert.match(
    extraireFonction(sansCommentaires(lire('src', 'ui', 'monde.js')), 'dessinerFleche'),
    /traitRogne\([\s\S]{0,200}?traitDeLaFleche\([\s\S]{0,200}?canvas\.width, canvas\.height/,
    'la flèche n\'est plus rognée sur les dimensions du canevas',
  );
});
