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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
    "gestes": "chantier→3 | collecteurQuartz@12,2 | collecteurScorie@12,5 | raffinerie@11,1 | chantier→4 | centraleElectrique: aucune case | centreDeCommandement@11,2 | qgDeDefense@11,4 | chantier→4 | caserne@11,6 | depotDeVehicules@11,8 | accumulateur@11,3",
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
 * Ce que RÉSERVE-BASE ajoute à la sauvegarde, en octets : **36**.
 *
 * ⚠ CE SONT LES TRENTE CARACTÈRES DE `,"reserveReparationBatiments":` ET LES SIX
 * CHIFFRES DE SA VALEUR. La mesure est prise en phase 5, après dix-huit heures
 * de jeu : les quatre réservoirs y sont à leur plafond, et celui des bâtiments
 * vaut un nombre à six chiffres sur les vingt-cinq graines.
 *
 * ⚠⚠ ET LE NOMBRE EST FIXE, C'EST CE QU'ON LUI DEMANDE. Un écart qui dépendrait
 * de la partie voudrait dire que la réserve des bâtiments diverge d'une graine à
 * l'autre — or son plafond ne dépend que du niveau des BÂTIMENTS, et le scénario
 * du témoin pose exactement les mêmes quatre bâtiments aux mêmes niveaux sur les
 * vingt-cinq. Le jour où il cesserait d'être fixe, ce serait un fait à
 * comprendre, pas un nombre à ajuster.
 */
export const OCTETS_AJOUTES_PAR_RESERVE_BASE = 36;

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

/**
 * Le lot RETOUR-DÉFENSES, 06/09 — HUIT COUPLES, TOUS SUR `sitesEntames`, ET PAS
 * UN DE PLUS.
 *
 * ⚠⚠ ET C'EST LA MESURE QUI DIT CE QUE LE LOT TOUCHE. Les défenses d'un site
 * reviennent désormais par un palier de 70 % suivi d'une rampe, détruites
 * comprises, et l'entrée porte la santé de l'Étai figée au raid : `sitesEntames`
 * change donc de contenu ET de forme à partir de la phase 7, qui est le premier
 * raid. Les six premières phases sont identiques AU BIT — la règle ne touche ni
 * la carte, ni un geste, ni un stock.
 *
 * ⚠⚠ ET `garnison` NE BOUGE PAS, CE QUI N'EST PAS UN OUBLI. Le scénario du
 * témoin construit des bâtiments et une ARMÉE ; il ne pose aucune pièce de
 * garnison, si bien que la moitié joueur de la règle n'a rien à toucher ici.
 * C'est `RETOUR-D T12` qui la mesure, sur une base qui en porte trois.
 *
 * ⚠ AUCUN SCALAIRE NE BOUGE, LA TAILLE DE LA SAUVEGARDE COMPRISE : elle se
 * prend en phase 6, avant le premier raid, donc `sitesEntames` y est vide et le
 * champ neuf n'y coûte rien. Aucun terme ne s'ajoute aux quatre existants.
 */
export const DEPLACES_PAR_RETOUR_DEFENSES = {
  p07_raidProcheApres: {
    sitesEntames: 'f9993d498680446d',
  },
  p08_100ticks: {
    sitesEntames: 'f9993d498680446d',
  },
  p09_deplace: {
    sitesEntames: 'f9993d498680446d',
  },
  p10_montee: {
    sitesEntames: 'f9993d498680446d',
  },
  p11_raidOuvrageApres: {
    sitesEntames: '695d2c4746814422',
  },
  p12_veilleDuRaid: {
    sitesEntames: '6b1861bb9e12878c',
  },
  p13_apresLeRaid: {
    sitesEntames: '5d7747eccc7c8d36',
  },
  p14_sousLeFeu: {
    sitesEntames: 'e4d1d69ef2ef52c1',
  },
};

/** L'empreinte de CHAQUE graine après le lot RETOUR-DÉFENSES, toutes phases mêlées. */
export const EMPREINTES_PAR_GRAINE_RETOUR_DEFENSES = {
  1: 'bfc7d97e62c3e9f8',
  2: 'a9e7cf77108a266c',
  3: 'ce8f86a4000bdf0e',
  4: '7aa2a6df185a79f4',
  5: '7f74e2ce9e76b72b',
  6: '75b62d2a6d41d733',
  7: '10bb692efc201b36',
  8: '476bd875d63edd60',
  9: 'ed33905e50a5169b',
  10: '21357f0e123bb863',
  11: 'c393bbda2f2f60b4',
  12: '1aab384373d9c3cf',
  13: 'b874a2b4386cac70',
  14: 'ef0dc81aab7457d1',
  15: 'ece9d335a604e78f',
  16: '8699946f1aab7a8d',
  17: '13a13b18e6dbf966',
  18: '81c868bb7b3e231c',
  19: '18a789a29c06b5b7',
  20: 'fe9d91485696cea0',
  21: '33d5b82cf224a795',
  22: 'dc57acd0a105ebf2',
  23: 'fa4de8a349e3bd83',
  24: '4e15685391f48e64',
  25: '313cfc55d9b569e1',
};

/**
 * Le lot COLONNE, 06/09 — CINQUANTE-CINQ COUPLES, TOUS À PARTIR DE LA PHASE 7,
 * ET PAS UN AVANT.
 *
 * ⚠⚠ ET C'EST LA MESURE QUI DIT CE QUE LE LOT TOUCHE : LE COMBAT, ET RIEN
 * D'AUTRE. La phase 7 est le premier raid ; les six premières sont identiques
 * AU BIT. Trois règles entrent — l'arrêt sur la colonne de prédilection, le
 * décalage latéral de la défense des deux camps, et une disposition de site qui
 * cesse d'être la même à chaque graine —, et les trois ne s'exercent que dans
 * une résolution de combat.
 *
 * ⚠⚠ SEPT SCALAIRES SONT IDENTIQUES SUR LES VINGT-CINQ GRAINES, ET C'EST CE QUI
 * L'ÉTABLIT : gestes de construction, gestes d'armement, TAILLE DE LA
 * SAUVEGARDE, cases atteignables, déplacement de la base, nombre de bases
 * attaquantes, nombre de cibles et cible retenue. Ils restent gardés contre les
 * captures d'AVANT ce lot, et aucun terme ne s'ajoute aux quatre existants.
 *
 * ⚠⚠ D'OÙ LA CONFIRMATION QUE `SAVE_VERSION` N'A PAS EU À BOUGER, ET ELLE EST
 * MESURÉE PLUTÔT QUE CRUE. Une entité de combat porte désormais `colonneMilli`
 * au lieu de `colonne` — mais une ENTITÉ n'est pas un état sauvegardé : elle
 * naît de `creerCombat` et meurt avec le montage. La sauvegarde ne grandit donc
 * pas d'un octet, sur les vingt-cinq graines, et l'assertion qui le dit n'a pas
 * été touchée.
 *
 * ⚠ ET LA CHAÎNE SE LIT D'UN BOUT À L'AUTRE : la disposition d'un site change,
 * donc ce qu'un raid y trouve, donc `sitesEntames` et `rapports` ; le butin
 * change, donc `economie` ; l'armée revient autrement abîmée, donc `armee` ; et
 * `recherche`, `satellites` et `satellitesDetruits` suivent ce que les raids
 * détruisent.
 */
export const DEPLACES_PAR_COLONNE = {
  p07_raidProcheApres: {
    recherche: '118aa44b08dd566b',
    sitesEntames: 'b1792a34f5592487',
    rapports: 'e1637d1b1e739615',
    armee: '0bb842b48f1417b1',
    economie: 'a72e440fbf981258',
    satellites: '4dedf188fb1ff661',
    satellitesDetruits: '309bf03ba9f4a29c',
  },
  p08_100ticks: {
    recherche: '118aa44b08dd566b',
    sitesEntames: 'b1792a34f5592487',
    rapports: 'e1637d1b1e739615',
    armee: '0bb842b48f1417b1',
    economie: '4b762ddff9453613',
    satellites: '4dedf188fb1ff661',
    satellitesDetruits: '309bf03ba9f4a29c',
  },
  p09_deplace: {
    recherche: '118aa44b08dd566b',
    sitesEntames: 'b1792a34f5592487',
    rapports: 'e1637d1b1e739615',
    armee: '0bb842b48f1417b1',
    economie: '4b762ddff9453613',
    satellites: '4dedf188fb1ff661',
    satellitesDetruits: '309bf03ba9f4a29c',
  },
  p10_montee: {
    recherche: '118aa44b08dd566b',
    sitesEntames: 'b1792a34f5592487',
    rapports: 'e1637d1b1e739615',
    armee: '0bb842b48f1417b1',
    economie: '4b762ddff9453613',
    satellites: '4dedf188fb1ff661',
    satellitesDetruits: '309bf03ba9f4a29c',
  },
  p11_raidOuvrageApres: {
    recherche: 'bf6d7ca4f0323b9f',
    sitesEntames: 'f4556d8a6e0e6627',
    rapports: '2eee8394619206e9',
    economie: '4b762ddff9453613',
    satellites: '4dedf188fb1ff661',
    satellitesDetruits: '309bf03ba9f4a29c',
  },
  p12_veilleDuRaid: {
    recherche: 'bf6d7ca4f0323b9f',
    sitesEntames: 'ad0bf67551f2f229',
    rapports: '2eee8394619206e9',
    economie: '4b762ddff9453613',
    satellites: 'ded1076ae3e18a01',
    prochaineInstanceSatellite: '2aea6cff861aee5b',
    satellitesDetruits: '309bf03ba9f4a29c',
  },
  p13_apresLeRaid: {
    recherche: 'bf6d7ca4f0323b9f',
    sitesEntames: 'b951009f4c0c5718',
    rapports: 'c64c1b82231a3a69',
    disposition: 'bca28b0a5b4eeff4',
    economie: 'c7daa052809f7229',
    satellites: 'a8d0090639d61817',
    prochaineInstanceSatellite: '1568ea968d4f56b2',
    satellitesDetruits: '309bf03ba9f4a29c',
  },
  p14_sousLeFeu: {
    recherche: 'bf6d7ca4f0323b9f',
    sitesEntames: '740cbeac75f856e9',
    rapports: '4aa5926a254ead2f',
    satellites: 'e1692c6f1c87371d',
    prochaineInstanceSatellite: '21b0b42797d8363c',
    satellitesDetruits: '309bf03ba9f4a29c',
  },
};

/** L'empreinte de CHAQUE graine après le lot COLONNE, toutes phases mêlées. */
export const EMPREINTES_PAR_GRAINE_COLONNE = {
  1: '5061b4379f82a010',
  2: '951ce218c438bce0',
  3: 'aad3e20ccf163fcb',
  4: '61bdf9bdebd2fe6d',
  5: 'c658a434362c0f85',
  6: 'a7362aa7e4005cad',
  7: '920154575db0ac3b',
  8: '22ad4a2c47db6a6b',
  9: 'fcd57aaf9189dc78',
  10: '31d74e14694b6d70',
  11: '45431567169034bc',
  12: '0620791e19193f32',
  13: '04ffb7d2616bd6dd',
  14: '554d9c2d7d80e6b6',
  15: '26daa29ec07369ea',
  16: 'dc1d5d265ce8ded8',
  17: 'e1a8cd763a77be55',
  18: '9ae8619dbd9519f8',
  19: '324b1d6664107b18',
  20: '2c862918c2a30f9f',
  21: '0ac8f49c64c5aa00',
  22: '9e119ffa079a563f',
  23: '801e23c930880ce5',
  24: 'cd17222c6ec5ca4b',
  25: '199570ba592e882b',
};

/**
 * Les vingt-cinq rapports du raid de PROXIMITÉ après le lot COLONNE.
 *
 * ⚠⚠ LES VINGT-CINQ BOUGENT, ET C'EST CE QU'ON LEUR DEMANDE. Un raid dont les
 * unités s'arrêtent sur une infanterie ennemie, dont la défense se décale
 * latéralement pour venir à leur rencontre, et qui ne trouve plus la même
 * disposition en face, ne peut pas rendre le même rapport. S'il rendait le
 * même, c'est qu'aucune des trois règles ne serait lue.
 */
export const RAPPORTS_PROCHE_COLONNE = {
  1: '54a77c1e39dfb9da',
  2: '0d3805fb1457e9a8',
  3: '648779d66fee35f2',
  4: 'b91dbef168e95ffc',
  5: '5c01ec9ea7094e0b',
  6: 'ac42a1b208da1560',
  7: 'd2dbe46300e54a96',
  8: '3e4b896bed2d2f46',
  9: '29f59f7c27ca4548',
  10: 'fc365dbe4d65f2c9',
  11: 'd8f7817c831198e0',
  12: '6b9b493830d50b94',
  13: 'bd89a08237837257',
  14: '90503050a81b28b1',
  15: '9598d578c169794e',
  16: '9a31d1ea7752079d',
  17: '941bca78a7b768bc',
  18: '33680effef4357bd',
  19: '542e35d73922ae12',
  20: 'e5bb6ec169d22c04',
  21: 'c5962f2442ba8fe5',
  22: '8307be1dd4b32d4a',
  23: 'c4a494987684fb75',
  24: '3aae62ba8745498c',
  25: 'decdf4ab1f288553',
};

