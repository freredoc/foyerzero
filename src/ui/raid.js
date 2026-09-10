// L'écran de raid — la cible en haut, l'armée en bas, et le combat qui se joue.
//
// ⚠⚠ SEPTIÈME ÉCRAN, ET IL S'ALLUME SUR L'ONGLET MONDE. On y vient de la carte,
// par un SECOND toucher sur une cible déjà ouverte, et on y retourne. Il se
// déclare dans `ECRANS` et dans `ONGLET_DE_L_ECRAN` de `ui/session.js`, et
// nulle part ailleurs — c'est ce que dit le commentaire de cette table.
//
// ⚠⚠ L'ÉCRAN A DEUX ÉTATS DE CHROME, ET C'EST LE LOT ASSAUT QUI LES SÉPARE.
// EN PRÉPARATION, le bandeau des ressources et celui des bases sont masqués et
// la rangée d'onglets RESTE — Ethan, 01/09 : « finalement on garde la barre du
// haut… les onglets seuls ». PENDANT LE DÉROULÉ, les onglets partent aussi, et
// `#raid-bas` avec eux — Ethan, 04/09 : « quand on lance un raid, toutes les
// barres disparaissent. On voit juste la simulation en cours. » La seconde
// phrase REVIENT sur la première, et elle ne la remplace pas : la préparation a
// besoin de ses onglets, c'est là qu'on répare, qu'on active, qu'on repart en
// Offense chercher une pièce.
//
// ⚠ LE CHROME COMMUN RESTE ÉCRIT PAR LA SESSION, ET PAR ELLE SEULE. Le déroulé
// n'est pas un écran : cet écran-ci le DEMANDE par le crochet `pendantLeDeroule`
// au lieu de toucher `#tete-onglets`, qui ne lui appartient pas. `#raid-bas`,
// lui, est à lui — il le masque directement.
//
// ⚠⚠ ET LE RETOUR EST GARANTI SUR TOUS LES CHEMINS DE FIN, ce qui est le défaut
// le plus probable du lot : un chrome masqué qui ne revient pas enferme le
// joueur dans un écran sans onglets. `quitterLeDeroule` est appelée par la fin
// normale, par `fermerPanneaux` et par `masquer` — trois portes, une fonction,
// idempotente.
//
// ⚠⚠ L'ÉTAGE PUR PORTE TOUT CE QUI SE MESURE, et il porte surtout
// `lignesDuResultat` : les DEUX panneaux de fin — le petit du simulateur et le
// plein cadre du vrai raid — s'en servent, donc ils affichent les mêmes nombres
// PAR CONSTRUCTION. Calculer un pourcentage dans l'un des deux les ferait
// diverger, et personne ne le verrait : les deux panneaux ne sont jamais à
// l'écran en même temps.
//
// ⚠ AUCUN POURCENTAGE N'EST CALCULÉ ICI. Ils viennent tous du rapport
// d'`executerRaid`, donc du simulateur aussi — c'est la raison d'être de RAID-0.
// Cet écran FORMATE, il ne mesure pas.

import { EMPLACEMENTS_ASSAUT, BATIMENTS, ECRAN_RAID } from '../data/sites.js';
import { UNITES, DEFENSES, COLONNES_DEGATS } from '../data/combat.js';
import { TICK_MS } from '../sim/clock.js';
// ⚠⚠ `reglerActivite` N'EST PLUS IMPORTÉE, ET C'EST L'ARBITRAGE D'ETHAN DU
// 08/09. Le drapeau « reste à la maison » n'écrit plus dans `etat.armee` : il
// vit dans la FORMATION, une copie de travail qui repart de l'armée d'Offense à
// chaque ouverture de cet écran. Les deux fonctions de déplacement d'effectif
// partent avec elle, pour la même raison — cet écran ne range plus l'armée, il
// range une copie.
import {
  formationDepuisLArmee, resynchroniserLaFormation, reglerActiviteEnFormation,
  problemesDuDeplacementEnFormation, deplacerEnFormation,
  problemesDeLaPermutationEnFormation, permuterEnFormation,
  problemesDeLEmbarquement, embarquerEnFormation,
  problemesDuDebarquementEnFormation, debarquerEnFormation,
  estPassager, estPorteur, passagerDe,
  MODULE_DE_TRANSPORT, CHASSIS_DU_PASSAGER,
} from '../sim/formation-de-raid.js';
import { nomDuModule } from '../sim/recherche.js';
import {
  reparerUnePiece, toutReparer, problemesDeLaReparationDUnePiece,
} from '../sim/reparation.js';
import {
  problemesDuRaid, executerRaid, simulerRaid, composerLesVagues, montageDuRaid,
  pvMaxDeLUnite,
} from '../sim/raid.js';
import { siteDeLaCase } from '../sim/site-de-la-case.js';
import { coutDUnRaid } from '../sim/points-attaque.js';
import { creerCombat, tick as tickCombat } from '../sim/combat.js';
import {
  creerAccumulateur, ticksDus, alphaMilli, prendrePositions, VITESSES,
} from '../render/interpolation.js';
import { calculerProjection } from '../render/projection.js';
// ⚠ L'ARRIVÉE FANTÔME VIENT DE `render/`, ET ELLE Y EST PURE — lot
// SON-ET-ARRIVÉE, 10/09. L'écran tient l'état et donne l'instant ; le module
// décide de la rampe. C'est le partage de `render/bandes.js` et de
// `render/fond.js`, repris à la lettre.
import { creerArrivees, noterLesArrivees, arriveesALEcran } from '../render/arrivee.js';
// ⚠⚠ LES BANDES VIENNENT DE `render/`, PAS DE L'ÉCRAN DE LA BASE — lot
// ÉCRAN-RAID, 04/09. Elles y ont déménagé au même lot : les recopier ici aurait
// été la deuxième vérité que §4 interdit, et importer `ui/chantier.js` pour une
// géométrie ferait dépendre le raid de la mise en page de la base.
import {
  BANDES_NAVIGABLES, basculeDeBande, casesDeLaBande,
  bornesDuDecalage, bornesDuDecalageX,
} from '../render/bandes.js';
import { COTE_SPRITE } from '../data/atlas.js';
import {
  listeAffichage, nomAffiche, entitesSurLaCase, classeDe, NOMS_CLASSE,
} from '../render/scene.js';
import { porteeQuiTire } from '../render/portee.js';
import { caseDepuisPixels } from '../render/projection.js';
import { MUR_CASES, fondDeLaBase } from '../render/fond.js';
import { executer } from '../render/canvas2d.js';
import { baseCourante } from '../sim/base-courante.js';
import { etatDesUnites, evenementsDuJournal } from '../son/cablage.js';
// ⚠⚠ LE PLAFOND DU ZOOM ET LA POSE D'UN SPRITE SE PRENNENT LÀ OÙ ILS SONT DÉJÀ.
// `COTE_CASE_MAX` est le plafond de la base — « le raid prend le même » —, et
// `poserCouches` porte l'inversion d'ordre entre le canevas et une liste
// `background-image`, qui n'a aucune raison d'être écrite deux fois.
// `couchesDeLUniteDAssaut` porte les QUATRE champs d'une unité d'assaut ; les
// recopier ici serait se donner une seconde occasion d'écrire `garnison` là où
// il faut `attaque`, ce que son propre commentaire annonce.
import {
  COTE_CASE_MAX, poserCouches, formaterEntier, LIBELLE_VERDICT,
  peindreVueDuPanneau, LIBELLES_COLONNE_DEGATS,
} from './chantier.js';
import { couchesDeLUniteDAssaut } from './offense.js';
// ⚠ LES PICTOGRAMMES SE DEMANDENT — voir `./pictogramme.js`.
import {
  PICTOGRAMME_DU_CHASSIS, PICTOGRAMME_DE_LA_COLONNE, PICTOGRAMMES, creerPictogramme,
} from './pictogramme.js';

// ---------------------------------------------------------------------------
// Étage pur
// ---------------------------------------------------------------------------

/** Les quatre vagues et les neuf colonnes — des DONNÉES, jamais des littéraux. */
export const NB_VAGUES = EMPLACEMENTS_ASSAUT.vagues;
export const NB_COLONNES = EMPLACEMENTS_ASSAUT.parVague;

/**
 * La bande sur laquelle une cible s'ouvre — Ethan, 06/09 : « ouverture de la
 * cible : on voit la défense ennemie en 1er. »
 *
 * ⚠ ELLE SE VÉRIFIE CONTRE `BANDES_NAVIGABLES` PLUTÔT QUE DE SE CROIRE. Une clé
 * hors de cette liste ferait rendre `basculeDeBande` la première bande venue et
 * l'écran s'ouvrirait ailleurs, en silence : c'est le seul mensonge que cette
 * constante puisse dire, et il se dit au chargement du module, pas chez le
 * joueur.
 */
export const BANDE_A_L_OUVERTURE = 'defense';
if (!BANDES_NAVIGABLES.includes(BANDE_A_L_OUVERTURE)) {
  throw new RangeError(
    `ui/raid : « ${BANDE_A_L_OUVERTURE} » n'est pas une bande navigable`,
  );
}

/** Le libellé d'un châssis, pour la ligne de réparation induite. */
const LIBELLE_CHASSIS = {
  escouade: 'Infanterie',
  blinde: 'Véhicules',
  aeronef: 'Aviation',
};

/**
 * Une durée en secondes, dite comme une phrase et non comme un nombre brut.
 *
 * @param {number} secondes
 * @returns {string}
 */
export function formaterDuree(secondes) {
  const s = Math.max(0, Math.round(secondes));
  if (s < 60) return `${s} s`;
  const minutes = Math.floor(s / 60);
  if (minutes < 60) return s % 60 === 0 ? `${minutes} min` : `${minutes} min ${s % 60} s`;
  const heures = Math.floor(minutes / 60);
  return minutes % 60 === 0 ? `${heures} h` : `${heures} h ${minutes % 60} min`;
}

/** Un pourcentage, ou un tiret quand la grandeur n'existe pas. */
function pct(valeur) {
  return valeur === null || valeur === undefined ? '—' : `${valeur} %`;
}

/**
 * Les lignes du panneau de résultat — LES MÊMES pour les deux panneaux.
 *
 * ⚠⚠ C'EST ICI QUE SE JOUE « LE SIMULATEUR ET LE VRAI RAID DISENT LA MÊME
 * CHOSE ». Les deux panneaux appellent cette fonction sur un rapport de même
 * forme, et aucun des deux ne calcule quoi que ce soit : l'égalité est
 * structurelle, pas surveillée. Le jour où l'un des deux voudrait « juste un
 * chiffre de plus », il passera par ici.
 *
 * ⚠ LES NOMS DE BÂTIMENTS VIENNENT DE LA TABLE, ET CE SONT CEUX DE L'OUVRAGE —
 * `BATIMENTS.souche.nom` vaut « Souche », `.ta` vaut « Chantier de
 * construction ». On regarde une base de l'Ouvrage : c'est son vocabulaire qui
 * s'affiche. Les CLÉS du rapport, elles, ne changent jamais de nom.
 *
 * @param {object} rapport rendu par `executerRaid` ou `simulerRaid`
 * @returns {Array<{quoi: string, valeur: string}>}
 */
export function lignesDuResultat(rapport) {
  const lignes = [
    { quoi: 'Verdict', valeur: LIBELLE_VERDICT[rapport.verdict] ?? rapport.verdict },
    {
      quoi: 'Butin',
      // ⚠ LE COFFRE EST LE SEUL PICTOGRAMME DE CE PANNEAU QUI DISE UN GAIN. Les
      // quatre lignes de pourcentage disent ce qui RESTE debout chez la cible ;
      // celle-ci dit ce qu'on rapporte.
      picto: PICTOGRAMMES.butin,
      valeur: `${rapport.butin.quartz ?? 0} quartz · ${rapport.butin.scorie ?? 0} scorie`,
    },
    { quoi: 'Défense restante', valeur: pct(rapport.restantDefense) },
    { quoi: 'Bâtiments restants', valeur: pct(rapport.restantBatiments) },
    { quoi: BATIMENTS.souche.nom, valeur: pct(rapport.restantSouche) },
    { quoi: BATIMENTS.etai.nom, valeur: pct(rapport.restantEtai) },
  ];

  // ⚠ LA RÉPARATION INDUITE, CHÂSSIS PAR CHÂSSIS, EN TEMPS **ET** EN POURCENT.
  // ⚠⚠ ET « SANS BÂTIMENT » SE DIT, parce que zéro veut dire deux choses : un
  // châssis intact et un châssis qu'on ne PEUT PAS réparer rendent tous deux
  // `0 s`. Annoncer « aucune réparation » à un joueur dont l'infanterie est en
  // miettes et sans Caserne serait un mensonge par omission.
  for (const [chassis, r] of Object.entries(rapport.reparationInduite ?? {})) {
    // ⚠⚠ LE CHÂSSIS DONNE LE PICTOGRAMME, ET LES TROIS BRANCHES LE PARTAGENT.
    // Une ligne de réparation parle d'infanterie, de véhicule ou d'avion quel
    // que soit son verdict — « sans bâtiment », « intacte » ou une durée — et
    // c'est le SUJET qui porte l'image, pas l'issue.
    const picto = PICTOGRAMME_DU_CHASSIS[chassis];
    const quoi = LIBELLE_CHASSIS[chassis] ?? chassis;
    if (r.sansBatiment) {
      lignes.push({ quoi, picto, valeur: 'sans bâtiment' });
    } else if (r.ticks === 0) {
      lignes.push({ quoi, picto, valeur: 'intacte' });
    } else {
      lignes.push({
        quoi,
        picto,
        valeur: `${formaterDuree(r.secondes)} · ${pct(r.pctReserve)} de la réserve`,
      });
    }
  }

  // ⚠ LE TEMPS DE RAID EST `ticks × TICK_MS`, et `TICK_MS` vient de l'horloge,
  // jamais recopié : écrire 0,1 ici ferait un second pas de temps.
  lignes.push({
    quoi: 'Durée du combat',
    picto: PICTOGRAMMES.temps,
    valeur: formaterDuree((rapport.ticks * TICK_MS) / 1000),
  });
  return lignes;
}

/** Ce qu'une vignette dit d'une pièce : son identité et sa santé. */
function vignetteDeLaPiece(piece, index) {
  const pvMax = pvMaxDeLUnite(piece.id, piece.niveau);
  return {
    index,
    id: piece.id,
    nom: UNITES[piece.id].nom.joueur,
    niveau: piece.niveau,
    actif: piece.actif !== false,
    degatsMilli: piece.degatsMilli ?? 0,
    // Ce qui reste de la pièce, en pour-cent — la barre de vie de la vignette.
    pvPct: Math.max(0, Math.round(((pvMax - (piece.degatsMilli ?? 0)) * 100) / pvMax)),
  };
}

