// LA MINI-CARTE — les 31 × 300 cases de la carte du monde sur une seule image.
//
// Ethan, 10/09 : « faire un bouton une mini carte qui passe sur 1080 1920 avec
// les poi ».
//
// ⚠⚠ LES CASES SONT ÉTIRÉES, ET C'EST LA CONSÉQUENCE QU'ETHAN A VALIDÉE. À
// échelle uniforme sur 1080 × 1920, la HAUTEUR commande — 1920 / 300 = 6,4 px
// par rangée — et 31 colonnes de 6,4 px feraient un ruban de 198 px de large,
// c'est-à-dire quatre cinquièmes de l'écran vides. La case fait donc ~34,8 px de
// large sur 6,4 de haut, et la carte remplit son cadre.
//
// ⚠⚠ 1080 × 1920 SONT DES PIXELS D'APPAREIL, JAMAIS DES PIXELS CSS. Le S25 FE
// rend à `devicePixelRatio` 3 : c'est le `width`/`height` du canevas qui vaut
// 1080 × 1920, et sa surface CSS 360 × 640. Les confondre donnerait une carte
// floue au tiers de la taille — le défaut exact que `dimensionner` de
// `ui/monde.js` existe pour éviter sur la grande carte.
//
// ⚠⚠ MODULE PUR, SANS DOM ET SANS CANEVAS. Il rend une GÉOMÉTRIE et une LISTE ;
// `ui/monde.js` peint. C'est le motif de `listeAffichage` et de
// `render/terrain.js`, et c'est la seule manière d'éprouver quoi que ce soit
// dans un dépôt qui n'a pas de navigateur (`CLAUDE.md` §3).
//
// ⚠⚠ ET IL NE PORTE PAS UNE SEULE TEINTE ÉCRITE. Les quatre couleurs se LISENT
// dans `EMBLEMES_CARTE` et dans `TERRAIN_CARTE.rampes`, c'est-à-dire dans les
// tables que l'écran Monde emploie DÉJÀ pour ces mêmes objets. « Aucune teinte
// neuve » cesse donc d'être une promesse à tenir : `banc.test.js` §11 balaie ce
// fichier et n'y trouve aucun `#` à juger.

import { EMBLEMES_CARTE, GEOGRAPHIE, TERRAIN_CARTE } from '../data/sites.js';
import {
  NOMBRE_DE_BANDES, bandeDeLaRangee, carteDesPoi, poiEstAcquis, rangeesDeLaBande,
} from '../sim/poi.js';
import { basesDeLaFenetre } from '../sim/peuplement.js';
import { partDeTeinteDeLaRangee } from './terrain.js';

/** La largeur du canevas, en pixels D'APPAREIL. */
export const LARGEUR_PX = 1080;

/** La hauteur du canevas, en pixels D'APPAREIL. */
export const HAUTEUR_PX = 1920;

/**
 * Le bord GAUCHE d'une colonne, en pixels — et donc le bord DROIT de sa voisine.
 *
 * ⚠⚠ LES BORDS S'ARRONDISSENT, PAS LES LARGEURS, et c'est l'idiome que
 * `bordDeDalle` d'`ui/monde.js` porte depuis le lot ZOOM-CONTINU. Arrondir la
 * position ET la largeur chacune de son côté laisse un pixel de fond entre deux
 * cases voisines une fois sur deux ; en arrondissant le BORD, celui d'une case
 * EST celui de sa voisine — le même appel, donc le même nombre — et le pavage
 * est exact par construction.
 *
 * ⚠ IL PREND `colonne + 1` POUR LE BORD DROIT, donc il accepte
 * `largeur + 1` : `bordX(32)` vaut exactement 1080, ce qui est ce qui fait
 * tomber le coin sur le coin.
 *
 * @param {number} colonne 1…`GEOGRAPHIE.carte.largeur` + 1
 * @returns {number} pixel entier, de 0 à `LARGEUR_PX`
 */
