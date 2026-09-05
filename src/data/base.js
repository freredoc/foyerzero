// La base du joueur — transcription figée.
//
// SOURCE : FOYER-ZERO-BATIMENTS-JOUEUR.xlsx, arbitrages d'Ethan des 25/08/2026
// (deux passes). PV et temps de réparation de niveau 1 : RELEVE-TA-COURBES-2.md
// §6.5, valeurs transposées de Tiberium Alliances — le même choix que celui déjà
// fait pour les cinq bâtiments de site de sites.js, où Souche vaut 5 500 comme
// le Construction Yard et Étai 2 500 comme la Defense Facility.
//
// Le classeur est une feuille de saisie. Ce fichier-ci fait foi. CLAUDE.md §1.
//
// Les quatre points laissés ouverts le 25/08 au matin ont été arbitrés le même
// jour : réparation manuelle chez le joueur, noms TA, et le Chantier occupe un
// emplacement. Le quatrième — la courbe de stockage — a été arbitré en
// interpolation linéaire, puis REPRIS : l'interpolation était exacte mais
// l'ancrage la rendait inutilisable aux deux bouts. Voir la section Stockage.

import { GEOGRAPHIE } from './sites.js';
import { ECONOMIE_NIVEAU, montantDuPalier } from './economie.js';
import { GRILLE } from './combat.js';

// ---------------------------------------------------------------------------
// Les onze bâtiments
// ---------------------------------------------------------------------------
//
// `nom.joueur` est le nom affiché. `nom.ouvrage` n'existe que pour les
// bâtiments qui ont un pendant côté Ouvrage — les autres n'en ont pas, et la
// clé est absente plutôt que vide : `hasOwnProperty` doit pouvoir trancher.
//
// ⚠ ILS SONT TROIS — Souche, Étai, Nœud — et l'histoire de ce nombre mérite
// d'être lue avant de le changer :
//   25/08  la ligne annonce « trois » ; la table en porte QUATRE.
//   26/08  le décompte tombe : quatre. La ligne est corrigée en « quatre ».
//   26/08  Ethan arbitre que le quatrième n'existe pas — la raffinerie n'a pas
//          de pendant. La table repasse à trois, et la ligne avec.
// Les deux corrections étaient justes à leur date. La première réparait un
// décompte, la seconde une donnée. Ce n'est pas un aller-retour.
//
// LE RENVOI SE VÉRIFIE DANS LES DEUX SENS. `sites.js` porte l'appariement de
// l'autre côté : `BATIMENTS.souche.ta` vaut « Chantier de construction »,
// `etai.ta` « Complexe de défense », `noeud.ta` « Collecteur ». Les trois
// bouclent sur `nom.joueur` d'ici. `gangue.ta` vaut « Silo de tiberium » et
// `terril.ta` « Silo de cristal » : ni l'un ni l'autre ne renvoie vers la
// raffinerie, et c'est cette non-boucle qui a révélé l'appariement de trop.
// Un test croise les deux tables ; il tombera si quelqu'un en ajoute un sans
// l'écrire des deux côtés.
//
// ⚠ ATTENTION AU CHAMP `ta`, IL NE VEUT PAS DIRE LA MÊME CHOSE ICI ET LÀ-BAS.
// Dans ce fichier, `ta` est le nom Tiberium Alliances en anglais (« Factory »,
// « Harvester »). Dans `sites.js`, `ta` porte le nom FRANÇAIS du pendant
// joueur, et le nom TA anglais est en commentaire de fin de ligne. Deux
// fichiers, un même nom de champ, deux contenus : ne pas les comparer entre
// eux sans le savoir.
//
// `pv` et `reparationSec` valent au NIVEAU 1. Ils montent avec facteurMilli de
// sim/combat.js, comme tout le reste des PV du jeu.
//
// `unique` : un seul exemplaire dans la base. Les quatre bâtiments de
// production et de stockage ne le sont pas — c'est le nombre d'emplacements qui
// les limite, et c'est ce qui donne son intérêt au voisinage.

export const BASE_BATIMENTS = {
  chantierDeConstruction: {
    // « Nom TA » arbitré le 25/08 : Construction Yard → Chantier de construction.
    nom: { joueur: 'Chantier de construction', ouvrage: 'Souche' },
    ta: 'Construction Yard',
    role: 'central',
    pv: 5500,
    reparationSec: 88,
    unique: true,
    classeDeCout: 'majeur',
    // Le seul bâtiment sans plancher de PV : sa chute rase la base.
    // MODELE-REPARATION-1.md §2.
    plancherPv: false,
    // ⚠⚠ LE MÊME NOM DE CHAMP QUE `BATIMENTS.souche.raseLeSite`, ET C'EST
    // DÉLIBÉRÉ. Le moteur de combat lit cette clé-là sur ses cinq bâtiments de
    // l'Ouvrage depuis toujours ; depuis le lot RAID-B il monte aussi les onze
    // du joueur, et il la lit de la même façon. Lui donner ici un autre nom —
    // `raseLaBase`, `pivot` — aurait obligé `profilBatiment` à connaître DEUX
    // conventions pour une seule règle, et la seconde aurait été la première à
    // être oubliée. C'est le pendant exact de `plancherPv: false` ci-dessus :
    // les deux disent la même chose de deux côtés du même mécanisme.
    raseLeSite: true,
    // ⚠ LE CHANTIER STOCKE, ET C'EST CE QUI REND LA PARTIE JOUABLE.
    // Arbitré par Ethan le 27/08 en pointant `FOYER-ZERO-BATIMENTS-JOUEUR.xlsx`,
    // feuille EFFETS ligne 14 — « Stockage propre », valeur TA reprise telle
    // quelle : 50 tibérium + 50 cristal + 40 énergie.
    //
    // POURQUOI ÇA COMPTE. Sans lui, une base neuve ne pouvait RIEN produire,
    // jamais : le Chantier niveau 1 ouvre deux emplacements et en occupe un, il
    // en reste UN, et produire en demande deux — un producteur et un stockage.
    // Mesuré sur les quatre choix possibles, 24 h de simulation, zéro partout.
    // Ouvrir le troisième emplacement demandait le niveau 2, qui coûte 8, que
    // le joueur ne pouvait pas obtenir. La partie était instartable.
    //
    // ⚠ CES TROIS NOMBRES SONT CEUX DU NIVEAU 1, ET LA POCHE SUIT LE NIVEAU.
    // Arbitré par Ethan le 27/08 : × 1,25 par niveau du Chantier. L'arbitrage a
    // été posé APRÈS coup — la poche a été plate du 27/08 au matin au 27/08 au
    // soir, et `RELEVE-TA-COURBES-2.md` §6.5 ne donne effectivement qu'une
    // valeur unique, celle du niveau 1 de Tiberium Alliances. Elle ne dit rien
    // d'une courbe parce que là-bas le stockage se gagne en posant des silos.
    //
    // ⚠ LE 1,25 NE S'ÉCRIT PAS ICI. C'est `ECONOMIE_NIVEAU.penteProduction`,
    // celle-là même que suivent déjà la production et, par construction, la
    // capacité des deux bâtiments de stockage — `capaciteDuNiveau` vaut douze
    // heures de production du producteur apparié, donc elle monte en 1,25 sans
    // que personne l'ait écrit. La poche prend la même pente PARCE QUE c'est la
    // même grandeur : une durée d'absence tolérée, constante à niveau égal.
    // L'écrire en dur ici ferait deux tables pour une grandeur — CLAUDE.md §4 —
    // et le jour où la pente bougerait, la poche resterait seule en arrière.
    //
    // La courbe est appliquée par `stockagePropreDuNiveau`, plus bas, et par
    // elle seule ; `capacitesMilli` de `sim/economie-base.js` l'appelle. Lire
    // ce champ directement, c'est lire le niveau 1 sans le savoir.
    //
    // ⚠ CE N'EST PAS UN BÂTIMENT DE `role: 'stockage'`. Le Chantier reste
    // `central`. `capaciteDuNiveau` calcule une capacité comme douze heures de
    // production du producteur APPARIÉ, et le Chantier n'en a pas. Le champ
    // ci-dessous est un canal séparé, lu par `capacitesMilli` en plus des deux
    // bâtiments de stockage — n'importe quel bâtiment pourra en porter un.
    stockagePropre: { quartz: 50, scorie: 50, electricite: 40 },
  },
  centreDeCommandement: {
    nom: { joueur: 'Centre de commandement' },
    ta: 'Command Center',
    role: 'qgOffensif',
    pv: 3000,
    reparationSec: 88,
    unique: true,
    classeDeCout: 'majeur',
    plancherPv: true,
  },
  qgDeDefense: {
    nom: { joueur: 'QG de défense' },
    ta: 'Defense HQ',
    role: 'qgDefensif',
    pv: 3000,
    reparationSec: 88,
    unique: true,
    classeDeCout: 'majeur',
    plancherPv: true,
  },
  complexeDeDefense: {
    nom: { joueur: 'Complexe de défense', ouvrage: 'Étai' },
    ta: 'Defense Facility',
    role: 'reparation',
    pv: 2500,
    reparationSec: 88,
    unique: true,
    classeDeCout: 'courant',
    plancherPv: true,
  },
  caserne: {
    // « Nom TA » arbitré le 25/08 : Barracks → Caserne.
    nom: { joueur: 'Caserne' },
    ta: 'Barracks',
    role: 'production',
    chassis: 'escouade',
    pv: 2500,
    reparationSec: 88,
    unique: true,
    classeDeCout: 'courant',
    plancherPv: true,
  },
  depotDeVehicules: {
    // ⚠ TROIS NOMS ONT COEXISTÉ pour ce bâtiment, et c'est ce qui a fait perdre
    // du temps : la clé disait `usine` / « Usine » (nom TA, Factory), le
    // commentaire de COUT_NIVEAU_DEUX du même fichier disait « dépôt de
    // véhicules », et MODELE-REPARATION-1.md §3 disait « atelier » (corrigé
    // le 26/08, en même temps que ses §6.2 et §6.3).
    // ARBITRÉ le 26/08 par Ethan : c'est **Dépôt de véhicules**, ce qui
    // reprend le nom qu'il avait déjà donné le 24/08 (BASE-DU-JOUEUR-1.md §2).
    // `ta` garde Factory : c'est l'équivalent, pas le nom.
    nom: { joueur: 'Dépôt de véhicules' },
    ta: 'Factory',
    role: 'production',
    chassis: 'blinde',
    pv: 2500,
    reparationSec: 88,
    unique: true,
    classeDeCout: 'courant',
    plancherPv: true,
  },
  aerodrome: {
    // « Nom TA » arbitré le 25/08 : Airfield → Aérodrome.
    nom: { joueur: 'Aérodrome' },
    ta: 'Airfield',
    role: 'production',
    chassis: 'aeronef',
    pv: 2500,
    reparationSec: 88,
    unique: true,
    classeDeCout: 'courant',
    plancherPv: true,
  },
  centrale: {
    nom: { joueur: 'Centrale' },
    ta: 'Power Plant',
    role: 'producteur',
    ressource: 'electricite',
    pv: 2000,
    reparationSec: 65,
    unique: false,
    classeDeCout: 'modeste',
    plancherPv: true,
  },
  collecteur: {
    nom: { joueur: 'Collecteur', ouvrage: 'Nœud' },
    ta: 'Harvester',
    role: 'producteur',
    ressource: 'quartzOuScorie',
    pv: 1500,
    reparationSec: 65,
    unique: false,
    classeDeCout: 'modeste',
    plancherPv: true,
  },
  raffinerie: {
    // ⚠ PAS DE `nom.ouvrage`, ET C'EST UN ARBITRAGE, pas un oubli.
    // Ce fichier lui a porté `ouvrage: 'Gangue'` du 25 au 26/08. C'était faux,
    // et sites.js le disait déjà : `BATIMENTS.gangue.ta` vaut « Silo de
    // tiberium », pas « Raffinerie » — le seul des quatre appariements dont le
    // renvoi ne bouclait pas. Un test croisé le garde maintenant.
    //
    // POURQUOI L'APPARIEMENT N'EXISTE PAS. Ethan, le 26/08 : « ce n'est pas
    // vraiment du parallèle, ce n'est pas le miroir ». Côté Ouvrage, le
    // stockage est DEUX bâtiments — Gangue pour le quartz, Terril pour la
    // scorie — parce que c'est du BUTIN, et qu'un butin de quartz n'est pas un
    // butin de scorie. Côté joueur c'est UN bâtiment qui tient les deux. Un
    // vers deux : aucun nom ne convient, et en choisir un serait faux la moitié
    // du temps.
    nom: { joueur: 'Raffinerie' },
    ta: 'Tiberium Silo',
    role: 'stockage',
    // ⚠ `quartzEtScorie`, PAS `quartzOuScorie` — et la nuance porte tout.
    // Le collecteur produit l'un OU l'autre : le champ sous lui tranche, et il
    // ne fera jamais les deux. La raffinerie tient les deux À LA FOIS, et
    // `capaciteDuNiveau` s'applique À CHACUNE séparément : une raffinerie qui
    // affiche 100 stocke 100 de quartz ET 100 de scorie, pas 100 en tout.
    // Arbitré le 26/08. Deux chaînes distinctes parce que deux sens distincts —
    // les écrire pareil, c'est se préparer à additionner deux capacités qui ne
    // s'additionnent pas.
    ressource: 'quartzEtScorie',
    capaciteParRessource: true,
    pv: 1000,
    reparationSec: 42,
    unique: false,
    classeDeCout: 'mineur',
    plancherPv: true,
  },
  accumulateur: {
    nom: { joueur: 'Accumulateur' },
    ta: 'Accumulator',
    role: 'stockage',
    ressource: 'electricite',
    pv: 1000,
    reparationSec: 42,
    unique: false,
    classeDeCout: 'mineur',
    plancherPv: true,
  },
};

