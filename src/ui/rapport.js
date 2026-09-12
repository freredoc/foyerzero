// LE RAPPORT D'UN RAID, VU DE L'ÉCRAN — une seule écriture, trois lecteurs.
//
// ⚠⚠ CE FICHIER EST NÉ LE 11/09 D'UNE DEMANDE D'ETHAN ET D'UN CYCLE D'IMPORTS.
// La demande : « je veux, quand je clique sur un des rapports, voir ce qui s'est
// passé — là je vois juste "je me suis fait attaquer" et je vois pas ce qui s'est
// passé ». Le journal montrait QUATRE lignes par rapport ; un rapport d'attaque
// en porte QUINZE et un rapport de défense TREIZE. Rien ne manquait dans la
// sauvegarde : c'est l'affichage qui était avare.
//
// ⚠⚠ LE CYCLE, MAINTENANT, PARCE QUE C'EST LUI QUI DÉCIDE DE L'ARBORESCENCE.
// Le panneau de fin de raid rend déjà les quinze lignes d'un rapport d'attaque,
// par `lignesDuResultat` — une fonction pure, qui vivait dans `ui/raid.js`. Le
// journal, lui, vit dans `ui/chantier.js`. Or `ui/raid.js` IMPORTE
// `ui/chantier.js` : lui faire lire le journal, ou faire lire `lignesDuResultat`
// par le Chantier, fermait la boucle. La seule sortie sans recopie est un
// TROISIÈME fichier que les deux autres peuvent lire.
//
// L'arborescence est donc : `chantier.js` ← `rapport.js` ← `raid.js`, et
// `session.js` lit `rapport.js`. Aucune flèche ne remonte.
//
// ⚠ ET RIEN N'EST RECOPIÉ : `lignesDuResultat` a DÉMÉNAGÉ, elle n'a pas été
// dupliquée. `ui/raid.js` la lit d'ici pour ses deux panneaux — le simulateur et
// la fin de raid —, et le journal la lit pour son dépliant. Trois lecteurs, une
// écriture ; `JRN T8` compte.

import { PICTOGRAMMES, PICTOGRAMME_DU_CHASSIS, creerPictogramme } from './pictogramme.js';
import { BATIMENTS, EMBLEMES_CARTE } from '../data/sites.js';
import { TICK_MS } from '../sim/clock.js';
import { direLaDuree } from '../sim/reparation.js';
import { LIBELLE_VERDICT, formaterEntier, formaterDelai } from './chantier.js';

const LIBELLE_CHASSIS = {
  escouade: 'Infanterie',
  blinde: 'Véhicules',
  aeronef: 'Aviation',
};

/**
 * Une durée en secondes, dite comme une phrase et non comme un nombre brut.
 *
 * @param {number} secondes
 * @returns {string}
 */
export function formaterDuree(secondes) {
  const s = Math.max(0, Math.round(secondes));
  if (s < 60) return `${s} s`;
  const minutes = Math.floor(s / 60);
  if (minutes < 60) return s % 60 === 0 ? `${minutes} min` : `${minutes} min ${s % 60} s`;
  const heures = Math.floor(minutes / 60);
  return minutes % 60 === 0 ? `${heures} h` : `${heures} h ${minutes % 60} min`;
}

/** Un pourcentage, ou un tiret quand la grandeur n'existe pas. */
function pct(valeur) {
  return valeur === null || valeur === undefined ? '—' : `${valeur} %`;
}

