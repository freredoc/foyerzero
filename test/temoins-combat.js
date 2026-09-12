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
// ⚠⚠ LOT PAQUETS (09/09) : LA TABLE CI-DESSOUS EST RECAPTURÉE, ET C'EST LA SEULE
// FOIS OÙ CE FICHIER EN A EU LE DROIT. Le placement des sites change de modèle
// — plus de ligne/colonne, des paquets de 3–4 —, donc les deux cents montages
// ne sont plus les mêmes SITES, et aucune couche `COMBATS_DEPLACES_PAR_*` ne
// peut plus dire « ce champ a bougé, le reste tient » : les 1 600 champs
// bougent presque tous (1 267 mesurés). Le §7 du brief prescrit la seule
// procédure honnête, et elle est SUIVIE, dans l'ordre :
//   1. l'ANCIEN placement est copié dans `test/generateur-ancien.js` — jamais
//      dans `src/` —, sous le nom `genererSiteAncien` ;
//   2. les deux cents anciennes empreintes sont REJOUÉES sur le moteur
//      COURANT avec l'ancien placement, sous les quatre couches d'alors :
//      **0 écart, 1 331 champs surchargés, 269 gardés**, exactement le compte
//      d'avant le lot. C'est la preuve que le MOTEUR n'a pas bougé : seul le
//      placement a changé. `JOURNAL T1 bis` rejoue cette preuve à chaque
//      `npm test`, contre `TEMOINS_COMBAT_AVANT_PAQUETS` plus bas ;
//   3. ALORS SEULEMENT deux cents empreintes neuves sont capturées sur le
//      nouveau placement, et `JOURNAL T1` les compare — SANS couche : la
//      capture repart de zéro, et le prochain lot qui touchera au combat
//      devra à nouveau EMPILER, jamais recapturer.
// Colonnes : nom · sha(résultat) · sha(état) · cause · tick · butin · points ·
// PV restants bâtiments/défenses/attaquants · détruits bâtiments/défenses/attaquants
// ⚠⚠ LOT APPROCHE (11/09) : LA TABLE CI-DESSOUS EST RECAPTURÉE UNE SECONDE
// FOIS, ET C'EST LA SECONDE DE TOUTE L'HISTOIRE DU FICHIER. Les vagues naissent
// désormais en rangée 0 — la voie d'approche, sous la grille — au lieu du front
// de la bande de déploiement : **tout attaquant entre deux cases plus bas**,
// donc les deux cents combats changent. Mesuré contre la table du lot MUR,
// couche comprise : **1 132 champs sur 1 600 bougent, 468 tiennent**, et
// **aucun des deux cents combats n'est intact** — 199 ticks de fin sur 200
// diffèrent, 8 causes sur 200. Une sixième couche `COMBATS_DEPLACES_PAR_*`
// couvrirait 71 % de la table : il n'y aurait plus rien à adosser, exactement la
// situation du lot PAQUETS.
//
// ⚠⚠ ET LA PREUVE QUI L'AUTORISE EST JOUÉE À CHAQUE `npm test`, PAS UNE FOIS
// AVANT. Le §4.1 du brief exige de montrer, AVANT toute recapture, que le MOTEUR
// n'a pas bougé : on rejoue les empreintes EXISTANTES avec l'ancien point
// d'apparition ÉCRIT EXPLICITEMENT, et on attend 0 écart. C'est ce que
// `JOURNAL T1 bis` fait désormais en permanence — `montagesTemoins` prend une
// rangée, `DEPART_AVANT_APPROCHE` la lui donne, et les 1 331 surchargés / 269
// gardés de `TEMOINS_COMBAT_AVANT_PAQUETS` retombent au champ près. **Si ce test
// tombe un jour, c'est que le lot a changé autre chose que le point
// d'apparition**, et la recapture ci-dessous cesse d'être légitime.
//
// ⚠ LES SIX COUCHES `COMBATS_DEPLACES_PAR_*` ET `TEMOINS_COMBAT_AVANT_PAQUETS`
// NE SONT PAS TOUCHÉES : elles décrivent un passé qui n'a pas bougé, et c'est ce
// passé que `T1 bis` rejoue. Aucune septième couche n'est ajoutée.
//
// ⚠ ET LA CONSIGNE NE CHANGE PAS D'UN MOT : **le prochain lot qui touchera au
// combat devra EMPILER une couche, jamais recapturer.** Deux exceptions en
// quatre-vingts lots, chacune avec sa preuve écrite.
export const TEMOINS_COMBAT = [
  ["camp/richeQuartz/n5/g1/toutes","6c7f9d4ea792b1397b57222f63dc87ac","ac33ef01f3bd3f2c4e4141891db74fd3","souche",226,"{\"quartz\":10175,\"scorie\":3391}","75360","11336048/0/18606565","1/3/0"],
  ["camp/richeQuartz/n5/g1/moitie","ca036f841a272fc0bb51b89eb136d2ae","e76eeda979fd66fb4987a2cbd6ab4c92","attaquants",459,"{\"quartz\":189,\"scorie\":63}","75360","19259929/0/6502363","0/3/0"],
  ["camp/richeScorie/n5/g1/toutes","6c7f9d4ea792b1397b57222f63dc87ac","fe5106eb34c8c9cce704f02d26ab42d6","souche",226,"{\"quartz\":3391,\"scorie\":10175}","75360","11336048/0/18606565","1/3/0"],
  ["camp/richeScorie/n5/g1/moitie","ca036f841a272fc0bb51b89eb136d2ae","69e5ece691e4bbd403d06a05b7538b04","attaquants",459,"{\"quartz\":63,\"scorie\":189}","75360","19259929/0/6502363","0/3/0"],
  ["avantPoste/richeQuartz/n5/g1/toutes","244f4480f2420b21d42290a29aabce48","38b083cbc83e810d040c0be18efd47db","souche",317,"{\"quartz\":42256,\"scorie\":14085}","125600","10980000/0/16498179","5/5/2"],
  ["avantPoste/richeQuartz/n5/g1/moitie","e8bb34647def7dec378f23374e30e9a5","34ff9c91006ded569c566c77cb4736e5","attaquants",480,"{\"quartz\":20209,\"scorie\":6736}","112850","19032000/520151/5019722","4/4/1"],
  ["avantPoste/richeScorie/n5/g1/toutes","244f4480f2420b21d42290a29aabce48","6605d3db0f6ea91a0eefbe775a28ccd6","souche",317,"{\"quartz\":14085,\"scorie\":42256}","125600","10980000/0/16498179","5/5/2"],
  ["avantPoste/richeScorie/n5/g1/moitie","e8bb34647def7dec378f23374e30e9a5","34a6d5e916e18d18d69da1ed8d442bac","attaquants",480,"{\"quartz\":6736,\"scorie\":20209}","112850","19032000/520151/5019722","4/4/1"],
  ["base/-/n5/g1/toutes","75a6597bcb30c300ca5f05da92404c11","2f86bf0192bfa33739bfcde286dceac0","souche",319,"{\"quartz\":10552,\"scorie\":9044}","150720","10980000/0/16597734","6/6/1"],
  ["base/-/n5/g1/moitie","9676ffc0fd8f97e184338ba283b696fa","577cad261b2bfa8f92d03a3e34d54385","attaquants",559,"{\"quartz\":7537,\"scorie\":753}","134187","20496000/674481/4734484","4/5/0"],
  ["camp/richeQuartz/n20/g1/toutes","1617db38d0417116a58ee5f5e45af9c7","80d505e65ac68909da744c72dcef8696","attaquants",369,"{\"quartz\":2084,\"scorie\":694}","23140807","152534027/25490903/9785600","0/9/12"],
  ["camp/richeQuartz/n20/g1/moitie","57b09bd25eb2ee4658231bd6fd744780","dce8e5b2d6cb9f205e4dfc02d01df541","attaquants",357,"{\"quartz\":0,\"scorie\":0}","11498368","152900000/64109040/0","0/5/7"],
  ["camp/richeScorie/n20/g1/toutes","1617db38d0417116a58ee5f5e45af9c7","7d4247fc7935a6b0c0e92266b5fbdf2e","attaquants",369,"{\"quartz\":694,\"scorie\":2084}","23140807","152534027/25490903/9785600","0/9/12"],
  ["camp/richeScorie/n20/g1/moitie","57b09bd25eb2ee4658231bd6fd744780","0a59354991972d2845d161d629553a0f","attaquants",357,"{\"quartz\":0,\"scorie\":0}","11498368","152900000/64109040/0","0/5/7"],
  ["avantPoste/richeQuartz/n20/g1/toutes","97632ff0fd2016d43fdfd1c326f363c3","d8fa51f6172cd0eecf4dd0162bf9707b","duree",900,"{\"quartz\":395594,\"scorie\":131864}","34325460","191782626/75271075/5912248","1/13/12"],
  ["avantPoste/richeQuartz/n20/g1/moitie","5f422bf20a8e86494e3c6e6691a11eab","791d13d44f306a211170ce6c269c2b73","attaquants",250,"{\"quartz\":0,\"scorie\":0}","4586649","211002000/136270293/0","0/1/7"],
  ["avantPoste/richeScorie/n20/g1/toutes","97632ff0fd2016d43fdfd1c326f363c3","5b0a86f0e510c181e4dc2c73687cd40d","duree",900,"{\"quartz\":131864,\"scorie\":395594}","34325460","191782626/75271075/5912248","1/13/12"],
  ["avantPoste/richeScorie/n20/g1/moitie","5f422bf20a8e86494e3c6e6691a11eab","1f6095c4a1c1d001f0630f0561b485c5","attaquants",250,"{\"quartz\":0,\"scorie\":0}","4586649","211002000/136270293/0","0/1/7"],
  ["base/-/n20/g1/toutes","0b8887e92086cffc4513d361567f3db4","ba1549bb8437718feb414249671c0d03","attaquants",369,"{\"quartz\":0,\"scorie\":0}","21339434","226292000/112501819/12232000","0/8/13"],
  ["base/-/n20/g1/moitie","4f7f6b9dff624a2f9857af75c5beef67","09191bba72479af20b4bd352026e5e91","attaquants",252,"{\"quartz\":0,\"scorie\":0}","4749535","226292000/148091568/4281200","0/2/6"],
  ["camp/richeQuartz/n35/g1/toutes","4cec40b80dfe1ed42b43c4690482da43","6587c4959a59478ee4d17337b00ab104","attaquants",401,"{\"quartz\":353006,\"scorie\":117668}","1816503428","854070060/368209633/13051933","0/10/13"],
  ["camp/richeQuartz/n35/g1/moitie","ad30b1947b822757354d3f31be8f6450","a273a72b10c58788d1fda7be93570339","attaquants",305,"{\"quartz\":0,\"scorie\":0}","691447321","855858000/506677711/15824951","0/4/6"],
  ["camp/richeScorie/n35/g1/toutes","4cec40b80dfe1ed42b43c4690482da43","292a0b1b6d1c21f87c81a145bc646aa7","attaquants",401,"{\"quartz\":117668,\"scorie\":353006}","1816503428","854070060/368209633/13051933","0/10/13"],
  ["camp/richeScorie/n35/g1/moitie","ad30b1947b822757354d3f31be8f6450","8aaa649e6a44891044968cdd8055bb19","attaquants",305,"{\"quartz\":0,\"scorie\":0}","691447321","855858000/506677711/15824951","0/4/6"],
  ["avantPoste/richeQuartz/n35/g1/toutes","3d7db08f0465d2e798dcc9b34555f1a7","5af244ae4abe262d1d0aa1689a26bd4d","attaquants",294,"{\"quartz\":0,\"scorie\":0}","1283917166","1162434000/626563758/0","0/7/14"],
  ["avantPoste/richeQuartz/n35/g1/moitie","aa0563a97ce3fd6490fccd2ccf52cb80","a5f66dfada78e468838e8a348589aa7d","attaquants",196,"{\"quartz\":0,\"scorie\":0}","488328829","1162434000/715737637/0","0/4/7"],
  ["avantPoste/richeScorie/n35/g1/toutes","3d7db08f0465d2e798dcc9b34555f1a7","61323a3815e57b6bff61e86767d3eb4d","attaquants",294,"{\"quartz\":0,\"scorie\":0}","1283917166","1162434000/626563758/0","0/7/14"],
  ["avantPoste/richeScorie/n35/g1/moitie","aa0563a97ce3fd6490fccd2ccf52cb80","279f09435c4666501c637bd49ecd7dd0","attaquants",196,"{\"quartz\":0,\"scorie\":0}","488328829","1162434000/715737637/0","0/4/7"],
  ["base/-/n35/g1/toutes","991802afa94a4509614f1b44d117f6d8","9bd0ac4699ab5f23708fcc43d571c72f","attaquants",499,"{\"quartz\":0,\"scorie\":0}","835839929","1251852000/685822475/40876800","0/6/12"],
  ["base/-/n35/g1/moitie","bb7d56d65d5948577d78de26ec81ad8a","ca8fcf56eb4edc125ac31de08c906d7b","attaquants",374,"{\"quartz\":0,\"scorie\":0}","681790618","1251852000/727553918/0","0/4/7"],
  ["camp/richeQuartz/n50/g1/toutes","6428f99853cc43ed49bfc76464d56905","6ab9bc6e170546c1f58c2519fae844d8","attaquants",372,"{\"quartz\":0,\"scorie\":0}","110295891205","3788524500/1656220217/138734700","0/12/13"],
  ["camp/richeQuartz/n50/g1/moitie","978a53cba0fdcd1e2b5338b3030e4920","2a84f9a995eeeb16ab02b6764851dfe4","attaquants",222,"{\"quartz\":0,\"scorie\":0}","16745640353","3788524500/2455170814/0","0/4/7"],
  ["camp/richeScorie/n50/g1/toutes","6428f99853cc43ed49bfc76464d56905","c7aeb03f241726b16275ebe376918a35","attaquants",372,"{\"quartz\":0,\"scorie\":0}","110295891205","3788524500/1656220217/138734700","0/12/13"],
  ["camp/richeScorie/n50/g1/moitie","978a53cba0fdcd1e2b5338b3030e4920","12b205fedfe88647d02518e9bd858725","attaquants",222,"{\"quartz\":0,\"scorie\":0}","16745640353","3788524500/2455170814/0","0/4/7"],
  ["avantPoste/richeQuartz/n50/g1/toutes","7ad968002bf879bd38d087d88885459b","738711aa9b544f713aa6b307858fdff6","attaquants",448,"{\"quartz\":772703314,\"scorie\":257567771}","134391094176","4990994224/2616225240/0","0/14/14"],
  ["avantPoste/richeQuartz/n50/g1/moitie","2a1aa13e331e24c780e9ae17b200d70b","3ebdcb12e01c9bd321cc078a614e8a13","attaquants",217,"{\"quartz\":0,\"scorie\":0}","54825533237","5069152500/3443230181/0","0/6/7"],
  ["avantPoste/richeScorie/n50/g1/toutes","7ad968002bf879bd38d087d88885459b","0c770397f3997f17aebbb4edffe5c4d0","attaquants",448,"{\"quartz\":257567771,\"scorie\":772703314}","134391094176","4990994224/2616225240/0","0/14/14"],
  ["avantPoste/richeScorie/n50/g1/moitie","2a1aa13e331e24c780e9ae17b200d70b","e5c20d65343d8ff0993df8bffa9d2b87","attaquants",217,"{\"quartz\":0,\"scorie\":0}","54825533237","5069152500/3443230181/0","0/6/7"],
  ["base/-/n50/g1/toutes","7f8f251a8213def00565e39749f8b2d7","95c1cf506470f8096291fb1906de9b0f","attaquants",355,"{\"quartz\":0,\"scorie\":0}","82263299759","5602747500/4317752160/0","0/3/14"],
  ["base/-/n50/g1/moitie","e1730e9472bea9565d1b01e5f118cfef","dca56acb1f0ec7ff68a9cba0c42b53cc","attaquants",197,"{\"quartz\":0,\"scorie\":0}","9030613493","5602747500/4812911896/0","0/0/7"],
  ["camp/richeQuartz/n5/g2/toutes","a785c421d7bca197c6bcdd8b67a2f491","4c4255a34dcb56a0a0e241cdc9d3ee65","souche",232,"{\"quartz\":10175,\"scorie\":3391}","75360","13384476/0/18068555","1/3/0"],
  ["camp/richeQuartz/n5/g2/moitie","169e088dce70501e014b358762a41751","c443459b4851148bc2e868549a4763f1","attaquants",484,"{\"quartz\":257,\"scorie\":85}","67068","18293238/338266/6570628","0/2/0"],
  ["camp/richeScorie/n5/g2/toutes","a785c421d7bca197c6bcdd8b67a2f491","e93b12026fa8da493b958ee03c4c59bb","souche",232,"{\"quartz\":3391,\"scorie\":10175}","75360","13384476/0/18068555","1/3/0"],
  ["camp/richeScorie/n5/g2/moitie","169e088dce70501e014b358762a41751","a23a97e6c5e81b201e77322e0f606605","attaquants",484,"{\"quartz\":85,\"scorie\":257}","67068","18293238/338266/6570628","0/2/0"],
  ["avantPoste/richeQuartz/n5/g2/toutes","54c5a5b53d554d5d6bf79f801e4ab373","f81c9e5c13e85fa73a55e5eeba18b359","souche",389,"{\"quartz\":42256,\"scorie\":14085}","125600","5124000/0/19218119","8/5/0"],
  ["avantPoste/richeQuartz/n5/g2/moitie","dbd2fb92f9318dc77f88b1bf2c0c2dee","264d46920ce476a9f0af9d27917fcdf2","attaquants",459,"{\"quartz\":25721,\"scorie\":8573}","78374","17568000/1926640/4970691","5/3/1"],
  ["avantPoste/richeScorie/n5/g2/toutes","54c5a5b53d554d5d6bf79f801e4ab373","a52f5a11391bb7ec7b2769701274e181","souche",389,"{\"quartz\":14085,\"scorie\":42256}","125600","5124000/0/19218119","8/5/0"],
  ["avantPoste/richeScorie/n5/g2/moitie","dbd2fb92f9318dc77f88b1bf2c0c2dee","4b56bf8b235f32848839608052b21b30","attaquants",459,"{\"quartz\":8573,\"scorie\":25721}","78374","17568000/1926640/4970691","5/3/1"],
  ["base/-/n5/g2/toutes","44fe5c66040c13b71e7b312258e0edfe","4e5378fe0335f0faa48279bd779cfaa5","souche",296,"{\"quartz\":10552,\"scorie\":9044}","150720","8498454/0/14931514","5/6/2"],
  ["base/-/n5/g2/moitie","34bd0e7ae2710c60b8074a1bec64c3be","744f57e68c38e33daabdf9bcf2a6a8b9","attaquants",410,"{\"quartz\":4420,\"scorie\":2261}","130543","18195326/823129/2066689","2/5/4"],
  ["camp/richeQuartz/n20/g2/toutes","df5629176ae4fd6d61f829f3694f3b23","0537eb11c6fa697d73daad5965f82167","attaquants",511,"{\"quartz\":62310,\"scorie\":20770}","27873165","137837993/27923309/27353493","1/11/8"],
  ["camp/richeQuartz/n20/g2/moitie","bd1c4b28583fa8f2ce47ccd1049c8905","066119a90ee90ebacd959518fe569a25","attaquants",493,"{\"quartz\":506,\"scorie\":168}","15370720","152603685/62572938/6926623","0/5/5"],
  ["camp/richeScorie/n20/g2/toutes","df5629176ae4fd6d61f829f3694f3b23","6c8b17730bef5111d1e02e1672b79b20","attaquants",511,"{\"quartz\":20770,\"scorie\":62310}","27873165","137837993/27923309/27353493","1/11/8"],
  ["camp/richeScorie/n20/g2/moitie","bd1c4b28583fa8f2ce47ccd1049c8905","04f51f1e18781f89544e1d268baceba1","attaquants",493,"{\"quartz\":168,\"scorie\":506}","15370720","152603685/62572938/6926623","0/5/5"],
  ["avantPoste/richeQuartz/n20/g2/toutes","e7692e15752d1f21c711d15c71defd3e","e99612b5e417c72a8c4421d720e07277","attaquants",345,"{\"quartz\":0,\"scorie\":0}","27907750","211002000/53755676/5504400","0/13/13"],
  ["avantPoste/richeQuartz/n20/g2/moitie","43f47948f287914dac1aa508b6b70b77","af875323067122fbd9b70caf8e5fd43d","attaquants",253,"{\"quartz\":0,\"scorie\":0}","6911051","211002000/114768988/0","0/4/7"],
  ["avantPoste/richeScorie/n20/g2/toutes","e7692e15752d1f21c711d15c71defd3e","0e3ee28f9084f2c73a4123efcd1d0d1b","attaquants",345,"{\"quartz\":0,\"scorie\":0}","27907750","211002000/53755676/5504400","0/13/13"],
  ["avantPoste/richeScorie/n20/g2/moitie","43f47948f287914dac1aa508b6b70b77","1ca15159318d621ea8bfb5d573c6911f","attaquants",253,"{\"quartz\":0,\"scorie\":0}","6911051","211002000/114768988/0","0/4/7"],
  ["base/-/n20/g2/toutes","b8cee74b49c11d133a2d4e87a2bd1fd8","5e3d499129c681bf51247492e54499ec","attaquants",256,"{\"quartz\":0,\"scorie\":0}","17474416","226292000/115811636/11620400","0/4/12"],
  ["base/-/n20/g2/moitie","79cb62260348839c55b7dd2d93608da3","6f73a893d317b97e511bd0e85aaeae32","attaquants",295,"{\"quartz\":0,\"scorie\":0}","12279589","226292000/129327236/0","0/3/7"],
  ["camp/richeQuartz/n35/g2/toutes","2108a2f50a386987b39e11fcc3dec354","ca96bca0d5bc3a2be52d3ab5d9d0f84c","attaquants",406,"{\"quartz\":0,\"scorie\":0}","2418177632","855858000/203413966/0","0/14/14"],
  ["camp/richeQuartz/n35/g2/moitie","29b06c401a668c60f5d69e2c4a5607ec","bf5f63d571714bdcd63c5c12c8e0a635","attaquants",327,"{\"quartz\":0,\"scorie\":0}","1064514376","855858000/427884855/0","0/6/7"],
  ["camp/richeScorie/n35/g2/toutes","2108a2f50a386987b39e11fcc3dec354","b967a1c1c8b561b6396b488f445d185c","attaquants",406,"{\"quartz\":0,\"scorie\":0}","2418177632","855858000/203413966/0","0/14/14"],
  ["camp/richeScorie/n35/g2/moitie","29b06c401a668c60f5d69e2c4a5607ec","07065107c57caed26d695c941ffc4334","attaquants",327,"{\"quartz\":0,\"scorie\":0}","1064514376","855858000/427884855/0","0/6/7"],
  ["avantPoste/richeQuartz/n35/g2/toutes","6ac225a3ae75b282d2a549eca6985c16","a9739d6570300e113a3b3b1a9f4cbbbc","attaquants",387,"{\"quartz\":0,\"scorie\":0}","1510493048","1162434000/688088205/0","0/6/14"],
  ["avantPoste/richeQuartz/n35/g2/moitie","86d1df9a199e51b4929e68589da10293","8c4c28c305d9d7adba5acdb0e400209f","attaquants",294,"{\"quartz\":0,\"scorie\":0}","891445073","1162434000/770875181/0","0/4/7"],
  ["avantPoste/richeScorie/n35/g2/toutes","6ac225a3ae75b282d2a549eca6985c16","f6b98c0e92b180bae2651744e8b36433","attaquants",387,"{\"quartz\":0,\"scorie\":0}","1510493048","1162434000/688088205/0","0/6/14"],
  ["avantPoste/richeScorie/n35/g2/moitie","86d1df9a199e51b4929e68589da10293","7d395512d4ea2b428ddbde7b16632131","attaquants",294,"{\"quartz\":0,\"scorie\":0}","891445073","1162434000/770875181/0","0/4/7"],
  ["base/-/n35/g2/toutes","95a167e7d714c4c539fa8b7810a3993d","0abda11e005ee7af26e86d5e1b8743cc","attaquants",255,"{\"quartz\":0,\"scorie\":0}","1229275452","1251852000/636148683/22993200","0/9/13"],
  ["base/-/n35/g2/moitie","ccd5c2d1a35b388ec9be677177c0b003","d9e91d69c06a7b63062bc94fc6835dbd","attaquants",324,"{\"quartz\":0,\"scorie\":0}","951552500","1251852000/704577627/0","0/7/7"],
  ["camp/richeQuartz/n50/g2/toutes","75b11954d3c4aa10f83785113da09ef5","7291c6d410f08cbb63f992aa9f6418e1","attaquants",277,"{\"quartz\":0,\"scorie\":0}","69790451335","3788524500/2357243260/0","0/3/14"],
  ["camp/richeQuartz/n50/g2/moitie","2f82d7f3c8eda6d641b47fead5197155","63d6a035c5f443ff919df87d66a51cf7","attaquants",186,"{\"quartz\":0,\"scorie\":0}","14619558492","3788524500/2702678440/0","0/0/7"],
  ["camp/richeScorie/n50/g2/toutes","75b11954d3c4aa10f83785113da09ef5","1d824ce4baeb961ca8866de45d0436c6","attaquants",277,"{\"quartz\":0,\"scorie\":0}","69790451335","3788524500/2357243260/0","0/3/14"],
  ["camp/richeScorie/n50/g2/moitie","2f82d7f3c8eda6d641b47fead5197155","2f33d23639a08b545ef2e497ea103533","attaquants",186,"{\"quartz\":0,\"scorie\":0}","14619558492","3788524500/2702678440/0","0/0/7"],
  ["avantPoste/richeQuartz/n50/g2/toutes","6d19e91312d85a547864e90b3a1ba1ec","dbbd89298a670c90de965a4215c1f4dc","attaquants",208,"{\"quartz\":0,\"scorie\":0}","35652242297","5069152500/3531324402/0","0/1/14"],
  ["avantPoste/richeQuartz/n50/g2/moitie","f6e61cdd4bfeda9d35942c2e187baddd","1beb8dac45d39b523d2a953dc52e67d5","attaquants",281,"{\"quartz\":0,\"scorie\":0}","45785981797","5069152500/3487536682/0","0/1/7"],
  ["avantPoste/richeScorie/n50/g2/toutes","6d19e91312d85a547864e90b3a1ba1ec","ffc5b7c68c7f6adba16cf4762501e9c4","attaquants",208,"{\"quartz\":0,\"scorie\":0}","35652242297","5069152500/3531324402/0","0/1/14"],
  ["avantPoste/richeScorie/n50/g2/moitie","f6e61cdd4bfeda9d35942c2e187baddd","b32cc8004e6c25200b885552d132ffa2","attaquants",281,"{\"quartz\":0,\"scorie\":0}","45785981797","5069152500/3487536682/0","0/1/7"],
  ["base/-/n50/g2/toutes","37e814e2989dc2e32c49406b79873df0","c2fae906cfd8125688cbfb00d82ed9f5","attaquants",210,"{\"quartz\":0,\"scorie\":0}","52032171815","5602747500/3905354827/0","0/5/14"],
  ["base/-/n50/g2/moitie","b035c3e8789ef1d0f88fdba0482d4989","f1a740db3be2a86603e0bb0598cb31b8","attaquants",190,"{\"quartz\":0,\"scorie\":0}","27122466541","5602747500/4142852611/0","0/2/7"],
  ["camp/richeQuartz/n5/g3/toutes","d68981a43e90dfd72e81ed366bad9dff","adf08cf695eff08a411b32ca42aeb0f9","souche",179,"{\"quartz\":10175,\"scorie\":3391}","75360","8784000/0/19394963","4/3/0"],
  ["camp/richeQuartz/n5/g3/moitie","620b434a158cae8b83d1f0747c19f0d3","866961a6ef23b0ee94409b9ac81d9bb2","souche",221,"{\"quartz\":10175,\"scorie\":3391}","54020","7800212/870553/5576207","3/2/1"],
  ["camp/richeScorie/n5/g3/toutes","d68981a43e90dfd72e81ed366bad9dff","18b3b946a9fe16724e47a1d98cfb3e6f","souche",179,"{\"quartz\":3391,\"scorie\":10175}","75360","8784000/0/19394963","4/3/0"],
  ["camp/richeScorie/n5/g3/moitie","620b434a158cae8b83d1f0747c19f0d3","c2207ce24ce4ce9c4d5c3385757ae02f","souche",221,"{\"quartz\":3391,\"scorie\":10175}","54020","7800212/870553/5576207","3/2/1"],
  ["avantPoste/richeQuartz/n5/g3/toutes","f32aa53153485f68f734b6b32040ff63","b7da8f6053d0440b299a261ab83d84b6","attaquants",490,"{\"quartz\":34907,\"scorie\":11635}","125600","13908000/0/17080708","7/5/1"],
  ["avantPoste/richeQuartz/n5/g3/moitie","f42cdb1b1b1fb39b997a280a1d8b99a1","cfa542d93025312a2ef73ba7abc32a76","attaquants",435,"{\"quartz\":27061,\"scorie\":9020}","104041","16369245/879518/4017381","4/4/2"],
  ["avantPoste/richeScorie/n5/g3/toutes","f32aa53153485f68f734b6b32040ff63","d1f4b5d1425f69f186c60216c3f6591e","attaquants",490,"{\"quartz\":11635,\"scorie\":34907}","125600","13908000/0/17080708","7/5/1"],
  ["avantPoste/richeScorie/n5/g3/moitie","f42cdb1b1b1fb39b997a280a1d8b99a1","3eae18f43675d1afc40610e34bacb2a3","attaquants",435,"{\"quartz\":9020,\"scorie\":27061}","104041","16369245/879518/4017381","4/4/2"],
  ["base/-/n5/g3/toutes","a1d79d2867dc92a8d25ead741cd63123","357cf498a98a4be4d182dd46604b68ba","attaquants",506,"{\"quartz\":8291,\"scorie\":8291}","150720","13908000/0/17019579","8/6/1"],
  ["base/-/n5/g3/moitie","b0cb48a8700342e2def45c2bf43a652c","ced476db2c6c14b9175ca214a2e69c7a","attaquants",519,"{\"quartz\":5802,\"scorie\":8063}","150720","16035764/0/4544888","6/6/1"],
  ["camp/richeQuartz/n20/g3/toutes","4e6d8b3ee751a0296baf43da3bfd71c7","cf46f0b4ffc25d0bfdf5f2e5c019eddc","souche",565,"{\"quartz\":992751,\"scorie\":330917}","20979804","118472634/51164167/15762266","1/7/10"],
  ["camp/richeQuartz/n20/g3/moitie","28370f93c44236e4b7a922f779e195ab","d5bb77039b843e356fe58099add52ecd","attaquants",453,"{\"quartz\":2024,\"scorie\":674}","14101429","152450259/69279652/4968677","0/5/5"],
  ["camp/richeScorie/n20/g3/toutes","4e6d8b3ee751a0296baf43da3bfd71c7","350290a5003e90acb5a8fb5ddbc0a8f0","souche",565,"{\"quartz\":330917,\"scorie\":992751}","20979804","118472634/51164167/15762266","1/7/10"],
  ["camp/richeScorie/n20/g3/moitie","28370f93c44236e4b7a922f779e195ab","673cd2760c0fe34f26cf17f4987d0d5c","attaquants",453,"{\"quartz\":674,\"scorie\":2024}","14101429","152450259/69279652/4968677","0/5/5"],
  ["avantPoste/richeQuartz/n20/g3/toutes","b7ae37e12a89ad98de0cfc9ca2f56437","8443d45d73ec676966f33ee0c331972a","attaquants",315,"{\"quartz\":0,\"scorie\":0}","21076868","211002000/106592636/6116000","0/8/13"],
  ["avantPoste/richeQuartz/n20/g3/moitie","2ec7226a8496845d4491cae4e553ed64","c8c929262bc6c31a33b9fd4f92fd9e71","attaquants",231,"{\"quartz\":0,\"scorie\":0}","7350824","211002000/140548291/0","0/1/7"],
  ["avantPoste/richeScorie/n20/g3/toutes","b7ae37e12a89ad98de0cfc9ca2f56437","a1d2c02efd7c22c1acf99f517b2bc863","attaquants",315,"{\"quartz\":0,\"scorie\":0}","21076868","211002000/106592636/6116000","0/8/13"],
  ["avantPoste/richeScorie/n20/g3/moitie","2ec7226a8496845d4491cae4e553ed64","cb99ccd105fd1101dec248121de857e7","attaquants",231,"{\"quartz\":0,\"scorie\":0}","7350824","211002000/140548291/0","0/1/7"],
  ["base/-/n20/g3/toutes","6dbf1c54ae0066a358fee5364d068adc","715df7f211580957e9b6a5a70804dc11","attaquants",289,"{\"quartz\":0,\"scorie\":0}","22510260","226292000/107749814/5504400","0/7/13"],
  ["base/-/n20/g3/moitie","6dffc0da7f4797b714bd65959494eba4","64dcaac5765f7d770eb3fe6ea9df5922","attaquants",321,"{\"quartz\":0,\"scorie\":0}","12989047","226292000/126230588/0","0/5/7"],
  ["camp/richeQuartz/n35/g3/toutes","d5189785e71747d92765345e23852361","6de0941527e3c2e7f02beba0c07f4755","attaquants",414,"{\"quartz\":0,\"scorie\":0}","2277685366","855858000/403422640/76644000","0/7/12"],
  ["camp/richeQuartz/n35/g3/moitie","310114dea9b83b3d3c676c5ac3169374","3374d2724795457921b2e1fba76b59e4","attaquants",233,"{\"quartz\":0,\"scorie\":0}","427701683","855858000/623257899/0","0/1/7"],
  ["camp/richeScorie/n35/g3/toutes","d5189785e71747d92765345e23852361","434ba18290e79587c7b48798166596b7","attaquants",414,"{\"quartz\":0,\"scorie\":0}","2277685366","855858000/403422640/76644000","0/7/12"],
  ["camp/richeScorie/n35/g3/moitie","310114dea9b83b3d3c676c5ac3169374","7f1ffc110d6dde33b4610a8f068084ad","attaquants",233,"{\"quartz\":0,\"scorie\":0}","427701683","855858000/623257899/0","0/1/7"],
  ["avantPoste/richeQuartz/n35/g3/toutes","9798555c62366a1bef0c72d6462d9046","35450ee57c750fa52fb1dbcc7c01e4a6","attaquants",282,"{\"quartz\":0,\"scorie\":0}","845189619","1162434000/755169079/0","0/7/14"],
  ["avantPoste/richeQuartz/n35/g3/moitie","907faa6eb1a175e477ac872d50e1e2e7","5ca9ecfa5fec4af4edcf0e5e71a5ab93","attaquants",266,"{\"quartz\":0,\"scorie\":0}","489085071","1162434000/842042710/0","0/4/7"],
  ["avantPoste/richeScorie/n35/g3/toutes","9798555c62366a1bef0c72d6462d9046","6cd25d9c7e6ff68d3c1cbffb33e2abc0","attaquants",282,"{\"quartz\":0,\"scorie\":0}","845189619","1162434000/755169079/0","0/7/14"],
  ["avantPoste/richeScorie/n35/g3/moitie","907faa6eb1a175e477ac872d50e1e2e7","2427d7bc8e4d149404bf5c59bead62c5","attaquants",266,"{\"quartz\":0,\"scorie\":0}","489085071","1162434000/842042710/0","0/4/7"],
  ["base/-/n35/g3/toutes","0ace715c3e94bc40c8a97bffd0898093","61523e084a5fe92f0d7d1653e2e65c17","attaquants",282,"{\"quartz\":0,\"scorie\":0}","1587539491","1251852000/859170392/51096000","0/5/13"],
  ["base/-/n35/g3/moitie","1348e4859a10044c3bf0bf92ff008b13","cd0d9ea027a650834d9b51cf4d3aace8","attaquants",201,"{\"quartz\":0,\"scorie\":0}","342567815","1251852000/1012337908/0","0/1/7"],
  ["camp/richeQuartz/n50/g3/toutes","0983a87cd8eb3182feb430721cba5312","97a0b987f5337cfa4b20e8ca727c088e","attaquants",317,"{\"quartz\":0,\"scorie\":0}","122083420684","3788524500/1889939613/210463322","0/7/13"],
  ["camp/richeQuartz/n50/g3/moitie","a6233bdf35c33eef1ba1c45b0b2b06a3","80b7b5db0711bd599941713010c8fafd","attaquants",194,"{\"quartz\":0,\"scorie\":0}","15911917096","3788524500/2633679278/0","0/1/7"],
  ["camp/richeScorie/n50/g3/toutes","0983a87cd8eb3182feb430721cba5312","b11dde840a0f21ae0418182005542db2","attaquants",317,"{\"quartz\":0,\"scorie\":0}","122083420684","3788524500/1889939613/210463322","0/7/13"],
  ["camp/richeScorie/n50/g3/moitie","a6233bdf35c33eef1ba1c45b0b2b06a3","b648f9fd593427d7da4b5369dfb27633","attaquants",194,"{\"quartz\":0,\"scorie\":0}","15911917096","3788524500/2633679278/0","0/1/7"],
  ["avantPoste/richeQuartz/n50/g3/toutes","e0981248c0b176b63a0a6e3948e12fb8","89bc9965325bbdce19dde79f2f81d5ae","attaquants",441,"{\"quartz\":0,\"scorie\":0}","101798127305","5069152500/3279640339/0","0/4/14"],
  ["avantPoste/richeQuartz/n50/g3/moitie","9120a9e83de3ce0e5de22c9c45ef4e9a","6913edfbd3de349199f8a549ccc392c0","attaquants",207,"{\"quartz\":0,\"scorie\":0}","12373056021","5069152500/3766031986/0","0/1/7"],
  ["avantPoste/richeScorie/n50/g3/toutes","e0981248c0b176b63a0a6e3948e12fb8","0eb766a1ee927c650da207d3759fc357","attaquants",441,"{\"quartz\":0,\"scorie\":0}","101798127305","5069152500/3279640339/0","0/4/14"],
  ["avantPoste/richeScorie/n50/g3/moitie","9120a9e83de3ce0e5de22c9c45ef4e9a","5f8b474441fa30fe9ce6ecc7a9134a20","attaquants",207,"{\"quartz\":0,\"scorie\":0}","12373056021","5069152500/3766031986/0","0/1/7"],
  ["base/-/n50/g3/toutes","cdb8526b7c45d27286b09ea9e41f0039","0214bb0f0f2077c55400cc4d705b25ca","attaquants",250,"{\"quartz\":0,\"scorie\":0}","57278347052","5602747500/3374257382/0","0/5/14"],
  ["base/-/n50/g3/moitie","1b66d329e942076c8960edc41f22d80d","5148a1bb2d23500ba3d2fb7508c7461f","attaquants",241,"{\"quartz\":0,\"scorie\":0}","51488421700","5602747500/3625079811/0","0/3/7"],
  ["camp/richeQuartz/n5/g4/toutes","6dbda6aeb0a0cb912d77e6e6dfe63d37","5fcb0ada6dd0276d940af9774e606123","souche",210,"{\"quartz\":10175,\"scorie\":3391}","75360","8762481/0/17485781","3/3/1"],
  ["camp/richeQuartz/n5/g4/moitie","a1a8806c0473b9d1018c4ee48f8a0548","32183f6b0d0c01343af047226886078c","attaquants",481,"{\"quartz\":4949,\"scorie\":1649}","75360","13067744/0/6618738","2/3/0"],
  ["camp/richeScorie/n5/g4/toutes","6dbda6aeb0a0cb912d77e6e6dfe63d37","cb85663b61f7cc7a9dd89c4a1e80d588","souche",210,"{\"quartz\":3391,\"scorie\":10175}","75360","8762481/0/17485781","3/3/1"],
  ["camp/richeScorie/n5/g4/moitie","a1a8806c0473b9d1018c4ee48f8a0548","5cffa7512ea9fc1bf3f6162c5de55fa4","attaquants",481,"{\"quartz\":1649,\"scorie\":4949}","75360","13067744/0/6618738","2/3/0"],
  ["avantPoste/richeQuartz/n5/g4/toutes","d7b8cde08484eec46ccda375671529c0","5b3f237a076c5e8049f3f4a880f22740","souche",365,"{\"quartz\":42256,\"scorie\":14085}","125600","6588000/0/18159357","6/5/0"],
  ["avantPoste/richeQuartz/n5/g4/moitie","d3028b3b7eadaf40fed818cad238315c","ebbfa9acc8579cc3705dffe511e1e7b9","souche",305,"{\"quartz\":42256,\"scorie\":14085}","54400","15372000/2904646/4543417","2/2/2"],
  ["avantPoste/richeScorie/n5/g4/toutes","d7b8cde08484eec46ccda375671529c0","9f016da794cf4430e6f49837722056ae","souche",365,"{\"quartz\":14085,\"scorie\":42256}","125600","6588000/0/18159357","6/5/0"],
  ["avantPoste/richeScorie/n5/g4/moitie","d3028b3b7eadaf40fed818cad238315c","40a909033c537b8a925470952813013c","souche",305,"{\"quartz\":14085,\"scorie\":42256}","54400","15372000/2904646/4543417","2/2/2"],
  ["base/-/n5/g4/toutes","1fb6f0802fa501fff7d5b320fd97c935","0c48c73547affbf563e5f5c256803e83","souche",394,"{\"quartz\":10552,\"scorie\":9044}","150720","5124000/0/16107535","8/6/2"],
  ["base/-/n5/g4/moitie","0677cb0664871dc24a8e8bf1a7136a68","7c9a5d129be0b431680d6c5d3c9d45d9","attaquants",581,"{\"quartz\":3912,\"scorie\":5276}","104742","15300208/1875711/4178037","5/4/2"],
  ["camp/richeQuartz/n20/g4/toutes","05dab0183872335e3dcdc963ff880279","b2c3a280011895ef8197767bcd589a59","attaquants",348,"{\"quartz\":0,\"scorie\":0}","21965694","152900000/46655652/12232000","0/7/13"],
  ["camp/richeQuartz/n20/g4/moitie","71b450051100d8d58044f4e85e2e2646","d51d7fae69cbc46f9f783b0db3dd82a8","attaquants",372,"{\"quartz\":0,\"scorie\":0}","14642343","152900000/62055702/0","0/5/7"],
  ["camp/richeScorie/n20/g4/toutes","05dab0183872335e3dcdc963ff880279","b69c7430c6474f818ab4229a32eeb209","attaquants",348,"{\"quartz\":0,\"scorie\":0}","21965694","152900000/46655652/12232000","0/7/13"],
  ["camp/richeScorie/n20/g4/moitie","71b450051100d8d58044f4e85e2e2646","1536b6c4042bafdafbdfd91ab9099a34","attaquants",372,"{\"quartz\":0,\"scorie\":0}","14642343","152900000/62055702/0","0/5/7"],
  ["avantPoste/richeQuartz/n20/g4/toutes","4550cbe742d601e779499ee8c8a629ee","a6dc86d2775d8f33aa27a2f32aa5b124","attaquants",498,"{\"quartz\":0,\"scorie\":0}","27144025","211002000/53861015/0","0/13/14"],
  ["avantPoste/richeQuartz/n20/g4/moitie","41f000990e1af093db4a76d39ada1cc0","d83f8131fd9f1f96057a34930a27c89e","attaquants",318,"{\"quartz\":0,\"scorie\":0}","9145938","211002000/107132236/0","0/3/7"],
  ["avantPoste/richeScorie/n20/g4/toutes","4550cbe742d601e779499ee8c8a629ee","f39efe7de34dd8055f9a2ed11a712f8c","attaquants",498,"{\"quartz\":0,\"scorie\":0}","27144025","211002000/53861015/0","0/13/14"],
  ["avantPoste/richeScorie/n20/g4/moitie","41f000990e1af093db4a76d39ada1cc0","702743d300dd6b1ffac0e5b0698c4a25","attaquants",318,"{\"quartz\":0,\"scorie\":0}","9145938","211002000/107132236/0","0/3/7"],
  ["base/-/n20/g4/toutes","6b3f5b629150a20df54cd1ea9dc93811","3091ce9b2fdef4e30aca354b7c22979f","attaquants",333,"{\"quartz\":0,\"scorie\":0}","26918877","226292000/99225464/6116000","0/10/13"],
  ["base/-/n20/g4/moitie","618040404c978276bc40375c24b5512c","e6ed049ae46ee13065b8df99314fda22","attaquants",320,"{\"quartz\":0,\"scorie\":0}","9709415","226292000/137075494/0","0/2/7"],
  ["camp/richeQuartz/n35/g4/toutes","207971d357be1423ebacecf07d5fc2db","e5732883f00fd14add50d71de4519a56","attaquants",263,"{\"quartz\":0,\"scorie\":0}","1031139515","855858000/368640689/0","0/7/14"],
  ["camp/richeQuartz/n35/g4/moitie","4d1ed4acc2d387c9c52d9151a391923c","170bb593fa2be5c8586ccc7b052d6218","attaquants",235,"{\"quartz\":0,\"scorie\":0}","482992627","855858000/502320098/0","0/1/7"],
  ["camp/richeScorie/n35/g4/toutes","207971d357be1423ebacecf07d5fc2db","7ea40ac992236cc4054f304b843fb1b0","attaquants",263,"{\"quartz\":0,\"scorie\":0}","1031139515","855858000/368640689/0","0/7/14"],
  ["camp/richeScorie/n35/g4/moitie","4d1ed4acc2d387c9c52d9151a391923c","1f2f7378898424d0caed14bff2b432c9","attaquants",235,"{\"quartz\":0,\"scorie\":0}","482992627","855858000/502320098/0","0/1/7"],
  ["avantPoste/richeQuartz/n35/g4/toutes","91d26a120452bb1bd4714a91d49fdeb2","296227429b4c700262fa9a2960e7412a","attaquants",242,"{\"quartz\":0,\"scorie\":0}","582326289","1162434000/679110880/0","0/7/14"],
  ["avantPoste/richeQuartz/n35/g4/moitie","d63695c08ea638f96e047890a529d566","be1bb9d523476f3efa6a3642c3d740bc","attaquants",217,"{\"quartz\":0,\"scorie\":0}","364041172","1162434000/768553599/0","0/3/7"],
  ["avantPoste/richeScorie/n35/g4/toutes","91d26a120452bb1bd4714a91d49fdeb2","625770cb4b5de9bdd6022bdbcbe4d454","attaquants",242,"{\"quartz\":0,\"scorie\":0}","582326289","1162434000/679110880/0","0/7/14"],
  ["avantPoste/richeScorie/n35/g4/moitie","d63695c08ea638f96e047890a529d566","ea23a463a1d4059f70951bf549704835","attaquants",217,"{\"quartz\":0,\"scorie\":0}","364041172","1162434000/768553599/0","0/3/7"],
  ["base/-/n35/g4/toutes","9413db4eb100a045fa68dbdd93ee0dcf","de289b40366d6a652b9fd768e8b7e0c6","attaquants",329,"{\"quartz\":0,\"scorie\":0}","1404560005","1251852000/683851356/0","0/6/14"],
  ["base/-/n35/g4/moitie","8442665a4caeb23cd986fb42351c3bc6","4771abdd557b023ce026d0299b33e7ab","attaquants",231,"{\"quartz\":0,\"scorie\":0}","405199168","1251852000/873445253/0","0/2/7"],
  ["camp/richeQuartz/n50/g4/toutes","73d8b5966e1ad75a7461c565e3dd8303","328ac39ed3bab3894f1a1d9372b55d20","attaquants",352,"{\"quartz\":0,\"scorie\":0}","109245487320","3788524500/2145202682/0","0/7/14"],
  ["camp/richeQuartz/n50/g4/moitie","eac8aeca36a3d91b4daf46281c149293","932f39aeccd511947d34b223a802ec92","attaquants",196,"{\"quartz\":0,\"scorie\":0}","27122907860","3788524500/2672690189/0","0/3/7"],
  ["camp/richeScorie/n50/g4/toutes","73d8b5966e1ad75a7461c565e3dd8303","2630fc8731e802ef0b25f55d00d3dbe1","attaquants",352,"{\"quartz\":0,\"scorie\":0}","109245487320","3788524500/2145202682/0","0/7/14"],
  ["camp/richeScorie/n50/g4/moitie","eac8aeca36a3d91b4daf46281c149293","b6883a4d78e4ec30aa03cf3d091eccaf","attaquants",196,"{\"quartz\":0,\"scorie\":0}","27122907860","3788524500/2672690189/0","0/3/7"],
  ["avantPoste/richeQuartz/n50/g4/toutes","aad22a0786e40ae715504f08154ca02a","ce4d19d4f0250324068524749275790e","attaquants",249,"{\"quartz\":0,\"scorie\":0}","64542373589","5069152500/2844061350/96047100","0/8/13"],
  ["avantPoste/richeQuartz/n50/g4/moitie","7fb6357b2a501a8602652577cc0fd99e","6de66a400dd3598b3231ebfc75f8468e","attaquants",183,"{\"quartz\":0,\"scorie\":0}","4146092361","5069152500/3696823151/0","0/0/7"],
  ["avantPoste/richeScorie/n50/g4/toutes","aad22a0786e40ae715504f08154ca02a","3bc3a868fec144abcdec251e8a69683d","attaquants",249,"{\"quartz\":0,\"scorie\":0}","64542373589","5069152500/2844061350/96047100","0/8/13"],
  ["avantPoste/richeScorie/n50/g4/moitie","7fb6357b2a501a8602652577cc0fd99e","2c30c7490ab2f8ac180490df270c85ac","attaquants",183,"{\"quartz\":0,\"scorie\":0}","4146092361","5069152500/3696823151/0","0/0/7"],
  ["base/-/n50/g4/toutes","9b92a2bd0c552cc3077bb0e6df93307c","7ebd66e1aeb84828749502fb8071e89a","attaquants",225,"{\"quartz\":0,\"scorie\":0}","79307225277","5602747500/3772690208/0","0/5/14"],
  ["base/-/n50/g4/moitie","ee2cc2baa7bcc4de064183532896783a","da915935993ded91cd47330c8ccbeb67","attaquants",216,"{\"quartz\":0,\"scorie\":0}","31894181171","5602747500/4179490418/0","0/2/7"],
  ["camp/richeQuartz/n5/g5/toutes","ad92c6687ef92ac687b635ab63e69a50","b66e2c5418053164a794117b4cd739af","attaquants",479,"{\"quartz\":2826,\"scorie\":942}","75360","13908000/0/18334599","3/3/0"],
  ["camp/richeQuartz/n5/g5/moitie","0d42fd1341b6cd96cc0c4e39df13cf35","b2753077a350b0dd73f88e635b0a5f00","attaquants",415,"{\"quartz\":2826,\"scorie\":942}","56455","13908000/771244/5401062","3/2/1"],
  ["camp/richeScorie/n5/g5/toutes","ad92c6687ef92ac687b635ab63e69a50","d99382991b6208377fd21f2a910a5c30","attaquants",479,"{\"quartz\":942,\"scorie\":2826}","75360","13908000/0/18334599","3/3/0"],
  ["camp/richeScorie/n5/g5/moitie","0d42fd1341b6cd96cc0c4e39df13cf35","42b764e88b55e4eb71edabde22d5ea31","attaquants",415,"{\"quartz\":942,\"scorie\":2826}","56455","13908000/771244/5401062","3/2/1"],
  ["avantPoste/richeQuartz/n5/g5/toutes","a23711c33fce433f56cde6cc5c639383","3ae73621c08fdf3639ee1770313fddd1","souche",318,"{\"quartz\":42256,\"scorie\":14085}","125600","11122880/0/16588602","5/5/1"],
  ["avantPoste/richeQuartz/n5/g5/moitie","6e530caad4cf33cf5e311e91b1eb98cb","ae6be0b7759bd237ef66dec94e61d558","attaquants",542,"{\"quartz\":29432,\"scorie\":9810}","125600","13410240/0/5665419","6/5/1"],
  ["avantPoste/richeScorie/n5/g5/toutes","a23711c33fce433f56cde6cc5c639383","7096dfc87d7bb04d8f02e169f49bd220","souche",318,"{\"quartz\":14085,\"scorie\":42256}","125600","11122880/0/16588602","5/5/1"],
  ["avantPoste/richeScorie/n5/g5/moitie","6e530caad4cf33cf5e311e91b1eb98cb","75ef075c60bb5eded1810f0899748280","attaquants",542,"{\"quartz\":9810,\"scorie\":29432}","125600","13410240/0/5665419","6/5/1"],
  ["base/-/n5/g5/toutes","8ba71ef708bfa8ccf6a6de18bffb39bd","75e416381c4fb2793c9f2f3c643108a2","attaquants",574,"{\"quartz\":4320,\"scorie\":753}","150720","13864845/0/15491922","3/6/1"],
  ["base/-/n5/g5/moitie","43003fa50da4e4d0034df1a00595d79a","24a19bce8f44ca372472c8c14bd1632f","attaquants",569,"{\"quartz\":3768,\"scorie\":753}","150720","19764000/0/6205227","3/6/0"],
  ["camp/richeQuartz/n20/g5/toutes","62124c16709190f4b3a71046b9a6d062","ec4fec26a902a40b6abee0c3bfaf4c43","attaquants",523,"{\"quartz\":36912,\"scorie\":12304}","24383310","146418882/32414800/21514267","0/11/11"],
  ["camp/richeQuartz/n20/g5/moitie","75c9b6835ded971a8b965cb6f20d0469","89786b12cdc978eddedd789732a3c419","attaquants",328,"{\"quartz\":0,\"scorie\":0}","8894972","152900000/73172759/0","0/2/7"],
  ["camp/richeScorie/n20/g5/toutes","62124c16709190f4b3a71046b9a6d062","655f127a7cbe1da89d6db263370f63c8","attaquants",523,"{\"quartz\":12304,\"scorie\":36912}","24383310","146418882/32414800/21514267","0/11/11"],
  ["camp/richeScorie/n20/g5/moitie","75c9b6835ded971a8b965cb6f20d0469","63444d86abbbee751f8cc9ec73b0baae","attaquants",328,"{\"quartz\":0,\"scorie\":0}","8894972","152900000/73172759/0","0/2/7"],
  ["avantPoste/richeQuartz/n20/g5/toutes","02fb401e592e7d72e6665b0258e3d810","b4b3ff40c5a8b96700ff61d7c4e0ba89","attaquants",485,"{\"quartz\":78762,\"scorie\":26254}","31349970","206746913/64218000/24667657","0/14/10"],
  ["avantPoste/richeQuartz/n20/g5/moitie","1ef77daec89520a49cdc714eb975c203","d8ec67b14eeb080e7dd1e1d2f29a17ce","attaquants",234,"{\"quartz\":0,\"scorie\":0}","7574293","211002000/121660856/0","0/3/7"],
  ["avantPoste/richeScorie/n20/g5/toutes","02fb401e592e7d72e6665b0258e3d810","2d32b194124b6a18e51153c9470fbe1f","attaquants",485,"{\"quartz\":26254,\"scorie\":78762}","31349970","206746913/64218000/24667657","0/14/10"],
  ["avantPoste/richeScorie/n20/g5/moitie","1ef77daec89520a49cdc714eb975c203","f62918b8c898b772e622b3be1ee55ed1","attaquants",234,"{\"quartz\":0,\"scorie\":0}","7574293","211002000/121660856/0","0/3/7"],
  ["base/-/n20/g5/toutes","71695056f1055af5c67551f2cb68e3ed","8ba3f1143620aa7dbd1a390dde832e81","attaquants",693,"{\"quartz\":29006,\"scorie\":551506}","33383939","188072718/68340961/12270297","5/15/10"],
  ["base/-/n20/g5/moitie","5530cdb0859428e3fe28e2c9f2901ba7","dfebc08a837438847e11f565068a9b93","attaquants",258,"{\"quartz\":0,\"scorie\":0}","12864335","226292000/113665287/0","0/6/7"],
  ["camp/richeQuartz/n35/g5/toutes","b8f242abed75ef97d7b387b97b92a3f5","60dfcfc8e4dc686325104ae8f09bf2c4","attaquants",298,"{\"quartz\":0,\"scorie\":0}","868801242","855858000/347389668/0","0/7/14"],
  ["camp/richeQuartz/n35/g5/moitie","7566d2e64b5493a3428bba56532e74a4","fa9cfcc528d4308d5fcd82bdf7ba6cf6","attaquants",281,"{\"quartz\":0,\"scorie\":0}","546549879","855858000/486747504/0","0/2/7"],
  ["camp/richeScorie/n35/g5/toutes","b8f242abed75ef97d7b387b97b92a3f5","815f8e2f13a83d87d928cab6b2659bd4","attaquants",298,"{\"quartz\":0,\"scorie\":0}","868801242","855858000/347389668/0","0/7/14"],
  ["camp/richeScorie/n35/g5/moitie","7566d2e64b5493a3428bba56532e74a4","35779aa35f40223d4ddae4016321ffe5","attaquants",281,"{\"quartz\":0,\"scorie\":0}","546549879","855858000/486747504/0","0/2/7"],
  ["avantPoste/richeQuartz/n35/g5/toutes","2130dd18a155fc9f25a1e4899a557840","ecf662885854ee59f53afed6e31a56e7","attaquants",284,"{\"quartz\":0,\"scorie\":0}","851399226","1162434000/541642199/0","0/9/14"],
  ["avantPoste/richeQuartz/n35/g5/moitie","d77fdb11f3a583463ba1935a2ea8ff3b","b9c19196de1c905dc40d22aceb4ea860","attaquants",299,"{\"quartz\":0,\"scorie\":0}","672633918","1162434000/643139474/0","0/5/7"],
  ["avantPoste/richeScorie/n35/g5/toutes","2130dd18a155fc9f25a1e4899a557840","0adc3576a531133f2415dfa34f43b8cf","attaquants",284,"{\"quartz\":0,\"scorie\":0}","851399226","1162434000/541642199/0","0/9/14"],
  ["avantPoste/richeScorie/n35/g5/moitie","d77fdb11f3a583463ba1935a2ea8ff3b","f16b17992d95162725de91a3f416e032","attaquants",299,"{\"quartz\":0,\"scorie\":0}","672633918","1162434000/643139474/0","0/5/7"],
  ["base/-/n35/g5/toutes","0c469fa4a7424c5370ca5cc456bee656","96b1c4f0ff36fb6b28caa07ec43040e9","attaquants",389,"{\"quartz\":0,\"scorie\":0}","1820024716","1251852000/659944709/0","0/9/14"],
  ["base/-/n35/g5/moitie","8b36fbf1bd497ec1a4f65d2cae103552","a7cbfac7b547ec7df683999f6fb38243","attaquants",270,"{\"quartz\":0,\"scorie\":0}","465509605","1251852000/816469269/0","0/2/7"],
  ["camp/richeQuartz/n50/g5/toutes","c3b812a947a8b08bbbedd8b786d054df","b35b06bc116179982cfd0ed6f8136cbb","attaquants",369,"{\"quartz\":280481,\"scorie\":93493}","141859769972","3788317041/1420015724/0","0/8/14"],
  ["camp/richeQuartz/n50/g5/moitie","e6d3ce77d98d68b2a784abf6fa551f49","5919b5efe2ccfe7f65383c15c9f1408f","attaquants",221,"{\"quartz\":0,\"scorie\":0}","34387894645","3788524500/2026588800/0","0/3/7"],
  ["camp/richeScorie/n50/g5/toutes","c3b812a947a8b08bbbedd8b786d054df","f538fcca42fc6234c715956ff889d6dd","attaquants",369,"{\"quartz\":93493,\"scorie\":280481}","141859769972","3788317041/1420015724/0","0/8/14"],
  ["camp/richeScorie/n50/g5/moitie","e6d3ce77d98d68b2a784abf6fa551f49","79fc92a2f50c38b766ee8f1105b97753","attaquants",221,"{\"quartz\":0,\"scorie\":0}","34387894645","3788524500/2026588800/0","0/3/7"],
  ["avantPoste/richeQuartz/n50/g5/toutes","f05f26a7f1ebfdbe664fc37cb36b5d44","76f696606856bb5a22f591ec129c014b","attaquants",238,"{\"quartz\":0,\"scorie\":0}","42989591612","5069152500/2769266839/0","0/4/14"],
  ["avantPoste/richeQuartz/n50/g5/moitie","729a9472ded57b2092bec49410b68a0c","07f96b6250053c1e971606bb9dab8908","attaquants",246,"{\"quartz\":0,\"scorie\":0}","24728471186","5069152500/2929732599/0","0/3/7"],
  ["avantPoste/richeScorie/n50/g5/toutes","f05f26a7f1ebfdbe664fc37cb36b5d44","1e36157a7da590665f25273772b7c41c","attaquants",238,"{\"quartz\":0,\"scorie\":0}","42989591612","5069152500/2769266839/0","0/4/14"],
  ["avantPoste/richeScorie/n50/g5/moitie","729a9472ded57b2092bec49410b68a0c","b60f348d03898fb0ff878869ab17f7e2","attaquants",246,"{\"quartz\":0,\"scorie\":0}","24728471186","5069152500/2929732599/0","0/3/7"],
  ["base/-/n50/g5/toutes","4908b830b2af1e7f7d1aefe063e722ed","380fd869e57896c090549a8dca30eb73","attaquants",249,"{\"quartz\":0,\"scorie\":0}","114936455881","5602747500/2864885445/0","0/9/14"],
  ["base/-/n50/g5/moitie","16a8d610f8aa2269d78ea8d3d24fa88e","a29b80eb538025cc6832737401498c91","attaquants",268,"{\"quartz\":0,\"scorie\":0}","38103788588","5602747500/3307374965/0","0/3/7"],
];

