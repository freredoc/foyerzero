// ---------------------------------------------------------------------------
// LES TÉMOINS DU LOT BASES-0 — capturés le 02/09/2026 sur `main` à 9d7d711,
// AVANT que le dépliage de l'état n'ait touché une seule ligne.
//
// ⚠⚠ CE FICHIER N'EST PAS UN TEST, C'EST SA RÉFÉRENCE. Il est nommé dans la
// liste blanche de `documentation.test.js`, comme `png-rgba.js` et
// `prereglages-lot3a.js`, et pour la même raison : une aide de test partagée
// entre dans `test/` par son nom, avec sa raison, et rien d'autre n'y passe.
//
// ⚠⚠ ILS SE CAPTURENT AVANT, JAMAIS APRÈS. Capturés après le dépliage, ils
// décriraient le bogue au lieu de l'attraper. Le scénario qui les rejoue vit
// dans `bases.test.js` ; ce fichier-ci ne porte que les nombres attendus.
//
// ⚠ DEUX AXES, ET C'EST CE QUI REND UN ÉCHEC LISIBLE. `EMPREINTES_PAR_CHAMP`
// dit QUEL CHAMP a bougé et à quelle phase ; `EMPREINTES_PAR_GRAINE` dit SUR
// QUELLE GRAINE. Une empreinte globale unique dirait « ça a changé » et
// laisserait chercher dans 1,5 Mo de relevés.
//
// ⚠ ILS NE SE RAFRAÎCHISSENT PAS. Une empreinte qui ne tombe plus juste après
// un dépliage veut dire que le dépliage a changé le JEU, ce que le lot BASES-0
// s'interdit. Le geste correct est de corriger le code, jamais le témoin.
// Le jour où un lot changera légitimement un comportement, il recapturera les
// témoins EN L'ÉCRIVANT, et dira lesquels bougent et pourquoi.
// ---------------------------------------------------------------------------

/**
 * Ce que le lot BASES-0 déplace, et RIEN D'AUTRE — les deux seules valeurs qui
 * changent entre la capture et aujourd'hui, chacune asserté séparément.
 *
 * ⚠⚠ ELLES NE SONT PAS EXEMPTÉES DU TÉMOIN, ELLES Y SONT MESURÉES. `version`
 * est recalculée en substituant 22 à la version courante : si l'empreinte
 * retombe juste, c'est que le NOMBRE seul a bougé, uniformément sur les
 * vingt-cinq graines et les quatorze phases. Et la sauvegarde grandit d'un
 * nombre FIXE d'octets — `{"bases":[…],"baseCourante":0}` autour de onze champs
 * qui ne changent pas —, jamais d'un nombre qui dépendrait de la partie.
 * Exempter un champ, ce serait retirer une assertion sans le dire.
 */
export const VERSION_AU_TEMOIN = 22;
export const OCTETS_AJOUTES_PAR_LE_DEPLIAGE = 29;

/** Les vingt-cinq graines jouées. Le brief en demandait vingt au moins. */
export const GRAINES = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25];

/**
 * Les quatorze phases du scénario, dans l'ordre où elles sont jouées.
 *
 * ⚠ LA DOUZIÈME ET LA TREIZIÈME SONT LE CŒUR DU TÉMOIN. `p12_veilleDuRaid`
 * amène la partie à une minute d'un raid de l'Ouvrage, et `p13_apresLeRaid` le
 * traverse : c'est le seul endroit où `rattraperJeu` et `tickJeu` peuvent
 * diverger, la segmentation posée par RAID-B ne se jouant qu'à un raid.
 */
export const PHASES = [
  "p01_batir",
  "p02_6h",
  "p03_batiComplet",
  "p04_arme",
  "p05_18h",
  "p06_relu",
  "p07_raidProcheApres",
  "p08_100ticks",
  "p09_deplace",
  "p10_montee",
  "p11_raidOuvrageApres",
  "p12_veilleDuRaid",
  "p13_apresLeRaid",
  "p14_sousLeFeu"
];

/** Les vingt-deux champs relevés — onze globaux, onze par base. */
export const CHAMPS = [
  "version",
  "graine",
  "nbTicks",
  "rngEtat",
  "tutoriel",
  "recherche",
  "sitesEntames",
  "basesRasees",
  "poisAcquis",
  "attaque",
  "rapports",
  "position",
  "fondation",
  "champs",
  "obstacles",
  "disposition",
  "garnison",
  "armee",
  "economie",
  "satellites",
  "reserveReparation",
  "dernierDeplacementTick"
];

