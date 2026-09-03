# RAPPORT — lot TERRITOIRE (03/09/2026)

**Version produite : 0.75.0 · build 77.**
`npm run check` → **956 pass / 0 fail**, `dist/index.html` **3 277 152 octets**,
0 référence externe.
`python3 tools/verifier.py` → **985 identiques · 0 différent · 0 nouveau ·
0 MANQUANT**, verdict VERT, en 308,9 s (933 → 985 : les 52 limites, et rien
d'autre). ⚠ **C'est lui qui prouve le déménagement de `baver`** : les seize
fichiers de `bord/` sont dans les 985 identiques. Un refactor d'outil ne se
relit pas, il se rejoue.
`tools/entrees.py --verifier` → 88 consommées / 88 déclarées, 86 dormantes / 86
déclarées ; `art/sourcesstandby/` : 34 fichiers, **0 lu par la chaîne**.

---

## 0. La demande

Ethan, 03/09 : « je t'ai envoyé aussi un zip avec des bordures de territoire pour
la carte du monde », puis **« continue territoire »**.

Le zip — `limites_territoire_foyer_zero_v5` — porte **cinq formes par camp**
(trait, angle en L, coin extérieur, U, carré), en 1024 et en 128, sur clé
magenta, plus les planches 5 × 1 et un `manifest.json`.

Ce qu'elles remplacent : depuis le 31/08, `ui/monde.js` traçait les côtés
exposés au `strokeStyle`, en os pour le joueur et en rouge pour l'Ouvrage. Ce
que les dessins apportent, c'est une frontière qui a un **dedans et un dehors** —
bande sombre côté territoire, bande claire dehors, repères tournés vers
l'intérieur. Un trait de deux pixels ne dit pas de quel côté on est.

---

## 1. Ce que ça coûte

| Poste | Octets |
|---|---|
| `atlas-limite-128.webp`, 26 cellules (19 178 o sur le disque) | **+25 572** en base64 |
| `render/limite.js`, la balise, le câblage | **+1 104** |
| **Total** | **+26 676** |

`dist/index.html` : **3 250 476 → 3 277 152**. Borne T10 **inchangée à
3 400 000**, marge **122 848 octets, 3,6 %**. **24 `data:` avant, 25 après.**

⚠ **Vingt-six cellules pour dix-neuf kilo-octets.** Un dessin de limite est
presque tout transparent ; c'est le premier atlas du dépôt dont le poids ne se
discute pas.

---

## 2. Ce que la livraison avait de piégeux — mesuré avant d'écrire une ligne

### 2.1 Les cinq formes ne suivent pas une seule convention

Mesuré sur les vingt images du zip (5 formes × 2 camps × 2 tailles), en relevant
les lignes et colonnes logiques entièrement couvertes :

| Forme | traits en lignes | en colonnes | convention |
|---|---|---|---|
| `coin` | 0, 1 | 30, 31 | **bords de la case** |
| `u` | 0, 1 | 0, 1, 30, 31 | **bords de la case** |
| `carre` | 0, 1, 30, 31 | 0, 1, 30, 31 | **bords de la case** |
| `trait` | **15, 16** | — | **médiane** |
| `angle_l` | — | — | **médianes**, deux demi-traits |

**Les deux ne peuvent pas coexister** : un `trait` laissé au milieu se
désaligne d'une demi-case de tout `coin` qu'il rencontre, et la frontière est
brisée à chaque angle.

⚠⚠ **On normalise `trait` sur la convention des trois autres, et c'est une
TRANSLATION, pas un redessin.** Quinze pixels logiques vers le bas : la bande
sombre passe de la ligne 15 à la ligne 30, la claire de 16 à 31 — c'est-à-dire
exactement le bord bas de `carre`, mesuré. Aucun pixel inventé, aucun perdu (les
repères descendent de 11–14 à 26–29, et la case en compte 32). `assert_bord`
vérifie la convention **sur les quatre formes produites**, pas seulement sur
celle qu'on a déplacée — une garde qui ne regarderait que `trait` ne dirait pas
si la convention qu'on lui impose est bien celle des autres.

### 2.2 La coupe et la réduction se vérifient contre la livraison

- la coupe de la planche 5 × 1 en cellules de 1024 reproduit **les dix sprites
  livrés au pixel près** ;
- la réduction **NEAREST par huit** reproduit **les dix sprites de 128 au pixel
  près**.

Ce n'est pas une coïncidence : la planche est dessinée sur une grille logique de
32 × 32, donc 32 pixels réels par pixel logique à 1024 et 4 à 128, et 32/8 = 4.
`verifier_reduction` **rejoue cette égalité à chaque exécution**, contre les
planches de 128 qui sont au dépôt pour ça. C'est ce qui transforme « on réduit
par huit » d'une affirmation invérifiable en une garde.

### 2.3 Le détourage passe par `est_fond`, **l'inverse du lot MURS**

`est_fond_sujet` borne le fond à la composante qui **touche le bord** — c'est
l'acquis du lot PIXELS, et c'est ce que `bords.py` emploie. Ici il est faux :
une limite est un **cadre**, `carre` et `u` posent leur bande claire tout au long
du bord de la case, et **aucun pixel de fond ne le touche**. Mesuré :
`est_fond_sujet` rend **zéro** pixel sur ces deux formes, ce qui les laisserait
entièrement opaques, magenta compris. Un mur a son sujet au milieu et son fond
autour ; une limite est le contraire.

⚠ **Et `est_fond` ne perce rien ici, ce qui n'allait pas de soi** : sa seconde
porte attrape des teintes claires, et ces dessins ont une bande claire. Mesuré
sur les **trente** combinaisons — cinq formes × deux camps × trois tailles —
`est_fond` rend **exactement les pixels magenta purs**, et il n'y a **pas un seul
pixel « proche du magenta sans l'être »** dans toute la livraison. `assert_fond`
le vérifie à chaque exécution plutôt que de le croire.

### 2.4 `angle_l` n'est pas produit — et ce n'est pas un oubli

C'est le coin **rentrant**, celui où la frontière tourne autour d'une encoche.
Or le modèle du dépôt est **par case** : `bordsDuTerritoire` rend quatre booléens
par case depuis le 31/08, et dans ce modèle un coin rentrant est déjà formé par
deux traits pleins de **deux cases voisines** qui se rejoignent au sommet.
**Vérifié en rendant un territoire d'essai à encoche** avant d'écrire le tool :
la frontière s'y ferme sans lui.

Le produire l'aurait fait coudre dans l'atlas et payer au livrable pour zéro
pixel dessiné. Sa cellule reste dans la planche, qui ne s'ampute pas.

---

## 3. Les quatre formes couvrent les seize cas

Une case a quatre côtés, donc seize combinaisons d'exposition :

| exposés | pièces |
|---|---|
| 0 | aucune |
| 1 | `trait` |
| 2 adjacents | `coin` |
| **2 opposés** | **deux `trait`** |
| 3 | `u` |
| 4 | `carre` |

⚠ **Le cas des deux côtés opposés n'a pas de dessin, et n'en a pas besoin.**
C'est un couloir d'une case de large ; deux `trait` face à face le rendent
exactement, chacun portant sa bande claire du bon côté. C'est aussi pour ça que
`spritesDeLaLimite` rend une **liste** et non un nom.

Treize sprites par camp — 4 traits, 4 coins, 4 U, 1 carré —, **26 cousus, 26
employés**, vérifié dans les deux sens.

⚠ **Les rotations se produisent dans l'outil, pas au dessin.** Le README du zip
le demande, et `render/canvas2d.js` n'a aucune primitive de rotation : lui en
donner une pour quatre sprites ferait porter une transformation de contexte à
tout le champ de bataille. Une rotation de 90° d'une image carrée est exacte.

---

## 4. Ce qui a changé ailleurs

- **`baver` déménage de `tools/bords.py` vers `tools/cond.py`.** Elle y était née
  au lot MURS quand un seul outil en avait besoin ; les limites sont le second,
  et pour la même raison exactement — un sprite presque tout transparent, encodé
  en WebP avec perte sur le RVB, dessiné réduit. **Le déménagement se prouve** :
  `verifier.py` rejoue `bords.py` et compare les seize fichiers de `bord/` à
  l'octet.
- **`epaisseurDeFrontiere` est retirée, et son test avec — une assertion en
  moins, déclarée.** Elle donnait l'épaisseur du trait de frontière ; il n'y a
  plus de trait. Plus aucun appelant de production ne la lisait : seul son propre
  test l'atteignait, ce qui est la définition d'une fonction morte.
  `TEINTES_TERRITOIRE` reste — le halo et la flèche du raid s'en servent.
- **`limite` est écartée du compte global des trous de `sprite.test.js`**, et
  l'exclusion se justifie dans les deux sens : voir §5.

---

## 5. Les tests — `test/limite.test.js`, sept tests

Le compte passe de **950 à 956** (+7 entrants, −1 retiré avec
`epaisseurDeFrontiere`).

| Test | Ce qu'il mesure |
|---|---|
| T1 | les seize cas résolvent ; le compte de pièces (deux pour les côtés opposés) ; **et dans l'autre sens**, chaque cellule cousue sert ; camp inconnu lève |
| T2 | l'ordre canonique `n e s o` est le même dans `tools/limites.py` et `render/limite.js` |
| T3 | le découpage vient du module, en entiers, dans les bornes de l'atlas ; l'écran ne le refait pas |
| T4 | **les pixels** : chaque trait tombe sur le bord de la case, jamais au milieu — la normalisation tient jusque dans les fichiers |
| T5 | `trait` et `coin` enferment **zéro**, `carre` et `u` enferment ; l'alpha reste binaire |
| T6 | l'atlas entre par sa balise, une seule fois, sans variable CSS |
| T7 | la frontière ne trace plus au `strokeStyle` ; `epaisseurDeFrontiere` est bien partie |

### Les falsifications, mesurées

| # | Ce qu'on casse | Ce qui tombe |
|---|---|---|
| F1 | l'outil trie les côtés `nsoe` | T2 |
| F2 | la normalisation du trait est retirée | **`assert_bord`, à la production** — l'outil lève, le sprite faux n'est jamais écrit |
| F3 | les deux côtés opposés rendent un coin | T1 (le compte de pièces) et T4 |
| F4 | l'écran rappelle `celluleDuSprite` | la garde de `monde.test.js`, préexistante |
| F5 | le carré n'est plus demandé | T1 (l'autre sens) |
| F6 | détourage par `est_fond_sujet` | l'outil ne produit plus rien, quatre tests tombent |
| F7 | le `strokeStyle` revient | T7 |

