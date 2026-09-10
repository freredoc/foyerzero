# RAPPORT — lot ART-90

Points 1 et 2 de la liste d'Ethan du 10/09/2026, exécutés d'un seul lot.
Branche `claude/lot-1-cs14o0`, base `main` = `14dd4ac`.

**`GAME_VERSION` n'existe pas au dépôt** — le brief le nomme, le dépôt porte
`version` et `config.build` dans `package.json`. Les deux sont bumpés ensemble et
restent des CHAÎNES (§6 de `CLAUDE.md`, le piège du build Android) :
**0.99.37 · build 139 → 0.99.38 · build 140**.

---

## §0. Ce que la session a mesuré avant d'écrire une ligne

| mesure | attendu par le brief | mesuré |
|---|---|---|
| `npm test`, tests déclarés | 1524 | **1524** |
| verdict | 1523 pass · 0 fail · 1 skipped | **1523 · 0 · 1** (`LIMITE T8`) |
| `npm run check` | sort en 0 | **0** |
| `dist/index.html` | 9 134 181 | **9 134 181** |

SHA-256 du livrable de départ : `b0ea9251…4389b3`.

**Les dépendances de la chaîne manquaient toutes les quatre**, et c'est le piège
que le §0.4 du brief annonçait. `python3 -m pip install Pillow numpy scipy` (deux
tentatives — la première a expiré sur `files.pythonhosted.org`), puis
`apt-get install -y opus-tools`. Versions obtenues : **Pillow 12.3.0, numpy
2.4.6, scipy 1.17.1, opusenc opus-tools 0.2 / libopus 1.4**.

### `tools/verifier.py` sur l'arbre PRISTINE — relevé AVANT d'écrire

    identiques à l'octet : 1110
    différents           : 0
    nouveaux             : 0
    MANQUANTS            : 0
    durée                : 673,5 s
      ATLAS    un atlas cousu ne correspond plus à ses sprites
    VERDICT : la chaîne ne répond pas de ses sprites          → sortie 1

`python3 tools/atlas.py --verifier`, même arbre : **15 identiques · 5 différents
· 0 nouveau**, `src/data/atlas.js` identique, `atlas-empreintes.json` identique.
Les cinq ÉCART : `atlas-batiment-64`, `atlas-carte-64`, `atlas-batiment-128`,
`atlas-carte-128`, `atlas-interface-128`.

⚠⚠ **LA LIGNE `ATLAS` EST DONC PRÉEXISTANTE, ET `batiment` Y ÉTAIT DÉJÀ.** C'est
l'encodeur WebP de cette machine, mesuré : `atlas-batiment-64` recousu rend
107 058 octets pour 107 050 au dépôt (**8 octets**), `atlas-batiment-128`
299 670 pour 299 848 (**178 octets**), sur des images identiques.

⚠⚠ **ET LE §0 DE `CLAUDE.md` SE TROMPE SUR PILLOW 12.3.0.** Il annonce, du lot
PICTOGRAMMES : « sous Pillow 12.3.0 le même outil rend **0 identique / 32
différents** sur un arbre PRISTINE, et les 32 ont des PIXELS IDENTIQUES ».
**Mesuré le 10/09 sous Pillow 12.3.0 : 1 110 identiques, 0 différent.** Les PNG
de la chaîne se reproduisent à l'octet sous cette version ; ce qui ne se
reproduit pas est l'encodeur WebP des atlas, et lui seul. Le paragraphe de
`CLAUDE.md` n'est pas corrigé par ce lot — il décrit un état d'une autre machine,
et le contredire d'autorité demanderait de savoir laquelle. **Signalé.**

---

## §1. Le QG de défense et le Centre de commandement

### La prémisse a été REGARDÉE, pas déduite du brief

Les deux sources ouvertes et rendues en aperçu avant d'y toucher :

* `art/sources/bat_j_qg_de_defense.png` — une grosse **coupole vitrée** surmontée
  d'une antenne, sur un socle octogonal. C'est un centre de commandement.
* `art/sources/bat_j_centre_de_commandement.png` — quatre **modules-tourelles**
  disposés autour d'un plateau hexagonal blindé. C'est un QG de défense.

Les quatre états de chaque nom sont internement cohérents — planche de contact
des huit regardée : la coupole est la même sur `_abime`, `_tres_abime` et
`_detruit`, et le plateau à tourelles aussi. **L'inversion est donc à la source,
sur les huit fichiers**, exactement comme le brief l'annonce.

### La permutation

Trois temps (`nom → nom.tmp`, `autre → nom`, `nom.tmp → autre`), sur les quatre
états. SHA-256 **ré-extraits après** :

