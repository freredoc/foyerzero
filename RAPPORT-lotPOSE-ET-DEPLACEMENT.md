# RAPPORT — lot POSE ET DÉPLACEMENT

Troisième et dernier des trois lots répondant à la liste du 28/08. Il prend les
deux derniers gestes de cette liste — la **pose en deux temps avec les flèches de
proximité**, et le **déplacement d'un bâtiment** — et il les fait entrer dans la
place existante, conformément à la consigne « tu compresses tout dans l'ui ».

**Version produite : 0.24.0 · build 25.** `dist/index.html` : 156 633 →
**161 583 octets** (+4 950), SHA-256
`7e75d605cb34768161e92dfd8c7513ec71bc0158bf90e0fe56e0bc5fca53f189`, 0 référence
externe. `SAVE_VERSION` **inchangée à 6** — déplacer un bâtiment ne change pas la
forme de l'état, seulement le contenu de deux champs qui existaient déjà.

**Suite : 332 → 338 pass / 0 fail** — six tests ajoutés, un réécrit, aucun retiré
ni assoupli. `audit-maquette.mjs` : **vert**.

**Vérifications appareil : NON EXÉCUTÉES.** Le dépôt n'a ni jsdom ni navigateur ;
tout ce qui suit sur le DOM a été mesuré par lecture de source, par un talon DOM
jetable, ou pas mesuré du tout — et c'est dit à chaque fois. La liste des gestes
à essayer est en §8.

---

## 1. La pose se fait en deux touchers

> « La pose d'un bâtiment change. Il y a d'abord un clic et le bâtiment/sprite
> transparent, et les flèches bonus proximité s'affiche si il y en a, un deux
> clique pose le bâtiment. »

Le premier toucher **montre** : un fantôme sur la case visée, et les flèches des
voisins qui rapporteraient quelque chose. Le second **pose**. Toucher une autre
case déplace l'aperçu au lieu de poser — c'est le cas courant, celui où l'on
compare deux emplacements avant de choisir.

`poseEnAttente` retient la case en aperçu dans `ui/chantier.js` ; le premier
toucher sort par un `return` avant d'appeler le moteur, et c'est ce `return` qui
fait les deux temps. Un test l'exige, et se falsifie lui-même en vérifiant que
son motif attrape bien un premier toucher qui poserait.

⚠ **Le fantôme n'est pas transparent, et il ne peut pas l'être.** La palette est
fermée et ne tolère qu'un seul `rgba`, réservé à l'ombre portée de la fiche.
Un liseré tireté et un sigle éteint disent « pas encore là » sans ouvrir de
brèche dans la garde de palette — laquelle refuserait de toute façon un hex à
huit chiffres. C'est un écart au mot « transparent » du brief, et il est
délibéré : la contrainte de palette est arbitrée, le mot ne l'était pas.

## 2. Les flèches de proximité, à trois moments et par une seule fonction

Le brief en demandait deux — la pose, et « les flèches du bâtiment concerné
quand on ouvre l'onglet bâtiment ». Il y en a trois, le déplacement ayant le
même besoin : voir ce que la case d'arrivée rapporterait.

Les trois passent par `peindreApercu()`, qui appelle `flechesDeVoisinage` une
fois. Les écrire trois fois aurait donné trois lectures du voisinage.

- **`voisinsQualifiantsParCase(disposition, champs, index)`** est nouvelle dans
  `sim/disposition.js`, à côté de `voisinsQualifiants` dont elle est la variante
  « avec les coordonnées ». Elle rend `{ rangee, colonne, type, apportParHeure }`
  et **ne dit rien de l'écran** : ni direction, ni glyphe. Le voisinage reste
  celui de `casesVoisines`, les huit cases, jamais une seconde notion.
- **`flechesDeVoisinage` et `GLYPHES_DE_FLECHE`** sont dans `ui/chantier.js`,
  qui seul connaît `render/orientation.js`. Le sens se calcule en **lignes
  d'écran** : la rangée 18 est la première ligne, donc un voisin de rangée
  supérieure est plus haut, et la flèche qui le relie au bâtiment pointe vers
  le bas.

