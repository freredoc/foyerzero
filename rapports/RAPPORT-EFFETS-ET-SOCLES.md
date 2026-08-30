# RAPPORT — les explosions, les socles V2, et le pluriel des fouisseurs

**Lot** EFFETS-ET-SOCLES · **Date** 30/08/2026 · **Branche** `claude/sprite-9j4llk`
**Base** `origin/main` à `4a6454d`

Trois demandes d'Ethan, dont une qui renverse un arbitrage écrit. `art/sprites`
passe de 1 549 à **1 585** fichiers ; suite à **578 pass / 0 fail** ;
`dist/index.html` inchangé à 577 357 octets.

---

## 1. Les explosions — un arbitrage renversé, et gravé

### 1.1 Ce qui était écrit, et ce qui l'a remplacé

`INVENTAIRE-SPRITES.md` interdisait les sprites d'effet en deux endroits, dont
un qui se défendait d'avance :

> **Zéro sprite d'effet.** […] Ne rien produire pour eux, et **ne pas laisser
> cette ligne réapparaître dans un devis**.

Ethan a tranché l'inverse le 30/08 : « fait le quand même, puis modifie
inventaire ». **Les deux moitiés de la phrase comptent** — produire sans
amender aurait laissé au dépôt des sprites que son document d'autorité
interdit, et la prochaine session aurait cru à une faute.

`INVENTAIRE-SPRITES.md` §8 et §10 sont donc amendés dans ce lot. L'exception
est bornée avec soin :

- **les explosions sont produites** — trois familles, quatre images chacune ;
- **tout le reste des effets demeure procédural** : impacts, éclairs de bouche,
  mort, particules, traînées, barres de PV, ombres portées ;
- **les projectiles ne sont PAS dans l'exception.**
  `roquettes_2x2_1254x1254.png` reste une source non découpée, écarté par Ethan
  au même moment. L'inventaire le dit en toutes lettres pour qu'on ne le lise
  jamais comme un oubli.

### 1.2 L'ancrage, qui est tout le lot

⚠⚠ **Les quatre images d'une explosion n'ont pas la même taille.** Mesuré sur
`normale` : 414, 610, 821 puis 522 px de large. Le souffle grandit, culmine,
retombe.

`recadrer` de `final128.py` — la fonction que tous les autres outils emploient —
ramène chaque cellule sur SON contenu, donc à la même emprise. **Elle aurait
aplati l'animation** : quatre images de même taille qui changent de forme, au
lieu d'une explosion qui grandit. C'est exactement la faute que `tourelles.py`
raconte en tête pour les seize orientations, où recadrer chaque image sur sa
boîte faisait glisser la tourelle sur le sol.

L'ancre retenue est le **centre de la cellule**, avec **une seule échelle par
famille** prise sur l'image la plus large. Mesuré pour le justifier :

| Planche | écart horizontal au centre de cellule | écart vertical |
|---|---|---|
| `explosion_normale` | −0,5 à −1,5 px | +10,5 à −14,0 |
| `explosion_aeronef` | −1,5 à +0,5 px | +11,5 à −7,0 |
| `explosion_champignon` | −1,5 à −0,5 px | **+161,0** à −17,0 |

Horizontalement, les douze images sont centrées à 1,5 px près : le centre de
cellule est le bon ancrage. Verticalement elles dérivent, et **cette dérive EST
l'animation** — le champignon monte. Un recentrage l'aurait supprimée.

**Vérifié sur le résultat**, pas seulement sur la méthode. Taille du contenu en
grille 32, image par image :

| Famille | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| `explosion_normale` | 14×12 | 22×20 | **30×27** | 18×21 |
| `explosion_aeronef` | 11×11 | 20×20 | **28×29** | 18×22 |
| `explosion_champignon` | 16×13 | 16×23 | **21×29** | 17×24 |

