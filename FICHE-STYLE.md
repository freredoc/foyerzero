# Fiche de style — jeu de guerre idle (projet sans nom)

> Document de référence rechargé **au début de chaque session de génération de sprites**.
> Rôle identique aux invariants CSS d'Archipel : ce qui n'est pas écrit ici dérive.
> Aucun sprite ne doit être produit sans que cette fiche soit relue.

---

## 1. Principes non négociables

1. **Vue top-down stricte.** Aucune inclinaison, aucune perspective, aucun tri par profondeur.
2. **Tout pointe vers le haut.** Le combat est unidirectionnel : les unités avancent du bas vers le haut. Une seule orientation par entité, jamais de rotation ni de miroir.
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
| Champ de bataille | **9 colonnes × 20 lignes** |
| — lignes 0–7 | base (bâtiments) |
| — lignes 8–15 | défense |
| — lignes 16–19 | armée offensive |
| Écran cible | téléphone portrait, 9:19,5 → **la grille entière tient sans caméra** |

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
- L'ennemi reçoit sa propre rampe 5 tons, à définir, et surtout une **grammaire de formes différente** — l'opposition doit se lire à la silhouette, pas seulement à la teinte.
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

En vue zénithale, le sens de marche se lit par des indices discrets, jamais par un canon exagéré.

1. **Gradient avant/arrière** — l'avant (haut) est éclairé (`#8C9A72`), l'arrière assombri (`#343A2C`). C'est le signal principal, et il est gratuit.
2. **Masse asymétrique** — le volume dominant est décalé vers l'avant : dôme avancé sur la tourelle, glacis large sur le véhicule, épaules éclairées sur l'infanterie.
3. **Pont arrière** — bande sombre + deux évents `#1E2124` à l'arrière de tout châssis motorisé.

Les trois se cumulent. Aucun ne suffit seul.

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

| Points | Empreinte logique |
|---|---|
| 5 | ~20 × 20 (case partielle) |
| 10 | ~26 × 26 (case pleine) |
| 15 | ~30 × 30 (case débordante) |

Le poids visuel doit correspondre au poids réel. Aucune unité à 5 points ne doit paraître aussi massive qu'une à 15.

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
- Rotation, miroir, ou seconde orientation
- Perspective, inclinaison, tri par profondeur
- Dégradés, textures photographiques, anticrénelage sur la grille logique
- **Toute reprise de Command & Conquer** : ni tibérium, ni Mammoth, ni GDI/Nod, ni silhouette reconnaissable. La structure est libre, les noms et les designs ne le sont pas.

---

*v3 — établie à partir de la planche d'étalon (3 châssis × 2 armements), complétée du lexique
arrêté en Phase 0 : l'Ouvrage, le Foyer, le contre-ouvrage, quartz, scorie, 7 terrains.*

**Titre du jeu : Foyer Zéro.** La DA doit servir ce double sens — la forge *et* le foyer
originel d'une contagion. Le Foyer central doit se lire comme un creuset qui rayonne, pas
comme une citadelle.

**Reste à inscrire** (dette DA connue, cf. synthèse §4 D) : la rampe ennemie 5 tons, la correction du marcheur (pattes trop fines à 40 px), la couche d'accent séparée pour les casques d'infanterie, le socle de la tourelle mangé par le dôme.
