# RAPPORT — lot ÉCRAN-CHANTIER : le moteur devient regardable

> Écrit sur disque, à la racine, comme `CLAUDE.md` §5 l'exige. Il dit ce qui a
> été **mesuré**, ce qui a été **déclaré non exécuté**, et pourquoi.

---

## 1. Ce qui a réellement été produit

| | |
|---|---|
| Version | **0.13.0** · build **13** (0.12.0 · 12 avant le lot) |
| `dist/index.html` | **123 785 octets** — 81 236 avant |
| SHA-256 | `ba59450815cde4ecf1e8822f6c41d729c9153a583c690b1691b1af8ef1945702` |
| `npm run check` | **271 pass / 0 fail** — 257 avant |
| `node tools/audit-maquette.mjs` | **AUDIT VERT** |
| `SAVE_VERSION` | **6**, inchangée — aucune migration dans ce lot |
| Références externes dans le livrable | **0**, garde du build passée |

**Le bump était dû.** `dist/index.html` a bougé pour la première fois depuis le
lot RÉSIDU : `version` et `config.build` ont été montés **ensemble**, au numéro
disponible au moment de l'exécution. Le brief n'en proposait aucun, et n'aurait
pas dû.

**La borne de T10 tient** : 123 785 octets contre 200 000, soit 38 % de marge.
Le HTML a gagné 52 % — l'écran, sa feuille de style et deux modules.

### Compte de tests, détaillé

257 → 271, **+14**, aucune assertion supprimée :

| Origine | Δ |
|---|---|
| `test/chantier.test.js`, nouveau | +13 |
| `test/banc.test.js` : la garde §11 scindée en deux | +1 |

La garde §11 d'origine tenait le tirage, le DOM **et** l'horloge murale dans un
seul test. L'horloge en sort parce qu'elle a maintenant une règle à elle, longue
et falsifiable ; le reste ne bouge pas. Ce n'est pas un test ajouté pour faire
nombre, c'est un test coupé en deux à l'endroit où il disait deux choses.

Le balayage de palette a gagné des assertions **sans** gagner de test : elles
vivent dans le test qui existait déjà (§6 ci-dessous).

---

## 2. Fichiers touchés

| Fichier | État | Ce qui change |
|---|---|---|
| `src/ui/chantier.js` | **nouveau** | l'écran : formatage pur, lecture de l'état, rendu au DOM |
| `src/ui/session.js` | **nouveau** | le temps, la sauvegarde, la boucle, le passage au banc |
| `src/index.src.html` | modifié | l'écran, sa feuille de style ; le banc passe derrière un geste |
| `test/chantier.test.js` | **nouveau** | 13 tests — formatage, lecture de l'état, balisage produit |
| `test/banc.test.js` | modifié | garde §11 retournée ; échappatoires hex fermées |
| `CLAUDE.md` | modifié | §0 (compte, taille), §2 (arborescence), §6 (quatre entrées) |
| `package.json` | modifié | `version` et `config.build` |

Aucun fichier de `src/sim/`, `src/data/` ou `src/render/` n'a été touché. Le
moteur était prêt ; il n'a rien fallu lui ajouter.

`foyer-zero-ui.html` n'a **pas** été touché non plus — c'est une maquette, et
l'écran s'en inspire sans la remplacer (§7).

---

## 3. La garde §11, retournée — la forme retenue

C'était le cœur du lot. La garde interdisait `Date.now` dans **tout** `src/`,
`index.src.html` compris. Elle rendait donc inutile le rattrapage hors ligne
livré au lot HORLOGE-MURALE : `charger(json, instantMs)` et
`serialiser(etat, instantMs)` réclamaient l'instant présent depuis la v6, et
personne n'avait le droit de le leur donner.

**La forme retenue est exactement celle que `CLAUDE.md` §6 annonçait :**

1. **Interdiction totale** sur `src/sim/`, `src/data/` et `src/render/` —
   assertion d'égalité à **0**, fichier par fichier.
2. **Exactement une** occurrence dans `src/ui/session.js`, **nommé dans le
   test** par la constante `PORTEUR_HORLOGE`.
