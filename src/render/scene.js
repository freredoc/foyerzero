// Scène : état de combat + alpha → LISTE D'AFFICHAGE — lot 3A.
//
// Module PUR, le pivot de l'architecture. Il rend un tableau ordonné de
// primitives simples ({ forme, x, y, … }), calculé sans toucher au DOM : c'est
// lui qui rend le rendu testable sous node --test. canvas2d.js ne fait que
// l'exécuter — TOUTE décision de dessin se prend ici.
//
// LA RÈGLE EST CELLE DE FICHE-STYLE.md §1-3 : la forme code la classe, la
// couleur code la cible, jamais l'inverse. L'accent d'une entité est la
// couleur de sa colonne de dégâts DOMINANTE — pas de sa spécialité déclarée.
// La troisième colonne (structure en attaque, aviation en défense) n'a qu'une
// couleur pour ses deux lectures : c'est la même colonne, la règle de bascule
// de la spec §4 le dit. Aucune quatrième teinte d'accent n'existe.
//
// Aucune teinte hors de la palette de la fiche. Les tons de camp : le kaki est
// la rampe DU JOUEUR (fiche §3).
//
// ⚠ LA « DETTE DA À DÉFINIR » DE LA RAMPE ENNEMIE EST SOLDÉE PAR L'ART, ET CE
// COMMENTAIRE DISAIT ENCORE LE CONTRAIRE. L'Ouvrage n'est plus « dessiné dans la
// rampe MÉTAL en attendant » : ses sprites sont VIOLETS. Mesuré le 30/08 sur
// `off_o_ratisseur` à la grille 64 — `#382E47` (279 px), `#231D2E` (173),
// `#4E4160` (146), `#6B5B80` (14) dominent, et il ne reste du métal que
// `#3E454C`, DEUX pixels sur 751. Le brief du lot disait « pas une de ses neuf
// teintes n'est du métal » : mesuré, c'est faux d'un cheveu, et c'est écrit ici
// plutôt que recopié.
//
// ⚠ CE QUI SUBSISTE DE LA RAMPE MÉTAL POUR L'OUVRAGE, C'EST LA LÉGENDE, et elle
// seule. `corpsDe` a toujours des appelants — `dessinerEscouade`,
// `dessinerBlinde` et `dessinerAeronef` servent les vignettes de
// `listeLegende`, qui restent GÉOMÉTRIQUES faute d'identifiant d'unité à
// résoudre. Le code n'est donc pas mort ; c'est sa portée qui a rétréci, du
// champ de bataille à la légende.

import { GRILLE, UNITES, DEFENSES, COLONNES_DEGATS } from '../data/combat.js';
import { BATIMENTS } from '../data/sites.js';
import { xDeColonne, yDeRangeeMilli, yDeRangee } from './projection.js';
import { rectangleDuFond } from './fond.js';
import { positionInterpolee } from './interpolation.js';
import { celluleDuSprite, existeDansAtlas } from './sprite.js';
import { COTE_SPRITE } from '../data/atlas.js';
import { ANCRES_CHASSIS } from '../data/ancres-chassis.js';
import { liaisonDuMur, liaisonDuSocle, orientationDeLaPiece } from '../sim/rendu-pose.js';

// --- palette — transcription stricte de FICHE-STYLE.md §3 --------------------

export const PALETTE = {
  // Châssis kaki (5 tons) — la rampe du joueur.
  contour: '#161914',
  kakiOmbre: '#343A2C',
  kakiCorps: '#4E5742',
  kakiEclaire: '#6A7658',
  kakiLumiere: '#8C9A72',
  // Métal (3 tons) — canons, chenilles, socles ; et ton de camp de l'Ouvrage
  // DANS LA LÉGENDE seule, depuis que ses unités sont dessinées en sprites.
  // Voir l'en-tête : la rampe ennemie n'est plus une dette, l'art l'a tranchée.
  metalSombre: '#1E2124',
  metalMoyen: '#3E454C',
  metalClair: '#68727E',
  // Accents fonctionnels : la couleur désigne ce que l'entité peut tuer.
  accents: {
    infanterie: { sombre: '#928E80', clair: '#F5F3E8' },
    vehicule: { sombre: '#8A1E17', clair: '#E43E32' },
    structureOuAviation: { sombre: '#A67018', clair: '#F5B636' },
  },
  // Divers.
  ombrePortee: 'rgba(0,0,0,0.31)',
};

/**
 * Fond de champ de bataille : la fiche ne définit AUCUNE teinte de terrain
 * (elles appartiennent au lot des sprites). Le plus sombre de la palette
 * existante — le contour de châssis — sert de fond uni PROVISOIRE.
 */
export const FOND = PALETTE.contour;

/** Aplat des cases d'obstacle : l'ombre de corps kaki, lisible sur le fond. */
export const COULEUR_OBSTACLE = PALETTE.kakiOmbre;

/** Barres : remplissage de PV en kaki lumière, de réserve en métal clair.
 * Jamais un accent — la fiche interdit d'employer une couleur d'accent pour
 * autre chose que la cible. */
export const COULEUR_BARRE_PV = PALETTE.kakiLumiere;
export const COULEUR_BARRE_RESERVE = PALETTE.metalClair;

// --- classes et accents ------------------------------------------------------

/**
 * Classe visuelle d'une entité — c'est elle que la forme code.
 * @returns {'escouade'|'blinde'|'aeronef'|'mur'|'barriere'|'tourelle'|'artillerie'|'batiment'}
 */
export function classeDe(genre, id) {
  if (genre === 'batiment') return 'batiment';
  if (genre === 'defense') return DEFENSES[id].type; // mur · barriere · tourelle · artillerie
  return UNITES[id].chassis; // escouade · blinde · aeronef
}

/**
 * Le genre d'une pièce de GARNISON — la bande de défense en porte deux sortes.
 *
 * ⚠⚠ ELLE EXISTE PARCE QUE LA GARNISON N'EST PAS FAITE QUE DE DÉFENSES, ET QUE
 * L'OUBLIER FAISAIT TOMBER L'ÉCRAN. `rosterDefensif()` compose les dix-sept
 * pièces posables à partir de DEUX tables — les neuf ouvrages et artilleries de
 * `DEFENSES`, plus les huit unités de `UNITES` dont `defense.present` est vrai.
 * `ui/chantier.js` demandait `genre: 'defense'` pour les dix-sept : les huit
 * unités faisaient LEVER `couchesDeLaDefense`, et comme la levée part de
 * `peindre`, c'est tout l'écran de la base qui restait blanc.
 *
 * ⚠ MESURÉ SUR `main` LE 30/08, AVANT CE LOT : poser des Fusiliers en garnison
 * suffisait. Le défaut est donc antérieur au branchement de la palette ; ce lot
 * ne l'a pas créé, il l'a rendu atteignable plus tôt — la palette résout
 * maintenant un sprite pour chacune des dix-sept, donc la levée arrive au
 * dessin de la palette et non plus à la pose.
 *
 * ⚠ ET LA QUESTION SE POSE À LA TABLE, PAS À UNE LISTE DE HUIT NOMS.
 * `nomDeLaPieceDeDefense` fait déjà `DEFENSES[id] ?? UNITES[id]` : c'est la
 * même question, et une seconde liste écrite à la main serait la première à
 * diverger le jour où une unité gagnera ou perdra sa présence en défense.
 *
 * @param {string} id
 * @returns {'defense'|'unite'}
 */
export function genreDeLaGarnison(id) {
  if (DEFENSES[id] !== undefined) return 'defense';
  if (UNITES[id] !== undefined) return 'unite';
  throw new RangeError(`scene : « ${id} » n'a de rôle ni en défense ni dans le roster`);
}

/**
 * Accent d'une entité : la paire de teintes de sa colonne de dégâts DOMINANTE.
 * Rend null pour une entité qui ne nuit à personne (Merlon, bâtiments) — elle
 * ne tue rien, elle ne porte aucun accent.
 *
 * Une barrière ne tire pas mais saigne ce qui la franchit, et ce saignement est
 * typé : la Ronce coûte cher à l'infanterie, la Herse aux véhicules. C'est donc
 * sa table de franchissement qui donne son accent, faute de table de tir. Les
 * deux ne coexistent jamais sur une même entité.
 * @returns {{ colonne: string, sombre: string, clair: string } | null}
 */
