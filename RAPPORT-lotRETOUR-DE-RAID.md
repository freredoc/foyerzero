# RAPPORT — lot RETOUR-DE-RAID

Retours d'Ethan du 06/09, points **5**, **6**, **8**, **11** et **21**.

Version produite : **0.99.6 · build 107** — `version` et `config.build` restent
des **chaînes JSON**, ce qu'`android/app/build.gradle.kts` lit `as String`.

---

## 0. Ce que le lot mesure, avant et après

| | avant | après |
|---|---|---|
| `npm test` | **1 159 pass / 0 fail** | **1 173 pass / 0 fail** |
| `dist/index.html` | 7 993 487 o | **7 997 324 o** |
| version | 0.99.5 · build 106 | **0.99.6 · build 107** |
| `SAVE_VERSION` | 26 | **26, inchangé** |
| références externes | 0 | **0** |

**Coût : +3 837 octets**, mesuré poste par poste contre un livrable **rebâti
depuis `origin/main`** dans un `git worktree` :

| poste | avant | après | delta |
|---|---|---|---|
| JavaScript | 350 617 | 352 405 | **+1 788** |
| feuille | 3 184 685 | 3 186 734 | **+2 049** |
| balisage | 4 458 185 | 4 458 185 | **+0** |
| images | 6 306 190 | 6 306 190 | **+0** |
| audio | 1 193 346 | 1 193 346 | **+0** |

La somme des cinq postes tombe **exactement** sur le total. **296 lignes `data:`
avant, 296 après ; 291 URI de part et d'autre** — le lot ne fait entrer ni une
image ni un son. Borne T10 **inchangée à 9 300 000**, marge **1 302 676 octets,
14,01 %**.

⚠⚠ **LA BASE ANNONCÉE PAR LE BRIEF N'ÉTAIT PLUS LÀ, TROISIÈME LOT DE SUITE.** Il
pose 1 135 pass, 7 987 956 octets et 0.99.2 · build 103 ; mesuré au départ,
**1 159 pass, 7 993 487 octets, 0.99.5 · build 106**. Les lots CARTE-B,
CHANTIER-FICHES et RECHERCHE-ÉCRAN ont été mergés entre l'écriture du brief et
son exécution. **Les faits dont le lot dépend étaient intacts**, vérifiés un par
un avant d'écrire : `lancer` appelle `executerRaid` avant la première image, les
deux plafonds d'interpolation existent sous les noms annoncés, `demarrerBoucle`
remet `derniereImageMs` à `null`, `#raid-instantane` porte bien le corps décrit,
`$('raid-vitesses').hidden = !simule`, `brancher('raid-reattaquer', …)` appelait
`lancer(false)`, `$('raid-reattaquer').hidden = rapport.rase`, `#raid-bascule-bande`
porte le commentaire cité, `problemesDuDeplacementDEffectif` refuse une case
occupée, et `ACTIONS_ARMEE.ameliorer` a un moteur depuis le 03/09.

⚠ **DEUX FAITS DU BRIEF SONT PÉRIMÉS, ET ILS SE DÉCLARENT.**
1. **`apercuDeLOffense` n'existe pas.** Aucune occurrence dans tout le dépôt —
   `grep -rn "apercuDeLOffense" src/ test/` rend zéro ligne. La fonction du §4 du
   brief s'appelle **`vueDeLOffense`**, et elle rend bien le `niveau` annoncé.
2. **La palette fait quarante-et-une teintes, pas trente-trois.** Elle s'est
   élargie au lot LIMITES-VIVES. Sans conséquence : le lot n'en ajoute aucune.

---

## 1. Point 11 — un raid quitté en cours atterrit sur son rapport

Ethan : « Je lance le raid. Je quitte le jeu juste après. Je reviens après 5 min.
Le raid a figé et reprend, je dois attendre la fin. »

### 1.1 L'état n'était pas en cause, et c'est le premier fait à dire

`lancer` appelle `executerRaid` **avant la première image** — arbitrage « A » du
01/09, écrit en tête de `rejouer`. Le butin était versé, la cible entamée, les
points dépensés. Ce qui retenait le joueur était **l'animation**, et trois
mécanismes s'y conjuguaient :