/** Empreinte, par phase et par champ, sur les vingt-cinq graines à la fois. */
export const EMPREINTES_PAR_CHAMP = {
  "p01_batir": {
    "version": "8176684893daf87f",
    "graine": "f067ebd04374a9b9",
    "nbTicks": "04829b2b26efdf02",
    "rngEtat": "ad4104ca6ad262c9",
    "tutoriel": "e9f9279cc65ffd77",
    "recherche": "6649fab052c10634",
    "sitesEntames": "0aa0523454020975",
    "basesRasees": "9f6db10be605c9c3",
    "poisAcquis": "9f6db10be605c9c3",
    "attaque": "3c6332c2adcd788e",
    "rapports": "9f6db10be605c9c3",
    "position": "dd99546dbd4aa2ed",
    "fondation": "dd99546dbd4aa2ed",
    "champs": "dcbe3af511ef4bfd",
    "obstacles": "d51790dbda5611e4",
    "disposition": "dab28116ea9f3d83",
    "garnison": "9f6db10be605c9c3",
    "armee": "9f6db10be605c9c3",
    "economie": "5c84946b43980d41",
    "satellites": "4f9de466a7ee5901",
    "reserveReparation": "97ea6d991d6d5486",
    "dernierDeplacementTick": "b511506c601e2d2e"
  },
  "p02_6h": {
    "version": "8176684893daf87f",
    "graine": "f067ebd04374a9b9",
    "nbTicks": "2e4a3fac28dc958a",
    "rngEtat": "ad4104ca6ad262c9",
    "tutoriel": "e9f9279cc65ffd77",
    "recherche": "6649fab052c10634",
    "sitesEntames": "0aa0523454020975",
    "basesRasees": "9f6db10be605c9c3",
    "poisAcquis": "9f6db10be605c9c3",
    "attaque": "3c6332c2adcd788e",
    "rapports": "9f6db10be605c9c3",
    "position": "dd99546dbd4aa2ed",
    "fondation": "dd99546dbd4aa2ed",
    "champs": "dcbe3af511ef4bfd",
    "obstacles": "d51790dbda5611e4",
    "disposition": "dab28116ea9f3d83",
    "garnison": "9f6db10be605c9c3",
    "armee": "9f6db10be605c9c3",
    "economie": "f892394f78aa9fef",
    "satellites": "2361ee27f48583e8",
    "reserveReparation": "7e9b0068807b32bd",
    "dernierDeplacementTick": "b511506c601e2d2e"
  },
  "p03_batiComplet": {
    "version": "8176684893daf87f",
    "graine": "f067ebd04374a9b9",
    "nbTicks": "2bbc989b57853cbb",
    "rngEtat": "ad4104ca6ad262c9",
    "tutoriel": "e9f9279cc65ffd77",
    "recherche": "6649fab052c10634",
    "sitesEntames": "0aa0523454020975",
    "basesRasees": "9f6db10be605c9c3",
    "poisAcquis": "9f6db10be605c9c3",
    "attaque": "3c6332c2adcd788e",
    "rapports": "9f6db10be605c9c3",
    "position": "dd99546dbd4aa2ed",
    "fondation": "dd99546dbd4aa2ed",
    "champs": "dcbe3af511ef4bfd",
    "obstacles": "d51790dbda5611e4",
    "disposition": "2141b1b62eb8457f",
    "garnison": "9f6db10be605c9c3",
    "armee": "9f6db10be605c9c3",
    "economie": "4c7fd3b24b702023",
    "satellites": "c6ae297c59375534",
    "reserveReparation": "3849ad3e503f55f3",
    "dernierDeplacementTick": "b511506c601e2d2e"
  },
  "p04_arme": {
    "version": "8176684893daf87f",
    "graine": "f067ebd04374a9b9",
    "nbTicks": "2bbc989b57853cbb",
    "rngEtat": "ad4104ca6ad262c9",
    "tutoriel": "e9f9279cc65ffd77",
    "recherche": "6649fab052c10634",
    "sitesEntames": "0aa0523454020975",
    "basesRasees": "9f6db10be605c9c3",
    "poisAcquis": "9f6db10be605c9c3",
    "attaque": "3c6332c2adcd788e",
    "rapports": "9f6db10be605c9c3",
    "position": "dd99546dbd4aa2ed",
    "fondation": "dd99546dbd4aa2ed",
    "champs": "dcbe3af511ef4bfd",
    "obstacles": "d51790dbda5611e4",
    "disposition": "2141b1b62eb8457f",
    "garnison": "7456cbabd46b5bc5",
    "armee": "7615237910472a44",
    "economie": "4c7fd3b24b702023",
    "satellites": "c6ae297c59375534",
    "reserveReparation": "3849ad3e503f55f3",
    "dernierDeplacementTick": "b511506c601e2d2e"
  },
  "p05_18h": {
    "version": "8176684893daf87f",
    "graine": "f067ebd04374a9b9",
    "nbTicks": "aa47b17d48053617",
    "rngEtat": "ad4104ca6ad262c9",
    "tutoriel": "e9f9279cc65ffd77",
    "recherche": "6649fab052c10634",
    "sitesEntames": "0aa0523454020975",
    "basesRasees": "9f6db10be605c9c3",
    "poisAcquis": "9f6db10be605c9c3",
    "attaque": "e5d0f3a021d73b05",
    "rapports": "9f6db10be605c9c3",
    "position": "dd99546dbd4aa2ed",
    "fondation": "dd99546dbd4aa2ed",
    "champs": "dcbe3af511ef4bfd",
    "obstacles": "d51790dbda5611e4",
    "disposition": "2141b1b62eb8457f",
    "garnison": "7456cbabd46b5bc5",
    "armee": "7615237910472a44",
    "economie": "4c7fd3b24b702023",
    "satellites": "db053f9f7b239566",
    "reserveReparation": "fd21f4fa7d1978eb",
    "dernierDeplacementTick": "b511506c601e2d2e"
  },
  "p06_relu": {
    "version": "8176684893daf87f",
    "graine": "f067ebd04374a9b9",
    "nbTicks": "aa47b17d48053617",
    "rngEtat": "ad4104ca6ad262c9",
    "tutoriel": "e9f9279cc65ffd77",
    "recherche": "6649fab052c10634",
    "sitesEntames": "0aa0523454020975",
    "basesRasees": "9f6db10be605c9c3",
    "poisAcquis": "9f6db10be605c9c3",
    "attaque": "e5d0f3a021d73b05",
    "rapports": "9f6db10be605c9c3",
    "position": "dd99546dbd4aa2ed",
    "fondation": "dd99546dbd4aa2ed",
    "champs": "dcbe3af511ef4bfd",
    "obstacles": "d51790dbda5611e4",
    "disposition": "2141b1b62eb8457f",
    "garnison": "7456cbabd46b5bc5",
    "armee": "7615237910472a44",
    "economie": "4c7fd3b24b702023",
    "satellites": "db053f9f7b239566",
    "reserveReparation": "fd21f4fa7d1978eb",
    "dernierDeplacementTick": "b511506c601e2d2e"
  },
  "p07_raidProcheApres": {
    "version": "8176684893daf87f",
    "graine": "f067ebd04374a9b9",
    "nbTicks": "aa47b17d48053617",
    "rngEtat": "ad4104ca6ad262c9",
    "tutoriel": "e9f9279cc65ffd77",
    "recherche": "5311813ea19c3a19",
    "sitesEntames": "7693786e9f92b269",
    "basesRasees": "9f6db10be605c9c3",
    "poisAcquis": "9f6db10be605c9c3",
    "attaque": "8da35fecdf8c4cb2",
    "rapports": "60107eb2f58f956e",
    "position": "dd99546dbd4aa2ed",
    "fondation": "dd99546dbd4aa2ed",
    "champs": "dcbe3af511ef4bfd",
    "obstacles": "d51790dbda5611e4",
    "disposition": "2141b1b62eb8457f",
    "garnison": "7456cbabd46b5bc5",
    "armee": "cd7b72e4937913e4",
    "economie": "4c7fd3b24b702023",
    "satellites": "1fd2bd649b62c7f2",
    "reserveReparation": "fd21f4fa7d1978eb",
    "dernierDeplacementTick": "b511506c601e2d2e"
  },
  "p08_100ticks": {
    "version": "8176684893daf87f",
    "graine": "f067ebd04374a9b9",
    "nbTicks": "88734c7236d3f28c",
    "rngEtat": "ad4104ca6ad262c9",
    "tutoriel": "e9f9279cc65ffd77",
    "recherche": "5311813ea19c3a19",
    "sitesEntames": "7693786e9f92b269",
    "basesRasees": "9f6db10be605c9c3",
    "poisAcquis": "9f6db10be605c9c3",
    "attaque": "078b23200c79c546",
    "rapports": "60107eb2f58f956e",
    "position": "dd99546dbd4aa2ed",
    "fondation": "dd99546dbd4aa2ed",
    "champs": "dcbe3af511ef4bfd",
    "obstacles": "d51790dbda5611e4",
    "disposition": "2141b1b62eb8457f",
    "garnison": "7456cbabd46b5bc5",
    "armee": "cd7b72e4937913e4",
    "economie": "0eb04f66cd7caef6",
    "satellites": "1fd2bd649b62c7f2",
    "reserveReparation": "a4accd53c31b0854",
    "dernierDeplacementTick": "b511506c601e2d2e"
  },
  "p09_deplace": {
    "version": "8176684893daf87f",
    "graine": "f067ebd04374a9b9",
    "nbTicks": "88734c7236d3f28c",
    "rngEtat": "ad4104ca6ad262c9",
    "tutoriel": "e9f9279cc65ffd77",
    "recherche": "5311813ea19c3a19",
    "sitesEntames": "7693786e9f92b269",
    "basesRasees": "9f6db10be605c9c3",
    "poisAcquis": "9f6db10be605c9c3",
    "attaque": "078b23200c79c546",
    "rapports": "60107eb2f58f956e",
    "position": "e3026687b3beb559",
    "fondation": "dd99546dbd4aa2ed",
    "champs": "dcbe3af511ef4bfd",
    "obstacles": "d51790dbda5611e4",
    "disposition": "2141b1b62eb8457f",
    "garnison": "7456cbabd46b5bc5",
    "armee": "cd7b72e4937913e4",
    "economie": "0eb04f66cd7caef6",
    "satellites": "1fd2bd649b62c7f2",
    "reserveReparation": "a4accd53c31b0854",
    "dernierDeplacementTick": "88734c7236d3f28c"
  },
  "p10_montee": {
    "version": "8176684893daf87f",
    "graine": "f067ebd04374a9b9",
    "nbTicks": "88734c7236d3f28c",
    "rngEtat": "ad4104ca6ad262c9",
    "tutoriel": "e9f9279cc65ffd77",
    "recherche": "5311813ea19c3a19",
    "sitesEntames": "7693786e9f92b269",
    "basesRasees": "9f6db10be605c9c3",
    "poisAcquis": "cb50a3f0c8ff9731",
    "attaque": "078b23200c79c546",
    "rapports": "60107eb2f58f956e",
    "position": "9997b04bf27564c4",
    "fondation": "dd99546dbd4aa2ed",
    "champs": "dcbe3af511ef4bfd",
    "obstacles": "d51790dbda5611e4",
    "disposition": "2141b1b62eb8457f",
    "garnison": "7456cbabd46b5bc5",
    "armee": "cd7b72e4937913e4",
    "economie": "0eb04f66cd7caef6",
    "satellites": "1fd2bd649b62c7f2",
    "reserveReparation": "a4accd53c31b0854",
    "dernierDeplacementTick": "88734c7236d3f28c"
  },
  "p11_raidOuvrageApres": {
    "version": "8176684893daf87f",
    "graine": "f067ebd04374a9b9",
    "nbTicks": "88734c7236d3f28c",
    "rngEtat": "ad4104ca6ad262c9",
    "tutoriel": "e9f9279cc65ffd77",
    "recherche": "9902725948644596",
    "sitesEntames": "8b1a75f3269ed34f",
    "basesRasees": "9f6db10be605c9c3",
    "poisAcquis": "cb50a3f0c8ff9731",
    "attaque": "75a9ef6e0b328c72",
    "rapports": "74f632675e73fe1f",
    "position": "9997b04bf27564c4",
    "fondation": "dd99546dbd4aa2ed",
    "champs": "dcbe3af511ef4bfd",
    "obstacles": "d51790dbda5611e4",
    "disposition": "2141b1b62eb8457f",
    "garnison": "7456cbabd46b5bc5",
    "armee": "420dc8a133208ae8",
    "economie": "0eb04f66cd7caef6",
    "satellites": "1fd2bd649b62c7f2",
    "reserveReparation": "a4accd53c31b0854",
    "dernierDeplacementTick": "88734c7236d3f28c"
  },
  "p12_veilleDuRaid": {
    "version": "8176684893daf87f",
    "graine": "f067ebd04374a9b9",
    "nbTicks": "7278022092bb3750",
    "rngEtat": "ad4104ca6ad262c9",
    "tutoriel": "e9f9279cc65ffd77",
    "recherche": "9902725948644596",
    "sitesEntames": "3f6d23065df432d2",
    "basesRasees": "9f6db10be605c9c3",
    "poisAcquis": "cb50a3f0c8ff9731",
    "attaque": "dda8331e719bdd6f",
    "rapports": "74f632675e73fe1f",
    "position": "9997b04bf27564c4",
    "fondation": "dd99546dbd4aa2ed",
    "champs": "dcbe3af511ef4bfd",
    "obstacles": "d51790dbda5611e4",
    "disposition": "2141b1b62eb8457f",
    "garnison": "7456cbabd46b5bc5",
    "armee": "420dc8a133208ae8",
    "economie": "0eb04f66cd7caef6",
    "satellites": "aed1512770a52479",
    "reserveReparation": "d0f7711e8ebf06e9",
    "dernierDeplacementTick": "88734c7236d3f28c"
  },
  "p13_apresLeRaid": {
    "version": "8176684893daf87f",
    "graine": "f067ebd04374a9b9",
    "nbTicks": "a46790c07c4e2296",
    "rngEtat": "ad4104ca6ad262c9",
    "tutoriel": "e9f9279cc65ffd77",
    "recherche": "9902725948644596",
    "sitesEntames": "53031a4ef211581b",
    "basesRasees": "9f6db10be605c9c3",
    "poisAcquis": "cf4ee56ad95ac92d",
    "attaque": "98524f0c81ac515d",
    "rapports": "f8e0d5f58100e55e",
    "position": "f64d8a62c83a38a5",
    "fondation": "dd99546dbd4aa2ed",
    "champs": "dcbe3af511ef4bfd",
    "obstacles": "d51790dbda5611e4",
    "disposition": "6a9ddf6192319774",
    "garnison": "e94e866c716f8c79",
    "armee": "420dc8a133208ae8",
    "economie": "743d0c6a207f291c",
    "satellites": "c0b4d0e1f939d9ea",
    "reserveReparation": "7b9aa131b8115208",
    "dernierDeplacementTick": "88734c7236d3f28c"
  },
  "p14_sousLeFeu": {
    "version": "8176684893daf87f",
    "graine": "f067ebd04374a9b9",
    "nbTicks": "7abb0b7bcd2f04fc",
    "rngEtat": "ad4104ca6ad262c9",
    "tutoriel": "e9f9279cc65ffd77",
    "recherche": "9902725948644596",
    "sitesEntames": "7693786e9f92b269",
    "basesRasees": "9f6db10be605c9c3",
    "poisAcquis": "c9fa3bddb98eb0f2",
    "attaque": "e5d0f3a021d73b05",
    "rapports": "e37aade894f13841",
    "position": "6abe7a4fb72db92b",
    "fondation": "dd99546dbd4aa2ed",
    "champs": "dcbe3af511ef4bfd",
    "obstacles": "d51790dbda5611e4",
    "disposition": "cd04c547ecce793e",
    "garnison": "e94e866c716f8c79",
    "armee": "420dc8a133208ae8",
    "economie": "0f1e77fee827ce91",
    "satellites": "a323616809865d13",
    "reserveReparation": "435f3c9631e5f066",
    "dernierDeplacementTick": "88734c7236d3f28c"
  }
};