export function accentDe(genre, id) {
  if (genre === 'batiment') return null;
  const ligne = genre === 'defense' ? DEFENSES[id] : UNITES[id];
  const table = ligne.degats ?? ligne.degatsFranchissement ?? null;
  if (table === null) return null;
  let dominante = null;
  for (const colonne of COLONNES_DEGATS) {
    if (table[colonne] > 0 && (dominante === null || table[colonne] > table[dominante])) {
      dominante = colonne;
    }
  }
  if (dominante === null) return null;
  return { colonne: dominante, ...PALETTE.accents[dominante] };
}

/**
 * Nombre de primitives émises par entité vivante, par classe — la table que
 * T5 assied. Les barres (2 par barre) et les traits de tir (1) s'y ajoutent.
 */
/**
 * ⚠⚠ LES TROIS CLASSES D'UNITÉ SONT PASSÉES AUX SPRITES AU LOT UNITÉS-AU-COMBAT.
 * Elles émettaient 6, 4 et 3 primitives géométriques ; elles en émettent
 * maintenant UNE — le sprite —, sauf le blindé du JOUEUR qui en émet DEUX, sa
 * coque et sa tourelle orientable.
 *
 * ⚠ `blinde: 2` VAUT POUR LE JOUEUR, ET LE BLINDÉ DE L'OUVRAGE EN ÉMET UN SEUL.
 * Sa tourelle est cuite dans la coque — arbitré le 30/08 —, et ses quatre-vingts
 * sprites de tourelle ont été retirés au lot PRODUCTION. Cette table dit donc le
 * cas du joueur, qui est celui de l'Arsenal et de la composition ; une scène qui
 * mêle les deux camps se compte entité par entité, pas par cette table. C'est la
 * première fois qu'une entrée de `NB_PRIMITIVES` dépend d'autre chose que de la
 * classe, et c'est écrit ici pour qu'on ne l'apprenne pas en comptant faux.
 *
 * ⚠⚠ ET LES STRUCTURES ONT SUIVI AU LOT STRUCTURES-AU-COMBAT. Le paragraphe qui
 * était ici disait « elles gardent leur géométrie », et il était vrai pendant
 * deux lots : leurs sprites étaient cousus et branchés au DOM, mais `scene.js`
 * n'en dessinait pas. Une casemate se dessinait donc en sprites sur l'écran
 * Chantier et en quatre primitives géométriques au combat — le même objet, deux
 * dessins. Les quatre classes de structure et le bâtiment émettent maintenant
 * leurs couches, comme les unités.
 *
 * ⚠ CETTE TABLE DIT LE CHAMP ET LES ÉDITEURS, PAS LA LÉGENDE. La légende garde
 * légitimement le vocabulaire géométrique — `ENTREES_LEGENDE` liste des couples
 * classe × accent, sans identifiant, donc sans sprite possible — et ses
 * vignettes émettent toujours 6, 4, 3, 2, 3, 4, 5 et 2 primitives. Compter une
 * vignette avec cette table-ci donnerait faux ; c'est `dessinerVignette` qui
 * dit ce qu'elle vaut, et T7 bis qui refuse qu'un `sprite` y entre.
 */
export const NB_PRIMITIVES = {
  escouade: 1, //  le sprite de l'unité, pose d'attaque ou de défense
  blinde: 2, //    coque + tourelle orientable — CÔTÉ JOUEUR ; l'Ouvrage en a 1
  aeronef: 1, //   le sprite de l'unité
  mur: 1, //       le merlon seul, raccordé à ses voisines par son nom
  barriere: 1, //  ni orientation, ni socle
  tourelle: 2, //  socle (raccordé si l'atlas le porte) + tourelle orientée
  artillerie: 2, // même paire que la tourelle
  batiment: 1, //  le sprite du bâtiment, propriétaire compris
};

// --- géométrie des formes ----------------------------------------------------
//
// Toutes les cotes dérivent de la taille de case t, en pixels entiers (floor),
// pour que la même scène rende les mêmes primitives à viewport égal.

const rect = (x, y, l, h, couleur) => ({ forme: 'rect', x, y, l, h, couleur });
const texte = (x, y, contenu, couleur, taille) =>
  ({ forme: 'texte', x, y, texte: contenu, couleur, taille });
const cadre = (x, y, l, h, couleur, epaisseur) => ({ forme: 'cadre', x, y, l, h, couleur, epaisseur });
const disque = (x, y, rayon, couleur) => ({ forme: 'disque', x, y, rayon, couleur });
const ligne = (x1, y1, x2, y2, couleur, epaisseur) => ({ forme: 'ligne', x1, y1, x2, y2, couleur, epaisseur });

/**
 * Une cellule d'atlas posée à l'écran — la primitive ouverte au lot
 * UNITÉS-AU-COMBAT.
 *
 * ⚠⚠ CE MODULE RESTE PUR : la primitive est une DONNÉE, au même titre que
 * `rect` ou `disque`. Aucune image n'entre ici, aucun contexte : c'est
 * `canvas2d.js` qui appellera `drawImage`, et lui seul.
 *
 * ⚠ ELLE PORTE SON RECTANGLE SOURCE, ET C'EST DÉLIBÉRÉ. `drawImage` a besoin de
 * savoir OÙ découper dans l'atlas ; faire ce calcul dans `canvas2d.js`
 * l'obligerait à lire l'index des atlas et à multiplier un rang par un côté —
 * c'est-à-dire à prendre une décision de position, ce que ce module-là n'a
 * jamais fait pour aucune autre forme. Les quatre nombres se calculent ici, une
 * fois, et `canvas2d` les recopie dans `drawImage` sans rien savoir.
 *
 * `nom` est conservé alors que rien ne le lit au dessin : il rend la primitive
 * LISIBLE dans un test et dans un débogage, où « le sprite en (192, 64) » ne dit
 * rien et « off_j_belier_chassis » dit tout.
 */
const sprite = (famille, nom, x, y, l, h) => {
  const { colonne, rangee } = celluleDuSprite(famille, nom);
  return {
    forme: 'sprite',
    famille,
    nom,
    sx: colonne * COTE_SPRITE,
    sy: rangee * COTE_SPRITE,
    sl: COTE_SPRITE,
    sh: COTE_SPRITE,
    x,
    y,
    l,
    h,
  };
};

/**
 * La primitive du fond peint d'une base — une image, posée d'un mur à l'autre.
 *
 * ⚠⚠ ELLE REMPLACE `listeDuContour`, ET LE REMPLACEMENT EST LE LOT — MUR-PEINT,
 * 03/09. L'anneau posait QUARANTE ET UNE pièces découpées dans six images — deux
 * coins, trois créneaux en haut, trente-six blocs de flanc ; le fond en
 * pose UNE. Ce n'est pas une simplification de code : c'est qu'Ethan a fait
 * peindre le mur dans le décor, donc il n'y a plus de géométrie de mur à
 * dessiner. Ce qui reste de l'ancien module ici, c'est le partage — `render/`
 * rend une primitive, les écrans la posent.
 *
 * ⚠⚠ C'EST LA MÊME PRIMITIVE `sprite` QUE LES UNITÉS, ET SEULE LA FABRIQUE
 * DIFFÈRE. Elle porte déjà son rectangle source depuis le lot UNITÉS-AU-COMBAT :
 * une cellule d'atlas le calcule d'un rang, un décor le prend tout entier.
 * Ouvrir une SECONDE forme aurait donné à `canvas2d.js` une branche de plus
 * appelant exactement le même `drawImage`.
 *
 * ⚠ ET LA `famille` EST LE NOM DU FOND, parce qu'un décor n'est dans aucun
 * atlas et ne peut pas y être : `tools/atlas.py` n'accepte que des cellules
 * CARRÉES d'un même côté, quand un fond fait 1080 × 2160. Chacun est donc une
 * famille d'une seule image, et `atlasDeLaScene` de `ui/session.js` en donne la
 * balise. Même forme que les murs de contour avant lui.
 *
 * ⚠ UN NOM NUL NE REND RIEN, ET C'EST CE QUI LAISSE LE BANC INTACT. Il projette
 * sans mur peint et n'a pas de décor à demander : pas une de ses mesures de
 * pixels ne bouge. Une famille absente ferait LEVER `executer` — « une unité
 * invisible est un défaut qu'on doit voir » — donc on ne demande rien plutôt
 * que de demander un fond qui n'existe pas.
 *
 * @param {string|null} nom le fond, de `fondDeLaBase`
 * @param {object} projection
 * @returns {Array<object>} zéro ou une primitive
 */
