# Fiche de style — jeu de guerre idle (projet sans nom)

> Document de référence rechargé **au début de chaque session de génération de sprites**.
> Rôle identique aux invariants CSS d'Archipel : ce qui n'est pas écrit ici dérive.
> Aucun sprite ne doit être produit sans que cette fiche soit relue.

---

## 1. Principes non négociables

1. **Vue top-down haute, caméra à 75° de l'horizontale.** On voit le dessus des objets et une amorce de leur face basse — un quart de leur hauteur, `cos 75° ≈ 1/4`. **Ce n'est pas de l'isométrie** : la grille reste carrée et droite, on ne l'incline pas, on ne la compresse pas, on ne la tourne pas de 45°. Aucun tri par profondeur, garanti par le non-dépassement de case (`INVENTAIRE-SPRITES.md` A7). *Remplace le « zénithal strict » des versions antérieures, tranché le 26/08.*
2. **Tout pointe vers le haut, et deux transformations seulement.** Le combat est unidirectionnel : les unités avancent du bas vers le haut. **Une seule orientation DESSINÉE par entité** — on ne produit jamais un second fichier pour la même entité tournée. Au rendu, exactement deux transformations sont permises : **rotation par pas de 90° pour les véhicules**, **miroir vertical pour l'infanterie**, rien pour tout le reste (`INVENTAIRE-SPRITES.md` A4). C'est ce qui retourne les garnisons sans un fichier de plus.
3. **La forme code la classe, la couleur code la cible.** Jamais l'inverse.
4. **L'accent fonctionnel est une zone large**, jamais une pointe. Il doit rester lisible à 40 px.
5. **Composition, pas dessin.** Toute entité est un enregistrement `{châssis, arme, rôle, taille}`. On n'invente pas un sprite isolé : on ajoute une valeur à un axe existant.

---

## 2. Grille et rendu

| Paramètre | Valeur |
|---|---|
| Grille logique de dessin | **32 × 32** |
| Facteur d'agrandissement | **×4, nearest-neighbour** |
| Fichier livré | **128 × 128 PNG** RGBA |
| Rendu écran cible | **40 px CSS** (≈120 px réels en DPR 3) |
| Ancrage | **centre de la case** (pas au sol) |
| Champ de bataille | **9 colonnes × 18 rangées** |
| — rangées 11–18 | bâtiments (8 rangées, le fond) |
| — rangées 3–10 | défense (8 rangées) |
| — rangées 1–2 | déploiement de l'armée offensive (2 rangées, le bas) |
| Écran cible | téléphone portrait, 9:19,5 → **la grille entière tient sans caméra** |

> Corrigé au lot 3A : la fiche annonçait 9 × 20 avec quatre lignes de déploiement.
> La grille arbitrée fait **9 × 18** avec **deux** rangées de déploiement — c'est ce que
> porte `GRILLE.bandes` dans `src/data/combat.js`, qui fait foi. Les rangées sont
> numérotées de 1 (bas, côté attaquant) à 18 (haut, le fond) : l'attaquant monte.

**Interdit :** dessiner directement en 128. Le pixel art disparaît et le sprite se brouille à l'affichage.

Marge de sécurité : **2 px logiques minimum** en haut, pour que les canons ne débordent pas sur la case voisine.

---

## 3. Palette

Toutes les valeurs sont fixes. Aucune teinte hors de cette liste.

### Châssis — kaki désaturé (5 tons)

| Rôle | Hex |
|---|---|
| Contour / creux | `#161914` |
| Ombre de corps | `#343A2C` |
| **Corps (défaut)** | `#4E5742` |
| Éclairé | `#6A7658` |
| Lumière | `#8C9A72` |

### Sol — terre cuite (5 tons)

Arrêtée le **27/08/2026** contre la candidate « sable », plus claire mais fade.
Voir `RAPPORT-S1-terrain.md`.

| Rôle | Hex |
|---|---|
| Creux, ravines | `#B87E64` |
| Ombre | `#C38C73` |
| **Sol nu (défaut)** | `#CF9A83` |
| Clair | `#D7A995` |
| Poussière | `#E0B9A8` |

⚠ **Pourquoi le sol est clair alors que la référence du genre est sombre.**
La bande de clarté L\* 58–78 n'est pas un choix esthétique : toutes les rampes
d'entité vivent entre L\* 3 et 62, et le kaki du joueur occupe précisément
36–48. Un sol de cette valeur camoufle l'armée du joueur sur son propre
terrain — mesuré, constaté, et c'est ce qui a fait rejeter le premier jet du
lot 1. **Le sol passe au-dessus des entités en clarté ; toute entité y devient
une masse sombre.** Un sol plus rouge et plus sombre est hors de portée : au
sRGB, le rouge profond exige la valeur basse, et la valeur basse est prise.

### Matières de terrain

