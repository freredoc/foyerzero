// LES EMPREINTES DE DEUX CENTS COMBATS, RELEVÉES SUR `origin/main` AVANT LE LOT
// JOURNAL-DE-COMBAT — ce n'est pas un test, c'est sa RÉFÉRENCE.
//
// ⚠⚠ ET ELLE NE SE RAFRAÎCHIT PAS. C'est tout ce qui fait sa valeur : un témoin
// régénéré par la même main que le code suivrait l'erreur qu'il devrait
// attraper. Celui-ci a été capturé au commit `68eb0ac`, dans un worktree du
// dépôt AVANT que `src/sim/combat.js` ne gagne une ligne — donc la comparaison
// n'oppose pas deux exécutions du même code, ce que la preuve d'additivité
// exige. Même motif que `test/temoins-bases-0.js`.
//
// ⚠⚠ CE QU'ELLE PROUVE : le journal ne change AUCUN résultat de combat. Le lot
// ne calcule rien de neuf — `tir` construisait déjà son tampon, `retirerLesMorts`
// basculait déjà `vivant`, `apparitionDeVague` faisait déjà entrer une vague —,
// il cesse seulement de les jeter. Neuf champs par combat, et les neuf sont
// comparés : deux empreintes, la cause, le tick de fin, le butin, les points de
// recherche, les PV restants par famille et les destructions par famille.
//
// ⚠ L'EMPREINTE D'ÉTAT EST PRISE SANS `journal` NI `vaguesPosees`, et il fallait
// le dire : ces deux champs sont la SORTIE NEUVE du lot, les comparer au témoin
// d'avant n'aurait aucun sens. Tout le reste de l'état y est.
//
// ⚠ ET LES DEUX EMPREINTES SONT TRONQUÉES À 32 CARACTÈRES, soit 128 bits. Une
// collision fortuite sur deux cents lignes est hors de portée, et le fichier
// pèse la moitié.
//
// Colonnes : nom · sha(résultat) · sha(état) · cause · tick · butin · points ·
// PV restants bâtiments/défenses/attaquants · détruits bâtiments/défenses/attaquants
export const TEMOINS_COMBAT = [
  ["camp/richeQuartz/n5/g1/toutes","361753123576e2e40e67a17624d077eb","7a287044e7ae9247a9ab5815bbdacf00","souche",248,"{\"quartz\":10175,\"scorie\":3391}","8971","5124000/2708400/20496000","5/0/0"],
  ["camp/richeQuartz/n5/g1/moitie","ea8993a808140a1ac26600768218c398","70d0343d814db1a2138d8247b017160a","attaquants",445,"{\"quartz\":3391,\"scorie\":1130}","0","14640000/3074400/7978800","3/0/0"],
  ["camp/richeScorie/n5/g1/toutes","361753123576e2e40e67a17624d077eb","b6d14aee9b5c624f8cd9f736b7dca574","souche",248,"{\"quartz\":3391,\"scorie\":10175}","8971","5124000/2708400/20496000","5/0/0"],
  ["camp/richeScorie/n5/g1/moitie","ea8993a808140a1ac26600768218c398","deec478473bdb218b6546bf0c5f5d065","attaquants",445,"{\"quartz\":1130,\"scorie\":3391}","0","14640000/3074400/7978800","3/0/0"],
  ["avantPoste/richeQuartz/n5/g1/toutes","8ebdb1ea76af22e3d755041aa8fa4765","42d1efa985a8cc04eea57db8415925e0","souche",298,"{\"quartz\":42256,\"scorie\":14085}","25120","5856000/4099200/19425010","7/1/0"],
  ["avantPoste/richeQuartz/n5/g1/moitie","5a4474108fb66505666a204b8bfad27b","9a6537f747cefca55f39603ca50cbaf5","attaquants",451,"{\"quartz\":21702,\"scorie\":7234}","25120","16059264/4099200/7723195","4/1/0"],
  ["avantPoste/richeScorie/n5/g1/toutes","8ebdb1ea76af22e3d755041aa8fa4765","9e697f4e6f02e283182d5b44236abcfe","souche",298,"{\"quartz\":14085,\"scorie\":42256}","25120","5856000/4099200/19425010","7/1/0"],
  ["avantPoste/richeScorie/n5/g1/moitie","5a4474108fb66505666a204b8bfad27b","34b656f4b0240857b63f623ef63ffb40","attaquants",451,"{\"quartz\":7234,\"scorie\":21702}","25120","16059264/4099200/7723195","4/1/0"],
  ["base/-/n5/g1/toutes","903380c83a22339d5568da3392a16546","5987c44055605342ffef654fb729b8a2","souche",331,"{\"quartz\":10552,\"scorie\":9044}","53469","5856000/3967440/18918519","8/2/1"],
  ["base/-/n5/g1/moitie","3534fd8e58fdbc17b113b01cbb3350e0","7f12044ab71a4b2cf82ca6de564746d4","attaquants",451,"{\"quartz\":2989,\"scorie\":2989}","43206","22033200/4386144/6473482","2/1/1"],
  ["camp/richeQuartz/n20/g1/toutes","32cc19ba86a613386fa58e2c1d42919a","8490b8d678cc394171b1a91f8787a47b","attaquants",762,"{\"quartz\":592768,\"scorie\":197589}","10714754","56308928/50031212/58335746","9/7/3"],
  ["camp/richeQuartz/n20/g1/moitie","a25bc722a71b2fcda61dbb4d32b6664c","137edb8fbb2f2c73fe5a2ebe28852510","attaquants",461,"{\"quartz\":234254,\"scorie\":78084}","3374029","128741800/67923649/21007672","3/3/2"],
  ["camp/richeScorie/n20/g1/toutes","32cc19ba86a613386fa58e2c1d42919a","0d98de2608cdcb769a5783577ac745a7","attaquants",762,"{\"quartz\":197589,\"scorie\":592768}","10714754","56308928/50031212/58335746","9/7/3"],
  ["camp/richeScorie/n20/g1/moitie","a25bc722a71b2fcda61dbb4d32b6664c","7437db7f523e45f0709f5b152b3c1119","attaquants",461,"{\"quartz\":78084,\"scorie\":234254}","3374029","128741800/67923649/21007672","3/3/2"],
  ["avantPoste/richeQuartz/n20/g1/toutes","5e244dd963165762e310f8f1e0ab5959","0fe2ed49772732d89fa61f1beb2c2903","attaquants",536,"{\"quartz\":1287252,\"scorie\":429084}","16519876","165174981/68112239/45607990","5/9/4"],
  ["avantPoste/richeQuartz/n20/g1/moitie","b0e3d2a2879075865a52a14ceba712b2","3d0511ad84ba04006796741d6649524e","attaquants",497,"{\"quartz\":4618,\"scorie\":1539}","11030545","210752470/117427200/2501012","0/5/6"],
  ["avantPoste/richeScorie/n20/g1/toutes","5e244dd963165762e310f8f1e0ab5959","36d6ff7bd78c56ea0a16bd95113f3be9","attaquants",536,"{\"quartz\":429084,\"scorie\":1287252}","16519876","165174981/68112239/45607990","5/9/4"],
  ["avantPoste/richeScorie/n20/g1/moitie","b0e3d2a2879075865a52a14ceba712b2","d66b3e60559bd6ab1253e0375d1694b7","attaquants",497,"{\"quartz\":1539,\"scorie\":4618}","11030545","210752470/117427200/2501012","0/5/6"],
  ["base/-/n20/g1/toutes","14512b19e371cbc95c6c5a272286d374","e02284a2d0c81c1a0be250846a4f491d","attaquants",785,"{\"quartz\":738269,\"scorie\":487667}","21193347","109668154/72126827/42022540","14/12/7"],
  ["base/-/n20/g1/moitie","6da450f2c3be811b38f307554274c38c","c09fb2090ea4f5770aa03f17df6fdd58","attaquants",552,"{\"quartz\":1056,\"scorie\":1056}","13236654","226013789/105806800/2778998","0/7/6"],
  ["camp/richeQuartz/n35/g1/toutes","d4a091c56d481b97967dfab978f5abc7","d6e3a219e60f722e19926a45a83bbe55","attaquants",623,"{\"quartz\":17079609,\"scorie\":5693203}","1492607625","725088876/332045493/100802963","4/8/9"],
  ["camp/richeQuartz/n35/g1/moitie","cbb00ec3335f668cba4152c625697cec","5e9f2cb0193367dee518cc48bd7f84cd","attaquants",637,"{\"quartz\":135227,\"scorie\":45075}","1089211611","854316948/394129632/19013237","0/6/5"],
  ["camp/richeScorie/n35/g1/toutes","d4a091c56d481b97967dfab978f5abc7","64ebc0816aed9e12139120c704aaf921","attaquants",623,"{\"quartz\":5693203,\"scorie\":17079609}","1492607625","725088876/332045493/100802963","4/8/9"],
  ["camp/richeScorie/n35/g1/moitie","cbb00ec3335f668cba4152c625697cec","08d1c8ee2010f581596cdf12f73cf6f6","attaquants",637,"{\"quartz\":45075,\"scorie\":135227}","1089211611","854316948/394129632/19013237","0/6/5"],
  ["avantPoste/richeQuartz/n35/g1/toutes","0be251e5c2ff38a69432f9172faffa72","90f632a3ec0cdc823a4026f3ec8e4474","attaquants",556,"{\"quartz\":16675779,\"scorie\":5558593}","2009170733","1103961051/463481921/51096000","1/11/13"],
  ["avantPoste/richeQuartz/n35/g1/moitie","01cdeb0172871ff31d610c1501d1a663","c11ca27d013bfb7ab381261ce2656b76","attaquants",269,"{\"quartz\":0,\"scorie\":0}","712859364","1162434000/710077429/0","0/3/7"],
  ["avantPoste/richeScorie/n35/g1/toutes","0be251e5c2ff38a69432f9172faffa72","861a1231fb214c6412d5fa70281e2abe","attaquants",556,"{\"quartz\":5558593,\"scorie\":16675779}","2009170733","1103961051/463481921/51096000","1/11/13"],
  ["avantPoste/richeScorie/n35/g1/moitie","01cdeb0172871ff31d610c1501d1a663","940144d4cfa31fe2af3e8f686fc4da6c","attaquants",269,"{\"quartz\":0,\"scorie\":0}","712859364","1162434000/710077429/0","0/3/7"],
  ["base/-/n35/g1/toutes","31de8ac20f2d467db096588b06286f77","cf040b348914569e5f19f79989bbfe40","attaquants",388,"{\"quartz\":0,\"scorie\":0}","1661455031","1251852000/501757150/51096000","0/11/13"],
  ["base/-/n35/g1/moitie","365b6bbd901d77d6a377873aea7f60d0","5e70c4228127c5205c51ca33285e987c","attaquants",222,"{\"quartz\":0,\"scorie\":0}","343918525","1251852000/720481498/0","0/3/7"],
  ["camp/richeQuartz/n50/g1/toutes","1dc1ba9d6c93d6ed962033abb4bce168","27ac3ea5bf07e8ece4479d94893fa466","attaquants",537,"{\"quartz\":163854280,\"scorie\":54618093}","86802045057","3667329175/1265788117/126080002","0/11/12"],
  ["camp/richeQuartz/n50/g1/moitie","188f78b064281551318627b798a6c447","131dc8209018ef79ed4a858ed7ef8fb8","attaquants",242,"{\"quartz\":0,\"scorie\":0}","17150748488","3788524500/2170092569/0","0/4/7"],
  ["camp/richeScorie/n50/g1/toutes","1dc1ba9d6c93d6ed962033abb4bce168","c48e684d753b0696d5acb761988f8fa1","attaquants",537,"{\"quartz\":54618093,\"scorie\":163854280}","86802045057","3667329175/1265788117/126080002","0/11/12"],
  ["camp/richeScorie/n50/g1/moitie","188f78b064281551318627b798a6c447","45c15da3a30a005fc21a9e0829ca5013","attaquants",242,"{\"quartz\":0,\"scorie\":0}","17150748488","3788524500/2170092569/0","0/4/7"],
  ["avantPoste/richeQuartz/n50/g1/toutes","4df3c7768b932d0436ec2a0f26b01854","7dbe87bab2cef6c2637e0e92ae80a5dd","attaquants",363,"{\"quartz\":0,\"scorie\":0}","87274057879","5069152500/2407536899/170750400","0/12/12"],
  ["avantPoste/richeQuartz/n50/g1/moitie","25abe57e6bd73903df11defc7fe37c8a","9afb73bf1e98066a4d681e1c4d0c21b9","attaquants",267,"{\"quartz\":0,\"scorie\":0}","26722301158","5069152500/3026892384/0","0/5/7"],
  ["avantPoste/richeScorie/n50/g1/toutes","4df3c7768b932d0436ec2a0f26b01854","b88c899e6097e4dc1487893743615c36","attaquants",363,"{\"quartz\":0,\"scorie\":0}","87274057879","5069152500/2407536899/170750400","0/12/12"],
  ["avantPoste/richeScorie/n50/g1/moitie","25abe57e6bd73903df11defc7fe37c8a","03cd3915d195dfab26ea6714e6fcd908","attaquants",267,"{\"quartz\":0,\"scorie\":0}","26722301158","5069152500/3026892384/0","0/5/7"],
  ["base/-/n50/g1/toutes","fee9dda5b0152db69faabb9114d97e37","60af83b6e675ed65c410d322ae723adc","attaquants",769,"{\"quartz\":1731390051,\"scorie\":1298542538}","154664914312","4588917000/2125804748/343537859","8/17/11"],
  ["base/-/n50/g1/moitie","54b3f1730653c7529b24c6ac0badaa9e","557882b20c78b123ba0b3692cca88d69","attaquants",265,"{\"quartz\":0,\"scorie\":0}","26134088625","5602747500/3357829488/0","0/5/7"],
  ["camp/richeQuartz/n5/g2/toutes","c3e15db6bafe68a3e07135cced1ca6a2","f2b4b66bacda45a1e95fb84534df14c9","souche",309,"{\"quartz\":10175,\"scorie\":3391}","37500","5124000/1544520/19026873","5/1/0"],
  ["camp/richeQuartz/n5/g2/moitie","3d4cf414581477a2a390b64cf6eb9493","bbc1d3bf3a2983ff2744fca671eee25a","attaquants",450,"{\"quartz\":3391,\"scorie\":1130}","7787","14640000/2756712/7978800","3/0/0"],
  ["camp/richeScorie/n5/g2/toutes","c3e15db6bafe68a3e07135cced1ca6a2","c39d3655e79d6853b79e7dd62fdeff73","souche",309,"{\"quartz\":3391,\"scorie\":10175}","37500","5124000/1544520/19026873","5/1/0"],
  ["camp/richeScorie/n5/g2/moitie","3d4cf414581477a2a390b64cf6eb9493","d714e0414ac461600e8a60c9fa53aa8b","attaquants",450,"{\"quartz\":1130,\"scorie\":3391}","7787","14640000/2756712/7978800","3/0/0"],
  ["avantPoste/richeQuartz/n5/g2/toutes","b333a84ba74f87527d541a31ee1ec0b0","cd19b7d49e35d01e7e319bb3ffd10249","souche",306,"{\"quartz\":42256,\"scorie\":14085}","62800","5856000/2562000/18745407","7/2/0"],
  ["avantPoste/richeQuartz/n5/g2/moitie","eb94a90ccdfe16d0899ae7cac4710015","0d9de0d0643581650f79d7837156a029","attaquants",426,"{\"quartz\":21450,\"scorie\":7150}","27219","16561035/4013543/7561326","4/1/0"],
  ["avantPoste/richeScorie/n5/g2/toutes","b333a84ba74f87527d541a31ee1ec0b0","83a1323d73c3728d58fef77da6a00aa3","souche",306,"{\"quartz\":14085,\"scorie\":42256}","62800","5856000/2562000/18745407","7/2/0"],
  ["avantPoste/richeScorie/n5/g2/moitie","eb94a90ccdfe16d0899ae7cac4710015","53efd8b6a2f353131348d74dcb15dc6f","attaquants",426,"{\"quartz\":7150,\"scorie\":21450}","27219","16561035/4013543/7561326","4/1/0"],
  ["base/-/n5/g2/toutes","0785ff86b698ceaf1e69bfebd8488820","a5b8684bf76c2c42eabc24b7b6c70866","souche",311,"{\"quartz\":10552,\"scorie\":9044}","68082","7320000/3371280/18893468","7/2/0"],
  ["base/-/n5/g2/moitie","ec4451eb2f5f28efe2e87a0ba5380740","ea2264138ec898dfe13eda523efef962","attaquants",450,"{\"quartz\":3398,\"scorie\":5276}","25918","18633792/5091414/7429429","4/1/0"],
  ["camp/richeQuartz/n20/g2/toutes","019456e8ac9ed8898f3d3144677a9cd8","358cf4cf645867af591e8fddc8995b46","attaquants",804,"{\"quartz\":513074,\"scorie\":171024}","19042204","64122672/39142400/43426315","8/9/5"],
  ["camp/richeQuartz/n20/g2/moitie","b5be6c34b94d0e49b89b90b24ef14a20","5d6332a940a67d544c3cd517be6f2906","attaquants",654,"{\"quartz\":10186,\"scorie\":3395}","11155701","151111514/75361965/3164757","0/4/6"],
  ["camp/richeScorie/n20/g2/toutes","019456e8ac9ed8898f3d3144677a9cd8","032d4ef7b7bfbe0a99d617d5f59c4aa3","attaquants",804,"{\"quartz\":171024,\"scorie\":513074}","19042204","64122672/39142400/43426315","8/9/5"],
  ["camp/richeScorie/n20/g2/moitie","b5be6c34b94d0e49b89b90b24ef14a20","0e4f197ac18b7bde585bc7b345972638","attaquants",654,"{\"quartz\":3395,\"scorie\":10186}","11155701","151111514/75361965/3164757","0/4/6"],
  ["avantPoste/richeQuartz/n20/g2/toutes","1742012bb33e2ce059322a7a13e6091d","725b4a1c3903cc9df36296f83a4e51ab","attaquants",356,"{\"quartz\":0,\"scorie\":0}","12308153","211002000/77338714/7950800","0/8/13"],
  ["avantPoste/richeQuartz/n20/g2/moitie","4285b8f6bdaa9f2e69f8fe32f3037c8d","714088c905ffaa71ad5e1cbc496ce2b6","attaquants",264,"{\"quartz\":0,\"scorie\":0}","3474822","211002000/110274186/0","0/5/7"],
  ["avantPoste/richeScorie/n20/g2/toutes","1742012bb33e2ce059322a7a13e6091d","1433703c162f2d74c85a9b438a55625e","attaquants",356,"{\"quartz\":0,\"scorie\":0}","12308153","211002000/77338714/7950800","0/8/13"],
  ["avantPoste/richeScorie/n20/g2/moitie","4285b8f6bdaa9f2e69f8fe32f3037c8d","5aaa9e9fefc20737a2edcacc3279ee6c","attaquants",264,"{\"quartz\":0,\"scorie\":0}","3474822","211002000/110274186/0","0/5/7"],
  ["base/-/n20/g2/toutes","31fcff55a71ed39afe7043337c897033","c7bca99b071359ebfde7aba591d286e5","attaquants",408,"{\"quartz\":0,\"scorie\":0}","17525180","226292000/88949370/20182800","0/9/12"],
  ["base/-/n20/g2/moitie","fcd9ec0e6de3612bad1934f3274c4f74","df46e768979af942c4b64a9be87ee6cc","attaquants",252,"{\"quartz\":0,\"scorie\":0}","5576930","226292000/129430049/0","0/5/7"],
  ["camp/richeQuartz/n35/g2/toutes","3f53c23a769ff5a9d86b4d706e4b69f7","8476f3a0b79abf80b6bb849794469ce2","attaquants",566,"{\"quartz\":13844531,\"scorie\":4614843}","1576761218","727624936/291247200/114383962","2/12/9"],
  ["camp/richeQuartz/n35/g2/moitie","c47269c89c9f06f4da1cd3025b76e845","dd16cb9b3fdac6ee91dd09cda93d8fd8","attaquants",279,"{\"quartz\":0,\"scorie\":0}","503675266","855858000/542777643/0","0/5/7"],
  ["camp/richeScorie/n35/g2/toutes","3f53c23a769ff5a9d86b4d706e4b69f7","aaac07a6e33dfcd230b8937503042de7","attaquants",566,"{\"quartz\":4614843,\"scorie\":13844531}","1576761218","727624936/291247200/114383962","2/12/9"],
  ["camp/richeScorie/n35/g2/moitie","c47269c89c9f06f4da1cd3025b76e845","046039a2069d8a3a00e38fd8483f26e3","attaquants",279,"{\"quartz\":0,\"scorie\":0}","503675266","855858000/542777643/0","0/5/7"],
  ["avantPoste/richeQuartz/n35/g2/toutes","5d72132acf7f5033f733c54f0de4a29c","415fef3cd8b0186eac4b2bd22cce1c93","attaquants",288,"{\"quartz\":0,\"scorie\":0}","621777786","1162434000/716526706/0","0/8/14"],
  ["avantPoste/richeQuartz/n35/g2/moitie","ba08cedef1ba73a780d963c0386c6cfb","00f3bfdd88ffdc55b67ef6d5d837eb48","attaquants",394,"{\"quartz\":0,\"scorie\":0}","953586975","1162434000/748974017/0","0/9/7"],
  ["avantPoste/richeScorie/n35/g2/toutes","5d72132acf7f5033f733c54f0de4a29c","ff082ffc02ebf7366f70e197c8dc10d3","attaquants",288,"{\"quartz\":0,\"scorie\":0}","621777786","1162434000/716526706/0","0/8/14"],
  ["avantPoste/richeScorie/n35/g2/moitie","ba08cedef1ba73a780d963c0386c6cfb","10b565348a9a2fd56dea7143691cb027","attaquants",394,"{\"quartz\":0,\"scorie\":0}","953586975","1162434000/748974017/0","0/9/7"],
  ["base/-/n35/g2/toutes","05da5eecc0ac7dd4c8b87a4bc9193425","f478c1f7cb23ebe2eee7ce0fdabce061","attaquants",259,"{\"quartz\":0,\"scorie\":0}","526375965","1251852000/743866854/33212400","0/9/13"],
  ["base/-/n35/g2/moitie","3220e32d05865f76acee06dd8d16f0ea","97f3466650417a55a471c42bb1f11965","attaquants",340,"{\"quartz\":0,\"scorie\":0}","544111714","1251852000/834642706/0","0/8/7"],
  ["camp/richeQuartz/n50/g2/toutes","aa9580114ee694985286fbeb6490449b","550f0a8e6ec25e2b0dd96a9c4fa68aa3","attaquants",309,"{\"quartz\":0,\"scorie\":0}","65746427013","3788524500/1783532997/0","0/7/14"],
  ["camp/richeQuartz/n50/g2/moitie","ab6588773dca145cd02bf58112c2e8de","ff02b629662ea3336b2473a0237f9352","attaquants",237,"{\"quartz\":0,\"scorie\":0}","30782729115","3788524500/2531796012/0","0/2/7"],
  ["camp/richeScorie/n50/g2/toutes","aa9580114ee694985286fbeb6490449b","c067797d3d2301f4e831ae1ea7242136","attaquants",309,"{\"quartz\":0,\"scorie\":0}","65746427013","3788524500/1783532997/0","0/7/14"],
  ["camp/richeScorie/n50/g2/moitie","ab6588773dca145cd02bf58112c2e8de","0f5e205946a4a6016a1b44c22e02b812","attaquants",237,"{\"quartz\":0,\"scorie\":0}","30782729115","3788524500/2531796012/0","0/2/7"],
  ["avantPoste/richeQuartz/n50/g2/toutes","a67a6db89532d398cca5bc51af884acd","c7f65adfe5407783d5f53e024ebb1586","attaquants",266,"{\"quartz\":0,\"scorie\":0}","103001226839","5069152500/2630707526/0","0/9/14"],
  ["avantPoste/richeQuartz/n50/g2/moitie","11eb1c0dff893582b4f3b79273fb7039","b0c48fb43fb0a873bbd4d1172805045f","attaquants",213,"{\"quartz\":0,\"scorie\":0}","30431210928","5069152500/3641148880/0","0/2/7"],
  ["avantPoste/richeScorie/n50/g2/toutes","a67a6db89532d398cca5bc51af884acd","4a613dddf7f1e66b93471258c4d1074a","attaquants",266,"{\"quartz\":0,\"scorie\":0}","103001226839","5069152500/2630707526/0","0/9/14"],
  ["avantPoste/richeScorie/n50/g2/moitie","11eb1c0dff893582b4f3b79273fb7039","34c906646bee0f6593491e0c2c357c37","attaquants",213,"{\"quartz\":0,\"scorie\":0}","30431210928","5069152500/3641148880/0","0/2/7"],
  ["base/-/n50/g2/toutes","06e4a4138e21ab84bf3c5fe9717b59b4","f071f50d737b1916ec5c9c8895dbfbfd","attaquants",273,"{\"quartz\":0,\"scorie\":0}","87392075973","5602747500/2928291175/0","0/9/14"],
  ["base/-/n50/g2/moitie","b4b7675b0754850db062c70bebfd25f1","bcd4396b6fc8cc1e118b6b786694f083","attaquants",201,"{\"quartz\":0,\"scorie\":0}","25798139419","5602747500/3316384403/0","0/4/7"],
  ["camp/richeQuartz/n5/g3/toutes","5fc38f0f48602aa82c9b8ea9ede4f219","b6aee5791e566bdb9fc9033d940e9e5f","souche",272,"{\"quartz\":10175,\"scorie\":3391}","8971","2928000/2708400/20496000","6/0/0"],
  ["camp/richeQuartz/n5/g3/moitie","899c429f944e7f6c9b3263db641c5b1d","5a9c890b8896d66070efaa7f97c675b0","attaquants",450,"{\"quartz\":3391,\"scorie\":1130}","0","14640000/3074400/7978800","3/0/0"],
  ["camp/richeScorie/n5/g3/toutes","5fc38f0f48602aa82c9b8ea9ede4f219","4c428aa31c0d75c11b79b1982cf905e5","souche",272,"{\"quartz\":3391,\"scorie\":10175}","8971","2928000/2708400/20496000","6/0/0"],
  ["camp/richeScorie/n5/g3/moitie","899c429f944e7f6c9b3263db641c5b1d","734f0e29ae9c6fa056fc09e06dd6f364","attaquants",450,"{\"quartz\":1130,\"scorie\":3391}","0","14640000/3074400/7978800","3/0/0"],
  ["avantPoste/richeQuartz/n5/g3/toutes","aeb2dfcd39f7d0582237f8989409f118","2f4bce66eea372a7435ee48fa9f1f5a1","souche",385,"{\"quartz\":42256,\"scorie\":14085}","26113","2928000/4058680/18710190","8/1/0"],
  ["avantPoste/richeQuartz/n5/g3/moitie","4906834af18cd405f184a9e8247642a5","a2545531309f40230bdef4961d5f167a","attaquants",426,"{\"quartz\":22047,\"scorie\":7349}","6280","15372000/4867800/7978800","5/0/0"],
  ["avantPoste/richeScorie/n5/g3/toutes","aeb2dfcd39f7d0582237f8989409f118","fa3e7ec216f6098719c1b1c4083491f1","souche",385,"{\"quartz\":14085,\"scorie\":42256}","26113","2928000/4058680/18710190","8/1/0"],
  ["avantPoste/richeScorie/n5/g3/moitie","4906834af18cd405f184a9e8247642a5","f91c7a5d2319a2cb9fc85ff8bc3387fc","attaquants",426,"{\"quartz\":7349,\"scorie\":22047}","6280","15372000/4867800/7978800","5/0/0"],
  ["base/-/n5/g3/toutes","66c954e2c1e5f58eba14b6a619585d0f","309f6591265b13f675b7de8705cef8e1","attaquants",579,"{\"quartz\":5942,\"scorie\":6783}","51023","5325323/4067228/17591181","7/2/0"],
  ["base/-/n5/g3/moitie","2827eb7738ef9298cd8b85db5e9cdf6e","9c37205da3eecafb28da27b358aaaf1d","attaquants",450,"{\"quartz\":3014,\"scorie\":4324}","25120","21112153/5124000/6972504","3/1/0"],
  ["camp/richeQuartz/n20/g3/toutes","331e47946b0892be2d4b4606e99ab72a","99f62727b44d89a2417cbf1a88d7a225","attaquants",592,"{\"quartz\":245911,\"scorie\":81970}","17027351","125596901/40986798/22948522","3/6/8"],
  ["camp/richeQuartz/n20/g3/moitie","0f81e414a02d83f9cb7ff9a420fe62bd","4653a9802f4e31efdd201c4aaf7ff51b","attaquants",287,"{\"quartz\":0,\"scorie\":0}","6722598","152900000/75359099/0","0/2/7"],
  ["camp/richeScorie/n20/g3/toutes","331e47946b0892be2d4b4606e99ab72a","e33df6dfc6c7ddcd2d291a3ac9b760ac","attaquants",592,"{\"quartz\":81970,\"scorie\":245911}","17027351","125596901/40986798/22948522","3/6/8"],
  ["camp/richeScorie/n20/g3/moitie","0f81e414a02d83f9cb7ff9a420fe62bd","14bb2380de4b760f2e6b56750515b11d","attaquants",287,"{\"quartz\":0,\"scorie\":0}","6722598","152900000/75359099/0","0/2/7"],
  ["avantPoste/richeQuartz/n20/g3/toutes","3e11321925c2875c2b485afd72d84a90","68c2490589d86e000200acd467403892","attaquants",290,"{\"quartz\":0,\"scorie\":0}","11284889","211002000/99540741/9785600","0/6/12"],
  ["avantPoste/richeQuartz/n20/g3/moitie","82f5468b4c0afb675111d5abf93d95d6","adf571637ca125a09a9389b09a0794ed","attaquants",258,"{\"quartz\":0,\"scorie\":0}","3764038","211002000/116077623/0","0/3/7"],
  ["avantPoste/richeScorie/n20/g3/toutes","3e11321925c2875c2b485afd72d84a90","925b96463750d8c768a26db7a243782b","attaquants",290,"{\"quartz\":0,\"scorie\":0}","11284889","211002000/99540741/9785600","0/6/12"],
  ["avantPoste/richeScorie/n20/g3/moitie","82f5468b4c0afb675111d5abf93d95d6","d4f6ff214c87d37f81dd112a86dbb598","attaquants",258,"{\"quartz\":0,\"scorie\":0}","3764038","211002000/116077623/0","0/3/7"],
  ["base/-/n20/g3/toutes","a8ae050de32a71d320fdbd9ee66971e6","7e2e2554fbe83a9f5a2f67a8ab3768c2","attaquants",278,"{\"quartz\":0,\"scorie\":0}","17986640","226292000/107551809/6116000","0/7/13"],
  ["base/-/n20/g3/moitie","65ca1eedb9ce81181690ec42934d2a6f","06ed20e8b12df1169e3c19f1dbc4e4bf","attaquants",261,"{\"quartz\":0,\"scorie\":0}","6389657","226292000/133315701/0","0/3/7"],
  ["camp/richeQuartz/n35/g3/toutes","c85c19be961a2b2ba9a672a877926c1f","1568c99144df50052db54fec805dc180","attaquants",323,"{\"quartz\":0,\"scorie\":0}","1119881404","855858000/389985243/51096000","0/5/13"],
  ["camp/richeQuartz/n35/g3/moitie","901c33c4996206caf33df10d089f9697","edf5c52fc592b6d904fc566d8cab2bea","attaquants",222,"{\"quartz\":0,\"scorie\":0}","188860714","855858000/521307772/0","0/0/7"],
  ["camp/richeScorie/n35/g3/toutes","c85c19be961a2b2ba9a672a877926c1f","88ce281467992663b0cbd76b1714a2e3","attaquants",323,"{\"quartz\":0,\"scorie\":0}","1119881404","855858000/389985243/51096000","0/5/13"],
  ["camp/richeScorie/n35/g3/moitie","901c33c4996206caf33df10d089f9697","987989bf346b834baef4a7ff0c74a985","attaquants",222,"{\"quartz\":0,\"scorie\":0}","188860714","855858000/521307772/0","0/0/7"],
  ["avantPoste/richeQuartz/n35/g3/toutes","45ffa4c04914923ec1e6cf7ba0db4dfc","9cb7cbb4ebe434ad45ea2a21967af935","attaquants",381,"{\"quartz\":0,\"scorie\":0}","1452097770","1162434000/615482986/51096000","0/6/13"],
  ["avantPoste/richeQuartz/n35/g3/moitie","03738920ed963164c7940c75b7bbae13","947b3d20ecec466a29ddb928b88947c0","attaquants",241,"{\"quartz\":0,\"scorie\":0}","589209052","1162434000/736338377/0","0/1/7"],
  ["avantPoste/richeScorie/n35/g3/toutes","45ffa4c04914923ec1e6cf7ba0db4dfc","09d6f5da837906b6e62dcb7b0c5a2744","attaquants",381,"{\"quartz\":0,\"scorie\":0}","1452097770","1162434000/615482986/51096000","0/6/13"],
  ["avantPoste/richeScorie/n35/g3/moitie","03738920ed963164c7940c75b7bbae13","1f31d0206ff6f9da8d74dd95b19639dc","attaquants",241,"{\"quartz\":0,\"scorie\":0}","589209052","1162434000/736338377/0","0/1/7"],
  ["base/-/n35/g3/toutes","ee9739f2df80e6b69b0d1ee3fe15e807","67bd6d7da04f3bcc3c27374571ec0039","attaquants",279,"{\"quartz\":0,\"scorie\":0}","1684879995","1251852000/676097690/51096000","0/9/13"],
  ["base/-/n35/g3/moitie","34849ba89cb5331a1e95259ee6241302","6fc75cf99ea7652496d8ecb6bb784d18","attaquants",194,"{\"quartz\":0,\"scorie\":0}","319721059","1251852000/823333425/0","0/2/7"],
  ["camp/richeQuartz/n50/g3/toutes","19f18a91e9c4c6318325110565587a77","15bda7c900335debc207d408c39a7889","attaquants",330,"{\"quartz\":0,\"scorie\":0}","35524994201","3788524500/2754897755/213438000","0/0/13"],
  ["camp/richeQuartz/n50/g3/moitie","ebd007a5ff1d8d0eea59cfbafd17571d","d5ed76488de1fd98a44336bfe18a67ff","attaquants",217,"{\"quartz\":0,\"scorie\":0}","4701225062","3788524500/3033858003/0","0/0/7"],
  ["camp/richeScorie/n50/g3/toutes","19f18a91e9c4c6318325110565587a77","0ab9aa647f5886cba32bc09d391f812c","attaquants",330,"{\"quartz\":0,\"scorie\":0}","35524994201","3788524500/2754897755/213438000","0/0/13"],
  ["camp/richeScorie/n50/g3/moitie","ebd007a5ff1d8d0eea59cfbafd17571d","dfc3260694dd48e70ea6639d7ba0ab77","attaquants",217,"{\"quartz\":0,\"scorie\":0}","4701225062","3788524500/3033858003/0","0/0/7"],
  ["avantPoste/richeQuartz/n50/g3/toutes","c26831285d82528130c649e5547827c0","d3c972c4bb5715ffc34a233686fc63e1","attaquants",324,"{\"quartz\":0,\"scorie\":0}","75713359854","5069152500/3292377966/213438000","0/5/13"],
  ["avantPoste/richeQuartz/n50/g3/moitie","d4cc6c239ff3dc88f559e006ee313f13","8f9d532d4dc6f87e4b72a450d7ba705a","attaquants",188,"{\"quartz\":0,\"scorie\":0}","1899386579","5069152500/3941988491/0","0/1/7"],
  ["avantPoste/richeScorie/n50/g3/toutes","c26831285d82528130c649e5547827c0","1ac079dac81b20ef90882f41bda6fae4","attaquants",324,"{\"quartz\":0,\"scorie\":0}","75713359854","5069152500/3292377966/213438000","0/5/13"],
  ["avantPoste/richeScorie/n50/g3/moitie","d4cc6c239ff3dc88f559e006ee313f13","813bb0c6ace8b76f79f5a02f9e265806","attaquants",188,"{\"quartz\":0,\"scorie\":0}","1899386579","5069152500/3941988491/0","0/1/7"],
  ["base/-/n50/g3/toutes","6bd04ea029ecf4233249dda95d2e7679","7c49e27b5fcb4a1a6f42a6fd22b0a849","attaquants",251,"{\"quartz\":0,\"scorie\":0}","51566161006","5602747500/3889178933/213438000","0/5/13"],
  ["base/-/n50/g3/moitie","cdbb5b34b6a7f435f6d8d93abc0c609c","f543b439e4a514ac682af8271b892035","attaquants",210,"{\"quartz\":0,\"scorie\":0}","12763970864","5602747500/4106489196/0","0/4/7"],
  ["camp/richeQuartz/n5/g4/toutes","89f5ac1627e5b2e9337237cad3012d59","cb7872af706933cf4fdfc76506aa27d3","souche",284,"{\"quartz\":10175,\"scorie\":3391}","75360","4392000/0/18826405","5/3/0"],
  ["camp/richeQuartz/n5/g4/moitie","a6623c1fb1077e29366130581c89be62","aeb56ee3bbe32cda2df1825d536a3d1d","attaquants",426,"{\"quartz\":2930,\"scorie\":976}","51277","17628040/982473/7318814","2/2/0"],
  ["camp/richeScorie/n5/g4/toutes","89f5ac1627e5b2e9337237cad3012d59","4a110027687000f5f28e68a16473372b","souche",284,"{\"quartz\":3391,\"scorie\":10175}","75360","4392000/0/18826405","5/3/0"],
  ["camp/richeScorie/n5/g4/moitie","a6623c1fb1077e29366130581c89be62","4a5f8c3e3d4b51f25b4fb4ebae2c3d8f","attaquants",426,"{\"quartz\":976,\"scorie\":2930}","51277","17628040/982473/7318814","2/2/0"],
  ["avantPoste/richeQuartz/n5/g4/toutes","4a0747f34952711b92c412404048ffd6","5ea93289b15e4f0812ca54338b5eef89","souche",368,"{\"quartz\":42256,\"scorie\":14085}","91262","2928000/1400846/18013585","8/3/0"],
  ["avantPoste/richeQuartz/n5/g4/moitie","1339223302ba35fed0decc9271ed6319","f4ab4ca4051c9ae6ce1b1a3941c3b237","attaquants",426,"{\"quartz\":17196,\"scorie\":5732}","50471","20833104/3064949/6891248","3/2/0"],
  ["avantPoste/richeScorie/n5/g4/toutes","4a0747f34952711b92c412404048ffd6","83b04c664fa195cb8b0ccb7bef27860c","souche",368,"{\"quartz\":14085,\"scorie\":42256}","91262","2928000/1400846/18013585","8/3/0"],
  ["avantPoste/richeScorie/n5/g4/moitie","1339223302ba35fed0decc9271ed6319","dd68c5262c574c4e648dfe5fdc6e72ee","attaquants",426,"{\"quartz\":5732,\"scorie\":17196}","50471","20833104/3064949/6891248","3/2/0"],
  ["base/-/n5/g4/toutes","98b3dc94f044bdd26271e5883f4f9265","482fe8daeab72742a13a460eba15bdc9","souche",372,"{\"quartz\":10552,\"scorie\":9044}","91503","4392000/2415809/17732676","8/3/1"],
  ["base/-/n5/g4/moitie","529eec9ced81f805b8157f9bae8b7a89","da6d611b211c30873bb1e74477a66899","attaquants",451,"{\"quartz\":2261,\"scorie\":4522}","50240","22692000/4099200/6663015","3/2/1"],
  ["camp/richeQuartz/n20/g4/toutes","7c93a39772ed88286ded06ee06e334d2","63a9bfdc01e1d766115f6827901f2fa7","attaquants",538,"{\"quartz\":147040,\"scorie\":49013}","11034260","136260938/51670415/15333870","2/7/10"],
  ["camp/richeQuartz/n20/g4/moitie","22cb622bbffc79b98e39e70f422eb69a","bb56b1cbfd889ca8735cbcc5de0a7085","attaquants",460,"{\"quartz\":130625,\"scorie\":43541}","8592214","137610000/60548400/15838706","2/5/3"],
  ["camp/richeScorie/n20/g4/toutes","7c93a39772ed88286ded06ee06e334d2","a0cce4b13fb21e2a88470122aa30ca12","attaquants",538,"{\"quartz\":49013,\"scorie\":147040}","11034260","136260938/51670415/15333870","2/7/10"],
  ["camp/richeScorie/n20/g4/moitie","22cb622bbffc79b98e39e70f422eb69a","832f2251a366ea1b79bf164e73b51088","attaquants",460,"{\"quartz\":43541,\"scorie\":130625}","8592214","137610000/60548400/15838706","2/5/3"],
  ["avantPoste/richeQuartz/n20/g4/toutes","9fc7df4f851feabe0634a8d4eb56b301","6c3fd4eb32defa341d40e63461c399bc","attaquants",420,"{\"quartz\":27,\"scorie\":9}","15011309","211000533/88350660/0","0/8/14"],
  ["avantPoste/richeQuartz/n20/g4/moitie","e18079a7dd1db19cd0ebf87130d5891d","65bf7e08a7ce46b44b742a987aaee686","attaquants",248,"{\"quartz\":0,\"scorie\":0}","4355254","211002000/126627755/0","0/3/7"],
  ["avantPoste/richeScorie/n20/g4/toutes","9fc7df4f851feabe0634a8d4eb56b301","c373e9d33b5c0c8de99144282bacde98","attaquants",420,"{\"quartz\":9,\"scorie\":27}","15011309","211000533/88350660/0","0/8/14"],
  ["avantPoste/richeScorie/n20/g4/moitie","e18079a7dd1db19cd0ebf87130d5891d","be215dd92c5dcaaa6e64ec25d328b669","attaquants",248,"{\"quartz\":0,\"scorie\":0}","4355254","211002000/126627755/0","0/3/7"],
  ["base/-/n20/g4/toutes","c686f6bad7b1b84e331224eb47df1f8a","6bfc5e738c54f61bfbfdaed34ace2952","attaquants",284,"{\"quartz\":0,\"scorie\":0}","16527085","226292000/103578264/12232000","0/8/13"],
  ["base/-/n20/g4/moitie","d98175adaebdeb58d288436f8ff9f050","e977f336390efb65c533e3662b4ca0dd","attaquants",262,"{\"quartz\":0,\"scorie\":0}","8245042","226292000/118953142/0","0/6/7"],
  ["camp/richeQuartz/n35/g4/toutes","64a2f092e25ed60d30574e296ae5d0bd","6c8b003562b722915cbbd1b541afe332","attaquants",623,"{\"quartz\":14565342,\"scorie\":4855114}","1388094200","735116035/327248018/110853518","3/11/9"],
  ["camp/richeQuartz/n35/g4/moitie","f0ca1ecc7bd516e5732309360e3350aa","b77a09f49f7e26ec3447c105ce7c4df4","attaquants",557,"{\"quartz\":178450,\"scorie\":59483}","772228756","853824380/484331072/20347826","0/6/6"],
  ["camp/richeScorie/n35/g4/toutes","64a2f092e25ed60d30574e296ae5d0bd","dd389ac272fdfd6a408e159552716221","attaquants",623,"{\"quartz\":4855114,\"scorie\":14565342}","1388094200","735116035/327248018/110853518","3/11/9"],
  ["camp/richeScorie/n35/g4/moitie","f0ca1ecc7bd516e5732309360e3350aa","2dcab9472de406c2b0dbad1e92865702","attaquants",557,"{\"quartz\":59483,\"scorie\":178450}","772228756","853824380/484331072/20347826","0/6/6"],
  ["avantPoste/richeQuartz/n35/g4/toutes","8eb2b488af3d58a723ebcaa73b67be53","f4fb495861170dc388cfb48ecc09274b","attaquants",332,"{\"quartz\":0,\"scorie\":0}","1327284075","1162434000/623878502/0","0/8/14"],
  ["avantPoste/richeQuartz/n35/g4/moitie","982398a53f897212d9eef67e140dc438","73baae3a990d47cb21066deb4b08715c","attaquants",205,"{\"quartz\":0,\"scorie\":0}","265888045","1162434000/780686022/0","0/2/7"],
  ["avantPoste/richeScorie/n35/g4/toutes","8eb2b488af3d58a723ebcaa73b67be53","4f1d168b43150563102344c02a1a5658","attaquants",332,"{\"quartz\":0,\"scorie\":0}","1327284075","1162434000/623878502/0","0/8/14"],
  ["avantPoste/richeScorie/n35/g4/moitie","982398a53f897212d9eef67e140dc438","38519349540649485de87b2170f53778","attaquants",205,"{\"quartz\":0,\"scorie\":0}","265888045","1162434000/780686022/0","0/2/7"],
  ["base/-/n35/g4/toutes","f312bdc9f14945cec05bb8daad277ede","df05c18257c878175b7d7fd00076a231","attaquants",330,"{\"quartz\":0,\"scorie\":0}","971402657","1251852000/579144837/51096000","0/9/13"],
  ["base/-/n35/g4/moitie","658efb9a47156f4e905033f45e8254c2","db93bb889b4c2aec4797cf1d303185cd","attaquants",256,"{\"quartz\":0,\"scorie\":0}","614754958","1251852000/698620383/0","0/7/7"],
  ["camp/richeQuartz/n50/g4/toutes","ce22243409db3f9ab234e9a9ac9b5c30","e50b2ef3f53a95c31a5e52f75d59f718","attaquants",481,"{\"quartz\":574705096,\"scorie\":191568365}","103764416232","3421733989/1744996175/391658730","2/10/10"],
  ["camp/richeQuartz/n50/g4/moitie","4decfc4fe892cee44b2f1dabad36c5a0","d8765290783c3725d083010b30edf2a8","attaquants",386,"{\"quartz\":9485124,\"scorie\":3161708}","68225942386","3781508798/2001852302/144808621","0/7/5"],
  ["camp/richeScorie/n50/g4/toutes","ce22243409db3f9ab234e9a9ac9b5c30","5eba5dffd75146e317ffac6f2ad61c10","attaquants",481,"{\"quartz\":191568365,\"scorie\":574705096}","103764416232","3421733989/1744996175/391658730","2/10/10"],
  ["camp/richeScorie/n50/g4/moitie","4decfc4fe892cee44b2f1dabad36c5a0","a065b4e2b7a2bfbbbf5f5f5e4c33229f","attaquants",386,"{\"quartz\":3161708,\"scorie\":9485124}","68225942386","3781508798/2001852302/144808621","0/7/5"],
  ["avantPoste/richeQuartz/n50/g4/toutes","d9d67e2e487b014ad1521a964b2d3007","6fd003212bdc077708825115869b5e3c","attaquants",334,"{\"quartz\":0,\"scorie\":0}","64548217733","5069152500/2837782042/0","0/7/14"],
  ["avantPoste/richeQuartz/n50/g4/moitie","25800ed189f726600f9fe132d5726e4b","869314954e030335ef46eb780ef1f786","attaquants",326,"{\"quartz\":0,\"scorie\":0}","33796823253","5069152500/2991853110/0","0/5/7"],
  ["avantPoste/richeScorie/n50/g4/toutes","d9d67e2e487b014ad1521a964b2d3007","853d27436fbdf1294f5d98f20ef865ae","attaquants",334,"{\"quartz\":0,\"scorie\":0}","64548217733","5069152500/2837782042/0","0/7/14"],
  ["avantPoste/richeScorie/n50/g4/moitie","25800ed189f726600f9fe132d5726e4b","56dbe3fe549d948d14a64966d986f93f","attaquants",326,"{\"quartz\":0,\"scorie\":0}","33796823253","5069152500/2991853110/0","0/5/7"],
  ["base/-/n50/g4/toutes","68006c08f236a8a031b15953cced29c3","65564dd7b138de4ada42366e560c89ae","attaquants",322,"{\"quartz\":0,\"scorie\":0}","104729303866","5602747500/3002544211/0","0/10/14"],
  ["base/-/n50/g4/moitie","c53dcf7852593f862b7a80d10e9bd66e","2793d1fe4ec716ac046f9b63178af852","attaquants",241,"{\"quartz\":0,\"scorie\":0}","42055942986","5602747500/3851541455/0","0/2/7"],
  ["camp/richeQuartz/n5/g5/toutes","e6ff36bed6430a8b5ef51faa1ba7bdc4","b39461e1a3e65cebf97a0779894542dc","souche",274,"{\"quartz\":10175,\"scorie\":3391}","25120","3660000/2049600/19998194","6/1/0"],
  ["camp/richeQuartz/n5/g5/moitie","b6c62132e3879747e5233dee64d2bf07","bfed4cb2cb4e40d06343d0ce95c9018c","attaquants",476,"{\"quartz\":5653,\"scorie\":1884}","9294","13908000/2695224/7978800","4/0/0"],
  ["camp/richeScorie/n5/g5/toutes","e6ff36bed6430a8b5ef51faa1ba7bdc4","b3d44103f309f3824f353d322d960d74","souche",274,"{\"quartz\":3391,\"scorie\":10175}","25120","3660000/2049600/19998194","6/1/0"],
  ["camp/richeScorie/n5/g5/moitie","b6c62132e3879747e5233dee64d2bf07","884d8edf9171f73c4ff4dd1718e4a2b8","attaquants",476,"{\"quartz\":1884,\"scorie\":5653}","9294","13908000/2695224/7978800","4/0/0"],
  ["avantPoste/richeQuartz/n5/g5/toutes","fe129e2e6e257be95eca9d5226c88410","9f1de4f3cc291027167510857beed234","souche",352,"{\"quartz\":42256,\"scorie\":14085}","75360","3660000/2049600/17861106","8/3/1"],
  ["avantPoste/richeQuartz/n5/g5/moitie","49f54f5c322b02a390bbe2a737405ea3","349ff91e03e9dfa5a02f8aae7f489d60","attaquants",426,"{\"quartz\":16535,\"scorie\":5511}","43852","21228000/3334992/6512790","3/1/1"],
  ["avantPoste/richeScorie/n5/g5/toutes","fe129e2e6e257be95eca9d5226c88410","50b990565328f55d80b15a63f06105a3","souche",352,"{\"quartz\":14085,\"scorie\":42256}","75360","3660000/2049600/17861106","8/3/1"],
  ["avantPoste/richeScorie/n5/g5/moitie","49f54f5c322b02a390bbe2a737405ea3","507ec49dd02ffbebcadd18eb874ee163","attaquants",426,"{\"quartz\":5511,\"scorie\":16535}","43852","21228000/3334992/6512790","3/1/1"],
  ["base/-/n5/g5/toutes","579c574e071f97c01fa66215ba0c5684","61b1139ca9e3da72e01ef3826e9fe520","souche",344,"{\"quartz\":10552,\"scorie\":9044}","100480","5124000/2049600/17922113","8/4/1"],
  ["base/-/n5/g5/moitie","3ff6c6693c41ac7c1ce813294e851c5e","1224957ec1de1303d6601634cbd1222b","attaquants",426,"{\"quartz\":4522,\"scorie\":2261}","57345","22692000/3809328/6204829","3/2/1"],
  ["camp/richeQuartz/n20/g5/toutes","29d6fa3300a7456971abd8cbb0fae98b","bb033caec455b83d51443f610f164c21","souche",510,"{\"quartz\":992751,\"scorie\":330917}","11509385","33160226/45816916/67135708","11/8/0"],
  ["camp/richeQuartz/n20/g5/moitie","1b36d9aa4341ab1565261b2fe68ba3a3","d25db8ba347dc6662ec1992ae00843f9","attaquants",426,"{\"quartz\":292948,\"scorie\":97649}","3370514","124399440/74730576/25078898","4/3/1"],
  ["camp/richeScorie/n20/g5/toutes","29d6fa3300a7456971abd8cbb0fae98b","d1ff707c6f36f9e4abeb68ef17b3067d","souche",510,"{\"quartz\":330917,\"scorie\":992751}","11509385","33160226/45816916/67135708","11/8/0"],
  ["camp/richeScorie/n20/g5/moitie","1b36d9aa4341ab1565261b2fe68ba3a3","34353abea159c0e0af629a2bc2289a95","attaquants",426,"{\"quartz\":97649,\"scorie\":292948}","3370514","124399440/74730576/25078898","4/3/1"],
  ["avantPoste/richeQuartz/n20/g5/toutes","73b081a0d5d09c880435c1f0d243a947","f313329b7cedf2e32ac512c9bf4c0a3a","attaquants",758,"{\"quartz\":2402137,\"scorie\":800712}","19987986","127841528/72901587/42362101","11/12/6"],
  ["avantPoste/richeQuartz/n20/g5/moitie","1d70fdcb5891089b429f5a2107b7d6a3","d99d60c4e3cd43a718b3c56b5b2142e0","attaquants",386,"{\"quartz\":33909,\"scorie\":11303}","8940547","209170046/121708400/5388283","0/5/6"],
  ["avantPoste/richeScorie/n20/g5/toutes","73b081a0d5d09c880435c1f0d243a947","0ccb6adbbb97fc797b52b9b7bf1e4a31","attaquants",758,"{\"quartz\":800712,\"scorie\":2402137}","19987986","127841528/72901587/42362101","11/12/6"],
  ["avantPoste/richeScorie/n20/g5/moitie","1d70fdcb5891089b429f5a2107b7d6a3","0f2e48b87a072e94e53621c22b37d1d0","attaquants",386,"{\"quartz\":11303,\"scorie\":33909}","8940547","209170046/121708400/5388283","0/5/6"],
  ["base/-/n20/g5/toutes","4aa4bffc05356d6098b14a8379fc8015","aefea3a1b951490d68bae7ba99dc885a","attaquants",569,"{\"quartz\":300421,\"scorie\":200484}","18858033","184375550/97156274/18696296","5/10/11"],
  ["base/-/n20/g5/moitie","1b49af650c0619e9f4cf9bd5db3a3aae","918cb7eff4f00976def2c794affa443a","attaquants",435,"{\"quartz\":5198,\"scorie\":5198}","10333879","224922892/126601200/5266649","0/6/6"],
  ["camp/richeQuartz/n35/g5/toutes","271167d049722ab89bf735b6ff58a3eb","c99dc7095f3f22246c9ed9bb9eb4b040","attaquants",302,"{\"quartz\":107,\"scorie\":35}","1122904333","855856774/383450443/84308400","0/6/12"],
  ["camp/richeQuartz/n35/g5/moitie","647abb564c88ca38676ccd5655458c76","3fa3a893bc26510da77e7023be6909ff","attaquants",277,"{\"quartz\":0,\"scorie\":0}","460343038","855858000/514431916/0","0/3/7"],
  ["camp/richeScorie/n35/g5/toutes","271167d049722ab89bf735b6ff58a3eb","b9c7913b03c44a15c181fdea94767a25","attaquants",302,"{\"quartz\":35,\"scorie\":107}","1122904333","855856774/383450443/84308400","0/6/12"],
  ["camp/richeScorie/n35/g5/moitie","647abb564c88ca38676ccd5655458c76","1dba3bf63fa10d9c066b633ebe5dea8a","attaquants",277,"{\"quartz\":0,\"scorie\":0}","460343038","855858000/514431916/0","0/3/7"],
  ["avantPoste/richeQuartz/n35/g5/toutes","48c8770b304dfa317c341de8f141fc49","a85849b4c43f71b01268916c80ed5b30","attaquants",489,"{\"quartz\":0,\"scorie\":0}","1257420197","1162434000/733533928/84308400","0/5/12"],
  ["avantPoste/richeQuartz/n35/g5/moitie","3a7ea5f181e55a4d34921d0ed9580369","96649c12ec3b97d33e9ffd734365c8de","attaquants",236,"{\"quartz\":0,\"scorie\":0}","288540968","1162434000/870552401/0","0/1/7"],
  ["avantPoste/richeScorie/n35/g5/toutes","48c8770b304dfa317c341de8f141fc49","71deb3e16a5c9391d3bf4b008dd0154b","attaquants",489,"{\"quartz\":0,\"scorie\":0}","1257420197","1162434000/733533928/84308400","0/5/12"],
  ["avantPoste/richeScorie/n35/g5/moitie","3a7ea5f181e55a4d34921d0ed9580369","c04d9a93da5a22b95c7bd14664d1c70d","attaquants",236,"{\"quartz\":0,\"scorie\":0}","288540968","1162434000/870552401/0","0/1/7"],
  ["base/-/n35/g5/toutes","6c0fecc34067beffea1ae535ecb5125a","7ad2dd49057563d0c62a33175ff12a4c","attaquants",291,"{\"quartz\":0,\"scorie\":0}","1109681939","1251852000/817724026/51096000","0/5/13"],
  ["base/-/n35/g5/moitie","98a0ebbe9acd5ea9348b418fdea30bca","307892c012cacd709e11dab1fb1bdd9d","attaquants",231,"{\"quartz\":0,\"scorie\":0}","274347470","1251852000/948756661/0","0/2/7"],
  ["camp/richeQuartz/n50/g5/toutes","2692bd015e7367e84878bd4834742c5d","094c6f4bdb38f2abe380474c598389fd","attaquants",341,"{\"quartz\":93936517,\"scorie\":31312172}","83677411267","3745478774/1882277308/65554504","0/7/13"],
  ["camp/richeQuartz/n50/g5/moitie","6e795d2d83c81ae3bcc433b0c746187a","ad0b3d69358e511dd37224ba0eb9b0f7","attaquants",213,"{\"quartz\":0,\"scorie\":0}","15568521248","3788524500/2304990424/0","0/2/7"],
  ["camp/richeScorie/n50/g5/toutes","2692bd015e7367e84878bd4834742c5d","2b741e3dbe76222f24466268bf335c24","attaquants",341,"{\"quartz\":31312172,\"scorie\":93936517}","83677411267","3745478774/1882277308/65554504","0/7/13"],
  ["camp/richeScorie/n50/g5/moitie","6e795d2d83c81ae3bcc433b0c746187a","eadc134913512159460d9e217e925ba7","attaquants",213,"{\"quartz\":0,\"scorie\":0}","15568521248","3788524500/2304990424/0","0/2/7"],
  ["avantPoste/richeQuartz/n50/g5/toutes","9e77da9738fadfe1f441a7bc74a1c3d2","43abaf56f88c7c65fda5907b2959b91f","attaquants",254,"{\"quartz\":0,\"scorie\":0}","79056764669","5069152500/2950852679/0","0/8/14"],
  ["avantPoste/richeQuartz/n50/g5/moitie","d9c4b676f0e71f2f40d164d38f702b12","171b758ee099b81f4a7015690c66ec7c","attaquants",257,"{\"quartz\":0,\"scorie\":0}","31195824590","5069152500/3201515050/0","0/5/7"],
  ["avantPoste/richeScorie/n50/g5/toutes","9e77da9738fadfe1f441a7bc74a1c3d2","d2601704ca9d86579d7f8e07fb2b7817","attaquants",254,"{\"quartz\":0,\"scorie\":0}","79056764669","5069152500/2950852679/0","0/8/14"],
  ["avantPoste/richeScorie/n50/g5/moitie","d9c4b676f0e71f2f40d164d38f702b12","3ad102771868664e1085d84028bdd9b6","attaquants",257,"{\"quartz\":0,\"scorie\":0}","31195824590","5069152500/3201515050/0","0/5/7"],
  ["base/-/n50/g5/toutes","aefa37593fcda8cbbbf90fd676e41d53","eb7677e5538f756be2aa18e70c43419e","attaquants",335,"{\"quartz\":10635548,\"scorie\":19782785}","70430900852","5591858354/2817922950/14293356","0/10/13"],
  ["base/-/n50/g5/moitie","bb08eb83316a3d208d926914452b8d68","335002b80cf9b716988f2b9eac0aeb8d","attaquants",280,"{\"quartz\":0,\"scorie\":0}","30254963099","5602747500/3254549748/0","0/5/7"],];

