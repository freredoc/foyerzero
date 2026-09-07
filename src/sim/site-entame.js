// L'état d'un site entamé — ce qui reste debout entre deux passes.
//
// C'est l'écriture d'APRÈS-RAID, celle que `MODELE-REPARATION-1.md` annonce
// depuis le 24/08 : « rien de tout ça n'entre dans le moteur de combat. Le
// moteur détruit à 0 et rapporte les PV bruts. Planchers et réparations sont une
// écriture d'après-raid. » Le moteur reste donc intact ; ce module lit son
// résultat et décide de ce qui survit.
//
// ⚠ TROIS RÉGIMES DISJOINTS, ET AUCUN N'EST INVENTÉ ICI. Le tableau de
// `MODELE-REPARATION-1.md` §2 et §3, mot pour mot :
//
//   BASE de l'Ouvrage — tout planche à 1 PV sauf la Souche, et ses BÂTIMENTS
//   reviennent tous au bout d'une heure, gratuitement. « Une base se prend d'un
//   coup ou pas du tout » : si la Souche ne tombe pas dans la fenêtre, le raid
//   est perdu.
//
//   CAMP et AVANT-POSTE — rien ne planche, ce qui tombe est perdu POUR
//   TOUJOURS, et les BÂTIMENTS ne se réparent jamais.
//
//   LES DÉFENSES, DES DEUX TYPES ET DES DEUX CAMPS — palier instantané puis
//   rampe, sous la conduite de l'Étai. Voir plus bas.
//
// ⚠⚠ CE TROISIÈME RÉGIME EST NEUF DU 05/09, ET IL CHANGE LA RÈGLE PLUTÔT QU'IL
// NE CORRIGE UN DÉFAUT. Jusque-là, seules les défenses SURVIVANTES d'un camp
// revenaient, en une heure, et celles d'une base rentraient par la porte des
// bâtiments. Ethan a réinstallé la ligne que `MODELE-REPARATION-1.md` §5
// rangeait parmi les constantes supprimées le 24/08 — « réparation gratuite
// après raid : 70 % des PV perdus, au prorata des PV du complexe » — et il y a
// ajouté une rampe. Le palier porte sur CHAQUE pièce, DÉTRUITE COMPRISE : une
// défense à zéro se relève désormais, ce que trois tests interdisaient.
//
// ⚠ CE QUI N'A PAS CHANGÉ : « si l'Étai tombe pendant l'attaque, même les
// défenses survivantes et abîmées ne seront plus jamais réparées ». C'est
// l'arbitrage de calibrage d'Ethan — abattre l'Étai à la première passe rend la
// seconde peu coûteuse, et un camp se rase en deux passes — et c'est une GARDE
// ÉCRITE dans `pvApresRetour`, pas une conséquence de la formule.
//
// ⚠⚠ ET LA RÈGLE VIT DANS `sim/reparation.js`, PAS ICI. `pvApresRetour` ne lit
// que ses arguments et sert les deux camps ; ce module lui donne les PV, la
// santé figée et l'écoulé, et ne connaît ni la pénalité ni le palier. Une
// seconde écriture ici aurait divergé de celle de la garnison du joueur au
// premier réglage, et l'écart se serait lu comme un déséquilibre entre les camps.
//
// ⚠ TROIS VALEURS DE PV, PAS DEUX, et c'est ce qui rend la table légère.
// `null` veut dire INTACT, `0` veut dire DÉTRUIT, un entier veut dire « il lui
// reste ça ». Un site à peine égratigné ne range donc presque que des `null`,
// et une entrée qui ne porte plus que des `null` est RETIRÉE : une table qui ne
// dit rien ne doit pas exister, sinon la sauvegarde grossit d'un site à chaque
// raid pour l'éternité.
//
// ⚠ L'ORDRE DES LISTES EST CELUI DU MONTAGE, et c'est ce qui permet de ne
// stocker que des nombres. Le montage se régénère à l'identique depuis la case
// et l'instance — `sim/site-de-la-case.js` le mesure —, donc l'indice suffit à
// désigner une pièce. Ce qui rend ça sûr, c'est que la graine ne bouge jamais
// pour un site donné ; ce qui le rendrait faux, c'est un changement du
// générateur, et c'est à ça que sert `SAVE_VERSION`.
//
// ⚠ CE QUI N'EST PAS ICI : le blocage d'une heure après une attaque et celui de
// vingt-quatre heures après un rasage. Ils disent QUAND on a le droit
// d'attaquer, pas ce que le site a dans le ventre — et la spec les range dans sa
// §10 sans dire s'ils portent sur le site de l'Ouvrage ou sur la base du joueur
// qui vient d'être attaquée. Ils appartiennent au lot qui écrira l'acte de
// raid.

