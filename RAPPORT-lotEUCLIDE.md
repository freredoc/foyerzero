# RAPPORT — lot EUCLIDE : la carte passe en distance euclidienne

Exécuté le **02/09/2026**. Base de départ : `main` à `630ca03` (après RAID-B).

---

## 1. Version et build produits

| Grandeur | Avant | Après |
| --- | --- | --- |
| `package.json` version | 0.63.0 | **0.64.0** |
| `config.build` | `"64"` | **`"65"`** |
| `dist/index.html` | 1 376 307 o | **1 376 909 o** |
| `SAVE_VERSION` | 20 | **21** |

Les deux champs restent des **chaînes** — `android/app/build.gradle.kts` les lit
`as String`.

---

## 2. Base de référence du §1 — retrouvée, les quatre nombres

| Grandeur | Attendu | Mesuré |
| --- | --- | --- |
| version / build | 0.63.0 / 64 | **0.63.0 / 64** ✅ |
| `dist/index.html` | 1 376 307 octets | **1 376 307** ✅ |
| `node --test "test/*.test.js"` | 843 / 843 / 0 | **843 pass, 0 fail** ✅ |
| `SAVE_VERSION` | 20 | **20** ✅ |

Aucun `RAPPORT-lotEUCLIDE.md` n'existait à la racine.

---

## 3. Delta d'octets, tests avant / après

- **+602 octets** (1 376 307 → 1 376 909). C'est le rapport le plus déséquilibré
  du dépôt entre ce qu'un lot pèse et ce qu'il déplace : trois fonctions de
  distance et deux constantes, et **toutes les positions de toutes les bases et
  de tous les POI changent**.
- Marge sous la borne T10 (1 400 000) : **23 091 octets, 1,65 %**. La borne
  **n'a pas été relevée** — aucune image n'entre, mesuré : **16 `data:` avant,
  16 après**.
- Tests : **843 → 855**, 0 fail. +12 dans `test/euclide.test.js` (fichier neuf).

---

## 4. Chaque test du §6, avec sa falsification jouée

Toutes les falsifications ont été jouées **sur une copie fraîche du dépôt**.

| # | Verdict | Falsification jouée | Résultat |
| --- | --- | --- | --- |
| **T1** | **PASS** | `estAPorteeDAttaque` rendue à Tchebychev | **T1 et T2 tombent** |
| **T2** | **PASS** | (même montage) | tombe |
| **T3** | **PASS** | `Math.sqrt` réintroduit dans `estAPorteeDAttaque` | T3 tombe, seul |
| **T4** | **PASS** | `horsDeLaGarde` rendue à Tchebychev | T4 tombe, seul |
| **T5** | **PASS** | `probabiliteCandidate` remise à 0,14 | T5 tombe, seul |
| **T5 bis** | **PASS** | — (il MESURE le plafond structurel, voir §5) | — |
| **T6** | **PASS** | validation d'entrée de `distanceCarreeCases` retirée | T6 tombe, seul |
| **T7** | **PASS** | `import { distanceCarree } from './grille.js'` ajouté à `satellites.js` | T7 tombe, seul |
| **T8** | **PASS** | migration 20 → 21 réduite à un bump de version | T8 tombe, seul |
| **T9** | **PASS** | `casesDeLAnneau` rendue à Tchebychev | T9 tombe, seul |
| **T10** | **PASS** | — (voir §6 : le classement des tests remesurés) | — |
| *hors brief* : un seul décideur de portée | **PASS** | filtre de `ciblesAPortee` retiré | le test de portée de `site-de-la-case.test.js` tombe |
| *hors brief* : zones d'influence en Tchebychev | **PASS** | — | — |

### T7 a attrapé une vraie faute, au premier jet

La garde qui interdit le nom `distanceCarree` dans les trois modules a **échoué
sur mon propre code** : `casesArrondiesAuSuperieur` avait un paramètre nommé
`distanceCarree`, et `casesDeLAnneau` une variable locale du même nom — très
exactement le nom de la distance du **combat**, en milli-cases. Les deux ont été
renommés `carreDeLaDistance`. Un nom qui invite à la confusion la produit tôt ou
tard ; c'est la garde qui a servi, pas la relecture.

