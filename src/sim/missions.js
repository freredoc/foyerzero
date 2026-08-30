// Les missions du tutoriel — ce que le joueur doit avoir fait, et rien d'autre.
//
// ⚠ ELLES NE SONT QUE DES QUESTIONS POSÉES À L'ÉTAT. Une mission n'écrit rien,
// ne récompense rien, ne débloque rien : elle REGARDE la base et dit si le
// geste qu'elle décrit a été accompli. Arbitré le 28/08 avec Ethan — « des
// missions qui se cochent toutes seules, sans récompense ». Le jour où une
// récompense sera fixée, elle se débitera dans `state.js`, pas ici.
//
// ⚠ AUCUNE PROGRESSION N'EST SAUVEGARDÉE, ET C'EST DÉLIBÉRÉ. Retenir « mission
// 3 faite » créerait une SECONDE source de vérité sur ce que le joueur a
// construit, alors que la première — sa base — est déjà là et ne peut pas
// mentir. Une mission se recalcule à chaque demande. Conséquence assumée :
// démolir une Raffinerie décoche la mission qui la demandait. C'est honnête —
// le conseil redevient vrai — et c'est « rien ne se retire en silence »
// (CLAUDE.md §4) vu de l'autre côté.
// ⚠ CE QUI EST SAUVEGARDÉ, C'EST LA FERMETURE DE LA MINI-FENÊTRE, et c'est
// autre chose : « j'ai quitté le tuto » est une décision du joueur, que la base
// ne peut pas exprimer. Elle vit dans `etat.tutoriel`, pas ici.
//
// ⚠ CE MODULE NE PORTE AUCUN NOMBRE DE LA CHAÎNE. Les niveaux visés, les
// comptes et les identifiants sont dans `data/missions.js` ; les noms viennent
// de `nom.joueur` ; le premier niveau qui coûte de l'électricité se MESURE sur
// `coutDeMontee`. Un test balaie ce fichier-ci et refuse tout littéral de la
// chaîne : ce qui s'écrirait ici serait une seconde table, et elle finirait par
// dire autre chose que la première.
//
// ⚠ `nom.joueur`, JAMAIS `nom.ouvrage` (CLAUDE.md §4). C'est le joueur qu'on
// guide : il emploie le vocabulaire d'une armée régulière, pas celui de
// l'Ouvrage.

import {
  BASE_BATIMENTS, BATIMENT_DE_CHASSIS, coutDeMontee,
} from '../data/base.js';
import { UNITES, DEFENSES } from '../data/combat.js';
import { ECONOMIE_NIVEAU } from '../data/economie.js';
import { GEOGRAPHIE, POINTS_ARMEE } from '../data/sites.js';
import { CHAINE_TUTORIEL, FAMILLES_OBJECTIF } from '../data/missions.js';
import { ARBRE_RECHERCHE } from '../data/recherche.js';
import { ressourceDeLaCase } from './champs.js';
import { FORCES } from './state.js';
import { niveauDesBatiments, niveauDeLaDefense, niveauDeLArmee } from './niveau-de-base.js';

/** Le nom que le JOUEUR emploie pour un bâtiment. */
function nomBatiment(id) {
  const b = BASE_BATIMENTS[id];
  if (b === undefined) throw new RangeError(`missions : bâtiment « ${id} » inconnu`);
  return b.nom.joueur;
}

/** Le nom que le JOUEUR emploie pour une pièce de garnison ou d'armée. */
function nomPiece(id) {
  const ligne = DEFENSES[id] ?? UNITES[id];
  if (ligne === undefined) throw new RangeError(`missions : pièce « ${id} » inconnue`);
  return ligne.nom.joueur;
}

/** Le premier niveau d'amélioration payable, donc le premier vrai choix. */
const NIVEAU_VISE = ECONOMIE_NIVEAU.premierNiveauPayant;