/**
 * L'ordre des vignettes dans la palette du bas.
 *
 * ⚠⚠ ARBITRÉ PAR ETHAN LE 03/09 : « pour les bâtiments, mettre le collecteur,
 * raffinerie, centrale, accumulateur en 1er ». Ce sont les quatre de
 * l'ÉCONOMIE, et ce sont ceux qu'une partie neuve pose en premier : la chaîne
 * du tutoriel les demande dans cet ordre-là, et la palette les mettait en
 * huitième, neuvième, dixième et onzième position — au bout du défilement,
 * derrière sept bâtiments qu'on ne peut pas encore payer.
 *
 * ⚠ C'EST UNE TABLE ET PAS UN TRI. Aucune clé de `BASE_BATIMENTS` ne porte
 * « à quel point ce bâtiment vient tôt » ; en inventer une pour pouvoir trier
 * ferait une donnée de calibrage qui n'en est pas une. L'ordre est un choix
 * d'écran, il s'écrit comme tel — et un test exige qu'il soit une PERMUTATION
 * exacte du roster, ni un nom en trop, ni un oublié.
 *
 * ⚠ ET IL NE REMPLACE PAS L'ORDRE DE `BASE_BATIMENTS`. Réordonner la table
 * elle-même aurait déplacé tout ce qui l'énumère — le générateur, les tests, la
 * maquette — pour une décision qui ne concerne que la barre du bas.
 */
export const ORDRE_PALETTE = [
  'collecteur', 'raffinerie', 'centrale', 'accumulateur',
  'chantierDeConstruction', 'centreDeCommandement', 'qgDeDefense',
  'complexeDeDefense', 'caserne', 'depotDeVehicules', 'aerodrome',
];


// ---------------------------------------------------------------------------
// Emplacements — ce que le Chantier de construction ouvre
// ---------------------------------------------------------------------------
//
// ⚠⚠ LES DIX PREMIERS NIVEAUX SONT UNE TABLE, PAS UNE FORMULE — dictés niveau
// par niveau par Ethan le 29/08/2026 :
//
//   1 → 3    2 → 6    3 → 8    4 → 10   5 → 12
//   6 → 14   7 → 16   8 → 18   9 → 19   10 → 20
//
// Les écarts ne se résument pas : +3, +3, puis +2 six fois, puis +1 deux fois.
// Aucune expression close ne rend ces dix valeurs, et en chercher une aurait
// donné une courbe « presque » juste — c'est-à-dire fausse sur deux ou trois
// niveaux, silencieusement. On écrit les dix.
//
// ⚠ AU-DELÀ DE DIX, RIEN NE CHANGE : un emplacement par niveau, plafonné à
// quarante. La table rejoint donc exactement l'ancienne courbe au niveau 10
// (20 des deux côtés), et les niveaux 11 à 50 rendent les mêmes nombres
// qu'avant ce lot. Le plafond tombe toujours au niveau 30, et les vingt
// derniers niveaux du Chantier n'ouvrent plus rien : ils ne servent qu'au
// temps de réparation.
//
//   niveau 11 → 21      niveau 20 → 30      niveau 30 → 40      niveau 50 → 40
//
// ⚠ CE QUI A CHANGÉ POUR LE JOUEUR, ET C'EST LE DÉBUT DE PARTIE. Sept bâtiments
// sont uniques et obligatoires, et le Chantier occupe un emplacement. Il reste
// donc DEUX emplacements libres au niveau 1 — il en restait un — et le niveau 3
// suffit désormais aux sept obligatoires, là où il fallait le niveau 4.

export const EMPLACEMENTS = {
  /** Les dix premiers niveaux, dictés un par un. L'indice 0 est le niveau 1. */
  parNiveau: [3, 6, 8, 10, 12, 14, 16, 18, 19, 20],
  parNiveauEnsuite: 1,
  plafond: 40,
  // Arbitré le 25/08 : le Chantier occupe lui-même un emplacement. Au niveau 1
  // il en ouvre trois et en prend un — il en reste DEUX, et les deux premiers
  // bâtiments de la partie sont donc de vrais choix.
  chantierOccupeUnEmplacement: true,
};

/**
 * Nombre d'emplacements ouverts par un Chantier de construction de ce niveau.
 * @param {number} niveau
 * @returns {number} entier, plafonné.
 */
export function emplacementsDuNiveau(niveau) {
  if (!Number.isInteger(niveau) || niveau < 1 || niveau > GEOGRAPHIE.niveauPlafond) {
    throw new Error(`base : niveau ${niveau} hors de 1…${GEOGRAPHIE.niveauPlafond}`);
  }
  const { parNiveau, parNiveauEnsuite, plafond } = EMPLACEMENTS;
  const dernier = parNiveau.length;
  const ouverts = niveau <= dernier
    ? parNiveau[niveau - 1]
    : parNiveau[dernier - 1] + parNiveauEnsuite * (niveau - dernier);
  return ouverts > plafond ? plafond : ouverts;
}

// ---------------------------------------------------------------------------
// Géométrie — la base du joueur EST la bande « bâtiments » de la grille
// ---------------------------------------------------------------------------
//
// ARBITRÉ le 26/08 par Ethan : « la base du joueur, une base ennemie, un camp,
// un avant-poste, c'est la même géométrie ». Il n'y a donc PAS de grille propre
// à la base du joueur, et il ne faut surtout pas en écrire une : les
// dimensions vivent dans GRILLE de data/combat.js, et elles y vivent seules.
// CLAUDE.md §4 — une table fait foi par grandeur.
//
//   grille complète    9 colonnes × 18 rangées
//   déploiement        rangées  1–2    les vagues y apparaissent
//   défense            rangées  3–10   8 rangées
//   bâtiments          rangées 11–18   8 rangées × 9 colonnes = 72 cases
//
// La base du joueur occupe les 72 cases de la bande « bâtiments ». Le plafond
// d'emplacements du Chantier (40) est donc TOUJOURS le plafond mordant : il
// reste 32 cases que le Chantier n'ouvrira jamais, même au niveau 50. Ce n'est
// pas un défaut — c'est ce qui laisse de la place aux champs et aux passages.

export const GEOMETRIE_BASE = {
  // Références, pas copies. Un changement de GRILLE se propage tout seul.
  premiereRangee: GRILLE.bandes.batiments.premiere,
  derniereRangee: GRILLE.bandes.batiments.derniere,
  premiereColonne: 1,
  derniereColonne: GRILLE.largeur,
};