/**
 * CE QUE LE LOT ARRÊT DÉPLACE, COMBAT PAR COMBAT ET CHAMP PAR CHAMP.
 *
 * ⚠⚠ LE TÉMOIN CI-DESSUS N'A PAS ÉTÉ RAFRAÎCHI, ET IL NE LE SERA JAMAIS. Il
 * reste la référence d'AVANT le lot JOURNAL-DE-COMBAT, et il continue de garder
 * tout ce que le lot ARRÊT ne touche pas. Ce bloc-ci NOMME ce qui bouge — même
 * doctrine que `DEPLACES_PAR_*` dans `temoins-bases-0.js` : « un lot qui change
 * un comportement NOMME ce qui bouge, et laisse tout le reste gardé contre la
 * référence d'avant ».
 *
 * ⚠ CE QUI RESTE GARDÉ SE COMPTE : 568 champs sur 1 600, dont 19 combats
 * entiers et 198 des 200 causes de fin. Ethan, 04/09 : « Chaque unité s'arrête
 * pour casser des bâtiments. Merlon et tourelles exclus, sauf si ils empêchent
 * d'avancer. » Un raid qui ne s'arrête plus aux mêmes endroits ne rend pas les
 * mêmes PV : ce qui serait suspect, c'est qu'il les rende.
 *
 * Clé : l'indice du combat dans le témoin. Valeur : les colonnes déplacées, à
 * l'indice qu'elles ont dans la ligne du témoin.
 */
