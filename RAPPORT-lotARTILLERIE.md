# RAPPORT — lot ARTILLERIE

Branche `claude/rayons-artillerie-arbitrage-8jyf8c`, base `main` = `014f9f4`,
qui EST le merge du lot GRILLE LONGUE (#167). Version **0.99.75 · build 187**.

Le lot câble les **trois artilleries du joueur**, qui existaient dans
`BASE_BATIMENTS` depuis BÂTIMENTS-JOUEUR-V2 — avec leurs sprites et leurs quatre
états — et qu'**aucune branche du dépôt ne lisait**. Elles deviennent une
**attrition passive d'avant-combat** : quand l'Ouvrage vient, la vague arrive
déjà entamée. Elles ne tirent pas, ne dessinent pas leur portée, et n'ont pas de
ligne au rapport de défense — le brief met les trois hors périmètre.

---

## §1 — Le compte de tests, avant et après

| | déclarés | pass | fail | skipped | `npm run check` |
|---|---|---|---|---|---|
| **avant**, `main` = `014f9f4` | 1 664 | 1 663 | 0 | 1 | 0 |
| **après** | **1 666** | **1 665** | **0** | **1** | **0** |

Le lot ajoute **deux** tests, `ART T1` et `ART T2`, dans
`test/raid-ouvrage.test.js`, qui passe de 37 à **39**. `test/` reste à **80**
fichiers `*.test.js` et **89** `*.js` : aucun fichier n'entre ni ne sort, ni de
`test/`, ni de `src/`.

Le `skipped` est `LIMITE T8`, suspendu par Ethan le 08/09 ; il ne bouge pas.

⚠ **Aucune assertion n'a été retirée ni assouplie.** Les quatre réancrages du §6
écrivent chacun le nombre d'avant à côté de celui d'après et portent une
contre-assertion qui refuse le retour de l'ancien.

---

## §2 — Le coût en octets, poste par poste

`npm run build` → `dist/index.html`, **10 605 304 octets**, **0 référence
externe**.

Mesuré contre le livrable **REBÂTI** dans un `git worktree` pristine de `main` =
`014f9f4` — **10 603 945 octets**, c'est-à-dire le nombre que la §0 de CLAUDE.md
annonçait pour GRILLE LONGUE, **retrouvé à l'octet**.

| poste | avant | après | écart |
|---|---:|---:|---:|
| images (`data:` image) | 8 832 344 | 8 832 344 | **+0** |
| audio (`data:` audio) | 1 241 654 | 1 241 654 | **+0** |
| JavaScript (net de ses `data:`) | 442 873 | 444 232 | **+1 359** |
| feuille (net de ses `data:`) | 48 142 | 48 142 | **+0** |
| balisage (net de ses `data:`) | 38 932 | 38 932 | **+0** |
| **total** | **10 603 945** | **10 605 304** | **+1 359** |

Les cinq postes **PARTITIONNENT** le fichier des deux côtés — écart **0 · 0**.
`data:` à **316 lignes / 315 URI** de part et d'autre : aucune ressource n'entre
ni ne sort, et **le coût est entièrement du JavaScript**.

Borne T10 **10 820 000, NON TOUCHÉE** — le lot ne fait entrer aucune ressource,
et §5 ne connaît qu'un sens à ce curseur. Marge **214 696 octets, 1,98 %**,
au-dessus du plancher de 150 000 qu'asserte `PIC T7`.

⚠⚠ **`PIC T7` EST RÉANCRÉ SUR LE POURCENTAGE, PAS SUR LA TOLÉRANCE.** Les 1 359
octets valent **un trente-septième** de sa tolérance de 50 000 : laissé tel
quel, il serait resté **VERT** pendant que sa dernière assertion — celle qui
compare la marge en pour-cent — aurait annoncé 2,00 % là où le disque en rend
1,98. C'est exactement la dérive que cette assertion-là existe pour refuser, et
c'est pourquoi le réancrage se fait ici et non « quand ça dépassera ».

---

## §3 — Ce que le lot écrit

### §3.1 — `src/data/base.js`

Trois renommages, sans toucher `nom.ouvrage`, qui reste **absent** sur les trois
(ce sont des bâtiments du joueur) :

| clé | `nom.joueur` | `ta` |
|---|---|---|
| `artillerieAntiInfanterie` | **Batterie de saturation** | `Skystrike Support` |
| `artillerieAntiVehicule` | **Canon ionique** | `Ion Cannon Support` |
| `artillerieAntiAerien` | **Intercepteur** | `Falcon Support` |

`classeDeCout: 'courant'` → **`'majeur'`** et `COEFFICIENT_DE_REGIME` 6 → **8**
sur les trois, **dans le même geste** (Ethan, 20/09). L'ancre du niveau 2 et le
coefficient de régime décrivent la MÊME entité : en déplacer une seule ferait un
bâtiment cher à l'entrée et bon marché en fin de partie.

Mesuré sur `artillerieAntiInfanterie`, avant → après :

| grandeur | avant | après |
|---|---:|---:|
| ancre du niveau 2 | 5 | **8** |
| palier 12 | 144 000 | **192 000** |
| palier 30 | 21 315 389 | **28 420 518** |
| palier 50 | 5 497 584 051 | **7 330 112 068** |

⚠ **Rien n'a été écrit pour l'électricité**, et c'est mesuré :
`COUT_ELECTRICITE.fraction.autres` vaut 0,25 et suit toute seule. Au niveau 3,
l'artillerie coûtait **6 quartz et 2 d'électricité** ; elle coûte **10 et 3**.

`SOUTIEN_DE_BASE` entre après `RETOUR_DEFENSES` ; `ARTILLERIES` se dérive de
`role === 'artillerie'` et est déclaré **APRÈS** `BASE_BATIMENTS` — un `const`
ne se lit pas avant d'être écrit, et c'est la zone morte temporelle que
`BATIMENTS_DONNES` a payée le 10/09. **Aucun `id.startsWith('artillerie')`
n'entre au dépôt** : un préfixe de nom serait la seconde vérité que §4 interdit.

### §3.2 — `src/sim/combat.js`

`COLONNE_PAR_CHASSIS` devient `export`. **C'est le seul changement de ce
fichier** — neuf lignes ajoutées dont **sept de commentaire**, deux retirées, et
la seule ligne de CODE qui change est le mot-clé `export`. La recopier dans
`raid-ouvrage.js` aurait donné deux tables pour la même correspondance, dont une
seule recevrait la prochaine correction.

### §3.3 — `src/sim/raid-ouvrage.js`

`retraitDesArtilleries(etat, laBase, niveauAttaquant)` somme, par colonne de
matrice, les retraits des artilleries **de toutes les bases du joueur** dont le
disque euclidien couvre la base attaquée. L'effet est appliqué **dans
`montageDeLaBaseDuJoueur`**, entre `genererVague` et le littéral du montage.

### §3.4 — refus, tolérance, palette

`'artillerie-unique'` entre dans `problemesDeDisposition` **et** dans
`CODES_TOLERES_AU_CHARGEMENT` ; les trois vignettes se **GRISENT** avec leur
propre phrase, elles ne disparaissent pas.

---

## §4 — Les deux faits qui portent le lot

### §4.1 — Le retrait est dans le MONTAGE, pas appliqué après coup

`pourLeRejeu` ne retire que `indicesDefenseurs` et `indicesBatiments` : tout le
reste du montage traverse la sauvegarde et rejoue **à l'octet**. Un retrait posé
sur une COPIE servie à `creerCombat` rendrait un rapport qui rejoue une vague
**INTACTE** — le combat d'origine cesserait d'être rejouable, **et rien ne le
dirait**.

C'est la falsification **F4**, et elle fait tomber les **DEUX** tests.

### §4.2 — À retrait nul, la clé n'existe pas

`serialiserEtat` trie les clés **PROPRES** : un `pvMilli` posé partout entrerait
dans l'empreinte de chaque rapport rejouable et ferait bouger les deux cents
témoins de combat **sur des montages où pas une artillerie n'est posée**.

`ART T1` mesure par `hasOwnProperty`, **jamais par `=== undefined`**, sur quatre
chemins : aucune artillerie posée ; une artillerie hors de portée ; une colonne
dont le retrait vaut zéro (l'Intercepteur ne touche pas l'infanterie) ; un malus
qui annule l'effet.

---

## §5 — Les deux tests, et leurs preuves

### `ART T1 — la clé pvMilli n'existe PAS quand le retrait est nul, sur quatre chemins`

Quatre montages, `hasOwnProperty` sur chacun, **plus** un cinquième cas positif
qui prouve d'abord que la clé EXISTE quand le retrait mord — sans lui, le test
passerait sur un code qui n'applique jamais rien.

### `ART T2 — le retrait voyage dans le rapport, et le rejeu survit à la démolition`

Un raid subi sous une artillerie, le rapport rangé, la sauvegarde **sérialisée
et rechargée**, l'artillerie **DÉMOLIE**, puis le rejeu : la vague rejouée porte
les mêmes PV entamés qu'au combat d'origine. Démolir l'artillerie est ce qui
distingue « le retrait a voyagé » de « le retrait se recalcule au rejeu ».

### `ART T1` RESSERRÉ À LA RELECTURE HOSTILE — DEUX LISTES QUE RIEN NE TENAIT

⚠⚠ **`ARTILLERIES` ET `SOUTIEN_DE_BASE` SE DÉRIVENT DE SOURCES DIFFÉRENTES, ET
RIEN NE LES CONFRONTAIT.** La première est DÉRIVÉE de `role === 'artillerie'` et
commande la palette et le refus de pose ; la seconde est ÉCRITE à la main et
commande le retrait, où `retraitDesArtilleries` discrimine par `=== undefined`.
Un quatrième bâtiment `role: 'artillerie'` serait donc grisé, refusé en double,
**et ignoré par le retrait — sans qu'un seul test ne tombe**. C'est la seconde
vérité que §4 de `CLAUDE.md` interdit, et elle se mesure dans les DEUX sens.

`ART T1` gagne donc **un `deepEqual` bidirectionnel en tête de son corps**. Ce
n'est pas un troisième test : le brief en demande deux, et il en reste deux. Le
resserrement d'une garde existante est ce que §5 de `CLAUDE.md` autorise
explicitement — « retourner un garde-fou en écrivant pourquoi : oui ».

### Les six falsifications

| | falsification | verdict |
|---|---|---|
| **F1** | la clé `pvMilli` est posée même à retrait nul | **38 / 1** — `ART T1` |
| **F2** | le plancher `Math.max(0, …)` du malus est retiré | **38 / 1** — `ART T1` |
| **F3** | la portée devient un carré de Tchebychev | **38 / 1** — `ART T1` |
| **F4** | le retrait est appliqué après coup, sur une copie servie à `creerCombat` | **37 / 2** — les DEUX |
| **F5a** | une artillerie sans entrée dans `SOUTIEN_DE_BASE` | **38 / 1** — `ART T1` |
| **F5b** | une entrée de `SOUTIEN_DE_BASE` qui n'est pas une artillerie (`centrale`) | **38 / 1** — `ART T1` |

⚠ **F5a ET F5b SONT LES DEUX SENS DE LA MÊME GARDE**, et il fallait les deux :
un `every` dans un seul sens aurait laissé passer l'autre. La première est la
faute qu'on commettrait en ajoutant une artillerie ; la seconde, celle qu'on
commettrait en renommant un bâtiment.

⚠⚠ **F2 NE MORDAIT PAS AUX NOMBRES DU BRIEF, ET C'EST MESURÉ.** Voir §6.2.

⚠ **F2 a d'abord paru ne pas mordre pour une seconde raison, d'outillage** : le
`assert s.count(ancien) == 1` du heredoc a levé — l'indentation réelle était de
six espaces, j'en avais écrit dix — et le shell a continué, imprimant
« 39 pass / 0 fail » d'un fichier **non modifié**. `cat -A` pour relever
l'espacement exact, puis réapplication. *Une falsification qui ne mord pas se
vérifie avant d'être crue*, et la première chose à vérifier est qu'elle a été
appliquée.

---

## §6 — Écarts déclarés au brief

### §6.1 — Les trois rayons : un arbitrage, et c'est une ROTATION

Le brief donne **6 · 4 · 3** et le déclare lui-même comme une *lecture non
confirmée*. L'arbitrage d'Ethan du 22/09 rend **4 · 3 · 6**.

⚠⚠ **ET LE DÉPÔT PORTE DEUX RELEVÉS QUI SE CONTREDISENT SUR CE POINT — TROUVÉ À
LA RELECTURE HOSTILE, ET LE BRIEF N'EN CITE QU'UN.** Il écrit « elle inverse le
relevé TA », au singulier, et renvoie à `RELEVE-TA-ARSENAL.md` §4 :
Skystrike 12, Falcon 10, Ion Cannon 8, avec la phrase « le rayon décroît quand
la cible devient plus lourde ». Mais `RELEVE-TA-COURBES-2.md` §6.6 porte
**l'ordre inverse** — Skystrike **8**, Falcon 10, Ion Cannon **12** — et il est
corroboré par sa propre colonne de calibrage, 30 s · 60 s · 120 s, monotone
avec le rayon. Les deux tables ne peuvent pas être vraies ensemble.

| bâtiment | brief | ARSENAL §4 | COURBES-2 §6.6 | **arbitrage 22/09** |
|---|---:|---:|---:|---:|
| Batterie de saturation (anti-infanterie) | 6 | 6 | 3 | **4** |
| Canon ionique (anti-véhicule) | 4 | 3 | 6 | **3** |
| Intercepteur (anti-avion) | 3 | 4 | 4 | **6** |

*(les deux colonnes de relevé sont le RANG des rayons TA reporté sur l'échelle
du brief, pas une conversion — 12 · 10 · 8 et 8 · 10 · 12 ne sont pas des cases
de cette carte.)*

**L'arbitrage ne coïncide avec aucune des trois lectures** : il met
l'anti-aérien en tête, ce qu'aucun relevé ne dit. Ce n'est donc ni « le brief
avait raison » ni « le relevé avait raison » — c'est une valeur de jeu. Les
trois `rayonCases` portent la valeur du brief **en commentaire à côté de la
leur**, pour qu'un lot futur ne « corrige » pas l'arbitrage en croyant réparer
une coquille.

⚠ **LA CONTRADICTION ENTRE LES DEUX RELEVÉS N'EST PAS TRANCHÉE PAR CE LOT**, et
elle n'a pas à l'être : l'arbitrage du 22/09 rend la question sans objet pour
les rayons. Elle est écrite dans `src/data/base.js` à côté de la table, pour que
le prochain lot qui voudra s'appuyer sur « le relevé » sache qu'il y en a deux.
**Ethan tranche.**

Ce que les rayons couvrent, en disque euclidien :

| rayon | disque | carré de Tchebychev | cases que la métrique retire |
|---:|---:|---:|---:|
| 3 | 29 | 49 | 20 |
| 4 | 49 | 81 | 32 |
| 6 | 113 | 169 | 56 |

### §6.2 — Le cas 3 du brief tombe EXACTEMENT sur la borne du malus

Son §6 monte ce cas avec « un Canon ionique de niveau 1 contre un assaillant de
niveau 21 », soit un écart de **vingt** : `1000 − 50 × 20` vaut **zéro tout
rond**. `Math.max(0, 0)` est un non-événement — rien ne passe sous zéro — donc
la falsification que le brief nomme lui-même (« le cas 3 tombe aussi si le malus
est borné à autre chose que zéro ») **NE MORD PAS**.

**Mesuré des deux côtés :**

| écart de niveau | malus nu | F2 (plancher retiré) |
|---:|---:|---|
| 20 (le brief) | **0** | **39 / 0** — inerte |
| 30 (le montage) | **−500** | **38 / 1** — mord |

Le montage passe donc à un assaillant de **niveau 31**. Le test porte les deux
mesures côte à côte et une assertion exige que l'écart POUSSE le malus sous
zéro : le jour où quelqu'un ramènera le niveau, le test tombera au lieu de
devenir muet.

### §6.3 — Le montage « hors de portée » du brief ne discriminait pas la métrique

Il pose la base voisine à **quatre cases en ligne droite**, où Tchebychev et
Euclide répondent la même chose : **F3 y passait au VERT**. La base voisine est
en **(203, 18)** désormais — Δr 3, Δc 2 :

* Tchebychev : `max(3, 2) = 3 ≤ 3` → **DEDANS**
* Euclide : `3² + 2² = 13 > 3² = 9` → **DEHORS**

F3 mord. C'est la doctrine du lot EUCLIDE, et un montage qui ne distingue pas
les deux métriques ne garde ni l'une ni l'autre.

### §6.4 — L'illustration d'électricité du brief est le nombre d'AVANT le lot

Il annonce **2** d'électricité au niveau 3 ; mesuré, c'est la valeur **avant**
le passage en `majeur`. Après, c'est **3**. Rien n'avait à être écrit dans les
deux cas — la fraction suit.

### §6.5 — La branche

Le brief demande `claude/artillerie-soutien` ; l'environnement d'exécution
épingle la session à **`claude/rayons-artillerie-arbitrage-8jyf8c`** et interdit
de pousser ailleurs sans autorisation explicite.

---

## §6 bis — Ce que la relecture hostile a trouvé

Le §9 du brief l'exige avant la PR. Elle a rendu **trois** choses, toutes
traitées ; aucune n'avait été vue à l'écriture.

**1. Un import mort dans `src/sim/raid-ouvrage.js`.** `ARTILLERIES` y était
importé et **jamais lu** — `grep -c` rendait **1**, la ligne d'import seule. Le
module discrimine par `SOUTIEN_DE_BASE[batiment.id] === undefined`, ce qui est
juste et ce qui rend l'import inutile. Retiré. ⚠ Il faisait mentir la prose :
le rapport et `CLAUDE.md` laissaient entendre que ce module LIT la liste
dérivée, ce qu'il ne fait pas. ⚠⚠ **Et le livrable ne bouge pas d'un octet** —
mesuré des deux côtés, **10 605 304** : `esbuild` élaguait déjà le nom. Le
réancrage de `PIC T7` tient donc tel quel, et ce n'est pas une supposition.

**2. Deux listes d'artillerie que rien ne tenait ensemble** — voir §5, le
resserrement d'`ART T1` et les falsifications F5a / F5b.

**3. Une citation qui ne renvoyait qu'à la moitié de sa source** — voir §6.1 :
le dépôt porte DEUX relevés TA qui se contredisent sur l'ordre des rayons, et
les neuf nombres de retrait sont au dépôt plutôt que simplement « rapportés par
Ethan ». `src/data/base.js`, ce rapport et `CLAUDE.md` sont corrigés ensemble.
⚠ `CLAUDE.md` §6 l'écrit : *« une citation qui renvoie à une source qu'on
s'interdit de lire ne vaut pas mieux que pas de citation »* — ici la source
était lisible, et elle n'avait pas été lue en entier.

---

## §7 — Ce que le lot laisse ouvert, nommément

* **`test/temoins-couts.js` est périmé, et il l'était AVANT ce lot.** Il porte
  **42 lignes dont onze bâtiments** quand le roster en compte **quinze** : les
  deux collecteurs de la bascule `collecteur` →
  `collecteurQuartz`/`collecteurScorie` y manquent, il porte encore une ligne
  `batiment/collecteur` qui ne désigne plus rien, et **les trois artilleries n'y
  ont jamais été**. Le changement de classe de coût ne s'y voit donc **pas**, et
  `donnees.test.js` épingle `TEMOINS_COUTS.length` à 42. Le régénérer ferait
  entrer cinq lignes qu'aucun brief n'a demandées et réancrer un test qui n'est
  pas de ce lot. **Relevé, non régénéré ; Ethan tranche.**
* **Le retrait n'apparaît pas au rapport de défense** — hors périmètre (§7 du
  brief). Le joueur voit une vague entamée, il ne lit pas de combien.
