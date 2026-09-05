# RAPPORT — lot BARÈME

Une entité a **deux nombres**, et le dépôt n'en portait qu'un : son prix
d'**accueil** au niveau 2, dicté, et son **coefficient de régime**, qui commande
sa courbe au-delà du niveau 12. Ils ne coïncident que pour le Chantier de
construction — et c'est exactement sur lui que `ECONOMIE_NIVEAU.ratios` avait été
calée.

---

## 1. Version, et la base de départ

| | |
|---|---|
| `version` · `config.build` | **0.97.0 · 99** (0.96.0 · 98 avant) |
| `SAVE_VERSION` | **24, inchangée** |

⚠⚠ **LA BASE DE RÉFÉRENCE DU BRIEF N'A PAS ÉTÉ RETROUVÉE, ET C'ÉTAIT BÉNIN.**

| | brief | mesuré au départ |
|---|---:|---:|
| `npm test` | 1 093 pass | **1 096 pass / 0 fail** |
| `dist/index.html` | 7 060 617 o | **8 995 675 o** |
| borne T10 | 7 300 000 | **9 300 000** |
| version | dérive `CLAUDE.md` 0.93.0 · 95 / `package.json` 0.94.0 · 96 | **aucune dérive, 0.96.0 · 98 des deux côtés** |

Trois lots ont été mergés entre l'écriture du brief et son exécution
(SON-CATALOGUE, SOL-SATELLITE, LIMITES-VIVES), et la dérive de version qu'il
demandait de ne pas corriger était déjà résolue. Le §0 du brief dit « s'arrêter
et le dire » ; ce qui a été fait à la place, c'est **vérifier que les sept faits
dont ce lot dépend étaient intacts** — ils l'étaient tous :

- la signature `montantDuPalier(ancre, niveau)` et son arrondi par palier ;
- les dix `ratios` et `penteStable: 1.32` ;
- les quatorze ancres d'offense, entières, `meute: 2` compris ;
- les quatre classes `COUT_NIVEAU_DEUX` — 8 · 5 · 3 · 2 ;
- `COUT_ELECTRICITE.fraction` = `{ centrale: 0.1, collecteur: 0.5, autres: 0.25 }` ;
- `REPARATION_BASE_JOUEUR.courbe: null` ;
- `REPARATION.partDuCoutDeMontee: 1`.

C'est le précédent du lot TRANSFERT, appliqué : signalé plutôt que traité comme
un point d'arrêt.

### Après

| | avant | après |
|---|---:|---:|
| `npm test` | 1 096 pass / 0 fail | **1 105 pass / 0 fail** |
| `dist/index.html` | 8 995 675 o | **8 996 025 o** (+350) |
| références externes | 0 | **0** |
| images inlinées | 296 `data:` | **296** |

**Marge T10 : 303 975 octets, 3,27 %**, borne **inchangée** à 9 300 000. Le lot
ne fait entrer aucune ressource — 350 octets de données et de commentaires.

---

## 2. La formule

```
facteur    = coefficient / ancre
montant(n) = round( ancre × PROFIL(n) × facteur ^ ( min(n − 2, 10) / 10 ) )
```

⚠ **NI LE 2 NI LE 10 NE SONT ÉCRITS EN DUR** : `premierNiveauPayant` et
`ratios.length`. Les recopier ferait deux vérités sur la longueur de la zone
d'accueil.

⚠ **`PROFIL` EST EXPORTÉ** — le produit non arrondi des ratios — pour que les
tests et le générateur de témoins ne le recopient pas.

⚠ **UN SEUL `Math.round`, EN SORTIE.** Mesuré sur les 42 entités et les 49
paliers : l'écart au produit exact ne dépasse jamais **0,5**, atteint par
`defense/merlon` au niveau 3.

### Le commentaire qui était faux

`economie.js` affirmait qu'un arrondi unique « ferait diverger la chaîne dès le
sixième palier ». **Mesuré : faux.** L'erreur flottante de `440 × 36/11` vaut
1e-10, `Math.round` l'absorbe, et la rampe de référence est restituée à
l'identique — 8 · 10 · 20 · 80 · 440 · 1 440 · 4 400 · 12 800 · 35 200 · 89 600 ·
192 000.

**Ce qui rend l'arrondi unique nécessaire est l'inverse de ce qu'il disait :**
l'arrondi *par palier* se compose et détruit les proportions des petites ancres —
l'ancre 1 rendait au niveau 10 le **tiers** de l'ancre 2, là où le relevé dit la
**moitié**.