1. `requestAnimationFrame` ne bat plus quand la WebView passe à l'arrière-plan ;
2. au retour, `ticksDus` plafonne le temps injecté à `PLAFOND_RATTRAPAGE_MS`
   (250 ms) puis à `TICKS_MAX_PAR_IMAGE` (10) — **cinq minutes d'absence font
   avancer le déroulé d'une seconde au plus** ;
3. `demarrerBoucle` remet `derniereImageMs` à `null`.

Et il n'y avait **aucune sortie** : `#raid-instantane` fait exactement ce qu'il
faudrait, mais il vit dans `#raid-vitesses`, que `lancer` masque par
`hidden = !simule`.

### 1.2 Ce qui est écrit

Un `visibilitychange` **dans `src/ui/raid.js`**, et le corps d'« Instantané »
EXTRAIT sous le nom `conclureLeDeroule` — deux appelants le demandent désormais,
et deux écritures voisines de « conclure un combat » divergeraient. **Pas une
ligne de son corps n'a changé en route.**

### 1.3 ⚠⚠ Quatre gardes, et la troisième n'était pas au brief

| garde | ce qu'elle empêche |
|---|---|
| `doc.hidden === true` | l'évènement se déclenche dans les DEUX sens ; le retour n'a rien à conclure |
| `!simulation` | une simulation ne commande rien à personne ; quittée puis reprise, elle se reprend où elle en était |
| **`deroule`** | **voir ci-dessous** |
| `combat !== null && !combat.termine` | pas de second `montrerResultat` sur un rapport déjà affiché |

⚠⚠ **`deroule` EST MESURÉE, PAS SUPPOSÉE.** Le brief demandait
`combat !== null && !combat.termine` ; or **`ouvrir` monte DÉJÀ un combat pour
montrer la cible**, avec `vagues: []`, et `verifierFin` ne le termine qu'au
premier tick. S'en tenir aux gardes du brief aurait donc **résolu l'aperçu chaque
fois que le joueur quitte le jeu depuis la PRÉPARATION** : la cible se serait
figée sur un combat conclu « attaquants » qu'il n'a pas lancé. `RDR T3` le mesure
sur le canevas — `conclureLeDeroule` finit par `dessiner()`, donc la scène serait
repeinte, et elle ne doit pas l'être.

### 1.4 Ce qui n'a pas bougé

- **`PLAFOND_RATTRAPAGE_MS` et `TICKS_MAX_PAR_IMAGE`** : pas une ligne. Le défaut
  n'était pas là, et les relever remplacerait une attente de quatre-vingt-dix
  secondes par un gel de plusieurs secondes à la reprise.
- **`src/ui/session.js`** : pas une ligne. Ses deux écouteurs — l'horloge
  économique et le `pagehide` — sont intacts. Le déroulé appartient à l'écran de
  raid, donc c'est lui qui l'écoute.
- **Pas de bouton « passer »**, Ethan mot pour mot. `#raid-vitesses` garde son
  `hidden = !simule`, et `RDR T4` fige l'arbitrage **dans les deux sens** : caché
  sur un vrai raid, visible au simulateur.

---

## 2. Point 8 — « Réattaquer » remet sur la cible

Ethan : « Bouton réattaquer remet sur la cible, pas d'attaque instantané. »

Il appelait `fermerPanneaux(); lancer(false);` — un second raid partait
**immédiatement**, sans que le joueur revoie sa cible ni sa composition.

Le chemin d'entrée dans une cible est **EXTRAIT** sous le nom `ouvrirSurLaCible` :
la session y entre depuis la carte, « Réattaquer » y REVIENT. La méthode publique
`ouvrir` lui délègue en une ligne.

⚠ **LA CIBLE SE RELIT, ELLE NE SE RECOMPOSE PAS** : `cibleCourante` est en
mémoire, et `rapport.rase` garde son effet — `$('raid-reattaquer').hidden =
rapport.rase` n'a pas bougé.

