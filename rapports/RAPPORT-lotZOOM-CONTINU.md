# RAPPORT — lot ZOOM-CONTINU

**Version produite : 0.88.0 · build 90.**
`npm run check` → **1026 pass / 0 fail**, `dist/index.html` **6 780 316 octets**,
0 référence externe.

Baseline relevée sur le clone intact, avant de toucher quoi que ce soit :
**1015 pass / 0 fail**, `dist/index.html` **6 779 831 octets**, 0.87.0 · build 89
— conforme au brief au dernier octet, et **verte**, ce qui n'était pas arrivé
depuis quatre lots.

`python3 tools/verifier.py` **n'a pas été lancé, et c'était conforme** : le lot
ne touche ni `art/`, ni `tools/`.

---

## 1. Ce que le lot défait, et le trou qui l'autorisait

Ethan, 04/09 : « le zoom de la carte ne doit pas être par cran », puis « on met
ça en stand-by et on fait le zoom continu ».

`src/ui/monde.js` portait ce pavé, écrit le 30/08 :

> ⚠⚠ LE ZOOM RESTE PAR CRANS […] Un zoom continu demanderait de recalculer les
> dalles à chaque image — 19 ms pièce, mesuré — pour rendre du flou.

**Le raisonnement supposait que l'échelle d'AFFICHAGE et l'échelle de RENDU sont
la même grandeur. Elles ne le sont pas.** `rendreDalle` fabrique une image à un
cran de la table ; `drawImage` la POSE à la taille qu'on veut. Une dalle rendue
au cran 128 s'affiche à 67,84 px par case **sans être recalculée**.

Ce que le pavé disait de juste est gardé, et c'est la moitié qui compte : **on ne
grossit jamais du pixel art.** `cranDeRendu` rend le plus PETIT cran ≥ à
l'échelle — jamais le plus proche, qui donnerait un facteur jusqu'à 1,41,
c'est-à-dire le « gros carré moche » du 30/08 que `tuilesParCase: 2` a corrigé.

---

## 2. Fichiers touchés

| Fichier | Ce qui change |
|---|---|
| `src/ui/monde.js` | l'échelle devient un réel ; `cranDeRendu`, `facteurDAffichage`, `bornerEchelle`, `vueApresEchelle`, `bordDeDalle` entrent ; `cranIndex`, `changerDeCran`, `SEUIL_PINCEMENT` et le `cache.vider()` du zoom sortent |
| `src/render/embleme.js` | la garde d'échelle de `dessinerGrosseBase` change de cible — voir §5 |
| `src/data/sites.js` | `dallesEnCache` : 30 → **64**, avec la mesure qui l'exige |
| `test/monde.test.js` | les onze tests `ZOOM`, plus deux gardes existantes RETOURNÉES |
| `CLAUDE.md` | §0 et la ligne de `src/ui/` de §2 (« quatre crans » → « zoom continu ») |

**Coût : +485 octets, entièrement du JavaScript.** Mesuré poste par poste contre
un livrable rebâti depuis `origin/main` dans un `git worktree` :
**289 `data:` avant, 289 après** — aucune image, aucun son n'entre.
Borne T10 **inchangée à 7 000 000**, marge **219 684 octets, 3,14 %**.

---

## 3. Les onze tests, et leur montage effectif

Tous dans `test/monde.test.js`. **Aucune assertion existante n'a été retirée.**

