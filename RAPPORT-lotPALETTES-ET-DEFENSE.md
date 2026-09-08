# RAPPORT — lot PALETTES-ET-DEFENSE

**08/09/2026** · branche `claude/lot-palettes-et-defense` · base `main` = `566a453`
· version **0.99.36 · build 138** · PR ouverte, **non fusionnée**.

Trois points du relevé d'Ethan du 08/09 : le **2** (« remplir la case en bas du
menu bâtiment, on a un gros carré vide, augmenter la taille du sprite »), le **8**
(« dans le menu armé les unités sont des carrés pleins avec pointillés, il faut
enlever le fond ») et le **7** (« toutes les défenses doivent être disponibles dès
qu'on a la recherche »).

---

## 0. Le premier geste, et la base

`CLAUDE.md` lu, racine et les six dossiers listés. **Aucun `PASSATION-<date>.md`
n'existe à la racine** : la plus récente trace de passation est le §0 de
`CLAUDE.md` lui-même, plus `RAPPORT-SOL-OUVRAGE.md` et `RAPPORT-lotETAT-EN-RAID.md`.

`npm ci && npm run check` sur `566a453`, avant de toucher quoi que ce soit :

| | |
|---|---|
| tests déclarés | **1 472** |
| verdict | **1 471 pass / 1 fail** |
| le rouge | **`LIMITE T8` — la frontière porte sa rampe, et elle RESSORT du sol satellite** |
| `dist/index.html` | **9 124 362 octets** |

⚠ **Le rouge est unique, il vient du lot SOL-OUVRAGE, et le §1.4 du brief
interdit de le réparer. Il n'a pas été touché**, et il est encore là à la fin.
La base annoncée par le brief était donc **exacte au test près**.

⚠ **`python3 tools/verifier.py` n'a pas été lancé, et c'était conforme** : ce lot
change la **taille d'affichage** d'un sprite, ce qui n'est pas un sprite. **Aucun
fichier d'`art/` ni de `tools/` n'apparaît au diff** — vérifié, `git diff
--name-only | grep ^art/` rend zéro.

⚠ **Trois lots tournent en parallèle.** Ce lot n'a touché ni `src/ui/monde.js`,
ni `src/ui/session.js`, ni `src/sim/fondation.js`, ni `src/sim/deplacement.js`,
ni `src/sim/generateur.js`. Il n'a pas touché `src/ui/offense.js` non plus :
aucun partage de code ne l'y a obligé.

---

## 1. Le livrable, poste par poste

Mesuré contre le livrable bâti **sur la base pristine `566a453`** au premier
`npm run check` de la session — c'est-à-dire le même arbre, le même `build.js`,
et la mesure retombe exactement sur les 9 124 362 octets que `CLAUDE.md` déclare.

| poste | avant | après | écart |
|---|---:|---:|---:|
| JavaScript | 391 813 | 391 854 | **+41** |
| feuille | 127 211 | 129 497 | **+2 286** |
| balisage | 36 205 | 36 205 | +0 |
| images | 7 375 787 | 7 375 787 | +0 |
| audio | 1 193 346 | 1 193 346 | +0 |
| **total** | **9 124 362** | **9 126 689** | **+2 327** |

**La somme des cinq postes tombe exactement sur le total, des deux côtés.** Les
`data:` ne bougent pas : **311 lignes / 306 URI** avant, **311 / 306** après —
aucune ressource n'entre, aucune ne sort.

Borne T10 inchangée à **9 300 000**. Marge **173 311 octets, 1,86 %** — contre
175 638 et 1,89 % à la base. `PIC T7` est remesuré et réécrit ; sa tolérance de
50 000 octets l'aurait laissé passer sans un mot, ce qui aurait vieilli le
chiffre écrit en silence.

### ⚠⚠ Le poste qui coûte est la feuille, pas le code, et c'est un fait de chaîne

`tools/build.js` passe `minify: true` à esbuild **pour le JavaScript seul**. Un
commentaire de JS ne pèse **rien** dans le livrable ; un commentaire de feuille y
part **à l'octet**. Mesuré : la première écriture des commentaires de ce lot
coûtait **4 088 octets** de feuille. Resserrée — sans perdre une seule des
raisons, l'arithmétique de la pastille et les deux ⚠⚠ comprises — elle en coûte
**2 286**. C'est le fait à retenir pour tout lot qui touche `src/index.src.html`,
et il est consigné dans `PIC T7` et dans le §0 de `CLAUDE.md`.

Les **41 octets de JavaScript sont le lot entier côté code** : un champ de plus
dans `FORCES` pour chacune des deux forces, sa lecture dans
`problemeDuBatimentDeProduction`, et **une raison de moins** dans
`posablesDeLaDefense` — qui en rend, d'où un solde si petit.

---

## 2. Point 2 — la pastille de la palette

### 2.1 Le carré n'était pas vide, il était trop petit

`.posable i` valait 26 px, et son commentaire annonçait « la vignette fait 43 px
de haut ». **Elle n'en fait plus 43 depuis le 03/09** : la palette est passée à
UNE seule rangée, la vignette à 75 px, et la pastille n'a pas suivi. Le sprite
flottait au milieu d'un bouton deux fois trop grand.

### 2.2 Le nouveau nombre se calcule

| étape | valeur |
|---|---:|
| bande `#chantier-palette` | 86 |
| − liseré haut | 1 |
| − 2 × `padding` vertical | 10 |
| **vignette** | **75** |
| − 2 × liseré de vignette | 2 |
| **contenu disponible** | **73** |
| − `gap` | 2 |
| − pire libellé, `7 × (1,05 + 1,15)` | 15,4 |
| **reste pour la pastille** | **55,6** |
| **retenu** | **52** |

⚠⚠ **Le libellé se dimensionne sur son pire cas, et le pire cas n'est pas
« deux lignes ».** C'est **deux lignes dont une porte un `.picto`**, et le
pictogramme fait `1.15em`, donc **plus haut que l'interligne de `1.05`**. Relevé
dans Chromium : 7,34 px pour une ligne nue, **8,05** avec un pictogramme, 14,69
pour deux lignes nues, **15,39** pour « Mur de défense » — deux lignes, deux
pictogrammes. La formule rend 15,40 : elle **majore** le réel de un centième de
pixel, elle ne le sous-estime pas.

**52 est le double rond de 26**, avec 3,6 px de marge.

### 2.3 Relevé dans Chromium, géométrie du S25 FE (360 × 780), sur le livrable bâti

| | avant | après |
|---|---|---|
| bande | 360 × 86 | 360 × 86 |
| vignette | **68 × 75** | 68 × 75 |
| pastille, bande Bâtiments (14 vignettes) | **26 × 26** — 34,7 % | **52 × 52** — **69,3 %** |
| pastille, bande Défense (17 pièces) | **26 × 26** | **52 × 52** |
| libellés relevés, Bâtiments | 7,34 · 14,69 · 15,39 | idem |
| libellés relevés, Défense | 8,05 · 15,39 | idem |
| vignettes dont un enfant déborde de la boîte | 0 | **0 sur 31** |

Le débordement est mesuré, pas supposé : pour chacune des 31 vignettes des deux
bandes, `i.top < vignette.top` et `b.bottom > vignette.bottom` sont faux.

⚠ **`image-rendering: pixelated` reste**, et il compte plus qu'avant : une source
de 64 px rendue à 52 sans lui serait floue. `PAL T1` le garde.

⚠ **Les trois cadres de famille restent d'un pixel.** `PAL T1` mesure les trois,
et mesure aussi que `.posable.actif i` garde ses **deux** pixels d'os — sans quoi
la vignette armée cesserait de se distinguer des familles.

### 2.4 ⚠⚠ La troisième bande a le même défaut, aux mêmes nombres, et elle n'est pas dans ce lot

`#offense-palette .unite` : **68 × 75, pastille 26 × 26**, exactement comme les
deux autres avant le lot. Le brief scope le point 2 à `.posable`, qui habille la
bande des Bâtiments et celle de la Défense, et demande de « vérifier les deux
bandes » — la troisième en est une autre.

**Et 52 ne s'y transpose pas.** Sa vignette porte un **troisième enfant dans le
flux** — le coût, `.cout`, 9,19 px, non absolu contrairement à celui du Chantier.
Mesuré : `i` 26 + `b` 8,05 + `.cout` 9,19 = 43,23, deux `gap` de 2, dans 73 px de
contenu. En dimensionnant sur deux lignes de libellé comme ici, la place
disponible n'y est que de **43,7 px**. Il lui faut donc **son propre nombre**,
donc son propre arbitrage.

⚠ **Et l'arbitrage du 30/08 dit « base def off »**, donc les trois barres. Le
laisser à 26 donne deux tailles pour le même sprite d'un écran à l'autre — la
divergence que la feuille se reproche déjà ailleurs. **Point ouvert n° 1, Ethan
tranche.**

---

## 3. Point 8 — les aplats du menu armé

### 3.1 Ce qui restait à faire

Le point 16 du 07/09 avait retiré l'aplat des **vignettes** (`.posable`,
`#offense-palette .unite`). Les **emplacements**, eux, portaient encore
`background: #161914` sur les deux écrans : un carré plein cerclé de pointillés —
le défaut d'Ethan, mot pour mot.