import { TYPES_SITE, APRES_RAID, BATIMENTS } from '../data/sites.js';
import { BASE_BATIMENTS } from '../data/base.js';
import { TICKS_PAR_HEURE } from './clock.js';
import {
  detruireSatellite, prolongerApresAttaque, trouverSatellite,
} from './satellites.js';
import { montageDuSite, resumeDuSite } from './site-de-la-case.js';
import { baseCourante } from './base-courante.js';
import { facteurMilli } from './combat.js';
import { ruineFraiche } from './ruines.js';
// ⚠ SEULEMENT LE NUMÉRO DU CAMP, et il n'est écrit qu'une fois — dans
// `sim/territoire.js`, où la carte l'emploie. Le recopier ici en ferait deux.
import { JOUEUR } from './territoire.js';
import {
  pvApresRetour, pvMaxDeLaPieceDeGarnisonMilli, ticksDeRetour,
} from './reparation.js';

/** Un PV vaut mille milli-PV, et une santé se range en millièmes. */
const MILLE = 1000;

/** Le bâtiment dont la chute rase le site, et celui qui répare les défenses. */
const ID_SOUCHE = Object.keys(BATIMENTS).find((id) => BATIMENTS[id].raseLeSite === true);
const ID_ETAI = Object.keys(BATIMENTS).find((id) => BATIMENTS[id].reparationDefenses === true);

if (ID_SOUCHE === undefined || ID_ETAI === undefined) {
  throw new Error('site-entamé : la table des bâtiments ne nomme plus la Souche ou l\'Étai');
}

/**
 * Le bâtiment dont la chute rase la base DU JOUEUR.
 *
 * ⚠⚠ MÊME CHAMP QUE CÔTÉ OUVRAGE, ET C'EST TOUT L'INTÉRÊT. `raseLeSite` est posé
 * sur `BATIMENTS.souche` et sur `BASE_BATIMENTS.chantierDeConstruction`, avec le
 * commentaire qui dit que c'est le même nom des deux côtés. Une seule règle
 * couvre donc les deux camps ; écrire `id === 'chantierDeConstruction'` quelque
 * part serait la seconde vérité que §4 de `CLAUDE.md` interdit, et elle
 * mentirait pour toutes les bases de l'Ouvrage.
 */
const ID_CHANTIER = Object.keys(BASE_BATIMENTS)
  .find((id) => BASE_BATIMENTS[id].raseLeSite === true);

if (ID_CHANTIER === undefined) {
  throw new Error('site-entamé : la table de la base ne nomme plus le bâtiment qui rase');
}

/**
 * Ce qu'un site montre de ses blessures — trois états, et rien entre les deux.
 *
 * ⚠ « ABÎMÉ », PAS « DÉTRUIT », ET LA DIFFÉRENCE DÉCIDE DE TOUT. Côté joueur, la
 * chute du Chantier déclenche le RASAGE, qui déplace la base de vingt cases : il
 * n'existe aucun état durable « Chantier détruit » à afficher. « Chantier
 * abîmé » existe des deux côtés, et il dure jusqu'à réparation.
 */
export const AVARIE = { AUCUNE: 'aucune', FUMEE: 'fumee', FEU: 'feu' };

/**
 * La règle, écrite UNE fois pour les deux camps.
 *
 * ⚠ L'ORDRE DES DEUX TESTS EST LA RÈGLE : le raseur touché l'emporte, parce
 * qu'il est aussi « quelque chose d'abîmé ». Les intervertir rendrait le feu
 * inatteignable.
 *
 * @param {{raseurAbime: boolean, quelqueChoseAbime: boolean}} faits
 * @returns {string} une valeur d'`AVARIE`
 */
export function avarie({ raseurAbime, quelqueChoseAbime }) {
  if (raseurAbime) return AVARIE.FEU;
  if (quelqueChoseAbime) return AVARIE.FUMEE;
  return AVARIE.AUCUNE;
}

/**
 * L'avarie d'un site de l'Ouvrage, telle qu'elle est AUJOURD'HUI.
 *
 * ⚠ RIEN DE NEUF N'ENTRE DANS L'ÉTAT. `pvBatimentsMilli` est déjà là, et
 * `reparerLesSites` efface l'entrée au bout d'une heure : l'emblème abîmé se
 * lève et retombe tout seul. `null` veut dire intacte, `0` détruite, un nombre
 * les milli-PV restants — donc « abîmée » est exactement « pas `null` ».
 *
 * @param {object} etat
 * @param {object} identite
 * @returns {string} une valeur d'`AVARIE`
 */
export function avarieDuSite(etat, identite) {
  const entree = etatDuSite(etat, identite);
  if (entree === null) return AVARIE.AUCUNE;
  const touchee = (v) => v !== null;
  const montage = montageDuSite(etat.graine, entree);
  const index = montage.batiments.findIndex((b) => b.id === ID_SOUCHE);
  return avarie({
    raseurAbime: index >= 0 && touchee(entree.pvBatimentsMilli[index]),
    quelqueChoseAbime: entree.pvBatimentsMilli.some(touchee)
      || entree.pvDefensesMilli.some(touchee),
  });
}

