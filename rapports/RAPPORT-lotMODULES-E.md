# Rapport — lot MODULES-E

**Version livrée : `0.55.0` · build `56`.** `SAVE_VERSION` reste à **14** :
aucun champ de sauvegarde n'est touché, `modulesDebloques` n'est pas persisté —
il est reconstruit à chaque montage depuis `etat.recherche.modules`.

Aucun module nouveau. Ce lot ferme une fuite de structure : un module acheté
dans une branche servait dans les deux.

---

## 1. Comptes, avant et après

| | avant (`origin/main` = `8e80125`) | après |
|---|---|---|
| `npm test` | **706 pass / 0 fail** | **714 pass / 0 fail** |
| `dist/index.html` | **1 262 870 o** | **1 263 578 o** |
| delta | — | **+708 o** (enveloppe du brief : 1 500) |
| marge sur la borne T10 (1 300 000) | 37 130 o · 2,86 % | **36 422 o · 2,80 %** |
| `version` · `config.build` | 0.54.0 · 55 | **0.55.0 · 56** |
| `SAVE_VERSION` | 14 | **14** |
| `node tools/audit-maquette.mjs` | rouge, 7 écarts, rc=1 | **rouge, 7 écarts, rc=1** |

Le code source pèse **+3 407 octets** (`combat.js` +3 187, `recherche.js` +117,
`generateur.js` +69, `raid.js` +34) ; le bâti n'en retient que **708**, les
commentaires étant retirés à la construction. Les commentaires sont donc
gratuits sur l'enveloppe, et c'est là qu'est passé l'essentiel du lot.

### L'audit, écart par écart

Sortie comparée **ligne à ligne** entre un `git archive origin/main` fraîchement
extrait et l'arbre livré : **identique**, aucune ligne ne change de camp.

| écart | avant | après |
|---|---|---|
| terrain identique à `champsDeLaBase(275, 16)` | KO | KO |
| disposition légale | KO | KO |
| emplacements 11 / 12 | KO | KO |
| débit quartz : +732/h | KO | KO |
| débit scorie : +0/h | KO | KO |
| débit electricite : +684/h | KO | KO |
| raffinerie : +176 quartz +352 scorie / h | KO | KO |

Les 20 autres lignes de l'audit sont `ok` avant comme après. **L'audit était
déjà rouge et ce n'est pas ce lot** : le porter à 6 ou à 8 sans lot dédié serait
une régression, dans les deux sens.

---

## 2. Tous les sites de `modulesDebloques`, et ce qui a été fait de chacun

Balayage `grep -rn modulesDebloques` sur **tout le dépôt**, `test/` compris,
avant d'écrire une ligne.

### Producteurs — `src/`

| site | avant | après |
|---|---|---|
| `sim/combat.js:712-714` — recopie défensive de `creerCombat` | recopiait les deux tableaux | **valide et recopie** par `modulesDunProprietaire`, LÈVE sur une liste plate |
| `sim/generateur.js:449` — `genererSite` | `{ ouvrage: [], joueur: [] }` | `{ ouvrage: { offense: [], defense: [] }, joueur: { … } }` |
| `sim/raid.js:256-258` — montage du raid | `ouvrage: … ?? []` | `ouvrage: … ?? { offense: [], defense: [] }` |
| `sim/recherche.js:207` — `modulesDebloquesDuJoueur` | **union** des deux branches, un tableau plat | un objet `{ offense, defense }`, **plus d'union** |

Le commentaire de `modulesDebloquesDuJoueur` annonçait « L'UNION DES DEUX
BRANCHES EST VOULUE » et le jour où il faudrait la défaire. Il est remplacé, pas
laissé : ce jour est arrivé.

### Lecteurs — `src/`

| site | avant | après |
|---|---|---|
| `sim/combat.js:1517` — `moduleActif` | `[e.proprietaire]` puis `.includes` | `[e.proprietaire]?.[BRANCHE_DU_CAMP[e.camp]]` |
| `sim/combat.js:2025` — `pointsRecherche` | `modulesDebloques.ouvrage`, propriétaire **en dur** | `[montage.proprietaireDefense ?? 'ouvrage']?.defense` |

### `ui/banc.js` — **écart au brief**

Le §2.6 le nomme parmi les appelants à migrer. **Il ne produit pas la clé** :
`montageDefense` passe par `genererSite`, qui la fournit déjà. Aucune ligne n'y
a été touchée, et c'est vérifiable — `grep modulesDebloques src/ui/banc.js` ne
rend rien.

