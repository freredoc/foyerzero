# RAPPORT — lot CHAMPS-ET-OBSTACLES

**Date** : 03/09/2026 (soir) · **Version produite** : 0.82.0 · build 84
**Branche** : `claude/sprite-refonte-9il369`

---

## 0. Ce qui a été demandé

Ethan, 03/09 au soir, dix images et trois lignes : « terrain de carte. / fond de
base (supprimer mur) / sprite obstacles et ressources », puis, mis devant le
plan : **« commence par Champ et obstacles »**.

Ce lot ne fait donc que la troisième ligne — les **cinq** planches d'obstacles et
de ressources. Le terrain de carte et le fond de base restent à faire, et leurs
sept planches ne sont pas entrées au dépôt : les faire entrer sans les consommer
les ferait compter « non classées » par la garde du lot ENTRÉES.

---

## 1. Résultat mesuré

| Grandeur | Avant | Après |
|---|---|---|
| `npm test` | 974 pass / 0 fail | **976 pass / 0 fail** |
| `dist/index.html` | 3 347 583 o | **3 361 351 o** (+13 768) |
| `data:` inlinées | 25 | **25** |
| Borne T10 | 3 400 000 | **3 400 000, inchangée** |
| Marge | 52 417 o (1,54 %) | **38 649 o (1,14 %)** |
| `SAVE_VERSION` | 24 | **24, inchangée** |
| `art/sources/` | 174 fichiers | **179** |
| — consommées / dormantes | 95 / 79 | **93 / 86** |

⚠⚠ **LES +13 768 OCTETS SONT L'ATLAS, ET RIEN D'AUTRE — L'ATTRIBUTION EST
EXACTE.** `atlas-terrain-128.webp` passe de 68 476 à 78 802 octets, soit
**+10 326**, qui font **+13 768 en base64** : c'est le nombre entier du
livrable, au dernier octet. Zéro octet de code, zéro octet de feuille.
`atlas-terrain-64.webp` grossit aussi (+2 988) et **ne coûte rien** : la grille
embarquée est la 128 depuis le lot GRILLE-128.

⚠ **AUCUNE IMAGE N'ENTRE** — 25 `data:` avant, 25 après. Ce sont les mêmes
cellules, mieux dessinées, donc moins compressibles. **La borne T10 ne se relève
pas** : la règle §5 veut qu'elle monte quand une RESSOURCE entre, pas quand un
dessin gagne en matière. La marge tombe à **1,14 %**, la plus mince du dépôt
depuis BASES-1, et le prochain lot devra en tenir compte — voir §7.

---

## 2. L'appariement, et pourquoi il ne se devine pas

`tools/terrain.py` porte la seule table du dépôt qui apparie le vocabulaire
d'Ethan — il nomme ce qu'il DESSINE — à celui du jeu, qui nomme ce que le sprite
FAIT. Les cinq dessins tombent exactement sur les cinq entrées existantes :

| Dessin livré | Sprite | Ancienne planche |
|---|---|---|
| cristaux bleu-gris | `champ_quartz` | `champ_quartz_cristaux.png` |
| braises violet sombre à veines orange | `champ_scorie` | `champ_scorie_braises.png` |
| branches mortes enchevêtrées | `obs_infanterie` | `fourre_sec_a`/`_b.png` |
| éboulis de blocs gris | `obs_les_deux` | `chaos_rocheux_a`/`_b.png` |
| nappe de pétrole noire | `obs_vehicule` | `nappe_petrole_a`/`_b.png` |

**Le lot tient donc en cinq lignes de table.** L'outil avait été écrit pour ça au
lot MOULINETTE-TERRAIN : une entrée porte une ou deux planches, et le reste suit.

---

## 3. ⚠⚠ Trois affirmations de l'outil sont devenues fausses le même jour

Elles sont **réécrites**, pas enjambées — un commentaire qui décrit un manque
comblé envoie chercher un travail déjà fait.

### (a) « la clé de ces planches n'est pas pure » → elle l'est

Mesuré sur les cinq neuves : la médiane du pourtour vaut **exactement
`#FF00FF`**, et le magenta pur couvre **49,8 % à 59,5 %** de la planche. Les
sept anciennes n'en portaient **pas un seul pixel** — leur fond allait de
(194, 16, 138) à (236, 11, 143).

⚠⚠ **CONSÉQUENCE : `normaliser_la_cle` EST DEVENUE UNE CEINTURE.** La boule de
`RAYON_CLE = 80` ne prend **pas un seul pixel de dessin** sur les cinq — zéro,
contre **7 155** qu'elle prenait sur l'ancienne planche de quartz. Le geste
reste, parce qu'il ne coûte rien et redeviendra utile à la première planche
bruitée ; **il ne protège plus rien aujourd'hui, et il fallait le dire** plutôt
que de laisser croire l'inverse.

### (b) « `fourre_sec_a` est écartée » → la dette est soldée

