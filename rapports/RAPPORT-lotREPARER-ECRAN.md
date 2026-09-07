# RAPPORT — lot RÉPARER-ÉCRAN

**05/09/2026.** Le bouton Réparer du bandeau contextuel existe depuis le 27/08 et
répondait par une phrase. Il agit.

---

## 0. Ce que le brief demandait en tête : le chemin de réparation existe-t-il ?

**OUI.** `sim/reparation.js` porte les cinq fonctions depuis le lot RÉSERVE-BASE,
et `base.reserveReparationBatiments` est dans l'état depuis `SAVE_VERSION = 25`.
Ce qui manquait était l'ÉCRAN, et c'est exactement ce que le rapport précédent
disait : « le cliquet n'est pas refermé pour le joueur […] il est cassé côté
MOTEUR, et l'écran est le lot suivant ».

---

## 1. Version, build, sauvegarde

| | |
|---|---|
| `GAME_VERSION` | **0.99.0** |
| `GAME_BUILD` | **101** |
| `SAVE_VERSION` | **25 — INCHANGÉ** |

`SAVE_VERSION` a été **vérifié, pas supposé** : `grep` sur `src/sim/state.js`
rend `export const SAVE_VERSION = 25;`, la valeur de `main`. Pas un champ n'entre
dans l'état — la quatrième réserve y était déjà, et ce lot ne fait que la lire, la
dépenser et l'afficher. Aucune migration n'est due.

---

## 2. `npm run check` avant et après, et le poids

**Avant**, sur le clone à `origin/main` (`ac43ce3`) :
**1117 pass / 0 fail**, `dist/index.html` **8 996 966 octets**.

**Après** : **1128 pass / 0 fail**, `dist/index.html` **9 003 058 octets**.

### Le coût, poste par poste, contre un livrable REBÂTI depuis `main`

Un `git worktree` sur `origin/main`, `node tools/build.js`, et les deux livrables
pesés par la même méthode. Les charges utiles `data:` sont retirées AVANT de peser
la feuille et le balisage : les atlas vivent dans `<style>`, et les compter là les
compterait deux fois.

| poste | avant | après | delta |
|---|---:|---:|---:|
| **total** | 8 996 966 | 9 003 058 | **+6 092** |
| JavaScript | 345 226 | 349 470 | **+4 244** |
| feuille | 99 129 | 100 752 | **+1 623** |
| balisage | 37 241 | 37 466 | **+225** |
| audio | 1 193 346 | 1 193 346 | **+0** |
| images | 7 323 770 | 7 323 770 | **+0** |
| URI `data:` | 291 | 291 | **+0** |

**Borne T10 inchangée à 9 300 000**, marge **296 942 octets, soit 3,19 %.**

### ⚠⚠ Le compte de `data:` annoncé depuis quatre lots est un compte de LIGNES

Les rapports précédents écrivent « 296 `data:` avant, 296 après ». C'est ce que
rend `grep -c`, qui compte les LIGNES portant le motif, pas les occurrences.
**Le vrai compte d'URI est 291** — 21 images et 270 sons —, et les cinq lignes de
plus nomment `data:` sans en porter une, dont le commentaire de la feuille qui
explique l'inlinage. Les deux comptes sont **identiques des deux côtés** : ce lot
ne fait entrer ni une image ni un son.

---

## 3. Les cinq faits du §0.3, vérifiés — et le seul qui ne tenait pas

1. `sim/reparation.js` exporte les cinq fonctions — **VRAI**, plus
   `devisDeLaReparationDesBatiments`, `problemesDeToutReparerLesBatiments` et
   `toutReparerLesBatiments`.
2. `base.reserveReparationBatiments` existe, en ticks — **VRAI**.
3. `ACTIONS.reparer` n'a ni `problemes` ni `agir` — **VRAI**.
4. `TERRAINS.batiments.actions.reparer` est **absent, donc `undefined`** —
   ⚠ **FAUX, ET LA NUANCE COMPTE.** `TERRAINS.batiments.actions` vaut `ACTIONS`
   **telle quelle**, sans recopie : `…actions.reparer` existait donc, et portait
   `{ bouton, libelle }`. Ce qui valait `undefined`, c'est `action.problemes`, et
   c'est bien sur lui que portait la branche à retirer. La correction demandée est
   la même ; l'énoncé du brief ne l'était pas. `TERRAINS.garnison.actions.reparer`
   vaut bien **`null`** — vérifié.
