# Rapport — lot MODULES-D

**Livré en `0.54.0` · build `55`.** Quatre modules câblés — PV +20 %, Rayon +1,
Rayon minimum −1, Auto-réparation — et le démêlage du champ qui les rendait
impossibles à lire.

---

## 1. La ligne de base, mesurée

**MODULES-C ÉTAIT DÉJÀ SUR `main`.** `origin/main` valait **`41dfdac`**, le
merge du lot C. Le numéro suivant était donc libre : `0.53.0` · 54 sur `main`,
`0.54.0` · 55 ici. Aucune autre branche distante n'existe.

Mesuré sur un `git archive origin/main` frais (`/tmp/base-d`, `npm ci`) :

| | avant | après |
|---|---|---|
| `npm test` | **692 pass / 0 fail** | **706 pass / 0 fail** |
| `dist/index.html` | **1 262 193 o** | **1 262 870 o** |
| version · build | 0.53.0 · 54 | **0.54.0 · 55** |
| `SAVE_VERSION` | 14 | **14, inchangé** |
| marge sur la borne T10 (1 300 000) | 37 807 o · 2,91 % | **37 130 o · 2,86 %** |
| `audit-maquette.mjs` | rc 1, **7 écarts** | rc 1, **7 écarts** |

**Delta : +677 octets**, pour une enveloppe de 3 000. **Il reste 2 323 octets.**
Aucun champ de sauvegarde ajouté ou modifié, `SAVE_VERSION` non touché — les
quatre modules sont de la donnée de table et du calcul au montage.

**14 tests écrits**, tous verts, aucun test existant supprimé ni assoupli.

---

## 2. L'audit maquette, écart par écart

**IL ÉTAIT DÉJÀ ROUGE, ET IL L'EST RESTÉ À L'IDENTIQUE.** La sortie complète de
`node tools/audit-maquette.mjs` est **byte-identique** avant et après le lot
(`diff` vide, vérifié). Les sept écarts :

| # | écart | ce lot y touche ? |
|---|---|---|
| 1 | terrain de la maquette | non |
| 2 | disposition légale | non |
| 3 | emplacements 11 / 12 | non |
| 4 | débit quartz : +732/h | non |
| 5 | débit scorie : +0/h | non |
| 6 | débit electricite : +684/h | non |
| 7 | raffinerie : +176 quartz +352 scorie / h | non |

Aucun n'est de ce lot : ils portent tous sur l'économie et la disposition de la
maquette, que MODULES-D ne lit ni n'écrit. Le porter à 6 ou à 8 sans lot dédié
serait une régression, dans les deux sens.

---

## 3. Le champ qui mentait — et ce que le démêlage seul a fait

`profilUnite` posait `moduleDefense: u.defense.module` (le module de garnison
**chez le joueur**) ; `profilDefense` posait `moduleDefense: d.moduleOuvrage`
(celui **de l'Ouvrage**). Un seul nom, deux grandeurs. Il est scindé en
`moduleDefenseJoueur` / `moduleDefenseOuvrage`, et **une seule fonction**,
`moduleDeDefense(e, p)`, choisit sur `e.proprietaire`.

**L'ancien nom a disparu, il n'est pas resté en alias.** `MODULES-D T1` balaie
les quatre dossiers de `src/` avec un motif **borné à droite**
(`/moduleDefense(?![\p{L}\p{N}_])/u`) : les deux noms neufs COMMENCENT par
l'ancien, et un `includes('moduleDefense')` nu ne pourrait jamais tomber.

### 3.1 Le résultat des étapes 1 et 2 prises seules

**AUCUN TEST EXISTANT N'EST TOMBÉ**, ni à l'étape 1 (le démêlage), ni à
l'étape 2 (la portée portée sur l'entité). C'est un fait mesuré, pas un
soulagement : avant qu'un module défensif ne soit câblé, `moduleDeDefense`
n'avait qu'**un seul lecteur observable**, la ligne de résultat, et les six —
en fait **sept** — modules déjà câblés sont tous des modules d'OFFENSE, que le
changement ne touche pas.

Le seul effet textuel de l'étape 2 : `porteeCarree` et `porteeMiniCarree`
entrent dans l'entité, donc dans `serialiserEtat`. Le reste de l'état est
byte-identique. C'est exactement ce que `bouclierMilli` avait fait au lot C.

### 3.2 La mesure de T4, au point près

Le brief exigeait de **mesurer** que les points de recherche ne bougent pas, pas
de le supposer. **24 points de référence** — 15 raids réels sur graines
distinctes, 9 combats de base — **identiques au point**, avant et après.

