// L'écran Chantier — ce que le joueur voit de sa base, et tout ce qu'il y fait.
//
// EN LECTURE ET EN ÉCRITURE. Le paragraphe qui tenait ici jusqu'au 28/08 disait
// l'inverse — « il ne pose rien, n'améliore rien, ne démonte rien », « les
// boutons sont PRÉSENTS et DÉSACTIVÉS » — et il était faux depuis deux lots :
// la pose est branchée depuis POSE-À-L'ÉCRAN, les trois actions depuis
// ÉCRAN-ACTIONS, et aucun bouton n'est désactivé (un test l'interdit même).
// Un commentaire qui décrit un fichier qu'on a cessé d'écrire est pire qu'un
// commentaire absent : on le croit.
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
// ⚠ `ZOOM_CARTE` DANS L'ÉCRAN DE LA BASE : c'est voulu. Le sol de la base est
// découpé dans l'atlas du MONDE depuis le 30/08, et c'est la géométrie de cet
// atlas-là — côté d'une tuile, tuiles par case — qui dit comment le découper.
// La recopier ici en ferait une seconde vérité.
import { GEOGRAPHIE, ZOOM_CARTE } from '../data/sites.js';
import {
  BASE_BATIMENTS, COUT_NIVEAU_DEUX, coutDeMontee, debitVoisinParHeure,
  emplacementsDuNiveau, remboursementDuNiveau,
  ORDRE_PALETTE,
} from '../data/base.js';
import { RESSOURCES, capacitesMilli, debitsMilliParHeure } from '../sim/economie-base.js';
import { majorationsDeProduction } from '../sim/poi.js';
import {
  debitDuBatiment, productionParRessource, voisinsQualifiants, voisinsQualifiantsParCase,
} from '../sim/disposition.js';
import {
  niveauDesBatiments, niveauDeLaDefense, niveauDeLArmee,
} from '../sim/niveau-de-base.js';
// ⚠ LE BUDGET N'EST PAS RECALCULÉ ICI. Sa formule vit dans les deux ÉDITEURS,
// qui font foi dessus depuis le lot 5 ; l'écran la LIT au lieu d'en écrire une
// troisième. Les deux fonctions portent le même nom court dans deux modules —
// d'où le renommage à l'import, comme pour `poser`.
import { budgetDuNiveau as budgetOffense, messageSansBatiment } from './arsenal.js';
import { budgetDuNiveau as budgetDefense } from './defense.js';
import { ligneEcranDeLaRangee, ligneEcranDeLaBande } from '../render/orientation.js';
import {
  BANDES, BANDES_NAVIGABLES, basculeDeBande, bornesDeDefilement, bandeDeLaRangee,
} from '../render/bandes.js';
import { COTE_SPRITE } from '../data/atlas.js';
import { existeDansAtlas, fondDuSprite, fondDeCellule } from '../render/sprite.js';
import { nomDeVariante, variante } from '../render/variante.js';
import { couchesDeLEntite, genreDeLaGarnison } from '../render/scene.js';
// ⚠ `poser` EST IMPORTÉ SOUS UN AUTRE NOM, ET C'EST DÉLIBÉRÉ. `src/ui/` porte
// DEUX fonctions `poser` sans rapport : celle-ci, qui pose un bâtiment dans la
// base, et celle d'`ui/arsenal.js`, qui pose une unité dans une vague — que
// `ui/banc.js` entoure légitimement d'un `try`, son contrat étant de lever sur
// un dépassement de budget, qui est un fait de JEU. Le dépôt s'est déjà fait
// mordre par un nom court homonyme (`combat.js`, table et moteur) ; ici le
// renommage à l'import coûte un mot et rend le garde-fou EXACT.
import {
  problemesDeLaPose, poser as poserBatiment,
  problemesDeLAmelioration, ameliorer,
  problemesDeLaDemolition, demolir,
  problemesDuDeplacement, deplacer,
  pointsEngages, niveauDeCommandement, batimentDeProductionManquant,
  poserEffectif, retirerEffectif, deplacerEffectif,
  problemesDeLaPoseDEffectif, problemesDuDeplacementDEffectif,
  problemesDeLAmeliorationDEffectif, ameliorerEffectif,
  basculerVersLaBase, FORCES,
} from '../sim/state.js';
// ⚠ LA RÉPARATION DES BÂTIMENTS VIENT DE `sim/reparation.js`, ET C'EST LÀ QUE
// LE LOT RÉSERVE-BASE L'A ÉCRITE — pas dans `sim/state.js`. La garde qui
// surveillait cette dette a passé une journée verte pour avoir regardé le mauvais
// module ; l'import, lui, ne peut pas se tromper d'adresse.
import {
  problemesDeLaReparationDUnBatiment, reparerUnBatiment,
  coutDeLaReparationDUnBatiment, devisDeLaReparationDesBatiments,
  problemesDeToutReparerLesBatiments, toutReparerLesBatiments,
  plafondDeLaReserveDesBatiments, direLaDuree,
} from '../sim/reparation.js';
import { acquisesDe } from '../sim/recherche.js';
import { DEFENSES, UNITES, COLONNES_DEGATS } from '../data/combat.js';
import { facteurMilli } from '../sim/combat.js';
import { rosterDefensif } from '../data/couts-militaires.js';
import { baseCourante } from '../sim/base-courante.js';

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

/**
 * Combien de temps un message d'action reste à l'écran.
 *
 * ⚠ C'EST UN TOAST, PAS UN BANDEAU PERMANENT, et la distinction porte. Un refus
 * d'action répond à un geste précis : il a un sens tant que le joueur se
 * souvient de ce qu'il vient de toucher, et il devient du bruit ensuite. Les
 * messages de la SESSION — sauvegarde impossible, sauvegarde illisible — sont
 * l'inverse : ils décrivent un état qui dure, et ils ne s'effacent pas tout
 * seuls. Les deux passent par le même élément, et c'est `avis` qui l'emporte.
 */
export const DUREE_TOAST_MS = 4000;

/**
 * Les trois actions du bandeau contextuel, et ce que chacune sait faire.
 *
 * ⚠ LE MODÈLE EST « ARMER PUIS TOUCHER », arbitré le 27/08 — l'inverse de ce
 * qui existait. On ne sélectionne plus un bâtiment pour activer les boutons :
 * on arme un bouton, puis on touche le bâtiment. Un seul mode à la fois, et le
 * mode se désarme dès qu'il a servi, réussi ou non.
 *
 * `problemes` rend la liste du moteur ; `agir` exécute. Les deux viennent de
 * `sim/state.js` ou de `sim/reparation.js` et ne sont JAMAIS réécrites ici.
 *
 * ⚠⚠ LES QUATRE ONT UN MOTEUR DEPUIS LE LOT RÉPARER-ÉCRAN, 05/09, ET LE
 * COMMENTAIRE QUI DISAIT LE CONTRAIRE EST PARTI AVEC LA PHRASE QU'IL DÉCRIVAIT.
 * Il annonçait que « `reparer` n'a pas d'équivalent moteur » : c'était vrai
 * jusqu'au lot RÉSERVE-BASE, qui a écrit les cinq fonctions, et faux depuis. Un
 * commentaire qui décrit un manque comblé envoie chercher un travail déjà fait.
 */
export const ACTIONS = {
  reparer: {
    bouton: 'chantier-reparer',
    libelle: 'Réparer',
    // ⚠ LE GESTE EST DÉCLARÉ DANS `src/son/cablage.js`, PAS INVENTÉ ICI. C'est
    // la même frontière que les trois voisines : l'écran nomme ce que le joueur
    // vient de faire, le câblage décide si ça fait du bruit et lequel.
    geste: 'reparation',
    problemes: problemesDeLaReparationDUnBatiment,
    agir: reparerUnBatiment,
  },
  ameliorer: {
    bouton: 'chantier-ameliorer',
    libelle: 'Améliorer',
    // ⚠⚠ LE GESTE EST DANS LA TABLE, PAS DEVINÉ DU NOM DE L'ACTION. C'est le
    // même motif que `cible` et `retireLaPiece`, et pour la même raison : deux
    // gardes de `chantier.test.js` refusent qu'un écran reconnaisse « demolir »
    // ou « deplacer » à son nom, et le son serait le troisième cas particulier
    // écrit à la main. L'écran nomme un GESTE, `src/son/cablage.js` décide s'il
    // fait du bruit et lequel.
    geste: 'amelioration',
    problemes: problemesDeLAmelioration,
    agir: ameliorer,
  },
  // ⚠ DÉPLACER SE FAIT EN DEUX TOUCHERS, PAS UN — d'où `cible: true`. Les trois
  // autres actions s'appliquent au bâtiment qu'on touche ; celle-ci a besoin
  // d'un bâtiment PUIS d'une destination. La table le dit, plutôt que l'écran
  // ne traite « déplacer » comme un cas particulier écrit à la main.
  deplacer: {
    bouton: 'chantier-deplacer',
    libelle: 'Déplacer',
    cible: true,
    geste: 'deplacement',
    problemes: problemesDuDeplacement,
    agir: deplacer,
  },
  demolir: {
    // ⚠ C'EST LA TABLE QUI DIT QU'UNE ACTION FAIT DISPARAÎTRE SA CIBLE, pas un
    // nom écrit à la main. `executerAction` lâchait la sélection sur
    // `nom === 'demolir'` : le cas particulier a tenu tant qu'il était seul, et
    // l'écran Offense en a écrit un second le jour où « Retirer » est arrivé.
    // Même motif que `cible`, qui dit déjà « cette action demande deux touchers ».
    retireLaPiece: true,
    bouton: 'chantier-demolir',
    libelle: 'Démolir',
    geste: 'retrait',
    problemes: problemesDeLaDemolition,
    agir: demolir,
  },
};

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
/**
 * Ce qu'un obstacle ralentit, en une lettre et en toutes lettres.
 *
 * ⚠ LES CLÉS SONT CELLES DE `OBSTACLES.types`, ET UN TEST L'ASSERTE dans les
 * deux sens. Un type ajouté à la table de combat sans sigle ici dessinerait
 * « undefined » dans la case, et personne ne le verrait avant l'appareil.
 *
 * ⚠ ET LE SIGLE DIT CE QUI EST RALENTI, PAS CE QU'EST L'OBSTACLE. Le joueur n'a
 * rien à faire de savoir si c'est un rocher ou une carcasse : ce qu'il décide
 * avec, c'est par où faire passer son assaut.
 */
export const SIGLES_OBSTACLE = {
  infanterie: 'I',
  vehicule: 'V',
  les_deux: 'X',
};


export const LIBELLES_OBSTACLE = {
  infanterie: 'ralentit l\'infanterie',
  vehicule: 'ralentit les véhicules',
  les_deux: 'ralentit tout ce qui roule et tout ce qui marche',
};

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
 * Le sigle de trois lettres porté par le jeton d'une pièce de garnison.
 *
 * ⚠ MÊME RAISON QUE POUR LES BÂTIMENTS, ET MÊME PIÈGE. « Mur de défense » et
 * « Mirador » donneraient tous deux « MIR » ou « MUR » selon la troncature, et
 * deux pièces qui portent le même sigle sur la grille sont deux pièces qu'on
 * confond à l'œil. La table est donc écrite à la main, et un test asserte
 * qu'elle couvre exactement le roster défensif et que les dix-sept sigles sont
 * distincts — de ceux des bâtiments compris, les deux se dessinant sur la même
 * grille, l'un au-dessus de l'autre.
 *
 * ⚠ CE N'EST PAS UNE VALEUR DE CALIBRAGE. Le nom qui fait foi reste
 * `nom.joueur` de `data/combat.js`, et c'est lui qui s'affiche en toutes
 * lettres dans le bandeau contextuel.
 */
export const SIGLES_DEFENSE = {
  merlon: 'MUR',
  ronce: 'BAR',
  herse: 'HER',
  casemate: 'MIT',
  creneau: 'CAC',
  batterie: 'DCA',
  faucheuse: 'MIR',
  mortier: 'ART',
  harpon: 'SAM',
  meute: 'FUS',
  guetteur: 'VOL',
  perceurs: 'GRE',
  carapace: 'CUI',
  ratisseur: 'ECL',
  // ⚠ « CHS » ET NON « CHA » : le Chantier de construction porte déjà « CHA »,
  // et les deux jetons se dessinent sur la même grille.
  fendeur: 'CHS',
  belier: 'PIO',
  broyeur: 'PER',
};

/**
 * Le nom joueur d'une pièce de garnison, quelle que soit la table d'où elle
 * vient. Les ouvrages sont dans `DEFENSES`, les unités dans `UNITES`, et les
 * deux portent la même forme `nom.joueur`.
 *
 * ⚠ `nom.joueur`, JAMAIS `nom.ouvrage` — le joueur emploie le vocabulaire d'une
 * armée régulière, l'Ouvrage celui des outils et des bêtes. Les mélanger dans
 * une chaîne affichée est interdit (CLAUDE.md §4).
 *
 * @param {string} id
 * @returns {string}
 */
export function nomDeLaPieceDeDefense(id) {
  const ligne = DEFENSES[id] ?? UNITES[id];
  if (ligne === undefined) throw new Error(`chantier : « ${id} » n'a pas de rôle en défense`);
  return ligne.nom.joueur;
}

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
 * Ce que chaque famille visuelle veut dire, en toutes lettres.
 *
 * ⚠⚠ ELLE EXISTE PARCE QUE LE LISERÉ EST PARTI DE LA GRILLE (30/08). Les trois
 * cadres de couleur étaient la seule façon de lire la famille d'un bâtiment
 * posé ; Ethan les a fait retirer avec les autres carrés. Une information de jeu
 * ne se supprime pas au passage d'un lot d'esthétique — elle DÉMÉNAGE, ici dans
 * le `title` du jeton, et la palette la peint toujours. C'est la même décision
 * qu'a prise la lettre de l'obstacle le même jour.
 *
 * ⚠ ET LES CLÉS SONT CELLES QUE REND `familleDuBatiment`, PAS UNE SECONDE
 * LISTE : un test les confronte dans les deux sens.
 */
export const LIBELLES_FAMILLE = {
  pivot: 'bâtiment central',
  prod: 'économie',
  mil: 'militaire',
};

// ⚠⚠ LES TROIS BANDES ONT DÉMÉNAGÉ DANS `render/bandes.js` — lot ÉCRAN-RAID,
// 04/09. L'écran de raid cadre une bande à la fois lui aussi ; une seconde
// table ici et là-bas aurait été la deuxième vérité que §4 interdit. Rien de
// la géométrie n'a changé, et il n'y a PAS de ré-export : les appelants —
// `test/chantier.test.js` compris — prennent à la source.

/**
 * Ce qu'affiche la barre de bascule entre bases.
 *
 * ⚠⚠ LE NOMBRE SE COMPTE, IL NE SE LIT PLUS DANS UNE CONSTANTE — lot BASES-1.
 * `NOMBRE_DE_BASES = 1` a disparu avec la coquille qu'il servait : il annonçait
 * lui-même que « le jour où l'état en portera plusieurs, ce nombre se comptera
 * au lieu de se lire ici ». Ce jour est celui-ci. Le laisser aurait fait mentir
 * le libellé au premier `fonderUneBase`.
 *
 * ⚠ LES DEUX FLÈCHES BOUCLENT, ELLES NE BUTENT PAS. Avec deux bases, une flèche
 * grisée sur trois quarts des touchers serait une gêne pour rien ; avec une
 * seule, les deux restent désactivées, ce qui est honnête — ce n'est pas un
 * refus, c'est qu'il n'y a nulle part où aller.
 *
 * @param {object} etat
 * @returns {{libelle: string, precedente: boolean, suivante: boolean}}
 */
export function navigationEntreBases(etat) {
  // ⚠ L'ÉTAT SE VÉRIFIE AVANT D'ÊTRE DÉRÉFÉRENCÉ. `baseCourante(null)` lève un
  // message qui parle de `bases` ; l'appelant, lui, a passé `null`, et c'est ça
  // qu'il faut lui dire. Même leçon que la garde `fondation` de `charger`.
  if (!etat || !Array.isArray(etat.bases)
    || !Array.isArray(baseCourante(etat).disposition)) {
    throw new TypeError('chantier : état de jeu absent ou malformé');
  }
  const combien = etat.bases.length;
  return {
    libelle: `Base ${formaterEntier(etat.baseCourante + 1)} / ${formaterEntier(combien)}`,
    precedente: combien > 1,
    suivante: combien > 1,
  };
}

/**
 * Les trois contextes du compteur, et où chacun va chercher son nombre.
 *
 * ⚠ `chiffre` DIT SI LA GRANDEUR EXISTE, pas si elle vaut zéro. Les trois
 * valent `true` DEPUIS LE 28/08 : l'état porte enfin `garnison` et `armee`,
 * donc les points engagés existent et se comptent. Ils valaient `false` tant
 * qu'il n'y avait rien à compter — ce n'était pas « zéro », c'était
 * « incomptable ». Ce lot fait basculer le champ, il ne le contourne pas.
 *
 * ⚠ `force` DIT DANS QUELLE LISTE COMPTER, `budget` COMMENT LA BORNER. Les
 * deux fonctions de budget viennent des éditeurs, qui font foi : le compteur
 * ne recalcule rien.
 */
export const CONTEXTES = {
  batiments: { libelle: 'Emplac.', chiffre: true, force: null, budget: null },
  defense: { libelle: 'Pts déf.', chiffre: true, force: 'garnison', budget: budgetDefense },
  offense: { libelle: 'Pts off.', chiffre: true, force: 'armee', budget: budgetOffense },
};

/**
 * Ce que le compteur du bandeau des ressources dit, selon ce qu'on regarde.
 *
 * ⚠ ARBITRÉ LE 28/08 : « quand on passe en défense, le nombre d'emplacement
 * change pour celui des points de défense. Idem pour offense. »
 *
 * ⚠ LES TROIS PORTENT UN NOMBRE DEPUIS LE 28/08. Les deux derniers affichaient
 * « — » tant que `sim/state.js` ne connaissait ni garnison ni armée ; il les
 * porte maintenant, et le compteur les compte.
 *
 * ⚠⚠ C'EST LA CAPACITÉ QUI DISPARAÎT QUAND IL N'Y A PAS DE QG, PAS LA VALEUR.
 * Zéro point engagé est un fait vrai et affichable même sans Centre de
 * commandement ; c'est le BUDGET qui n'existe pas, faute de bâtiment d'où le
 * lire. Afficher « 0 / 0 » ferait croire à un budget nul — donc à un plafond
 * atteint — là où il n'y a pas de plafond du tout, seulement rien pour en
 * fixer un. Même distinction que `null` contre zéro dans `niveauDeCommandement`.
 *
 * @param {object} etat
 * @param {'batiments'|'defense'|'offense'} contexte
 * @returns {{libelle: string, valeur: string, capacite: string, sature: boolean}}
 */
export function compteurDeContexte(etat, contexte) {
  const def = CONTEXTES[contexte];
  if (def === undefined) throw new RangeError(`chantier : contexte « ${contexte} » inconnu`);

  if (def.force === null) {
    const { poses, ouverts } = resumeDeLaBase(etat).emplacements;
    return {
      libelle: def.libelle,
      valeur: formaterEntier(poses),
      capacite: `/ ${formaterEntier(ouverts)}`,
      sature: poses >= ouverts,
    };
  }

  const engages = pointsEngages(etat, def.force);
  const niveau = niveauDeCommandement(etat, def.force);
  if (niveau === null) {
    return { libelle: def.libelle, valeur: formaterEntier(engages), capacite: '', sature: false };
  }
  const budget = def.budget(niveau);
  return {
    libelle: def.libelle,
    valeur: formaterEntier(engages),
    capacite: `/ ${formaterEntier(budget)}`,
    sature: engages >= budget,
  };
}

/**
 * Les trois boutons de la barre du bas, dans l'ordre où ils se touchent.
 *
 * ⚠ DEUX FONT DÉFILER, LE TROISIÈME CHANGE D'ÉCRAN, et ils se ressemblent —
 * arbitré le 28/08 : « les boutons base défense offense doivent prendre toutes
 * la place en bas ». Le lot précédent séparait le saut vers l'Offense par un
 * filet, précisément pour qu'il n'ait pas l'air d'une bande ; Ethan a tranché
 * dans l'autre sens. Ce qui dit où l'on est, c'est le contenu de l'écran.
 */
export const BOUTONS_DU_BAS = [
  { cle: 'batiments', nom: 'Base', ecran: 'chantier', bande: 'batiments' },
  { cle: 'defense', nom: 'Défense', ecran: 'chantier', bande: 'defense' },
  { cle: 'offense', nom: 'Offense', ecran: 'offense', bande: null },
];


/**
 * La géométrie du fond peint vient de `render/fond.js`, et elle est IMPORTÉE.
 *
 * ⚠⚠ CE BLOC RÉ-EXPORTAIT `render/contour.js` JUSQU'AU LOT MUR-PEINT. L'anneau
 * de blocs que les deux écrans posaient case par case n'existe plus : le mur est
 * peint dans le fond, donc il n'y a plus de géométrie de mur à partager. Ce qui
 * reste partagé, c'est la PLACE que ce mur occupe — une demi-case — et la boîte
 * qu'elle définit, parce que l'écran de la base et celui du raid doivent poser
 * le même décor au même endroit.
 *
 * ⚠ ET IL N'Y A PLUS DE RÉ-EXPORT. Il existait parce que `tuilesDuContour`
 * avait déménagé d'ici vers `render/`, et que des appelants la demandaient
 * encore à cet écran. Rien n'a jamais demandé le fond à l'écran de la base :
 * les deux écrans le prennent à la source.
 */
import {
  MUR_CASES, LARGEUR_EN_CASES, HAUTEUR_IMAGE_EN_CASES, BANDE_SOUS_LE_MUR,
  fondDeLaBase, VARIABLE_DU_FOND,
} from '../render/fond.js';

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
  // ⚠ LES TROIS LISTES SONT EXIGÉES, PAS SEULEMENT LA PREMIÈRE. Depuis que les
  // niveaux de défense et d'armée sont réels, un état amputé de `garnison`
  // rendrait un `TypeError` venu du fond de `sim/`, loin de l'appelant fautif.
  //
  // ⚠ ET L'ENVELOPPE DE BASES SE VÉRIFIE EN PREMIER — lot BASES-0. Sans elle,
  // `baseCourante` lèverait un message qui parle de `bases` là où l'appelant a
  // passé `null` ou un montage amputé.
  if (!etat || !Array.isArray(etat.bases)) {
    throw new TypeError('chantier : état de jeu absent ou malformé');
  }
  const laBase = baseCourante(etat);
  if (!Array.isArray(laBase.disposition)
      || !Array.isArray(laBase.garnison) || !Array.isArray(laBase.armee)) {
    throw new TypeError('chantier : état de jeu absent ou malformé');
  }
  const capacites = capacitesMilli(laBase.disposition);
  // ⚠ LES MAJORATIONS DE POI PASSENT ICI AUSSI, ET C'EST OBLIGATOIRE. L'écran
  // qui les oublierait afficherait un débit que le moteur ne produit pas — et
  // le joueur lirait l'écart comme un bogue d'économie.
  const debits = debitsMilliParHeure(
    laBase.disposition, laBase.champs, majorationsDeProduction(etat.poisAcquis ?? []),
  );

  const total = {};
  for (const r of RESSOURCES) total[r] = 0;
  for (const parBatiment of debits) {
    for (const r of RESSOURCES) {
      if (parBatiment[r] !== undefined) total[r] += parBatiment[r];
    }
  }

  const chantier = laBase.disposition.find((b) => b.id === 'chantierDeConstruction');
  if (chantier === undefined) {
    // `verifierEtat` refuse déjà une base sans Chantier au chargement ; la garde
    // est ici pour que l'écran nomme la faute au lieu de rendre « NaN / NaN ».
    throw new Error('chantier : la base n\'a pas de Chantier de construction');
  }

  return {
    ressources: RESSOURCES.map((cle) => ({
      cle,
      stockMilli: laBase.economie.ressources[cle],
      capaciteMilli: capacites[cle],
      debitMilli: total[cle],
    })),
    emplacements: {
      poses: laBase.disposition.length,
      ouverts: emplacementsDuNiveau(chantier.niveau),
    },
    // ⚠ LES TROIS NIVEAUX SONT RÉELS DEPUIS LE 28/08. Les deux derniers valaient
    // `null` en dur tant que l'état ne portait ni garnison ni armée ; ils sont
    // maintenant des MOYENNES, calculées par le même module et la même règle
    // que le premier. Ils restent `null` quand rien n'est posé — ce qui est le
    // cas de toute base neuve — et `formaterNiveau` en fait « — ».
    niveaux: {
      batiments: niveauDesBatiments(laBase.disposition),
      defense: niveauDeLaDefense(laBase.garnison),
      assaut: niveauDeLArmee(laBase.armee),
    },
  };
}

/**
 * Ce que le bandeau contextuel dit du bâtiment sélectionné.
 *
 * ⚠⚠ IL DIT L'AVARIE ET SON PRIX DEPUIS LE LOT RÉPARER-ÉCRAN, 05/09, ET C'EST
 * CE QUI REND LE MODE « ARMER PUIS TOUCHER » JOUABLE. Armer Réparer sans savoir
 * quel bâtiment est abîmé, c'est toucher au hasard parmi quarante.
 *
 * ⚠⚠ LES DÉGÂTS SONT UNE PART DES PV MAX, JAMAIS UN ABSOLU — même règle et même
 * avertissement que `degatsSubisMilliemes` d'`apercuDeLaPiece`. `degatsMilli` est
 * en milli-PV et les PV max montent avec le niveau : le MÊME coup encaisse 67
 * milli-PV au niveau 5 et des dizaines de millions au niveau 50. Un nombre nu ne
 * se compare à rien, et surtout pas d'un bâtiment à l'autre.
 *
 * ⚠⚠ ET LE DEVIS VIENT DE `coutDeLaReparationDUnBatiment`, IL NE SE RECALCULE
 * PAS ICI. Le quartz annoncé doit être exactement celui que `reparerUnBatiment`
 * débitera : un arrondi de plus, pris de ce côté-ci, laisserait le joueur passer
 * la garde puis manquer d'une unité — c'est le §7.3 du lot RÉSERVE-BASE, vu
 * depuis l'écran. Le moteur arrondit avec `Math.round` ; on lui demande.
 *
 * @param {object} etat
 * @param {number} index indice dans la disposition
 */
export function detailDuBatiment(etat, index) {
  const laBase = baseCourante(etat);
  const b = laBase.disposition[index];
  if (b === undefined) throw new RangeError(`chantier : indice ${index} hors de la disposition`);
  const def = BASE_BATIMENTS[b.id];
  const production = productionParRessource(laBase.disposition, laBase.champs, index);
  const morceaux = [];
  for (const r of RESSOURCES) {
    if (!production[r]) continue;
    morceaux.push(`+${formaterEntier(production[r])} ${LIBELLES_RESSOURCE[r].sigle}`);
  }
  const cout = coutDeLaReparationDUnBatiment(etat, index);
  const degatsSubisMilliemes = cout === null ? 0 : Math.round(cout.part * 1000);
  // ⚠ LE PRIX EST CELUI QUE LE MOTEUR FACTURERA — `Math.round`, comme
  // `reparerUnBatiment`. Un `Math.ceil` d'écran annoncerait une unité de trop et
  // ferait chercher un quartz qui ne sert à rien.
  const devis = cout === null ? null
    : { quartz: Math.round(cout.quartz), ticks: cout.ticks };
  // « Niv. 5 · +176 q +352 s /h » — et rien du tout quand le bâtiment ne
  // produit pas, plutôt qu'un « /h » orphelin.
  const lignes = [`Niv. ${b.niveau}`];
  if (morceaux.length > 0) lignes.push(`${morceaux.join(' ')} /h`);
  // ⚠ L'AVARIE PASSE APRÈS LA PRODUCTION, ET ELLE NE S'ÉCRIT QUE SI ELLE EXISTE.
  // « 0 % de dégâts » sur les onze bâtiments d'une base intacte serait onze fois
  // la même absence d'information, dans une ligne qui coupe à l'ellipse.
  if (devis !== null) {
    lignes.push(`${formaterEntier(Math.round(degatsSubisMilliemes / 10))} % de dégâts`);
    lignes.push(`réparer : ${formaterEntier(devis.quartz)} q · ${direLaDuree(devis.ticks)}`);
  }
  return {
    nom: def.nom.joueur,
    niveau: b.niveau,
    degatsSubisMilliemes,
    devis,
    detail: lignes.join(' · '),
  };
}

