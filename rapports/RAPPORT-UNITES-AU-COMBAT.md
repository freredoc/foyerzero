# RAPPORT — lot UNITÉS-AU-COMBAT : la scène passe aux sprites

Toutes les grandeurs sont **mesurées par exécution**.

---

## 1. Ce qui a été produit

| Grandeur | Valeur |
|---|---|
| Version | **0.45.0 · build 46** — restées des **chaînes** |
| `npm run check` | **589 pass / 0 fail** (582 avant, **+7**) |
| `dist/index.html` | **1 073 238 octets**, delta depuis 859 646 : **+213 592** |
| Borne T10 | relevée **900 000 → 1 150 000**, raison écrite |
| Marge réelle | **76 762 octets, soit 6,7 %** |
| `atlas.py --verifier` | `7 identiques, 0 différent, 0 nouveau` |
| `planches.py --verifier` | `88 identiques, 2 différents, 0 nouveau` — les deux ÉCART voulus |

Les cinq chiffres de référence du brief ont tous été retrouvés avant de
commencer : `main` à `e16eed2`, 582 pass, 859 646 octets, 0.44.0 · build 45.

Poids base64 mesurés, **identiques à ceux du brief** : unité 66 861, châssis
20 429, tourelle-unité 120 774 — **208 064 octets**. La taille réelle est
inférieure de 2 762 octets à l'estimation (1 073 238 contre ≈1 076 000).

---

## 2. La primitive `sprite`

`scene.js` **reste pur** — vérifié sur la source décommentée : zéro `drawImage`,
zéro `getContext`, zéro `HTMLImage`. `canvas2d.js` ne connaît que `drawImage` et
ne prend **aucune** décision : zéro `imageSmoothing`, zéro `celluleDuSprite`.

### ⚠ ÉCART ASSUMÉ : la primitive porte son rectangle SOURCE

Le brief la donne comme `{ forme: 'sprite', famille, nom, x, y, l, h }`. Elle
porte en plus `sx, sy, sl, sh`.

**Raison, et elle vient du brief lui-même** : « `canvas2d.js` reste bête […] ni
choix de nom, ni calcul de position ». Or `drawImage` a besoin de savoir OÙ
découper dans l'atlas. Faire ce calcul dans l'exécutant l'obligerait à lire
l'index des atlas et à multiplier un rang par un côté — c'est-à-dire un calcul de
position, ce qu'il n'a jamais fait pour aucune autre forme. Les quatre nombres se
calculent une fois dans `scene.js` ; l'exécutant recopie huit nombres.

`nom` est conservé bien que rien ne le lise au dessin : il rend la primitive
lisible en test et en débogage.

`imageSmoothingEnabled = false` est posé dans **`ui/banc.js`**, chez celui qui
crée le contexte, avec le commentaire qui dit pourquoi.

---

## 3. ⚠⚠ CE QUE LE LOT A DÉCOUVERT : T8 AVAIT RAISON

Le premier jet ne branchait que `listeAffichage`, comme le brief le scope.
**T8 est tombé** : « les 14 unités se dessinent à l'identique dans l'Arsenal et
sur le champ ». Son commentaire dit pourquoi il existe — « sans quoi le joueur
apprendrait un vocabulaire visuel dans l'éditeur et en découvrirait un autre au
combat » —, et c'est la raison d'être du dispatch unique `dessinerEntite`.

**Assouplir ce test aurait été retirer le garde-fou qui venait de faire son
travail.** Les listes qui ont un IDENTIFIANT d'unité sont donc passées aux
sprites ensemble : `listeAffichage`, `listeArsenal`, `listeDefense`.

### La légende reste géométrique, et légitimement

`ENTREES_LEGENDE` liste des couples **classe × accent** — « escouade à accent
véhicule » —, pas des unités nommées. Elle n'a aucun identifiant à résoudre, et
surtout c'est l'**accent** qu'elle explique, ce qu'un sprite ne porte pas. Elle
garde le vocabulaire géométrique, ce qui reste cohérent : elle dit « ce qui est
rond tire loin », pas « voici un Bélier ».

---

## 4. ⚠⚠ UNE PERTE D'INFORMATION DE JEU, À TRANCHER PAR ETHAN

**Les unités n'affichent plus leur accent.** Une escouade émettait six primitives
dont un casque à la teinte de sa colonne de dégâts dominante ; elle émet
maintenant un sprite, qui ne porte pas de couleur.