/**
 * Le premier niveau dont l'amélioration coûte de l'électricité — mesuré sur
 * `coutDeMontee`, jamais recopié.
 *
 * ⚠ IL SE MESURE SUR TOUS LES BÂTIMENTS, pas sur un seul. Le barème pourrait
 * un jour différer d'une ligne à l'autre ; prendre le premier venu ferait dire
 * au tutoriel une règle vraie d'un bâtiment et fausse des dix autres.
 * Le balayage ne se fait qu'une fois, à la première demande.
 */
let niveauElectriqueMemo = null;
export function premierNiveauElectrique() {
  if (niveauElectriqueMemo !== null) return niveauElectriqueMemo;
  let premier = null;
  for (const id of Object.keys(BASE_BATIMENTS)) {
    for (let vise = NIVEAU_VISE; vise <= GEOGRAPHIE.niveauPlafond; vise++) {
      if (premier !== null && vise >= premier) break;
      if ((coutDeMontee(id, vise).electricite ?? 0) > 0) {
        premier = vise;
        break;
      }
    }
  }
  if (premier === null) {
    throw new Error('missions : aucun palier ne coûte d\'électricité — le texte de la mission ment');
  }
  niveauElectriqueMemo = premier;
  return premier;
}

// -- lectures de l'état ------------------------------------------------------

function exiger(etat) {
  if (etat === null || typeof etat !== 'object') {
    throw new TypeError('missions : état attendu');
  }
  for (const champ of ['disposition', 'champs', 'garnison', 'armee']) {
    if (!Object.prototype.hasOwnProperty.call(etat, champ)) {
      throw new RangeError(`missions : l'état ne porte pas « ${champ} »`);
    }
  }
}

/**
 * Les trois moyennes du joueur, en dixièmes — `null` quand rien n'est posé.
 * Les trois LECTURES viennent de `sim/niveau-de-base.js`, jamais d'un calcul
 * refait ici.
 *
 * ⚠ LE LIBELLÉ N'EST PAS LA CLÉ, et c'est la faute que `data/combat.js` nomme
 * déjà pour `axe` / `axeLibelle` : sans lui, le joueur lisait « armee en
 * moyenne au niveau 6,0 » — une clé de code arrivée sous ses yeux, sans accent.
 * Ce n'est pas non plus une copie des noms d'écran de `ui/chantier.js`
 * (« Base », « Défense », « Offense ») : ceux-là nomment des ÉCRANS, ceux-ci
 * nomment les trois forces dont on prend la moyenne.
 */
const MOYENNES = {
  batiments: { libelle: 'tes bâtiments', lire: (etat) => niveauDesBatiments(etat.disposition) },
  defense: { libelle: 'ta défense', lire: (etat) => niveauDeLaDefense(etat.garnison) },
  armee: { libelle: 'ton armée', lire: (etat) => niveauDeLArmee(etat.armee) },
};

/** Un nombre de dixièmes, tel que le joueur le lit : toujours une décimale. */
function enNiveau(dixiemes) {
  return (dixiemes / 10).toFixed(1).replace('.', ',');
}

// -- les objectifs -----------------------------------------------------------
//
// Chacun rend `{ libelle, fait, total }`. Le compteur d'une mission est la
// somme des siens ; elle est faite quand `fait` atteint `total` partout.
//
// ⚠ `total` N'EST PAS TOUJOURS CONSTANT. « tous les bâtiments au niveau n »
// compte les bâtiments POSÉS, donc son dénominateur bouge quand le joueur
// construit. C'est voulu : le compteur dit où en est la base, pas où en était
// le brief.