5. `detailDuBatiment` ne dit rien des dégâts — **VRAI**.

Aucun des cinq n'avait bougé au point de justifier un arrêt. L'écart du n° 4 est
déclaré plutôt que corrigé en silence.

---

## 4. Ce que le lot fait

### 4.1 — Le moteur descend dans la table, tel quel

```js
reparer: {
  bouton: 'chantier-reparer',
  libelle: 'Réparer',
  geste: 'reparation',
  problemes: problemesDeLaReparationDUnBatiment,
  agir: reparerUnBatiment,
},
```

Rien n'est réécrit dans l'écran. L'import vient de **`sim/reparation.js`** — pas
de `sim/state.js`, qui est le module que la garde précédente regardait par erreur.

### 4.2 — Le geste `reparation` est déclaré dans `src/son/cablage.js`

L'écran aurait pu passer `'amelioration'` pour obtenir le même son. Il aurait
alors **menti sur ce que le joueur vient de faire**, et le jour où le pack donnera
un son propre à la réparation, il aurait fallu retrouver lequel des deux appels
était lequel.

**Et le son n'est pas `building_player_repair_loop`** : celui-là porte
`boucle: true` — il décrit une réparation qui DURE, et il reste muet pour la
raison écrite au lot SON-CÂBLAGE, le modèle n'ayant « ni réparation qui dure ».
C'est `building_player_complete`, parce que ce qui est vrai, c'est qu'un bâtiment
vient de se retrouver debout et entier — exactement ce que ce son dit déjà de la
pose et de l'amélioration.

Le balayage des atteignables de `son.test.js` gagne le geste : il se dit
exhaustif, et un geste absent y **déclarerait muet ce qui sonne**.

### 4.3 — `messagePasDeReparation` disparaît, avec deux dépendances

Elle rendait « *aucun bâtiment n'est endommagé : les dégâts n'existent pas
encore* ». **Faux depuis le 02/09** côté base — `raid-ouvrage.js` écrit
`degatsMilli` depuis RAID-B — et **faux depuis RAID-0** côté armée.

Partent avec elle :

- **le champ `quoi` des DEUX terrains** — elle en était le seul lecteur, et un
  champ que plus rien ne lit est un commentaire menteur en puissance ;
- **la branche `action.problemes === undefined`** de `executerAction` — elle
  existait pour la seule action qui n'avait de moteur nulle part ;
- **son test**, et l'assertion de `chantier.test.js` qui gardait la forme de
  `quoi`.

### 4.4 — ⚠ L'écran Offense l'importait aussi, et le brief ne le disait pas

Le build est tombé sur `No matching export in "src/ui/chantier.js" for import
"messagePasDeReparation"` — `src/ui/offense.js:56`.

`REPARATION_AILLEURS` la remplace, et dit ce qui est **vrai** : « Les unités se
réparent sur l'écran de raid, avec « Réparer » ou « Tout réparer ». » Le moteur de
l'armée existe ; il est branché sur l'AUTRE écran depuis l'arbitrage du 01/09.
`actionSansMoteur` aurait dit « Réparer n'existe pas encore pour l'armée », ce qui
est faux, et rendre le bouton inerte aurait pris « un indice n'est pas une
interdiction » à l'envers. **Écart au brief, déclaré.**

### 4.5 — Le commentaire de la garnison est réécrit, et il ne dit plus le contraire

Il annonçait que ce trou « est le prochain à se combler ». **Il ne se comblera
jamais par un bouton** : `MODELE-REPARATION-1.md` §3 dit que le Complexe de
défense répare la garnison **gratuitement, tout seul, en une heure**, et
`reparerLaGarnison` de `sim/raid-ouvrage.js` le fait déjà après chaque raid. Le
`null` reste, et il dit désormais « pas de geste ici », plus « pas encore de
moteur ».

---

## 5. Voir avant de toucher

### 5.1 — Le bandeau contextuel dit l'avarie et son prix

`detailDuBatiment` rend deux champs de plus :

