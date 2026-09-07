# RAPPORT — lot ACCENT-CONFRONTÉ : le dessin répond de la table

Toutes les grandeurs sont **mesurées par exécution**.

---

## 1. Ce qui a été produit

| Grandeur | Valeur |
|---|---|
| Version | **0.45.0 · build 46 — INCHANGÉE, aucun bump** |
| `npm run check` | **593 pass / 0 fail** (589 avant, **+4**) |
| `dist/index.html` | **1 073 238 octets — identique à l'octet** |

### ⚠ LE SHA-256 EST IDENTIQUE, DONC AUCUN BUMP

```
avant : d9044d8aad58a7f3a524f4facee9e1837e679acc52b6c3dac68cd456f14b55db
après : d9044d8aad58a7f3a524f4facee9e1837e679acc52b6c3dac68cd456f14b55db
```

`tools/build.js` minifie : un commentaire de `src/` ne change pas le livrable, et
le §5 n'a fait partir **aucun code**. Bumper aurait poussé une mise à jour aux
appareils sans raison (CLAUDE.md §5).

Le lot n'ajoute **aucun sprite, aucun atlas, aucun octet**. Il ajoute un
garde-fou, quatre dettes nommées et trois commentaires réparés.

---

## 2. Les quatre dettes — reproduites avant d'être encodées

Mesurées sur `main` à `aca172f`, grille 64. **Les quatre comptes du brief se
reproduisent à l'unité près.**

| dette | attendu par `accentDe` | mesuré sur ce qui est AFFICHÉ |
|---|---|---|
| `off_j_broyeur` composé | `vehicule` | inf. **161**, véh. **0**, str. 0 → `infanterie` |
| `off_j_pilon` composé | `structureOuAviation` | inf. 19, véh. **173**, str. 0 → `vehicule` |
| `off_o_ratisseur` attaque | `infanterie` | **0 / 0 / 0** → aucun accent |
| `off_o_belier` attaque | `structureOuAviation` | véh. **104** contre str. **95** → `vehicule` |

### ⚠⚠ ÉCART MESURÉ : QUATRE DETTES, MAIS **SIX** COMBINAISONS VIOLENT

Le brief annonce « une table de quatre entrées ». Le balayage complet des
**56 combinaisons affichées** (unité × camp × force) en trouve **six** qui
violent, pas quatre :

| | attaque | garnison |
|---|---|---|
| `broyeur` joueur | inf. 161 / véh. 0 | inf. **160** / véh. 0 |
| `pilon` joueur | inf. 19 / véh. 173 | inf. **19** / véh. **173** |
| `ratisseur` Ouvrage | aucun accent | *(la pose `_def` est saine, 83 px)* |
| `belier` Ouvrage | véh. 104 / str. 95 | *(la pose `_def` rebascule sur structure)* |

**Cause mesurée** : `broyeur` et `pilon` sont des blindés du joueur, et leur
tourelle **n'a pas de variante `_def`** — vérifié, `off_j_broyeur_s_def` n'existe
pas. Les deux poses partagent donc la même tourelle, et seule la coque diffère :
le verdict est identique dans les deux.

La table porte donc **quatre entrées, clé (unité, camp)**, et couvre les six
combinaisons. C'est le fait mesuré, et il est écrit dans le commentaire de
`DETTES_ACCENT`.

### L'assertion inverse

Chaque dette est assertée **encore violée**. Le jour où l'art est corrigé, le
test tombe et quelqu'un retire la ligne — même mécanique que les deux `ÉCART`
permanents de `tools/planches.py`, qui sont voulus **et** vérifiés.

⚠ **Ce lot ne corrige pas l'art**, comme le brief l'exige.

---

## 3. Les tests du §7 — verdict, montage, falsification