/** Les vingt-cinq rapports du raid de l'OUVRAGE après le lot COLONNE. */
export const RAPPORTS_OUVRAGE_COLONNE = {
  1: '5857dc593099a126',
  2: '6625a369dac9c8e7',
  3: '9d33895ce6413918',
  4: '64dc97c39b6edc6f',
  5: 'c2823e98133d3bd7',
  6: '245660e50e79c023',
  7: '2698b930223bef30',
  8: '13f6fc5feb7b37d8',
  9: '5b17dc7c997c8374',
  10: 'fc75fe613f6fcc46',
  11: 'd1fbc7ab853ddb96',
  12: '4b7213bab4a5dd6c',
  13: '90d8099249d98c85',
  14: '2b6385489fc25e6d',
  15: '4080c765a05415c3',
  16: '9491153106d0dc1b',
  17: '7d83167758e2029f',
  18: 'c42b998e7e22027e',
  19: 'b2658f3c1018c15c',
  20: 'f1cd6750e0027218',
  21: '82abf4ca6b4b52e1',
  22: 'd22347ff8dc29a45',
  23: '8bdc14a978acd095',
  24: 'f880879c9e1b806f',
  25: 'ba853077ee9ed513',
};

/**
 * SURCHARGE DU LOT SATELLITES-RESPAWN — 06/09/2026, TREIZE COUPLES SUR 322.
 *
 * ⚠⚠ ELLE ENTRE COMME CINQUIÈME COUCHE, PAR-DESSUS CELLE DU LOT COLONNE. Le
 * témoin ne se recapture JAMAIS : ce qu'il garde, c'est l'état d'AVANT le
 * dépliage de BASES-0, et le recalculer sur le code du jour ferait comparer un
 * code à lui-même. Chaque lot pose sa couche, et `empreinteAttendue` les lit de
 * la plus récente à la plus ancienne.
 *
 * ⚠⚠ TREIZE COUPLES, ET PAS UN DE PLUS — deux champs seulement, `satellites` et
 * `prochaineInstanceSatellite`, à partir de la PHASE 7. C'est le premier raid :
 * les six premières phases sont identiques AU BIT. Un camp rasé revient
 * sur-le-champ au lieu d'attendre cinq minutes, et il revient AILLEURS : la
 * table des présents change, et le compteur d'instances avance plus tôt.
 *
 * ⚠⚠ ET C'EST LA MESURE QUI DIT QUE LE LOT NE TOUCHE QUE LES SATELLITES : les
 * vingt autres champs sont IDENTIQUES sur les quatorze phases — `economie`,
 * `disposition`, `garnison`, `armee`, `sitesEntames`, `rapports`, `recherche`,
 * `poisAcquis`, `basesRasees`, `attaque`. Et `satellitesDetruits` non plus ne
 * bouge pas : on détruit autant, on remplace plus vite.
 *
 * ⚠ LES CINQUANTE EMPREINTES DE RAPPORT NE BOUGENT PAS NON PLUS, ni aucun des
 * huit scalaires — gestes, gestes d'armement, taille de la sauvegarde, cases
 * atteignables, déplacement, bases attaquantes, nombre de cibles et cible
 * retenue : 0 sur 25 pour chacun. Un remplaçant qui paraît ailleurs ne change ni
 * ce que le joueur construit, ni ce que l'Ouvrage vient lui prendre.
 *
 * ⚠ ET `version` EST TOUJOURS SUBSTITUÉE PAR `VERSION_AU_TEMOIN`, qui reste à
 * 22 : `SAVE_VERSION` passe de 26 à 27 dans ce lot, et la substitution absorbe
 * le nombre exactement comme elle l'a fait aux six bumps précédents.
 */
export const DEPLACES_PAR_SATELLITES_RESPAWN = {
  p07_raidProcheApres: {
    satellites: '8b761cb2379fa5cc'
  },
  p08_100ticks: {
    satellites: 'f9a466e2a52558a1',
    prochaineInstanceSatellite: 'f0f711563f9b886e'
  },
  p09_deplace: {
    satellites: 'f9a466e2a52558a1',
    prochaineInstanceSatellite: 'f0f711563f9b886e'
  },
  p10_montee: {
    satellites: 'f9a466e2a52558a1',
    prochaineInstanceSatellite: 'f0f711563f9b886e'
  },
  p11_raidOuvrageApres: {
    satellites: 'f9a466e2a52558a1',
    prochaineInstanceSatellite: 'f0f711563f9b886e'
  },
  p12_veilleDuRaid: {
    satellites: '95810fabe12bb2b5',
    prochaineInstanceSatellite: 'e270d30446466d57'
  },
  p13_apresLeRaid: {
    satellites: 'a432eb50eb586380'
  },
  p14_sousLeFeu: {
    satellites: '4bb9224606c8ec9d'
  }
};

/**
 * ⚠ L'EMPREINTE PAR GRAINE SE RECAPTURE EN ENTIER, elle ne se surcharge pas
 * champ par champ : elle concatène les vingt-deux champs des quatorze phases,
 * donc un seul couple déplacé la change. C'est le second regard du témoin — il
 * dit QUELLE graine diverge quand le premier dit QUEL champ.
 */
export const EMPREINTES_PAR_GRAINE_SATELLITES_RESPAWN = {
  '1': '5061b4379f82a010',
  '2': '951ce218c438bce0',
  '3': 'aad3e20ccf163fcb',
  '4': '61bdf9bdebd2fe6d',
  '5': 'c658a434362c0f85',
  '6': 'a7362aa7e4005cad',
  '7': '920154575db0ac3b',
  '8': '22ad4a2c47db6a6b',
  '9': 'fcd57aaf9189dc78',
  '10': '31d74e14694b6d70',
  '11': '45431567169034bc',
  '12': '0620791e19193f32',
  '13': '85e9f466f4b40300',
  '14': '554d9c2d7d80e6b6',
  '15': '26daa29ec07369ea',
  '16': 'dc1d5d265ce8ded8',
  '17': 'e1a8cd763a77be55',
  '18': 'd134e5557ee45df7',
  '19': '324b1d6664107b18',
  '20': '2c862918c2a30f9f',
  '21': 'fbc85a76f95846ef',
  '22': '9e119ffa079a563f',
  '23': '801e23c930880ce5',
  '24': 'cd17222c6ec5ca4b',
  '25': '199570ba592e882b'
};

// ---------------------------------------------------------------------------
// LOT PRODUCTION-EN-DÉFENSE — 07/09/2026
// ---------------------------------------------------------------------------
//
// ⚠⚠ CE QUI A CHANGÉ, ET POURQUOI C'EST LÉGITIME. La règle « infanterie
// inconstructible sans caserne » vivait dans les deux PALETTES ; elle est
// descendue dans `sim/state.js`, où elle garde les trois chemins de geste. Le
// scénario bâtit une Caserne et un Dépôt de véhicules — jamais un Aérodrome :
// la Crécelle, seul AÉRONEF qu'il arme, est donc désormais REFUSÉE. Un seul
// geste change sur les vingt-cinq graines, et tout le reste en découle.
//
// ⚠⚠ CE QUI NE CHANGE PAS EST LA MOITIÉ QUI PROUVE. Les phases p01 à p03 sont
// identiques AU BIT — la règle ne touche ni la carte, ni un stock, ni la
// construction. Et sur les vingt-cinq graines : `gestes`, `nbCasesAtteignables`,
// `deplacement`, `nbAttaquantes`, le nombre de cibles et la cible retenue des
// DEUX raids, la non-fuite et l'exactitude de la simulation, et les clés du
// rapport sont IDENTIQUES. Si la règle avait fui ailleurs que dans la pose
// d'unité, l'un de ces sept-là aurait bougé.
//
// ⚠ ÉCART DÉCLARÉ : LE SCÉNARIO N'ARME PLUS D'AÉRONEF. C'est la conséquence
// exacte de la règle sur CE montage, pas un contournement — lui poser un
// Aérodrome aurait changé la phase de construction et effacé la démonstration.
// La couverture des aéronefs au combat reste celle de `combat.test.js` et de
// `raid.test.js`, qui montent leurs compositions sans passer par la base.

export const DEPLACES_PAR_PRODUCTION_EN_DEFENSE = {
  p04_arme: {
    armee: '0ee0dc0154412cf4',
  },
  p05_18h: {
    attaque: 'b8993f8339b23fdf',
    armee: '0ee0dc0154412cf4',
  },
  p06_relu: {
    attaque: 'b8993f8339b23fdf',
    armee: '0ee0dc0154412cf4',
  },
  p07_raidProcheApres: {
    sitesEntames: '01e712a0b413495d',
    attaque: '4edad300d43a6946',
    rapports: '4f297aaa07112cf8',
    armee: '11cb8950dbc3d064',
    economie: 'd458fb91e278780d',
    satellites: 'd4da18a09e52dc51',
    satellitesDetruits: 'f46a0f0f9f1961b8',
  },
  p08_100ticks: {
    sitesEntames: '01e712a0b413495d',
    attaque: 'ed9cbfd53c86388a',
    rapports: '4f297aaa07112cf8',
    armee: '11cb8950dbc3d064',
    economie: '1fa3840200980c39',
    satellites: 'd4da18a09e52dc51',
    prochaineInstanceSatellite: '6909d921c42a6a0f',
    satellitesDetruits: 'f46a0f0f9f1961b8',
  },
  p09_deplace: {
    sitesEntames: '01e712a0b413495d',
    attaque: 'ed9cbfd53c86388a',
    rapports: '4f297aaa07112cf8',
    armee: '11cb8950dbc3d064',
    economie: '1fa3840200980c39',
    satellites: 'd4da18a09e52dc51',
    prochaineInstanceSatellite: '6909d921c42a6a0f',
    satellitesDetruits: 'f46a0f0f9f1961b8',
  },
  p10_montee: {
    sitesEntames: '01e712a0b413495d',
    attaque: 'ed9cbfd53c86388a',
    rapports: '4f297aaa07112cf8',
    armee: '11cb8950dbc3d064',
    economie: '1fa3840200980c39',
    satellites: 'd4da18a09e52dc51',
    prochaineInstanceSatellite: '6909d921c42a6a0f',
    satellitesDetruits: 'f46a0f0f9f1961b8',
  },
  p11_raidOuvrageApres: {
    recherche: 'e9cbef5482aba43b',
    sitesEntames: 'f79e3fe3e039181a',
    attaque: 'cda3bae69e4bd5cf',
    rapports: '4211bd0928ece958',
    armee: '7d71a342e23285b5',
    economie: '1fa3840200980c39',
    satellites: 'd4da18a09e52dc51',
    prochaineInstanceSatellite: '6909d921c42a6a0f',
    satellitesDetruits: 'f46a0f0f9f1961b8',
  },
  p12_veilleDuRaid: {
    recherche: 'e9cbef5482aba43b',
    sitesEntames: '79e5d505ede0831f',
    attaque: '7127ad6376a69ab5',
    rapports: '4211bd0928ece958',
    armee: '7d71a342e23285b5',
    economie: '1fa3840200980c39',
    satellites: 'bba845b645ff0324',
    prochaineInstanceSatellite: '2529d6cb8eecff00',
    satellitesDetruits: 'f46a0f0f9f1961b8',
  },
  p13_apresLeRaid: {
    recherche: 'e9cbef5482aba43b',
    sitesEntames: '9a945114730f874b',
    attaque: 'a36c1ddaa3c17846',
    rapports: '97555f692e040c7f',
    armee: '7d71a342e23285b5',
    economie: '2b0318f7b2cd1621',
    satellites: 'a3177522583bed29',
    prochaineInstanceSatellite: '2e3ed9d766d07ec3',
    satellitesDetruits: 'f46a0f0f9f1961b8',
  },
  p14_sousLeFeu: {
    recherche: 'e9cbef5482aba43b',
    sitesEntames: 'dd1c617b7796a5ef',
    attaque: 'b8993f8339b23fdf',
    rapports: '0d6d8e6ebab7e34b',
    armee: '7d71a342e23285b5',
    satellites: 'b1cdc1b7223c96c4',
    reserveReparation: '0aa10caab41dcc49',
    prochaineInstanceSatellite: 'cd4d61c347e3b2de',
    satellitesDetruits: 'f46a0f0f9f1961b8',
  },
};

/**
 * L'empreinte par graine, recalculée : les vingt-cinq divergent, puisque
 * `armee` bouge dès la phase 4 sur chacune.
 */