⚠⚠ **ET L'ÉTAT A CHANGÉ, DONC L'ÉCRAN LE MONTRE.** C'est `ouvrirSurLaCible` qui
relit `siteDeLaCase` et rebâtit `montageDuRaid` : la défense restante, les
problèmes du raid et le prix affiché sont ceux d'APRÈS. **Lecture déclarée** : le
brief écrit « ne pas rappeler `siteDeLaCase` pour la reconstruire », ce qui porte
sur la CIBLE — les deux coordonnées, qu'on relit en mémoire —, et son ⚠ suivant
exige au contraire que `problemesDuRaid` soit réévalué et l'écran repeint. Passer
par le chemin d'entrée déjà écrit satisfait les deux.

⚠ **ET IL HÉRITE DE LA BANDE D'OUVERTURE**, §3 ci-dessous : il repasse par le
chemin d'entrée, donc il rouvre lui aussi **sur la défense**. C'est cohérent —
c'est ce qu'il reste à affronter — et c'est dit ici plutôt que découvert.
**Vérifié à l'écran** : après « Réattaquer », la bascule dit encore « Aller à
Chantier ».

---

## 3. Point 5 — la cible s'ouvre sur la défense ennemie

`BANDE_A_L_OUVERTURE` entre dans `src/ui/raid.js` et vaut `'defense'`.

⚠ **ELLE SE VÉRIFIE CONTRE `BANDES_NAVIGABLES` AU CHARGEMENT DU MODULE.** Une clé
hors de cette liste ferait rendre `basculeDeBande` la première bande venue et
l'écran s'ouvrirait ailleurs, **en silence** : c'est le seul mensonge que cette
constante puisse dire, et il se dit au dépôt, pas chez le joueur.

⚠ **À CHAQUE ENTRÉE, PAS SEULEMENT LA PREMIÈRE.** La valeur se pose dans
`ouvrirSurLaCible`, donc à chaque entrée. `RDR T7` **défait la bande avec le
bouton de bascule avant de rouvrir sur une seconde cible** : sans ce toucher, une
valeur posée une fois au câblage passerait le test.

⚠ Le décalage vertical part **hors bornes** (`-Infinity`) plutôt qu'à zéro, comme
le fait déjà `allerALaBande` : la borne basse de la Défense n'est pas le haut de
la grille, et `dimensionner` rabat sur le `min` de la bande sans que ce code-ci
ait à le recalculer.

**La bascule ne change ni de forme, ni de place, ni de teinte** : seule sa valeur
initiale bouge.

---

## 4. Point 21 — le niveau des pièces offensives s'affiche

### 4.1 La convention retenue, et d'où elle vient

**Celle du jeton du Chantier, reprise à la lettre** : un
`<span class="niveau">N</span>` posé en `position: absolute` dans le coin
bas-droit, **graisse 700**, en os `#F5F3E8` sur une ombre d'un pixel `#161914`.
La règle du Chantier est `.jeton .niveau`, écrite au lot ERGONOMIE le 04/09 après
qu'Ethan a jugé les nombres « trop petits et peu lisibles ».

**Aucune teinte neuve** : les deux sont déjà celles de ce nombre-là ailleurs.

⚠ **CE QUI CHANGE EST LA TAILLE, ET C'EST UNE CONSÉQUENCE, PAS UN CHOIX.** Le
Chantier écrit `max(11px, calc(var(--case-cote) / 3.2))` parce que SA case zoome
de 36 à 128 px ; les deux grilles de vagues ne zooment pas et n'ont pas de
`--case-cote`. **Relevé à l'écran : case de 34,0 px à l'Offense, 36,9 px au
raid** — la formule du Chantier y rend son PLANCHER, 11 px, et rien d'autre. On
écrit donc le plancher, qui est exactement ce que la convention donne ici.

⚠ **AUCUN CALCUL DANS L'ÉCRAN** : le nombre vient de ce que rend `vueDeLOffense`
(Offense) et `vaguesDeLArmee` (raid), qui le lisent sur la pièce.

### 4.2 Les DEUX grilles, et une seule règle

Le point 21 est écrit **des deux côtés** — écran Offense et grille des vagues de
l'écran de raid — parce que ce sont **les mêmes pièces d'assaut**, dans la même
grille de composition : les écrire d'un seul côté aurait laissé au joueur un
écran où le niveau se lit et un autre où il ne se lit pas, pour une armée qui est
la même. **Écart au brief, déclaré** — son §4 ne nomme que l'écran Offense.

