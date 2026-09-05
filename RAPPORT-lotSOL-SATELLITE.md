# RAPPORT — lot SOL-SATELLITE

**05/09/2026** · branche `claude/sprite-refonte-9il369` · version **0.95.0 · build 97**

`npm run check` → **1094 pass / 0 fail**, `dist/index.html` **8 991 743 octets**,
0 référence externe, **296 `data:`**.

---

## 0. Ce qui a été demandé, et ce qui a été fait

Ethan, 05/09, avec huit images :

> je viens de t'envoyer 8 planches de terrain satellite pour la carte du monde
> tu fais au mieux pour que ce soit joli que les transitions entre les
> différentes images se passent bien pas de fond ouvrage pour le moment tu fais
> le moins de traitement possible tu peux ouvrir la PR mais je vais voir ce que
> ça donne sur la carte avant

Quatre consignes, et elles se lisent ensemble. « Le moins de traitement
possible » condamne la moulinette qui existait ; « que les transitions se
passent bien » dit ce qui reste à écrire ; « pas de fond ouvrage » retire une
règle de jeu, temporairement ; « je vais voir ce que ça donne » veut dire que ce
lot est fait pour être regardé, donc que les captures comptent autant que les
tests.

**Le sol de la carte était une moulinette, et elle est retirée en entier.** Le
fond était un PAVAGE À SOMME PONDÉRÉE sur un atlas INDEXÉ : soixante-quatre
tuiles de 128 px dont chaque pixel valait 0 à 4, semées sur un réseau au pas de
56 — donc **cinq tuiles superposées sur chaque pixel** —, accumulées à la main
dans des `Float32Array` sous `μ + Σwᵢ(tᵢ − μ)/√(Σwᵢ²)`, puis **requantifiées sur
cinq teintes** d'une rampe de `FICHE-STYLE.md`. De l'art d'Ethan, il ne serait
rien resté à l'écran qu'un relief à cinq niveaux repeint.

Ce qui la remplace tient en une phrase : **on pose la planche telle quelle, et on
ne fond que les bords.**

---

## 1. Les mesures

| | avant | après |
|---|---|---|
| `dist/index.html` | 7 060 617 | **8 991 743** (+1 931 126, **1,273×**) |
| `data:` | 289 | **296** |
| borne T10 | 7 300 000 | **9 300 000** (marge 308 257, **3,43 %**) |
| tests | 1093 | **1094** |
| `art/sources/` | 465 | **473** (378 consommées · 95 dormantes) |
| `art/sprites/` | 12 dossiers, 1 306 fichiers | **13 dossiers, 1 460 fichiers** |
| `tools/` | 29 | **30** |

Poste par poste : les huit planches **+2 232 264 octets de base64**, l'atlas
indexé qui sort **−299 400**.

---

## 2. Le pavage — trois propriétés qu'aucune autre écriture ne donne ensemble

Les blocs font une planche entière (1 254 px), posés sur une grille régulière de
pas `COTE − FONDU` = 1 126 : ils se chevauchent de 128 px. Le poids d'un bloc est
le produit de deux profils séparables valant 1 à l'intérieur et montant en `sin²`
sur le fondu.

**(a) 78,6 % de la surface est le pixel source.** C'est la part où un seul bloc a
le poids plein — `((COTE − 2·FONDU) / PAS)²`. `SOL T4` la COMPTE sur le pavage,
aux quatre crans, au lieu de la croire.

⚠ **Le premier montage de ce test mesurait 0,6944 pour 0,7856 attendus, et
c'était LE MONTAGE qui avait tort** : il échantillonnait une fenêtre de 1 536 px
quand la période du pavage en fait 1 126, donc il tombait au milieu d'une
période. Il mesure désormais sur une période entière.

**(b) La somme des poids vaut exactement un.** Deux profils voisins sont `sin²`
et `cos²` du même angle. Mesuré sur une dalle entière, aux quatre crans : `Σw`
**minimum 1,000000000000000, maximum 1,000000000000000**.

Trois conséquences : rien à normaliser après coup ; aucune discontinuité de pente
donc aucun liseré ; et **plus de plancher anti-noir** — la garde `sw <= 0` de
l'ancien module, née d'un pas trop large, n'a plus d'objet.

