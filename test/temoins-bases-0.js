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

/**
 * Les couples que le lot TRANSFERT a légitimement déplacés.
 *
 * ⚠⚠ QUINZE COUPLES, ET PAS UN DE PLUS — sur les 322 que le témoin garde. Deux
 * champs bougent, à partir de la phase 7, qui est le PREMIER RAID :
 *   — `rapports`, parce que le rapport de raid a perdu `butinPerdu` ;
 *   — `economie`, parce que le butin ne se plafonne plus et passe au-dessus.
 * Les deux sont exactement ce que le lot fait ; tout le reste — position,
 * fondation, champs, obstacles, disposition, garnison, armée, satellites,
 * recherche, tutoriel, POI, sites entamés — garde l'empreinte d'AVANT.
 *
 * ⚠ `economie` NE BOUGE PAS EN PHASE 14, ET C'EST MESURÉ, PAS UNE LACUNE. La
 * phase 14 joue vingt-quatre heures sous le feu de l'Ouvrage : la base y est
 * rasée TROIS fois — position 220 → 280, soit trois bonds de vingt cases —, et
 * un rasage met les stocks à ZÉRO. Les vingt-quatre heures qui suivent saturent
 * la base à sa capacité — 118 000 milli, la même sur les vingt-cinq graines —,
 * quoi qu'un butin ait pu y verser avant. `rapports`, lui, bouge encore : la
 * liste des dix derniers rapports garde la trace du raid.
 */
export const DEPLACES_PAR_TRANSFERT = {
  "p07_raidProcheApres": {
    "rapports": "d0bddd5be6511ad8",
    "economie": "3899b0b65f03b24d"
  },
  "p08_100ticks": {
    "rapports": "d0bddd5be6511ad8",
    "economie": "e185681daffeb193"
  },
  "p09_deplace": {
    "rapports": "d0bddd5be6511ad8",
    "economie": "e185681daffeb193"
  },
  "p10_montee": {
    "rapports": "d0bddd5be6511ad8",
    "economie": "e185681daffeb193"
  },
  "p11_raidOuvrageApres": {
    "rapports": "058fb7727f0ab0f6",
    "economie": "e185681daffeb193"
  },
  "p12_veilleDuRaid": {
    "rapports": "058fb7727f0ab0f6",
    "economie": "e185681daffeb193"
  },
  "p13_apresLeRaid": {
    "rapports": "ae6c10a3cc7acc8d",
    "economie": "9e48132e15e41325"
  },
  "p14_sousLeFeu": {
    "rapports": "0b20cb72605e1d60"
  }
};

/**
 * Ce que TRANSFERT ajoute à la sauvegarde, en octets : **ZÉRO**.
 *
 * ⚠⚠ ET C'EST UNE EXIGENCE DU BRIEF, PAS UN CONSTAT AGRÉABLE. Son §2.8 pose que
 * le transfert est INSTANTANÉ — aucun champ persistant — et que `SAVE_VERSION`
 * ne bouge pas. Un écart non nul ici voudrait dire qu'un état a été ajouté sans
 * qu'on s'en aperçoive. La mesure est prise en phase 5, avant tout raid : elle
 * porte donc sur la FORME de la sauvegarde, pas sur son contenu.
 */
export const OCTETS_AJOUTES_PAR_TRANSFERT = 0;

/**
 * Les empreintes par graine, RECALCULÉES au lot TRANSFERT.
 *
 * ⚠ ELLES AGRÈGENT LES QUATORZE PHASES ET LES VINGT-TROIS CHAMPS À LA FOIS,
 * donc les deux champs déplacés les font toutes bouger. C'est l'axe PAR CHAMP
 * qui garde la finesse ; celui-ci ne dit plus que « telle graine a divergé ».
 */
export const EMPREINTES_PAR_GRAINE_TRANSFERT = {
  "1": "67257bbff17d7fe0",
  "2": "976f33f3e10219cb",
  "3": "ba807857eb80fabf",
  "4": "eda6bf0f5bccbb19",
  "5": "0edeb6f80e0b0c48",
  "6": "835571778a712729",
  "7": "aeca68df31ca2515",
  "8": "19515ba115e08c3b",
  "9": "235089ec485e7953",
  "10": "33bff12de99e11c4",
  "11": "6d9adefedfa3144b",
  "12": "31753fb0b328ade2",
  "13": "4e953cdcfc59bef7",
  "14": "185ed2f8f2a80af5",
  "15": "6b9bbf0c8cddd66b",
  "16": "68380cc8db66f171",
  "17": "a05646d907d507d2",
  "18": "e8e1e5fdb74c3177",
  "19": "3211ab13543cc488",
  "20": "5946b3533422bf4c",
  "21": "925ffd0d7675951b",
  "22": "544f3dab82b93043",
  "23": "f8300c68492349fe",
  "24": "cbff442e7571bbe5",
  "25": "88c32de83704a3ce"
};