export const EMPREINTES_PAR_GRAINE_PRODUCTION_EN_DEFENSE = {
  1: 'eb2f752ef310cc06',
  2: 'fb8b1da46a76d6c3',
  3: '764c5b2b184ad5ac',
  4: 'b4d5256d88cc10c3',
  5: '5eccdf09bea85f01',
  6: 'a6d01dcfc46ce264',
  7: 'c80bc3b185c6c995',
  8: '4c0d4f569b6dbb38',
  9: '6173c493692f3410',
  10: '4b0f018c7ab83dc8',
  11: 'd728eeb512271b69',
  12: '723540ecd2bae642',
  13: '5cb49d5321327fbb',
  14: '73b6279c56346c7b',
  15: '0fbcfcbdae128d5f',
  16: '91d66307614e0578',
  17: '668d5fd22773f18c',
  18: '820ea027f5b799e5',
  19: '87b087d951f4f578',
  20: '5213cc99681fcef2',
  21: '4b3ff5adece7980f',
  22: 'e928999538819b4f',
  23: '4978bf945855d79c',
  24: '7aa1c673393d5e5f',
  25: '0db2ea9a089cb698',
};

/**
 * Les gestes d'armement, IDENTIQUES sur les vingt-cinq graines — c'est pourquoi
 * c'est une chaîne et non une table de vingt-cinq. Le refus y est écrit en
 * toutes lettres : un lot qui rouvrirait la pose sans Aérodrome le ferait
 * tomber en NOMMANT le geste, là où une empreinte dirait seulement « ça a bougé ».
 */
export const GESTES_ARMER_PRODUCTION_EN_DEFENSE = 'gar merlon@4,2 | gar casemate@5,4 | gar meute@6,3 | gar perceurs@6,5 | gar ronce@3,6 | gar batterie@8,7 | arm meute@v1,2 | arm perceurs@v1,4 | arm carapace@v2,3 | arm guetteur@v2,5 | arm crecelle refusé: poserEffectif : pose illégale en armée — | arm meute@v4,6';

/**
 * Ce que la sauvegarde PERD : une unité d'armée en moins, quatre-vingts octets,
 * le MÊME nombre sur les vingt-cinq graines. Il se retranche des quatre termes
 * qui s'ajoutaient — chacun dit ce que son lot a coûté, et la somme reste
 * lisible ligne par ligne. S'il dépendait de la partie, c'est que la règle
 * aurait touché un CONTENU.
 */
export const OCTETS_OTES_PAR_PRODUCTION_EN_DEFENSE = 80;

/**
 * Les deux rapports de raid, déplacés sur les vingt-cinq graines : une armée à
 * cinq unités au lieu de six ne rend pas le même rapport. Le NOMBRE DE CIBLES
 * et la CIBLE RETENUE, eux, ne bougent pas — ce qui prouve que seule la
 * composition a changé, pas le choix de la cible ni le barème.
 */
export const RAPPORTS_PROCHE_PRODUCTION_EN_DEFENSE = {
  1: '569e4119667a1c65',
  2: '28f95b83485ebba5',
  3: 'c0e9f8804895f01f',
  4: 'ddb1e10af49e21d0',
  5: '07f57bf1546aa93e',
  6: '1242bede58f33364',
  7: 'c24bc5be74c3b213',
  8: '6ef1a007f3745c4a',
  9: '45296f70428590bd',
  10: 'f813b1e4734b5ef3',
  11: 'afcc5487cbedd943',
  12: 'b754ed1f7fa81ece',
  13: '6c026bc931789ffc',
  14: 'd88fc8fa90a83a90',
  15: '0ededbae5877b33f',
  16: 'f629178259a21754',
  17: 'a840a0ced394dc7b',
  18: 'f34e67a46f68eae3',
  19: 'cb34ae45ef4e263a',
  20: '408d72e33f872509',
  21: '2ec7f7ba6bff5be5',
  22: '2e51e3c1d614c29f',
  23: '565c2e7c334d0fd5',
  24: '4ea46cdb84cf6d73',
  25: '35a4980f428d418b',
};

export const RAPPORTS_OUVRAGE_PRODUCTION_EN_DEFENSE = {
  1: '1ddc6268fb9265b7',
  2: '6ac4481df08f43c4',
  3: '351f971feb2981b3',
  4: '94ab72cbdff225da',
  5: '5759bd5e71a21375',
  6: '1628ec749752db7c',
  7: '5f68b354b2585822',
  8: '21500a826b7664e3',
  9: '4d259e021275a9fa',
  10: '75c42e7ff7f8a7d6',
  11: 'fbc4c45ca9200130',
  12: '64320f7b2e1db5fb',
  13: '3033c73b40b6e27b',
  14: '25eabdfed7b36dc2',
  15: 'b7a7fae541383672',
  16: 'c09532e957206303',
  17: '75b0f4c383eb9285',
  18: 'ee075028ad27c70f',
  19: '13933295e895bd9b',
  20: '63f96ed453d8f2db',
  21: 'c55920206e72d6c1',
  22: '9ac116110a8c9735',
  23: '08612cc76dc3c2d6',
  24: '7b5bbbb6b420e1b0',
  25: '2ae9695fa653910f',
};

// ---------------------------------------------------------------------------
// LOT CIBLES-RANGÉES — 07/09/2026
// ---------------------------------------------------------------------------
//
// ⚠⚠ CE QUI A CHANGÉ, ET POURQUOI C'EST LÉGITIME. Le lot tire les TAILLES DE
// RANGÉE des sites de l'Ouvrage : `placerDefenses` et `placerBatiments`
// consomment un nombre de tirages différent, donc tout ce qui tire APRÈS eux se
// décale — obstacles, composition, vagues. Les sites RAIDÉS ne sont donc plus
// les mêmes, et les deux rapports de raid du scénario bougent sur les vingt-cinq
// graines.
//
// ⚠⚠ CE QUI NE CHANGE PAS EST LA MOITIÉ QUI PROUVE. Les phases p01 à p06 sont
// identiques AU BIT : la base du JOUEUR n'est pas un site généré, donc bâtir,
// armer, produire et sauvegarder ne dépendent d'aucun de ces tirages. Et sur les
// vingt-cinq graines : `gestes`, `gestesArmer`, `tailleSauvegarde`,
// `nbCasesAtteignables`, `deplacement`, `nbAttaquantes`, le nombre de cibles et
// la cible retenue des DEUX raids, la non-fuite et l'exactitude de la
// simulation, et les clés du rapport sont IDENTIQUES. Si le lot avait fui hors
// de la disposition des sites, l'un de ces neuf-là aurait bougé.
//
// Cinquante-huit couples, tous à partir de la phase 7 — le premier raid.
export const DEPLACES_PAR_CIBLES_RANGEES = {
  p07_raidProcheApres: {
    sitesEntames: '54f344b12076ce8a',
    rapports: '928a628231a0662b',
    armee: 'b342c3fef4ee3f2d',
    economie: 'a3c412290b01883f',
    satellites: '007a36e47eff24f4',
    satellitesDetruits: 'ec00e60b4f7a0278',
  },
  p08_100ticks: {
    sitesEntames: '54f344b12076ce8a',
    rapports: '928a628231a0662b',
    armee: 'b342c3fef4ee3f2d',
    economie: '93737d921b365753',
    satellites: 'f42dd69e0e801d78',
    prochaineInstanceSatellite: '537730bee2ed51e5',
    satellitesDetruits: 'ec00e60b4f7a0278',
  },
  p09_deplace: {
    sitesEntames: '54f344b12076ce8a',
    rapports: '928a628231a0662b',
    armee: 'b342c3fef4ee3f2d',
    economie: '93737d921b365753',
    satellites: 'f42dd69e0e801d78',
    prochaineInstanceSatellite: '537730bee2ed51e5',
    satellitesDetruits: 'ec00e60b4f7a0278',
  },
  p10_montee: {
    sitesEntames: '54f344b12076ce8a',
    rapports: '928a628231a0662b',
    armee: 'b342c3fef4ee3f2d',
    economie: '93737d921b365753',
    satellites: 'f42dd69e0e801d78',
    prochaineInstanceSatellite: '537730bee2ed51e5',
    satellitesDetruits: 'ec00e60b4f7a0278',
  },
  p11_raidOuvrageApres: {
    recherche: '7fe778c3ac5e54ba',
    sitesEntames: 'e3fb349bc5baa1c4',
    rapports: 'cb56e1c1eaebeaf4',
    armee: 'f4e0aff3d42695d1',
    economie: '93737d921b365753',
    satellites: 'f42dd69e0e801d78',
    prochaineInstanceSatellite: '537730bee2ed51e5',
    satellitesDetruits: 'ec00e60b4f7a0278',
  },
  p12_veilleDuRaid: {
    recherche: '7fe778c3ac5e54ba',
    sitesEntames: 'dcaef5057c200602',
    rapports: 'cb56e1c1eaebeaf4',
    armee: 'f4e0aff3d42695d1',
    economie: '93737d921b365753',
    satellites: 'c4f1b59fbd7eaa15',
    prochaineInstanceSatellite: 'f8c13fe64c8c691e',
    satellitesDetruits: 'ec00e60b4f7a0278',
  },
  p13_apresLeRaid: {
    recherche: '7fe778c3ac5e54ba',
    sitesEntames: 'bd48cc007dbc78fe',
    rapports: '2f76e465dc6c1462',
    armee: 'f4e0aff3d42695d1',
    economie: '0d8aa4381ad0a806',
    satellites: 'd2bf5c2f8ed04956',
    prochaineInstanceSatellite: 'd7dd8a48a2b8cbe6',
    satellitesDetruits: 'ec00e60b4f7a0278',
  },
  p14_sousLeFeu: {
    recherche: '7fe778c3ac5e54ba',
    sitesEntames: '006066088a50a7ac',
    rapports: 'a480bac388bfa04d',
    armee: 'f4e0aff3d42695d1',
    satellites: '6d33074b6be22921',
    prochaineInstanceSatellite: 'eb5fa453f773600f',
    satellitesDetruits: 'ec00e60b4f7a0278',
  },
};

/** L'empreinte par graine, recalculée : les vingt-cinq divergent dès le premier raid. */
export const EMPREINTES_PAR_GRAINE_CIBLES_RANGEES = {
  1: '7d465be2f5bfe105',
  2: '2234a47debe5c02b',
  3: 'fe4f2ad10eefe37b',
  4: 'a3c56fdf424f112d',
  5: '581e31a5e2295543',
  6: 'e9c591c8ed1ed780',
  7: '00e5433c47c4dea6',
  8: 'dac8305680b9e42f',
  9: '73f2007f6841dfc5',
  10: '2facf22e7daf3df6',
  11: '0ddf78b3b6659065',
  12: '0d40ee887430fdef',
  13: '4636e652943b4cf1',
  14: '6d068c86d28e697a',
  15: 'c6317ec4cdb770c5',
  16: 'cfed89c5a0731a3f',
  17: 'a1813b96f47e5305',
  18: '5dbc9826706848ea',
  19: '1989078e275e2395',
  20: '4912460d4e489d02',
  21: '1a444d201706b7b2',
  22: 'e15f932f3fa81b78',
  23: '86e8899f0cf7afda',
  24: '920e44f23f9eccab',
  25: 'a3dbd8792e754a54',
};

/**
 * Les deux rapports de raid, déplacés sur les vingt-cinq graines : un site qui
 * n'est plus disposé pareil ne rend pas le même rapport. Le NOMBRE DE CIBLES et
 * la CIBLE RETENUE, eux, ne bougent pas — ce qui prouve que seule la disposition
 * du site a changé, pas le choix de la cible ni le barème.
 */
export const RAPPORTS_PROCHE_CIBLES_RANGEES = {
  1: '01e50f6737c3f744',
  2: '860818f94bdabae6',
  3: '8929519680bea01d',
  4: 'd5a23ab32e15a6d1',
  5: '87e0f1544d8ee658',
  6: 'a242f9b8e305061d',
  7: '273da9afd4b257f7',
  8: '1bc84a26e98d0824',
  9: '407991770e8ff11b',
  10: '1b88d7f0ba2fcde0',
  11: '8e091c881a1ce473',
  12: '0f2f78044d63ce81',
  13: 'cc7a0f706195748e',
  14: 'c17571eb0ce2c968',
  15: '4f31d1eabe5761d5',
  16: '64e09a2fee21433e',
  17: 'b5444a459ac10b41',
  18: 'ccbadbdebc5f7b9a',
  19: '0a7f1be7aeedbe69',
  20: '90efabbeff9973c8',
  21: 'cc529eb1790f7576',
  22: 'f8b336095a19f929',
  23: 'c50629e445a20316',
  24: '12fd5d0cffe86ce4',
  25: 'ed96aa699f657a18',
};