| # | Test | Verdict | Montage effectif | Falsification → rouge |
|---|---|---|---|---|
| 1 | Le décodeur rend les comptes attendus | **PASS** | `off_j_pilon_s` → **161** px de véhicule ; **assertion préalable** que le décodage rend > 500 px opaques | décodeur rendant zéro → **4 rouges** |
| 2 | L'accent dessiné égale `accentDe`, hors dettes | **PASS** | 56 combinaisons balayées, 50 hors dettes ; **assertion que ≥ 30 restent mesurées**, sinon les exceptions couvriraient tout | une dette retirée de la table → **1 rouge** |
| 3 | Chaque dette est encore violée | **PASS** | les 4, sur toutes leurs poses présentes ; plus une assertion que `accentDe` n'a pas changé sous la dette | art « réparé » simulé → **1 rouge** |
| 4 | Le verdict ne dépend pas de l'orientation | **PASS** | les **16** orientations × 5 blindés → **1 seul verdict** chacun ; **appât** : le montage sait distinguer deux verdicts | — |
| 5 | Les teintes viennent de `PALETTE` | **PASS** | table construite depuis `PALETTE.accents`, 6 teintes, confrontées clé par clé | une teinte changée dans `PALETTE` → **2 rouges** |
| 6 | T8 tient, dans sa forme retournée | **PASS** | inchangée dans sa mécanique, son commentaire réécrit — §4 | — |

**Une sixième falsification, la plus importante du lot** : mesurer le sprite
`unite/` au lieu du composé coque + tourelle — le piège que le brief signale —
fait **1 rouge**. Le garde-fou mesure bien ce qui est AFFICHÉ.

### L'audit des assertions

| Fichier | avant | après | |
|---|---:|---:|---|
| `accent.test.js` (neuf) | — | **19** | +19 |
| `png-rgba.js` (neuf, aide) | — | **5** | déplacées |
| `sprite.test.js` | 102 | **97** | −5, **déplacées** |
| `arsenal.test.js` | 110 | 110 | = |
| `documentation.test.js` | 33 | 33 | = |

**Net +19.** Les cinq assertions retirées de `sprite.test.js` sont **exactement
celles du décodeur**, qui a déménagé dans `png-rgba.js` : 97 + 5 = 102, le compte
d'avant. **Aucune assertion n'a été perdue ni assouplie.**

⚠ `png-rgba.js` est **nommé** dans la liste blanche de `documentation.test.js`,
à côté de `prereglages-lot3a.js`. La liste reste nominale : tout autre fichier
déposé dans `test/` la fait rougir.

---

## 4. Les trois commentaires réparés

1. **La phrase fausse de T8 a disparu.** Elle disait « un sprite ne porte pas de
   couleur : ses pixels viennent de l'atlas ». La **primitive** ne porte pas de
   couleur ; les **pixels**, si — et ce sont exactement les six teintes de la
   fiche. C'est cette confusion qui a fait croire à une perte d'information. Le
   bloc renvoie maintenant nommément à `test/accent.test.js`, et pose la règle au
   lieu de laisser une question ouverte.
2. **L'en-tête de `scene.js`** disait que la rampe ennemie est « une dette DA à
   définir » et que l'Ouvrage est dessiné « dans la rampe MÉTAL en attendant ».
   L'art a tranché : les sprites de l'Ouvrage sont **violets**.
3. **Le commentaire de `PALETTE.metal*`** disait « rampe provisoire de
   l'Ouvrage » ; il dit maintenant que ce ton ne sert plus qu'à la **légende**.

### ⚠ ÉCART MESURÉ : `corpsDe` N'EST PAS DU CODE MORT

Le brief suggérait que « c'est peut-être le code qui part ». **Vérifié : non.**
`corpsDe` a cinq appelants vivants — `dessinerEscouade`, `dessinerBlinde` et
`dessinerAeronef` —, et ces trois-là servent encore `listeLegende`, dont les
vignettes restent géométriques faute d'identifiant d'unité à résoudre.

Seul le **commentaire** est corrigé ; aucun code n'est retiré. C'est aussi
pourquoi `dist` ne bouge pas.

### ⚠ ÉCART MESURÉ : « pas une de ses neuf teintes n'est du métal » est FAUX

Le brief l'affirme pour `off_o_ratisseur` à la grille 64. Mesuré, ses neuf
teintes sont :

