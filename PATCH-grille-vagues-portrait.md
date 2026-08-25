# PATCH — grille, vagues et présentation portrait

*Établi le 24/08/2026, à partir des sources réelles du dépôt `freredoc/foyerzero` (branche `main`)
et des captures Tiberium Alliances fournies par Ethan.*

---

## Ce qui NE change pas

Vérifié sur les captures 5 et 6 : c'est le même écran d'attaque à deux positions de défilement
(bouton ⬆ sur l'une, ⬇ sur l'autre). Le champ de combat de TA **est** continu — bande de défense
puis bande de bâtiments, l'attaquant y monte.

Donc **`GRILLE.largeur = 9` et `GRILLE.longueur = 18` restent justes**, ainsi que les trois bandes
(1–2 déploiement, 3–10 défense, 11–18 bâtiments) et `casesBatiments = 72`. Rien à toucher.

---

## Correction 1 — intervalle entre vagues : 5 s → 10 s

**Décision d'Ethan (24/08) : une vague toutes les 10 s.** Confirmé par les captures TA, qui
affichent « Vague d'attaque 2 (+10 s) », « 3 (+10 s) », « 4 (+10 s) ».

### `src/data/combat.js` l. 33

```diff
   vaguesParRaid: 4,
-  intervalleVagueSec: 5,
+  intervalleVagueSec: 10,
   tickSec: 0.1, // 10 Hz
   dureeMaxCombatSec: 90,
```

### `SPEC-FOYER-ZERO.md` §2, l. 47

```diff
 | Vagues par raid | 4 |
-| Intervalle entre vagues | 5 s |
+| Intervalle entre vagues | 10 s |
 | Tick | 0,1 s (10 Hz) |
```

⚠ **Conséquence à vérifier avant le lot 2A** : la dernière vague sort désormais à t+30 s au lieu
de t+15 s. Avec `dureeMaxCombatSec = 90` inchangé, il reste 60 s à la vague 4 pour traverser
16 rangées. À la vitesse la plus lente du roster (`vitesse: 1`, cf. Fendeur), c'est jouable, mais
le seuil n'a pas été recalculé — **à faire tourner, pas à supposer.**

---

## Correction 2 — `FICHE-STYLE.md` §2 : la grille ne tient PAS sans caméra

La fiche affirme : « Écran cible : téléphone portrait, 9:19,5 → **la grille entière tient sans
caméra** ». C'est faux, et c'est mesurable.

| | CSS | physique (DPR 3) |
|---|---|---|
| Zone de jeu S25 FE (barre nav 135 px déduite, plein écran) | 360 × 735 | 1080 × 2205 |
| Chrome fixe (onglets 40 + ressources 37 + statut 28 + actions 46 + écrans 42 + palette 84) | 277 | 831 |
| **Scène disponible** | **458** | **1374** |
| Champ concaténé 18 rangées × 40 | **720** | 2160 |

**720 > 458.** Il manque 262 CSS px. Au mieux **11 rangées sur 18** sont visibles d'un coup.

### Remplacement du tableau de §2

```diff
-| Rendu écran cible | **40 px CSS** (≈120 px réels en DPR 3) |
+| Rendu écran cible | **40 px CSS = 120 px physiques** (DPR 3, 9 colonnes sur 1080) |
 | Ancrage | **centre de la case** (pas au sol) |
 | Champ de bataille | **9 colonnes × 18 rangées** |
 | — rangées 11–18 | bâtiments (8 rangées, le fond) |
 | — rangées 3–10 | défense (8 rangées) |
 | — rangées 1–2 | déploiement de l'armée offensive (2 rangées, le bas) |
-| Écran cible | téléphone portrait, 9:19,5 → **la grille entière tient sans caméra** |
+| Écran cible | téléphone portrait 1080 × 2205 (barre nav 135 px déduite) |
+| Scène disponible | **458 px CSS** une fois le chrome posé (277 px CSS) |
+| Rangées visibles d'un coup | **11 sur 18** → le champ de combat DÉFILE |
```

### Bloc à ajouter en fin de §2