export const RAPPORTS_OUVRAGE_CIBLES_RANGEES = {
  1: 'cf061022659810c3',
  2: 'f9fcd365765b8cb6',
  3: '80afae6ab36044fd',
  4: '327e76667a80fe87',
  5: 'e4894663f64acd67',
  6: 'ef19f38286e05e80',
  7: 'c3ba7af25a5e6933',
  8: 'fc0695edb4037f7f',
  9: '46197f9fd321a93e',
  10: 'c03169a1271445bf',
  11: '438deca78b86662b',
  12: '83c35d8929ac20e7',
  13: '59174a4d009ec5bc',
  14: '476f4da8fd024d31',
  15: 'cdd4b7716323676b',
  16: '5b3e6f8e3e11df13',
  17: '2d4eebb71a00af3f',
  18: 'a40fd502b3ed1b2c',
  19: '39ae89e6fbe284b6',
  20: 'eb10ac0331aabf60',
  21: 'f09e238d62c0fb2f',
  22: '727195dd897c7b7e',
  23: '4d8d6248fbb7a927',
  24: '6c1c7cccc5682d9c',
  25: 'f92d38b29bc03c81',
};

/**
 * Ce que le lot TERRITOIRE-LU a déplacé — cinquième couche par-dessus celle de
 * CIBLES-RANGÉES.
 *
 * ⚠⚠ CE QUI A CHANGÉ, ET RIEN D'AUTRE : `releverLesPoisAcquis` demande la
 * PROPRIÉTÉ d'une case, plus seulement sa portée. Le joueur ne ramasse donc plus
 * le gisement d'une case que la carte peint à l'Ouvrage, et `poisAcquis` bouge
 * dès la phase 10 — puis tout ce qui en dépend : la recherche que les POI
 * financent, les rapports de raid, l'économie.
 *
 * ⚠⚠ CINQ PHASES SUR QUATORZE, ET LES NEUF PREMIÈRES SONT INTACTES. C'est ce
 * qui dit que la règle n'a pas fui hors de la récolte : la pose, l'économie du
 * début, le premier raid et les satellites tombent EXACTEMENT sur la capture
 * d'origine. Une couche qui aurait tout déplacé ne prouverait rien.
 *
 * ⚠ UN POI DÉJÀ PRIS RESTE PRIS — Ethan, 07/09. Ce qui bouge est ce que le
 * joueur ramasse À PARTIR DE MAINTENANT, jamais ce qu'il a déjà.
 */
export const DEPLACES_PAR_TERRITOIRE_LU = {
  p10_montee: {
    poisAcquis: '9f6db10be605c9c3',
  },
  p11_raidOuvrageApres: {
    poisAcquis: '9f6db10be605c9c3',
    rapports: '1494ba9bc953a91f',
    recherche: 'f6e1c73fb88ae3f7',
    sitesEntames: '6b47f499b5be4ab3',
  },
  p12_veilleDuRaid: {
    poisAcquis: '9f6db10be605c9c3',
    rapports: '1494ba9bc953a91f',
    recherche: 'f6e1c73fb88ae3f7',
    sitesEntames: 'dd32ece5fe4470d5',
  },
  p13_apresLeRaid: {
    economie: 'cb48102a4a907ccd',
    poisAcquis: '9f6db10be605c9c3',
    rapports: '87cdb955c8fac3ed',
    recherche: 'f6e1c73fb88ae3f7',
    sitesEntames: 'ec0329828a325a38',
  },
  p14_sousLeFeu: {
    economie: '682db64f316adaa5',
    poisAcquis: '51b6e7462d13831b',
    rapports: '2476e35709e2242f',
    recherche: 'f6e1c73fb88ae3f7',
  },
};

/** L'empreinte par graine, recalculée : les vingt-cinq divergent dès la récolte. */
export const EMPREINTES_PAR_GRAINE_TERRITOIRE_LU = {
  1: '7870f508069c21dc',
  2: 'd4f989d1607531d7',
  3: 'ee7776a13d27dc59',
  4: '978f5dd896be5219',
  5: '581e31a5e2295543',
  6: 'ed0ecd394cb2e3a9',
  7: 'c646f84487670a22',
  8: 'dac8305680b9e42f',
  9: '3e75bacb16b37703',
  10: '2facf22e7daf3df6',
  11: '0ddf78b3b6659065',
  12: '0d40ee887430fdef',
  13: 'f84106ce3fb3e87e',
  14: '8711555cb416ffad',
  15: 'a3fe9fbc81f3379d',
  16: '80b6a5aa705a3845',
  17: 'fb196740403741f0',
  18: '3632dfc0f9c4465a',
  19: '9edd27ee17695ab2',
  20: '45f7a167f0c8e219',
  21: '1a444d201706b7b2',
  22: 'd0683a02dc6addbf',
  23: '86e8899f0cf7afda',
  24: 'c84e82cd15a6bc5b',
  25: '593d8fb2db300dd3',
};

/**
 * Le rapport du raid sur l'Ouvrage, déplacé par TERRITOIRE-LU — UNE graine.
 *
 * ⚠⚠ UNE SEULE SUR VINGT-CINQ, ET C'EST LA MESURE QUI COMPTE. La récolte des
 * POI demande la PROPRIÉTÉ depuis ce lot ; sur vingt-quatre graines, ce que le
 * joueur ramasse avant le raid ne change pas assez pour déplacer sa composition,
 * et le rapport tombe à l'octet sur la capture d'origine. Sur la graine 6, un
 * gisement de moins finance une recherche de moins, donc une armée différente,
 * donc un autre rapport. Une couche qui aurait déplacé les vingt-cinq dirait que
 * la règle a fui hors de la récolte ; une qui n'en déplace qu'une dit qu'elle est
 * restée où on l'a mise.
 */
export const RAPPORTS_OUVRAGE_TERRITOIRE_LU = {
  6: '2bacf3a789e060ef',
};
/**
 * Ce que le lot RETOUCHES a déplacé — sixième couche par-dessus celle de
 * TERRITOIRE-LU.
 *
 * ⚠⚠ CE QUI A CHANGÉ, ET RIEN D'AUTRE : le point 15 du 07/09 contraint la CASE
 * qu'un satellite retient quand deux apparitions ou plus tombent au même tick.
 * La saveur est une propriété de la case — arbitrage du 29/08 —, donc la
 * contraindre déplace la case, donc le site, donc son butin. Mesuré : les TROIS
 * satellites d'une base neuve paraissent au même tick, et sur 200 graines les
 * deux camps sortaient du même bord **91 fois sur 200 ; après, ZÉRO**.
 *
 * ⚠⚠ L'ATTRIBUTION EST MESURÉE, PAS DÉDUITE. En neutralisant la SEULE ligne de
 * la contrainte — `dues` forcé à zéro —, le témoin retombe à **0 couple
 * déplacé** : les soixante-dix couples viennent tous de là, et les trois autres
 * points du lot n'atteignent pas le moteur. C'est le protocole du lot
 * SATELLITES-RESPAWN, repris tel quel.
 *
 * ⚠ LA PREMIÈRE PHASE TOUCHÉE EST `p02_6h`, celle où les satellites paraissent —
 * **`p01` est identique AU BIT**. La chaîne se lit ensuite d'un bout à l'autre :
 * le camp change de case, donc de saveur, donc son butin ; d'où `economie`,
 * `rapports`, `recherche`, `armee` et `sitesEntames` à partir du premier raid.
 *
 * ⚠ ET `prochaineInstanceSatellite` NE BOUGE QU'À PARTIR DE `p08_100ticks` : le
 * compte d'instances est le même tant qu'aucun satellite n'a été détruit ni
 * relevé. La contrainte ne consomme aucun tirage de plus — c'est ce que dit
 * l'immobilité de ce champ dans les premières phases.
 */
export const DEPLACES_PAR_RETOUCHES = {
  p02_6h: {
    satellites: '56f1dffeb27e4c6c',
  },
  p03_batiComplet: {
    satellites: 'd9e230cea8df107e',
  },
  p04_arme: {
    satellites: 'd9e230cea8df107e',
  },
  p05_18h: {
    satellites: '095950c5fbbff6aa',
  },
  p06_relu: {
    satellites: '095950c5fbbff6aa',
  },
  p07_raidProcheApres: {
    sitesEntames: '249eb6bd5d554414',
    attaque: 'b858ba273275702f',
    rapports: '3b060ceabc5310be',
    armee: '6eea960244053440',
    economie: '5d42e19a16be12b1',
    satellites: '47205630cf0bd71f',
    satellitesDetruits: 'c937945c4387a399',
  },
  p08_100ticks: {
    sitesEntames: '249eb6bd5d554414',
    attaque: '70c0b9d3687bfd44',
    rapports: '3b060ceabc5310be',
    armee: '6eea960244053440',
    economie: '93e2b408dc09271f',
    satellites: 'b39e8dd02f822752',
    prochaineInstanceSatellite: 'c07e8d1e9d0e953e',
    satellitesDetruits: 'c937945c4387a399',
  },
  p09_deplace: {
    sitesEntames: '249eb6bd5d554414',
    attaque: '70c0b9d3687bfd44',
    rapports: '3b060ceabc5310be',
    armee: '6eea960244053440',
    economie: '93e2b408dc09271f',
    satellites: 'b39e8dd02f822752',
    prochaineInstanceSatellite: 'c07e8d1e9d0e953e',
    satellitesDetruits: 'c937945c4387a399',
  },
  p10_montee: {
    sitesEntames: '249eb6bd5d554414',
    attaque: '70c0b9d3687bfd44',
    rapports: '3b060ceabc5310be',
    armee: '6eea960244053440',
    economie: '93e2b408dc09271f',
    satellites: 'b39e8dd02f822752',
    prochaineInstanceSatellite: 'c07e8d1e9d0e953e',
    satellitesDetruits: 'c937945c4387a399',
  },
  p11_raidOuvrageApres: {
    recherche: '9b585724747201d4',
    sitesEntames: '5b08bf3b7acecc0f',
    attaque: 'dab12a455daf1eec',
    rapports: 'e78f149ccbb3bc4e',
    armee: '37c469979257bc01',
    economie: '93e2b408dc09271f',
    satellites: 'b39e8dd02f822752',
    prochaineInstanceSatellite: 'c07e8d1e9d0e953e',
    satellitesDetruits: 'c937945c4387a399',
  },
  p12_veilleDuRaid: {
    recherche: '9b585724747201d4',
    sitesEntames: '93316ea3d6a2ec98',
    attaque: 'a95c282a2c402c4d',
    rapports: 'e78f149ccbb3bc4e',
    armee: '37c469979257bc01',
    economie: '93e2b408dc09271f',
    satellites: 'b4c83f45fbe4ea5d',
    prochaineInstanceSatellite: 'fb7305350100f1cd',
    satellitesDetruits: 'c937945c4387a399',
  },
  p13_apresLeRaid: {
    recherche: '9b585724747201d4',
    sitesEntames: '13acfec9e01a6f50',
    attaque: 'd11d4acd25daabbe',
    rapports: '2788812df240632f',
    armee: '37c469979257bc01',
    economie: '9ba3ae4ca27c1389',
    satellites: '7d545ca163860782',
    prochaineInstanceSatellite: '7eb95128404d8598',
    satellitesDetruits: 'c937945c4387a399',
  },
  p14_sousLeFeu: {
    recherche: '9b585724747201d4',
    sitesEntames: '8cff6d01c96f55cd',
    rapports: '4d9a157157f08357',
    armee: '37c469979257bc01',
    satellites: '7f86981d319daacb',
    prochaineInstanceSatellite: '7095db6de24f4c5d',
    satellitesDetruits: 'c937945c4387a399',
  },
};

/**
 * L'empreinte par graine, recalculée : les vingt-cinq divergent dès que les
 * satellites paraissent.
 */
export const EMPREINTES_PAR_GRAINE_RETOUCHES = {
  1: '8e0ddb4e8b25c14c',
  2: '185efeb488876e7a',
  3: '9d93ffa8a86b68e8',
  4: '66825f1e050e6323',
  5: '81604cc98c43d854',
  6: '4399c86aa434fff7',
  7: '134902221d764f8a',
  8: '9c22db1980b4848d',
  9: 'cc64c4db8d2baf71',
  10: '7dfdec4a7ea1bb7a',
  11: '58b57b3550aa0d59',
  12: '53c20368c8404207',
  13: '2f446facc7311610',
  14: '80337e6fea1d5625',
  15: '3628c1ea8468d589',
  16: '1d0c0fbdbb516c9c',
  17: 'a63e84520115d745',
  18: 'cedf63c0dddee00d',
  19: '18917dd0627513a6',
  20: 'c7d656fbf363d837',
  21: 'bef5625734f97257',
  22: '386af652005870c0',
  23: 'c0a1ba4e8ce92852',
  24: '4e148186cce6804c',
  25: '879d73a800bfa26e',
};

/**
 * Les vingt-cinq rapports du raid de PROXIMITÉ, déplacés : le camp attaqué
 * n'est plus sur la même case, donc plus de la même saveur, donc son butin
 * n'est plus le même. Ce qui NE bouge pas — nombre de cibles, cible retenue,
 * non-fuite et exactitude de la simulation — dit que seule la saveur a changé.
 */
