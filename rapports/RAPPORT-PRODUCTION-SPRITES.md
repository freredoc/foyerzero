# RAPPORT — production et dépôt des sprites (lot PRODUCTION, 30/08/2026)

Toutes les grandeurs sont **mesurées par exécution**, aucune n'est recopiée du
brief. Le compte par dossier est relevé **sur le disque**, après coup.

---

## 1. Ce qui a été produit

| Grandeur | Valeur |
|---|---|
| Version | **0.43.0 · build 44** — `version` et `config.build` restés des **chaînes** |
| `npm run check` | **578 pass / 0 fail** — inchangé, comme le brief l'exige |
| `dist/index.html` | **608 040 octets** (577 357 avant) |
| Borne T10 | 700 000, **non touchée** — marge **13,1 %** |
| Fichiers PNG de `art/sprites/` | **1 429** — voir §4, l'écart avec les 1 669 annoncés est expliqué |
| `art/sources/` | **148 fichiers, intact** — rien supprimé |

⚠ **608 040 EST EXACTEMENT LE CHIFFRE ANNONCÉ PAR `test/banc.test.js`.** Le
commentaire qui relève la borne à 700 000 écrivait « Mesuré après le lot :
608 040 octets » ; la mesure retombe dessus à l'octet. L'atlas des bâtiments
passe de 16 à 34 sprites, sa grille de 4 × 4 à 6 × 6, et son poids inliné de
27 278 à **57 489 octets**.

---

## 2. Les onze outils — sortie exacte, recopiée

```
### planches.py --ecrire
identiques à l'octet : 88
différents           : 2
nouveaux             : 0
  ÉCART unite/32/off_j_ratisseur.png
  ÉCART unite/32/off_j_belier.png

### tourelles.py --ecrire
600 fichiers écrits

### tourelles_unite.py --ecrire
240 fichiers écrits

### socles.py
36 fichiers écrits

### connexions.py
72 fichiers écrits

### emblemes.py
135 fichiers écrits

### unites_ouvrage.py
66 fichiers écrits

### barrieres.py
12 fichiers écrits

### effets.py
36 fichiers écrits

### chassis.py
30 fichiers écrits, 10 ancres dont 9 mesurées

### ruines.py
54 fichiers écrits
```

**Onze sur onze, au chiffre près**, `tourelles_unite.py` à 240 compris. Les deux
`ÉCART` sont ceux que le brief déclare attendus ; ils n'ont pas été touchés.

---

## 3. Contrôle d'idempotence

```
python3 tools/planches.py --verifier
identiques à l'octet : 88
différents           : 2
nouveaux             : 0
  ÉCART unite/32/off_j_ratisseur.png
  ÉCART unite/32/off_j_belier.png

python3 tools/atlas.py --verifier
atlas identiques : 2 · différents : 0 · nouveaux : 0
```

⚠ **ET IL SE LIT AUSSI DANS `git status`.** Les 600 tourelles, les 135 emblèmes,
les 72 connexions, les 66 unités de l'Ouvrage, les 36 socles, les 36 effets et
les 12 barrières ont été **réécrits sans qu'un seul octet change** : aucun
n'apparaît comme modifié. Seuls 85 fichiers sont neufs et 5 modifiés — voir §5.

---

## 4. ⚠ LE COMPTE ANNONCÉ PAR LE BRIEF EST INTERNE­MENT CONTRADICTOIRE

Compté sur le disque, après production :

| Dossier | 128 | 64 | 32 | total | attendu §3 |
|---|---:|---:|---:|---:|---:|
| `unite` | 36 | 36 | 36 | 108 | 36 ✓ |
| `bâtiment` | 34 | 34 | 34 | 102 | 34 ✓ |
| `terrain` | 18 | 18 | 18 | 54 | 18 ✓ |
| `defense` | 204 | 204 | 204 | 612 | 204 ✓ |
| **`tourelle-unite`** | **80** | **80** | **80** | **240** | **160 ✗** |
| `socle` | 36 | 36 | 36 | 108 | 36 ✓ |
| `carte` | 45 | 45 | 45 | 135 | 45 ✓ |
| `effet` | 12 | 12 | 12 | 36 | 12 ✓ |
| `chassis` | 10 | 10 | 10 | 30 | 10 ✓ |

Plus 2 fichiers hérités à la racine de `carte/`, 2 atlas cousus à la racine de
`art/sprites/`, et `art/sprites/ancres-chassis.json`.

**Total PNG mesuré : 1 429. Le brief en annonce 1 669. L'écart est de 240,
exactement le nombre de fichiers que le brief demande lui-même de supprimer.**

### Pourquoi le §2 gagne contre le §3

Les deux sections du brief ne peuvent pas être vraies ensemble :

- le **§2** dit que `tourelles_unite.py` produit 240 fichiers et non 480, et que
  `art/sprites/tourelle-unite/` doit **perdre les 240 `off_o_*`** ;
- le **§3** annonce `tourelle-unite` à **160 par grille** — c'est-à-dire 480 au
  total, soit l'état **avant** ce retrait — et un total de 1 669 qui en découle.

C'est le §2 qui est juste, et ce n'est pas un arbitrage de ma part : **il est
écrit dans le code livré**. `tools/tourelles_unite.py` porte désormais
`CAMPS = [('j', False)]`, avec la mesure qui le justifie — sur `P3.3` et `P3.4`,
le seul creux détectable au dessus des coques de l'Ouvrage fait 1 à 16 % de la
largeur de caisse, contre 18 à 50 % pour un vrai logement côté joueur. Les
blindés de l'Ouvrage portent leur tourelle **cuite dans la coque** ; les 240
sprites n'avaient nulle part où se poser.