---

## 3. Ce qui bouge, chiffré

**1 901 paliers sur 2 058**, mesurés en rejouant le code d'avant et le code
d'après côte à côte :

| famille | paliers qui bougent | au plus | au moins |
|---|---:|---|---|
| bâtiments | **471 / 539** | ×1,625 (Centrale n14) | ×0,625 (Collecteur n15) |
| offense | **664 / 686** | ×2,200 (Orca n18) | ×0,333 (Fusilier n3) |
| défense | **766 / 833** | ×1,500 (Fusilier n4) | ×0,833 (Mur n15) |
| électricité des bâtiments | **458 / 539** | | |

⚠ **LE BRIEF ANNONÇAIT 474 PALIERS DE BÂTIMENT ; MESURÉ, 471.** Écart déclaré.

⚠ **LA DÉFENSE NE CHANGE PAS D'ANCRE ET SES PRIX BOUGENT QUAND MÊME** — 766
paliers sur 833. C'est l'arrondi unique, pas un redressement : son coefficient
vaut son ancre, donc son facteur vaut 1.

### Les deux points absolus du relevé, désormais rendus

| | avant | après | relevé |
|---|---:|---:|---:|
| Caserne, palier 11 | 115 200 | **144 000** | 144 000 |
| Exosoldat, palier 11 | 57 600 | **96 000** | 96 000 |

Ce sont les **deux seules** mesures de coût en valeur absolue que le dépôt
possède.

---

## 4. Le test 7 — la chaîne entière contre une observation extérieure

`réparation(id) = round( coutDeMonteeOffense(id, 10).scorie × partDuCoutDeMontee )`

| unité | rendu | relevé | | unité | rendu | relevé |
|---|---:|---:|---|---|---:|---:|
| `meute` | **398** | 398 | | `busard` | **1 908** | 1 908 |
| `perceurs` | **636** | 636 | | `guetteur` | **1 987** | 1 988 |
| `carapace` | **795** | 795 | | `frappeur` | **2 226** | 2 226 |
| `ratisseur` | **1 272** | 1 272 | | `fouisseurs` | **3 180** | 3 180 |
| `belier` | **1 431** | 1 431 | | `pilon` | **3 578** | 3 578 |
| `fendeur` | **1 590** | 1 590 | | `broyeur` | **4 770** | 4 770 |
| `crecelle` | **1 749** | 1 749 | | `enclume` | **4 770** | 4 770 |

**Treize sur quatorze tombent exactement.** `guetteur` rend 1 987 pour 1 988 :
le produit exact vaut 1 987,5 et l'affichage du jeu de référence arrondit
au-dessus. Tolérance **±1, et seulement ±1** — et le COMPTE d'exactes est
asserté à 13, pour que la tolérance ne puisse pas couvrir une dérive générale.

⚠⚠ Ancre d'accueil, coefficient, redressement, arrondi unique et
`partDuCoutDeMontee` doivent **tous** être justes pour qu'il passe.

---

## 5. Les onze tests

| # | où | verdict | montage effectif |
|---|---|---|---|
| T1 | `couts-militaires.test.js` | **PASS** | `montantDuPalier(8, 8, n)` sur n = 2…12 contre la table relevée. **Non-régression, étiquetée comme telle** : le Chantier a un facteur de 1, sa rampe doit être restituée à l'identique. Deux assertions ajoutées : l'ancre est le premier palier quel que soit le coefficient. |
| T2 | `donnees.test.js` | **PASS** | rapport `meute` / `carapace` au niveau 10 : 7 661 / 15 322 = **0,5 exactement**. |
| T3 | `donnees.test.js` | **PASS** | (a) sur les 42 entités × 49 paliers, `montantDuPalier` est à ≤ 0,5 du produit exact ; (b) les proportions du relevé sont tenues à 0,05 % **du niveau 9 au 50**. |
| T4 | `donnees.test.js` | **PASS** | `coutDeMontee('caserne', 12).quartz === 144000`, et `COEFFICIENT_DE_REGIME.caserne === 6`. |
| T5 | `donnees.test.js` | **PASS** | `coutDeMonteeOffense('carapace', 12).scorie === 96000`, et `RAPPORT_COEFFICIENT_OFFENSE === 2`. |
| T6 | `donnees.test.js` | **PASS** | raccord au niveau 12 sur les 42, **plus** la zone de régime : pour n de 12 à 50, `montantDuPalier === round(coefficient × PROFIL(n))`. `PROFIL(12) === 24000` est asserté une fois, contre le relevé. |
| T7 | `donnees.test.js` | **PASS** | les quatorze réparations ci-dessus, ±1, avec le compte d'exactes figé à 13. |
| T8 | `donnees.test.js` | **PASS** | rapports électricité/quartz au niveau 40 : Collecteur **0,75**, Centrale **0,0962**, autres **0,25**. Plus un balayage de la source : `0.5 / 5.2` doit rester écrit en quotient. |
| T9 | `donnees.test.js` | **PASS** | `COEFFICIENT_DE_REGIME` ≡ les onze clés de `BASE_BATIMENTS` ; et Centrale / Collecteur, tous deux `modeste`, diffèrent d'un facteur **2,6**. |
| T10 | `donnees.test.js` | **PASS** | 42 × 49 paliers de `test/temoins-couts.js` contre la formule, **plus** quatre niveaux passés par `coutDeMontee`, `coutDeMonteeOffense` et `coutDeMonteeDefense`. |
| T11 | `base.test.js` | **PASS** | la garde qui exigeait `courbe === null` est **retournée** : elle exige maintenant les trois champs, et que les trois grandeurs montent. |

