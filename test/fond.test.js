// Le fond peint d'une base : son choix, sa géométrie, et ses images — lot
// MUR-PEINT, 03/09.
//
// ⚠⚠ CE FICHIER REMPLACE `test/contour.test.js`, IL N'EN DÉRIVE PAS. Celui-là
// gardait un ANNEAU de quarante et une pièces que le code dessinait case par
// case autour de la base, sur les deux écrans. Ethan a fait peindre le mur DANS le fond : il n'y
// a plus d'anneau, donc plus rien à garder de sa géométrie. Ses neuf tests
// n'ont pas été « ajustés » en changeant leurs valeurs attendues — ç'aurait été
// la faute que le brief nomme —, ils ont été retirés, et ceux-ci affirment le
// contraire.
//
// ⚠ CE QUI SE GARDE ICI EST CE QUI EST COMMUN AUX DEUX ÉCRANS : le choix du
// décor, la place que la projection lui réserve, et le fait que les deux écrans
// posent le MÊME fond au même endroit. Ce qui est propre à l'écran de la base
// reste dans `chantier.test.js`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GRILLE } from '../src/data/combat.js';
import { TYPES_SITE } from '../src/data/sites.js';
import {
  MUR_CASES, LARGEUR_EN_CASES, HAUTEUR_EN_CASES, HAUTEUR_IMAGE_EN_CASES,
  BANDE_SOUS_LE_MUR, FONDS, tousLesFonds, fondDeLaBase, rectangleDuFond,
  VARIABLE_DU_FOND, nomCssDuFond, SEL_FOND,
} from '../src/render/fond.js';
import {
  calculerProjection, xDeColonne, yDeRangee, caseDepuisPixels,
} from '../src/render/projection.js';
import { ligneEcranDeLaBande } from '../src/render/orientation.js';
import { listeDuFond, listeAffichage } from '../src/render/scene.js';
import { creerCombat } from '../src/sim/combat.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (...bouts) => readFileSync(join(RACINE, ...bouts), 'utf8');

/**
 * ⚠ UNE GARDE QUI LIT CE QU'ON A ÉCRIT À SON SUJET NE GARDE RIEN. Les
 * commentaires de ce lot NOMMENT l'anneau pour dire qu'il a disparu ; une garde
 * qui chercherait « contour » dans la source tomberait dessus. C'est la
 * cinquième fois que le dépôt paie cette faute — après `viewport-fit=cover`,
 * `MENTION_SATURE`, `variante.js` et `render/contour.js` lui-même.
 */
const sansCommentaires = (texte) => texte
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

/** Un montage minimal : ce qu'il faut pour que `creerCombat` accepte. */
function montage(proprietaireDefense) {
  return {
    niveau: 1,
    saveur: null,
    obstacles: [],
    batiments: [{
      id: proprietaireDefense === 'joueur' ? 'chantierDeConstruction' : 'gangue',
      rangee: 18,
      colonne: 5,
    }],
    defenseurs: [{ id: 'casemate', rangee: 3, colonne: 5 }],
    vagues: [[{ id: 'meute', colonne: 5 }]],
    proprietaireDefense,
    proprietaireAttaque: proprietaireDefense === 'joueur' ? 'ouvrage' : 'joueur',
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] }, joueur: { offense: [], defense: [] },
    },
  };
}

// ---------------------------------------------------------------------------
// T1 — l'anneau a disparu, et personne ne le rallume
// ---------------------------------------------------------------------------

test('FOND T1 — plus un appelant n\'allume l\'anneau, et le module a disparu', () => {
  // ⚠⚠ FALSIFICATION 1 DU BRIEF. Remettre un `1` au site d'appel de
  // `calculerProjection` doit faire tomber ce test — et c'est ce qui a été
  // vérifié en le remettant pour de bon.
  assert.ok(!existsSync(join(RACINE, 'src', 'render', 'contour.js')),
    'render/contour.js est revenu : l\'anneau se redessine');

  // ⚠ ON LIT LA SOURCE DÉCOMMENTÉE. Les commentaires du lot nomment l'anneau
  // pour dire qu'il n'existe plus ; les compter serait la faute du §6.
  for (const [dossier, fichier] of [['ui', 'raid.js'], ['ui', 'banc.js'], ['ui', 'chantier.js']]) {
    const source = sansCommentaires(lire('src', dossier, fichier));
    assert.ok(!/calculerProjection\([^)]*,\s*1\s*\)/.test(source),
      `${fichier} rallume l'anneau : il passe 1 à calculerProjection`);
    assert.ok(!/from '\.\.\/render\/contour\.js'/.test(source),
      `${fichier} importe encore render/contour.js`);
  }

  // ⚠ ET L'ÉCRAN DE RAID PASSE BIEN `MUR_CASES`, pas un nombre écrit à la main.
  // Un `0.5` en dur passerait l'assertion du dessus et ferait deux vérités.
  const raid = sansCommentaires(lire('src', 'ui', 'raid.js'));
  assert.match(raid, /calculerProjection\(largeur, hauteur, MUR_CASES\)/,
    'l\'écran de raid ne réserve plus la place du mur peint par MUR_CASES');
});

