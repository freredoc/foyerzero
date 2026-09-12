// L'écran Recherche — l'arbre du joueur, ses deux branches et l'onglet Spécial.
//
// ⚠⚠ IL NE DÉCIDE RIEN. Ce qui s'achète, ce qui refuse et ce qui se débite se
// décide dans `sim/recherche.js` ; cet écran DEMANDE (`problemesDeLAchat`) puis
// AGIT (`acheter`). Une seconde lecture des règles ici finirait par dire autre
// chose que la première — c'est la faute que le dépôt évite déjà pour la pose,
// pour le voisinage et pour les missions.
//
// ⚠ L'ORDRE D'AFFICHAGE EST CELUI DE `ARBRE_RECHERCHE`, ET IL NE SE TRIE PAS.
// Arbitrage d'Ethan du 30/08 (§7 du brief) : « l'ordre d'affichage est libre,
// il n'y a pas de prérequis entre pièces ». Les tables sont écrites dans
// l'ordre des prix croissants ; retrier ici — par nom, par châssis, par ce
// qu'on peut payer — donnerait un arbre qui se réorganise sous le doigt du
// joueur à chaque achat.
//
// ⚠ L'ACHAT SE FAIT EN DEUX TOUCHERS, comme la pose depuis le 28/08. Un seul
// toucher dépenserait deux milliards et demi de points sans retour possible ;
// le premier ARME le bouton (« Confirmer ? »), le second paie. Toucher
// n'importe quel autre bouton désarme. C'est l'arbitrage du §5.5, et c'est le
// vocabulaire de geste que le Chantier et l'Offense emploient déjà.
//
// ⚠ UN REFUS S'ÉCRIT DANS LA LIGNE, PAS DANS UN TOAST. Un bouton refusé est
// `disabled` — il n'émet aucun clic, donc aucun toast ne pourrait dire
// pourquoi. La raison est donc posée sous la ligne, en permanence, comme
// `raisonDuVerrou` le fait déjà sur la palette de l'Offense.

import { UNITES, DEFENSES } from '../data/combat.js';
import { MODULES } from '../data/modules.js';
import {
  ARBRE_RECHERCHE, BRANCHES, SPECIAL, NOEUD_BASE_SUPPLEMENTAIRE,
} from '../data/recherche.js';
import {
  nomDuModule, coutMilli, estAcquise, moduleEstAcquis,
  problemesDeLAchat, acheter, formaterPoints,
  // ⚠⚠ LE NŒUD RÉPÉTABLE PASSE PAR SES PROPRES FONCTIONS, ET C'EST TOUT LE
  // POINT — lot BASES-2, 11/09. Il n'est PAS dans `ARBRE_RECHERCHE` : lui faire
  // avaler `acheter` demanderait de changer la signature d'une fonction que
  // trente et une lignes emploient, et `problemesDeLAchat` le refuserait de
  // toute façon par le code `inconnue`. Le prix, le rang et le refus se lisent
  // donc là où `sim/recherche.js` les écrit, et nulle part ailleurs.
  rangDeLaBaseSuivante, coutDeLaBaseSuivanteMilli,
  problemesDeLAchatDUneBase, acheterUneBaseDePlus,
} from '../sim/recherche.js';
// ⚠ IMPORTÉS, PAS RECOPIÉS. `poserCouches` porte l'inversion d'ordre entre le
// canevas et `background-image` ; `nomDeLaPieceDeDefense` lit le nom joueur
// dans la BONNE des deux tables. Les réécrire ici ferait deux façons de
// composer un sprite et deux façons de nommer une pièce.
//
// ⚠ ET SON NOM DIT « DE DÉFENSE » ALORS QU'ON S'EN SERT DES DEUX CÔTÉS. Elle
// fait `DEFENSES[id] ?? UNITES[id]` : c'est exactement la recherche dont
// l'arbre a besoin dans ses deux branches, et aucun identifiant n'existe dans
// les deux tables à la fois (croisé par `test/recherche.test.js`). La renommer
// toucherait ses appelants du Chantier sans rien apprendre à personne.
import {
  couchesDeLEntite, classeDe, accentDe, genreDeLaGarnison,
  NOMS_CLASSE, NOMS_ACCENT,
} from '../render/scene.js';
import { poserCouches, nomDeLaPieceDeDefense as nomDeLaPiece } from './chantier.js';
// ⚠ LE PICTOGRAMME D'UN MODULE SE DÉRIVE DE SA CLÉ, il ne s'écrit pas —
// voir `./pictogramme.js`. Les planches s'annoncent « modules 1-8 » et
// « 9-14 » sans que cette numérotation soit celle de `MODULES` : une table
// recopiée ici serait la première à décaler six noms sur quatorze.
import { PICTOGRAMMES, creerPictogramme, pictogrammeDuModule } from './pictogramme.js';

/** Les trois panneaux, dans l'ordre où le défilement horizontal les présente. */
export const PANNEAUX = [...BRANCHES, 'special'];

