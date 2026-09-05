// L'OUVRAGE ATTAQUE — lot RAID-B, 02/09/2026
//
// Ce module est le premier du jeu qui fasse arriver quelque chose au joueur
// pendant qu'il ne regarde pas. Tout ce qu'il contient découle de deux
// contraintes, et il vaut mieux les avoir en tête avant d'y toucher :
//
//   1. LE TIRAGE EST UNE FONCTION PURE de (graine, minute absolue, case de la
//      base attaquante). Ni l'aléa du langage — que la garde de
//      `clock.test.js` interdit dans tout `sim/`, jusque dans les
//      commentaires, et elle a raison de le faire —, ni un flux conservé
//      d'un tick à l'autre. C'est la SEULE forme sous laquelle jouer en direct et rattraper
//      hors ligne rendent le même résultat, et cette équivalence est l'invariant
//      que quatre commentaires de `rattraperJeu` protègent déjà.
//
//   2. UN RAID N'EST PAS UN SYSTÈME QUI SE RÉSOUT EN UN APPEL. L'économie, les
//      satellites, les points d'attaque et les POI ne lisent que l'horloge
//      courante : mille ticks d'un coup leur valent mille ticks un par un. Un
//      raid, lui, arrive à un INSTANT et MODIFIE l'état pour les suivants — une
//      base dont les réserves viennent d'être vidées ne rattrape pas comme une
//      base intacte. Le rattrapage se DÉCOUPE donc aux instants des raids
//      retenus, et c'est `sim/state.js` qui le fait ; ici on ne fournit que de
//      quoi savoir QUAND, sur QUI, et ce qu'il en reste.
//
// ⚠ CE QUI BORNE LA BOUCLE, ET SA CONDITION DE RUPTURE. Le découpage est borné
// par le nombre de RAIDS RETENUS, pas par le nombre de ticks : sur 36 h avec
// cinq bases à portée, 2 160 minutes × 5 = 10 800 tirages pour environ sept
// raids. Le balayage des minutes est un hachage et rien de plus ; la liste des
// bases, elle, coûte 441 lectures de case et se prend UNE fois par segment. Cet
// équilibre cesserait d'être tenable le jour où `RAID_OUVRAGE.chanceParMinute`
// monterait d'un ordre de grandeur, ou où les bases à portée se compteraient par
// dizaines : ce ne serait plus sept combats mais soixante-dix.

import { hachageBrut } from './peuplement.js';
import { creerRng, tirer } from './rng.js';
import { TICKS_PAR_HEURE } from './clock.js';
import { RAID_OUVRAGE, TYPES_SITE, APRES_RAID, GEOGRAPHIE } from '../data/sites.js';
import { BASE_BATIMENTS } from '../data/base.js';
import { UNITES, DEFENSES } from '../data/combat.js';
import {
  creerCombat, resoudre, facteurMilli, TICKS_MAX_COMBAT,
} from './combat.js';
import { genererVague, budgetRaid } from './generateur.js';
import { ciblesAPortee } from './site-de-la-case.js';
import { estSurLaCarte } from './carte.js';
import { RESSOURCES } from './economie-base.js';
import { modulesDebloquesDuJoueur } from './recherche.js';
import { majorationsDeCombat } from './poi.js';
import { poserLaBaseSur } from './deplacement.js';
import { reparerLaGarnison, garderLeRapport } from './raid.js';
import { baseCourante } from './base-courante.js';

/**
 * Le sel du tirage de raid — le SIXIÈME du dépôt, et il était libre.
 *
 * ⚠ UN SEL PAR USAGE, JAMAIS UN HACHAGE PRESSÉ. 0 et 1 sont au peuplement,
 * 2 et 3 aux POI, 4 et 5 au site d'une case. Réemployer l'un d'eux corrélerait
 * « cette base attaque ce soir » à « cette case porte une base », c'est-à-dire
 * ferait attaquer toujours les mêmes.
 */
export const SEL_RAID_OUVRAGE = 6;

/**
 * Combien de ticks dans une minute.
 *
 * ⚠ DÉRIVÉ, JAMAIS ÉCRIT. `TICK_MS` vaut 100 et `TICKS_PAR_HEURE` 36 000 : une
 * minute en fait 600. Écrire 600 ici en ferait une seconde vérité, et c'est
 * exactement l'avertissement que porte l'en-tête de `sim/clock.js`.
 */
export const TICKS_PAR_MINUTE = TICKS_PAR_HEURE / 60;

/**
 * La minute ABSOLUE d'une horloge de partie.
 *
 * ⚠ ABSOLUE, PAS RELATIVE AU CHARGEMENT. Un compteur qui repart à zéro à chaque
 * reprise rejouerait les mêmes minutes, donc les mêmes raids, à chaque
 * ouverture du jeu — et le joueur qui relance trois fois subirait trois fois la
 * même attaque. `etat.horloge.nbTicks` est le seul compteur qui ne recule
 * jamais.
 *
 * @param {number} nbTicks
 * @returns {number} index de minute, entier ≥ 0
 */
export function minuteDeLHorloge(nbTicks) {
  if (!Number.isInteger(nbTicks) || nbTicks < 0) {
    throw new RangeError(`raid-ouvrage : « ${nbTicks} » ticks — entier ≥ 0 attendu`);
  }
  return Math.floor(nbTicks / TICKS_PAR_MINUTE);
}