// ---------------------------------------------------------------------------
// L'AVANT : les deux cents empreintes d'AVANT le lot JOURNAL-DE-COMBAT, avec les
// quatre couches empilées depuis. Elles ne servent plus qu'à `JOURNAL T1 bis`,
// qui les rejoue avec `genererSiteAncien` — et elles ne se rafraîchissent pas.
// ---------------------------------------------------------------------------
export const TEMOINS_COMBAT_AVANT_PAQUETS = [
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

/**
 * CE QUE LE LOT MUR DÉPLACE SUR LE PLACEMENT COURANT, COMBAT PAR COMBAT ET
 * CHAMP PAR CHAMP — la couche que lit `JOURNAL T1`.
 *
 * ⚠⚠ LA TABLE `TEMOINS_COMBAT` N'EST PAS RECAPTURÉE, ET C'EST LA CONSIGNE
 * QU'ELLE PORTE ELLE-MÊME : « le prochain lot qui touchera au combat devra à
 * nouveau EMPILER, jamais recapturer ». Le lot PAQUETS avait eu ce droit UNE
 * fois, parce qu'il déplaçait 1 267 champs sur 1 600 et qu'il ne restait plus
 * rien à adosser. Ici **561**, et **1 039 champs restent adossés à la capture
 * du lot PAQUETS** : on est loin du seuil, donc on empile.
 *
 * ⚠ CE QUI BOUGE ET POURQUOI : 110 combats sur 200. Deux règles neuves, et
 * elles ne se recouvrent pas — les six unités anti-structure s'ARRÊTENT
 * désormais devant un mur, une barrière ou une tourelle (10/09, point 3), et
 * TOUTES LES AUTRES se RANGENT sur leur case au lieu de fluer dedans (point 2).
 * Un raid qui ne s'arrête plus aux mêmes endroits et dont les colonnes ne se
 * tassent plus pareil ne rend pas les mêmes PV : ce qui serait suspect, c'est
 * qu'il les rende.
 *
 * ⚠⚠ ET LE COMPTE EST **561, LÀ OÙ LE BRIEF ANNONÇAIT 565** — l'écart est
 * l'ÉCRASEUR, et il se lit dans cette table. Le §3.2 du brief prévient qu'un
 * `caseDestination` laissé au forçage tue la brèche en silence ; MESURÉ, la
 * moitié qu'il ne nomme pas est pire : `peutAvancer` rend VRAI dès que
 * `caseDestination === rangee`, donc une entité RANGÉE reste « progressante »
 * pour toujours et le forçage n'est jamais calculé. La variante naïve — celle
 * qui donne 565 — laisse **six combats des deux cents partir au plafond de
 * durée, tick 900**, faute de brèche : les 48, 91, 93, 129, 174 et 176.
 * Corrigée, ils se concluent aux ticks 462, 398, 398, 313, 447 et 447. Quatre
 * champs de moins bougent parce qu'ils RETOMBENT sur le témoin du lot PAQUETS.
 *
 * Clé : l'indice du combat dans le témoin. Valeur : les colonnes déplacées, à
 * l'indice qu'elles ont dans la ligne du témoin.
 */
// ⚠⚠ ET CETTE COUCHE-CI A PERDU SA TABLE DE BASE AU LOT APPROCHE, 11/09 — ELLE
// EST GARDÉE SANS ÊTRE LUE, ET IL FAUT LE DIRE. Elle décrivait ce que le lot MUR
// déplaçait contre la capture du lot PAQUETS ; cette capture a été recapturée
// ci-dessus, donc la couche ne s'adosse plus à rien et `JOURNAL T1` ne la lit
// plus. Elle n'est PAS retirée — le §4.3 du brief l'interdit, et elle reste la
// seule trace chiffrée de ce que les deux gestes du lot MUR ont déplacé : 583
// champs sur 1 600, 124 combats sur 200.
//
// ⚠ NE PAS L'EMPILER SUR LA CAPTURE NEUVE : elle décrit un écart entre deux
// états qui n'existent plus ni l'un ni l'autre. Le prochain lot qui déplacera le
// combat ouvrira SA couche, contre la capture du lot APPROCHE.
export const COMBATS_DEPLACES_PAR_MUR = {
  4: { 1: "d95dd188806ec8c22922db9715075888", 2: "e313f86c2cd4ec010120ee03d5653608" },   // avantPoste/richeQuartz/n5/g1/toutes
  6: { 1: "d95dd188806ec8c22922db9715075888", 2: "69132e58bff92bb17881ac59f86b661c" },   // avantPoste/richeScorie/n5/g1/toutes
  10: { 1: "bb2256224f6d32e6982473bad61c3368", 2: "805a2fd7c9dc0a4ac448880322b493ab", 4: 526, 5: "{\"quartz\":113022,\"scorie\":37674}", 7: "127471302/12232000/25360497", 8: "2/13/8" },   // camp/richeQuartz/n20/g1/toutes
  11: { 1: "b8bad3c43e0d37c7a3fb1be96ac1c6f7", 2: "c3b6eee2859318dafd9275a1e9072d9f", 4: 296, 6: "12092862", 7: "152900000/62898548/0" },   // camp/richeQuartz/n20/g1/moitie
  12: { 1: "bb2256224f6d32e6982473bad61c3368", 2: "39171875de0173174d21137cd8e72122", 4: 526, 5: "{\"quartz\":37674,\"scorie\":113022}", 7: "127471302/12232000/25360497", 8: "2/13/8" },   // camp/richeScorie/n20/g1/toutes
  13: { 1: "b8bad3c43e0d37c7a3fb1be96ac1c6f7", 2: "b9be56bf9bc93832e91bed89df6ee512", 4: 296, 6: "12092862", 7: "152900000/62898548/0" },   // camp/richeScorie/n20/g1/moitie
  14: { 1: "bb2d9540b022a00de46a8299918f8966", 2: "5b2bdcce66e07e382ee8798fd8c560d4", 5: "{\"quartz\":1650,\"scorie\":550}", 6: "27380816", 7: "210962376/90512755/12524578" },   // avantPoste/richeQuartz/n20/g1/toutes
  16: { 1: "bb2d9540b022a00de46a8299918f8966", 2: "d173363e9553da9e704156c1c35ff17d", 5: "{\"quartz\":550,\"scorie\":1650}", 6: "27380816", 7: "210962376/90512755/12524578" },   // avantPoste/richeScorie/n20/g1/toutes
  18: { 1: "4cb61c4d38ff3ac77ff79d1263bfd766", 2: "95aabaf4c8ef97458e7c01e6e396083e" },   // base/-/n20/g1/toutes
  19: { 2: "1bc2a340ed2545dd9e7ed5337b0358be" },   // base/-/n20/g1/moitie
  24: { 1: "2494de5070d39e35fe5f745b88e2c112", 2: "b18a0265d24e4cd726129bdd71f7af08", 4: 209, 6: "1049616602", 7: "1162434000/658338312/0", 8: "0/6/14" },   // avantPoste/richeQuartz/n35/g1/toutes
  25: { 1: "db18260847e501f184c8c7dd431bb0a9", 2: "827a9f1d95637b40ec62fc4c245fbcd7", 4: 177, 6: "448014530", 7: "1162434000/751107888/0" },   // avantPoste/richeQuartz/n35/g1/moitie
  26: { 1: "2494de5070d39e35fe5f745b88e2c112", 2: "3f4577205a6b4794c155977d624bf68d", 4: 209, 6: "1049616602", 7: "1162434000/658338312/0", 8: "0/6/14" },   // avantPoste/richeScorie/n35/g1/toutes
  27: { 1: "db18260847e501f184c8c7dd431bb0a9", 2: "d92e470ecc77732320651e02978cc959", 4: 177, 6: "448014530", 7: "1162434000/751107888/0" },   // avantPoste/richeScorie/n35/g1/moitie
  28: { 1: "9766d41554650569da2bf7e1a81b8952", 2: "ef706c8f5f566512738b236e5e3681c3", 4: 600, 6: "853157076", 7: "1251852000/683358453/0", 8: "0/6/14" },   // base/-/n35/g1/toutes
  29: { 1: "ca5eb997aba4a7fa04b37b2ac805df97", 2: "b1e69fbefed92fdebedb440757ef6898", 4: 248, 6: "436142337", 7: "1251852000/819571485/0" },   // base/-/n35/g1/moitie
  30: { 1: "2201b98bbfb450434f2f5c219ef5aaf7", 2: "9c950ba0f7e0cee748f2c4452ac030df", 4: 325, 6: "107158024447", 7: "3788524500/1685695463/213438000", 8: "0/12/13" },   // camp/richeQuartz/n50/g1/toutes
  31: { 1: "9abca7f3a7e67a5a6b0f4230b1ba3d49", 2: "966d481f58cd693148c16968fe5a566b", 4: 210, 6: "18474747803", 7: "3788524500/2442690351/0", 8: "0/4/7" },   // camp/richeQuartz/n50/g1/moitie
  32: { 1: "2201b98bbfb450434f2f5c219ef5aaf7", 2: "2688519eb0f7ee80b21efbec639fec16", 4: 325, 6: "107158024447", 7: "3788524500/1685695463/213438000", 8: "0/12/13" },   // camp/richeScorie/n50/g1/toutes
  33: { 1: "9abca7f3a7e67a5a6b0f4230b1ba3d49", 2: "ebe96141db4843222b00cf0a6b58f691", 4: 210, 6: "18474747803", 7: "3788524500/2442690351/0", 8: "0/4/7" },   // camp/richeScorie/n50/g1/moitie
  34: { 1: "a3de9af586b66238a7c62c75d4691a5c", 2: "bb84a68f198f826d2b7a72f3e978bbc4", 3: "souche", 4: 630, 5: "{\"quartz\":30948597172,\"scorie\":10316199057}", 6: "173861712476", 7: "4375479000/2296583303/93035437", 8: "2/18/12" },   // avantPoste/richeQuartz/n50/g1/toutes
  35: { 1: "22081762e59d66739fc1aa8ceef02499", 2: "7fd03551efa79e3d087be33b64673850", 4: 202, 6: "35817098137", 7: "5069152500/3548149152/0", 8: "0/5/7" },   // avantPoste/richeQuartz/n50/g1/moitie
  36: { 1: "a3de9af586b66238a7c62c75d4691a5c", 2: "3073ef7b7cc154b65c348f004eec3254", 3: "souche", 4: 630, 5: "{\"quartz\":10316199057,\"scorie\":30948597172}", 6: "173861712476", 7: "4375479000/2296583303/93035437", 8: "2/18/12" },   // avantPoste/richeScorie/n50/g1/toutes
  37: { 1: "22081762e59d66739fc1aa8ceef02499", 2: "dcaff65f5913bf58e4061a592455830c", 4: 202, 6: "35817098137", 7: "5069152500/3548149152/0", 8: "0/5/7" },   // avantPoste/richeScorie/n50/g1/moitie
  48: { 2: "a1880d253bdad605210a7155ceef2b0d" },   // base/-/n5/g2/toutes
  49: { 1: "a49157669f8d88a6c583677dbdc2df4d", 2: "1eb8a8513ede6a6499ad3cf4fa4ed074", 4: 462 },   // base/-/n5/g2/moitie
  50: { 1: "bfae5b41b43216fca81a3a6259af9854", 2: "0e473784411ed18ca3769fdcc17e4a7d", 4: 521, 5: "{\"quartz\":70254,\"scorie\":23418}", 6: "29313833", 7: "133188881/23710546/26415873" },   // camp/richeQuartz/n20/g2/toutes
  52: { 1: "bfae5b41b43216fca81a3a6259af9854", 2: "b042a329737cfcb728924e6b5a3d453e", 4: 521, 5: "{\"quartz\":23418,\"scorie\":70254}", 6: "29313833", 7: "133188881/23710546/26415873" },   // camp/richeScorie/n20/g2/toutes
  54: { 1: "571d43452ce51ad76f8701f8df84a49e", 2: "0b30b198941a711f2e5588f64a4c35a9", 4: 334, 6: "25858175", 7: "211002000/57463891/0" },   // avantPoste/richeQuartz/n20/g2/toutes
  55: { 1: "199c4e78221c9d401794227f3c182da8", 2: "2927bb9b60456f3dd9c877747e9f5d2f", 6: "7806248", 7: "211002000/112159211/0" },   // avantPoste/richeQuartz/n20/g2/moitie
  56: { 1: "571d43452ce51ad76f8701f8df84a49e", 2: "81454d06e779b1b4ba824a4406fb4125", 4: 334, 6: "25858175", 7: "211002000/57463891/0" },   // avantPoste/richeScorie/n20/g2/toutes
  57: { 1: "199c4e78221c9d401794227f3c182da8", 2: "797b924ca0a33400c60697dc7777ee5b", 6: "7806248", 7: "211002000/112159211/0" },   // avantPoste/richeScorie/n20/g2/moitie
  58: { 1: "947b5fd71c81ce5367f71392b9092bcc", 2: "f47079057ffe905e1dfb0f6f40c7ebeb", 4: 236, 6: "20043348", 7: "226292000/107454132/5504400", 8: "0/8/13" },   // base/-/n20/g2/toutes
  59: { 1: "fff04c10d2e4fec08bd809d98a713b1c", 2: "2d3221639c333cc39477e7740a1918c2", 6: "1886900", 7: "226292000/148226661/0" },   // base/-/n20/g2/moitie
  60: { 1: "f64f4f735d63f720eb2e36de81e7314f", 2: "3365e633d34c3e11208bba6d86392e57", 4: 423, 5: "{\"quartz\":0,\"scorie\":0}", 6: "2622944461", 7: "855858000/175305826/0" },   // camp/richeQuartz/n35/g2/toutes
  61: { 2: "735b4a018274ed5cdf200211568b2783" },   // camp/richeQuartz/n35/g2/moitie
  62: { 1: "f64f4f735d63f720eb2e36de81e7314f", 2: "ae03d39ccbf6a23a56a69f6db3bea8cf", 4: 423, 5: "{\"quartz\":0,\"scorie\":0}", 6: "2622944461", 7: "855858000/175305826/0" },   // camp/richeScorie/n35/g2/toutes
  63: { 2: "ddec416167f302c91e952ff5cae31a7a" },   // camp/richeScorie/n35/g2/moitie
  64: { 1: "e4ae27d9d56267628df7ac50e80b5d5a", 2: "8684709623d1669ebef28684daef42ef", 4: 325, 6: "1424172966", 7: "1162434000/680107510/0", 8: "0/6/14" },   // avantPoste/richeQuartz/n35/g2/toutes
  65: { 2: "1f2e05cbf45808bede8bc381a54626e6" },   // avantPoste/richeQuartz/n35/g2/moitie
  66: { 1: "e4ae27d9d56267628df7ac50e80b5d5a", 2: "16eeec911e318c61be019b214d40b84f", 4: 325, 6: "1424172966", 7: "1162434000/680107510/0", 8: "0/6/14" },   // avantPoste/richeScorie/n35/g2/toutes
  67: { 2: "8e389c1cc132404bd17127c0bb5a4112" },   // avantPoste/richeScorie/n35/g2/moitie
  68: { 1: "7591b0964eba21dd73055851321085ea", 2: "eee3a703407632d0887c865af17127f2", 3: "attaquants", 4: 326, 6: "1221777433", 7: "1251852000/641749636/0", 8: "0/9/14" },   // base/-/n35/g2/toutes
  69: { 1: "efb84e6dba52bcd4b54c78857e0738a0", 2: "da89446f87b12eb1fabb70d4b039037b", 4: 229, 6: "855681987", 7: "1251852000/732984815/0", 8: "0/6/7" },   // base/-/n35/g2/moitie
  74: { 1: "d5383b030329c656bc80ab18019f4aaf", 2: "45feaa6c3eba4ea7b93f8c81e8ba930e", 4: 221, 6: "95322796947", 7: "5069152500/3118175265/0", 8: "0/4/14" },   // avantPoste/richeQuartz/n50/g2/toutes
  75: { 1: "29bfcf464c4207b19141ceb829cc3777", 2: "e6537300c0c7deb9805430282be139d7", 4: 173, 6: "36965659836", 7: "5069152500/3554148106/0" },   // avantPoste/richeQuartz/n50/g2/moitie
  76: { 1: "d5383b030329c656bc80ab18019f4aaf", 2: "ed2d7e85dce37d568e5775386a723bdb", 4: 221, 6: "95322796947", 7: "5069152500/3118175265/0", 8: "0/4/14" },   // avantPoste/richeScorie/n50/g2/toutes
  77: { 1: "29bfcf464c4207b19141ceb829cc3777", 2: "15d3bea6e2d03ce5c734e2f4e04bd85e", 4: 173, 6: "36965659836", 7: "5069152500/3554148106/0" },   // avantPoste/richeScorie/n50/g2/moitie
  78: { 2: "f7c9891dfdd5baa3be0b361b9d2668e0" },   // base/-/n50/g2/toutes
  79: { 1: "08dc36d02c56d99fc62196459443dc1f", 2: "8c8349511e3310ac81a8a0adfb860849", 6: "30960969918", 7: "5602747500/4113446226/0" },   // base/-/n50/g2/moitie
  84: { 1: "d6ad4c94f1b281b44091a101db5dd6b1", 2: "108483e32009864f7fb0492e04860f0e", 4: 463 },   // avantPoste/richeQuartz/n5/g3/toutes
  86: { 1: "d6ad4c94f1b281b44091a101db5dd6b1", 2: "6515cf088ddeb71701ab1fbd33dbcd28", 4: 463 },   // avantPoste/richeScorie/n5/g3/toutes
  88: { 1: "b6d7b4a192c0208eebcd0e439137d6ff", 2: "2583ad65b7353eeb7b9d82506bfd4fc5", 4: 506 },   // base/-/n5/g3/toutes
  90: { 1: "8da6b17fe1875adbb6acb1090003f5ef", 2: "26447e2c5e202ff63cb411cdf1877818", 6: "24015113", 7: "114982569/43772996/22731902", 8: "1/9/8" },   // camp/richeQuartz/n20/g3/toutes
  91: { 1: "69c2d5a239bd7df741007ee646531ccf", 2: "be55ac5a880ff51b15b7c0415d75488b", 4: 398 },   // camp/richeQuartz/n20/g3/moitie
  92: { 1: "8da6b17fe1875adbb6acb1090003f5ef", 2: "5ca9cb8eefb09dc3d74ec81048afa951", 6: "24015113", 7: "114982569/43772996/22731902", 8: "1/9/8" },   // camp/richeScorie/n20/g3/toutes
  93: { 1: "69c2d5a239bd7df741007ee646531ccf", 2: "78dfa4b50103baf700b1f6a3fe4abbd9", 4: 398 },   // camp/richeScorie/n20/g3/moitie
  94: { 1: "5abffe0710f6ca7069bc3d27510e19a7", 2: "7e81e2a58ba3ed08237a9c4b8b8b9ff2", 4: 264, 6: "24116156", 7: "211002000/97490117/11620400", 8: "0/9/12" },   // avantPoste/richeQuartz/n20/g3/toutes
  96: { 1: "5abffe0710f6ca7069bc3d27510e19a7", 2: "8236b22f151d1f01af09d148db1323b5", 4: 264, 6: "24116156", 7: "211002000/97490117/11620400", 8: "0/9/12" },   // avantPoste/richeScorie/n20/g3/toutes
  98: { 1: "b06c6392991ae231260b2e7f167b2daf", 2: "f17a4cc62b027a936e5b67f7b926ae40", 4: 286, 6: "22425441", 7: "226292000/108038962/12232000", 8: "0/7/13" },   // base/-/n20/g3/toutes
  99: { 1: "8b06805642be989ca6bba3068a738e2c", 2: "69a505148492b8229fb2c7b98e273c51", 4: 309, 6: "12442617", 7: "226292000/127360642/0" },   // base/-/n20/g3/moitie
  100: { 1: "a68064e67685a5c5fe9e14d1c0f10483", 2: "6dd1f377affe09782ef86280a6abbec4", 4: 389, 6: "2373814870", 7: "855858000/367487952/0" },   // camp/richeQuartz/n35/g3/toutes
  102: { 1: "a68064e67685a5c5fe9e14d1c0f10483", 2: "4548b2d6b878e2c38729d7a02bb21f5c", 4: 389, 6: "2373814870", 7: "855858000/367487952/0" },   // camp/richeScorie/n35/g3/toutes
  104: { 1: "aa028a9c9b053c0ae4f31fc253813a7f", 2: "be3de8e77fd02d41ddd393cc0db37658", 4: 286, 6: "1455152829", 7: "1162434000/659172703/0", 8: "0/11/14" },   // avantPoste/richeQuartz/n35/g3/toutes
  105: { 1: "3eb3ed20ce596750715f9b4551995695", 2: "451bbaeaf25df0c42b980c0893d0c672", 4: 264, 6: "533025265", 7: "1162434000/837058758/0" },   // avantPoste/richeQuartz/n35/g3/moitie
  106: { 1: "aa028a9c9b053c0ae4f31fc253813a7f", 2: "67e8e7a6c7d7fc9989517c5ecee65c63", 4: 286, 6: "1455152829", 7: "1162434000/659172703/0", 8: "0/11/14" },   // avantPoste/richeScorie/n35/g3/toutes
  107: { 1: "3eb3ed20ce596750715f9b4551995695", 2: "b5feb171846264dcfe8f92ab4f6e9cab", 4: 264, 6: "533025265", 7: "1162434000/837058758/0" },   // avantPoste/richeScorie/n35/g3/moitie
  108: { 1: "cf09df25e58bf3af8bb4b4d366091dde", 2: "008ff84a339e4943da06cbe3fc466dac", 4: 331, 6: "1454066851", 7: "1251852000/871326758/0" },   // base/-/n35/g3/toutes
  109: { 2: "afe01ca16fe695fedf29604406c3a7be" },   // base/-/n35/g3/moitie
  110: { 1: "8bd10d4209e7a4c4bb11aa17f1fb09c2", 2: "564cc777c9a1d7e74d024bc9247a9e3e", 4: 387, 6: "128682574840", 7: "3788524500/1818729154/0" },   // camp/richeQuartz/n50/g3/toutes
  111: { 1: "3756acf38067ad80f6343adfef12dda5", 2: "682c0f3e1070b2b6c48d06acc70bb8ad", 4: 178, 6: "27451901250", 7: "3788524500/2585465327/0" },   // camp/richeQuartz/n50/g3/moitie
  112: { 1: "8bd10d4209e7a4c4bb11aa17f1fb09c2", 2: "683c63eb86424f444af75a19e7e9d860", 4: 387, 6: "128682574840", 7: "3788524500/1818729154/0" },   // camp/richeScorie/n50/g3/toutes
  113: { 1: "3756acf38067ad80f6343adfef12dda5", 2: "33d265427189783d3eb310d1f21702db", 4: 178, 6: "27451901250", 7: "3788524500/2585465327/0" },   // camp/richeScorie/n50/g3/moitie
  114: { 1: "678a88af60af8652fdaf40de649ba540", 2: "1c8fb9091b838264c17d61ac793f4cab", 4: 231, 6: "66220534254", 7: "5069152500/3498289201/0" },   // avantPoste/richeQuartz/n50/g3/toutes
  115: { 2: "8acf3ff8a07deb3bb61fdc54ed2e5e4d" },   // avantPoste/richeQuartz/n50/g3/moitie
  116: { 1: "678a88af60af8652fdaf40de649ba540", 2: "56b83cc256812ae8d980d73be83f5cc3", 4: 231, 6: "66220534254", 7: "5069152500/3498289201/0" },   // avantPoste/richeScorie/n50/g3/toutes
  117: { 2: "6423cf21b420c1bae09ed5886ef39a20" },   // avantPoste/richeScorie/n50/g3/moitie
  118: { 1: "c34f1bd45a55e451d794f996ca78600a", 2: "d7a06d70ff0533291c000fc696cc0ca6", 4: 322, 6: "53903962456", 7: "5602747500/3564405131/0", 8: "0/4/14" },   // base/-/n50/g3/toutes
  119: { 1: "1de27ec8b00bc1139eaab66d9aad84f4", 2: "14614fcb2ec924e3c0fe45d3cb614449", 6: "14888661502", 7: "5602747500/3931136036/0" },   // base/-/n50/g3/moitie
  124: { 1: "f7b66ea1858f2e3dbaa816dcbf86ea05", 2: "f8f9e829240b219d5d247f0b630a24f4", 4: 327 },   // avantPoste/richeQuartz/n5/g4/toutes
  126: { 1: "f7b66ea1858f2e3dbaa816dcbf86ea05", 2: "d791c0796f0638501932cb78d698cb59", 4: 327 },   // avantPoste/richeScorie/n5/g4/toutes
  128: { 1: "d08348a3f14f7cd8c06c1c410dd26e9e", 2: "a0745e2acff0fa993f97b91b0ede7494" },   // base/-/n5/g4/toutes
  129: { 1: "ad5b5707063a150bcd0e22c1f0bdb8d3", 2: "a07da40c6a25a08fe75e49dc19dd67af", 4: 313 },   // base/-/n5/g4/moitie
  130: { 1: "c2b65513864931639e364965a0cae355", 2: "106e7960fe6c0f37064b7f0343b48f4c", 4: 302, 6: "20495293", 7: "152900000/50476230/12232000" },   // camp/richeQuartz/n20/g4/toutes
  132: { 1: "c2b65513864931639e364965a0cae355", 2: "7221bb7264657ce1b08b1be0e112e4e2", 4: 302, 6: "20495293", 7: "152900000/50476230/12232000" },   // camp/richeScorie/n20/g4/toutes
  134: { 1: "8ba639b46a175cf220d5661befc436f6", 2: "15c6e1919b611cb683d9b0b2821ef500", 4: 297, 6: "22029471", 7: "211002000/63642953/0", 8: "0/10/14" },   // avantPoste/richeQuartz/n20/g4/toutes
  135: { 1: "c810c0e1b61ef4a1f84830a7a2393ff9", 2: "35e1713aae4aea81ab1902af4343e65c", 4: 221, 6: "6489604", 7: "211002000/106960975/0" },   // avantPoste/richeQuartz/n20/g4/moitie
  136: { 1: "8ba639b46a175cf220d5661befc436f6", 2: "256cc2b149b0ec31ad9f93bf97b9e14e", 4: 297, 6: "22029471", 7: "211002000/63642953/0", 8: "0/10/14" },   // avantPoste/richeScorie/n20/g4/toutes
  137: { 1: "c810c0e1b61ef4a1f84830a7a2393ff9", 2: "da3a148143a4aa3b4b84fec002a3fecc", 4: 221, 6: "6489604", 7: "211002000/106960975/0" },   // avantPoste/richeScorie/n20/g4/moitie
  140: { 1: "87c017341bc0eece54a161ac71e0b84b", 2: "e75466e02b823c6cf8247682bb90fd20", 4: 251, 6: "1048250346", 7: "855858000/367487877/0" },   // camp/richeQuartz/n35/g4/toutes
  141: { 1: "e8f352a9a3efe9f30204ce191e475bc5", 2: "3c9e47b73317fbd4448820a9a8962a0f", 4: 199, 6: "426590640", 7: "855858000/483823453/0", 8: "0/3/7" },   // camp/richeQuartz/n35/g4/moitie
  142: { 1: "87c017341bc0eece54a161ac71e0b84b", 2: "9be1a5bd2613004f8323588beaa41793", 4: 251, 6: "1048250346", 7: "855858000/367487877/0" },   // camp/richeScorie/n35/g4/toutes
  143: { 1: "e8f352a9a3efe9f30204ce191e475bc5", 2: "3348c2d8d43f7411c78dfce76b72b099", 4: 199, 6: "426590640", 7: "855858000/483823453/0", 8: "0/3/7" },   // camp/richeScorie/n35/g4/moitie
  144: { 1: "18d58b2c38f72ca6f2aae8d466444f59", 2: "4eddb30f193b672d20d94482089ecf38", 4: 216, 6: "657918294", 7: "1162434000/650970071/0", 8: "0/8/14" },   // avantPoste/richeQuartz/n35/g4/toutes
  145: { 1: "abc1f8fd2587974c59a5bc5f6e3229ae", 2: "73d23ad72b702d6000ca181ea25efee6", 4: 188, 6: "485732380", 7: "1162434000/732734867/0", 8: "0/4/7" },   // avantPoste/richeQuartz/n35/g4/moitie
  146: { 1: "18d58b2c38f72ca6f2aae8d466444f59", 2: "c5b15d91075b45c1d211506f2e82c1a7", 4: 216, 6: "657918294", 7: "1162434000/650970071/0", 8: "0/8/14" },   // avantPoste/richeScorie/n35/g4/toutes
  147: { 1: "abc1f8fd2587974c59a5bc5f6e3229ae", 2: "4d775e7f43a52cba684e33d2397f37f2", 4: 188, 6: "485732380", 7: "1162434000/732734867/0", 8: "0/4/7" },   // avantPoste/richeScorie/n35/g4/moitie
  148: { 1: "9184cc1d6b013fb0b823389415b5333d", 2: "ad6b29419aa2ecd091a9efbdec72a033", 4: 305, 6: "1514106156", 7: "1251852000/643125509/0", 8: "0/7/14" },   // base/-/n35/g4/toutes
  149: { 2: "c274ce199e0b928b88727c818b539de4" },   // base/-/n35/g4/moitie
  154: { 1: "b009acdca6f4557226ab9737e8f5d747", 2: "f2cd1b0dfcfc69aecee8aad7cd3b3781", 4: 250, 6: "64542373589", 7: "5069152500/2844061350/0", 8: "0/8/14" },   // avantPoste/richeQuartz/n50/g4/toutes
  155: { 2: "36f029c42b0e6f29e267597c744703a2" },   // avantPoste/richeQuartz/n50/g4/moitie
  156: { 1: "b009acdca6f4557226ab9737e8f5d747", 2: "65f905206ec8391304c942226ab03de4", 4: 250, 6: "64542373589", 7: "5069152500/2844061350/0", 8: "0/8/14" },   // avantPoste/richeScorie/n50/g4/toutes
  157: { 2: "ca4b144581e9928fd6f2abdeb3f954e6" },   // avantPoste/richeScorie/n50/g4/moitie
  158: { 1: "229c8c8eb066706c3e8d28d814b343fc", 2: "83147670fb3f3ebb9dedc3de3a56f577", 4: 222, 6: "59267988733", 7: "5602747500/3801638278/0" },   // base/-/n50/g4/toutes
  159: { 1: "59c21819ba99d23e55f3f946ed8d9c8b", 2: "d8b216e0a133b945a514166f3750ddaa", 6: "25371632731", 7: "5602747500/4217998298/0" },   // base/-/n50/g4/moitie
  164: { 1: "a8761e97adcc0a3b7b53730614901b16", 2: "058607c7eb1550b90c09648157b84371", 7: "10858488/0/16440388" },   // avantPoste/richeQuartz/n5/g5/toutes
  166: { 1: "a8761e97adcc0a3b7b53730614901b16", 2: "c255ae15688b14bec65e3db0db471533", 7: "10858488/0/16440388" },   // avantPoste/richeScorie/n5/g5/toutes
  170: { 1: "7d24e010ad38eea42c0d72853a3fb288", 2: "dff8910d79552417bebfd2544c94a204", 4: 451, 6: "23224893", 7: "91960176/36688907/26160381", 8: "4/10/10" },   // camp/richeQuartz/n20/g5/toutes
  172: { 1: "7d24e010ad38eea42c0d72853a3fb288", 2: "ad3d40088143389023b644ba176f358a", 4: 451, 6: "23224893", 7: "91960176/36688907/26160381", 8: "4/10/10" },   // camp/richeScorie/n20/g5/toutes
  174: { 1: "7b72299b91ebd38c4f84216fa5669d2d", 2: "294e892cda655ea11c594ed4e337eeb4", 3: "attaquants", 4: 447, 5: "{\"quartz\":109705,\"scorie\":36568}", 6: "31664004", 7: "205075257/63287028/15671972", 8: "0/14/12" },   // avantPoste/richeQuartz/n20/g5/toutes
  176: { 1: "7b72299b91ebd38c4f84216fa5669d2d", 2: "df580fd33a3d1204659b8cae12d1d9fc", 3: "attaquants", 4: 447, 5: "{\"quartz\":36568,\"scorie\":109705}", 6: "31664004", 7: "205075257/63287028/15671972", 8: "0/14/12" },   // avantPoste/richeScorie/n20/g5/toutes
  178: { 1: "c7d89d026e4305dcce9de3ae72f787b3", 2: "49a2cc0fe7d57c0ce5dc5162afeeb267", 5: "{\"quartz\":22387,\"scorie\":544888}", 6: "29396030", 7: "189815891/75542078/10349967", 8: "5/13/10" },   // base/-/n20/g5/toutes
  180: { 1: "89c5643b8071dd09fa09709a08c2029b", 2: "01812b2a637acf292523de743818794b", 4: 312, 6: "1259998504", 7: "855858000/293976026/0", 8: "0/9/14" },   // camp/richeQuartz/n35/g5/toutes
  181: { 1: "61ae06b77d46494acff9d212916b209a", 2: "4cf0651ffad18491205a95795a5936dc", 4: 359, 6: "740605572", 7: "855858000/439791943/0", 8: "0/3/7" },   // camp/richeQuartz/n35/g5/moitie
  182: { 1: "89c5643b8071dd09fa09709a08c2029b", 2: "489f3d773a3c6b67e76c0b266d5a07e0", 4: 312, 6: "1259998504", 7: "855858000/293976026/0", 8: "0/9/14" },   // camp/richeScorie/n35/g5/toutes
  183: { 1: "61ae06b77d46494acff9d212916b209a", 2: "26b0985b66dfa66513d881898aa7344e", 4: 359, 6: "740605572", 7: "855858000/439791943/0", 8: "0/3/7" },   // camp/richeScorie/n35/g5/moitie
  184: { 1: "4a5740e91947e7143705bedf24045f72", 2: "159cbf2786766df9f32b67ef9c582a9d", 4: 281, 6: "832518997", 7: "1162434000/545256608/0" },   // avantPoste/richeQuartz/n35/g5/toutes
  185: { 1: "ffd15441c8337d29b8cc69a5f045f8d1", 2: "e29a2d6d1b3b62ebe66d56b310fb4f09", 4: 277, 6: "678572499", 7: "1162434000/630449855/0", 8: "0/5/7" },   // avantPoste/richeQuartz/n35/g5/moitie
  186: { 1: "4a5740e91947e7143705bedf24045f72", 2: "50573d72b1b34a55b77fa85780e48cc6", 4: 281, 6: "832518997", 7: "1162434000/545256608/0" },   // avantPoste/richeScorie/n35/g5/toutes
  187: { 1: "ffd15441c8337d29b8cc69a5f045f8d1", 2: "d127fa60dac20dcde99ab44dc9e0dd43", 4: 277, 6: "678572499", 7: "1162434000/630449855/0", 8: "0/5/7" },   // avantPoste/richeScorie/n35/g5/moitie
  190: { 1: "ac0b25828d027d1ff9991e95fedf9455", 2: "4469d7670a94be9d32ec789cfac51c74", 6: "162054132994", 7: "3779720211/1241015252/18119637" },   // camp/richeQuartz/n50/g5/toutes
  192: { 1: "ac0b25828d027d1ff9991e95fedf9455", 2: "b6c8d6704866c8bb6bc3a615baff9736", 6: "162054132994", 7: "3779720211/1241015252/18119637" },   // camp/richeScorie/n50/g5/toutes
  198: { 1: "32aa87659940456fc45e584c80243a79", 2: "a64415571c9a7a116b1179194bcdb215", 4: 223, 6: "118816837777", 7: "5602747500/2828489810/0" },   // base/-/n50/g5/toutes
  199: { 2: "822976b54da39ee3465fa6787d9b5040" },   // base/-/n50/g5/moitie
};

/**
 * CE QUE LE LOT MUR DÉPLACE SUR L'ANCIEN PLACEMENT — la CINQUIÈME couche de
 * `JOURNAL T1 bis`, empilée au-dessus d'ARRÊT, COLONNE, CIBLES-RANGÉES et
 * DISPOSITION-OUVRAGE.
 *
 * ⚠⚠ DEUX TABLES POUR UN SEUL LOT, PARCE QU'IL Y A DEUX TÉMOINS ET QU'ILS NE
 * REJOUENT PAS LES MÊMES SITES. `JOURNAL T1` mesure le placement COURANT contre
 * la capture du lot PAQUETS ; `JOURNAL T1 bis` rejoue l'ANCIEN placement, celui
 * de `test/generateur-ancien.js`, contre la capture d'avant JOURNAL-DE-COMBAT.
 * Le §4 du brief annonçait que le second resterait vert sans couche neuve :
 * **il tombe** — 125 combats, 681 champs —, et c'était prévisible, un moteur qui
 * change change AUSSI ce que l'ancien placement rend. Le §5 du même brief le
 * nommait d'ailleurs parmi les vingt-neuf. Mesuré plutôt que supposé.
 *
 * ⚠⚠ ET LA CINQUIÈME COUCHE N'APPORTE **AUCUN CHAMP NEUF** : les 681 étaient
 * DÉJÀ surchargés, tous, par l'une des quatre d'avant. Le compte est l'UNION des
 * cinq, pas leur somme : il reste à **1 331 surchargés, 269 gardés**, au champ
 * près ce qu'il valait avant ce lot. Ce n'est pas une coïncidence — les 269
 * gardés sont pour l'essentiel des CAUSES de fin, et une cause ne change que
 * lorsqu'un combat bascule de `duree` à `attaquants`, ce que l'ancien placement
 * ne fait sur aucun des 125 combats déplacés ici.
 */
export const COMBATS_DEPLACES_PAR_MUR_AVANT_PAQUETS = {
  10: { 1: "8564f9358fc7203f87360f8778ef67a0", 2: "83367ed2df53efe1b55dfd82645ffe7a", 4: 609, 6: "17995184", 7: "122320000/51961030/8090974" },   // camp/richeQuartz/n20/g1/toutes
  11: { 1: "2d95afeef4cbaee378a1a6056c6f6147", 2: "c89d502bdaaafdddad2ef7839213cc39", 4: 418 },   // camp/richeQuartz/n20/g1/moitie
  12: { 1: "8564f9358fc7203f87360f8778ef67a0", 2: "2064ab8c7cfc16a3f5e127d82aa49337", 4: 609, 6: "17995184", 7: "122320000/51961030/8090974" },   // camp/richeScorie/n20/g1/toutes
  13: { 1: "2d95afeef4cbaee378a1a6056c6f6147", 2: "20a9bb0622cd1f20ebe99c806eaeb9d5", 4: 418 },   // camp/richeScorie/n20/g1/moitie
  14: { 1: "625ccedb1020867ac6cb08bcbca10ed0", 2: "17b345ab688ff55529cb40aa0c10e2c0", 4: 623, 6: "24009273", 7: "168190000/52053694/31827781", 8: "6/15/8" },   // avantPoste/richeQuartz/n20/g1/toutes
  15: { 1: "fe8d0a52c07a9fbb5ed78df2f3e96708", 2: "5204df2ac71f12e3621b98705592bc01", 6: "8921688", 7: "211002000/114683375/0" },   // avantPoste/richeQuartz/n20/g1/moitie
  16: { 1: "625ccedb1020867ac6cb08bcbca10ed0", 2: "dfe5b564667306a69ca3e1368a63b121", 4: 623, 6: "24009273", 7: "168190000/52053694/31827781", 8: "6/15/8" },   // avantPoste/richeScorie/n20/g1/toutes
  17: { 1: "fe8d0a52c07a9fbb5ed78df2f3e96708", 2: "de757e48fcd5b098f13a4bf4298d1267", 6: "8921688", 7: "211002000/114683375/0" },   // avantPoste/richeScorie/n20/g1/moitie
  18: { 1: "baaee8167dbdd1b8131aa16240e45bd8", 2: "96f0840c7bf7c5cc16d04eef1d84ee3a", 4: 448, 6: "28578623", 7: "226292000/102420765/12232000" },   // base/-/n20/g1/toutes
  20: { 1: "96c48eaf19cbe093beb04af01a2d9e1f", 2: "988d32970798797d6f9bbbcff4c20aef", 4: 352, 6: "1075826140", 7: "855858000/527289559/51096000" },   // camp/richeQuartz/n35/g1/toutes
  21: { 1: "b7f4be2b512118bbf184accc97c116c9", 2: "3d7021a5e28884c684e7d3650f1b11dd", 4: 385, 6: "682662227", 7: "855858000/643747784/0", 8: "0/4/7" },   // camp/richeQuartz/n35/g1/moitie
  22: { 1: "96c48eaf19cbe093beb04af01a2d9e1f", 2: "74a27c933b6046599fcebe94c59da983", 4: 352, 6: "1075826140", 7: "855858000/527289559/51096000" },   // camp/richeScorie/n35/g1/toutes
  23: { 1: "b7f4be2b512118bbf184accc97c116c9", 2: "504ff2018896316e8baf31390469b96d", 4: 385, 6: "682662227", 7: "855858000/643747784/0", 8: "0/4/7" },   // camp/richeScorie/n35/g1/moitie
  24: { 1: "fe2ec66ea6f158cde99576eed2d87c9f", 2: "4d3fe30a973e5aea832c7d8b6a456210", 4: 288, 6: "1282409549", 7: "1162434000/576607867/0", 8: "0/8/14" },   // avantPoste/richeQuartz/n35/g1/toutes
  25: { 1: "c978c9edfe8af3c24d0e1743d93123d6", 2: "9cee1a7235566bf818a2d00ddb3a783f", 4: 200, 6: "59022279", 7: "1162434000/762068498/0" },   // avantPoste/richeQuartz/n35/g1/moitie
  26: { 1: "fe2ec66ea6f158cde99576eed2d87c9f", 2: "36945d12809941ebc3986e7af83dca05", 4: 288, 6: "1282409549", 7: "1162434000/576607867/0", 8: "0/8/14" },   // avantPoste/richeScorie/n35/g1/toutes
  27: { 1: "c978c9edfe8af3c24d0e1743d93123d6", 2: "1a4f44d4f43a6e18dc27cc627218a021", 4: 200, 6: "59022279", 7: "1162434000/762068498/0" },   // avantPoste/richeScorie/n35/g1/moitie
  28: { 1: "40add783dc29731df7db995c5b7f33ba", 2: "e5761a47c2ac1f8d139c2a774a69465b", 4: 398, 6: "1690494554", 7: "1251852000/617000178/0", 8: "0/10/14" },   // base/-/n35/g1/toutes
  29: { 1: "e24dc84071beae8c8906d53d184129de", 2: "a879ecc5003adfe55044affb3beeb8a1", 4: 172, 6: "230280353", 7: "1251852000/825066057/0" },   // base/-/n35/g1/moitie
  34: { 1: "ab312184d08417b351840227980d6788", 2: "0dd7214ff45f54d4dde892eae46fe8b6", 4: 350, 6: "45980283382", 7: "5069152500/3001327512/0", 8: "0/5/14" },   // avantPoste/richeQuartz/n50/g1/toutes
  35: { 1: "098ee8b77f3c68fda5e5247e765e9e7f", 2: "b55eea148d97ec45c6ae16f056dfc3d9", 4: 203, 6: "4785601265", 7: "5069152500/3364166827/0", 8: "0/3/7" },   // avantPoste/richeQuartz/n50/g1/moitie
  36: { 1: "ab312184d08417b351840227980d6788", 2: "82a08d5409922a9de46a2229bb8c2ed8", 4: 350, 6: "45980283382", 7: "5069152500/3001327512/0", 8: "0/5/14" },   // avantPoste/richeScorie/n50/g1/toutes
  37: { 1: "098ee8b77f3c68fda5e5247e765e9e7f", 2: "b1a8935e5cf338a589e69402f722768f", 4: 203, 6: "4785601265", 7: "5069152500/3364166827/0", 8: "0/3/7" },   // avantPoste/richeScorie/n50/g1/moitie
  38: { 1: "ba2d29950bdae91eed48a64333b64438", 2: "ae733e8ca9acbc1985d6aef254a71dcc", 4: 351, 6: "41555092480", 7: "5602747500/4391476179/0", 8: "0/7/14" },   // base/-/n50/g1/toutes
  39: { 1: "1a9ee4d551ca97fc8d35d28abfdde284", 2: "9ac1836b29318e4f4b3dbc605dcc5712", 4: 298, 6: "13576943336", 7: "5602747500/4748906816/0", 8: "0/5/7" },   // base/-/n50/g1/moitie
  48: { 2: "4afbcd2a5456e953eee3a1daf469ef6e" },   // base/-/n5/g2/toutes
  50: { 2: "ef6eed81d8500be9a4ceb89e27d5520a" },   // camp/richeQuartz/n20/g2/toutes
  52: { 2: "2fd26ffc013db5ad26074b3cb59b8031" },   // camp/richeScorie/n20/g2/toutes
  54: { 1: "f751dcd0da1fff952c48e8d24528afa3", 2: "d4a6ea548b230d713363af8e76e164f0", 4: 304, 6: "20795778", 7: "211002000/80136841/18348000" },   // avantPoste/richeQuartz/n20/g2/toutes
  56: { 1: "f751dcd0da1fff952c48e8d24528afa3", 2: "b162f36e4826d492d0e300513e3cc6c2", 4: 304, 6: "20795778", 7: "211002000/80136841/18348000" },   // avantPoste/richeScorie/n20/g2/toutes
  58: { 1: "f2172dd1c0287ee96ee5e432fbd7b95d", 2: "bd997f94bc6b0dad40cfac85c4d7a38a", 4: 364, 6: "26707481", 7: "226292000/83870842/18348000", 8: "0/11/12" },   // base/-/n20/g2/toutes
  59: { 1: "e791717eda275aa0bf4d85b8ca44cd89", 2: "ca2b1f71ad504d24275976f8b4616b82", 4: 532 },   // base/-/n20/g2/moitie
  60: { 1: "07a74ea328969ef49344bcbbb2d18411", 2: "9f876dd7b1c8a98a08a27fbf0a69c782", 4: 272, 6: "1108297877", 7: "855858000/422825585/63870000", 8: "0/6/12" },   // camp/richeQuartz/n35/g2/toutes
  61: { 1: "c8bde33d5864b89fc4d38f6b298fca57", 2: "9c390e8846036dfc91e1a3c6d46d3b7d", 4: 303, 6: "532205717", 7: "855858000/550268069/17883600", 8: "0/3/6" },   // camp/richeQuartz/n35/g2/moitie
  62: { 1: "07a74ea328969ef49344bcbbb2d18411", 2: "00ab3470025e297260fd95f03d29dee8", 4: 272, 6: "1108297877", 7: "855858000/422825585/63870000", 8: "0/6/12" },   // camp/richeScorie/n35/g2/toutes
  63: { 1: "c8bde33d5864b89fc4d38f6b298fca57", 2: "08babf2bd71fe74dd25638f156c29f6a", 4: 303, 6: "532205717", 7: "855858000/550268069/17883600", 8: "0/3/6" },   // camp/richeScorie/n35/g2/moitie
  64: { 1: "72605aae18f5a10b6aaa94582ccbded0", 2: "9fcb575b95964d5cf24ffb1bf51b2c31", 4: 428, 6: "1710416794", 7: "1162434000/622968394/0" },   // avantPoste/richeQuartz/n35/g2/toutes
  65: { 1: "6e2f8db6f8f9bb292d34d96e2adb3b47", 2: "706c9667f79c710540543eb6aa922b7a", 4: 181, 6: "152292245", 7: "1162434000/789253454/0" },   // avantPoste/richeQuartz/n35/g2/moitie
  66: { 1: "72605aae18f5a10b6aaa94582ccbded0", 2: "724aa23e4cb634ed9c9089f3eb0fe21e", 4: 428, 6: "1710416794", 7: "1162434000/622968394/0" },   // avantPoste/richeScorie/n35/g2/toutes
  67: { 1: "6e2f8db6f8f9bb292d34d96e2adb3b47", 2: "d466041a70255bf77cfc85f7409ce359", 4: 181, 6: "152292245", 7: "1162434000/789253454/0" },   // avantPoste/richeScorie/n35/g2/moitie
  68: { 1: "4e1937393353ed2d6507e001be80074f", 2: "b1b2ad377912d6a201428ed9dc881de2", 4: 231, 6: "1593030960", 7: "1251852000/601127808/0" },   // base/-/n35/g2/toutes
  69: { 1: "99c7f8b7733df03dee42c19cce2472b6", 2: "583479afd022470c05f7203c36f8cdc4", 4: 192, 6: "481075580", 7: "1251852000/742704000/0" },   // base/-/n35/g2/moitie
  74: { 1: "a0108d445751120f1c654316f99d5306", 2: "05ebd1ab82fa8b569dcd7d458b5f57ee", 4: 248, 6: "57205613584", 7: "5069152500/3214118356/0", 8: "0/7/14" },   // avantPoste/richeQuartz/n50/g2/toutes
  75: { 1: "08a8de68bf3c5aee55533d9e83d8aa0f", 2: "d57c4d35872116ed6d6e9a2dc132f857", 4: 244, 6: "16032982562", 7: "5069152500/3924482591/0" },   // avantPoste/richeQuartz/n50/g2/moitie
  76: { 1: "a0108d445751120f1c654316f99d5306", 2: "28a239b4759e9ed076f36e07f168d61c", 4: 248, 6: "57205613584", 7: "5069152500/3214118356/0", 8: "0/7/14" },   // avantPoste/richeScorie/n50/g2/toutes
  77: { 1: "08a8de68bf3c5aee55533d9e83d8aa0f", 2: "cdaa62983aabb0f526dfd4c9e5e8d4a8", 4: 244, 6: "16032982562", 7: "5069152500/3924482591/0" },   // avantPoste/richeScorie/n50/g2/moitie
  78: { 1: "a63a3fcf3704d498a6bf26f36379b172", 2: "f411949b39b5ec39aac8f116bf0d31f0", 4: 310, 6: "47729755477", 7: "5602747500/3838632225/0", 8: "0/5/14" },   // base/-/n50/g2/toutes
  79: { 1: "099e06db0da307ef726e22cb93012824", 2: "f275cc5a53323911918a2a97142efd4e", 4: 197, 6: "7053047647", 7: "5602747500/4511649246/0", 8: "0/2/7" },   // base/-/n50/g2/moitie
  90: { 1: "40016b8a4536d8ef663a3ca9f81839e2", 2: "6be357767031857b703d87a27fde30bd", 4: 543, 5: "{\"quartz\":257822,\"scorie\":85940}", 6: "24939917", 7: "130566930/30031471/13155236" },   // camp/richeQuartz/n20/g3/toutes
  92: { 1: "40016b8a4536d8ef663a3ca9f81839e2", 2: "a260dac7361658807909f65b868fea3e", 4: 543, 5: "{\"quartz\":85940,\"scorie\":257822}", 6: "24939917", 7: "130566930/30031471/13155236" },   // camp/richeScorie/n20/g3/toutes
  94: { 1: "e6e6cd1b6956c993800aa05e47bd7c57", 2: "beae82913fc9af5532ce851e5dd5492b", 4: 381, 6: "27209072", 7: "211002000/66282285/12232000", 8: "0/10/13" },   // avantPoste/richeQuartz/n20/g3/toutes
  95: { 1: "f6213edb5d3b8512ffa600598633ab20", 2: "435eeeb20d169ecf059f0a5ca20889ce", 4: 302, 6: "14173566", 7: "211002000/106404311/0", 8: "0/5/7" },   // avantPoste/richeQuartz/n20/g3/moitie
  96: { 1: "e6e6cd1b6956c993800aa05e47bd7c57", 2: "1985b068d12baf863f2f05d26fdc1081", 4: 381, 6: "27209072", 7: "211002000/66282285/12232000", 8: "0/10/13" },   // avantPoste/richeScorie/n20/g3/toutes
  97: { 1: "f6213edb5d3b8512ffa600598633ab20", 2: "3e1800c9ec8cd307634e1afbcbe69dd7", 4: 302, 6: "14173566", 7: "211002000/106404311/0", 8: "0/5/7" },   // avantPoste/richeScorie/n20/g3/moitie
  98: { 1: "29b854cf353468d469396910a0d3746d", 2: "2d7404ba64ac95f5149e1a6a2153e029", 4: 353, 5: "{\"quartz\":0,\"scorie\":0}", 6: "24810356", 7: "226292000/81299275/0", 8: "0/13/14" },   // base/-/n20/g3/toutes
  99: { 1: "020ab9e36a9ddd9134fee0e4d8958855", 2: "b4357b224865ed2c99a8ecd32f37ea6a", 5: "{\"quartz\":1,\"scorie\":1}", 6: "6487903", 7: "226291695/133835642/4281200" },   // base/-/n20/g3/moitie
  100: { 1: "9a323ed178965dfc9afa8aefb44710de", 2: "8512db98988b4631b812b2fe6385f23b", 4: 308, 6: "1489727417", 7: "855858000/375637974/51096000", 8: "0/8/13" },   // camp/richeQuartz/n35/g3/toutes
  101: { 1: "246a0a207dc92d51dd6247af229e1ba0", 2: "eb46bf95169be0b86e4de6990fea7ebe", 4: 301, 6: "752654579", 7: "855858000/464275976/0", 8: "0/4/7" },   // camp/richeQuartz/n35/g3/moitie
  102: { 1: "9a323ed178965dfc9afa8aefb44710de", 2: "06472a29a750b107652c8ad9a634a82c", 4: 308, 6: "1489727417", 7: "855858000/375637974/51096000", 8: "0/8/13" },   // camp/richeScorie/n35/g3/toutes
  103: { 1: "246a0a207dc92d51dd6247af229e1ba0", 2: "05e12dd75fdffbad549dc186144df904", 4: 301, 6: "752654579", 7: "855858000/464275976/0", 8: "0/4/7" },   // camp/richeScorie/n35/g3/moitie
  104: { 1: "a915aa26f0a35dded708f28f678c5161", 2: "e618581ab777537a1ae19db4519b4501", 4: 284, 6: "1570780397", 7: "1162434000/659554488/0", 8: "0/9/14" },   // avantPoste/richeQuartz/n35/g3/toutes
  105: { 1: "8f42c57a9b4d3fb153917c127e837f0c", 2: "f1de35cd298ec0412ed3d248fdf98c66", 4: 190, 6: "476388813", 7: "1162434000/813944213/0", 8: "0/3/7" },   // avantPoste/richeQuartz/n35/g3/moitie
  106: { 1: "a915aa26f0a35dded708f28f678c5161", 2: "3d3baaf78e9fb77d0d6b822f190a579a", 4: 284, 6: "1570780397", 7: "1162434000/659554488/0", 8: "0/9/14" },   // avantPoste/richeScorie/n35/g3/toutes
  107: { 1: "8f42c57a9b4d3fb153917c127e837f0c", 2: "b0630fe420f15061a40e63d6cbb05200", 4: 190, 6: "476388813", 7: "1162434000/813944213/0", 8: "0/3/7" },   // avantPoste/richeScorie/n35/g3/moitie
  108: { 1: "41f5f68f6f61c7c608c02366b9621252", 2: "57df365249c32bede4a995bd4fc9962e", 4: 226, 6: "717242911", 7: "1251852000/767253850/0", 8: "0/4/14" },   // base/-/n35/g3/toutes
  109: { 1: "14df750a10b4141be25b25df482d8a1d", 2: "8773a972ebf3682cd72cf3edcb5bc45d", 6: "79795674", 7: "1251852000/944918098/0" },   // base/-/n35/g3/moitie
  114: { 1: "c73251cc1fa1f9cd982cc08db428dc59", 2: "95c80fd87d477a74fe4cf101b36e89b1", 4: 273, 6: "52601708961", 7: "5069152500/2932950496/0", 8: "0/7/14" },   // avantPoste/richeQuartz/n50/g3/toutes
  115: { 1: "5aabddef1ab143bbfa44ca47e26c2e70", 2: "b0c2d097465a4e957dd3ffec8f9e8b7a", 4: 312, 6: "39966039594", 7: "5069152500/3374765565/0", 8: "0/4/7" },   // avantPoste/richeQuartz/n50/g3/moitie
  116: { 1: "c73251cc1fa1f9cd982cc08db428dc59", 2: "3e83d3711234a1ff1719388d4aff2a46", 4: 273, 6: "52601708961", 7: "5069152500/2932950496/0", 8: "0/7/14" },   // avantPoste/richeScorie/n50/g3/toutes
  117: { 1: "5aabddef1ab143bbfa44ca47e26c2e70", 2: "57e830bfe43846368e92e61740b7571a", 4: 312, 6: "39966039594", 7: "5069152500/3374765565/0", 8: "0/4/7" },   // avantPoste/richeScorie/n50/g3/moitie
  118: { 1: "bb4c8007437ffc3b839510832f864e2a", 2: "cd0418640e7bccaf291b08d200ad021b", 4: 336, 6: "81233210586", 7: "5602747500/3902379454/0", 8: "0/4/14" },   // base/-/n50/g3/toutes
  119: { 1: "5cdcda3af173420537cb4f13578916c9", 2: "02a933426e2aabbd6320e3bc8d47323d", 4: 219, 6: "17975098646", 7: "5602747500/4294921573/0" },   // base/-/n50/g3/moitie
  130: { 1: "722f70347beeb73e742d171f19ffb3ce", 2: "045cf351b48df4f21d673459dc11706a", 4: 263, 6: "18784006", 7: "152900000/40160664/18348000" },   // camp/richeQuartz/n20/g4/toutes
  131: { 1: "6ee456c31901202e69111cc8dc9e8087", 2: "c3bef9c8cf07f677ba10f8e649769f53", 4: 558, 6: "12420411", 7: "152900000/64224085/0", 8: "0/4/7" },   // camp/richeQuartz/n20/g4/moitie
  132: { 1: "722f70347beeb73e742d171f19ffb3ce", 2: "19eb12b927f9e92d7f9917a003af2ac5", 4: 263, 6: "18784006", 7: "152900000/40160664/18348000" },   // camp/richeScorie/n20/g4/toutes
  133: { 1: "6ee456c31901202e69111cc8dc9e8087", 2: "584b847939c3f3e889f7d808572e4510", 4: 558, 6: "12420411", 7: "152900000/64224085/0", 8: "0/4/7" },   // camp/richeScorie/n20/g4/moitie
  134: { 1: "3e554b1bfe00e7300168e977f04aba5c", 2: "87813167ad17912720c71b8139833ade", 4: 353, 5: "{\"quartz\":38757,\"scorie\":12919}", 6: "22054543", 7: "208908178/87148696/0", 8: "0/10/14" },   // avantPoste/richeQuartz/n20/g4/toutes
  135: { 1: "22bb2cc9d1976ada490a544d96d477dc", 2: "b00faadb38bc7b41cf55d26c733e9a50", 4: 213, 6: "7468060", 7: "211002000/131021378/0", 8: "0/3/7" },   // avantPoste/richeQuartz/n20/g4/moitie
  136: { 1: "3e554b1bfe00e7300168e977f04aba5c", 2: "1b6a1d8cca328aadbd0903ee6fd2fdee", 4: 353, 5: "{\"quartz\":12919,\"scorie\":38757}", 6: "22054543", 7: "208908178/87148696/0", 8: "0/10/14" },   // avantPoste/richeScorie/n20/g4/toutes
  137: { 1: "22bb2cc9d1976ada490a544d96d477dc", 2: "856276ea287f6106b09d160064c1351d", 4: 213, 6: "7468060", 7: "211002000/131021378/0", 8: "0/3/7" },   // avantPoste/richeScorie/n20/g4/moitie
  138: { 1: "05fb0ad4a45776d39c4eb4da26513707", 2: "aab41f7b737bee1a46e7d4828eea76ac", 4: 488, 5: "{\"quartz\":17899,\"scorie\":17899}", 6: "25697205", 7: "221577943/73562574/8277199", 8: "0/13/12" },   // base/-/n20/g4/toutes
  139: { 1: "278fff2e3fe36cfd1e06895838a27c26", 2: "34a92d76d20b7cbb7390b7969a38fd31", 4: 226, 6: "9202546", 7: "226292000/122242312/0" },   // base/-/n20/g4/moitie
  140: { 1: "f61e1243de4cbe13ac913537e9f7d62e", 2: "5cdcadeaa5e2001b22c2442889dd4073", 4: 240, 6: "741952763", 7: "855858000/496796188/0" },   // camp/richeQuartz/n35/g4/toutes
  141: { 1: "16aaaaf68d18f4055c21395e7e331bf3", 2: "98e3aea1d3519cf45108c7835322e42e", 4: 210, 6: "500151451", 7: "855858000/580766015/0", 8: "0/3/7" },   // camp/richeQuartz/n35/g4/moitie
  142: { 1: "f61e1243de4cbe13ac913537e9f7d62e", 2: "4203006487f40adf972d32115edfdf97", 4: 240, 6: "741952763", 7: "855858000/496796188/0" },   // camp/richeScorie/n35/g4/toutes
  143: { 1: "16aaaaf68d18f4055c21395e7e331bf3", 2: "0c2e4f814df8db083a69ca3156c32d91", 4: 210, 6: "500151451", 7: "855858000/580766015/0", 8: "0/3/7" },   // camp/richeScorie/n35/g4/moitie
  149: { 2: "4254b3aca21197217e9217b823c44792" },   // base/-/n35/g4/moitie
  150: { 1: "24fa4dd1d4b729983bc344387ab65aef", 2: "e09a9f7b56571468e256cf0b3a669504", 4: 310, 6: "63399166493", 7: "3788524500/2141033431/0" },   // camp/richeQuartz/n50/g4/toutes
  151: { 1: "de36c650d7354676a50c3c0cf9c90934", 2: "2983be4c095f10eeecc3b2e5a2d121e6", 4: 170, 6: "6203967059", 7: "3788524500/2483885393/0", 8: "0/1/7" },   // camp/richeQuartz/n50/g4/moitie
  152: { 1: "24fa4dd1d4b729983bc344387ab65aef", 2: "e247f694b2419d091b6a72f7e824f411", 4: 310, 6: "63399166493", 7: "3788524500/2141033431/0" },   // camp/richeScorie/n50/g4/toutes
  153: { 1: "de36c650d7354676a50c3c0cf9c90934", 2: "7f5c16c6bd0110c0ecc315bb57850bd4", 4: 170, 6: "6203967059", 7: "3788524500/2483885393/0", 8: "0/1/7" },   // camp/richeScorie/n50/g4/moitie
  154: { 1: "2beb20f831a2a8a00a479f0e475f08b5", 2: "fd70ae5c8ab5f3d611ed000a91eb64e7", 4: 272, 6: "40757577024", 7: "5069152500/2772792855/170750400", 8: "0/9/12" },   // avantPoste/richeQuartz/n50/g4/toutes
  155: { 1: "a880d7cc7f656e85495a5962f5ba23b2", 2: "fcb04594f69228ad32eb13a8826061fa", 4: 248, 6: "12147048625", 7: "5069152500/3701866769/0", 8: "0/4/7" },   // avantPoste/richeQuartz/n50/g4/moitie
  156: { 1: "2beb20f831a2a8a00a479f0e475f08b5", 2: "32012f8fcd0049f4d1f0689adfd3d0e3", 4: 272, 6: "40757577024", 7: "5069152500/2772792855/170750400", 8: "0/9/12" },   // avantPoste/richeScorie/n50/g4/toutes
  157: { 1: "a880d7cc7f656e85495a5962f5ba23b2", 2: "f5b5543ca31f1e037cc04f3d0b0cd834", 4: 248, 6: "12147048625", 7: "5069152500/3701866769/0", 8: "0/4/7" },   // avantPoste/richeScorie/n50/g4/moitie
  158: { 1: "6f19144652bdcd3a2d23dcff4f6b536c", 2: "1d528124edc166ee0894f53691269da3", 4: 228, 6: "27627136262", 7: "5602747500/3517181959/0" },   // base/-/n50/g4/toutes
  159: { 1: "64bd6fb5edb9e87542f1f2d69b8d3961", 2: "581049e4ca145b03fff8bb527efa8eaf", 4: 173, 6: "6095311797", 7: "5602747500/3834550915/0" },   // base/-/n50/g4/moitie
  170: { 1: "c491e13413b033412dfd19c7120de58b", 2: "8a5a46d2ea0a27ff3ce41179ecf0f47f", 4: 547, 5: "{\"quartz\":229691,\"scorie\":76563}", 6: "23915265", 7: "127861096/20527950/28722075", 8: "3/11/9" },   // camp/richeQuartz/n20/g5/toutes
  171: { 1: "08fedaeefbc5d46679b03fbd21dd2c2c", 2: "6f84bfa6695b9d524eecc3355b7e8032", 4: 322, 6: "10145183", 7: "152900000/55846764/0" },   // camp/richeQuartz/n20/g5/moitie
  172: { 1: "c491e13413b033412dfd19c7120de58b", 2: "71158ea955b2f29f9c8887c73b79a546", 4: 547, 5: "{\"quartz\":76563,\"scorie\":229691}", 6: "23915265", 7: "127861096/20527950/28722075", 8: "3/11/9" },   // camp/richeScorie/n20/g5/toutes
  173: { 1: "08fedaeefbc5d46679b03fbd21dd2c2c", 2: "ea35c5dd5094a097e5ad7cdc87232e9c", 4: 322, 6: "10145183", 7: "152900000/55846764/0" },   // camp/richeScorie/n20/g5/moitie
  174: { 1: "5073c74ed9c4282e4ac89066691f1495", 2: "029bd2bbc52015a50686ba1d57f0f7ce", 4: 320, 6: "26275951", 7: "211002000/69370208/12232000", 8: "0/11/13" },   // avantPoste/richeQuartz/n20/g5/toutes
  175: { 1: "65c826b2edf3ca59ea7d8bc134ad4b76", 2: "ec38ee983944de79311362feff6b03dc", 4: 267 },   // avantPoste/richeQuartz/n20/g5/moitie
  176: { 1: "5073c74ed9c4282e4ac89066691f1495", 2: "f58cc204e925d9acbf84d466905633ab", 4: 320, 6: "26275951", 7: "211002000/69370208/12232000", 8: "0/11/13" },   // avantPoste/richeScorie/n20/g5/toutes
  177: { 1: "65c826b2edf3ca59ea7d8bc134ad4b76", 2: "28b846f5c61462d80a26495ab5f59eda", 4: 267 },   // avantPoste/richeScorie/n20/g5/moitie
  178: { 1: "de37ed4ee32993f0336fb2ded833a040", 2: "d91df3ad0d7689feeba44dde03b23364", 4: 250, 6: "15776317", 7: "226292000/108124206/18348000" },   // base/-/n20/g5/toutes
  179: { 1: "b61eda9f52040442f0539790afcc53b5", 2: "ae692c79d403b75a642a2b364ce5882a", 4: 285, 6: "10794819", 7: "226292000/119152598/0", 8: "0/4/7" },   // base/-/n20/g5/moitie
  180: { 1: "67992783326903c004e5a133ba8a8b39", 2: "e260da733888fd23d8eb3ea239ee44c5", 4: 377, 5: "{\"quartz\":0,\"scorie\":0}", 6: "725879912", 7: "855858000/357171176/0", 8: "0/7/14" },   // camp/richeQuartz/n35/g5/toutes
  181: { 1: "1364cb7433b4bb9008e553680e67ef98", 2: "4fba304493cbf11b99983d85c9ba0f98", 4: 530, 6: "149261062", 7: "855858000/517051714/0" },   // camp/richeQuartz/n35/g5/moitie
  182: { 1: "67992783326903c004e5a133ba8a8b39", 2: "458e4359a321d071fb2d0461742cd5a5", 4: 377, 5: "{\"quartz\":0,\"scorie\":0}", 6: "725879912", 7: "855858000/357171176/0", 8: "0/7/14" },   // camp/richeScorie/n35/g5/toutes
  183: { 1: "1364cb7433b4bb9008e553680e67ef98", 2: "fa142dc13191de4da7ddf4db4a825ee4", 4: 530, 6: "149261062", 7: "855858000/517051714/0" },   // camp/richeScorie/n35/g5/moitie
  184: { 1: "9cf4e2571ca2ac28d5d6fe0388171b93", 2: "f4c05f9ec06a3d59a2b5d505a078da5c", 4: 239, 6: "1160488018", 7: "1162434000/621695303/0", 8: "0/4/14" },   // avantPoste/richeQuartz/n35/g5/toutes
  185: { 1: "9e488d41f1b43674b29bd51fecb4a6e8", 2: "6064195c1da78999e842517052f3c888", 4: 265, 6: "412117745", 7: "1162434000/682685970/0" },   // avantPoste/richeQuartz/n35/g5/moitie
  186: { 1: "9cf4e2571ca2ac28d5d6fe0388171b93", 2: "1fa5839a0e2ea0f326599897f353e2cd", 4: 239, 6: "1160488018", 7: "1162434000/621695303/0", 8: "0/4/14" },   // avantPoste/richeScorie/n35/g5/toutes
  187: { 1: "9e488d41f1b43674b29bd51fecb4a6e8", 2: "ba807465f1bccedb8c5d191c66d101ba", 4: 265, 6: "412117745", 7: "1162434000/682685970/0" },   // avantPoste/richeScorie/n35/g5/moitie
  188: { 1: "69279c93e43ce2cc39cc81427dfbba63", 2: "93f8dc56936ca38548f23aef15119f28", 4: 471, 6: "2463680714", 7: "1251852000/554745750/0", 8: "0/12/14" },   // base/-/n35/g5/toutes
  189: { 1: "50694ca4f9ca54894be5dd494edbd4be", 2: "8aec0458135e4819dd78c77c3e0cacc6", 4: 388, 6: "1018486634", 7: "1251852000/771742003/0" },   // base/-/n35/g5/moitie
  190: { 1: "2fc79e479b88b2986a0e5009995273cc", 2: "db175f20b30c816901932b8ef55f5375", 4: 284, 6: "86955715689", 7: "3788524500/1859305659/0" },   // camp/richeQuartz/n50/g5/toutes
  191: { 1: "9c579d386f4a4f0fc1853bb6e20b247a", 2: "69c9ca1590bb11aa19a4c3596943a8c9", 4: 182, 6: "7703586726", 7: "3788524500/2335907819/0", 8: "0/2/7" },   // camp/richeQuartz/n50/g5/moitie
  192: { 1: "2fc79e479b88b2986a0e5009995273cc", 2: "9ebd2086abd7560f1d8d77ca3636f99b", 4: 284, 6: "86955715689", 7: "3788524500/1859305659/0" },   // camp/richeScorie/n50/g5/toutes
  193: { 1: "9c579d386f4a4f0fc1853bb6e20b247a", 2: "72952c03428493968977d7b182152154", 4: 182, 6: "7703586726", 7: "3788524500/2335907819/0", 8: "0/2/7" },   // camp/richeScorie/n50/g5/moitie
  194: { 1: "cc5fc545872b54c45590d15869efec32", 2: "ef46498984815383a2579e9f9efdbd7d", 4: 353, 6: "57442667906", 7: "5069152500/3288611477/0" },   // avantPoste/richeQuartz/n50/g5/toutes
  195: { 1: "36b5dcf9fba9389951f1473dd8fc0954", 2: "c90798182b30b6bc305d1eabaa08aab9", 4: 178, 6: "9709968505", 7: "5069152500/3623354280/0", 8: "0/1/7" },   // avantPoste/richeQuartz/n50/g5/moitie
  196: { 1: "cc5fc545872b54c45590d15869efec32", 2: "2445feba03e1d2f392d487c45cafab77", 4: 353, 6: "57442667906", 7: "5069152500/3288611477/0" },   // avantPoste/richeScorie/n50/g5/toutes
  197: { 1: "36b5dcf9fba9389951f1473dd8fc0954", 2: "97fdb814869bea30b922f337a7200a84", 4: 178, 6: "9709968505", 7: "5069152500/3623354280/0", 8: "0/1/7" },   // avantPoste/richeScorie/n50/g5/moitie
  198: { 1: "6f05c9ddd68260be0d5e3e450a216e8e", 2: "6922f1581a0d8f69cc799c6d652b1a0d", 4: 363, 6: "71967906127", 7: "5602747500/4266751398/0" },   // base/-/n50/g5/toutes
  199: { 1: "12a262fdbf019aa4629c407a4e4b33fb", 2: "7e36ecac371ab9a409204db6ddfc5c16", 4: 198, 6: "8227997921", 7: "5602747500/4653813716/0" },   // base/-/n50/g5/moitie
};

/**
 * ⚠⚠ LOT BARÈME-ET-REJEU (12/09) : LA PREMIÈRE COUCHE POSÉE SUR LA CAPTURE DU
 * LOT APPROCHE, ET C'EST UNE COUCHE, PAS UNE RECAPTURE. Le chevauchement allié
 * est interdit depuis ce lot-là — une entité ne flue plus dans la sous-case
 * d'une alliée, ni à la verticale ni à la latérale — et son compteur de repli
 * est GELÉ tant qu'une alliée la bloque. Les deux cents combats bougent donc.
 *
 * ⚠⚠ 1 089 CHAMPS SUR 1 600, DONC 511 RESTENT ADOSSÉS À LA CAPTURE D'APPROCHE.
 * Aucun des deux cents combats n'est intact, mais la couche ne couvre que
 * **68 %** de la table : c'est sous les 71 % qui avaient rendu la recapture
 * inévitable au lot APPROCHE, donc il y a encore quelque chose à adosser.
 *
 * ⚠⚠ ET SURTOUT, UNE RECAPTURE SERAIT ILLÉGITIME ICI, QUOI QUE DISE LE COMPTE.
 * Le §7 du brief PAQUETS prescrit la procédure : on ne recapture qu'APRÈS avoir
 * prouvé, par `T1 bis`, que le MOTEUR n'a pas bougé. Ce lot-ci change très
 * exactement le moteur ; la preuve ne peut donc pas être produite, et la seule
 * issue est d'empiler. **Le prochain lot qui touchera au combat empilera une
 * SECONDE couche là-dessus.**
 *
 * ⚠⚠ L'ATTRIBUTION EST MESURÉE, PAS DÉDUITE. En remettant le seul
 * `src/sim/combat.js` du livrable pristine de `main` = `f6fb04e` sous le reste
 * du lot, les deux cents combats rendent **0 écart sur 1 600 champs** contre la
 * capture d'APPROCHE : ni le barème de défense (§1) ni le refus d'améliorer une
 * pièce abîmée (§2) ne déplacent un seul bit. `DEFENSES[x].points` n'est lu ni
 * par `sim/generateur.js` ni par `sim/combat.js` — seul `UNITES[x].points`
 * l'est, au remplissage de la vague attaquante.
 *
 * ⚠⚠ ET SIX CAUSES DE FIN BOUGENT, DANS TROIS SENS DIFFÉRENTS — c'est ce qui dit
 * qu'il ne s'agit pas d'un allongement uniforme :
 *
 *   14 · 16   avantPoste/n20/g1   `duree` 900      → `attaquants` 429
 *   170 · 172 camp/n20/g5         `attaquants` 523 → `duree` 900
 *   174 · 176 avantPoste/n20/g5   `attaquants` 485 → **`souche` 727**
 *
 * Deux raids CESSENT de buter sur le plafond de 900 et se concluent ; deux s'y
 * mettent ; et deux RASENT leur site là où ils y perdaient toute leur armée. Un
 * ralentissement uniforme n'aurait fait bouger aucune cause dans le bon sens.
 */
export const COMBATS_DEPLACES_PAR_BAREME_ET_REJEU = {
  0: { 1: "f6aa856e32aff4848113fafe7d0cf231", 2: "9d92a165179f1ad6fb30087ebfcafd8f", 4: 227, 7: "11336048/0/18378885" },   // camp/richeQuartz/n5/g1/toutes
  1: { 1: "287ada7e4a73603e650ffc0bfe646170", 2: "8a074751cff460d7e80b132c9ab934f7", 4: 501, 5: "{\"quartz\":173,\"scorie\":57}", 7: "19485840/0/6470535" },   // camp/richeQuartz/n5/g1/moitie
  2: { 1: "f6aa856e32aff4848113fafe7d0cf231", 2: "6cbb3d0668cb3e50409eda19ff2e2a12", 4: 227, 7: "11336048/0/18378885" },   // camp/richeScorie/n5/g1/toutes
  3: { 1: "287ada7e4a73603e650ffc0bfe646170", 2: "6d69e0d2aa6e475ecd61ec1c269d72b2", 4: 501, 5: "{\"quartz\":57,\"scorie\":173}", 7: "19485840/0/6470535" },   // camp/richeScorie/n5/g1/moitie
  4: { 1: "aec331952b119e00bb1a9381030faa6b", 2: "e653004cd205988e944e8db956f589c1", 4: 325, 7: "10980000/0/16458569" },   // avantPoste/richeQuartz/n5/g1/toutes
  5: { 1: "b4d6c0c0db68b6e7e4285c8005c48754", 2: "99c8b76b9a59e875b14183f9ffb7a71c", 4: 573, 6: "115544", 7: "19032000/410207/3589766", 8: "4/4/2" },   // avantPoste/richeQuartz/n5/g1/moitie
  6: { 1: "aec331952b119e00bb1a9381030faa6b", 2: "d37d593239726ff38ceaec6653633e75", 4: 325, 7: "10980000/0/16458569" },   // avantPoste/richeScorie/n5/g1/toutes
  7: { 1: "b4d6c0c0db68b6e7e4285c8005c48754", 2: "83199257e96268a146029690a385e8bb", 4: 573, 6: "115544", 7: "19032000/410207/3589766", 8: "4/4/2" },   // avantPoste/richeScorie/n5/g1/moitie
  8: { 1: "91663e52b904a34be3c49ca6e96c36cb", 2: "29f1edc6ee4f913f34a2e2eb53c4f072", 4: 339, 7: "10980000/0/16398327" },   // base/-/n5/g1/toutes
  9: { 1: "95bdb178403f84d046dd1616f8c23996", 2: "d01ba098eabfb4767e1f1fbcbf9cff3e", 4: 407, 6: "104404", 7: "20496000/1889475/3140243", 8: "4/4/3" },   // base/-/n5/g1/moitie
  10: { 1: "314a18dd1ef8f1724fbe413c5c7924c0", 2: "839adfa9dac281f074ed8c3bb84335d6", 4: 661, 5: "{\"quartz\":2312,\"scorie\":770}", 6: "24160562", 7: "152493906/22976197/378453", 8: "0/11/13" },   // camp/richeQuartz/n20/g1/toutes
  11: { 1: "0e09f2567569024f1e3ec4285ebeaf23", 2: "3177cbe9b25829ada407c8e7c5ea88d8", 4: 392, 6: "11385351", 7: "152900000/64406691/0" },   // camp/richeQuartz/n20/g1/moitie
  12: { 1: "314a18dd1ef8f1724fbe413c5c7924c0", 2: "271664811b83c59d61eb618e1ddfa7cf", 4: 661, 5: "{\"quartz\":770,\"scorie\":2312}", 6: "24160562", 7: "152493906/22976197/378453", 8: "0/11/13" },   // camp/richeScorie/n20/g1/toutes
  13: { 1: "0e09f2567569024f1e3ec4285ebeaf23", 2: "e92a898f16b83df5867032362146a61b", 4: 392, 6: "11385351", 7: "152900000/64406691/0" },   // camp/richeScorie/n20/g1/moitie
  14: { 1: "017f309d764021ea64c25050fc41a6d4", 2: "759abcdc405d5ef094df1752a4c65a58", 3: "attaquants", 4: 429, 5: "{\"quartz\":0,\"scorie\":0}", 6: "30281484", 7: "211002000/84146547/0", 8: "0/12/14" },   // avantPoste/richeQuartz/n20/g1/toutes
  15: { 1: "dc0474ee915e9ebdf41ef17fc4b44e5a", 2: "23345d7eb6cb0248d9b0b0e5f1510362", 4: 236, 6: "3757123", 7: "211002000/139178456/0" },   // avantPoste/richeQuartz/n20/g1/moitie
  16: { 1: "017f309d764021ea64c25050fc41a6d4", 2: "5e32afd8575d55d0444140706ca9a67e", 3: "attaquants", 4: 429, 5: "{\"quartz\":0,\"scorie\":0}", 6: "30281484", 7: "211002000/84146547/0", 8: "0/12/14" },   // avantPoste/richeScorie/n20/g1/toutes
  17: { 1: "dc0474ee915e9ebdf41ef17fc4b44e5a", 2: "2c97d31348e208ef5378f6f242e3aaf3", 4: 236, 6: "3757123", 7: "211002000/139178456/0" },   // avantPoste/richeScorie/n20/g1/moitie
  18: { 1: "8c6cd11f96fb162ef91375554afc88bc", 2: "69d255fcae0156d04512fdf3251efd64", 4: 563, 6: "25671096", 7: "226292000/102106319/0", 8: "0/10/14" },   // base/-/n20/g1/toutes
  19: { 1: "fd9ddcc5665b8a337af35d8793d4a0a4", 2: "52c18d67129add72eb1ccc5e7c3ad933", 4: 319, 6: "4955447", 7: "226292000/147657721/0", 8: "0/2/7" },   // base/-/n20/g1/moitie
  20: { 1: "4c81b02966104e86e26e62ca451c7bc4", 2: "e6de7a9e56356ad09a35d0b61fd3c80c", 4: 464, 5: "{\"quartz\":441624,\"scorie\":147208}", 6: "2320393429", 7: "853621224/331102230/16315253", 8: "0/12/13" },   // camp/richeQuartz/n35/g1/toutes
  21: { 1: "573071755deb4de30a707ec6f15c3986", 2: "a950d7c03449e1f9ef934ecf6e918a0c", 4: 324, 6: "695213679", 7: "855858000/506248497/0", 8: "0/4/7" },   // camp/richeQuartz/n35/g1/moitie
  22: { 1: "4c81b02966104e86e26e62ca451c7bc4", 2: "a11c73de9370071aef4fc4fb8c92503b", 4: 464, 5: "{\"quartz\":147208,\"scorie\":441624}", 6: "2320393429", 7: "853621224/331102230/16315253", 8: "0/12/13" },   // camp/richeScorie/n35/g1/toutes
  23: { 1: "573071755deb4de30a707ec6f15c3986", 2: "1afee83fc44d4d88bcfe920fa76bc9f1", 4: 324, 6: "695213679", 7: "855858000/506248497/0", 8: "0/4/7" },   // camp/richeScorie/n35/g1/moitie
  24: { 1: "3ae550df78024de82072d5bb5e4a9a7a", 2: "442804a6dc87bac14fce5b5f00cd3184", 4: 281, 6: "1564835287", 7: "1162434000/585260207/0", 8: "0/10/14" },   // avantPoste/richeQuartz/n35/g1/toutes
  25: { 1: "1de2be73072d0a76b0fc00c453b6d48f", 2: "46e74812659c270e04c4070e67306bf9", 4: 192, 6: "473359857", 7: "1162434000/717436142/0" },   // avantPoste/richeQuartz/n35/g1/moitie
  26: { 1: "3ae550df78024de82072d5bb5e4a9a7a", 2: "38cff6e174e37b2070123864d63a6b4f", 4: 281, 6: "1564835287", 7: "1162434000/585260207/0", 8: "0/10/14" },   // avantPoste/richeScorie/n35/g1/toutes
  27: { 1: "1de2be73072d0a76b0fc00c453b6d48f", 2: "7d67c9823292428cfc0be6507872c318", 4: 192, 6: "473359857", 7: "1162434000/717436142/0" },   // avantPoste/richeScorie/n35/g1/moitie
  28: { 1: "fbb4573de92339e4ea8e1114e2613f0f", 2: "bca5e0038880dfe3892a3472cf8c928c", 4: 623, 6: "843762711", 7: "1251852000/684766586/0", 8: "0/6/14" },   // base/-/n35/g1/toutes
  29: { 1: "c217177374bc419adc482eb9cad2a84c", 2: "d04e0284f4234abe308145b506137ee8", 4: 277, 6: "481905816", 7: "1251852000/801980147/0", 8: "0/3/7" },   // base/-/n35/g1/moitie
  30: { 1: "f6a4c655b684be23ab9f0ec4a2953862", 2: "2935ca6355342dd7ae254f0588934e00", 4: 356, 6: "110649439164", 7: "3788524500/1657676295/0", 8: "0/12/14" },   // camp/richeQuartz/n50/g1/toutes
  31: { 1: "5a8abbcbc92dd174cfd15c7b5ef656fb", 2: "89ee6c9e9e9ac952e466f0a8fd7e5e92", 4: 244, 6: "16525532572", 7: "3788524500/2457057606/0" },   // camp/richeQuartz/n50/g1/moitie
  32: { 1: "f6a4c655b684be23ab9f0ec4a2953862", 2: "a7459bc82158661d8fee5244583b5766", 4: 356, 6: "110649439164", 7: "3788524500/1657676295/0", 8: "0/12/14" },   // camp/richeScorie/n50/g1/toutes
  33: { 1: "5a8abbcbc92dd174cfd15c7b5ef656fb", 2: "5610a296c12692653d2dbd9a8dd54d12", 4: 244, 6: "16525532572", 7: "3788524500/2457057606/0" },   // camp/richeScorie/n50/g1/moitie
  34: { 1: "728abe938c2f3d9f08e0749782e25a0a", 2: "03f326d5c8b189192b17d56d716256f9", 4: 259, 5: "{\"quartz\":0,\"scorie\":0}", 6: "80030777123", 7: "5069152500/3099034983/0", 8: "0/9/14" },   // avantPoste/richeQuartz/n50/g1/toutes
  35: { 1: "44324dfb2264deee18dee32aea230a34", 2: "4aa789fd4a4f6ce4b87a1977b14f694e", 4: 215, 6: "52352695746", 7: "5069152500/3469772360/0" },   // avantPoste/richeQuartz/n50/g1/moitie
  36: { 1: "728abe938c2f3d9f08e0749782e25a0a", 2: "9085d2cd40b04506f407a2caac5f706f", 4: 259, 5: "{\"quartz\":0,\"scorie\":0}", 6: "80030777123", 7: "5069152500/3099034983/0", 8: "0/9/14" },   // avantPoste/richeScorie/n50/g1/toutes
  37: { 1: "44324dfb2264deee18dee32aea230a34", 2: "6e1b0cde1d5e9061adb7c8cc000660c0", 4: 215, 6: "52352695746", 7: "5069152500/3469772360/0" },   // avantPoste/richeScorie/n50/g1/moitie
  38: { 1: "37d1142f0bb34ede72aa689f5230fc43", 2: "a14105cf6172c66c3befff07b223241e", 4: 401, 6: "81765466365", 7: "5602747500/4331812490/0" },   // base/-/n50/g1/toutes
  39: { 1: "ec1602ff2a66c2f63e20675df3ca9db1", 2: "51a99b8606fb07e5b7b6863f6898b93e", 6: "8999099846", 7: "5602747500/4813191606/0" },   // base/-/n50/g1/moitie
  40: { 1: "bf781394217f517e3ce3ee7cd6a99b52", 2: "23158c674c75623d62ce2a748f2b42c2", 4: 242, 7: "13500424/0/17746311" },   // camp/richeQuartz/n5/g2/toutes
  41: { 1: "13255f692d369372b86217b64ddd8ba1", 2: "6e949c393e7fd23573472d5388830aa4", 4: 513, 5: "{\"quartz\":235,\"scorie\":78}", 6: "75360", 7: "18604890/0/6407884", 8: "0/3/0" },   // camp/richeQuartz/n5/g2/moitie
  42: { 1: "bf781394217f517e3ce3ee7cd6a99b52", 2: "511bd346604dfebbf7702843f48b95ac", 4: 242, 7: "13500424/0/17746311" },   // camp/richeScorie/n5/g2/toutes
  43: { 1: "13255f692d369372b86217b64ddd8ba1", 2: "9aef49d16944fb627d1f253342540eb9", 4: 513, 5: "{\"quartz\":78,\"scorie\":235}", 6: "75360", 7: "18604890/0/6407884", 8: "0/3/0" },   // camp/richeScorie/n5/g2/moitie
  44: { 1: "eee9fd238a39981a1837da85c7be0611", 2: "261c87f9cad29c6f0b1e1b039f2fc62a", 4: 409, 7: "5124000/0/18783709" },   // avantPoste/richeQuartz/n5/g2/toutes
  45: { 1: "637926d11f74a4ab10fd23e31818102f", 2: "b7c920334042d668d06fdbb97640b0c9", 4: 421, 6: "77763", 7: "17568000/1951517/4660755", 8: "5/3/2" },   // avantPoste/richeQuartz/n5/g2/moitie
  46: { 1: "eee9fd238a39981a1837da85c7be0611", 2: "7320900b24ae8c43ac9462cf1d9d0f7a", 4: 409, 7: "5124000/0/18783709" },   // avantPoste/richeScorie/n5/g2/toutes
  47: { 1: "637926d11f74a4ab10fd23e31818102f", 2: "ba3ace5184236345579ffc9c6d6e1af5", 4: 421, 6: "77763", 7: "17568000/1951517/4660755", 8: "5/3/2" },   // avantPoste/richeScorie/n5/g2/moitie
  48: { 1: "6e7ecd6b3b03606e7355abc00c15c541", 2: "f224bab2657bfd39e42044adbd7c9012", 4: 299, 7: "8476115/0/14099899", 8: "5/6/3" },   // base/-/n5/g2/toutes
  49: { 1: "6c71ee19f7011088cc959ea14644538a", 2: "9939bb6775b0112fc89c00acc5dabab2", 4: 482, 5: "{\"quartz\":4390,\"scorie\":2261}", 6: "129161", 7: "18238033/879495/1631937" },   // base/-/n5/g2/moitie
  50: { 1: "547c3b44613034efe7b609fa2b4a7324", 2: "b9e7e2b75c8fc8279a32c8719306f484", 4: 586, 5: "{\"quartz\":59921,\"scorie\":19973}", 6: "28524023", 7: "139236444/25794762/20356430", 8: "1/11/10" },   // camp/richeQuartz/n20/g2/toutes
  51: { 1: "ed5e73aba6a0fbed44ddccbafe80aa4d", 2: "fe68d9838df7d80dc1d091d105404386", 4: 591, 5: "{\"quartz\":376,\"scorie\":125}", 6: "15237260", 7: "152679523/62924429/1860235", 8: "0/5/6" },   // camp/richeQuartz/n20/g2/moitie
  52: { 1: "547c3b44613034efe7b609fa2b4a7324", 2: "7a760e15a915819035d46e27c2d731ab", 4: 586, 5: "{\"quartz\":19973,\"scorie\":59921}", 6: "28524023", 7: "139236444/25794762/20356430", 8: "1/11/10" },   // camp/richeScorie/n20/g2/toutes
  53: { 1: "ed5e73aba6a0fbed44ddccbafe80aa4d", 2: "5f5e65e9fcf0e6c9623a3f7d7d1ad26d", 4: 591, 5: "{\"quartz\":125,\"scorie\":376}", 6: "15237260", 7: "152679523/62924429/1860235", 8: "0/5/6" },   // camp/richeScorie/n20/g2/moitie
  54: { 1: "a137410a6dcb41987f5f87fd6cd66233", 2: "f969d76b39854dbd92e3b005b0d0fac1", 4: 524, 6: "24350889", 7: "211002000/60239820/0", 8: "0/13/14" },   // avantPoste/richeQuartz/n20/g2/toutes
  55: { 1: "39f96167749351f97c27012e9ca68665", 2: "fd62a0e1be185e26489b5fd4a4d21840", 4: 266, 6: "6876052", 7: "211002000/114880740/0" },   // avantPoste/richeQuartz/n20/g2/moitie
  56: { 1: "a137410a6dcb41987f5f87fd6cd66233", 2: "90c7a1151991fa4fbb5afd99467cdfcf", 4: 524, 6: "24350889", 7: "211002000/60239820/0", 8: "0/13/14" },   // avantPoste/richeScorie/n20/g2/toutes
  57: { 1: "39f96167749351f97c27012e9ca68665", 2: "1ba92ecc291167659715aef594ae9363", 4: 266, 6: "6876052", 7: "211002000/114880740/0" },   // avantPoste/richeScorie/n20/g2/moitie
  58: { 1: "670a41cb1a470dad3130e4ca60923785", 2: "8f9465e5c9406ecf44e24eaff28d80d5", 4: 285, 6: "18881189", 7: "226292000/111415603/0", 8: "0/7/14" },   // base/-/n20/g2/toutes
  59: { 1: "4b27b2284967eb793c345d58be8e3af8", 2: "892db6744534440e9a4ead141fefefa2", 4: 301, 6: "11771458", 7: "226292000/130467718/0" },   // base/-/n20/g2/moitie
  60: { 1: "644cb8161e6617989a70c3caa900ac61", 2: "03e2133c2b7b5f6b0a2eb9c99a85e8e8", 4: 421, 6: "2248212613", 7: "855858000/227534007/0", 8: "0/12/14" },   // camp/richeQuartz/n35/g2/toutes
  61: { 1: "9ed0548752118e5aee3602725668740d", 2: "1e88d603b197f5c3083af705e351c065", 4: 357, 6: "1064357005", 7: "855858000/427902789/0" },   // camp/richeQuartz/n35/g2/moitie
  62: { 1: "644cb8161e6617989a70c3caa900ac61", 2: "df016ca693c99c1f3b9e39c0b5620990", 4: 421, 6: "2248212613", 7: "855858000/227534007/0", 8: "0/12/14" },   // camp/richeScorie/n35/g2/toutes
  63: { 1: "9ed0548752118e5aee3602725668740d", 2: "c0b69e1a63dc650cc58e721948409d97", 4: 357, 6: "1064357005", 7: "855858000/427902789/0" },   // camp/richeScorie/n35/g2/moitie
  64: { 1: "ce16d67388d4adb30718d86971692c10", 2: "a506ca60bfd493cb0fb805bbd0a82ebf", 4: 409, 6: "1569411522", 7: "1162434000/679986740/0" },   // avantPoste/richeQuartz/n35/g2/toutes
  65: { 1: "a544a8ced3736cc8e1a02870c48104e7", 2: "a8e5bbf2841b7587e9f681d09b96fdd0", 4: 307, 6: "891202049", 7: "1162434000/770902876/0" },   // avantPoste/richeQuartz/n35/g2/moitie
  66: { 1: "ce16d67388d4adb30718d86971692c10", 2: "a02173c8aa399982d74ec19db8e9e07a", 4: 409, 6: "1569411522", 7: "1162434000/679986740/0" },   // avantPoste/richeScorie/n35/g2/toutes
  67: { 1: "a544a8ced3736cc8e1a02870c48104e7", 2: "cc3b4389f30d208bb12d2e8e2b99a864", 4: 307, 6: "891202049", 7: "1162434000/770902876/0" },   // avantPoste/richeScorie/n35/g2/moitie
  68: { 1: "58cc4f3f2d3d7397422a5a5ebf398da0", 2: "9484d3feffd6687900dfd7212eb723fe", 4: 373, 6: "1197574296", 7: "1251852000/652511064/0", 8: "0/9/14" },   // base/-/n35/g2/toutes
  69: { 1: "93b2f3bbe3e323ee2677f5f11c8ecc0b", 2: "bfed86a755f0444738b1b186b456fd2b", 4: 281, 6: "635311841", 7: "1251852000/773892287/0", 8: "0/4/7" },   // base/-/n35/g2/moitie
  70: { 1: "62994ff933ab2672af719be26337529d", 2: "b2af5badcdbc6100d50929a943c45d66", 4: 209, 6: "46862241068", 7: "3788524500/2486174470/0", 8: "0/4/14" },   // camp/richeQuartz/n50/g2/toutes
  71: { 1: "a8a99232844499b26842d17cf1eb6cf7", 2: "31c45638f75f441f1bb97993cb31602c", 4: 188, 6: "20182404725", 7: "3788524500/2673652188/0" },   // camp/richeQuartz/n50/g2/moitie
  72: { 1: "62994ff933ab2672af719be26337529d", 2: "784d687d6312d0940ed1151547837fdb", 4: 209, 6: "46862241068", 7: "3788524500/2486174470/0", 8: "0/4/14" },   // camp/richeScorie/n50/g2/toutes
  73: { 1: "a8a99232844499b26842d17cf1eb6cf7", 2: "a434057689684f4a3f42e76b90a0437b", 4: 188, 6: "20182404725", 7: "3788524500/2673652188/0" },   // camp/richeScorie/n50/g2/moitie
  74: { 1: "34b73addd5f3cee73f2e898887ad8d36", 2: "0ed0d0bc90709d0fd564bb973b587fe3", 6: "34024009049", 7: "5069152500/3544737932/0" },   // avantPoste/richeQuartz/n50/g2/toutes
  75: { 1: "c91610d8b8c7ec94ff55f465a5a090f7", 2: "111bda8fac253587a2b7f91d220efa6c", 4: 292 },   // avantPoste/richeQuartz/n50/g2/moitie
  76: { 1: "34b73addd5f3cee73f2e898887ad8d36", 2: "8d6f1b81bfe53766486f03b92e494b61", 6: "34024009049", 7: "5069152500/3544737932/0" },   // avantPoste/richeScorie/n50/g2/toutes
  77: { 1: "c91610d8b8c7ec94ff55f465a5a090f7", 2: "cde0413f44819040f380e4be5a7ca3e5", 4: 292 },   // avantPoste/richeScorie/n50/g2/moitie
  78: { 1: "03286c1c54793a446ce93da84aeb6b29", 2: "3b2a65bb1164baa2b247f14f544923cb", 4: 209, 6: "51597112077", 7: "5602747500/3911267810/0", 8: "0/4/14" },   // base/-/n50/g2/toutes
  79: { 1: "49c2ea6016c04cfe7cae4c2e2e93ebe8", 2: "14aa94b32cc7fb8a0dd6ac88e290b5a2", 6: "27302981328", 7: "5602747500/4140997301/0" },   // base/-/n50/g2/moitie
  80: { 1: "12628e058c490abe14c358106f00fd8a", 2: "9af26d67918b43291bced401d72f6d15", 4: 178, 7: "8784000/0/18846257" },   // camp/richeQuartz/n5/g3/toutes
  81: { 1: "f202fddd68e5bee1528734f4370d8505", 2: "78768da800f534ded50dfcf71c3ee29a", 4: 219, 6: "53882", 7: "7727481/876202/4868859", 8: "3/2/2" },   // camp/richeQuartz/n5/g3/moitie
  82: { 1: "12628e058c490abe14c358106f00fd8a", 2: "1f0d63a5053008532e692f89110be467", 4: 178, 7: "8784000/0/18846257" },   // camp/richeScorie/n5/g3/toutes
  83: { 1: "f202fddd68e5bee1528734f4370d8505", 2: "1fdefdd42130c6ff92f1ebc87bab39f3", 4: 219, 6: "53882", 7: "7727481/876202/4868859", 8: "3/2/2" },   // camp/richeScorie/n5/g3/moitie
  84: { 1: "e94811de460eb74f2d7fd395c0c46479", 2: "4922335ef9d4263e10ca63a395ffc3d9", 4: 546, 7: "13908000/0/15747575", 8: "7/5/2" },   // avantPoste/richeQuartz/n5/g3/toutes
  85: { 1: "3490c66517113c42f7bd0559e6b1766a", 2: "f11fd562242137fa16f6f81bfa3c6182", 4: 520, 5: "{\"quartz\":25255,\"scorie\":8418}", 6: "104165", 7: "16841258/874444/2326446", 8: "4/4/4" },   // avantPoste/richeQuartz/n5/g3/moitie
  86: { 1: "e94811de460eb74f2d7fd395c0c46479", 2: "f2464f913243c3ca7734bdcd8d62e36a", 4: 546, 7: "13908000/0/15747575", 8: "7/5/2" },   // avantPoste/richeScorie/n5/g3/toutes
  87: { 1: "3490c66517113c42f7bd0559e6b1766a", 2: "6410b59804e47264747d1964712b2b75", 4: 520, 5: "{\"quartz\":8418,\"scorie\":25255}", 6: "104165", 7: "16841258/874444/2326446", 8: "4/4/4" },   // avantPoste/richeScorie/n5/g3/moitie
  88: { 1: "d0907a53faab57d6fb86966cf4bf9d60", 2: "e4681a8f034cc21604e1aa6f0e27d8fb", 4: 591, 7: "13908000/0/16287175" },   // base/-/n5/g3/toutes
  89: { 1: "cf9f85c16643b941056107c15f4f37d9", 2: "c251638621e775ce6f8ce85024967bfb", 4: 386, 5: "{\"quartz\":5628,\"scorie\":7293}", 6: "147411", 7: "16926533/134958/2491025", 8: "5/5/3" },   // base/-/n5/g3/moitie
  90: { 1: "5652228919dee5835d4435495cfe27fb", 2: "02dcc2ab9c3ff17230fcd99b045e042f", 4: 569, 6: "27286085", 7: "76450000/34861200/42178076", 8: "5/11/7" },   // camp/richeQuartz/n20/g3/toutes
  91: { 1: "33f0fdfccc7ff603f1784204c51c5041", 2: "767b19ab37664bb3b43f859ab30769cf", 4: 418, 5: "{\"quartz\":39,\"scorie\":13}", 6: "10623878", 7: "152849054/78781967/731310", 8: "0/3/6" },   // camp/richeQuartz/n20/g3/moitie
  92: { 1: "5652228919dee5835d4435495cfe27fb", 2: "79bf393d234b63903b02e31b451028da", 4: 569, 6: "27286085", 7: "76450000/34861200/42178076", 8: "5/11/7" },   // camp/richeScorie/n20/g3/toutes
  93: { 1: "33f0fdfccc7ff603f1784204c51c5041", 2: "51cca779699f297c2b696e94ebcab8a7", 4: 418, 5: "{\"quartz\":13,\"scorie\":39}", 6: "10623878", 7: "152849054/78781967/731310", 8: "0/3/6" },   // camp/richeScorie/n20/g3/moitie
  94: { 1: "f9072ec7e4db827958d461ac1e26ab38", 2: "dc7f7e18d395d4885656ed997c6fa14b", 4: 375, 6: "20067606", 7: "211002000/110547749/0", 8: "0/7/14" },   // avantPoste/richeQuartz/n20/g3/toutes
  95: { 1: "18a0676087903b45c04de98116d1bbe2", 2: "895f38ef678ecd5c0736cf79df8307af", 4: 248, 6: "8584137", 7: "211002000/138397131/0", 8: "0/2/7" },   // avantPoste/richeQuartz/n20/g3/moitie
  96: { 1: "f9072ec7e4db827958d461ac1e26ab38", 2: "ff5351654ba9574df463d1e41f7604e9", 4: 375, 6: "20067606", 7: "211002000/110547749/0", 8: "0/7/14" },   // avantPoste/richeScorie/n20/g3/toutes
  97: { 1: "18a0676087903b45c04de98116d1bbe2", 2: "4c041ed4e4aef538fbb078cbaacb101e", 4: 248, 6: "8584137", 7: "211002000/138397131/0", 8: "0/2/7" },   // avantPoste/richeScorie/n20/g3/moitie
  98: { 1: "8a8f8477b89b60e8f4d347c6ee703be0", 2: "6743b6f38e9f949db5a20ed145de0cf0", 4: 377, 6: "25912660", 7: "226292000/100412475/0", 8: "0/9/14" },   // base/-/n20/g3/toutes
  99: { 1: "e6f11a267b44dad6cc823b00f682f892", 2: "172e39f3d4914d80559938bd7ffb075e", 4: 363, 6: "12807634", 7: "226292000/126622138/0" },   // base/-/n20/g3/moitie
  100: { 1: "3a251faf88303ffbe62b08cdea32748a", 2: "fb03693ec5890a296fc0132d6b5998ba", 4: 516, 6: "2349773471", 7: "855858000/363990380/0", 8: "0/8/14" },   // camp/richeQuartz/n35/g3/toutes
  101: { 1: "0bc6caa386f669fd2fc86a5959b45d84", 2: "956411871249946ae64fdd1f00585fee", 4: 229, 6: "406921397", 7: "855858000/625626019/0" },   // camp/richeQuartz/n35/g3/moitie
  102: { 1: "3a251faf88303ffbe62b08cdea32748a", 2: "5593aaf621d418a9d008f2702bed3d51", 4: 516, 6: "2349773471", 7: "855858000/363990380/0", 8: "0/8/14" },   // camp/richeScorie/n35/g3/toutes
  103: { 1: "0bc6caa386f669fd2fc86a5959b45d84", 2: "f94895328a4dd5851053c52d491becc4", 4: 229, 6: "406921397", 7: "855858000/625626019/0" },   // camp/richeScorie/n35/g3/moitie
  104: { 1: "6ed079a40e71a60c16a71fc88146b303", 2: "4a050b9e2420201a473e1f88f7435939", 4: 327, 6: "927549286", 7: "1162434000/749746097/0" },   // avantPoste/richeQuartz/n35/g3/toutes
  105: { 1: "9061b0c1feb483d79f1d06163af3bf94", 2: "2a3a8942c7b1998c03095f3dcc790874", 4: 299, 6: "489086559", 7: "1162434000/842883747/0" },   // avantPoste/richeQuartz/n35/g3/moitie
  106: { 1: "6ed079a40e71a60c16a71fc88146b303", 2: "0e346f725572fd01b3d1f94df61872c4", 4: 327, 6: "927549286", 7: "1162434000/749746097/0" },   // avantPoste/richeScorie/n35/g3/toutes
  107: { 1: "9061b0c1feb483d79f1d06163af3bf94", 2: "836cd65ccb02cdfc912d01e629c5b2f5", 4: 299, 6: "489086559", 7: "1162434000/842883747/0" },   // avantPoste/richeScorie/n35/g3/moitie
  108: { 1: "c94e146ab704be26826832e42aaaebfc", 2: "d6bde34f9f43046e70f6b9bd14d35f89", 4: 360, 6: "1709189082", 7: "1251852000/822437112/0", 8: "0/7/14" },   // base/-/n35/g3/toutes
  109: { 1: "6dc77e1f2401527f18ac2cabe7f7f27f", 2: "5e57097aada4875a16c3cc72ff5f1153", 4: 187, 6: "293983131", 7: "1251852000/1017886776/0" },   // base/-/n35/g3/moitie
  110: { 1: "d791257e982c2fcfce6ad330eb01ef51", 2: "fa46bb42cf2b39cb31d80b1d20ab56b8", 4: 423, 6: "124854620169", 7: "3788524500/1861418439/0", 8: "0/7/14" },   // camp/richeQuartz/n50/g3/toutes
  111: { 1: "bc93a8956e06e140c6f41d8918070eab", 2: "36525429cbeb984947b1ed8bd58290c4", 6: "15843633238", 7: "3788524500/2633671593/0" },   // camp/richeQuartz/n50/g3/moitie
  112: { 1: "d791257e982c2fcfce6ad330eb01ef51", 2: "2d0e1623c60ea70f0b4574fbac1b8ae2", 4: 423, 6: "124854620169", 7: "3788524500/1861418439/0", 8: "0/7/14" },   // camp/richeScorie/n50/g3/toutes
  113: { 1: "bc93a8956e06e140c6f41d8918070eab", 2: "0ac9107e9369faf220e7cd65d14c2527", 6: "15843633238", 7: "3788524500/2633671593/0" },   // camp/richeScorie/n50/g3/moitie
  114: { 1: "bfc5da828adf06432fd4d1944a8c4c7c", 2: "845ab6f35074412d77b3fa89ed0d6439", 4: 449, 6: "101880056145", 7: "5069152500/3279135348/0" },   // avantPoste/richeQuartz/n50/g3/toutes
  115: { 1: "c52eda3cfc8a0330adc1c38205cd174a", 2: "5abd57b6cd82478c638e3bb665e690cf", 6: "12642350608", 7: "5069152500/3764250948/0" },   // avantPoste/richeQuartz/n50/g3/moitie
  116: { 1: "bfc5da828adf06432fd4d1944a8c4c7c", 2: "54eda6aaefac9db953aa961687278039", 4: 449, 6: "101880056145", 7: "5069152500/3279135348/0" },   // avantPoste/richeScorie/n50/g3/toutes
  117: { 1: "c52eda3cfc8a0330adc1c38205cd174a", 2: "dd8d63467edbf548abaf6a8eb4be91ad", 6: "12642350608", 7: "5069152500/3764250948/0" },   // avantPoste/richeScorie/n50/g3/moitie
  118: { 1: "70a5c63f5d01f0ebaf7b7c233e1799cd", 2: "45905465ae810cea9009234247ba74a6", 4: 296, 6: "50658662529", 7: "5602747500/3616968542/0", 8: "0/3/14" },   // base/-/n50/g3/toutes
  119: { 1: "46917929772ad680070cec30a28f5bce", 2: "f722f522b7f99f585076ec26843d1cd5", 4: 245, 6: "50956328336", 7: "5602747500/3641592231/0" },   // base/-/n50/g3/moitie
  120: { 1: "231ab84352244a80db4e76d0d92eea66", 2: "95863e12b7b6ee8018997a7418c7f8ef", 7: "8762481/0/17570375" },   // camp/richeQuartz/n5/g4/toutes
  121: { 1: "810326f901bc788648e40e9a1faa1e85", 2: "938db78857799bee15ecb77e5ed32c30", 4: 609, 5: "{\"quartz\":5059,\"scorie\":1686}", 7: "11592330/0/6651239" },   // camp/richeQuartz/n5/g4/moitie
  122: { 1: "231ab84352244a80db4e76d0d92eea66", 2: "3451b63c65bfa31035d34e2bab775519", 7: "8762481/0/17570375" },   // camp/richeScorie/n5/g4/toutes
  123: { 1: "810326f901bc788648e40e9a1faa1e85", 2: "e79122f6028a81a0cd521032cd90a5b5", 4: 609, 5: "{\"quartz\":1686,\"scorie\":5059}", 7: "11592330/0/6651239" },   // camp/richeScorie/n5/g4/moitie
  124: { 1: "bca13fe57956690492f4cd83f16ccf97", 2: "2f9904020eec07f6d0a36b578d9b45ed", 4: 339, 7: "6588000/0/16903410", 8: "6/5/1" },   // avantPoste/richeQuartz/n5/g4/toutes
  125: { 1: "e64555c8a73caa059848790222905604", 2: "4ea9732d893f2f9a41c1c6823dc4b474", 4: 329, 6: "53745", 7: "15372000/2931384/4353733" },   // avantPoste/richeQuartz/n5/g4/moitie
  126: { 1: "bca13fe57956690492f4cd83f16ccf97", 2: "55f7e50519a69f64afeb034e8f925fef", 4: 339, 7: "6588000/0/16903410", 8: "6/5/1" },   // avantPoste/richeScorie/n5/g4/toutes
  127: { 1: "e64555c8a73caa059848790222905604", 2: "ff399910fcf0d0c8215d5bf66f8dee5d", 4: 329, 6: "53745", 7: "15372000/2931384/4353733" },   // avantPoste/richeScorie/n5/g4/moitie
  128: { 1: "ce9dba3c3ca4b00009bb645d226aca9e", 2: "ea940d9d50c587571abe93d9822caad0", 4: 440, 7: "5124000/0/14810672" },   // base/-/n5/g4/toutes
  129: { 1: "1ec55632a9dc0bb421074f5a8ad7b706", 2: "4f3dc5b5970a414269f28ef76511083e", 4: 613, 5: "{\"quartz\":3783,\"scorie\":4693}", 6: "114036", 7: "16642956/1496557/3989859", 8: "3/4/2" },   // base/-/n5/g4/moitie
  130: { 1: "007cc12689f8a4975c3b95370c0ec539", 2: "ea43a3209b20851df1a887ef9ae10b72", 4: 501, 6: "23099774", 7: "152900000/32053201/0", 8: "0/9/14" },   // camp/richeQuartz/n20/g4/toutes
  131: { 1: "6aa5fbfbe81e78c5c2761b6fb9b13326", 2: "dd37f9b257f38758ae4435eb6cc54f58", 4: 332, 6: "9031480", 7: "152900000/72926539/0", 8: "0/3/7" },   // camp/richeQuartz/n20/g4/moitie
  132: { 1: "007cc12689f8a4975c3b95370c0ec539", 2: "9fbcfb9d6be2dd5b6913c17ce28b591e", 4: 501, 6: "23099774", 7: "152900000/32053201/0", 8: "0/9/14" },   // camp/richeScorie/n20/g4/toutes
  133: { 1: "6aa5fbfbe81e78c5c2761b6fb9b13326", 2: "1500f86aaf8cc02747a74be22d121156", 4: 332, 6: "9031480", 7: "152900000/72926539/0", 8: "0/3/7" },   // camp/richeScorie/n20/g4/moitie
  134: { 1: "8b4c4c0b3453d84925d829211df1a39a", 2: "17c8296cafa6ff3dc02ac9bdb42433e2", 4: 395, 6: "25688968", 7: "211002000/56215899/0", 8: "0/12/14" },   // avantPoste/richeQuartz/n20/g4/toutes
  135: { 1: "6d22521a0e1ddf58f8015b7262f814ac", 2: "fcd2852c4787b9c532a23f27b86e8fcd", 4: 303, 6: "9192014", 7: "211002000/104915219/0" },   // avantPoste/richeQuartz/n20/g4/moitie
  136: { 1: "8b4c4c0b3453d84925d829211df1a39a", 2: "90dff452841cc824cc86620cb35c6ac0", 4: 395, 6: "25688968", 7: "211002000/56215899/0", 8: "0/12/14" },   // avantPoste/richeScorie/n20/g4/toutes
  137: { 1: "6d22521a0e1ddf58f8015b7262f814ac", 2: "cf55260305a8701339015b34d56b5f48", 4: 303, 6: "9192014", 7: "211002000/104915219/0" },   // avantPoste/richeScorie/n20/g4/moitie
  138: { 1: "89fbca8322a63b23d302440e3ef268c9", 2: "d070e6cc224f635e80aa0dce6f9e1632", 4: 426, 6: "31783847", 7: "226292000/88967173/0", 8: "0/11/14" },   // base/-/n20/g4/toutes
  139: { 1: "407433c7aec864f4c678680dc5e19e51", 2: "e45e2491d9f6cb445d545f7b2b5b8dbf", 4: 347, 6: "11142788", 7: "226292000/134315508/0", 8: "0/3/7" },   // base/-/n20/g4/moitie
  140: { 1: "a411f61d70677e0ebcacef98a7f2fc5c", 2: "02492057894e1c3e2155823010d93b1e", 4: 264, 6: "1153953128", 7: "855858000/347738521/0", 8: "0/8/14" },   // camp/richeQuartz/n35/g4/toutes
  141: { 1: "5b09ce8dd1eca70136611c7cf884f9f1", 2: "de347ee5313ce1285605b8584dac1336", 4: 230, 6: "473312714", 7: "855858000/504014949/0" },   // camp/richeQuartz/n35/g4/moitie
  142: { 1: "a411f61d70677e0ebcacef98a7f2fc5c", 2: "4bb926b199fee7413173820fbd278e40", 4: 264, 6: "1153953128", 7: "855858000/347738521/0", 8: "0/8/14" },   // camp/richeScorie/n35/g4/toutes
  143: { 1: "5b09ce8dd1eca70136611c7cf884f9f1", 2: "c53444bda5d9df1d752dbb5e56a4b29c", 4: 230, 6: "473312714", 7: "855858000/504014949/0" },   // camp/richeScorie/n35/g4/moitie
  144: { 1: "0f9c59da36c458403b98a539883097a9", 2: "d7ff9f0842f678d6e6950f1407d9b7da", 6: "582321223", 7: "1162434000/684440606/0", 8: "0/6/14" },   // avantPoste/richeQuartz/n35/g4/toutes
  145: { 1: "63d70a03544037f7344c99aea1e6b38f", 2: "118f4836ed9fd69233d233af22b099ee", 4: 235, 6: "425017042", 7: "1162434000/753934435/0", 8: "0/4/7" },   // avantPoste/richeQuartz/n35/g4/moitie
  146: { 1: "0f9c59da36c458403b98a539883097a9", 2: "2024e6c3cace06b37b018f1658acaa96", 6: "582321223", 7: "1162434000/684440606/0", 8: "0/6/14" },   // avantPoste/richeScorie/n35/g4/toutes
  147: { 1: "63d70a03544037f7344c99aea1e6b38f", 2: "f34ce2218bd97dfb7cdc3e1c37a394da", 4: 235, 6: "425017042", 7: "1162434000/753934435/0", 8: "0/4/7" },   // avantPoste/richeScorie/n35/g4/moitie
  148: { 1: "3e004e720eae5fa6bf612ace24afd52b", 2: "2c9b0c23545b192ad2d89ec7e6772cfb", 4: 269, 6: "967340652", 7: "1251852000/744459627/0", 8: "0/5/14" },   // base/-/n35/g4/toutes
  149: { 1: "ccb82f5b4b9f01d09e692efdbd7b5619", 2: "bd18c9c3e317df2ceedd40b9c5b7ab43", 4: 263, 6: "466313022", 7: "1251852000/865330892/0" },   // base/-/n35/g4/moitie
  150: { 1: "d425f08fd6fabf596a0078b23c88bcef", 2: "f24e3cdd67c3f05b6d9ffa2de46fede0", 4: 367, 6: "103550973037", 7: "3788524500/2180302391/0" },   // camp/richeQuartz/n50/g4/toutes
  151: { 1: "db4727fe6b7049edba16f9944067a3e5", 2: "951172d42ed74aa4b4e0e22090e74d76", 6: "27086128118", 7: "3788524500/2673016640/0" },   // camp/richeQuartz/n50/g4/moitie
  152: { 1: "d425f08fd6fabf596a0078b23c88bcef", 2: "54b6fde3968af88ad29e468cc2a29d72", 4: 367, 6: "103550973037", 7: "3788524500/2180302391/0" },   // camp/richeScorie/n50/g4/toutes
  153: { 1: "db4727fe6b7049edba16f9944067a3e5", 2: "0af573422e3ad0029ceb7f637aeefa48", 6: "27086128118", 7: "3788524500/2673016640/0" },   // camp/richeScorie/n50/g4/moitie
  154: { 1: "5ec08303e5e4b8e42498904e48d70b86", 2: "23181a14a97fc0597d7958859bd8ad2d", 4: 338, 6: "64543481676", 7: "5069152500/2844054520/0", 8: "0/8/14" },   // avantPoste/richeQuartz/n50/g4/toutes
  155: { 1: "ce065968c940ecb01beca410146259c6", 2: "262dbf620c9e9935d9479f82b2e45c2b", 6: "4198206135", 7: "5069152500/3691527003/0" },   // avantPoste/richeQuartz/n50/g4/moitie
  156: { 1: "5ec08303e5e4b8e42498904e48d70b86", 2: "2d71a77d959a8ca21e6d630e873a81a2", 4: 338, 6: "64543481676", 7: "5069152500/2844054520/0", 8: "0/8/14" },   // avantPoste/richeScorie/n50/g4/toutes
  157: { 1: "ce065968c940ecb01beca410146259c6", 2: "455f2783745df914590ca215d78f4089", 6: "4198206135", 7: "5069152500/3691527003/0" },   // avantPoste/richeScorie/n50/g4/moitie
  158: { 1: "a9e5f2f9416b72da84b0d670ac2328aa", 2: "3c24400e25bafa4247d17737c87a2444", 4: 365, 6: "150909333643", 7: "5602747500/3369255809/0", 8: "0/7/14" },   // base/-/n50/g4/toutes
  159: { 1: "fbc46b4a050a3ed0ec7ee0bf9b5d590d", 2: "1eacc8004ec7c313bcbded452761b2ce", 4: 229, 6: "28065022229", 7: "5602747500/4203092495/0" },   // base/-/n50/g4/moitie
  160: { 1: "7a251431d724c5934ecf91a5ab8ee14f", 2: "48cf0ba1897327d77ba26502a0c8ffb5", 4: 530, 7: "13908000/0/17969609" },   // camp/richeQuartz/n5/g5/toutes
  161: { 1: "bc0666045475cb084b67816b3b63be1c", 2: "00a7634b2b0638b0dc4547c0009563c8", 4: 442, 6: "57187", 7: "13908000/741366/5423783" },   // camp/richeQuartz/n5/g5/moitie
  162: { 1: "7a251431d724c5934ecf91a5ab8ee14f", 2: "62cc0f41219f73d04cce20147b15f814", 4: 530, 7: "13908000/0/17969609" },   // camp/richeScorie/n5/g5/toutes
  163: { 1: "bc0666045475cb084b67816b3b63be1c", 2: "2be36b38853996596fcfb5604ff9c221", 4: 442, 6: "57187", 7: "13908000/741366/5423783" },   // camp/richeScorie/n5/g5/moitie
  164: { 1: "ef9b27dfe3a2804547f75355abba1b05", 2: "281c5925bc11e01622478028f2bf9750", 7: "11917456/0/16368024", 8: "4/5/1" },   // avantPoste/richeQuartz/n5/g5/toutes
  165: { 1: "1d2d07b13ce51c910ccdd599c9b6537d", 2: "0ab5c786c46290a0032fc531ee81be13", 4: 662, 5: "{\"quartz\":33070,\"scorie\":11023}", 7: "12444000/0/5655459", 8: "7/5/1" },   // avantPoste/richeQuartz/n5/g5/moitie
  166: { 1: "ef9b27dfe3a2804547f75355abba1b05", 2: "5637ccc6696fe6337c457f1ae46156ca", 7: "11917456/0/16368024", 8: "4/5/1" },   // avantPoste/richeScorie/n5/g5/toutes
  167: { 1: "1d2d07b13ce51c910ccdd599c9b6537d", 2: "bded5324db25f5fe500032f868d0acb3", 4: 662, 5: "{\"quartz\":11023,\"scorie\":33070}", 7: "12444000/0/5655459", 8: "7/5/1" },   // avantPoste/richeScorie/n5/g5/moitie
  168: { 1: "8edcbed917f78b74482f64ec55ada620", 2: "93e042f398860d0dac3a5d570976d758", 4: 600, 5: "{\"quartz\":4301,\"scorie\":753}", 7: "14070570/0/15064339" },   // base/-/n5/g5/toutes
  169: { 1: "4ace20d58632a88366ca3713b166eb77", 2: "388c3afa2c472964bc45618fe488ab56", 4: 615, 7: "19764000/0/5426387", 8: "3/6/1" },   // base/-/n5/g5/moitie
  170: { 1: "f57bef8bd0642fc7c36b5ba668874106", 2: "28431c324ae2d895ead96a1e16a04a81", 3: "duree", 4: 900, 5: "{\"quartz\":139667,\"scorie\":46555}", 7: "107955104/32414800/19567506", 8: "1/11/11" },   // camp/richeQuartz/n20/g5/toutes
  171: { 1: "8e180e9c9e796d8668bb33c55314b011", 2: "b45ddc54a7c17d11162cb3d90cf0721f", 4: 346, 6: "8432464", 7: "152900000/73195235/0" },   // camp/richeQuartz/n20/g5/moitie
  172: { 1: "f57bef8bd0642fc7c36b5ba668874106", 2: "c9ae3a3741d147bae77fa6e0b18df4d3", 3: "duree", 4: 900, 5: "{\"quartz\":46555,\"scorie\":139667}", 7: "107955104/32414800/19567506", 8: "1/11/11" },   // camp/richeScorie/n20/g5/toutes
  173: { 1: "8e180e9c9e796d8668bb33c55314b011", 2: "0ff6f9b744159b0fc4629503a01defd2", 4: 346, 6: "8432464", 7: "152900000/73195235/0" },   // camp/richeScorie/n20/g5/moitie
  174: { 1: "5f01bbeb2d4f6c874d1be60aec06f0af", 2: "c3b782fcdb4492660569bfbc91d36ada", 3: "souche", 4: 727, 5: "{\"quartz\":5009476,\"scorie\":1669825}", 6: "31623660", 7: "157034416/63208860/19919262", 8: "3/14/11" },   // avantPoste/richeQuartz/n20/g5/toutes
  175: { 1: "1def3905791e3a1bdbf453ee928e1c69", 2: "57997614fe2ae8e1af19936d9f2a764c", 4: 313, 6: "10497417", 7: "211002000/115509127/0", 8: "0/4/7" },   // avantPoste/richeQuartz/n20/g5/moitie
  176: { 1: "5f01bbeb2d4f6c874d1be60aec06f0af", 2: "f6ebbc11c2121c3a7fd240341b403281", 3: "souche", 4: 727, 5: "{\"quartz\":1669825,\"scorie\":5009476}", 6: "31623660", 7: "157034416/63208860/19919262", 8: "3/14/11" },   // avantPoste/richeScorie/n20/g5/toutes
  177: { 1: "1def3905791e3a1bdbf453ee928e1c69", 2: "47d24effb98de62193d9c0b8b0d6885d", 4: 313, 6: "10497417", 7: "211002000/115509127/0", 8: "0/4/7" },   // avantPoste/richeScorie/n20/g5/moitie
  178: { 1: "ac584ff807dc87a10b1bc0942a051f8a", 2: "fdf814945d72a8d303457785a97029a6", 4: 757, 5: "{\"quartz\":51344,\"scorie\":573845}", 6: "36162303", 7: "182189544/61023622/20465459", 8: "6/16/8" },   // base/-/n20/g5/toutes
  179: { 1: "933fb299038e0c9f0b2351f68b7eecb9", 2: "1ca1a2b0844ab788fa0afdce3ece999c", 4: 509, 6: "17357299", 7: "226292000/104891674/0", 8: "0/8/7" },   // base/-/n20/g5/moitie
  180: { 1: "929b55339142b42cefdcc4c376cdad0d", 2: "b763914b5074de9143704d15677afafd", 4: 337, 6: "958395050", 7: "855858000/335137543/0" },   // camp/richeQuartz/n35/g5/toutes
  181: { 1: "bb74e697c2060aa8f80ffab8abc5547b", 2: "eb6d2cc5db51870357cf1f4320f25adb", 4: 254, 6: "369363699", 7: "855858000/507743813/0", 8: "0/1/7" },   // camp/richeQuartz/n35/g5/moitie
  182: { 1: "929b55339142b42cefdcc4c376cdad0d", 2: "36bd7a9716c9cb26d5bd56af0f099499", 4: 337, 6: "958395050", 7: "855858000/335137543/0" },   // camp/richeScorie/n35/g5/toutes
  183: { 1: "bb74e697c2060aa8f80ffab8abc5547b", 2: "c3156acc0c76f3a83e264eb5220e3d70", 4: 254, 6: "369363699", 7: "855858000/507743813/0", 8: "0/1/7" },   // camp/richeScorie/n35/g5/moitie
  184: { 1: "807874bb0910493922427a35331211b9", 2: "3b10a813d059f2389ef6d812f7ba6649", 4: 329, 6: "838392544", 7: "1162434000/543921946/0" },   // avantPoste/richeQuartz/n35/g5/toutes
  185: { 1: "a7ef9d991a9eb396e4fce28850e48a39", 2: "59507cd4d9e0d394b8fe1fdd8ccb5a0d", 4: 318, 6: "669847809", 7: "1162434000/647815578/0" },   // avantPoste/richeQuartz/n35/g5/moitie
  186: { 1: "807874bb0910493922427a35331211b9", 2: "3a3e588e3d56c2965ea009f8b4119441", 4: 329, 6: "838392544", 7: "1162434000/543921946/0" },   // avantPoste/richeScorie/n35/g5/toutes
  187: { 1: "a7ef9d991a9eb396e4fce28850e48a39", 2: "92a969fb95d432fa2aadb5cf125c6174", 4: 318, 6: "669847809", 7: "1162434000/647815578/0" },   // avantPoste/richeScorie/n35/g5/moitie
  188: { 1: "b8f15cead69feaa404fa2e2777bf19ba", 2: "d3116812c05a3004b5a60171387f9f8f", 4: 521, 6: "2347731073", 7: "1251852000/596400929/0", 8: "0/11/14" },   // base/-/n35/g5/toutes
  189: { 1: "9e966291494df05fa1db18c1156dde25", 2: "867f98bf950c299420fcab303fc8bed0", 4: 264, 6: "427697316", 7: "1251852000/821640172/0" },   // base/-/n35/g5/moitie
  190: { 1: "6c1b177dbf8dc6c7f75437eada6e95c2", 2: "41080383c516e540fbdb5932b9857981", 4: 372, 5: "{\"quartz\":377439,\"scorie\":125813}", 6: "148205971977", 7: "3788245326/1393404704/0" },   // camp/richeQuartz/n50/g5/toutes
  191: { 1: "0ab5393262fafc18941cc009a21d5661", 2: "99137ebef159a6531d6db3b015d899b6", 4: 281, 6: "43465176075", 7: "3788524500/1946020329/0", 8: "0/4/7" },   // camp/richeQuartz/n50/g5/moitie
  192: { 1: "6c1b177dbf8dc6c7f75437eada6e95c2", 2: "f5d9c5841e1cbe87720eefbc1556bc2e", 4: 372, 5: "{\"quartz\":125813,\"scorie\":377439}", 6: "148205971977", 7: "3788245326/1393404704/0" },   // camp/richeScorie/n50/g5/toutes
  193: { 1: "0ab5393262fafc18941cc009a21d5661", 2: "c038f36bc5eadebea015f9e4cc55d837", 4: 281, 6: "43465176075", 7: "3788524500/1946020329/0", 8: "0/4/7" },   // camp/richeScorie/n50/g5/moitie
  194: { 1: "a30b3398f62e921e4ddb12b8600b4764", 2: "36690c928d43f7b1f78fb5dab3cf5ad7", 4: 287, 6: "71612581381", 7: "5069152500/2585115675/0", 8: "0/6/14" },   // avantPoste/richeQuartz/n50/g5/toutes
  195: { 1: "3af29b3ec7db1187240bf32818dbdcbc", 2: "d4122097dd9bde02e58ff91e6c1545ca", 4: 261, 6: "24589630511", 7: "5069152500/2927465889/0" },   // avantPoste/richeQuartz/n50/g5/moitie
  196: { 1: "a30b3398f62e921e4ddb12b8600b4764", 2: "4d6e514b7d04654dec6f9aa69c739f32", 4: 287, 6: "71612581381", 7: "5069152500/2585115675/0", 8: "0/6/14" },   // avantPoste/richeScorie/n50/g5/toutes
  197: { 1: "3af29b3ec7db1187240bf32818dbdcbc", 2: "75000edfd1fcf3a6b951d9eced6f5df9", 4: 261, 6: "24589630511", 7: "5069152500/2927465889/0" },   // avantPoste/richeScorie/n50/g5/moitie
  198: { 1: "c8a16f426a004f94bdb1a8c0cbd2c770", 2: "aab1eec71831a87b1e295d5056cc4876", 4: 279, 6: "141524611582", 7: "5602747500/2624599518/0", 8: "0/11/14" },   // base/-/n50/g5/toutes
  199: { 1: "30bacadbe3e149c9f187e3769ad69523", 2: "3d6cbd4616f4dee93038ca6eb6ea82f8", 4: 238, 6: "36483708556", 7: "5602747500/3321453327/0" },   // base/-/n50/g5/moitie
};

/**
 * ⚠⚠ LOT BARÈME-ET-REJEU (12/09) : LA SIXIÈME COUCHE DE `T1 bis`, ET ELLE
 * N'AJOUTE QUE **DEUX** CHAMPS À LA SURCHARGE. Elle déplace **1 064 champs sur
 * 1 600** et touche les deux cents combats — mais **1 062 d'entre eux étaient
 * DÉJÀ surchargés** par l'une des cinq couches d'avant : le compte est l'UNION
 * des six, pas leur somme. La surcharge passe donc de **1 331 à 1 333**, et il
 * reste **267 champs gardés** contre la capture d'avant JOURNAL-DE-COMBAT.
 *
 * ⚠ ET CETTE INVARIANCE EST LA MESURE QUI COMPTE : elle dit que ce lot déplace
 * ce que les lots ARRÊT, COLONNE et MUR déplaçaient déjà — la FILE, c'est-à-dire
 * le même axe. Un lot qui aurait touché au tir ou au ciblage aurait fait sauter
 * les 269 restants, qui sont pour l'essentiel des CAUSES de fin.
 *
 * ⚠ QUATRE CAUSES BOUGENT, ET LES DEUX SENS Y SONT AUSSI : `camp/n20/g1`
 * (10 · 12) passe d'`attaquants` 609 à `duree` 900, `avantPoste/n5/g3`
 * (84 · 86) d'`attaquants` 564 à **`souche`**.
 */
export const COMBATS_DEPLACES_PAR_BAREME_ET_REJEU_AVANT_PAQUETS = {
  0: { 1: "4279f9b4f35f643e08ed0b5d41f0ab91", 2: "269b7dbcab665e37b829e98a2ecd1cbe", 7: "5856000/0/19069707" },   // camp/richeQuartz/n5/g1/toutes
  1: { 1: "ad04afc2388117e9a8c8ae9174d197cb", 2: "d6fe0f74a8b63551f4667f7057f1a734", 4: 482, 7: "15372000/0/6828195" },   // camp/richeQuartz/n5/g1/moitie
  2: { 1: "4279f9b4f35f643e08ed0b5d41f0ab91", 2: "33166bea35056ac424d33c8bf83f6c2d", 7: "5856000/0/19069707" },   // camp/richeScorie/n5/g1/toutes
  3: { 1: "ad04afc2388117e9a8c8ae9174d197cb", 2: "62cd41d8ed9e94abd9a28be6f7caa822", 4: 482, 7: "15372000/0/6828195" },   // camp/richeScorie/n5/g1/moitie
  4: { 1: "29431d2528d2c71ae6fcb5c7472bb1f6", 2: "315c996405e40d548df42fe635ea40e7", 4: 329, 7: "5856000/0/17761057" },   // avantPoste/richeQuartz/n5/g1/toutes
  5: { 1: "66a714885fae1c6936cb4b8f7c08832e", 2: "cfda025162b4a1496feba165464b5594", 4: 635, 5: "{\"quartz\":16628,\"scorie\":5542}", 6: "125600", 7: "16960392/0/4213827", 8: "3/5/2" },   // avantPoste/richeQuartz/n5/g1/moitie
  6: { 1: "29431d2528d2c71ae6fcb5c7472bb1f6", 2: "1bbc8c6ec1c08d07a7cb214cdcefe3aa", 4: 329, 7: "5856000/0/17761057" },   // avantPoste/richeScorie/n5/g1/toutes
  7: { 1: "66a714885fae1c6936cb4b8f7c08832e", 2: "fd30d74813352386556382a064a98538", 4: 635, 5: "{\"quartz\":5542,\"scorie\":16628}", 6: "125600", 7: "16960392/0/4213827", 8: "3/5/2" },   // avantPoste/richeScorie/n5/g1/moitie
  8: { 1: "2858455bca90dd664d8aa5e3db70d6e8", 2: "3d69e1a657ee57c8f7d34eb9141a8768", 4: 386, 7: "4392000/0/16908620" },   // base/-/n5/g1/toutes
  9: { 1: "5bbc05d53068648246f358fa39217a9b", 2: "0b9cca73cc5d8331fc86b4fba91e1b5a", 4: 374, 5: "{\"quartz\":3450,\"scorie\":4218}", 6: "78859", 7: "19066790/2931631/4228566", 8: "3/3/2" },   // base/-/n5/g1/moitie
  10: { 1: "7701402a100e04b92cbbe9cc4c07670a", 2: "39a35e8910fc1cf0db02b0fefd08c93e", 3: "duree", 4: 900, 5: "{\"quartz\":103193,\"scorie\":34397}", 6: "17734324", 7: "134781350/52703097/692493", 8: "1/6/13" },   // camp/richeQuartz/n20/g1/toutes
  11: { 1: "f81fe13827c47327d10e5061adbd63de", 2: "0e31aec780087e26ddc0156a536d2175", 4: 413, 5: "{\"quartz\":1435,\"scorie\":478}", 6: "13205297", 7: "152648030/63383184/2524384" },   // camp/richeQuartz/n20/g1/moitie
  12: { 1: "7701402a100e04b92cbbe9cc4c07670a", 2: "04be1f7b2ee634da83ab30fa331288ae", 3: "duree", 4: 900, 5: "{\"quartz\":34397,\"scorie\":103193}", 6: "17734324", 7: "134781350/52703097/692493", 8: "1/6/13" },   // camp/richeScorie/n20/g1/toutes
  13: { 1: "f81fe13827c47327d10e5061adbd63de", 2: "7fe50e45b3c6b15275084c17540cb94b", 4: 413, 5: "{\"quartz\":478,\"scorie\":1435}", 6: "13205297", 7: "152648030/63383184/2524384" },   // camp/richeScorie/n20/g1/moitie
  14: { 1: "ce5e126f10cbdc35a2ebb200a177b0e5", 2: "a2ee10682314a12790b78c4f1105d318", 4: 870, 6: "20589802", 7: "168190000/59836311/21078222", 8: "6/14/10" },   // avantPoste/richeQuartz/n20/g1/toutes
  15: { 1: "8da7ee07cbb63af1d7b39a0306acb791", 2: "f4a4f034c3d1f51a318214b90fd8c60e", 4: 324, 6: "8743066", 7: "211002000/115341984/0" },   // avantPoste/richeQuartz/n20/g1/moitie
  16: { 1: "ce5e126f10cbdc35a2ebb200a177b0e5", 2: "b5810d369f96982d7b274ce752459daa", 4: 870, 6: "20589802", 7: "168190000/59836311/21078222", 8: "6/14/10" },   // avantPoste/richeScorie/n20/g1/toutes
  17: { 1: "8da7ee07cbb63af1d7b39a0306acb791", 2: "e6db59bf47cfabe81acbcc1e6bbcecd5", 4: 324, 6: "8743066", 7: "211002000/115341984/0" },   // avantPoste/richeScorie/n20/g1/moitie
  18: { 1: "4af3f60aec54ad49f7ba05cd61a2c8c7", 2: "eb1e05c96f8ae98d8c5a0d4c2d481cc4", 4: 444, 6: "30931777", 7: "226292000/94001985/0", 8: "0/10/14" },   // base/-/n20/g1/toutes
  19: { 1: "e74bb51fde6ab8689e26053d8250520a", 2: "e975b5d1c96c7e133d9c757f3a0a4123", 4: 345, 6: "8416242", 7: "226292000/139346035/0", 8: "0/2/7" },   // base/-/n20/g1/moitie
  20: { 1: "4a3b885903750a0e8d3bb1d0b176efe7", 2: "c385832528256ea9a682a9b84581e353", 4: 867, 6: "1817397066", 7: "855858000/434718782/0", 8: "0/9/14" },   // camp/richeQuartz/n35/g1/toutes
  21: { 1: "87047f87d1c031c88dfb6fb32bf5546b", 2: "2b6e0ba2091d8b2521e15d56be616b5c", 4: 412, 6: "677948800", 7: "855858000/644321230/0" },   // camp/richeQuartz/n35/g1/moitie
  22: { 1: "4a3b885903750a0e8d3bb1d0b176efe7", 2: "d79167e2636b2a6679780c7e2b969a97", 4: 867, 6: "1817397066", 7: "855858000/434718782/0", 8: "0/9/14" },   // camp/richeScorie/n35/g1/toutes
  23: { 1: "87047f87d1c031c88dfb6fb32bf5546b", 2: "38122b3c4873d865edd6f1102dbb48fb", 4: 412, 6: "677948800", 7: "855858000/644321230/0" },   // camp/richeScorie/n35/g1/moitie
  24: { 1: "da341a1ac725013ac5f7ca204b1bd187", 2: "34eecfca2b315dcc52de835381f5ebe3", 4: 338, 6: "1252335344", 7: "1162434000/580720572/0" },   // avantPoste/richeQuartz/n35/g1/toutes
  25: { 1: "98eaf1c871c30d0ceaf049a5c689d60f", 2: "13a0a447a2a4b6ebaa898d58cdaa0354", 4: 205, 6: "61326807", 7: "1162434000/761191949/0" },   // avantPoste/richeQuartz/n35/g1/moitie
  26: { 1: "da341a1ac725013ac5f7ca204b1bd187", 2: "7349ba25b8529e9cf5103e07870c1866", 4: 338, 6: "1252335344", 7: "1162434000/580720572/0" },   // avantPoste/richeScorie/n35/g1/toutes
  27: { 1: "98eaf1c871c30d0ceaf049a5c689d60f", 2: "6f58f0629eeeb3114188da19d934994c", 4: 205, 6: "61326807", 7: "1162434000/761191949/0" },   // avantPoste/richeScorie/n35/g1/moitie
  28: { 1: "103f52d16abc16796222934ca95c57a7", 2: "9c1b2bb4c4efc02c4947d4f3e56c104d", 4: 325, 6: "1509527604", 7: "1251852000/642240911/0", 8: "0/8/14" },   // base/-/n35/g1/toutes
  29: { 1: "70aa460cdb59f5355706576a604f45c3", 2: "4a7862b2a0a973edbfb51d00d08252ae", 4: 171, 6: "166293421", 7: "1251852000/826880752/0" },   // base/-/n35/g1/moitie
  30: { 1: "1ff856b52de56bc95b3a00811ac3da9b", 2: "756c2ebc479f25c7bccadb10e2d4a504", 4: 289, 6: "108156791317", 7: "3788524500/1605464656/0" },   // camp/richeQuartz/n50/g1/toutes
  31: { 1: "68a0fe6b7050363ef6d68d682dfed7f7", 2: "b4ec8af86ca41964201e7f86795293bf", 4: 165, 6: "24350876846", 7: "3788524500/2112349456/0" },   // camp/richeQuartz/n50/g1/moitie
  32: { 1: "1ff856b52de56bc95b3a00811ac3da9b", 2: "e88f6151beac551877b5502250c677ee", 4: 289, 6: "108156791317", 7: "3788524500/1605464656/0" },   // camp/richeScorie/n50/g1/toutes
  33: { 1: "68a0fe6b7050363ef6d68d682dfed7f7", 2: "f53e29311c4020105fcbd59f66f5ccd6", 4: 165, 6: "24350876846", 7: "3788524500/2112349456/0" },   // camp/richeScorie/n50/g1/moitie
  34: { 1: "a013586022a9c3f1ce233d1402624975", 2: "df083673bbde84aab153656f32ca9d5f", 4: 297, 6: "31876865340", 7: "5069152500/3088143984/0", 8: "0/4/14" },   // avantPoste/richeQuartz/n50/g1/toutes
  35: { 1: "294559fb4ec9b9eae0303ea6b06fcea4", 2: "f713d3efbe8caef9fdbd9a84db177537", 4: 211, 6: "8138132548", 7: "5069152500/3343502576/0" },   // avantPoste/richeQuartz/n50/g1/moitie
  36: { 1: "a013586022a9c3f1ce233d1402624975", 2: "74456b834ef6c674334b65b04f65a09f", 4: 297, 6: "31876865340", 7: "5069152500/3088143984/0", 8: "0/4/14" },   // avantPoste/richeScorie/n50/g1/toutes
  37: { 1: "294559fb4ec9b9eae0303ea6b06fcea4", 2: "e28616713731458018668fc319dbd0b6", 4: 211, 6: "8138132548", 7: "5069152500/3343502576/0" },   // avantPoste/richeScorie/n50/g1/moitie
  38: { 1: "2bbf2569061c984092e66d52cfd9cd97", 2: "4df80ab2a0c1c2e40d9049aa5f2b7409", 4: 350, 6: "43886354777", 7: "5602747500/4377106801/0" },   // base/-/n50/g1/toutes
  39: { 1: "cce6efd56e8f7c6f7617bbd9b3c5a8d9", 2: "dd5c801ff1161be3ba42522f2953eb05", 4: 297, 6: "7438207180", 7: "5602747500/4786744609/0" },   // base/-/n50/g1/moitie
  40: { 1: "6cb4bf6e3fc0e0abd232b6279d951ce0", 2: "b92d3dcb736105e1c08cca047d60f442", 4: 511, 7: "13176000/0/18945542" },   // camp/richeQuartz/n5/g2/toutes
  41: { 1: "0b966ec70b254482d3c350b0b74fd285", 2: "b6c3aacd14fa57caa717558951af3b44", 4: 491, 6: "44928", 7: "14640000/1241472/7613635" },   // camp/richeQuartz/n5/g2/moitie
  42: { 1: "6cb4bf6e3fc0e0abd232b6279d951ce0", 2: "0e9e88b0ac36a7063a65d428cce33a4c", 4: 511, 7: "13176000/0/18945542" },   // camp/richeScorie/n5/g2/toutes
  43: { 1: "0b966ec70b254482d3c350b0b74fd285", 2: "c952087dc39e6ebec5230798042fe5cb", 4: 491, 6: "44928", 7: "14640000/1241472/7613635" },   // camp/richeScorie/n5/g2/moitie
  44: { 1: "9a1a428ba0b89b57757048a052723c48", 2: "37c6cecae2abd1dcbf84012694ab7979", 4: 480, 7: "15372000/0/17191683", 8: "5/5/1" },   // avantPoste/richeQuartz/n5/g2/toutes
  45: { 1: "97579e6b285f93171be3a2586496157b", 2: "dc6123339eb6a351d6a4aa70bea95a65", 4: 392, 6: "78988", 7: "16836000/1901579/5056014", 8: "4/3/1" },   // avantPoste/richeQuartz/n5/g2/moitie
  46: { 1: "9a1a428ba0b89b57757048a052723c48", 2: "29bdc8b284500e64837bfbc4cdbceae2", 4: 480, 7: "15372000/0/17191683", 8: "5/5/1" },   // avantPoste/richeScorie/n5/g2/toutes
  47: { 1: "97579e6b285f93171be3a2586496157b", 2: "d6248f99dab946e2844280db82ab64ea", 4: 392, 6: "78988", 7: "16836000/1901579/5056014", 8: "4/3/1" },   // avantPoste/richeScorie/n5/g2/moitie
  48: { 1: "57816309893dea34eb128baf26cab312", 2: "0c18c3a25bde8bdcf58bd9e1df74dfc0", 4: 530, 7: "13176000/0/16688266" },   // base/-/n5/g2/toutes
  49: { 1: "f06ddebae9ee2fe98cec95349999ed0a", 2: "d26c8d8d6684c9f30c1d72c545ef59e7", 4: 495, 5: "{\"quartz\":3147,\"scorie\":4654}", 6: "145683", 7: "18646419/205470/2957213", 8: "4/5/3" },   // base/-/n5/g2/moitie
  50: { 1: "ae5ba93da60331124672d2178b25f01a", 2: "527f5d801c79510380256f381d15a3d6", 4: 361, 6: "18928918", 7: "152900000/47697359/0", 8: "0/7/14" },   // camp/richeQuartz/n20/g2/toutes
  51: { 1: "2089f6af2cf9678553fadbbbbf82690f", 2: "cf1fdfe7410116a8bbe6ad5fbed640a7", 4: 357 },   // camp/richeQuartz/n20/g2/moitie
  52: { 1: "ae5ba93da60331124672d2178b25f01a", 2: "13d38cbc606a7902cd247b12b1dd1182", 4: 361, 6: "18928918", 7: "152900000/47697359/0", 8: "0/7/14" },   // camp/richeScorie/n20/g2/toutes
  53: { 1: "2089f6af2cf9678553fadbbbbf82690f", 2: "25aa2b057bb61023464bea41c5d53c4c", 4: 357 },   // camp/richeScorie/n20/g2/moitie
  54: { 1: "0023e1278bfe903cad60ba1b85bbde22", 2: "2accdacb6d58ef4371a6a720e26f639e", 4: 372, 6: "22755918", 7: "211002000/72923316/0", 8: "0/9/14" },   // avantPoste/richeQuartz/n20/g2/toutes
  55: { 1: "c4fc95f55c1cc2147d5c087b8193432e", 2: "1458bb77ba5af4a306cda7f849d5b769", 4: 256, 6: "6473555", 7: "211002000/120229722/0" },   // avantPoste/richeQuartz/n20/g2/moitie
  56: { 1: "0023e1278bfe903cad60ba1b85bbde22", 2: "7dc310c7a655e74573b16d2a90291cf5", 4: 372, 6: "22755918", 7: "211002000/72923316/0", 8: "0/9/14" },   // avantPoste/richeScorie/n20/g2/toutes
  57: { 1: "c4fc95f55c1cc2147d5c087b8193432e", 2: "fe15d5c46641fe1e0537c1e97180c59b", 4: 256, 6: "6473555", 7: "211002000/120229722/0" },   // avantPoste/richeScorie/n20/g2/moitie
  58: { 1: "0d5270e74cb252542c20f4c984d0b219", 2: "1b164387f55ea187c4b76b855bdcd702", 4: 651, 5: "{\"quartz\":5055,\"scorie\":5055}", 6: "32665643", 7: "224960607/68734727/4948374", 8: "0/13/13" },   // base/-/n20/g2/toutes
  59: { 1: "454897d38a2686ba299eda9538105558", 2: "ab10b095f6db398ee44ddc90204e110a", 4: 549 },   // base/-/n20/g2/moitie
  60: { 1: "da96e76fafd71f6933ce8fb93c87f9b4", 2: "97d7a10bd6bfc5d413e680388da1463a", 4: 577, 6: "2459356346", 7: "855858000/275003905/0", 8: "0/11/14" },   // camp/richeQuartz/n35/g2/toutes
  61: { 1: "2947e7dba0c0a3fa2d0f6846eeac35bd", 2: "f69e367dc76c6a21f60f0c6d258e380a", 6: "256092779", 7: "855858000/582183813/0", 8: "0/2/7" },   // camp/richeQuartz/n35/g2/moitie
  62: { 1: "da96e76fafd71f6933ce8fb93c87f9b4", 2: "e3b47d0e0f33df7d7c57f90488492fc4", 4: 577, 6: "2459356346", 7: "855858000/275003905/0", 8: "0/11/14" },   // camp/richeScorie/n35/g2/toutes
  63: { 1: "2947e7dba0c0a3fa2d0f6846eeac35bd", 2: "5c12b8abdd1e10d23469ec0934ee83a6", 6: "256092779", 7: "855858000/582183813/0", 8: "0/2/7" },   // camp/richeScorie/n35/g2/moitie
  64: { 1: "f7beb5aca61650b3ab6fe4b2b0807785", 2: "28d6f02d66a71105aa69fcf47cc113f2", 4: 384, 6: "1791724311", 7: "1162434000/617386982/0" },   // avantPoste/richeQuartz/n35/g2/toutes
  65: { 1: "c06a9617579139831321ef1d4556f5a5", 2: "2b8d2e147cf200051fe23c32e6ba546d", 6: "149697483", 7: "1162434000/789449434/0" },   // avantPoste/richeQuartz/n35/g2/moitie
  66: { 1: "f7beb5aca61650b3ab6fe4b2b0807785", 2: "6df8e4129d17dd551b4ec6bd4693bdf6", 4: 384, 6: "1791724311", 7: "1162434000/617386982/0" },   // avantPoste/richeScorie/n35/g2/toutes
  67: { 1: "c06a9617579139831321ef1d4556f5a5", 2: "432d6eee762ff2246a1c25435a009a36", 6: "149697483", 7: "1162434000/789449434/0" },   // avantPoste/richeScorie/n35/g2/moitie
  68: { 1: "40259cecdcedecc234c60ab21f6f103b", 2: "37465b1836a3a136af83102a2b4d9d0d", 4: 249, 6: "1653755986", 7: "1251852000/592454714/0" },   // base/-/n35/g2/toutes
  69: { 1: "400528c504b9a98d1afbefaa4d4d51dc", 2: "bc0d10d512f1885b751779b8504e2db2", 6: "481077825", 7: "1251852000/742703693/0" },   // base/-/n35/g2/moitie
  70: { 1: "8cf8d91e110f7f8eacb560b96e212c89", 2: "a8d605b8b662df84b8976efb2eed3872", 4: 301, 6: "101173107756", 7: "3788524500/1721890579/0", 8: "0/7/14" },   // camp/richeQuartz/n50/g2/toutes
  71: { 1: "956509c02c29bc09f78a96bb4dc8fc0a", 2: "a3d4f4d9b0efd8b850c2b545fb50e2d5", 4: 260, 6: "24803391416", 7: "3788524500/2273120988/0" },   // camp/richeQuartz/n50/g2/moitie
  72: { 1: "8cf8d91e110f7f8eacb560b96e212c89", 2: "b512509b7473c3686e97783035356ef2", 4: 301, 6: "101173107756", 7: "3788524500/1721890579/0", 8: "0/7/14" },   // camp/richeScorie/n50/g2/toutes
  73: { 1: "956509c02c29bc09f78a96bb4dc8fc0a", 2: "902382dead70b659c9c6e5ca2f3dc200", 4: 260, 6: "24803391416", 7: "3788524500/2273120988/0" },   // camp/richeScorie/n50/g2/moitie
  74: { 1: "fd0040829ad71d0aef8107d3fd76a285", 2: "bd726abcaf5bdb907afd30d4221562c2", 4: 258, 6: "48284393025", 7: "5069152500/3181313814/0", 8: "0/6/14" },   // avantPoste/richeQuartz/n50/g2/toutes
  75: { 1: "acb4526cd4d8e03839fa1a775f272c4b", 2: "e7c877361d1c9662d65db6e6b94853fc", 4: 252, 6: "8694416091", 7: "5069152500/3969715869/0" },   // avantPoste/richeQuartz/n50/g2/moitie
  76: { 1: "fd0040829ad71d0aef8107d3fd76a285", 2: "bc92bd8dcc3709b88800b31aee9e3894", 4: 258, 6: "48284393025", 7: "5069152500/3181313814/0", 8: "0/6/14" },   // avantPoste/richeScorie/n50/g2/toutes
  77: { 1: "acb4526cd4d8e03839fa1a775f272c4b", 2: "2b0560f82ec64041abfc336869ca2542", 4: 252, 6: "8694416091", 7: "5069152500/3969715869/0" },   // avantPoste/richeScorie/n50/g2/moitie
  78: { 1: "0fd6ca26ea26dd76778795f17597b259", 2: "aa0c0b62b9101f6c4e707f488479a688", 4: 395, 6: "40490433423", 7: "5602747500/3883862080/0", 8: "0/4/14" },   // base/-/n50/g2/toutes
  79: { 1: "7532d955f466e078b83d683060e0b035", 2: "017b5560a0f43cbe1370fe819a5e7177", 4: 201, 6: "7782430121", 7: "5602747500/4507153496/0" },   // base/-/n50/g2/moitie
  80: { 1: "9399c80faa9073057ccfe77083c8ce66", 2: "07a26bd12eb22520a6e66b215f87dea5", 4: 407, 7: "6588000/0/19117816" },   // camp/richeQuartz/n5/g3/toutes
  81: { 1: "1e9bd2d18a2a76aea4d09d671ee457b8", 2: "41f3f2b0c6aabe33cb85b3bd9f96697a", 4: 383, 6: "61503", 7: "18300000/565301/4915518", 8: "2/2/2" },   // camp/richeQuartz/n5/g3/moitie
  82: { 1: "9399c80faa9073057ccfe77083c8ce66", 2: "d9b52ade229fd39b31065636836e8db5", 4: 407, 7: "6588000/0/19117816" },   // camp/richeScorie/n5/g3/toutes
  83: { 1: "1e9bd2d18a2a76aea4d09d671ee457b8", 2: "de8d192aaed0b049e86e1e7d98d9d0da", 4: 383, 6: "61503", 7: "18300000/565301/4915518", 8: "2/2/2" },   // camp/richeScorie/n5/g3/moitie
  84: { 1: "b28a10172c84c5549093ea2d910c20a6", 2: "3e1e2e5967ff1d3d2ac36279e8f553cd", 3: "souche", 4: 463, 5: "{\"quartz\":42256,\"scorie\":14085}", 7: "8784000/0/17005720", 8: "6/5/1" },   // avantPoste/richeQuartz/n5/g3/toutes
  85: { 1: "a29489549b3e4fa4f93dad0ae7972b56", 2: "4f55080690a05a7ce9836dad2750df6d", 4: 383, 5: "{\"quartz\":11620,\"scorie\":3873}", 6: "117015", 7: "20505480/350234/4204441", 8: "2/4/2" },   // avantPoste/richeQuartz/n5/g3/moitie
  86: { 1: "b28a10172c84c5549093ea2d910c20a6", 2: "3cd061e767fb102cc4e016c12c082dbb", 3: "souche", 4: 463, 5: "{\"quartz\":14085,\"scorie\":42256}", 7: "8784000/0/17005720", 8: "6/5/1" },   // avantPoste/richeScorie/n5/g3/toutes
  87: { 1: "a29489549b3e4fa4f93dad0ae7972b56", 2: "f0d8f5eae5d39142c01cf02347c26132", 4: 383, 5: "{\"quartz\":3873,\"scorie\":11620}", 6: "117015", 7: "20505480/350234/4204441", 8: "2/4/2" },   // avantPoste/richeScorie/n5/g3/moitie
  88: { 1: "34ad5bb8835e8d164449cf1862988927", 2: "bfd7115152e462a1b176463156c3551d", 4: 391, 7: "8784000/0/16843246" },   // base/-/n5/g3/toutes
  89: { 1: "6bf29ec06a0591b5a2b06128c99d6212", 2: "cb2e8fe1c49337177ae9bb4a142916f0", 4: 493, 5: "{\"quartz\":4630,\"scorie\":2369}", 6: "127101", 7: "22376024/963564/4310711", 8: "3/5/1" },   // base/-/n5/g3/moitie
  90: { 1: "137e3d5b31143a4cfd65b3b86ca13bc5", 2: "16a46a0db9b8f88b660a8d44c912dd1f", 4: 591, 5: "{\"quartz\":247027,\"scorie\":82342}", 6: "24615464", 7: "132462230/30885977/10290188" },   // camp/richeQuartz/n20/g3/toutes
  91: { 1: "fde827cfc79f02b8a0ebc5d0ef23274f", 2: "7fa2a720b99068ddafe337a198adda07", 6: "12206057", 7: "152900000/59293636/0" },   // camp/richeQuartz/n20/g3/moitie
  92: { 1: "137e3d5b31143a4cfd65b3b86ca13bc5", 2: "e2ce597d57f75797972e6ec9f0a2f54a", 4: 591, 5: "{\"quartz\":82342,\"scorie\":247027}", 6: "24615464", 7: "132462230/30885977/10290188" },   // camp/richeScorie/n20/g3/toutes
  93: { 1: "fde827cfc79f02b8a0ebc5d0ef23274f", 2: "7abad8d41b0e08d69a2294ead936f7dc", 6: "12206057", 7: "152900000/59293636/0" },   // camp/richeScorie/n20/g3/moitie
  94: { 1: "a4534368331e7eae27b3f82b0d4ed535", 2: "9a4ec240216459e7ee3b45d39f9a6ab4", 4: 545, 6: "25937036", 7: "211002000/69142725/0", 8: "0/10/14" },   // avantPoste/richeQuartz/n20/g3/toutes
  95: { 1: "80dce02ba0a1762ec2f66a78f8649da3", 2: "49991e186ff4c0c03449df26da6a979c", 4: 275, 6: "7037349", 7: "211002000/118934017/0", 8: "0/3/7" },   // avantPoste/richeQuartz/n20/g3/moitie
  96: { 1: "a4534368331e7eae27b3f82b0d4ed535", 2: "7f004e4a66e8d4fc34342f6f874db8c9", 4: 545, 6: "25937036", 7: "211002000/69142725/0", 8: "0/10/14" },   // avantPoste/richeScorie/n20/g3/toutes
  97: { 1: "80dce02ba0a1762ec2f66a78f8649da3", 2: "72f1b37a584ed73bd2e1a551a10585f5", 4: 275, 6: "7037349", 7: "211002000/118934017/0", 8: "0/3/7" },   // avantPoste/richeScorie/n20/g3/moitie
  98: { 1: "b64f636b1de95a3eede79233b824c8ed", 2: "7268c760d0a1a41885a6d6402a543ec3", 4: 495, 6: "21154754", 7: "226292000/90151601/0", 8: "0/12/14" },   // base/-/n20/g3/toutes
  99: { 1: "dd91f5ff10642399fd584477bad7e57c", 2: "37cb919eafe26fd2956d958500efaf1e", 4: 484, 5: "{\"quartz\":940,\"scorie\":940}", 6: "7732709", 7: "226044193/129476466/0", 8: "0/6/7" },   // base/-/n20/g3/moitie
  100: { 1: "0acd46ad0e194f225d62853379748a8b", 2: "37dbb95f8f96d7f705186978bb3d3636", 4: 420, 6: "1619675801", 7: "855858000/354681838/0", 8: "0/9/14" },   // camp/richeQuartz/n35/g3/toutes
  101: { 1: "ed55904a002f77e512032e6742327319", 2: "3af950db7b681daf04cb9a9bf01bea00", 4: 286, 6: "665797980", 7: "855858000/474174148/0" },   // camp/richeQuartz/n35/g3/moitie
  102: { 1: "0acd46ad0e194f225d62853379748a8b", 2: "676fb8dc6b9572a2f80b6d449b404ed9", 4: 420, 6: "1619675801", 7: "855858000/354681838/0", 8: "0/9/14" },   // camp/richeScorie/n35/g3/toutes
  103: { 1: "ed55904a002f77e512032e6742327319", 2: "12f47cec59914df5337e0aee2db96982", 4: 286, 6: "665797980", 7: "855858000/474174148/0" },   // camp/richeScorie/n35/g3/moitie
  104: { 1: "b7aca872930839f52e494b86035e8715", 2: "19e296752e4cc380e3a0f26a9414bed6", 4: 286, 6: "1399374576", 7: "1162434000/681389971/0", 8: "0/7/14" },   // avantPoste/richeQuartz/n35/g3/toutes
  105: { 1: "0cd85cfbf4644ca64f3569ec94faa37d", 2: "92fcff2dbb12c2a98ed4b54e370eb176", 4: 188, 6: "473665857", 7: "1162434000/814172153/0" },   // avantPoste/richeQuartz/n35/g3/moitie
  106: { 1: "b7aca872930839f52e494b86035e8715", 2: "551b6a55cc2c44175e381418c7cbfc96", 4: 286, 6: "1399374576", 7: "1162434000/681389971/0", 8: "0/7/14" },   // avantPoste/richeScorie/n35/g3/toutes
  107: { 1: "0cd85cfbf4644ca64f3569ec94faa37d", 2: "334862ee8d38c4324ca1fbed200187d5", 4: 188, 6: "473665857", 7: "1162434000/814172153/0" },   // avantPoste/richeScorie/n35/g3/moitie
  108: { 1: "ab8f63ddc83b8ff5f7945371f96d30e7", 2: "9496959f238ec9bc7a14c63142441b1c", 4: 221, 6: "672729422", 7: "1251852000/772110979/0" },   // base/-/n35/g3/toutes
  109: { 1: "41144ed7ad3ad80e45a2e3be5da04758", 2: "80309bca92c05ce87c74ccd62b261b1d", 4: 171, 6: "80988562", 7: "1251852000/944827862/0" },   // base/-/n35/g3/moitie
  110: { 1: "91169e1e703459257df9ad9a0e8e65a3", 2: "d4669080e2ce8dea540c39ad00d162c6", 4: 303, 6: "91564299696", 7: "3788524500/2091552204/0" },   // camp/richeQuartz/n50/g3/toutes
  111: { 1: "afc2ad6651d67346f37caa5603812a0d", 2: "1a65c5606bd3f6a526d8c57f79a7ed61", 4: 172, 6: "4648100536", 7: "3788524500/2575299442/0" },   // camp/richeQuartz/n50/g3/moitie
  112: { 1: "91169e1e703459257df9ad9a0e8e65a3", 2: "89b0f513c847c31398da55e73b119ecc", 4: 303, 6: "91564299696", 7: "3788524500/2091552204/0" },   // camp/richeScorie/n50/g3/toutes
  113: { 1: "afc2ad6651d67346f37caa5603812a0d", 2: "10c8e117afb7ec69d042f60f99143989", 4: 172, 6: "4648100536", 7: "3788524500/2575299442/0" },   // camp/richeScorie/n50/g3/moitie
  114: { 1: "fd57202043f547d6d7afbe114905bf19", 2: "8c5ff77ff9093f47b76737fea7b20479", 4: 234, 6: "52983131255", 7: "5069152500/2927002840/0" },   // avantPoste/richeQuartz/n50/g3/toutes
  115: { 1: "75c08751c375acb7427f20c76c824373", 2: "fb168b7c5d0391f45fa77add996949a3", 4: 257, 6: "21183558819", 7: "5069152500/3496912101/0", 8: "0/3/7" },   // avantPoste/richeQuartz/n50/g3/moitie
  116: { 1: "fd57202043f547d6d7afbe114905bf19", 2: "0beb46284987922fda59a0bb9f9335d2", 4: 234, 6: "52983131255", 7: "5069152500/2927002840/0" },   // avantPoste/richeScorie/n50/g3/toutes
  117: { 1: "75c08751c375acb7427f20c76c824373", 2: "df02aaf2de80ee048d71a259a0657278", 4: 257, 6: "21183558819", 7: "5069152500/3496912101/0", 8: "0/3/7" },   // avantPoste/richeScorie/n50/g3/moitie
  118: { 1: "4d06404df7a8b3f82b324498719e5e19", 2: "28eef9a18e2f0e41dece52c275db7c1f", 4: 343, 6: "79069146053", 7: "5602747500/3915005277/0" },   // base/-/n50/g3/toutes
  119: { 1: "c87c1ea6debf8801cf0452d1fc809e4e", 2: "12c07b2379bcb83e8b30b2b032e42c1e", 4: 211, 6: "9513538202", 7: "5602747500/4347076734/0" },   // base/-/n50/g3/moitie
  120: { 1: "a246ae8f2c091af0f687898f6a7e6715", 2: "ef932741e68752ab6fb54fcbb9305dce", 4: 645, 7: "9516000/0/19306001" },   // camp/richeQuartz/n5/g4/toutes
  121: { 1: "8ea8f3bfb5af8609f84509fd72ed3b29", 2: "5ae8b9e506900b861bfaaada0d480a61", 4: 617, 6: "68395", 7: "16836000/284124/6191303", 8: "3/2/0" },   // camp/richeQuartz/n5/g4/moitie
  122: { 1: "a246ae8f2c091af0f687898f6a7e6715", 2: "b18ec58616f9649adc68bd9eab8acebd", 4: 645, 7: "9516000/0/19306001" },   // camp/richeScorie/n5/g4/toutes
  123: { 1: "8ea8f3bfb5af8609f84509fd72ed3b29", 2: "501314b4fb969fd1215ea4817dca95bf", 4: 617, 6: "68395", 7: "16836000/284124/6191303", 8: "3/2/0" },   // camp/richeScorie/n5/g4/moitie
  124: { 1: "190a4bd4699eeac807909f9ed1716b83", 2: "4e91834884b43fd7433a24cb796ed769", 4: 527, 7: "11712000/0/19536765" },   // avantPoste/richeQuartz/n5/g4/toutes
  125: { 1: "b75d17b46298f71ae67e1106736f0ba3", 2: "7d61282caec9821898cff1fc0f14f21b", 4: 444, 6: "55626", 7: "19032000/2854661/4509981" },   // avantPoste/richeQuartz/n5/g4/moitie
  126: { 1: "190a4bd4699eeac807909f9ed1716b83", 2: "fc9255fbb1df700e17bc4ee66e076f00", 4: 527, 7: "11712000/0/19536765" },   // avantPoste/richeScorie/n5/g4/toutes
  127: { 1: "b75d17b46298f71ae67e1106736f0ba3", 2: "c6a50c448b8cdc011f8aa2f7c6ed5010", 4: 444, 6: "55626", 7: "19032000/2854661/4509981" },   // avantPoste/richeScorie/n5/g4/moitie
  128: { 1: "807396f2aa84f3d7dc654638af836b5e", 2: "c4c4872496f0fe5da4d92555676761de", 4: 547, 6: "150720", 7: "13176000/0/18242360", 8: "7/6/1" },   // base/-/n5/g4/toutes
  129: { 1: "9f60b3df30f388d8d9ae6ee57268e726", 2: "23a84b5b296f91b392322dd9db512beb", 4: 391, 6: "104406", 7: "20496000/1889399/3412964", 8: "4/4/3" },   // base/-/n5/g4/moitie
  130: { 1: "2799c46a8fe6a140bd6a747f14378322", 2: "6a8d8a311f501ce86936cca15e2b0e15", 4: 575, 5: "{\"quartz\":144488,\"scorie\":48162}", 6: "25051448", 7: "141624842/24950257/13612534", 8: "1/10/11" },   // camp/richeQuartz/n20/g4/toutes
  131: { 1: "8216bed317d3e3f8effe4ad8ea743dd4", 2: "20a64770fa1681bbe62e7ed43ae26769", 4: 297, 6: "9911392", 7: "152900000/68629398/0" },   // camp/richeQuartz/n20/g4/moitie
  132: { 1: "2799c46a8fe6a140bd6a747f14378322", 2: "b5d148117e45225339e102b4a6dfe3be", 4: 575, 5: "{\"quartz\":48162,\"scorie\":144488}", 6: "25051448", 7: "141624842/24950257/13612534", 8: "1/10/11" },   // camp/richeScorie/n20/g4/toutes
  133: { 1: "8216bed317d3e3f8effe4ad8ea743dd4", 2: "a23424b24201792e747990a44ad46fce", 4: 297, 6: "9911392", 7: "152900000/68629398/0" },   // camp/richeScorie/n20/g4/moitie
  134: { 1: "c1a611454e26f845018115b2316de8aa", 2: "6cd0aa8e1946359961abe558073b6a6c", 4: 329, 5: "{\"quartz\":0,\"scorie\":0}", 6: "21963926", 7: "211002000/87388936/0", 8: "0/9/14" },   // avantPoste/richeQuartz/n20/g4/toutes
  135: { 1: "61349f28cb6aee83ce9234a79d295f5e", 2: "85062aa87acba378f4d1d1de577b4607", 4: 219, 6: "6723607", 7: "211002000/132328483/0" },   // avantPoste/richeQuartz/n20/g4/moitie
  136: { 1: "c1a611454e26f845018115b2316de8aa", 2: "a9dfc291a073d4f594c39e7d48ccbaba", 4: 329, 5: "{\"quartz\":0,\"scorie\":0}", 6: "21963926", 7: "211002000/87388936/0", 8: "0/9/14" },   // avantPoste/richeScorie/n20/g4/toutes
  137: { 1: "61349f28cb6aee83ce9234a79d295f5e", 2: "b85098457530fa84d51559f971625bc2", 4: 219, 6: "6723607", 7: "211002000/132328483/0" },   // avantPoste/richeScorie/n20/g4/moitie
  138: { 1: "088ad070fb5a57233a6c7cf522c1e2bd", 2: "0e47d0c082271a88428a6d1d3ee98192", 4: 366, 5: "{\"quartz\":4837,\"scorie\":4837}", 6: "20488842", 7: "225017865/88379804/0", 8: "0/10/14" },   // base/-/n20/g4/toutes
  139: { 1: "1c954cfde559c2c21a3c177b77af579c", 2: "191507969aa032d7d0d357db98bd8908", 4: 285, 6: "7409709", 7: "226292000/126032134/0", 8: "0/4/7" },   // base/-/n20/g4/moitie
  140: { 1: "48e20e7000f270e93237052462d39e3d", 2: "fa1d8aad20eeac1a2462d7cd8b6719b7", 4: 220, 6: "741026323", 7: "855858000/496995607/0" },   // camp/richeQuartz/n35/g4/toutes
  141: { 1: "6b1eee27e2a561b6786fb9db6f41142e", 2: "d5c2257b7abf48f380918b441b14f48a", 4: 218, 6: "372716686", 7: "855858000/592084936/0", 8: "0/2/7" },   // camp/richeQuartz/n35/g4/moitie
  142: { 1: "48e20e7000f270e93237052462d39e3d", 2: "e91c037f5220422fe73a8b23345f8078", 4: 220, 6: "741026323", 7: "855858000/496995607/0" },   // camp/richeScorie/n35/g4/toutes
  143: { 1: "6b1eee27e2a561b6786fb9db6f41142e", 2: "cd7cadfd0434f2241e8e356bf3f85e78", 4: 218, 6: "372716686", 7: "855858000/592084936/0", 8: "0/2/7" },   // camp/richeScorie/n35/g4/moitie
  144: { 1: "8cc06db0a9892b103e06bcef00d00894", 2: "d8892c81a370088f842fde2a997ca9e6", 4: 353, 6: "2655124344", 7: "1162434000/515261435/0", 8: "0/13/14" },   // avantPoste/richeQuartz/n35/g4/toutes
  145: { 1: "e5cfc162370db60dc39bcac94a3f403f", 2: "2662f1cfb01bccc9182f0866dc04cf53", 4: 187, 6: "759433042", 7: "1162434000/734315096/0" },   // avantPoste/richeQuartz/n35/g4/moitie
  146: { 1: "8cc06db0a9892b103e06bcef00d00894", 2: "07f596bdd6cedaf851919f89f38f4db0", 4: 353, 6: "2655124344", 7: "1162434000/515261435/0", 8: "0/13/14" },   // avantPoste/richeScorie/n35/g4/toutes
  147: { 1: "e5cfc162370db60dc39bcac94a3f403f", 2: "ff7f9eae57656928be347e28bc20b402", 4: 187, 6: "759433042", 7: "1162434000/734315096/0" },   // avantPoste/richeScorie/n35/g4/moitie
  148: { 1: "8c86849ec7b4c1de9a30de03ab835166", 2: "d445198447347ffa1cc016b6b844e367", 4: 657, 6: "3258326525", 7: "1251852000/500208774/0", 8: "0/14/14" },   // base/-/n35/g4/toutes
  149: { 1: "babf35e802311b03b0ff403efa1f50f7", 2: "85fc0ad3a3707b924a0610a3b98396c1", 4: 263, 6: "904507563", 7: "1251852000/851055830/0" },   // base/-/n35/g4/moitie
  150: { 1: "aa6b4371458b2744870387876546a30e", 2: "39c96b619dfeecfce483e2a90f8b1a1f", 4: 290, 6: "55574718105", 7: "3788524500/2180482163/0" },   // camp/richeQuartz/n50/g4/toutes
  151: { 1: "25e1cfdcb5662d6796a1e9ebb8980c18", 2: "b4834541ed3cc7cdf802c638d9786f68", 6: "5038627776", 7: "3788524500/2488195127/0" },   // camp/richeQuartz/n50/g4/moitie
  152: { 1: "aa6b4371458b2744870387876546a30e", 2: "60ef7d842cb6be3c207f8930ff010cc4", 4: 290, 6: "55574718105", 7: "3788524500/2180482163/0" },   // camp/richeScorie/n50/g4/toutes
  153: { 1: "25e1cfdcb5662d6796a1e9ebb8980c18", 2: "98dd89d1dcb1f7aab034fe066e19b86a", 6: "5038627776", 7: "3788524500/2488195127/0" },   // camp/richeScorie/n50/g4/moitie
  154: { 1: "81c2dc34f96afb18c2719d7f987fc91f", 2: "7bdf5ed00532fe8f8b59ada8652bd866", 4: 296, 6: "38413443074", 7: "5069152500/2793599006/0", 8: "0/9/14" },   // avantPoste/richeQuartz/n50/g4/toutes
  155: { 1: "d5d3de0582c1e154c04050ef33212f52", 2: "bfe84e7632c6f249983c0e4b30230fa4", 4: 296, 6: "17455375702", 7: "5069152500/3661961212/0", 8: "0/5/7" },   // avantPoste/richeQuartz/n50/g4/moitie
  156: { 1: "81c2dc34f96afb18c2719d7f987fc91f", 2: "4f5363834d3e8a8b7132b4444ab1f7c3", 4: 296, 6: "38413443074", 7: "5069152500/2793599006/0", 8: "0/9/14" },   // avantPoste/richeScorie/n50/g4/toutes
  157: { 1: "d5d3de0582c1e154c04050ef33212f52", 2: "1c4693f3c0c64cc1233ef49c78b02e1e", 4: 296, 6: "17455375702", 7: "5069152500/3661961212/0", 8: "0/5/7" },   // avantPoste/richeScorie/n50/g4/moitie
  158: { 1: "128a0a4c2d2e5fa0b260d4b56f57fa39", 2: "e4d035d1d43237d52553dbb65464a55d", 4: 224, 6: "25220673197", 7: "5602747500/3532926949/0" },   // base/-/n50/g4/toutes
  159: { 1: "9d421b8e81aa17aa25fdbf64b95c7fb1", 2: "a71c8b2b7fff24570902eaba36d1a099", 4: 169, 6: "5097962241", 7: "5602747500/3840698354/0" },   // base/-/n50/g4/moitie
  160: { 1: "d1f9f4be992553e08a403041e1c5d806", 2: "860f0eec5fe86ee28967dfedc72cf879", 4: 488, 7: "9516000/0/19350326" },   // camp/richeQuartz/n5/g5/toutes
  161: { 1: "d0043356153906fa0085da5988c021e7", 2: "bddb404979ce85f3a2a75170adaefb40", 4: 484, 6: "59498", 7: "12444000/647088/7232633" },   // camp/richeQuartz/n5/g5/moitie
  162: { 1: "d1f9f4be992553e08a403041e1c5d806", 2: "75671517c02b5c7d4d5ab16935f45fcf", 4: 488, 7: "9516000/0/19350326" },   // camp/richeScorie/n5/g5/toutes
  163: { 1: "d0043356153906fa0085da5988c021e7", 2: "e38c7c0f8204c3e3e456c80c5f8f20b4", 4: 484, 6: "59498", 7: "12444000/647088/7232633" },   // camp/richeScorie/n5/g5/moitie
  164: { 1: "7a323007b2c25865ea5b43c2fdd07cab", 2: "76c15ee05c4cf3773463f2dab41a280e", 4: 476, 7: "10980000/0/17282676" },   // avantPoste/richeQuartz/n5/g5/toutes
  165: { 1: "54a05a2c029e3ffc377800587d311b2f", 2: "69e875837146629d280170b01e57ce62", 4: 495, 6: "125600", 7: "15372000/0/5876536", 8: "5/5/0" },   // avantPoste/richeQuartz/n5/g5/moitie
  166: { 1: "7a323007b2c25865ea5b43c2fdd07cab", 2: "b6b2d02f9fd422f7d3c2db3795e00dc1", 4: 476, 7: "10980000/0/17282676" },   // avantPoste/richeScorie/n5/g5/toutes
  167: { 1: "54a05a2c029e3ffc377800587d311b2f", 2: "b549be191f89dde6cc43246211c4ebd4", 4: 495, 6: "125600", 7: "15372000/0/5876536", 8: "5/5/0" },   // avantPoste/richeScorie/n5/g5/moitie
  168: { 1: "cd6a62044f0cc514e2aebd0acd77e105", 2: "6828c800893fc1cc0d86989c8632cb1a", 4: 458, 7: "13908000/0/17151916", 8: "7/6/2" },   // base/-/n5/g5/toutes
  169: { 1: "e8713bba77f1dc2935df0f45cd907e5a", 2: "d02a5f97119b2d6b4b0bd2386a292c57", 4: 409, 6: "103113", 7: "17568000/1942155/4066360", 8: "5/4/3" },   // base/-/n5/g5/moitie
  170: { 1: "c18a020c173ff3b387f63dc3e39d3b18", 2: "b0e23a124eac58a0df6a34bb67c1aa9e", 4: 858, 5: "{\"quartz\":209000,\"scorie\":69666}", 6: "22293312", 7: "131494000/25687200/16116864", 8: "3/11/10" },   // camp/richeQuartz/n20/g5/toutes
  171: { 1: "1d2c1498213736b8aefb0a4ee20456df", 2: "267ed4253e1b97fd2896c87e285bbe9b", 4: 261, 6: "9544438", 7: "152900000/57428940/0" },   // camp/richeQuartz/n20/g5/moitie
  172: { 1: "c18a020c173ff3b387f63dc3e39d3b18", 2: "c5062dc62a0aa1115ef5f1b1af54468e", 4: 858, 5: "{\"quartz\":69666,\"scorie\":209000}", 6: "22293312", 7: "131494000/25687200/16116864", 8: "3/11/10" },   // camp/richeScorie/n20/g5/toutes
  173: { 1: "1d2c1498213736b8aefb0a4ee20456df", 2: "10313c03ad3b334ac0c3cdc7bb5e0e80", 4: 261, 6: "9544438", 7: "152900000/57428940/0" },   // camp/richeScorie/n20/g5/moitie
  174: { 1: "bcf17fefaed8a4db6febf00ab55bb5c6", 2: "d4c10c4cd495a76da97590e62756ac2f", 4: 463, 5: "{\"quartz\":9112,\"scorie\":3037}", 6: "24807649", 7: "210509688/70958510/3593771" },   // avantPoste/richeQuartz/n20/g5/toutes
  175: { 1: "b07fdaa863f99fbc7c47a86ee5b3b379", 2: "f585130ae0411ca15f6cf4029a405e97", 6: "9100308", 7: "211002000/117755534/0" },   // avantPoste/richeQuartz/n20/g5/moitie
  176: { 1: "bcf17fefaed8a4db6febf00ab55bb5c6", 2: "1fc4ca38e9ccae42c8b6aca2f60348ae", 4: 463, 5: "{\"quartz\":3037,\"scorie\":9112}", 6: "24807649", 7: "210509688/70958510/3593771" },   // avantPoste/richeScorie/n20/g5/toutes
  177: { 1: "b07fdaa863f99fbc7c47a86ee5b3b379", 2: "59cdf0db10d31f082c2ef8aa132d17de", 6: "9100308", 7: "211002000/117755534/0" },   // avantPoste/richeScorie/n20/g5/moitie
  178: { 1: "1c3654e60dee3f8f50335e764b7af402", 2: "39a3a7dc65893b3e516452b5733b2ff8", 4: 304, 6: "17823770", 7: "226292000/100574919/0", 8: "0/7/14" },   // base/-/n20/g5/toutes
  179: { 1: "c94d4bac39abd03f24fd0d96e30ca252", 2: "83fb812f474e1e0c0c40c0b4785b4247", 4: 312, 6: "9542992", 7: "226292000/121568032/0", 8: "0/3/7" },   // base/-/n20/g5/moitie
  180: { 1: "dbd4bbef8fde56c5182806888415a6b7", 2: "8e7a6926ac5a1bc5aeccd3b4531dde55", 4: 335, 6: "571043504", 7: "855858000/378344754/0" },   // camp/richeQuartz/n35/g5/toutes
  181: { 1: "c8a5f8b3ea27d23c1e870efdb8df6c90", 2: "de2eb1bd71c684290dad0fa4083e117e", 4: 538, 6: "111811752", 7: "855858000/521416353/0" },   // camp/richeQuartz/n35/g5/moitie
  182: { 1: "dbd4bbef8fde56c5182806888415a6b7", 2: "4e96193a6aa2441dda50b52d74d23d4b", 4: 335, 6: "571043504", 7: "855858000/378344754/0" },   // camp/richeScorie/n35/g5/toutes
  183: { 1: "c8a5f8b3ea27d23c1e870efdb8df6c90", 2: "c6bc3419805396c60bb246772694fdb1", 4: 538, 6: "111811752", 7: "855858000/521416353/0" },   // camp/richeScorie/n35/g5/moitie
  184: { 1: "4d5dca4f36bf2a526709b42bd70ab011", 2: "96c0045e2f1910f7abd71c503600ad4e", 4: 219, 6: "992004701", 7: "1162434000/637798650/0" },   // avantPoste/richeQuartz/n35/g5/toutes
  185: { 1: "4ed1138ea4977c11e5fabc28f7081b3f", 2: "1ffa706e3f52068d1c5e0ea18e7fab91", 4: 223, 6: "319062924", 7: "1162434000/693290491/0" },   // avantPoste/richeQuartz/n35/g5/moitie
  186: { 1: "4d5dca4f36bf2a526709b42bd70ab011", 2: "b45553cd65c3e4230b2d01ad41a1d36c", 4: 219, 6: "992004701", 7: "1162434000/637798650/0" },   // avantPoste/richeScorie/n35/g5/toutes
  187: { 1: "4ed1138ea4977c11e5fabc28f7081b3f", 2: "235bf30bb666244a667e7abd8dcd94db", 4: 223, 6: "319062924", 7: "1162434000/693290491/0" },   // avantPoste/richeScorie/n35/g5/moitie
  188: { 1: "993edc54ef0a1d464bcfd1993d4bdefb", 2: "6d2d20dfa2179d722aa9f6125eca0666", 4: 541, 6: "2693521352", 7: "1251852000/525631407/0", 8: "0/14/14" },   // base/-/n35/g5/toutes
  189: { 1: "c92e579f034a258c92ef7d34e7839f30", 2: "2efb29664e582e6306f2dd2b7ea05990", 4: 341, 6: "1021333177", 7: "1251852000/767599532/0" },   // base/-/n35/g5/moitie
  190: { 1: "5c505438fceba28434887999b4afeee5", 2: "8ef674d8938e18e72d3711efdb480926", 4: 385, 6: "100314241498", 7: "3788524500/1777340785/0" },   // camp/richeQuartz/n50/g5/toutes
  191: { 1: "fa07754210935fa2d26374b8992a0b60", 2: "1b4b7b3bde939e33e2bf3fc06c0e959b", 6: "7145423979", 7: "3788524500/2339348209/0" },   // camp/richeQuartz/n50/g5/moitie
  192: { 1: "5c505438fceba28434887999b4afeee5", 2: "bfff3a77d96a2799efd2cbb1cbbd2ea4", 4: 385, 6: "100314241498", 7: "3788524500/1777340785/0" },   // camp/richeScorie/n50/g5/toutes
  193: { 1: "fa07754210935fa2d26374b8992a0b60", 2: "1276ded32a755092df23e89214a61c36", 6: "7145423979", 7: "3788524500/2339348209/0" },   // camp/richeScorie/n50/g5/moitie
  194: { 1: "b7bb7722457ec6783ec0d4232bb0a7e3", 2: "9846895ee82458825e9293d2818fb541", 4: 373, 6: "71813148550", 7: "5069152500/3200035057/0", 8: "0/4/14" },   // avantPoste/richeQuartz/n50/g5/toutes
  195: { 1: "2f232a844d0d1fadd6c0ff130bcfd8d6", 2: "a5c24b6f276ff96398583d81973d27a2", 4: 170, 6: "7300124187", 7: "5069152500/3652580628/0" },   // avantPoste/richeQuartz/n50/g5/moitie
  196: { 1: "b7bb7722457ec6783ec0d4232bb0a7e3", 2: "21446ae4c27fa04b72a873819000c69c", 4: 373, 6: "71813148550", 7: "5069152500/3200035057/0", 8: "0/4/14" },   // avantPoste/richeScorie/n50/g5/toutes
  197: { 1: "2f232a844d0d1fadd6c0ff130bcfd8d6", 2: "8e404cc3f4ef1a6a5177da94bfdc5eda", 4: 170, 6: "7300124187", 7: "5069152500/3652580628/0" },   // avantPoste/richeScorie/n50/g5/moitie
  198: { 1: "a954c4de57ca77b6e827cd5da846a1b1", 2: "f128c7f6fa0d4cfd4a469bac84ecccb8", 4: 324, 6: "59402535770", 7: "5602747500/4338385341/0" },   // base/-/n50/g5/toutes
  199: { 1: "50afeadea6db79c087420a9b555392b5", 2: "9586c7f17bd4cc1bb07cca6099dcbc2b", 6: "8180903249", 7: "5602747500/4654103997/0" },   // base/-/n50/g5/moitie
};