/**
 * La case où se pose le Chantier de toute base du joueur : dernière rangée,
 * colonne du centre.
 *
 * ⚠ LE NOM NE DIT NI « HAUT » NI « BAS », ET C'EST VOULU. Ethan a d'abord dit
 * « en haut au milieu », puis précisé « 18,5 » — qui est la rangée la plus
 * PROFONDE de la bande. Selon qu'on regarde l'écran ou les numéros de rangée,
 * « en haut » désigne l'un ou l'autre bout, et la confusion a coûté un lot.
 * Le nom dit donc ce que la case EST, pas où elle a l'air d'être.
 *
 * ⚠ LA LARGEUR EST IMPAIRE (9), donc le centre est exact : la colonne 5. Pas
 * d'arbitraire ici, contrairement au centre de la carte monde qui, lui, tombe
 * entre deux colonnes (voir `sim/carte.js`).
 * @returns {{rangee: number, colonne: number}}
 */
export function caseDuChantier() {
  return {
    rangee: GEOMETRIE_BASE.derniereRangee,
    colonne: Math.ceil((GEOMETRIE_BASE.premiereColonne + GEOMETRIE_BASE.derniereColonne) / 2),
  };
}

/**
 * Ce que contient TOUTE base neuve du joueur — la première comme les suivantes.
 *
 * ARBITRÉ le 26/08 par Ethan : « la première base est gratuite et immédiatement
 * posée, il ouvre le jeu dans sa base », puis « toutes les bases que le joueur
 * pose suivront la même logique : chantier niveau 1 gratuit, sur position
 * 18,5 ». Ce n'est donc PAS un cas particulier du démarrage : c'est la règle de
 * fondation, et la première base n'en est que la première application.
 *
 * POURQUOI UN SEUL BÂTIMENT SUFFIT. Le niveau 1 ne coûte rien
 * (`ECONOMIE_NIVEAU.premierNiveauPayant` vaut 2), donc le joueur peut poser son
 * deuxième bâtiment tout de suite. Le Chantier niveau 1 ouvre deux emplacements
 * et en occupe un : il en reste exactement UN, et c'est le premier vrai choix.
 * Le tutoriel guide à partir de là.
 *
 * ⚠ LA RANGÉE 18 EST LE FOND, LA PLUS PROTÉGÉE. Dans `GRILLE`, les vagues
 * arrivent aux rangées 1–2 et la défense tient 3–10 : l'assaillant progresse
 * vers les rangées HAUTES, et la 18 est la dernière qu'il atteint parmi les
 * huit rangées de bâtiments. C'est cohérent avec le Chantier : il est le seul
 * sans plancher de PV, et sa perte force le redéploiement de 20 cases.
 *
 * ⚠ ET CETTE CASE NE PORTE JAMAIS DE CHAMP, quelle que soit la graine. Les
 * champs se tiennent à `CHAMPS.margeBord` du pourtour, donc entre les rangées
 * 12 et 17. La fondation est donc légale sur TOUTES les positions de la carte —
 * ce n'est pas une chance, c'est une conséquence, et un test la vérifie sur des
 * terrains tirés.
 */
export const BASE_NEUVE = {
  id: 'chantierDeConstruction',
  niveau: 1,
  // ⚠ INTACT, ET LE CHAMP EST PRÉSENT PLUTÔT QU'ABSENT. Depuis le lot RAID-B un
  // bâtiment du joueur peut être ENDOMMAGÉ : l'Ouvrage attaque sa base. Un
  // bâtiment neuf porte donc `degatsMilli: 0`, comme une pièce de garnison ou
  // d'armée, et pour la même raison qu'elles — ce sont des DÉGÂTS et non des PV,
  // si bien que le jour où `BASE_BATIMENTS[x].pv` bouge, la valeur enregistrée
  // ne peut pas devenir incohérente avec son maximum.
  degatsMilli: 0,
  ...caseDuChantier(),
};

// ---------------------------------------------------------------------------
// Champs de ressource — le socle des collecteurs
// ---------------------------------------------------------------------------
//
// ARBITRÉ le 26/08 par Ethan. Un champ est une case de terrain, quartz ou
// scorie, et il est le SOCLE d'un collecteur : seul le collecteur peut se poser
// dessus, et c'est la seule chose qui puisse s'y poser. Le nombre de cases de
// champ plafonne donc directement le nombre de collecteurs — DOUZE, dont cinq
// à sept en quartz. Sur une base qui n'ouvrira jamais plus de quarante
// emplacements, c'est un plafond qui mord.
//
// TIRAGE DÉTERMINISTE PAR LA POSITION. « Une base posée à un endroit aura
// toujours les mêmes champs. » La graine du tirage est la position sur la
// carte, pas l'horloge ni la partie : deux joueurs qui s'installeraient au même
// endroit y trouveraient le même terrain. C'est la même discipline que le reste
// du moteur — aucun Math.random, aucune horloge murale.
//
// LA FORME N'EST PAS LIBRE. Les douze cases se groupent en blocs de 1, 2 ou 3
// cases contiguës ; un triplet est droit (I) ou coudé (L), jamais autre chose.
// C'est ce qui fait qu'un collecteur a des voisins de même nature et que la
// disposition se lit à l'œil.
//
// ⚠ JAMAIS SUR LE POURTOUR. Les champs se tiennent à l'intérieur de la bande,
// une case de marge sur les quatre côtés. L'intérieur d'un 8 × 9 vaut donc
// 6 × 7 = 42 cases — rangées 12 à 17, colonnes 2 à 8. (Ethan avait dit « sept
// fois cinq » de mémoire : c'est l'intérieur d'un 9 × 7, l'orientation
// inversée. Corrigé le 26/08, mesuré sur GRILLE.)
//
// ARBITRÉ le 26/08 par Ethan : **ASYMÉTRIE VOULUE**. Le Collecteur ne touche
// AUCUN bonus par champ de ressource voisin. Le champ sous lui décide de ce
// qu'il produit, et c'est tout ce que le terrain lui donne.
//
// Ce n'est pas un trou laissé ouvert, c'est une décision, et elle a une raison
// mécanique : la production suit ×1,25 par niveau quand les coûts suivent
// ×1,32. Sur les 38 niveaux qui séparent 12 de 50, une amélioration finit par
// coûter 7,9 fois plus d'heures de production qu'au départ — c'est ce
// décrochage qui pousse le joueur vers le raid, dont le butin suit la pente des
// coûts (voir ECONOMIE_NIVEAU.penteProduction). Ajouter un multiplicateur de
// terrain au Collecteur amplifierait précisément le canal qu'on a délibérément
// laissé décrocher.
//
// ⚠ `champDeScorie: 60` sur la Centrale reste donc LE SEUL bonus de terrain de
// toute la table, et ce n'est pas un oubli non plus : il est né avec
// l'électricité, quatrième grandeur non pillable, comme son unique ancrage au
// sol. Tout le reste est bâtiment-à-bâtiment.
//
// Un test asserte la forme EXACTE de `collecteur.parVoisin` : ajouter une clé
// de terrain ici fera tomber la suite, plutôt que de glisser dans l'équilibrage
// sans que personne ne revoie la décision.
//
// ⚠ CE QUI N'EST PAS ENCORE ARBITRÉ, et qui n'est donc PAS écrit ici :
//   - si le redéploiement du joueur (Chantier détruit, 20 cases vers le bas)
//     retire les champs. La position change, donc le tirage change : ça
//     découle du code de sim/champs.js, mais ça n'a jamais été dit.
//
// ⚠ ET CE N'EST PAS LA SEULE VALEUR MANQUANTE DU PROJET — seulement la
// dernière de DEBITS, qui est maintenant COMPLÈTE (sept valeurs). Restent
// ouverts, ailleurs : coûts de réparation des bâtiments et des unités, plafonds
// de stockage d'électricité, taux d'accumulation et plafond de la réserve de
// temps de réparation, formule du dépassement de l'heure quand les défenses
// passent le niveau du Complexe. Voir l'onglet TROUS du classeur.

export const CHAMPS = {
  /** Cases de champ posées dans une base, toutes ressources confondues. */
  total: 12,

  /**
   * Les trois répartitions possibles des douze cases. Le tirage en choisit une.
   * La somme vaut `total` dans les trois cas, et un test l'asserte.
   */
  repartitions: [
    { quartz: 5, scorie: 7 },
    { quartz: 6, scorie: 6 },
    { quartz: 7, scorie: 5 },
  ],

  /** Tailles de bloc admises, en cases contiguës. */
  taillesBloc: [1, 2, 3],

  /**
   * Formes admises pour un bloc de trois : droit ou coudé. Un bloc de deux n'a
   * qu'une forme (le domino), un bloc d'un non plus — la contrainte ne porte
   * que sur les triplets.
   */
  formesTriplet: ['droit', 'coude'],

  /** Cases de marge laissées libres sur chaque bord de la bande. */
  margeBord: 1,

  /**
   * Ce qui peut se poser sur une case de champ. Liste fermée, et volontairement
   * une liste : si un jour un second bâtiment y a droit, il s'ajoute ici et
   * nulle part ailleurs.
   */
  posableDessus: ['collecteur'],

  /**
   * LE CHAMP DÉCIDE DE LA RESSOURCE — arbitré le 26/08 par Ethan.
   * Un collecteur ne choisit pas ce qu'il produit : il produit ce qu'il y a
   * sous lui. C'est ce qui donne leur poids aux cinq à sept cases de quartz
   * d'une base — elles fixent, à la case près, combien de quartz on peut en
   * tirer, et ce plafond-là ne se déplace qu'en déménageant.
   * `BASE_BATIMENTS.collecteur.ressource` vaut `quartzOuScorie` justement parce
   * que la réponse n'est pas dans la ligne du bâtiment : elle est sous lui.
   */
  ressourceDonneeParLeChamp: true,

  /**
   * Tentatives de placement avant abandon. Le tirage pose les blocs un par un
   * et peut se coincer : une tentative qui échoue est intégralement rejouée
   * avec un flux dérivé, jamais rafistolée — un rafistolage romprait le
   * déterminisme par position.
   *
   * ⚠ MESURÉ, et le résultat est plus franc qu'un facteur de marge : sur les
   * 9 000 positions de la carte (30 × 300), le tirage réussit **du premier
   * coup, partout**. Maximum 1, médiane 1, moyenne 1,0000. Ce garde-fou ne se
   * déclenche donc JAMAIS aux valeurs actuelles — et le dire est plus utile que
   * d'annoncer une marge qui n'a pas de sens.
   *
   * Là où il commence à mordre, mesuré en saturant la zone : 24 cases sur 42
   * demandent 2 tentatives au pire, 28 en demandent 4, 30 en demandent 9. Zéro
   * échec jusqu'à 30/42. Douze cases sont donc très loin du point de rupture,
   * et 64 couvre confortablement le jour où quelqu'un doublerait le compte.
   */
  tentativesMax: 64,

  /**
   * DÉDUIT, PAS DICTÉ — et c'est important de le savoir en le lisant.
   * Deux blocs de MÊME ressource ne se touchent jamais par un côté. Sans cette
   * règle, deux blocs de deux cases posés côte à côte formeraient un bloc de
   * quatre à l'œil, et « les champs viennent par un, deux ou trois » cesserait
   * d'être vrai à l'écran alors qu'il le resterait dans les données.
   * Le contact en DIAGONALE reste permis : il ne fusionne rien visuellement.
   * Deux blocs de ressources DIFFÉRENTES peuvent se toucher librement — un
   * quartz contre une scorie reste lisible.
   */
  contactLateralEntreBlocsDeMemeRessource: false,
};

