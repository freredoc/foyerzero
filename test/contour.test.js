// Le mur de contour d'une base : sa géométrie, sa projection, et ses images —
// lot MURS-OUVRAGE, 03/09.
//
// ⚠⚠ CE FICHIER GARDE CE QUE `chantier.test.js` NE PEUT PAS. Celui-là garde
// l'écran de la BASE : un anneau posé en fonds CSS sur une grille de DOM. Le
// même anneau se dessine désormais sur le CANEVAS de l'écran de raid, autour de
// la base de l'Ouvrage — Ethan, 03/09 : « c'est pour le joueur et pour
// l'ouvrage ». Ce qui se garde ici, c'est ce qui est COMMUN aux deux : la
// géométrie du module, la place que la projection lui réserve, et le fait que
// les images qu'il nomme existent vraiment dans le livrable.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GRILLE } from '../src/data/combat.js';
import { COTE_SPRITE } from '../src/data/atlas.js';
import {
  tuilesDuContour, nomsDuContour, CAMP_DU_PROPRIETAIRE,
  LONGUEUR_DU_MUR, NB_VARIANTES_DU_MUR,
  BANDE_DU_CONTOUR, BANDE_DE_FIN_DU_CONTOUR,
} from '../src/render/contour.js';
import {
  calculerProjection, xDeColonne, yDeRangee, yDeLigneEcran, caseDepuisPixels,
} from '../src/render/projection.js';
import { ligneEcranDeLaRangee, ligneEcranDeLaBande } from '../src/render/orientation.js';
import { listeDuContour, listeAffichage } from '../src/render/scene.js';
import { creerCombat } from '../src/sim/combat.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (...bouts) => readFileSync(join(RACINE, ...bouts), 'utf8');

/**
 * ⚠ UNE GARDE QUI LIT CE QU'ON A ÉCRIT À SON SUJET NE GARDE RIEN. Le
 * commentaire de `render/contour.js` NOMME `etat.rng` pour dire qu'il n'y
 * touche pas ; la première écriture de T6 tombait dessus. C'est la quatrième
 * fois que le dépôt commet cette faute-là — après `viewport-fit=cover`,
 * `MENTION_SATURE` et `variante.js`.
 */
const sansCommentaires = (texte) => texte
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

/** Un montage minimal : ce qu'il faut pour que `creerCombat` accepte. */
function montage(proprietaireDefense) {
  return {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [{ id: proprietaireDefense === 'joueur' ? 'chantierDeConstruction' : 'gangue', rangee: 18, colonne: 5 }],
    defenseurs: [{ id: 'casemate', rangee: 3, colonne: 5 }],
    vagues: [[{ id: 'meute', colonne: 5 }]],
    proprietaireDefense,
    // ⚠ `creerCombat` REFUSE QUE LES DEUX CAMPS SOIENT DU MÊME PROPRIÉTAIRE —
    // « personne ne s'attaque soi-même ». Le montage où le joueur DÉFEND est
    // donc celui d'un assaut de l'Ouvrage, comme le monte `sim/raid-ouvrage.js`.
    proprietaireAttaque: proprietaireDefense === 'joueur' ? 'ouvrage' : 'joueur',
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] },
    },
  };
}

// ---------------------------------------------------------------------------
// T1 — la direction des dépendances, qui est la raison même du déménagement
// ---------------------------------------------------------------------------