La règle de feuille est **partagée** par les deux sélecteurs, comme l'est déjà
celle de `.piece` depuis le lot ÉCRAN-RAID.

### 4.3 ⚠⚠ La défense n'avait pas ce manque — relevé, pas corrigé

Le brief demande de le relever sans y toucher s'il s'applique aussi. **Il ne s'y
applique pas** : `src/ui/defense.js` est un éditeur **PUR** et ne touche à aucun
élément du DOM — `grep -n "createElement\|doc\." src/ui/defense.js` rend zéro
ligne. La bande Défense est peinte par `ui/chantier.js`, **dans la même boucle
que les bâtiments**, qui pose déjà `.jeton .niveau` sur chaque pièce de garnison.
Le trou était propre aux deux grilles de vagues.

---

## 5. Point 6 — deux pièces se permutent

Ethan : « On peut permuter des unités lors du glisser déposer. »

### 5.1 ⚠⚠ Une permutation n'est pas deux déplacements

Enchaîner `deplacer(A → case de B)` puis `deplacer(B → case de A)` passerait par
un état intermédiaire où **deux pièces occupent la même case**, et la première des
deux validations le refuserait — `superposition`, sur un geste parfaitement
légal. `problemesDeLaPermutationDEffectif` construit donc **l'état d'ARRIVÉE**,
une fois, et le juge.

### 5.2 ⚠⚠ Elle refuse en entier, et le cas est réel

Si l'une des deux arrivées est illégale **pour la pièce qui y arrive**, la
permutation entière tombe. Le cas n'est pas théorique : `obstacle` est dans
`CODES_TOLERES_AU_CHARGEMENT` — le terrain se redéduit à chaque chargement, donc
un rocher peut apparaître sous une pièce posée légalement la veille. Permuter
cette pièce-là ferait **arriver l'autre sur le rocher**, et une demi-permutation
laisserait la force dans un état que le chargement suivant refuserait.

⚠ **LES DOUBLONS SONT RETIRÉS, ET RIEN D'AUTRE.** Les deux arrivées peuvent
produire mot pour mot le même refus, et `messageDeRefus` les joindrait par un
point-virgule. Le dédoublonnage porte sur le COUPLE code+message : deux refus de
codes différents restent deux refus.

### 5.3 Ce qu'elle garde

- **Elle ne coûte rien** — Ethan, 28/08 : « déplacement gratuit, comme bâtiment ».
  Ce sont les mêmes pièces, aux mêmes niveaux, qui changent de case.
- **Les deux pièces sont modifiées EN PLACE, et leurs indices ne bougent pas.**
  L'écran garde un indice EN MAIN entre les deux touchers du geste : réécrire la
  liste dans un autre ordre lui ferait viser une pièce qui n'est plus celle-là.
- **Elle LÈVE sur un refus**, comme `deplacerEffectif` : le chemin reste
  « problèmes → si vide, agir ; sinon, toast », sans exception non attrapée.
- **Elle LÈVE sur deux fois le même indice.** Ce n'est pas un refus de jeu :
  l'écran route ce cas-là vers le DÉPLACEMENT, où rester sur place est légal.
- **Le geste n'est câblé que sur l'ARMÉE.** La garnison a son propre chantier
  d'interface ; la fonction, elle, prend la force en paramètre comme ses voisines.

### 5.4 Le câblage

Deux champs de plus sur `ACTIONS_ARMEE.deplacer` — `problemesDeLaPermutation` et
`permuter` — plutôt qu'une cinquième action que rien ne déclencherait au bouton :
c'est le MÊME geste, avec une autre destination. `deposerLaPieceEnMain` route sur
l'occupant de la case d'arrivée, et **sur sa propre case reste un déplacement**.

---

## 6. Les tests — PASS/KO et montage effectivement écrit

**Quatorze tests entrent, le compte passe de 1 159 à 1 173.** Neuf dans
`test/raid-ecran.test.js`, trois dans `test/state.test.js`, deux dans
`test/offense.test.js`.