### 3.2 Ce que l'aplat cachait, relevé AVANT de le retirer : rien

Les états ont été relevés par balayage de la feuille, écran par écran, et
confrontés deux à deux. **Aucun ne se distinguait par son fond ; tous se disent
par leur liseré.**

| écran | état | liseré | contour |
|---|---|---|---|
| `#ecran-raid` | vide | `1px dashed #4E5742` | — |
| | `.occupe` | `solid #161914` | — |
| | `.inactive` | `1px dashed #68727E` | — |
| | `.abimee` | `#E43E32` | — |
| | `.chargee` | `#F5B636` | — |
| | `.enmain` | — | `2px solid #F5F3E8` |
| `#ecran-offense` | vide | `1px dashed #4E5742` | — |
| | `.occupe` | `solid #161914` | — |
| | `.apercu` | — | `2px dashed #8C9A72` |
| | `.enmain` | — | `2px solid #F5F3E8` |

`PAL T5` refait ce balayage à chaque exécution, **nomme la liste exacte des états
attendus** — pour qu'un état ajouté force à reprendre la confrontation — et
compare les signatures deux à deux.

### ⚠ Le brief se trompait sur les deux variantes qu'il nomme

Il annonce « les variantes à `border: 1px solid #F5B636` et `border: 2px solid
#4E5742` juste en dessous dans la feuille ». **La première est le badge passager**
(`#ecran-raid .emplacement .badge-passager`), **la seconde le cadre des panneaux**
`#raid-sim` / `#raid-fin`. Aucune des deux n'est un état d'emplacement. Les vrais
sont ceux du tableau ci-dessus, relevés et non recopiés.