const OBJECTIFS = {
  batiments(etat, o) {
    const surLaBonneCase = (b) => o.ressource === undefined
      || ressourceDeLaCase(etat.champs, b.rangee, b.colonne) === o.ressource;
    const niveau = o.niveau ?? 1;
    const fait = etat.disposition
      .filter((b) => b.id === o.id && b.niveau >= niveau && surLaBonneCase(b)).length;
    let libelle = nomBatiment(o.id);
    if (o.ressource !== undefined) libelle += ` sur ${o.ressource}`;
    if (niveau > 1) libelle += ` au niveau ${niveau}`;
    return { libelle, fait: Math.min(fait, o.nombre), total: o.nombre };
  },

  'tous-au-niveau'(etat, o) {
    return {
      libelle: `chaque bâtiment au niveau ${o.niveau}`,
      fait: etat.disposition.filter((b) => b.niveau >= o.niveau).length,
      total: etat.disposition.length,
    };
  },

  effectif(etat, o) {
    const force = FORCES[o.force];
    if (force === undefined) throw new RangeError(`missions : force « ${o.force} » inconnue`);
    const fait = etat[force.champ]
      .filter((p) => p.id === o.id && p.niveau >= o.niveau).length;
    return {
      libelle: `${nomPiece(o.id)} au niveau ${o.niveau} en ${force.quoi}`,
      fait: Math.min(fait, o.nombre),
      total: o.nombre,
    };
  },

  'niveau-moyen'(etat, o) {
    const moyenne = MOYENNES[o.quoi];
    if (moyenne === undefined) throw new RangeError(`missions : moyenne « ${o.quoi} » inconnue`);
    const dixiemes = moyenne.lire(etat);
    return {
      libelle: `${moyenne.libelle} en moyenne au niveau ${enNiveau(o.dixiemes)}`,
      fait: dixiemes !== null && dixiemes >= o.dixiemes ? 1 : 0,
      total: 1,
    };
  },

  // ⚠ ELLE NE SE COCHE JAMAIS, ET ELLE NE COMPTE NULLE PART. Un objectif qu'on
  // ne sait pas observer ne doit ni s'annoncer fait, ni retenir le tutoriel :
  // il se DIT, et la mission passe hors du compteur. C'est la seule façon de
  // porter la feuille de route entière sans rendre le tutoriel infinissable.
  'sans-moteur'(etat, o) {
    return { libelle: o.raison, fait: 0, total: 1 };
  },
};

/** Un objectif, résolu contre cet état. */
function resoudre(etat, o) {
  if (!FAMILLES_OBJECTIF.has(o.famille)) {
    throw new RangeError(`missions : famille d'objectif « ${o.famille} » inconnue`);
  }
  return OBJECTIFS[o.famille](etat, o);
}

// -- ce qu'il faut avoir pour seulement pouvoir essayer -----------------------

/**
 * Les conditions DÉRIVÉES qu'une mission suppose sans les dire : ce qui ouvre
 * une pièce, et le bâtiment qui la produit.
 *
 * ⚠ ELLES SE MESURENT, ELLES NE S'ÉCRIVENT PAS. `ARBRE_RECHERCHE` fait foi sur
 * le coût (lot RECHERCHE, 30/08) et `BATIMENT_DE_CHASSIS` sur le bâtiment de
 * production (29/08). Recopier un prix dans le texte du tutoriel le figerait :
 * un réétalonnage de l'arbre doit être UNE ligne de `data/recherche.js`, et la
 * phrase suit toute seule.
 *
 * ⚠ LA TENSION QUE CE BLOC RENDAIT VISIBLE A DISPARU D'ELLE-MÊME. La chaîne
 * demande deux Éclaireurs alors qu'elle ne monte le Centre de commandement
 * qu'au niveau 7, et l'Éclaireur apparaissait bien plus haut. Sous la nouvelle
 * règle, `ratisseur` est GRATUIT en offense : le niveau n'entre plus, la
 * tension n'existe plus, et la phrase le dit — « déjà débloqué » plutôt qu'un
 * seuil hors d'atteinte.
 */
