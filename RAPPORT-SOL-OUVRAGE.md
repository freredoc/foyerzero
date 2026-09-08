# RAPPORT — lot SOL-OUVRAGE

Le sol de la carte du monde cesse d'être uniforme. Le bas reste le désert
d'aujourd'hui, le haut devient l'Ouvrage, et la bascule se fait **par plaques,
jamais par un trait**.

⚠⚠ **LA SUITE N'EST PAS VERTE, ET C'EST UN POINT D'ARRÊT DÉCLARÉ PAR LE BRIEF.**
`LIMITE T8` tombe, sur **DEUX teintes de frontière sur huit**, toutes deux dans
la rampe du JOUEUR. Le §4.4 du brief dit « s'arrêter, ne pas assouplir le seuil,
et le porter au rapport » ; le §7 interdit toute teinte de frontière neuve.
**Ni le seuil ni la rampe n'ont été touchés.** Voir le §5 ci-dessous, qui porte
la mesure ton par ton et les issues.

---

## 1. Version et numéro de construction réellement produits

**0.99.33 · build 135.** Les deux sont bumpés ENSEMBLE, et les deux restent des
**chaînes** dans `package.json` — `android/app/build.gradle.kts` les lit
`as String`, et un nombre y fait tomber le build Android à la configuration,
avant le moindre test (CLAUDE.md §6).

Le brief ne proposait aucun numéro, comme il se doit.

---

## 2. Le réglage retenu au §4.2, et les mesures qui l'ont désigné

**Côté 704, qualité 75.**

Le budget se refait avec les nombres du §0.4, relevés au départ et non repris du
brief : `9 300 000 − (8 654 436 − 2 232 272)` = **2 877 836 octets** de base64
disponibles pour le sol.

| côté | cases/planche | q | 8 ocres | 14 neuves | total base64 | marge |
|---|---|---|---|---|---|---|
| 768 | 3,00 | 75 | 809 016 | 2 412 864 | **3 221 880** | **−344 044** |
| **704** | **2,75** | **75** | **678 936** | **2 019 520** | **2 698 456** | **+179 380** |
| 704 | 2,75 | 70 | 627 044 | 1 893 200 | 2 520 244 | +356 056 |
| 640 | 2,50 | 75 | 559 828 | 1 649 348 | 2 209 176 | +668 660 |
| 640 | 2,50 | 70 | 521 232 | 1 542 556 | 2 063 788 | +814 048 |

⚠ **Cinq essais, pas quatre** : le brief en donnait quatre, le cinquième
(640/q70) a été mesuré pour savoir de combien on pouvait descendre si 704
n'était pas passé. Il ne l'a pas fallu.

⚠ **768 est REFUSÉ par la mesure, pas par le goût** : il dépasse la borne T10 de
344 044 octets. C'est la ligne qui rend le choix contraignant plutôt
qu'esthétique.

⚠ **La table du brief est reproduite à moins de 5 000 octets près** sur les
quatre lignes qu'il donne — l'écart est celui de l'encodeur WebP de cette
machine, et il ne change aucun classement.

⚠ **La qualité ne se dédouble pas.** `QUALITE` vaut 75 pour les vingt-deux,
ocres comprises. Descendre les seules ocres à q70 aurait rendu 51 892 octets ;
c'est le §7 du brief qui l'interdit, et il a raison — deux encodages dans le
même dossier, et le premier réglage futur n'en toucherait qu'un.

⚠ **Les huit ocres sont RECADRÉES au centre, jamais réduites.** `RECADREES` de
`tools/sols.py` ne contient que `ocre`. Un recadrage ne rééchantillonne rien :
le désert du bas reste pixel pour pixel celui d'hier, seul le taux de répétition
change — 2,75 cases par planche au lieu de 4,9, compensé par vingt-deux dessins
au lieu de huit. Les quatorze neuves passent de 1 024 à 704 en LANCZOS.

⚠ **Et le 1:1 n'est pas perdu.** 704 px sur 2,75 cases font toujours
`PIXELS_SOURCE_PAR_CASE = 256`, donc au cran le plus serré la taille de bloc EST
le côté et `solsALaTaille` rend l'image brute. Le commentaire de `sols.py` qui
affirmait le contraire est corrigé, comme le brief le demandait.

---

## 3. Taille finale et marge

`npm run build` → `dist/index.html`, **9 123 778 octets**, 0 référence externe.

Borne T10 **inchangée à 9 300 000** — marge **176 222 octets, 1,89 %**. Le brief
exigeait 150 000 au moins : il en reste **26 222 de plus**.

**Coût du lot : +469 342 octets**, mesuré poste par poste contre un livrable
rebâti dans un `git worktree` depuis `6f7b3bb` (8 654 436 octets, identique au
nombre du §0 de CLAUDE.md) :

