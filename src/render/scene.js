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
// rampe MÉTAL en attendant » : ses sprites sont VIOLETS.
//
// ⚠⚠ LA MESURE A ÉTÉ REFAITE AU LOT OUVRAGE-CÂBLAGE, PARCE QUE LE FICHIER
// QU'ELLE CITAIT N'EXISTE PLUS. Elle portait sur `off_o_ratisseur`, l'un des
// neuf blindés monolithes que ce lot retire, et sur un sprite QUANTIFIÉ sur
// quatorze teintes — `#382E47` (279 px), `#231D2E` (173), `#4E4160` (146) —, ce
// que la chaîne ne fait plus depuis le lot PIXELS. Un commentaire qui nomme un
// fichier absent envoie chercher ce qu'on ne trouvera pas.
//
// Refaite sur `off_o_ratisseur_chassis` à la grille 64, v2 : **623 pixels
// opaques pour 564 teintes DISTINCTES** — c'est de la matière réduite au filtre,
// pas une palette, et c'est pourquoi on ne peut plus en nommer quatre —, et
// **99,0 % des pixels portent plus de rouge ET plus de bleu que de vert**, ce
// qui est la définition la plus simple de « violet ». La conclusion tient, et
// elle tient plus largement qu'avant.
//
// ⚠ ET AUCUNE VALEUR HEXADÉCIMALE N'EST CITÉE ICI, DÉLIBÉRÉMENT. La garde de
// palette de `banc.test.js` compte au motif `#` + six chiffres sur tout `src/`
// et refuse ce qui n'est pas dans `FICHE-STYLE.md` ; les quatre dominantes de la
// v2 n'y sont pas, puisque la chaîne ne quantifie plus. Le premier jet de ce
// paragraphe les nommait et la garde est tombée dessus — **c'est le TEXTE qui a
// été corrigé, pas la garde**, huitième fois du dépôt. Les nombres complets sont
// au rapport du lot.
//
// ⚠ CE QUI SUBSISTE DE LA RAMPE MÉTAL POUR L'OUVRAGE, C'EST LA LÉGENDE, et elle
// seule. `corpsDe` a toujours des appelants — `dessinerEscouade`,
// `dessinerBlinde` et `dessinerAeronef` servent les vignettes de
// `listeLegende`, qui restent GÉOMÉTRIQUES faute d'identifiant d'unité à
// résoudre. Le code n'est donc pas mort ; c'est sa portée qui a rétréci, du
// champ de bataille à la légende.