export function listeDuFond(nom, projection) {
  if (nom === null || nom === undefined) return [];
  const r = rectangleDuFond(projection);
  return [{
    forme: 'sprite',
    famille: nom,
    nom,
    sx: r.sx,
    sy: r.sy,
    sl: r.sl,
    sh: r.sh,
    x: r.x,
    y: r.y,
    l: r.l,
    h: r.h,
  }];
}

/**
 * Ton de corps d'un camp : kaki du joueur, métal de l'Ouvrage.
 *
 * ⚠ IL NE SERT PLUS QU'À LA LÉGENDE. Au combat, dans l'Arsenal et dans la
 * composition de défense, les unités sont des sprites depuis le lot
 * UNITÉS-AU-COMBAT ; seules les vignettes de `listeLegende` passent encore par
 * les primitives géométriques, faute d'identifiant d'unité à résoudre. Ce n'est
 * donc pas du code mort — c'est du code dont la portée a rétréci.
 */
function corpsDe(camp) {
  return camp === 'attaque' ? PALETTE.kakiCorps : PALETTE.metalMoyen;
}

function dessinerEscouade(liste, x, y, t, camp, accent) {
  const f = Math.max(2, Math.floor((t * 28) / 100)); // côté d'une figure
  const m = Math.max(1, Math.floor(t / 10));
  const c = Math.max(1, Math.floor(f / 2)); // casque
  const corps = corpsDe(camp);
  const casque = accent ? accent.clair : corps;
  // Trois figures larges en triangle, pointe vers le haut (fiche §4).
  const figures = [
    [x + Math.floor((t - f) / 2), y + m], // pointe, en haut au centre
    [x + m, y + t - m - f], // base gauche
    [x + t - m - f, y + t - m - f], // base droite
  ];
  for (const [fx, fy] of figures) {
    liste.push(rect(fx, fy, f, f, corps));
    liste.push(rect(fx + Math.floor((f - c) / 2), fy, c, Math.max(1, Math.floor(c / 2)), casque));
  }
}

function dessinerBlinde(liste, x, y, t, camp, accent) {
  const m = Math.max(1, Math.floor(t / 10));
  const ch = Math.max(1, Math.floor((t * 15) / 100)); // chenille
  const h = t - 2 * m; // allongée VERTICALEMENT (fiche §4), pleine hauteur interne
  const bandeau = Math.max(2, Math.floor((t * 14) / 100));
  liste.push(rect(x + m, y + m, ch, h, PALETTE.metalClair)); // chenille gauche
  liste.push(rect(x + t - m - ch, y + m, ch, h, PALETTE.metalClair)); // chenille droite
  liste.push(rect(x + m + ch, y + m, t - 2 * m - 2 * ch, h, corpsDe(camp))); // caisse
  // Bandeau d'accent transversal sur la caisse, au tiers avant.
  liste.push(rect(x + m + ch, y + m + Math.floor(h / 3), t - 2 * m - 2 * ch, bandeau,
    accent ? accent.clair : corpsDe(camp)));
}

function dessinerAeronef(liste, x, y, t, camp, accent) {
  const m = Math.max(1, Math.floor(t / 10));
  const d = Math.max(2, Math.floor((t * 12) / 100)); // décalage d'ombre : le SEUL signal d'altitude
  const fw = Math.max(2, Math.floor((t * 30) / 100)); // forme fine
  const bandeau = Math.max(2, Math.floor((t * 15) / 100));
  liste.push(disque(x + Math.floor(t / 2) + d, y + Math.floor(t / 2) + d,
    Math.floor((t * 22) / 100), PALETTE.ombrePortee));
  liste.push(rect(x + Math.floor((t - fw) / 2), y + m, fw, t - 2 * m, corpsDe(camp)));
  liste.push(rect(x + Math.floor((t - fw) / 2), y + m + Math.floor((t - 2 * m) / 4), fw, bandeau,
    accent ? accent.clair : corpsDe(camp)));
}

function dessinerStructure(liste, x, y, t, classe, accent) {
  const m = Math.max(1, Math.floor(t / 10));
  if (classe === 'barriere') {
    // Basse : elle se traverse. Socle sur la moitié inférieure de la case.
    const h = Math.floor(t / 2) - 1;
    liste.push(rect(x + 1, y + t - 1 - h, t - 2, h, PALETTE.metalMoyen));
    liste.push(cadre(x + 1, y + t - 1 - h, t - 2, h, PALETTE.contour, 1));
    const c = Math.max(2, Math.floor((t * 20) / 100));
    liste.push(rect(x + Math.floor((t - c) / 2), y + t - 1 - Math.floor(h / 2) - Math.floor(c / 2),
      c, c, accent.clair));
    return;
  }
  // Socle carré bord à bord + contour net, pour mur, tourelle et artillerie.
  liste.push(rect(x + 1, y + 1, t - 2, t - 2, PALETTE.metalMoyen));
  liste.push(cadre(x + 1, y + 1, t - 2, t - 2, PALETTE.contour, 1));
  if (classe === 'mur') return; // le Merlon ne tue rien : aucun accent.
  // Anneau d'accent sur le socle (fiche §4), puis dôme rond.
  liste.push(cadre(x + m, y + m, t - 2 * m, t - 2 * m, accent.clair, 2));
  liste.push(disque(x + Math.floor(t / 2), y + Math.floor(t / 2),
    Math.floor((t * 26) / 100), PALETTE.metalSombre));
  if (classe === 'artillerie') {
    // Tube rallongé vers le haut — sans déborder de la case (marge fiche §2).
    const tw = Math.max(2, Math.floor(t / 10));
    liste.push(rect(x + Math.floor((t - tw) / 2), y + 2, tw, Math.floor(t / 2) - 2,
      PALETTE.metalClair));
  }
}

// ---------------------------------------------------------------------------
// Les couches de sprite d'une unité — lot UNITÉS-AU-COMBAT
// ---------------------------------------------------------------------------

/** La lettre de camp d'un nom de sprite : le PROPRIÉTAIRE, jamais le côté. */
function lettreDuProprietaire(proprietaire) {
  return proprietaire === 'joueur' ? 'j' : 'o';
}

/**
 * La force d'une entité au combat : `armee` si elle attaque, `garnison` sinon.
 *
 * ⚠⚠ C'EST LA FORCE QUI DÉCIDE DE LA POSE, PAS LE CAMP NI LE PROPRIÉTAIRE.
 * CLAUDE.md §4 : « la clé est le PROPRIÉTAIRE, pas le camp — le joueur peut
 * défendre ». Une unité qui défend prend la pose `_def` — chenilles à
 * l'horizontale, pour un engin qui se déplace latéralement — qu'elle soit du
 * joueur ou de l'Ouvrage. Le propriétaire, lui, ne décide que de la LETTRE.
 */
function forceDuCamp(camp) {
  return camp === 'attaque' ? 'armee' : 'garnison';
}