export const RAPPORTS_PROCHE_RETOUCHES = {
  1: '72747118dbebb543',
  2: '860818f94bdabae6',
  3: '5dfa8d989d400aaf',
  4: 'd5a23ab32e15a6d1',
  5: '6800486d792712b1',
  6: 'e6ddd213225ec7eb',
  7: 'fcf8f07e8bfb11b9',
  8: '100593d24150d6d6',
  9: 'f44782982a880db0',
  10: '1b88d7f0ba2fcde0',
  11: '21998c3431f05139',
  12: 'd71f0ca9326d4ce5',
  13: 'fc9623c956bc5a51',
  14: '78e4c1b87f31218a',
  15: '4f31d1eabe5761d5',
  16: '023b39c0d28b8bb8',
  17: 'b5444a459ac10b41',
  18: '30728017f7752fbd',
  19: '0a7f1be7aeedbe69',
  20: '90efabbeff9973c8',
  21: 'b509c00b4bfb6f00',
  22: 'f8b336095a19f929',
  23: 'c50629e445a20316',
  24: '74cb8f7748727a01',
  25: '25dedf2979a8839a',
};

/**
 * Les vingt-cinq rapports du raid LOINTAIN, déplacés pour la même raison : ce
 * que la base a en stock au moment où l'Ouvrage la frappe dépend de ce que les
 * camps lui ont rapporté.
 */
export const RAPPORTS_OUVRAGE_RETOUCHES = {
  1: '8ea1e5b8e018b2fa',
  2: 'f9fcd365765b8cb6',
  3: '5279876d4bdd6c90',
  4: '327e76667a80fe87',
  5: '26dff4fdae8dced6',
  6: '01710939cc489206',
  7: '2f2e22ed6af7682a',
  8: 'e83e6dd91d6595a2',
  9: '01c2df9232c049b3',
  10: 'c03169a1271445bf',
  11: '52aeca17a27357f8',
  12: 'a7e38854caa153dd',
  13: '59174a4d009ec5bc',
  14: 'dabaf8f5837dcff9',
  15: 'cdd4b7716323676b',
  16: '3c59320f2c44cc39',
  17: '2d4eebb71a00af3f',
  18: 'bb915205cb198f41',
  19: '39ae89e6fbe284b6',
  20: 'eb10ac0331aabf60',
  21: '0400bb11d9d4964e',
  22: '727195dd897c7b7e',
  23: '4d8d6248fbb7a927',
  24: 'db6123f5f55bd0f3',
  25: 'fa88f3118fcfb7da',
};

/**
 * La CIBLE du raid de proximité, déplacée par le lot RETOUCHES sur QUATORZE
 * graines — et sur quatorze seulement.
 *
 * ⚠⚠ C'EST LE SEUL SCALAIRE QUI BOUGE, MESURÉ CONTRE LES TREIZE AUTRES. Gestes
 * de construction, gestes d'armement, TAILLE DE LA SAUVEGARDE, cases
 * atteignables, déplacement, nombre de bases attaquantes, nombre de cibles des
 * DEUX raids, cible du raid lointain, non-fuite et exactitude des DEUX
 * simulations : identiques sur 25 graines sur 25. C'est cette moitié-là qui dit
 * que le lot ne touche QUE la case d'un satellite.
 *
 * ⚠ ONZE GRAINES RESTENT GARDÉES CONTRE LA CAPTURE D'ORIGINE — leur camp le
 * plus proche tombe sur la même case qu'avant. Une couche qui aurait tout
 * déplacé ne prouverait rien.
 *
 * ⚠ ET LA TAILLE DE LA SAUVEGARDE NE BOUGE PAS D'UN OCTET : rien n'entre dans
 * l'état. La saveur reste DÉRIVÉE de la case, ce qui est exactement pourquoi
 * `SAVE_VERSION` n'a pas à bouger.
 */
export const CIBLE_PROCHE_RETOUCHES = {
  1: '296,16:camp:n1',
  3: '294,15:camp:n1',
  5: '294,15:camp:n1',
  7: '296,16:camp:n1',
  8: '295,14:camp:n1',
  9: '295,15:camp:n1',
  11: '294,15:camp:n1',
  12: '294,17:camp:n1',
  13: '294,17:camp:n1',
  14: '295,17:camp:n1',
  18: '294,16:camp:n1',
  21: '295,17:camp:n1',
  24: '296,16:camp:n1',
  25: '294,16:camp:n1',
};

// ---------------------------------------------------------------------------
// Ce que le lot BÂTIMENTS-QUATRE-ÉTATS a déplacé — 08/09/2026
// ---------------------------------------------------------------------------
//
// ⚠⚠ QUATORZE PHASES, UN SEUL CHAMP : `disposition`, ET RIEN D'AUTRE. C'est la
// mesure la plus utile du lot. Le Collecteur s'est dédoublé — `collecteurQuartz`
// et `collecteurScorie` selon le champ — et le scénario pose donc deux
// identifiants au lieu d'un. Tout ce qui DÉPEND de la disposition — l'économie,
// les stocks, les raids, les rapports, la garnison, l'armée, les satellites —
// tombe à l'octet sur la capture d'origine, sur les vingt-cinq graines.
//
// Autrement dit : **le dédoublement a changé un NOM, pas un comportement.** Un
// collecteur à quartz produit exactement ce que le Collecteur produisait sur un
// champ de quartz, ce qui est très exactement ce que la migration v28 → v29
// promet aux sauvegardes existantes.
//
// ⚠ LES DEUX PREMIÈRES PHASES PARTAGENT UNE EMPREINTE, ET LES QUATRE
// SUIVANTES UNE AUTRE. `p01_batir` et `p02_6h` ont la même disposition — six
// heures passent sans qu'on pose —, puis `p03` à `p06` la même après le second
// train de bâtiments. Ce n'est pas une recopie : c'est le scénario qui ne pose
// rien entre ces phases-là, et les couches précédentes montrent le même motif.

export const DEPLACES_PAR_QUATRE_ETATS = {
  p01_batir: {
    disposition: 'd8c8a1b6a7beb7eb',
  },
  p02_6h: {
    disposition: 'd8c8a1b6a7beb7eb',
  },
  p03_batiComplet: {
    disposition: '32696af53a8e6384',
  },
  p04_arme: {
    disposition: '32696af53a8e6384',
  },
  p05_18h: {
    disposition: '32696af53a8e6384',
  },
  p06_relu: {
    disposition: '32696af53a8e6384',
  },
  p07_raidProcheApres: {
    disposition: '32696af53a8e6384',
  },
  p08_100ticks: {
    disposition: '32696af53a8e6384',
  },
  p09_deplace: {
    disposition: '32696af53a8e6384',
  },
  p10_montee: {
    disposition: '32696af53a8e6384',
  },
  p11_raidOuvrageApres: {
    disposition: '32696af53a8e6384',
  },
  p12_veilleDuRaid: {
    disposition: '32696af53a8e6384',
  },
  p13_apresLeRaid: {
    disposition: 'cfb1005f5f958f28',
  },
  p14_sousLeFeu: {
    disposition: '132108580aa2d9c0',
  },
};

export const EMPREINTES_PAR_GRAINE_QUATRE_ETATS = {
  1: '756a5b25231e3890',
  2: 'cac165e55fd0aced',
  3: 'efa90125920867b2',
  4: '1d393acbd5d86d56',
  5: '885128cee867bd9c',
  6: '0bc55187eec8f6a8',
  7: 'fb8d14674ef65ddb',
  8: '502f96879d3d82db',
  9: '358451aef3729e6e',
  10: '7b091a6cc4fac904',
  11: '38d09853285fd481',
  12: '88e509202eea56d9',
  13: '4987fa07186b2e35',
  14: 'c9be9ee4ddf1bff4',
  15: '7ada3fb04781eea3',
  16: 'ff998992ec29aa0f',
  17: '74938aa25aba757e',
  18: 'd47eb365880a9754',
  19: '7bc9d6aba6fc41d6',
  20: 'af0c75025e3c9552',
  21: '2343044cd4e67ec8',
  22: 'ef5d9ba6f15ad4e5',
  23: '2537e940124fc06f',
  24: 'ea9ca6ba3a451d66',
  25: '603bc3841d72edba',
};

/**
 * Ce que le dédoublement du Collecteur ajoute à la sauvegarde — lot
 * BÂTIMENTS-QUATRE-ÉTATS, 08/09/2026.
 *
 * ⚠⚠ DOUZE OCTETS, ET LE COMPTE EST EXACT À LA LETTRE PRÈS. Le scénario pose
 * DEUX collecteurs ; `collecteur` fait onze caractères, `collecteurQuartz`
 * dix-sept et `collecteurScorie` dix-sept — soit +6 et +6. Rien d'autre n'entre
 * dans l'état : ni champ neuf, ni valeur, et c'est ce qui rend l'écart FIXE sur
 * les vingt-cinq graines. Un écart qui dépendrait de la partie voudrait dire
 * qu'un CONTENU a bougé, pas seulement un nom.
 *
 * ⚠ IL S'AJOUTE AUX PRÉCÉDENTS, il ne les remplace pas — même discipline que
 * `OCTETS_AJOUTES_PAR_RESERVE_BASE` : chaque terme dit ce que SON lot a coûté,
 * et la somme reste lisible ligne par ligne.
 */
export const OCTETS_AJOUTES_PAR_QUATRE_ETATS = 12;

/**
 * QUINZIÈME COUCHE — lot NEUTRALISATION, 08/09/2026, ET LA PLUS ÉTROITE DE
 * TOUTES : **DEUX couples sur 308**, et **UNE graine sur vingt-cinq**.
 *
 * ⚠⚠ ELLE NE PORTE QUE `rapports`, ET SEULEMENT AUX DEUX PHASES OÙ L'OUVRAGE
 * ATTAQUE. Le §6 arme les modules d'OFFENSE de l'Ouvrage — jusqu'ici
 * `montageDeLaBaseDuJoueur` posait `ouvrage: { offense: [] }` en dur —, donc ce
 * qui peut bouger est l'issue d'un raid SUBI, et rien d'autre. `economie`,
 * `disposition`, `garnison`, `armee`, `sitesEntames`, `poisAcquis`,
 * `satellites`, `basesRasees` et les treize autres champs tombent à l'octet sur
 * la capture d'origine ou sur la couche qui les portait déjà.
 *
 * ⚠⚠ ET L'ATTRIBUTION EST MESURÉE, PAS DÉDUITE. Le scénario plante sa base
 * rangée 200, où `niveauDeLaRangee` vaut **20** : les bases attaquantes sont
 * donc autour du PREMIER palier de `modulesOuvrageOffenseAu`, celui du
 * Flashbang. Vingt-quatre graines sur vingt-cinq ne voient rien changer — il
 * faut qu'une Meute soit tirée dans la vague ET qu'une infanterie du joueur
 * soit à sa portée. En remettant `offense: []` à la seule ligne du §6,
 * `test/bases.test.js` repasse **31 pass / 0 fail**, la suite entière comprise.
 *
 * ⚠ LES SIX PREMIÈRES PHASES SONT IDENTIQUES AU BIT, le premier raid MENÉ par
 * le joueur compris — et `p11_raidOuvrageApres` aussi : sur les vingt-cinq
 * graines, le raid de cette phase-là ne porte aucune Meute armée.
 */
export const DEPLACES_PAR_NEUTRALISATION = {
  p13_apresLeRaid: {
    rapports: 'e54ba003ea1bc5aa',
  },
  p14_sousLeFeu: {
    rapports: 'aa8915bd5cb8c64d',
  },
};

/**
 * Les vingt-cinq empreintes de graine après NEUTRALISATION.
 *
 * ⚠ VINGT-QUATRE SONT IDENTIQUES À CELLES DE BÂTIMENTS-QUATRE-ÉTATS, ET LA
 * VINGT-CINQUIÈME EST LA GRAINE 6. Le bloc est recopié en entier parce que
 * c'est la couche la plus récente qui fait foi ; la moitié qui prouve est celle
 * qui NE bouge PAS.
 */
export const EMPREINTES_PAR_GRAINE_NEUTRALISATION = {
  1: '756a5b25231e3890',
  2: 'cac165e55fd0aced',
  3: 'efa90125920867b2',
  4: '1d393acbd5d86d56',
  5: '885128cee867bd9c',
  6: '71b39c96e210cd2f',
  7: 'fb8d14674ef65ddb',
  8: '502f96879d3d82db',
  9: '358451aef3729e6e',
  10: '7b091a6cc4fac904',
  11: '38d09853285fd481',
  12: '88e509202eea56d9',
  13: '4987fa07186b2e35',
  14: 'c9be9ee4ddf1bff4',
  15: '7ada3fb04781eea3',
  16: 'ff998992ec29aa0f',
  17: '74938aa25aba757e',
  18: 'd47eb365880a9754',
  19: '7bc9d6aba6fc41d6',
  20: 'af0c75025e3c9552',
  21: '2343044cd4e67ec8',
  22: 'ef5d9ba6f15ad4e5',
  23: '2537e940124fc06f',
  24: 'ea9ca6ba3a451d66',
  25: '603bc3841d72edba',
};

