# RAPPORT — lot SPRITES-V2-JOUEUR

Bascule de tout l'art du JOUEUR vers la v2 livrée par Ethan, et les deux
arbitrages qui l'accompagnent : **la tourelle tourne au rendu**, **les connexions
sont abandonnées**.

Branche `claude/sprite-refonte-9il369`, écrit contre `origin/main` à `49b4ebf`.
Le brief annonçait `8936f7d` ; trois lots ont été mergés entre son écriture et
son exécution, et **les comptes ont été revérifiés, pas recopiés** — voir §9.

---

## 0. Ce qu'il faut lire en premier

| | Avant | Après |
|---|---|---|
| `npm test` | 1 128 pass / 0 fail | **1 117 pass / 0 fail** |
| `npm run build` | 9 003 058 o | **7 982 366 o** — le lot **REND 1 020 692 o** |
| `data:` (URI) | 291 | **291** — 28 images, 263 sons |
| borne T10 | 9 300 000 | **inchangée** — marge 1 317 634 o, **14,17 %** |
| `SAVE_VERSION` | 25 | **25** |
| `tools/verifier.py` | — | **858 identiques · 0 · 0 · 0**, VERT, 331,1 s |
| `entrees.py --verifier` | — | **393 / 393 · 123 / 123**, VERT |
| version / build | 0.99.0 · 101 | **non bumpés** — voir §10 |

Le livrable maigrit d'un mégaoctet parce que **cinq familles passent de 366 à 79
sprites par grille**. Ce n'est pas une économie cherchée : c'est ce que coûte de
dessiner une tourelle seize fois au lieu d'une.

⚠ **La borne T10 n'est PAS baissée.** « Une borne ne se baisse pas parce qu'un
lot rend » — précédent exact au lot MURS, qui rendait 28 827 octets.

---

## 1. Le coût, poste par poste

Mesuré contre un livrable **rebâti** depuis `origin/main` dans un `git worktree`,
et non contre le nombre recopié de `CLAUDE.md` — la baseline rebâtie rend bien
9 003 058, ce qui confirme le nombre au passage.

| Poste | Avant | Après | Écart |
|---|---:|---:|---:|
| images | 7 323 770 | 6 306 190 | **−1 017 580** |
| audio | 1 193 346 | 1 193 346 | 0 |
| JavaScript | 349 480 | 344 293 | −5 187 |
| feuille | 102 789 | 104 864 | +2 075 |
| balisage | 33 673 | 33 673 | 0 |
| **total** | **9 003 058** | **7 982 366** | **−1 020 692** |

**La somme des cinq postes tombe exactement sur le total.** Le JavaScript rend
5 187 octets parce que `src/sim/rendu-pose.js` perd les deux tiers de sa matière
(§5) ; la feuille en prend 2 075 pour la règle `.couche-tournante` et son
paragraphe.

⚠ **Le compte de `data:` se décompose autrement que `CLAUDE.md` ne le disait.**
Il annonçait « 21 images, 270 sons » pour 291 URI ; mesuré, c'est **28 images et
263 sons** — 263 étant exactement la taille du pack. Le total, lui, était juste,
et il ne bouge pas : **291 avant, 291 après**. Aucune image n'entre ni ne sort ;
les atlas sont remplacés en place.

---

## 2. Ce qui entre, ce qui sort

**Quarante-deux sprites v2**, découpés un par un par Ethan : 9 d'infanterie
(dont 4 poses de garnison), 4 d'aéronef, 14 de blindé (9 coques + 5 tourelles),
15 de défense (7 socles, 6 tourelles, merlon, ronce, herse).

Effectifs après bascule — **les cinq sont exactement ceux du brief** :

| Famille | Avant | Après | Pourquoi |
|---|---:|---:|---|
| `tourelle-unite` | 80 | **5** | les seize orientations tombent |
| `defense` | 204 | **18** | idem, et le merlon perd ses liaisons |
| `socle` | 36 | **12** | les vingt-quatre socles à amorce partent |
| `unite` | 36 | **35** | −5 blindés monolithes, +4 poses de défense |
| `chassis` | 10 | **9** | −`off_j_pilon_chassis_def` |