/** Empreinte, par graine, sur toutes les phases et tous les champs à la fois. */
export const EMPREINTES_PAR_GRAINE = {
  "1": "a12e344136189df7",
  "2": "2bf727aba75b5ffe",
  "3": "5d89cb764d9d3a94",
  "4": "98cb868260e10412",
  "5": "2e70bc046488c948",
  "6": "6e95cf44a1d9d7d2",
  "7": "93720a27607aefe8",
  "8": "22a81600f643bf71",
  "9": "faf75da8c03cd66d",
  "10": "0943357b3819cb06",
  "11": "b06df22dc3630c69",
  "12": "27cc6a588bf0272a",
  "13": "14d0dcf34693d21a",
  "14": "453634d59cd464e3",
  "15": "35b8877c348f1769",
  "16": "7469947aae68ae16",
  "17": "c74dd1a64846e040",
  "18": "a374106cf7610372",
  "19": "85c4ac6d1debb99b",
  "20": "10337da3a04c891b",
  "21": "da624ce60343dc43",
  "22": "7703af63b54d4cd1",
  "23": "e0257db2c62a3079",
  "24": "636e5693b9156309",
  "25": "cabde66fb14c066e"
};

/**
 * Ce qui se lit en clair — un écart s'y explique tout seul.
 *
 * ⚠ `deuxCheminsIdentiques` VAUT `true` SUR LES VINGT-CINQ, et
 * `fenetreCouvreUnRaid` aussi : sans le second, le premier serait vrai pour
 * rien. C'est la falsification de ce témoin-là, écrite dans le témoin.
 */
