# RAPPORT — lot OUVRAGE-CÂBLAGE

Brancher les quarante-deux sources v2 de l'Ouvrage commitées le 07/09, et retirer
les neuf sprites v1 qu'elles rendent inutiles.

**Version produite : `0.99.29` · build `131`.** Le livrable change de 38 927
octets, donc le bump est dû.

---

## 0. Ce qu'il faut lire en premier

⚠⚠ **`recadrer` POSAIT SON FOND EN MAGENTA ÉCRIT EN DUR, ET 31 DES 42 SPRITES
SONT SORTIS AVEC LEUR CLÉ VERTE EN PIXELS OPAQUES.** Trouvé en mesurant, pas en
relisant, et après une première mesure du livrable qui annonçait un gain. C'est
le point le plus coûteux du lot et il est détaillé au §4.

⚠⚠ **L'ART DE L'OUVRAGE NE SUIT PAS LA TABLE DE DÉGÂTS — DIX-NEUF COMBINAISONS
SUR VINGT-HUIT.** Le lot ne corrige pas l'art : le brief l'interdit. Il le MESURE
et le GARDE. §6.

⚠ **L'ÉCRAN DE RAID N'A PAS ÉTÉ VU, ET SE DÉCLARE NON EXÉCUTÉ.** §8.

---

## 1. La base de départ, et elle était ROUGE des deux côtés

`git checkout -B claude/sprite-refonte-9il369 origin/main`, à `214415d`.

| | Verdict |
|---|---|
| `npm ci && npm run check` | **1 407 pass / 1 fail** |
| `python3 tools/verifier.py` | **arrêté au premier maillon**, sortie 1 |

Les deux échouent sur la MÊME chose, et c'était prévu : la garde d'entrées.
Ethan a commité les 46 sources sur `main`, `entrees.py --declarer` n'a pas été
rejoué, donc quarante fichiers sont « NI CONSOMMÉE NI DORMANTE ». C'est le fait 3
du brief, et c'est ce lot-ci qui le referme. **Quatrième fois du dépôt** — le
même motif qu'aux lots SON-MOTEUR, SON-CATALOGUE, SON-CÂBLAGE et MUR-PEINT.

⚠ **Conséquence sur le vérificateur de départ : il n'a jamais atteint la
comparaison des sprites.** `entrees` est le dernier maillon de `CHAINE` mais il
sort en 1, et la course s'arrête là. Le dépôt n'a donc pas de verdict « avant »
sur les sprites ; celui d'après est au §9.

### Les quatre faits du §1 du brief, vérifiés et non recopiés

1. **46 sources** — vérifié : 42 de l'Ouvrage + `off_j_meute`, `off_j_meute_def`,
   `off_j_guetteur`, `off_j_guetteur_def`. Le découpage par famille du brief
   tombe juste : 9 escouades, 4 aéronefs, 9 coques, 5 tourelles de blindé,
   6 socles, 6 tourelles de défense, 3 monolithiques.
2. **Les quatre JSON d'ancres se reproduisent** — `ancres-defense.py`,
   `ancres-blindes.py` et `ancres-ouvrage.py` rejoués : `git status` vide.
3. **40 sources non déclarées** — vérifié par l'échec ci-dessus, qui les nomme.
4. **Aucune orientation v1 de l'Ouvrage ne subsiste** — vérifié : `unite/64`
   porte 22 `off_o_*`, dont exactement les **neuf** monolithes de blindé que le
   brief liste. Aucun suffixe `_n`, `_ne`, `_e`…

---

## 2. Ce qui a été fait, fichier par fichier

### A. `tools/ouvrage_v2.py` — et il n'a pas de table à lui

**Écart au brief, déclaré.** Il demandait « la table des tâches couvre 42
entrées » dans le fichier neuf. Mesuré avant d'écrire : les huit listes
d'identifiants de `joueur_v2.py` décrivent EXACTEMENT le camp de l'Ouvrage
aussi. Ethan a livré la même découpe des deux côtés sans qu'aucune consigne ne le
lui demande.

Écrire ici une seconde table de quarante-deux lignes identiques au changement
d'une lettre près aurait été la seconde vérité que `CLAUDE.md` §4 interdit.
`joueur_v2.taches` prend donc une lettre de camp, **de défaut `'j'`**, et
`ouvrage_v2.py` l'appelle avec `'o'`. Que le joueur n'ait pas bougé n'est pas une
relecture : `tools/verifier.py` rejoue `joueur_v2.py` et compare ses
quatre-vingt-quatre fichiers à l'octet.

