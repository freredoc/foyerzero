// L'écran Chantier — ce que le joueur voit de sa base.
//
// EN LECTURE, et c'est un arbitrage, pas une timidité. Le joueur regarde sa
// base, son terrain, ses stocks qui montent et ses niveaux ; il ne pose rien,
// n'améliore rien, ne démonte rien. La couche d'action n'existe pas dans
// `sim/` — elle attend un arbitrage d'Ethan sur la part de scorie d'un coût de
// construction — et des boutons qui ne peuvent rien faire seraient pires
// montrés vifs que montrés inertes. Ils sont donc PRÉSENTS et DÉSACTIVÉS : la
// place qu'ils prendront est déjà tenue, et rien ne ment sur ce qu'on peut
// faire aujourd'hui.
//
// ⚠ CE FICHIER TOUCHE AU DOM, et il est le deuxième du dépôt dans ce cas après
// le banc d'essai. La règle n'a pas changé : le DOM reste confiné à `src/ui/`,
// et `banc.test.js` le balaie. Ce qui a changé, c'est qu'`ui/` porte désormais
// deux écrans au lieu d'un.
//
// ⚠ AUCUNE COULEUR ICI. Toute la palette vit dans la feuille de style
// d'`index.src.html`, sous la garde des vingt-huit teintes de
// `FICHE-STYLE.md`. Un module qui forgerait une couleur en JavaScript la
// mettrait hors de portée d'une relecture de feuille.
//
// ⚠ AUCUN CHIFFRE DE CALIBRAGE NON PLUS. La largeur de la grille, les bornes
// des trois bandes, les noms, les coûts, les débits, les capacités : tout est
// LU dans `src/data/` et `src/sim/`. C'est la différence avec
// `foyer-zero-ui.html`, qui est une maquette et qui grave ses chiffres.

import { GRILLE } from '../data/combat.js';
import { BASE_BATIMENTS, COUT_NIVEAU_DEUX, emplacementsDuNiveau, estDansLaBase } from '../data/base.js';
import { RESSOURCES, capacitesMilli, debitsMilliParHeure } from '../sim/economie-base.js';
import { productionParRessource } from '../sim/disposition.js';
import { niveauDesBatiments } from '../sim/niveau-de-base.js';
import { ligneEcranDeLaRangee, ligneEcranDeLaBande, rangeeDeLaLigneEcran } from '../render/orientation.js';
// ⚠ `poser` EST IMPORTÉ SOUS UN AUTRE NOM, ET C'EST DÉLIBÉRÉ. `src/ui/` porte
// DEUX fonctions `poser` sans rapport : celle-ci, qui pose un bâtiment dans la
// base, et celle d'`ui/arsenal.js`, qui pose une unité dans une vague — que
// `ui/banc.js` entoure légitimement d'un `try`, son contrat étant de lever sur
// un dépassement de budget, qui est un fait de JEU. Le dépôt s'est déjà fait
// mordre par un nom court homonyme (`combat.js`, table et moteur) ; ici le
// renommage à l'import coûte un mot et rend le garde-fou EXACT.
import { problemesDeLaPose, poser as poserBatiment } from '../sim/state.js';

// ---------------------------------------------------------------------------
// Formatage — la seule couche qui a le droit de quitter les entiers du moteur
// ---------------------------------------------------------------------------
//
// Le moteur range des MILLI-unités et des DIXIÈMES de niveau, en entiers, et il
// a de bonnes raisons de le faire (voir `sim/economie-base.js` et
// `sim/niveau-de-base.js`). La division par mille et par dix se fait ICI, au
// dernier moment, et nulle part ailleurs : une unité entière rangée dans l'état
// serait une seconde vérité qui dérive.

/** L'espace fine insécable du français, entre les milliers. */
export const SEPARATEUR_MILLIERS = ' ';

/**
 * Groupe les chiffres par trois, à la française.
 *
 * ⚠ ÉCRIT À LA MAIN PLUTÔT QUE PAR `toLocaleString`, et c'est délibéré. Le
 * format d'une locale dépend des données ICU embarquées dans le moteur : le
 * même appel rend une espace fine insécable ici, une espace insécable ailleurs,
 * et rien du tout sur un runtime compilé sans ICU. Un affichage qui change
 * selon l'appareil n'est pas testable, et un test qui normalise le séparateur
 * pour s'en accommoder ne mesure plus l'affichage réel.
 *
 * @param {number} n entier
 * @returns {string}
 */
export function formaterEntier(n) {
  if (!Number.isFinite(n)) {
    throw new TypeError(`formaterEntier : « ${n} » n'est pas un nombre fini`);
  }
  const entier = Math.trunc(n);
  const signe = entier < 0 ? '-' : '';
  const chiffres = String(Math.abs(entier));
  let sortie = '';
  for (let i = 0; i < chiffres.length; i++) {
    if (i > 0 && (chiffres.length - i) % 3 === 0) sortie += SEPARATEUR_MILLIERS;
    sortie += chiffres[i];
  }
  return signe + sortie;
}

/**
 * Milli-unités → unités entières affichables.
 *
 * ⚠ TRONQUÉ, JAMAIS ARRONDI AU SUPÉRIEUR. Afficher 1 quand le stock vaut 999
 * milli ferait croire au joueur qu'il peut dépenser une unité qu'il n'a pas.
 * C'est la même règle que `formaterPv` du banc, et pour la même raison.
 *
 * @param {number} milli
 * @returns {string}
 */
export function formaterUnites(milli) {
  return formaterEntier(Math.floor(milli / 1000));
}