L'en-tête écrivait : « une ligne à remettre le jour où Ethan en refait un rendu
propre ». `fourre_sec_v2.png` **est** ce rendu, et sa clé est pure. Les deux
anciennes sortent de la table ensemble.

### (c) « le code couleur des ressources n'est plus celui qu'il était »

**C'est l'arbitrage laissé ouvert depuis MOULINETTE-TERRAIN, et il se referme
tout seul.** Ce lot-là avait relevé que la chaîne ne REPEINT plus, si bien que
les champs prenaient la couleur de leurs planches : le quartz était ressorti
VIOLET et la scorie NOIRE, quand `FICHE-STYLE.md` leur réserve
`#9FB3C5`·`#C1CEDA` et `#382E47`·`#4E4160`. La question a été posée à Ethan et
laissée ouverte trois lots durant.

**Ses planches y répondent en la rendant sans objet.** Part du sujet à ΔE < 20
des teintes que la fiche lui réserve, grille 128 :

| | avant | après | croisé sur l'autre ligne |
|---|---|---|---|
| `champ_quartz` | 21,7 % | **63,7 %** | 20,2 % |
| `champ_scorie` | 11,4 % | **90,3 %** | 0,0 % |

**C'est la fiche qui avait raison, et c'est l'art qui la rejoint.**

⚠ **ET ELLE AVAIT MÊME PRÉVU LES VEINES.** Sa ligne « Scorie » nomme « braises
`#F5B636` », et la planche neuve en porte : **0,2 % du sujet**, un filet d'orange
dans les fissures. Trop mince pour asserter une part — noté ici pour qu'on sache
que ce n'est pas un accident.

---

## 4. ⚠⚠ Une perte, déclarée : deux sprites deviennent des miroirs

Jusqu'à ce lot, `obs_les_deux` et `obs_vehicule` portaient **deux vrais dessins**
chacun. Ethan a livré **une planche par sprite**, donc leur variante `b` est
devenue le miroir horizontal exact de `a`, comme les trois autres.

⚠ **L'autre voie a été écartée de face** : mélanger sa planche neuve avec
l'ancien `_b` aurait mis dans la même paire deux modèles de rendu — l'un filtré,
l'autre quantifié sur quatorze teintes — et l'écart se verrait sur la même base,
deux cases côte à côte.

**Une ligne à changer le jour où Ethan envoie les seconds dessins**, et le miroir
disparaît sans qu'une autre ligne bouge.

---

## 5. Ce que les sprites valent, mesuré

| Sprite | teintes (128) | emprise | clé opaque | trous 128 (avant → après) |
|---|---|---|---|---|
| `champ_quartz` | 5 100 | 112 | 0 | **2 591 → 4** |
| `champ_scorie` | 3 633 | 112 | 0 | 0 → 4 |
| `obs_infanterie` | 3 492 | 112 | 0 | 409 → 461 |
| `obs_les_deux` | 4 085 | 112 | 0 | 0 → 165 |
| `obs_vehicule` | 1 891 | 112 | 0 | 0 → 0 |

⚠⚠ **LE QUARTZ ÉTAIT PERCÉ DE 2 591 PIXELS, ET IL N'EN A PLUS QUE 4.** C'était
la seconde porte d'`est_fond` qui attrapait le violet pâle de l'ancien dessin et
le perçait de part en part. Le nouveau dessin, bleu-gris, ne la déclenche pas.
**Ce n'est pas un correctif de ce lot — c'est l'art qui a changé** —, et c'est
mesuré pour qu'on ne l'attribue pas à autre chose.

⚠ **L'emprise ne bouge pas** : 112 pixels de 128, 56 de 64, centrés, comme avant.
Changer `EMPRISE32` aurait fait grandir ou maigrir tous les champs de toutes les
bases pour une raison qui n'est pas dans le message d'Ethan.

⚠ **Les marges des planches vont de 68 à 96 pixels**, au-dessus de `MARGE_MIN`
(64) sur les cinq — mais la plus faible n'a que quatre pixels de marge sur la
borne, contre 100 pour les anciennes. C'est le fourré, et c'est normal : ses
branches partent dans tous les sens.

---

## 6. Les gardes

**Deux tests entrent, un est RETOURNÉ.** Le compte passe de 974 à **976**.

### La garde des miroirs a changé de cible, et elle s'est resserrée

Elle écrivait à la main « ces trois-là sont des miroirs, ces deux-là non » — vrai
des sept anciennes planches, faux dès qu'Ethan en livre cinq neuves. **Une garde
qui recopie l'état du jour ne peut que mentir au lot suivant.** Elle LIT désormais
la table de `tools/terrain.py` et exige que le dépôt lui corresponde : une entrée
à UNE planche doit produire un miroir, une entrée à DEUX deux dessins distincts.

⚠ **L'intention d'origine est intacte, et c'est même la moitié qui compte** : si
une planche disparaissait de la table sans que personne le voie, le sprite
existerait, l'atlas se coudrait, l'écran dessinerait — et seule cette égalité
tomberait. Elle est falsifiable **dans les deux sens**.

