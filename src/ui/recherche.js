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
 * ⚠ TROIS OUVRAGES ONT UN NOM À EUX, LES AUTRES PRENNENT L'ORIENTATION SUD.
 * Le Merlon, la Herse et la Ronce n'ont pas de tourelle et ne sont donc pas
 * déclinés en seize directions ; les six autres ouvrages le sont, et le sud est
 * celui qui regarde le joueur. Les unités, elles, ont un sprite unique.
 *
 * ⚠ ET LA LETTRE EST TOUJOURS `_j_`. C'est l'arbre du JOUEUR : `off_o_…` est le
 * vocabulaire de l'Ouvrage, et mélanger les deux dans un même écran est
 * exactement ce que CLAUDE.md §4 interdit pour les noms.
 *
 * @param {string} id
 * @returns {{famille: string, nom: string}[]}
 */
export function couchesDeLaPiece(id) {
  if (UNITES[id] !== undefined) return [{ famille: 'unite', nom: `off_j_${id}` }];
  if (DEFENSES[id] === undefined) {
    throw new RangeError(`recherche : « ${id} » n'est ni une unité ni un ouvrage`);
  }
  const sans = { merlon: 'def_j_merlon_isole', herse: 'def_j_herse', ronce: 'def_j_ronce' };
  return [{ famille: 'defense', nom: sans[id] ?? `def_j_${id}_s` }];
}

/**
 * Ce qu'une ligne d'achat affiche : son prix, son état, et la raison du refus.
 *
 * ⚠ « ACQUIS » N'EST PAS UN REFUS, C'EST UN ÉTAT. `problemesDeLAchat` rend bien
 * `dejaAcquise`, mais l'afficher comme une raison de blocage se lirait comme un
 * reproche ; la ligne dit « Acquis » et se tait.
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
  const restants = problemes.filter((p) => p.code !== 'dejaAcquise');
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
 * seconde rangée plutôt que d'afficher un module vide à zéro point — ce qui se
 * lirait « gratuit ».
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

  function ligneDePiece(branche, ligne) {
    const bloc = doc.createElement('div');
    bloc.className = 'piece';
    bloc.classList.toggle('acquise', ligne.unite.acquis);

    const rangee = doc.createElement('div');
    rangee.className = 'rangee';
    const vignette = doc.createElement('span');
    vignette.className = 'sprite';
    poserCouches(vignette, ligne.couches);
    const nom = doc.createElement('b');
    nom.textContent = ligne.nom;
    rangee.append(vignette, nom, boutonDAchat(branche, ligne.id, 'unite', ligne.unite));
    bloc.appendChild(rangee);
    if (ligne.unite.raison !== '') {
      const raison = doc.createElement('div');
      raison.className = 'raison';
      raison.textContent = ligne.unite.raison;
      bloc.appendChild(raison);
    }

    if (ligne.module !== null) {
      // ⚠ EN RETRAIT, ET C'EST LA MISE EN PAGE QUI LE DIT. Le module appartient
      // à la pièce du dessus : aligné sur elle, il se lirait comme une
      // quinzième pièce.
      const mod = doc.createElement('div');
      mod.className = 'module';
      const tete = doc.createElement('div');
      tete.className = 'rangee';
      const pastille = doc.createElement('span');
      pastille.className = 'pastille';
      pastille.textContent = '◈';
      const titre = doc.createElement('b');
      titre.textContent = ligne.module.libelle;
      tete.append(pastille, titre, boutonDAchat(branche, ligne.id, 'module', ligne.module));
      const quoi = doc.createElement('div');
      quoi.className = 'description';
      quoi.textContent = ligne.module.description;
      mod.append(tete, quoi);
      if (ligne.module.raison !== '') {
        const raison = doc.createElement('div');
        raison.className = 'raison';
        raison.textContent = ligne.module.raison;
        mod.appendChild(raison);
      }
      bloc.appendChild(mod);
    }
    return bloc;
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
        panneau.appendChild(ligneDePiece(branche, ligne));
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
