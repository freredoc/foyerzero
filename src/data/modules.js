// Les quatorze modules — glossaire, effets et état de câblage.
//
// RELEVÉ dans `FOYER-ZERO-CALIBRAGE-2.xlsx` le 30/08/2026, et transcrit ICI
// pour la première fois : jusqu'à ce lot, `data/combat.js` portait un glossaire
// PARAPHRASÉ d'une ligne par module, sans les nombres. Les définitions sont
// dispersées dans trois feuilles du classeur et ne se lisent pas ligne à ligne
// — la colonne « description module » de la feuille UNITES est une LISTE
// indépendante, dont la rangée ne correspond pas à l'unité en face.
//
// ⚠⚠ LA TABLE A DÉMÉNAGÉ, ELLE N'A PAS ÉTÉ DUPLIQUÉE. `MODULES` vivait dans
// `data/combat.js` ; l'y laisser et en écrire une seconde ici aurait donné deux
// tables pour une seule grandeur, ce que CLAUDE.md §4 refuse. Le glossaire y
// est donc RETIRÉ, et les deux lecteurs — `test/donnees.test.js` et l'écran
// Recherche — pointent ici.
//
// ⚠ `description` EST LA TRANSCRIPTION D'ETHAN, MOT POUR MOT. Elle s'affiche au
// joueur ET sert de spécification aux lots qui câbleront les effets : la
// reformuler perdrait ce qu'elle dit. Une paraphrase a déjà coûté un lot au
// dépôt — c'est l'ancien glossaire, dont aucune ligne ne portait un nombre.
//
// ⚠⚠ `cable` DIT SI L'EFFET EXISTE DANS LE MOTEUR, et il gouverne la VENTE.
// Un module dont l'effet n'est pas écrit s'affiche avec sa description et son
// coût, et ne s'achète pas : prendre les points du joueur contre rien serait un
// vol. `sim/recherche.js` refuse l'achat par le code `effetNonCable`, et un
// test le vérifie sur toutes les lignes qui ne le sont pas encore.
//
// ⚠⚠ ET IL EST PAR BRANCHE — `{ offense, defense }` — DEPUIS LE LOT MODULES-A.
// Une même pièce porte souvent un module de chaque côté de la grille, et un
// effet peut être écrit d'un côté et vide de sens de l'autre : le Tir de
// barrage frappe les structures voisines de la cible, or l'attaquant n'en a
// aucune. Voir `moduleEstCable` en bas de fichier.
//
// ⚠ IL N'Y A PAS DE `fumigene`, ET CE N'EST PAS UN OUBLI. Arbitrage d'Ethan du
// 30/08 : un seul module, nommé `flashbang`. Le « fumigène » du classeur de
// calibrage désactive une INFANTERIE — c'était déjà le flashbang, sous un autre
// nom. Le fumigène anti-structure de Tiberium Alliances n'a jamais été
// transposé, et `ARBRE-RECHERCHE.md` §1 garde le relevé qui les distinguait.
export const MODULES = {
  flashbang: {
    libelle: 'Flashbang',
    // ⚠ CÂBLÉ EN OFFENSE SEULEMENT — lot MODULES-B. `declencherNeutralisations`
    // ne balaie que le camp `attaque`, comme le Booster : la Meute et le Bélier
    // portent aussi ce module en défense (`data/combat.js`), mais rien ne le
    // lirait de ce côté-là. Le drapeau refuse la vente plutôt que de la laisser
    // passer contre un effet qui n'existe pas.
    cable: { offense: true, defense: false },
    description: 'désactive une infanterie à portée pendant 5 s, une seule fois '
      + 'par raid, effet −20 % sur une unité de niveau n+1',
  },
  emp: {
    libelle: 'EMP',
    // ⚠ MÊME RAISON QUE LE FLASHBANG, et les mêmes deux lignes défense
    // refusées : la Carapace et le Fendeur le portent en défense.
    cable: { offense: true, defense: false },
    description: 'désactive un véhicule à portée pendant 5 s, une seule fois par '
      + 'raid, effet −20 % sur une unité de niveau n+1',
  },
  tirDeBarrage: {
    libelle: 'Tir de barrage',
    // ⚠ CÂBLÉ EN OFFENSE SEULEMENT, ET C'EST UNE DÉCISION, PAS UN OUBLI. Les
    // Perceurs portent ce module des deux côtés (`data/combat.js`), mais en
    // DÉFENSE l'attaquant n'a ni structure ni bâtiment sur la grille : l'effet
    // serait rigoureusement nul, et vendre 200 000 000 de points contre rien
    // est exactement ce que ce drapeau existe pour empêcher.
    cable: { offense: true, defense: false },
    description: 'inflige 30 % des dégâts sur les structures voisines',
  },
  booster: {
    libelle: 'Booster',
    // ⚠ CÂBLÉ EN OFFENSE SEULEMENT. Ses deux porteurs — Sapeurs et Cuirassiers
    // — n'ont aucun rôle défensif dans `data/combat.js`, et le moteur ne
    // déplace de toute façon que le camp `attaque` : l'effet n'aurait aucun
    // support de l'autre côté.
    cable: { offense: true, defense: false },
    description: 'après avoir été blessée, vitesse de déplacement multipliée par '
      + '10 pendant 3 s, une seule fois par raid',
  },
  garnison: {
    libelle: 'Garnison',
    cable: { offense: false, defense: false },
    description: 'peut embarquer une infanterie dans le véhicule ; elle débarque '
      + 'derrière le véhicule s\'il a traversé la défense, ou s\'il est détruit — '
      + 'dans ce cas, pas de pénalité sur l\'infanterie',
  },
  ecraseur: {
    libelle: 'Écraseur',
    // ⚠ LE SEUL CÂBLÉ, ET C'EST LE LOT RECHERCHE QUI L'A ÉCRIT. Voir
    // `forcerLesStructures` et `peutEcraser` dans `sim/combat.js`.
    cable: { offense: true, defense: false },
    description: 'le véhicule peut forcer les structures défensives : il leur '
      + 'inflige automatiquement 10 % de dégâts par seconde. Masse ×2 contre '
      + 'l\'infanterie',
  },
  autoReparation: {
    libelle: 'Auto-réparation',
    cable: { offense: false, defense: true },
    description: 'répare automatiquement 20 % des PV manquants après un raid, '
      + 'quel que soit le QG ou le complexe de défense',
  },
  bouclier: {
    libelle: 'Bouclier',
    // ⚠ CÂBLÉ EN OFFENSE SEULEMENT, ET C'EST UN CONSTAT, PAS UN ARBITRAGE :
    // l'Enclume est le SEUL porteur (`data/combat.js`), son `module` vaut
    // `bouclier` et son `moduleOuvrage` vaut `volDeVie`. Aucun profil ne porte
    // `bouclier` côté défense — le câbler là ouvrirait une ligne d'achat sans
    // aucune pièce derrière.
    cable: { offense: true, defense: false },
    description: 'encaisse tous les dégâts subis par les alliés sous le bouclier, '
      + 'rayon 2,5 ; le bouclier a des PV équivalents à 100 % des siens',
  },
  camouflage: {
    libelle: 'Camouflage',
    // ⚠ CÂBLÉ EN OFFENSE SEULEMENT, ET ICI LE MOT « DÉFENSE » EST DANS L'EFFET
    // LUI-MÊME : « invisible POUR LA DÉFENSE ». Une pièce camouflée du côté
    // défense serait invisible pour… l'attaquant, ce que la description ne dit
    // pas. Ses deux porteurs — Guetteur et Frappeur — n'ont d'ailleurs aucun
    // rôle défensif dans `data/combat.js`.
    cable: { offense: true, defense: false },
    description: 'invisible pour la défense ; sort du camouflage si une cible de '
      + 'prédilection est à portée',
  },
  munitionSpeciale: {
    libelle: 'Munition spéciale',
    // ⚠ CÂBLÉ EN DÉFENSE SEULEMENT, ET AUCUNE LIGNE NE S'OUVRE À L'ÉCRAN. Ses
    // trois porteuses — Casemate, Batterie, Créneau — ne le citent que par
    // `moduleOuvrage` ; leur `moduleJoueur` vaut `autoReparation`. La boutique
    // ne vend donc rien de nouveau : le drapeau dit que l'effet EXISTE, pas
    // qu'il est achetable. `offense` reste faux — aucune unité d'assaut ne le
    // porte, et `degatsContre` ne le lit que sur le tireur qui le PORTE.
    cable: { offense: false, defense: true },
    description: '+0,2 sur la matrice de la cible de prédilection',
  },
  volDeVie: {
    libelle: 'Vol de vie',
    // ⚠ MÊME CAS. Broyeur et Enclume le portent en `moduleOuvrage` ; côté
    // joueur leur `module` vaut `ecraseur` et `bouclier`. Rien ne s'ouvre.
    cable: { offense: false, defense: true },
    description: 'convertit 20 % des dégâts infligés en PV',
  },
  rayonMiniMoinsUn: {
    libelle: 'Rayon minimum −1',
    cable: { offense: false, defense: true },
    description: 'rayon minimum réduit de 1',
  },
  pvPlusVingt: {
    libelle: 'PV +20 %',
    cable: { offense: false, defense: true },
    description: '20 % de PV supplémentaires',
  },
  rayonPlusUn: {
    libelle: 'Rayon +1',
    cable: { offense: false, defense: true },
    description: '1 rayon d\'attaque supplémentaire',
  },
};