**Et le mensonge, lui, se voit — mesuré sur une base réelle.** Le relevé publie
aussi, pour chaque combat, le module que chaque défenseur DÉCLARE. Sur la base
`g2026 @261,31 n8` :

```
AVANT   meute=flashbang ×6, perceurs=tirDeBarrage ×3
APRÈS   meute=null      ×6, perceurs=null         ×3
```

Ces neuf pièces défendent une base **de l'OUVRAGE**. Avant le lot, elles
déclaraient le module qu'elles emploient en garnison **chez le JOUEUR** — c'est
exactement le champ qui mentait. Après, elles déclarent le leur, qui est nul.
Même bascule sur une Carapace : `emp` (son module de garnison joueur) devient
`camouflage` (son `moduleOuvrage`).

La contre-épreuve rend la mesure falsifiable — l'écart EXISTERAIT si
`modulesDebloques.ouvrage` était armé. Sur cette même base :

| `modulesDebloques.ouvrage` | points AVANT | points APRÈS |
|---|---|---|
| `[]` | 313 171 | 313 171 |
| `['flashbang']` | **345 721** | **313 171** |
| `['tirDeBarrage']` | **343 255** | **313 171** |
| `['pvPlusVingt']` | 313 171 | 313 171 |

Avant le lot, un module d'OFFENSE débloqué côté Ouvrage majorait les points
d'une garnison qui ne le porte pas. Après, seul le module que la pièce porte
réellement en garnison compte.

**Le canal du jeu, lui, est vide** : `sim/generateur.js` ne remplit jamais
`modulesDebloques.ouvrage`. L'effet mesurable en jeu est donc nul, aujourd'hui —
et c'est pourquoi les 24 points ne bougent pas.

⚠ **Relevé une seconde fois sur l'arbre FINAL**, pas seulement après l'étape 1 :
les 24 lignes de mesure sont identiques au point après les six étapes.

---

## 4. Les quatorze tests, et le montage qui les ferait tomber

Chaque garde a été **falsifiée pour de vrai** : la source est sabotée, la suite
relancée, la source restaurée depuis un instantané `/tmp` (jamais depuis git).

| test | résultat | le montage qui le fait tomber (**exécuté**) |
|---|---|---|
| **T1** — `moduleDefense` a disparu | ✅ | **E** : rendre l'un des deux noms neufs à l'ancien → T1 **et** T2 |
| **T2** — le module suit le PROPRIÉTAIRE | ✅ | **A** : inverser les deux branches de `moduleDeDefense` → T2, T4 · **D** : la ligne de résultat relit `p.moduleDefenseOuvrage` → T2, T4 |
| **T3** — les modules déjà câblés tirent toujours | ✅ | **C** : lire le module de défense des deux côtés → T3 · **W** : câbler `pvPlusVingt` en offense → T3 (le Broyeur attaquant change de PV) |
| **T4** — les points ne bougent pas | ✅ | A et D ci-dessus, sur le montage à `ouvrage` armé |
| **T5** — les quatre lecteurs lisent l'entité | ✅ | **H** : `ciblage` relit `p.porteeCarree` · **I** : `tir` relit `p.` — les deux tombent sur des assertions **différentes** de T5 |
| **T6** — 2 500 → 3 500 milli, puis au carré | ✅ | **F** : `porteeCarree + 1` au lieu de `porteeMilli + 1000` · **K** : ne pas appliquer `rayonPlusUn` |
| **T7** — une cible devient touchable | ✅ | **J** : ne pas appliquer `rayonMiniMoinsUn` — et le test montre **le tir**, pas seulement le nombre |
| **T8** — plancher à zéro | ✅ | **G** : retirer le `Math.max(0, …)` |
| **T9** — PV +20 % sur pièce pleine | ✅ | **L** : ne pas appliquer le module → T9, T10 et `combat.test.js` T13 |
| **T10** — pièce entamée : seul le plafond monte | ✅ | **M** : majorer aussi les PV courants · **N** : ne jamais les majorer |
| **T11** — 20 % des dégâts, à qui y a droit | ✅ | **P** : ne pas appeler la suite · **Q** : retirer `moduleEstAcquis` (la Ronce) · **R** : retirer `nomDuModule` (la Faucheuse) · **T** : `Math.ceil` · **U** : 25 % au lieu de 20 % |
| **T12** — l'armée n'est pas touchée | ✅ | **S** : parcourir `[...garnison, ...armee]` → T12 seul · P, T, U aussi |
| **T13** — `cable` par branche | ✅ | **V** : `defense: false` sur Rayon +1 → cinq tests · **W** : `offense: true` sur PV +20 % → trois |
| **T14** — déterminisme | ✅ | **X2** : bonus dépendant du nombre d'entités déjà insérées · **Y** : retirer la portée de la projection canonique |