### 3.3 Le geste, et sa mesure à l'écran

`background: #161914` → `background: transparent`, **déclaré en toutes lettres**
sur les deux écrans. La leçon du 07/09 est reprise dans le commentaire et gardée
par `PAL T4`, qui rougit si la déclaration est **supprimée** au lieu d'être
remplacée — falsification F4, vérifiée.

Relevé dans Chromium sur l'écran Offense, 36 emplacements de 33,94 px de côté :

| | avant | après |
|---|---|---|
| `backgroundColor` calculé | `rgb(22, 25, 20)` | **`rgba(0, 0, 0, 0)`** |
| `border` calculé | `1px dashed rgb(78, 87, 66)` | inchangé |

**Capture prise des deux côtés**, même écran, même géométrie, en servant les deux
livrables côte à côte : avant, quatre rangées de carrés noirs pleins cerclés de
pointillés sur la dalle de l'Offense ; après, la dalle traverse et il ne reste que
le pointillé. **C'est exactement le changement demandé, et il se voit.**

⚠ **Et il a un coût qu'il faut dire.** Sur l'écran Offense, la dalle du décor est
claire ; l'emplacement VIDE n'est plus marqué que par son liseré d'un pixel
tireté, et il se lit beaucoup moins bien qu'avant. Les états entre eux restent
deux à deux distincts — c'est ce que `PAL T5` mesure —, mais la lisibilité de la
case vide **contre le décor** a baissé. Ethan l'a demandé en connaissance de ce
qu'il voyait ; **point ouvert n° 3**, à regarder sur appareil.

