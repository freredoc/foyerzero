# RAPPORT — lot BASES-1 : fonder, basculer, haloter

02/09/2026. Écrit sur disque, à la racine, comme `CLAUDE.md` §5 l'exige.

---

## 1. Version et build produits

| | |
| --- | --- |
| `package.json` `version` | **0.67.0** (était 0.66.0) |
| `package.json` `config.build` | **"68"** (était "67") — **chaîne**, jamais nombre |

⚠ Les deux sont bumpés ENSEMBLE, et seulement parce que `dist/index.html` change.
⚠ Les deux restent des **chaînes** : `android/app/build.gradle.kts` les lit
`as String`, et un nombre y fait tomber le build Android à la CONFIGURATION.
`donnees.test.js` extrait la liste des champs coulés `as String` du Gradle et
l'exige — la garde n'est pas une recopie.

---

## 2. Base de référence retrouvée

Le §1 du brief annonçait, après BASES-0 : **885 pass / 0 fail**,
`dist/index.html` **1 385 930 octets**, 0 référence externe, 16 `data:`.

Mesuré sur un arbre propre à `9d7d711` avant de toucher quoi que ce soit :
**885 pass / 0 fail**, **1 385 930 octets**, **16 `data:`**. ✅ **Retrouvée à
l'octet.**

---

## 3. Delta d'octets, tests avant / après

| | avant | après |
| --- | ---: | ---: |
| `npm test` | 885 pass / 0 fail | **902 pass / 0 fail** |
| `dist/index.html` | 1 385 930 o | **1 388 959 o** |
| références externes | 0 | **0** |
| images inlinées (`data:image`) | 16 | **16** |

**Delta : +3 029 octets.** Aucune image n'entre : c'est du code, du balisage et
de la feuille.

⚠⚠ **MARGE T10 : 11 041 OCTETS, SOIT 0,79 %.** C'est la première fois qu'elle
passe sous le pour-cent. **La borne de 1 400 000 N'A PAS ÉTÉ RELEVÉE**, et c'est
la règle §5 prise à l'endroit : elle monte quand une RESSOURCE entre légitimement,
jamais pour faire passer du code. Le prochain lot qui fait entrer une image devra
la relever EN ÉCRIVANT POURQUOI ; celui qui n'en fait pas entrer devra tenir dans
onze kilo-octets.

Historique de la marge : 4,7 % · 4,30 % · 4,28 % · 2,07 % · 1,69 % · 1,65 % ·
1,16 % · 1,00 % · **0,79 %**.

---

## 4. Chaque test du §6 : PASS/KO, avec son montage de falsification

Les douze falsifications tournent **sur une COPIE FRAÎCHE du dépôt**, jamais sur
l'arbre de travail, et le harnais **refuse de continuer si le motif n'est pas
trouvé** — une falsification qui ne s'applique pas laisse la suite verte sans
qu'aucun défaut ait été injecté, ce que le lot RÉSERVE a payé une fois.

⚠ Le bac à sable **construit `dist/`**. Sans lui, `chantier.test.js`,
`monde.test.js` et `deplacement.test.js` tombaient sur les DOUZE falsifications,
y compris celles qu'ils ne peuvent pas voir : du bruit qui aurait fait passer
trois gardes muettes pour des gardes qui mordent. **Trois l'étaient
effectivement** — F5, F9, F12 — et les tests qui les attrapent ont été écrits
APRÈS la mesure.