/** Ce que l'indicateur de position écrit au-dessus de chaque panneau. */
export const TITRE_DU_PANNEAU = {
  offense: 'Offense',
  defense: 'Défense',
  special: 'Spécial',
};

/**
 * Le sprite d'une pièce, en couches prêtes pour `poserCouches`.
 *
 * ⚠⚠ ELLE DÉLÈGUE À `couchesDeLEntite`, ET C'ÉTAIT UNE SECONDE VÉRITÉ — lot
 * SPRITES-V2-JOUEUR, 05/09. Elle composait ses noms elle-même : `off_j_<id>`
 * pour toute unité, `def_j_<id>_s` pour un ouvrage à tourelle, et une table de
 * trois exceptions pour le Merlon, la Herse et la Ronce. Trois de ces quatre
 * règles sont devenues fausses le même jour — un blindé du joueur n'a plus de
 * sprite monolithe, une tourelle n'a plus d'orientation dans son nom, un merlon
 * n'a plus d'état de liaison — et rien, dans cet écran, ne pouvait le dire :
 * `celluleDuSprite` a LEVÉ à la première peinture. C'est exactement ce que le
 * dispatch unique de `render/scene.js` existe pour empêcher (CLAUDE.md §4), et
 * l'écran de recherche était le dernier à ne pas y passer.
 *
 * ⚠ LA LETTRE RESTE `_j_`, ET C'EST LE PROPRIÉTAIRE QUI LA DONNE. C'est l'arbre
 * du JOUEUR : `off_o_…` est le vocabulaire de l'Ouvrage, et mélanger les deux
 * dans un même écran est ce que §4 interdit pour les noms.
 *
 * ⚠ ET LE CAMP DIT LA POSE. Une unité est montrée en assaut — `camp: 'attaque'`,
 * donc la pose de marche —, un ouvrage en garnison, donc son socle, sa tourelle
 * et l'angle par défaut de la force. C'est ce que l'écran de l'Offense fait déjà
 * pour ses vignettes, par la même porte.
 *
 * @param {string} id
 * @returns {{famille: string, nom: string, ancre?: object, angle?: number}[]}
 */
export function couchesDeLaPiece(id) {
  if (UNITES[id] !== undefined) {
    return couchesDeLEntite({
      genre: 'unite', id, proprietaire: 'joueur', camp: 'attaque',
    });
  }
  if (DEFENSES[id] === undefined) {
    throw new RangeError(`recherche : « ${id} » n'est ni une unité ni un ouvrage`);
  }
  return couchesDeLEntite({
    genre: 'defense', id, proprietaire: 'joueur', camp: 'defense',
  });
}

/**
 * La brève description d'une pièce : sa classe visuelle, puis ce qu'elle tue.
 *
 * ⚠⚠ ELLE EST DÉRIVÉE, PAS ÉCRITE — ET C'EST LA MOITIÉ DU POINT 17 D'ETHAN.
 * « Rajouter brève description unités » (06/09) demande un texte que le dépôt
 * n'a pas : `data/combat.js` porte des nombres et des noms, aucune phrase.
 * Écrire à la main les trente et une phrases de saveur des deux branches
 * reviendrait à trancher seul du CONTENU de jeu, ce que ce dépôt s'interdit —
 * une phrase dérivée dit une chose vraie et vérifiable, une phrase inventée dit
 * ce que personne n'a arbitré. **Proposition portée au rapport : qu'Ethan les
 * écrive un jour ; la dérivation tient la place en attendant.**
 *
 * ⚠⚠ ET LES DEUX AXES DU BRIEF NE POUVAIENT PAS SERVIR — MESURÉ. Il donnait
 * `chassis` × `specialite` ; les NEUF ouvrages de `DEFENSES` n'ont ni l'un ni
 * l'autre — ni `chassis`, ni `specialite` — donc la moitié de la branche
 * défense n'aurait eu aucune description, et `RECH-É T10` l'exige pour les
 * trente et une. Les axes qui couvrent les deux branches sont ceux de la
 * SCÈNE : `classeDe` rend le châssis d'une unité ET le type d'un ouvrage,
 * `accentDe` rend la colonne de dégâts DOMINANTE de l'un comme de l'autre.
 *
 * ⚠⚠ ET LES DEUX TABLES DE LIBELLÉS EXISTENT DÉJÀ : `NOMS_CLASSE` et
 * `NOMS_ACCENT` de `render/scene.js`, qui légendent le champ de bataille depuis
 * le lot 3B. En écrire deux autres dans `src/data/` — ce que le brief
 * demandait — aurait mis au dépôt deux vocabulaires pour la même grandeur, que
 * §4 refuse ; et le premier renommage aurait fait dire deux choses à la même
 * pièce sur deux écrans. **Écart au brief, déclaré au rapport.**
 *
 * ⚠ L'ACCENT SE MESURE SUR LES DÉGÂTS, IL NE SE DÉCLARE PAS. `accentDe` lit la
 * table `degats` (ou `degatsFranchissement`) et rend la colonne la plus forte :
 * la description dit donc ce que la pièce fait, pas ce qu'une colonne de
 * classeur prétend. Un Merlon, qui ne nuit à personne, rend `null` — et la
 * phrase le dit avec le mot de la table, « ne tue rien », jamais un vide.
 *
 * ⚠ ET ELLE NE DÉPEND PAS DE LA BRANCHE. La même pièce se décrit pareil en
 * offense et en garnison, parce que c'est la même pièce et la même table de
 * dégâts. `structureOuAviation` est UNE colonne : « anti-structure / aérien »
 * est donc juste des deux côtés, et c'est ce que `NOMS_ACCENT` écrit déjà.
 *
 * @param {string} id identifiant d'unité ou d'ouvrage
 * @returns {string} par exemple « Blindé · anti-structure / aérien »
 */