/**
 * Cette base attaque-t-elle à cette minute ?
 *
 * ⚠ DEUX PASSES, ET C'EST LA FORME DE `graineDeLInstance`. `hachageBrut` ne
 * prend que deux coordonnées : la première passe réduit la CASE à un entier, la
 * seconde y mêle la MINUTE. C'est le même hachage employé deux fois, pas une
 * seconde famille — le dépôt en a une seule, et l'en-tête de `hachageBrut` dit
 * pourquoi.
 *
 * ⚠ LE PRNG EST CRÉÉ, CONSOMMÉ ET JETÉ. Le conserver d'un appel à l'autre
 * ferait dépendre le tirage de l'ORDRE des appels, donc du nombre de fois où
 * l'on est passé — et le rattrapage, qui n'appelle pas dans le même ordre que
 * le direct, divergerait aussitôt. C'est la falsification du test T1.
 *
 * @param {number} graine graine de la partie
 * @param {{rangee: number, colonne: number}} base la base attaquante
 * @param {number} minute index de minute absolu
 * @returns {boolean}
 */
export function baseAttaqueALaMinute(graine, base, minute) {
  if (!Number.isInteger(minute) || minute < 0) {
    throw new RangeError(`raid-ouvrage : minute « ${minute} » — entier ≥ 0 attendu`);
  }
  const deLaCase = hachageBrut(graine, base.rangee, base.colonne, SEL_RAID_OUVRAGE);
  const rng = creerRng(hachageBrut(deLaCase, minute, 0, SEL_RAID_OUVRAGE));
  return tirer(rng) < RAID_OUVRAGE.chanceParMinute;
}

/**
 * Les bases de l'Ouvrage qui peuvent attaquer le joueur, ici et maintenant.
 *
 * ⚠ LE FILTRE EST DANS LES DONNÉES, PAS ÉCRIT ICI. `TYPES_SITE[x].attaqueLeJoueur`
 * dit depuis toujours que seules les BASES attaquent — camp et avant-poste sont
 * du butin, pas une menace, et le bord rouge de la carte le dit déjà au joueur.
 * Écrire `type === 'base'` ferait une seconde vérité qui divergerait le jour où
 * un type de plus arriverait.
 *
 * ⚠ ET LE NIVEAU MINIMAL AUSSI. `RAID_OUVRAGE.niveauMinimal` vaut 10 : les bases
 * du début de partie sont là pour être attaquées, pas pour attaquer. C'est le
 * test T6, avec la falsification qui retire le filtre.
 *
 * ⚠ ELLE COÛTE 441 LECTURES DE CASE PAR BASE — `ciblesAPortee` balaie un carré
 * de Tchebychev de rayon 10 — donc elle ne s'appelle PAS par tick ni par minute.
 * Le direct ne la demande qu'au passage d'une minute, le rattrapage une fois par
 * segment. Sa valeur ne dépend que de la graine, des positions du joueur et des
 * bases rasées ; entre deux raids, aucun des trois ne bouge.
 *
 * ⚠⚠ ELLE BOUCLE SUR TOUTES LES BASES DEPUIS BASES-1, ET C'ÉTAIT LA SIXIÈME
 * CONDITION DE RUPTURE — celle que le rapport de BASES-0 disait « la plus
 * profonde ». Elle interrogeait `ciblesAPortee(etat, baseCourante(etat))` : au
 * pluriel, **seule la base que le joueur regarde aurait été attaquée**, les
 * autres étant invisibles pour l'Ouvrage. Une seconde base aurait donc été un
 * sanctuaire, et rien n'aurait cassé.
 *
 * ⚠⚠ CE QU'ELLE REND N'EST PLUS UN SITE MAIS UNE PAIRE, et le champ `baseVisee`
 * porte l'INDICE de la base attaquée. Sans lui, `subirUnRaid` retomberait sur
 * `baseCourante` et frapperait celle que le joueur regarde plutôt que celle qui
 * est à portée. L'indice, et non la base elle-même : `structuredClone` et
 * `serialiser` copient des VALEURS, donc un renvoi vers l'objet base se
 * dédoublerait à la première copie.
 *
 * ⚠⚠ UNE BASE DE L'OUVRAGE À PORTÉE DE DEUX BASES DU JOUEUR LES ATTAQUE TOUTES
 * LES DEUX, LA MÊME MINUTE. **LECTURE PRISE, à signaler.** `baseAttaqueALaMinute`
 * hache la CASE de l'attaquante et la minute, jamais la cible : c'est ce qui rend
 * les tirages d'une partie à une seule base identiques au bit après ce lot, et le
 * témoin de BASES-0 le mesure. Lui faire choisir UNE cible demanderait une règle
 * qu'Ethan n'a pas donnée — la plus proche ? la plus faible ? — et déplacerait
 * tous les tirages existants. Si Ethan veut qu'elle n'en frappe qu'une, c'est ce
 * `for` imbriqué qui change, et lui seul.
 *
 * @param {object} etat
 * @returns {Array<object>} identités de site, chacune portant `baseVisee`
 */
export function basesAttaquantes(etat) {
  const paires = [];
  for (let i = 0; i < etat.bases.length; i += 1) {
    for (const site of ciblesAPortee(etat, etat.bases[i])) {
      if (TYPES_SITE[site.type]?.attaqueLeJoueur !== true) continue;
      if (site.niveau < RAID_OUVRAGE.niveauMinimal) continue;
      paires.push({ ...site, baseVisee: i });
    }
  }
  return paires;
}