/**
 * Le nom d'unité à employer, pose de défense comprise si elle existe.
 *
 * ⚠⚠ LA LISTE DES POSES DE DÉFENSE NE S'ÉCRIT PAS, ELLE SE LIT DANS L'ATLAS.
 * Mesuré le 30/08 : huit des quatorze unités de l'Ouvrage ont une pose `_def`,
 * six ne l'ont pas. Écrire ces huit noms dans le code serait une seconde vérité,
 * et la première à diverger le jour où les six manquantes seront dessinées —
 * `existeDansAtlas` fait qu'il n'y aura alors RIEN à changer. C'est exactement
 * la règle appliquée aux socles de liaison au lot précédent, et pour la même
 * raison. Un test fige la coïncidence d'aujourd'hui et rougira ce jour-là.
 */
function nomAvecPose(famille, base, force) {
  const defensif = `${base}_def`;
  return force === 'garnison' && existeDansAtlas(famille, defensif) ? defensif : base;
}

/**
 * Les couches de sprite d'une entité d'unité, de la plus BASSE à la plus haute.
 *
 * Rend `null` pour tout ce qui n'est pas une unité : les structures gardent
 * leurs primitives géométriques, et les bâtiments sont hors de ce lot.
 *
 * ⚠ LE BLINDÉ DU JOUEUR EST LE SEUL À DEUX COUCHES. Sa coque et sa tourelle sont
 * deux sprites, la tourelle tournant vers sa cible. Le blindé de l'OUVRAGE n'en
 * a qu'une : sa tourelle est cuite dans la coque — arbitré le 30/08, et ses
 * quatre-vingts sprites de tourelle ont été retirés au lot PRODUCTION. Ne pas
 * chercher `off_o_*_chassis`, il n'en existe pas.
 *
 * ⚠⚠ ELLE PREND UN DESCRIPTEUR, PAS UNE ENTITÉ DE COMBAT, et c'est ce qui
 * permet aux QUATRE listes de partager le même dessin. `listeAffichage` a des
 * entités ; la légende et l'Arsenal n'ont qu'un identifiant. Exiger une entité
 * ici aurait obligé les deux dernières à garder le chemin géométrique, et le
 * joueur aurait appris un vocabulaire visuel dans l'éditeur pour en découvrir un
 * autre au combat — ce que le dispatch unique existe précisément pour empêcher,
 * et ce qu'un test (T8) asserte depuis le lot 5A.
 *
 * ⚠ LE DESCRIPTEUR PORTE LA POSITION AFFICHÉE, PAS L'ENTITÉ. Une entité de
 * combat range son ordonnée dans `rangeeMilli`, en millièmes de rangée ;
 * `orientationVers` attend des rangées. Lui passer l'entité telle quelle rendait
 * `NaN` — trouvé par T6, qui a levé « orientationDeLAngle : NaN n'est pas un
 * angle » au premier essai. La position est donc explicite, et c'est l'appelant
 * qui la convertit : lui seul sait s'il veut celle du tick ou l'interpolée.
 *
 * @param {{genre: string, id: string, proprietaire: string, camp: string,
 *          rangee?: number, colonne?: number}} d
 * @param {{rangee: number, colonne: number}|null} cible position AFFICHÉE de sa cible
 * @returns {{famille: string, nom: string, ancre?: object}[]|null}
 */
function couchesDeLUnite(d, cible = null) {
  if (d.genre !== 'unite') return null;
  const classe = classeDe(d.genre, d.id);
  const c = lettreDuProprietaire(d.proprietaire);
  const force = forceDuCamp(d.camp);

  if (classe !== 'blinde' || c === 'o') {
    return [{ famille: 'unite', nom: nomAvecPose('unite', `off_${c}_${d.id}`, force) }];
  }

  // Blindé du joueur : la coque, puis la tourelle orientée par-dessus.
  const coque = nomAvecPose('chassis', `off_j_${d.id}_chassis`, force);
  const orientation = orientationDeLaPiece(
    force,
    { rangee: d.rangee ?? 0, colonne: d.colonne ?? 0 },
    cible,
  );
  return [
    { famille: 'chassis', nom: coque },
    {
      // ⚠ LE SOULIGNÉ, PAS LE TIRET. Le dossier source est
      // `art/sprites/tourelle-unite/`, mais `tools/atlas.py` en fait un SLUG
      // ASCII qui devient une clé JavaScript : `ATLAS.tourelle_unite`. Écrit
      // avec un tiret ici au premier essai — T6 a levé « famille absente de
      // l'atlas » et a nommé les sept familles cousues, ce qui a dit la faute.
      famille: 'tourelle_unite',
      nom: `off_j_${d.id}_${orientation}`,
      ancre: ANCRES_CHASSIS[coque] ?? null,
    },
  ];
}

/**
 * Les couches d'une pièce de défense, de la plus BASSE à la plus haute.
 *
 * ⚠⚠ ELLE A ÉTÉ DÉPLACÉE DEPUIS `src/ui/chantier.js`, PAS RECOPIÉE. Elle y
 * vivait sous le nom `couchesDeLaDefense` et ne servait qu'à l'écran Chantier ;
 * le champ de bataille et l'éditeur Défense dessinaient les mêmes objets en
 * primitives géométriques. En écrire un second exemplaire ici aurait fait DEUX
 * vérités sur ce qu'est une casemate, et la première à diverger au premier
 * ajustement — c'est « une seule table fait foi par grandeur » (CLAUDE.md §4).
 *
 * ⚠⚠ L'ORDRE EST DU PLUS BAS AU PLUS HAUT, ET IL A ÉTÉ INVERSÉ AU DÉPLACEMENT.
 * `couchesDeLaDefense` rendait la couche la plus HAUTE en premier, parce que le
 * CSS `background-image` dessine la première par-dessus. Le canevas fait
 * l'inverse : il peint dans l'ordre de la liste, donc la DERNIÈRE est au-dessus.
 * Unifier sans le voir aurait mis le socle par-dessus la tourelle. C'est
 * `ui/chantier.js` qui inverse maintenant, une fois, à l'endroit où il compose
 * ses trois listes CSS.
 *
 * ⚠ AU COMBAT, LE CHAÎNAGE SUIT LES VIVANTES. `liaisonDuMur` lit les voisines
 * qu'on lui passe : quand une tourelle meurt, le merlon d'à côté repasse à
 * `isole` à l'image suivante. C'est le comportement VOULU — un mur ne reste pas
 * raccordé à une ruine — et non un effet de bord du branchement.
 *
 * @param {{genre: string, id: string, proprietaire: string}} d
 * @param {{cible: object|null, voisines: Array}} contexte
 * @returns {{famille: string, nom: string}[]}
 */
function couchesDeLaDefense(d, contexte) {
  const type = DEFENSES[d.id]?.type;
  if (type === undefined) {
    throw new RangeError(`scene : « ${d.id} » n'est pas une pièce de défense`);
  }
  const c = lettreDuProprietaire(d.proprietaire);
  const voisines = contexte.voisines ?? [];
  const piece = { id: d.id, rangee: d.rangee ?? 0, colonne: d.colonne ?? 0 };

  // Un mur ne porte ni orientation ni socle : c'est le raccord qui le dessine.
  if (type === 'mur') {
    const liaison = liaisonDuMur(voisines, piece, d.proprietaire);
    return [{ famille: 'defense', nom: `def_${c}_${d.id}_${liaison}` }];
  }
  // Une barrière blesse au contact : ni tourelle à tourner, ni socle à poser.
  if (type === 'barriere') {
    return [{ famille: 'defense', nom: `def_${c}_${d.id}` }];
  }

  // ⚠ LE SOCLE À LIAISON N'EXISTE QUE POUR LES TROIS TOURELLES DE CONTACT : la
  // planche des trois artilleries n'a pas été dessinée. On DEMANDE à l'atlas au
  // lieu de porter une liste de trois noms — le jour où la planche arrive, elles
  // prennent leurs liaisons sans qu'une ligne change ici.
  const liaison = liaisonDuSocle(voisines, piece, d.proprietaire);
  const socleLie = `socle_def_${c}_${d.id}_${liaison}`;
  const socle = existeDansAtlas('socle', socleLie) ? socleLie : `socle_def_${c}_${d.id}`;
  const orientation = orientationDeLaPiece('garnison', piece, contexte.cible ?? null);
  return [
    { famille: 'socle', nom: socle },
    { famille: 'defense', nom: `def_${c}_${d.id}_${orientation}` },
  ];
}

