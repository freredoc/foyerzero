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
import { GEOGRAPHIE, POINTS_ARMEE, EMBLEMES_CARTE } from '../data/sites.js';
import { CHAINE_TUTORIEL, FAMILLES_OBJECTIF } from '../data/missions.js';
import { ARBRE_RECHERCHE } from '../data/recherche.js';
import { ressourceDeLaCase } from './champs.js';
import { FORCES } from './state.js';
import { niveauDesBatiments, niveauDeLaDefense, niveauDeLArmee } from './niveau-de-base.js';
import { baseCourante } from './base-courante.js';
import { positionDepartJoueur } from './carte.js';

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
  const base = baseCourante(etat);
  for (const champ of ['disposition', 'champs', 'garnison', 'armee']) {
    if (!Object.prototype.hasOwnProperty.call(base, champ)) {
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
  batiments: { libelle: 'tes bâtiments', lire: (b) => niveauDesBatiments(b.disposition) },
  defense: { libelle: 'ta défense', lire: (b) => niveauDeLaDefense(b.garnison) },
  armee: { libelle: 'ton armée', lire: (b) => niveauDeLArmee(b.armee) },
};

/**
 * Les familles d'objectif qui parlent d'UNE base — les autres parlent du joueur.
 *
 * ⚠⚠ ELLES SE MESURENT SUR LA MEILLEURE DE SES BASES, PAS SUR LA COURANTE, ET
 * C'EST LE LOT BASES-1 QUI L'A RENDU NÉCESSAIRE. Elles lisaient `baseCourante` ;
 * dès qu'une seconde base existe, FONDER ou BASCULER faisait décocher les douze
 * missions de construction d'un coup — la base neuve n'a qu'un Chantier de
 * niveau 1. Le joueur aurait vu son tutoriel se vider pour avoir fait
 * exactement ce que le tutoriel lui demandait.
 *
 * ⚠ « LA MEILLEURE » EST CELLE QUI VA LE PLUS LOIN VERS L'OBJECTIF, ratio
 * d'abord — « chaque bâtiment au niveau 5 » n'a pas le même dénominateur d'une
 * base à l'autre —, puis compte brut pour départager. Une somme sur toutes les
 * bases aurait été l'autre lecture, et elle est FAUSSE ici : « chaque bâtiment
 * au niveau 5 » se lit base par base, et une base neuve tirerait la somme vers
 * le bas indéfiniment.
 */
const PAR_BASE = new Set(['batiments', 'tous-au-niveau', 'effectif', 'niveau-moyen']);

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
  batiments(laBase, o) {
    const surLaBonneCase = (b) => o.ressource === undefined
      || ressourceDeLaCase(laBase.champs, b.rangee, b.colonne) === o.ressource;
    const niveau = o.niveau ?? 1;
    const fait = laBase.disposition
      .filter((b) => b.id === o.id && b.niveau >= niveau && surLaBonneCase(b)).length;
    let libelle = nomBatiment(o.id);
    if (o.ressource !== undefined) libelle += ` sur ${o.ressource}`;
    if (niveau > 1) libelle += ` au niveau ${niveau}`;
    return { libelle, fait: Math.min(fait, o.nombre), total: o.nombre };
  },

  'tous-au-niveau'(laBase, o) {
    return {
      libelle: `chaque bâtiment au niveau ${o.niveau}`,
      fait: laBase.disposition.filter((b) => b.niveau >= o.niveau).length,
      total: laBase.disposition.length,
    };
  },

  effectif(laBase, o) {
    const force = FORCES[o.force];
    if (force === undefined) throw new RangeError(`missions : force « ${o.force} » inconnue`);
    const fait = laBase[force.champ]
      .filter((p) => p.id === o.id && p.niveau >= o.niveau).length;
    return {
      libelle: `${nomPiece(o.id)} au niveau ${o.niveau} en ${force.quoi}`,
      fait: Math.min(fait, o.nombre),
      total: o.nombre,
    };
  },

  'niveau-moyen'(laBase, o) {
    const moyenne = MOYENNES[o.quoi];
    if (moyenne === undefined) throw new RangeError(`missions : moyenne « ${o.quoi} » inconnue`);
    const dixiemes = moyenne.lire(laBase);
    return {
      libelle: `${moyenne.libelle} en moyenne au niveau ${enNiveau(o.dixiemes)}`,
      fait: dixiemes !== null && dixiemes >= o.dixiemes ? 1 : 0,
      total: 1,
    };
  },

  // ⚠⚠ CE QUE LE JOUEUR A RASÉ — lot BASES-1, et c'est ce qui remplace deux des
  // quatre `sans-moteur`. Les DEUX sources sont de l'HISTOIRE, sauvegardée :
  // `basesRasees` retient les CASES parce qu'une base ne doit plus jamais
  // reparaître là, `satellitesDetruits` un COMPTE parce qu'un camp reparaît et
  // que sa case ne dit donc rien. Deux formes, une seule question.
  //
  // ⚠ AUCUNE DES DEUX NE DÉCROÎT, et c'est ce qui distingue cet objectif des
  // autres : un bâtiment démoli décoche sa mission — « rien n'est mémorisé »,
  // 28/08 —, un camp rasé reste rasé. Le tutoriel ne revient pas en arrière ici.
  'sites-detruits'(etat, o) {
    const fait = o.type === 'base'
      ? etat.basesRasees.length
      : (etat.satellitesDetruits[o.type] ?? 0);
    return {
      libelle: `${LIBELLE_DU_SITE[o.type] ?? o.type} détruit`,
      fait: Math.min(fait, o.nombre),
      total: o.nombre,
    };
  },

  // ⚠ ELLE COMPTE CE QUE LE JOUEUR TIENT, PAS CE QU'IL A FONDÉ. Une base rasée
  // n'est pas retirée de `etat.bases` aujourd'hui — le rasage la DÉPLACE —, donc
  // les deux coïncident ; le jour où une base pourrait être perdue, cet objectif
  // décocherait, ce qui est la lecture juste : la mission dit « construire une
  // seconde base », pas « en avoir construit une un jour ».
  'bases-du-joueur'(etat, o) {
    return {
      libelle: `${o.nombre} bases tenues`,
      fait: Math.min(etat.bases.length, o.nombre),
      total: o.nombre,
    };
  },

  // ⚠⚠ DEPUIS LE DÉPART DE LA PARTIE, PAS DEPUIS LA FONDATION DE CHAQUE BASE.
  // `fondation` est le point où une base a été POSÉE — pour une base fondée au
  // nord, elle est déjà au nord, et l'objectif se cocherait sans que le joueur
  // ait bougé. `positionDepartJoueur()` est le seul repère fixe de la partie.
  //
  // ⚠ LA MEILLEURE DE SES BASES COMPTE. Le joueur qui monte une base et en
  // laisse une au sud s'est bel et bien rapproché de l'Ouvrage.
  //
  // ⚠ LA RANGÉE DÉCROÎT VERS LE NORD — `sim/carte.js`, rangée 1 = bord haut.
  // L'écrire dans l'autre sens ferait cocher la mission à un joueur que
  // l'Ouvrage vient de raser vingt cases plus bas.
  'montee-vers-le-nord'(etat, o) {
    const depart = positionDepartJoueur().rangee;
    let montee = 0;
    for (const base of etat.bases) {
      const gagne = depart - base.position.rangee;
      if (gagne > montee) montee = gagne;
    }
    return {
      libelle: `${o.cases} cases vers le nord depuis ton point de départ`,
      fait: Math.min(montee, o.cases),
      total: o.cases,
    };
  },
};