export function bordX(colonne) {
  return Math.round(((colonne - 1) * LARGEUR_PX) / GEOGRAPHIE.carte.largeur);
}

/**
 * Le bord HAUT d'une rangée, même règle.
 *
 * @param {number} rangee 1…`GEOGRAPHIE.carte.hauteur` + 1
 * @returns {number} pixel entier, de 0 à `HAUTEUR_PX`
 */
export function bordY(rangee) {
  return Math.round(((rangee - 1) * HAUTEUR_PX) / GEOGRAPHIE.carte.hauteur);
}

/**
 * Le rectangle d'une case de carte sur la mini-carte.
 *
 * ⚠ ELLE LÈVE HORS CARTE plutôt que de rendre un rectangle plausible. Une case
 * hors carte est un fait de PROGRAMME : la rendre en silence poserait un
 * marqueur au bord, et une carte fausse qui a l'air juste est ce qui coûte le
 * plus cher à trouver.
 *
 * @param {number} rangee 1 en haut
 * @param {number} colonne 1 à gauche
 * @returns {{x: number, y: number, largeur: number, hauteur: number}}
 */
export function pixelDeLaCase(rangee, colonne) {
  const { largeur, hauteur } = GEOGRAPHIE.carte;
  if (!Number.isInteger(rangee) || rangee < 1 || rangee > hauteur
    || !Number.isInteger(colonne) || colonne < 1 || colonne > largeur) {
    throw new RangeError(
      `mini-carte : case (${rangee}, ${colonne}) hors de ${hauteur} × ${largeur}`,
    );
  }
  const x = bordX(colonne);
  const y = bordY(rangee);
  return { x, y, largeur: bordX(colonne + 1) - x, hauteur: bordY(rangee + 1) - y };
}

/**
 * Les dix tons du sol, du SUD au NORD.
 *
 * ⚠⚠ CE SONT LES DEUX RAMPES DE `FICHE-STYLE.md`, LUES ET NON RECOPIÉES. Le sol
 * de la vraie carte est l'art d'Ethan — vingt-deux planches, 2,2 Mo en base64 —
 * et il ne se lit pas à six pixels de haut : la mini-carte le remplace par des
 * APLATS. Ce qu'elle garde de lui, c'est sa loi de couleur, qui est la seule
 * chose qu'un aplat puisse encore dire.
 *
 * ⚠ CHAQUE RAMPE EST RETOURNÉE — poussière d'abord, creux ensuite —, si bien que
 * la carte s'assombrit à mesure qu'on monte vers l'Ouvrage. Les deux rampes
 * ayant la MÊME clarté rang par rang (c'est leur raison d'être, voir leur pavé
 * dans `data/sites.js`), les concaténer sans les retourner ferait redescendre la
 * clarté au milieu et la progression cesserait de se lire.
 */
export const TONS_DU_SOL = Object.freeze([
  ...[...TERRAIN_CARTE.rampes.joueur].reverse(),
  ...[...TERRAIN_CARTE.rampes.ouvrage].reverse(),
]);

/**
 * Le ton d'une bande de niveaux.
 *
 * ⚠ LE NOMBRE DE BANDES SE DEMANDE À `sim/poi.js`, ET IL EST LUI-MÊME DÉRIVÉ du
 * plafond de niveau. Écrire dix ici ferait une seconde vérité sur la même
 * grandeur, et la première à mentir le jour où `NIVEAUX_PAR_BANDE` bougerait.
 * La répartition est donc proportionnelle : à dix bandes pour dix tons elle est
 * l'identité, et elle dégrade proprement si les deux comptes divergent.
 *
 * @param {number} bande 1…`NOMBRE_DE_BANDES`
 */