export const COMBATS_DEPLACES_PAR_ARRET = {
  4: { 1: "d338801e1a9173bf1c3371d4f5836939", 2: "16a472dd0edfaef3b640c6c61d258b99" },   // avantPoste/richeQuartz/n5/g1/toutes
  6: { 1: "d338801e1a9173bf1c3371d4f5836939", 2: "d5c448195f4da7684d248c6545e32a78" },   // avantPoste/richeScorie/n5/g1/toutes
  8: { 1: "086f8e708c5297c83c5e63661d18bf3d", 2: "bba32081478d142958b207e7d03f5b21", 4: 333 },   // base/-/n5/g1/toutes
  9: { 1: "03650e6ebbadcc06bd7c59d1c6ef51ba", 2: "fa7501762443986443d5bf25b40dd319", 5: "{\"quartz\":3014,\"scorie\":3014}", 6: "45574", 7: "21960000/4289520/6473482", 8: "3/1/1" },   // base/-/n5/g1/moitie
  10: { 1: "d57ab142d4e61d8ef748fffb43d88e1d", 2: "b043faaa53b63fe241d7e8d8f1edcf28", 4: 758, 5: "{\"quartz\":498686,\"scorie\":166228}", 6: "8992965", 7: "102919054/53994572/55809756", 8: "7/5/3" },   // camp/richeQuartz/n20/g1/toutes
  11: { 1: "efae08dcb59c60d1c2e0f14ff0cee1d4", 2: "2d789e03aaf6970f16d8c43a1e82b03b", 4: 460, 5: "{\"quartz\":223282,\"scorie\":74427}", 6: "3568903", 7: "128986440/67205117/21185765", 8: "3/3/1" },   // camp/richeQuartz/n20/g1/moitie
  12: { 1: "d57ab142d4e61d8ef748fffb43d88e1d", 2: "ddc82eb2c63c30c5f4223693ffe6617b", 4: 758, 5: "{\"quartz\":166228,\"scorie\":498686}", 6: "8992965", 7: "102919054/53994572/55809756", 8: "7/5/3" },   // camp/richeScorie/n20/g1/toutes
  13: { 1: "efae08dcb59c60d1c2e0f14ff0cee1d4", 2: "3c0590d081a8aa32b77f3b314f297506", 4: 460, 5: "{\"quartz\":74427,\"scorie\":223282}", 6: "3568903", 7: "128986440/67205117/21185765", 8: "3/3/1" },   // camp/richeScorie/n20/g1/moitie
  14: { 1: "e630511d0c4afd9d605db5e44665d94f", 2: "c535f737a25f7010e692f6b1f5d04cfb", 4: 592, 5: "{\"quartz\":1286680,\"scorie\":428893}", 6: "15736190", 7: "164648076/83198620/33006552", 8: "6/7/7" },   // avantPoste/richeQuartz/n20/g1/toutes
  15: { 1: "7c7b9d805df5885a4e43c0b7c86726e8", 2: "f69cff9b3e9b3f5ebc5efd3998692a26", 4: 529, 5: "{\"quartz\":7874,\"scorie\":2624}", 6: "10028532", 7: "210576574/119066804/4691673", 8: "0/4/5" },   // avantPoste/richeQuartz/n20/g1/moitie
  16: { 1: "e630511d0c4afd9d605db5e44665d94f", 2: "6564a8a2e58cc7424b45ad53c9c75e4c", 4: 592, 5: "{\"quartz\":428893,\"scorie\":1286680}", 6: "15736190", 7: "164648076/83198620/33006552", 8: "6/7/7" },   // avantPoste/richeScorie/n20/g1/toutes
  17: { 1: "7c7b9d805df5885a4e43c0b7c86726e8", 2: "06cc8bf1e2e677572d8b90dd30661df8", 4: 529, 5: "{\"quartz\":2624,\"scorie\":7874}", 6: "10028532", 7: "210576574/119066804/4691673", 8: "0/4/5" },   // avantPoste/richeScorie/n20/g1/moitie
  18: { 1: "1f3daf48053798dfa9d98ace4ee46abb", 2: "28526844cba8b8f563fcf3af1b72398f", 4: 595, 5: "{\"quartz\":313500,\"scorie\":209000}", 6: "19323420", 7: "180422000/79609542/23646520", 8: "6/9/10" },   // base/-/n20/g1/toutes
  19: { 1: "d622b19691dc77b96dd72b1cc31470bb", 2: "62fe6835d3a751948bd6650c797cac76", 4: 248, 5: "{\"quartz\":0,\"scorie\":0}", 6: "7551377", 7: "226292000/120041730/0", 8: "0/4/7" },   // base/-/n20/g1/moitie
  20: { 1: "89ca1f6007769675c0a0fd219ebc8bc6", 2: "d3a6b1a32f572bc8263b6c446a907a91", 4: 585, 5: "{\"quartz\":18629694,\"scorie\":6209898}", 6: "1405787561", 7: "707424120/345270979/110625232", 8: "4/7/9" },   // camp/richeQuartz/n35/g1/toutes
  21: { 1: "5078f6a043d57e84b0a7f88d719849e1", 2: "67791b80bb67255382bfc7ff6388d65e", 4: 550, 5: "{\"quartz\":176925,\"scorie\":58975}", 6: "909708919", 7: "853841756/417926472/24073502", 8: "0/5/5" },   // camp/richeQuartz/n35/g1/moitie
  22: { 1: "89ca1f6007769675c0a0fd219ebc8bc6", 2: "41f96a7dbdd72baf9ee41f39caae1ff7", 4: 585, 5: "{\"quartz\":6209898,\"scorie\":18629694}", 6: "1405787561", 7: "707424120/345270979/110625232", 8: "4/7/9" },   // camp/richeScorie/n35/g1/toutes
  23: { 1: "5078f6a043d57e84b0a7f88d719849e1", 2: "6d5b69557fa399b34d3c913f3888f573", 4: 550, 5: "{\"quartz\":58975,\"scorie\":176925}", 6: "909708919", 7: "853841756/417926472/24073502", 8: "0/5/5" },   // camp/richeScorie/n35/g1/moitie
  24: { 1: "2dee8d66896d415831bbb8c56f4033be", 2: "8b74ad8d9a39fde93270520857ffb8b1", 4: 356, 5: "{\"quartz\":0,\"scorie\":0}", 6: "1361069328", 7: "1162434000/600659054/0", 8: "0/6/14" },   // avantPoste/richeQuartz/n35/g1/toutes
  25: { 1: "ac0f60d06e03f27c5bf188be4f7243b5", 2: "f339b8a1fba2eb8d346ab1c7c3ab080a", 4: 217, 6: "642194790", 7: "1162434000/715822926/0" },   // avantPoste/richeQuartz/n35/g1/moitie
  26: { 1: "2dee8d66896d415831bbb8c56f4033be", 2: "4cfcfb47168859473d42f30fa2447ae9", 4: 356, 5: "{\"quartz\":0,\"scorie\":0}", 6: "1361069328", 7: "1162434000/600659054/0", 8: "0/6/14" },   // avantPoste/richeScorie/n35/g1/toutes
  27: { 1: "ac0f60d06e03f27c5bf188be4f7243b5", 2: "a4190e75efce71fa8538b049bc8c27f5", 4: 217, 6: "642194790", 7: "1162434000/715822926/0" },   // avantPoste/richeScorie/n35/g1/moitie
  28: { 1: "169b2989baa1ba907c6c7b012e375f44", 2: "1faf5651dc85af86ff2d5d979e94e998", 4: 361, 6: "1322916262", 7: "1251852000/543245203/0", 8: "0/9/14" },   // base/-/n35/g1/toutes
  29: { 1: "65795852c26ea3da7c105a0e9f43d7a1", 2: "10a378b874d3d2eaf1e41e2810141371", 4: 218, 6: "284786926", 7: "1251852000/729583648/0", 8: "0/2/7" },   // base/-/n35/g1/moitie
  30: { 1: "6b754698c2acec3b0975c6edd50f43ca", 2: "2ee3f0fae2541c664fcb2e37c693a500", 4: 635, 5: "{\"quartz\":1406754416,\"scorie\":468918138}", 6: "78429227809", 7: "3148210500/1493892724/142293851", 8: "5/9/12" },   // camp/richeQuartz/n50/g1/toutes
  31: { 1: "31b4fa64fae73277e4de1d3f38b240d9", 2: "85fa9b93af0264210909c1558aa90c8e", 4: 223, 6: "13029173372", 7: "3788524500/2204491210/0", 8: "0/3/7" },   // camp/richeQuartz/n50/g1/moitie
  32: { 1: "6b754698c2acec3b0975c6edd50f43ca", 2: "778178a2d7b9e4ca180d73bebecdb39c", 4: 635, 5: "{\"quartz\":468918138,\"scorie\":1406754416}", 6: "78429227809", 7: "3148210500/1493892724/142293851", 8: "5/9/12" },   // camp/richeScorie/n50/g1/toutes
  33: { 1: "31b4fa64fae73277e4de1d3f38b240d9", 2: "468223b3421c32f9b187216165840dc9", 4: 223, 6: "13029173372", 7: "3788524500/2204491210/0", 8: "0/3/7" },   // camp/richeScorie/n50/g1/moitie
  34: { 1: "610867ee33d1f8f93a78d8debd0bda07", 2: "f114c8cdaf7d03e1e7441c2571ace6ac", 4: 373, 6: "76289494201", 7: "5069152500/2569996308/0", 8: "0/8/14" },   // avantPoste/richeQuartz/n50/g1/toutes
  35: { 1: "a6c18a83c42a847d1f10570bd0b05065", 2: "1cccfafdc4601526d77da95bf0c43fe7", 4: 242, 6: "6406580525", 7: "5069152500/3293069751/0", 8: "0/2/7" },   // avantPoste/richeQuartz/n50/g1/moitie
  36: { 1: "610867ee33d1f8f93a78d8debd0bda07", 2: "cfe172f04ad5578935bb2ce097233946", 4: 373, 6: "76289494201", 7: "5069152500/2569996308/0", 8: "0/8/14" },   // avantPoste/richeScorie/n50/g1/toutes
  37: { 1: "a6c18a83c42a847d1f10570bd0b05065", 2: "ecfede9752ecaf03c32e102c24a46d10", 4: 242, 6: "6406580525", 7: "5069152500/3293069751/0", 8: "0/2/7" },   // avantPoste/richeScorie/n50/g1/moitie
  38: { 1: "24487a5bbe67af55effca826a377c5b9", 2: "4f1f29e8fd3a2b1db057b31ae827b19a", 4: 780, 6: "116010394920", 7: "4588917000/2535678055/271915378", 8: "8/13/12" },   // base/-/n50/g1/toutes
  39: { 1: "80b08bcfe8613669fac19c18ab845862", 2: "8c491c55e88c08c191e21aeac0620b04", 4: 215, 6: "28162005090", 7: "5602747500/3563890081/0" },   // base/-/n50/g1/moitie
  40: { 1: "edea9664d07d59c8e2925fe03e078cf6", 2: "9f5a6f372572781ac3641ff4c77b39c3" },   // camp/richeQuartz/n5/g2/toutes
  42: { 1: "edea9664d07d59c8e2925fe03e078cf6", 2: "4ec37c268b881410acedd36ae3aebbae" },   // camp/richeScorie/n5/g2/toutes
  44: { 1: "7e7c24ae6c05bbb76744095bae6955be", 2: "c781d87a65a0b11b6ca66963aeb601d6", 4: 311, 7: "5856000/2562000/18745084" },   // avantPoste/richeQuartz/n5/g2/toutes
  45: { 1: "e92bf81406a87014cf36f1768b7a4eea", 2: "c6fce20b851fac5f15b1d2ae22c92c33", 5: "{\"quartz\":21467,\"scorie\":7155}", 6: "27229", 7: "16525842/4013140/7557912" },   // avantPoste/richeQuartz/n5/g2/moitie
  46: { 1: "7e7c24ae6c05bbb76744095bae6955be", 2: "3ea5c1b6ff4205c36de6f9f2e23c9026", 4: 311, 7: "5856000/2562000/18745084" },   // avantPoste/richeScorie/n5/g2/toutes
  47: { 1: "e92bf81406a87014cf36f1768b7a4eea", 2: "da8753be6d192d210cfa2fa18862fb6d", 5: "{\"quartz\":7155,\"scorie\":21467}", 6: "27229", 7: "16525842/4013140/7557912" },   // avantPoste/richeScorie/n5/g2/moitie
  48: { 1: "4c97068e6afbed5bc0a41a6083aee034", 2: "d338227593f94fbf3c07d5a11f767205", 7: "7320000/3371280/18881938" },   // base/-/n5/g2/toutes
  49: { 1: "b2dd6fd9b72f6e78d27c0ae02ccdfaa2", 2: "9d056325f766e016b70507729482dfff", 5: "{\"quartz\":3406,\"scorie\":5276}", 6: "25927", 7: "18593151/5091048/7423390" },   // base/-/n5/g2/moitie
  50: { 1: "a90441eb55e4fa5a9bc372248c4bb20d", 2: "cfd6ee9b864d0424a6e9b2502eea1d6b", 4: 537, 5: "{\"quartz\":320664,\"scorie\":106888}", 6: "16345552", 7: "119533237/46244534/30553976", 8: "4/7/7" },   // camp/richeQuartz/n20/g2/toutes
  51: { 1: "6175a163ad9fe412bc333eb33d9d7e75", 2: "e22d67e7276071da2469dbd461333bb2", 3: "duree", 4: 900, 5: "{\"quartz\":13226,\"scorie\":4408}", 6: "10208673", 7: "150577718/78379058/1040456", 8: "0/3/6" },   // camp/richeQuartz/n20/g2/moitie
  52: { 1: "a90441eb55e4fa5a9bc372248c4bb20d", 2: "0109ba5bd249540957f95ef801133e97", 4: 537, 5: "{\"quartz\":106888,\"scorie\":320664}", 6: "16345552", 7: "119533237/46244534/30553976", 8: "4/7/7" },   // camp/richeScorie/n20/g2/toutes
  53: { 1: "6175a163ad9fe412bc333eb33d9d7e75", 2: "c0758ed7953c246db32e7300f7bded9f", 3: "duree", 4: 900, 5: "{\"quartz\":4408,\"scorie\":13226}", 6: "10208673", 7: "150577718/78379058/1040456", 8: "0/3/6" },   // camp/richeScorie/n20/g2/moitie
  54: { 1: "e4187f389f49291ffc29407c862b4768", 2: "39082a70ed28bd98b254cf0acd5b3773", 4: 290, 6: "6743104", 7: "211002000/98499909/0", 8: "0/5/14" },   // avantPoste/richeQuartz/n20/g2/toutes
  55: { 1: "d4b426200b499a7945bd7500e1542100", 2: "993c6cc952701ae63d226b18dc06af62", 4: 249, 6: "2110641", 7: "211002000/124501619/0", 8: "0/4/7" },   // avantPoste/richeQuartz/n20/g2/moitie
  56: { 1: "e4187f389f49291ffc29407c862b4768", 2: "5e46514214827cbdbce50b132ff6a9e1", 4: 290, 6: "6743104", 7: "211002000/98499909/0", 8: "0/5/14" },   // avantPoste/richeScorie/n20/g2/toutes
  57: { 1: "d4b426200b499a7945bd7500e1542100", 2: "5b8bdaa7746bdc3a5475d2f6539d8b6f", 4: 249, 6: "2110641", 7: "211002000/124501619/0", 8: "0/4/7" },   // avantPoste/richeScorie/n20/g2/moitie
  58: { 1: "6f82ee354933bcf40b5f203b642b4f6f", 2: "53d7e782bffd7675e78dd110b60e9023", 4: 266, 6: "9177137", 7: "226292000/119853132/0", 8: "0/5/14" },   // base/-/n20/g2/toutes
  59: { 1: "e77a71341c1a9b4743adcf5adc6471b4", 2: "63a77544a826419861b50f0826322e83", 4: 224, 6: "3546350", 7: "226292000/147832508/0", 8: "0/2/7" },   // base/-/n20/g2/moitie
  60: { 1: "1224ea7afe99bb28516aa3397a724fcc", 2: "82801fb01c07923a41cab6261291e2c2", 4: 314, 5: "{\"quartz\":1494408,\"scorie\":498136}", 6: "997591832", 7: "838827727/407555890/0", 8: "0/7/14" },   // camp/richeQuartz/n35/g2/toutes
  61: { 1: "5475051137ffbd59735dc7f5a32ebc33", 2: "d9953f98db226d5f86d6d4dce807b9d9", 4: 245, 6: "324585569", 7: "855858000/570953946/0", 8: "0/3/7" },   // camp/richeQuartz/n35/g2/moitie
  62: { 1: "1224ea7afe99bb28516aa3397a724fcc", 2: "ab01675999db869eb2aacd757d9b9acf", 4: 314, 5: "{\"quartz\":498136,\"scorie\":1494408}", 6: "997591832", 7: "838827727/407555890/0", 8: "0/7/14" },   // camp/richeScorie/n35/g2/toutes
  63: { 1: "5475051137ffbd59735dc7f5a32ebc33", 2: "8a7069fd7f4a813e0f9d14c0ff7f2a3a", 4: 245, 6: "324585569", 7: "855858000/570953946/0", 8: "0/3/7" },   // camp/richeScorie/n35/g2/moitie
  64: { 1: "a3e03d208785e6b585e30b4933b23631", 2: "61c55ca09a221b991b0ca550e60b2b1a", 4: 268, 6: "375309153", 7: "1162434000/825191553/0", 8: "0/5/14" },   // avantPoste/richeQuartz/n35/g2/toutes
  65: { 1: "3d80574c17eb47d7cd0326282a2c0f83", 2: "84f8274fd3673adca0e989b0594ace86", 4: 246, 6: "299126426", 7: "1162434000/919738565/0", 8: "0/3/7" },   // avantPoste/richeQuartz/n35/g2/moitie
  66: { 1: "a3e03d208785e6b585e30b4933b23631", 2: "94e62ac4f83bd962198875c873f38480", 4: 268, 6: "375309153", 7: "1162434000/825191553/0", 8: "0/5/14" },   // avantPoste/richeScorie/n35/g2/toutes
  67: { 1: "3d80574c17eb47d7cd0326282a2c0f83", 2: "b0dfb713f3dea079c07aba0776de8193", 4: 246, 6: "299126426", 7: "1162434000/919738565/0", 8: "0/3/7" },   // avantPoste/richeScorie/n35/g2/moitie
  68: { 1: "c1fb9e4379987b1a346d6b7792680919", 2: "2b41e9574766cac65cc6a69a8c29a28f", 4: 246, 6: "363257158", 7: "1251852000/848388365/0", 8: "0/7/14" },   // base/-/n35/g2/toutes
  69: { 1: "e554f3f2299e621b2f03355f25279486", 2: "54b2d4dd6a1ec017dda81cbd6aa20e87", 4: 216, 6: "242197349", 7: "1251852000/1014151773/0", 8: "0/3/7" },   // base/-/n35/g2/moitie
  70: { 1: "c1de07ccd7ee7fe110b6bebaeb62fc17", 2: "4a6deb3c8812baaeea17dd3ad958b1ac", 4: 305, 6: "56966584000", 7: "3788524500/1961785983/0", 8: "0/5/14" },   // camp/richeQuartz/n50/g2/toutes
  72: { 1: "c1de07ccd7ee7fe110b6bebaeb62fc17", 2: "ba70abbaa0c1806131ff252f6e2002f6", 4: 305, 6: "56966584000", 7: "3788524500/1961785983/0", 8: "0/5/14" },   // camp/richeScorie/n50/g2/toutes
  74: { 1: "1121389dd3b72e0b2c35c04b78e2b596", 2: "354a6482e8c8a6ab5e6fad36daeca633", 4: 246, 6: "84076892592", 7: "5069152500/2913048724/0", 8: "0/7/14" },   // avantPoste/richeQuartz/n50/g2/toutes
  75: { 1: "ec0a38dbcd335ad54c8f6c150a22d0bc", 2: "cd2abfa55da4c6a57e6a3b31d5ae94e2", 4: 209, 6: "30111891476", 7: "5069152500/3643906820/0" },   // avantPoste/richeQuartz/n50/g2/moitie
  76: { 1: "1121389dd3b72e0b2c35c04b78e2b596", 2: "e9e3598389fe59cbc58cf007abc70222", 4: 246, 6: "84076892592", 7: "5069152500/2913048724/0", 8: "0/7/14" },   // avantPoste/richeScorie/n50/g2/toutes
  77: { 1: "ec0a38dbcd335ad54c8f6c150a22d0bc", 2: "260c89508872968b958dac610a8ce46f", 4: 209, 6: "30111891476", 7: "5069152500/3643906820/0" },   // avantPoste/richeScorie/n50/g2/moitie
  78: { 1: "4e55c013a1d744a1ca0a20140baf7a87", 2: "b1fd1e6ad1822544c87846b8959016a4", 4: 247, 6: "78316704195", 7: "5602747500/3007776556/0", 8: "0/8/14" },   // base/-/n50/g2/toutes
  79: { 1: "4a14c9ca355cb8d440106ad49091e2ce", 2: "7404ab965ca4c19e0d90a58c32bf6065", 4: 231, 6: "8103397959", 7: "5602747500/3461096055/0", 8: "0/1/7" },   // base/-/n50/g2/moitie
  80: { 2: "b997f62bb4561d746d8d65785bf91e73" },   // camp/richeQuartz/n5/g3/toutes
  82: { 2: "c02acb2f53f657cfd6e56ec53434cae9" },   // camp/richeScorie/n5/g3/toutes
  84: { 1: "5ba2fb5b44e7d440a67d0fca136741d9", 2: "b4915448d9630625ff6bd7a85c0cb4dd", 4: 390, 7: "2928000/4058680/18706530" },   // avantPoste/richeQuartz/n5/g3/toutes
  86: { 1: "5ba2fb5b44e7d440a67d0fca136741d9", 2: "b05ab7b946f8bd68db73369e5939e571", 4: 390, 7: "2928000/4058680/18706530" },   // avantPoste/richeScorie/n5/g3/toutes
  88: { 1: "c831e20f8fd5d6381647d1a8de4dfd15", 2: "5737e749a1770fecc3803faf9708b802", 5: "{\"quartz\":5888,\"scorie\":6783}", 7: "5907789/4067228/17591181" },   // base/-/n5/g3/toutes
  90: { 1: "cbb2451e3fa7e0c7970133cfdc398abc", 2: "b96a6fd8149d149a322de37d142dbefa", 4: 513, 5: "{\"quartz\":330210,\"scorie\":110070}", 6: "17585838", 7: "116441331/39069012/23468098", 8: "4/7/9" },   // camp/richeQuartz/n20/g3/toutes
  91: { 1: "aa6a98cf98072c6cae5f9cac759427eb", 2: "5412950be8840b2cb91b0b5bd44d3a01", 4: 259, 6: "5772882", 7: "152900000/77380327/0", 8: "0/1/7" },   // camp/richeQuartz/n20/g3/moitie
  92: { 1: "cbb2451e3fa7e0c7970133cfdc398abc", 2: "1c8dbe28cb7113ec24c9a9caa5349b69", 4: 513, 5: "{\"quartz\":110070,\"scorie\":330210}", 6: "17585838", 7: "116441331/39069012/23468098", 8: "4/7/9" },   // camp/richeScorie/n20/g3/toutes
  93: { 1: "aa6a98cf98072c6cae5f9cac759427eb", 2: "172a4e26e906ed77bdd944b7e56eb3d4", 4: 259, 6: "5772882", 7: "152900000/77380327/0", 8: "0/1/7" },   // camp/richeScorie/n20/g3/moitie
  94: { 1: "68b1898c619221eeb5cf61e5a293891f", 2: "561f32c58358589ec23174da680cc01c", 4: 333, 6: "9672593", 7: "211002000/102261323/4281200", 8: "0/5/13" },   // avantPoste/richeQuartz/n20/g3/toutes
  95: { 1: "0ec0e4112bca3417bc835e0b7d06648b", 2: "acc7faf3fb605057da51bb053ee633ae", 4: 251, 6: "3762903", 7: "211002000/116081806/0" },   // avantPoste/richeQuartz/n20/g3/moitie
  96: { 1: "68b1898c619221eeb5cf61e5a293891f", 2: "148d09cf852893a7bc6148f628a55d61", 4: 333, 6: "9672593", 7: "211002000/102261323/4281200", 8: "0/5/13" },   // avantPoste/richeScorie/n20/g3/toutes
  97: { 1: "0ec0e4112bca3417bc835e0b7d06648b", 2: "e5cd64944363dfe605719640581bdb1e", 4: 251, 6: "3762903", 7: "211002000/116081806/0" },   // avantPoste/richeScorie/n20/g3/moitie
  98: { 1: "97dd43228ca916935ca59fb9f16c1f87", 2: "ceb6a14f21c79200b732f943f3f3487d", 4: 270, 6: "13405128", 7: "226292000/116728829/0", 8: "0/6/14" },   // base/-/n20/g3/toutes
  99: { 1: "b53625a6055110c850a5b7b02a6ccf7c", 2: "6602cbce91be58ed054e74058e027a1c", 4: 217, 6: "5309652", 7: "226292000/135596420/0", 8: "0/2/7" },   // base/-/n20/g3/moitie
  100: { 1: "da3d1cd59fe29c09cccf9aa7662580f6", 2: "5182ae0d24961aa15c354c558da77349", 4: 278, 6: "866559873", 7: "855858000/421855549/0", 8: "0/3/14" },   // camp/richeQuartz/n35/g3/toutes
  101: { 1: "62df1a38ab4875549ced6a9f2cfcb228", 2: "2248485d86f9c52d9b12dff8ad7c5032", 4: 202, 6: "153122916", 7: "855858000/525380449/0" },   // camp/richeQuartz/n35/g3/moitie
  102: { 1: "da3d1cd59fe29c09cccf9aa7662580f6", 2: "0ffc35442dec41906107b3665a258930", 4: 278, 6: "866559873", 7: "855858000/421855549/0", 8: "0/3/14" },   // camp/richeScorie/n35/g3/toutes
  103: { 1: "62df1a38ab4875549ced6a9f2cfcb228", 2: "1bbe9c0b6781bb937ac1b51aca42154b", 4: 202, 6: "153122916", 7: "855858000/525380449/0" },   // camp/richeScorie/n35/g3/moitie
  104: { 1: "0434c5666919207af1a7100e549cbd2b", 2: "5f7a2deab12b6e2023bc3170a40d5993", 4: 223, 6: "833418486", 7: "1162434000/692551599/0", 8: "0/3/14" },   // avantPoste/richeQuartz/n35/g3/toutes
  105: { 1: "877e6fea4e7d716e43ad173191fa7eec", 2: "b5bcc11cf8151ce6d0f61c77afa51ac2", 4: 186, 6: "328805534", 7: "1162434000/766013944/0", 8: "0/0/7" },   // avantPoste/richeQuartz/n35/g3/moitie
  106: { 1: "0434c5666919207af1a7100e549cbd2b", 2: "b4e714ef5709b18844fb127b0e22a62e", 4: 223, 6: "833418486", 7: "1162434000/692551599/0", 8: "0/3/14" },   // avantPoste/richeScorie/n35/g3/toutes
  107: { 1: "877e6fea4e7d716e43ad173191fa7eec", 2: "9d171f7be64c97292b18d953fc3d57c2", 4: 186, 6: "328805534", 7: "1162434000/766013944/0", 8: "0/0/7" },   // avantPoste/richeScorie/n35/g3/moitie
  108: { 1: "119d9286ae3fc08bfb745928b32c0cc4", 2: "b06e37a5c5c546aed83a68bd4f7ccf4e", 4: 248, 6: "1177718593", 7: "1251852000/742915069/0", 8: "0/6/14" },   // base/-/n35/g3/toutes
  109: { 1: "0585c9b9b83b99b78453b5b4de858986", 2: "fb7e3177e0c288754b9989ff9f3953c0", 6: "314350575", 7: "1251852000/823639435/0" },   // base/-/n35/g3/moitie
  110: { 1: "8921d6a945a81422e4d8ab0d050c643b", 2: "188b0927dcc2e0da5058c4a7ad5e2e52", 4: 235, 6: "20522185176", 7: "3788524500/2847393618/0", 8: "0/0/14" },   // camp/richeQuartz/n50/g3/toutes
  111: { 1: "9a07a368c44db1618cb672ac791ea36e", 2: "b4a5e9a9e2dfe45016422e1969e8dc9a", 4: 195, 6: "2775279100", 7: "3788524500/3045729102/0" },   // camp/richeQuartz/n50/g3/moitie
  112: { 1: "8921d6a945a81422e4d8ab0d050c643b", 2: "82f256ea73a348ff79e8984331f2d27a", 4: 235, 6: "20522185176", 7: "3788524500/2847393618/0", 8: "0/0/14" },   // camp/richeScorie/n50/g3/toutes
  113: { 1: "9a07a368c44db1618cb672ac791ea36e", 2: "a0e45e0537ad7a8d0700484e67c338ca", 4: 195, 6: "2775279100", 7: "3788524500/3045729102/0" },   // camp/richeScorie/n50/g3/moitie
  114: { 1: "fbf1028a6f1c747002bf9f51f8441d43", 2: "a08726c256bd9bec60c45eb5fd0f690d", 4: 224, 6: "20170783548", 7: "5069152500/3657736564/0", 8: "0/2/14" },   // avantPoste/richeQuartz/n50/g3/toutes
  115: { 1: "f239b4c3faeae64b9094ffcf344fa7fe", 2: "daeebf81e68a4d64918f6a693cc95b8b", 6: "1713950253", 7: "5069152500/3972849165/0" },   // avantPoste/richeQuartz/n50/g3/moitie
  116: { 1: "fbf1028a6f1c747002bf9f51f8441d43", 2: "7f2996d8d4b62da2b7abfdf00eccd756", 4: 224, 6: "20170783548", 7: "5069152500/3657736564/0", 8: "0/2/14" },   // avantPoste/richeScorie/n50/g3/toutes
  117: { 1: "f239b4c3faeae64b9094ffcf344fa7fe", 2: "cf23682bd3dabe97fed3a9ba0f79412c", 6: "1713950253", 7: "5069152500/3972849165/0" },   // avantPoste/richeScorie/n50/g3/moitie
  118: { 1: "ee856543239bcf408cd600d82e6c7ae3", 2: "2cecf20e3a56e4584ce245b9963a0b70", 4: 209, 6: "20655587793", 7: "5602747500/4071523917/0", 8: "0/4/14" },   // base/-/n50/g3/toutes
  119: { 1: "cbeefc864c960da293c3084669e85c56", 2: "0f3eeefee0fe2bc06e388db3842adab2", 4: 183, 6: "6367035913", 7: "5602747500/4301180389/0", 8: "0/2/7" },   // base/-/n50/g3/moitie
  120: { 1: "aabbf162661f3e96c1a11976434274ef", 2: "ff0cb3be46ecbddb2ed928c356ae63d8", 7: "4392000/0/18621287" },   // camp/richeQuartz/n5/g4/toutes
  121: { 1: "cf723516334e6ea19bf8c915042f9bd6", 2: "c22f41524520e273f53fb23591222c8c", 7: "17628040/982473/7310512" },   // camp/richeQuartz/n5/g4/moitie
  122: { 1: "aabbf162661f3e96c1a11976434274ef", 2: "24609f3e655df267dd2a4d01c51e16db", 7: "4392000/0/18621287" },   // camp/richeScorie/n5/g4/toutes
  123: { 1: "cf723516334e6ea19bf8c915042f9bd6", 2: "aba4101fb8f527348648f801de05c922", 7: "17628040/982473/7310512" },   // camp/richeScorie/n5/g4/moitie
  124: { 1: "644caf56bf5196e98c86cf8fe670841e", 2: "3f4c69674955151136116f0bb9ecd5b0", 4: 367, 6: "90940", 7: "2928000/1413962/17979234" },   // avantPoste/richeQuartz/n5/g4/toutes
  125: { 1: "118043f62d57405ee135eec1a8e683d4", 2: "d02cb5c660adcf91556fe2cee38b7946", 5: "{\"quartz\":17382,\"scorie\":5794}", 6: "50536", 7: "20721840/3062284/6867189" },   // avantPoste/richeQuartz/n5/g4/moitie
  126: { 1: "644caf56bf5196e98c86cf8fe670841e", 2: "ae673a6b1ae66e0c721c988c0c6eecf5", 4: 367, 6: "90940", 7: "2928000/1413962/17979234" },   // avantPoste/richeScorie/n5/g4/toutes
  127: { 1: "118043f62d57405ee135eec1a8e683d4", 2: "851e0ceacad9744cc65369073b5ce1d6", 5: "{\"quartz\":5794,\"scorie\":17382}", 6: "50536", 7: "20721840/3062284/6867189" },   // avantPoste/richeScorie/n5/g4/moitie
  128: { 1: "07f1f61b44cfcac562e213a071ca81e1", 2: "86217c0965d3057c378be374810685a8", 4: 369, 7: "4392000/2415809/17740877", 8: "8/3/0" },   // base/-/n5/g4/toutes
  129: { 1: "562a2e7da8aa9ef5cd071a05432c8fe8", 2: "6d7cd00e6d669dfa4e9fa502292e6be3", 7: "22692000/4099200/6651958" },   // base/-/n5/g4/moitie
  130: { 1: "d0fffadac098fe1aab11e35875bec166", 2: "7df306440382f3d9124a98d7a2ecb2bb", 4: 534, 5: "{\"quartz\":131156,\"scorie\":43718}", 6: "10003764", 7: "137568537/55470020/8072774", 8: "2/6/12" },   // camp/richeQuartz/n20/g4/toutes
  131: { 1: "4de253de787e8764558b98d07e85e862", 2: "463d59bbf0570cfc06bf1cc000273650", 4: 467, 5: "{\"quartz\":92277,\"scorie\":30759}", 6: "9753324", 7: "144343107/56267200/7467716", 8: "1/6/5" },   // camp/richeQuartz/n20/g4/moitie
  132: { 1: "d0fffadac098fe1aab11e35875bec166", 2: "c373f2af13b717791f048b30516003bb", 4: 534, 5: "{\"quartz\":43718,\"scorie\":131156}", 6: "10003764", 7: "137568537/55470020/8072774", 8: "2/6/12" },   // camp/richeScorie/n20/g4/toutes
  133: { 1: "4de253de787e8764558b98d07e85e862", 2: "ab9ac62c0686567de727bf2121433979", 4: 467, 5: "{\"quartz\":30759,\"scorie\":92277}", 6: "9753324", 7: "144343107/56267200/7467716", 8: "1/6/5" },   // camp/richeScorie/n20/g4/moitie
  134: { 1: "ef3c4cc925cb4d7f79cc57e17c787b91", 2: "d1e5d975c2766f723e5deca1c07c6580", 4: 360, 5: "{\"quartz\":0,\"scorie\":0}", 6: "10626384", 7: "211002000/99716500/4281200", 8: "0/5/13" },   // avantPoste/richeQuartz/n20/g4/toutes
  135: { 1: "33b0f24db479f780cec1867483ebe739", 2: "448b1656b497de7ca4055f234f4e3e90", 4: 237, 6: "4156592", 7: "211002000/127360252/0" },   // avantPoste/richeQuartz/n20/g4/moitie
  136: { 1: "ef3c4cc925cb4d7f79cc57e17c787b91", 2: "5b0072371ddbff1841e5a40e613c009d", 4: 360, 5: "{\"quartz\":0,\"scorie\":0}", 6: "10626384", 7: "211002000/99716500/4281200", 8: "0/5/13" },   // avantPoste/richeScorie/n20/g4/toutes
  137: { 1: "33b0f24db479f780cec1867483ebe739", 2: "063e1c5518c5660a83d66e7df061d072", 4: 237, 6: "4156592", 7: "211002000/127360252/0" },   // avantPoste/richeScorie/n20/g4/moitie
  138: { 1: "21a9e7785c4be0a5113e4070dd4ac511", 2: "b01d313c4e95bcd2788991ae9ef4e4d1", 6: "13809314", 7: "226292000/108642569/0", 8: "0/6/14" },   // base/-/n20/g4/toutes
  139: { 1: "e245c8251c51b7c819661c0dd4947b9d", 2: "2b7ecff628c1afc9e4e87a7981ec10b1", 4: 221, 6: "5049137", 7: "226292000/138019756/0", 8: "0/2/7" },   // base/-/n20/g4/moitie
  140: { 1: "24d9daa411dcba6860d5b13a06222e07", 2: "0235623a6fb58e74633dfdd0fdd18307", 4: 594, 5: "{\"quartz\":18820370,\"scorie\":6273456}", 6: "1340934017", 7: "696664966/374595951/69257411", 8: "4/10/10" },   // camp/richeQuartz/n35/g4/toutes
  141: { 1: "dfa2e4d84b3f933c2c8b073be1ad447d", 2: "7527d4b88491f0939c16e48aa0b97dc2", 4: 273, 5: "{\"quartz\":0,\"scorie\":0}", 6: "282071533", 7: "855858000/549991508/0", 8: "0/3/7" },   // camp/richeQuartz/n35/g4/moitie
  142: { 1: "24d9daa411dcba6860d5b13a06222e07", 2: "791cbed0c9e3eca02e118d61f690d0a1", 4: 594, 5: "{\"quartz\":6273456,\"scorie\":18820370}", 6: "1340934017", 7: "696664966/374595951/69257411", 8: "4/10/10" },   // camp/richeScorie/n35/g4/toutes
  143: { 1: "dfa2e4d84b3f933c2c8b073be1ad447d", 2: "ef46925e003852fec33d869432374f8f", 4: 273, 5: "{\"quartz\":0,\"scorie\":0}", 6: "282071533", 7: "855858000/549991508/0", 8: "0/3/7" },   // camp/richeScorie/n35/g4/moitie
  144: { 1: "82669f8afc1782f1b1e5003fb2dd2e1f", 2: "69de863ce05a4121142881148aade624", 4: 248, 6: "775555233", 7: "1162434000/687946384/0", 8: "0/6/14" },   // avantPoste/richeQuartz/n35/g4/toutes
  145: { 1: "8cd817e39f06a529e28f8ac7697ab81e", 2: "5d68ecce94486854c8bc4f33a28a7caf", 4: 204, 6: "103022824", 7: "1162434000/790590034/0" },   // avantPoste/richeQuartz/n35/g4/moitie
  146: { 1: "82669f8afc1782f1b1e5003fb2dd2e1f", 2: "709fc213c2b07e168c03143d44c2dc93", 4: 248, 6: "775555233", 7: "1162434000/687946384/0", 8: "0/6/14" },   // avantPoste/richeScorie/n35/g4/toutes
  147: { 1: "8cd817e39f06a529e28f8ac7697ab81e", 2: "c2cd2f04d58395dcf1fbc2847c603e38", 4: 204, 6: "103022824", 7: "1162434000/790590034/0" },   // avantPoste/richeScorie/n35/g4/moitie
  148: { 1: "4ecc13883e960d19da0285ce64231d19", 2: "675939dcb7426eb14e65b881f0830d6f", 4: 254, 6: "675784200", 7: "1251852000/619976541/0", 8: "0/7/14" },   // base/-/n35/g4/toutes
  149: { 1: "0694128cc20a0ca2cb2fc7c00d98a4b9", 2: "ec42532145c9e7731b0a6f9c2649f965", 4: 213, 6: "270055189", 7: "1251852000/760096649/0", 8: "0/3/7" },   // base/-/n35/g4/moitie
  150: { 1: "fb1b4327b7913192c1d9fcfb261ae3eb", 2: "c2f294f886c94c6b6e5c6b9860265e3e", 4: 590, 5: "{\"quartz\":1082118782,\"scorie\":360706260}", 6: "109269550973", 7: "3254929500/1687230931/396297502", 8: "4/10/8" },   // camp/richeQuartz/n50/g4/toutes
  151: { 1: "eb718a961b66c1f4ee64e2ee363990c4", 2: "cb949ec5040cd35d15a18f08d33d8389", 4: 267, 5: "{\"quartz\":0,\"scorie\":0}", 6: "1833087578", 7: "3788524500/2554697583/0", 8: "0/0/7" },   // camp/richeQuartz/n50/g4/moitie
  152: { 1: "fb1b4327b7913192c1d9fcfb261ae3eb", 2: "2c16a57e0ef175148607eeb25bf11204", 4: 590, 5: "{\"quartz\":360706260,\"scorie\":1082118782}", 6: "109269550973", 7: "3254929500/1687230931/396297502", 8: "4/10/8" },   // camp/richeScorie/n50/g4/toutes
  153: { 1: "eb718a961b66c1f4ee64e2ee363990c4", 2: "c77cb6dafaae96a0d78286a38f6310de", 4: 267, 5: "{\"quartz\":0,\"scorie\":0}", 6: "1833087578", 7: "3788524500/2554697583/0", 8: "0/0/7" },   // camp/richeScorie/n50/g4/moitie
  154: { 1: "2edb1ed8d88ec26f531ac3d0d9fbd302", 2: "9b64710c13b2e4793ad0010122589bd8", 4: 249, 6: "23322410651", 7: "5069152500/3216190825/170750400", 8: "0/3/12" },   // avantPoste/richeQuartz/n50/g4/toutes
  155: { 1: "3b52af7c576379d3c2bd3549f8be9563", 2: "8563d453dcbac92900f6780e1c384d7f", 4: 217, 6: "14469797257", 7: "5069152500/3281802665/0", 8: "0/2/7" },   // avantPoste/richeQuartz/n50/g4/moitie
  156: { 1: "2edb1ed8d88ec26f531ac3d0d9fbd302", 2: "35217d9aabff11526adc51af2212bc33", 4: 249, 6: "23322410651", 7: "5069152500/3216190825/170750400", 8: "0/3/12" },   // avantPoste/richeScorie/n50/g4/toutes
  157: { 1: "3b52af7c576379d3c2bd3549f8be9563", 2: "7011a5c1bf9df3a2ee210cf666f02f32", 4: 217, 6: "14469797257", 7: "5069152500/3281802665/0", 8: "0/2/7" },   // avantPoste/richeScorie/n50/g4/moitie
  158: { 1: "ecb6ebd21f176218c01d8ae1da538030", 2: "385fd7196bb4f63160e0ddd8ea127fa5", 4: 233, 6: "64960667425", 7: "5602747500/3313098222/0", 8: "0/6/14" },   // base/-/n50/g4/toutes
  159: { 1: "c11cb4dc95ef496d812d77be6b88abd0", 2: "63e6c609b4a5819d830e6fe1d9863d9c", 4: 186, 6: "11560933585", 7: "5602747500/4045883396/0", 8: "0/1/7" },   // base/-/n50/g4/moitie
  160: { 1: "d3847929a42423c1fde72411f2985e50", 2: "2d1f8d21d9b5a8eabbf4e5c106f818f2" },   // camp/richeQuartz/n5/g5/toutes
  162: { 1: "d3847929a42423c1fde72411f2985e50", 2: "f0e3d9190d96103fbe1d9ec6f78be76d" },   // camp/richeScorie/n5/g5/toutes
  164: { 1: "1d209a24ad6c11fa794b3ebcafc602af", 2: "d8eba20591b02596f82017287a6ef8a4", 4: 357, 7: "3660000/2049600/17794473" },   // avantPoste/richeQuartz/n5/g5/toutes
  166: { 1: "1d209a24ad6c11fa794b3ebcafc602af", 2: "b59611ca52fe559dd6b9681f8c8540d2", 4: 357, 7: "3660000/2049600/17794473" },   // avantPoste/richeScorie/n5/g5/toutes
  168: { 1: "5c20de69d4c7974e84f5f5990d38e77b", 2: "71ec7886ccd712f92fd33716d3b31152", 7: "5124000/2049600/17921180" },   // base/-/n5/g5/toutes
  169: { 1: "8d87b9e47b426be44f50637241864460", 2: "7ada092ca64989a8c99726f56de248d4", 7: "22692000/3809328/6259495" },   // base/-/n5/g5/moitie
  170: { 1: "81616879c76a9405def0f7ac942f5fce", 2: "04cca6c6fec9c91073c79ff75d1e050b", 4: 506, 6: "11010970", 7: "32570648/47654654/63861741", 8: "11/7/2" },   // camp/richeQuartz/n20/g5/toutes
  171: { 1: "85b3235159d0c0046bce1ee908985300", 2: "05baabf6fc00b22a6dfa516412aaef67", 4: 436, 5: "{\"quartz\":292454,\"scorie\":97484}", 6: "3285941", 7: "122841085/74908768/26104255", 8: "3/3/1" },   // camp/richeQuartz/n20/g5/moitie
  172: { 1: "81616879c76a9405def0f7ac942f5fce", 2: "517147019458d96274072bda12072f5f", 4: 506, 6: "11010970", 7: "32570648/47654654/63861741", 8: "11/7/2" },   // camp/richeScorie/n20/g5/toutes
  173: { 1: "85b3235159d0c0046bce1ee908985300", 2: "2dab1921625af8e67975f9fb5dd39bd6", 4: 436, 5: "{\"quartz\":97484,\"scorie\":292454}", 6: "3285941", 7: "122841085/74908768/26104255", 8: "3/3/1" },   // camp/richeScorie/n20/g5/moitie
  174: { 1: "dd35ebdc57b29d27efd655ee7e9d2bbc", 2: "a8780df793990f44789f532edf6931f9", 4: 542, 5: "{\"quartz\":1069306,\"scorie\":356435}", 6: "14667591", 7: "170037151/94978982/14515720", 8: "5/8/11" },   // avantPoste/richeQuartz/n20/g5/toutes
  175: { 1: "6263f7fe2cdb6febe123dfc1f77c90bd", 2: "d021eec193f863617900466be8cf2676", 4: 873, 5: "{\"quartz\":20798,\"scorie\":6932}", 6: "7639056", 7: "209878392/124450575/1037818", 8: "0/4/6" },   // avantPoste/richeQuartz/n20/g5/moitie
  176: { 1: "dd35ebdc57b29d27efd655ee7e9d2bbc", 2: "c1dd3a843030e2c7a55dafd6fef28a48", 4: 542, 5: "{\"quartz\":356435,\"scorie\":1069306}", 6: "14667591", 7: "170037151/94978982/14515720", 8: "5/8/11" },   // avantPoste/richeScorie/n20/g5/toutes
  177: { 1: "6263f7fe2cdb6febe123dfc1f77c90bd", 2: "239dd865bc8c9a3ea2c511ba61738df9", 4: 873, 5: "{\"quartz\":6932,\"scorie\":20798}", 6: "7639056", 7: "209878392/124450575/1037818", 8: "0/4/6" },   // avantPoste/richeScorie/n20/g5/moitie
  178: { 1: "a8a08595ccbb7646567d288a4ef14b2b", 2: "f8f8e3305309e36a48ac932901c93abb", 4: 582, 5: "{\"quartz\":279306,\"scorie\":174806}", 6: "16425907", 7: "189427685/105500866/4681359", 8: "5/8/13" },   // base/-/n20/g5/toutes
  179: { 1: "084dc85e18f33db4ee49e411f9e9a99e", 2: "9a4055502befd8a18d0a1f35b383c881", 4: 246, 5: "{\"quartz\":115,\"scorie\":115}", 6: "5458729", 7: "226261668/137148992/0", 8: "0/4/7" },   // base/-/n20/g5/moitie
  180: { 1: "e01ca846e487b69b043c0947216c4d2c", 2: "1bf57fd9da66f1486c1fca1291e7cb93", 4: 283, 5: "{\"quartz\":186269,\"scorie\":62089}", 6: "877743856", 7: "853735279/452054673/0", 8: "0/4/14" },   // camp/richeQuartz/n35/g5/toutes
  181: { 1: "9d0139430ae599a84a3dde820ac7d7db", 2: "3bc8c26880c0dd360ba5820ea240b738", 4: 221, 6: "256208024", 7: "855858000/564784952/0", 8: "0/2/7" },   // camp/richeQuartz/n35/g5/moitie
  182: { 1: "e01ca846e487b69b043c0947216c4d2c", 2: "c81a8b84e5c8e4690fd2fa6dbe786434", 4: 283, 5: "{\"quartz\":62089,\"scorie\":186269}", 6: "877743856", 7: "853735279/452054673/0", 8: "0/4/14" },   // camp/richeScorie/n35/g5/toutes
  183: { 1: "9d0139430ae599a84a3dde820ac7d7db", 2: "a0867ced9e629df9cb076f512a8cac84", 4: 221, 6: "256208024", 7: "855858000/564784952/0", 8: "0/2/7" },   // camp/richeScorie/n35/g5/moitie
  184: { 1: "8bc0d4f42ee58f38a226330146cbc815", 2: "95e368acaa0389f22f8435270a05d131", 4: 275, 6: "855044031", 7: "1162434000/791630071/0", 8: "0/4/14" },   // avantPoste/richeQuartz/n35/g5/toutes
  185: { 1: "5046884ff0b4c408152c4031fb19e793", 2: "89fe819937b014be176f124ea3ca151c", 4: 207, 6: "150889304", 7: "1162434000/889699141/0" },   // avantPoste/richeQuartz/n35/g5/moitie
  186: { 1: "8bc0d4f42ee58f38a226330146cbc815", 2: "ac561c504064a5b59300767605e87099", 4: 275, 6: "855044031", 7: "1162434000/791630071/0", 8: "0/4/14" },   // avantPoste/richeScorie/n35/g5/toutes
  187: { 1: "5046884ff0b4c408152c4031fb19e793", 2: "50f9014a6ef5836ee74aa4417fa91339", 4: 207, 6: "150889304", 7: "1162434000/889699141/0" },   // avantPoste/richeScorie/n35/g5/moitie
  188: { 1: "b489e87f1a951e7b276dce78cc736047", 2: "cca41178a9e3af6b2c60d753e10edd31", 4: 230, 6: "507562414", 7: "1251852000/883590800/0", 8: "0/3/14" },   // base/-/n35/g5/toutes
  189: { 1: "cc1d33ffba7dea1be67470ee7edea1ad", 2: "2aaa1a2193c597012e4ab3f4b939659d", 4: 190, 6: "38181479", 7: "1251852000/980671722/0", 8: "0/1/7" },   // base/-/n35/g5/moitie
  190: { 1: "df90223a6f8156690e94510a5ada845b", 2: "85d9d004f615a00eef13282dc62d25cb", 4: 242, 5: "{\"quartz\":3173626,\"scorie\":1057875}", 6: "33141196753", 7: "3786177117/2204287196/0", 8: "0/3/14" },   // camp/richeQuartz/n50/g5/toutes
  191: { 1: "9eece356c4a7c0a8bd78f62a111a4df9", 2: "792fc1e08b2b2b818cb9bb1738b12f62", 6: "12546958888", 7: "3788524500/2448670898/0", 8: "0/1/7" },   // camp/richeQuartz/n50/g5/moitie
  192: { 1: "df90223a6f8156690e94510a5ada845b", 2: "678af67653054a37e9d985d4562aaa2b", 4: 242, 5: "{\"quartz\":1057875,\"scorie\":3173626}", 6: "33141196753", 7: "3786177117/2204287196/0", 8: "0/3/14" },   // camp/richeScorie/n50/g5/toutes
  193: { 1: "9eece356c4a7c0a8bd78f62a111a4df9", 2: "a16e5de580f5b32c0e672fd1a725e4db", 6: "12546958888", 7: "3788524500/2448670898/0", 8: "0/1/7" },   // camp/richeScorie/n50/g5/moitie
  194: { 1: "9fa9d0baeb0d424a2f9e69ad0cf7c447", 2: "7939ebed8af84677bba14e5edd45f602", 4: 249, 6: "64831124854", 7: "5069152500/3043472893/0", 8: "0/7/14" },   // avantPoste/richeQuartz/n50/g5/toutes
  195: { 1: "30b1e93ccb75ead814054c35938e0dc5", 2: "52881db61067f61eb3d3cb634e45ee3d", 4: 209, 6: "22209835677", 7: "5069152500/3396213202/0", 8: "0/3/7" },   // avantPoste/richeQuartz/n50/g5/moitie
  196: { 1: "9fa9d0baeb0d424a2f9e69ad0cf7c447", 2: "70f2d77305e6e4d2ee460bd433c2a356", 4: 249, 6: "64831124854", 7: "5069152500/3043472893/0", 8: "0/7/14" },   // avantPoste/richeScorie/n50/g5/toutes
  197: { 1: "30b1e93ccb75ead814054c35938e0dc5", 2: "f6d16d0e970d6b8e7f861ea502fef9ec", 4: 209, 6: "22209835677", 7: "5069152500/3396213202/0", 8: "0/3/7" },   // avantPoste/richeScorie/n50/g5/moitie
  198: { 1: "b8d278ef84a71eea366362dc271b9793", 2: "93a1cac28c1e3b88a0a3dc9dfd6ac26f", 4: 270, 5: "{\"quartz\":2883721,\"scorie\":2883721}", 6: "64799249795", 7: "5599548070/2874696489/0", 8: "0/9/14" },   // base/-/n50/g5/toutes
  199: { 1: "41da9d82e7fd1c476f4d0d192dc328ea", 2: "0db305252e0b8db0ae764711cd1013ec", 4: 207, 6: "18823497783", 7: "5602747500/3700651450/0", 8: "0/3/7" },   // base/-/n50/g5/moitie
};