| # | Test | Verdict | Falsification | Ce qui tombe |
| --- | --- | --- | --- | --- |
| T1 | Le territoire est **rond** | **PASS** | F1 : `if (dr*dr+dc*dc > rayonCarre)` → `if (false)` | `BASES-1 T1`, + 2 de `territoire.test.js` |
| T2 | Le prix suit, et **seulement** en conséquence | **PASS** | couverte par F1 | `BASES-1 T2` compare le prix de CHAQUE cible au barème |
| T3 | 2 M · 5 M · 12,5 M, exact au rang 10 | **PASS** | F5 : `×5 ÷2` en BigInt → `Math.round(cout*1000*2,5**k)` | `BASES-1 T3` |
| T4 | 11 cases refusé, 10 accepté | **PASS** | F2 : `distanceCarreeCases` → Tchebychev au carré | `BASES-1 T4` |
| T5 | Refusé chez l'Ouvrage, **accepté chez soi** | **PASS** | F3 : `if (carre === 0)` → `if (carre <= 4)` | `BASES-1 T5` + 13 autres |
| T6 | Refusé sur un POI, accepté sur un camp | **PASS** | — | — |
| T7 | Le camp disparaît, butin **à la base qui fonde** | **PASS** | F4 : on reprend le butin à la base qui fonde | `BASES-1 T7 bis` |
| T8 | La distance depuis **n'importe laquelle** de ses bases | **PASS** | F6 : la boucle ne regarde que `bases[baseCourante]` | `BASES-1 T8` |
| T9 | La bascule change l'indice, **tous** les écrans suivent | **PASS** | F10 : `basculerVersLaBase` n'écrit plus | `BASES-1 T7`, `T9`, `T15`, 2 de `missions`, 1 de `chantier` |
| T10 | Réserve et satellites **propres à chaque base** | **PASS** | F7 : `reserveReparation` devient un objet partagé | **200 tests** |
| T11 | Les quatre missions ont un moteur, dénominateur **mesuré** | **PASS** | F11 : les objectifs relisent la base courante | 2 de `missions.test.js` |
| T12 | `structuredClone` ≡ `serialiser`, à plusieurs bases | **PASS** | F8 : `baseCourante` mémorise l'objet base | 8 tests, dont `T10`, `T9`, la sérialisation |
| T13 | **Les 885 tests passent** | **PASS** | — | 902 pass / 0 fail |

**Trois falsifications de plus, hors brief, pour les trois boucles du §5.2 :**

| # | Falsification | Ce qui tombe |
| --- | --- | --- |
| F9 | `basesAttaquantes` ne boucle que sur la base courante | `BASES-1 T15` |
| F12 | `satellitesPresents` ne rend que ceux de la courante | `BASES-1 T15 bis` |
| — | (F7 couvre déjà `crediterLesReserves`) | 200 tests |

⚠⚠ **F5, F9 ET F12 NE MORDAIENT PAS AU PREMIER RELEVÉ.** Trois gardes muettes
sur douze, trouvées par la mesure et non par la relecture :

- **F5** — `BASES-1 T3` s'arrêtait au rang 10, où le calcul flottant et le calcul
  entier **coïncident encore** (3 051 757 812 500 des deux côtés). Le test va
  maintenant jusqu'au **rang 25**, où `Math.round(2 × 10⁹ × 2,5²³)` rend
  **2 842 170 943 040 400 384** contre **2 842 170 943 040 400 744** — 360
  milli-points perdus, parce que le produit a dépassé l'entier sûr. Une
  assertion `notEqual` entre les deux calculs prouve que le montage les
  distingue.
- **F9** — aucun test n'enchaînait deux bases et un raid de l'Ouvrage. `T15`
  existe pour ça, et son montage a demandé du soin : **on ne peut PAS fonder
  là-haut** (territoire ennemi) ni **être attaqué en bas**
  (`RAID_OUVRAGE.niveauMinimal` vaut 10), donc il faut fonder en bas puis MONTER
  la seconde base par `poserLaBaseSur`.
- **F12** — `T15 bis` mesure que le camp d'une autre base est **trouvé par
  `siteDeLaCase`**, pas seulement dessiné : la faute rendait la case
  **inattaquable** en même temps qu'invisible.

---

## 5. M1 et M2, chiffrées

### M1 — l'écart de prix d'un raid, carré contre disque

Les deux prédicats sont écrits **côte à côte dans le même programme** : on ne
mesure pas « avant » puis « après » sur deux arbres.

| | |
| --- | --- |
| graines | **150** |
| cibles à portée | **5 161** |
| prix moyen, territoire **carré** | **27,945** points |
| prix moyen, territoire **disque** | **28,078** points |
| **écart moyen** | **+0,133 point par raid** |
| cibles qui renchérissent | **172, soit 3,33 %** |

Et la géométrie pure : le disque du joueur (rayon 2) fait **13 cases au lieu de
25** ; celui de l'Ouvrage (rayon 3) **29 au lieu de 49**.

**Rien n'a été compensé**, comme le brief l'exigeait.

### M2 — le nouveau dénominateur du tutoriel