### Une falsification a d'abord été jouée à vide, et il faut le dire

Le premier essai de la falsification T7 ne s'est **pas appliqué** — la chaîne
d'import que je remplaçais n'existait pas telle quelle dans `satellites.js` —, si
bien que la suite est restée verte sans qu'aucun défaut n'ait été injecté. C'est
la leçon du lot RÉSERVE, reprise ici : **vérifier qu'on a bien injecté un défaut
avant d'accuser la garde**. Rejouée correctement, T7 tombe.

---

## 5. M1, M2, M3

### M1 — la `probabiliteCandidate` retenue

| Grandeur | Valeur |
| --- | --- |
| `probabiliteCandidate` | **0,35** |
| Densité mesurée | **15,914** bases par 12 × 12 |
| Écart-type | **0,355** |
| Min / max par graine | 15,1 / 16,8 |
| Graines | **150** |
| Cible et tolérance | `basesParDouzeCarre: 16`, `toleranceMesure: 1` |

⚠⚠ **LE « 24 ± 1 » DU BRIEF ÉTAIT IMPOSSIBLE, ET LA BORNE EST MATHÉMATIQUE.**
`estBaseOuvrage` retient une case si elle est un **maximum local strict** du
hachage parmi ses huit voisines candidates. À `probabiliteCandidate = 1`, toutes
les cases sont candidates : la densité vaut alors celle des maxima locaux d'un
champ indépendant dans un voisinage de neuf, c'est-à-dire **exactement 1/9**,
soit **16 par 12 × 12**. Mesuré sur 120 graines, avec une réimplémentation locale
**confrontée à `estBaseOuvrage` — 0 écart sur 26 660 cases** :

| p | 0,14 | 0,25 | 0,30 | 0,35 | 0,45 | 0,50 | 0,60 | 0,80 | 1,00 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| bases / 12×12 | 11,97 | 14,85 | 15,53 | **15,88** | 16,27 | 16,31 | 16,39 | 16,16 | 16,35 |

Le point d'arrêt §7 (« aucune `probabiliteCandidate` ne fait tomber la densité
dans 24 ± 1 ») a donc été atteint et remonté. **Arbitrage d'Ethan, 02/09 :**
« ignore le 24 bases par un carré de 12 × 12, c'était une mesure mais sur un jeu
périmé […] tu conserves la règle du 3 × 3 et tu augmentes la densité au maximum,
je retire le maximum un peu moins pour que ce soit pas un cadre parfaitement
rectangulaire comme une sylviculture. »

⚠ **ET LE « UN PEU MOINS » SE MESURE, IL NE SE DEVINE PAS.** 0,35 rend 97 % du
plafond, et c'est la dernière valeur avant que la courbe ne s'aplatisse. Au-delà
on ne gagne plus de densité — 0,45 rend 0,4 base de plus, 1,00 n'en rend
aucune — **on ne fait que resserrer le semis** :

| p | blocs 3 × 3 entièrement vides | bases collées au minimum permis (voisin à 2) |
| --- | --- | --- |
| 0,14 | 37,9 % | 78,3 % |
| **0,35** | **22,1 %** | **89,9 %** |
| 0,50 | 20,5 % | 91,4 % |
| 1,00 | 21,2 % | 90,7 % |

C'est exactement la « sylviculture » refusée : au-delà de 0,35, chaque bloc de
neuf cases porte presque toujours une base, et les trous qui font une carte
disparaissent sans qu'on gagne une seule base.

### M2 — le durcissement du début de partie

⚠⚠ **AU DÉPART EXACT, LE COMPTE EST ZÉRO AVANT COMME APRÈS, ET C'EST STRUCTUREL.**
La garde vaut 15, le rayon d'attaque 10 : rien n'est jamais à portée tant que la
base n'a pas bougé, **dans les deux métriques**. Ce n'est pas un effet du lot,
c'est une propriété que RAID-B avait déjà relevée (`basesAttaquantes(creerEtat(7))`
rend une liste vide). Mesurer « au départ » ne mesure donc rien.