/**
 * Les PV maximaux d'une pièce de garnison du joueur, en milli-PV.
 *
 * ⚠ LES DEUX TABLES SONT INTERROGÉES, DANS L'ORDRE DE `forceDeLaDefense`. Une
 * garnison mêle des ouvrages fixes (`DEFENSES`) et des unités mobiles
 * (`UNITES`) : `rosterDefensif` en compose dix-sept à partir des deux, et une
 * liste de noms écrite à la main ici serait la première à diverger. C'est la
 * faute qui a fait un écran blanc le 30/08.
 */
function pvMaxDeLaPiece(id, niveau) {
  const ligne = DEFENSES[id] ?? UNITES[id];
  if (ligne === undefined) {
    throw new RangeError(`raid-ouvrage : « ${id} » n'est ni une défense ni une unité`);
  }
  return ligne.pv * facteurMilli(niveau);
}

/** Les PV maximaux d'un bâtiment du joueur, en milli-PV. */
function pvMaxDuBatiment(id, niveau) {
  const ligne = BASE_BATIMENTS[id];
  if (ligne === undefined) throw new RangeError(`raid-ouvrage : bâtiment « ${id} » inconnu`);
  return ligne.pv * facteurMilli(niveau);
}

/**
 * Les PV COURANTS d'une pièce, bornés — `undefined` si elle est intacte.
 *
 * ⚠ `undefined` ET NON LE MAXIMUM, et c'est la règle de `composerLesVagues` :
 * `pvMilli` n'est posé que si la pièce est abîmée. Le passer toujours ferait
 * entrer le forçage explicite de `creerCombat` sur le chemin ordinaire, et une
 * base intacte serait montée par une autre route que celle des combats de
 * référence.
 *
 * ⚠ LE PLANCHER À 1 PV, PARCE QUE `creerCombat` REFUSE ZÉRO. Une pièce ramenée à
 * zéro par un raid précédent n'est pas retirée — elle attend d'être réparée —,
 * et elle doit donc pouvoir se remonter.
 */
function pvCourantsMilli(pvMax, degatsMilli) {
  const degats = degatsMilli ?? 0;
  if (degats <= 0) return undefined;
  const pv = pvMax - degats;
  return pv > APRES_RAID.plancherPvMilli ? pv : APRES_RAID.plancherPvMilli;
}

/**
 * Le montage de combat de la VRAIE base du joueur.
 *
 * ⚠⚠ IL N'APPELLE PAS `genererSite`, ET C'EST TOUT L'ENJEU. `montageDefense` du
 * banc (`src/ui/banc.js`) fabrique une FAUSSE base de l'Ouvrage et y glisse des
 * défenseurs saisis à la main : c'est un instrument de mise au point, et il ne
 * sait rien des bâtiments que le joueur a posés, ni de leurs positions, ni de ce
 * qu'un raid précédent leur a fait. Ici les trois listes viennent de l'état, et
 * de lui seul. C'est le test T5, avec la falsification qui rappelle
 * `genererSite`.
 *
 * ⚠⚠ `modulesDebloques.joueur.defense` PORTE CE QUE LE JOUEUR A CHERCHÉ, et
 * c'est le point le plus facile à oublier de tout le lot. Les modules de défense
 * sont dans l'arbre de recherche depuis le début et n'ont JAMAIS servi, faute
 * d'attaque sur la base. Un montage qui laisse cette liste vide rendrait toute
 * cette branche inerte sans que rien ne casse — donc sans qu'aucun test ne le
 * dise, à moins de l'écrire. C'est T4.
 *
 * ⚠ LA FORME À DEUX ÉTAGES EST OBLIGATOIRE. `creerCombat` LÈVE sur une liste
 * plate depuis MODULES-E, et pour une bonne raison : quatre noms de module
 * existent des deux côtés de l'arbre, et une liste plate les faisait fuir d'une
 * branche à l'autre.
 *
 * ⚠ LES DEUX PROPRIÉTAIRES S'INVERSENT. Sans cela les Fusiliers du joueur
 * s'afficheraient « Meute » et son Mur de défense « Merlon ». `creerCombat` lève
 * si les deux sont égaux — c'est voulu, personne ne s'attaque soi-même.
 *
 * ⚠ LE `niveau` DU MONTAGE EST CELUI DE L'ATTAQUANT, ET IL NE SERT QUE DE
 * DÉFAUT. Chaque bâtiment, chaque pièce de garnison et chaque unité de la vague
 * porte le SIEN, et `ajouterEntite` le préfère toujours. Y mettre une moyenne
 * des niveaux du joueur n'aurait rien changé au combat et aurait fait croire que
 * la base a un niveau, ce que `CLAUDE.md` §6 interdit : le joueur en a trois.
 *
 * ⚠ AUCUN POI POUR L'OUVRAGE, ET LA FORME RESTE SYMÉTRIQUE. Ce que le joueur a
 * acquis majore ce qu'il pose EN DÉFENSE — la Redoute le dit — donc
 * `majorationsPoi.joueur` est servi ; `ouvrage` reste à zéro, comme partout.
 *
 * ⚠ LA BASE MONTÉE SE PASSE EN ARGUMENT DEPUIS BASES-1, ET LE DÉFAUT EST LA
 * COURANTE. L'Ouvrage attaque la base qu'il a à portée, qui n'est pas forcément
 * celle que le joueur regarde : monter `baseCourante` ferait défendre les
 * bâtiments et la garnison d'une base qui n'est pas attaquée, puis écrire les
 * dégâts sur elle. Le défaut sert le banc et les montages écrits à la main.
 *
 * @param {object} etat
 * @param {number} niveauAttaquant niveau de la base de l'Ouvrage qui attaque
 * @param {number} budgetPoints points d'armée que l'Ouvrage engage
 * @param {number} graine graine de la vague, dérivée de la case et de la minute
 * @param {object} [laBase] la base attaquée — la courante par défaut
 * @returns {object} montage prêt pour `creerCombat`
 */
