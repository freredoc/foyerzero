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

### Sol de l'Ouvrage — cendre violacée (5 tons)

Arrêtée le **27/08/2026 au soir**, en même temps que le sol du joueur et par le
même fichier : les deux sols sont **la même texture, recolorisée rang par rang**.

| Rôle | Hex |
|---|---|
| Creux, ravines | `#8E88A4` |
| Ombre | `#9B95AE` |
| **Sol nu (défaut)** | `#A8A3B9` |
| Clair | `#B5B1C2` |
| Poussière | `#C2BFCC` |

⚠ **Ces cinq tons ont EXACTEMENT la clarté des cinq de la terre cuite**, rang par
rang : L\* 58,1 · 62,9 · 68,0 · 73,0 · 77,9. C'est mesuré, pas approché, et c'est
la raison d'être de la rampe : deux sols de clarté différente donnent à un camp
un camouflage que personne n'a décidé.

La teinte est celle de l'Ouvrage : la version pâle de son ardoise. Ses machines
sont le bas de la gamme, son sol en est le haut.

⚠ **Une collision à connaître : le quartz est à ΔE 7 de la poussière de cendre**
(`#C1CEDA` contre `#C2BFCC`). Sans effet aujourd'hui — les champs ne se posent
que dans la base du joueur, sur terre cuite, où l'écart vaut ΔE 26. Le jour où un
champ apparaîtrait sur un sol d'Ouvrage, il lui faudrait un ton propre.

### Matières de terrain

Il n'y a plus sept terrains : le champ de bataille a **deux états**, sol nu ou
champ, et **deux sols**, un par camp. Ce qui se voit par-dessus est un élément
posé, jamais une teinte de sol différente.

| Matière | Où elle sert | Hex |
|---|---|---|
| Quartz | `champ_quartz_a`·`_b` | `#9FB3C5` · `#C1CEDA`, creux `#3E454C` |
| Scorie | `champ_scorie_a`·`_b` | `#382E47` · `#4E4160`, braises `#F5B636` |
| Pétrole | `obs_vehicule_a`·`_b` | `#1E2124` seul |
| Bois mort | `obs_infanterie_a`·`_b` | `#5B4133`, creux `#231D2E` |
| Pierre | `obs_les_deux_a`·`_b` | `#3E454C` · `#68727E`, creux `#1E2124` |
| Eau croupie | — | `#1F5160`, **inemployé** depuis la refonte du lot 1 |

⚠ **`#F5B636` sur la scorie est la seule couleur d'accent du décor.** Si le
combat s'en sert pour le feu ou les chiffres de dégâts, les deux se disputeront
l'œil. Une version braises éteintes, corps `#1E2124`, se substitue en une ligne.

⚠ Les noms `tile_affleurement`, `tile_croute`, `tile_vasiere`, `tile_suintement`,
`tile_futaie`, `tile_friche`, `tile_sterile` appartenaient au lot de terrain
supprimé le 27/08. Aucun de ces fichiers n'existe ni ne doit être régénéré.

⚠ **AUCUN TON DE SOL NE PORTE LE CONTOUR D'UN ÉLÉMENT POSÉ.** Les tons de sol
sont permis à l'intérieur d'une masse dont le pourtour est d'une autre matière,
jamais sur le bord qui touche le sol : le sol porte ses cinq tons partout, et une
silhouette peinte dans l'un d'eux disparaît. Vérifié sur les dix éléments du
lot 1, aucun n'en porte.

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

### Frontières de territoire — kaki vif et violet vif (4 tons chacune)

Arrêtées le **05/09/2026**, sur retour d'Ethan devant la carte au sol satellite :
« tu re-appliques un coloris vert kaki mais assez vif pour qu'il se détache par
rapport au nouveau plan satellite et tu prends un violet pareil assez vif comme
ouvrage mais qui ressort et qui contraste par rapport au nouveau sol de la
carte ». Elles ne peignent aucune entité : elles peignent la LIMITE d'un
territoire sur la carte du monde, et elles seules. Produites par
`tools/limites.py`.