`tools/atlas.py` lève de lui-même quand un effectif ne tombe pas : **les cinq
lignes de `FAMILLES` ont été corrigées, pas contournées**, et l'outil a fait son
travail à chaque étape.

⚠ **`off_j_pilon_chassis_def` mérite son mot.** `pilon.defense.present` vaut
`false` dans `combat.js`, et `nomAvecPose` ne demande `_def` que pour la force
`garnison` : le sprite existait depuis le lot 8 et **personne ne l'a jamais lu**.

### Rien n'est redessiné côté Ouvrage — vérifié à l'octet

Trente sprites de l'Ouvrage changent de NOM : six tourelles, un merlon, six
socles et deux barrières, aux deux grilles. **Les trente sont identiques à leur
prédécesseur `_n` ou `_isole`**, SHA-256 comparés. La réduction renomme, elle ne
redessine pas.

---

## 3. La formule du rendu — le point le plus coûteux du lot

Le brief donne :

> `côté = t × diametre_pct/100 × cote_pct_embase/100 × echelle`

**Appliquée à la lettre, elle ne peut produire aucun de ses propres nombres.**
À la grille 64 elle rend :

```
off_j_fendeur_chassis      côté 131,9   deux fois la case      NON
socle_def_j_faucheuse      côté 113,8                          NON
off_j_broyeur_chassis      côté  63,8                          NON
```

— **neuf pièces sur quinze débordent**, plusieurs du double. Et elle ne dépend
d'**aucune emprise**, donc elle ne peut produire aucun plafond ; or le brief cite
les siens (« 23,6 pour le Chasseur, 31,6 pour le Percheron »).

La formule **géométrique** les reproduit au dixième :

```
côté_case = largeur_de_la_pièce_DANS_LA_CASE × diametre_pct/100
                                             × cote_pct_embase/100 × echelle
dx_case   = largeur_de_la_pièce_dans_la_case × x_pct/100
dy_case   = hauteur_de_la_pièce_dans_la_case × y_pct/100
```

| pièce | brief | mesuré |
|---|---:|---:|
| Chasseur (`fendeur`) | 23,6 | **23,6** |
| Percheron (`broyeur`) | 31,6 | **31,5** |
| Éclaireur, Pionnier, Obusier | 32,0 | **32,0** |

C'est elle qui est implémentée. **Les deux référentiels sont écrits en tête des
deux tables d'ancres**, avec le nombre que leur confusion produit, pour qu'on ne
les mélange plus.

### Le débordement des six socles — mesuré, déclaré, borné

Le carré de tourelle atteint, en pourcentage de demi-case (50 = le bord) :

```
socle_def_j_faucheuse   65,34      off_j_broyeur_chassis      49,79
socle_def_j_batterie    62,65      off_j_fendeur_chassis_def  43,98
socle_def_j_creneau     62,55      off_j_fendeur_chassis      43,27
socle_def_j_casemate    62,42      off_j_broyeur_chassis_def  36,86
socle_def_j_mortier     61,68      off_j_pilon_chassis        36,02
socle_def_j_harpon      58,23      off_j_ratisseur_chassis    28,03
                                   off_j_belier_chassis       22,84
                                   off_j_ratisseur_chassis_def 19,12
                                   off_j_belier_chassis_def   16,96
```

**Les neuf coques tiennent toutes. Les six socles débordent** de 0,1 à 3,8 gros
pixels de 32 sur la case voisine, quand le canon pointe dans cette direction.

Deux arbitrages se croisent, et **le lot n'en défait aucun** : l'emprise des
socles est celle qu'Ethan a donnée — 90 % pour les socles de tourelle, 85 % pour
les coques d'artillerie — et `echelle` est ce qu'il a fallu pour que le canon SE
LISE à 40 px. Les faire tenir demanderait `echelle ≈ 1,35`, où l'artiste a mesuré
que le canon ne se lit plus.