/**
 * CE QUE LE LOT COLONNE DÉPLACE, PAR-DESSUS CE QUE LE LOT ARRÊT DÉPLAÇAIT DÉJÀ.
 *
 * ⚠⚠ LE TÉMOIN DU HAUT N'A TOUJOURS PAS ÉTÉ RAFRAÎCHI, ET IL NE LE SERA JAMAIS.
 * Il reste la référence d'AVANT le lot JOURNAL-DE-COMBAT. Ce bloc-ci est la
 * SECONDE couche : la référence d'un champ vaut, dans l'ordre,
 * `COLONNE[i][c]`, puis `ARRET[i][c]`, puis le témoin d'origine.
 *
 * ⚠⚠ CE QUI RESTE GARDÉ SE COMPTE, ET IL FAUT LE DIRE DANS LE BON SENS : **309
 * champs sur 1 600**, contre 568 après le lot ARRÊT — et **plus un seul des 200
 * combats n'est entièrement gardé, ni même son seul tick de fin**. C'est la
 * mesure d'un lot qui touche les TROIS moitiés du moteur : l'arrêt sur
 * prédilection du point 7 fige les attaquantes plus tôt, le déplacement latéral
 * du point 10 fait bouger la garnison — ce qu'elle n'avait jamais fait —, et le
 * point 9 change la disposition ET la composition de tous les sites.
 * **195 causes de fin sur 200 tiennent encore**, et c'est ce qui reste : le
 * combat va au même endroit, il n'y va plus par le même chemin.
 *
 * ⚠ CE QUI SERAIT SUSPECT, C'EST QU'ILS NE BOUGENT PAS. Ethan, 06/09 :
 * « ajouter l'arrêt sur prédilection EN PLUS du bâtiment », « déplacement
 * latéral identique au déplacement vertical » pour la défense des deux camps, et
 * « la disposition des unités et bâtiments ouvrage […] doit être plus
 * aléatoire ». Un raid qui s'arrête ailleurs, une garnison qui se déplace et un
 * site qui n'est plus disposé pareil ne rendent pas les mêmes PV.
 *
 * Clé : l'indice du combat dans le témoin. Valeur : les colonnes déplacées, à
 * l'indice qu'elles ont dans la ligne du témoin.
 */
