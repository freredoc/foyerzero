# RAPPORT — lot BÂTIMENTS-source-1024 : la bascule sur les planches « 1024 »

Écrit sur disque, à la racine. Toutes les grandeurs sont **mesurées par
exécution**, aucune n'est recopiée du mémo.

---

## 1. Ce qui a été produit

| Grandeur | Valeur |
|---|---|
| Version | **0.42.0 · build 43** — `version` et `config.build` restés des **chaînes** |
| `npm run check` | **560 pass / 0 fail** (559 avant, **+1**) |
| `dist/index.html` | **577 357 octets** — **−3 768** depuis 581 125 |
| `art/sources/` | **143 fichiers à l'ouverture, 143 à la fermeture** — rien supprimé |
| Fichiers touchés | 54 : les 48 sprites, l'atlas, les 2 outils, `package.json`, `CLAUDE.md`, `test/sprite.test.js` |

⚠ **LE HTML A RÉTRÉCI, ET C'EST LA V2 QUI LE REND.** L'atlas des bâtiments passe
de 23 285 à **20 459 octets** : les seize sujets de la V2 se compressent mieux.
Une bascule d'illustration peut donc rendre des octets — 3 768 ici, ce qui
remonte la marge de T10 de 3,1 % à **3,8 %**.

---

## 2. Les trois mesures du §4, avec leur valeur réelle

### 2.1 Reproductibilité — `--verifier` rejoué après `--ecrire`

```
identiques à l'octet : 88
différents           : 2
nouveaux             : 0
  ÉCART unite/32/off_j_ratisseur.png
  ÉCART unite/32/off_j_belier.png
```

**88 identiques** = 40 (le reste de la chaîne) + **48** (les bâtiments). Les deux
`ÉCART` sont les écarts connus et voulus des unités, hors de ce lot.

L'écriture elle-même avait bien rendu **48 nouveaux, 0 différent** hors ces deux.

⚠ **L'ORDRE A ÉTÉ VÉRIFIÉ, PAS SEULEMENT RESPECTÉ.** Un `--ecrire` lancé AVANT la
suppression sort **50 `ÉCART`** — 48 bâtiments plus les 2 unités — et
**`git status` ne montre alors aucune modification** : l'invariant « on n'écrase
jamais un fichier existant qui ne se reproduit pas » a tenu, rien n'a été écrit.
C'est le comportement voulu, et il est ici mesuré plutôt que supposé.

### 2.2 Emprise et bordure, sur les trois grilles

Les seize sujets, emprise ramenée à la grille 32, marge en pixels de la grille :

| sujet | PV | cible | 32 : emp. / marge | 64 | 128 |
|---|---:|---:|---|---|---|
| bat_j_accumulateur | 1000 | 16 | 16,0 / 8 | 16,0 / 16 | 16,0 / 32 |
| bat_j_aerodrome | 2500 | 21 | 20,0 / 6 | 21,0 / 11 | 20,8 / 22 |
| bat_j_caserne | 2500 | 21 | 20,0 / 6 | 21,0 / 11 | 20,8 / 22 |
| bat_j_centrale | 2000 | 20 | 20,0 / 6 | 20,0 / 12 | 20,0 / 24 |
| bat_j_centre_de_commandement | 3000 | 23 | 22,0 / 5 | 23,0 / 9 | 23,0 / 18 |
| **bat_j_chantier_de_construction** | 5500 | 28 | **28,0 / 2** | 27,5 / 4 | 27,8 / 8 |
| bat_j_collecteur | 1500 | 18 | 18,0 / 7 | 18,0 / 14 | 17,8 / 28 |
| bat_j_complexe_de_defense | 2500 | 21 | 20,0 / 6 | 21,0 / 11 | 21,0 / 22 |
| bat_j_depot_de_vehicules | 2500 | 21 | 20,0 / 6 | 21,0 / 11 | 21,0 / 22 |
| bat_j_qg_de_defense | 3000 | 23 | 22,0 / 5 | 23,0 / 9 | 22,8 / 18 |
| bat_j_raffinerie | 1000 | 16 | 16,0 / 8 | 16,0 / 16 | 16,0 / 32 |
| bat_o_etai | 2500 | 21 | 20,0 / 6 | 21,0 / 11 | 21,0 / 22 |
| bat_o_gangue | 1000 | 16 | 16,0 / 8 | 16,0 / 16 | 16,0 / 32 |
| bat_o_noeud | 1500 | 18 | 18,0 / 7 | 18,0 / 14 | 18,0 / 28 |
| **bat_o_souche** | 5500 | 28 | **28,0 / 2** | 28,0 / 4 | 28,0 / 8 |
| bat_o_terril | 1000 | 16 | 16,0 / 8 | 16,0 / 16 | 15,8 / 32 |

- **Emprise maximale : 28,0** pour une borne de 28. **Aucun dépassement.**
- **Marge minimale : 2** en grille 32, **4** en 64, **8** en 128. **Aucune chute
  sous la borne.**