⚠ **Et la v1 faisait PIRE**, ce qui met le chiffre en perspective : elle
dessinait la tourelle sur la case ENTIÈRE — `sprite(famille, nom, x, y, t, t)` —,
son canon atteignant le bord par construction. On passe de « toute la case » à
« la case plus 15 % ».

**Un test borne le débordement des deux côtés** et nomme le pire au centième.
**Le corriger est un arbitrage, et il revient à Ethan.**

---

## 4. La rotation

`angleVers` et `angleDeLaPiece` entrent dans `src/sim/rendu-pose.js` ; la
primitive `sprite` de `render/scene.js` porte un champ `angle` en degrés, et
`canvas2d.js` fait `save / translate au CENTRE / rotate / drawImage recentré /
restore`.

⚠ **Un angle nul ne touche pas au contexte du tout.** Sinon toute la scène
paierait un `save`/`restore` par primitive pour une transformation identité.

### La question que le brief posait

> « `orientationDeLaPiece` rend une orientation nommée sur seize. Il faut un
> angle. Lire la fonction avant de décider si elle se généralise ou s'il en faut
> une seconde à côté — et le dire dans le rapport. »

**Elle se généralise.** `orientationVers` faisait DEUX choses : un `atan2`, puis
une quantification sur seize secteurs. On garde la première sous le nom
`angleVers` ; la seconde n'a plus rien à quantifier. Une seconde fonction à côté
aurait mis **deux `atan2` dans le dépôt**, dont un seul aurait reçu la correction
de boussole du 30/08 le jour d'après.

### L'Ouvrage ne tourne pas

Le brief écrit : « on garde l'orientation nord et l'état isolé de ce qui existe
déjà ; on ne redessine rien côté Ouvrage ». Ses six tourelles sont donc celles de
la v1, **dont le pivot est décalé de 2,2 à 11 % du côté du sprite** (`DECALAGE`
de `tools/tourelles.py`) : les tourner autour du centre les ferait osciller.

**Le discriminant est la DONNÉE, jamais le camp** : une entrée d'ancre existe →
la pièce tourne ; sinon elle se pose sur la case entière comme avant. Un
`=== 'o'` écrit dans `scene.js` serait la seconde vérité que §4 de `CLAUDE.md`
interdit, **et il mentirait le jour où l'Ouvrage sera redessiné** — un test
l'exige de face. Précédent accepté : `tools/tourelles_unite.py` écrivait déjà
« un blindé de l'Ouvrage ne peut pas suivre sa cible du canon ; c'est le prix de
l'arbitrage, et il est assumé ».

### Côté DOM : un enfant, pas un fond

`background-image` ne sait pas tourner, et `transform` sur le jeton ferait
pivoter son socle avec. `poserCouches` sort donc la couche ancrée des fonds et la
pose dans un `<span class="couche-tournante">` en position absolue, dimensionné
en **pourcentage de l'élément** — le même référentiel que le canevas, où le socle
remplit la case comme il remplit ici le jeton.

⚠ **Un `span`, pas un `i`, et c'est mesuré.** Quatre règles de la feuille visent
le descendant `i` de leur conteneur — `.posable i`, `#offense-palette .unite i` —
et lui imposent 26 px de côté : un `<i>` y aurait hérité de cette taille, et la
tourelle se serait dessinée à côté de sa pièce dans les deux palettes.

⚠ **Quatre règles gagnent `position: relative`** — `.fantome`, `.posable i`,
`#offense-palette .unite i` et la pièce d'une vague. Sans ancêtre positionné, le
`<span>` se calerait sur la CASE.

⚠ **La liste des enfants posés se RETIENT, elle ne se cherche pas.** Les six
appelants posent tous sur un élément qu'ils viennent de créer, donc rien ne
s'empile aujourd'hui ; mais `rafraichir` repasse dix fois par seconde.
`querySelectorAll` retirerait ce qu'un AUTRE aurait posé, et **il n'existe pas
dans les faux documents des tests**, qui portent « ce que le code emploie
vraiment ».