export const COMBATS_DEPLACES_PAR_COLONNE = {
  0: { 1: "414140a91dd8238ccd19f1d9d86599bc", 2: "decb9a55ddc1f71a015044bda63992a1", 4: 342, 6: "75360", 7: "3660000/0/17781042", 8: "6/3/0" },   // camp/richeQuartz/n5/g1/toutes
  1: { 1: "205f5271ba6f2c4a0cd5caaf97cdb790", 2: "15fc4c03f530fba007b85d6de4c849b2", 4: 468, 5: "{\"quartz\":3454,\"scorie\":1151}", 6: "75360", 7: "18696561/0/6132759", 8: "2/3/0" },   // camp/richeQuartz/n5/g1/moitie
  2: { 1: "414140a91dd8238ccd19f1d9d86599bc", 2: "dd32cc6ae14fd75077c815bbafba475a", 4: 342, 6: "75360", 7: "3660000/0/17781042", 8: "6/3/0" },   // camp/richeScorie/n5/g1/toutes
  3: { 1: "205f5271ba6f2c4a0cd5caaf97cdb790", 2: "df3e2e62f7ceca8976bb8385f8bfd7db", 4: 468, 5: "{\"quartz\":1151,\"scorie\":3454}", 6: "75360", 7: "18696561/0/6132759", 8: "2/3/0" },   // camp/richeScorie/n5/g1/moitie
  4: { 1: "ea546179e63e17f88c6c377a7f6be360", 2: "03e22a3eac3c11ace3713dba76e8fbe3", 4: 373, 6: "125600", 7: "5124000/0/16169229", 8: "7/5/2" },   // avantPoste/richeQuartz/n5/g1/toutes
  5: { 1: "be4e0160a33bb6bea62f48c196527213", 2: "d7963dd7a8203600de86aa54473f7bc1", 4: 469, 5: "{\"quartz\":14698,\"scorie\":4899}", 6: "86125", 7: "20496000/1610400/5770444", 8: "3/3/1" },   // avantPoste/richeQuartz/n5/g1/moitie
  6: { 1: "ea546179e63e17f88c6c377a7f6be360", 2: "970e5f8baee3b2a790fc2b4a0e78a393", 4: 373, 6: "125600", 7: "5124000/0/16169229", 8: "7/5/2" },   // avantPoste/richeScorie/n5/g1/toutes
  7: { 1: "be4e0160a33bb6bea62f48c196527213", 2: "9ad23f10d8ba333a0e1ccb173bcefc39", 4: 469, 5: "{\"quartz\":4899,\"scorie\":14698}", 6: "86125", 7: "20496000/1610400/5770444", 8: "3/3/1" },   // avantPoste/richeScorie/n5/g1/moitie
  8: { 1: "d3ac4d6dc79e687ccfd792a7c5853577", 2: "db9cfdf064813ba0f82ba5c49870563e", 4: 457, 6: "150720", 7: "5124000/0/15187463", 8: "8/6/1" },   // base/-/n5/g1/toutes
  9: { 1: "a8a63fe8f36d3610be80d470f8d322c0", 2: "0c581d4a57b60b77bb872e023397abc7", 4: 378, 5: "{\"quartz\":769,\"scorie\":5277}", 6: "79987", 7: "21886784/2885602/4231990", 8: "3/3/2" },   // base/-/n5/g1/moitie
  10: { 1: "2f3403c0225190b54e2b7823b3542e55", 2: "45f604a689e7e715e50a2e210e10cdad", 4: 533, 5: "{\"quartz\":142401,\"scorie\":47467}", 6: "18577760", 7: "127897262/53209200/24111638", 8: "2/8/10" },   // camp/richeQuartz/n20/g1/toutes
  11: { 1: "ce72c49baf7156afea6cb2987a84ce86", 2: "d2f68b74a715fa2a54c952cc892e8d24", 4: 299, 5: "{\"quartz\":0,\"scorie\":0}", 6: "4049142", 7: "152900000/86341166/0", 8: "0/1/7" },   // camp/richeQuartz/n20/g1/moitie
  12: { 1: "2f3403c0225190b54e2b7823b3542e55", 2: "59c214e75e242a29db4d54190b813547", 4: 533, 5: "{\"quartz\":47467,\"scorie\":142401}", 6: "18577760", 7: "127897262/53209200/24111638", 8: "2/8/10" },   // camp/richeScorie/n20/g1/toutes
  13: { 1: "ce72c49baf7156afea6cb2987a84ce86", 2: "08458b6d4b3952ede03f21009b489dd2", 4: 299, 5: "{\"quartz\":0,\"scorie\":0}", 6: "4049142", 7: "152900000/86341166/0", 8: "0/1/7" },   // camp/richeScorie/n20/g1/moitie
  14: { 1: "957d5d1aa0e6d1704510f2709eb0c38d", 2: "d480b35fcdb97027c6c17eda5417a4fc", 4: 809, 5: "{\"quartz\":849063,\"scorie\":283021}", 6: "18098157", 7: "180422000/100961837/749324", 8: "4/8/13" },   // avantPoste/richeQuartz/n20/g1/toutes
  15: { 1: "1b0b56ac67b31ad203fff113bddbc783", 2: "74c1ae7e73330c76c0953271aac0f6b6", 4: 287, 5: "{\"quartz\":0,\"scorie\":0}", 6: "4459059", 7: "211002000/135360451/0", 8: "0/2/7" },   // avantPoste/richeQuartz/n20/g1/moitie
  16: { 1: "957d5d1aa0e6d1704510f2709eb0c38d", 2: "7429b4001ea85d40cac6cfef4f2aef7e", 4: 809, 5: "{\"quartz\":283021,\"scorie\":849063}", 6: "18098157", 7: "180422000/100961837/749324", 8: "4/8/13" },   // avantPoste/richeScorie/n20/g1/toutes
  17: { 1: "1b0b56ac67b31ad203fff113bddbc783", 2: "ab3a01ea36094a6d7ea6d81d0faa3734", 4: 287, 5: "{\"quartz\":0,\"scorie\":0}", 6: "4459059", 7: "211002000/135360451/0", 8: "0/2/7" },   // avantPoste/richeScorie/n20/g1/moitie
  18: { 1: "798f975ae2fc228ba1164bd4118c90a7", 2: "e0e3300dc2df9479dc3f792837295aa0", 4: 592, 5: "{\"quartz\":279911,\"scorie\":175411}", 6: "24732314", 7: "189268284/79426430/5504400", 8: "5/12/13" },   // base/-/n20/g1/toutes
  19: { 1: "31ce88a29626065f6514eb104c0608b9", 2: "97ce2b50fa11e019e9ab4481321270db", 4: 289, 5: "{\"quartz\":118,\"scorie\":118}", 6: "7784915", 7: "226260751/124939419/0", 8: "0/3/7" },   // base/-/n20/g1/moitie
  20: { 1: "c6f89fce841ba85ca19530143997f7ea", 2: "265289a07160cf7d30a37708e35e3ec4", 4: 275, 5: "{\"quartz\":0,\"scorie\":0}", 6: "940911185", 7: "855858000/453756469/51096000", 8: "0/2/13" },   // camp/richeQuartz/n35/g1/toutes
  21: { 1: "717b3e217c803bd988807ffbc67670ec", 2: "85ecea3dbea1470201749e4dc39815bd", 4: 239, 5: "{\"quartz\":0,\"scorie\":0}", 6: "237791553", 7: "855858000/568169691/0", 8: "0/0/7" },   // camp/richeQuartz/n35/g1/moitie
  22: { 1: "c6f89fce841ba85ca19530143997f7ea", 2: "d5f56d9e7dfcecac5f3eced51dbe82ea", 4: 275, 5: "{\"quartz\":0,\"scorie\":0}", 6: "940911185", 7: "855858000/453756469/51096000", 8: "0/2/13" },   // camp/richeScorie/n35/g1/toutes
  23: { 1: "717b3e217c803bd988807ffbc67670ec", 2: "098b01bf223492ce0861485efb050264", 4: 239, 5: "{\"quartz\":0,\"scorie\":0}", 6: "237791553", 7: "855858000/568169691/0", 8: "0/0/7" },   // camp/richeScorie/n35/g1/moitie
  24: { 1: "80d2f4d4165ded7015c95e8a48edda45", 2: "09cb2395605ec1f2ed896680cf6084ba", 4: 249, 6: "233315341", 7: "1162434000/751356197/0", 8: "0/2/14" },   // avantPoste/richeQuartz/n35/g1/toutes
  25: { 1: "e0bba3f852b771d550b0186184f24c09", 2: "bbe0a831a9eb272b61cc2fc5681c457d", 4: 218, 6: "208301977", 7: "1162434000/872906843/0", 8: "0/1/7" },   // avantPoste/richeQuartz/n35/g1/moitie
  26: { 1: "80d2f4d4165ded7015c95e8a48edda45", 2: "3705ea03a4f667d86fc26e2e5d64b550", 4: 249, 6: "233315341", 7: "1162434000/751356197/0", 8: "0/2/14" },   // avantPoste/richeScorie/n35/g1/toutes
  27: { 1: "e0bba3f852b771d550b0186184f24c09", 2: "f2facebf7d63f4d1dd4cad3fe677d976", 4: 218, 6: "208301977", 7: "1162434000/872906843/0", 8: "0/1/7" },   // avantPoste/richeScorie/n35/g1/moitie
  28: { 1: "c538a06b79e629ae8f9fc199875579d9", 2: "b372e6cf9ebff585bef5729acf6c2d99", 4: 243, 6: "1031622462", 7: "1251852000/752705921/0", 8: "0/6/14" },   // base/-/n35/g1/toutes
  29: { 1: "159b11d1ff52bdce7059c01a6435de84", 2: "fd1c050ad504c1e837515482c60136dc", 4: 197, 6: "242118784", 7: "1251852000/871186800/0" },   // base/-/n35/g1/moitie
  30: { 1: "c73155a7a4594e7e4460eb3c2eb2970a", 2: "72cc811ea3ed14763788c1a63b991ad1", 4: 299, 5: "{\"quartz\":0,\"scorie\":0}", 6: "27900502895", 7: "3788524500/2603555610/0", 8: "0/3/14" },   // camp/richeQuartz/n50/g1/toutes
  31: { 1: "49d50fb75ef6f99de200903877a52964", 2: "0300f1b32bb1c8bfdbd9e88ae2ddcd2e", 4: 278, 6: "20748585434", 7: "3788524500/2811317557/0", 8: "0/1/7" },   // camp/richeQuartz/n50/g1/moitie
  32: { 1: "c73155a7a4594e7e4460eb3c2eb2970a", 2: "47c50b0836703b36fa0f21aff784f05c", 4: 299, 5: "{\"quartz\":0,\"scorie\":0}", 6: "27900502895", 7: "3788524500/2603555610/0", 8: "0/3/14" },   // camp/richeScorie/n50/g1/toutes
  33: { 1: "49d50fb75ef6f99de200903877a52964", 2: "c96e96b4e449cdfc3bf1c3ff20aeb776", 4: 278, 6: "20748585434", 7: "3788524500/2811317557/0", 8: "0/1/7" },   // camp/richeScorie/n50/g1/moitie
  34: { 1: "77c85643f83367e2e7c37aa7c815b751", 2: "2be3f509e7b1a81b3d7f76ddc8f2b1d7", 4: 249, 6: "86378014158", 7: "5069152500/2524493043/0", 8: "0/6/14" },   // avantPoste/richeQuartz/n50/g1/toutes
  35: { 1: "4f15a656126fb88f306929c002982729", 2: "13b6bb8a738cf1e66b64b9315193d954", 4: 193, 6: "5759262095", 7: "5069152500/3103258560/0", 8: "0/1/7" },   // avantPoste/richeQuartz/n50/g1/moitie
  36: { 1: "77c85643f83367e2e7c37aa7c815b751", 2: "2783fb60af318f0e8b384f0d707a241c", 4: 249, 6: "86378014158", 7: "5069152500/2524493043/0", 8: "0/6/14" },   // avantPoste/richeScorie/n50/g1/toutes
  37: { 1: "4f15a656126fb88f306929c002982729", 2: "fee5da2c80667a750205af9b37366a0c", 4: 193, 6: "5759262095", 7: "5069152500/3103258560/0", 8: "0/1/7" },   // avantPoste/richeScorie/n50/g1/moitie
  38: { 1: "5dc16156171877fe50d5b03857e21e10", 2: "d0da3cfbaf740347aa0da634fd36e8f0", 4: 244, 5: "{\"quartz\":0,\"scorie\":0}", 6: "68262990804", 7: "5602747500/3263991803/0", 8: "0/5/14" },   // base/-/n50/g1/toutes
  39: { 1: "a88eca440a18fc4231023e2d46c0ab84", 2: "ffef33445a2254cf17e552bfe893a801", 4: 197, 6: "8498826344", 7: "5602747500/3838556297/0", 8: "0/2/7" },   // base/-/n50/g1/moitie
  40: { 1: "e175fc863e4efccdae2814091a62ec1b", 2: "11b2c52a29762c06f2207b5650cf570b", 4: 326, 6: "75360", 7: "2928000/0/17783730", 8: "6/3/1" },   // camp/richeQuartz/n5/g2/toutes
  41: { 1: "367986f6f2739d309bf151193b831029", 2: "32446b08b995b84b02f683b1533d39d0", 4: 489, 5: "{\"quartz\":2582,\"scorie\":860}", 6: "75360", 7: "16222942/0/6432106", 8: "2/3/0" },   // camp/richeQuartz/n5/g2/moitie
  42: { 1: "e175fc863e4efccdae2814091a62ec1b", 2: "f2fe42f12d13491ded9ef3c5ad31e4e0", 4: 326, 6: "75360", 7: "2928000/0/17783730", 8: "6/3/1" },   // camp/richeScorie/n5/g2/toutes
  43: { 1: "367986f6f2739d309bf151193b831029", 2: "847d8a6cdf607e34f338c33705e641cd", 4: 489, 5: "{\"quartz\":860,\"scorie\":2582}", 6: "75360", 7: "16222942/0/6432106", 8: "2/3/0" },   // camp/richeScorie/n5/g2/moitie
  44: { 1: "643fca04a915cf8104d8b7503fb9991f", 2: "d4d29b35497b40b67a253114f656c386", 4: 405, 6: "125600", 7: "5856000/0/15470019", 8: "7/5/1" },   // avantPoste/richeQuartz/n5/g2/toutes
  45: { 1: "b206d5edec63e4656636a506ab452086", 2: "343cce283d43d4a419fee83beb54184f", 4: 475, 5: "{\"quartz\":14404,\"scorie\":4801}", 6: "121121", 7: "21793836/182702/4423852", 8: "2/4/1" },   // avantPoste/richeQuartz/n5/g2/moitie
  46: { 1: "643fca04a915cf8104d8b7503fb9991f", 2: "5c17bca1b68dbb54290fbe190c9b1033", 4: 405, 6: "125600", 7: "5856000/0/15470019", 8: "7/5/1" },   // avantPoste/richeScorie/n5/g2/toutes
  47: { 1: "b206d5edec63e4656636a506ab452086", 2: "9015461f854336c4bbd517f8f41cefea", 4: 475, 5: "{\"quartz\":4801,\"scorie\":14404}", 6: "121121", 7: "21793836/182702/4423852", 8: "2/4/1" },   // avantPoste/richeScorie/n5/g2/moitie
  48: { 1: "d67f5c395a6c45f385e7e9597916e51e", 2: "d8b89ba83a41c8b8209045c4fcb0366c", 4: 485, 6: "88063", 7: "7492711/2556152/14754707", 8: "6/3/2" },   // base/-/n5/g2/toutes
  49: { 1: "f90997d6f8d61edac7128146bcf646a6", 2: "8e8b621c0acf70e749db5cf724501f95", 4: 859, 5: "{\"quartz\":3399,\"scorie\":0}", 6: "150720", 7: "24883272/0/1726383", 8: "1/6/3" },   // base/-/n5/g2/moitie
  50: { 1: "c3fedbbf2f6e5a8bc1e7a2242fe01653", 2: "b618b9494360501c92380ab3de110f41", 4: 477, 5: "{\"quartz\":100660,\"scorie\":33553}", 6: "15872983", 7: "135226146/35868735/5753349", 8: "1/8/12" },   // camp/richeQuartz/n20/g2/toutes
  51: { 1: "85684dc1acdeb28786e23be313436ba8", 2: "4507c34ca27cd421662c1a75f7436526", 3: "attaquants", 4: 318, 5: "{\"quartz\":11452,\"scorie\":3817}", 6: "2432612", 7: "150889208/75571742/0", 8: "0/1/7" },   // camp/richeQuartz/n20/g2/moitie
  52: { 1: "c3fedbbf2f6e5a8bc1e7a2242fe01653", 2: "0415c62d9684a191a871e20b207a2d0c", 4: 477, 5: "{\"quartz\":33553,\"scorie\":100660}", 6: "15872983", 7: "135226146/35868735/5753349", 8: "1/8/12" },   // camp/richeScorie/n20/g2/toutes
  53: { 1: "85684dc1acdeb28786e23be313436ba8", 2: "601272e27e0dff30374871d2450a1a78", 3: "attaquants", 4: 318, 5: "{\"quartz\":3817,\"scorie\":11452}", 6: "2432612", 7: "150889208/75571742/0", 8: "0/1/7" },   // camp/richeScorie/n20/g2/moitie
  54: { 1: "9d5275808677f03958c03417b20ede50", 2: "4c23d1faadb80ac49d06ad8c9d8844df", 4: 387, 5: "{\"quartz\":138940,\"scorie\":46313}", 6: "20166337", 7: "203495861/71938884/16513200", 8: "0/11/12" },   // avantPoste/richeQuartz/n20/g2/toutes
  55: { 1: "b402819bac7b319b399a2908300a6fb8", 2: "d526aa939d3121777eda000a7eecf6d2", 4: 277, 6: "9200073", 7: "211002000/107972164/0", 8: "0/5/7" },   // avantPoste/richeQuartz/n20/g2/moitie
  56: { 1: "9d5275808677f03958c03417b20ede50", 2: "7a486d9f076d5db6e9c3b99adfbbbb71", 4: 387, 5: "{\"quartz\":46313,\"scorie\":138940}", 6: "20166337", 7: "203495861/71938884/16513200", 8: "0/11/12" },   // avantPoste/richeScorie/n20/g2/toutes
  57: { 1: "b402819bac7b319b399a2908300a6fb8", 2: "293b4491f844ed4a6fc5f3c8b1901100", 4: 277, 6: "9200073", 7: "211002000/107972164/0", 8: "0/5/7" },   // avantPoste/richeScorie/n20/g2/moitie
  58: { 1: "002ebdaa16299dc02f6e9e251f58d6b7", 2: "5c4c0b438ee444742c525a63d1a84341", 4: 647, 5: "{\"quartz\":157752,\"scorie\":69666}", 6: "29471520", 7: "202788697/55181386/12280778", 8: "2/14/11" },   // base/-/n20/g2/toutes
  59: { 1: "c487dac00cb72cf6ea9cd315e47092b8", 2: "eb9a419c7300e7c3ce25bbe574895fa4", 4: 315, 6: "4137204", 7: "226292000/119780997/0", 8: "0/1/7" },   // base/-/n20/g2/moitie
  60: { 1: "f70da8e8fb391ffb5d8a59cbc5462e65", 2: "441898865e5ce157a101759f731a6c6e", 4: 306, 5: "{\"quartz\":0,\"scorie\":0}", 6: "980399464", 7: "855858000/543082387/0", 8: "0/5/14" },   // camp/richeQuartz/n35/g2/toutes
  61: { 1: "b191cb6889db168d09da86c73594c09e", 2: "060afd5edff4f4207837d7b25b445dd7", 4: 251, 6: "241144113", 7: "855858000/684153289/0", 8: "0/1/7" },   // camp/richeQuartz/n35/g2/moitie
  62: { 1: "f70da8e8fb391ffb5d8a59cbc5462e65", 2: "d835470a6904c7bb2f84881407c7b132", 4: 306, 5: "{\"quartz\":0,\"scorie\":0}", 6: "980399464", 7: "855858000/543082387/0", 8: "0/5/14" },   // camp/richeScorie/n35/g2/toutes
  63: { 1: "b191cb6889db168d09da86c73594c09e", 2: "541fd6f128ba3adcbb46fbfeaa68d1ab", 4: 251, 6: "241144113", 7: "855858000/684153289/0", 8: "0/1/7" },   // camp/richeScorie/n35/g2/moitie
  64: { 1: "b83f5760178fac39e738e1742e6e3252", 2: "42b9d021b0ffc6079318008cf4722514", 4: 345, 6: "1686474241", 7: "1162434000/576249182/51096000", 8: "0/7/13" },   // avantPoste/richeQuartz/n35/g2/toutes
  65: { 1: "b3d7b2ff40b4ad24a02ca11ba0dacaec", 2: "39e5a6c29b0df099a0a5c3fd8753a9a2", 4: 213, 6: "211408016", 7: "1162434000/747457557/0", 8: "0/0/7" },   // avantPoste/richeQuartz/n35/g2/moitie
  66: { 1: "b83f5760178fac39e738e1742e6e3252", 2: "9b602aba9c955202cc6579f1fe3f9487", 4: 345, 6: "1686474241", 7: "1162434000/576249182/51096000", 8: "0/7/13" },   // avantPoste/richeScorie/n35/g2/toutes
  67: { 1: "b3d7b2ff40b4ad24a02ca11ba0dacaec", 2: "a44c4185d0dbd0070b9667fac76725e8", 4: 213, 6: "211408016", 7: "1162434000/747457557/0", 8: "0/0/7" },   // avantPoste/richeScorie/n35/g2/moitie
  68: { 1: "e3cd2e9aa39a2551f2d4eafc2cdcff12", 2: "7c43627edb5b8c7f9f9565b64d300450", 4: 279, 6: "1459213424", 7: "1251852000/707344663/0", 8: "0/6/14" },   // base/-/n35/g2/toutes
  69: { 1: "d389c9c8bace8f5e9409d8df769068a5", 2: "4c4736b19ee4a12cb6cce6fcb8ec0ee4", 4: 210, 6: "192975494", 7: "1251852000/890072126/0", 8: "0/0/7" },   // base/-/n35/g2/moitie
  70: { 1: "6d1f517164ad29bc9be5bcd434c6a017", 2: "a396618e895b5d00cc6f4e7f3a6568b9", 4: 252, 6: "16728065018", 7: "3788524500/2285089485/0", 8: "0/4/14" },   // camp/richeQuartz/n50/g2/toutes
  71: { 1: "706c415549fa065cb52656c859263da6", 2: "96d744c3869ee66975bbb854cc1cce8c", 4: 217, 6: "1565988123", 7: "3788524500/3069869408/0", 8: "0/1/7" },   // camp/richeQuartz/n50/g2/moitie
  72: { 1: "6d1f517164ad29bc9be5bcd434c6a017", 2: "ce9cb87cdc455116c1a43ab50809125d", 4: 252, 6: "16728065018", 7: "3788524500/2285089485/0", 8: "0/4/14" },   // camp/richeScorie/n50/g2/toutes
  73: { 1: "706c415549fa065cb52656c859263da6", 2: "922ae1f186eddd1ef1761ed2b83b07a5", 4: 217, 6: "1565988123", 7: "3788524500/3069869408/0", 8: "0/1/7" },   // camp/richeScorie/n50/g2/moitie
  74: { 1: "165d7a7ebb768bdbe8d455d628aa87d3", 2: "bb66329c2dec1503a906fddbef4c6720", 4: 273, 6: "27619715514", 7: "5069152500/3482033815/0", 8: "0/6/14" },   // avantPoste/richeQuartz/n50/g2/toutes
  75: { 1: "32a35a63ecfefc9a35efec66df18d5ce", 2: "07512125e8a614635b21ebacf8ff83da", 4: 223, 6: "6465495284", 7: "5069152500/4164876737/0", 8: "0/3/7" },   // avantPoste/richeQuartz/n50/g2/moitie
  76: { 1: "165d7a7ebb768bdbe8d455d628aa87d3", 2: "332140d82874c9ccfd9ded1fdbe18cb7", 4: 273, 6: "27619715514", 7: "5069152500/3482033815/0", 8: "0/6/14" },   // avantPoste/richeScorie/n50/g2/toutes
  77: { 1: "32a35a63ecfefc9a35efec66df18d5ce", 2: "7264af4f8cf442e6a34ccfbd1f227daf", 4: 223, 6: "6465495284", 7: "5069152500/4164876737/0", 8: "0/3/7" },   // avantPoste/richeScorie/n50/g2/moitie
  78: { 1: "be83dfe21c92d57e516be81fa9a48fcd", 2: "4e1e277c3bf2723e2926f100008057e8", 4: 237, 6: "30617001380", 7: "5602747500/3568893876/0", 8: "0/5/14" },   // base/-/n50/g2/toutes
  79: { 1: "c3819b5c5e9c3d9016f08aa904d955e0", 2: "0dca0255c02af8efc9fb7237c12f0b15", 4: 191, 6: "6326235055", 7: "5602747500/4283363233/0", 8: "0/2/7" },   // base/-/n50/g2/moitie
  80: { 1: "e9671a78f471ec6c2daac56956812d76", 2: "0e7a9e2761a3c16a1a53b156ac8bc3a2", 4: 386, 6: "75360", 7: "3660000/0/16336117", 8: "6/3/1" },   // camp/richeQuartz/n5/g3/toutes
  81: { 1: "9d0483828c300e6b0c56b3064362803f", 2: "210864ee0ef3020e60066e6e82f829f9", 4: 453, 5: "{\"quartz\":1329,\"scorie\":443}", 6: "75360", 7: "18711340/0/5544917", 8: "1/3/1" },   // camp/richeQuartz/n5/g3/moitie
  82: { 1: "e9671a78f471ec6c2daac56956812d76", 2: "5fd8c7a39e6c55b589cd114fa4d3ba32", 4: 386, 6: "75360", 7: "3660000/0/16336117", 8: "6/3/1" },   // camp/richeScorie/n5/g3/toutes
  83: { 1: "9d0483828c300e6b0c56b3064362803f", 2: "0ff4f6bbb3898482ad054e9aab62da34", 4: 453, 5: "{\"quartz\":443,\"scorie\":1329}", 6: "75360", 7: "18711340/0/5544917", 8: "1/3/1" },   // camp/richeScorie/n5/g3/moitie
  84: { 1: "ae5993a12b5bd8063ba8d053796e8174", 2: "9e94ec61ebd47d31748fdd7a71298fb8", 4: 460, 6: "122393", 7: "5124000/130812/17726928", 8: "7/4/0" },   // avantPoste/richeQuartz/n5/g3/toutes
  85: { 1: "26859f5062f7ef5be98daaa937051362", 2: "f559b56d4cee3cf84cb6a502e6175886", 4: 385, 5: "{\"quartz\":14763,\"scorie\":4921}", 6: "77786", 7: "20374445/1950605/4444162", 8: "3/3/2" },   // avantPoste/richeQuartz/n5/g3/moitie
  86: { 1: "ae5993a12b5bd8063ba8d053796e8174", 2: "e3eb8b4c8c70b5685f6fdaafbee42dda", 4: 460, 6: "122393", 7: "5124000/130812/17726928", 8: "7/4/0" },   // avantPoste/richeScorie/n5/g3/toutes
  87: { 1: "26859f5062f7ef5be98daaa937051362", 2: "a109de7e6fbc5457a444e29f5edd231f", 4: 385, 5: "{\"quartz\":4921,\"scorie\":14763}", 6: "77786", 7: "20374445/1950605/4444162", 8: "3/3/2" },   // avantPoste/richeScorie/n5/g3/moitie
  88: { 1: "bf95d6ec4f0509ed30dace8db94c8543", 2: "7ccbd8b8aaad9b411981a8585ff91a8a", 3: "souche", 4: 567, 5: "{\"quartz\":10552,\"scorie\":9044}", 6: "150720", 7: "5856000/0/13301859", 8: "7/6/4" },   // base/-/n5/g3/toutes
  89: { 1: "e9195e75d1d6c598775a9fc33861aae5", 2: "c54df150bd99f6c1dffc01f08bdd00e9", 4: 515, 5: "{\"quartz\":912,\"scorie\":3173}", 6: "100480", 7: "22961376/2049600/3968980", 8: "2/4/2" },   // base/-/n5/g3/moitie
  90: { 1: "a91786c1435dc9be550115d69b121337", 2: "7980e5db7d16f92d64a081c84fae6266", 4: 359, 5: "{\"quartz\":102304,\"scorie\":34101}", 6: "17938766", 7: "134937562/49984140/0", 8: "1/8/14" },   // camp/richeQuartz/n20/g3/toutes
  91: { 1: "935d293ff1da9eb3ca9239c395435203", 2: "27a765842c44fc5356a527b632b26597", 4: 331, 5: "{\"quartz\":4305,\"scorie\":1435}", 6: "11457391", 7: "152144064/73894537/0", 8: "0/3/7" },   // camp/richeQuartz/n20/g3/moitie
  92: { 1: "a91786c1435dc9be550115d69b121337", 2: "4b167ee3e85d08f2b0977126d8473c14", 4: 359, 5: "{\"quartz\":34101,\"scorie\":102304}", 6: "17938766", 7: "134937562/49984140/0", 8: "1/8/14" },   // camp/richeScorie/n20/g3/toutes
  93: { 1: "935d293ff1da9eb3ca9239c395435203", 2: "a791fd31429b524da355f48c89a60359", 4: 331, 5: "{\"quartz\":1435,\"scorie\":4305}", 6: "11457391", 7: "152144064/73894537/0", 8: "0/3/7" },   // camp/richeScorie/n20/g3/moitie
  94: { 1: "651cbc702f6fb9fadfb0cb2779946897", 2: "c69045799cbaa7f58dc77866c67e0b84", 4: 740, 5: "{\"quartz\":488508,\"scorie\":162836}", 6: "25628701", 7: "189079211/70215583/5256045", 8: "2/10/12" },   // avantPoste/richeQuartz/n20/g3/toutes
  95: { 1: "e036f6091a78ca49ed0ed119599fc0b1", 2: "d174e1c7638d7e6aff429b50faee9b36", 4: 332, 5: "{\"quartz\":2121,\"scorie\":707}", 6: "11920015", 7: "210887390/113217039/0", 8: "0/5/7" },   // avantPoste/richeQuartz/n20/g3/moitie
  96: { 1: "651cbc702f6fb9fadfb0cb2779946897", 2: "0020876818542672ac32118c686c69ed", 4: 740, 5: "{\"quartz\":162836,\"scorie\":488508}", 6: "25628701", 7: "189079211/70215583/5256045", 8: "2/10/12" },   // avantPoste/richeScorie/n20/g3/toutes
  97: { 1: "e036f6091a78ca49ed0ed119599fc0b1", 2: "b9e1134eec9d5f0e3e9bd8df61d652b6", 4: 332, 5: "{\"quartz\":707,\"scorie\":2121}", 6: "11920015", 7: "210887390/113217039/0", 8: "0/5/7" },   // avantPoste/richeScorie/n20/g3/moitie
  98: { 1: "5a99542e44e841f973889edada5996a1", 2: "a6dcac09e2cec3c026084858a191a8df", 4: 309, 6: "22914613", 7: "226292000/97962608/18348000", 8: "0/9/12" },   // base/-/n20/g3/toutes
  99: { 1: "272b4f71a89df65bacad49a3d68de0d6", 2: "5c7a1490a5de019cc652f48fc465af82", 4: 279, 6: "11843630", 7: "226292000/128434863/0", 8: "0/5/7" },   // base/-/n20/g3/moitie
  100: { 1: "9015e2641c7c950393fde383211bc34b", 2: "e36870c94aa6b0f46fb0dd012c1bec3c", 4: 335, 6: "1366128024", 7: "855858000/366826343/0", 8: "0/7/14" },   // camp/richeQuartz/n35/g3/toutes
  101: { 1: "ac1753e564a790f813309bb9251318e2", 2: "59ffe035f3d9e0261760b65cc81b847a", 4: 222, 6: "408354331", 7: "855858000/556643418/0", 8: "0/1/7" },   // camp/richeQuartz/n35/g3/moitie
  102: { 1: "9015e2641c7c950393fde383211bc34b", 2: "780cd348c3a92be8c69ef7eec1984aa5", 4: 335, 6: "1366128024", 7: "855858000/366826343/0", 8: "0/7/14" },   // camp/richeScorie/n35/g3/toutes
  103: { 1: "ac1753e564a790f813309bb9251318e2", 2: "7c5794778d0ad54cf65a20db156cb955", 4: 222, 6: "408354331", 7: "855858000/556643418/0", 8: "0/1/7" },   // camp/richeScorie/n35/g3/moitie
  104: { 1: "5899870d649da4f7ff6548daed35b9bd", 2: "77cabf9c694e5c893800227d187a1917", 4: 215, 6: "84895145", 7: "1162434000/805228436/0", 8: "0/2/14" },   // avantPoste/richeQuartz/n35/g3/toutes
  105: { 1: "f725394ca2d5783d0afd0136afb63431", 2: "5ce61b9a2aedc8ece8402c7cfc1bdd78", 4: 194, 6: "25456235", 7: "1162434000/938764105/0", 8: "0/1/7" },   // avantPoste/richeQuartz/n35/g3/moitie
  106: { 1: "5899870d649da4f7ff6548daed35b9bd", 2: "a8dda796f41777392b12502bb343c832", 4: 215, 6: "84895145", 7: "1162434000/805228436/0", 8: "0/2/14" },   // avantPoste/richeScorie/n35/g3/toutes
  107: { 1: "f725394ca2d5783d0afd0136afb63431", 2: "074297de4aa07ec72dd5893520dc92d6", 4: 194, 6: "25456235", 7: "1162434000/938764105/0", 8: "0/1/7" },   // avantPoste/richeScorie/n35/g3/moitie
  108: { 1: "a0d1b5a63a192ad14363c22ca1ceedac", 2: "1ebfd01bb185569cb15a869125371e57", 4: 251, 6: "1206084943", 7: "1251852000/733883373/0", 8: "0/9/14" },   // base/-/n35/g3/toutes
  109: { 1: "895865ba74f2996eb15dcfb63d2d3e75", 2: "eb6b328af3da3bdedfd27abbdf6df60b", 4: 203, 6: "82666996", 7: "1251852000/958773588/0" },   // base/-/n35/g3/moitie
  110: { 1: "36c48874a54915610783885f37ecbe0f", 2: "bef0ccac4a1145fa0e3a63588d5d4b10", 4: 371, 6: "74867709065", 7: "3788524500/2336348681/0", 8: "0/3/14" },   // camp/richeQuartz/n50/g3/toutes
  111: { 1: "754cc1ccaf4cfbf8a974a856c35978fd", 2: "365dcfa2649792602788ade66915a517", 4: 239, 6: "8336914279", 7: "3788524500/2746429580/0", 8: "0/1/7" },   // camp/richeQuartz/n50/g3/moitie
  112: { 1: "36c48874a54915610783885f37ecbe0f", 2: "f12690254377c354dbab37666925dacd", 4: 371, 6: "74867709065", 7: "3788524500/2336348681/0", 8: "0/3/14" },   // camp/richeScorie/n50/g3/toutes
  113: { 1: "754cc1ccaf4cfbf8a974a856c35978fd", 2: "e4a34a5c4dbd92bf90ff4367d5a65904", 4: 239, 6: "8336914279", 7: "3788524500/2746429580/0", 8: "0/1/7" },   // camp/richeScorie/n50/g3/moitie
  114: { 1: "eeee402c9a8fd248a3f34cb161d7efa6", 2: "7b3983b46dbf50b759cd9f01918a979f", 4: 275, 6: "109385606741", 7: "5069152500/2368768239/0", 8: "0/10/14" },   // avantPoste/richeQuartz/n50/g3/toutes
  115: { 1: "0524154b7573b02a8d7c8cf7da07a2b0", 2: "af837b06aca7855b4f53ea840030d295", 4: 206, 6: "47162775652", 7: "5069152500/3032946730/0", 8: "0/5/7" },   // avantPoste/richeQuartz/n50/g3/moitie
  116: { 1: "eeee402c9a8fd248a3f34cb161d7efa6", 2: "1f239dadd647714ab5b6130b57405753", 4: 275, 6: "109385606741", 7: "5069152500/2368768239/0", 8: "0/10/14" },   // avantPoste/richeScorie/n50/g3/toutes
  117: { 1: "0524154b7573b02a8d7c8cf7da07a2b0", 2: "1d522e2cc5c836c6b81df6185a2d3254", 4: 206, 6: "47162775652", 7: "5069152500/3032946730/0", 8: "0/5/7" },   // avantPoste/richeScorie/n50/g3/moitie
  118: { 1: "06a61a7fd8ffb1fdbc236ab3fb20478d", 2: "0dd8bc7a2b06fc21ed328f5b044a2be1", 4: 268, 6: "55631129103", 7: "5602747500/3754095167/213438000", 8: "0/5/13" },   // base/-/n50/g3/toutes
  119: { 1: "a0c9a4f89416c4f4fe0c4176f31270da", 2: "f64485d59035200c667ea6e32c455cc7", 4: 206, 6: "8178496769", 7: "5602747500/4293052880/0", 8: "0/3/7" },   // base/-/n50/g3/moitie
  120: { 1: "1215cb86b03b8ebc7ea8dc996314dce2", 2: "90432b75ad78fac4306d29cd506daa79", 4: 350, 7: "5856000/0/17582652" },   // camp/richeQuartz/n5/g4/toutes
  121: { 1: "be34c8bacf2179aecf2de964c075bd8e", 2: "2234531930bda2f95f1c95a9be92b392", 4: 492, 5: "{\"quartz\":1695,\"scorie\":565}", 6: "75360", 7: "20496000/0/5478490", 8: "1/3/1" },   // camp/richeQuartz/n5/g4/moitie
  122: { 1: "1215cb86b03b8ebc7ea8dc996314dce2", 2: "83723a051a9d80495ee3848fef5b24a0", 4: 350, 7: "5856000/0/17582652" },   // camp/richeScorie/n5/g4/toutes
  123: { 1: "be34c8bacf2179aecf2de964c075bd8e", 2: "616a6583d26095e9be567a45011f4648", 4: 492, 5: "{\"quartz\":565,\"scorie\":1695}", 6: "75360", 7: "20496000/0/5478490", 8: "1/3/1" },   // camp/richeScorie/n5/g4/moitie
  124: { 1: "b9cce900fe446897c0bf778d56c046b1", 2: "ae0052c55f30e039fb174efe6290e1ae", 4: 387, 6: "125600", 7: "7320000/0/15621345", 8: "6/5/1" },   // avantPoste/richeQuartz/n5/g4/toutes
  125: { 1: "c00a9a0476bdd6eca1d22124a71e5c9d", 2: "069736b43962474502a3dc570bbbdef1", 4: 400, 5: "{\"quartz\":11023,\"scorie\":3674}", 6: "104618", 7: "22692000/855963/3171274", 8: "2/4/3" },   // avantPoste/richeQuartz/n5/g4/moitie
  126: { 1: "b9cce900fe446897c0bf778d56c046b1", 2: "7df19e96a9402dcf57c11227d06f65a6", 4: 387, 6: "125600", 7: "7320000/0/15621345", 8: "6/5/1" },   // avantPoste/richeScorie/n5/g4/toutes
  127: { 1: "c00a9a0476bdd6eca1d22124a71e5c9d", 2: "57120be29b6988286d2582aa40cb86ee", 4: 400, 5: "{\"quartz\":3674,\"scorie\":11023}", 6: "104618", 7: "22692000/855963/3171274", 8: "2/4/3" },   // avantPoste/richeScorie/n5/g4/moitie
  128: { 1: "e46d336887a705742dacd3dfb522e6b1", 2: "4f515d9eaed16defe8416b39a5e5b346", 4: 482, 6: "150720", 7: "7320000/0/14708416", 8: "7/6/3" },   // base/-/n5/g4/toutes
  129: { 1: "e52fc8a49bbf88597f109e04766ec8c2", 2: "8928209af3c288246770532a947af7ce", 4: 423, 5: "{\"quartz\":2682,\"scorie\":2261}", 6: "129354", 7: "23883420/871635/1864375", 8: "2/5/4" },   // base/-/n5/g4/moitie
  130: { 1: "47794534bc0de3f8e3c05e8ff52286d9", 2: "cadc2a9e9a0274d72312cd70d7522856", 4: 311, 5: "{\"quartz\":10389,\"scorie\":3463}", 6: "8466214", 7: "151455188/50673878/1391270", 8: "0/5/13" },   // camp/richeQuartz/n20/g4/toutes
  131: { 1: "ea6d70364ab4631f7802ebd5b971e5c7", 2: "97305a7f8ffd58aa388875ef264fe354", 4: 359, 5: "{\"quartz\":0,\"scorie\":0}", 6: "3725602", 7: "152900000/72767119/0", 8: "0/2/7" },   // camp/richeQuartz/n20/g4/moitie
  132: { 1: "47794534bc0de3f8e3c05e8ff52286d9", 2: "d16190b1a811d4a49242c88c894efb80", 4: 311, 5: "{\"quartz\":3463,\"scorie\":10389}", 6: "8466214", 7: "151455188/50673878/1391270", 8: "0/5/13" },   // camp/richeScorie/n20/g4/toutes
  133: { 1: "ea6d70364ab4631f7802ebd5b971e5c7", 2: "82c05d666abc745570d43d579bb95b85", 4: 359, 5: "{\"quartz\":0,\"scorie\":0}", 6: "3725602", 7: "152900000/72767119/0", 8: "0/2/7" },   // camp/richeScorie/n20/g4/moitie
  134: { 1: "059f899c3e95fbc278ae09aaad21ca7b", 2: "ad417ac3ddf3790b739eaa4af8ef5159", 4: 332, 5: "{\"quartz\":66301,\"scorie\":22100}", 6: "22303708", 7: "207420107/74238434/12232000", 8: "0/11/13" },   // avantPoste/richeQuartz/n20/g4/toutes
  135: { 1: "f8a3ba97ad913f2082f5f5e457c144de", 2: "a487de193d29f76aaf97c9d823ad88a4", 4: 305, 6: "6230185", 7: "211002000/119128028/0", 8: "0/4/7" },   // avantPoste/richeQuartz/n20/g4/moitie
  136: { 1: "059f899c3e95fbc278ae09aaad21ca7b", 2: "c77f4a5f79d4dbc02696abfe3f1b7149", 4: 332, 5: "{\"quartz\":22100,\"scorie\":66301}", 6: "22303708", 7: "207420107/74238434/12232000", 8: "0/11/13" },   // avantPoste/richeScorie/n20/g4/toutes
  137: { 1: "f8a3ba97ad913f2082f5f5e457c144de", 2: "5deeabbae0b4dd8bbef055faa7614fd2", 4: 305, 6: "6230185", 7: "211002000/119128028/0", 8: "0/4/7" },   // avantPoste/richeScorie/n20/g4/moitie
  138: { 1: "284d4ff93bf78594d5c3cf5cf1cdc42c", 2: "f082918cbb65564ec17eddab98846fa6", 4: 345, 6: "14572395", 7: "226292000/111862503/12232000", 8: "0/7/13" },   // base/-/n20/g4/toutes
  139: { 1: "a59dfbdcefc5f6e8d0f15fed830839c4", 2: "9d83ed10345c7755e10136d5b11ae404", 4: 301, 6: "7523072", 7: "226292000/137356196/0", 8: "0/3/7" },   // base/-/n20/g4/moitie
  140: { 1: "87b724edcd2b442d9bb6e66f7b78e98b", 2: "cb434e3286cfd8384ed6816d6908eda4", 4: 548, 5: "{\"quartz\":0,\"scorie\":0}", 6: "1560316092", 7: "855858000/389951040/25548000", 8: "0/5/13" },   // camp/richeQuartz/n35/g4/toutes
  141: { 1: "920ceed9c9077c2d03f8a463db87f320", 2: "562645e630f84c8f3150ab94dd7f80c6", 4: 217, 6: "272878825", 7: "855858000/557334412/0", 8: "0/0/7" },   // camp/richeQuartz/n35/g4/moitie
  142: { 1: "87b724edcd2b442d9bb6e66f7b78e98b", 2: "82e5e68479a6de9cf9409f6370bb92b8", 4: 548, 5: "{\"quartz\":0,\"scorie\":0}", 6: "1560316092", 7: "855858000/389951040/25548000", 8: "0/5/13" },   // camp/richeScorie/n35/g4/toutes
  143: { 1: "920ceed9c9077c2d03f8a463db87f320", 2: "cb46a580eed9b6e2304f7dfecf185a1b", 4: 217, 6: "272878825", 7: "855858000/557334412/0", 8: "0/0/7" },   // camp/richeScorie/n35/g4/moitie
  144: { 1: "eab0a263d1d719ea56947f1a231b88f0", 2: "37867b7f4750769f1abe89a7495babc3", 4: 295, 6: "1420013758", 7: "1162434000/644395385/51096000", 8: "0/5/13" },   // avantPoste/richeQuartz/n35/g4/toutes
  145: { 1: "6ee0a3e06367b54a394befc675b0c943", 2: "6e586fd6fdc14fabe54707e7133751c3", 4: 210, 6: "152842571", 7: "1162434000/761627756/0", 8: "0/1/7" },   // avantPoste/richeQuartz/n35/g4/moitie
  146: { 1: "eab0a263d1d719ea56947f1a231b88f0", 2: "e79e710050c573e88e3aff6a3e827dbc", 4: 295, 6: "1420013758", 7: "1162434000/644395385/51096000", 8: "0/5/13" },   // avantPoste/richeScorie/n35/g4/toutes
  147: { 1: "6ee0a3e06367b54a394befc675b0c943", 2: "81aae9e8fb0d7f2cacb3f7eaccfd5ab5", 4: 210, 6: "152842571", 7: "1162434000/761627756/0", 8: "0/1/7" },   // avantPoste/richeScorie/n35/g4/moitie
  148: { 1: "4d0ab707822499db94a29867d0adadae", 2: "e62c70d6e8f0b407764cb46d39cd0827", 4: 538, 6: "2397222617", 7: "1251852000/617586276/51096000", 8: "0/10/13" },   // base/-/n35/g4/toutes
  149: { 1: "c8fc85f931e754b836ddf46b5affa309", 2: "1c58cf8771e8a2574b154b62a9df8a84", 4: 184, 6: "273811530", 7: "1251852000/870633316/0", 8: "0/1/7" },   // base/-/n35/g4/moitie
  150: { 1: "288d3f9ec0fc25f411bdce04e1c03b76", 2: "399af879cb5ce23e607e4ee44daa00da", 4: 252, 5: "{\"quartz\":0,\"scorie\":0}", 6: "39666822892", 7: "3788524500/2276994515/213438000", 8: "0/2/13" },   // camp/richeQuartz/n50/g4/toutes
  151: { 1: "ca40b91dc876e8d9ed2553d93021b738", 2: "99addd212c68a17cbd254006093ca367", 4: 216, 6: "6928159382", 7: "3788524500/2732184850/0" },   // camp/richeQuartz/n50/g4/moitie
  152: { 1: "288d3f9ec0fc25f411bdce04e1c03b76", 2: "1cce3f8d5e76d88371185f546486d9d1", 4: 252, 5: "{\"quartz\":0,\"scorie\":0}", 6: "39666822892", 7: "3788524500/2276994515/213438000", 8: "0/2/13" },   // camp/richeScorie/n50/g4/toutes
  153: { 1: "ca40b91dc876e8d9ed2553d93021b738", 2: "ce40a25007b0cc7cd1f976d08cb17d09", 4: 216, 6: "6928159382", 7: "3788524500/2732184850/0" },   // camp/richeScorie/n50/g4/moitie
  154: { 1: "d14ed7e814bbc34e138c56ff1ee8c16c", 2: "f996ab473b42beb69c92e6fa890cfb14", 4: 257, 6: "72713475211", 7: "5069152500/2547369017/0", 8: "0/9/14" },   // avantPoste/richeQuartz/n50/g4/toutes
  155: { 1: "7924b2fa7dd3929aebd48ee1735792b7", 2: "206ed9630bf67dc7d871cfd3e86d2a86", 6: "4782418994", 7: "5069152500/3400387657/0" },   // avantPoste/richeQuartz/n50/g4/moitie
  156: { 1: "d14ed7e814bbc34e138c56ff1ee8c16c", 2: "b9fab1e95ff22f58e91d84cc54fa4197", 4: 257, 6: "72713475211", 7: "5069152500/2547369017/0", 8: "0/9/14" },   // avantPoste/richeScorie/n50/g4/toutes
  157: { 1: "7924b2fa7dd3929aebd48ee1735792b7", 2: "6d0c35b088c5635d68878b7799a8321e", 6: "4782418994", 7: "5069152500/3400387657/0" },   // avantPoste/richeScorie/n50/g4/moitie
  158: { 1: "f4f848e77292fcbb0d832e557c169717", 2: "0ceed6d1adb6b68ff94ca0fcf80eea54", 4: 391, 6: "113954957444", 7: "5602747500/3600773047/0" },   // base/-/n50/g4/toutes
  159: { 1: "820f3d5cc0f16516e1bf35947ed64256", 2: "e318c02a3188aee1ce2547dacbf77829", 4: 179, 6: "2629800065", 7: "5602747500/4668864934/0" },   // base/-/n50/g4/moitie
  160: { 1: "33a747e6fe4f2417e2eb5c0fac476b3d", 2: "5d48eee0c9d235b64cf916c4d424b10d", 4: 300, 6: "75360", 7: "4392000/0/19034229", 8: "5/3/0" },   // camp/richeQuartz/n5/g5/toutes
  161: { 1: "73f93eee3200e52a2fee86f51966f3e4", 2: "7f77726e89b45a9d695adc71c85fc612", 4: 386, 5: "{\"quartz\":3186,\"scorie\":1062}", 6: "54432", 7: "16536496/853766/4810971", 8: "2/2/1" },   // camp/richeQuartz/n5/g5/moitie
  162: { 1: "33a747e6fe4f2417e2eb5c0fac476b3d", 2: "d94b7aa3f50498319fc5e973ef41279c", 4: 300, 6: "75360", 7: "4392000/0/19034229", 8: "5/3/0" },   // camp/richeScorie/n5/g5/toutes
  163: { 1: "73f93eee3200e52a2fee86f51966f3e4", 2: "d39809156a98e4ee582bf8fa7b4b7601", 4: 386, 5: "{\"quartz\":1062,\"scorie\":3186}", 6: "54432", 7: "16536496/853766/4810971", 8: "2/2/1" },   // camp/richeScorie/n5/g5/moitie
  164: { 1: "d830bbe694fd6e723a03516ce6673086", 2: "deec73ac7a7c18e867412e4bd3977100", 4: 450, 6: "125600", 7: "5124000/0/14788880", 8: "7/5/2" },   // avantPoste/richeQuartz/n5/g5/toutes
  165: { 1: "5e97427b578f7c925636d1033b04ad33", 2: "a77812e4a4132fc3d3c9e237292cfac1", 4: 521, 5: "{\"quartz\":9431,\"scorie\":3143}", 6: "98398", 7: "21813600/1109712/4683340", 8: "2/3/1" },   // avantPoste/richeQuartz/n5/g5/moitie
  166: { 1: "d830bbe694fd6e723a03516ce6673086", 2: "73f826c3fa63e92bf6d206a0af10630e", 4: 450, 6: "125600", 7: "5124000/0/14788880", 8: "7/5/2" },   // avantPoste/richeScorie/n5/g5/toutes
  167: { 1: "5e97427b578f7c925636d1033b04ad33", 2: "889f58bc42b3a54dc3669f76ff5c5e83", 4: 521, 5: "{\"quartz\":3143,\"scorie\":9431}", 6: "98398", 7: "21813600/1109712/4683340", 8: "2/3/1" },   // avantPoste/richeScorie/n5/g5/moitie
  168: { 1: "ac470981108831d81ce39dceda7a8a66", 2: "30a5caf4e30e74ec5743ca0336b150d6", 4: 395, 6: "150720", 7: "7320000/0/14651799", 8: "7/6/2" },   // base/-/n5/g5/toutes
  169: { 1: "3e1694467604fdb7e73e01846a8de7b0", 2: "e6bee8dc670062a1f84d43177b5bf0eb", 4: 424, 5: "{\"quartz\":3014,\"scorie\":1967}", 6: "103971", 7: "22638026/1907157/3206916", 8: "2/4/4" },   // base/-/n5/g5/moitie
  170: { 1: "452710273a9c497bf9d28f167f8f1174", 2: "0e3a556c1cbe4d133fd6584c55e9b773", 3: "attaquants", 4: 340, 5: "{\"quartz\":27012,\"scorie\":9004}", 6: "13448650", 7: "148157194/51844821/0", 8: "0/7/14" },   // camp/richeQuartz/n20/g5/toutes
  171: { 1: "5625a1e612fa930de61d8395fe121e44", 2: "b4fb92ab0bc71352363aa6a015f917d0", 4: 307, 5: "{\"quartz\":83,\"scorie\":27}", 6: "6036443", 7: "152885322/72112768/0", 8: "0/2/7" },   // camp/richeQuartz/n20/g5/moitie
  172: { 1: "452710273a9c497bf9d28f167f8f1174", 2: "4bb2ce49cafa4620078a71d42709d0f9", 3: "attaquants", 4: 340, 5: "{\"quartz\":9004,\"scorie\":27012}", 6: "13448650", 7: "148157194/51844821/0", 8: "0/7/14" },   // camp/richeScorie/n20/g5/toutes
  173: { 1: "5625a1e612fa930de61d8395fe121e44", 2: "07dc21caa74ae81e6150915d133cf414", 4: 307, 5: "{\"quartz\":27,\"scorie\":83}", 6: "6036443", 7: "152885322/72112768/0", 8: "0/2/7" },   // camp/richeScorie/n20/g5/moitie
  174: { 1: "14d33781fc223f770c89a34ff84917c0", 2: "10afb952aca5be571db35e5c5900ea4c", 4: 374, 5: "{\"quartz\":0,\"scorie\":0}", 6: "28171982", 7: "211002000/80429344/12232000", 8: "0/10/13" },   // avantPoste/richeQuartz/n20/g5/toutes
  175: { 1: "a4b7837d1dc69d54b2a4f5adc25aa664", 2: "85379db1222df631c2b7d404d0b4f289", 4: 303, 5: "{\"quartz\":0,\"scorie\":0}", 6: "9468272", 7: "211002000/124859158/0", 8: "0/3/7" },   // avantPoste/richeQuartz/n20/g5/moitie
  176: { 1: "14d33781fc223f770c89a34ff84917c0", 2: "9bf8f140931e6e3929edea48871313e9", 4: 374, 5: "{\"quartz\":0,\"scorie\":0}", 6: "28171982", 7: "211002000/80429344/12232000", 8: "0/10/13" },   // avantPoste/richeScorie/n20/g5/toutes
  177: { 1: "a4b7837d1dc69d54b2a4f5adc25aa664", 2: "3c8a2055322e276ab659da5627e10526", 4: 303, 5: "{\"quartz\":0,\"scorie\":0}", 6: "9468272", 7: "211002000/124859158/0", 8: "0/3/7" },   // avantPoste/richeScorie/n20/g5/moitie
  178: { 1: "2a397f51dd108388b0d91fef36b37443", 2: "11871448a6da740d22d8b043d2562236", 4: 323, 5: "{\"quartz\":0,\"scorie\":0}", 6: "25143327", 7: "226292000/102909125/18348000", 8: "0/9/12" },   // base/-/n20/g5/toutes
  179: { 1: "3fac5957ce308b874663b77e9e4b9b02", 2: "785751b07f488d0d8220f7adafacddac", 4: 608, 5: "{\"quartz\":0,\"scorie\":0}", 6: "12188189", 7: "226292000/136698685/0", 8: "0/3/7" },   // base/-/n20/g5/moitie
  180: { 1: "021c218be661b9d3392ec06a06c6448e", 2: "7014f664cb4769c3d6c3102ef1cdf4c7", 4: 265, 5: "{\"quartz\":0,\"scorie\":0}", 6: "594929745", 7: "855858000/441719014/0", 8: "0/5/14" },   // camp/richeQuartz/n35/g5/toutes
  181: { 1: "8d4163a0e5cae432de177ac24b054d1b", 2: "d61512efec22dcdcbf588a9cae250798", 4: 289, 6: "433888492", 7: "855858000/495717818/0", 8: "0/3/7" },   // camp/richeQuartz/n35/g5/moitie
  182: { 1: "021c218be661b9d3392ec06a06c6448e", 2: "d3aa4766263184a0a0e7613b104c2048", 4: 265, 5: "{\"quartz\":0,\"scorie\":0}", 6: "594929745", 7: "855858000/441719014/0", 8: "0/5/14" },   // camp/richeScorie/n35/g5/toutes
  183: { 1: "8d4163a0e5cae432de177ac24b054d1b", 2: "910c769eec038fc0ade4cf9e36cd1087", 4: 289, 6: "433888492", 7: "855858000/495717818/0", 8: "0/3/7" },   // camp/richeScorie/n35/g5/moitie
  184: { 1: "cd0db0358cb846594e5571c07aa6c344", 2: "8bb67e66ed83528f62ca8db902d4a566", 4: 603, 6: "1534029069", 7: "1162434000/497688800/51096000", 8: "0/9/13" },   // avantPoste/richeQuartz/n35/g5/toutes
  185: { 1: "6fce64ae57371da9eeaddad9bf6ba932", 2: "9f8aee2e51253f81fe5dcd09a4aee4e9", 4: 599, 6: "820294308", 7: "1162434000/595293397/0", 8: "0/5/7" },   // avantPoste/richeQuartz/n35/g5/moitie
  186: { 1: "cd0db0358cb846594e5571c07aa6c344", 2: "b26353df01a473f4de474862ffe854ae", 4: 603, 6: "1534029069", 7: "1162434000/497688800/51096000", 8: "0/9/13" },   // avantPoste/richeScorie/n35/g5/toutes
  187: { 1: "6fce64ae57371da9eeaddad9bf6ba932", 2: "c801aa24b16bc0fe1ce61f1ca916f6c1", 4: 599, 6: "820294308", 7: "1162434000/595293397/0", 8: "0/5/7" },   // avantPoste/richeScorie/n35/g5/moitie
  188: { 1: "58b6e812b5a6d8b05ee7c4d445f25dbd", 2: "a564e1a1a1dea482dbce153d910e2c0a", 4: 235, 6: "483571271", 7: "1251852000/846108991/0", 8: "0/5/14" },   // base/-/n35/g5/toutes
  189: { 1: "35b5713e66371221da17f86bb3397272", 2: "b4d3d1d7433a3620728593ecfbe2efc8", 4: 195, 6: "37940648", 7: "1251852000/958901637/0" },   // base/-/n35/g5/moitie
  190: { 1: "7113b05b5e8846638b505c5ec3ffcf3c", 2: "891b3dde19fef1182adfb70ef62827ba", 4: 385, 5: "{\"quartz\":0,\"scorie\":0}", 6: "67524334378", 7: "3788524500/2047436614/213438000", 8: "0/2/13" },   // camp/richeQuartz/n50/g5/toutes
  191: { 1: "e5b128dc1af8615f181e16d3ed66a380", 2: "a40181d068b7ca45f612a1910bb7c311", 4: 222, 6: "6850873761", 7: "3788524500/2575199491/0" },   // camp/richeQuartz/n50/g5/moitie
  192: { 1: "7113b05b5e8846638b505c5ec3ffcf3c", 2: "7dae3ece671303972ca8b8d948b5b88a", 4: 385, 5: "{\"quartz\":0,\"scorie\":0}", 6: "67524334378", 7: "3788524500/2047436614/213438000", 8: "0/2/13" },   // camp/richeScorie/n50/g5/toutes
  193: { 1: "e5b128dc1af8615f181e16d3ed66a380", 2: "cb70eae27b40e752509a77f7ffab241b", 4: 222, 6: "6850873761", 7: "3788524500/2575199491/0" },   // camp/richeScorie/n50/g5/moitie
  194: { 1: "46f977ea824eed9f473f79c1699c748f", 2: "96b9f86bbbb0119982444e8c0dfd8dfa", 4: 350, 6: "70480496652", 7: "5069152500/3417248607/0", 8: "0/2/14" },   // avantPoste/richeQuartz/n50/g5/toutes
  195: { 1: "06b660529ba7124f2dabe60e6bb85da6", 2: "ecf044f18d993cac9ef73b4291861a60", 4: 196, 6: "5424391856", 7: "5069152500/3768004694/0", 8: "0/0/7" },   // avantPoste/richeQuartz/n50/g5/moitie
  196: { 1: "46f977ea824eed9f473f79c1699c748f", 2: "3d0f63466e84081dadf2fa17d93a5c69", 4: 350, 6: "70480496652", 7: "5069152500/3417248607/0", 8: "0/2/14" },   // avantPoste/richeScorie/n50/g5/toutes
  197: { 1: "06b660529ba7124f2dabe60e6bb85da6", 2: "1a08b8578546090edab7008117b810c2", 4: 196, 6: "5424391856", 7: "5069152500/3768004694/0", 8: "0/0/7" },   // avantPoste/richeScorie/n50/g5/moitie
  198: { 1: "1658d417e54ed61fe14d53d0a4131500", 2: "e642e9f13757575b396b24fd20de3f83", 4: 217, 5: "{\"quartz\":0,\"scorie\":0}", 6: "39003774157", 7: "5602747500/3823804733/0", 8: "0/3/14" },   // base/-/n50/g5/toutes
  199: { 1: "b47e3b6abca88f0f52d85d6b84acb179", 2: "94acc116c243d219650c23343c502dad", 4: 196, 6: "12180908392", 7: "5602747500/4122074641/0", 8: "0/0/7" },   // base/-/n50/g5/moitie
};

