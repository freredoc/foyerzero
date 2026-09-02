// Arbre de recherche du JOUEUR. Coûts en POINTS, colonnes « À retenir » de
// FOYER-ZERO-RECHERCHE.xlsx (feuille FOYER-ZERO), relevées le 30/08/2026,
// plus les arbitrages d'Ethan du même jour.
//
// ⚠⚠ C'EST LA RECHERCHE, ET ELLE SEULE, QUI OUVRE LES PIÈCES AU JOUEUR.
// Arbitré le 30/08 : ni le niveau du Centre de commandement, ni celui du QG de
// défense n'y entrent. `apparition` redevient une table de l'OUVRAGE — elle dit
// ce que `sim/generateur.js` peuple sur ses sites, et plus aucun chemin du
// joueur ne la lit.
//
// ⚠ UNE PIÈCE S'ACHÈTE DEUX FOIS, UNE PAR BRANCHE. Le Chasseur coûte 300 000 en
// offense et 135 000 en défense, comme dans Tiberium Alliances. Les deux achats
// sont indépendants : l'un n'ouvre pas l'autre.
//
// ⚠ `module` EST LE COÛT DU MODULE, PAS SON NOM. Le nom du module se lit dans
// `src/data/combat.js` — `UNITES[id].module` en offense,
// `UNITES[id].defense.module` ou `DEFENSES[id].moduleJoueur` en défense — et sa
// DÉFINITION dans `src/data/modules.js`. Le classeur de recherche nomme mal
// cinq modules ; le classeur de CALIBRAGE tranche, et il confirme le code cinq
// fois sur sept. Les deux exceptions — la Meute et les Perceurs en défense —
// étaient des colonnes VIDES lues comme des absences, et sont corrigées dans
// `data/combat.js`.
//
// ⚠ AUCUNE ENTRÉE NE VAUT `null`. Les 14 pièces offensives et les 17 défensives
// ont toutes un module. Le jour où l'une n'en aura plus, `module: null` voudra
// dire « pas de module », jamais « gratuit » — et `sim/recherche.js` refusera
// l'achat par le code `sansModule`.
//
// ⚠ AUCUN COÛT NE SE RECALCULE AILLEURS. Ils sont écrits en clair ici, sans
// constante multiplicative et sans dérivation dans le moteur : un réétalonnage
// est une ligne de ce fichier, jamais une formule à retrouver. Voir §3.4 du
// rapport du lot — l'arbre a été rempli quand les points de recherche
// DOUBLAIENT par niveau, et ils suivent depuis la courbe économique.
export const ARBRE_RECHERCHE = {
  offense: {
    meute: { unite: 0, module: 10000000 }, //         Fusiliers   — gratuit
    ratisseur: { unite: 0, module: 60000000 }, //     Éclaireur   — gratuit
    busard: { unite: 0, module: 540000000 }, //       Épervier    — gratuit, arbitrage 9
    belier: { unite: 12500, module: 80000000 }, //    Pionnier
    perceurs: { unite: 200000, module: 24000000 }, // Grenadiers
    fendeur: { unite: 300000, module: 300000000 }, // Chasseur
    frappeur: { unite: 750000, module: 800000000 }, // Foudre
    carapace: { unite: 1500000, module: 10000000 }, // Cuirassiers
    fouisseurs: { unite: 5800000, module: 200000000 }, //  Sapeurs
    crecelle: { unite: 9850000, module: 150000000 }, //    Milan
    pilon: { unite: 19600000, module: 1000000000 }, //     Obusier
    guetteur: { unite: 42500000, module: 1200000000 }, //  Voltigeurs
    broyeur: { unite: 100000000, module: 1500000000 }, //  Percheron
    enclume: { unite: 120000000, module: 2500000000 }, //  Albatros
  },
  defense: {
    meute: { unite: 0, module: 10000000 }, //         Fusiliers — AJOUT, arbitrage 10
    merlon: { unite: 0, module: 1200000 }, //         Merlon
    casemate: { unite: 0, module: 140000000 }, //     Casemate
    fendeur: { unite: 135000, module: 800000000 }, // Chasseur
    perceurs: { unite: 170000, module: 200000000 }, //     Grenadiers
    herse: { unite: 200000, module: 3000000 }, //     Herse
    ratisseur: { unite: 250000, module: 40000000 }, //     Éclaireur
    creneau: { unite: 320000, module: 200000000 }, // Créneau
    belier: { unite: 940000, module: 14000000 }, //   Pionnier
    ronce: { unite: 2200000, module: 80000000 }, //   Ronce
    guetteur: { unite: 6200000, module: 1100000000 }, //   Voltigeurs
    batterie: { unite: 12300000, module: 450000000 }, //   Batterie
    carapace: { unite: 21000000, module: 150000000 }, //   Cuirassiers
    faucheuse: { unite: 48000000, module: 900000000 }, //  Faucheuse
    mortier: { unite: 120000000, module: 1400000000 }, //  Mortier
    harpon: { unite: 300000000, module: 2000000000 }, //   Harpon
    broyeur: { unite: 550000000, module: 2500000000 }, //  Percheron — AJOUT, arbitrage 6
  },
};

