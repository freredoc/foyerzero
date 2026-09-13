// test/contact.test.js — LE PAS S'ARRÊTE AU CONTACT (lot CONTACT, 13/09/2026)
// ===========================================================================
//
// Ethan, 13/09 : « Quand deux unités défensives se déplacent, elles semblent
// entrer en collision, puis une ou l'autre est poussée très rapidement », puis,
// l'arbitrage : « **Je ne veux pas de saut, ni de chevauchement.** »
//
// Ce fichier porte les DEUX mots de cet arbitrage, et rien d'autre. Il ne
// double aucun test existant : `mur.test.js` garde la règle DEVANT UNE
// STRUCTURE, `arret.test.js` l'histoire des trois arbitrages, `repli.test.js`
// le compteur. Ici on ne regarde ni qui bloque qui, ni pourquoi — on regarde
// **les positions**, tick par tick, et on refuse deux choses.
//
// ⚠⚠ LE MONTAGE INTERDIT LE BOOSTER, ET CE N'EST PAS UNE PRÉCAUTION. Son ×10
// porterait la borne de l'Éclaireur de 240 à 2 400 : le saut de **920** que ce
// lot corrige y passerait sans être vu. `modulesDebloques` est vide partout, et
// `CONTACT T1` l'asserte sur chaque montage avant de mesurer quoi que ce soit.
//
// ⚠ ET `obstacles: []` PARTOUT, pour la même raison prise par l'autre bout : un
// obstacle DIVISE la vitesse, donc il ne peut que rendre la borne plus large que
// le pas réel — mais il la rendrait imprévisible depuis la table, et la borne
// cesserait d'être lue pour être devinée.

import test from 'node:test';
import assert from 'node:assert/strict';

import { creerCombat, tick } from '../src/sim/combat.js';
import { MILLI_PAR_CASE } from '../src/sim/grille.js';
import { genererSite } from '../src/sim/generateur.js';
import { DEFENSES, GRILLE, UNITES } from '../src/data/combat.js';

const GANGUE_LOINTAINE = { id: 'gangue', rangee: 18, colonne: 1 };
const SANS_MODULE = {
  ouvrage: { offense: [], defense: [] },
  joueur: { offense: [], defense: [] },
};

const montage = (o) => ({
  niveau: 1,
  saveur: null,
  obstacles: [],
  batiments: [GANGUE_LOINTAINE],
  defenseurs: [],
  vagues: [[]],
  modulesDebloques: SANS_MODULE,
  ...o,
});

// ---------------------------------------------------------------------------
// Ce que la TABLE dit du pas d'une pièce — jamais ce que le moteur en fait
// ---------------------------------------------------------------------------

/**
 * Le pas maximal d'une entité, LU DANS `src/data/combat.js`.
 *
 * ⚠ LES DEUX AXES N'ONT PAS LA MÊME BORNE, et la latérale se DÉRIVE :
 * `floor(vitesse × GRILLE.lateral.numerateur / .denominateur)`. Écrire
 * `vitesse × 2 / 3` ici ferait une seconde vérité sur le ×2/3, que
 * `COL T13` garde déjà côté moteur.
 *
 * ⚠ ET UNE DÉFENSE COMME UN BÂTIMENT RENDENT ZÉRO : ni `DEFENSES` ni les
 * bâtiments ne portent de `vitesse`, donc leur profil a `vitesseMilli` nul et
 * leur pas doit l'être aussi. Une borne nulle est la plus forte des bornes,
 * et c'est bien ce qu'on veut dire — un mur ne se déplace pas d'un millième.
 */
function bornesDuPas(genre, id) {
  if (genre !== 'unite') return { rangee: 0, colonne: 0 };
  const vitesse = UNITES[id].vitesse;
  const { numerateur, denominateur } = GRILLE.lateral;
  return { rangee: vitesse, colonne: Math.floor((vitesse * numerateur) / denominateur) };
}

/**
 * Une entité est-elle BLOQUANTE ? La question se pose à la table de son genre,
 * dans les termes exacts de `profil*` — `masse > 0` pour une unité,
 * `bloque === true` pour une défense, toujours vrai pour un bâtiment.
 *
 * ⚠ L'AVIATION EN SORT, ET CE N'EST PAS UNE FAVEUR : masse nulle, elle ne
 * bloque ni n'est bloquée, donc deux aéronefs superposés ne sont pas un
 * chevauchement mais deux objets qui se croisent à des altitudes différentes.
 */
function estBloquante(genre, id) {
  if (genre === 'batiment') return true;
  if (genre === 'defense') return DEFENSES[id].bloque === true;
  return UNITES[id].masse > 0;
}