⚠ **L'écran de raid montre le même défaut et reçoit le même geste**, et c'est dit
ici écran par écran comme le brief le demande. Sa case n'a pas pu être vue à
l'écran : elle demande un raid en cours. **Elle est mesurée dans la feuille, et
déclarée non vue.**

### 3.4 Le badge passager garde son fond, et son commentaire est réécrit

Il annonçait « le fond est celui des cases ». **La case n'en a plus.** Le badge le
garde parce qu'il est ce qui doit ressortir **de** la case, posé sur un sprite
d'unité, et que c'est un point de toucher de 24 px. `PAL T4` mesure qu'il le
garde.

⚠ **Aucune teinte neuve.** `transparent` n'en est pas une, et la garde `§11` de
`banc.test.js` sur les trente-trois teintes reste verte — falsification F8.

---

## 4. Point 7 — la défense ne dépend plus des bâtiments militaires

### 4.1 Ce qui tombe, et ce qui reste

Ethan, 08/09 : « que retire-t-on comme verrou en défense ? » → « **caserne usine
aérodrome** ». Le **QG de défense reste exigé**, la **recherche aussi**.

⚠ Ce n'est pas une contradiction avec le point 7 d'origine, qui parlait de « pas
de centre de commandement » : le Centre de commandement est le QG de l'**offense**
(`POINTS_ARMEE.offense.batiment`), le QG de défense est un autre bâtiment, et
c'est lui que `niveauDeCommandement(etat, 'garnison')` lit. Les deux énoncés
disent la même chose.

### 4.2 Les deux écritures tombent ensemble

| où | avant | après |
|---|---|---|
| `posablesDeLaDefense` (`ui/chantier.js`) | trois raisons, la troisième étant `batimentDeProductionManquant` | **deux raisons** |
| `problemeDuBatimentDeProduction` (`sim/state.js`) | s'applique aux deux forces | lit `FORCES.<force>.exigeLeBatimentDeProduction` |

⚠⚠ **La distinction est un CHAMP de `FORCES`, pas un `if` sur le nom de la
force** — `exigeLeBatimentDeProduction`, faux en garnison, vrai en armée. C'est la
doctrine de cette table depuis `surLeTerrain` et `porteLActivite`, écrite dans son
propre en-tête : « le reste du code lit cette table au lieu de reconnaître
garnison par son nom ». La règle reste écrite **une** fois et sert les **trois**
chemins de geste — poser, déplacer, permuter. Le jour où Ethan revient dessus,
**une ligne bascule**.

⚠ **L'ordre des raisons qui restent ne bouge pas, et le commentaire qui le
justifiait est réécrit.** Il prenait l'Épervier et l'aérodrome pour exemple :
l'exemple a disparu avec la troisième raison, et le motif — « le joueur lit ce qui
le bloque MAINTENANT » — est conservé, réécrit.

⚠ **Deux imports deviennent morts dans `ui/chantier.js` et sont retirés** :
`messageSansBatiment` et `batimentDeProductionManquant`. Trois commentaires qui
affirmaient « les deux forces » sont réécrits, dans `state.js` et `chantier.js`.

### 4.3 Ce que ça ouvre — cherché en aval, et une seule chose trouvée

| piste du §4.4 du brief | verdict |
|---|---|
| `data/couts-militaires.js` — `rosterDefensif` | **rien.** Il lit `UNITES[x].defense.present`, pas un bâtiment. |
| `ui/defense.js` — `defensesDisponibles(acquises)` | **rien.** Il ne lit que la recherche. |
| `sim/reparation.js` — réparation de garnison | **rien.** `reservoirsDeLArmee` ne boucle que sur `base.armee` ; la garnison revient par la rampe du **Complexe de défense**. Caserne, Dépôt et Aérodrome ne touchent donc plus la défense **en rien**. |
| `RELEVE-TA-*.md` | **rien.** Les mentions de la Caserne y portent sur son propre barème de montée et sur le diviseur de réparation, jamais sur une disponibilité. |
| `sim/missions.js` — `prerequisDe` | ⚠ **une dépendance latente, nommée et non touchée.** |

