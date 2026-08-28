# PASSATION — session sprites du 27/08/2026

Trente sprites livrés : **quatorze unités du joueur (S2)** et **seize bâtiments
(S6 et S7)**. Chacun en deux résolutions. Rien n'est commité — le dépôt est
`freredoc/chantier`, la décision appartient à Ethan.

---

## 1. Ce que contient l'archive

| Dossier | Contenu | Ce que c'est |
|---|---|---|
| `unites/128/` | 14 PNG | grille **128 réelle**, compressée depuis les planches d'origine, **sans retouche** |
| `unites/32/` | 14 PNG | grille **32 réelle** — dont les trois blindés à chenilles alignées, qui **supplantent** la version brute |
| `batiments/128/` | 16 PNG | grille 128 réelle, sans retouche |
| `batiments/32/` | 16 PNG | grille 32 réelle |
| `sources/` | 13 planches | les jets bruts en 1 254 px, tels que reçus |
| `outils/` | 3 scripts | de quoi tout refaire depuis `sources/` |
| `PLANCHE-*.png` | 4 planches | contrôle visuel des quatre jeux |

**Les 128 ne sont pas des 32 agrandis.** Ce sont les originaux réduits
directement sur une grille de 128, quatre fois plus fine. Un `off_j_meute.png`
de `unites/128/` contient quatre fois plus d'information que celui de
`unites/32/` ; ce n'est pas le même fichier redimensionné.

**Les 32 ne sont pas des 128 réduits non plus.** Ils viennent d'un
conditionnement séparé, visé sur une grille de 32 dès le départ. Réduire le 128
donnerait de la bouillie : le vote majoritaire doit voir les pixels d'origine.

---

## 2. Le workflow, tel qu'il s'est stabilisé cette session

### Ce qui marche

**1 — Génération libre, sans consigne technique.** On envoie au modèle
`INVENTAIRE-SPRITES.md` et `PLAN-PRODUCTION-SPRITES.md`, entiers, plus une
remarque libre. Aucune palette, aucune grille, aucun format, aucune liste
d'interdits dans le prompt.

**2 — Compression en Python.** Détourage du magenta, érosion, quantification
pondérée sur la palette fermée, réduction par vote majoritaire. C'est là que se
rattrapent la palette, la grille, l'échelle et la bordure.

**3 — Retouche après compression, jamais avant.** À 32 × 32 un sprite fait
500 pixels : c'est une table de données. Aligner des chenilles, uniformiser des
figures, élargir un accent — ça se code. Sur le jet en 1 254, on corrigerait
quelque chose qui disparaît à la réduction.

**4 — Mesure, pas coup d'œil.** Boîte, bordure, nombre de couleurs, part
d'accent, composantes connexes. C'est un tableau qui a écarté trois sessions de
génération sur quatre, pas une impression.

### Ce qui ne marche pas, et qui a été essayé

⚠ **Le prompt court a perdu sur les unités.** Il avait fermé S1 — cinq lignes,
un sujet par image. Sur S2 il sort des casques verts et bleus, deux couleurs
hors palette. Une tuile de sol est une matière ; une unité est une ligne d'un
tableau à quatre axes — châssis, coût, accent, nombre de pièces — et ces axes ne
tiennent pas en cinq lignes sans devenir des ordres. `PROMPTS-S2-unites-joueur.md`
est **périmé**, il ne doit pas servir de modèle pour S3 à S8.

⚠ **Les paquets « déjà en 32 × 32 » livrés par le modèle ne sont pas
quantifiés.** Mesuré : 156 à 409 couleurs sur un canevas de 1 024 pixels. La
réduction a été faite par interpolation. Toujours repartir des sources en
1 254.

⚠ **Le conditionneur fabrique de faux accents.** Le kaki du modèle est doré —
`(141, 128, 52)` — et la distance pondérée l'envoie sur `jaune sombre`. Un
aéronef anti-véhicule est sorti avec **plus de jaune que de rouge**. Correctif
appliqué ici, trois portes avant que la rampe d'accent devienne atteignable :

```
porte_jaune = B/max < 0,25  et  G/max > 0,55
porte_rouge = G/max < 0,55  et  B/max < 0,55  et  R ≥ 90
porte_blanc = (max−min)/max < 0,22  et  max ≥ 175
```

**Il est en Python seulement.** `tools/conditionneur.html` du dépôt produit
encore le défaut. Le port en JS est un lot à part.

⚠ **Le modèle ne tient pas l'échelle relative.** Sur les bâtiments, le
Collecteur à 1 500 PV sortait plus gros que le Chantier à 5 500. Rattrapé par
recadrage sur une cible en √PV, mais jamais produit spontanément.