export function descriptionDeLaPiece(id) {
  // ⚠ LA QUESTION SE POSE À LA TABLE, PAS À UNE LISTE DE NOMS.
  // `genreDeLaGarnison` fait `DEFENSES[id] ?? UNITES[id]` et LÈVE sur le reste ;
  // c'est le même dispatch que `couchesDeLaPiece` au-dessus, et il est pris à la
  // source plutôt que réécrit.
  const genre = genreDeLaGarnison(id);
  const accent = accentDe(genre, id);
  const quoi = accent === null ? NOMS_ACCENT.aucun : NOMS_ACCENT[accent.colonne];
  return `${NOMS_CLASSE[classeDe(genre, id)]} · ${quoi}`;
}

/**
 * Ce qu'une ligne d'achat affiche : son prix, son état, et la raison du refus.
 *
 * ⚠ « ACQUIS » N'EST PAS UN REFUS, C'EST UN ÉTAT. `problemesDeLAchat` rend bien
 * `dejaAcquise`, mais l'afficher comme une raison de blocage se lirait comme un
 * reproche ; la ligne dit « Acquis » et se tait.
 *
 * ⚠⚠ ET « IL MANQUE X POINTS » NE S'ÉCRIT PLUS NON PLUS — ETHAN, POINT 14 DU
 * 06/09. Le manque était rappelé sous chaque ligne que le joueur ne peut pas
 * payer, c'est-à-dire sous presque tout l'arbre : trente et une phrases qui
 * répètent au mot près ce que le compteur du haut dit déjà. C'est la COULEUR du
 * bouton qui le dit maintenant (point 16), et le compteur, grossi (point 13).
 *
 * ⚠⚠ LE FILTRE EST ICI, ET `sim/recherche.js` N'A PAS BOUGÉ D'UNE LIGNE. Ce
 * message est la source unique de vérité du refus et il sert ailleurs — le
 * panneau de la base supplémentaire le porte aussi. Le réécrire ou le supprimer
 * casserait un chemin qu'Ethan n'a pas visé. C'est l'ÉCRAN qui choisit de se
 * taire, pas le moteur qui cesse de dire.
 *
 * ⚠ ET LE FILTRE PORTE SUR LE `code`, JAMAIS SUR LE TEXTE. Une comparaison sur
 * le début de la phrase se casserait à la première reformulation du moteur, et
 * personne ne saurait pourquoi la raison est revenue. `RECH-É T4` refuse donc
 * que ce fichier CITE le message entre guillemets — d'où cette phrase-ci, qui
 * le décrit sans l'écrire.
 *
 * ⚠ LES AUTRES REFUS SURVIVENT TOUS. `effetNonCable`, `uniteNonAcquise`,
 * `sansModule` : ce sont des faits que le joueur ne peut pas deviner de la
 * couleur d'un bouton, et rien ne les répète ailleurs à l'écran.
 *
 * @param {object} etat
 * @param {string} branche
 * @param {string} id
 * @param {'unite'|'module'} quoi
 * @returns {{prix: string, acquis: boolean, achetable: boolean, raison: string}}
 */
/**
 * Ce qui reste à ÉCRIRE d'une liste de refus — les deux codes que l'écran tait.
 *
 * ⚠⚠ LE FILTRE EST ÉCRIT UNE FOIS, ET IL SERT DEUX LIGNES DEPUIS LE LOT BASES-2.
 * Une pièce de l'arbre et le nœud répétable de l'onglet Spécial taisent les
 * mêmes deux choses, et pour les mêmes raisons : « Acquis » est un ÉTAT que la
 * ligne dit déjà autrement, et le manque de points est dit par la COULEUR du
 * bouton et par le compteur du haut. Deux filtres voisins auraient divergé au
 * premier code ajouté.
 *
 * ⚠ ET IL PORTE SUR LE `code`, JAMAIS SUR LE TEXTE. Une comparaison sur la
 * phrase se casserait à la première reformulation du moteur, et personne ne
 * saurait pourquoi la raison est revenue — `RECH-É T4` garde les deux moitiés.
 *
 * @param {Array<{code: string, message: string}>} problemes
 * @returns {Array<{code: string, message: string}>}
 */
export function raisonsAffichables(problemes) {
  return problemes.filter(
    (p) => p.code !== 'dejaAcquise' && p.code !== 'pointsInsuffisants',
  );
}