/**
 * Les lignes du panneau de résultat — LES MÊMES pour les deux panneaux.
 *
 * ⚠⚠ C'EST ICI QUE SE JOUE « LE SIMULATEUR ET LE VRAI RAID DISENT LA MÊME
 * CHOSE ». Les deux panneaux appellent cette fonction sur un rapport de même
 * forme, et aucun des deux ne calcule quoi que ce soit : l'égalité est
 * structurelle, pas surveillée. Le jour où l'un des deux voudrait « juste un
 * chiffre de plus », il passera par ici.
 *
 * ⚠ LES NOMS DE BÂTIMENTS VIENNENT DE LA TABLE, ET CE SONT CEUX DE L'OUVRAGE —
 * `BATIMENTS.souche.nom` vaut « Souche », `.ta` vaut « Chantier de
 * construction ». On regarde une base de l'Ouvrage : c'est son vocabulaire qui
 * s'affiche. Les CLÉS du rapport, elles, ne changent jamais de nom.
 *
 * @param {object} rapport rendu par `executerRaid` ou `simulerRaid`
 * @returns {Array<{quoi: string, valeur: string}>}
 */
export function lignesDuResultat(rapport) {
  const lignes = [
    { quoi: 'Verdict', valeur: LIBELLE_VERDICT[rapport.verdict] ?? rapport.verdict },
    {
      quoi: 'Butin',
      // ⚠ LE COFFRE EST LE SEUL PICTOGRAMME DE CE PANNEAU QUI DISE UN GAIN. Les
      // quatre lignes de pourcentage disent ce qui RESTE debout chez la cible ;
      // celle-ci dit ce qu'on rapporte.
      picto: PICTOGRAMMES.butin,
      valeur: `${rapport.butin.quartz ?? 0} quartz · ${rapport.butin.scorie ?? 0} scorie`,
    },
    { quoi: 'Défense restante', valeur: pct(rapport.restantDefense) },
    { quoi: 'Bâtiments restants', valeur: pct(rapport.restantBatiments) },
    { quoi: BATIMENTS.souche.nom, valeur: pct(rapport.restantSouche) },
    { quoi: BATIMENTS.etai.nom, valeur: pct(rapport.restantEtai) },
  ];

  // ⚠ LA RÉPARATION INDUITE, CHÂSSIS PAR CHÂSSIS, EN TEMPS **ET** EN POURCENT.
  // ⚠⚠ ET « SANS BÂTIMENT » SE DIT, parce que zéro veut dire deux choses : un
  // châssis intact et un châssis qu'on ne PEUT PAS réparer rendent tous deux
  // `0 s`. Annoncer « aucune réparation » à un joueur dont l'infanterie est en
  // miettes et sans Caserne serait un mensonge par omission.
  for (const [chassis, r] of Object.entries(rapport.reparationInduite ?? {})) {
    // ⚠⚠ LE CHÂSSIS DONNE LE PICTOGRAMME, ET LES TROIS BRANCHES LE PARTAGENT.
    // Une ligne de réparation parle d'infanterie, de véhicule ou d'avion quel
    // que soit son verdict — « sans bâtiment », « intacte » ou une durée — et
    // c'est le SUJET qui porte l'image, pas l'issue.
    const picto = PICTOGRAMME_DU_CHASSIS[chassis];
    const quoi = LIBELLE_CHASSIS[chassis] ?? chassis;
    if (r.sansBatiment) {
      lignes.push({ quoi, picto, valeur: 'sans bâtiment' });
    } else if (r.ticks === 0) {
      lignes.push({ quoi, picto, valeur: 'intacte' });
    } else {
      lignes.push({
        quoi,
        picto,
        valeur: `${formaterDuree(r.secondes)} · ${pct(r.pctReserve)} de la réserve`,
      });
    }
  }

  // ⚠ LE TEMPS DE RAID EST `ticks × TICK_MS`, et `TICK_MS` vient de l'horloge,
  // jamais recopié : écrire 0,1 ici ferait un second pas de temps.
  lignes.push({
    quoi: 'Durée du combat',
    picto: PICTOGRAMMES.temps,
    valeur: formaterDuree((rapport.ticks * TICK_MS) / 1000),
  });
  return lignes;
}


export const JOURNAL_VIDE = 'Aucun raid mené ni subi pour l\'instant.';