| fichier | avant | après |
|---|---|---|
| `bat_j_qg_de_defense.png` | `07f466cd…82b5b` | **`a1a74daa…77ca6`** |
| `bat_j_qg_de_defense_abime.png` | `52469971…d99de` | **`c204ab54…7a4611`** |
| `bat_j_qg_de_defense_tres_abime.png` | `b2a5c1ac…1970a` | **`d6ebe11d…42282d`** |
| `bat_j_qg_de_defense_detruit.png` | `085e3408…6508f` | **`bf6e9dc5…3b6b009`** |
| `bat_j_centre_de_commandement.png` | `a1a74daa…77ca6` | **`07f466cd…82b5b`** |
| `bat_j_centre_de_commandement_abime.png` | `c204ab54…7a4611` | **`52469971…d99de`** |
| `bat_j_centre_de_commandement_tres_abime.png` | `d6ebe11d…42282d` | **`b2a5c1ac…1970a`** |
| `bat_j_centre_de_commandement_detruit.png` | `bf6e9dc5…3b6b009` | **`085e3408…6508f`** |

Les huit ont échangé **deux à deux**, et l'ENSEMBLE des huit empreintes est le
même avant et après — aucune perdue, aucune dupliquée.

⚠ **`art/sources-declarees.json` est identique**, vérifié plutôt que supposé : le
fichier ne porte que des NOMS, sous `consommees` / `dormantes`, sans empreinte, et
les huit noms existent des deux côtés de la permutation. `git diff` sur ce fichier
est vide. `tools/entrees.py --declarer` n'a donc pas eu lieu d'être lancé.

⚠ **Ni `BATIMENTS`, ni `PV`, ni `src/data/base.js`, ni un identifiant de jeu n'ont
été touchés.** `tools/batiments_v2.py` compose le nom du sprite ET celui de la
source depuis la MÊME clé (`source = os.path.join(SRC, nom + '.png')`) : il n'y a
aucune table d'appariement à retourner, et renommer les sources est la seule voie
qui laisse `src/` strictement intact.

---

## §2. Les vingt bâtiments à 90 % d'emprise

### Ce que l'emprise valait

`cible(pv)` de `tools/final128.py` — 16 gros pixels à 1 000 PV, 28 à 5 500, une
racine entre les deux — rendait **six emprises distinctes** sur le roster :

| emprise | % de la case | bâtiments |
|---|---|---|
| 16 | 50,0 % | Raffinerie, Accumulateur, Gangue, Terril |
| 18 | 56,2 % | Collecteur quartz, Collecteur scorie, Nœud |
| 20 | 62,5 % | Centrale, les trois artilleries |
| 21 | 65,6 % | Complexe, Caserne, Dépôt, Aérodrome, Étai |
| 23 | 71,9 % | Centre de commandement, QG de défense |
| 28 | 87,5 % | Chantier de construction, Souche |

C'est exactement ce que le point 2 nomme : la Raffinerie tenait **la moitié** de
sa case.

### Les trois ancres

Les trois ont été trouvées uniques par `grep` avant d'être appliquées, et leur
count vérifié à 1 chacune :

1. `from final128 import pal, recadrer, conditionner, ecrire, boite, PV, OUV, cible  # noqa: E402`
   → `cible` retiré, `from joueur_v2 import EMPRISE_QUATRE_VINGT_DIX` ajouté.
2. `out.append((nom, source, cible(PV[emprunte]), False))` → `EMPRISE_QUATRE_VINGT_DIX`
3. `out.append((nom, source, cible(PV[cle]), ouv))` → `EMPRISE_QUATRE_VINGT_DIX`

`cible` n'a plus **aucun appelant de production**, vérifié par `grep` sur tout
`tools/` : il ne lui reste que le `__main__` historique de `final128.py` (chemins
`/home/claude/…`, machine qui n'existe plus) et un import inutilisé dans
`tools/planches.py`, **préexistant et non retiré** — hors périmètre.

`EMPRISE_QUATRE_VINGT_DIX = 29` est **lu**, jamais retapé : il vit dans
`tools/joueur_v2.py` depuis SPRITES-V2-JOUEUR, avec sa raison, et les murs, les
barrières et trois socles du joueur le portent déjà. **90 % de 32 font 28,8 ;
l'écart à la consigne est de 0,2 gros pixel**, déclaré ici comme dans le code.

### Ce que le lot fait perdre, et qui est dit

La taille d'un bâtiment était une LECTURE de ses PV. Elle ne l'est plus : les
vingt tiennent la même place, et ce qui distingue un gros bâtiment d'un petit est
désormais le dessin seul. C'est l'arbitrage d'Ethan, pris en connaissance de ce
qu'il coûte, et le paragraphe est écrit dans l'en-tête de `tools/batiments_v2.py`.

### La garde `if cle not in PV`

**Gardée**, son commentaire réécrit : elle ne garde plus une emprise calculable —
il n'y en a plus — mais que `BATIMENTS` et `PV` parlent du même roster. Son
message ne dit plus « son emprise ne peut pas se calculer » mais « `BATIMENTS` et
`PV` ne décrivent plus le même roster ». `AR T3` l'asserte encore présente.

### La vignette mixte

`VIGNETTES = [('collecteur_mixte', 'collecteur_quartz')]` **reste un couple**, et
le second membre reste VÉRIFIÉ — une garde `if emprunte not in PV` est ajoutée. Il
ne sert plus à calculer l'emprise (l'emprunt est devenu une identité, les deux
valant 29) ; il dit QUEL bâtiment la vignette représente, ce qui est un fait sur
l'icône et non sur sa taille. Le retirer laisserait une vignette qui ne renvoie
plus à rien.