// ---------------------------------------------------------------------------
// Ce qui s'écrit sur la ligne d'avis — trois registres, une seule ligne
// ---------------------------------------------------------------------------
//
// Le bandeau `#chantier-avis` porte maintenant TROIS sortes de messages, et ils
// ne vivent pas au même rythme :
//
//   `session` — sauvegarde impossible, sauvegarde illisible. Décrit un état qui
//               dure ; ne s'efface jamais tout seul.
//   `toast`   — la réponse à un geste : un refus de pose, un manque de
//               ressources. Vaut quatre secondes, puis disparaît.
//   `mode`    — « vous êtes en mode Démolir ». Décrit ce que le prochain
//               toucher va faire, et vit exactement aussi longtemps que le
//               mode.
//
// ⚠ LES TROIS ÉCRIVAIENT AU MÊME ENDROIT SANS SE CONNAÎTRE, ET C'EST LE DÉFAUT
// QU'ON RÉPARE. Avant ce lot, armer une action n'écrivait RIEN — le mode
// n'existait pas comme message — et `avis('')` posé par `armer()` effaçait au
// passage une alerte de session que personne n'avait lue. Un registre unique
// avec une priorité écrite vaut mieux que trois appelants qui s'écrasent.
//
// ⚠ LE TOAST PASSE DEVANT LE MODE, ET NON L'INVERSE. « il manque 14 de quartz »
// répond au doigt qui vient de se poser ; « mode Améliorer » est un rappel de
// contexte que le joueur peut relire quatre secondes plus tard. Faire gagner le
// mode ferait disparaître le seul message qui explique le refus.

/**
 * Ce que la ligne d'avis doit montrer, et de quel ton, selon les trois
 * registres. Fonction PURE : c'est elle qui porte la règle de priorité, et
 * c'est elle qu'un test peut interroger sans DOM.
 *
 * ⚠⚠ UN TON DE PLUS DEPUIS LE LOT ERGONOMIE, ET C'EST UN TON — PAS UNE TAILLE.
 * Ethan, 04/09 : « Toast quand on n'a plus assez de points d'armement pour
 * construire une unité offensive : en plus gros et rouge. » Cette fonction rend
 * un NOM, la feuille le peint : écrire une taille ici mettrait une décision de
 * style dans un module pur, et c'est justement sa pureté qui le rend testable.
 *
 * ⚠ LE TON DU TOAST EST UN ARGUMENT, PAS UN QUATRIÈME REGISTRE. Un registre
 * `refus` à côté de `toast` aurait donné deux écrivains du même message, donc
 * la possibilité qu'ils se contredisent — le défaut exact que le registre unique
 * a corrigé le 28/08. Un seul toast à la fois, et il porte son ton.
 *
 * @param {{session?: string, toast?: string, tonDuToast?: string, mode?: string}} registres
 * @returns {{texte: string, ton: 'alerte'|'refus'|'mode'|null}}
 */
export function ligneAAfficher({
  session = '', toast = '', tonDuToast = 'alerte', mode = '',
} = {}) {
  if (session !== '') return { texte: session, ton: 'alerte' };
  if (toast !== '') return { texte: toast, ton: tonDuToast };
  if (mode !== '') return { texte: mode, ton: 'mode' };
  return { texte: '', ton: null };
}

/**
 * Ce que dit la ligne de mode pendant qu'une action est armée.
 *
 * ⚠ ELLES REMPLACENT UN TOAST QUI N'EXISTAIT PAS. Armer « Démolir » ne disait
 * rien du tout : le joueur touchait un bouton, l'écran ne bougeait pas, et le
 * bâtiment suivant qu'il touchait disparaissait. Ethan l'a relevé à l'essai du
 * 28/08. Le mot reste tant que le mode dure — c'est la différence avec un
 * toast, et c'est ce qui en fait un mode et non un accident.
 */
export const MESSAGES_MODE = {
  ameliorer: 'Mode AMÉLIORER : touchez le bâtiment à améliorer. Retouchez le bouton pour annuler.',
  demolir: 'Mode DÉMOLIR : touchez le bâtiment à démolir. Retouchez le bouton pour annuler.',
  reparer: 'Mode RÉPARER : touchez le bâtiment à réparer. Retouchez le bouton pour annuler.',
  deplacer: 'Mode DÉPLACER : touchez le bâtiment à déplacer. Retouchez le bouton pour annuler.',
};

/**
 * Ce que dit la ligne de mode quand un bâtiment est « en main », attendant sa
 * destination. C'est le second temps du déplacement.
 * @param {string} nom nom joueur du bâtiment
 * @returns {string}
 */
export function messageDeDestination(nom) {
  return `Déplacement de ${nom} : touchez la case d'arrivée.`
    + ' Retouchez le bouton pour annuler.';
}

/**
 * Ce que dit la ligne de mode quand un bâtiment attend sa CONFIRMATION de pose.
 *
 * ⚠ LA POSE SE FAIT EN DEUX TOUCHERS DEPUIS LE 28/08. Ethan : « il y a d'abord
 * un clic et le bâtiment/sprite transparent, et les flèches bonus proximité
 * s'affichent si il y en a, un deuxième clic pose le bâtiment ». Le premier
 * toucher ne pose donc plus rien — il MONTRE — et c'est ce qui permet de voir
 * le voisinage avant de s'engager.
 *
 * @param {string} nom nom joueur du bâtiment
 * @returns {string}
 */
export function messageDeConfirmation(nom) {
  return `${nom} en aperçu : retouchez la même case pour poser,`
    + ' une autre pour déplacer l\'aperçu.';
}

/**
 * Ce que dit la ligne de mode pendant qu'un bâtiment est choisi à la palette.
 * @param {string} nom nom joueur du bâtiment
 * @returns {string}
 */
export function messageDePose(nom) {
  return `Mode POSE : touchez une case libre pour poser ${nom} (gratuit).`
    + ' Retouchez la vignette pour annuler.';
}

/**
 * Le mot qui accompagne une capacité atteinte.
 *
 * ⚠ IL EST NÉCESSAIRE, ET C'EST MESURÉ. Une base neuve n'a pour tout stockage
 * que la poche du Chantier — 50 unités au niveau 1. Un Collecteur produit
 * 240/h : le stock touche le plafond en cinq minutes, puis ne bouge plus
 * JAMAIS. Ethan a rapporté le 28/08 « aucun bâtiment ne produit de
 * ressources » et « pas de calcul hors ligne » : c'était la même chose vue deux
 * fois, et le seul indice était un chiffre gris de huit pixels.
 */
export const MENTION_SATURE = 'saturé';

// ---------------------------------------------------------------------------
// Le panneau de détail — ce qu'un bâtiment fait, et ce qu'il ferait plus haut
// ---------------------------------------------------------------------------

/**
 * Les huit flèches possibles, indexées par la direction À L'ÉCRAN qui mène du
 * voisin vers le bâtiment.
 *
 * ⚠ DES GLYPHES, PAS UNE ROTATION. Un `transform: rotate()` sur un marqueur
 * dessiné dans une case serait plus court à écrire — et le dépôt refuse déjà
 * les transformations sur la grille, parce qu'elles décrochent le doigt de la
 * case qu'il vise. Huit caractères ne coûtent rien et ne bougent rien.
 */
export const GLYPHES_DE_FLECHE = {
  '-1,0': '↑', '1,0': '↓', '0,-1': '←', '0,1': '→',
  '-1,-1': '↖', '-1,1': '↗', '1,-1': '↙', '1,1': '↘',
};

/**
 * La forme du trait de voisinage, en fractions de CASE.
 *
 * ⚠ EN FRACTIONS DE CASE, JAMAIS EN PIXELS. La grille se règle sur la largeur
 * de l'appareil et sa case va de 30 à 46 px CSS : une épaisseur en pixels
 * serait grosse sur un petit écran et maigre sur un grand. Le trait est dessiné
 * dans un `viewBox` dont l'unité EST la case, donc il suit.
 */
export const TRAIT_VOISINAGE = {
  epaisseur: 0.16,
  longueurPointe: 0.34,
  largeurPointe: 0.34,
};

/**
 * Le trait qui relie le centre d'une case au centre d'une autre.
 *
 * ⚠⚠ ETHAN, LE 29/08 : « les flèches de la base sont bien trop petites. Elle
 * doit partir du centre d'une case à l'autre. Trait épais. » Ce qui existait
 * était un GLYPHE de 11 px posé dans un coin de la case voisine — lisible sur
 * une capture d'écran de bureau, invisible au doigt sur un téléphone. Un trait
 * de centre à centre dit la même chose et se voit.
 *
 * ⚠ LA FONCTION EST PURE ET RAISONNE EN CASES. Elle ne connaît ni pixels, ni
 * canevas, ni SVG : elle rend des coordonnées dans un repère où l'unité est la
 * case et où le centre de la case (colonne, ligne) est en (colonne − ½,
 * ligne − ½). C'est ce qui la rend testable dans un dépôt sans navigateur.
 *
 * ⚠ ET LES COORDONNÉES SONT DES LIGNES D'ÉCRAN, PAS DES RANGÉES. La grille se
 * dessine à l'envers des numéros de rangée ; passer une rangée ici mettrait
 * toutes les flèches à l'envers, ce qui est la faute que ce fichier surveille
 * depuis le lot POSE-ET-DÉPLACEMENT.
 *
 * @param {{ligne: number, colonne: number}} depart le VOISIN, qui apporte
 * @param {{ligne: number, colonne: number}} arrivee le bâtiment, qui reçoit
 * @param {{epaisseur: number, longueurPointe: number, largeurPointe: number}} [forme]
 * @returns {{ligne: {x1: number, y1: number, x2: number, y2: number},
 *   pointe: Array<[number, number]>, epaisseur: number}}
 */
export function traitDeVoisinage(depart, arrivee, forme = TRAIT_VOISINAGE) {
  const x1 = depart.colonne - 0.5;
  const y1 = depart.ligne - 0.5;
  const xArrivee = arrivee.colonne - 0.5;
  const yArrivee = arrivee.ligne - 0.5;
  const dx = xArrivee - x1;
  const dy = yArrivee - y1;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) {
    throw new RangeError('chantier : trait de voisinage entre une case et elle-même');
  }
  const ux = dx / distance;
  const uy = dy / distance;
  // La base de la pointe : le fût s'arrête là, la pointe prend le relais. Le
  // bout rond du fût déborde d'une demi-épaisseur (0,08) — moins que la
  // longueur de la pointe, donc il reste caché dessous.
  const xBase = xArrivee - ux * forme.longueurPointe;
  const yBase = yArrivee - uy * forme.longueurPointe;
  const px = -uy * (forme.largeurPointe / 2);
  const py = ux * (forme.largeurPointe / 2);
  return {
    ligne: { x1, y1, x2: xBase, y2: yBase },
    pointe: [
      [xArrivee, yArrivee],
      [xBase + px, yBase + py],
      [xBase - px, yBase - py],
    ],
    epaisseur: forme.epaisseur,
  };
}

/**
 * Où poser une flèche de bonus de proximité, et laquelle.
 *
 * ⚠ ETHAN, LE 28/08 : « les flèches bonus proximité s'affichent si il y en a ».
 * Elles se posent sur les cases VOISINES et pointent vers le bâtiment : c'est
 * ce qui rend le voisinage visible au lieu d'être un nombre dans un panneau.
 *
 * ⚠ LA GÉOMÉTRIE PASSE PAR `render/orientation.js`, ET IL FAUT SAVOIR CE QUE
 * ÇA PROTÈGE — ET CE QUE ÇA NE PROTÈGE PAS. La grille se dessine À L'ENVERS des
 * numéros de rangée : la rangée 18 est la première LIGNE d'écran, donc un
 * voisin de rangée supérieure est PLUS HAUT et la flèche qui le relie au
 * bâtiment pointe vers le BAS.
 *
 * ⚠ MESURÉ, ET LE COMMENTAIRE PRÉCÉDENT DE CE BLOC ÉTAIT FAUX : avec la
 * transformation actuelle — `ligne = longueur + 1 − rangee` — passer par
 * `ligneEcranDeLaRangee` donne EXACTEMENT le même signe que `voisin.rangee −
 * b.rangee`, puisque le +19 se simplifie. Écrire l'un ou l'autre ne change rien
 * aujourd'hui. Ce qu'on gagne à passer par `orientation.js` n'est donc pas une
 * correction, c'est de rester juste le jour où la transformation cesserait
 * d'être affine — et de dire à la relecture qu'on raisonne en LIGNES D'ÉCRAN,
 * pas en rangées. La faute qui se commet vraiment ici est l'INVERSION du signe,
 * et c'est elle que le test attrape.
 *
 * ⚠ LE VOISINAGE VIENT DU MOTEUR, pas d'un second parcours du 3 × 3.
 * `voisinsQualifiantsParCase` est la même règle que celle qui calcule le débit.
 *
 * @param {Array<object>} disposition
 * @param {object} champs
 * @param {number} index
 * @returns {Array<{rangee: number, colonne: number, glyphe: string, libelle: string, apportMilli: number}>}
 */
export function flechesDeVoisinage(disposition, champs, index) {
  const b = disposition[index];
  if (b === undefined) throw new RangeError(`chantier : indice ${index} hors de la disposition`);
  const ligneDuBatiment = ligneEcranDeLaRangee(b.rangee);
  return voisinsQualifiantsParCase(disposition, champs, index).map((voisin) => {
    // La direction qui mène du VOISIN vers le bâtiment, en lignes d'écran.
    const dLigne = Math.sign(ligneDuBatiment - ligneEcranDeLaRangee(voisin.rangee));
    const dColonne = Math.sign(b.colonne - voisin.colonne);
    const glyphe = GLYPHES_DE_FLECHE[`${dLigne},${dColonne}`];
    if (glyphe === undefined) {
      throw new Error(`chantier : direction (${dLigne},${dColonne}) sans flèche`);
    }
    return {
      rangee: voisin.rangee,
      colonne: voisin.colonne,
      glyphe,
      // ⚠ LE DÉPART ET L'ARRIVÉE SONT EN LIGNES D'ÉCRAN, comme le glyphe. Les
      // deux disent la même direction, et un test l'asserte : le glyphe est le
      // LIBELLÉ de la flèche — il vit dans l'infobulle — et le couple
      // départ/arrivée est son DESSIN. Les faire diverger serait montrer un
      // trait dans un sens et l'annoncer dans l'autre.
      depart: { ligne: ligneEcranDeLaRangee(voisin.rangee), colonne: voisin.colonne },
      arrivee: { ligne: ligneDuBatiment, colonne: b.colonne },
      libelle: libelleDuVoisin(voisin.type),
      apportMilli: voisin.apportParHeure * 1000,
    };
  });
}

/**
 * Combien de temps avant que l'amélioration soit payable, et sinon pourquoi
 * jamais.
 *
 * ⚠ ETHAN, LE 28/08 : « quand l'amélioration n'est pas possible, indiquer un
 * chronomètre. Si le stock requis est sous le seuil du stockage maximum. » La
 * seconde phrase est la condition, et elle est essentielle : un coût plus grand
 * que la capacité de la base n'arrivera JAMAIS, quel que soit le temps qu'on
 * attende, et afficher un compte à rebours dessus serait mentir au joueur.
 *
 * Trois réponses possibles, et `null` en est une :
 *   `null`                 — payable tout de suite, ou déjà au plafond ;
 *   `{ cause: 'attente' }` — ça arrive, et `secondes` dit quand ;
 *   `{ cause: 'capacite' }`— le stockage ne peut pas contenir la somme requise ;
 *   `{ cause: 'sans-production' }` — rien ne produit cette ressource.
 *
 * ⚠ LE DÉLAI EST LE MAXIMUM SUR LES RESSOURCES, PAS LEUR SOMME. Les trois
 * montent en parallèle : ce qui décide, c'est la dernière à arriver.
 *
 * ⚠ ET IL SE CALCULE SUR LE DÉBIT DE LA BASE, PAS DE CE BÂTIMENT. C'est toute
 * la base qui paie l'amélioration.
 *
 * @param {object} etat
 * @param {number} index
 * @returns {{cause: string, ressource: string|null, secondes: number|null}|null}
 */
export function delaiAvantAmelioration(etat, index) {
  const laBase = baseCourante(etat);
  const b = laBase.disposition[index];
  if (b === undefined) throw new RangeError(`chantier : indice ${index} hors de la disposition`);
  const vise = b.niveau + 1;
  if (vise > GEOGRAPHIE.niveauPlafond) return null;

  const cout = coutDeMontee(b.id, vise);
  const capacites = capacitesMilli(laBase.disposition);
  // ⚠ LES MAJORATIONS DE POI PASSENT ICI AUSSI, ET C'EST OBLIGATOIRE. L'écran
  // qui les oublierait afficherait un débit que le moteur ne produit pas — et
  // le joueur lirait l'écart comme un bogue d'économie.
  const debits = debitsMilliParHeure(
    laBase.disposition, laBase.champs, majorationsDeProduction(etat.poisAcquis ?? []),
  );
  const parRessource = {};
  for (const r of RESSOURCES) parRessource[r] = 0;
  for (const parBatiment of debits) {
    for (const r of RESSOURCES) {
      if (parBatiment[r] !== undefined) parRessource[r] += parBatiment[r];
    }
  }

  let secondes = 0;
  for (const r of RESSOURCES) {
    const requisMilli = cout[r] * 1000;
    if (requisMilli === 0) continue;
    const manque = requisMilli - laBase.economie.ressources[r];
    if (manque <= 0) continue;
    // La condition d'Ethan : au-delà de la capacité, aucune attente ne suffit.
    if (requisMilli > capacites[r]) return { cause: 'capacite', ressource: r, secondes: null };
    if (parRessource[r] <= 0) return { cause: 'sans-production', ressource: r, secondes: null };
    // Le débit est PAR HEURE ; on ne quitte les entiers qu'ici, au dernier
    // moment, et on arrondit vers le HAUT — annoncer une seconde de moins que
    // la vérité ferait cliquer le joueur sur un refus.
    secondes = Math.max(secondes, Math.ceil((manque * 3600) / parRessource[r]));
  }
  return secondes === 0 ? null : { cause: 'attente', ressource: null, secondes };
}

/**
 * Un délai en secondes → « 3 min 12 s », « 2 h 05 », « 4 j 06 h ».
 *
 * ⚠ LA GRANDE UNITÉ D'ABORD, ET UNE SEULE DÉCIMALE DE PRÉCISION. « 7 412 s »
 * est exact et illisible ; ce qu'un joueur lit, c'est un ordre de grandeur et
 * le chiffre qui bouge.
 *
 * @param {number} secondes entier positif
 * @returns {string}
 */
export function formaterDelai(secondes) {
  if (!Number.isFinite(secondes) || secondes < 0) {
    throw new RangeError(`formaterDelai : « ${secondes} » n'est pas une durée`);
  }
  const s = Math.ceil(secondes);
  if (s < 60) return `${s} s`;
  const deuxChiffres = (n) => String(n).padStart(2, '0');
  if (s < 3600) return `${Math.floor(s / 60)} min ${deuxChiffres(s % 60)} s`;
  if (s < 86_400) return `${Math.floor(s / 3600)} h ${deuxChiffres(Math.floor((s % 3600) / 60))}`;
  return `${Math.floor(s / 86_400)} j ${deuxChiffres(Math.floor((s % 86_400) / 3600))} h`;
}

/**
 * Le nom lisible d'un type de voisin qualifiant.
 *
 * Les clés de `parVoisin` sont soit un identifiant de bâtiment, soit
 * `champDe<Ressource>`. Aucune des deux ne s'affiche telle quelle.
 *
 * @param {string} type
 * @returns {string}
 */
export function libelleDuVoisin(type) {
  if (type.startsWith('champDe')) {
    const ressource = type.slice('champDe'.length).toLowerCase();
    const libelle = LIBELLES_RESSOURCE[ressource];
    return `champ de ${libelle === undefined ? ressource : libelle.nom.toLowerCase()}`;
  }
  const def = BASE_BATIMENTS[type];
  if (def === undefined) throw new Error(`chantier : voisin « ${type} » inconnu`);
  return def.nom.joueur;
}

/**
 * Tout ce que le panneau de détail dit d'un bâtiment : ce qu'il produit
 * aujourd'hui, ce qu'il produirait un niveau plus haut, ce que ça coûte et ce
 * qu'une démolition rendrait.
 *
 * ⚠ LE « SI J'AMÉLIORAIS » SE CALCULE AVEC LES MÊMES FONCTIONS QUE LE
 * « AUJOURD'HUI », et c'est la règle qui tient tout ce module. On fabrique la
 * disposition CANDIDATE — la même liste, ce bâtiment monté d'un niveau — et on
 * la soumet à `debitDuBatiment` et à `capacitesMilli`. Écrire ici une formule
 * de projection (« ×1,25 par niveau ») créerait une SECONDE lecture des règles,
 * qui divergerait de `sim/disposition.js` au premier arbitrage — et qui aurait
 * déjà tort aujourd'hui, puisque le voisinage et la poche du Chantier ne
 * suivent pas la même pente.
 *
 * ⚠ LA CAPACITÉ ANNONCÉE EST CELLE DE LA BASE, PAS CELLE DU BÂTIMENT. C'est
 * elle qui décide si un stock monte encore, et c'est elle que le joueur doit
 * pouvoir comparer au « / 50 » du bandeau du haut. Une capacité propre au
 * bâtiment se lirait comme un second plafond, alors qu'il n'y en a qu'un.
 *
 * ⚠ AU PLAFOND, TOUT LE VOLET « APRÈS » VAUT `null`. `coutDeMontee` LÈVE
 * au-delà de `niveauPlafond` et `capaciteDuNiveau` aussi : rendre des zéros
 * ferait afficher « 0 » là où il faut lire « il n'y a pas de niveau suivant ».
 *
 * @param {object} etat
 * @param {number} index indice dans la disposition
 * @returns {{
 *   nom: string, famille: string, niveau: number, niveauVise: number|null,
 *   auPlafond: boolean,
 *   propreMilli: number, propreViseMilli: number|null,
 *   voisins: Array<{type: string, libelle: string, compte: number, apportMilli: number}>,
 *   production: Array<{cle: string, avantMilli: number, apresMilli: number|null}>,
 *   capacites: Array<{cle: string, avantMilli: number, apresMilli: number|null}>,
 *   emplacements: {avant: number, apres: number}|null,
 *   cout: {quartz: number, scorie: number, electricite: number}|null,
 *   problemes: Array<{code: string, message: string}>,
 *   remboursement: {quartz: number, scorie: number, electricite: number},
 *   problemesDemolition: Array<{code: string, message: string}>
 * }}
 */
export function apercuDuBatiment(etat, index) {
  const laBase = baseCourante(etat);
  const b = laBase.disposition[index];
  if (b === undefined) throw new RangeError(`chantier : indice ${index} hors de la disposition`);
  const def = BASE_BATIMENTS[b.id];
  const vise = b.niveau + 1;
  const auPlafond = vise > GEOGRAPHIE.niveauPlafond;

  // La disposition candidate : la même, ce bâtiment monté d'un niveau. Rien
  // d'autre ne bouge — ni sa case, ni ses voisins, ni leurs niveaux.
  const candidate = auPlafond ? null : laBase.disposition.map(
    (autre, i) => (i === index ? { ...autre, niveau: vise } : autre),
  );

  const avant = debitDuBatiment(laBase.disposition, laBase.champs, index);
  const apres = candidate === null
    ? null : debitDuBatiment(candidate, laBase.champs, index);

  const prodAvant = productionParRessource(laBase.disposition, laBase.champs, index);
  const prodApres = candidate === null
    ? null : productionParRessource(candidate, laBase.champs, index);

  // Les comptes de voisins se calculent UNE fois : les relire par type ferait
  // reparcourir les huit cases autant de fois qu'il y a de types.
  const comptes = voisinsQualifiants(laBase.disposition, laBase.champs, index);

  const capsAvant = capacitesMilli(laBase.disposition);
  const capsApres = candidate === null ? null : capacitesMilli(candidate);

  // Seules les ressources que ce bâtiment touche, aujourd'hui ou demain : les
  // trois lignes systématiques rempliraient le panneau de tirets.
  const production = RESSOURCES
    .filter((cle) => (prodAvant[cle] ?? 0) !== 0 || (prodApres?.[cle] ?? 0) !== 0)
    .map((cle) => ({
      cle,
      avantMilli: (prodAvant[cle] ?? 0) * 1000,
      apresMilli: prodApres === null ? null : (prodApres[cle] ?? 0) * 1000,
    }));

  // Les capacités, elles, ne se filtrent que sur ce qui CHANGE ou ce qui n'est
  // pas nul : une capacité qui ne bouge pas d'un niveau n'apprend rien.
  const capacites = RESSOURCES
    .filter((cle) => capsAvant[cle] !== 0 || (capsApres !== null && capsApres[cle] !== capsAvant[cle]))
    .map((cle) => ({
      cle,
      avantMilli: capsAvant[cle],
      apresMilli: capsApres === null ? null : capsApres[cle],
    }));

  return {
    nom: def.nom.joueur,
    famille: familleDuBatiment(b.id),
    niveau: b.niveau,
    niveauVise: auPlafond ? null : vise,
    auPlafond,
    propreMilli: avant.propre * 1000,
    propreViseMilli: apres === null ? null : apres.propre * 1000,
    // ⚠ L'APPORT UNITAIRE S'AFFICHE MÊME À ZÉRO VOISIN, et c'est le seul endroit
    // du jeu qui enseigne le voisinage. « Raffinerie × 0 » ne dit rien ;
    // « Raffinerie × 0, +72/h chacune » dit au joueur ce qu'il gagnerait à en
    // poser une à côté. La valeur vient de `debitVoisinParHeure`, jamais d'une
    // division de l'apport total — qui vaudrait NaN à zéro voisin.
    voisins: Object.entries(avant.parVoisin)
      .map(([type, apportMilli]) => ({
        type,
        libelle: libelleDuVoisin(type),
        compte: comptes[type] ?? 0,
        apportMilli: apportMilli * 1000,
        apportUnitaireMilli: debitVoisinParHeure(b.id, type, b.niveau) * 1000,
      })),
    production,
    capacites,
    // Le Chantier est le seul à ouvrir des emplacements ; pour les dix autres
    // la ligne n'aurait aucun sens et ne s'affiche pas.
    emplacements: def.role === 'central'
      ? {
        avant: emplacementsDuNiveau(b.niveau),
        apres: auPlafond ? null : emplacementsDuNiveau(vise),
      }
      : null,
    cout: auPlafond ? null : coutDeMontee(b.id, vise),
    problemes: problemesDeLAmelioration(etat, index),
    // Le chronomètre demandé le 28/08. `null` quand c'est payable tout de suite.
    delai: delaiAvantAmelioration(etat, index),
    // ⚠ CE QUE REND UNE DÉMOLITION SE DIT AVANT LE GESTE. `data/base.js` le
    // demandait noir sur blanc : « démolir un bâtiment de niveau 1 ne rend
    // rien […] l'écran devra le dire avant le geste, sinon il se lira comme un
    // bug ». C'est ici que ça se dit.
    remboursement: remboursementDuNiveau(b.id, b.niveau),
    problemesDemolition: problemesDeLaDemolition(etat, index),
  };
}

/**
 * Un coût, en clair : « 8 quartz », « 440 quartz · 44 électricité ».
 *
 * ⚠ SEULES LES RESSOURCES NON NULLES SONT NOMMÉES. `coutDeMontee` rend
 * toujours les trois, et deux d'entre elles valent zéro la plupart du temps —
 * « 8 quartz · 0 scorie · 0 électricité » ferait chercher au joueur une
 * dépense qui n'existe pas.
 *
 * ⚠ ET LA RÉPARTITION N'EST PAS INVENTÉE ICI. Le nombre et sa ressource
 * viennent tous les deux de `coutDeMontee`, qui est exactement ce que
 * `ameliorer` débite. C'est ce qui a changé depuis le lot ÉCRAN-ACTIONS, où la
 * vignette ne pouvait annoncer qu'un nombre nu : le panneau lit la table, il ne
 * suppose rien.
 *
 * @param {{quartz: number, scorie: number, electricite: number}} cout en unités
 * @returns {string}
 */
export function formaterCout(cout) {
  const morceaux = RESSOURCES
    .filter((cle) => cout[cle] > 0)
    .map((cle) => `${formaterEntier(cout[cle])} ${LIBELLES_RESSOURCE[cle].nom.toLowerCase()}`);
  return morceaux.length === 0 ? 'rien' : morceaux.join(' · ');
}