* **Aucune porte de recherche** sur les trois bâtiments, **aucun emploi
  offensif**, **aucune portée dessinée sur la carte** — les trois sont hors
  périmètre.

---

## §8 — Ce qui a été vu, et ce qui ne l'a pas été

**Vu** — faux document de `chantier.test.js`, base neuve : **treize vignettes,
aucune grisée**. Un Canon ionique posé : **les trois grisées**, et la même
phrase sur les trois — « Canon ionique occupe déjà cette base : une seule
artillerie par base ».

**⚠⚠ NON EXÉCUTÉ — le rendu dans un navigateur.** Rien n'a été ouvert. Et
surtout : **ce que le lot change au COMBAT ne se voit nulle part** — une vague
entamée avant le premier tick n'a pas de dessin. *À regarder au premier essai* :
que les trois noms neufs tiennent dans la vignette de la palette.

**⚠ NON EXÉCUTÉ, ET C'ÉTAIT CONFORME — `python3 tools/verifier.py`.** Le lot ne
touche ni `art/`, ni un outil de la chaîne : zéro fichier au diff, et le brief
l'écarte nommément.

---

## §9 — Le barème, mesuré

Le brief le dit : *« les pourcentages sont des mesures, pas des assertions »*.
**Aucun test de calibrage n'a été écrit.** Voici l'effet nu, retrait en
millièmes des PV de départ, par écart de niveau entre l'assaillant et le
bâtiment :

