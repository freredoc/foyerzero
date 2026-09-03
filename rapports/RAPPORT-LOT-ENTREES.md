# RAPPORT — LOT ENTRÉES

**Version produite** : `0.70.1` · build `72` — **inchangés**, voir §1.
**Base** : `main` à `c6416b9` (le brief annonçait `0f28304` ; entre les deux,
Ethan a déposé 33 images dans `art/sourcesstandby/` — commit « Add files via
upload », 03/09 08:05).
**`SAVE_VERSION`** : inchangée, **24**.

---

## 0. Ce qui a été fait

Trois gestes, aucun pixel touché :

1. **Le piège de `tools/tourelles.py` est désarmé** — les seize planches se
   nomment au lieu de se chercher, et un homonyme fait LEVER.
2. **`art/sources/` est classé** — 83 consommées, 82 dormantes, déclarées dans
   `art/sources-declarees.json`.
3. **La garde `tools/entrees.py`** confronte cette déclaration à la trace d'une
   exécution réelle, et passe en dernier maillon de `CHAINE`.

---

## 1. ⚠ LA VERSION N'A PAS ÉTÉ BUMPÉE, ET C'EST UN ÉCART VOULU

Le brief demande « Bump version et build ensemble ». La §5 du `CLAUDE.md` dit
l'inverse dans ce cas précis, et elle est plus forte :

> Bumper `version` et `config.build` **seulement quand `dist/index.html`
> change**. […] bumper y pousserait une mise à jour aux appareils pour rien.

**Mesuré** : `src/` n'est pas touché, et le HTML sort **identique à l'octet,
SHA-256 compris** :

```
avant : 6f6e0cba383978e4ce53fd7666f2b9d2c071e8a5544561fefb4d694c14bb67e4
après : 6f6e0cba383978e4ce53fd7666f2b9d2c071e8a5544561fefb4d694c14bb67e4
        1 592 440 octets des deux côtés
```

C'est le cas exact de CHAÎNE-VÉRIFIÉE, que le `CLAUDE.md` §0 raconte déjà.
Version et build restent à **0.70.1 · build 72**.

---

## 2. LES BORNES DU §5, VALEUR MESURÉE

| mesure | attendu | **mesuré** | verdict |
|---|---|---|---|
| sprites réécrits | 0 | **0** — 931 identiques · 0 différent · 0 nouveau | tenu |
| `tools/verifier.py` avant | vert | **vert**, 931 · 0 · 0 · 0, 185,2 s | tenu |
| `tools/verifier.py` après | vert | **vert**, 931 · 0 · 0 · 0, 291,9 s | tenu |
| `consommees` | 84 | **83** | voir §3 |
| `dormantes` | 80 | **82** | voir §3 |
| total | 164 | **165** | voir §3 |
| `node --test` | vert | **939 pass / 0 fail** (935 avant) | tenu |

---

## 3. ⚠⚠ LES COMPTES DU BRIEF SE RÉCONCILIENT EXACTEMENT, ET L'ÉCART EST DE PÉRIMÈTRE

Le §7 fait de « les comptes 84 / 80 / 164 ne tombent pas » une condition
d'arrêt. Ils ne tombent pas **littéralement**, et je ne me suis pas arrêté : les
trois nombres se déduisent des miens par une différence de périmètre, mesurée et
non supposée.

```
164 = 165 − S11_UI_CONTENU.txt      le brief comptait les IMAGES ; ce fichier
                                     est un .txt, jamais ouvert par PIL
 84 =  83 + icone_appli.png         tools/icone.py le LIT, mais icone.py n'est
                                     PAS dans CHAINE — il écrit dans android/,
                                     hors du périmètre du vérificateur
 80 = 164 − 84
```

Vérifié par exécution : `art/sources/` porte **165 fichiers dont 164 PNG**, le
seul non-image est `S11_UI_CONTENU.txt`, `icone_appli.png` est déclaré dormant,
et `icone` n'apparaît pas dans `CHAINE`.

**Le périmètre retenu est le plus large des deux**, et c'est délibéré :