- `degatsSubisMilliemes` — **une part des PV max, jamais un absolu**, même règle
  et même avertissement que `degatsSubisMilliemes` d'`apercuDeLaPiece` : le même
  coup encaisse 67 milli-PV au niveau 5 et des dizaines de millions au niveau 50 ;
- `devis` — pris dans **`coutDeLaReparationDUnBatiment`**, avec le `Math.round`
  que `reparerUnBatiment` facturera. Rien n'est recalculé.

Relevé à l'écran : *« Niv. 20 · 28 % de dégâts · réparer : 2 185 q · 2 min »*.
Un bâtiment intact ne dit rien du tout — « 0 % de dégâts » onze fois serait onze
fois la même absence d'information, dans une ligne qui coupe à l'ellipse.

### 5.2 — Un abîmé se voit sur la grille

**La convention n'est pas inventée : elle vient de l'écran de raid.**
`#ecran-raid .emplacement.abimee` borde en `#E43E32` depuis le 01/09 ; le jeton
reprend **la classe et la teinte**.

⚠ **Mais c'est un `outline`, pas un `border`, et la différence est mesurable.**
L'emplacement du raid porte déjà une bordure, dont ce fait ne change que la
couleur ; le jeton n'en a aucune, et lui en donner une rétrécirait la boîte de
PADDING — donc la surface où `background-image` peint le sprite, dont
`background-origin` vaut `padding-box`. Un pixel art recalé d'un pixel n'est plus
du pixel art. `.case.legale` et `.case.choisie` emploient l'`outline` pour cette
raison exacte.

⚠ **Et la même ligne sert les DEUX bandes**, sans un `=== 'defense'` écrit à la
main : une pièce de garnison porte `degatsMilli` comme un bâtiment.

### 5.3 — « Tout réparer », et ce qu'il ne fait PAS

C'est un **bouton direct**, pas une cinquième entrée d'`ACTIONS` : cette table est
le registre du modèle « armer puis toucher », et un geste global n'y a rien à
désigner. Le précédent est `raid-tout-reparer`, du 01/09.

⚠⚠ **`problemesDeToutReparerLesBatiments` n'est lue que pour son code
`rien-a-reparer`.** Elle juge le **devis TOTAL** : la mettre en garde du bouton
refuserait trente-neuf bâtiments payables parce que le quarantième est hors de
portée — plus sévère que l'armée, pour la même mécanique, sur un moteur écrit pour
l'inverse.

**La preuve que ça ne refuse pas en bloc** (`RÉPARER T9`) : une base à cinq
bâtiments abîmés à 90 %, trois petits (niveau 5) et deux gros (niveau 30), réserve
réglée à la somme des trois petits.

| | attendu | mesuré |
|---|---:|---:|
| `reparees` | 3 | **3** |
| `impayables` | 2 | **2** |
| PV rendus aux trois payables | oui | **`degatsMilli === 0` pour les trois** |
| PV des deux impayables | intacts | **`degatsMilli > 0` pour les deux** |

Le montage asserte d'abord qu'il **discrimine** — les deux gros coûtent chacun
plus que les trois petits réunis — sinon la réserve ne trancherait rien.

⚠ **Et le bilan se dit, même à zéro réparé.** Trois phrases : tout réparé,
partiellement, rien de payable. Sans elle, une réserve à sec rendrait un écran qui
ne bouge pas, et le joueur croirait le bouton mort.

### 5.4 — ⚠ La réserve s'affiche, et le brief se trompait sur son précédent

Il demandait de faire « comme l'écran d'armée montre ses trois réservoirs ».
**Mesuré : `reservoirsDeLArmee` n'a AUCUN appelant dans `src/ui/`.** Aucun écran
ne montre de réserve — il n'y avait rien à reprendre. La forme retenue est la plus
sobre, et elle est déclarée comme telle : une ligne de texte dans le bloc de
« Tout réparer ».

```
Réserve : 32.0 h / 32.0 h · 4 à réparer : 14 879 q · 13 min
```

⚠ `plafondDeLaReserveDesBatiments` **LÈVE sur une disposition vide**. L'écran se
peint avant que l'état soit là et pendant un chargement raté : il regarde, plutôt
que de l'appeler à l'aveugle.

⚠ **Le devis total vient du moteur** — `devisDeLaReparationDesBatiments`, qui
somme des ARRONDIS parce que `toutReparerLesBatiments` débite bâtiment par
bâtiment. Le recalculer annoncerait un prix que l'opération ne pratique pas.