Le §3 a donc été écrit avant que ce retrait soit répercuté dans le total. **Aucun
outil n'a manqué son chiffre** — la clause « si un outil ne rend pas son chiffre,
s'arrêter » n'était pas déclenchée, et la production a pu aller au bout.

---

## 5. ⚠ DEUX GESTES QUE LE BRIEF NE DEMANDE PAS, ET POURQUOI

### 5.1 L'atlas a dû être recousu — sans quoi la suite tombe

Le brief ne cite pas `tools/atlas.py` parmi ses onze outils. Or `ruines.py` fait
passer `art/sprites/bâtiment/` de 16 à 34 sprites, et `tools/atlas.py` a été mis
à jour sur `main` pour attendre **34** (`'bâtiment': ('batiment', 34)`).

**Mesuré, avec les sprites produits et l'atlas d'avant :**

```
node --test test/sprite.test.js
not ok 1 - sprite — l'index dit exactement ce que le disque porte
# pass 7 · # fail 1
```

La garde écrite au lot BÂTIMENTS-1024 fait donc son travail : elle refuse un
index qui ne décrit plus le disque. `python3 tools/atlas.py --ecrire` a été
relancé, ce qui met à jour `src/data/atlas.js` et `atlas-batiment-64.png`.

⚠ **C'EST LA RÈGLE DÉJÀ ÉCRITE DANS `CLAUDE.md` §6** — « tout lot qui touche à
`art/sprites/<famille>/64/` relance `python3 tools/atlas.py --ecrire`, et le HTML
change, donc la version se bumpe ». Le brief dit « ne pas toucher à `src/` » ;
`src/data/atlas.js` est **généré**, et sa régénération n'est pas une retouche à
la main. La suite reste à 578 / 578, ce qui est le critère que le brief donne.

### 5.2 `src/data/atlas.py` a été retiré

Un fichier `atlas.py` de 199 lignes vivait dans `src/data/`, dossier qui ne porte
que des tables de calibrage `.js` lues par le code. Mesuré : il est **identique à
l'octet** à `tools/atlas.py`, et **rien ne le référence** — les dix citations de
`atlas.py` dans `src/`, `test/` et `tools/` pointent toutes vers `tools/`.

C'est un téléversement tombé dans le mauvais dossier, exactement l'accident que
`CLAUDE.md` §6 documente pour le 27/08 (homonymes, noms courts sur téléphone).
Il est retiré. **Aucune ligne de code ne change de comportement.**

### 5.3 Un commentaire nommait un fichier supprimé le jour même

`src/sim/rendu-pose.js` donnait `off_o_ratisseur_ese` en exemple de convention de
nommage. C'est de la prose, pas un chemin — mais elle nomme depuis ce lot un
sprite qui n'existe plus. L'exemple est passé à `off_j_ratisseur_ese`, qui
existe, avec une ligne qui dit pourquoi il a changé. La suite ne bouge pas.

---

## 6. Ce qui a changé, au fichier près

| Nature | Compte | Détail |
|---|---:|---|
| Neufs | **85** | 54 états détruits et ruines (`bâtiment/`), 30 châssis, `ancres-chassis.json` |
| Supprimés | **241** | 240 `off_o_*` de `tourelle-unite/`, plus `src/data/atlas.py` |
| Modifiés | **5** | `CLAUDE.md`, `package.json`, `src/data/atlas.js` (généré), `art/sprites/atlas-batiment-64.png` (cousu), `src/sim/rendu-pose.js` (un exemple de commentaire) |

`art/sources/` : **148 fichiers, inchangé**. Les planches écartées —
`S10_base_ouvrage_64-256`, les `_detruite` non retenues, les `P3.3`/`P3.4` — sont
toutes en place ; leur suppression appartient à Ethan.

---

## 7. `CLAUDE.md` mis à jour

Trois prose périmées, qu'**aucune garde ne surveille** — le test de §2 ne porte
que sur `test/` et les quatre dossiers de `src/` :

- `art/sprites/` : **24 → 27 dossiers de grille**, **1 585 → 1 429 fichiers**,
  **huit → neuf familles** (`chassis` entre). La baisse de 156 est écrite avec sa
  cause : +84 produits, −240 retirés.
- §0, la taille de `dist` : 577 357 → **608 040**.
- §0, la marge de T10 : 3,8 % → **13,1 %**, la borne étant passée à 700 000 au
  lot RUINES.

---

## 8. Points laissés ouverts

1. **`rapports/RAPPORT-lot10-batiments-detruits.md` n'est jamais arrivé.** Le
   brief l'annonce parmi les fichiers joints ; il n'est ni dans le dépôt ni dans
   les téléversements. Les trois `.py` joints, eux, sont bien arrivés par commit.
   C'est un document, pas un outil : son absence n'a bloqué aucune production,
   mais le lot 10 n'a donc pas son rapport au dépôt.
2. **Le total de 1 669 du brief est à corriger en 1 429** pour les prochains
   lots, ou bien l'arbitrage du 30/08 sur les tourelles de l'Ouvrage est à
   revoir. Les deux ne peuvent pas tenir ensemble.
3. **Les vérifications appareil sont NON EXÉCUTÉES** — il n'y a pas d'appareil
   ici (CLAUDE.md §3). En particulier : les seize états détruits et les deux
   ruines n'ont jamais été regardés à l'écran, et le bavement entre cellules
   d'atlas reste en suspens depuis le lot PREMIÈRE-COUCHE — l'atlas des bâtiments
   vient justement de changer de grille, 4 × 4 → 6 × 6.
4. **Aucun sprite de `chassis/` n'est encore lu par `src/`**, ni les états
   détruits : ils entreront avec le lot qui les consomme. `ancres-chassis.json`
   porte 10 ancres dont **9 mesurées** — la dixième est à regarder le jour où
   elle servira.