// --- le terrain de la PREMIÈRE base -------------------------------------------
// ARBITRÉ le 29/08/2026. Ethan a DESSINÉ le terrain de sa base de départ, case
// par case, et il est ici tel quel.
//
// ⚠ POURQUOI UNE TABLE ET PAS UNE GRAINE. La question a été posée dans l'autre
// sens — « changer le seed de la 1re base » — et la réponse est MESURÉE : le
// terrain ne dépend pas de la graine du monde mais de la seule POSITION, donc
// changer la graine n'aurait rien changé. Et le dessin n'est atteignable par
// AUCUNE position : les 9 300 cases de la carte ont été balayées, elles rendent
// 9 300 terrains distincts, aucun n'est celui-ci, le plus proche en diffère de
// neuf cases. Une table est donc la seule voie honnête.
//
// ⚠ ELLE NE VAUT QUE POUR LA PREMIÈRE BASE, et « première » se lit à la
// FONDATION, pas à la position. Le terrain est gelé à la fondation depuis le
// 27/08 ; il voyage avec la base au redéploiement, et il lui survit au rasage
// (arbitré le 29/08 : « la base garde sa disposition »). La fondation initiale
// ne change donc jamais, et cette table est servie pour toujours. C'est aussi
// ce qui donne au champ `fondation` son seul rôle actuel : il n'est plus une
// position sur la carte, il est l'IDENTITÉ du terrain.
//
// ⚠ LE DESSIN RESPECTE LES RÈGLES DU TIRAGE, ET UN TEST LE VÉRIFIE plutôt que
// de le croire : douze cases, réparties 6/6, toutes dans la zone (rangées 12 à
// 17, colonnes 2 à 8), aucun bloc de plus de trois, et jamais deux blocs de même
// ressource au contact par un côté. Une table dispensée des règles serait la
// première à les contredire.
//
//        123456789
//    3   XXIXXXVXX      I obstacle infanterie
//    4   XXXXDXXXX      V obstacle véhicule
//    5   XVXXXXXXX      D obstacle les deux
//    6   XXXXXIXXD
//    7   XXXVXXXXX      Q champ de quartz
//    8   XXXXXXXIX      S champ de scorie
//    9   XDXXXXXXX
//   10   XXXXXVXXX
//   ————————————————
//   11   XXXXXXXXX
//   12   XQXXSXSXX
//   13   XXXXXXXXX
//   14   XQXSXXXQX
//   15   XXXSXSXXX
//   16   XSXXXXXXX
//   17   XQXXXXQQX
//   18   XXXXCXXXX      C Chantier de construction, posé par dispositionNouvelleBase
export const TERRAIN_INITIAL = {
  champs: [
    { rangee: 12, colonne: 2, ressource: 'quartz' },
    { rangee: 12, colonne: 5, ressource: 'scorie' },
    { rangee: 12, colonne: 7, ressource: 'scorie' },
    { rangee: 14, colonne: 2, ressource: 'quartz' },
    { rangee: 14, colonne: 4, ressource: 'scorie' },
    { rangee: 14, colonne: 8, ressource: 'quartz' },
    { rangee: 15, colonne: 4, ressource: 'scorie' },
    { rangee: 15, colonne: 6, ressource: 'scorie' },
    { rangee: 16, colonne: 2, ressource: 'scorie' },
    { rangee: 17, colonne: 2, ressource: 'quartz' },
    { rangee: 17, colonne: 7, ressource: 'quartz' },
    { rangee: 17, colonne: 8, ressource: 'quartz' },
  ],
  repartition: { quartz: 6, scorie: 6 },
  obstacles: [
    { rangee: 3, colonne: 3, type: 'infanterie' },
    { rangee: 3, colonne: 7, type: 'vehicule' },
    { rangee: 4, colonne: 5, type: 'les_deux' },
    { rangee: 5, colonne: 2, type: 'vehicule' },
    { rangee: 6, colonne: 6, type: 'infanterie' },
    { rangee: 6, colonne: 9, type: 'les_deux' },
    { rangee: 7, colonne: 4, type: 'vehicule' },
    { rangee: 8, colonne: 8, type: 'infanterie' },
    { rangee: 9, colonne: 2, type: 'les_deux' },
    { rangee: 10, colonne: 6, type: 'vehicule' },
  ],
};

// --- obstacles d'une base -----------------------------------------------------
// ARBITRÉ le 29/08/2026 : « obstacles seulement en défense, réparti au hasard »,
// et « oui le joueur a des obstacles comme ouvrage ».
//
// ⚠ LE NOMBRE ET LES TYPES NE SONT PAS DUPLIQUÉS ICI. Ils vivent dans
// `OBSTACLES` de `data/combat.js`, qui est la table du champ de bataille — dix
// obstacles, trois types. En écrire une seconde ferait diverger la base du
// joueur et les sites de l'Ouvrage, qui doivent obéir à la même règle.
//
// ⚠ DEUX CONTRAINTES DE POSE, ET ELLES SE DÉDUISENT DU RESTE DU JEU.
// Deux obstacles au plus par rangée : une rangée de neuf cases doit pouvoir
// porter les six occupants que `DISPOSITION_DEFENSES.occupantsMaxParRangee`
// autorise, et neuf moins deux en laisse sept. Trois obstacles rendraient la
// règle des six inatteignable sur cette rangée, en silence.
// Et jamais deux obstacles au contact par un côté : collés, ils ne font plus un
// obstacle mais un mur — or le mur est une DÉFENSE, avec ses points et ses PV.
// Le contact en diagonale reste permis, comme pour les champs.
export const OBSTACLES_DE_BASE = {
  maxParRangee: 2,
  contactLateral: false,

  /** Mêmes tentatives que les champs, et pour la même raison. */
  tentativesMax: 64,
};

/**
 * Bornes de la zone où les champs ont le droit de tomber : la bande des
 * bâtiments, moins la marge de bord. Calculée depuis GRILLE, jamais écrite en
 * dur — c'est tout l'intérêt de la faire passer par une fonction.
 * @returns {{ premiereRangee: number, derniereRangee: number,
 *   premiereColonne: number, derniereColonne: number, nombre: number }}
 */
export function zoneDesChamps() {
  const m = CHAMPS.margeBord;
  const premiereRangee = GEOMETRIE_BASE.premiereRangee + m;
  const derniereRangee = GEOMETRIE_BASE.derniereRangee - m;
  const premiereColonne = GEOMETRIE_BASE.premiereColonne + m;
  const derniereColonne = GEOMETRIE_BASE.derniereColonne - m;
  return {
    premiereRangee,
    derniereRangee,
    premiereColonne,
    derniereColonne,
    nombre:
      (derniereRangee - premiereRangee + 1) * (derniereColonne - premiereColonne + 1),
  };
}

/**
 * La case (rangee, colonne) est-elle dans la base du joueur ?
 * @param {number} rangee
 * @param {number} colonne
 * @returns {boolean}
 */
export function estDansLaBase(rangee, colonne) {
  return (
    rangee >= GEOMETRIE_BASE.premiereRangee
    && rangee <= GEOMETRIE_BASE.derniereRangee
    && colonne >= GEOMETRIE_BASE.premiereColonne
    && colonne <= GEOMETRIE_BASE.derniereColonne
  );
}

// ---------------------------------------------------------------------------
// Réparation — une seule ligne neuve
// ---------------------------------------------------------------------------
//
// Arbitré le 25/08. Quatre régimes, dont TROIS SONT DÉJÀ CODÉS dans
// TYPES_SITE de sites.js — ne pas les recopier ici, une table fait foi par
// grandeur (CLAUDE.md §4) :
//   base de l'Ouvrage ....... `base.reparationHeures: 1` — 0 % à 100 % en 60 min
//   camp .................... `camp.destructionDefinitive: true` — jamais réparé
//   avant-poste ............. `avantPoste.destructionDefinitive: true` — idem
//
// Le seul régime qui n'avait nulle part où vivre est celui du joueur : sa base
// n'est pas un type de site. Il est ici, et il est ici seulement.