⚠ **`prerequisDe` écrit « il lui faut un &lt;bâtiment&gt; » pour tout objectif
d'effectif portant un châssis, sans regarder la force.** La phrase deviendrait
**fausse** pour un objectif de garnison. **Mesuré : aucune mission n'est dans ce
cas** — les deux seuls objectifs `force: 'garnison'` visent le **Merlon** et la
**Casemate**, qui ne sont pas dans `UNITES` et n'ont pas de châssis. Le fichier
n'appartient pas à ce lot ; **point ouvert n° 2**, reporté sans le toucher, comme
le §4.4 le demande.

### 4.4 ⚠ Et le §4.4 du brief se trompe : il n'y a pas d'avion en défense

Il annonce « toute la palette défensive, **avions compris** ». **Mesuré : le
roster défensif ne porte aucun aéronef** — quatre escouades (Meute, Guetteur,
Perceurs, Carapace), quatre blindés (Ratisseur, Fendeur, Broyeur, Bélier) et les
neuf ouvrages fixes. L'Aérodrome n'ouvrait donc **rien** en défense, et n'en ferme
rien aujourd'hui. `PAL T7` fige la lecture, en dérivant les châssis du roster
plutôt qu'en les recopiant, et **rougira le jour où un aéronef y entrera** — ce
qui forcera à reprendre le §4.4 avec Ethan plutôt qu'à le découvrir en jouant.

### 4.5 `SAVE_VERSION` ne bouge pas, et c'est vérifié

`export const SAVE_VERSION = 29;` — inchangé, `git diff src/sim/state.js` n'en
porte pas une occurrence. Une garnison posée sans Caserne était **déjà**
représentable dans l'état : le verrou était un refus de **geste**, jamais une
contrainte de schéma. `PD T6` et `PD T10` le mesurent depuis le 07/09 et restent
verts sans être touchés. `package-lock.json` n'est pas au diff.

---

## 5. Les tests

### 5.1 Le préfixe — écart au brief, et il était forcé

Le brief demande `PD T1` à `PD T10`. **Les dix noms sont déjà pris**, dix pour
dix, par le lot PRODUCTION-EN-DÉFENSE du 07/09 — `PD T1` à `PD T6` et `PD T10`
dans `test/state.test.js`, `PD T7` et `PD T8` dans `test/chantier.test.js`,
`PD T9` dans `test/offense.test.js`, c'est-à-dire les trois mêmes fichiers. Le
préfixe retenu est **`PAL`**, libre.

### 5.2 Les huit tests qui entrent

| test | fichier | verdict | montage effectif |
|---|---|---|---|
| **PAL T1** — la pastille remplit la vignette, et ne la dépasse pas | `chantier.test.js` | **vert** | arithmétique de la feuille : bande 86 → vignette 75 ; pastille 52 carrée ; `pixelated` ; les trois cadres de famille à 1 px et l'armée à 2 |
| **PAL T2** — un libellé sur DEUX lignes ne rogne rien | `chantier.test.js` | **vert** | `52 + 2 + 7 × (1,05 + 1,15) = 69,4 ≤ 73` ; la formule majore les 15,39 px relevés ; un libellé de 18 caractères au moins existe **dans chacune des deux bandes** |
| **PAL T4** — plus d'aplat, et c'est DÉCLARÉ | `chantier.test.js` | **vert** | les deux écrans ; aucun `background: #` ; **aucun ÉTAT ne redonne un fond** ; le badge passager garde le sien |
| **PAL T5** — les états restent deux à deux distincts | `chantier.test.js` | **vert** | balayage de la feuille, liste exacte des six états du raid et des quatre de l'Offense, signatures confrontées deux à deux |
| **PAL T7** — la palette de Défense s'ouvre sans les trois bâtiments | `chantier.test.js` | **vert** | QG niveau 50, aucun bâtiment de production, `['meute', 'merlon']` cherchés ; les châssis **dérivés du roster** ; les deux verrous restants debout |
| **PAL T8** — et le GESTE passe aussi : la palette ne ment pas | `chantier.test.js` | **vert** | **les dix-sept vignettes vives**, chacune posée sur une case cherchée, sur un état neuf pièce par pièce ; réciproque sur les grisées |
| **PAL T9** — sans QG de défense, rien ne s'ouvre | `chantier.test.js` | **vert** | les trois bâtiments **présents**, roster entier cherché, **pas de QG** ; les dix-sept grises avec la même raison ; falsifiable par le même état avec QG |
| **PAL T10** — l'OFFENSE refuse toujours | `offense.test.js` | **vert** | **le même état** ouvre la garnison et ferme l'armée ; palette **et** geste ; les trois châssis de l'armée, un par un |

