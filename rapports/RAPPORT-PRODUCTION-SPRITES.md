# RAPPORT — production et dépôt des 1 469 sprites

**Lot** PRODUCTION-SPRITES · **Date** 30/08/2026 · **Branche** `claude/sprite-9j4llk`
**Dépôt** `freredoc/foyerzero` (codename *Chantier*)

Lot d'ASSETS : aucun fichier de `src/`, de `test/` ni de `tools/` n'a été touché.
`git status` sur ces trois dossiers est resté vide de bout en bout.

---

## 0. Environnement

`numpy`, `Pillow` et `scipy` étaient absents de l'image ; installés par
`pip install numpy pillow scipy` avant toute exécution.

```
numpy 2.4.6 · pillow 12.3.0 · scipy 1.17.1
```

**Aucune dépendance n'a été contournée par réécriture de code.** Les dix
fichiers de `tools/` sont intacts à l'octet.

**Base de départ, mesurée avant de produire quoi que ce soit** —
`npm ci && npm run check` : **548 pass / 0 fail**. C'est le chiffre de
référence de `CLAUDE.md` §0. La base était donc verte.

---

## 1. Sortie exacte des six outils

Recopiée telle qu'elle est sortie.

### `python3 tools/planches.py --ecrire`

```
identiques à l'octet : 88
différents           : 2
nouveaux             : 0
  ÉCART unite/32/off_j_ratisseur.png
  ÉCART unite/32/off_j_belier.png
```

### `python3 tools/tourelles.py --ecrire`

```
600 fichiers écrits
```

### `python3 tools/tourelles_unite.py --ecrire`

```
480 fichiers écrits
```

### `python3 tools/socles.py`

```
36 fichiers écrits
```

### `python3 tools/connexions.py`

```
72 fichiers écrits
```

### `python3 tools/emblemes.py`

```
135 fichiers écrits
```

Cinq outils sur six rendent EXACTEMENT le chiffre annoncé par le brief. Le
sixième — `planches.py` — diverge, et la cause est établie en §4.

---

## 2. Contrôle d'idempotence

`python3 tools/planches.py --verifier`, après production :

```
identiques à l'octet : 88
différents           : 2
nouveaux             : 0
  ÉCART unite/32/off_j_ratisseur.png
  ÉCART unite/32/off_j_belier.png
```

**`nouveaux 0`** : rien ne reste à produire, la chaîne est idempotente.

Les deux `ÉCART` sont ceux que le brief annonce, aux mêmes deux noms. Ils n'ont
**pas** été corrigés : `planches.py` refuse d'écraser un fichier dont il ne sait
pas reproduire la provenance, et le fichier commité fait foi. C'est le
comportement voulu.

Le même contrôle a été lancé AVANT de rien écrire, et rendait déjà `88 / 2 / 0`
— voir §4.

---

## 3. Comptage sur le disque

Compté par `find` et `ls` sur l'arborescence réelle, pas estimé.

| Dossier | 128 | 64 | 32 | attendu |
|---|---:|---:|---:|---|
| `unite` | 14 | 14 | 14 | conforme |
| `bâtiment` | 16 | 16 | 16 | conforme |
| `terrain` | 18 | 18 | 18 | conforme |
| `defense` | 200 | 200 | 200 | conforme |
| `tourelle-unite` | 160 | 160 | 160 | conforme |
| `socle` | 36 | 36 | 36 | conforme |
| `carte` | 45 | 45 | 45 | conforme |

Plus les **2** fichiers déjà présents à la racine de `art/sprites/carte/` —
`atlas-terrain-64.png` et `controle-pavage.png`, ni l'un ni l'autre touché.

```
find art/sprites -name '*.png' | wc -l   →   1469
```

**1 469 fichiers**, le chiffre du brief, à l'unité.

Le dossier `socle` reçoit ses 36 fichiers par grille de DEUX outils :
12 de `socles.py` et 24 de `connexions.py` (36 + 72 = 108 = 36 × 3).

### Poids

`art/sprites` pèse **3 165 980 octets** au total. Par famille et par grille :

