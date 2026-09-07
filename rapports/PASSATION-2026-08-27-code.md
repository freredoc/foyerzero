# PASSATION — Foyer Zéro, session du 27/08/2026 (code)

> À lire avec `CLAUDE.md`, qui fait autorité, et **après**
> `PASSATION-2026-08-27-nuit.md`, qui couvre la session sprites. Les deux ont
> tourné en parallèle sur le même dépôt ; celle-ci ne couvre que le code.
>
> ⚠ **C'est le jour où le jeu est devenu jouable.** Neuf lots de moteur avaient
> été écrits sans que rien ne soit visible ; à la fin de cette journée, Ethan
> pose des bâtiments sur son téléphone et les stocks montent pendant qu'il n'y
> est pas.

---

## 1. État du dépôt, mesuré et non cru

| | |
|---|---|
| Dépôt | `freredoc/foyerzero`, branche `main` |
| Version · build | **0.17.0 · 17** |
| `npm run check` | **293 pass / 0 fail** |
| `dist/index.html` | **133 545 octets**, SHA-256 `1f1c2cec…9bab4` |
| `SAVE_VERSION` | **6** |
| Palette fermée | **33 teintes** |
| Fichiers | `src/data/` 5 · `src/sim/` 11 · `src/render/` 5 · `src/ui/` 6 · `test/` 24 · `tools/` 3 |
| `node tools/audit-maquette.mjs` | **AUDIT VERT** |

Relevé sur un clone neuf après le dernier dépôt, pas depuis une copie de travail.

**Premier geste de la prochaine session** : lire `CLAUDE.md`, lister la racine et
chaque dossier, puis `npm ci && npm run check`, et **consigner le compte obtenu**.

⚠ **Le jeu tourne sur `https://freredoc.github.io/foyerzero/index.html`.**
L'URL sans `index.html` **ne répond pas** — cause non identifiée, sans effet sur
l'application : c'est exactement l'URL que la CI écrit dans le manifeste, et
c'est le seul chemin que l'allowlist Android autorise.

---

## 2. Ce qui a changé — onze lots

| Lot | Ce qu'il apporte |
|---|---|
| **ORPHELIN** | retrait de `sim/economy.js`, `data/params.js`, `test/economy.test.js` — 582 lignes |
| **HOMONYMES** | `documentation.test.js` asserte les NOMS de fichiers de `src/`, plus seulement les comptes |
| **FONDATION-GELÉE** | le terrain suit la FONDATION, pas la position — `SAVE_VERSION` 5 |
| **TROIS-NIVEAUX** | `sim/niveau-de-base.js` : la moyenne des niveaux, en dixièmes |
| **PALETTE-V4** | la transcription de la palette se confronte à `FICHE-STYLE.md` |
| **HORLOGE-MURALE** | `serialiser`/`charger` prennent l'instant — `SAVE_VERSION` 6, rattrapage hors ligne |
| **ÉCRAN-CHANTIER** | le premier écran branché sur le moteur ; le HTML bouge pour la première fois depuis douze lots |
| **ÉCRAN-NAVIGATION** | miroir de la grille, deux écrans au lieu de trois bandes |
| **DÉMARRAGE** | la poche du Chantier + `poser()` — la partie devient startable |
| **POSE-À-L'ÉCRAN** | la palette devient vivante |
| **HORLOGE-DE-BOUCLE** | le temps vient de l'horloge, pas de l'horodatage d'image |

### Les arbitrages d'Ethan, tous consignés dans `CLAUDE.md` §6

- **Le terrain est gelé à la fondation** — « une fois qu'il a posé sa base, les
  champs ne changent plus jamais, sinon ça casserait les collecteurs ».
- **Les niveaux de la carte concernent l'OUVRAGE seul.** Le joueur en porte
  **trois**, chacun une moyenne : bâtiments, défense, armée offensive.
- **Une décimale**, et **seulement ce qui est posé** — les emplacements vides ne
  comptent pas pour zéro, ils ne comptent pas ; le Chantier compte.
- **La grille fait 9 colonnes.**
- **Le miroir** : les bâtiments d'abord à l'écran, la défense ensuite, les deux
  rangées de déploiement en dernier. Vaut aussi pour une base de l'Ouvrage en raid.
- **L'Offense est un autre écran**, quatre vagues de neuf.
- **Le banc d'essai reste** dans le HTML livré, derrière un appui long.
- **Le Chantier a un stockage propre** — 50 · 50 · 40, feuille EFFETS ligne 14.
- **La vignette de pose ne porte aucune pastille**, et le bouton retour de
  l'Offense tombe à la place exacte de l'aller.

---

## 3. Ce qui reste ouvert

### 3.1 Le lot suivant — améliorer et démonter