| Test | Montage effectif | PASS |
|---|---|---|
| `ZOOM T1` | `cranDeRendu` et `facteurDAffichage` sur les quatre crans exacts ; plus une contre-épreuve qui refuserait un « plus petit cran STRICTEMENT supérieur » | PASS |
| `ZOOM T2` | `cranDeRendu(65)` → **128** ; et `ECHELLE_MIN + 0,5` → `CRANS[1]` | PASS |
| `ZOOM T3` | 100 échelles réparties dans les bornes ; facteur toujours dans (0,5 ; 1] ; le cran rendu est dans la table ; le pire facteur relevé (0,502) prouve que le balayage atteint la borne basse | PASS |
| `ZOOM T4` | 16, 400, 0, −32, `NaN`, `Infinity` LÈVENT ; les deux bouts exacts sont acceptés ; `ECHELLE_MIN`/`MAX` sont ÉGALES aux bouts de `CRANS` — donc lues, pas recopiées | PASS |
| `ZOOM T5` | 200 facteurs × 5 origines × 20 dalles, la boucle de dessin REJOUÉE en `(x0, largeur)` ; plus la garde de source sur les six lignes de `dessinerFond` ; plus la contre-épreuve chiffrée de la pose naïve | PASS |
| `ZOOM T6` | mêmes 200 facteurs : la somme de 20 largeurs égale l'écart des bords extrêmes, et ne s'écarte jamais de plus d'un pixel de `20 × coteAffiche` | PASS |
| `ZOOM T7` | `vueApresEchelle` sur six échelles de départ × 1,3 ; la case sous l'ancre bouge de moins de 0,01 ; plus une contre-épreuve qui ancre au centre et DOIT dévier | PASS |
| `ZOOM T8` | `bornerEchelle` aux deux butées ; à la butée haute la vue est identique **au bit** ; et `cranDeRendu(bornerEchelle(x))` ne lève pour aucun `x`, y compris ±1e9 | PASS |
| `ZOOM T9` | 60 échelles × 4 demandes : aucun `NaN`, jamais au-delà du bord ; plus le centrage exact d'une carte plus étroite que le canevas — **écart déclaré, voir §7** | PASS |
| `ZOOM T10` | `cranIndex`, `SEUIL_PINCEMENT`, `changerDeCran` absents de la source DÉCOMMENTÉE ; les quatre noms neufs présents ; et le commentaire qui explique la disparition est encore là | PASS |
| `ZOOM T11` | `cache.vider()` n'est plus APPELÉ ; la méthode `vider` existe toujours ; la clé de dalle porte `cranCourant()` | PASS |

### Neuf falsifications, neuf chutes

| # | Falsification | Ce qui tombe |
|---|---|---|
| F1 | `cranDeRendu` rend le cran le plus PROCHE | `ZOOM T2`, `ZOOM T3` |
| F2 | `dessinerFond` arrondit la largeur de la dalle | `ZOOM T5` |
| F3 | la clé de dalle oublie le cran de rendu | `ZOOM T11` |
| F4 | `cranDeRendu` se replie au lieu de lever | `ZOOM T4` |
| F5 | l'aplat d'attente arrondit sa largeur | `ZOOM T5` |
| F6 | `vueApresEchelle` ancre au centre, pas aux doigts | `ZOOM T7` |
| F7 | `bornerEchelle` rend sa demande telle quelle | `ZOOM T8` + la garde du pincement |
| F8 | le cache se revide au changement d'échelle | `ZOOM T11` |
| F9 | la garde de la grosse base redevient une garde de TABLE | la garde des emblèmes |

⚠⚠ **F2 N'A PAS MORDU AU PREMIER RELEVÉ, ET C'EST LA NEUVIÈME FOIS DU DÉPÔT.**
Remplacer `x1 - x0` par `Math.round(coteAffiche)` dans `dessinerFond` — le défaut
même que `ZOOM T5` existe pour empêcher — laissait la suite **ENTIÈREMENT VERTE :
49 pass / 0 fail, mesuré**. L'arithmétique de `bordDeDalle` était juste et
testée ; le SITE DE POSE, lui, est hors de portée des tests faute de DOM (§3 de
`CLAUDE.md`), et rien ne le lisait. C'est exactement ce que le §4 du brief
annonçait — « le lot JOURNAL a montré qu'une garde qui ne lit que l'appel reste
verte quand le corps est vide ». `ZOOM T5` lit désormais les six lignes de
`dessinerFond`, comme `SON T24` lit les trois d'`avancerDUnTick`.
**Une falsification qui ne mord pas se vérifie avant d'être crue.**

---

## 4. Les quatre mesures

Toutes relevées dans Chromium sur le livrable réel, viewport **360 × 720 px CSS,
dpr 3** — le téléphone visé —, canevas physique **1080 × 1692**. `playwright-core`
est installé **hors du dépôt** : `CLAUDE.md` §3 interdit d'ajouter une dépendance
de test, et cette règle tient.