test('CONTOUR T1 — `render/` n\'importe RIEN de `ui/`, et c\'est pourquoi le mur a déménagé', () => {
  // ⚠⚠ C'EST LA GARDE QUI JUSTIFIE LE LOT. `tuilesDuContour` vivait dans
  // `ui/chantier.js` tant qu'un seul écran s'en servait ; l'écran de raid est un
  // canevas, donc il passe par `render/scene.js`, qui n'a pas le droit de
  // remonter vers `ui/`. La solution paresseuse aurait été de retourner la
  // flèche « juste pour un mur » — et le moteur de rendu serait devenu une
  // dépendance de l'écran de la base.
  const dossier = join(RACINE, 'src', 'render');
  const fautifs = [];
  for (const fichier of readdirSync(dossier).filter((f) => f.endsWith('.js'))) {
    const source = lire('src', 'render', fichier);
    if (/from\s+'\.\.\/ui\//.test(source)) fautifs.push(fichier);
  }
  assert.deepEqual(fautifs, [],
    'un module de render/ importe ui/ : la direction des dépendances est retournée');

  // ⚠ FALSIFIABLE : le motif reconnaît bien la faute qu'il cherche. Sans cet
  // appât, une expression cassée laisserait la garde verte pour toujours.
  assert.match("import { X } from '../ui/chantier.js';", /from\s+'\.\.\/ui\//);

  // Et le module est bien là où on croit : c'est `render/contour.js` qui porte
  // la géométrie, `ui/chantier.js` ne fait que la ré-exporter.
  const chantier = lire('src', 'ui', 'chantier.js');
  assert.match(chantier, /export \{[^}]*tuilesDuContour[^}]*\} from '\.\.\/render\/contour\.js';/s,
    'ui/chantier.js n\'expose plus le contour depuis render/ : la géométrie a été recopiée');
  assert.ok(!/export function tuilesDuContour/.test(chantier),
    'ui/chantier.js a repris une définition de `tuilesDuContour` : deux listes qui divergeront');
});

// ---------------------------------------------------------------------------
// T2 — sans anneau, la projection est celle d'avant, au caractère près
// ---------------------------------------------------------------------------

test('CONTOUR T2 — `contour = 0` rend EXACTEMENT l\'ancienne projection', () => {
  // ⚠⚠ C'EST CE QUI LAISSE LE BANC ET SES MESURES DE PIXELS INTACTS. La formule
  // est refaite ici — pas recopiée depuis le module — pour qu'un changement de
  // `calculerProjection` ait à passer devant elle.
  for (const [W, H] of [[412, 900], [412, 800], [360, 640], [800, 800], [1080, 2100]]) {
    const p = calculerProjection(W, H);
    const t = Math.floor(Math.min(W / GRILLE.largeur, H / GRILLE.longueur));
    assert.equal(p.tailleCase, t, `${W}×${H} : la taille de case a bougé sans anneau`);
    assert.equal(p.margeX, Math.floor((W - GRILLE.largeur * t) / 2));
    assert.equal(p.margeY, Math.floor((H - GRILLE.longueur * t) / 2));
    assert.equal(p.contour, 0);
  }
  // Un anneau qui n'est pas 0 ou 1 LÈVE : un `true` passé par mégarde vaudrait
  // 1 après coercition, et une projection à demi ceinte ne se verrait nulle part.
  assert.throws(() => calculerProjection(412, 900, 2), /anneau de contour/);
  assert.throws(() => calculerProjection(412, 900, true), /anneau de contour/);
});

// ---------------------------------------------------------------------------
// T3 — avec anneau : la case rétrécit, le contenu ne bouge pas de repère
// ---------------------------------------------------------------------------