Les trois vraies différences sont celles du brief : `pal(True)` — l'Ouvrage EST
ardoise —, la clé verte, et la lettre de camp.

⚠ Le Frappeur à ×0,90 et les trois artilleries à ×1,10 ne sont **pas** entrés.

### B. Les ancres, fusionnées dans les tables existantes

`ANCRES_BLINDES` **9 → 18**, `ANCRES_DEFENSE` **6 → 12**, `TOURELLES_BLINDES`
**5 → 10**, `TOURELLES_DEFENSE` **6 → 12**.

Elles sont indexées par NOM DE SPRITE, donc `socle_def_o_casemate` ne peut pas
entrer en collision avec `socle_def_j_casemate`. **Et la collision est ASSERTÉE,
pas supposée** : toute la sûreté de la fusion tient à ce qu'aucune clé ne soit
dans les deux fichiers, et un outil qui écrirait la mauvaise lettre la casserait
en silence — la seconde valeur écraserait la première dans l'union, et le test
resterait vert sur une table à moitié fausse.

### C. `src/render/scene.js` — trois sites, un seul de code

- **C1** `couchesDeLUnite` : le `|| c === 'o'` disparaît, les deux `off_j_`
  deviennent `off_${c}_`. Trois retouches.
- **C2** le paragraphe « L'OUVRAGE NE TOURNE PAS » : **réécrit, pas supprimé**.
  Le CODE de `couchesDeLaDefense` n'a pas changé d'une ligne, et les six défenses
  de l'Ouvrage se mettent à tourner **par la seule arrivée de leurs ancres**.
  C'est « le discriminant est la DONNÉE, jamais le camp » mesuré plutôt
  qu'annoncé : un `=== 'o'` écrit le 05/09 aurait dû être RETIRÉ ici.
- **C3** `NB_PRIMITIVES.blinde` : l'exception disparaît. C'était la SEULE entrée
  de cette table dont la valeur dépendait d'autre chose que de la classe.

⚠ **Un quatrième site, que le brief ne nommait pas.** L'en-tête de `scene.js`
mesurait la rampe de l'Ouvrage sur `off_o_ratisseur` — un fichier que ce lot
retire, et un sprite QUANTIFIÉ, ce que la chaîne ne fait plus depuis PIXELS. Un
commentaire qui nomme un fichier absent envoie chercher ce qu'on ne trouvera pas.
Remesuré sur `off_o_ratisseur_chassis` : **623 pixels opaques pour 564 teintes
distinctes**, dominantes `#A59AB2`, `#9C93A8`, `#675A74`, `#AAA0B7`, et **99,0 %
des pixels portent plus de rouge ET plus de bleu que de vert**. La conclusion
tient, plus largement qu'avant.

### D. L'atlas

`unite` **35 → 26**, `chassis` **9 → 18**, `tourelle-unite` **5 → 10** dans
`FAMILLES` ; `socle` et `defense` gardent leur compte.

⚠ **`atlas.py` refuse d'écraser un atlas qui ne se reproduit pas**, et il a
raison sur dix des dix-huit : l'encodeur WebP de cette machine diffère de celui
qui les a produits. Le drapeau `--forcer` est **par famille** : il a été passé
sur les cinq que le lot change, et sur elles seules. **Après : 17 identiques ·
3 différents**, et les trois sont `carte-64`, `carte-128` et `interface-128`, que
ce lot ne touche pas — divergence préexistante, documentée au lot PICTOGRAMMES.

### E. Les retraits, et il y en a plus que le brief n'en nommait

Les neuf monolithes partent. Leurs sources v1 restent au dépôt et passent
`dormantes`.

⚠⚠ **Le brief demandait de VÉRIFIER si `unites_ouvrage.py` et `tourelles.py`
deviennent sans objet. Mesuré outil par outil, sous `FZ_SPRITES` dans un dossier
temporaire — et ils sont QUATRE, pas deux :**

| Outil | Produit | Verdict |
|---|---|---|
| `unites_ouvrage` | **22 sprites** | superseded — dont les NEUF monolithes qu'on retire |
| `tourelles` | **7 sprites** | superseded — 6 tourelles de défense + merlon |
| `socles` | **6 sprites** | superseded |
| `barrieres` | **2 sprites** | superseded — ronce et herse |