### La production

`python3 tools/batiments_v2.py` → **162 fichiers écrits**, 81 sprites × 2 grilles,
tous à `empr. 29`. Mesuré ensuite au seuil d'encre `SEUIL_ALPHA = 8` :

| grille | cible | écart 0 | écart ±1 | hors ±1 |
|---|---|---|---|---|
| 64 | 58 | **80** | 1 | 0 |
| 128 | 116 | **80** | 0 | **1** |

⚠⚠ **L'EXCEPTION EST NOMMÉE ET MESURÉE, PAS ABSORBÉE PAR UNE TOLÉRANCE.**
`bat_j_artillerie_anti_infanterie_tres_abime` sort à **114 sur 116** en grille 128
et à **57 sur 58** en grille 64 — donc DANS le ±1 sur la 64. La cause est mesurée,
pas supposée : `eroder(m, 3)` de `conditionner` ronge trois pixels du masque dans
la boîte recadrée, qui fait ici **993 px**. Sur une silhouette pleine cela coûte
moins d'un demi-pixel de sortie et les quatre-vingts autres n'en voient rien ; ce
dessin-là finit en **panache de fumée large de 3 px** sur ses premières lignes
encrées — et même interrompu, certaines lignes rendant 0 —, si bien que les trois
érosions emportent **12 lignes de la source, soit 1,55 px** de la grille 128, que
l'arrondi de la boîte porte à deux. Mesuré : hauteur du masque **900 → 888** dans
la boîte recadrée.

⚠⚠ **ET LE SEUIL DE MESURE EST CELUI DE L'ENCRE, PAS 128.** Première mesure, à
alpha ≥ 128 : les quatre-vingt-un s'écartent de leur cible de **0 à −3 pixels** sur
les deux grilles. Au seuil `SEUIL_ALPHA` de `tools/final128.py` — la coupe que
`ecrire` applique vraiment, donc la frontière de ce qui est DESSINÉ — de **0 à
±1**. C'est la leçon d'EMBLÈME-CENTRÉ, et sans elle `AR T2` tomberait sur une
chaîne parfaitement juste. Le seuil est LU dans l'outil, jamais retapé.

---

## §3. La couture de l'atlas

`python3 tools/atlas.py --ecrire --forcer batiment`.

| fichier | avant | après |
|---|---|---|
| `atlas-batiment-64.webp` | 107 050 | **185 210** |
| `atlas-batiment-128.webp` | 299 848 | **507 076** |
| `src/data/atlas.js` | — | **identique, à l'octet** |
| `art/sprites/atlas-empreintes.json` | — | modifié (les empreintes suivent) |

83 sprites en 10 × 9 des deux côtés : **aucun sprite n'entre ni ne sort**, la
géométrie des cellules ne bouge pas, d'où l'index inchangé.

⚠⚠ **`--forcer` EST OBLIGATOIRE, ET CE N'EST PAS REPRIS DU BRIEF : C'EST
MESURÉ.** L'atlas de ce lot a été mis de côté, l'ANCIEN remis en place depuis
`git show HEAD:` (299 848 octets), et `python3 tools/atlas.py --ecrire` relancé
**sans** le drapeau :

    ÉCART atlas-batiment-128.webp
    atlas identiques : 16 · différents : 5 · nouveaux : 0
    → le fichier sur le disque : 299 848 octets, INCHANGÉ

L'outil imprime « ÉCART » et **n'écrit pas**. La garde s'écrit
`garde = (etat == 'different') and slug not in args.forcer` — lue, et vérifiée à
l'exécution. L'arbre a été remis en l'état ensuite, empreintes SHA-256 à l'appui,
et `atlas.py --verifier` rend à nouveau **17 identiques · 3 différents**.

⚠⚠ **LE BRIEF SE TROMPE SUR CE QUI DIRAIT L'OUBLI, ET C'EST MESURÉ.** Son §5
pose, pour `AR T3` : « la seule autre façon de s'en apercevoir est de rebâtir et
de comparer 9 134 181 à lui-même ». **Faux.** Mesuré en l'état — 162 sprites
régénérés, atlas pas encore recousu — `node --test test/sprite.test.js` rend
**44 pass / 1 fail** sur la garde `sprite — l'atlas cousu répond des sprites
d'aujourd'hui`, avec le message :

    bâtiment/bat_j_accumulateur.png a changé sans que l'atlas soit recousu
    — relancer « python3 tools/atlas.py --ecrire »