La mesure utile est prise depuis une base **déplacée**, sur 150 graines :

| Position | Cibles à portée, avant | après | Bases niveau ≥ 10, avant | après |
| --- | --- | --- | --- | --- |
| au départ | 0,00 | 0,00 | 0,00 | 0,00 |
| 40 rangées plus haut | 36,97 | **34,50** | 14,33 | **12,29** |
| 95 rangées plus haut | 36,01 | **34,29** | 36,01 | **34,29** |

⚠⚠ **LE DÉBUT DE PARTIE NE DURCIT PAS DEUX FOIS — IL S'ADOUCIT LÉGÈREMENT.** Le
§4.2 du brief l'annonçait « deux fois plus dur », et son §5.5 prévoyait « 1,44
fois plus de cibles ». Les deux reposaient sur un peuplement **×2** qui s'est
avéré impossible. Avec le ×1,33 réellement atteignable, la perte de portée
(316/440 = 0,718) l'emporte de peu : **−6,7 % de cibles**, **−14 % de bases de
niveau ≥ 10**. Le produit prédit 0,718 × 1,33 = 0,955, la mesure donne 0,933 —
cohérent.

**C'est une MESURE, pas un réglage.** Aucun nombre d'équilibrage n'a été touché
au-delà des deux du §2.

### M3 — le placement des POI, revalidé sur 300 graines

| Grandeur | Avant | Après |
| --- | --- | --- |
| Graines | 300 | **300** |
| Échecs (`ESSAIS_MAX` atteint) | 0 | **0** |
| POI par carte | 70 | **70** |
| Coût par carte | 0,0585 ms | **0,0665 ms** |

Le placement **converge sur les 300 graines**, sans un seul rejet fatal. Le coût
monte de 14 %, ce qui est attendu : la garde libère 144 cases mais le peuplement
en occupe davantage, donc les POI se heurtent un peu plus souvent à une base.
0,067 ms par carte reste trois ordres de grandeur sous ce qui se verrait.

---

## 6. Le classement des tests remesurés — comportement ou baseline

**Aucun test de COMPORTEMENT n'a cassé.** Les seize tests qui sont tombés sont
tous des baselines, et chacun porte sa raison écrite sur place.

### Baselines : un nombre mesuré sur l'ancienne carte

| Test | Fichier | Ce qui a bougé |
| --- | --- | --- |
| `distance — Tchebychev…` | `monde.test.js` | Trois distances figées. Le titre et les valeurs passent à Euclide ; deux `notEqual` gardent les valeurs de Tchebychev et de Manhattan pour que la falsification se voie. |
| `panneau — il dit ce qu'on sait…` | `monde.test.js` | « 5 cases » → « 6 cases » : 5 rangées et 3 colonnes font 5,83, arrondi au supérieur. |
| `peuplement — la garde est vide…` | `peuplement.test.js` | Mesurait en Tchebychev ; mesure au carré. L'égalité stricte « la base la plus proche est à 15 » devient un encadrement `[15, 16[` — la borne n'est plus atteignable exactement en Euclide, et le dire vaut mieux que l'assouplir en silence. |
| `POI T5 — non-régression du peuplement` | `poi.test.js` | Les six comptes de référence. **Déclaré dans le test : ils sont devenus circulaires** — ils venaient d'un `peuplement.js` d'avant le lot POI. Ce qui tient la propriété est la seconde moitié du test, le balayage de source, qui est indépendante de toute métrique. |
| `POI T6 — la forme de la garde` | `poi.test.js` | Figeait la forme **carrée** (« seules les colonnes 1 et 31 sont hors garde »). Réécrit sur la propriété qui compte : aucun POI sous la garde, et la garde est CELLE du peuplement. |
| `POI T20 — une sauvegarde v15…` | `poi.test.js` | Une assertion **retirée et déclarée** — voir §10. |
| `satellites — l'anneau…` (×2) | `satellites.test.js` | 24 cases → 12. Le second compte est désormais **déduit** de la règle au lieu d'être écrit, et une assertion neuve exige que le coin du carré ait bien quitté l'anneau. |
| `refus — les quatre raisons…` | `raid.test.js` | Le « manque 9 » est **déduit du coût** au lieu d'être figé — le camp que le montage trouve a changé de case avec les anneaux, et le refiger le referait bouger au prochain lot. Le filtre de portée du montage passe à `estAPorteeDAttaque`. |
| `RAID-A T10 — onze raids…` | `raid.test.js` | La cible était prise **une fois** avant la boucle, ce qui supposait qu'un camp survive à onze raids. Elle se relit à chaque tour ; `premierCamp` rend `null` au lieu de lever. |
| `RAID-B T1 — les deux chemins` | `raid-ouvrage.test.js` | La **précondition** du montage, pas l'équivalence : six heures ne portaient plus trois raids sur la graine 7. Fenêtre portée à neuf heures. **L'équivalence elle-même a été revérifiée à part sur 12 h et cinq graines, rasages compris : sérialisations identiques au caractère.** |
| `cibles — le rayon…` | `site-de-la-case.test.js` | **Resserré, pas adapté** : il bornait en Tchebychev, une borne désormais plus LARGE que la règle, donc il laissait passer ce que le lot interdit. |
| Cinq littéraux `SAVE_VERSION` | `state`, `raid`, `recherche`, `raid-ouvrage` | 20 → 21. |