**(b bis) Et l'exactitude s'arrête à l'alpha 8 bits du masque.** `Σw = 1` est
exact en flottant ; le masque est un canevas où `ui/monde.js` écrit
`round(w × 255)`. Mesuré aux quatre crans : dans une BANDE, où deux blocs se
croisent, l'écart vaut **0 sur 255** — les deux arrondis se complètent
exactement ; aux COINS, où ils sont quatre, **1 sur 255, soit 0,39 %**, un niveau
de clarté sur un petit carré. C'est la seule imprécision du pavage, `SOL T3 ter`
la borne, et la déclarer est ce qui distingue « exact » d'« assez exact ».

**(c) Il n'y a plus de normalisation `/√(Σwᵢ²)`.** Elle existait pour rattraper
l'écrasement du contraste que produit la moyenne de cinq textures. Avec un seul
bloc à poids plein sur quatre pixels sur cinq, il n'y a plus rien à rattraper —
l'appliquer ici gonflerait le contraste d'un facteur √2 **dans les seules bandes
de fondu**, c'est-à-dire dessinerait le raccord qu'on efface.

### ⚠⚠ Tout se dérive de la taille ARRONDIE du bloc

La tentation est de garder les flottants : `1254 × 0,125` fait 156,75 au cran 32.
Elle se paie. Les deux profils seraient rééchantillonnés séparément, leurs bandes
se décaleraient d'une fraction de pixel, et `Σw` cesserait de valoir un sur la
colonne du raccord — **un liseré d'un pixel, clair ou sombre, sur toute la
longueur de chaque couture**.

En arrondissant d'abord la taille et le fondu, le pas devient entier et la
complémentarité tombe juste au pixel :

| cran | échelle | taille | fondu | pas |
|---|---|---|---|---|
| 32 | 0,125 | 157 | 16 | 141 |
| 64 | 0,25 | 314 | 32 | 282 |
| 128 | 0,5 | 627 | 64 | 563 |
| 256 | 1 | 1 254 | 128 | 1 126 |

**Ce que ça coûte est mesuré** : l'échelle réelle du sol s'écarte de l'échelle
nominale d'au plus un demi-pixel sur 1 254, soit **0,04 %**, et le pas d'au plus
**0,18 %** au cran le plus large. Ça ne peut rien casser : le sol est un DÉCOR,
il n'est indexé sur aucune case, et rien ne se repère par rapport à lui.

---

## 3. Le module ne rend plus de pixels — et c'est ce qui économise 50 Mio

`render/terrain.js` rend une GÉOMÉTRIE : quels blocs, où, quelle orientation,
quel poids. `ui/monde.js` dessine au canevas.

Décoder les huit planches en `Uint8Array` aurait coûté **50 Mio** à lui seul
(8 × 1254² × 4 octets), à côté des 64 Mio du cache de dalles. Les planches
restent des `<img>` que le navigateur pose lui-même — et il les réduit mieux
qu'une boucle JavaScript en plus proche voisin, qui aurait fait scintiller le sol
au défilement.

⚠ **On réduit une fois par CRAN, pas une fois par bloc.** Une dalle du cran le
plus large demande dix-sept blocs ; les réduire à la volée referait dix-sept fois
la réduction d'une image de 1 254², soit vingt-sept millions de pixels lus pour
une dalle. Réduites d'avance, les huit coûtent 12,6 millions une fois pour
toutes. `imageSmoothingQuality` à `high` : une réduction de huit contre un en
bilinéaire simple n'échantillonne qu'un pixel sur soixante-quatre.

⚠ **Et le 1:1 ne passe pas par là** : au cran le plus serré, la taille de bloc EST
le côté de la planche, et l'`<img>` fait déjà l'affaire.

### ⚠⚠ `lighter`, parce qu'il additionne

Chaque bloc est peint dans un canevas à part, son masque de fondu lui est
appliqué en `destination-in` — il porte donc `w` en alpha et `v` en couleur —,
puis il est **ajouté** à la dalle. `lighter` somme les canaux prémultipliés : la
dalle finit avec `Σ w·v` en couleur et `Σ w` en alpha, et `Σ w` vaut exactement 1.

`source-over` rendrait `w·v + (1 − w)·fond`, ce qui n'est la bonne réponse que
pour DEUX blocs, et à condition de les poser dans le bon ordre. **Aux coins,
quatre blocs se croisent.**

⚠ Le masque est **invariant par rotation et par miroir** — le profil est
symétrique et le masque en est le produit sur les deux axes —, donc un seul par
taille suffit et il s'applique après la rotation sans avoir à la suivre.

---

## 4. L'alignement des moyennes — le seul traitement, et il était dû

