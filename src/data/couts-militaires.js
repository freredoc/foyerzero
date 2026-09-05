// Coûts de la défense et de l'offense — transcription figée.
//
// SOURCE : arbitrage d'Ethan du 28/08/2026, rendu mot pour mot ci-dessous, pour
// l'ANCRE — le coût du niveau 2, entité par entité. La COURBE qui la prolonge
// n'est pas arbitrée ici : c'est celle d'`ECONOMIE_NIVEAU`, relevée dans
// RELEVE-TA-COURBES-2.md, la même que pour les bâtiments de la base.
//
//   « une unité posée en def ou off est niveau 1 et gratuit. les coûts
//     d'amélioration/stat suivent relevé courbe ta 2 md du repo. en revanche
//     je ne vois pas les coûts de construction niv 2, les voici […] »
//
// CE FICHIER COMBLE LE DERNIER TROU DU MODÈLE DE COÛTS. `data/base.js` portait
// l'ancre des onze bâtiments depuis le 25/08 ; défense et offense n'avaient que
// la promesse d'une ressource, écrite dans `RESSOURCE_DE_COUT` le 27/08 et que
// rien ne chiffrait. Le brief du lot GARNISON-ET-ARMÉE les excluait encore le
// 28/08 au matin, au motif « non arbitré » : l'arbitrage est tombé le même jour.
//
// ---------------------------------------------------------------------------
// LES TROIS PIÈGES DE CE FICHIER
// ---------------------------------------------------------------------------
//
// ⚠⚠ 1. LA MÊME UNITÉ NE COÛTE PAS LE MÊME PRIX EN DÉFENSE ET EN OFFENSE, et
// l'écart va jusqu'au rapport de 2,5. Le Voltigeur vaut 5 en assaut et 2 en
// garnison, le Chasseur 4 et 2, le Fusilier 2 et 1. Seul le Percheron coûte le
// même prix des deux côtés (12). Il y a donc DEUX tables d'ancres, jamais une
// seule indexée par unité — une table unique se serait écrite sans y penser,
// aurait paru marcher, et aurait faussé la moitié des prix en silence.
//
// ⚠⚠ 2. LA DÉFENSE SE PAIE DANS DEUX RESSOURCES, et c'est ce qui a fait sortir
// la clé `defense` de `RESSOURCE_DE_COUT`. Les six ouvrages fixes — mur,
// barbelés, barrière anti-char, tourelle mitrailleuse, canon anti-char, DCA —
// se paient en QUARTZ comme des bâtiments. Les trois artilleries et les huit
// unités de garnison se paient en SCORIE. La ressource est donc écrite LIGNE
// PAR LIGNE ici : c'est la forme exacte de l'arbitrage, et aucune règle ne la
// résume sans mentir sur au moins une entité.
//
// ⚠ Le partage n'est pourtant PAS arbitraire, et le dépôt le disait déjà avant
// cet arbitrage : `data/combat.js` écrit noir sur blanc que « les trois
// artilleries — la Faucheuse, le Mortier et le Harpon — sont des VÉHICULES, pas
// des structures ». Ce qui roule se paie en scorie, ce qui est bâti se paie en
// quartz. La corrélation avec le champ `type` est ASSERTÉE par un test — pas
// pour en déduire la ressource, mais pour que le jour où une donnée future s'en
// écarte, quelqu'un ait à le décider au lieu de le laisser passer.
//
// ⚠ 3. LE NIVEAU 1 EST GRATUIT, DES DEUX CÔTÉS. C'est
// `ECONOMIE_NIVEAU.premierNiveauPayant`, qui vaut 2 et qui vaut déjà pour les
// onze bâtiments — pas une seconde constante. Poser ne coûte donc rien ; ces
// fonctions LÈVENT sur le niveau 1 plutôt que de rendre zéro, exactement comme
// `coutDeMontee` de `data/base.js`, parce qu'un zéro se confondrait avec « rien
// à payer, c'est bon » et s'afficherait comme un prix.