3. **Le compte est asserté, pas borné.** « Au plus une » laisserait passer
   zéro, c'est-à-dire la disparition silencieuse du seul point d'entrée du temps
   réel — le jeu réafficherait les stocks d'hier soir sans qu'un test tombe.
4. **Le verdict est séparé de la mesure.** `fautesDHorloge(comptes, porteur)`
   prend une table de comptes et rend la liste des fautes. C'est ce qui permet
   de le falsifier avec des comptes fabriqués, sans toucher au dépôt.
5. **Les deux contournements sont refusés de face, porteur compris** :
   `new Date` et `performance.timeOrigin` donnent l'heure murale sans écrire le
   nom que la garde cherche. Chacun a son appât dans le test.

Dans `src/`, une seule fonction lit l'horloge — `maintenantMs()` — et tout ce
qui a besoin de l'heure l'appelle. **La garde n'a été affaiblie sur rien
d'autre** : l'interdiction de `Math.random` et le confinement du DOM à `ui/`
sont intacts.

### Falsification — mesurée, une mutation à la fois

Neuf mutations injectées dans le dépôt, chacune seule, suite relancée à chaque
fois, fichiers restaurés et comparés à l'octet entre deux :

| Mutation injectée | Verdict | Test qui tombe |
|---|---|---|
| `maintenantMs` ne lit plus l'horloge (**zéro**) | ROUGE | §11 horloge |
| **deux** lectures dans le porteur | ROUGE | §11 horloge |
| une lecture **hors** du porteur (`ui/chantier.js`) | ROUGE | §11 horloge |
| contournement par `new Date` | ROUGE | §11 horloge |
| contournement par `performance.timeOrigin` | ROUGE | §11 horloge |
| hex à **trois** chiffres (`#000`) | ROUGE | §11 palette |
| hex à **huit** chiffres (`#F5F3E80D`) | ROUGE | §11 palette |
| teinte hors fiche à six chiffres (`#123456`) | ROUGE | §11 palette |
| `rgba` hors fiche | ROUGE | §11 palette |

Zéro tombe, deux tombent, une-ailleurs tombe : les deux sens demandés par le
brief, plus un troisième qui compte autant.

