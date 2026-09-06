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
import { ARBRE_RECHERCHE, BRANCHES, SPECIAL } from '../data/recherche.js';
import {
  nomDuModule, coutMilli, estAcquise, moduleEstAcquis,
  problemesDeLAchat, acheter, formaterPoints,
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
export function lignePourLAchat(etat, branche, id, quoi) {
  const acquis = quoi === 'unite'
    ? estAcquise(etat, branche, id)
    : moduleEstAcquis(etat, branche, id);
  const problemes = problemesDeLAchat(etat, branche, id, quoi);
  const restants = problemes.filter(
    (p) => p.code !== 'dejaAcquise' && p.code !== 'pointsInsuffisants',
  );
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
      module: nomModule === null ? null : {
        nom: nomModule,
        libelle: MODULES[nomModule].libelle,
        description: MODULES[nomModule].description,
        ...lignePourLAchat(etat, branche, id, 'module'),
      },
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

/**
 * Les quatre lignes de l'onglet Spécial.
 *
 * ⚠ AUCUNE NE S'ACHÈTE, ET C'EST DIT DANS LA LIGNE. Elles n'ont pas de moteur —
 * la deuxième base n'existe pas, les trois soutiens n'ont même pas de prix
 * retenu. Leur donner un bouton prendrait les points du joueur contre rien.
 *
 * @returns {{id: string, libelle: string, prix: string, raison: string}[]}
 */
export function lignesSpeciales() {
  return Object.keys(SPECIAL).map((id) => ({
    id,
    libelle: SPECIAL[id].libelle,
    prix: SPECIAL[id].cout === null ? '—' : formaterPoints(BigInt(SPECIAL[id].cout) * 1000n),
    raison: 'pas encore de moteur en jeu',
  }));
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

  /** Le bouton d'une ligne : son libellé, son état, et les deux touchers. */
  function boutonDAchat(branche, id, quoi, vue) {
    const bouton = doc.createElement('button');
    bouton.type = 'button';
    bouton.className = 'acheter';
    const libelle = vue.acquis ? 'Acquis' : vue.prix;
    bouton.textContent = libelle;
    bouton.classList.toggle('acquis', vue.acquis);
    bouton.disabled = !vue.achetable;
    if (vue.achetable) {
      bouton.addEventListener('click', () => {
        const cle = `${branche}/${id}/${quoi}`;
        if (arme !== null && arme.cle === cle) {
          desarmer();
          // ⚠ ON REDEMANDE AVANT D'AGIR. Les points ont pu monter — ou être
          // dépensés sur l'autre panneau — entre les deux touchers ; `acheter`
          // lève sur un refus, et une exception non attrapée figerait l'écran.
          if (problemesDeLAchat(etatCourant, branche, id, quoi).length > 0) {
            peindre(etatCourant);
            return;
          }
          acheter(etatCourant, branche, id, quoi);
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

    const quoiDit = doc.createElement('div');
    quoiDit.className = 'description';
    quoiDit.textContent = description;
    bloc.appendChild(quoiDit);

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
      const pastille = doc.createElement('span');
      pastille.className = 'pastille';
      pastille.textContent = '◈';
      return cadreDOM(branche, ligne.id, 'module', achat,
        achat.libelle, pastille, achat.description);
    });
  }

  function peindre(etat) {
    etatCourant = etat;
    // ⚠ TOUT REPEINDRE DÉSARME. Les nœuds armés sont détruits juste après ;
    // garder la référence donnerait un bouton armé qui n'est plus dans la page.
    arme = null;
    compteur.textContent = `${formaterPoints(BigInt(etat.recherche.pointsMilli))} points`;
    for (const branche of BRANCHES) {
      const panneau = corps[branche];
      panneau.textContent = '';
      for (const ligne of lignesDeRecherche(etat, branche)) {
        for (const cadre of cadresDOM(branche, ligne)) panneau.appendChild(cadre);
      }
    }
    const special = corps.special;
    special.textContent = '';
    for (const ligne of lignesSpeciales()) {
      const bloc = doc.createElement('div');
      bloc.className = 'piece';
      const rangee = doc.createElement('div');
      rangee.className = 'rangee';
      const pastille = doc.createElement('span');
      pastille.className = 'pastille';
      pastille.textContent = '★';
      const nom = doc.createElement('b');
      nom.textContent = ligne.libelle;
      const prix = doc.createElement('span');
      prix.className = 'prix';
      prix.textContent = ligne.prix;
      rangee.append(pastille, nom, prix);
      const raison = doc.createElement('div');
      raison.className = 'raison';
      raison.textContent = ligne.raison;
      bloc.append(rangee, raison);
      special.appendChild(bloc);
    }
  }

  return { peindre };
}