Ça grandit, ça culmine à la troisième, ça retombe. Les rapports tiennent ceux
de la source (1 : 1,47 : 1,98 : 1,26 contre 1 : 1,57 : 2,14 : 1,29 — l'écart est
la quantification à 32).

Les douze sprites ont été **regardés** en 32, pas seulement mesurés : les trois
familles se lisent, et le champignon champignonne.

### 1.3 La palette — le seul endroit du dépôt hors des deux rampes

Une explosion est orange et jaune. La passer dans la rampe kaki ou celle de
l'Ouvrage la détruirait. Chaque famille porte donc **sa** palette de **seize
teintes**, prise sur son propre dessin par coupe médiane, **commune aux quatre
images** — une palette par image ferait scintiller l'animation.

Pourquoi seize, dit honnêtement : **il n'y a pas de palier**. Erreur moyenne par
canal, mesurée :

| Teintes | `normale` | `aeronef` | `champignon` |
|---:|---:|---:|---:|
| 8 | 18,0 | 14,9 | 16,2 |
| 12 | 12,1 | 9,2 | 12,7 |
| **16** | **10,3** | **8,2** | **11,6** |
| 24 | 6,9 | 6,0 | 6,6 |
| 32 | 6,0 | 5,5 | 5,5 |

La courbe décroît régulièrement, sans coude. **Seize est donc un choix dans une
plage mesurée, pas un seuil découvert**, et il est pris pour tenir le registre
des rampes du dépôt — 14 côté joueur, 19 côté Ouvrage. Le dire ainsi plutôt que
d'habiller un choix en mesure.

⚠ **La garde de palette ne voit pas ces pixels, et c'est structurel** :
`banc.test.js` balaie du CODE — `src/render/`, `src/ui/`, `index.src.html` —,
jamais des PNG. Aucun test ne tombe, et ce n'est pas un contournement : c'est
que la garde n'a jamais porté sur les assets. Écrit dans l'inventaire et dans
`CLAUDE.md` §2 pour que personne ne le découvre par surprise.

### 1.4 Ce qui sort

```
python3 tools/effets.py   →   36 fichiers écrits
```

`explosion_normale_1..4`, `explosion_aeronef_1..4`, `explosion_champignon_1..4`,
dans `art/sprites/effet/{128,64,32}/`. Emprise 30 gros pixels sur 32 : une
explosion couvre sa case et déborde un peu, là où un bâtiment s'arrête à 28.

---

## 2. Les socles de l'Ouvrage passent à la V2

Arbitré par Ethan : basculer la production sur `M3_socles_o_tourelles_3_v2` et
`M4_socles_o_artilleries_3_v2`, **sans rien supprimer**.

⚠ **La question a été posée avant d'agir, et elle devait l'être.** « Supprimer
les deux v1 » admettait trois lectures — il y a TROIS paires v1/v2 au dépôt
(M3, M4, P5.2) — et l'une d'elles était une suppression irréversible dans
`art/sources/`, que `CLAUDE.md` déclare « JAMAIS AMPUTÉ ». La réponse : basculer
la production, garder les fichiers.

`tools/socles.py` cite désormais les deux V2. Les V1 restent au dépôt et ne sont
plus citées par personne. **M1 et M2, côté joueur, ne bougent pas** : aucune V2
n'a été dessinée pour elles.

**Dix-huit fichiers modifiés, exactement** — les six socles de l'Ouvrage aux
trois grilles. Les dix-huit du joueur ressortent identiques à l'octet, ce qui
prouve que la bascule n'a touché que ce qu'elle visait.

Pas de régression de lisibilité, mesuré en grille 32 :

| Socle | V1 | V2 |
|---|---|---|
| `casemate` | 36,8 % · 27×27 | 32,1 % · 28×22 |
| `creneau` | 34,0 % · 28×27 | 28,9 % · 26×21 |
| `batterie` | 31,3 % · 27×27 | 33,2 % · 28×23 |
| `faucheuse` | 20,9 % · 16×27 | 19,1 % · 18×27 |
| `mortier` | 18,9 % · 16×26 | 20,7 % · 18×27 |
| `harpon` | 20,5 % · 16×27 | 20,5 % · 18×27 |