⚠ **Un piège rencontré, et il vaut d'être écrit.** La première passe de
falsification a été menée avec `git checkout --` entre deux mutations. Les deux
modules sont **neufs**, donc non suivis : `git checkout` n'a rien restauré et
les mutations se sont **accumulées** — jusqu'à trois `export const` de même nom,
donc une erreur de syntaxe. Les neuf verdicts « ROUGE » de cette passe étaient
sans valeur : ils mesuraient une pile de mutations, pas une. Le dépôt a été
réparé, contrôlé par la taille du livrable (identique à l'octet), puis la
falsification refaite avec une sauvegarde par copie. **Une restauration se
vérifie ; elle ne se suppose pas.**

---

## 4. Ce qui a été testé sans écran, et comment

`node --check` ne prouve que la syntaxe, et le dépôt n'a ni jsdom ni navigateur.
Ce qui **peut** l'être l'est.

### `test/chantier.test.js` — 13 tests

Le montage de référence est **la base de la maquette** : onze bâtiments sur le
terrain de la case de départ, `champsDeLaBase(275, 16)`. Il est passé à
`problemesDeDisposition()` **avant** toute mesure — une disposition illégale
donnerait des débits qui ne veulent rien dire.

⚠ **Une base neuve n'aurait rien mesuré.** Un seul Chantier : zéro débit, zéro
capacité, et toutes les égalités passeraient sur du code cassé. C'est la leçon
d'`economie-base` — douze tests verts partis de zéro qui masquaient 197
divergences.

| Test | Montage effectif | Résultat |
|---|---|---|
| espace fine insécable | code de `SEPARATEUR_MILLIERS` asserté à **U+202F** ; espace ordinaire refusée | PASS |
| milli → unités | troncature, pas arrondi : 999 → « 0 » ; débit nul → « — » | PASS |
| dixièmes → « 4,6 » | décimale **toujours** montrée sur 5 valeurs rondes ; `4.6` refusé | PASS |
| onze sigles | égalité d'ensemble avec `BASE_BATIMENTS`, tous distincts, `/^[A-Z]{3}$/` | PASS |
| famille visuelle | déduite du rôle ; les 3 familles réellement employées ; 1 seul pivot | PASS |
| trois bandes | bornes lues dans `GRILLE` ; les 18 rangées couvertes une fois exactement | PASS |
| résumé de la base | 2 250 / 1 876 / 567 · 7 032 / 7 032 / 2 256 · 46 dixièmes · 11 / 12 | PASS |
| bandeau contextuel | raffinerie niv. 5 → « +176 q +352 s /h », **jamais 528** | PASS |
| palette des posables | 3 uniques posés absents, 2 uniques libres présents, 4 multiples restants | PASS |
| deux chemins d'avancement | boucle par tranches **contre** rattrapage d'un bloc, 1 600 ticks | PASS |
| clé de sauvegarde | ne porte pas `SAVE_VERSION` ; secours dérivé ; bornes des réglages | PASS |
| balisage produit | 24 identifiants, banc caché, `!important` de `[hidden]`, 6 contrôles désactivés | PASS |
| une heure de jeu | stock après 36 000 ticks **égal** au débit horaire, à l'unité près | PASS |

Deux tests méritent d'être signalés :

**« le résumé retrouve, par le moteur, les chiffres de la maquette ».** Les
treize chiffres du bandeau de ressources, des emplacements et du niveau sont
comparés aux valeurs relevées indépendamment le 27/08 et gardées par
`tools/audit-maquette.mjs`, **puis** recalculés par le chemin direct
(`capacitesMilli`, `debitsMilliParHeure`, `niveauDesBatiments`). Les retrouver
par deux chemins est ce qui prouve que l'écran **lit** le moteur au lieu de
graver ce qu'il affiche. Falsifiable : aucun des six chiffres n'a le droit
d'être nul.

**« les deux chemins d'avancement rendent le même état ».** `avancer()` boucle
sous `SEUIL_RATTRAPAGE_TICKS` et rattrape analytiquement au-dessus. Le test fait
avancer deux bases identiques de 1 600 ticks — l'une par tranches sous le seuil,
l'autre d'un bloc — et exige l'égalité de l'économie **et** de l'horloge. Le
seuil n'est donc pas un compromis d'exactitude, seulement de coût. Le même test
vérifie qu'une durée **négative** ne fait rien et ne lève pas.

### Vérification hors suite, exécutée, non commitée

Un DOM factice minimal (≈ 60 lignes, jeté dans le répertoire de travail) a fait
tourner `initialiserEcranChantier` → `peindre` → `rafraichir` → clic → une heure
de jeu → base neuve. Résultats relevés :

```
segments de rail : 3          cases : 162        champs peints : 12 (6 quartz / 6 scorie)
jetons           : 11  COL COL COL COL RAF CEN COL ACC CAS CHA CPX
emplacement libre: 1          posables : 8, tous désactivés
ressources       : 0 / 7 032 Quartz +2 250/h | 0 / 7 032 Scorie +1 876/h | 0 / 2 256 Élec. +567/h
emplacements     : 11 / 12    jauge 91.7 %
contexte         : Chantier de construction / Niv. 6 / vers niv. 7 — 3 boutons désactivés
après clic (15,6): Raffinerie / Niv. 5 · +176 q +352 s /h / vers niv. 6 — case marquée
après 1 h        : 2 250 / 7 032 | 1 876 / 7 032 | 567 / 2 256
base neuve       : 1 / 2 emplacements | 10 posables | 1 case libre marquée
```

⚠ **Ce faux DOM ne va PAS au dépôt, et c'est délibéré.** Un DOM maison dans
`npm run check` donnerait une assurance qu'il ne mérite pas : il ne connaît ni
mise en page, ni cascade, ni `aspect-ratio`, ni défilement — c'est-à-dire
exactement ce qui peut casser à l'écran. Il a servi ici à ce pour quoi il est
bon : attraper un identifiant fautif ou un plantage au premier rendu **avant**
le test appareil. Il ne remplace aucune des six vérifications ci-dessous.

---

## 5. Les six vérifications appareil — **AUCUNE EXÉCUTÉE**

⚠ **Un test appareil non exécuté se déclare NON EXÉCUTÉ, jamais passé.**

Cette session ne dispose d'aucun appareil : ni Galaxy S25 FE, ni émulateur, ni
navigateur. Les six vérifications du brief §8 sont donc, **toutes les six** :

| # | Vérification | État |
|---|---|---|
| 1 | la grille tient dans la largeur, cellules carrées, 9 colonnes sans défilement horizontal | **NON EXÉCUTÉE** |
| 2 | les trois boutons de bande amènent bien où ils disent | **NON EXÉCUTÉE** |
| 3 | les stocks montent en regardant l'écran | **NON EXÉCUTÉE** |
| 4 | fermer, attendre, rouvrir → les stocks ont avancé de la durée d'absence | **NON EXÉCUTÉE** |
| 5 | le geste de debug ouvre le banc, et on peut en revenir | **NON EXÉCUTÉE** |
| 6 | les boutons inertes se voient inertes | **NON EXÉCUTÉE** |

Ce qui a été fait **à la place**, et qui ne vaut pas preuve :

- **1** — les colonnes sont `var(--rail) repeat(GRILLE.largeur, 1fr)` et la
  cellule porte `aspect-ratio: 1`. Les fractions remplissent exactement la
  largeur, quelle qu'elle soit ; `overflow-x: hidden` sur la boîte de
  défilement. Juste par construction, **non vu**.
- **2** — le défilement vise `(premiereRangee − 1) × hauteurRangee`, et la
  hauteur d'une rangée est **mesurée** (`getBoundingClientRect`), jamais écrite
  en pixels. Le faux DOM confirme que les trois bandes existent et que la bande
  active suit. La cible réelle, **non vue**.
- **3** — le jumeau sans écran est le test « une heure de jeu » : ce que l'écran
  lit change quand le temps passe, et l'égalité est stricte.
- **4** — les **deux** chemins de retour sont écrits (§6). Ni l'un ni l'autre
  n'a été exercé sur un appareil.
- **5** — l'appui long, l'appel unique à `initialiserBanc` après démasquage et le
  bouton de retour sont écrits ; le geste n'a été fait par personne.
- **6** — `select:disabled, button:disabled, option:disabled { opacity: .45 }`
  existait déjà pour le banc et couvre les nouveaux contrôles ; le test de
  balisage asserte que les six sont bien `disabled`. **L'effet visuel n'a pas
  été regardé.**

**C'est la seule chose que ce lot ne peut pas livrer.** Le brief le dit :
« le test appareil est la preuve, et rien d'autre ».

---

## 6. Les décisions prises, et pourquoi

### Le temps : deux chemins de retour, pas un

Le brief ne demandait que le rattrapage de `charger`. Il ne suffit pas.

- Application **tuée** → la page recharge, `charger(json, maintenantMs())`
  rattrape. C'était déjà écrit au lot HORLOGE-MURALE.
- Application seulement **repliée** → la page n'est pas rechargée, donc
  `charger` n'est jamais rappelé. Et les horodatages de
  `requestAnimationFrame` sont **monotones** : ils ne courent pas pendant que
  la page est masquée. Sans rien de plus, les stocks resteraient ceux d'il y a
  une heure.

D'où l'instant retenu au masquage et la reprise qui rattrape la différence.
**La vérification appareil n° 4 échouerait pour la moitié des façons de fermer
le jeu si ce second chemin n'existait pas** — et le brief, lui, ne demandait que
le premier. C'est un écart en plus, pas en moins.

Sous le seuil, `avancer()` **boucle** `tickJeu` ; au-dessus, il rattrape. La
boucle reste le chemin normal parce que c'est elle qui portera le combat le jour
où `tickJeu` fera plus que l'économie.

### La sauvegarde

- Clé **`foyer-zero/partie/1`**. ⚠ **Le « 1 » est la version de
  l'EMPLACEMENT, pas du contenu.** Y mettre `SAVE_VERSION` rendrait introuvable
  toute sauvegarde d'un format antérieur, et la chaîne de migrations — six
  maillons, écrite et éprouvée — ne servirait plus jamais. Un test l'asserte.
- Écriture au `visibilitychange` vers `hidden`, **et** au `pagehide`, **et**
  toutes les 30 s. `pagehide` est ajouté parce qu'une WebView Android peut être
  rendue sans être masquée d'abord.
- Lire `localStorage` **lève** dans certains modes de confidentialité — ce n'est
  pas un `null` qu'on récupère. L'accès est pris une fois, sous garde ; le jeu
  tourne sans sauvegarde plutôt que de montrer un écran blanc, et **le dit**
  dans un bandeau d'avis.

### Une sauvegarde illisible : on montre, on propose, on ne décide pas

`charger` qui lève affiche un panneau nommant l'erreur. **Tant que le joueur
n'a pas tranché, l'écriture reste désarmée** — aucune partie neuve ne peut
écraser ce qui est peut-être récupérable. Deux issues : réessayer, ou démarrer
une partie neuve, auquel cas l'ancienne sauvegarde est **recopiée sous une clé
de secours** avant quoi que ce soit. Rien n'est supprimé, jamais.

Corollaire vérifié : la boucle ne démarre pas tant que l'état est `null`. Sans
cette garde, un aller-retour d'application pendant que le panneau est ouvert
relancerait la boucle sur `undefined.horloge`.

### Le geste de debug — **écart assumé par rapport au brief**

Le brief proposait un appui long de 1,5 s sur le numéro de version **du bandeau
d'onglets**, en le disant non arbitré. La durée et la nature du geste sont
gardées ; **son emplacement change**.

**Pourquoi.** À 360 px, le bandeau d'onglets porte quatre onglets à ~90 px.
Y insérer une cellule de version en ramène trois à ~77 px, et « Recherche » —
neuf caractères en capitales espacées à 12 px — n'y tient plus. Un onglet dont
le libellé est tronqué pour loger un numéro de build est un mauvais échange.

**Ce qui a été fait.** Le numéro vit à l'extrémité droite du bandeau
**Emplacements**, qui a de la place, et c'est lui qui porte l'appui long. Il
reste **à l'écran en permanence** — ce qui était l'argument du brief, et qui a
sa valeur propre : après une mise à jour par GitHub Pages, savoir quel build
tourne sur le téléphone se lit d'un coup d'œil. Sélection de texte, appel long
et menu contextuel d'Android sont désarmés dessus : ils recouvriraient l'écran à
l'instant même où le banc s'ouvre.

Retour au jeu : bouton **« ← Jeu »** en tête de la barre du banc.

⚠ `initialiserBanc(document)` n'est appelé **qu'à l'ouverture**, et une seule
fois — il démarre des écouteurs et mesure son canvas au câblage, et un élément
caché mesure zéro. Le démasquage vient donc avant l'appel.

### Deux améliorations de garde, non demandées

**Les échappatoires hex sont fermées pour le code livré.** `CLAUDE.md` §6
documente depuis le 27/08 que `#000` et `#F5F3E80D` passent au travers du motif
de la garde de palette, et que s'en servir est interdit. `tools/audit-maquette.mjs`
les refuse **de face** — mais pour la maquette seulement. Rien ne les refusait
pour `src/`, c'est-à-dire pour le seul code que le joueur verra. L'asymétrie
tombe : le balayage de `banc.test.js` les refuse maintenant aussi, avec un appât
pour chacun et un témoin qui vérifie qu'un hex à six chiffres légitime n'est pas
pris au passage. Aucun test ajouté — les assertions vivent dans le test qui
existait.

**Le rail des bandes est la première colonne de la grille**, et non un bloc posé
à côté comme dans la maquette. Posé à côté, dans une boîte flex, il se règle sur
la hauteur **visible** et non sur celle de la grille : dès le premier
défilement il se décale, et il finit par désigner la mauvaise bande. La maquette
ne pouvait pas s'en apercevoir — elle travaille à cellule fixe et à hauteur
fixe. C'est le genre d'écart qu'un modèle visuel ne peut pas porter.

---

## 7. La palette — la question de terrain reste ouverte

**Vingt-huit teintes, plus le seul `rgba(0,0,0,0.31)`.** Aucune couleur n'est
forgée en JavaScript : toute la palette vit dans la feuille de style, sous la
garde. Le balayage passe, et les quatre mutations de couleur ci-dessus le font
tomber.

⚠ **Les trois couleurs de terrain de la fiche n'ont PAS été employées.**
`#9FB3C5` · `#C1CEDA` pour le quartz, `#382E47` pour la scorie sont dans
`FICHE-STYLE.md` depuis le 27/08, mais **leur emploi n'est pas arbitré** et le
brief demande de ne pas trancher seul. Le rendu de la maquette est repris tel
quel : un champ est un **fond kaki plein avec un liseré** qui dit la ressource —
os pour le quartz, ambre pour la scorie.

**C'est une décision de style, elle revient à Ethan, et les deux se reprendront
ensemble** — les laisser diverger reviendrait à dessiner dans la maquette une
décision que l'écran ignore.

---

## 8. Ce que ce lot ne fait pas — à ne pas chercher

- **Poser, améliorer, démonter.** La couche d'action n'existe pas dans `sim/`,
  et elle attend un arbitrage d'Ethan : **la part de scorie dans un coût de
  construction**. Les trois boutons sont présents et désactivés — la place
  qu'ils prendront est tenue, et rien ne ment sur ce qu'on peut faire.
- **Les onglets Recherche, Monde, Options.** Rien derrière. Désactivés et
  grisés.
- **Le niveau de défense et le niveau d'armée.** L'état du joueur ne porte ni
  garnison ni armée : `ui/defense.js` et `ui/arsenal.js` sont des **éditeurs**,
  rien de ce qu'ils produisent n'est sauvegardé. Les deux bandes affichent
  « — ». Inventer une moyenne sur des unités que l'état ne porte pas afficherait
  un chiffre faux ; le tiret dit ce qui est vrai — qu'il n'y a rien à moyenner.
- **Le redéploiement.** Rien ne déplace encore une base, donc `position` et
  `fondation` coïncident toujours.
- **Les sprites.** L'écran dessine des jetons à trois lettres. `art/` n'est pas
  dans le bundle et le lot n'y touche pas.

---

## 9. Points laissés en suspens

1. **Les six vérifications appareil.** Aucune exécutée (§5). C'est le seul point
   qui empêche de dire que ce lot est prouvé.
2. **L'emploi des trois couleurs de terrain** (§7) — arbitrage attendu, et la
   maquette bougera en même temps que l'écran.
3. **La part de scorie dans un coût de construction** — c'est ce qui bloque la
   couche d'action, donc le lot suivant.
4. **La graine d'une partie neuve vient de l'horloge.** C'est le seul endroit où
   ce serait acceptable : une fois choisie, elle est écrite dans l'état et tout
   ce qui en découle est reproductible pour toujours. Ce que le dépôt interdit,
   c'est qu'un **tick** lise l'heure. L'alternative aurait été `Math.random`,
   refusé partout, ou une graine fixe, qui donnerait la même partie à tout le
   monde. À revoir le jour où le joueur pourra saisir sa graine.
5. **La palette des posables défile horizontalement** quand il y a plus de huit
   bâtiments — dix sur une base neuve. La maquette en montrait huit de front,
   dans un cadre 4 × 2. Le bandeau défile plutôt que d'en cacher deux ; à
   confirmer à l'œil, et à reprendre si Ethan préfère un autre découpage.
6. **`tools/audit-maquette.mjs` ne meurt pas.** Son en-tête annonçait sa fin
   « le jour où l'écran de jeu aura ses propres tests ». Ce jour est venu, et les
   deux ne mesurent pas la même chose : `chantier.test.js` vérifie que l'écran
   **lit le moteur**, l'audit vérifie que la **maquette ne ment pas**. `CLAUDE.md`
   a été corrigé sur ce point.

---

## 10. Livraison

- **PR**, jamais de merge : le merge sur `main` appartient à Ethan seul.
- La question des archives ne se pose pas — la livraison passe par une branche.
  Si elle devait repasser par des archives, `src/` et `test/` ne voyageraient
  **jamais** dans la même, et aucune archive ne proposerait deux dossiers de
  destination.
- `CLAUDE.md` §0 et §2 sont à jour, **noms compris** :
  `test/documentation.test.js` les asserte contre le disque, et la suite est
  verte.