test('CONTOUR T3 — l\'anneau tient DANS le canevas, et le contenu garde ses formules', () => {
  const pieces = tuilesDuContour('j');
  for (const [W, H] of [[412, 900], [360, 640], [800, 800], [1080, 2100]]) {
    const p = calculerProjection(W, H, 1);
    const t = p.tailleCase;

    // La case rétrécit : c'est le prix du mur, et il se mesure.
    assert.ok(t <= calculerProjection(W, H).tailleCase,
      `${W}×${H} : l'anneau n'a rien coûté — il n'a donc pas été réservé`);

    // ⚠ LE CONTENU GARDE SES REPÈRES : la colonne 1 tombe en `margeX`, la
    // rangée `GRILLE.longueur` en `margeY`. Sans ça, chaque appelant de
    // `xDeColonne` aurait eu à connaître l'anneau.
    assert.equal(xDeColonne(p, 1), p.margeX);
    assert.equal(yDeRangee(p, GRILLE.longueur), p.margeY);

    // ⚠⚠ ET L'ANNEAU NE SORT PAS DU CANEVAS. C'est la seule faute que cette
    // géométrie puisse commettre : un mur dessiné hors du buffer ne lève pas,
    // il ne se voit simplement pas — et sur un seul des quatre côtés.
    for (const piece of pieces) {
      const x = xDeColonne(p, piece.x);
      const y = yDeLigneEcran(p, piece.y);
      assert.ok(x >= 0, `${W}×${H} : ${piece.nom} sort par la gauche (${x})`);
      assert.ok(y >= 0, `${W}×${H} : ${piece.nom} sort par le haut (${y})`);
      assert.ok(x + piece.l * t <= W, `${W}×${H} : ${piece.nom} sort par la droite`);
      assert.ok(y + piece.h * t <= H, `${W}×${H} : ${piece.nom} sort par le bas`);
    }
  }

  // ⚠ ET LA RÉCIPROQUE RESTE STRICTE : un doigt posé sur le mur n'a désigné
  // aucune case. L'anneau n'est pas cliquable, et il ne doit pas le devenir en
  // silence — `caseDepuisPixels` sert le pointage du banc.
  const p = calculerProjection(412, 900, 1);
  assert.equal(caseDepuisPixels(p, xDeColonne(p, 0) + 1, p.margeY + 1), null);
  // Témoin : la même fonction désigne bien une case du contenu.
  assert.deepEqual(caseDepuisPixels(p, p.margeX + 1, p.margeY + 1),
    { rangee: GRILLE.longueur, colonne: 1 });
});

// ---------------------------------------------------------------------------
// T4 — la ligne d'écran et la rangée disent la même chose
// ---------------------------------------------------------------------------

test('CONTOUR T4 — `yDeLigneEcran` et `yDeRangee` s\'accordent sur toute la grille', () => {
  // ⚠ DEUX FORMULES POUR UNE GÉOMÉTRIE, DONC UNE OCCASION DE DIVERGER. La
  // seconde existe parce que l'anneau a une ligne ZÉRO, qu'aucune rangée
  // n'occupe ; sur le domaine commun elles doivent coïncider terme à terme.
  const p = calculerProjection(412, 900, 1);
  for (let rangee = 1; rangee <= GRILLE.longueur; rangee += 1) {
    assert.equal(yDeLigneEcran(p, ligneEcranDeLaRangee(rangee)), yDeRangee(p, rangee),
      `rangée ${rangee} : les deux repères d'ordonnée ont divergé`);
  }
  // Et la ligne 0 est bien une case AU-DESSUS de la première : c'est là que le
  // mur du fond court, et aucune rangée ne peut l'exprimer.
  assert.equal(yDeLigneEcran(p, 0), yDeRangee(p, GRILLE.longueur) - p.tailleCase);
});

// ---------------------------------------------------------------------------
// T5 — l'anneau : forme, pavage, et rien sur le contenu
// ---------------------------------------------------------------------------