**13 / 17 → 17 / 17.** Le nombre n'est écrit nulle part : `avancement` COMPTE les
missions vérifiables, et il a suivi tout seul quand les quatre `sans-moteur` ont
reçu le leur — exactement ce que la ligne d'origine annonçait.

### Mesure supplémentaire — où l'on peut fonder

Non demandée, et elle change la lecture du lot. Cases fondables dans le disque de
rayon 10, moyenne sur **40 graines** :

| rangée de la base | cases fondables sur 317 |
| ---: | ---: |
| 295 (départ) | **261,0** |
| 290 | 285,4 |
| 285 | 190,0 |
| 280 | 98,8 |
| 275 | 24,1 |
| 270 | **0,7** |
| 200 | 0,6 |

⚠⚠ **AU-DELÀ DE LA RANGÉE 270, FONDER EST PRATIQUEMENT IMPOSSIBLE** : l'Ouvrage
tient 100 % des rangées hautes, et son territoire est interdit. **Le chemin passe
donc par le rasage** — une base rasée cesse de projeter son influence, ce que
`dansUnTerritoireEnnemi` lit par `siteDeLaCase`. Ce n'est pas un défaut à
corriger : c'est ce que l'arbitrage produit. **À relire si Ethan veut qu'on
puisse fonder plus haut sans raser d'abord.**

---

## 6. Les trois lectures prises

### 6.1 Le butin d'un camp fondé dessus va à la base **qui fonde**

Le brief l'annonçait et le mesure : une base neuve n'a qu'un Chantier de niveau 1,
donc **50 · 50 · 40** de capacité ; y verser le butin d'un camp le ferait déborder
presque entièrement, et `butinPerdu` annoncerait la perte.

**Si Ethan tranche autrement** : c'est l'argument de `verserLeButin` dans
`fonderUneBase` — `quiFonde` devient `etat.bases[indice]` —, une ligne, et rien
d'autre. `verserLeButin` a précisément été sortie d'`executerRaid` pour que le
plafonnement et `butinPerdu` n'existent qu'en un exemplaire.

### 6.2 Le halo suit `baseCourante` : haloter et basculer sont **le même geste**

Un seul état, une seule vérité. Deux notions distinctes — « la base affichée » et
« la base qui attaque » — se désynchroniseraient à la première inattention, et le
joueur lancerait un raid depuis une base qu'il ne regarde pas.

**Si Ethan les veut séparées** : c'est le champ `courante` de `sitesDeLaFenetre`
qui gagne une source à lui, et `dessinerHalo` qui la lit — l'appel à
`basculerVersLaBase` dans `ouvrirPanneau` disparaît alors.

### 6.3 Deux bases du joueur peuvent être **adjacentes**

Conséquence directe de « autorisé dans son propre territoire », qu'Ethan a
arbitré explicitement le 02/09 après avoir d'abord appelé cela un exploit. **Seule
la case EXACTE d'une base existante est refusée.**

**Si Ethan revient dessus** : c'est le `if (carre === 0)` de
`problemesDeLaFondation` qui devient un rayon. La falsification F3 montre que la
garde mord dans l'autre sens — interdire son propre territoire fait tomber
quatorze tests.

### 6.4 (une quatrième, née du lot) Une base de l'Ouvrage attaque **toutes** les bases à sa portée, la même minute

`baseAttaqueALaMinute` hache la CASE de l'attaquante et la minute, **jamais la
cible**. C'est ce qui rend les tirages d'une partie à une seule base **identiques
au bit** après ce lot — le témoin de BASES-0 le mesure. Lui faire choisir UNE
cible demanderait une règle qu'Ethan n'a pas donnée (la plus proche ? la plus
faible ?) et **déplacerait tous les tirages existants**.

**Si Ethan n'en veut qu'une** : c'est le `for` imbriqué de `basesAttaquantes`
qui change, et lui seul.

### 6.5 (une cinquième) Une base fondée reçoit **l'amorce**

30 quartz, 30 scorie, 20 électricité. Ce n'est **pas** une lecture neuve : c'est
l'arbitrage du 26/08 appliqué — « toutes les bases que le joueur pose suivront la
même logique ». Une base neuve n'est qu'un Chantier de niveau 1 ; sans stock,
rien n'y est payable, et **le transfert de ressources est le lot suivant**. Sans
l'amorce, une base fondée serait inerte jusqu'à `TRANSFERT`.

---