/**
 * Les empreintes des DEUX rapports de raid, recalculées au lot TRANSFERT.
 *
 * ⚠⚠ LES CINQUANTE BOUGENT, ET C'EST POURQUOI LE TEST NE SE CONTENTE PAS
 * D'ELLES. Un rapport qui perd une clé change d'empreinte quoi qu'il arrive :
 * ces cinquante valeurs ne prouveraient donc RIEN sur ce qui reste. Le test
 * asserte à côté, et structurellement, que la seule clé partie est
 * `butinPerdu` — c'est cette assertion-là qui porte la preuve ; celles-ci ne
 * gardent que l'avenir.
 */
export const RAPPORTS_TRANSFERT = {
  "1": {
    "raidProcheRapport": "f97175f268e34469",
    "raidOuvrageRapport": "8153b480b0220d44"
  },
  "2": {
    "raidProcheRapport": "e93508dd441ceb55",
    "raidOuvrageRapport": "d28fda74fac6930c"
  },
  "3": {
    "raidProcheRapport": "adbbe64e94ddc206",
    "raidOuvrageRapport": "9c5b00c511279969"
  },
  "4": {
    "raidProcheRapport": "67219e4be7bd9b5c",
    "raidOuvrageRapport": "2d789bc6bc595924"
  },
  "5": {
    "raidProcheRapport": "bb48a9a369a6b8a8",
    "raidOuvrageRapport": "9c9ee2e79a5b196e"
  },
  "6": {
    "raidProcheRapport": "9880de268408ba80",
    "raidOuvrageRapport": "436e44a615513b47"
  },
  "7": {
    "raidProcheRapport": "e11dda119125735c",
    "raidOuvrageRapport": "70b14d91a2ac7d90"
  },
  "8": {
    "raidProcheRapport": "8b16fe966d45b463",
    "raidOuvrageRapport": "decbf4769fc7ae63"
  },
  "9": {
    "raidProcheRapport": "860ad0e6cca13862",
    "raidOuvrageRapport": "793fb6a4f3953d44"
  },
  "10": {
    "raidProcheRapport": "8b8cd643b96ab9d0",
    "raidOuvrageRapport": "3d4524c05a1b8cc3"
  },
  "11": {
    "raidProcheRapport": "66245565b596a64f",
    "raidOuvrageRapport": "6bda311d4b766619"
  },
  "12": {
    "raidProcheRapport": "657ab24a60807e67",
    "raidOuvrageRapport": "4e8722e38e439a62"
  },
  "13": {
    "raidProcheRapport": "f4f51a62b53080db",
    "raidOuvrageRapport": "3ddb45067867576e"
  },
  "14": {
    "raidProcheRapport": "4f63a5fa3536b6ea",
    "raidOuvrageRapport": "ca9b469ba661cc83"
  },
  "15": {
    "raidProcheRapport": "5ec4e69eb479cf27",
    "raidOuvrageRapport": "234fe0262f9332a1"
  },
  "16": {
    "raidProcheRapport": "def5f032c4642449",
    "raidOuvrageRapport": "b54c8cad87ef37c8"
  },
  "17": {
    "raidProcheRapport": "9153b628a759c59e",
    "raidOuvrageRapport": "68abfd0bbdd0d9e4"
  },
  "18": {
    "raidProcheRapport": "9beb94c19abcc4b0",
    "raidOuvrageRapport": "5cbb435339e7cc8c"
  },
  "19": {
    "raidProcheRapport": "7086daafeceeb36b",
    "raidOuvrageRapport": "09275f44a365fa3a"
  },
  "20": {
    "raidProcheRapport": "3c3ddc06bdff00c9",
    "raidOuvrageRapport": "aa6162730ab07dd5"
  },
  "21": {
    "raidProcheRapport": "9814b50503c6643d",
    "raidOuvrageRapport": "b94bd4b606500867"
  },
  "22": {
    "raidProcheRapport": "feea326c6c4d5d86",
    "raidOuvrageRapport": "087430e68044002f"
  },
  "23": {
    "raidProcheRapport": "803fc8d6038bd74f",
    "raidOuvrageRapport": "b79b2bfd3e6bdb83"
  },
  "24": {
    "raidProcheRapport": "542fb4e0e5d65e18",
    "raidOuvrageRapport": "8299391115f94b60"
  },
  "25": {
    "raidProcheRapport": "6691615a1a8943a7",
    "raidOuvrageRapport": "e005af147f522c5c"
  }
};

/**
 * Les clés que les DEUX rapports de raid portaient AVANT le lot TRANSFERT.
 *
 * ⚠⚠ RELEVÉES SUR `origin/main`, DANS UN ARBRE DÉTACHÉ, PAS RECONSTRUITES DEPUIS
 * LE CODE D'APRÈS. Un « avant » qu'on dérive de l'« après » ne prouve rien : il
 * dirait toujours ce qu'on veut lui faire dire. Elles servent à asserter
 * STRUCTURELLEMENT que la seule clé partie est `butinPerdu` — là où une
 * empreinte ne dirait que « ça a bougé ».
 *
 * ⚠⚠ LES DEUX SONT DES RAIDS DU JOUEUR, ET LE NOM TROMPE. `raidProche` vise le
 * satellite le plus proche, `raidOuvrage` une BASE de l'Ouvrage : les deux
 * passent par `executerRaid`, donc les deux portaient `butinPerdu`. Le rapport
 * de DÉFENSE — celui que `subirUnRaid` produit quand l'Ouvrage vient — n'est pas
 * dans ce témoin-ci, et il n'a jamais porté `butinPerdu` : l'Ouvrage ne pille
 * pas.
 */