| poste | delta |
|---|---|
| images | **+466 506** |
| JavaScript | **+2 200** |
| balisage | **+636** |
| feuille | +0 |
| audio | +0 |
| **somme** | **+469 342** |

et la somme des cinq postes tombe **EXACTEMENT** sur le total.

**297 lignes `data:` avant, 311 après ; 292 URI avant, 306 après** — soit
exactement les quatorze planches, et rien d'autre.

⚠ Le poste images se décompose lui aussi : **466 184** de charge base64
(2 232 272 → 2 698 456) plus **322** de préfixes `data:image/webp;base64,`, soit
14 × 23 caractères. Aucun octet n'est inexpliqué.

⚠ **Aucun atlas n'entre.** Une planche de sol fait 704 px et `tools/atlas.py`
ne coud que des cellules carrées à la taille de case : chacune voyage par son
propre marqueur de `tools/build.js`, comme les huit ocres depuis SOL-SATELLITE.

---

## 4. Écrêtage relevé au §4.1

Mesuré après alignement, avant encodage, et rangé dans
`art/sprites/sol/sol-empreintes.json` :

| famille | planches | écrêtage |
|---|---|---|
| ocre | 8 | **0,0003 %** |
| naturel | 7 | 0,3210 % |
| hybride | 3 | **0,5957 %** |
| artificiel | 4 | 0,2318 % |
| **les quatorze** | 14 | **0,3544 %** |
| **les vingt-deux** | 22 | **0,2256 %** |

Le brief annonçait 0,477 % sur les quatorze et 0,257 % sur les vingt-deux ; les
deux sont reproduits dans le bon ordre de grandeur, un peu plus bas. Les huit
ocres n'écrêtent rien, ce que le brief posait comme la condition qui rend
l'alignement acceptable — **le désert du joueur ne perd pas un pixel**.

⚠ **Et l'écrêtage par le BAS a fallu être inventé — c'est l'écart principal du
lot, il est au §9.**

---

## 5. Quantiles de clarté du sol, et verdict de `limite.test.js`

Clarté L\* du sol, **teinte appliquée** — `tools/sols.py` mesure chaque famille
sur l'intervalle de teinte où elle peut sortir, bornes comprises, donc le sol
tel qu'il est PEINT et non tel qu'il est rangé :

| | p1 | p5 | p50 | p95 | p99 |
|---|---|---|---|---|---|
| **après** | 29,83 | **39,19** | 59,12 | 73,79 | 79,98 |
| avant (8 ocres, SOL-SATELLITE) | — | **54,96** | 64,54 | 74,24 | 77,97 |

⚠⚠ **ET LA CHUTE SE DÉCOMPOSE EN DEUX, PAS UNE — CORRIGÉ APRÈS MESURE.** La
première écriture de cette section disait « sur les vingt-deux planches
encodées », ce qui est imprécis : les vingt-deux **stockées** rendent **47,75**,
et les **8,56** qui restent sont la TEINTE. Les quatorze planches de l'Ouvrage
coûtent donc 7,54, le dégradé 8,56. Le nombre 39,19, lui, est juste — reproduit
à l'identique en rejouant le chemin de l'outil sur les planches livrées.

⚠ **Le désert du bas est intact, mesuré à la même règle** : les huit ocres
RECADRÉES rendent **55,47** sans teinte, contre **55,29** pour les huit entières
d'avant le lot. Le recadrage ne coûte rien.

Par famille, p5, teinte comprise : **ocre 48,18 · naturel 37,29 · hybride 34,81 ·
artificiel 35,24**.

### `LIMITE T8` — **KO**

```
limite_j : #475A2F est à 3.5 sous le p5 du sol (5 au moins)
```

⚠⚠ **DEUX TEINTES SUR HUIT TOMBENT, ET NON UNE — LE PREMIER JET DE CE RAPPORT
DISAIT « une seule », ET IL AVAIT TORT.** Le test s'arrête au premier échec, donc
son message n'en nomme qu'une ; les huit ont été remesurées une par une :

| rampe | rang | ton | L\* | p5 − L\* | verdict |
|---|---|---|---|---|---|
| joueur | 1 | `#161A0E` | 8,49 | 30,70 | OK |
| joueur | 2 | `#2F3C20` | 23,47 | 15,72 | OK |
| **joueur** | **3** | **`#475A2F`** | **35,71** | **3,48** | **KO — manque 1,52** |
| **joueur** | **4** | **`#5F7A3E`** | **47,88** | **−8,69** | **KO — manque 13,69** |
| Ouvrage | 1 | `#100916` | 3,28 | 35,91 | OK |
| Ouvrage | 2 | `#26193C` | 12,18 | 27,01 | OK |
| Ouvrage | 3 | `#3B285C` | 20,90 | 18,29 | OK |
| Ouvrage | 4 | `#523A7A` | 29,97 | 9,22 | OK |

