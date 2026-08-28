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
// mentir. Une mission se recalcule à chaque image ; `SAVE_VERSION` ne bouge
// pas, et le tutoriel ne peut pas se désynchroniser de la partie.
// Conséquence assumée : démolir une Raffinerie décoche la mission qui la
// demandait. C'est honnête — le conseil redevient vrai — et c'est « rien ne se
// retire en silence » (CLAUDE.md §4) vu de l'autre côté.
//
// ⚠ AUCUN NOMBRE N'EST ÉCRIT EN DUR. Le niveau visé vient de
// `ECONOMIE_NIVEAU.premierNiveauPayant`, les noms de `nom.joueur`, la liste des
// bâtiments qui se posent sur un champ de `CHAMPS.posableDessus`, le voisinage
// de `voisinsQualifiantsParCase`, et le premier niveau qui coûte de
// l'électricité se MESURE sur `coutDeMontee`. Une valeur recopiée ici serait
// une seconde table, et elle finirait par dire autre chose que la première.
//
// ⚠ `nom.joueur`, JAMAIS `nom.ouvrage` (CLAUDE.md §4). C'est le joueur qu'on
// guide : il emploie le vocabulaire d'une armée régulière, pas celui de
// l'Ouvrage.

import { BASE_BATIMENTS, CHAMPS, coutDeMontee } from '../data/base.js';
import { ECONOMIE_NIVEAU } from '../data/economie.js';
import { GEOGRAPHIE } from '../data/sites.js';
import { voisinsQualifiantsParCase } from './disposition.js';
import { ressourceDeLaCase } from './champs.js';

/** Le nom que le JOUEUR emploie pour un bâtiment. */
function nom(id) {
  const b = BASE_BATIMENTS[id];
  if (b === undefined) throw new RangeError(`missions : bâtiment « ${id} » inconnu`);
  return b.nom.joueur;
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

// -- lectures de l'état, partagées par les prédicats -------------------------

function exiger(etat) {
  if (etat === null || typeof etat !== 'object') {
    throw new TypeError('missions : état attendu');
  }
  for (const champ of ['disposition', 'champs']) {
    if (!Object.prototype.hasOwnProperty.call(etat, champ)) {
      throw new RangeError(`missions : l'état ne porte pas « ${champ} »`);
    }
  }
}

/** Les bâtiments d'un type donné, avec leur indice dans la disposition. */
function poses(etat, id) {
  return etat.disposition
    .map((b, index) => ({ b, index }))
    .filter(({ b }) => b.id === id);
}

/** Un bâtiment de ce type est-il posé sur une case qui porte un champ ? */
function surUnChamp(etat, id) {
  return poses(etat, id)
    .some(({ b }) => ressourceDeLaCase(etat.champs, b.rangee, b.colonne) !== null);
}

/** Un bâtiment de ce type compte-t-il un voisin QUALIFIANT de cet autre type ? */
function voisinQualifiant(etat, id, idVoisin) {
  return poses(etat, id).some(({ index }) =>
    voisinsQualifiantsParCase(etat.disposition, etat.champs, index)
      .some((v) => v.type === idVoisin));
}

/** Un bâtiment de ce type a-t-il atteint ce niveau ? */
function auMoinsNiveau(etat, id, niveau) {
  return poses(etat, id).some(({ b }) => b.niveau >= niveau);
}

// -- la chaîne ---------------------------------------------------------------
//
// ⚠ ELLE SUIT L'OUVERTURE MESURÉE, pas une idée de l'ouverture. La chaîne
// « Chantier au niveau 2 → Collecteur sur un champ → Raffinerie au contact →
// monter la Raffinerie » est celle que CLAUDE.md §6 chiffre geste par geste,
// et c'est exactement le passage où le joueur se bloque : un Collecteur seul
// sature son stock en cinq minutes, et rien à l'écran ne le disait.

export const MISSIONS = [
  {
    id: 'chantier-au-premier-palier',
    titre: `Monte ton ${nom('chantierDeConstruction')} au niveau ${NIVEAU_VISE}`,
    explication: 'Il ouvre deux emplacements de plus. Sans eux tu ne peux poser '
      + 'qu\'un seul bâtiment, et la partie s\'arrête là.',
    faite: (etat) => auMoinsNiveau(etat, 'chantierDeConstruction', NIVEAU_VISE),
  },
  {
    id: 'collecteur-sur-un-champ',
    titre: `Pose un ${nom('collecteur')} sur un champ`,
    explication: 'C\'est le champ sous lui qui décide de ce qu\'il sort — quartz '
      + 'ou scorie. Posé ailleurs, il ne produit rien.',
    faite: (etat) => surUnChamp(etat, 'collecteur'),
  },
  {
    id: 'raffinerie-au-contact',
    titre: `Pose une ${nom('raffinerie')} au contact de ton ${nom('collecteur')}`,
    explication: 'Elle stocke le quartz ET la scorie, et chaque voisin la fait '
      + 'produire davantage. Les flèches te montrent qui compte.',
    faite: (etat) => voisinQualifiant(etat, 'raffinerie', 'collecteur'),
  },
  {
    id: 'monter-le-stockage',
    titre: `Monte ta ${nom('raffinerie')} au niveau ${NIVEAU_VISE}`,
    explication: 'Ta capacité double à chaque palier jusqu\'au dixième. Tant '
      + 'qu\'elle est pleine, ta production ne monte plus d\'une unité.',
    faite: (etat) => auMoinsNiveau(etat, 'raffinerie', NIVEAU_VISE),
  },
  {
    id: 'premiere-centrale',
    titre: `Pose une ${nom('centrale')}`,
    explication: () => `À partir du niveau ${premierNiveauElectrique()}, améliorer `
      + 'un bâtiment coûte aussi de l\'électricité. Sans elle, tu seras bloqué.',
    faite: (etat) => poses(etat, 'centrale').length > 0,
  },
];

// -- ce que l'écran demande --------------------------------------------------

/**
 * Les missions, avec leur état pour CETTE base.
 *
 * @param {object} etat
 * @returns {Array<{id: string, titre: string, explication: string, faite: boolean}>}
 */
export function etatDesMissions(etat) {
  exiger(etat);
  return MISSIONS.map((m) => ({
    id: m.id,
    titre: m.titre,
    explication: typeof m.explication === 'function' ? m.explication() : m.explication,
    faite: m.faite(etat),
  }));
}

/**
 * La première mission non faite — celle qu'on met en avant — ou `null` quand
 * la chaîne est terminée.
 *
 * ⚠ LA PREMIÈRE NON FAITE, PAS LA SUIVANTE DE LA DERNIÈRE FAITE. Rien
 * n'oblige le joueur à suivre l'ordre : il peut poser une Centrale avant sa
 * Raffinerie. Le tutoriel le rattrape alors sur ce qui manque VRAIMENT, au
 * lieu de lui redemander ce qu'il a déjà fait.
 */
export function missionCourante(etat) {
  return etatDesMissions(etat).find((m) => !m.faite) ?? null;
}

/** Combien de missions sont faites, sur combien. */
export function avancement(etat) {
  const toutes = etatDesMissions(etat);
  return { faites: toutes.filter((m) => m.faite).length, total: toutes.length };
}