⚠ **La retouche casse le lien source → fichier.** Elle doit donc être un script
versionné, pas un geste. `align_chenilles.py` se rejoue sur une source neuve.

---

## 3. État de S2 — les quatorze unités

Toutes conformes A7 : boîte ≤ 28 gros pixels, bordure de 2 vide, palette pure.

**Retouche appliquée, une seule.** Les trois blindés à 10 points — Éclaireur,
Chasseur, Pionnier — ont reçu deux bandes de chenille identiques : mêmes
colonnes absolues, largeur de 2, rythme `kaki contour` / `kaki ombre` ancré sur
la même ligne. Vérifié : **0 gros pixel de différence sur 128** entre les trois
paires, contre 60 et 64 avant.

### Défauts ouverts

| Sprite | Défaut | Mesure |
|---|---|---|
| Albatros (`enclume`) | accent quasi absent — liseré d'un gros pixel autour des cinq nacelles | 1,2 % |
| Percheron, Obusier | deux fois plus larges que les blindés à 10 points, chenilles claires | 24 × 28 contre 16 × 19 |
| Éclaireur, Chasseur, Pionnier | 16-17 de large pour 24 visés, et 45–51 % de contour | trois masses sombres |
| Toute la famille blindée | accent entre 5,7 et 9,8 %, contre 18–25 % sur les escouades | règle 4 non tenue |

**Ce qui va bien** : les cinq escouades. Cinq figures qui se séparent en cinq
masses distinctes à 32 px, une seule couleur de rôle chacune, accent entre 18,9
et 25,0 % — la référence validée `ref_meute` est à 22,9 %.

⚠ **Attention aux noms.** `meute`, `guetteur`, `ratisseur` sont les noms de
l'**Ouvrage**. Côté joueur ce sont **Fusiliers, Voltigeurs, Éclaireur** — voir
§3.2 de l'inventaire, chaque ligne porte un nom par camp. La clé de fichier est
commune, d'où `off_j_ratisseur.png` pour l'Éclaireur.

---

## 4. État de S6 et S7 — les seize bâtiments

Toutes conformes A7. Échelle par PV tenue après recadrage : Chantier 28 × 26,
Raffinerie et Accumulateur 16 × 11.

### Défauts ouverts

| | Défaut | Mesure |
|---|---|---|
| Caserne, Usine, Aérodrome | le châssis produit disparaît à 32 px — l'inventaire demande qu'ils le portent | taches de 2-3 gros pixels |
| Gangue et Terril | **le même bâtiment** — ils ne se distinguent que par l'accent, et ils sont 30 % du bâti chacun | 2 gros pixels d'écart |
| Tout le côté joueur | presque pas d'accent, contre 15-37 % côté Ouvrage | Centre de cdt 0,3 %, Usine 1,1 % |
| Raffinerie, Accumulateur | hachés — prise détachée du corps, deux blocs au lieu d'un | 16 × 11, 2 composantes |
| Centrale, Collecteur | ne ressemblent pas à leur partenaire réciproque | 176 et 109 gros pixels d'écart |

Les couples réciproques de `DEBITS` doivent se lire comme des paires. Raffinerie
et Accumulateur tiennent — 10 gros pixels d'écart, même prise latérale. Les
deux autres, non.

---

## 5. Ce qu'il reste à faire

1. **Porter les trois portes d'accent dans `tools/conditionneur.html`.** L'outil
   du dépôt fabrique encore de faux accents sur tout jet doré.
2. **Une génération pour les cinq blindés ensemble**, avec la note d'armement.
   C'est le seul correctif propre à la coupure de valeur de chenille entre les
   10 points et les 15 points.
3. **Reprendre l'Albatros seul** pour son accent.
4. **Séparer Gangue et Terril** par la forme, pas par la couleur.
5. **Élargir les accents du joueur** côté bâtiments, ou accepter que les deux
   camps ne jouent pas le même contraste.
6. Écrire l'amendement A9 dans l'inventaire — les jets bruts vivent dans
   `art/sources/`, c'est appliqué en fait mais pas écrit.

---

## 6. Comment refaire la livraison depuis zéro

```
python3 outils/final128.py     # sources/ -> unites/128 et batiments/128
python3 outils/align_chenilles.py   # retouche des trois blindés, sur la grille 32
```

`outils/cond.py` porte le noyau : détourage, érosion, quantification pondérée,
réduction par vote majoritaire. Les portes d'accent sont dans `final128.py`.