⚠ **J'ai écrit une affirmation fausse, et la falsification l'a corrigée.** Le
commentaire de ce bloc disait que déduire le glyphe du signe de `rangee`
« retourne les huit flèches ». C'est faux : avec `ligne = longueur + 1 − rangee`,
les deux formules donnent le **même** signe, le +19 se simplifiant. Passer par
`ligneEcranDeLaRangee` ne corrige donc rien aujourd'hui — ça dit qu'on raisonne
en lignes d'écran, et ça restera juste si la transformation cesse d'être affine.
La faute qui se commet vraiment est l'**inversion du signe**, et c'est elle que
le test attrape. Le commentaire du code, celui du test et `CLAUDE.md` ont été
repris.

## 3. Déplacer un bâtiment

> « Possibilité de déplacer un bâtiment/défense/unités d'attaque. Bouton entre
> améliorer et demolir. Pas de dépassement d'ui. »

**Le bâtiment : fait.** `problemesDuDeplacement` et `deplacer` dans
`sim/state.js`, un quatrième bouton `#chantier-deplacer` entre « Améliorer » et
« Démolir ». C'est la seule action à deux touchers — on arme, on touche le
bâtiment, on touche la case d'arrivée — et la table le dit : `ACTIONS.deplacer.cible`
vaut `true`. L'écran **lit ce champ** ; un test refuse un `=== 'deplacer'` écrit
à la main, qui serait le premier cas particulier à diverger.

Quatre décisions, toutes contraintes par le dépôt et non choisies :

- **La case se modifie EN PLACE.** `economie.residus` est parallèle à
  `disposition` : un `splice` puis un `push` décalerait les résidus d'un cran et
  ferait produire à chaque bâtiment le reste de son voisin.
- **Les défauts préexistants sont filtrés**, comme pour la pose, et c'est ici que
  ça compte le plus : une base qui porte deux uniques voisins — tolérés au
  chargement — se répare précisément en déplaçant.
- **Rester sur place est légal.** Le refuser obligerait l'écran à connaître cette
  exception, et priverait le joueur de toute annulation.
- **Déplacer ne coûte rien**, faute d'arbitrage. En inventer un prix serait
  trancher seul une mécanique de jeu. Le jour où un prix sera fixé, il se
  débitera dans `deplacer`, au même endroit qu'`ameliorer` débite le sien.

⚠ **La défense et les unités d'attaque ne sont PAS déplaçables, et ce n'est pas
un renoncement de confort.** L'état ne porte ni garnison ni armée :
`serialiser` écrit `position`, `fondation`, `disposition` et `economie`, rien
d'autre. `ui/defense.js` et `ui/arsenal.js` sont des **éditeurs** dont la sortie
n'est sauvegardée nulle part. Déplacer une unité demanderait d'abord d'inventer
la forme de cet état — c'est le même mur que les deux niveaux moyens manquants
et que la coquille de l'écran Offense. **C'est le premier arbitrage à rendre
quand l'armée du joueur entrera dans la sauvegarde.**

## 4. « Tu compresses tout dans l'ui » — la consigne, et sa garde

Un quatrième bouton devait entrer dans un bandeau de 46 px sans le faire grandir.
Ce sont les écarts et le bloc de gauche qui ont cédé : `#chantier-contexte` fait
toujours **46 px**.

La consigne est plus forte que « pas de dépassement » : tout doit **tenir**, rien
ne défile horizontalement, aucune barre n'en pousse une autre hors du cadre. Elle
est notée dans `CLAUDE.md` §6 comme permanente, et une garde la tient autant
qu'un dépôt sans navigateur le permet — `chantier.test.js` somme les hauteurs
fixes des six barres de la colonne de jeu :

```
40 (onglets) + 44 (ressources) + 26 (navigation)
+ 46 (bandeau contextuel) + 46 (barre du bas) + 86 (palette)  =  288 px
```

et refuse au-delà de **320**. La borne se justifie et ne se devine pas : sur la
dalle la plus courte encore en service (568 px de haut en CSS), 320 px de chrome
laissent 248 px de grille, soit cinq rangées ; en dessous le jeu cesse d'être
jouable. La garde asserte aussi la **liste** des barres à hauteur fixe — une
septième la fait tomber, ce qui force à regarder plutôt qu'à ajouter — et
qu'aucune ne porte `overflow-x`.