export const SCALAIRES = {
  "1": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2991,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 35,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "294,17:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "516e46e08882ce41"
    },
    "raidOuvrage": {
      "nbCibles": 35,
      "cible": "201,15:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "96f8a4f7e0c02191"
    }
  },
  "2": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2991,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 35,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "295,17:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "610f21b3a525d935"
    },
    "raidOuvrage": {
      "nbCibles": 35,
      "cible": "200,17:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "5c1df3ec05c3d2c2"
    }
  },
  "3": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2991,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 34,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "294,16:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "89623852b8f57516"
    },
    "raidOuvrage": {
      "nbCibles": 34,
      "cible": "202,16:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "fd958331447421f4"
    }
  },
  "4": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2991,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 36,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "294,16:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "58173efda61ae684"
    },
    "raidOuvrage": {
      "nbCibles": 36,
      "cible": "198,15:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "57f4d7d533e2a1f4"
    }
  },
  "5": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2991,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 37,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "294,16:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "1629661c9d36755e"
    },
    "raidOuvrage": {
      "nbCibles": 37,
      "cible": "201,15:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "672865345b6f5956"
    }
  },
  "6": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2991,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 35,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "294,15:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "97327469318d3803"
    },
    "raidOuvrage": {
      "nbCibles": 35,
      "cible": "199,16:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "70106acd552d7909"
    }
  },
  "7": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2991,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 39,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "296,15:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "be34adbbc6f53b9d"
    },
    "raidOuvrage": {
      "nbCibles": 39,
      "cible": "199,16:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "1e522c24f767a3ce"
    }
  },
  "8": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2991,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 32,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "294,17:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "882ff313b9bdde34"
    },
    "raidOuvrage": {
      "nbCibles": 32,
      "cible": "201,15:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "4975fcb60963480d"
    }
  },
  "9": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2991,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 32,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "295,17:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "9bee76be221cee5b"
    },
    "raidOuvrage": {
      "nbCibles": 32,
      "cible": "199,16:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "f27775a08872da19"
    }
  },
  "10": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2993,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 38,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "296,15:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "513cc542fc4a529b"
    },
    "raidOuvrage": {
      "nbCibles": 38,
      "cible": "200,17:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "0b4d13b8e5fbd9c4"
    }
  },
  "11": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2993,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 31,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "294,16:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "562f65a10e492d4b"
    },
    "raidOuvrage": {
      "nbCibles": 31,
      "cible": "200,18:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "665c7b96c6c9929b"
    }
  },
  "12": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2993,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 35,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "295,15:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "71b70d7ed77b4347"
    },
    "raidOuvrage": {
      "nbCibles": 35,
      "cible": "200,15:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "4a94c5c52ed988d1"
    }
  },
  "13": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2993,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 35,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "294,16:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "b9e2cccd4ebdab18"
    },
    "raidOuvrage": {
      "nbCibles": 35,
      "cible": "201,17:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "5daba79958507794"
    }
  },
  "14": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2993,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 29,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "295,15:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "c2e8b9fd82ecc1e5"
    },
    "raidOuvrage": {
      "nbCibles": 29,
      "cible": "200,14:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "1489354d46e915fa"
    }
  },
  "15": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2993,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 41,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "296,17:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "126d015437926d43"
    },
    "raidOuvrage": {
      "nbCibles": 41,
      "cible": "198,17:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "22e70280ef2c6236"
    }
  },
  "16": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2993,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 41,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "295,17:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "4420047c11bd8791"
    },
    "raidOuvrage": {
      "nbCibles": 41,
      "cible": "199,14:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "a2f27f969ae78a7b"
    }
  },
  "17": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2993,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 31,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "296,16:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "3221893ada5dd516"
    },
    "raidOuvrage": {
      "nbCibles": 31,
      "cible": "200,15:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "35da2e07c9622c33"
    }
  },
  "18": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2993,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 33,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "295,15:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "7b6d2f7fde196ff9"
    },
    "raidOuvrage": {
      "nbCibles": 33,
      "cible": "200,15:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "ebf1e645203bbe49"
    }
  },
  "19": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2993,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 37,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "294,16:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "961eb1f367d567cb"
    },
    "raidOuvrage": {
      "nbCibles": 37,
      "cible": "200,18:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "38159fe20f7e9a92"
    }
  },
  "20": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2993,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 35,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "294,16:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "2b7a02a50fa4ee40"
    },
    "raidOuvrage": {
      "nbCibles": 35,
      "cible": "199,17:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "c64e00b1a9010106"
    }
  },
  "21": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2993,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 39,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "296,17:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "5389e84e23ea7111"
    },
    "raidOuvrage": {
      "nbCibles": 39,
      "cible": "199,15:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "a4938577da51d1f3"
    }
  },
  "22": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2993,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 37,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "294,17:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "33569a2a894dd5b6"
    },
    "raidOuvrage": {
      "nbCibles": 37,
      "cible": "200,14:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "61f11975e0d506be"
    }
  },
  "23": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2993,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 34,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "294,16:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "df39f391af4eccbe"
    },
    "raidOuvrage": {
      "nbCibles": 34,
      "cible": "200,14:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "340c80cb0f52ec03"
    }
  },
  "24": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2993,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 39,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "294,16:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "c6269f470ee17914"
    },
    "raidOuvrage": {
      "nbCibles": 39,
      "cible": "200,18:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "962ff33fd2154717"
    }
  },
  "25": {
    "gestes": "chantier→3 | collecteur@12,2 | collecteur@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
    "gestesArmer": "gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle@v3,4 | arm meute@v4,6",
    "tailleSauvegarde": 2993,
    "nbCasesAtteignables": 261,
    "deplacement": "294,8",
    "nbAttaquantes": 37,
    "fenetreCouvreUnRaid": true,
    "deuxCheminsIdentiques": true,
    "raidProche": {
      "nbCibles": 3,
      "cible": "294,17:camp:n1",
      "neFuitPas": true,
      "exact": true,
      "rapport": "25a49f884b7cc2d8"
    },
    "raidOuvrage": {
      "nbCibles": 37,
      "cible": "200,17:base:n20",
      "neFuitPas": true,
      "exact": true,
      "rapport": "275b6a66298f8919"
    }
  }
};