Les huit planches ne sont pas à la même clarté. Luminance moyenne mesurée :

    1: 162,2 · 2: 160,0 · 3: 156,2 · 4: 155,4
    5: 154,0 · 6: 148,7 · 7: 153,9 · 8: 157,2

soit **13,5 sur 255 entre la plus claire et la plus sombre, 5,4 %**. Un bloc fait
une planche entière : cet écart-là se lit à l'écran comme des taches, un bloc sur
huit ressortant franchement gris-mauve à côté de ses voisins. **Vu sur le
prototype avant d'écrire une ligne de code.**

Mesuré, écart-type des moyennes locales sur une vue large de 1 200 × 1 200 au
cran 64, fenêtre de 127 px (un demi-bloc à l'écran) :

| | patchwork | contraste |
|---|---|---|
| sans alignement | **4,284** | 14,573 |
| avec alignement | **2,509** (−41 %) | 14,064 (−3,5 %) |

Le 2,509 qui reste est la structure propre de l'art, pas un défaut de raccord.

⚠ **C'est une TRANSLATION, pas une normalisation.** On ajoute une constante par
canal et par planche — la différence entre sa moyenne et la moyenne des huit — et
rien d'autre. Aucun gain, aucune courbe : le grain, les veines et les fractures
sortent identiques.

⚠ **Égaliser les écarts-types a été écarté.** Les planches n'ont pas le même
contraste parce qu'elles ne dessinent pas la même chose — l'éboulis de la 6 est
plus heurté que la poussière de la 3 —, et l'aplatir aurait effacé ce qu'Ethan a
dessiné pour qu'elles ne se ressemblent pas.

⚠ **La référence est la moyenne des huit, pas une planche élue** : `[198,79 ·
144,16 · 124,88]`. Prendre la première comme étalon aurait éclairci les sept
autres de cinq unités pour rien.

---

## 5. La qualité, et ce qu'elle coûte

| | base64 | PSNR médian |
|---|---|---|
| q85 | 3 660 040 | 37,4 dB |
| q80 | 2 840 884 | 35,9 dB |
| **q75** | **2 229 936** | **34,7 dB** |
| q70 | 2 062 264 | 34,3 dB |

Confronté à 1:1 sur la zone la plus texturée de la planche 6 — la plus heurtée
des huit —, **q75 ne se distingue pas de la source**. Et le sol de la carte est la
SEULE image du jeu presque toujours affichée RÉDUITE : trois crans de zoom sur
quatre. Descendre à q70 rendrait 167 672 octets pour 0,4 dB, pas assez pour valoir
une seconde qualité dans le dépôt.

C'est le réglage des huit décors de base depuis MUR-PEINT — une seule qualité à
connaître.

⚠ **La résolution ne bouge pas.** Une case de carte vaut `PIXELS_SOURCE_PAR_CASE`
= 256 pixels source, et le cran le plus serré vaut 256 pixels physiques : le sol
y tombe au **1:1**. Réduire rendrait un flou permanent à ce cran-là pour
économiser des octets sur la seule image que le joueur regarde en fond de tous
ses gestes de carte.

---

## 6. La borne T10, et la condition des sept mégaoctets

Le §0 du lot SON-CATALOGUE pose sept mégaoctets comme « la marge au-delà de
laquelle il faudra REMESURER ce démarrage avant de faire entrer quoi que ce
soit ». **Ce lot fait entrer de l'image pour de bon** — le §0 d'avant l'avait
annoncé : « les deux lots de terrain devront relever la borne EN ÉCRIVANT
POURQUOI ». La condition est donc due, et elle a été faite.

**Elle demande l'appareil d'Ethan, que le dépôt n'a pas (§3).** Mesuré dans
Chromium à la place, géométrie 360 × 780 à dpr 3, sept exécutions par côté,
médiane :

| | avant (7 060 617 o) | après (8 991 743 o) |
|---|---|---|
| `DOMContentLoaded` | 515 ms | **560 ms** (+45, +8,7 %) |
| premier rendu | 256 ms | **192 ms** |

+27 % de livrable pour +8,7 % de démarrage. **Ce n'est pas l'appareil, et le
relèvement de 7 300 000 à 9 300 000 est une proposition** — un nombre se change
seul, Ethan tranche.

Coût par image d'un pincement qui REVIENT du plus serré au plus large, la
direction exigeante (celle du lot ZOOM-CONTINU) :

| | médiane | p90 | max |
|---|---|---|---|
| avant | 16,8 ms | 56,7 ms | 169,6 ms |
| après | **16,7 ms** | **46,8 ms** | 186,3 ms |

**Le dessin par le navigateur n'est pas plus cher que la boucle de pixels qu'il
remplace.**

---

## 7. « Pas de fond ouvrage » — ce qui part, ce qui reste

`partOuvrageDeLaRangee` est **retirée sur demande, pas par oubli**. Elle faisait
basculer le sol vers l'ardoise à mesure qu'on montait vers la base terminale —
0 % au bord bas, 47,7 % au milieu, 100 % dès la rangée 50. C'était une
PROPOSITION, elle le disait en toutes lettres, et elle est retirée le temps
qu'Ethan regarde le sol satellite sur la carte.

⚠ **Conséquence à connaître : la carte n'a plus qu'un seul sol.** Ce que le joueur
lisait du camp d'une zone dans la COULEUR DU SOL, il ne le lit plus que dans les
frontières de territoire. C'est visible sur la capture large. **À rouvrir si tu
veux le retrouver** — c'est une ligne, et elle est nommée dans `data/sites.js`.

⚠ **Mais `TERRAIN_CARTE.rampes` reste, et le nouvel art tombe dessus.** Elles ne
peignent plus rien ; ce qu'elles sont désormais, c'est la RÉFÉRENCE DÉCLARÉE du
sol, celle contre laquelle le lot ARMÉE-ET-FRONTIÈRE a calibré les frontières de
territoire — « le sol de la carte est CLAIR des deux côtés », et les quatre tons
les plus sombres de chaque rampe ont été retenus pour ressortir dessus.

Mesuré sur les huit planches livrées :

- distance RVB au ton de rampe le plus proche : **9,0 en médiane, 14,0 au
  neuvième décile** ;
- bande de clarté du sol **p5 132 → p95 181**, contre **137 → 192** pour la rampe.

**La frontière garde exactement le contraste pour lequel elle a été
recolorisée.** C'est un CONSTAT, pas une contrainte imposée à l'art : le jour où
tu livreras un sol d'une autre famille, ce sont ces deux mesures-là qu'il faudra
refaire, et la frontière avec.

---

## 8. Ce qui a été mesuré puis écarté

**La brique.** Décaler une rangée de blocs sur deux d'un demi-pas casserait la
trame des coutures. Mesuré : le patchwork passe de **2,509 à 2,477**, soit
**−1,3 %**. Rien. Écartée par la mesure, pas par le goût — et le code est plus
simple sans.

**Le fondu à 256.** Il rend 2,369 de patchwork (−5,6 %) mais coûte **3,8 % de
contraste** (14,064 → 13,519) et surtout **double la part de surface mélangée**.
À 128 la couture ne se voit déjà pas à 1:1 sur la planche la plus heurtée.

**Deux métriques n'ont pas eu à être inventées** : celle du patchwork est
l'écart-type des moyennes locales, celle de la part intacte est un comptage.

---

## 9. Douze falsifications, douze chutes — et deux ont dû être refaites

| # | falsification | ce qui tombe |
|---|---|---|
| 1 | la moulinette rallumée dans `src/` | `SOL T10` |
| 2 | une neuvième planche dans la table | `SOL T1` + 3 |
| 3 | le pas faux d'un pixel | `SOL T3` |
| 4 | la géométrie rendue fractionnaire | `SOL T7` + 4 |
| 5 | le coin de la dalle entre au hachage | `SOL T5 bis` |
| 6 | quatre planches sur huit jamais tirées | `SOL T8` |
| 7 | le sel partagé avec le décor de base | `SOL T9` |
| 8 | le sol agrandi au cran le plus serré | `SOL T6` + 1 |
| 9 | `--atlas-sol` revient dans la feuille | `chantier` |
| 10 | une planche inlinée deux fois | `monde` |
| 11 | un appel réel au mode de déclaration | `sprite` |
| 12 | l'alignement des moyennes retiré | `SOL T11` |

⚠⚠ **DEUX N'ONT PAS MORDU AU PREMIER RELEVÉ, ET LES DEUX FOIS C'EST LA
FALSIFICATION QUI AVAIT TORT.**

(1) « un champ pris dans les bits de tête » : `h >>> 29` est un champ de trois
bits **parfaitement distribué**, quand le défaut historique était un champ de
vingt-trois bits pris dans les trois qui restaient. Le module n'emploie que six
bits sur trente-deux : ce défaut-là ne peut plus se commettre ici. Reprise en
« quatre planches sur huit ne sortent jamais », elle mord.

(2) « une planche inlinée deux fois » : le test lit `dist/index.html`, que la
falsification n'avait pas rebâti. Rejouée avec la reconstruction, elle mord.

**Une falsification qui ne mord pas se vérifie avant d'être crue** — quatrième
fois du dépôt.

⚠ L'art a été restauré après la douzième en **relançant l'outil**, pas par
`git checkout` : `art/sprites/sol/` n'est pas encore à l'index. Les huit SHA-256
reviennent identiques, vérifié.

---

## 10. Trois gardes ont lu leur propre prose — la sixième fois du dépôt

**`entrées — le mode de déclaration n'est jamais appelé`** ne décommentait que le
JavaScript. Le premier des fichiers qu'elle balaie est du **Python**, et un
paragraphe de `tools/verifier.py` qui NOMME ce mode pour dire qu'on ne l'appelle
pas la faisait tomber.

**C'est la garde qui a été corrigée, pas la phrase.** Elle connaît maintenant les
commentaires Python, et **elle ne retire que les lignes ENTIÈREMENT
commentées** : couper à tout croisillon mangerait les clés de fond magenta, qui
s'écrivent `'#FF00FF'`. Quatre sondes le vérifient — un appel réel survit, une
ligne commentée disparaît, une chaîne à croisillon est intacte, et aucun fichier
balayé n'est vidé.

Deux autres ont dû apprendre les **commentaires HTML** le même jour, pour la même
raison : celle du Chantier et `SOL T10` trouvaient `--atlas-sol` dans le
paragraphe qui explique sa disparition. Les deux portent un témoin qui prouve que
le filtre n'a pas mangé la feuille entière.

Après `viewport-fit=cover`, `MENTION_SATURE`, `variante.js`, `render/contour.js`
et le calque des traits, cela fait **six**.

---

## 11. Le témoin de `SON T9` a changé de nature, et il est plus fort

Il exigeait de voir le couple `%ATLAS_TERRAIN%` / `%ATLAS_TERRAIN_BASE%`, que
`tools/build.js` donne en exemple : c'était le seul cas du dépôt où un marqueur
**sans son `%` final** en préfixait un autre. Le premier des deux part avec
l'atlas du fond de carte, et — mesuré — **il ne reste aucune paire à risque dans
les 284**.

Un témoin adossé à un accident de nommage disparaît avec l'accident. Il est
remplacé par une **sonde** : on fait passer au même prédicat une paire fabriquée
dont on sait qu'elle est fautive, et une paire saine. La garde cesse de dépendre
de ce que la table contient aujourd'hui.

---

## 12. Le compte de tests, et les assertions retirées

Le total **monte de un : 1094**. Il se décompose :

- `terrain.test.js` : **13 → 15**. Le fichier est RÉÉCRIT en entier. Les treize
  d'avant portaient sur un module qui rendait des pixels — décodage de l'atlas
  indexé, somme pondérée refaite, 20 % de surface par teinte, plancher anti-noir,
  la formule comparée à l'alpha ordinaire. **Ce ne sont pas des assertions
  assouplies : leur SUJET a disparu.** Ce qui survit survit mot pour mot —
  l'indépendance des dalles, l'interdiction d'agrandir la source, la distribution
  du hachage.
- `monde.test.js` : **60 → 59**. Deux gardes sortent faute d'objet, une entre.

**Les deux retraits se déclarent :**

1. `page — la taille déclarée de l'atlas est celle du fichier, à l'octet`. Il
   confrontait `width`/`height` de `<img id="monde-atlas">` à l'en-tête du PNG.
   Ces attributs existaient parce que le SOL DE LA BASE lisait la largeur de
   façon synchrone ; ce sol est le décor peint depuis MUR-PEINT, et l'atlas est
   parti avec ce lot-ci. **La confrontation n'a pas disparu, elle a changé de
   côté** : `SOL T2` confronte `COTE_SOURCE` au manifeste de `tools/sols.py`.
2. `atlas — l'appariement d'une couleur est exact, et retombe sur la plus
   proche`. Il testait `indicesDeTeinte`, qui relisait l'atlas indexé. Remplacé
   par `sol — les huit planches s'attendent, et rien ne se dessine sans elles`.

Une assertion de plus est retirée dans le test d'attente : il vérifiait la rampe
de l'Ouvrage, qui ne peint plus le sol.

⚠ `RACINES_DE_DESSIN_TOLEREES` de `transfert.test.js` **tombe de deux à un** :
`render/terrain.js` n'a plus de `Math.sqrt`, c'était le `√(Σwᵢ²)`.

---

## 13. Relevé au doigt dans Chromium

360 × 780 à dpr 3, canevas 1080 × 1872, **zéro erreur de page** :

- la carte s'ouvre, les **huit balises `sol-*` décodent en 1 254 × 1 254** ;
- le pincement mène de **11 à 21 à 43 à 85 px CSS par case** — 85 × 3 = 255, donc
  le cran du 1:1 ;
- **deux captures du même état sont identiques à l'octet** (le rendu est une
  fonction de ses arguments) ;
