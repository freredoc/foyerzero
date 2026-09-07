# PASSATION — Foyer Zéro, session du 26/08/2026 (soirée)

> À lire avec `CLAUDE.md`, qui fait autorité, et **après**
> `PASSATION-2026-08-26.md`, qui couvre la session du matin (lots RÉSIDU,
> MIROIR, HYGIÈNE). Ce document-ci reprend là où l'autre s'arrête.

---

## 1. État du dépôt, mesuré et non cru

| | |
|---|---|
| Dépôt | `freredoc/foyerzero`, branche `main` |
| Version · build | **0.12.0 · 12** — inchangés de toute la soirée |
| `npm test` | **247 tests, 247 pass, 0 fail** |
| Durée de la suite | **19,8 s** |
| `npm run build` | `dist/index.html` — **81 236 octets**, SHA-256 `f6b082b4…5ad430` |
| `SAVE_VERSION` | **4** |
| Fichiers | `src/data/` 6 · `src/sim/` 11 · `src/render/` 4 · `src/ui/` 3 · `test/` 22 |
| Dernier lot mergé | lot BASCULE |

Relevé depuis `main` après dépôt, pas depuis une copie de travail.

**Premier geste de la prochaine session** : lire `CLAUDE.md`, lister la racine
et chaque dossier de `src/` et `test/`, puis `npm ci && npm run check`.

⚠ **`dist/index.html` n'a pas bougé d'un seul octet de toute la journée.** Neuf
lots, et rien n'est visible sur le téléphone : `src/index.src.html` n'importe
toujours que `ui/banc.js`. Le moteur tourne, personne ne le voit.

---

## 2. Ce qui a changé — neuf lots

Le moteur de la base du joueur est complet de bout en bout :
**carte → position → terrain → disposition → voisinage → débits → attribution
→ tick → sauvegarde.**

| Lot | Ce qu'il apporte |
|---|---|
| **BASE-0** | `data/base.js` mis sous test — il vivait depuis un mois sans une seule assertion |
| **CHAMPS** | `sim/champs.js` : 12 cases de terrain tirées de la POSITION |
| **RAFFINERIE** | stockage double, appariements Ouvrage, **garde-fou documentaire** |
| **RÉPARATION** | remise au vert de `main` + garde des emplacements de fichiers |
| **TICK** | `sim/economie-base.js` audité et corrigé (voir §4.3) |
| **COLIS** | retrait du reliquat du lot 1, `SAVE_VERSION` 2 → 3 |
| **CARTE** | `sim/carte.js` : distances de `GEOGRAPHIE` → coordonnées |
| **FONDATION** | toute base neuve = Chantier niveau 1 en (18, 5) |
| **BASCULE** | `state.js` passe sur le nouveau moteur, `SAVE_VERSION` 4 |

### Les arbitrages d'Ethan, tous consignés dans `CLAUDE.md` §6

- Le bâtiment des blindés est le **Dépôt de véhicules** (`depotDeVehicules`).
- **Colis abandonnés** : tous les bâtiments font de la production continue.
- **Géométrie** : la base du joueur EST la bande `batiments` de `GRILLE`, 8 × 9.
- **Champs** : 12 cases, 5/7 · 6/6 · 7/5, blocs de 1 à 3, jamais sur le
  pourtour, tirage déterministe par la position. **Seul le collecteur s'y pose**
  → douze collecteurs au maximum.
- **Le champ décide de la ressource du collecteur.**
- **Asymétrie voulue** : le collecteur ne touche AUCUN bonus de terrain.
- **La raffinerie stocke les deux ressources**, chacune à plein plafond, et
  **n'a pas de pendant Ouvrage** (côté Ouvrage c'est deux bâtiments).
- **Attribution par voisin** pour la raffinerie : 2 collecteurs quartz +
  3 scorie → 144/h et 216/h.
- **Un stock au-dessus du plafond est GELÉ, pas amputé.**
- **Départ du joueur** : rangée 275, colonne 16, niveau 5.
- **Toute base neuve** : Chantier niveau 1 en (18, 5), gratuit.
- **Aucune sauvegarde n'existe** — « personne ne joue, pas même moi ».

---

## 3. Ce qui reste ouvert

### 3.1 Le lot suivant, sans arbitrage : retirer `sim/economy.js`

Il est **orphelin** depuis la bascule. Vérifié en cherchant les vrais `import`,
pas les mentions : **un seul fichier l'importe encore, `test/economy.test.js`**.
Toutes les autres occurrences du nom sont des commentaires.