// ---------------------------------------------------------------------------
// CE QUE LE LOT BASES-1 A LÉGITIMEMENT DÉPLACÉ — 02/09/2026
// ---------------------------------------------------------------------------
//
// ⚠⚠ LES TÉMOINS NE SE RAFRAÎCHISSENT PAS EN BLOC, ET C'EST CE QUI LES GARDE
// UTILES. L'en-tête l'écrit : « le jour où un lot changera légitimement un
// comportement, il recapturera les témoins EN L'ÉCRIVANT, et dira lesquels
// bougent et pourquoi ». Le lot BASES-1 a fait passer la zone d'influence du
// CARRÉ au DISQUE — des deux côtés à la fois, le barème du raid et la carte —,
// donc le prix de certains raids monte. Plutôt que de tout recapturer, les
// couples (phase, champ) qui bougent sont NOMMÉS ici, avec leur valeur neuve.
// Les 301 autres restent gardés contre la capture d'origine, celle de `main`
// à 9d7d711.
//
// ⚠ SEPT COUPLES SUR 308, DEUX CHAMPS, ET AUCUN AVANT LA PHASE 11. `attaque`
// bouge parce que le raid coûte plus cher ; `rapports` parce que le rapport
// porte ce coût. Rien d'autre : ni le terrain, ni l'économie, ni les satellites,
// ni la disposition. Le raid sur un SATELLITE, lui, ne bouge pas d'un point —
// il est adjacent, donc dans le disque comme dans le carré.
export const DEPLACES_PAR_BASES_1 = {
  "p11_raidOuvrageApres": {
    "attaque": "02aad94eb33c103d",
    "rapports": "8ba577d2b27b8695"
  },
  "p12_veilleDuRaid": {
    "attaque": "ddf0096caf4e98c4",
    "rapports": "8ba577d2b27b8695"
  },
  "p13_apresLeRaid": {
    "attaque": "d179b746c7fa85cf",
    "rapports": "9f114364cb72e0d2"
  },
  "p14_sousLeFeu": {
    "rapports": "88b120c2cedcf676"
  }
};


