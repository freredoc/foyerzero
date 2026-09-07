# RAPPORT — lot ÉCRAN-CARTE

**La carte du monde à l'écran.** Onglet Monde ouvert, canevas, quatre crans de
zoom, défilement au doigt, pavage organique du fond et emblèmes des sites.

Tout est **mesuré**, jamais estimé. Ce qui n'a pas pu l'être est dit non mesuré.

---

## 1. Ce qui a été produit

| Grandeur | Avant | Après |
|---|---|---|
| `package.json` | version 0.29.0, `config.build` `"30"` | version **0.30.0**, `config.build` **`"31"`** |
| `npm test` | 427 pass / 0 fail | **458 pass / 0 fail** |
| `npm run build` → `dist/index.html` | 188 451 octets | **503 724 octets** |
| `SAVE_VERSION` | 8 | **8, inchangé** |

⚠ Les deux champs de `package.json` ont été édités **textuellement**, jamais par
un sérialiseur JSON : ce sont des **chaînes**, et `android/app/build.gradle.kts`
les lit `as String`. Vérifié après coup — `"version": "0.30.0"` et
`"build": "31"`, guillemets compris — et `test/donnees.test.js` le garde.

### Le saut de taille, et d'où il vient

+315 273 octets, dont **299 400 pour le seul atlas** : `atlas-terrain-64.png`
pèse 224 548 octets et coûte un tiers de plus une fois inliné en base64. Il
représente **59,4 % du HTML livré**. Le reste — environ 16 000 octets — est le
module de pavage, l'écran, sa feuille de style et son balisage.

C'est le prix de l'offline, qui n'est pas négociable : une image posée à côté
serait une référence externe, et `tools/build.js` sort en erreur dessus.

---

## 2. Fichiers touchés

| Fichier | Nature |
|---|---|
| `art/sprites/carte/atlas-terrain-64.png` | **neuf** — l'atlas livré, 224 548 octets, SHA-256 `3c53f7b7…3ad4ad37` vérifié après copie |
| `art/sprites/carte/controle-pavage.png` | **neuf** — l'image de contrôle du §7 |
| `src/data/sites.js` | `TERRAIN_CARTE` et `EMBLEMES_CARTE` ajoutés après `ZOOM_CARTE` |
| `src/sim/peuplement.js` | `hachageBrut` exporté ; `hachageDeCase` l'appelle, valeurs inchangées |
| `src/render/terrain.js` | **neuf** — le pavage, sans DOM |
| `src/ui/monde.js` | **neuf** — l'écran |
| `src/ui/session.js` | cinquième écran déclaré, allumé, retiré ; onglet Monde câblé |
| `src/index.src.html` | onglet Monde vivant, `#ecran-monde`, sa feuille de style, l'image de l'atlas |
| `tools/build.js` | inline les images par marqueur ; **sort en erreur** si le fichier manque |
| `test/terrain.test.js` | **neuf** — 13 tests |
| `test/monde.test.js` | **neuf** — 18 tests |
| `test/banc.test.js` | borne de T10 relevée, commentaire réécrit |
| `test/chantier.test.js` | les onglets morts passent de deux à un |
| `CLAUDE.md` | §0, §2, §6 |
| `package.json` | version et build |

---

## 3. Le pavage — ce qui a été mesuré

### 3.1 L'atlas est déjà quintilé, la sortie ne l'est pas

Mesuré sur le PNG livré, décodé par `test/terrain.test.js` :

| Indice | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| part de l'atlas | 19,98 % | 20,01 % | 20,00 % | 20,00 % | 20,00 % |

moyenne **2,0003**, écart-type **1,4141** (√2 — la loi uniforme sur cinq
valeurs). Sa palette EST la rampe du joueur de `FICHE-STYLE.md`, dans l'ordre,
ce qu'un test asserte couleur par couleur.