### Tests — 77 lignes dans 10 fichiers

`combat` 23 · `recherche` 31 · `repli` 7 · `cible` 5 · `generateur` 5 · `rendu`
2 · `arsenal` / `defense` / `roster` / `sprite` 1 chacun. Toutes migrées.
Les 45 littéraux entièrement vides ont pris la forme nue ; les ~30 autres ont
été classés **un par un**, selon le camp du porteur dans leur montage :

- porteur qui **attaque** → `joueur.offense` (`booster`, `bouclier`,
  `camouflage`, `ecraseur`, et les quatre noms en collision) ;
- porteur qui **défend** → branche `defense` du propriétaire concerné
  (`pvPlusVingt`, `autoReparation`, `rayonPlusUn`, `rayonMiniMoinsUn`,
  `munitionSpeciale`) ;
- les listes de l'Ouvrage lues par `pointsRecherche` → `ouvrage.defense`,
  puisque l'Ouvrage y défend.

⚠ **Un test a changé d'assertion, et c'est un renversement voulu** : `T11`
assertait `modulesDebloquesDuJoueur(cable)` égal à `['ecraseur']`. Il asserte
désormais `{ offense: ['ecraseur'], defense: [] }`. Sous l'union, les deux listes
auraient porté le même nom — l'assertion nouvelle est **strictement plus forte**.

### Absent : toujours permis

Onze montages de `combat.test.js`, les cinq d'`assaut` et les cinq de
`site-entame` n'ont **pas** la clé. Seule une valeur **présente et plate** lève ;
`undefined` reste accepté et rend `{ offense: [], defense: [] }`. Les leur
imposer serait un autre lot, et `MODULES-E T5` gèle les deux comportements.

---

## 3. La table des collisions, établie par balayage

Relevée en parcourant `ARBRE_RECHERCHE` et `data/combat.js`, **pas recopiée du
brief** — et `MODULES-E T2` la reconstruit à chaque exécution, de sorte qu'un
cinquième nom porté des deux côtés ferait tomber la suite.

| nom | lignes offense | lignes défense | câblé off. | câblé déf. | collision |
|---|---|---|---|---|---|
| `flashbang` | meute, belier | meute, belier | oui | non | **OUI** |
| `garnison` | ratisseur, busard | ratisseur | non | non | **OUI** |
| `tirDeBarrage` | perceurs, pilon | perceurs | oui | non | **OUI** |
| `emp` | crecelle | fendeur, carapace | oui | non | **OUI** |
| `ecraseur` | fendeur, broyeur | — | oui | — | non |
| `camouflage` | frappeur, guetteur | — | oui | — | non |
| `booster` | carapace, fouisseurs | — | oui | — | non |
| `bouclier` | enclume | — | oui | — | non |
| `autoReparation` | — | merlon, casemate, herse, creneau, ronce, batterie | — | oui | non |
| `rayonPlusUn` | — | guetteur | — | oui | non |
| `rayonMiniMoinsUn` | — | faucheuse, mortier, harpon | — | oui | non |
| `pvPlusVingt` | — | broyeur | — | oui | non |

**Écart à la table du brief : aucun sur l'ensemble.** Les quatre collisions sont
les quatre annoncées. Un seul détail diffère, sans conséquence : le brief liste
les porteurs défensifs d'`emp` dans un autre ordre.

Les prix cités par le brief sont exacts : Perceurs défense/module 200 000 000,
Pilon offense/module 1 000 000 000.

### ⚠ LA PRÉMISSE DU BRIEF NE TIENT PAS, ET MON PROPRE RAPPORT MODULES-D LA REPRENAIT

Le brief pose : « acheter le module **défense** des Perceurs (200 M) débloque
`tirDeBarrage` pour l'**Obusier en offense** (1 G) ». **Cet achat lève** :

```
Error: recherche : achat impossible — Tir de barrage n'a pas d'effet en défense
```

`cable.tirDeBarrage.defense` vaut `false` depuis MODULES-A, donc
`problemesDeLAchat` rend `effetNonCable` avant tout débit. Les quatre noms en
collision sont câblés **en offense seulement** (`garnison` sur aucune branche) :
la fuite ne pouvait partir que de l'offense. **Le rapport MODULES-D annonçait le
même sens que le brief ; il avait tort, et cette ligne le corrige.**