export function lignePourLAchat(etat, branche, id, quoi) {
  const acquis = quoi === 'unite'
    ? estAcquise(etat, branche, id)
    : moduleEstAcquis(etat, branche, id);
  const problemes = problemesDeLAchat(etat, branche, id, quoi);
  const restants = raisonsAffichables(problemes);
  return {
    prix: formaterPoints(coutMilli(branche, id, quoi)),
    acquis,
    achetable: problemes.length === 0,
    raison: acquis ? '' : restants.map((p) => p.message).join(' ; '),
  };
}

/**
 * Les lignes d'une branche, dans l'ordre de la table.
 *
 * ⚠ UNE PIÈCE SANS MODULE RENDRAIT `module: null`, ET AUCUNE N'EST DANS CE CAS
 * AUJOURD'HUI. Le jour où l'une n'en aura plus, la ligne se dessinera sans sa
 * seconde CASE plutôt que d'afficher un module vide à zéro point — ce qui se
 * lirait « gratuit ». C'est `cadresDeLaLigne` qui le décide, et `RECH-É T8` le
 * mesure sur une ligne forgée, faute d'une pièce réelle dans ce cas.
 *
 * @param {object} etat
 * @param {string} branche
 * @returns {object[]}
 */
/**
 * La ligne d'un module — et ce qu'elle TAIT tant que sa pièce n'est pas acquise.
 *
 * ⚠⚠ ETHAN, 11/09, POINT 2 : « masquer prix et description des modules non
 * achetés ». La vue les rendait toujours, si bien que l'arbre livrait
 * trente-et-une descriptions d'effets et trente-et-un prix pour des cases qu'on
 * ne peut pas toucher — le joueur lisait le catalogue complet du jeu avant
 * d'avoir acheté sa première pièce.
 *
 * ⚠ LES DEUX CADRES RESTENT, ET C'EST LA MOITIÉ QUI COMPTE. Le point 15 du
 * 06/09 a séparé la pièce de son module en deux cases ; retirer la seconde
 * quand elle est verrouillée referait le retrait qu'il a défait, et la ligne
 * changerait de forme sous le doigt au moment de l'achat.
 *
 * ⚠⚠ ET LE MASQUAGE EST DANS LA VUE, PAS DANS LE DOM. Rendre `prix` et
 * `description` puis compter sur l'écran pour ne pas les peindre laisserait la
 * donnée à portée du prochain peintre — c'est la règle que ce fichier applique
 * déjà à `raison`, qui vaut `''` quand il n'y a rien à dire.
 *
 * ⚠ AUCUNE SECONDE PHRASE DE REFUS N'EST ÉCRITE. `lignePourLAchat` rend déjà
 * `raison` — « la pièce doit être débloquée avant son module », du MOTEUR —, et
 * le cadre la peint. En ajouter une ici en ferait deux pour un seul fait.
 *
 * @param {object} etat
 * @param {string} branche
 * @param {string} id
 * @param {string} nomModule
 * @returns {object}
 */
export function ligneDuModule(etat, branche, id, nomModule) {
  const achat = lignePourLAchat(etat, branche, id, 'module');
  const verrouille = !estAcquise(etat, branche, id);
  return {
    nom: nomModule,
    libelle: MODULES[nomModule].libelle,
    description: verrouille ? '' : MODULES[nomModule].description,
    ...achat,
    verrouille,
    prix: verrouille ? '' : achat.prix,
  };
}

export function lignesDeRecherche(etat, branche) {
  const table = ARBRE_RECHERCHE[branche];
  if (table === undefined) throw new RangeError(`recherche : branche inconnue « ${branche} »`);
  return Object.keys(table).map((id) => {
    const nomModule = nomDuModule(branche, id);
    return {
      id,
      nom: nomDeLaPiece(id),
      description: descriptionDeLaPiece(id),
      couches: couchesDeLaPiece(id),
      unite: lignePourLAchat(etat, branche, id, 'unite'),
      module: nomModule === null ? null : ligneDuModule(etat, branche, id, nomModule),
    };
  });
}

/**
 * Les CADRES d'une ligne : la pièce, puis son module s'il en a un.
 *
 * ⚠⚠ DEUX CASES, PAS UN RETRAIT — ETHAN, POINT 15 DU 06/09 : « diviser en 2
 * cases l'unité et son amélioration ». Le module vivait DANS le bloc de sa
 * pièce, décalé de douze pixels sous un filet ; il a désormais son propre
 * cadre, à côté.
 *
 * ⚠⚠ ET LE MOTIF DU RETRAIT NE DISPARAÎT PAS AVEC LUI. Le commentaire qu'il
 * portait disait vrai — « aligné sur elle, il se lirait comme une quinzième
 * pièce » —, et le risque est le même avec deux cadres de même forme. Ce qui
 * porte l'appartenance maintenant, ce sont TROIS choses, et aucune n'est la
 * mise en page seule : la pastille `◈` à la place du sprite, le titre du module
 * en kaki plus petit là où celui d'une pièce est blanc, et l'écart vertical —
 * la feuille serre un module contre SA pièce et desserre entre deux pièces.
 *
 * ⚠ ELLE EST PURE ET RENDUE À PART POUR QUE `RECH-É T8` PUISSE MORDRE. Aucune
 * des trente et une entrées de l'arbre n'a `module: null` aujourd'hui : le cas
 * ne se monte que sur une ligne FORGÉE, donc il faut une fonction à qui la
 * donner. Et le DOM la lit — un test compte les cadres peints et les compare à
 * ce qu'elle rend, sans quoi elle ne serait qu'un proxy.
 *
 * @param {object} ligne une entrée de `lignesDeRecherche`
 * @returns {Array<{quoi: 'unite'|'module', achat: object}>}
 */