⚠ **Ce qu'elle ne prouve pas :** que le rendu tient vraiment sur l'appareil
d'Ethan. Elle additionne des nombres écrits dans une feuille de style, sans
moteur de rendu. C'est une garde contre la dérive, pas une vérification. La
vérification est en §8.

## 5. Un défaut trouvé en écrivant ce rapport, et corrigé avant de livrer

En relisant `CLAUDE.md` §6 pour vérifier la contrainte de palette, j'ai compté
les teintes plutôt que de recopier le nombre annoncé. **Le fichier disait
« vingt-huit », la fiche en porte trente-trois.** Son énumération avait perdu une
rampe entière — les cinq tons du **sol de l'Ouvrage**.

C'est mot pour mot la faute que la liste de `banc.test.js` avait commise la
veille, et qu'un test avait alors réparée : *une transcription qui ne se
confronte pas à sa source est une copie qui vieillit.* La liste de **code** était
gardée depuis le 27/08 ; la **prose** ne l'était pas, et elle a dérivé le
lendemain.

Mesuré : `FICHE-STYLE.md` porte **33 teintes distinctes**, `PALETTE_FICHE` en
transcrit 33, et les deux ensembles sont égaux — la garde était juste, c'est le
paragraphe qui avait tort. Réparti : 5 châssis kaki · 5 sol joueur · 5 sol
Ouvrage · 5 ardoise Ouvrage · 4 matières de terrain · 3 métal · 6 accents
fonctionnels.

Corrigé dans `CLAUDE.md` §6 et dans le commentaire de `test/banc.test.js`, et
**gardé** : `documentation.test.js` décode le nombre écrit en lettres, somme
l'énumération, et exige que les deux valent le compte de teintes distinctes de
`FICHE-STYLE.md`. Le total **et** le détail — une garde qui ne lirait que le
total laisserait écrire « trente-trois » au-dessus d'une énumération qui fait
vingt-huit, c'est-à-dire exactement l'état dans lequel le paragraphe a été
trouvé.

C'est le sixième et dernier test ajouté par ce lot, et il n'était pas au brief.

## 6. Fichiers touchés

| Fichier | Δ lignes | Ce qui change |
|---|---|---|
| `src/sim/state.js` | +76 | `problemesDuDeplacement`, `deplacer` |
| `src/sim/disposition.js` | +60 | `voisinsQualifiantsParCase` |
| `src/ui/chantier.js` | +309 −5 | pose en deux temps, flèches, quatrième action, aperçu |
| `src/index.src.html` | +33 −9 | `.fantome`, `.fleche`, `#chantier-deplacer`, resserrage du bandeau |
| `test/state.test.js` | +112 | deux tests de déplacement |
| `test/chantier.test.js` | +177 −5 | trois tests, un réécrit (trois → quatre boutons) |
| `test/documentation.test.js` | +88 | la garde du compte de teintes (§5) |
| `test/banc.test.js` | +1 −1 | commentaire recompté (28 → 33) |
| `CLAUDE.md` | +88 −10 | §0, §6 |
| `foyer-zero-ui.html` | +18 −9 | la barre contextuelle passe à quatre boutons |
| `package.json` | +2 −2 | `version` et `config.build`, ensemble |

## 7. Falsification — dix mutations, dix verdicts rouges

Une mutation à la fois, restauration par copie, et **identité des sources
vérifiée à l'octet** après coup (`cmp`).

| # | Mutation | Verdict |
|---|---|---|
| M1 | `deplacer` par `splice` + `push` au lieu de la case en place | **ROUGE** (2 fail) |
| M2 | les défauts préexistants ne sont plus filtrés | **ROUGE** (3 fail) |
| M3 | le signe de la flèche inversé | **ROUGE** (1 fail) |
| M4 | le premier toucher pose (pose en un seul temps) | **ROUGE** (1 fail) |
| M5 | `=== 'deplacer'` écrit à la main au lieu du champ `cible` | **ROUGE** (1 fail) |
| M6 | le bandeau contextuel passe à 96 px (chrome à 338) | **ROUGE** (1 fail) |
| M7 | une septième barre à hauteur fixe apparaît | **ROUGE** (1 fail) |
| M8 | `CLAUDE.md` annonce « vingt-huit » teintes | **ROUGE** |
| M9 | total juste, énumération rabotée d'une teinte | **ROUGE** |
| M10 | la phrase de garde retirée de `CLAUDE.md` | **ROUGE**, *et pour la bonne raison* |