Les quatre **sortent de `CHAINE`** et **restent au dépôt** — le brief interdit de
les supprimer, et c'est l'idiome de `bords.py` depuis MUR-PEINT. Les laisser
produire écraserait `ouvrage_v2` et recréerait les neuf monolithes à chaque
exécution. ⚠ `planches.py` a été vérifié aussi : il n'écrit pour l'Ouvrage que
ses cinq bâtiments, aucun conflit.

### F. Les entrées

`entrees.py --declarer` puis `--verifier` : **416 / 416 · 142 / 142**, VERT.
`art/sourcesstandby/` 34 fichiers 0 lu, `art/reserve/` 10 fichiers 0 lu.

---

## 3. Le coût, poste par poste

Contre un livrable **rebâti dans un `git worktree`** depuis `214415d`.

| Poste | Avant | Après | Δ |
|---|---:|---:|---:|
| images | 6 625 529 | 6 662 349 | **+36 820** |
| audio | 1 193 346 | 1 193 346 | +0 |
| JavaScript | 376 418 | 378 525 | **+2 107** |
| feuille | 125 672 | 125 672 | +0 |
| balisage | 35 537 | 35 537 | +0 |
| **total** | **8 356 534** | **8 395 461** | **+38 927** |

La somme des cinq postes tombe EXACTEMENT sur le total. **297 lignes `data:`
avant, 297 après ; 292 URI de part et d'autre** — 29 images, 263 sons.

**Borne T10 inchangée à 9 300 000**, marge **904 539 octets, 9,73 %**.

---

## 4. Le défaut : `recadrer` posait son fond en magenta écrit en dur

⚠⚠ **31 DES 42 SPRITES SONT SORTIS AVEC LEUR CLÉ VERTE EN PIXELS OPAQUES.**

`recadrer` faisait deux choses avec le magenta : `est_fond(a[...,:3])` pour
trouver la boîte englobante du sujet, et `Image.new('RGBA', …, (255,0,255,255))`
pour remplir la boîte. `est_fond` ne connaît QUE le magenta. Sur une source
verte, elle ne voit aucun fond : la boîte englobante devient la planche ENTIÈRE,
le sujet sort rétréci, et le vert reste opaque.

**Mesuré, grille 64 :**

| Sprite | Vert opaque / opaques |
|---|---|
| `off_o_crecelle` | **1 935 / 2 500 — 77 %** |
| `off_o_busard` | 1 867 / 2 500 |
| `off_o_frappeur` | 1 842 / 2 500 |
| `def_o_herse` | 1 838 / 3 364 |
| … | … |
| **31 fichiers** | **42 690 pixels verts** |

⚠ **Les onze tourelles y échappaient, et pour une raison qui le confirme** :
elles passent en mode `carre`, donc elles ne traversent pas `recadrer`.

⚠⚠ **`CLAUDE.md` §6 l'avait annoncé, mot pour mot** : « la clé verte est
PLOMBÉE, pas éprouvée. […] une source verte qui arriverait demanderait aussi
`recadrer`, dont le fond de remplissage est magenta en dur et qui appelle
`est_fond` : ce sera un lot, pas une ligne. » C'est ce lot-ci.