**Mais la sortie de la formule ne suit pas cette loi.** Elle est la somme pondérée
d'environ cinq tuiles, donc à peu près gaussienne. Découper avec les seuils de
l'atlas — 0,5 · 1,5 · 2,5 · 3,5 — donnerait 14 % aux teintes extrêmes et 28 % à
celle du milieu. `TERRAIN_CARTE.seuilsDeTeinte` porte donc les **quintiles de la
sortie**, relevés sur **2 949 120 pixels** (4 crans × 5 graines × 4 endroits) :

```
0,660   1,586   2,444   3,363
```

Les quatre crans s'accordent à **0,05 près** — c'était la question à trancher,
puisqu'un jeu de seuils par cran aurait été un jeu de trop :

| cran | 32 | 64 | 128 | 256 |
|---|---|---|---|---|
| q20 | 0,642 | 0,668 | 0,643 | 0,688 |
| q80 | 3,340 | 3,375 | 3,387 | 3,351 |

Répartition obtenue sur les dalles rendues, 16 dalles de 256 px, quatre crans :
**20,57 / 19,94 / 20,12 / 19,83 / 19,54 %**. Le test exige 20 % ± 2.

### 3.2 La formule contre la composition alpha

Écart-type de luminance (Rec. 709) d'une dalle de 256 px, mesuré aux quatre
crans, sur la même zone et la même graine :

| cran | 32 | 64 | 128 | 256 |
|---|---|---|---|---|
| formule `μ + Σw(t−μ)/√(Σw²)` | **19,55** | **19,77** | **19,56** | **19,96** |
| `Σwt/Σw` (alpha ordinaire) | 14,86 | 15,19 | 15,07 | 15,33 |

La formule rend **+30 %** de relief. Le brief annonçait 14,6 contre 9,7 : les
valeurs absolues diffèrent — la mesure est prise sur l'image FINALE, après
quantification en cinq teintes, et sur cette rampe-ci — mais l'écart relatif est
le même, et c'est lui qui compte.

⚠ **Le chemin alpha existe dans le module, sous l'option `alphaOrdinaire`, et il
n'existe QUE pour ce test.** Sans lui, « ce n'est pas de la composition alpha »
resterait une opinion. C'est un ajout au brief, assumé.

### 3.3 La couverture, et le plancher qui ne mord pas

`rendreDalle` rend `couvertureMin`, le plus petit `Σw` de la dalle. Mesuré sur
4 crans × 3 graines × 3 endroits : **0,165 au plus bas**. Le plancher `Σw ≤ 0`
est donc une **garde morte**, et c'est ce qu'on lui demande.

⚠⚠ **Et c'est cette mesure qui garde, pas « aucun pixel noir ».** Falsifié : à
84 px de pas de réseau, la couverture tombe à **0** — mais la garde rend alors
la teinte moyenne, si bien que l'image n'a **toujours aucun pixel noir** et que
le test des couleurs reste vert. Seule la couverture le dit.

### 3.4 Le camp du sol

Part d'Ouvrage mesurée par rangée, deux graines × quatre dalles de 128 px au
cran 128, soit 131 072 pixels par ligne :

| rangée | 300 | 290 | 275 (départ) | 260 | 250 | 225 | 200 | 175 | 150 | 125 | 100 | 75 | 50 | 26 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| niveau | 1 | 2 | 5 | 8 | 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50 | 50 |
| `p` par tuile | 0,0 % | 2,0 % | 8,2 % | 14,3 % | 18,4 % | 28,6 % | 38,8 % | 49,0 % | 59,2 % | 69,4 % | 79,6 % | 89,8 % | 100 % | 100 % |
| **au pixel** | 0,00 % | 1,65 % | **4,24 %** | 13,73 % | 15,98 % | 24,39 % | 42,04 % | 47,69 % | 61,57 % | 77,46 % | 86,20 % | 91,25 % | **100 %** | **100 %** |

Monotone, ~0 au départ du joueur, exactement 1 dès la rangée 50. La formule
`(niveau − 1) / 49` **est une proposition, pas un arbitrage** — elle vit dans
`data/sites.js` avec ce commentaire.

### 3.5 Les bits du hachage