// ---------------------------------------------------------------------------
// SEIZIÈME COUCHE — lot DISPOSITION-OUVRAGE, 08/09/2026
// ---------------------------------------------------------------------------
//
// ⚠⚠ POINT 9 D'ETHAN : « malgré un patch, toutes les bases Ouvrage restent
// identiques : les unités de défense sont au fond, tous les bâtiments au premier
// rang, et souche et étai restent au fond. » Les deux blocs FLOTTENT désormais
// dans leur bande au lieu d'être collés à son bord, et les colonnes des deux
// uniques se tirent.
//
// ⚠⚠ CINQUANTE-HUIT COUPLES SUR 308, ET **LES SIX PREMIÈRES PHASES SONT
// IDENTIQUES AU BIT**. C'est la mesure qui dit ce que le lot touche : la
// construction, l'économie, la garnison, l'armée et la carte ne bougent pas
// d'un caractère ; tout part de la phase 7, qui est le PREMIER RAID. Un site
// n'est plus disposé pareil, donc le raid ne rend plus le même rapport, donc
// les stocks, les satellites et l'armée qui en dépendent suivent.
//
// ⚠⚠ ET `disposition` N'EST PAS DANS LA LISTE, CE QUI EST LE FAIT LE PLUS
// PARLANT DE CETTE COUCHE. C'est la disposition de la BASE DU JOUEUR : elle est
// posée par les gestes du scénario, pas par `genererSite`. Les quinze couches
// précédentes en déplaçaient plusieurs par accident de flux ; celle-ci n'en
// déplace aucune, parce que le lot tire sur un SECOND flux salé — voir
// `placementDesRangees` — et ne recompose donc rien.
//
// ⚠ ET LES SCALAIRES NE BOUGENT QUE SUR LES DEUX RAPPORTS DE RAID. Gestes de
// construction, gestes d'armement, taille de la sauvegarde, cases atteignables,
// déplacement, nombre de bases attaquantes, nombre de cibles et cible retenue
// sont IDENTIQUES sur les vingt-cinq graines, et restent gardés contre les
// captures d'avant. Seule l'ISSUE d'un raid change.

export const DEPLACES_PAR_DISPOSITION_OUVRAGE = {
  p07_raidProcheApres: {
    sitesEntames: 'de1dd9dadd2f3733',
    rapports: '140e865e74906377',
    armee: '89122abc21f2d3a3',
    economie: '2b2dbaf27cf403cf',
    satellites: '19bd2cce2737a2f4',
    satellitesDetruits: 'f46a0f0f9f1961b8',
  },
  p08_100ticks: {
    sitesEntames: 'de1dd9dadd2f3733',
    rapports: '140e865e74906377',
    armee: '89122abc21f2d3a3',
    economie: '7b80bf592fc3c7b9',
    satellites: '19bd2cce2737a2f4',
    prochaineInstanceSatellite: '6909d921c42a6a0f',
    satellitesDetruits: 'f46a0f0f9f1961b8',
  },
  p09_deplace: {
    sitesEntames: 'de1dd9dadd2f3733',
    rapports: '140e865e74906377',
    armee: '89122abc21f2d3a3',
    economie: '7b80bf592fc3c7b9',
    satellites: '19bd2cce2737a2f4',
    prochaineInstanceSatellite: '6909d921c42a6a0f',
    satellitesDetruits: 'f46a0f0f9f1961b8',
  },
  p10_montee: {
    sitesEntames: 'de1dd9dadd2f3733',
    rapports: '140e865e74906377',
    armee: '89122abc21f2d3a3',
    economie: '7b80bf592fc3c7b9',
    satellites: '19bd2cce2737a2f4',
    prochaineInstanceSatellite: '6909d921c42a6a0f',
    satellitesDetruits: 'f46a0f0f9f1961b8',
  },
  p11_raidOuvrageApres: {
    recherche: '1d5ed7442bacef5a',
    sitesEntames: 'bb41999f3ba5810e',
    rapports: 'bca28e06d87c36fa',
    armee: '67f94e308208e939',
    economie: '7b80bf592fc3c7b9',
    satellites: '19bd2cce2737a2f4',
    prochaineInstanceSatellite: '6909d921c42a6a0f',
    satellitesDetruits: 'f46a0f0f9f1961b8',
  },
  p12_veilleDuRaid: {
    recherche: '1d5ed7442bacef5a',
    sitesEntames: '96977beccea9b8ed',
    rapports: 'bca28e06d87c36fa',
    armee: '67f94e308208e939',
    economie: '7b80bf592fc3c7b9',
    satellites: '69ea5ae286ec3e40',
    prochaineInstanceSatellite: '2529d6cb8eecff00',
    satellitesDetruits: 'f46a0f0f9f1961b8',
  },
  p13_apresLeRaid: {
    recherche: '1d5ed7442bacef5a',
    sitesEntames: '327db3d7b828464d',
    rapports: '6668e790e4144f46',
    armee: '67f94e308208e939',
    economie: 'b8bbf90359419a51',
    satellites: 'f63362e879a523b3',
    prochaineInstanceSatellite: '2e3ed9d766d07ec3',
    satellitesDetruits: 'f46a0f0f9f1961b8',
  },
  p14_sousLeFeu: {
    recherche: '1d5ed7442bacef5a',
    sitesEntames: 'dc1fcfa25fdd5a0a',
    rapports: '4ad6f7846dc604ae',
    armee: '67f94e308208e939',
    satellites: '75f168a8e685b30c',
    prochaineInstanceSatellite: 'cd4d61c347e3b2de',
    satellitesDetruits: 'f46a0f0f9f1961b8',
  },
};

export const EMPREINTES_PAR_GRAINE_DISPOSITION_OUVRAGE = {
  1: 'f58e4ace54ea9d4e',
  2: '574706ecb999655e',
  3: 'bf510ab482937a79',
  4: '05c2cd46401ec863',
  5: 'b2ce36555a69180b',
  6: '2a4f4f67625cdff7',
  7: '28f609479df9e283',
  8: '2f46167239e89312',
  9: '7dc78ae06b197fd3',
  10: '455e8c9b3173d73d',
  11: '3f9a46c6f465572f',
  12: '4bc4a725533b9612',
  13: 'b5632487645d5efb',
  14: '5289b79dfa3a32af',
  15: '0d3d1d21c1aaaa48',
  16: '91bc79b360cb682d',
  17: '5159b004cffee42a',
  18: '735258a03a8e22d7',
  19: '938303cbdde281e8',
  20: '1ab5dcb1bcd94763',
  21: '58a870464c9cf482',
  22: '113c44a575560236',
  23: '48110aa006076745',
  24: 'bf0aed79829848d9',
  25: '9a726277919184d0',
};

export const RAPPORTS_PROCHE_DISPOSITION_OUVRAGE = {
  1: '386260fc3098cbd2',
  2: '4aab576eede118e3',
  3: '8c9170ac3e4725ca',
  4: 'f7c609174dc507b4',
  5: '548fdde926afe3cc',
  6: '7c02329e65b3817a',
  7: 'f7a7595238fce537',
  8: 'eacf9677136428e0',
  9: '900cb7f9307f9069',
  10: '91a335b8d336fbcf',
  11: '686f573053a4337f',
  12: '9e333f0bbdf3483d',
  13: '928c9104df2576e6',
  14: 'ecedb64de7981808',
  15: '104d9d177437cec0',
  16: '0b0ae28fe5df23d2',
  17: '71e1a2b6ad4e1197',
  18: '1c47fe98645dc2b8',
  19: '84fce0652d99dda3',
  20: 'f53eb644a982c820',
  21: 'd179c49f4f387313',
  22: '42ffc07afe2e244d',
  23: 'aac6415ca57f9c83',
  24: 'aa478e361d170a9b',
  25: '5858b0b1650a4315',
};

export const RAPPORTS_OUVRAGE_DISPOSITION_OUVRAGE = {
  1: '6d088541049861ce',
  2: 'c037da0e1390d463',
  3: '37dc0740639261ba',
  4: '83d127fb70a2924b',
  5: 'bfbbac38dd014007',
  6: '9f62e26f0fc81ead',
  7: 'dd5e7715b89c3e12',
  8: '33d5e08193611891',
  9: '1999822d62100108',
  10: 'bf38590a74a1bdf1',
  11: '383b7488abffe3bb',
  12: '376ed44f01417be6',
  13: 'f74f974038182b74',
  14: '541fd16857955214',
  15: '6a03b9846114cc47',
  16: 'a9154caeb8df8334',
  17: '1c6f9ea6dc820861',
  18: '4727b5349e09b16e',
  19: '3338c71c2d65ff36',
  20: 'eb10ac0331aabf60',
  21: '73054c960f728632',
  22: 'b3b041c244be7f67',
  23: '536e2c5eca3370ca',
  24: '2b88d174afc35491',
  25: '8e52cc088e36d8d7',
};

// ---------------------------------------------------------------------------
// DIX-SEPTIÈME COUCHE — lot PAQUETS, 09/09/2026
// ---------------------------------------------------------------------------
//
// ⚠⚠ CINQUANTE-HUIT COUPLES, LES MÊMES CELLULES QUE LA SEIZIÈME, ET LES SIX
// PREMIÈRES PHASES SONT IDENTIQUES AU BIT. Le lot réécrit le placement d'un
// site de l'Ouvrage par paquets et retire ses tirages du flux de composition —
// donc la garnison de tout site change avec sa disposition, et rien ne se voit
// avant le PREMIER RAID (phase 7). `disposition` n'y est pas : c'est la base du
// JOUEUR, que le scénario pose lui-même.
//
// ⚠ ET AUCUN SCALAIRE NE BOUGE, mesuré graine par graine : gestes, gestes
// d'armement, taille de la sauvegarde, cases atteignables, déplacement, bases
// attaquantes, nombre de cibles et cible retenue des DEUX raids — 0 sur 25 pour
// chacun. Seules les empreintes des deux rapports changent, sur les
// vingt-cinq graines : c'est ce qui dit que le lot ne touche que le site, pas
// la carte ni la base du joueur.
//
// ⚠ ELLE SE LIT AU-DESSUS DE LA SEIZIÈME, sans la remplacer — même doctrine
// que les seize d'avant : on empile, on ne rafraîchit pas.

export const DEPLACES_PAR_PAQUETS = {
  p07_raidProcheApres: {
    sitesEntames: 'e146b3cc3322b3eb',
    rapports: 'c592badaa68f0a27',
    armee: '314fc451f9d028c5',
    economie: '851b3745a29f72d7',
    satellites: '567d377c89689497',
    satellitesDetruits: '172d111a29be7205'
  },
  p08_100ticks: {
    sitesEntames: 'e146b3cc3322b3eb',
    rapports: 'c592badaa68f0a27',
    armee: '314fc451f9d028c5',
    economie: '72abf5c165d52106',
    satellites: 'f2f83d3467654848',
    prochaineInstanceSatellite: '296d53eddf596f4d',
    satellitesDetruits: '172d111a29be7205'
  },
  p09_deplace: {
    sitesEntames: 'e146b3cc3322b3eb',
    rapports: 'c592badaa68f0a27',
    armee: '314fc451f9d028c5',
    economie: '72abf5c165d52106',
    satellites: 'f2f83d3467654848',
    prochaineInstanceSatellite: '296d53eddf596f4d',
    satellitesDetruits: '172d111a29be7205'
  },
  p10_montee: {
    sitesEntames: 'e146b3cc3322b3eb',
    rapports: 'c592badaa68f0a27',
    armee: '314fc451f9d028c5',
    economie: '72abf5c165d52106',
    satellites: 'f2f83d3467654848',
    prochaineInstanceSatellite: '296d53eddf596f4d',
    satellitesDetruits: '172d111a29be7205'
  },
  p11_raidOuvrageApres: {
    recherche: '70d071a438fac79b',
    sitesEntames: '626b400308ec5830',
    rapports: 'e28c30b47101fbba',
    armee: '4b63a8a5d866fcd6',
    economie: '72abf5c165d52106',
    satellites: 'f2f83d3467654848',
    prochaineInstanceSatellite: '296d53eddf596f4d',
    satellitesDetruits: '172d111a29be7205'
  },
  p12_veilleDuRaid: {
    recherche: '70d071a438fac79b',
    sitesEntames: '8f6d638379acc4bf',
    rapports: 'e28c30b47101fbba',
    armee: '4b63a8a5d866fcd6',
    economie: '72abf5c165d52106',
    satellites: '9a0ca35b596e55bd',
    prochaineInstanceSatellite: 'e68bc29651f0db1e',
    satellitesDetruits: '172d111a29be7205'
  },
  p13_apresLeRaid: {
    recherche: '70d071a438fac79b',
    sitesEntames: 'f920044071be9248',
    rapports: '3d6d454f3e32ed8a',
    armee: '4b63a8a5d866fcd6',
    economie: '334ba75fbd924d40',
    satellites: 'ed08c85e2080f28c',
    prochaineInstanceSatellite: '9e3e02dda456d3cf',
    satellitesDetruits: '172d111a29be7205'
  },
  p14_sousLeFeu: {
    recherche: '70d071a438fac79b',
    sitesEntames: '050119e999e88770',
    rapports: '16c32d8a22d8d7a0',
    armee: '4b63a8a5d866fcd6',
    satellites: '9339d8d7ae91ea9d',
    prochaineInstanceSatellite: '47461cc06179cc35',
    satellitesDetruits: '172d111a29be7205'
  }
};