### Deux gardes neuves

- **`terrain — le quartz et la scorie retrouvent les teintes que la fiche leur
  RÉSERVE`.** Elle LIT les teintes dans `FICHE-STYLE.md` plutôt que de les
  retaper — la forme du document porte la distinction : avant la virgule le
  CORPS, après l'accent. Seuil à 50 %, posé **entre deux mesures** : au-dessus
  des 21,7 % et 11,4 % d'avant, sous les 63,7 % et 90,3 % d'après. Et la
  contre-épreuve tient — chaque champ ressemble à SA ligne plus qu'à l'autre.
- **`terrain — l'ajourage suit le DESSIN`.** La famille `terrain` est HORS du
  compte global des trous (`spritesDeLOuvrage` ne ramasse que les `_o_`), donc
  son détourage n'était mesuré par personne. Elle partage les cinq en masses
  PLEINES (≤ 8 trous) et dessins AJOURÉS (≥ 40) — on voit à travers les branches
  et l'éboulis, c'est le dessin. Le témoin de la borne haute est dans l'histoire
  du dépôt : **l'ancien quartz enfermait 2 591 pixels**, trois cent vingt fois la
  borne. Même partage que pour `limite`, mesurée forme par forme.

### ⚠ Six falsifications, six chutes

| # | Falsification | Ce qui tombe |
|---|---|---|
| F1 | la table repointe sur les anciennes planches | les teintes de la fiche |
| F2 | deux planches déclarées là où le sprite est un miroir | le miroir suit la table |
| F3 | un sprite retiré de la table | le miroir suit la table |
| F4 | `EMPRISE32` passe de 28 à 24 | l'emprise du dépôt |
| F5 | une masse pleine percée de 400 px | l'ajourage |
| F6 | les ajours du fourré bouchés | l'ajourage |

⚠ **F1, F4, F5 et F6 font aussi tomber `l'atlas cousu répond des sprites
d'aujourd'hui`**, qui est la garde née de BÂTIMENTS-1024 : elle voit que les
sprites ont bougé sans que l'atlas soit recousu. C'est ce qu'on lui demande.

⚠⚠ **ET UNE SEPTIÈME FALSIFICATION A ÉTÉ ÉCARTÉE PARCE QU'ELLE NE MESURAIT PAS
CE QU'ELLE PRÉTENDAIT.** J'ai voulu garder la bavure de clé — la faute qui a tué
`fourre_sec_a` — par « la boule de `RAYON_CLE` ne doit pas prendre grand-chose
au-delà du fond ». Mesuré : `fourre_sec_a`, l'écartée, est à **1,80 %**, et
`fourre_sec_v2`, la saine, à **3,48 %**. La métrique mesure l'AJOURAGE du dessin,
pas la bavure. Elle ne discrimine pas, donc elle n'a pas été écrite — et la
garde qui couvre vraiment la faute existe déjà : « le détourage ne laisse pas un
pixel de clé » à alpha ≥ 128, qui rend **zéro** sur les dix sprites.

⚠ **Et une manipulation de test a failli me tromper** : `git checkout --
art/sprites/terrain/` restaure l'index, c'est-à-dire l'art d'AVANT le lot, pas
celui qu'on vient de produire. Quatre tests sont restés rouges après une
restauration que je croyais faite. **L'art se restaure en relançant l'outil**,
qui est sa seule source.

---

## 7. Ce qui reste, et ce qu'il coûtera

**Les deux autres lignes d'Ethan ne sont pas faites**, et leurs planches ne sont
pas au dépôt :

1. **« terrain de carte »** — quatre textures de 1254 × 1254, roche rougeâtre.
   ⚠ Elles ne se posent pas comme les 64 tuiles actuelles : le fond de carte est
   un PAVAGE à somme pondérée sur un atlas indexé, et quatre grandes textures
   sont un autre modèle. C'est un lot à part entière, pas une substitution.
2. **« fond de base (supprimer mur) »** — une planche 887 × 1774 qui porte le U
   de muraille DESSINÉ DEDANS. Il faudra l'en retirer : l'anneau se dessine déjà
   par `tuilesDuContour`, et le laisser ferait deux murs superposés.

⚠⚠ **ET LA MARGE T10 EST À 1,14 %.** Les deux lots à venir font entrer de
l'image pour de bon — pas des cellules mieux dessinées. **Ils devront relever la
borne EN ÉCRIVANT POURQUOI**, comme la règle §5 le demande, et ce rapport-ci le
dit d'avance pour que personne n'ait à le redécouvrir.

⚠ **Un point mineur, non demandé, non fait** : `obs_vehicule` ne porte que
1 891 teintes contre 3 492 à 5 100 pour les quatre autres. C'est une nappe de
pétrole presque plate — elle n'a presque pas de matière à porter — et c'était
déjà la borne basse avant ce lot. Rien à corriger.