/**
 * Les couches d'un bâtiment — une seule.
 *
 * ⚠ LA CONVERSION camelCase → SERPENT EST UN NO-OP SUR LES IDENTIFIANTS DE
 * L'OUVRAGE : `souche`, `etai`, `noeud`, `gangue`, `terril` sont déjà en
 * minuscules. UNE SEULE RÈGLE pour les deux camps, donc, et aucune table de
 * correspondance — qui serait la seconde vérité que ce lot existe pour retirer.
 */
function couchesDuBatiment(d) {
  const c = lettreDuProprietaire(d.proprietaire);
  const serpent = d.id.replace(/([A-Z])/g, (m) => `_${m.toLowerCase()}`);
  return [{ famille: 'batiment', nom: `bat_${c}_${serpent}` }];
}

/**
 * LE point d'entrée des couches de sprite — un seul, pour les cinq appelants.
 *
 * ⚠⚠ AVANT CE LOT, UNE CASEMATE SE DESSINAIT DE TROIS FAÇONS : en sprites sur
 * l'écran Chantier, en primitives géométriques dans l'éditeur Défense, et en
 * primitives au combat. C'est exactement ce que T8 existe pour empêcher — « sans
 * quoi le joueur apprendrait un vocabulaire visuel dans l'éditeur et en
 * découvrirait un autre au combat » — mais T8 ne couvrait que les unités.
 *
 * ⚠ IL REND `null` POUR LA LÉGENDE SEULE, et c'est légitime : `ENTREES_LEGENDE`
 * liste des couples CLASSE × ACCENT, pas des objets nommés, et un descripteur
 * sans `id` résoluble n'a aucun sprite. Partout ailleurs, `null` est devenu
 * impossible, et un test l'asserte.
 *
 * @param {{genre: string, id: string, proprietaire: string, camp: string,
 *          rangee?: number, colonne?: number}} d
 * @param {{cible?: object|null, voisines?: Array}} [contexte]
 * @returns {{famille: string, nom: string}[]|null} du plus BAS au plus haut
 */
export function couchesDeLEntite(d, contexte = {}) {
  if (d.genre === 'unite') return couchesDeLUnite(d, contexte.cible ?? null);
  if (d.genre === 'defense') return couchesDeLaDefense(d, contexte);
  if (d.genre === 'batiment') return couchesDuBatiment(d);
  return null;
}

/**
 * Pose les couches d'une unité dans sa case.
 *
 * ⚠ LA TOURELLE SUIT L'ANCRE DE SA COQUE, pas le centre de la case. Les trois
 * nombres d'`ANCRES_CHASSIS` sont des POURCENTAGES de la coque — mesurés sur
 * l'image par `tools/chassis.py` —, donc valables aux trois grilles. Sans eux,
 * la tourelle se poserait au centre géométrique et flotterait à côté du logement
 * sur les dix coques.
 */
function dessinerCouches(liste, x, y, t, couches) {
  for (const couche of couches) {
    if (!couche.ancre) {
      liste.push(sprite(couche.famille, couche.nom, x, y, t, t));
      continue;
    }
    const { diametre_pct: d, x_pct: dx, y_pct: dy } = couche.ancre;
    const cote = Math.max(1, Math.round((t * d) / 100));
    liste.push(sprite(
      couche.famille, couche.nom,
      Math.round(x + t / 2 + (t * dx) / 100 - cote / 2),
      Math.round(y + t / 2 + (t * dy) / 100 - cote / 2),
      cote, cote,
    ));
  }
}

/**
 * LE dispatch de formes — un seul, pour les trois listes d'affichage.
 *
 * `listeAffichage` (le champ), `listeLegende` (les vignettes) et `listeArsenal`
 * (la composition) l'appellent toutes. C'est ce qui garantit qu'une unité se
 * dessine à l'identique partout : le joueur ne peut pas apprendre un
 * vocabulaire visuel dans l'éditeur et en découvrir un autre au combat. Aucune
 * de ces fonctions ne redéfinit ni forme ni couleur en propre.
 */
function dessinerEntite(liste, x, y, t, classe, camp, accent, couches = null) {
  // ⚠⚠ LES QUATRE LISTES PASSENT AUX SPRITES ENSEMBLE, ET CE N'EST PAS UN
  // ÉLARGISSEMENT GRATUIT. Le premier jet de ce lot ne branchait que le champ de
  // bataille : T8 est tombé, et il avait RAISON — il asserte depuis le lot 5A
  // que « les 14 unités se dessinent à l'identique dans l'Arsenal et sur le
  // champ », faute de quoi le joueur apprendrait un vocabulaire visuel dans
  // l'éditeur pour en découvrir un autre au combat. C'est la raison d'être de ce
  // dispatch unique. Assouplir le test aurait été retirer le garde-fou qui
  // venait de faire son travail.
  //
  // ⚠⚠ ET `couches` NE VAUT PLUS `null` QUE POUR LA LÉGENDE, depuis le lot
  // STRUCTURES-AU-COMBAT. Les défenses et les bâtiments gardaient leurs
  // primitives géométriques au combat pendant que l'écran Chantier les
  // dessinait en sprites : le même objet, deux dessins. Les cinq fonctions
  // géométriques restent JOIGNABLES — c'est `dessinerVignette` qui les
  // atteint, et elle seule : `ENTREES_LEGENDE` liste des couples classe ×
  // accent sans identifiant, donc sans sprite possible.
  if (couches !== null) { dessinerCouches(liste, x, y, t, couches); return; }
  if (classe === 'batiment') dessinerBatiment(liste, x, y, t);
  else if (classe === 'escouade') dessinerEscouade(liste, x, y, t, camp, accent);
  else if (classe === 'blinde') dessinerBlinde(liste, x, y, t, camp, accent);
  else if (classe === 'aeronef') dessinerAeronef(liste, x, y, t, camp, accent);
  else dessinerStructure(liste, x, y, t, classe, accent);
}

function dessinerBatiment(liste, x, y, t) {
  // Carré plein, pleine case : plus grand que toute structure.
  liste.push(rect(x, y, t, t, PALETTE.metalMoyen));
  liste.push(cadre(x, y, t, t, PALETTE.contour, 1));
}

// --- la liste d'affichage ----------------------------------------------------

/** Une entité se dessine si elle est vivante et encore sur la grille. */
function visible(e) {
  return e.vivant && !e.sorti;
}

/**
 * Position affichée d'une entité : interpolée entre l'instantané pris avant le
 * dernier tick et la position courante. Une entité née après la prise —
 * indice ≥ instantane.length — se dessine sans interpolation.
 */
function rangeeAffichee(e, precedentes, alpha) {
  if (!precedentes || e.indice >= precedentes.length) return e.rangeeMilli;
  return positionInterpolee(precedentes[e.indice], e.rangeeMilli, alpha);
}

/**
 * Construit la liste d'affichage d'un état de combat.
 *
 * ORDRE DE DESSIN, stable et normatif (T5 l'assied) :
 * fond, obstacles, bâtiments, structures, unités, barres, traits de tir —
 * pour qu'une barre ne passe jamais sous une unité. À l'intérieur de chaque
 * groupe : l'ordre d'insertion des entités, stable par construction (lot 2A).
 *
 * Ne LIT que l'état ; ne le modifie jamais (T4 le prouve par sérialisation).
 *
 * @param {object} etat        État de combat du moteur (lot 2A).
 * @param {object} projection  Résultat de calculerProjection.
 * @param {number[]|null} precedentes  Instantané pris avant le dernier tick.
 * @param {number} alpha       Fraction du tick courant, en millièmes 0…1000.
 * @returns {Array<object>} primitives.
 */