/**
 * Les avaries de tous les sites entamés, rangées par case.
 *
 * ⚠ ON PART DES ENTAMÉS, PAS DES SITES VISIBLES, et c'est ce qui rend l'appel
 * payable à chaque image : la fenêtre de la carte porte jusqu'à quinze cents
 * cases, la table des entamés quelques dizaines d'entrées. Interroger chaque
 * site visible régénérerait un montage par case.
 *
 * ⚠ ET LA CLÉ NE PORTE PAS L'INSTANCE : l'écran connaît une case, pas le numéro
 * d'instance du camp qui l'occupe. Deux camps successifs au même endroit ne
 * coexistent jamais.
 *
 * @param {object} etat
 * @returns {Map<string, string>} « rangée:colonne » → valeur d'`AVARIE`
 */
export function avariesParCase(etat) {
  exigerTable(etat);
  const carte = new Map();
  for (const entree of Object.values(etat.sitesEntames)) {
    const etatDAvarie = avarieDuSite(etat, entree);
    if (etatDAvarie !== AVARIE.AUCUNE) {
      carte.set(`${entree.rangee}:${entree.colonne}`, etatDAvarie);
    }
  }
  return carte;
}

/**
 * L'avarie d'une base du joueur — même règle, autre porteur.
 *
 * ⚠ LES DÉGÂTS SONT DANS LA PIÈCE, PAS DANS UNE TABLE À CÔTÉ : `degatsMilli`,
 * écrit par `sim/raid-ouvrage.js`. Zéro veut dire intacte.
 *
 * ⚠ ET LA GARNISON COMPTE, comme les défenses comptent côté Ouvrage : c'est la
 * défense du joueur, et la traiter autrement apprendrait deux grammaires pour
 * le même dessin.
 *
 * @param {object} base une entrée d'`etat.bases`
 * @returns {string} une valeur d'`AVARIE`
 */
export function avarieDeLaBase(base) {
  const abimee = (p) => (p.degatsMilli ?? 0) > 0;
  return avarie({
    raseurAbime: base.disposition.some((b) => b.id === ID_CHANTIER && abimee(b)),
    quelqueChoseAbime: base.disposition.some(abimee) || base.garnison.some(abimee),
  });
}

/**
 * La durée de BASE de la rampe des défenses, en ticks — une heure.
 *
 * ⚠ ELLE N'A PLUS D'APPELANT DE PRODUCTION DEPUIS LE LOT RETOUR-DÉFENSES, et
 * c'est dit plutôt que tu. La durée réelle sort de `ticksDeRetour`, qui multiplie
 * cette heure-là par le dépassement et par la pénalité de santé ;
 * `RETOUR_DEFENSES.heuresDeBase` EST `APRES_RAID.reparationDefensesHeures`, donc
 * il n'y a toujours qu'une seule vérité pour cette heure. Elle reste exportée
 * parce que les tests s'en servent comme unité de temps lisible, et parce que la
 * retirer ferait croire que l'heure a disparu du modèle.
 */
export const TICKS_REPARATION_DEFENSES = APRES_RAID.reparationDefensesHeures * TICKS_PAR_HEURE;

/**
 * Réparation intégrale des BÂTIMENTS d'une base de l'Ouvrage, en ticks.
 *
 * ⚠ ELLE NE COUVRE PLUS LES DÉFENSES DEPUIS LE LOT RETOUR-DÉFENSES. Celles d'une
 * base suivent la même rampe que celles d'un camp — c'est ce que « une seule
 * règle, les deux camps » veut dire —, et la coïncidence des durées à pleine
 * santé (une heure des deux côtés) ne doit pas les refondre en une seule ligne.
 */
export const TICKS_REPARATION_BASE = TYPES_SITE.base.reparationHeures * TICKS_PAR_HEURE;

/** La table vide, pour une partie où rien n'a encore été attaqué. */
export function sitesEntamesVides() {
  return {};
}

/** La clé d'un site : sa case ET son instance. Deux camps successifs diffèrent. */
export function cleDuSite(identite) {
  return `${identite.rangee}:${identite.colonne}:${identite.instance}`;
}

/**
 * Un site planche-t-il ses pièces à 1 PV, ou meurent-elles pour de bon ?
 *
 * ⚠ C'EST LE TYPE QUI DÉCIDE, PAS LA PIÈCE — sauf la Souche, qui ne planche
 * jamais nulle part. `MODELE-REPARATION-1.md` §2 : « le plancher sépare le
 * renouvelable du définitif. C'est lui qui décide de la géographie économique
 * du jeu. » Si tout planchait, la Souche ne tomberait jamais, aucune base ne se
 * raserait, et la carte cesserait de s'ouvrir.
 *
 * @param {string} type type de site
 * @param {string} id identifiant de la pièce
 * @returns {boolean}
 */