⚠⚠ **LE RANG 4 EST LE PLUS GRAVE, ET IL CHANGE DE NATURE PLUTÔT QUE DE DEGRÉ.**
`#5F7A3E` est désormais **plus CLAIR que le p5 du sol** : le ton le plus vif de
la frontière du joueur ne se lit plus « plus sombre que le sol » du tout sur la
moitié Ouvrage de la carte, ce qui est précisément la propriété que la garde
défend. Le commentaire du test le dit d'ailleurs de face — « MESURÉ : le pire
des huit tons est le kaki de rang 4, à 7,1 sous le p5 » —, relevé quand le p5
valait 54,96 : c'est bien ce ton-là qui avait le moins de marge, et c'est lui
qui a le plus bougé.

⚠ **Les quatre tons de l'Ouvrage passent tous**, le plus juste à 9,22.

⚠ **Rien n'a été touché** — ni le seuil de `limite.test.js`, ni la rampe de
`FICHE-STYLE.md`, ni `tools/limites.py`, ni un seul pixel de `art/sprites/limite/`.
Le §4.4 et le §7 du brief l'interdisent tous les deux.

⚠ **La famille qui décide est `naturel`**, pas la moyenne : c'est elle qui borde
le territoire du joueur, entre les rangées 226 et 96, et son p5 vaut 37,29.

⚠⚠ **ET LES DEUX ISSUES QUE CE RAPPORT PROPOSAIT D'ABORD NE MARCHENT NI L'UNE NI
L'AUTRE — MESURÉ, PAS RELU.** Elles sont conservées ci-dessous avec ce qui les
tue, parce que ce sont les deux premières auxquelles on pense.

1. ~~**Assombrir le ton fautif.**~~ **REFUSÉE PAR LE TEST LUI-MÊME.** `LIMITE T8`
   exige AUSSI que chaque ton de frontière garde la clarté de la rampe de CAMP de
   même rang **à 0,3 près** — c'est la moitié qui mesure « assez vif » sans
   laisser la rampe s'éclaircir. Descendre `#475A2F` de 1,52 porte son écart au
   kaki `#4E5742` de **0,05 à 1,46**, et cette assertion-là tombe. Le corriger
   demande donc de descendre **aussi le kaki des châssis**, c'est-à-dire de
   repeindre les unités du joueur partout dans le jeu. Et le rang 4 demanderait
   13,69, ce qui poserait les rangs 3 et 4 à la **même** clarté : ce n'est plus
   un ton à retoucher, c'est la rampe du joueur entière à redessiner.
2. ~~**Éclaircir la famille `naturel`.**~~ **INSUFFISANTE.** Pour que les huit
   tons passent il faut un p5 de **52,88** — contre 39,19 aujourd'hui et 54,96
   avant le lot. `naturel` est à 37,29, mais `hybride` est à 34,81 et
   `artificiel` à 35,24 : il faudrait éclaircir les **trois** familles de près de
   dix-huit clartés, c'est-à-dire défaire le dessin qu'Ethan vient de livrer.

**Ce qui reste, et qui appartient à Ethan :**

3. **Redessiner la rampe de frontière du joueur pour le nouveau sol**, et la
   rampe de châssis avec elle, en la recomprimant entre L\* 8,5 et 34,19. C'est
   la seule issue qui rende la garde telle qu'elle est écrite, et c'est une
   décision de style : `FICHE-STYLE.md` fait autorité.
4. **Accepter que la frontière du joueur se lise moins bien sur la moitié
   Ouvrage**, et desserrer la garde EN L'ÉCRIVANT — par exemple en mesurant
   chaque rampe contre le sol qu'elle rencontre vraiment. C'est l'issue nº 5
   ci-dessous, et ce rapport ne la prend pas.
5. **Donner à la frontière du joueur un second jeu de tons pour la moitié
   sombre.** Le §7 du brief interdit toute teinte de frontière neuve, donc ce
   lot ne peut pas le faire ; c'est aussi la seule issue qui ne coûte rien à ce
   qui marche déjà en bas de carte.

⚠ **L'issue nº 4 est écartée par ce lot, et il faut dire pourquoi.** Mesurer la
clarté du sol là où la frontière se dessine vraiment est JUSTE — la frontière du
joueur ne rencontre jamais l'`artificiel`. Mais prise sans arbitrage, c'est un
assouplissement de la garde déguisé en raffinement, et le §4.4 l'interdit
nommément. ⚠ **Et elle ne suffirait pas** : mesuré, le rang 4 tombe même contre
le p5 de l'ocre SEUL, 48,18 contre 47,88 — il lui manquerait encore 4,7 sur le
désert du bas, où il passait la veille. Ce n'est donc pas une frontière qui a
cessé d'aller sur le haut de la carte, c'est une frontière dont la marge était
déjà mince et que la teinte a mangée partout.

---

