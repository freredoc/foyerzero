# RAPPORT — lot CARTE : peuplement, terrain de départ, obstacles

Exécuté le 29/08/2026. **Données et simulation seulement — aucun écran.**

Tous les nombres de ce rapport ont été obtenus **par exécution**, jamais estimés.

---

## 1. Départ et arrivée, mesurés

| | Avant | Après |
|---|---|---|
| Version | 0.26.0 · build 27 | **0.27.0 · build 28** |
| `npm test` | 401 pass / 0 fail | **411 pass / 0 fail** (+10) |
| `dist/index.html` | 179 928 octets | **181 014 octets** (+1 086) |
| Marge sous la borne T10 | 10 % | **9,5 %** |
| `SAVE_VERSION` | 7 | **7 — inchangée** |

⚠ **AUCUNE MIGRATION.** Le lot n'ajoute rien à l'état : le peuplement est une
FONCTION, le terrain de départ une table servie à la lecture. C'est ce qui a
permis de le livrer sans toucher `sim/state.js`.

⚠ Les deux champs de `package.json` sont restés des **chaînes**, édités
textuellement et jamais par un sérialiseur JSON.

---

## 2. Ce que le lot livre

**`src/sim/peuplement.js`** — nouveau. Où sont les bases de l'Ouvrage, dérivé de
la graine et de la case, jamais stocké. La règle des huit cases y est appliquée
**localement** : une case candidate devient une base si son hachage domine celui
de ses huit voisines candidates, si bien que le contact est impossible par
construction, sans jamais parcourir la carte.

**`PEUPLEMENT`, `SATELLITES`, `ZOOM_CARTE`** dans `data/sites.js`, et la carte
passe de **30 à 31 colonnes**.

**`TERRAIN_INITIAL` et `OBSTACLES_DE_BASE`** dans `data/base.js` — ton dessin,
transcrit case par case, champs et obstacles.

**`obstaclesDeLaBase`** dans `sim/champs.js`, et `champsDeLaBase` qui sert la
table à la fondation initiale.

**`placerObstacles`** du générateur, cantonné à la bande de défense.

---

## 3. Les mesures qui décident

### La densité

Moyenne des fenêtres 12 × 12 **entièrement hors de la garde**, sur quatre
graines :

| p | 0,10 | 0,12 | **0,14** | 0,16 | 0,20 |
|---|---|---|---|---|---|
| bases par 12 × 12 | 9,9 | 11,1 | **12,1** | 12,8 | 14,0 |

⚠ **HORS DE LA GARDE, ET C'EST LE PIÈGE DU LOT.** Une fenêtre prise dans les
quinze cases autour du départ porte zéro base par construction. Les compter fait
tomber la moyenne à **10,8** et donne l'impression que le réglage est faux alors
qu'il est juste. Le test écarte ces fenêtres, et vérifie qu'il en reste plus de
200 pour que la mesure vaille quelque chose.

### La carte produite

| Graine | 1 | 7 | 42 | 1234 |
|---|---|---|---|---|
| bases | 719 | 694 | 713 | 736 |

Zéro contact sur les trois graines balayées entièrement. La plus proche du
départ est à **exactement 15** cases.

### Le centre

`colonneCentre()` rendait déjà 16 pour une largeur de 30, par un arbitrage entre
15 et 16. À 31, **16 est le centre exact** : la fonction rend le même nombre, le
départ (275, 16) et la base terminale ne bougent pas. Le test a changé de sens et
il est strictement **plus fort** — il exigeait « largeur paire », il exige
maintenant autant de colonnes à gauche qu'à droite, ce que l'ancienne version ne
pouvait pas asserter.

### Ton dessin

Il est **inatteignable par la graine**, et c'est mesuré : les 9 300 positions de
la carte rendent 9 300 terrains distincts, **aucun n'est le tien**, le plus
proche en diffère de neuf cases sur soixante-douze. Et changer la graine du monde
n'y aurait rien fait — le terrain se tire de la seule POSITION.

Il **respecte les règles du tirage**, vérifié et non supposé : douze cases, 6/6,
toutes entre les rangées 12 et 17 et les colonnes 2 et 8, aucun bloc de plus de
trois cases une fois les blocs **reconstruits par composantes connexes**, et
jamais deux blocs de même ressource au contact par un côté.

---

## 4. Ce que le déplacement des obstacles a coûté

Cantonner les dix obstacles à la bande de défense double leur densité — dix sur
72 cases au lieu de 144 — et les met **tous** sur le chemin de l'assaut. Sept
constantes de combat mesurées ont bougé :

| Test | Avant | Après |
|---|---|---|
| `cible` T4 — durée | 383 | **313** |
| `cible` T4 — survivants | 2 | **0** |
| `assaut` T7 — figés A / B / C | 321 / 583 / 551 | **669 / 608 / 524** |
| `assaut` T7 — budgétés A / C | 434 / 315 | **429 / 305** |
| `roster` T5 — miroir | 175 | **174** |
| `roster` T6 — butin A | 320 | **237** |
| `roster` T6 — butin B | 34 977 | **37 221** |

⚠ **CE N'EST PAS UN ALLONGEMENT UNIFORME**, et c'est ce qui rend le changement
intéressant : A perd 26 % de butin pendant que B en gagne 6 %. Les obstacles ne
font pas que ralentir, ils changent **qui meurt et quand**.