Le pavage veut par nœud : deux décalages (16 bits chacun), un numéro de tuile
(6), une rotation (2), un miroir (1), un tirage d'appartenance — **49 bits**
pour un hachage qui en fait 32. D'où **deux sels**, et `hachageBrut` exporté de
`sim/peuplement.js` plutôt qu'un second hachage écrit à côté.

Mesuré sur 3 600 nœuds : les 64 tuiles sortent toutes, aucune ne prend plus d'un
seizième du semis, les quatre rotations et les deux miroirs sont à ±5 points de
leur probabilité, et **les décalages vont dans les deux sens à ±5 points**. Le
test porte son appât : un champ pressé dans trois bits de tête met au moins un
seizième du semis sur une seule tuile, et il est refusé de face.

---

## 4. Le temps de rendu

### 4.1 Ici, dans Node (médiane de 7, après chauffe, dalle de 512 × 512)

| cran | 32 | 64 | 128 | 256 |
|---|---|---|---|---|
| ms | 19,1 | 22,8 | 22,0 | 22,8 |

Le coût est **indépendant du cran**, et c'est attendu : le nombre
d'accumulations vaut `512² × (128/56)² = 1,37 million` quel que soit le zoom.

Deux optimisations ont été mesurées, pas supposées :

- **accumulateurs entrelacés** — les quatre valeurs d'un pixel côte à côte
  plutôt que dans quatre tableaux d'un mégaoctet : **21 ms → 14 ms** sur la
  phase d'accumulation seule ;
- **écriture du pixel en un entier de 32 bits** plutôt qu'en quatre octets
  clampés : environ 2 ms de plus sur la passe finale. L'ordre des octets est
  **mesuré au démarrage**, pas supposé.

### 4.2 Dans un navigateur de bureau (Chromium, 360 × 740 CSS, DPR 3)

Le HTML livré a été chargé dans Chromium et l'écran ouvert pour de vrai. Temps
d'image relevés sur 180 images à chaque cran :

| cran | images lourdes (ms) | médiane |
|---|---|---|
| 32 | 33 · 17 · 17 · 17 | 16,7 |
| 64 | 50 · 17 · 17 · 17 | 16,7 |
| 128 | 17 · 17 · 17 · 17 | 16,7 |
| 256 | 50 · 34 · 33 · 17 | 16,7 |

Soit **une à deux images sautées** pendant qu'une ou deux dalles se calculent,
puis 60 images par seconde. C'est ce que borne `DALLES_PAR_IMAGE = 2`.

### 4.3 ⚠ SUR L'APPAREIL : NON MESURÉ

Le brief demande de mesurer le temps d'une dalle **sur l'appareil**. Il n'y a
pas d'appareil ici, et le dépôt tient pour règle qu'un test appareil non exécuté
se **déclare non exécuté**. Ce chiffre manque, et il manque exprès plutôt que
d'être extrapolé.

**Si les 30 ms sont dépassées sur le téléphone, le curseur à tourner est la
taille de dalle** — `TERRAIN_CARTE.dalleCotePx`, 512 → 256 : le travail total
est identique, mais l'à-coup est divisé par quatre. Il faut alors monter
`dallesEnCache` de 30 à environ 64 pour couvrir la même fenêtre. **Le pas du
réseau est le mauvais curseur** : il décide de la couverture, donc du noir (§3.3).

---

## 5. Les tests

**458 pass / 0 fail**, mesuré. `npm test` complet : **8,2 et 8,3 s** sur deux
lancers, contre 8,4 s à l'ouverture du lot — les deux fichiers neufs coûtent
0,60 s à eux deux, mais `node --test` fait tourner les fichiers en parallèle, si
bien que le total ne bouge pas. La suite reste sous la barre des vingt secondes
qui avait coûté une refonte des horizons de boucle en août.

### `test/terrain.test.js` — 13 tests

Il **décode le PNG livré** au lieu de se fabriquer un atlas de complaisance : un
atlas synthétique passerait tout et ne dirait rien du fichier que le joueur voit.
Le décodeur refuse tout ce qu'il ne sait pas faire plutôt que de rendre une image
approchée.

