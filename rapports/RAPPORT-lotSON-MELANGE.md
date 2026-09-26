# RAPPORT — lot SON-MÉLANGE (26/09/2026)

Retour d'Ethan du 25/09, point 6 : « Son toujours pas changé malgré les lots…
j'entends toujours les premiers bruits qui font tamtam. Pas de bruit de
déplacement. Certains n'ont plus de sons. Ou parfois les deux en même temps. »
Arbitrages : « enlever les sons d'impacts » ; « Ne pas limiter à 3 tirs, faire
un mélange de tirs par pondération. »

**Version et build produits : 0.99.79 · build 191**, les deux en chaînes.
Sur le téléphone, l'écran Options doit afficher **« v0.99.79 · b191 »** — voir §7.

⚠⚠ **L'ÉCOUTE N'A PAS ÉTÉ FAITE.** Ce conteneur n'a ni haut-parleur ni appareil
(`CLAUDE.md` §3). Tout ce qui suit est mesuré sur la politique de voix, sur le
vrai adaptateur `src/ui/son.js` branché sur un faux `AudioContext`, et sur la
suite. **Ethan vérifie sur le S25 FE.**

---

## 1. Base

Le brief a été mesuré sur `78af575` (1 668 déclarés, 10 606 810 octets,
0.99.76 · 188, `SAVE_VERSION` 41). Deux lots ont été fusionnés depuis —
BARRES-ET-RÉPARER (#170) puis ÉTAI-RÉTABLI (#171) — et **leurs nombres font
foi**, comme le brief le prévoit. Base relevée par exécution avant toute ligne,
sur `main` = `9dd71e2` :

| grandeur | valeur mesurée |
|---|---|
| tests | **1 671 déclarés — 1 670 pass · 0 fail · 1 skipped** |
| `dist/index.html` | **10 611 332 octets** |
| version · build | **0.99.78 · 190** |
| `SAVE_VERSION` | **42** |

Base verte. ⚠ Le brief attendait « 1669 pass » en sortie ; la base réelle en
compte trois de plus, donc la sortie en compte **1 672 déclarés**.

⚠ **Collision annoncée par le brief, vérifiée** : BARRES-ET-RÉPARER touche
`src/ui/raid.js` (`agirSur`, `surPointerDown`, « Tout réparer », le peintre de
grille). Ce lot a été écrit APRÈS sa fusion, donc sur le fichier qui le porte :
il n'y a rien eu à relire, les deux zones ne se touchent pas.

## 2. Le raid du §1, refait sur le code livré

Harnais JETABLE, source en annexe. ⚠ **Écart déclaré** : le brief le voulait
« dans `tools/` » ; il est resté dans le bloc-notes de la session et n'est **pas
commité** — un outil qui n'est dans aucune chaîne et qu'aucune garde ne lance
est un fichier qui pourrit (§2 de `CLAUDE.md`, `verif.mjs`). Sa source est en
annexe, telle qu'elle a tourné, et elle tourne sur les deux arbres.

Montage : 35 s à ×1 (350 ticks de 100 ms), les quatorze unités du joueur au
niveau 20 réparties sur les quatre vagues contre un avant-poste `richeQuartz`
de niveau 20, graine 3. Le VRAI `src/ui/son.js` sur un faux `AudioContext`
dont l'horloge avance par pas de 10 ms et qui décode en **30 ms**. L'ordre de
la session : réconcilier les boucles, puis vider les coups, puis les tirs.
Rejoué sur un `git worktree` de `main` = `9dd71e2` (où `tirsDuJournal`
n'existe pas : les tirs y passent par `evenementsDuJournal`, comme la session
d'alors) puis sur l'arbre du lot.

| sons joués | `main` (9dd71e2) | lot |
|---|---|---|
| tous sons non bouclés | 690 | **353** |
| impacts | **563** | **0** |
| tirs du joueur (armes vraies) | **0** | **91** |
| tirs du joueur, explosions de Sapeurs/Albatros comprises | 44 | **145** |
| tirs de l'Ouvrage | 65 | **167** |
| explosions de destruction | 3 | 15 |
| décodages | 77 | 111 |
| boucles démarrées (distinctes) | 8 (7) | 22 (10) |

Tirs demandés par le journal : **638 pour le joueur, 963 pour l'Ouvrage**, des
deux côtés. Rapport joué / demandé : joueur **0,069 → 0,227**, Ouvrage
**0,067 → 0,173**.

⚠ Les « 44 » tirs du joueur sur `main` ne sont PAS des tirs d'arme : ce sont
les sons d'explosion que le pack donne aux Sapeurs et à l'Albatros
(`explosion_player_large/small`), que la cadence laissait passer. Hors ces
deux-là, `main` jouait **zéro** tir du joueur, ce que le §1 du brief annonçait.
Les trois boucles de plus sont les **moteurs à l'arrêt** du joueur
(`engine_player_{heavy,light,medium}_idle_loop`), qui ne sonnaient jamais.

### Proportion : la condition d'arrêt n'est pas atteinte, et l'écart se déclare

Le brief demande « zéro impact et des tirs du joueur dans la proportion de leurs
demandes ». Zéro impact : tenu. Proportion : le joueur pèse **39,8 %** des
demandes (638 / 1 601) et **46,5 %** des tirs joués (145 / 312). Il est
**sur-représenté de 6,7 points**, pas sous-représenté — le défaut d'Ethan
(« certains n'ont plus de sons ») est corrigé dans le bon sens, et l'écart a une
cause mécanique :

`choisirLesTirs` tire les CANDIDATS DISTINCTS d'un relevé au poids de leurs
occurrences, sans remise, et accorde une voix libre à chacun dans l'ordre du
tirage. Le poids décide donc de l'ORDRE d'accès aux voix, et chaque événement
sonne au plus une fois par relevé. Le joueur tire avec **onze** événements
d'arme distincts sur ce raid, l'Ouvrage avec **quatre** : à nombre de voix égal,
le camp qui a plus d'armes distinctes occupe plus de voix. Un mélange qui
reproduirait exactement les demandes devrait laisser un même son occuper
plusieurs voix du même relevé — ce qui recréerait le « tamtam » du §1.
**Le rapport le dit plutôt que de le régler** ; si Ethan entend l'Ouvrage trop
discret, le levier est `VOIX_PAR_BUS.armes`, pas la pondération.

## 3. `enMouvement`

Sur le même raid, lectures de `etatDesUnites` : **`main` 1 635 vrai / 0 faux**
— toutes les unités « roulaient », parce que la comparaison opposait un nombre
à un objet ; **lot 1 061 vrai / 574 faux**. Les six moteurs à l'arrêt, qui ne
pouvaient jamais sonner, sonnent (§2).

## 4. Les onze réécritures du §7.1 — ce que chacun gardait, ce qu'il garde

Aucune assertion n'a été retirée sans le dire ; chaque réécriture qui retire un
compte le remplace par un `notEqual` qui refuse l'ancien nombre.

- **SON T8 bis** — gardait : deux demandes rapprochées font UN décodage, et le
  tampon sert ensuite. Garde en plus : la demande qui attend sa lecture SONNE à
  la résolution (joués 1 puis 2), et `RETARD_MAX_DECODAGE_MS` (150) est borné
  des deux côtés — 0 et 150 ms sonnent, 160 se tait.
- **SON T8 ter** — gardait : un décodage raté se tait et les autres sonnent
  (joués 1). Garde : la première demande sonne à la résolution (joués 2), et
  tout tampon joué est bien `ui_toggle_on`.
- **SON T14** — gardait : les littéraux de `son.jouer`, 165 atteignables /
  98 muets, deux `sonDeRefus`. Garde : lit `son.jouer(…)` ET
  `jouerLeSonDUnGeste(…)` ; exactement UN `son.jouer('ui_click')` ; l'écouteur
  de capture abaisse `gesteSonne` une fois ; la garde `if (gesteSonne) return;`
  suit dans les 200 caractères ; le drapeau est levé une fois ;
  `son.jouerLesTirs(ecranRaid.tirsSonores())` une fois ; **157 atteignables**
  (`notEqual` 165) ; aucun impact atteignable ; 106 muets.
- **SON T18** — gardait : la lecture du mouvement. Garde : les positions sont
  des objets `{rangeeMilli, colonneMilli}` — la forme de `prendrePositions`,
  assertée ; un combat comparé à son propre instantané rend tout `enMouvement`
  faux ; un pas en colonne seule EST un mouvement.
- **SON T20** — gardait : 165 câblés. Garde : **157** (`notEqual` 165),
  106 muets, et les **44 impacts muets sont les 44 du catalogue**. L'assertion
  sur `IMPACT_LOURD_MILLIEMES` part avec la constante.
- **SON T21** — gardait : le seuil d'impact lourd. Garde : `cablage.js` ne lit
  plus `IMPACT_LOURD`, `encaisseMilli` ni `pvMaxMilli`, et `data/sons.js` ne
  porte plus `IMPACT_LOURD`.
- **SON T22** — gardait : cent tirs du même canon font un son. Garde :
  `evenementsDuJournal(cent)` est VIDE ; `tirsDuJournal(cent)` rend 150 entrées,
  toutes le fusil, ordre conservé ; un tireur muet (la Ronce) ne compte pas ;
  `tirsDuJournal(vide|null)` rend `[]`.
- **SON T23 bis** — gardait : ce que 36 raids atteignent. Garde : l'instantané
  vient de `prendrePositions` ; les tirs passent par `tirsDuJournal` ; **aucun
  son d'impact** sur les 36 raids ; et sept événements EXIGÉS —
  `weapon_player_rifle`, `weapon_ouvrage_machinegun`, `alert_player_wave_start`,
  `alert_ouvrage_unit_lost`, `building_ouvrage_collapse_large`,
  `movement_tracks_heavy_loop`, `engine_player_medium_idle_loop`.
- **SON T24** — gardait : le relevé dans `avancerDUnTick`. Garde :
  `tirsSonores.push(...tirsDuJournal(combat.journal));`, les tirs ne passent pas
  par l'ensemble `evenementsSonores`, et l'accesseur rend
  `tirsSonores.splice(0)`.
- **SB T2** — gardait : une cadence de trois par seconde sur le bus `armes`.
  Garde : `VOIX_PAR_BUS` n'a qu'une clé, `armes`, entière et positive ;
  plafond + 4 tirs distincts → exactement `plafond` accordés, sur des fichiers
  distincts ; les voix se libèrent à la fin du son, pas une milliseconde avant ;
  aucune cadence ne subsiste ; le résultat ne dépend pas de l'ordre des tirs ;
  `creerVoix` n'a plus que `gardes`, `graine`, `instances` ; et
  `GARDE_PAR_BUS` / `gardesBus` n'existent plus dans `src/son`, `src/data`,
  `src/ui`.
- **SB T3** — gardait : au plus 31 sons d'armes en 10 s. Garde : l'occupation
  maximale du bus vaut EXACTEMENT le plafond sur un raid saturé, et ne le
  dépasse jamais ; les tirs joués restent sous le dixième des demandes ; les
  alertes n'y sont pas soumises ; les boucles démarrent ensemble ; et
  `VOIX_PAR_BUS` n'est lu que par `choisirLesTirs`.

## 5. Falsifications, messages réels

**MIX T1**, les deux du brief :

- tirer toujours le premier candidat trié → `le tir rare sort 1000 fois sur 1000 pour un poids de 1 sur 100`
- tirer sans pondération → `le tir rare sort 486 fois sur 1000 pour un poids de 1 sur 100`

Les autres, une par mécanisme :

- plafond retiré de `choisirLesTirs` → SB T2 `10 voix accordées pour 10 tirs distincts : le plafond ne tient pas` (10 !== 6), SB T3 `217 voix d'armes vivantes au même instant pour un plafond de 6`, MIX T1 `lot 0 : 2 décisions pour une voix libre` (2 !== 1).
- `>` au lieu de `>=` → SB T2, SB T3 `7 voix d'armes vivantes au même instant pour un plafond de 6`, MIX T1.
- `gardesBus` remis dans `creerVoix` → SB T2 seul.
- `etatDesUnites` comparant un nombre à un objet → SON T18 `la lecture du mouvement a changé`, SON T23 bis `ce qu'un raid atteint a bougé : le rapport doit redonner les deux comptes`.
- mouvement lu sur la seule rangée → SON T18 `un pas en colonne seule ne se lit pas comme un mouvement`.
- `tirsDuJournal` dédoublonné → SON T22 `un tir sur cent cinquante a disparu : le poids ment` (1 !== 150).
- impacts retraduits → SON T14 (161 !== 157), SON T20 (161 !== 157), SON T22, SON T23 bis.

### Relecture hostile, répondue par la suite

- *Un des onze tests a-t-il été affaibli pour passer ?* Non : chaque falsification
  ci-dessus fait tomber au moins un des onze, et les comptes retirés sont
  remplacés par des `notEqual` sur l'ancien nombre.
- *`choisirLesTirs` peut-il rendre plus de décisions que de voix libres ?* Non,
  et c'est la suite qui le dit : MIX T1 asserte, lot par lot, « N décisions pour
  N voix libres » et tombe sur `lot 0 : 2 décisions pour une voix libre` dès que
  le plafond saute ; SB T3 asserte que l'occupation ne dépasse jamais le plafond.

## 6. Ce qui reste ouvert

- **Le réglage de `VOIX_PAR_BUS.armes` (6) se fait à l'oreille.** Mesuré sur le
  raid simulé : 312 tirs joués pour 1 601 demandés, environ neuf par seconde.
  Le « 245 » du brief était celui de son prototype et ne se recopie pas.
- Hors périmètre (§6 du brief), non touché : le remplacement des 93 événements
  du pack d'origine ; les niveaux des boucles ; **67 événements non câblés**
  (65, plus les deux familles d'impact) ; « Instantané » reste muet ; aucun Opus
  n'est retiré — les **44 impacts, 70 582 octets d'Opus**, restent au livrable ;
  aucun volume ne bouge ; `SAVE_VERSION` reste à **42**.
- Relevé, non corrigé : dans `test/son.test.js`, `fenetreQuiTient()` monte un
  `FauxContexte` dont `currentTime` ne bouge jamais — la politique de SON T23 y
  voit une horloge figée. **Antérieur au lot** (présent sur `9dd71e2`), sans
  effet sur ce qu'il mesure, à reprendre.
- `choisirLesTirs` consomme un tirage par candidat, qu'il sonne ou non. Le
  commentaire de `tirer` qui affirmait qu'« un son refusé par le plafond ne
  consomme pas de tirage » était faux pour le plafond : réécrit.

## 7. Vérification sur l'appareil

Une mise à jour téléchargée passe avant la copie de l'APK et **s'applique au
lancement suivant** (`android/maj/src/main/kotlin/fr/freredoc/foyerzero/maj/GestionnaireVersions.kt`
L.74) : après la mise à jour, fermer et rouvrir le jeu, puis lire dans Options
**« v0.99.79 · b191 »**. Si un autre numéro s'affiche, ce qui s'entend n'est pas
ce lot. À écouter : plus de « tamtam » d'impacts au début d'un raid ; les tirs
du joueur ET ceux de l'Ouvrage ; le roulement des unités qui avancent et le
ralenti des blindés arrêtés ; un seul son par bouton.

## 8. Mesures du livrable

`npm run build` → `dist/index.html`, **10 612 153 octets**, 0 référence externe.
Coût **+821 octets, ENTIÈREMENT DU JAVASCRIPT** (449 559 → 450 380), `data:` à
**316 lignes / 315 URI** des deux côtés. Borne T10 **10 820 000, non touchée**,
marge **207 847 octets, 1,92 %**. `PIC T7` réancré, avec un `notEqual` qui
refuse 208 668. ⚠ Le brief annonçait **+781** pour son prototype : **40 octets
d'écart, non attribués** — le prototype n'est pas au dépôt.

`npm test` : **1 672 déclarés — 1 671 pass · 0 fail · 1 skipped** (`LIMITE T8`).
Un test entre, `MIX T1` ; onze sont réécrits ; `test/` reste à 81 fichiers.

`python3 tools/verifier.py` : **965 identiques · 176 différents · 0 nouveau · 0 MANQUANT**, en 649,9 s,
code de sortie 1. Les 176 se répartissent **132 `bâtiment/` · 24 `defense/` · 18 `socle/` ·
2 `chassis/`** — exactement la répartition préexistante que `CLAUDE.md` documente depuis
le lot RUINES-DÉFENSE (écart d'encodeur PNG, zéro pixel) —, et la ligne `ATLAS` est la
même que sur `main`. ⚠ **Aucun fichier de `son/` n'est parmi les différents : les 263
`.opus` sont identiques à l'octet**, ce qui est ce que ce lot devait prouver — le
changement de `tools/sons.py` porte sur la TABLE, jamais sur l'encodage. ⚠ La
comparaison au pristine n'a PAS été rejouée à ce lot : le verdict est confronté à la
répartition documentée, pas remesuré sur `9dd71e2`. `entrees.py --verifier` :
**518 / 518 consommées, 175 / 175 dormantes**, attente et réserve 0 lu.

Fichiers touchés : `package.json`, `src/data/sons.js` (généré),
`src/son/{cablage,politique}.js`, `src/ui/{raid,session,son}.js`,
`test/{journal,pictogramme,son}.test.js`, `tools/sons.py`, `CLAUDE.md` et ce
rapport. **Pas une ligne de `src/sim/`, `src/render/`, `art/`** ; `tools/sons.py`
ne change que sa table écrite dans `src/data/`, jamais l'encodage.

⚠ Branche : l'environnement d'exécution épingle la session à
`claude/new-session-cfw5ar`.

---

## Annexe — le harnais du §2, tel qu'il a tourné

```js
// Harnais JETABLE du lot SON-MÉLANGE, brief §10 point 2 — jamais commité.
// Rejoue le raid simulé du §1 : 35 s à ×1 (350 ticks de 100 ms), les quatorze
// unités du joueur au niveau 20 contre un avant-poste niveau 20, en faisant
// passer le VRAI `src/ui/son.js` sur un faux `AudioContext` dont l'horloge
// avance par pas de 10 ms et qui décode en 30 ms.
//
// Usage : node harnais-son-melange.mjs <racine du dépôt>
// La même source tourne sur le code livré ET sur un worktree de `main` : sur
// `main`, `jouerLesTirs` n'existe pas et les tirs passent par
// `evenementsDuJournal`, exactement comme la session d'alors.
const racine = process.argv[2];
const { initialiserLeSon, idDuSon } = await import(`${racine}/src/ui/son.js`);
const { SONS, EVENEMENTS } = await import(`${racine}/src/data/sons.js`);
const { UNITES } = await import(`${racine}/src/data/combat.js`);
const { creerCombat, tick } = await import(`${racine}/src/sim/combat.js`);
const { genererSite } = await import(`${racine}/src/sim/generateur.js`);
const { prendrePositions } = await import(`${racine}/src/render/interpolation.js`);
const cablage = await import(`${racine}/src/son/cablage.js`);
const { evenementsDuJournal, etatDesUnites, bouclesDesirees, armeDuTireur,
  explosionDeLaPiece } = cablage;
const tirsDuJournal = cablage.tirsDuJournal ?? null;

const DECODAGE_MS = 30;
const PAS_MS = 10;
const TICKS = 350;

// --- Le faux AudioContext -------------------------------------------------
const trace = { joues: [], boucles: [], decodages: 0 };
let horlogeMs = 0;
let enVol = [];
let decodagesEnCours = [];
class FauxContexte {
  constructor() { this.state = 'suspended'; this.destination = {}; }
  get currentTime() { return horlogeMs / 1000; }
  resume() { this.state = 'running'; return Promise.resolve(); }
  createGain() {
    const gain = { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {},
      cancelScheduledValues() {} };
    return { gain, connect: () => {} };
  }
  createBufferSource() {
    const source = {
      buffer: null, loop: false, onended: null, connect: () => {},
      start: () => {
        const nom = source.buffer?.nom;
        if (source.loop) { trace.boucles.push(nom); return; }
        trace.joues.push({ nom, a: horlogeMs });
        enVol.push({ source, fin: horlogeMs + (SONS[nom]?.dureeMs ?? 0) });
      },
      stop: () => { if (source.onended !== null) source.onended(); },
    };
    return source;
  }
  decodeAudioData(octets) {
    trace.decodages += 1;
    const nom = new TextDecoder().decode(octets);
    return new Promise((resoudre) => {
      decodagesEnCours.push({ fin: horlogeMs + DECODAGE_MS, resoudre, nom });
    });
  }
}
const balises = new Map();
for (const nom of Object.keys(SONS)) {
  balises.set(idDuSon(nom), { getAttribute: () => `data:audio/ogg;base64,${btoa(nom)}` });
}
const doc = { defaultView: { AudioContext: FauxContexte },
  getElementById: (id) => balises.get(id) ?? null };

const vider = async () => { for (let i = 0; i < 20; i += 1) await Promise.resolve(); };
async function avancer(ms) {
  for (let t = 0; t < ms; t += PAS_MS) {
    horlogeMs += PAS_MS;
    const prets = decodagesEnCours.filter((d) => d.fin <= horlogeMs);
    decodagesEnCours = decodagesEnCours.filter((d) => d.fin > horlogeMs);
    for (const d of prets) d.resoudre({ nom: d.nom });
    const reste = [];
    for (const v of enVol) {
      if (v.fin <= horlogeMs) { if (v.source.onended !== null) v.source.onended(); }
      else reste.push(v);
    }
    enVol = reste;
    await vider();
  }
}

// --- Le raid ----------------------------------------------------------------
const son = initialiserLeSon(doc, { reglages: { muet: false, volume: 1 }, graine: 7 });
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

const demandes = { joueur: 0, ouvrage: 0 };
const armesDe = { joueur: new Set(), ouvrage: new Set() };
const explosionsDeDestruction = new Set();
let enMouvementVrai = 0;
let enMouvementFaux = 0;
let ticks = 0;
while (!etat.termine && ticks < TICKS) {
  const avant = prendrePositions(etat);
  tick(etat);
  ticks += 1;
  for (const fait of etat.journal.tirs) {
    const arme = armeDuTireur(fait);
    if (arme === null) continue;
    demandes[fait.proprietaire] += 1;
    armesDe[fait.proprietaire].add(arme);
  }
  for (const fait of etat.journal.destructions) {
    if (fait.genre !== 'batiment') explosionsDeDestruction.add(explosionDeLaPiece(fait));
  }
  const unites = etatDesUnites(etat, avant);
  for (const u of unites) { if (u.enMouvement) enMouvementVrai += 1; else enMouvementFaux += 1; }
  // L'ordre de la session : réconcilier les boucles, puis vider les coups.
  son.reconcilier(bouclesDesirees({ ecran: 'raid', disposition: [], unites }));
  for (const nom of evenementsDuJournal(etat.journal)) son.jouer(nom);
  if (tirsDuJournal !== null) son.jouerLesTirs(tirsDuJournal(etat.journal));
  await avancer(100);
}
await avancer(500);

// --- Le classement ----------------------------------------------------------
const evenementDuSon = new Map();
for (const [evenement, def] of Object.entries(EVENEMENTS)) {
  for (const v of def.variantes) evenementDuSon.set(v, evenement);
}
const compte = { impacts: 0, tirsJoueur: 0, tirsOuvrage: 0, explosions: 0,
  explosionsTirees: 0, explosionsTousUsages: 0, tirsJoueurHorsExplosion: 0, autres: 0 };
const autres = new Map();
for (const { nom } of trace.joues) {
  const ev = evenementDuSon.get(nom);
  if (nom.startsWith('impact_')) compte.impacts += 1;
  else if (armesDe.joueur.has(ev)) compte.tirsJoueur += 1;
  else if (armesDe.ouvrage.has(ev)) compte.tirsOuvrage += 1;
  else if (ev.startsWith('explosion_')) compte.explosions += 1;
  else { compte.autres += 1; autres.set(ev, (autres.get(ev) ?? 0) + 1); }
  if (ev.startsWith('explosion_')) compte.explosionsTousUsages += 1;
  if (armesDe.joueur.has(ev) && !ev.startsWith('explosion_')) compte.tirsJoueurHorsExplosion += 1;
}
const chevauchement = [...armesDe.joueur].filter((a) => armesDe.ouvrage.has(a)
  || explosionsDeDestruction.has(a));
console.log(JSON.stringify({
  racine, ticks, dureeSecondes: ticks / 10, termine: etat.termine,
  joues: trace.joues.length, decodages: trace.decodages,
  bouclesDemarrees: trace.boucles.length, bouclesDistinctes: [...new Set(trace.boucles)].sort(),
  ...compte,
  demandes,
  rapportJoueur: +(compte.tirsJoueur / demandes.joueur).toFixed(3),
  rapportOuvrage: +(compte.tirsOuvrage / demandes.ouvrage).toFixed(3),
  enMouvementVrai, enMouvementFaux,
  armesJoueur: [...armesDe.joueur].sort(), armesOuvrage: [...armesDe.ouvrage].sort(),
  chevauchement,
  autres: Object.fromEntries([...autres].sort()),
}, null, 2));
```