export function tonDeLaBande(bande) {
  if (!Number.isInteger(bande) || bande < 1 || bande > NOMBRE_DE_BANDES) {
    throw new RangeError(`mini-carte : bande ${bande} hors de 1…${NOMBRE_DE_BANDES}`);
  }
  const rang = Math.floor(((bande - 1) * TONS_DU_SOL.length) / NOMBRE_DE_BANDES);
  return TONS_DU_SOL[Math.min(TONS_DU_SOL.length - 1, rang)];
}

/**
 * Le fond de la mini-carte : un aplat par bande de niveaux, du nord au sud.
 *
 * ⚠⚠ CE SONT LES BANDES DES GISEMENTS, ET C'EST TOUT L'INTÉRÊT. Le panneau des
 * POI écrit « bande 7 » sur chaque ligne ; sans un fond qui les montre, ce
 * nombre ne désigne rien à l'écran. Les mêmes `rangeesDeLaBande` servent aux
 * deux, donc les deux ne peuvent pas se contredire.
 *
 * ⚠ LES BANDES PAVENT LA HAUTEUR SANS TROU NI RECOUVREMENT, par le même
 * arrondi de BORD que les cases : le bas d'une bande est le haut de la suivante.
 *
 * @returns {Array<{bande: number, premiereRangee: number, derniereRangee: number,
 *                  y: number, hauteur: number, teinte: string}>}
 */
export function bandesDuSol() {
  const bandes = [];
  for (let bande = NOMBRE_DE_BANDES; bande >= 1; bande -= 1) {
    const rangees = rangeesDeLaBande(bande);
    const premiereRangee = rangees[0];
    const derniereRangee = rangees[rangees.length - 1];
    const y = bordY(premiereRangee);
    bandes.push({
      bande,
      premiereRangee,
      derniereRangee,
      y,
      hauteur: bordY(derniereRangee + 1) - y,
      teinte: tonDeLaBande(bande),
    });
  }
  return bandes;
}

/**
 * La bande où le sol bascule de l'ocre au violet, MESURÉE et non construite.
 *
 * ⚠⚠ ELLE EXISTE POUR QU'UN TEST PUISSE CONFRONTER LA MINI-CARTE À LA VRAIE.
 * `TONS_DU_SOL` bascule de rampe à mi-liste ; `partDeTeinteDeLaRangee` — la
 * fonction qui peint le sol pour de bon — franchit 0,5 quelque part sur la
 * carte. Les deux s'accordent aujourd'hui, et rien dans le code ne les y oblige :
 * si elles cessent de s'accorder, la mini-carte ment sur l'endroit où le sol de
 * l'Ouvrage commence, et c'est le test qui le dira.
 *
 * ⚠⚠ ET `selonLesTons` LIT LA RAMPE, PAS LE RANG DANS LA LISTE — la première
 * écriture faisait l'inverse, et elle était MUETTE : intervertir les deux rampes
 * de `TONS_DU_SOL` peignait le violet au SUD et l'ocre au NORD, c'est-à-dire
 * l'inverse exact de la carte, sans que la bascule bouge d'une bande. Mesuré par
 * falsification, et corrigé après la mesure.
 *
 * @returns {{selonLesTons: number, selonLeSol: number}}
 */
export function basculeDuSol() {
  let selonLesTons = NOMBRE_DE_BANDES;
  let selonLeSol = NOMBRE_DE_BANDES;
  for (let bande = 1; bande <= NOMBRE_DE_BANDES; bande += 1) {
    if (TERRAIN_CARTE.rampes.ouvrage.includes(tonDeLaBande(bande))
      && selonLesTons === NOMBRE_DE_BANDES) {
      selonLesTons = bande;
    }
    const rangees = rangeesDeLaBande(bande);
    const milieu = rangees[Math.floor(rangees.length / 2)];
    if (partDeTeinteDeLaRangee(milieu) >= 0.5 && selonLeSol === NOMBRE_DE_BANDES) {
      selonLeSol = bande;
    }
  }
  return { selonLesTons, selonLeSol };
}