export function listeAffichage(etat, projection, precedentes = null, alpha = 0, fond = null) {
  const t = projection.tailleCase;
  const liste = [];

  // 1. Fond.
  liste.push(rect(0, 0, projection.largeurPx, projection.hauteurPx, FOND));

  // 1 bis. Le fond peint de la base attaquée — lot MUR-PEINT, 03/09.
  //
  // ⚠⚠ IL SE DESSINE APRÈS LE FOND UNI ET AVANT TOUT LE RESTE, comme sur
  // l'écran de la base, où les étages sont le DÉCOR puis les jetons. L'aplat
  // reste dessous : le décor couvre la boîte de dix cases, jamais les marges de
  // letterboxing, et sans lui un canevas plus large qu'il ne faut montrerait du
  // vide au lieu du noir.
  //
  // ⚠ LE NOM VIENT DE L'APPELANT, PAS DE L'ÉTAT DE COMBAT. Un montage de combat
  // ne porte ni type de site ni case de la carte — `creerCombat` n'en a jamais
  // eu besoin —, et les lui faire porter aurait mis une décision de DESSIN dans
  // la simulation. `ui/raid.js` sait quel site il regarde ; il appelle
  // `fondDeLaBase` et passe le nom.
  liste.push(...listeDuFond(fond, projection));

  // 2. Obstacles, en aplat sombre.
  for (const o of etat.obstacles) {
    liste.push(rect(xDeColonne(projection, o.colonne), yDeRangee(projection, o.rangee),
      t, t, COULEUR_OBSTACLE));
  }

  // Positions affichées, calculées une fois : barres et traits les réutilisent.
  const positions = new Map();
  for (const e of etat.entites) {
    if (visible(e)) positions.set(e.indice, rangeeAffichee(e, precedentes, alpha));
  }
  const xDe = (e) => xDeColonne(projection, e.colonne);
  const yDe = (e) => yDeRangeeMilli(projection, positions.get(e.indice));

  // ⚠⚠ LE CHAÎNAGE DES MURS SUIT LES VIVANTES, ET C'EST VOULU. `liaisonDuMur`
  // lit cette liste : une tourelle qui meurt en sort, et le merlon d'à côté
  // repasse à `isole` à l'image suivante. Un mur ne reste pas raccordé à une
  // ruine. La liste se calcule UNE fois — la relire par entité ferait un balayage
  // quadratique sur une scène de cent défenses.
  //
  // ⚠⚠ LA RANGÉE AFFICHÉE, ET C'EST UN DÉFAUT MESURÉ, PAS UNE PRÉCAUTION. Cette
  // liste portait `e.rangee`, qui n'existe PAS sur une entité de combat : le
  // moteur range `rangeeMilli`, et `e.rangee` vaut `undefined`. Le chaînage
  // comparait donc `undefined === 3` pour chaque voisine et rendait `isole`
  // partout — deux merlons côte à côte ne se rejoignaient pas au combat, alors
  // qu'ils se rejoignent sur l'écran Chantier. Le même objet, deux dessins :
  // exactement ce que ce lot existe pour retirer, et le premier montage du test
  // ne pouvait pas le voir, parce qu'il écrivait ses voisines à la main.
  // C'est la même faute que la cible passée au lot précédent, vue une deuxième
  // fois : une entité de combat ne se lit pas comme une pièce d'éditeur.
  const defensesVivantes = etat.entites
    .filter((e) => visible(e) && e.genre === 'defense')
    .map((e) => ({
      id: e.id,
      rangee: (positions.get(e.indice) ?? e.rangeeMilli) / 1000,
      colonne: e.colonne,
    }));

  /**
   * La position AFFICHÉE de la cible d'une entité, ou `null` si elle n'en a pas.
   *
   * ⚠⚠ L'INTERPOLÉE, PAS CELLE DU TICK — DÉCISION MESURÉE. `rendu-pose.js` dit
   * en tête que l'angle est CONTINU : une tourelle change de sprite plusieurs
   * fois pendant qu'une cible se rapproche. Viser la position du tick ferait
   * pointer la tourelle vers là où la cible ÉTAIT, pendant que le joueur la voit
   * ailleurs — un décalage d'autant plus visible que le canon est long.
   *
   * ⚠ ET LE SCINTILLEMENT A ÉTÉ MESURÉ AVANT DE TRANCHER, pas supposé : une
   * approche de neuf rangées ne traverse que **trois** sprites — 0,33 changement
   * par rangée — et le pire cas, un passage à une colonne d'écart, en traverse
   * sept sur quatre rangées. C'est loin de tout ce qui clignoterait. Si l'essai
   * appareil contredisait cette mesure, le repli est la position du tick, et il
   * tient dans cette fonction-ci.
   *
   * La position du TIREUR est interpolée elle aussi, par `positions` : viser
   * juste depuis une case fausse rendrait le même décalage.
   */
  const cibleAffichee = (e) => {
    if (e.cibleIndice === null || e.cibleIndice === undefined) return null;
    const cible = etat.entites[e.cibleIndice];
    if (cible === undefined || !visible(cible)) return null;
    return {
      rangee: (positions.get(cible.indice) ?? cible.rangeeMilli) / 1000,
      colonne: cible.colonne,
    };
  };

  // 3. Bâtiments — 4. structures — 5. unités.
  for (const genreVoulu of ['batiment', 'defense', 'unite']) {
    for (const e of etat.entites) {
      if (!visible(e) || e.genre !== genreVoulu) continue;
      const x = xDe(e);
      const y = yDe(e);
      dessinerEntite(liste, x, y, t, classeDe(e.genre, e.id), e.camp,
        accentDe(e.genre, e.id), couchesDeLEntite({
          genre: e.genre,
          id: e.id,
          proprietaire: e.proprietaire,
          camp: e.camp,
          // ⚠ LA RANGÉE AFFICHÉE, INTERPOLÉE COMME CELLE DE LA CIBLE. Viser
          // juste depuis une case fausse rendrait le même décalage que viser
          // faux depuis la bonne.
          rangee: (positions.get(e.indice) ?? e.rangeeMilli) / 1000,
          colonne: e.colonne,
        }, { cible: cibleAffichee(e), voisines: defensesVivantes }));
    }
  }

  // 6. Barres — PV pour toute entité vivante, réserve pour les attaquants.
  //    Les PV ne s'interpolent JAMAIS : la barre dit l'état du tick, pas un
  //    glissement — une barre qui glisse ment sur l'instant de la mort.
  const bh = Math.max(2, Math.floor(t / 12));
  for (const e of etat.entites) {
    if (!visible(e)) continue;
    const x = xDe(e);
    const y = yDe(e);
    liste.push(rect(x + 1, y + 1, t - 2, bh, PALETTE.contour));
    liste.push(rect(x + 1, y + 1, Math.floor(((t - 2) * e.pvMilli) / e.pvMaxMilli), bh,
      COULEUR_BARRE_PV));
    if (e.camp === 'attaque' && e.genre === 'unite') {
      const reserveMax = UNITES[e.id].reserve;
      liste.push(rect(x + 1, y + 2 + bh, t - 2, bh, PALETTE.contour));
      liste.push(rect(x + 1, y + 2 + bh, Math.floor(((t - 2) * e.reserve) / reserveMax), bh,
        COULEUR_BARRE_RESERVE));
    }
  }

  // 7. Traits de tir : bref segment tireur → cible pour toute entité qui a
  //    tiré ce tick, dans la couleur CLAIRE de son accent — « la bouche du
  //    canon reprend la couleur claire de l'accent » (fiche §4). La cible peut
  //    être morte de ce tir : le trait se dessine quand même, vers sa case.
  const demi = Math.floor(t / 2);
  for (const e of etat.entites) {
    if (!visible(e) || !e.aTire || e.cibleIndice === null) continue;
    const cible = etat.entites[e.cibleIndice];
    const accent = accentDe(e.genre, e.id);
    // Une cible morte de ce tir n'est plus dans `positions` : le trait va
    // alors à sa dernière position brute.
    const milliCible = positions.get(cible.indice) ?? cible.rangeeMilli;
    liste.push(ligne(
      xDe(e) + demi, yDe(e) + demi,
      xDeColonne(projection, cible.colonne) + demi,
      yDeRangeeMilli(projection, milliCible) + demi,
      accent.clair, 2,
    ));
  }
  return liste;
}

