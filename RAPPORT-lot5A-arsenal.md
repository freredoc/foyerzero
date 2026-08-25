# RAPPORT — lot 5A : l'Arsenal

## Ce qui est livré

| | |
|---|---|
| `version` | **0.10.0** (0.9.0 → 0.10.0) |
| `config.build` | **10** (9 → 10) |
| `dist/index.html` | **66 800 octets, 65,2 Kio** (lot 4B : 56,8 Kio) |
| `npm run check` | build + **134 tests, tous PASS** (122 → 134) |
| `.xlsx` ouverts | **aucun** |

---

## 1. Fichiers touchés

| Fichier | Lignes | Nature |
|---|---|---|
| `src/ui/arsenal.js` | 310 (**nouveau**) | l'état pur : grille, budget, validation, indices |
| `src/render/scene.js` | 215‑227 (`dessinerEntite`), 475‑538 (`listeArsenal`) | le rendu |
| `src/ui/banc.js` | 67‑100 (`montageDuBanc`), 287‑397 (l'Arsenal), 400‑420 (inspecteur), 505‑560 (câblage) | le DOM |
| `src/index.src.html` | 94‑116 (styles), 139, 151‑161 (panneau) | la grille, la palette, le compteur |
| `test/arsenal.test.js` | 579 (**nouveau**) | T1 à T11 |
| `package.json` | 3, 8 | version et build |

`src/sim/generateur.js` **n'est pas touché** — `git diff` vide. `genererAssaut` n'a
été ni modifié ni « amélioré », conformément au §2.

---

## 2. L'invariant du lot

**La colonne de l'Arsenal est la colonne du champ, au pixel près.**

Aucune unité ne change jamais de colonne pendant un raid — vrai depuis le lot 2A.
La case où le joueur pose un Grenadiers *est* le couloir qu'il empruntera : la
position dans l'éditeur n'est pas une représentation de la décision tactique, elle
en est la totalité.

Techniquement, l'Arsenal **occupe les quatre rangées basses du champ**, là même où
l'assaut se déploie. Il n'y a donc aucune abscisse à recalculer : `listeArsenal`
appelle `xDeColonne` pour les colonnes et `yDeRangee` pour les rangées, exactement
comme `listeAffichage`. T1 l'assied sur trois viewports, et de deux façons — les
36 cadres de case tombent sur les neuf abscisses de `xDeColonne`, et les FORMES
elles-mêmes tombent au même pixel des deux côtés, colonne par colonne.

Un bénéfice non demandé en découle : la vague 1 de l'Arsenal est la rangée 4 du
champ, et `yDeRangeeMilli(4000)` vaut exactement `yDeRangee(4)`. Une unité posée
dans l'Arsenal est donc dessinée **au pixel où elle apparaîtra**. C'est ce qui rend
T8 aussi direct : on compare deux listes d'affichage aux mêmes coordonnées.

**Ordre des vagues** : la rangée du HAUT est la vague 1, celle qui part la
première ; la rangée du BAS est la vague 4. La file avance vers le haut.

---

## 3. Architecture

```
src/ui/arsenal.js      état 4×9, budget, validation, indices        PUR
src/render/scene.js    + listeArsenal(grille, projection, enFile)
src/ui/banc.js         câblage DOM : sélection, pose, retrait
src/index.src.html     la palette, les boutons, le compteur
```

`arsenal.js` n'importe que trois modules de **données** — `data/combat.js`,
`data/sites.js`, `data/niveaux.js` — et rien d'autre. Le test §10 l'assère en
lisant la liste de ses `import`, et vérifie que son état survit à un
`JSON.parse(JSON.stringify(...))` : c'est la condition de la sauvegarde à venir.

`listeArsenal` **ne définit ni forme ni couleur en propre**. Pour que ce soit
structurel et non promis, le dispatch de formes a été extrait en une fonction
unique, `dessinerEntite`, que les TROIS listes appellent — le champ, la légende et
l'Arsenal. Une divergence de dessin devient impossible sans toucher au dispatch.

---

## 4. Les règles de composition

| Règle | Mise en œuvre |
|---|---|
| **Budget** | une pose qui dépasserait lève, et l'état d'origine reste intact. Pas d'écrêtage |
| **Déblocage** | `unitesDisponibles(niveau)` ne rend que `apparition <= niveau` ; la palette ne montre pas les autres, elle ne les grise pas |
| **Une par case** | 36 emplacements, une unité chacun, cases vides autorisées partout |
| **Changement de niveau** | `avecNiveau` ne touche PAS à la composition. `bilan` signale `verrouillees` et `depassementBudget`, le banc le dit et propose `purger`. **Rien n'est jamais retiré en silence** |

Le brief ne listait pas `avecNiveau`, `purger` ni `depuisVagues` ; les trois sont
nécessaires au §5 (changement de niveau) et à T6 (aller-retour), et documentées.

---

## 5. L'indice de file — mesuré, et une correction au brief

Le prédicat retenu est celui du §6, mot pour mot : **deux unités non aériennes,
même colonne, la plus rapide dans une vague strictement postérieure.**

### Les nombres du brief sont justes ; sa formulation demande deux précisions

| montage | sortie |
|---|---|
| Fendeur **vague 2**, colonne 5, seul | tick **257** |
| Fendeur vague 2, derrière un Fusilier **même colonne** | tick **327** |
| Fendeur vague 2, Fusilier en **colonne 4** | tick **257** |
| Fendeur **vague 1**, seul | tick 208 |

L'écart est bien de **70 ticks**, sept secondes sur un plafond de quatre-vingt-dix.
Deux points de vocabulaire :

1. **Le Fendeur du brief est en vague 2**, pas en vague 1 — la vague 1 partirait
   cinquante ticks plus tôt et sortirait au 208. Le brief dit « un Fendeur seul en
   colonne 5 » sans le préciser.
2. **Il ne « sort » pas du champ.** Un blindé n'est pas traversant : il monte
   jusqu'à la dernière rangée, s'y trouve inutile, et rentre à la base après trente
   ticks — le repli du lot 3B. Seuls les aéronefs traversants sortent par le haut.

La troisième ligne est celle qui prouve le mécanisme : **le même Fusilier en
colonne 4 ne coûte rien.** C'est bien la colonne qui décide.

### Le cas négatif est confirmé

Un Frappeur en vague 2 sort au tick **120** — seul, derrière une Crécelle, ou
derrière un Fusilier. Masse nulle : les aéronefs ne bloquent rien et ne sont
bloqués par rien. Aucun indice n'est levé pour eux, dans les deux sens.

⚠ **Une erreur de mesure évitée, et qui vaut d'être consignée.** Ma première mesure
donnait 142 pour « Frappeur derrière une Crécelle », ce qui aurait contredit le
brief. Elle lisait le tick de fin du RAID, c'est-à-dire le départ du dernier
attaquant — la Crécelle, deux fois plus lente. En mesurant la sortie de chaque
unité, l'égalité à 120 apparaît. Le harnais du test mesure bien la sortie de
l'unité nommée, pas la fin du raid.

### C'est un indice, pas une interdiction

La pose reste permise. La colonne se marque d'une barre fine en kaki lumière —
aucune teinte neuve, et surtout aucun accent : les accents disent ce qu'une entité
peut tuer, jamais un avertissement. L'inspecteur explique en une phrase, et le
joueur peut se tromper exprès.

---

## 6. Tests

| | ce qu'il tient | résultat |
|---|---|---|
| **T1** | les neuf abscisses, sur 412×810, 360×640 et 800×800 : cadres de case **et** formes | **PASS** |
| **T2** | budget 70 au niveau 10 : 14 Grenadiers passent à 70 pile, le 15ᵉ lève ; budget 25 au niveau 1 : 5 Meute, la 6ᵉ lève ; l'état refusé est intact | **PASS** |
| **T3** | `unitesDisponibles(10)` = les quatre exactes ; 14 au niveau 40 ; une seule au niveau 1 ; poser une verrouillée lève | **PASS** |
| **T4** | rangée du haut → `vagues[0]` ; poser en 1 et 3 rend `[[…], [], […], []]` ; **le moteur fait bien entrer la vague 3 au tick 100** | **PASS** |
| **T5** | 50 niveaux × 3 profils : `genererAssaut` → Arsenal → `enVagues` → `creerCombat` sans lever, sans perte d'unité, coût conservé | **PASS** |
| **T6** | aller-retour identique, y compris grille vide ; état sérialisable | **PASS** |
| **T7** | 257 · 327 · 70 ticks ; la colonne 4 ne coûte rien ; l'Arsenal signale la colonne 5 et elle seule ; l'ordre inverse ne lève rien ; **aéronefs à 120 dans les trois cas** | **PASS** |
| **T8** | les 14 unités : primitives **identiques** entre `listeArsenal` et `listeAffichage`, accent compris ; aucune teinte hors de `FICHE-STYLE.md` | **PASS** |
| **T9** | 36 emplacements au niveau 50, 180 points engagés, **90 de reliquat** ; les 36 cases refusent ; vague 5 et colonne 10 lèvent | **PASS** |
| **§5** | baisser le niveau ne retire rien : les verrouillées restent et sont signalées ; `purger` est explicite | **PASS** |
| **T10** | `montageDuBanc` accepte encore un profil ; `executerRaidComplet` inchangé (tick 315) ; les vagues vides de queue ne changent pas le raid | **PASS** |
| **§10** | `arsenal.js` n'emploie ni DOM ni canvas ni hasard ; imports limités à `data/` ; aucun `Math.random` dans les quatre modules | **PASS** |

**T11 — build hors ligne** : `npm run build` passe, **66 800 octets**, aucune URL.

### Vérifié dans un vrai navigateur

Chromium, 412 × 915, réseau coupé : ouverture de l'Arsenal, palette des quatre
unités du niveau 10, pose de 7 Grenadiers en vague 1 puis 7 Fusiliers en vague 2 —
**70 / 70 points, 14/36 emplacements** —, refus de la quinzième pose avec son
message, retrait par toucher, boutons Remplir et Vider, puis raid joué jusqu'au
**tick 553**. **0 requête sortante, 0 erreur de page, 0 erreur console.**

### Deux corrections de mes propres tests, consignées

Le garde-fou de pureté a d'abord échoué sur **ses propres commentaires** :
`arsenal.js` disait « il n'importe ni le DOM ni le canvas », et `banc.js` dit depuis
le lot 3A « aucun `Math.random` nulle part ». Le lot 2A s'était déjà pris ce piège
deux fois. Plutôt que de tordre la prose une troisième fois, le balayage **dépouille
maintenant les commentaires** avant de lire — comme le T7 du lot 3C le faisait déjà.
Un garde-fou doit lire le code, pas interdire d'écrire le mot qu'il proscrit.

Le T1 a échoué une fois de son propre fait : il groupait les primitives par colonne
sans filtrer la rangée, et ramassait la Gangue du fond de carte dans le groupe de la
colonne 1. Corrigé par une borne en ordonnée.

---

## 7. Le banc

Le sélecteur `banc-assaut` ne commande plus l'assaut : il ne sert qu'au bouton
**Remplir**. À sa place, un bouton **Arsenal** qui bascule l'écran, et un panneau
portant la palette des unités débloquées avec leur coût, **Remplir**, **Vider**, et
le compteur « engagés / budget · emplacements · colonnes en file ».

- toucher une case vide avec une unité sélectionnée la **pose** ;
- toucher une case pleine la **retire** ;
- « Lancer » refuse une grille vide ou invalide, **ouvre l'Arsenal** et le dit.

`montageDuBanc` prend `vagues` quand on les lui donne, et retombe sur le profil
sinon — les tests des lots antérieurs et `executerRaidComplet` n'ont pas bougé
d'une ligne.

---

## 8. Les sept contrôles du §10

| contrôle | état |
|---|---|
| `arsenal.js` n'importe ni DOM ni canvas, état sérialisable | ✔ imports limités à `data/` ; aller-retour JSON asséré |
| `xDeColonne` partagé — aucune abscisse recalculée ailleurs | ✔ `scene.js` ne mentionne `margeX` nulle part ; T1 sur trois viewports |
| `listeArsenal` ne définit ni forme ni couleur en propre | ✔ dispatch unique `dessinerEntite`, partagé par les trois listes ; T8 compare les primitives |
| `genererAssaut` n'a pas été modifié | ✔ `git diff src/sim/generateur.js` vide |
| une vague vide ne décale jamais les suivantes | ✔ `enVagues` rend toujours quatre vagues ; T4 vérifie l'entrée au tick 100 |
| aucun `Math.random` dans `src/` | ✔ balayé sur les quatre modules, commentaires dépouillés |
| `npm run check` passe | ✔ build + **134 tests PASS** |
| aucun `.xlsx` ouvert | ✔ |

---

## 9. Écarts par rapport au brief

1. **Trois fonctions de plus** que les six listées au §4 : `avecNiveau`,
   `purger` et `depuisVagues`. La première et la deuxième servent le §5
   (changement de niveau sans retrait silencieux), la troisième sert T6 et le
   bouton Remplir. Aucune n'ajoute de règle.
2. **`listeArsenal` prend un troisième argument**, les colonnes en file. Le brief
   écrit `listeArsenal(grille, projection)` ; la liste des indices est calculée par
   `arsenal.js`, et `render/` ne doit pas dépendre de `ui/`. Le paramètre est
   optionnel et vaut `[]` par défaut.
3. **L'Arsenal est un écran à part**, ce que le §7 autorise explicitement. Il
   occupe les quatre rangées basses de la même projection, si bien que les colonnes
   sont aux mêmes pixels d'un écran à l'autre.
4. **Deux précisions au §6**, détaillées plus haut : le Fendeur de référence est en
   vague 2, et il se replie au lieu de sortir. Les nombres, eux, se retrouvent tous.
5. **Le garde-fou de pureté dépouille les commentaires** — décrit au §6.

---

## 10. Points laissés en suspens

**Le plafond de 36 emplacements**, consigné sans être corrigé comme le §5 le
demande : à partir du niveau 32, la grille borne l'armée AVANT le budget. Au niveau
50, 36 Fusiliers coûtent 180 points sur un budget de 270 — **90 points que la
grille ne peut pas loger**. T9 le mesure.

**La composition ne survit pas à un rechargement de page.** Hors périmètre, et
`depuisVagues`/`enVagues` sont déjà l'aller-retour dont la sauvegarde aura besoin :
T6 le vérifie.

Reconduits des lots précédents, sans changement : **la marge sous 900 ticks**
(deux raids sur 54 la dépassent), **le franchissement des barrières** décroché de
l'échelle des PV, et **le gel à 0 ‰** côté défense.

---

## 11. Ce qu'Ethan doit essayer en premier

### `camp / niveau 10 / graine 1`, composé à la main

Ouvrir l'Arsenal, poser **sept Grenadiers en vague 1** (rangée du haut) et **sept
Fusiliers en vague 2**. Le compteur affiche **70 / 70 points, 14/36 emplacements**,
et aucune colonne n'est marquée — les deux unités avancent à la même vitesse.

Puis lancer sur un camp de niveau 10. **Cette composition rase le camp en deux
passes.** Le générateur, sur le même site, en demande sept.

Et ce n'est pas un coup de chance de graine :

| graine | à la main | Infanterie | Blindé lourd | Mixte |
|---|---|---|---|---|
| 1 | **2** | 7 | 8 | > 8 |
| 2 | **2** | 2 | 2 | > 8 |
| 3 | **2** | 2 | 2 | 2 |
| 7 | **2** | 2 | 7 | > 8 |
| 11 | **2** | 2 | 8 | > 8 |

**Deux passes sur les cinq graines**, là où le générateur va de 2 à plus de 8 et ne
tient jamais deux passes partout. C'est la première fois que la main du joueur bat
la machine, et elle la bat régulièrement.

### Ensuite, l'indice de file

Passer au **niveau 15**, poser un **Fusilier en vague 1 colonne 5**, puis un
**Chasseur en vague 2 colonne 5**. La colonne 5 se marque, et le statut explique
pourquoi. Déplacer le Fusilier en colonne 4 : la marque disparaît. C'est
soixante-dix ticks de traversée, que rien à l'écran ne laissait deviner jusqu'ici.