/** Le titre du panneau, écrit une fois pour les deux écrans. */
export const TITRE_JOURNAL = 'Journal des raids';

/**
 * Ce que chaque SENS de rapport met dans sa section — et il n'y a que ça.
 *
 * ⚠⚠ UNE TABLE, JAMAIS UN `=== 'defense'`. C'est la règle du dépôt prise à la
 * lettre : un cas particulier nommé à la main est le premier à diverger, et
 * `ui/chantier.js` porte déjà une garde qui refuse ce littéral pour la table des
 * terrains. Le sens du rapport a exactement la même forme de problème — deux
 * moitiés du moteur qui écrivent deux mots — donc il se lit de la même façon.
 *
 * ⚠ ET UN SENS INCONNU LÈVE. Les deux moitiés du moteur écrivent `sens` depuis
 * le lot RAID-B ; un rapport qui en porterait un troisième est un fait de
 * PROGRAMME, pas de jeu, et l'afficher en silence ferait lire une histoire
 * fausse.
 */
/**
 * Ce que chaque verdict veut dire, SENS PAR SENS — la seconde moitié du point 9.
 *
 * ⚠⚠ ETHAN, 11/09, POINT 9, ET SA PRÉMISSE EST FAUSSE — MESURÉE, PAS CRUE. Le
 * brief écrit : « sur un raid SUBI, "Victoire totale" est l'issue vue de
 * l'ATTAQUANT ». `verdictDeLaDefense` de `sim/raid-ouvrage.js` porte en toutes
 * lettres « le miroir de `verdictDuRaid`, vu du côté de celui qui se défend »,
 * et son corps le confirme : base rasée → `defaite-totale`, bâtiments entamés →
 * `defaite`, rien touché → `victoire-totale`. **Le verdict est déjà celui du
 * JOUEUR, des deux côtés.**
 *
 * ⚠⚠ CE QUI MANQUAIT EST DONC AUTRE CHOSE, ET LE DÉFAUT D'ETHAN EST RÉEL : rien
 * ne DISAIT de quel côté l'issue tombait. « Victoire totale » sous « Raid subi »
 * se lit dans les deux sens tant qu'on ne connaît pas la convention. La ligne
 * porte maintenant ce qui s'est passé, pas seulement qui a gagné.
 *
 * ⚠ LES SIX CLAUSES SONT LUES DANS LE MOTEUR, ELLES NE S'INVENTENT PAS. Chacune
 * traduit la branche exacte qui produit son verdict, et `VIT T6` confronte les
 * CLÉS de ces deux tables aux littéraux que les deux fonctions du moteur
 * rendent : une cinquième branche ajoutée là-bas ferait tomber ce test au lieu
 * d'afficher « undefined » au joueur. C'est l'idiome de `JD T1`.
 *
 * ⚠ ET `victoire` N'EST PAS DANS LA TABLE DU SUBI, `defaite` PAS DANS CELLE DU
 * MENÉ : aucune des deux fonctions ne les produit. Les y écrire « au cas où »
 * ferait passer la garde ci-dessus sur des mots que rien ne peut afficher.
 */
export const VERDICTS_MENES = {
  'victoire-totale': 'site rasé',
  victoire: 'site entamé',
  'defaite-totale': 'site intact',
};

export const VERDICTS_SUBIS = {
  'victoire-totale': 'attaque repoussée',
  defaite: 'votre base est entamée',
  'defaite-totale': 'votre base est rasée',
};

/**
 * Une issue est BONNE pour le joueur si son verdict commence par « victoire ».
 *
 * ⚠ DÉRIVÉ, PAS TABULÉ. Les quatre clés de `LIBELLE_VERDICT` se partagent en
 * deux par leur nom ; une cinquième table à tenir d'accord avec elles serait la
 * seconde vérité que ce fichier refuse ailleurs.
 */
export function issueEstBonne(verdict) {
  return String(verdict).startsWith('victoire');
}