Le sol ci-dessus est **commun aux sept terrains**. Ce qui les distingue est une
matière posée dessus, jamais une teinte de sol différente.

| Matière | Terrain | Hex |
|---|---|---|
| Quartz | `tile_affleurement` | `#9FB3C5` · `#C1CEDA` |
| Scorie | `tile_croute` | `#382E47` (ardoise, ci-dessus) |
| Eau croupie | `tile_vasiere` | `#1F5160` |
| Pétrole | `tile_suintement` | `#1E2124` (métal sombre — réutilisé, un ton propre tomberait à ΔE 2 de lui) |
| Bois mort | `tile_futaie` | `#5B4133` |
| Broussaille sèche | `tile_friche` | aucun ton propre — le sol le plus clair, en touffes |
| — | `tile_sterile` | aucune matière |

⚠ **Aucun vert dans le terrain, nulle part.** Le vert est la couleur du joueur.
Dans un décor aride la végétation est sèche : la futaie est du bois mort, la
friche de la paille. Une friche verte rendrait une escouade invisible.

### Ouvrage — ardoise violacée (5 tons)

Arrêtée le **27/08/2026** au terme du jet d'essai S0, contre la candidate « fonte
oxydée » écartée. Voir `RAPPORT-S0-rampe-ouvrage.md`.

| Rôle | Hex |
|---|---|
| Contour / creux | `#0D0B12` |
| Ombre de corps | `#231D2E` |
| **Corps (défaut)** | `#382E47` |
| Éclairé | `#4E4160` |
| Lumière | `#6B5B80` |

Conséquence à tenir : la scorie étant le dépôt que l'Ouvrage laisse en
s'étendant, `tile_croute` tire vers cette rampe et **jamais vers le brun**.

### Métal — canons, chenilles, socles (3 tons)

| Rôle | Hex |
|---|---|
| Sombre | `#1E2124` |
| Moyen | `#3E454C` |
| **Clair (tubes, chenilles)** | `#68727E` |

### Accents fonctionnels — saturés, doivent trancher

| Cible | Sombre | Clair |
|---|---|---|
| **Anti-infanterie** (blanc) | `#928E80` | `#F5F3E8` |
| **Anti-véhicule** (rouge) | `#8A1E17` | `#E43E32` |
| **Anti-aérien** (jaune) | `#A67018` | `#F5B636` |

### Divers

| Rôle | Valeur |
|---|---|
| Ombre portée | `rgba(0,0,0,0.31)` |
| Transparent | alpha 0 |

**Règle absolue :** la couleur d'accent désigne **ce que l'unité peut tuer**, des deux côtés du champ de bataille. Rouge = anti-véhicule partout, jaune = anti-aérien partout. Le joueur n'apprend qu'un seul langage.

### Une seule faction jouable

Il n'y a **pas de dualité GDI/Nod**. Le joueur mène un **chantier de reprise** et élève son **contre-ouvrage** ; l'adversaire est **l'Ouvrage**, une installation d'extraction automatisée qui s'est répliquée sans supervision. Ce n'est pas une nation et ça n'a pas de chef — la grammaire de formes doit le dire : modules identiques, radial, à pattes, accent émissif. Conséquences :

- La rampe kaki ci-dessus est **celle du joueur**, définitivement.
- L'ennemi reçoit sa propre rampe 5 tons — **arrêtée le 27/08, c'est l'ardoise violacée ci-dessous** — et surtout une **grammaire de formes différente** — l'opposition doit se lire à la silhouette, pas seulement à la teinte.
- Le roster offensif est divisé par deux : **14 unités, pas 28**. Aucun miroir à équilibrer.
- La couleur d'accent reste commune : le joueur doit lire les défenses ennemies aussi vite que les siennes.

---

## 4. Les trois châssis

Chaque châssis a une **empreinte au sol distincte**, lisible même quand tout le détail a disparu.

| Châssis | Empreinte | Silhouette |
|---|---|---|
| **Tourelle** | carrée, bord à bord | socle plein + dôme rond, statique |
| **Véhicule** | allongée verticalement | caisse + deux chenilles claires très contrastées, avant pointu |
| **Infanterie** | dispersée | 3 figures larges en triangle, pointe vers le haut |

Support de l'accent selon le châssis :

- **Tourelle** → anneau d'accent sur le socle (grande surface annulaire)
- **Véhicule** → bandeau d'accent transversal sur la caisse
- **Infanterie** → **casque** de chaque figure en couleur d'accent

Dans les trois cas, la bouche du canon reprend la couleur claire de l'accent.

---

## 5. Armement

| Armement | Tube | Longueur |
|---|---|---|
| Anti-infanterie | double, fin (1 px chacun) | court |
| Anti-véhicule | simple, épais (3 px) | long |
| Anti-aérien | simple, fin, incliné vers le haut | moyen |
| Artillerie (`_ranged`) | même tube, **rallongé de moitié** | long+ |