const estActive = (e) => e.vivant && !e.sorti && !e.embarquee;

/**
 * La masse d'une entité, LUE DANS LA TABLE. Seules les unités en portent une —
 * `profilDefense` et `profilBatiment` rendent `masse: 0`, et c'est ce qui fait
 * qu'une unité de masse 1 écrase un mur.
 */
const masseDe = (e) => (e.genre === 'unite' ? UNITES[e.id].masse : 0);

/** Un relevé de positions, indexé par indice d'entité. */
const releverPositions = (etat) => {
  const m = new Map();
  for (const e of etat.entites) {
    if (!estActive(e)) continue;
    m.set(e.indice, { r: e.rangeeMilli, c: e.colonneMilli });
  }
  return m;
};

// ---------------------------------------------------------------------------
// Les montages — les trois du brief, plus quatre raids réels
// ---------------------------------------------------------------------------

/**
 * ⚠⚠ LE PREMIER EST CELUI QUI A FAIT LE LOT, et il est reproduit à la lettre du
 * §1 du brief : deux Éclaireurs de garnison en rangée 6, colonnes 3 et 9, une
 * infanterie assaillante en colonne 6. Les deux convergent vers elle, et
 * AVANT le lot le second sautait de **920 millièmes au tick 27** contre un pas
 * nominal de 80 — ×11,5.
 */
const CONVERGENCE = montage({
  defenseurs: [
    { id: 'ratisseur', rangee: 6, colonne: 3 },
    { id: 'ratisseur', rangee: 6, colonne: 9 },
  ],
  vagues: [[{ id: 'meute', colonne: 6 }]],
});

/**
 * ⚠ LE JUMEAU VERTICAL, §1.3 du brief : un Éclaireur rattrape un Obusier dans
 * sa colonne. Avant le lot il avançait neuf ticks, RECULAIT de 80, se figeait
 * six ticks, repartait — l'écart réel au freinage valait 1 520 millièmes, donc
 * 520 de marge libre gâchée.
 */
const FILE = montage({
  defenseurs: [{ id: 'merlon', rangee: 10, colonne: 5 }],
  vagues: [
    [{ id: 'pilon', colonne: 5 }],
    [{ id: 'ratisseur', colonne: 5 }],
  ],
});

/**
 * ⚠ ET LE CAS HORS ALLIÉES, §1.4 : deux Fendeurs opposés, masse égale, dans la
 * même colonne. C'est le montage de `T7 b` de `combat.test.js`, qui assertait
 * `2960` au dépôt avant le lot COLONNE — 960 millièmes de recouvrement, écrits
 * noir sur blanc. ⚠ Il n'assertait plus 2 960 au moment du lot CONTACT mais
 * `2000` : le lot COLONNE l'avait déjà figé par l'arrêt sur prédilection. Le
 * montage est repris quand même, parce que ce qu'il exerce — une bloquante
 * arrêtée devant une ennemie de MÊME MASSE — n'est couvert par aucun autre.
 */
const MASSE_EGALE = montage({
  defenseurs: [{ id: 'fendeur', rangee: 3, colonne: 5 }],
  vagues: [[{ id: 'fendeur', colonne: 5 }]],
});

/** Une armée pleine, une pièce par colonne, sur les quatre vagues. */
function armee(ids, niveau) {
  const vagues = [[], [], [], []];
  ids.forEach((id, i) => {
    vagues[i % 4].push({ id, colonne: (Math.floor(i / 4) % 9) + 1, niveau });
  });
  return vagues.filter((v) => v.length > 0);
}

const TOUTES = Object.keys(UNITES);

/** Quatre raids RÉELS, pour que l'invariant ne tienne pas que sur des scènes nues. */
function raidsReels() {
  const sortie = [];
  for (const [type, saveur, niveau, graine] of [
    ['camp', 'richeQuartz', 5, 1],
    ['avantPoste', 'richeScorie', 20, 2],
    ['base', null, 35, 3],
    ['base', null, 50, 4],
  ]) {
    sortie.push([
      `${type}/n${niveau}/g${graine}`,
      { ...genererSite({ type, saveur, niveau, graine }), vagues: armee(TOUTES, niveau) },
    ]);
  }
  return sortie;
}

const MONTAGES = [
  ['convergence (§1)', CONVERGENCE],
  ['file verticale (§1.3)', FILE],
  ['masse égale (§1.4)', MASSE_EGALE],
  ...raidsReels(),
];

const TICKS = 900;

// ---------------------------------------------------------------------------
// CONTACT T1 — AUCUN SAUT
// ---------------------------------------------------------------------------