// ---------------------------------------------------------------------------
// LOT CIBLES-RANGÉES — 07/09/2026
// ---------------------------------------------------------------------------
//
// ⚠⚠ TROISIÈME COUCHE, ET ELLE S'EMPILE — elle ne remplace NI `…_PAR_ARRET` NI
// `…_PAR_COLONNE`. Les couches se lisent de la plus RÉCENTE à la plus ancienne :
// ce que CIBLES-RANGÉES déplace l'emporte, sinon ce que COLONNE déplaçait, sinon
// ce qu'ARRÊT déplaçait, sinon le témoin d'avant JOURNAL-DE-COMBAT. Empiler
// plutôt qu'écraser est ce qui garde adossés à une capture ancienne les champs
// qu'aucun de ces quatre lots n'a touchés.
//
// ⚠⚠ CE QUE LE LOT DÉPLACE, ET POURQUOI. Le lot COLONNE avait rendu la charge
// par COLONNE variable ; la RANGÉE restait une fonction pure du rang dans la
// liste, si bien qu'un site portait toujours le même nombre d'occupants sur les
// mêmes lignes — mesuré, UN SEUL profil d'occupation par rangée sur 200 graines.
// `taillesDeRangee` la tire désormais, donc `placerDefenses` et
// `placerBatiments` consomment un nombre de tirages différent, donc tout ce qui
// tire APRÈS eux se décale : obstacles, composition, vagues. Aucun barème n'a
// bougé d'un millième.
//
// Deux cents combats touchés, 1 208 champs déplacés.
export const COMBATS_DEPLACES_PAR_CIBLES_RANGEES = {
  0: { 1: "77c67a8a1e1087aba611564a6fd6a044", 2: "a17e0f647a17efd3f0d9fec5d736c016", 4: 312, 7: "5856000/0/18616404", 8: "5/3/1" },   // camp/richeQuartz/n5/g1/toutes
  1: { 1: "d7323bba48b761b688104c6cc9784b7b", 2: "34c068611447f44674b0984ab38e6b7d", 4: 465, 5: "{\"quartz\":3391,\"scorie\":1130}", 7: "19032000/0/5272446", 8: "2/3/1" },   // camp/richeQuartz/n5/g1/moitie
  2: { 1: "77c67a8a1e1087aba611564a6fd6a044", 2: "ccd1aa8191010d06ae04eb592933b078", 4: 312, 7: "5856000/0/18616404", 8: "5/3/1" },   // camp/richeScorie/n5/g1/toutes
  3: { 1: "d7323bba48b761b688104c6cc9784b7b", 2: "471c7bd8c62b1deecdbcfedd75f3278d", 4: 465, 5: "{\"quartz\":1130,\"scorie\":3391}", 7: "19032000/0/5272446", 8: "2/3/1" },   // camp/richeScorie/n5/g1/moitie
  4: { 1: "38ad0ea8421926413c5eb7649cb9aefc", 2: "5b760e575a1aa987a5d50b45de131d9b", 4: 348, 7: "5856000/0/16903946" },   // avantPoste/richeQuartz/n5/g1/toutes
  5: { 1: "6571c8ef6e51171d8814eda1199710dd", 2: "dd50aa7c7db911d3ece167a529448d55", 4: 351, 5: "{\"quartz\":8318,\"scorie\":2772}", 6: "75939", 7: "22190493/2025955/722636", 8: "1/3/5" },   // avantPoste/richeQuartz/n5/g1/moitie
  6: { 1: "38ad0ea8421926413c5eb7649cb9aefc", 2: "1696f8f530e7d6431b73c2c32db72b39", 4: 348, 7: "5856000/0/16903946" },   // avantPoste/richeScorie/n5/g1/toutes
  7: { 1: "6571c8ef6e51171d8814eda1199710dd", 2: "1dfa12279c62c19fa6e9dd72142dc48b", 4: 351, 5: "{\"quartz\":2772,\"scorie\":8318}", 6: "75939", 7: "22190493/2025955/722636", 8: "1/3/5" },   // avantPoste/richeScorie/n5/g1/moitie
  8: { 1: "71e994c8bcadf1c6a31f7643cd4d182e", 2: "ca8b00c5f3aae2c9d5f34e909b356691", 4: 448, 7: "4392000/0/15125480", 8: "8/6/2" },   // base/-/n5/g1/toutes
  9: { 1: "785c6f3de45338b0f9e66eb4b75d6ec0", 2: "7af074b7c7338dc205f023c16d422c07", 4: 439, 5: "{\"quartz\":3014,\"scorie\":1748}", 6: "104366", 7: "22779815/1891040/2626882", 8: "2/4/4" },   // base/-/n5/g1/moitie
  10: { 1: "53fd06ab1663f38e275f5e049bdcbe4a", 2: "76c2674ebdb61451beba440b5e61ee56", 4: 313, 5: "{\"quartz\":7322,\"scorie\":2440}", 6: "16159248", 7: "151614278/56375823/6116000", 8: "0/5/13" },   // camp/richeQuartz/n20/g1/toutes
  11: { 1: "9948becf124c91fb61c27796e9940768", 2: "3e41556841ef026deb127a39e170a876", 4: 284, 6: "10329445", 7: "152900000/69776156/0", 8: "0/4/7" },   // camp/richeQuartz/n20/g1/moitie
  12: { 1: "53fd06ab1663f38e275f5e049bdcbe4a", 2: "271424af3696ac3b2e986780d7ba5b97", 4: 313, 5: "{\"quartz\":2440,\"scorie\":7322}", 6: "16159248", 7: "151614278/56375823/6116000", 8: "0/5/13" },   // camp/richeScorie/n20/g1/toutes
  13: { 1: "9948becf124c91fb61c27796e9940768", 2: "2d05ea09eaabc5e660cddbb066bd0a28", 4: 284, 6: "10329445", 7: "152900000/69776156/0", 8: "0/4/7" },   // camp/richeScorie/n20/g1/moitie
  14: { 1: "d24bfe4d9262d6aeb24678b9b90f04a4", 2: "099447b1c73841d18a396d0b24ac2ca9", 4: 430, 5: "{\"quartz\":12069,\"scorie\":4023}", 6: "22712629", 7: "210349951/64733132/27498385", 8: "0/14/9" },   // avantPoste/richeQuartz/n20/g1/toutes
  15: { 1: "40aa6845e0f54aa83f08f24daf61ad13", 2: "cc3dac5031a9b3ad944dddc816c73eb0", 4: 282, 6: "5543127", 7: "211002000/122553674/0", 8: "0/4/7" },   // avantPoste/richeQuartz/n20/g1/moitie
  16: { 1: "d24bfe4d9262d6aeb24678b9b90f04a4", 2: "6f433eae14fde761a8894b18401d19dc", 4: 430, 5: "{\"quartz\":4023,\"scorie\":12069}", 6: "22712629", 7: "210349951/64733132/27498385", 8: "0/14/9" },   // avantPoste/richeScorie/n20/g1/toutes
  17: { 1: "40aa6845e0f54aa83f08f24daf61ad13", 2: "5544bc3dceaadb4eac904cfd3eb721d2", 4: 282, 6: "5543127", 7: "211002000/122553674/0", 8: "0/4/7" },   // avantPoste/richeScorie/n20/g1/moitie
  18: { 1: "e64a95f4fb2b172358fdb553bca1775d", 2: "476d3830d5dc0d55e5e7efa4229b01dc", 4: 362, 5: "{\"quartz\":0,\"scorie\":0}", 6: "28769345", 7: "226292000/102172575/18348000", 8: "0/9/12" },   // base/-/n20/g1/toutes
  19: { 1: "524d418f40fb04d6393ea34c8b5ee044", 2: "df53ab76a10fe5712a4e45ecb7db2300", 4: 288, 5: "{\"quartz\":0,\"scorie\":0}", 6: "8957643", 7: "226292000/138395449/0" },   // base/-/n20/g1/moitie
  20: { 1: "4abc748062b42813836f3387d77ae2ea", 2: "00953e3a2a8645e809d2eb73f84859ba", 4: 306, 6: "1010437643", 7: "855858000/535205211/0", 8: "0/5/14" },   // camp/richeQuartz/n35/g1/toutes
  21: { 1: "99c8bb444a25c8e63115c6b92e2ed848", 2: "da97e54a62468e9aaf08348d580f6daa", 4: 311, 6: "558986001", 7: "855858000/694541774/0", 8: "0/2/7" },   // camp/richeQuartz/n35/g1/moitie
  22: { 1: "4abc748062b42813836f3387d77ae2ea", 2: "55979c103bcaa4d81ad2a69470db39df", 4: 306, 6: "1010437643", 7: "855858000/535205211/0", 8: "0/5/14" },   // camp/richeScorie/n35/g1/toutes
  23: { 1: "99c8bb444a25c8e63115c6b92e2ed848", 2: "96673ce6ef731825c0e65f9e002a60d4", 4: 311, 6: "558986001", 7: "855858000/694541774/0", 8: "0/2/7" },   // camp/richeScorie/n35/g1/moitie
  24: { 1: "83f7cd50ed8d8499039b87e66b1bb64e", 2: "3141c486dc9038d2bf5d3d736fdb6395", 4: 288, 6: "685989327", 7: "1162434000/622539764/0", 8: "0/5/14" },   // avantPoste/richeQuartz/n35/g1/toutes
  25: { 1: "9a705420534554eb0cf94f7069450d42", 2: "4ee1562105a842411e6d2b5bb9eec53e", 4: 204, 6: "87201018", 7: "1162434000/753558324/0", 8: "0/3/7" },   // avantPoste/richeQuartz/n35/g1/moitie
  26: { 1: "83f7cd50ed8d8499039b87e66b1bb64e", 2: "9cea7c0f25008cd1799d7e1ab826970d", 4: 288, 6: "685989327", 7: "1162434000/622539764/0", 8: "0/5/14" },   // avantPoste/richeScorie/n35/g1/toutes
  27: { 1: "9a705420534554eb0cf94f7069450d42", 2: "b4e7e5a8e3138464f52bd2eb2ee66f9e", 4: 204, 6: "87201018", 7: "1162434000/753558324/0", 8: "0/3/7" },   // avantPoste/richeScorie/n35/g1/moitie
  28: { 1: "00265c9665b085537f6dc55341966843", 2: "504deef397f0fe93c4a90f8165815c12", 4: 290, 6: "1397758433", 7: "1251852000/654704228/0", 8: "0/8/14" },   // base/-/n35/g1/toutes
  29: { 1: "11f1e80e5f3a0da32da83a042acf48f1", 2: "cb24a6eaebdc53e901ebac12fbe65cf7", 4: 182, 6: "93315751", 7: "1251852000/834765596/0", 8: "0/1/7" },   // base/-/n35/g1/moitie
  30: { 1: "b1ab2010b9ac6c91bd865bbd840e5f61", 2: "67e1a40393d23915f814e50f597b0300", 4: 386, 6: "89440336705", 7: "3788524500/1719467968/0", 8: "0/2/14" },   // camp/richeQuartz/n50/g1/toutes
  31: { 1: "dcdd789ab1f83bb94096e5d1d9c76485", 2: "ee7c4ccfc1e5da32cf90adf76ce68bd4", 4: 180, 6: "15643746955", 7: "3788524500/2166018252/0", 8: "0/0/7" },   // camp/richeQuartz/n50/g1/moitie
  32: { 1: "b1ab2010b9ac6c91bd865bbd840e5f61", 2: "906ff121c71417238a68fd5acabfae0f", 4: 386, 6: "89440336705", 7: "3788524500/1719467968/0", 8: "0/2/14" },   // camp/richeScorie/n50/g1/toutes
  33: { 1: "dcdd789ab1f83bb94096e5d1d9c76485", 2: "9a43ca8846f140f7cf83eac5781e96fc", 4: 180, 6: "15643746955", 7: "3788524500/2166018252/0", 8: "0/0/7" },   // camp/richeScorie/n50/g1/moitie
  34: { 1: "9976d70711857cf4529f290c45ecfc7a", 2: "c24604f3e7b5064ac67c6835c18bfada", 4: 211, 6: "16132937510", 7: "5069152500/3209226318/0", 8: "0/3/14" },   // avantPoste/richeQuartz/n50/g1/toutes
  35: { 1: "9f94eeaf21f9aed1f50a18c979e1416e", 2: "247943839c6cfa296583d9639135a995", 4: 185, 6: "1386342554", 7: "5069152500/3833073434/0", 8: "0/0/7" },   // avantPoste/richeQuartz/n50/g1/moitie
  36: { 1: "9976d70711857cf4529f290c45ecfc7a", 2: "2a4b07d148e8be24cd9d2c5760714499", 4: 211, 6: "16132937510", 7: "5069152500/3209226318/0", 8: "0/3/14" },   // avantPoste/richeScorie/n50/g1/toutes
  37: { 1: "9f94eeaf21f9aed1f50a18c979e1416e", 2: "bee5f2d539c8c2e7695f666fb95f7f53", 4: 185, 6: "1386342554", 7: "5069152500/3833073434/0", 8: "0/0/7" },   // avantPoste/richeScorie/n50/g1/moitie
  38: { 1: "e87e2c39ea212930a93a4de7f0281927", 2: "2f4578e571e8a2b423f108e8a0d51d48", 4: 217, 6: "8589320328", 7: "5602747500/4659409382/0" },   // base/-/n50/g1/toutes
  39: { 1: "4218c3d2ee35eb140b2c5f3d44efe9d2", 2: "e6250dbf3285339fa91e728ba21f822f", 4: 183, 6: "2957672903", 7: "5602747500/5357320080/0" },   // base/-/n50/g1/moitie
  40: { 1: "30d22cee0cabae9095e9f62092e67ec5", 2: "15382e2c8342d9a5f8436513006af95f", 4: 284, 7: "8052000/0/18870421", 8: "3/3/0" },   // camp/richeQuartz/n5/g2/toutes
  41: { 1: "cbd4ec19eacdc5542a05bef36624e5a1", 2: "ae3b20401e8cfec7af72e09aacbd3563", 4: 475, 5: "{\"quartz\":1695,\"scorie\":565}", 6: "40192", 7: "16104000/1434720/7824434", 8: "2/1/0" },   // camp/richeQuartz/n5/g2/moitie
  42: { 1: "30d22cee0cabae9095e9f62092e67ec5", 2: "7945962ed62b4978bc899629e321ff9c", 4: 284, 7: "8052000/0/18870421", 8: "3/3/0" },   // camp/richeScorie/n5/g2/toutes
  43: { 1: "cbd4ec19eacdc5542a05bef36624e5a1", 2: "f13778ccb13974ccb04453faac82c527", 4: 475, 5: "{\"quartz\":565,\"scorie\":1695}", 6: "40192", 7: "16104000/1434720/7824434", 8: "2/1/0" },   // camp/richeScorie/n5/g2/moitie
  44: { 1: "9e28bba2f2856fd106f5744945f1e80c", 2: "58981dadd7587c70cc9adc3eb5716f50", 4: 395, 7: "5856000/0/17377809", 8: "7/5/0" },   // avantPoste/richeQuartz/n5/g2/toutes
  45: { 1: "a40ea64fd249dd373dec1cace314c817", 2: "88a5f0e15d1f9a99dc97ad31310cef1b", 4: 426, 5: "{\"quartz\":17436,\"scorie\":5812}", 6: "64870", 7: "20437782/2477540/6259214", 8: "3/2/0" },   // avantPoste/richeQuartz/n5/g2/moitie
  46: { 1: "9e28bba2f2856fd106f5744945f1e80c", 2: "b605fc27de41f74d0db9352061a29e2d", 4: 395, 7: "5856000/0/17377809", 8: "7/5/0" },   // avantPoste/richeScorie/n5/g2/toutes
  47: { 1: "a40ea64fd249dd373dec1cace314c817", 2: "6282d2e3dde997a95dde2872908cee4a", 4: 426, 5: "{\"quartz\":5812,\"scorie\":17436}", 6: "64870", 7: "20437782/2477540/6259214", 8: "3/2/0" },   // avantPoste/richeScorie/n5/g2/moitie
  48: { 1: "7bbf8cc64754d62666b052f32716c42f", 2: "9b880e3e7c9acdf5fbe9f25073454cfc", 4: 407, 6: "150720", 7: "9516000/0/14622782", 8: "6/6/2" },   // base/-/n5/g2/toutes
  49: { 1: "24b1ebeec673235929457fe3fbc1ca35", 2: "17a7a92fedb83320c4cefd39b4852b26", 4: 414, 5: "{\"quartz\":4125,\"scorie\":2261}", 6: "112632", 7: "22948726/1553790/3243716", 8: "2/4/3" },   // base/-/n5/g2/moitie
  50: { 1: "ce8ca50a88a29af64532940d1c639860", 2: "187929297ccadbceba72c1a3c4de39e8", 4: 362, 5: "{\"quartz\":0,\"scorie\":0}", 6: "18905245", 7: "152900000/48692998/12232000", 8: "0/6/13" },   // camp/richeQuartz/n20/g2/toutes
  51: { 1: "e541d21c4a528a95378c1473a3d002de", 2: "062f12c8304dfdd855b50aa5113f1f0e", 4: 358, 5: "{\"quartz\":0,\"scorie\":0}", 6: "9191109", 7: "152900000/69622597/0", 8: "0/3/7" },   // camp/richeQuartz/n20/g2/moitie
  52: { 1: "ce8ca50a88a29af64532940d1c639860", 2: "e283fa20beb6ef1e279abe2f5d64ef58", 4: 362, 5: "{\"quartz\":0,\"scorie\":0}", 6: "18905245", 7: "152900000/48692998/12232000", 8: "0/6/13" },   // camp/richeScorie/n20/g2/toutes
  53: { 1: "e541d21c4a528a95378c1473a3d002de", 2: "45a2c0c457ec4dd67566008cbe695ffa", 4: 358, 5: "{\"quartz\":0,\"scorie\":0}", 6: "9191109", 7: "152900000/69622597/0", 8: "0/3/7" },   // camp/richeScorie/n20/g2/moitie
  54: { 1: "7bcd931a0c7f6d2a05f948118c3a042a", 2: "25c4830ecee1822e316f5cfc01f218d6", 4: 313, 5: "{\"quartz\":0,\"scorie\":0}", 6: "20854471", 7: "211002000/79920437/12232000", 8: "0/8/13" },   // avantPoste/richeQuartz/n20/g2/toutes
  55: { 1: "f113f085593fa6b2324406c6b1300c55", 2: "81e40452338f636b0b3ac2efcb4d8dfd", 4: 269, 6: "6275588", 7: "211002000/120577311/0", 8: "0/2/7" },   // avantPoste/richeQuartz/n20/g2/moitie
  56: { 1: "7bcd931a0c7f6d2a05f948118c3a042a", 2: "e4e7002462d47cc617de6852c3390f8c", 4: 313, 5: "{\"quartz\":0,\"scorie\":0}", 6: "20854471", 7: "211002000/79920437/12232000", 8: "0/8/13" },   // avantPoste/richeScorie/n20/g2/toutes
  57: { 1: "f113f085593fa6b2324406c6b1300c55", 2: "58a73336548eed4ad204ea531c2d2d78", 4: 269, 6: "6275588", 7: "211002000/120577311/0", 8: "0/2/7" },   // avantPoste/richeScorie/n20/g2/moitie
  58: { 1: "d97fa24726ad43881edbf714e6a99cfc", 2: "594b28bc8f78ddaeffd7b2d5f4f87088", 4: 391, 5: "{\"quartz\":0,\"scorie\":0}", 6: "23915294", 7: "226292000/89915010/12232000", 8: "0/10/13" },   // base/-/n20/g2/toutes
  59: { 1: "7025bfad7de71c460760e72149b36108", 2: "4bcfb8a9b3dc1c32e27027cf56fc6d81", 4: 557, 6: "8937081", 7: "226292000/140674085/0", 8: "0/3/7" },   // base/-/n20/g2/moitie
  60: { 1: "211bb064186cc93619a871f29454e492", 2: "a7bf861509dd0f6117519c71711c01f4", 4: 332, 6: "1306860905", 7: "855858000/403879969/0", 8: "0/6/14" },   // camp/richeQuartz/n35/g2/toutes
  61: { 1: "83eb38fe3a2c9c7a4068d6d8c2ae7343", 2: "c65a94092210218de05c38f1ab2ce80d", 4: 238, 6: "256442199", 7: "855858000/585271893/0", 8: "0/2/7" },   // camp/richeQuartz/n35/g2/moitie
  62: { 1: "211bb064186cc93619a871f29454e492", 2: "73fef9bd5a2439f4e77934686405173e", 4: 332, 6: "1306860905", 7: "855858000/403879969/0", 8: "0/6/14" },   // camp/richeScorie/n35/g2/toutes
  63: { 1: "83eb38fe3a2c9c7a4068d6d8c2ae7343", 2: "d32c75447afa5f82cb9a38c53aeffd82", 4: 238, 6: "256442199", 7: "855858000/585271893/0", 8: "0/2/7" },   // camp/richeScorie/n35/g2/moitie
  64: { 1: "2ce7467d9b81cc943b953ea453e65e76", 2: "86908d8132bb666696f9ccc22c867108", 4: 435, 6: "1721469187", 7: "1162434000/620456593/0", 8: "0/5/14" },   // avantPoste/richeQuartz/n35/g2/toutes
  65: { 1: "32bb10548094012deb6e7404330fa085", 2: "f5855588f193089272315193eddb5d01", 4: 180, 6: "160750622", 7: "1162434000/791754322/0", 8: "0/1/7" },   // avantPoste/richeQuartz/n35/g2/moitie
  66: { 1: "2ce7467d9b81cc943b953ea453e65e76", 2: "9afcd882d2d80a26a38fbc7b463550f6", 4: 435, 6: "1721469187", 7: "1162434000/620456593/0", 8: "0/5/14" },   // avantPoste/richeScorie/n35/g2/toutes
  67: { 1: "32bb10548094012deb6e7404330fa085", 2: "5c9b389a2c697e9ff9b9c184f9905d41", 4: 180, 6: "160750622", 7: "1162434000/791754322/0", 8: "0/1/7" },   // avantPoste/richeScorie/n35/g2/moitie
  68: { 1: "dfaec59fa557dbf99e0232cd207da8d4", 2: "1e83ee3ad958c6a8791237cba9fbe338", 4: 232, 6: "1589329378", 7: "1251852000/601569912/0", 8: "0/9/14" },   // base/-/n35/g2/toutes
  69: { 1: "fd8100e94802848e191056964fa45f59", 2: "09739ac208e7ad01a4e3f301717f2a2f", 4: 199, 6: "493143381", 7: "1251852000/741053705/0", 8: "0/3/7" },   // base/-/n35/g2/moitie
  70: { 1: "096cce6b1b2f377709c03e680975eb5c", 2: "7cfa87f59951aea4b2c5f55f7690efa6", 4: 342, 6: "74978285502", 7: "3788524500/1922443690/213438000", 8: "0/4/13" },   // camp/richeQuartz/n50/g2/toutes
  71: { 1: "cb07a1b673dfe0bba55797f64aab537e", 2: "90fbe9be470ae9373d0ceccc863a96a9", 4: 241, 6: "23442599181", 7: "3788524500/2283826759/0" },   // camp/richeQuartz/n50/g2/moitie
  72: { 1: "096cce6b1b2f377709c03e680975eb5c", 2: "d5a64ca2715886c8298078daf43c0afe", 4: 342, 6: "74978285502", 7: "3788524500/1922443690/213438000", 8: "0/4/13" },   // camp/richeScorie/n50/g2/toutes
  73: { 1: "cb07a1b673dfe0bba55797f64aab537e", 2: "10e09733714216be3981bcd5ba448299", 4: 241, 6: "23442599181", 7: "3788524500/2283826759/0" },   // camp/richeScorie/n50/g2/moitie
  74: { 1: "575458f43d0618e9e5cc422ff2ed4ca6", 2: "42e1f678989b8f61b144ca6e8b1e0c68", 4: 264, 6: "47740352805", 7: "5069152500/3351303843/0", 8: "0/5/14" },   // avantPoste/richeQuartz/n50/g2/toutes
  75: { 1: "4fdb6c63f8d547849f1daf58cf61ef71", 2: "77c217b492695d5e6867fca6950b4cd0", 4: 227, 6: "15170421005", 7: "5069152500/3929799227/0" },   // avantPoste/richeQuartz/n50/g2/moitie
  76: { 1: "575458f43d0618e9e5cc422ff2ed4ca6", 2: "0732f68aef4c3c1feb3ba36d2a8502c7", 4: 264, 6: "47740352805", 7: "5069152500/3351303843/0", 8: "0/5/14" },   // avantPoste/richeScorie/n50/g2/toutes
  77: { 1: "4fdb6c63f8d547849f1daf58cf61ef71", 2: "2ca1262c65e4083ace9c7e6f324ce1b7", 4: 227, 6: "15170421005", 7: "5069152500/3929799227/0" },   // avantPoste/richeScorie/n50/g2/moitie
  78: { 1: "574349f41b13ba55eac8a38bb9c52888", 2: "3ce64f93d1427991013655373868a5e9", 4: 195, 6: "5981325647", 7: "5602747500/4154913085/0", 8: "0/3/14" },   // base/-/n50/g2/toutes
  79: { 1: "11cf7b1d808b6f3b3053b1444ec92387", 2: "a9e8727a7413e2c06eebd7955f775d73", 4: 171, 6: "1387146210", 7: "5602747500/4745342556/0", 8: "0/0/7" },   // base/-/n50/g2/moitie
  80: { 1: "0929aa597c1c52c3cfb42e2859b4ec1e", 2: "77cbc6999c72ebd8c7a80407af4d458c", 4: 369, 7: "2928000/0/17548106" },   // camp/richeQuartz/n5/g3/toutes
  81: { 1: "56da34b31023c84026da93ad8d9f4701", 2: "ebcc31b18ac68dfa69dcb16999beb17e", 4: 389, 5: "{\"quartz\":2112,\"scorie\":704}", 6: "65970", 7: "17984942/383063/3929968", 8: "1/2/2" },   // camp/richeQuartz/n5/g3/moitie
  82: { 1: "0929aa597c1c52c3cfb42e2859b4ec1e", 2: "a8b2a70ce8167ffb5898317d49f67af3", 4: 369, 7: "2928000/0/17548106" },   // camp/richeScorie/n5/g3/toutes
  83: { 1: "56da34b31023c84026da93ad8d9f4701", 2: "c51ddec5c6d0ac7ccc60aa88418bdbb4", 4: 389, 5: "{\"quartz\":704,\"scorie\":2112}", 6: "65970", 7: "17984942/383063/3929968", 8: "1/2/2" },   // camp/richeScorie/n5/g3/moitie
  84: { 1: "ae1fa4b1ec9a87a0bf5fae6541e53f59", 2: "8ea9be72776a24aa74b2a7cc835ecfdb", 4: 455, 6: "125600", 7: "6588000/0/15132175", 8: "6/5/2" },   // avantPoste/richeQuartz/n5/g3/toutes
  85: { 1: "ef6bf48b0334a69d6edf6bf6491d8bd6", 2: "9f7dd61701475c94a007f4782fce9185", 4: 432, 5: "{\"quartz\":5576,\"scorie\":1858}", 6: "125600", 7: "22918866/0/2176944", 8: "1/5/4" },   // avantPoste/richeQuartz/n5/g3/moitie
  86: { 1: "ae1fa4b1ec9a87a0bf5fae6541e53f59", 2: "f484314f69204a13410015e095835392", 4: 455, 6: "125600", 7: "6588000/0/15132175", 8: "6/5/2" },   // avantPoste/richeScorie/n5/g3/toutes
  87: { 1: "ef6bf48b0334a69d6edf6bf6491d8bd6", 2: "31cb0994c34645cbbf710f0b5015f4bd", 4: 432, 5: "{\"quartz\":1858,\"scorie\":5576}", 6: "125600", 7: "22918866/0/2176944", 8: "1/5/4" },   // avantPoste/richeScorie/n5/g3/moitie
  88: { 1: "3f082acb9f2e6316103981060ad9ac40", 2: "96aa372feb0bc4e45f295306cd88cdd5", 4: 377, 7: "5124000/0/16255855", 8: "8/6/2" },   // base/-/n5/g3/toutes
  89: { 1: "d30ced1f8b300d667195b033369075a0", 2: "b08d8ff56187d774876cfcdd323bda9c", 4: 401, 5: "{\"quartz\":4522,\"scorie\":2261}", 6: "125600", 7: "22692000/1024800/3988454", 8: "3/5/3" },   // base/-/n5/g3/moitie
  90: { 1: "39e87f8e3a61ca76e184f80b55d2c91d", 2: "f8a6fa145138df3f1e10b341a9628ee3", 4: 331, 5: "{\"quartz\":4620,\"scorie\":1540}", 6: "21421249", 7: "152088719/38130739/12232000", 8: "0/7/13" },   // camp/richeQuartz/n20/g3/toutes
  91: { 1: "9624f64e2f7b491ca2afc87e9272c80e", 2: "2802bb7762387d5e83b660ce2c242f73", 4: 578, 5: "{\"quartz\":0,\"scorie\":0}", 6: "12188189", 7: "152900000/59331285/0" },   // camp/richeQuartz/n20/g3/moitie
  92: { 1: "39e87f8e3a61ca76e184f80b55d2c91d", 2: "d7737ac708b72eb1e4df7da64a929368", 4: 331, 5: "{\"quartz\":1540,\"scorie\":4620}", 6: "21421249", 7: "152088719/38130739/12232000", 8: "0/7/13" },   // camp/richeScorie/n20/g3/toutes
  93: { 1: "9624f64e2f7b491ca2afc87e9272c80e", 2: "efd9bfa718fae45e30ab7b6c0039f496", 4: 578, 5: "{\"quartz\":0,\"scorie\":0}", 6: "12188189", 7: "152900000/59331285/0" },   // camp/richeScorie/n20/g3/moitie
  94: { 1: "88326f7baaaa1c1f6987f99d220d2423", 2: "4027ab6a349b6344b8e517f3bc7a63af", 4: 375, 5: "{\"quartz\":0,\"scorie\":0}", 6: "20707301", 7: "211002000/81993313/0", 8: "0/8/14" },   // avantPoste/richeQuartz/n20/g3/toutes
  95: { 1: "38c9d3050e78dbf961b03c17490443b3", 2: "09390f03a9e33b39617a0dca650dd172", 4: 299, 5: "{\"quartz\":0,\"scorie\":0}", 6: "6759941", 7: "211002000/119421086/0", 8: "0/3/7" },   // avantPoste/richeQuartz/n20/g3/moitie
  96: { 1: "88326f7baaaa1c1f6987f99d220d2423", 2: "420651c25eecb516f2b50404105e579d", 4: 375, 5: "{\"quartz\":0,\"scorie\":0}", 6: "20707301", 7: "211002000/81993313/0", 8: "0/8/14" },   // avantPoste/richeScorie/n20/g3/toutes
  97: { 1: "38c9d3050e78dbf961b03c17490443b3", 2: "85fc0fcae60dc2928d66226a8d674758", 4: 299, 5: "{\"quartz\":0,\"scorie\":0}", 6: "6759941", 7: "211002000/119421086/0", 8: "0/3/7" },   // avantPoste/richeScorie/n20/g3/moitie
  98: { 1: "89b77d692a0eb803033d22bddaeb4f9d", 2: "3c70677046c3eaeeb6f006347d8292ce", 4: 396, 5: "{\"quartz\":174214,\"scorie\":69714}", 6: "19895355", 7: "201815502/90487365/2951094", 8: "3/11/13" },   // base/-/n20/g3/toutes
  99: { 1: "122d765de629cbda4a9057d018714e69", 2: "a07d759826b4cf7fb3b147a748d08630", 4: 274, 6: "11163117", 7: "226292000/124722752/4281200", 8: "0/7/6" },   // base/-/n20/g3/moitie
  100: { 1: "d02f3fa7e52ada1b768bcc40311f65e1", 2: "b83348a4be715f5a21fcb2bd51aeef04", 4: 313, 6: "1559945697", 7: "855858000/361270620/76644000", 8: "0/9/12" },   // camp/richeQuartz/n35/g3/toutes
  101: { 1: "000037b3edfb0116afb8ab326816c6dc", 2: "160f4f783da25ac14b5ab74a508c214b", 4: 293, 6: "686907549", 7: "855858000/471768503/0", 8: "0/4/7" },   // camp/richeQuartz/n35/g3/moitie
  102: { 1: "d02f3fa7e52ada1b768bcc40311f65e1", 2: "789fac4a9e5a334a13565317498093c5", 4: 313, 6: "1559945697", 7: "855858000/361270620/76644000", 8: "0/9/12" },   // camp/richeScorie/n35/g3/toutes
  103: { 1: "000037b3edfb0116afb8ab326816c6dc", 2: "2072fe8465883e8ce5868d91e4246214", 4: 293, 6: "686907549", 7: "855858000/471768503/0", 8: "0/4/7" },   // camp/richeScorie/n35/g3/moitie
  104: { 1: "1f0c1a66f560a5aed2aecc067eb5fe11", 2: "031d10435ec164b0d506732894bb6c68", 4: 265, 6: "1544806308", 7: "1162434000/660757955/0", 8: "0/8/14" },   // avantPoste/richeQuartz/n35/g3/toutes
  105: { 1: "d32f863c7e3bc7174f01c9ecb275b8d4", 2: "a9342b738b5eb4d9ea7b786decaef85d", 4: 189, 6: "334831330", 7: "1162434000/822435960/0", 8: "0/2/7" },   // avantPoste/richeQuartz/n35/g3/moitie
  106: { 1: "1f0c1a66f560a5aed2aecc067eb5fe11", 2: "717965d57633bf2002fae8077320506d", 4: 265, 6: "1544806308", 7: "1162434000/660757955/0", 8: "0/8/14" },   // avantPoste/richeScorie/n35/g3/toutes
  107: { 1: "d32f863c7e3bc7174f01c9ecb275b8d4", 2: "69b656d9e33b988c0e07571396d12b8b", 4: 189, 6: "334831330", 7: "1162434000/822435960/0", 8: "0/2/7" },   // avantPoste/richeScorie/n35/g3/moitie
  108: { 1: "a7f0c4cb15aa0118b062b1f2bf32ac20", 2: "0e0fe7ed90fd5ce3e872830b26967ecb", 4: 275, 6: "931707494", 7: "1251852000/776679099/0", 8: "0/4/14" },   // base/-/n35/g3/toutes
  109: { 1: "2f3b60e25cdc948d602d151071162892", 2: "8cc67fd27cec1d8207c4645e6246f4e1", 4: 194, 6: "80905699", 7: "1251852000/945046650/0", 8: "0/1/7" },   // base/-/n35/g3/moitie
  110: { 1: "3ea542a7806b03e84d5d9078912876c6", 2: "e79b98ab9161249050d1db8934bde49c", 4: 357, 6: "71579295573", 7: "3788524500/2168309618/213438000", 8: "0/2/13" },   // camp/richeQuartz/n50/g3/toutes
  111: { 1: "7a40a6887d30a1d7adfe856ff4c434ed", 2: "bf42bff900a114fb8a53542b4923ec73", 4: 206, 6: "4483070143", 7: "3788524500/2576310961/0", 8: "0/0/7" },   // camp/richeQuartz/n50/g3/moitie
  112: { 1: "3ea542a7806b03e84d5d9078912876c6", 2: "924f6063ece4c8818023434f7f54e082", 4: 357, 6: "71579295573", 7: "3788524500/2168309618/213438000", 8: "0/2/13" },   // camp/richeScorie/n50/g3/toutes
  113: { 1: "7a40a6887d30a1d7adfe856ff4c434ed", 2: "f3fdf5f0385dc9ffd63b0fbded942715", 4: 206, 6: "4483070143", 7: "3788524500/2576310961/0", 8: "0/0/7" },   // camp/richeScorie/n50/g3/moitie
  114: { 1: "2e74f9364554073f992ecb6375b869aa", 2: "004b9fbe768e36ad0ba3d147badfa1a5", 4: 284, 6: "44511111385", 7: "5069152500/3022589473/213438000", 8: "0/5/13" },   // avantPoste/richeQuartz/n50/g3/toutes
  115: { 1: "cfe729b983b3f55ce6b3aea1df6a3072", 2: "97e25870c6a484bad80764037206e713", 4: 295, 6: "49639364943", 7: "5069152500/3324200804/0" },   // avantPoste/richeQuartz/n50/g3/moitie
  116: { 1: "2e74f9364554073f992ecb6375b869aa", 2: "5cdeab3f6539be7ef9f2b459a565f591", 4: 284, 6: "44511111385", 7: "5069152500/3022589473/213438000", 8: "0/5/13" },   // avantPoste/richeScorie/n50/g3/toutes
  117: { 1: "cfe729b983b3f55ce6b3aea1df6a3072", 2: "89b3739148c8392d5c3c74e4ed7ccf7b", 4: 295, 6: "49639364943", 7: "5069152500/3324200804/0" },   // avantPoste/richeScorie/n50/g3/moitie
  118: { 1: "d30bc392cb6fb337d1522dc6cf43b50a", 2: "7b9884ca9848d009abfef0fa61baa779", 4: 288, 6: "64579348769", 7: "5602747500/4006232238/0", 8: "0/3/14" },   // base/-/n50/g3/toutes
  119: { 1: "ba12fce8b334e7f9ae991be7ed50d28f", 2: "b8bfdb5a0beba87a0e2f099352319c28", 4: 199, 6: "9194949713", 7: "5602747500/4349040442/0", 8: "0/2/7" },   // base/-/n50/g3/moitie
  120: { 1: "fd4596b3c07bb926ea975e0f0a4a0404", 2: "dbf0ecbb2279965c450dd888c259d936", 4: 425, 7: "1464000/0/15967966", 8: "7/3/1" },   // camp/richeQuartz/n5/g4/toutes
  121: { 1: "9eea671399ef6a4fc886e2dac92010e0", 2: "fd327cdac97d3e62203b3bdaf349fcd3", 4: 514, 5: "{\"quartz\":3391,\"scorie\":1130}", 7: "19032000/0/4867771", 8: "2/3/2" },   // camp/richeQuartz/n5/g4/moitie
  122: { 1: "fd4596b3c07bb926ea975e0f0a4a0404", 2: "6ef534bddc7534ff20843ed2c7e63924", 4: 425, 7: "1464000/0/15967966", 8: "7/3/1" },   // camp/richeScorie/n5/g4/toutes
  123: { 1: "9eea671399ef6a4fc886e2dac92010e0", 2: "e78eb9f4cfcdc149b9be2a012651fbed", 4: 514, 5: "{\"quartz\":1130,\"scorie\":3391}", 7: "19032000/0/4867771", 8: "2/3/2" },   // camp/richeScorie/n5/g4/moitie
  124: { 1: "62a8cb0a56eee1477b54333ee43310b6", 2: "942a4ec804303fea4189a29671811ab5", 4: 418, 7: "5856000/0/17896713", 8: "7/5/0" },   // avantPoste/richeQuartz/n5/g4/toutes
  125: { 1: "3ce5ee37059b9b00200d483066c0b834", 2: "bbb42ab93547d7bf6620c46effac441f", 4: 446, 5: "{\"quartz\":16625,\"scorie\":5541}", 6: "104671", 7: "21061104/853812/4216302", 8: "3/4/1" },   // avantPoste/richeQuartz/n5/g4/moitie
  126: { 1: "62a8cb0a56eee1477b54333ee43310b6", 2: "7cc4730338756dd080fcc7f8a6042b35", 4: 418, 7: "5856000/0/17896713", 8: "7/5/0" },   // avantPoste/richeScorie/n5/g4/toutes
  127: { 1: "3ce5ee37059b9b00200d483066c0b834", 2: "6c15a05afa29ed21a30c32788d0fb70b", 4: 446, 5: "{\"quartz\":5541,\"scorie\":16625}", 6: "104671", 7: "21061104/853812/4216302", 8: "3/4/1" },   // avantPoste/richeScorie/n5/g4/moitie
  128: { 1: "ec2fe6a8eb885e1e29c19fde634f9d0e", 2: "1cea01145f2b62152a5353bd5b14b816", 4: 657, 7: "6588000/0/14213735", 8: "7/6/2" },   // base/-/n5/g4/toutes
  129: { 1: "bd7f69b070a2fd7dcf799ea9ee5a70b8", 2: "aa0628fd97cca70bd637fe80424e290b", 4: 478, 5: "{\"quartz\":2281,\"scorie\":4523}", 6: "94298", 7: "22598078/2301770/5140265", 8: "3/3/0" },   // base/-/n5/g4/moitie
  130: { 1: "2cd598dd52aad03cd997cd26a45c0055", 2: "f02757db9036966191729f78cf9c9641", 4: 315, 5: "{\"quartz\":0,\"scorie\":0}", 6: "18038406", 7: "152900000/41819834/12232000", 8: "0/7/13" },   // camp/richeQuartz/n20/g4/toutes
  131: { 1: "a833c60191ef3cddf0d00b040155f431", 2: "f3bcdb0d492defdc52c201054ff98c96", 4: 370, 6: "12648680", 7: "152900000/63823292/0", 8: "0/5/7" },   // camp/richeQuartz/n20/g4/moitie
  132: { 1: "2cd598dd52aad03cd997cd26a45c0055", 2: "f7266823b82dbf30f252dbd2762318db", 4: 315, 5: "{\"quartz\":0,\"scorie\":0}", 6: "18038406", 7: "152900000/41819834/12232000", 8: "0/7/13" },   // camp/richeScorie/n20/g4/toutes
  133: { 1: "a833c60191ef3cddf0d00b040155f431", 2: "dfc9a97d9616e7daa7cd28e23d1e8266", 4: 370, 6: "12648680", 7: "152900000/63823292/0", 8: "0/5/7" },   // camp/richeScorie/n20/g4/moitie
  134: { 1: "42d8753bb9619f80aabece68096c5c7b", 2: "af177d11ad723a7a031c43d554f72d1d", 4: 285, 5: "{\"quartz\":0,\"scorie\":0}", 6: "19247679", 7: "211002000/94679320/12232000", 8: "0/8/13" },   // avantPoste/richeQuartz/n20/g4/toutes
  135: { 1: "e13789319f13453d37858f64cfe2b87e", 2: "49ec2df51f1d3daf02abe0c070547bef", 4: 261, 6: "7051527", 7: "211002000/131752724/0", 8: "0/3/7" },   // avantPoste/richeQuartz/n20/g4/moitie
  136: { 1: "42d8753bb9619f80aabece68096c5c7b", 2: "bf5fbb7ea8678ff6907311b12640da39", 4: 285, 5: "{\"quartz\":0,\"scorie\":0}", 6: "19247679", 7: "211002000/94679320/12232000", 8: "0/8/13" },   // avantPoste/richeScorie/n20/g4/toutes
  137: { 1: "e13789319f13453d37858f64cfe2b87e", 2: "957643e915fc307d0d2e5e2c19b8ea1c", 4: 261, 6: "7051527", 7: "211002000/131752724/0", 8: "0/3/7" },   // avantPoste/richeScorie/n20/g4/moitie
  138: { 1: "8a68d055b6f62f0d998d11c2f7a8288a", 2: "822ee313a4cf4fe8fb97821967a2a26f", 4: 379, 5: "{\"quartz\":10853,\"scorie\":10853}", 6: "21347402", 7: "223433495/84889486/0", 8: "0/10/14" },   // base/-/n20/g4/toutes
  139: { 1: "2c2f5bef234145375dada4ae5676b43c", 2: "ebb2780b84f13dbdb98eaf5636206af5", 4: 250, 6: "4230653", 7: "226292000/137040967/0", 8: "0/2/7" },   // base/-/n20/g4/moitie
  140: { 1: "9fc7be87be3658771d32b7b008eeb1df", 2: "df1c536fdfde7bdb49968811f8c848dc", 4: 281, 6: "657973915", 7: "855858000/507247320/0", 8: "0/3/14" },   // camp/richeQuartz/n35/g4/toutes
  141: { 1: "3199c4a6bf1d69a1712400f8b45d6384", 2: "40df39a9cd55c75f74216ad1f1f044c3", 4: 254, 6: "287171707", 7: "855858000/596959286/0", 8: "0/2/7" },   // camp/richeQuartz/n35/g4/moitie
  142: { 1: "9fc7be87be3658771d32b7b008eeb1df", 2: "e968a93ccdb9e95870d822608bb07598", 4: 281, 6: "657973915", 7: "855858000/507247320/0", 8: "0/3/14" },   // camp/richeScorie/n35/g4/toutes
  143: { 1: "3199c4a6bf1d69a1712400f8b45d6384", 2: "1442c8ecb32373361344d0fc71424609", 4: 254, 6: "287171707", 7: "855858000/596959286/0", 8: "0/2/7" },   // camp/richeScorie/n35/g4/moitie
  144: { 1: "d11b19eafed7ad932683496114c1f515", 2: "357881eb6fa6e61096bf25d0146caf08", 4: 368, 6: "2478303193", 7: "1162434000/535071356/51096000", 8: "0/12/13" },   // avantPoste/richeQuartz/n35/g4/toutes
  145: { 1: "575a81056ea09484c3e77622258173bd", 2: "04f047975276133a83b9b34460d5266a", 4: 243, 6: "910287231", 7: "1162434000/712442865/0", 8: "0/4/7" },   // avantPoste/richeQuartz/n35/g4/moitie
  146: { 1: "d11b19eafed7ad932683496114c1f515", 2: "c929c2dc0d9171ab3a747d4f358c3dac", 4: 368, 6: "2478303193", 7: "1162434000/535071356/51096000", 8: "0/12/13" },   // avantPoste/richeScorie/n35/g4/toutes
  147: { 1: "575a81056ea09484c3e77622258173bd", 2: "f8f4f6f5c5c92487a79628185c00e6bd", 4: 243, 6: "910287231", 7: "1162434000/712442865/0", 8: "0/4/7" },   // avantPoste/richeScorie/n35/g4/moitie
  148: { 1: "f181e268b51ed9d773d98fa3dc55b5dc", 2: "fcd8b24f01ac25e52f575d721a1aa6fc", 4: 528, 6: "2691602103", 7: "1251852000/566872860/0", 8: "0/11/14" },   // base/-/n35/g4/toutes
  149: { 1: "e3bff7bd958405f2d2d64cca39ba96c8", 2: "a38bf7951140a4ef219fd7747f840a3a", 4: 283, 6: "941168550", 7: "1251852000/846804138/0", 8: "0/3/7" },   // base/-/n35/g4/moitie
  150: { 1: "8eb9bc6a0711d1ecbaf8845bbe6e3a82", 2: "6d1a6790fdd65745200bf5dbba10d02b", 4: 360, 6: "64953892698", 7: "3788524500/2122035882/0", 8: "0/2/14" },   // camp/richeQuartz/n50/g4/toutes
  151: { 1: "1326000627f50c3e1abcd5cad5332abd", 2: "e72efd078ef938b81af9d05f71c9bebe", 4: 191, 6: "12059323934", 7: "3788524500/2462230729/0", 8: "0/1/7" },   // camp/richeQuartz/n50/g4/moitie
  152: { 1: "8eb9bc6a0711d1ecbaf8845bbe6e3a82", 2: "d8cf4f6af2054e936b290a11a9631b2b", 4: 360, 6: "64953892698", 7: "3788524500/2122035882/0", 8: "0/2/14" },   // camp/richeScorie/n50/g4/toutes
  153: { 1: "1326000627f50c3e1abcd5cad5332abd", 2: "99e81dc80f7941a9ff291f105b35d4da", 4: 191, 6: "12059323934", 7: "3788524500/2462230729/0", 8: "0/1/7" },   // camp/richeScorie/n50/g4/moitie
  154: { 1: "fa49dbe875f65768a054d6d36bec38c6", 2: "4f79a087582bec4eca5ae21080595efa", 4: 459, 6: "96847078735", 7: "5069152500/2941000655/0", 8: "0/10/14" },   // avantPoste/richeQuartz/n50/g4/toutes
  155: { 1: "cab18cb234f1674d3bdb4c0c7ee49548", 2: "d1628fb732f45ae4beca41ee64ff9fa6", 4: 205, 6: "4215457361", 7: "5069152500/4192249962/0" },   // avantPoste/richeQuartz/n50/g4/moitie
  156: { 1: "fa49dbe875f65768a054d6d36bec38c6", 2: "883a68045145c3e6694fc7340e6b39b8", 4: 459, 6: "96847078735", 7: "5069152500/2941000655/0", 8: "0/10/14" },   // avantPoste/richeScorie/n50/g4/toutes
  157: { 1: "cab18cb234f1674d3bdb4c0c7ee49548", 2: "81868ab9f92aa7fa31f9e49e8e208a8f", 4: 205, 6: "4215457361", 7: "5069152500/4192249962/0" },   // avantPoste/richeScorie/n50/g4/moitie
  158: { 1: "a9bda97641d515f1a7f010949f84685a", 2: "abb6d6ab735ff0b3740a8f3ae43f09af", 4: 205, 6: "23114534977", 7: "5602747500/3546616614/0", 8: "0/3/14" },   // base/-/n50/g4/toutes
  159: { 1: "fbf1385eb4a7831fd54426a65be4b922", 2: "56c603d6391328b7d2edca69034fa3b8", 4: 182, 6: "8775867464", 7: "5602747500/3818028571/0", 8: "0/2/7" },   // base/-/n50/g4/moitie
  160: { 1: "0bec7167298c5663f5c85a048edc4055", 2: "408e5d8e4b7ee04572a5f0797d779083", 4: 292, 7: "1464000/0/19588828", 8: "7/3/0" },   // camp/richeQuartz/n5/g5/toutes
  161: { 1: "49b9f6b1705d5a51ca8809a1cc95ed76", 2: "c725aaf50e18f1f08176d7eba8eb12dc", 4: 426, 5: "{\"quartz\":4069,\"scorie\":1356}", 6: "75360", 7: "15376704/0/5847204", 8: "3/3/1" },   // camp/richeQuartz/n5/g5/moitie
  162: { 1: "0bec7167298c5663f5c85a048edc4055", 2: "2d0099f3bfa58eeb512723b282a08d26", 4: 292, 7: "1464000/0/19588828", 8: "7/3/0" },   // camp/richeScorie/n5/g5/toutes
  163: { 1: "49b9f6b1705d5a51ca8809a1cc95ed76", 2: "4e6a202554e341032d047963dd4ec2d3", 4: 426, 5: "{\"quartz\":1356,\"scorie\":4069}", 6: "75360", 7: "15376704/0/5847204", 8: "3/3/1" },   // camp/richeScorie/n5/g5/moitie
  164: { 1: "e999979db920daf423de677991cfabc8", 2: "9f1ee9847cc1be508d16f81ac3b857ff", 4: 411, 7: "2928000/0/15593816", 8: "8/5/2" },   // avantPoste/richeQuartz/n5/g5/toutes
  165: { 1: "263877905da2eaf11ba2d31d7750c45b", 2: "068b36b8fbbdca1ff6daba50ff878c26", 4: 497, 5: "{\"quartz\":13614,\"scorie\":4538}", 6: "125600", 7: "21143382/0/4350653", 8: "2/5/2" },   // avantPoste/richeQuartz/n5/g5/moitie
  166: { 1: "e999979db920daf423de677991cfabc8", 2: "4e6e5bc362992b9363d99b2f54ca2896", 4: 411, 7: "2928000/0/15593816", 8: "8/5/2" },   // avantPoste/richeScorie/n5/g5/toutes
  167: { 1: "263877905da2eaf11ba2d31d7750c45b", 2: "65848922f3f7cb6f4983f4beff61e481", 4: 497, 5: "{\"quartz\":4538,\"scorie\":13614}", 6: "125600", 7: "21143382/0/4350653", 8: "2/5/2" },   // avantPoste/richeScorie/n5/g5/moitie
  168: { 1: "807888220ecabdc945d67214f4a3a77c", 2: "ec150227dfa1517e4db176ffe1491244", 4: 393, 7: "7320000/0/14338635" },   // base/-/n5/g5/toutes
  169: { 1: "f23132feb61c885af2a1d01c6e5a6457", 2: "75573bc871c3e82c3af25af267511589", 4: 423, 5: "{\"quartz\":1717,\"scorie\":4522}", 6: "103960", 7: "23044288/1907600/2086733" },   // base/-/n5/g5/moitie
  170: { 1: "451b54edec448d214711fd979a2e79fd", 2: "6f4ba15a9f7fc2be6103355c6177670e", 4: 564, 5: "{\"quartz\":209000,\"scorie\":69666}", 6: "18496483", 7: "131494000/32967387/7019384", 8: "3/9/11" },   // camp/richeQuartz/n20/g5/toutes
  171: { 1: "5dd47876eff2558844c864765d2862ee", 2: "0a1e26a170329a7e2f01db32d3caf287", 4: 321, 5: "{\"quartz\":0,\"scorie\":0}", 6: "9770200", 7: "152900000/56834353/0", 8: "0/5/7" },   // camp/richeQuartz/n20/g5/moitie
  172: { 1: "451b54edec448d214711fd979a2e79fd", 2: "fc1eb717dfc343aad9fbb9e6221d489d", 4: 564, 5: "{\"quartz\":69666,\"scorie\":209000}", 6: "18496483", 7: "131494000/32967387/7019384", 8: "3/9/11" },   // camp/richeScorie/n20/g5/toutes
  173: { 1: "5dd47876eff2558844c864765d2862ee", 2: "dfb1531b6459033e3cb190b27176432e", 4: 321, 5: "{\"quartz\":0,\"scorie\":0}", 6: "9770200", 7: "152900000/56834353/0", 8: "0/5/7" },   // camp/richeScorie/n20/g5/moitie
  174: { 1: "ab13c393b3504d9e7704a75a9ac73c79", 2: "e7296f8c223b75bc97dafd7d00c01836", 4: 273, 6: "13337875", 7: "211002000/97935870/12232000", 8: "0/6/13" },   // avantPoste/richeQuartz/n20/g5/toutes
  175: { 1: "61df0efa65a7956b89f77d5b1ce1958a", 2: "893d6dc977a1d7d49dbc121e54dec1e0", 4: 310, 6: "9084662", 7: "211002000/117813223/0", 8: "0/4/7" },   // avantPoste/richeQuartz/n20/g5/moitie
  176: { 1: "ab13c393b3504d9e7704a75a9ac73c79", 2: "5a5a1ee6adc74c226bcb3ecb770a8993", 4: 273, 6: "13337875", 7: "211002000/97935870/12232000", 8: "0/6/13" },   // avantPoste/richeScorie/n20/g5/toutes
  177: { 1: "61df0efa65a7956b89f77d5b1ce1958a", 2: "d9681d9486faf311b12b8d5577829f9e", 4: 310, 6: "9084662", 7: "211002000/117813223/0", 8: "0/4/7" },   // avantPoste/richeScorie/n20/g5/moitie
  178: { 1: "11897d20b602b41ff062efff76b3f8de", 2: "133d597a0245ec723d2bb21833cb61e4", 4: 254, 6: "15759528", 7: "226292000/108186114/18348000", 8: "0/6/12" },   // base/-/n20/g5/toutes
  179: { 1: "20d18e05a769e42ade66f73b426958fe", 2: "f898c019f234937f10db325d62b7b8c7", 4: 339, 6: "10339339", 7: "226292000/120169813/0" },   // base/-/n20/g5/moitie
  180: { 1: "09bdf4edc1b1d99123ad381c0f123edf", 2: "fedc8df210a40d559bd92b22ac04f077", 4: 348, 5: "{\"quartz\":1222586,\"scorie\":407528}", 6: "588634786", 7: "841925414/414548335/0", 8: "0/4/14" },   // camp/richeQuartz/n35/g5/toutes
  181: { 1: "e94f4efe3d0df07cc54c3680391ce999", 2: "ee4876c316240adffc50d7d4ecaafa14", 4: 269, 6: "40141286", 7: "855858000/539381273/0", 8: "0/1/7" },   // camp/richeQuartz/n35/g5/moitie
  182: { 1: "09bdf4edc1b1d99123ad381c0f123edf", 2: "c4c56059f528d17da9f0c5a1f610de34", 4: 348, 5: "{\"quartz\":407528,\"scorie\":1222586}", 6: "588634786", 7: "841925414/414548335/0", 8: "0/4/14" },   // camp/richeScorie/n35/g5/toutes
  183: { 1: "e94f4efe3d0df07cc54c3680391ce999", 2: "addd75c05f5f934addb66302b17bd35b", 4: 269, 6: "40141286", 7: "855858000/539381273/0", 8: "0/1/7" },   // camp/richeScorie/n35/g5/moitie
  184: { 1: "82401c914238986a4bf6d12faa459d1c", 2: "441db58381d6742000b4b6d29d201fd9", 4: 328, 6: "1523853529", 7: "1162434000/588801869/0", 8: "0/6/14" },   // avantPoste/richeQuartz/n35/g5/toutes
  185: { 1: "1ca275c08ba856b487c66e8957825b8e", 2: "a02cfe7ab24da1d5e60ea82ae6677e92", 4: 187, 6: "103088237", 7: "1162434000/721498815/0", 8: "0/2/7" },   // avantPoste/richeQuartz/n35/g5/moitie
  186: { 1: "82401c914238986a4bf6d12faa459d1c", 2: "17406ea82863711d5909ccf517677b46", 4: 328, 6: "1523853529", 7: "1162434000/588801869/0", 8: "0/6/14" },   // avantPoste/richeScorie/n35/g5/toutes
  187: { 1: "1ca275c08ba856b487c66e8957825b8e", 2: "955cd4aa5e2c9331bcea95cdf7585ed2", 4: 187, 6: "103088237", 7: "1162434000/721498815/0", 8: "0/2/7" },   // avantPoste/richeScorie/n35/g5/moitie
  188: { 1: "e5a1a0dc12a12195eb55376424ed0fbd", 2: "6f3cbd9cb26daec7804aabc30e80a8ce", 4: 449, 6: "1952349733", 7: "1251852000/613611239/51096000", 8: "0/10/13" },   // base/-/n35/g5/toutes
  189: { 1: "a4a88ef482e4a75f1342b9cbfc0f0fcf", 2: "4d3506c62ec1c4b9f722236667075409", 4: 206, 6: "307928455", 7: "1251852000/863500747/0", 8: "0/0/7" },   // base/-/n35/g5/moitie
  190: { 1: "457291196bd654b50e9146e63eb0696c", 2: "a2897817b196627f7af9e7ad4684c11e", 4: 286, 6: "87733663848", 7: "3788524500/1851448083/0", 8: "0/4/14" },   // camp/richeQuartz/n50/g5/toutes
  191: { 1: "a05434f21dcda2667bb56c5952efcae1", 2: "1093e7f7fb40da3a453a7fbc8c96416b", 4: 188, 6: "2944240146", 7: "3788524500/2486191564/0" },   // camp/richeQuartz/n50/g5/moitie
  192: { 1: "457291196bd654b50e9146e63eb0696c", 2: "2d74ea861505a13317e0ae3f3e441b22", 4: 286, 6: "87733663848", 7: "3788524500/1851448083/0", 8: "0/4/14" },   // camp/richeScorie/n50/g5/toutes
  193: { 1: "a05434f21dcda2667bb56c5952efcae1", 2: "958d97c2724462b967081777ff162b9e", 4: 188, 6: "2944240146", 7: "3788524500/2486191564/0" },   // camp/richeScorie/n50/g5/moitie
  194: { 1: "6b65922fc097d5a3318a7a16a694e71e", 2: "93365cf2136fd29744c07db32b07a321", 4: 335, 6: "53861140674", 7: "5069152500/3310823807/0", 8: "0/3/14" },   // avantPoste/richeQuartz/n50/g5/toutes
  195: { 1: "980c9f218854cb89e12ec455c0715b53", 2: "cca40ce0f450cbf4c6ab8cc11d7f7de4", 4: 273, 6: "36722696367", 7: "5069152500/3462410458/0", 8: "0/2/7" },   // avantPoste/richeQuartz/n50/g5/moitie
  196: { 1: "6b65922fc097d5a3318a7a16a694e71e", 2: "bfda20db57caa396608c79dbdab42f0c", 4: 335, 6: "53861140674", 7: "5069152500/3310823807/0", 8: "0/3/14" },   // avantPoste/richeScorie/n50/g5/toutes
  197: { 1: "980c9f218854cb89e12ec455c0715b53", 2: "81b886473b0b54448a6146a1ca951347", 4: 273, 6: "36722696367", 7: "5069152500/3462410458/0", 8: "0/2/7" },   // avantPoste/richeScorie/n50/g5/moitie
  198: { 1: "ceaa53eb84119f2e2bb12c45d6d1404c", 2: "5750019a53c05b14e2fc9199fe840936", 4: 338, 6: "61995761524", 7: "5602747500/4322763553/0" },   // base/-/n50/g5/toutes
  199: { 1: "d4a1bf9f6feeacdf18ae9a368f9934b9", 2: "3d3a78335e1d6386731d12a0805d3fcd", 6: "6836969863", 7: "5602747500/4662387701/0", 8: "0/2/7" },   // base/-/n50/g5/moitie
};