⚠⚠ **M1 ET M2 SONT RELEVÉES SUR LE GESTE, PAS SUR UNE IMAGE FIXE**, et le geste
est **cadencé sur `requestAnimationFrame`** — un couple de `pointermove` par
image, la main rendue entre chaque. Sans cette cadence, les dalles que
`dessinerFond` diffère à l'image suivante ne se calculent jamais et les deux
livrables paraissent tous les deux gratuits : le premier relevé annonçait
« médiane 0 ms » pour `main`, et c'était un artefact du montage.

### M1 — temps par image, contre `main` rebâti

Trois exécutions, médiane des trois, 60 images par sens.

| | `main` (par crans) | **lot** (continu) |
|---|---|---|
| intervalle entre images, médiane | **16,7 ms** | **16,8 ms** |
| images sous 16,7 ms | **57 / 60** | **42 / 60** |
| p90 de l'intervalle | 50 ms | 150 ms |
| pire intervalle | 83 ms | 200 ms |
| dalles calculées sur l'aller | 39 | 96 |

**Le seuil du brief est tenu : médiane 16,8 ms, c'est-à-dire le plancher de la
synchronisation verticale, identique à `main`.** Le pire cas est nommé :
**200 ms**.

⚠ **ET LA QUEUE EST PLUS LOURDE QU'AVANT — IL FAUT LE DIRE DANS CE SENS-LÀ.**
Le lot calcule **96 dalles là où `main` en calcule 39**, et ce n'est pas un
défaut : un zoom continu traverse de nouveaux indices de dalle à CHAQUE image
— le pas de la grille en pixels d'écran vaut `cote × facteur` et rétrécit sans
arrêt —, là où un zoom par crans ne redessine que trois fois sur toute la
course. Une image sur quatre est longue, contre une sur vingt avant.
**C'est le prix du continu, et Ethan doit le voir pour le payer.**

### M2 — dalles calculées par image

**43 images sur 60 n'en calculent AUCUNE.** Les pics tombent aux passages de
cran et à eux seuls, par salves de quatre :

```
4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,4,2,0,0,0,0,…,4,4,4,4,4,4,0,…
```

Trois salves pour trois passages de cran (32 → 64 → 128 → 256), et rien entre
elles. **C'est la thèse du lot, et elle est mesurée.**

⚠ **QUATRE ET NON DEUX, ET LE MOTIF EST ANTÉRIEUR AU LOT.** `DALLES_PAR_IMAGE`
vaut 2 **par appel de `dessiner`** ; deux doigts émettent deux `pointermove` par
image, donc deux dessins. Le plafond effectif par image est le double de ce que
la constante annonce. `main` a la même propriété.

### M3 — le cache, et pourquoi `dallesEnCache` monte à 64

**Mesuré : une seule image pose jusqu'à 32 dalles** (médiane 20) sur ce canevas.
Le cache en tenait **30** : chaque image évinçait donc deux dalles dont elle
avait encore besoin, et l'image suivante les recalculait — indéfiniment.

Médiane par image d'un pincement qui **REVIENT** du plus serré au plus large —
la direction exigeante, celle qui redemande ce que l'aller a calculé —, trois
exécutions :

| capacité | médiane du retour | dalles recalculées au retour | mémoire |
|---|---|---|---|
| **30** (avant) | **26,6 ms** | 103 | 30 Mio |
| 32 | 28,2 ms | 103 | 32 Mio |
| 40 | 18,7 ms | 78 | 40 Mio |
| 48 | 19,0 ms | 71 | 48 Mio |
| **64** (retenu) | **8,1 ms** | 54 | **64 Mio** |
| 96 | 7,0 ms | 30 | 96 Mio |

**64 est la première valeur qui passe sous le budget de 16,7 ms**, et elle vaut
le double de la fenêtre d'une image.

⚠⚠ **ET LE PRIX EST EN MÉMOIRE, IL FAUT L'ÉCRIRE.** Une dalle est un canevas de
512 × 512 en RVBA, soit **1 Mio exactement** : le cache passe de 30 à **64 Mio**.
Le seul curseur qui rendrait la même fluidité pour moins est `dalleCotePx` — 512
→ 256 divise la dalle par quatre en surface —, ce qui est un autre lot, et que
`ui/monde.js` désigne déjà comme le bon levier. **Ethan tranche s'il juge 64 Mio
trop cher.**