export function montageDeLaBaseDuJoueur(
  etat, niveauAttaquant, budgetPoints, graine, laBase = baseCourante(etat),
) {
  const surObstacle = new Set(
    laBase.obstacles.cases.map((o) => `${o.rangee}:${o.colonne}`),
  );
  const batiments = [];
  const indicesBatiments = [];
  laBase.disposition.forEach((b, index) => {
    if (surObstacle.has(`${b.rangee}:${b.colonne}`)) return;
    const pv = pvCourantsMilli(pvMaxDuBatiment(b.id, b.niveau), b.degatsMilli);
    const ligne = {
      id: b.id, rangee: b.rangee, colonne: b.colonne, niveau: b.niveau,
    };
    if (pv !== undefined) ligne.pvMilli = pv;
    batiments.push(ligne);
    indicesBatiments.push(index);
  });
  const defenseurs = [];
  const indicesDefenseurs = [];
  laBase.garnison.forEach((p, index) => {
    if (surObstacle.has(`${p.rangee}:${p.colonne}`)) return;
    const pv = pvCourantsMilli(pvMaxDeLaPiece(p.id, p.niveau), p.degatsMilli);
    const ligne = {
      id: p.id, rangee: p.rangee, colonne: p.colonne, niveau: p.niveau,
    };
    if (pv !== undefined) ligne.pvMilli = pv;
    defenseurs.push(ligne);
    indicesDefenseurs.push(index);
  });
  const vague = genererVague({ niveau: niveauAttaquant, budgetPoints, graine });
  return {
    // ⚠ `base`, ET CE N'EST PAS UN DÉTAIL DE FORME : `type` ne sert qu'à `butin`,
    // qui n'est jamais appelé sur un combat de défense — mais c'est le même mot
    // que `plancheAUnPv` lit du côté de l'Ouvrage. La base du joueur se comporte
    // comme une base : tout planche sauf ce qui la rase.
    type: 'base',
    niveau: niveauAttaquant,
    saveur: null,
    obstacles: laBase.obstacles.cases,
    batiments,
    defenseurs,
    // ⚠ UNE SEULE VAGUE, ET `genererVague` NE REND PAS UN `vagues[][]`. Il rend
    // une liste PLATE dont chaque unité porte sa propre rangée — 2 puis 1. Le
    // raid de l'Ouvrage est un déploiement statique sur deux rangées, pas un
    // assaut en quatre temps : le répartir en quatre le ferait entrer par
    // paquets de cinquante ticks, ce qu'il n'est pas.
    vagues: [vague.unites],
    modulesDebloques: {
      ouvrage: { offense: [], defense: [] },
      joueur: modulesDebloquesDuJoueur(etat),
    },
    majorationsPoi: { joueur: majorationsDeCombatDuJoueur(etat) },
    proprietaireDefense: 'joueur',
    proprietaireAttaque: 'ouvrage',
    // ⚠⚠ LES DEUX LISTES D'INDICES VOYAGENT AVEC LE MONTAGE, ET C'EST LE MOTIF
    // DE `composerLesVagues`. `creerCombat` REFUSE une pièce posée sur un
    // obstacle — or `CODES_TOLERES_AU_CHARGEMENT` tolère exactement ce cas, et
    // pour une bonne raison : le terrain se redéduit à chaque chargement, donc
    // un obstacle peut se poser sous une pièce placée légalement la veille. Sans
    // ce filtre, un raid de l'Ouvrage LÈVERAIT sur un état que le jeu déclare
    // jouable, et la partie deviendrait injouable pour une faute que le joueur
    // n'a pas commise.
    //
    // ⚠ ET LE FILTRE PRÉCÈDE LE `push`, comme dans `composerLesVagues`. Sauter
    // une pièce sans sauter son indice ferait retomber les dégâts sur la
    // MAUVAISE pièce, en silence.
    //
    // ⚠ CE N'EST PAS « RETIRER EN SILENCE » : la pièce reste dans
    // `etat.garnison`, elle compte toujours dans les points engagés et dans la
    // moyenne de niveau, et l'écran Chantier la montre déjà sur son obstacle.
    // Elle ne se BAT simplement pas — ce qu'un rocher sous ses pieds explique.
    indicesBatiments,
    indicesDefenseurs,
  };
}

/**
 * Les majorations de POI du joueur — la MÊME fonction que du côté offense.
 *
 * ⚠ `montageDuRaid` l'appelle déjà pour l'assaut ; ici la base est en défense et
 * le montage se fabrique à part, mais la source reste `majorationsDeCombat`. En
 * recopier le calcul ferait deux lectures de `poisAcquis` qui divergeraient au
 * premier POI ajouté.
 */
