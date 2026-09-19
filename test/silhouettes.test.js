// Lot SILHOUETTES — 17/09/2026, points 13 et 7 du relevé d'Ethan :
// « Dans la génération de base ouvrage : toujours faire en sorte que la souche
// soit derrière l'etai. Donc inverser position en fonction des seed » et
// « Les raids ouvrage semblent identique ».
//
// ⚠⚠ CE FICHIER EXISTE PARCE QU'UNE EMPREINTE NE DIT PAS CE QUI A BOUGÉ, ELLE
// DIT QUE QUELQUE CHOSE A BOUGÉ. Les deux points sont gardés par des COUCHES de
// témoins — `DEPLACES_PAR_SILHOUETTES` de `test/temoins-bases-0.js`,
// `COMBATS_DEPLACES_PAR_SILHOUETTES` de `test/temoins-combat.js`, l'ancre de
// `DO T12` — et une couche tombe aussi bien quand la règle disparaît que quand
// elle est remplacée par une autre, tout aussi fausse. Ce qui suit NOMME les
// deux propriétés : une Souche jamais devant son Étai, et une vague dont les
// colonnes se tirent.
//
// ⚠⚠ ET LES DEUX PRÉMISSES D'ETHAN SONT INVERSÉES, CHACUNE À SA FAÇON — c'est
// écrit ici parce que ce fichier est l'endroit où l'on mesure. Le point 13
// suppose que la Souche est derrière et qu'il faut l'y remettre « en fonction
// des seed » : mesuré sur 2 880 sites AVANT le lot, elle était DEVANT 41,6 % du
// temps et derrière 29,0 %, et le biais ne venait d'aucun tirage — `liste` porte
// la Souche en premier, donc elle raflait le créneau le moins profond de son
// paquet. Le point 7 dit « les raids ouvrage semblent identique » : ce n'est pas
// la COMPOSITION qui se répétait — `SIL T4` le mesure — c'est la POSE, alignée à
// gauche, la dernière rangée toujours amputée par la droite.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

import {
  genererSite, genererVague, budgetRaid, composerBatiments, densite,
} from '../src/sim/generateur.js';
import { BATIMENTS } from '../src/data/sites.js';
import { GRILLE } from '../src/data/combat.js';

// ---------------------------------------------------------------------------
// Outils et échantillons
// ---------------------------------------------------------------------------

/**
 * Les cent sites que les deux cents montages témoins de `test/temoins-combat.js`
 * composent — cinq graines × quatre niveaux × cinq couples (type, saveur).
 *
 * ⚠ C'EST LE MÊME ÉCHANTILLON QUE CELUI SUR LEQUEL LA COUCHE `SILHOUETTES` A ÉTÉ
 * RELEVÉE, et c'est ce qui rend les nombres ci-dessous comparables à ceux du
 * témoin : les recalculer sur d'autres graines ferait confronter deux mesures
 * qui ne portent pas sur la même population.
 */
const CINQ_GRAINES = [1, 2, 3, 4, 5];
const QUATRE_NIVEAUX = [5, 20, 35, 50];
const CINQ_TYPES = [
  ['camp', 'richeQuartz'],
  ['camp', 'richeScorie'],
  ['avantPoste', 'richeQuartz'],
  ['avantPoste', 'richeScorie'],
  ['base', null],
];

/** Deux cents graines × trois niveaux : les six cents vagues de l'Ouvrage. */
const DEUX_CENTS_GRAINES = Array.from({ length: 200 }, (_, k) => k + 1);
const TROIS_NIVEAUX = [10, 25, 40];

const SOURCE_GENERATEUR = readFileSync(
  new URL('../src/sim/generateur.js', import.meta.url), 'utf8',
);

/**
 * Le corps d'une fonction de premier niveau, accolades comprises — de sa ligne
 * `function <nom>(` jusqu'à l'accolade fermante en colonne zéro.
 */
function corpsDeLaFonction(source, nom) {
  const debut = source.indexOf(`function ${nom}(`);
  assert.notEqual(debut, -1, `${nom} : introuvable dans la source`);
  const fin = source.indexOf('\n}', debut);
  assert.notEqual(fin, -1, `${nom} : pas d'accolade fermante en colonne zéro`);
  return source.slice(debut, fin + 2);
}