import { GRILLE, UNITES, DEFENSES, COLONNES_DEGATS } from '../data/combat.js';
import { BATIMENTS, RESTE_APRES_DESTRUCTION } from '../data/sites.js';
import {
  xDeColonne, xDeColonneMilli, yDeRangeeMilli, yDeRangee,
} from './projection.js';
import { rectangleDuFond } from './fond.js';
import { positionInterpolee } from './interpolation.js';
import { celluleDuSprite, existeDansAtlas } from './sprite.js';
import { ETATS_BATIMENT, SUFFIXE_ETAT_BATIMENT, batimentDeReference } from '../data/base.js';
import { COTE_SPRITE } from '../data/atlas.js';
import { ANCRES_BLINDES } from '../data/ancres-blindes.js';
import { ANCRES_DEFENSE } from '../data/ancres-defense.js';
import { angleDeLaPiece } from '../sim/rendu-pose.js';
import { nomDeVariante } from './variante.js';
import { caseDepuisMilli } from '../sim/grille.js';
import { estNeutralisee } from '../sim/combat.js';

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
 * maintenant UNE — le sprite —, sauf le blindé qui en émet DEUX, sa coque et sa
 * tourelle orientable.
 *
 * ⚠⚠ `blinde: 2` VAUT POUR LES DEUX CAMPS DEPUIS LE LOT OUVRAGE-CÂBLAGE, ET
 * L'EXCEPTION QUI ÉTAIT ÉCRITE ICI A DISPARU. Elle disait « `blinde: 2` vaut
 * pour le joueur, et le blindé de l'Ouvrage en émet un seul — sa tourelle est
 * cuite dans la coque, arbitré le 30/08 », et elle ajoutait qu'une scène qui
 * mêle les deux camps devait se compter entité par entité. C'était la SEULE
 * entrée de cette table dont la valeur dépendait d'autre chose que de la classe.
 * Les neuf coques et les cinq tourelles de l'Ouvrage sont dessinées depuis le
 * 07/09 : toute la table redépend de la seule classe, et une scène mixte se
 * compte de nouveau par elle.
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
  blinde: 2, //    coque + tourelle orientable — les DEUX camps depuis le 07/09
  aeronef: 1, //   le sprite de l'unité
  mur: 1, //       le merlon seul — il ne se raccorde plus à ses voisines
  barriere: 1, //  ni orientation, ni socle
  tourelle: 2, //  socle nu + tourelle TOURNÉE — un seul dessin, un angle
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
const sprite = (famille, nom, x, y, l, h, angle = 0) => {
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
    // ⚠ EN DEGRÉS, ET ZÉRO PAR DÉFAUT — donc porté par TOUTES les primitives,
    // même celles qui ne tournent pas. Ne le poser que sur les tournantes
    // demanderait à `canvas2d.js` de distinguer « absent » de « nul » pour un
    // dessin identique, et la première primitive qui l'oublierait le ferait en
    // silence. Le sens est celui de `angleVers` : 0 au nord, 90 à l'est.
    angle,
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
    angle: 0,
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
 * `existeDansAtlas` fait qu'il n'y aura alors RIEN à changer. Un test fige la
 * coïncidence d'aujourd'hui et rougira ce jour-là.
 *
 * ⚠ ELLE SERT AUSSI LES DIX-HUIT COQUES — NEUF PAR CAMP DEPUIS LE LOT
 * OUVRAGE-CÂBLAGE —, ET LEUR COMPTE N'EST PAS DE VINGT : ni
 * `off_j_pilon_chassis_def` ni `off_o_pilon_chassis_def` n'existe, l'Obusier
 * n'entrant jamais en garnison, `pilon.defense.present` valant `false`. C'est la
 * même absence des deux côtés, et c'est la table de l'atlas qui le dit, pas une
 * liste écrite ici — ce qui est exactement ce qui a permis à ce lot de brancher
 * un second camp sans toucher à cette fonction.
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
 * ⚠⚠ UN BLINDÉ ÉMET DEUX COUCHES DANS LES DEUX CAMPS DEPUIS LE LOT
 * OUVRAGE-CÂBLAGE, ET CE PARAGRAPHE DISAIT LE CONTRAIRE. Il portait « le blindé
 * du JOUEUR est le seul à deux couches ; celui de l'Ouvrage n'en a qu'une, sa
 * tourelle est cuite dans la coque — ne pas chercher `off_o_*_chassis`, il n'en
 * existe pas ». Les deux moitiés sont devenues fausses le 07/09 : Ethan a livré
 * les neuf coques et les cinq tourelles de l'Ouvrage, dessinées séparément comme
 * celles du joueur. Le `|| c === 'o'` qui renvoyait l'Ouvrage sur le monolithe
 * est parti avec elles, et les cinq monolithes `off_o_<id>` ne sont plus cousus.
 *
 * ⚠ LE NOM SE COMPOSE SUR LE PROPRIÉTAIRE, `off_${c}_`, JAMAIS `off_j_` EN DUR.
 * Écrit en dur, il aurait donné la coque du joueur à un blindé de l'Ouvrage sans
 * lever — les deux existent dans l'atlas, donc `existeDansAtlas` aurait dit oui.
 * C'est la faute que `pointsRecherche` a déjà payée au lot MODULES-E.
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

  if (classe !== 'blinde') {
    return [{ famille: 'unite', nom: nomAvecPose('unite', `off_${c}_${d.id}`, force) }];
  }

  // Blindé : la coque, puis la tourelle TOURNÉE par-dessus. Les deux camps.
  const coque = nomAvecPose('chassis', `off_${c}_${d.id}_chassis`, force);
  const angle = angleDeLaPiece(
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
      //
      // ⚠⚠ UN SEUL SPRITE, PLUS SEIZE. `off_j_<id>_<orientation>` a disparu : la
      // tourelle est dessinée une fois, canon au NORD, et le rendu la tourne.
      // Cinq sprites au lieu de quatre-vingts, et l'angle devient CONTINU — la
      // tourelle suit sa cible au degré, là où seize orientations la faisaient
      // sauter par crans de 22,5°. ⚠ DIX depuis le lot OUVRAGE-CÂBLAGE, cinq
      // par camp : l'Ouvrage avait perdu ses quatre-vingts orientations au lot
      // PRODUCTION sans jamais en regagner une, il en a cinq qui tournent.
      famille: 'tourelle_unite',
      nom: `off_${c}_${d.id}_tourelle`,
      ancre: ANCRES_BLINDES[coque] ?? null,
      angle,
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
 * ⚠⚠ LE CHAÎNAGE A DISPARU AVEC LA v2, ET CE PARAGRAPHE DISAIT LE CONTRAIRE.
 * Il expliquait qu'« au combat, le chaînage suit les vivantes » — `liaisonDuMur`
 * lisant les voisines, un merlon repassait à `isole` quand sa voisine mourait.
 * Les vingt-quatre socles raccordés et les quatre merlons de liaison ne sont
 * plus dessinés : Ethan a arbitré le 05/09 que les pièces ne se raccordent pas.
 * `contexte.voisines` n'est donc plus lu ici, et les deux fonctions de liaison
 * de `sim/rendu-pose.js` n'ont plus d'objet. Un merlon est un merlon.
 *
 * ⚠⚠ ET LA TOURELLE NE CHANGE PLUS DE SPRITE : ELLE TOURNE. Un seul dessin,
 * canon au nord, avec son ANGLE — continu, au degré, là où seize orientations le
 * faisaient sauter par crans de 22,5°. C'est `dessinerCouches` qui pose le
 * carré, et `canvas2d.js` qui le tourne autour de son CENTRE.
 *
 * ⚠⚠ L'OUVRAGE TOURNE DEPUIS LE LOT OUVRAGE-CÂBLAGE, ET PAS UNE LIGNE DE CETTE
 * FONCTION N'A CHANGÉ POUR ÇA. Ce paragraphe disait « l'Ouvrage ne tourne pas » :
 * ses six tourelles étaient celles de la v1, dessinées au nord, pivot décalé de
 * 2 à 11 % du côté du sprite, si bien que les tourner autour du centre les
 * aurait fait osciller. Ethan les a redessinées le 07/09, carrées et centrées
 * sur leur pivot, et `tools/ancres-ouvrage.py` en a mesuré les six ancres.
 *
 * ⚠⚠ ET C'EST TOUT CE QU'IL A FALLU — c'est ce que « le discriminant est la
 * DONNÉE, jamais le camp » achète, mesuré cette fois plutôt qu'annoncé. Cette
 * fonction écrivait déjà `socle_def_${c}_${d.id}` et lisait
 * `ANCRES_DEFENSE[socle] ?? null` : tant que la table ne portait que le joueur,
 * le `?? null` rendait `null` et `dessinerCouches` posait la pièce sur la case
 * entière. Les six clés `socle_def_o_*` entrées dans `src/data/ancres-defense.js`
 * suffisent à la faire tourner. Un `=== 'o'` écrit ici en 2026-09-05 aurait été
 * la seconde vérité que §4 interdit, et il aurait fallu le RETIRER aujourd'hui,
 * dans un lot qui n'a rien à voir avec lui.
 *
 * @param {{genre: string, id: string, proprietaire: string}} d
 * @param {{cible: object|null}} contexte
 * @returns {{famille: string, nom: string, ancre?: object, angle?: number}[]}
 */
function couchesDeLaDefense(d, contexte) {
  const type = DEFENSES[d.id]?.type;
  if (type === undefined) {
    throw new RangeError(`scene : « ${d.id} » n'est pas une pièce de défense`);
  }
  const c = lettreDuProprietaire(d.proprietaire);
  const piece = { id: d.id, rangee: d.rangee ?? 0, colonne: d.colonne ?? 0 };

  // Un mur ne porte ni tourelle ni socle, et il ne se raccorde plus.
  if (type === 'mur') {
    return [{ famille: 'defense', nom: `def_${c}_${d.id}` }];
  }
  // Une barrière blesse au contact : ni tourelle à tourner, ni socle à poser.
  if (type === 'barriere') {
    return [{ famille: 'defense', nom: `def_${c}_${d.id}` }];
  }

  const socle = `socle_def_${c}_${d.id}`;
  const angle = angleDeLaPiece('garnison', piece, contexte.cible ?? null);
  return [
    { famille: 'socle', nom: socle },
    {
      famille: 'defense',
      nom: `def_${c}_${d.id}`,
      ancre: ANCRES_DEFENSE[socle] ?? null,
      angle,
    },
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
/**
 * Le nom d'un bâtiment dans l'état demandé, RABATTU sur ce que l'atlas porte.
 *
 * ⚠⚠ L'ÉTAT SE LIT DANS L'ATLAS, IL NE S'ÉCRIT PAS ICI — c'est déjà la règle
 * des poses `_def`, dix lignes plus haut, et c'est ce qui rend ce lot livrable
 * avant que l'art n'arrive. Un bâtiment dont `_tres_abime` n'est pas encore
 * cousu retombe sur `_abime`, puis sur l'intact ; le jour où la planche arrive,
 * il n'y a **rien** à changer, et aucune liste de « qui a quel état » ne traîne
 * quelque part pour y mentir.
 *
 * ⚠⚠ LA DÉGRADATION VA VERS LE SAIN, ET C'EST LE SEUL SENS DÉFENDABLE. Un
 * bâtiment très abîmé dessiné en `_abime` montre moins de dégâts qu'il n'en a ;
 * dessiné en `_detruit`, il annoncerait une ruine là où le joueur peut encore
 * réparer. Mieux vaut sous-dire que sur-dire : la barre de PV, elle, ne ment
 * jamais.
 *
 * ⚠ L'INTACT EST LE PLANCHER, ET IL EXISTE TOUJOURS. Les seize bâtiments
 * cousus depuis le lot 6 portent leur nom nu ; si même celui-là manquait, le
 * bâtiment n'aurait aucun sprite du tout et le rabattement n'y pourrait rien.
 *
 * @param {string} base le nom nu, `bat_<c>_<serpent>`
 * @param {string} etat une valeur d'`ETATS_BATIMENT`
 * @returns {string} un nom que l'atlas porte
 */
function nomAvecEtat(base, etat) {
  const rang = ETATS_BATIMENT.indexOf(etat);
  if (rang < 0) throw new RangeError(`bâtiment : état inconnu « ${etat} »`);
  for (let i = rang; i > 0; i -= 1) {
    const nom = `${base}${SUFFIXE_ETAT_BATIMENT[ETATS_BATIMENT[i]]}`;
    if (existeDansAtlas('batiment', nom)) return nom;
  }
  return base;
}

/**
 * Les couches d'un bâtiment — une seule, dans l'état où il se trouve.
 *
 * ⚠ L'ÉTAT EST UN CHAMP DU DESCRIPTEUR, PAS UN CALCUL FAIT ICI. `render/`
 * ne lit pas de PV : la règle des seuils vit dans `data/base.js`
 * (`etatDuBatiment`), et l'appelant la lui demande. Un module de rendu qui
 * saurait à partir de quel pourcentage un mur se fissure serait la seconde
 * vérité que `CLAUDE.md` §4 refuse.
 *
 * ⚠ ET SON DÉFAUT EST « INTACT », comme celui d'`avarie` pour les sites. Les
 * montages qui composent un bâtiment à la main — il y en a plusieurs au dépôt —
 * n'en portent pas, et un bâtiment sans blessure connue est un bâtiment sain.
 */
function couchesDuBatiment(d) {
  const c = lettreDuProprietaire(d.proprietaire);
  const nu = (id) => `bat_${c}_${id.replace(/([A-Z])/g, (m) => `_${m.toLowerCase()}`)}`;
  // ⚠⚠ UNE VIGNETTE DE PALETTE RETOMBE SUR CE QU'ELLE POSE, TANT QUE SON
  // ICÔNE N'EST PAS COUSUE — lot BÂTIMENTS-QUATRE-ÉTATS. `collecteurMixte` n'est
  // pas un bâtiment : c'est la vignette unique que le joueur touche, et Ethan a
  // une icône pour elle (« une icône collecteur mixte », 08/09) qui n'est pas
  // encore au dépôt. En attendant, elle montre le collecteur à quartz.
  //
  // ⚠⚠ ET C'EST L'ATLAS QUI DÉCIDE, PAS UNE LISTE. Le jour où
  // `bat_j_collecteur_mixte` est cousu, il est pris **sans qu'une ligne change
  // ici** — exactement comme les états manquants juste au-dessus, et comme les
  // poses `_def` depuis le lot 8. Un `if (id === 'collecteurMixte')` écrit ici
  // serait la ligne qu'on oublierait de retirer.
  //
  // ⚠ POUR TOUT AUTRE IDENTIFIANT, LA LIGNE NE FAIT RIEN.
  // `batimentDeReference` rend son argument quand ce n'est pas une vignette :
  // un bâtiment dont le sprite manquerait vraiment garde son nom, et le manque
  // se voit là où il doit se voir — dans `celluleDuSprite`, qui lève.
  const base = existeDansAtlas('batiment', nu(d.id)) ? nu(d.id) : nu(batimentDeReference(d.id));
  return [{ famille: 'batiment', nom: nomAvecEtat(base, d.etat ?? 'intact') }];
}

/**
 * Les couches d'une RUINE — une seule, et le propriétaire choisit la planche.
 *
 * ⚠⚠ `ruine_j` ET `ruine_o` DORMAIENT DANS L'ATLAS DEPUIS LEUR FABRICATION. Le
 * relevé du lot EFFONDREMENT les a trouvées dans la famille `batiment`, donc
 * DANS le livrable — payées en octets d'images — et employées par personne : un
 * `grep` sur tout `src/` ne les trouvait que dans leur propre déclaration.
 * C'était `ui_pause` une seconde fois. Ethan, 07/09 : « utilise ruine_j
 * ruine_o. »
 *
 * ⚠ LA LETTRE VIENT DE `lettreDuProprietaire`, comme partout ailleurs. Les deux
 * planches existent parce que les deux camps ont des bâtiments : c'est le
 * PROPRIÉTAIRE qui décide, jamais le camp — « le joueur peut défendre »
 * (CLAUDE.md §4).
 *
 * @param {string} proprietaire
 * @returns {{famille: string, nom: string}[]}
 */
export function couchesDeLaRuine(proprietaire) {
  return [{ famille: 'batiment', nom: `ruine_${lettreDuProprietaire(proprietaire)}` }];
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
 * @param {{cible?: object|null}} [contexte]
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
 * ⚠⚠ LES TROIS NOMBRES LUS ICI SONT EN POURCENTS DE LA CASE, PLUS DE LA PIÈCE,
 * ET LES CONFONDRE FAIT DEUX FOIS LA TAILLE DE LA CASE. `ANCRES_CHASSIS`
 * portait `diametre_pct`, `x_pct`, `y_pct` — mesurés sur le DESSIN, donc en
 * pourcentage de la coque ; les tables de la v2 portent en plus
 * `cote_case_pct`, `dx_case_pct`, `dy_case_pct`, qui sont ce que le rendu
 * emploie. Une pièce n'occupe pas la case entière — `recadrer` porte sa plus
 * grande dimension à `emprise / 32` —, donc lire les premiers pour les seconds
 * multiplie le carré par `32 / largeur_de_la_pièce` : mesuré, le carré du
 * Chasseur ferait 131,9 pixels de case sur 64, et celui de la Faucheuse 113,8.
 * Le facteur d'échelle et la marge de rotation sont DÉJÀ dans `cote_case_pct` :
 * il n'y a rien à multiplier ici.
 *
 * ⚠ UNE COUCHE SANS ANCRE SE POSE SUR LA CASE ENTIÈRE, et c'est ce qui laisse
 * l'Ouvrage intact : ses tourelles n'ont pas d'entrée, donc elles se dessinent
 * comme avant, sans rotation. Le camp n'est jamais testé ici.
 */
function dessinerCouches(liste, x, y, t, couches) {
  for (const couche of couches) {
    const angle = couche.angle ?? 0;
    if (!couche.ancre) {
      liste.push(sprite(couche.famille, couche.nom, x, y, t, t, angle));
      continue;
    }
    const { cote_case_pct: d, dx_case_pct: dx, dy_case_pct: dy } = couche.ancre;
    const cote = Math.max(1, Math.round((t * d) / 100));
    liste.push(sprite(
      couche.famille, couche.nom,
      Math.round(x + t / 2 + (t * dx) / 100 - cote / 2),
      Math.round(y + t / 2 + (t * dy) / 100 - cote / 2),
      cote, cote, angle,
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
 * dernier tick et la position courante, SUR LES DEUX AXES. Une entité née après
 * la prise — indice ≥ instantane.length — se dessine sans interpolation.
 *
 * ⚠⚠ LES DEUX AXES DEPUIS LE LOT COLONNE, 06/09. Elle ne rendait qu'une rangée,
 * et `xDe` lisait `e.colonne` en ENTIER : une défenseuse qui se décale aurait
 * sauté d'une colonne à l'autre entre deux images, le moteur étant juste et
 * l'écran faux. Elle rend un couple, et les DEUX passent par
 * `positionInterpolee` — la même fonction, qui ne sait pas de quel axe il
 * s'agit.
 *
 * ⚠ ET C'EST CE QUI A EXIGÉ `Math.trunc` DANS CETTE FONCTION-LÀ : un décalage
 * vers la gauche rend un delta NÉGATIF, que `Math.floor` arrondissait vers −∞,
 * donc au-delà de la destination. `COL T12` mesure le défaut, et il a été vu
 * rouge avant la correction.
 */
function positionAffichee(e, precedentes, alpha) {
  if (!precedentes || e.indice >= precedentes.length) {
    return { rangeeMilli: e.rangeeMilli, colonneMilli: e.colonneMilli };
  }
  const avant = precedentes[e.indice];
  return {
    rangeeMilli: positionInterpolee(avant.rangeeMilli, e.rangeeMilli, alpha),
    colonneMilli: positionInterpolee(avant.colonneMilli, e.colonneMilli, alpha),
  };
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
 * @param {Set<number>|null} tombees  Indices EFFONDRÉS — lot EFFONDREMENT.
 * @returns {Array<object>} primitives.
 */
export function listeAffichage(
  etat, projection, precedentes = null, alpha = 0, fond = null, graine = 0,
  tombees = null,
) {
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

  // 2. Obstacles — leur sprite, et le MÊME que sur l'écran de la base.
  //
  // ⚠⚠ ETHAN, 04/09 : « les sprites obstacles Ouvrage ne sont pas placés, c'est
  // les mêmes que le joueur ». Ils l'étaient — en aplat kaki, une teinte de
  // plus, donc ils ne ressemblaient à rien. Les six dessins sont dans
  // l'atlas `terrain` depuis le lot CHAMPS-ET-OBSTACLES, et l'écran Chantier les
  // emploie déjà.
  //
  // ⚠⚠ ET LA VARIANTE SE TIRE PAR LA MÊME FONCTION QUE LÀ-BAS — `nomDeVariante`,
  // descendue dans `render/variante.js` pour ça. La tirer autrement ici donnerait
  // au même obstacle un dessin dans la base et un autre au combat, et ça ne se
  // verrait qu'en comparant les deux écrans côte à côte.
  //
  // ⚠ LA GRAINE VIENT DE L'APPELANT, PAS DE L'ÉTAT DE COMBAT — même raison que
  // le nom du fond, deux blocs plus haut : un montage de combat n'en porte pas,
  // et lui en faire porter une mettrait une décision de DESSIN dans la
  // simulation. `ui/raid.js` sait quelle partie il joue.
  for (const o of etat.obstacles) {
    liste.push(sprite(
      'terrain', nomDeVariante(`obs_${o.type}`, graine, o.rangee, o.colonne),
      xDeColonne(projection, o.colonne), yDeRangee(projection, o.rangee), t, t,
    ));
  }

  // Positions affichées, calculées une fois : barres et traits les réutilisent.
  const positions = new Map();
  for (const e of etat.entites) {
    if (visible(e)) positions.set(e.indice, positionAffichee(e, precedentes, alpha));
  }
  const positionDe = (e) => positions.get(e.indice)
    ?? { rangeeMilli: e.rangeeMilli, colonneMilli: e.colonneMilli };
  const xDe = (e) => xDeColonneMilli(projection, positionDe(e).colonneMilli);
  const yDe = (e) => yDeRangeeMilli(projection, positionDe(e).rangeeMilli);

  // ⚠⚠ LA LISTE DES DÉFENSES VIVANTES A DISPARU AVEC LE CHAÎNAGE, ET C'EST LE
  // LOT. Elle était calculée ici, une fois par image, pour que `liaisonDuMur`
  // puisse faire repasser à `isole` le merlon dont la voisine venait de mourir.
  // Les pièces ne se raccordent plus — arbitrage du 05/09 —, donc plus personne
  // ne la lit. La retirer est aussi ce qui solde le défaut mesuré du lot
  // STRUCTURES-AU-COMBAT : elle portait `e.rangee`, qui n'existe pas sur une
  // entité de combat, et le chaînage était mort au champ pendant un lot entier.

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
    const pos = positionDe(cible);
    return { rangee: pos.rangeeMilli / 1000, colonne: pos.colonneMilli / 1000 };
  };

  /**
   * Cette entité est-elle tombée dans l'effondrement de fin de raid ?
   *
   * ⚠⚠ LE PARAMÈTRE EST UN ENSEMBLE D'INDICES, ET L'ÉTAT N'EST PAS TOUCHÉ — lot
   * EFFONDREMENT, 07/09. L'effondrement est du DESSIN : `executerRaid` a commis
   * tout l'état avant la première image, et une liste d'affichage n'a pas à
   * muter ce qu'elle lit. `null` veut dire « aucun effondrement », et c'est le
   * cas de tous les appelants sauf le déroulé de `ui/raid.js`.
   */
  const estTombee = (e) => tombees !== null && tombees.has(e.indice);

  // 3. Bâtiments — 4. structures — 5. unités.
  for (const genreVoulu of ['batiment', 'defense', 'unite']) {
    for (const e of etat.entites) {
      if (!visible(e) || e.genre !== genreVoulu) continue;
      const x = xDe(e);
      const y = yDe(e);
      // ⚠⚠ CE QU'UNE CHOSE DÉTRUITE LAISSE DERRIÈRE ELLE SE LIT DANS
      // `RESTE_APRES_DESTRUCTION`, IL NE SE DÉCIDE PAS ICI. Le premier jet
      // écrivait `if (genreVoulu === 'unite') continue;` — juste, et déjà une
      // règle de jeu écrite dans un fichier de dessin. Ethan a demandé de
      // restreindre aux bâtiments « pour l'instant » : c'est très exactement un
      // réglage qui va bouger, donc il appartient à `src/data/`.
      //
      // ⚠ UN GENRE ABSENT DE LA TABLE LÈVE, il ne retombe pas sur un défaut. Une
      // entité qu'on oublierait de classer disparaîtrait en silence, et le
      // silence est ce qu'on ne veut pas d'un effet qu'on ne regarde qu'une fois
      // par raid.
      if (estTombee(e)) {
        const reste = RESTE_APRES_DESTRUCTION[genreVoulu];
        if (reste === undefined) {
          throw new Error(`scene : genre « ${genreVoulu} » sans reste après destruction`);
        }
        if (reste === 'rien') continue;
        dessinerEntite(liste, x, y, t, classeDe(e.genre, e.id), e.camp,
          accentDe(e.genre, e.id), couchesDeLaRuine(e.proprietaire));
        continue;
      }
      dessinerEntite(liste, x, y, t, classeDe(e.genre, e.id), e.camp,
        accentDe(e.genre, e.id), couchesDeLEntite({
          genre: e.genre,
          id: e.id,
          proprietaire: e.proprietaire,
          camp: e.camp,
          // ⚠ LA RANGÉE AFFICHÉE, INTERPOLÉE COMME CELLE DE LA CIBLE. Viser
          // juste depuis une case fausse rendrait le même décalage que viser
          // faux depuis la bonne.
          rangee: positionDe(e).rangeeMilli / 1000,
          // ⚠ LA COLONNE AFFICHÉE, INTERPOLÉE ELLE AUSSI — LOT COLONNE. Elle
          // était lue en entier sur l'entité : la tourelle d'une défenseuse qui
          // se décale aurait visé depuis la case qu'elle vient de quitter.
          colonne: positionDe(e).colonneMilli / 1000,
        }, { cible: cibleAffichee(e) }));
    }
  }

  // 6. Barres — PV pour toute entité vivante, réserve pour les attaquants.
  //    Les PV ne s'interpolent JAMAIS : la barre dit l'état du tick, pas un
  //    glissement — une barre qui glisse ment sur l'instant de la mort.
  const bh = Math.max(2, Math.floor(t / 12));
  for (const e of etat.entites) {
    // ⚠ UNE RUINE N'A PAS DE BARRE DE PV, et une pièce effondrée non plus : la
    // barre dit ce qu'il reste à casser, et il ne reste rien.
    if (!visible(e) || estTombee(e)) continue;
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
    // ⚠⚠ LE CADRE DE NEUTRALISATION — lot NEUTRALISATION, 08/09/2026. C'est le
    // SEUL retour visuel du lot, et il ne coûte aucun actif : `cadre` est une
    // primitive de `canvas2d.js` au même titre que `rect`, et `metalClair`
    // (`#68727E`) est dans la palette close depuis toujours. Le livrable ne
    // gagne pas une ligne `data:`.
    // ⚠ IL APPELLE LE PRÉDICAT DU MOTEUR, il ne le réécrit pas — voir
    // `estNeutralisee` de `sim/combat.js`.
    // ⚠ ET IL NE S'INTERPOLE PAS : il reprend `x` et `y`, les positions que la
    // boucle des barres a déjà calculées. Les recalculer donnerait un cadre qui
    // glisse d'un demi-pixel derrière la pièce qu'il entoure.
    if (estNeutralisee(e)) liste.push(cadre(x, y, t, t, PALETTE.metalClair, 2));
  }

  // 7. Traits de tir : bref segment tireur → cible pour toute entité qui a
  //    tiré ce tick, dans la couleur CLAIRE de son accent — « la bouche du
  //    canon reprend la couleur claire de l'accent » (fiche §4). La cible peut
  //    être morte de ce tir : le trait se dessine quand même, vers sa case.
  const demi = Math.floor(t / 2);
  for (const e of etat.entites) {
    if (!visible(e) || estTombee(e) || !e.aTire || e.cibleIndice === null) continue;
    const cible = etat.entites[e.cibleIndice];
    const accent = accentDe(e.genre, e.id);
    // Une cible morte de ce tir n'est plus dans `positions` : le trait va
    // alors à sa dernière position brute, sur les DEUX axes.
    const posCible = positionDe(cible);
    liste.push(ligne(
      xDe(e) + demi, yDe(e) + demi,
      xDeColonneMilli(projection, posCible.colonneMilli) + demi,
      yDeRangeeMilli(projection, posCible.rangeeMilli) + demi,
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
/**
 * ⚠⚠ LES DEUX FONCTIONS QUI SUIVENT ONT DÉMÉNAGÉ DEPUIS `src/ui/banc.js` — lot
 * FICHES-ENNEMIES, 07/09, ET C'EST UN DÉPLACEMENT, PAS UNE COPIE. Elles y
 * vivaient parce qu'un seul écran s'en servait ; la fiche d'une cible ennemie
 * en a besoin aussi, et `src/ui/raid.js` ne peut pas importer le BANC — un
 * écran de production qui dépend du banc de debug est la dépendance à l'envers.
 * Pas une ligne de leur corps n'a changé en route, et `banc.js` les importe
 * désormais d'ici.
 *
 * ⚠ ET C'EST LE BON MODULE : celui-ci répond déjà « qu'est-ce que cette
 * entité » — `classeDe`, `accentDe`, `NOMS_CLASSE`, `couchesDeLEntite`. « Quel
 * est son nom » et « qui occupe cette case » sont de la même famille.
 */

/**
 * Nom affiché d'une entité — DEUX JEUX DE NOMS, jamais mélangés : le joueur
 * emploie le vocabulaire d'une armée régulière, l'Ouvrage celui des outils et
 * des bêtes.
 *
 * ⚠ LA CLÉ EST LE PROPRIÉTAIRE, PAS LE CAMP. Elle a longtemps été le camp, et
 * ça marchait tant que seul l'Ouvrage défendait. Le jour où le joueur garnit sa
 * propre base, le camp de ses unités devient « defense » sans qu'elles changent
 * de propriétaire — et elles s'afficheraient sous le nom de l'Ouvrage.
 *
 * Les BÂTIMENTS n'ont qu'un nom : une Souche est une Souche des deux côtés.
 * Les DÉFENSES en ont deux depuis le 25/08/2026.
 */
export function nomAffiche(entite) {
  if (entite.genre === 'batiment') return BATIMENTS[entite.id].nom;
  const joueur = entite.proprietaire === 'joueur';
  if (entite.genre === 'defense') {
    const noms = DEFENSES[entite.id].nom;
    return joueur ? noms.joueur : noms.ouvrage;
  }
  const noms = UNITES[entite.id].nom;
  return joueur ? noms.joueur : noms.ouvrage;
}

/**
 * Entités actives occupant une case. L'aviation ne bloque rien et peut donc
 * partager sa case avec une entité au sol : la liste peut en compter deux.
 */
export function entitesSurLaCase(etat, rangee, colonne) {
  return etat.entites.filter((e) => e.vivant && !e.sorti
    && caseDepuisMilli(e.colonneMilli) === colonne
    && caseDepuisMilli(e.rangeeMilli) === rangee);
}

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
  // ⚠⚠ LA LÉGENDE MONTRE LE SPRITE, PLUS L'APLAT — lot ERGONOMIE, 04/09. Le
  // champ dessine désormais les obstacles ; lui laisser un carré kaki
  // apprendrait au joueur un vocabulaire visuel que le combat n'emploie pas,
  // c'est-à-dire la faute même que le lot STRUCTURES-AU-COMBAT existe pour
  // retirer. Le dessin retenu est celui qui ralentit TOUT, parce que la ligne
  // parle des trois types à la fois.
  //
  // ⚠ ET LA VARIANTE SE DEMANDE COMME AILLEURS : une vignette de légende n'a ni
  // graine ni case, donc elle prend celles du coin de la grille — ce qui compte
  // ici est que le nom sorte de la même fonction, jamais qu'il soit écrit à la
  // main.
  ligneVignette(
    (yv) => liste.push(sprite('terrain', nomDeVariante('obs_les_deux', 0, 1, 1), marge, yv, t, t)),
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
