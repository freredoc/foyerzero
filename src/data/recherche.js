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
    // ⚠ 100 POINTS, ET C'EST UN ARBITRAGE D'ETHAN DU 06/09 — « recherche à
    // 100 points », branche OFFENSE seulement. Le Pionnier valait 12 500. Sa
    // ligne de DÉFENSE (940 000) et les deux modules ne bougent pas : ce sont
    // quatre nombres distincts, et un seul a été arbitré.
    // ⚠ ET IL RESTE À SA PLACE. L'ordre d'affichage suit `Object.keys` et
    // l'arbitrage du 30/08 le dit libre ; le Bélier est déjà quatrième, après
    // les trois gratuites et avant les Grenadiers à 200 000, donc la table se
    // lit encore par prix croissants sans qu'on déplace une ligne.
    belier: { unite: 100, module: 80000000 }, //      Pionnier — arbitrage du 06/09
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
 * ⚠⚠ LES QUATRE LIGNES S'ACHÈTENT DEPUIS LE LOT ARTILLERIE-RECHERCHE, ET LA
 * PREMIÈRE SEULE SE RACHÈTE. Les trois soutiens ont porté `cout: null` du lot
 * RECHERCHE au 23/09 : le classeur ne leur donnait qu'un NIVEAU d'apparition
 * (« vers niv 25 / 30 / 35 »), qui ne veut plus rien dire depuis que la
 * recherche seule ouvre les pièces. Ils portent trois prix arbitrés par Ethan,
 * et chacun OUVRE un bâtiment d'artillerie — voir `ouvre` ci-dessous.
 *
 * ⚠⚠ LES TROIS PRIX SONT L'ÉCHELLE DU DÉPÔT, PAS CELLE DU DOCUMENT, ET LE
 * FACTEUR EST MESURÉ. `ARBRE-RECHERCHE.md` §3.5 propose 40 000 / 90 000 /
 * 200 000 ⟨proposé⟩ ; ses nombres sont sur l'ANCIENNE échelle de points, celle
 * d'avant le lot ÉCHELLE-RECHERCHE. Mesuré sur les TREIZE lignes de défense que
 * le document et `ARBRE_RECHERCHE` nomment toutes deux, le rapport
 * code / document va de **×29,1 à ×337,5, médiane ×37,9** — et les trois prix
 * retenus tombent à **×37,5 · ×38,9 · ×37,5**, c'est-à-dire sur cette médiane.
 *
 * ⚠ LA FOURCHETTE S'OUVRE PAR LE BAS, ET IL FAUT LE SAVOIR AVANT DE LA CITER.
 * Les trois lignes les moins chères du document — Chasseur 400, Grenadiers 900,
 * Herse 2 100 — rendent ×337,5, ×188,9 et ×95,2 : le plancher du dépôt est à
 * 135 000 là où le document part de 400. Sur les NEUF lignes au-dessus de
 * 11 000 points, le rapport se resserre à **×29,1..×45,9, médiane ×35,3**.
 * C'est cette moitié-là qui porte l'analogie ; l'autre dit que l'échelle du
 * document n'est pas affine.
 *
 * ⚠⚠ ET LE DOCUMENT NE FAIT PAS AUTORITÉ SUR UN PRIX DE CETTE TABLE — SA
 * PREMIÈRE LIGNE LE PROUVE. Le même §3.5 écrit « Deuxième base 500 000 » quand
 * `baseSupplementaire` porte **2 000 000** depuis l'arbitrage du 02/09. Un prix
 * de `SPECIAL` se lit ici, jamais là-bas : le document est de la matière
 * première, le dépôt est la décision.
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
  // ⚠⚠ `ouvre` PORTE L'IDENTIFIANT DU BÂTIMENT, ET IL EST SUR LE NŒUD. Une
  // seconde table `soutien → bâtiment` serait la seconde vérité que §4 interdit,
  // et elle mentirait au premier renommage. La lecture inverse — « quel soutien
  // ouvre ce bâtiment » — est une BOUCLE sur cette table, jamais un index :
  // trois entrées, et un index serait la même seconde vérité rangée autrement.
  //
  // ⚠ `baseSupplementaire` N'EN A PAS, ET CE N'EST PAS UN OUBLI : il n'ouvre
  // aucun bâtiment, il ouvre un RANG. Lui donner un `ouvre: null` inviterait à
  // le traiter comme les trois autres ; l'absence de la clé dit qu'il n'est pas
  // de la même espèce, et un test l'exige.
  soutienAntiVehicule: {
    cout: 7500000,
    libelle: 'Soutien anti-véhicule',
    ouvre: 'artillerieAntiVehicule',
  },
  soutienAntiAerien: {
    cout: 3500000,
    libelle: 'Soutien anti-aérien',
    ouvre: 'artillerieAntiAerien',
  },
  soutienAntiInfanterie: {
    cout: 1500000,
    libelle: 'Soutien anti-infanterie',
    ouvre: 'artillerieAntiInfanterie',
  },
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