### M4 — les coutures

⚠⚠ **MESURÉES PAR UN TÉMOIN, PAS PAR UNE CAPTURE AGRANDIE.** On peint un aplat
magenta sur tout le canevas, on redessine, et on compte ce qui reste : tout pixel
témoin est un trou que les dalles n'ont pas couvert. Une couture d'un pixel se
voit mal à l'œil ; elle se compte exactement.

| facteur | échelle | lu à l'écran | pixels témoins | lignes / colonnes de couture |
|---|---|---|---|---|
| 0,53 | 67,84 px/case | « 23 px / case » | **0** sur 1 827 360 | 0 / 0 |
| 0,71 | 90,88 px/case | « 30 px / case » | **0** sur 1 827 360 | 0 / 0 |
| 0,89 | 113,92 px/case | « 38 px / case » | **0** sur 1 827 360 | 0 / 0 |

⚠ **UN ZÉRO SE FALSIFIE AVANT D'ÊTRE CRU.** Contre-épreuve sur un livrable
rebâti avec la pose naïve — position ET largeur arrondies chacune de son côté :
**6 409 pixels témoins, 3 lignes et 2 colonnes de couture** au facteur 0,53. Le
témoin voit donc les coutures, et les zéros ci-dessus sont de vrais zéros.

⚠ **ET LA CONTRE-ÉPREUVE REND 0 AUX FACTEURS 0,71 ET 0,89**, où l'arrondi tombe
juste par accident. C'est exactement pourquoi `ZOOM T5` balaie **200 facteurs**
plutôt que trois : mesuré, **198 sur 200 laissent au moins une couture** avec la
pose naïve, médiane 39 sur 200 dalles, pire cas 99 — une dalle sur deux. Trois
captures ne pouvaient pas le dire.

---

## 5. Le blocage trouvé en vérifiant le §2.5

Le brief écrivait : « En principe, ils suivent l'échelle réelle sans une ligne de
plus. **“En principe” n'est pas une mesure.** » Vérifié, et la réponse est non
pour l'un des six.

⚠⚠ **`dessinerGrosseBase` DE `render/embleme.js` EXIGEAIT UN CRAN DE LA TABLE ET
LEVAIT À TOUTE ÉCHELLE INTERMÉDIAIRE.** Ce n'est pas le décalage d'un pixel que
le brief redoutait : **une levée dans la boucle de dessin tronque tout l'écran
Monde**, et la base terminale est à l'écran dès qu'on regarde le haut de la
carte.

Mesuré à l'unité avant d'écrire une ligne :

```
cran 64   -> OK   cran 97.3 -> LÈVE : emblème : cran 97.3 hors de 32, 64, 128, 256
```

**Contre-épreuve de bout en bout**, ancienne garde rebâtie et carte amenée au
haut de la carte à l'échelle 49,92 px/case :

| | ancienne garde | lot corrigé |
|---|---|---|
| erreurs de page | **1** — `RangeError : cran 49.92 hors de la table` | **0** |
| base 3 × 3 posée | **0 fois** | **2 fois** |
| emblèmes posés | 135 (la boucle avorte) | **188** |

⚠ **LA GARDE A CHANGÉ DE CIBLE, ELLE N'A PAS ÉTÉ RETIRÉE.** Ce qu'elle défend
reste « le dessin ne s'invente pas une échelle » ; la faute qui peut arriver
aujourd'hui n'est plus un cran hors table — il n'y en a plus — mais une échelle
qui n'est pas un nombre : un `NaN` rendrait `drawImage` **muet, sans lever et
sans dessiner**, ce qui est la faute que ce module tout entier raconte. Elle
refuse donc `0`, `-5`, `NaN` et `Infinity`, et le test les vérifie un par un.

⚠ **ET `ZOOM_CARTE` EST SORTI DES IMPORTS DE `render/embleme.js`** : plus une
ligne ne le lisait, et un import qui ne sert plus est un mensonge sur les
dépendances.

### Les six de §2.5, un par un