- l'écran de la base est intact : **162 cases**, décor peint en place.

Aucune couture n'est visible à aucun des quatre crans, ni aucune trame de blocs.
Les captures sont jointes à la PR.

---

## 13 bis. Les outils

`python3 tools/verifier.py` → **1 415 identiques · 0 différent · 0 nouveau ·
0 MANQUANT**, verdict **VERT**, en **469,8 s**. Il était dû : le lot touche
`art/` et `tools/`. Le compte passe de 1 406 à 1 415 — les huit planches et leur
manifeste, et rien d'autre.

Second verdict, celui des entrées : **« la chaîne lit exactement les sources
déclarées »** — 378 consommées / 378 déclarées, 95 dormantes / 95,
`art/sourcesstandby/` 34 fichiers **0 lu**.

⚠ **Le PREMIER `entrees.py --declarer` de ce lot a rendu les huit planches
DORMANTES, et il avait raison** : `sols` n'était pas encore dans `CHAINE`. C'est
ce qui a fait ajouter la ligne au vérificateur — la garde a fait son travail
avant qu'on ait à s'en apercevoir autrement.

⚠ **`opusenc` manquait dans le conteneur** et faisait sortir la chaîne en 1 dès
`sons`. Ce n'est PAS un défaut du dépôt et il n'y avait rien à documenter :
`CLAUDE.md` §3 porte déjà la ligne `apt-get install opus-tools`, à côté de celle
de Pillow, numpy et scipy, avec le même avertissement. C'est exactement le cas
que ce paragraphe existe pour éviter — lire « chaîne cassée » là où il manque une
dépendance —, et il a fonctionné.