### Ce qui n'a PAS bougé, et pourquoi

- `territoire.test.js:53` mesure en Tchebychev — **c'est correct** : les zones
  d'influence restent en Tchebychev (§9).
- `poi.test.js:259` cherche un POI isolé dans un rayon de Tchebychev. C'est une
  **commodité de montage**, pas une règle : Tchebychev ≥ Euclide, donc « isolé
  dans le carré » implique « isolé dans le disque ». Conservatrice, donc juste.

---

## 7. Les trois commentaires réécrits — cités tels qu'écrits

### `src/sim/points-attaque.js` — la distance du raid

> ⚠⚠ EUCLIDE, PAS TCHEBYCHEV — ARBITRÉ PAR ETHAN LE 02/09/2026, et l'ancien
> commentaire de ce bloc disait exactement l'inverse. Il argumentait :
> « TCHEBYCHEV, PAS EUCLIDE, et c'est la cohérence avec le reste de la carte […] »
>
> ⚠ CET ARGUMENT ÉTAIT JUSTE, ET IL EST TOMBÉ POUR UNE RAISON PRÉCISE : les
> TROIS règles ont changé ENSEMBLE au lot EUCLIDE — la portée du raid, la garde
> du peuplement et les anneaux des satellites. La cohérence qu'il défendait n'est
> donc pas perdue : elle a changé de métrique.

### `src/sim/peuplement.js` — la garde

> ⚠⚠ EUCLIDE DEPUIS LE LOT EUCLIDE (02/09/2026), ARBITRÉ PAR ETHAN. Ce
> commentaire disait : « distance de Tchebychev […] parce que la carte est une
> grille et qu'une base en diagonale n'est pas plus loin qu'une base droit
> devant ». La règle a changé EN MÊME TEMPS que la portée du raid et que les
> anneaux des satellites […]
>
> ⚠ ET CE N'EST PAS NEUTRE : LA ZONE INTERDITE RÉTRÉCIT. […] **841 cases
> interdites deviennent 697**, donc **144 cases libérées**, toutes dans les
> diagonales.

### `src/data/sites.js` — la garde, côté données

> ⚠⚠ ET LA GARDE EST EUCLIDIENNE DEPUIS LE LOT EUCLIDE (02/09/2026). Cette phrase
> disait « la garde est une distance de Tchebychev, pas un nombre de rangées » ;
> la seconde moitié reste vraie, la première a changé […] Le carré de 31 × 31 est
> devenu un DISQUE.

**Deux commentaires de plus ont été réécrits, que le brief ne nommait pas :**
celui de `casesDeLAnneau` dans `src/sim/satellites.js` (« TCHEBYCHEV ET NON
EUCLIDIEN, comme la garde du peuplement ») et celui de `distanceEnCases` dans
`src/ui/monde.js` (« TCHEBYCHEV […] comme la garde du peuplement et les anneaux
des satellites »). Les deux citaient nommément des règles qui ont basculé : les
laisser aurait envoyé le lecteur suivant vérifier une cohérence inversée.