---

## 6. Les falsifications — onze, sur copie fraîche, les onze mordent

| # | défaut injecté | ce qui tombe |
|---|---|---|
| F2a | l'ancre du Fusilier revient à 2 | T2, T3, T7 |
| F2b | l'arrondi redevient **par palier** | T3, T4, T6, T7, T10 |
| F4 | le coefficient de la Caserne retombe sur son ancre | T4, T10 |
| F5 | `RAPPORT_COEFFICIENT_OFFENSE` retombe à 1 | T5, T7, T10 |
| F6 | le plafond `min(…, 10)` est retiré | T3, **T6**, T10 |
| F7 | `partDuCoutDeMontee` revient à 1 | T7 |
| F8 | les deux fractions d'électricité reviennent | T8 |
| F9 | une clé quitte `COEFFICIENT_DE_REGIME` | T9 |
| F10 | un ratio bouge de 2,75 à 2,7501 | T3, T4, T5, T6, T7 |
| F11 | la courbe de réparation redevient `null` | T11 |

### Ce que la falsification a trouvé, et que la relecture n'aurait pas vu

⚠⚠ **T3 ET T6 NE GARDAIENT QUE LE TÉMOIN.** Le premier jet comparait
`paliers[i]`, lu dans `test/temoins-couts.js`, au produit exact. Or ce fichier
est **produit par la formule** : retirer le plafond du code laissait les deux
tests **verts**. Ils appellent maintenant `montantDuPalier`, et le témoin ne
fournit plus que le couple (ancre, coefficient). *Un test qui interroge le témoin
ne garde que le témoin.*

⚠⚠ **ET LE T6 DU BRIEF NE POUVAIT PAS GARDER LE PLAFOND.** Le brief annonçait
qu'en le retirant « le test tombe sur les dix-neuf entités dont le facteur diffère
de 1 ». **Mesuré : il ne tombe pas du tout.** Au niveau 12, l'exposant vaut
`(12 − 2)/10 = 1` avec ou sans plafond — le raccord est exactement l'endroit où
le plafond est un non-événement. La vraie garde est **au-dessus** : à partir du
niveau 12, tout le monde monte de `penteStable` et de rien d'autre. C'est cette
seconde moitié qui fait tomber F6.

---

## 7. Les valeurs prises sur la parole, et non sur une mesure

⚠ **DEUX COEFFICIENTS DE RÉGIME SUR ONZE** — `qgDeDefense: 8` et
`complexeDeDefense: 5`, dictés par Ethan le 05/09. Aucune capture ne les montre,
et le commentaire de la table le dit ligne par ligne.

⚠ **LES DIX-SEPT ANCRES DE DÉFENSE ET LEUR COEFFICIENT.** Le coefficient vaut
l'ancre — facteur 1, aucun redressement. **Ce n'est pas une mesure, c'est un
choix conservateur** : aucune capture n'a jamais confronté ces ancres à quoi que
ce soit, le coefficient de l'offense ne se transporte pas (le premier piège du
fichier reste vrai), et la réparation de la garnison est gratuite, donc aucun
barème ne traverse la frontière.

⚠ **`REPARATION_BASE_JOUEUR.courbe`, TROIS NOMBRES DE SOLIDITÉ INÉGALE :**

- **1,1767 est une cinquième pente** — ni 1,10, ni 1,15, ni 1,32 — et **elle ne
  repose que sur un couple**, Collecteur 55 → 56 ;
