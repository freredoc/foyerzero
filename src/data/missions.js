// La chaîne du tutoriel — dictée par Ethan le 29/08, mission par mission.
//
// ⚠ ELLE EST ICI PARCE QUE C'EST DU CALIBRAGE. Les niveaux visés (2, 3, 5, 8,
// 7, 6) et les comptes (1 Collecteur, 3 Collecteurs, 2 Centrales) sont des
// valeurs arbitrées, pas des règles : CLAUDE.md §4 les veut dans `src/data/`.
// `sim/missions.js` les INTERPRÈTE — il ne porte aucun de ces nombres, et un
// test le balaie pour s'en assurer.
//
// ⚠ AUCUN NOM DE BÂTIMENT NI D'UNITÉ N'EST ÉCRIT ICI, seulement des
// IDENTIFIANTS. Le nom que le joueur lit vient de `nom.joueur` des tables, à
// l'affichage. Recopier « Collecteur » ferait une seconde orthographe, et elle
// finirait par diverger de la première.
//
// ⚠⚠ LES DIX-SEPT MISSIONS ONT TOUTES UN MOTEUR DEPUIS LE LOT BASES-1. Quatre
// d'entre elles étaient écrites `famille: 'sans-moteur'` avec leur raison, parce
// que le raid, le déplacement et la seconde base n'existaient pas au 29/08 : les
// trois existent, et les quatre raisons étaient devenues fausses. Le compteur du
// tutoriel n'est donc plus « 13 sur 17 » mais 17 sur 17 — il a grandi tout seul,
// comme la ligne d'origine l'annonçait.

import { DEPLACEMENT } from './sites.js';

/**
 * Les quatre familles d'objectif. Une mission en porte une à trois ; son
 * compteur est la somme des leurs.
 *
 * - `batiments`     n bâtiments de cet identifiant, éventuellement sur une
 *                   ressource donnée et à partir d'un niveau donné
 * - `tous-au-niveau` TOUS les bâtiments posés, à partir de ce niveau
 * - `effectif`      n pièces de cet identifiant dans cette force, à ce niveau
 * - `niveau-moyen`  une des trois moyennes du joueur, en DIXIÈMES
 * - `sites-detruits` n sites de ce type rasés par le joueur, depuis toujours
 * - `bases-du-joueur` n bases fondées et tenues
 * - `montee-vers-le-nord` une base au moins à n cases au-dessus du départ
 *
 * ⚠⚠ `sans-moteur` A DISPARU AU LOT BASES-1, ET C'EST TOUT L'OBJET DU §4.7. Elle
 * portait les quatre objectifs que le dépôt ne savait pas observer — détruire un
 * camp, se rapprocher de l'Ouvrage, détruire une base, construire une seconde
 * base. Les quatre RAISONS écrites étaient devenues fausses : le raid existe
 * depuis RAID-A, le déplacement depuis DÉPLACEMENT, la seconde base depuis
 * ce lot. Le fichier annonçait lui-même la marche à suivre — « le jour où le
 * moteur arrive, c'est la ligne d'ici qui change ». La famille est retirée avec
 * elles : la garder vide inviterait à y remettre un objectif plutôt qu'à lui
 * écrire un moteur.
 */
export const FAMILLES_OBJECTIF = new Set([
  'batiments', 'tous-au-niveau', 'effectif', 'niveau-moyen',
  'sites-detruits', 'bases-du-joueur', 'montee-vers-le-nord',
]);

