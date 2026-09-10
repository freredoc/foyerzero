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

import { APRES_RAID, GEOGRAPHIE } from './sites.js';
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
  // ⚠⚠ DEUX COLLECTEURS DEPUIS LE LOT BÂTIMENTS-QUATRE-ÉTATS, ET LA RÈGLE DU
  // 26/08 N'A PAS BOUGÉ D'UN MOT. « Un collecteur ne choisit pas ce qu'il
  // produit : il produit ce qu'il y a sous lui » — c'est toujours vrai, et c'est
  // même plus vrai qu'avant : le champ ne décide plus seulement de la ressource,
  // il décide DU BÂTIMENT. Ethan, 08/09 : « une icône collecteur mixte, le
  // bâtiment posé quartz ou scories en fonction du champ. »
  //
  // ⚠⚠ LE JOUEUR N'EN CHOISIT DONC PAS UN : la palette porte une seule
  // vignette, `collecteurMixte`, et `batimentDuChamp` tranche à la pose. Deux
  // vignettes auraient laissé poser un collecteur à quartz sur un champ de
  // scorie — un bâtiment dont le nom ment sur ce qu'il sort.
  //
  // ⚠ ET NI L'UN NI L'AUTRE NE PORTE `nom.ouvrage`, EXACTEMENT COMME LA
  // RAFFINERIE ET POUR LA RAISON QUI Y EST DÉJÀ ÉCRITE, prise dans l'autre sens.
  // Le Nœud de l'Ouvrage tient les deux ressources — `BATIMENTS.noeud.ressource`
  // vaut `{ quartz: 0.5, scorie: 0.5 }` —, il fait donc face à DEUX bâtiments du
  // joueur : « un vers deux : aucun nom ne convient, et en choisir un serait
  // faux la moitié du temps ». L'appariement déclaré passe de trois à deux.
  collecteurQuartz: {
    nom: { joueur: 'Collecteur à quartz' },
    ta: 'Harvester',
    role: 'producteur',
    // ⚠ SA RESSOURCE PROPRE, ET PLUS `quartzOuScorie`. L'exclusif n'avait de
    // sens que tant qu'un seul bâtiment couvrait les deux cas ; maintenant que
    // le champ choisit le bâtiment, celui-ci SAIT ce qu'il sort. La raffinerie
    // garde `quartzEtScorie`, l'inclusif, qui dit tout autre chose.
    ressource: 'quartz',
    pv: 1500,
    reparationSec: 65,
    unique: false,
    classeDeCout: 'modeste',
    plancherPv: true,
  },
  collecteurScorie: {
    nom: { joueur: 'Collecteur à scorie' },
    ta: 'Harvester',
    role: 'producteur',
    ressource: 'scorie',
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

  // ⚠⚠ LES TROIS ARTILLERIES SONT DES BÂTIMENTS, PAS DES DÉFENSES, ET LA
  // CONFUSION EST FACILE. `DEFENSES` porte déjà Faucheuse, Mortier et Harpon,
  // dessinées et câblées depuis le lot 8 : ce sont des PIÈCES qu'on garnit, qui
  // tirent, qui ont une portée et une cadence. Celles-ci sont des BÂTIMENTS —
  // elles occupent un emplacement du Chantier, elles se montent en niveau, elles
  // se réparent. Les fusionner ferait un objet qui obéit à deux moteurs.
  //
  // ⚠⚠ LEUR EFFET DE JEU N'EST PAS DANS CE LOT, ET `role: 'artillerie'` LE DIT
  // EN CLAIR. Le brief les fait entrer comme IDENTIFIANTS, avec leurs sprites et
  // leurs quatre états ; aucune branche du dépôt ne lit ce rôle-là, si bien
  // qu'elles se posent, se montent et se réparent sans rien produire. C'est un
  // rôle NEUF plutôt qu'un rôle emprunté : leur donner `'production'` les aurait
  // fait entrer dans la garde des trois casernes, et `'producteur'` dans le
  // calcul des débits — deux mensonges silencieux au lieu d'un blanc déclaré.
  //
  // ⚠ LES PV ET LE COÛT SONT POSÉS POUR ÊTRE JOUÉS ET CHANGÉS. 2 000 PV les
  // met entre la Centrale et les trois casernes, ce qui est la place d'une pièce
  // fixe et lourde ; `courant` est la classe des bâtiments qu'on pose en
  // plusieurs exemplaires sans qu'ils soient bon marché. Aucune mesure ne les
  // dicte — Ethan n'a pas arbitré, et le brief ne le demande pas.
  artillerieAntiInfanterie: {
    nom: { joueur: 'Artillerie anti-infanterie' },
    ta: 'Anti-Infantry Artillery',
    role: 'artillerie',
    pv: 2000,
    reparationSec: 65,
    unique: false,
    classeDeCout: 'courant',
    plancherPv: true,
  },
  artillerieAntiVehicule: {
    nom: { joueur: 'Artillerie anti-véhicule' },
    ta: 'Anti-Vehicle Artillery',
    role: 'artillerie',
    pv: 2000,
    reparationSec: 65,
    unique: false,
    classeDeCout: 'courant',
    plancherPv: true,
  },
  artillerieAntiAerien: {
    nom: { joueur: 'Artillerie anti-aérienne' },
    ta: 'Anti-Air Artillery',
    role: 'artillerie',
    pv: 2000,
    reparationSec: 65,
    unique: false,
    classeDeCout: 'courant',
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
 * d'écran, il s'écrit comme tel — et un test exige qu'il COUVRE le roster, ni un
 * nom en trop, ni un oublié, à l'exception NOMMÉE ci-dessous.
 *
 * ⚠⚠ LE CHANTIER DE CONSTRUCTION N'EST PAS DANS LA PALETTE — Ethan, 10/09,
 * point 3 : « Enlever le chantier de construction dans la liste des
 * constructions ». Ce n'est pas un choix d'écran de plus, c'est le retrait d'un
 * bouton QUI NE POUVAIT RIEN FAIRE, et ça se mesure dans cette table-ci : il
 * porte `unique: true`, et `BASE_NEUVE` en pose un d'office sur TOUTE base du
 * joueur. Sa vignette était donc grisée en permanence, de la première seconde de
 * la partie à la dernière — la palette montrait un geste que le moteur refusait
 * toujours, avec la seule raison « il est unique, et il est déjà posé ».
 *
 * ⚠ ET C'EST LE SEUL DU ROSTER DANS CE CAS, ce qui est ce qui rend l'exception
 * bornée. Les deux autres uniques du début — `centreDeCommandement` et
 * `qgDeDefense` — ne sont PAS posés d'office : leur vignette est vive tant qu'on
 * ne les a pas bâtis, donc elle a un geste à offrir. Le discriminant est
 * « posé par `BASE_NEUVE` », pas « unique » ; le jour où un second bâtiment
 * serait donné avec la base, il sortirait d'ici pour la même raison, et le test
 * de couverture le dirait en tombant.
 *
 * ⚠ IL N'EST PAS RETIRÉ DE `BASE_BATIMENTS` POUR AUTANT, et il ne peut pas
 * l'être : il se pose, se montre, se répare, s'améliore et RASE LA BASE quand il
 * tombe. Ce qui sort est la vignette, pas le bâtiment.
 *
 * ⚠ LA SOUSTRACTION SE LIT DANS `BATIMENTS_DONNES`, plus bas — elle est DÉRIVÉE
 * de `BASE_NEUVE` et ne peut donc pas dériver de lui. Elle vit là-bas et pas
 * ici parce qu'un `const` ne se lit pas avant d'être écrit : la déclarer au-dessus
 * de sa source passe `node --check` et LÈVE au chargement du module.
 *
 * ⚠ ET IL NE REMPLACE PAS L'ORDRE DE `BASE_BATIMENTS`. Réordonner la table
 * elle-même aurait déplacé tout ce qui l'énumère — le générateur, les tests, la
 * maquette — pour une décision qui ne concerne que la barre du bas.
 */
export const ORDRE_PALETTE = [
  'collecteurMixte', 'raffinerie', 'centrale', 'accumulateur',
  'centreDeCommandement', 'qgDeDefense',
  'complexeDeDefense', 'caserne', 'depotDeVehicules', 'aerodrome',
  'artillerieAntiInfanterie', 'artillerieAntiVehicule', 'artillerieAntiAerien',
];


/**
 * La vignette de palette qui n'est PAS un bâtiment, et ce qu'elle pose.
 *
 * ⚠⚠ QUINZE BÂTIMENTS, QUATORZE VIGNETTES, ET CE N'EST PLUS UNE PERMUTATION.
 * `ORDRE_PALETTE` a été une permutation exacte du roster jusqu'ici, et un test
 * l'exigeait. Ethan, 08/09 : « une icône collecteur mixte, le bâtiment posé
 * quartz ou scories en fonction du champ. » Le joueur ne choisit donc pas entre
 * les deux collecteurs — il pose UN collecteur, et le terrain dit lequel c'est.
 *
 * ⚠⚠ C'EST LA RÈGLE DU 26/08 PORTÉE D'UN CRAN PLUS HAUT, PAS UNE RÈGLE NEUVE.
 * `ressourceDonneeParLeChamp` disait « le champ décide de ce qu'il produit » ;
 * il décide maintenant DU BÂTIMENT, ce qui décide de ce qu'il produit. La phrase
 * du tutoriel — « c'est le champ sous lui qui décide de ce qu'il sort » — reste
 * vraie mot pour mot, et c'est ce qui a fait retenir cette lecture-là.
 *
 * ⚠ UNE TABLE, PAS UN `if`. Le jour où une seconde vignette mixte
 * apparaîtra — un bâtiment qui suivrait le terrain d'une autre façon — elle
 * s'ajoutera ici et nulle part ailleurs.
 */
export const VIGNETTES_MIXTES = {
  collecteurMixte: {
    // Ce que la vignette affiche — le nom générique, celui d'avant le
    // dédoublement. Le joueur pose « un Collecteur » ; ce qu'il obtient porte le
    // nom de sa ressource, et c'est le panneau du bâtiment posé qui le dit.
    nom: 'Collecteur',
    pose: { quartz: 'collecteurQuartz', scorie: 'collecteurScorie' },
    // ⚠⚠ CE QU'ELLE POSE HORS D'UN CHAMP, ET IL FAUT QUE CE SOIT QUELQUE
    // CHOSE. Le joueur peut viser une case nue : la pose doit alors être REFUSÉE
    // avec « doit être posé sur un champ », pas lever une exception qui
    // remonterait jusqu'à l'écran. On propose donc un des deux, et
    // `problemesDeLaPose` rend le refus attendu — le même que celui d'avant le
    // dédoublement, mot pour mot.
    parDefaut: 'collecteurQuartz',
  },
};

/**
 * Le bâtiment qu'une vignette pose sur un champ de cette ressource.
 *
 * ⚠ ELLE REND LA VIGNETTE TELLE QUELLE QUAND CE N'EST PAS UNE MIXTE, si bien
 * que tout appelant peut l'employer sans savoir laquelle il tient. Un appelant
 * qui devrait d'abord demander « est-ce une mixte ? » finirait par oublier.
 *
 * ⚠ ET ELLE LÈVE SUR UN CHAMP QU'ELLE NE CONNAÎT PAS plutôt que de rendre
 * `undefined` : un `undefined` deviendrait un `id` de bâtiment introuvable
 * quinze appels plus loin, là où l'erreur ne dit plus rien de sa cause.
 *
 * @param {string} vignette une entrée d'`ORDRE_PALETTE`
 * @param {string|null} ressourceDuChamp `quartz`, `scorie`, ou `null` hors champ
 * @returns {string} un identifiant de `BASE_BATIMENTS`
 */
export function batimentDeLaVignette(vignette, ressourceDuChamp) {
  const mixte = VIGNETTES_MIXTES[vignette];
  if (mixte === undefined) return vignette;
  // ⚠ HORS CHAMP, ON REND LE DÉFAUT ; SUR UNE RESSOURCE INCONNUE, ON LÈVE.
  // Les deux cas se ressemblent et ne sont pas du tout le même : viser une case
  // nue est un geste ORDINAIRE du joueur, que le refus de pose traite ; recevoir
  // « quartzz » est une faute de programme, et la taire ferait poser un
  // collecteur à quartz sur un gisement de scorie.
  if (ressourceDuChamp === null || ressourceDuChamp === undefined) return mixte.parDefaut;
  const pose = mixte.pose[ressourceDuChamp];
  if (pose === undefined) {
    throw new RangeError(
      `palette : « ${vignette} » ne sait pas quoi poser sur « ${ressourceDuChamp} »`,
    );
  }
  return pose;
}

/**
 * Le bâtiment de référence d'une vignette — celui dont on lit le coût, le rôle
 * et la classe pour la présenter.
 *
 * ⚠ LE PREMIER DE SA TABLE, ET LES DEUX SE VALENT. Les deux collecteurs
 * partagent PV, coût, classe, rôle et coefficient de régime : ils ne diffèrent
 * que par la ressource qu'ils sortent. Prendre le premier est donc exact, et un
 * test l'exige plutôt que de le supposer — le jour où deux bâtiments d'une même
 * vignette différeraient par le prix, c'est ce test-là qui le dirait.
 */
export function batimentDeReference(vignette) {
  const mixte = VIGNETTES_MIXTES[vignette];
  return mixte === undefined ? vignette : mixte.parDefaut;
}


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

/**
 * Les bâtiments que la base reçoit d'office, et qui n'ont donc pas de vignette.
 *
 * ⚠⚠ ELLE EST DÉRIVÉE DE `BASE_NEUVE`, JAMAIS ÉCRITE À LA MAIN — Ethan, 10/09,
 * point 3. C'est ce qui fait que la garde de couverture d'`ORDRE_PALETTE` ne peut
 * pas mentir : elle soustrait ce que la base neuve POSE, pas une liste recopiée
 * qui vieillirait au premier bâtiment donné de plus.
 *
 * ⚠ ET ELLE EST UNE LISTE POUR UN SEUL ÉLÉMENT, exprès. `BASE_NEUVE` est un
 * bâtiment aujourd'hui ; le jour où elle en poserait deux, c'est ELLE qui
 * changerait de forme, et cette ligne-ci suivrait sans qu'on la relise.
 */
export const BATIMENTS_DONNES = [BASE_NEUVE.id];

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
   * Ce qui peut se poser sur une case de champ, PAR RESSOURCE du champ.
   *
   * ⚠⚠ C'ÉTAIT UNE LISTE PLATE, C'EST UNE TABLE DEPUIS LE LOT
   * BÂTIMENTS-QUATRE-ÉTATS — et c'est ce qui empêche un collecteur à quartz
   * d'atterrir sur un champ de scorie. Le cas ne se produit pas à la POSE, que
   * `batimentDeLaVignette` tranche depuis le terrain ; il se produirait au
   * DÉPLACEMENT, où le joueur prend un bâtiment déjà posé et le repose ailleurs.
   * Sans la table, un collecteur à quartz glissé sur un champ de scorie
   * produirait du quartz depuis un gisement qui n'en a pas.
   *
   * ⚠ LA LISTE PLATE RESTE DÉRIVÉE, elle ne se recopie pas : `posablesSurUnChamp`
   * l'aplatit. Deux écritures du même ensemble diveraient au premier ajout.
   */
  posableDessus: {
    quartz: ['collecteurQuartz'],
    scorie: ['collecteurScorie'],
  },

  /**
   * LE CHAMP DÉCIDE DE LA RESSOURCE — arbitré le 26/08 par Ethan.
   * Un collecteur ne choisit pas ce qu'il produit : il produit ce qu'il y a
   * sous lui. C'est ce qui donne leur poids aux cinq à sept cases de quartz
   * d'une base — elles fixent, à la case près, combien de quartz on peut en
   * tirer, et ce plafond-là ne se déplace qu'en déménageant.
   * `BASE_BATIMENTS.collecteur.ressource` valait `quartzOuScorie` justement
   * parce que la réponse n'était pas dans la ligne du bâtiment.
   *
   * ⚠⚠ ELLE Y EST DEPUIS LE LOT BÂTIMENTS-QUATRE-ÉTATS, ET LA RÈGLE EN SORT
   * PLUS FORTE, PAS PLUS FAIBLE. Il y a deux collecteurs, un par ressource, et
   * le champ ne décide plus de ce que produit un bâtiment : il décide DU
   * bâtiment, donc de ce qu'il produit. Le joueur n'en choisit toujours pas un
   * — la palette n'a qu'une vignette — et la phrase du tutoriel, « c'est le
   * champ sous lui qui décide de ce qu'il sort », reste vraie mot pour mot.
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

  // ⚠⚠ LE PLAFOND DE LA QUATRIÈME RÉSERVE, ET LES DEUX NOMBRES SONT RECOPIÉS DE
  // L'ARMÉE — CE N'EST PAS UNE MESURE. `MODELE-REPARATION-1.md` §6 point 8 est
  // OUVERT : aucune des trente captures du 05/09 ne montre le dénominateur de
  // cette réserve. L'écran de réparation de Tiberium Alliances n'affiche qu'un
  // STOCK — `3j 22:01:08` sur l'une, `2j 10:31:41` sur l'autre — et jamais le
  // plafond qui le borne. Ce que le §4 relève, c'est ~94 h pour un niveau de
  // base de 53,68, là où la règle des trois autres réservoirs en donnerait 65 ;
  // les deux systèmes ne se recouvrent pas, et rien n'oblige à transposer.
  //
  // Ce qui est retenu est donc la règle des trois autres, à l'identique : douze
  // heures, plus une heure par niveau de BÂTIMENTS. Deux nombres posés pour être
  // joués et changés, pas pour être justes.
  //
  // ⚠⚠ CE QUE LE CALIBRAGE DONNE EST MESURÉ, ET LE LEVIER EST BEAUCOUP PLUS RAIDE
  // QUE PRÉVU. Base pleine — quarante bâtiments, le plafond
  // d'`emplacementsDuNiveau` — tous ramenés à 1 PV, ce qui est le pire cas :
  //
  //     Chantier 50, bâtiments 50 →  12,7 h à réparer pour 62,0 h de plafond
  //     Chantier 30, bâtiments 50 → 119,0 h            pour 61,5 h
  //     Chantier 20, bâtiments 50 → 369,2 h            pour 61,3 h
  //     Chantier 10, bâtiments 50 → 1 085,9 h          pour 61,0 h
  //
  // La réserve ne mord donc PAS quand le Chantier suit — c'est le levier voulu —
  // et elle mord déjà d'un facteur DEUX à vingt niveaux de retard. Le plafond,
  // lui, ne bouge presque pas d'une ligne à l'autre : il est indexé sur la
  // MOYENNE des bâtiments, que le Chantier seul ne déplace guère à quarante.
  // ⚠ Aux niveaux 10 et 30 la base pleine rend 0,9 h et 4,7 h pour 22 h et 42 h
  // de plafond : le milieu de partie est confortable, et c'est la fin qui
  // tranche.
  //
  // ⚠⚠ ET ILS VIVENT ICI, PAS DANS `REPARATION` DE `data/sites.js`. Cette
  // table-là est la réparation de l'ARMÉE, et ses `plafondHeures` /
  // `plafondHeuresParNiveauArmee` portent déjà ces noms pour une autre grandeur.
  // Les réunir ferait deux vérités sous deux noms voisins, et la première
  // personne qui lit `plafondHeures` ne saurait plus de quelle réserve on parle.
  plafondHeures: 12,
  plafondHeuresParNiveauBatiments: 1,
};

// ---------------------------------------------------------------------------
// Le retour des défenses — ce que le Complexe de défense commande, DES DEUX CÔTÉS
// ---------------------------------------------------------------------------
//
// ⚠⚠ UNE SEULE RÈGLE, LES DEUX CAMPS, ET C'EST CE QUI JUSTIFIE QU'ELLE VIVE
// DANS UN SEUL ENDROIT. Côté joueur, c'est le Complexe de défense qui ramène la
// garnison ; côté Ouvrage, c'est l'Étai — `BATIMENTS.etai` porte
// `ta: 'Complexe de défense'` et `reparationDefenses: true`, c'est LE MÊME
// bâtiment sous l'autre jeu de noms. Deux tables auraient divergé au premier
// réglage, et l'écart se serait lu comme un déséquilibre entre les camps.
//
// ⚠ ELLE EST DANS `data/base.js` ET PAS DANS `data/sites.js`, POUR UNE RAISON
// ET UNE SEULE : `indexeeSur` nomme un bâtiment du JOUEUR, qui n'a rien à faire
// dans la table de l'Ouvrage. `sim/site-entame.js` l'importe d'ici, comme il
// importe déjà `BASE_BATIMENTS`.
//
// ⚠⚠ ET `heuresDeBase` NE S'ÉCRIT PAS : elle EST
// `APRES_RAID.reparationDefensesHeures`, l'heure que `MODELE-REPARATION-1.md`
// §3 dicte depuis le 24/08 et que `TICKS_REPARATION_DEFENSES` dérive déjà.
// Écrire « 1 » ici ferait deux vérités pour la même heure, et la seconde
// resterait à 1 le jour où Ethan changerait la première.
//
//     santé       = PV restants du Complexe / ses PV maximaux   FIGÉE AU RAID
//     dépassement = max(0, niveau de la pièce − niveau du Complexe)
//     instantané  = partInstantaneeMilli/1000 × PV perdus × santé   À LA FIN DU RAID
//     durée       = heuresDeBase × facteurMilli(1 + dépassement)/1000
//                                × pénalité(santé)
//     pv(t)       = pvAprèsRaid + instantané
//                   + (PV perdus − instantané) × min(1, écoulé / durée)
//
// ⚠⚠ LE PALIER PORTE SUR L'ENSEMBLE DE LA DÉFENSE, DÉTRUITES COMPRISES — ETHAN,
// 05/09. Chaque pièce regagne d'un coup 70 % de SES PROPRES PV perdus, multipliés
// par la santé du Complexe : une pièce à zéro se relève donc instantanément à
// 70 % si le Complexe est entier. C'est le changement de fond du 05/09 — la
// règle d'avant ne touchait que les SURVIVANTES d'un camp, et ne rendait rien
// à ce qui était tombé.
//
// ⚠⚠ ET C'EST GRATUIT, DONC IL N'Y A NI RÉSERVE NI RESSOURCE. Rien ici ne
// ressemble à `REPARATION_BASE_JOUEUR` au-dessus : la défense ne se paie pas,
// ne consomme aucun réservoir de temps, et le joueur n'a aucun geste à faire.
// Ce sont deux mécanismes distincts, et les fondre serait la faute — la table
// du dessus dit « ce que le joueur ACHÈTE », celle-ci « ce que le temps REND ».
//
// ⚠⚠ `facteurMilli` EST APPELÉE, JAMAIS RECOPIÉE. Le modèle dit « la même
// formule que la croissance des unités de défense » : l'appeler fait suivre
// `deuxRegimes`, `niveauBascule` et `plafond` de `data/niveaux.js` sans qu'une
// seconde pente existe nulle part. Écrire « 1,10 » ici serait la faute, et elle
// serait invisible tant que personne ne rebasculerait les deux régimes.
//
// ⚠ ET C'EST POUR ÇA QUE LA RÈGLE EST PAR PIÈCE, JAMAIS EN AGRÉGAT.
// `facteurMilli` REFUSE un niveau non entier ; `niveauDeLaDefense` rend une
// MOYENNE en dixièmes, qui ne l'est pas. Une garnison mêlée revient donc à
// trois instants différents, ce qui est aussi la lecture juste : c'est la pièce
// de haut niveau qui paie son dépassement, pas ses voisines.
//
// ⚠⚠ ET LE DÉPASSEMENT VAUT TOUJOURS ZÉRO CÔTÉ OUVRAGE, CE QUI NE LE REND PAS
// MORT. Sur un site de l'Ouvrage, TOUT est au niveau du site — Souche, Étai et
// défenseurs, `placerBatiments` et `placerDefenses` poussent le même `niveau` —
// donc la durée s'y réduit au prorata de santé. La règle reste unique ; elle ne
// se comporte simplement pas pareil des deux côtés, et le dire ici évite qu'on
// croie un jour le dépassement inutile.
//
// ⚠⚠ LA PÉNALITÉ EST LINÉAIRE, ET C'EST UN ARBITRAGE D'ETHAN DU 06/09 QUI
// RENVERSE LA PROPOSITION DES DEUX BRIEFS. Tous deux proposaient une forme
// GÉOMÉTRIQUE — `(heuresAuPlancher / heuresDeBase) ** (1 − santé)` — au motif
// que « tout l'est dans ce jeu » (1,09 · 1,10 · 1,15 · 1,32), et un plancher à
// 72 h. Ethan : « la courbe choisie est géométrique. je préfère linéaire. 24h,
// pas 72h ».
//
//     pénalité(santé) = 1 + (heuresAuPlancher / heuresDeBase − 1) × (1 − santé)
//
// ⚠ CE QUE LE CHANGEMENT DE FORME DÉPLACE SE MESURE, ET IL PORTE SUR LE MILIEU,
// PAS SUR LES BORNES. Les deux formes touchent EXACTEMENT les deux points
// arbitrés — 1 h à pleine santé, le plancher à 1 PV — et ne diffèrent qu'entre
// les deux. À plancher égal de 24 h : géométrique 4 h 54 à mi-vie, linéaire
// 12 h 30. La linéaire punit donc beaucoup plus tôt une avarie légère, ce qui
// est le sens de l'arbitrage.
//
// LES DEUX TABLES, MESURÉES (`RETOUR-D T5`, `T6` et `T7` les rejouent) :
//
//     dépassement, Complexe entier        Complexe abîmé, dépassement nul
//       +0  →  1 h 00                       100 %  →   1 h 00
//       +5  →  1 h 37                        75 %  →   6 h 45
//      +10  →  2 h 36                        50 %  →  12 h 30
//      +20  →  6 h 44                        25 %  →  18 h 15
//      +30  → 17 h 27                         1 PV →  24 h 00
//
// Les deux se multiplient : une pièce à +10 sur un Complexe à mi-vie revient en
// 32 h 26.
//
// ⚠ ET LA DERNIÈRE LIGNE TOMBE ROND PARCE QUE LA SANTÉ SE RANGE EN MILLIÈMES.
// Un PV sur les 2 500 000 milli-PV d'un Complexe de niveau 1 vaut 0,4 millième,
// donc zéro une fois arrondi — et 2 500 000 est le PLUS PETIT maximum possible,
// si bien qu'aucun niveau de Complexe ne rend autre chose. Le second point
// arbitré est donc touché EXACTEMENT, comme le premier.
//
// ⚠⚠ SANS COMPLEXE CONSTRUIT, LA GARNISON NE REVIENT JAMAIS — ETHAN, 05/09.
// Ce n'est ni un défaut ni un cas limite, c'est la règle, et c'est pourquoi
// `complexeDeLaBase` rend `null` et jamais un niveau zéro : `null` dit un fait
// de JEU que l'écran doit pouvoir ANNONCER, là où un zéro se lirait comme un
// retour infiniment lent. L'avertissement est à l'écran, sous la bande Défense.
//
// ⚠⚠ ET COMPLEXE À ZÉRO PV : RIEN NE REVIENT, JAMAIS. C'est une GARDE ÉCRITE,
// pas une propriété qui tomberait de la formule — celle-ci rendrait la pénalité
// maximale, donc 24 h, et non « jamais ». Côté joueur elle ne tire pas : les
// bâtiments planchent à 1 PV et ne meurent pas. Côté Ouvrage l'Étai d'un camp
// peut tomber, et c'est là qu'elle mord.
//
// ⚠ LES TROIS NOMBRES SONT POSÉS POUR ÊTRE JOUÉS ET CHANGÉS. `heuresDeBase` est
// la seule que le modèle dicte (« en une heure ») ; `heuresAuPlancher` et
// `partInstantaneeMilli` sont des arbitrages, et le premier a déjà bougé.
export const RETOUR_DEFENSES = {
  // ⚠ LE BÂTIMENT EST NOMMÉ ICI, comme `REPARATION_BASE_JOUEUR.indexeeSur`
  // nomme le Chantier et `POINTS_ARMEE` le QG. L'écrire en dur dans `sim/`
  // ferait la seconde vérité que ce champ existe pour éviter. Côté Ouvrage,
  // c'est `BATIMENTS.etai.reparationDefenses` qui joue ce rôle-là.
  indexeeSur: 'complexeDeDefense',

  /** À pleine santé et sans dépassement — le « en une heure » du modèle. */
  heuresDeBase: APRES_RAID.reparationDefensesHeures,

  /** Le Complexe à 1 PV. Arbitré à 24 h par Ethan le 06/09 (72 h auparavant). */
  heuresAuPlancher: 24,

  /** Ce qui revient D'UN COUP à la fin du raid, avant la rampe. Ethan, 05/09. */
  partInstantaneeMilli: 700,
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
  modeste: 3, // centrale, les deux collecteurs
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
  // ⚠ LES DEUX COLLECTEURS PARTAGENT LA MESURE DE L'ANCIEN, ET C'EST LE MÊME
  // BÂTIMENT COUPÉ EN DEUX : 1,999 au niveau 56, ancre d'accueil 3. Rien n'a été
  // remesuré parce que rien n'a changé de courbe — un collecteur à quartz coûte
  // ce que coûtait le Collecteur.
  collecteurQuartz: 2,
  collecteurScorie: 2,
  raffinerie: 2, //            mesuré — le Silo, 1,999 au niveau 56
  accumulateur: 2, //          mesuré — 2,000 au niveau 62
  // ⚠⚠ LES TROIS ARTILLERIES N'ONT AUCUNE MESURE, ET ELLES PRENNENT CELLE DES
  // TROIS CASERNES — 6. C'est un emprunt déclaré, pas un relevé : elles partagent
  // la classe de coût `courant` avec la Caserne, le Dépôt et l'Aérodrome, et rien
  // dans `RELEVE-TA-*` ne parle d'elles. Le jour où Ethan les calibrera, ce sont
  // ces trois lignes-ci qui bougent, et elles seules.
  artillerieAntiInfanterie: 6,
  artillerieAntiVehicule: 6,
  artillerieAntiAerien: 6,
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
  // ⚠ LES DEUX COLLECTEURS GARDENT LES TROIS QUARTS, mesurés sur l'ancien.
  // `autres` couvre les treize restants, artilleries comprises : elles n'ont pas
  // de mesure, et le quart est ce que prennent tous ceux qui n'en ont pas.
  fraction: {
    centrale: 0.5 / 5.2, collecteurQuartz: 0.75, collecteurScorie: 0.75, autres: 0.25,
  },
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
  // ⚠⚠ LES DEUX COLLECTEURS PRODUISENT AUTANT L'UN QUE L'AUTRE, ET C'EST UNE
  // DÉCISION, PAS UNE RECOPIE. Le quartz et la scorie ne valent pas la même chose
  // à l'achat — `RESSOURCE_DE_COUT` fait payer les bâtiments en quartz — mais
  // aucune mesure ne dit qu'ils se RAMASSENT à des vitesses différentes, et
  // l'ancien Collecteur en sortait 240/h quel que soit le champ sous lui. Les
  // séparer aurait changé l'économie en croyant renommer.
  collecteurQuartz: {
    propre: 240,
    parVoisin: { raffinerie: 72 },
  },
  collecteurScorie: {
    propre: 240,
    parVoisin: { raffinerie: 72 },
  },
  raffinerie: {
    // ⚠ LA RAFFINERIE TOUCHE SON BONUS DES DEUX, séparément. C'est déjà ce
    // que l'exemple d'Ethan du 26/08 décrivait : « une raffinerie de niveau 1
    // entourée de deux collecteurs à quartz et trois à scorie produit 144/h de
    // quartz et 216/h de scorie » — cinq voisins, deux ressources, jamais
    // additionnées. La table le dit maintenant en deux clés au lieu d'une.
    parVoisin: { collecteurQuartz: 72, collecteurScorie: 72 },
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
/**
 * ⚠⚠ LA VALEUR EST UNE LISTE DEPUIS LE LOT BÂTIMENTS-QUATRE-ÉTATS, et c'est le
 * dédoublement du Collecteur qui l'a exigé : la Raffinerie fait face à DEUX
 * producteurs, l'Accumulateur toujours à un seul. Une chaîne aurait obligé à en
 * choisir un, donc à se tromper la moitié du temps — la même impasse que
 * `nom.ouvrage` a rencontrée trois cents lignes plus haut.
 *
 * ⚠ SON SEUL LECTEUR NE REGARDE QUE LES CLÉS. `sim/economie-base.js` demande
 * `hasOwnProperty` pour reconnaître un bâtiment de STOCKAGE sans réécrire la
 * liste ; la valeur, elle, n'est lue que par les tests et par le bonus de
 * voisinage, qui la retrouve dans `DEBITS`.
 */
export const PRODUCTEUR_APPARIE = {
  raffinerie: ['collecteurQuartz', 'collecteurScorie'],
  accumulateur: ['centrale'],
};

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
 * Comment le joueur appelle chaque famille de châssis.
 *
 * ⚠ CE SONT LES MOTS D'ETHAN, LE 29/08 : « Infanterie inconstructible sans
 * caserne. Même règle pour véhicule et avion. » On lui rend son vocabulaire
 * dans le message de refus plutôt que d'y écrire « escouade », qui est le nom
 * INTERNE du châssis et n'apparaît nulle part à l'écran.
 */
export const FAMILLE_DE_CHASSIS = {
  escouade: 'infanterie',
  blinde: 'véhicule',
  aeronef: 'avion',
};

/**
 * Ce qu'on dit d'une unité dont le bâtiment de production manque.
 *
 * ⚠ LA PHRASE ÉVITE L'ARTICLE DU BÂTIMENT, ET C'EST VOULU. « une Caserne » mais
 * « un Dépôt de véhicules » : porter le genre demanderait un champ de plus dans
 * `BASE_BATIMENTS` pour onze bâtiments, dont trois seulement s'en serviraient.
 * « sans Caserne » est juste des deux côtés. L'élision, elle, ne se contourne
 * pas — « pas d'infanterie » contre « pas de véhicule » — et se fait ici.
 *
 * ⚠⚠ ELLE A DESCENDU D'UN CRAN AU LOT PRODUCTION-EN-DÉFENSE, ET C'EST LA RÈGLE
 * QUI L'A TIRÉE. Elle vivait dans `ui/arsenal.js`, seul endroit qui en avait
 * besoin tant que la règle n'existait QUE dans les écrans ; `sim/state.js` la
 * dit maintenant au geste, et `sim/` n'importe jamais de `ui/`. Elle est donc
 * ici, au-dessus des deux, à côté de la table qu'elle sert — `ui/arsenal.js` la
 * RÉEXPORTE, si bien que les deux palettes n'ont pas changé d'import et qu'il
 * n'existe toujours qu'UNE écriture de la phrase.
 *
 * @param {string} nomBatiment nom joueur du bâtiment manquant
 * @param {string} chassis clé de `FAMILLE_DE_CHASSIS`
 * @returns {string}
 */
export function messageSansBatiment(nomBatiment, chassis) {
  const famille = FAMILLE_DE_CHASSIS[chassis];
  if (famille === undefined) {
    throw new Error(`arsenal : châssis inconnu « ${chassis} »`);
  }
  const elide = /^[aeiouyéèêàâîïôûù]/i.test(famille) ? `d'${famille}` : `de ${famille}`;
  return `sans ${nomBatiment}, pas ${elide}`;
}

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
 * @param {'centrale'|'collecteurQuartz'|'collecteurScorie'} id
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

// ---------------------------------------------------------------------------
// Les quatre états d'un bâtiment
// ---------------------------------------------------------------------------
//
// Arbitré par Ethan le 07/09. Un bâtiment se dessine dans l'un de quatre états,
// et c'est sa SANTÉ qui tranche :
//
//     intact         PV pleins, exactement
//     _abime         du premier PV perdu jusqu'à 50 % inclus
//     _tres_abime    sous 50 %, jusqu'à 1 PV
//     _detruit       0 PV
//
// ⚠⚠ LE PREMIER SEUIL EST UNE ÉGALITÉ, PAS UNE FRACTION, et c'est ce qui rend
// la règle testable au PV près. « Intact » ne veut pas dire « au-dessus de
// 99 % » : un bâtiment à un PV près du plein est DÉJÀ abîmé. Écrire
// `pv / pvMax > 0.99` marcherait sur un bâtiment de 1 000 PV et pas sur un de
// 50 — la faute ne se verrait que sur les petits, c'est-à-dire jamais pendant
// qu'on la cherche.
//
// ⚠⚠ ET LE DERNIER EN EST UNE AUSSI. `_detruit` est `pv === 0`, pas « moins de
// 1 % » : un bâtiment à 1 PV sur 5 500 tient encore, et le dessin doit le dire.
// Les deux fractions sont donc encadrées par deux égalités, ce qui est la seule
// façon d'avoir quatre états sur trois frontières.
//
// ⚠ 50 % APPARTIENT À `_abime`, et la comparaison s'écrit `pv * 2 >= pvMax`
// pour rester ENTIÈRE. Une division rendrait 0,5 sur un pvMax impair de façon
// inexacte, et la frontière se déplacerait d'un PV selon la parité.
//
// ⚠ `_detruit` N'EST PAS `ruine_<c>`. La ruine se pose quand la CASE est
// rasée ; `_detruit` quand le bâtiment est à zéro PV mais encore là. Deux
// choses différentes, deux sprites différents, et `B4 T5` le
// garde.

/**
 * Tout ce qui peut se poser sur un champ, quelle qu'en soit la ressource.
 *
 * ⚠ DÉRIVÉE, JAMAIS RECOPIÉE. `CHAMPS.posableDessus` est la table qui fait
 * foi ; une seconde liste écrite à la main cesserait d'être juste au premier
 * bâtiment qui gagnerait le droit d'occuper un champ, et la divergence ne se
 * verrait qu'à la pose.
 *
 * @returns {Set<string>}
 */
export function posablesSurUnChamp() {
  return new Set(Object.values(CHAMPS.posableDessus).flat());
}

/**
 * Les quatre états, du plus sain au plus mort — l'ordre EST la progression.
 *
 * ⚠ LE SUFFIXE DE L'INTACT EST VIDE, ET LES SEIZE SPRITES SAINS GARDENT LEUR
 * NOM NU. Les renommer aurait fait tomber `src/data/atlas.js`, `render/scene.js`
 * et leurs gardes pour un lot qui ajoute trois états.
 */
export const ETATS_BATIMENT = ['intact', 'abime', 'tresAbime', 'detruit'];

/** Le suffixe de fichier de chaque état. */
export const SUFFIXE_ETAT_BATIMENT = {
  intact: '',
  abime: '_abime',
  tresAbime: '_tres_abime',
  detruit: '_detruit',
};

/**
 * L'état d'un bâtiment, de ses PV restants et de son maximum.
 *
 * ⚠ EN UNITÉS QUELCONQUES, POURVU QUE LES DEUX SOIENT LES MÊMES. Le moteur
 * range des milli-PV, les montages de test des PV entiers : la règle est une
 * comparaison, pas une échelle.
 *
 * @param {number} pv PV restants, ≥ 0
 * @param {number} pvMax PV à plein, > 0
 * @returns {string} une valeur d'`ETATS_BATIMENT`
 */
export function etatDuBatiment(pv, pvMax) {
  if (!Number.isFinite(pv) || pv < 0) {
    throw new RangeError(`état de bâtiment : PV « ${pv} » — nombre ≥ 0 attendu`);
  }
  if (!Number.isFinite(pvMax) || pvMax <= 0) {
    throw new RangeError(`état de bâtiment : PV max « ${pvMax} » — nombre > 0 attendu`);
  }
  if (pv === 0) return 'detruit';
  if (pv >= pvMax) return 'intact';
  return pv * 2 >= pvMax ? 'abime' : 'tresAbime';
}