---

## 5. `src/sim/rendu-pose.js` perd les deux tiers de sa matière

Après l'étape 5, **onze exports n'avaient plus aucun appelant de production** :
`ORIENTATIONS`, `ORIENTATION_PAR_DEFAUT`, `orientationDeLAngle`,
`orientationVers`, `orientationDeLaPiece`, `LIAISONS`, `PORTEE_AVEC_TOURELLE`,
`SE_LIE_AU_MUR`, `proprietaireChaine`, `liaisonDuMur`, `liaisonDuSocle` —
seulement des tests.

Le brief ne demande pas ce retrait. Il est fait quand même, et voici pourquoi :
garder ce code aurait laissé dans `src/sim/` **un modèle que plus aucun dessin ne
demande**, ce que `CLAUDE.md` §6 nomme en toutes lettres — « une constante que
plus rien ne lit est un commentaire menteur en puissance ». Le fichier passe de
334 à 121 lignes ; son en-tête dit ce qui est parti et pourquoi.

**Neuf tests partent avec le chaînage, quatre avec la quantification.** La garde
qui compte le plus — celle du sens d'affichage, née du défaut de boussole du
30/08 où deux modules justes séparément étaient faux ensemble — est **REPRISE
telle quelle, en degrés au lieu de noms**, sans qu'une assertion bouge.

Trois autres commentaires qui citaient `SE_LIE_AU_MUR` ou la planche de
connexions comme exemple vivant ont été réécrits : `render/embleme.js`,
`render/sprite.js`, `tools/ruines.py`. Un exemple qui n'existe plus envoie
chercher un mécanisme qu'on ne trouvera pas.

---

## 6. Un défaut trouvé en exécutant : `ui/recherche.js`

`couchesDeLaPiece` composait ses noms de sprite **elle-même** : `off_j_<id>` pour
toute unité, `def_j_<id>_s` pour un ouvrage à tourelle, et une table de trois
exceptions écrite à la main pour le Merlon, la Herse et la Ronce.

**Trois de ces quatre règles sont devenues fausses le même jour** — un blindé du
joueur n'a plus de sprite monolithe, une tourelle n'a plus d'orientation dans son
nom, un merlon n'a plus d'état de liaison — et `celluleDuSprite` a **levé à la
première peinture de l'écran** : « `off_j_ratisseur` n'est pas dans l'atlas
`unite` ».

C'était une seconde vérité, et l'écran de recherche était **le dernier du dépôt à
ne pas passer par `couchesDeLEntite`**. Il y passe. Son test change de cible : il
exigeait UNE couche et nommait les quatre règles ; il garde ce qui reste vrai —
tout nom sort d'un atlas, tout nom est du vocabulaire du joueur — et **gagne le
balayage des DEUX couches d'une pièce à tourelle**.

---

## 7. Les quatre dettes d'accent

Le brief l'écrit : « si une pièce paraît fausse, le dire au rapport ; **ne pas la
corriger** ». `DETTES_ACCENT` est le mécanisme prévu pour ça, et il a joué **dans
les deux sens**.

**Deux dettes se referment**, sans que l'art soit touché : `broyeur j` et
`pilon j`, déclarées en défaut depuis le 30/08, rendent maintenant exactement ce
que la table de dégâts dit — Percheron 35 pixels de véhicule et zéro ailleurs ;
Obusier 243 de structure contre 2 et 1.

**Quatre entrent**, toutes sur des pièces que ce lot redessine :

| sujet | attendu | dessiné | mesuré (attaque / défense) |
|---|---|---|---|
| `meute j` | infanterie | structure | 0 vs 25 · 6 vs 59 |
| `guetteur j` | infanterie | structure | 6 vs 127 · 8 vs 128 |
| `carapace j` | véhicule | structure | 76 vs 118 · 62 vs 157 |
| `frappeur j` | structure | infanterie | 66 vs 63, **trois pixels** |