/**
 * Ce que l'écran affiche de l'armée : les quatre vagues, occupées ou vides.
 *
 * ⚠ FONCTION PURE, DONC FONCTION TESTÉE — le dépôt n'a ni jsdom ni navigateur,
 * et ce qui peut se vérifier sans écran doit l'être.
 *
 * ⚠⚠ ELLE LIT LA FORMATION, PLUS `laBase.armee` — lot FORMATION-ET-GARNISON.
 * C'est la copie de travail qui décide de ce qui est à l'écran : les positions,
 * le drapeau d'activité et les embarquements y vivent, et `etat.armee` ne les
 * voit jamais. L'`etat` reste nécessaire, et pour une seule question — le module
 * Garnison est-il ACQUIS sur cette ligne, ce que la formation ne peut pas dire.
 *
 * ⚠ UN PASSAGER N'A PAS DE CASE, DONC PAS DE VIGNETTE À LUI. Il paraît sur la
 * case de son porteur, par le badge — c'est la même règle que `vague: null`, vue
 * du côté du dessin.
 *
 * @param {object} etat
 * @param {Array<object>} formation
 * @returns {Array<{numero: number, cases: Array<null|object>}>}
 */
export function vaguesDeLArmee(etat, formation) {
  const vagues = [];
  for (let numero = 1; numero <= NB_VAGUES; numero += 1) {
    const cases = new Array(NB_COLONNES).fill(null);
    vagues.push({ numero, cases });
  }
  formation.forEach((piece, index) => {
    if (estPassager(piece)) return;
    const v = vagues[piece.vague - 1];
    if (v === undefined || piece.colonne < 1 || piece.colonne > NB_COLONNES) return;
    const indexPassager = passagerDe(formation, index);
    v.cases[piece.colonne - 1] = {
      ...vignetteDeLaPiece(piece, index),
      // ⚠ DEUX QUESTIONS, DEUX CHAMPS, ET ELLES NE SE CONFONDENT PAS — c'est le
      // couple exact de `reparerLaGarnison`. `porteur` dit « ce joueur-là peut
      // s'en servir » et sert la phrase du survol ; le GESTE, lui, se route sur
      // la ligne qui PORTE le module, acquis ou non, pour que le refus
      // « le module Garnison n'est pas acquis » puisse s'afficher.
      porteur: estPorteur(etat, piece.id),
      passager: indexPassager === null ? null
        : vignetteDeLaPiece(formation[indexPassager], indexPassager),
    };
  });
  return vagues;
}

/**
 * Tout ce que l'écran de raid affiche, calculé depuis l'état et la cible.
 *
 * ⚠⚠ ET LE COÛT EN FAIT PARTIE DEPUIS LE LOT ASSAUT, PARCE QUE LE BOUTON LE
 * PORTE. « Lancer l'attaque » ne disait pas le prix ; le joueur venait de la
 * carte, où il l'avait lu, et devait s'en souvenir. Le bouton dit maintenant ce
 * qu'il va dépenser.
 *
 * ⚠ ET C'EST LE SEUL ENDROIT DE CET ÉCRAN QUI APPELLE `coutDUnRaid`. L'étage DOM
 * LIT cette valeur ; la rappeler pour le libellé donnerait deux nombres qui
 * peuvent diverger, et le joueur verrait un prix sur le bouton et un autre dans
 * le panneau de la carte. C'est mot pour mot le motif de `ciblageOuvert` dans
 * `ui/monde.js`, où la flèche RELIT le ciblage au lieu de le recalculer.
 *
 * ⚠⚠ LE COÛT VAUT `null` HORS DE PORTÉE, JAMAIS ZÉRO, et l'ordre des deux
 * lignes n'est pas un détail de style : `coutDUnRaid` LÈVE au-delà du rayon
 * d'attaque. Les problèmes se demandent donc AVANT le coût — c'est le défaut
 * qu'`ciblageDuSite` a payé au lot DÉPLACEMENT, où un panneau ne s'ouvrait plus
 * sur aucun site lointain de toute la carte.
 *
 * @param {object} etat
 * @param {{rangee: number, colonne: number}} cible
 * @returns {object}
 */
/** Un milli-PV vaut un millième de point de vie : la table est en PV, le moteur en milli. */
const MILLE_PV = 1000;

/**
 * Ce qu'un doigt a le droit de bouger sans que le geste cesse d'être un
 * toucher — en pixels CSS.
 *
 * ⚠ TROIS, LE MÊME NOMBRE QUE `ui/monde.js`, et pour le motif qu'il écrit :
 * « un doigt ne se pose jamais parfaitement immobile, et compter le moindre
 * frémissement comme un défilement rendrait le toucher d'un site impossible ».
 */
const TOLERANCE_TOUCHER_PX = 3;

/**
 * La ligne de roster d'une entité de combat — la table dont elle sort.
 *
 * ⚠ TROIS TABLES, ET L'APPELANT DOIT SAVOIR LAQUELLE. C'est le contrat que
 * `porteeQuiTire` pose en toutes lettres : « elle prend la LIGNE, pas
 * l'identifiant […] réimporter les deux ici mettrait dans ce module une seconde
 * façon de résoudre un identifiant ». Le dispatch se fait donc une fois, ici, et
 * il est le MÊME que celui de `nomAffiche` et de `classeDe`.
 *
 * @param {object} entite une entité de `src/sim/combat.js`
 * @returns {object|undefined}
 */
function ligneDeLEntite(entite) {
  if (entite.genre === 'batiment') return BATIMENTS[entite.id];
  if (entite.genre === 'defense') return DEFENSES[entite.id];
  return UNITES[entite.id];
}

/**
 * La fiche d'une entité du champ de bataille — points 7 et 8 du 07/09.
 *
 * Ethan : « En prépa raid, possibilité de cliquer sur une unité ennemie pour
 * voir ses stats », puis « idem pour les bâtiments ».
 *
 * ⚠⚠ ELLE REND LA MÊME FORME QUE LES DEUX AUTRES FICHES, ET C'EST TOUT LE LOT.
 * `peindreVueDuPanneau` de `ui/chantier.js` est le rendu partagé du Chantier et
 * de l'Offense depuis le lot ERGONOMIE, et son commentaire annonce celle-ci
 * depuis le lot ÉCRAN-DÉFENSE : « la fiche d'une cible ennemie, que les points 7
 * et 8 du 07/09 demandent, l'appellera comme les deux autres ». **Ce lot ne
 * fournit que des sections et des paires ; il n'écrit pas une ligne de mise en
 * page.**
 *
 * ⚠⚠ RIEN QUI NE SORTE DU MOTEUR. Les PV, le niveau et les trois colonnes de
 * dégâts sont lus SUR L'ENTITÉ, pas recalculés depuis la table : l'entité porte
 * déjà l'échelle du niveau, la majoration des POI et celle des modules, et
 * refaire ce produit ici en donnerait une seconde version. Une fiche d'ennemi
 * qui mentirait de peu serait pire qu'une fiche absente.
 *
 * ⚠ LE NOM SE LIT DANS LE CAMP DE L'ENTITÉ — `nomAffiche`, dont l'en-tête écrit
 * que la clé est le PROPRIÉTAIRE et jamais le camp. Afficher le nom joueur sur
 * une pièce de l'Ouvrage serait un mensonge discret et durable.
 *
 * ⚠⚠ AUCUNE FLÈCHE DE PALIER : `apres` vaut `null` sur TOUTES les paires. Le
 * rendu ne dessine « → » que si `apres !== null` ; inventer un palier suivant
 * pour une pièce qui ne t'appartient pas promettrait une amélioration qui n'est
 * pas la tienne.
 *
 * ⚠ ET ELLE NE RÉPÈTE PAS LE PANNEAU DE LA CIBLE — ni butin, ni force de
 * défense, ni coût en points d'attaque. Ces trois-là y sont déjà, et les redire
 * ici les ferait diverger.
 *
 * @param {object} entite une entité de `src/sim/combat.js`
 * @returns {{titre: string, picto: string, sections: Array}}
 */
export function ficheDeLEntite(entite) {
  const ligne = ligneDeLEntite(entite);
  if (ligne === undefined) throw new RangeError(`raid : pièce « ${entite.id} » inconnue`);

  // ⚠ LES DÉGÂTS VIENNENT DE L'ENTITÉ, ET LES TROIS SE DISENT MÊME À ZÉRO.
  // « Contre les véhicules : — » est une information de jeu — c'est ce qui
  // apprend au joueur qu'un Merlon ne tue rien et qu'une Batterie ne touche que
  // ce qui vole. Un bâtiment et un mur portent `degatsColonne: null` : la table
  // vide rend les trois tirets, ce qui est exactement vrai.
  const degats = entite.degatsColonne ?? {};
  const combat = [{
    libelle: 'Points de vie',
    picto: PICTOGRAMMES.pv,
    avant: formaterEntier(Math.round(entite.pvMaxMilli / MILLE_PV)),
    apres: null,
  }];
  for (const colonne of COLONNES_DEGATS) {
    const valeur = Math.round((degats[colonne] ?? 0) / MILLE_PV);
    combat.push({
      libelle: LIBELLES_COLONNE_DEGATS[colonne],
      picto: PICTOGRAMME_DE_LA_COLONNE[colonne],
      // ⚠ UN ZÉRO SE DIT « — », JAMAIS « 0 » — la convention de la fiche d'une
      // pièce du joueur, reprise à la lettre.
      avant: valeur === 0 ? '—' : formaterEntier(valeur),
      apres: null,
      mineur: true,
    });
  }

  // ⚠⚠ LA PORTÉE VIENT DE `porteeQuiTire`, L'UNIQUE ÉCRITURE DU DÉPÔT. Elle
  // porte les TROIS conditions de `peutTirer` — pas de table de dégâts, portée
  // nulle, table entièrement à zéro — et c'est elle qui répond au point 8 :
  // « une tourelle tire, un merlon non ». Un `=== 'defense'` écrit ici serait
  // une seconde règle, et elle mentirait sur la Ronce, qui a une portée de 1 et
  // FRANCHIT sans jamais tirer.
  const portees = porteeQuiTire(ligne);
  const pieces = [];
  if (portees !== null) {
    // ⚠ LA VIRGULE, PAS LE POINT : `String(2.5)` rend « 2.5 », qui est de
    // l'anglais. Même écriture que la fiche d'une pièce du joueur.
    pieces.push({
      libelle: 'Portée',
      avant: `${String(portees.portee).replace('.', ',')} cases`,
      apres: null,
    });
    // ⚠ LA PORTÉE MINIMALE NE SE DIT QUE SI ELLE EXISTE. Les trois artilleries
    // portent `porteeMini: 3.5` — elles ne couvrent pas leur propre case — et
    // une tourelle n'a pas d'angle mort : « Portée minimale : 0 cases » ferait
    // chercher un trou qu'il n'y a pas.
    if (portees.porteeMini > 0) {
      pieces.push({
        libelle: 'Portée minimale',
        avant: `${String(portees.porteeMini).replace('.', ',')} cases`,
        apres: null,
        mineur: true,
      });
    }
  }
  pieces.push({
    libelle: 'Classe',
    avant: NOMS_CLASSE[classeDe(entite.genre, entite.id)],
    apres: null,
  });
  // ⚠ L'ÉTAT EST UNE PART DES PV MAX, PAS UN ABSOLU — même lecture que la fiche
  // d'une pièce du joueur : les PV max montent avec le niveau, donc un nombre
  // nu ne se compare à rien. Un site déjà entamé se lit ici, et c'est ce qui
  // sert au joueur qui revient dessus.
  const perdus = entite.pvMaxMilli - entite.pvMilli;
  pieces.push({
    libelle: 'État',
    picto: PICTOGRAMMES.degats,
    avant: perdus <= 0
      ? 'intacte'
      : `${formaterEntier(Math.round((1000 * perdus) / entite.pvMaxMilli / 10))} % de dégâts`,
    apres: null,
  });

  return {
    titre: `${nomAffiche(entite)} · niv. ${formaterEntier(entite.niveau)}`,
    // ⚠ LA MÊME CLÉ QUE LES DEUX AUTRES FICHES : le rendu est partagé, donc les
    // trois vues doivent avoir EXACTEMENT les mêmes clés.
    picto: PICTOGRAMMES.niveau,
    sections: [
      { titre: 'Au combat', lignes: combat },
      { titre: 'La pièce', lignes: pieces },
    ],
  };
}

export function vueDuRaid(etat, cible, formation = null) {
  const site = siteDeLaCase(etat, cible.rangee, cible.colonne);
  // ⚠ LA FORMATION EST FACULTATIVE, ET SON DÉFAUT N'EST PAS UNE COMMODITÉ. Sans
  // elle, `problemesDuRaid` et `composerLesVagues` rendent EXACTEMENT ce qu'ils
  // rendaient avant le lot FORMATION-ET-GARNISON — donc les appelants d'hier
  // sont intacts. Avec elle, les trois grandeurs que l'écran affiche — le refus,
  // les vagues, le nombre d'engagées — décrivent ce qui partira vraiment.
  const problemes = site === null ? [{ code: 'sans-cible', message: 'Plus rien à attaquer ici.' }]
    : problemesDuRaid(etat, baseCourante(etat), cible, formation);
  const horsPortee = site === null || problemes.some((p) => p.code === 'hors-portee');
  return {
    site,
    problemes,
    peutAttaquer: problemes.length === 0,
    cout: horsPortee ? null : coutDUnRaid(etat, baseCourante(etat), cible),
    vagues: vaguesDeLArmee(etat, formation ?? formationDepuisLArmee(etat)),
    engagees: composerLesVagues(etat, formation).indices.length,
  };
}

/**
 * Ce que le gros bouton d'attaque écrit, en deux lignes.
 *
 * ⚠ LE MOT NE CHANGE PAS, LE PRIX SI. « ATTAQUER » est le geste ; la seconde
 * ligne dit ce qu'il coûte, et elle se tait quand il n'y a pas de prix — hors
 * de portée, ou plus rien à attaquer. « 0 point » se lirait « gratuit », qui est
 * la convention que tout le dépôt refuse depuis `niveauDeCommandement`.
 *
 * @param {number|null} cout
 * @returns {{mot: string, prix: string}}
 */
export function libelleDAttaque(cout) {
  if (cout === null || cout === undefined) return { mot: 'ATTAQUER', prix: '' };
  return { mot: 'ATTAQUER', prix: cout === 1 ? '1 point' : `${cout} points` };
}