/**
 * Le contenu du panneau de détail, entièrement en chaînes prêtes à poser.
 *
 * ⚠ FONCTION PURE, ET C'EST TOUT L'INTÉRÊT. Le dépôt n'a ni jsdom ni
 * navigateur : ce qui est calculé ici est asserté par `test/chantier.test.js`,
 * et il ne reste au câblage DOM qu'à écrire des chaînes dans des éléments. Un
 * panneau dont le contenu se composerait dans la boucle de rendu ne serait
 * vérifiable que sur appareil, donc pas vérifiable.
 *
 * @param {ReturnType<typeof apercuDuBatiment>} apercu
 * @returns {{
 *   titre: string,
 *   sections: Array<{titre: string, lignes: Array<{libelle: string, avant: string, apres: string|null, mineur?: boolean}>}>,
 *   bouton: {libelle: string, note: string}
 * }}
 */
/**
 * Ce qui s'écrit sous le bouton quand l'amélioration est refusée : le manque,
 * puis le chronomètre — ou la raison pour laquelle il n'y en aura pas.
 *
 * ⚠ LE MESSAGE DU MOTEUR EST REPRIS MOT POUR MOT, et le délai s'y AJOUTE. Le
 * reformuler créerait une seconde écriture de la règle ; ne montrer que le
 * délai perdrait le chiffre qui manque, qui est ce que le joueur cherche.
 *
 * @param {ReturnType<typeof apercuDuBatiment>} apercu
 * @returns {string}
 */
export function noteDuRefus(apercu) {
  const manque = apercu.problemes.map((p) => p.message).join(' ; ');
  const delai = apercu.delai;
  if (delai === null) return manque;
  if (delai.cause === 'attente') return `${manque} · dans ${formaterDelai(delai.secondes)}`;
  if (delai.cause === 'capacite') {
    // ⚠ CE CAS-LÀ N'EST PAS UNE ATTENTE, C'EST UN MUR — et c'est exactement la
    // condition qu'Ethan a posée. Le joueur doit agrandir son stockage, pas
    // patienter : un compte à rebours ici tournerait sans jamais arriver.
    return `${manque} · le stockage de ${LIBELLES_RESSOURCE[delai.ressource].nom.toLowerCase()}`
      + ' est trop petit pour ce palier';
  }
  return `${manque} · rien n'en produit`;
}

export function lignesDuPanneau(apercu) {
  const sections = [];

  const production = apercu.production.map((r) => ({
    libelle: LIBELLES_RESSOURCE[r.cle].nom,
    avant: formaterDebit(r.avantMilli),
    apres: r.apresMilli === null ? null : formaterDebit(r.apresMilli),
  }));
  // Le détail : ce que le bâtiment fait seul, puis ce que chaque type de voisin
  // lui apporte. C'est la « production détaillée » — sans elle, un collecteur à
  // 312/h ne dit pas pourquoi il ne fait pas 240.
  // ⚠ UNE PRODUCTION PROPRE NULLE NE SE LIGNE PAS. La Raffinerie ne produit
  // rien seule — tout lui vient de ses voisins — et « dont production propre :
  // — » se lisait comme une panne au lieu de se lire comme une règle.
  if (apercu.propreMilli !== 0) {
    production.push({
      libelle: 'dont production propre',
      avant: formaterDebit(apercu.propreMilli),
      apres: apercu.propreViseMilli === null ? null : formaterDebit(apercu.propreViseMilli),
      mineur: true,
    });
  }
  for (const v of apercu.voisins) {
    production.push({
      libelle: `dont ${v.libelle} × ${formaterEntier(v.compte)}`
        + ` (${formaterDebit(v.apportUnitaireMilli)} chacun)`,
      avant: formaterDebit(v.apportMilli),
      apres: null,
      mineur: true,
    });
  }
  if (production.length > 0) sections.push({ titre: 'Production par heure', lignes: production });

  if (apercu.capacites.length > 0) {
    sections.push({
      // ⚠ « DE LA BASE », ET LE MOT COMPTE. Il n'y a qu'un plafond par
      // ressource, celui de la base entière : c'est lui qu'on lit en haut de
      // l'écran, et c'est lui qui décide si un stock monte encore. Annoncer la
      // capacité PROPRE du bâtiment ferait croire à un second plafond.
      titre: 'Stockage de la base',
      lignes: apercu.capacites.map((r) => ({
        libelle: LIBELLES_RESSOURCE[r.cle].nom,
        avant: formaterUnites(r.avantMilli),
        apres: r.apresMilli === null ? null : formaterUnites(r.apresMilli),
      })),
    });
  }

  if (apercu.emplacements !== null) {
    sections.push({
      titre: 'Emplacements ouverts',
      lignes: [{
        libelle: 'Bâtiments posables',
        avant: formaterEntier(apercu.emplacements.avant),
        apres: apercu.emplacements.apres === null
          ? null : formaterEntier(apercu.emplacements.apres),
      }],
    });
  }

  // ⚠ CE QUE REND UNE DÉMOLITION SE DIT AVANT LE GESTE. `data/base.js` le
  // demandait : « démolir un bâtiment de niveau 1 ne rend rien […] l'écran
  // devra le dire avant le geste, sinon il se lira comme un bug ».
  sections.push({
    titre: 'Démolition',
    lignes: [{
      libelle: apercu.problemesDemolition.length > 0
        ? apercu.problemesDemolition.map((p) => p.message).join(' ; ')
        : 'Rend',
      avant: apercu.problemesDemolition.length > 0
        ? '—' : formaterCout(apercu.remboursement),
      apres: null,
    }],
  });

  return {
    titre: `${apercu.nom} · niv. ${formaterEntier(apercu.niveau)}`,
    sections,
    // ⚠ `possible` NE DÉSACTIVE RIEN. Il décide d'une teinte, pas d'un
    // `disabled` : « un indice n'est pas une interdiction » (CLAUDE.md §4), et
    // le refus chiffré du moteur — « il manque 8 de quartz » — en apprend plus
    // au joueur qu'un bouton mort.
    bouton: apercu.auPlafond
      ? { libelle: 'Niveau maximum', note: '', possible: false }
      : {
        libelle: `Améliorer → niv. ${formaterEntier(apercu.niveauVise)}`,
        // Le coût est dans le bouton : c'est ce qu'Ethan a demandé le 28/08 —
        // « un bouton amélioration avec les coûts induits ».
        note: apercu.problemes.length > 0
          ? noteDuRefus(apercu)
          : formaterCout(apercu.cout),
        possible: apercu.problemes.length === 0,
      },
  };
}

/**
 * Le contenu du panneau d'une PIÈCE, à la même forme que celui d'un bâtiment.
 *
 * ⚠⚠ LA MÊME FORME, DONC LE MÊME RENDU. `peindrePanneau` ne connaît qu'une
 * structure — un titre, des sections de lignes, un bouton — et ce sont les
 * TERRAINS qui disent laquelle des deux vues fabriquer. Écrire un second
 * afficheur pour les pièces aurait donné deux DOM voisins dont un seul serait
 * éprouvé, et c'est exactement la faute que ce panneau-ci a déjà évitée en
 * naissant pur.
 *
 * @param {object} apercu ce que rend `apercuDeLaPiece`
 * @returns {object}
 */
export function lignesDeLaPiece(apercu) {
  const sections = [];

  const combat = [{
    libelle: 'Points de vie',
    avant: formaterEntier(apercu.pv),
    apres: apercu.pvVise === null ? null : formaterEntier(apercu.pvVise),
  }];
  for (const d of apercu.degats) {
    combat.push({
      libelle: d.libelle,
      // ⚠ UN ZÉRO SE DIT « — », JAMAIS « 0 ». « 0 par tir » se lit comme un
      // nombre qu'on pourrait faire monter ; le tiret dit qu'il n'y a rien.
      avant: d.avant === 0 ? '—' : formaterEntier(d.avant),
      apres: d.apres === null || d.avant === 0 ? null : formaterEntier(d.apres),
      mineur: true,
    });
  }
  sections.push({ titre: 'Au combat', lignes: combat });

  const fiche = [
    // ⚠ LA VIRGULE, PAS LE POINT : `String(2.5)` rend « 2.5 », qui est de
    // l'anglais. Le dépôt écrit ses décimales en français partout ailleurs.
    { libelle: 'Portée', avant: `${String(apercu.portee).replace('.', ',')} cases`, apres: null },
    { libelle: 'Points engagés', avant: formaterEntier(apercu.points), apres: null },
  ];
  // Une structure ne se déplace pas : la ligne n'aurait rien à dire.
  if (apercu.vitesse !== null) {
    fiche.push({ libelle: 'Vitesse', avant: formaterEntier(apercu.vitesse), apres: null, mineur: true });
  }
  fiche.push({
    libelle: 'État',
    avant: apercu.degatsSubisMilliemes === 0
      ? 'intacte'
      : `${formaterEntier(Math.round(apercu.degatsSubisMilliemes / 10))} % de dégâts`,
    apres: null,
  });
  sections.push({ titre: 'La pièce', lignes: fiche });

  return {
    titre: `${apercu.nom} · niv. ${formaterEntier(apercu.niveau)}`,
    sections,
    // ⚠ `possible` NE DÉSACTIVE RIEN, comme pour les bâtiments : le refus
    // chiffré du moteur en apprend plus au joueur qu'un bouton mort.
    bouton: apercu.auPlafond
      ? {
        libelle: 'Amélioration impossible',
        note: apercu.problemes.map((p) => p.message).join(' ; '),
        possible: false,
      }
      : {
        libelle: `Améliorer → niv. ${formaterEntier(apercu.niveauVise)}`,
        note: apercu.problemes.length > 0
          ? apercu.problemes.map((p) => p.message).join(' ; ')
          : formaterCout(apercu.cout),
        possible: apercu.problemes.length === 0,
      },
  };
}

/**
 * Peint une vue de panneau dans un trio d'éléments — titre, corps, bouton.
 *
 * ⚠⚠ DEUX ÉCRANS L'APPELLENT DEPUIS LE LOT ERGONOMIE, ET C'EST TOUT L'INTÉRÊT.
 * Le Chantier décrit un bâtiment ou une pièce de garnison, l'Offense une unité
 * d'assaut ; les trois vues sortent de fonctions PURES à la même forme, et ce
 * DOM-ci est écrit une fois. L'imiter dans `ui/offense.js` aurait donné deux
 * constructions voisines dont une seule serait relue.
 *
 * ⚠ ELLE NE DÉCIDE DE RIEN : ni quand ouvrir, ni quoi montrer, ni si le bouton
 * est possible. Elle POSE ce qu'on lui donne.
 *
 * @param {Document} doc
 * @param {{titre: Element, corps: Element, bouton: Element}} elements
 * @param {object} vue ce que rend `lignesDuPanneau` ou `lignesDeLaPiece`
 */
export function peindreVueDuPanneau(doc, elements, vue) {
  elements.titre.textContent = vue.titre;
  elements.corps.textContent = '';
  for (const section of vue.sections) {
    const bloc = doc.createElement('div');
    bloc.className = 'section';
    const titre = doc.createElement('h3');
    titre.textContent = section.titre;
    bloc.appendChild(titre);
    for (const l of section.lignes) {
      const ligne = doc.createElement('div');
      ligne.className = l.mineur === true ? 'ligne mineure' : 'ligne';
      const quoi = doc.createElement('span');
      quoi.className = 'quoi';
      quoi.textContent = l.libelle;
      const avant = doc.createElement('b');
      avant.textContent = l.avant;
      ligne.append(quoi, avant);
      if (l.apres !== null) {
        const fleche = doc.createElement('span');
        fleche.className = 'fleche';
        fleche.textContent = '→';
        const apres = doc.createElement('b');
        apres.className = 'apres';
        apres.textContent = l.apres;
        ligne.append(fleche, apres);
      }
      bloc.appendChild(ligne);
    }
    elements.corps.appendChild(bloc);
  }

  elements.bouton.textContent = '';
  const libelle = doc.createElement('span');
  libelle.textContent = vue.bouton.libelle;
  const note = doc.createElement('em');
  note.className = 'note';
  note.textContent = vue.bouton.note;
  elements.bouton.append(libelle, note);
  elements.bouton.classList.toggle('impossible', !vue.bouton.possible);
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
  const laBase = baseCourante(etat);
  const poses = new Set(laBase.disposition.map((b) => b.id));
  // ⚠ L'ORDRE VIENT DE `ORDRE_PALETTE`, PAS DE LA TABLE. Ethan, 03/09 : les
  // quatre bâtiments d'économie d'abord. Trier ici sur un critère deviné —
  // la classe de coût, la famille — donnerait un ordre que personne n'a
  // demandé et qui changerait au premier ajustement d'équilibrage.
  return ORDRE_PALETTE
    .map((id) => [id, BASE_BATIMENTS[id]])
    .map(([id, def]) => ({
      id,
      nom: def.nom.joueur,
      famille: familleDuBatiment(id),
      coutPremiereAmelioration: COUT_NIVEAU_DEUX[def.classeDeCout],
      // ⚠ UN UNIQUE DÉJÀ POSÉ RESTE DANS LA LISTE, GRISÉ — arbitré par Ethan le
      // 28/08 : « quand on pose un bâtiment unique, griser le bouton, pas le
      // faire disparaître ». La palette gardait onze vignettes puis en perdait
      // une à chaque unique posé, si bien qu'elle changeait de longueur et que
      // les autres se déplaçaient sous le doigt. Une vignette grisée dit en
      // plus quelque chose de vrai : ce bâtiment EXISTE et tu l'as déjà.
      dejaPose: def.unique === true && poses.has(id),
    }));
}

/**
 * Ce que le joueur peut poser en garnison, et ce qui l'en empêche.
 *
 * ⚠ LE ROSTER SE LIT, IL NE SE RECOPIE PAS. `rosterDefensif` de
 * `data/couts-militaires.js` dit qui a un rôle en défense — les neuf ouvrages,
 * plus les unités dont `defense.present` vaut `true` — et un test croise déjà
 * cette lecture avec celle de `ui/defense.js`. En écrire une troisième ici
 * ferait diverger la palette du moteur au premier changement de roster.
 *
 * ⚠ UNE PIÈCE VERROUILLÉE RESTE DANS LA PALETTE, GRISÉE — même arbitrage que
 * pour les bâtiments uniques du Chantier, le 28/08 : « griser le bouton, pas le
 * faire disparaître ». C'est la différence avec la palette de l'écran Offense,
 * où le filtrage RETIRE : là-bas la palette est seule sur son écran et
 * s'allonge en début de partie ; ici elle partage la barre du bas avec celle
 * des bâtiments, et une palette qui change de longueur déplace les vignettes
 * sous le doigt entre deux gestes.
 *
 * @param {object} etat
 * @returns {Array<{id, nom, sigle, points, raison, verrouille}>}
 */
export function posablesDeLaDefense(etat) {
  const niveau = niveauDeCommandement(etat, 'garnison');
  const ouvertes = acquisesDe(etat, 'defense');
  return rosterDefensif().map((id) => {
    const ligne = DEFENSES[id] ?? UNITES[id];
    // ⚠ TROIS RAISONS, DANS L'ORDRE OÙ ELLES PRIMENT — les mêmes que la palette
    // de l'Offense depuis le 29/08, et pour la même raison : le joueur lit ce
    // qui le bloque MAINTENANT, pas la liste de tout ce qui le bloquera.
    let raison = null;
    if (niveau === null) raison = 'aucun QG de défense posé';
    // ⚠ LA DEUXIÈME RAISON A CHANGÉ DE NATURE, PAS DE RANG. C'était
    // `apparition > niveau` jusqu'au lot RECHERCHE ; c'est désormais la
    // recherche, et elle seule. L'ordre des trois ne bouge PAS : sans QG il n'y
    // a ni budget ni pièce, et le message doit dire ce qui bloque MAINTENANT.
    //
    // ⚠ ET LA TROISIÈME PRIME TOUJOURS SUR RIEN. L'Épervier est gratuit en
    // offense mais reste verrouillé au démarrage faute d'aérodrome : c'est
    // `batimentDeProductionManquant` qui doit le dire, pas « se débloque par la
    // recherche ». L'ordre le garantit — l'y intervertir mentirait au joueur.
    else if (!ouvertes.includes(id)) raison = 'se débloque par la recherche';
    else {
      // ⚠⚠ LA RÈGLE DU BÂTIMENT DE PRODUCTION VAUT AUSSI EN GARNISON, et c'est
      // une LECTURE de l'arbitrage du 29/08. Ethan a dit « infanterie
      // inconstructible sans caserne, même règle pour véhicule et avion »,
      // sans dire « à l'assaut » : la restreindre à un écran aurait été le
      // choix arbitraire. Les six ouvrages fixes et les trois artilleries ne
      // sont pas dans `UNITES` — ils n'ont pas de châssis, et
      // `batimentDeProductionManquant` rend `null` pour eux : un mur n'a jamais
      // eu besoin d'une caserne.
      const manque = batimentDeProductionManquant(etat, id);
      if (manque !== null) {
        raison = messageSansBatiment(BASE_BATIMENTS[manque].nom.joueur, UNITES[id].chassis);
      }
    }
    return {
      id,
      nom: ligne.nom.joueur,
      sigle: SIGLES_DEFENSE[id],
      points: ligne.points,
      raison,
      verrouille: raison !== null,
    };
  });
}

/**
 * Ce que le bandeau contextuel dit d'une pièce de garnison sélectionnée.
 * @param {object} etat
 * @param {number} index indice dans `etat.garnison`
 */
const LIBELLES_COLONNE_DEGATS = {
  infanterie: 'Contre l\'infanterie',
  vehicule: 'Contre les véhicules',
  structureOuAviation: 'Contre les structures',
};

/**
 * Ce qu'une pièce de garnison ou d'armée est, et ce qu'elle serait un niveau
 * plus haut.
 *
 * ⚠⚠ ETHAN, 04/09 : « Quand on clique sur une unité en défense ou armé,
 * afficher un onglet comme pour les bâtiments. » C'est le pendant exact
 * d'`apercuDuBatiment`, et comme elle cette fonction est PURE : elle rend des
 * données, le rendu les peint. Le dépôt n'a ni jsdom ni navigateur (§3), donc
 * c'est la seule moitié de ce point qui soit éprouvable — et c'est pour ça
 * qu'elle existe séparément.
 *
 * ⚠ LES DEUX FORCES PARTAGENT LA FONCTION, à la ligne de `FORCES` près : c'est
 * elle qui porte le champ, le barème de montée et le rôle. Un `=== 'garnison'`
 * écrit ici serait le premier cas particulier à diverger.
 *
 * ⚠ LES PV SE CALCULENT COMME LE MOTEUR LES CALCULE — `pv × facteurMilli`, ce
 * que `src/sim/combat.js` écrit noir sur blanc : « pvMaxMilli = pv × 1000 ×
 * facteurMilli / 1000 = pv × facteurMilli. Exact. » Réécrire une courbe ici en
 * ferait une seconde, et l'écran mentirait d'un niveau à l'autre.
 *
 * @param {object} etat
 * @param {string} force `garnison` ou `armee`
 * @param {number} index
 * @returns {object}
 */
export function apercuDeLaPiece(etat, force, index) {
  const f = FORCES[force];
  if (f === undefined) throw new RangeError(`chantier : force « ${force} » inconnue`);
  const piece = baseCourante(etat)[f.champ][index];
  if (piece === undefined) {
    throw new RangeError(`chantier : indice ${index} hors de la ${f.quoi}`);
  }
  const ligne = DEFENSES[piece.id] ?? UNITES[piece.id];
  if (ligne === undefined) throw new RangeError(`chantier : pièce « ${piece.id} » inconnue`);

  const problemes = problemesDeLAmeliorationDEffectif(etat, force, index);
  // ⚠ LE PLAFOND SE LIT DANS LE REFUS, IL NE SE RECALCULE PAS. `plafond` et
  // `sans-batiment` sont les deux codes qui rendent la montée impossible pour
  // toujours ; les autres — le prix — passeront quand le stock arrivera.
  const bloque = problemes.some((p) => p.code === 'plafond' || p.code === 'sans-batiment');
  const vise = piece.niveau + 1;
  const echelle = (n) => facteurMilli(n) / 1000;
  const auNiveau = (valeur, n) => Math.round(valeur * echelle(n));

  return {
    nom: ligne.nom.joueur,
    force,
    niveau: piece.niveau,
    niveauVise: bloque ? null : vise,
    auPlafond: bloque,
    points: ligne.points,
    pv: auNiveau(ligne.pv, piece.niveau),
    pvVise: bloque ? null : auNiveau(ligne.pv, vise),
    // ⚠ LES DÉGÂTS SONT PAR COLONNE DE MATRICE, ET LES TROIS SE DISENT MÊME À
    // ZÉRO. « Contre les véhicules : — » est une information de jeu : c'est ce
    // qui apprend au joueur qu'une Batterie ne touche que ce qui vole.
    degats: COLONNES_DEGATS.map((colonne) => ({
      colonne,
      libelle: LIBELLES_COLONNE_DEGATS[colonne],
      avant: auNiveau(ligne.degats?.[colonne] ?? 0, piece.niveau),
      apres: bloque ? null : auNiveau(ligne.degats?.[colonne] ?? 0, vise),
    })),
    portee: ligne.portee,
    // Une structure ne se déplace pas : la ligne n'aurait rien à dire.
    vitesse: ligne.vitesse ?? null,
    // ⚠ LES DÉGÂTS SUBIS SONT UNE PART DES PV MAX, PAS UN ABSOLU. `degatsMilli`
    // est en milli-PV et les PV max montent avec le niveau : un nombre nu ne se
    // compare à rien.
    degatsSubisMilliemes: piece.degatsMilli === 0 ? 0
      : Math.round((1000 * piece.degatsMilli) / (ligne.pv * facteurMilli(piece.niveau))),
    cout: bloque ? null : f.coutDeMontee(piece.id, vise),
    problemes,
  };
}

export function detailDeLaDefense(etat, index) {
  const laBase = baseCourante(etat);
  const piece = laBase.garnison[index];
  if (piece === undefined) throw new RangeError(`chantier : indice ${index} hors de la garnison`);
  const ligne = DEFENSES[piece.id] ?? UNITES[piece.id];
  return {
    nom: ligne.nom.joueur,
    niveau: piece.niveau,
    detail: `Niv. ${piece.niveau} · ${formaterEntier(ligne.points)} pts`,
  };
}

/**
 * Les cases où le bâtiment d'indice donné peut être DÉPLACÉ./**
 * Les cases où le bâtiment d'indice donné peut être DÉPLACÉ.
 *
 * Jumelle de `casesPosables`, et pour les mêmes raisons : on interroge
 * `problemesDuDeplacement` case par case au lieu de réimplémenter les règles.
 * On ne balaie que la bande des bâtiments — ailleurs la réponse serait
 * `hors-base` quatre-vingt-dix fois.
 *
 * ⚠ SA PROPRE CASE EN FAIT PARTIE, et c'est voulu : reposer un bâtiment là où
 * il était est légal, et l'exclure obligerait l'écran à traiter l'annulation
 * comme un cas particulier.
 *
 * @param {object} etat
 * @param {number} index
 * @returns {Array<{rangee: number, colonne: number}>}
 */