| Test | Montage réel |
|---|---|
| l'atlas livré est bien 64 tuiles indexées | 1024², palette confrontée à la rampe du joueur, histogramme des cinq indices |
| masque : plein au centre, nul aux bords, symétrique | les quatre côtés de tuile, symétrie à 10⁻¹², croissance stricte jusqu'aux deux échantillons du milieu |
| les huit orientations sont des bijections distinctes | tuile 8 × 8, 64 pixels atteints une fois chacun, 8 empreintes distinctes |
| chaque champ du nœud a assez de bits | 3 600 nœuds, distribution des 64 tuiles, 4 rotations, 2 miroirs, signes des décalages, quarts du tirage |
| **une zone rendue seule = la même en quatre dalles** | 256² contre 4 × 128², les 4 crans, comparaison octet par octet — **0 écart** |
| **deux appels au même endroit rendent la même image** | 4 crans, 128², plus une graine différente qui DOIT diverger |
| **aucun pixel hors des deux rampes, aucun noir** | 4 crans × 4 endroits, 128², recherche des 10 codes de rampe |
| **le plancher de couverture ne mord pas** | `couvertureMin` sur 12 dalles, minimum 0,165 |
| **un cinquième de la surface par teinte** | 16 dalles de 256², 4 crans × 4 graines |
| **l'écart-type dépasse 12, et bat l'alpha d'un quart** | 4 crans, formule contre `alphaOrdinaire` sur la même zone |
| **la part d'Ouvrage suit le niveau de la rangée** | 6 rangées × 2 graines × 4 dalles, croissance et bornes |
| la rangée d'un pixel se borne, elle ne lève pas | quatre bornes, dont deux hors carte |
| `creerAtlas` et `rendreDalle` refusent l'impossible | indice hors rampe, taille non divisible, cran inconnu, coin non entier |

### `test/monde.test.js` — 18 tests

| Test | Montage réel |
|---|---|
| **les quatre crans sont des puissances de deux et divisent 128 et 64** | rapport entier dans un sens ou l'autre, plus l'appât du cran 192 |
| **au cran le plus large, les 31 colonnes tiennent dans 360 px CSS** | 31 × 32 / 3 = **330,7 px**, et le cran d'après ne tient pas |
| la carte se mesure aux crans, et ce qui tient entier se centre | quatre crans, bornes aux deux bouts, centrage négatif |
| la fenêtre visible couvre ce qu'on voit plus une case | vue alignée puis décalée d'une case et demie |
| distance de Tchebychev | trois cas, dont un que Manhattan rendrait faux |
| **une base de l'Ouvrage est dessinée là où `estBaseOuvrage` la met** | fenêtre de 50 × 31 cases, plus de 20 bases, égalité d'ensemble avec un balayage indépendant |
| **les satellites présents sont dessinés, les attentes non** | base neuve (3 attentes, 0 présent), puis 2 présents posés à la main |
| le joueur et la base terminale se dessinent en dernier | ordre de la liste, niveau `null` pour le joueur, pas de dédoublonnage |
| **le panneau dit ce qu'on sait, et pas le niveau de la rangée du joueur** | lignes du panneau, singulier de « 1 case », type inconnu qui lève |
| **le panneau ne porte aucun bouton d'action** | découpage du bloc dans le HTML **produit**, plus balayage des mots dans l'écran |
| **l'écran ne nomme aucune constante de grille ni de zoom en dur** | 12 valeurs interdites, motif borné, appât dans les deux sens, et les 4 tables doivent être importées |
| le cache évince la moins récemment employée | capacité 3, relecture qui remet en queue, réécriture qui ne duplique pas |
| une dalle qui manque se peint de la teinte moyenne de son camp | les deux bouts de la carte, milieu des rampes |
| l'appariement d'une couleur est exact, et retombe sur la plus proche | les 5 tons, plus un décalé de deux niveaux par canal |
| **le bord rouge est réservé à ce qui attaque le joueur** | croisement `EMBLEMES_CARTE` × `TYPES_SITE.attaqueLeJoueur`, égalité d'ensemble |
| l'onglet Monde est vivant, l'écran existe, l'atlas est inliné | 13 identifiants, `data:image/png;base64,`, longueur > 200 000 |
| **l'écran n'ajoute aucune barre à hauteur fixe** | aucun `flex: 0 0 Npx` en `#monde-*`, les deux blocs en `absolute`, `touch-action: none` |
| l'écran est déclaré, allumé, et retiré quand on le quitte | `ECRANS`, `ONGLET_DE_L_ECRAN`, branche `else` nue |

