# RAPPORT — lot RAID-0 : simuler sans commettre, et laisser une unité à la maison

Écrit le 01/09/2026, sur disque, à la racine. Brief : `BRIEF-lotRAID-0.md`.
Aucun `RAPPORT-lotRAID-0.md` n'existait à la racine avant celui-ci.

---

## 1. Version et build produits

| Grandeur | Avant | Après |
| --- | --- | --- |
| `version` | 0.60.0 | **0.61.0** |
| `config.build` | `"61"` | **`"62"`** |

⚠ **LES DEUX RESTENT DES CHAÎNES**, vérifié par exécution : `typeof` rend
`string` pour les deux. C'est le piège de `CLAUDE.md` §6 — Kotlin les lit
`as String`, et un nombre fait tomber le build Android à la CONFIGURATION.

---

## 2. Base de référence du §1 — retrouvée sur le dépôt

| Grandeur | Attendu | Mesuré | Verdict |
| --- | --- | --- | --- |
| version / build | 0.60.0 / 61 | 0.60.0 / 61 | ✅ |
| `dist/index.html` | 1 339 813 o | **1 339 813 o** | ✅ |
| suite | 799 pass / 0 fail | **799 pass / 0 fail** | ✅ |
| `SAVE_VERSION` | 17 | 17 | ✅ |
| `executerRaid` | `raid.js:225` | 225 | ✅ |
| `composerLesVagues` | `raid.js:108` | 108 | ✅ |
| Node | v22.22.2 | v22.22.2 | ✅ |

**Base intégralement reproduite.** Le point d'arrêt du §7 ne s'est pas déclenché.