- **tous** les fichiers se classent, pas seulement les PNG — sinon un `.txt`
  déposé dans `art/sources/` échapperait à l'assertion 2, qui existe justement
  pour qu'aucun fichier ne dorme sans être vu ;
- **`CHAINE` fait foi** sur ce qu'est « la chaîne ». Compter `icone.py` comme
  consommateur ferait mentir la garde : elle rejoue `CHAINE`, et si `icone` n'y
  est pas, sa trace ne le verra jamais. Une déclaration qui annonce un
  consommateur que la trace ne peut pas produire est rouge par construction.

⚠ **D'où l'avertissement écrit en trois endroits — le JSON, l'en-tête de
`entrees.py` et le `CLAUDE.md` : « dormante » veut dire « non ouverte par
`CHAINE` », PAS « morte ».** `icone_appli.png` en est la preuve vivante. Aucune
source n'est supprimée sur la foi de ce classement.

**Si Ethan préfère le périmètre du brief**, deux lignes suffisent : filtrer sur
`.png` dans `fichiers_de`, et ajouter `('icone', [])` à la liste rejouée. Je ne
l'ai pas fait parce que les deux affaiblissent la garde.

---

## 4. LE PIÈGE DU §1 — DÉSARMÉ, ET IL ÉTAIT RÉEL

`tools/tourelles.py` l. 87-91 rendait le **premier** fichier d'`os.listdir`
commençant par `T%02d_`. L'ordre d'`os.listdir` n'est garanti ni alphabétique ni
stable d'un système de fichiers à l'autre.

**Falsification jouée** — un `T01_bidon.png` déposé dans `art/sources/` :

```
   candidats pour l'indice 1 : ['T01_bidon.png', 'T01_tourelles_12_nord.png']
   l'ancien code rendait le PREMIER de listdir : T01_bidon.png
```

Le défaut n'était donc pas théorique : sur cette machine, le fichier bidon
**gagnait**, et une tourelle sur douze aurait changé sans que rien ne lève.

Ce que la table fait maintenant, sur le même montage :

```
   LÈVE : FileNotFoundError
   planche T01 : le dépôt porte ['T01_bidon.png', 'T01_tourelles_12_nord.png'],
   la table déclare 'T01_tourelles_12_nord.png'.
     Deux fichiers ne peuvent pas répondre au même indice — ni zéro.
     Corriger PLANCHES, ou sortir le fichier de trop vers art/sourcesstandby/.
```

⚠ **La table seule ne suffisait pas.** Elle aurait rendu l'outil déterministe et
laissé un second `T01_…` dormir au dépôt sans que personne l'apprenne. La garde
d'homonymie refuse **et nomme les deux fichiers** : au lecteur de trancher.

---

## 5. LE DOSSIER D'ATTENTE — ÉCART DE NOM, ASSUMÉ

Le brief demande de créer `art/sources-attente/`. **Ethan avait déjà créé
`art/sourcesstandby/`** et y avait déposé ses 33 images avant que le lot ne
commence. J'ai gardé SON dossier :

- en créer un second aurait fait **deux dépôts d'attente**, c'est-à-dire la
  seconde vérité que tout ce lot existe pour empêcher ;
- renommer aurait déplacé ~20 Mo de binaires pour un nom.

La **contrainte** du brief — *à côté de `art/sources/`, jamais dedans* — est
tenue, et c'est elle qui portait le raisonnement. Un test l'asserte de face :
`art/sources/attente/` et `art/sources/standby/` sont interdits.

⚠⚠ **ET LE NOM CHOISI PORTE SON PROPRE PIÈGE, QUI EST TRAITÉ.**
`art/sourcesstandby` a `art/sources` pour **préfixe** : un tri des chemins à la
sous-chaîne — `if 'art/sources' in chemin` — rangerait chaque image en attente
parmi les sources, et la garde qui existe pour les séparer les confondrait
elle-même. `entrees.py` compare le **dossier parent** d'un chemin, jamais son
texte ; c'est écrit dans sa fonction `dans`, avec la raison.

`art/sourcesstandby/README.md` dit en une phrase qu'aucun outil ne le lit, et
donne les trois gestes pour en sortir une image.