test('FOND T2 — plus une référence à `bord/` dans `src/`, et le dossier est sorti', () => {
  // ⚠⚠ FALSIFICATION 7 DU BRIEF. En réintroduire un fait tomber ce test.
  for (const dossier of ['data', 'sim', 'render', 'ui']) {
    for (const fichier of readdirSync(join(RACINE, 'src', dossier))) {
      const source = sansCommentaires(lire('src', dossier, fichier));
      assert.ok(!/bord_[jo]_/.test(source),
        `src/${dossier}/${fichier} nomme encore une pièce de mur`);
    }
  }
  const balisage = lire('src', 'index.src.html');
  assert.ok(!/%MUR_[JO]_/.test(balisage), 'le balisage porte encore un marqueur de mur');
  assert.ok(!/MUR_[JO]_/.test(lire('tools', 'build.js')),
    'tools/build.js inline encore une pièce de mur');

  // ⚠ ET LES DIX-SEPT FICHIERS SONT MIS DE CÔTÉ, PAS SUPPRIMÉS — arbitrage
  // d'Ethan : « les `bord_*` ne sont pas supprimés ». Le brief annonçait
  // `art/sourcesstandby/bord/` comme un précédent existant ; il n'existait pas,
  // et c'est ce lot qui le crée. `art/sourcesstandby/` est le dossier que le
  // dépôt réserve à ce qui est au repos, et une garde d'`entrees.py` prouve
  // qu'aucun outil ne le lit.
  const range = join(RACINE, 'art', 'sourcesstandby', 'bord');
  assert.ok(existsSync(range), 'les pièces de mur ont été supprimées, pas mises de côté');
  assert.equal(readdirSync(range).length, 17,
    'art/sourcesstandby/bord/ ne porte plus les dix-sept fichiers de l\'anneau');
});

// ---------------------------------------------------------------------------
// T3 — la géométrie : une demi-case, une boîte de dix, le 1:1
// ---------------------------------------------------------------------------

test('FOND T3 — le mur vaut une DEMI-case, et la boîte en fait dix', () => {
  // ⚠⚠ FALSIFICATION 2 DU BRIEF : passer le mur à une case pleine, ou à zéro,
  // doit faire tomber cette mesure.
  assert.equal(MUR_CASES, 0.5);
  assert.equal(LARGEUR_EN_CASES, GRILLE.largeur + 1);
  assert.equal(LARGEUR_EN_CASES, 10);
  assert.equal(HAUTEUR_EN_CASES, GRILLE.longueur + 0.5);

  // ⚠ LE MUR NE FERME PAS LE BAS, et c'est la même règle qu'au temps de
  // l'anneau : le U s'ouvre sur les deux rangées de déploiement, par lesquelles
  // l'assaut arrive. La boîte gagne donc UNE demi-case en hauteur, pas deux.
  assert.equal(HAUTEUR_EN_CASES - GRILLE.longueur, MUR_CASES);
  assert.equal(LARGEUR_EN_CASES - GRILLE.largeur, 2 * MUR_CASES);
});

test('FOND T4 — à 1080 px de large, la case vaut 108 px et le décor tombe au 1:1', () => {
  // ⚠⚠ FALSIFICATION 3 DU BRIEF. Changer le nombre de cases de la boîte fait
  // tomber ce test : à 11 cases la case vaudrait 98, à 9 elle vaudrait 120.
  //
  // ⚠ 1080 EST LA LARGEUR PHYSIQUE D'UN TÉLÉPHONE À dpr 3, et c'est aussi celle
  // des huit planches. Le décor s'y affiche donc pixel pour pixel — ce qui est
  // exactement pourquoi Ethan a refusé de réduire la résolution.
  const p = calculerProjection(1080, 4000, MUR_CASES);
  assert.equal(p.tailleCase, 108);

  const r = rectangleDuFond(p);
  assert.equal(r.l, 1080, 'le décor ne couvre plus la largeur de la boîte');
  assert.equal(r.l, r.sl, 'le décor n\'est plus au 1:1 : destination et source diffèrent');
  assert.equal(r.h, r.sh, 'le décor n\'est plus au 1:1 en hauteur');

  // ⚠ ET IL PART DU COIN DE LA BOÎTE, PAS DE CELUI DU CONTENU. `margeX` pointe
  // sur la colonne 1 ; le mur peint est replié dans la marge, donc le décor
  // recule d'une demi-case.
  assert.equal(r.x, p.margeX - MUR_CASES * p.tailleCase);
  assert.equal(r.y, p.margeY - MUR_CASES * p.tailleCase);
});