`accentDe` reste juste et testée par T6. C'est son **affichage sur l'unité** qui
disparaît, et il ne survit que dans la légende.

**Le lot n'a pas tranché seul.** L'assertion d'accent de T8 n'a pas été retirée,
elle est **RETOURNÉE** : elle exige maintenant qu'aucune couleur d'accent ne
paraisse, ce qui fera tomber le test le jour où quelqu'un rajoutera un bandeau
sans que la décision soit prise.

Les deux issues se tiennent :
- l'accent revient en **troisième couche**, un bandeau mince par-dessus le
  sprite — l'information de jeu est préservée, le dessin est moins pur ;
- le joueur lit le type d'une unité à sa **silhouette**, et l'accent reste un
  outil de légende.

---

## 5. La décision du §3 : la position d'orientation

**Retenu : la position INTERPOLÉE, pour le tireur ET la cible.**

⚠ **Le scintillement a été MESURÉ avant de trancher, pas supposé :**

| approche | sprites traversés | par rangée |
|---|---:|---:|
| 9 rangées, cible droit devant | **3** (`nne` `ne` `ene`) | 0,33 |
| passage à 1 colonne d'écart, 4 rangées | **7** | 1,75 |

C'est loin de tout ce qui clignoterait. Viser la position du tick ferait pointer
la tourelle vers là où la cible **était**, pendant que le joueur la voit
ailleurs — d'autant plus visible que le canon est long. Le tireur est interpolé
lui aussi : viser juste depuis une case fausse rendrait le même décalage.

**Si l'essai appareil contredisait cette mesure**, le repli est la position du
tick, et il tient dans la fonction `cibleAffichee` de `listeAffichage`.

---

## 6. Deux défauts trouvés en chemin, tous deux par des tests

1. **Le descripteur recevait une entité de combat.** Une entité range son
   ordonnée dans `rangeeMilli` ; `orientationVers` attend des rangées. T6 a levé
   « orientationDeLAngle : NaN n'est pas un angle ». La position est maintenant
   explicite, et c'est l'appelant qui la convertit — lui seul sait s'il veut
   celle du tick ou l'interpolée.
2. **La famille était écrite `tourelle-unite` au lieu de `tourelle_unite`.**
   C'est le piège que le brief signale en §4 : le slug prend un souligné parce
   qu'il devient une clé JavaScript. T6 a levé « famille absente de l'atlas » en
   nommant les sept familles cousues, ce qui a dit la faute immédiatement.

⚠ **Et le brief se trompe sur un point vérifiable** : il dit `y_pct` négatif sur
les dix ancres. **Mesuré : neuf sur dix.** `off_j_fendeur_chassis_def` vaut
**+1,0**. Un test qui asserterait « toutes négatives » serait faux et, pire,
inviterait à « corriger » une donnée juste. Le test compare les valeurs signées à
la source, ce qui reste vrai quel que soit le signe, et un second asserte la
liste exacte des exceptions.

---

## 7. Les tests du §5 — verdict et montage

| # | Test | Verdict | Montage effectif | Falsification → rouge |
|---|---|---|---|---|
| 1 | T7 tient | **PASS** | séquence exacte étendue d'un `drawImage` ; comptage `drawImage` = primitives `sprite`, plus une assertion que la scène en porte | — |
| 2 | `sprite` sans atlas LÈVE | **PASS** | trois cas — sans atlas, atlas vide, atlas correct ; **le témoin passe d'abord** | — |
| 3 | Chaque entité résout | **PASS** | 14 unités × 2 propriétaires × 2 camps = 56 descripteurs, chaque nom confronté à l'atlas | — |
| 4 | Le blindé rend 2 couches ordonnées | **PASS** | **indices comparés**, pas la présence ; et l'Ouvrage en rend 1 | coque au-dessus → **2 rouges** |
| 5 | La pose suit la FORCE | **PASS** | unité **choisie parmi celles qui ont une pose `_def`**, sinon égalité triviale | force figée à `armee` → **2 rouges** |
| 6 | Les huit poses `_def` figées | **PASS** | listes exactes des 8 et des 6 ; **plus un balayage qui refuse ces noms en dur dans `scene.js`** | liste écrite en dur → **2 rouges** |
| 7 | La tourelle suit sa cible | **PASS** | deux azimuts, **assertés distincts d'abord** ; cible nulle → défaut, par force | orientation figée → **1 rouge** |
| 8 | Ancres = JSON du disque | **PASS** | clés et 40 valeurs **signées**, plus la liste des exceptions de signe | un signe inversé → **1 rouge** |
| 9 | Les ancres restent dans la coque | **PASS** | 10 coques, disque dans la boîte ; **appât à 200 % qui en sortirait** | — |