export function cadresDeLaLigne(ligne) {
  const cadres = [{ quoi: 'unite', achat: ligne.unite }];
  if (ligne.module !== null) cadres.push({ quoi: 'module', achat: ligne.module });
  return cadres;
}

/**
 * Les trois états d'un cadre, et la classe que la feuille peint pour chacun.
 *
 * ⚠⚠ TROIS CODES, ET PAS UN DE PLUS — ETHAN, POINT 16 DU 06/09 : « une case
 * normale quand la recherche est acquise, une case assombrie quand non acquise,
 * une case assombrie mais le bouton d'acquisition couleur vive et contraste
 * quand l'acquisition est possible ». La CASE a donc deux aspects, le BOUTON en
 * a trois, et l'état qui les commande est un seul.
 *
 * ⚠ `acquis` ET `achetable` SONT DEUX BOOLÉENS INDÉPENDANTS, et ils l'étaient
 * déjà : `lignePourLAchat` les rend tous les deux depuis le lot RECHERCHE. Ce
 * lot ne calcule rien de neuf — il nomme l'état, le porte sur CHACUN des deux
 * cadres, et l'écrit dans la feuille.
 *
 * ⚠ UNE SEULE CLASSE PAR CADRE, ET C'EST CE QUI COMMANDE AUSSI LE BOUTON. La
 * feuille descend de la case au bouton (`.piece.achetable .acheter`) plutôt que
 * de poser une seconde classe sur le bouton : deux porteurs pour la même
 * grandeur finiraient par se contredire, et `disabled` l'encode déjà.
 */
export const CLASSE_DE_L_ETAT = {
  acquis: 'acquise',
  achetable: 'achetable',
  bloque: 'bloquee',
};

/**
 * L'état d'un cadre, des trois que la feuille sait peindre.
 *
 * @param {{acquis: boolean, achetable: boolean}} achat
 * @returns {'acquis'|'achetable'|'bloque'}
 */
export function etatDuCadre(achat) {
  if (achat.acquis) return 'acquis';
  return achat.achetable ? 'achetable' : 'bloque';
}

/** Ce que porte une ligne de l'onglet Spécial qui n'a pas encore de moteur. */
export const SANS_MOTEUR = 'pas encore de moteur en jeu';

/**
 * Les quatre lignes de l'onglet Spécial.
 *
 * ⚠⚠ UNE SEULE DES QUATRE S'ACHÈTE, ET C'EST UN RENVERSEMENT — lot BASES-2,
 * 11/09. Ce commentaire disait « aucune ne s'achète […] la deuxième base
 * n'existe pas » : c'était vrai le 06/09 et faux depuis BASES-1, qui a écrit et
 * testé `acheterUneBaseDePlus` sans qu'aucun écran ne l'appelle. Le nœud
 * répétable porte donc désormais son rang, son prix et son bouton ; les TROIS
 * soutiens n'ont toujours ni moteur, ni prix retenu, ni bouton, et leur donner
 * l'un des trois prendrait les points du joueur contre rien.
 *
 * ⚠⚠ LE RANG SE DEMANDE, IL NE SE RECOMPTE PAS SUR `etat.bases.length`.
 * `sim/recherche.js` le dit de face : il se compte sur ce qui est ACHETÉ, pas
 * sur ce qui est FONDÉ — le joueur peut payer son droit et attendre pour
 * choisir sa case, et un second comptage lui referait payer le rang 2.
 *
 * ⚠⚠ ET LE PRIX VIENT DE `coutDeLaBaseSuivanteMilli`, JAMAIS DE `SPECIAL.cout`.
 * Ce champ est le prix du PREMIER rachat ; le formater à la main afficherait
 * 2,00 M pour toujours, alors que le nœud est répétable et que chaque rang
 * coûte cinq demis du précédent. C'est la faute que §4 de `CLAUDE.md` interdit,
 * vue par le bout de l'affichage : deux lectures de la même grandeur, dont une
 * seule suit la règle.
 *
 * ⚠ LA RAISON PASSE PAR LE MÊME FILTRE QUE L'ARBRE, donc il ne reste RIEN à
 * écrire sous le prix : `problemesDeLAchatDUneBase` ne rend que
 * `pointsInsuffisants`, et c'est le bouton ÉTEINT qui le dit — point 14 d'Ethan
 * du 06/09, appliqué ici comme sur les trente et une autres lignes.
 *
 * @param {object} etat
 * @returns {{id: string, libelle: string, prix: string,
 *   achetable: boolean, raison: string}[]}
 */