function majorationsDeCombatDuJoueur(etat) {
  return majorationsDeCombat(etat.poisAcquis ?? []);
}

// ---------------------------------------------------------------------------
// Ce qu'un raid laisse — §4.4 du brief, dans l'ordre, et l'ordre compte
// ---------------------------------------------------------------------------

/**
 * Reporte les dégâts du combat sur une liste de pièces du joueur.
 *
 * ⚠ L'APPARIEMENT SE FAIT PAR L'ORDRE, et c'est le contrat de tout le moteur :
 * `creerCombat` insère les défenseurs puis les bâtiments dans l'ordre où le
 * montage les donne, et `construireResultat` les rend dans l'ordre d'insertion.
 * Le montage est construit par un `map` sur la liste elle-même, donc l'indice
 * `i` du résultat est l'indice `i` de la liste. Un décalage se verrait tout de
 * suite — une pièce porterait les dégâts d'une autre —, et la levée ci-dessous
 * le dit AVANT plutôt qu'après.
 *
 * ⚠ LE PLANCHER SE DEMANDE À LA PIÈCE, IL NE S'APPLIQUE PAS À TOUT LE MONDE.
 * C'est le miroir exact de `plancheAUnPv` du côté de l'Ouvrage : là-bas tout
 * planche sur une base sauf la Souche, ici tout planche sauf le Chantier —
 * `BASE_BATIMENTS.chantierDeConstruction.plancherPv` vaut `false`, et c'est la
 * seule ligne des onze qui le dise. Faire plancher le Chantier rendrait la base
 * INRASABLE, donc la sanction la plus lourde du jeu inatteignable.
 *
 * ⚠ ET UNE PIÈCE DÉTRUITE RESTE DANS SA LISTE. Arbitré le 28/08 : « les unités
 * sont détruites mais pas perdues, doivent être réparées ». Le retirer ferait de
 * la destruction une façon de libérer des points d'armée.
 *
 * @param {Array<object>} pieces `etat.disposition` ou `etat.garnison`
 * @param {Array<object>} lignes les lignes correspondantes du résultat
 * @param {(piece: object) => boolean} planche la pièce garde-t-elle 1 PV ?
 * @returns {number} combien de pièces sont au plancher ou détruites
 */
function reporterSurLesPieces(pieces, indices, lignes, planche) {
  if (indices.length !== lignes.length) {
    throw new Error(
      `raid-ouvrage : ${lignes.length} lignes rendues pour ${indices.length} pièces montées — `
      + 'l\'ordre de montage ne correspond plus',
    );
  }
  let auPlancher = 0;
  for (let i = 0; i < indices.length; i += 1) {
    const piece = pieces[indices[i]];
    const ligne = lignes[i];
    const plancher = planche(piece) ? APRES_RAID.plancherPvMilli : 0;
    const pv = ligne.pvMilli > plancher ? ligne.pvMilli : plancher;
    if (pv <= APRES_RAID.plancherPvMilli) auPlancher += 1;
    piece.degatsMilli = ligne.pvMaxMilli - pv;
  }
  return auPlancher;
}

/** Le Chantier est-il tombé ? La seule question qui décide d'un rasage. */
function chantierTombe(disposition, indices, lignes) {
  for (let i = 0; i < indices.length; i += 1) {
    if (BASE_BATIMENTS[disposition[indices[i]].id]?.raseLeSite !== true) continue;
    if (lignes[i].detruit) return true;
  }
  return false;
}

/**
 * Le rasage — la sanction la plus lourde du jeu, et la seule qui DÉPLACE la
 * base du joueur.
 *
 * ⚠⚠ VINGT CASES VERS LE BAS, ET LA BORNE EST LE BORD DE LA CARTE. `estSurLaCarte`
 * est la seule chose qui dise où la carte s'arrête ; recompter la hauteur ici en
 * ferait une seconde vérité. Ce qui se passe À LA BORNE est ÉCRIT, parce que le
 * cas arrive vraiment : le joueur démarre rangée 295 sur une carte de 300, donc
 * son PREMIER rasage bute dessus. La base descend d'autant qu'elle peut et
 * s'arrête à la dernière rangée valide ; elle ne sort jamais, et elle ne reste
 * jamais sur place tant qu'il reste une case sous elle. C'est le test T8.
 *
 * ⚠⚠ LE TERRAIN NE SUIT PAS, ET C'EST L'ARBITRAGE DU 27/08. « Une fois qu'il a
 * posé sa base, les champs de quartz et de scorie ne changent plus jamais, sinon
 * ça casserait les collecteurs et le schéma. » `fondation` ne bouge donc PAS :
 * `champs` et `obstacles` en dérivent et restent tels quels. Seule `position`
 * change — c'est très exactement la distinction que `CLAUDE.md` §6 fait entre
 * les deux champs, et le jour où elles se confondraient le joueur perdrait la
 * disposition de ses collecteurs en se faisant raser.
 *
 * ⚠ LES RESSOURCES STOCKÉES SONT PERDUES, LES RÉSIDUS NON. `perteRessourcesStockees`
 * parle de ce que le joueur a EN STOCK ; les résidus de production sont des
 * fractions d'unité par bâtiment, invisibles et sans valeur — les remettre à
 * zéro ne punirait personne et ferait diverger le rattrapage.
 *
 * ⚠ LA BASE RASÉE EST CELLE QUI A ÉTÉ ATTAQUÉE, PAS CELLE QU'ON REGARDE. C'est
 * `subirUnRaid` qui la nomme ; la reprendre à `baseCourante` ici ferait
 * descendre de vingt cases une base que personne n'a touchée.
 *
 * @param {object} etat modifié en place
 * @param {object} laBase la base attaquée
 * @returns {{rangeeAvant: number, rangeeApres: number, cases: number,
 *   perdu: object}}
 */