Le canon reste **court** : il confirme la direction, il ne la porte pas.

### Orientation : trois signaux cumulatifs

En vue de dessus, le sens de marche se lit par des indices discrets, jamais par un canon exagéré.

1. **Gradient avant/arrière** — l'avant (haut) est éclairé (`#8C9A72`), l'arrière assombri (`#343A2C`). C'est le signal principal, et il est gratuit.
2. **Masse asymétrique** — le volume dominant est décalé vers l'avant : dôme avancé sur la tourelle, glacis large sur le véhicule, épaules éclairées sur l'infanterie.
3. **Pont arrière** — bande sombre + deux évents `#1E2124` à l'arrière de tout châssis motorisé.

Les trois se cumulent. Aucun ne suffit seul.

⚠ Le gradient du point 1 est **fonctionnel, jamais directionnel** : l'avant est clair parce que c'est l'avant, pas parce qu'une lumière le frappe. C'est ce qui le rend compatible avec la rotation et le miroir du §1.2 — le flanc dessiné en bas est sombre, l'arrière du gradient est sombre, et après retournement les deux signaux disent encore la même chose.

⚠ **Une exception : le Dard n'a pas d'avant.** Sa symétrie radiale exclut les trois signaux. Voir le bloc en fin de fiche.

---

## 6. Ombre et altitude

| Type | Ombre |
|---|---|
| Au sol | ellipse serrée, décalée de **+1 px** vers le bas |
| Aérien | ellipse **décalée de 5–6 px**, plus diffuse |
| Infanterie | une petite ombre **par figure** |

Le décalage d'ombre est le **seul** signal d'altitude. Aucune autre indication n'est nécessaire ni autorisée.

---

## 7. Taille = coût

Les trois paliers de points d'armée se lisent à l'empreinte :

| Points | Empreinte logique | Pièces |
|---|---|---|
| 5 | **18 × 18** | escouade : 3 figures |
| 10 | **24 × 24** | escouade 5 figures · blindé 1 tube · aéronef 3 modules |
| 15 | **28 × 28** | blindé 2 tubes, double train · aéronef 5 modules |

Le poids visuel doit correspondre au poids réel. Aucune unité à 5 points ne doit paraître aussi massive qu'une à 15.

⚠ *L'échelle 20 / 26 / 30 des versions antérieures est caduque : le non-dépassement de case (A7) supprime la « case débordante » et plafonne à 28. Tranché le 26/08.*

**Mais la taille seule ne suffit pas**, parce que l'échelle ne sert jamais à trois valeurs, seulement à trois oppositions binaires — 5 contre 10 pour les escouades, 10 contre 15 pour les blindés et les aéronefs. D'où le second signal : **on compte des pièces.** La pièce garde une taille lisible — un fantassin fait environ 8 gros pixels quel que soit le coût — et c'est son NOMBRE qui code le coût. L'empreinte passe de 18 à 24 par accumulation, pas par étirement. Détail complet en A6 de `INVENTAIRE-SPRITES.md`.

⚠ Le §1.3 tient : **la forme code la classe.** Le nombre de pièces code le coût, pas la classe — cinq figures restent une escouade, deux tubes restent un blindé.

---

## 8. Animation

**Par transformation, pas par frames.** Un sprite unique par entité, tout le mouvement obtenu en `translate / rotate / scale` côté Canvas.

| Effet | Méthode |
|---|---|
| Marche | oscillation verticale 1–2 px |
| Chenilles | décalage de texture |
| Tir | recul 2–3 px + éclair de bouche en primitive |
| Mort | rotation + fondu + particules |
| Vol | sinusoïde lente + ombre décalée |
| Impacts, explosions | **100 % procédural**, aucun asset |

Les planches d'animation ne sont produites que si une transformation ne suffit pas. Dans ce cas, l'invariant d'Archipel s'applique : **frame 0 pixel-pour-pixel identique au sprite statique.**

---

## 9. Nommage

```
def_<chassis>_<cible>.png        def_tourelle_av.png
def_<chassis>_<cible>_r.png      variante longue portée (artillerie)
off_<nom>.png                    unité offensive
bat_<id>.png                     bâtiment
tile_<terrain>.png               terrain
ui_<élément>.png                 interface
poi_<type>.png                   point d'intérêt
```

Cibles : `ai` (anti-infanterie) · `av` (anti-véhicule) · `aa` (anti-aérien)

Terrains (7, lexique arrêté en Phase 0) :

| Fichier | Contenait, dans le modèle d'origine |
|---|---|
| `tile_sterile` | vide |
| `tile_affleurement` | cristal — donne du **quartz** |
| `tile_croute` | ~~tiberium~~ — donne de la **scorie** |
| `tile_futaie` | bois |
| `tile_friche` | broussaille |
| `tile_suintement` | pétrole |
| `tile_vasiere` | marais |

