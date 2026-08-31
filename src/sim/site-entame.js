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
//   BASE de l'Ouvrage — tout planche à 1 PV sauf la Souche, et TOUT revient au
//   bout d'une heure, gratuitement. « Une base se prend d'un coup ou pas du
//   tout » : si la Souche ne tombe pas dans la fenêtre, le raid est perdu.
//
//   CAMP et AVANT-POSTE — rien ne planche, ce qui tombe est perdu POUR
//   TOUJOURS, et les bâtiments ne se réparent jamais. Seules les défenses
//   SURVIVANTES reviennent, en une heure, et seulement si l'Étai est debout :
//   « si l'Étai tombe pendant l'attaque, même les défenses survivantes et
//   abîmées ne seront plus jamais réparées ». D'où l'arbitrage de calibrage
//   d'Ethan : abattre l'Étai à la première passe rend la seconde peu coûteuse,
//   et un camp se rase en deux passes.
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
import { TICKS_PAR_HEURE } from './clock.js';
import { detruireSatellite, prolongerApresAttaque } from './satellites.js';
import { montageDuSite, resumeDuSite } from './site-de-la-case.js';

/** Le bâtiment dont la chute rase le site, et celui qui répare les défenses. */
const ID_SOUCHE = Object.keys(BATIMENTS).find((id) => BATIMENTS[id].raseLeSite === true);
const ID_ETAI = Object.keys(BATIMENTS).find((id) => BATIMENTS[id].reparationDefenses === true);

if (ID_SOUCHE === undefined || ID_ETAI === undefined) {
  throw new Error('site-entamé : la table des bâtiments ne nomme plus la Souche ou l\'Étai');
}

/** Réparation des défenses par l'Étai, en ticks. */
export const TICKS_REPARATION_DEFENSES = APRES_RAID.reparationDefensesHeures * TICKS_PAR_HEURE;

/** Réparation intégrale d'une base de l'Ouvrage, en ticks. */
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
  exigerTable(etat);
  const cle = cleDuSite(identite);

  if (resultat.cause === 'souche') {
    delete etat.sitesEntames[cle];
    if (identite.type === 'base') {
      etat.basesRasees.push(`${identite.rangee}:${identite.colonne}`);
    } else {
      const index = etat.satellites.presents.findIndex(
        (s) => s.rangee === identite.rangee && s.colonne === identite.colonne
          && s.instance === identite.instance,
      );
      // ⚠ ELLE NE LÈVE PAS SI LE SATELLITE A DÉJÀ DISPARU. Le raid se résout
      // sur un montage, pas sur la table : rien ne garantit à ce module que le
      // satellite est encore là. Ce qui compte est qu'il ne soit plus là après.
      if (index >= 0) detruireSatellite(etat, index);
    }
    return { rase: true };
  }

  const entree = {
    rangee: identite.rangee,
    colonne: identite.colonne,
    instance: identite.instance,
    type: identite.type,
    niveau: identite.niveau,
    tickDuRaid: etat.horloge.nbTicks,
    pvBatimentsMilli: resultat.batiments.map((b) => pvApresRaid(identite.type, b)),
    pvDefensesMilli: resultat.defenses.map((d) => pvApresRaid(identite.type, d)),
  };

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
    defenseurs: appliquer(montage.defenseurs, entree.pvDefensesMilli),
  };
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
 * L'Étai de ce site est-il encore debout ? C'est lui qui décide si les défenses
 * repousseront un jour.
 */
function etaiDebout(etat, entree) {
  const montage = montageDuSite(etat.graine, entree);
  const index = montage.batiments.findIndex((b) => b.id === ID_ETAI);
  if (index < 0) return false;
  return entree.pvBatimentsMilli[index] !== 0;
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

    if (entree.type === 'base') {
      // Tout revient, y compris ce qui était tombé : le plancher à 1 PV a fait
      // que rien n'est vraiment mort, sauf une Souche — et une Souche tombée
      // aurait rasé le site au lieu de l'entamer.
      if (ecoule >= TICKS_REPARATION_BASE) {
        delete etat.sitesEntames[cle];
        touches += 1;
      }
      continue;
    }

    if (ecoule < TICKS_REPARATION_DEFENSES) continue;
    if (!etaiDebout(etat, entree)) continue;

    // Les SURVIVANTES seulement. Ce qui est tombé dans un camp est perdu pour
    // toujours — c'est ce qui rend la seconde passe moins chère que la première.
    let change = false;
    entree.pvDefensesMilli = entree.pvDefensesMilli.map((pv) => {
      if (pv === null || pv === 0) return pv;
      change = true;
      return null;
    });
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