function raserLaBase(etat, laBase) {
  const rangeeAvant = laBase.position.rangee;
  const voulue = rangeeAvant + RAID_OUVRAGE.sanctionRasage.redeploiementCases;
  let rangeeApres = rangeeAvant;
  for (let r = rangeeAvant + 1; r <= voulue; r += 1) {
    if (!estSurLaCarte(r, laBase.position.colonne)) break;
    rangeeApres = r;
  }
  // ⚠⚠ L'ÉCRITURE PASSE PAR `poserLaBaseSur`, ELLE NE SE FAIT PLUS ICI — lot
  // DÉPLACEMENT, 02/09. Cette fonction gardait sa propre ligne
  // `etat.position.rangee = …` ; depuis que le joueur peut bouger sa base de
  // lui-même, il y aurait eu DEUX codes pour déplacer la même chose, et deux
  // codes divergent. Ce qui reste ici est ce qui est PROPRE au rasage : une
  // seule direction, une distance fixe, et le rabotage sur le bord de carte.
  //
  // ⚠ ET LE RABOTAGE RESTE ICI, DÉLIBÉRÉMENT. Un déplacement voulu REFUSE une
  // case hors carte — le joueur a désigné une case, il doit obtenir celle-là ou
  // un refus. Une sanction n'a personne à qui répondre : elle pousse la base
  // aussi loin qu'elle peut et s'arrête au bord.
  //
  // ⚠ LE RELEVÉ DES POI EST DÉSORMAIS FAIT PAR `poserLaBaseSur`, donc plus bas
  // dans `subirUnRaid` : le `if (rase) releverLesPoisAcquis(etat)` a disparu, il
  // ferait un second relevé qui n'ajouterait rien.
  poserLaBaseSur(etat, rangeeApres, laBase.position.colonne, laBase);

  const perdu = {};
  if (RAID_OUVRAGE.sanctionRasage.perteRessourcesStockees) {
    for (const ressource of RESSOURCES) {
      const stock = laBase.economie.ressources[ressource];
      if (stock > 0) perdu[ressource] = Math.floor(stock / 1000);
      laBase.economie.ressources[ressource] = 0;
    }
  }
  return {
    rangeeAvant, rangeeApres, cases: rangeeApres - rangeeAvant, perdu,
  };
}

/**
 * La base du joueur subit un raid de cette base de l'Ouvrage, à cette minute.
 *
 * Les cinq conséquences du §4.4, dans l'ordre, et l'ordre compte :
 *   1. les dégâts s'écrivent sur `disposition` et `garnison` ;
 *   2. le rasage, si le Chantier est tombé ;
 *   3. la réserve de réparation se vide ;
 *   4. `reparerLaGarnison` — l'auto-réparation, enfin atteignable ;
 *   5. le rapport rejoint la liste des dix.
 *
 * ⚠ 3 AVANT 4, ET CE N'EST PAS INDIFFÉRENT. La réserve et l'auto-réparation sont
 * deux mécanismes distincts : l'une est un STOCK DE TEMPS que le joueur dépense
 * quand il veut, l'autre un pour-cent rendu sur-le-champ aux ouvrages qui
 * portent le module. Vider après aurait effacé le rendu si les deux touchaient
 * la même grandeur — ils n'y touchent pas, mais l'ordre du brief est celui-là et
 * il ne coûte rien de le tenir.
 *
 * ⚠⚠ LA RÉSERVE VIDÉE EST UNE LECTURE, PAS UN ARBITRAGE — et elle est signalée
 * comme telle au rapport du lot. `MODELE-ECONOMIQUE.md` §7 écrit « un raid qui
 * passe fait tomber la production et vide le réservoir de réparation » ; le
 * mécanisme n'existait pas quand la phrase a été écrite, il existe depuis le lot
 * RÉSERVE. Si Ethan n'en veut pas, c'est CETTE ligne-ci qui part, et rien
 * d'autre.
 *
 * ⚠ « UN RAID QUI PASSE » VEUT DIRE « QUI A FAIT DES DÉGÂTS », pas « qui a eu
 * lieu ». Une attaque entièrement repoussée ne vide rien : la punir reviendrait
 * à punir une défense qui a fait son travail.
 *
 * ⚠ LE VERDICT EST VU DU CÔTÉ DU JOUEUR QUI SE DÉFEND, et c'est le miroir exact
 * de `verdictDuRaid` : base rasée → défaite totale, des bâtiments entamés →
 * défaite, rien touché → victoire totale. Ethan avait annoncé que « Défaite
 * apparaîtra en défense ». LECTURE PRISE, signalée au rapport.
 *
 * @param {object} etat modifié en place
 * @param {object} base identité de la base de l'Ouvrage qui attaque
 * @param {number} minute index de minute absolu
 * @param {object} [options] `maxTicks` pour borner le combat
 * @returns {object} le rapport de défense, tel qu'il rejoint les dix
 */