**Une garde n'a pas mordu, et je le dis.** Le sabotage **O** — deux `Math.floor`
au lieu d'un sur PV +20 % — **ne fait tomber aucun test**, parce que les quatre
porteurs du module ont tous `pv ∈ {1000, 1500, 2000}` et que `pv × facteurMilli`
est **toujours un multiple de 100** : les deux formes coïncident sur toutes les
données existantes. T9 porte donc en plus une **garde de source** (un seul
`Math.floor`) et le montage exact qui la ferait diverger : une pièce à 550 PV au
niveau 4 rendrait **878 460** contre 878 400. La règle est écrite, elle n'est pas
observable — c'est la vérité, pas une omission.

**Un sabotage est tombé à côté, et c'est instructif.** Le sabotage **B** —
remettre l'ancienne règle « le module de défense est celui de l'Ouvrage » — ne
faisait tomber **aucun test à l'étape 1**, et fait tomber T5, T6 et T7 après
l'étape 3. Le discriminant de camp ne devient mesurable qu'une fois un module
défensif câblé : avant, il n'y avait rien à observer.

---

## 5. L'auto-réparation, en toutes lettres

**ELLE EST ÉCRITE, TESTÉE, ET INATTEIGNABLE EN JEU.**

`grep -rn "degatsMilli" src/` donne exactement deux écrivains :
`sim/raid.js` (`reporterLesDegats`) et `sim/reparation.js`
(`avancerLaReparation`). **Tous deux parcourent `etat.armee`.** Rien, nulle part,
n'écrit `degatsMilli` sur `etat.garnison` — parce que la base du joueur n'est
jamais attaquée. Une pièce de garnison est donc toujours à zéro, et la boucle
sort au premier `continue`.

Le test tourne sur un **état forgé** — un état que le jeu ne sait pas produire.
Mesuré, garnison à 1 009 milli-PV de dégâts, après un raid réel :

```
merlon     autoReparation, module acquis   1009 → 808   (floor(1009×20/100) = 201)
ronce      autoReparation, NON acquis      1009 → 1009
faucheuse  rayonMiniMoinsUn, acquis        1009 → 1009
casemate   autoReparation, acquis, intacte    0 → 0
armee                                      0, 464 244, 0, 0, 0, 699 000  (intacte)
```

Elle deviendra visible le jour où les attaques sur la base du joueur existeront
— le chantier suivant, décidé. **Je n'ai pas ouvert de chemin pour la rendre
atteignable** : le brief l'interdit explicitement.

**Un ajout que je n'ai PAS fait, et pourquoi** : la suite ne renvoie rien dans
le rapport de raid. Un champ que personne ne peut voir aurait coûté des octets
pour rien ; `reparerLaGarnison` rend son total, l'appelant l'ignore. La ligne est
prête le jour où l'écran en aura besoin.

---

## 6. Les lignes qui s'ouvrent — comptées, pas devinées

**ONZE lignes s'ouvrent, toutes en défense, AUCUNE en offense.** Compté en
parcourant `ARBRE_RECHERCHE`, jamais de tête — c'est la leçon de MODULES-B, dont
le brief annonçait six lignes là où il y en avait cinq.

| module | lignes |
|---|---|
| Auto-réparation | merlon, ronce, herse, casemate, creneau, batterie — **6** |
| Rayon minimum −1 | faucheuse, mortier, harpon — **3** |
| Rayon +1 | guetteur — **1** |
| PV +20 % | broyeur — **1** |

Le total de lignes câblées passe de **12 à 23** ; les lignes non câblées de
**19 à 8**. Quatre tests de garde antérieurs (T11, MODULES-A T9, MODULES-B T13,
MODULES-C T10) sont tombés sur ces comptes et ont été **mis à jour, pas
assouplis** — c'est leur rôle : le compte EST la liste.

### 6.1 L'écran, rendu et cliqué

Banc Chromium, 360×740, dpr 2, sur le `dist/index.html` du lot :

- panneau **défense** : 17 lignes de module, **11 achetables**, 6 encore sans effet ;
- panneau **offense** : 14 lignes, 3 achetables — **aucune des quatre** ;
- **achat réel de Rayon +1** (Guetteur) : deux touchers, « Confirmer ? » puis
  « Acquis », **1 100 000 000 points débités**, exactement le prix affiché ;
