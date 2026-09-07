# Lot TUTORIEL-EN-BAS — la mini-fenêtre des missions, et les dix-sept missions dictées

**29/08/2026** · version **0.32.0**, build **33** · branche `claude/carte-eq0r2q`

## 0. Ce qui a été demandé

Ethan, le 29/08 :

> Faire apparaître les missions en bas au début du jeu, au-dessus des boutons
> améliorer etc. Sous la forme d'une mini fenêtre. Texte court, compteur
> d'objectif. Le joueur peut quitter le tuto grâce à une croix comme n'importe
> quelle fenêtre. Il le retrouve dans l'onglet mission.

Puis dix-sept missions, numérotées 1 à 17 — la dix-huitième ligne du message est
vide et **aucune mission n'a été inventée pour la remplir**.

## 1. Résultat mesuré

| | Avant | Après |
|---|---|---|
| `npm test` | 467 pass / 0 fail | **476 pass / 0 fail** |
| `dist/index.html` | 512 912 o | **523 905 o** (+10 993) |
| `SAVE_VERSION` | 8 | **9** |
| Missions | 5 | **17**, dont 13 vérifiables |
| Chrome fixe du Chantier | 288 px | **288 px** (inchangé) |

Mesuré sur un clone de `main` à jour, `npm ci && npm run check`. Le job `android`
n'a pas été exécuté ici (pas de SDK) ; `version` et `config.build` ont été bumpés
**textuellement** et restent des CHAÎNES — la garde de `donnees.test.js`, qui lit
`build.gradle.kts`, passe.

## 2. Fichiers touchés

| Fichier | Ce qui change |
|---|---|
| `src/data/missions.js` | **NEUF** — la chaîne dictée : objectifs, niveaux, comptes |
| `src/sim/missions.js` | réécrit — il INTERPRÈTE la chaîne, il ne porte plus aucun nombre |
| `src/sim/state.js` | `etat.tutoriel`, migration 8 → 9, `reglerTutoriel`, `tutorielEstFerme` |
| `src/ui/mission.js` | réécrit — la mini-fenêtre ET l'onglet, une seule lecture |
| `src/ui/session.js` | câblage des deux vues, `rafraichirLaBase` |
| `src/index.src.html` | balisage et CSS de la fenêtre, bouton de réouverture, colonne du champ |
| `test/missions.test.js` | réécrit — 10 tests → **19** |
| `test/state.test.js` | les deux gardes de version passent à 9, + le maillon 8 → 9 |
| `CLAUDE.md` | §0 (compte, taille, version), §2 (le 7ᵉ fichier de `data/`), §6 |
| `package.json` | 0.31.0 / "32" → **0.32.0 / "33"**, en chaînes |

## 3. Les décisions, et pourquoi

### 3.1 La fenêtre est DANS LE FLUX, pas posée sur la grille

Première écriture : `position: absolute; bottom: 0` dans `#chantier-champ`,
comme le panneau de détail. **Elle avalait le toucher des cases qu'elle
couvrait.** Mesuré dans Chromium : `elementFromPoint` sur la première case
légale rendait `#tuto-objectifs`, et poser un Collecteur — la première mission
que la fenêtre venait d'annoncer — était devenu impossible.

C'est la faute que le dépôt interdit déjà au calque des traits de voisinage
(`pointer-events: none`) et au `transform: scale()` de la grille : le doigt se
décroche de la case qu'il vise.

Corrigé : `#chantier-champ` devient une colonne, `#chantier-defile` absorbe ce
qui reste (`flex: 1`), la fenêtre prend sa place (`flex: 0 0 auto`). La grille
se fait plus courte de 88 px et défile ; elle les récupère à la fermeture
(mesuré : 264 px → 352 px).

**Ce n'est pas une septième barre** : sa hauteur vaut une, deux ou trois lignes
d'objectif, donc `0 0 auto` et jamais `0 0 Npx`. Les 288 px de chrome que garde
`chantier.test.js` ne bougent pas d'un pixel — vérifié.