/**
 * Le côté de case le plus grand qu'on autorise sur le CANEVAS, en pixels de
 * mémoire d'image.
 *
 * ⚠⚠ LE PLAFOND DE LA BASE EST EN PIXELS CSS, CELUI-CI EN PIXELS DE BUFFER, ET
 * LES CONFONDRE DIVISERAIT LA PLAGE PAR LA DENSITÉ. `#chantier-grille` écrit
 * `--case-cote` en pixels CSS ; ce canevas-ci dessine dans son buffer, qui fait
 * `devicePixelRatio` fois plus. Prendre `COTE_CASE_MAX` tel quel donnerait, sur
 * un téléphone à densité 3, un plafond de 128 buffer là où le plancher en vaut
 * déjà 108 : **une plage de 1,19 fois**, c'est-à-dire très exactement le « zoom
 * chelou, très lent » qu'Ethan a rapporté le 31/08 et que le lot suivant a
 * corrigé en ouvrant la plage.
 *
 * ⚠⚠ ET IL RESTE UN MULTIPLE ENTIER DE `COTE_SPRITE`, PAR CONSTRUCTION. C'est
 * tout le raisonnement de `ZOOM_BASE_MULTIPLE_MAX` : au plafond, un pixel de
 * sprite vaut un nombre ENTIER de pixels dessinés, donc `drawImage`
 * n'interpole pas. On prend donc le multiple le plus PROCHE du plafond de la
 * base converti — jamais le plafond converti lui-même, qu'une densité
 * fractionnaire (2,625 sur certains Android) rendrait non entier.
 *
 * ⚠ UN MULTIPLE AU MOINS, JAMAIS ZÉRO : sur un écran à densité inférieure à 1,
 * l'arrondi tomberait sur zéro et la grille disparaîtrait.
 *
 * @param {number} dpr densité de pixels de l'appareil
 * @returns {number} côté maximal, en pixels de buffer
 */
export function plafondDuZoom(dpr) {
  const densite = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
  const multiple = Math.max(1, Math.round((COTE_CASE_MAX * densite) / COTE_SPRITE));
  return COTE_SPRITE * multiple;
}

// ---------------------------------------------------------------------------
// Étage DOM
// ---------------------------------------------------------------------------
//
// ⚠ LE MODE « RÉPARER » A EXACTEMENT LA FORME DES MODES D'`offense.js` : un
// bouton s'arme, le geste suivant désigne la pièce, retoucher le bouton désarme.
// En inventer une seconde forme sur la même grille 4 × 9 apprendrait deux
// grammaires au joueur pour le même doigt.
//
// ⚠⚠ ET LE GLISSER-DÉPOSER COEXISTE AVEC ELLE, CE QUI EST UNE DETTE ASSUMÉE.
// `ui/offense.js` compose la MÊME grille par modes tactiles — « Mode DÉPLACER :
// touchez l'unité à déplacer ». Ethan a demandé le glisser-déposer ici, deux
// fois : ce lot l'exécute, et le rapport le signale comme une dette
// d'ergonomie plutôt que de la résoudre d'initiative.
//
// ⚠ AUCUNE EXCEPTION NE REMONTE À L'ÉCRAN. `reparerUnePiece`, `toutReparer` et
// les cinq gestes de `sim/formation-de-raid.js` LÈVENT ; c'est `problemesDe…`
// qui dit le manque. On demande, puis on agit — jamais un `try` autour du geste.

// ---------------------------------------------------------------------------
// L'effondrement du site — lot EFFONDREMENT, 07/09/2026
// ---------------------------------------------------------------------------
//
// ⚠⚠ ETHAN, POINT 12 : « lors d'une victoire totale, juste après la destruction
// et avant le rapport, détruire les unités et bâtiments de défense en 2
// secondes. » Arbitrage du même jour : **purement visuel, l'état ne bouge pas.**
//
// ⚠⚠ ET C'EST DÉJÀ VRAI AVANT CE LOT, CE QUI EST LA PREMIÈRE CHOSE À DIRE.
// `executerRaid` commet TOUT l'état avant la première image — arbitrage « A » du
// 01/09, écrit en tête de `rejouer` : « LE DÉROULÉ EST UN REJEU, PAS LA SOURCE DE
// VÉRITÉ. » L'effondrement est donc du DESSIN : il ne retire aucune entité de
// l'état, ne touche aucun PV, ni le butin, ni le rapport. **Aucune ligne de ce
// lot n'entre dans `src/sim/`**, et `EFF T3` le mesure par `deepEqual`.

/**
 * L'ordre dans lequel le site s'effondre : de l'avant vers le fond.
 *
 * ⚠⚠ IL SUIT LE CHEMIN DE L'ASSAUT, ET C'EST LA SEULE LECTURE QUI SE DÉFENDE.
 * La rangée 3 est celle que l'assaut rencontre en premier, la 18 celle où sont
 * la Souche et l'Étai. Effondrer dans cet ordre fait courir la vague derrière
 * l'attaquant, et elle se termine sur les deux objectifs du raid. L'ordre
 * d'insertion des entités aurait donné l'inverse — bâtiments d'abord, donc le
 * fond avant l'avant — sans qu'aucune raison ne le fonde.
 *
 * ⚠ LA COLONNE DÉPARTAGE, ET IL FAUT QU'ELLE LE FASSE : deux entités de la même
 * rangée doivent avoir un ordre, sinon `sort` tranche et l'effondrement change
 * de dessin d'un moteur JavaScript à l'autre. L'indice ferme l'ordre — deux
 * entités ne peuvent pas partager une case, mais le dire coûte une comparaison.
 *
 * ⚠ ET ELLE NE LIT QUE LE CAMP DE LA DÉFENSE. Les unités d'assaut SURVIVANTES
 * restent à l'écran : ce sont elles qui ont gagné, et les faire disparaître avec
 * le site dirait le contraire de ce qui vient de se passer.
 *
 * @param {Array<object>} entites entités de combat
 * @returns {number[]} les indices, dans l'ordre où ils tombent
 */
export function ordreDeLEffondrement(entites) {
  return entites
    .filter((e) => e.camp === 'defense' && e.vivant && !e.sorti)
    .slice()
    .sort((a, b) => a.rangeeMilli - b.rangeeMilli
      || a.colonneMilli - b.colonneMilli
      || a.indice - b.indice)
    .map((e) => e.indice);
}

/**
 * Les indices DÉJÀ tombés à cet instant de l'effondrement.
 *
 * ⚠ LE COMPTE EST PROPORTIONNEL, ET IL ATTEINT LE TOTAL À LA FIN. À `ecouleMs`
 * nul, personne n'est tombé — l'image qui suit immédiatement la fin du combat
 * montre donc le site intact, ce qui est ce que le joueur vient de voir. À
 * `dureeMs`, tout le monde est tombé, et c'est cette image-là que le rapport
 * recouvre.
 *
 * ⚠ UNE DURÉE NULLE OU NÉGATIVE FAIT TOUT TOMBER D'UN COUP plutôt que de
 * diviser par zéro. C'est le comportement qu'on veut d'une table réglée à zéro :
 * pas d'effondrement, pas d'exception.
 *
 * @param {Array<object>} entites
 * @param {number} ecouleMs temps écoulé depuis la fin du combat
 * @param {number} dureeMs durée totale, lue dans `ECRAN_RAID`
 * @returns {Set<number>} indices des entités à ne plus dessiner
 */
export function effondrees(entites, ecouleMs, dureeMs) {
  const ordre = ordreDeLEffondrement(entites);
  if (!(dureeMs > 0)) return new Set(ordre);
  const part = Math.max(0, Math.min(1, ecouleMs / dureeMs));
  return new Set(ordre.slice(0, Math.floor(ordre.length * part)));
}

/**
 * Les modes de la barre du raid — même forme que `ACTIONS_ARMEE` d'Offense.
 *
 * ⚠⚠ LES DEUX HANDLERS PRENNENT LA FORMATION EN TROISIÈME ARGUMENT, ET LES DEUX
 * N'ÉCRIVENT PAS AU MÊME ENDROIT. « Réparer » écrit dans `etat.armee` — la santé
 * d'une pièce est une grandeur de l'ÉTAT, et un raid doit l'emporter telle
 * qu'elle est au départ ; « Activer » écrit dans la FORMATION, parce que le
 * drapeau repart à vrai à la prochaine ouverture de l'écran. Un mode qui se
 * tromperait de destination écrirait dans une copie que le raid emporte, ou dans
 * une sauvegarde que rien ne remet à zéro.
 */
export const MODES_RAID = {
  reparer: {
    bouton: 'raid-reparer',
    libelle: 'Réparer',
    invite: 'Mode RÉPARER : touchez l\'unité à réparer. Retouchez le bouton pour annuler.',
    problemes: (etat, index) => problemesDeLaReparationDUnePiece(etat, index),
    agir: (etat, index) => reparerUnePiece(etat, index),
    // ⚠ ELLE ÉCRIT DANS `etat.armee`, DONC LA FORMATION DOIT SE REMETTRE À
    // NIVEAU : elle porte une copie des dégâts, prise à l'ouverture de l'écran.
    ecritSurLArmee: true,
  },
  activer: {
    bouton: 'raid-activer',
    libelle: 'Activer / désactiver',
    invite: 'Mode ACTIVER : touchez l\'unité à laisser à la maison, ou à renvoyer au raid.',
    problemes: () => [],
    agir: (etat, index, formation) => reglerActiviteEnFormation(
      formation, index, formation[index].actif === false,
    ),
    ecritSurLArmee: false,
  },
};

/**
 * Câble l'écran de raid.
 *
 * @param {Document} doc
 * @param {{versEcran: Function, apresGeste: Function}} crochets
 */