export const EMPREINTES_PAR_GRAINE_PAQUETS = {
  1: 'a43079a39f36f89e',
  2: 'd6b36c5c28f58aa9',
  3: '9c8094be4453c8f8',
  4: 'b89e661180f5b8ee',
  5: '95b189840bd9b6b9',
  6: '9c3d780f88e689c9',
  7: '722e03bd632e2715',
  8: '3d5bae4d55cdffdd',
  9: '43ec65bbab1123df',
  10: '968554dc24b2ab9a',
  11: 'cc263848a90f1a32',
  12: 'c974218a2da314d4',
  13: 'fe934a07ca9adb19',
  14: 'd4124dd992e346da',
  15: 'e87f687bc9007293',
  16: 'e2552dd28820ba20',
  17: '0b0ea02ffee6f45f',
  18: '830386c0a15faad5',
  19: '41a4de2a7a6991da',
  20: 'c36ed03b6ed665cb',
  21: '1fe80a1d24a5f1f3',
  22: '49ac9ed04aa5b3e3',
  23: '48492120e7cfd883',
  24: 'f8aafbe4287bd068',
  25: '3db13934df10a755'
};

export const RAPPORTS_PROCHE_PAQUETS = {
  1: '900d8fca75c834b5',
  2: 'e7943e37a49e8d3d',
  3: '8c7bd39275bdd8ef',
  4: 'f4a25d542be86fb0',
  5: '4805e95749334a2e',
  6: '2f28f93b26bc713d',
  7: '9cd825e90b0b64f6',
  8: '16410a8b2f21006c',
  9: '68115be2e1002fa6',
  10: 'b52f874193f96d3f',
  11: '94e4f1fab128cead',
  12: 'da7479bfd064011d',
  13: '418f15baab5d8613',
  14: 'd65821d2df3ad5a2',
  15: '2c68872208af84b9',
  16: '9598125b2621bc00',
  17: '1f265bfeff987cab',
  18: '776a9d748a5002bb',
  19: 'f2f65431b33dc690',
  20: 'b795e794f23edd7f',
  21: '288362ecde14ba53',
  22: '7bc26c3f69ebd09b',
  23: 'ede34e5b0220babb',
  24: 'e05a8ebf170309aa',
  25: '0225682fdb7b05f8'
};

export const RAPPORTS_OUVRAGE_PAQUETS = {
  1: 'a06ff13d9635abad',
  2: 'e80f0fa8a5446db9',
  3: '7ec7e73b6c0e951a',
  4: 'd7eac71ed68786c4',
  5: 'e0894e7b1c148d04',
  6: '3e70d3682716d489',
  7: '36360a5b4bd2cf23',
  8: 'ba2268b7f17c8146',
  9: 'aac5f2f020ebfb26',
  10: '11f7bd5122da3933',
  11: '94acaea481c25384',
  12: 'e1e8b508678f41ce',
  13: 'cd3848d47976e52d',
  14: 'ece241d4f76b8889',
  15: 'b266eba8d80ce66d',
  16: 'e41276e7bccf5bde',
  17: '7407fa946fed77cf',
  18: 'a50df11a4aa9b61a',
  19: '4770a63c45105fad',
  20: '07b9df362058da66',
  21: 'eac07a9de208c67f',
  22: 'b706f73758155409',
  23: '83093bc03ed373b9',
  24: '78f4edf69e69cd41',
  25: 'bba397b690e08c80'
};

/**
 * DIX-HUITIÈME COUCHE — lot RÈGLES-DE-CARTE, 10/09/2026.
 *
 * ⚠⚠ SEPT COUPLES SUR 350, ET LES DIX PREMIÈRES PHASES SONT IDENTIQUES AU BIT.
 * Deux champs seulement bougent — `attaque` et `rapports` —, et seulement à
 * partir de la phase 11, celle du raid LOINTAIN. C'est la signature exacte du
 * point 8 d'Ethan : le prix d'un raid lit désormais ce que la CARTE peint,
 * planchers compris, et non plus l'octogone géométrique autour des bases du
 * joueur. La cible du scénario est à la rangée 201, en plein territoire de
 * l'Ouvrage : elle tombait dans l'octogone allié et se payait au tarif de chez
 * soi. `attaque` porte les points dépensés, `rapports` le raid qui a suivi.
 *
 * ⚠⚠ ET LE RAID DE PROXIMITÉ, LUI, NE BOUGE PAS — les phases 7 à 10 tombent à
 * l'octet. Il vise un CAMP du joueur à une case de sa base, que la carte peint
 * au joueur des deux côtés de la règle : le tarif ne change pas. C'est cette
 * moitié-là qui dit que le lot ne renchérit pas tout, mais seulement ce que la
 * carte contredisait.
 *
 * ⚠ HUIT CHAMPS PAR BASE NE BOUGENT PAS DU TOUT, sur les quatorze phases —
 * `position`, `dernierDeplacementTick`, `disposition`, `economie`, `garnison`,
 * `armee`, `satellites`, `sitesEntames`. Le déplacement de la phase 9 tombe sur
 * la MÊME case qu'avant : le refus `territoire-ennemi` ne mord pas au départ, où
 * la garde du peuplement écarte l'Ouvrage de quinze cases. Et le barème du délai
 * ne se lit qu'au SECOND déplacement, que le scénario ne fait pas.
 */
export const DEPLACES_PAR_REGLES_DE_CARTE = {
  "p11_raidOuvrageApres": {
    "attaque": "bb862f0d944d5f66",
    "rapports": "7e2fe82f61410618"
  },
  "p12_veilleDuRaid": {
    "attaque": "c6c207fcc5ffc4d5",
    "rapports": "7e2fe82f61410618"
  },
  "p13_apresLeRaid": {
    "attaque": "a26820f08296abf9",
    "rapports": "80c5e72cf09408f4"
  },
  "p14_sousLeFeu": {
    "rapports": "f69cf79dd0727486"
  }
};

/** Les vingt-cinq empreintes par graine, après la dix-huitième couche. */
export const EMPREINTES_PAR_GRAINE_REGLES_DE_CARTE = {
  "1": "00246443efd8131a",
  "2": "e013afca1b7f81aa",
  "3": "fdb5dc33f2788d9f",
  "4": "b2e4ca7b902d5928",
  "5": "078ad59041e03a4c",
  "6": "d800f4fc09a1818a",
  "7": "e1924e87f593c01b",
  "8": "1069fce66c7050d0",
  "9": "d563b196169aed4c",
  "10": "2e9b602540f67ed0",
  "11": "cbda64b923b7e0e7",
  "12": "489bc1d81b590f1d",
  "13": "4aa2b35f4d431d2d",
  "14": "9160b8b306f36149",
  "15": "0a8f2158858e20cd",
  "16": "e6805c818fd96d79",
  "17": "24dbdf0c2fc999ca",
  "18": "250a3bacc972f980",
  "19": "0c342a36baa9075e",
  "20": "32fa1c9272141a66",
  "21": "d08aa8112a81819e",
  "22": "c4597fac22ac65b5",
  "23": "7d852ae5211c6500",
  "24": "e2acb877ef6816a5",
  "25": "3145aff31b69efc0"
};

/**
 * Ce que le champ neuf coûte à la sauvegarde — un nombre FIXE.
 *
 * ⚠ TRENTE-SIX OCTETS, LE MÊME NOMBRE QUE `reserveReparationBatiments` AU LOT
 * RÉSERVE-BASE, ET POUR LA MÊME RAISON : c'est la longueur exacte de
 * `,"dernierDeplacementDelaiTicks":null`. Il est le même sur les vingt-cinq
 * graines — si l'écart dépendait de la partie, c'est qu'un CONTENU aurait bougé
 * et pas seulement la forme. Il s'AJOUTE aux termes précédents au lieu de les
 * remplacer : chacun dit ce que son lot a coûté, et la somme reste lisible
 * ligne par ligne.
 */
export const OCTETS_AJOUTES_PAR_REGLES_DE_CARTE = 36;

/**
 * Ce que le lot RAID-ET-ÉCRAN ajoute à la sauvegarde — 10/09/2026.
 *
 * ⚠ UN SEUL CHAMP, À LA RACINE ET NON PAR BASE, ET IL VAUT `null` DANS CE
 * SCÉNARIO. `,"formationRetenue":null` fait **vingt-quatre octets** — le
 * scénario du témoin n'ouvre aucun écran de raid, donc rien n'y est retenu.
 * C'est le nombre le plus petit qu'un champ neuf puisse coûter, et il est FIXE
 * sur les vingt-cinq graines : si l'écart dépendait de la partie, c'est qu'une
 * formation s'y serait rangée toute seule.
 *
 * ⚠ IL S'AJOUTE AUX CINQ PRÉCÉDENTS AU LIEU DE LES REMPLACER — chacun dit ce que
 * SON lot a coûté, et la somme reste lisible ligne par ligne.
 */
export const OCTETS_AJOUTES_PAR_RAID_ET_ECRAN = 24;

/**
 * Les vingt-cinq empreintes du rapport du raid LOINTAIN, dix-huitième couche.
 *
 * ⚠⚠ VINGT-CINQ SUR VINGT-CINQ, ET LE RAID DE PROXIMITÉ ZÉRO SUR VINGT-CINQ.
 * C'est l'attribution la plus nette du lot : le raid lointain vise la rangée
 * 201, en plein territoire de l'Ouvrage, donc son prix change et le rapport avec
 * lui ; le raid de proximité vise un camp du joueur à une case de sa base, que la
 * carte peint au joueur des deux côtés de la règle. `RAPPORTS_PROCHE_PAQUETS`
 * reste donc en vigueur, non surchargé — c'est cette moitié-là qui dit que le
 * lot ne renchérit pas tout, mais seulement ce que la carte contredisait.
 */
export const RAPPORTS_OUVRAGE_REGLES_DE_CARTE = {
  "1": "1927fee1d7a71cc5",
  "2": "088dbfcf72a1057e",
  "3": "9556113339699928",
  "4": "0e346e39fc9dae49",
  "5": "533060bb159aa7c9",
  "6": "f0016f3b09e37c62",
  "7": "60807aefb662ebda",
  "8": "29649932f7c41046",
  "9": "3383db5341b4d8af",
  "10": "5605a1742e7ef9d2",
  "11": "c896bb201ff786ac",
  "12": "9a378a5837cbeae3",
  "13": "9b7120493e701c53",
  "14": "29a3c41f7023952c",
  "15": "67438190db08c082",
  "16": "f24a6584c61eb655",
  "17": "0a8906977e77b277",
  "18": "1a2c27c81dbe07af",
  "19": "e71fbc788ee1cc08",
  "20": "59478888f49168bc",
  "21": "c0f818e6a455300c",
  "22": "3edb39263348ea9d",
  "23": "041e3f9ab015b30e",
  "24": "79819a92f985fd6a",
  "25": "875e50c49d08add3"
};

/**
 * DIX-NEUVIÈME COUCHE — LOT MUR, 10/09. Ce que les deux règles du mur déplacent
 * dans le scénario des vingt-cinq graines, phase par phase et champ par champ.
 *
 * ⚠⚠ HUIT PHASES, VINGT COUPLES SUR 350, ET LES SIX PREMIÈRES PHASES SONT
 * IDENTIQUES AU BIT. Le scénario ne combat pas avant son premier raid, à la
 * phase 7 : tout ce que le lot change est DANS le combat, et rien n'en fuit
 * avant. C'est la moitié qui prouve que ni l'économie, ni la pose, ni le tirage
 * de carte n'ont bougé.
 *
 * ⚠⚠ ET CE QUE CETTE COUCHE NE PORTE PAS EST AUSSI IMPORTANT QUE CE QU'ELLE
 * PORTE : `gestes`, `gestesArmer`, `tailleSauvegarde`, `nbCasesAtteignables`,
 * `deplacement`, `nbAttaquantes`, le nombre de cibles, la cible retenue, la
 * non-fuite et l'exactitude de la simulation sont IDENTIQUES sur les vingt-cinq
 * graines et restent gardés contre les captures d'avant. Mesuré, pas supposé :
 * les deux SEULS scalaires qui bougent sont les deux empreintes de rapport de
 * raid. `SAVE_VERSION` reste à 31 sur cette base-là.
 */