/**
 * QUATRIÈME COUCHE — lot DISPOSITION-OUVRAGE, 08/09/2026.
 *
 * ⚠⚠ POINT 9 D'ETHAN : les deux blocs d'un site de l'Ouvrage FLOTTENT désormais
 * dans leur bande au lieu d'être collés à son bord, et les colonnes des deux
 * uniques se tirent. Deux cents combats sur deux cents sont touchés — un site
 * qui n'est plus disposé pareil ne rend pas le même combat — et **1 039 champs
 * sur 1 600** se déplacent.
 *
 * ⚠⚠ ET LA CAUSE N'EST PAS CELLE DES TROIS COUCHES PRÉCÉDENTES, CE QUI SE LIT
 * DANS LE CHIFFRE. ARRÊT, COLONNE et CIBLES-RANGÉES déplaçaient le FLUX de
 * tirages, donc RECOMPOSAIENT la garnison en même temps qu'ils la déplaçaient ;
 * celui-ci tire sur un SECOND flux, salé, précisément pour que la composition ne
 * bouge pas d'un identifiant — mesuré, zéro écart sur 6 000 montages. Ce qui
 * bouge est la POSITION des mêmes pièces.
 *
 * ⚠ ON EMPILE, ON NE REMPLACE PAS : les couches se lisent de la plus RÉCENTE à
 * la plus ancienne, et ce qui n'est nommé nulle part reste adossé à la capture
 * d'avant le lot JOURNAL-DE-COMBAT.
 */