export function subirUnRaid(etat, base, minute, options = {}) {
  // ⚠⚠ LA BASE FRAPPÉE EST CELLE QUE `basesAttaquantes` A DÉSIGNÉE. Le champ
  // `baseVisee` porte son indice ; à défaut — un montage écrit à la main, le
  // banc — c'est la courante, ce qu'une partie à une seule base a toujours
  // voulu dire. Sans lui, l'Ouvrage frapperait la base que le joueur REGARDE,
  // et une seconde base au calme encaisserait les coups destinés à la première.
  const laBase = etat.bases[base.baseVisee ?? etat.baseCourante];
  const budgetPoints = budgetRaid(base.niveau);
  // ⚠ LA GRAINE DE LA VAGUE EST CELLE DU TIRAGE, PAS UNE AUTRE. Deux passes,
  // même sel : la case, puis la minute. C'est ce qui rend la composition de la
  // vague reproductible — même graine, même minute, mêmes assaillants — et donc
  // ce qui permet à T2 de comparer deux fenêtres au lieu de comparer deux
  // nombres.
  const deLaCase = hachageBrut(etat.graine, base.rangee, base.colonne, SEL_RAID_OUVRAGE);
  const graineDeLaVague = hachageBrut(deLaCase, minute, 1, SEL_RAID_OUVRAGE);

  const montage = montageDeLaBaseDuJoueur(
    etat, base.niveau, budgetPoints, graineDeLaVague, laBase,
  );
  const resultat = resoudre(
    creerCombat(montage),
    { maxTicks: options.maxTicks ?? TICKS_MAX_COMBAT },
  );

  // --- 1. les dégâts s'écrivent -------------------------------------------
  const garnisonAuPlancher = reporterSurLesPieces(
    laBase.garnison, montage.indicesDefenseurs, resultat.defenses, () => true,
  );
  // ⚠ ELLE SE POSE AU RÉSULTAT DU COMBAT, PAS À L'ÉTAT ÉCRIT — `ligne.detruit`,
  // jamais `piece.degatsMilli`. Les deux disent la même chose aujourd'hui, et
  // c'est MESURÉ : la falsification qui lit l'état après coup laisse la suite
  // entièrement verte, parce que le Chantier est le seul bâtiment SANS plancher
  // et qu'il tombe donc vraiment à zéro. Ce n'est donc pas l'ordre qui protège
  // ici, c'est la SOURCE : le jour où le Chantier gagnerait un plancher — ou
  // qu'un second bâtiment raserait la base —, lire l'état rendrait la base
  // inrasable en silence, tandis que lire le résultat resterait juste. Le dire
  // autrement serait inventer une justification.
  const rase = chantierTombe(laBase.disposition, montage.indicesBatiments, resultat.batiments);
  const batimentsAuPlancher = reporterSurLesPieces(
    laBase.disposition, montage.indicesBatiments, resultat.batiments,
    (b) => BASE_BATIMENTS[b.id]?.plancherPv !== false,
  );

  // --- 2. le rasage --------------------------------------------------------
  // ⚠⚠ ET LA RUPTURE ANNONCÉE PAR `rattraperJeu` L. 397 EST ADVENUE ICI. La base
  // vient de se DÉPLACER, donc le territoire a balayé des cases que le relevé du
  // segment précédent n'a jamais vues. Le relevé se refait sur-le-champ, à
  // l'instant du rasage — pas à la fin du rattrapage, où il manquerait les POI
  // que la base aurait dû acquérir en chemin si elle avait bougé plus tôt.
  //
  // ⚠ IL SE FAIT DANS `poserLaBaseSur` DEPUIS LE LOT DÉPLACEMENT, et non plus
  // par un appel séparé juste ici. C'est une propriété du DÉPLACEMENT, pas une
  // précaution du rasage : le joueur qui bouge sa base de lui-même a exactement
  // le même besoin, et l'oublier de son côté aurait été invisible.
  const sanction = rase ? raserLaBase(etat, laBase) : null;

  // --- 3. la réserve de réparation se vide ---------------------------------
  //
  // ⚠⚠ LES TROIS RÉSERVOIRS D'ARMÉE SEULEMENT, ET LE QUATRIÈME EST ÉPARGNÉ PAR
  // DÉCISION, PAS PAR OUBLI — lot RÉSERVE-BASE, 05/09/2026. Vider aussi
  // `reserveReparationBatiments` rendrait le cliquet de la base INCASSABLE : le
  // raid qui abîme les bâtiments emporterait du même geste le temps qu'il faut
  // pour les relever, et le joueur repartirait de zéro à chaque passe. La phrase
  // de `MODELE-ECONOMIQUE.md` §7 — « un raid qui passe vide le réservoir de
  // réparation » — est du 24/08 et ne connaît qu'UN réservoir ; l'étendre à la
  // quatrième réserve serait un arbitrage de calibrage, et il revient à Ethan.
  // Si Ethan le veut, c'est la clé de boucle ci-dessous qui change, et rien
  // d'autre.
  const aPerduDesPv = resultat.batiments.some((b) => b.pvPerdusIciMilli > 0);
  if (aPerduDesPv) {
    for (const chassis of Object.keys(laBase.reserveReparation)) {
      laBase.reserveReparation[chassis] = 0;
    }
  }

  // --- 4. l'auto-réparation de garnison, enfin atteignable ------------------
  const autoReparationMilli = reparerLaGarnison(etat, laBase);

  // --- 5. le rapport rejoint les dix ---------------------------------------
  const rapport = {
    // ⚠ LE SENS EST ÉCRIT, ET LES DEUX CÔTÉS LE PORTENT. Une liste où seuls les
    // rapports de défense se déclarent obligerait tout lecteur à traiter
    // l'absence comme un cas ; `executerRaid` pose donc `sens: 'offense'` de son
    // côté, et personne n'a plus à deviner.
    sens: 'defense',
    attaquant: {
      type: base.type, niveau: base.niveau, rangee: base.rangee, colonne: base.colonne,
    },
    minute,
    cause: resultat.cause,
    ticks: resultat.tick,
    rase,
    sanction,
    reserveVidee: aPerduDesPv,
    autoReparationMilli,
    garnisonAuPlancher,
    batimentsAuPlancher,
    restantDefense: restantPct(resultat.defenses),
    restantBatiments: restantPct(resultat.batiments),
    verdict: verdictDeLaDefense(rase, resultat.batiments),
  };
  garderLeRapport(etat, rapport);
  return rapport;
}