export const CLES_DU_RAPPORT_AVANT_TRANSFERT = [
  'butin', 'butinPerdu', 'cause', 'cible', 'cout', 'pointsRestants', 'rase',
  'rechercheMilli', 'reparationInduite', 'restantBatiments', 'restantDefense',
  'restantEtai', 'restantSouche', 'sens', 'ticks', 'unitesAuPlancher',
  'unitesEngagees', 'verdict',
];

/**
 * Les CINQ chemins des rapports de raid que le lot TRANSFERT déplace, et les
 * seuls — mesurés en rejouant `origin/main` et HEAD côte à côte sur cinq
 * graines, puis comparés champ par champ, en profondeur.
 *
 * ⚠⚠ C'EST CETTE LISTE QUI PORTE LA PREUVE, PAS LES CINQUANTE EMPREINTES. Elle
 * dit que rien d'autre n'a bougé dans un rapport de raid — ni le verdict, ni les
 * quatre pourcentages, ni la recherche, ni le coût, ni les unités engagées.
 *
 * ⚠ `defense.sanction.perdu` EST LA CONSÉQUENCE LA MOINS ÉVIDENTE DU LOT, et
 * elle est juste : un rasage détruit les ressources STOCKÉES, et le butin peut
 * désormais les porter au-dessus du plafond. La sanction détruit donc davantage.
 * Ce n'est pas une perte de plus : c'est la même règle appliquée à un stock plus
 * gros.
 */
export const CHEMINS_DEPLACES_PAR_TRANSFERT = [
  'defense.sanction.perdu.quartz',
  'defense.sanction.perdu.scorie',
  'offense.butin.quartz',
  'offense.butin.scorie',
  'offense.butinPerdu',
];

// ---------------------------------------------------------------------------
// Ce que le lot RETOURS-DU-03 a légitimement déplacé (03/09/2026)
// ---------------------------------------------------------------------------
//
// ⚠⚠ TROIS RETOURS D'ETHAN, ET DEUX D'ENTRE EUX CHANGENT LA CARTE DE CHAQUE
// GRAINE. « le territoire doit avoir 8 cases de plus, dans les angles » fait
// passer les zones d'influence du disque à un OCTOGONE ; « on davantage remplir
// le monde avec des bases ouvrage » fait passer la densité de 16 à 25 bases par
// 12 × 12. Le témoin ne se rafraîchit pas en bloc : le lot NOMME ce qui bouge,
// et laisse le reste gardé contre la référence d'avant.
//
// ⚠⚠ CE BLOC A ÉTÉ RELEVÉ DEUX FOIS LE MÊME JOUR, ET LA SECONDE EST LA BONNE.
// La première densité passait par un desserrage du voisinage — quatre voisines
// orthogonales au lieu de huit, donc deux bases pouvant se toucher par un coin ;
// Ethan l'a refusé de face (« je suis sûr à 100 % qu'on n'est pas obligé de
// mettre des bases en diagonale »), et la densité se prend désormais en
// REPOSANT des bases tour après tour, sous l'exclusion des huit. Le bloc portait
// alors 37 couples ; il en porte 41.
//
// ⚠⚠ QUARANTE ET UN COUPLES SUR 322, ET PAS UN DE PLUS — mesuré, pas estimé, et
// RECONSTRUIT plutôt que complété : le relevé compare à la chaîne des lots
// PRÉCÉDENTS, si bien qu'un couple revenu à sa valeur d'avant sort du bloc au
// lieu d'y rester déclaré à tort. Ils commencent tous à la phase 10 : les neuf
// premières phases — la construction de la base, son économie, sa garnison, son
// armée, ET LE PREMIER RAID sur un camp — sont identiques au bit. C'est ce
// qu'on attendait : un camp est de l'HISTOIRE, pas du tirage de carte, et la
// garde du peuplement tient les bases de l'Ouvrage à quinze cases du départ.
//
// ⚠ ET L'ATTRIBUTION EST MESURÉE, ELLE AUSSI. En remettant la seule densité
// d'avant — `toursDePeuplement: 1` et `probabiliteCandidate: 0,35`, ce qui EST
// exactement l'ancienne règle —, il n'en reste que **QUATORZE** : ce sont ceux
// de l'octogone seul — `poisAcquis` dès la phase 10, `attaque` et `rapports`
// dès la 11. Les vingt-sept autres sont ceux de la densité.
//
// ⚠ `armee` EST NEUF DANS CE BLOC, et il l'est pour une raison simple : une
// carte plus dense fait tomber plus de raids de l'Ouvrage sur la base, donc les
// pièces du joueur portent des dégâts qu'elles ne portaient pas.
//
// ⚠⚠ `poisAcquis` BOUGE DÈS LA PHASE 10, ET C'EST LA CONSÉQUENCE LA MOINS
// ÉVIDENTE DU LOT. `releverLesPoisAcquis` peignait un CARRÉ plein de 25 cases
// sans le moindre test de forme — un défaut qui a survécu à EUCLIDE et à
// BASES-1, tous deux venus corriger ce genre-là. Un POI dans un angle rogné
// était donc ACQUIS alors que ni la carte ne montre cette case comme alliée, ni
// le barème du raid ne la facture ainsi. Il ne l'est plus.
export const DEPLACES_PAR_RETOURS_DU_03 = {
  p10_montee: {
    poisAcquis: 'f51f723705b28284',
  },
  p11_raidOuvrageApres: {
    armee: 'b5abaf0d49e37199',
    attaque: 'f4984906437e1949',
    poisAcquis: 'f51f723705b28284',
    rapports: 'f7db46a003307315',
    recherche: 'd7b29a19f572d6df',
    sitesEntames: 'b6f842a99d990a49',
  },
  p12_veilleDuRaid: {
    armee: 'b5abaf0d49e37199',
    attaque: '9a6263a1378391cd',
    nbTicks: '59be8728ad8cf682',
    poisAcquis: 'f51f723705b28284',
    prochaineInstanceSatellite: '3d85eb1bd0a2bb26',
    rapports: 'f7db46a003307315',
    recherche: 'd7b29a19f572d6df',
    reserveReparation: '69f55699f8500abe',
    satellites: '25e41174b0c0934d',
    sitesEntames: '300589c2c9f9569f',
  },
  p13_apresLeRaid: {
    armee: 'b5abaf0d49e37199',
    attaque: '0279ba1afb6e04c8',
    disposition: '139a36a763d9a4ec',
    economie: '0d4011bf1ab2628a',
    nbTicks: 'eec37c44ce083ee0',
    poisAcquis: '18c3cdc88cc178b5',
    position: 'b6eaca06c17caf12',
    prochaineInstanceSatellite: '2d308417886f84a8',
    rapports: '6ce20de0331b064d',
    recherche: 'd7b29a19f572d6df',
    reserveReparation: 'dd61791cde902003',
    satellites: '317120fef5a1e18d',
    sitesEntames: 'fdf9236d8de178f9',
  },
  p14_sousLeFeu: {
    armee: 'b5abaf0d49e37199',
    disposition: '12fc184bd9abfeee',
    economie: '376971834a676a70',
    nbTicks: '10d9cbd9aaf7fc94',
    poisAcquis: '039d47420403a00a',
    position: '6435e24ada18c7a0',
    prochaineInstanceSatellite: '4ab680b065ddae53',
    rapports: '285695f8d9626eda',
    recherche: 'd7b29a19f572d6df',
    reserveReparation: '43f35c1d537ce878',
    satellites: '47d3664d919165be',
  },
};