export function initialiserEcranRaid(doc, crochets = {}) {
  const $ = (id) => doc.getElementById(id);
  const versEcran = crochets.versEcran ?? (() => {});
  const apresGeste = crochets.apresGeste ?? (() => {});
  // ⚠ L'ÉCRAN NOMME UN GESTE, JAMAIS UN SON — même frontière que `sonDeRefus`
  // du lot SON-MOTEUR, et la garde `SON T14` refuse de toute façon un appel de
  // `jouer(` ici. Le déroulé, lui, n'a rien à annoncer : les 174 sons de combat
  // attendent un journal de tick qui n'existe pas, et ce journal est un chantier
  // de simulation.
  const sonDeGeste = crochets.sonDeGeste ?? (() => {});
  // ⚠⚠ LE CHROME COMMUN N'EST PAS À CET ÉCRAN, ET LE DÉROULÉ N'EST PAS UN
  // ÉCRAN. `#tete-onglets`, `#ressources` et `#navigation` sont frères de
  // `#ecrans` : les masquer d'ici demanderait à l'écran de raid de connaître le
  // balisage de la page, ce que la règle de `montrerEcran` refuse depuis le lot
  // MISE-EN-PAGE. On DEMANDE, la session écrit — même découpage que `versEcran`.
  const pendantLeDeroule = crochets.pendantLeDeroule ?? (() => {});
  /**
   * Ce que le DÉROULÉ a fait entendre depuis le dernier relevé de la session.
   *
   * ⚠⚠ UN ENSEMBLE, PAS UNE FILE, ET C'EST LA RÉPONSE AU POINT DUR DU LOT. La
   * simulation avance par TICKS, l'écran par IMAGES, et `ticksDus` en résout
   * jusqu'à douze dans la même image en ×4. Une file demanderait cent cinquante
   * coups de canon dans la même milliseconde ; la politique de voix les
   * refuserait, mais compter sur un refus n'est pas une conception. **Un
   * événement distinct ne sonne qu'une fois par relevé**, quel que soit le
   * nombre de ticks qui l'ont réclamé — et l'ensemble est borné par le pack,
   * donc il ne peut pas grossir.
   */
  const evenementsSonores = new Set();

  const canvas = $('raid-canvas');
  const ctx = canvas === null ? null : canvas.getContext('2d');
  // ⚠ LE PIXEL ART NE S'INTERPOLE PAS, et c'est ici que ça se décide — chez
  // celui qui crée le contexte. `render/canvas2d.js` n'en prend aucune.
  if (ctx !== null) ctx.imageSmoothingEnabled = false;

  let etatCourant = null;
  let cibleCourante = null;
  // ⚠ LE DÉCOR DE LA BASE REGARDÉE — lot MUR-PEINT. Il ne change pas tant qu'on
  // reste sur la même cible, donc il se calcule à l'ouverture et pas à chaque
  // image : `dessiner` passe dix fois par seconde.
  let fondCourant = null;
  let atlas = null;
  let mode = null;
  let rapportCourant = null;
  /**
   * La formation de raid — la copie de travail de l'armée.
   *
   * ⚠⚠ ELLE SE RECONSTRUIT À CHAQUE OUVERTURE DE L'ÉCRAN, PAR `ouvrirSurLaCible`,
   * ET C'EST LA SEULE PORTE. Ethan, 08/09 : « la formation de raid repart
   * toujours de celle d'Offense, et toutes les unités repartent actives ».
   * Une seconde reconstruction ailleurs — au retour d'un rapport, à la fin d'un
   * déroulé — effacerait en silence le rangement que le joueur vient de faire.
   *
   * ⚠ ELLE NE VA JAMAIS DANS `etat`, ET NE SE SÉRIALISE PAS : elle vit ici, elle
   * meurt avec l'écran. C'est ce qui fait que `SAVE_VERSION` ne bouge pas.
   *
   * ⚠ ET ELLE VAUT LA LISTE VIDE TANT QU'AUCUNE CIBLE N'EST OUVERTE, jamais
   * `null` : `peindreVagues` et `vueDuRaid` la parcourent sans avoir à demander
   * si elle existe.
   */
  let formation = [];

  // --- le déroulé ------------------------------------------------------------
  let combat = null;
  let precedentes = null;
  let accumulateur = creerAccumulateur();
  let vitesse = 1;
  let derniereImageMs = null;
  let idImage = null;
  let enPause = false;
  let projection = null;
  let simulation = false;
  /**
   * Millisecondes écoulées depuis la fin du combat, ou `null` hors effondrement.
   *
   * ⚠ `null` ET PAS ZÉRO, ET LA DIFFÉRENCE PORTE TOUT LE CÂBLAGE. Zéro est le
   * premier instant de l'effondrement — le site encore intact —, `null` veut
   * dire qu'il n'y en a pas, et c'est ce que `finDuDeroule` teste pour savoir
   * s'il doit montrer le rapport tout de suite.
   */
  let effondrementMs = null;

  /**
   * L'ARRIVÉE DES UNITÉS — lot SON-ET-ARRIVÉE, 10/09.
   *
   * ⚠ ÉTAT D'AFFICHAGE PUR, comme `mesure` et comme l'ensemble des tombées : il
   * vit dans cette fermeture, il meurt avec le déroulé, et pas un champ n'entre
   * dans la sauvegarde. `SAVE_VERSION` ne bouge pas.
   */
  let arrivees = creerArrivees();

  // --- la vue : quelle bande, à quelle taille, et où -------------------------
  //
  // ⚠⚠ TROIS ÉTATS ET PAS UN DE PLUS, ET C'EST CE QUE `calculerProjection`
  // ATTEND. La bande décide de ce qui doit TENIR en hauteur, le côté de case de
  // la TAILLE, les deux décalages de l'ENDROIT. Rien d'autre n'est retenu : la
  // projection se recalcule à chaque image à partir de ces trois-là et de la
  // taille du canevas, si bien qu'une rotation d'écran ne peut pas laisser
  // derrière elle une marge périmée.
  //
  // ⚠⚠ ET `null` DÉSIGNE LA VUE D'ENSEMBLE, QUI EST CELLE DU DÉROULÉ. C'est une
  // LECTURE, et le rapport la déclare comme telle : Ethan a dit « mode Raid »
  // sans distinguer la préparation du combat. Un raid part des rangées 1–2,
  // traverse la défense en 3–10 et atteint les bâtiments en 11–18 : cadrer une
  // seule bande pendant qu'il se joue serait regarder ailleurs pendant que ça
  // se passe. Le zoom et le défilement, eux, RESTENT disponibles — si le joueur
  // veut regarder de près, rien ne l'en empêche. Un mot d'Ethan renverse ça, et
  // c'est le nombre de départ qui change, pas l'architecture.
  let bandeCourante = 'batiments';
  /** Le côté imposé par le doigt, en pixels de buffer ; `null` = celui qui tient. */
  let coteVoulu = null;
  let decalageX = 0;
  let decalageY = 0;
  /** Vrai tant qu'un combat se déroule à l'écran — la préparation est l'autre état. */
  let deroule = false;
  /** La minuterie qui rend le bouton d'attaque vif — voir `armerLAttaque`. */
  let minuterieArmement = null;
  /** Combien de fois une image a été calculée, et le temps total — mesure M2. */
  const mesure = { images: 0, totalMs: 0 };

  /**
   * Avance d'UN tick, et relève ce que ce tick a publié.
   *
   * ⚠⚠ LE RELEVÉ SE FAIT LÀ OÙ L'INSTANTANÉ SE PREND, ET NULLE PART AILLEURS.
   * Les deux vont ensemble : `precedentes` sert l'interpolation, le journal sert
   * le son, et tous deux ne valent que pour le tick qu'on vient de jouer. C'est
   * pourquoi « Instantané » ne fait sonner RIEN — il boucle sur `tickCombat`
   * sans prendre d'instantané, exactement comme il le faisait déjà avant ce lot,
   * et un combat résolu d'un coup n'a pas de déroulé. Ce n'est pas un cas
   * particulier écrit à la main : c'est une conséquence de l'endroit.
   */
  function avancerDUnTick() {
    precedentes = prendrePositions(combat);
    tickCombat(combat);
    relever();
  }

  /** Verse le journal du dernier tick dans l'ensemble en attente. */
  function relever() {
    if (combat === null) return;
    for (const evenement of evenementsDuJournal(combat.journal)) {
      evenementsSonores.add(evenement);
    }
  }

  function arreterBoucle() {
    if (idImage !== null && typeof globalThis.cancelAnimationFrame === 'function') {
      globalThis.cancelAnimationFrame(idImage);
    }
    idImage = null;
  }

  /**
   * ⚠⚠ UN ÉLÉMENT CACHÉ MESURE ZÉRO, ET `calculerProjection` LÈVE DESSUS. Trouvé
   * au boot sans tête, pas à la relecture : le `ResizeObserver` se déclenche au
   * câblage, alors que `#ecran-raid` est encore `hidden`, et la page partait en
   * « viewport 1 × 1 trop petit pour une case » AVANT que le joueur ait rien
   * touché. C'est le piège que `initialiserBanc` évite en n'étant appelé qu'à
   * l'ouverture ; ici l'écran se câble au démarrage, donc la garde est dans la
   * mesure elle-même.
   *
   * ⚠ ON REND `false` ET ON NE DESSINE PAS, plutôt que de forcer une taille
   * minimale : une projection calculée sur un canevas invisible serait fausse,
   * et il faudrait la refaire de toute façon à l'ouverture.
   *
   * @returns {boolean} vrai si le canevas a une taille utilisable
   */
  /**
   * La bande que la vue cadre : celle qu'on a choisie, ou la vue d'ensemble
   * pendant le déroulé.
   *
   * ⚠ ELLE SE DEMANDE, ELLE NE SE RETIENT PAS. Écrire `bandeCourante = null` en
   * entrant dans le déroulé obligerait à la restaurer aux QUATRE portes de
   * sortie — fin normale, « Instantané », pas-à-pas, abandon — et c'est très
   * exactement le défaut que le lot ASSAUT a payé sur le chrome.
   */
  const bandeDeLaVue = () => (deroule ? null : bandeCourante);

  function dimensionner() {
    if (canvas === null) return false;
    const dpr = (doc.defaultView && doc.defaultView.devicePixelRatio) || 1;
    const largeur = Math.round(canvas.clientWidth * dpr);
    const hauteur = Math.round(canvas.clientHeight * dpr);
    if (largeur <= 0 || hauteur <= 0) { projection = null; return false; }
    if (canvas.width !== largeur) canvas.width = largeur;
    if (canvas.height !== hauteur) canvas.height = hauteur;
    // ⚠⚠ `MUR_CASES` — LA PLACE DU MUR PEINT, ET C'EST L'ÉCRAN QUI LE DIT. Le
    // champ de bataille montre une BASE, et une base porte son mur DANS son
    // décor : la projection réserve donc une demi-case à gauche, à droite et en
    // haut, pour que le fond se pose d'un mur à l'autre sans recouvrir une case
    // de contenu. Le banc d'essai n'a pas de décor et ne réserve rien.
    //
    // ⚠ IL VALAIT `1` JUSQU'AU LOT MUR-PEINT, quand le mur était un ANNEAU de
    // blocs dessinés case par case. La demi-case rend au champ de bataille
    // environ 10 % de taille de case à surface d'écran égale.
    //
    // ⚠⚠ LA BANDE DÉCIDE DU CADRAGE, ET C'EST TOUT LE §2 DU LOT. Avant elle, la
    // projection devait faire tenir DIX-HUIT rangées et demie dans un canevas
    // que `#raid-bas` laisse à 466 px CSS sur un S25 FE : c'était la HAUTEUR qui
    // commandait, la case tombait à 75 pixels de buffer au lieu de 108, et
    // **165 pixels de noir restaient de chaque côté du décor — 30,6 % de la
    // largeur**. Ethan : « de sorte que le fond remplisse toute la largeur ».
    // Huit rangées et demie font passer la limite du côté de la largeur, sans
    // condition.
    const lignesVisibles = casesDeLaBande(bandeDeLaVue(), MUR_CASES);
    // ⚠ LE PLANCHER SE DÉRIVE, IL NE S'ÉCRIT PAS : c'est la taille que la MÊME
    // formule rend quand on ne lui impose rien, donc celle qui fait tenir la
    // bande entière. L'écrire à la main donnerait un second letterboxing.
    const plancher = calculerProjection(largeur, hauteur, MUR_CASES, { lignesVisibles })
      .tailleCase;
    const plafond = plafondDuZoom(dpr);
    // ⚠ LE PLANCHER L'EMPORTE SUR LE PLAFOND, et l'ordre des bornes le dit : sur
    // un écran très large, la taille qui fait tenir la bande peut dépasser le
    // plafond de netteté. Montrer la bande entière est la contrainte forte ; du
    // pixel art légèrement interpolé est le prix, et il ne se paie que là.
    const cote = Math.max(plancher, Math.min(plafond, coteVoulu ?? plancher));
    const bornesY = bornesDuDecalage(bandeDeLaVue(), cote, hauteur, MUR_CASES);
    const bornesX = bornesDuDecalageX(cote, largeur, MUR_CASES);
    decalageY = Math.min(bornesY.max, Math.max(bornesY.min, decalageY));
    decalageX = Math.min(bornesX.max, Math.max(bornesX.min, decalageX));
    projection = calculerProjection(largeur, hauteur, MUR_CASES, {
      lignesVisibles, coteCase: cote, decalageX, decalageY,
    });
    return true;
  }

  /**
   * Va à une bande, et se pose à son début.
   *
   * ⚠ LE DÉCALAGE SE REMET À LA BORNE BASSE DE LA BANDE VISÉE, jamais à zéro :
   * la borne basse de la Défense est le haut de la Défense, et zéro serait le
   * haut de la base. Un joueur qui demande la défense et qui voit les bâtiments
   * croirait le bouton cassé.
   */
  function allerALaBande(cle) {
    if (!BANDES_NAVIGABLES.includes(cle)) return;
    bandeCourante = cle;
    // On force le décalage hors bornes : `dimensionner` le rabat sur le `min` de
    // la bande neuve, quel qu'il soit, sans que ce code-ci ait à le recalculer.
    decalageY = -Infinity;
    marquerBascule();
    dimensionner();
    dessiner();
  }

  /**
   * Ce combat doit-il s'effondrer à l'écran avant le rapport ?
   *
   * ⚠⚠ LA CONDITION SE LIT, ELLE NE SE RECALCULE PAS. `rapport.rase` sert déjà à
   * `$('raid-reattaquer').hidden` : c'est la MÊME vérité — « le site n'existe
   * plus » —, et en dériver une seconde ici en ferait deux qui divergeraient au
   * premier ajustement du moteur de raid.
   *
   * ⚠⚠ ET LA SIMULATION NE S'EFFONDRE PAS — DÉCISION DU LOT. Le simulateur ne
   * commande rien à personne : le bandeau « SIMULATEUR » existe pour qu'on ne
   * confonde pas un essai avec un ordre, et une animation de destruction y
   * ferait croire à une destruction. C'est la même garde que celle du son, qui
   * ne part que sur la vraie attaque, et que la deuxième des quatre de
   * `visibilitychange`.
   */
  function doitSEffondrer() {
    return !simulation && rapportCourant !== null && rapportCourant.rase === true;
  }

  /**
   * Les entités déjà tombées à cet instant de l'effondrement, ou `null`.
   *
   * ⚠⚠ UN ENSEMBLE D'INDICES, ET L'ÉTAT N'EST PAS TOUCHÉ — §2 du brief pris au
   * mot. Le premier jet copiait le combat en marquant les tombées `vivant:
   * false` ; c'était juste, et c'était de trop dès lors qu'elles laissent une
   * RUINE plutôt que du vide : `listeAffichage` doit savoir laquelle dessiner
   * autrement, pas laquelle sauter. On lui passe donc l'ensemble, et la décision
   * de ce qu'une chose détruite laisse derrière elle vit chez le dessin.
   */
  function tombeesALEcran() {
    if (effondrementMs === null || combat === null) return null;
    return effondrees(combat.entites, effondrementMs, ECRAN_RAID.effondrementMs);
  }

  function dessiner() {
    if (ctx === null || combat === null || projection === null) return;
    const debut = (doc.defaultView?.performance ?? globalThis.performance)?.now() ?? 0;
    // ⚠⚠ LES ARRIVÉES SE NOTENT ICI, JUSTE AVANT DE PEINDRE, ET C'EST UN ÉCART
    // AU BRIEF — DÉCLARÉ, ET MESURÉ. Il demandait de noter « AVANT
    // `prendrePositions` », c'est-à-dire dans `avancerDUnTick`. Mesuré : la
    // VAGUE 1 naît dans `creerCombat`, avant qu'un seul tick n'ait tourné — sa
    // dernière ligne pose la vague, ce que `rejouer` sait déjà puisqu'il relève
    // le journal juste après. Et la première image ne fait tourner AUCUN tick :
    // `derniereImageMs` est nul, donc `ecoule` vaut zéro, donc `ticksDus` rend
    // zéro. Noter dans `avancerDUnTick` aurait donc laissé la première vague —
    // très exactement celle qu'Ethan voit apparaître sur la bande du bas — sans
    // fantôme.
    //
    // ⚠ ET LE STAMP DOIT ÊTRE L'INSTANT DE LA PREMIÈRE IMAGE QUI DESSINE
    // L'ENTITÉ, pas celui de sa naissance : c'est de là que part la rampe de
    // 400 ms de temps réel. Ici, ces deux instants coïncident par construction,
    // pour toute entité et par tous les chemins — la boucle d'images, le
    // pas-à-pas du simulateur, et tout appelant à venir. Un second point
    // d'appel serait un point d'appel à oublier.
    //
    // ⚠ `dessiner` ÉCRIT DÉJÀ DANS `mesure`, donc elle n'est pas pure et ne l'a
    // jamais été. Ce qu'on lui ajoute est de la même nature : de l'état
    // d'AFFICHAGE, pas un fait de partie.
    noterLesArrivees(arrivees, combat, debut);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    executer(
      ctx,
      // ⚠⚠ LA GRAINE DE LA PARTIE, ET C'EST LA MÊME QUE L'ÉCRAN DE LA BASE
      // DONNE À SES CASES. Elle ne choisit pas QUELS obstacles sont là — ça,
      // c'est le montage du site — mais LEQUEL de leurs deux dessins se pose.
      // Passer la graine du site à la place ferait un second tirage : le même
      // obstacle, à la même case, n'aurait plus le même dessin des deux côtés,
      // et c'est très exactement ce que ce point d'Ethan demande de refermer.
      listeAffichage(combat, projection, precedentes,
        combat.termine ? 0 : alphaMilli(accumulateur, vitesse), fondCourant,
        etatCourant.graine, tombeesALEcran(), arriveesALEcran(arrivees, debut)),
      atlas ?? {},
    );
    const fin = (doc.defaultView?.performance ?? globalThis.performance)?.now() ?? 0;
    mesure.images += 1;
    mesure.totalMs += fin - debut;
  }

  function image(horodatageMs) {
    idImage = null;
    const ecoule = derniereImageMs === null ? 0 : horodatageMs - derniereImageMs;
    derniereImageMs = horodatageMs;
    if (combat !== null && !combat.termine && !enPause) {
      const dus = ticksDus(accumulateur, ecoule, vitesse);
      for (let k = 0; k < dus && !combat.termine; k += 1) {
        // L'instantané se prend AVANT le tick : c'est lui que l'interpolation
        // compare à la position d'après. Le journal se relève après.
        avancerDUnTick();
      }
    }
    // ⚠⚠ L'EFFONDREMENT S'INTERCALE ICI, ENTRE LA FIN DU COMBAT ET LE RAPPORT —
    // lot EFFONDREMENT, 07/09. Il prend son temps sur la boucle d'images, celle
    // qui tourne déjà : c'est ce qui le fige avec elle quand l'application passe
    // en arrière-plan, là où un `setTimeout` continuerait de courir tout seul.
    //
    // ⚠ IL COMMENCE À ZÉRO, ET LA PREMIÈRE IMAGE MONTRE DONC LE SITE INTACT.
    // Ajouter `ecoule` dès l'entrée ferait sauter la première tranche.
    //
    // ⚠⚠ `deroule` GARDE L'ENTRÉE, ET C'EST UN DÉFAUT TROUVÉ PAR `EFF T4`, PAS
    // À LA RELECTURE. Sans lui, une image qui arrive APRÈS le rapport RELANCE
    // l'effondrement : `finDuDeroule` remet `effondrementMs` à `null`, le
    // combat est toujours terminé, et `doitSEffondrer` répond encore oui. Le
    // site se serait remis à tomber derrière le panneau de résultat, en boucle.
    // En production `arreterBoucle` annule la demande et cette image n'arrive
    // pas — mais compter sur une annulation n'est pas une conception, et c'est
    // la même garde, pour la même raison, que la troisième des quatre de
    // `visibilitychange` : `deroule` est exactement « un déroulé est en cours ».
    if (deroule && combat !== null && combat.termine
      && effondrementMs === null && doitSEffondrer()) {
      effondrementMs = 0;
    } else if (effondrementMs !== null) {
      effondrementMs += ecoule;
    }
    dessiner();
    if (effondrementMs !== null) {
      if (effondrementMs >= ECRAN_RAID.effondrementMs) { finDuDeroule(); return; }
    } else if (combat !== null && combat.termine) { finDuDeroule(); return; }
    if (!enPause) idImage = doc.defaultView.requestAnimationFrame(image);
  }

  function demarrerBoucle() {
    if (idImage !== null || combat === null || combat.termine) return;
    derniereImageMs = null; // pas de rattrapage du temps passé arrêté
    idImage = doc.defaultView.requestAnimationFrame(image);
  }

  /**
   * ⚠ LE DÉROULÉ EST UN REJEU, PAS LA SOURCE DE VÉRITÉ. L'état a déjà été commis
   * par `executerRaid` avant la première image — arbitrage « A » du 01/09. Si
   * l'application est tuée pendant l'animation, rien n'est perdu, et « passer »
   * est gratuit puisqu'il n'interrompt aucun calcul.
   *
   * ⚠ ET LE REJEU EST EXACT PARCE QUE LE COMBAT N'A AUCUN HASARD :
   * `Math.random` n'apparaît pas une fois dans `sim/combat.js`. S'il divergeait
   * du rapport, ce serait un bogue de MONTAGE, jamais une fatalité.
   */
  function rejouer(montage, vagues) {
    combat = creerCombat({ ...montage, vagues });
    // ⚠ LE JOURNAL DE LA CRÉATION PORTE L'ENTRÉE DE LA VAGUE 1. `creerCombat` la
    // pose au tick 0 — c'est sa dernière ligne — et `tick()` viderait ce journal
    // à la première image. Sans ce relevé-ci, la première vague serait la seule
    // des quatre à entrer en silence.
    relever();
    precedentes = prendrePositions(combat);
    accumulateur = creerAccumulateur();
    enPause = false;
    // ⚠ UN DÉROULÉ NEUF NE PORTE PAS L'EFFONDREMENT DU PRÉCÉDENT. `masquer` coupe
    // la boucle sans passer par `finDuDeroule` : sans cette ligne, un raid lancé
    // après un écran quitté en plein effondrement croirait en reprendre un.
    effondrementMs = null;
    // ⚠ NI LES ARRIVÉES DU PRÉCÉDENT, ET POUR LA MÊME RAISON. `vus` est une
    // marque haute sur l'INDICE : gardée d'un raid à l'autre, elle serait déjà
    // au-delà de la vague 1 du raid neuf, dont les unités apparaîtraient alors
    // sans fantôme — et seulement pour le deuxième raid d'une session, ce qui est
    // la pire façon de rater un effet.
    arrivees = creerArrivees();
    dimensionner();
    demarrerBoucle();
  }

  // --- les deux états de l'écran --------------------------------------------
  //
  // ⚠⚠ PRÉPARATION ET DÉROULÉ, ET LA FIN EST LA PRÉPARATION. Ethan, 04/09 :
  // « quand on lance un raid, toutes les barres disparaissent. On voit juste la
  // simulation en cours. » Ce qui part : les onglets et les deux bandeaux, que
  // la session écrit, et `#raid-bas`, que cet écran-ci possède. Ce qui RESTE :
  // les vitesses, qui sont le contrôle du déroulé lui-même.
  //
  // ⚠ LES DEUX SONT IDEMPOTENTES, et ce n'est pas de la coquetterie :
  // `quitterLeDeroule` est appelée par trois portes — la fin du combat,
  // `fermerPanneaux` et `masquer` — dont deux passent aussi au câblage et à
  // chaque ouverture. Sans le garde-fou, la session recevrait un « le déroulé
  // est fini » avant qu'aucun n'ait commencé.

  function entrerDansLeDeroule() {
    deroule = true;
    // ⚠⚠ LA FICHE D'UNE CIBLE NE SURVIT PAS AU LANCEMENT. Le combat est un
    // rejeu d'un état DÉJÀ COMMIS : laisser une fiche ouverte par-dessus
    // ferait croire à une pause qui n'existe pas, et la pièce qu'elle décrit
    // peut tomber dans la seconde qui suit. Elle se referme donc ici, en plus
    // d'être interdite pendant le déroulé — les deux, parce que le déroulé
    // s'ouvre par trois portes et que la garde du toucher ne ferme rien.
    fermerLaFiche();
    const bas = $('raid-bas');
    if (bas !== null) bas.hidden = true;
    // ⚠⚠ LE DÉROULÉ S'OUVRE SUR LA VUE D'ENSEMBLE, ZOOM COMPRIS. C'est la moitié
    // de la lecture du §3.1 : garder le gros plan de la préparation ferait
    // regarder trois colonnes pendant que le combat traverse les dix-huit
    // rangées. Le pincement reste disponible — le joueur peut se rapprocher
    // s'il le veut —, il ne s'applique simplement pas de lui-même.
    coteVoulu = null;
    marquerBascule();
    pendantLeDeroule(true);
  }

  function quitterLeDeroule() {
    if (!deroule) return;
    deroule = false;
    const bas = $('raid-bas');
    if (bas !== null) bas.hidden = false;
    // Les vitesses sont un contrôle du déroulé : elles s'en vont avec lui.
    const vitesses = $('raid-vitesses');
    if (vitesses !== null) vitesses.hidden = true;
    // ⚠ ON REVIENT À LA BANDE, DONC LE CADRAGE CHANGE : `#raid-bas` reparaît et
    // la vue redevient celle d'une bande. Le `ResizeObserver` verra la hauteur
    // bouger, mais pas la bande — c'est ici qu'on le dit.
    coteVoulu = null;
    decalageY = -Infinity;
    marquerBascule();
    dimensionner();
    dessiner();
    pendantLeDeroule(false);
  }

  /**
   * Le gros bouton d'attaque : son prix, et le court délai qui le rend vif.
   *
   * ⚠⚠ IL NAÎT INERTE À CHAQUE ENTRÉE SUR L'ÉCRAN. Voir `ECRAN_RAID` dans
   * `src/data/sites.js` pour le motif entier : le bouton est gros et il est
   * posé à l'endroit de la carte qu'on vient de toucher deux fois.
   *
   * ⚠ INERTE, ET QUI SE VOIT. Un bouton qui ne répond pas sans le dire est un
   * bouton cassé — l'attribut `disabled` porte l'aspect que le dépôt emploie
   * déjà pour `#raid-fin .boutons button[disabled]`, et il n'en faut pas une
   * seconde.
   *
   * @param {number|null} cout
   */
  function armerLAttaque(cout) {
    const bouton = $('raid-attaquer');
    if (bouton === null) return;
    const { mot, prix } = libelleDAttaque(cout);
    const grand = bouton.querySelector('b');
    const petit = bouton.querySelector('small');
    if (grand !== null) grand.textContent = mot;
    if (petit !== null) { petit.textContent = prix; petit.hidden = prix === ''; }
    bouton.disabled = true;
    const fenetre = doc.defaultView;
    if (fenetre === null || typeof fenetre.setTimeout !== 'function') {
      bouton.disabled = false;
      return;
    }
    if (minuterieArmement !== null) fenetre.clearTimeout(minuterieArmement);
    minuterieArmement = fenetre.setTimeout(() => {
      minuterieArmement = null;
      bouton.disabled = false;
    }, ECRAN_RAID.delaiArmementMs);
  }

  function finDuDeroule() {
    arreterBoucle();
    quitterLeDeroule();
    // ⚠ L'EFFONDREMENT SE REFERME ICI, ET PAR UN SEUL ENDROIT. Trois portes y
    // mènent — la boucle qui arrive au bout, « Instantané », et la page qui se
    // masque — et chacune passe par cette fonction. Le remettre à `null` ailleurs
    // aurait fait trois écritures d'une même remise à zéro.
    //
    // ⚠⚠ ET IL SE REFERME APRÈS `quitterLeDeroule`, PAS AVANT. Celle-ci REDESSINE
    // — elle change de cadrage, donc elle repeint — et le faire avec un
    // effondrement déjà oublié rendrait le site INTACT sur la dernière image,
    // juste avant que le rapport ne la recouvre. Le champ de ruines est ce que
    // le joueur doit voir derrière son rapport.
    effondrementMs = null;
    if (rapportCourant !== null) montrerResultat(rapportCourant, simulation);
  }

  /**
   * Résout ce qui reste du combat SUR-LE-CHAMP, puis montre le rapport.
   *
   * ⚠⚠ C'EST LE CHEMIN DE `#raid-instantane`, EXTRAIT ET NON RECOPIÉ. Deux
   * appelants le demandent désormais — le bouton du simulateur et le masquage de
   * la page (voir plus bas) —, et deux écritures voisines de « conclure un
   * combat » divergeraient au premier ajustement, la seconde n'étant éprouvée
   * par personne. Pas une ligne de son corps n'a changé en route.
   *
   * ⚠ ELLE NE DÉCIDE DE RIEN. Qui a le droit de l'appeler, et quand, se juge
   * chez l'appelant : le bouton n'existe que pour le simulateur, l'écouteur
   * porte ses quatre gardes. Une garde écrite ici les rendrait invisibles depuis
   * les deux points d'appel.
   */
  function conclureLeDeroule() {
    if (combat === null) return;
    enPause = false;
    arreterBoucle();
    while (!combat.termine) tickCombat(combat);
    dessiner();
    finDuDeroule();
  }

  // --- les panneaux de résultat ---------------------------------------------
  //
  // ⚠⚠ DEUX TAILLES, UN SEUL CONTENU. Les deux panneaux rendent
  // `lignesDuResultat` du MÊME rapport : ils ne peuvent pas diverger, puisqu'ils
  // n'ont rien à calculer. C'est ce que le test T7 vérifie.

  function remplirLignes(hote, rapport) {
    hote.textContent = '';
    for (const ligne of lignesDuResultat(rapport)) {
      const bloc = doc.createElement('div');
      bloc.className = 'ligne';
      const quoi = doc.createElement('span');
      quoi.className = 'quoi';
      // ⚠ TOUTES LES LIGNES N'ONT PAS D'IMAGE, ET C'EST VOULU. « Verdict » ou
      // « Défense restante » ne sont pas des grandeurs dessinées ; leur poser un
      // pictogramme par symétrie dirait quelque chose que l'archive ne dit pas.
      if (ligne.picto !== undefined) quoi.append(creerPictogramme(doc, ligne.picto));
      quoi.append(doc.createTextNode(ligne.quoi));
      const valeur = doc.createElement('b');
      valeur.textContent = ligne.valeur;
      bloc.append(quoi, valeur);
      hote.appendChild(bloc);
    }
  }

  function montrerResultat(rapport, petit) {
    const hote = petit ? $('raid-sim-corps') : $('raid-fin-corps');
    if (hote === null) return;
    remplirLignes(hote, rapport);
    if (petit) {
      $('raid-sim').hidden = false;
    } else {
      // ⚠ « RÉ-ATTAQUER » N'APPARAÎT QUE SI LA BASE N'EST PAS RASÉE — il n'y a
      // plus rien à attaquer sinon. Et il repasse par `problemesDuRaid` : un
      // second raid coûte encore des points, et l'armée qui revient est abîmée.
      const rejouable = !rapport.rase && etatCourant !== null && cibleCourante !== null
        && problemesDuRaid(etatCourant, baseCourante(etatCourant), cibleCourante).length === 0;
      $('raid-reattaquer').hidden = rapport.rase;
      $('raid-reattaquer').disabled = !rejouable;
      $('raid-fin').hidden = false;
    }
  }

  // --- l'armée ---------------------------------------------------------------
  const cellules = new Map();
  const cle = (vague, colonne) => `${vague}:${colonne}`;

  function peindreVagues() {
    const hote = $('raid-vagues');
    if (hote === null || etatCourant === null) return;
    hote.textContent = '';
    cellules.clear();
    for (const vague of vaguesDeLArmee(etatCourant, formation)) {
      const bloc = doc.createElement('div');
      bloc.className = 'vague';
      const rangee = doc.createElement('div');
      rangee.className = 'emplacements';
      rangee.style.gridTemplateColumns = `repeat(${NB_COLONNES}, 1fr)`;
      for (let colonne = 1; colonne <= NB_COLONNES; colonne += 1) {
        const occupant = vague.cases[colonne - 1];
        const emplacement = doc.createElement('div');
        emplacement.className = 'emplacement';
        emplacement.dataset.vague = String(vague.numero);
        emplacement.dataset.colonne = String(colonne);
        if (occupant !== null) {
          emplacement.classList.add('occupe');
          emplacement.dataset.index = String(occupant.index);
          if (!occupant.actif) emplacement.classList.add('inactive');
          if (occupant.degatsMilli > 0) emplacement.classList.add('abimee');
          emplacement.title = `${occupant.nom} · niveau ${occupant.niveau}`
            + ` · ${occupant.pvPct} % de PV${occupant.actif ? '' : ' · reste à la maison'}`;
          // ⚠⚠ LE SPRITE A REMPLACÉ LE NOM — Ethan, 04/09 : « il n'y a pas les
          // sprites de nos unités en bas ». L'emplacement portait le nom en 6 px
          // sur un bloc noir : six « Fusiliers » côte à côte se lisaient comme
          // six étiquettes, pas comme une armée. C'est le geste que l'écran
          // Offense a reçu le 30/08, et c'est la MÊME vignette — même fonction
          // de couches, même pose, même part de 84 %.
          //
          // ⚠ LE NOM N'EST PAS PERDU : il est déjà dans le `title` ci-dessus,
          // avec le niveau et les PV. « Rien ne se retire en silence » (§4).
          const piece = doc.createElement('div');
          piece.className = 'piece';
          poserCouches(piece, couchesDeLUniteDAssaut(occupant.id));
          emplacement.appendChild(piece);
          // ⚠⚠ ET LE NIVEAU AVEC — Ethan, 06/09 : « le niveau des unités
          // offensives ne s'affiche pas dans l'ui ». Ce sont les MÊMES pièces
          // que l'écran Offense, dans la même grille de composition : les
          // écrire d'un côté seulement aurait laissé au joueur un écran où le
          // niveau se lit et un autre où il ne se lit pas, pour une armée qui
          // est la même. Le nombre vient de `vaguesDeLArmee`, qui le porte déjà.
          const niveau = doc.createElement('span');
          niveau.className = 'niveau';
          niveau.textContent = String(occupant.niveau);
          emplacement.appendChild(niveau);
          // ⚠⚠ LE BADGE PASSAGER EST LE POINT LE PLUS FRAGILE DU LOT, ET IL VAUT
          // MIEUX LE DIRE QUE L'ESPÉRER. La cible est un téléphone et une case
          // de vague fait une trentaine de pixels : le badge fait 24 px CSS de
          // côté au minimum — la borne de toucher que le dépôt emploie déjà pour
          // les boutons — et porte `touch-action: none`, sans quoi le navigateur
          // avalerait le glissement pour faire défiler la page. Si à l'usage il
          // reste trop petit, la correction n'est PAS de l'agrandir
          // indéfiniment : c'est d'ajouter un mode « Débarquer » à `MODES_RAID`,
          // comme « Réparer ». Ce lot ne le fait pas, et le rapport pose la
          // question à Ethan.
          if (occupant.passager !== null) {
            emplacement.classList.add('chargee');
            const badge = doc.createElement('button');
            badge.type = 'button';
            badge.className = 'badge-passager';
            badge.dataset.passager = String(occupant.passager.index);
            badge.title = `${occupant.passager.nom} · niveau ${occupant.passager.niveau}`
              + ` · embarquée · ${occupant.passager.pvPct} % de PV`;
            // Le châssis de la passagère, pas son nom : la case est trop petite
            // pour un mot, et le pictogramme est celui que le dépôt emploie déjà.
            badge.appendChild(creerPictogramme(
              doc, PICTOGRAMME_DU_CHASSIS[UNITES[occupant.passager.id].chassis],
              { libelle: occupant.passager.nom },
            ));
            emplacement.appendChild(badge);
          }
        }
        cellules.set(cle(vague.numero, colonne), emplacement);
        rangee.appendChild(emplacement);
      }
      bloc.appendChild(rangee);
      hote.appendChild(bloc);
    }
  }

  function avis(texte) {
    const ligne = $('raid-avis');
    if (ligne === null) return;
    ligne.textContent = texte;
    ligne.hidden = texte === '';
  }

  // --- les modes -------------------------------------------------------------
  function desarmer() {
    mode = null;
    for (const m of Object.values(MODES_RAID)) {
      const bouton = $(m.bouton);
      if (bouton !== null) bouton.classList.remove('arme');
    }
    const tout = $('raid-tout-reparer');
    if (tout !== null) tout.hidden = true;
    avis('');
  }

  function armer(nom) {
    if (mode === nom) { desarmer(); return; }
    desarmer();
    mode = nom;
    const m = MODES_RAID[nom];
    $(m.bouton).classList.add('arme');
    // ⚠ « TOUT RÉPARER » N'APPARAÎT QUE LE MODE RÉPARER ARMÉ, et AU-DESSUS de la
    // rangée — Ethan, 01/09.
    if (nom === 'reparer') $('raid-tout-reparer').hidden = false;
    avis(m.invite);
  }

  /** Le geste d'un mode sur une pièce : on demande, puis on agit. */
  function agirSur(index) {
    const m = MODES_RAID[mode];
    if (m === undefined || etatCourant === null) return;
    const problemes = m.problemes(etatCourant, index);
    if (problemes.length > 0) {
      // Les messages de refus se reprennent MOT POUR MOT : ils sont déjà écrits
      // en français lisible dans `sim/`, et les reformuler ici en ferait une
      // seconde formulation qui finirait par dire autre chose que la règle.
      avis(problemes.map((p) => p.message).join(' ; '));
      desarmer();
      peindreVagues();
      return;
    }
    m.agir(etatCourant, index, formation);
    // ⚠⚠ UNE RÉPARATION CHANGE `etat.armee` SOUS UNE FORMATION DÉJÀ COPIÉE, ET
    // SANS CETTE LIGNE LE RAID PARTIRAIT AVEC LES DÉGÂTS D'IL Y A CINQ MINUTES.
    // Pire : une pièce remontée au-dessus du plancher de PV resterait à la
    // maison, puisque c'est la formation que `composerLesVagues` lit. Aucun
    // test ne l'aurait dit — les deux chemins sont muets.
    if (m.ecritSurLArmee) resynchroniserLaFormation(etatCourant, formation);
    desarmer();
    peindreVagues();
    apresGeste();
  }

  // --- le glisser-déposer ----------------------------------------------------
  //
  // ⚠ POINTER EVENTS, PAS SOURIS. La cible est un téléphone : les événements de
  // souris n'y arrivent qu'en émulation, et jamais pendant un vrai glissement.
  //
  // ⚠⚠ ET IL PASSE PAR LA FORMATION, TOUJOURS. Le glisser-déposer est un GESTE
  // D'ENTRÉE ; écrire la case d'arrivée en direct donnerait une seconde vérité
  // sur qui peut aller où, et le premier désaccord se lirait comme un bogue de
  // jeu. On demande à `problemesDe…`, puis on agit — et jamais un `try` autour
  // du geste : `deplacerEnFormation` LÈVE, c'est la liste de problèmes qui parle
  // au joueur.
  //
  // ⚠⚠ QUATRE GESTES SUR LE MÊME GLISSEMENT, ET UN SEUL EST NEUF EN GÉOMÉTRIE.
  // Déposer sur une case libre DÉPLACE ; sur une case occupée, on PERMUTE — sauf
  // si l'on tient une infanterie et que la case porte un véhicule à module
  // Garnison, auquel cas on EMBARQUE (Ethan, 08/09 : « glisser une escouade sur
  // la case d'un porteur éligible »). Et ce qu'on tient peut être une passagère,
  // prise sur son badge : elle DÉBARQUE sur une case libre, ou change de
  // véhicule sur une case occupée.
  let saisie = null;

  /** La ligne de cette pièce porte-t-elle le module Garnison, acquis ou non ? */
  function ligneDeTransport(id) {
    return nomDuModule('offense', id) === MODULE_DE_TRANSPORT;
  }

  /** L'indice de la pièce POSÉE sur cette case de la formation, ou `null`. */
  function occupantDeLaCase(position) {
    const trouve = formation.findIndex((piece) => !estPassager(piece)
      && piece.vague === position.vague && piece.colonne === position.colonne);
    return trouve === -1 ? null : trouve;
  }

  /** On demande, on agit si la liste est vide, on répète le refus sinon. */
  function tenter(problemes, agir) {
    if (problemes.length > 0) {
      avis(problemes.map((p) => p.message).join(' ; '));
      return;
    }
    agir();
    avis('');
    peindreVagues();
    apresGeste();
  }

  function surPointerDown(evenement) {
    const emplacement = evenement.target.closest?.('.emplacement');
    if (emplacement === null || emplacement === undefined || etatCourant === null) return;
    const index = emplacement.dataset.index;
    // ⚠ UN MODE ARMÉ L'EMPORTE TOUJOURS SUR LE GLISSEMENT : le doigt désigne, il
    // ne traîne pas. La dette d'ergonomie déclarée en tête de ce fichier —
    // modes tactiles et glissement sur la même grille 4 × 9 — reste entière, et
    // ce lot ne l'aggrave pas.
    if (mode !== null) {
      if (index !== undefined) agirSur(Number(index));
      else desarmer();
      return;
    }
    if (index === undefined) return;
    // ⚠ LE BADGE PREND LA PASSAGÈRE, LE RESTE DE LA CASE PREND LE PORTEUR. Sans
    // ce départage, une escouade embarquée serait inatteignable au doigt : elle
    // n'a plus de case à elle.
    const badge = evenement.target.closest?.('.badge-passager');
    const enMain = badge === null || badge === undefined
      ? Number(index) : Number(badge.dataset.passager);
    saisie = { index: enMain, depuis: emplacement };
    emplacement.classList.add('enmain');
    if (typeof emplacement.setPointerCapture === 'function') {
      emplacement.setPointerCapture(evenement.pointerId);
    }
  }

  function surPointerUp(evenement) {
    if (saisie === null || etatCourant === null) return;
    const { index, depuis } = saisie;
    saisie = null;
    depuis.classList.remove('enmain');
    const arrivee = doc.elementFromPoint?.(evenement.clientX, evenement.clientY)
      ?.closest?.('.emplacement');
    if (arrivee === null || arrivee === undefined) return;
    const position = {
      vague: Number(arrivee.dataset.vague),
      colonne: Number(arrivee.dataset.colonne),
    };
    const occupant = occupantDeLaCase(position);

    // --- ce qu'on tient est une PASSAGÈRE ------------------------------------
    if (estPassager(formation[index])) {
      if (occupant === null) {
        tenter(
          problemesDuDebarquementEnFormation(formation, index, position),
          () => debarquerEnFormation(formation, index, position),
        );
        return;
      }
      // Sur une case occupée : elle change de véhicule. Un occupant qui ne
      // transporte personne rend `sansModule`, et le joueur lit pourquoi.
      tenter(
        problemesDeLEmbarquement(etatCourant, formation, index, occupant),
        () => embarquerEnFormation(etatCourant, formation, index, occupant),
      );
      return;
    }

    // --- case libre : on déplace ---------------------------------------------
    if (occupant === null || occupant === index) {
      tenter(
        problemesDuDeplacementEnFormation(formation, index, position),
        () => deplacerEnFormation(formation, index, position),
      );
      return;
    }

    // --- une infanterie sur une ligne qui transporte : on embarque -----------
    //
    // ⚠ LE ROUTAGE LIT LA LIGNE, PAS L'ACQUISITION. Sur un porteur dont le
    // module n'est pas payé, le geste rend `moduleNonAcquis` — un refus qui dit
    // au joueur où aller. Router sur `estPorteur` renverrait la permutation à sa
    // place, et ce refus-là ne s'afficherait jamais.
    if (UNITES[formation[index].id]?.chassis === CHASSIS_DU_PASSAGER
      && ligneDeTransport(formation[occupant].id)) {
      tenter(
        problemesDeLEmbarquement(etatCourant, formation, index, occupant),
        () => embarquerEnFormation(etatCourant, formation, index, occupant),
      );
      return;
    }

    // --- sinon on permute, passagères comprises ------------------------------
    //
    // ⚠ UNE PIÈCE CHARGÉE SE PERMUTE, ET SA PASSAGÈRE SUIT SANS UNE ÉCRITURE :
    // elle n'a pas de case à elle, `embarqueDans` porte un INDICE, et les indices
    // ne bougent pas — `permuterEnFormation` échange deux positions en place.
    tenter(
      problemesDeLaPermutationEnFormation(formation, index, occupant),
      () => permuterEnFormation(formation, index, occupant),
    );
  }

  const hoteVagues = $('raid-vagues');
  if (hoteVagues !== null) {
    hoteVagues.addEventListener('pointerdown', surPointerDown);
    hoteVagues.addEventListener('pointerup', surPointerUp);
    hoteVagues.addEventListener('pointercancel', () => {
      if (saisie !== null) saisie.depuis.classList.remove('enmain');
      saisie = null;
    });
  }

  // --- la bascule de bande, et le zoom au doigt -------------------------------
  //
  // ⚠⚠ LE GESTE EST CELUI DE LA CARTE, PAS CELUI DE LA BASE, ET LA RAISON EST
  // LA SURFACE. `#raid-canvas` porte `touch-action: none` : le navigateur n'a
  // aucun geste à lui disputer, donc les évènements de POINTEUR y sont fiables —
  // c'est exactement ce que `ui/monde.js` explique pour son propre canevas.
  // L'écran de la base, lui, passe par `touchmove` parce que son conteneur
  // défile NATIVEMENT et que le navigateur lui prend la main à deux doigts.
  // Écrire les deux pareil aurait demandé de repeindre un défilement à la main.
  //
  // ⚠⚠ ET LE GLISSER-DÉPOSER NE VIT PAS SUR CETTE SURFACE — MESURÉ, PAS SUPPOSÉ.
  // Il est posé sur `#raid-vagues`, la rangée du bas, et pas une ligne de ce
  // fichier n'écoute le canevas avant ce lot. Les deux gestes ne peuvent donc
  // pas se disputer un contact : ce sont deux éléments, et un contact tombe sur
  // un seul. La dette d'ergonomie déclarée en tête de ce fichier — les modes
  // tactiles et le glissement sur la même grille 4 × 9 — reste entière, et ce
  // lot ne l'aggrave pas d'un pixel.
  //
  // ⚠ UN DOIGT PROMÈNE, DEUX DOIGTS ZOOMENT — la règle du 30/08, la même
  // partout.

  const boutonBascule = $('raid-bascule-bande');

  function marquerBascule() {
    if (boutonBascule === null) return;
    // Pendant le déroulé il n'y a pas de bande : la vue est d'ensemble, et un
    // bouton qui emmènerait ailleurs pendant qu'un combat se joue n'a pas de
    // sens. Il revient avec `#raid-bas`, par la même porte.
    boutonBascule.hidden = deroule;
    const bascule = basculeDeBande(bandeCourante);
    boutonBascule.textContent = bascule.glyphe;
    boutonBascule.title = bascule.libelle;
    boutonBascule.setAttribute('aria-label', bascule.libelle);
  }

  if (boutonBascule !== null) {
    boutonBascule.addEventListener('click', () => {
      allerALaBande(basculeDeBande(bandeCourante).cible);
    });
  }

  // --- la fiche d'une cible ennemie ------------------------------------------
  //
  // ⚠⚠ POINTS 7 ET 8 DU 07/09. Ethan : « En prépa raid, possibilité de cliquer
  // sur une unité ennemie pour voir ses stats », puis « idem pour les
  // bâtiments ». Le contenu est `ficheDeLEntite`, PURE et exportée ; le rendu
  // est `peindreVueDuPanneau`, partagé avec le Chantier et l'Offense. Ce bloc
  // ne fait que DÉSIGNER l'entité et poser le panneau.

  const elementsFiche = {
    titre: $('raid-fiche-titre'),
    corps: $('raid-fiche-corps'),
    // ⚠ AUCUN BOUTON, ET C'EST DÉLIBÉRÉ. Le rendu partagé le tolère depuis ce
    // lot : « la fiche informe, elle ne suggère rien ». Un bouton mort pour
    // satisfaire une signature aurait été un geste qui n'existe pas.
    bouton: null,
  };

  function fermerLaFiche() {
    const panneau = $('raid-fiche');
    if (panneau !== null) panneau.hidden = true;
  }

  /**
   * Ouvre la fiche sur l'entité qui occupe une case, s'il y en a une.
   *
   * ⚠⚠ UNE CASE VIDE NE FAIT RIEN — ni ouvrir, ni fermer. C'est la décision
   * que le brief demandait d'écrire : fermer une fiche qu'on vient de lire
   * parce que le doigt a manqué la case de deux pixels serait exactement le
   * « par surprise » qu'il interdit. La fiche se ferme par son bouton, en
   * quittant la cible, ou en lançant le raid.
   *
   * ⚠ ET C'EST LA DERNIÈRE DE LA LISTE QUI GAGNE. `entitesSurLaCase` peut en
   * rendre DEUX — l'aviation ne bloque rien et partage sa case avec ce qui est
   * au sol — et c'est celle du DESSUS qu'on désigne, comme `ui/monde.js`
   * cherche son site à l'envers pour la même raison.
   */
  function ouvrirLaFicheSur(cible) {
    if (combat === null || cible === null) return;
    const occupants = entitesSurLaCase(combat, cible.rangee, cible.colonne)
      .filter((e) => e.camp !== 'attaque');
    if (occupants.length === 0) return;
    const panneau = $('raid-fiche');
    if (panneau === null || elementsFiche.titre === null || elementsFiche.corps === null) return;
    peindreVueDuPanneau(doc, elementsFiche, ficheDeLEntite(occupants[occupants.length - 1]));
    panneau.hidden = false;
  }

  const boutonFermerFiche = $('raid-fiche-fermer');
  if (boutonFermerFiche !== null) boutonFermerFiche.addEventListener('click', fermerLaFiche);

  /** Les contacts en cours, par identifiant — jamais un compteur. */
  const doigts = new Map();
  let pincement = null;
  let pointeur = null;

  const ecartDesDoigts = (deux) => Math.hypot(deux[0].x - deux[1].x, deux[0].y - deux[1].y);

  /** Le milieu des deux doigts, en pixels du BUFFER du canevas. */
  function milieuDesDoigts(deux) {
    const cadre = canvas.getBoundingClientRect();
    const dpr = (doc.defaultView && doc.defaultView.devicePixelRatio) || 1;
    return {
      x: ((deux[0].x + deux[1].x) / 2 - cadre.left) * dpr,
      y: ((deux[0].y + deux[1].y) / 2 - cadre.top) * dpr,
    };
  }

  /**
   * Change le côté de case en gardant la case sous les doigts sous les doigts.
   *
   * ⚠⚠ ON RELIT LA PROJECTION AU LIEU DE REFAIRE SON CENTRAGE. Le décalage qui
   * garde l'ancre dépend du centrage, et le centrage est une ligne de
   * `calculerProjection` : la recopier ici en ferait une seconde vérité, et la
   * divergence se lirait comme une vue qui saute d'un demi-écran au premier
   * pincement. On applique, on relit où l'ancre est tombée, on corrige, on
   * réapplique — trois calculs purs, et aucune formule dupliquée.
   */
  function reglerCote(nouveau, ancre) {
    if (projection === null || !Number.isFinite(nouveau)) return;
    const u = (ancre.x - projection.margeX) / projection.tailleCase;
    const v = (ancre.y - projection.margeY) / projection.tailleCase;
    coteVoulu = nouveau;
    if (!dimensionner()) return;
    decalageX += projection.margeX - ancre.x + u * projection.tailleCase;
    decalageY += projection.margeY - ancre.y + v * projection.tailleCase;
    dimensionner();
    dessiner();
  }

  function ouvrirPincement() {
    if (doigts.size !== 2) { pincement = null; return; }
    const deux = [...doigts.values()];
    const ecart = ecartDesDoigts(deux);
    // Deux doigts joints donneraient un rapport qui explose au premier pixel.
    if (ecart < 1) { pincement = null; return; }
    pincement = { ecart };
  }

  if (canvas !== null) {
    canvas.addEventListener('pointerdown', (evenement) => {
      if (typeof canvas.setPointerCapture === 'function') {
        canvas.setPointerCapture(evenement.pointerId);
      }
      doigts.set(evenement.pointerId, { x: evenement.clientX, y: evenement.clientY });
      if (doigts.size >= 2) { ouvrirPincement(); return; }
      pointeur = {
        id: evenement.pointerId, x: evenement.clientX, y: evenement.clientY,
        // ⚠ TROIS PIXELS CSS DE TOLÉRANCE, LE MÊME NOMBRE QUE `ui/monde.js` : un
        // doigt ne se pose jamais parfaitement immobile, et compter le moindre
        // frémissement comme un promenage rendrait le toucher d'une pièce
        // impossible. Écrire une seconde tolérance ici ferait deux gestes
        // différents pour le même doigt sur deux canevas voisins.
        departX: evenement.clientX, departY: evenement.clientY, glisse: false,
      };
    });

    canvas.addEventListener('pointermove', (evenement) => {
      if (doigts.has(evenement.pointerId)) {
        doigts.set(evenement.pointerId, { x: evenement.clientX, y: evenement.clientY });
      }
      if (pincement !== null && doigts.size === 2) {
        const deux = [...doigts.values()];
        const ecart = ecartDesDoigts(deux);
        const rapport = ecart / pincement.ecart;
        // ⚠ LE RAPPORT DES ÉCARTS, PAS LEUR DIFFÉRENCE : une différence en
        // pixels zoomerait plus vite sur un grand écran que sur un petit, pour
        // le même geste de la main.
        if (ecart >= 1 && Number.isFinite(rapport) && projection !== null) {
          reglerCote(projection.tailleCase * rapport, milieuDesDoigts(deux));
        }
        // On ré-ancre sur l'écart RÉEL, y compris quand la butée a refusé le
        // changement : sinon il faudrait « rendre » le pincement excédentaire
        // avant que le dézoom ne reprenne.
        pincement = { ecart };
        return;
      }
      if (pointeur === null || evenement.pointerId !== pointeur.id) return;
      const dpr = (doc.defaultView && doc.defaultView.devicePixelRatio) || 1;
      decalageX -= (evenement.clientX - pointeur.x) * dpr;
      decalageY -= (evenement.clientY - pointeur.y) * dpr;
      pointeur.x = evenement.clientX;
      pointeur.y = evenement.clientY;
      if (Math.abs(evenement.clientX - pointeur.departX) > TOLERANCE_TOUCHER_PX
        || Math.abs(evenement.clientY - pointeur.departY) > TOLERANCE_TOUCHER_PX) {
        pointeur.glisse = true;
      }
      dimensionner();
      dessiner();
    });

    const relacher = (evenement, toucher) => {
      doigts.delete(evenement.pointerId);
      if (doigts.size < 2) pincement = null;
      if (pointeur === null || evenement.pointerId !== pointeur.id) return;
      const aGlisse = pointeur.glisse;
      pointeur = null;
      // ⚠⚠ JAMAIS PENDANT LE DÉROULÉ. Le combat est un rejeu d'un état déjà
      // commis ; ouvrir une fiche au milieu ferait croire à une pause qui
      // n'existe pas, et l'effondrement d'une pièce dure deux secondes qu'un
      // toucher ne doit pas détourner. `deroule` est exactement « un déroulé est
      // en cours » — la même garde que le `visibilitychange` du lot
      // RETOUR-DE-RAID.
      //
      // ⚠ ET UN PINCEMENT NE VAUT PAS UN TOUCHER : `pointercancel` passe ici
      // avec `toucher` à faux, comme un doigt qui a promené la vue.
      if (!toucher || aGlisse || deroule || projection === null) return;
      const cadre = canvas.getBoundingClientRect();
      const dpr = (doc.defaultView && doc.defaultView.devicePixelRatio) || 1;
      // ⚠⚠ LE CHEMIN TOUCHER → CASE EST CELUI DU BANC, ET IL N'EN EXISTE QU'UN :
      // `caseDepuisPixels` de `render/projection.js`, la réciproque exacte de
      // `xDeColonne` et `yDeRangee` qui ont servi à dessiner. Refaire la
      // division ici en ferait une seconde, et la première divergence se lirait
      // comme un doigt qui désigne la voisine.
      //
      // ⚠⚠ ET LES DEUX DÉCALAGES N'ENTRENT PAS DANS LE CALCUL — TROUVÉ PAR UN
      // TEST, PAS PAR RELECTURE. Ils sont DÉJÀ dans `projection` :
      // `calculerProjection` les reçoit et les replie dans `margeX` et `margeY`
      // — mesuré, `margeY` passe de 54 à −546 quand on lui donne le décalage de
      // l'ouverture. Les rajouter ici les comptait DEUX FOIS, et le doigt
      // désignait une case cinq rangées plus haut : le premier balayage de
      // `FE T1` n'atteignait aucune pièce des rangées 9 et 10.
      ouvrirLaFicheSur(caseDepuisPixels(
        projection,
        (evenement.clientX - cadre.left) * dpr,
        (evenement.clientY - cadre.top) * dpr,
      ));
    };
    canvas.addEventListener('pointerup', (e) => relacher(e, true));
    canvas.addEventListener('pointercancel', (e) => relacher(e, false));
  }

  // --- les six boutons -------------------------------------------------------
  function brancher(id, action) {
    const bouton = $(id);
    if (bouton !== null) bouton.addEventListener('click', action);
  }

  brancher('raid-reparer', () => armer('reparer'));
  brancher('raid-activer', () => armer('activer'));

  brancher('raid-tout-reparer', () => {
    if (etatCourant === null) return;
    const bilan = toutReparer(etatCourant);
    // Même raison qu'au mode « Réparer » : la formation porte une copie des
    // dégâts, et c'est elle que le raid emporte.
    resynchroniserLaFormation(etatCourant, formation);
    desarmer();
    peindreVagues();
    apresGeste();
    // ⚠ `toutReparer` NE S'ARRÊTE PAS À LA PREMIÈRE IMPAYABLE : elle répare tout
    // ce qui est payable et COMPTE le reste. On le dit, sinon le joueur croirait
    // que rien ne s'est passé.
    avis(bilan.impayables === 0
      ? `${bilan.reparees} unité(s) réparée(s).`
      : `${bilan.reparees} réparée(s), ${bilan.impayables} hors de portée de la réserve.`);
  });

  brancher('raid-retour-carte', () => { fermerPanneaux(); versEcran('monde'); });
  brancher('raid-retour-offense', () => { fermerPanneaux(); versEcran('offense'); });

  function fermerPanneaux() {
    arreterBoucle();
    // ⚠ ET LE CHROME REVIENT. C'est la porte d'ABANDON : « Carte », « Offense »,
    // « Ré-attaquer » et les deux boutons du rapport passent par ici, et
    // l'ouverture d'une cible aussi. Un chrome masqué qui ne revient pas laisse
    // le joueur enfermé dans un écran sans onglets.
    quitterLeDeroule();
    fermerLaFiche();
    for (const id of ['raid-sim', 'raid-fin', 'raid-bandeau', 'raid-vitesses']) {
      const bloc = $(id);
      if (bloc !== null) bloc.hidden = true;
    }
  }

  /** Lance un raid — pour de bon, ou en simulation. */
  function lancer(simule) {
    if (etatCourant === null || cibleCourante === null) return;
    const problemes = problemesDuRaid(
      etatCourant, baseCourante(etatCourant), cibleCourante, formation,
    );
    if (problemes.length > 0) { avis(problemes.map((p) => p.message).join(' ; ')); return; }
    desarmer();
    simulation = simule;
    // ⚠ LE MONTAGE SE PREND AVANT, et par `montageDuRaid` : après le raid, le
    // site porte ses dégâts et le rejeu ne montrerait plus le combat qui a eu
    // lieu. Le recomposer ici en donnerait un second, voisin et non éprouvé.
    const site = siteDeLaCase(etatCourant, cibleCourante.rangee, cibleCourante.colonne);
    const montage = montageDuRaid(etatCourant, site);
    const { vagues } = composerLesVagues(etatCourant, formation);
    // ⚠ `options` PASSE EN ENTIER À `executerRaid` — c'est écrit dans l'en-tête
    // de `simulerRaid` —, donc le simulateur reçoit la MÊME formation que le
    // vrai raid sans une ligne de plus. Le vérifier plutôt que le croire : c'est
    // `FG T4`.
    rapportCourant = simule
      ? simulerRaid(etatCourant, baseCourante(etatCourant), cibleCourante, { formation })
      : executerRaid(etatCourant, baseCourante(etatCourant), cibleCourante, { formation });
    // ⚠ LE SON NE PART QUE SUR LA VRAIE ATTAQUE. Une simulation ne commande
    // rien à personne : la faire sonner comme un ordre ferait croire au joueur
    // qu'il vient d'engager son armée. Un bandeau couvre déjà la vue pour la
    // même raison.
    if (!simule) { sonDeGeste('attaque', {}); apresGeste(); }
    peindreVagues();
    // ⚠ UN BANDEAU « SIMULATEUR » COUVRE LA VUE PENDANT TOUT LE DÉROULÉ SIMULÉ,
    // pour qu'on ne le confonde jamais avec la vraie attaque.
    $('raid-bandeau').hidden = !simule;
    // ⚠ LE VRAI RAID SE REGARDE EN TEMPS RÉEL, SANS CONTRÔLE DE VITESSE — Ethan.
    // `dureeMaxCombatSec` vaut 90 : il ne peut pas durer plus d'une minute
    // trente, donc il n'y a pas de durée à gérer.
    $('raid-vitesses').hidden = !simule;
    vitesse = 1;
    // ⚠ AVANT `rejouer`, ET C'EST UNE QUESTION DE MESURE : masquer `#raid-bas`
    // agrandit le canevas, et `rejouer` appelle `dimensionner`. Dans l'autre
    // ordre, la première image serait projetée sur l'ancienne taille et le
    // `ResizeObserver` la referait aussitôt.
    entrerDansLeDeroule();
    rejouer(montage, vagues);
  }

  brancher('raid-attaquer', () => lancer(false));
  brancher('raid-simuler', () => lancer(true));
  // ⚠⚠ « RÉATTAQUER » REMET SUR LA CIBLE, IL N'ATTAQUE PAS — Ethan, 06/09 :
  // « bouton réattaquer remet sur la cible, pas d'attaque instantané. » Il
  // appelait `lancer(false)`, donc il engageait un second raid SANS que le
  // joueur revoie sa cible ni sa composition. Il rend maintenant l'écran de
  // préparation armé sur la même cible ; « Attaquer » reste à portée, et c'est
  // lui qui engage.
  //
  // ⚠ LA CIBLE SE RELIT, ELLE NE SE RECOMPOSE PAS : `cibleCourante` est en
  // mémoire, et on repasse par le chemin d'entrée déjà écrit plutôt que d'en
  // écrire un second.
  //
  // ⚠⚠ ET L'ÉTAT A CHANGÉ, DONC L'ÉCRAN LE MONTRE. C'est `ouvrirSurLaCible` qui
  // relit `siteDeLaCase` : la défense restante, les points d'attaque et
  // `problemesDuRaid` ne sont plus ceux d'avant le raid. Rouvrir la vue d'AVANT
  // mentirait au joueur sur ce qui l'attend.
  //
  // ⚠ ET IL HÉRITE DE LA BANDE D'OUVERTURE : il repasse par le chemin d'entrée,
  // donc il ouvre lui aussi sur la défense. C'est cohérent — c'est ce qu'il
  // reste à affronter — et c'est dit au rapport plutôt que découvert.
  brancher('raid-reattaquer', () => {
    if (etatCourant === null || cibleCourante === null) return;
    fermerPanneaux();
    ouvrirSurLaCible(etatCourant, cibleCourante);
  });

  brancher('raid-sim-fermer', () => { $('raid-sim').hidden = true; });
  brancher('raid-fin-carte', () => { fermerPanneaux(); versEcran('monde'); });
  brancher('raid-fin-base', () => { fermerPanneaux(); versEcran('offense'); });

  // Les vitesses du simulateur, et le pas-à-pas.
  for (const v of VITESSES) {
    brancher(`raid-vitesse-${v}`, () => { vitesse = v; enPause = false; demarrerBoucle(); });
  }
  brancher('raid-pas', () => {
    if (combat === null || combat.termine) return;
    enPause = true;
    arreterBoucle();
    avancerDUnTick();
    dessiner();
    if (combat.termine) finDuDeroule();
  });
  brancher('raid-instantane', () => { conclureLeDeroule(); });

  // --- quitter le jeu pendant un vrai raid ----------------------------------
  //
  // ⚠⚠ UN RAID QUITTÉ EN COURS ATTERRIT SUR SON RAPPORT — Ethan, 06/09 : « je
  // lance le raid, je quitte le jeu juste après, je reviens après 5 min : le
  // raid a figé et reprend, je dois attendre la fin. »
  //
  // ⚠⚠ ET L'ÉTAT N'EST PAS EN CAUSE, C'EST LE PREMIER FAIT À DIRE. `lancer`
  // appelle `executerRaid` AVANT la première image — arbitrage « A » du 01/09,
  // écrit en tête de `rejouer`. Le butin est versé, la cible est entamée, les
  // points sont dépensés : ce qui retenait le joueur était l'ANIMATION, et rien
  // d'autre. Trois mécanismes s'y conjuguaient : `requestAnimationFrame` ne bat
  // plus en arrière-plan, `ticksDus` plafonne le temps injecté à
  // `PLAFOND_RATTRAPAGE_MS` puis à `TICKS_MAX_PAR_IMAGE` — cinq minutes
  // d'absence font avancer le déroulé d'une seconde au plus —, et
  // `demarrerBoucle` remet `derniereImageMs` à `null`. Le joueur était enfermé
  // pour les `dureeMaxCombatSec` secondes du combat, sans aucune sortie.
  //
  // ⚠ LES DEUX PLAFONDS NE BOUGENT PAS, ET LE DÉFAUT N'ÉTAIT PAS LÀ. Ils
  // protègent de la spirale de la mort et du téléphone qui chauffe ; les relever
  // remplacerait une attente de quatre-vingt-dix secondes par un gel de
  // plusieurs secondes à la reprise.
  //
  // ⚠ ET PAS DE BOUTON « PASSER » — Ethan, 06/09, mot pour mot : « bouton passer
  // non ». On emprunte le CHEMIN DE CODE de `#raid-instantane`, on n'expose pas
  // son bouton : `#raid-vitesses` garde son `hidden = !simule`.
  //
  // ⚠⚠ QUATRE GARDES, ET AUCUNE N'EST FACULTATIVE.
  //
  // 1. `doc.hidden` — l'évènement se déclenche dans les DEUX sens, et le retour
  //    n'a rien à conclure.
  // 2. `!simulation` — une simulation ne commande rien à personne, et le bandeau
  //    « SIMULATEUR » existe justement pour qu'on ne la confonde pas avec un
  //    ordre. Quittée puis reprise, elle se reprend où elle en était.
  // 3. `deroule` — ET C'EST LA GARDE QUE LE BRIEF NE DEMANDAIT PAS, mesurée :
  //    `ouvrir` monte DÉJÀ un `combat` pour montrer la cible, avec `vagues: []`,
  //    et ce combat-là N'EST PAS TERMINÉ tant qu'aucun tick n'a tourné. S'en
  //    tenir à `combat !== null && !combat.termine` ferait donc tourner la boucle
  //    d'aperçu à chaque fois que le joueur quitte le jeu depuis la PRÉPARATION :
  //    la cible se figerait sur un combat conclu « attaquants », que le joueur
  //    n'a pas lancé. `deroule` est exactement « un déroulé est en cours ».
  // 4. `combat !== null && !combat.termine` — masquer l'écran alors que rien ne
  //    tourne ne doit rien déclencher, et surtout pas un second `montrerResultat`
  //    sur un rapport déjà affiché.
  //
  // ⚠ ET `src/ui/session.js` N'A PAS UNE LIGNE DE CHANGÉE. Il porte déjà son
  // `visibilitychange`, qui suspend et reprend l'horloge économique, et son
  // `pagehide`, qui sauvegarde. Le déroulé appartient à l'écran de raid : c'est
  // lui qui en a un, donc c'est lui qui l'écoute.
  if (typeof doc.addEventListener === 'function') {
    doc.addEventListener('visibilitychange', () => {
      if (doc.hidden !== true) return;
      if (simulation) return;
      if (!deroule) return;
      // ⚠⚠ ET UNE CINQUIÈME GARDE DEPUIS LE LOT EFFONDREMENT, 07/09 — ELLE PASSE
      // AVANT LA QUATRIÈME, ET C'EST TOUT SON INTÉRÊT. Pendant l'effondrement le
      // combat est TERMINÉ : la garde `combat.termine` juste dessous renverrait
      // donc sans rien conclure, et le joueur qui revient trouverait deux
      // secondes d'animation figée devant son rapport. C'est très exactement le
      // défaut que ce lot-là réparait, refait un cran plus loin. On coupe
      // l'effondrement et on va droit au rapport.
      if (effondrementMs !== null) { arreterBoucle(); finDuDeroule(); return; }
      if (combat === null || combat.termine) return;
      conclureLeDeroule();
    });
  }

  if (typeof doc.defaultView?.ResizeObserver === 'function' && canvas !== null) {
    new doc.defaultView.ResizeObserver(() => { dimensionner(); dessiner(); }).observe(canvas);
  }

  fermerPanneaux();

  /**
   * Entre sur une cible : la vue à neuf, les panneaux fermés, le bouton armé.
   *
   * ⚠⚠ ELLE EST NOMMÉE PARCE QU'ELLE A DEUX APPELANTS DEPUIS LE 06/09. La
   * session y entre depuis la carte ; « Réattaquer » y REVIENT, sur la même
   * cible. Recomposer cette entrée dans le bouton en aurait donné une seconde,
   * voisine et non éprouvée — et c'est très exactement ce que le point 8
   * demande d'éviter : « le bouton réattaquer remet sur la cible ».
   */
  function ouvrirSurLaCible(etat, cible, atlasFournis = null) {
    etatCourant = etat;
    cibleCourante = { rangee: cible.rangee, colonne: cible.colonne };
    if (atlasFournis !== null) atlas = atlasFournis;
    rapportCourant = null;
    combat = null;
    fondCourant = null;
    // ⚠ LA VUE SE REMET À NEUF À CHAQUE CIBLE. Garder le zoom et la bande de
    // la cible précédente ferait s'ouvrir un raid sur trois colonnes de la
    // défense d'une autre base — un état que le joueur n'a pas demandé et
    // qu'il ne peut pas relier à son geste.
    //
    // ⚠⚠ ET ELLE S'OUVRE SUR LA DÉFENSE — Ethan, 06/09 : « ouverture de la
    // cible : on voit la défense ennemie en 1er. » C'est ce que le joueur va
    // affronter, et c'est la seule bande dont l'état décide de son raid. Rien
    // d'autre ne change : la bascule garde sa forme, sa place et sa teinte,
    // seule sa valeur de départ bouge.
    //
    // ⚠ ELLE SE POSE ICI, DONC À CHAQUE ENTRÉE, ET PAS DANS L'INITIALISATION DU
    // MODULE. Entrer dans une cible, revenir à la carte, entrer dans une autre :
    // les trois doivent s'ouvrir sur la défense. Une valeur posée une seule fois
    // au câblage n'aurait tenu que pour la première.
    bandeCourante = BANDE_A_L_OUVERTURE;
    // ⚠⚠ LA FORMATION REPART DE L'ARMÉE D'OFFENSE, ICI ET NULLE PART AILLEURS.
    // Ethan, 08/09 : « elle repart toujours de celle d'Offense, et toutes les
    // unités repartent actives ». C'est aussi le chemin de « Ré-attaquer », qui
    // repasse par cette fonction : après un raid, l'armée est abîmée et le
    // rangement de la passe précédente n'a plus de sens.
    formation = formationDepuisLArmee(etat);
    coteVoulu = null;
    decalageX = 0;
    // ⚠ HORS BORNES, PAS ZÉRO, ET C'EST LE MÊME GESTE QU'`allerALaBande`. La
    // borne basse de la Défense n'est pas le haut de la grille : `dimensionner`
    // rabat `-Infinity` sur le `min` de la bande, quel qu'il soit, sans que ce
    // code-ci ait à le recalculer.
    decalageY = -Infinity;
    marquerBascule();
    fermerPanneaux();
    desarmer();
    peindreVagues();
    const site = siteDeLaCase(etat, cible.rangee, cible.colonne);
    // ⚠⚠ LE PRIX SE PREND DANS `vueDuRaid`, ET NULLE PART AILLEURS. C'est
    // elle qui appelle `coutDUnRaid`, une fois ; le libellé LIT ce qu'elle
    // rend. Rappeler le barème ici donnerait deux nombres qui peuvent
    // diverger — le motif de `ciblageOuvert` dans `ui/monde.js`.
    //
    // ⚠ ET LE PRIX NE BOUGE PAS TANT QU'ON RESTE SUR LA CIBLE : il est
    // fonction de la distance et du niveau du site, que ni une réparation ni
    // une activation ne changent. Il se peint donc à l'ouverture, comme le
    // titre, et pas à chaque image.
    armerLAttaque(vueDuRaid(etat, cibleCourante, formation).cout);
    const titre = $('raid-titre');
    if (titre !== null && site !== null) {
      titre.textContent = `${site.type} · niveau ${site.niveau}`
        + ` · rangée ${site.rangee}, colonne ${site.colonne}`;
    }
    // ⚠ ON MONTRE LA CIBLE AVANT MÊME D'ATTAQUER : le montage courant, donc la
    // garnison RÉELLE et les bâtiments à leurs PV du jour. Aucune information
    // n'est cachée — arbitrage d'Ethan du 01/09.
    if (site !== null) {
      combat = creerCombat({ ...montageDuRaid(etat, site), vagues: [] });
      // ⚠⚠ LE PROPRIÉTAIRE SE LIT SUR LE MONTAGE, JAMAIS `'ouvrage'` EN DUR.
      // `sim/raid-ouvrage.js` monte des combats où la défense appartient au
      // JOUEUR ; l'écrire en dur passerait le test d'aujourd'hui et donnerait
      // un décor de l'Ouvrage à la base du joueur le jour où cet écran-là
      // s'ouvrira. Même leçon que `pointsRecherche` au lot MODULES-E, et que
      // le camp du mur au lot MURS-OUVRAGE.
      //
      // ⚠ ET CE JOUR-LÀ, LA CASE À PASSER SERA `fondation`, PAS LA CIBLE :
      // c'est elle qui identifie une base du joueur, comme sur l'écran de la
      // base. Ici la cible EST le site, qui ne se déplace pas.
      fondCourant = fondDeLaBase(
        combat.proprietaireDefense, site.type, site.rangee, site.colonne,
      );
      precedentes = prendrePositions(combat);
      dimensionner();
      dessiner();
    }
  }

  return {
    /** Entre dans l'écran de raid sur une cible. */
    ouvrir(etat, cible, atlasFournis = null) { ouvrirSurLaCible(etat, cible, atlasFournis); },
    peindre(etat) { etatCourant = etat; peindreVagues(); },
    // ⚠ QUITTER L'ÉCRAN REND LE CHROME. Sans cette ligne, changer d'onglet
    // pendant un déroulé laisserait la page sans onglets — donc sans moyen d'en
    // revenir. Troisième porte, la même fonction idempotente.
    masquer() { arreterBoucle(); quitterLeDeroule(); },
    /**
     * Les unités attaquantes et leur état de mouvement — pour le son.
     *
     * ⚠⚠ C'EST UNE LECTURE, PAS UN ÉVÉNEMENT, ET LA NUANCE EST TOUTE LA GARDE
     * `SON T14`. Le moteur ne publie rien et n'a pas bougé d'une ligne : on
     * compare les deux instantanés que cet écran prend DÉJÀ pour son
     * interpolation. Le calcul lui-même vit dans `src/son/cablage.js`, qui est
     * pur ; ici il n'y a qu'un accès aux deux variables locales.
     */
    unitesDuCombat() { return etatDesUnites(combat, precedentes); },
    /**
     * Ce que le déroulé a publié depuis le dernier appel — et il VIDE.
     *
     * ⚠ IL VIDE, PARCE QU'UN COUP NE SE REJOUE PAS. Une ambiance se réconcilie
     * — on la redemande tant qu'elle est vraie ; un tir est un fait, il a lieu
     * une fois. Ne pas vider referait sonner le même coup dix fois par seconde
     * jusqu'à la fin du combat.
     */
    evenementsSonores() {
      const sortie = [...evenementsSonores].sort();
      evenementsSonores.clear();
      return sortie;
    },
    /** La mesure M2 : le coût moyen d'une image du déroulé. */
    mesureImages() {
      return { images: mesure.images, moyenneMs: mesure.images === 0 ? 0 : mesure.totalMs / mesure.images };
    },
  };
}