/**
 * Ce qui reste debout, en pour-cent des PV du montage.
 *
 * ⚠ LE DÉNOMINATEUR EST `pvInitialMilli`, PAS `pvMaxMilli`, et la nuance est
 * celle qui a coûté un défaut à RAID-A. Une base déjà entamée par un raid
 * précédent entre au combat sous son maximum : rapporter au maximum ferait
 * annoncer « 60 % restants » à une base qui n'avait plus que 60 % en arrivant et
 * qui n'a rien perdu. Ici la question est « qu'est-ce que CE raid a laissé de ce
 * qui était debout en arrivant ».
 *
 * ⚠ ET LA COMPOSITION NE CHANGE PAS SOUS NOS PIEDS, contrairement au site de
 * l'Ouvrage : une pièce du joueur détruite RESTE dans la liste. Il n'y a donc
 * pas de montage plein à refaire, et pas de dénominateur qui rétrécit.
 */
function restantPct(lignes) {
  let initial = 0;
  let reste = 0;
  for (const l of lignes) {
    initial += l.pvInitialMilli;
    reste += l.pvMilli > 0 ? l.pvMilli : 0;
  }
  if (initial === 0) return null;
  return Math.round((reste * 100) / initial);
}

/** Le miroir de `verdictDuRaid`, vu du côté de celui qui se défend. */
function verdictDeLaDefense(rase, batiments) {
  if (rase) return 'defaite-totale';
  if (batiments.some((b) => b.pvPerdusIciMilli > 0)) return 'defaite';
  return 'victoire-totale';
}

// ---------------------------------------------------------------------------
// Le calendrier — ce que `sim/state.js` appelle depuis les deux chemins
// ---------------------------------------------------------------------------

/**
 * Résout tous les raids d'UNE minute donnée.
 *
 * ⚠⚠ LA LISTE DES ATTAQUANTES SE PREND UNE FOIS, EN TÊTE DE LA MINUTE. Deux
 * bases peuvent tirer la même minute ; si la première rase la base du joueur, la
 * seconde frappe une base déplacée, aux réserves vides — mais elle frappe. Les
 * deux sont parties au même instant : retirer la seconde parce que la cible a
 * bougé entre-temps ferait dépendre le résultat de l'ordre de la liste, et cet
 * ordre est celui de `ciblesAPortee`, qui est une commodité d'affichage.
 *
 * ⚠ ET C'EST LA MÊME FONCTION DES DEUX CÔTÉS, ce qui est tout l'intérêt : le
 * direct l'appelle pour une minute, le rattrapage pour la même. Deux
 * implémentations divergeraient au premier cas particulier.
 *
 * @param {object} etat modifié en place
 * @param {number} minute
 * @param {Array<object>} attaquantes liste prise par l'appelant
 * @param {object} [options]
 * @returns {number} nombre de raids résolus
 */
export function resoudreLaMinute(etat, minute, attaquantes, options = {}) {
  let n = 0;
  for (const base of attaquantes) {
    if (!baseAttaqueALaMinute(etat.graine, base, minute)) continue;
    subirUnRaid(etat, base, minute, options);
    n += 1;
  }
  return n;
}

/**
 * La première minute de `]apres, jusqua]` où au moins une base attaque.
 *
 * ⚠ ELLE NE RÉSOUT RIEN, elle ne fait que CHERCHER — c'est ce qui permet au
 * rattrapage de découper sa fenêtre avant d'avancer, plutôt que d'avancer puis
 * de revenir en arrière. Elle prend la liste des attaquantes en argument parce
 * qu'elle coûte 441 lectures de case : la recalculer à chaque minute ferait de
 * ce balayage la chose la plus chère du jeu.
 *
 * @param {number} graine
 * @param {Array<object>} attaquantes
 * @param {number} apres exclu
 * @param {number} jusqua inclus
 * @returns {number|null} l'index de minute, ou `null` s'il n'y en a aucune
 */
export function prochaineMinuteDeRaid(graine, attaquantes, apres, jusqua) {
  if (attaquantes.length === 0) return null;
  for (let m = apres + 1; m <= jusqua; m += 1) {
    for (const base of attaquantes) {
      if (baseAttaqueALaMinute(graine, base, m)) return m;
    }
  }
  return null;
}

/** Exporté pour le test qui croise la garde de portée et le rayon d'attaque. */
export const RAYON_ATTAQUE = GEOGRAPHIE.rayonAttaque;