test('FOND T5 — `murCases = 0` rend EXACTEMENT l\'ancienne projection', () => {
  // ⚠⚠ C'EST CE QUI LAISSE LE BANC D'ESSAI INTACT. Il projette sans mur peint —
  // il n'a pas de décor —, et une douzaine de ses assertions portent des
  // positions en pixels. Le paramètre doit donc rendre au caractère près ce que
  // la fonction rendait avant qu'il existe.
  for (const [l, h] of [[360, 560], [412, 820], [1080, 1920], [800, 400]]) {
    const sans = calculerProjection(l, h);
    assert.equal(sans.tailleCase, Math.floor(Math.min(l / GRILLE.largeur, h / GRILLE.longueur)));
    assert.equal(sans.margeX, Math.floor((l - GRILLE.largeur * sans.tailleCase) / 2));
    assert.equal(sans.margeY, Math.floor((h - GRILLE.longueur * sans.tailleCase) / 2));
    assert.equal(sans.murCases, 0);
  }

  // ⚠ ET LE BANC NE RÉSERVE RIEN, ce qui se lit dans sa source.
  const banc = sansCommentaires(lire('src', 'ui', 'banc.js'));
  assert.match(banc, /calculerProjection\(largeur, hauteur\)/,
    'le banc d\'essai s\'est mis à réserver la place d\'un mur');

  // ⚠ UN BOOLÉEN PASSÉ PAR MÉGARDE LÈVE, et c'est la garde que `contour`
  // portait déjà : `Number.isFinite(true)` rend `false`.
  assert.throws(() => calculerProjection(412, 900, true), /mur peint/);
  assert.throws(() => calculerProjection(412, 900, 2), /mur peint/);
});

test('FOND T6 — la case GROSSIT, et le contenu garde ses formules', () => {
  // ⚠⚠ LE GAIN DU LOT SE MESURE. L'anneau faisait la boîte 11 × 19, le mur peint
  // la fait 10 × 18,5 : la case grossit à surface d'écran égale.
  for (const [l, h] of [[360, 560], [412, 820], [1080, 1920]]) {
    const anneau = calculerProjection(l, h, 1);
    const peint = calculerProjection(l, h, MUR_CASES);
    assert.ok(peint.tailleCase >= anneau.tailleCase,
      `${l}×${h} : la case a rétréci en passant au mur peint`);
  }
  const p = calculerProjection(412, 820, MUR_CASES);
  assert.ok(p.tailleCase > calculerProjection(412, 820, 1).tailleCase,
    'le mur peint ne rend rien au champ de bataille');

  // ⚠⚠ ET LES FORMULES DU CONTENU N'ONT PAS BOUGÉ D'UN CARACTÈRE. La marge
  // pointe sur la colonne 1 et la rangée 18 ; c'est ce qui rend le paramètre
  // payable. On refait la formule au lieu de la recopier.
  assert.equal(xDeColonne(p, 1), p.margeX);
  assert.equal(yDeRangee(p, GRILLE.longueur), p.margeY);
  for (let colonne = 1; colonne <= GRILLE.largeur; colonne += 1) {
    assert.equal(xDeColonne(p, colonne), p.margeX + (colonne - 1) * p.tailleCase);
  }
  // Et le pointage retombe sur la case qu'on vise, mur peint compris.
  for (let colonne = 1; colonne <= GRILLE.largeur; colonne += 1) {
    const vu = caseDepuisPixels(p, xDeColonne(p, colonne) + 1, yDeRangee(p, 12) + 1);
    assert.deepEqual(vu, { rangee: 12, colonne });
  }
});