/**
 * Les empreintes du champ que BASES-1 AJOUTE au relevé.
 *
 * ⚠ ELLES SONT NEUVES, DONC ELLES NE GARDENT RIEN DE PASSÉ — et c'est la seule
 * chose qu'on puisse dire d'elles. Ce qu'elles garderont, c'est l'avenir : le
 * compteur global ne recule jamais, et le jour où une base neuve le remettrait
 * à 1, ces quatorze empreintes tomberaient.
 */
export const EMPREINTES_DES_CHAMPS_AJOUTES = {
  "p01_batir": {
    "prochaineInstanceSatellite": "9c7061c2f4b13c0c",
    "basesAutorisees": "9c7061c2f4b13c0c",
    "satellitesDetruits": "f46a0f0f9f1961b8"
  },
  "p02_6h": {
    "prochaineInstanceSatellite": "d4cb6ebd662c97d4",
    "basesAutorisees": "9c7061c2f4b13c0c",
    "satellitesDetruits": "f46a0f0f9f1961b8"
  },
  "p03_batiComplet": {
    "prochaineInstanceSatellite": "e13a479c58886c75",
    "basesAutorisees": "9c7061c2f4b13c0c",
    "satellitesDetruits": "f46a0f0f9f1961b8"
  },
  "p04_arme": {
    "prochaineInstanceSatellite": "e13a479c58886c75",
    "basesAutorisees": "9c7061c2f4b13c0c",
    "satellitesDetruits": "f46a0f0f9f1961b8"
  },
  "p05_18h": {
    "prochaineInstanceSatellite": "6909d921c42a6a0f",
    "basesAutorisees": "9c7061c2f4b13c0c",
    "satellitesDetruits": "f46a0f0f9f1961b8"
  },
  "p06_relu": {
    "prochaineInstanceSatellite": "6909d921c42a6a0f",
    "basesAutorisees": "9c7061c2f4b13c0c",
    "satellitesDetruits": "f46a0f0f9f1961b8"
  },
  "p07_raidProcheApres": {
    "prochaineInstanceSatellite": "6909d921c42a6a0f",
    "basesAutorisees": "9c7061c2f4b13c0c",
    "satellitesDetruits": "198d07ef61659620"
  },
  "p08_100ticks": {
    "prochaineInstanceSatellite": "6909d921c42a6a0f",
    "basesAutorisees": "9c7061c2f4b13c0c",
    "satellitesDetruits": "198d07ef61659620"
  },
  "p09_deplace": {
    "prochaineInstanceSatellite": "6909d921c42a6a0f",
    "basesAutorisees": "9c7061c2f4b13c0c",
    "satellitesDetruits": "198d07ef61659620"
  },
  "p10_montee": {
    "prochaineInstanceSatellite": "6909d921c42a6a0f",
    "basesAutorisees": "9c7061c2f4b13c0c",
    "satellitesDetruits": "198d07ef61659620"
  },
  "p11_raidOuvrageApres": {
    "prochaineInstanceSatellite": "6909d921c42a6a0f",
    "basesAutorisees": "9c7061c2f4b13c0c",
    "satellitesDetruits": "198d07ef61659620"
  },
  "p12_veilleDuRaid": {
    "prochaineInstanceSatellite": "fec5ed056908e055",
    "basesAutorisees": "9c7061c2f4b13c0c",
    "satellitesDetruits": "198d07ef61659620"
  },
  "p13_apresLeRaid": {
    "prochaineInstanceSatellite": "ddce3857a01d535f",
    "basesAutorisees": "9c7061c2f4b13c0c",
    "satellitesDetruits": "198d07ef61659620"
  },
  "p14_sousLeFeu": {
    "prochaineInstanceSatellite": "19a48b2c9ac675da",
    "basesAutorisees": "9c7061c2f4b13c0c",
    "satellitesDetruits": "198d07ef61659620"
  }
};