export const REPARATION_BASE_JOUEUR = {
  // MANUELLE : rien ne se répare tout seul chez le joueur. C'est la contrepartie
  // du plancher à 1 PV — ses bâtiments survivent toujours, mais il paie pour les
  // remettre debout, là où la base de l'Ouvrage se relève seule en une heure.
  mode: 'manuelle',

  // ⚠ ARBITRÉ le 29/08/2026 par Ethan : « le Chantier de construction […]
  // définit aussi les temps de réparation. » Le bâtiment qui commande est donc
  // NOMMÉ ici, comme `POINTS_ARMEE` nomme déjà celui de chaque budget — plutôt
  // que d'être écrit en dur le jour où le moteur arrivera.
  indexeeSur: 'chantierDeConstruction',

  // ⚠⚠ LA COURBE EXISTE DEPUIS LE 05/09, ET CE BLOC DISAIT LE CONTRAIRE.
  // Il portait : « ET LA COURBE N'EST PAS DONNÉE, DONC ELLE N'EST PAS ÉCRITE.
  // Ethan a dit QUI décide, pas de combien. » C'était vrai jusqu'aux trente
  // captures du 05/09 ; le garder une ligne de plus en aurait fait un mensonge.
  //
  //     coût(niveau)  = prix du niveau atteint / diviseurDuCout
  //     temps(N, C)   = reparationSec × penteNiveau^(N−1) / D(C)
  //     D(C)          = penteBasse^(min(C,12)−1) × penteHaute^max(C−12, 0)
  //
  // ⚠⚠ ET IL FAUT DIRE EXACTEMENT CE QUE LA MESURE AUTORISE, PARCE QUE LES
  // TROIS NOMBRES N'ONT PAS LA MÊME SOLIDITÉ :
  //
  // — **1,1767 EST UNE CINQUIÈME PENTE, ET ELLE NE REPOSE QUE SUR UN COUPLE.**
  //   Ni 1,10 (les PV), ni 1,15 (la réparation d'armée), ni 1,32 (les coûts) :
  //   le seul écart d'un niveau disponible dans les captures est le Collecteur
  //   55 → 56, dont le temps passe de 36 071 s à 42 445 s, soit 1,176707. Rien
  //   d'autre dans le dépôt ne portait cette pente. Un second couple la
  //   confirmerait ou la ferait tomber ; il n'y en a pas.
  //
  // — **LE DIVISEUR EST REPRIS DE L'ARMÉE PAR ANALOGIE, ET SANS PREUVE.**
  //   `REPARATION.diviseurBatiment` de `data/sites.js` est mesuré pour les
  //   UNITÉS — les Exosoldats relevés à Caserne 10 puis 12 rendent 1,1874, soit
  //   1,09² à un millième. AUCUNE des trente captures ne montre l'effet du
  //   Chantier sur le temps de réparation d'un BÂTIMENT. Le jour où une capture
  //   le montrera, c'est cette ligne-ci qui tombera, pas la pente.
  //
  // — **230 EST UN ARRONDI DE DEUX MESURES**, 230,3 et 230,4 : Accumulateur 62
  //   à 222,7 M pour un prix de 51,27 G, Centrale 48 à 11,87 M pour 2,734 G.
  //   Deux bâtiments, deux coefficients de régime différents, le même rapport à
  //   0,1 % près. Le Collecteur 56 rend 1/153,6 — exactement 1,4993 fois plus
  //   cher —, et cette anomalie est ABANDONNÉE sur arbitrage d'Ethan du 05/09 :
  //   deux pistes ont été falsifiées (ce ne sont ni les PV, ni l'électricité),
  //   et la troisième — une avarie partielle des Collecteurs — n'est pas
  //   testable ici. Si c'était elle, 230 serait une borne basse.
  courbe: {
    penteNiveau: 1.1767,
    diviseurBatiment: { penteBasse: 1.09, penteHaute: 1.12, niveauRupture: 12 },
    diviseurDuCout: 230,
  },
};

// ---------------------------------------------------------------------------
// Coûts de construction
// ---------------------------------------------------------------------------
//
// Le niveau 1 est gratuit pour tous. Le premier coût est celui du niveau 2, et
// il dépend de la classe. Au-delà, les ratios d'ECONOMIE_NIVEAU s'appliquent,
// identiques pour les quatre classes : elles ne diffèrent que par l'ancrage.
//
//   majeur   8 → 10 → 20 → 80 → 440 → 1 440 → 4 400 → 12 800 → 35 200 → …
//   courant  5 → …    modeste  3 → …    mineur  2 → …
//
// ⚠ La ligne « courant » ci-dessous était le SEUL endroit du fichier à écrire
// « dépôt de véhicules » quand la clé du bâtiment disait `usine`. Elle avait
// raison — c'est la clé qui a été corrigée le 26/08, pas elle. Un test asserte
// maintenant que les quatre classes couvrent exactement les onze bâtiments,
// pour que la prochaine divergence tombe au lieu de dormir dans un commentaire.

export const COUT_NIVEAU_DEUX = {
  majeur: 8, // chantier, centre de commandement, QG de défense
  courant: 5, // caserne, dépôt de véhicules, aérodrome, complexe de défense
  modeste: 3, // centrale, collecteur
  mineur: 2, // raffinerie, accumulateur
};

// ---------------------------------------------------------------------------
// Le coefficient de régime — la SECONDE moitié du prix d'un bâtiment
// ---------------------------------------------------------------------------
//
// ⚠⚠ `classeDeCout` NE SUFFIT PLUS, ET CE N'EST PAS UN RAFFINEMENT. Une entité
// porte deux nombres : son prix d'ACCUEIL au niveau 2 — la table ci-dessus — et
// le coefficient qui commande sa courbe au-delà du niveau 12. Les deux ne
// coïncident que pour les trois bâtiments de la classe `majeur`, et c'est
// exactement sur le Chantier que la rampe d'`economie.js` avait été calée.
//
// ⚠⚠ LA CENTRALE ET LE COLLECTEUR SONT TOUS DEUX `modeste`, ET LEURS
// COEFFICIENTS DIFFÈRENT D'UN FACTEUR 2,6. C'est le fait qui interdit de
// dériver l'un de l'autre : la classe reste l'ancre d'accueil, le coefficient
// ne s'en déduit pas, et il s'écrit donc CLÉ PAR CLÉ. Un test exige que cette
// table couvre exactement les onze clés de `BASE_BATIMENTS`, comme celui qui
// existe déjà pour les quatre classes — sans lui, un douzième bâtiment entrerait
// sans coefficient et `coutDeMontee` rendrait `NaN` au lieu de lever.
//
// SOURCE : `RELEVE-TA-REPARATION.md` §2, sept coefficients lus sur les panneaux
// d'optimisation d'une base de niveau 53,68 et divisés par le profil de la
// courbe au niveau atteint. La Caserne est confirmée DEUX FOIS par deux chemins
// indépendants : les captures rendent 5,997, et `RELEVE-TA-COURBES-2.md` §5
// donnait déjà « Caserne, tibérium, coût au palier 11 : 144 000 », soit
// 144 000 / 24 000 = 6,000 — dans un document écrit avant les captures.
export const COEFFICIENT_DE_REGIME = {
  chantierDeConstruction: 8, // mesuré — 7,999 au niveau 40
  centreDeCommandement: 8, //  mesuré — 7,999 au niveau 50
  qgDeDefense: 8, //           ARBITRÉ par Ethan le 05/09, jamais mesuré
  complexeDeDefense: 5, //     ARBITRÉ par Ethan le 05/09, jamais mesuré
  caserne: 6, //               mesuré DEUX FOIS, par deux chemins
  depotDeVehicules: 6, //      mesuré — 5,997 au niveau 45
  aerodrome: 6, //             mesuré — 5,997 au niveau 45
  centrale: 5.2, //            mesuré — 5,200 au niveau 41, ancre d'accueil 3
  collecteur: 2, //            mesuré — 1,999 au niveau 56, ancre d'accueil 3
  raffinerie: 2, //            mesuré — le Silo, 1,999 au niveau 56
  accumulateur: 2, //          mesuré — 2,000 au niveau 62
};

// Coût en électricité d'une amélioration, à partir du niveau 3. Exprimé en
// fraction du coût en quartz du même palier.
// ⚠ « à partir du niveau 3 » : les niveaux 1 et 2 ne coûtent aucune électricité.
//
// ⚠⚠ DEUX DES TROIS FRACTIONS ÉTAIENT FAUSSES, ET LE QUART N'ÉTAIT PAS UNE
// RÈGLE — `RELEVE-TA-REPARATION.md` §6. Mesuré sur les sept panneaux
// d'optimisation : `autres` tombe bien à 0,2500 sur quatre bâtiments, mais le
// Collecteur donne 0,7503 et la Centrale 0,0962. Le quart était une coïncidence
// sur les quatre bâtiments qui partagent ce rapport.
//
// ⚠⚠ L'ÉLECTRICITÉ EST UNE SECONDE ANCRE, PAS UN RATIO — et c'est ce qui rend
// les trois nombres lisibles. Sept bâtiments, sept multiples EXACTS de 0,5 :
//   Chantier · Centre de commandement    tibérium 8    électricité 2
//   Caserne · Dépôt · Aérodrome          tibérium 6    électricité 1,5
//   Collecteur                           tibérium 2    électricité 1,5
//   Silo · Accumulateur                  tibérium 2    électricité 0,5
//   Centrale                             tibérium 5,2  électricité 0,5
// La Centrale à 0,0962 est simplement 0,5 / 5,2, et c'est pour ça que le
// quotient est ÉCRIT ICI EN TOUTES LETTRES : la décimale perdrait la
// dérivation, et la prochaine personne y lirait un réglage.
//
// ⚠ LA FORME `fraction` EST CONSERVÉE À DESSEIN. Les deux colonnes partagent la
// même courbe, donc leur rapport est constant sur les cinquante niveaux : une
// fraction et une seconde ancre donnent le même nombre. On garde la forme la
// moins invasive.
//
// ⚠ LE QG ET LE COMPLEXE DE DÉFENSE N'ONT AUCUNE MESURE : ils prennent
// `autres`, soit le quart — 2 et 1,25 d'électricité pour 8 et 5 de tibérium.
export const COUT_ELECTRICITE = {
  premierNiveauPayant: 3,
  fraction: { centrale: 0.5 / 5.2, collecteur: 0.75, autres: 0.25 },
};