/**
 * Les quatre teintes des marqueurs, LUES dans la table de l'écran Monde.
 *
 * ⚠⚠ LE MARQUEUR D'UNE BASE DE L'OUVRAGE REPREND SON **FOND**, PAS SON BORD, ET
 * C'EST UNE MESURE. Une carte de 9 300 cases en porte environ **1 590** — 17 %
 * de la surface : peintes en `EMBLEMES_CARTE.base.bord`, c'est-à-dire dans le
 * rouge que le dépôt réserve à ce qui ATTAQUE le joueur, elles feraient une
 * brume rouge sur un sixième de l'écran et ce rouge cesserait de désigner quoi
 * que ce soit. Le fond, lui, est déjà la teinte que l'emblème remplit.
 *
 * ⚠⚠ ET UN GISEMENT ACQUIS PREND L'AMBRE DU **BUTIN**. Le gabarit des sept POI
 * est en métal, et son propre pavé dit pourquoi : « un POI n'appartient à
 * personne tant qu'il n'est pas entré dans un territoire ». L'acquisition est
 * exactement le moment où cette phrase cesse d'être vraie, et l'ambre est la
 * teinte que la carte emploie déjà pour ce qui est à prendre — camp et
 * avant-poste. Les deux états se distinguent donc par la teinte que la carte
 * leur donne, pas par une teinte inventée pour la mini-carte.
 */
export const TEINTES = Object.freeze({
  ouvrage: EMBLEMES_CARTE.base.fond,
  poi: EMBLEMES_CARTE.poiQuartz.bord,
  poiAcquis: EMBLEMES_CARTE.camp.bord,
  base: EMBLEMES_CARTE.baseJoueur.bord,
});

/**
 * De combien de RANGÉES un marqueur ponctuel déborde de sa case, de chaque côté.
 *
 * ⚠⚠ IL EXISTE PARCE QUE LA MINI-CARTE A ÉTÉ REGARDÉE, PAS PARCE QU'ELLE A ÉTÉ
 * RELUE. Rendue dans Chromium à la géométrie du S25 FE, la carte porte **17,2 %
 * de bases de l'Ouvrage** — mesuré sur les 2,07 mégapixels du canevas — et à une
 * rangée de haut, les soixante-dix gisements s'y perdent : ils font la même
 * taille que la texture qu'ils doivent trancher. Or Ethan demande « une mini
 * carte avec les poi », et les POI sont le sujet.
 *
 * ⚠ CE N'EST PAS LA POSITION QUI BOUGE, C'EST LE DESSIN. `pixelDeLaCase` reste
 * la conversion exacte, un marqueur garde sa `rangee` et sa `colonne`, et c'est
 * son RECTANGLE qui grandit — borné au canevas, donc jamais hors cadre même sur
 * la première et la dernière rangée.
 *
 * ⚠ UNE BASE DE L'OUVRAGE N'EN A PAS. Elles sont mille cinq cent quatre-vingts :
 * les grossir ferait un aplat, et l'aplat ne dit plus où l'on peut passer.
 */
export const DEBORD = Object.freeze({ poi: 1, base: 2, ouvrage: 0 });

/**
 * Le rectangle DESSINÉ d'un marqueur : sa case, débordée et bornée au canevas.
 */
function rectangleDuMarqueur(rangee, colonne, debord) {
  const { hauteur } = GEOGRAPHIE.carte;
  const haut = Math.max(1, rangee - debord);
  const bas = Math.min(hauteur, rangee + debord);
  const x = bordX(colonne);
  const y = bordY(haut);
  return { x, y, largeur: bordX(colonne + 1) - x, hauteur: bordY(bas + 1) - y };
}

/** La carte entière, en une fenêtre — les bases de l'Ouvrage se lisent d'un coup. */
const CARTE_ENTIERE = Object.freeze({
  premiereRangee: 1,
  derniereRangee: GEOGRAPHIE.carte.hauteur,
  premiereColonne: 1,
  derniereColonne: GEOGRAPHIE.carte.largeur,
});