`params.batiments`, `params.stockage`, `params.courbes` et `params.adjacence` ne
vivent plus que pour lui. Purement mécanique, aucun arbitrage. **Fera baisser le
compte de tests**, comme le retrait des colis.

⚠ **Un commentaire est déjà périmé** : l'en-tête d'`economie-base.js` annonce
encore « CE MODULE NE REMPLACE PAS `sim/economy.js`, il vit à côté [...] et il
est encore branché à `sim/state.js` ». C'était vrai jusqu'à la bascule ; ça ne
l'est plus. À corriger avec le retrait.

⚠ **Chercher un import se fait sur `^import`, pas sur le nom du fichier.** Un
grep sur `economy.js` remonte quatre fichiers, dont trois qui n'en parlent qu'en
commentaire — de quoi conclure exactement le contraire de la vérité.

### 3.2 Brancher un écran

Le premier lot qui produira quelque chose de regardable, et le premier qui
demandera un **bump**. Rien n'a été pensé de ce côté.

### 3.3 Ce qui demande un arbitrage d'Ethan

- **Le redéploiement change les champs.** Chantier détruit → 20 cases vers le
  bas → nouvelle position → nouveau terrain. Ça **découle** du code livré, ça
  n'a **jamais été dit**. À confirmer avant que quoi que ce soit en dépende.
- **Valeurs manquantes** (onglet TROUS du classeur) : coûts de réparation des
  bâtiments et des unités, plafonds de stockage d'électricité, taux
  d'accumulation et plafond de la réserve de temps de réparation, formule du
  dépassement quand les défenses passent le niveau du Complexe.

### 3.4 Ce qui a été CLOS aujourd'hui — ne plus le lister

- ~~« La base du joueur est bloquée tant qu'Ethan n'a pas refait les
  captures »~~ — **faux depuis le 25/08**, voir §4.1.
- ~~Le reliquat des colis.~~ ~~La position de départ.~~ ~~La base initiale.~~
  ~~Le sort des sauvegardes v2.~~ ~~Le débit collecteur ← champ.~~
  ~~Le pendant Ouvrage de la raffinerie.~~ ~~« Atelier » dans
  `MODELE-REPARATION-1.md`.~~

### 3.5 Archipel Industry — non touché

Le **test fermé Play Store** reste prioritaire sur tout backlog technique, avec
trois tests appareil qui n'ont pas tourné (T6-PONT en premier).

---

## 4. Ce qui a coûté quelque chose — à ne pas réapprendre

### 4.1 Un blocage se vérifie dans le fichier de rang le plus élevé

La passation du matin déclarait la base du joueur **bloquée** en citant
`BASE-DU-JOUEUR-1.md` (rang 4, daté du 24/08). Or `src/data/base.js` (rang 2,
25/08) portait déjà les onze bâtiments. **Le blocage n'existait plus depuis un
jour**, et il a été reconduit une session entière. La hiérarchie de `CLAUDE.md`
§1 existe pour ça et n'avait pas été consultée.

### 4.2 J'ai écrit CINQ chiffres avant de les mesurer, tous faux

| Où | Écrit | Mesuré |
|---|---|---|
| tentatives du tirage de champs | « pire cas 4 » | **1, partout** |
| ordre de placement des blocs | « échoue bien plus souvent » | vrai, mais **invisible à 12 cases** |
| occurrences d'« atelier » | « plus aucune » | **cinq**, toutes légitimes |
| compte de tests de `CLAUDE.md` | 196 | **198** |
| valeurs de `DEBITS` | « six » | **sept** — rattrapé par Ethan, pas par moi |

Le remède n'est pas la vigilance, elle avait déjà été promise trois fois.
**`test/documentation.test.js` asserte désormais les compteurs de `CLAUDE.md`
contre le disque.** Ajouter un test ou un fichier sans le documenter rend la
suite ROUGE. Il est tombé sur moi cinq fois dans la journée, dont une où il a
signalé un `t.test(` qui était en réalité `interdit.test(source)` — **la faute
exacte que `CLAUDE.md` §6 documente déjà** : un motif de mot non borné.

### 4.3 Une suite qui part toujours de zéro n'atteint que la moitié des états

`economie-base.js` promettait un rattrapage identique au tick **au bit près**.
Faux : **197 divergences sur 300 bases** dès qu'un stock part au-dessus de sa
capacité. Ses douze tests étaient verts et ne mentaient pas — **ils partaient
tous de `creerEtatEconomie`, donc de zéro**, et depuis zéro un stock ne peut
jamais dépasser sa capacité. Le seul état où les deux chemins divergeaient leur
était inatteignable.

> Une suite qui ne construit ses états qu'avec le constructeur du module
> n'atteint que les états que le module sait produire. Les états **hérités** —
> une sauvegarde d'avant, une base amputée par un raid — se posent à la main.

