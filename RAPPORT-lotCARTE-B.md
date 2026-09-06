# RAPPORT — lot CARTE-B

Retours d'Ethan du 06/09, **points 3 et 4**. Le point 1 (« emblème carte à
centrer ») est hors lot et reste suspendu — §7. Le point 2 (« enlever son
d'ambiance sur la carte ») est le lot SON-VOLUMES.

---

## 0. Base de départ — conforme au brief, au caractère

| | attendu par le brief | mesuré au départ |
|---|---|---|
| `npm test` | 1135 pass / 0 fail | **1135 pass / 0 fail** |
| `dist/index.html` | 7 987 956 octets | **7 987 956 octets** |
| version · build | 0.99.2 · 103 | **0.99.2 · 103** |

Aucun écart : le lot est bâti sur la base que le brief annonce.

---

## 1. Ce qui a été produit

**Version 0.99.3 · build 104**, les deux bumpés ENSEMBLE et les deux **CHAÎNES
JSON** — vérifié par `typeof` après écriture, `"0.99.3"` et `"104"` :
`android/app/build.gradle.kts` les lit `as String`, et un nombre y ferait tomber
le build Android à la configuration, avant le moindre test, sans qu'aucun test JS
ne le voie.

| | avant | après | delta |
|---|---|---|---|
| `npm test` | 1135 pass / 0 fail | **1139 pass / 0 fail** | +4 |
| `dist/index.html` | 7 987 956 | **7 987 821** | **−135** |
| références externes | 0 | **0** | — |

**Le lot REND 135 octets, entièrement du JavaScript.** Mesuré poste par poste
contre un livrable rebâti depuis l'arbre d'avant (`git stash` sur le seul fichier
touché, build, comparaison) :

| poste | delta |
|---|---|
| JavaScript | **−135** |
| feuille | +0 |
| balisage | +0 |
| images | +0 |
| audio | +0 |

**296 lignes `data:` avant, 296 après ; 291 URI de part et d'autre.** La somme des
cinq postes tombe exactement sur le total.

Borne T10 **inchangée à 9 300 000** — le lot ne fait entrer aucune ressource, et
une borne ne se baisse pas parce qu'un lot rend. Marge **1 312 179 octets,
14,11 %**.

**Un seul fichier de `src/` est touché : `src/ui/monde.js`.** Ni `src/data/`, ni
`src/render/`, ni un autre écran.

---

## 2. Point 3 — la carte s'ouvre sur la base, au zoom maximum

### Ce qui change

1. `let echelle = CRANS[CRAN_PAR_DEFAUT]` → **`let echelle = ECHELLE_MAX`**.
2. `peindre` appelle **`cadrerSurLaBase(etat)` à CHAQUE ouverture**, là où il
   n'appelait `centrerSur` que quand `etatCourant` valait encore `null`.

`CRANS` est rangée du plus large au plus serré : la carte s'ouvrait sur
`CRANS[0]`, le **dézoom maximal**. `ECHELLE_MAX` se **lit** dans la table — écrire
256 ferait la seconde vérité que §4 de `CLAUDE.md` interdit, et la garde « l'écran
ne nomme aucune constante de zoom en dur » tomberait dessus. Une assertion
supplémentaire refuse désormais tout `let echelle = <chiffre>`.

### ⚠⚠ ÉCART AU BRIEF, DÉCLARÉ : LES DEUX MOITIÉS DE LA PHRASE NE SE SÉPARENT PAS

Le brief présente deux changements distincts — l'échelle **à l'initialisation**,
le recentrage **à chaque ouverture**. Pris à la lettre, cela rend la phrase
d'Ethan à moitié vraie à partir de la deuxième visite : centrée, mais au cran où
le joueur avait laissé la carte.

« Ouverture de la carte : centrée sur ma base du joueur au zoom maximum » est
**une phrase, un sujet, deux compléments**. Le brief lui-même argumente que
« ouverture de la carte » se lit à la lettre pour justifier le recentrage
systématique ; la même lecture littérale porte sur « au zoom maximum ».
`cadrerSurLaBase` pose donc **les deux** à chaque ouverture, et `CARTE-B T2` le
mesure : la falsification qui ne repose que la vue fait tomber ce seul test.

**Réversible d'une ligne**, dans un sens comme dans l'autre. Si Ethan veut garder
le cran choisi en revenant, c'est `echelle = ECHELLE_MAX;` qui sort de
`cadrerSurLaBase`.

### Le commentaire renversé, cité

Il défendait l'inverse ; il est **réécrit, pas supprimé** :

> ⚠⚠ LA VUE SE REFAIT À CHAQUE OUVERTURE DEPUIS LE 06/09, ET C'EST UN
> RENVERSEMENT ASSUMÉ. Ce paragraphe disait l'inverse : « recentrer sur la base
> du joueur chaque fois qu'on revient à la carte ferait perdre l'endroit qu'on
> était en train de regarder — c'est la première chose qui agace sur une carte »,
> et le recentrage n'avait lieu qu'une fois, quand la vue n'existait pas encore.
> Ce raisonnement n'est pas faux ; il est ÉCARTÉ. […]
>
> ⚠⚠ ET CE QUE ÇA COÛTE EST NOMMÉ : REVENIR D'UN RAID RAMÈNE LA VUE SUR SA BASE.
> L'endroit qu'on regardait est perdu, et il l'est aussi en revenant du Chantier,
> de l'Offense ou de la Recherche — la session appelle `peindre` à chaque
> `montrerEcran`. […]
>
> ⚠ C'EST UN CHOIX RÉVERSIBLE D'UNE LIGNE : remettre le `premiere` d'avant autour
> de l'appel rend le comportement du 31/08.

### Ce qui NE change pas

- **`#monde-recentrer` et le recentrage d'après-déplacement ne touchent pas au
  zoom.** Ils appellent `centrerSur` seul, et gardent le cran que le joueur venait
  de choisir : Ethan n'a parlé que de l'ouverture. `cadrerSurLaBase` est le seul
  endroit qui force l'échelle, et son commentaire le dit.
- Le bouton reste, et **son emploi se déplace** : il servait à rentrer d'une
  balade perdue, il sert maintenant *dans* une visite. Le commentaire de son test
  a été réécrit en conséquence ; **ses assertions n'ont pas bougé d'un caractère**.
- Le halo clignotant, les frontières, la bascule de base, le zoom continu au
  doigt : rien.

### `CRAN_PAR_DEFAUT` est RETIRÉE

`grep` avant de toucher : deux lecteurs de production dans tout le dépôt —
sa déclaration et l'initialisation qu'elle vient de perdre. Le brief prévoit ce
cas (« s'il ne sert plus qu'ici, le retirer et dire au rapport »). La garder à `0`
aurait laissé dans `src/` un nom qui affirme le contraire de ce que l'écran fait.
Un paragraphe prend sa place et dit ce qu'elle valait et pourquoi elle est partie.

---

## 3. Point 4 — la flèche va d'un centre à l'autre

Le retrait de `RETRAIT_FLECHE = 0,55` case aux deux bouts tombe. `traitDeLaFleche`
rend les deux centres tels quels, et l'angle en `atan2`.

### ⚠⚠ L'ORDRE DE DESSIN, RELEVÉ ET CONSIGNÉ — IL N'A PAS ÉTÉ TOUCHÉ

Corps de `dessiner()`, dans l'ordre :

1. `dessinerFond` — le sol
2. `dessinerFrontieres` — les limites de territoire
3. les emblèmes (`dessinerGrosse` / `dessinerEmbleme`)
4. les étiquettes, en seconde passe et sous seuil de densité
5. `dessinerHalo`
6. **`dessinerFleche`**
7. `dessinerCasesDuDeplacement`

**La flèche est peinte APRÈS les emblèmes**, comme le halo et les étiquettes. Un
emblème occupe la case ENTIÈRE — `dessinerEmblemeDUneCase` rend `cote: taille` —,
donc **le trait passe par-dessus les deux et masque le centre de la base du joueur
comme celui de la cible**. C'est ce que la demande implique ; l'ordre n'a pas été
changé pour l'adoucir, et la garde d'ordre de `monde.test.js` — qui exige déjà
`dessinerFleche` après `dessinerEmbleme` — n'a pas bougé d'un caractère.

### ⚠⚠ ÉCART AU BRIEF, DÉCLARÉ : LA FLÈCHE NE PORTE PLUS DE CHIFFRE

Le §2 du brief demande de vérifier que « le chiffre porté par la flèche reste
lisible » une fois le trait rallongé, et de le recalculer s'il était posé depuis
les extrémités reculées. **Il n'y a rien à replacer** : le prix a quitté la flèche
au lot CARTE-A, le 04/09 — « ne pas afficher les points d'attaque sur la flèche
[…] mais en gros dans l'onglet ». `dessinerFleche` n'écrit aucun texte ; le prix
vit dans `#monde-panneau-prix`, seul afficheur.

Le test `ciblageOuvert.cout === null` **reste**, pour la raison écrite ce jour-là
et qui n'a pas bougé : hors de portée, pas de flèche — une flèche vers une cible
inatteignable promettrait un raid que `problemesDuRaid` refusera.

### La garde « même case » tient

`traitDeLaFleche` rend toujours `null` sur deux cases identiques. Rien ne la
mesurait ; `CARTE-B T4` a été écrit **avant** la modification et vérifié vert sur
le code d'alors — **60 pass / 0 fail mesuré**.

### `RETRAIT_FLECHE` est retirée, et `Math.sqrt` avec

Aucun autre lecteur — vérifié dans `src/` comme dans `test/`. La racine
normalisait le vecteur pour reculer les deux bouts ; sans recul il n'y a rien à
normaliser. **`src/ui/monde.js` était le DERNIER porteur d'un `Math.sqrt` des
quatre dossiers de `src/`** : `RACINES_DE_DESSIN_TOLEREES` de `transfert.test.js`
tombe de **UN à ZÉRO**, et l'interdiction devient **totale** sur `data`, `sim`,
`render` et `ui`. La liste tombe toujours dans les deux sens. Second resserrement
de cette garde après celui du lot SOL-SATELLITE.

---

## 4. Les tests — T1 à T4, et le montage effectivement écrit

**Un faux document entre dans `test/monde.test.js`**, sur le modèle de ceux de
`chantier.test.js` et `recherche.test.js` : **aucune dépendance n'entre**,
`esbuild` reste la seule (§3 de `CLAUDE.md`). Le fichier ne mesurait jusqu'ici que
les fonctions pures et la SOURCE ; asserter par `assert.match` qu'`echelle` est
initialisée quelque part prouve la **ligne**, pas le **chemin**.

Trois choses le rendent honnête :

- il **lève sur tout identifiant que `src/index.src.html` ne déclare pas**, les
  vingt-quatre étant confrontés au balisage avant le montage — il garde donc aussi
  que l'écran ne demande aucun élément que la page n'a pas ;
- il ne rend **décodée que l'image des emblèmes**. Les huit planches de sol,
  l'atlas des limites et les deux grosses bases restent en attente : sans elles
  `dessiner` peint l'aplat d'attente et sort, là où les rendre prêtes ferait
  calculer de vraies dalles de 512² dans un canevas de papier. Les emblèmes, eux,
  DOIVENT être prêts — leur repli d'attente peint un `strokeRect` par site ;
- il **rejoue de vrais évènements de pointeur**, plutôt que de contourner le doigt.

**La vue s'observe par le halo, et c'est la seule fenêtre honnête.**
`initialiserEcranMonde` ne rend que `peindre`, `rafraichir` et `masquer` : ni
l'origine ni l'échelle ne sortent du module, et leur ouvrir un accesseur pour les
besoins d'un test mettrait dans `src/` une porte que la production n'emploie pas.
Le halo est peint À la position de la base et À l'échelle courante — son
`strokeRect` porte donc les deux grandeurs cherchées, telles que l'écran les a
réellement employées. Il est le **seul** `strokeRect` de la scène ; le test le
compte et lève au-delà de un.

| Code | Verdict | Montage effectivement écrit |
|---|---|---|
| **CARTE-B T1** | **PASS** | Écran monté, une ouverture. L'échelle se déduit du côté du halo (`pas − epaisseur`), donc de ce que `dessiner` a réellement employé. Asserte `ECHELLE_MAX`, **jamais un littéral**, puis balaie la table et refuse **chacun** des autres crans — un `!== CRANS[0]` passerait sur un cran intermédiaire. Vérifie d'abord que les deux bouts de la table rendent des halos différents, sinon le montage ne mesurerait rien. Croise enfin le `title` de `#monde-outils`, que l'écran écrit lui-même. |
| **CARTE-B T2** | **PASS** | Ouverture, relevé du halo. Puis un **vrai pincement** — deux `pointerdown`, un `pointermove`, deux `pointercancel` — qui dézoome **et** promène la vue en un geste : les deux moitiés du cadrage sont défaites, et deux assertions le prouvent avant d'aller plus loin. Puis `masquer`, une base déplacée en (250, 8), et `peindre` à nouveau. Asserte que le halo est **centré** aux deux ouvertures **et** que l'échelle est revenue au maximum. Une dernière assertion montre que la vue d'avant et celle d'après ne se confondent pas. |
| **CARTE-B T3** | **PASS** | Deux cases éloignées **dans les deux axes** — un retrait sur l'axe mort de deux cases alignées passerait inaperçu. Asserte `x1/y1/x2/y2` contre `centreDeLaCase` à l'**égalité stricte** : un « plus long qu'avant » passerait sur un retrait divisé par deux. Asserte aussi l'angle, et que `RETRAIT_FLECHE` n'est plus nommé dans l'écran. |
| **CARTE-B T4** | **PASS** | `traitDeLaFleche` d'une case vers elle-même rend `null` ; et deux cases **différentes** rendent bien un trait, faute de quoi un `null` partout passerait. **Écrit et vérifié vert AVANT la modification.** |

### Six falsifications, six chutes

Chacune sur l'arbre final, défaite après mesure.

| # | Falsification | Ce qui tombe |
|---|---|---|
| 1 | l'ouverture reprend `CRANS[0]`, aux deux endroits | **T1**, **T2**, + la garde d'initialisation |
| 2 | le cadrage revient au seul `if (premiere)` | **T2** seul |
| 3 | `cadrerSurLaBase` ne repose que la vue, plus l'échelle | **T2** seul |
| 4 | le retrait de 0,55 case revient aux deux bouts | **T3**, + la garde des racines |
| 5 | un retrait **divisé par deux** (0,275), écrit en `Math.hypot` pour que la garde des racines ne le dénonce pas à la place du test | **T3** seul |
| 6 | la garde « même case » désarmée | **T4** seul |

La cinquième est celle qui compte : c'est exactement le montage que le brief
exige de faire tomber, et elle ne fait tomber que le test qui la vise.

### Gardes existantes — quatre changent de cible, trois se resserrent

**Aucune assertion n'a été assouplie.**

- `zoom — le pincement […] est CONTINU` cherchait
  `let echelle = CRANS[CRAN_PAR_DEFAUT]` ; elle cherche `let echelle = ECHELLE_MAX`
  et **gagne** un refus de tout nombre écrit en dur. **Resserrement.**
- `DÉPLACEMENT T11 bis` assertait `trait.x1 > 45` et `trait.x2 < 145` —
  c'est-à-dire **n'importe quel** retrait. Elle asserte les deux centres à
  l'**égalité stricte**. **Resserrement.**
- `RACINES_DE_DESSIN_TOLEREES` passe de `['src/ui/monde.js']` à `[]` :
  l'interdiction devient totale sur les quatre dossiers. **Resserrement.**
- `monde — un bouton ramène toujours à la base du joueur` : son **commentaire**
  était périmé (il disait que la vue ne se recentre qu'à la première ouverture et
  en tirait la nécessité du bouton). Réécrit ; **ses assertions ne bougent pas**.

### Une assertion est RETIRÉE, et elle se déclare

`assert.equal(CRAN_PAR_DEFAUT, 0, 'la carte ne s\'ouvre plus sur la vue la plus
large')`. Son message dit exactement ce qu'Ethan renverse, et sa constante
n'existe plus. La propriété qu'elle gardait — sur quoi la carte s'ouvre — est
**reprise par `CARTE-B T1`, qui la mesure sur l'écran MONTÉ** au lieu de la lire
dans une constante. Un paragraphe prend sa place dans le test et dit pourquoi.

---

## 5. Ce qui n'a pas été fait, et c'était conforme

- **`python3 tools/verifier.py` n'a pas été lancé.** Le lot ne touche ni `art/`,
  ni un outil de la chaîne — pas un octet d'`art/sprites/` ne change.
- **`SAVE_VERSION` ne bouge pas, et reste à 26.** Pas un champ n'entre dans
  l'état : une échelle d'affichage, une origine de vue et deux bouts de trait
  vivent dans l'écran, et rien ne les sauvegarde.
- **Aucune valeur de `src/data/`, aucune ligne de `src/render/`.** Le lot est
  confiné à `src/ui/monde.js`, comme le brief l'exige.
- **Aucun relevé sur appareil.** Le dépôt n'a ni jsdom ni navigateur, et un test
  appareil non exécuté se déclare non exécuté (§3). Ce que le faux document
  mesure, ce sont les grandeurs que l'écran calcule ; ce qu'il ne dit pas, c'est à
  quoi la flèche par-dessus les emblèmes **ressemble**. À regarder sur le
  téléphone.

---

## 6. Points restés en suspens

1. **La flèche masque les deux centres** — conséquence directe et déclarée du
   point 4. Si Ethan la trouve trop couvrante, il y a deux leviers d'une ligne :
   dessiner la flèche **avant** les emblèmes (elle passerait dessous et l'ordre de
   `dessiner` changerait, ce qui touche une garde), ou lui rendre un retrait. Ni
   l'un ni l'autre n'a été pris de ma propre initiative.
2. **Revenir d'un raid ramène la vue sur la base.** Conséquence déclarée du
   point 3, réversible d'une ligne.
3. **Le zoom maximum à chaque ouverture** est une lecture, pas une dictée — §2.
4. **Le point 1 d'Ethan reste à arbitrer** — §7.

---

## 7. Le point 1 — « emblème carte à centrer » : la question, pas une réponse

Rien n'a été codé, conformément au brief. Le dépôt dit que l'emblème d'une case
est **déjà centré par construction** : `dessinerEmblemeDUneCase` rend
`cote: taille`, donc l'emblème couvre la case entière, et deux commentaires
distincts de `monde.js` s'appuient sur cette mesure. La grosse base 3 × 3 se
centre elle aussi — `empriseDeLaGrosseBase` prend `recul = (cotes − 1) / 2`, et
`cotesDuSite` ne rend 3 que pour la base terminale. Le cas 2 × 2 non centré existe
dans le code, et **aucun site ne l'emploie aujourd'hui**.

**Deux lectures restent ouvertes, et elles ne demandent pas le même travail :**

- **(a) « centrer l'emblème dans la vue »** — toucher un site ferait défiler la
  carte pour amener son emblème au centre de l'écran, typiquement parce que le
  panneau du bas le recouvre. C'est un geste d'écran, quelques lignes dans
  `ouvrirPanneau`.
- **(b) « centrer un emblème mal posé »** — un emblème précis, **ailleurs** qu'à la
  carte (panneau, écran de raid, vignette), serait décalé dans son cadre. C'est un
  défaut de dessin, et il faudrait savoir lequel.

**Ethan tranche.** Une capture de ce qu'il voit départagerait les deux en une
seconde.