Chacune porte sa raison et son compte, et **chacune est assertée ENCORE violée** :
le jour où l'art est corrigé, le test tombe et quelqu'un retire la ligne.

⚠ **Un assouplissement, dit comme tel.** Le seuil des combinaisons mesurées hors
dettes descend de 45 à 42 : les exceptions couvrent huit combinaisons au lieu de
quatre. **Mesuré : 44 sur 56.** La borne suit le fait, elle ne le déguise pas.

⚠ Le témoin du décodeur change de fichier ET de verdict, et les deux se
déclarent : `off_j_pilon_s` n'existe plus, `off_j_pilon_tourelle` est redessiné —
**179 pixels de véhicule hier, 200 de structure aujourd'hui** sur 2 584 opaques.
Un nombre de témoin ne se recopie pas d'un lot à l'autre.

---

## 8. Relevé dans Chromium

Géométrie du S25 FE (360 × 780 CSS, dpr 3), sur une partie fabriquée par le
MOTEUR — Chantier monté, QG de défense posé et monté, puis les neuf pièces
posables placées sur les premières cases que `problemesDeLaPoseDEffectif`
accepte. Aucune coordonnée écrite à la main.

**Écran de la base, bande Défense** — 13 jetons, **6 couches tournantes** :

| pièce | côté | case | dy | transformation |
|---|---:|---:|---:|---|
| Tourelle mitrailleuse | 33,6 | 36 | −5,7 | `matrix(-1, 0, 0, -1, 0, 0)` |
| Canon anti-char | 33,7 | 36 | −5,7 | idem |
| DCA | 33,8 | 36 | −5,7 | idem |
| Mirador | **40,3** | 36 | −3,4 | idem |
| Artillerie lourde | 37,8 | 36 | −3,3 | idem |
| SAM | 34,8 | 36 | −3,6 | idem |

La matrice est une rotation de **180°** : la garnison au repos regarde le
déploiement, ce que `ANGLE_PAR_DEFAUT` dit. Les côtés retombent sur les ancres —
36 × 111,95 % = 40,3 pour le Mirador, 36 × −15,74 % = −5,67 pour le décalage des
trois tourelles de contact. `pointer-events: none` sur les six.

**Écran Offense** — 5 couches tournantes, **transformation identité** (l'armée au
repos regarde le nord), côtés 11,0 et 22,1 px pour une vignette de 26.

**Zéro erreur de page, zéro débordement horizontal, sur les deux écrans.**
Captures : `rapports/SPRITES-V2-ecran-base-garnison.png` et
`rapports/SPRITES-V2-ecran-offense.png`.

⚠ **Un piège de montage, pour la prochaine fois** : sur `file://` l'origine est
opaque et `localStorage` **ne survit pas à un rechargement**. Il faut semer la
sauvegarde par `addInitScript`, avant que le moindre script ne tourne, dans le
même document.

---

## 9. Écarts au brief, déclarés

**1. `tools/tourelles.py` n'est PAS « sans objet ».** Le brief le range parmi les
deux outils qui partent. Mesuré : c'est **le seul producteur des six tourelles et
du merlon de l'OUVRAGE**, que le lot ne redessine pas. Il est RÉDUIT à ce camp-là
— `ECRITES` se dérive de `CELLULES`, `MERLONS` ne garde que la planche de
l'Ouvrage, `CELLULE_ISOLEE` vaut 0 — et **il lit toujours les seize planches
`T*`** : son canevas est dimensionné sur la plus grande demi-portée des seize, et
n'en lire que six déplacerait tous les pivots.

**2. `tools/connexions.py` DOIT partir, et le brief ne le nomme pas.** Il produit
exactement les vingt-quatre socles à amorce que le lot retire. Il est supprimé.

**3. La formule du rendu.** Voir §3 — c'est l'écart le plus important, et il est
mesuré des deux côtés.

**4. Les emprises des socles ne sont pas ajustées.** Voir §3 : le débordement est
déclaré et borné, pas corrigé.