const SENS_DU_RAPPORT = {
  offense: {
    titre: 'Raid mené',
    classe: 'raid-mene',
    libelleAdversaire: 'Cible',
    champAdversaire: 'cible',
    ligneDuBilan: ligneDuButin,
    verdicts: VERDICTS_MENES,
  },
  defense: {
    titre: 'Raid subi',
    classe: 'raid-subi',
    libelleAdversaire: 'Assaillant',
    champAdversaire: 'attaquant',
    ligneDuBilan: ligneDesPertes,
    verdicts: VERDICTS_SUBIS,
  },
};

/**
 * Une entrée du journal : un rapport de combat, en paires.
 *
 * ⚠⚠ RIEN N'EST RECALCULÉ, ET C'EST TOUTE LA RÈGLE DU LOT. Un rapport est le
 * résultat FIGÉ d'un combat déjà résolu ; recalculer un butin ou une issue
 * depuis l'état d'aujourd'hui donnerait un chiffre différent de celui qu'Ethan a
 * vu au moment du raid, et il aurait raison de le croire faux. Cette fonction ne
 * lit QUE le rapport — et `tickCourant`, pour dire depuis quand.
 *
 * @param {object} rapport une entrée d'`etat.rapports`
 * @param {number} tickCourant `etat.horloge.nbTicks`
 * @returns {{titre: string, lignes: Array<object>}}
 */
export function cleDuRapport(rapport) {
  // ⚠⚠ LA CLÉ N'EST PAS L'INDICE DANS LA LISTE, ET C'EST UN PIÈGE ÉVITÉ. Le
  // journal est une FILE de dix : à l'arrivée du onzième rapport, le plus ancien
  // sort et tous les indices glissent d'un cran. Un dépliant ouvert sur
  // l'indice 3 se retrouverait ouvert sur un autre raid, pendant que le joueur
  // le regarde. Le tick de résolution et le sens, eux, ne bougent jamais.
  return `${rapport.tick}:${rapport.sens}`;
}

function sectionDuRapport(rapport, tickCourant, ouvert) {
  const forme = SENS_DU_RAPPORT[rapport.sens];
  if (forme === undefined) {
    throw new RangeError(`journal : sens « ${rapport.sens} » inconnu`);
  }
  const qui = rapport[forme.champAdversaire];
  const nom = EMBLEMES_CARTE[qui?.type]?.nom ?? qui?.type ?? '—';
  // ⚠ L'ÂGE S'ARRONDIT VERS LE BAS. Un raid d'il y a 59 secondes s'annonce
  // « 59 s », jamais « 1 min » : c'est du temps ÉCOULÉ, donc un stock, et
  // `direLaDuree` prend son arrondi en argument pour cette raison exacte.
  const age = direLaDuree(Math.max(0, tickCourant - rapport.tick), Math.floor);
  const lignes = [
    {
      libelle: forme.libelleAdversaire,
      avant: `${nom} · niv. ${formaterEntier(qui?.niveau ?? 0)}`,
      apres: null,
    },
    {
      libelle: 'Position',
      avant: `r ${formaterEntier(qui?.rangee ?? 0)} · c ${formaterEntier(qui?.colonne ?? 0)}`,
      apres: null,
      mineur: true,
    },
    ligneDeLIssue(forme, rapport.verdict),
    forme.ligneDuBilan(rapport),
  ];
  // ⚠⚠ LE DÉPLIANT — Ethan, 11/09. Les quatre lignes du résumé restent, et le
  // détail s'AJOUTE en dessous : replier ne doit pas effacer ce qu'on lisait, et
  // déplier ne doit pas faire relire autre chose.
  const cle = cleDuRapport(rapport);
  const deplie = cle === ouvert;
  if (deplie) lignes.push(...lignesDetailleesDuRapport(rapport));
  // ⚠ LE MARQUEUR DIT QUE ÇA S'OUVRE, ET IL VIT DANS LA VUE, PAS DANS LE RENDU.
  // Sans lui, rien n'apprend au joueur qu'un titre se touche — et le rendu
  // partagé sert quatre écrans dont trois n'ont rien à déplier.
  const marque = deplie ? '▴' : '▾';
  // ⚠ LA CLASSE DE LA SECTION DIT MENÉ OU SUBI — la première moitié du code
  // couleur du point 9. Elle vient de la TABLE, jamais d'un `=== 'defense'`.
  return {
    cle, classe: forme.classe, titre: `${forme.titre} · il y a ${age}  ${marque}`, lignes,
  };
}