**Le compte passe de 1 472 à 1 480.**

### 5.3 `PAL T3` et `PAL T6` — non-régressions, vérifiées sans être écrites

Le brief les demande comme des **non-régressions** : un test existant qui doit
rester vert **sans être modifié**. En écrire un second serait une seconde écriture
de la même règle.

| | ce qui les porte | preuve |
|---|---|---|
| **PAL T3** | `chantier.test.js` — « palette : UNE bande qui défile » (86 px) et « mise en page : le chrome fixe » (288 px) | **verts, non modifiés.** Falsification **F7** : la bande passée à 96 px fait tomber les deux, plus `PAL T1`. |
| **PAL T6** | `banc.test.js` — `§11`, aucune teinte hors de `FICHE-STYLE.md` | **vert, non modifié.** Falsification **F8** : `#F4F2E7` au lieu de `#F5F3E8` le fait tomber. |

⚠ **La hauteur de la bande n'a pas bougé**, et le §5 du brief demandait de
s'arrêter si elle devait bouger. Elle n'a pas eu à bouger.

### 5.4 ⚠⚠ Cinq tests existants sont RETOURNÉS, et aucun n'est desserré

Ils figeaient très exactement ce qu'Ethan fait tomber. Chacun garde désormais
l'autre moitié — la moitié qui reste vraie — plutôt que d'être allégé.

| test | ce qu'il figeait | ce qu'il mesure maintenant |
|---|---|---|
| **`PD T1`** (`state.test.js`) | « poser un Fusilier en garnison sans Caserne est REFUSÉ » | la pose **passe** en garnison, **et le même Fusilier reste refusé à l'assaut sur la même base**, avec la phrase exacte. Sans cette seconde moitié, un lot qui aurait **supprimé** la règle laisserait le test vert. |
| **`PD T5`** (`state.test.js`) | les trois chemins de geste fermés **en garnison** | les trois chemins fermés **en armée** — même structure, même dédoublonnage —, plus la **réciproque en garnison** : poser, déplacer et permuter y passent tous les trois sans Caserne |
| **`PD T7`** (`chantier.test.js`) | la palette de Défense et le modèle disent la même phrase | la phrase n'a toujours **qu'une source** — le balayage sur les cinq fichiers est conservé mot pour mot — mais la palette de Défense **ne la dit plus**, et le modèle la dit **en armée** |
| **`PD T8`** (`chantier.test.js`) | le grisage, discriminé par la **Caserne** | le grisage, discriminé par la **recherche** — le verrou qui reste ; les trois assertions de longueur, d'ordre et de présence sont **mot pour mot les mêmes** —, plus la trace du 08/09 : les deux palettes sont **identiques** avec et sans les trois bâtiments |
| bloc « sansProduction » de *« défense — la palette est grise sans QG »* | « seules les unités demandent un bâtiment de production » | **plus une seule vignette grise**, et une assertion de montage qui vérifie que la Caserne manque vraiment — sans quoi le bloc serait vert sur une base qui la porte |

`PD T2`, `PD T3`, `PD T4`, `PD T6`, `PD T9` et `PD T10` sont **restés verts sans
être touchés**, et `PD T4`/`PD T9` sont exactement les gardes de l'assaut : ils
ont tenu pendant tout le lot.

### 5.5 ⚠⚠ Le brief demandait `getBoundingClientRect`, et le dépôt ne peut pas