export const CHAINE_TUTORIEL = [
  {
    id: 'premier-collecteur',
    explication: 'C\'est le champ sous lui qui décide de ce qu\'il sort. Posé '
      + 'ailleurs que sur un champ, il ne produit rien du tout.',
    objectifs: [{ famille: 'batiments', id: 'collecteur', nombre: 1, ressource: 'quartz' }],
  },
  {
    id: 'chantier-deuxieme-niveau',
    explication: 'Il ouvre des emplacements, et il plafonne le niveau de toute '
      + 'la base : tant qu\'il ne monte pas, rien d\'autre ne monte.',
    objectifs: [{ famille: 'batiments', id: 'chantierDeConstruction', nombre: 1, niveau: 2 }],
  },
  {
    id: 'trois-collecteurs-de-quartz',
    explication: 'Trois sources valent mieux qu\'une. Monte-les : un Collecteur '
      + 'sature son stock en quelques minutes si rien ne le suit.',
    objectifs: [{
      famille: 'batiments', id: 'collecteur', nombre: 3, niveau: 2, ressource: 'quartz',
    }],
  },
  {
    id: 'chantier-troisieme-niveau',
    explication: 'Encore des emplacements, et un plafond de niveau qui remonte.',
    objectifs: [{ famille: 'batiments', id: 'chantierDeConstruction', nombre: 1, niveau: 3 }],
  },
  {
    id: 'deux-centrales',
    // ⚠ `{niveauElectrique}` EST RÉSOLU PAR `sim/missions.js`, QUI LE MESURE
    // sur `coutDeMontee`. Écrire « 3 » ici ferait une seconde table du barème,
    // et elle mentirait au premier changement de courbe.
    explication: 'À partir du niveau {niveauElectrique}, améliorer un bâtiment '
      + 'coûte aussi de l\'électricité. Sans elle, tout s\'arrête.',
    objectifs: [
      { famille: 'batiments', id: 'centrale', nombre: 2 },
      { famille: 'tous-au-niveau', niveau: 3 },
    ],
  },
  {
    id: 'chantier-cinquieme-niveau',
    explication: 'Le rythme de la partie, c\'est lui. Monte-le avant tout le reste.',
    objectifs: [{ famille: 'batiments', id: 'chantierDeConstruction', nombre: 1, niveau: 5 }],
  },
  {
    id: 'stockage-et-mise-a-niveau',
    explication: 'La Raffinerie tient le quartz et la scorie, l\'Accumulateur '
      + 'l\'électricité. Leur capacité double à chaque palier jusqu\'au dixième.',
    objectifs: [
      { famille: 'batiments', id: 'raffinerie', nombre: 1 },
      { famille: 'batiments', id: 'accumulateur', nombre: 1 },
      { famille: 'tous-au-niveau', niveau: 5 },
    ],
  },
  {
    id: 'commandement-et-vehicules',
    explication: 'Le premier ouvre ton budget d\'assaut, le second te donne le '
      + 'droit de construire des blindés.',
    objectifs: [
      { famille: 'batiments', id: 'centreDeCommandement', nombre: 1, niveau: 3 },
      { famille: 'batiments', id: 'depotDeVehicules', nombre: 1, niveau: 3 },
    ],
  },
  {
    id: 'deux-eclaireurs',
    explication: 'Ta première force offensive. Elle se compose sur l\'écran '
      + 'Offense, vague par vague.',
    objectifs: [{
      famille: 'effectif', force: 'armee', id: 'ratisseur', nombre: 2, niveau: 3,
    }],
  },
  {
    id: 'detruire-un-camp',
    libelle: 'Attaquer et détruire un camp',
    explication: 'Les camps sont le butin le plus proche de toi : ils '
      + 'réapparaissent, et tu peux y revenir.',
    objectifs: [{ famille: 'sites-detruits', type: 'camp', nombre: 1 }],
  },
  {
    id: 'qg-et-complexe',
    explication: 'Le QG ouvre ton budget de défense ; le Complexe soutient tes '
      + 'ouvrages. Sans QG, tu ne peux rien poser en défense.',
    objectifs: [
      { famille: 'batiments', id: 'qgDeDefense', nombre: 1, niveau: 3 },
      { famille: 'batiments', id: 'complexeDeDefense', nombre: 1, niveau: 3 },
    ],
  },
  {
    id: 'premiere-ligne-de-defense',
    explication: 'Les murs ralentissent, les tourelles tirent. Ils se posent '
      + 'sur la bande Défense, sous ta base.',
    objectifs: [
      { famille: 'effectif', force: 'garnison', id: 'merlon', nombre: 2, niveau: 3 },
      { famille: 'effectif', force: 'garnison', id: 'casemate', nombre: 2, niveau: 3 },
    ],
  },
  {
    id: 'trois-batiments-de-tete',
    explication: 'Les trois bâtiments qui commandent tout le reste : les '
      + 'emplacements, le budget d\'assaut, le budget de défense.',
    objectifs: [
      { famille: 'batiments', id: 'chantierDeConstruction', nombre: 1, niveau: 8 },
      { famille: 'batiments', id: 'centreDeCommandement', nombre: 1, niveau: 7 },
      { famille: 'batiments', id: 'qgDeDefense', nombre: 1, niveau: 5 },
    ],
  },
  {
    id: 'les-trois-moyennes',
    explication: 'Tes trois niveaux sont des MOYENNES sur ce que tu as posé. '
      + 'Poser du neuf les fait donc baisser — c\'est normal.',
    objectifs: [
      { famille: 'niveau-moyen', quoi: 'batiments', dixiemes: 70 },
      { famille: 'niveau-moyen', quoi: 'armee', dixiemes: 60 },
      { famille: 'niveau-moyen', quoi: 'defense', dixiemes: 50 },
    ],
  },
  {
    id: 'se-rapprocher-de-l-ouvrage',
    libelle: 'Se rapprocher des bases de l\'Ouvrage',
    explication: 'Plus tu montes vers le nord de la carte, plus les sites de '
      + 'l\'Ouvrage sont de haut niveau — et plus le butin est gros.',
    // ⚠⚠ LE NOMBRE DE CASES N'EST PAS INVENTÉ, IL EST DÉRIVÉ. Un déplacement va
    // au plus loin à `DEPLACEMENT.porteeMaxCases` : demander cette distance,
    // c'est demander UN saut complet vers le nord, ce qui est exactement le
    // geste que la mission décrit. Écrire un nombre ici aurait été trancher un
    // équilibrage qu'Ethan n'a pas donné.
    objectifs: [{ famille: 'montee-vers-le-nord', cases: DEPLACEMENT.porteeMaxCases }],
  },
  {
    id: 'detruire-une-base-de-l-ouvrage',
    libelle: 'Détruire une base de l\'Ouvrage',
    explication: 'Une base entière, pas un camp : c\'est l\'étape qui ouvre la '
      + 'carte vers le haut.',
    objectifs: [{ famille: 'sites-detruits', type: 'base', nombre: 1 }],
  },
  {
    id: 'seconde-base',
    libelle: 'Construire une seconde base',
    explication: 'Deux bases produisent en parallèle, et se défendent séparément.',
    objectifs: [{ famille: 'bases-du-joueur', nombre: 2 }],
  },
];