/**
 * La ligne « Issue » — le mot du verdict, ce qu'il veut dire, et sa couleur.
 *
 * ⚠ LE MOT VIENT DE `LIBELLE_VERDICT`, QUI EST PARTAGÉ. Trois fichiers le
 * lisent ; en écrire un second ici donnerait deux vocabulaires pour la même
 * issue, dont un seul suivrait la prochaine retouche.
 *
 * ⚠ UN VERDICT QUE LA TABLE DU SENS NE CONNAÎT PAS N'AJOUTE AUCUNE CLAUSE
 * plutôt que d'écrire « undefined ». Il LÈVERAIT ailleurs — `VIT T6` le garde
 * au dépôt —, mais un journal est le dernier endroit où l'on veut faire tomber
 * l'écran : le rapport est déjà figé, et le joueur ne peut rien y changer.
 */
function ligneDeLIssue(forme, verdict) {
  const mot = LIBELLE_VERDICT[verdict] ?? verdict;
  const clause = forme.verdicts[verdict];
  return {
    libelle: 'Issue',
    picto: PICTOGRAMMES.temps,
    avant: clause === undefined ? mot : `${mot} · ${clause}`,
    apres: null,
    classe: issueEstBonne(verdict) ? 'issue-bonne' : 'issue-mauvaise',
  };
}

/** Ce que le raid a rapporté — la même paire que le panneau de fin. */
function ligneDuButin(rapport) {
  const butin = rapport.butin ?? {};
  const quartz = butin.quartz ?? 0;
  const scorie = butin.scorie ?? 0;
  return {
    libelle: 'Butin',
    picto: PICTOGRAMMES.butin,
    avant: quartz === 0 && scorie === 0
      ? '—'
      : `${formaterEntier(quartz)} q · ${formaterEntier(scorie)} s`,
    apres: null,
  };
}

/**
 * Ce que le rasage a détruit — rien tant que la base tient.
 *
 * ⚠⚠ LE BUTIN N'A PAS DE MIROIR EXACT CÔTÉ DÉFENSE, ET C'EST DÉCLARÉ. Un raid
 * SUBI ne rapporte rien : ce qu'il peut COÛTER est `sanction.perdu`, les
 * ressources stockées qu'un RASAGE détruit — et cette sanction vaut `null` tant
 * que la base tient. Une attaque repoussée n'a donc aucun chiffre de perte à
 * annoncer, et « — » est la seule réponse honnête : composer un total depuis
 * l'état d'aujourd'hui serait le recalcul que ce lot refuse.
 */
function ligneDesPertes(rapport) {
  const perdu = rapport.sanction?.perdu ?? null;
  const quartz = perdu?.quartz ?? 0;
  const scorie = perdu?.scorie ?? 0;
  return {
    libelle: 'Perdu au rasage',
    picto: PICTOGRAMMES.butin,
    avant: perdu === null || (quartz === 0 && scorie === 0)
      ? '—'
      : `${formaterEntier(quartz)} q · ${formaterEntier(scorie)} s`,
    apres: null,
  };
}