---

## 6. La falsification

Chaque défaut a été injecté dans une **copie fraîche** du dépôt, la suite
relancée, puis le défaut retiré. Résultats **mesurés**, pas prédits.

| # | Défaut injecté | Où | Résultat |
|---|---|---|---|
| F1 | le semis est semé par le coin de la dalle (`graine + x0`) | `render/terrain.js` | **ROUGE** — « 1 dalle vs 4 » |
| F2 | les tampons d'accumulation ne sont plus remis à zéro | `render/terrain.js` | **ROUGE** — 4 tests |
| F3 | composition alpha (`/ Σw`) au lieu de `/ √(Σw²)` | `render/terrain.js` | **ROUGE** — contraste + teintes |
| F4 | décalage X lu dans les trois bits de tête (`h >>> 29`) | `render/terrain.js` | **ROUGE** — hachage |
| F5 | seuils naïfs de l'atlas (0,5 · 1,5 · 2,5 · 3,5) | `data/sites.js` | **ROUGE** — teintes |
| F6 | pas du réseau élargi à 84 px | `data/sites.js` | **ROUGE** — couverture, contraste, camp |
| F7 | part d'Ouvrage inversée (`1 − p`) | `render/terrain.js` | **ROUGE** — camp du sol |
| F8 | les bases de l'Ouvrage dédoublonnées contre la terminale | `ui/monde.js` | **ROUGE** — 3 tests |
| F9 | les attentes dessinées comme des sites | `ui/monde.js` | **ROUGE** — satellites |
| F10 | un bouton « Attaquer » ajouté au panneau | `index.src.html` | **ROUGE** — panneau |
| F11 | le cran 32 écrit en dur dans l'écran | `ui/monde.js` | **ROUGE** — constantes |
| F12 | ce qui tient entier se colle à gauche au lieu de se centrer | `ui/monde.js` | **ROUGE** — vue |
| F13 | l'atlas retiré du dépôt | (fichier) | **BUILD EN ÉCHEC**, message nommant le fichier |
| F14 | masque échantillonné au bord du pixel, donc asymétrique | `render/terrain.js` | **ROUGE** — masque |
| F15a | `ecranMonde.masquer()` enfermé dans un `if (false)` | `ui/session.js` | ⚠ **VERT** — voir ci-dessous |
| F15b | la ligne `masquer()` retirée | `ui/session.js` | **ROUGE** — session |
| F16 | l'image de l'atlas retirée du balisage | `index.src.html` | **ROUGE** — page |

### ⚠ Ce que la falsification a corrigé, et qui aurait été livré sans elle

**F15a est passée au VERT.** Le test cherchait `ecranMonde.masquer()` *n'importe
où* dans `ui/session.js` : un appel enfermé dans un `if (false)` le satisfaisait.
Un appel qu'on ne peut pas atteindre n'est pas un appel. Le test exige maintenant
la **branche `else` nue**, et F15a comme F15b sont rouges.

**Et F2 a révélé un test lent avant de révéler le défaut.** La comparaison de
deux dalles passait par `deepEqual` sur 65 536 pixels : la mise en forme de
l'écart par le rapporteur mettait **105 secondes** à dire « rouge ». Un test
qu'on n'attend pas cesse d'être relancé. Il compare maintenant à la main et
nomme le premier octet qui diverge.

**Enfin, F6 a montré que « aucun pixel noir » ne garde rien tout seul** (§3.3) :
c'est la couverture minimale qui mesure le trou.