test('CONTOUR T5 — le U ceint les deux bandes, ne recouvre rien, et ne se recouvre pas', () => {
  const bandeHaute = GRILLE.bandes[BANDE_DU_CONTOUR];
  const fin = ligneEcranDeLaBande(GRILLE.bandes[BANDE_DE_FIN_DU_CONTOUR]);
  const { premiereLigne } = ligneEcranDeLaBande(bandeHaute);
  const haut = premiereLigne - 1;
  const nbLignes = fin.premiereLigne + fin.nbLignes - premiereLigne;

  for (const camp of ['j', 'o']) {
    const pieces = tuilesDuContour(camp);

    // Aucune pièce ne mord sur une case de contenu — c'est ce qui distingue
    // l'anneau de la v1, qui était à cheval sur le bord.
    for (const piece of pieces) {
      const surLeHaut = piece.y === haut;
      const surUnFlanc = piece.x === 0 || piece.x === GRILLE.largeur + 1;
      assert.ok(surLeHaut || surUnFlanc,
        `${camp} : la pièce (${piece.x}, ${piece.y}) est dans le contenu`);
    }

    // La rangée du haut pave EXACTEMENT `largeur + 2` cases, sans trou ni
    // recouvrement : la somme se refait, elle ne se croit pas.
    const dessus = pieces.filter((p) => p.y === haut).sort((a, b) => a.x - b.x);
    assert.equal(dessus.reduce((s, p) => s + p.l, 0), GRILLE.largeur + 2);
    let attendu = 0;
    for (const piece of dessus) {
      assert.equal(piece.x, attendu, `${camp} : trou ou recouvrement en x = ${attendu}`);
      attendu += piece.l;
    }
    // Les deux coins sont des BLOCS : un mur de quatre cases y déborderait.
    assert.ok(dessus[0].nom.includes('_bloc_') && dessus.at(-1).nom.includes('_bloc_'));
    // Et il y a bien au moins un vrai mur : sinon le pavage n'en poserait
    // jamais et `LONGUEUR_DU_MUR` ne mesurerait rien.
    assert.ok(dessus.some((p) => p.l === LONGUEUR_DU_MUR),
      `${camp} : aucun mur de ${LONGUEUR_DU_MUR} cases — le pavage ne pave rien`);

    // Les flancs descendent d'un bord à l'autre, et le bas reste OUVERT.
    for (const x of [0, GRILLE.largeur + 1]) {
      const flanc = pieces.filter((p) => p.x === x).map((p) => p.y).sort((a, b) => a - b);
      assert.deepEqual(flanc, Array.from({ length: nbLignes + 1 }, (_, i) => haut + i),
        `${camp} : le flanc en x = ${x} a un trou ou dépasse`);
    }
    assert.equal(pieces.filter((p) => p.y === haut + nbLignes + 1).length, 0,
      `${camp} : le U s'est refermé en bas — l'assaut n'a plus par où entrer`);

    // ⚠⚠ LA COÏNCIDENCE EST TERMINÉE — voir la même assertion, plus détaillée,
    // dans `chantier.test.js`. Elle était déclarée « ne mordant pas » depuis le
    // lot MURS et annonçait sa propre chute ; les flancs descendent maintenant
    // sur le déploiement, la défense est la bande du MILIEU, et additionner les
    // deux bandes nommées ne redonne plus la hauteur.
    assert.notEqual(nbLignes, ligneEcranDeLaBande(bandeHaute).nbLignes + fin.nbLignes,
      `${camp} : la somme des deux bandes nommées redonne la hauteur — le flanc `
      + 'a cessé d\'en enjamber une troisième');
  }

  // Un camp inconnu LÈVE : un mur muet serait un pan de base absent.
  assert.throws(() => tuilesDuContour('x'), /camp de contour/);
});

test('CONTOUR T6 — l\'anneau est STABLE et ne touche pas au tirage de la partie', () => {
  // Deux appels rendent le même mur : la variante se hache sur la POSITION, pas
  // sur un flux. Un mur qui bougerait d'une image à l'autre scintillerait.
  assert.deepEqual(tuilesDuContour('o'), tuilesDuContour('o'));
  // Et les quatre variantes de bloc servent toutes : en poser quatre au dépôt
  // pour n'en employer que deux, c'est du poids payé pour rien.
  const varientes = new Set(tuilesDuContour('o')
    .filter((p) => p.nom.includes('_bloc_')).map((p) => p.nom));
  assert.equal(varientes.size, NB_VARIANTES_DU_MUR,
    `l'anneau n'emploie que ${varientes.size} variantes de bloc sur ${NB_VARIANTES_DU_MUR}`);
  // `render/contour.js` ne lit aucun état : la garde est celle de `variante.js`,
  // reprise ici parce que le module est neuf.
  assert.ok(!/etat\.rng/.test(sansCommentaires(lire('src', 'render', 'contour.js'))),
    'render/contour.js touche au flux de la partie : le mur décalerait tous les tirages');
  // ⚠ ET L'APPÂT, sans quoi un `sansCommentaires` trop gourmand rendrait la
  // garde muette pour toujours : le motif reconnaît encore la vraie faute.
  assert.ok(/etat\.rng/.test(sansCommentaires('const t = etat.rng.suivant();')));
  assert.ok(!/etat\.rng/.test(sansCommentaires('// il ne touche pas etat.rng')));
});