**Batterie de saturation** — rayon 4

| écart | infanterie | véhicule | structure / aviation |
|---:|---:|---:|---:|
| 0 | 50 ‰ | 30 ‰ | 30 ‰ |
| 5 | 37 ‰ | 22 ‰ | 22 ‰ |
| 10 | 25 ‰ | 15 ‰ | 15 ‰ |
| 15 | 12 ‰ | 7 ‰ | 7 ‰ |
| 20 | **0 ‰** | **0 ‰** | **0 ‰** |

**Canon ionique** — rayon 3

| écart | infanterie | véhicule | structure / aviation |
|---:|---:|---:|---:|
| 0 | 40 ‰ | 60 ‰ | 0 ‰ |
| 10 | 20 ‰ | 30 ‰ | 0 ‰ |
| 20 | **0 ‰** | **0 ‰** | 0 ‰ |

**Intercepteur** — rayon 6

| écart | infanterie | véhicule | structure / aviation |
|---:|---:|---:|---:|
| 0 | 0 ‰ | 0 ‰ | 80 ‰ |
| 10 | 0 ‰ | 0 ‰ | 40 ‰ |
| 20 | 0 ‰ | 0 ‰ | **0 ‰** |

**Vingt niveaux d'écart annulent l'effet, quel que soit le bâtiment** — c'est
`malusParNiveauPourMille = 50` et rien d'autre. **Le calibrage revient à
Ethan** ; le lot pose la mécanique, il ne juge pas si elle est jouable.

---

## §10 — `SAVE_VERSION`

**Ne bouge pas, reste à 40** — vérifié au diff : pas un champ n'entre dans
l'état. Le retrait vit dans un **MONTAGE** de combat, qui naît de `subirUnRaid`
et meurt avec lui ; ce qui le fait voyager est le rapport, et
`etat.rapports[].rejeu` porte le montage entier depuis le lot GRILLE LONGUE.

---

## §11 — Les fichiers touchés

**Douze au diff**, plus ce rapport qui entre :

`src/data/base.js` · `src/sim/combat.js` · `src/sim/disposition.js` ·
`src/sim/raid-ouvrage.js` · `src/sim/state.js` · `src/ui/chantier.js` ·
`test/base.test.js` · `test/pictogramme.test.js` · `test/raid-ouvrage.test.js` ·
`test/state.test.js` · `package.json` · `CLAUDE.md` ·
**`RAPPORT-lotARTILLERIE.md`** (entrant).

**Pas une ligne de `src/render/`, `src/son/`, `src/data/` hors `base.js`,
`tools/` ni `art/`** — vérifié au diff. Aucun fichier n'entre ni ne sort de
`src/` ni de `test/`.