⚠ **Elle se repeint pendant que le mode dure**, puisque la réserve monte pendant
qu'on la regarde — mais **seulement quand la barre est à l'écran** : hors de là,
ce serait un devis sur quarante bâtiments dix fois par seconde pour une ligne que
personne ne voit.

### 5.5 — `direLaDuree` est exportée, et son arrondi est un argument

Un **manque** s'arrondit vers le haut — annoncer moins que ce qui manque ferait
cliquer sur un refus. Un **stock** s'arrondit vers le bas — annoncer « 5 min » de
réserve pour 4 min 10 s ferait tenter une réparation que le moteur refuserait.
C'est le §7.3 du lot RÉSERVE-BASE, pris du côté du temps.

**Le défaut reste `Math.ceil`**, et les quatre messages de refus qui l'appellent
déjà ne bougent pas d'une lettre. Au-delà de l'heure, la décimale fait l'arrondi
dans les deux sens : un dixième d'heure vaut six minutes, sous la granularité de
toute décision de réparation, et y appliquer `arrondi` donnerait « 11 h » pour
11,9 h.

### 5.6 — Aucune septième barre fixe

`#chantier-reparation` est `flex: 0 0 auto` comme `#chantier-avis`, et `hidden`
par défaut. Le chrome fixe reste à **288 px**, et la garde de `chantier.test.js`
qui énumère les `flex: 0 0 Npx` ne le voit pas — c'est voulu, il n'en est pas une.

---

## 6. La garde du §4 : RETIRÉE, pas rafistolée

`actions — Réparer n'a pas de moteur DANS L'ÉCRAN, et le moteur existe` portait sa
condition de mort en toutes lettres : « **il faudra alors le RETIRER, pas
l'ajuster** ». Elle est retirée, et un commentaire de quinze lignes prend sa place
pour dire pourquoi et où sa propriété est reprise.

⚠ **La falsifiabilité qu'elle servait change de porteur sans se relâcher.** Le
test voisin exigeait de voir « les DEUX formes d'action » dans `ACTIONS` — trois
avec moteur, une sans. Cette division n'existe plus. Ce qu'elle gardait vraiment,
c'est qu'un **TERRAIN** peut n'avoir pas de moteur là où un autre en a : le compte
se fait désormais sur les terrains, **exigé dans les deux sens** (exactement un
qui répare, exactement un qui répond « pas ici »).

---

## 7. Les douze tests, et leur montage effectif

Tous dans `test/chantier.test.js`. **Douze entrent, un est retiré** : le compte
passe de **1 117 à 1 128**.

| # | Verdict | Montage effectif |
|---|---|---|
| T1 | **PASS** | Base niveau 20 à quatre bâtiments, **VRAI `subirUnRaid`** de l'Ouvrage (niveau 20, 900 ticks) — `rase: false`, **quatre bâtiments abîmés**. Écran monté, `#chantier-reparer` cliqué, case du premier abîmé touchée. `degatsMilli` revient à 0, le quartz et la réserve baissent. |
| T2 | **PASS** | Bâtiment intact touché en mode Réparer. Le texte du bandeau est **exactement** `messageDeRefus(problemesDeLaReparationDUnBatiment(etat, 1))`, et ne contient pas « n'existent pas encore ». |
| T3 | **PASS** | Réserve posée à `cout.ticks − 1` — pas zéro, pour que seule la réserve manque. Le refus parle de réserve ; PV, quartz et réserve **inchangés**. |
| T4 | **PASS** | Devis lu dans `detailDuBatiment`, réparation par le geste, quartz débité comparé. Le montage asserte d'abord que `Math.ceil ≠ Math.round` sur le prix brut — voir §8. |
| T5 | **PASS** | Même bâtiment aux niveaux 5 et 30, même part (0,4). Les deux absolus **diffèrent** (asserté), les deux parts valent **400 ‰**. Un intact rend 0 et `devis: null`. |
| T6 | **PASS** | Deux montages : refus sur intact, réussite sur abîmé. Le bouton perd `arme` dans les deux cas, et le montage asserte d'abord qu'il l'AVAIT. |
| T7 | **PASS** | Les trois réservoirs d'armée mis à zéro → la ligne ne bouge **pas**. La réserve des bâtiments mise à zéro → elle bouge. Le plafond affiché est celui de `plafondDeLaReserveDesBatiments`, arrondi vers le bas. |
| T8 | **PASS** | `'messagePasDeReparation' in moteurEcranChantier === false`, et le montage prouve qu'il lit le vrai module. Les deux terrains n'ont plus de `quoi`. |
| T9 | **PASS** | Base mixte, trois payables / deux non — voir le tableau du §5.3. Bilan « 3 réparé(s), 2 hors de portée », **une sauvegarde déclenchée**. |
| T10 | **PASS** | Réserve à sec → « Aucune réparation payable… ». Base intacte → **le message du moteur**, `rien-a-reparer`, mot pour mot. |
| T11 | **PASS** | Barre cachée au repos, montrée le mode armé, remasquée par une autre action et par le désarmement. |
| T12 | **PASS** | Un bâtiment abîmé ET une pièce de garnison abîmée portent `.abimee` ; un intact ne la porte pas ; la feuille peint bien `.jeton.abimee` en `#E43E32`. |