// ---------------------------------------------------------------------------
// T7 — la scène : le mur du bon camp, au bon endroit, et seulement avec anneau
// ---------------------------------------------------------------------------

test('CONTOUR T7 — la scène dessine le mur du PROPRIÉTAIRE DE LA DÉFENSE', () => {
  const p = calculerProjection(412, 900, 1);

  // ⚠⚠ MESURÉ DES DEUX CÔTÉS, ET C'EST LA MOITIÉ QUI COMPTE. Écrire `'o'` en
  // dur aurait passé le test de l'Ouvrage et donné un mur violet à la base du
  // joueur le jour où `sim/raid-ouvrage.js` ouvrira son écran. Même leçon que
  // `pointsRecherche` au lot MODULES-E.
  for (const [proprietaire, prefixe] of [['ouvrage', 'bord_o_'], ['joueur', 'bord_j_']]) {
    const liste = listeAffichage(creerCombat(montage(proprietaire)), p, null, 0);
    const murs = liste.filter((q) => q.forme === 'sprite' && q.nom.startsWith('bord_'));
    assert.equal(murs.length, tuilesDuContour(CAMP_DU_PROPRIETAIRE[proprietaire]).length,
      `${proprietaire} : l'anneau n'est pas entier sur le champ de bataille`);
    assert.ok(murs.every((q) => q.nom.startsWith(prefixe)),
      `${proprietaire} : le mur porte les couleurs de l'autre camp`);

    // Le mur passe APRÈS le fond et AVANT tout le reste — les trois étages de
    // l'écran de la base : le sol, le mur, les pièces.
    const premierMur = liste.findIndex((q) => q.forme === 'sprite' && q.nom.startsWith('bord_'));
    const premiereEntite = liste.findIndex(
      (q) => q.forme === 'sprite' && !q.nom.startsWith('bord_'));
    assert.equal(liste[0].forme, 'rect', 'le fond n\'ouvre plus la liste');
    assert.ok(premierMur < premiereEntite,
      `${proprietaire} : le mur passe par-dessus les pièces`);
  }

  // ⚠⚠ SANS ANNEAU RÉSERVÉ, AUCUN MUR — et c'est ce qui laisse `ui/banc.js`
  // intact. Un mur dessiné sur une projection qui ne lui a rien réservé
  // déborderait sur la première colonne de contenu.
  assert.deepEqual(listeDuContour('ouvrage', calculerProjection(412, 900)), []);
  const sansAnneau = listeAffichage(creerCombat(montage('ouvrage')),
    calculerProjection(412, 900), null, 0);
  assert.equal(sansAnneau.filter((q) => q.forme === 'sprite' && q.nom.startsWith('bord_')).length, 0);
  assert.throws(() => listeDuContour('personne', p), /propriétaire de contour/);
});

test('CONTOUR T8 — le banc projette SANS anneau, et c\'est pourquoi ses mesures tiennent', () => {
  // ⚠ LE BANC N'EST PAS UN OUBLI. Il est derrière un geste de debug, il monte
  // des combats à la main, et une douzaine de ses assertions portent des
  // positions en pixels. Lui réserver l'anneau les aurait toutes déplacées pour
  // un mur que personne ne lui a demandé. Le jour où on l'y met, c'est cette
  // ligne-ci qui le dira.
  assert.match(lire('src', 'ui', 'banc.js'), /calculerProjection\(largeur, hauteur\)/,
    'le banc a pris un anneau : ses mesures de pixels sont à refaire');
  assert.match(lire('src', 'ui', 'raid.js'), /calculerProjection\(largeur, hauteur, 1\)/,
    'l\'écran de raid ne réserve plus l\'anneau : le mur déborde sur le contenu');
});

