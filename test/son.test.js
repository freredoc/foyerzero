// Le moteur de son : la politique de voix, sa frontière avec l'adaptateur, et
// les gardes qui empêchent l'audio de toucher au chemin déterministe.
//
// ⚠⚠ CE QUE CE FICHIER PEUT MESURER, ET CE QU'IL NE PEUT PAS. Le dépôt n'a ni
// navigateur ni Web Audio (CLAUDE.md §3), donc rien ici ne fait de bruit. Ce
// qui est éprouvable, c'est la DÉCISION — et c'est exactement pourquoi elle vit
// dans un module à part, `src/son/politique.js`, qui reçoit l'instant en
// argument. Tout ce que la politique refuserait de dire, personne ne pourrait
// le vérifier.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SONS, EVENEMENTS, BUS, MEMOIRE, REGLAGES_PAR_DEFAUT, RAMPE_BOUCLE_MS,
  AMBIANCE_PAR_ECRAN, BOUCLES_DE_BATIMENT, EFFONDREMENT_PV, EXPLOSION_PV,
  IMPACT_LOURD_MILLIEMES, ROULEMENT_PAR_CHASSIS, MOTEUR_PAR_CHASSIS, ARCHETYPE_PAR_UNITE,
  PASSAGE_AERIEN, DEPLOIEMENT_PAR_PAIRE, ARME_PAR_PAIRE, ARME_PAR_DEFENSE,
} from '../src/data/sons.js';
import {
  creerVoix, demanderUnSon, gainDuSon, reconcilierLesBoucles, boucleDeLEvenement,
} from '../src/son/politique.js';
import {
  bouclesDesirees, etatDesUnites, evenementDuGeste, effondrementDuBatiment, paireDeLUnite,
  boucleDeLUnite, armeDuTireur, explosionDeLaPiece, evenementsDuJournal,
} from '../src/son/cablage.js';
import { UNITES, DEFENSES } from '../src/data/combat.js';
import { BASE_BATIMENTS } from '../src/data/base.js';
import { BATIMENTS } from '../src/data/sites.js';
import { creerCombat, tick } from '../src/sim/combat.js';
import { genererSite } from '../src/sim/generateur.js';
import { initialiserLeSon, idDuSon, octetsDuDataUri } from '../src/ui/son.js';
import { lireLesReglages, CLE_REGLAGES, CLE_SAUVEGARDE } from '../src/ui/session.js';
import { creerRng, tirer } from '../src/sim/rng.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (...p) => readFileSync(join(RACINE, ...p), 'utf8');