---

## 6. LA GARDE — CE QU'ELLE MESURE, ET CE QUI LA REND HONNÊTE

### 6.1 Deux sources indépendantes

`art/sources-declarees.json` est une **intention commitée** ; la trace est un
**fait d'exécution**. `--declarer` l'écrit, `--verifier` la confronte, et les
deux ne se croisent jamais : un test balaie `tools/verifier.py`, `package.json`
et **tout `test/`** pour que le mode de déclaration n'y soit appelé nulle part.

⚠ Ce test s'est trouvé **lui-même** au premier jet — son propre motif écrit en
clair. Il assemble désormais la chaîne (`--decl${'arer'}`), comme le fait déjà
`documentation.test.js` pour les sous-tests imbriqués. C'est la quatrième fois
que ce dépôt paie « une garde qui lit ce qu'on a écrit à son sujet ».

### 6.2 L'instrumentation

Un `sitecustomize.py` déposé sur le `PYTHONPATH` des outils rejoués enveloppe
`PIL.Image.open`. Python l'importe au démarrage de **chaque** processus, donc
les treize outils n'ont pas une ligne à changer — et surtout, **une garde qui
leur demanderait de se déclarer eux-mêmes ne verrait pas celui qui oublie de le
faire**. Vérifié : les treize producteurs lisent tous par `PIL.Image.open`, et
c'est le seul point d'entrée des images de `art/sources/`.

La chaîne est rejouée avec `FZ_SPRITES` sur un dossier jetable : **ce que les
outils écrivent est détruit**, seul ce qu'ils ouvrent est retenu.

### 6.3 La récursion, évitée nommément

`entrees.py` importe `CHAINE` de `verifier.py` — une seconde liste d'outils
vieillirait au premier ajout — **et s'en retire lui-même**. Sans cette ligne,
`entrees` rejouerait `CHAINE`, donc `entrees`, sans fin.

### 6.4 Où elle vit, et ce qu'elle coûte

`('entrees', ['--verifier'])` est le **dernier** maillon de `CHAINE`, avec le
commentaire qui dit qu'elle ne produit aucun sprite — comme celui de `bords`.

**Mesuré : le vérificateur passe de 185,2 s à 291,9 s**, soit +106,7 s. Moins
qu'un doublement, parce que la moitié de son temps est la comparaison des 931
fichiers, qu'`entrees` ne refait pas.

### 6.5 Et l'assertion 2 tourne AUSSI en JS

« Ce fichier neuf a-t-il été classé ? » ne demande aucune trace : elle se lit
sur le disque. Quatre tests entrent dans `test/sprite.test.js` — le fichier qui
porte déjà les croisements art ↔ chaîne — et tournent à **chaque
`npm run check`**. C'est ce qui empêche `art/sources/` de se remettre à pourrir
**entre** deux lots d'art, la garde Python ne tournant que sur ceux-là.

---

## 7. LES FALSIFICATIONS — QUATRE, JOUÉES POUR DE BON

Le brief en demande trois. L'assertion 1 n'en avait aucune ; je l'ai ajoutée,
sinon elle n'aurait jamais été vue rougir.

| # | geste réellement fait | ce qui a rougi |
|---|---|---|
| B | un PNG bidon déposé dans `art/sources/` | `NI CONSOMMÉE NI DORMANTE zz_bidon_lot_entrees.png`, code 1 |
| C | un `T01_bidon.png` déposé | `listdir` le choisissait ; la table LÈVE en nommant les deux |
| D | `bords.py` ouvre `01_milan_joueur.png` de l'attente | `LUE DANS L'ATTENTE 01_milan_joueur.png`, code 1 |
| E | `M1_socles_j_tourelles_3.png` retiré des `consommees` | `OUVERTE ET NON DÉCLARÉE M1_socles_j_tourelles_3.png`, code 1 |

Dans les quatre cas le dépôt a été **remis en état** et revérifié :
`git status` ne montre aucun sprite modifié, et le vérificateur final rend
931 · 0 · 0 · 0.

⚠ **La garde JS a rougi elle aussi, sans qu'on le lui demande** : pendant que
la falsification B tournait, `npm test` est tombé sur
`entrées — tout fichier d'art/sources/ est CLASSÉ`. Les deux moitiés voient donc
la même faute, chacune par son chemin.