// ---------------------------------------------------------------------------
// À QUELLE RESSOURCE UN COÛT SE PAIE — arbitré par Ethan le 27/08/2026
// ---------------------------------------------------------------------------
//
// « TOUS les bâtiments sont en quartz, toutes les défenses et l'offense sont en
// scorie. » Le trou est comblé : `COUT_NIVEAU_DEUX` donnait un nombre sans
// ressource depuis que le modèle du lot 1 est parti avec `data/params.js`, et
// c'est ce qui tenait les boutons Améliorer et Démolir désactivés à l'écran.
//
// ⚠ DEUX BÂTIMENTS PORTENT « DÉFENSE » DANS LEUR NOM ET COÛTENT DU QUARTZ.
// Le QG de défense et le Complexe de défense sont des BÂTIMENTS de la base —
// ils occupent un emplacement de la bande Chantier, ils ont des PV de bâtiment,
// ils se posent et se montent comme les neuf autres. La règle porte sur ce
// qu'une chose EST, pas sur le mot qui est dans son nom. Confirmé par Ethan le
// 27/08, explicitement, sur ces deux-là. Un test l'asserte nommément : sans
// lui, la prochaine personne qui lit « défense » routera vers la scorie.
//
// Les onze bâtiments de `BASE_BATIMENTS` sont donc TOUS de catégorie
// `batiment`. La catégorie n'est pas écrite ligne par ligne : elle vaut pour la
// table entière, et le jour où une ligne devra en sortir, c'est un champ par
// ligne qu'il faudra ajouter — pas une exception dans une fonction.
//
// ⚠⚠ LA CLÉ `defense` A QUITTÉ CETTE TABLE LE 28/08, ET SON ABSENCE EST LE
// MESSAGE. L'arbitrage du 27/08 anticipait « toutes les défenses et l'offense
// sont en scorie » ; celui du 28/08 a chiffré la défense entité par entité, et
// il la SÉPARE en deux : les six ouvrages fixes — mur, barbelés, barrière
// anti-char, tourelle mitrailleuse, canon anti-char, DCA — se paient en
// QUARTZ, les trois artilleries et les huit unités de garnison en scorie. Une
// clé unique ne peut plus dire la vérité pour la défense : elle est donc dite
// ligne par ligne dans `data/couts-militaires.js`, qui fait foi. La laisser
// ici, même juste pour la majorité, aurait donné une réponse fausse pour six
// entités à quiconque l'interroge sans lire plus loin. Un test asserte son
// ABSENCE, pas seulement la valeur des deux autres.
//
// `offense`, elle, reste vraie sans exception : les quatorze unités d'assaut
// se paient toutes en scorie, et l'arbitrage du 28/08 le confirme entité par
// entité.
export const RESSOURCE_DE_COUT = {
  batiment: 'quartz',
  offense: 'scorie',
};

/** La catégorie de tout ce que porte `BASE_BATIMENTS`. Voir ci-dessus. */
export const CATEGORIE_DE_COUT_DE_LA_BASE = 'batiment';

// ---------------------------------------------------------------------------
// Le coût d'une montée
// ---------------------------------------------------------------------------
//
// ⚠ L'ARGUMENT EST LE NIVEAU QU'ON ATTEINT, PAS CELUI D'OÙ L'ON PART.
// `coutDeMontee(id, 2)` est le prix du passage de 1 à 2, et il vaut
// `COUT_NIVEAU_DEUX[classe]`. Le niveau 1 est gratuit — donc `coutDeMontee`
// LÈVE sur 1 plutôt que de rendre zéro : un zéro se confondrait avec « rien à
// payer, c'est bon », et l'écran l'afficherait comme un prix.
//
// LA RAMPE N'EST PLUS ICI — elle est dans `data/economie.js`, avec la courbe
// qu'elle applique, depuis que la défense et l'offense ont reçu leurs propres
// ancres le 28/08. Ce fichier ne fournit plus que l'ANCRE d'un bâtiment, la
// classe de coût ; l'arrondi palier par palier et sa raison sont expliqués
// là-bas. La table relevée — 8 → 10 → 20 → 80 → 440 → 1 440 → 4 400 → 12 800 →
// 35 200 → 89 600 → 192 000 — reste confrontée palier par palier par un test.
//
// L'électricité ne se paie qu'à partir du niveau 3 et s'exprime en fraction du
// coût principal — `COUT_ELECTRICITE`. Son commentaire disait « du coût en
// quartz » : depuis l'arbitrage ci-dessus, c'est du coût dans SA ressource,
// quartz pour un bâtiment, scorie pour une défense.

/**
 * Ce que coûte de porter un bâtiment de la base AU niveau donné.
 *
 * @param {string} id une clé de `BASE_BATIMENTS`
 * @param {number} niveau le niveau atteint, de 2 à `niveauPlafond`
 * @returns {{quartz: number, scorie: number, electricite: number}} en UNITÉS,
 *   pas en milli-unités — la conversion appartient à `sim/`.
 */
export function coutDeMontee(id, niveau) {
  const def = BASE_BATIMENTS[id];
  if (def === undefined) throw new Error(`base : ${id} n'est pas un bâtiment de la base`);
  const premier = ECONOMIE_NIVEAU.premierNiveauPayant;
  if (!Number.isInteger(niveau) || niveau < premier || niveau > GEOGRAPHIE.niveauPlafond) {
    throw new Error(
      `base : niveau ${niveau} hors de ${premier}…${GEOGRAPHIE.niveauPlafond}`
        + ` — le niveau 1 est gratuit, il ne se demande pas`,
    );
  }

  const principal = montantDuPalier(
    COUT_NIVEAU_DEUX[def.classeDeCout], COEFFICIENT_DE_REGIME[id], niveau,
  );
  const cout = { quartz: 0, scorie: 0, electricite: 0 };
  cout[RESSOURCE_DE_COUT[CATEGORIE_DE_COUT_DE_LA_BASE]] = principal;

  if (niveau >= COUT_ELECTRICITE.premierNiveauPayant) {
    const { fraction } = COUT_ELECTRICITE;
    const part = Object.prototype.hasOwnProperty.call(fraction, id) ? fraction[id] : fraction.autres;
    cout.electricite = Math.round(part * principal);
  }
  return cout;
}

/**
 * Tout ce qui a été investi pour amener un bâtiment à ce niveau, depuis la
 * pose. Le niveau 1 étant gratuit, un bâtiment de niveau 1 a coûté ZÉRO — et
 * c'est ce que cette fonction rend, sans lever.
 * @param {string} id
 * @param {number} niveau niveau actuel, de 1 à `niveauPlafond`
 * @returns {{quartz: number, scorie: number, electricite: number}}
 */
export function coutCumule(id, niveau) {
  if (BASE_BATIMENTS[id] === undefined) {
    throw new Error(`base : ${id} n'est pas un bâtiment de la base`);
  }
  if (!Number.isInteger(niveau) || niveau < 1 || niveau > GEOGRAPHIE.niveauPlafond) {
    throw new Error(`base : niveau ${niveau} hors de 1…${GEOGRAPHIE.niveauPlafond}`);
  }
  const total = { quartz: 0, scorie: 0, electricite: 0 };
  for (let n = ECONOMIE_NIVEAU.premierNiveauPayant; n <= niveau; n++) {
    const palier = coutDeMontee(id, n);
    total.quartz += palier.quartz;
    total.scorie += palier.scorie;
    total.electricite += palier.electricite;
  }
  return total;
}

// ---------------------------------------------------------------------------
// Démolir — arbitré par Ethan le 27/08/2026
// ---------------------------------------------------------------------------
//
// « Remboursement à hauteur de 90 % de l'ensemble des ressources. » L'ensemble,
// c'est le CUMUL depuis la pose, toutes ressources comprises, électricité
// incluse — pas seulement le dernier palier.
//
// ⚠ DÉMOLIR UN BÂTIMENT DE NIVEAU 1 NE REND RIEN, et c'est cohérent, pas un
// oubli : poser est gratuit (`premierNiveauPayant` vaut 2), donc rien n'a été
// investi. Le joueur récupère son emplacement, pas des ressources. L'écran
// devra le dire avant le geste, sinon il se lira comme un bug.
//
// L'arrondi est un PLANCHER, dans les deux sens du terme : `Math.floor` sur
// chaque ressource. Arrondir au plus près rendrait 90 % de 5 en 5 — cinq
// démolitions-reconstructions d'affilée deviendraient gratuites. Un remboursement
// se perd, il ne se gagne jamais.
export const REMBOURSEMENT_DEMOLITION = { fraction: 0.9 };

/**
 * Ce que rend la démolition d'un bâtiment à ce niveau.
 * @param {string} id
 * @param {number} niveau
 * @returns {{quartz: number, scorie: number, electricite: number}} en UNITÉS
 */
export function remboursementDuNiveau(id, niveau) {
  const investi = coutCumule(id, niveau);
  const { fraction } = REMBOURSEMENT_DEMOLITION;
  return {
    quartz: Math.floor(investi.quartz * fraction),
    scorie: Math.floor(investi.scorie * fraction),
    electricite: Math.floor(investi.electricite * fraction),
  };
}

// ---------------------------------------------------------------------------
// Débits — production et stockage
// ---------------------------------------------------------------------------
//
// Tout est exprimé PAR HEURE au niveau 1, et monte en × 1,25 par niveau du
// bâtiment qui produit (ECONOMIE_NIVEAU.penteProduction).
//
// Deux canaux, et le second est ce qui donne son sens à la disposition :
//   `propre`   — ce que le bâtiment produit seul ;
//   `parVoisin`— ce qu'il produit EN PLUS pour chaque voisin qualifiant, dans
//                les huit cases qui l'entourent.
// Les deux couples sont réciproques : centrale ↔ accumulateur, collecteur ↔
// raffinerie. Chacun nourrit l'autre.
//
// ⚠ Aucun de ces débits ne tombe rond sur un tick, et c'est SANS IMPORTANCE :
// l'arrondi se fait une fois par couple (niveau, voisins), et le tick comme
// le rattrapage lisent le même entier. Chercher des débits divisibles serait de
// toute façon vain — × 1,25 vaut 5/4, il faudrait que la base contienne 4⁴⁹ en
// facteur pour rester entière jusqu'au niveau 50.

export const DEBITS = {
  centrale: {
    propre: 120, // /h au niveau 1
    parVoisin: { champDeScorie: 60, accumulateur: 72 },
  },
  accumulateur: {
    parVoisin: { centrale: 48 },
  },
  collecteur: {
    propre: 240,
    parVoisin: { raffinerie: 72 },
  },
  raffinerie: {
    parVoisin: { collecteur: 72 },
  },
};

