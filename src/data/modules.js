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
// test le vérifie sur les treize qui ne le sont pas encore.
//
// ⚠ IL N'Y A PAS DE `fumigene`, ET CE N'EST PAS UN OUBLI. Arbitrage d'Ethan du
// 30/08 : un seul module, nommé `flashbang`. Le « fumigène » du classeur de
// calibrage désactive une INFANTERIE — c'était déjà le flashbang, sous un autre
// nom. Le fumigène anti-structure de Tiberium Alliances n'a jamais été
// transposé, et `ARBRE-RECHERCHE.md` §1 garde le relevé qui les distinguait.
export const MODULES = {
  flashbang: {
    libelle: 'Flashbang',
    cable: false,
    description: 'désactive une infanterie à portée pendant 5 s, une seule fois '
      + 'par raid, effet −20 % sur une unité de niveau n+1',
  },
  emp: {
    libelle: 'EMP',
    cable: false,
    description: 'désactive un véhicule à portée pendant 5 s, une seule fois par '
      + 'raid, effet −20 % sur une unité de niveau n+1',
  },
  tirDeBarrage: {
    libelle: 'Tir de barrage',
    cable: false,
    description: 'inflige 30 % des dégâts sur les structures voisines',
  },
  booster: {
    libelle: 'Booster',
    cable: false,
    description: 'après avoir été blessée, vitesse de déplacement multipliée par '
      + '10 pendant 3 s, une seule fois par raid',
  },
  garnison: {
    libelle: 'Garnison',
    cable: false,
    description: 'peut embarquer une infanterie dans le véhicule ; elle débarque '
      + 'derrière le véhicule s\'il a traversé la défense, ou s\'il est détruit — '
      + 'dans ce cas, pas de pénalité sur l\'infanterie',
  },
  ecraseur: {
    libelle: 'Écraseur',
    // ⚠ LE SEUL CÂBLÉ, ET C'EST LE LOT RECHERCHE QUI L'A ÉCRIT. Voir
    // `forcerLesStructures` et `peutEcraser` dans `sim/combat.js`.
    cable: true,
    description: 'le véhicule peut forcer les structures défensives : il leur '
      + 'inflige automatiquement 10 % de dégâts par seconde. Masse ×2 contre '
      + 'l\'infanterie',
  },
  autoReparation: {
    libelle: 'Auto-réparation',
    cable: false,
    description: 'répare automatiquement 20 % des PV manquants après un raid, '
      + 'quel que soit le QG ou le complexe de défense',
  },
  bouclier: {
    libelle: 'Bouclier',
    cable: false,
    description: 'encaisse tous les dégâts subis par les alliés sous le bouclier, '
      + 'rayon 2,5 ; le bouclier a des PV équivalents à 100 % des siens',
  },
  camouflage: {
    libelle: 'Camouflage',
    cable: false,
    description: 'invisible pour la défense ; sort du camouflage si une cible de '
      + 'prédilection est à portée',
  },
  munitionSpeciale: {
    libelle: 'Munition spéciale',
    cable: false,
    description: '+0,2 sur la matrice de la cible de prédilection',
  },
  volDeVie: {
    libelle: 'Vol de vie',
    cable: false,
    description: 'convertit 20 % des dégâts infligés en PV',
  },
  rayonMiniMoinsUn: {
    libelle: 'Rayon minimum −1',
    cable: false,
    description: 'rayon minimum réduit de 1',
  },
  pvPlusVingt: {
    libelle: 'PV +20 %',
    cable: false,
    description: '20 % de PV supplémentaires',
  },
  rayonPlusUn: {
    libelle: 'Rayon +1',
    cable: false,
    description: '1 rayon d\'attaque supplémentaire',
  },
};

/**
 * L'effet de ce module est-il écrit dans le moteur ?
 *
 * ⚠ ELLE LÈVE SUR UN NOM INCONNU, elle ne rend pas `false`. Un module absent de
 * la table est un fait de PROGRAMME — `test/donnees.test.js` croise déjà les
 * deux tables dans les deux sens — et répondre « pas câblé » masquerait une
 * faute de frappe sous un refus d'achat parfaitement plausible.
 *
 * @param {string} nom clé de `MODULES`
 * @returns {boolean}
 */
export function moduleEstCable(nom) {
  const ligne = MODULES[nom];
  if (ligne === undefined) throw new RangeError(`modules : module inconnu « ${nom} »`);
  return ligne.cable === true;
}