---

## 8. Le grep `Math.max(Math.abs` — ce qu'il a rendu

Dans `src/` et `tools/`, **deux occurrences seulement**, et les deux sont
légitimes :

| Lieu | Verdict |
| --- | --- |
| `src/sim/points-attaque.js:284` | `distanceTchebychev` elle-même, qui **survit** pour les zones d'influence (§9). |
| `tools/conditionneur.html:508` | Un outil hors ligne de conditionnement d'image, sans rapport avec la carte : il mesure un écart au centre d'une planche de sprite. |

**Aucune occurrence orpheline dans `src/`** — c'est-à-dire aucun Tchebychev
écrit à la main qui aurait échappé au lot. Le grep a en revanche servi à trouver
`src/ui/monde.js:135` et `src/sim/site-de-la-case.js:319`, deux distances
réécrites à la main que le §3 du brief ne listait pas et qui ont dû basculer :
sans elles, l'écran Monde aurait proposé des cibles que `problemesDuRaid` refuse.

Dans `test/`, cinq occurrences, toutes traitées ou justifiées au §6.

---

## 9. La lecture prise du §2.6 — l'exclusion 3 × 3 inchangée

L'exclusion des huit voisines de `estBaseOuvrage` **n'a pas bougé**. Ce n'est
pas un rayon : c'est l'**adjacence**, les huit cases qui touchent, et l'adjacence
n'a pas de version euclidienne. C'est aussi l'arbitrage d'Ethan du 29/08 :
« aucune base ouvrage et joueur ne peuvent être côte à côte avec une autre base
ouvrage joueur, 8 cases autour ».

**Ce qu'il faudrait changer si Ethan décide autrement.** La seule façon d'aller
au-delà de 16 bases par 12 × 12 est de réduire ce voisinage. Mesuré sur 120
graines, avec l'exclusion réduite aux **quatre orthogonales** — deux bases
pourraient alors se toucher en diagonale :

| p | 0,28 | 0,32 | 0,36 | 0,40 |
| --- | --- | --- | --- | --- |
| bases / 12×12 | 23,33 | **24,72** | 25,84 | 26,72 |

Le plafond passe à 144/5 = 28,8, et 24 ± 1 devient atteignable autour de
p = 0,30. **Une ligne de `estBaseOuvrage`** — la liste des décalages —, plus la
valeur de `probabiliteCandidate`. Ce serait un arbitrage, pas une lecture : la
règle des « 8 cases autour » est d'Ethan.

---

## 10. Écarts par rapport au brief, et points en suspens

### Écarts

1. **Le §2.4 était impossible**, et le §7 a été suivi : arrêt, mesure, remontée à
   Ethan, qui a tranché. `basesParDouzeCarre` vaut **16**, pas 24.
2. **Cinq sites ont basculé, pas trois.** Le §3 en listait trois ; le grep du
   §5.3 en a trouvé deux de plus, tous deux nécessaires :
   `src/sim/site-de-la-case.js` (`ciblesAPortee`, qui ne filtrait PAS la portée —
   le carré du balayage faisait office de rayon) et `src/ui/monde.js`
   (`distanceEnCases`, le panneau). Sans eux, l'écran Monde aurait proposé des
   cibles que `problemesDuRaid` refuse au toucher.
3. **Une fonction de plus que le §4.1 n'en demandait** :
   `estAPorteeDAttaque(depuis, vers)`. Le brief demandait une primitive de
   distance ; trois lecteurs posaient la question de la portée chacun à sa façon,
   et trois écritures d'une même règle divergent sur un cas limite. Un test
   balaie les deux modules pour qu'aucun ne compare une distance au rayon à la
   main.
4. **`casesArrondiesAuSuperieur` n'était pas au brief.** Le refus de portée
   affichait « cette cible est à N cases » avec N en Tchebychev : sous une portée
   euclidienne, cela produit « cette cible est à 8 cases, le rayon d'attaque est
   de 10 », un message qui donne tort au jeu. La fonction calcule la racine
   **en entiers**, sans `Math.sqrt`, et **ne décide de rien**.