M10 est le contrôle qui compte le plus : le paragraphe raconte sa propre dérive
et contient donc **les deux** nombres, l'ancien et le bon. Une garde qui se
serait rabattue sur la prose l'expliquant aurait été verte. Elle échoue avec
« CLAUDE.md §6 n'annonce plus de nombre de teintes », donc elle lit bien la
phrase et non le commentaire — c'est la troisième fois de la semaine que ce
piège est tendu, et la première où il ne prend pas.

Deux montages ont dû être resserrés avant de mesurer quoi que ce soit :

- **M1 passait avec deux bâtiments.** Le déplacé était le dernier de la liste, et
  `splice` puis `push` le remettait au même indice — le test aurait été vert sur
  du code cassé. Le montage en porte **trois** exprès.
- **M2 passait en déplaçant le bâtiment fautif.** Éloigner l'unique coupable rend
  la base saine, donc ne distingue pas les deux codes. Le montage déplace un
  bâtiment **innocent** pendant que le défaut demeure.

## 8. Vérifications appareil — NON EXÉCUTÉES

À faire sur l'APK, dans cet ordre. Aucune n'a été exécutée ici.

1. **Le fantôme et les flèches paraissent au premier toucher.** Choisir une
   raffinerie, toucher une case au contact d'un collecteur : liseré tireté +
   flèches vers le bâtiment. Retoucher la même case : elle se pose.
2. **Toucher une AUTRE case déplace l'aperçu** au lieu de poser.
3. **Le quatrième bouton ne déborde pas.** Les quatre — Réparer, Améliorer,
   Déplacer, Démolir — tiennent sur une ligne, sans coupure ni défilement, y
   compris en écriture agrandie.
4. **Un déplacement complet** : armer Déplacer, toucher un bâtiment, toucher une
   case libre. Le bâtiment change de case, la production suit, la sauvegarde
   tient au redémarrage.
5. **Le déplacement d'un unique au contact d'un autre unique est refusé**, avec
   le message de `sim/disposition.js` repris mot pour mot.
6. **Les flèches paraissent aussi à l'ouverture du panneau** d'un bâtiment déjà
   posé.
7. **Rien ne passe sous les barres système**, en portrait et en paysage.

## 9. Points laissés en suspens

- **Déplacer une défense ou une unité d'attaque** reste impossible : l'état ne
  porte ni garnison ni armée (§3). C'est un arbitrage à rendre, pas un travail à
  faire.
- **Le prix d'un déplacement** n'est pas fixé. Il est à zéro, et le dit.
- **Les points de défense et d'offense** restent à « — » pour la même raison,
  depuis le lot MISE EN PAGE.
- **La chaîne de mise à jour.** Ethan a rapporté devoir désinstaller puis
  réinstaller l'APK pour voir une nouvelle version — ce qui défait `android/maj/`
  et le manifeste publié par le job `pages`. **C'est le point le plus important
  de la liste restante** : sans lui, rien de ce qui est livré ici ne lui parvient
  autrement qu'à la main. À prendre au prochain lot.
- **La maquette ne montre aucun geste, et c'est sa nature.** Elle est statique :
  ni fantôme, ni flèches, ni pose en deux temps ne s'y dessinent, et
  `audit-maquette.mjs` ne regarde de toute façon ni la navigation ni les gestes.
  Ce qui S'Y dessine — la barre contextuelle — a été repris : **quatre boutons
  dans les mêmes 46 px**, avec le resserrage écrit et expliqué, et « Démonter »
  corrigé en « Démolir » pour suivre `ACTIONS`. Sans ça elle aurait enseigné une
  barre à trois boutons que le jeu ne fait plus, exactement comme elle aurait
  enseigné l'ancienne navigation le 27/08.