`CLAUDE.md` §3 : **ni jsdom ni navigateur**, `esbuild` est la seule dépendance de
développement, et l'en-tête de `chantier.test.js` le dit en toutes lettres. Dans
`node --test`, `getBoundingClientRect` n'existe pas ; les rares occurrences du
dépôt sont des **bouchons** qui rendent des nombres écrits à la main.

Ce qui est fait à la place est ce que la garde des 288 px fait depuis le lot
MISE-EN-PAGE : **l'arithmétique de la feuille, lue règle par règle**, jamais la
présence dans le DOM. C'est strictement plus fort qu'un test de DOM, et c'est
falsifiable — F1 à F7 le montrent.

**Et les vraies mesures existent** : elles sont relevées dans Chromium, à la
géométrie du S25 FE, sur le livrable bâti, avant et après, et elles sont au §2.3
et au §3.3 de ce rapport. Ce sont elles qui ont donné le pire cas de libellé que
`PAL T2` recalcule.

---

## 6. Les falsifications — treize, treize chutes, zéro muette

Chacune applique **une** mutation, joue les fichiers de test nommés, puis remet le
texte d'origine et **vérifie l'empreinte SHA-256 du fichier**. Jamais de
`git checkout --` : le contenu est gardé en mémoire et réécrit.

| | mutation | ce qui tombe |
|---|---|---|
| **F1** | la pastille revient à 26 px | **`PAL T1`** seul |
| **F2** | la pastille dimensionnée sur UNE ligne (62 px) | **`PAL T2`** seul — **`PAL T1` reste vert** |
| **F3** | les cadres de famille suivent la pastille (2 px) | `PAL T1` |
| **F4** | le fond de la case du raid **supprimé** au lieu d'être remplacé | **`PAL T4`** |
| **F5** | un ÉTAT d'emplacement reprend un aplat | **`PAL T4`** |
| **F6** | deux états portent le même liseré | **`PAL T5`**, + `ÉD T12` |
| **F7** | la bande passe de 86 à 96 px | les deux gardes de **`PAL T3`**, + `PAL T1` |
| **F8** | une teinte neuve dans la feuille | **`PAL T6`** — `§11` de `banc.test.js` |
| **F9** | la palette de Défense reprend le verrou du bâtiment | **`PAL T7`**, `PAL T9`, + les trois tests retournés |
| **F10** | le verrou ne tombe **que** dans la palette | **`PAL T8`** — **et `PAL T7` reste vert** —, + `PAL T10`, `PD T1`, `PD T5`, `PD T7` |
| **F11** | le verrou tombe **aussi** à l'assaut | **`PAL T10`**, + `PD T1`, `PD T4`, `PD T5`, `PD T7`, `PD T9` |
| **F12** | le verrou du QG de défense tombe avec l'autre | **`PAL T9`** |
| **F13** | la lecture du drapeau est inversée | sept, dont `PAL T8` et `PD T4` |

⚠⚠ **Les deux couples que le brief demandait nommément se comportent exactement
comme il l'annonçait.** F2 fait tomber `PAL T2` en laissant `PAL T1` vert — c'est
ce couple-là qui mesure la marge, et aucun des deux seul. **F10 fait tomber
`PAL T8` en laissant `PAL T7` vert** — c'est la palette qui ment, et c'est le test
le plus important du lot.

---

## 7. Le verdict final

| | |
|---|---|
| `npm run check` | **1 480 tests, 1 479 pass / 1 fail** |
| le rouge | **`LIMITE T8`**, hérité, unique, **non réparé** — comme le §1.4 l'exige |
| `dist/index.html` | **9 126 689 octets**, 0 référence externe |
| coût | **+2 327**, ventilé, somme exacte des cinq postes |
| `data:` | 311 lignes / 306 URI, **avant comme après** |
| marge T10 | **173 311 octets, 1,86 %** |
| `SAVE_VERSION` | **29**, inchangé |
| fichiers d'`art/` au diff | **zéro** |
| version · build | **0.99.36 · 138** |

Neuf fichiers au diff : `CLAUDE.md`, `package.json`, `src/index.src.html`,
`src/sim/state.js`, `src/ui/chantier.js`, `test/chantier.test.js`,
`test/offense.test.js`, `test/pictogramme.test.js`, `test/state.test.js`.