Sens réellement atteignables par la boutique, mesurés :

| achat | prix | ce qu'il ouvrait en garnison |
|---|---|---|
| Meute, offense | 10 000 000 | `flashbang` sur Meute et Bélier |
| Perceurs, offense | 24 000 000 | `tirDeBarrage` sur Perceurs — dont la ligne défensive coûte 200 M |
| Crécelle, offense | 150 000 000 | `emp` sur Fendeur et Carapace |
| `garnison` | — | inatteignable : câblé nulle part |

### ⚠ ET LA FUITE N'AVAIT AUCUN EFFET OBSERVABLE EN COMBAT

Les dix appels à `moduleActif` ont été relevés avec leur garde de camp :

- gardés `camp === 'attaque'` : `ensembleCamoufles`, `declencherNeutralisations`,
  `declencherBoosters`, `structureForcee` ;
- sans garde : les quatre appels de montage, `tirDeBarrage` (l. 1241) et
  `masseEffective`.

`flashbang` et `emp` ne sont lus que par `declencherNeutralisations` : un porteur
**en garnison** ne les consulte jamais. `tirDeBarrage` est bien consulté en
défense, mais son éclaboussure ne vise que les genres `defense` et `batiment` —
un défenseur tire sur des assaillants, donc rien n'éclabousse (c'est `MODULES-A
T4` qui gèle cette propriété). Contre-épreuve : un combat de défense joué
250 ticks, garnison Perceurs, `joueur: []` contre `joueur: ['tirDeBarrage']` →
entités identiques, PV identiques, `modulesActifs` vides des deux côtés ; le seul
écart de `serialiserEtat` est `modulesDebloques` lui-même, c'est-à-dire l'entrée.

**Ce lot est structurel et préventif, pas un correctif d'équilibrage.** Il ferme
la porte avant qu'un drapeau `cable` bascule côté défense ou qu'un chemin
défensif s'ouvre à `flashbang` ou à l'EMP. Le vendre autrement serait se vanter
d'un effet nul.

---

## 4. Les huit tests — résultat, et le montage qui les ferait tomber

Un test qui asserte le champ que le patch vient d'écrire ne peut pas échouer.
Chaque garde a donc été **sabotée pour de vrai**, sources restaurées depuis une
copie `/tmp` (jamais `git checkout` : la leçon de MODULES-D).

| # | test | résultat | le montage qui le fait tomber | vérifié |
|---|---|---|---|---|
| T1 | la fuite est fermée dans les DEUX sens | pass | **S1** — indexer `moduleActif` par `e.camp` au lieu de `BRANCHE_DU_CAMP` ; **S2** — rétablir l'union dans `modulesDebloquesDuJoueur` | **tombe sur les deux** |
| T2 | les quatre collisions, une par une | pass | **S2** ; ou un cinquième nom porté des deux côtés de l'arbre | **tombe** |
| T3 | les modules SANS collision ne bougent pas | pass | **S2** ; ou un `?? []` sur la branche lue | **tombe** |
| T4 | la table camp→branche couvre les deux camps | pass | **S1** | **tombe** |
| T5 | l'ancienne forme plate LÈVE, et nomme le propriétaire | pass | **S5** — réparer la forme plate au lieu de la refuser | **tombe** |
| T6 | les points lisent la branche `defense` du bon propriétaire, au point près | pass | **S3** — lire `.offense` ; **S4** — reprendre `'ouvrage'` en dur | **tombe sur les deux** |
| T7 | contre-épreuve : le même nom dans l'AUTRE branche ne rapporte rien | pass | **S3** | **tombe** |
| T8 | le déterminisme tient, les deux branches armées | pass | **S1** | **tombe** |

Les cinq sabotages, et ce qu'ils font tomber en tout :

| sabotage | tests MODULES-E tombés | total `not ok` |
|---|---|---|
| S1 `moduleActif` indexé par `e.camp` | T1, T4, T8 | 31 |
| S2 union rétablie | T1, T2, T3 | 5 |
| S3 `pointsRecherche` lit `offense` | T6, T7 | 6 |
| S4 propriétaire en dur | T6 | 2 |
| S5 forme plate réparée | T5 | 2 |