- Le pire cas est bien `bat_j_chantier_de_construction`, **pile à la limite des
  deux côtés** — et `bat_o_souche` l'est aussi, même PV de 5500. Le mémo n'en
  nommait qu'un ; ils sont deux, et c'est cohérent avec `cible(5500) = 28`.
- Les seize atteignent leur cible à moins d'une unité près. `cible`/`PV` n'ont
  pas été touchées.

### 2.3 `npm run check` reste au vert

**560 pass / 0 fail.** Le compte a monté d'**un** — pas parce que la bascule
touche `src/`, mais parce que ce lot ajoute une garde ; voir §4.

---

## 3. Le patch — trois endroits, et rien d'autre

### 3.1 `tools/final128.py` — la table `B`

Les sept lignes de la V1 remplacées par les cinq de la V2, exactement comme le
mémo les donne, `-2` de la planche P3 compris.

⚠ **L'ORIENTATION DES CINQ PLANCHES A ÉTÉ VÉRIFIÉE AVANT LE PATCH**, parce qu'une
inversion lignes/colonnes produirait seize sprites faux **en silence** : chaque
planche a été ouverte et sa cellule calculée. Les cinq rendent exactement
**1024 × 1024** :

| planche | dimensions | table | cellule |
|---|---|---|---|
| P1_caserne_depot_aerodrome_1024 | 1024 × 3072 | 1 × 3 | 1024 × 1024 |
| P2_chantier_qg_complexe_centre_1024 | 2048 × 2048 | 2 × 2 | 1024 × 1024 |
| P3_raffinerie_collecteur_centrale_accumulateur_1024-2 | 2048 × 2048 | 2 × 2 | 1024 × 1024 |
| P4_souche_etai_1024 | 1024 × 2048 | 1 × 2 | 1024 × 1024 |
| P5_gangue_noeud_terril_1024 | 1024 × 3072 | 1 × 3 | 1024 × 1024 |

`U`, `PV`, `OUV`, `cible`, `RENOMMAGE` : **inchangés**, vérifié par import.
`usine` reste la clé d'index et devient `bat_j_depot_de_vehicules` à l'écriture.

### 3.2 `tools/planches.py` — `APPENDICE = set()`

Le commentaire a été **réécrit**, pas laissé en place : il dit maintenant que la
passe existait pour la V1 seule, pourquoi elle existait, et surtout **qu'elle
ferait lever sur la V2** — `retirer_appendice.corriger` porte un `assert n == 2`
qui tombe sur une composante unique. `CHENILLES` (3 entrées) et `RENOMMAGE`
vérifiés intacts par import.

### 3.3 Les 48 fichiers

Supprimés puis réécrits sous les **mêmes seize noms** sur les trois grilles.
`git status` les voit donc comme *modifiés*, pas comme supprimés puis ajoutés :
ce lot ne renomme rien.

---

## 4. ⚠⚠ UN DÉFAUT QUE LE MÉMO NE POUVAIT PAS CONNAÎTRE, ET QUI A ÉTÉ MESURÉ

Le §4.3 du mémo affirme : « Aucun fichier de `src/` ne cite
`art/sprites/bâtiment/` — vérifié par grep, zéro occurrence. »

**Ce n'est plus vrai depuis le lot PREMIÈRE-COUCHE, mergé quelques minutes avant
que ce mémo soit ouvert.** `tools/atlas.py` lit désormais
`art/sprites/bâtiment/64/` et en coud `art/sprites/atlas-batiment-64.png`, que
`tools/build.js` inline en `data:` dans `dist/index.html`.

### Ce qui se serait produit en suivant le mémo à la lettre

Mesuré, dans l'état exact où la bascule laisse le dépôt sans recouture :

```
python3 tools/atlas.py --verifier
  ÉCART atlas-batiment-64.png
  atlas identiques : 1 · différents : 1 · nouveaux : 0

npm run check
  # tests 559 · # pass 559 · # fail 0        ← VERT
dist/index.html — 581125 octets              ← INCHANGÉ, à l'octet
```

**Le jeu aurait affiché les seize bâtiments de la V1 pendant que le dépôt portait
ceux de la V2, sans qu'une seule assertion tombe et sans que le livrable bouge
d'un octet.**

### Pourquoi aucune garde ne pouvait le voir

`src/data/atlas.js` ne porte que des **noms**, et cette bascule n'en renomme
aucun : l'index restait exact, la géométrie restait exacte, les onze bâtiments se
résolvaient toujours. **Seuls les pixels avaient divergé**, et rien ne les
comparait.

### Ce qui a été fait

1. **`python3 tools/atlas.py --ecrire` relancé**, puis `--verifier` :
   `2 identiques, 0 différent, 0 nouveau`. `src/data/atlas.js` **inchangé** —
   ce qui confirme le diagnostic plutôt qu'il ne le contredit.