// ---------------------------------------------------------------------------
// Légende
// ---------------------------------------------------------------------------
//
// La légende se dessine avec LES MÊMES primitives et LES MÊMES fonctions de
// forme que le champ de bataille, et s'exécute par le même canvas2d.executer.
// Aucune pastille recopiée à la main : c'est la seule façon qu'elle ne dérive
// pas du rendu au premier changement de palette.
//
// La liste des entrées, elle, est ÉCRITE À LA MAIN. Si elle se déduisait des
// données, elle se mettrait à jour toute seule et ne prouverait plus rien — le
// test qui la verrouille (T7) compare cette liste à l'énumération faite depuis
// UNITES, DEFENSES et BATIMENTS, et doit tomber en panne dès qu'une entité
// d'une classe ou d'un accent non présenté apparaît.

/** Libellé de chaque classe visuelle. */
export const NOMS_CLASSE = {
  escouade: 'Escouade',
  blinde: 'Blindé',
  aeronef: 'Aéronef',
  mur: 'Mur',
  barriere: 'Barrière',
  tourelle: 'Tourelle',
  artillerie: 'Artillerie',
  batiment: 'Bâtiment',
};

/** Libellé de chaque colonne d'accent — ce que l'entité peut tuer. */
export const NOMS_ACCENT = {
  infanterie: 'anti-infanterie',
  vehicule: 'anti-véhicule',
  structureOuAviation: 'anti-structure / aérien',
  aucun: 'ne tue rien',
};

/**
 * Les 19 couples (classe, accent) que la scène peut produire, un par entrée.
 * `accent: null` pour ce qui ne tue rien — le Merlon et les bâtiments.
 */
export const ENTREES_LEGENDE = [
  { classe: 'escouade', accent: 'infanterie' },
  { classe: 'escouade', accent: 'vehicule' },
  { classe: 'escouade', accent: 'structureOuAviation' },
  { classe: 'blinde', accent: 'infanterie' },
  { classe: 'blinde', accent: 'vehicule' },
  { classe: 'blinde', accent: 'structureOuAviation' },
  { classe: 'aeronef', accent: 'infanterie' },
  { classe: 'aeronef', accent: 'vehicule' },
  { classe: 'aeronef', accent: 'structureOuAviation' },
  { classe: 'mur', accent: null },
  { classe: 'barriere', accent: 'infanterie' },
  { classe: 'barriere', accent: 'vehicule' },
  { classe: 'tourelle', accent: 'infanterie' },
  { classe: 'tourelle', accent: 'vehicule' },
  { classe: 'tourelle', accent: 'structureOuAviation' },
  { classe: 'artillerie', accent: 'infanterie' },
  { classe: 'artillerie', accent: 'vehicule' },
  { classe: 'artillerie', accent: 'structureOuAviation' },
  { classe: 'batiment', accent: null },
];

/**
 * Dessine une entité de classe et d'accent donnés, comme sur le champ.
 *
 * ⚠⚠ LA LÉGENDE GARDE SA GÉOMÉTRIE, ET CE N'EST PAS UN OUBLI DU LOT
 * UNITÉS-AU-COMBAT. Elle n'a PAS d'identifiant d'unité : `ENTREES_LEGENDE` liste
 * des couples CLASSE × ACCENT — « escouade à accent véhicule » —, pas des
 * Fusiliers ni des Béliers. Aucun sprite ne peut représenter une classe
 * abstraite, et surtout aucun ne porte l'ACCENT, qui est précisément ce que la
 * légende explique : trois teintes par classe, la colonne de dégâts dominante.
 *
 * Les vignettes restent donc le vocabulaire GÉOMÉTRIQUE, et c'est cohérent —
 * elles disent « ce qui est rond tire loin, ce qui est ambre vise les
 * véhicules », pas « voici un Bélier ». Le jour où la légende devra montrer des
 * unités nommées, elle passera aux sprites en gagnant un `id` par entrée.
 */
function dessinerVignette(liste, x, y, t, classe, camp, colonneAccent) {
  const accent = colonneAccent === null ? null
    : { colonne: colonneAccent, ...PALETTE.accents[colonneAccent] };
  dessinerEntite(liste, x, y, t, classe, camp, accent);
}

/**
 * Liste d'affichage de la légende. Elle occupe tout le canvas : le banc est en
 * pause pendant qu'elle est ouverte, personne ne regarde le combat.
 *
 * @param {object} projection Résultat de calculerProjection.
 * @returns {Array<object>} primitives, exécutables par canvas2d.executer.
 */
export function listeLegende(projection) {
  const { largeurPx, hauteurPx } = projection;
  const liste = [rect(0, 0, largeurPx, hauteurPx, FOND)];

  // Une vignette par ligne, la hauteur de canvas répartie sur les 19 couples,
  // les 2 camps, les 4 divers et les 4 titres — 29 lignes en tout.
  const lignes = ENTREES_LEGENDE.length + 2 + 4 + 4;
  const pas = Math.max(12, Math.floor((hauteurPx - 8) / lignes));
  const t = Math.max(8, pas - 4);
  const marge = Math.max(4, Math.floor(largeurPx / 40));
  const taillePolice = Math.max(9, Math.min(13, Math.floor(t * 0.55)));
  const xLibelle = marge + t + marge;
  let y = 4;

  const titre = (contenu) => {
    liste.push(texte(marge, y + Math.floor(pas / 2), contenu, PALETTE.kakiLumiere,
      Math.max(10, taillePolice + 1)));
    y += pas;
  };
  const ligneVignette = (dessin, libelle) => {
    dessin(y);
    liste.push(texte(xLibelle, y + Math.floor(t / 2), libelle, PALETTE.metalClair, taillePolice));
    y += pas;
  };

  titre('LA FORME DIT LA CLASSE, LA COULEUR DIT LA CIBLE');
  for (const entree of ENTREES_LEGENDE) {
    const libelle = `${NOMS_CLASSE[entree.classe]} · ${NOMS_ACCENT[entree.accent ?? 'aucun']}`;
    ligneVignette(
      (yv) => dessinerVignette(liste, marge, yv, t, entree.classe, 'attaque', entree.accent),
      libelle,
    );
  }

  titre('LE CAMP SE LIT AU TON DU CHÂSSIS');
  for (const [camp, libelle] of [['attaque', 'Vous — châssis kaki'], ['defense', 'L\'Ouvrage — métal sombre']]) {
    ligneVignette(
      (yv) => dessinerVignette(liste, marge, yv, t, 'blinde', camp, 'vehicule'),
      libelle,
    );
  }

  titre('LE RESTE');
  const bh = Math.max(2, Math.floor(t / 6));
  ligneVignette(
    (yv) => liste.push(rect(marge, yv, t, t, COULEUR_OBSTACLE)),
    'Obstacle — vitesse divisée par 2,5',
  );
  ligneVignette((yv) => {
    liste.push(rect(marge, yv + Math.floor(t / 2) - bh, t, bh, PALETTE.contour));
    liste.push(rect(marge, yv + Math.floor(t / 2) - bh, Math.floor((t * 2) / 3), bh, COULEUR_BARRE_PV));
  }, 'Barre de PV — au-dessus de chaque entité');
  ligneVignette((yv) => {
    liste.push(rect(marge, yv + Math.floor(t / 2) - bh, t, bh, PALETTE.contour));
    liste.push(rect(marge, yv + Math.floor(t / 2) - bh, Math.floor(t / 3), bh, COULEUR_BARRE_RESERVE));
  }, 'Barre de réserve — munitions restantes');
  ligneVignette(
    (yv) => liste.push(ligne(marge, yv + t, marge + t, yv, PALETTE.accents.vehicule.clair, 2)),
    'Trait de tir — dans la couleur de la cible',
  );

  titre('Toucher une case pour identifier son occupant.');
  return liste;
}

// --- l'Arsenal — lot 5A ------------------------------------------------------

