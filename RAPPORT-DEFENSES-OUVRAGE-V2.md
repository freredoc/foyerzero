# RAPPORT — défenses de l'Ouvrage, v2

Quatorze jets reçus, quinze pièces livrées : le socle à liseré jaune est
fabriqué par substitution de ton, pas dessiné. **Le compte tombe juste** — 6
socles, 6 tourelles, 3 monolithiques, exactement la structure du lot joueur.

---

## 1. Attribution

| Jet | Nom livré | Ce qui l'attribue |
|---|---|---|
| `67054` | `socle_def_o_casemate` | socle carré, bande blanche |
| `67056` | `socle_def_o_creneau` | socle carré, bande rouge |
| *fabriqué* | `socle_def_o_batterie` | socle carré, bande jaune — §3 |
| `66955` | `socle_def_o_faucheuse` | coque à pattes, liseré blanc |
| `66967` | `socle_def_o_mortier` | coque à pattes, liseré rouge |
| `66962` | `socle_def_o_harpon` | coque à pattes, liseré jaune |
| `66959` | `def_o_casemate` | double tube fin, court (185 px), blanc |
| `66970` | `def_o_faucheuse` | double tube fin, **rallongé** (386 px), blanc |
| `66971` | `def_o_creneau` | tube simple, calibre 101 px, rouge |
| `66960` | `def_o_mortier` | tube simple, calibre 179 px, rouge |
| `66963` | `def_o_batterie` | tubes fins levés, jaune |
| `66964` | `def_o_harpon` | quatre missiles, jaune |
| `67057` | `def_o_merlon` | caisse pleine, **aucun logement de tourelle** |
| `66956` | `def_o_ronce` | barbelés, bande blanche |
| `66975` | `def_o_herse` | chevaux de frise, bande rouge |

**Les trois artilleries sont bien montées sur une coque à pattes**, pas sur le
socle carré. C'est la coupure de `combat.js` — Faucheuse, Mortier et Harpon sont
déclarés véhicules — et elle est passée telle quelle côté Ouvrage.

**Le Merlon se reconnaît à ce qu'il n'a pas.** Les cinq autres pièces carrées
portent un logement rond ; lui non, et c'est ce qui en fait un mur et pas un
socle. Vérifié en cherchant la composante sombre : les six socles en ont une,
centrée et circulaire ; celle du Merlon est une ombre de flanc, en bas et deux
fois plus haute que large.

---

## 2. Une attribution à confirmer : Créneau ou Mortier

La règle de la fiche §5 — l'artillerie porte **le même tube rallongé de
moitié** — sépare la paire blanche sans discussion et **ne sépare pas la paire
rouge** :

| Paire | Tube court | Tube long | Rapport |
|---|---|---|---|
| blanche | Casemate 185 px | Faucheuse 386 px | **×2,09** |
| rouge | 328 px | 342 px | ×1,04 |

Ce qui sépare les deux rouges est le **calibre** : 101 px contre 179 px, mesuré
à cinq hauteurs. J'ai donné le gros au Mortier — une artillerie de 30 points
contre une tourelle de 10 — et sa hauteur totale va dans le même sens
(945 contre 914). C'est un jugement, pas une mesure qui tranche : **les deux
s'inversent par un renommage**, comme la Foudre et l'Albatros.

---

## 3. Le socle jaune, fabriqué et non dessiné

`tools/socle-jaune-ouvrage.py`, relançable. Un quatrième jet aurait redessiné la
caisse, et trois tourelles voisines n'auraient plus eu la même assise. La
substitution garantit l'inverse.

Le liseré rouge est repéré **par sa teinte**, pas par une distance à `#E43E32` :
le dessin porte plusieurs tons plus les pixels de bord mélangés à l'ardoise, et
une distance les aurait coupés en deux. Chaque pixel retenu est projeté sur la
rampe rouge de la fiche (`#8A1E17` → `#E43E32`) et sa position reportée sur la
rampe jaune (`#A67018` → `#F5B636`) : l'ombre reste l'ombre.

**64 061 px substitués, 0 pixel modifié hors liseré, 0 rouge restant.**

⚠ Le piège, et il a mordu au premier passage : « le rouge domine le canal R »
est vrai **du jaune aussi**. Le contrôle « rouge restant » relisait donc la
sortie jaune comme du rouge et se taisait. Le discriminant juste est l'écart
vert−bleu rapporté à la chroma — 0,07 sur `#E43E32`, 0,67 sur `#F5B636`.

---

## 4. Passage au fond vert