### L'audit des assertions

| Fichier | avant | après | |
|---|---:|---:|---|
| `rendu.test.js` | 114 | **126** | +12 |
| `arsenal.test.js` | 108 | **110** | +2 |
| `sprite.test.js` | 66 | **114** | +48 |
| `banc.test.js` | 74 | 74 | = |

**Net : +62.** Les assertions retirées du diff sont toutes remplacées par une
équivalente ou une plus forte :

| Retirée | Remplacée par |
|---|---|
| borne T10 à `900_000` | la même à `1_150_000`, raison écrite |
| T3 : `yCorps` sur `kakiCorps` | `ySprite`, valeurs **recalculées** (718/717), plus une assertion que les deux diffèrent |
| T5 : `iUnite` sur `kakiCorps` | `iUnite` sur `forme === 'sprite'` — l'ordre testé est intact |
| T5 : total 53 | total **44**, calculé depuis `NB_PRIMITIVES` |
| T6 : couleur sur toute primitive | idem **hors sprites**, plus deux assertions que le saut ne cache pas tout |
| T8 : l'accent paraît | **l'inverse** : aucun accent ne doit paraître — voir §4 |

⚠ **`NB_PRIMITIVES` change pour la première fois de nature** : `blinde: 2` vaut
pour le JOUEUR, l'Ouvrage en émettant un seul. C'est écrit dans la table.

---

## 8. Les vérifications appareil — toutes NON EXÉCUTÉES

| Vérification | État |
|---|---|
| Les unités apparaissent au **premier** chargement, pas au second | **NON EXÉCUTÉE** |
| La tourelle est **sur** sa coque et tourne vers ce qu'elle tire | **NON EXÉCUTÉE** |
| Les blindés en défense montrent leurs chenilles à l'horizontale | **NON EXÉCUTÉE** |
| Le pixel art n'est pas lissé | **NON EXÉCUTÉE** |

⚠ **Le piège du décodage est traité en code**, pas seulement signalé : `dessiner`
ne peint rien tant que les trois atlas ne sont pas décodés
(`complete && naturalWidth > 0`, la garde de `ui/monde.js`), et un écouteur
`load` par atlas rappelle `dessiner` à leur arrivée. **Cela ne remplace pas
l'essai** : le défaut ne se reproduit qu'au premier chargement, cache vide.

### Les six vérifications qui traînent depuis trois lots

Elles ne sont **toujours pas exécutées**, et elles s'ajoutent aux quatre
ci-dessus : le bavement entre cellules d'atlas, le sens des tourelles de la bande
de défense, le socle sous la tourelle, le raccord des merlons, le sens de
`qg_de_defense` / `centre_de_commandement`, et la lisibilité des seize bâtiments
à ~42 px. **Dix en tout.**

---

## 9. Écarts par rapport au brief

1. **La primitive porte son rectangle source** — §2, justifié par le principe que
   le brief pose lui-même.
2. **Trois listes passent aux sprites, pas une** — §3, parce que T8 est tombé et
   avait raison.
3. **La légende reste géométrique** — §3, elle n'a pas d'identifiant à résoudre.
4. **`y_pct` : neuf négatifs sur dix, pas dix** — §6, mesuré.
5. **La taille réelle est inférieure de 2 762 octets à l'estimation.**

---

## 10. Points laissés en suspens

1. ⚠⚠ **L'accent des unités a disparu de l'écran** — §4. C'est la décision la
   plus importante à rendre, et elle est de jeu, pas de code.
2. **Dix vérifications appareil en attente**, dont quatre nées de ce lot.
3. **Les explosions, la carte du monde et les bâtiments au combat** restent hors
   lot, comme le brief le pose. Le premier est un lot de MODÈLE : `retirerLesMorts`
   ne publie aucun événement de mort, il n'y a rien à quoi accrocher une animation.
4. **`carte` et `effet` sont les deux dernières familles non cousues.** Le
   livrable a atteint sa taille de croisière : la prochaine hausse de borne
   viendra d'elles.