/** Les vingt-cinq empreintes par graine, après RETOURS-DU-03. */
export const EMPREINTES_PAR_GRAINE_RETOURS_DU_03 = {
  1: '79e2850e546a1100',
  2: '7e74f1b8f471ac86',
  3: '87a1a7d00473b6df',
  4: '8a3bd2ee877bd945',
  5: 'b4e6c4a1b859446e',
  6: '3af6376fc099298e',
  7: '5a4b1162a82424ce',
  8: '519250326ec0bc96',
  9: '08fbd4a1ca97a5be',
  10: '1b54c08917d84efc',
  11: '3d993fbaea6e7fee',
  12: 'd30e2e61fbf0fe98',
  13: '7765dee9af9cf558',
  14: '3ec6dd7428c7e9df',
  15: '3021c457698fcd5e',
  16: 'dabb11cf78c54666',
  17: '63304f174bccb66e',
  18: 'f7e2d1dcf9e03264',
  19: '4d5ce8cd59ee2c3e',
  20: '2f783ebd8711614b',
  21: '2e705b550a4a1e66',
  22: '4cea8436f0e83eec',
  23: '2affb15f2ec3654f',
  24: '9e5ee4c553b367a2',
  25: 'e26375953a7b3c93',
};

/**
 * Les quatre scalaires que RETOURS-DU-03 déplace, graine par graine.
 *
 * ⚠⚠ ET LES AUTRES NE BOUGENT PAS, CE QUI EST LA MOITIÉ QUI PROUVE. Les gestes
 * de construction, les gestes d'armement, la taille de la sauvegarde, les cases
 * atteignables, le déplacement et **tout le raid de proximité** (`raidProche`)
 * sont IDENTIQUES sur les vingt-cinq graines — vérifié champ par champ, zéro
 * écart. Le lot ne touche ni l'économie, ni la pose, ni la sauvegarde :
 * `SAVE_VERSION` ne bouge pas et l'état ne gagne aucun champ.
 *
 * ⚠ `nbAttaquantes` ET `raidOuvrageNbCibles` BOUGENT SUR LES VINGT-CINQ — ils
 * valent de 51 à 62, moyenne 56,0 —, la cible choisie change sur vingt-deux
 * graines et l'empreinte du rapport sur vingt-trois. C'est la signature d'une
 * carte plus dense : plus de bases à portée, plus de cibles, et une cible
 * retenue qui change dès qu'une nouvelle venue coûte moins cher.
 */