### ⚠⚠ Le faux document, et pourquoi il existe

Asserter `ACTIONS.reparer.agir === reparerUnBatiment` prouve que la **table**
porte la fonction, pas que le chemin d'exécution l'appelle. C'est **exactement le
proxy** qui a laissé la garde du lot RÉSERVE-BASE verte le jour qu'elle devait
signaler. Le brief l'interdit nommément.

Un faux document écrit à la main entre donc dans `test/chantier.test.js`, sur le
modèle de celui de `test/recherche.test.js` (lot RECHERCHE) : **aucune dépendance
n'entre au dépôt**, `esbuild` reste la seule.

⚠ **Il ne sert que les identifiants que `src/index.src.html` déclare vraiment**,
et LÈVE sur tout autre. Il garde donc une seconde chose au passage : que l'écran
ne demande aucun élément que le balisage n'a pas. Un faux qui fabriquerait
n'importe quel identifiant à la demande laisserait passer une faute de frappe sans
un mot.

---

## 8. Les falsifications — treize, sur l'arbre FINAL, une par test

Chacune appliquée seule, le test visé relancé, puis **défaite avant la suivante**.

| # | Falsification | Verdict |
|---|---|---|
| T1 | `ACTIONS.reparer.agir` devient `() => {}` | **TOMBE** |
| T2 | une phrase d'écran remplace `messageDeRefus` | **TOMBE** |
| T3 | l'écran filtre `reserve-insuffisante` avant de refuser | **TOMBE** |
| T4 | le devis est recalculé avec `Math.ceil` | **TOMBE** *(après correction du montage — voir ci-dessous)* |
| T5 | les dégâts sont dits en `degatsMilli` absolu | **TOMBE** |
| T6 | `desarmerLAction()` retiré de la tête d'`executerAction` | **TOMBE** |
| T7 | la ligne lit `reserveReparation.escouade` | **TOMBE** |
| T8 | `messagePasDeReparation` revient à l'export | **TOMBE** |
| T9 | « Tout réparer » passe sous `problemesDeToutReparerLesBatiments` entière | **TOMBE** |
| T10 | le bilan à zéro réparé reste muet | **TOMBE** |
| T11 | `barre.hidden = false` en dur | **TOMBE** |
| T12 | `.abimee` n'est plus posée | **TOMBE** |
| SON | `reparation` sonne `building_player_repair_loop` | **TOMBE (3 tests)** |

### ⚠⚠ La falsification de T4 n'a PAS mordu au premier relevé

**Mesuré, pas supposé : 1 pass / 0 fail** sur le code fautif.

Le montage abîmait le bâtiment de **37 %**. À cette part, le prix brut vaut
**19 679,737** : `Math.round` et `Math.ceil` rendent **tous deux 19 680**. La
falsification ne changeait donc rien.

| part | prix brut | `round` | `ceil` |
|---:|---:|---:|---:|
| 0,31 | 16 488,428 | 16 488 | 16 489 |
| **0,37** | **19 679,737** | **19 680** | **19 680** |
| **0,50** | **26 594,239** | **26 594** | **26 595** |
| 0,63 | 33 508,741 | 33 509 | 33 509 |
| 0,77 | 40 955,128 | 40 955 | 40 956 |