/**
 * Tous les marqueurs de la mini-carte, dans l'ORDRE DE DESSIN.
 *
 * ⚠⚠ L'ORDRE EST LE RÉSULTAT, PAS UN DÉTAIL. Les bases de l'Ouvrage d'abord —
 * elles sont la TEXTURE, celle qui dit où l'on ne passe pas —, les soixante-dix
 * gisements ensuite, la base du joueur en dernier : elle est unique et elle doit
 * rester visible même posée sur une case que l'Ouvrage tient.
 *
 * ⚠⚠ « LES BASES CONNUES » EST UNE LECTURE, ET ELLE SE DÉCLARE. Ce jeu n'a pas
 * de brouillard de guerre : `sitesDeLaFenetre` montre déjà tout ce qui est dans
 * la fenêtre, et le peuplement est une fonction pure de la graine. « Connues »
 * se lit donc « celles que le modèle sait produire », moins les RASÉES — qui ne
 * sont plus là du tout. Une seconde lecture demanderait un état que rien n'écrit.
 *
 * ⚠ LES RASÉES SE FILTRENT PAR LA MÊME CLÉ QUE `siteDeLaCase`, passée par
 * l'appelant : ce module est pur et ne connaît pas `etat`.
 *
 * ⚠ ELLE PREND LES BASES DU JOUEUR AU PLURIEL, ET LE BRIEF DISAIT « LA BASE ».
 * Le singulier est le cas courant — et il l'était pour de bon jusqu'au lot
 * BASES-1, qui a ouvert `etat.bases`. Une liste couvre les deux, un singulier
 * aurait caché toutes les bases sauf la courante sur la seule vue qui montre la
 * carte entière. Écart déclaré.
 *
 * @param {object} options
 * @param {number} options.graine
 * @param {Array<{type: string, bande: number}>} [options.poisAcquis]
 * @param {Array<{rangee: number, colonne: number}>} [options.positions] les bases du joueur
 * @param {Set<string>|null} [options.rasees] clés « rangée:colonne »
 */
export function marqueursDeLaMiniCarte({
  graine, poisAcquis = [], positions = [], rasees = null,
}) {
  const marqueurs = [];
  for (const base of basesDeLaFenetre(graine, CARTE_ENTIERE)) {
    if (rasees !== null && rasees.has(`${base.rangee}:${base.colonne}`)) continue;
    marqueurs.push({
      genre: 'ouvrage',
      rangee: base.rangee,
      colonne: base.colonne,
      teinte: TEINTES.ouvrage,
      acquis: null,
      ...rectangleDuMarqueur(base.rangee, base.colonne, DEBORD.ouvrage),
    });
  }
  // ⚠ L'ORDRE DES GISEMENTS EST CELUI DE `tirerLesPoi`, à la ligne près. Il fait
  // partie du résultat du tirage — le panneau des POI le garde aussi — et le
  // retrier ici donnerait deux listes qui disent la même chose dans deux ordres.
  for (const poi of carteDesPoi(graine).liste) {
    const acquis = poiEstAcquis(poisAcquis, poi);
    marqueurs.push({
      genre: 'poi',
      type: poi.type,
      bande: poi.bande,
      rangee: poi.rangee,
      colonne: poi.colonne,
      teinte: acquis ? TEINTES.poiAcquis : TEINTES.poi,
      acquis,
      ...rectangleDuMarqueur(poi.rangee, poi.colonne, DEBORD.poi),
    });
  }
  for (const position of positions) {
    marqueurs.push({
      genre: 'base',
      rangee: position.rangee,
      colonne: position.colonne,
      bande: bandeDeLaRangee(position.rangee),
      teinte: TEINTES.base,
      acquis: null,
      ...rectangleDuMarqueur(position.rangee, position.colonne, DEBORD.base),
    });
  }
  return marqueurs;
}