export function plancheAUnPv(type, id) {
  if (type !== 'base') return false;
  return id !== ID_SOUCHE;
}

/**
 * Ce que devient une pièce après un raid : `null` intacte, `0` détruite, sinon
 * ses milli-PV restants.
 *
 * @param {string} type type de site
 * @param {{id: string, pvMilli: number, pvMaxMilli: number, detruit: boolean}} ligne
 * @returns {number|null}
 */
export function pvApresRaid(type, ligne) {
  if (ligne.detruit) {
    return plancheAUnPv(type, ligne.id) ? APRES_RAID.plancherPvMilli : 0;
  }
  if (ligne.pvMilli >= ligne.pvMaxMilli) return null;
  return ligne.pvMilli;
}

/** Une entrée qui ne dit plus rien — que des `null` — ne mérite pas d'exister. */
function neDitRien(entree) {
  return entree.pvBatimentsMilli.every((v) => v === null)
    && entree.pvDefensesMilli.every((v) => v === null);
}

/**
 * Le site disparaît de la carte : plus d'entrée d'entame, et le satellite retiré.
 *
 * ⚠⚠ ELLE EST SORTIE D'`enregistrerLeRaid` AU LOT BASES-1, ET C'EST UN
 * DÉPLACEMENT. Fonder une base sur un camp le détruit aussi (§4.4), et il y
 * aurait eu DEUX codes pour faire disparaître un site — l'un qui pense à
 * `basesRasees`, l'autre qui l'oublie. Ce qui est COMMUN aux deux gestes, c'est
 * l'effacement ; ce qui leur est propre reste chez chacun.
 *
 * ⚠⚠ ON CHERCHE DANS TOUTES LES BASES. Un satellite appartient à la base autour
 * de laquelle il est paru, pas à celle que le joueur regarde : raser le camp de
 * sa SECONDE base pendant que la première est courante n'aurait rien détruit, et
 * le camp serait resté sur la carte comme si de rien n'était.
 *
 * ⚠ ELLE NE LÈVE PAS SI LE SATELLITE A DÉJÀ DISPARU. Le raid se résout sur un
 * montage, pas sur la table : rien ne garantit à ce module que le satellite est
 * encore là. Ce qui compte est qu'il ne soit plus là après.
 *
 * ⚠⚠ UNE BASE RASÉE DEVIENT UNE RUINE, ET LA RUINE PORTE TROIS CHAMPS DE PLUS
 * — lot CONQUÊTE-24H, 07/09/2026. L'entrée ne disait qu'une CASE ; elle dit
 * maintenant aussi QUI a gagné, DE QUEL NIVEAU était ce qui est tombé, et QUAND.
 * Pendant vingt-quatre heures, `sim/territoire.js` la compte comme un émetteur
 * de plus dans la somme du vainqueur ; ensuite elle se tait, sans que la case
 * cesse pour autant d'être retirée. `sim/ruines.js` porte les deux lectures.
 *
 * ⚠⚠ LE VAINQUEUR EST UN ARGUMENT, PAS UNE CONSTANTE ÉCRITE ICI, ET C'EST LA
 * SYMÉTRIE DU §1 DU BRIEF. Les deux appelants d'aujourd'hui sont des gestes du
 * JOUEUR — le raid qui rase, la fondation qui écrase —, mais l'Ouvrage attaque
 * déjà : le jour où une base du joueur sera RETIRÉE au lieu d'être redéployée,
 * la règle est écrite et il n'y aura qu'à passer `OUVRAGE`.
 *
 * ⚠ LE NIVEAU EST CELUI QUE `siteDeLaCase` A INSCRIT DANS L'IDENTITÉ, donc
 * `niveauDeLaRangee` pour une base de l'Ouvrage. C'est la seule grandeur que la
 * carte lui donne, et c'est celle que la formule de TERRITOIRE-FORCE attend.
 *
 * ⚠ LE `type` AUSSI VIENT DE L'IDENTITÉ, et il dit CE QUI est tombé — donc
 * quelle carcasse la carte dessine. Il ne se déduit pas du vainqueur : voir
 * `ruineFraiche`.
 *
 * @param {object} etat modifié en place
 * @param {object} identite le site à retirer
 * @param {number} vainqueur le camp qui prend la case — `JOUEUR` ou `OUVRAGE`
 */
export function retirerLeSite(etat, identite, vainqueur) {
  exigerTable(etat);
  delete etat.sitesEntames[cleDuSite(identite)];
  if (identite.type === 'base') {
    etat.basesRasees.push(ruineFraiche(
      identite.rangee, identite.colonne, identite.type, vainqueur,
      identite.niveau, etat.horloge.nbTicks,
    ));
    return;
  }
  const trouve = trouverSatellite(etat, identite);
  if (trouve !== null) detruireSatellite(etat, trouve.index, trouve.base);
}