## 6. Les onze tests du §6 — résultat et montage EFFECTIF

> Le montage écrit est celui qui a tourné, pas celui du brief.

| # | brief | test qui a tourné | verdict |
|---|---|---|---|
| 1 | Σw vaut 1 | `SOL T3`, `SOL T3 bis`, `SOL T3 ter` | **PASS** |
| 2 | Part intacte 78,5 % | `SOL T4` | **PASS** |
| 3 | Les 50 rangées du haut | `SOU T3` | **PASS** |
| 4 | Le bas est intact | `SOU T2` | **PASS** |
| 5 | Monotonie | `SOU T1` | **PASS** |
| 6 | Stabilité au zoom | `SOU T4`, `SOU T4 bis` | **PASS** |
| 7 | Indépendance des dalles | `SOU T10`, `SOL T5` | **PASS** |
| 8 | La soustraction ne se replie pas | `SOU T8` | **PASS** |
| 9 | Manifeste et code s'accordent | `SOU T9`, `SOL T1`, `SOL T2` | **PASS** |
| 10 | La frontière se lit encore | `LIMITE T8` | **KO — point d'arrêt** |
| 11 | La borne de taille | `PIC T7` | **PASS** |

**Trois tests entrent en plus des onze** — `SOU T5`, `SOU T6`, `SOU T7` — et
chacun a été écrit parce qu'une falsification est passée sans mordre. Ils sont
au §6.12.

### 6.1 `SOL T3` / `T3 bis` / `T3 ter` — Σw vaut 1 — PASS

Montage : une dalle entière aux quatre crans, poids sommés au pixel. Minimum et
maximum **exactement 1,000000000000000**. Le test EXISTAIT ; il survit au
changement de côté (1 254 → 704) et de fondu (128 → 72), ce qu'on lui demandait.

⚠⚠ **`SOL T3 ter` A DÛ ÊTRE RÉANCRÉ APRÈS MESURE, ET IL SE RESSERRE.** Il
affirmait que l'exactitude s'arrête à un écart de 1/255 dans la bande de fondu.
À fondu 72, cette bande fait **9 pixels au cran 32, donc un nombre IMPAIR**, et
le pixel du milieu vaut exactement `sin²(π/4)` : les deux arrondis bougent
ensemble et la somme tombe à **254**, pas 255. Le test distingue désormais les
deux PARITÉS — écart 0 si la bande est paire, exactement 1 au pixel du milieu si
elle est impaire — et il est donc plus fort qu'avant.

⚠ Mon premier jet assertait `p[mid] === 0.5` et tombait sur
`0.4999999999999999`. Une égalité flottante ne se pose pas sur un cosinus.

### 6.2 `SOL T4` — part intacte — PASS

Montage : mesure sur le pavage, pas sur la formule. **78,51 %**, contre 78,55 %
avant le lot. Le brief attendait 78,5 %.

⚠ C'est ce qui a fait passer `fonduSourcePx` de **128 à 72**. Le laisser à 128
— il est en pixels SOURCE, et la planche a rétréci — aurait fait tomber la part
intacte à **60,49 %**, c'est-à-dire mélanger deux dessins sur deux pixels sur
cinq. 72 est `round(128 × 704/1254)`.

### 6.3 `SOU T3` — les cinquante rangées du haut — PASS

Montage effectif : **200 graines**, tout bloc dont la première rangée touchée
est ≤ 50, toutes colonnes du bord gauche au bord droit **avec une marge d'un
bloc de chaque côté**, aux quatre crans. Famille `artificiel` pour tous, **sans
exception**.

⚠ Le montage asserte d'abord qu'il a bien énuméré des blocs (sinon il passerait
sur une liste vide), et que la famille `artificiel` n'est pas la seule que le
tirage sache rendre.

### 6.4 `SOU T2` — le bas est intact — PASS

Montage effectif : **200 graines**, pour toute rangée ≥ 226, la famille de tout
bloc qui la touche est `ocre` ET `partDeTeinteDeLaRangee(r) === 0`. Vrai partout.

⚠⚠ **ET « INTACT » VEUT DIRE INTACT AU BIT.** L'ocre est la PREMIÈRE famille du
tableau, donc son décalage de début vaut zéro et son effectif vaut 8 : `h % 8`
est `h & 7`, exactement le tirage d'avant le lot. Le bas de la carte tire donc
les mêmes planches, dans le même ordre, sans qu'une ligne de compatibilité le
dise. La mettre ailleurs dans le tableau aurait redessiné le désert du joueur.

### 6.5 `SOU T1` — monotonie — PASS

Montage : `c1`, `c2`, `c3` échantillonnées sur `p ∈ [0,1]` au millième. Chacune
croissante, et `c1 ≥ c2 ≥ c3` partout, aux 1 001 points.

### 6.6 `SOU T4` et `SOU T4 bis` — stabilité au zoom — PASS