export function lignesSpeciales(etat) {
  return Object.keys(SPECIAL).map((id) => {
    if (id !== NOEUD_BASE_SUPPLEMENTAIRE) {
      return {
        id,
        libelle: SPECIAL[id].libelle,
        // ⚠ LES TROIS SOUTIENS N'ONT PAS DE PRIX RETENU : un tiret, jamais un
        // zéro qui se lirait « gratuit ». La branche qui formate un `cout` non
        // nul reste écrite — elle dira le prix d'un cinquième nœud le jour où
        // Ethan en arbitrera un, sans lui donner de bouton pour autant.
        prix: SPECIAL[id].cout === null ? '—' : formaterPoints(BigInt(SPECIAL[id].cout) * 1000n),
        achetable: false,
        raison: SANS_MOTEUR,
      };
    }
    const problemes = problemesDeLAchatDUneBase(etat);
    return {
      id,
      libelle: `${SPECIAL[id].libelle} (rang ${rangDeLaBaseSuivante(etat)})`,
      prix: formaterPoints(coutDeLaBaseSuivanteMilli(etat)),
      achetable: problemes.length === 0,
      raison: raisonsAffichables(problemes).map((p) => p.message).join(' ; '),
    };
  });
}

// ---------------------------------------------------------------------------
// Le DOM
// ---------------------------------------------------------------------------

/** Ce que dit un bouton armé, en attente de son second toucher. */
export const LIBELLE_CONFIRMER = 'Confirmer ?';

/**
 * Câble l'écran Recherche dans une page qui porte le balisage attendu.
 *
 * @param {Document} doc
 * @param {{apresAchat: () => void}} rappels
 * @returns {{peindre: (etat: object) => void}}
 */