## 7. Le classeur `fz recherche.xlsx` est **absent du dépôt**

Ethan le cite pour le ×2,5. Il n'y est pas, et `CLAUDE.md` §1 interdit de toute
façon de lire un `.xlsx` pour coder. **Le facteur est donc pris sur sa parole**,
et c'est écrit dans `src/data/recherche.js` à côté de la valeur — pas seulement
ici. C'est exactement la faute que §6 « Sur la méthode » raconte pour
`data/niveaux.js` : une citation qui renvoie à une source qu'on s'interdit de
lire ne vaut pas mieux que pas de citation.

**Aucun autre nombre d'équilibrage n'a bougé.**

---

## 8. Écran par écran, ce qui a été vérifié après bascule

**Boot sans tête, Chromium 1194, viewport 412 × 915, sur `dist/index.html`.**
`playwright-core` est installé **hors du dépôt** — `CLAUDE.md` §3 interdit
d'ajouter une dépendance de test, et cette règle tient.

⚠ La sauvegarde à deux bases est **semée avant le démarrage de la page**
(`addInitScript`). L'écrire après coup ne marche pas : la boucle de jeu
sauvegarde périodiquement et **écrasait l'injection entre le `setItem` et le
`reload`** — mesuré, la page repartait sur une base.

| | une base | après fondation | après bascule |
| --- | --- | --- | --- |
| libellé | `BASE 1 / 1` | `BASE 1 / 2` | `BASE 2 / 2` |
| flèche ◀ | désactivée | **vive** | vive |
| flèche ▶ | désactivée | **vive** | vive |

| écran | avant | après | a suivi ? |
| --- | --- | --- | --- |
| **Chantier** — jetons | 3 | 1 | **OUI** |
| **Chantier** — bandeau | `50/50 saturé · 3/3 emplac.` | `30/50 · 1/3 emplac.` | **OUI** |
| **Offense** | les quatre vagues | « Aucun Centre de commandement posé » | **OUI** |
| **Monde** — pixels du canevas | `1863030377` | `1292274082` | **OUI** (le halo a bougé) |
| **Mission** | `MISSION 2 / 17` | `MISSION 2 / 17` | identique — **et c'est juste** |
| **Recherche** | `0 points` | `0 points` | identique — **et c'est juste** |

⚠⚠ **LES DEUX « IDENTIQUE » SONT DES RÉPONSES, PAS DES TROUS.** Les points de
recherche sont **globaux** — ils se paient une fois, la question « quelle base
paie » ne se pose pas. Et le tutoriel se mesure sur la **meilleure** base : sans
cette règle, fonder ou basculer aurait **décoché les douze missions de
construction d'un coup**, la base neuve n'ayant qu'un Chantier de niveau 1. Le
joueur aurait vu son tutoriel se vider pour avoir fait exactement ce que le
tutoriel lui demandait.

**Retour sur la base 1** : libellé `BASE 1 / 2`, **3 jetons retrouvés**,
`baseCourante` **écrit dans la sauvegarde**. **Zéro erreur de page.**

⚠ **CE QUI N'A PAS ÉTÉ VÉRIFIÉ SUR APPAREIL** : rien de ce lot n'a tourné sur le
téléphone d'Ethan. Un test appareil non exécuté se déclare **non exécuté**
(`CLAUDE.md` §3).

---

## 9. Les conditions de rupture de `rattraperJeu` (§5.2) : ce qui a été fait

Le rapport de BASES-0 en recensait **six**, dont **trois devenaient fausses au
pluriel**. Les trois sont traitées :

| Système | Verdict de BASES-0 | Ce que BASES-1 a fait |
| --- | --- | --- |
| `resoudreSatellites` | ❌ ne résout qu'une base | boucle sur `etat.bases`, une passe par base |
| `crediterLesReserves` | ❌ ne crédite qu'une base | boucle sur `etat.bases`, **chacune à son plafond** (`plafondDeLaReserveDeLaBase`) |
| `basesAttaquantes` | ❌ « la plus profonde » | rend des **PAIRES** portant `baseVisee` ; `subirUnRaid`, `raserLaBase`, `montageDeLaBaseDuJoueur` et `reparerLaGarnison` prennent la base attaquée |
| `releverLesPoisAcquis` | ✅ tenait | inchangé — le territoire était déjà l'union |
| `avancerPointsAttaque` | ✅ tenait | inchangé — la réserve est globale |
| `reparerLesSites` | ✅ tenait | inchangé — les sites de l'Ouvrage sont globaux |