| Dessin | Vérifié à échelle fractionnaire | Verdict |
|---|---|---|
| emblèmes | **188 images posées** à 67,84 px/case, 0 erreur | suit |
| base terminale | **2 posées**, 0 erreur — voir ci-dessus | suit, **après correction** |
| frontières de territoire | visibles à la capture, tracées case par case | suit |
| halo de la base | **2 `strokeRect` en 3,5 s** à 36 px/case (facteur 0,5625) | suit |
| étiquettes | **72 `fillText` + 36 `fillRect`** au-dessus du seuil, **0 en dessous** | suit |
| flèche de raid | — | **NON EXÉCUTÉE**, voir §7 |

⚠ **ET LE TOUCHER SUIT AUSSI, CE QUI N'ÉTAIT PAS AU BRIEF.** `relacher` calcule
`Math.floor(px / echelle) + 1` : le panneau d'un site s'ouvre bien sur la case
visée à échelle fractionnaire — relevé à 68 px CSS/case, panneau « Base de
l'Ouvrage, rangée 268, colonne 16 ». Un zoom qui décrocherait le doigt de la
case serait la faute que le dépôt refuse depuis toujours sur la grille du
Chantier.

---

## 6. Le verdict sur la netteté, honnêtement

**Le fond n'est PAS plus flou qu'avant aux échelles intermédiaires, et il est
plus net que ce que le pavé du 30/08 laissait craindre.** Les captures jointes le
montrent : à facteur 0,53 comme à 0,89, le pavage est continu, sans grille ni
liseré, et le grain de l'art reste lisible.

Trois raisons, et elles sont dans le code :

1. **On ne grossit jamais.** Le facteur reste dans (0,5 ; 1], donc toute pose est
   une RÉDUCTION — le cas où un rééchantillonnage est doux.
2. **Le lissage est vrai pour le fond**, et faux partout ailleurs. Une réduction
   non entière en « plus proche voisin » produirait du moiré ; il est remis à sa
   valeur d'avant en sortant de `dessinerFond`, si bien que les emblèmes gardent
   la décision du 30/08 telle quelle.
3. **Aux crans exacts, le rendu est celui d'avant au bit près** : facteur 1,
   bords entiers, `drawImage` 1:1, aucun rééchantillonnage. `ZOOM T1` l'exige.

⚠ **CE QUI A CHANGÉ D'ASPECT, C'EST L'EMBLÈME, ET C'EST MINEUR.** Un emblème est
posé sans lissage à une taille désormais fractionnaire : son échantillonnage
n'est plus un rapport exact de puissance de deux. À l'œil, sur les captures, la
différence ne se voit pas — mais **elle n'a pas été soumise à Ethan**, et si
elle le gênait, la ligne à changer est celle du lissage à la création du
contexte. **Une ligne, et c'est un arbitrage esthétique.**

---

## 7. Écarts au brief, et points en suspens

⚠ **`ZOOM T9` ATTENDAIT « PAS DE VUE NÉGATIVE », ET C'ÉTAIT UN LAPSUS DU BRIEF.**
Une vue négative est le comportement **voulu** et déjà testé depuis le lot
ÉCRAN-CARTE : quand la carte tient entière dans le canevas, `bornerDefilement`
la **CENTRE** plutôt que de la coller à gauche, et centrer se dit par un
décalage négatif. L'exiger positif aurait cassé une décision arbitrée. Le test
vérifie donc ce qui est vrai : aucun `NaN` à échelle fractionnaire, jamais de
dépassement du bord, et le centrage exact.

⚠ **LA FLÈCHE DE RAID SE DÉCLARE NON EXÉCUTÉE, ET LA RAISON EST DE JEU.** Elle
ne se dessine que sur une cible **à portée** (coût non nul). Or la garde du
peuplement écarte les bases de l'Ouvrage de **quinze cases du départ**, et les
satellites n'apparaissent qu'après cinq minutes : une partie neuve n'a aucune
cible à portée, et deux balayages complets de l'écran n'en ont ouvert aucune.
Sa géométrie est `traitDeLaFleche(base, site, ox, oy, pas)` — la même
arithmétique en `pas` que le halo, qui est vérifié. **Un test appareil non
exécuté se déclare non exécuté, jamais passé.**