/**
 * Dixièmes de niveau → « 4,6 ».
 *
 * ⚠ LA DÉCIMALE EST TOUJOURS MONTRÉE — « 6,0 », jamais « 6 ». Arbitré le 27/08.
 * Un niveau moyen qui tombe rond reste une moyenne, et l'écrire sans décimale
 * le ferait lire comme un niveau entier de bâtiment.
 *
 * @param {number} dixiemes entier
 * @returns {string}
 */
export function formaterDixiemes(dixiemes) {
  if (!Number.isInteger(dixiemes)) {
    throw new TypeError(`formaterDixiemes : « ${dixiemes} » n'est pas un entier de dixièmes`);
  }
  const signe = dixiemes < 0 ? '-' : '';
  const absolu = Math.abs(dixiemes);
  return `${signe}${formaterEntier(Math.floor(absolu / 10))},${absolu % 10}`;
}

/**
 * Un débit horaire en milli-unités → « +2 250/h ». Un débit nul rend « — » :
 * un « +0/h » se lit comme une panne, alors qu'un bâtiment qui ne produit rien
 * est le cas ordinaire d'une base neuve.
 * @param {number} milliParHeure
 * @returns {string}
 */
export function formaterDebit(milliParHeure) {
  if (milliParHeure === 0) return '—';
  const signe = milliParHeure > 0 ? '+' : '';
  return `${signe}${formaterUnites(milliParHeure)}/h`;
}

// ⚠ LA VIGNETTE DE POSE NE PORTE PLUS AUCUNE PASTILLE, et c'est la seconde
// correction du même défaut. Elle a d'abord porté `COUT_NIVEAU_DEUX` en chiffre
// nu — « 3 » sur un Collecteur, qui se lit « poser coûte 3 » alors que poser ne
// coûte rien. Le chiffre a été remplacé par le mot « gratuit », et Ethan l'a
// fait retirer à l'essai du 27/08 : douze vignettes qui disent toutes la même
// chose ne disent plus rien, et la place manque à 82 px de large. Le fait reste
// vrai et reste DIT — dans le titre de la vignette, là où on le cherche quand on
// se pose la question. Le coût de la première amélioration, lui, est toujours
// rendu par `posablesDeLaBase` : l'écran des améliorations l'aura sous la main.

/** Un niveau absent — la Défense et l'Assaut, qui n'ont pas encore d'état. */
export const NIVEAU_ABSENT = '—';

/**
 * Un des trois niveaux du joueur, en dixièmes, ou `null` s'il n'existe pas
 * encore.
 * @param {number|null} dixiemes
 * @returns {string}
 */
export function formaterNiveau(dixiemes) {
  return dixiemes === null ? NIVEAU_ABSENT : formaterDixiemes(dixiemes);
}

// ---------------------------------------------------------------------------
// Vocabulaire d'écran
// ---------------------------------------------------------------------------

/**
 * Le sigle de trois lettres porté par le jeton d'un bâtiment.
 *
 * ⚠ TABLE ÉCRITE À LA MAIN, ET IL LE FAUT. Les trois premières lettres du nom
 * ne suffisent pas : « Centrale » et « Centre de commandement » donneraient
 * toutes deux « CEN ». Deux bâtiments qui portent le même sigle sur la grille
 * sont deux bâtiments qu'on confond à l'œil, ce qui est précisément ce que le
 * sigle doit empêcher.
 *
 * ⚠ CE N'EST PAS UNE VALEUR DE CALIBRAGE, donc elle ne va pas dans `src/data/`.
 * C'est un raccourci d'AFFICHAGE, comme les libellés de cause du banc : le nom
 * qui fait foi reste `BASE_BATIMENTS[id].nom.joueur`, et c'est lui qui
 * s'affiche dans le bandeau contextuel. Un test asserte que cette table couvre
 * exactement les onze bâtiments et que les onze sigles sont distincts.
 */
export const SIGLES = {
  chantierDeConstruction: 'CHA',
  centreDeCommandement: 'CDC',
  qgDeDefense: 'QGD',
  complexeDeDefense: 'CPX',
  caserne: 'CAS',
  depotDeVehicules: 'DEP',
  aerodrome: 'AER',
  centrale: 'CEN',
  collecteur: 'COL',
  raffinerie: 'RAF',
  accumulateur: 'ACC',
};

/**
 * La famille visuelle d'un bâtiment — ce qui décide de la couleur de son liseré.
 *
 * DÉDUITE DU RÔLE, jamais écrite bâtiment par bâtiment : une seconde liste des
 * onze divergerait de la première le jour où un rôle change.
 *   `central`                      → pivot   le Chantier, dont la chute rase tout
 *   `producteur` · `stockage`      → prod    l'économie
 *   tout le reste                  → mil     ce qui fabrique ou répare la force
 *
 * @param {string} id
 * @returns {'pivot'|'prod'|'mil'}
 */
export function familleDuBatiment(id) {
  const def = BASE_BATIMENTS[id];
  if (def === undefined) throw new Error(`chantier : « ${id} » n'est pas un bâtiment de la base`);
  if (def.role === 'central') return 'pivot';
  if (def.role === 'producteur' || def.role === 'stockage') return 'prod';
  return 'mil';
}

/**
 * Les trois bandes de la grille, lues dans `GRILLE` et jamais réécrites.
 *
 * ⚠ LA RANGÉE 18 EST LE FOND, PAS « LE HAUT ». L'assaillant paraît aux rangées
 * 1–2 et monte en numéro ; la dernière rangée est donc la dernière qu'il
 * atteint. Le mot « haut » a coûté un lot le 26/08 et il ne se réemploie pas.
 */