5. **`distanceTchebychev` n'a pas été supprimée**, contrairement au « Remplacée »
   du §3. Elle survit pour les zones d'influence (§9 ci-dessous) et pour une
   égalité à zéro dans `siteDeLaCase`, qui ne choisit aucune métrique.
6. **Une assertion a été retirée et déclarée**, celle de `POI T20` qui vérifiait
   que la chaîne de migrations tolère un `poisAcquis` déjà présent. Le maillon
   v20 → v21 la contredit en bout de chaîne, délibérément. Un premier jet l'a
   remplacée par une version « isolée » du maillon qui **ne rejouait rien et
   passait sur n'importe quel code** ; elle a été supprimée plutôt que livrée.
   Mieux vaut une assertion en moins, déclarée, qu'une assertion qui ne mesure
   rien.

### Deux lectures prises

1. **Les zones d'influence restent en Tchebychev.** Rayon 2 pour le joueur, 3
   pour l'Ouvrage : ce sont des **carrés** que `sim/territoire.js` PEINT case par
   case sur l'écran Monde. Les passer à Euclide dans `estEnTerritoireAllie` sans
   les repeindre là-bas ferait payer le tarif de proximité sur des cases que la
   carte ne montre pas comme siennes. Si Ethan veut le disque, ce sont
   `estEnTerritoireAllie` **et** la boucle de `territoire.js` qui changent,
   ensemble.
2. **Le barème du raid garde la distance de grille.** `coutDuRaid` prend un
   nombre de cases entier ; le passer à `ceil(√d²)` renchérirait toute diagonale
   — un raid à (7, 7) passerait de 31 à 40 points —, c'est-à-dire ferait bouger
   un nombre d'équilibrage que le §2.8 interdisait de toucher. **La portée est
   euclidienne, le prix se compte en cases de grille.** Une ligne à changer si
   Ethan tranche autrement.

### Points en suspens

1. **Le début de partie ne durcit pas** — il s'adoucit de 6,7 %. Le brief
   attendait l'inverse, sur un doublement qui s'est avéré impossible. Si Ethan
   voulait vraiment durcir, les curseurs sont `gardeAutourDuDepart` (15) et
   l'exclusion 3 × 3 (§9), pas la métrique.
2. **La densité est au plafond pratique.** Toute demande future de « plus de
   bases » butera sur le 1/9, et il n'y a qu'une porte : le voisinage
   d'exclusion.
3. **Les sauvegardes existantes perdent leurs dégâts de site et leurs POI
   acquis.** Accepté par Ethan le 02/09, mais le jour où il y aura d'autres
   joueurs, un lot qui déplace la carte devra les prévenir AVANT — c'est déjà ce
   que dit la note de la migration 3 → 4.
4. **`ciblesAPortee` balaie toujours un carré de 441 cases** pour n'en retenir
   que 316. Le balayage pourrait suivre le disque ; ce serait une seconde
   géométrie pour économiser des cases qu'on jette de toute façon, et le coût
   n'est pas apparu dans M1.

---

## 11. Ce qui a été lancé, et ce qui ne l'a pas été

- `npm run check` : **855 pass / 0 fail**, `dist/index.html` **1 376 909
  octets**, **0 référence externe**.
- **Boot sans tête** (Chromium préinstallé, `playwright-core` hors du dépôt,
  412 × 915) : démarrage **sans une seule erreur** ; une sauvegarde **v20
  authentique** portant un site entamé et un POI acquis se charge, se migre et se
  ressauvegarde en **v21 avec les deux champs vidés** — vérifié dans le
  navigateur, pas seulement en simulation.
- **Équivalence des deux chemins revérifiée** hors suite, sur 12 h et cinq
  graines, rasages compris : sérialisations **identiques au caractère**.
- `python3 tools/verifier.py` : **NON LANCÉ, et c'était conforme** — le lot ne
  touche ni `art/`, ni `tools/`.
- `node tools/audit-maquette.mjs` : **non lancé** — le lot ne touche pas
  `foyer-zero-ui.html`.