import { UNITES, DEFENSES } from './combat.js';
import { ECONOMIE_NIVEAU, montantDuPalier } from './economie.js';
import { NIVEAU } from './niveaux.js';
// L'électricité est UNE règle, et elle vit là où elle a été écrite. L'importer
// depuis `data/base.js` est ce qui la garde unique : y recopier « le quart, à
// partir du niveau 3 » créerait la seconde source de vérité que les conventions
// interdisent. Sa table de fractions est indexée par bâtiment ; les entités
// militaires n'y figurent pas et prennent donc `autres`, qui vaut exactement le
// quart annoncé par RELEVE-TA-COURBES-2.md §5.
import { COUT_ELECTRICITE } from './base.js';

// ---------------------------------------------------------------------------
// Offense — les quatorze unités d'assaut, toutes en scorie
// ---------------------------------------------------------------------------
//
// Rangées par prix croissant, dans l'ordre où Ethan les a dictées. Les noms de
// l'arbitrage sont ceux de Tiberium Alliances ; la clé du dépôt est à côté, et
// un test croise les deux tables dans les deux sens pour qu'aucune unité ne
// puisse entrer ou sortir du roster sans que son prix suive.
//
// ⚠⚠ CETTE TABLE EST L'ANCRE D'ACCUEIL, ET ELLE PORTE DES FRACTIONS DEPUIS LE
// 05/09. La dictée du 28/08 donnait des entiers ; `RELEVE-TA-REPARATION.md` §3
// a mesuré les quatorze coûts de réparation au niveau 10 et trouvé qu'ils
// valent tous **exactement 397,5 × l'ancre**, sans une exception. C'est cette
// exactitude qui rend les fractions lisibles : 636 / 397,5 = 1,6 pour
// l'Escadron lance-missiles, là où la dictée écrivait 2.
//
// ⚠ SIX ÉCARTS SUR SEPT NE SONT QUE DES ARRONDIS, ET ILS SE REFERMENT TOUT
// SEULS : `montantDuPalier` arrondit sa sortie, donc 1,6 · 3,2 · 3,6 · 4,4 ·
// 4,8 · 5,6 rendent 2 · 3 · 4 · 4 · 5 · 6 au niveau 2 — exactement les entiers
// dictés. Un test l'asserte, sinon la table aurait l'air de contredire Ethan.
//
// ⚠⚠ LE SEPTIÈME EST UNE CORRECTION DE FOND : L'ESCADRON DE TIREURS PASSE DE
// 2 À 1. Le rapport coefficient / ancre vaut exactement 2,000 pour les sept
// unités dont l'ancre était déjà juste, et 1,000 pour lui seul — la dictée du
// 28/08 portait un plancher, vraisemblablement pour ne pas écrire un prix de 1.
// Ethan l'a repéré le 05/09 par le raisonnement de jeu : « le fusilier coûte
// moins que l'exosoldat, quoi qu'il arrive ».
export const COUT_NIVEAU_DEUX_OFFENSE = {
  meute: 1, //        riflemen        — 2 dicté, corrigé le 05/09
  perceurs: 1.6, //   lance-roquettes — 2 dicté, arrondi
  carapace: 2, //     exosoldat
  ratisseur: 3.2, //  guardien        — 3 dicté, arrondi
  belier: 3.6, //     pitbull         — 4 dicté, arrondi
  fendeur: 4, //      predator
  crecelle: 4.4, //   orca            — 4 dicté, arrondi
  busard: 4.8, //     paladin         — 5 dicté, arrondi
  guetteur: 5, //     sniper
  frappeur: 5.6, //   firehawk        — 6 dicté, arrondi
  fouisseurs: 8, //   commando
  pilon: 9, //        juggernaut
  broyeur: 12, //     mammouth
  enclume: 12, //     kodiak
};