test('FOND T7 — le décor ne déplace AUCUNE rangée de jeu', () => {
  // ⚠⚠ FALSIFICATION 4 DU BRIEF. Les bandes sont du MODÈLE ; un décor est un
  // dessin, et il n'a pas le droit d'en bouger une. On confronte donc les
  // frontières de bande à `GRILLE`, qui n'a pas été touchée.
  assert.deepEqual(GRILLE.bandes.batiments, { premiere: 11, derniere: 18 });
  assert.deepEqual(GRILLE.bandes.defense, { premiere: 3, derniere: 10 });
  assert.deepEqual(GRILLE.bandes.deploiement, { premiere: 1, derniere: 2 });

  // ⚠ ET LA BANDE SOUS LE MUR EST TOUJOURS CELLE DES BÂTIMENTS. C'est la seule
  // chose que `render/contour.js` laisse derrière lui, et son unique lecteur est
  // `bornesDeDefilement`, qui s'en sert pour ne pas couper la bande de mur.
  assert.equal(BANDE_SOUS_LE_MUR, 'batiments');
  const bande = ligneEcranDeLaBande(GRILLE.bandes[BANDE_SOUS_LE_MUR]);
  const toutes = Object.values(GRILLE.bandes).map((b) => ligneEcranDeLaBande(b).premiereLigne);
  assert.equal(bande.premiereLigne, Math.min(...toutes),
    'la bande des bâtiments n\'est plus la première à l\'écran : le mur peint n\'est plus au-dessus d\'elle');

  // ⚠⚠ ET LA FIN DE LA BANDE TOMBE OÙ L'ART LA MET. Huit rangées de 108 px sous
  // une demi-case de mur : `54 + 8 × 108 = 918` px dans une planche de 2160. Le
  // brief l'a relevé sur la transition béton → terre peinte, et c'est cette
  // égalité-là qui dit que l'art a été composé pour cette grille.
  assert.equal(bande.nbLignes, 8);
  const COTE_SOURCE = 108;
  assert.equal(MUR_CASES * COTE_SOURCE + bande.nbLignes * COTE_SOURCE, 918);
});

// ---------------------------------------------------------------------------
// T8 — le tirage du décor
// ---------------------------------------------------------------------------