`SOU T4` : la famille d'un même `(by, bx)` calculée aux quatre crans, sur 30
graines et une plage de blocs. Identique — la rangée passe par les pixels
SOURCE, le cran n'entre pas dans le calcul.

⚠⚠ **`SOU T4 bis` EXISTE PARCE QUE `SOU T4` NE COUVRAIT PAS CE QUE LE BRIEF
DEMANDAIT D'ÉCRIRE, ET LA FALSIFICATION L'A DIT.** Rien ne reliait la rangée
qu'annonce `rangeeDuBloc` à la position où le bloc TOMBE vraiment : la faire
dériver ne faisait tomber aucun test. Le test exige l'égalité **EXACTE** au cran
le plus serré — où l'échelle vaut 1 — et borne l'écart aux trois autres par la
dérive d'arrondi de **0,18 %** déjà mesurée au lot SOL-SATELLITE. Le bord d'une
plaque peut donc bouger d'environ un quart de rangée au milieu de la carte quand
on pince ; c'est sous la case, rien ne s'indexe dessus, et **le module cesse de
déclarer que ce 0,18 % n'a aucun lecteur** : il en a un.

### 6.7 `SOU T10` et `SOL T5` — indépendance des dalles — PASS

`SOU T10` : une bande contenant le coude de teinte de la rangée 226, rendue en
une dalle puis en quatre, arrêts de dégradé comparés. Identiques.
`SOL T5` : le pavage, une zone rendue en une dalle contre la même en quatre.

⚠⚠ **ET LE RACCORD A ÉTÉ CHERCHÉ À L'ÉCRAN AUSSI, PAS SEULEMENT EN
ARITHMÉTIQUE.** Profil vertical de `R−B` moyenné sur les 1 080 colonnes du
canevas, au cœur de la transition, dans Chromium : montée monotone de **10,3 à
44,8** sur 1 872 lignes, **saut médian 0,359 · p99 2,83 · pire saut 4,01**. Un
détecteur de MARCHE — moyenne de 24 lignes au-dessus contre 24 au-dessous —
rend **2,98 au pire**, quand une dalle de 512 px porte à elle seule **9,5
unités** de montée. Il n'y a donc aucune marche de dalle ; ce qui reste est le
MOTIF, qui doit varier.

### 6.8 `SOU T8` — la soustraction ne se replie pas — PASS

Montage : minimums par canal des vingt-deux planches ALIGNÉES, lus au manifeste,
contre la soustraction ENTIÈRE réellement peinte.

`minimumParCanal` rend **(79 · 26 · 4)** contre un besoin de (69 · 21 · 0) :
marge **+10 sur le rouge, +5 sur le vert**.

⚠⚠ **LA MARGE SUR LE VERT NE VALAIT PAS ZÉRO, ELLE VALAIT MOINS QUE ZÉRO — ET
C'EST L'ÉCART PRINCIPAL DU LOT.** Voir le §9.1.

### 6.9 `SOU T9`, `SOL T1`, `SOL T2` — manifeste et code — PASS

`SOL T1` confronte les vingt-deux noms et les quatre familles entre **six
endroits** : `FAMILLES` de `render/terrain.js`, `NOMS_DU_SOL`, le manifeste,
`art/sprites/sol/` sur le disque, `src/index.src.html` et `tools/build.js`.
`SOL T2` confronte `COTE_SOURCE` aux côtés RELEVÉS dans le manifeste, pas
affirmés. `SOU T9` confronte `DELTA_TEINTE` de `render/` au `delta` du manifeste.

⚠ `render/` ne lit aucun fichier — c'est sa règle — donc la constante est ÉCRITE
dans le code, et le test est la seule chose qui l'accorde à sa source.

### 6.10 `LIMITE T8` — KO

Voir le §5. **Deux tons sur huit**, `#475A2F` à −1,52 du seuil et `#5F7A3E` à
−13,69 ; le test s'arrête au premier, les huit ont été remesurés à la main.

### 6.11 `PIC T7` — la borne de taille — PASS

`dist/index.html` construit, taille relevée : **9 123 778 ≤ 9 300 000**, marge
**176 222 ≥ 150 000**. Le test porte les deux assertions ; la seconde est neuve,
et elle vient du §6.11 du brief.

### 6.12 Les trois tests qui n'étaient pas au brief

- **`SOU T5` — le bruit de famille est LISSÉ.** Un tirage indépendant par bloc
  rendrait du poivre et sel, pas des plaques. Le test compare l'écart au voisin
  du bruit lissé à celui d'un tirage nu, sur **30 graines, les deux axes, de −6
  à 6**.
- **`SOU T6` — le sel du tirage de famille n'est partagé avec personne.**
  `SEL_FAMILLE = 7`, premier libre : 0 et 1 au peuplement, 2 et 3 aux POI, 4 à
  la variante, 5 au fond, 6 au bloc. Deux tirages indépendants qui partagent un
  sel finissent par se corréler.
