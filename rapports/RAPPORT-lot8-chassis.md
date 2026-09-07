# RAPPORT — lot 8, les coques du joueur et leurs ancres

**30/08/2026.** 30 fichiers dans `art/sprites/chassis/{128,64,32}` — 5 blindés ×
2 poses — plus `art/sprites/ancres-chassis.json`. Le dépôt passe à **1 325
sprites**. Aucun fichier de `src/` ni `test/` touché.

---

## 1. Pourquoi ce lot existe

`art/sprites/tourelle-unite/` porte 80 tourelles détachées par grille, qui
tournent. Il n'existait **aucune coque sur quoi les poser** : `unite/` ne porte
que des unités entières, tourelle cuite dans le corps, donc incapables de viser.
Sans ces coques, les 80 tourelles ne servaient à rien.

## 2. Les deux poses sont deux orientations de coque

Ce ne sont pas « de face » et « de profil » au sens de l'infanterie. Les deux
cellules montrent la même caisse une fois **chenilles verticales** — l'engin
roule vers le nord ou le sud — et une fois **chenilles horizontales**. Ça
recoupe l'arbitrage du 29/08 : un véhicule se déplace latéralement en défense.
D'où les noms de sortie, sans suffixe pour l'attaque et `_def` pour la défense,
comme les unités de l'Ouvrage.

## 3. ⚠ La tourelle n'est PAS cuite dans la coque, et c'est un choix

Rendre la tourelle une fois par pose aurait coûté **5 × 16 × 2 = 160 sprites au
lieu de 80**, parce que l'anneau ne tombe pas au même endroit selon la pose : 8
à 10 % de la largeur de coque d'écart, soit deux gros pixels à la grille 32,
largement visible.

La tourelle reste donc centrée sur son propre pivot, et **la coque publie
l'ancre où la poser**. Dix nombres dans un JSON au lieu de deux cent quarante
fichiers.

Format d'une entrée d'`ancres-chassis.json` :

```json
"off_j_ratisseur_chassis": {
  "diametre_pct": 29.7, "x_pct": -0.3, "y_pct": -13.3, "mesure": true
}
```

Tout est en **pourcentage de la coque**, donc valable aux trois grilles sans
recalcul. Le champ `mesure` dit si la valeur vient d'une mesure ou d'une
interpolation — voir le §5.

## 4. L'anneau n'a pas la même apparence d'une coque à l'autre

C'est ce qui a rendu la détection non triviale :

| Coque | Apparence de l'anneau |
|---|---|
| broyeur, fendeur | **trou traversant** — le fond magenta se voit à travers |
| bélier, ratisseur | **disque sombre peint**, pas un trou |
| pilon | **disque clair**, invisible aux deux détecteurs précédents |

Le détecteur unifie les deux premiers cas : union des trous obtenus par
remplissage et des amas sombres à cinq seuils adaptatifs, puis trois contraintes
qui écartent les chenilles — rondeur > 0,55 quand une chenille est à 0,1, centre
à moins de 22 % du centre de coque, largeur entre 12 et 62 %.

**Neuf ancres sur dix sont mesurées.**

Diamètres obtenus, en pourcentage de la largeur de coque : fendeur 18,5 et 16,7 ;
bélier 29,2 et 24,0 ; ratisseur 29,7 et 24,8 ; pilon 41,6 ; broyeur 50,2 et 38,7.
La progression suit la taille du char, ce qui est cohérent.

## 5. ⚠ La dixième ancre est interpolée, et signalée

`off_j_pilon_chassis` en pose d'attaque n'a pas d'anneau détectable : le sien est
un disque clair, et les seules zones sombres de sa coque sont ses chenilles — le
détecteur y trouve des formes de rondeur 0,04 à 0,17, décalées de 38 à 45 %.

Sa valeur est donc **construite, pas mesurée**, et l'entrée porte
`"mesure": false` :

- le **diamètre** vient de sa propre pose de défense, 42 % — l'anneau d'un char
  est le même dans les deux poses ;
- le **décalage** vient de la médiane des quatre autres coques en pose d'attaque,
  soit (−0,5 %, −10,7 %).

À remplacer par une mesure le jour où la planche est reprise.

## 6. Contrôles passés

| Contrôle | Résultat |
|---|---|
| Fichiers écrits | **30**, plus un JSON de dix ancres |
| Couleurs hors palette | **0** |
| Occupation | 41 à 43 % de moyenne, 35,9 % au minimum en 32 |
| Ancres mesurées | **9 / 10** |
| Assertion de grille | 2 bandes exigées par planche, l'outil s'arrête sinon |
| Composition coque + tourelle | ✔ regardée, la tourelle tombe dans l'anneau |

## 7. Reste ouvert

1. **L'ancre du pilon en attaque** (§5).
2. **`P3.3_chassis_face` et `P3.4_chassis_face` sont redondantes** : IoU de 0,95
   à 0,985 contre les planches `off_o_*_face` déjà en production. Les deux
   `_dos`, elles, divergent à 0,70–0,79 de ce qui est produit — plage indécidable
   par la mesure, arbitrage nécessaire.
3. **Le facteur d'échelle exact** de la tourelle dans son anneau reste à régler à
   l'œil, comme les 45 % du lot 5. La composition jointe utilise une valeur
   d'aperçu, pas une valeur arrêtée.