/**
 * Pourquoi le combat s'est arrêté.
 *
 * ⚠⚠ LES QUATRE CLÉS SONT CELLES DE `sim/combat.js`, ET UN TEST LES CONFRONTE À
 * LA SOURCE. C'est `terminer(etat, cause)` qui les pose, en quatre endroits ;
 * une cinquième cause ajoutée là ferait afficher « undefined » à un journal qui
 * recopierait la liste de mémoire. Le test grep les appels et compare.
 *
 * ⚠ CE SONT DES LIBELLÉS, PAS DES RÈGLES : ils disent ce que le moteur a
 * constaté, sans le commenter. « Durée limite atteinte » n'est pas une défaite —
 * c'est `verdict` qui tranche l'issue, et il a sa propre ligne.
 */
export const LIBELLE_CAUSE = {
  souche: 'Chantier de construction tombé',
  attaquants: 'Plus aucun assaillant debout',
  batiments: 'Plus aucun bâtiment debout',
  duree: 'Durée limite atteinte',
};

/**
 * Le détail d'un raid SUBI — ce que le rapport de défense porte, et que le
 * journal ne montrait pas.
 *
 * ⚠⚠ ETHAN, 11/09 : « là je vois juste "je me suis fait attaquer", c'est écrit,
 * et je vois pas ce qui s'est passé ». Le rapport de défense porte TREIZE champs
 * et le journal en montrait quatre. Rien ne manquait dans la sauvegarde.
 *
 * ⚠⚠ ET IL N'Y AVAIT AUCUNE VUE À RÉEMPLOYER DE CE CÔTÉ-LÀ. Un raid MENÉ finit
 * sur un panneau qui rend ses quinze lignes — `lignesDuResultat`, juste au-dessus
 * — ; un raid SUBI se produit pendant que le joueur fait autre chose, et n'a
 * donc jamais eu d'écran. C'est la moitié du journal qui était aveugle.
 *
 * ⚠ RIEN N'EST RECALCULÉ : on ne lit que le rapport. Composer un chiffre depuis
 * l'état d'aujourd'hui donnerait autre chose que ce que le raid a fait, et le
 * joueur aurait raison de le croire faux. C'est la règle du lot JOURNAL, et
 * `JRN T9` la garde.
 *
 * @param {object} rapport une entrée d'`etat.rapports` de sens `defense`
 * @returns {Array<{libelle: string, avant: string, apres: null}>}
 */
export function lignesDeLaDefense(rapport) {
  const lignes = [
    {
      libelle: 'Fin du combat',
      avant: LIBELLE_CAUSE[rapport.cause] ?? rapport.cause ?? '—',
      apres: null,
    },
    {
      libelle: 'Durée du combat',
      picto: PICTOGRAMMES.temps,
      avant: formaterDuree((rapport.ticks * TICK_MS) / 1000),
      apres: null,
    },
    { libelle: 'Défense restante', avant: pct(rapport.restantDefense), apres: null },
    { libelle: 'Bâtiments restants', avant: pct(rapport.restantBatiments), apres: null },
    // ⚠ « AU PLANCHER » N'EST PAS « DÉTRUIT », et le mot doit le dire : une pièce
    // au plancher est réparable, et c'est justement ce que la réserve sert à
    // faire. Écrire « perdues » enverrait reconstruire ce qui se répare.
    {
      libelle: 'Garnison au plancher',
      avant: `${formaterEntier(rapport.garnisonAuPlancher ?? 0)} pièce(s)`,
      apres: null,
    },
    {
      libelle: 'Bâtiments au plancher',
      avant: `${formaterEntier(rapport.batimentsAuPlancher ?? 0)} pièce(s)`,
      apres: null,
    },
    // ⚠ LA RÉSERVE SE VIDE DÈS QU'UN BÂTIMENT A PERDU DES PV, et c'est le
    // troisième effet du §4.4 dans l'ordre du moteur. Un joueur qui retrouve sa
    // réserve à zéro sans savoir pourquoi croit à un bogue.
    {
      libelle: 'Réserve de réparation',
      avant: rapport.reserveVidee === true ? 'vidée' : 'intacte',
      apres: null,
    },
  ];

  // ⚠ L'AUTO-RÉPARATION NE SE DIT QUE QUAND ELLE A AGI. À zéro, la ligne
  // apprendrait qu'un module existe sans dire qu'il n'est pas acquis — deux
  // informations différentes pour le même « 0 ».
  const rendus = rapport.autoReparationMilli ?? 0;
  if (rendus > 0) {
    lignes.push({
      libelle: 'Auto-réparation',
      avant: `${formaterEntier(Math.floor(rendus / 1000))} PV rendus`,
      apres: null,
    });
  }

  // ⚠⚠ LE RASAGE EST LE SEUL ÉVÉNEMENT QUI DÉPLACE LA BASE, et c'est la ligne la
  // plus importante du rapport quand il arrive : la sanction dit de combien de
  // cases la base a reculé, et d'où à où. Le butin perdu, lui, est déjà annoncé
  // par la ligne de bilan du résumé — le redire ici ferait deux chiffres pour un.
  if (rapport.rase === true && rapport.sanction !== null && rapport.sanction !== undefined) {
    const s = rapport.sanction;
    lignes.push({
      libelle: 'Base rasée, reculée de',
      avant: `${formaterEntier(s.cases ?? 0)} case(s) · r ${formaterEntier(s.rangeeAvant ?? 0)} → r ${formaterEntier(s.rangeeApres ?? 0)}`,
      apres: null,
    });
  }
  return lignes;
}