export const BANDES = [
  { cle: 'deploiement', nom: 'Déploiement', ...GRILLE.bandes.deploiement },
  { cle: 'defense', nom: 'Défense', ...GRILLE.bandes.defense },
  { cle: 'batiments', nom: 'Chantier', ...GRILLE.bandes.batiments },
];

/**
 * Les bandes qui portent un bouton dans la barre du bas, dans l'ordre où elles
 * se lisent à l'écran : la base d'abord, sa défense ensuite.
 *
 * ⚠ LE DÉPLOIEMENT N'EN EST PAS, ET C'EST UNE CORRECTION. Le lot ÉCRAN-CHANTIER
 * lui avait donné un bouton nommé « Assaut » pointant sur les rangées 1–2. Ces
 * deux rangées sont l'endroit où les vagues PARAISSENT pendant un combat, pas
 * celui où on les COMPOSE : le bouton promettait un éditeur et livrait du sol
 * nu. La composition d'assaut a désormais son propre écran (`ui/offense.js`),
 * atteint par un bouton qui, lui, mène là où il le dit.
 *
 * La bande elle-même reste dans `BANDES` : elle existe toujours dans la grille,
 * elle se dessine, elle se traverse en défilant. Elle n'a simplement plus de
 * raccourci.
 */
export const BANDES_NAVIGABLES = ['batiments', 'defense'];

/**
 * La bande à laquelle appartient une rangée.
 * @param {number} rangee
 * @returns {string} clé de bande
 */
export function bandeDeLaRangee(rangee) {
  const trouvee = BANDES.find((b) => rangee >= b.premiere && rangee <= b.derniere);
  if (trouvee === undefined) {
    throw new RangeError(`chantier : rangée ${rangee} hors de la grille`);
  }
  return trouvee.cle;
}

/** Les libellés courts des trois ressources, dans l'ordre de `RESSOURCES`. */
export const LIBELLES_RESSOURCE = {
  quartz: { nom: 'Quartz', sigle: 'q' },
  scorie: { nom: 'Scorie', sigle: 's' },
  electricite: { nom: 'Élec.', sigle: 'él' },
};

// ---------------------------------------------------------------------------
// Ce que l'écran lit dans l'état — la partie PURE, donc la partie testée
// ---------------------------------------------------------------------------

/**
 * Tout ce que les bandeaux 2, 3 et 6 affichent, calculé depuis l'état seul.
 *
 * ⚠ CETTE FONCTION NE TOUCHE PAS AU DOM, et c'est ce qui la rend testable dans
 * un dépôt qui n'a ni jsdom ni navigateur. Ce qui peut être vérifié sans écran
 * doit l'être ; ce qui ne le peut pas se déclare non exécuté.
 *
 * @param {object} etat état de jeu de `sim/state.js`
 * @returns {{
 *   ressources: Array<{cle: string, stockMilli: number, capaciteMilli: number, debitMilli: number}>,
 *   emplacements: {poses: number, ouverts: number},
 *   niveaux: {batiments: number, defense: null, assaut: null}
 * }}
 */
export function resumeDeLaBase(etat) {
  if (!etat || !Array.isArray(etat.disposition)) {
    throw new TypeError('chantier : état de jeu absent ou malformé');
  }
  const capacites = capacitesMilli(etat.disposition);
  const debits = debitsMilliParHeure(etat.disposition, etat.champs);

  const total = {};
  for (const r of RESSOURCES) total[r] = 0;
  for (const parBatiment of debits) {
    for (const r of RESSOURCES) {
      if (parBatiment[r] !== undefined) total[r] += parBatiment[r];
    }
  }

  const chantier = etat.disposition.find((b) => b.id === 'chantierDeConstruction');
  if (chantier === undefined) {
    // `verifierEtat` refuse déjà une base sans Chantier au chargement ; la garde
    // est ici pour que l'écran nomme la faute au lieu de rendre « NaN / NaN ».
    throw new Error('chantier : la base n\'a pas de Chantier de construction');
  }

  return {
    ressources: RESSOURCES.map((cle) => ({
      cle,
      stockMilli: etat.economie.ressources[cle],
      capaciteMilli: capacites[cle],
      debitMilli: total[cle],
    })),
    emplacements: {
      poses: etat.disposition.length,
      ouverts: emplacementsDuNiveau(chantier.niveau),
    },
    // ⚠ DEUX DES TROIS NIVEAUX SONT `null`, ET C'EST DÉLIBÉRÉ. L'état du joueur
    // ne porte ni garnison ni armée d'assaut : `ui/defense.js` et
    // `ui/arsenal.js` sont des ÉDITEURS, et rien de ce qu'ils produisent n'est
    // sauvegardé. Inventer une moyenne sur des unités que l'état ne porte pas
    // afficherait un chiffre faux ; « — » dit ce qui est vrai, c'est-à-dire
    // qu'il n'y a rien à moyenner.
    niveaux: { batiments: niveauDesBatiments(etat.disposition), defense: null, assaut: null },
  };
}

/**
 * Ce que le bandeau contextuel dit du bâtiment sélectionné.
 * @param {object} etat
 * @param {number} index indice dans la disposition
 */