⚠ La branche a été **repartie de `main`** (`8dc05c3`, merge de la PR #53) et non
empilée sur l'historique déjà fusionné du lot RÉSERVE.

---

## 3. Delta et comptes

| Grandeur | Avant | Après | Delta |
| --- | --- | --- | --- |
| `dist/index.html` | 1 339 813 o | **1 340 077 o** | **+264 o** |
| Tests | 799 | **808** | +9 |

Aucune image, aucun atlas : c'est du code et des commentaires. La borne T10 de
1 400 000 n'a pas été touchée ; marge **59 923 octets, 4,28 %**.

**Suite finale : `npm run check` → build OK, `808 pass / 0 fail`**, mesuré depuis
un `dist/` supprimé. 0 référence externe (seul `w3.org/2000/svg`, l'identifiant
toléré).

---

## 4. Chaque test du §6, avec le montage de falsification effectivement joué

Injection de défaut **sur une copie fraîche** (`src/` et `test/` recopiés depuis
le dépôt avant chaque injection), jamais sur l'arbre de travail. **Neuf
falsifications jouées, neuf ROUGE.**

| # | Test | Falsification injectée | Verdict |
| --- | --- | --- | --- |
| T1 | simulé ≡ exécuté, champ par champ, 3 cibles de niveaux 18 / 20 / 22 | `cout` du rapport simulé décalé de +1 | **ROUGE** ✅ |
| T2 | état réel intact : `serialiser` avant ≡ après, chaîne contre chaîne | `const copie = etat` — simuler sur l'état réel | **ROUGE** ✅ |
| T3 | simuler ne consomme rien, pas même un point d'attaque | `etat.attaque.points -= 1` dans `simulerRaid` | **ROUGE** ✅ |
| T4 | une pièce `actif: false` ne monte pas dans les vagues | `!piece.actif` au lieu de `=== false` | **ROUGE** ✅ |
| T5 | une pièce **sans le champ** part quand même | idem — c'est le test prévu pour ça | **ROUGE** ✅ |
| T6 | `niveauDeLArmee` et le plafond de réserve ne bougent pas | filtrer les inactives dans `niveauDeLArmee` | **ROUGE** ✅ |
| T7 | les dégâts retombent sur les bonnes pièces | `{ indices.push(index); continue; }` — sauter la pièce sans sauter son indice | **ROUGE** ✅ |
| T8 | `sans-armee`, message à trois causes | message ramené à ses deux anciennes causes | **ROUGE** ✅ |
| T9 | le champ traverse la sauvegarde ; v17 migrée toute active | migration posant `actif: false` | **ROUGE** ✅ |
| T9 bis | — | **retrait du champ dans la liste fermée du `push`** | **ROUGE** ✅ |
| T10 | un raid toutes unités actives rend ce qu'il rendait avant | *(la suite existante, non retouchée)* | ✅ **PASS** |

### ⚠ T4 s'est révélée PLUS forte que le brief ne l'annonçait

Le §6 prévoyait que la falsification `!piece.actif` **passerait** T4 et ne serait
attrapée que par T5. Mesuré : **elle fait tomber T4 aussi**, parce que T4 se
termine en réactivant la pièce et en comparant les indices à ceux du montage de
départ — lequel porte des pièces **sans** le champ.

Et l'effet réel est bien plus large que prévu : ce seul mot fait tomber **la
moitié de `raid.test.js`**, tous les montages historiques du dépôt poussant leurs
pièces sans `actif`. L'avertissement du brief est confirmé au-delà de sa lettre.

### ⚠ T10 — ce qui compte le plus, et ce qui a dû bouger quand même

Les 799 tests existants passent. **Quatre assertions ont été retouchées, toutes
mécaniques**, aucune sémantique : le numéro `SAVE_VERSION` écrit en dur
(`state.test.js` ×2, `recherche.test.js` ×1) et la garde « bump oublié » de
`reparation.test.js`, **déplacée** vers `raid.test.js` — la convention du dépôt
veut qu'elle vive au maillon le plus récent, une seule fois. `reparation.test.js`
garde la forme `SAVE_VERSION >= 17`, identique à celle qu'elle remplace.

**Aucune assertion de combat, de butin, de recherche ou de report de dégâts n'a
été touchée.** C'est la preuve demandée : un raid toutes unités actives rend
exactement ce qu'il rendait avant.

---

## 5. La mesure M1 — le coût d'une copie

| Grandeur | Valeur |
| --- | --- |
| **Coût d'un `structuredClone`** | **0,078 ms**, moyenne sur 100 appels, après 20 de chauffe |
| Seuil du brief | 5 ms |
| Marge | **64 fois sous le seuil** |

**État mesuré** — une partie avancée, pas un état neuf : graine 2026, **500 000
ticks** rattrapés (≈ 13,9 h de jeu), Chantier au niveau 30, 6 bâtiments posés
(Caserne, Dépôt de véhicules, Aérodrome, Centre de commandement, Complexe de
défense), **armée pleine à 36 pièces** — les quatre vagues de neuf
d'`EMPLACEMENTS_ASSAUT` —, posées par `poserEffectif`, donc par le geste permis.
Sérialisation de l'état : **4 425 octets**.

**Rien n'a été optimisé**, conformément au brief. Le simulateur est interactif et
le joueur cliquera dessus des dizaines de fois : à 0,078 ms, mille simulations
d'affilée coûtent 78 ms.

---

## 6. Le recensement du §5.1 — chaque lecteur de `etat.armee`

Grep sur le **champ**, pas sur la fonction. Douze lecteurs, dans six fichiers.

| Lecteur | Fichier | Verdict | Pourquoi |
| --- | --- | --- | --- |
| `composerLesVagues` | `sim/raid.js:110` | **TOUCHÉ** | C'est le seul endroit qui filtre. Le `continue` précède les deux `push`. |
| `reporterLesDegats` | `sim/raid.js:381` | **non touché** | Il lit par `indices`, que `composerLesVagues` tient aligné. Il LÈVE déjà si le compte des attaquants ne tombe pas juste — c'est ce qui rend T7 tranchant. |
| `niveauDeLArmee` | `sim/niveau-de-base.js` | **non touché, et c'est la décision §2.4** | Une inactive est POSÉE, donc elle compte. La filtrer ouvrirait l'exploit du plafond de réserve (T6). |
| `plafondDeLaReserve` | `sim/reparation.js:173` | **non touché** | Il lit `niveauDeLArmee`, qui ne bouge pas. C'est la victime de l'exploit ci-dessus, et T6 la garde. |
| `coutDeLaReparation` | `sim/reparation.js:228` | **non touché** | §5.2 : la réparation ignore l'activité. Une unité désactivée est abîmée, elle a un bâtiment, elle se répare. |
| `reservoirsDeLArmee` | `sim/reparation.js:295, 307` | **non touché** | Même raison. |
| `devisDeLaReparation` | `sim/reparation.js:336` | **non touché** | Même raison. |
| `reparerUnePiece` | `sim/reparation.js:448` | **non touché** | Même raison. Écrit `degatsMilli`, jamais `actif`. |
| `toutReparer` | `sim/reparation.js:511` | **non touché** | Même raison : elle répare tout le payable, actif ou non. |
| `niveauDeLArmee` (missions) | `sim/missions.js:117` | **non touché** | Le tutoriel lit une moyenne, qui ne bouge pas. |
| `niveauDeLArmee` (points d'attaque) | `sim/points-attaque.js:128` | **non touché** | Il en tire le plafond de points d'attaque — **second bénéficiaire de la décision §2.4** : sans elle, désactiver ferait monter ce plafond-là aussi. |
| `ui/offense.js`, `ui/chantier.js` | 8 points | **non touchés** | Aucun fichier de `src/ui/` n'est modifié par ce lot (§0). L'éditeur affiche et déplace ; `deplacerEffectif` mutant la pièce EN PLACE, le drapeau survit à un déplacement — vérifié. |

### ⚠ Deux écrivains que le brief ne listait pas, et qui comptaient

- **`poserEffectif` pousse une liste FERMÉE** (`state.js`) : `id`, axe, colonne,
  `niveau`, `degatsMilli`. Un champ passé par l'appelant et absent de cette liste
  **disparaît en silence** — c'est le piège d'`ajouterEntite` que `CLAUDE.md` §6
  documente déjà. Servir le défaut aux deux endroits nommés par le brief sans
  l'ajouter là aurait donné une pièce active à la validation et une pièce **sans
  le champ** en sauvegarde ; elle serait partie quand même, par le défaut de
  `composerLesVagues`, si bien que **le drapeau n'aurait jamais rien retenu et
  qu'aucun raid de référence n'aurait bronché**. Le défaut est donc servi aux
  deux endroits du brief **et** nommé dans le `push`. T9 bis le garde.
- **`deplacerEffectif` mutant en place** — vérifié : `piece[f.axe] = …`,
  `piece.colonne = …`. Le drapeau survit à un déplacement, rien à faire.

---

## 7. Écarts par rapport au brief

Trois, tous consignés.

### 7.1 `reglerActivite` a été ajoutée — le brief ne la nommait pas

Le §3 liste les localisations et n'inclut aucun mutateur. **Sans lui, le drapeau
n'est pas basculable sur une pièce déjà posée**, donc la deuxième moitié du §0 —
« un bouton activer / désactiver » — n'est pas livrée :

- `poserEffectif` POSE une pièce neuve ; elle ne bascule rien ;
- retirer puis reposer perdrait `degatsMilli`, donc **désactiver deviendrait une
  réparation gratuite**, ce qui contredit le §2.3 (« elle reste dans l'armée ») ;
- écrire `etat.armee[i].actif` depuis l'écran est **interdit par le dépôt** :
  `CLAUDE.md` — « L'ÉCRAN N'ÉCRIT PAS DANS L'ÉTAT : `reglerTutoriel` est dans
  `sim/state.js`, comme `poser` et `ameliorer` ».

`reglerActivite(etat, force, index, actif)` suit donc le précédent
`reglerTutoriel` à la lettre : elle mute EN PLACE, l'indice ne bouge pas, et elle
**lève** sur une force qui ne porte pas le drapeau. Aucun écran n'est ouvert.

### 7.2 `simulerRaid` fait suivre la base attaquante à la copie

Le §4.1 donne un corps de trois lignes qui passe `baseAttaquante` tel quel. Une
ligne a été ajoutée : `const base = baseAttaquante === etat ? copie : baseAttaquante`.

**Ce n'est pas un correctif, c'est une ceinture** — et le rapport le dit pour
qu'on ne croie pas qu'il manquait quelque chose. Aujourd'hui `basesDuJoueur` rend
`[etat]`, l'appelant passe l'état deux fois, et `executerRaid` ne **lit** que
`baseAttaquante.position` : rien ne fuit. Le jour du multi-bases, si elle écrit
sur la base attaquante, passer l'original ferait fuir la simulation sur l'état
réel — et T2 ne le dirait que si quelqu'un le relançait ce jour-là.

### 7.3 Le drapeau est porté par la FORCE, pas posé sur les deux

Le §4.4 ne migre que `s.armee`. Pour que la pose et la migration s'accordent, la
garnison ne reçoit pas le champ non plus : `FORCES.garnison.porteLActivite` vaut
`false`, `FORCES.armee` vaut `true`. C'est le motif exact de `surLeTerrain`, dont
le commentaire dit déjà que reconnaître une force **par son nom** serait « le
premier cas particulier écrit à la main ». T9 asserte l'absence du champ côté
garnison, et la levée de `reglerActivite` dessus.

---

## 8. Points en suspens

### 8.1 Volontairement non traités — le §2.7

**Aucun fichier de `src/ui/` n'a été touché**, vérifié. Restent à RAID-A :
l'écran de raid, le bandeau « SIMULATEUR », les vitesses ×1 ×2 ×4, le rejeu
visuel. Rien n'a été commencé.

### 8.2 Ouverts par ce lot

- **`verifierEtat` ne valide pas `actif`.** `problemesDeLEffectif` contrôle
  `id`, l'axe, la colonne, le niveau et les dégâts ; un `actif: "oui"` traverserait
  et serait traité comme actif (tout ce qui n'est pas `false` part). Sans
  conséquence — la valeur est lue par une seule comparaison —, mais c'est une
  validation que le brief ne demandait pas et que je n'ai pas ajoutée d'initiative.
- **Aucun « tout activer / tout désactiver ».** RAID-A voudra probablement le
  second ; il se pose sur `reglerActivite`, en une boucle, du côté de l'écran ou
  d'une fonction de `sim/`. Non tranché.
- **Trois niveaux de cible différents sont inatteignables depuis le départ**, et
  c'est une propriété de la carte, pas du lot : la garde du peuplement écarte les
  bases de l'Ouvrage de quinze cases du départ, et la strate y vaut 1 — deux camps
  de niveau 1 et un avant-poste de niveau 2, mesuré. T1 déplace donc la base sur
  le couloir (rangée 200), seule façon honnête d'avoir des niveaux distincts
  (18 / 20 / 22). Le montage le dit en toutes lettres.
- **`simule: true` n'est lu par personne**, faute d'écran. C'est le champ qui
  permettra au bandeau « SIMULATEUR » de ne jamais se confondre avec un vrai raid.