/**
 * Enregistre ce qu'un raid a laissé du site.
 *
 * ⚠ ELLE N'ÉCRIT NI LE BUTIN, NI LES POINTS, NI L'ARMÉE DU JOUEUR. Ce module
 * répond à une seule question — « qu'est-ce qui reste debout ? » —, et le reste
 * de l'écriture d'après-raid a ses propres tables. Mélanger les deux ferait de
 * cette fonction le seul endroit du dépôt qu'il faut appeler pour que quoi que
 * ce soit soit juste.
 *
 * ⚠ LA SOUCHE TOMBÉE RASE LE SITE, et c'est `BATIMENTS.souche.raseLeSite` qui
 * le dit, pas une constante écrite ici. Un satellite rasé passe par
 * `detruireSatellite`, qui sait déjà le reprogrammer — « respawn automatique »,
 * arbitré le 29/08. Une base de l'Ouvrage, elle, ne respawne pas
 * (`TYPES_SITE.base.respawn === false`) : elle rejoint la liste des rasées, et
 * `siteDeLaCase` cessera de la voir.
 *
 * @param {object} etat modifié en place
 * @param {object} identite ce que rend `siteDeLaCase`
 * @param {{cause: string, batiments: Array, defenses: Array}} resultat de `resoudre`
 * @returns {{rase: boolean}}
 */
export function enregistrerLeRaid(etat, identite, resultat) {
  const laBase = baseCourante(etat);
  exigerTable(etat);
  const cle = cleDuSite(identite);

  if (resultat.cause === 'souche') {
    // ⚠ LE JOUEUR EST LE VAINQUEUR : `enregistrerLeRaid` n'est appelée que
    // depuis un raid QU'IL LANCE. Le raid de l'Ouvrage a son propre module.
    retirerLeSite(etat, identite, JOUEUR);
    return { rase: true };
  }

  // ⚠⚠ L'ENTRÉE SE RANGE SUR LA COMPOSITION **RÉGÉNÉRÉE**, PAS SUR CELLE QUI
  // VIENT DE SE BATTRE — et c'est un CORRECTIF du 01/09, trouvé au boot sans
  // tête du lot RAID-A. `montageCourant` régénère le site ENTIER puis applique
  // ces listes POSITION PAR POSITION : elles doivent donc toujours compter une
  // case par pièce du site plein. Or `resultat` ne porte que les pièces qui
  // étaient encore là, les mortes ayant déjà été retirées du montage.
  //
  // Le troisième raid d'affilée levait donc « 0 PV rangés pour 3 pièces » :
  // raid 1 tue les trois défenseurs et range `[0,0,0]` ; raid 2 se bat contre un
  // site à zéro défenseur et range `[]` ; raid 3 régénère les trois et n'a plus
  // rien à leur appliquer. Mesuré en simulation pure, sans interface — le bogue
  // est ANTÉRIEUR à l'écran de raid, qui n'a fait que le rendre atteignable :
  // aucun test n'enchaînait trois raids, et aucun écran ne savait attaquer.
  const complet = montageDuSite(etat.graine, identite);
  const avant = etatDuSite(etat, identite);
  const entree = {
    rangee: identite.rangee,
    colonne: identite.colonne,
    instance: identite.instance,
    type: identite.type,
    niveau: identite.niveau,
    tickDuRaid: etat.horloge.nbTicks,
    pvBatimentsMilli: reprojeter(
      complet.batiments, avant?.pvBatimentsMilli ?? null, resultat.batiments, identite.type,
    ),
    pvDefensesMilli: reprojeter(
      complet.defenseurs, avant?.pvDefensesMilli ?? null, resultat.defenses, identite.type,
    ),
  };

  // ⚠⚠ LA SANTÉ SE FIGE ICI, ET NULLE PART AILLEURS. C'est l'instant du raid,
  // le seul que la règle du 05/09 reconnaisse : réparer l'Étai ensuite ne
  // raccourcit pas le retour en cours. Elle se lit sur les PV que le raid vient
  // de LAISSER, donc APRÈS `reprojeter` — la lire avant rendrait toujours mille.
  entree.santeComplexeMilli = santeDeLEtai(entree, complet);

  if (neDitRien(entree)) delete etat.sitesEntames[cle];
  else etat.sitesEntames[cle] = entree;

  // ⚠⚠ UN SATELLITE ATTAQUÉ GAGNE DU TEMPS — Ethan, 31/08. Sans ça, un camp
  // qu'on vient d'entamer pouvait être relevé la minute suivante, et le joueur
  // retrouvait un site neuf à la place de celui qu'il avait à moitié rasé.
  //
  // ⚠ ELLE EST APPELÉE MÊME QUAND LE RAID « NE DIT RIEN » — c'est-à-dire quand
  // rien n'est resté endommagé. Le joueur a quand même attaqué : ce qui achète
  // le sursis est le RAID, pas les dégâts qu'il a laissés.
  if (identite.type !== 'base') {
    prolongerApresAttaque(etat, identite, etat.horloge.nbTicks);
  }
  return { rase: false };
}