**Bloqué par un arbitrage, un seul :** *comment un coût de construction se
répartit entre quartz et scorie*. `COUT_NIVEAU_DEUX` donne un nombre unique
(8 / 5 / 3 / 2 selon la classe), `COUT_ELECTRICITE` une fraction du coût **en
quartz** ; la part de scorie n'est chiffrée nulle part depuis que le modèle du
lot 1 est parti avec `data/params.js`. Le classeur la range dans ses TROUS 1 et 2.

**Démonter** attend en plus de savoir si ça rend quelque chose.

Les trois boutons sont à l'écran, désactivés : la place est tenue, rien ne ment.

### 3.2 Le démarrage est long, et Ethan l'a dit

> « Normalement dans Tiberium Alliances, en complétant les petites tâches de
> tuto, on a des petites récompenses qui permettent d'accélérer le début, sinon
> c'est long et chiant. »

**Mis de côté volontairement**, pas oublié. Chiffres pour cadrer : un collecteur
niveau 1 remplit la poche de 50 en **12,5 minutes**, et le Chantier niveau 2
coûte 8. La pompe s'amorce, mais lentement.

### 3.3 Ce qui demande un arbitrage

- **La poche du Chantier suit-elle le niveau ?** Elle est PLATE aujourd'hui — le
  classeur ne donne aucune courbe, et 50 devient négligeable dès la première
  raffinerie. Un test l'asserte de face.
- **Les couleurs de terrain de la fiche** — `#9FB3C5` · `#C1CEDA` quartz,
  `#382E47` scorie — existent depuis le 27/08 et **ne sont employées nulle
  part**. La maquette et l'écran devront bouger ensemble.
- **Les obstacles dans la bande de défense du joueur.** `OBSTACLES` existe
  (`{ nombre: 10, … }`) mais **seul `sim/generateur.js` en pose**, pour un site
  de l'Ouvrage. La capture de référence en montre chez le joueur. Question
  ouverte : qui les pose, et quand ?
- **Les valeurs manquantes du classeur** (onglet TROUS, 14 entrées) : coûts de
  construction et de montée, coûts de réparation, électricité, réserve de temps.

### 3.4 Les vérifications appareil

Ethan a exécuté les douze de la navigation. Restent dues, et **elles sont
maintenant toutes atteignables** — la pose est branchée et l'horloge est
réparée :

| # | Vérification |
|---|---|
| 7 | poser un collecteur, voir les stocks monter |
| 9 | l'économie a tourné pendant un passage à l'Offense |
| 11 | fermer l'app, attendre, rouvrir → les stocks ont avancé |
| 12 | replier sans fermer → même résultat |
| 15–20 | les six de la pose |

⚠ **Un test appareil non exécuté se déclare NON EXÉCUTÉ, jamais passé.**

---

## 4. Ce qui a coûté quelque chose — à ne pas réapprendre

### 4.1 Une archive à deux dossiers a détruit le moteur de combat

Une livraison portait `src/data/` **et** `src/sim/`. La paire de `src/data/` est
partie deux fois : une fois au bon endroit, une fois dans `src/sim/`.
**`src/sim/combat.js` — 1 450 lignes — a été remplacé par la table de données du
même nom court**, et `main` est passé rouge.

`combat.js` existe dans les deux dossiers. Ce sont deux fichiers sans rapport,
et le sélecteur d'un téléphone n'affiche que le nom court.

**Deux remèdes, tous deux en place :**
- **une archive ne propose jamais deux dossiers de destination quand un nom court
  est ambigu entre eux** — flat, une seule destination ;
- **`documentation.test.js` asserte les NOMS** de chaque dossier de `src/`, plus
  seulement les comptes. Le compte n'avait rien vu : `src/sim/` avait toujours
  ses onze fichiers, un module de moins et un intrus de plus.

### 4.2 Une transcription qui ne se confronte pas à sa source vieillit

La garde de palette de `banc.test.js` se disait « transcrite de
`FICHE-STYLE.md` ». La fiche est passée de 28 à 33 teintes ; la garde est restée
à 28, **verte**, prête à refuser cinq couleurs légitimes.

Elle se confronte désormais au document **dans les deux sens**. Et la même
transcription avait été dupliquée dans `tools/audit-maquette.mjs`, qui n'est pas
dans `npm run check` : **elle a pourri en une journée, sans que personne le
sache**. L'audit **lit** la fiche maintenant — la copie écrite ne vit plus que là
où une garde la surveille.

> Deux copies dont une seule est gardée, c'est une copie de trop.

### 4.3 La partie était instartable, et l'écran avait raison

Un Chantier niveau 1 ouvre **2** emplacements et en occupe **1** : il en reste
**un**. Produire en demande **deux** — un producteur et un stockage. Mesuré sur
les quatre choix possibles, 24 h de simulation : **zéro partout**. Ouvrir un
troisième emplacement demandait le niveau 2, qui coûte 8, que le joueur ne
pouvait pas obtenir.