⚠ **T4 ET T8 ONT DÛ ÊTRE RENFORCÉS, ET LA RAISON EST LE PIÈGE DU LOT.** Dans
leur première rédaction, tous deux n'observaient qu'un porteur **défensif** — or
le camp `defense` et la branche `defense` portent le même mot : S1 leur rendait
la bonne liste et ils passaient. Seul le camp **attaque** distingue les deux.
Chacun observe désormais **les deux camps dans le même montage** : un Cuirassier
qui attaque et porte le Booster, un mur ou un Guetteur qui défend.

⚠ **T6 A PERDU DEUX ASSERTIONS DE SOURCE AU PROFIT D'UNE MESURE.** Sa première
version lisait `combat.js` au `assert.match`. Le motif
`montage.proprietaireDefense ?? 'ouvrage'` **apparaît deux fois** dans le
fichier — l'autre est dans `creerCombat` — et S4 passait à travers. Remplacé par
un relevé de points, qui tombe.

---

## 5. La mesure de T6, au point près

Même relevé qu'à MODULES-D : **24 mesures**, 15 raids réels par `executerRaid`
sur les satellites de cinq graines, 9 combats sur de vraies bases de l'Ouvrage
qui portent des garnisons, avec la contre-épreuve de trois modules armés côté
Ouvrage sur chacune. **Les 60 lignes sont identiques avant et après**, au point.

Le raid de référence de `MODULES-D T4`, gelé dans la suite :

| montage | points |
|---|---|
| `ouvrage.defense` vide | **2 059 722** |
| `ouvrage.defense = ['pvPlusVingt']` | **2 106 166** |

Et le relevé neuf de MODULES-E, **le même raid, la base du joueur attaquée** —
c'est lui qui prouve que le propriétaire n'est pas en dur :

| montage | points | ce qu'il prouve |
|---|---|---|
| rien d'armé | **2 059 722** | la référence |
| `joueur.defense = [autoReparation, flashbang, tirDeBarrage]` | **2 471 666** | la bonne branche du bon propriétaire majore |
| les mêmes noms en `joueur.offense` | **2 059 722** | **la branche** est lue, pas l'union |
| les mêmes noms en `ouvrage.defense` | **2 059 722** | **le propriétaire** est lu, pas `'ouvrage'` en dur |

Le détail par nom, sur ce même raid : `autoReparation` seul → 2 106 166,
`flashbang` seul → 2 291 944, `tirDeBarrage` seul → 2 193 000. Le nombre
2 291 944 est exactement celui que le rapport MODULES-D citait comme la valeur
d'**avant** le démêlage — il est ici obtenu légitimement, par le bon
propriétaire et la bonne branche.

**T7 est ce qui rend T6 falsifiable** : sans les deux dernières lignes du tableau,
T6 passerait sur un barème qui ne majore jamais rien, et personne ne le verrait.

---

## 6. Ce qui doit être vrai à la fin — vérifié

- **`npm run check` vert, avec plus de tests** : 714 pass / 0 fail (706 avant).
- **Audit toujours à 7 écarts**, sortie identique à la ligne.
- **Delta 708 octets**, sous les 1 500 de l'enveloppe.
- **Les onze modules câblés jouent encore.** Ce sont des preuves d'**existence**,
  pas des rendements : chaque module armé dans sa branche, contre le même
  montage nu.

| module | branche | preuve |
|---|---|---|
| `flashbang` | offense | `modulesActifs = ["flashbang"]` sur la Meute |
| `emp` | offense | `modulesActifs = ["emp"]` sur la Crécelle |
| `booster` | offense | `modulesActifs = ["booster"]` sur le Cuirassier |
| `camouflage` | offense | PV du Frappeur 3 363 800 contre 3 168 088 nu |
| `ecraseur` | offense | PV du mur 1 860 000 contre 1 880 000 nu |
| `bouclier` | offense | réservoir 11 008 800 contre 0 nu |
| `tirDeBarrage` | offense | voisine 1 992 500 contre 2 000 000 nu |
| `pvPlusVingt` | défense | `pvMax` 14 678 400 = 12 232 000 × 1,2 |
| `rayonPlusUn` | défense | portée² 12 250 000 contre 6 250 000 nu |
| `rayonMiniMoinsUn` | défense | portée mini² 6 250 000 contre 12 250 000 nu |
| `autoReparation` | défense | câblé ; **effet inatteignable**, constat MODULES-D repris tel quel — rien n'écrit `degatsMilli` sur `etat.garnison` |