**Le correctif.** `recadrer` DÉTECTE la clé par `cond.cle_de_fond` — « détection,
pas paramètre : un drapeau à passer serait un drapeau à oublier sur une planche »
— et remplit avec elle ; le masque passe à `est_fond_sujet`, qui connaît les deux
clés. **`est_fond` n'est PAS touchée**, parce qu'elle DÉCOUPE aussi les planches
(gouttières d'`emblemes.cellules`, `bandes`, `pivot` de `tourelles.py`) et que la
toucher déplacerait les cellules elles-mêmes.

**Après : 0 fichier touché, 0 pixel vert.**

⚠⚠ **ET LA PREMIÈRE MESURE DU LIVRABLE ÉTAIT FAUSSE À CAUSE DE ÇA.** Avant
correction, le lot RENDAIT 21 929 octets et j'allais l'écrire. Un aplat de vert
compresse mieux que du dessin, et le sujet cadré sur la planche entière sortait
rétréci : les deux effets allaient dans le même sens. **Un gain de poids qui
n'est pas expliqué se vérifie avant d'être cru.**

---

## 5. Les six tests du brief, et leur montage réel

| | Sujet | Verdict | Montage qui le fait rougir |
|---|---|---|---|
| **T1** | JSON ↔ JS, étendue | **PASS** | ligne de `socle_def_o_harpon` retirée → « la transcription et l'union des JSON ne portent pas les mêmes clés » |
| **T2** | un blindé de l'Ouvrage émet deux couches | **PASS** | **échoue sur l'arbre d'AVANT** : « 1 couche(s), 2 attendues » |
| **T3** | la pose de garnison se LIT dans l'atlas | **PASS** | la liste des poses écrite à la main au lieu d'`existeDansAtlas` |
| **T4** | les onze tourelles de l'Ouvrage sont carrées et centrées | **PASS** | couvertes par la garde existante des vingt-deux |
| **T5** | plus aucune trace des neuf monolithes | **PASS** | `const x = 'off_o_ratisseur';` déposé dans `src/` |
| **T6** | le joueur n'a pas bougé | **PASS** | assertion EXISTANTE, non modifiée |

⚠ **Écart au brief sur T1, déclaré.** Il annonçait « six couples
`(fichier, section)` après ce lot ». Mesuré : **huit**. Les deux JSON neufs
portent CHACUN deux sections — `coques`/`socles` ET `tourelles` —, et le test
existant confrontait déjà les deux moitiés de chaque fichier. Quatre couples
avant, quatre qui entrent.

⚠ **T5 lit la source DÉCOMMENTÉE**, et son motif est borné à droite : `off_o_`
suivi d'un des cinq identifiants et de rien qui continue le mot. Sans la borne,
il trouverait `off_o_ratisseur_chassis` et passerait toujours. Quatre appâts
prouvent qu'il voit encore le nom nu et la pose `_def`, et qu'il n'accuse ni la
coque ni la tourelle.

---

## 6. L'accent de l'Ouvrage — un fait, pas neuf dettes

Confronté à `accentDe`, ce camp diverge sur **dix-neuf combinaisons sur
vingt-huit**, et les dix-neuf divergent **dans le même sens** : c'est l'accent
`infanterie` qui l'emporte. **Vingt-sept des vingt-huit sont dominées par le
rouge.**

La seule qui ne l'est pas est la Carapace en ATTAQUE — véhicule **98** contre
**88**. Et sa pose de GARNISON bascule : **94 contre 95, un pixel**. C'est pour
ça que la table mesurée porte la POSE et pas seulement l'unité : une table
indexée par unité aurait dû trancher entre les deux et aurait menti sur l'autre.

⚠⚠ **Les inscrire en dettes aurait retiré neuf unités de toute mesure** — la
moitié du camp cesserait d'être gardée, et un fait unique se serait déguisé en
série de petits défauts. Elles sont au contraire confrontées à leur dominante
**mesurée**, pose par pose : les vingt-huit restent gardées, sans une seule
exception, et un retouchage d'art les fait rougir **dans les deux sens** — celui
qui casse comme celui qui répare. La divergence, elle, est COMPTÉE.

⚠ **Le seuil du joueur passe de 42 à 20, et ce n'est pas une borne qu'on
baisse** : c'est le même compte sur un ensemble plus petit. Le joueur porte
14 unités × 2 poses = 28 combinaisons, moins les quatre dettes du 05/09 qui en
écartent huit, donc **20 sur 28 — 71 %, la même proportion qu'avant**.

⚠ **Et `fichiersAffiches` portait la même seconde vérité que `scene.js`** — un
`&& lettre === 'j'` sur le chemin du blindé. Le laisser aurait fait chercher
`off_o_belier`, qui n'existe plus, donc écarté DIX combinaisons **en silence**.

**Le lot ne corrige pas l'art.** Le brief : « si une pièce paraît fausse, le dire
au rapport ; ne pas la corriger ». Recolorier treize sprites est une décision de
production, et elle appartient à Ethan.

---

## 7. Le carré de tourelle déborde plus à l'Ouvrage qu'au joueur

| | Joueur | Ouvrage |
|---|---|---|
| socles, portée du carré | 58,23 à **65,34 %** | 69,56 à **83,94 %** |
| coques | 16,9 à 49,8 — **toutes tiennent** | 22,50 à **50,45 %** |
| logement, hauteur sur la pièce | 10,9 à 17,6 % | **25,1 à 35,3 %** |

50 est le bord de la case. Le motif est dans le DESSIN : le socle carré de
l'Ouvrage a une haute face avant sous son plateau, et son artillerie est un
marcheur sur pattes — c'est ce que `tools/ancres-ouvrage.py` documente en passant
`decal_max = 0,40` là où le défaut de 0,22 rejetait les six. **Le canon est haut
parce que la plate-forme est haute** : le poser plus bas le mettrait dans les
pattes.

⚠ Une coque sur dix-huit déborde aussi : `off_o_fendeur_chassis_def` à
**50,45 %**, soit **un septième de gros pixel** de 32. Aucun œil ne le verra ; il
est borné quand même, séparément, pour que la valeur ne dérive pas sous couvert
d'un « les blindés débordent un peu ».

**Un test borne les deux camps SÉPARÉMENT** et nomme le pire de chaque côté au
centième. Une borne unique assez large pour les deux cesserait de garder le camp
le plus serré. **Le corriger demanderait de redessiner les socles — arbitrage
d'Ethan, pas de ce lot.**

---

## 8. Le relevé dans Chromium

Géométrie du S25 FE — 360 × 780, dpr 3.

**Bout en bout sur le livrable** : les **27 images inlinées** décodées dans la
page portent **ZÉRO pixel de clé**, verte comme magenta. C'est la mesure qui dit
que le correctif du §4 atteint vraiment le joueur.

**Non-régression du joueur**, sur une partie ensemencée par le moteur : sept
jetons, **cinq couches tournantes, toutes en `matrix(-1, 0, 0, -1, 0, 0)`** —
180°, la garnison au repos regarde le déploiement —, côtés **33,6 · 33,8 · 40,3 ·
37,8 · 34,8 px pour une case de 36**, `pointer-events: none` sur les cinq. **Zéro
erreur de page, zéro débordement horizontal.** Identique au relevé du lot
SPRITES-V2-JOUEUR.

⚠⚠ **L'ÉCRAN DE RAID N'A PAS ÉTÉ VU, ET SE DÉCLARE NON EXÉCUTÉ.** C'est le seul
endroit où l'art de l'Ouvrage se dessine, et y entrer demande une armée composée
ET une cible à portée — la garde du peuplement écarte les bases de l'Ouvrage de
quinze cases du départ, donc une partie neuve n'en a aucune. Même déclaration
qu'aux lots MUR-PEINT et ZOOM-CONTINU. Ce qui est mesuré à sa place est plus fort
qu'une capture : zéro pixel de clé dans le livrable, et les tests confrontent les
couches rendues, nom par nom, aux cellules de l'atlas.

Captures dans `rapports/`.

---

## 9. Les contrôles de chaîne

### `python3 tools/verifier.py`, et il a trouvé un second défaut

**Premier passage sur l'arbre final : 996 identiques · 0 différent · 0 nouveau ·
2 MANQUANTS**, plus une ligne `ATLAS`. Les deux manquants étaient
`ancres-blindes-ouvrage.json` et `ancres-defense-ouvrage.json`.

⚠⚠ **`tools/ancres-ouvrage.py` ÉCRIVAIT DANS LE VRAI `art/sprites/`, MÊME SOUS
`FZ_SPRITES`.** Ses deux jumeaux du joueur passent par `chemins.dossier_sprites`
depuis le 30/08 ; celui-ci portait `os.path.join(RACINE, 'art', 'sprites', …)` en
dur. Deux conséquences, et la seconde est la grave : la chaîne rejouée ne
produisait pas les deux JSON dans le dossier temporaire — d'où les MANQUANTS —,
et **le vérificateur ÉCRIVAIT dans le dossier qu'il compare**, ce que son
invariant le plus important lui interdit. Corrigé ; la lecture des nombres du
joueur passe par le même chemin, si bien que la chaîne devient self-contenue.

**Second passage, sur l'arbre FINAL : `998 identiques · 0 différent · 0 nouveau ·
0 MANQUANT`**, en **578,3 s**. Le compte passe de 996 à 998 : les deux JSON
d'ancres de l'Ouvrage sont désormais produits là où on les compare.

### La ligne `ATLAS` est PRÉEXISTANTE, et c'est mesuré des deux côtés

`atlas_faute` s'allume dès qu'un atlas diffère, et trois diffèrent : `carte-64`,
`carte-128` et `interface-128`. Ce lot n'en touche aucun. **Mesuré : `atlas.py
--verifier` rend `17 identiques · 3 différents` sur `origin/main` à `214415d`
comme sur l'arbre du lot** — le même verdict, dans un `git worktree`. C'est
l'encodeur WebP de cette machine qui diffère de celui qui les a produits ;
`tools/atlas.py` refuse d'écraser un fichier qui ne se reproduit pas, et il a
raison. **Le lot laisse ce compte exactement où il l'a trouvé.**

### Les autres

`python3 tools/entrees.py --verifier` → **416 / 416 consommées · 142 / 142
dormantes**, VERT.

**Non-régression du joueur, exigée par le brief** : `ancres-defense.py` et
`ancres-blindes.py` rejoués rendent des JSON **identiques au bit**, avant comme
après le changement de `recadrer` ET après celui d'`ancres-ouvrage.py`.

---

## 10. Les tests

**1 407 pass / 1 fail** au départ → **1 412 pass / 0 fail** à l'arrivée.

Trois tests entrent (T2, T3, T5), deux entrent par scission de l'accent, et
**cinq sont RETOURNÉS — aucun assoupli**. Chacun portait sa condition de mort :

- « le blindé de l'Ouvrage n'en a qu'une » → il en a deux, dans les deux camps ;
- « la tourelle de l'Ouvrage a gagné une ancre sans le dire » — ce test finissait
  par « il mentirait le jour où l'Ouvrage sera redessiné, **ce que cette
  assertion-ci rendra visible** », et c'est bien lui qui l'a rendu visible ;
- « les unités à pose de défense sont exactement les huit mesurées » → quatre,
  et **ce n'est pas un trou d'art** : la pose de flanc des quatre blindés a
  déménagé de `unite` vers `chassis`. Le test le VÉRIFIE plutôt que de le
  supposer ;
- `PIC T6` et `PIC T7`, deux mesures figées, réancrées **en écrivant le nombre
  d'avant à côté de celui d'après**.

⚠ **Deux gardes se RESSERRENT.** Le parse de `CHAINE` acceptait `[a-z_]+`, donc
il ne voyait AUCUN maillon `ancres-*` : douze sur quinze, et le plancher à dix
s'en satisfaisait. Il les voit tous. Et la garde de palette a lu ma propre prose
— **huitième fois du dépôt** : le paragraphe remesuré de `scene.js` nommait
quatre teintes de la v2, absentes de la fiche puisque la chaîne ne quantifie
plus. **C'est le TEXTE qui a été corrigé, pas la garde.**

---

## 11. Le verdict de la chaîne

| | |
|---|---|
| `identiques à l'octet` | **998** |
| `différents` | **0** |
| `nouveaux` | **0** |
| `MANQUANTS` | **0** |
| durée | 578,3 s |
| entrées | **416 / 416 · 142 / 142**, VERT |

⚠ Il finit tout de même sur « la chaîne ne répond pas de ses sprites », à cause
de la seule ligne `ATLAS` — **et cette ligne est vraie sur `origin/main` aussi**,
mesurée dans un `git worktree` : `17 identiques · 3 différents` des deux côtés.
Voir le §9.

---

## 12. Ce qui reste ouvert

1. ⚠⚠ **L'accent de l'Ouvrage** — dix-neuf combinaisons sur vingt-huit diverge
   de la table de dégâts, toutes vers le rouge. Mesuré, gardé, non corrigé.
2. ⚠ **Le débordement du carré de tourelle**, 83,94 % au pire. Redessiner les
   socles, ou baisser `echelle` au prix de la lisibilité du canon.
3. ⚠ **Les quatre outils hors `CHAINE`** — `unites_ouvrage`, `tourelles`,
   `socles`, `barrieres`. Ils ne servent plus ; les supprimer est un arbitrage.
4. ⚠ **Le Frappeur à ×0,90 et les trois artilleries à ×1,10**, qui attendent la
   reprise des emprises à zéro.
5. ⚠ **Le bloc rose du Merlon** — 9 428 px hors palette, signalé par
   `ORDRE-DE-COMMIT.md`, non traité et hors du périmètre du brief.
6. ⚠ **Les trois atlas `carte` et `interface`** qui ne se reproduisent pas sur
   cette machine — donc `tools/verifier.py` finit sur « la chaîne ne répond pas
   de ses sprites » tant qu'ils n'ont pas été régénérés sur la machine qui les a
   produits. **Préexistant, mesuré identique sur `origin/main`, non touché.**