C'est **« un montage qui tombe rond ne mesure pas un arrondi »**, troisième fois
du dépôt. Le montage passe à 0,5, et une assertion **écrite après la mesure**
exige que les deux arrondis DIFFÈRENT avant de comparer quoi que ce soit.

---

## 9. Ce qui a été retiré — les quatre du §9.5 du brief

| | Sort |
|---|---|
| la garde du §4 | **retirée**, remplacée par un commentaire qui dit pourquoi |
| `messagePasDeReparation` | **retirée** |
| son test | **retiré** avec la garde qui le portait |
| la branche `problemes === undefined` | **retirée** |

**Aucun des quatre ne survit.** Deux retraits de plus, non demandés et déclarés :
le champ `quoi` des deux terrains (plus aucun lecteur) et l'import de
`messagePasDeReparation` dans `src/ui/offense.js`.

---

## 10. Relevé dans Chromium — géométrie du S25 FE

1080 × 2340 physiques, DPR 3, soit **360 × 780 CSS**. `dist/index.html` chargé en
`file://`. Sept captures dans `rapports/`.

### Partie neuve

| | mesuré |
|---|---|
| `#chantier-reparation` au repos | **caché**, 0 × 0 px |
| barre en mode Réparer | **360 × 22 px**, à y = 536 |
| `#chantier-champ` | **492 px → 426 px** pendant le mode |
| débordement horizontal | **0 px** |
| ligne de réserve | `Réserve : 2 s / 13.0 h · base intacte` |
| toucher un bâtiment intact | `Ce bâtiment est intact.` — **le message du moteur** |
| mode après le refus | **désarmé**, barre remasquée |
| erreurs de page | **0** |

### Partie abîmée par un VRAI raid de l'Ouvrage

Une sauvegarde forgée hors ligne — `subirUnRaid` niveau 20, `rase: false`, quatre
bâtiments abîmés — déposée dans `foyer-zero/partie/1` avant le chargement.

| geste | mesuré |
|---|---|
| au chargement | **4 jetons `.abimee`**, bandeau : `Niv. 20 · 28 % de dégâts · réparer : 2 185 q · 2 min` |
| mode Réparer armé | `Réserve : 32.0 h / 32.0 h · 4 à réparer : 14 879 q · 13 min` |
| un toucher sur un abîmé | **4 → 3 jetons marqués**, bandeau retombé à `Niv. 20` |
| « Tout réparer » | **3 → 0 jetons marqués**, avis : `3 bâtiment(s) réparé(s) pour 9 109 de quartz.` |
| débordement horizontal | **0 px** à chaque étape |
| erreurs de page | **0** |

⚠ **Un défaut de MONTAGE a été trouvé là, et il n'est pas dans le lot.** La
première sauvegarde forgée poussait `{}` comme résidu des bâtiments ajoutés à la
main. Au premier tick, `NaN` : l'écran est tombé sur *« formaterEntier : « NaN »
n'est pas un nombre fini »*. Le résidu est **par (bâtiment, RESSOURCE)** et
`poserEffectif` écrit les trois clés à zéro. Le même raccourci est écrit dans
`test/reparation.test.js` depuis le lot RÉSERVE-BASE, où il est **inoffensif** —
ces tests-là ne font pas tourner l'économie. Le montage de ce lot-ci écrit la
bonne forme, et le commentaire dit pourquoi.

---

## 11. L'arbitrage du §5, inscrit

**Un raid subi ne vide pas la réserve des bâtiments. Ethan, 05/09/2026.**

Le commentaire de `src/sim/raid-ouvrage.js` portait une omission « délibérée mais
non arbitrée » ; il porte désormais **la décision, son auteur et sa date**. Le
motif ne change pas : vider les quatre réservoirs rendrait le cliquet
**incassable** — le raid qui abîme emporterait du même geste le temps qu'il faut
pour relever.

⚠ `MODELE-ECONOMIQUE.md` §7 est du 24/08 et ne connaît qu'UN réservoir : c'est
celui de l'armée, et il se vide bien. Il ne dit donc pas le contraire.

---

## 12. Un défaut introduit puis corrigé, et il faut le dire