**`npm run check` suffit donc, et il dit quoi relancer.** C'est ce qui a fait
changer le montage d'`AR T3` — voir §5.

⚠ **Deux commentaires périmés de `tools/atlas.py` sont réécrits**, et un seul
était au brief. Le fichier disait en DEUX endroits que la grille embarquée est la
64 et que la 128 « n'est lue par aucun écran » : faux depuis le lot GRILLE-128 du
03/09, et **le fichier se contredisait lui-même**, le bloc de `COTE_INDEX` disant
déjà la bascule. Les deux sont corrigés, le second en écrivant qu'il a menti.

⚠ **Un troisième, dans `tools/planches.py`, n'était pas au brief non plus.** Le
commentaire d'`EMPRISE_INTERFACE` affirmait que 28 est « la plus grande emprise
que cette chaîne ait jamais produite » — ce lot la porte à 29. Il se lit désormais
au passé. **`EMPRISE_INTERFACE` reste à 28** : le monter relancerait les
quatre-vingt-douze fichiers d'interface pour un demi-pixel, et **Ethan tranche**.

---

## §4. Le livrable, poste par poste

`npm run build` → `dist/index.html`, **9 410 485 octets**, 0 référence externe.

| poste | avant (`14dd4ac`) | après | delta |
|---|---|---|---|
| **total** | 9 134 181 | **9 410 485** | **+276 304** |
| images | 7 375 787 | 7 652 091 | **+276 304** |
| audio | 1 193 346 | 1 193 346 | **+0** |
| JavaScript | 399 346 | 399 346 | **+0** |
| feuille | 129 497 | 129 497 | **+0** |
| balisage | 36 205 | 36 205 | **+0** |
| lignes `data:` | 311 | 311 | inchangé |
| URI `data:` | 306 | 306 | inchangé |

**La somme des cinq postes tombe EXACTEMENT sur le total des deux côtés.** Aucune
ressource nouvelle n'entre : c'est la même image qui s'alourdit, `atlas-batiment-128`
passant de 299 848 à 507 076 octets, soit **+276 304 en base64** — le total, au
dernier octet. C'est le motif du lot BÂTIMENTS-QUATRE-ÉTATS : un sprite dessiné
plus grand porte plus de pixels dessinés, donc plus d'entropie.

⚠ **Le brief annonçait 9 410 493 et +276 312 ; c'est 9 410 485 et +276 304.**
L'écart de **8 octets** est celui de l'encodeur WebP de cette machine, déjà mesuré
au §0 sur l'arbre pristine. Le nombre du brief n'était pas faux, il était d'une
autre machine.

### La borne T10

À 9 300 000 elle est franchie de **110 485 octets**. **Ethan a tranché le 10/09 :
« Q1 relever ».** Nouvelle borne **9 600 000**, marge **189 515 octets, 1,97 %** —
au-dessus du plancher de 150 000 que `PIC T7` garde.

⚠ **Les trois paliers de qualité WebP ont été mesurés SUR CETTE MACHINE et ne sont
pas appliqués** : q85 → **507 076** octets (le fichier retenu, identique au bit à
celui du dépôt), q80 → **452 618**, q72 → **396 534**. `QUALITE = 85` de
`tools/atlas.py` vaut pour les DIX-NEUF atlas ; la baisser pour celui-ci
dégraderait les dix-huit autres, et ce serait le rognage que §5 de `CLAUDE.md`
refuse.

---

## §5. Les tests

`test/art-90.test.js` entre — **trois tests**, `AR T1` à `AR T3`. Le compte passe
de **1 524 à 1 527**. Aucun test existant n'est supprimé ni assoupli ; **deux
gardes changent de valeur et écrivent le nombre d'avant à côté de celui d'après**.

⚠⚠ **LES TROIS ONT ÉTÉ VUS ROUGES SUR L'ARBRE PRISTINE, AVANT LE MOINDRE
CHANGEMENT** — `node --test test/art-90.test.js` : **0 pass / 3 fail**, avec les
messages qu'on leur demande :

* `AR T1` — « sources non échangées : bat_j_qg_de_defense,
  bat_j_centre_de_commandement, … » (les huit nommés)
* `AR T2` — « grille 64 : 81 sprite(s) hors de l'emprise visée —
  bat_j_accumulateur (32 pour 58), … »
* `AR T3` — « tools/batiments_v2.py appelle encore `cible(…)` », `expected 0,
  actual 2`

### `AR T1` — les huit dessins ont échangé, les quatre états compris

