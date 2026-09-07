# RAPPORT — conditionneur de sprites

**26/08/2026 · `tools/conditionneur.html` v1 · 24 001 octets**

---

## Ce qui est livré

| Fichier | Emplacement | État |
|---|---|---|
| `conditionneur.html` | `tools/` | **nouveau** |
| `BRIEF-SPRITES-IA.md` | racine | modifié — §4 réécrit pour décrire l'outil |
| `INVENTAIRE-SPRITES.md` | racine | inchangé depuis la v3 de ce matin, joint pour que le lot soit cohérent |

Page autonome : aucune dépendance, aucun appel réseau, aucun `localStorage`.
S'ouvre par double-clic ou depuis le navigateur du téléphone, fonctionne hors
ligne. Rien dans `src/`, rien dans `test/`.

---

## Suite de tests — verte, mesurée

**45 assertions, 45 vertes.** Le noyau de calcul est délimité dans le fichier par
`NOYAU TESTABLE — DÉBUT / FIN` ; il est pur (aucun accès au DOM), extrait tel
quel et exécuté sous Node. Ce n'est pas une copie du code : c'est le code.

### Unitaires — 34/34

Palettes (4) · plus proche couleur (5) · détection du fond magenta (7) ·
érosion (1) · réduction majorité et centre (6) · bordure et boîte englobante (5) ·
`slug` (3) · CRC32 (2) · ZIP (1).

Deux points valent d'être cités :

- **CRC32 vérifié contre le vecteur de référence** `"123456789"` → `0xCBF43926`.
  Un CRC faux produit un ZIP que l'explorateur d'Android refuse d'ouvrir sans
  jamais dire pourquoi.
- **ZIP vérifié par `unzip -t` puis `cmp`** : archive écrite, extraite, et le PNG
  ressorti est **identique octet pour octet** à l'original. La méthode est
  `stored` — le PNG est déjà compressé, le recompresser ne gagnerait rien et
  demanderait un deflate en JS.

### Intégration — 11/11

Le pipeline complet tourne sur des images synthétiques de 1024 × 1024 : carré
kaki bruité (± 9 par canal), liseré rose de 4 px, fond magenta.

| Cas | Attendu | Obtenu |
|---|---|---|
| Sujet de 28 gros pixels | bordure vide, emprise ≤ 28 | bordure vide, **28 × 28** |
| Kaki bruité, ± 9 par canal | tout ramené au kaki corps | **1 seule couleur, `#4E5742`** |
| Liseré rose | éliminé | éliminé |
| Sujet de 30 gros pixels | **débordement détecté** | détecté, emprise 30 gp |
| Mode tuile | aucun pixel transparent | 0 |
| Image entièrement magenta | sprite vide, pas de plantage | boîte nulle, garde-fou tenu |

**Performance : 242 ms** pour une image de 1024 × 1024 sur cette machine. Un lot
de 30 images ≈ 7 s ; comptez trois fois plus sur le téléphone, la barre d'état
affiche l'avancement image par image.

### Sur une vraie image de modèle

Ton jet de bâtiment (128 × 128) passé dans le pipeline, palette joueur seule :

```
4 448 couleurs  →  12
```

Les douze retenues : les cinq kakis, les trois métaux, le rouge sombre, le blanc
sombre et clair, les deux jaunes. C'est exactement ce que la quantification est
censée faire, et c'est ce qu'aucun réglage d'export ne donne à la main.

Deux choses que l'outil a signalées sur ce même fichier, et qui sont justes :
son fond est **noir opaque et non magenta**, donc rien n'a été détouré ; et son
emprise fait **32 × 32 gros pixels**, donc `bordure vide : false` — il déborde.
Les deux sont des défauts de prompt, pas de l'outil : ce jet est antérieur au
brief.

---

## Ce que l'outil fait, dans l'ordre

1. **Détourage** — deux critères cumulés : distance à `#FF00FF` (seuil réglable)
   et dominante rose (`r > 140 && b > 140 && g < min(r,b) × 0,7`), qui rattrape
   les bords où le sujet s'est mélangé au fond. Vérifié : aucune couleur de la
   palette ne déclenche ce second critère, y compris les accents clairs.
   Puis rognage du masque, `n` passes 4-connexes.
2. **Quantification** — distance pondérée `2·Δr² + 4·Δg² + 3·Δb²`, le vert pesant
   double parce que c'est là que se joue la rampe kaki. Cache sur la couleur
   réduite à 5 bits par canal : sans lui, un aplat bruité de 1024 × 1024 coûte un
   million de recherches sur 19 couleurs.
3. **Réduction** — vote majoritaire sur chaque bloc (défaut) ou centre du bloc.
   Jamais de moyenne : une moyenne réintroduirait des couleurs hors palette et
   annulerait l'étape 2.

Puis les contrôles d'A7, mesurés et non estimés : bordure de 2 gros pixels
réellement vide sur les quatre côtés, emprise ≤ 28 × 28, nombre de couleurs.
Et les vignettes du §6 du brief : 40 px sur fond clair, 40 px sur fond sombre,
quart de tour, demi-tour, miroir vertical.

Le ZIP embarque un `CONTROLE.txt` qui reprend tout, ligne par ligne, avec les
réglages du lot. Les doublons de nom sont suffixés au lieu d'être écrasés.

---

## Écarts et points laissés ouverts

- **Le rognage sert peu en mode Majorité.** Mesuré : 12 544 → 12 540 pixels
  opaques, soit 4 pixels. Le vote absorbe le liseré tout seul. Il reste utile en
  mode Centre, et le réglage est resté visible pour ça — c'est écrit dans l'aide
  de la page.
- **Aucun test dans un vrai navigateur.** Le noyau est prouvé, le canvas et le
  téléchargement ne le sont pas : ils ne s'exécutent pas hors navigateur. Le
  premier lot réel sert de test d'appareil, comme d'habitude.
- **Pas de mémoire entre sessions.** Rechargement de la page = liste vide. Les
  réglages sont à ressaisir à chaque lot ; c'est quatre champs et ça évite un
  `localStorage` qui aurait retenu un mauvais réglage sans qu'on le voie.
- **L'outil ne juge pas.** Un sprite peut sortir tout vert et être à refaire
  parce que sa face fait 6 px au lieu de 2, ou qu'il ressemble à autre chose.
  Les points 7 et 9 de la grille du §6 restent à l'œil, et c'est volontaire.

---

## À faire, côté dépôt

Décompresser à la racine de `freredoc/foyerzero`, commiter les trois fichiers.
Rien à lancer, rien à installer. La suite reste à **152/152** : aucun fichier de
`src/` ni de `test/` n'est touché, l'outil vit dans `tools/` et n'est pas importé
par le build.