function prerequisDe(objectif) {
  if (objectif.famille !== 'effectif') return [];
  const force = FORCES[objectif.force];
  const ligne = DEFENSES[objectif.id] ?? UNITES[objectif.id];
  if (ligne === undefined) throw new RangeError(`missions : pièce « ${objectif.id} » inconnue`);
  const commandant = nomBatiment(POINTS_ARMEE[force.role].batiment);
  const prix = ARBRE_RECHERCHE[force.role]?.[objectif.id]?.unite;
  if (prix === undefined) {
    throw new RangeError(`missions : « ${objectif.id} » absent de l'arbre ${force.role}`);
  }
  const dits = [prix === 0
    ? `${nomPiece(objectif.id)} est déjà débloqué : il ne reste qu'à le poser`
    : `${nomPiece(objectif.id)} se débloque par la recherche (${prix} points), `
      + `et se pose depuis le ${commandant}`];
  // Les ouvrages fixes n'ont pas de châssis : un mur n'a jamais eu besoin d'une
  // caserne. C'est `UNITES` qui porte le châssis, pas `DEFENSES`.
  const chassis = UNITES[objectif.id]?.chassis;
  if (chassis !== undefined) {
    dits.push(`il lui faut un ${nomBatiment(BATIMENT_DE_CHASSIS[chassis])}`);
  }
  return dits;
}

// -- ce que l'écran demande --------------------------------------------------

/** Les explications portent un seul substitut, et il se MESURE. */
function resoudreTexte(texte) {
  return texte.replace('{niveauElectrique}', () => String(premierNiveauElectrique()));
}

/**
 * Les missions, avec leur état pour CETTE base.
 *
 * `titre` est COMPOSÉ des libellés d'objectif — il n'est écrit nulle part, donc
 * il ne peut pas vieillir. Seules les missions sans moteur portent un libellé
 * de la main d'Ethan : il n'y a rien à en dériver.
 *
 * @param {object} etat
 * @returns {Array<{id, titre, explication, objectifs, fait, total, faite,
 *                  verifiable, prerequis}>}
 */
export function etatDesMissions(etat) {
  exiger(etat);
  return CHAINE_TUTORIEL.map((m) => {
    const objectifs = m.objectifs.map((o) => resoudre(etat, o));
    const verifiable = !m.objectifs.some((o) => o.famille === 'sans-moteur');
    const fait = objectifs.reduce((s, o) => s + o.fait, 0);
    const total = objectifs.reduce((s, o) => s + o.total, 0);
    return {
      id: m.id,
      titre: m.libelle ?? objectifs.map((o) => o.libelle).join(' · '),
      explication: resoudreTexte(m.explication),
      objectifs,
      fait,
      total,
      faite: verifiable && fait >= total,
      verifiable,
      prerequis: m.objectifs.flatMap(prerequisDe),
    };
  });
}

/**
 * La première mission qu'on met en avant, ou `null` quand il n'en reste plus.
 *
 * ⚠ LA PREMIÈRE NON FAITE, PAS LA SUIVANTE DE LA DERNIÈRE FAITE. Rien
 * n'oblige le joueur à suivre l'ordre : il peut poser une Centrale avant sa
 * Raffinerie. Le tutoriel le rattrape alors sur ce qui manque VRAIMENT, au
 * lieu de lui redemander ce qu'il a déjà fait.
 *
 * ⚠ ET IL SAUTE CE QU'IL NE SAIT PAS OBSERVER. Mettre en avant « détruis un
 * camp » alors que le raid n'existe pas arrêterait le tutoriel pour toujours à
 * la dixième ligne — la faute exacte que CLAUDE.md §6 nomme pour la chaîne
 * précédente : une mission qu'on ne peut pas finir rend le tutoriel
 * infinissable, et rien à la relecture ne le dit.
 */
export function missionCourante(etat) {
  return etatDesMissions(etat).find((m) => m.verifiable && !m.faite) ?? null;
}

/**
 * Combien de missions sont faites, sur combien de VÉRIFIABLES.
 *
 * ⚠ LE DÉNOMINATEUR EXCLUT CE QUI N'A PAS DE MOTEUR. « 13 / 17 » avec quatre
 * lignes qu'aucun geste ne peut cocher serait un compteur qui n'atteint jamais
 * son plafond. Le jour où le raid arrive, le dénominateur grandit tout seul.
 */
export function avancement(etat) {
  const verifiables = etatDesMissions(etat).filter((m) => m.verifiable);
  return { faites: verifiables.filter((m) => m.faite).length, total: verifiables.length };
}

/** Rétro-compatibilité de nom : la chaîne, telle que les tests la parcourent. */
export const MISSIONS = CHAINE_TUTORIEL;
