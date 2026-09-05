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