- **le diviseur du Chantier est repris de l'armée par analogie, sans preuve** :
  aucune des trente captures ne montre l'effet du Chantier sur le temps de
  réparation d'un bâtiment ;
- **230 est un arrondi** de 230,3 et 230,4. Le Collecteur rend 1/153,6 —
  l'anomalie de 1,4993, abandonnée sur arbitrage ; si elle s'expliquait par une
  avarie partielle, 230 ne serait qu'une borne basse.

---

## 8. Écarts par rapport au brief

1. ⚠⚠ **T3 : « exactes à 0,05 % DU NIVEAU 5 au niveau 50 » est faux.** Le seuil
   ne tient qu'**à partir du niveau 9**. Mesuré : **4,00 %** au niveau 5
   (Fusilier 12 contre Exosoldat 25), 0,69 % au 6, 0,20 % au 7, 0,060 % au 8,
   0,014 % au 9. Aucune formule ne fait mieux — un prix est un entier, et 12
   n'est pas la moitié de 25. Le test asserte donc **deux** choses : le seul
   arrondi à tous les paliers, et la proportion à partir du 9.
2. ⚠⚠ **T6 : le montage falsifiable annoncé ne mord pas** — voir §6.
3. ⚠ **474 paliers de bâtiment annoncés ; 471 mesurés.**
4. ⚠ **`PROFIL` est exporté comme une FONCTION, avec une majuscule.** Le dépôt
   réserve la majuscule aux tables ; ici elle suit le nom que le relevé et ce
   rapport donnent à la grandeur, et le commentaire de la fonction le déclare.
5. ⚠ **T1 n'a pas été dupliqué dans `donnees.test.js`.** Il existait déjà dans
   `couts-militaires.test.js` ; l'y recopier aurait fait deux gardes de la même
   rampe. Il est étiqueté « BARÈME T1, non-régression » sur place.
6. ⚠ **Trois relevés par exécution ont été remesurés**, et chacun dit quelle
   constante l'a déplacé : `coutCumule('collecteur', 5)` 47/22 → **41/28** (le
   coefficient tombe de 3 à 2, la fraction d'électricité monte de 0,5 à 0,75),
   son remboursement 42/19 → **36/25**, et la chaîne du Fusilier
   `[2, 3, 6, 24, 132, 432]` → **`[1, 1, 3, 12, 73, 255]`**.
7. ⚠ **Un test a changé de cible sans s'assouplir** :
   « la même unité ne coûte pas le même prix des deux côtés » comparait les
   ancres brutes, qui ne sont plus commensurables (fraction contre entier). Il
   compare désormais le **prix payé**. Remesuré : **quatre** unités diffèrent au
   lieu de cinq — `meute` sort (sa correction à 1 la fait tomber sur le prix de
   garnison) et `perceurs` sort (1,6 s'arrondit sur le 2 de la défense).

---

## 9. `SAVE_VERSION` — vérifié, pas supposé

Elle **reste à 24**. Un état sérialisé porte **61 clés** ; aucune ne correspond à
`/cout|prix|montant|tarif|bareme/i`. Les sauvegardes persistent des **niveaux**,
et les prix se recalculent — c'est ce qui permet à 1 901 paliers de bouger sans
qu'une seule partie devienne illisible.

---

## 10. Points laissés en suspens

Tout ce que le §10 du brief nomme reste ouvert, et rien n'a été commencé :

- **le cliquet** — `raid-ouvrage.js` pose les bâtiments à 1 PV et rien ne les en
  fait remonter ; `complexeDeDefense` n'apparaît dans aucun module de `src/sim/`.
  Ce lot donne les nombres avec lesquels réparer, il ne répare rien ;
- **la quatrième réserve**, celle des bâtiments, produite par le Chantier :
  plafond et taux non arbitrés ;
- **l'écran de réparation des bâtiments** — aucun n'existe. La courbe est écrite
  et **aucun module de `src/sim/` ne la lit encore** ;
- **la formule de dépassement du Complexe** ;
- **la troisième courbe de coût de `MODELE-ECONOMIQUE.md` §2** ;
- **la marche de ×1,794** de `RELEVE-TA-COURBES-2.md` §5 — le montage retenu rend
  2,06 à 2,30 selon l'entité ;
- **l'anomalie du Collecteur** à 1,4993.

⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni un outil de la chaîne graphique.
`generer-temoins-couts.mjs` n'écrit ni sprite ni son.

**Le merge appartient à Ethan.**