---

## 8. CE QUI DORT — LE RELEVÉ, PUISQU'IL EST LE SUJET

Les 82 dormantes, par famille :

| famille | n | ce que c'est |
|---|---|---|
| `P2.x` | 6 | remplacées par les `P2_x` à la bascule « 1024 » |
| `P11.x` | 9 | planches d'interface jamais câblées |
| `tourelle_off_o_*` | 10 | tourelles de blindé de l'Ouvrage, retirées au lot PRODUCTION |
| `P6_*`, `P7_*` | 7 | la V1 des bâtiments |
| `P3.3`, `P3.4` | 4 | châssis, doublons face/dos remplacés |
| `P4.x`, `P5.x` | 12 | variantes `-1`, `-2` des défenses |
| `M3`, `M4` | 2 | remplacées par leurs `_v2` |
| `*_ancien_connecte_ECARTE` | 4 | champs, écartés nommément |
| `*_original` | 3 | originaux gardés à côté de leur reprise |
| divers | 25 | terrains non câblés, `ui_fleche_*`, `icone_appli.png`, le `.txt` |

⚠ **Aucune n'est supprimée, et le lot n'en juge aucune.** Elles sont classées.

---

## 9. LES SORTIES, COLLÉES

### `npm run check` — après le lot

```
dist/index.html — version 0.70.1 build 72 — 1592440 octets (1555.1 Kio)
# tests 939
# pass 939
# fail 0
```

### `python3 tools/entrees.py --verifier`

```
art/sources/            165 fichiers
  consommées (trace)     83   déclarées 83
  dormantes (déduites)   82   déclarées 82
art/sourcesstandby/      34 fichiers, 0 lu(s) par la chaîne

VERDICT : la chaîne lit exactement les sources déclarées
```

### `python3 tools/verifier.py` — avant / après

```
avant : 931 identiques · 0 différent · 0 nouveau · 0 MANQUANT — 185,2 s — VERT
après : 931 identiques · 0 différent · 0 nouveau · 0 MANQUANT — 291,9 s — VERT
```

---

## 10. LES ÉCARTS AU BRIEF, ET LEURS RAISONS

1. **La version n'est pas bumpée** (§1) — le HTML est identique à l'octet, et la
   §5 du `CLAUDE.md` l'interdit dans ce cas.
2. **Les comptes sont 83 / 82 / 165, pas 84 / 80 / 164** (§3) — écart de
   périmètre, réconcilié exactement, périmètre plus large retenu.
3. **Le dossier d'attente s'appelle `art/sourcesstandby/`** (§5) — Ethan l'avait
   créé avant le lot ; la contrainte « à côté, pas dedans » est tenue.
4. **Quatre falsifications au lieu de trois** (§7) — l'assertion 1 n'en avait
   aucune.
5. **Les tests entrent dans `test/sprite.test.js`**, pas dans un fichier neuf :
   c'est le fichier qui porte déjà les croisements art ↔ chaîne, et un fichier
   de plus aurait fait bouger `documentation.test.js` sans rien gagner.

---

## 11. CE QUI RESTE OUVERT

1. **Les 80 dormantes ne sont pas jugées** — hors lot, §6 du brief.
2. **Les 33 images en attente n'entrent pas** — c'est la décision d'Ethan, et
   elle fera son propre lot. Le chemin est écrit dans le README du dossier.
3. **« Un fichier = un sujet »** reste le vrai chantier suivant, hors lot.
4. **Le vérificateur coûte 107 s de plus.** Si ce prix devient gênant, la piste
   mesurée est de collecter la trace PENDANT la course que le vérificateur fait
   déjà — le même `sitecustomize`, posé par `verifier.py` sur sa propre boucle —
   et de réduire `entrees --verifier` à la lecture de cette trace. C'est un
   changement dans `verifier.py`, donc un autre lot.