// ⚠⚠ LE COEFFICIENT DE RÉGIME D'UNE UNITÉ VAUT LE DOUBLE DE SON ANCRE, POUR LES
// QUATORZE — mesuré, `RELEVE-TA-REPARATION.md` §3. C'est donc UN SCALAIRE et
// non une seconde table de quatorze nombres : une table serait une copie, et sa
// première divergence se lirait comme un déséquilibre de jeu au lieu d'un
// défaut de programme. C'est la faute que le commentaire d'`economie.js`
// raconte déjà pour la rampe.
//
// ⚠ IL S'APPUIE SUR UN SEUL POINT ABSOLU, et il faut le savoir :
// `RELEVE-TA-COURBES-2.md` §5 donne « Exosoldat, cristaux, coût au palier 11 :
// 96 000 », soit un coefficient de 4 pour une ancre de 2. Les treize autres en
// découlent par le rapport constant des réparations.
export const RAPPORT_COEFFICIENT_OFFENSE = 2;

// ---------------------------------------------------------------------------
// Défense — neuf ouvrages et huit unités de garnison, dans DEUX ressources
// ---------------------------------------------------------------------------
//
// `montant` est le coût du niveau 2 ; `ressource` est celle dans laquelle il se
// paie. Voir le piège n° 2 en tête de fichier : cette seconde clé n'est pas un
// ornement, c'est la moitié de l'arbitrage.
//
// ⚠⚠ AUCUNE ANCRE DE DÉFENSE NE BOUGE LE 05/09, ET SON COEFFICIENT DE RÉGIME
// VAUT SON ANCRE — facteur 1, donc aucun redressement. **CE N'EST PAS UNE
// MESURE, C'EST UN CHOIX CONSERVATEUR**, et il doit se voir : aucune capture,
// aucun relevé n'a jamais confronté ces dix-sept ancres à quoi que ce soit. Les
// trente captures du 05/09 portent sur les bâtiments et sur l'armée d'assaut ;
// la garnison n'y figure pas.
//
// ⚠ ET RIEN NE VIENDRA LE CONTREDIRE PAR LA BANDE : le premier piège du fichier
// reste vrai — la même unité ne vaut pas le même prix des deux côtés —, donc le
// coefficient de l'offense ne se transporte pas ici ; et la réparation de la
// garnison est GRATUITE, donc aucun barème ne traverse la frontière.
//
// ⚠ LEURS PRIX CHANGENT MALGRÉ TOUT, et c'est voulu : `montantDuPalier`
// n'arrondit plus qu'une fois, ce qui déplace les paliers hauts de toutes les
// entités, facteur 1 compris. Arbitré par Ethan le 05/09.
export const COUT_NIVEAU_DEUX_DEFENSE = {
  // Les six ouvrages fixes — en quartz, comme les bâtiments.
  merlon: { montant: 2, ressource: 'quartz' }, //     mur
  casemate: { montant: 2, ressource: 'quartz' }, //   mg nest
  batterie: { montant: 2, ressource: 'quartz' }, //   flak
  ronce: { montant: 2, ressource: 'quartz' }, //      barbelés
  herse: { montant: 2, ressource: 'quartz' }, //      barrière anti-char
  creneau: { montant: 3, ressource: 'quartz' }, //    canon anti-char

  // Les trois artilleries — en scorie : ce sont des véhicules, pas des murs.
  faucheuse: { montant: 10, ressource: 'scorie' }, // artillerie anti-infanterie
  harpon: { montant: 11, ressource: 'scorie' }, //    artillerie anti-avion
  mortier: { montant: 12, ressource: 'scorie' }, //   artillerie anti-tank

  // Les huit unités qui tiennent une garnison — en scorie.
  meute: { montant: 1, ressource: 'scorie' }, //      riflemen
  guetteur: { montant: 2, ressource: 'scorie' }, //   sniper
  perceurs: { montant: 2, ressource: 'scorie' }, //   lance-roquettes
  carapace: { montant: 2, ressource: 'scorie' }, //   exosoldat
  ratisseur: { montant: 2, ressource: 'scorie' }, //  guardien
  fendeur: { montant: 2, ressource: 'scorie' }, //    predator
  belier: { montant: 3, ressource: 'scorie' }, //     pitbull
  broyeur: { montant: 12, ressource: 'scorie' }, //   mammouth
};