| Dossier | 128 | 64 | 32 |
|---|---:|---:|---:|
| `unite` | 80 K | 60 K | 60 K |
| `bâtiment` | 108 K | 68 K | 68 K |
| `terrain` | 76 K | 76 K | 76 K |
| `defense` | 936 K | 812 K | 812 K |
| `tourelle-unite` | 908 K | 652 K | 652 K |
| `socle` | 292 K | 148 K | 148 K |
| `carte` | 412 K | 184 K | 184 K |

**Aucun de ces octets n'entre dans le livrable aujourd'hui.** `tools/build.js`
n'inline qu'UN seul chemin d'image, écrit en dur —
`art/sprites/carte/atlas-terrain-64.png` — et ce fichier n'a pas bougé. Vérifié :
`dist/index.html` fait **530 268 octets**, exactement le chiffre de référence de
`CLAUDE.md` §0, inchangé.

---

## 4. Écarts entre l'attendu du brief et le constaté

### 4.1 `planches.py` rend `88 / 2 / 0` au lieu de `56 / 2 / 86`

**Cause : le lot 0 était déjà commité SUR `main` avant le début de cette
session.** Le commit `0da97e0` « lot 0 — les trois grilles de l'existant » et les
téléversements qui l'ont suivi sont dans `origin/main` (`cde179f`), qui porte
déjà :

- les trois grilles `unite/{128,64,32}` et `bâtiment/{128,64,32}` — 90 fichiers ;
- le terrain rangé sous `terrain/{128,64,32}` au lieu de la racine à plat ;
- `bat_j_depot_de_vehicules.png` à la place de `bat_j_usine.png`.

`planches.py` ne voit donc plus rien de neuf à produire, et sa branche « terrain
à plat » ne se déclenche pas — elle est gardée par
`not os.path.isdir(.../terrain/128)`, qui est faux depuis le lot 0.

Le brief a été écrit contre un dépôt d'avant ce commit. **L'étape 2 a donc rendu
d'emblée le résultat que l'étape 3 attendait**, ce qui est le même fait vu deux
fois, pas une anomalie. Le contrôle d'idempotence de §2 tient, et c'est lui qui
compte.

Vérifié explicitement : un `--verifier` lancé AVANT toute écriture rendait déjà
`88 / 2 / 0` avec les deux mêmes `ÉCART`. Aucune planche source n'a bougé.

### 4.2 Le diff ne porte aucune suppression, là où le brief en annonce 20

Même cause. Les 18 tuiles de terrain qui quittent la racine et les 2
`bat_j_usine.png` remplacés ont été **déplacés et supprimés avant cette session,
et `main` les porte déjà**. Ils ne sont donc ni dans mon commit ni dans la PR :
il n'y a plus rien à supprimer.

⚠ **Une première rédaction de ce paragraphe affirmait l'inverse** — « ils sont
bien absents de `main`, donc la PR les portera ». C'était faux, et la faute
mérite d'être écrite parce qu'elle se refera : la référence LOCALE `main` de
l'image de travail datait d'avant le lot 0, si bien que `git log main..HEAD`
listait cinquante commits qui sont en réalité tous mergés. **Un `main` local ne
dit rien tant qu'il n'a pas été fetché** ; c'est `origin/main` qui fait foi, et
il vaut `cde179f`. Corrigé après avoir lu la base réelle de la PR, qui ne compte
qu'UN commit et 1 331 fichiers.

### 4.3 Les deux fichiers joints étaient déjà au dépôt

`tools/emblemes.py` et `RAPPORT-lot6-emblemes.md` avaient déjà été téléversés par
Ethan. L'étape 1 est donc sans objet. `tools/emblemes.py` était **à sa place** ;
le rapport était à la RACINE, et il a été déplacé dans `rapports/` par `git mv`,
qui est la destination que le brief lui donne. Il rejoint les six autres de
l'étape 4 : sept `git mv` en tout, aucun contenu modifié.

### 4.4 Les deux fichiers « à ne pas supprimer » ont déjà été supprimés