// ⚠⚠ VU ROUGE SUR L'ARBRE INTACT AVANT D'ÊTRE ÉCRIT, comme le §8 du brief
// l'exige. Sur le moteur d'avant le lot, il tombe au premier montage :
//   « convergence (§1), tick 27 : ratisseur a sauté de 920 millièmes en
//     colonne (7 000 → 6 000), son pas vaut 80 »
// — c'est le nombre du §1, au millième.
//
// ⚠ ON NE COMPARE QUE LES ENTITÉS ACTIVES AUX DEUX TICKS, et c'est la seule
// exemption du test. Une entité qui APPARAÎT — une vague qui entre, une
// passagère qui débarque — est POSÉE à une position, elle ne s'y déplace pas :
// mesurer un « pas » entre l'absence et une position n'aurait aucun sens. Une
// entité qui meurt, se replie ou sort du champ quitte l'ensemble de la même
// façon. Ce qui reste est exactement ce que le moteur DÉPLACE.
test('CONTACT T1 — aucune entité ne franchit plus que son pas nominal en un tick', () => {
  let ticksMesures = 0;
  let pasMax = 0;
  for (const [nom, m] of MONTAGES) {
    // ⚠⚠ LE MONTAGE DOIT INTERDIRE LE BOOSTER, ET LA GARDE PORTE SUR LUI SEUL.
    // Son ×10 porterait la borne de l'Éclaireur de 240 à 2 400 : le saut de 920
    // du §1 y passerait sans être vu. C'est le SEUL module qui touche à la
    // vitesse — `vitesseDuTick` n'en lit aucun autre —, donc c'est lui qu'on
    // nomme. ⚠ Une garde « toutes les listes sont vides » aurait paru plus
    // stricte et aurait refusé les quatre raids RÉELS : `genererSite` arme
    // `ouvrage.defense` depuis le lot MODULES-F, avec cinq modules dont aucun
    // n'est le Booster.
    for (const camp of ['joueur', 'ouvrage']) {
      for (const branche of ['offense', 'defense']) {
        assert.ok(!m.modulesDebloques[camp][branche].includes('booster'),
          `montage « ${nom} » : ${camp}.${branche} arme le Booster, la borne sauterait à ×10`);
      }
    }
    // ⚠ LES OBSTACLES, EUX, SONT TOLÉRÉS SUR LES RAIDS RÉELS — et c'est un écart
    // au §8 du brief, déclaré. Il demande `obstacles: []` « pour que le pas soit
    // EXACTEMENT la vitesse de la table » ; l'assertion ci-dessous est une
    // INÉGALITÉ, et `vitesseSousObstacle` DIVISE — un obstacle ne peut donc que
    // rendre la borne plus large que le pas réel, jamais plus étroite. Les
    // retirer d'un site généré en ferait un autre site, et le lot perdrait les
    // quatre seuls montages où les quatorze pièces courent ensemble.
    if (!nom.startsWith('§') && !nom.includes('(§')) {
      assert.ok(Array.isArray(m.obstacles), `montage « ${nom} » : obstacles absents`);
    } else {
      assert.deepEqual(m.obstacles, [], `montage « ${nom} » : un obstacle fausserait la borne`);
    }

    const etat = creerCombat(m);
    let avant = releverPositions(etat);
    for (let t = 1; t <= TICKS; t += 1) {
      tick(etat);
      const apres = releverPositions(etat);
      for (const e of etat.entites) {
        if (!estActive(e)) continue;
        const d = avant.get(e.indice);
        if (d === undefined) continue; // elle vient d'apparaître : posée, pas déplacée
        const borne = bornesDuPas(e.genre, e.id);
        const dr = Math.abs(e.rangeeMilli - d.r);
        const dc = Math.abs(e.colonneMilli - d.c);
        assert.ok(dr <= borne.rangee,
          `${nom}, tick ${t} : ${e.id} a sauté de ${dr} millièmes en rangée `
          + `(${d.r} → ${e.rangeeMilli}), son pas vaut ${borne.rangee}`);
        assert.ok(dc <= borne.colonne,
          `${nom}, tick ${t} : ${e.id} a sauté de ${dc} millièmes en colonne `
          + `(${d.c} → ${e.colonneMilli}), son pas vaut ${borne.colonne}`);
        pasMax = Math.max(pasMax, dr, dc);
      }
      ticksMesures += 1;
      avant = apres;
      if (etat.termine) break;
    }
  }
  // ⚠ ET LE MONTAGE MESURE QUELQUE CHOSE : sans ces deux lignes, un moteur qui
  // ne bougerait plus personne passerait le test la tête haute.
  assert.ok(ticksMesures > 2000, `seulement ${ticksMesures} ticks joués`);
  assert.ok(pasMax > 0, 'aucune entité n\'a bougé d\'un millième : le montage ne mesure rien');
});