/** Le code d'un module, commentaires ôtés — les gardes ne lisent pas la prose. */
function sansCommentaires(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const ACTIF = { muet: false, volume: 1 };

// ---------------------------------------------------------------------------
// SON T1 — la table est une transcription, et elle se confronte à sa source
// ---------------------------------------------------------------------------

test('SON T1 — les 263 entrées disent ce que le manifeste dit d\'elles', () => {
  // ⚠⚠ LA TABLE N'EST PLUS UNE TRANSCRIPTION, ELLE EST GÉNÉRÉE — et ce test
  // cesse donc de vérifier une RECOPIE pour vérifier une DÉRIVATION. Il rejoue
  // en JavaScript ce que `tools/sons.py` fait en Python, et compare : une
  // génération qui mentirait, ou un fichier généré retouché à la main, tombent
  // tous les deux ici.
  const manifeste = JSON.parse(lire('art', 'sources', 'sfx_manifest.json'));
  const parId = new Map(manifeste.sounds.map((s) => [s.id, s]));
  assert.equal(manifeste.sounds.length, 263, 'le pack a changé de taille : relire la table');
  assert.equal(Object.keys(SONS).length, 263, 'la table et le pack ont divergé en nombre');
  assert.deepEqual(Object.keys(SONS).sort(), [...parId.keys()].sort(),
    'la table et le manifeste ne nomment pas les mêmes sons');

  for (const [nom, son] of Object.entries(SONS)) {
    const dit = parId.get(nom);
    assert.equal(son.dureeMs, dit.duration_ms, `${nom} : durée`);
    assert.equal(son.maxInstances, dit.recommended_max_instances, `${nom} : plafond de voix`);
    assert.equal(son.volumeDb, dit.recommended_volume_db, `${nom} : niveau`);
    assert.ok(son.bus in BUS, `${nom} : bus « ${son.bus} » inconnu`);
    // ⚠⚠ LE MASTER N'EST PAS FORCÉMENT MONO, ET LE LOT L'A MESURÉ. Le brief
    // annonçait « 259 masters mono » et posait le contraire en condition
    // d'arrêt ; **quatorze le contredisent** — les huit ambiances et les six
    // passages d'aéronef, que le manifeste déclare `channels: 2`. La SORTIE,
    // elle, reste mono : `--downmix-mono` la ramène à une voie et
    // `verifier_la_sortie` le lit dans l'en-tête OpusHead du fichier produit.
    assert.ok(dit.channels === 1 || dit.channels === 2, `${nom} : ${dit.channels} canaux`);
  }
  const stereo = manifeste.sounds.filter((s) => s.channels === 2).map((s) => s.id);
  assert.equal(stereo.length, 14, 'le compte de masters stéréo a bougé : relire le rapport');
  assert.ok(stereo.every((id) => id.startsWith('ambience_') || id.includes('_flyby_')),
    'un master stéréo qui n\'est ni une ambiance ni un passage d\'aéronef');

  // ⚠ CE QUI RESTE DÉCODÉ EST UNE FAMILLE, PAS UNE LISTE DE HUIT NOMS.
  const residentes = Object.entries(SONS).filter(([, v]) => v.residente === true).map(([k]) => k);
  assert.deepEqual(residentes.sort(),
    manifeste.sounds.filter((s) => s.category === 'ambiences').map((s) => s.id).sort(),
    'les résidentes ne sont plus exactement les ambiances');

  // Le temps de garde vit sur l'ÉVÉNEMENT ; le manifeste le donne par fichier.
  // Les deux lectures doivent coïncider, variante par variante.
  const vues = new Set();
  for (const [evenement, decrit] of Object.entries(EVENEMENTS)) {
    for (const variante of decrit.variantes) {
      assert.ok(!vues.has(variante), `${variante} appartient à deux événements`);
      vues.add(variante);
      assert.equal(
        decrit.gardeMs, parId.get(variante).recommended_cooldown_ms,
        `${evenement} : sa garde et celle de ${variante} divergent`,
      );
      assert.equal(variante.replace(/_\d+$/, ''), evenement,
        `${variante} n'est pas une variante de ${evenement}`);
    }
  }
  assert.equal(vues.size, 263, 'un son du pack n\'est demandable par aucun événement');

  // ⚠ ET LA COÏNCIDENCE VAUT SUR TOUT LE PACK. C'est la mesure qui autorise à
  // porter la garde par événement : 54 groupes à plusieurs variantes, zéro
  // divergence. Le jour où le pack en portera une, ce test tombera et il faudra
  // rouvrir la question — c'est ce qu'on lui demande.
  const groupes = new Map();
  for (const s of manifeste.sounds) {
    const base = s.id.replace(/_\d+$/, '');
    if (!groupes.has(base)) groupes.set(base, []);
    groupes.get(base).push(s);
  }
  assert.equal(groupes.size, Object.keys(EVENEMENTS).length, 'les groupes et les événements divergent');
  const multiples = [...groupes.values()].filter((l) => l.length > 1);
  assert.equal(multiples.length, 54, 'le montage ne mesure plus les groupes du pack');
  for (const l of multiples) {
    assert.equal(new Set(l.map((s) => s.recommended_cooldown_ms)).size, 1,
      `${l[0].id} : deux variantes, deux temps de garde`);
    assert.equal(new Set(l.map((s) => s.recommended_max_instances)).size, 1,
      `${l[0].id} : deux variantes, deux plafonds`);
  }
});

// SON T2 — le temps de garde mord (falsification n° 1)
// ---------------------------------------------------------------------------

test('SON T2 — deux clics à 40 ms d\'écart ne rendent qu\'un son', () => {
  const voix = creerVoix(12345);
  const premier = demanderUnSon(voix, 'ui_click', 1000, ACTIF);
  assert.equal(premier.jouer, true);
  const second = demanderUnSon(voix, 'ui_click', 1040, ACTIF);
  assert.equal(second.jouer, false, 'la garde de 55 ms devrait refuser à 40 ms');
  assert.equal(second.raison, 'garde');

  // ⚠ ET LE TEST N'EST PAS VACUEUX : au-delà de la garde, ça repasse. Sans
  // cette moitié, un moteur qui refuserait TOUT serait vert.
  assert.equal(demanderUnSon(voix, 'ui_click', 1060, ACTIF).jouer, true, 'à 60 ms la garde est passée');

  // ⚠⚠ ET LA GARDE PORTE SUR L'ÉVÉNEMENT, PAS SUR LE FICHIER — c'est la moitié
  // qui compte. Un clic a deux variantes : une garde par fichier laisserait
  // passer le second clic dès que le tirage change de variante, et la
  // falsification ci-dessus serait verte un coup sur deux. On rejoue le refus
  // sur cinquante graines, pour que le tirage ne puisse pas le sauver.
  for (let g = 1; g <= 50; g += 1) {
    const v = creerVoix(g * 2654435761 % 4294967291 || 7);
    assert.equal(demanderUnSon(v, 'ui_click', 0, ACTIF).jouer, true);
    assert.equal(demanderUnSon(v, 'ui_click', 40, ACTIF).jouer, false,
      `graine ${g} : la garde a laissé passer un second clic à 40 ms`);
  }

  // La garde d'un événement n'est pas celle d'un autre : un refus ne doit pas
  // faire taire tout le jeu.
  const v2 = creerVoix(99);
  assert.equal(demanderUnSon(v2, 'ui_click', 0, ACTIF).jouer, true);
  assert.equal(demanderUnSon(v2, 'ui_error', 0, ACTIF).jouer, true, 'les gardes se mêlent');
});

// ---------------------------------------------------------------------------
// SON T3 — le plafond de voix mord (falsification n° 2)
// ---------------------------------------------------------------------------

test('SON T3 — ui_toggle_on, plafonné à une voix, refuse la seconde', () => {
  assert.equal(SONS.ui_toggle_on.maxInstances, 1, 'montage : ce test ne mesure que le plafond 1');
  // ⚠ LA FENÊTRE EXISTE, ET ELLE SE CALCULE. La garde vaut 120 ms, la durée
  // 160 : il reste quarante millisecondes où la garde laisse passer et où le
  // plafond doit refuser. Sans cet écart le plafond serait INATTEIGNABLE, et ce
  // test serait vert quelle que soit la valeur écrite dans la table.
  const garde = EVENEMENTS.ui_toggle_on.gardeMs;
  const duree = SONS.ui_toggle_on.dureeMs;
  assert.ok(duree > garde, `montage vide : durée ${duree} ms, garde ${garde} ms`);

  const voix = creerVoix(4242);
  assert.equal(demanderUnSon(voix, 'ui_toggle_on', 0, ACTIF).jouer, true);
  const dansLaFenetre = demanderUnSon(voix, 'ui_toggle_on', garde + 5, ACTIF);
  assert.equal(dansLaFenetre.jouer, false, 'le plafond de une voix devrait refuser');
  assert.equal(dansLaFenetre.raison, 'plafond', 'refusé, mais pas par le plafond');

  // Et une fois la durée écoulée, l'instance a expiré : ça repasse.
  assert.equal(demanderUnSon(voix, 'ui_toggle_on', duree + 1, ACTIF).jouer, true);

  // ⚠ L'INSTANCE EXPIRE PAR SA DURÉE, SANS QU'AUCUN RAPPEL NE L'ANNONCE. Si
  // l'adaptateur devait signaler la fin d'un son, un rappel manqué fermerait le
  // plafond pour toujours — un son qui se tait sans que rien ne lève.
  const seule = creerVoix(7);
  demanderUnSon(seule, 'ui_toggle_on', 0, ACTIF);
  assert.equal(seule.instances.ui_toggle_on.length, 1);
  demanderUnSon(seule, 'ui_toggle_on', 10_000, ACTIF);
  assert.equal(seule.instances.ui_toggle_on.length, 1, 'les instances mortes ne sont pas purgées');
});

// ---------------------------------------------------------------------------
// SON T4 — l'audio ne touche pas au flux de la simulation (falsification n° 3)
// ---------------------------------------------------------------------------

test('SON T4 — cent déclenchements ne consomment pas un bit du flux de la partie', () => {
  const flux = creerRng(20260904);
  tirer(flux);
  const avant = JSON.stringify(flux);

  const voix = creerVoix(1);
  const evenements = Object.keys(EVENEMENTS);
  let joues = 0;
  for (let i = 0; i < 100; i += 1) {
    const d = demanderUnSon(voix, evenements[i % evenements.length], i * 500, ACTIF);
    if (d.jouer) joues += 1;
  }
  // Falsifiable : si rien ne jouait, l'égalité serait vraie pour rien.
  assert.ok(joues >= 90, `${joues} sons sur 100 — le montage ne déclenche presque rien`);
  assert.equal(JSON.stringify(flux), avant, 'le tirage de variante a mordu dans le flux de la partie');

  // Et le tirage de variante est bien un tirage : les deux variantes sortent.
  const vues = new Set();
  const v = creerVoix(20260904);
  for (let i = 0; i < 200; i += 1) {
    const d = demanderUnSon(v, 'ui_click', i * 100, ACTIF);
    if (d.jouer) vues.add(d.son);
  }
  assert.deepEqual([...vues].sort(), ['ui_click_01', 'ui_click_02'], 'le tirage ne rend qu\'une variante');

  // ⚠ DÉTERMINISTE À GRAINE ÉGALE : c'est ce qui le rend éprouvable, et c'est
  // ce qui prouve qu'il ne va chercher son entropie nulle part.
  const suite = (graine) => {
    const w = creerVoix(graine);
    return Array.from({ length: 20 }, (_, i) => demanderUnSon(w, 'ui_click', i * 100, ACTIF).son);
  };
  assert.deepEqual(suite(123), suite(123), 'deux voix de même graine divergent');
  assert.notDeepEqual(suite(123), suite(456), 'la graine ne change rien : ce n\'est pas un tirage');

  // Une graine nulle est le point fixe du xorshift : on lève plutôt que de
  // figer la variante pour toute la session.
  assert.throws(() => creerVoix(0), RangeError);
});

// ---------------------------------------------------------------------------
// SON T5 — aucun module de src/sim/ ne connaît le son (falsification n° 4)
// ---------------------------------------------------------------------------

test('SON T5 — la simulation n\'importe ni la politique ni l\'adaptateur', () => {
  const fichiers = readdirSync(join(RACINE, 'src', 'sim')).filter((n) => n.endsWith('.js'));
  assert.ok(fichiers.length >= 20, `montage cassé : ${fichiers.length} fichiers dans src/sim/`);
  // ⚠⚠ LE MOTIF NE PEUT PAS EXIGER UN `from`, ET LA FALSIFICATION L'A DIT. Sa
  // première écriture cherchait `from '…/son/…'` ; or un import à EFFET DE BORD
  // s'écrit `import '../son/politique.js';`, sans `from` — et il crée exactement
  // le couplage qu'on interdit. Mesuré : la garde restait ENTIÈREMENT VERTE
  // (15 pass / 0 fail) avec cette ligne déposée dans `src/sim/rng.js`. Le motif
  // lit donc l'adresse, quelle que soit la forme de l'import.
  const versLeSon = /['"][^'"]*(\/son\/|ui\/son\.js|data\/sons\.js)/;
  for (const nom of fichiers) {
    const code = sansCommentaires(lire('src', 'sim', nom));
    assert.ok(!versLeSon.test(code), `src/sim/${nom} connaît le son — la simulation doit l'ignorer`);
  }
  // Les appâts : les TROIS formes de la vraie faute sont reconnues.
  assert.ok(versLeSon.test("import { x } from '../son/politique.js';"), 'import nommé');
  assert.ok(versLeSon.test("import '../son/politique.js';"), 'import à effet de bord');
  assert.ok(versLeSon.test("await import('../ui/son.js');"), 'import dynamique');
  assert.ok(!versLeSon.test("import { UNITES } from '../data/combat.js';"), 'faux positif');

  // Et dans l'autre sens : la politique ne dépend de rien de la simulation.
  const politique = sansCommentaires(lire('src', 'son', 'politique.js'));
  assert.ok(!politique.includes('sim/'), 'src/son/politique.js importe la simulation');
  const imports = [...politique.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
  assert.deepEqual(imports, ['../data/sons.js'], 'la politique a gagné une dépendance');
});

// ---------------------------------------------------------------------------
// SON T6 — muet coupe vraiment, et le réglage survit (falsification n° 5)
// ---------------------------------------------------------------------------

test('SON T6 — muet refuse, le volume nul aussi, et le réglage se relit', () => {
  const voix = creerVoix(11);
  const coupe = demanderUnSon(voix, 'ui_click', 0, { muet: true, volume: 1 });
  assert.equal(coupe.jouer, false);
  assert.equal(coupe.raison, 'silence');
  // Falsifiable : le même appel non muet passe. Sans cette ligne, un moteur
  // cassé qui refuserait tout serait vert.
  assert.equal(demanderUnSon(creerVoix(11), 'ui_click', 0, ACTIF).jouer, true);
  // Un volume nul revient au même à l'oreille, et ne dépense pas de voix.
  assert.equal(demanderUnSon(creerVoix(11), 'ui_click', 0, { muet: false, volume: 0 }).jouer, false);

  // ⚠ MUET NE CONSOMME NI LA GARDE NI UNE INSTANCE. Sinon, couper puis rallumer
  // laisserait le premier son d'après refusé, sans que rien ne l'explique.
  const v = creerVoix(11);
  demanderUnSon(v, 'ui_click', 0, { muet: true, volume: 1 });
  assert.deepEqual(v.gardes, {});
  assert.deepEqual(v.instances, {});

  // La relecture du magasin : le défaut est le son ACTIF — « une fonction muette
  // par défaut n'est jamais testée ».
  assert.equal(REGLAGES_PAR_DEFAUT.muet, false, 'le son doit être actif par défaut');
  assert.deepEqual(lireLesReglages('{"muet":true,"volume":0.25}'), { muet: true, volume: 0.25 });
  // Tout ce qui n'a pas la bonne forme revient au défaut, sans lever : le jeu
  // ne devient pas instartable pour un curseur de volume.
  for (const brut of [null, '', 'pas du json', '[]', '{"volume":42}', '{"volume":-1}', '{"volume":"fort"}']) {
    const lu = lireLesReglages(brut);
    assert.equal(lu.volume, REGLAGES_PAR_DEFAUT.volume, `« ${brut} » : volume`);
    assert.equal(typeof lu.muet, 'boolean');
  }
  assert.equal(lireLesReglages('{"muet":true}').muet, true, 'un muet seul se relit');
});

// ---------------------------------------------------------------------------
// SON T7 / T8 — pas de Web Audio, et rien avant le premier geste
// ---------------------------------------------------------------------------

/** Un document de papier : juste ce que l'adaptateur touche. */
function faireDoc(fenetre, avecBalises = true) {
  const balises = new Map();
  if (avecBalises) {
    for (const nom of Object.keys(SONS)) {
      // ⚠ LES OCTETS PORTENT LE NOM DU SON, et ce n'est pas décoratif : c'est
      // ce qui permet au faux décodeur de dire LEQUEL on lui a donné, donc de
      // mesurer qu'une demande décode la variante demandée et une seule.
      balises.set(idDuSon(nom), { getAttribute: () => `data:audio/ogg;base64,${btoa(nom)}` });
    }
  }
  return { defaultView: fenetre, getElementById: (id) => balises.get(id) ?? null };
}

test('SON T7 — sans Web Audio, le jeu démarre et se tait (falsification n° 6)', () => {
  const doc = faireDoc({});
  const son = initialiserLeSon(doc, { reglages: { ...ACTIF }, graine: 5 });
  // Aucune exception ne remonte à l'interface, dans aucun des deux chemins.
  assert.doesNotThrow(() => son.reveiller());
  assert.doesNotThrow(() => son.jouer('ui_click'));
  assert.doesNotThrow(() => son.jouer('ui_click'));

  // Un `AudioContext` dont le constructeur lève — une sortie audio absente —
  // se traite pareil.
  const casse = faireDoc({ AudioContext: function () { throw new Error('pas de sortie'); } });
  const s2 = initialiserLeSon(casse, { reglages: { ...ACTIF }, graine: 5 });
  assert.doesNotThrow(() => s2.jouer('ui_click'));

  // Et une page à qui il manque les balises : le décodage n'a rien à décoder.
  const nu = faireDoc(faussesFenetres().fenetre, false);
  const s3 = initialiserLeSon(nu, { reglages: { ...ACTIF }, graine: 5 });
  assert.doesNotThrow(() => s3.jouer('ui_click'));
});

/**
 * Une fenêtre qui compte ses contextes audio et ce qu'on lui demande de jouer.
 *
 * ⚠ ELLE EXPOSE SON CONTEXTE ET SON HORLOGE, et ce n'est pas du confort : la
 * politique reçoit l'instant en ARGUMENT — `contexte.currentTime * 1000` —, donc
 * sans pouvoir avancer cette horloge, aucun test ne peut faire accepter deux
 * demandes du même événement, et « un son n'est décodé qu'une fois » resterait
 * invérifiable.
 *
 * `echecs` nomme les sons dont le décodage doit ÉCHOUER.
 */
function faussesFenetres(echecs = new Set()) {
  const journal = {
    contextes: 0, decodages: 0, demandes: [], joues: [], contexte: null,
    // Le lot SON-CÂBLAGE : ce qui BOUCLE, ce qui s'arrête, et les rampes.
    boucles: [], arrets: [], rampes: [],
  };
  class FauxContexte {
    constructor() {
      journal.contextes += 1;
      journal.contexte = this;
      this.state = 'suspended';
      this.currentTime = 0;
      this.destination = { nom: 'sortie' };
    }
    resume() { this.state = 'running'; return Promise.resolve(); }
    createGain() {
      // ⚠ UN `AudioParam` DE PAPIER, QUI ENREGISTRE SES RAMPES. Sans lui, « la
      // boucle démarre et s'arrête sur une rampe » serait invérifiable ici.
      const trace = [];
      journal.rampes.push(trace);
      const gain = {
        value: 1,
        setValueAtTime(v, t) { gain.value = v; trace.push(['pose', v, t]); },
        linearRampToValueAtTime(v, t) { gain.value = v; trace.push(['rampe', v, t]); },
        cancelScheduledValues(t) { trace.push(['annule', t]); },
      };
      return { gain, connect: () => {}, trace };
    }
    createBufferSource() {
      const source = {
        buffer: null,
        loop: false,
        onended: null,
        connect: () => {},
        // ⚠⚠ UN COUP SE TERMINE TOUT DE SUITE, UNE BOUCLE ATTEND SON `stop`. Le
        // vrai navigateur appelle `onended` à la fin du tampon ; ne jamais
        // l'appeler ici laisserait chaque tampon TENU pour toujours, donc
        // l'éviction bloquée — un faux qui mentirait sur le mécanisme même que
        // ces tests mesurent.
        start: () => {
          journal.joues.push(source.buffer);
          if (source.loop) journal.boucles.push(source.buffer?.nom ?? null);
          else if (source.onended !== null) source.onended();
        },
        stop: (quand) => {
          journal.arrets.push({ nom: source.buffer?.nom ?? null, quand });
          if (source.onended !== null) source.onended();
        },
      };
      return source;
    }
    decodeAudioData(octets) {
      journal.decodages += 1;
      const nom = new TextDecoder().decode(octets);
      journal.demandes.push(nom);
      if (echecs.has(nom)) return Promise.reject(new Error('octets illisibles'));
      return Promise.resolve({ nom });
    }
  }
  return { fenetre: { AudioContext: FauxContexte }, journal };
}

/** Laisse tourner les promesses de décodage déjà résolues. */
const laisserDecoder = async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); };

test('SON T8 — rien n\'est décodé au démarrage (falsifications n° 7 et n° 12)', () => {
  const { fenetre, journal } = faussesFenetres();
  const doc = faireDoc(fenetre);
  const son = initialiserLeSon(doc, { reglages: { ...ACTIF }, graine: 5 });
  // ⚠ LE CONTEXTE NAÎT AU GESTE, PAS AU CÂBLAGE. Créé au chargement, il naîtrait
  // SUSPENDU — le navigateur l'exige depuis que les pages ont cessé d'avoir le
  // droit de faire du bruit toutes seules — et il le resterait.
  assert.equal(journal.contextes, 0, 'un contexte audio a été créé avant tout geste');
  assert.equal(journal.decodages, 0, 'des octets ont été décodés avant tout geste');

  // ⚠⚠ ET LE PREMIER GESTE N'EN DÉCODE QU'UN, PAS 263. C'est tout le point dur
  // du lot : 336,8 secondes décodées vaudraient 64,7 Mo en Float32 à 48 kHz,
  // soixante-treize fois le poids des fichiers. Le lot précédent décodait ses
  // quatre témoins au réveil ; à 263 le même geste serait un démarrage qui
  // cesse d'être instantané et une empreinte mémoire que rien ne borne.
  son.reveiller();
  assert.equal(journal.contextes, 1, 'le premier geste doit créer le contexte');
  assert.equal(journal.decodages, 0, 'le réveil a décodé : le décodage doit être PARESSEUX');

  son.jouer('ui_click');
  assert.equal(journal.decodages, 1, 'une demande, un décodage — pas 263');
  assert.ok(journal.demandes[0].startsWith('ui_click_'), 'ce n\'est pas la variante demandée');
});

test('SON T8 bis — deux demandes rapprochées ne rendent qu\'un décodage (falsification n° 13)', async () => {
  const { fenetre, journal } = faussesFenetres();
  const son = initialiserLeSon(faireDoc(fenetre), { reglages: { ...ACTIF }, graine: 5 });

  // ⚠⚠ LE MONTAGE DOIT D'ABORD MESURER QUELQUE CHOSE : sans avancer l'horloge,
  // la garde de 55 ms refuserait la seconde demande et le décodage unique
  // serait vrai pour une raison qui n'est pas la bonne.
  son.jouer('ui_toggle_on');
  assert.equal(journal.decodages, 1, 'la première demande n\'a rien décodé');
  // La seconde tombe AVANT que la promesse du décodage soit tenue : c'est le
  // piège classique, et c'est `enVol` qui l'attrape.
  journal.contexte.currentTime = 10; // 10 s : la garde et le plafond sont passés
  son.jouer('ui_toggle_on');
  assert.equal(journal.decodages, 1, 'le même son a été décodé deux fois');
  assert.equal(journal.joues.length, 0, 'un tampon non décodé a pourtant été joué');

  // Le décodage rendu, le son part — et il ne se redécode pas.
  await laisserDecoder();
  journal.contexte.currentTime = 20;
  son.jouer('ui_toggle_on');
  assert.equal(journal.decodages, 1, 'le décodage s\'est refait après coup');
  assert.equal(journal.joues.length, 1, 'le tampon décodé n\'a pas été joué');
  assert.equal(journal.joues[0].nom, 'ui_toggle_on', 'ce n\'est pas le bon tampon qui est parti');
});

test('SON T8 ter — un décodage en échec se tait, les autres sonnent (falsification n° 14)', async () => {
  const { fenetre, journal } = faussesFenetres(new Set(['ui_error_01', 'ui_error_02']));
  const son = initialiserLeSon(faireDoc(fenetre), { reglages: { ...ACTIF }, graine: 5 });

  assert.doesNotThrow(() => son.jouer('ui_error'));
  await laisserDecoder();
  journal.contexte.currentTime = 10;
  assert.doesNotThrow(() => son.jouer('ui_error'));
  await laisserDecoder();
  assert.equal(journal.joues.length, 0, 'un son dont le décodage a échoué a été joué');

  // ⚠ ET LE RESTE DU MOTEUR CONTINUE : c'est la moitié qui compte. Un test qui
  // ne vérifierait que le silence serait vert sur un moteur entièrement mort.
  journal.contexte.currentTime = 20;
  son.jouer('ui_toggle_on');
  await laisserDecoder();
  journal.contexte.currentTime = 30;
  son.jouer('ui_toggle_on');
  assert.equal(journal.joues.length, 1, 'les autres sons ne sonnent plus');
});

test('SON T8 quater — la mémoire décodée est bornée, les ambiances exceptées (falsification n° 15)', async () => {
  const { fenetre, journal } = faussesFenetres();
  const son = initialiserLeSon(faireDoc(fenetre), { reglages: { ...ACTIF }, graine: 5 });
  son.reveiller();

  // ⚠⚠ CE QUE CE TEST DÉFEND EST UN NOMBRE D'OCTETS, PAS UN NOMBRE DE FICHIERS.
  // Un son décodé pèse `durée × 48 000 × 4` : les 263 feraient 64,7 Mo. Le
  // budget est donc en SECONDES, et il se traduit exactement.
  assert.ok(MEMOIRE.budgetSecondesDecodees > 0, 'montage : pas de budget');

  // ⚠ ON NE PREND QUE DES ÉVÉNEMENTS À UNE SEULE VARIANTE. Sur un groupe à
  // plusieurs, la variante est TIRÉE : le test ne saurait pas lequel a été
  // décodé, et il mesurerait le tirage plutôt que l'éviction.
  const longs = Object.entries(EVENEMENTS)
    .filter(([, d]) => d.variantes.length === 1)
    .map(([, d]) => d.variantes[0])
    .filter((n) => SONS[n].residente !== true && SONS[n].dureeMs >= 1000)
    .sort();
  const cumul = longs.reduce((t, n) => t + SONS[n].dureeMs / 1000, 0);
  assert.ok(cumul > MEMOIRE.budgetSecondesDecodees * 2,
    `montage vide : ${cumul} s demandées pour un budget de ${MEMOIRE.budgetSecondesDecodees}`);

  let t = 0;
  const demander = async (nom) => {
    t += 60;
    journal.contexte.currentTime = t;
    son.jouer(nom);
    await laisserDecoder();
  };

  for (const nom of longs) await demander(nom);
  // Le premier son demandé a forcément été évincé : le redemander redécode.
  const avant = journal.decodages;
  await demander(longs[0]);
  assert.ok(journal.decodages > avant,
    'aucune éviction : la mémoire décodée n\'est pas bornée');

  // ⚠ ET UNE AMBIANCE, ELLE, RESTE. Huit fichiers de huit secondes, 12,3 Mo,
  // les seuls qui tournent en boucle en permanence : les redécoder à chaque
  // tour serait absurde. Sans cette moitié, une éviction aveugle serait verte.
  const ambiance = Object.entries(SONS).find(([, v]) => v.residente === true)[0];
  await demander(ambiance);
  const decodagesDeLAmbiance = () => journal.demandes.filter((n) => n === ambiance).length;
  assert.equal(decodagesDeLAmbiance(), 1, 'montage : l\'ambiance n\'a pas été décodée');
  const apres = journal.decodages;
  for (const nom of longs) await demander(nom);
  assert.ok(journal.decodages > apres, 'montage : les longs n\'ont rien redécodé');
  await demander(ambiance);
  assert.equal(decodagesDeLAmbiance(), 1,
    'une ambiance a été évincée puis redécodée : elle doit rester résidente');
});

// ---------------------------------------------------------------------------
// SON T9 — table, fichiers, marqueurs et balises ne peuvent pas diverger
// ---------------------------------------------------------------------------

test('SON T9 — table, fichiers, outil, marqueurs et balises ne peuvent pas diverger (falsifications n° 8 et n° 16)', () => {
  const noms = Object.keys(SONS).sort();
  assert.equal(noms.length, 263, 'le catalogue entier entre : 263, pas un de moins');

  // 1. le disque
  const surDisque = readdirSync(join(RACINE, 'art', 'sprites', 'son'))
    .filter((n) => n.endsWith('.opus')).map((n) => n.replace(/\.opus$/, '')).sort();
  assert.deepEqual(surDisque, noms, 'art/sprites/son/ et la table ont divergé');

  // 2. le manifeste de la chaîne — et la durée, qui plafonne les voix
  const empreintes = JSON.parse(lire('art', 'sprites', 'son', 'son-empreintes.json'));
  assert.deepEqual(Object.keys(empreintes.sons).sort(), noms, 'le manifeste de la chaîne a divergé');
  for (const nom of noms) {
    assert.equal(empreintes.sons[nom].duree_ms, SONS[nom].dureeMs, `${nom} : durée mesurée ≠ table`);
  }

  // 3. les masters — l'outil les nomme `<id>.wav`, et ils sont tous là
  const sources = new Set(readdirSync(join(RACINE, 'art', 'sources')));
  for (const nom of noms) {
    assert.ok(sources.has(`${nom}.wav`), `le master « ${nom}.wav » manque à art/sources/`);
  }

  // ⚠⚠ 4. LE PALIER EST 20 kbps, ET IL SE LIT DANS CE QUI A ÉTÉ PRODUIT, PAS
  // DANS LA CONSTANTE. Un débit changé dans `tools/sons.py` sans régénération
  // laisserait la constante juste et les fichiers faux ; les empreintes, elles,
  // sont écrites par l'exécution. « Ne pas descendre sous 20 pour gagner des
  // octets » est l'arbitrage d'Ethan, tranché à l'oreille sur le téléphone.
  const debits = new Set(Object.values(empreintes.sons).map((e) => e.debit_kbps));
  assert.deepEqual([...debits], [20], `le palier a bougé : ${[...debits].join(', ')} kbps`);
  const outil = lire('tools', 'sons.py');
  assert.ok(/DEBIT_PAR_DEFAUT = 20\b/.test(outil), 'tools/sons.py ne pose plus 20 kbps');
  // ⚠ ET LE NUMÉRO DE SÉRIE OGG RESTE FIXÉ PAR ENTRÉE. Sans lui, `opusenc` le
  // tire au hasard et deux exécutions rendent 263 SHA-256 différents :
  // `tools/verifier.py` dirait « 263 différents » à chaque passage, pour
  // toujours, et quelqu'un finirait par l'assouplir.
  assert.ok(outil.includes("'--serial'"), 'tools/sons.py ne fixe plus le numéro de série Ogg');
  assert.equal(new Set(Object.values(empreintes.sons).map((e) => e.serie)).size, 263,
    'deux sons partagent un numéro de série Ogg');
  // ⚠ ET LA SORTIE EST MONO, quels que soient les masters : quatorze d'entre eux
  // sont stéréo, `--downmix-mono` les ramène, et l'outil le RELIT dans
  // l'en-tête OpusHead du fichier produit — sur l'artefact qui part au joueur.
  assert.ok(outil.includes("'--downmix-mono'"), 'la sortie n\'est plus ramenée au mono');
  assert.ok(outil.includes('def verifier_la_sortie('), 'plus rien ne vérifie le mono en sortie');

  // 5. le build et la page — un son inliné que rien ne pose, ou l'inverse
  //
  // ⚠⚠ LES 263 MARQUEURS NE SONT PLUS ÉCRITS NULLE PART, ET C'EST LE LOT. Le
  // build les DÉRIVE de `SONS` et écrit les balises lui-même ; les chercher en
  // toutes lettres dans le HTML reviendrait à exiger la table recopiée que ce
  // lot retire. Ce qui se garde, c'est la DÉRIVATION : le build lit la table du
  // jeu, et la page porte le marqueur de famille.
  const build = lire('tools', 'build.js');
  assert.ok(/import \{ SONS \} from '\.\.\/src\/data\/sons\.js';/.test(build),
    'tools/build.js ne lit plus la table des sons');
  assert.ok(build.includes('%SON_${nom.toUpperCase()}%'), 'le marqueur ne se dérive plus du nom');
  assert.ok(build.includes('idDuSon(nom)'), 'le build fabrique les identifiants au lieu de les dériver');
  const html = lire('src', 'index.src.html');
  assert.ok(html.includes('%BALISES_SON%'), 'la page ne porte plus le marqueur de la famille');
  assert.equal((html.match(/%SON_[A-Z0-9_]+%/g) ?? []).length, 0,
    'un marqueur de son est écrit à la main dans la page : la famille se dérive');

  // ⚠ ET AUCUN MARQUEUR N'EST PRÉFIXE D'UN AUTRE. `tools/build.js` le disait
  // depuis le 30/08 et l'avait vérifié À LA MAIN sur huit ; à 284, une
  // relecture à la main serait une affirmation sans mesure. On les mesure tous
  // — ceux de la page ET les 263 dérivés.
  const tous = [...new Set([
    ...[...html.matchAll(/%[A-Z0-9_]+%/g)].map((m) => m[0]),
    ...noms.map((n) => `%SON_${n.toUpperCase()}%`),
  ])];
  assert.ok(tous.length >= 284, `montage cassé : ${tous.length} marqueurs`);
  assert.ok(tous.includes('%ATLAS_TERRAIN%') && tous.includes('%ATLAS_TERRAIN_BASE%'),
    'le montage ne voit plus le couple que le build donne en exemple');
  for (const a of tous) {
    for (const b of tous) {
      if (a !== b) assert.ok(!b.startsWith(a), `le marqueur ${a} est préfixe de ${b}`);
    }
  }
});

// ---------------------------------------------------------------------------
// SON T10 — l'horloge est injectée, et la politique ne connaît pas le navigateur
// ---------------------------------------------------------------------------

test('SON T10 — src/son/ ne touche à aucune API du navigateur (falsification n° 9)', () => {
  // ⚠ `Date.now` EST GARDÉ AILLEURS, et c'est voulu : `test/banc.test.js` porte
  // l'interdiction TOTALE sur `src/sim`, `src/data`, `src/render` et, depuis ce
  // lot, `src/son` — une seule garde pour une seule règle. Ici on ferme les
  // AUTRES portes, celles par lesquelles un temps ou un contexte pourrait
  // entrer sans écrire le nom que l'autre garde cherche.
  const fichiers = readdirSync(join(RACINE, 'src', 'son')).filter((n) => n.endsWith('.js'));
  assert.ok(fichiers.length >= 1, 'montage cassé : src/son/ est vide');
  for (const nom of fichiers) {
    const code = sansCommentaires(lire('src', 'son', nom));
    for (const interdit of ['AudioContext', 'document', 'window', 'performance',
      'new Date', 'setTimeout', 'requestAnimationFrame', 'localStorage', 'Math.random']) {
      assert.ok(!code.includes(interdit), `src/son/${nom} touche au navigateur : ${interdit}`);
    }
  }

  // ⚠ ET L'INJECTION SE MESURE, ELLE NE SE DÉDUIT PAS DE L'ABSENCE D'UN NOM.
  // La même question posée à deux instants doit rendre deux réponses : c'est ce
  // qu'un `Date.now()` en dur rendrait impossible à écrire.
  const voix = creerVoix(3);
  assert.equal(demanderUnSon(voix, 'ui_error', 0, ACTIF).jouer, true);
  assert.equal(demanderUnSon(voix, 'ui_error', 10, ACTIF).jouer, false);
  assert.equal(demanderUnSon(voix, 'ui_error', 10_000, ACTIF).jouer, true);

  // Un événement inconnu LÈVE : un nom mal tapé au câblage est un fait de
  // programme, et le taire rendrait le son muet à un endroit sans que personne
  // ne sache où chercher.
  assert.throws(() => demanderUnSon(creerVoix(1), 'ui_inconnu', 0, ACTIF), RangeError);
});

// ---------------------------------------------------------------------------
// SON T11 — la frontière entre la politique et l'adaptateur
// ---------------------------------------------------------------------------

test('SON T11 — l\'adaptateur ne porte aucune décision', () => {
  const code = sansCommentaires(lire('src', 'ui', 'son.js'));
  // ⚠⚠ LES NOMS DE LA POLITIQUE NE DOIVENT PAS REPARAÎTRE ICI. C'est la seule
  // forme sous laquelle une autorisation FUIRAIT dans l'adaptateur : un
  // `if (reglages.muet)`, un `maxInstances` recompté, une garde relue. Le
  // fichier reçoit l'objet des réglages et le TRANSMET sans en lire un champ.
  for (const interdit of ['maxInstances', 'gardeMs', 'muet', 'volume', 'instances', 'gardes']) {
    assert.ok(!code.includes(interdit), `src/ui/son.js porte une décision : ${interdit}`);
  }
  // Et il appelle bien la politique plutôt que de trancher lui-même.
  assert.ok(code.includes('demanderUnSon('), 'l\'adaptateur ne demande plus rien à la politique');
  // L'appât : le motif reconnaîtrait la vraie faute.
  assert.ok('if (reglages.muet) return;'.includes('muet'));

  // ⚠ ET IL NE FABRIQUE AUCUNE ADRESSE. `fetch` marcherait sur un `data:` ;
  // c'est exactement ce que CLAUDE.md §6 interdit — passer sous la garde
  // offline en assemblant une adresse à l'exécution.
  assert.ok(!code.includes('fetch'), 'l\'adaptateur passe par le réseau');
  assert.ok(!code.includes('url('), 'l\'adaptateur fabrique une adresse CSS');

  // La lecture d'un `data:` : ce qu'il fait à la place.
  const octets = octetsDuDataUri(`data:audio/ogg;base64,${btoa('OggS')}`);
  assert.equal(new TextDecoder().decode(octets), 'OggS');
  // Un marqueur non substitué — un build incomplet — ne casse rien.
  assert.equal(octetsDuDataUri('%SON_UI_CLICK_01%'), null);
  assert.equal(octetsDuDataUri(null), null);
  assert.equal(octetsDuDataUri('data:audio/ogg,pasdebase64'), null);
});

// ---------------------------------------------------------------------------
// SON T12 — les cinq bus, et le gain
// ---------------------------------------------------------------------------

test('SON T12 — les cinq bus sont posés, aux niveaux du pack', () => {
  // ⚠ TROIS N'ONT AUCUN SON DANS CE LOT, ET ILS SONT POSÉS QUAND MÊME : sans
  // eux, le lot du catalogue improviserait cinq niveaux, chacun à sa mesure.
  assert.deepEqual(BUS, { interface: -3, armes: -6, impacts: -7, moteurs: -12, ambiances: -18 });
  for (const son of Object.values(SONS)) {
    assert.ok(son.bus in BUS, `le bus « ${son.bus} » n'existe pas`);
  }

  // Les décibels s'ADDITIONNENT, le volume MULTIPLIE. Les convertir chacun en
  // linéaire pour les additionner rendrait des nombres plausibles et faux.
  const attendu = (10 ** (-3 / 20));
  assert.ok(Math.abs(gainDuSon('ui_click_01', 1) - attendu) < 1e-12);
  assert.ok(Math.abs(gainDuSon('ui_click_01', 0.5) - attendu / 2) < 1e-12);
  assert.ok(gainDuSon('ui_click_01', 1) < 1, '-3 dB devrait atténuer');
  assert.throws(() => gainDuSon('ui_inconnu', 1), RangeError);

  // Le gain rendu par la politique est celui-là, et pas un autre.
  const d = demanderUnSon(creerVoix(1), 'ui_toggle_on', 0, { muet: false, volume: 0.7 });
  assert.equal(d.gain, gainDuSon('ui_toggle_on', 0.7));
});

// ---------------------------------------------------------------------------
// SON T13 — le son n'entre pas dans la sauvegarde
// ---------------------------------------------------------------------------

test('SON T13 — les réglages vont dans leur magasin, jamais dans la partie', () => {
  // ⚠⚠ `SAVE_VERSION` NE BOUGE PAS, ET C'EST UNE CONDITION D'ARRÊT DU LOT. Un
  // volume n'est pas un fait de partie : le mettre dans l'état obligerait à
  // écrire une migration pour un curseur, et effacer sa partie remettrait le
  // son à fond. Le garde vit dans `bases.test.js` ; ici on garde la SÉPARATION.
  assert.notEqual(CLE_REGLAGES, CLE_SAUVEGARDE, 'les réglages écraseraient la partie');
  assert.ok(!CLE_REGLAGES.includes('partie'), 'la clé des réglages parle de la partie');

  // Rien du son n'atteint la sérialisation.
  // ⚠ LES BORNES SONT EN UNICODE, PAS `\b`. `\b` est ASCII en JavaScript et le
  // dépôt écrit son code en français : entre un `n` et un `é`, il voit une
  // frontière de mot là où il n'y en a pas. CLAUDE.md §6 le pose comme une règle
  // depuis la garde du lot 1, qui déclenchait sur « documenté ».
  const etat = sansCommentaires(lire('src', 'sim', 'state.js'));
  for (const interdit of ['muet', 'volume', 'CLE_REGLAGES', 'son']) {
    const motif = new RegExp(`(^|[^\\p{L}\\p{N}_])${interdit}([^\\p{L}\\p{N}_]|$)`, 'u');
    assert.ok(!motif.test(etat), `src/sim/state.js parle de « ${interdit} »`);
  }
  // L'appât : le motif reconnaît la vraie faute et laisse passer un mot qui la
  // contient — « son » ne doit pas se déclencher sur « sonner » ni sur « raison ».
  assert.ok(/(^|[^\p{L}\p{N}_])son([^\p{L}\p{N}_]|$)/u.test('const son = 1;'));
  assert.ok(!/(^|[^\p{L}\p{N}_])son([^\p{L}\p{N}_]|$)/u.test('const raison = 1;'));

  // Et l'état des voix n'est pas sérialisable par accident dans la partie : il
  // vit dans la session, pas dans `etat`.
  const session = sansCommentaires(lire('src', 'ui', 'session.js'));
  assert.ok(!/serialiser\([^)]*reglages/.test(session), 'les réglages entrent dans la sauvegarde');
});

// ---------------------------------------------------------------------------
// SON T14 — les trois points de câblage, et pas un quatrième
// ---------------------------------------------------------------------------

test('SON T14 — quatre points d\'accroche, un seul écouteur pour tous les boutons (falsification n° 17)', () => {
  const session = sansCommentaires(lire('src', 'ui', 'session.js'));
  const appels = [...session.matchAll(/son\.jouer\('([a-z_0-9]+)'\)/g)].map((m) => m[1]);
  // ⚠⚠ QUATRE POINTS, ET AUCUN N'EST NEUF. Le clic délégué, les DEUX registres
  // `toast` — celui du Chantier depuis le lot SON-MOTEUR, celui de l'Offense
  // depuis celui-ci, écart déclaré et refermé — et la bascule d'OPTIONS. Le
  // brief l'interdit de face : « ne créer aucun événement de jeu pour donner un
  // emploi à un son ».
  assert.deepEqual(appels.sort(), ['ui_click', 'ui_error', 'ui_error', 'ui_toggle_on'],
    'le câblage a bougé : quatre points, dont deux refus');
  for (const nom of new Set(appels)) {
    assert.ok(nom in EVENEMENTS, `« ${nom} » n'est pas un événement de la table`);
  }
  // ⚠ ET LES DEUX REGISTRES `toast` SONNENT, PAS UN SEUL. C'est l'écart que le
  // lot précédent avait déclaré : le refus sonnait sur la base et se taisait
  // sur l'armée, pour la même faute du joueur.
  assert.equal((session.match(/sonDeRefus:\s*\(\)\s*=>\s*son\.jouer\('ui_error'\)/g) ?? []).length, 2,
    'un seul des deux registres de refus est câblé');

  // ⚠⚠ UN SEUL ÉCOUTEUR POUR TOUS LES BOUTONS. Un écouteur par bouton dispersé
  // dans six écrans est la dette que ce lot existe pour éviter : le premier
  // bouton ajouté serait muet sans que rien ne le dise.
  assert.equal((session.match(/son\.jouer\('ui_click'\)/g) ?? []).length, 1,
    'le clic est câblé à plus d\'un endroit');
  assert.ok(/doc\.addEventListener\('click'/.test(session), 'la délégation a disparu');

  // ⚠⚠ ET AUCUN ÉVÉNEMENT DE SIMULATION NE DÉCLENCHE DE SON. La garde du lot
  // précédent disait « aucun autre écran ne joue de son » ; elle est REMPLACÉE,
  // pas supprimée — elle porte désormais sur ce qui compte vraiment à 263 sons :
  // qu'aucune famille hors `ui` ne sonne, et donc qu'aucun module de rendu ou de
  // simulation n'appelle le moteur audio. Brancher un tir la fait tomber.
  //
  // ⚠ LE MOTIF EST BORNÉ À GAUCHE, ET IL A FALLU LE PAYER UNE FOIS. Un
  // `includes('jouer(')` nu tombe sur le `rejouer(` de `src/ui/raid.js`, qui
  // rejoue un combat et ne fait aucun bruit — c'est la faute que CLAUDE.md §6
  // raconte déjà pour `\b`, qui est ASCII dans un dépôt écrit en français.
  const joueUnSon = /(^|[^\p{L}\p{N}_])jouer\s*\(/u;
  for (const dossier of ['ui', 'sim', 'render', 'data']) {
    for (const nom of readdirSync(join(RACINE, 'src', dossier)).filter((n) => n.endsWith('.js'))) {
      if (dossier === 'ui' && (nom === 'session.js' || nom === 'son.js')) continue;
      const code = sansCommentaires(lire('src', dossier, nom));
      assert.ok(!joueUnSon.test(code), `src/${dossier}/${nom} joue un son : le câblage reste groupé`);
    }
  }
  // L'appât dans les deux sens : le motif reconnaît la vraie faute, et laisse
  // passer celle qui n'en est pas une.
  assert.ok(joueUnSon.test("  son.jouer('ui_click');"), 'le motif ne voit plus la vraie faute');
  assert.ok(!joueUnSon.test('  rejouer(montage, vagues);'), 'le motif retombe sur rejouer(');

  // ⚠⚠ ET LES SONS ATTEIGNABLES SE RECOMPTENT, DE BOUT EN BOUT. Le lot
  // SON-MOTEUR les lisait dans les seuls littéraux de `session.js` ; depuis
  // SON-CÂBLAGE la session appelle aussi `son.jouer(evenement)` avec une
  // VARIABLE, dont la valeur sort de `src/son/cablage.js`. Un test qui ne
  // lirait que les littéraux annoncerait cinq sons atteignables sur cent
  // soixante-neuf — c'est-à-dire qu'il mentirait dans le sens le plus dangereux,
  // en déclarant muet ce qui sonne. On rejoue donc les DEUX portes.
  //
  // ⚠⚠ ET LA SECONDE PORTE EN COMPTE DEUX DEPUIS LE LOT JOURNAL-DE-COMBAT : le
  // geste, qui existait, et le DÉROULÉ du raid, qui vide `evenementsSonores()`.
  // Les deux appellent `son.jouer(evenement)`, les deux passent par
  // `src/son/cablage.js`, et aucun écran ne nomme un son.
  const parLaVariable = (session.match(/son\.jouer\(evenement\)/g) ?? []).length;
  assert.equal(parLaVariable, 2, 'la seconde porte du son a bougé : recompter les atteignables');
  const atteignables = [...new Set([...appels, ...EVENEMENTS_CABLES])]
    .flatMap((e) => EVENEMENTS[e].variantes).sort();
  assert.deepEqual([...new Set(atteignables)], atteignables, 'un son atteignable en double');
  assert.equal(atteignables.length, 169, 'le nombre de sons atteignables a bougé');
  // ⚠ ET 94 RESTENT MUETS. C'est voulu, et le rapport les nomme un par un avec
  // leur raison : rien n'a été branché pour donner un emploi à un son.
  assert.equal(Object.keys(SONS).length - atteignables.length, 94,
    'le compte des sons muets a bougé sans que le rapport le dise');

  // Le refus arrive par les registres `toast`, APRÈS la garde du texte vide :
  // effacer un toast ne doit pas sonner. Les DEUX écrans, à la même place.
  for (const ecran of ['chantier.js', 'offense.js']) {
    const code = sansCommentaires(lire('src', 'ui', ecran));
    const garde = code.indexOf("if (texte === '') return;");
    const sonne = code.indexOf('sonDeRefus !== undefined');
    assert.ok(garde >= 0 && sonne > garde,
      `src/ui/${ecran} : le son de refus sonnerait sur un toast effacé`);
  }
});

// ---------------------------------------------------------------------------
// Le lot SON-CÂBLAGE — les boucles, les gestes, et ce qui reste muet
// ---------------------------------------------------------------------------

/**
 * TOUT ce que le jeu peut demander au son, recomposé de bout en bout.
 *
 * ⚠⚠ IL SE CALCULE, IL NE SE RECOPIE PAS. Une liste écrite à la main serait la
 * première à oublier un branchement — et la garde qui compte les sons muets
 * deviendrait alors un mensonge dans le sens le plus dangereux : elle
 * déclarerait muet ce qui sonne.
 */
const PROPRIETAIRES = ['joueur', 'ouvrage'];

/** Un journal qui porte TOUS les faits que le moteur peut publier, une fois chacun. */
function journalExhaustif() {
  const journal = {
    apparitions: [], vagues: [], tirs: [], impacts: [], destructions: [],
  };
  for (const proprietaire of PROPRIETAIRES) {
    journal.vagues.push({ numero: 1, effectif: 1, proprietaire });
    for (const id of Object.keys(UNITES)) {
      journal.apparitions.push({ id, genre: 'unite', proprietaire });
      journal.tirs.push({ id, genre: 'unite', proprietaire });
      journal.destructions.push({ id, genre: 'unite', proprietaire });
    }
    for (const id of Object.keys(DEFENSES)) {
      journal.tirs.push({ id, genre: 'defense', proprietaire });
      journal.destructions.push({ id, genre: 'defense', proprietaire });
    }
    for (const id of [...Object.keys(BASE_BATIMENTS), ...Object.keys(BATIMENTS)]) {
      journal.destructions.push({ id, genre: 'batiment', proprietaire });
    }
    // Les deux bouts de l'échelle d'impact : une égratignure et un coup mortel.
    journal.impacts.push({ id: 'x', genre: 'unite', proprietaire, encaisseMilli: 1, pvMaxMilli: 1000000 });
    journal.impacts.push({ id: 'x', genre: 'unite', proprietaire, encaisseMilli: 999000, pvMaxMilli: 1000000 });
  }
  return journal;
}

const EVENEMENTS_CABLES = (() => {
  const vus = new Set();
  // Les boucles d'écran et de bâtiment : deux tables, sans exception.
  for (const nom of Object.values(AMBIANCE_PAR_ECRAN)) vus.add(nom);
  for (const nom of Object.values(BOUCLES_DE_BATIMENT)) vus.add(nom);
  // ⚠⚠ LES BOUCLES D'UNITÉ PASSENT PAR LA FONCTION, PAS PAR LA TABLE. Depuis le
  // lot JOURNAL-DE-COMBAT, ce que roule une pièce dépend de son CHÂSSIS, de son
  // PROPRIÉTAIRE et de son MOUVEMENT : lire `ROULEMENT_PAR_CHASSIS` seul
  // oublierait les moteurs à l'arrêt, et lire les deux tables oublierait qu'un
  // traversant n'en porte aucune. On demande donc les quatorze unités dans les
  // quatre situations, et c'est la règle elle-même qui répond.
  for (const id of Object.keys(UNITES)) {
    for (const proprietaire of PROPRIETAIRES) {
      for (const enMouvement of [true, false]) {
        const nom = boucleDeLUnite(id, proprietaire, enMouvement);
        if (nom !== null) vus.add(nom);
      }
    }
  }
  // Les gestes : tous les couples que `evenementDuGeste` peut recevoir.
  for (const geste of ['selection', 'deplacement', 'attaque', 'pose', 'amelioration']) {
    for (const genre of ['batiment', 'garnison', null]) {
      const nom = evenementDuGeste(geste, { genre });
      if (nom !== null) vus.add(nom);
    }
  }
  for (const id of Object.keys(BASE_BATIMENTS)) {
    vus.add(evenementDuGeste('retrait', { genre: 'batiment', id }));
  }
  // Le journal : tout ce que la traduction peut rendre, sur un journal qui porte
  // tous les faits possibles.
  for (const nom of evenementsDuJournal(journalExhaustif())) vus.add(nom);
  return [...vus].sort();
})();

// ---------------------------------------------------------------------------
// SON T15 — la réconciliation est pure, et elle est juste
// ---------------------------------------------------------------------------

test('SON T15 — l\'ensemble désiré se déduit de l\'état, et la différence est pure (falsifications n° 18 et n° 19)', () => {
  // 1. LA PURETÉ — le module ne connaît ni le navigateur, ni la simulation, ni
  // l'horloge. C'est ce qui rend la mécanique éprouvable ici.
  const cablage = sansCommentaires(lire('src', 'son', 'cablage.js'));
  const imports = [...cablage.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]).sort();
  assert.deepEqual(imports,
    ['../data/base.js', '../data/combat.js', '../data/sites.js', '../data/sons.js'],
    'src/son/cablage.js a gagné une dépendance : il ne doit lire que des tables');
  for (const interdit of ['AudioContext', 'document', 'window', 'Date.now', 'performance']) {
    assert.ok(!cablage.includes(interdit), `src/son/cablage.js touche à « ${interdit} »`);
  }
  const politique = sansCommentaires(lire('src', 'son', 'politique.js'));
  assert.ok(!politique.includes('AudioContext'), 'la politique connaît Web Audio');

  // 2. L'ENSEMBLE DÉSIRÉ — trois sources, dédoublonnées.
  const vide = bouclesDesirees({ ecran: null, disposition: [], unites: [] });
  assert.deepEqual(vide, [], 'sans écran ni base, rien ne doit sonner');

  const surLaBase = bouclesDesirees({
    ecran: 'chantier',
    disposition: [{ id: 'chantierDeConstruction' }, { id: 'caserne' }, { id: 'centrale' }],
    unites: [],
  });
  assert.deepEqual(surLaBase, [
    AMBIANCE_PAR_ECRAN.chantier, BOUCLES_DE_BATIMENT.caserne, BOUCLES_DE_BATIMENT.centrale,
  ].sort(), 'l\'ensemble désiré sur la base a changé');

  // ⚠⚠ UNE BOUCLE PAR TYPE, PAS PAR BÂTIMENT. Six casernes ne font pas six fois
  // le même bruit ; compter sur le plafond de voix pour les refuser marcherait,
  // et demanderait de savoir combien il en autorise.
  const six = bouclesDesirees({
    ecran: 'chantier',
    disposition: Array.from({ length: 6 }, () => ({ id: 'caserne' })),
    unites: [],
  });
  assert.equal(six.filter((n) => n === BOUCLES_DE_BATIMENT.caserne).length, 1,
    'six casernes demandent six boucles');
  // ⚠ ET LE MONTAGE MESURE QUELQUE CHOSE : la caserne et le dépôt PARTAGENT une
  // boucle, donc le dédoublonnage joue aussi entre deux types différents.
  assert.equal(BOUCLES_DE_BATIMENT.caserne, BOUCLES_DE_BATIMENT.depotDeVehicules,
    'montage : les deux ne partagent plus la même boucle');

  // 3. LA DIFFÉRENCE — pure, et dans les deux sens.
  // Un nom inconnu LÈVE : c'est un câblage mal tapé, donc un fait de programme.
  assert.throws(() => reconcilierLesBoucles(['a_1'], [], ACTIF), RangeError);
  const amb = AMBIANCE_PAR_ECRAN.chantier;
  const mnd = AMBIANCE_PAR_ECRAN.monde;
  assert.deepEqual(reconcilierLesBoucles([amb], [], ACTIF), { demarrer: [amb], arreter: [] });
  assert.deepEqual(reconcilierLesBoucles([amb], [amb], ACTIF), { demarrer: [], arreter: [] });
  assert.deepEqual(reconcilierLesBoucles([mnd], [amb], ACTIF),
    { demarrer: [mnd], arreter: [amb] }, 'changer d\'écran change d\'ambiance');
  // ⚠ LE MUET ARRÊTE, IL N'EMPÊCHE PAS SEULEMENT. Couper le son en laissant une
  // ambiance tourner serait la faute exacte que cette ligne garde.
  assert.deepEqual(reconcilierLesBoucles([amb], [amb], { muet: true, volume: 1 }),
    { demarrer: [], arreter: [amb] }, 'muet ne coupe pas les boucles en cours');
  assert.deepEqual(reconcilierLesBoucles([amb], [amb], { muet: false, volume: 0 }),
    { demarrer: [], arreter: [amb] }, 'un volume nul ne coupe pas les boucles');

  // 4. UN COUP DEMANDÉ EN BOUCLE LÈVE — c'est un fait de programme.
  assert.throws(() => reconcilierLesBoucles(['ui_click'], [], ACTIF), RangeError);
  assert.throws(() => boucleDeLEvenement('ui_click', ACTIF), RangeError);
  assert.throws(() => boucleDeLEvenement('pas_un_evenement', ACTIF), RangeError);
  // Et une boucle rend le gain de son unique variante.
  const b = boucleDeLEvenement(amb, { muet: false, volume: 0.5 });
  assert.equal(b.son, EVENEMENTS[amb].variantes[0]);
  assert.equal(b.gain, gainDuSon(b.son, 0.5));

  // 5. LES SEPT ÉCRANS ONT UNE AMBIANCE, ET AUCUNE N'EST UN COUP.
  const ecrans = [...sansCommentaires(lire('src', 'ui', 'session.js'))
    .matchAll(/const ECRANS = \[([^\]]+)\]/g)][0][1]
    .split(',').map((m) => m.trim().replace(/'/g, '')).filter((m) => m.length > 0);
  assert.equal(ecrans.length, 7, 'le nombre d\'écrans a bougé : relire AMBIANCE_PAR_ECRAN');
  assert.deepEqual(Object.keys(AMBIANCE_PAR_ECRAN).sort(), ecrans.sort(),
    'un écran sans ambiance, ou une ambiance sans écran');
  // ⚠⚠ ET TOUTE BOUCLE CÂBLÉE EN EST UNE, LES ROULEMENTS ET LES MOTEURS COMPRIS.
  // Le pack marque `boucle` sur les 35 sons qui bouclent, et ce marquage est
  // GÉNÉRÉ : brancher un `movement_player_flyby` — qui est un PASSAGE et ne
  // boucle pas — comme roulement d'aéronef fait tomber cette ligne, et c'est la
  // donnée qui l'interdit, pas une liste écrite ici.
  const bouclesCablees = new Set([
    ...Object.values(AMBIANCE_PAR_ECRAN), ...Object.values(BOUCLES_DE_BATIMENT),
  ]);
  for (const id of Object.keys(UNITES)) {
    for (const proprietaire of ['joueur', 'ouvrage']) {
      for (const enMouvement of [true, false]) {
        const nom = boucleDeLUnite(id, proprietaire, enMouvement);
        if (nom !== null) bouclesCablees.add(nom);
      }
    }
  }
  for (const nom of bouclesCablees) {
    assert.ok(nom in EVENEMENTS, `« ${nom} » n'est pas un événement`);
    assert.ok(EVENEMENTS[nom].variantes.every((v) => SONS[v].boucle === true),
      `« ${nom} » est câblé comme une boucle et n'en est pas une`);
  }
  // ⚠ ET AUCUN PASSAGE D'AÉRONEF N'Y EST : un traversant PASSE, il ne roule pas.
  for (const nom of Object.values(PASSAGE_AERIEN)) {
    assert.ok(!bouclesCablees.has(nom), `« ${nom} » est un passage, pas un roulement`);
  }
});

// ---------------------------------------------------------------------------
// SON T16 — une boucle démarre une fois, s'arrête quand sa raison disparaît
// ---------------------------------------------------------------------------

test('SON T16 — la boucle ne se relance pas, et s\'arrête sur une rampe (falsifications n° 20 et n° 21)', async () => {
  const { fenetre, journal } = faussesFenetres();
  const reglages = { ...ACTIF };
  const son = initialiserLeSon(faireDoc(fenetre), { reglages, graine: 5 });

  const base = AMBIANCE_PAR_ECRAN.chantier;
  const carte = AMBIANCE_PAR_ECRAN.monde;
  assert.notEqual(base, carte, 'montage : les deux écrans partagent leur ambiance');

  // ⚠ AVANT LE PREMIER GESTE, RIEN. La réconciliation ne crée pas de contexte :
  // un `AudioContext` né hors d'un geste reste suspendu.
  son.reconcilier([base]);
  assert.equal(journal.contextes, 0, 'la réconciliation a créé un contexte hors geste');
  assert.equal(journal.decodages, 0, 'la réconciliation a décodé hors contexte');

  son.reveiller();
  son.reconcilier([base]);
  assert.equal(journal.decodages, 1, 'la boucle demandée n\'a pas été décodée');
  // ⚠⚠ LA SECONDE RÉCONCILIATION TOMBE AVANT LE DÉCODAGE, et c'est le cas qui
  // compte : sans une entrée posée AVANT la promesse, chaque image relancerait
  // une boucle de plus.
  son.reconcilier([base]);
  son.reconcilier([base]);
  assert.equal(journal.decodages, 1, 'la boucle a été redemandée pendant son décodage');
  await laisserDecoder();
  assert.deepEqual(journal.boucles, [base], 'la boucle n\'a pas démarré, ou a démarré deux fois');

  // Deux images de plus avec le même état : aucun démarrage.
  son.reconcilier([base]);
  son.reconcilier([base]);
  await laisserDecoder();
  assert.deepEqual(journal.boucles, [base], 'un état inchangé a relancé la boucle');

  // ⚠ ELLE DÉMARRE SUR UNE RAMPE, DEPUIS ZÉRO. Sans elle, la forme d'onde saute
  // de zéro à sa valeur en un échantillon et l'oreille entend un clic.
  const traceDemarrage = journal.rampes.at(-1);
  assert.equal(traceDemarrage[0][0], 'pose', 'la boucle ne démarre pas depuis une valeur posée');
  assert.equal(traceDemarrage[0][1], 0, 'la boucle démarre à plein gain');
  assert.equal(traceDemarrage[1][0], 'rampe', 'la boucle ne monte pas en rampe');
  assert.ok(traceDemarrage[1][1] > 0, 'la rampe monte vers un gain nul');

  // LA RAISON DISPARAÎT : on quitte l'écran.
  son.reconcilier([carte]);
  await laisserDecoder();
  assert.equal(journal.arrets.length, 1, 'la boucle ne s\'est pas arrêtée');
  assert.equal(journal.arrets[0].nom, base, 'ce n\'est pas la bonne boucle qui s\'arrête');
  assert.deepEqual(journal.boucles, [base, carte], 'la nouvelle ambiance n\'a pas démarré');

  // ⚠⚠ L'ARRÊT ATTEND LA FIN DE SA RAMPE. Couper au milieu produit exactement le
  // claquement que la rampe existe pour éviter.
  assert.equal(journal.arrets[0].quand, journal.contexte.currentTime + RAMPE_BOUCLE_MS / 1000,
    'la source est coupée avant la fin de sa rampe');
  const traceArret = traceDemarrage;
  assert.equal(traceArret.at(-1)[0], 'rampe', 'l\'arrêt ne descend pas en rampe');
  assert.equal(traceArret.at(-1)[1], 0, 'l\'arrêt ne descend pas jusqu\'à zéro');
  assert.equal(traceArret.at(-1)[2], journal.arrets[0].quand,
    'la rampe de descente et la coupure ne tombent pas au même instant');

  // ⚠⚠ ET LE CURSEUR DE VOLUME TOUCHE CE QUI TOURNE DÉJÀ. Une boucle prend son
  // gain au démarrage et le garderait : le joueur verrait les clics suivre le
  // curseur et l'ambiance rester où elle était jusqu'à ce qu'il change d'écran.
  // Le défaut ne se voit pas à la relecture — il faut avoir le curseur sous le
  // doigt — donc il se mesure ici.
  const traceCarte = journal.rampes.at(-1);
  const longueurAvant = traceCarte.length;
  son.reconcilier([carte]);
  assert.equal(traceCarte.length, longueurAvant,
    'une réconciliation sans changement a touché au gain');
  reglages.volume = 0.25;
  son.reconcilier([carte]);
  assert.ok(traceCarte.length > longueurAvant, 'le curseur ne touche pas la boucle en cours');
  assert.equal(traceCarte.at(-1)[0], 'rampe', 'le gain saute au lieu de ramper');
  assert.equal(traceCarte.at(-1)[1], gainDuSon(EVENEMENTS[carte].variantes[0], 0.25),
    'le nouveau gain n\'est pas celui de la politique');
  reglages.volume = 1;

  // ⚠⚠ ET LE MASQUAGE DE L'APPLICATION LES FAIT TAIRE. `suspendre` arrête la
  // boucle d'IMAGES : plus rien ne réconcilie, donc une ambiance lancée
  // continuerait de tourner pendant que l'application est masquée — ou pendant
  // que le banc d'essai remplace la page. Ce n'est pas un événement de plus,
  // c'est la même réconciliation sur un ensemble vide.
  const codeSession = sansCommentaires(lire('src', 'ui', 'session.js'));
  const corpsSuspendre = codeSession.match(/function suspendre\(\)\s*\{[\s\S]*?\n  \}/);
  assert.ok(corpsSuspendre, 'montage : `suspendre` a changé de forme');
  assert.ok(/son\.reconcilier\(\[\]\)/.test(corpsSuspendre[0]),
    'le masquage de l\'application ne fait pas taire les boucles');

  // Et le muet arrête tout, sans qu'une seconde règle soit écrite ici.
  const muet = initialiserLeSon(faireDoc(fenetre), { reglages: { muet: false, volume: 1 }, graine: 7 });
  muet.reveiller();
  muet.reconcilier([base]);
  await laisserDecoder();
  const avant = journal.arrets.length;
  muet.reconcilier([]);
  assert.equal(journal.arrets.length, avant + 1, 'un ensemble vide n\'arrête pas la boucle');
});

// ---------------------------------------------------------------------------
// SON T17 — la comptabilité mémoire ne perd pas de vue un tampon en lecture
// ---------------------------------------------------------------------------

test('SON T17 — un tampon qu\'une source lit ne s\'évince pas (falsification n° 22)', async () => {
  const { fenetre, journal } = faussesFenetres();
  const son = initialiserLeSon(faireDoc(fenetre), { reglages: { ...ACTIF }, graine: 5 });
  son.reveiller();

  // ⚠⚠ CE QUE CE TEST DÉFEND : `secondesDecodees` doit rester un MAJORANT de ce
  // qui est décodé ET référencé. Évincer une entrée de table ne libère pas le
  // tampon — la source en lecture le tient encore —, donc la comptabilité
  // retomberait alors que la mémoire, elle, ne bougerait pas. Sans boucle le
  // défaut restait borné à la durée d'un coup ; une ambiance de huit secondes
  // rejouée sans fin le rendrait permanent.
  const boucle = ROULEMENT_PAR_CHASSIS.blinde_leger.joueur;
  assert.ok(SONS[EVENEMENTS[boucle].variantes[0]].residente !== true,
    'montage : cette boucle est résidente, l\'éviction ne la regarde pas');
  son.reconcilier([boucle]);
  await laisserDecoder();
  assert.deepEqual(journal.boucles, [boucle], 'montage : la boucle n\'a pas démarré');
  const decodagesDeLaBoucle = () => journal.demandes.filter((n) => n === boucle).length;
  assert.equal(decodagesDeLaBoucle(), 1);

  // On sature le budget PENDANT que la boucle joue. Elle ne doit pas être
  // évincée : si elle l'était, la redemander la redécoderait.
  // ⚠⚠ LE MONTAGE DOIT D'ABORD FAIRE DÉBORDER LE BUDGET, sans quoi l'éviction
  // ne tournerait pas et le test serait vert sur n'importe quel code. On ne
  // prend que des événements à UNE variante — sur un groupe à plusieurs, la
  // variante est TIRÉE et le test mesurerait le tirage — et aucune boucle, pour
  // que le seul tampon tenu soit celui qu'on surveille.
  const coups = Object.entries(EVENEMENTS)
    .filter(([, d]) => d.variantes.length === 1)
    .map(([, d]) => d.variantes[0])
    .filter((n) => SONS[n].residente !== true && SONS[n].boucle !== true && SONS[n].dureeMs >= 100)
    .sort();
  const dureeBoucle = SONS[EVENEMENTS[boucle].variantes[0]].dureeMs / 1000;
  const cumul = coups.reduce((t2, n) => t2 + SONS[n].dureeMs / 1000, 0) + dureeBoucle;
  assert.ok(cumul > MEMOIRE.budgetSecondesDecodees,
    `montage vide : ${cumul} s pour un budget de ${MEMOIRE.budgetSecondesDecodees}`);

  let t = 0;
  const saturer = async () => {
    for (const nom of coups) {
      t += 60;
      journal.contexte.currentTime = t;
      son.jouer(nom);
      await laisserDecoder();
    }
  };
  await saturer();
  // L'éviction a tourné : redemander le premier coup le REDÉCODE.
  const avantCoup = journal.decodages;
  t += 60; journal.contexte.currentTime = t;
  son.jouer(coups[0]);
  await laisserDecoder();
  assert.ok(journal.decodages > avantCoup, 'montage : rien n\'a été évincé du tout');
  assert.equal(decodagesDeLaBoucle(), 1, 'la boucle en cours a été redécodée');

  // ⚠⚠ ET C'EST ICI QUE LA FALSIFICATION MORD, PAS AU-DESSUS. Retirer la
  // protection ne change RIEN d'observable au son : la boucle continue de jouer
  // — sa source tient le tampon — et personne ne la redemande, donc elle n'est
  // pas redécodée. **Mesuré : 23 pass / 0 fail avec la ligne de protection
  // retirée.** Le seul dégât est que la comptabilité cesse de décrire la
  // mémoire, et il ne se voit que sur la comptabilité elle-même. C'est la
  // septième fois que le dépôt vérifie une falsification avant de la croire.
  const m = son.mesureMemoire();
  assert.ok(m.tenus.length > 0, 'montage : plus rien n\'est tenu par une source');
  for (const nom of m.tenus) {
    assert.ok(m.decodes.includes(nom),
      `« ${nom} » est lu par une source et n'est plus compté : `
      + 'la comptabilité a cessé de décrire la mémoire réelle');
  }
  // Et le compte des secondes est EXACTEMENT celui des tampons non résidents.
  const attendu = m.decodes
    .filter((n) => SONS[n].residente !== true)
    .reduce((somme, n) => somme + SONS[n].dureeMs / 1000, 0);
  assert.ok(Math.abs(m.secondesDecodees - attendu) < 1e-9,
    `secondesDecodees vaut ${m.secondesDecodees}, les tampons pèsent ${attendu}`);

  // ⚠ ET DANS L'AUTRE SENS : une fois la boucle ARRÊTÉE, son tampon redevient
  // évinçable. Une protection qui ne se relâche jamais serait une fuite, et le
  // budget ne se libérerait plus jamais.
  son.reconcilier([]);
  await laisserDecoder();
  await saturer();
  son.reconcilier([boucle]);
  await laisserDecoder();
  assert.equal(decodagesDeLaBoucle(), 2,
    'une boucle arrêtée reste protégée : le budget ne se libère jamais');
});

// ---------------------------------------------------------------------------
// SON T18 — la couverture de la carte des unités se MESURE
// ---------------------------------------------------------------------------

test('SON T18 — unit_audio_map.json se résout, et sa couverture se recompte (falsification n° 23)', () => {
  const carte = JSON.parse(lire('art', 'sources', 'unit_audio_map.json'));
  const paires = new Map(Object.keys(UNITES).map((id) => [paireDeLUnite(id), id]));

  // ⚠⚠ LA COUVERTURE SE MESURE DANS LES DEUX SENS, ET ELLE EST TOTALE. Quatorze
  // paires dans la carte, quatorze unités dans le jeu, et les deux ensembles
  // coïncident. C'est ce qui permet de dire qu'aucune unité n'est laissée sans
  // entrée — et donc qu'aucune correspondance n'a été attribuée par ressemblance.
  const dansLaCarte = Object.keys(carte.player);
  assert.equal(dansLaCarte.length, 14, 'le bloc `player` a changé de taille');
  assert.equal(paires.size, 14, 'le roster a changé de taille');
  assert.deepEqual(dansLaCarte.slice().sort(), [...paires.keys()].sort(),
    'la carte et le roster ne nomment pas les mêmes pièces');

  // ⚠⚠ ET LE BLOC `ouvrage` NE SE RÉSOUT PAS — mesuré, zéro sur sept. « essaim »,
  // « marcheur léger », « Dard lourd », « pylône énergétique » ne sont aucun nom
  // du dépôt : ses six boucles restent MUETTES, et leur attribuer une pièce par
  // ressemblance est nommément interdit.
  const nomsDuDepot = new Set(Object.keys(UNITES).flatMap(
    (id) => [UNITES[id].nom.joueur, UNITES[id].nom.ouvrage],
  ));
  const resolues = Object.keys(carte.ouvrage).filter((k) => nomsDuDepot.has(k));
  assert.equal(Object.keys(carte.ouvrage).length, 7, 'le bloc `ouvrage` a changé de taille');
  assert.deepEqual(resolues, [], 'une clé du bloc `ouvrage` se résout : le rapport doit le dire');

  // ⚠⚠ TOUTES LES VALEURS DE LA CARTE SONT DES ÉVÉNEMENTS DU PACK, SEPT CHAMPS
  // COMPRIS. La note du fichier ne le dit que de `variant_set` ; mesuré, c'est
  // vrai des trente-cinq valeurs, et **aucune n'est un identifiant seul** —
  // `movement_player_flyby` est le groupe des trois `_0N`.
  const valeurs = [...new Set(['player', 'ouvrage'].flatMap(
    (bloc) => Object.values(carte[bloc]).flatMap((e) => Object.values(e)),
  ))].sort();
  assert.equal(valeurs.length, 35, 'le nombre de valeurs distinctes a bougé');
  for (const v of valeurs) assert.ok(v in EVENEMENTS, `« ${v} » n'est pas un événement du pack`);

  // ⚠⚠ LES TROIS TABLES DÉRIVÉES SE REJOUENT ICI, EN JAVASCRIPT, CONTRE LA CARTE.
  // C'est ce que le lot SON-CATALOGUE a posé pour `SONS` et que celui-ci étend :
  // le test ne vérifie pas une RECOPIE mais une DÉRIVATION, si bien qu'un
  // `src/data/sons.js` retouché à la main tombe ici.

  // 1. L'ARME — les quatorze paires, et la substitution vers l'Ouvrage.
  // ⚠⚠ ELLE EST VÉRIFIÉE, PAS SUPPOSÉE : on EXIGE que le nom substitué soit un
  // événement du pack. Le jeu a DEUX jeux de noms pour les mêmes quatorze
  // pièces, donc le bloc `player` de la carte les couvre des deux côtés.
  const armes = {};
  for (const [paire, entree] of Object.entries(carte.player)) {
    const joueur = entree.variant_set;
    assert.ok(joueur.includes('_player_'), `« ${joueur} » ne porte pas _player_`);
    const ouvrage = joueur.replace('_player_', '_ouvrage_');
    assert.ok(ouvrage in EVENEMENTS, `« ${joueur} » substitué en « ${ouvrage} », qui n'existe pas`);
    armes[paire] = { joueur, ouvrage };
  }
  assert.deepEqual(ARME_PAR_PAIRE, armes, 'la table des armes et la carte ont divergé');
  assert.equal(Object.keys(ARME_PAR_PAIRE).length, 14, 'une unité a perdu son arme');
  // ⚠ DOUZE `variant_set` DISTINCTS POUR QUATORZE PAIRES, ET C'EST LE PACK QUI
  // LE DIT : Voltigeurs et Fusiliers partagent le fusil, Pionnier et Chasseur le
  // canon moyen. Le brief en annonçait vingt-sept — c'est le nombre de sons
  // `weapon_*`, pas celui des substitutions.
  assert.equal(new Set(Object.values(ARME_PAR_PAIRE).map((c) => c.joueur)).size, 12,
    'le nombre de variant_set distincts a bougé : le rapport doit le redire');
  // ⚠ ET DEUX DES DOUZE NE SONT PAS DES `weapon_*` — le pack fait tirer une
  // EXPLOSION aux Sapeurs et à l'Albatros, et la substitution y marche pareil.
  const nonArmes = [...new Set(Object.values(ARME_PAR_PAIRE).map((c) => c.joueur))]
    .filter((n) => !n.startsWith('weapon_')).sort();
  assert.deepEqual(nonArmes, ['explosion_player_large', 'explosion_player_small'],
    'les deux tirs qui ne sont pas des armes ont changé');

  // 2. LE DÉPLOIEMENT — deux paires sur quatorze, et il ne boucle pas.
  const deploiements = {};
  for (const [paire, entree] of Object.entries(carte.player)) {
    const nom = entree.deploy;
    if (nom === undefined) continue;
    assert.ok(!EVENEMENTS[nom].variantes.every((v) => SONS[v].boucle === true),
      `« ${nom} » boucle : un déploiement est un coup`);
    deploiements[paire] = { joueur: nom, ouvrage: nom.replace('_player_', '_ouvrage_') };
  }
  assert.deepEqual(DEPLOIEMENT_PAR_PAIRE, deploiements, 'la table des déploiements a divergé');
  assert.deepEqual(Object.keys(DEPLOIEMENT_PAR_PAIRE).sort(), ['Obusier/Pilon', 'Pionnier/Bélier'],
    'les deux unités qui se déploient ont changé');

  // 3. LES ROULEMENTS — quatre paires sur quatorze sont CONFRONTÉES à la carte,
  // et les autres lignes de la table sont l'écart assumé d'Ethan.
  const parPaire = {
    'Éclaireur/Ratisseur': 'blinde_leger',
    'Chasseur/Fendeur': 'blinde_moyen',
    'Percheron/Broyeur': 'blinde_lourd',
    'Fusiliers/Meute': 'escouade',
  };
  for (const [paire, archetype] of Object.entries(parPaire)) {
    assert.equal(ROULEMENT_PAR_CHASSIS[archetype].joueur, carte.player[paire].movement,
      `ROULEMENT_PAR_CHASSIS.${archetype} et la carte ne disent pas la même chose`);
  }
  // ⚠ SEPT PAIRES PORTENT UN `movement`, DONT TROIS UN PASSAGE D'AÉRONEF QUI NE
  // BOUCLE PAS. C'est un fait de la CARTE, pas une décision.
  const avecMouvement = Object.values(carte.player).filter((e) => e.movement !== undefined);
  assert.equal(avecMouvement.length, 7, 'le nombre de pièces portant un `movement` a bougé');
  const passages = avecMouvement.filter(
    (e) => !EVENEMENTS[e.movement].variantes.every((v) => SONS[v].boucle === true),
  );
  assert.equal(passages.length, 3, 'le nombre de passages d\'aéronef a bougé');
  assert.ok(passages.every((e) => e.movement === PASSAGE_AERIEN.joueur),
    'un `movement` qui ne boucle pas et qui n\'est pas un passage');

  // ⚠⚠ ET TOUTE UNITÉ A UN ARCHÉTYPE, OU N'EN A PAS BESOIN. Les sept blindés et
  // stoppeurs sont dans `ARCHETYPE_PAR_UNITE` ; les escouades n'y sont pas, leur
  // châssis suffit ; les traversants non plus, ils ne roulent pas. Une quinzième
  // unité mal classée fait LEVER `boucleDeLUnite`, et c'est ce qu'on lui demande.
  for (const id of Object.keys(UNITES)) {
    const unite = UNITES[id];
    const roule = !(unite.chassis === 'aeronef' && unite.comportementAerien === 'traversant');
    const declare = unite.chassis === 'escouade' || ARCHETYPE_PAR_UNITE[id] !== undefined;
    assert.equal(roule, declare, `« ${id} » : archétype et comportement se contredisent`);
  }
  assert.equal(Object.keys(ARCHETYPE_PAR_UNITE).length, 7, 'le nombre d\'archétypes a bougé');
  assert.deepEqual(Object.keys(MOTEUR_PAR_CHASSIS).sort(),
    ['blinde_leger', 'blinde_lourd', 'blinde_moyen'],
    'seuls les blindés font du bruit à l\'arrêt');

  // Et la lecture d'un combat : qui roule, à qui, et qui vient de bouger.
  const id = 'ratisseur';
  const combat = {
    entites: [
      { id, camp: 'attaque', proprietaire: 'joueur', vivant: true, rangeeMilli: 2000 },
      { id, camp: 'attaque', proprietaire: 'joueur', vivant: true, rangeeMilli: 1000 },
      { id, camp: 'attaque', proprietaire: 'ouvrage', vivant: true, rangeeMilli: 2000 },
      { id, camp: 'defense', proprietaire: 'joueur', vivant: true, rangeeMilli: 2000 },
      { id, camp: 'attaque', proprietaire: 'joueur', vivant: false, rangeeMilli: 2000 },
    ],
  };
  const avant = [1000, 1000, 1000, 1000, 1000];
  assert.deepEqual(etatDesUnites(combat, avant), [
    { id, proprietaire: 'joueur', enMouvement: false },
    { id, proprietaire: 'joueur', enMouvement: true },
    { id, proprietaire: 'ouvrage', enMouvement: true },
  ], 'la lecture du mouvement a changé');
  // ⚠ IMMOBILE N'EST PLUS ABSENT : depuis que les moteurs à l'arrêt sont câblés,
  // « n'a pas bougé » est une réponse, pas un silence.
  assert.deepEqual(etatDesUnites(combat, [2000, 1000, 2000, 2000, 2000]), [
    { id, proprietaire: 'joueur', enMouvement: false },
    { id, proprietaire: 'ouvrage', enMouvement: false },
  ], 'une unité immobile n\'est plus lue');
  assert.deepEqual(etatDesUnites(null, null), [], 'sans combat, rien ne roule');
  // ⚠ ET UNE UNITÉ QUI VIENT DE PARAÎTRE N'A PAS DE POSITION D'AVANT : elle
  // n'est ni en mouvement ni à l'arrêt, elle n'est pas encore comparable.
  assert.deepEqual(etatDesUnites(combat, [1000]), [
    { id, proprietaire: 'joueur', enMouvement: true },
  ], 'une unité sans position d\'avant est comptée');
});

// ---------------------------------------------------------------------------
// SON T19 — les gestes, et la règle des trois effondrements
// ---------------------------------------------------------------------------

test('SON T19 — un geste demande un son, et l\'écran n\'en nomme aucun', () => {
  // ⚠ L'ÉCRAN NOMME UN GESTE, JAMAIS UN SON. Aucun identifiant du pack ne doit
  // apparaître dans un écran — c'est la même frontière que `sonDeRefus`.
  for (const nom of ['chantier.js', 'raid.js', 'monde.js', 'offense.js']) {
    const code = sansCommentaires(lire('src', 'ui', nom));
    for (const evenement of Object.keys(EVENEMENTS)) {
      assert.ok(!code.includes(evenement), `src/ui/${nom} nomme le son « ${evenement} »`);
    }
  }
  // ⚠ ET IL NE RECONNAÎT PAS UNE ACTION À SON NOM. Le dépôt a déjà payé ce cas
  // particulier deux fois — `demolir` puis `deplacer` — et le son serait le
  // troisième : le geste est dans la table `ACTIONS`.
  const chantier = sansCommentaires(lire('src', 'ui', 'chantier.js'));
  assert.ok(!/===\s*'demolir'/.test(chantier), 'l\'écran reconnaît « demolir » à son nom');
  assert.ok(chantier.includes('ACTIONS[nom].geste'), 'le geste ne vient plus de la table');
  // ⚠ ET LE GENRE VIENT DE `TERRAINS`, PAS D'UN NOM DE BANDE ÉCRIT AU POINT
  // D'APPEL. Le point unique est `sonner`, qui le LIT ; six appels qui le
  // passeraient chacun à la main seraient six occasions de se tromper de bande.
  assert.ok(/sonDeGeste\(geste, \{ genre: TERRAINS\[terrain\]\.genreSonore, id \}\)/.test(chantier),
    'le genre sonore ne se lit plus dans la table des terrains');
  assert.equal((chantier.match(/sonDeGeste\(/g) ?? []).length, 1,
    'le son part d\'ailleurs que du point unique de l\'écran');
  assert.equal((chantier.match(/(^|[^\p{L}\p{N}_])sonner\(/gu) ?? []).length, 6,
    'le nombre de gestes sonores de l\'écran a bougé : cinq points, plus la fonction');

  // Les cinq gestes de l'écran de la base, et le sixième du raid.
  assert.equal(evenementDuGeste('selection', {}), 'order_player_select');
  assert.equal(evenementDuGeste('deplacement', {}), 'order_player_move');
  assert.equal(evenementDuGeste('attaque', {}), 'order_player_attack');
  assert.equal(evenementDuGeste('pose', { genre: 'batiment' }), 'building_player_complete');
  assert.equal(evenementDuGeste('amelioration', { genre: 'batiment' }), 'building_player_complete');
  // ⚠⚠ UNE PIÈCE DE GARNISON NE SONNE PAS COMME UN BÂTIMENT. Le pack n'a pas de
  // son pour ça, et on n'en détourne aucun : on se tait.
  assert.equal(evenementDuGeste('pose', { genre: 'garnison' }), null);
  assert.equal(evenementDuGeste('retrait', { genre: 'garnison', id: 'merlon' }), null);
  assert.throws(() => evenementDuGeste('inconnu', {}), RangeError);

  // ⚠⚠ LA RÈGLE DES TROIS EFFONDREMENTS EST UNE PROPOSITION, ET ELLE SE MESURE.
  // Le brief donnait « l'empreinte » comme candidat naturel : mesuré, elle ne
  // discrimine RIEN — les onze bâtiments occupent une case. Les PV, eux, se
  // coupent net, et les seuils rendent 3 · 5 · 3.
  const parTaille = { small: [], medium: [], large: [] };
  for (const id of Object.keys(BASE_BATIMENTS)) {
    parTaille[effondrementDuBatiment(id).replace('building_player_collapse_', '')].push(id);
  }
  assert.deepEqual(
    [parTaille.small.length, parTaille.medium.length, parTaille.large.length], [3, 5, 3],
    'la partition des effondrements a bougé : le rapport doit la redire',
  );
  // ⚠ ET AUCUNE CLASSE N'EST VIDE. Une règle qui n'emploierait que deux des
  // trois sons rendrait le troisième inatteignable sans que rien ne le dise.
  for (const [taille, ids] of Object.entries(parTaille)) {
    assert.ok(ids.length > 0, `aucun bâtiment ne rend un effondrement « ${taille} »`);
  }
  // La règle est MONOTONE sur les PV : c'est ce qui la rend lisible.
  const pv = (id) => BASE_BATIMENTS[id].pv;
  assert.ok(Math.max(...parTaille.small.map(pv)) < EFFONDREMENT_PV[0]);
  assert.ok(Math.min(...parTaille.medium.map(pv)) >= EFFONDREMENT_PV[0]);
  assert.ok(Math.max(...parTaille.medium.map(pv)) < EFFONDREMENT_PV[1]);
  assert.ok(Math.min(...parTaille.large.map(pv)) >= EFFONDREMENT_PV[1]);
  assert.throws(() => effondrementDuBatiment('pas_un_batiment'), RangeError);
});

// ---------------------------------------------------------------------------
// SON T20 — ce qui est déclaré muet l'est
// ---------------------------------------------------------------------------

test('SON T20 — les sons déclarés muets le sont, un par un (falsification n° 25)', () => {
  // ⚠⚠ LA LISTE SE CALCULE, ELLE NE SE RECOPIE PAS. Elle est le complément de
  // l'ensemble câblé, lui-même recomposé de bout en bout — tables de boucles ET
  // gestes. Une liste écrite à la main déclarerait muet ce qui sonne le jour où
  // un branchement entre sans qu'on y pense.
  const cables = new Set(EVENEMENTS_CABLES.flatMap((e) => EVENEMENTS[e].variantes));
  // ⚠ LA PART `ui` SE LIT DANS `session.js`, ELLE NE SE RECOPIE PAS. Cinq noms
  // écrits ici seraient la seconde vérité que tout ce fichier refuse par
  // ailleurs : brancher un son de plus dans la session le laisserait déclaré
  // muet, ce qui est le mensonge le plus dangereux de ce test.
  const session = sansCommentaires(lire('src', 'ui', 'session.js'));
  for (const m of session.matchAll(/son\.jouer\('([a-z_0-9]+)'\)/g)) {
    for (const variante of EVENEMENTS[m[1]].variantes) cables.add(variante);
  }
  const muets = Object.keys(SONS).filter((n) => !cables.has(n)).sort();
  assert.equal(cables.size, 169, 'le nombre de sons câblés a bougé');
  assert.equal(muets.length, 94, 'le nombre de sons muets a bougé');

  // ⚠ LES SIX ORDRES DE L'OUVRAGE RESTENT MUETS — il ne donne aucun ordre que
  // le joueur entende. En brancher un fait tomber cette ligne.
  for (const nom of Object.keys(SONS).filter((n) => n.startsWith('order_ouvrage_'))) {
    assert.ok(!cables.has(nom), `${nom} sonne : l'Ouvrage ne donne pas d'ordre au joueur`);
  }
  assert.equal(Object.keys(SONS).filter((n) => n.startsWith('order_ouvrage_')).length, 6);

  // ⚠⚠ `alert_player_insufficient` NE SE CÂBLE PAS, ET C'EST DÉCLARÉ. Le refus
  // sonne déjà `ui_error` depuis le lot SON-MOTEUR, sur le même geste : les deux
  // ensemble feraient sonner deux fois une faute unique. Choisir lequel gagne
  // est une décision de conception — Ethan tranche.
  assert.ok(!cables.has('alert_player_insufficient'), 'le refus sonnerait deux fois');
  assert.ok(cables.has('ui_error_01') && cables.has('ui_error_02'), 'le refus ne sonne plus du tout');

  // ⚠⚠ LE COMBAT SONNE, ET C'EST TOUT LE LOT JOURNAL-DE-COMBAT. La garde
  // précédente exigeait ZÉRO son `alert_`, `weapon_` et `explosion_` au motif
  // qu'il n'y avait « pas de journal de tick » ; le journal existe, donc elle a
  // été RETOURNÉE plutôt que retirée — elle nomme maintenant ce qui reste muet,
  // dans chacune des trois familles, et un branchement de plus la fait tomber.
  //
  // ⚠ SIX ALERTES SUR DIX-HUIT SONNENT — début de vague, pièce perdue, structure
  // perdue, dans les deux camps. Les douze autres demandent un fait que le
  // moteur ne publie pas : il n'a ni « fin de vague », ni « ennemi repéré », ni
  // « artillerie entrante », ni état « base attaquée » qui dure ; et
  // `insufficient` comme `low_power` ont leur motif déclaré depuis le lot
  // précédent — le refus sonne déjà `ui_error`, et le modèle n'a pas d'état
  // « manque de courant ».
  const alertesMuettes = Object.keys(SONS)
    .filter((n) => n.startsWith('alert_') && !cables.has(n)).sort();
  assert.equal(alertesMuettes.length, 12, 'le compte des alertes muettes a bougé');
  for (const suffixe of ['wave_start', 'unit_lost', 'structure_lost']) {
    for (const mot of ['player', 'ouvrage']) {
      assert.ok(cables.has(`alert_${mot}_${suffixe}`), `alert_${mot}_${suffixe} ne sonne plus`);
    }
  }
  // ⚠ CINQ SONS `weapon_*` RESTENT MUETS, ET AUCUN N'EST UN TIR. Trois décrivent
  // un RAYON CONTINU que le moteur n'a pas — il tire par ticks, jamais en
  // continu — et deux décrivent le VOL d'un missile, qui demanderait un
  // projectile en vol : le moteur applique ses dégâts au tick du tir.
  const armesMuettes = Object.keys(SONS)
    .filter((n) => n.startsWith('weapon_') && !cables.has(n)).sort();
  assert.deepEqual(armesMuettes, [
    'weapon_missile_flight_loop', 'weapon_missile_lock',
    'weapon_ouvrage_beam_end', 'weapon_ouvrage_beam_loop', 'weapon_ouvrage_beam_start',
  ], 'la liste des armes muettes a changé : le rapport doit la redire');
  // ⚠ ET LES SIX ÉVÉNEMENTS D'EXPLOSION SONNENT TOUS — trois tailles, deux camps.
  for (const mot of ['player', 'ouvrage']) {
    for (const taille of ['small', 'medium', 'large']) {
      const nom = `explosion_${mot}_${taille}`;
      assert.ok(EVENEMENTS[nom].variantes.every((v) => cables.has(v)),
        `${nom} a cessé de sonner`);
    }
  }
  assert.equal(Object.keys(SONS).filter((n) => n.startsWith('explosion_') && !cables.has(n)).length,
    0, 'un son d\'explosion est muet');

  // ⚠⚠ TRENTE-SIX IMPACTS SUR QUARANTE RESTENT MUETS, ET LE MOTIF EST MESURÉ.
  // Le moteur ne publie un impact que sur une ENTITÉ touchée : il n'a ni tir
  // manqué, ni projectile qui retombe à côté, donc aucune case vide n'est jamais
  // frappée — `dirt`, `quartz`, `scoria`, `energy` et `ricochet` n'ont pas de
  // fait à écouter. Seul le métal sonne, et sur deux tailles.
  const impactsQuiSonnent = Object.keys(SONS)
    .filter((n) => n.startsWith('impact_') && cables.has(n)).sort();
  assert.ok(impactsQuiSonnent.every((n) => n.startsWith('impact_metal_')),
    'un impact autre que du métal sonne : le moteur ne frappe que des entités');
  assert.equal(Object.keys(SONS).filter((n) => n.startsWith('impact_') && !cables.has(n)).length,
    36, 'le compte des impacts muets a bougé');
  // ⚠ ET LE SEUIL `heavy` / `small` EST UNE PROPOSITION, PAS UN ARBITRAGE : il
  // se lit en MILLIÈMES des PV max de la cible, jamais en milli-PV absolus. Un
  // seuil absolu serait vide de sens — `facteurMilli` met dégâts ET PV à
  // l'échelle du niveau, donc l'encaissé d'un même coup va de 67 à 34 683 675
  // milli-PV du niveau 5 au niveau 50, quand la PART, elle, ne bouge pas.
  assert.ok(Number.isInteger(IMPACT_LOURD_MILLIEMES) && IMPACT_LOURD_MILLIEMES > 0
    && IMPACT_LOURD_MILLIEMES < 1000, 'le seuil d\'impact n\'est pas une part');

  // ⚠ LES CINQ AMBIANCES SANS ÉCRAN, NOMMÉES. Trois demandent un CONTEXTE que
  // l'état ne dit pas — « être dans un champ de quartz » ne se lit nulle part —,
  // une décrit la base de l'Ouvrage au repos, qu'aucun écran ne montre, et la
  // dernière est la seconde ambiance de carte, dont le choix est esthétique.
  const ambiancesMuettes = Object.keys(SONS)
    .filter((n) => SONS[n].bus === 'ambiances' && !cables.has(n)).sort();
  assert.deepEqual(ambiancesMuettes, [
    'ambience_base_ouvrage_loop',
    'ambience_map_wind_loop',
    'ambience_quartz_field_loop',
    'ambience_reactor_room_loop',
    'ambience_scoria_field_loop',
  ], 'la liste des ambiances muettes a changé : le rapport doit la redire');

  // ⚠⚠ ET LES SIX MOTEURS À L'ARRÊT SONNENT DÉSORMAIS TOUS. C'est l'une des six
  // décisions rendues par Ethan le 04/09 : un moteur tourne sur « unité vivante
  // et immobile pendant un raid », ce qui est une LECTURE D'ÉTAT et non un
  // événement. Le lot précédent les laissait muets faute de cette règle.
  const moteursMuets = Object.keys(SONS).filter((n) => n.startsWith('engine_') && !cables.has(n));
  assert.deepEqual(moteursMuets, [], 'un moteur est redevenu muet');
  assert.equal(Object.keys(SONS).filter((n) => n.startsWith('engine_')).length, 6);

  // ⚠⚠ ET DOUZE SONS DE BÂTIMENT RESTENT MUETS, POUR DES MOTIFS QUI TIENNENT
  // TOUS AU MODÈLE. Il n'y a ni file de construction, ni réparation qui DURE —
  // c'est un stock depuis le lot RÉSERVE —, ni état « base attaquée » qui
  // persiste ; `power_up` et `power_down` sonneraient une seconde fois les
  // quatre gestes qui sonnent déjà, `capacitesMilli` n'étant fonction que de la
  // disposition ; et l'Ouvrage ne CONSTRUIT rien sous les yeux du joueur.
  const batimentsMuets = Object.keys(SONS)
    .filter((n) => n.startsWith('building_') && !cables.has(n)).sort();
  assert.equal(batimentsMuets.length, 12, 'le compte des sons de bâtiment muets a bougé');
  // ⚠ MAIS LES SIX EFFONDREMENTS SONNENT, DANS LES DEUX CAMPS — c'est le raid
  // qui les fait tomber, et c'est ce que le journal publie.
  for (const mot of ['player', 'ouvrage']) {
    for (const taille of ['small', 'medium', 'large']) {
      assert.ok(cables.has(`building_${mot}_collapse_${taille}`),
        `building_${mot}_collapse_${taille} ne sonne plus`);
    }
  }
});

// ---------------------------------------------------------------------------
// Le lot JOURNAL-DE-COMBAT — ce qu'un fait de combat demande au son
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// SON T21 — la traduction suit le PROPRIÉTAIRE, jamais le camp
// ---------------------------------------------------------------------------

test('SON T21 — un fait se traduit sur son propriétaire, et les seuils se mesurent', () => {
  // ⚠⚠ `camp` ET `proprietaire` SONT DEUX CHOSES, ET C'EST LA FAUTE QUE CE TEST
  // EXISTE POUR ATTRAPER. Le camp dit un côté de grille — le joueur DÉFEND sa
  // propre base, et l'Ouvrage attaque —, le propriétaire dit à qui la pièce est.
  // Lire le camp ferait sonner les Cuirassiers du joueur en Ouvrage dès le
  // premier raid sur sa base. Le journal ne publie que le propriétaire.
  const cablage = sansCommentaires(lire('src', 'son', 'cablage.js'));
  assert.ok(!/\bcamp\b/.test(cablage.replace(/e\.camp !== 'attaque'/g, '')),
    'src/son/cablage.js lit un camp ailleurs que pour écarter les défenseurs immobiles');

  // 1. L'ARME — même pièce, deux propriétaires, deux sons.
  const joueur = armeDuTireur({ id: 'meute', genre: 'unite', proprietaire: 'joueur' });
  const ouvrage = armeDuTireur({ id: 'meute', genre: 'unite', proprietaire: 'ouvrage' });
  assert.equal(joueur, 'weapon_player_rifle');
  assert.equal(ouvrage, 'weapon_ouvrage_rifle');
  assert.notEqual(joueur, ouvrage, 'montage : les deux camps rendraient le même son');

  // ⚠ LES QUATORZE UNITÉS ONT UNE ARME, DANS LES DEUX CAMPS — la couverture est
  // totale et se recompte plutôt que de se supposer.
  for (const id of Object.keys(UNITES)) {
    for (const proprietaire of PROPRIETAIRES) {
      const nom = armeDuTireur({ id, genre: 'unite', proprietaire });
      assert.ok(nom !== null && nom in EVENEMENTS, `« ${id} » n'a pas d'arme en ${proprietaire}`);
    }
  }

  // ⚠⚠ TROIS DÉFENSES SUR NEUF NE TIRENT PAS, ET C'EST LA DONNÉE QUI LE DIT.
  // Leur `degats` vaut `null` ; le moteur ne publiera jamais de tir pour elles,
  // donc `armeDuTireur` est ici une ceinture — et elle se mesure des deux côtés.
  const muettes = Object.keys(DEFENSES).filter((id) => DEFENSES[id].degats === null).sort();
  assert.deepEqual(muettes, ['herse', 'merlon', 'ronce'], 'les défenses qui ne tirent pas ont changé');
  for (const id of Object.keys(DEFENSES)) {
    const nom = armeDuTireur({ id, genre: 'defense', proprietaire: 'joueur' });
    assert.equal(nom === null, muettes.includes(id), `« ${id} » : arme et dégâts se contredisent`);
  }
  // Un bâtiment ne tire pas : `profilBatiment` lui pose `degatsColonne: null`.
  assert.equal(armeDuTireur({ id: 'souche', genre: 'batiment', proprietaire: 'ouvrage' }), null);

  // 2. L'EXPLOSION D'UNE PIÈCE — trois tailles, et la partition se recompte.
  // ⚠⚠ SES SEUILS NE SONT PAS CEUX D'UN BÂTIMENT, ET C'EST MESURÉ. Les pièces
  // vont de 500 à 2 000 PV, les bâtiments de 1 000 à 5 500 : appliquer
  // `EFFONDREMENT_PV` aux pièces les classerait 21 en `small`, 2 en `medium` et
  // AUCUNE en `large`, c'est-à-dire rendrait deux sons sur trois inatteignables.
  const pieces = [
    ...Object.keys(UNITES).map((id) => ({ id, genre: 'unite' })),
    ...Object.keys(DEFENSES).map((id) => ({ id, genre: 'defense' })),
  ];
  const parTaille = { small: 0, medium: 0, large: 0 };
  for (const piece of pieces) {
    const nom = explosionDeLaPiece({ ...piece, proprietaire: 'joueur' });
    parTaille[nom.slice('explosion_player_'.length)] += 1;
  }
  assert.deepEqual(parTaille, { small: 9, medium: 10, large: 4 },
    'la partition des explosions a bougé : le rapport doit la redire');
  const avecEffondrement = { small: 0, medium: 0, large: 0 };
  for (const piece of pieces) {
    const pv = (piece.genre === 'unite' ? UNITES : DEFENSES)[piece.id].pv;
    avecEffondrement[pv >= EFFONDREMENT_PV[1] ? 'large'
      : pv >= EFFONDREMENT_PV[0] ? 'medium' : 'small'] += 1;
  }
  assert.deepEqual(avecEffondrement, { small: 21, medium: 2, large: 0 },
    'les seuils d\'effondrement ne discriminent plus les pièces : deux tables restent deux tables');

  // 3. L'EFFONDREMENT D'UN BÂTIMENT — les deux camps, sur les mêmes seuils.
  const compter = (ids, table, proprietaire) => {
    const vu = { small: 0, medium: 0, large: 0 };
    for (const id of ids) {
      const nom = effondrementDuBatiment(id, proprietaire);
      vu[nom.slice(`building_${proprietaire === 'joueur' ? 'player' : 'ouvrage'}_collapse_`.length)] += 1;
    }
    return vu;
  };
  assert.deepEqual(compter(Object.keys(BASE_BATIMENTS), BASE_BATIMENTS, 'joueur'),
    { small: 3, medium: 5, large: 3 }, 'la partition des bâtiments du joueur a bougé');
  assert.deepEqual(compter(Object.keys(BATIMENTS), BATIMENTS, 'ouvrage'),
    { small: 3, medium: 1, large: 1 }, 'la partition des bâtiments de l\'Ouvrage a bougé');
  // ⚠ LES DEUX TABLES SONT DISJOINTES, ET `verifierArithmetique` de
  // `sim/combat.js` LÈVE si elles cessent de l'être : une seule aurait rendu
  // muet l'effondrement d'une Souche, qui est ce qu'un raid fait tomber en
  // premier.
  const communs = Object.keys(BASE_BATIMENTS).filter((id) => id in BATIMENTS);
  assert.deepEqual(communs, [], 'un identifiant est à la fois bâtiment du joueur et de l\'Ouvrage');

  // ⚠⚠ ET LES QUATRE NOMBRES SONT DES DONNÉES, PAS DU CODE. Les recopier dans
  // `src/son/cablage.js` rendrait le même son aujourd'hui et cesserait de suivre
  // la table demain : la falsification « je réécris les mêmes nombres en dur »
  // est invisible sur le RÉSULTAT — mesuré, 28 pass / 0 fail —, donc c'est la
  // SOURCE qu'on lit. Changer la table, elle, fait tomber trois tests.
  const cablageNu = sansCommentaires(lire('src', 'son', 'cablage.js'));
  for (const nombre of [...EFFONDREMENT_PV, ...EXPLOSION_PV, IMPACT_LOURD_MILLIEMES]) {
    assert.ok(!new RegExp(`(?<![\\p{N}])${nombre}(?![\\p{N}])`, 'u').test(cablageNu),
      `src/son/cablage.js écrit ${nombre} en dur au lieu de lire sa table`);
  }
  for (const nom of ['EFFONDREMENT_PV', 'EXPLOSION_PV', 'IMPACT_LOURD_MILLIEMES']) {
    assert.ok(cablageNu.includes(nom), `src/son/cablage.js ne lit plus ${nom}`);
  }

  // 4. UN PROPRIÉTAIRE INCONNU LÈVE — c'est un câblage mal tapé, donc un fait de
  // programme, jamais un silence.
  assert.throws(() => explosionDeLaPiece({ id: 'meute', genre: 'unite', proprietaire: 'x' }),
    RangeError);
  assert.throws(() => effondrementDuBatiment('caserne', 'x'), RangeError);
  assert.throws(() => effondrementDuBatiment('pas_un_batiment'), RangeError);
  assert.throws(() => explosionDeLaPiece({ id: 'zzz', genre: 'unite', proprietaire: 'joueur' }),
    RangeError);
});

// ---------------------------------------------------------------------------
// SON T22 — le journal se traduit en un ENSEMBLE, et l'impact se lit en PART
// ---------------------------------------------------------------------------

test('SON T22 — un événement distinct sonne au plus une fois par relevé', () => {
  const vide = { apparitions: [], vagues: [], tirs: [], impacts: [], destructions: [] };
  assert.deepEqual(evenementsDuJournal(vide), [], 'un tick sans fait demande un son');
  assert.deepEqual(evenementsDuJournal(null), [], 'un journal absent lève');

  // ⚠⚠ CENT CINQUANTE TIRS DE LA MÊME PIÈCE NE FONT QU'UN SON, ET C'EST LA
  // RÈGLE DU LOT, PAS UN EFFET DE BORD. La simulation avance par TICKS, l'écran
  // par IMAGES, et `ticksDus` en résout jusqu'à douze dans la même image en ×4 :
  // demander un son par tir publié ferait cent cinquante coups de canon dans la
  // même milliseconde. La politique de voix les refuserait — mais compter sur un
  // refus n'est pas une conception : ce serait demander cent cinquante sons pour
  // en obtenir deux, à chaque image.
  const cent = { ...vide, tirs: Array.from({ length: 150 }, (_, i) => ({
    indice: i, id: 'meute', genre: 'unite', proprietaire: 'ouvrage',
  })) };
  assert.deepEqual(evenementsDuJournal(cent), ['weapon_ouvrage_rifle'],
    'cent cinquante tirs demandent plus d\'un son');

  // ⚠ ET DEUX PIÈCES DIFFÉRENTES FONT DEUX SONS : l'ensemble déduplique, il
  // n'écrase pas. Sans cette moitié, la règle serait « un son par relevé ».
  const deux = { ...vide, tirs: [
    { id: 'meute', genre: 'unite', proprietaire: 'ouvrage' },
    { id: 'pilon', genre: 'unite', proprietaire: 'ouvrage' },
  ] };
  assert.deepEqual(evenementsDuJournal(deux),
    ['weapon_ouvrage_artillery', 'weapon_ouvrage_rifle'], 'deux armes ne font pas deux sons');

  // ⚠⚠ L'IMPACT SE LIT EN PART DES PV MAX, JAMAIS EN MILLI-PV ABSOLUS, ET LA
  // RAISON SE MESURE. `facteurMilli` met les dégâts ET les PV à l'échelle du
  // niveau : le même coup encaisse 67 milli-PV au niveau 5 et 34 683 675 au
  // niveau 50, quand la part, elle, ne bouge pas. Un seuil absolu classerait
  // tout `small` en bas de carte et tout `heavy` en haut.
  const impact = (encaisseMilli, pvMaxMilli) => evenementsDuJournal({
    ...vide, impacts: [{ id: 'meute', genre: 'unite', proprietaire: 'joueur', encaisseMilli, pvMaxMilli }],
  });
  const seuil = IMPACT_LOURD_MILLIEMES;
  assert.deepEqual(impact(seuil, 1000), ['impact_metal_heavy'], 'le seuil exact n\'est pas lourd');
  assert.deepEqual(impact(seuil - 1, 1000), ['impact_metal_small'], 'sous le seuil est lourd');
  // La même PART à deux échelles séparées d'un facteur cent mille : même verdict.
  assert.deepEqual(impact(seuil * 100000, 100000000), ['impact_metal_heavy'],
    'la part n\'est pas invariante d\'échelle');
  assert.deepEqual(impact((seuil - 1) * 100000, 100000000), ['impact_metal_small'],
    'la part n\'est pas invariante d\'échelle');

  // ⚠ ET LES DEUX SE MÉLANGENT DANS LE MÊME RELEVÉ — une égratignure et un coup
  // mortel au même tick demandent les deux sons, pas le dernier vu.
  assert.deepEqual(evenementsDuJournal({ ...vide, impacts: [
    { encaisseMilli: 1, pvMaxMilli: 1000000 },
    { encaisseMilli: 999000, pvMaxMilli: 1000000 },
  ] }), ['impact_metal_heavy', 'impact_metal_small'], 'un seul impact est retenu par relevé');

  // La vague, l'apparition, la destruction : chacune son alerte, du côté de qui
  // la subit.
  assert.deepEqual(evenementsDuJournal({ ...vide, vagues: [{ proprietaire: 'joueur' }] }),
    ['alert_player_wave_start']);
  assert.deepEqual(evenementsDuJournal({ ...vide, vagues: [{ proprietaire: 'ouvrage' }] }),
    ['alert_ouvrage_wave_start']);
  assert.deepEqual(evenementsDuJournal({ ...vide, destructions: [
    { id: 'meute', genre: 'unite', proprietaire: 'ouvrage' },
  ] }), ['alert_ouvrage_unit_lost', 'explosion_ouvrage_small'].sort());
  // ⚠ MERLON À 2 000 PV EST UNE GRANDE EXPLOSION, MEUTE À 700 UNE PETITE : les
  // trois tailles se rencontrent pour de bon sur le roster, elles ne sont pas
  // décoratives.
  assert.deepEqual(evenementsDuJournal({ ...vide, destructions: [
    { id: 'merlon', genre: 'defense', proprietaire: 'joueur' },
  ] }), ['alert_player_structure_lost', 'explosion_player_large'].sort());
  assert.deepEqual(evenementsDuJournal({ ...vide, destructions: [
    { id: 'crecelle', genre: 'unite', proprietaire: 'joueur' },
  ] }), ['alert_player_unit_lost', 'explosion_player_medium'].sort());
  assert.deepEqual(evenementsDuJournal({ ...vide, destructions: [
    { id: 'souche', genre: 'batiment', proprietaire: 'ouvrage' },
  ] }), ['alert_ouvrage_structure_lost', 'building_ouvrage_collapse_large'].sort());

  // ⚠ UN TRAVERSANT PASSE À SON APPARITION, ET IL NE ROULE JAMAIS. Les deux
  // moitiés se mesurent ensemble : le passage sonne, la boucle n'existe pas.
  const traversants = Object.keys(UNITES).filter(
    (id) => UNITES[id].chassis === 'aeronef' && UNITES[id].comportementAerien === 'traversant',
  );
  assert.ok(traversants.length > 0, 'montage : aucun traversant dans le roster');
  for (const id of traversants) {
    const vus = evenementsDuJournal({ ...vide, apparitions: [
      { id, genre: 'unite', proprietaire: 'joueur' },
    ] });
    assert.ok(vus.includes(PASSAGE_AERIEN.joueur), `« ${id} » ne fait aucun bruit en passant`);
    assert.equal(boucleDeLUnite(id, 'joueur', true), null, `« ${id} » roule alors qu'il passe`);
  }
  // ⚠ ET LES DEUX UNITÉS QUI SE DÉPLOIENT SONNENT À L'APPARITION, elles aussi —
  // c'est le seul instant que le moteur publie où une pièce se met en place.
  for (const paire of Object.keys(DEPLOIEMENT_PAR_PAIRE)) {
    const id = Object.keys(UNITES).find((u) => paireDeLUnite(u) === paire);
    assert.ok(id !== undefined, `« ${paire} » ne se résout pas`);
    assert.ok(evenementsDuJournal({ ...vide, apparitions: [
      { id, genre: 'unite', proprietaire: 'ouvrage' },
    ] }).includes(DEPLOIEMENT_PAR_PAIRE[paire].ouvrage), `« ${id} » ne se déploie pas`);
  }
});

// ---------------------------------------------------------------------------
// SON T23 — sur des raids RÉELS : ce qui sonne, et ce que ça tient en mémoire
// ---------------------------------------------------------------------------

/**
 * Une fenêtre où un COUP tient son tampon pendant toute sa durée.
 *
 * ⚠⚠ ELLE DIFFÈRE DE `faussesFenetres` SUR LE SEUL POINT QUI COMPTE ICI. Là-bas
 * un coup se termine à l'instant où il commence, ce qui suffit à mesurer
 * l'éviction et fait de `tenus` un ensemble toujours vide ; ici on veut le
 * contraire — savoir combien de tampons une IMAGE de raid tient EN MÊME TEMPS,
 * puisque c'est cela, et non la table, que l'éviction ne peut pas libérer.
 * `avancer(ms)` fait tourner une horloge de papier et relâche ce qui a fini.
 */
function fenetreQuiTient() {
  const journal = { decodages: 0, horlogeMs: 0, enVol: [] };
  class FauxContexte {
    constructor() { this.state = 'suspended'; this.currentTime = 0; this.destination = {}; }
    resume() { this.state = 'running'; return Promise.resolve(); }
    createGain() {
      const gain = {
        value: 1,
        setValueAtTime() {}, linearRampToValueAtTime() {}, cancelScheduledValues() {},
      };
      return { gain, connect: () => {} };
    }
    createBufferSource() {
      const source = {
        buffer: null,
        loop: false,
        onended: null,
        connect: () => {},
        start: () => {
          if (source.loop) return;
          const duree = SONS[source.buffer?.nom]?.dureeMs ?? 0;
          journal.enVol.push({ source, fin: journal.horlogeMs + duree });
        },
        stop: () => { if (source.onended !== null) source.onended(); },
      };
      return source;
    }
    decodeAudioData(octets) {
      journal.decodages += 1;
      return Promise.resolve({ nom: new TextDecoder().decode(octets) });
    }
  }
  journal.avancer = (ms) => {
    journal.horlogeMs += ms;
    const reste = [];
    for (const vol of journal.enVol) {
      if (vol.fin <= journal.horlogeMs) { if (vol.source.onended !== null) vol.source.onended(); }
      else reste.push(vol);
    }
    journal.enVol = reste;
  };
  return { fenetre: { AudioContext: FauxContexte }, journal };
}

test('SON T23 — un raid entier sonne, et la mémoire décodée reste bornée', async () => {
  const { fenetre, journal } = fenetreQuiTient();
  const son = initialiserLeSon(faireDoc(fenetre), { reglages: { ...ACTIF }, graine: 7 });
  son.reveiller();

  const vagues = [[], [], [], []];
  Object.keys(UNITES).forEach((id, i) => {
    vagues[i % 4].push({ id, colonne: (Math.floor(i / 4) % 9) + 1, niveau: 20 });
  });
  const montage = {
    ...genererSite({ type: 'avantPoste', saveur: 'richeQuartz', niveau: 20, graine: 3 }),
    vagues: vagues.filter((v) => v.length > 0),
  };
  const etat = creerCombat(montage);
  etat.maxTicks = 900;

  const vus = new Set(evenementsDuJournal(etat.journal));
  let pireSecondes = 0;
  let pireTenus = 0;
  let ticks = 0;
  // ⚠ LE RELEVÉ SE PREND OÙ L'ÉCRAN PREND SON INSTANTANÉ D'INTERPOLATION, donc
  // une fois par tick joué ; l'image, elle, en résout jusqu'à douze en ×4. On
  // joue ici à ×1 — cent millisecondes par tick — parce que c'est le régime où
  // le plus de sons DISTINCTS atteignent la sortie : en ×4 l'ensemble d'une
  // image les fond, il n'en ajoute pas.
  while (!etat.termine) {
    const avant = etat.entites.map((e) => e.rangeeMilli);
    tick(etat);
    ticks += 1;
    const evenements = evenementsDuJournal(etat.journal);
    for (const nom of evenements) { vus.add(nom); son.jouer(nom); }
    son.reconcilier(bouclesDesirees({
      ecran: 'raid', disposition: [], unites: etatDesUnites(etat, avant),
    }));
    await laisserDecoder();
    const memoire = son.mesureMemoire();
    pireSecondes = Math.max(pireSecondes, memoire.secondesDecodees);
    pireTenus = Math.max(pireTenus, memoire.tenus.length);
    journal.avancer(100);
  }

  assert.ok(ticks > 100, `montage : le combat n'a duré que ${ticks} ticks`);
  // ⚠⚠ ET LE BUDGET TIENT, MESURÉ, PAS SUPPOSÉ. `secondesDecodees` est un
  // MAJORANT de ce qui est décodé ET référencé ; l'éviction le ramène sous le
  // budget à chaque décodage, SAUF sur les tampons qu'une source lit — ce sont
  // eux, et eux seuls, qui pourraient le faire déborder. Ils ne le font pas.
  assert.ok(pireSecondes <= MEMOIRE.budgetSecondesDecodees,
    `la mémoire décodée a atteint ${pireSecondes.toFixed(2)} s pour un budget de `
    + `${MEMOIRE.budgetSecondesDecodees} : le rapport doit donner ce chiffre`);
  // ⚠ ET LE MONTAGE MESURE QUELQUE CHOSE : sans cette ligne, un raid qui ne
  // demanderait aucun son passerait le test précédent sans rien prouver.
  assert.ok(pireSecondes > 1, `montage : le raid n'a décodé que ${pireSecondes} s`);
  assert.ok(pireTenus > 0, 'montage : aucun tampon n\'a jamais été tenu');

  for (const nom of vus) {
    assert.ok(EVENEMENTS_CABLES.includes(nom),
      `« ${nom} » sonne en raid et n'est pas dans l'ensemble câblé : le compte ment`);
  }
});

test('SON T23 bis — ce qu\'un raid ATTEINT, et les seize qu\'aucun écran ne montre', () => {
  // ⚠⚠ CE QU'UN RAID ATTEINT VRAIMENT ET CE QUE LE CÂBLAGE PEUT RENDRE NE SONT
  // PAS LE MÊME NOMBRE, ET IL FAUT LE DIRE DANS CE SENS-LÀ. `src/ui/raid.js` ne
  // montre qu'un raid DU JOUEUR : le propriétaire de l'attaque y est toujours le
  // joueur. Tout ce qui suppose l'Ouvrage attaquant — ses roulements, ses
  // moteurs, son début de vague — ou le joueur défendant — ses bâtiments qui
  // s'effondrent, sa DCA qui tire — n'atteint donc pas la sortie aujourd'hui.
  // Ce n'est pas un câblage manquant, c'est un écran qui n'existe pas : le raid
  // de l'Ouvrage se résout HORS LIGNE depuis le lot RAID-B.
  const vagues = (niveau) => {
    const v = [[], [], [], []];
    Object.keys(UNITES).forEach((id, i) => {
      v[i % 4].push({ id, colonne: (Math.floor(i / 4) % 9) + 1, niveau });
    });
    return v.filter((x) => x.length > 0);
  };
  const vus = new Set();
  let combats = 0;
  for (const graine of [1, 2, 3, 4]) {
    for (const niveau of [5, 20, 50]) {
      for (const [type, saveur] of [
        ['camp', 'richeQuartz'], ['avantPoste', 'richeScorie'], ['base', null],
      ]) {
        const etat = creerCombat({
          ...genererSite({ type, saveur, niveau, graine }), vagues: vagues(niveau),
        });
        etat.maxTicks = 900;
        combats += 1;
        for (const nom of evenementsDuJournal(etat.journal)) vus.add(nom);
        while (!etat.termine) {
          const avant = etat.entites.map((e) => e.rangeeMilli);
          tick(etat);
          for (const nom of evenementsDuJournal(etat.journal)) vus.add(nom);
          for (const nom of bouclesDesirees({
            ecran: 'raid', disposition: [], unites: etatDesUnites(etat, avant),
          })) vus.add(nom);
        }
      }
    }
  }
  assert.equal(combats, 36, 'le balayage a changé de taille');

  // 1. RIEN NE SONNE HORS DE L'ENSEMBLE CÂBLÉ — sans quoi le compte des muets
  // de `SON T20` mentirait dans le sens le plus dangereux.
  for (const nom of vus) {
    assert.ok(EVENEMENTS_CABLES.includes(nom),
      `« ${nom} » sonne en raid et n'est pas dans l'ensemble câblé : le compte ment`);
  }

  // 2. ET CE QUE CE BALAYAGE N'ATTEINT PAS SE NOMME, UN PAR UN. Les seize
  // demandent tous la même chose : que l'Ouvrage attaque, ou que le joueur
  // défende. `weapon_ouvrage_aa_burst` est le seul cas particulier, et il est
  // mesuré aussi — le Frappeur n'apparaît dans AUCUNE garnison que le générateur
  // produit, donc sa rafale n'a personne pour la tirer.
  // ⚠ LE PÉRIMÈTRE SE CALCULE, IL NE SE FILTRE PAS SUR UN PRÉFIXE : c'est
  // exactement ce que le combat peut demander — la traduction d'un journal
  // exhaustif, les boucles d'unité, et l'ambiance de l'écran. Un filtre par
  // préfixe attraperait `building_player_complete`, qui est un GESTE.
  const bouclesEtCombat = new Set([
    ...evenementsDuJournal(journalExhaustif()), AMBIANCE_PAR_ECRAN.raid,
  ]);
  for (const id of Object.keys(UNITES)) {
    for (const proprietaire of PROPRIETAIRES) {
      for (const enMouvement of [true, false]) {
        const nom = boucleDeLUnite(id, proprietaire, enMouvement);
        if (nom !== null) bouclesEtCombat.add(nom);
      }
    }
  }
  const jamais = [...bouclesEtCombat].filter((n) => !vus.has(n)).sort();
  assert.deepEqual(jamais, [
    'alert_ouvrage_wave_start',
    'alert_player_structure_lost',
    'building_player_collapse_large',
    'building_player_collapse_medium',
    'building_player_collapse_small',
    'engine_ouvrage_heavy_idle_loop',
    'engine_ouvrage_light_idle_loop',
    'engine_ouvrage_medium_idle_loop',
    'movement_essaim_ouvrage_loop',
    'movement_ouvrage_deploy',
    'movement_ouvrage_flyby',
    'movement_walker_heavy_loop',
    'movement_walker_light_loop',
    'movement_walker_medium_loop',
    'weapon_ouvrage_aa_burst',
    'weapon_player_aa',
  ], 'ce qu\'un raid atteint a bougé : le rapport doit redonner les deux comptes');

  // ⚠ ET LE MONTAGE MESURE QUELQUE CHOSE : sans cette ligne, un balayage qui
  // n'atteindrait rien du tout passerait l'égalité ci-dessus à condition d'avoir
  // la bonne longueur, et le premier test ne dirait rien non plus.
  assert.ok(vus.size >= 45, `le balayage n'a atteint que ${vus.size} événements`);
  for (const nom of ['weapon_player_rifle', 'weapon_ouvrage_machinegun', 'impact_metal_heavy',
    'impact_metal_small', 'alert_player_wave_start', 'alert_ouvrage_unit_lost',
    'building_ouvrage_collapse_large', 'movement_tracks_heavy_loop',
    'engine_player_medium_idle_loop']) {
    assert.ok(vus.has(nom), `« ${nom} » n'a pas sonné en trente-six raids`);
  }
});

// ---------------------------------------------------------------------------
// SON T24 — le relevé se prend à l'instantané, et l'Instantané ne relève rien
// ---------------------------------------------------------------------------

test('SON T24 — le déroulé sonne, le mode Instantané se tait par construction (falsifications n° 10 et n° 11)', () => {
  const raid = sansCommentaires(lire('src', 'ui', 'raid.js'));

  // ⚠⚠ UN SEUL ENDROIT AVANCE D'UN TICK EN RELEVANT, ET C'EST CELUI OÙ
  // L'INSTANTANÉ D'INTERPOLATION SE PREND. `precedentes` sert l'interpolation,
  // le journal sert le son, et les deux ne valent que pour le tick qu'on vient
  // de jouer : les séparer ferait relever un journal déjà écrasé, ou interpoler
  // sur des positions qui ne sont plus celles d'avant.
  const corps = raid.match(/function avancerDUnTick\(\) \{([\s\S]*?)\n  \}/);
  assert.ok(corps !== null, 'avancerDUnTick a disparu');
  const lignes = corps[1].split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  assert.deepEqual(lignes, [
    'precedentes = prendrePositions(combat);', 'tickCombat(combat);', 'relever();',
  ], 'l\'instantané et le relevé se sont séparés');

  // ⚠⚠ ET « INSTANTANÉ » NE PASSE PAS PAR LÀ — c'est ce qui le rend MUET, et ce
  // n'est pas un cas particulier écrit à la main : il boucle sur `tickCombat`
  // sans prendre d'instantané, exactement comme avant le lot. Un combat résolu
  // d'un coup n'a pas de déroulé, donc rien à sonner ; l'y brancher demanderait
  // cent cinquante coups de canon dans la même milliseconde.
  const bloc = raid.match(/brancher\('raid-instantane', \(\) => \{([\s\S]*?)\n  \}\);/);
  assert.ok(bloc !== null, 'le bouton Instantané a disparu');
  assert.ok(!bloc[1].includes('avancerDUnTick'), 'l\'Instantané relève le journal');
  assert.ok(!bloc[1].includes('relever('), 'l\'Instantané relève le journal');
  assert.ok(/while \(!combat\.termine\) tickCombat\(combat\);/.test(bloc[1]),
    'l\'Instantané ne résout plus d\'un bloc');
  // Le pas à pas, lui, passe par le même chemin que la boucle : un seul endroit.
  const pas = raid.match(/brancher\('raid-pas', \(\) => \{([\s\S]*?)\n  \}\);/);
  assert.ok(pas[1].includes('avancerDUnTick();'), 'le pas à pas ne relève plus');
  assert.equal((raid.match(/avancerDUnTick\(\);/g) ?? []).length, 2,
    'le nombre de points qui avancent d\'un tick a bougé');

  // ⚠⚠ ET LE CORPS DU RELEVÉ SE LIT AUSSI, PARCE QU'UNE GARDE QUI NE REGARDE QUE
  // L'APPEL NE MORD PAS. Mesuré : remplacer `evenementsDuJournal(combat.journal)`
  // par la même liste tronquée à zéro laisse toute la suite VERTE — l'écran est
  // hors de portée des tests, faute de DOM (CLAUDE.md §3), donc rien d'autre ne
  // peut le dire. On lit donc les trois lignes, comme pour `avancerDUnTick`.
  const releve = raid.match(/function relever\(\) \{([\s\S]*?)\n  \}/);
  assert.ok(releve !== null, 'relever a disparu');
  assert.deepEqual(releve[1].split('\n').map((l) => l.trim()).filter((l) => l.length > 0), [
    'if (combat === null) return;',
    'for (const evenement of evenementsDuJournal(combat.journal)) {',
    'evenementsSonores.add(evenement);',
    '}',
  ], 'le relevé ne verse plus le journal entier dans l\'ensemble en attente');

  // ⚠ ET L'ACCESSEUR VIDE CE QU'IL REND. Sans cela le même son se redemanderait
  // à chaque image jusqu'à la fin du combat — la politique de voix le
  // refuserait, et « compter sur un refus n'est pas une conception ».
  const accesseur = raid.match(/evenementsSonores\(\) \{([\s\S]*?)\n    \}/);
  assert.ok(accesseur !== null, 'l\'accesseur a disparu');
  assert.ok(accesseur[1].includes('evenementsSonores.clear();'), 'le relevé ne se vide pas');

  // ⚠ ET L'ÉCRAN NE NOMME AUCUN SON — il rend des noms d'ÉVÉNEMENT qui sortent
  // de `src/son/cablage.js`, et la session les joue. La garde `SON T14` refuse
  // déjà tout `jouer(` ici ; celle-ci refuse les noms eux-mêmes.
  for (const nom of Object.keys(SONS)) {
    assert.ok(!raid.includes(`'${nom}'`), `src/ui/raid.js nomme le son « ${nom} »`);
  }
});
