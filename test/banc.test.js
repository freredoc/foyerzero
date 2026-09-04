// Tests T8 et T10 du brief du lot 3A, plus les balayages de la relecture §11 :
// palette stricte, aucun Math.random dans src/, registres de noms.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

import {
  montageDuBanc, executerRaidComplet, nomAffiche,
  formaterPointsMilli, formaterPv, LIBELLES_CAUSE, DPR_MAX,
} from '../src/ui/banc.js';
import { creerCombat, CAUSES } from '../src/sim/combat.js';
import { PROFILS_ASSAUT, EMPLACEMENTS_ASSAUT } from '../src/data/sites.js';
import { DEFENSES } from '../src/data/combat.js';
import { PREREGLAGES, montagePreregle } from './prereglages-lot3a.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * La palette de `FICHE-STYLE.md`, transcrite. Trente-trois teintes depuis la v5.
 * Un test plus bas l'asserte contre le document, dans les deux sens.
 */
const PALETTE_FICHE = [
  // châssis kaki — le joueur
  '#161914', '#343A2C', '#4E5742', '#6A7658', '#8C9A72',
  // sol du joueur
  '#B87E64', '#C38C73', '#CF9A83', '#D7A995', '#E0B9A8',
  // sol de l'Ouvrage — cendre violacée, inscrite dans la fiche le 27/08 au soir.
  // Ces cinq tons ont EXACTEMENT la clarté des cinq ci-dessus, rang par rang :
  // c'est ce qui empêche un camp de camoufler mieux que l'autre chez lui.
  '#8E88A4', '#9B95AE', '#A8A3B9', '#B5B1C2', '#C2BFCC',
  // ardoise — l'Ouvrage
  '#0D0B12', '#231D2E', '#382E47', '#4E4160', '#6B5B80',
  // accents de terrain
  '#9FB3C5', '#C1CEDA', '#1F5160', '#5B4133',
  // métal
  '#1E2124', '#3E454C', '#68727E',
  // accents fonctionnels
  '#928E80', '#F5F3E8', '#8A1E17', '#E43E32', '#A67018', '#F5B636',
];