/**
 * Le nom d'un type de site, tel que le joueur le lit.
 *
 * ⚠ IL VIENT D'`EMBLEMES_CARTE`, PAS D'UNE SECONDE ORTHOGRAPHE. C'est la table
 * qui nomme déjà les sites sur la carte et dans le panneau ; en réécrire une
 * ici donnerait deux noms pour la même chose, ce que `CLAUDE.md` §6 interdit
 * nommément pour les POI.
 */
const LIBELLE_DU_SITE = Object.fromEntries(
  Object.entries(EMBLEMES_CARTE).map(([cle, e]) => [cle, e.nom]),
);

/** Un objectif, résolu contre cet état. */
function resoudre(etat, o) {
  if (!FAMILLES_OBJECTIF.has(o.famille)) {
    throw new RangeError(`missions : famille d'objectif « ${o.famille} » inconnue`);
  }
  const lire = OBJECTIFS[o.famille];
  if (!PAR_BASE.has(o.famille)) return lire(etat, o);
  let meilleur = null;
  for (const base of etat.bases) {
    const vu = lire(base, o);
    if (meilleur === null || mieuxQue(vu, meilleur)) meilleur = vu;
  }
  return meilleur;
}

/** Ratio d'abord, compte brut pour départager — un total nul ne vaut rien. */
function mieuxQue(a, b) {
  const ratio = (x) => (x.total === 0 ? 0 : x.fait / x.total);
  if (ratio(a) !== ratio(b)) return ratio(a) > ratio(b);
  return a.fait > b.fait;
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
 * il ne peut pas vieillir.
 *
 * ⚠⚠ QUATRE MISSIONS PORTENT LE LEUR, DE LA MAIN D'ETHAN, ET `titreEcrit` LE
 * DIT. Elles décrivent un GESTE — « Attaquer et détruire un camp » — que le
 * compteur d'objectifs dirait beaucoup plus mal (« Camp détruit 0 / 1 »).
 * Jusqu'au lot BASES-1 c'étaient exactement les quatre SANS MOTEUR, et l'écran
 * les reconnaissait à ça ; elles en ont un maintenant, donc le drapeau se lit
 * sur ce qui est vrai — un libellé écrit — et non sur ce qui l'était par
 * coïncidence.
 *
 * ⚠ `verifiable` VAUT DÉSORMAIS `true` PARTOUT, et il RESTE : les deux vues et
 * `avancement` le lisent, et le jour où une mission arrivera de nouveau sans
 * moteur, il redeviendra utile. Le retirer obligerait à le réinventer.
 *
 * @param {object} etat
 * @returns {Array<{id, titre, titreEcrit, explication, objectifs, fait, total,
 *                  faite, verifiable, prerequis}>}
 */
export function etatDesMissions(etat) {
  exiger(etat);
  return CHAINE_TUTORIEL.map((m) => {
    const objectifs = m.objectifs.map((o) => resoudre(etat, o));
    // ⚠ TOUTES LES FAMILLES ONT UN MOTEUR DEPUIS BASES-1 : `verifiable` vaut
    // donc `true` partout, et il se calcule quand même — écrire `true` en dur
    // effacerait la question au lieu d'y répondre.
    const verifiable = m.objectifs.every((o) => FAMILLES_OBJECTIF.has(o.famille));
    const fait = objectifs.reduce((s, o) => s + o.fait, 0);
    const total = objectifs.reduce((s, o) => s + o.total, 0);
    return {
      id: m.id,
      titre: m.libelle ?? objectifs.map((o) => o.libelle).join(' · '),
      titreEcrit: m.libelle !== undefined,
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
 * ⚠ ET IL SAUTE CE QU'IL NE SAIT PAS OBSERVER. Plus rien n'est dans ce cas
 * depuis BASES-1, mais la garde reste : mettre en avant une mission qu'aucun
 * geste ne peut cocher arrêterait le tutoriel pour toujours à cette ligne.
 */
export function missionCourante(etat) {
  return etatDesMissions(etat).find((m) => m.verifiable && !m.faite) ?? null;
}

/**
 * Combien de missions sont faites, sur combien de VÉRIFIABLES.
 *
 * ⚠⚠ IL A GRANDI TOUT SEUL, ET C'EST LA MESURE M2 DU LOT BASES-1 : il valait
 * « 13 / 17 » tant que quatre missions n'avaient pas de moteur, il vaut
 * « 17 / 17 ». Le nombre n'est écrit nulle part — c'est la ligne ci-dessous qui
 * le compte, et c'est pour ça qu'il a suivi sans qu'on y touche.
 */
export function avancement(etat) {
  const verifiables = etatDesMissions(etat).filter((m) => m.verifiable);
  return { faites: verifiables.filter((m) => m.faite).length, total: verifiables.length };
}

/** Rétro-compatibilité de nom : la chaîne, telle que les tests la parcourent. */
export const MISSIONS = CHAINE_TUTORIEL;