/** Les deux branches, dans l'ordre où l'écran les présente. */
export const BRANCHES = ['offense', 'defense'];

/**
 * L'onglet SPÉCIAL.
 *
 * ⚠⚠ LA PREMIÈRE LIGNE S'ACHÈTE DEPUIS BASES-1, ET ELLE SE RACHÈTE. Les TROIS
 * SOUTIENS, eux, n'ont toujours ni moteur ni prix : le classeur leur donne un
 * NIVEAU d'apparition (« vers niv 25 / 30 / 35 »), qui ne veut plus rien dire
 * depuis que la recherche seule ouvre les pièces. `cout: null` dit donc « le
 * classeur n'a pas retenu de prix », et l'écran n'affiche aucun nombre plutôt
 * qu'un zéro qui se lirait « gratuit ».
 *
 * ⚠⚠ `deuxiemeBase` A ÉTÉ RENOMMÉ `baseSupplementaire`, ET CE N'EST PAS DE LA
 * COSMÉTIQUE. La chaîne est OUVERTE — rang 2, rang 3, rang 4… — donc
 * « deuxième » devient FAUX au premier rachat. Un identifiant qui ment est
 * exactement ce que ce dépôt corrige à chaque lot.
 *
 * ⚠⚠ LE FACTEUR EST UNE FRACTION D'ENTIERS, PAS UN FLOTTANT, ET C'EST OBLIGÉ.
 * Le ×2,5 dicté par Ethan le 02/09 s'écrit 5 / 2 : les points de recherche sont
 * des `BigInt` en milli, et un `2.5` flottant élevé à une puissance perdrait de
 * la précision avant le rang 10, que la chaîne ouverte atteindra. `coutMilli`
 * multiplie par 5 puis divise par 2, rang par rang, sans jamais quitter les
 * entiers.
 *
 * ⚠ LE PRIX DE DÉPART EST CELUI DU RANG 2, ET IL N'A PAS BOUGÉ : 2 000 000, la
 * valeur qui était déjà là. C'est `premierRang` qui dit à quel rang il
 * s'applique — l'écrire 2 ailleurs ferait une seconde vérité.
 *
 * ⚠ LE ×2,5 EST PRIS SUR LA PAROLE D'ETHAN. Il cite un classeur
 * `fz recherche.xlsx` qui n'est PAS dans le dépôt ; §1 interdit de toute façon
 * de lire un `.xlsx` pour coder. Signalé au rapport du lot.
 */
export const SPECIAL = {
  baseSupplementaire: {
    cout: 2000000,
    libelle: 'Base supplémentaire',
    repetable: true,
    premierRang: 2,
    facteurNumerateur: 5,
    facteurDenominateur: 2,
  },
  soutienAntiVehicule: { cout: null, libelle: 'Soutien anti-véhicule' },
  soutienAntiAerien: { cout: null, libelle: 'Soutien anti-aérien' },
  soutienAntiInfanterie: { cout: null, libelle: 'Soutien anti-infanterie' },
};

/** L'identifiant du nœud répétable — nommé une fois, jamais retapé. */
export const NOEUD_BASE_SUPPLEMENTAIRE = 'baseSupplementaire';

/**
 * Les pièces gratuites d'une branche — celles dont l'unité coûte zéro.
 *
 * ⚠ UN COÛT DE ZÉRO RESTE UN ACHAT ORDINAIRE, et c'est pour ça que cette
 * fonction existe plutôt qu'un cas particulier à la lecture. `creerAcquises`
 * de `sim/recherche.js` les pose UNE FOIS, à la création de la partie ; partout
 * ailleurs, « acquise » se lit dans l'état, jamais dans le prix.
 *
 * @param {string} branche 'offense' ou 'defense'
 * @returns {string[]} identifiants, dans l'ordre de la table
 */
export function gratuitesDe(branche) {
  const table = ARBRE_RECHERCHE[branche];
  if (table === undefined) throw new RangeError(`recherche : branche inconnue « ${branche} »`);
  return Object.keys(table).filter((id) => table[id].unite === 0);
}