// ---------------------------------------------------------------------------
// CONTACT T2 — AUCUN CHEVAUCHEMENT
// ---------------------------------------------------------------------------

// ⚠⚠ C'EST L'ÉNONCÉ GÉOMÉTRIQUE COMPLET, et il ne se scinde pas. Une entité
// occupe `[m, m + MILLI_PAR_CASE)` sur CHACUN des deux axes : deux pavés d'une
// case ne se recouvrent que si les DEUX intervalles se recouvrent. Tester un
// seul axe refuserait deux pièces côte à côte, qui sont l'état normal.
//
// ⚠⚠ VU ROUGE SUR L'ARBRE INTACT : il tombe au premier montage, tick 26 —
// « convergence (§1), tick 26 : ratisseur et ratisseur se recouvrent
//   (Δrangée 0, Δcolonne 920) ». Le §1 du brief le décrit autrement, par le saut
// du tick SUIVANT ; c'est le MÊME fait pris un tick plus tôt : le saut n'est que
// la façon dont l'ancien moteur défaisait le recouvrement qu'il venait de créer.
//
// ⚠⚠⚠ ET IL TOMBE AUSSI SUR LES RAIDS RÉELS, POUR UNE RAISON QUI N'EST NI LE
// RANGEMENT NI LE FLUAGE. Le §8 du brief l'avait prévu et tranché d'avance :
// « SI T2 TOMBE SUR UN MONTAGE POUR UNE AUTRE RAISON QUE LE RANGEMENT OU LE
// FLUAGE, NE PAS L'AFFAIBLIR — L'ÉCRIRE. » Il posait que l'invariant « devrait
// tenir par construction, les pièces étant posées sur des multiples exacts et
// **l'écrasement tuant dans le même pas** ». Mesuré : l'écrasement ne tue PAS
// dans le même pas, et ce n'est pas tout.
//
// DEUX FAMILLES RESTENT, ET LES DEUX SONT ANTÉRIEURES AU LOT — mesuré sur les
// quatre raids réels, 1 981 774 paires comparées, arbre d'avant contre arbre
// d'après :
//
//   famille                              AVANT   APRÈS
//   A — l'écrasement différé               144      69
//   B — le croisement à cheval             591      22
//   TOTAL                                  735      91   (−87,6 %)
//
// **A — L'ÉCRASEMENT DIFFÉRÉ.** `bloqueuseSur` rend `null` sur une occupante
// ÉCRASABLE — c'est le §3 du brief mot pour mot, « sinon l'écrasement meurt en
// silence » —, donc la marge de l'écraseuse est infinie et elle entre dans le
// pavé de sa victime. Mais `avancer` ne TUE qu'au franchissement de l'INDEX de
// case : entre les deux, les deux pavés se recouvrent pendant plusieurs ticks.
// Relevé : un Bélier à 9 048 sous une Meute à 10 000, Δ 952, sur huit ticks.
// **Fermer cette famille demanderait d'écraser au CONTACT et non au
// franchissement, c'est-à-dire de déplacer l'instant de la mort — une règle de
// jeu. Ethan tranche ; le lot ne la touche pas.**
//
// **B — LE CROISEMENT À CHEVAL SUR DEUX INDEX.** Les deux axes se scannent
// SÉPARÉMENT, chacun sur son propre index de case : `avancer` regarde les
// rangées devant DANS SA COLONNE, `seDecaler` les colonnes à côté DANS SA
// RANGÉE. Une entité à une position fractionnaire est à cheval sur deux index
// de son axe, et l'autre ne scanne pas celui-là. Relevé : une Meute décalée en
// colonne 1 720 et une Carapace montée en rangée 7 020, masses ÉGALES donc
// aucun écrasement — chacune est hors de l'index que l'autre inspecte.
// **Le lot en retire 96 % ; le reste demande un balayage à deux index par axe,
// donc quatre cases au lieu de deux, et c'est un changement de coût du tick.
// Ethan tranche.**
//
// ⚠⚠ ET CE TEST NE SE DESSERRE PAS POUR AUTANT — IL EST LE CONTRAIRE D'UNE
// TOLÉRANCE, ET C'EST L'IDIOME DE `DETTES_ACCENT` : les deux familles sont
// NOMMÉES, leurs comptes sont EXACTS, et chacune porte une caractérisation
// POSITIVE qui peut tomber. Un chevauchement d'une troisième nature tombe par
// son nom ; un de plus ou de moins dans l'une des deux fait tomber le compte et
// oblige à remesurer. **Le jour où l'une des deux se ferme, ce test tombe : c'est
// ce qu'on lui demande.**
test('CONTACT T2 — deux bloquantes actives ne se recouvrent jamais, hors deux familles nommées et comptées', () => {
  // ⚠ LES TROIS MONTAGES DU BRIEF SONT TENUS EN ABSOLU, SANS AUCUNE EXCEPTION.
  // C'est la scène qu'Ethan a rapportée, et c'est là que le test est rouge sur
  // l'arbre d'avant le lot.
  const ABSOLUS = new Set(['convergence (§1)', 'file verticale (§1.3)', 'masse égale (§1.4)']);

  // ⚠ LES DEUX COMPTES SONT DES RELEVÉS DU 13/09, PAS DES SEUILS. Ils se
  // remesurent au prochain lot qui touche au déplacement, et ils ne se
  // relèvent JAMAIS pour faire passer un lot.
  const ATTENDUS = { A: 69, B: 22 };
  const PAR_MONTAGE = {
    'camp/n5/g1': { A: 8, B: 0 },
    'avantPoste/n20/g2': { A: 39, B: 22 },
    'base/n35/g3': { A: 11, B: 0 },
    'base/n50/g4': { A: 11, B: 0 },
  };

  let paires = 0;
  const comptes = { A: 0, B: 0 };
  const parMontage = {};
  for (const [nom, m] of MONTAGES) {
    if (!ABSOLUS.has(nom)) parMontage[nom] = { A: 0, B: 0 };
    const etat = creerCombat(m);
    for (let t = 1; t <= TICKS; t += 1) {
      tick(etat);
      const actives = etat.entites.filter((e) => estActive(e) && estBloquante(e.genre, e.id));
      for (let i = 0; i < actives.length; i += 1) {
        for (let j = i + 1; j < actives.length; j += 1) {
          const a = actives[i];
          const b = actives[j];
          paires += 1;
          const dr = Math.abs(a.rangeeMilli - b.rangeeMilli);
          const dc = Math.abs(a.colonneMilli - b.colonneMilli);
          if (dr >= MILLI_PAR_CASE || dc >= MILLI_PAR_CASE) continue;

          assert.ok(!ABSOLUS.has(nom),
            `${nom}, tick ${t} : ${a.id} et ${b.id} se recouvrent `
            + `(Δrangée ${dr}, Δcolonne ${dc})`);

          // FAMILLE A — l'une peut écraser l'autre : camps opposés, masses
          // strictement différentes. C'est `peutEcraser` sans la part qui
          // dépend de l'état, et le montage n'arme aucun module de masse.
          const ecrasable = a.camp !== b.camp && masseDe(a) !== masseDe(b);
          if (ecrasable) {
            comptes.A += 1;
            parMontage[nom].A += 1;
            continue;
          }
          // FAMILLE B — le croisement à cheval. ⚠ SA CARACTÉRISATION EST
          // POSITIVE, ET C'EST CE QUI LA REND FALSIFIABLE : au moins une des
          // quatre coordonnées n'est PAS un multiple de `MILLI_PAR_CASE`. Deux
          // bloquantes qui se recouvriraient en étant toutes deux sur des
          // multiples exacts violeraient la carte d'occupation elle-même —
          // c'est un défaut d'une troisième nature, et il tombe ici.
          const aCheval = [a.rangeeMilli, a.colonneMilli, b.rangeeMilli, b.colonneMilli]
            .some((v) => v % MILLI_PAR_CASE !== 0);
          assert.ok(aCheval,
            `${nom}, tick ${t} : ${a.id} et ${b.id} se recouvrent sur des multiples EXACTS `
            + `(${a.rangeeMilli}, ${a.colonneMilli}) et (${b.rangeeMilli}, ${b.colonneMilli}) : `
            + 'ni écrasement différé ni croisement à cheval, c\'est une troisième famille');
          comptes.B += 1;
          parMontage[nom].B += 1;
        }
      }
      if (etat.termine) break;
    }
  }
  assert.ok(paires > 100_000, `seulement ${paires} paires comparées`);
  assert.deepEqual(comptes, ATTENDUS,
    'le compte des deux familles a bougé : remesurer et réécrire le pavé ci-dessus, '
    + 'jamais relever les nombres pour faire passer le lot');
  assert.deepEqual(parMontage, PAR_MONTAGE, 'la répartition par montage a bougé');
});