export function initialiserEcranRecherche(doc, { apresAchat } = {}) {
  const $ = (id) => doc.getElementById(id);
  const compteur = $('recherche-points');
  const rail = $('recherche-panneaux');
  const pastilles = $('recherche-pastilles');
  const corps = {};
  for (const nom of PANNEAUX) corps[nom] = $(`recherche-${nom}`);

  let etatCourant = null;
  // Ce qui attend son second toucher — `{cle, bouton, libelle}` ou `null`.
  let arme = null;

  function desarmer() {
    if (arme === null) return;
    arme.bouton.textContent = arme.libelle;
    arme.bouton.classList.remove('arme');
    arme = null;
  }

  // ⚠ L'INDICATEUR EST CLIQUABLE ET IL SUIT LE DOIGT, LES DEUX. Un indicateur
  // qui ne ferait que suivre serait un ornement ; un indicateur qui ne ferait
  // que commander mentirait dès que le joueur fait glisser le rail.
  function marquerPastille(index) {
    for (const [i, bouton] of [...pastilles.children].entries()) {
      bouton.classList.toggle('actif', i === index);
    }
  }

  for (const [i, nom] of PANNEAUX.entries()) {
    const bouton = doc.createElement('button');
    bouton.type = 'button';
    bouton.textContent = TITRE_DU_PANNEAU[nom];
    bouton.addEventListener('click', () => {
      desarmer();
      // `scrollTo` plutôt qu'un `hidden` par panneau : le rail garde son
      // défilement au doigt, et les trois panneaux restent une seule bande.
      rail.scrollTo({ left: i * rail.clientWidth, behavior: 'smooth' });
      marquerPastille(i);
    });
    pastilles.appendChild(bouton);
  }
  rail.addEventListener('scroll', () => {
    if (rail.clientWidth === 0) return;
    marquerPastille(Math.round(rail.scrollLeft / rail.clientWidth));
  });
  marquerPastille(0);

  /**
   * UN bouton, DEUX touchers — le mécanisme, et lui seul.
   *
   * ⚠⚠ IL EST EXTRAIT PARCE QUE DEUX BOUTONS L'EMPLOIENT DEPUIS LE LOT BASES-2,
   * ET IL NE SE DÉDOUBLE PAS. Écrire « un second bouton comme celui-là » à côté
   * donnerait deux grammaires du même geste, et la première divergence serait
   * la plus discrète : toucher l'un ne désarmerait pas l'autre, donc DEUX
   * boutons resteraient armés et le joueur paierait celui qu'il ne regarde pas.
   *
   * ⚠ CE QUI CHANGE SE PASSE EN ARGUMENT, ET C'EST TOUT : la clé d'armement, le
   * libellé au repos, le droit d'acheter, la relecture des refus, et le geste.
   * `arme` reste UNE variable de la fermeture, `desarmer` reste appelé par les
   * pastilles du rail, et les deux boutons partagent donc l'un et l'autre.
   *
   * ⚠ ON REDEMANDE AVANT D'AGIR. Les points ont pu monter — ou être dépensés
   * sur un autre panneau — entre les deux touchers ; les deux fonctions d'achat
   * LÈVENT sur un refus, et une exception non attrapée figerait l'écran.
   */
  function boutonADeuxTouchers({ cle, libelle, achetable, acquis = false, verifier, agir }) {
    const bouton = doc.createElement('button');
    bouton.type = 'button';
    bouton.className = 'acheter';
    bouton.textContent = libelle;
    bouton.classList.toggle('acquis', acquis);
    bouton.disabled = !achetable;
    if (achetable) {
      bouton.addEventListener('click', () => {
        if (arme !== null && arme.cle === cle) {
          desarmer();
          if (verifier().length > 0) {
            peindre(etatCourant);
            return;
          }
          agir();
          if (apresAchat !== undefined) apresAchat();
          peindre(etatCourant);
          return;
        }
        desarmer();
        arme = { cle, bouton, libelle };
        bouton.textContent = LIBELLE_CONFIRMER;
        bouton.classList.add('arme');
      });
    }
    return bouton;
  }

  /** Le bouton d'une ligne de l'arbre — un appelant mince du mécanisme. */
  function boutonDAchat(branche, id, quoi, vue) {
    return boutonADeuxTouchers({
      cle: `${branche}/${id}/${quoi}`,
      // ⚠ TROIS ÉTATS DEPUIS LE POINT 2 DU 11/09, PLUS DEUX. Un module dont la
      // pièce n'est pas acquise n'a pas de prix à montrer, et un bouton vide se
      // lirait comme un bouton cassé : il porte le mot du verrou.
      libelle: vue.acquis ? 'Acquis' : (vue.verrouille === true ? 'Verrouillé' : vue.prix),
      acquis: vue.acquis,
      achetable: vue.achetable,
      verifier: () => problemesDeLAchat(etatCourant, branche, id, quoi),
      agir: () => acheter(etatCourant, branche, id, quoi),
    });
  }

  /**
   * Le bouton du nœud répétable — l'autre appelant, et le seul de l'onglet.
   *
   * ⚠ SA CLÉ SE DÉRIVE DE L'IDENTIFIANT, elle ne se retape pas : `special/` plus
   * le nom du nœud. Deux boutons ne peuvent pas porter la même clé, sans quoi
   * armer l'un armerait l'autre.
   */
  function boutonDeLaBase(ligne) {
    return boutonADeuxTouchers({
      cle: `special/${ligne.id}`,
      libelle: ligne.prix,
      achetable: ligne.achetable,
      verifier: () => problemesDeLAchatDUneBase(etatCourant),
      agir: () => acheterUneBaseDePlus(etatCourant),
    });
  }

  /**
   * Un cadre : sa tête, sa description, et la raison de son refus s'il y en a.
   *
   * ⚠⚠ LES DEUX CADRES PARTAGENT CETTE FONCTION, ET C'EST TOUT L'INTÉRêT DU
   * POINT 15. Une pièce et son module ont désormais la même forme — un cadre, une
   * rangée, une description, un refus éventuel —, donc deux fonctions voisines
   * auraient divergé au premier ajustement. Ce qui les sépare tient dans DEUX
   * arguments : ce qui ouvre la rangée (un sprite ou la pastille) et la classe
   * `module`.
   */
  function cadreDOM(branche, id, quoi, achat, titre, ouverture, description) {
    const bloc = doc.createElement('div');
    bloc.className = quoi === 'module' ? 'piece module' : 'piece';
    bloc.classList.add(CLASSE_DE_L_ETAT[etatDuCadre(achat)]);

    const rangee = doc.createElement('div');
    rangee.className = 'rangee';
    const nom = doc.createElement('b');
    nom.textContent = titre;
    rangee.append(ouverture, nom, boutonDAchat(branche, id, quoi, achat));
    bloc.appendChild(rangee);

    // ⚠ PAS DE `div.description` VIDE NON PLUS — même règle que le `div.raison`
    // ci-dessous, et pour la même raison. Depuis le point 2 du 11/09, un module
    // verrouillé rend une description VIDE : peindre le cadre quand même
    // laisserait un blanc de neuf pixels que le joueur lirait comme un défaut.
    if (description !== '') {
      const quoiDit = doc.createElement('div');
      quoiDit.className = 'description';
      quoiDit.textContent = description;
      bloc.appendChild(quoiDit);
    }

    // ⚠ PAS DE `div.raison` VIDE. Depuis que le manque de points est écarté
    // (point 14), une ligne refusée peut n'avoir plus rien à dire : peindre le
    // cadre quand même laisserait un blanc que le joueur lirait comme un défaut.
    if (achat.raison !== '') {
      const raison = doc.createElement('div');
      raison.className = 'raison';
      raison.textContent = achat.raison;
      bloc.appendChild(raison);
    }
    return bloc;
  }

  /** Les cadres d'une ligne, dans l'ordre où le panneau les empile. */
  function cadresDOM(branche, ligne) {
    return cadresDeLaLigne(ligne).map(({ quoi, achat }) => {
      if (quoi === 'unite') {
        const vignette = doc.createElement('span');
        vignette.className = 'sprite';
        poserCouches(vignette, ligne.couches);
        return cadreDOM(branche, ligne.id, 'unite', achat,
          ligne.nom, vignette, ligne.description);
      }
      // ⚠ LA PASTILLE TIENT LA LARGEUR DU SPRITE, et c'est elle qui dit
      // « module » maintenant que le retrait a disparu.
      // ⚠⚠ LA PASTILLE `◈` DEVIENT LE DESSIN DU MODULE — lot CÂBLAGE, 07/09.
      // Elle tenait la largeur du sprite d'une pièce et disait « module » par un
      // losange identique pour les quatorze ; chacun a maintenant son
      // pictogramme, tiré de sa clé. La classe RESTE `pastille` : c'est elle qui
      // tient la largeur, et la feuille n'a pas à connaître ce changement.
      const pastille = doc.createElement('span');
      pastille.className = 'pastille';
      pastille.append(creerPictogramme(doc, pictogrammeDuModule(achat.nom), achat.libelle));
      return cadreDOM(branche, ligne.id, 'module', achat,
        achat.libelle, pastille, achat.description);
    });
  }

  function peindre(etat) {
    etatCourant = etat;
    // ⚠ TOUT REPEINDRE DÉSARME. Les nœuds armés sont détruits juste après ;
    // garder la référence donnerait un bouton armé qui n'est plus dans la page.
    arme = null;
    // ⚠ LE COMPTEUR PORTE LE PICTOGRAMME DE LA RECHERCHE, et c'est le seul
    // endroit de la page où celui-ci a un sens : il ne dit pas un objet mais une
    // MONNAIE, celle que cet écran dépense.
    compteur.textContent = '';
    compteur.append(
      creerPictogramme(doc, PICTOGRAMMES.recherche),
      doc.createTextNode(`${formaterPoints(BigInt(etat.recherche.pointsMilli))} points`),
    );
    for (const branche of BRANCHES) {
      const panneau = corps[branche];
      panneau.textContent = '';
      for (const ligne of lignesDeRecherche(etat, branche)) {
        for (const cadre of cadresDOM(branche, ligne)) panneau.appendChild(cadre);
      }
    }
    const special = corps.special;
    special.textContent = '';
    for (const ligne of lignesSpeciales(etat)) {
      const bloc = doc.createElement('div');
      bloc.className = 'piece';
      // ⚠⚠ LE MÊME VOCABULAIRE D'ÉTAT QUE LES DEUX AUTRES PANNEAUX, ET PAS UNE
      // RÈGLE CSS DE PLUS — lot BASES-2. `#recherche-special` n'a aucun style
      // propre ; en lui écrivant une classe à lui, il aurait fallu peindre une
      // seconde fois les trois codes visuels du point 16, qui auraient divergé
      // au premier réglage de teinte.
      //
      // ⚠ ET « ACQUIS » N'EXISTE PAS ICI : le nœud est RÉPÉTABLE, donc il n'est
      // jamais acquis — il est achetable ou il ne l'est pas. Les trois soutiens
      // tombent sur `bloque`, ce qu'ils sont de fait.
      bloc.classList.add(CLASSE_DE_L_ETAT[etatDuCadre({
        acquis: false, achetable: ligne.achetable,
      })]);
      const rangee = doc.createElement('div');
      rangee.className = 'rangee';
      const pastille = doc.createElement('span');
      pastille.className = 'pastille';
      pastille.textContent = '★';
      const nom = doc.createElement('b');
      nom.textContent = ligne.libelle;
      // ⚠⚠ LE BOUTON PORTE LE PRIX, ET IL REMPLACE LE `span.prix` — jamais les
      // deux. C'est ce que les trente et une lignes de l'arbre font déjà : un
      // prix écrit deux fois dans la même rangée serait le premier à diverger,
      // et le joueur lirait le rang 2 à côté du prix du rang 3.
      //
      // ⚠ UNE LIGNE SANS MOTEUR GARDE SON PRIX EN TEXTE, sans bouton : elle
      // ANNONCE, elle ne propose pas.
      rangee.append(pastille, nom);
      if (ligne.id === NOEUD_BASE_SUPPLEMENTAIRE) {
        rangee.appendChild(boutonDeLaBase(ligne));
      } else {
        const prix = doc.createElement('span');
        prix.className = 'prix';
        prix.textContent = ligne.prix;
        rangee.appendChild(prix);
      }
      bloc.appendChild(rangee);
      // ⚠ PAS DE `div.raison` VIDE, comme dans `cadreDOM` : depuis que le manque
      // de points est écarté, la ligne du nœud n'a plus rien à dire, et peindre
      // le cadre quand même laisserait un blanc lu comme un défaut.
      if (ligne.raison !== '') {
        const raison = doc.createElement('div');
        raison.className = 'raison';
        raison.textContent = ligne.raison;
        bloc.appendChild(raison);
      }
      special.appendChild(bloc);
    }
  }

  return { peindre };
}