export function detailDuBatiment(etat, index) {
  const b = etat.disposition[index];
  if (b === undefined) throw new RangeError(`chantier : indice ${index} hors de la disposition`);
  const def = BASE_BATIMENTS[b.id];
  const production = productionParRessource(etat.disposition, etat.champs, index);
  const morceaux = [];
  for (const r of RESSOURCES) {
    if (!production[r]) continue;
    morceaux.push(`+${formaterEntier(production[r])} ${LIBELLES_RESSOURCE[r].sigle}`);
  }
  return {
    nom: def.nom.joueur,
    niveau: b.niveau,
    // « Niv. 5 · +176 q +352 s /h » — et rien du tout quand le bâtiment ne
    // produit pas, plutôt qu'un « /h » orphelin.
    detail: morceaux.length === 0
      ? `Niv. ${b.niveau}`
      : `Niv. ${b.niveau} · ${morceaux.join(' ')} /h`,
  };
}

/**
 * Les bâtiments que le joueur pourrait poser — ceux qui ne sont pas uniques, et
 * ceux qui le sont mais ne sont pas encore posés.
 *
 * ⚠ LE CHAMP S'APPELLE `coutPremiereAmelioration`, ET LE NOM EST LA CORRECTION.
 * Il s'appelait `coutNiveauDeux` et la vignette l'affichait en nombre nu, dans
 * un coin : « 3 » sur un Collecteur qu'on peut poser se lit « poser coûte 3 ».
 * Or poser ne coûte RIEN — `ECONOMIE_NIVEAU.premierNiveauPayant` vaut 2, le
 * niveau 1 est gratuit pour les onze, et le fichier le savait déjà : un
 * commentaire l'écrivait noir sur blanc trois lignes plus haut pendant que le
 * code affichait le chiffre. Renommer le champ est ce qui empêche la
 * confusion de revenir, parce que le point d'appel ne peut plus se tromper
 * sans que ça se voie en relecture.
 *
 * ⚠ ET LE CHIFFRE A QUITTÉ LA VIGNETTE DE POSE. L'amendement laissait le choix
 * entre le dire et le retirer ; une vignette de 82 px n'a pas la place de dire
 * « première amélioration », et un chiffre mal légendé est exactement ce qu'on
 * répare. Ce que la vignette annonce maintenant est le fait vrai : la pose est
 * gratuite. Le coût reste rendu par cette fonction — le titre de la vignette le
 * porte, et l'écran qui saura présenter les améliorations l'aura sous la main.
 *
 * ⚠ AUCUNE RESSOURCE N'EST NOMMÉE AVEC CE NOMBRE. `COUT_NIVEAU_DEUX` donne un
 * nombre unique et `COUT_ELECTRICITE` une fraction du coût EN QUARTZ ; rien ne
 * dit comment le total se répartit entre quartz et scorie depuis que le modèle
 * du lot 1 est parti avec `data/params.js`. Écrire « 3 quartz » serait inventer
 * une répartition qu'Ethan n'a pas arbitrée. Un nombre sans ressource, dit comme
 * tel, est plus honnête.
 *
 * @param {object} etat
 * @returns {Array<{id: string, nom: string, famille: string, coutPremiereAmelioration: number}>}
 */
export function posablesDeLaBase(etat) {
  const poses = new Set(etat.disposition.map((b) => b.id));
  return Object.entries(BASE_BATIMENTS)
    .filter(([id, def]) => !(def.unique === true && poses.has(id)))
    .map(([id, def]) => ({
      id,
      nom: def.nom.joueur,
      famille: familleDuBatiment(id),
      coutPremiereAmelioration: COUT_NIVEAU_DEUX[def.classeDeCout],
    }));
}

/**
 * Les cases où ce bâtiment peut se poser, aujourd'hui, sur cette base.
 *
 * ⚠ ELLES SE CALCULENT, ELLES NE SE DEVINENT PAS. On interroge
 * `problemesDeLaPose` case par case au lieu de réimplémenter les règles ici :
 * `sim/disposition.js` est la seule table de règles du jeu, et une seconde
 * lecture des mêmes règles finirait par diverger de la première — sur le
 * voisinage, sur les uniques, sur le plafond d'emplacements.
 *
 * ⚠ ON NE BALAIE QUE LA BANDE DES BÂTIMENTS. Les rangées de défense et de
 * déploiement ne reçoivent aucun bâtiment : les interroger ferait répondre
 * `hors-base` quatre-vingt-dix fois pour rien.
 *
 * Le coût est celui d'un GESTE, pas d'une boucle de rendu — quelques
 * millisecondes une fois par sélection. Il n'y a donc aucune raison d'aller
 * plus vite au prix d'une copie des règles.
 *
 * @param {object} etat
 * @param {string} id
 * @returns {Array<{rangee: number, colonne: number}>}
 */
export function casesPosables(etat, id) {
  const bande = GRILLE.bandes.batiments;
  const cases = [];
  for (let rangee = bande.premiere; rangee <= bande.derniere; rangee++) {
    for (let colonne = 1; colonne <= GRILLE.largeur; colonne++) {
      if (problemesDeLaPose(etat, id, rangee, colonne).length === 0) {
        cases.push({ rangee, colonne });
      }
    }
  }
  return cases;
}

/**
 * Ce qu'on dit au joueur quand une pose est refusée.
 *
 * ⚠ LES MESSAGES DU MOTEUR SONT REPRIS TELS QUELS, jamais reformulés. Ils sont
 * déjà écrits en français lisible — « Collecteur doit être posé sur un champ »,
 * « deux bâtiments sur la case (14,3) » — et ils viennent de
 * `sim/disposition.js`, qui est la seule table de règles. Une seconde
 * formulation dans l'écran finirait par dire autre chose que la règle.
 *
 * @param {Array<{message: string}>} problemes
 * @returns {string}
 */