⚠ **F2 est la plus intéressante : elle ne mord pas dans la suite JS, elle mord
dans l'OUTIL.** Le sprite mal normalisé n'atteint jamais le dépôt, donc les tests
JS n'ont rien à attraper — c'est le bon endroit pour cette garde-là, et il fallait
le dire plutôt que de compter une falsification qui « ne mord pas ».

⚠ **Et le premier jet de ce lot a été rejeté par une garde existante.**
`monde.test.js` interdit à l'écran d'appeler `celluleDuSprite` depuis le lot
RETOURS-DU-31 ; le premier jet refaisait le calcul dans l'écran, exactement la
faute que la garde décrit. La géométrie est donc dans `render/limite.js`, comme
celle des emblèmes est dans `render/embleme.js`.

---

## 6. Points laissés en suspens, dits de face

- ⚠⚠ **LES COULEURS DE LA FRONTIÈRE NE SONT PLUS CELLES DU DÉPÔT, ET C'EST UN
  ARBITRAGE QUI REVIENT À ETHAN.** `TEINTES_TERRITOIRE` posait l'os `#F5F3E8`
  pour le joueur et le rouge `#E43E32` pour l'Ouvrage — et `§6` réserve ce rouge
  à **ce qui attaque le joueur**, ce qu'un test croise avec `attaqueLeJoueur`.
  Les dessins livrés portent leurs propres teintes : **or/ambre pour le joueur,
  gris-bleu pâle pour l'Ouvrage**. C'est son art, il fait foi sur ce qu'il
  dessine — mais le code couleur de la carte n'est plus celui qu'il était, et
  personne ne l'a arbitré explicitement. Une ligne à rouvrir s'il veut le rouge.
- **Le halo et la flèche restent au trait**, dans les anciennes teintes. Ils ne
  sont pas des frontières ; les repeindre aurait été étendre le lot sans qu'on le
  demande.
- **`angle_l` n'est pas produit** (§2.4). Réversible : c'est une entrée dans
  `FORMES` de `tools/limites.py` et une branche dans `spritesDeLaLimite`, le jour
  où un modèle par SOMMET arriverait.
- **Le rendu sur appareil n'a pas été vu.** Il n'y a pas d'appareil ici (§3), et
  un essai appareil non exécuté se déclare non exécuté. Ce qui a été regardé :
  un rendu de contrôle en Python, à 128 px par case, sur un territoire d'essai à
  encoche, isthme, case isolée et deux camps — c'est là que la convention de bord
  s'est vérifiée à l'œil, et pas à la relecture.