- **`SOU T7` — la teinte a ses coudes, et les arrêts de dégradé les portent.**
  `partDeTeinteDeLaRangee` a deux coudes, aux rangées 96 et 226 ; un dégradé
  linéaire à deux arrêts les couperait en ligne droite. `arretsDeTeinte` insère
  un arrêt à chaque coude qui tombe DANS la dalle.

---

## 7. La borne réelle des rangées du haut purement Ouvrage — refaite

`partOuvrageDeLaRangee(r) = borne01((226 − r) / 150)`, donc elle vaut 1 pour
`r ≤ 76`. Mesurée par exécution plutôt que déduite :

| rangée | part d'Ouvrage | part de teinte |
|---|---|---|
| 1 | 1,0000 | 1,0000 |
| 50 | 1,0000 | 1,0000 |
| **76** | **1,0000** | 1,0000 |
| 77 | 0,9933 | 1,0000 |
| 96 | 0,8667 | **1,0000** |
| 97 | 0,8600 | 0,9923 |
| 150 | 0,5067 | 0,5846 |
| 200 | 0,1733 | 0,2000 |
| 225 | 0,0067 | 0,0077 |
| **226** | **0,0000** | **0,0000** |
| 295 | 0,0000 | 0,0000 |

**Les 76 premières rangées sont l'Ouvrage pur** — le brief posait 50 comme la
condition d'Ethan, il en reste **26 de marge**.

⚠ **Les deux axes cessent à la MÊME rangée, et le pivot est unique** —
`rangeePivot: 226`. Seules les largeurs diffèrent : 150 rangées pour les
familles, 130 pour la teinte. La couleur est donc pleine dès la rangée **96** et
les familles dès la **76**, si bien que les motifs artificiels du haut sont vus à
leur teinte de dessin et jamais à une teinte intermédiaire. Deux pivots auraient
laissé une bande où des plaques violettes se peignent en ocre.

---

## 8. `tools/verifier.py` — avant et après

### 8.1 AVANT — sur un arbre PRISTINE, avant qu'une ligne soit écrite

```
identiques à l'octet : 1096
différents           : 0
nouveaux             : 0
MANQUANTS            : 0
durée                : 842.7 s
  ATLAS    un atlas cousu ne correspond plus à ses sprites — relancer `python3 tools/atlas.py --ecrire`

VERDICT : la chaîne ne répond pas de ses sprites
CODE=1
```

et le détail de la ligne `ATLAS`, relevé et sauvé avant d'écrire :

```
  ÉCART atlas-chassis-64.webp
  ÉCART atlas-defense-128.webp
  ÉCART atlas-socle-128.webp
  ÉCART atlas-unite-128.webp
  ÉCART atlas-chassis-128.webp
  ÉCART atlas-tourelle_unite-128.webp
atlas identiques : 14 · différents : 6 · nouveaux : 0
```

⚠⚠ **CETTE DIVERGENCE EST PRÉEXISTANTE, ET LE LOT LA LAISSE OÙ IL L'A TROUVÉE.**
Six atlas, aucun de la famille `sol`, aucun touché par ce lot. C'est l'encodeur
WebP de cette machine, et `atlas.py` refuse d'écraser ce qui ne se reproduit pas
— le même constat que le lot OUVRAGE-CÂBLAGE portait sur trois atlas de carte.

### 8.2 APRÈS

```
identiques à l'octet : 1110
différents           : 0
nouveaux             : 0
MANQUANTS            : 0
durée                : 858.7 s
  ATLAS    un atlas cousu ne correspond plus à ses sprites — relancer `python3 tools/atlas.py --ecrire`

VERDICT : la chaîne ne répond pas de ses sprites
CODE=1
```

et `entrees.py --verifier`, dans la même exécution :

```
art/sources/            653 fichiers
  consommées (trace)    501   déclarées 501
  dormantes (déduites)  152   déclarées 152
art/sourcesstandby/      34 fichiers, 0 lu(s) par la chaîne
art/reserve/             10 fichiers, 0 lu(s) par la chaîne

VERDICT : la chaîne lit exactement les sources déclarées
```

et `atlas.py --verifier`, relancé seul pour comparer la ligne `ATLAS` à celle
d'avant :

```
atlas identiques : 14 · différents : 6 · nouveaux : 0
```

⚠⚠ **LE COMPTE PASSE DE 1 096 À 1 110, ET LE +14 EST EXACTEMENT LES QUATORZE
PLANCHES.** Rien d'autre n'entre ni ne sort.

