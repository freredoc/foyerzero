// Courbe de niveau des statistiques de combat — transcription figée.
//
// SOURCE : `RELEVE-TA-COURBES-2.md` §0, « les cinq lois » — captures directes
// de l'Arsenal du jeu d'origine, valeurs LUES À L'ÉCRAN et jamais interpolées.
// Les points de vie y sont mesurés à ×1,10 par niveau, régime UNIQUE de 1 à 50,
// avec 0,02 % d'écart résiduel sur neuf niveaux. Appliqué au code le 25/08/2026
// (lot COURBE, `rapports/PASSATION-2026-08-25.md` §2.1) ; il remplace
// l'arbitrage du lot 2B.
//
// ⚠⚠ CETTE LIGNE A CITÉ LE CLASSEUR PENDANT QUATRE JOURS, ET ÇA A COÛTÉ UNE
// SESSION ENTIÈRE. Elle disait « arbitrage d'Ethan du 25/08/2026, onglet COURBE
// du classeur FOYER-ZERO-BATIMENTS-JOUEUR.xlsx » — or le §1 du CLAUDE.md
// interdit de lire un `.xlsx` pour coder et déclare celui-ci resté à l'état
// d'avant l'audit du 23/08. La source était donc INVÉRIFIABLE : la pente a eu
// l'air inventée, il a fallu remonter toute la piste — passation, tests,
// documents de rang 4 — pour retrouver qu'elle était MESURÉE, et conclure
// entre-temps le contraire. **Une citation qui renvoie à une source qu'on
// s'interdit de lire ne vaut pas mieux que pas de citation du tout.** Corrigée
// le 29/08 : elle pointe maintenant un document du dépôt, que n'importe qui
// peut ouvrir et confronter.
//
// ⚠ `COURBE-DE-NIVEAU-2.md` §1 DIT ×1,32, ET IL EST ANTÉRIEUR À LA MESURE.
// Il DÉDUISAIT la pente — « PV et dégâts croissent exactement comme le reste » —
// pour satisfaire la propriété du miroir ; le relevé du même jour l'a MESURÉE.
// Ce document se dit lui-même remplacé, en en-tête du relevé, pour son §2 ; son
// §1 l'est par la mesure du §0. Ne pas rouvrir l'un sans relire l'autre.
//
// ⚠⚠ ET LES DÉGÂTS DIVERGENT DU RELEVÉ, DÉLIBÉRÉMENT. Le §0 les mesure à ×1,10
// puis AMORTIS vers ×1,086, avec une rupture au niveau 11 ; ce fichier garde
// 1,1 pour les dégâts comme pour les PV. Mesuré : au niveau 50 les dégâts du
// code valent 64,8 % de plus que ceux du jeu d'origine (106,7 contre 64,8).
// Ce qu'on achète avec cet écart est écrit juste en dessous — c'est le MIROIR :
// avec les deux vraies courbes, le temps pour tuer son propre miroir passe de
// 1,00 au niveau 1 à 1,65 au niveau 50, et un combat à niveaux égaux cesse
// d'être identique à lui-même. Choix de conception, pas approximation.
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