```
#382E47 279 · #231D2E 173 · #4E4160 146 · #8C9A72 103 · #6A7658 24
#6B5B80  14 · #4E5742   9 · #3E454C   2 · #161914   1
```

`#3E454C` **est** `PALETTE.metalMoyen` — deux pixels sur 751. Le fond du propos
tient (l'Ouvrage est violet, les quatre teintes dominantes le disent), la formule
non. Le commentaire écrit la mesure plutôt que de recopier le brief.

---

## 5. La vérification appareil du §8 — NON EXÉCUTÉE

**La question posée est : « 6,5 à 9,5 % de pixels d'accent sur un blindé, à la
taille où le banc affiche une case sur un téléphone : est-ce que ça se lit ? »**

**Personne ne peut y répondre depuis une machine, et je ne le fais pas.**
Il n'y a pas d'appareil ici, et un test appareil non exécuté se déclare non
exécuté (CLAUDE.md §3).

⚠ **Ce que je peux apporter, c'est la mesure exacte, et l'intervalle du brief est
un peu étroit.** Part de pixels d'accent, pose d'attaque, grille 64 :

| classe | min | max | sujets |
|---|---:|---:|---:|
| escouade | **17,6 %** | 45,6 % | 10 |
| aéronef | 6,7 % | 29,3 % | 8 |
| **blindé composé (joueur)** | **5,8 %** | **13,4 %** | 5 |
| blindé Ouvrage | 0,0 % | 23,1 % | 5 |

Le brief annonce 6,5 à 9,5 % pour les blindés ; mesuré, **5,8 à 13,4 %**. Le pire
cas est donc plus bas que prévu — et c'est `broyeur`, l'une des dettes.

**Si ça ne se lit pas sur l'appareil**, le sujet n'est pas clos : il faudra
épaissir les accents à la source, et ce sera un lot de production.

### Les vérifications en attente — TOUJOURS NON EXÉCUTÉES

Les **dix** que le rapport précédent liste le restent, et celle-ci fait **onze** :

1. Les unités apparaissent au **premier** chargement (piège du décodage d'image)
2. La tourelle est **sur** sa coque et tourne vers ce qu'elle tire
3. Les blindés en défense montrent leurs chenilles à l'horizontale
4. Le pixel art n'est pas lissé
5. Le bavement entre cellules d'atlas
6. Le sens des tourelles de la bande de défense
7. Le socle sous la tourelle
8. Le raccord des merlons
9. Le sens de `qg_de_defense` / `centre_de_commandement`
10. La lisibilité des seize bâtiments à ~42 px
11. **La lisibilité de l'accent sur un blindé — §8**

---

## 6. Écarts par rapport au brief

1. **Six combinaisons violent, pas quatre** — §2. La table porte quatre entrées
   par sujet et couvre les six ; la cause est mesurée.
2. **`corpsDe` n'est pas mort** — §4. Aucun code retiré.
3. **La formule « aucune teinte de métal » est fausse** — §4, deux pixels.
4. **La part d'accent des blindés est de 5,8 à 13,4 %**, pas 6,5 à 9,5 % — §5.
5. **Le décodeur a été extrait en module partagé** plutôt que gardé local : un
   SECOND test en avait besoin, et le dupliquer aurait donné deux décodeurs
   voisins dont un seul serait éprouvé. Le repli Python du §2 n'a **pas** été
   pris — le décodeur JS fonctionne.

---

## 7. Points laissés en suspens

1. **Les quatre dettes d'art attendent une décision de production.** Recolorier
   une tourelle est au pinceau ou par remappage de palette dans la chaîne, et
   c'est un arbitrage d'Ethan. Le garde-fou les tient en attendant, et tombera
   dès qu'elles seront réparées.
2. **La lisibilité de l'accent à l'écran** — §5, la seule question que ce lot
   pose sans pouvoir y répondre.
3. **Onze vérifications appareil** en attente.
4. **`off_o_ratisseur` en pose d'attaque n'a aucun accent à la grille 64 ni 32**,
   mais 19 pixels à 128. Ce n'est pas un défaut d'appariement : la réduction le
   mange. C'est la dette la plus facile à corriger à la source.