### 3.2 La chaîne est du calibrage, donc elle vit dans `src/data/`

Les niveaux visés et les comptes ont été DICTÉS. CLAUDE.md §4 veut ces
valeurs-là dans `src/data/` : d'où `data/missions.js`. `sim/missions.js` les
interprète et **ne porte plus un seul identifiant ni un seul nom** — un test
balaie le moteur et refuse les deux.

Conséquence : le TITRE d'une mission n'est écrit nulle part. Il est composé des
libellés de ses objectifs, eux-mêmes tirés de `nom.joueur` et des niveaux de la
table. Seules les missions sans moteur portent un libellé écrit à la main : il
n'y a rien à en dériver. Un test l'asserte dans les deux sens.

### 3.3 Quatre missions n'ont pas de moteur, et elles le disent

| # | Mission | Ce qui manque |
|---|---|---|
| 10 | Attaquer et détruire un camp | le raid n'est pas écrit |
| 15 | Se rapprocher des bases de l'Ouvrage | le redéploiement n'est pas écrit |
| 16 | Détruire une base de l'Ouvrage | le raid n'est pas écrit |
| 17 | Construire une seconde base | une partie ne porte qu'une base |

Les taire aurait amputé la feuille de route ; les compter aurait donné un
compteur qui n'atteint jamais son plafond — le tutoriel infinissable que
CLAUDE.md §6 nomme déjà. Elles sont donc **affichées, marquées `⋯`, sans
compteur**, sautées par la mise en avant, et hors du dénominateur : **13 / 17**.
Le jour où le raid arrive, c'est la ligne de `data/missions.js` qui change, et
le dénominateur grandit tout seul.

### 3.4 `etat.tutoriel` est sauvegardé — et ce n'est PAS de la progression

Ce qui est FAIT se recalcule depuis la base à chaque demande, et n'est écrit
nulle part : la règle du 28/08 est intacte. Ce qui est écrit, c'est « j'ai
quitté le tuto » — une décision du joueur qu'aucune base ne peut exprimer, donc
de l'histoire, au même titre que `satellites`.

La migration 8 → 9 ajoute `{ ferme: false }` et rien d'autre. Une sauvegarde v8
n'a jamais eu de croix à cliquer ; la déclarer fermée priverait son joueur du
tutoriel pour un geste qu'il n'a pas fait.

## 4. Ce que la falsification a trouvé

Treize falsifications, **une passée verte au premier essai** :

| | Fausse écriture | Verdict |
|---|---|---|
| F1 | `missionCourante` ne saute plus le sans-moteur | rouge ✓ |
| F2 | `avancement` compte les dix-sept | rouge ✓ |
| F3 | la clé de code revient dans le libellé | rouge ✓ |
| F4 | la fenêtre devient `relative` | rouge ✓ |
| F5 | signature réduite à l'avancement | rouge ✓ |
| F6 | la migration 8 → 9 disparaît | rouge ✓ |
| **F7** | **deux bâtiments de plus dans la chaîne** | **VERTE ✗** |
| F8 | `reglerTutoriel` n'écrit plus | rouge ✓ |
| F9 | le prérequis oublie l'apparition mesurée | rouge ✓ |
| F10 | un identifiant de la chaîne revient dans le moteur | rouge ✓ |
| F11 | la fenêtre repasse en `absolute` | rouge ✓ |
| F12 | le défilement redevient `absolute` | rouge ✓ |
| F13 | la fenêtre passe sous les boutons | rouge ✓ |

**F7 est la leçon du lot.** La garde « la chaîne tient dans les emplacements »
jouait un montage écrit à la main dans le fichier de test : ajouter deux
bâtiments à `data/missions.js` ne changeait pas le montage, donc elle restait
verte sur une chaîne devenue **injouable**. Elle lit maintenant la CHAÎNE — ce
que les objectifs exigent depuis le début, contre ce que les Chantiers déjà
demandés ont ouvert — et F7 la fait tomber. *Un montage écrit à la main ne garde
que lui-même.*