export const SCALAIRES_RETOURS_DU_03 = {
  1: {
    nbAttaquantes: 53,
    raidOuvrageNbCibles: 53,
    raidOuvrageCible: '201,15:base:n20',
    raidOuvrageRapport: '8153b480b0220d44',
  },
  2: {
    nbAttaquantes: 55,
    raidOuvrageNbCibles: 55,
    raidOuvrageCible: '201,16:base:n20',
    raidOuvrageRapport: 'ed3987b5a6f920a3',
  },
  3: {
    nbAttaquantes: 58,
    raidOuvrageNbCibles: 58,
    raidOuvrageCible: '200,15:base:n20',
    raidOuvrageRapport: '048cc005248bf1a5',
  },
  4: {
    nbAttaquantes: 57,
    raidOuvrageNbCibles: 57,
    raidOuvrageCible: '201,16:base:n20',
    raidOuvrageRapport: '0d51d27c6f9248e6',
  },
  5: {
    nbAttaquantes: 57,
    raidOuvrageNbCibles: 57,
    raidOuvrageCible: '199,16:base:n20',
    raidOuvrageRapport: '3e2cd51f045697dd',
  },
  6: {
    nbAttaquantes: 52,
    raidOuvrageNbCibles: 52,
    raidOuvrageCible: '199,16:base:n20',
    raidOuvrageRapport: '436e44a615513b47',
  },
  7: {
    nbAttaquantes: 58,
    raidOuvrageNbCibles: 58,
    raidOuvrageCible: '199,15:base:n20',
    raidOuvrageRapport: 'bd2333e1c192c974',
  },
  8: {
    nbAttaquantes: 56,
    raidOuvrageNbCibles: 56,
    raidOuvrageCible: '201,15:base:n20',
    raidOuvrageRapport: 'decbf4769fc7ae63',
  },
  9: {
    nbAttaquantes: 57,
    raidOuvrageNbCibles: 57,
    raidOuvrageCible: '199,16:base:n20',
    raidOuvrageRapport: '793fb6a4f3953d44',
  },
  10: {
    nbAttaquantes: 58,
    raidOuvrageNbCibles: 58,
    raidOuvrageCible: '200,17:base:n20',
    raidOuvrageRapport: '3d4524c05a1b8cc3',
  },
  11: {
    nbAttaquantes: 52,
    raidOuvrageNbCibles: 52,
    raidOuvrageCible: '199,16:base:n20',
    raidOuvrageRapport: '7d1cda57b48e32d3',
  },
  12: {
    nbAttaquantes: 51,
    raidOuvrageNbCibles: 51,
    raidOuvrageCible: '200,15:base:n20',
    raidOuvrageRapport: '4e8722e38e439a62',
  },
  13: {
    nbAttaquantes: 56,
    raidOuvrageNbCibles: 56,
    raidOuvrageCible: '198,16:base:n20',
    raidOuvrageRapport: '7e053a651e9d9697',
  },
  14: {
    nbAttaquantes: 55,
    raidOuvrageNbCibles: 55,
    raidOuvrageCible: '199,15:base:n20',
    raidOuvrageRapport: '6dfba7d89f0b7e94',
  },
  15: {
    nbAttaquantes: 56,
    raidOuvrageNbCibles: 56,
    raidOuvrageCible: '198,17:base:n20',
    raidOuvrageRapport: '41db38b2a8929ff7',
  },
  16: {
    nbAttaquantes: 55,
    raidOuvrageNbCibles: 55,
    raidOuvrageCible: '199,14:base:n20',
    raidOuvrageRapport: '2225dd621f085a10',
  },
  17: {
    nbAttaquantes: 59,
    raidOuvrageNbCibles: 59,
    raidOuvrageCible: '200,15:base:n20',
    raidOuvrageRapport: '68abfd0bbdd0d9e4',
  },
  18: {
    nbAttaquantes: 55,
    raidOuvrageNbCibles: 55,
    raidOuvrageCible: '200,15:base:n20',
    raidOuvrageRapport: '5cbb435339e7cc8c',
  },
  19: {
    nbAttaquantes: 53,
    raidOuvrageNbCibles: 53,
    raidOuvrageCible: '200,18:base:n20',
    raidOuvrageRapport: '09275f44a365fa3a',
  },
  20: {
    nbAttaquantes: 60,
    raidOuvrageNbCibles: 60,
    raidOuvrageCible: '199,17:base:n20',
    raidOuvrageRapport: 'aa6162730ab07dd5',
  },
  21: {
    nbAttaquantes: 57,
    raidOuvrageNbCibles: 57,
    raidOuvrageCible: '199,15:base:n20',
    raidOuvrageRapport: 'b94bd4b606500867',
  },
  22: {
    nbAttaquantes: 57,
    raidOuvrageNbCibles: 57,
    raidOuvrageCible: '200,14:base:n20',
    raidOuvrageRapport: '087430e68044002f',
  },
  23: {
    nbAttaquantes: 62,
    raidOuvrageNbCibles: 62,
    raidOuvrageCible: '199,16:base:n20',
    raidOuvrageRapport: '3c691fd10387edd6',
  },
  24: {
    nbAttaquantes: 56,
    raidOuvrageNbCibles: 56,
    raidOuvrageCible: '200,18:base:n20',
    raidOuvrageRapport: '8299391115f94b60',
  },
  25: {
    nbAttaquantes: 56,
    raidOuvrageNbCibles: 56,
    raidOuvrageCible: '200,17:base:n20',
    raidOuvrageRapport: 'e005af147f522c5c',
  },
};