⚠ **QUATRE RAIDS SUR 54 TOUCHENT MAINTENANT LE PLAFOND DE 90 SECONDES**, contre
deux. La liste change des deux côtés — `infanterie/base/11` en sort, il se
conclut au tick 861 — donc ce n'est pas un simple décalage.

**Aucun des quatre n'est un gel**, vérifié comme au lot 3C en portant
`dureeMaxCombatSec` à 600 : tous se concluent par `attaquants`, aux ticks 1 080,
4 645, 948 et 2 019.

⚠ **LE 4 645 EST À REMONTER.** Quatre cent soixante-quatre secondes de combat,
soit cinq fois le plafond. Ce n'est plus un dépassement, c'est un autre régime.

---

## 5. Falsification — cinq défauts, cinq fois rouge

| Défaut injecté | Rouge |
|---|---|
| l'exclusion des huit voisines est retirée | 2 tests |
| la garde passe de 15 à 40 cases | 1 test |
| les deux sels du hachage n'en font plus qu'un | 1 test |
| les obstacles du générateur reviennent sur les rangées 3 à 18 | 1 test |
| la table du terrain initial est rendue par référence, pas copiée | 1 test |

⚠ **LA DEUXIÈME LIGNE MÉRITE UNE PRÉCISION, PARCE QU'ELLE N'A PAS ÉTÉ ATTRAPÉE
PAR LE TEST QU'ON CROIRAIT.** Le test de la garde compare la base la plus proche
à `PEUPLEMENT.gardeAutourDuDepart` : élargir la garde **dans la donnée** élargit
aussi l'assertion, et il passe. Ce qu'il tient, c'est que le code obéit à la
donnée — un `15` écrit en dur le ferait tomber. C'est le test de la répartition
des niveaux qui a rattrapé l'élargissement, en constatant qu'il ne restait plus
assez de bases basses. Les deux sont nécessaires ; aucun ne suffit.

---

## 6. Écarts, et ce qui a été corrigé avant de livrer

1. **La maquette a changé de terrain.** `baseDeLaMaquette` de `chantier.test.js`
   appelait `champsDeLaBase(275, 16)`, désormais servi par ta table, qui ne porte
   aucun champ sous ses cinq collecteurs. Le terrain de la maquette est
   maintenant **transcrit** dans le test. C'est plus juste : une maquette est un
   relevé, son terrain fait partie de ce qui a été observé et n'a pas à se
   re-dériver à chaque lot.
2. **Le test des flèches est passé de la colonne 4 à la colonne 5.** La 4 porte
   un champ de scorie dans ta table. ⚠ La colonne 3, essayée d'abord, **mesurait
   autre chose sans le dire** : le champ de (16, 2) devenait voisin en diagonale
   et le `find` sur la rangée 16 rendait le champ au lieu de l'accumulateur. Le
   test lisait « ↘ » là où il croyait lire l'accumulateur.
3. **J'ai écrit une mauvaise valeur et l'assertion l'a rattrapée.** Le raid B des
   préréglages figés rase toujours la Souche ; j'avais lu `attaquants` dans ma
   propre mesure et l'avais recopié. Corrigé, et le commentaire le dit.

---

## 7. Ce qui reste ouvert

1. **Le journal des écarts n'existe pas.** C'est lui qui portera les camps et
   avant-postes — deux camps et un avant-poste, cinq minutes après la pose ou le
   déplacement de la base, anneaux 1–2 et 2–5, respawn automatique. Ils ne se
   dérivent pas de la graine puisqu'ils dépendent de l'histoire de la partie.
   `SATELLITES` dit combien, où et quand ; **rien ne les pose encore**. Ce lot-là
   touchera l'état, donc `SAVE_VERSION`.
2. **Les obstacles ne sont pas branchés dans l'état.** `obstaclesDeLaBase` rend
   un terrain que personne ne lit : `problemesDeLaPose` ignore encore les
   obstacles, et la garnison peut se poser dessus. C'est le premier geste du lot
   suivant.
3. **Deux tirages d'obstacles coexistent.** Celui du générateur part de la graine
   du SITE (donc change à chaque instance), celui de `obstaclesDeLaBase` part de
   la CASE (donc tient d'une instance à l'autre, ce que tu as arbitré pour les
   camps successifs). Les deux devront se rejoindre le jour où un site de
   l'Ouvrage saura d'où il est.
4. **Le raid à 4 645 ticks** (§4).
5. **La contradiction du fond de carte n'est pas levée dans les documents.** Le
   rapport EMBLÈME du 27/08 et `INVENTAIRE-SPRITES.md` §2.4 affirment tous les
   deux « fond procédural, aucune tuile », alors que `art/sources/carte/` porte
   256 tuiles et que tu les as désignées. Rien dans `src/` n'en dépend
   aujourd'hui, mais la prochaine session sprite relira le texte et refera le
   mauvais fond.
6. **Ta partie en cours est perdue**, et tu l'as accepté : les collecteurs de ton
   ancienne base tombent `hors-champ` sous le nouveau terrain, ce qui n'est pas
   un code toléré au chargement.

---

## 8. Vérification appareil — NON EXÉCUTÉE

Rien de ce lot ne se voit à l'écran : il n'ajoute aucune interface. Le premier
contrôle visuel viendra avec l'écran de la carte.