/**
 * Retire les commentaires d'un fragment de JavaScript.
 *
 * ⚠⚠ SANS ÇA, UNE GARDE LIT CE QU'ON A ÉCRIT À SON SUJET — huit précédents au
 * dépôt, dont `NEUT T13` la semaine dernière. Un commentaire posé demain dans
 * `souchereDerriereLEtai` pour expliquer qu'on n'échange PAS les entrées du
 * tableau écrirait `poses[souche] =` en toutes lettres, et `SIL T2` accuserait
 * une fonction juste. Un témoin plus bas prouve que le filtre n'a pas tout
 * mangé.
 */
function sansCommentaires(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

/** Les motifs de faute que `SIL T2` refuse, chacun avec son appât. */
const ECRITURE_ENTIERE = /poses\s*\[[^\]]*\]\s*=[^=]/;
const REMANIEMENT = /\.(splice|sort|reverse|push|pop|shift|unshift)\s*\(/;
const NOM_EN_DUR = /['"]souche['"]/;

// ---------------------------------------------------------------------------
// Point 13 — la Souche passe derrière l'Étai
// ---------------------------------------------------------------------------

test('SIL T1 — la Souche n\'est plus JAMAIS devant l\'Étai, sur cent sites', () => {
  // ⚠⚠ LES TROIS NOMBRES SONT MESURÉS, ET CELUI D'AVANT EST ÉCRIT À CÔTÉ DE
  // CELUI D'APRÈS. Sur ces cent sites : **62 derrière · 0 devant · 38 sur la
  // même rangée** aujourd'hui, contre **12 · 50 · 38** avant le lot — mesuré en
  // défaisant la permutation dans un arbre à part. Les deux contre-assertions
  // plus bas refusent le retour de l'ancienne règle de face : une garde qui
  // n'exigerait que `devant === 0` resterait verte sur un code qui mettrait
  // TOUT le monde sur la même rangée.
  let derriere = 0;
  let devant = 0;
  let memeRangee = 0;
  let sites = 0;

  for (const graine of CINQ_GRAINES) {
    for (const niveau of QUATRE_NIVEAUX) {
      for (const [type, saveur] of CINQ_TYPES) {
        const site = genererSite({ type, saveur, niveau, graine });
        const uniques = site.batiments.filter((b) => BATIMENTS[b.id].unique === true);
        assert.equal(uniques.length, 2,
          `${type}/${niveau}/g${graine} : ${uniques.length} uniques, deux attendus`);

        // ⚠ LA SOUCHE SE RECONNAÎT À `raseLeSite`, JAMAIS À SON NOM. C'est le
        // champ que `combat.js` teste pour le rasage et que `BASE_BATIMENTS`
        // porte à l'identique côté joueur ; un `id === 'souche'` écrit ici
        // serait la seconde vérité que `CLAUDE.md` §4 interdit, et il mentirait
        // le jour où le bâtiment changerait de clé.
        const souche = uniques.find((b) => BATIMENTS[b.id].raseLeSite === true);
        assert.notEqual(souche, undefined,
          `${type}/${niveau}/g${graine} : aucun des uniques ne porte raseLeSite`);
        const etai = uniques.find((b) => b !== souche);

        sites += 1;
        if (souche.rangee > etai.rangee) derriere += 1;
        else if (souche.rangee < etai.rangee) devant += 1;
        else memeRangee += 1;
      }
    }
  }

  assert.equal(sites, 100, 'l\'échantillon n\'est plus celui des témoins de combat');
  assert.equal(devant, 0, 'une Souche est passée DEVANT son Étai');
  assert.equal(derriere, 62, 'le compte des Souches au fond a changé sans être déclaré');
  assert.equal(memeRangee, 38, 'le compte des uniques à profondeur égale a changé');

  // ⚠⚠ LES CONTRE-ASSERTIONS REFUSENT L'ANCIENNE RÈGLE, ET ELLES NE SONT PAS
  // REDONDANTES AVEC LES ÉGALITÉS : celles-ci figent un état, celles-là nomment
  // l'état qu'on vient de quitter. Un lot qui déferait la permutation ferait
  // tomber les deux, et le message dirait POURQUOI.
  assert.notEqual(derriere, 12, 'le compte d\'avant SILHOUETTES est revenu : la permutation ne mord plus');
  assert.notEqual(devant, 50, 'les cinquante Souches en tête sont revenues');

  // ⚠ NON-VACUITÉ. Sans ces deux lignes, un générateur qui ne poserait plus
  // aucun bâtiment rendrait 0 · 0 · 0 et l'assertion `devant === 0` passerait.
  assert.ok(derriere > 0, 'aucune Souche derrière : le montage ne mesure rien');
  assert.ok(memeRangee > 0, 'aucun couple à profondeur égale : l\'échantillon a changé de nature');

  // ⚠⚠ ET LES TRENTE-HUIT CAS À PROFONDEUR ÉGALE NE SONT PAS UN DÉFAUT À
  // CORRIGER ICI — « derrière » n'a pas de sens à rangée égale, et les séparer
  // demanderait de choisir les créneaux des uniques AVANT de remplir le paquet,
  // donc de déplacer les bâtiments proportionnels. C'est un autre lot, et
  // **Ethan tranche**. Ce qui est garanti est l'absence de Souche DEVANT.
  assert.equal(derriere + devant + memeRangee, sites, 'le partage ne couvre pas les cent sites');
});

test('SIL T2 — la permutation échange des COORDONNÉES, jamais des entrées de tableau', () => {
  // ⚠⚠ C'EST CETTE PROPRIÉTÉ QUI ÉVITE UN `SAVE_VERSION`, ET AUCUNE EMPREINTE NE
  // LA VOIT. `sim/site-entame.js` range `pvBatimentsMilli` PAR INDICE dans
  // `montage.batiments`, qui suit l'ordre de `poses` : permuter deux ENTRÉES
  // appliquerait les PV de l'Étai à la Souche sur tout site déjà entamé — sans
  // erreur, sans message, et avec exactement la même disposition à l'écran, donc
  // avec exactement les mêmes empreintes de couche. Le seul moyen de l'attraper
  // est de regarder ce que la fonction ÉCRIT.
  const corps = sansCommentaires(corpsDeLaFonction(SOURCE_GENERATEUR, 'souchereDerriereLEtai'));

  // Témoin : le filtre de commentaires n'a pas mangé le corps.
  assert.ok(corps.includes('raseLeSite'),
    'le filtre de commentaires a emporté le corps de la fonction');
  assert.ok(corps.length > 200 && corps.length < 1200,
    `corps de ${corps.length} caractères : la tranche extraite n'est pas la bonne`);

  // (a) Elle écrit QUATRE coordonnées, et rien d'autre.
  const coordonnees = corps.match(/\.(rangee|colonne)\s*=[^=]/g) ?? [];
  assert.equal(coordonnees.length, 4,
    `${coordonnees.length} écritures de coordonnée, quatre attendues (deux par unique)`);

  // (b) Elle n'écrase JAMAIS une entrée entière.
  assert.ok(!ECRITURE_ENTIERE.test(corps),
    'une entrée de `poses` est réécrite en entier : la correspondance indice → identifiant casse');

  // (c) Elle ne remanie pas le tableau.
  assert.ok(!REMANIEMENT.test(corps),
    '`poses` est remanié : l\'ordre des bâtiments ne peut plus être celui de `liste`');

  // (d) Elle ne nomme pas la Souche par sa clé.
  assert.ok(!NOM_EN_DUR.test(corps),
    'la Souche est reconnue à son identifiant plutôt qu\'à `raseLeSite`');

  // ⚠⚠ LES APPÂTS PROUVENT QUE LES TROIS MOTIFS VOIENT LA VRAIE FAUTE. Sans eux,
  // « le corps ne contient pas X » serait vrai de n'importe quel motif mal écrit
  // — la faute que `AR T3` a payée au lot EMPRISES-ET-DÉLAI avec son motif non
  // borné, et que `NEUT T13` a payée en sens inverse.
  assert.ok(ECRITURE_ENTIERE.test('  poses[souche] = poses[etai];\n'),
    'le motif de l\'écriture entière ne reconnaît pas la faute qu\'il refuse');
  assert.ok(!ECRITURE_ENTIERE.test('  poses[souche].rangee = poses[etai].rangee;\n'),
    'le motif de l\'écriture entière accuse une écriture de coordonnée');
  assert.ok(REMANIEMENT.test('  poses.splice(souche, 1);\n'),
    'le motif du remaniement ne reconnaît pas la faute qu\'il refuse');
  assert.ok(NOM_EN_DUR.test("  const s = poses.find((p) => p.id === 'souche');\n"),
    'le motif du nom en dur ne reconnaît pas la faute qu\'il refuse');

  // ⚠⚠ ET LA MOITIÉ COMPORTEMENTALE, QUI EST CELLE QUI COMPTE : sur les cent
  // sites, la suite des identifiants doit être EXACTEMENT celle que
  // `composerBatiments` rend, dans son ordre. C'est l'oracle de la
  // correspondance indice → identifiant, et il ne dépend d'aucun nombre relevé —
  // il se recalcule depuis la table à chaque exécution.
  let compares = 0;
  for (const graine of CINQ_GRAINES) {
    for (const niveau of QUATRE_NIVEAUX) {
      for (const [type, saveur] of CINQ_TYPES) {
        const site = genererSite({ type, saveur, niveau, graine });
        const attendu = composerBatiments(densite(type, niveau).batiments);
        assert.deepEqual(site.batiments.map((b) => b.id), attendu,
          `${type}/${niveau}/g${graine} : l'ordre des bâtiments n'est plus celui de la composition`);

        const cases = new Set(site.batiments.map((b) => `${b.rangee}:${b.colonne}`));
        assert.equal(cases.size, site.batiments.length,
          `${type}/${niveau}/g${graine} : deux bâtiments sur la même case après la permutation`);
        compares += 1;
      }
    }
  }
  assert.equal(compares, 100, 'l\'échantillon comportemental n\'a pas été parcouru en entier');
});

// ---------------------------------------------------------------------------
// Point 7 — les colonnes d'une vague se tirent
// ---------------------------------------------------------------------------

/** Relève, pour les six cents vagues, ce que `SIL T3` et `SIL T4` mesurent. */
function releverLesVagues() {
  const largeur = GRILLE.largeur;
  let rangeesPleines = 0;
  let identite = 0;
  let vaguesADeuxRangees = 0;
  let deuxRangeesDistinctes = 0;
  const permutations = new Set();
  const sansColonnes = [];

  for (const graine of DEUX_CENTS_GRAINES) {
    for (const niveau of TROIS_NIVEAUX) {
      const vague = genererVague({ niveau, budgetPoints: budgetRaid(niveau), graine });

      // ⚠ L'EMPREINTE DE `SIL T4` NE PORTE PAS LA COLONNE, ET C'EST TOUT SON
      // OBJET : identifiants, rangées et les deux scalaires de budget.
      sansColonnes.push(`${vague.pointsEngages}/${vague.pointsRestants}/${
        vague.unites.map((u) => `${u.id}:${u.rangee}`).join(',')}`);

      const parRangee = new Map();
      for (const u of vague.unites) {
        if (!parRangee.has(u.rangee)) parRangee.set(u.rangee, []);
        parRangee.get(u.rangee).push(u.colonne);
      }

      for (const colonnes of parRangee.values()) {
        // Toute rangée, pleine ou partielle : des colonnes DISTINCTES, dans la grille.
        assert.equal(new Set(colonnes).size, colonnes.length,
          `g${graine}/n${niveau} : deux unités sur la même colonne d'une rangée`);
        for (const c of colonnes) {
          assert.ok(Number.isInteger(c) && c >= 1 && c <= largeur,
            `g${graine}/n${niveau} : colonne ${c} hors de 1…${largeur}`);
        }
      }

      const pleines = [...parRangee.values()].filter((c) => c.length === largeur);
      for (const colonnes of pleines) {
        rangeesPleines += 1;
        permutations.add(colonnes.join(','));
        if (colonnes.every((c, i) => c === i + 1)) identite += 1;
      }
      if (pleines.length >= 2) {
        vaguesADeuxRangees += 1;
        if (pleines[0].join(',') !== pleines[1].join(',')) deuxRangeesDistinctes += 1;
      }
    }
  }

  return {
    rangeesPleines,
    identite,
    permutations: permutations.size,
    vaguesADeuxRangees,
    deuxRangeesDistinctes,
    empreinte: createHash('sha256').update(sansColonnes.join('|')).digest('hex').slice(0, 16),
  };
}

test('SIL T3 — une rangée pleine est une PERMUTATION des neuf colonnes, plus l\'identité', () => {
  // ⚠⚠ LES QUATRE NOMBRES D'AVANT SONT ÉCRITS À CÔTÉ DE CEUX D'APRÈS, mesurés en
  // défaisant le tirage dans un arbre à part. Avant : **603 rangées pleines,
  // 603 identités, UNE seule permutation distincte, et 0 vague sur 203 dont les
  // deux rangées diffèrent** — la colonne valait `(i % largeur) + 1`, donc à
  // nombre d'unités égal il n'existait qu'une forme. Après : **603 · 0 · 591 ·
  // 203 sur 203**. C'est la mesure du « les raids ouvrage semblent identique ».
  const releve = releverLesVagues();

  assert.equal(releve.rangeesPleines, 603,
    'le nombre de rangées pleines a changé : l\'échantillon ou la composition a bougé');
  assert.equal(releve.identite, 0, 'une rangée pleine sort encore dans l\'ordre 1…9');
  assert.equal(releve.permutations, 591,
    'le compte de permutations distinctes a changé sans être déclaré');
  assert.equal(releve.vaguesADeuxRangees, 203,
    'le nombre de vagues à deux rangées pleines a changé');
  assert.equal(releve.deuxRangeesDistinctes, 203,
    'deux rangées pleines d\'une même vague sortent identiques');

  // ⚠⚠ LES CONTRE-ASSERTIONS REFUSENT LA POSE D'AVANT DE FACE. `identite === 0`
  // seul serait vert sur un générateur qui ne poserait plus aucune rangée
  // pleine ; `notEqual(identite, 603)` nomme l'état qu'on quitte.
  assert.notEqual(releve.identite, 603, 'la pose alignée à gauche est revenue');
  assert.notEqual(releve.permutations, 1, 'il n\'existe plus qu\'une forme de rangée pleine');
  assert.notEqual(releve.deuxRangeesDistinctes, 0,
    'les deux rangées d\'une vague sont redevenues la même');

  // ⚠ NON-VACUITÉ, dans les deux sens : il faut des rangées pleines pour que la
  // mesure porte, et il faut plus d'une forme pour que « permutation » veuille
  // dire quelque chose.
  assert.ok(releve.rangeesPleines > 0, 'aucune rangée pleine : le montage ne mesure rien');
  assert.ok(releve.permutations > releve.rangeesPleines / 2,
    `${releve.permutations} formes pour ${releve.rangeesPleines} rangées : le tirage s'est resserré`);
});

test('SIL T4 — le tirage des colonnes ne touche NI la composition NI les rangées', () => {
  // ⚠⚠ C'EST LA GARDE QUI DIT CE QUE LE POINT 7 NE FAIT PAS, ET ELLE EST LA
  // MOITIÉ QUI MANQUAIT. `colonnesDesRangees` consomme des tirages sur le flux
  // de `genererVague` : si elle en consommait un nombre qui DÉPEND du résultat —
  // un `while` qui relance jusqu'à tomber juste —, elle décalerait tout ce qui
  // tire après elle, et la vague changerait d'unités pour une graine donnée.
  // `melanger` prend `largeur − 1` tirages quoi qu'il arrive, et elle est
  // appelée APRÈS `tirerSousBudget` : la composition est donc intacte.
  //
  // ⚠⚠ ET L'EMPREINTE A ÉTÉ MESURÉE DES DEUX CÔTÉS — **`a2a114cf41e69a2f` avec
  // ET sans le point 7**, sur les six cents vagues. C'est ce qui distingue cette
  // assertion d'une ancre ordinaire : elle ne fige pas un état neuf, elle fige un
  // état que le lot N'A PAS déplacé. Un tirage ajouté ailleurs dans
  // `genererVague`, ou un `while` de relance, la ferait tomber.
  const releve = releverLesVagues();

  assert.equal(releve.empreinte, 'a2a114cf41e69a2f',
    'la composition ou les rangées d\'une vague ont bougé : le tirage des colonnes a fui');

  // ⚠ ET L'EMPREINTE N'EST PAS VACUEUSE : elle porte bien les six cents vagues,
  // et ces vagues portent bien des unités. Sans ces deux lignes, un
  // `genererVague` qui rendrait toujours une liste vide passerait l'égalité le
  // jour où quelqu'un réancrerait le hachage.
  assert.equal(releve.rangeesPleines, 603, 'le relevé ne porte plus sur les six cents vagues');
  assert.ok(releve.vaguesADeuxRangees > 0, 'aucune vague à deux rangées : le relevé ne mesure rien');
});