**5. La base de référence a changé.** Le brief est écrit contre `main` à
`8936f7d` et dit « si un merge est passé depuis, les comptes de ce brief sont à
revérifier, pas à recopier ». `origin/main` est à `49b4ebf` — trois lots plus
loin. **Les comptes ont été revérifiés** : les cinq effectifs de famille, les
noms des tables, les signatures. Ils tenaient tous.

**6. `art/reserve/` entre**, avec les dix fichiers que le brief met « en
réserve » : les quatre poses de canon des aéronefs et leur script de montage, les
quatre tourelles de blindé de la V1. Ce n'est **ni une source ni une attente** —
`art/sourcesstandby/` porte ce qui n'est pas PRÊT, celui-ci ce qui est prêt et
que le lot écarte. La troisième assertion d'`entrees.py` couvre désormais les
**deux** dossiers, et les deux rendent « 0 lu par la chaîne ».

---

## 10. Ce qui a été trouvé en chemin

**Une collision de nom dans `art/sources/`.** `def_j_creneau.png` existait
déjà — 1024 × 1024, onze couleurs, dormante depuis toujours — et la source v2
porte le même nom : elle l'a écrasée. L'original a été restauré par
`git checkout` et renommé `def_j_creneau_v1_ECARTE.png`, l'idiome `_ECARTE` du
dépôt. **`art/sources/` ne s'ampute jamais.**

**Deux outils écrivaient dans `art/sources/`.** `ancres-defense.py` et
`ancres-blindes.py` déposaient des PNG recentrés dans `art/sources/centrees/` ;
rien n'y est un produit, tout y est un original. Mesuré avant de retirer : **les
onze planches de tourelle sont DÉJÀ carrées et centrées sur leur pivot** —
`def_j_casemate` fait 720 × 720 pour un carré recalculé de 720, onze « OUI » sur
onze —, donc l'écriture ne produisait rien. Retirée ; **les deux JSON se
régénèrent identiques**.

**`ancres-blindes.py` portait un avertissement permanent** — « ⚠ SOURCES
ABSENTES : off_j_pilon_chassis_def ». Un avertissement qui s'affiche à chaque
exécution cesse d'être lu. La liste de poses se dérive maintenant de
`pilon.defense.present === false` dans `combat.js`, et une source qui DEVRAIT
exister fait LEVER.

**`RACINE` se dérive de `__file__`.** Copier `chassis.py` hors du dépôt pour le
contrôle des dix ancres faisait pointer `SRC` dans le bloc-notes, sans erreur.
La copie de contrôle a été mise dans `tools/` et retirée aussitôt après.

**Le `repr` de Python n'est pas du JavaScript.** Les booléens du JSON d'ancres
sortaient en `mesure: True` dans les fichiers générés — `ReferenceError: True is
not defined` au premier import.

---

## 11. Les six montages du brief

| | Ce qu'il demande | Où | Verdict |
|---|---|---|---|
| **0** | les lourds plus gros que les légers, dans les deux poses | `sprite.test.js` | **écrit** — Percheron 31 gros pixels contre 19,5 pour le Chasseur, et l'écart est borné à ×1,4 au moins |
| **0 bis** | rien ne sort de sa case, tourelle tournée comprise | `sprite.test.js` | **écrit, et il TOMBE sur les six socles** — le débordement est mesuré, déclaré et borné (§3) |
| **1** | les ancres transcrites valent leur source | `sprite.test.js` | **écrit**, sur les DEUX sections de chaque JSON, et `cote_case_pct` est REFAIT au lieu d'être relu |
| **2** | aucun nom demandé n'est absent de l'atlas | `sprite.test.js` | **écrit** — et il exige en plus qu'une cible ne change PLUS le nom |
| **3** | la tourelle ne sort pas de son carré en tournant | `sprite.test.js` | **écrit** — les onze tiennent, le pire à **31,69 sur 32** |
| **4** | aucun sprite mort ne subsiste | `sprite.test.js` | **écrit** — la liste des dormants passe de quinze à **zéro** |
| **5** | la chaîne est déterministe | outils | **VERT** des deux côtés |