⚠ **Et la règle de forme survit.** `socles.py` dit en tête que « M1 et M3 sont
carrés, M2 et M4 sont hauts » — la forme donne la portée. En V2, M3 fait 28×22
(rapport 1,27, large) et M4 18×27 (rapport 0,67, haut) : le signal tient. Une
V2 qui l'aurait perdu aurait effacé une information de jeu sans que rien ne le
dise.

Les six ont été **regardés** en 32 : les trois anneaux d'accent — blanc, rouge,
jaune — se lisent, et la règle blanc/rouge/jaune n'a pas bougé.

---

## 3. Le pluriel des fouisseurs

`off_o_guetteur_fouisseur_{dos,face}.png` →
`off_o_guetteur_fouisseurs_{dos,face}.png`.

La clé de `UNITES` est `fouisseurs`, au pluriel, et la planche du joueur l'écrit
ainsi depuis toujours (`P2.2_off_j_guetteur_off_j_fouisseurs_off_j_carapace`).
Les deux planches de l'Ouvrage étaient les dernières au singulier. Les deux
citations de `tools/unites_ouvrage.py` suivent.

**Les 66 sprites d'unité ressortent identiques à l'octet** après le renommage :
la chaîne n'a pas bougé, c'est bien le même fichier lu sous un autre nom.

Vérifié : plus aucun `fouisseur` singulier dans `tools/` ni dans `art/sources/`.

---

## 4. Comptes, sur le disque

| | avant | après |
|---|---:|---:|
| `art/sprites` | 1 549 | **1 585** |
| dossiers de grille | 21 | **24** |
| `effet/` par grille | — | **12** |
| `tools/` | 16 | **17** |

`CLAUDE.md` §2 est recompté par la même occasion. Son bloc `art/sprites/`
annonçait **« neuf dossiers de grille, 144 fichiers » depuis trois lots** —
faux de 1 441 fichiers. Aucune garde ne compte ce dossier, exactement comme pour
`tools/` : `documentation.test.js` ne porte que sur `test/` et les quatre
dossiers de `src/`. Le bloc porte maintenant l'avertissement, pour que le
prochain qui y touche recompte.

| Contrôle | Résultat |
|---|---|
| `npm run check` | **578 pass / 0 fail** |
| `dist/index.html` | **577 357 octets**, inchangé → pas de bump |
| `src/` et `test/` | intacts |
| Fichiers commités modifiés | les **18** socles de l'Ouvrage, et eux seuls |

---

## 5. Points laissés ouverts

1. **Rien ne consomme les explosions.** Aucun fichier de `src/` ne cite
   `art/sprites/effet/`, et le moteur n'a pas de notion d'animation : il n'y a
   ni horloge d'image, ni entité « effet » dans la scène. Les brancher est un
   lot d'INTERFACE, et il posera une question que ce lot-ci ne tranche pas —
   à quelle cadence défilent les quatre images.
2. **Les projectiles restent en attente** (§1.1). La planche est au dépôt,
   nommée, non découpée.
3. **Trois v1 dorment dans `art/sources/`** — M3, M4 et P5.2 — que plus rien ne
   cite. Elles restent par la règle « `art/sources/` n'est jamais amputé ».
4. **Les deux `ÉCART` de `planches.py`** — mesurés dans ce lot, voir la réponse
   faite à Ethan : 9,1 % et 9,4 % des pixels de `off_j_ratisseur` et
   `off_j_belier` en grille 32, tous dans le cadre des chenilles.
5. **Les châssis sans tourelle** — `P3.3`, `P3.4` et les cinq
   `off_j_*_chassis_face_profil` — restent le dernier lot d'unités non traité,
   et sans eux les 160 tourelles d'unité n'ont pas de caisse à porter.