⚠⚠ **UNE QUATRIÈME, QUE BASES-0 N'AVAIT PAS VUE, ET ELLE ÉTAIT PIRE.**
`siteDeLaCase` ne lisait que `baseCourante(etat).satellites` : sur le camp d'une
AUTRE base il rendait `null`, donc la case cessait d'être **attaquable** en même
temps qu'elle devenait invisible sur la carte. `satellitesPresents(etat)` boucle
désormais sur toutes les bases, et `ui/monde.js` la lit.

⚠ **Le compteur d'instance des satellites a dû quitter la base pour l'état.**
`graineDeLApparition(graine, instance)` : deux bases avec chacune leur compteur
seraient toutes deux parties de l'instance 1, donc de la **même graine
d'apparition**, et leurs satellites auraient été tirés du même flux. Global,
l'unicité est structurelle — et avec une seule base il rend exactement la suite
1, 2, 3… qu'elle tirait déjà. **Mesuré par comparaison directe à `origin/main` :
100 relevés, 0 divergent.**

---

## 10. Écarts par rapport au brief, et points en suspens

### Écarts

1. ⚠⚠ **`problemesDeLaFondation` NE PREND PAS DE POINTS.** Le §4.3 liste
   `points-insuffisants` parmi ses codes. Le §2.2 dit que la recherche se paie en
   points de recherche par `acheter`. **Les deux ensemble feraient payer deux
   fois.** Retenu : le droit de fonder s'ACHÈTE — `acheterUneBaseDePlus`, onglet
   Spécial — et `points-insuffisants` n'apparaît qu'**avec**
   `recherche-manquante`, pour dire si le rang qui manque est seulement à portée
   de bourse. Sans lui, le joueur lirait « il te faut la recherche » sans savoir
   s'il peut l'acheter tout de suite ou s'il doit d'abord raider.
2. ⚠ **`FONDATION.porteeMaxCases` EST UNE TABLE À PART**, bien qu'elle vaille 10
   comme `DEPLACEMENT.porteeMaxCases`. C'est la règle §4 : deux grandeurs qui
   partagent aujourd'hui une valeur ne sont pas la même grandeur, et les fondre
   ferait bouger l'une le jour où Ethan règle l'autre.
3. ⚠ **UN CHAMP D'ÉTAT DE PLUS QUE LES DEUX ANNONCÉS : `satellitesDetruits`.**
   Le §4.7 demande un moteur pour « Attaquer et détruire un camp ». **Rien dans
   le dépôt ne retenait cette information** : un camp détruit quitte `presents`
   et n'entre nulle part. `basesRasees` fait déjà exactement ça pour les BASES ;
   ce compteur est son pendant pour les satellites, et il est de l'HISTOIRE au
   même titre. La migration le pose à **zéro** : créditer rétroactivement
   cocherait une mission que personne n'a faite.
4. ⚠⚠ **LES OBJECTIFS DU TUTORIEL SE MESURENT SUR LA MEILLEURE BASE.** Pas au
   brief, et **obligatoire** : voir §8. « La meilleure » est celle qui va le plus
   loin vers l'objectif — ratio d'abord, compte brut pour départager. Une SOMME
   sur toutes les bases était l'autre lecture, et elle est fausse ici : « chaque
   bâtiment au niveau 5 » se lit base par base, et une base neuve tirerait la
   somme vers le bas indéfiniment.
5. ⚠ **DEUX GARDE-FOUS ONT ÉTÉ RETOURNÉS, PAS RETIRÉS, ET ILS SE DÉCLARENT.**
   (1) `BASES-0 T7` exigeait deux flèches **désactivées** et annonçait « elles
   s'ouvriront à BASES-1 » ; il exige maintenant que l'écran LISE la vue au lieu
   de désarmer en dur, et garde la moitié qui compte — une seule base laisse les
   flèches mortes. (2) `missions.test.js` exigeait qu'un libellé écrit à la main
   soit réservé aux missions **sans moteur** ; les quatre en ont un. Ce que la
   règle protégeait n'était pas l'absence de moteur, c'est qu'aucun NOM de
   bâtiment ou d'unité ne soit recopié dans un texte : la garde le dit maintenant
   **de face**, et la liste des quatre missions concernées est assertée à
   l'identique — une cinquième la fait tomber.