```markdown
### Décomposition en écrans (arbitrée le 24/08, modèle TA)

Le champ de 18 rangées est **continu en combat**, mais la **gestion** se fait en trois écrans
distincts de 9 colonnes, comme dans Tiberium Alliances. Ce n'est pas une contradiction : ce sont
deux vues du même terrain.

| Écran | Contenu | Emprise |
|---|---|---|
| **Chantier** | rangées 11–18, les bâtiments | 9 × 8 = 320 CSS |
| **Défense** | rangées 3–10, les défenses | 9 × 8 = 320 CSS |
| **Arsenal** | composition des 4 vagues | 4 × 9 = 160 CSS |

- Chaque écran de 9 × 8 tient **entièrement** dans les 458 CSS de scène (rab : 138 CSS).
- L'**arsenal n'est pas une zone du terrain** : c'est la composition des 4 vagues, 36 emplacements.
  Les rangées 1–2 sont l'endroit où ces vagues *apparaissent* en combat, rien de plus.
- **Les rangées 1–2 ne sont jamais affichées hors combat.**
- Seul l'écran de combat fait défiler le champ concaténé.

### Alignement colonne par colonne (invariant d'interface)

L'éditeur de vagues porte **les mêmes 9 colonnes que le terrain, alignées au pixel**. La position
d'une unité dans l'arsenal EST sa colonne de sortie. C'est ce qui permet de supprimer les
contrôles ◀▶▲▼ par colonne que TA doit afficher parce que son éditeur est une bande séparée.

⚠ **Ne jamais introduire de gouttière (numéros de rangée, étiquettes) qui décalerait l'éditeur
du terrain.** L'alignement est le mécanisme, pas une coquetterie : le rompre ramène les flèches.

### Emprise des cases : écart assumé avec TA

Mesuré sur la capture de défense de TA : case de **193 × 158 px, ratio 1,22 : 1** — plus large que
haute, parce que les sprites en 3/4 ont une emprise au sol large. Foyer Zéro reste en **carré
strict 120 × 120**, conformément au principe 1 (vue top-down stricte). Les bâtiments auront donc
une allure plus compacte que dans TA. **C'est un choix, pas un défaut** — mais il doit être tenu
sur tout le roster, sinon la grille se met à respirer.
```

---

## Correction 3 — `src/data/combat.js`, commentaire d'entête l. 16–18

Le commentaire décrit la grille sans dire qu'elle se présente en trois écrans. Un lecteur du seul
fichier conclura que l'UI affiche 18 rangées.

```diff
 // --- grille de combat --------------------------------------------------------
 // 9 colonnes × 18 rangées, trois bandes contiguës, aucun terrain neutre.
 // Les rangées sont numérotées de 1 (bas, côté attaquant) à 18 (haut, fond).
+//
+// ⚠ NE PAS CONFONDRE TERRAIN ET ÉCRAN. Le terrain fait 18 rangées et défile en
+// combat (11 rangées visibles d'un coup sur 1080×2205). La GESTION se fait en
+// trois écrans de 9 colonnes : Chantier (11–18), Défense (3–10), Arsenal (4×9).
+// L'arsenal n'est PAS une zone du terrain : c'est la composition des 4 vagues.
+// Les rangées 1–2 ne sont affichées qu'en combat.
```

---

## Reste ouvert — ne pas trancher sans Ethan

1. **`dureeMaxCombatSec`** : 90 s inchangé alors que la vague 4 sort 15 s plus tard. Seuil à
   recalculer, pas à deviner.
2. **`SPEC-FOYER-ZERO.md` l. 281** se contredit : « couloir **9 × 300**, format téléphone :
   **30 de large**, 300 de haut ». 9 ou 30 ? C'est la carte du monde, hors périmètre de ce patch,
   mais l'incohérence est dans le fichier qui fait autorité.
3. **Palette de construction** : 14 constructions, 15 défenses, 14 unités. La maquette en montre
   ~5 à la fois en défilement horizontal. TA groupe l'offensif par bâtiment source
   (Caserne / Usine / Aérodrome). À arbitrer : défilement plat ou catégories.
4. **Rampe 5 tons de l'Ouvrage** : toujours « à définir » dans la fiche. La maquette d'assaut en
   utilise une provisoire (anodisé froid `#0B0E11` → `#55697A`) qui n'engage rien.
5. **Chantier et Défense partagent-ils un même niveau de base ?** TA les sépare (base 54,42 /
   défense 30,00). Les maquettes suivent TA. À confirmer.

---

## Ordre d'application suggéré

1. `combat.js` l. 33 (`intervalleVagueSec`) et l. 16–18 (commentaire) — 2 modifications, aucun
   effet de bord hors sim.
2. `SPEC-FOYER-ZERO.md` §2 l. 47.
3. `FICHE-STYLE.md` §2 : tableau + les trois blocs ajoutés.
4. Recalculer `dureeMaxCombatSec` **avant** d'ouvrir le lot 2A.

Les points 1 à 3 sont du documentaire et une constante ; ils ne cassent rien puisque aucun sprite
ni aucune UI n'existe encore. Le point 4 est un calcul, pas une réécriture.