- **achat réel d'Auto-réparation** (Merlon) : **1 200 000 points débités** ;
- **le Guetteur, le cas qui a imposé la forme par branche** : sa ligne d'offense
  vend le **Camouflage** (1 200 000 000) et sa ligne de défense **Rayon +1**
  (1 100 000 000) — les deux achetées sur le même état, indépendamment ;
- **contre-épreuve** : la Garnison, encore non câblée, refuse toujours avec
  « Garnison n'a pas encore d'effet en jeu ».

Une seule erreur console, un **404 pré-existant** (ressource absente du serveur
statique du banc) : mesuré identique sur le build 54 non patché.

`src/ui/recherche.js` n'a pas été touché. Captures : `d-defense.png`,
`d-defense-achat.png`, `d-offense.png`.

### 6.2 Le combat de défense, au banc

Une garnison **du joueur** attaquée (`proprietaireDefense: 'joueur'`), avec et
sans les trois modules — les trois ont mesurablement joué :

| pièce | grandeur | sans | avec |
|---|---|---|---|
| broyeur | `pvMaxMilli` | 12 232 000 | **14 678 400** (×1,2 exact) |
| guetteur | `porteeCarree` | 6 250 000 (2 500²) | **12 250 000** (3 500²) |
| faucheuse, mortier | `porteeMiniCarree` | 12 250 000 (3 500²) | **6 250 000** (2 500²) |

Quatre défenseurs sur cinq ont visé ; le combat s'achève au tick 105.

**Ce sont des preuves d'EXISTENCE, pas des rendements.** Je ne compare aucun
butin, je ne conclus rien sur la valeur des quatre modules et je ne propose
aucun barème.

---

## 7. Écarts au brief, et leurs raisons

1. **« `ciblage` compte deux lecteurs de portée » — il en a UN.** Le bloc
   « cible conservée » ne lit aucune portée. En revanche il y a **QUATRE**
   lecteurs au total, pas trois : `ensembleCamoufles`, `ciblage`,
   `cibleDeNeutralisation`, `tir`, plus `peutTirer`. Les quatre sont portés sur
   l'entité, et T5 les tient un par un.
2. **« les six modules déjà câblés » — il y en a SEPT** : booster, bouclier,
   camouflage, ecraseur, emp, flashbang, tirDeBarrage. T3 les couvre tous.
3. **Le sabotage B ne tombe pas à l'étape 1** (§3.1 et §4), et le sabotage O ne
   tombe nulle part (§4). Les deux sont rapportés plutôt que masqués.
4. **`combat.test.js` T13 a dû être réécrit**, pas assoupli. Il infligeait des
   dégâts ABSOLUS à un Merlon dont le plafond monte désormais de 2 420 000 à
   2 904 000 : la même valeur absolue est devenue une fraction plus petite. Il
   inflige maintenant la même **fraction** et fige en plus les deux nouveaux
   faits (1 585 n à dégâts égaux, 3 804 n à destruction complète). Ce n'est pas
   une régression : le module fait enfin ce qu'il annonce.
5. **Le rapport de raid ne porte pas le total réparé** (§5), délibérément.

---

## 8. Ce qui reste ouvert

- **Une fuite pré-existante entre branches, trouvée en mesurant, NON corrigée.**
  `modulesDebloquesDuJoueur` fait l'**union** des deux branches, et quatre noms
  de modules existent des deux côtés : `flashbang`, `tirDeBarrage`, `emp`,
  `garnison`. Acheter le module **défense** des Perceurs (Tir de barrage)
  débloque donc `tirDeBarrage` pour le **Pilon en offense**, sans l'avoir payé ;
  acheter celui de la Carapace ou du Fendeur (EMP) le débloque pour la Crécelle.
  Le commentaire de la fonction annonce ce jour-là depuis MODULES-A (« le jour
  où un module câblé existera des deux côtés, il faudra choisir la branche selon
  le camp du montage ») — **ce jour est arrivé avant ce lot, pas avec lui** :
  aucun des quatre modules de MODULES-D ne collisionne. Hors périmètre, à
  traiter dans un lot dédié.
- **Le module `garnison` reste en attente d'arbitrage** (Ethan veut un
  glisser-déposer à la préparation de raid — un lot d'interface).
- **`munitionSpeciale` et `volDeVie`** restent les deux seuls modules sans lot.
- **Les attaques sur la base du joueur** : le chantier qui rendra ces quatre
  modules visibles.
- **La marge se resserre** : 4,4 % · 3,1 % · 3,05 % · 2,94 % · 2,91 % · **2,86 %**.
  Elle ne descend plus que de quelques centièmes tant que les lots sont du code ;
  c'est le prochain atlas qui la fera tomber, et il faudra rouvrir la borne, pas
  la contourner.