## 5. Ce que la chaîne exige, mesuré

Jouée de bout en bout avec le vrai moteur, sans coordonnée écrite à la main (le
montage DEMANDE au moteur où poser) :

- **12 bâtiments pour 12 emplacements** — exactement ce qu'un Chantier de
  niveau 5 ouvre. **Marge nulle.** Une mission de plus rend le tutoriel
  infinissable, et le test le dira.
- Les 13 missions vérifiables se cochent toutes.
- Entre les missions 7 et 8, poser le Centre de commandement et le Dépôt de
  véhicules (niveau 1) **décoche** « chaque bâtiment au niveau 5 ». C'est « rien
  n'est mémorisé » vu de l'autre côté, pas un défaut de calcul — mais le joueur
  verra le tutoriel revenir en arrière d'une ligne, et c'est à signaler.

## 6. Vérifié dans un navigateur

Chromium, 360 × 640. Aucune erreur JS, aucune erreur console.

- La fenêtre s'ouvre au démarrage, entre la grille (110–374) et la barre
  contextuelle (462–508). Rien ne défile de travers, rien n'est poussé hors de
  l'écran (la palette finit à 594 pour 640).
- Chaque case légale visible reçoit son propre toucher (`elementFromPoint`).
- Poser un Collecteur sur du quartz fait passer l'en-tête de « Mission 0 / 13 » à
  « Mission 1 / 13 », et la fenêtre montre la mission suivante.
- La croix ferme ; la grille récupère 88 px.
- L'onglet Mission montre le bouton de réouverture, qui rouvre ET revient sur
  l'écran de la base.
- **La fermeture survit à un rechargement** — elle est dans la sauvegarde.
- Les écrans Monde et Options n'ont pas bougé.

Défaut trouvé à l'essai et corrigé avant livraison : l'onglet Mission écrivait le
titre PUIS ses objectifs, soit « Collecteur sur quartz / Collecteur sur quartz
0 / 1 ». Le titre étant composé des libellés d'objectif, il ne s'affiche plus
au-dessus d'eux.

## 7. Ce qui reste ouvert — pour Ethan

1. ⚠⚠ **La chaîne demande des pièces que ses propres niveaux n'ouvrent pas.**
   Mesuré : l'Éclaireur apparaît au niveau **18** du Centre de commandement, que
   la chaîne ne fait monter qu'au **7** (mission 13) ; le Mur de défense au **6**
   et la Tourelle mitrailleuse au **8** du QG de défense, que la chaîne ne fait
   monter qu'au **5**. Le joueur peut y arriver — rien ne l'empêche de monter
   plus haut — mais le tutoriel ne le lui demande pas.
   **Les seuils n'ont pas été touchés** : `UNITES` et `DEFENSES` font foi
   (arbitré le 24/08), et les baisser est un arbitrage de données. C'est la même
   tension que « Guardien et Paladin indisponibles » du lot précédent, vue une
   deuxième fois — le Guardien EST l'Éclaireur.
   À la place, chaque mission d'effectif porte des **prérequis dérivés** des
   tables : le tutoriel dit au joueur pourquoi sa palette reste grise, et la
   phrase suivra toute seule si les seuils changent.
2. **La mission 18 n'existe pas.** Le message s'arrête sur « 18. ». Rien n'a été
   inventé.
3. **Poser du neuf décoche une mission de mise à niveau** (§5). Si ce
   va-et-vient gêne, la seule autre option est de mémoriser la progression —
   ce que CLAUDE.md interdit, et pour de bonnes raisons.
4. **Le tutoriel ne s'affiche que sur l'écran de la base.** La mission 9 se joue
   sur l'écran Offense, la 12 sur la bande Défense : la fenêtre n'y est pas.
   L'étendre à l'Offense est un balisage et deux lignes de câblage, à demander.
5. **La récompense n'existe toujours pas**, et c'est l'arbitrage du 28/08 :
   « des missions qui se cochent toutes seules, sans récompense ».
