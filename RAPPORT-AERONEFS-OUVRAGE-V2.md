# RAPPORT — aéronefs de l'Ouvrage, v2

Quatre jets reçus, quatre sources livrées. Aucun pixel redessiné, aucun
rééchantillonnage : la seule opération est le passage du fond du magenta au
vert, plus le nettoyage des deux fentes du Frappeur.

---

## 1. Attribution

Elle se mesure, elle ne se devine pas : la couleur d'accent donne la cible, la
surface donne le coût.

| Jet | Clé | Nom Ouvrage | Spécialité | Pts | Ce qui l'attribue |
|---|---|---|---|---|---|
| `72945` | `crecelle` | Crécelle | antiInfanterie | 10 | aucun accent rouge ni jaune — accent blanc, seule cible qui le porte |
| `72946` | `busard` | Busard | antiVehicule | 10 | 5,0 % de rouge `#E43E32` |
| `72977` | `frappeur` | Frappeur | antiStructure | 10 | 8,1 % de jaune, la plus petite boîte (668 × 777) |
| `72978` | `enclume` | Enclume | antiStructure | 15 | 10,6 % de jaune, la plus grosse boîte (971 × 955), 392 725 px opaques contre 251 738 au Frappeur |

Les deux appareils jaunes se départagent par la taille, et elle va dans le bon
sens : l'Enclume vaut 15 points, le Frappeur 10.

---

## 2. Le fond arrive en magenta, et ça ne pouvait pas passer

La règle du lot PIXELS veut du vert `#00FF00` pour l'Ouvrage, parce que
l'ardoise violacée frôle le magenta — `tools/cond.py` le dit à la ligne 30,
distance minimale mesurée 140,0, pile sur le seuil. Les quatre jets sont
arrivés sur magenta. Ce n'est pas resté théorique. Mesure avant conversion, en
pixels de fond **enfermés dans le sujet** :

| Source | Pixels percés |
|---|---|
| `off_o_crecelle` | 0 |
| `off_o_busard` | 0 |
| `off_o_frappeur` | **3 091** |
| `off_o_enclume` | 51 |

Les deux appareils clairs passaient ; les deux violets, non.

**Conversion.** `tools/fond-vert-aeronefs-ouvrage.py`, relançable. Le fond
magenta devient `#00FF00`, tout le reste est copié bit pour bit. Contrôle après
conversion, sur le fichier écrit :

| Source | Fond | Sujet | Clé relue par `cle_de_fond` | Magenta restant |
|---|---|---|---|---|
| `off_o_crecelle` | 824 428 | 224 148 | vert | 0 |
| `off_o_busard` | 797 475 | 251 101 | vert | 0 |
| `off_o_frappeur` | 797 140 | 251 436 | vert | 0 |
| `off_o_enclume` | 656 258 | 392 318 | vert | 2 |

« Magenta restant » compte les pixels du sujet à moins de 140 de `#FF00FF`,
c'est-à-dire ceux que la clé magenta aurait encore pu prendre. Deux pixels sur
392 318 à l'Enclume, isolés.

---

## 3. Les deux fentes du Frappeur — le piège de la journée

Le premier passage bornait le fond à la composante qui touche le bord, ce qui
est la bonne règle pour ne pas percer le corps. Elle laissait **deux régions de magenta franc
enfermées, 1 550 et 1 577 px** entre le fuselage et les nacelles : des
fentes voulues, du décor qui laisse voir le sol au travers. Bornées au bord,
elles ne devenaient pas du fond — elles restaient roses, et **à 40 px ça faisait
deux pastilles fluo au milieu de l'appareil.**

Vu seulement sur la planche de contrôle. Aucun compteur ne l'attrapait : le
sujet était intact, la clé était bonne, le liseré était propre.

La règle corrigée, dans le script : le magenta **franc** (distance < 90) est du
fond où qu'il soit ; la porte large `c2`, celle qui confond l'ardoise et le
magenta, reste bornée au bord. Les fentes sont désormais transparentes, et le
sol se voit au travers comme le dessin le demande.