export const DEPLACES_PAR_MUR = {
 "p07_raidProcheApres": {
  "rapports": "3f7f00dee4891981"
 },
 "p08_100ticks": {
  "rapports": "3f7f00dee4891981"
 },
 "p09_deplace": {
  "rapports": "3f7f00dee4891981"
 },
 "p10_montee": {
  "rapports": "3f7f00dee4891981"
 },
 "p11_raidOuvrageApres": {
  "recherche": "166f96ff35f3d88b",
  "sitesEntames": "e2565c3d128bc8ab",
  "rapports": "ee3e98a01cf7691e",
  "armee": "fe40a072c6e7d4f0"
 },
 "p12_veilleDuRaid": {
  "recherche": "166f96ff35f3d88b",
  "sitesEntames": "d8928f8eacc86afe",
  "rapports": "ee3e98a01cf7691e",
  "armee": "fe40a072c6e7d4f0"
 },
 "p13_apresLeRaid": {
  "recherche": "166f96ff35f3d88b",
  "sitesEntames": "033c8f0a5d30e465",
  "rapports": "8fa8c2761642f742",
  "disposition": "23a628bd56e48b32",
  "armee": "fe40a072c6e7d4f0"
 },
 "p14_sousLeFeu": {
  "recherche": "166f96ff35f3d88b",
  "rapports": "72c04cdd82052e3d",
  "armee": "fe40a072c6e7d4f0"
 }
};

/**
 * Les empreintes par graine, après la dix-neuvième couche.
 *
 * ⚠⚠ VINGT-DEUX SUR VINGT-CINQ, ET TROIS NE BOUGENT PAS — 15, 21, 24. Les
 * dix-huit couches d'avant en déplaçaient vingt-cinq sur vingt-cinq dès qu'elles
 * touchaient au raid ; celle-ci en laisse trois à l'octet, et c'est une mesure
 * utile : sur ces parties-là, aucune unité anti-structure ne croise de mur et
 * aucune colonne ne bute. Elles restent gardées contre
 * `EMPREINTES_PAR_GRAINE_REGLES_DE_CARTE`.
 */
export const EMPREINTES_PAR_GRAINE_MUR = {
 "1": "5c2059f6492668ab",
 "2": "bd53b174f38e5456",
 "3": "7e1d6dcb81f48ce3",
 "4": "cde61dbc2cb673f4",
 "5": "0f5631574f0ec7c3",
 "6": "033d9e0ff9d1876e",
 "7": "f07ba4272e0f3286",
 "8": "f8ffad77f203391e",
 "9": "7bf6b59364bbfd7d",
 "10": "2d711dadde9a8d31",
 "11": "398805a191224307",
 "12": "84749aa97cccde2f",
 "13": "dc6e58d2de5e0daa",
 "14": "4c73f488699fe011",
 "16": "e085f8878ad64777",
 "17": "0138408f7d2fc8a7",
 "18": "07950cdc8cd7f9b6",
 "19": "a59290e58d6877da",
 "20": "2a92c900e6109e88",
 "22": "00b5f5f81bc37933",
 "23": "efdd78ce1a160ef0",
 "25": "77cc4faa929431e4"
};

/**
 * Les empreintes du rapport du raid de PROXIMITÉ, dix-neuvième couche.
 *
 * ⚠⚠ DIX SUR VINGT-CINQ SEULEMENT, ET C'EST L'ÉCRASEUR QUI FAIT CE NOMBRE-LÀ.
 * Mesuré sur la variante naïve du lot — celle où `progresse` reste vrai devant
 * un mur et où le forçage n'est jamais calculé —, ce même compte valait **23 sur
 * 25** : sans brèche, la moitié des raids se traînait autrement. La correction
 * du §3.2 les ramène sur la couche d'avant. Les quinze qui ne bougent pas
 * restent gardées contre `RAPPORTS_PROCHE_PAQUETS`.
 */
export const RAPPORTS_PROCHE_MUR = {
 "3": "80118000ef991306",
 "5": "9c5cb967524cf21b",
 "6": "97e2ee4ada6da87f",
 "7": "50c94d62632b0f19",
 "8": "cc4c126d2ca0f705",
 "9": "04de7994ced02533",
 "13": "5ed3798c74a0387b",
 "16": "ce62b041069d4c5d",
 "20": "f76ade54c5e2ce61",
 "22": "405c6d0268dc2440"
};

/**
 * Les empreintes du rapport du raid de l'OUVRAGE, dix-neuvième couche.
 *
 * ⚠ QUATRE SUR VINGT-CINQ. Le raid de l'Ouvrage frappe la base du JOUEUR, dont
 * la garnison est ce que le scénario a posé — quatre escouades et deux ouvrages,
 * sans mur ni barrière sur la plupart des graines. Les vingt et une autres
 * restent gardées contre les couches d'avant.
 */
export const RAPPORTS_OUVRAGE_MUR = {
 "1": "9f795470ee127d62",
 "13": "32449f44fb3207e0",
 "14": "7bf9e142b36a56a5",
 "25": "774365ba1ed2e630"
};


/**
 * ⚠⚠ VINGTIÈME COUCHE — lot APPROCHE, 11/09. **Trente-cinq couples sur 350**, et
 * les SIX PREMIÈRES PHASES sont identiques AU BIT : le scénario ne combat pas
 * avant son premier raid, et tout ce que le lot change est le POINT D'ENTRÉE
 * d'une vague — elle naît en rangée 0, sous la grille, et joue deux cases avant
 * d'atteindre la défense.
 *
 * ⚠⚠ ET LA PREUVE D'INVARIANCE A ÉTÉ FAITE AVANT LA COUCHE, comme le §4.1 du
 * brief l'exige : avec l'ancien point d'apparition ÉCRIT EXPLICITEMENT dans les
 * montages, `bases.test.js` rend **30 pass / 0 fail** et `journal.test.js`
 * **11 pass / 0 fail** — 0 écart des deux côtés. Le lot n'a donc rien changé
 * d'autre que l'entrée, et c'est ce qui autorise à surcharger plutôt qu'à
 * chercher un défaut.
 *
 * ⚠ AUCUN SCALAIRE NE BOUGE — ni les gestes de construction, ni ceux
 * d'armement, ni la taille de la sauvegarde, ni les cases atteignables, ni le
 * déplacement, ni le nombre de bases attaquantes, ni le nombre de cibles, ni la
 * cible retenue. Mesuré sur les vingt-cinq graines : c'est cette moitié-là qui
 * dit que le lot ne touche ni la carte, ni l'économie, ni la pose.
 */
export const DEPLACES_PAR_APPROCHE = {
  p07_raidProcheApres: {
    sitesEntames: '1087482c230abab8',
    rapports: '357d4d9f7e7ddc91',
    armee: 'd009211511b55e44',
    economie: '892c0be72432f7ba',
  },
  p08_100ticks: {
    sitesEntames: '1087482c230abab8',
    rapports: '357d4d9f7e7ddc91',
    armee: 'd009211511b55e44',
    economie: '26ef0ade9eb89f58',
  },
  p09_deplace: {
    sitesEntames: '1087482c230abab8',
    rapports: '357d4d9f7e7ddc91',
    armee: 'd009211511b55e44',
    economie: '26ef0ade9eb89f58',
  },
  p10_montee: {
    sitesEntames: '1087482c230abab8',
    rapports: '357d4d9f7e7ddc91',
    armee: 'd009211511b55e44',
    economie: '26ef0ade9eb89f58',
  },
  p11_raidOuvrageApres: {
    recherche: '3c3759a36fdfb6c0',
    sitesEntames: 'b0903f96fe000695',
    rapports: 'd7f542d6c313fe6d',
    armee: 'afa362fed16da647',
    economie: '26ef0ade9eb89f58',
  },
  p12_veilleDuRaid: {
    recherche: '3c3759a36fdfb6c0',
    sitesEntames: 'e807e56b5a257ba4',
    rapports: 'd7f542d6c313fe6d',
    armee: 'afa362fed16da647',
    economie: '26ef0ade9eb89f58',
  },
  p13_apresLeRaid: {
    recherche: '3c3759a36fdfb6c0',
    sitesEntames: 'dacdd2df4c00cd10',
    rapports: '568311b66da27563',
    armee: 'afa362fed16da647',
    economie: '1d190e1126b8a87d',
  },
  p14_sousLeFeu: {
    recherche: '3c3759a36fdfb6c0',
    sitesEntames: '215f43185db4d62b',
    rapports: '9b3802b67951994e',
    armee: 'afa362fed16da647',
  },
};


/**
 * ⚠ LES VINGT-CINQ GRAINES BOUGENT, et c'est attendu : la phase 7 porte un raid
 * sur toute graine, et tout attaquant entre désormais deux cases plus bas. Le
 * `??` de `bases.test.js` reste NÉCESSAIRE pour les couches d'avant, qui, elles,
 * n'en déplaçaient pas toujours vingt-cinq.
 */
export const EMPREINTES_PAR_GRAINE_APPROCHE = {
  1: '27e5c3c507a0a16c',
  2: '35ae227e105d3439',
  3: '80a765f5ece15cab',
  4: 'c756d67a288c4a5d',
  5: '100f9b49fa7e7e2c',
  6: 'f79a4f7b92685dc5',
  7: 'f5996df4ab1be9d6',
  8: '94a3e62f878dbcfb',
  9: '9791c230bae85aba',
  10: '18ae6222fdcc9116',
  11: '9f8c780676da3650',
  12: '8afb69b13d68e882',
  13: '9d4c1838ecfc9112',
  14: '95096779353a4e82',
  15: '17aa334daad47f00',
  16: 'c22906dc33098ce4',
  17: 'dd36183d7dc36fe9',
  18: '1de0f95a6211eb2a',
  19: 'b72946bcfb78cbd9',
  20: '9e6f78768ddebd0f',
  21: 'd9f0c428e1e33369',
  22: '6d348b3b22f54e17',
  23: 'e4a768201b93b09a',
  24: 'bce6c2f0624b068f',
  25: '750e84f97f962d89',
};


/**
 * ⚠⚠ LES DEUX RAIDS BOUGENT SUR LES VINGT-CINQ GRAINES, ET C'EST LE PROPRE DE CE
 * LOT-CI. Les couches d'avant déplaçaient l'un ou l'autre selon ce qu'elles
 * touchaient — le lot MUR n'en déplaçait que 4 sur 25 côté Ouvrage, parce que la
 * base du joueur n'a pas de murs. Ici le changement porte sur l'ENTRÉE d'une
 * vague, et les deux camps entrent par la même porte : le raid du joueur sur un
 * camp comme le raid de l'Ouvrage sur la base du joueur.
 */
export const RAPPORTS_PROCHE_APPROCHE = {
  1: '952671367b79f606',
  2: 'e1f745586aca1d27',
  3: 'b5b7441d87d24cb5',
  4: '04505cbcea6c3964',
  5: 'abf00b6d5f603309',
  6: '6254ae0a1ed420d6',
  7: 'd255b5917314da16',
  8: 'b87404e99a19af11',
  9: '2bd4f19d76a007b3',
  10: 'a233c0f03c451389',
  11: '64fff59d6b9143c6',
  12: '575012b851252597',
  13: '1582bd7150674709',
  14: 'cb0c8a4cd7b03434',
  15: '764c6dbef389f9e0',
  16: '2062e6757b43720c',
  17: '207ebcd4052d7add',
  18: '3dd75ed252baf319',
  19: '590942b65946ae58',
  20: '5bc714b0e98fd820',
  21: 'a05a5cf44d2da5aa',
  22: '2cdac8d75996b358',
  23: '3975370c158e2026',
  24: '2613059c78c718c7',
  25: '6a52aa5b193ea59a',
};


/** ⚠ Voir le pavé de `RAPPORTS_PROCHE_APPROCHE` : les deux camps entrent par la
 *  même porte, donc les deux rapports bougent sur les vingt-cinq graines. */
export const RAPPORTS_OUVRAGE_APPROCHE = {
  1: '879f141d09172211',
  2: 'd294ff718033541e',
  3: '4636330f2098493d',
  4: '52ec836c77697e52',
  5: 'b7216f07dbb5ec48',
  6: 'e5605a092db59dd2',
  7: 'b6ecddf51041cd48',
  8: '049c9f57a48008a0',
  9: '251196d7311bbd96',
  10: 'fe17f32e9546af53',
  11: 'cc8d0e5164eaf997',
  12: 'd73a441de1f99022',
  13: '2c4023127a2cd418',
  14: 'abab49a0285dc434',
  15: '13707030f27d2344',
  16: '225b614bea058a01',
  17: '4067e41f9a2b0491',
  18: 'cdad184e5d81ef46',
  19: '4feab1f4742e5373',
  20: '4c066309d6a1c7b3',
  21: 'ddd51f07ce844a31',
  22: 'ddef744df5aa0629',
  23: '4c4839b980989e4a',
  24: '8e262b7101355f72',
  25: '29fc853237ed8ecd',
};
