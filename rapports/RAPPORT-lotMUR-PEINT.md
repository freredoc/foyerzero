# RAPPORT — lot MUR-PEINT

Le mur de contour cesse d'être une géométrie dessinée par le code. Il passe dans
le fond de base, où il est peint. Le sol pavé case par case disparaît au profit
d'une image entière par base.

**Version 0.83.0 · build 85.** `npm run check` → **977 pass / 0 fail**,
`dist/index.html` → **5 516 056 octets**, 0 référence externe, **21 `data:`**.

---

## 1. BASELINE, ET LE ROUGE QU'ELLE PORTAIT

| | suites | tests | pass | fail | durée |
|---|---|---|---|---|---|
| avant, sur `0c05f07` intact | 0 | 976 | 975 | **1** | 17,57 s |
| après | 0 | **977** | **977** | 0 | 17,4 s |

⚠⚠ **LA BASELINE ÉTAIT ROUGE, ET C'ÉTAIT LA GARDE D'ENTRÉES.** `main` a viré au
rouge au commit `0c05f07` — celui qui apporte les huit PNG — et pas avant :
[run 507](https://github.com/freredoc/foyerzero/actions/runs/33806601697) en
échec, [run 505](https://github.com/freredoc/foyerzero/actions/runs/33797781935)
vert. Le seul échec était `test/sprite.test.js:1162`, « tout fichier
d'`art/sources/` est CLASSÉ » : huit images étaient entrées sans être déclarées.
Ce lot les consomme, donc il referme ce rouge — ce n'était pas un obstacle, mais
il fallait le savoir avant de commencer (CLAUDE.md §0 : « un lot qui démarre sur
une base rouge sans le savoir est un lot perdu »).

**LE COMPTE NE BOUGE PAS, ET IL SE DÉCOMPOSE À ZÉRO PRÈS :**

| fichier | delta | pourquoi |
|---|---|---|
| `test/fond.test.js` | **+12** | entre — il remplace `contour.test.js` |
| `test/contour.test.js` | **−9** | sort — il gardait un anneau qui n'existe plus |
| `test/chantier.test.js` | **−2** | 86 → 84 : quatre tests d'anneau et de pavage remplacés par deux, un test de sol remplacé par un, **et la garde du calque des traits qui entre** (§8) |
| `test/sprite.test.js` | 0 | le test de `bord/` remplacé par celui des fonds |
| `test/monde.test.js` | 0 | la garde des atlas resserrée, pas comptée |
| **total** | **+1** | 976 → 977 |

⚠ **AUCUNE ASSERTION N'A ÉTÉ ASSOUPLIE.** Les tests qui affirmaient l'anneau ont
été **remplacés**, pas ajustés : le brief l'exigeait, et changer une valeur
attendue pour qu'un test passe aurait été la faute qu'il nomme.

---

## 2. LES HUIT SOURCES

Vérifiées avant de commencer. **Les huit divergent de la table du brief**, et
c'est ce qui a arrêté le lot une première fois (voir
`RAPPORT-MUR-PEINT-ARRET.md` et la PR #75). Ethan a confirmé que ce sont les bons
fonds ; la table ci-dessous est celle du dépôt, et elle remplace celle du brief.

| fichier | brief | dépôt (16 premiers) | octets |
|---|---|---|---|
| `base_fond_joueur_01.png` | `831a4e46a17138ce` | `30fb9a13d3b95ca6` | 3 084 361 |
| `base_fond_joueur_02.png` | `c0abbfc75c39fc43` | `c76fd11f721a1ea5` | 3 767 404 |
| `base_fond_joueur_03.png` | `61075a2d212d766e` | `02049c6d0b85e942` | 3 784 902 |
| `base_fond_joueur_04.png` | `70b33ba069124624` | `5b6ec1596a119794` | 3 622 669 |
| `base_fond_ouvrage_austere.png` | `ba166383cda1cbe1` | `c0a85f28f7cfda38` | 3 447 854 |
| `base_fond_ouvrage_hostile.png` | `c22679427c2a931d` | `c5670b3c6c0335a0` | 4 106 581 |
| `base_fond_ouvrage_menacante.png` | `d60bfd3e8fb24056` | `c85d2e3cf4783bc3` | 3 779 891 |
| `base_fond_ouvrage_oppressante.png` | `763c0461eda44e6e` | `eebe43943522e396` | 3 694 010 |

⚠ **NI FILTRE GIT NI CORRUPTION** : pas de `.gitattributes`, le contenu du blob
hache comme le fichier du disque, et les huit se décodent en 1080 × 2160 RGB.
Toutes les affirmations géométriques du brief ont été confrontées à CES
fichiers-là, et **aucune n'est tombée** (§3).

---

## 3. LES MESURES

**Taille de case.** À 1080 px de large — la largeur physique d'un téléphone à
dpr 3, et celle des planches —, la case vaut **108 px exactement**, donc le décor
tombe au **1:1**. Mesuré à l'écran sur un viewport de 360 px : case **36 px**,
grille **360 px de large**, soit toute la largeur, sans marge latérale.

**Épaisseur du mur.** **54 px sur les huit fonds**, soit une demi-case de 108.
Vérifié en posant un repère à x = 54 sur les huit et son symétrique à x = 1026 :
il longe la face intérieure du parapet peint sur les quatre jets joueur — la
population que le brief nomme. À l'écran, `padding` de **18 px** pour une case de
36.

⚠ **DEUX MÉTRIQUES INVENTÉES POUR L'OCCASION ONT ÉTÉ JETÉES AVANT D'ÊTRE CRUES.**
La première ne distinguait pas le mur de la texture du sol et rendait des faces
intérieures allant de x = 115 à x = 356 ; la seconde cherchait « la plus forte
rupture horizontale » et attrapait une corniche, annonçant jusqu'à six cases
d'écart sur l'alignement des bandes. Ce qui a tranché, c'est d'avoir regardé les
images.

**Fin de la bande `batiments`, confrontée à la transition peinte.** Sur la
planche : `54 + 8 × 108 = 918` px sur 2160. **Au rendu**, viewport 360, case 36 :
la bande finit à **306,28 px** du haut du décor, quand l'art la met à
`918/2160 × 720 = 306`. **Un tiers de pixel d'écart** — largement dans la
demi-case que le brief pose comme seuil d'arrêt. L'art a été composé pour cette
grille.

**Débord.** `54 + 18 × 108 = 1998` px pour une image de 2160 : **162 px, soit
1,5 case**, sous la dernière rangée. À l'écran : décor de **720 px** de haut, la
dernière rangée finissant à 666 → **54 px**, soit les mêmes 1,5 case. Il passe
sous les contrôles ; ni rognage, ni étirement, ni recentrage.

**Ce que la boîte rend au joueur.** L'anneau faisait `largeur + 2` × `longueur + 1`
= 11 × 19 cases ; le mur peint fait 10 × 18,5. Mesuré, la case GROSSIT :

| viewport | anneau | mur peint | gain |
|---|---|---|---|
| 360 × 560 | 29 px | 30 px | +3,4 % |
| 412 × 820 | 37 px | **41 px** | **+10,8 %** |
| 1080 × 1920 | 98 px | 103 px | +5,1 % |

**Poids du livrable.**

| poste | octets |
|---|---|
| HTML avant | 3 361 351 |
| HTML après | **5 516 056** |
| **delta** | **+2 154 705** — soit **1,64×** |
| les huit fonds, WebP q75, sur le disque | 1 650 546 |
| les mêmes, en base64 | +2 200 728 |
| les douze pièces de mur qui SORTENT | −43 176 |
| `data:` avant / après | 25 / **21** |

⚠⚠ **LE q75 EST UN ARBITRAGE D'ETHAN, PRIS SUR MESURE.** À q85 les huit pesaient
2 720 514 o, soit 3 627 352 en base64 : le HTML passait à **6 988 703 octets,
2,08 fois**, c'est-à-dire **au-delà du doublement que le brief pose comme
condition d'arrêt**. Les paliers lui ont été soumis, mesurés sur les huit
planches — q80 → 1,83× · **q75 → 1,65×** · q70 → 1,60×, contre 1,73× pour une
réduction à 810 px. Réponse : **q75, pleine résolution**. Confronté à 1:1 sur la
zone la plus texturée des huit, q75 ne se distingue pas de la source.

⚠ **LA RÉSOLUTION NE BOUGE PAS, ET C'EST LA MOITIÉ DU CHOIX.** Réduire à 810 px
aurait rendu 5 828 763 octets — **moins de marge que q75**, pour un flou
permanent sur l'appareil d'Ethan. `tools/fonds.py` met déjà en garde de face
contre ce levier.

**La borne T10 passe de 3 400 000 à 5 700 000**, marge **184 099 octets, 3,2 %**.
Elle est plus large qu'aux six derniers lots, à dessein : ce lot fait entrer huit
images d'un coup, et une borne posée au ras du livrable ferait tomber la suite au
premier octet du lot suivant.

---

## 4. LES ANCRES RÉELLEMENT TOUCHÉES

Extraites des fichiers, jamais retapées.

| fichier | ce qui change |
|---|---|
| `src/render/fond.js` | **entre** — `MUR_CASES`, `LARGEUR_EN_CASES`, `HAUTEUR_EN_CASES`, `HAUTEUR_IMAGE_EN_CASES`, `COTE_CASE_SOURCE`, `SOURCE_LARGEUR`, `SOURCE_HAUTEUR`, `BANDE_SOUS_LE_MUR`, `FONDS`, `tousLesFonds`, `SEL_FOND`, `fondDeLaBase`, `rectangleDuFond`, `nomCssDuFond`, `VARIABLE_DU_FOND` |
| `src/render/contour.js` | **sort** — tout le module |
| `src/render/projection.js` | `calculerProjection(largeurPx, hauteurPx, murCases = 0)` remplace `contour = 0` ; `colonnes = GRILLE.largeur + 2 * murCases`, `lignes = GRILLE.longueur + murCases` ; le retour porte `murCases` |
| `src/render/scene.js` | `listeDuFond(nom, projection)` remplace `listeDuContour` ; `imageEntiere` sort ; `listeAffichage(etat, projection, precedentes, alpha, fond = null)` |
| `src/ui/raid.js` | `calculerProjection(largeur, hauteur, MUR_CASES)` ; `fondCourant`, posé depuis `combat.proprietaireDefense` |
| `src/ui/chantier.js` | le calque `#chantier-contour` sort ; `coteQuiTient` divise par `LARGEUR_EN_CASES` ; `paddingDeLaGrille` rend `coteCase * MUR_CASES` ; `--fond-taille` remplace `--sol-pave` ; `COTE_CELLULE_SOL`, `cellulesDeSolParAxe`, `casesDeSolParAtlas` et `fondsDuSol` sortent ; `VARIABLE_DU_MUR` et `nomCssDuMur` sortent |
| `src/ui/session.js` | `ATLAS_DE_LA_PAGE` gagne les huit décors ; `atlasDeLaScene` les expose ; `nomsDuContour` sort |
| `src/index.src.html` | six `--mur-j-*` → huit `--fond-*` ; six balises `bord-o-*` → huit `fond-*` **sans `src`** ; `padding: calc(var(--case-cote) / 2)` ; `#chantier-contour` et `.mur` sortent |
| `tools/build.js` | douze marqueurs `%MUR_*%` → huit `%FOND_*%` |
| `tools/fonds.py` | qualité **par entrée** ; les huit fonds ; écrit `fond-empreintes.json` |
| `tools/verifier.py` | `bords` sort de `CHAINE` |

---

## 5. LE SORT DU PARAMÈTRE `contour`

⚠⚠ **IL N'A PAS ÉTÉ RETIRÉ — IL A CHANGÉ DE NOM ET DE VALEUR, ET IL FALLAIT LE
DIRE PLUTÔT QUE D'ANNONCER UNE SUPPRESSION.** Le brief demandait de le retirer
« si plus aucun appelant ne le passe ». Un appelant le passe toujours : la boîte
affichée fait **dix** cases de large, pas neuf, parce que le mur peint occupe une
demi-case de chaque côté. Ce qui a changé, c'est la valeur — l'anneau réservait
**une case pleine**, le mur peint en réserve **une demie**.

Il s'appelle donc `murCases`, il est **en cases et non en drapeau**, et il vaut
`MUR_CASES` chez `ui/raid.js`, rien chez `ui/banc.js`. Le garder à zéro pour le
banc reste nécessaire : il n'a pas de décor, et lui réserver un mur déplacerait
la douzaine de positions en pixels que ses assertions portent — `FOND T5` vérifie
que `murCases = 0` rend l'ancienne projection au caractère près.

⚠ **UNE FONCTION MEURT AVEC L'ANNEAU** : `yDeLigneEcran` de
`render/projection.js`, qui existait pour la ligne 0 qu'aucune rangée n'occupe.
Elle **n'a pas été retirée** : elle est encore exportée et testée par
`rendu.test.js`, et la retirer aurait été un second changement que ce lot ne
demande pas. **Elle n'a plus aucun appelant de production** — à reprendre.

---

## 6. LES FICHIERS DÉPLACÉS

| quoi | d'où | vers | pourquoi |
|---|---|---|---|
| 16 `bord_[jo]_*.webp` + `bord-empreintes.json` | `art/sprites/bord/` | **`art/sourcesstandby/bord/`** | Ethan : « les `bord_*` ne sont pas supprimés ». Les laisser sous `art/sprites/` les ferait compter MANQUANTS par le vérificateur à chaque exécution. |
| `tools/bords.py` | — | reste au dépôt, **sans appelant** | même sort que `tools/align_chenilles.py` depuis la sortie de la grille 32 |

⚠⚠ **ÉCART DÉCLARÉ : `art/sourcesstandby/bord/` N'EXISTAIT PAS.** Le brief
l'annonçait « déjà comme précédent » et demandait de vérifier la convention
réelle. Vérifié : il n'existait pas, et `art/sourcesstandby/` est plat. C'est ce
lot qui crée le sous-dossier. Il reste le bon endroit — c'est le dossier que le
dépôt réserve à ce qui est au repos, et une garde d'`entrees.py` prouve qu'aucun
outil ne le lit.

⚠⚠ **SECOND ÉCART DÉCLARÉ : LES `base_bords_*` D'`art/sources/` N'ONT PAS SUIVI.**
Le brief demandait qu'elles prennent « le même chemin ». `CLAUDE.md` dit trois
fois que **`art/sources/` ne s'ampute JAMAIS** — « rien dans ce dossier n'est un
produit, tout y est un original » —, et le dépôt a un précédent exact : au lot
MURS, la v1 retirée a laissé ses quatre planches en place, reclassées
`consommees` → `dormantes`. C'est ce qui a été fait. **Le diff de
`art/sources-declarees.json` raconte le lot en douze lignes** : huit fonds
entrent en `consommees`, quatre `base_bords_*_v2` passent en `dormantes`.

`python3 tools/entrees.py --declarer`, **lancé à la main** :
**97 consommées · 90 dormantes · 187 fichiers** dans `art/sources/` (avant :
93 / 86 / 179). ⚠ `--declarer` n'est appelé par aucun script de vérification, et
un test balaie le dépôt pour l'exiger. ⚠ Mesuré : il n'écrit **pas un octet**
dans `art/sprites/` — empreinte de l'arbre identique avant et après.

---

## 7. LES HUIT FALSIFICATIONS

Chacune défaite pour de bon, mesurée, puis remise.

| # | propriété défaite | ce qui tombe | remise |
|---|---|---|---|
| 1 | `raid.js` repasse `1` à `calculerProjection` | `fond.test.js` **11 pass / 1 fail** | ✔ |
| 2 | `MUR_CASES = 1` (case pleine) | **8 pass / 4 fail** | ✔ |
| 2 bis | `MUR_CASES = 0` | **8 pass / 4 fail** | ✔ |
| 3 | la boîte passe à 10,5 cases | **10 pass / 2 fail** | ✔ |
| 4 | `GRILLE.bandes.batiments` passe à `premiere: 12` | **11 pass / 1 fail** | ✔ |
| 5 a | le tirage rend toujours `noms[0]` | **11 pass / 1 fail** | ✔ |
| 5 b | un type inconnu retombe sur `fond_o_austere` au lieu de lever | **11 pass / 1 fail** | ✔ |
| 6 | un neuvième `.webp` déposé dans `art/sprites/fond/` | `sprite.test.js` **39 pass / 1 fail** | ✔ |
| 6 bis | un nom ajouté à la table sans son fichier | **39 pass / 1 fail** | ✔ |
| 7 | un `bord_j_mur_1` réintroduit dans `src/render/fond.js` | `fond.test.js` **11 pass / 1 fail** | ✔ |
| 8 | — | `tools/fonds.py` relancé rend les neuf fichiers **byte-exacts** | — |
| 9 | l'`inset` du calque des traits se sépare du `padding` de la grille | `chantier.test.js` **83 pass / 1 fail** | ✔ |

⚠ **UNE FALSIFICATION A ÉTÉ REFAITE PARCE QU'ELLE CASSAIT LA SYNTAXE** au lieu de
mordre : la première écriture de 5 b rendait le module inchargeable (0 pass / 1
fail), ce qui ne prouve rien. Reprise proprement, elle fait tomber le test qu'elle
vise et lui seul.

---

## 8. CE QUE LA RELECTURE HOSTILE A TROUVÉ

⚠⚠ **UNE GARDE QUE J'AI ÉCRITE LISAIT MON PROPRE COMMENTAIRE — CINQUIÈME FOIS DU
DÉPÔT.** `décor — l'écran choisit son fond sur la FONDATION` cherchait
`#chantier-contour` dans le HTML brut, et le trouvait dans le commentaire qui
explique justement que le calque a disparu. Après `viewport-fit=cover`,
`MENTION_SATURE`, `variante.js` et `render/contour.js`. Elle lit désormais la
feuille décommentée, avec un témoin qui prouve que le filtre n'a pas tout mangé.

⚠⚠ **ET SURTOUT : UN DÉFAUT ANTÉRIEUR AU LOT, SUR `main`, MESURÉ.**
`#chantier-traits` — le calque SVG des flèches de voisinage — est en
`position: absolute` : son `inset` se compte depuis la boîte de PADDING de la
grille, donc il doit **valoir** le `padding` pour tomber sur le contenu. Depuis
le lot MURS, le `padding` valait **une case pleine** et l'`inset` **une
demi-case** : les deux avaient été changés séparément.

Mesuré dans Chromium, viewport 360, sur le livrable construit d'AVANT :

| | contenu | calque | écart |
|---|---|---|---|
| avant (`main`) | x = 36, largeur 288 | x = 20, largeur 320 | **−16 px** (une demi-case) et **+32 px** de large |
| après | x = 18, largeur 324 | x = 18, largeur 324 | **0 et 0** |

Les traits qui relient un collecteur à sa raffinerie étaient donc **étirés de
11,1 %** et partaient à côté des centres de case. ⚠ C'est très exactement la
faute que le commentaire du calque annonçait comme possible — « les traits
seraient étirés de 11 % en largeur […] et rien ne le dirait » — et elle était
commise depuis le 03/09. ⚠⚠ **RIEN NE POUVAIT LA VOIR : deux valeurs justes
séparément, fausses ensemble**, dans deux règles CSS que personne ne comparait.
C'est la leçon de la boussole de `rendu-pose.js` au lot BRANCHEMENT-DÉFENSE. Ce
lot la corrige **par conséquence** — le `padding` redevient une demi-case — et la
garde qui manquait exige désormais l'égalité des deux ; elle tombe si on les
sépare (**falsification 9 : 83 pass / 1 fail**).

⚠⚠ **ET UN COMMENTAIRE QUE J'AVAIS ÉCRIT AFFIRMAIT UN CHANGEMENT QUI N'A PAS EU
LIEU.** J'annonçais « le huitième `image-rendering: pixelated` est parti avec le
calque du mur ». **Mesuré : il en restait déjà SEPT avant le lot** — celui du mur
était tombé au lot MURS, et `CLAUDE.md` le dit noir sur blanc. Sept avant, sept
après. Corrigé dans la feuille et dans le test, qui compte maintenant sur la
version décommentée (le brut en rend dix).

---

## 9. LE SOL PAVÉ, ET CE QUI N'A PAS ÉTÉ DÉPLACÉ

**Qui peignait le sol de la base :** `fondsDuSol` d'`ui/chantier.js`, qui
découpait **quatre cellules par case** dans l'atlas du MONDE (`--atlas-sol`),
plus le pavage décoratif `--sol-pave` de `#chantier-defile`. Les deux
disparaissent : le décor peint EST le sol.

⚠⚠ **`--atlas-sol` RESTE, ET IL LE FAUT.** C'est l'atlas du monde : la CARTE en a
toujours besoin. Le retirer aurait vidé l'écran Monde pour une raison qui ne le
regarde pas.

⚠⚠ **`tile_sol_{j,o}_*` N'A PAS ÉTÉ TOUCHÉ, PARCE QUE CE LOT NE L'ORPHELINE PAS :
IL L'ÉTAIT DÉJÀ.** Mesuré, et un test le rejoue à chaque exécution : les huit
dalles ne sont nommées dans `src/` que par des **commentaires**, et aucun écran
ne les résout depuis le 30/08, où le sol de la base est passé à l'atlas du monde.
Elles restent cousues dans l'atlas `terrain` ; les en retirer changerait la
géométrie d'un fichier **GÉNÉRÉ** (`src/data/atlas.js`) pour une dette que ce lot
n'a pas créée. **À reprendre dans un lot qui le dise.**

---

## 10. RELEVÉ AU DOIGT, DANS CHROMIUM

Viewport 360 × 720, dpr 3, sur le livrable construit. **Zéro erreur de page.**

- case **36 px**, `padding` **18 px** — la demi-case ;
- grille **360 px de large** : toute la largeur, aucune marge latérale ;
- décor **360 × 720 px** = dix cases sur vingt, `no-repeat`, `local` ;
- **0 élément `.mur`**, **pas de `#chantier-contour`** ;
- fin de la bande `batiments` à **306,28 px** contre **306** attendus ;
- les **huit balises `fond-*`** reçoivent leur adresse, **décodent**, et mesurent
  **1080 × 2160** — ce qui confirme du même coup les constantes de source du
  module.

⚠ **L'ÉCRAN DE RAID N'A PAS ÉTÉ VU, ET C'EST DÉCLARÉ NON EXÉCUTÉ.** Y entrer
demande une armée composée, que `problemesDuRaid` exige ; 120 doubles touchers
balayés sur la carte n'ont ouvert aucune cible. Ce qui le couvre : `FOND T10`
(la primitive est posée **une fois**, avec la famille du **propriétaire de la
défense**, juste après le fond uni), `FOND T4` (la géométrie), et le fait que les
huit balises décodent — le seul risque runtime que les tests ne voyaient pas.

---

## 11. LES OUTILS

⚠ **`python3 tools/verifier.py` → 997 identiques · 0 différent · 0 nouveau ·
0 MANQUANT**, verdict **VERT**, en 359,8 s, sortie 0. Il était dû : le lot touche
`art/` et `tools/`. **Le compte passe de 1 005 à 997**, et le delta se
décompose : **−17** (les seize murs et leur manifeste quittent `art/sprites/`),
**+9** (les huit décors et `fond-empreintes.json`). Rien d'autre n'a bougé d'un
octet.

⚠⚠ **LA QUALITÉ EST PAR ENTRÉE DANS `tools/fonds.py`, ET CE N'EST PAS UN
CONFORT.** `QUALITE = 85` était une constante globale ; la descendre à 75 aurait
**réécrit `fond_offense`**, que `tools/verifier.py` compare à l'octet et que ce
lot ne touche pas. Mesuré : le décor du bassin ressort à **164 578 octets**,
identique au bit.

⚠ **`fond-empreintes.json` ENTRE**, sur le motif de `bord-empreintes.json` : Node
n'a pas de décodeur WebP, et `render/fond.js` est PUR — il porte les dimensions
source en constantes, que ce manifeste dément au dépôt si elles dérivent.

---

## 12. ÉCARTS ENTRE LE BRIEF ET LE DÉPÔT — NOMMÉS, PAS LISSÉS

1. **Les huit SHA-256 divergent** (§2). Arrêt, puis confirmation d'Ethan.
2. **Le HTML plus que doublait à q85** (§3). Arrêt, puis arbitrage : q75.
3. **`art/sourcesstandby/bord/` n'existait pas** (§6). Le brief l'annonçait comme
   un précédent ; c'est ce lot qui le crée.
4. **Les `base_bords_*` n'ont pas quitté `art/sources/`** (§6). `CLAUDE.md`
   l'interdit, et le lot MURS a le précédent : elles passent `dormantes`.
5. **Le paramètre `contour` n'est pas retiré** (§5). Un appelant le passe
   toujours ; il change de nom et de valeur.
6. **`tile_sol_*` n'est pas déplacé** (§9). Il était orphelin AVANT ce lot.
7. **`yDeLigneEcran` n'a plus d'appelant de production et reste** (§5).
8. **L'écran de raid n'a pas été vu** (§10), et se déclare non exécuté.
9. **Un défaut antérieur au lot a été corrigé par conséquence** (§8) : le calque
   des traits de voisinage était désaligné d'une demi-case depuis le lot MURS.
   Ce n'était pas au brief ; c'est la relecture hostile qui l'a trouvé, et la
   mesure qui l'a établi.