/**
 * Le détail d'un rapport, quel que soit son sens — ce que le dépliant montre.
 *
 * ⚠⚠ LES DEUX CÔTÉS N'ONT PAS LA MÊME FORME, ET C'EST ICI QUE ÇA SE RÉSOUT. Le
 * panneau de fin de raid rend `{quoi, valeur}` ; le rendu partagé des fiches
 * attend `{libelle, avant, apres}`. On TRADUIT, on ne recopie pas : changer la
 * forme de `lignesDuResultat` aurait obligé le panneau de fin à suivre, pour un
 * lot qui ne parle pas de lui.
 *
 * @param {object} rapport
 * @returns {Array<object>}
 */
export function lignesDetailleesDuRapport(rapport) {
  if (rapport.sens === 'defense') return lignesDeLaDefense(rapport);
  return lignesDuResultat(rapport).map((l) => ({
    libelle: l.quoi,
    picto: l.picto,
    avant: l.valeur,
    apres: null,
  }));
}

/**
 * Le détail d'un rapport dans la forme du PANNEAU DE FIN — `{quoi, valeur}`.
 *
 * ⚠⚠ C'EST LA TRADUCTION INVERSE DE `lignesDetailleesDuRapport`, ET ELLE EXISTE
 * POUR LE REJEU. Le panneau de fin de raid a toujours rendu `lignesDuResultat`,
 * qui ne connaît que le sens OFFENSE : un rejeu de raid SUBI y afficherait le
 * butin et les points d'un combat qui n'en a pas. Les deux fonctions de lignes
 * existaient déjà, chacune dans sa forme ; ce qui manquait était le dispatch de
 * ce côté-ci. ⚠ On TRADUIT, on ne recopie pas — c'est le motif écrit au-dessus
 * de `lignesDetailleesDuRapport`, pris dans l'autre sens.
 *
 * @param {object} rapport
 * @returns {Array<{quoi: string, valeur: string, picto?: object}>}
 */
export function lignesDuPanneauDeFin(rapport) {
  if (rapport.sens !== 'defense') return lignesDuResultat(rapport);
  return lignesDeLaDefense(rapport).map((l) => ({
    quoi: l.libelle, valeur: l.avant, picto: l.picto,
  }));
}