/** Retire commentaires de ligne, de bloc et HTML avant un balayage de code. */
function sansCommentaires(texte) {
  return texte
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

/** Tous les fichiers .js sous un dossier, récursivement. */
function fichiersJs(dossier) {
  return readdirSync(join(RACINE, dossier), { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.js'))
    .map((e) => join(e.parentPath, e.name));
}

// ---------------------------------------------------------------------------
// Préréglages et montage du banc
// ---------------------------------------------------------------------------

test('banc — les trois profils passent creerCombat sur des sites variés', () => {
  assert.deepEqual(Object.keys(PREREGLAGES), ['infanterie', 'blindeLourd', 'mixte']);
  assert.deepEqual(Object.keys(PROFILS_ASSAUT), ['infanterie', 'blindeLourd', 'mixte']);
  for (const assaut of Object.keys(PROFILS_ASSAUT)) {
    for (const [type, niveau, saveur] of [
      ['camp', 5, 'richeQuartz'], ['avantPoste', 30, 'richeScorie'], ['base', 50, null],
    ]) {
      const montage = montageDuBanc({ type, niveau, saveur, graine: 3, assaut });
      assert.doesNotThrow(() => creerCombat(montage), `${assaut} sur ${type} ${niveau}`);
      // ⚠ SEUIL RÉÉCRIT AU LOT 4B. Les préréglages figés portaient toujours 3 ou
      // 4 vagues ; un assaut budgété en porte de 1 à 4 selon ce que le budget
      // permet — une seule vague au niveau 5, où 45 points n'achètent que neuf
      // Fusiliers. Ce que le test doit tenir est le PLAFOND, pas un plancher
      // arbitraire : au plus 4 vagues, au plus 9 par vague.
      assert.ok(montage.vagues.length >= 1 && montage.vagues.length <= EMPLACEMENTS_ASSAUT.vagues,
        `${assaut} sur ${type} ${niveau} : ${montage.vagues.length} vagues`);
      for (const vague of montage.vagues) {
        assert.ok(vague.length >= 1 && vague.length <= EMPLACEMENTS_ASSAUT.parVague);
      }
      // Et le budget est tenu, ce qu'aucun préréglage ne garantissait.
      assert.ok(montage.assaut.pointsEngages <= montage.assaut.budgetPoints);
    }
  }
  assert.throws(
    () => montageDuBanc({ type: 'camp', niveau: 5, saveur: null, graine: 1, assaut: 'horde' }),
    /profil d'assaut inconnu/,
  );
  // Le témoin historique du lot 3A vit hors de `src/` et refuse le même nom
  // inconnu — c'est lui qui porte encore le mot « préréglage ».
  assert.throws(
    () => montagePreregle({ type: 'camp', niveau: 5, saveur: null, graine: 1, assaut: 'horde' }),
    /préréglage d'assaut inconnu/,
  );
});

// ---------------------------------------------------------------------------
// T8 — rejouabilité
// ---------------------------------------------------------------------------

test('T8 — mêmes paramètres, même graine : exactement le même raid', () => {
  const parametres = { type: 'avantPoste', niveau: 15, saveur: 'richeQuartz', graine: 42, assaut: 'mixte' };
  const a = executerRaidComplet(parametres);
  const b = executerRaidComplet(parametres);
  // Même nombre de ticks, même cause de fin, même butin, mêmes points de
  // recherche — les quatre chiffres du panneau de fin, à l'identique.
  assert.equal(a.nbTicks, b.nbTicks);
  assert.equal(a.cause, b.cause);
  assert.deepEqual(a.butin, b.butin);
  assert.equal(a.pointsRechercheMilli, b.pointsRechercheMilli);
  assert.ok(CAUSES.includes(a.cause));
  assert.ok(a.nbTicks > 0 && a.nbTicks <= 900);
  // Et l'état final entier, entité par entité — pas seulement les totaux.
  assert.deepEqual(a.resultat, b.resultat);

  // La vitesse ne change RIEN au résultat : elle divise l'intervalle réel
  // entre deux ticks, pas la simulation. Un raid à ×4 rend le même état final.
  const rapide = executerRaidComplet(parametres, { vitesse: 4 });
  assert.deepEqual(rapide.resultat, a.resultat);

  // Une autre graine rend un autre site, donc (presque sûrement) un autre
  // déroulé — vérifié sur cinq graines : au moins deux résultats distincts.
  const empreintes = new Set([1, 2, 3, 4, 5].map((graine) => JSON.stringify(
    executerRaidComplet({ ...parametres, graine }).butin,
  )));
  assert.ok(empreintes.size > 1, 'cinq graines ne devraient pas rendre cinq butins identiques');
});

// ---------------------------------------------------------------------------
// Registres de noms et formats du panneau
// ---------------------------------------------------------------------------

test('banc — deux jeux de noms, jamais mélangés, et des causes toutes libellées', () => {
  // ⚠ LA CLÉ EST LE PROPRIÉTAIRE, PAS LE CAMP — changement du 25/08/2026. Le
  // camp désigne un côté de la grille, le propriétaire désigne à qui c'est. Les
  // deux se confondaient tant que seul l'Ouvrage défendait ; le jour où le
  // joueur garnit sa base, ses unités passent camp « defense » sans changer de
  // propriétaire, et c'est le propriétaire qui doit décider du nom.
  //
  // Le CROISEMENT est ce qui prouve le changement de clé : la même ligne de
  // données rend les quatre combinaisons, et un seul des quatre suffirait à
  // passer avec l'ancienne implémentation.
  const u = (camp, proprietaire, id) => nomAffiche({ genre: 'unite', camp, proprietaire, id });
  assert.equal(u('attaque', 'joueur', 'meute'), 'Fusiliers');
  assert.equal(u('defense', 'ouvrage', 'meute'), 'Meute');
  assert.equal(u('defense', 'joueur', 'meute'), 'Fusiliers', 'le joueur garnit sa propre base');
  assert.equal(u('attaque', 'ouvrage', 'meute'), 'Meute', 'l\'Ouvrage attaque le joueur');
  assert.equal(u('attaque', 'joueur', 'broyeur'), 'Percheron');

  // Les DÉFENSES ont deux noms depuis le 25/08 : neuf couples, tous distincts.
  const d = (proprietaire, id) => nomAffiche({ genre: 'defense', camp: 'defense', proprietaire, id });
  assert.equal(d('ouvrage', 'casemate'), 'Casemate');
  assert.equal(d('joueur', 'casemate'), 'Tourelle mitrailleuse');
  assert.equal(d('ouvrage', 'harpon'), 'Harpon');
  assert.equal(d('joueur', 'harpon'), 'SAM');
  for (const id of Object.keys(DEFENSES)) {
    assert.ok(Object.prototype.hasOwnProperty.call(DEFENSES[id].nom, 'ouvrage'), `${id}.nom.ouvrage`);
    assert.ok(Object.prototype.hasOwnProperty.call(DEFENSES[id].nom, 'joueur'), `${id}.nom.joueur`);
  }
  const cotes = Object.values(DEFENSES).map((x) => x.nom.joueur);
  assert.equal(new Set(cotes).size, cotes.length, 'les neuf noms joueur sont distincts');

  // Un bâtiment n'a qu'un nom : une Souche est une Souche des deux côtés.
  assert.equal(nomAffiche({ genre: 'batiment', camp: 'defense', proprietaire: 'ouvrage', id: 'souche' }), 'Souche');
  assert.equal(nomAffiche({ genre: 'batiment', camp: 'defense', proprietaire: 'joueur', id: 'souche' }), 'Souche');

  // Chaque cause du moteur a son libellé de panneau — aucune fin muette.
  for (const cause of CAUSES) {
    assert.equal(typeof LIBELLES_CAUSE[cause], 'string', `cause « ${cause} » sans libellé`);
  }

  // Les milli-points BigInt se formatent sans jamais passer par Number :
  // 12 345 milli-points → « 12,345 » ; 999 → « 0,999 » ; et un nombre
  // au-delà de l'entier sûr reste exact — 2^60 = 1152921504606846976 milli
  // → « 1152921504606846,976 ».
  assert.equal(formaterPointsMilli(12_345n), '12,345');
  assert.equal(formaterPointsMilli(999n), '0,999');
  assert.equal(formaterPointsMilli(2n ** 60n), '1152921504606846,976');

  // Les PV s'affichent à la même précision en courant et en maximum — deux
  // arrondis différents feraient croire à des PV au-dessus du plafond.
  // 2 897 400 milli-PV → « 2897,4 » ; 499 → « 0,4 » (plancher, pas d'arrondi
  // au supérieur qui ressusciterait un mourant à l'écran).
  assert.equal(formaterPv(2_897_400), '2897,4');
  assert.equal(formaterPv(499), '0,4');
  assert.equal(formaterPv(100_000), '100,0');
});

// ---------------------------------------------------------------------------
// §11 — balayages de la relecture
// ---------------------------------------------------------------------------

test('§11 — aucun Math.random nulle part dans src/, DOM confiné à ui/', () => {
  const fichiers = [
    ...fichiersJs('src'),
    join(RACINE, 'src', 'index.src.html'),
  ];
  assert.ok(fichiers.length >= 15, `montage cassé : ${fichiers.length} fichiers balayés`);
  for (const fichier of fichiers) {
    const code = sansCommentaires(readFileSync(fichier, 'utf8'));
    // La graine est saisie ou dérivée de l'horloge au moment de fonder une
    // partie, JAMAIS tirée : le tirage du langage n'entre nulle part.
    assert.ok(!code.includes('Math.random'), `Math.random dans ${fichier}`);
  }
  // Le DOM est confiné : render/ n'y touche jamais, ni au chargement ni après.
  for (const fichier of fichiersJs('src/render')) {
    const code = sansCommentaires(readFileSync(fichier, 'utf8'));
    for (const interdit of ['document', 'window', 'requestAnimationFrame', 'devicePixelRatio']) {
      assert.ok(!code.includes(interdit), `${fichier} touche au DOM : ${interdit}`);
    }
  }
  assert.equal(DPR_MAX, 2, 'le buffer se plafonne à DPR 2');
});

// ---------------------------------------------------------------------------
// §11 retournée — l'horloge murale
// ---------------------------------------------------------------------------
//
// ⚠ CETTE GARDE A ÉTÉ RETOURNÉE AU LOT ÉCRAN-CHANTIER, ET VOICI POURQUOI.
// Elle interdisait `Date.now` dans TOUT `src/`, `index.src.html` compris. Or
// `charger(json, instantMs)` et `serialiser(etat, instantMs)` réclament
// l'instant présent depuis la v6 du format de sauvegarde, et personne n'avait
// le droit de le leur donner : le rattrapage hors ligne — écrit, testé, livré
// au lot HORLOGE-MURALE — ne servait donc à rien, faute d'écran pour l'appeler.
//
// `CLAUDE.md` §6 décrivait d'avance la forme à lui donner, et c'est celle-ci :
// interdiction TOTALE sur `src/sim/`, `src/data/` et `src/render/`, et
// EXACTEMENT UNE occurrence admise dans un fichier NOMMÉ ici.
//
// ⚠ LE COMPTE EST ASSERTÉ, PAS BORNÉ. « Au plus une » laisserait passer zéro,
// c'est-à-dire la disparition silencieuse du seul point d'entrée du temps réel
// — et le jeu recommencerait à afficher les stocks d'hier soir sans qu'un seul
// test tombe. Le verdict est isolé dans `fautesDHorloge` pour qu'on puisse le
// FALSIFIER : on lui donne des comptes fabriqués, et on vérifie qu'il refuse
// zéro aussi bien que deux.

/**
 * LE fichier porteur : le seul de `src/` qui ait le droit de lire l'heure du
 * système, et il n'y a droit qu'une fois.
 */
const PORTEUR_HORLOGE = join('src', 'ui', 'session.js');

/**
 * Les deux façons d'obtenir l'heure murale SANS écrire le nom que la garde
 * cherche. Interdites partout, porteur compris : s'en servir serait passer
 * sous le garde-fou en silence, ce qui coûte plus cher que la contrainte qu'il
 * pose. Même raisonnement que les hex à trois et à huit chiffres de la garde
 * de palette (CLAUDE.md §6).
 */
const CONTOURNEMENTS = [
  { motif: /new\s+Date\b/, nom: 'new Date' },
  { motif: /performance\s*\.\s*timeOrigin/, nom: 'performance.timeOrigin' },
];

/** Combien de fois ce code (déjà décommenté) lit l'horloge du langage. */
function compterHorloge(code) {
  return (code.match(/Date\s*\.\s*now/g) ?? []).length;
}

/**
 * Le verdict de la garde, séparé de la mesure pour être falsifiable.
 * @param {Record<string, number>} comptes fichier → occurrences
 * @param {string} porteur le seul fichier qui ait droit à une occurrence
 * @returns {string[]} les fautes, liste vide si tout va bien
 */
function fautesDHorloge(comptes, porteur) {
  const fautes = [];
  if (comptes[porteur] === undefined) {
    fautes.push(`${porteur} : le fichier porteur n'a pas été balayé`);
  }
  for (const [fichier, n] of Object.entries(comptes)) {
    const attendu = fichier === porteur ? 1 : 0;
    if (n !== attendu) {
      fautes.push(`${fichier} : ${n} lecture(s) de l'horloge murale, ${attendu} attendue(s)`);
    }
  }
  return fautes;
}

test('§11 — l\'horloge murale entre par UN fichier nommé, exactement une fois', () => {
  // --- 1. interdiction totale là où vit la simulation ---------------------
  // ⚠ `src/son` EST ENTRÉ DANS L'INTERDICTION TOTALE AU LOT SON-MOTEUR, 04/09.
  // `src/son/politique.js` reçoit l'instant en ARGUMENT : c'est ce qui rend les
  // temps de garde éprouvables dans Node, où il n'y a pas de Web Audio. Un
  // `Date.now()` réintroduit là-bas les rendrait intestables, et il n'y aurait
  // plus qu'à croire le code sur parole — c'est la falsification n° 9 du brief,
  // et c'est cette ligne-ci qui la fait mordre.
  // ⚠⚠ LE PLANCHER DE MONTAGE EST UN TOTAL, PAS UN COMPTE PAR DOSSIER — lot
  // SON-MOTEUR, 04/09. Il valait « au moins quatre fichiers par dossier », ce
  // que `src/son/` viole sans rien avoir de faux : il ne porte que la politique
  // de voix. Le plancher garde contre UN cas — un dossier vide rendrait la
  // boucle vacueuse —, et un total le ferme mieux : si `fichiersJs` cessait de
  // lire, les QUATRE dossiers tomberaient d'un coup, ce qu'un plancher de
  // quatre par dossier ne verrait pas mieux. Il s'est resserré en changeant de
  // forme, il ne s'est pas assoupli.
  let balayes = 0;
  for (const dossier of ['src/sim', 'src/data', 'src/render', 'src/son']) {
    const fichiers = fichiersJs(dossier);
    assert.ok(fichiers.length >= 1, `montage cassé : ${dossier}/ est vide`);
    balayes += fichiers.length;
    for (const fichier of fichiers) {
      assert.equal(
        compterHorloge(sansCommentaires(readFileSync(fichier, 'utf8'))), 0,
        `horloge murale dans ${fichier} — la simulation reçoit le temps, elle ne va pas le chercher`,
      );
    }
  }

  assert.ok(balayes >= 45, `montage cassé : ${balayes} fichiers balayés en tout`);

  // --- 2. exactement une, dans le porteur ---------------------------------
  const comptes = {};
  for (const fichier of [...fichiersJs('src/ui'), join(RACINE, 'src', 'index.src.html')]) {
    comptes[relative(RACINE, fichier)] = compterHorloge(
      sansCommentaires(readFileSync(fichier, 'utf8')),
    );
  }
  assert.ok(Object.keys(comptes).length >= 5, `montage cassé : ${Object.keys(comptes).length} fichiers balayés`);
  assert.deepEqual(fautesDHorloge(comptes, PORTEUR_HORLOGE), []);

  // --- 3. falsification du verdict, dans les deux sens --------------------
  // Zéro doit tomber : c'est la disparition du point d'entrée du temps réel.
  assert.ok(
    fautesDHorloge({ ...comptes, [PORTEUR_HORLOGE]: 0 }, PORTEUR_HORLOGE).length > 0,
    'zéro occurrence dans le porteur devrait être refusé',
  );
  // Deux doivent tomber : une seconde lecture est un second point d'entrée.
  assert.ok(
    fautesDHorloge({ ...comptes, [PORTEUR_HORLOGE]: 2 }, PORTEUR_HORLOGE).length > 0,
    'deux occurrences dans le porteur devraient être refusées',
  );
  // Et une occurrence AILLEURS aussi, même si le porteur reste juste.
  assert.ok(
    fautesDHorloge({ ...comptes, [join('src', 'ui', 'banc.js')]: 1 }, PORTEUR_HORLOGE).length > 0,
    'une occurrence hors du porteur devrait être refusée',
  );
  // Et un balayage qui ne voit même pas le porteur ne prouve rien.
  assert.ok(fautesDHorloge({}, PORTEUR_HORLOGE).length > 0, 'un balayage vide devrait être refusé');

  // --- 4. le compteur compte réellement -----------------------------------
  // Assemblé à l'exécution : écrit d'une pièce, il serait lui-même une
  // occurrence dans un fichier que ce test finira peut-être par balayer.
  const nom = 'Date';
  assert.equal(compterHorloge('const a = 1;'), 0);
  assert.equal(compterHorloge(`${nom}.now();`), 1);
  assert.equal(compterHorloge(`${nom}.now(); ${nom} . now();`), 2);

  // --- 5. les contournements sont refusés partout, porteur compris --------
  for (const fichier of [...fichiersJs('src'), join(RACINE, 'src', 'index.src.html')]) {
    const code = sansCommentaires(readFileSync(fichier, 'utf8'));
    for (const { motif, nom: quoi } of CONTOURNEMENTS) {
      assert.ok(!motif.test(code), `${fichier} contourne la garde par ${quoi}`);
    }
  }
  // Falsifiable : les motifs doivent attraper de vrais appâts.
  for (const { motif, nom: quoi } of CONTOURNEMENTS) {
    const appat = quoi === 'new Date' ? 'const t = new Date().getTime();' : 'const t = performance.timeOrigin;';
    assert.ok(motif.test(appat), `le motif de ${quoi} n'attrape même pas un appât`);
  }
});

test('§11 — aucune teinte hors de la palette de FICHE-STYLE.md', () => {
  // La palette de la fiche, transcrite ici indépendamment de scene.js pour
  // que le test ne valide pas le module avec lui-même.
  //
  // ⚠ TRENTE-TROIS TEINTES DEPUIS LA v4 DE `FICHE-STYLE.md` (27/08). La liste en
  // portait quatorze, et elle n'a PAS été élargie pour faire passer un lot :
  // la fiche a gagné trois rampes complètes — le sol du joueur, l'ardoise de
  // l'Ouvrage, les accents de terrain — et cette liste n'était plus une
  // transcription, mais une transcription périmée. Le test suivant l'asserte
  // contre le document, dans les deux sens, pour que ça ne se reproduise pas.
  const FICHE = new Set(PALETTE_FICHE.map((h) => h.toUpperCase()));
  const fichiers = [
    ...fichiersJs('src/render'),
    ...fichiersJs('src/ui'),
    join(RACINE, 'src', 'index.src.html'),
  ];
  let trouvees = 0;
  for (const fichier of fichiers) {
    const texte = readFileSync(fichier, 'utf8');
    for (const [hex] of texte.matchAll(/#[0-9A-Fa-f]{6}(?![0-9A-Za-z])/g)) {
      trouvees += 1;
      assert.ok(FICHE.has(hex.toUpperCase()), `teinte hors fiche dans ${fichier} : ${hex}`);
    }
    // La seule valeur non-hex admise est l'ombre portée de la fiche.
    for (const [rgba] of texte.matchAll(/rgba?\([^)]*\)/g)) {
      assert.equal(rgba, 'rgba(0,0,0,0.31)', `rgba hors fiche dans ${fichier} : ${rgba}`);
    }
  }
  // Le balayage doit avoir réellement vu des couleurs, sinon il ne prouve rien.
  assert.ok(trouvees > 30, `seulement ${trouvees} teintes balayées`);

  // ⚠ LES DEUX ÉCHAPPATOIRES DE LA GARDE, REFUSÉES DE FACE. Le motif ci-dessus
  // est `#[0-9A-Fa-f]{6}(?![0-9A-Za-z])` : un hex à TROIS chiffres (`#000`) et
  // un hex à HUIT (`#F5F3E80D`, un alpha) passent tous les deux au travers.
  // `CLAUDE.md` §6 les documente comme interdites d'usage depuis le 27/08 et
  // `tools/audit-maquette.mjs` les refuse déjà pour la maquette — mais rien ne
  // les refusait pour le CODE LIVRÉ, qui est pourtant le seul que le joueur
  // verra. L'asymétrie tombe ici. Contourner un garde-fou en silence coûte plus
  // cher que la contrainte qu'il pose.
  const RACCOURCIS = [
    { motif: /#[0-9A-Fa-f]{3}(?![0-9A-Fa-f])/, quoi: 'hex à trois chiffres' },
    { motif: /#[0-9A-Fa-f]{8}(?![0-9A-Fa-f])/, quoi: 'hex à huit chiffres' },
  ];
  for (const fichier of fichiers) {
    const texte = readFileSync(fichier, 'utf8');
    for (const { motif, quoi } of RACCOURCIS) {
      const trouve = texte.match(motif);
      assert.equal(trouve, null, `${quoi} dans ${fichier} : ${trouve?.[0]} — invisible à la garde`);
    }
  }
  // Falsifiable : les motifs doivent attraper de vrais appâts, et laisser
  // passer les six chiffres légitimes qui sont partout dans ces fichiers.
  assert.ok(RACCOURCIS[0].motif.test('color: #000;'), 'le motif à trois chiffres n\'attrape rien');
  assert.ok(RACCOURCIS[1].motif.test('color: #F5F3E80D;'), 'le motif à huit chiffres n\'attrape rien');
  assert.equal('color: #161914;'.match(RACCOURCIS[0].motif), null, 'un hex à six chiffres est refusé à tort');
  assert.equal('color: #161914;'.match(RACCOURCIS[1].motif), null, 'un hex à six chiffres est refusé à tort');
});

test('§11 — la palette transcrite ici EST celle de FICHE-STYLE.md', () => {
  // ⚠ POURQUOI CE TEST EXISTE. La liste ci-dessus se disait « transcrite » et
  // ne l'était plus : `FICHE-STYLE.md` est passé en v4 le 27/08 avec trois
  // rampes de plus, et la garde a continué de refuser quatorze teintes
  // parfaitement légitimes. Elle serait restée verte indéfiniment — elle ne
  // regarde que du code qui n'emploie pas encore ces teintes.
  //
  // Une transcription qui ne se confronte pas à sa source n'est pas une
  // transcription, c'est une copie qui vieillit. On garde la liste ÉCRITE —
  // pour qu'un ajout de teinte se voie en relecture, et pour qu'une faute de
  // frappe dans la fiche n'autorise pas une couleur en silence — et on exige
  // qu'elle soit égale au document.
  const doc = readFileSync(join(RACINE, 'FICHE-STYLE.md'), 'utf8');
  const dansLaFiche = [...new Set(
    [...doc.matchAll(/#[0-9A-Fa-f]{6}(?![0-9A-Za-z])/g)].map((m) => m[0].toUpperCase()),
  )];

  // Falsifiable des deux côtés : deux listes vides seraient égales.
  assert.ok(dansLaFiche.length >= 20, `${dansLaFiche.length} teintes lues dans FICHE-STYLE.md`);
  assert.ok(PALETTE_FICHE.length >= 20, `${PALETTE_FICHE.length} teintes transcrites`);
  assert.equal(
    new Set(PALETTE_FICHE).size, PALETTE_FICHE.length,
    'la transcription porte deux fois la même teinte',
  );

  assert.deepEqual(
    [...PALETTE_FICHE].map((h) => h.toUpperCase()).sort(), [...dansLaFiche].sort(),
    'la palette transcrite dans ce fichier et celle de FICHE-STYLE.md ont divergé — '
      + 'la fiche fait autorité sur le style, c\'est la transcription qu\'il faut reprendre',
  );
});

// ---------------------------------------------------------------------------
// T10 — le build reste hors ligne
// ---------------------------------------------------------------------------

test('T10 — npm run build passe et le HTML produit ne référence rien d\'extérieur', () => {
  // La garde de tools/build.js sort en erreur sur toute référence externe :
  // un code de sortie 0 est déjà une preuve. On refait le contrôle ici,
  // indépendamment, sur le fichier produit.
  execFileSync('node', [join(RACINE, 'tools', 'build.js')], { stdio: 'pipe' });
  const chemin = join(RACINE, 'dist', 'index.html');
  const html = readFileSync(chemin, 'utf8');

  // ⚠⚠ UNE SEULE URL EST TOLÉRÉE, ET CE N'EST PAS UNE RÉFÉRENCE. L'espace de
  // noms XML du SVG est l'argument obligatoire de `createElementNS` — un
  // IDENTIFIANT, jamais une adresse : rien n'est téléchargé depuis là. Il entre
  // au lot du 29/08 avec le calque des traits de voisinage. La garde le retire
  // à l'identique et refuse tout le reste ; elle n'autorise PAS `w3.org`.
  const NAMESPACE_SVG = 'http://www.w3.org/2000/svg';
  const horsNamespace = html.split(NAMESPACE_SVG).join('');
  assert.ok(!/https?:\/\//i.test(horsNamespace), 'URL réseau dans le HTML final');
  // Falsifiable : la garde doit toujours attraper une vraie adresse, et même
  // une autre adresse du MÊME domaine — l'exception porte sur une chaîne, pas
  // sur un hôte.
  for (const appat of ['https://cdn.example.com/a.js', 'http://www.w3.org/1999/xhtml']) {
    assert.ok(/https?:\/\//i.test(`${appat}`.split(NAMESPACE_SVG).join('')),
      `la garde laisserait passer ${appat}`);
  }
  for (const [, valeur] of html.matchAll(/<[^>]+\b(?:src|href)\s*=\s*["']([^"']*)["']/gi)) {
    assert.ok(valeur.startsWith('data:') || valeur.startsWith('#'),
      `ressource externe : ${valeur}`);
  }
  // Le banc y est réellement embarqué : ses contrôles et son canvas.
  for (const attendu of ['banc-canvas', 'banc-graine', 'banc-lancer', 'banc-pas']) {
    assert.ok(html.includes(attendu), `élément « ${attendu} » absent du HTML final`);
  }
  // ⚠ CE QUE CETTE BORNE GARDE, ET CE QU'ELLE NE GARDE PAS. Elle ne dit RIEN
  // d'un budget : ce que T10 tient vraiment, c'est l'assertion du dessus — le
  // HTML ne référence rien d'extérieur —, et celle-là ne bouge pas. La taille
  // n'est qu'un ordre de grandeur, là pour attraper une explosion : un bundle
  // parti en boucle, une image dupliquée cent fois, un `data:` qui entre deux
  // fois. Elle se RELÈVE quand une ressource entre légitimement, et le lot le
  // dit ; elle ne se relève jamais pour faire passer un lot qui déborde sans
  // raison.
  //
  // ⚠ ELLE EST PASSÉE DE 200 000 À 600 000 AU LOT ÉCRAN-CARTE. L'atlas de
  // terrain — 64 tuiles, 224 548 octets — entre en base64 dans le HTML, soit
  // environ 299 000 octets à lui seul. C'est la première ressource binaire du
  // livrable, et c'est le prix de l'offline : une image inlinée pèse un tiers
  // de plus qu'un fichier, et un fichier à côté serait une référence externe.
  // Mesuré au lot : 503 724 octets, dont 299 400 pour l'atlas.
  //
  // ⚠ RELEVÉE À 700 000 AU LOT RUINES, le 30/08. L'atlas de bâtiment passe de
  // 16 à 34 sprites — les seize états détruits et les deux ruines rejoignent
  // les seize intacts —, sa grille de 4×4 à 6×6, et son poids inliné de 27 000
  // à 57 489 octets. Mesuré après le lot : 608 040 octets. La marge restante
  // est d'environ 90 000 octets, soit un atlas de plus de la taille de celui
  // des bâtiments : la prochaine famille cousue la fera reculer à nouveau, et
  // ce sera à dire dans son lot.
  //
  // ⚠ RELEVÉE À 900 000 AU LOT BRANCHEMENT-DÉFENSE, le 30/08. Deux familles de
  // plus entrent en `data:` — `defense`, 204 sprites en 15 × 14, la grille la
  // plus dense du dépôt, et `socle`, 36 en 6 × 6 —, soit **243 364 octets de
  // base64** mesurés par `tools/atlas.py`. Mesuré après le lot :
  // **859 646 octets**, et la marge restante n'est que de 40 354, soit 4,5 %.
  //
  // ⚠ LA MARGE EST MAINTENANT TROP MINCE POUR UNE FAMILLE DE PLUS. Les trois
  // qui restent non cousues — unite, tourelle-unite, carte — pèsent bien
  // au-delà. Le prochain lot qui en fait entrer une DEVRA relever la borne en
  // écrivant pourquoi, jamais rogner un atlas pour passer dessous (CLAUDE.md
  // §5). Une piste mesurée si le poids devient un problème : découper les atlas
  // par CAMP en plus de la famille épargnerait 80 068 octets à ce lot-ci — mais
  // c'est un second axe dans l'index pour un écran de raid qui n'existe pas
  // encore, et c'est un arbitrage d'Ethan, pas une optimisation à prendre seul.
  //
  // ⚠ RELEVÉE À 1 150 000 AU LOT UNITÉS-AU-COMBAT, le 30/08. Les trois dernières
  // familles entrent en `data:` — `unite` (36 sprites, 66 861 o), `chassis`
  // (10, 20 429 o) et `tourelle-unite` (80, 120 774 o), soit **208 064 octets de
  // base64** mesurés par `tools/atlas.py`. Mesuré après le lot :
  // **1 073 238 octets**, marge 76 762, soit 6,7 %.
  //
  // ⚠⚠ RELEVÉE À 1 300 000 AU LOT CARTE-EMBLÈMES, le 30/08, ET LA PRÉCÉDENTE
  // LIGNE ANNONÇAIT DÉJÀ CETTE HAUSSE : « la prochaine ne viendra plus d'un
  // atlas d'unité mais de `carte` et d'`effet` ». C'est `carte` qui entre.
  // Trois ressources, mesurées par `tools/atlas.py` et par le disque :
  //   • l'atlas `carte`, 43 sprites en 7 × 7 — 86 554 o, **115 405 en base64** ;
  //   • `base_o_2x2`, 128 × 128, hors atlas — 11 351 o, **15 134 en base64** ;
  //   • `base_o_3x3`, 192 × 192, hors atlas — 16 428 o, **21 904 en base64**.
  // Soit **152 443 octets** d'images, plus le code qui les pose. Mesuré après le
  // lot : **1 229 274 octets**, marge 70 726, soit 5,4 %.
  //
  // ⚠ LES DEUX GROSSES BASES SONT HORS ATLAS PARCE QU'ELLES NE SONT PAS CARRÉES
  // À LA TAILLE DE CASE — 2 × 2 et 3 × 3 cases —, et `tools/atlas.py` les exclut
  // nommément EN ASSERTANT qu'elles ne le sont pas. Elles pèsent 37 038 octets
  // pour un pré-branchement que rien ne dessine encore ; c'est écrit au rapport
  // du lot, avec ce que ça achète et ce que ça coûte.
  //
  // ⚠ IL NE RESTE QU'`effet`, qui attend un événement de mort que le moteur ne
  // publie pas. Elle sera la dernière hausse de cette série, et elle devra dire
  // pourquoi, comme les quatre précédentes. **On ne rogne jamais un atlas pour
  // passer sous la borne** (CLAUDE.md §5) : c'est la borne qui monte, et le lot
  // qui l'écrit.
  //
  // ⚠⚠ RELEVÉE À 1 400 000 AU LOT MUR-DE-CONTOUR, le 31/08, ET LA HAUSSE NE
  // VIENT PAS D'UN ATLAS. Le mur du pourtour de la base entre en CINQ IMAGES
  // séparées, parce qu'il ne tient pas dans une case : 512 × 64 pour un mur,
  // 64 × 64 pour un angle, quand `tools/atlas.py` n'accepte que des cellules
  // carrées d'un même côté. Mesuré sur le disque, camp du joueur seul —
  //   • `bord_j_mur_h_a`, 512 × 64 — 10 250 o, **13 668 en base64** ;
  //   • `bord_j_mur_v_a` et `_v_b`, 64 × 512 — 24 969 o, **33 292** ;
  //   • `bord_j_angle_no` et `_ne`, 64 × 64 — 4 429 o, **5 904**.
  // Soit **52 864 octets** d'images. Mesuré après le lot : **1 333 691 octets**,
  // marge 66 309, soit 4,7 %.
  //
  // ⚠⚠ ET LA RÉSOLUTION EST UN ARBITRAGE D'ETHAN, PAS UN CHOIX DE CONFORT. Le
  // même mur conditionné à 64 × 64 comme un sprite de case pesait 3 792 octets
  // en tout — quatorze fois moins — et il l'a refusé de face : « mais c'est quoi
  // cette chiasse de pixel. divise par deux l'asset original. et garde la
  // colorisation. le mur fera 512x64. » Le prix est écrit ici pour qu'on sache
  // ce qu'on a acheté.
  //
  // ⚠ LES CINQ IMAGES DE L'OUVRAGE SONT PRODUITES ET N'ENTRENT PAS, et c'est
  // l'économie que des fichiers séparés rendent possible : 27 000 octets de plus
  // pour zéro pixel, un atlas ayant été tout ou rien. Elles entreront avec
  // l'écran de raid.
  //
  // ⚠⚠ RELEVÉE À 1 650 000 AU LOT PIXELS, LE 02/09, ET LA HAUSSE EST LA MATIÈRE
  // ELLE-MÊME. La chaîne ne quantifie plus les sprites sur quatorze teintes :
  // elle réduit la source par filtre, donc chaque sprite porte quelques
  // milliers de couleurs au lieu de quatorze. Mesuré, les huit atlas cousus :
  //   • en PNG, rendu palette — 478 793 o, **638 390 en base64** (la veille) ;
  //   • en PNG, rendu libre — 1 668 951 o : ×3,5, hors de question ;
  //   • en **WebP q85**, rendu libre — 561 240 o, **748 320 en base64**.
  // C'est le WebP qui rend le protocole tenable, pas le protocole seul. Les
  // deux grosses bases de l'Ouvrage, elles, restent des PNG hors atlas et
  // passent de 27 779 à 90 047 octets — 120 062 en base64 — pour la même
  // raison, sans le remède : un atlas d'un seul sprite ne coud rien.
  //
  // Mesuré après le lot : **1 581 919 octets**, marge 68 081, soit 4,1 %.
  //
  // ⚠⚠ ET ELLE NE BOUGE PAS AU LOT MURS-OUVRAGE, ALORS QUE SIX IMAGES ENTRENT.
  // Ethan, 03/09 : « c'est pour le joueur et pour l'ouvrage ». Les six pièces de
  // l'anneau de l'Ouvrage entrent au livrable pour l'écran de raid — mesuré,
  // poste par poste :
  //   • six `.webp` de `bord/`, 15 436 o sur le disque, **+20 592 en base64** ;
  //   • le module de géométrie, le balisage et le câblage — **+1 519 octets**.
  // Total **+22 111**, mesuré : **3 250 476**, marge 149 524, soit 4,4 %. Le
  // livrable passe de 18 `data:` à 24.
  //
  // ⚠ SIX, PAS HUIT — ET LE RAPPORT DU LOT MURS ANNONÇAIT HUIT. Il chiffrait
  // « +24 010 octets de WebP, soit +32 016 en base64 », qui est le poids des
  // QUATRE murs et des quatre blocs produits pour ce camp. L'anneau n'en pose
  // que six : le U d'une base de neuf colonnes n'a que DEUX créneaux de mur,
  // donc `mur_3` et `mur_4` restent au dépôt sans entrer. L'estimation était
  // haute d'un tiers, et c'est la mesure qui fait foi.
  //
  // ⚠⚠ ET ELLE NE BOUGE PAS NON PLUS AU LOT TERRITOIRE, ALORS QU'UN ATLAS
  // ENTIER ENTRE. Ethan, 03/09 : « je t'ai envoyé aussi un zip avec des
  // bordures de territoire pour la carte du monde ». La frontière était un
  // trait au `strokeStyle` depuis le 31/08 ; elle devient un dessin. Mesuré,
  // poste par poste :
  //   • `atlas-limite-128.webp`, 26 cellules — 19 178 o sur le disque,
  //     **+25 572 en base64** ;
  //   • `render/limite.js`, la balise et le câblage — **+1 104 octets**.
  // Total **+26 676**, mesuré : **3 277 152**, marge 122 848, soit 3,6 %. Le
  // livrable passe de 24 `data:` à 25.
  //
  // ⚠ VINGT-SIX CELLULES POUR DIX-NEUF KILO-OCTETS : un dessin de limite est
  // presque tout transparent, et le WebP le sait. C'est le premier atlas du
  // dépôt dont le poids ne se discute pas.
  //
  // ⚠ ON NE ROGNE JAMAIS POUR PASSER SOUS LA BORNE (CLAUDE.md §5) : c'est la
  // borne qui monte, et le lot qui écrit pourquoi. Ce qu'elle tient VRAIMENT
  // reste l'assertion du dessus — le HTML ne référence rien d'extérieur —, et
  // celle-ci n'est qu'un ordre de grandeur contre une explosion.
  //
  // ⚠⚠ RELEVÉE À 3 200 000 AU LOT GRILLE-128, LE 03/09, ET C'EST LA DÉFINITION
  // QUI ENTRE. Ethan : « il faut les mettre en 128 au sol, et les unités aussi ;
  // câbler en 128, je sais que la taille du jeu va dépasser mais tu t'en fous ».
  // Le jeu embarquait la grille 64 et l'agrandissait ; il embarque désormais la
  // 128, que `tools/atlas.py` cousait déjà depuis le lot PIXELS sans que
  // personne la lise. Mesuré, poste par poste :
  //   • les huit atlas — 561 240 → 1 407 414 o, soit **+1 128 232 en base64** ;
  //   • les deux grosses bases de l'Ouvrage, hors atlas parce qu'elles ne sont
  //     pas carrées à la case — 90 047 → 326 146 o, soit **+314 799** ;
  //   • l'atlas du FOND DE CARTE ne bouge pas : il est déjà en tuiles de 128,
  //     et son nom en `-64` désigne la cellule du sol de base, pas sa grille.
  // Total **+1 443 034 octets**, mesuré après le lot : **3 035 474**, marge
  // 164 526, soit 5,1 %.
  //
  // ⚠ CE QUE LE JOUEUR ACHÈTE POUR CE PRIX : au plafond du zoom, un pixel de
  // sprite valait DEUX pixels CSS, il en vaut UN. `ZOOM_BASE_MULTIPLE_MAX` passe
  // de 2 à 1 dans le même geste, si bien que la plage du zoom ne bouge pas.
  //
  // ⚠⚠ RELEVÉE À 3 400 000 AU LOT OFFENSE, LE MÊME JOUR, ET C'EST UNE IMAGE QUI
  // ENTRE — la dix-septième `data:` du livrable, la première depuis le lot
  // MUR-DE-CONTOUR. Ethan : « je t'ai envoyé un sprite pour combler le menu
  // armée ou offense ». L'écran des quatre vagues montrait du vide ; il montre
  // le bassin. Mesuré, poste par poste :
  //   • `fond/fond_offense.webp` — 164 578 o sur le disque, **+219 440 en
  //     base64** ; le même bassin en PNG optimisé pèse 2 099 998 o, soit
  //     **treize fois plus**, et c'est le WebP qui rend l'image payable ;
  //   • le balisage, la feuille et le quinconce — **+2 278 octets**.
  // Total **+221 718**, mesuré : **3 257 192**, marge 142 808, soit 4,2 %.
  //
  // ⚠⚠ ET ELLE NE BOUGE PAS AU LOT MURS-OUVRAGE, ALORS QUE SIX IMAGES ENTRENT.
  // Ethan, 03/09 : « c'est pour le joueur et pour l'ouvrage ». Les six pièces de
  // l'anneau de l'Ouvrage entrent au livrable pour l'écran de raid — mesuré,
  // poste par poste :
  //   • six `.webp` de `bord/`, 15 436 o sur le disque, **+20 592 en base64** ;
  //   • le module de géométrie, le balisage et le câblage — **+1 519 octets**.
  // Total **+22 111**, mesuré : **3 250 476**, marge 149 524, soit 4,4 %. Le
  // livrable passe de 18 `data:` à 24.
  //
  // ⚠ SIX, PAS HUIT — ET LE RAPPORT DU LOT MURS ANNONÇAIT HUIT. Il chiffrait
  // « +24 010 octets de WebP, soit +32 016 en base64 », qui est le poids des
  // QUATRE murs et des quatre blocs produits pour ce camp. L'anneau n'en pose
  // que six : le U d'une base de neuf colonnes n'a que DEUX créneaux de mur,
  // donc `mur_3` et `mur_4` restent au dépôt sans entrer. L'estimation était
  // haute d'un tiers, et c'est la mesure qui fait foi.
  //
  // ⚠⚠ ET ELLE NE BOUGE PAS NON PLUS AU LOT TERRITOIRE, ALORS QU'UN ATLAS
  // ENTIER ENTRE. Ethan, 03/09 : « je t'ai envoyé aussi un zip avec des
  // bordures de territoire pour la carte du monde ». La frontière était un
  // trait au `strokeStyle` depuis le 31/08 ; elle devient un dessin. Mesuré,
  // poste par poste :
  //   • `atlas-limite-128.webp`, 26 cellules — 19 178 o sur le disque,
  //     **+25 572 en base64** ;
  //   • `render/limite.js`, la balise et le câblage — **+1 104 octets**.
  // Total **+26 676**, mesuré : **3 277 152**, marge 122 848, soit 3,6 %. Le
  // livrable passe de 24 `data:` à 25.
  //
  // ⚠ VINGT-SIX CELLULES POUR DIX-NEUF KILO-OCTETS : un dessin de limite est
  // presque tout transparent, et le WebP le sait. C'est le premier atlas du
  // dépôt dont le poids ne se discute pas.
  //
  // ⚠⚠ ET ELLE PASSE DE 3 400 000 À 5 700 000 AU LOT MUR-PEINT, 03/09 — LE PLUS
  // GROS SAUT DEPUIS GRILLE-128. Ethan a fait peindre le mur de contour DANS le
  // fond de base, et livré huit décors de 1080 × 2160. Poste par poste :
  //   • les huit fonds, WebP q75 — 1 650 546 o sur le disque, **+2 200 728 en
  //     base64** ;
  //   • les DOUZE pièces de mur de `bord/` qui SORTENT — **−43 176 en base64** ;
  //   • code, balisage et feuille — le reste.
  // Mesuré : **5 516 056 octets**, soit **+2 154 705**. Le livrable passe de
  // 25 `data:` à 21 — huit décors entrent, douze murs sortent.
  //
  // ⚠⚠ LE q75 EST UN ARBITRAGE D'ETHAN, ET IL A ÉTÉ PRIS SUR MESURE. À q85 les
  // huit pesaient 2 720 514 o, soit 3 627 352 en base64 : le HTML passait à
  // 6 988 703 octets, **2,08 fois son poids d'avant**, et le brief du lot pose le
  // doublement comme une condition d'arrêt qui revient à Ethan. Les paliers lui
  // ont été soumis, mesurés sur les huit planches — q80 → 1,83× · q75 → 1,65× ·
  // q70 → 1,60×, contre 1,73× pour une réduction à 810 px. Réponse : q75, pleine
  // résolution. Confronté à 1:1 sur la zone la plus texturée des huit, q75 ne se
  // distingue pas de la source.
  //
  // ⚠ LA MARGE EST DE 184 099 OCTETS, 3,2 %. Elle est plus large qu'aux six
  // derniers lots, et c'est délibéré : ce lot fait entrer huit images d'un coup,
  // et une borne posée au ras du livrable ferait tomber la suite au premier
  // octet de code du lot suivant.
  //
  // ⚠ ON NE ROGNE JAMAIS POUR PASSER SOUS LA BORNE (CLAUDE.md §5) : c'est la
  // borne qui monte, et le lot qui écrit pourquoi.
  const octets = statSync(chemin).size;
  assert.ok(octets > 20_000 && octets < 5_700_000, `taille inattendue : ${octets} octets`);
});

// ---------------------------------------------------------------------------
// T16 — la page porte les éléments du mode Défense
// ---------------------------------------------------------------------------

test('T16 — le HTML produit porte le bloc Défense, sa palette et son sélecteur', () => {
  // ⚠ Le brief dit « étendre la boucle du T10 », mais il attend AUSSI un total
  // de 150 et « aucun des 148 tests d'avant retouché ». Les deux ne tiennent
  // qu'en écrivant un test à part : T10 reste intact, et le compte monte d'un.
  //
  // C'est peu de chose, et c'est exactement ce qui attrape un bloc oublié au
  // build — un `hidden` mal recopié, un id renommé d'un côté seulement, ou un
  // bout de page tombé du bundle. Le mode Défense est INVISIBLE tant qu'on ne
  // clique pas : rien d'autre ici ne le verrait manquer.
  const chemin = join(RACINE, 'dist', 'index.html');
  const html = readFileSync(chemin, 'utf8');
  for (const attendu of ['banc-defense', 'banc-defense-ouvrir', 'banc-palette-defense',
    'banc-compteur-defense', 'banc-sens']) {
    assert.ok(html.includes(attendu), `élément « ${attendu} » absent du HTML final`);
  }
  // Les deux sens du sélecteur, et `raid` par défaut : c'est la première
  // option qui gagne, faute de `selected`.
  const options = [...html.matchAll(/<option value="(raid|defense)"/g)].map((m) => m[1]);
  assert.deepEqual(options, ['raid', 'defense'], 'les deux sens, raid en premier');
});