⚠ **Le rendu a été vu**, ce que les lots précédents déclaraient non exécuté : il
est relevé dans Chromium sur le livrable bâti, aux trois bandes et sur l'écran
Offense, avant et après. **Il n'a pas été vu sur appareil.**

---

## 8. Écarts au brief

1. **Le préfixe des tests est `PAL`, pas `PD`** — les dix noms `PD` sont pris,
   dix pour dix, par le lot du 07/09, dans les trois mêmes fichiers.
2. **`getBoundingClientRect` n'est pas asserté dans les tests** : le dépôt n'a ni
   jsdom ni navigateur. Les tests assertent l'arithmétique de la feuille ; les
   vraies mesures sont relevées dans Chromium et sont **au rapport**, avant et
   après, comme le §7 du brief le demande par ailleurs.
3. **`PAL T3` et `PAL T6` ne sont pas écrits comme des tests neufs** : le brief
   les définit lui-même comme des non-régressions de tests existants qui doivent
   rester verts **sans être modifiés**. Ils le sont, et F7/F8 le prouvent.
4. **Le §3.2 nomme deux variantes qui ne sont pas des états d'emplacement** — le
   badge passager et le cadre des panneaux de raid. Les vrais états sont relevés
   par balayage.
5. **Le §4.4 annonce « avions compris »** : il n'y a **aucun aéronef** dans le
   roster défensif. `PAL T7` fige la lecture.
6. **Le §2.1 cite un commentaire qui dit « la vignette fait 43 px »** : c'est le
   commentaire périmé lui-même, pas la mesure. La vignette fait **75 px**.
7. **Cinq tests existants sont retournés**, ce que le brief ne prévoyait pas. Le
   §5.4 dit lequel, pourquoi, et ce que chacun garde à la place.
8. **`test/pictogramme.test.js` est modifié** — `PIC T7` est remesuré et réécrit,
   ce que le §7 du brief demande.

---

## 9. Points ouverts, pour Ethan

1. **La palette de l'Offense a le même « gros carré vide », aux mêmes nombres**,
   et elle n'est pas dans ce lot. 26 × 26 dans 68 × 75. Sa vignette porte un
   troisième enfant dans le flux (le coût), donc **43,7 px** de place et non 55,6 :
   il lui faut son propre nombre. L'arbitrage du 30/08 disait « base def off ».
2. **`prerequisDe` de `sim/missions.js`** écrit « il lui faut un &lt;bâtiment&gt; »
   sans regarder la force : la phrase serait fausse pour un objectif de garnison.
   **Aucune mission n'est dans ce cas aujourd'hui** — les deux objectifs de
   garnison visent des ouvrages fixes. Le fichier appartient à un autre lot.
3. **La case VIDE du menu armé se lit moins bien** contre la dalle claire de
   l'Offense, maintenant qu'elle n'a plus que son liseré d'un pixel. Les états
   restent deux à deux distincts ; c'est la lisibilité **contre le décor** qui a
   baissé. À regarder sur appareil.
4. **Les états occupée, abîmée, chargée et en main n'ont pas été vus à l'écran** —
   ils demandent une partie avancée ou un raid en cours. Mesurés dans la feuille,
   **déclarés non vus**.
5. **`LIMITE T8` est toujours rouge**, hérité de SOL-OUVRAGE, non réparé comme le
   brief l'exige. Le dépôt déclare toujours « N pass / 0 fail » là où
   `npm test` rend « N−1 pass / 1 fail ».
6. **`package.json` ne déclare toujours aucun `engines`** : **sixième
   signalement**, reporté tel quel. Le dépôt exige Node ≥ 22 et rien ne le dit à
   `npm`.
7. **La marge sous la borne T10 est de 1,86 %.** Elle a coûté 2 286 octets à ce
   lot **en commentaires de feuille**, parce que le CSS n'est pas minifié. Si la
   marge doit être défendue, minifier la feuille rendrait d'un coup les
   ~127 000 octets de commentaires qu'elle porte — c'est un arbitrage, pas une
   correction, et il revient à Ethan.

---

**La fusion sur `main` appartient à Ethan seul.**