/**
 * Liste d'affichage de l'Arsenal : la grille 4 × 9 de composition.
 *
 * ⚠ L'INVARIANT DU LOT. Les abscisses viennent de `xDeColonne`, les ordonnées
 * de `yDeRangee` — les MÊMES que le champ de bataille. La colonne de l'Arsenal
 * est donc la colonne du champ AU PIXEL PRÈS, et rien ici ne recalcule une
 * abscisse.
 *
 * Le bloc occupe les quatre rangées BASSES du champ, là où l'assaut se déploie.
 * La vague 1 — celle qui part la première — est la rangée du HAUT du bloc,
 * c'est-à-dire la rangée 4 du champ ; la vague 4 est la rangée 1. La file
 * avance vers le haut, comme tout le reste du jeu.
 *
 * @param {{cases: Array<Array<string|null>>}} grille État de `arsenal.js`.
 * @param {object} projection Résultat de calculerProjection.
 * @param {number[]} colonnesEnFile Colonnes portant un indice de file (§6).
 * @returns {Array<object>} primitives, exécutables par canvas2d.executer.
 */
export function listeArsenal(grille, projection, colonnesEnFile = []) {
  const t = projection.tailleCase;
  const nbVagues = grille.cases.length;
  const liste = [rect(0, 0, projection.largeurPx, projection.hauteurPx, FOND)];
  const taillePolice = Math.max(9, Math.min(14, Math.floor(t * 0.4)));

  // Numéros de colonne, juste au-dessus du bloc : ils disent au joueur que la
  // colonne 5 de l'Arsenal est la colonne 5 du champ.
  const yEntete = yDeRangee(projection, nbVagues + 1) + t - Math.floor(t / 4);
  for (let colonne = 1; colonne <= GRILLE.largeur; colonne += 1) {
    liste.push(texte(
      xDeColonne(projection, colonne) + Math.floor(t / 2) - Math.floor(taillePolice / 3),
      yEntete, String(colonne), PALETTE.metalClair, taillePolice,
    ));
  }

  // Marquage de la file : une barre fine au-dessus de la colonne concernée,
  // dans le kaki lumière de l'interface. Aucune teinte neuve, aucun accent —
  // les accents disent ce qu'une entité peut tuer, jamais un avertissement.
  const epaisseur = Math.max(2, Math.floor(t / 10));
  for (const colonne of colonnesEnFile) {
    liste.push(rect(xDeColonne(projection, colonne), yEntete + Math.floor(taillePolice / 2),
      t, epaisseur, PALETTE.kakiLumiere));
  }

  // Les quatre rangées, vague 1 en haut.
  for (let indice = 0; indice < nbVagues; indice += 1) {
    const rangee = nbVagues - indice;
    const y = yDeRangee(projection, rangee);
    for (let colonne = 1; colonne <= grille.cases[indice].length; colonne += 1) {
      const x = xDeColonne(projection, colonne);
      liste.push(cadre(x, y, t, t, PALETTE.kakiOmbre, 1));
      const id = grille.cases[indice][colonne - 1];
      if (id === null) continue;
      dessinerEntite(liste, x, y, t, classeDe('unite', id), 'attaque', accentDe('unite', id),
        couchesDeLEntite({ genre: 'unite', id, proprietaire: 'joueur', camp: 'attaque' }));
    }
  }
  return liste;
}

// --- l'écran de Défense — lot 5C ---------------------------------------------

/**
 * Liste d'affichage de l'écran de Défense : la grille 8 × 9 de la garnison.
 *
 * ⚠ ELLE NE SE DÉDUIT PAS DE `listeArsenal`, et trois différences l'imposent :
 *
 *  1. **Les rangées montent.** L'Arsenal calcule `nbVagues - indice` et occupe
 *     les rangées 4 à 1, les plus basses. Ici `cases[0]` est la rangée 3, la
 *     plus AVANCÉE — celle que l'assaut rencontre en premier —, d'où
 *     `rangee = PREMIERE_RANGEE + indice`, dans l'autre sens.
 *  2. **Le genre n'est pas connu d'avance.** L'Arsenal ne porte que des UNITES.
 *     La garnison porte des DEFENSES *et* des UNITES à rôle défensif : le genre
 *     se déduit de l'identifiant, comme le fait `ligne(id)` dans `defense.js`.
 *  3. **Le camp est la défense.** L'Arsenal dessine en `'attaque'`, châssis
 *     kaki ; une garnison se dessine en `'defense'`.
 *
 * L'en-tête de colonnes, lui, est repris à l'identique : la colonne 5 de
 * l'éditeur est la colonne 5 du champ, des deux côtés.
 *
 * @param {{cases: Array<Array<string|null>>}} grille État de `defense.js`.
 * @param {object} projection Résultat de calculerProjection.
 * @param {Array<{rangee: number, colonne: number}>} casesMarquees Sortie
 *   d'`indicesDeCouverture` — l'indice désigne une PIÈCE, pas un couloir, donc
 *   le marquage est par case et non par colonne.
 * @returns {Array<object>} primitives, exécutables par canvas2d.executer.
 */
export function listeDefense(grille, projection, casesMarquees = []) {
  const t = projection.tailleCase;
  const premiereRangee = GRILLE.bandes.defense.premiere;
  const nbRangees = grille.cases.length;
  const liste = [rect(0, 0, projection.largeurPx, projection.hauteurPx, FOND)];
  const taillePolice = Math.max(9, Math.min(14, Math.floor(t * 0.4)));

  // Numéros de colonne, juste au-dessus de la bande — même repère que l'Arsenal.
  const yEntete = yDeRangee(projection, premiereRangee + nbRangees) - Math.floor(t / 4);
  for (let colonne = 1; colonne <= GRILLE.largeur; colonne += 1) {
    liste.push(texte(
      xDeColonne(projection, colonne) + Math.floor(t / 2) - Math.floor(taillePolice / 3),
      yEntete, String(colonne), PALETTE.metalClair, taillePolice,
    ));
  }

  // Les huit rangées, la 3 en bas de l'écran comme sur le champ — l'assaut
  // monte, et la grille se lit dans le sens où il la traverse.
  // ⚠ LA GRILLE MÊLE DÉFENSES ET UNITÉS, ET SEULES LES DÉFENSES CHAÎNENT. On
  // reconstitue donc les voisines depuis les indices — rangée et colonne — au
  // lieu de passer la grille brute, que `liaisonDuMur` ne saurait pas lire.
  const voisines = [];
  for (let indice = 0; indice < nbRangees; indice += 1) {
    for (let colonne = 1; colonne <= grille.cases[indice].length; colonne += 1) {
      const id = grille.cases[indice][colonne - 1];
      if (id !== null && DEFENSES[id] !== undefined) {
        voisines.push({ id, rangee: premiereRangee + indice, colonne });
      }
    }
  }

  for (let indice = 0; indice < nbRangees; indice += 1) {
    const rangee = premiereRangee + indice;
    const y = yDeRangee(projection, rangee);
    for (let colonne = 1; colonne <= grille.cases[indice].length; colonne += 1) {
      const x = xDeColonne(projection, colonne);
      liste.push(cadre(x, y, t, t, PALETTE.kakiOmbre, 1));
      const id = grille.cases[indice][colonne - 1];
      if (id === null) continue;
      const genre = DEFENSES[id] !== undefined ? 'defense' : 'unite';
      dessinerEntite(liste, x, y, t, classeDe(genre, id), 'defense', accentDe(genre, id),
        couchesDeLEntite(
          { genre, id, proprietaire: 'joueur', camp: 'defense', rangee, colonne },
          { voisines },
        ));
    }
  }

  // Marquage de l'engagement réduit : une barre fine au bas de la CASE, dans le
  // kaki lumière de l'interface. Aucune teinte neuve, aucun accent — les accents
  // disent ce qu'une entité peut tuer, jamais un avertissement. Posée en
  // dernier, elle reste lisible par-dessus le socle d'une structure.
  const epaisseur = Math.max(2, Math.floor(t / 10));
  for (const c of casesMarquees) {
    liste.push(rect(xDeColonne(projection, c.colonne),
      yDeRangee(projection, c.rangee) + t - epaisseur, t, epaisseur, PALETTE.kakiLumiere));
  }
  return liste;
}
