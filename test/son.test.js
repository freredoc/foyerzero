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

import { SONS, EVENEMENTS, BUS, MEMOIRE, REGLAGES_PAR_DEFAUT } from '../src/data/sons.js';
import { creerVoix, demanderUnSon, gainDuSon } from '../src/son/politique.js';
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
  const journal = { contextes: 0, decodages: 0, demandes: [], joues: [], contexte: null };
  class FauxContexte {
    constructor() {
      journal.contextes += 1;
      journal.contexte = this;
      this.state = 'suspended';
      this.currentTime = 0;
      this.destination = { nom: 'sortie' };
    }
    resume() { this.state = 'running'; return Promise.resolve(); }
    createGain() { return { gain: { value: 1 }, connect: () => {} }; }
    createBufferSource() {
      const source = { buffer: null, connect: () => {}, start: () => { journal.joues.push(source.buffer); } };
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

  // ⚠ ET LES 240 SONS HORS `ui` SONT LIVRÉS SANS ÊTRE DEMANDÉS. C'est voulu, et
  // c'est mesuré plutôt qu'affirmé : les événements atteignables ne portent que
  // des sons de la famille `ui`.
  const atteignables = [...new Set(appels)].flatMap((e) => EVENEMENTS[e].variantes);
  assert.equal(atteignables.length, 5, 'le nombre de sons atteignables a bougé');
  assert.ok(atteignables.every((n) => n.startsWith('ui_')),
    'un son hors de la famille `ui` est atteignable');

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