// Rayon de voisinage : les huit cases qui entourent le bâtiment.
export const VOISINAGE = { rayon: 1, casesMax: 8 };

// ---------------------------------------------------------------------------
// Stockage — ancré sur une AUTONOMIE, pas sur un nombre d'unités
// ---------------------------------------------------------------------------
//
// POURQUOI L'ANCRAGE A CHANGÉ. La première écriture reprenait les 20 et 15
// unités de Tiberium Alliances, montées en × 2 jusqu'au niveau 10 puis
// interpolées vers × 1,333. Elle donnait ceci :
//
//   niveau  1 : 20 unités contre 240/h de production → PLEIN EN CINQ MINUTES
//   niveau 20 : 7,1 millions contre 16 653/h         → plein en dix-huit jours
//   niveau 50 : 7,2 × 10¹²                           → plein en soixante ans
//
// Le stockage croissait six millions de fois plus vite que la production. Aux
// deux bouts il ratait sa cible : au début il punissait le joueur en permanence,
// à la fin il ne le limitait plus jamais. Et sa capacité de niveau 50 arrivait à
// 1,26 fois seulement sous l'entier sûr en milli-unités — donc incompatible avec
// une boucle en micro-unités.
//
// LE PRINCIPE RETENU. Le stockage n'est pas un nombre d'unités, c'est une DURÉE
// D'ABSENCE TOLÉRÉE. C'est le rôle qu'il a récupéré des colis abandonnés : il
// borne ce qui s'accumule pendant qu'on ne joue pas. On l'écrit donc en heures,
// et la capacité s'en déduit :
//
// ⚠ LES COLIS SONT MORTS — reconfirmé par Ethan le 26/08 : « ils sont bien
// abandonnés, tous les bâtiments font de la production continue ». Il n'y a
// donc plus qu'un seul canal de production dans le jeu, et le pack/colis n'en
// est plus un. Deux conséquences, toutes deux SOLDÉES depuis :
//   - le reliquat du lot 1 — le champ colis de data/params.js et les blocs
//     colis de tickEconomie / rattrapageEconomie — a été retiré le 26/08 (lot
//     COLIS, SAVE_VERSION 3), et les fichiers qui le portaient l'ont été le
//     27/08 (lot ORPHELIN).
//   - BASE-DU-JOUEUR-1.md §3 affirme l'inverse (« le couple pack + flux continu
//     + voisinage est déjà implémenté »). Ce document est du 24/08 et de rang 4 :
//     il a un jour de retard sur l'arbitrage. Ne pas le suivre sur ce point.
//
//   capacité(niveau) = autonomieHeures × débitPropre(niveau du bâtiment)
//
// Le stockage suit donc EXACTEMENT la pente de production, × 1,25, sans rupture
// ni interpolation. Deux conséquences, toutes deux voulues :
//
//   1. À niveau égal entre le producteur et son stockage, l'autonomie est la
//      MÊME sur les cinquante niveaux. Le régulateur est enfin uniforme — ce que
//      le plafond à deux colis n'a jamais su être.
//   2. Elle ne l'est plus dès que le joueur laisse son stockage en retard :
//      autonomie réelle = 12 h × 1,25^(niveau stockage − niveau producteur).
//      Trois niveaux de retard ramènent à 6 h, six niveaux à 3 h. Monter sa
//      raffinerie devient de l'entretien qu'on sent, pas une case à cocher.
//
// LE MUR ARITHMÉTIQUE TOMBE AUSSI. Capacité de niveau 50 : 1,6 × 10⁸ unités au
// lieu de 7,2 × 10¹². Vingt raffineries de niveau 50 plafonnent à 3,2 × 10⁹
// unités, soit 2 790 fois de marge en milli-unités.

// ---------------------------------------------------------------------------
// ⚠⚠ LA COURBE CI-DESSUS EST PÉRIMÉE DEPUIS LE 28/08 — ELLE SE LIT AU PASSÉ
// ---------------------------------------------------------------------------
//
// Ethan : « courbe stockage raffinerie et accumulateur chelou, on reprend ces
// chiffres : niv 1 : 15 pour accu, 20 pour raff, amélioration × 2 jusqu'au
// niv 10, puis courbe linéaire pour atteindre × 1,333 au niv 50 ».
//
// C'est une RUPTURE, pas un réglage : la capacité ne se déduit plus du débit du
// producteur apparié. `autonomieHeures` disparaît avec le principe qu'elle
// portait — un débit et une capacité ne partagent plus aucune constante, et
// c'est exactement la règle §4 de CLAUDE.md (« quand deux grandeurs qui
// partageaient une constante divergent, séparer »).
//
// ⚠ CE QUE LA NOUVELLE COURBE FAIT, MESURÉ ET NON DÉDUIT. L'autonomie n'est
// plus constante : elle vaut CINQ MINUTES au niveau 1 (raffinerie 20 contre un
// collecteur à 240/h) et QUARANTE ET UN ANS au niveau 50. C'est l'inverse de ce
// que la version précédente cherchait, et c'est délibéré de la part d'Ethan —
// le stockage devient l'investissement qui structure toute la partie.
//
// ⚠⚠ LA QUEUE DE COURBE A ÉTÉ ÉCRASÉE POUR TENIR DANS L'ENTIER SÛR, ET C'EST
// UN ARBITRAGE, PAS UN BRICOLAGE. La première écriture arrivait à × 1,333 au
// niveau 50 : une seule raffinerie de niveau 50 tenait alors 4,77 × 10¹²
// unités, soit 53 % de l'entier sûr de JavaScript à elle seule, et DEUX le
// dépassaient. Ethan, mis devant la mesure : « fais au mieux pour les courbes
// stockage mais j'aime bien le × 2 des dix premiers. Sinon écrase les derniers
// niveaux pour que ça rentre. »
//
// Les deux contraintes sont tenues : le × 2 des dix premiers niveaux est
// INTACT, et c'est la fin de la rampe qui descend — de 1,333 à **1,05**.
//
// ⚠ LA CIBLE EST LA BASE LÉGALE LA PLUS GROSSE, PAS UNE BASE PLAUSIBLE. Au
// niveau 50 le Chantier ouvre 40 emplacements et en occupe un, donc
// **39 bâtiments de stockage** au maximum. C'est dégénéré — une base sans
// production — mais parfaitement légal, et l'exactitude arithmétique ne se
// règle pas sur ce qui est vraisemblable. Mesuré à × 1,05 :
//
//   39 raffineries niveau 50 → 3,18 × 10¹⁵ milli, soit **2,8 fois de marge**
//   20 raffineries niveau 50 → 1,63 × 10¹⁵ milli, soit 5,5 fois
//    1 raffinerie  niveau 50 → 8,15 × 10¹³ milli, soit 110 fois
//
// ⚠ ET AUCUN PALIER N'EST MORT. Écraser la queue ne veut pas dire l'aplatir :
// le multiplicateur descend de 1,976 au palier 11 à 1,05 au palier 50, donc le
// dernier niveau apporte encore +5 %. Un multiplicateur de 1 aurait laissé
// davantage de marge, et rendu les derniers niveaux inutiles à acheter.
//
// `CAPACITE_MILLI_MAX` de `sim/economie-base.js` reste en dernier recours — et
// il ne mord plus sur AUCUNE base légale, ce qu'un test asserte. C'est ce qu'on
// attend d'une garde : qu'elle soit morte tant que les données sont saines.

export const STOCKAGE = {
  // La capacité au niveau 1, EN UNITÉS, par ressource concernée. Arbitrée
  // bâtiment par bâtiment : elle ne se déduit plus de rien.
  niveauUn: { raffinerie: 20, accumulateur: 15 },
  // Le multiplicateur d'un palier, tant qu'on n'a pas dépassé `niveauSeuil`.
  multiplicateurAuDepart: 2,
  niveauSeuil: 10,
  // ⚠ C'EST LA SEULE CONSTANTE QUI A BOUGÉ POUR TENIR DANS L'ENTIER SÛR — voir
  // le pavé ci-dessus. Elle valait 1,333 ; la faire remonter au-dessus de 1,10
  // remet la base légale maximale au-dessus de l'entier exact, et l'écrêtage
  // cesse d'être une garde morte pour devenir un mur de jeu.
  multiplicateurAuPlafond: 1.05,
};

/**
 * Le multiplicateur qui fait passer un stockage AU niveau donné.
 *
 * Deux régimes, et la bascule est au niveau `niveauSeuil` : constant avant,
 * décroissant linéairement ensuite jusqu'à `multiplicateurAuPlafond` au dernier
 * niveau du jeu.
 *
 * ⚠ LE PLAFOND VIENT DE `GEOGRAPHIE.niveauPlafond`, il ne se réécrit pas ici.
 * Une seconde écriture du 50 ferait diverger la pente du jour où le plafond
 * bougerait, et la courbe n'atteindrait plus sa valeur d'arrivée.
 *
 * @param {number} niveau le niveau ATTEINT, de 2 à `niveauPlafond`
 * @returns {number} flottant
 */
export function multiplicateurDeStockage(niveau) {
  const { multiplicateurAuDepart: depart, niveauSeuil: seuil, multiplicateurAuPlafond: fin } = STOCKAGE;
  if (niveau <= seuil) return depart;
  const avancement = (niveau - seuil) / (GEOGRAPHIE.niveauPlafond - seuil);
  return depart + (fin - depart) * avancement;
}

/**
 * Capacité de stockage d'un bâtiment de stockage, à ce niveau, en UNITÉS.
 *
 * Elle part de `STOCKAGE.niveauUn[id]` et applique un multiplicateur par
 * palier — voir `multiplicateurDeStockage`. Elle ne dépend PLUS du débit du
 * producteur apparié : ce lien a été rompu le 28/08.
 *
 * ⚠ POUR LA RAFFINERIE, C'EST UNE CAPACITÉ PAR RESSOURCE, PAS UN TOTAL.
 * Elle stocke le quartz ET la scorie, chacun jusqu'à ce plafond : une
 * raffinerie qui rend 2 880 tient 2 880 de quartz et 2 880 de scorie, soit
 * 5 760 unités en tout. Arbitré le 26/08. L'accumulateur n'a qu'une ressource,
 * donc la question ne se pose pas pour lui — et c'est justement pour ça que la
 * fonction ne peut pas rendre « le total » sans mentir sur l'un des deux.
 * `BASE_BATIMENTS[id].capaciteParRessource` dit lequel est concerné.
 *
 * ⚠ ARRONDI UNE SEULE FOIS, À LA FIN — l'inverse de `coutPrincipal`, et pour
 * une raison précise : ce dernier RESTITUE une table relevée, palier par
 * palier, tandis que celle-ci est définie par sa formule et n'a aucune table à
 * retrouver. Arrondir chaque palier la ferait dériver vers le bas sans que rien
 * ne le demande.
 *
 * @param {'raffinerie'|'accumulateur'} id
 * @param {number} niveau
 * @returns {number} entier
 */