export function messageDeRefus(problemes) {
  return problemes.map((p) => p.message).join(' ; ');
}

// ---------------------------------------------------------------------------
// Le DOM
// ---------------------------------------------------------------------------

/** Clé d'une case. */
function cle(rangee, colonne) {
  return `${rangee}:${colonne}`;
}

/**
 * Câble l'écran Chantier dans une page qui porte le balisage attendu (voir
 * `index.src.html`) et rend de quoi le nourrir.
 *
 * ⚠ IL NE VA PAS CHERCHER L'ÉTAT, ON LE LUI DONNE. La session (`ui/session.js`)
 * possède l'état, l'horloge et la sauvegarde ; cet écran ne fait que peindre ce
 * qu'on lui passe. C'est ce qui permet de le rafraîchir à 10 Hz sans qu'il ait
 * la moindre idée de ce qu'est une heure.
 *
 * @param {Document} doc
 * @returns {{peindre: Function, rafraichir: Function, allerALaBande: Function}}
 */
export function initialiserEcranChantier(doc, { apresPose } = {}) {
  const $ = (id) => doc.getElementById(id);
  const defile = $('chantier-defile');
  const grille = $('chantier-grille');

  let selection = null; // indice dans la disposition, ou null
  let etatCourant = null;
  // Le bâtiment que le joueur s'apprête à poser, ou null. C'est le seul mode
  // de l'écran : quand il vaut null, toucher une case SÉLECTIONNE ; sinon,
  // toucher une case POSE.
  let posableChoisi = null;
  const cellules = new Map(); // « rangée:colonne » → élément

  /**
   * Le bandeau qui parle au joueur — refus de pose, plus d'emplacements,
   * sauvegarde impossible.
   *
   * ⚠ IL VIT ICI PARCE QUE L'ÉLÉMENT EST DANS `#ecran-chantier`. La session
   * l'écrivait directement, ce qui allait tant qu'elle était seule à le faire ;
   * maintenant que la pose parle aussi, deux modules qui écrivent la même ligne
   * sans se connaître finiraient par s'écraser l'un l'autre. Un seul
   * propriétaire, et la session passe par lui.
   */
  function avis(texte) {
    const ligne = $('chantier-avis');
    ligne.textContent = texte;
    ligne.hidden = texte === '';
  }

  // --- la grille, construite une fois ---------------------------------------
  //
  // Autant de cases que `GRILLE` en déclare — jamais 9 ni 18 écrits ici. Elles
  // ne changent jamais de place, seul leur contenu bouge : reconstruire le
  // balisage à chaque image ferait perdre la sélection et le défilement.
  //
  // ⚠ LE RAIL DES BANDES EST LA PREMIÈRE COLONNE DE CETTE MÊME GRILLE, et ce
  // n'est pas un raccourci. Un rail posé à côté, dans un conteneur flex, se
  // règle sur la hauteur VISIBLE de la boîte de défilement et non sur celle de
  // la grille : dès le premier défilement il se décale, et il finit par
  // désigner la mauvaise bande. Le rendre solidaire des rangées est ce qui
  // garantit qu'il dit vrai à toute hauteur d'écran — la maquette ne pouvait
  // pas le savoir, elle travaillait à 360 px de large et à cellule fixe.
  grille.style.gridTemplateColumns = `var(--rail) repeat(${GRILLE.largeur}, 1fr)`;
  for (const bande of BANDES) {
    const { premiereLigne, nbLignes } = ligneEcranDeLaBande(bande);
    const segment = doc.createElement('div');
    segment.className = `segment ${bande.cle}`;
    segment.style.gridColumn = '1';
    segment.style.gridRow = `${premiereLigne} / span ${nbLignes}`;
    grille.appendChild(segment);
  }
  for (let rangee = 1; rangee <= GRILLE.longueur; rangee++) {
    const bande = bandeDeLaRangee(rangee);
    for (let colonne = 1; colonne <= GRILLE.largeur; colonne++) {
      const case_ = doc.createElement('div');
      case_.className = `case ${bande}`;
      case_.dataset.rangee = String(rangee);
      case_.dataset.colonne = String(colonne);
      case_.style.gridColumn = String(colonne + 1);
      // ⚠ LA LIGNE D'ÉCRAN N'EST PAS LA RANGÉE. `render/orientation.js` fait la
      // seule transformation, ici comme pour le rail : poser `gridRow = rangee`
      // mettait la rangée 1 en premier, donc le déploiement avant la base.
      case_.style.gridRow = String(ligneEcranDeLaRangee(rangee));
      if (colonne === 1) {
        const numero = doc.createElement('span');
        numero.className = 'numero';
        numero.textContent = String(rangee);
        case_.appendChild(numero);
      }
      cellules.set(cle(rangee, colonne), case_);
      grille.appendChild(case_);
    }
  }

  // --- les trois bandeaux de ressource ---------------------------------------
  const champsRessource = new Map();
  const bandeauRessources = $('chantier-ressources');
  for (const cleRessource of RESSOURCES) {
    const bloc = doc.createElement('div');
    bloc.className = `ressource ${cleRessource}`;
    const stock = doc.createElement('b');
    const capacite = doc.createElement('span');
    capacite.className = 'capacite';
    const nom = doc.createElement('span');
    nom.className = 'nom';
    nom.textContent = LIBELLES_RESSOURCE[cleRessource].nom;
    const debit = doc.createElement('span');
    debit.className = 'debit';

    const haut = doc.createElement('div');
    haut.className = 'ligne';
    haut.append(stock, capacite);
    const bas = doc.createElement('div');
    bas.className = 'ligne';
    bas.append(nom, debit);
    bloc.append(haut, bas);
    bandeauRessources.appendChild(bloc);
    champsRessource.set(cleRessource, { stock, capacite, debit });
  }

  // --- les trois boutons de bande --------------------------------------------
  //
  // ⚠ ILS FONT DÉFILER, ILS NE CHANGENT PAS D'ÉCRAN. Les trois bandes sont trois
  // parties d'une même grille : les traiter comme trois écrans ferait perdre au
  // joueur le fait qu'un assaut TRAVERSE la défense pour atteindre les
  // bâtiments.
  // ⚠ LES BOUTONS DE BANDE VONT DANS LA LISTE, PAS DANS LA BARRE. La barre porte
  // aussi le saut vers l'écran Offense, écrit dans le balisage ; y ajouter les
  // bandes par le JS les poserait APRÈS lui, et le saut se lirait en premier.
  // Une liste à part garde l'ordre du document égal à l'ordre de l'écran.
  const bandeauBandes = $('chantier-bandes-liste');
  const boutonsBande = new Map();
  // Deux boutons, dans l'ordre où les bandes se lisent maintenant à l'écran :
  // la base d'abord, sa défense ensuite. Le déploiement n'en a plus — voir
  // `BANDES_NAVIGABLES`.
  for (const bande of BANDES_NAVIGABLES.map((c) => BANDES.find((b) => b.cle === c))) {
    const bouton = doc.createElement('button');
    bouton.type = 'button';
    bouton.className = `bande ${bande.cle}`;
    bouton.dataset.bande = bande.cle;
    const trait = doc.createElement('em');
    const nom = doc.createElement('span');
    nom.textContent = bande.nom;
    const niveau = doc.createElement('i');
    niveau.textContent = NIVEAU_ABSENT;
    bouton.append(trait, nom, niveau);
    bouton.addEventListener('click', () => allerALaBande(bande.cle));
    bandeauBandes.appendChild(bouton);
    boutonsBande.set(bande.cle, { bouton, niveau });
  }

  /** Hauteur d'une rangée à l'écran, mesurée et non supposée. */
  function hauteurRangee() {
    return grille.getBoundingClientRect().height / GRILLE.longueur;
  }

  /**
   * Amène la première rangée d'une bande en tête du champ.
   * @param {string} cleBande
   */
  function allerALaBande(cleBande) {
    const bande = BANDES.find((b) => b.cle === cleBande);
    if (bande === undefined) throw new Error(`chantier : bande « ${cleBande} » inconnue`);
    const { premiereLigne } = ligneEcranDeLaBande(bande);
    defile.scrollTo({ top: (premiereLigne - 1) * hauteurRangee(), behavior: 'smooth' });
    marquerBandeActive(cleBande);
  }

  function marquerBandeActive(cleBande) {
    for (const [c, { bouton }] of boutonsBande) {
      bouton.classList.toggle('active', c === cleBande);
    }
  }

  // La bande active suit aussi le défilement à la main : les seuils se
  // déduisent de la hauteur mesurée d'une rangée, jamais d'un nombre de pixels
  // écrit en dur — la cellule est carrée, donc sa taille dépend de la largeur
  // de l'écran.
  defile.addEventListener('scroll', () => {
    const h = hauteurRangee();
    if (!(h > 0)) return;
    const ligneEnTete = Math.min(
      GRILLE.longueur,
      Math.max(1, Math.round(defile.scrollTop / h) + 1),
    );
    marquerBandeActive(bandeDeLaRangee(rangeeDeLaLigneEcran(ligneEnTete)));
  });

  // --- la palette des posables -----------------------------------------------
  const bandeauPalette = $('chantier-palette');

  function peindrePalette(etat) {
    bandeauPalette.textContent = '';
    const posables = posablesDeLaBase(etat);
    // Un unique qu'on vient de poser sort de la palette : la sélection qui le
    // désignait n'a plus d'objet et se défait, sans quoi l'écran resterait en
    // mode pose avec zéro case légale et sans rien dire.
    if (posableChoisi !== null && !posables.some((p) => p.id === posableChoisi)) {
      posableChoisi = null;
    }
    for (const posable of posables) {
      const emplacement = doc.createElement('button');
      emplacement.type = 'button';
      emplacement.className = `posable ${posable.famille}`;
      emplacement.classList.toggle('actif', posable.id === posableChoisi);
      emplacement.title = `${posable.nom} — poser au niveau 1 est gratuit ; la première `
        + `amélioration coûtera ${posable.coutPremiereAmelioration}.`;
      const vignette = doc.createElement('i');
      const nom = doc.createElement('b');
      nom.textContent = posable.nom;
      emplacement.append(vignette, nom);
      emplacement.addEventListener('click', () => choisirPosable(posable.id));
      bandeauPalette.appendChild(emplacement);
    }
  }

  /**
   * Le joueur choisit — ou déchoisit — un bâtiment à poser.
   * Retoucher celui qui est actif défait la sélection : c'est le seul moyen de
   * sortir du mode pose sans poser, et il faut qu'il existe.
   */
  function choisirPosable(id) {
    posableChoisi = posableChoisi === id ? null : id;
    if (posableChoisi === null) {
      avis('');
      peindrePalette(etatCourant);
      marquerCasesLegales();
      return;
    }
    // ⚠ LE JOUEUR DOIT COMPRENDRE AVANT DE TOUCHER UNE CASE. Sans emplacement
    // libre, toutes les cases sont illégales : le laisser en essayer une pour
    // qu'on lui dise non serait le faire travailler pour rien.
    const { poses, ouverts } = resumeDeLaBase(etatCourant).emplacements;
    if (poses >= ouverts) {
      avis(`${poses} bâtiments pour ${ouverts} emplacements : améliorer le Chantier de `
        + 'construction en ouvrira d\'autres.');
    } else {
      avis('');
    }
    peindrePalette(etatCourant);
    marquerCasesLegales();
  }

  /** Distingue à l'écran les cases où le bâtiment choisi peut se poser. */
  function marquerCasesLegales() {
    for (const case_ of cellules.values()) case_.classList.remove('legale');
    if (posableChoisi === null || etatCourant === null) return;
    for (const { rangee, colonne } of casesPosables(etatCourant, posableChoisi)) {
      cellules.get(cle(rangee, colonne))?.classList.add('legale');
    }
  }

  // --- la sélection ----------------------------------------------------------

  function selectionner(index) {
    selection = index;
    for (const case_ of cellules.values()) case_.classList.remove('choisie');
    const boutons = [$('chantier-reparer'), $('chantier-ameliorer'), $('chantier-demonter')];
    if (index === null || etatCourant === null) {
      $('chantier-selection-nom').textContent = '—';
      $('chantier-selection-detail').textContent = 'aucun bâtiment sélectionné';
      $('chantier-ameliorer-cible').textContent = '';
      for (const bouton of boutons) bouton.disabled = true;
      return;
    }
    const b = etatCourant.disposition[index];
    const detail = detailDuBatiment(etatCourant, index);
    cellules.get(cle(b.rangee, b.colonne))?.classList.add('choisie');
    $('chantier-selection-nom').textContent = detail.nom;
    $('chantier-selection-detail').textContent = detail.detail;
    $('chantier-ameliorer-cible').textContent = `vers niv. ${b.niveau + 1}`;
    // Ils restent désactivés : la couche d'action n'existe pas. La sélection
    // sert à LIRE, et lire est déjà ce que ce lot promet.
    for (const bouton of boutons) bouton.disabled = true;
  }

  grille.addEventListener('click', (evenement) => {
    const case_ = evenement.target.closest('.case');
    if (case_ === null || etatCourant === null) return;
    const rangee = Number(case_.dataset.rangee);
    const colonne = Number(case_.dataset.colonne);

    if (posableChoisi !== null) {
      tenterLaPose(rangee, colonne);
      return;
    }
    const index = etatCourant.disposition.findIndex(
      (b) => b.rangee === rangee && b.colonne === colonne,
    );
    selectionner(index === -1 ? null : index);
  });

  /**
   * Pose le bâtiment choisi, ou dit pourquoi c'est refusé.
   *
   * ⚠ ON DEMANDE D'ABORD, ON POSE ENSUITE — ET JAMAIS DE `try` AUTOUR DE
   * `poser`. La règle du dépôt est que `problemesDeLaPose` rend une LISTE
   * (fait de JEU : on la montre au joueur) là où `poser` LÈVE (fait de
   * PROGRAMME : l'écran n'aurait pas dû appeler sans regarder). Rattraper la
   * levée reviendrait à traiter une faute de programme comme un refus
   * ordinaire, et à masquer le jour où l'écran appellerait vraiment de travers.
   *
   * ⚠ POSER NE COÛTE RIEN. `ECONOMIE_NIVEAU.premierNiveauPayant` vaut 2 : le
   * niveau 1 est gratuit pour les onze. Il n'y a aucune ressource à prélever ni
   * à vérifier ici.
   */
  function tenterLaPose(rangee, colonne) {
    const problemes = problemesDeLaPose(etatCourant, posableChoisi, rangee, colonne);
    if (problemes.length > 0) {
      // La sélection RESTE : le joueur voulait poser, il a visé à côté. La lui
      // retirer l'obligerait à la refaire pour réessayer.
      avis(messageDeRefus(problemes));
      return;
    }

    poserBatiment(etatCourant, posableChoisi, rangee, colonne);
    avis('');
    // Le bâtiment tout juste posé devient le sélectionné : c'est ce que le
    // joueur regarde, et le bandeau contextuel en dit le niveau et le débit.
    selection = etatCourant.disposition.length - 1;
    peindre(etatCourant);
    rafraichir(etatCourant);
    // ⚠ SAUVEGARDER TOUT DE SUITE. C'est la première action irréversible du
    // jeu ; la perdre parce que l'application a été tuée avant le prochain
    // enregistrement périodique serait la pire façon de perdre la confiance du
    // joueur. La session sait comment écrire, l'écran sait seulement quand.
    if (apresPose !== undefined) apresPose(etatCourant);
  }

  /**
   * Repeint ce qui ne bouge qu'en jouant : le terrain, les bâtiments, la
   * palette. Appelée au chargement et à chaque fois que la disposition change.
   * @param {object} etat
   */
  function peindre(etat) {
    etatCourant = etat;
    // ⚠ UN INDICE DE SÉLECTION EST RELATIF À UNE DISPOSITION. Le jour où poser
    // et démonter existeront, un indice retenu d'avant la modification
    // désignerait un AUTRE bâtiment — pas une case vide, ce qui se verrait,
    // mais le voisin, ce qui ne se verrait pas. On le laisse tomber plutôt que
    // de le laisser mentir.
    if (selection !== null && selection >= etat.disposition.length) selection = null;
    for (const case_ of cellules.values()) {
      case_.classList.remove('champ', 'quartz', 'scorie');
      case_.querySelector('.jeton')?.remove();
      case_.querySelector('.vide')?.remove();
    }

    // ⚠ LE TERRAIN SE DESSINE SOUS LES BÂTIMENTS, JAMAIS AU-DESSUS. Un champ
    // masqué par le collecteur qui l'exploite ferait disparaître de l'écran la
    // seule chose qui explique ce que ce collecteur produit.
    for (const champ of etat.champs.cases) {
      const case_ = cellules.get(cle(champ.rangee, champ.colonne));
      if (case_ === undefined) continue;
      case_.classList.add('champ', champ.ressource);
    }

    for (const b of etat.disposition) {
      const case_ = cellules.get(cle(b.rangee, b.colonne));
      if (case_ === undefined) continue;
      const jeton = doc.createElement('div');
      jeton.className = `jeton ${familleDuBatiment(b.id)}`;
      jeton.textContent = SIGLES[b.id];
      const niveau = doc.createElement('span');
      niveau.className = 'niveau';
      niveau.textContent = String(b.niveau);
      jeton.appendChild(niveau);
      case_.appendChild(jeton);
    }

    // Les emplacements ouverts encore libres se montrent : c'est le seul indice
    // de ce que le joueur POURRA faire, et un indice n'est pas une interdiction.
    const resume = resumeDeLaBase(etat);
    let restants = resume.emplacements.ouverts - resume.emplacements.poses;
    const occupees = new Set(etat.disposition.map((b) => cle(b.rangee, b.colonne)));
    for (let rangee = GRILLE.bandes.batiments.derniere;
      rangee >= GRILLE.bandes.batiments.premiere && restants > 0; rangee--) {
      for (let colonne = 1; colonne <= GRILLE.largeur && restants > 0; colonne++) {
        if (!estDansLaBase(rangee, colonne)) continue;
        if (occupees.has(cle(rangee, colonne))) continue;
        const case_ = cellules.get(cle(rangee, colonne));
        if (case_.classList.contains('champ')) continue;
        const marque = doc.createElement('div');
        marque.className = 'vide';
        case_.appendChild(marque);
        restants -= 1;
      }
    }

    peindrePalette(etat);
    marquerCasesLegales();
    // À la première peinture, le Chantier est sélectionné d'office : un bandeau
    // contextuel vide au premier regard donne un écran qui a l'air en panne, et
    // le Chantier est de toute façon ce autour de quoi la base se lit.
    if (selection === null) {
      const chantier = etat.disposition.findIndex((b) => b.id === 'chantierDeConstruction');
      selection = chantier === -1 ? null : chantier;
    }
    selectionner(selection);
  }

  /**
   * Repeint ce qui bouge à chaque tick : les stocks, les débits, les niveaux.
   * @param {object} etat
   */
  function rafraichir(etat) {
    etatCourant = etat;
    const resume = resumeDeLaBase(etat);

    for (const r of resume.ressources) {
      const champs = champsRessource.get(r.cle);
      champs.stock.textContent = formaterUnites(r.stockMilli);
      champs.capacite.textContent = `/ ${formaterUnites(r.capaciteMilli)}`;
      champs.debit.textContent = formaterDebit(r.debitMilli);
      // ⚠ UN STOCK AU-DESSUS DU PLAFOND EST GELÉ, PAS AMPUTÉ (arbitré le
      // 26/08). Il faut donc que ça se VOIE, sinon le joueur croit à un bogue
      // de compteur : le nombre se marque « saturé » dès qu'il touche sa
      // capacité, et il ne descendra pas tout seul.
      champs.stock.classList.toggle('sature', r.stockMilli >= r.capaciteMilli);
    }

    const { poses, ouverts } = resume.emplacements;
    $('chantier-emplacements').textContent = `${poses} / ${ouverts}`;
    // Un dixième de pour cent suffit à une barre de six pixels de haut : sans
    // l'arrondi, l'attribut de style porte « 91.66666666666666% » à chaque
    // rafraîchissement, soit dix fois par seconde.
    const remplissage = ouverts === 0 ? 0 : Math.min(100, (poses / ouverts) * 100);
    $('chantier-jauge').style.width = `${remplissage.toFixed(1)}%`;

    // Chaque bouton porte SON niveau. Celui de la défense reste « — » : l'état
    // ne porte pas de garnison, et en inventer une moyenne afficherait un
    // chiffre faux là où le tiret dit ce qui est vrai.
    boutonsBande.get('batiments').niveau.textContent = formaterNiveau(resume.niveaux.batiments);
    boutonsBande.get('defense').niveau.textContent = formaterNiveau(resume.niveaux.defense);
    for (const [c, { bouton }] of boutonsBande) {
      bouton.classList.toggle('sans-niveau', c !== 'batiments');
    }

    if (selection !== null) {
      const detail = detailDuBatiment(etat, selection);
      $('chantier-selection-detail').textContent = detail.detail;
    }
  }

  return {
    peindre,
    rafraichir,
    allerALaBande,
    avis,
    /** Le champ s'ouvre sur la bande des bâtiments : c'est là qu'est la base. */
    ouvrirSurLaBase() {
      // Les bâtiments occupent désormais les premières lignes d'écran : ouvrir
      // sur la base, c'est ouvrir en tête du champ.
      defile.scrollTop = (ligneEcranDeLaBande(GRILLE.bandes.batiments).premiereLigne - 1)
        * hauteurRangee();
      marquerBandeActive('batiments');
    },
  };
}