⚠ **La durée annoncée au §3 a vieilli** : elle dit « ~5 min 30 », le vérificateur
en prend **7 min 50** depuis que la chaîne porte les sons et ce lot. Corrigée.

---

## 14. Écarts déclarés

1. **`art/sprites/carte/atlas-terrain-64.png` reste au dépôt**, sans plus entrer
   dans le livrable. C'est une SOURCE DÉCLARÉE depuis l'écran de carte — aucun
   outil du dépôt ne le produit —, donc le retirer laisserait un fichier que
   personne ne sait refaire. Il coûte **zéro octet au joueur**, et il est la
   seule trace du sol procédural si tu veux y revenir. `controle-pavage.png` est
   dans le même cas depuis toujours.
2. **`%ATLAS_TERRAIN_BASE%` garde son suffixe.** Il le portait parce que
   `%ATLAS_TERRAIN%` était pris par l'atlas du fond de carte ; celui-ci est
   parti. Le renommer changerait le HTML de tous les appareils pour une
   cosmétique de source.
3. **Les quatre planches `terrain_map_planche_a..d.png` restent dans
   `art/sources/carte/`**, dormantes, comme avant ce lot : `art/sources/` ne
   s'ampute jamais.
4. **L'écran de raid n'a pas été rouvert.** Le lot ne le touche pas — le sol de
   la carte n'y entre pas —, mais il n'a pas été vu non plus, et ça se déclare.
5. **Le démarrage n'est pas mesuré sur l'appareil d'Ethan** (§6 ci-dessus).

---

## 15. Ce qui reste ouvert

- **Le fond de l'Ouvrage.** Retiré sur ta demande. La carte n'a plus qu'un sol,
  et le camp d'une zone ne se lit plus que dans la frontière de territoire.
- **La marche des coûts de montée** — 32 639 de scorie pour porter un Voltigeur
  au niveau 10 quand une base neuve en stocke 50. Relevé au lot
  NIVEAU-DES-PIÈCES, jamais arbitré.

`SAVE_VERSION` **ne bouge pas, et reste à 24.** Un sol est un dessin.