export function capaciteDuNiveau(id, niveau) {
  const def = BASE_BATIMENTS[id];
  if (def === undefined || def.role !== 'stockage') {
    throw new Error(`base : ${id} n'est pas un bâtiment de stockage`);
  }
  if (!Number.isInteger(niveau) || niveau < 1 || niveau > GEOGRAPHIE.niveauPlafond) {
    throw new Error(`base : niveau ${niveau} hors de 1…${GEOGRAPHIE.niveauPlafond}`);
  }
  const depart = STOCKAGE.niveauUn[id];
  if (depart === undefined) {
    throw new Error(`base : ${id} n'a pas de capacité de niveau 1 dans STOCKAGE`);
  }
  let capacite = depart;
  for (let n = 2; n <= niveau; n++) capacite *= multiplicateurDeStockage(n);
  return Math.round(capacite);
}

/**
 * Quel producteur alimente quel stockage. Les deux couples sont réciproques.
 *
 * ⚠ IL NE DÉCIDE PLUS DE LA CAPACITÉ DEPUIS LE 28/08. `capaciteDuNiveau` le
 * lisait pour multiplier le débit du producteur par l'autonomie ; la courbe
 * arbitrée ce jour-là a rompu ce lien, et cette table n'a plus qu'un rôle : dire
 * QUI est apparié à qui. `sim/economie-base.js` s'en sert pour reconnaître les
 * deux bâtiments de stockage sans en réécrire la liste, et le bonus de
 * voisinage suit le même appariement.
 */
export const PRODUCTEUR_APPARIE = { raffinerie: 'collecteur', accumulateur: 'centrale' };

// ---------------------------------------------------------------------------
// Ce qu'il faut avoir posé pour construire une unité
// ---------------------------------------------------------------------------
//
// ARBITRÉ le 29/08/2026 par Ethan : « Infanterie inconstructible sans caserne.
// Même règle pour véhicule et avion. »
//
// ⚠ LA CLÉ EST LE CHÂSSIS, PAS LE NOM DE L'UNITÉ. `UNITES[x].chassis` de
// data/combat.js classe déjà les quatorze unités en trois familles — escouade,
// blindé, aéronef — et les trois bâtiments de production existent depuis le
// lot BASE-0. La règle est donc une TABLE DE TROIS LIGNES, pas quatorze : une
// unité qui arriverait demain hérite de la règle sans qu'on y pense.
//
// ⚠ ELLE NE CONCERNE QUE LES UNITÉS. Les six ouvrages fixes et les trois
// artilleries de la défense ne sont pas dans `UNITES` et n'ont pas de châssis :
// un mur n'a jamais eu besoin d'une caserne.
//
// ⚠ ET CE N'EST PAS UNE RÈGLE DE `verifierEtat`. Comme le budget, elle peut
// devenir fausse SOUS une composition déjà posée — le joueur démolit sa
// Caserne, ou elle tombe au raid — et refuser le chargement rendrait la partie
// injouable pour une faute qu'il n'a pas commise. Elle s'oppose au GESTE, et
// c'est `sim/state.js` qui répond à la question.
export const BATIMENT_DE_CHASSIS = {
  escouade: 'caserne',
  blinde: 'depotDeVehicules',
  aeronef: 'aerodrome',
};

/**
 * Le stockage propre d'un bâtiment à ce niveau — la poche du Chantier.
 *
 * Elle part de `stockagePropre`, qui vaut au niveau 1, et suit
 * `penteProduction`. Voir le commentaire du champ pour l'arbitrage.
 *
 * ⚠ ELLE REND `null`, PAS UN OBJET DE ZÉROS, pour un bâtiment qui n'en porte
 * pas. Un objet de zéros s'additionnerait sans rien changer et serait donc
 * correct — mais il rendrait indiscernables « ce bâtiment ne stocke pas » et
 * « ce bâtiment stocke zéro », et le premier est une donnée absente quand le
 * second serait une donnée fausse.
 *
 * @param {string} id
 * @param {number} niveau
 * @returns {{quartz: number, scorie: number, electricite: number}|null} en UNITÉS
 */
export function stockagePropreDuNiveau(id, niveau) {
  const def = BASE_BATIMENTS[id];
  if (def === undefined) throw new Error(`base : ${id} n'est pas un bâtiment de la base`);
  if (!Number.isInteger(niveau) || niveau < 1 || niveau > GEOGRAPHIE.niveauPlafond) {
    throw new Error(`base : niveau ${niveau} hors de 1…${GEOGRAPHIE.niveauPlafond}`);
  }
  if (!def.stockagePropre) return null;

  const facteur = ECONOMIE_NIVEAU.penteProduction ** (niveau - 1);
  const sorti = { quartz: 0, scorie: 0, electricite: 0 };
  for (const r of Object.keys(sorti)) {
    const base = def.stockagePropre[r];
    if (base) sorti[r] = Math.round(base * facteur);
  }
  return sorti;
}

// ---------------------------------------------------------------------------
// Débit horaire — et pourquoi il n'est PAS exprimé par tick
// ---------------------------------------------------------------------------
//
// Le moteur du lot 1 rangeait un débit en milli-unités PAR TICK, arrondi une
// fois par couple (niveau, voisins). L'arrondi était cohérent — tick et
// rattrapage lisaient le même entier — mais il était gros : à 10 Hz, 240/h
// tombe sur 6,67 milli/tick, et arrondir coûte 5 % ; 48/h coûte 25 %.
//
// ✅ LE CORRECTIF EST EN PLACE (lot RÉSIDU). Plus aucun débit n'est arrondi par
// tick : un débit se range PAR HEURE, entier, et chaque bâtiment porte un
// résidu dans l'état de jeu (`residuFlux`, SAVE_VERSION 2). La règle vit
// aujourd'hui dans `sim/economie-base.js` ; `sim/economy.js`, qui l'avait
// portée en premier, a été retiré le 27/08 (lot ORPHELIN).
//
//   residu += debitParHeure
//   gain    = Math.floor(residu / TICKS_PAR_HEURE)
//   residu  = residu % TICKS_PAR_HEURE
//
// L'erreur d'arrondi par tick est EXACTEMENT NULLE, à n'importe quelle
// fréquence — c'est ce qui rend le passage du hors-combat à 1 Hz sans effet sur
// l'économie.
//
// ⚠ RECTIFICATIF SUR LE DÉBORDEMENT. La rédaction précédente annonçait que le
// pire cas — dix ans hors ligne au débit du niveau 50 — restait « deux fois
// sous l'entier sûr ». C'EST FAUX, et de loin : le produit naïf
// `N × debitParHeure` y vaut 4,2 × 10¹⁸, soit 470 fois AU-DESSUS. Le rattrapage
// ne calcule donc pas ce produit. Il décompose N en heures pleines + reste
// (arithmétique modulaire) et borne les heures pleines à ce qu'il faut pour
// saturer le stockage — au-delà le stock vaut la capacité de toute façon.
// Les deux produits qui subsistent sont bornés, et le seuil au-delà duquel
// l'exactitude tomberait est calculé et exporté : `DEBIT_MILLI_PAR_HEURE_MAX`,
// soit 2,5 × 10¹¹ milli/h à 10 Hz. Le débit du niveau 50 ci-dessus — 1,345 × 10⁷
// unités/h, le plus lourd du jeu — reste dessous d'un facteur 19 SEULEMENT.
// La marge est réelle mais pas confortable : `rattrapageEconomie` lève si elle
// est franchie, plutôt que de dériver en silence.
//
// Le seul arrondi qui subsiste est celui du débit horaire lui-même, fait une
// fois par niveau : nul aux niveaux 1 à 3, 0,053 % au niveau 4, et sous le
// millionième de pour cent au niveau 50.

/**
 * Débit propre d'un producteur à ce niveau, en unités PAR HEURE.
 * @param {'centrale'|'collecteur'} id
 * @param {number} niveau
 * @returns {number} entier.
 */
export function debitParHeure(id, niveau) {
  const def = DEBITS[id];
  if (def === undefined || def.propre === undefined) {
    throw new Error(`base : ${id} n'est pas un producteur`);
  }
  if (!Number.isInteger(niveau) || niveau < 1 || niveau > GEOGRAPHIE.niveauPlafond) {
    throw new Error(`base : niveau ${niveau} hors de 1…${GEOGRAPHIE.niveauPlafond}`);
  }
  return Math.round(def.propre * ECONOMIE_NIVEAU.penteProduction ** (niveau - 1));
}

/**
 * Débit d'un voisin qualifiant, en unités PAR HEURE. Le bonus se règle sur le
 * niveau du bâtiment QUI PRODUIT, pas sur celui du voisin.
 * @param {string} id bâtiment producteur du bonus
 * @param {string} voisin type de voisin qualifiant
 * @param {number} niveau niveau du bâtiment producteur
 * @returns {number} entier.
 */
export function debitVoisinParHeure(id, voisin, niveau) {
  const base = DEBITS[id]?.parVoisin?.[voisin];
  if (base === undefined) {
    throw new Error(`base : ${id} ne tire aucun bonus d'un voisin ${voisin}`);
  }
  if (!Number.isInteger(niveau) || niveau < 1 || niveau > GEOGRAPHIE.niveauPlafond) {
    throw new Error(`base : niveau ${niveau} hors de 1…${GEOGRAPHIE.niveauPlafond}`);
  }
  return Math.round(base * ECONOMIE_NIVEAU.penteProduction ** (niveau - 1));
}