⚠⚠ **ET LES VINGT-DEUX SONT DANS LES « IDENTIQUES À L'OCTET », LES HUIT OCRES
RÉENCODÉES COMPRISES.** C'est ce qui dit que la chaîne reproduit ce que le dépôt
porte : `tools/sols.py` recadre, aligne, planche et encode, et le résultat tombe
au bit sur les fichiers commités. Sans ça, personne ne saurait refaire ce sol.

⚠⚠ **LA LIGNE `ATLAS` EST EXACTEMENT CELLE D'AVANT — 14 identiques · 6
différents · 0 nouveau, les six mêmes fichiers.** Le lot laisse ce compte où il
l'a trouvé, comme le lot OUVRAGE-CÂBLAGE l'avait fait pour trois atlas de carte.
`src/data/atlas.js` et `atlas-empreintes.json` sont **identiques**.

⚠ **Le code de sortie 1 vient de cette seule ligne**, et il valait déjà 1 avant
le lot. Ce n'est donc pas une régression, et ce n'est pas non plus une excuse :
c'est un point ouvert, au §10.

⚠ **Et l'arbre n'a pas bougé pendant l'exécution.** La leçon de CLAUDE.md — « ne
jamais le lancer sur un arbre qu'on modifie » — a coûté une exécution complète au
début de ce lot : la première passe AVANT a été lancée pendant que les quatorze
tuiles arrivaient dans `art/sources/`. Elle a été arrêtée, l'arbre remis propre,
et relancée. Les deux passes rapportées ici tournent sur un arbre stable.

---

## 9. Écarts au brief, avec leur raison

### 9.1 Un plancher de stockage `(80 · 32 · 0)` a dû être inventé

⚠⚠ **C'EST L'ÉCART LE PLUS COÛTEUX DU LOT, ET IL VIENT D'UNE PRÉMISSE DU BRIEF
QUI NE SURVIT PAS AUX ÉTAPES QUE LE BRIEF PRESCRIT.**

Le brief pose que les minimums des quatorze planches alignées valent
`(71 · 21 · 0)`, et il en tire que la soustraction de `difference` — qui doit
retirer 69 au rouge et 21 au vert — ne se replie jamais, la marge sur le vert
valant zéro.

**Mesuré :** ils se reproduisent EXACTEMENT à 1 024. Puis :

| étape | minimums |
|---|---|
| alignement, à 1 024 | **(71 · 21 · 0)** ✓ |
| après LANCZOS vers 704 | (65 · 17 · 0) |
| après WebP q75 | **(69 · 16 · 0)** |

**Le vert passe sous 21.** Or `difference` calcule `|d − s|` : sous le seuil, la
soustraction se REPLIE et les pixels concernés **s'éclaircissent au lieu de
foncer**. Sur les planches les plus sombres du haut de la carte, c'est-à-dire
exactement là où le violet doit être plein.

**Le remède retenu** est un `PLANCHER = (80 · 32 · 0)` appliqué au STOCKAGE,
après l'alignement et **avant** l'encodage — l'ordre compte : posé après,
l'encodeur le referait tomber. Il est mesuré des deux côtés :

- **0 pixel sous le seuil après encodage** — `minimumParCanal` rend
  `(79 · 26 · 4)`, donc +10 et +5 de marge ;
- **11 pixels relevés sur 6 938 624**, soit **0,000159 %** des quatorze
  planches — contre les **0,354 %** d'écrêtage par le HAUT sur ces mêmes
  quatorze, que le brief accepte déjà. Le prix est deux mille fois plus petit
  que celui qui est déjà payé.

⚠ **Deux autres remèdes ont été écartés.** Relever le plancher côté RENDU
demanderait une troisième passe de composition par dalle. Réduire Δ ferait
mentir la `referenceViolette`, donc le haut de la carte ne serait plus à la
couleur qu'Ethan a dessinée.

### 9.2 Le repère a dû être mesuré sur les planches ENTIÈRES

Mon premier jet le mesurait sur les huit ocres **recadrées**. La référence
dérivait de **1,2 niveau** et Δ ne reproduisait plus le nombre du brief. Elle se
lit sur les huit planches entières, ce qui la laisse à
`(198,7909 · 144,1583 · 124,8837)`, **inchangée depuis SOL-SATELLITE**.

⚠ **La recalculer sur les vingt-deux déplacerait le sol du BAS**, qu'Ethan veut
intact. Le manifeste porte la phrase qui le dit, pour que personne ne « corrige »
ce qui n'est pas cassé.

### 9.3 `render/interpolation.js` n'a pas été employé

Son nom le désigne, et il ne convient pas : il importe `sim/clock.js` et
interpole des MILLI-entiers de position dans le TEMPS de la simulation. La teinte
est une fraction de rangée, sans horloge. L'y faire passer aurait fait dépendre le
dessin du sol du module qui cadence le combat.

### 9.4 L'exception à la garde de palette §11 est nommée et bornée