// ---------------------------------------------------------------------------
// Ce que le lot RETOURS-DU-03-SOIR a légitimement déplacé (03/09/2026)
// ---------------------------------------------------------------------------
//
// ⚠⚠ UN SEUL DES QUATRE GESTES DU LOT TOUCHE LA SIMULATION, ET C'EST MESURÉ.
// Ethan, 03/09 au soir : « éparpille les poi. jamais 2 poi collé, au moins
// 4 cases d'écart ». Les trois autres — les murs qui descendent jusqu'en bas,
// les tuiles de sol sous la grille, les emblèmes de la carte — sont du DESSIN :
// ils ne peuvent rien déplacer ici, et le témoin le confirme en ne bougeant que
// sur ce qui descend du tirage des POI.
//
// ⚠⚠ L'ATTRIBUTION EST MESURÉE, PAS DÉDUITE. En retirant la SEULE ligne
// `troppresDUnPoiPose` du tirage — c'est-à-dire en remettant exactement l'état
// d'avant le lot —, `test/bases.test.js` repasse **30 pass / 0 fail**. Les
// vingt et un couples ci-dessous sont donc tous à l'espacement des POI, et rien
// d'autre du lot n'atteint le moteur.
//
// ⚠⚠ VINGT ET UN COUPLES SUR 350, ET RECONSTRUITS PLUTÔT QUE COMPLÉTÉS : le
// relevé compare à la chaîne des lots PRÉCÉDENTS, si bien qu'un couple revenu à
// sa valeur d'avant sort du bloc au lieu d'y rester déclaré à tort. Ils
// commencent tous à la phase 10, qui est celle où la base MONTE et acquiert ses
// premiers POI ; les neuf premières phases — construction, économie, garnison,
// armée, ET les deux premiers raids — sont identiques au bit.
//
// ⚠⚠ ET LA CHAÎNE SE LIT D'UN BOUT À L'AUTRE : les POI changent de case, donc
// `poisAcquis` change dès la phase 10, donc la MAJORATION DE PRODUCTION change,
// donc `economie` bouge aux phases 13 et 14, donc la sanction d'un rasage
// détruit d'autres montants, donc `rapports` bouge. `satellites` suit pour une
// raison distincte et écrite depuis le lot POI : un satellite ne se pose jamais
// SUR un POI, donc déplacer les POI déplace l'ensemble des cases libres.
//
// ⚠ `recherche` BOUGE PARCE QUE LE POINT DE RECHERCHE EST UN SOLDE, pas parce
// que l'arbre a changé : un raid dont le rapport diffère verse un nombre de
// points différent.
//
// ⚠ ET CE QUI NE BOUGE PAS EST LA MOITIÉ QUI PROUVE. Sur les vingt-cinq
// graines : gestes de construction, gestes d'armement, taille de la sauvegarde
// (`SAVE_VERSION` reste à 24), cases atteignables, déplacement, nombre de bases
// attaquantes, nombre de cibles du raid lointain, cible retenue, et TOUT le
// raid de proximité — zéro écart. Le seul scalaire déplacé est l'empreinte du
// rapport du raid lointain, sur DEUX graines.
export const DEPLACES_PAR_RETOURS_DU_03_SOIR = {
  p10_montee: {
    poisAcquis: '9ca9426ae26cf0c4',
  },
  p11_raidOuvrageApres: {
    poisAcquis: '9ca9426ae26cf0c4',
    rapports: '4c6c2dd9d961727b',
    recherche: 'e2697e7b101a719d',
    sitesEntames: '24dab6716c90af35',
  },
  p12_veilleDuRaid: {
    poisAcquis: '9ca9426ae26cf0c4',
    rapports: '4c6c2dd9d961727b',
    recherche: 'e2697e7b101a719d',
    satellites: '36ef899df3fa5073',
    sitesEntames: 'fcd0278adf5186dc',
  },
  p13_apresLeRaid: {
    economie: '2ccf059a785db913',
    poisAcquis: '7caf051c681f1f01',
    rapports: '660843e96ce8536a',
    recherche: 'e2697e7b101a719d',
    satellites: 'b2588dc4e00d6b8b',
    sitesEntames: '28809a4f76ccda89',
  },
  p14_sousLeFeu: {
    economie: 'c758a9365a8f4a4e',
    poisAcquis: '244a71b67c2a1377',
    rapports: '3231234195cd1078',
    recherche: 'e2697e7b101a719d',
    satellites: '7fa58d13504d743f',
  },
};

/**
 * Les vingt-cinq empreintes par graine, après RETOURS-DU-03-SOIR.
 *
 * ⚠ NEUF GRAINES SUR VINGT-CINQ SONT INCHANGÉES AU BIT — 1, 2, 3, 10, 11, 15,
 * 19, 20 et 22 —, et elles restent donc gardées contre la valeur d'avant. Un
 * témoin qu'on rafraîchit en bloc perdrait cette moitié-là.
 */