`S10_base_ouvrage_64-256.png` et `S10_base_joueur_32-128_comparaison.png` ont été
retirés par Ethan lui-même dans les commits `94f6706` et `e98b3b8`, avant cette
session. **Je n'ai supprimé aucun fichier de `art/sources/`.**

Sans conséquence sur la production : `emblemes.py` lit
`S10_base_ouvrage_64-256_v2.png`, qui est présent, et non la version retirée. Les
135 emblèmes sont sortis sans erreur.

### 4.5 Il y a quinze `art/sources/file_*.png`, pas dix

Le brief en annonce dix, dont neuf à écarter. Le dossier en porte **quinze**.
Sans conséquence : aucun outil n'en lit d'autre que
`file_0000000077f0820a88f6a88415d71d25.png`, la grosse base 3 × 3 déclarée dans
`emblemes.py`. Les quatorze autres n'ont pas été touchés. À signaler parce que le
compte du brief est périmé et qu'une prochaine session pourrait s'y fier.

---

## 5. `npm run check`

Lancé APRÈS production complète des 1 469 fichiers :

```
# tests 548
# suites 0
# pass 548
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 7827.167
```

**548 pass / 0 fail — inchangé, à l'unité, par rapport à la mesure de départ.**
C'est ce qu'on attend d'un lot d'assets : aucun test ne regarde `art/sprites/`,
et `documentation.test.js` ne compte que `test/` et les quatre dossiers de
`src/`.

Le `build` de `npm run check` est passé, donc l'offline tient : le HTML produit ne
référence toujours rien d'extérieur.

---

## 6. Version et build

**Non bumpés, délibérément.** `CLAUDE.md` §5 ne fait bumper `version` et
`config.build` que quand `dist/index.html` change. Il ne change pas ici :
mesuré à **530 268 octets**, identique au chiffre de référence. Bumper
pousserait une mise à jour aux appareils pour un livrable rigoureusement
identique.

---

## 7. Ce que porte le commit

- **UN seul commit**, `8781c76`, sur une base `origin/main` à `cde179f`.
- **1 323 fichiers ajoutés** — les 1 469 du disque moins les 146 déjà commités.
- **7 renommages** — les six rapports de lot nommés par le brief, plus
  `RAPPORT-lot6-emblemes.md`, de la racine vers `rapports/`.
- **0 modification**, **0 suppression**.

`rapports/` passe de 19 à 26 fichiers, plus ce rapport-ci.

---

## 8. Points laissés ouverts

1. **Les deux `ÉCART` demeurent.** `unite/32/off_j_ratisseur.png` et
   `unite/32/off_j_belier.png` ne se reproduisent pas depuis la chaîne. Le brief
   interdit d'y toucher et le garde-fou de `planches.py` refuse de les écraser :
   les fichiers commités font foi. Leur provenance reste à retrouver le jour où
   quelqu'un voudra régénérer ces deux-là.

2. **Aucun de ces 1 469 sprites n'entre dans le jeu.** Aucun fichier de `src/`
   ne cite ces chemins ; seul `art/sprites/carte/atlas-terrain-64.png` est lu par
   le build, et il était déjà là. Brancher les sprites dans les écrans est un lot
   à venir, et il posera la question du POIDS : 3,17 Mo de PNG inlinés en base64
   pèseraient environ 4,2 Mo dans le HTML, soit huit fois le livrable actuel et
   sept fois la borne de T10. **Ce lot-là devra choisir ce qui entre**, il ne
   pourra pas tout prendre.

3. **La §2 de `CLAUDE.md` décrit `art/sprites/` comme « NEUF dossiers de grille
   […] 144 fichiers en tout ».** C'est périmé depuis ce lot : vingt et un
   dossiers de grille, 1 469 fichiers. Aucune garde ne compte ce dossier — la
   §2 a déjà menti deux fois pour cette raison exacte. Non corrigé ici parce que
   le brief interdit de toucher à autre chose que les assets et les rapports ;
   **à reprendre dans la prochaine passation.**

4. **Le compte de `file_*.png` du brief est faux de cinq** (§4.5).

5. **Le merge appartient à Ethan.** La PR est ouverte, pas mergée.