Même raison qu'au lot aéronefs : sur fond magenta, la porte large de
`est_fond_sujet` prend l'ardoise pour du fond. Les quinze sont passées au
`#00FF00`, **quinze clés relues vertes, zéro magenta restant** dans les quinze
sujets.

`tools/fond-vert-ouvrage.py` **remplace** `tools/fond-vert-aeronefs-ouvrage.py`
livré au lot aéronefs, qui n'est pas mergé : même noyau, une table par lot.
Supprimer l'ancien.

---

## 5. Les logements, mesurés

Ils seront l'entrée du montage socle + tourelle. Coordonnées dans l'image
source, avant tout recadrage.

| Famille | Centre | Diamètre | Cadre |
|---|---|---|---|
| socle carré Créneau et Batterie | (625, 390) | 300 × 194 | 1254 |
| socle carré Casemate | (627, 390) | 277 × 190 | 1254 |
| coques à pattes, les trois | (510, 206) ± 1 | 201 de large | 1024 |

La hauteur du logement des coques ne se mesure pas de façon stable (134 à
158 px) : son intérieur sombre se raccorde à l'ombre du flanc. La largeur, elle,
est identique aux trois.

**Les trois coques sont le même dessin, mais trois jets différents.** Leurs
silhouettes ne diffèrent que de 1 400 à 1 541 px sur 400 000, soit 0,35 % ; en
revanche 38 % des pixels diffèrent, ce qui est du bruit de compression et non du
dessin. **Les socles carrés, eux, ne sont pas le même dessin** : le logement de
la Casemate est 8 % plus étroit que celui du Créneau. Rien de grave tant que
l'ancre se mesure par pièce et ne se recopie pas d'une sœur.

⚠ Deux cadres cohabitent : 1254 pour les trois pièces carrées, 1024 pour les
douze autres. C'est sans effet tant que la mise à l'échelle passe par l'emprise
et non par un facteur fixe.

---

## 6. Trois choses vues à 40 px

**Le bloc rose du Merlon.** 9 428 px de `#D091CC`, un rectangle de 152 × 87 au
centre de la caisse. Cette teinte n'est **dans aucune des deux rampes ni dans
aucun accent** : c'est le seul pixel hors palette des quinze pièces. Et le mur
est la seule défense dont la cible vaut `null` — il ne doit donc porter aucun
accent. À rabattre sur l'ardoise, ou à assumer.

**Le liseré blanc est le plus faible des trois, et ce n'est pas une question de
surface.** Mesuré : blanc 9,6 % à 11,1 % du sujet, rouge et jaune 7,9 % à
10,2 %. Il y en a donc autant. Ce qui manque est le **contraste** : le blanc de
l'accent et le ton lumière de l'ardoise (`#6B5B80`) occupent la même place dans
l'image, là où le rouge et le jaune tranchent. Si ça gêne, le remède est
d'assombrir le corps sous le liseré, pas d'élargir le liseré.

**La Batterie porte deux tubes.** La fiche §5 demande un tube **simple**, fin,
incliné, pour l'anti-aérien. Le Harpon, lui, a ses quatre missiles. À arbitrer
avec le reste du bloc « nombre de pièces » — c'est la même question qu'A6.

---

## 7. Ce qui n'est pas fait

**Le montage socle + tourelle n'est pas produit.** Il demande les ancres et les
trois échelles de `tools/ancres-defense.py` (1,6 contact · 2,4 artillerie),
qui appartient au lot joueur non mergé. La planche pose donc les quinze pièces
séparément, la tourelle au-dessus de son socle.

**Rien n'est câblé.** Quinze sources, pas quinze sprites. Il reste
`tools/entrees.py --declarer`, la découpe, puis `tools/atlas.py` — le même lot
de code que celui qui attend côté joueur.

---

## 8. Contenu de l'archive

```
art/sources/socle_def_o_{casemate,creneau,batterie,faucheuse,mortier,harpon}.png
art/sources/def_o_{casemate,creneau,batterie,faucheuse,mortier,harpon}.png
art/sources/def_o_{merlon,ronce,herse}.png
art/essai/PLANCHE-defenses-ouvrage-40.png
tools/fond-vert-ouvrage.py                  remplace fond-vert-aeronefs-ouvrage.py
tools/socle-jaune-ouvrage.py
tools/planche-controle-defenses-ouvrage.py
```

Les scripts importent `tools/cond.py` du dépôt. Les jets d'origine sur fond
magenta ne sont pas dans l'archive ; `socle-jaune-ouvrage.py` s'applique à
`67056`, à garder hors dépôt comme pour les lots précédents.