### 4.4 Deux dépôts de suite tombés à côté, et c'était ma faute de livraison

`disposition.js` / `disposition.test.js` dans la même archive : sur téléphone, le
sélecteur n'affiche que les noms courts. Une fois le module s'est retrouvé dans
`test/`, une fois le test dans `src/sim/`. La seconde fois, le fichier de test
**ne se chargeait même pas** (import nommé absent = erreur de liaison), donc ses
vingt tests n'existaient pas — et le dépôt en déclarait 218 pour 199 exécutés.

Deux remèdes, tous deux en place :
- **`src/` et `test/` ne voyagent JAMAIS dans la même archive.** Archive 1 =
  `src/`, archive 2 = `test/` + racine. `main` est rouge entre les deux, c'est
  voulu, et le garde-fou le dit.
- **Une garde refuse tout `*.test.js` hors de `test/`** et tout module de
  production dans `test/`, en **nommant** le fichier fautif.

### 4.5 Un tour qui plante laisse ses fichiers derrière lui

Deux fichiers (`economie-base.js` et son test) sont apparus dans le répertoire
de travail entre deux tours. Ils venaient d'un tour **planté et relancé**, dont
le contexte avait été jeté — donc écrits par moi, sans que je m'en souvienne.

**La bonne réaction reste celle qui a été prise** : ne pas livrer du code qu'on
n'a ni écrit ni relu, quoi qu'en disent ses propres tests — *les tests venaient
avec le code, ils ne prouvaient que sa cohérence avec lui-même*. Ils ont été
audités de zéro, et l'audit a trouvé le défaut du §4.3.

**Lister `src/` et `test/` juste avant chaque archive**, et reconnaître chaque
fichier.

### 4.6 Un montage de test hérité doit être réexaminé après une bascule

Le test 11 rattrapait 1 h, 24 h et 72 h tick par tick — dimensionné pour le
moteur du lot 1, deux ordres de grandeur moins cher. Après la bascule : 2,6
millions de ticks, **58 s pour `state.test.js`**, la suite de 13 à **74 s**.

En creusant, la mesure de coût du module n'avait **jamais été prise qu'en un
point**. Courbe réelle : 2 µs à un bâtiment, 21 à neuf, 108 à vingt,
**280,7 à quarante**. Une base pleine coûte **neuf fois** le chiffre cité.

Horizons ramenés à 1 h et 2 h — ce que 72 h prouvaient de plus au niveau des
chemins de code : **rien**. Et remplacés par un test **meilleur** et en temps
constant : `rattraper(a)` puis `rattraper(b)` doit valoir `rattraper(a+b)`,
jusqu'à un mois d'absence coupé après un seul tick. Suite ramenée à **19,8 s**.

> Une suite qu'on hésite à lancer cesse d'être lancée.

### 4.7 Une garde morte se documente, elle ne se supprime pas

La falsification a montré que `i !== index` dans `voisinsQualifiants` est
**inatteignable** : `casesVoisines` exclut déjà le centre. Elle a été gardée,
avec le commentaire qui dit ce qu'elle tient et ce qui la rendrait nécessaire.
Sans lui, quelqu'un l'aurait « nettoyée » sans savoir.

### 4.8 « En haut » est ambigu et a coûté un lot

Le Chantier a été posé en (11, 5) — le côté **exposé** — avant qu'Ethan ne
précise (18, 5), le fond. Selon qu'on regarde l'écran ou les numéros de rangée,
« en haut » désigne l'un ou l'autre bout. **Ne plus employer le mot** : la
fonction s'appelle `caseDuChantier`, jamais `caseHaute` ni `caseBasse`.

---

## 5. La méthode, telle qu'elle a tenu

Inchangée sur le fond, et elle a payé : **chaque lot falsifié par injection de
défauts**, ancre vérifiée à une occurrence, sur une copie fraîche. Bilan de la
journée : **68 défauts injectés, 64 tombés**. Les quatre qui passent ont tous
appris quelque chose — deux gardes mortes, une stratégie de placement
équivalente, un test trop faible qui a été renforcé.

**Ce qui a changé** :
- deux archives par lot (§4.4) ;
- le garde-fou documentaire (§4.2) ;
- le rapport de lot entre au dépôt, comme depuis le matin.

**Ce qui n'a pas changé** : aucun bump quand `dist/index.html` ne bouge pas —
reconduit **neuf fois** aujourd'hui, toujours vérifié par SHA-256. Bumper
pousserait une mise à jour aux appareils pour un changement qui ne les concerne
pas.