6. ⚠ **AUCUNE ASSERTION N'A ÉTÉ RETIRÉE.** Le compte passe de 885 à **902**.

### Points en suspens

1. ⚠⚠ **LE GESTE DE FONDATION N'A PAS D'ÉCRAN.** `problemesDeLaFondation`,
   `butinDeLaFondation` et `fonderUneBase` sont écrits, testés et falsifiés ;
   `acheterUneBaseDePlus` aussi. **Mais rien dans `src/ui/` ne les appelle** : le
   panneau de site de l'écran Monde n'a pas de bouton « Fonder ici », et l'onglet
   Spécial de l'écran Recherche n'a pas de bouton d'achat. Le brief ne les
   demandait pas — il nomme la bascule (§4.5), le halo (§4.6) et les missions
   (§4.7), jamais un écran de fondation. **Le lot est donc jouable pour tout ce
   qui touche à DEUX bases existantes, et la seconde base ne peut pas encore se
   poser au doigt.** C'est le premier trou à combler, et il tient en un bouton de
   chaque côté.
2. ⚠ **LA TROISIÈME `casesEnLigneDroite` EST ENTRÉE.** `points-attaque.js`,
   `deplacement.js` et maintenant `fondation.js` portent chacun leur boucle
   entière de racine carrée. Le commentaire de `deplacement.js` annonçait « si
   une TROISIÈME arrivait, il faudrait les réunir » : réunir demanderait aux deux
   autres d'importer `points-attaque.js` pour trois lignes, ce qui traînerait
   `clock.js` et `niveau-de-base.js`. **C'est un rangement, pas une règle**, et
   il vaut son propre lot.
3. ⚠ **`MARQUE_A_VENIR` ET LA BRANCHE `a-venir` DE `ui/mission.js` SONT
   DEVENUES INATTEIGNABLES.** `verifiable` vaut `true` partout depuis ce lot.
   Elles n'ont pas été retirées : `verifiable` se CALCULE encore, et le jour où
   une mission arrivera de nouveau sans moteur, il redeviendra utile. Le retirer
   obligerait à le réinventer.
4. ⚠ **`basesRasees` NE VIDE PAS LE TERRITOIRE PEINT.** `territoire.js` peuple
   ses influences par `basesDeLaFenetre`, qui dérive de la graine et ne lit pas
   `basesRasees` : **une base rasée continue donc de projeter son territoire sur
   la carte**, alors que `problemesDeLaFondation` la considère bien disparue —
   celle-ci passe par `siteDeLaCase`. Défaut **antérieur au lot**, découvert en
   écrivant `T1` (le montage voulait faire le vide autour d'une base et n'y
   arrivait pas). Il n'a pas été corrigé : ce serait changer ce que la carte
   montre, hors du périmètre de ce lot, et la divergence est aujourd'hui du
   BON côté — on n'interdit pas de fonder là où une base n'existe plus.
   **À arbitrer.**
5. ⚠ **`ouvrage.offense` RESTE VIDE**, et le reste — inchangé depuis MODULES-F.
6. ⚠ **AUCUN ESSAI SUR APPAREIL.** Voir §8.
7. ⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le
   lot ne touche ni `art/`, ni `tools/`.

---

## Point d'arrêt du §7 — aucun n'a été atteint

| Condition | État |
| --- | --- |
| la base de référence du §1 n'est pas retrouvée | ✅ retrouvée à l'octet |
| le prix d'un rang élevé ne peut pas être exact en entiers | ✅ exact jusqu'au rang 12 ; au-delà, arrondi au milli-point **supérieur**, dans le sens du refus, et écrit |
| une bascule fait lire à une base l'état d'une autre | ✅ `T10` et `T12` le mesurent ; F7 et F8 les font tomber |
| un test hors territoire change de **valeur** attendue | ✅ aucun. Les seuls déplacements du témoin sont `attaque` et `rapports` à partir de la phase 11 — le prix du raid, qui est la conséquence VOULUE de §4.1 |
| un nombre d'équilibrage autre que le ×2,5 semble devoir bouger | ✅ aucun |

**Le merge sur `main` appartient à Ethan seul.**