// ---------------------------------------------------------------------------
// T9 — les images : produites, inlinées, et de la taille que la scène suppose
// ---------------------------------------------------------------------------

test('CONTOUR T9 — les six images de chaque camp existent, et pas une de plus n\'est payée', () => {
  const manifeste = JSON.parse(lire('art', 'sprites', 'bord', 'bord-empreintes.json'));
  const html = lire('src', 'index.src.html');
  const build = lire('tools', 'build.js');

  for (const camp of ['j', 'o']) {
    const noms = nomsDuContour(camp);
    assert.equal(noms.length, 6,
      `${camp} : l'anneau emploie ${noms.length} dessins — la liste inlinée est à revoir`);
    for (const nom of noms) {
      assert.ok(manifeste.sprites[nom],
        `${nom} : l'anneau nomme une image que tools/bords.py ne produit pas`);
      // ⚠ LE MARQUEUR EST ÉCRIT À LA MAIN DANS LE BUILD, donc il se confronte.
      const marqueur = `%${nom.replace(/^bord_/, 'MUR_').toUpperCase()}%`;
      assert.ok(build.includes(marqueur), `${marqueur} manque à tools/build.js`);
      assert.ok(html.includes(marqueur), `${marqueur} n'est employé nulle part dans le balisage`);
    }
    // ⚠ ET DANS L'AUTRE SENS : aucune image du camp n'est inlinée pour rien.
    // `mur_3` et `mur_4` sont produites et n'entrent pas — le U d'une base de
    // neuf colonnes n'a que deux créneaux.
    for (const nom of Object.keys(manifeste.sprites)) {
      if (!nom.startsWith(`bord_${camp}_`) || noms.includes(nom)) continue;
      const marqueur = `%${nom.replace(/^bord_/, 'MUR_').toUpperCase()}%`;
      assert.ok(!build.includes(marqueur),
        `${marqueur} est inliné pour rien : l'anneau ne pose pas ${nom}`);
    }
  }

  // ⚠⚠ LES DEUX CAMPS PASSENT PAR DES CHEMINS DIFFÉRENTS, ET C'EST VOULU. Le
  // joueur en fonds CSS pour l'écran de la base ; l'Ouvrage en balises `img`
  // pour le canevas de l'écran de raid, `drawImage` voulant un élément. Aucun
  // dessin n'est partagé, donc rien n'est inliné deux fois.
  for (const nom of nomsDuContour('j')) {
    assert.match(html, new RegExp(`--mur-${nom.slice(5).replaceAll('_', '-')}: url`),
      `${nom} n'a pas de variable CSS`);
  }
  for (const nom of nomsDuContour('o')) {
    assert.match(html, new RegExp(`id="${nom.replaceAll('_', '-')}"[^>]*src="%MUR_`),
      `${nom} n'a pas de balise img porteuse de son marqueur`);
    assert.match(lire('src', 'ui', 'session.js'), /nomsDuContour\('o'\)/,
      'atlasDeLaScene ne dérive plus ses images de l\'anneau');
  }

  // ⚠ LA TAILLE SOURCE DE LA PRIMITIVE SE CONFRONTE AUX FICHIERS. `scene.js` la
  // calcule sur `COTE_SPRITE` faute de pouvoir lire une image ; si le dessin
  // changeait de définition, `drawImage` découperait un coin du mur et
  // personne ne lèverait.
  const p = calculerProjection(412, 900, 1);
  for (const primitive of listeDuContour('ouvrage', p)) {
    const dit = manifeste.sprites[primitive.nom];
    assert.equal(primitive.sl, dit.largeur, `${primitive.nom} : largeur source fausse`);
    assert.equal(primitive.sh, dit.hauteur, `${primitive.nom} : hauteur source fausse`);
    assert.equal(dit.hauteur, COTE_SPRITE);
    assert.equal(primitive.sx, 0);
    assert.equal(primitive.sy, 0);
  }
});
