# RAPPORT — lot 5, pose des tourelles sur leurs socles

**29/08/2026.** 600 fichiers régénérés dans `art/sprites/defense/{128,64,32}`.
La tourelle n'est plus centrée sur la tuile mais **posée sur le logement de son
socle, à 45 % de remplissage**. Aucun fichier de `src/` ni `test/` touché.

---

## 1. Pourquoi l'Ouvrage ne passe pas : c'est la finesse du trait

La question était : couleurs, taille ou forme ? **C'est la forme, et
précisément l'épaisseur de la matière.** Mesuré sur les seize orientations de
chacune des douze tourelles, par transformée de distance :

| | Épaisseur médiane | Matière > 1 gros pixel | Étendue de luminance | Pixels source |
|---|---:|---:|---:|---:|
| Six tourelles **joueur** | **11,8 à 13,8 px** | **50 à 55 %** | 429 à 582 | 10 817 à 11 635 |
| Six tourelles **Ouvrage** | **3,0 à 4,0 px** | **1 à 6 %** | 420 à 525 | 9 077 à 9 946 |

Sur une planche de 1024, **un gros pixel de la grille 32 vaut 12 à 13 pixels
source**. Les tourelles de l'Ouvrage sont donc dessinées avec une matière
médiane de 3 pixels, soit le quart d'un gros pixel : **98 à 99 % de leur
matière est plus fine que le plus petit trait que la grille sait représenter.**
Côté joueur, plus de la moitié de la matière est plus épaisse qu'un gros pixel.

Les deux autres hypothèses tombent :

- **Ce ne sont pas les couleurs.** L'étendue de luminance entre le décile 10 et
  le décile 90 est de 420 à 525 côté Ouvrage contre 429 à 582 côté joueur. Le
  contraste interne est du même ordre.
- **Ce n'est pas la taille.** 9 000 à 9 900 pixels de matière contre 10 800 à
  11 600, soit 15 % de moins. L'encombrement est comparable.

C'est du **filigrane** : même emprise, même contraste, mais fait de fils de
3 pixels au lieu de masses de 13. Une grille de 32 gros pixels ne peut pas le
représenter, à aucune échelle.

**Consigne pour le redessin :** viser une épaisseur médiane d'au moins un gros
pixel, soit **13 px sur une planche de 1024**, et au moins la moitié de la
matière au-dessus de ce seuil.

## 2. Le remplissage à 45 %, côté joueur

Arbitré par Ethan sur planche d'échelles. La base de la tourelle — le plus grand
disque inscrit — occupe 45 % de la largeur de la tuile. Remplissage effectif
mesuré : **40,6 %**, l'écart venant de ce que la toile est calée sur la base
moyenne des seize orientations et non sur chacune.

**Le logement n'est pas au centre de la tuile, et son décalage dépend de la
famille de socle, pas du camp.** Mesuré sur les douze socles, écart horizontal
partout sous 0,7 px donc ignoré :

| Famille | Décalage vertical, grille 128 |
|---|---|
| Socles de tourelle joueur | −7,7 / −6,1 / −7,1 → **−7,0** |
| Socles d'artillerie joueur | +8,5 / +8,8 / +8,7 → **+8,7** |
| Socles de tourelle Ouvrage | +2,7 / +3,1 / +2,5 → **+2,8** |
| Socles d'artillerie Ouvrage | +14,5 / +14,0 / +13,9 → **+14,1** |

Les tourelles se posent au-dessus du centre, les artilleries en dessous.
Composition vérifiée à l'œil sur les six défenses du joueur : la tourelle tombe
dans son logement, l'orientation est juste, les proportions tiennent.

## 3. Trois règles d'échelle essayées et réfutées pour l'Ouvrage

La règle des 45 % s'appuie sur le disque inscrit. Elle ne vaut que si la matière
est plus épaisse que le disque cherché — vrai côté joueur, faux côté Ouvrage où
le disque inscrit ne mesure pas la base mais **l'épaisseur du trait**.

| Règle | Étendue obtenue | Résultat |
|---|---|---|
| Disque inscrit à 45 % | **98,3 %** de la tuile | **119 sprites sur 192 débordent** |
| Étendue radiale moyenne, calée sur 63 % | 35,1 % | occupation 1,52 %, **des sprites vides** |
| Demi-étendue carrée maximale | 26,1 % | occupation 0,76 %, **des sprites vides** |

Aucune ne tient, et pour la même raison qu'au §1 : une forme sans corps n'a pas
d'échelle mesurable. **Le cadrage du lot 1 est conservé pour l'Ouvrage** — toile
commune sur la portée maximale — en attendant le redessin. Occupation en 32 :
2,21 % de moyenne, 0,10 % au minimum. Ces 288 fichiers existent pour ne pas
laisser de trous, ils ne sont pas utilisables.

## 4. Contrôles passés

| Contrôle | Résultat |
|---|---|
| Fichiers écrits | **600** |
| Couleurs hors palette | **0** |
| Sprites vides | **0** |
| Occupation en 32, joueur | 17,33 % de moyenne, 13,48 % au minimum |
| Remplissage effectif, joueur | 40,6 % pour 45 % visés |
| Composition socle + tourelle | ✔ regardée sur les six défenses du joueur |

⚠ **23 sprites sur 192 touchent un bord de tuile.** Ce sont les canons longs des
artilleries en orientation est ou ouest. À confirmer : un canon qui dépasse de sa
case est-il voulu, ou faut-il réduire encore ?

## 5. Reste ouvert

1. **Les six tourelles de l'Ouvrage à redessiner** (§1), consigne chiffrée.
2. **Les 23 débordements** (§4).
3. **Les merlons du joueur** — l'ordre des quatre cellules ne se lit toujours pas.
4. **Les socles `isolé` du lot 4 contre ceux du lot 3** — redondants à 0,98 d'IoU
   côté joueur, différents à 0,70 côté Ouvrage.