function exigerTable(etat) {
  for (const champ of ['sitesEntames', 'basesRasees']) {
    if (etat[champ] === undefined) {
      throw new Error(`site-entamé : champ « ${champ} » absent de l'état`);
    }
  }
}

/** Ce qu'on a retenu de ce site, ou `null` s'il est intact. */
export function etatDuSite(etat, identite) {
  exigerTable(etat);
  return etat.sitesEntames[cleDuSite(identite)] ?? null;
}

/**
 * Le montage COURANT d'un site : intact s'il n'a jamais été touché, entamé
 * sinon.
 *
 * ⚠ UNE PIÈCE DÉTRUITE EST RETIRÉE, ELLE N'EST PAS MONTÉE À ZÉRO.
 * `creerCombat` refuse `pvMilli === 0` — et il a raison, une entité sans PV
 * n'est pas une entité. C'est aussi ce qui fait que le butin ne se paie pas
 * deux fois : un bâtiment détruit à la première passe n'est plus là à la
 * seconde, donc il ne rapporte plus rien.
 *
 * @param {object} etat
 * @param {object} identite
 * @returns {object} montage pour `creerCombat`
 */
export function montageCourant(etat, identite) {
  const montage = montageDuSite(etat.graine, identite);
  const entree = etatDuSite(etat, identite);
  if (entree === null) return montage;
  return {
    ...montage,
    batiments: appliquer(montage.batiments, entree.pvBatimentsMilli),
    defenseurs: appliquer(montage.defenseurs, pvCourantsDesDefenses(etat, entree, montage)),
  };
}

/**
 * La santé de l'Étai à l'instant du raid, en millièmes — ou `null` s'il est
 * tombé, ou si ce site n'en a pas.
 *
 * ⚠⚠ `null` VEUT DIRE « PLUS JAMAIS », ET C'EST LA GARDE DU §2, PAS UNE
 * PROPRIÉTÉ ÉMERGENTE. Une santé de zéro rendrait la pénalité maximale — donc
 * vingt-quatre heures —, et non « jamais » : c'est `pvApresRetour` qui refuse
 * de rendre quoi que ce soit sur un `null`, et un test le mesure en retirant la
 * ligne.
 *
 * ⚠ L'ÉTAI EST LE COMPLEXE DE DÉFENSE SOUS L'AUTRE JEU DE NOMS —
 * `BATIMENTS.etai.ta` le dit, et `reparationDefenses` le désigne. Écrire
 * « etai » ici serait la seconde vérité que `ID_ETAI` existe pour éviter.
 *
 * @param {object} entree
 * @param {object} montage la composition PLEINE du site
 * @returns {number|null}
 */
function santeDeLEtai(entree, montage) {
  const index = montage.batiments.findIndex((b) => b.id === ID_ETAI);
  if (index < 0) return null;
  const pv = entree.pvBatimentsMilli[index];
  if (pv === 0) return null;
  if (pv === null) return MILLE;
  const max = BATIMENTS[ID_ETAI].pv * facteurMilli(montage.batiments[index].niveau);
  return Math.max(0, Math.min(MILLE, Math.round((pv * MILLE) / max)));
}

/**
 * La santé figée que porte cette entrée — celle du raid si elle y est, sinon
 * celle qu'on relit sur l'Étai.
 *
 * ⚠ LE REPLI COUVRE LES SAUVEGARDES D'AVANT CE LOT, et il ne calcule rien de
 * neuf : il relit l'Étai tel que le raid l'a laissé, ce qui EST la santé du
 * raid. `reparerLesSites` écrit ensuite la valeur pour de bon, comme le filet de
 * la garnison stampe une pièce non stampée.
 */
function santeFigee(entree, montage) {
  if (entree.santeComplexeMilli !== undefined) return entree.santeComplexeMilli;
  return santeDeLEtai(entree, montage);
}

/**
 * Les milli-PV des défenses TELS QU'ILS SONT AUJOURD'HUI — palier des 70 % et
 * rampe compris.
 *
 * ⚠⚠ RIEN N'EST RÉÉCRIT, ET C'EST LE CÂBLAGE CHOISI CÔTÉ OUVRAGE. `sitesEntames`
 * n'est lu que par `montageCourant` et `resumeCourant` : le retour s'y calcule à
 * la LECTURE, l'entrée gardant `tickDuRaid` et sa santé figée. Côté joueur,
 * `degatsMilli` a treize lecteurs et c'est le tick qui RÉÉCRIT — deux câblages,
 * une seule fonction pure.
 *
 * ⚠ UNE PIÈCE À ZÉRO REVIENT, SI L'ÉTAI TIENT. C'est le changement de fond du
 * 05/09 : le palier porte sur les PV perdus de chaque pièce, détruite comprise,
 * là où la règle d'avant ne rendait rien à ce qui était tombé.
 */