/**
 * Ce que BASES-1 ajoute à la sauvegarde, en octets.
 *
 * ⚠ SOIXANTE-SEIZE OCTETS, LES MÊMES SUR LES VINGT-CINQ GRAINES, et c'est cette
 * uniformité qui compte : un écart qui dépendrait de la partie voudrait dire
 * qu'un CONTENU a bougé, et pas seulement une enveloppe. Trois champs entrent —
 * `prochaineInstanceSatellite` (qui remplace le `prochaineInstance` sorti de la
 * base), `recherche.basesAutorisees` et `satellitesDetruits`.
 */
export const OCTETS_AJOUTES_PAR_BASES_1 = 76;

/**
 * Les empreintes par graine, RECALCULÉES au lot BASES-1.
 *
 * ⚠ CELLES-CI NE POUVAIENT PAS ÊTRE SURCHARGÉES COUPLE PAR COUPLE : elles
 * agrègent les quatorze phases et les vingt-trois champs à la fois, donc les
 * trois champs déplacés ou ajoutés les font toutes bouger. C'est l'axe PAR
 * CHAMP, plus haut, qui garde la finesse ; celui-ci ne dit plus que « telle
 * graine a divergé ».
 */
export const EMPREINTES_PAR_GRAINE_BASES_1 = {
  "1": "0a6a81135a86ed5b",
  "2": "ce82ec9fad29e16b",
  "3": "1dcee7090b7518f0",
  "4": "0447b1db5b424f1b",
  "5": "69a960b03b0f57d7",
  "6": "a066cfcdc33f3bf5",
  "7": "095930dfa6082329",
  "8": "0e2bfc2446ea3a17",
  "9": "13891d93a836fc41",
  "10": "63f2b62d08ec792d",
  "11": "085049ef5b040b9c",
  "12": "285a66423f095726",
  "13": "426f4e562c386bf5",
  "14": "d0bbeb5c206e8353",
  "15": "8dd3830b38502fcb",
  "16": "676b201e0f2555be",
  "17": "383a07734037aaf0",
  "18": "2b47ab898bac8996",
  "19": "7c3820e266abb925",
  "20": "c6ee47766b8f5a8f",
  "21": "f0f4607d3340148b",
  "22": "ed5589669e64e83d",
  "23": "018f48b02737922f",
  "24": "f42bbc5bfe008f3f",
  "25": "55b7d78907cfeaf5"
};