/**
 * L'effet de ce module est-il écrit dans le moteur, DE CE CÔTÉ-LÀ de la grille ?
 *
 * ⚠⚠ LE DRAPEAU EST PAR BRANCHE DEPUIS LE LOT MODULES-A, et c'est le Tir de
 * barrage qui l'a imposé. Les Perceurs le portent en offense ET en défense ;
 * son effet frappe les structures voisines de la cible, et l'attaquant n'en a
 * aucune sur la grille. Un drapeau unique aurait vendu le module défensif
 * 200 000 000 de points contre un effet rigoureusement nul.
 *
 * ⚠ ELLE LÈVE SUR UN NOM INCONNU **ET SUR UNE BRANCHE INCONNUE**, elle ne rend
 * pas `false`. Un module absent de la table est un fait de PROGRAMME —
 * `test/donnees.test.js` croise déjà les deux tables dans les deux sens — et
 * répondre « pas câblé » masquerait une faute de frappe sous un refus d'achat
 * parfaitement plausible. Une branche mal orthographiée ferait exactement la
 * même chose, en pire : elle refuserait TOUT achat de module.
 *
 * @param {string} nom clé de `MODULES`
 * @param {'offense'|'defense'} branche côté de la grille
 * @returns {boolean}
 */
export function moduleEstCable(nom, branche) {
  const ligne = MODULES[nom];
  if (ligne === undefined) throw new RangeError(`modules : module inconnu « ${nom} »`);
  if (!Object.hasOwn(ligne.cable, branche)) {
    throw new RangeError(`modules : branche inconnue « ${branche} »`);
  }
  return ligne.cable[branche] === true;
}