Les deux couleurs du dégradé sont **calculées** — `rgb(${…})` — et
`FICHE-STYLE.md` ne les contient pas. C'est normal : ce ne sont pas des teintes,
c'est une translation par canal, et l'inscrire dans la fiche autoriserait 512
couleurs dans toute la feuille.

⚠⚠ **LE CONTOURNEMENT ÉTAIT D'ASSEMBLER LA CHAÎNE À L'EXÉCUTION, ET IL A ÉTÉ
ÉCARTÉ DE FACE** : c'est passer sous un garde-fou en silence, ce que CLAUDE.md §6
interdit déjà pour les hex à trois chiffres et pour l'espace de noms SVG.

L'exception porte sur `src/ui/monde.js`, sur **exactement deux** couleurs
calculées, et le fichier doit nommer `DELTA_TEINTE`. **Trois falsifications la
font tomber** : une troisième couleur calculée, une couleur littérale hors fiche,
une couleur calculée dans un autre fichier.

### 9.5 Trois comptes de la §2 de CLAUDE.md étaient déjà faux

Mesuré contre `HEAD`, avant ce lot : `tools/` annonçait 42 et en portait **45** ;
`art/sources/` annonçait 558 et en portait **639** ; `art/sprites/` annonçait
1 045 fichiers et « TREIZE dossiers » et en portait **1 143** et **QUATORZE**.

Aucune garde ne compte ces trois-là — la §2 le dit elle-même. Ils sont recomptés
fichier par fichier et la correction est **déclarée**, pas glissée.

### 9.6 Le rendu n'a pas été vu sur appareil

Tout ce qui est relevé ci-dessous l'est dans Chromium à la géométrie du S25 FE,
et **ce n'est pas le téléphone d'Ethan** (CLAUDE.md §3).

Relevé, sur un vrai voyage du sud au nord — quarante glissements au doigt par
CDP, au cran le plus large :

- le sol part à `R−B = 73`, l'ocre d'aujourd'hui ;
- il glisse **sans marche** de 65 à −7 sur onze relevés ;
- il se fixe à **rvb (129, 123, 140)**, c'est-à-dire EXACTEMENT la
  `referenceViolette` du manifeste, `(129,75 · 123,08 · 140,57)`, arrondie ;
- les **vingt-deux planches décodent en 704 × 704**, toutes en
  `data:image/webp` ;
- `difference` est appelée **61 fois**, `createLinearGradient` **122 fois** —
  deux par appel, un par couple de canaux ;
- les deux derniers dégradés portent `rgb(69, 21, 0)` et `rgb(0, 0, 16)` **aux
  DEUX arrêts** : Δ appliqué en plein, sur une dalle entièrement dans le violet ;
- **zéro erreur de page, zéro débordement horizontal.**

⚠ Un premier relevé n'a rien mesuré du tout, et il faut le dire : il dispatchait
des `PointerEvent` synthétiques, sur lesquels `setPointerCapture` LÈVE — le
glissement ne s'enregistrait pas, la carte ne bougeait pas, et la couleur restait
ocre sur les quarante-trois échantillons. **Le doigt se rejoue par CDP**, comme
les lots RETOURS-DU-31 et ASSAUT l'avaient déjà appris.

---

## 10. Points laissés ouverts

1. ⚠⚠ **`LIMITE T8`, et il appartient à Ethan.** DEUX tons sur huit tombent, et
   les issues sont au §5 — les deux premières auxquelles on pense y sont
   mesurées et écartées. Tant qu'il n'a pas tranché, `main` sera rouge sur ce
   test si le lot est fusionné tel quel.
2. **La marge T10 est à 1,89 %, la plus mince depuis longtemps.** Le prochain lot
   qui fait entrer une image devra relever la borne EN ÉCRIVANT POURQUOI, ou
   tenir dans 176 222 octets.
3. **Six atlas ne se reproduisent pas à l'octet sur cette machine**, et c'est
   antérieur au lot. À reprendre le jour où quelqu'un touchera à `atlas.py`.
4. **Le taux de répétition du sol a changé** — 2,75 cases par planche au lieu de
   4,9, pour 22 dessins au lieu de 8. Le brief demandait de le mesurer sur une
   vue large plutôt que de le croire ; il l'a été à l'écran et rien ne se lit
   comme une répétition, mais **ce n'est pas l'appareil d'Ethan** et c'est lui
   qui jugera.
5. **Les quatorze planches ne sont pas raccordables bord à bord**, et le pavage
   n'en a pas besoin — c'est ce que le §7 du brief pose. Si Ethan veut un jour
   des motifs qui se raccordent, c'est un autre lot et un autre outil.
6. **La largeur de la transition est un réglage, pas une mesure.** 150 rangées
   pour les familles, 130 pour la teinte : les deux nombres se changent seuls
   dans `TERRAIN_CARTE.ouvrage`, et Ethan n'a donné ni l'un ni l'autre.