test('FOND T8 — le tirage est stable, il répartit, et un type inconnu LÈVE', () => {
  // ⚠⚠ FALSIFICATION 5 DU BRIEF, dans ses trois moitiés.
  //
  // 1. Deux rendus de la même base rendent le même fond.
  for (const [r, c] of [[295, 16], [12, 3], [150, 31]]) {
    assert.equal(fondDeLaBase('joueur', 'base', r, c), fondDeLaBase('joueur', 'base', r, c));
    assert.equal(fondDeLaBase('ouvrage', 'base', r, c), fondDeLaBase('ouvrage', 'base', r, c));
  }

  // 2. Deux bases distinctes ne rendent pas TOUTES le même — sinon le tirage
  // serait une constante déguisée, et les quatre décors du joueur seraient payés
  // pour qu'un seul paraisse.
  const vus = new Set();
  for (let r = 1; r <= 300; r += 1) {
    for (let c = 1; c <= GRILLE.largeur + 22; c += 1) vus.add(fondDeLaBase('joueur', 'base', r, c));
  }
  assert.equal(vus.size, FONDS.joueur.base.length,
    'le tirage du joueur n\'emploie pas ses quatre décors');
  const vusOuvrage = new Set();
  for (let r = 1; r <= 300; r += 1) {
    for (let c = 1; c <= 31; c += 1) vusOuvrage.add(fondDeLaBase('ouvrage', 'base', r, c));
  }
  assert.equal(vusOuvrage.size, FONDS.ouvrage.base.length);

  // 3. Un propriétaire ou un type inconnu LÈVE, il ne retombe pas sur un défaut.
  assert.throws(() => fondDeLaBase('martien', 'base', 1, 1), /propriétaire/);
  assert.throws(() => fondDeLaBase('joueur', 'camp', 1, 1), /n'a pas de site/);
  assert.throws(() => fondDeLaBase('ouvrage', 'chose', 1, 1), /n'a pas de site/);

  // ⚠ LES TYPES SONT CEUX DE `data/sites.js`, LUS ET NON RETAPÉS. Un type du
  // roster que la table des fonds ignorerait ferait lever l'écran de raid sur un
  // site parfaitement normal.
  for (const type of Object.keys(TYPES_SITE)) {
    assert.doesNotThrow(() => fondDeLaBase('ouvrage', type, 100, 10),
      `l'Ouvrage n'a pas de décor pour un site « ${type} »`);
  }

  // ⚠ ET `camp` COMME `avantPoste` PARTAGENT L'AUSTÈRE — la règle d'Ethan.
  assert.equal(fondDeLaBase('ouvrage', 'camp', 42, 7), 'fond_o_austere');
  assert.equal(fondDeLaBase('ouvrage', 'avantPoste', 42, 7), 'fond_o_austere');
});

test('FOND T9 — le tirage ne touche pas au flux de la partie', () => {
  // ⚠⚠ C'EST LA RÈGLE DE `render/variante.js`, ET ELLE VAUT ICI POUR LA MÊME
  // RAISON. Le PRNG de l'état est celui de la SIMULATION : y prendre un tirage
  // pour choisir un décor décalerait tout ce que le moteur tire ensuite, et la
  // partie cesserait de se rejouer à l'identique.
  //
  // ⚠ ON LIT LA SOURCE DÉCOMMENTÉE, parce que le module NOMME `etat.rng` dans
  // son commentaire pour dire qu'il n'y touche pas.
  const source = sansCommentaires(lire('src', 'render', 'fond.js'));
  assert.ok(!/etat\.rng|Math\.random/.test(source),
    'render/fond.js consomme le flux de la partie');

  // ⚠ ET LE SEL EST À LUI : les cinq autres sont pris, et reprendre l'un d'eux
  // corrélerait le décor d'une base à une décision de jeu prise ailleurs sur les
  // mêmes coordonnées.
  assert.equal(SEL_FOND, 5);
  const variante = lire('src', 'render', 'variante.js');
  assert.match(variante, /SEL_VARIANTE = 4/, 'les sels ont bougé : SEL_FOND doit suivre');
});

// ---------------------------------------------------------------------------
// T10 — les deux écrans posent le même décor
// ---------------------------------------------------------------------------

test('FOND T10 — la scène dessine le fond du PROPRIÉTAIRE DE LA DÉFENSE', () => {
  // ⚠⚠ JAMAIS `'ouvrage'` EN DUR. `sim/raid-ouvrage.js` monte des combats où la
  // défense appartient au JOUEUR : l'écrire en dur passerait le test
  // d'aujourd'hui et donnerait un décor de l'Ouvrage à la base du joueur le jour
  // où cet écran-là s'ouvrira. Même leçon que `pointsRecherche` au lot MODULES-E.
  const p = calculerProjection(412, 900, MUR_CASES);
  const raid = sansCommentaires(lire('src', 'ui', 'raid.js'));
  assert.match(raid, /fondDeLaBase\(\s*combat\.proprietaireDefense,/,
    'l\'écran de raid ne lit plus le propriétaire sur le montage');
  assert.ok(!/fondDeLaBase\(\s*'(ouvrage|joueur)'/.test(raid),
    'l\'écran de raid écrit un propriétaire en dur');

  // ⚠ ET LA PRIMITIVE EST BIEN POSÉE PAR LA SCÈNE, une et une seule.
  for (const proprietaire of ['joueur', 'ouvrage']) {
    const nom = fondDeLaBase(proprietaire, 'base', 50, 8);
    const liste = listeAffichage(creerCombat(montage(proprietaire)), p, null, 0, nom);
    const fonds = liste.filter((x) => x.forme === 'sprite' && x.famille === nom);
    assert.equal(fonds.length, 1, `le décor de ${proprietaire} n'est pas posé une fois`);
    // Le fond uni reste DESSOUS : le décor couvre la boîte, jamais les marges.
    assert.equal(liste[0].forme, 'rect', 'le fond uni a disparu de dessous le décor');
    assert.equal(liste[1], fonds[0], 'le décor ne se dessine plus juste après le fond uni');
  }

  // ⚠ ET SANS NOM, RIEN — c'est ce qui laisse le banc d'essai intact.
  assert.deepEqual(listeDuFond(null, p), []);
  const sansFond = listeAffichage(creerCombat(montage('ouvrage')), p, null, 0);
  assert.equal(sansFond.filter((x) => x.forme === 'sprite'
    && tousLesFonds().includes(x.famille)).length, 0,
  'un décor se dessine alors qu\'aucun n\'a été demandé');
});

test('FOND T11 — les deux écrans posent le MÊME décor, par la même table', () => {
  // ⚠⚠ UNE SEULE SOURCE DE VÉRITÉ, ET C'EST CE QUE LE BRIEF EXIGE : « deux écrans
  // qui dessinent la même liste, jamais deux listes qui finiront par diverger ».
  // L'écran de la base lit `VARIABLE_DU_FOND`, celui du raid passe par les
  // balises que `garnirLesAtlas` garnit depuis la même variable.
  const chantier = sansCommentaires(lire('src', 'ui', 'chantier.js'));
  assert.match(chantier, /VARIABLE_DU_FOND\[nomDuFond\]/,
    'l\'écran de la base ne lit plus la table des variables de fond');
  assert.match(chantier, /fondDeLaBase\('joueur', 'base', fondation\.rangee, fondation\.colonne\)/,
    'l\'écran de la base ne choisit plus son décor sur sa FONDATION');

  // ⚠⚠ LA CASE EST `fondation`, PAS `position`, ET C'EST UNE DÉCISION. C'est
  // l'IDENTITÉ de la base : elle ne bouge jamais, quand `position` change à
  // chaque redéploiement. Le décor tient donc à travers un déménagement.
  assert.ok(!/fondDeLaBase\([^)]*position\./.test(chantier),
    'le décor de la base suit sa position : il changera au premier déménagement');

  // ⚠ ET LES NOMS DE VARIABLE SE DÉRIVENT UNE FOIS. Deux dérivations feraient
  // qu'une balise chercherait `--fond-j-01` pendant que la feuille écrirait
  // autre chose, et `garnirLesAtlas` lèverait sur une variable vide.
  const feuille = lire('src', 'index.src.html');
  for (const nom of tousLesFonds()) {
    assert.equal(VARIABLE_DU_FOND[nom], `var(${nomCssDuFond(nom)})`);
    assert.ok(feuille.includes(`${nomCssDuFond(nom)}:`),
      `${nomCssDuFond(nom)} n'est pas déclarée dans la feuille`);
  }
});

test('FOND T12 — le décor de la base se met à l\'échelle par la même case', () => {
  // ⚠⚠ LES DEUX ÉCHELLES S'ÉCRIVENT DANS LA MÊME FONCTION, et c'est ce qui les
  // empêche de diverger au zoom. `--case-cote` dit la case, `--fond-taille` dit
  // le décor, et les deux sortent de `reglerCoteCase`. C'est la garde que le lot
  // RETOURS-DU-03-SOIR avait écrite pour `--sol-pave`, reprise pour son
  // remplaçant.
  const source = sansCommentaires(lire('src', 'ui', 'chantier.js'));
  const poses = [...source.matchAll(/setProperty\(\s*'--(case-cote|fond-taille)'/g)]
    .map((m) => m[1]);
  assert.deepEqual(poses.sort(), ['case-cote', 'fond-taille'],
    'les deux échelles ne s\'écrivent plus exactement une fois chacune');

  // ⚠ ET LES DEUX FACTEURS SE NOMMENT, ils ne s'écrivent pas en chiffres. Écrire
  // « 10 » et « 20 » passerait aujourd'hui et mentirait le jour où la base
  // changerait de largeur.
  const bloc = source.slice(source.indexOf("'--fond-taille'"));
  assert.match(bloc.slice(0, 200), /LARGEUR_EN_CASES/,
    'la largeur du décor ne nomme plus LARGEUR_EN_CASES');
  assert.match(bloc.slice(0, 200), /HAUTEUR_IMAGE_EN_CASES/,
    'la hauteur du décor ne nomme plus HAUTEUR_IMAGE_EN_CASES');

  // ⚠ LA HAUTEUR EST CELLE DE L'IMAGE, PAS CELLE DE LA BOÎTE : sans ça, le
  // débord de 1,5 case serait écrasé et le décor étiré.
  assert.ok(HAUTEUR_IMAGE_EN_CASES > HAUTEUR_EN_CASES,
    'le décor ne déborde plus sous l\'UI : il a été rogné sur la boîte');

  // ⚠ ET LA GRILLE PORTE UNE DEMI-CASE DE PADDING — les trois nombres vont
  // ensemble, et en changer un seul décolle le mur peint des colonnes.
  const feuille = lire('src', 'index.src.html');
  assert.match(feuille, /padding:\s*calc\(var\(--case-cote\) \/ 2\)/,
    'la grille ne porte plus une demi-case de marge');
  assert.match(source, /Math\.floor\(large \/ LARGEUR_EN_CASES\)/,
    'la taille qui tient ne se calcule plus sur la boîte de dix cases');
  assert.match(source, /return coteCase \* MUR_CASES;/,
    'le padding de la grille n\'est plus une demi-case');
});