function pvCourantsDesDefenses(etat, entree, montage) {
  const sante = santeFigee(entree, montage);
  if (sante === null) return entree.pvDefensesMilli;
  const ecoule = etat.horloge.nbTicks - entree.tickDuRaid;
  return entree.pvDefensesMilli.map((pv, i) => {
    if (pv === null) return null;
    const piece = montage.defenseurs[i];
    const pvMax = pvMaxDeLaPieceDeGarnisonMilli(piece.id, piece.niveau);
    const courant = pvApresRetour({
      pvMaxMilli: pvMax,
      pvApresRaidMilli: pv,
      niveau: piece.niveau,
      niveauComplexe: entree.niveau,
      santeMilli: sante,
      ecouleTicks: ecoule,
    });
    return courant >= pvMax ? null : courant;
  });
}

/**
 * Combien de ticks la rampe met à tout rendre sur ce site.
 *
 * ⚠ LE MAXIMUM, PAS LA PREMIÈRE. Sur un site de l'Ouvrage tout est au niveau du
 * site, donc les durées coïncident aujourd'hui ; prendre le maximum reste juste
 * le jour où une garnison mêlée y paraîtrait, et ne coûte rien.
 */
function dureeDuRetourDesDefenses(entree, montage, sante) {
  let duree = 0;
  for (const piece of montage.defenseurs) {
    duree = Math.max(duree, ticksDeRetour(piece.niveau, entree.niveau, sante));
  }
  return duree;
}

/**
 * Range le résultat d'un raid sur la composition PLEINE du site.
 *
 * ⚠ UNE PIÈCE DÉJÀ MORTE RESTE MORTE, et elle ne consomme pas de ligne du
 * résultat : elle n'était pas au combat, `appliquer` l'ayant retirée du montage.
 * Les autres se servent dans l'ordre — `construireResultat` rend ses entités
 * dans l'ordre du montage, et `appliquer` retire en préservant cet ordre, donc
 * la n-ième vivante du site plein est la n-ième ligne du résultat.
 *
 * ⚠ ET LA SORTIE FAIT TOUJOURS LA LONGUEUR DU SITE PLEIN. C'est l'invariant que
 * `appliquer` vérifie de l'autre côté, et le seul qui rende un site
 * ré-attaquable indéfiniment.
 *
 * @param {Array<object>} pleines la composition régénérée, entière
 * @param {Array<number|null>|null} avant ce qui était rangé avant ce raid
 * @param {Array<object>} lignes les lignes de résultat, sans les déjà-mortes
 * @param {string} type type de site, pour le plancher à 1 PV
 * @returns {Array<number|null>} une case par pièce du site plein
 */
function reprojeter(pleines, avant, lignes, type) {
  const sortie = [];
  let curseur = 0;
  for (let i = 0; i < pleines.length; i += 1) {
    if (avant !== null && avant[i] === 0) { sortie.push(0); continue; }
    const ligne = lignes[curseur];
    curseur += 1;
    sortie.push(ligne === undefined ? null : pvApresRaid(type, ligne));
  }
  return sortie;
}

function appliquer(pieces, pvs) {
  if (pvs.length !== pieces.length) {
    throw new Error(
      `site-entamé : ${pvs.length} PV rangés pour ${pieces.length} pièces — `
      + 'le montage ne se régénère plus à l\'identique',
    );
  }
  const sortie = [];
  for (let i = 0; i < pieces.length; i += 1) {
    const pv = pvs[i];
    if (pv === 0) continue;
    sortie.push(pv === null ? pieces[i] : { ...pieces[i], pvMilli: pv });
  }
  return sortie;
}

/** Le résumé du mini-onglet, dans l'état où le site est AUJOURD'HUI. */
export function resumeCourant(etat, identite) {
  return resumeDuSite(etat.graine, identite, montageCourant(etat, identite));
}

/**
 * Rend au temps ce qui lui revient : les réparations dues.
 *
 * ⚠ APPELÉE PAR LES DEUX CHEMINS D'AVANCEMENT, ET SANS BOUCLE PAR TICK. Elle ne
 * lit que l'horloge courante, comme `resoudreSatellites` : mille ticks d'un coup
 * réparent exactement ce que mille ticks un par un auraient réparé. C'est ce qui
 * la rend compatible avec le rattrapage hors ligne — et c'est aussi pourquoi
 * elle ne peut RIEN faire qui dépende de l'instant précis d'une réparation.
 *
 * @param {object} etat modifié en place
 * @returns {number} nombre de sites dont l'état a changé
 */