- **Un raid réel, par la chaîne du jeu**, onze lignes achetées puis
  `executerRaid` : les listes sortent
  `{"offense":["booster","bouclier","camouflage","ecraseur","emp","flashbang","tirDeBarrage"],"defense":["autoReparation","pvPlusVingt","rayonMiniMoinsUn","rayonPlusUn"]}`
  et l'avant-poste de la graine 2026 tombe en **389 ticks pour 132 846 points**,
  contre **600 ticks et 104 802** sans aucun module. Les modules sont vivants
  jusqu'au bout de la chaîne.
- **Écran Recherche rendu ET cliqué**, Chromium 1194, 360×740, dpr 2, sauvegarde
  réelle. Le même banc qu'à MODULES-D, mot pour mot, rend les mêmes chiffres :
  offense 14 lignes / 2 sans effet / 3 achetables, défense 17 / 6 / 11 ; achat
  réel de Rayon +1 (1 100 000 000 débités au point), d'Auto-réparation
  (1 200 000) et du Camouflage du Guetteur (1 200 000 000) ; la ligne défense du
  même Guetteur reste « Acquis » ; Garnison refuse toujours avec « n'a pas encore
  d'effet en jeu ». **Aucune ligne ne change d'état.** Une seule erreur console,
  un 404 sur `/favicon.ico` — le serveur du banc, pas le jeu.

---

## 7. Écarts au brief

1. **La prémisse du §1.3 est fausse** : la fuite va de l'offense vers la défense,
   pas l'inverse. Mesuré, documenté au §3 ci-dessus.
2. **`ui/banc.js` n'est pas un producteur** de `modulesDebloques`, contrairement
   au §2.6. Rien n'y a été touché.
3. **`SAVE_VERSION` n'a pas eu à bouger** et le brief ne le demandait pas :
   `modulesDebloques` n'est pas persisté. Aucune migration n'est nécessaire — une
   sauvegarde d'avant le lot rend la forme neuve dès son premier montage.
4. **Le brief parle de « six modules déjà câblés » au §6** ; il y en a **onze**
   depuis MODULES-D. Les onze sont vérifiés.

---

## 8. Ce qui reste ouvert

### La question du §7, posée et non tranchée : armer `ouvrage.offense` / `ouvrage.defense`

Les deux listes de l'Ouvrage **existent, prennent la même forme que celles du
joueur, et restent vides** — `sim/generateur.js` les livre vides sur tous les
sites. **Elles n'ont pas été armées dans ce lot**, comme demandé.

Les armer d'un `push` activerait **d'un coup tous les modules câblés du côté de
l'Ouvrage** : le premier camp de début de partie porterait le Tir de barrage, le
Flashbang et l'EMP, et les garnisons de l'Ouvrage gagneraient PV +20 %. Ce qu'il
faudrait pour que ce soit jouable :

- **un barème par niveau de site**, pas une liste globale — un camp de niveau 2
  et une base de niveau 8 ne peuvent pas porter le même arsenal ;
- **le relevé refait** : les 24 mesures de points changeraient toutes, puisque
  `pointsRecherche` majore de 20 % par module de défenseur débloqué. Le raid de
  référence passerait de 2 059 722 à 2 471 666 pour trois noms seulement ;
- **une lecture côté joueur** : rien à l'écran ne dit aujourd'hui qu'une base
  ennemie porte des modules. Le joueur subirait un Tir de barrage sans jamais
  savoir d'où il vient ;
- **et le sens de la difficulté** : c'est un lot d'équilibrage, pas de plomberie.

### Autres points laissés en l'état

- **`autoReparation` reste inatteignable** — rien n'écrit `degatsMilli` sur
  `etat.garnison`. Constat de MODULES-D, inchangé, et ce lot ne pouvait pas le
  résoudre.
- **`garnison` n'est câblé sur aucune branche** : la quatrième collision existe
  dans la table et ne peut pas encore fuir. `MODULES-E T2` gèle le fait, de sorte
  que le câbler un jour fera tomber le test et forcera à relire ce rapport.
- **Le montage sans la clé reste permis** (21 sites). Uniformiser serait un lot
  à part.
- **L'audit maquette reste rouge à 7 écarts.** Ce n'était pas ce lot.
- **`tools/verifier.py` n'a pas été lancé** — le lot ne touche ni `art/` ni
  `tools/*.py`, conformément au brief.
