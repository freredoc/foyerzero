# RAPPORT — lot AVARIES

**20/09/2026.** Les deux grosses bases de l'Ouvrage gagnent leurs trois états.
Version produite : **0.99.72 · build 184**. Base de départ : `f1271af`, merge du
lot SON 2 (PR #164).

⚠⚠ **`main` a bougé DEUX FOIS pendant l'écriture de ce lot, et il a été remesuré
trois fois.** Écrit sur l'arbre de VERROUS avant sa relecture (9 124 022), puis
rebasé après elle (9 123 813), puis après le merge du lot SON 2 (**9 162 381**).
**Le coût est identique au bit sur les trois bases — +213 176** : aucun des
trois lots ne touche aux mêmes fichiers. La marge, elle, change à chaque fois.
Tout ce qui suit est mesuré sur la base réelle.

Coût : **+213 176 octets**. Six dessins entrent.

---

## 1. Ce que le lot corrige

`base_o_2x2` et `base_o_3x3` n'avaient qu'un dessin. Les sites d'une case en
portent quatre depuis les lots EMBLÈMES-ABÎMÉS (06/09) et CONQUÊTE-24H (07/09) :
sain, fumée, feu, ruine.

Sur les **sept bases que le joueur doit casser pour finir la partie** — la base
finale et ses six verrous —, il n'avait donc aucun moyen de voir ce qu'il avait
déjà entamé. C'est précisément là que ça compte : un verrou se casse en
plusieurs passes, et savoir lesquels sont déjà à moitié tombés est toute
l'information tactique du bout de carte.

Huit sprites désormais : deux emprises × quatre états.

---

## 2. Le point dur : l'échelle — et il était déjà résolu

Les planches saines font **1 254** pixels de côté, les six neuves **1 024**.

C'est **exactement** l'écart qu'EMBLÈMES-ABÎMÉS avait traité pour les quatre
familles d'emblème, et son commentaire le dit mot pour mot : *« les quatre
planches saines font 1 254 pixels de côté, les huit neuves 1 024. Comparer des
pixels bruts rétrécirait tout l'état abîmé de 18 %. »*

Les deux grosses bases sortent donc de `PLANCHES` pour leur propre boucle à
`cote_ref`, et la référence est prise **sur les quatre états à la fois**.

### Sans ça, la base aurait grossi en brûlant

`recadrer` porte la plus grande dimension de chaque cellule à l'emprise. Une
ruine effondrée, plus petite que la base intacte, aurait donc été **agrandie**
pour remplir la case — et le joueur aurait vu sa cible grossir à mesure qu'il la
détruisait.

C'est ce que l'arbitrage **Q3** d'Ethan — « les ruines/abîmé suivent
l'original » — demande d'éviter. La référence commune est ce qui l'obtient.

Mesuré, boîtes de l'encre à la grille 128 :

| Sprite | Boîte | px opaques |
|---|---|---|
| `base_o_2x2` | 238 × 232 | 49 541 |
| `base_o_2x2_fumee` | 212 × 208 | 39 079 |
| `base_o_2x2_feu` | 214 × 218 | 39 396 |
| `base_o_2x2_ruine` | 214 × 210 | 38 877 |
| `base_o_3x3` | 353 × 318 | 81 715 |
| `base_o_3x3_fumee` | 354 × 318 | 78 810 |
| `base_o_3x3_feu` | 358 × 322 | 78 262 |
| `base_o_3x3_ruine` | 354 × 316 | 78 154 |

Les états de la 2 × 2 sont **nettement plus petits** que le sain — la base perd
des morceaux, et ça se voit.

### ⚠ Un effet de bord mesuré : la 3 × 3 saine rétrécit de 1,4 %

| | Avant | Après | Écart |
|---|---|---|---|
| `base_o_2x2` | 238 × 232 | 238 × 232 | **0 × 0** |
| `base_o_3x3` | 358 × 322 | 353 × 318 | **−5 × −4** |

La 2 × 2 ne bouge pas d'un pixel. La 3 × 3, si : le **panache de son état en
feu** monte plus haut que le bâti et devient la borne de la famille. C'est le
même effet que le commentaire d'EMBLÈMES-ABÎMÉS décrit — « le panache fait
monter la hauteur jusqu'à 1,08 cellule ».

1,4 % est imperceptible, mais c'est un changement d'octets sur un fichier
existant : il est dit plutôt que subi.

---

## 3. Le chroma : le dossier se trompait, et c'est mesuré

Le dossier de préparation annonçait :

> « Le chroma est faux sur les trois lots. […] `tools/fond-vert-ouvrage.py`
> existe pour ça. **À passer avant toute déclaration.** »

**C'est faux.** `cle_de_fond` **détecte** la clé sur les quatre coins de
l'image — elle ne se paramètre pas —, et les six planches se comportent
exactement comme les deux saines déjà au dépôt :

| Planche | Clé détectée | Distance minimale du sujet au magenta |
|---|---|---|
| les six neuves | MAGENTA | **140,1 à 144,4** |
| `S10_base_ouvrage_3x3_finale` *(au dépôt depuis le 30/08)* | MAGENTA | *143,0* |

Seuil : 140. Les pixels à risque sont **4 au maximum sur 640 000** — six par
million — contre 0 sur 977 070 pour la planche saine. Du même ordre.

**Aucune conversion n'a été faite**, et il n'y avait rien à convertir.

---

## 4. Le trou du lot VERROUS, trouvé ici

⚠⚠ **`sitesDeLaFenetre` ne poussait que la base finale. Les six verrous
existaient dans le modèle et n'étaient dessinés NULLE PART.**

`siteDeLaCase` les rendait, `problemesDuRaid` les gardait, le peuplement les
excluait, la migration les protégeait — et le joueur ne pouvait ni les voir, ni
les viser, ni donc ouvrir la base finale.

**Le défaut était muet** : aucun test ne tombait, la carte s'affichait, la suite
était verte à 1656 pass. La seule façon de s'en apercevoir était de regarder le
haut de la carte.

Corrigé ici. Le bloc `terminale` devient une boucle sur `grossesBasesDeLaCarte()`,
avec niveau et avarie. `EMB-AV T3` le garde désormais.

⚠ **Et le niveau de la finale à l'écran était faux pour la même raison** :
l'écran demandait `niveauDeLaRangee`, donc **50**. Il demande
`niveauDeLaGrosseBase`, donc **60**. Le test qui l'épinglait à `niveauPlafond` a
été retourné, avec une contre-assertion.

C'est mon défaut, laissé dans le lot précédent. Il est dit plutôt que glissé
dans un réancrage.

---

## 5. Le câblage

**Six marqueurs de plus dans `tools/build.js`**, et c'est le prix de la forme :
un site d'une case porte ses quatre états dans `atlas-carte`, qui les coud ; une
grosse base couvre 2 × 2 ou 3 × 3 cases, `coudre` la refuse, donc chaque état
voyage dans son propre marqueur.

La table se **dérive** des deux axes — deux emprises × quatre états — plutôt que
de s'écrire huit fois. Idem pour les huit balises `<img>` du HTML et pour la
table d'images de `ui/monde.js`, indexée par le **nom du sprite** et non plus
par le nombre de côtés.

`spriteDeLaGrosseBase(cotes, avarie)` et `spriteDeLaGrosseRuine(cotes)` suivent
le partage que le dépôt fait déjà pour les sites d'une case : **une ruine n'est
pas un état d'avarie**, donc elle ne passe pas par le même paramètre.

⚠ `dessinerGrosseBase` prend l'avarie en **cinquième paramètre, défaut
`'aucune'`** : tout appelant d'avant le lot rend exactement le nom d'avant.

⚠ Et un nom sans image retombe sur le sain plutôt que de vider l'écran :
`ctx.drawImage(undefined, …)` lève, et une levée dans la boucle de dessin vide
tout l'écran Monde — c'est ce que `dessinerGrosseBase` a coûté au lot
ZOOM-CONTINU.

---

## 6. Tests

**Trois tests neufs**, dans `test/avaries-grosses-bases.test.js`. `test/` passe
de 79 à **80** ; `CLAUDE.md` §2 le nomme.

| | Ce qu'il garde |
|---|---|
| `EMB-AV T1` | les huit sprites sur le disque, **huit noms distincts**, les suffixes du dépôt, les états dérivés d'`AVARIE` |
| `EMB-AV T2` | l'état traverse le dessin, les huit marqueurs entrent, chaque sprite a sa balise |
| `EMB-AV T3` | **les sept grosses bases sont dessinées** et portent une avarie |

### Trois falsifications qui mordent, une déclarée qui ne peut pas

| Falsification | Verdict |
|---|---|
| l'état ne voyage plus jusqu'au dessin | **tombe** (`T2`) |
| la carte revenue à la seule base finale | **tombe** (`T3`) |
| une balise retirée du HTML | **tombe** (`T2`) |
| les six états retirés de la table de `build.js` | **NE TOMBE PAS — déclaré** |

⚠⚠ **La quatrième mérite son paragraphe.** Retirer les six états de la table
laisse le test **vert** — parce que le **build lève d'abord** :
*« ressource référencée au lieu d'être inlinée : « %BASE_O_2X2_RUINE% » »*, et
`dist/` garde alors le livrable d'avant.

La garde offline de `tools/build.js` est donc la vraie protection ; l'assertion
du test est une seconde ligne, qui mordrait le jour où un marqueur serait
substitué par du vide plutôt que laissé en clair. **Un test qui ne peut tomber
sur aucun état d'aujourd'hui se déclare, il ne se compte pas** — c'est la règle
que le lot RUINES-DÉFENSE a posée, et elle s'applique ici.

### Six tests réancrés, aucun assoupli

| Test | Avant | Après |
|---|---|---|
| `AC T8` | 306 URI · 307 lignes · `webp: 43` | **312 · 313 · `webp: 49`** |
| `PIC T7` | 9 162 381 · ancre périmée à 9 123 813 | **9 375 557 · 324 443 · 3,34 %** |
| `EMB-C T4` | 135 sprites, 2 WebP | **141 sprites, 8 WebP** |
| `EMB-C T5` | un appel `ancrage='centre'` | **deux** |
| `SOUFFLE T1` | montage sur marqueurs littéraux | montage sur le **HTML** |
| « sites — … se dessinent en dernier » | finale au niveau 50 | **60**, + les six verrous assertés |

⚠ **`SOUFFLE T1` mérite un mot** : son montage cherchait `%BASE_O_2X2%` comme
chaîne littérale dans `tools/build.js`. La table les **dérive** depuis ce lot,
donc le montage était devenu faux — et **un montage faux fait tomber un test
sain**, ce qui est la pire des deux fautes. Il se prend désormais sur le HTML,
qui les porte écrits.

---

## 7. Coût et verdict

| Poste | Avant | Après | Écart |
|---|---|---|---|
| images | 7 395 405 | 7 607 579 | **+212 174** |
| JavaScript | 438 850 | 439 495 | +645 |
| balisage | 38 429 | 38 786 | +357 |
| feuille | 48 043 | 48 043 | +0 |
| audio | 1 241 654 | 1 241 654 | +0 |
| **TOTAL** | **9 162 381** | **9 375 557** | **+213 176** |

Partition exacte des deux côtés — **écart 0 · 0** — et `data:` de **306 à
312 URI**, soit exactement six de plus : un par état.

Les **357 octets de balisage** sont les six balises `<img>`. C'est le prix de
n'être pas une cellule d'atlas, pas un défaut de câblage.

**Borne T10 : 9 700 000, non touchée.** Marge **324 443, soit 3,34 %** — au-dessus du plancher de 150 000, et de loin. §5 *autorise* le
relèvement quand une ressource entre légitimement ; elle ne l'impose pas, et
relever sans nécessité dépenserait d'avance la marge du lot de la grille longue.

### Verdict

- `npm run check` : **0**.
- `npm test` : **1660 déclarés · 1659 pass · 0 fail · 1 skipped**
  (`LIMITE T8`, suspendu par Ethan le 08/09).
- `tools/verifier.py --outil emblemes` : **283 identiques · 0 différents · 0
  nouveaux**.
- `tools/entrees.py --verifier` : **690 fichiers, 515 consommées · 175
  dormantes**.
- `dist/index.html` : **9 375 557 octets**, 0 référence externe.

⚠ `verifier.py` **sans `--outil`** sort toujours en rouge sur 176 sprites de
`bâtiment`, `defense`, `socle` et `chassis` — constat du lot SOUFFLE,
préexistant et mesuré sur `main` pristine. La famille `carte` est intacte.

---

## 8. Un constat sur `main`, signalé et non corrigé

⚠⚠ **L'ancre de `PIC T7` était périmée de 38 568 octets à l'arrivée de ce lot.**

Le lot SON 2 (#164) fait entrer **70 masters** — l'audio passe de 1 203 086 à
1 241 654 octets — **sans réancrer `PIC T7` ni bumper `config.build`**, qui
reste à 183 alors que le livrable a changé.

La tolérance de 50 000 du bas de `PIC T7` l'a laissé passer au vert. C'est
exactement la dérive muette que ce test existe pour attraper, et que le lot
ÉCHELLE-RECHERCHE a réancrée pour **51 octets**.

**Ce lot-ci la referme**, en mesurant contre l'arbre réel. Mais deux points
restent, et ils ne sont pas à moi :

1. `config.build` est resté à **183** alors que `dist/index.html` a changé. §5
   dit de bumper « seulement quand `dist/index.html` change » — ici il a changé.
   Les appareils ne verront pas la mise à jour, `PolitiqueVersion` lisant le
   build.
2. Rien ne dit dans `CLAUDE.md` ce que le lot SON 2 a mesuré.

**Ethan tranche** — je ne touche ni à sa version ni à sa §0.

---

## 9. Ce qui reste ouvert

**Le nommage des sources.** Les six gardent les noms d'Ethan —
`base_ouvrage_2x2_abimee.png` — là où le dépôt préfixe souvent par `S10_`. Le
mapping degré → état (`abimee` → `_fumee`, `tres_abimee` → `_feu`) vit dans la
table de `tools/emblemes.py`, qui est l'endroit prévu. Les renommer serait une
migration pour rien ; les renommer **à moitié** serait pire.

**La grille longue** — bandes 2 / 16 / 9, 78 défenses, trois fonds de
1080 × 3240. C'est le dernier lot du dossier, et c'est lui qui relèvera T10 vers
**10 770 000**. ⚠ Le doublement des défenses lui appartient : 78 défenses ne
tiennent pas sur 72 cases, et **aucune garde du générateur ne le dirait**.

**À regarder à l'écran**, que je ne peux pas juger : les trois états se
distinguent-ils au cran où la carte se joue ? Un verrou en fumée et un verrou en
feu doivent se lire d'un coup d'œil, pas au zoom maximum.