/**
 * Les rapports de raid sur une base de l'Ouvrage qui ont changé de prix.
 *
 * ⚠ TROIS GRAINES SUR VINGT-CINQ, ET C'EST LA MESURE M1 VUE DE PRÈS : sur 150
 * graines et 5 161 cibles, 3,33 % des raids renchérissent. Ici c'est 3 sur 25,
 * soit 12 % — la cible du témoin est la PLUS PROCHE, donc plus souvent dans la
 * zone d'influence que la moyenne des cibles à portée. Les vingt-deux autres
 * graines gardent leur empreinte d'origine.
 */
export const RAPPORTS_DEPLACES_PAR_BASES_1 = {
  "4": "0086a152b0a6da63",
  "15": "87232e590d358040",
  "16": "df3c20dc390e833c"
};

/**
 * Le champ que BASES-1 AJOUTE au relevé.
 *
 * ⚠⚠ IL S'AJOUTE, IL NE REMPLACE RIEN. Le compteur d'instance des satellites a
 * quitté la base pour l'état — une seconde base qui repartirait de l'instance 1
 * rejouerait les graines d'apparition de la première. Le relever ici est ce qui
 * fait qu'un compteur remis à zéro, un jour, fera tomber le témoin ; ne pas le
 * relever l'aurait laissé sortir de la garde en silence.
 */
export const CHAMPS_AJOUTES_PAR_BASES_1 = [
  'prochaineInstanceSatellite', 'basesAutorisees', 'satellitesDetruits',
];