⚠ **`dallesEnCache` A ÉTÉ RELEVÉ, ET LE BRIEF L'AUTORISAIT** — « à relever dans
`src/data/sites.js` si la mesure le demande, avec le nombre observé en
commentaire ». La mesure le demandait : à 30, la médiane du retour est 26,6 ms,
soit au-dessus du seuil que le brief pose lui-même pour M1. **Le coût en mémoire,
64 Mio, est le point que ce rapport soumet à Ethan.**

⚠ **`DALLES_PAR_IMAGE = 1` A ÉTÉ MESURÉ ET N'A PAS ÉTÉ APPLIQUÉ.** C'est le seul
levier qui abaisse la queue de M1 sans toucher à la mémoire. Mesuré, trois
exécutions :

| | `= 2` (livré) | `= 1` (proposition) |
|---|---|---|
| médiane du geste, aller | **6,5 ms** | 23,6 ms |
| pire cas du geste | 117 ms | **70 ms** |
| images sous 16,7 ms | **42 / 60** | 30 / 60 |

Il échange un à-coup plus court contre un remplissage plus lent, et **dégrade la
médiane d'un facteur 3,6**. Ce n'est pas un gain net. **Un nombre se change
seul ; Ethan tranche.**

⚠ **AUCUNE MESURE SUR APPAREIL.** Le brief demandait M1 « Chromium headless
**et** l'appareil ». Il n'y a pas d'appareil ici, et `CLAUDE.md` §3 est formel :
un test appareil non exécuté se déclare non exécuté. Les nombres ci-dessus sont
ceux d'un Chromium **sans GPU**, ce qui les rend plutôt pessimistes sur le coût
de `drawImage` et plutôt optimistes sur la variance. **À rejouer sur le Galaxy
S25 FE avant de conclure sur la queue de M1.**

---

## 8. Ce que le rapport tranche, comme le brief l'exige

> **Le cran de rendu choisi « au plus petit ≥ » tient-il le budget d'image ?**

**Oui.** La médiane de l'intervalle entre images vaut **16,8 ms**, c'est-à-dire
le plancher de la synchronisation verticale, et elle est **identique à celle de
`main`** (16,7 ms). Le facteur reste dans (0,5 ; 1] et ne grossit jamais le pixel
art.

**Il n'y a donc pas lieu de proposer le cran le plus proche**, et il reste écarté
pour la raison qui l'écartait d'avance : il agrandirait la source jusqu'à 1,41,
ce qui est le défaut que `tuilesParCase: 2` a corrigé le 30/08.

Ce qui reste ouvert n'est pas le cran de rendu, ce sont **deux nombres** : les
64 Mio de cache, et `DALLES_PAR_IMAGE`. Les deux sont chiffrés ci-dessus, les
deux se changent seuls.

---

## 9. Les ancres

Chaque édition de source a été faite en **extrayant l'ancre du fichier** puis en
la remplaçant, jamais en la retapant, et **chaque remplacement a vérifié son
`count`** — `assert s.count(ancre) == 1` avant d'écrire, sur les quinze éditions
du lot. Une ancre absente ou trouvée deux fois fait échouer l'édition au lieu de
la commettre à moitié : c'est ce qui a attrapé, en cours de route, une reprise
qui aurait laissé une accolade orpheline en queue de `ui/monde.js`.

---

## 10. Ce que le lot ne fait pas

- **Les étiquettes.** `ETIQUETTE_CARTE.cssMiniParCase` est en pixels CSS par
  case : il devient **continu de lui-même**, et c'est mesuré — 0 étiquette à
  38 px/case, 72 `fillText` à 68. Le retour d'Ethan sur les noms qui doivent
  tenir jusqu'à « environ dix cases » reste en stand-by, et **pas un nombre n'a
  été touché**.
- **Le zoom de l'écran Base**, « depuis l'angle en haut à gauche, très bizarre ».
  Autre écran, autre mécanisme, autre lot. **Pas entamé.**
- **`SAVE_VERSION` ne bouge pas et reste à 24.** Pas un champ n'entre dans
  l'état : une échelle d'affichage vit dans l'écran, et rien ne la sauvegarde.