---

## 7. La vérification visuelle, et l'essai en navigateur

### 7.1 L'image de contrôle

`art/sprites/carte/controle-pavage.png` — quatre panneaux de 320 px, **deux
crans × deux latitudes**, graine 20260829 :

| | rangée 275 (départ, niveau 5) | rangée 120 (niveau 36) |
|---|---|---|
| **cran 32** | haut gauche | haut droit |
| **cran 128** | bas gauche | bas droit |

Ce qu'elle montre, et qu'aucun nombre ne dit : **aucune grille**, aucun motif qui
se répète, aucune couture entre dalles, et la bascule d'un camp de sol à l'autre
en taches organiques plutôt qu'en damier. Le brief le demandait explicitement —
« le bug des bits épuisés a été vu à l'œil en une seconde et aucun test ne
l'aurait attrapé ».

### 7.2 L'essai en navigateur — **fait, et ce n'est pas l'appareil**

Le `dist/index.html` livré a été chargé dans Chromium (viewport 360 × 740 CSS,
`devicePixelRatio` 3, mode tactile), et l'écran ouvert pour de vrai. Ce n'est
**pas** une vérification appareil — c'est un navigateur de bureau — mais c'est
plus qu'une relecture, et voici ce qui a été observé :

| Ce qui a été essayé | Résultat |
|---|---|
| ouverture de l'onglet Monde | canevas 1080 × 1752 physiques, 360 × 584 CSS, **11 px / case** |
| couleurs du canevas | **0 pixel noir** sur 1 892 160 ; les 5 teintes du joueur à 18,3 · 18,3 · 18,3 · 18,0 · 17,9 % |
| les quatre crans | 11 → 21 → 43 → 85 px CSS par case, libellé à jour |
| défilement au doigt | la vue suit, et **ne bouge plus une fois au bord** — le clamp mord |
| toucher de la base du joueur | panneau : « Votre base / — trois moyennes, sur l'écran Base / 0 cases / rangée 275, colonne 16 » |
| toucher d'une base de l'Ouvrage | « Base de l'Ouvrage / Niveau 11 / 29 cases / rangée 246, colonne 4 » — et 11 est bien `niveauDeLaRangee(246)` |
| toucher du sol nu | le panneau se referme |
| **glissement** sur le canevas | le panneau **ne s'ouvre pas** : la tolérance de 3 px CSS distingue le doigt qui traîne du doigt qui pointe |
| retour aux écrans Base, Mission, Options | tous se réaffichent |
| erreurs de page | **aucune**, ni exception ni erreur de console |

⚠ **Ce qui reste non vérifié parce qu'il n'y a pas d'appareil** : le temps de
rendu réel, le comportement des marges système, et le rendu sous une WebView
Android.

### 7.3 `tools/audit-maquette.mjs` — DÉJÀ ROUGE AVANT CE LOT, et il le reste

L'audit hors suite de la maquette rend **6 écarts**, et il les rendait déjà au
commit d'ouverture du lot : mesuré sur une extraction propre de `HEAD`, mêmes
six lignes — terrain de la maquette, disposition, trois débits, raffinerie.
C'est `foyer-zero-ui.html` qui n'a pas suivi le lot `TERRAIN_INITIAL` du 29/08.
**Ce lot-ci ne touche pas la maquette** et n'a ni aggravé ni réparé ces écarts ;
ils sont signalés pour que personne ne les impute à la carte.

---

## 8. Écarts par rapport au brief, et pourquoi

1. **Les seuils de teinte sont GLOBAUX, pas calculés « sur la dalle ».**
   Le brief demande les deux : « par quantiles de luminance sur la dalle » (§2.3)
   et « une dalle rendue seule est identique à la même zone rendue en quatre »
   (§6). Les deux ne tiennent pas ensemble — des quantiles par dalle feraient
   deux découpages différents de part et d'autre d'un bord, donc une couture
   nette. Retenu : les quintiles de la sortie, mesurés une fois et écrits dans
   `data/`. La répartition visée — un cinquième par teinte — est **tenue et
   mesurée** (§3.1), et les quatre crans s'accordent, ce qui est ce qui rendait
   le choix possible.