export function casesDeplacables(etat, index) {
  const bande = GRILLE.bandes.batiments;
  const cases = [];
  for (let rangee = bande.premiere; rangee <= bande.derniere; rangee++) {
    for (let colonne = 1; colonne <= GRILLE.largeur; colonne++) {
      if (problemesDuDeplacement(etat, index, rangee, colonne).length === 0) {
        cases.push({ rangee, colonne });
      }
    }
  }
  return cases;
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

// ---------------------------------------------------------------------------
// Les deux terrains éditables de la grille — UNE table, pas deux écrans
// ---------------------------------------------------------------------------
//
// ⚠⚠ LA BANDE DÉFENSE EST ÉDITABLE DEPUIS LE 28/08, ET ELLE PARTAGE LE GESTE DU
// CHANTIER. Elle était en lecture seule faute d'état à écrire ; `etat.garnison`
// existe depuis le lot GARNISON-ET-ARMÉE. Ce qui suit est la SEULE différence
// entre les deux bandes : d'où viennent les pièces, quel roster les propose, et
// quelles fonctions du moteur on interroge. Tout le reste — les deux touchers,
// le fantôme, la ligne de mode, le désarmement, le repeint — est écrit une fois
// et lit cette table.
//
// ⚠ C'EST EXACTEMENT CE QUE LE BRIEF INTERDIT DE RECOPIER. Une seconde
// implémentation du geste de pose, écrite pour la défense, aurait divergé de la
// première au premier ajustement — et les deux vivent dans le même écran, sous
// le même doigt. Un test refuse qu'elle apparaisse.
//
// ⚠ LA BANDE « DÉPLOIEMENT » N'EN EST PAS. Les rangées 1–2 sont l'endroit où
// les vagues PARAISSENT pendant un combat, pas celui où on les compose — c'est
// la faute du bouton « Assaut » du lot ÉCRAN-CHANTIER, et elle ne se refait pas.
// La composition d'assaut a son écran.

// ⚠ LES DEUX GESTES DE LA GARNISON SONT NOMMÉS UNE FOIS, PUIS RÉFÉRENCÉS DEUX
// FOIS. La table les emploie à deux endroits — le geste direct et l'action
// armée — et les écrire deux fois aurait fait, dans le même objet, deux chemins
// vers la même fonction. C'est petit, et c'est exactement la forme que prend une
// divergence quand elle commence.
const deplacerLaGarnison = (etat, index, rangee, colonne) => deplacerEffectif(
  etat, 'garnison', index, { rangee, colonne },
);
const refusDuDeplacementEnGarnison = (etat, index, rangee, colonne) => (
  problemesDuDeplacementDEffectif(etat, 'garnison', index, { rangee, colonne })
);

export const TERRAINS = {
  batiments: {
    bande: GRILLE.bandes.batiments,
    // `null` = les bâtiments de la base, qui ne sont pas une « force ».
    force: null,
    // ⚠ CE QUE LA BANDE PORTE, POUR LE SON. `src/son/cablage.js` en tire
    // l'événement d'un geste : un bâtiment qui tombe est un effondrement, une
    // pièce de garnison retirée n'est rien de ce que le pack sait dire — et on
    // ne détourne pas un son d'effondrement pour lui donner un emploi.
    genreSonore: 'batiment',
    pieces: (etat) => baseCourante(etat).disposition,
    posables: (etat) => posablesDeLaBase(etat).map((p) => ({
      ...p, sigle: SIGLES[p.id], verrouille: p.dejaPose,
    })),
    nomDe: (id) => BASE_BATIMENTS[id].nom.joueur,
    sigleDe: (id) => SIGLES[id],
    // ⚠ LES COUCHES DU JETON, DE LA PLUS HAUTE À LA PLUS BASSE. C'est la SEULE
    // chose qui sépare les deux bandes à la peinture, et elle est dans la table
    // pour la même raison que `panneau` et `cible` : un `=== 'defense'` écrit à
    // la main dans la boucle serait le premier cas particulier à diverger, et un
    // test refuse déjà cette forme-là.
    //
    // ⚠ UNE LISTE, MÊME POUR UNE SEULE COUCHE. Le bâtiment n'en a qu'une ; la
    // défense en a deux — la tourelle et son socle. Rendre tantôt un nom, tantôt
    // une liste obligerait l'appelant à connaître la différence, ce qui est
    // exactement le cas particulier qu'on refuse.
    //
    // ⚠⚠ ET LE NOM SE DEMANDE À `render/scene.js`, IL NE SE DÉRIVE PLUS ICI. Cet
    // écran portait `spriteDuBatiment`, qui écrivait `bat_j_` EN DUR : correct
    // tant que seul le joueur avait des bâtiments dessinés, faux dès que le
    // champ de bataille en dessine ceux de l'Ouvrage. Deux dérivations du même
    // nom, dont une seule connaît le propriétaire, c'est la seconde vérité que
    // ce lot existe pour retirer — la règle camelCase → serpent est montée avec
    // la fonction, elle n'a pas été recopiée.
    spriteDe: (piece) => couchesDeLEntite(
      { genre: 'batiment', id: piece.id, proprietaire: 'joueur', camp: 'defense' },
    ),
    familleDe: familleDuBatiment,
    problemesDeLaPose: (etat, id, rangee, colonne) => problemesDeLaPose(etat, id, rangee, colonne),
    poser: (etat, id, rangee, colonne) => poserBatiment(etat, id, rangee, colonne),
    problemesDuDeplacement: (etat, index, rangee, colonne) => (
      problemesDuDeplacement(etat, index, rangee, colonne)
    ),
    deplacer: (etat, index, rangee, colonne) => deplacer(etat, index, rangee, colonne),
    detail: (etat, index) => detailDuBatiment(etat, index),
    // ⚠ LE TERRAIN DES BÂTIMENTS RÉUTILISE `ACTIONS` TELLE QUELLE, il n'en
    // recopie pas le contenu : c'est la même table, sous un second nom. La
    // dupliquer ferait deux vérités sur ce qu'améliorer veut dire.
    actions: ACTIONS,
    // Le panneau de détail chiffre production, capacité et voisinage : il n'a
    // de sens que pour un bâtiment de la base.
    panneau: true,
    vueDuPanneau: (etat, index) => lignesDuPanneau(apercuDuBatiment(etat, index)),
    // ⚠ COMMENT ON APPELLE CE QU'ON MANIPULE. Le refus d'une action sans moteur
    // le nomme — « pour la défense » — et jusqu'au 29/08 ce mot était écrit en
    // dur, ce qui faisait dire « bâtiment » à la bande de garnison. Le terrain
    // le dit, une fois.
    //
    // ⚠⚠ ET LE CHAMP `quoi` EST PARTI AVEC LA PHRASE QU'IL SERVAIT — lot
    // RÉPARER-ÉCRAN, 05/09. Il portait « aucun bâtiment n'est endommagé », le
    // constat de `messagePasDeReparation`, seul lecteur qu'il ait jamais eu. Ce
    // constat était devenu FAUX le 02/09, `raid-ouvrage.js` écrivant
    // `degatsMilli` depuis le lot RAID-B ; les refus viennent maintenant de
    // `problemesDeLaReparationDUnBatiment`, qui les chiffre. Un champ que plus
    // rien ne lit est un commentaire menteur en puissance.
    pourQui: 'la base',
  },
  defense: {
    bande: GRILLE.bandes.defense,
    force: 'garnison',
    genreSonore: 'garnison',
    pieces: (etat) => baseCourante(etat).garnison,
    posables: posablesDeLaDefense,
    nomDe: nomDeLaPieceDeDefense,
    sigleDe: (id) => SIGLES_DEFENSE[id],
    // ⚠ LA DÉFENSE EST BRANCHÉE DEPUIS LE 30/08, ET LE COMMENTAIRE QUI DISAIT LE
    // CONTRAIRE EST PARTI AVEC LE `null`. Il affirmait que « rien dans l'état ne
    // dit l'orientation d'une pièce posée » et qu'aucune « règle de chaînage »
    // n'existait : `sim/rendu-pose.js` fait les deux depuis, et un commentaire
    // qui décrit un manque comblé envoie chercher un travail déjà fait.
    //
    // ⚠ LA GARNISON ENTIÈRE EST PASSÉE, PAS LA CASE. `liaisonDuMur` et
    // `liaisonDuSocle` regardent les VOISINS pour décider d'un raccord : leur
    // donner la seule pièce les priverait de ce qu'ils viennent chercher.
    // ⚠⚠ LA FONCTION A DÉMÉNAGÉ DANS `render/scene.js` AU LOT
    // STRUCTURES-AU-COMBAT, et cet écran la CONSOMME au lieu de la porter. Elle
    // y vivait seule ; le champ de bataille et l'éditeur Défense dessinaient les
    // mêmes casemates en primitives géométriques. En garder une copie ici serait
    // la seconde vérité que le déplacement existe pour retirer.
    // ⚠⚠ LE GENRE SE DEMANDE, IL NE S'ÉCRIT PAS — corrigé le 30/08. Cette
    // fonction posait `genre: 'defense'` pour les DIX-SEPT pièces posables ; or
    // huit d'entre elles sont des UNITÉS de garnison (`rosterDefensif` les tire
    // de `UNITES`), et `couchesDeLEntite` LEVAIT dessus. Comme la levée part de
    // `peindre`, poser des Fusiliers en garnison laissait l'écran de la base
    // BLANC. Mesuré sur `main` avant ce lot : le défaut est antérieur.
    spriteDe: (piece, etat) => couchesDeLEntite(
      { genre: genreDeLaGarnison(piece.id), id: piece.id, proprietaire: 'joueur',
        camp: 'defense', rangee: piece.rangee, colonne: piece.colonne },
      { voisines: baseCourante(etat).garnison },
    ),
    // ⚠ TOUT EST « mil » EN DÉFENSE, ET C'EST UN CHOIX DE PALETTE. La famille
    // décide de la couleur du liseré, et la fiche de style n'a pas de teinte
    // libre pour distinguer un mur d'une tourelle. Le sigle, lui, les distingue
    // déjà. Ouvrir une teinte serait une décision de style, pas de code.
    familleDe: () => 'mil',
    problemesDeLaPose: (etat, id, rangee, colonne) => problemesDeLaPoseDEffectif(
      etat, 'garnison', { id, rangee, colonne, niveau: 1 },
    ),
    poser: (etat, id, rangee, colonne) => poserEffectif(
      etat, 'garnison', { id, rangee, colonne, niveau: 1 },
    ),
    problemesDuDeplacement: refusDuDeplacementEnGarnison,
    deplacer: deplacerLaGarnison,
    detail: (etat, index) => detailDeLaDefense(etat, index),
    // ⚠ UNE SEULE DES QUATRE ACTIONS N'A PLUS DE MOTEUR EN DÉFENSE, ET ELLE LE
    // DIT. `null` n'est pas un oubli : c'est ce qui fait répondre le bouton au
    // lieu de le rendre inerte — « un indice n'est pas une interdiction »
    // (CLAUDE.md §4).
    //   `reparer`  — ET CE TROU-LÀ NE SE COMBLERA JAMAIS PAR UN BOUTON. Le
    //     commentaire d'hier annonçait qu'il était « le prochain à se
    //     combler » : il se trompait de mécanique, pas de constat.
    //     `MODELE-REPARATION-1.md` §3 dit que le Complexe de défense répare la
    //     garnison GRATUITEMENT, TOUT SEUL, en une heure — et
    //     `reparerLaGarnison` de `sim/raid-ouvrage.js` le fait déjà après
    //     chaque raid. Il n'y a donc rien à brancher : le geste du joueur
    //     n'existe pas dans cette moitié du modèle, et un bouton qui réparerait
    //     à la demande inventerait une seconde règle à côté de celle qui tourne.
    //     Le `null` reste, et il dit « pas de geste ici », plus « pas encore de
    //     moteur ».
    //
    // ⚠⚠ `ameliorer` A PERDU SON `null` LE 03/09, ET LE COMMENTAIRE QUI DISAIT
    // LE CONTRAIRE EST PARTI AVEC LUI. Il affirmait que « rien dans `sim/` ne
    // monte une pièce de garnison d'un niveau » — vrai jusqu'à ce lot — et que
    // « ce que gagne une unité améliorée n'est pas arbitré », ce qui était FAUX
    // et l'avait toujours été : `facteurMilli` de `data/niveaux.js` met PV et
    // dégâts à l'échelle du niveau dans `creerCombat` depuis le premier jour.
    // Un commentaire qui décrit un manque comblé envoie chercher un travail
    // déjà fait ; celui-là envoyait en plus chercher un arbitrage déjà rendu.
    //
    // ⚠ LA GARNISON ET L'ARMÉE PARTAGENT LE MÊME MOTEUR, à la force près : la
    // ligne de `FORCES` porte le barème, si bien qu'aucun des deux écrans n'a
    // de cas particulier à nommer.
    actions: {
      ameliorer: {
        problemes: (etat, index) => problemesDeLAmeliorationDEffectif(etat, 'garnison', index),
        agir: (etat, index) => ameliorerEffectif(etat, 'garnison', index),
      },
      reparer: null,
      demolir: {
        problemes: () => [],
        agir: (etat, index) => retirerEffectif(etat, 'garnison', index),
      },
      deplacer: {
        cible: true, geste: 'deplacement', problemes: refusDuDeplacementEnGarnison,
        agir: deplacerLaGarnison,
      },
    },
    // ⚠⚠ LE PANNEAU S'OUVRE AUSSI EN DÉFENSE — Ethan, 04/09 : « Quand on clique
    // sur une unité en défense ou armé, afficher un onglet comme pour les
    // bâtiments. » Il valait `false` depuis le lot GARNISON-ET-ARMÉE, au motif
    // qu'« une pièce de garnison n'a ni production, ni capacité, ni voisinage,
    // et lui ouvrir un panneau vide ferait croire à un écran cassé ». Le motif
    // était juste et la conclusion trop courte : une pièce a des PV, une table
    // de dégâts, une portée, un état et un prix de montée — de quoi remplir un
    // panneau qui ne ment pas. `lignesDeLaPiece` rend la même FORME de vue, donc
    // le même rendu la peint.
    panneau: true,
    vueDuPanneau: (etat, index) => lignesDeLaPiece(apercuDeLaPiece(etat, 'garnison', index)),

    pourQui: 'la défense',
  },
};

/**
 * Ce qu'une action répond quand le terrain qu'on édite n'a pas de moteur pour
 * elle. Le bouton reste vif et il PARLE — un bouton mort n'apprend rien.
 * @param {string} libelle
 * @returns {string}
 */
export function actionSansMoteur(libelle, quoi) {
  // ⚠ LE « POUR QUOI » EST UN ARGUMENT DEPUIS LE 29/08, PAS UNE CONSTANTE. Il
  // disait « pour la défense », en dur — juste tant que la barre contextuelle
  // n'existait qu'au Chantier. L'écran Offense a la sienne depuis ce lot, et
  // le même message y annonçait à un joueur qui compose son ARMÉE que la
  // DÉFENSE n'a pas de moteur. Vu en essayant l'écran, pas en le relisant.
  if (typeof quoi !== 'string' || quoi.length === 0) {
    throw new Error('chantier : actionSansMoteur veut savoir de quoi elle parle');
  }
  return `${libelle} n'existe pas encore pour ${quoi} :`
    + ' le moteur ne le fait pas, et l\'inventer serait trancher seul.';
}

/**
 * Les cases d'un terrain où cette pièce peut se poser.
 *
 * ⚠ ELLES SE CALCULENT, ELLES NE SE DEVINENT PAS — et c'est la même règle des
 * deux côtés. On interroge le moteur case par case au lieu de réimplémenter les
 * règles ici. On ne balaie QUE la bande du terrain : ailleurs la réponse serait
 * « hors de la bande » quatre-vingt-dix fois.
 *
 * @param {object} etat
 * @param {string} terrain clé de `TERRAINS`
 * @param {string} id
 * @returns {Array<{rangee: number, colonne: number}>}
 */
export function casesPosablesDuTerrain(etat, terrain, id) {
  const { bande, problemesDeLaPose: refus } = TERRAINS[terrain];
  const cases = [];
  for (let rangee = bande.premiere; rangee <= bande.derniere; rangee++) {
    for (let colonne = 1; colonne <= GRILLE.largeur; colonne++) {
      if (refus(etat, id, rangee, colonne).length === 0) cases.push({ rangee, colonne });
    }
  }
  return cases;
}

/**
 * Les cases d'un terrain où la pièce d'indice donné peut être déplacée.
 * Sa propre case en fait partie : rester sur place est légal.
 *
 * @param {object} etat
 * @param {string} terrain clé de `TERRAINS`
 * @param {number} index
 * @returns {Array<{rangee: number, colonne: number}>}
 */
export function casesDeplacablesDuTerrain(etat, terrain, index) {
  const { bande, problemesDuDeplacement: refus } = TERRAINS[terrain];
  const cases = [];
  for (let rangee = bande.premiere; rangee <= bande.derniere; rangee++) {
    for (let colonne = 1; colonne <= GRILLE.largeur; colonne++) {
      if (refus(etat, index, rangee, colonne).length === 0) cases.push({ rangee, colonne });
    }
  }
  return cases;
}

/**
 * Ce qu'on dit au joueur quand une pose est refusée./**
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
 * Une CLASSE par séquence d'atlas, et une seule règle de feuille par classe.
 *
 * ⚠⚠ C'EST LE CORRECTIF DU FREEZE D'ETHAN, ET LA CAUSE EST MESURÉE. Arriver sur
 * l'écran de la base depuis un autre écran coûtait **3,1 SECONDES**, à chaque
 * fois. Profilé dans Chromium : le gestionnaire du clic prend **0,4 ms**, tout
 * le reste est du RENDU. En vidant les fonds des cases, la bascule retombe à
 * 33 ms — donc le coût est le fond, et rien d'autre.
 *
 * ⚠⚠ ET IL EST PAR OCCURRENCE DE `var()`, PAS PAR IMAGE. Mesuré en ne gardant
 * que les n premières couches des 162 cases : **1 couche 533 ms · 2 couches
 * 1 500 ms · 4 couches 3 133 ms** — une droite à 0,78 s la couche. Chromium ne
 * partage pas l'image entre deux substitutions de `var()` : il la DÉCODE une
 * fois par couche et par élément, soit 670 décodages d'un atlas de 1024 × 1024
 * pour un seul affichage de la grille.
 *
 * ⚠⚠ TROIS PISTES ONT ÉTÉ MESURÉES ET ÉCARTÉES avant celle-ci, et il faut le
 * savoir pour ne pas les rouvrir : le sol décoratif de `#chantier-defile` (le
 * retirer entièrement laisse 3,15 s), `image-rendering: pixelated` (le passer à
 * `auto` laisse 3,15 s), et remplacer le `display: none` du masquage d'écran
 * par `visibility: hidden` (1,53 s — la moitié, pour un changement qui touche
 * les sept écrans).
 *
 * ⚠⚠ CE QUI MARCHE : la même liste d'adresses posée UNE FOIS dans une règle de
 * feuille, les éléments ne portant plus qu'une classe. Mesuré **3 170 ms →
 * 33 ms**, à rendu identique. L'image est partagée, donc décodée une fois.
 *
 * ⚠ ET L'ADRESSE SE LIT, ELLE NE S'ÉCRIT PAS. `url(` n'apparaît nulle part dans
 * ce fichier : on demande à la page la valeur que `tools/build.js` a mise dans
 * la variable, exactement comme `garnirLesAtlas` le fait déjà pour le `src`
 * d'une balise. Écrire l'adresse ici l'inlinerait une SECONDE fois — 507 464
 * octets mesurés au lot SPRITES-ET-ZOOM — et la poser en ligne sur chaque
 * élément mettrait le base64 dans 670 attributs `style`, soit ~190 Mio de texte
 * dans le DOM. C'est le seul chemin qui partage sans recopier.
 */
const CLASSES_DE_FOND = new Map();
const FEUILLES_DE_FOND = new WeakMap();

/** La feuille de style où vivent les règles de fond, une par document. */
function feuilleDesFonds(doc) {
  const connue = FEUILLES_DE_FOND.get(doc);
  if (connue !== undefined) return connue;
  const feuille = doc.createElement('style');
  feuille.id = 'fonds-datlas';
  doc.head.append(feuille);
  FEUILLES_DE_FOND.set(doc, feuille);
  return feuille;
}

/**
 * Le nom de la variable CSS derrière un `var(--x)`.
 *
 * ⚠ ELLE LIT `VARIABLE_DATLAS` À L'ENVERS PLUTÔT QUE DE PORTER UNE SECONDE
 * TABLE de noms nus. Deux tables des mêmes atlas divergeraient au premier
 * ajout, et la divergence se lirait comme un sprite manquant.
 *
 * @param {string} appel une valeur de `VARIABLE_DATLAS`
 * @returns {string}
 */
function variableDeLAppel(appel) {
  const ouvre = appel.indexOf('(');
  const ferme = appel.lastIndexOf(')');
  if (!appel.startsWith('var(') || ferme <= ouvre) {
    throw new RangeError(`chantier : « ${appel} » n'est pas un appel de variable`);
  }
  return appel.slice(ouvre + 1, ferme).trim();
}

/**
 * La classe qui porte cette séquence d'atlas, en la créant au besoin.
 *
 * ⚠ LA CLÉ EST LA SÉQUENCE ELLE-MÊME, donc le nombre de classes est celui des
 * FORMES de pile — sol seul, sol et champ, socle et tourelle — et pas celui des
 * cases. Une grille entière n'en demande qu'une poignée.
 *
 * @param {Document} doc
 * @param {string[]} appels valeurs de `VARIABLE_DATLAS`, de la plus HAUTE à la plus basse
 * @returns {string} le nom de la classe
 */
function classeDeFond(doc, appels) {
  const cle = appels.join(', ');
  const connue = CLASSES_DE_FOND.get(cle);
  if (connue !== undefined) return connue;
  const style = doc.defaultView.getComputedStyle(doc.documentElement);
  const adresses = appels.map((appel) => {
    const valeur = style.getPropertyValue(variableDeLAppel(appel)).trim();
    // ⚠ ON LÈVE PLUTÔT QUE DE DESSINER DU VIDE — même règle que `garnirLesAtlas`
    // et qu'`executer` de `render/canvas2d.js` : « une unité invisible est un
    // défaut qu'on doit voir ».
    if (valeur === '') {
      throw new RangeError(`chantier : la variable « ${variableDeLAppel(appel)} » est vide`);
    }
    return valeur;
  });
  const nom = `fond-${CLASSES_DE_FOND.size}`;
  feuilleDesFonds(doc).append(
    doc.createTextNode(`.${nom}{background-image:${adresses.join(',')};}`),
  );
  CLASSES_DE_FOND.set(cle, nom);
  return nom;
}

/**
 * Pose la séquence d'atlas d'un élément, par sa classe.
 *
 * ⚠ LA SÉQUENCE RESTE LISIBLE SUR L'ÉLÉMENT, dans `dataset.fond`. `fondsPoses`
 * relit ce qui a été posé pour empiler une couche de plus, et il le lisait dans
 * `style.backgroundImage`, qui ne porte plus rien. Un nom de classe ne dit pas
 * de quels atlas il est fait ; la séquence, si.
 *
 * @param {HTMLElement} element
 * @param {string[]} appels de la plus HAUTE couche à la plus basse
 */
function poserLesAtlas(element, appels) {
  const doc = element.ownerDocument;
  const nom = classeDeFond(doc, appels);
  const ancienne = element.dataset.classeFond;
  if (ancienne !== undefined && ancienne !== nom) element.classList.remove(ancienne);
  element.classList.add(nom);
  element.dataset.classeFond = nom;
  element.dataset.fond = appels.join(', ');
}

/**
 * Empile des cellules d'atlas en fond d'une case, la première par-dessus.
 *
 * CSS accepte plusieurs couches de fond : `background-image: A, B` dessine A
 * AU-DESSUS de B, et les listes `background-size` et `background-position`
 * suivent le même ordre. C'est ce qui permet de poser un champ sur son sol sans
 * un second élément par case — et donc sans un nœud de plus à créer et à
 * détruire dix fois par seconde.
 *
 * ⚠⚠ CHAQUE COUCHE PORTE SON ATLAS DEPUIS LE 30/08. Cette fonction répétait
 * `var(--atlas-terrain)` autant de fois qu'il y avait de couches, ce qui était
 * juste tant que le sol, les champs et les obstacles venaient tous du même
 * fichier. Le sol vient maintenant de l'atlas du MONDE — quatre cellules par
 * case — pendant que le champ posé dessus vient toujours de celui de la base :
 * une variable unique dessinerait le sol à la place du champ, sans qu'aucune
 * longueur de liste ne soit fausse.
 *
 * @param {HTMLElement} case_
 * @param {{image: string, taille: string, position: string}[]} fonds
 *   de la plus haute à la plus basse
 */
function poserFonds(case_, fonds) {
  poserLesAtlas(case_, fonds.map((f) => f.image));
  case_.style.backgroundSize = fonds.map((f) => f.taille).join(', ');
  case_.style.backgroundPosition = fonds.map((f) => f.position).join(', ');
}

/**
 * La variable CSS qui porte chaque atlas cousu.
 *
 * ⚠ ELLE EST ICI ET PAS DANS LA FEUILLE, parce que c'est le JS qui sait
 * maintenant de quelle famille vient chaque couche. `.jeton.sprite` fixait
 * `background-image: var(--atlas-batiment)` en dur, ce qui marchait tant qu'une
 * seule famille était branchée ; un jeton de garnison en porte DEUX, de deux
 * atlas différents.
 */
const VARIABLE_DATLAS = {
  batiment: 'var(--atlas-batiment)',
  terrain: 'var(--atlas-terrain)',
  defense: 'var(--atlas-defense)',
  socle: 'var(--atlas-socle)',
  unite: 'var(--atlas-unite)',
  chassis: 'var(--atlas-chassis)',
  tourelle_unite: 'var(--atlas-tourelle-unite)',
  // ⚠⚠ `sol` EST PARTI — lot SOL-SATELLITE, 05/09. Il pointait `--atlas-sol`,
  // c'est-à-dire l'atlas indexé du fond de carte, et il ne servait déjà plus à
  // la base depuis le lot MUR-PEINT : la grille tapissée case par case avait
  // laissé place au décor peint. La variable elle-même n'existe plus, l'écran
  // Monde ne passant plus par la feuille pour son sol — la laisser ici aurait
  // fait résoudre une famille sur une variable vide, ce qui ne lève pas et ne
  // dessine rien.
};

/**
 * Empile des couches de sprite en fond d'un élément, la première par-dessus.
 *
 * ⚠ LES TROIS LISTES CSS DOIVENT AVOIR LA MÊME LONGUEUR, ET C'EST ASSERTÉ.
 * `background-image`, `background-size` et `background-position` se lisent en
 * parallèle ; une liste plus courte que les autres SE RÉPÈTE en silence, si bien
 * qu'un socle prendrait le cadrage de la tourelle et dessinerait le mauvais
 * morceau d'atlas. Rien à l'écran ne dirait que c'est une faute de longueur.
 *
 * ⚠⚠ L'ENTRÉE VA DU PLUS BAS AU PLUS HAUT, LA SORTIE CSS L'INVERSE. C'est le
 * piège du lot STRUCTURES-AU-COMBAT : `render/scene.js` rend ses couches dans
 * l'ordre du CANEVAS — on peint du fond vers le dessus, donc la dernière est
 * au-dessus — quand `background-image` dessine la PREMIÈRE par-dessus. Unifier
 * les deux sans inverser ici aurait mis le socle par-dessus la tourelle, et rien
 * dans la suite ne l'aurait dit : les deux noms seraient présents, dans le
 * mauvais ordre. L'inversion se fait UNE fois, ici, à l'endroit où l'on compose
 * les trois listes.
 *
 * ⚠⚠ IL S'EXPORTE DEPUIS LE 30/08, POUR L'ÉCRAN OFFENSE. Celui-ci pose
 * maintenant les mêmes sprites d'unité dans ses trente-six emplacements et dans
 * sa palette ; en écrire une seconde version là-bas aurait fait deux façons
 * d'empiler des couches CSS, dont une seule connaîtrait l'inversion d'ordre
 * ci-dessus — et le socle d'une pièce serait passé par-dessus sa tourelle sur
 * un écran et pas sur l'autre. `ui/offense.js` importe déjà de ce fichier-ci
 * (`formaterEntier`, `ligneAAfficher`, …), le précédent est en place.
 *
 * @param {HTMLElement} element
 * @param {{famille: string, nom: string}[]} couches de la plus BASSE à la plus haute
 */
export function poserCouches(element, couches) {
  if (!Array.isArray(couches) || couches.length === 0) {
    throw new RangeError('chantier : une pièce sans couche de sprite');
  }
  const images = [];
  const tailles = [];
  const positions = [];
  for (const { famille, nom } of [...couches].reverse()) {
    const variable = VARIABLE_DATLAS[famille];
    if (variable === undefined) {
      throw new RangeError(`chantier : la famille « ${famille} » n'a pas de variable CSS`);
    }
    const fond = fondDuSprite(famille, nom);
    images.push(variable);
    tailles.push(fond.taille);
    positions.push(fond.position);
  }
  if (images.length !== tailles.length || images.length !== positions.length) {
    throw new RangeError('chantier : les trois listes de fond n\'ont pas la même longueur');
  }
  poserLesAtlas(element, images);
  element.style.backgroundSize = tailles.join(', ');
  element.style.backgroundPosition = positions.join(', ');
}

/**
 * Les couches déjà posées sur une case, pour en remettre une par-dessus.
 *
 * ⚠ ON RELIT CE QU'ON A ÉCRIT PLUTÔT QUE DE RECOMPOSER LA PILE. Le sol est posé
 * sur les cent soixante-deux cases avant que les champs et les obstacles ne
 * sachent où ils tombent ; recalculer sa variante au moment d'empiler
 * dupliquerait l'appel à `suffixeDeVariante`, donc créerait une seconde
 * occasion de le calculer autrement.
 *
 * @param {HTMLElement} case_
 * @returns {{taille: string, position: string}[]}
 */
function fondsPoses(case_) {
  // ⚠ LES TROIS LISTES SE RELISENT ENSEMBLE. Depuis que le sol vient d'un autre
  // atlas que les champs, l'image fait partie de la couche : ne relire que la
  // taille et la position remettrait les quatre couches de sol sous l'atlas de
  // la base, qui n'a pas 256 cellules — le champ dessinerait un morceau
  // d'obstacle, et aucune longueur de liste ne serait fausse.
  const images = (case_.dataset.fond ?? '').split(', ').filter(Boolean);
  const tailles = case_.style.backgroundSize.split(', ').filter(Boolean);
  const positions = case_.style.backgroundPosition.split(', ').filter(Boolean);
  return tailles.map((taille, i) => ({ image: images[i], taille, position: positions[i] }));
}

/**
 * Le sprite de terrain d'une case, sous la forme d'un fond CSS.
 *
 * ⚠⚠ LE CHOIX DE LA VARIANTE A DÉMÉNAGÉ DANS `render/variante.js` AU LOT
 * ERGONOMIE, ET IL N'EN RESTE PAS DE COPIE ICI. Le champ de bataille dessine
 * ses obstacles avec leur sprite depuis ce lot, et `render/scene.js` n'a pas le
 * droit d'importer `ui/` : deux tirages voisins auraient donné au même obstacle
 * un dessin dans la base et un autre au combat. Ce qui reste ici est la seule
 * chose qui soit propre au DOM — l'adresse de l'atlas, la taille et la position.
 *
 * ⚠ LE COMPTE DE VARIANTES SE PREND SUR LE PRÉFIXE EXACT, JAMAIS SUR UN VOISIN,
 * et c'est `nomDeVariante` qui le tient : mesurer les variantes du quartz pour
 * les appliquer à la scorie marcherait aujourd'hui — les deux en ont deux — et se
 * tromperait en silence le jour où l'une en gagnerait une troisième.
 *
 * @param {string} prefixe début du nom, sans la lettre de variante
 * @param {number} graine
 * @param {number} rangee
 * @param {number} colonne
 * @returns {{image: string, taille: string, position: string}}
 */
function fondDuTerrain(prefixe, graine, rangee, colonne) {
  return {
    image: VARIABLE_DATLAS.terrain,
    ...fondDuSprite('terrain', nomDeVariante(prefixe, graine, rangee, colonne)),
  };
}

// ---------------------------------------------------------------------------
// Les deux bornes du zoom de la base
// ---------------------------------------------------------------------------

/**
 * De combien un sprite peut être agrandi au-delà de sa propre définition, au
 * zoom maximal de la base.
 *
 * ⚠ ENTIER, OBLIGATOIREMENT. Au plafond, un pixel de sprite vaut ce nombre de
 * pixels CSS ENTIERS ; avec `image-rendering: pixelated`, l'agrandissement ne
 * peut alors pas interpoler. C'est le raisonnement des crans de `ZOOM_CARTE`,
 * qui sont des puissances de deux pour la même raison — un plafond à 1,5 fois
 * la définition rendrait du flou.
 *
 * ⚠ ET C'EST UNE VALEUR D'INTERFACE, PAS DE CALIBRAGE : elle ne décide de rien
 * dans le jeu, seulement de jusqu'où le doigt peut grossir la vue. Elle vit donc
 * ici, avec le reste du zoom, et non dans `src/data/`.
 */
export const ZOOM_BASE_MULTIPLE_MAX = 1;
// ⚠⚠ IL EST PASSÉ DE 2 À 1 AU LOT GRILLE-128, ET LE JOUEUR NE VOIT AUCUNE
// DIFFÉRENCE. Le plafond vaut `COTE_SPRITE × ce nombre` : il valait 64 × 2 =
// 128 px CSS par case, il vaut 128 × 1 = **128, exactement le même**. Ce qui
// change, c'est ce qu'on obtient pour ce prix — hier un sprite de 64 agrandi
// DEUX FOIS au-dessus de sa définition, aujourd'hui un sprite de 128 rendu au
// rapport 1:1. La plage du zoom ne bouge donc pas d'un pixel, et le flou du
// plafond disparaît. Le laisser à 2 aurait porté le plafond à 256 et rouvert,
// à l'envers, la question de plage tranchée le 31/08.

/**
 * Le côté de case le plus grand qu'on autorise, en pixels CSS.
 *
 * ⚠ IL SE LIT DANS L'ATLAS, IL NE SE CHOISIT PAS. `COTE_SPRITE` est la
 * résolution à laquelle tous les sprites du dépôt sont conditionnés ; le plafond
 * en est un MULTIPLE ENTIER, jamais un nombre écrit à la main.
 *
 * ⚠⚠ IL VALAIT `COTE_SPRITE` TOUT COURT JUSQU'AU 31/08, ET LE ZOOM NE ZOOMAIT
 * QUASIMENT PAS. Ethan : « le zoom de la base est chelou, très lent ». Ce n'était
 * pas la VITESSE — le facteur est le rapport des écarts, donc un geste de la
 * main rend exactement sa proportion —, c'était la PLAGE. Mesuré sur un
 * téléphone de 360 px CSS : le plancher vaut 40, le plafond valait 64, soit
 * 1,6 fois EN TOUT. Depuis l'ouverture à 46, écarter les doigts de 39 % suffisait
 * à buter en haut et les resserrer de 13 % à buter en bas ; tout le reste du
 * geste ne faisait plus rien, ce qui se lit exactement comme un zoom qui ne
 * répond pas. À 128, la plage passe à 3,2 fois.
 *
 * ⚠ CE QU'ON PAIE, ET POURQUOI C'EST ACCEPTABLE. Au-delà de `COTE_SPRITE` on
 * agrandit du pixel art au-dessus de sa propre définition — ce que le lot du
 * 30/08 a précisément retiré à la carte du monde. La différence tient en deux
 * points : le facteur reste ENTIER (voir ci-dessus), et surtout ce zoom-ci est
 * un geste que le joueur fait exprès, quand il veut regarder une case de près,
 * là où la carte agrandissait son fond SANS qu'on lui demande. On ne rend pas
 * du flou par défaut : on autorise un gros plan.
 */
export const COTE_CASE_MAX = COTE_SPRITE * ZOOM_BASE_MULTIPLE_MAX;

/**
 * Le côté de case à l'ouverture, LU DANS LA FEUILLE DE STYLE.
 *
 * ⚠⚠ IL N'EST PAS ÉCRIT ICI, ET C'EST LA RÈGLE DU FICHIER. « Aucun chiffre de
 * calibrage ici », dit son en-tête : la taille d'une case est une décision de
 * mise en page, elle vit dans `index.src.html` sous `--case-defaut`. L'écrire
 * des deux côtés ferait deux vérités dont la divergence se lirait comme une
 * grille qui s'ouvre à la mauvaise taille.
 *
 * ⚠ ET LE REPLI EXISTE POUR LE CAS OÙ LA VARIABLE MANQUE, pas pour se dispenser
 * de la lire : un côté de zéro ferait une grille invisible, ce qui est pire
 * qu'une grille à la mauvaise taille.
 *
 * @param {Document} doc
 * @returns {number}
 */
export function coteCaseParDefaut(doc) {
  const brut = doc.defaultView
    ?.getComputedStyle(doc.documentElement)
    ?.getPropertyValue('--case-defaut');
  const lu = Number.parseFloat(brut ?? '');
  // ⚠⚠ LE REPLI EST `COTE_SPRITE`, PAS `COTE_CASE_MAX`, ET LES DEUX ONT CESSÉ
  // D'ÊTRE ÉGAUX LE 31/08. Ils l'étaient tant que le plafond de zoom valait la
  // définition d'un sprite ; depuis qu'il vaut le double, retomber sur le
  // plafond ferait s'OUVRIR la base au zoom maximal quand la variable manque —
  // c'est-à-dire à 128 px par case, soit trois colonnes visibles sur neuf.
  // Le repli est une taille d'ouverture raisonnable, jamais une borne.
  // ⚠ Un test de `chantier.test.js` tenait déjà cette égalité, et il est tombé
  // au moment où le plafond a bougé. Il avait raison.
  return Number.isFinite(lu) && lu > 0 ? lu : COTE_SPRITE;
}

/**
 * Où défiler pour que le point du contenu sous l'ancre y RESTE quand la grille
 * change de taille.
 *
 * ⚠⚠ ETHAN, 04/09 : « Le zoom dans la base se fait depuis l'angle en haut à
 * gauche, très bizarre ». C'était vrai à la lettre : le pincement changeait la
 * taille de case et rien d'autre, donc le conteneur grandissait depuis son
 * origine et la case qu'on vise fuyait vers le bas à droite. `ui/monde.js`
 * résout déjà ce geste sur un canevas ; ici la surface DÉFILE, donc ce qu'on
 * réécrit est le défilement.
 *
 * ⚠⚠ ET LE FACTEUR SUFFIT — INUTILE DE CONNAÎTRE LE `padding`. Tout ce que la
 * boîte contient est proportionnel à `--case-cote` : les neuf colonnes, et le
 * `padding` d'une demi-case de chaque côté (`paddingDeLaGrille`). Le contenu se
 * dilate donc autour de son ORIGINE, et la position du même point après
 * dilatation vaut `(defilement + ancre) × facteur`. Lire le `padding` ici en
 * ferait une seconde vérité, qui mentirait le jour où il cesserait de suivre la
 * case.
 *
 * ⚠ LE RÉSULTAT EST BORNÉ ICI, PAS LAISSÉ AU NAVIGATEUR. Un `scrollLeft` écrit
 * hors bornes est rogné en silence : l'ancrage sauterait sur les bords sans
 * qu'aucun test ne le voie. On borne, et `ERGO T2` mesure les quatre coins.
 *
 * @param {number} defilement défilement courant, en pixels
 * @param {number} ancre position de l'ancre dans le cadre, en pixels
 * @param {number} facteur nouveau côté de case / ancien
 * @param {number} max défilement maximal après le changement de taille
 * @returns {number} le défilement à écrire
 */
export function defilementAncre(defilement, ancre, facteur, max) {
  if (!(facteur > 0)) return defilement;
  const vise = (defilement + ancre) * facteur - ancre;
  if (!Number.isFinite(vise)) return defilement;
  return Math.max(0, Math.min(max, Math.round(vise)));
}

/**
 * ⚠⚠ LE SOL PAVÉ CASE PAR CASE A DISPARU — lot MUR-PEINT, 03/09.
 *
 * Quatre fonctions vivaient ici : `COTE_CELLULE_SOL`, `cellulesDeSolParAxe`,
 * `casesDeSolParAtlas` et `fondsDuSol`. Elles découpaient l'atlas du MONDE en
 * quatre cellules par case et en tapissaient les cent soixante-deux cases de la
 * grille, plus le champ derrière elles. Le sol de la base est maintenant UNE
 * image — le décor peint, mur compris —, donc il n'y a plus rien à découper ni à
 * paver.
 *
 * ⚠⚠ ET `--atlas-sol` A DISPARU À SON TOUR — lot SOL-SATELLITE, 05/09. Ce
 * paragraphe disait qu'elle restait « parce que la CARTE en a toujours besoin,
 * et que son terrain est procédural ». Il ne l'est plus : le sol de la carte est
 * fait de huit planches satellite qu'`ui/monde.js` prend en `<img>`, sans passer
 * par la feuille. Il n'y a donc plus d'atlas du monde du tout.
 *
 * ⚠ ET `tile_sol_{j,o}_*` N'A PAS ÉTÉ TOUCHÉ NON PLUS, parce que ce lot ne
 * l'orpheline pas : il l'était DÉJÀ. Mesuré — les huit dalles ne sont nommées
 * dans `src/` que par des commentaires, aucun écran ne les résout depuis le
 * 30/08, où le sol de la base est passé à l'atlas du monde. Elles restent
 * cousues dans l'atlas `terrain` ; les en retirer changerait la géométrie d'un
 * fichier GÉNÉRÉ pour une dette que ce lot n'a pas créée.
 */


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
export function initialiserEcranChantier(doc, {
  apresPose, versEcran, apresBascule, sonDeRefus, sonDeGeste,
} = {}) {
  const $ = (id) => doc.getElementById(id);
  const defile = $('chantier-defile');
  const grille = $('chantier-grille');

  let selection = null; // indice dans la liste du terrain sélectionné, ou null
  // ⚠ UN INDICE SEUL NE SUFFIT PLUS DEPUIS QUE LA BANDE DÉFENSE EST ÉDITABLE.
  // `selection` indexe `disposition` OU `garnison` ; sans le terrain à côté,
  // l'indice 2 désignerait le troisième bâtiment aussi bien que le troisième
  // mur, et l'écran afficherait l'un en croyant montrer l'autre. Même
  // raisonnement pour la pièce en main pendant un déplacement.
  let terrainSelection = 'batiments';
  let terrainDeplacement = 'batiments';
  let etatCourant = null;
  // Le bâtiment que le joueur s'apprête à poser, ou null. C'est le seul mode
  // de l'écran : quand il vaut null, toucher une case SÉLECTIONNE ; sinon,
  // toucher une case POSE.
  let posableChoisi = null;
  // L'action armée, ou null. Elle et `posableChoisi` sont EXCLUSIFS : armer une
  // action défait la palette, choisir un posable désarme l'action. Un seul mode
  // à la fois, sinon un toucher voudrait dire deux choses.
  let actionArmee = null;
  let minuterieToast = null;
  // Ce que le joueur regarde : l'écran, et la bande s'il est sur le Chantier.
  // C'est ce couple qui décide du libellé du compteur et du bouton du bas qui
  // s'allume.
  let ecranCourant = 'chantier';
  let bandeCourante = 'batiments';
  // La case où le bâtiment choisi est en APERÇU, en attendant la confirmation.
  // C'est le premier des deux touchers de la pose (arbitré le 28/08).
  let poseEnAttente = null;
  // Le bâtiment « en main » pendant un déplacement, ou null. Le déplacement est
  // la seule action qui demande DEUX touchers : le bâtiment, puis l'arrivée.
  let deplacementEnCours = null;
  const fenetre = doc.defaultView;
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
  // ⚠ TROIS REGISTRES, UNE SEULE LIGNE. La priorité et la raison de chacun sont
  // écrites au-dessus de `ligneAAfficher`, qui est pure et testée. Ici on ne
  // fait que tenir l'état des trois et rendre le verdict.
  const registres = { session: '', toast: '', mode: '' };

  function rendreLigne() {
    const { texte, ton } = ligneAAfficher(registres);
    const ligne = $('chantier-avis');
    ligne.textContent = texte;
    ligne.hidden = texte === '';
    // Un mot de mode n'est pas une alerte : rien n'est cassé, on rappelle
    // seulement ce que le prochain toucher va faire. Il porte donc le métal, et
    // non le rouge des refus.
    ligne.classList.toggle('mode', ton === 'mode');
    ligne.classList.toggle('refus', ton === 'refus');
  }

  /**
   * Le registre de la SESSION — sauvegarde impossible, sauvegarde illisible.
   *
   * ⚠ IL N'EFFACE PLUS RIEN AU PASSAGE, ET C'EST UNE CORRECTION. Il écrivait
   * directement dans l'élément, si bien qu'un `avis('')` posé par n'importe
   * quel geste — armer une action, choisir un posable — faisait disparaître
   * une alerte de sauvegarde que personne n'avait lue. Chaque registre ne
   * touche plus que le sien.
   */
  function avis(texte) {
    registres.session = texte;
    rendreLigne();
  }

  /**
   * Un message qui répond à un geste, et qui s'efface tout seul.
   *
   * ⚠ IL NE S'EFFACE QUE S'IL EST ENCORE LE SIEN. Entre l'affichage et
   * l'échéance, un autre refus a pu s'écrire ; effacer celui-là ferait
   * disparaître un message que le joueur vient de recevoir.
   */
  function toast(texte) {
    if (minuterieToast !== null) {
      fenetre.clearTimeout(minuterieToast);
      minuterieToast = null;
    }
    registres.toast = texte;
    rendreLigne();
    if (texte === '') return;
    // ⚠⚠ LE SON DE REFUS SUIT LA GARDE QUI EXISTE DÉJÀ, IL N'EN AJOUTE PAS.
    // La ligne au-dessus sort quand il n'y a rien à annoncer — effacer un
    // toast passe par ici aussi. Écrire un `if (texte !== '')` à moi aurait
    // posé une seconde condition disant la même chose, et les deux auraient
    // fini par diverger. La session décide s'il y a un son ; l'écran dit
    // seulement qu'un refus vient d'atteindre le joueur.
    if (sonDeRefus !== undefined) sonDeRefus();
    minuterieToast = fenetre.setTimeout(() => {
      minuterieToast = null;
      if (registres.toast !== texte) return;
      registres.toast = '';
      rendreLigne();
    }, DUREE_TOAST_MS);
  }

  /**
   * Le registre du MODE — il vit exactement aussi longtemps que le mode.
   *
   * ⚠ IL N'EXISTAIT PAS, ET C'EST LE DÉFAUT QU'ETHAN A RELEVÉ LE 28/08. Armer
   * « Démolir » ne disait rien : l'écran ne bougeait pas, et le bâtiment suivant
   * qu'on touchait disparaissait. Le mode se dit maintenant en toutes lettres,
   * et il le dit tant qu'il dure.
   */
  function ligneDeMode(texte) {
    registres.mode = texte;
    rendreLigne();
  }

  // --- la grille, construite une fois ---------------------------------------
  //
  // Autant de cases que `GRILLE` en déclare — jamais 9 ni 18 écrits ici. Elles
  // ne changent jamais de place, seul leur contenu bouge : reconstruire le
  // balisage à chaque image ferait perdre la sélection et le défilement.
  //
  // ⚠ PLUS DE RAIL, ET PLUS DE GOUTTIÈRE À GAUCHE. Arbitré le 27/08 : la barre
  // de gauche disparaît, et la grille se centre dans la largeur disponible. Les
  // bandes se lisent aux deux boutons du bas, qui disent déjà où l'on est.
  //
  // ⚠⚠ LE CENTRAGE ET LE ZOOM SONT UNE MISE EN PAGE, JAMAIS UNE TRANSFORMATION.
  // Un `transform: scale()` sur le conteneur casserait la correspondance entre
  // le doigt et la case — le dessin bougerait, pas la géométrie du pointage.
  // Les colonnes font donc `--case-cote` PIXELS, une valeur que le JS écrit et
  // que le pincement fait varier ; `margin-inline: auto` répartit ce qui reste
  // tant que la grille tient, et le parent défile au-delà.
  grille.style.gridTemplateColumns = `repeat(${GRILLE.largeur}, var(--case-cote))`;
  for (let rangee = 1; rangee <= GRILLE.longueur; rangee++) {
    const bande = bandeDeLaRangee(rangee);
    for (let colonne = 1; colonne <= GRILLE.largeur; colonne++) {
      const case_ = doc.createElement('div');
      case_.className = `case ${bande}`;
      case_.dataset.rangee = String(rangee);
      case_.dataset.colonne = String(colonne);
      case_.style.gridColumn = String(colonne);
      // ⚠ LA LIGNE D'ÉCRAN N'EST PAS LA RANGÉE. `render/orientation.js` fait la
      // seule transformation, ici comme pour le rail : poser `gridRow = rangee`
      // mettait la rangée 1 en premier, donc le déploiement avant la base.
      case_.style.gridRow = String(ligneEcranDeLaRangee(rangee));
      cellules.set(cle(rangee, colonne), case_);
      grille.appendChild(case_);
    }
  }

  // ⚠ UN CALQUE SVG PAR-DESSUS LA GRILLE, ET IL NE PREND AUCUN GESTE. Les
  // traits de voisinage relient DEUX cases : ils ne peuvent donc pas vivre dans
  // une case, ce qui est tout ce que le glyphe de 11 px savait faire. Le
  // `viewBox` prend la CASE pour unité — autant d'unités que de colonnes et de
  // lignes — si bien que le trait suit la taille de la case sans qu'on lise un
  // seul pixel. `pointer-events: none` en fait un dessin et rien d'autre : le
  // doigt continue de toucher la case qu'il vise.
  const SVG = 'http://www.w3.org/2000/svg';
  // ⚠⚠ IL N'Y A PLUS D'ANNEAU À POSER — lot MUR-PEINT, 03/09. Quarante et une
  // pièces de mur se construisaient ici, une fois pour toutes, en unités de
  // case : deux coins, trois créneaux en haut, trente-six blocs de flanc. Le
  // mur est maintenant PEINT dans le décor de la base : il n'y a plus de
  // géométrie à dessiner, plus de variable CSS par pan de mur, et plus rien à
  // lever quand une image manque à la table. Ce que l'anneau réservait —
  // une case de chaque côté — est devenu la demi-case de `paddingDeLaGrille`.
  // ⚠⚠ UN VOILE ZÉBRÉ PAR BANDE NAVIGABLE — Ethan, 04/09 : « Dans les bases,
  // assombrir la défense quand on regarde la base et inversement — du genre
  // grandes barres hachurées en travers, comme les zébras sur la route. »
  //
  // ⚠⚠ UN ÉLÉMENT PAR BANDE, PAS UN `::after` PAR CASE. Un dégradé répété sur
  // chaque case redémarre à chaque bordure : à 45° la phase saute d'une case à
  // l'autre, et on obtient un hachurage par case au lieu des GRANDES barres en
  // travers qu'Ethan décrit. Posé sur la bande entière, le motif court d'un
  // bord à l'autre.
  //
  // ⚠ ET IL N'EST PAS `position: absolute` : il est placé dans la GRILLE, sur
  // les lignes d'écran de sa bande et sur les neuf colonnes. Il suit donc le
  // zoom et le défilement sans qu'une seule ligne de JS ne le repositionne.
  //
  // ⚠ IL EST AJOUTÉ APRÈS LES CASES, DONC IL PEINT AU-DESSUS D'ELLES SANS
  // `z-index` — un `z-index` sur une case en ferait un contexte d'empilement, et
  // le dépôt a déjà payé cette faute avec `.case.choisie`.
  const voiles = new Map();
  for (const cle of BANDES_NAVIGABLES) {
    const bande = BANDES.find((b) => b.cle === cle);
    const { premiereLigne, nbLignes } = ligneEcranDeLaBande(bande);
    const voile = doc.createElement('div');
    voile.className = 'voile-bande';
    voile.style.gridColumn = `1 / ${GRILLE.largeur + 1}`;
    voile.style.gridRow = `${premiereLigne} / span ${nbLignes}`;
    voile.hidden = true;
    grille.appendChild(voile);
    voiles.set(cle, voile);
  }

  const traits = doc.createElementNS(SVG, 'svg');
  traits.id = 'chantier-traits';
  traits.setAttribute('viewBox', `0 0 ${GRILLE.largeur} ${GRILLE.longueur}`);
  traits.setAttribute('preserveAspectRatio', 'none');
  traits.setAttribute('aria-hidden', 'true');
  grille.appendChild(traits);

  // --- les trois bandeaux de ressource ---------------------------------------
  const champsRessource = new Map();
  const bandeauRessources = $('ressources');
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

  // --- les points d'attaque ---------------------------------------------------
  //
  // ⚠⚠ ETHAN, 04/09 : « afficher les points d'attaque entre l'électricité et
  // emplacement ». La place est donnée par l'ORDRE DU DOM, et par lui seul :
  // cette tuile est construite ici, entre la boucle des trois ressources et le
  // bloc des emplacements. La poser à la fin pour la ramener par `order`
  // ferait diverger l'ordre lu et l'ordre vu — donc la navigation au clavier et
  // la lecture d'écran.
  //
  // ⚠ ELLE RÉEMPLOIE LES CLASSES DES TROIS AUTRES — `.ressource`, `.ligne`, `b`,
  // `.capacite`, `.nom` — et n'ajoute qu'une teinte. Un stock plafonné se lit
  // exactement comme les autres : « 31 / 118 ».
  //
  // ⚠⚠ ET IL N'Y A RIEN À PEINDRE EN SATURÉ. `b.sature` dit « le stock est gelé
  // au-dessus de sa capacité, il ne redescendra pas tout seul » — un DÉFAUT que
  // le joueur doit voir. Des points d'attaque au plafond, c'est le PLEIN : le
  // marquer en rouge dirait le contraire de ce qui se passe.
  const blocAttaque = doc.createElement('div');
  blocAttaque.className = 'ressource attaque';
  const attaquePoints = doc.createElement('b');
  const attaquePlafond = doc.createElement('span');
  attaquePlafond.className = 'capacite';
  const attaqueNom = doc.createElement('span');
  attaqueNom.className = 'nom';
  attaqueNom.textContent = 'Attaque';
  const hautAttaque = doc.createElement('div');
  hautAttaque.className = 'ligne';
  hautAttaque.append(attaquePoints, attaquePlafond);
  const basAttaque = doc.createElement('div');
  basAttaque.className = 'ligne';
  basAttaque.append(attaqueNom);
  blocAttaque.append(hautAttaque, basAttaque);
  bandeauRessources.appendChild(blocAttaque);

  // --- le compteur, qui suit le contexte -------------------------------------
  //
  // ⚠ IL AVAIT ÉTÉ RETIRÉ AVEC LA BARRE DE GAUCHE (27/08), au motif que la
  // saturation se dirait au toucher d'une vignette. Ethan l'a redemandé à
  // l'essai du 28/08 — « il n'y a plus la limite de bâtiment » — et il a
  // raison : un plafond qu'on ne découvre qu'en le heurtant n'est pas un
  // plafond, c'est une surprise. Le toast RESTE, il ne le remplace pas ; les
  // deux disent la même grandeur à deux moments différents.
  //
  // ⚠ IL SE RANGE AVEC LES RESSOURCES, PAS AILLEURS. Un emplacement se lit
  // exactement comme un stock plafonné — « 1 / 2 » — et c'est là que le joueur
  // regarde ce dont il dispose. Une quatrième barre pour un seul nombre
  // coûterait la hauteur d'une rangée de grille.
  //
  // ⚠ SON LIBELLÉ CHANGE AVEC L'ÉCRAN depuis le 28/08 — « quand on passe en
  // défense, le nombre d'emplacement change pour celui des points de défense.
  // Idem pour offense ». La valeur, elle, reste « — » pour ces deux-là : l'état
  // ne porte ni garnison ni armée, et un chiffre inventé serait pire qu'un
  // tiret. Voir `compteurDeContexte`, qui porte la règle et se teste sans DOM.
  const blocEmplacements = doc.createElement('div');
  blocEmplacements.className = 'ressource emplacements';
  const emplacementsPoses = doc.createElement('b');
  const emplacementsOuverts = doc.createElement('span');
  emplacementsOuverts.className = 'capacite';
  const emplacementsNom = doc.createElement('span');
  emplacementsNom.className = 'nom';
  const hautEmplacements = doc.createElement('div');
  hautEmplacements.className = 'ligne';
  hautEmplacements.append(emplacementsPoses, emplacementsOuverts);
  const basEmplacements = doc.createElement('div');
  basEmplacements.className = 'ligne';
  basEmplacements.append(emplacementsNom);
  blocEmplacements.append(hautEmplacements, basEmplacements);
  bandeauRessources.appendChild(blocEmplacements);

  // --- la bascule entre bases -------------------------------------------------
  //
  // ⚠⚠ VIVES DEPUIS BASES-1, ET LA COQUILLE EST PARTIE AVEC SON COMMENTAIRE.
  // Elle disait « le jour où l'état portera plusieurs bases, il n'y aura qu'à
  // les rendre vives » ; laisser la phrase en aurait fait un mensonge de plus.
  //
  // ⚠⚠ LA BASCULE ÉCRIT UN INDICE, ET RIEN D'AUTRE. `basculerVersLaBase` de
  // `sim/state.js` pose `etat.baseCourante` ; l'écran ne garde AUCUN raccourci
  // vers l'objet base — c'est la règle que BASES-0 a écrite en rangeant
  // l'indice : deux chemins vers la même base divergent au premier
  // `structuredClone`.
  //
  // ⚠ ELLE REPEINT TOUT, ET ELLE SAUVEGARDE. Chaque écran relit l'état à sa
  // peinture, donc repeindre suffit à les faire suivre — mais `baseCourante`
  // est une décision du joueur, au même titre qu'une pose : la perdre parce que
  // l'application a été tuée serait la lui reprendre en silence.
  for (const [bouton, pas] of [['navigation-precedente', -1], ['navigation-suivante', 1]]) {
    $(bouton).addEventListener('click', () => {
      if (etatCourant === null || etatCourant.bases.length < 2) return;
      basculerVersLaBase(
        etatCourant,
        (etatCourant.baseCourante + pas + etatCourant.bases.length) % etatCourant.bases.length,
      );
      // ⚠ LA SAUVEGARDE PASSE AVANT LE REPEINT, comme pour la pose. La session
      // sait COMMENT écrire ; l'écran dit seulement QUAND.
      if (apresBascule !== undefined) apresBascule();
      peindre(etatCourant);
    });
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
  // ⚠ TROIS BOUTONS ÉGAUX, ET LA BARRE EST ENTIÈRE (28/08). Elle portait deux
  // bandes, le numéro de version et un saut vers l'Offense séparé par un filet
  // — précisément pour qu'il n'ait pas l'air d'une bande. Ethan a tranché dans
  // l'autre sens : « les boutons base défense offense doivent prendre toutes la
  // place en bas ». Le numéro de version a déménagé dans les Options.
  //
  // ⚠ DEUX FONT DÉFILER, LE TROISIÈME CHANGE D'ÉCRAN, et l'écran n'en décide
  // pas seul : il le DEMANDE à la session par `versEcran`, qui sait ce qu'est
  // un écran. Le même découpage que `apresPose`, pour la même raison.
  const bandeauBandes = $('barre-bas');
  const boutonsBande = new Map();
  for (const entree of BOUTONS_DU_BAS) {
    const bouton = doc.createElement('button');
    bouton.type = 'button';
    bouton.className = `bande ${entree.cle}`;
    bouton.dataset.bande = entree.cle;
    const trait = doc.createElement('em');
    const nom = doc.createElement('span');
    nom.textContent = entree.nom;
    const niveau = doc.createElement('i');
    niveau.textContent = NIVEAU_ABSENT;
    bouton.append(trait, nom, niveau);
    bouton.addEventListener('click', () => {
      if (versEcran !== undefined) versEcran(entree.ecran);
      if (entree.bande !== null) allerALaBande(entree.bande);
      else marquerBoutonDuBas();
    });
    bandeauBandes.appendChild(bouton);
    boutonsBande.set(entree.cle, { bouton, niveau });
  }

  /**
   * Hauteur d'une rangée à l'écran.
   *
   * ⚠⚠ ELLE NE SE MESURE PLUS SUR LA BOÎTE DE LA GRILLE, ET C'EST LE MUR QUI
   * L'A IMPOSÉ. Elle valait `hauteur de la boîte / GRILLE.longueur` ; depuis que
   * la grille porte la marge du mur, cette boîte est plus haute que ses dix-huit
   * rangées, et la formule rendrait plus que la vraie hauteur — ce qui
   * décalerait la bande Défense sans que rien ne le dise. Vrai de l'anneau qui
   * coûtait une case, vrai du mur peint qui en coûte une demie.
   *
   * ⚠ ET LA CASE EST CARRÉE (`aspect-ratio: 1`), donc sa hauteur EST le côté que
   * le JS vient d'écrire. On lit ce qu'on a écrit plutôt que de le remesurer :
   * c'est exact, et ça ne dépend plus de la boîte.
   */
  function hauteurRangee() {
    return coteCase;
  }

  /**
   * La marge que le mur PEINT ajoute autour de la grille — une demi-case.
   *
   * ⚠ ELLE ENTRE DANS LE DÉFILEMENT, ET NULLE PART AILLEURS. `bornesDeDefilement`
   * raisonne en coordonnées de CONTENU — c'est ce qui la rend pure et testable
   * sans DOM ; le `padding`, lui, est un fait de mise en page. On l'ajoute donc
   * ici, au seul endroit qui convertit l'un en l'autre.
   *
   * ⚠⚠ ELLE VALAIT UNE CASE ENTIÈRE JUSQU'AU LOT MUR-PEINT, quand l'anneau était
   * fait de blocs pleins qui ceignaient la grille. Le mur peint n'occupe qu'une
   * DEMI-case : c'est ce qui rend au joueur environ 10 % de taille de case.
   */
  function paddingDeLaGrille() {
    return coteCase * MUR_CASES;
  }

  /**
   * Amène la première rangée d'une bande en tête du champ.
   * @param {string} cleBande
   */
  function allerALaBande(cleBande) {
    const bande = BANDES.find((b) => b.cle === cleBande);
    if (bande === undefined) throw new Error(`chantier : bande « ${cleBande} » inconnue`);
    // ⚠ ON MARQUE LA BANDE AVANT DE DÉFILER, ET L'ORDRE COMPTE DEPUIS LE 31/08.
    // Le défilement est maintenant BORNÉ à la bande courante : partir avant
    // d'avoir changé de bande ferait clamper le mouvement sur la bande qu'on
    // quitte, donc le ramènerait d'où il vient.
    marquerBandeActive(cleBande);
    const { premiereLigne } = ligneEcranDeLaBande(bande);
    // ⚠ ON SE POSE SUR LA BORNE BASSE DE LA BANDE, pas sur sa première rangée :
    // c'est elle qui inclut le mur, et c'est elle que le défilement respectera
    // ensuite. Viser la rangée ferait sauter la vue d'une demi-case au premier
    // geste, ce qui se lit comme un à-coup.
    const bornes = bornesDeDefilement(cleBande, hauteurRangee(), defile.clientHeight, paddingDeLaGrille());
    defile.scrollTo({ top: bornes.min, behavior: 'smooth' });
  }

  function marquerBandeActive(cleBande) {
    const avant = terrainCourant();
    bandeCourante = cleBande;
    marquerBoutonDuBas();
    marquerBascule();
    // ⚠ LE VOILE EST SUR L'AUTRE BANDE, ET IL N'Y EN A QU'UN D'ALLUMÉ. Le
    // marquer ici et nulle part ailleurs : `bandeCourante` change à chaque
    // évènement de défilement, et deux écrivains de la même bascule
    // divergeraient à la première inattention.
    for (const [cle, voile] of voiles) voile.hidden = cle === cleBande;

    // ⚠⚠ LA PALETTE SUIT LE TERRAIN, ET SANS CETTE LIGNE ELLE NE LE SUIVAIT
    // PAS. `bandeCourante` bouge à chaque évènement de défilement ; la palette,
    // elle, n'était repeinte que par `peindre`, `choisirPosable` et `armer`.
    // Le joueur serait donc descendu sur la bande Défense avec les vignettes
    // des onze bâtiments sous les yeux, et le premier toucher aurait posé —
    // ou plutôt refusé de poser — un collecteur dans sa ligne de défense.
    //
    // ⚠ ET ELLE NE SE REPEINT QUE QUAND LE TERRAIN CHANGE, pas à chaque pixel :
    // reconstruire dix-sept boutons par évènement de défilement les ferait
    // clignoter sous le doigt.
    if (etatCourant === null || terrainCourant() === avant) return;

    // Changer de terrain défait le mode en cours. La vignette choisie
    // appartenait à l'autre palette et la pièce en main à l'autre liste : les
    // garder ferait viser, au toucher suivant, quelque chose que le joueur ne
    // regarde plus. L'ACTION armée, elle, survit — elle s'applique à ce qu'on
    // touche, et `executerAction` reçoit le terrain de la case.
    posableChoisi = null;
    poseEnAttente = null;
    deplacementEnCours = null;
    // ⚠ ON REMET LE MOT DU MODE, ON NE L'EFFACE PAS. Un `ligneDeMode('')` tenait
    // ici : l'action armée SURVIT au changement de bande, si bien que la ligne
    // se vidait pendant que « Démolir » restait actif — et le bâtiment suivant
    // qu'on touchait disparaissait sans un mot. C'est exactement le défaut
    // qu'Ethan a relevé le 28/08 sur les boutons d'action, et il serait revenu
    // par la porte du défilement.
    ligneDeMode(actionArmee === null ? '' : MESSAGES_MODE[actionArmee]);
    peindrePalette(etatCourant);
    marquerCasesLegales();
    peindreApercu();
  }

  /**
   * Allume le bouton du bas qui correspond à ce qu'on regarde.
   *
   * ⚠ L'ÉCRAN L'EMPORTE SUR LA BANDE. Sur l'Offense, aucune bande n'est
   * visible : allumer « Base » parce que le défilement s'y était arrêté dirait
   * au joueur qu'il regarde sa base alors qu'il regarde ses vagues.
   */
  function marquerBoutonDuBas() {
    const actif = ecranCourant === 'chantier' ? bandeCourante : ecranCourant;
    for (const [c, { bouton }] of boutonsBande) {
      bouton.classList.toggle('active', c === actif);
    }
    majCompteur();
  }

  /**
   * Le terrain que le joueur édite en ce moment : la bande où il se trouve, si
   * elle est éditable.
   *
   * ⚠ LA BANDE « DÉPLOIEMENT » RETOMBE SUR LES BÂTIMENTS. Elle n'a pas de
   * palette à elle — les rangées 1–2 sont l'endroit où les vagues PARAISSENT,
   * pas celui où on les compose — et lever pour un simple défilement serait
   * hors de proportion.
   */
  function terrainCourant() {
    return TERRAINS[bandeCourante] === undefined ? 'batiments' : bandeCourante;
  }

  /**
   * Le terrain auquel appartient une rangée touchée.
   *
   * ⚠ IL NE SE DEVINE PAS AVEC DES NOMBRES. `bandeDeLaRangee` lit `GRILLE`, et
   * c'est la seule table qui dise où commence et où finit chaque bande. Écrire
   * « rangee <= 10 » ici marcherait aujourd'hui et mentirait au jour où la
   * grille change de proportions.
   */
  function terrainDeLaRangee(rangee) {
    const bande = bandeDeLaRangee(rangee);
    return TERRAINS[bande] === undefined ? 'batiments' : bande;
  }

  /** Le compteur du bandeau des ressources, dans le contexte du moment. */
  function majCompteur() {
    if (etatCourant === null) return;
    const contexte = ecranCourant === 'chantier' ? bandeCourante : ecranCourant;
    // La bande « déploiement » n'a pas de bouton et n'a pas de compteur à elle :
    // on retombe sur les bâtiments plutôt que de lever pour un défilement.
    const vue = compteurDeContexte(etatCourant, CONTEXTES[contexte] === undefined ? 'batiments' : contexte);
    emplacementsNom.textContent = vue.libelle;
    emplacementsPoses.textContent = vue.valeur;
    emplacementsOuverts.textContent = vue.capacite;
    emplacementsPoses.classList.toggle('sature', vue.sature);
    emplacementsOuverts.classList.toggle('sature', vue.sature);
  }

  // -------------------------------------------------------------------------
  // Le zoom de la base — au doigt, et jamais par une transformation
  // -------------------------------------------------------------------------
  //
  // ⚠⚠ ETHAN, 30/08 : « possibilité de zoomer sur la base, l'ui reste de même
  // taille » et « zoom carte et base : au doigt, pas de zoom fixe avec + − ».
  // Les deux phrases disent la même chose de deux côtés : le geste est le
  // PINCEMENT, et ce qui grandit est le champ de jeu, pas la page.
  //
  // ⚠⚠ CE QUI CHANGE EST LE CÔTÉ D'UNE CASE EN PIXELS, PAS UNE ÉCHELLE. Le
  // dépôt interdit `transform: scale()` sur cette grille depuis le lot
  // POSE-À-L'ÉCRAN, et la raison n'a pas bougé : une transformation déplace le
  // DESSIN sans déplacer la géométrie du pointage, si bien que le doigt cesse
  // de tomber sur la case qu'il vise. En écrivant `--case-cote`, les cases
  // restent des carrés que le navigateur sait localiser, et `elementFromPoint`
  // continue de rendre la bonne — c'est ce qui fait que la pose, le
  // déplacement et le panneau marchent toujours après un zoom.
  //
  // ⚠ LE PLANCHER EST LA TAILLE QUI FAIT TENIR LA GRILLE. En dessous, la grille
  // serait plus étroite que l'écran et le zoom arrière ne montrerait que du
  // vide : il n'y a rien de plus à voir que les neuf colonnes. Le plafond, lui,
  // est la taille à laquelle une cellule d'atlas de 64 px atteint le 1:1 —
  // au-delà on agrandirait du pixel art, ce que le lot du 30/08 vient
  // précisément de retirer à la carte.

  /**
   * Le côté de case le plus petit qui ait un sens : celui qui fait tenir les
   * colonnes dans la largeur disponible.
   *
   * ⚠ IL SE MESURE, IL NE SE DEVINE PAS. `clientWidth` est la largeur du
   * conteneur SANS sa barre de défilement ; l'écrire en dur donnerait une
   * grille trop large sur un petit écran, donc un défilement horizontal au
   * repos — exactement ce que la consigne « tu compresses tout dans l'ui »
   * refuse tant qu'on n'a pas zoomé exprès.
   */
  const COTE_CASE_DEFAUT = coteCaseParDefaut(doc);

  function coteQuiTient() {
    const large = defile.clientWidth;
    if (!(large > 0)) return COTE_CASE_DEFAUT;
    // ⚠⚠ ON DIVISE PAR `LARGEUR_EN_CASES`, ET C'EST LE FOND QUI LE DIT. La boîte
    // affichée fait dix cases : les neuf colonnes jouables, plus la demi-case de
    // mur PEINT de chaque côté. Diviser par neuf ferait déborder le décor,
    // diviser par onze — ce que faisait l'anneau de blocs jusqu'au lot MUR-PEINT
    // — laisserait une case entière de vide de chaque côté du mur.
    //
    // ⚠ ET LE NOMBRE NE S'ÉCRIT PAS ICI. `LARGEUR_EN_CASES` se dérive de
    // `GRILLE.largeur` dans `render/fond.js`, à côté de la mesure qui le
    // justifie ; l'écrire « 10 » ferait deux vérités, et la seconde mentirait le
    // jour où la base changerait de largeur.
    return Math.min(COTE_CASE_DEFAUT, Math.floor(large / LARGEUR_EN_CASES));
  }

  /** Le côté de case appliqué en ce moment, en pixels. */
  let coteCase = COTE_CASE_DEFAUT;

  /**
   * Le joueur a-t-il réglé le zoom lui-même ?
   *
   * ⚠⚠ ELLE EXISTE POUR DÉPARTAGER DEUX RÈGLES QUI SE CONTREDISENT SINON. Tant
   * que personne n'a pincé, la grille doit TENIR dans l'écran — « tu compresses
   * tout dans l'ui », rien ne défile horizontalement au repos. Une fois qu'on a
   * pincé, la grille doit garder la taille demandée, même si elle déborde : un
   * gros plan qui déborde, c'est ce qu'on a demandé.
   *
   * Sans ce drapeau, il fallait choisir : ou bien la rotation d'écran efface le
   * zoom du joueur, ou bien l'ouverture déborde. Les deux ont été livrées.
   */
  let zoomRegleParLeJoueur = false;

  /**
   * Applique un côté de case, borné.
   *
   * ⚠ ON ÉCRIT SUR `#chantier-grille`, PAS SUR `:root`. La variable déclarée
   * dans la feuille est le DÉFAUT ; l'écrire sur la grille laisse le reste de
   * la page — dont la palette, qui n'a rien à voir — hors de portée du zoom.
   *
   * @param {number} demande côté voulu, en pixels
   * @returns {number} le côté réellement appliqué
   */
  function reglerCoteCase(demande) {
    const plancher = coteQuiTient();
    const borne = Math.min(COTE_CASE_MAX, Math.max(plancher, demande));
    coteCase = borne;
    grille.style.setProperty('--case-cote', `${borne}px`);
    defile.style.setProperty(
      '--fond-taille',
      `${borne * LARGEUR_EN_CASES}px ${borne * HAUTEUR_IMAGE_EN_CASES}px`,
    );
    // ⚠⚠ LE DÉCOR SE MET À L'ÉCHELLE ICI, ET NULLE PART AILLEURS. Il doit suivre
    // le zoom à la case près, sinon le mur peint se décollerait de la grille au
    // premier pincement. L'écrire dans un second point d'appel donnerait deux
    // échelles qui divergeraient — c'est la faute que `--case-cote` évite déjà
    // en n'étant écrite qu'ici.
    //
    // ⚠⚠ ET LES DEUX FACTEURS VIENNENT DE `render/fond.js`, PAS DE LA FEUILLE.
    // La largeur vaut dix cases, la hauteur VINGT — le décor est plus haut que
    // la boîte, et ce sont ces 1,5 case de débord qu'Ethan laisse passer sous
    // l'UI. Écrire ces nombres dans le CSS en ferait une seconde vérité, et le
    // jour où la base changerait de largeur le mur peint se désalignerait des
    // colonnes sans qu'un test le voie.
    return borne;
  }

  /**
   * L'écart entre deux doigts, en pixels.
   * @param {Touch[]} deux
   * @returns {number}
   */
  function ecartDesDoigts(deux) {
    return Math.hypot(deux[0].clientX - deux[1].clientX, deux[0].clientY - deux[1].clientY);
  }

  // ⚠⚠ LE PINCEMENT DE LA BASE PASSE PAR LES ÉVÈNEMENTS TACTILES, PAS PAR LES
  // POINTEURS, ET LA CARTE FAIT L'INVERSE. Ce n'est pas une incohérence, c'est
  // la différence entre les deux surfaces :
  //
  //   — la CARTE est un canevas en `touch-action: none`. Le navigateur n'a
  //     aucun geste à lui disputer, donc les évènements de pointeur y sont
  //     fiables, et `ui/monde.js` s'en sert déjà pour promener la carte.
  //
  //   — la BASE est un conteneur qui DÉFILE NATIVEMENT. Sous
  //     `touch-action: pan-x pan-y`, le navigateur garde le droit de faire
  //     défiler à deux doigts : quand il prend la main, il envoie
  //     `pointercancel` et le pincement se perd au milieu du geste. Un
  //     `touchmove` avec `preventDefault` le lui refuse pour ce geste-là
  //     seulement — le défilement à UN doigt reste natif, inertie comprise.
  //
  // Écrire les deux de la même façon aurait demandé de repeindre le défilement
  // de la base à la main, donc de perdre l'inertie, pour aligner un mécanisme
  // que rien n'oblige à l'être.
  //
  // ⚠ `{ passive: false }` EST OBLIGATOIRE : sans lui, `preventDefault` est
  // ignoré dans un `touchmove`, et la garde ci-dessus ne garde rien.

  let pincement = null;

  defile.addEventListener('touchstart', (evenement) => {
    if (evenement.touches.length !== 2) { pincement = null; return; }
    const deux = [evenement.touches[0], evenement.touches[1]];
    const ecart = ecartDesDoigts(deux);
    // Un pincement qui commence les doigts joints diviserait par presque zéro.
    if (ecart < 1) { pincement = null; return; }
    pincement = { ecart, cote: coteCase };
  }, { passive: false });

  defile.addEventListener('touchmove', (evenement) => {
    if (pincement === null || evenement.touches.length !== 2) return;
    const deux = [evenement.touches[0], evenement.touches[1]];
    // ⚠ LE FACTEUR EST LE RAPPORT DES ÉCARTS, PAS LEUR DIFFÉRENCE. Une
    // différence de pixels zoomerait plus vite sur un grand écran que sur un
    // petit, pour le même geste de la main — et le réglage trouvé sur un
    // téléphone serait faux sur la tablette suivante.
    const facteur = ecartDesDoigts(deux) / pincement.ecart;
    // ⚠ À PARTIR D'ICI, LA LARGEUR DE L'ÉCRAN NE DÉCIDE PLUS. Le joueur a réglé
    // le zoom : une rotation ne doit plus le lui reprendre.
    zoomRegleParLeJoueur = true;
    // ⚠⚠ L'ANCRE SE RELÈVE AVANT LE CHANGEMENT DE TAILLE, ET SUR LE MILIEU
    // COURANT DES DOIGTS. La relever après ne dirait plus rien : la boîte a
    // déjà grandi. Et la prendre au milieu du DÉPART ferait promener la grille
    // dès que la main se déplace, ce qu'aucun retour ne demande.
    const cadre = defile.getBoundingClientRect();
    const ancreX = (deux[0].clientX + deux[1].clientX) / 2 - cadre.left;
    const ancreY = (deux[0].clientY + deux[1].clientY) / 2 - cadre.top;
    const defilementX = defile.scrollLeft;
    const defilementY = defile.scrollTop;
    const avant = coteCase;
    const apres = reglerCoteCase(Math.round(pincement.cote * facteur));
    // ⚠⚠ LA TAILLE EST POSÉE, DONC LES BORNES SONT À JOUR — c'est tout ce qui
    // rend ce calcul juste. `scrollWidth` lu avant le changement rendrait
    // l'ancienne borne, et l'ancrage sauterait sur les bords.
    const echelle = apres / avant;
    defile.scrollLeft = defilementAncre(
      defilementX, ancreX, echelle, Math.max(0, defile.scrollWidth - defile.clientWidth),
    );
    defile.scrollTop = defilementAncre(
      defilementY, ancreY, echelle, Math.max(0, defile.scrollHeight - defile.clientHeight),
    );
    // Le pincement pilote la taille ; laisser le navigateur défiler en même
    // temps ferait glisser la grille sous les doigts pendant qu'elle grandit.
    evenement.preventDefault();
  }, { passive: false });

  function finDuPincement(evenement) {
    if (evenement.touches.length < 2) pincement = null;
  }
  defile.addEventListener('touchend', finDuPincement);
  defile.addEventListener('touchcancel', finDuPincement);

  // ⚠ LE PLANCHER SUIT LA LARGEUR DISPONIBLE. Une rotation d'écran ou
  // l'ouverture du clavier change `clientWidth` : sans ce rappel, la grille
  // resterait à une taille qui ne tient plus, et le joueur trouverait un
  // défilement horizontal qu'il n'a pas demandé.
  /**
   * La taille à appliquer quand la boîte change de largeur.
   *
   * ⚠ TANT QUE LE JOUEUR N'A PAS PINCÉ, C'EST LA TAILLE QUI TIENT. `coteQuiTient`
   * vaut `min(défaut, largeur / colonnes)` : sur un écran large la grille ouvre
   * au défaut de la feuille, sur un téléphone étroit elle se resserre juste
   * assez pour entrer. Dès qu'il a pincé, on rejoue SON côté — un zoom qui
   * s'effacerait à la rotation de l'écran serait pire que pas de zoom.
   */
  const coteASuivre = () => (zoomRegleParLeJoueur ? coteCase : coteQuiTient());

  fenetre.addEventListener('resize', () => { reglerCoteCase(coteASuivre()); });
  reglerCoteCase(coteASuivre());

  // ⚠⚠ ET CE PREMIER APPEL ARRIVE TROP TÔT — MESURÉ, PAS SUPPOSÉ. Au câblage,
  // `#chantier-defile` n'a pas encore de boîte : `clientWidth` vaut zéro, donc
  // `coteQuiTient()` retombe sur son repli, et rien ne remesure ensuite. La
  // grille restait à `--case-defaut` (46 px) quelle que soit la largeur réelle,
  // et sur un téléphone de 360 px CSS elle faisait 9 × 46 = 414 px : **deux
  // colonnes vivaient hors de l'écran, et la base défilait horizontalement au
  // repos**, ce que la consigne « tu compresses tout dans l'ui » refuse.
  // Relevé dans Chromium le 31/08, en même temps que la plage de zoom.
  //
  // ⚠ UN `resize` DE FENÊTRE NE LE RATTRAPE PAS : la fenêtre, elle, ne change
  // pas de taille entre le câblage et la première image. Ce qui change, c'est la
  // BOÎTE de l'élément, et seul un `ResizeObserver` le voit. C'est déjà le
  // mécanisme que `ui/monde.js` emploie pour son canevas.
  //
  // ⚠ IL RÉAPPLIQUE `coteCase`, PAS LE DÉFAUT. Sinon toute rotation d'écran
  // effacerait le zoom que le joueur venait de régler au doigt.
  if (typeof fenetre.ResizeObserver === 'function') {
    new fenetre.ResizeObserver(() => { reglerCoteCase(coteASuivre()); }).observe(defile);
  }

  // La bande active suit aussi le défilement à la main : les seuils se
  // déduisent de la hauteur mesurée d'une rangée, jamais d'un nombre de pixels
  // écrit en dur — la cellule est carrée, donc sa taille dépend de la largeur
  // de l'écran.
  // ⚠⚠ LE DÉFILEMENT NE CHANGE PLUS DE BANDE, IL SE BORNE — Ethan, 31/08 : « on
  // ne doit plus passer librement de la base joueur à la def joueur ». Il
  // lisait la ligne en tête et changeait `bandeCourante` en conséquence : la
  // palette se reconstruisait au milieu d'un geste, et on arrivait en défense
  // sans l'avoir demandé. Il RESTE un défilement — au zoom, une bande de huit
  // rangées ne tient plus dans le champ — mais il ne franchit plus la frontière.
  //
  // ⚠ ON CORRIGE `scrollTop` DIRECTEMENT, SANS `behavior: 'smooth'`. Une
  // correction animée depuis un évènement de défilement se poursuit pendant que
  // le doigt pousse encore, et les deux se battent.
  //
  // ⚠ ET LE GARDE-FOU DE RÉENTRANCE EST OBLIGATOIRE : écrire `scrollTop` émet un
  // nouvel évènement `scroll`. Sans lui, la correction se rappellerait elle-même.
  let enTrainDeBorner = false;
  defile.addEventListener('scroll', () => {
    if (enTrainDeBorner) return;
    const h = hauteurRangee();
    if (!(h > 0)) return;
    if (!BANDES_NAVIGABLES.includes(bandeCourante)) return;
    const bornes = bornesDeDefilement(bandeCourante, h, defile.clientHeight, paddingDeLaGrille());
    const borne = Math.min(bornes.max, Math.max(bornes.min, defile.scrollTop));
    if (Math.abs(borne - defile.scrollTop) < 0.5) return;
    enTrainDeBorner = true;
    defile.scrollTop = borne;
    // Le drapeau retombe à la prochaine boucle : l'évènement que l'écriture
    // ci-dessus provoque n'est pas synchrone.
    fenetre.setTimeout(() => { enTrainDeBorner = false; }, 0);
  });

  // ⚠⚠ LE BOUTON DE BASCULE, EN BAS À DROITE. C'est lui qui remplace le
  // défilement d'une bande à l'autre. Son glyphe se DÉDUIT — `basculeDeBande`
  // lit les lignes d'écran — pour que la flèche pointe encore du bon côté le
  // jour où la grille changerait de sens, ce qui est déjà arrivé une fois.
  const boutonBascule = $('chantier-bascule-bande');

  function marquerBascule() {
    const bascule = basculeDeBande(bandeCourante);
    boutonBascule.textContent = bascule.glyphe;
    boutonBascule.title = bascule.libelle;
    boutonBascule.setAttribute('aria-label', bascule.libelle);
  }

  boutonBascule.addEventListener('click', () => {
    allerALaBande(basculeDeBande(bandeCourante).cible);
  });

  // --- la palette des posables -----------------------------------------------
  const bandeauPalette = $('chantier-palette');

  function peindrePalette(etat) {
    bandeauPalette.textContent = '';
    // ⚠ LA PALETTE SUIT LE TERRAIN, ET C'EST LA MÊME FONCTION QUI LA DESSINE.
    // Sur la bande Défense elle propose les dix-sept pièces de garnison, sur
    // celle du Chantier les onze bâtiments. Une seconde fonction de dessin
    // aurait divergé au premier ajustement de vignette.
    const terrain = TERRAINS[terrainCourant()];
    const posables = terrain.posables(etat);
    // ⚠⚠ UNE SEULE BANDE ET UN DÉFILEMENT — ARBITRÉ PAR ETHAN LE 03/09, ET
    // C'EST L'INVERSE DU 28/08. « Faire une seule bande pour les bâtiments
    // unités à construire + une barre de défilement. Garder la hauteur, comme
    // ça les boutons seront gros. » Deux rangées dans 86 px donnaient des
    // vignettes de 38 px de haut ; une seule en donne 76, et ce qui ne tient
    // pas se défile au lieu d'être comprimé. La largeur d'une colonne et le
    // défilement vivent donc dans la FEUILLE — plus rien à calculer ici.
    // Un unique qu'on vient de poser ne quitte plus la palette, il s'y grise —
    // mais la sélection qui le désignait n'a plus d'objet et se défait, sans
    // quoi l'écran resterait en mode pose avec zéro case légale et sans rien
    // dire. Le test porte donc sur `dejaPose`, plus sur l'absence.
    if (posableChoisi !== null
      && !posables.some((p) => p.id === posableChoisi && !p.verrouille)) {
      posableChoisi = null;
    }
    for (const posable of posables) {
      const emplacement = doc.createElement('button');
      emplacement.type = 'button';
      emplacement.className = `posable ${terrain.familleDe(posable.id)}`;
      emplacement.classList.toggle('actif', posable.id === posableChoisi);
      // ⚠ LA CLASSE RESTE `pose`, POUR LES DEUX TERRAINS. Elle peint le grisé,
      // et le grisé dit la même chose des deux côtés : « celui-là, tu ne peux
      // pas le poser maintenant ». Un unique déjà posé au Chantier, une pièce
      // verrouillée par le niveau du QG en défense.
      emplacement.classList.toggle('pose', posable.verrouille);
      emplacement.title = titreDeLaVignette(terrain, posable);
      const vignette = doc.createElement('i');
      // ⚠⚠ LA PASTILLE PORTE LE SPRITE DE LA PIÈCE — Ethan, 30/08 : « dans les
      // barres de construction du bas (base def off) remplacer les carrés par
      // les sprites correspondant ». C'était un carré kaki identique pour les
      // onze bâtiments et pour les dix-sept pièces de défense.
      //
      // ⚠ ET IL VIENT DU MÊME POINT D'ENTRÉE QUE LA GRILLE, jamais d'un second
      // calcul : c'est `terrain.spriteDe` que le jeton de la case emploie déjà,
      // et une palette qui dériverait ses noms de son côté finirait par montrer
      // autre chose que ce qu'on pose. La pièce est décrite au NIVEAU 1 — c'est
      // ce qu'une pose fait — et sans voisines, donc un mur y paraît isolé.
      if (terrain.spriteDe !== null) {
        poserCouches(vignette, terrain.spriteDe(
          { id: posable.id, rangee: 0, colonne: 0, niveau: 1 }, etat,
        ));
      }
      const nom = doc.createElement('b');
      nom.textContent = posable.nom;
      emplacement.append(vignette, nom);
      emplacement.addEventListener('click', () => choisirPosable(posable.id));
      bandeauPalette.appendChild(emplacement);
    }
  }

  /**
   * Pourquoi une pièce de garnison est verrouillée. Le message NOMME le niveau
   * qui l'ouvrirait, ou dit qu'il n'y a pas de QG du tout — « un indice n'est
   * pas une interdiction » : une vignette grise qui ne répond rien n'apprend
   * rien au joueur.
   */
  function messageVerrouille(vignette) {
    // ⚠ LA RAISON VIENT DE LA VIGNETTE, ELLE NE SE RECALCULE PAS ICI. Elles
    // sont trois depuis le 29/08 — pas de QG, niveau d'apparition, bâtiment de
    // production manquant — et les redéduire dans le message aurait fait deux
    // lectures de la même règle, dont une seule serait juste au prochain ajout.
    return `${vignette.nom} — ${vignette.raison}.`;
  }

  /**
   * Ce qui plafonne le terrain courant, ou `null` s'il reste de la place.
   *
   * ⚠ DEUX PLAFONDS SANS RAPPORT, ET IL FAUT DIRE LEQUEL MORD. Le Chantier
   * borne le NOMBRE de bâtiments par ses emplacements ; la défense borne les
   * POINTS d'armée par le budget du QG. Dire « c'est plein » sans dire de quoi
   * enverrait le joueur améliorer le mauvais bâtiment.
   *
   * ⚠ ET C'EST UNE LIGNE DE MODE, PAS UN TOAST — corrigé le 28/08. Elle décrit
   * un état qui dure aussi longtemps que le mode de pose ; en toast, elle
   * s'effaçait au bout de quatre secondes et laissait reparaître « touchez une
   * case libre » alors qu'il n'y en a aucune.
   */
  function messageDuPlafond(terrain) {
    if (terrain.force === null) {
      const { poses, ouverts } = resumeDeLaBase(etatCourant).emplacements;
      return poses >= ouverts
        ? `${poses} bâtiments pour ${ouverts} emplacements : améliorer le Chantier de `
          + 'construction en ouvrira d\'autres.'
        : null;
    }
    const niveau = niveauDeCommandement(etatCourant, terrain.force);
    if (niveau === null) return 'Aucun QG de défense posé : il n\'y a pas de budget de garnison.';
    const budget = budgetDefense(niveau);
    const engages = pointsEngages(etatCourant, terrain.force);
    return engages >= budget
      ? `${formaterEntier(engages)} points engagés pour un budget de `
        + `${formaterEntier(budget)} : améliorer le QG de défense en ouvrira d'autres.`
      : null;
  }

  /**
   * Ce que le titre d'une vignette annonce, selon le terrain.
   *
   * ⚠ POSER NE COÛTE RIEN DES DEUX CÔTÉS, et les deux le disent. Le niveau 1
   * est gratuit pour les onze bâtiments (`premierNiveauPayant` vaut 2) et Ethan
   * l'a redit le 28/08 pour les unités : « une unité posée en def ou off est
   * niveau 1 et gratuit ». Ce que le titre porte, c'est ce que coûtera la
   * SUITE — un nombre pour un bâtiment, des points d'armée pour une pièce de
   * garnison, qui se paient sur le budget et non sur les stocks.
   */
  function titreDeLaVignette(terrain, posable) {
    // ⚠ LE TERRAIN EST PASSÉ, IL NE SE DEVINE PAS. Une première écriture
    // distinguait les deux cas sur `posable.points === undefined` — c'est-à-dire
    // sur la FORME de l'objet, pas sur ce qu'il est. Le jour où une vignette de
    // bâtiment porterait des points pour une raison sans rapport, elle aurait
    // basculé de titre toute seule.
    if (posable.verrouille) {
      return terrain.force === null
        ? `${posable.nom} — déjà posé, et il est unique.`
        : `${posable.nom} — ${posable.raison}.`;
    }
    return terrain.force === null
      ? `${posable.nom} — poser au niveau 1 est gratuit ; la première `
        + `amélioration coûtera ${posable.coutPremiereAmelioration}.`
      : `${posable.nom} — ${formaterEntier(posable.points)} points d'armée, `
        + 'poser au niveau 1 est gratuit.';
  }

  /**
   * Le joueur choisit — ou déchoisit — un bâtiment à poser.
   * Retoucher celui qui est actif défait la sélection : c'est le seul moyen de
   * sortir du mode pose sans poser, et il faut qu'il existe.
   */
  function choisirPosable(id) {
    // ⚠ UNE VIGNETTE GRISÉE RÉPOND, ELLE N'EST PAS INERTE. « Un indice n'est pas
    // une interdiction » (CLAUDE.md §4) : le joueur qui touche un unique déjà
    // posé a le droit de savoir POURQUOI il ne se pose pas, plutôt que d'appuyer
    // sur un bouton qui ne fait rien.
    const terrain = TERRAINS[terrainCourant()];
    const vignette = terrain.posables(etatCourant).find((p) => p.id === id);
    if (vignette !== undefined && vignette.verrouille) {
      toast(terrain.force === null
        ? `${vignette.nom} est unique, et il est déjà posé.`
        : messageVerrouille(vignette));
      return;
    }
    // Choisir un posable désarme l'action : un seul mode à la fois.
    if (actionArmee !== null) {
      actionArmee = null;
      marquerBoutonsAction();
    }
    // Changer de bâtiment défait l'aperçu : il montrait l'ancien.
    poseEnAttente = null;
    deplacementEnCours = null;
    posableChoisi = posableChoisi === id ? null : id;
    if (posableChoisi === null) {
      ligneDeMode('');
      peindrePalette(etatCourant);
      marquerCasesLegales();
      peindreApercu();
      return;
    }

    // ⚠ LE JOUEUR DOIT COMPRENDRE AVANT DE TOUCHER UNE CASE. Sans emplacement
    // libre, toutes les cases sont illégales : le laisser en essayer une pour
    // qu'on lui dise non serait le faire travailler pour rien.
    // ⚠ LA SATURATION SE DIT ICI, AU CHOIX DU BÂTIMENT — plus dans un compteur.
    // Le bandeau d'emplacements a disparu avec la barre de gauche (arbitré le
    // 27/08), et c'était lui qui annonçait la base pleine. Le joueur doit
    // l'apprendre AVANT de chercher une case, pas en essayant.
    // ⚠ LA SATURATION EST UNE LIGNE DE MODE, PAS UN TOAST — corrigé le 28/08 à
    // la relecture. Elle décrit un état qui dure exactement aussi longtemps que
    // le mode de pose : un toast s'effaçait au bout de quatre secondes et
    // laissait reparaître « touchez une case libre » alors qu'il n'y en a
    // aucune. Le message qui reste est celui qui est vrai.
    ligneDeMode(messageDuPlafond(terrain) ?? messageDePose(terrain.nomDe(posableChoisi)));
    peindrePalette(etatCourant);
    marquerCasesLegales();
    peindreApercu();
  }

  /**
   * Distingue à l'écran les cases où le bâtiment choisi peut se poser — c'est
   * la GRILLE que le joueur voit.
   *
   * ⚠⚠ LES TROIS MODES LA MONTRENT, ET UN SEUL MÉCANISME LA MONTRE. Ethan,
   * 04/09 : « Une grille apparaît quand on déplace un bâtiment et disparaît
   * ensuite. Faire de même lorsque l'on construit un bâtiment et sur défense. »
   * Elle s'arme donc au déplacement, à la pose, et sur les DEUX bandes ;
   * l'arbitrage du 27/08 qui la réservait au Collecteur est levé.
   *
   * ⚠⚠ ET ELLE DISPARAÎT PARCE QUE CETTE FONCTION COMMENCE PAR LA RETIRER DE
   * TOUTES LES CASES. C'est la moitié du retour d'Ethan — « et disparaît
   * ensuite » —, et c'est ce qui interdit d'écrire un second afficheur : deux
   * chemins montreraient la grille, un seul la retirerait. Elle est rappelée à
   * chaque changement de bande, à chaque choix de palette, à chaque armement
   * d'action et à chaque peinture ; les quatre portes d'annulation passent donc
   * par elle.
   *
   * ⚠ C'EST L'AFFICHAGE QUI CHANGE, PAS LA RÈGLE. `problemesDeLaPose` est
   * interrogée exactement comme avant au moment de poser, et une case illégale
   * dit toujours pourquoi.
   */
  /**
   * Le bâtiment en aperçu et les flèches de bonus de proximité.
   *
   * ⚠ TROIS SITUATIONS, UNE SEULE FONCTION. Les flèches se montrent pour un
   * bâtiment en APERÇU (pose en deux temps), pour un bâtiment EN MAIN
   * (déplacement), et pour le bâtiment dont le PANNEAU est ouvert. Les écrire
   * trois fois donnerait trois lectures du voisinage ; on fabrique une
   * disposition candidate et on demande au moteur, comme partout ailleurs.
   */
  function peindreApercu() {
    for (const case_ of cellules.values()) {
      case_.querySelector('.fantome')?.remove();
    }
    traits.textContent = '';
    if (etatCourant === null) return;

    let disposition = null;
    let index = -1;
    let fantome = null;
    // ⚠ LES FLÈCHES DE VOISINAGE N'EXISTENT QUE POUR LES BÂTIMENTS. Le bonus de
    // proximité est une grandeur de `sim/disposition.js`, qui ne connaît que la
    // base : une pièce de garnison n'en porte aucun. Le FANTÔME, lui, se
    // dessine des deux côtés — c'est lui qui fait les deux touchers.
    let terrainDuFantome = terrainCourant();

    if (posableChoisi !== null && poseEnAttente !== null) {
      fantome = { ...poseEnAttente, id: posableChoisi };
      if (terrainDuFantome === 'batiments') {
        disposition = [...baseCourante(etatCourant).disposition,
          { id: posableChoisi, ...poseEnAttente, niveau: 1 }];
        index = disposition.length - 1;
      }
    } else if (deplacementEnCours !== null) {
      terrainDuFantome = terrainDeplacement;
      if (terrainDeplacement === 'batiments') {
        disposition = baseCourante(etatCourant).disposition;
        index = deplacementEnCours;
      }
    } else if (panneauOuvert && selection !== null && terrainSelection === 'batiments') {
      // ⚠ ETHAN : « faire apparaître les flèches du bâtiment concerné quand on
      // ouvre l'onglet bâtiment ». Le panneau CHIFFRE le voisinage ; les
      // flèches le montrent sur la grille, et les deux viennent du même calcul.
      disposition = baseCourante(etatCourant).disposition;
      index = selection;
    }
    if (fantome !== null) {
      const case_ = cellules.get(cle(fantome.rangee, fantome.colonne));
      if (case_ !== undefined) {
        const terrain = TERRAINS[terrainDuFantome];
        const marque = doc.createElement('div');
        marque.className = 'fantome';
        // ⚠⚠ LE FANTÔME PORTE LE SPRITE, PLUS UN SIGLE — 31/08. Il montrait
        // trois lettres sur un fond plein, ce qui datait du 28/08, quand la
        // grille ne dessinait encore aucun sprite. Depuis, la case voisine
        // montre le vrai bâtiment : le fantôme était le dernier carré de
        // l'écran, et il ne disait plus CE QU'ON ALLAIT POSER. Ethan l'a relevé
        // le 31/08.
        //
        // ⚠ ET IL VIENT DU MÊME POINT D'ENTRÉE QUE LA CASE ET QUE LA VIGNETTE
        // DE PALETTE — `terrain.spriteDe`, jamais un second calcul. Une
        // troisième lecture des noms de sprite finirait par montrer, à l'aperçu,
        // autre chose que ce que la pose dessine. La pièce est décrite au
        // NIVEAU 1, qui est ce qu'une pose fait.
        if (terrain.spriteDe !== null) {
          poserCouches(marque, terrain.spriteDe({ ...fantome, niveau: 1 }, etatCourant));
        }
        // ⚠ LE SIGLE NE SORT PAS DU JEU, IL PASSE DANS LE `title`. C'est ce que
        // le dépôt a déjà fait de la lettre de l'obstacle et du cadre de famille
        // du jeton : Ethan demande un DESSIN en moins, pas une donnée.
        marque.title = terrain.sigleDe(fantome.id);
        case_.appendChild(marque);
      }
    }

    if (disposition === null) return;

    for (const f of flechesDeVoisinage(disposition, baseCourante(etatCourant).champs, index)) {
      const trait = traitDeVoisinage(f.depart, f.arrivee);
      const fut = doc.createElementNS(SVG, 'line');
      fut.setAttribute('x1', trait.ligne.x1);
      fut.setAttribute('y1', trait.ligne.y1);
      fut.setAttribute('x2', trait.ligne.x2);
      fut.setAttribute('y2', trait.ligne.y2);
      fut.setAttribute('stroke-width', trait.epaisseur);
      fut.setAttribute('stroke-linecap', 'round');
      fut.setAttribute('class', 'trait');
      const pointe = doc.createElementNS(SVG, 'polygon');
      pointe.setAttribute('points', trait.pointe.map(([x, y]) => `${x},${y}`).join(' '));
      pointe.setAttribute('class', 'pointe');
      // L'infobulle porte le glyphe : c'est la seule chose que le trait ne dit
      // pas à voix haute, et elle reste utile au survol comme au clavier.
      const titre = doc.createElementNS(SVG, 'title');
      titre.textContent = `${f.glyphe} ${f.libelle} · ${formaterDebit(f.apportMilli)}`;
      const groupe = doc.createElementNS(SVG, 'g');
      groupe.append(titre, fut, pointe);
      traits.appendChild(groupe);
    }
  }

  function marquerCasesLegales() {
    for (const case_ of cellules.values()) case_.classList.remove('legale');
    if (etatCourant === null) return;
    // ⚠ PENDANT UN DÉPLACEMENT, TOUTES LES ARRIVÉES SE CERCLENT. Ici le joueur
    // n'a pas choisi un TYPE de bâtiment mais un bâtiment PRÉCIS, et il doit
    // voir où celui-là peut aller : la règle du collecteur ci-dessous ne
    // s'applique pas, elle sert à ne pas cercler soixante cases identiques.
    if (deplacementEnCours !== null) {
      const cases = casesDeplacablesDuTerrain(etatCourant, terrainDeplacement, deplacementEnCours);
      for (const { rangee, colonne } of cases) {
        cellules.get(cle(rangee, colonne))?.classList.add('legale');
      }
      return;
    }
    if (posableChoisi === null) return;
    // ⚠⚠ ON CERCLE TOUT CE QUI EST LÉGAL, ET C'EST UN RETOUR SUR L'ARBITRAGE DU
    // 30/08. Ce bloc portait « on ne cercle que quand ça apprend quelque chose »
    // et se limitait au Collecteur, seul bâtiment dont le TERRAIN décide
    // (`posableDessus` des champs ne contient que lui) : pour les autres, cercler
    // soixante cases sur soixante-douze était jugé bavard. Ethan, 04/09 : « Une
    // grille apparaît quand on déplace un bâtiment et disparaît ensuite. Faire
    // de même lorsque l'on construit un bâtiment et sur défense. » Les liserés
    // SONT cette grille : soixante cases cerclées se lisent comme un quadrillage,
    // pas comme soixante indications.
    //
    // ⚠ ET C'EST LA MÊME LIGNE QUI SERT LES TROIS MODES — déplacement plus haut,
    // pose ici, sur les DEUX bandes, `terrainCourant()` décidant laquelle. Un
    // second mécanisme d'affichage à côté de celui-ci donnerait deux chemins qui
    // montrent la grille et un seul qui la retire.
    const terrain = terrainCourant();
    for (const { rangee, colonne } of casesPosablesDuTerrain(etatCourant, terrain, posableChoisi)) {
      cellules.get(cle(rangee, colonne))?.classList.add('legale');
    }
  }

  // --- le son ----------------------------------------------------------------

  /**
   * Signale un GESTE du joueur. L'écran ne nomme aucun son.
   *
   * ⚠ IL NE PART QUE D'UN GESTE, JAMAIS D'UN REPEINT. `selectionner` est appelée
   * par `peindre` et par `rafraichir`, qui passent dix fois par seconde : y
   * accrocher le son ferait un déclic continu. Les points d'appel sont les
   * quatre endroits où le DOIGT a agi, et un test les compte.
   */
  function sonner(geste, terrain, id) {
    if (sonDeGeste === undefined) return;
    sonDeGeste(geste, { genre: TERRAINS[terrain].genreSonore, id });
  }

  // --- la sélection ----------------------------------------------------------

  function selectionner(index) {
    selection = index;
    for (const case_ of cellules.values()) case_.classList.remove('choisie');
    if (index === null || etatCourant === null) {
      $('chantier-selection-nom').textContent = '—';
      $('chantier-selection-detail').textContent = 'aucun bâtiment sélectionné';
      $('chantier-ameliorer-cible').textContent = '';
      fermerPanneau();
      return;
    }
    const terrain = TERRAINS[terrainSelection];
    const b = terrain.pieces(etatCourant)[index];
    // ⚠ UN INDICE SURVIT MAL À UN CHANGEMENT DE TERRAIN. Il vaut mieux ne rien
    // sélectionner que de désigner la troisième pièce de la mauvaise liste.
    if (b === undefined) {
      selection = null;
      selectionner(null);
      return;
    }
    const detail = terrain.detail(etatCourant, index);
    cellules.get(cle(b.rangee, b.colonne))?.classList.add('choisie');
    $('chantier-selection-nom').textContent = detail.nom;
    $('chantier-selection-detail').textContent = detail.detail;
    // ⚠ « VERS NIV. N+1 » NE S'ÉCRIT QUE LÀ OÙ AMÉLIORER EXISTE. Sur une pièce
    // de garnison, le moteur ne monte rien : annoncer un niveau visé promettrait
    // un geste que le bouton refuse ensuite.
    $('chantier-ameliorer-cible').textContent = terrain.actions.ameliorer === null
      ? '' : `vers niv. ${b.niveau + 1}`;
    // ⚠ ET LE PANNEAU SE FERME SI LE TERRAIN N'EN A PAS. Sans ça, un panneau
    // resté ouvert sur un bâtiment se repeindrait avec un indice qui pointe
    // maintenant dans la garnison : il chiffrerait la production d'un mur.
    if (!terrain.panneau) fermerPanneau();
    // Le panneau suit la sélection quand il est ouvert ; il ne s'ouvre pas de
    // lui-même — voir `ouvrirPanneau`.
    peindrePanneau();
    // ⚠ LES BOUTONS NE DÉPENDENT PLUS DE LA SÉLECTION. Le modèle est « armer
    // puis toucher » : c'est le bouton qu'on touche EN PREMIER, donc il doit
    // être vif avant qu'un bâtiment soit choisi. La sélection ne sert plus qu'à
    // LIRE — nom, niveau, débit — et l'action, elle, désigne sa cible du doigt.
  }

  // -------------------------------------------------------------------------
  // Les actions : armer, puis toucher
  // -------------------------------------------------------------------------

  /**
   * Reflète le mode courant sur les quatre boutons — et sur la barre de
   * réparation, qui n'existe à l'écran que pendant le mode Réparer.
   *
   * ⚠⚠ LE POINT EST UNIQUE, ET IL LE FAUT. Cette fonction est appelée aux SEPT
   * endroits où le mode peut changer — armement, exécution, câblage,
   * chargement, abandon d'un déplacement. Montrer la barre depuis `armer` et la
   * cacher depuis `executerAction` aurait laissé les cinq autres chemins
   * l'oublier, et la barre serait restée à l'écran après un refus.
   */
  function marquerBoutonsAction() {
    for (const [nom, action] of Object.entries(ACTIONS)) {
      $(action.bouton).classList.toggle('arme', actionArmee === nom);
    }
    // ⚠ « TOUT RÉPARER » N'APPARAÎT QUE LE MODE RÉPARER ARMÉ — Ethan, 01/09, sur
    // l'écran de raid ; c'est la même discipline, sur l'autre écran.
    const barre = $('chantier-reparation');
    if (barre === null) return;
    barre.hidden = actionArmee !== 'reparer';
    if (!barre.hidden) ecrireLaReserve();
  }

  /**
   * Écrit la réserve des bâtiments et ce qu'elle permet.
   *
   * ⚠⚠ `plafondDeLaReserveDesBatiments` LÈVE SUR UNE DISPOSITION VIDE, elle ne
   * rend pas zéro — et elle a raison : une base sans un seul bâtiment n'existe
   * pas, `problemesDeDisposition` refuse `sans-chantier`. L'écran, lui, se peint
   * AVANT que l'état soit là (`etatCourant` vaut `null` au câblage) et pendant
   * un chargement raté. On regarde donc, plutôt que de l'appeler à l'aveugle.
   *
   * ⚠ ET LE DEVIS EST CELUI DU MOTEUR. `devisDeLaReparationDesBatiments` somme
   * des ARRONDIS parce que `toutReparerLesBatiments` débite bâtiment par
   * bâtiment ; le recalculer ici annoncerait un prix que l'opération ne pratique
   * pas — jusqu'à cinq unités d'écart à onze bâtiments.
   */
  function ecrireLaReserve() {
    const ligne = $('chantier-reserve');
    if (ligne === null) return;
    if (etatCourant === null || baseCourante(etatCourant).disposition.length === 0) {
      ligne.textContent = '—';
      return;
    }
    const laBase = baseCourante(etatCourant);
    const plafond = plafondDeLaReserveDesBatiments(laBase);
    // ⚠ UN STOCK S'ARRONDIT VERS LE BAS. `direLaDuree` le prend en argument
    // depuis ce lot : annoncer « 5 min » de réserve pour 4 min 10 s ferait
    // tenter une réparation que le moteur refuserait.
    const reserve = `Réserve : ${direLaDuree(laBase.reserveReparationBatiments, Math.floor)}`
      + ` / ${direLaDuree(plafond, Math.floor)}`;
    const devis = devisDeLaReparationDesBatiments(etatCourant);
    ligne.textContent = devis.batiments === 0 ? `${reserve} · base intacte`
      : `${reserve} · ${devis.batiments} à réparer :`
        + ` ${formaterEntier(devis.quartz)} q · ${direLaDuree(devis.ticks)}`;
  }

  /**
   * Désarme l'action courante et efface son mot.
   *
   * ⚠ LES TROIS LIGNES ÉTAIENT ÉCRITES QUATRE FOIS À L'IDENTIQUE, ET LE LOT
   * RÉPARER-ÉCRAN EN AURAIT ÉCRIT UNE CINQUIÈME. Trois gestes qui doivent
   * toujours aller ensemble — l'état, le mot, les boutons — recopiés à cinq
   * endroits, c'est exactement la forme que prend une divergence quand elle
   * commence : le jour où le désarmement devra faire une quatrième chose, un
   * des cinq sites l'oubliera.
   */
  function desarmerLAction() {
    actionArmee = null;
    ligneDeMode('');
    marquerBoutonsAction();
  }

  /**
   * Arme — ou désarme — une action.
   *
   * Trois règles, toutes arbitrées le 27/08 :
   *   — retoucher l'action armée la désarme ;
   *   — armer une action désarme l'autre : un seul mode à la fois ;
   *   — armer une action défait aussi la palette, pour la même raison.
   */
  function armer(nom) {
    const memeQueAvant = actionArmee === nom;
    actionArmee = memeQueAvant ? null : nom;
    // Un bâtiment en main est lâché dès qu'on change de mode : le garder ferait
    // que le prochain toucher le téléporterait sans qu'on l'ait redemandé.
    deplacementEnCours = null;
    if (actionArmee !== null && posableChoisi !== null) {
      posableChoisi = null;
      poseEnAttente = null;
      peindrePalette(etatCourant);
    }
    marquerCasesLegales();
    peindreApercu();
    // ⚠ ON N'EFFACE PLUS LA LIGNE, ON Y ÉCRIT. Un `avis('')` tenait ici, et il
    // ne faisait pas que ne rien dire : il effaçait l'alerte de la session au
    // passage. Le mode s'annonce, le toast en cours suit sa propre échéance.
    ligneDeMode(actionArmee === null ? '' : MESSAGES_MODE[actionArmee]);
    marquerBoutonsAction();
  }

  /**
   * Exécute l'action armée sur le bâtiment d'indice `index`.
   *
   * ⚠ ON DEMANDE, PUIS ON AGIT — jamais de `try` autour de `ameliorer` ou de
   * `demolir`. Elles LÈVENT, et la levée est un fait de PROGRAMME : l'écran
   * n'aurait pas dû appeler sans regarder. La liste rendue par `problemes…` est
   * un fait de JEU, et c'est elle qu'on montre.
   *
   * ⚠ LES MESSAGES DU MOTEUR SONT REPRIS TELS QUELS. Ils sont déjà écrits en
   * français et déjà chiffrés — « il manque 14 de quartz ». Les reformuler ici
   * créerait une seconde formulation qui finirait par dire autre chose.
   */
  function executerAction(index, terrainCible) {
    const nom = actionArmee;
    // ⚠ L'ACTION VIENT DU TERRAIN, PAS D'UNE TABLE UNIQUE. Améliorer un
    // bâtiment et retirer un mur ne passent pas par les mêmes fonctions du
    // moteur ; `TERRAINS[x].actions` dit lesquelles, et le terrain des
    // bâtiments y met `ACTIONS` telle quelle, sans la recopier.
    const action = TERRAINS[terrainCible].actions[nom];
    // Quoi qu'il arrive, le mode se désarme : réussite comme refus. Sa ligne
    // tombe avec lui — elle décrivait ce que le prochain toucher ferait, et il
    // vient d'avoir lieu.
    desarmerLAction();

    // ⚠⚠ IL N'Y A PLUS QU'UNE FORME SANS MOTEUR, ET C'EST `null` — lot
    // RÉPARER-ÉCRAN, 05/09. La branche `action.problemes === undefined` est
    // partie avec `messagePasDeReparation` : elle existait pour la seule action
    // qui n'avait de moteur NULLE PART, et Réparer en a un depuis le lot
    // RÉSERVE-BASE. Il ne reste que le cas du TERRAIN qui n'en a pas alors qu'un
    // autre en a — la garnison, que le Complexe de défense répare tout seul. Le
    // bouton répond, il ne reste jamais muet : « un indice n'est pas une
    // interdiction » (CLAUDE.md §4).
    if (action === null) {
      toast(actionSansMoteur(ACTIONS[nom].libelle, TERRAINS[terrainCible].pourQui));
      return;
    }

    const problemes = action.problemes(etatCourant, index);
    if (problemes.length > 0) {
      toast(messageDeRefus(problemes));
      return;
    }

    // ⚠ LE SON PART AVANT `agir` POUR LE RETRAIT, ET IL LE FAUT : après, la
    // pièce n'est plus dans la liste et son identifiant — donc la taille de son
    // effondrement — ne se lit plus nulle part.
    const pieceAgie = TERRAINS[terrainCible].pieces(etatCourant)[index];
    sonner(ACTIONS[nom].geste, terrainCible, pieceAgie?.id);
    action.agir(etatCourant, index);
    terrainSelection = terrainCible;
    // Une action qui retire la pièce laisse un indice qui ne désigne plus rien,
    // ou pis, désigne sa voisine. On le lâche plutôt que de le laisser mentir.
    selection = ACTIONS[nom].retireLaPiece === true ? null : index;
    peindre(etatCourant);
    rafraichir(etatCourant);
    if (apresPose !== undefined) apresPose(etatCourant);
  }

  grille.addEventListener('click', (evenement) => {
    const case_ = evenement.target.closest('.case');
    if (case_ === null || etatCourant === null) return;
    const rangee = Number(case_.dataset.rangee);
    const colonne = Number(case_.dataset.colonne);

    // ⚠ LA CASE TOUCHÉE DIT DANS QUELLE LISTE CHERCHER. Depuis que la bande
    // Défense est éditable, l'occupant d'une case est un bâtiment OU une pièce
    // de garnison selon la bande — chercher dans `disposition` partout
    // renverrait « case vide » sur tout un mur de défense.
    const terrainTouche = terrainDeLaRangee(rangee);
    const index = TERRAINS[terrainTouche].pieces(etatCourant).findIndex(
      (b) => b.rangee === rangee && b.colonne === colonne,
    );

    // ⚠ LE DÉPLACEMENT PASSE AVANT, PARCE QU'IL A DEUX TEMPS. `ACTIONS` le dit
    // par son champ `cible` : l'écran ne traite pas « déplacer » comme un cas
    // particulier écrit à la main, il lit la table.
    if (actionArmee !== null && ACTIONS[actionArmee].cible === true) {
      tenterLeDeplacement(rangee, colonne, index);
      return;
    }

    if (actionArmee !== null) {
      // ⚠ UNE CASE VIDE DÉSARME SANS RIEN DIRE. C'est le geste « à côté du
      // menu » : le joueur a changé d'avis, il n'a pas commis d'erreur. Un
      // toast le gronderait pour rien.
      if (index === -1) {
        actionArmee = null;
        ligneDeMode('');
        marquerBoutonsAction();
        return;
      }
      executerAction(index, terrainTouche);
      return;
    }

    if (posableChoisi !== null) {
      tenterLaPose(rangee, colonne);
      return;
    }
    if (index === -1) {
      selectionner(null);
      return;
    }
    terrainSelection = terrainTouche;
    // ⚠ LE PANNEAU NE S'OUVRE QUE POUR UN BÂTIMENT, ET C'EST LA TABLE QUI LE
    // DIT. Il chiffre production, capacité, voisinage et coût d'amélioration :
    // une pièce de garnison n'a rien de tout ça, et lui ouvrir un panneau vide
    // ferait croire à un écran cassé. Le bandeau contextuel, lui, dit son nom,
    // son niveau et ses points — c'est tout ce qu'il y a à dire.
    sonner('selection', terrainTouche);
    if (TERRAINS[terrainTouche].panneau) {
      ouvrirPanneau(index);
      return;
    }
    selectionner(index);
  });

  for (const nom of Object.keys(ACTIONS)) {
    $(ACTIONS[nom].bouton).addEventListener('click', () => armer(nom));
  }

  // ⚠⚠ « TOUT RÉPARER » EST UN BOUTON DIRECT, PAS UNE CINQUIÈME ENTRÉE
  // D'`ACTIONS` — lot RÉPARER-ÉCRAN, 05/09. `ACTIONS` est le registre du modèle
  // « armer puis toucher » : chacune de ses lignes attend un doigt sur une case.
  // Un geste GLOBAL n'a rien à y désigner, et l'y mettre lui donnerait un bouton
  // du bandeau contextuel, un mode et une ligne d'invite pour un geste qui n'en
  // a pas besoin. `src/ui/raid.js` a le précédent depuis le 01/09.
  const toutReparer = $('chantier-tout-reparer');
  if (toutReparer !== null) {
    toutReparer.addEventListener('click', () => {
      if (etatCourant === null) return;
      // ⚠⚠ ON PASSE PAR `problemesDeToutReparerLesBatiments` POUR SON SEUL CODE
      // `rien-a-reparer`, JAMAIS POUR SON VERDICT DE PRIX. Elle juge le devis
      // TOTAL : elle refuserait les trente-neuf bâtiments payables parce que le
      // quarantième est hors de portée, alors que `toutReparerLesBatiments` est
      // écrite pour l'inverse — elle fait ce qu'elle peut et COMPTE le reste.
      // Ce serait plus sévère que l'armée, pour la même mécanique.
      const rien = problemesDeToutReparerLesBatiments(etatCourant)
        .find((p) => p.code === 'rien-a-reparer');
      if (rien !== undefined) { toast(rien.message); desarmerLAction(); return; }

      const bilan = toutReparerLesBatiments(etatCourant);
      desarmerLAction();
      peindre(etatCourant);
      rafraichir(etatCourant);
      if (apresPose !== undefined) apresPose(etatCourant);
      // ⚠ ET LE BILAN SE DIT, MÊME À ZÉRO RÉPARÉ. Sans lui, une réserve à sec
      // rendrait un écran qui ne bouge pas : le joueur croirait le bouton mort.
      // `raid.js` dit déjà la même chose de l'armée, dans la même forme.
      if (bilan.reparees === 0) {
        toast(`Aucune réparation payable : ${bilan.impayables} bâtiment(s)`
          + ' hors de portée de la réserve ou du quartz.');
      } else if (bilan.impayables === 0) {
        toast(`${bilan.reparees} bâtiment(s) réparé(s)`
          + ` pour ${formaterEntier(bilan.quartz)} de quartz.`);
      } else {
        toast(`${bilan.reparees} réparé(s), ${bilan.impayables} hors de portée`
          + ' de la réserve ou du quartz.');
      }
    });
  }
  marquerBoutonsAction();

  // -------------------------------------------------------------------------
  // Le panneau de détail — ce qu'un bâtiment fait, et ce qu'il ferait plus haut
  // -------------------------------------------------------------------------
  //
  // ⚠ IL RÉPOND À UNE DEMANDE PRÉCISE D'ETHAN, le 28/08 : « quand on clique sur
  // un bâtiment on doit ouvrir un onglet et voir sa production détaillée, sa
  // production théorique en cas d'amélioration, un bouton amélioration avec les
  // coûts induits ». Les trois y sont, et ils viennent tous du moteur.
  //
  // ⚠ IL S'OUVRE AU TOUCHER, PAS À LA SÉLECTION. `peindre()` sélectionne le
  // Chantier d'office à la première image ; ouvrir sur une sélection ferait
  // reparaître le panneau après chaque pose et après chaque amélioration, par-
  // dessus la grille que le joueur regarde. Il s'ouvre quand on touche, il se
  // ferme quand on touche à côté ou sur sa croix, et entre les deux il SUIT.
  //
  // ⚠ SON BOUTON AGIT DIRECTEMENT, SANS ARMER. « Armer puis toucher » existe
  // parce que les boutons du bandeau contextuel n'ont pas de cible ; celui-ci
  // en a une — le bâtiment dont le panneau parle — et lui demander de viser
  // ensuite serait un geste pour rien.
  const panneau = $('chantier-panneau');
  let panneauOuvert = false;
  // La dernière vue rendue, pour ne pas reconstruire quinze éléments dix fois
  // par seconde. Le panneau doit quand même suivre le temps : la note du bouton
  // passe de « il manque 8 de quartz » à « 8 quartz » quand le stock arrive, et
  // c'est le moment le plus utile de tout l'écran.
  let derniereVue = null;

  function peindrePanneau() {
    if (!panneauOuvert || selection === null || etatCourant === null) return;
    // Garde de ceinture : `selectionner` ferme déjà le panneau sur un terrain
    // qui n'en a pas, mais `rafraichir` passe ici dix fois par seconde et une
    // seule image peinte avec le mauvais indice suffirait à mentir.
    if (!TERRAINS[terrainSelection].panneau) return;
    // ⚠⚠ LA VUE SE DEMANDE AU TERRAIN, ET C'EST CE QUI OUVRE LE PANNEAU À LA
    // DÉFENSE. Un `terrainSelection === 'defense' ? … : …` écrit ici serait le
    // cas particulier que la table existe pour éviter, et qu'un test refuse
    // déjà pour les gestes.
    const vue = TERRAINS[terrainSelection].vueDuPanneau(etatCourant, selection);
    const signature = JSON.stringify(vue);
    if (signature === derniereVue) return;
    derniereVue = signature;

    peindreVueDuPanneau(doc, {
      titre: $('chantier-panneau-titre'),
      corps: $('chantier-panneau-corps'),
      bouton: $('chantier-panneau-ameliorer'),
    }, vue);
  }

  function ouvrirPanneau(index) {
    panneauOuvert = true;
    panneau.hidden = false;
    derniereVue = null;
    selectionner(index);
    // ⚠ ETHAN : « faire apparaître les flèches du bâtiment concerné quand on
    // ouvre l'onglet bâtiment ». Le panneau chiffre le voisinage, les flèches
    // le montrent sur la grille — deux vues du même calcul.
    peindreApercu();
  }

  function fermerPanneau() {
    panneauOuvert = false;
    panneau.hidden = true;
    derniereVue = null;
    // Les flèches partent avec le panneau : elles décrivaient SON bâtiment.
    peindreApercu();
  }

  // ⚠ L'ÉTAT INITIAL EST POSÉ ICI, PAS SEULEMENT DANS LE BALISAGE. Le `hidden`
  // du HTML suffit aujourd'hui, mais il est la seule chose qui tienne le
  // panneau fermé au premier affichage : `peindre()` sélectionne le Chantier
  // d'office, donc `fermerPanneau()` n'est jamais appelé sur ce chemin. Un
  // attribut oublié à la prochaine reprise du balisage ouvrirait le panneau
  // au démarrage, par-dessus la grille, sans qu'aucun test le voie.
  fermerPanneau();
  $('chantier-panneau-fermer').addEventListener('click', fermerPanneau);

  // ⚠ ON DEMANDE, PUIS ON AGIT — même règle que `tenterLaPose` et
  // `executerAction`, et jamais de `try` autour d'`ameliorer`.
  $('chantier-panneau-ameliorer').addEventListener('click', () => {
    if (selection === null || etatCourant === null) return;
    // ⚠⚠ LE BOUTON PASSE PAR LA TABLE DEPUIS LE LOT ERGONOMIE, ET C'ÉTAIT UN
    // DÉFAUT LATENT. Il appelait `problemesDeLAmelioration` et `ameliorer` — les
    // fonctions des BÂTIMENTS — en dur : juste tant que le panneau ne s'ouvrait
    // que sur eux, faux à la seconde où il s'ouvre sur une pièce de garnison. Il
    // aurait amélioré le bâtiment de même indice pendant que le panneau parlait
    // d'une tourelle, et rien à l'écran ne l'aurait dit.
    const action = TERRAINS[terrainSelection].actions.ameliorer;
    const problemes = action.problemes(etatCourant, selection);
    if (problemes.length > 0) {
      toast(messageDeRefus(problemes));
      return;
    }
    sonner('amelioration', terrainSelection,
      TERRAINS[terrainSelection].pieces(etatCourant)[selection]?.id);
    action.agir(etatCourant, selection);
    // Une amélioration change les emplacements et les débits : elle s'écrit
    // tout de suite, comme une pose.
    if (apresPose !== undefined) apresPose(etatCourant);
    peindre(etatCourant);
    rafraichir(etatCourant);
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
    // ⚠ LE TERRAIN VIENT DE LA PALETTE, PAS DE LA CASE TOUCHÉE. C'est la
    // vignette choisie qui dit ce qu'on pose ; si le doigt tombe dans l'autre
    // bande, le moteur refuse et DIT pourquoi — « hors de la base » d'un côté,
    // « rangée hors de 3…10 » de l'autre. Deviner le terrain d'après la case
    // poserait un mur à la place d'un collecteur sur un simple défilement.
    const terrain = TERRAINS[terrainCourant()];
    const problemes = terrain.problemesDeLaPose(etatCourant, posableChoisi, rangee, colonne);
    if (problemes.length > 0) {
      // La sélection RESTE : le joueur voulait poser, il a visé à côté. La lui
      // retirer l'obligerait à la refaire pour réessayer. L'aperçu, lui, tombe :
      // il montrerait un emplacement que le joueur vient d'abandonner.
      toast(messageDeRefus(problemes));
      poseEnAttente = null;
      peindreApercu();
      return;
    }

    // ⚠ PREMIER TOUCHER : ON MONTRE. Arbitré le 28/08 — « il y a d'abord un
    // clic et le bâtiment en transparent, et les flèches bonus proximité
    // s'affichent si il y en a, un deuxième clic pose le bâtiment ». C'est ce
    // temps-là qui rend le voisinage visible AVANT de s'engager.
    const memeCase = poseEnAttente !== null
      && poseEnAttente.rangee === rangee && poseEnAttente.colonne === colonne;
    if (!memeCase) {
      poseEnAttente = { rangee, colonne };
      ligneDeMode(messageDeConfirmation(terrain.nomDe(posableChoisi)));
      peindreApercu();
      return;
    }
    poseEnAttente = null;

    sonner('pose', terrainCourant(), posableChoisi);
    terrain.poser(etatCourant, posableChoisi, rangee, colonne);
    // ⚠ SAUVEGARDER AVANT DE REPEINDRE, et l'ordre s'est resserré à ce lot.
    // C'est la première action irréversible du jeu ; l'écrire d'abord la met à
    // l'abri de tout ce qui pourrait échouer dans le repeint. La session sait
    // comment écrire, l'écran sait seulement quand.
    if (apresPose !== undefined) apresPose(etatCourant);
    ligneDeMode('');
    // ⚠ LA PALETTE SE DÉSÉLECTIONNE, arbitré le 27/08. Poser deux bâtiments de
    // suite demande de rechoisir — c'est un geste de plus, contre le risque de
    // poser par inadvertance à chaque toucher suivant.
    posableChoisi = null;
    // La pièce tout juste posée devient la sélectionnée : c'est ce que le
    // joueur regarde, et le bandeau contextuel en dit le niveau et le débit.
    terrainSelection = terrainCourant();
    selection = terrain.pieces(etatCourant).length - 1;
    peindre(etatCourant);
    rafraichir(etatCourant);
  }

  /**
   * Le déplacement, qui est la seule action à DEUX touchers : le bâtiment, puis
   * la case d'arrivée.
   *
   * ⚠ ON DEMANDE, PUIS ON AGIT, ET JAMAIS DE `try` — même règle que la pose et
   * l'amélioration : `problemesDuDeplacement` rend une LISTE (fait de jeu),
   * `deplacer` LÈVE (fait de programme).
   */
  function tenterLeDeplacement(rangee, colonne, index) {
    if (deplacementEnCours === null) {
      // Premier toucher : quel bâtiment ? Une case vide désarme sans rien dire,
      // comme partout ailleurs — c'est le geste « à côté du menu ».
      if (index === -1) {
        actionArmee = null;
        ligneDeMode('');
        marquerBoutonsAction();
        return;
      }
      // ⚠ ICI LE TERRAIN VIENT DE LA CASE, ET NON DE LA PALETTE. Le joueur
      // désigne une pièce PRÉCISE du doigt : c'est la bande où elle se trouve
      // qui dit dans quelle liste elle vit, et c'est cette liste-là qu'il
      // faudra modifier au second toucher.
      terrainDeplacement = terrainDeLaRangee(rangee);
      deplacementEnCours = index;
      ligneDeMode(messageDeDestination(
        TERRAINS[terrainDeplacement].nomDe(
          TERRAINS[terrainDeplacement].pieces(etatCourant)[index].id,
        ),
      ));
      marquerCasesLegales();
      peindreApercu();
      return;
    }

    const terrain = TERRAINS[terrainDeplacement];
    const problemes = terrain.problemesDuDeplacement(
      etatCourant, deplacementEnCours, rangee, colonne,
    );
    if (problemes.length > 0) {
      // Le bâtiment RESTE en main : le joueur a visé à côté, il n'a pas changé
      // d'avis. Le lui retirer l'obligerait à le rechoisir pour réessayer.
      toast(messageDeRefus(problemes));
      return;
    }
    sonner('deplacement', terrainDeplacement,
      TERRAINS[terrainDeplacement].pieces(etatCourant)[deplacementEnCours]?.id);
    terrain.deplacer(etatCourant, deplacementEnCours, rangee, colonne);
    terrainSelection = terrainDeplacement;
    selection = deplacementEnCours;
    deplacementEnCours = null;
    desarmerLAction();
    // Un déplacement change le voisinage, donc les débits : il s'écrit tout de
    // suite, comme une pose.
    if (apresPose !== undefined) apresPose(etatCourant);
    peindre(etatCourant);
    rafraichir(etatCourant);
  }

  /**
   * Repeint ce qui ne bouge qu'en jouant : le terrain, les bâtiments, la
   * palette. Appelée au chargement et à chaque fois que la disposition change.
   * @param {object} etat
   */
  function peindre(etat) {
    etatCourant = etat;
    // ⚠ LE PLANCHER SE REMESURE ICI, ET PAS SEULEMENT AU CÂBLAGE. Au moment du
    // câblage, la mise en page n'est pas forcément faite : `clientWidth` peut
    // valoir zéro, et on ouvrirait alors à la taille par défaut — trop large
    // pour un téléphone étroit, donc avec un défilement horizontal que personne
    // n'a demandé. `peindre` passe à chaque changement d'état, la mise en page
    // y est faite, et re-régler ne coûte qu'une écriture de propriété.
    //
    // ⚠ ET ÇA NE DÉFAIT PAS LE ZOOM DU JOUEUR : on re-soumet le côté COURANT
    // aux bornes, on ne revient pas au défaut.
    reglerCoteCase(coteCase);
    // ⚠ UN INDICE DE SÉLECTION EST RELATIF À UNE DISPOSITION. Le jour où poser
    // et démonter existeront, un indice retenu d'avant la modification
    // désignerait un AUTRE bâtiment — pas une case vide, ce qui se verrait,
    // mais le voisin, ce qui ne se verrait pas. On le laisse tomber plutôt que
    // de le laisser mentir.
    if (selection !== null && selection >= TERRAINS[terrainSelection].pieces(etat).length) {
      selection = null;
    }
    // ⚠ LES QUATRE CLASSES DE TERRAIN NE SE POSENT PLUS, DONC NE SE RETIRENT
    // PLUS. `champ`, `quartz`, `scorie` et `obstacle` ne peignaient que le fond
    // kaki, le liseré tireté et la lettre — les trois choses qu'Ethan a fait
    // retirer le 30/08. Le `title`, lui, se réécrit à chaque peinture : le
    // laisser traîner ferait dire « pétrole » à une case redevenue nue.
    for (const case_ of cellules.values()) {
      case_.removeAttribute('title');
      case_.querySelector('.jeton')?.remove();
      case_.querySelector('.fantome')?.remove();
    }
    traits.textContent = '';

    // ⚠⚠ LES CASES SE VIDENT DE LEURS FONDS, ET IL FAUT LE FAIRE EXPLICITEMENT
    // DEPUIS LE LOT MUR-PEINT. Jusque-là, la boucle qui posait le sol repassait
    // sur les cent soixante-deux cases et ÉCRASAIT ce qui s'y trouvait : la
    // remise à zéro était un effet de bord du pavage. Le décor est maintenant
    // une seule image derrière la grille, plus rien ne repasse sur les cases, et
    // sans cette boucle un champ démoli garderait son dessin jusqu'au
    // rechargement.
    for (const case_ of cellules.values()) poserFonds(case_, []);

    // ⚠⚠ LE DÉCOR DE LA BASE — UNE IMAGE, MUR PEINT COMPRIS. Il se pose sur le
    // conteneur qui DÉFILE, pas sur la grille : la grille est haute de ses
    // dix-huit rangées, le décor de vingt cases, et c'est ce débord qu'Ethan
    // laisse passer sous les contrôles plutôt que de le rogner.
    //
    // ⚠ LA CASE QUI L'IDENTIFIE EST `fondation`, PAS `position`. C'est
    // l'IDENTITÉ de la base — elle ne bouge jamais, quand `position` change à
    // chaque redéploiement —, donc le décor tient à travers un déménagement,
    // un rechargement et une sauvegarde reprise.
    const fondation = baseCourante(etat).fondation;
    const nomDuFond = fondDeLaBase('joueur', 'base', fondation.rangee, fondation.colonne);
    poserLesAtlas(defile, [VARIABLE_DU_FOND[nomDuFond]]);

    // ⚠ LE TERRAIN SE DESSINE SOUS LES BÂTIMENTS, JAMAIS AU-DESSUS. Un champ
    // masqué par le collecteur qui l'exploite ferait disparaître de l'écran la
    // seule chose qui explique ce que ce collecteur produit.
    for (const champ of baseCourante(etat).champs.cases) {
      const case_ = cellules.get(cle(champ.rangee, champ.colonne));
      if (case_ === undefined) continue;
      poserFonds(case_, [
        fondDuTerrain(`champ_${champ.ressource}`, etat.graine, champ.rangee, champ.colonne),
        ...fondsPoses(case_),
      ]);
    }

    // ⚠ LES OBSTACLES SE DESSINENT, ET CE N'EST PAS DÉCORATIF. Une case où rien
    // ne peut se poser DOIT se voir : sans ça le joueur touche, reçoit un refus,
    // et n'a aucun moyen de savoir laquelle des soixante-douze cases est
    // interdite avant de les avoir toutes essayées. C'est « un indice n'est pas
    // une interdiction » pris par l'autre bout — ici le refus existe déjà, c'est
    // l'indice qui manquait.
    for (const o of baseCourante(etat).obstacles.cases) {
      const case_ = cellules.get(cle(o.rangee, o.colonne));
      if (case_ === undefined) continue;
      poserFonds(case_, [
        fondDuTerrain(`obs_${o.type}`, etat.graine, o.rangee, o.colonne),
        ...fondsPoses(case_),
      ]);
      // ⚠⚠ LA LETTRE EST PARTIE, L'INFORMATION RESTE — Ethan, 30/08 : « et les
      // petites lettres des obstacles en défense ». Elle disait QUI est ralenti,
      // et c'est la seule information de JEU que porte un obstacle : la
      // supprimer tout court serait « retirer en silence » (CLAUDE.md §4). Elle
      // passe donc dans le `title` de la case, que l'appui long rend, et les
      // deux tables qui la produisent restent branchées.
      case_.title = `${LIBELLES_OBSTACLE[o.type]} (${SIGLES_OBSTACLE[o.type]})`;
    }

    // ⚠ LES DEUX TERRAINS SE DESSINENT PAR LA MÊME BOUCLE. Les bâtiments dans
    // leur bande, la garnison dans la sienne, avec le sigle et la famille que
    // leur terrain leur donne. Une seconde boucle écrite pour la défense aurait
    // divergé au premier ajustement de jeton.
    for (const terrain of Object.values(TERRAINS)) {
      for (const b of terrain.pieces(etat)) {
        const case_ = cellules.get(cle(b.rangee, b.colonne));
        if (case_ === undefined) continue;
        const jeton = doc.createElement('div');
        jeton.className = `jeton ${terrain.familleDe(b.id)}`;
        // ⚠⚠ UN ABÎMÉ SE VOIT, ET LA CONVENTION EST CELLE DE L'ÉCRAN DE RAID —
        // lot RÉPARER-ÉCRAN, 05/09. `#ecran-raid .emplacement.abimee` borde en
        // `#E43E32` depuis le 01/09 : reprendre la classe et la teinte apprend au
        // joueur UNE grammaire pour les deux écrans, là où un second langage
        // visuel lui en apprendrait deux pour le même fait.
        //
        // ⚠ ET C'EST LA MÊME LIGNE POUR LES DEUX BANDES, sans un `=== 'defense'`
        // écrit à la main : une pièce de garnison porte `degatsMilli` comme un
        // bâtiment, et deux gardes de ce fichier refusent déjà qu'une bande soit
        // reconnue à son nom. La garnison se répare toute seule et son avarie ne
        // dure qu'une heure — la marquer reste vrai pendant cette heure-là.
        if ((b.degatsMilli ?? 0) > 0) jeton.classList.add('abimee');
        // ⚠ LE TERRAIN DÉCIDE, PAS LE NOM DE LA BANDE. `spriteDe` vaut `null`
        // tant qu'une famille n'est pas branchée : la bande garde alors son
        // sigle. Les deux bandes sont branchées depuis le 30/08 ; la porte reste
        // ouverte pour la troisième, quelle qu'elle soit.
        if (terrain.spriteDe === null) {
          jeton.textContent = terrain.sigleDe(b.id);
        } else {
          jeton.classList.add('sprite');
          poserCouches(jeton, terrain.spriteDe(b, etat));
          // ⚠ LE TITRE PORTE LA FAMILLE DEPUIS QUE LE CADRE EST PARTI. Les trois
          // liserés — prod, mil, pivot — disaient la famille de coût sur la
          // grille ; Ethan les a fait retirer avec les autres carrés le 30/08.
          // L'information n'est pas détruite pour autant : elle est ici, et la
          // palette la peint toujours. C'est « rien ne se retire en silence ».
          jeton.title = `${terrain.nomDe(b.id)} — ${LIBELLES_FAMILLE[terrain.familleDe(b.id)]}`;
        }
        const niveau = doc.createElement('span');
        niveau.className = 'niveau';
        niveau.textContent = String(b.niveau);
        jeton.appendChild(niveau);
        case_.appendChild(jeton);
      }
    }

    // ⚠ LES PASTILLES DE CASE LIBRE SONT PARTIES (28/08). Elles marquaient, en
    // haut de la grille, autant de cases vides qu'il restait d'emplacements
    // ouverts. Ethan les a fait retirer : « supprimer les petits carrés en haut
    // à droite qui montrent place disponible bâtiment ». Elles disaient un
    // NOMBRE en le dessinant à des endroits qui n'avaient rien à voir avec les
    // cases réellement choisies, et le compteur « Emplac. 3 / 4 » remis dans le
    // bandeau des ressources le dit maintenant sans mentir sur la géométrie.
    // La grandeur reste calculée par `resumeDeLaBase` — c'est ce dessin-là qui
    // part, pas le plafond.

    peindrePalette(etat);
    marquerCasesLegales();
    peindreApercu();
    // À la première peinture, le Chantier est sélectionné d'office : un bandeau
    // contextuel vide au premier regard donne un écran qui a l'air en panne, et
    // le Chantier est de toute façon ce autour de quoi la base se lit.
    if (selection === null) {
      const chantier = baseCourante(etat).disposition
        .findIndex((b) => b.id === 'chantierDeConstruction');
      terrainSelection = 'batiments';
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
    // ⚠ LA RÉSERVE MONTE PENDANT QU'ON LA REGARDE, DONC ELLE SE REPEINT ICI —
    // mais SEULEMENT quand la barre est à l'écran. Elle ne l'est que le mode
    // Réparer armé ; hors de là, ce serait recalculer un devis sur quarante
    // bâtiments dix fois par seconde pour une ligne que personne ne voit.
    if ($('chantier-reparation')?.hidden === false) ecrireLaReserve();

    // ⚠ LES POINTS D'ATTAQUE SE REPEIGNENT ICI, avec les trois ressources et
    // dans la même passe. Un second minuteur pour un seul nombre ferait deux
    // horloges dans un écran qui n'en a déjà qu'une — `session.js` appelle
    // cette fonction dix fois par seconde.
    //
    // ⚠ ILS SE LISENT DIRECTEMENT DANS L'ÉTAT, ET C'EST VOULU : `etat.attaque`
    // porte `points` et `plafond`, tenus par le tick. Les recalculer donnerait
    // un second compte du même stock — et le plafond est À CLIQUET, donc un
    // recalcul le ferait redescendre.
    attaquePoints.textContent = formaterEntier(etat.attaque.points);
    attaquePlafond.textContent = `/ ${formaterEntier(etat.attaque.plafond)}`;

    for (const r of resume.ressources) {
      const champs = champsRessource.get(r.cle);
      const sature = r.stockMilli >= r.capaciteMilli;
      champs.stock.textContent = formaterUnites(r.stockMilli);
      // ⚠ UN STOCK AU-DESSUS DU PLAFOND EST GELÉ, PAS AMPUTÉ (arbitré le
      // 26/08). Il faut donc que ça se VOIE, sinon le joueur croit à un bogue
      // de compteur : le nombre se marque « saturé » dès qu'il touche sa
      // capacité, et il ne descendra pas tout seul.
      //
      // ⚠ LA COULEUR NE SUFFISAIT PAS, ET C'EST MESURÉ. Une base neuve n'a que
      // la poche du Chantier — 50 unités — et un Collecteur la remplit en cinq
      // minutes : le compteur se fige, et le seul signe était un chiffre gris
      // de huit pixels qui devenait rouge. Ethan a rapporté le 28/08 « aucun
      // bâtiment ne produit de ressources » et « pas de calcul hors ligne » :
      // c'était ce plafond, vu deux fois. Le mot s'écrit maintenant.
      champs.capacite.textContent = sature
        ? `/ ${formaterUnites(r.capaciteMilli)} ${MENTION_SATURE}`
        : `/ ${formaterUnites(r.capaciteMilli)}`;
      champs.debit.textContent = formaterDebit(r.debitMilli);
      champs.stock.classList.toggle('sature', sature);
      champs.capacite.classList.toggle('sature', sature);
    }

    majCompteur();
    const navigation = navigationEntreBases(etat);
    $('navigation-libelle').textContent = navigation.libelle;
    $('navigation-precedente').disabled = !navigation.precedente;
    $('navigation-suivante').disabled = !navigation.suivante;

    // Chaque bouton porte SON niveau. Celui de la défense reste « — » : l'état
    // ne porte pas de garnison, et en inventer une moyenne afficherait un
    // chiffre faux là où le tiret dit ce qui est vrai.
    boutonsBande.get('batiments').niveau.textContent = formaterNiveau(resume.niveaux.batiments);
    boutonsBande.get('defense').niveau.textContent = formaterNiveau(resume.niveaux.defense);
    boutonsBande.get('offense').niveau.textContent = formaterNiveau(resume.niveaux.assaut);
    for (const [c, { bouton }] of boutonsBande) {
      bouton.classList.toggle('sans-niveau', c !== 'batiments');
    }

    // ⚠⚠ LA LIGNE DE DÉTAIL SUIT LE TERRAIN, ET ELLE NE LE FAISAIT PAS. Elle
    // appelait `detailDuBatiment` quel que soit `terrainSelection`, donc une
    // pièce de GARNISON sélectionnée se voyait décrite par le bâtiment de MÊME
    // INDICE dans `disposition`. Mesuré dans Chromium sur `main` avant ce lot :
    // un Mur de défense de niveau 1 affichait « Niv. 12 », qui est le niveau du
    // Chantier de construction, premier de la disposition. `selectionner` écrit
    // la bonne ligne — puis `rafraichir` passe dix fois par seconde et l'écrase
    // en moins de cent millisecondes, si bien que personne ne voyait jamais la
    // bonne. Le défaut date du jour où la bande Défense est devenue éditable ;
    // c'est ce lot qui le rend visible, en donnant enfin au joueur une raison
    // de lire ce niveau-là.
    if (selection !== null) {
      const terrain = TERRAINS[terrainSelection];
      // ⚠ ET UN INDICE PÉRIMÉ NE FAIT PLUS LEVER DIX FOIS PAR SECONDE. Il vaut
      // mieux ne rien sélectionner que de décrire la troisième pièce de la
      // mauvaise liste — c'est déjà ce que fait `selectionner`.
      if (terrain.pieces(etat)[selection] === undefined) selectionner(null);
      else $('chantier-selection-detail').textContent = terrain.detail(etat, selection).detail;
    }
    peindrePanneau();
  }

  return {
    peindre,
    rafraichir,
    allerALaBande,
    avis,
    /**
     * La session dit à l'écran quel écran est en scène ; l'écran en déduit le
     * bouton du bas à allumer et le libellé du compteur.
     */
    marquerEcran(nom) {
      ecranCourant = nom;
      marquerBoutonDuBas();
    },
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