*Montage.* Les huit SHA-256 relevés **avant** le lot sont consignés dans le test,
comme `TAILLES_D_AVANT` de `pictogramme.test.js` consigne un relevé d'avant. Le
test exige que l'empreinte de `bat_j_qg_de_defense<état>` soit celle qu'avait
`bat_j_centre_de_commandement<état>`, et réciproquement, sur les quatre états ;
puis que l'ENSEMBLE des huit soit inchangé. Les quatre suffixes sont **importés**
de `SUFFIXE_ETAT_BATIMENT`, jamais retapés.

⚠⚠ **LE TÉMOIN EST `art/sources/`, ET CE N'EST PAS UN CONFORT.** Le §2 du même lot
ré-échantillonne les 162 sprites : **aucune empreinte de sprite d'après n'égale
une empreinte de sprite d'avant, permutation ou pas**, donc un test bâti sur eux
serait vert quoi qu'il arrive. Les sources sont le seul témoin qui reste
falsifiable.

*Falsification.* Permuter le seul état intact laisse trois couples croisés et le
test les NOMME ; copier au lieu d'échanger fait apparaître une empreinte en
double, et la comparaison d'ensemble tombe.

**PASS.**

### `AR T2` — les 81 sprites prennent 90 % de la case, sur les deux grilles

*Montage.* La liste des quatre-vingt-un se **dérive** de `ATLAS.batiment.noms`
(fichier GÉNÉRÉ) par le préfixe `bat_`, les deux `ruine_*` étant assertées à part.
Le seuil d'encre est **lu** dans `tools/final128.py`, l'emprise **lue** dans
`tools/joueur_v2.py`. Le seuil de boîte est calculé — 29 × 2 = 58 en grille 64,
29 × 4 = 116 en 128 — et non deviné.

*Falsification.* Laisser une seule des deux ancres du §2 sur `cible(PV[…])` laisse
les vingt bâtiments ou la vignette mixte entre 32 et 56 px, et le test nomme
lesquels — vu, sur l'arbre pristine.

*Ce qui rend la borne non vacueuse, en trois assertions.*
1. **80 sur 80 tombent EXACTEMENT sur la cible** sur chaque grille : la tolérance
   de ±1 n'est employée par personne aujourd'hui, et le test le dit — un lot futur
   ne pourra pas s'y installer sans qu'on le voie.
2. **La Raffinerie et le Chantier tiennent la même place, au pixel.** C'était 16 et
   28 gros pixels ; un retour à `cible(PV[…])` ne peut pas survivre à cette
   égalité, même en relâchant la tolérance.
3. **29/32 = 90,6 %** est asserté en clair : une garde qui ne dirait que « les 81
   sont d'accord entre eux » resterait verte si les 81 tombaient ensemble à 50 %.