---

## 4. Deux appareils sur quatre ne portent pas la rampe de l'Ouvrage

Le Frappeur et l'Enclume sont sur l'ardoise. La Crécelle et le Busard sont des
machines **blanches**. Mesure de la signature violette, part des pixels où
`B > R > V` :

| Sujet | Signature violette | Médiane RGB |
|---|---|---|
| `off_o_crecelle` | **0,2 %** | 144 · 140 · 146 |
| `off_o_busard` | **0,4 %** | 161 · 143 · 153 |
| `off_o_frappeur` | 60,2 % | 110 · 97 · 94 |
| `off_o_enclume` | 54,9 % | 125 · 108 · 102 |
| *témoins v1 au dépôt* | 33 à 44 % | 63 à 80 en rouge |

Ce n'est pas une nuance de goût : `FICHE-STYLE.md` §3 dit que l'opposition doit
se lire à la teinte **et** à la silhouette, et la ligne du bas de la planche de
contrôle pose les quatre appareils sur le sol du joueur — la Crécelle et le
Busard y sont exactement aussi chez eux que sur le sol de l'Ouvrage.

Deux effets secondaires, tous deux mesurés sur la planche :

- **La Crécelle n'a plus d'accent.** Son accent est le blanc ; son corps est
  blanc. La seule unité dont l'accent ne peut pas trancher est justement celle
  qui devait le porter en grand.
- **Crécelle et Busard partagent la silhouette** — même trident à trois
  modules, même empreinte. Avec un corps de même teinte, ce qui les distingue à
  40 px se réduit au filet rouge du Busard.

Deux appareils à refaire, ou un arbitrage explicite pour dire que l'Ouvrage a
des machines claires. Le reste du lot n'attend pas cette réponse.

---

## 5. Ce qui n'est pas fait, et pourquoi

**L'emprise n'est pas appliquée.** Même situation que côté joueur : les quatre
sources gardent leur boîte d'origine dans un cadre de 1024. À la taille du jeu
elles sortent à 40 × 36, 40 × 30, 34 × 40 et 40 × 39 — la mise à l'échelle se
fait sur la plus grande dimension, ce qui reste l'arbitrage ouvert du §2 de
`RAPPORT-AERONEFS-JOUEUR-V2.md`. Le trancher pour un camp le tranche pour
l'autre.

**Le nombre de modules de l'Enclume.** Elle en montre quatre autour du moyeu ;
le bloc « Dard » de `FICHE-STYLE.md` en demande cinq à 15 points. C'est la même
règle qu'A6, écrite ailleurs : si le nombre de pièces dit la nature et non le
prix, les deux textes doivent tomber ensemble. Rien à corriger sur le dessin
tant que ce n'est pas tranché.

**Rien n'est câblé.** Ces quatre PNG sont des sources. Il reste, dans l'ordre :
`python3 tools/entrees.py --declarer`, la découpe vers `final128`, puis
`tools/atlas.py`. C'est du code, et c'est le même lot que celui qui attend côté
joueur.

---

## 6. Contenu de l'archive

```
art/sources/off_o_crecelle.png          1024 × 1024, fond vert
art/sources/off_o_busard.png
art/sources/off_o_frappeur.png
art/sources/off_o_enclume.png
art/essai/PLANCHE-aeronefs-ouvrage-40.png   les quatre à 40 px, sol Ouvrage puis sol joueur
tools/fond-vert-aeronefs-ouvrage.py     conversion + contrôle, relançable
tools/planche-controle-aeronefs-ouvrage.py
```

Les deux scripts importent `tools/cond.py` du dépôt ; ils n'en embarquent pas de
copie. Les quatre originaux sur fond magenta ne sont pas dans l'archive : la
conversion se rejoue sur eux, garde-les hors dépôt comme pour les lots joueur.
