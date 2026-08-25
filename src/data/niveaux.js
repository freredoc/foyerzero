// Courbe de niveau des statistiques de combat — transcription figée.
//
// SOURCE : arbitrage d'Ethan du 25/08/2026, onglet COURBE du classeur
// FOYER-ZERO-BATIMENTS-JOUEUR.xlsx. Il remplace l'arbitrage du lot 2B.
//
// CE QUI A CHANGÉ, ET POURQUOI. Le lot 2B faisait croître les PV et les dégâts
// comme le butin et les coûts : deux régimes, 1,259 puis 1,32, soit × 480 942 au
// niveau 50. Cette égalité n'était pas nécessaire — elle était commode. Elle
// coûtait deux débordements arithmétiques (COURBE-DE-NIVEAU-2.md §5 et §7) et un
// écart de niveau brutal (+1 niveau = × 1,74 d'avantage effectif).
//
// La propriété qui compte vraiment est plus faible que ça : les PV et les dégâts
// doivent partager LA MÊME courbe, quelle qu'elle soit. C'est elle qui fait tenir
// le miroir — un niveau 30 contre son miroir se comporte comme un niveau 50
// contre le sien. Une pente unique de 1,1 la respecte tout autant.
//
// CE QUE ÇA DONNE :
//   niveau 12 → × 2,9   (contre × 13 avant)
//   niveau 30 → × 15,9  (contre × 1 865)
//   niveau 50 → × 106,7 (contre × 480 942)
// Le produit intermédiaire du calcul de dégâts passe de 1,5 × 10²² — un million
// et demi de fois l'entier sûr — à 2,6 × 10¹⁴, soit 35 fois de marge SOUS la
// limite. Le débordement du §5 disparaît sans correctif.
//
// CE QUE ÇA COÛTE : l'écart de niveau devient doux. +1 vaut × 1,21 d'avantage
// effectif au lieu de × 1,74 ; +5 vaut × 2,59 au lieu de × 16. La pression
// géographique de la §10 de la spec — 0,2 niveau par case, attaque près de chez
// toi — s'en trouve très allégée. C'est une conséquence assumée, pas un effet de
// bord : elle est écrite ici pour que personne ne la redécouvre par surprise.
//
// Ne montent PAS avec le niveau : réserve, portée, portée minimale, vitesse,
// masse, points d'armée, cadence. Un test le vérifie ligne à ligne — sans lui,
// la première mise à l'échelle distraite les emporterait.

export const NIVEAU = {
  // Une seule pente désormais. Le drapeau reste : il coûte une ligne et il
  // permet de rejouer l'ancien régime pour comparer, sans réécrire le module.
  deuxRegimes: false,

  penteBasse: 1.1, // inutilisée tant que deuxRegimes vaut false
  penteHaute: 1.1, // la pente unique des PV et des dégâts
  niveauBascule: 12,

  // Plafond de niveau du jeu. Même valeur que GEOGRAPHIE.niveauPlafond de
  // sites.js, et un test l'assied : deux tables qui parlent du même plafond ne
  // doivent jamais pouvoir diverger en silence.
  plafond: 50,
};