export function reparerLesSites(etat) {
  exigerTable(etat);
  const maintenant = etat.horloge.nbTicks;
  let touches = 0;

  for (const [cle, entree] of Object.entries(etat.sitesEntames)) {
    const ecoule = maintenant - entree.tickDuRaid;
    const montage = montageDuSite(etat.graine, entree);
    let change = false;

    // ⚠⚠ LE FILET, ET IL PASSE AVANT TOUT LE RESTE. Une entrée d'avant ce lot ne
    // porte pas de santé figée ; on la relit sur l'Étai TEL QUE LE RAID L'A
    // LAISSÉ, ce qui EST la santé du raid. Le faire après la remise à neuf des
    // bâtiments d'une base rendrait toujours mille, et un Étai à moitié tombé
    // passerait pour intact.
    if (entree.santeComplexeMilli === undefined) {
      entree.santeComplexeMilli = santeDeLEtai(entree, montage);
      change = true;
    }

    // ⚠ LES BÂTIMENTS D'UNE BASE DE L'OUVRAGE REVIENNENT TOUS EN UNE HEURE,
    // détruits compris : le plancher à 1 PV a fait que rien n'est vraiment mort,
    // sauf une Souche — et une Souche tombée aurait rasé le site au lieu de
    // l'entamer. Ceux d'un camp ou d'un avant-poste ne reviennent JAMAIS.
    if (entree.type === 'base' && ecoule >= TICKS_REPARATION_BASE
        && entree.pvBatimentsMilli.some((v) => v !== null)) {
      entree.pvBatimentsMilli = entree.pvBatimentsMilli.map(() => null);
      change = true;
    }

    // ⚠⚠ LES DÉFENSES SUIVENT LA RAMPE, DES DEUX CÔTÉS ET QUEL QUE SOIT LE TYPE
    // DE SITE. Ce qu'on écrit ici est le seul instant qui compte pour la table :
    // celui où il n'y a plus rien à rendre. Tout ce qui précède se lit à la
    // volée dans `pvCourantsDesDefenses`, donc l'entrée n'a pas à être touchée
    // pendant la rampe — c'est ce qui garde les deux chemins d'avancement
    // équivalents sans qu'on ait à le vérifier.
    const sante = entree.santeComplexeMilli;
    if (sante !== null && entree.pvDefensesMilli.some((v) => v !== null)
        && ecoule >= dureeDuRetourDesDefenses(entree, montage, sante)) {
      entree.pvDefensesMilli = entree.pvDefensesMilli.map(() => null);
      change = true;
    }

    if (!change) continue;
    touches += 1;
    if (neDitRien(entree)) delete etat.sitesEntames[cle];
  }
  return touches;
}

/**
 * Les défauts STRUCTURELS de la table — ce qui empêcherait la sauvegarde d'être
 * relue.
 * @param {object} sitesEntames
 * @returns {Array<string>} messages, vide si tout va bien
 */
export function problemesDesSitesEntames(sitesEntames) {
  const problemes = [];
  if (sitesEntames === null || typeof sitesEntames !== 'object' || Array.isArray(sitesEntames)) {
    return ['« sitesEntames » n\'est pas une table'];
  }
  for (const [cle, e] of Object.entries(sitesEntames)) {
    if (TYPES_SITE[e?.type] === undefined) {
      problemes.push(`site entamé « ${cle} » — type inconnu « ${e?.type} »`);
      continue;
    }
    if (cleDuSite(e) !== cle) problemes.push(`site entamé « ${cle} » rangé sous une autre clé`);
    if (!Number.isInteger(e.tickDuRaid) || e.tickDuRaid < 0) {
      problemes.push(`site entamé « ${cle} » — tick de raid « ${e.tickDuRaid} »`);
    }
    const sante = e.santeComplexeMilli;
    if (sante !== undefined && sante !== null
        && (!Number.isInteger(sante) || sante < 0 || sante > MILLE)) {
      // ⚠ L'ABSENCE EST LÉGALE, ET C'EST LE FILET DE `reparerLesSites` QUI
      // L'AUTORISE : une sauvegarde d'avant ce lot n'en porte pas, et le tick
      // suivant la relit sur l'Étai. Ce qui est refusé, c'est une valeur
      // PRÉSENTE et malformée.
      problemes.push(`site entamé « ${cle} » — santé « ${sante} » : 0…${MILLE} ou null attendu`);
    }
    for (const champ of ['pvBatimentsMilli', 'pvDefensesMilli']) {
      if (!Array.isArray(e[champ])) {
        problemes.push(`site entamé « ${cle} » — « ${champ} » n'est pas une liste`);
        continue;
      }
      for (const pv of e[champ]) {
        if (pv === null) continue;
        if (!Number.isInteger(pv) || pv < 0) {
          problemes.push(`site entamé « ${cle} » — PV « ${pv} » : entier ≥ 0 ou null attendu`);
        }
      }
    }
  }
  return problemes;
}