| code | verdict | montage effectivement écrit |
|---|---|---|
| **RDR T1** | **PASS** | Écran monté sur une vraie partie, `#raid-attaquer` touché ; le montage asserte d'abord qu'un rapport a été empilé, que `#raid-bas` est masqué et que `#raid-bandeau` ne l'est PAS — donc un déroulé de VRAI raid en cours. Puis `doc.hidden = true` + `visibilitychange` : `#raid-fin` s'ouvre avec ses lignes, `#raid-bas` revient, et **aucun second rapport n'est empilé**. |
| **RDR T2** | **PASS** | Même montage par `#raid-simuler` ; le montage asserte que le compte de rapports n'a PAS bougé et que le bandeau SIMULATEUR est levé. Après masquage : `#raid-bas` toujours masqué, aucun panneau ouvert. |
| **RDR T3** | **PASS** | **Deux moitiés.** (a) après `ouvrir`, en PRÉPARATION : on compte les appels au canevas avant et après l'évènement, et ils doivent être ÉGAUX — `conclureLeDeroule` finit par `dessiner()`. (b) écran monté et jamais ouvert, `combat === null` : aucun panneau, aucune exception. |
| **RDR T3 bis** | **PASS** | Déroulé en cours, `doc.hidden = false` : le RETOUR de veille ne conclut rien. |
| **RDR T4** | **PASS** | Après `lancer(false)`, `#raid-vitesses.hidden === true` ; **et la contre-épreuve** — après `lancer(true)`, `hidden === false`. La garde n'est pas un mur. |
| **RDR T5** | **PASS** | Raid mené jusqu'au rapport, puis `#raid-reattaquer` touché : **`etat.rapports.length` et `etat.attaque.points` inchangés** — `executerRaid` empile et dépense, donc ni l'un ni l'autre ne bouge. Et l'écran est en préparation. Un test qui ne vérifierait que « les panneaux sont fermés » passerait sur l'ancien code. |
| **RDR T6** | **PASS** | **Voir §7 — sa première écriture est tombée.** Il compare la TRACE du canevas : on prouve d'abord que deux ouvertures du même état la rendent identique, puis on raid, puis on touche « Réattaquer » et on exige que la trace DIFFÈRE et ne soit pas vide. |
| **RDR T7** | **PASS** | Première cible : la bascule porte le libellé de `basculeDeBande('defense')`. On touche la bascule (le montage asserte qu'elle a bien changé de bande), puis on entre dans une **seconde** cible : elle doit être revenue sur la défense. |
| **RDR T8** | **PASS** | Deux pièces montées aux niveaux 3 et 7 dans l'état ; les six cases occupées portent exactement les niveaux de l'armée, dans l'ordre ; une case vide n'a **aucun** enfant. |
| **RDR T8 bis** | **PASS** | Écran Offense monté ; pièces aux niveaux 4 et 9 ; les pastilles disent 4 et 9, une case vide n'en a pas. Puis `ACTIONS_ARMEE.ameliorer.agir` et repeint : la pastille passe à 5 — **le nombre suit le moteur**. |
| **RDR T9** | **PASS** | Deux pièces à des cases distinctes (le montage l'asserte) ; après permutation, **chacune** porte la case de l'autre, le compte est inchangé, les indices n'ont pas bougé, niveaux intacts. Et deux fois le même indice LÈVE. |
| **RDR T10** | **PASS** | Garnison, une pièce SOUS un obstacle (l'état toléré), une autre sur une case libre — le montage asserte que la case « libre » n'en porte pas. `problemes` a **exactement une** entrée, de code `obstacle`, et `permuterEffectif` lève **sans avoir déplacé un champ**. |
| **RDR T11** | **PASS** | `pointsEngages(etat, 'armee')` identique avant et après ; le montage asserte d'abord qu'il n'est pas nul. Et l'économie n'a pas bougé. |
| **RDR T9 bis** | **PASS** | **Le geste, au doigt** : sélection, `#offense-deplacer`, prise en main (le montage asserte le message « en main »), dépôt sur la case OCCUPÉE. Les deux pièces ont échangé, aucun toast de refus, budget inchangé. Puis le dépôt sur SA PROPRE case, qui reste un déplacement. |

### 6.1 Ce qui n'a pas pu être exécuté faute d'écran — dit, pas maquillé

Rien, cette fois-ci, pour les onze propriétés du brief : **deux faux documents
entrent**, et les huit premiers tests montent l'écran pour de bon. Ce que ces
faux ne prouvent PAS : qu'un nombre est LISIBLE, qu'une case est à la bonne place
à l'œil, ni qu'un vrai `visibilitychange` d'Android se déclenche. Ce sont des
gardes de MÉCANISME ; la preuve du rendu est au §8, mesurée dans Chromium.

### 6.2 Les deux faux documents

Le point 11 porte sur un **cycle de vie** et le point 21 sur du **DOM** :
asserter que la source contient un écouteur prouve la ligne, pas le chemin — le
proxy que ce dépôt a déjà payé quatre fois. Les deux faux sont écrits à la main
sur le modèle de ceux de `chantier.test.js`, `recherche.test.js` et
`monde.test.js` ; **aucune dépendance n'entre**, `esbuild` reste la seule.

⚠ Ils **lèvent sur tout identifiant que `src/index.src.html` ne déclare pas**, et
la liste est confrontée au balisage avant le montage : ils gardent donc une
seconde chose — qu'aucun des deux écrans ne demande un élément que la page n'a pas.

⚠⚠ **ET ÉCRIRE `textContent` DOIT VIDER LES ENFANTS** — trouvé en le mesurant, pas
en le relisant. Les deux peintres commencent par `hote.textContent = ''` ; un faux
qui garderait ses enfants empilait quatre vagues de plus à chaque repeint, et la
première écriture de `RDR T6` comptait des cases qui n'existaient plus.

---

## 7. Les falsifications — quinze, quinze chutes

Chacune est appliquée sur l'arbre final, la suite relancée sur les cinq fichiers
touchés, puis l'arbre restauré.

| # | falsification | ce qui tombe |
|---|---|---|
| F1 | l'écouteur de masquage rendu inerte | RDR T1, RDR T5 |
| F2 | la garde `!simulation` retirée | **RDR T2 seul** |
| F3 | la garde `!deroule` retirée | **RDR T3 seul** |
| F4 | l'évènement pris dans les deux sens | **RDR T3 bis seul** |
| F5 | `#raid-vitesses` ouvert au vrai raid | ASSAUT T8, RDR T4 |
| F6 | « Réattaquer » relance `lancer(false)` — le code d'avant | ASSAUT T1, RDR T5 |
| F7 | **le MONTAGE de la cible mémorisé au lieu d'être relu** | **RDR T6 seul** |
| F8 | `BANDE_A_L_OUVERTURE` remise à `'batiments'` | **RDR T7 seul** |
| F8 bis | la bande posée une fois au câblage, pas à chaque entrée | **RDR T7 seul** |
| F9 | le niveau écrit en dur sur la grille du raid | **RDR T8 seul** |
| F9 bis | le niveau écrit en dur sur la grille de l'Offense | **RDR T8 bis seul** |
| F9 ter | la pastille retirée à l'écran de raid dans la feuille | **ERGO T6 seul** |
| F10 | la permutation ne déplace qu'une des deux pièces | RDR T9, RDR T9 bis |
| F11 | une seule des deux arrivées est jugée | **RDR T10 seul** |
| F12 | la permutation duplique la pièce au lieu de l'échanger | RDR T9, T9 bis, **T11** |
| F13 | le dépôt sur une case occupée redevient un refus | **RDR T9 bis seul** |
| F14 | le dépôt sur SA PROPRE case part en permutation | **RDR T9 bis seul** |
| F15 | `conclureLeDeroule` ne montre plus le rapport | ASSAUT T7, RDR T1, T5, T6 |

⚠⚠ **ET LA PREMIÈRE VERSION DE F7 N'A PAS MORDU.** Elle mémorisait le **SITE** :
mesuré, cela ne change rien — l'objet ne porte que
`{type, niveau, saveur, instance, rangee, colonne}`, et les dégâts vivent dans
`etat.sitesEntames`, que `montageCourant` relit à chaque appel. C'est le
**MONTAGE** qu'il fallait mémoriser. **Une falsification qui ne mord pas se
vérifie avant d'être crue.**

⚠⚠ **ET C'EST ELLE QUI A FAIT RÉÉCRIRE `RDR T6`.** Sa première écriture comptait
les vignettes marquées `abimee` dans la grille des vagues : **`lancer` repeint
DÉJÀ les vagues après le raid**, si bien que l'armée abîmée est à l'écran avant
même qu'on touche « Réattaquer ». Le test passait sur un écran qui ne relit rien.
Mesuré ensuite, pour trouver ce qui discrimine : le camp de référence garde ses
**trois défenseurs vivants** après le raid — le compte d'entités ne bouge pas —
mais à **52 % de leurs PV** (`restantDefense: 52`), et `render/scene.js` peint une
barre de vie dont la **largeur** est proportionnelle aux PV. Le nombre de
primitives ne bouge pas ; **leurs arguments, si**. Le test compare donc la trace
du canevas.

---

## 8. Relevé dans Chromium — géométrie du S25 FE, sur une vraie partie chargée

360 × 780 CSS, `deviceScaleFactor` 3, `dist/index.html` chargé en `file://`, une
sauvegarde injectée avant la première navigation. **`playwright-core` est
installé HORS DU DÉPÔT** (CLAUDE.md §3) ; `esbuild` reste la seule dépendance.

**1 — les pastilles de niveau, écran Offense.** Six pièces aux niveaux 1, 3, 5, 7,
9 et 11. Mesuré : **`font-size: 11px`, `font-weight: 700`,
`color: rgb(245, 243, 232)`** — soit `#F5F3E8`. Boîte du nombre **7,7 × 11 px**
(15,3 × 11 pour « 11 »), case de **34,0 × 34,0 px**, et **les six sont dans leur
case** (bord droit et bord bas inclus). `document.body.scrollWidth` **360** pour
un `clientWidth` de **360** : **zéro débordement horizontal**.

**2 — la permutation, au doigt.** Avant :
`v1c2=niv1 · v1c4=niv5 · v1c6=niv9 · v2c3=niv3 · v2c5=niv7 · v2c7=niv11`. On
sélectionne la pièce de `v1c2`, on arme « Déplacer », on la prend en main — l'avis
dit « Déplacement de Fusiliers : touchez l'emplacement d'arrivée » — et on dépose
sur `v2c3`, **occupée**. Après : `v1c2=niv3 · v2c3=niv1`, les quatre autres
intactes. **Aucun refus** : l'avis reste le message de budget préexistant.

**3 — la cible s'ouvre sur la défense.** Entrée par le double toucher depuis la
carte. La bascule porte **« ▲ Aller à Chantier »** — elle nomme la bande où elle
EMMÈNE, donc on est bien sur la **Défense**. Les six pastilles du raid : 11 px,
boîte 7,7 × 11, case de **36,9 px**.

**4 — le raid masqué atterrit sur son rapport.** Pendant le déroulé :
`#raid-bas` masqué, `#raid-fin` masqué, **`#raid-vitesses` masqué** (pas de bouton
« passer »). On masque la page. Après : **`#raid-bas` revenu, `#raid-fin` ouvert
avec ses dix lignes, « Réattaquer » visible.**

**5 — « Réattaquer ».** Rapport refermé, `#raid-bas` visible, bandeau SIMULATEUR
masqué, bascule toujours « Aller à Chantier » — **l'héritage de la bande
d'ouverture, vérifié** —, et le bouton dit « ATTAQUER · 12 points », **ré-armé**.

**Zéro erreur de page** sur tout le parcours. Cinq captures dans `rapports/`.

---

## 9. Les gardes existantes — cinq changent de cible, quatre se resserrent

**Aucune assertion n'a été retirée ni assouplie.**

| garde | ce qui change |
|---|---|
| `ASSAUT T1` | **se resserre** : `lancer(false)` passe de DEUX déclencheurs à UN. Et « Réattaquer » est nommé **dans les deux sens** — il ne doit contenir aucun `lancer(`, et il doit contenir `ouvrirSurLaCible(etatCourant, cibleCourante)`. |
| `ASSAUT T7` | **suit l'extraction sans relâcher** : le bouton mène à `conclureLeDeroule`, PUIS la fonction mène à `finDuDeroule`. Une indirection qui perdrait la fin le fait tomber. |
| `ASSAUT T9` | **se resserre** : elle lit le chemin d'entrée NOMMÉ, et exige en plus que la méthode publique `ouvrir` lui DÉLÈGUE au lieu de refaire une entrée à elle. |
| `SON T24` | **suit l'extraction** : « Instantané » conclut le déroulé, et c'est le corps de `conclureLeDeroule` qui ne doit ni relever ni prendre d'instantané. Il y a maintenant **deux** appelants muets au lieu d'un. |
| `ERGO T6` | **se resserre** : elle exigeait UNE règle de pastille dans toute la feuille ; elle en exige **deux** — celle du jeton, et une **SEULE** pour les deux grilles de composition, dont elle nomme les deux sélecteurs. |

---

## 10. Ce qui n'a pas été touché

- **`src/sim/combat.js`** : pas une ligne. Les points 7, 9 et 10 sont le lot COLONNE.
- **`src/ui/session.js`** : pas une ligne.
- **`render/interpolation.js`** : les deux plafonds sont intacts.
- **`src/ui/defense.js`** : relevé au §4.3, non corrigé — il n'a pas ce manque.
- **La garnison et son glisser-déposer** : chantier séparé.
- **Le simulateur** : bandeau, vitesses, pas-à-pas, instantané — aucun
  comportement visible ne change ; le bouton « Instantané » appelle la fonction
  qui porte désormais son ancien corps.
- **`SAVE_VERSION` reste à 26.** Pas un champ n'entre dans l'état : une
  permutation échange deux cases déjà sauvegardées, une pastille est un dessin,
  une bande d'ouverture et un écouteur vivent dans l'écran.
- **`python3 tools/verifier.py` n'a pas été lancé, et c'était conforme** : le lot
  ne touche ni `art/`, ni un outil de la chaîne. Les cinq captures vivent dans
  `rapports/`, hors de la chaîne.

---

## 11. Écarts au brief, déclarés

1. **Une cinquième garde entre sur l'écouteur du point 11** — `deroule`. Le brief
   en demandait quatre ; les siennes laissaient passer la PRÉPARATION, mesuré
   (§1.3). C'est un resserrement, pas un relâchement.
2. **Le point 21 est écrit sur les DEUX grilles de vagues**, Offense et raid. Le
   brief ne nomme que `apercuDeLOffense` ; ce sont les mêmes pièces (§4.2).
3. **`RDR T6` ne mesure pas « les points d'attaque affichés »**, qui ne bougent
   pas : cet écran affiche le PRIX d'un raid, fonction de la distance et du
   niveau du site. Il compare la scène (§7).
4. **`RDR T3` gagne une seconde moitié** — le cas de la préparation, que le brief
   ne demandait pas.
5. **Trois tests entrent en plus des onze** — `T3 bis`, `T8 bis`, `T9 bis` — pour
   couvrir le retour de veille, la grille de l'Offense et le geste au doigt.
6. **Deux faux documents entrent**, dont un dans un fichier qui n'en montait
   aucun (§6.2). Le brief ne le demandait pas et ne l'interdisait pas ; sans eux,
   huit des quatorze tests auraient été des lectures de source.
7. **La base annoncée n'était plus là**, et deux faits du brief sont périmés (§0).

---

## 12. Ce qui reste ouvert, pour Ethan

1. **La permutation en GARNISON n'est pas câblée.** La fonction la sert déjà — le
   `force` est un paramètre, et `RDR T10` s'en sert — mais l'écran de la base a
   son propre chantier. Une ligne dans `ui/chantier.js` le jour venu.
2. **Le prix affiché après « Réattaquer » a changé** dans le relevé — « 12
   points » au retour. C'est `coutDUnRaid` relu sur l'état d'après, ce que le
   point 8 demande ; rien n'a été touché au barème.
3. **Le déroulé d'un vrai raid reste sans contrôle**, par arbitrage : « bouton
   passer non ». La seule sortie est désormais de quitter le jeu, ce qui atterrit
   sur le rapport. Si Ethan veut une sortie explicite, c'est un bouton à
   dessiner, pas un mécanisme à écrire.