export const COMBATS_DEPLACES_PAR_DISPOSITION_OUVRAGE = {
  0: { 1: "007c4c9d3c275530780b0f417c151a02", 2: "4f84698d6cecb4b43b98f9bd71f112de", 4: 283, 7: "5856000/0/19086954", 8: "5/3/0" },
  1: { 1: "b9697a6bff3e92302f965e12c7cc1701", 2: "b12d4836b19381643f839fd17026f9e2", 4: 435, 5: "{\"quartz\":3957,\"scorie\":1319}", 7: "15372000/0/6991989", 8: "3/3/0" },
  2: { 1: "007c4c9d3c275530780b0f417c151a02", 2: "9a631313e0a7308f64b148a6a2c3b786", 4: 283, 7: "5856000/0/19086954", 8: "5/3/0" },
  3: { 1: "b9697a6bff3e92302f965e12c7cc1701", 2: "c844800b460f309d743fe50862713158", 4: 435, 5: "{\"quartz\":1319,\"scorie\":3957}", 7: "15372000/0/6991989", 8: "3/3/0" },
  4: { 1: "b3f08931865b50565792e5614e3160b9", 2: "6d3b28a9c9c1ce31f9d586f16836e8b9", 4: 334, 7: "5856000/0/18248592", 8: "7/5/1" },
  5: { 1: "7f55c435b7db680ed18c6a0a47b2e66b", 2: "5771df97909cf2637ca56b7758ea45b4", 4: 473, 5: "{\"quartz\":20671,\"scorie\":6890}", 6: "105048", 7: "16555526/838420/5409324", 8: "3/4/1" },
  6: { 1: "b3f08931865b50565792e5614e3160b9", 2: "f3715ebdd471e304896cc5b27adbcdab", 4: 334, 7: "5856000/0/18248592", 8: "7/5/1" },
  7: { 1: "7f55c435b7db680ed18c6a0a47b2e66b", 2: "b6595c44ac734d96f719745c10bcdea1", 4: 473, 5: "{\"quartz\":6890,\"scorie\":20671}", 6: "105048", 7: "16555526/838420/5409324", 8: "3/4/1" },
  8: { 1: "ca9071e2396fa00da8868354a54c4ebd", 2: "a7e640fe61806d9a66f5793051d786c3", 4: 378, 7: "4392000/0/17215625", 8: "8/6/1" },
  9: { 1: "53aab0c526d594aba1d982e2d9c296c6", 2: "2c1721b0fe31abb236248d2e08935c1a", 4: 400, 5: "{\"quartz\":3463,\"scorie\":4645}", 6: "80065", 7: "18726773/2882441/4433526", 8: "3/3/1" },
  10: { 1: "298999ad464df9806c58cebcc7deff62", 2: "e0cac36d449603483164a32b0b1e5599", 4: 580, 5: "{\"quartz\":261250,\"scorie\":87083}", 6: "17695973", 7: "122320000/52601835/8814297", 8: "4/6/11" },
  11: { 1: "6942c61682a493b375d0335db363462d", 2: "7a4bd3da432974612858a0f87d821afe", 4: 428, 5: "{\"quartz\":1487,\"scorie\":495}", 6: "13267700", 7: "152638850/63218833/2611693", 8: "0/5/6" },
  12: { 1: "298999ad464df9806c58cebcc7deff62", 2: "c6d3e6a5806df0b288b29ec45f2ccd8c", 4: 580, 5: "{\"quartz\":87083,\"scorie\":261250}", 6: "17695973", 7: "122320000/52601835/8814297", 8: "4/6/11" },
  13: { 1: "6942c61682a493b375d0335db363462d", 2: "11d35e3f06ce31d410863aa5f3ba2a29", 4: 428, 5: "{\"quartz\":495,\"scorie\":1487}", 6: "13267700", 7: "152638850/63218833/2611693", 8: "0/5/6" },
  14: { 1: "17d8ff295a426f4d56ffdfb29fd2d65d", 2: "ae51642b360d3876744c1756e407b98c", 4: 653, 5: "{\"quartz\":1358502,\"scorie\":452834}", 6: "20461183", 7: "168190000/69123228/24342575", 8: "6/13/9" },
  15: { 1: "5993550d4fec3af5547d2c2b4adaac7e", 2: "6681cbae8bcc99edbc2db80d2c7652d5", 4: 310, 6: "8530041", 7: "211002000/116127440/0", 8: "0/5/7" },
  16: { 1: "17d8ff295a426f4d56ffdfb29fd2d65d", 2: "066a1563c11c946743b39f455e2d75fb", 4: 653, 5: "{\"quartz\":452834,\"scorie\":1358502}", 6: "20461183", 7: "168190000/69123228/24342575", 8: "6/13/9" },
  17: { 1: "5993550d4fec3af5547d2c2b4adaac7e", 2: "930ed58dbc9b80b3f5b2f39f5778108c", 4: 310, 6: "8530041", 7: "211002000/116127440/0", 8: "0/5/7" },
  18: { 1: "c3963557c79bf961b20a6528f7517f98", 2: "768b30f8d3ed0e7cf5ac0e1ac1d95a6f", 4: 445, 6: "28574497", 7: "226292000/102663497/12232000", 8: "0/9/13" },
  19: { 1: "5ce22fc90b974258e9dd4d949c00e579", 2: "9dd030489a3b7d28f24d52c27b17fb2d", 4: 263, 6: "9535920", 7: "226292000/137380116/0" },
  20: { 1: "9094dd45db52752e0177bed08f176ca9", 2: "54ac9dfd48b5dc2e6ecc82e169f5fee1", 4: 302, 6: "1003775705", 7: "855858000/535923636/51096000", 8: "0/5/13" },
  21: { 1: "a81ad6de8c6de5d731b794db19ba9715", 2: "e8a6c129b1c1a5152a1f35ee612b9cca", 4: 225, 6: "285627868", 7: "855858000/736999560/0", 8: "0/0/7" },
  22: { 1: "9094dd45db52752e0177bed08f176ca9", 2: "607487e49501481a13e4b2deffed4163", 4: 302, 6: "1003775705", 7: "855858000/535923636/51096000", 8: "0/5/13" },
  23: { 1: "a81ad6de8c6de5d731b794db19ba9715", 2: "8ed4f4dfa9152cc73792262b05208a49", 4: 225, 6: "285627868", 7: "855858000/736999560/0", 8: "0/0/7" },
  24: { 1: "e4112e6fad091914e7b9535e471ec317", 2: "417458267205f4c25e93d5a63b49382e", 4: 228, 6: "469546469", 7: "1162434000/652596561/0", 8: "0/4/14" },
  25: { 1: "154b12082f401ca8273993173f19ae39", 2: "94d0ee9377608cd58800235ec5f199eb", 4: 178, 6: "50744204", 7: "1162434000/778047724/0", 8: "0/2/7" },
  26: { 1: "e4112e6fad091914e7b9535e471ec317", 2: "50af990f2d69358a49b8e8fa4c6b9e62", 4: 228, 6: "469546469", 7: "1162434000/652596561/0", 8: "0/4/14" },
  27: { 1: "154b12082f401ca8273993173f19ae39", 2: "9ba9a3e8c0415f007cd8c43aeba6611f", 4: 178, 6: "50744204", 7: "1162434000/778047724/0", 8: "0/2/7" },
  28: { 1: "586990cb4ef39721f6701f73ba5ec61e", 2: "9cbbece7b4342355266593ffe9b7a99e", 4: 297, 6: "1255784963", 7: "1251852000/670610524/0", 8: "0/7/14" },
  29: { 1: "5f64909ba318b0f45d0fdf6992ee719f", 2: "8839b080d2513a62a615bbac66fcd4b3", 4: 171, 6: "111065702", 7: "1251852000/833687677/0" },
  30: { 1: "c8b56126f00c42e97aff3ba35eb78d79", 2: "a49034f4369de463f4a46f513966b5d9", 4: 300, 6: "108271865558", 7: "3788524500/1605305211/0", 8: "0/3/14" },
  31: { 1: "64035ee550ea1bef13f4e2401b9afad0", 2: "af293879be3b7ee53f2e2d20f11d36fe", 4: 167, 6: "30006272411", 7: "3788524500/2077490866/0" },
  32: { 1: "c8b56126f00c42e97aff3ba35eb78d79", 2: "e0903352483cdc8ce3272851553531eb", 4: 300, 6: "108271865558", 7: "3788524500/1605305211/0", 8: "0/3/14" },
  33: { 1: "64035ee550ea1bef13f4e2401b9afad0", 2: "6916a6b6ccb3772e9b4910f63fd5cd79", 4: 167, 6: "30006272411", 7: "3788524500/2077490866/0" },
  34: { 1: "53a83e7f975c9dea1ddd0ae37da3536d", 2: "aa80cee04b4674c0a0bdafeae51fcac2", 4: 191, 6: "10402404324", 7: "5069152500/3223866512/0" },
  35: { 1: "2183afa970df07a74d65524e731e31a7", 2: "6520ff8d4f50d509e9680a185cfdc6b8", 4: 171, 6: "1334536975", 7: "5069152500/3844568881/0" },
  36: { 1: "53a83e7f975c9dea1ddd0ae37da3536d", 2: "0527583fbad1cd19f714fd910df58fec", 4: 191, 6: "10402404324", 7: "5069152500/3223866512/0" },
  37: { 1: "2183afa970df07a74d65524e731e31a7", 2: "a764b3021c3af2d137237d6dea785eb1", 4: 171, 6: "1334536975", 7: "5069152500/3844568881/0" },
  38: { 1: "1410ba091487bbc86c345a9ffe8d30b2", 2: "0c0be9340683ee968026940de50a8dcb", 4: 202, 6: "6522847819", 7: "5602747500/4864171376/0", 8: "0/3/14" },
  39: { 1: "c2b12e8edebc2e5cddd6bed8e1372b9f", 2: "2b6f5d8b44ced871891b88da51d981f2", 4: 172, 6: "2567703056", 7: "5602747500/5437386123/0", 8: "0/1/7" },
  40: { 1: "35129f2540bb1f8586f32e89ae6cd1d6", 2: "ec867338936c4ba60839a14157fe0389", 3: "attaquants", 4: 470, 5: "{\"quartz\":5087,\"scorie\":1695}", 7: "13176000/0/18953367", 8: "4/3/0" },
  41: { 1: "d84ffa4df56ce13bb16edb98aa9a3483", 2: "1da9ab3c666e25acf1ab0d799b34e4d9", 4: 450, 5: "{\"quartz\":3391,\"scorie\":1130}", 6: "40407", 7: "14640000/1425936/7613635", 8: "3/1/0" },
  42: { 1: "35129f2540bb1f8586f32e89ae6cd1d6", 2: "f16e1f62199026eadf96dd087298fa3c", 3: "attaquants", 4: 470, 5: "{\"quartz\":1695,\"scorie\":5087}", 7: "13176000/0/18953367", 8: "4/3/0" },
  43: { 1: "d84ffa4df56ce13bb16edb98aa9a3483", 2: "db7d148216a3a6d33b3081d042d87e00", 4: 450, 5: "{\"quartz\":1130,\"scorie\":3391}", 6: "40407", 7: "14640000/1425936/7613635", 8: "3/1/0" },
  44: { 1: "4c1ba714aec8bb0496cf193dc882d09a", 2: "17bd5abdeb4adc2ebc681155d6b1fd47", 3: "attaquants", 4: 446, 5: "{\"quartz\":22047,\"scorie\":7349}", 7: "15372000/0/17795097", 8: "5/5/0" },
  45: { 1: "d8486c83c5fbff7e68835b8d770ff65a", 2: "a8f8f8743c04ec9f4f0e5c52bb3ef1a7", 4: 435, 5: "{\"quartz\":16535,\"scorie\":5511}", 6: "61457", 7: "16836000/2616769/5794069", 8: "4/2/0" },
  46: { 1: "4c1ba714aec8bb0496cf193dc882d09a", 2: "879826d9637cb1ff5d1ab1c8b4b801ff", 3: "attaquants", 4: 446, 5: "{\"quartz\":7349,\"scorie\":22047}", 7: "15372000/0/17795097", 8: "5/5/0" },
  47: { 1: "d8486c83c5fbff7e68835b8d770ff65a", 2: "56bc07e6259c3dec3def100a03596496", 4: 435, 5: "{\"quartz\":5511,\"scorie\":16535}", 6: "61457", 7: "16836000/2616769/5794069", 8: "4/2/0" },
  48: { 1: "b856ae13c553349ef4750e1837785cbc", 2: "2c375c2fbd6c7a46ad97af45e73f69c1", 3: "attaquants", 4: 478, 5: "{\"quartz\":6783,\"scorie\":6029}", 7: "13176000/0/15936635", 8: "7/6/1" },
  49: { 1: "60206fdb6ecdc84e4f5ba63d502ed899", 2: "6596dd09d9bcebb07526efa8d9664210", 4: 381, 5: "{\"quartz\":3412,\"scorie\":4920}", 6: "114215", 7: "17872869/1489243/3861760", 8: "4/4/2" },
  50: { 1: "937de8134129b6608f403fc706258c93", 2: "b79034aa90c8a9f2ba58b30bf97bed1a", 4: 311, 6: "16777103", 7: "152900000/54235997/12232000" },
  51: { 1: "753bdb448d97d297596c2551f6fa788b", 2: "2e034dede5179d5c7ef274de04c05866", 4: 346, 6: "11686094", 7: "152900000/64799858/0", 8: "0/4/7" },
  52: { 1: "937de8134129b6608f403fc706258c93", 2: "bc85ad5fb06bab01c5c0c43bf177d6ea", 4: 311, 6: "16777103", 7: "152900000/54235997/12232000" },
  53: { 1: "753bdb448d97d297596c2551f6fa788b", 2: "20ff61e57338747038f9299292b495cb", 4: 346, 6: "11686094", 7: "152900000/64799858/0", 8: "0/4/7" },
  54: { 1: "0e87a321fa37b0fa8045ce1a4aadc483", 2: "8319cd1ac7a0b91914e820b994ebdaec", 4: 301, 6: "20801634", 7: "211002000/80115250/18348000", 8: "0/8/12" },
  55: { 1: "fef0b451a1e593c949bf96be41c859ec", 2: "03372c1347b28643c5188afed49f59d0", 4: 258, 6: "6052064", 7: "211002000/120969772/0" },
  56: { 1: "0e87a321fa37b0fa8045ce1a4aadc483", 2: "2968ffafc090240fda6cba342adef3f2", 4: 301, 6: "20801634", 7: "211002000/80115250/18348000", 8: "0/8/12" },
  57: { 1: "fef0b451a1e593c949bf96be41c859ec", 2: "2315c942afcbbed33761ab6bdec50be9", 4: 258, 6: "6052064", 7: "211002000/120969772/0" },
  58: { 1: "052c38180f2cb88e68ef172da47f2181", 2: "dd038c4d37d727a1adf06a7378716471", 4: 392, 6: "25748877", 7: "226292000/85625094/12232000", 8: "0/11/13" },
  59: { 1: "6b32d5ceda8a9acac490c7c3c09ff907", 2: "c3c457b51b50b7b3d60088558a1ef086", 4: 547 },
  60: { 1: "9855aa311aa3fcee4ff1c9b0dd35c6bb", 2: "7df1280725adec264f8c58427ee47d0b", 4: 304, 6: "1264806414", 7: "855858000/411429204/0" },
  61: { 1: "50d7611f57da4d3042b4e3b31c63400f", 2: "dc2031ba81132a1fd5abd4cfa1f5e170", 4: 214, 6: "195092104", 7: "855858000/592197663/0" },
  62: { 1: "9855aa311aa3fcee4ff1c9b0dd35c6bb", 2: "bad137e2f50b2c2818f9b6acf8fd7677", 4: 304, 6: "1264806414", 7: "855858000/411429204/0" },
  63: { 1: "50d7611f57da4d3042b4e3b31c63400f", 2: "7a9fb01d13dca266bf7b03df28eac16d", 4: 214, 6: "195092104", 7: "855858000/592197663/0" },
  64: { 1: "a7f3ce4fec6548a9f122c45bb600d4de", 2: "a7ff7060fe288baff4a52c5a3173736e" },
  65: { 1: "5e7680614952f0c41aaf02f2bb085d7d", 2: "092bf73fb9526d535fdd3ff738844111" },
  66: { 1: "a7f3ce4fec6548a9f122c45bb600d4de", 2: "a5458679d89d52bb37033d72b1c6fae0" },
  67: { 1: "5e7680614952f0c41aaf02f2bb085d7d", 2: "1b1b84688f1294ded0244f75052e86f7" },
  68: { 1: "833140af592ba5be8ed4d7bf92794dbe", 2: "1b2e22e9a0d482436176bc76a2285600" },
  69: { 1: "50a1e3887c57f04c2ff9838a4db95259", 2: "98cab5ba1b0d6427b4788467eebddbe5" },
  70: { 1: "a730457cb78166d6fe74bdbd53a1c76d", 2: "1bce42e5f2ce02657a0503a59bbe8d19", 4: 244, 6: "64551574524", 7: "3788524500/2014912214/213438000", 8: "0/2/13" },
  71: { 1: "fc3975b6df8a6e287d6fd6c567bee05e", 2: "9e7f77cdf97a60cc73baf2b79e9e08a2", 4: 251, 6: "26474224723", 7: "3788524500/2257024868/0", 8: "0/2/7" },
  72: { 1: "a730457cb78166d6fe74bdbd53a1c76d", 2: "136ea468be167ce21ec983a6211719fb", 4: 244, 6: "64551574524", 7: "3788524500/2014912214/213438000", 8: "0/2/13" },
  73: { 1: "fc3975b6df8a6e287d6fd6c567bee05e", 2: "da82adc13a5abf43a5b54c72fea91b4a", 4: 251, 6: "26474224723", 7: "3788524500/2257024868/0", 8: "0/2/7" },
  74: { 1: "d80af6112cac73dad6ef79778c00efdc", 2: "4dcf2eae0507154ba6dd223391e91e54" },
  75: { 1: "8002560f2ce27801353131df97fe6c36", 2: "964d984dc395e8475654126da5863c09" },
  76: { 1: "d80af6112cac73dad6ef79778c00efdc", 2: "4363cc45498a08e895fd251e34f17353" },
  77: { 1: "8002560f2ce27801353131df97fe6c36", 2: "27fe9027107bb082a22e01fb775e6460" },
  78: { 1: "773c21c6672cc551186a0bca31c57eeb", 2: "2bf0a3ba4961d5c24e26d2263c5e7208" },
  79: { 1: "5a025c310f58e69881849e79016802be", 2: "1071e48afc978bb20f103e1caa3484a3" },
  80: { 1: "371dfa7afe33414a69a4eca0aa51da72", 2: "9d76d70ea199f002ff531c02de8e7f4f", 4: 412, 7: "6588000/0/19009753", 8: "5/3/0" },
  81: { 1: "cfbde9660e14f690736c0e8681fd586b", 2: "cc15401cfa5fdcd9064592393e2115b6", 4: 376, 5: "{\"quartz\":2826,\"scorie\":942}", 6: "59043", 7: "18300000/665665/5591521", 8: "2/2/1" },
  82: { 1: "371dfa7afe33414a69a4eca0aa51da72", 2: "2c342f7ec2859a33cf48f08e04bef9cb", 4: 412, 7: "6588000/0/19009753", 8: "5/3/0" },
  83: { 1: "cfbde9660e14f690736c0e8681fd586b", 2: "028be909ec2eaa4b048fbd0aae69f314", 4: 376, 5: "{\"quartz\":942,\"scorie\":2826}", 6: "59043", 7: "18300000/665665/5591521", 8: "2/2/1" },
  84: { 1: "353dd7488a788d806ebb9863cf32bb19", 2: "a93e19c883d90b6af45808ca4daa89dd", 3: "attaquants", 4: 564, 5: "{\"quartz\":25591,\"scorie\":8530}", 7: "9353196/0/16970977", 8: "5/5/0" },
  85: { 1: "dbbee2659275a73ddf455c411075c7a2", 2: "fcaad342e43bb4499ecc403bf6f9532d", 4: 391, 5: "{\"quartz\":12860,\"scorie\":4286}", 6: "109485", 7: "19764000/657407/5098112", 8: "3/4/1" },
  86: { 1: "353dd7488a788d806ebb9863cf32bb19", 2: "be2a76a07a58fd6a29d78f66d1fffe2a", 3: "attaquants", 4: 564, 5: "{\"quartz\":8530,\"scorie\":25591}", 7: "9353196/0/16970977", 8: "5/5/0" },
  87: { 1: "dbbee2659275a73ddf455c411075c7a2", 2: "14db5238bf155ed9dd58a9ef4ccf089a", 4: 391, 5: "{\"quartz\":4286,\"scorie\":12860}", 6: "109485", 7: "19764000/657407/5098112", 8: "3/4/1" },
  88: { 1: "a7e93b946d7b63eec53cd9a268834179", 2: "357908257226154335aacfa3565d74b0", 4: 386, 7: "8784000/0/17247961", 8: "7/6/1" },
  89: { 1: "1f9d2ee99f02e5b106f80afaad86b952", 2: "f59ebd9a8d750f829dfb1c9bca8e6cbf", 4: 436, 5: "{\"quartz\":4675,\"scorie\":2413}", 7: "22246944/1024800/5516731", 8: "3/5/0" },
  90: { 1: "7544807fb5ff9fb21ce15f12318590c1", 2: "f2d12501d9cd5d5de9261ea4ad51ebce", 4: 525, 5: "{\"quartz\":263851,\"scorie\":87950}", 6: "24652668", 7: "129508238/30787995/13626515", 8: "3/9/12" },
  91: { 1: "360903e12b11acd3c2c1c5bce9138c1e", 2: "797c45a8ba30e671d8794a9e0afe8d07", 4: 531, 6: "12192577", 7: "152900000/59322038/0" },
  92: { 1: "7544807fb5ff9fb21ce15f12318590c1", 2: "147bda57d8863f82fc2f04ed36d3301b", 4: 525, 5: "{\"quartz\":87950,\"scorie\":263851}", 6: "24652668", 7: "129508238/30787995/13626515", 8: "3/9/12" },
  93: { 1: "360903e12b11acd3c2c1c5bce9138c1e", 2: "95897d300b1575147a1672927dbb73e2", 4: 531, 6: "12192577", 7: "152900000/59322038/0" },
  94: { 1: "dc8c5827fb1f224ca2a617f0d0d3d964", 2: "54b4aade8157201169b8786f386fa69b", 4: 303, 6: "18254323", 7: "211002000/86286844/0", 8: "0/7/14" },
  95: { 1: "7b5a6db48474fb9005e78aaa367a9287", 2: "13ad6da54e02e80bb1d464b8bb8f66d2", 4: 246, 6: "6008335", 7: "211002000/120740749/0" },
  96: { 1: "dc8c5827fb1f224ca2a617f0d0d3d964", 2: "d97614b49e31692b2ce7e730c1773db8", 4: 303, 6: "18254323", 7: "211002000/86286844/0", 8: "0/7/14" },
  97: { 1: "7b5a6db48474fb9005e78aaa367a9287", 2: "0651cb2e653e859ba11da3d73b4b45ca", 4: 246, 6: "6008335", 7: "211002000/120740749/0" },
  98: { 1: "41014822cd1b889cb29874c1e13d0a11", 2: "083f60378b80fb88a04501e242343c20", 4: 567, 5: "{\"quartz\":208305,\"scorie\":103805}", 6: "25906440", 7: "192836992/78627387/11247659", 8: "3/13/11" },
  99: { 1: "c4559ae0cf1dc4292b246478eef79cb1", 2: "95979cc47bdb150bc45938067a0ffa53", 4: 296, 5: "{\"quartz\":258,\"scorie\":258}", 6: "6490229", 7: "226223933/133903293/4281200", 8: "0/5/6" },
  100: { 1: "153893013a4522edabc9a1a109490079", 2: "607f5fe92f6345c6614cfb71f63fa479", 4: 321, 6: "1516111301", 7: "855858000/370996992/76644000", 8: "0/8/12" },
  101: { 1: "55fef19222f0fd8296bfcd1115d6ff1f", 2: "b743013ec0a7d6d17219daab36f01cd2", 4: 222, 6: "374637942", 7: "855858000/511998751/0", 8: "0/2/7" },
  102: { 1: "153893013a4522edabc9a1a109490079", 2: "f6a729a2d93dab7910e5945aa7c48e1e", 4: 321, 6: "1516111301", 7: "855858000/370996992/76644000", 8: "0/8/12" },
  103: { 1: "55fef19222f0fd8296bfcd1115d6ff1f", 2: "87bd4a329dba6cc25c7f1fd853416869", 4: 222, 6: "374637942", 7: "855858000/511998751/0", 8: "0/2/7" },
  104: { 1: "670bc2ba0ff90c579f997e29de8e7035", 2: "fd3d09ac85414a35f072e9ea96cd4a65" },
  105: { 1: "2b0b7666cc1660b06a51f4c9e627e452", 2: "ee88a57131ed39b4caa1e3b358903915" },
  106: { 1: "670bc2ba0ff90c579f997e29de8e7035", 2: "f94f61a643ecc5c1f0a41d73f9e70ba7" },
  107: { 1: "2b0b7666cc1660b06a51f4c9e627e452", 2: "f7c5fea8c8e4fe58a235446010c66840" },
  108: { 1: "af599b87b9bd76deeb1498d209e655b0", 2: "3ebeb71c42764207018fbef2f854e3b2", 4: 263, 6: "731328947", 7: "1251852000/800604828/0", 8: "0/3/14" },
  109: { 1: "95191fa27353939c9f494ed86b9f92bd", 2: "214cf0d719be13fa79da13c4d26fbb12", 4: 172, 6: "83832587", 7: "1251852000/944371984/0" },
  110: { 1: "84a02c6b2affd439954b4d365ced4374", 2: "c8376dba7896441d08a5696b2af71149", 4: 267, 6: "93649190716", 7: "3788524500/2085143197/0", 8: "0/3/14" },
  111: { 1: "95c28e59a3f717ba63a57b41bd990f67", 2: "180ccfd14febd92584b704942c260eb9", 4: 176, 6: "5896986822", 7: "3788524500/2567601587/0" },
  112: { 1: "84a02c6b2affd439954b4d365ced4374", 2: "edde9a39411bd613f37f512c6791187d", 4: 267, 6: "93649190716", 7: "3788524500/2085143197/0", 8: "0/3/14" },
  113: { 1: "95c28e59a3f717ba63a57b41bd990f67", 2: "46723daac9230b2d3643cb6abb7a6137", 4: 176, 6: "5896986822", 7: "3788524500/2567601587/0" },
  114: { 1: "f0b03a0834d6f8210f106827a8122c4b", 2: "ea07c147bb29dd75365e77e943ce79db", 4: 249, 6: "52138691329", 7: "5069152500/2990862742/0", 8: "0/6/14" },
  115: { 1: "845577a0365af2e62de7c32e5d632765", 2: "d67c55558520edc49898b46964f1a1ee", 4: 180, 6: "6980575103", 7: "5069152500/3588963089/0", 8: "0/3/7" },
  116: { 1: "f0b03a0834d6f8210f106827a8122c4b", 2: "73c966ac6360871ac884ad8cd130059d", 4: 249, 6: "52138691329", 7: "5069152500/2990862742/0", 8: "0/6/14" },
  117: { 1: "845577a0365af2e62de7c32e5d632765", 2: "7a4da95b6998eca1b285c83277027d7c", 4: 180, 6: "6980575103", 7: "5069152500/3588963089/0", 8: "0/3/7" },
  118: { 1: "3a1c3d4e57fb99044787cea070d0cfcf", 2: "6bde4a6ecb97f88d20388fc1dd42e0dd" },
  119: { 1: "0961f843fa85ca39672257090105954f", 2: "fefc42dd2c60ca08ad27aa9dec903bf9" },
  120: { 1: "359ce6b0b61b3bcbc940009978c02171", 2: "60c0af3b6ccf41b4e899466cb1e0ea9d", 3: "attaquants", 4: 545, 5: "{\"quartz\":7914,\"scorie\":2638}", 7: "9516000/0/19440718", 8: "6/3/0" },
  121: { 1: "3001a5e3e1ceab974b4d1131448f1e54", 2: "6827162bb1480baa4681dddcccca23ae", 4: 525, 5: "{\"quartz\":4522,\"scorie\":1507}", 6: "43676", 7: "16836000/1292584/6773921", 8: "3/1/0" },
  122: { 1: "359ce6b0b61b3bcbc940009978c02171", 2: "48f5652261f67f3c768650e08bac839b", 3: "attaquants", 4: 545, 5: "{\"quartz\":2638,\"scorie\":7914}", 7: "9516000/0/19440718", 8: "6/3/0" },
  123: { 1: "3001a5e3e1ceab974b4d1131448f1e54", 2: "32207da53526f99ff88a536d8a0518be", 4: 525, 5: "{\"quartz\":1507,\"scorie\":4522}", 6: "43676", 7: "16836000/1292584/6773921", 8: "3/1/0" },
  124: { 1: "0574d3dd6366738e9296274f0f9b636b", 2: "8adb0314794b5e26602e9aa7f14e3ca4", 3: "attaquants", 4: 495, 5: "{\"quartz\":31233,\"scorie\":10411}", 7: "11712000/0/19665694" },
  125: { 1: "2269f93c2de59605091aa7f677bfe013", 2: "3c60e0f509dbca11f689b1d18fadc69f", 4: 425, 5: "{\"quartz\":20209,\"scorie\":6736}", 6: "55484", 7: "19032000/2860439/5322636", 8: "4/2/1" },
  126: { 1: "0574d3dd6366738e9296274f0f9b636b", 2: "f91419517d222ae1b7439b6a2a346f73", 3: "attaquants", 4: 495, 5: "{\"quartz\":10411,\"scorie\":31233}", 7: "11712000/0/19665694" },
  127: { 1: "2269f93c2de59605091aa7f677bfe013", 2: "783e5da76a26b0a554829eff4efb815a", 4: 425, 5: "{\"quartz\":6736,\"scorie\":20209}", 6: "55484", 7: "19032000/2860439/5322636", 8: "4/2/1" },
  128: { 1: "cc473876ccae0c3e46dd1a190c51b15f", 2: "d619d5e0717a45daf5b3b2e37117c43b", 3: "attaquants", 4: 471, 5: "{\"quartz\":4522,\"scorie\":8291}", 6: "142066", 7: "13176000/353033/18819193", 8: "7/5/0" },
  129: { 1: "447674be16be5f5917f32735b62903f6", 2: "8a28f6b67e84a54edb1f8b7e17f22aa1", 4: 520, 5: "{\"quartz\":3014,\"scorie\":5276}", 6: "119686", 7: "20496000/1266053/4581541", 8: "4/4/0" },
  130: { 1: "629d598d1ed98abcc0b2273f1654bc2f", 2: "a2fb9c57ada29af28e573c44047b39eb", 4: 233, 6: "17781314", 7: "152900000/42270446/18348000", 8: "0/7/12" },
  131: { 1: "36cbb980384c69fdba43e77a6cebfaaa", 2: "83fd9822246b015e634190294ba88532", 4: 340, 6: "12589154", 7: "152900000/63927808/0" },
  132: { 1: "629d598d1ed98abcc0b2273f1654bc2f", 2: "b2a71828cc3184a18fdd0ea36f5f5bda", 4: 233, 6: "17781314", 7: "152900000/42270446/18348000", 8: "0/7/12" },
  133: { 1: "36cbb980384c69fdba43e77a6cebfaaa", 2: "5091d2fec070056551485a99faca81a1", 4: 340, 6: "12589154", 7: "152900000/63927808/0" },
  134: { 1: "930cca391a8d7654d0c572b3c202a7e2", 2: "8672e347ee024a948e4204c1fafe4310", 4: 850, 5: "{\"quartz\":339540,\"scorie\":113180}", 6: "22223824", 7: "192658615/86572049/380307", 8: "1/10/13" },
  135: { 1: "bc56ef4a78c34579756b22ac2f1455ef", 2: "5dca6e0dd31909e429c8225c346ccd8f", 4: 253, 6: "11055554", 7: "211002000/124722489/0", 8: "0/4/7" },
  136: { 1: "930cca391a8d7654d0c572b3c202a7e2", 2: "67d13aa426a097c094c0c836222435d7", 4: 850, 5: "{\"quartz\":113180,\"scorie\":339540}", 6: "22223824", 7: "192658615/86572049/380307", 8: "1/10/13" },
  137: { 1: "bc56ef4a78c34579756b22ac2f1455ef", 2: "8f55f80673195ecabf0e43b6663b9596", 4: 253, 6: "11055554", 7: "211002000/124722489/0", 8: "0/4/7" },
  138: { 1: "a3552b284614abe3283669d1387b796d", 2: "269cfc1e130e42524f435b0efcb8f8dc", 4: 437, 5: "{\"quartz\":13288,\"scorie\":13288}", 6: "22562941", 7: "222792170/82396828/3814207", 8: "0/10/12" },
  139: { 1: "efc9f23cf9f2e712d02286430a1bf969", 2: "bfb95ede1d973d8bbcb3be9c509e7e05", 4: 241, 6: "8596214", 7: "226292000/123528451/0", 8: "0/5/7" },
  140: { 1: "53143d0480b876d477021866b8723514", 2: "eedd55539626a07c5cbb74bf7eb8167f", 4: 289, 6: "795485116", 7: "855858000/490738366/0" },
  141: { 1: "b4055be98a15a56202de22295df4d2e9", 2: "dcad0ef980974a6685ce8dd36e209fec", 4: 220, 6: "286745802", 7: "855858000/596983554/0" },
  142: { 1: "53143d0480b876d477021866b8723514", 2: "818eee2de76c9d5517eae10e196f3400", 4: 289, 6: "795485116", 7: "855858000/490738366/0" },
  143: { 1: "b4055be98a15a56202de22295df4d2e9", 2: "c45299c2bc8ed91d6563f41d0278df51", 4: 220, 6: "286745802", 7: "855858000/596983554/0" },
  144: { 1: "645fab8baf8998233034107ff881893d", 2: "d6fd72937d7460ab07256982e2f39651", 4: 348, 6: "2476929393", 7: "1162434000/535428721/51096000" },
  145: { 1: "f5f2fb01f4d37eec694a6d1320446b3a", 2: "0f56bd3f4cb5a833809164fc405d7291", 4: 188, 6: "788159841", 7: "1162434000/731382761/0", 8: "0/3/7" },
  146: { 1: "645fab8baf8998233034107ff881893d", 2: "18f0a8f927ba5baba78b1ed0ae577727", 4: 348, 6: "2476929393", 7: "1162434000/535428721/51096000" },
  147: { 1: "f5f2fb01f4d37eec694a6d1320446b3a", 2: "c6bc3074a9ffb13df46e6f1801199a76", 4: 188, 6: "788159841", 7: "1162434000/731382761/0", 8: "0/3/7" },
  148: { 1: "a4f82d49be36f96f449339dfca2d87fe", 2: "209bef829e24cac1a84c749a1040cd38" },
  149: { 1: "51d7719cbc02a0bfb821224b104167a7", 2: "0d01e68ab6e740ffbe8474b986e9da44" },
  150: { 1: "5dbcdf15ae4ed0e877277cd835eee2e8", 2: "036f49a28b7208f7fc0e51cdc61eb7a5", 4: 301, 6: "60751135261", 7: "3788524500/2155480463/0" },
  151: { 1: "5efdb9902562d885dfdac079fe5e49fe", 2: "21d29091bff552cd72ecacdc5788d149", 4: 193, 6: "22117603614", 7: "3788524500/2403215202/0", 8: "0/2/7" },
  152: { 1: "5dbcdf15ae4ed0e877277cd835eee2e8", 2: "00d36faa2031736332826b9e26f6ff5c", 4: 301, 6: "60751135261", 7: "3788524500/2155480463/0" },
  153: { 1: "5efdb9902562d885dfdac079fe5e49fe", 2: "e8c00d74a3effb242161b2e6e38119c3", 4: 193, 6: "22117603614", 7: "3788524500/2403215202/0", 8: "0/2/7" },
  154: { 1: "9d34b32b3b09cc6df8bd6ff8f1ef6751", 2: "639df4cfb9fa1ed481c145abdf95489d" },
  155: { 1: "33322bf91d2a6f684d3ee06f08df3d24", 2: "1c1cce9334bed78387fed2236522e86b" },
  156: { 1: "9d34b32b3b09cc6df8bd6ff8f1ef6751", 2: "4f6dd162539b25da7a058964af2ca2f5" },
  157: { 1: "33322bf91d2a6f684d3ee06f08df3d24", 2: "f4b10a311f71d926b69f4c35020b5b85" },
  158: { 1: "ebfc45ec6b0ab4025d1de43fe6c13128", 2: "48d231df0416a97b40c6b8aca7251b73" },
  159: { 1: "4994dc0f889e7eb27d9e994197917959", 2: "85c8c3bba9f1f0e715d248ff1a83391b" },
  160: { 1: "9733867630ca6411cb6a7b1f9e76055b", 2: "83a3f85686247755d567f276bc7da6ef", 3: "attaquants", 4: 446, 5: "{\"quartz\":7914,\"scorie\":2638}", 7: "9516000/0/19317957", 8: "6/3/0" },
  161: { 1: "b6b68a6de41d631f8dbc596d32a9c491", 2: "33990ae5dfcf9dde16404260ea58f00a", 4: 441, 5: "{\"quartz\":4522,\"scorie\":1507}", 6: "53900", 7: "12444000/875472/7232633", 8: "4/2/0" },
  162: { 1: "9733867630ca6411cb6a7b1f9e76055b", 2: "9177f60c6888dc8a56dcbfd6d384c64c", 3: "attaquants", 4: 446, 5: "{\"quartz\":2638,\"scorie\":7914}", 7: "9516000/0/19317957", 8: "6/3/0" },
  163: { 1: "b6b68a6de41d631f8dbc596d32a9c491", 2: "40aac7c1ebe819a085e649edb3fbfb0c", 4: 441, 5: "{\"quartz\":1507,\"scorie\":4522}", 6: "53900", 7: "12444000/875472/7232633", 8: "4/2/0" },
  164: { 1: "bdca4d8f6cbd2ff45d5c11479794de22", 2: "3751721b00bee30851466ad5a1f0c33a", 3: "attaquants", 4: 446, 5: "{\"quartz\":29396,\"scorie\":9798}", 7: "10980000/0/17262058", 8: "7/5/2" },
  165: { 1: "063c2ddcec37f1ddb72456a90df0b934", 2: "f4da79c797cfe6fdac44110fc887c285", 4: 452, 5: "{\"quartz\":22047,\"scorie\":7349}", 6: "107829", 7: "15372000/724972/6185114", 8: "5/4/0" },
  166: { 1: "bdca4d8f6cbd2ff45d5c11479794de22", 2: "b54e4e3b9706bcb39fbb8271c6123945", 3: "attaquants", 4: 446, 5: "{\"quartz\":9798,\"scorie\":29396}", 7: "10980000/0/17262058", 8: "7/5/2" },
  167: { 1: "063c2ddcec37f1ddb72456a90df0b934", 2: "0e6f29c62d740fc7cf317cf5ab5d6a9f", 4: 452, 5: "{\"quartz\":7349,\"scorie\":22047}", 6: "107829", 7: "15372000/724972/6185114", 8: "5/4/0" },
  168: { 1: "4036dd9c3302b3078b753632dfabe559", 2: "91529d7c4a32d46efbf2990fb7dbf823", 3: "attaquants", 4: 446, 5: "{\"quartz\":6029,\"scorie\":7537}", 7: "13908000/0/18298569", 8: "7/6/1" },
  169: { 1: "f372626bd0ec448f6431bf2da56ccb68", 2: "bd5650703cd32a9fafb65b44fcfdb194", 4: 480, 5: "{\"quartz\":3014,\"scorie\":6783}", 6: "113691", 7: "17568000/1510634/6183826", 8: "5/4/0" },
  170: { 1: "ffdc668956999e0aecca3da56c3b8c30", 2: "d81b0d6aa43f77dc51a0ff97ffbe20c0", 4: 587, 5: "{\"quartz\":110928,\"scorie\":36976}", 6: "18749051", 7: "139147061/32031038/8254824", 8: "1/9/11" },
  171: { 1: "5effb215180682712de8a062b78f0def", 2: "645cb959a7d80a794ebe4d43b621ba08", 4: 333, 6: "10043841", 7: "152900000/56113665/0" },
  172: { 1: "ffdc668956999e0aecca3da56c3b8c30", 2: "eca6dedbb8cfa11626bd85e710431fbc", 4: 587, 5: "{\"quartz\":36976,\"scorie\":110928}", 6: "18749051", 7: "139147061/32031038/8254824", 8: "1/9/11" },
  173: { 1: "5effb215180682712de8a062b78f0def", 2: "f3f8b5bfc25a75a56f153accaf761783", 4: 333, 6: "10043841", 7: "152900000/56113665/0" },
  174: { 1: "de1b769d3071df9eaeb8d3978a029edd", 2: "5c8f227576960e1fae4844d898801dfb", 4: 253, 6: "16170487", 7: "211002000/90927171/0", 8: "0/7/14" },
  175: { 1: "a7a51c0d1b0a4776b89aa4e63bd425b2", 2: "971dfe6bb8316b60e34bdfc62a8fae92", 4: 276, 6: "9089071", 7: "211002000/117796965/0" },
  176: { 1: "de1b769d3071df9eaeb8d3978a029edd", 2: "acbf01efbb80f6d07afc2c83a907f466", 4: 253, 6: "16170487", 7: "211002000/90927171/0", 8: "0/7/14" },
  177: { 1: "a7a51c0d1b0a4776b89aa4e63bd425b2", 2: "79afa87f7affb3032315d5796e201085", 4: 276, 6: "9089071", 7: "211002000/117796965/0" },
  178: { 1: "269dd9d8ad4b7b2bc7d881f2b30bdce6", 2: "9e2e3ddf870b7b03f97ffba237dcdb35" },
  179: { 1: "98a4d6ba04fa252056ba2384d5429b38", 2: "568774deab480467060a9827ecdac94d" },
  180: { 1: "a522184ad3bc5fae59dda882e751cce5", 2: "cf8422ca859a2aa3c6ff174115c2f912", 4: 680, 5: "{\"quartz\":4217460,\"scorie\":1405820}", 6: "778404526", 7: "807795844/378514961/10876556", 8: "1/7/12" },
  181: { 1: "1fcc1d37b3d8c64b2fe6269290fdf04d", 2: "be51fa0e4271a97cff51fe4cc7003224", 4: 328, 6: "121443185", 7: "855858000/521907405/0", 8: "0/2/7" },
  182: { 1: "a522184ad3bc5fae59dda882e751cce5", 2: "613eb0b5333553ded5e92e44737bc4ad", 4: 680, 5: "{\"quartz\":1405820,\"scorie\":4217460}", 6: "778404526", 7: "807795844/378514961/10876556", 8: "1/7/12" },
  183: { 1: "1fcc1d37b3d8c64b2fe6269290fdf04d", 2: "7181ac87bd67e82ddeb4875b267b5497", 4: 328, 6: "121443185", 7: "855858000/521907405/0", 8: "0/2/7" },
  184: { 1: "922942d1025203f669ad0022312dc11c", 2: "9c50a4426b3886d1dddc982233ca8040" },
  185: { 1: "4e157d82b5fdc819a440c8c4abcc3db6", 2: "4f7ff27d930d6400f1a349defcb5b36d" },
  186: { 1: "922942d1025203f669ad0022312dc11c", 2: "7653319e18dc3b3d0f989d09efcb37b8" },
  187: { 1: "4e157d82b5fdc819a440c8c4abcc3db6", 2: "70e7e444fb574fa356e39bfcfa2ae358" },
  188: { 1: "41dd857a6ca7cce496fe005c9114d94f", 2: "4313599466794de1e479b7002dc6abae", 4: 574, 6: "2124969432", 7: "1251852000/589681510/51096000", 8: "0/11/13" },
  189: { 1: "694491674628a57f4423fd5adb337c12", 2: "eefc138514ddec7fd39412f82c42ad3f", 4: 387, 6: "1018495377", 7: "1251852000/771712112/0", 8: "0/4/7" },
  190: { 1: "59af9fd31c6a460013fd214cfa8e02ac", 2: "551fe015a4f815553a06cdd77ef2528e" },
  191: { 1: "a69de2ec0df871981ea4e8404536f80c", 2: "07eda85ea6abb59cf1e5f0aeeaf54011" },
  192: { 1: "59af9fd31c6a460013fd214cfa8e02ac", 2: "ee2c54207d85cefbb9843e0e59320b68" },
  193: { 1: "a69de2ec0df871981ea4e8404536f80c", 2: "a0cba9021adb66ca5d3a9ac8b858ea29" },
  194: { 1: "8b4f93fd6c921836564ca8ad9bd3d613", 2: "0239e6c3d00c5182399e194cfe8205fa" },
  195: { 1: "5439357b0620d538b724fbd34a866f1c", 2: "c384e054c6e471eb50e5a7cd6efda7c2" },
  196: { 1: "8b4f93fd6c921836564ca8ad9bd3d613", 2: "ef7cb189b765954781311908bd33b67e" },
  197: { 1: "5439357b0620d538b724fbd34a866f1c", 2: "bb28484b06db61c732fb4062bfd9c73f" },
  198: { 1: "296317cc3ccd267a5836ae0ab9e2fefe", 2: "9e310d2a77d263411454c87a038309f1" },
  199: { 1: "c6369ae5e099d95ead02625ccf811405", 2: "6f6c1c99de3e520498a06032ab6953d5" },
};