/**
 * Le roster défensif : les neuf ouvrages, plus les unités qui ont un rôle en
 * défense. C'est la MÊME règle que `defensesDisponibles` de `ui/defense.js`,
 * niveau d'apparition en moins — et elle se lit dans les tables, elle ne se
 * recopie pas : `UNITES[x].defense.present` fait foi.
 *
 * ⚠ Elle est ici pour que la table d'ancres puisse être CONFRONTÉE au roster
 * par un test, dans les deux sens. Sans ça, une unité qui gagnerait un rôle
 * défensif entrerait dans la palette sans prix, et le refus se lirait
 * « undefined » à l'écran.
 */
export function rosterDefensif() {
  return [
    ...Object.keys(DEFENSES),
    ...Object.keys(UNITES).filter((id) => UNITES[id].defense.present === true),
  ];
}

function verifierNiveau(niveau, quoi) {
  const premier = ECONOMIE_NIVEAU.premierNiveauPayant;
  if (!Number.isInteger(niveau) || niveau < premier || niveau > NIVEAU.plafond) {
    throw new Error(
      `couts-militaires : niveau ${niveau} hors de ${premier}…${NIVEAU.plafond} pour ${quoi}`
        + ' — le niveau 1 est gratuit, il ne se demande pas',
    );
  }
}

/**
 * Le coût d'un palier, ventilé sur les trois ressources.
 * @param {number} ancre coût du niveau 2 — l'ancre d'ACCUEIL
 * @param {number} coefficient le coefficient de RÉGIME de l'entité
 * @param {string} ressource 'quartz' ou 'scorie'
 * @param {number} niveau le niveau ATTEINT
 */
function coutMilitaire(ancre, coefficient, ressource, niveau) {
  const principal = montantDuPalier(ancre, coefficient, niveau);
  const cout = { quartz: 0, scorie: 0, electricite: 0 };
  cout[ressource] = principal;
  if (niveau >= COUT_ELECTRICITE.premierNiveauPayant) {
    cout.electricite = Math.round(COUT_ELECTRICITE.fraction.autres * principal);
  }
  return cout;
}

/**
 * Ce que coûte de porter une unité d'assaut AU niveau donné.
 *
 * @param {string} id une clé d'`UNITES`
 * @param {number} niveau le niveau atteint, de 2 à `NIVEAU.plafond`
 * @returns {{quartz: number, scorie: number, electricite: number}} en UNITÉS,
 *   pas en milli-unités — la conversion appartient à `sim/`.
 */
export function coutDeMonteeOffense(id, niveau) {
  const ancre = COUT_NIVEAU_DEUX_OFFENSE[id];
  if (ancre === undefined) {
    throw new Error(`couts-militaires : ${id} n'est pas une unité d'assaut`);
  }
  verifierNiveau(niveau, id);
  return coutMilitaire(ancre, ancre * RAPPORT_COEFFICIENT_OFFENSE, 'scorie', niveau);
}

/**
 * Ce que coûte de porter une pièce de garnison AU niveau donné — ouvrage fixe,
 * artillerie ou unité, la table dit laquelle et dans quelle ressource.
 *
 * @param {string} id une clé de `DEFENSES`, ou d'`UNITES` avec un rôle défensif
 * @param {number} niveau le niveau atteint, de 2 à `NIVEAU.plafond`
 * @returns {{quartz: number, scorie: number, electricite: number}} en UNITÉS
 */
export function coutDeMonteeDefense(id, niveau) {
  const ligne = COUT_NIVEAU_DEUX_DEFENSE[id];
  if (ligne === undefined) {
    throw new Error(`couts-militaires : ${id} n'a pas de rôle en défense`);
  }
  verifierNiveau(niveau, id);
  // ⚠ LE COEFFICIENT EST L'ANCRE, donc le facteur vaut 1 et la rampe n'est pas
  // redressée. C'est le choix conservateur du 05/09 — voir le bloc de la table.
  return coutMilitaire(ligne.montant, ligne.montant, ligne.ressource, niveau);
}