export const EMPREINTES_PAR_GRAINE_RETOURS_DU_03_SOIR = {
  1: '79e2850e546a1100',
  2: '7e74f1b8f471ac86',
  3: '87a1a7d00473b6df',
  4: '080f5dbbd1968e2e',
  5: 'ca9b0e28a4babfb9',
  6: 'b9275c2831aedba7',
  7: 'f636b96686fec5c8',
  8: '9b3e645efb2a2bca',
  9: '55207aa3f937ef62',
  10: '1b54c08917d84efc',
  11: '3d993fbaea6e7fee',
  12: 'aaabe94bb57ea1a4',
  13: 'd82665561de0cdeb',
  14: '982f829c8608fe41',
  15: '3021c457698fcd5e',
  16: '93c79e675c78925f',
  17: 'e39c42025eb8f5b9',
  18: 'b5344dfa95e25f95',
  19: '4d5ce8cd59ee2c3e',
  20: '2f783ebd8711614b',
  21: 'b096d12e417f68d0',
  22: '4cea8436f0e83eec',
  23: 'cd64290ddadd446e',
  24: '51de15ae1660987b',
  25: '7ba1080e99eb6bf4',
};

/**
 * Les DEUX empreintes de rapport que le lot déplace, et elles seules.
 *
 * ⚠⚠ DEUX GRAINES SUR VINGT-CINQ, ET C'EST TOUT CE QU'ON DÉCLARE. Le lot
 * précédent avait dû surcharger les vingt-cinq ; ici la cible du raid lointain
 * et son nombre de cibles ne bougent nulle part — c'est le CONTENU du rapport
 * qui diffère sur 4 et 6, la sanction d'un rasage détruisant d'autres stocks
 * quand la majoration des POI a changé. Les vingt-trois autres restent gardées
 * contre `SCALAIRES_RETOURS_DU_03`.
 */
export const RAPPORTS_RETOURS_DU_03_SOIR = {
  4: 'd5868617b03d6f9d',
  6: '2e063df951e09ccf',
};

/**
 * CE QUE LE LOT ARRÊT DÉPLACE — soixante et un couples, tous à partir de la
 * PHASE 7, qui est le premier raid.
 *
 * ⚠⚠ LES SIX PREMIÈRES PHASES SONT IDENTIQUES AU BIT — construction,
 * économie, garnison, armée, carte, satellites. La règle d ARRET ne touche
 * qu au COMBAT : elle ne déplace ni une base de la carte, ni un geste, ni un
 * stock. Ce qui bouge est ce qu un raid RAPPORTE et ce qu il LAISSE, et tout
 * ce qui en découle — recherche, sites entamés, rapports, armée abîmée,
 * économie, satellites rasés.
 *
 * ⚠ ET LES SCALAIRES NE BOUGENT PAS D UNE UNITE, mesuré graine par graine :
 * gestes, gestes d armement, taille de sauvegarde, cases atteignables,
 * déplacement, bases attaquantes, nombre de cibles et cible retenue des deux
 * raids. Seules les EMPREINTES DES DEUX RAPPORTS changent, et elles ont leur
 * propre surcharge.
 */
export const DEPLACES_PAR_ARRET = {
  p07_raidProcheApres: {
    armee: '4a41ded8b974bee8',
    economie: '163118f74eccce7e',
    rapports: 'dde31d88fe0d0fc9',
    recherche: 'eff73a8ebe69c8a7',
    satellites: '4fa89e2f9a64e16b',
    satellitesDetruits: 'e672203527869bf6',
    sitesEntames: '0d214e340ea2c72a',
  },
  p08_100ticks: {
    armee: '4a41ded8b974bee8',
    economie: '5e817c8c244c2a87',
    rapports: 'dde31d88fe0d0fc9',
    recherche: 'eff73a8ebe69c8a7',
    satellites: '4fa89e2f9a64e16b',
    satellitesDetruits: 'e672203527869bf6',
    sitesEntames: '0d214e340ea2c72a',
  },
  p09_deplace: {
    armee: '4a41ded8b974bee8',
    economie: '5e817c8c244c2a87',
    rapports: 'dde31d88fe0d0fc9',
    recherche: 'eff73a8ebe69c8a7',
    satellites: '4fa89e2f9a64e16b',
    satellitesDetruits: 'e672203527869bf6',
    sitesEntames: '0d214e340ea2c72a',
  },
  p10_montee: {
    armee: '4a41ded8b974bee8',
    economie: '5e817c8c244c2a87',
    rapports: 'dde31d88fe0d0fc9',
    recherche: 'eff73a8ebe69c8a7',
    satellites: '4fa89e2f9a64e16b',
    satellitesDetruits: 'e672203527869bf6',
    sitesEntames: '0d214e340ea2c72a',
  },
  p11_raidOuvrageApres: {
    armee: '420dc8a133208ae8',
    economie: '5e817c8c244c2a87',
    rapports: '71783c04c511c39e',
    recherche: 'e45f3387b4203208',
    satellites: '4fa89e2f9a64e16b',
    satellitesDetruits: 'e672203527869bf6',
    sitesEntames: 'cc4101fbee1eb6a4',
  },
  p12_veilleDuRaid: {
    armee: '420dc8a133208ae8',
    economie: '5e817c8c244c2a87',
    prochaineInstanceSatellite: '38b9ce7a2d1493b6',
    rapports: '71783c04c511c39e',
    recherche: 'e45f3387b4203208',
    satellites: '1894cfd8b1bda926',
    satellitesDetruits: 'e672203527869bf6',
    sitesEntames: '11513cb701c88087',
  },
  p13_apresLeRaid: {
    armee: '420dc8a133208ae8',
    disposition: 'a961c8a455ece27c',
    economie: 'ea78aeaf8f03cb5c',
    poisAcquis: 'a99c5d034c8bee47',
    position: 'd7cc92e6c85cc100',
    prochaineInstanceSatellite: 'a5ec24af81722767',
    rapports: 'f5b329fc0e8dcf69',
    recherche: 'e45f3387b4203208',
    satellites: 'ecb5fddaab57aa77',
    satellitesDetruits: 'e672203527869bf6',
    sitesEntames: '19a208d4bccc970a',
  },
  p14_sousLeFeu: {
    armee: '420dc8a133208ae8',
    prochaineInstanceSatellite: 'b687c10f429aba29',
    rapports: 'c0406b174949f0d2',
    recherche: 'e45f3387b4203208',
    satellites: '6e2257c8389f4dd4',
    satellitesDetruits: 'e672203527869bf6',
    sitesEntames: '0d214e340ea2c72a',
  },
};

