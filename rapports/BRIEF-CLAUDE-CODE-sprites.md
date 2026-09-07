# BRIEF — produire et commiter les 1 669 sprites

**Dépôt** `freredoc/chantier`, branche `main`.
**Modèle et effort** — Sonnet 5, effort normal. Toutes les décisions sont prises
et écrites dans les outils ; aucun jugement esthétique n'est demandé.
**Fichiers joints** — à déposer à leur place avant de commencer :
`tools/ruines.py` et `tools/chassis.py` (nouveaux), `tools/tourelles_unite.py`,
`tools/atlas.py`, `test/banc.test.js` et `src/data/atlas.js` (ceux-là REMPLACENT
l'existant), et `rapports/RAPPORT-lot10-batiments-detruits.md`.

⚠ `src/data/atlas.js` est un fichier GÉNÉRÉ. Il est joint pour que le dépôt soit
cohérent dès le dépôt, mais `tools/atlas.py --ecrire` le réécrira à l'identique
— c'est le contrôle du §3.

---

## 1. Environnement

`numpy`, `Pillow` et `scipy`. S'ils manquent : `pip install numpy pillow scipy`.
**Ne pas contourner une dépendance en réécrivant du code** — la fidélité à
l'octet de 88 fichiers déjà commités dépend de ce code précis.

## 2. Lancer les douze outils, dans cet ordre

```
python3 tools/planches.py        --ecrire
python3 tools/tourelles.py       --ecrire
python3 tools/tourelles_unite.py --ecrire
python3 tools/socles.py
python3 tools/connexions.py
python3 tools/emblemes.py
python3 tools/unites_ouvrage.py
python3 tools/barrieres.py
python3 tools/effets.py
python3 tools/chassis.py
python3 tools/ruines.py
python3 tools/atlas.py --ecrire
```

Sorties attendues, exactement :

| Outil | Sortie |
|---|---|
| `planches.py` | `88 identiques · 2 différents · 0 nouveau` puis deux `ÉCART` |
| `tourelles.py` | `600 fichiers écrits` |
| `tourelles_unite.py` | **`240 fichiers écrits`** — il ne produit plus l'Ouvrage |
| `socles.py` | `36` |
| `connexions.py` | `72` |
| `emblemes.py` | `135` |
| `unites_ouvrage.py` | `66` |
| `barrieres.py` | `12` |
| `effets.py` | `36` |
| `chassis.py` | `30 fichiers écrits, 10 ancres dont 9 mesurées` |
| `ruines.py` | `54 fichiers écrits` |
| `atlas.py --ecrire` | `atlas identiques : 2 · différents : 0 · nouveaux : 0` |

**Les deux `ÉCART` sont attendus** : `unite/32/off_j_ratisseur.png` et
`unite/32/off_j_belier.png`. L'outil refuse d'écraser deux fichiers dont il ne
sait pas reproduire la provenance. Ne pas chercher à les corriger.

⚠ **`tourelles_unite.py` produit 240 fichiers, pas 480.** Le camp Ouvrage a été
retiré le 30/08 : ses blindés portent une tourelle cuite dans la coque. Le
dossier `art/sprites/tourelle-unite/` doit donc **perdre 240 fichiers** — les
`off_o_*`. Les supprimer fait partie du lot.

## 3. Contrôler avant de commiter

```
python3 tools/planches.py --verifier
python3 tools/atlas.py --verifier
find art/sprites -name '*.png' | wc -l
npm ci && npm run check
```

Attendu : `88 identiques · 2 différents · 0 nouveau` pour `planches.py`,
`atlas identiques : 2 · différents : 0 · nouveaux : 0` pour `atlas.py`,
**1 669** fichiers, et la suite à **578 / 578**.

⚠ **`atlas.py` fait partie de la chaîne et doit tourner APRÈS `ruines.py`.**
L'atlas de bâtiment passe de 16 à 34 sprites ; sans cette passe, `atlas.py
--verifier` sort en échec et `test/sprite.test.js` rougit. La borne de taille de
`test/banc.test.js` est relevée de 600 000 à 700 000 octets dans le même lot,
`dist/index.html` passant de 530 268 à 608 040.

| Dossier | 128 | 64 | 32 |
|---|---:|---:|---:|
| `unite` | 36 | 36 | 36 |
| `bâtiment` | **34** | **34** | **34** |
| `terrain` | 18 | 18 | 18 |
| `defense` | 204 | 204 | 204 |
| `tourelle-unite` | **160** | **160** | **160** |
| `socle` | 36 | 36 | 36 |
| `carte` | 45 | 45 | 45 |
| `effet` | 12 | 12 | 12 |
| `chassis` | **10** | **10** | **10** |

Plus 2 fichiers hérités à la racine de `art/sprites/carte/`, et
**`art/sprites/ancres-chassis.json`**, produit par `chassis.py`.

## 4. Ouvrir la PR — **ne pas merger**

Le merge appartient à Ethan seul. Si le MCP GitHub est indisponible, pousser la
branche et donner l'URL de comparaison.

---

## Ce qu'il ne faut PAS faire

- **Ne réécrire aucun fichier de `tools/`.** Plusieurs constantes y sont des
  mesures, pas des choix : le remplissage à 45 %, les quatre décalages de
  logement, l'ordre des seize orientations, les coupes par gouttière, les ancres
  de châssis. Les changer change les sprites.
- **Ne pas toucher à `src/` ni à `test/`.** Si la suite bouge, quelque chose a
  été touché par erreur.
- **Ne pas corriger les deux `ÉCART`.**
- **Ne pas supprimer** les planches sources écartées — `S10_base_ouvrage_64-256`,
  les `_detruite` non retenues, les `P3.3`/`P3.4`. Elles sont hors production
  mais leur suppression appartient à Ethan.

## Rapport attendu

`rapports/RAPPORT-PRODUCTION-SPRITES.md`, présenté en fin de session : sortie
exacte des douze outils recopiée, contrôle d'idempotence, nombre de fichiers par
dossier **compté sur le disque**, résultat de `npm run check` mesuré, tout écart
entre l'attendu et le constaté avec sa cause, points laissés ouverts.

## Si ça diverge

Si un outil ne rend pas son chiffre, **s'arrêter et le dire au lieu de
commiter**. Un écart signifie qu'une planche source a bougé, et il faut savoir
laquelle avant de produire quoi que ce soit.