**Deux ressources :** le **quartz** (neutre, partout, structure et construction) et la **scorie** (le dépôt que l'Ouvrage laisse en s'étendant — riche, donc sur terrain contaminé, donc défendu).

⚠ La scorie ne doit **pas** dériver vers un cristal vert qui pousse tout seul. C'est le point exact où la reprise C&C se réintroduit sans qu'on la voie.

Les trois châssis — tourelle, véhicule, infanterie — sont des mots neutres : **aucune dette de nommage sur cet axe**, `def_tourelle_av.png` reste valide tel quel.

---

## 10. Pipeline

Identique à Archipel :

```
/home/claude/work/            générateurs Python + PIL
/home/claude/work/out/sprites/    PNG 128×128
/home/claude/work/out/anim/       planches d'animation
→ livraison ZIP versionné
```

Les sprites sont **générés par composition** (`CHASSIS[x](arme)`), jamais dessinés un par un. Ajouter une unité = ajouter une valeur à un axe, pas écrire une nouvelle fonction de dessin.

---

## 11. Interdits

- Dessiner en 128 natif
- Une teinte hors palette
- Une couleur d'accent utilisée pour autre chose que la cible
- Un sprite qui n'existe pas comme composition d'un châssis et d'un armement
- **Une seconde orientation DESSINÉE** — un second fichier pour la même entité tournée. La rotation à 90° des véhicules et le miroir de l'infanterie se font AU RENDU et sont permis (§1.2)
- Isométrie, point de fuite, horizon, grille inclinée ou compressée, tri par profondeur — l'inclinaison à 75° se dessine DANS le sprite, jamais dans la grille (§1.1)
- **Tout dépassement de case** : flanc, canon et antenne compris, un sprite tient dans 28 × 28 gros pixels sur 32. Seules les tuiles de terrain font 32 × 32 bord à bord
- **Tout flanc au-delà de 2 gros pixels sur une unité** — régime B, c'est la contrepartie exacte de la rotation et du miroir
- Tout éclairage directionnel cuit dans le sprite : il devient faux à la première rotation
- Tout emblème — aigle, étoile, croix, cocarde, drapeau, blason, écusson — et tout texte ou chiffre
- Dégradés, textures photographiques, anticrénelage sur la grille logique
- **Toute reprise de Command & Conquer** : ni tibérium, ni Mammoth, ni GDI/Nod, ni silhouette reconnaissable. La structure est libre, les noms et les designs ne le sont pas.

---

**Titre du jeu : Foyer Zéro.** La DA doit servir ce double sens — la forge *et* le foyer
originel d'une contagion. Le Foyer central doit se lire comme un creuset qui rayonne, pas
comme une citadelle.

### Forme volante de l'Ouvrage — le Dard, arrêté le 27/08

L'étalon v4 ne comportait que trois formes ennemies : **pylône** (structure),
**marcheur** (véhicule), **essaim** (infanterie légère et nombreuse), et aucune
forme volante — alors que la planche joueur contient `arme_aa.png` et que le
modèle de combat repose sur quatre types de cible dont l'aviation. Sans ennemi
aérien, l'anti-aérien du joueur n'avait pas de cible.

**La quatrième forme existe désormais : le Dard.** Petit, rapide, isolé —
l'inverse de l'essaim au sol. Un moyeu central, des modules identiques disposés
en triangle radial autour de lui, reliés par des bras courts, un disque sombre
plein sous chaque module en guise de puits de sustentation. **Aucune aile
portante, aucune hélice, aucun rotor** : la sustentation doit sembler procédée,
non aérodynamique. Le nombre de modules code le coût — trois à 10 points, cinq
pour `enclume` à 15.

Référence : `art/ouvrage/ref_dard.png`.

⚠ **Conséquence acceptée : un Dard n'a pas d'avant.** La symétrie radiale est ce
qui fait lire l'Ouvrage comme une installation qui se réplique ; elle coûte
l'orientation, et ça ne se rattrapera sur aucun des quatre aéronefs.

---

*v4 — 27/08/2026. Trois choses inscrites : la rampe de l'Ouvrage au §3, la forme
du Dard ci-dessus, et les sept conventions A1 à A7 d'`INVENTAIRE-SPRITES.md`,
tranchées le 26/08 et jusqu'ici non reportées — elles ont réécrit les §1.1, §1.2,
§7 et §11. **Les cinq dettes DA sont closes ; la liste « reste à inscrire » qui
figurait ici est supprimée parce qu'elle est vide.***

*v3 — établie à partir de la planche d'étalon (3 châssis × 2 armements), complétée du lexique
arrêté en Phase 0 : l'Ouvrage, le Foyer, le contre-ouvrage, quartz, scorie, 7 terrains.*