2. **Le temps d'une dalle sur l'appareil n'est pas mesuré** (§4.3). Il n'y a pas
   d'appareil ici. Le curseur à tourner et son effet chiffré sont dits.

3. **L'atlas entre par un marqueur remplacé au build, pas par un `import`
   esbuild.** Un `import` de PNG dans `src/ui/` rendrait le module de la carte
   inimportable par `node --test`, donc intestable ici — alors que tout ce qui
   n'est pas le DOM l'est. Le build refuse de produire un HTML si le fichier
   manque (F13).

4. **`rendreDalle` rend `couvertureMin` en plus des pixels.** Ajout au brief,
   pour que le plancher soit MESURABLE plutôt qu'indiscernable d'une branche
   morte. C'est ce qui attrape F6.

5. **`rendreDalle` accepte l'option `alphaOrdinaire`.** Ajout au brief, pour que
   le test MESURE le chemin qu'on refuse au lieu de le croire sur parole (§3.2).

6. **Le zoom se change par deux boutons posés sur la carte**, pas au pincement.
   Le brief demande « quatre crans » sans dire par quel geste. Le pincement n'est
   pas testable ici et n'a pas été arbitré ; deux boutons ne promettent rien
   qu'ils ne fassent. À reprendre si Ethan veut le pincement.

7. **Le test dit « la part d'Ouvrage croît avec le NIVEAU de la rangée »**, pas
   « avec la rangée ». La rangée 1 est le bord HAUT — le bout de la carte — donc
   la part croît quand le NUMÉRO descend. Écrire l'inverse ferait passer le test
   dans le bon sens pour la mauvaise raison, et le prochain lecteur inverserait
   la convention en croyant réparer.

8. **Le pavage déborde des bords de la carte.** Au cran le plus large, la carte
   ne remplit pas la largeur : le fond continue au-delà plutôt que de s'arrêter
   net. Aucun site n'y est dessiné. C'était le choix le plus simple ; un bord
   franc se déciderait avec Ethan.

---

## 9. Ce qui reste ouvert

- **Le temps de rendu sur l'appareil**, et le réglage qui en découle (§4.3).
- **Le pincement pour zoomer** — non arbitré, non fait.
- **La formule de la part d'Ouvrage** — `(niveau − 1) / 49`, proposition
  explicite, une ligne à changer dans `data/sites.js`.
- **Les emblèmes sont des gabarits.** Les treize emblèmes du lot 6 sont
  spécifiés par `INVENTAIRE-SPRITES.md` ; aucun fichier n'est produit. Carré
  arrondi, bord, lettre au-delà de 40 px CSS.
- **Trente dalles en cache font environ 31 Mo de canevas.** Ça n'a pas été
  mesuré sur un appareil à mémoire contrainte. Si ça pose problème, c'est
  `dallesEnCache` qui baisse, et la fenêtre se refait plus souvent.
- **Aucun bouton « revenir à ma base ».** La vue se centre sur la base du joueur
  à la **première** ouverture seulement — recentrer à chaque retour ferait perdre
  l'endroit qu'on regardait. Un bouton de recentrage serait la suite naturelle.
- **Il reste UN onglet mort : Recherche.** Monde s'est ouvert à ce lot, Mission
  au lot TUTORIEL.
- **Le raid n'existe toujours pas**, et le panneau ne le promet pas.

---

## 10. Livraison

Suite **verte, mesurée** : 458 pass / 0 fail. Build **vert** : 503 724 octets,
0 référence externe.

Le lot **ne se découpe pas** : le HTML, l'écran, le module de pavage, l'atlas et
les deux fichiers de tests forment un tout — la borne de T10 relevée sans l'atlas
ne garde plus rien, et l'atlas sans le build qui l'inline fait tomber le build.
Commité d'un bloc.

PR ouverte, **non fusionnée** : le merge sur `main` appartient à Ethan seul.