`desarmerLAction` entre pour factoriser trois lignes recopiées **quatre fois**
— l'état, le mot, les boutons — que ce lot allait recopier une cinquième.

⚠⚠ **La première écriture s'est appelée elle-même.** Le remplacement textuel du
triple a aussi frappé le CORPS de la fonction qui le remplaçait :
`function desarmerLAction() { desarmerLAction(); }`. Résultat : *Maximum call
stack size exceeded* sur six tests. **Ce sont les tests neufs qui l'ont attrapé,
pas la relecture** — et c'est précisément ce qu'on leur demande : sans le faux
document, l'écran n'aurait jamais été exécuté et la suite serait restée verte sur
un écran qui ne désarme plus rien.

Cinq sites d'appel désormais, un seul corps.

---

## 13. Le cliquet, et à quelles conditions

**Le cliquet est refermé pour le joueur.** Un bâtiment ramené à 1 PV par un raid
se répare depuis l'écran de la base, bâtiment par bâtiment ou d'un geste, et
l'écran dit d'avance ce que ça coûte.

**Les deux conditions**, refusées séparément et chiffrées par le moteur :

1. **la réserve des bâtiments** — 12 h plus 1 h par niveau moyen de bâtiments,
   qu'un raid subi **ne vide pas** ;
2. **le quartz** — le prix du niveau atteint divisé par 230, au prorata des PV
   perdus.

⚠ **Et il reste raide quand le Chantier décroche**, ce que le lot précédent avait
mesuré : base pleine à 1 PV, Chantier 50 → 12,7 h à réparer pour 62,0 h de
plafond ; Chantier 20 → **369,2 h pour 61,3**. Ce lot ne touche à aucun de ces
nombres.

---

## 14. Écarts par rapport au brief

1. **§0.3, fait n° 4** — `TERRAINS.batiments.actions.reparer` n'était pas absent :
   `actions` vaut `ACTIONS` telle quelle. C'est `action.problemes` qui valait
   `undefined`. Même correction, énoncé différent. §3 ci-dessus.
2. **§2.3 — `src/ui/offense.js` importait aussi la fonction retirée.** Le brief ne
   le mentionne pas ; le build est tombé. `REPARATION_AILLEURS` la remplace. §4.4.
3. **§3.4 — le précédent invoqué n'existe pas.** « comme l'écran d'armée montre
   ses trois réservoirs » : `reservoirsDeLArmee` n'a aucun appelant dans
   `src/ui/`. La forme retenue est déclarée sobre plutôt que reprise. §5.4.
4. **§6 — douze tests au lieu de onze.** Le brief en demande onze et son tableau
   en liste onze ; `T12` (l'avarie visible sur la grille) répond au §3.2, qui
   n'avait pas de ligne dans le tableau. Il entre plutôt que de rester non gardé.
5. **`direLaDuree` est exportée**, ce que le brief ne demandait pas. Sans elle,
   l'écran aurait écrit son propre formatage de durée et la même quantité se
   serait lue de deux façons sur la même ligne. §5.5.
6. **Un helper `desarmerLAction` entre.** Non demandé ; il évite une cinquième
   copie du même triple. §12.

---

## 15. Hors lot, et nommé

- **Le Complexe de défense** — toujours absent de `src/sim/`, formule de
  dépassement ouverte (`MODELE-REPARATION-1.md` §6 point 6).
- **Le calibrage du plafond de la quatrième réserve** — posé pour être joué et
  changé.
- **La troisième courbe de `MODELE-ECONOMIQUE.md` §2**, l'anomalie du Collecteur,
  la marche de ×1,794.
- **`reservoirsDeLArmee` reste sans appelant** : l'écran de raid ne montre pas les
  trois réservoirs de l'armée. Ce lot ne l'y ajoute pas — il ferait la même chose
  sur un autre écran, et Ethan ne l'a pas demandé.
- **Le résidu `{}` de `test/reparation.test.js`** — inoffensif là où il est, et
  non corrigé : le toucher serait modifier un montage qui ne ment pas.

---

## 16. `tools/verifier.py`

**NON LANCÉ, ET C'ÉTAIT CONFORME.** Le lot ne touche ni `art/`, ni `tools/` — pas
un octet d'`art/sprites/` ne change. Les sept captures vivent dans `rapports/`,
hors de la chaîne.