La réponse était **déjà arbitrée**, dans `FOYER-ZERO-BATIMENTS-JOUEUR.xlsx`,
feuille EFFETS ligne 14, au statut MANQUANT : elle n'était jamais descendue dans
`src/data/`.

> Avant de conclure qu'une valeur manque, regarder si elle n'a pas simplement
> jamais été transcrite.

### 4.4 Le temps ne se mesure pas sur les images

**Le défaut le plus coûteux de la journée.** La boucle mesurait l'écoulement sur
les horodatages de `requestAnimationFrame`. Ils sont **monotones : ils ne
courent pas pendant qu'une page est gelée**. Tant qu'un `visibilitychange`
encadrait le gel, le rattrapage réparait — mais **quand l'évènement ne se
déclenche pas, le temps est perdu pour toujours**, et sur Android c'est le cas
courant.

Ethan l'a vu avant tout le monde : « je suis parti quelques minutes et le
compteur n'a pas bougé ». Ses deux captures le chiffraient — **+1 quartz en deux
minutes au lieu de +8**. Rejoué sur le HTML livré : **0,006 unité au lieu de 8.**

⚠ **Le remède n'était pas un évènement de plus.** Ajouter `pageshow` ou `focus`,
c'est parier que celui-là se déclenchera toujours. `requestAnimationFrame` dit
QUAND dessiner, l'horloge dit COMBIEN de temps a passé. Un gel manqué se répare
à la première image du retour.

### 4.5 Trois fois, j'ai affirmé avant de mesurer

| Écrit | Mesuré |
|---|---|
| « la pose attend l'arbitrage quartz/scorie » | poser est **gratuit** ; c'est l'AMÉLIORATION qui l'attend |
| « quatre champs de `PARAMS` sont morts » | **huit sur huit**, plus l'export `RHO` |
| « le niveau de la base suit sa rangée » | les niveaux de la carte sont ceux de l'**Ouvrage** ; Ethan l'a repris le jour même |

Le troisième n'était pas déposé quand il l'a relevé — corrigé à la source, pas
après. Les trois avaient la même forme : une conséquence déduite d'un modèle
plutôt que lue dans le dépôt.

### 4.6 Un montage de test qui tombe peut avoir raison

Le test « le collecteur posé produit » est tombé au premier jet. Ce n'était pas
le test qui était faux : c'était le jeu qui ne pouvait pas démarrer (§4.3).
**C'est la falsification qui a trouvé le blocage**, pas une relecture.

De même, une falsification a montré qu'un test « une sauvegarde sans `fondation`
est refusée » restait vert alors que la garde avait été retirée : `charger`
déréférençait `undefined` et levait **pour la mauvaise raison**. Le correctif est
allé dans le code, pas dans le test.

### 4.7 Une notice de livraison s'est retrouvée commitée

`LISEZ-MOI-DEPOT.md` a atterri à la racine du dépôt : elle voyageait dans les
archives à côté des fichiers qu'elle décrivait, sous un nom qui leur
ressemblait. Les notices s'appellent désormais `A-LIRE-AVANT-DE-DEPOSER.md` et le
disent en première ligne.

---

## 5. La méthode, telle qu'elle a tenu

**Chaque lot falsifié par injection de défauts**, sur une copie, ancre vérifiée à
une occurrence. Bilan de la journée : **une cinquantaine de défauts injectés,
quatre passés** — tous qualifiés d'équivalents et documentés comme tels, jamais
laissés sans explication (un `Math.round` équivalent à une formule entière, un
balayage plus large au résultat identique, deux gardes redondantes conservées).

**Chaque PR de Claude Code rejouée ici** : suite complète, build, audit, puis
falsification de ses propres gardes. Deux alertes se sont révélées être des
défauts de mes contrôles, pas des siens — un motif qui ne voyait pas un import
renommé, et une taille comptée en caractères au lieu d'octets.

**Ce qui a changé** :
- les archives sont plates, une destination par archive ;
- les notices ne peuvent plus être confondues avec des livrables ;
- une transcription se confronte à sa source, ou n'existe pas en double.

**Ce qui n'a pas changé** : aucun bump quand `dist/index.html` ne bouge pas —
reconduit **douze fois** avant que l'écran ne le fasse enfin bouger, toujours
vérifié par SHA-256.

⚠ **Une dernière chose, pour la prochaine session.** Le diagnostic du §4.4 a
demandé de charger le HTML livré dans un vrai DOM. **jsdom a été installé dans
le conteneur de travail, JAMAIS dans le dépôt** — `esbuild` reste sa seule
dépendance de développement, et ce n'est pas un oubli. Un outil de diagnostic
n'est pas une dépendance ; le confondre ferait entrer dans `npm run check` des
tests qui ne prouveraient rien de l'appareil.