/**
 * Le rapport que cette clé désigne, s'il porte de quoi se rejouer.
 *
 * ⚠⚠ « REJOUABLE » VEUT DIRE « IL PORTE SON MONTAGE », ET RIEN D'AUTRE. Un
 * rapport écrit avant la v33 n'en a pas, et la migration 32 → 33 ne peut PAS le
 * lui inventer : le montage est l'état de départ d'un combat fini, que rien dans
 * l'état d'aujourd'hui ne conserve. L'absence du champ est donc le message, et
 * c'est pourquoi la migration ne pose même pas `null` — deux façons d'écrire la
 * même absence auraient donné deux lecteurs dont un seul suivrait.
 *
 * ⚠ ELLE PREND LA CLÉ, PAS L'INDICE, pour la raison de `cleDuRapport` : le
 * journal est une file de dix, et l'arrivée d'un onzième rapport fait glisser
 * tous les indices d'un cran.
 *
 * @param {Array<object>} rapports `etat.rapports`
 * @param {string|null} cle celle de `cleDuRapport`
 * @returns {object|null}
 */
export function rapportRejouable(rapports, cle) {
  if (cle === null || cle === undefined) return null;
  const liste = Array.isArray(rapports) ? rapports : [];
  const trouve = liste.find((r) => cleDuRapport(r) === cle);
  if (trouve === undefined) return null;
  return trouve.rejeu === undefined || trouve.rejeu === null ? null : trouve;
}

/**
 * La vue du journal — les dix derniers raids, du plus RÉCENT au plus ancien.
 *
 * ⚠⚠ UNE SEULE VUE POUR LES DEUX ÉCRANS, ET C'EST LA DEMANDE D'ETHAN PRISE À LA
 * LETTRE : « Défense et offense : rajouter un bouton rapport, qui permet de voir
 * les 10 dernières attaques et raids subis. » Deux vues auraient divergé à la
 * première retouche, et le joueur aurait lu deux histoires de la même partie.
 *
 * ⚠⚠ LA FILE SE LIT À L'ENDROIT, LA VUE S'AFFICHE À L'ENVERS — ET LE RETOURNEMENT
 * SE FAIT SUR UNE COPIE. `garderLeRapport` pousse en queue et jette la tête :
 * c'est une FILE, et un `reverse()` en place casserait à la fois le rangement et
 * la borne. `[...rapports]` copie d'abord ; `JRN T6` mesure que l'état n'a pas
 * bougé après affichage.
 *
 * ⚠ ET LA BORNE N'EST PAS RÉÉCRITE ICI. Le journal ne porte JAMAIS plus de
 * `APRES_RAID.rapportsGardes` entrées — `garderLeRapport` s'en charge à
 * l'écriture, et `verifierEtat` le garde au chargement. Rogner une seconde fois
 * à l'affichage mettrait un second dix dans le dépôt, ce que le commentaire de
 * `src/data/sites.js` redoute nommément.
 *
 * @param {Array<object>} rapports `etat.rapports`, jamais modifié
 * @param {number} tickCourant `etat.horloge.nbTicks`
 * @returns {{titre: string, sections: Array<object>}}
 */
export function vueDuJournal(rapports, tickCourant, ouvert = null) {
  const liste = Array.isArray(rapports) ? rapports : [];
  // ⚠ UN JOURNAL VIDE SE DIT. Zéro rapport n'est pas une erreur : c'est une
  // partie qui commence. Une vue sans section rendrait un panneau blanc, et le
  // joueur croirait le bouton cassé.
  const sections = liste.length === 0
    ? [{ titre: JOURNAL_VIDE, lignes: [] }]
    : [...liste].reverse().map((r) => sectionDuRapport(r, tickCourant, ouvert));
  // ⚠ SANS `picto` DEPUIS LE POINT 7 : le journal partage le rendu, donc le
  // blason du titre part ici aussi. Ses lignes, elles, gardent les leurs.
  return { titre: TITRE_JOURNAL, sections };
}