⚠ **Le montage 3 dit une chose qu'il faut savoir avant de retoucher un dessin** :
la marge est de **trois dixièmes de pixel** sur le pire des onze. Ces sprites
sont calibrés au plus juste ; un canon allongé d'un pixel ferait tomber le test,
et il aurait raison.

⚠ **Et le montage 0 bis a été écrit APRÈS la mesure, pas avant.** Sa première
version asserterait que tout tient — ce qui aurait obligé soit à baisser
`echelle` sans arbitrage, soit à assouplir le test. Il asserte ce qui EST, dans
les deux sens : les coques tiennent, les socles débordent, et le pire est nommé
au centième.

---

## 12. Les tests

**Vingt-neuf sortent, dix-huit entrent, le compte passe de 1 128 à 1 117.**

Ce qui sort — **tous avec leur sujet, et chacun déclaré dans le fichier qui le
perd** : neuf gardes du chaînage, quatre de la quantification sur seize secteurs,
et les gardes de sprites qui nommaient les orientations dans les noms de fichier.

**Aucune assertion n'a été assouplie sauf le seuil d'accent de §7**, qui se dit.

**Treize gardes changent de cible, SIX se resserrent :**

- le `transform` de la grille — l'exception se retire du texte AVANT le comptage,
  la ligne exceptée doit exister, et **`pointer-events: none` est asserté**, ce
  qui est ce qui rend l'exception sûre ; deux cibles s'ajoutent, `.case` et
  `.jeton` ;
- les ancres — les DEUX sections de chaque JSON, et `cote_case_pct` **refait**
  depuis `cote_pct_embase` et `echelle` au lieu d'être relu, ce qui est la seule
  assertion qui relie les deux moitiés ;
- les noms composables — une cible ne doit PLUS changer le nom d'une pièce, ce
  que l'ancienne formulation ne pouvait pas demander ;
- la tourelle du blindé — même exigence, sur l'unité ;
- les liaisons — la garde est **retournée** : elle exigeait que les socles à
  liaison soient exactement les trois tourelles, elle exige qu'il n'y en ait
  AUCUN, dans les deux camps ;
- `T7` de `rendu.test.js` — l'enregistreur compte et ORDONNE désormais
  `save`, `translate`, `rotate`, `restore` : un `save` sans son `restore` fait
  tomber la séquence exacte.

⚠ **Deux témoins ont dû changer de famille, et il faut dire pourquoi.** L'appât
de la garde des trous lisait les coques du joueur — 2 694 px d'ouvertures sur la
V1 ; les neuf coques de la v2 n'en portent plus que **13**, Ethan les ayant
redessinées pleines. Un seuil laissé à 2 000 aurait fait tomber la garde sur de
l'art SAIN, et le baisser sur la même famille aurait rendu l'appât muet — 13 px
ne distinguent pas un compteur qui marche d'un compteur à zéro. Il lit les
bâtiments du joueur, qui portent de vrais ajours.

---

## 13. Ce qui n'a pas été fait, et pourquoi

- **L'art de l'Ouvrage** — hors lot, dit par le brief. Ses quinze défenses, ses
  vingt-deux unités et les trente-quatre bâtiments des deux camps restent la V1.
- **Les quatre poses de canon des aéronefs** et **les quatre tourelles de blindé
  de la V1** — en réserve, `art/reserve/`.
- **Aucune retouche de dessin.** Les quatre dettes d'accent sont déclarées, pas
  corrigées.
- **`echelle` n'est pas baissé** pour faire tenir les six socles. C'est un
  arbitrage, et il revient à Ethan.
- **La version n'est pas bumpée.** Le brief l'interdit — « ne proposer aucun
  numéro de version » — et `CLAUDE.md` §5 veut que ce soit Ethan qui tranche. Le
  livrable CHANGE (il maigrit d'un mégaoctet), donc **un bump sera dû au merge**.
- **La PR est ouverte, pas mergée.**