*L'exception.* `bat_j_artillerie_anti_infanterie_tres_abime`, grille 128
seulement, **114 pour 116** — voir §2. Elle est assertée ENCORE NÉCESSAIRE
(l'idiome de `DETTES_ACCENT`) et sa mesure est figée des deux côtés : le jour où
le dessin ou l'érosion changeront, le test tombera pour dire que l'exception n'a
plus lieu d'être.

**PASS.**

### `AR T3` — l'emprise ne se dérive plus des PV, et l'outil le dit

⚠⚠ **LE MONTAGE DU BRIEF A ÉTÉ CHANGÉ, ET C'EST L'ÉCART LE PLUS IMPORTANT DU
LOT.** Le brief demandait que `AR T3` soit « `python3 tools/atlas.py --verifier`
sort en 0 ». Deux raisons de ne pas l'écrire ainsi :

1. **Un test de `npm run check` ne peut pas appeler Python.** §3 de `CLAUDE.md` :
   la chaîne est hors de `npm run check` DÉLIBÉRÉMENT, « y ajouter une dépendance
   Python serait un changement d'architecture, et la CI n'en a pas ». Le test
   ferait rougir `main` chez Ethan.
2. **Ce qu'il voulait garder est DÉJÀ gardé, et c'est mesuré** — voir §3 : la
   garde `sprite — l'atlas cousu répond des sprites d'aujourd'hui` de
   `test/sprite.test.js` tombe si l'atlas n'est pas recousu, et nomme la commande.

`AR T3` mesure donc l'autre bout, celui que rien ne tenait : **la SOURCE de
l'outil**. C'est le couple d'EMBLÈME-CENTRÉ — les pixels d'un côté (`AR T2`),
l'outil de l'autre —, et un lot qui reviendrait à `cible(PV[…])` sans régénérer
l'art ne ferait tomber que celui-ci.

*Montage.* La source de `tools/batiments_v2.py` est lue **décommentée** — le
fichier EXPLIQUE d'où venait `cible(pv)`, donc une garde qui lirait le brut se
déclencherait sur sa propre prose (la faute que §6 de `CLAUDE.md` raconte cinq
fois) — avec un témoin qui prouve que le filtre n'a pas tout mangé. Elle exige
**zéro** appel de `cible(`, **trois** occurrences de `EMPRISE_QUATRE_VINGT_DIX`
(l'import et les deux emplois — un seul laisserait la vignette mixte ou les vingt
bâtiments sur l'ancienne courbe), et la présence de la garde `cle not in PV`.

⚠⚠ **ET ELLE FERME UNE GARDE QUE LE DÉPÔT PROMETTAIT SANS L'AVOIR.** L'en-tête de
`tools/batiments_v2.py` affirme depuis le lot BÂTIMENTS-QUATRE-ÉTATS que
« `src/data/base.js` porte la même liste sous `SUFFIXE_ETAT_BATIMENT` — un test
confronte les deux plutôt que de les croire d'accord ». **Mesuré le 10/09 par
`grep` : aucun test ne le faisait**, et rien n'aurait dit qu'un état ajouté d'un
côté manquait de l'autre. `AR T3` le fait, à trois lignes de coût, et le renvoi de
l'outil NOMME désormais le test au lieu d'affirmer qu'il existe.

**PASS.**

### `AR T4` et `AR T5` — des mesures, pas des tests

**Écart déclaré.** Les deux montages du brief sont `python3 tools/atlas.py
--verifier` et `python3 tools/verifier.py` : ils ne peuvent pas entrer dans
`npm run check`, pour la raison ci-dessus. Ce sont des mesures, rendues au §6.
`AR T4` est par ailleurs le réancrage de `PIC T7` — une édition, pas un test neuf.

### Les deux gardes réancrées

* **`PIC T6`** — `atlas-batiment-128.webp` **299 848 → 507 076**,
  `atlas-batiment-64.webp` **107 050 → 185 210**, le nombre d'avant écrit en
  commentaire à côté, comme le lot OUVRAGE-CÂBLAGE l'a fait pour dix. **Les seize
  autres lignes n'ont pas bougé d'un octet** : `--forcer batiment` nomme la seule
  famille que le lot réécrit, et c'est ce que cette garde mesure.
* **`PIC T7`** — `BORNE` 9 300 000 → **9 600 000**, `MESURE` 9 134 181 →
  **9 410 485**, `MARGE` 165 819 → **189 515**, le pourcentage 1,78 → **1,97**, et
  le titre du test suit. **`assert.ok(MARGE >= 150_000)` n'est pas touché** — avec
  189 515 il passe ; le baisser serait le rognage que §5 refuse.
* **`banc.test.js` T10** — la borne, avec son bloc cumulatif ajouté au-dessus du
  dernier, sans rien effacer.

---

## §6. Les contrôles de chaîne, et la mesure du démarrage

### `tools/verifier.py` — DÛ, et lancé, sur un arbre stable

Le lot touche `art/` et `tools/` : `CLAUDE.md` §0.5 le rend obligatoire. Lancé
**deux fois**, avant et après, chaque fois sur un arbre qu'on ne modifiait pas.

| | avant (`14dd4ac`) | après |
|---|---|---|
| identiques à l'octet | 1 110 | **1 110** |
| différents | 0 | **0** |
| nouveaux | 0 | **0** |
| MANQUANTS | 0 | **0** |
| durée | 673,5 s | 555,3 s |
| code de sortie | **1** (`ATLAS`) | **1** (`ATLAS`) |
| `entrees.py --verifier` | 501 / 501 · 152 / 152 | **501 / 501 · 152 / 152** |
| `art/sourcesstandby/` | 34 fichiers, 0 lu | 34 fichiers, 0 lu |
| `art/reserve/` | 10 fichiers, 0 lu | 10 fichiers, 0 lu |

⚠⚠ **LES 162 PNG RÉGÉNÉRÉS SONT DANS LES « IDENTIQUES À L'OCTET ».** C'est la
seule chose qui dise que `tools/batiments_v2.py`, tel qu'il est commité, refait
l'art commité — emprise, recadrage, érosion, réduction et écriture — au bit près.

⚠ **`art/sources-declarees.json` n'a pas eu à bouger** : 653 fichiers, 501
consommées, 152 dormantes des deux côtés. La permutation ne change aucun nom.

### La ligne `ATLAS` — préexistante, et le lot en referme deux

`python3 tools/atlas.py --verifier` :

| | avant | après |
|---|---|---|
| atlas identiques | 15 | **17** |
| différents | 5 | **3** |
| `src/data/atlas.js` | identique | **identique** |
| `atlas-empreintes.json` | identique | **identique** |

Les deux qui sortent des « différents » sont exactement `atlas-batiment-64` et
`atlas-batiment-128` : le lot les réécrit pour de bon avec l'encodeur de cette
machine. **Les trois qui restent — `carte-64`, `carte-128`, `interface-128` — sont
exactement ceux d'avant, et le lot les laisse où il les a trouvés.**

⚠ **Le code de sortie de `verifier.py` reste 1, avant comme après, sur la même
ligne et pour la même raison.** Ce n'est pas « vert » et le rapport ne l'écrit
pas : c'est un rouge PRÉEXISTANT, d'encodeur WebP, que le lot ne crée pas et ne
prétend pas solder.

### Le démarrage, remesuré — et ce n'est PAS l'appareil d'Ethan

`banc.test.js` pose sept mégaoctets comme « la marge au-delà de laquelle il faudra
REMESURER ce démarrage avant de faire entrer quoi que ce soit ». On est à 9,4 Mo :
la condition est DUE. Le dépôt n'a pas de Galaxy S25 FE (§3), donc la mesure est
faite dans **Chromium 1194**, géométrie **360 × 780 à dpr 3**, `file://`, contexte
neuf à chaque chargement.

⚠ **A/B ALTERNÉ, ET C'EST CE QUI REND LA MESURE LISIBLE.** Deux séries à la suite
mesurent autant l'état de la machine que le livrable : un premier essai en séries
séparées a rendu 782 ms pour l'AVANT contre 601 pour l'APRÈS — c'est-à-dire le
livrable le plus lourd plus rapide que l'autre —, parce que la première série
portait la chauffe du navigateur et des à-coups du conteneur. Douze tours
alternés, le tour 0 écarté, **onze couples retenus** :

| | avant (9 134 181 o) | après (9 410 485 o) |
|---|---|---|
| `DOMContentLoaded`, médiane | **583 ms** | **607 ms** |
| étendue | 569 – 644 ms | 586 – 636 ms |
| premier rendu, médiane | **124 ms** | **124 ms** |
| erreurs de page | 0 | 0 |

**+24 ms, soit +4,1 %, pour +3,0 % de livrable** ; le premier rendu ne bouge pas.
⚠ **Et les deux étendues se recouvrent** : l'écart de médiane est du même ordre
que le bruit de la machine, et il faut le lire ainsi plutôt que comme une mesure
fine. Ce qu'on peut en dire sans forcer : **le démarrage ne se dégrade pas d'un
ordre de grandeur**, et 9,4 Mo se charge ici en six dixièmes de seconde.

⚠⚠ **CE N'EST PAS L'APPAREIL D'ETHAN, ET LE RELÈVEMENT DE BORNE RESTE ADOSSÉ À SA
DÉCISION, PAS À CETTE MESURE.** Il a tranché « Q1 relever » le 10/09 ; la mesure
est due et elle est faite, elle ne remplace pas un essai sur le téléphone.

---

## §7. Versionnage

`package.json` : `version` **0.99.37 → 0.99.38**, `config.build` **"139" → "140"**.
Les deux restent des **chaînes** — vérifié par `typeof` après édition : c'est le
piège de `build.gradle.kts`, qui les coule `as String` et fait tomber le job
Android à la configuration, avant le moindre test, si l'un devient un nombre.

`SAVE_VERSION` **ne bouge pas et reste à 30** : `src/` n'a pas une ligne de
changée, `src/data/atlas.js` compris.

---

## §8. Ce qui n'est PAS dans ce lot

* **Les unités.** `EMPRISE_UNITE` de `tools/joueur_v2.py` — escouade 18/24,
  blindé 20/31, aéronef 25/32 — n'a pas bougé d'un chiffre. Ethan : « Seulement
  bâtiment, pas unités ».
* **Les deux ruines.** `ruine_j` et `ruine_o` vivent dans la même famille d'atlas
  et sortent de `tools/ruines.py` : elles n'ont jamais été des bâtiments, leur
  producteur n'est pas touché, et elles restent à **52 sur 64**. `AR T2` les
  exclut nommément, et asserte que la famille en porte exactement deux.
* **La taille des vignettes de la barre du bas** (point 7) — règle de feuille,
  lot ÉCRANS.
* **`QUALITE`**, `EMPRISE_INTERFACE`, et toute autre forme de rognage.
* **`LIMITE T8`**, suspendu par Ethan le 08/09 : ni réparé, ni retiré.
* **`src/ui/`, `src/sim/`, `src/son/`, `src/render/`, `src/data/`** : pas une ligne.
  Vérifié au diff — `src/` n'apparaît pas dans `git status`.

---

## §9. Les écarts au brief, et ce qui reste ouvert

### Écarts, tous déclarés

1. **`AR T3` a changé de montage** — le plus important. Le brief en faisait un
   appel à `python3 tools/atlas.py --verifier` ; §3 de `CLAUDE.md` interdit une
   dépendance Python dans `npm run check`, et **ce qu'il voulait garder est déjà
   gardé, mesuré**. `AR T3` garde l'autre bout : la SOURCE de l'outil. Voir §5.
2. **`AR T4` et `AR T5` ne sont pas des tests** mais des mesures, pour la même
   raison. Elles sont au §4 et au §6.
3. **La tolérance d'`AR T2` porte une exception nommée**, `bat_j_artillerie_anti_infanterie_tres_abime`
   en grille 128 seulement. Le brief posait « ±1 près pour l'arrondi de
   `recadrer` » : mesuré, c'est vrai de quatre-vingts sprites sur quatre-vingt-un,
   et la cause du dernier est l'ÉROSION, pas l'arrondi. Elle est mesurée et
   assertée encore nécessaire, plutôt qu'absorbée par un ±2 global.
4. **Deux commentaires périmés de plus sont réécrits** — le second bloc de
   `tools/atlas.py` sur la grille embarquée, et celui d'`EMPRISE_INTERFACE` dans
   `tools/planches.py`. Le brief ne nommait que le premier ; les laisser aurait
   laissé deux fichiers affirmant un état révolu.
5. **Une garde promise par `tools/batiments_v2.py` et absente a été écrite** —
   la confrontation de ses `ETATS` à `SUFFIXE_ETAT_BATIMENT`. Hors brief, trois
   lignes, et le renvoi de l'outil nomme désormais le test.
6. **Une garde de la vignette mixte est ajoutée** (`emprunte not in PV`), pour que
   le second membre de `VIGNETTES`, qui ne calcule plus rien, reste vérifié.
7. **Le brief nomme `GAME_VERSION`**, qui n'existe pas : ce sont `version` et
   `config.build` de `package.json`.
8. **Les nombres du brief sont d'une autre machine, de 8 à 16 octets près** :
   livrable 9 410 493 annoncé / **9 410 485** mesuré, atlas 507 084 / **507 076**,
   q72 396 518 / **396 534**. L'écart est celui de l'encodeur WebP, déjà visible
   dans les cinq ÉCART préexistants.
9. **Le brief se trompait sur ce qui dirait l'oubli du §3** — mesuré, voir §3.
10. **Le §0 de `CLAUDE.md` se trompe sur Pillow 12.3.0** — mesuré, voir §0. Non
    corrigé : il décrit une autre machine, et le contredire d'autorité demanderait
    de savoir laquelle.

### Points en suspens, pour Ethan

* **`EMPRISE_INTERFACE` reste à 28** quand les bâtiments passent à 29. Les
  quarante-six pictogrammes prennent donc 87,5 % de leur case là où un bâtiment en
  prend 90,6 %. Le monter relancerait quatre-vingt-douze fichiers pour un
  demi-pixel : **c'est un arbitrage, et il n'a pas été pris.**
* **Les deux ruines restent à 26 gros pixels sur 32** (52 px en grille 64), donc
  bien en dessous des bâtiments qu'elles remplacent à l'écran. Elles ne sont pas
  des bâtiments et le point 2 ne les nomme pas ; **à rouvrir si le contraste
  gêne.**
* **La taille d'un bâtiment ne dit plus ses PV.** Six emprises distinctes
  deviennent une : c'est ce qu'Ethan demande, et c'est une information de jeu qui
  disparaît de l'écran. Le paragraphe est dans l'en-tête de l'outil.
* **`cible(pv)` de `tools/final128.py` n'a plus aucun appelant de production.**
  Elle reste, comme `bords.py` et `align_chenilles.py` restent. `tools/planches.py`
  l'importe encore sans l'appeler — **préexistant, non retiré, hors périmètre.**
* **Le code de sortie 1 de `tools/verifier.py`** sur la ligne `ATLAS`, dû à
  l'encodeur WebP de la machine, reste ouvert depuis le lot SOL-OUVRAGE. Le lot en
  referme deux sur cinq **par effet de bord**, en réécrivant la famille qu'il
  devait réécrire de toute façon.

---

## §10. Le rendu n'a pas été vu

⚠ **LE JEU N'A PAS ÉTÉ REGARDÉ, NI SUR APPAREIL NI SUR UN ÉCRAN DE JEU, ET ÇA SE
DÉCLARE NON EXÉCUTÉ.** Ce qui a été VU, ce sont les huit **sources** du §1, en
aperçu, pour établir l'inversion — et c'est la seule chose que ce lot demandait de
regarder pour décider. Les 162 sprites régénérés n'ont été mesurés que par leur
**boîte d'encre**, et l'écran de la base comme le champ de bataille n'ont pas été
ouverts : le dépôt n'a pas de téléphone (§3), et un bâtiment qui passe de 50 % à
90,6 % de sa case est très exactement le genre de changement qu'il faut voir.
**À regarder au premier essai d'Ethan.**

⚠ Le seul relevé dans Chromium est celui du DÉMARRAGE (§6), à la géométrie du
S25 FE — pas sur le S25 FE.