/**
 * Les vingt-cinq empreintes par graine, après ARRÊT.
 *
 * ⚠ AUCUNE GRAINE N EST INCHANGÉE ICI, et c est attendu : chacune joue deux
 * raids dans le scénario, et un raid ne rend plus les mêmes PV. La preuve que
 * le lot ne touche pas au reste est dans les six premières phases, gardées
 * champ par champ ci-dessus.
 */
export const EMPREINTES_PAR_GRAINE_ARRET = {
  1: '2652e9eb3e46600f',
  2: '2fd8f2579fa8c420',
  3: 'a48607dcbd326455',
  4: 'ac6bfaee801f312c',
  5: '0c2616ac03512142',
  6: 'e8f87ee17316d6c2',
  7: '754feb407eda9677',
  8: '0cda4acf02b709f5',
  9: 'c41bdb38e2b49e4e',
  10: '83b86911f6f8ee9d',
  11: '3c4690e5a0000298',
  12: '024c2f3b10331958',
  13: 'df3e7fb8179df0f4',
  14: 'ff1c690c6dd58505',
  15: 'bf2d90c9e2c3dadf',
  16: 'f3210c9b78863476',
  17: 'f31d28de6b343f23',
  18: '3b7609dbf808eb3d',
  19: '794b15a7b4927bc1',
  20: 'ab91031122a52c26',
  21: '73d75d63b2431d2a',
  22: '3fb92fdf14587fbe',
  23: '94363f620d3438db',
  24: '9b5a5ab4091a2593',
  25: '399f8c7cebadece6',
};

/**
 * Les empreintes des DEUX rapports de raid, après ARRÊT.
 *
 * ⚠ VINGT-CINQ ET VINGT-DEUX. Le rapport du raid de proximité change sur les
 * vingt-cinq graines ; celui du raid de l Ouvrage sur vingt-deux — trois
 * graines rendent le même rapport qu avant, et elles restent gardées contre
 * la surcharge du lot précédent.
 */
export const RAPPORTS_PROCHE_ARRET = {
  1: '07adffe556fface2',
  2: 'cefd03a8c12b8b75',
  3: '464295d874aef776',
  4: '51ea822f56f2748c',
  5: '359976a2509d1969',
  6: 'ea045bdf91c6f181',
  7: 'ce9698814535573b',
  8: '595937cd8f71fd8c',
  9: 'c73ab1ce12ddd779',
  10: 'e76f189b97d832fc',
  11: 'fda3f4fddd094b8e',
  12: '29edc102dad59151',
  13: '2a49f61983029a6d',
  14: '6119f413bd76a461',
  15: '7f14f1a5f678b09a',
  16: '81eb8867d461aad4',
  17: 'e896c041beb6382c',
  18: '2cf118d3e8676209',
  19: 'ff1172896e6b66b1',
  20: '0514e39bcb6809a6',
  21: '00c296b6727d0370',
  22: 'bff5ee087f401ee6',
  23: '239a1341c23d4b41',
  24: 'd4460a0077278051',
  25: '8203f2391b398130',
};

export const RAPPORTS_OUVRAGE_ARRET = {
  1: '15238cc293645887',
  2: '0ce422fb16e666d5',
  3: '6a6e808ddd1e2052',
  4: '2a24bbc6be48cb4e',
  5: '1576345cbb95845f',
  6: '5d45ee8a35c37b06',
  8: 'c6c22559f46a6f8c',
  9: 'cc83977782b267b5',
  11: '5fd2a267c2902f52',
  12: '093cb6e5f8db1088',
  13: '521728d913b2fa12',
  14: 'eea27ebfde18792c',
  15: '8abee81249c45f9b',
  16: '2388bfa0e98d5b7f',
  18: 'f8ef8f08a2c31008',
  19: '04de2f4953f7067e',
  20: '7a3f42d9ef6482ef',
  21: '2f17344a8f4b88cd',
  22: 'ab30c9eec26c4bc6',
  23: 'efc4cac12a1f5f84',
  24: '1a03af9ee48b6a31',
  25: '1e4ea0e6625d6f0f',
};