2. **Une garde écrite dans `test/sprite.test.js`** — c'est le +1 du compte. Elle
   décode l'atlas et chaque sprite source (PNG 8 bits RVBA, non entrelacé) et
   exige que la cellule du rang `i` porte, **ligne par ligne**, les pixels de
   `noms[i]`.
   ⚠ **Falsifiée** : l'atlas de la veille remis sous les sprites du jour la fait
   tomber, et **elle est la seule à tomber** — les sept autres restent vertes,
   ce qui mesure précisément le trou qu'elle bouche.
   ⚠ Elle porte aussi ses propres appâts : le décodeur ne rend pas une image
   vide, et il distingue deux sprites différents. Sans eux, un décodeur muet
   ferait passer la boucle sur n'importe quel atlas.
3. **La règle consignée dans `CLAUDE.md` §6**, section « Sur les sprites et les
   atlas » : tout lot qui touche `art/sprites/<famille>/64/` relance
   `atlas.py --ecrire`, et le HTML change, donc la version se bumpe. Les grilles
   32 et 128 ne sont cousues nulle part aujourd'hui et ne déclenchent rien.

---

## 5. Vérifications supplémentaires, non demandées mais bon marché

- **Le défaut n° 4 du 27/08, « le même bâtiment », est soldé.** Écart de
  silhouette `bat_o_gangue` / `bat_o_terril` en grille 64 : **45,2 %**, contre
  2 % avant la bascule. C'est la justification principale du lot, et elle tient.
- **Zéro pixel hors palette** sur les 48 fichiers, palette du camp par camp —
  14 teintes côté joueur, 19 côté Ouvrage.

---

## 6. Les 48 fichiers écrits

Les mêmes seize noms sur `art/sprites/bâtiment/{32,64,128}/` :

```
bat_j_accumulateur      bat_j_aerodrome        bat_j_caserne
bat_j_centrale          bat_j_centre_de_commandement
bat_j_chantier_de_construction                 bat_j_collecteur
bat_j_complexe_de_defense                      bat_j_depot_de_vehicules
bat_j_qg_de_defense     bat_j_raffinerie
bat_o_etai              bat_o_gangue           bat_o_noeud
bat_o_souche            bat_o_terril
```

---

## 7. Ce qui n'a pas été touché, et l'invariant qui le dit

> **`art/sources/` n'est jamais amputé. Aucun fichier, aucune série.**

**143 fichiers à l'ouverture, 143 à la fermeture.** Les sept planches de la V1
(`P6_1…P6_4`, `P7_1…P7_3`) restent au dépôt alors que plus une ligne de code ne
les cite : elles sont la seule trace de ce qui a produit les fichiers effacés.

Non touchés non plus : les `*_detruite_*`, les `P2_*` d'unités, les
`P4.x`/`P5.x`/`P6_artilleries` de défenses. Ils appartiennent à d'autres lots.

---

## 8. Ce qui reste à trancher

1. ⚠ **`bat_j_qg_de_defense` et `bat_j_centre_de_commandement` peuvent être
   inversés.** L'ordre des quatre cellules de
   `P2_chantier_qg_complexe_centre_1024` est lu en Z d'après le nom du fichier,
   ce qui met l'octogone au blason en `qg_de_defense` et le bloc allongé à
   antenne en `centre_de_commandement`. **L'inverse est au moins aussi
   plausible, et ce lot ne tranche pas** : c'est un échange de deux clés dans
   `B`, dix secondes le jour où Ethan regarde les deux sprites côte à côte.
   ⚠ Depuis le lot PREMIÈRE-COUCHE, les deux sont **visibles dans le jeu** — ils
   se regardent sur l'écran Chantier, plus seulement dans un dossier.
2. **L'accent de l'Ouvrage s'effondre** — `bat_o_terril` 0,0 %,
   `bat_o_souche` 0,5 %. Défaut nouveau, connu et accepté par le mémo ; ce n'est
   pas la réduction qui le mange, c'est déjà vrai en 128. Hors périmètre.
3. **Les états de réparation et les ruines** sortent du périmètre. Les planches
   `*_detruite_*` de la V2 sont au dépôt et attendent leur lot — et le jour où
   les bâtiments détruits entreront dans `art/sprites/bâtiment/`, l'assertion
   d'effectif de `tools/atlas.py` sortira en erreur, **ce qui est voulu** : il
   faudra que quelqu'un décide.

---

## 9. Vérifications appareil — NON EXÉCUTÉES

Il n'y a pas d'appareil dans cette session, et un test appareil non exécuté se
déclare non exécuté (CLAUDE.md §3).

| Vérification | État |
|---|---|
| Les seize bâtiments sont-ils reconnaissables à ~42 px sur la grille ? | **NON EXÉCUTÉE** |
| `qg_de_defense` et `centre_de_commandement` sont-ils dans le bon sens (§8.1) ? | **NON EXÉCUTÉE** |
| La V2 se lit-elle mieux que la V1 à l'écran, et pas seulement à la mesure ? | **NON EXÉCUTÉE** |
| Le bavement entre cellules d'atlas, déjà en suspens du lot précédent | **NON EXÉCUTÉE** |