| Rang | Rôle sur le dessin | Joueur | Ouvrage |
|---|---|---|---|
| 1 | **Bande intérieure** (côté territoire) | `#161A0E` | `#100916` |
| 2 | Repères, tournés vers l'intérieur | `#2F3C20` | `#26193C` |
| 3 | **Bande extérieure** (côté dehors) | `#475A2F` | `#3B285C` |
| 4 | Éclats aux angles | `#5F7A3E` | `#523A7A` |

⚠ **Ce sont les quatre premiers tons de la rampe de camp, à chroma doublée.**
Chaque ton garde au dixième la clarté du ton de même rang — kaki L\* 8,3 · 23,5 ·
35,7 · 47,9, ardoise 3,3 · 12,2 · 21,0 · 30,0 — et au degré sa teinte — kaki
125°, ardoise 308°. Seule la chroma change : 3,9 · 9,7 · 13,6 · 18,2 devient
8,2 · 19,2 · 27,3 · 36,1 côté joueur. **Le rangement par clarté est donc
inchangé, rang par rang**, et la lecture dedans-sombre / dehors-clair que la
frontière porte tient par construction.

⚠ **Pourquoi les rampes de châssis ne suffisaient plus.** La frontière avait été
recolorisée le 03/09 sur les quatre tons sombres des rampes de camp, calibrés
contre `TERRAIN_CARTE.rampes` — la référence *déclarée* de l'ancien sol indexé,
dont les clartés s'arrêtaient à L\* 58,1 par le bas. Le sol satellite du lot
SOL-SATELLITE descend plus bas et porte sa propre couleur : mesuré sur les huit
planches, **L\* p1 50,7 · p5 55,0 · médiane 64,5 · p95 74,2 · p99 78,0**, chroma
moyenne 25,8, teinte 46°. Contre un sol de cette chroma, une frontière à chroma
13–18 se lit comme de la boue et non comme un code. Le pire écart au sol, en
ΔE76, passe de **22,1 à 30,4 côté joueur et de 30,5 à 41,5 côté Ouvrage**.

⚠ **Le facteur est deux, et c'est un nombre qui se change seul.** Mesuré aussi à
×1,5, ×2,5 et ×3 : au-delà de ×2 le gain s'essouffle côté Ouvrage (+11,0 de ×1 à
×2, +0,5 ensuite) et le kaki sort de sa famille côté joueur — à ×2,5 sa chroma
passe à 45 et le ton clair vire à l'herbe, là où le treillis est demandé.

⚠ **Et aucun autre code hexadécimal n'est écrit dans cette fiche hors des
tableaux.** Deux gardes comptent les teintes en balayant ce document au motif
`#` suivi de six chiffres : un ton cité en prose pour dire qu'on l'écarte
entrerait dans la palette et deviendrait autorisé dans la feuille de style. Une
valeur écartée se décrit, elle ne se cite pas.

⚠ **Ces huit tons ne sont pas des tons d'entité et ne s'y substituent pas.** Une
unité, un bâtiment, une défense se peignent sur les rampes de châssis et
d'ardoise ci-dessus, inchangées. « Aucun vert dans le terrain, nulle part »
reste vrai : une frontière n'est pas du terrain, c'est ce qui le borne.

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

*v5 — 27/08/2026, nuit. Rampe de sol de l'Ouvrage inscrite — cinq tons, calés
en clarté sur ceux du joueur. Les sept terrains disparaissent du tableau des
matières, remplacés par les six éléments posés réellement produits. Règle de
silhouette ajoutée. La palette passe de vingt-huit à **trente-trois teintes** :
`test/banc.test.js` et `CLAUDE.md` ont été repris dans le même commit.*

*v4 — 27/08/2026. Trois choses inscrites : la rampe de l'Ouvrage au §3, la forme
du Dard ci-dessus, et les sept conventions A1 à A7 d'`INVENTAIRE-SPRITES.md`,
tranchées le 26/08 et jusqu'ici non reportées — elles ont réécrit les §1.1, §1.2,
§7 et §11. **Les cinq dettes DA sont closes ; la liste « reste à inscrire » qui
figurait ici est supprimée parce qu'elle est vide.***

*v3 — établie à partir de la planche d'étalon (3 châssis × 2 armements), complétée du lexique
arrêté en Phase 0 : l'Ouvrage, le Foyer, le contre-ouvrage, quartz, scorie, 7 terrains.*
