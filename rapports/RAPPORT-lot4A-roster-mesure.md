# RAPPORT — lot 4A : roster mesuré et échelle de temps

## Ce qui est livré

| | |
|---|---|
| `version` | **0.8.0** (0.7.0 → 0.8.0) |
| `config.build` | **8** (7 → 8) |
| `dist/index.html` | **55 883 octets, 54,6 Kio** (lot 3C : 53,9 Kio) |
| `npm run check` | build + **114 tests, tous PASS** (106 → 114) |
| Source | `RELEVE-TA-COURBES-2.md` §6, ajouté au dépôt et **corrigé** (§7 ci-dessous) |
| `.xlsx` ouverts | **aucun** |

Le relevé n'était pas dans le dépôt au premier geste — aucun commit, aucune branche.
Il a été fourni en cours d'exécution, versé au dépôt, et c'est de lui que sort
chaque nombre de ce lot.

---

## 1. Fichiers touchés

| Fichier | Lignes | Nature |
|---|---|---|
| `src/data/combat.js` | 69‑133 (en-têtes), 136‑294 (14 unités), 310‑400 (9 défenses) | le roster |
| `src/sim/combat.js` | 129‑196, 199‑294, 344‑380, 443‑485, 700‑760, 815‑905, 930‑940 | la forme des données |
| `src/render/scene.js` | 10, 21, 76‑103 | l'accent |
| `test/roster.test.js` | 1‑362 (nouveau) | T1 à T7 du brief |
| `test/combat.test.js` · `generateur.test.js` · `grille.test.js` · `rendu.test.js` · `repli.test.js` · `cible.test.js` | voir §8 | seuils déplacés |
| `RELEVE-TA-COURBES-2.md` | ajouté ; en-tête, §6.4, §9.4 corrigés | la source |
| `ANNEXE-STATS.md` | 3‑16 | avertissement de péremption |
| `package.json` | 3, 8 | version et build |

`src/data/niveaux.js` **n'est pas touché**. `deuxRegimes` vaut toujours `true`.

---

## 2. Le changement de forme : la matrice disparaît

```js
// avant
degats: 8, matrice: { infanterie: 1, vehicule: 0.2, structureOuAviation: 0.3 },
// après
degats: { infanterie: 22, vehicule: 11, structureOuAviation: 7 },
```

Imposé par les nombres, pas préféré : le Fusilier mesuré fait 3 520 · 1 760 · 1 120,
dont les ratios valent 1 · 0,5 · 0,318181…, qui ne tient dans aucun entier.
En absolu à T = 16 s, c'est 22 · 11 · 7, exact.

Cinq conséquences, toutes traitées :

1. **`degatsDUnTir`** perd la multiplication par le facteur de matrice.
2. **La prédilection** n'est plus « le facteur vaut 1,0 » mais « la colonne la plus
   élevée ». Les deux lectures **coïncident sur les 20 profils qui tiraient** — T3
   le vérifie profil par profil : aucune règle d'arrêt ne change.
3. **La validité de cible du lot 3C** devient « la colonne visée est non nulle ».
   Même règle, lecture directe.
4. **L'accent de `scene.js`** suit la colonne de dégâts dominante. Les 14 accents
   d'unité sont identiques à ceux d'avant ; T7 du lot 3B le tient.
5. **`MATRICE_COLONNES` → `COLONNES_DEGATS`.** Le mot « matrice » ne désignant plus
   rien, le garder aurait été un piège pour le lot suivant.

### Deux points que le brief ne prévoyait pas

**Les barrières.** La Ronce et la Herse portaient leur matrice pour pondérer le
**franchissement**, pas pour tirer. Le relevé §6.4 affiche zéro pour les trois
barrières et dit la valeur non exposée par le jeu d'origine : le ÷8 de la Ronce et
les 15 PV/tick de la Herse restent nos choix, arbitrés au lot 2B. Ils sont reportés
**à l'identique** dans la forme absolue, en milli-PV par colonne :

| | ancien | nouveau, en milli-PV |
|---|---|---|
| Ronce | 2,5 PV/tick × {1 · 0,1 · 0} | `{2500 · 250 · 0}` |
| Herse | 15 PV/tick × {0,03 · 1 · 0} | `{450 · 15000 · 0}` |

Équivalence vérifiée au milli-PV près, et le dernier flottant de dégât disparaît
avec le 2,5.

**L'accent d'une barrière.** Elle ne tire pas, donc n'a pas de table `degats` ;
mais elle saigne, et de façon typée. `accentDe` lit donc `degats`, puis
`degatsFranchissement` à défaut. Ronce rouge-infanterie, Herse anti-véhicule,
Merlon sans accent : **identique à l'écran**.

---

## 3. T = 16 s

`degats = valeur_relevée / (10 × T)`. Les **57** valeurs de dégâts du §6 — 52 de tir
plus 5 de parcours — ont **160 pour PGCD**, de la plus petite (160, le Watchtower
contre l'aviation) à la plus grande (48 000, le Firehawk contre les bâtiments).
La conversion est entière si et seulement si `10 × T` divise 160 : **seul T = 16
convient**. T1 vérifie les 57 valeurs, le PGCD, et que 10, 13 et 20 échouent tous.

Les vitesses du relevé — 60 · 90 · 120 · 240 — **sont** les milli-cases par tick, et
divisées par 2,5 elles restent entières : 24 · 36 · 48 · 96. La conversion `× 100`
du lot 2A disparaît, et avec elle les `vitesse: 0.5`.

---

## 4. Le tableau des 14 unités converties

Dégâts en **PV par tir et par colonne** (relevé ÷ 160). La colonne en gras est la
troisième : structure en attaque, aviation en défense. `parc.` = dégâts de parcours,
**rangés mais non câblés** (§8 du brief : l'écrasement reste au seuil de masse).

| unité | PV | inf | véh | str/air | parc. | portée | vitesse | réserve | s. tir | répar. |
|---|---|---|---|---|---|---|---|---|---|---|
| Meute | 700 | 22 | 11 | **7** | 0 | 1,5 | 60 | 70 | 7 s | 441 s |
| Guetteur | 500 | 30 | 5 | **4** | 0 | 2,5 | 60 | 40 | 4 s | 882 s |
| Perceurs | 700 | 5 | 12 | **25** | 0 | 1,5 | 60 | 250 | 25 s | 441 s |
| Fouisseurs | 900 | 8 | 4 | **50** | 0 | 1,5 | 60 | 500 | 50 s | 882 s |
| Carapace | 800 | 4 | 35 | **6** | 0 | 1,5 | 60 | 60 | 6 s | 441 s |
| Ratisseur | 1000 | 32 | 12 | **15** | 32 | 1,5 | 120 | 80 | 8 s | 972 s |
| Fendeur | 1000 | 6 | 23 | **10** | 23 | 2,5 | 90 | 100 | 10 s | 972 s |
| Broyeur | 2000 | 15 | 28 | **18** | 25 | 2,5 | 90 | 180 | 18 s | 1458 s |
| Bélier | 800 | 7 | 12 | **25** | 7 | 2,5 | 120 | 250 | 25 s | 972 s |
| Pilon | 1300 | 5 | 10 | **50** | 40 | 2,5 | 60 | 500 | 50 s | 1458 s |
| Crécelle | 900 | 36 | 18 | **12** | 0 | 1,5 | 120 | 120 | 12 s | 1070 s |
| Busard | 1050 | 4 | 20 | **12** | 0 | 2,5 | 120 | 120 | 12 s | 1070 s |
| Frappeur | 550 | 0 | 0 | **300** | 0 | 1,5 | 240 | 450 | 45 s | 1070 s |
| Enclume | 1800 | 10 | 15 | **40** | 0 | 2,5 | 120 | 400 | 40 s | 1605 s |

Et les neuf défenses, dont la troisième colonne se lit **aviation** :

| défense | PV | inf | véh | aviation | portée | mini |
|---|---|---|---|---|---|---|
| Merlon | 2000 | — | — | — | statique | — |
| Ronce | 1000 | — | — | — | statique | — |
| Herse | 1500 | — | — | — | statique | — |
| Casemate | 1000 | 20 | 7 | 8 | 2,5 | — |
| Créneau | 1250 | 10 | 35 | 0 | 2,5 | — |
| Batterie | 1000 | 0 | 0 | 40 | 2,5 | — |
| Faucheuse | 600 | 10 | 2 | 1 | 5,5 | **3,5** |
| Mortier | 700 | 2 | 12 | 0 | 5,5 | **3,5** |
| Harpon | 650 | 0 | 0 | 16 | 5,5 | **3,5** |

### Correspondance des noms, ligne à ligne

Les quatorze unités correspondent sans ambiguïté ; le champ `ta` de nos données
portait déjà treize d'entre elles. **Trois écarts corrigés** :

| identifiant | `ta` avant | `ta` après | pourquoi |
|---|---|---|---|
| `carapace` | Exosoldat | **Zone Troopers** | nom français du client, le relevé est anglais ; §5 du relevé confirme (l'Exosoldat coûte des cristaux) |
| `faucheuse` | Reaper | **Watchtower** | « Reaper » n'est pas GDI ; le §4 de `RELEVE-TA-ARSENAL.md` nomme le Watchtower « anti-infanterie lourd, portée minimale » — c'est notre artillerie anti-infanterie à 5,5/3,5 |
| `mortier` | Demolisher | **Titan Artillery** | idem, « anti-véhicule lourd, portée minimale » |

Les neuf défenses ne figurent pas dans la liste du §5 du brief ; elles sont
appariées par rôle, et le §4 de `RELEVE-TA-ARSENAL.md` lève toute ambiguïté —
**trois défenses lourdes à portée minimale, une par type de cible**, exactement nos
Faucheuse, Mortier et Harpon. Les cinq autres (Wall, Barbwire, Anti-tank barrier,
MG Nest, Guardian Cannon, Flak) portaient déjà leur nom d'origine.

Contrôle croisé contre `ANNEXE-STATS.md` : les 23 noms Ouvrage, les châssis et les
spécialités concordent. T3 le vérifie autrement, en exigeant que la colonne
dominante de chaque défense soit celle de sa `cible` déclarée.

---

## 5. ⚠ Le seul nombre non mesuré : la réserve

Pris au pied de la lettre, à un tir par tick et 10 tirs/s :

| | secondes de tir |
|---|---|
| Sniper · 400 | 40 s |
| Rifleman · 700 | 70 s |
| Mammoth · 1 800 | 180 s |
| Commando, Juggernaut · 5 000 | **500 s** |

Un raid dure au plus **90 secondes**. Dix unités sur quatorze auraient de quoi tirer
plus longtemps que le combat entier, et le plancher de 10 % ne mordrait plus sur
personne. **Retenu : ÷ 10.** Les quatorze valeurs sont des multiples de 100, la
division est donc exacte, et l'ordre relatif du relevé est conservé.

**Plage obtenue, les quatorze en secondes de tir** — c'est ce qu'il faut trancher sur
pièces au banc :

| s. tir | unités |
|---|---|
| **4 s** | Guetteur |
| 6 s | Carapace |
| 7 s | Meute |
| 8 s | Ratisseur |
| 10 s | Fendeur |
| 12 s | Crécelle, Busard |
| 18 s | Broyeur |
| 25 s | Perceurs, Bélier |
| 40 s | Enclume |
| 45 s | Frappeur |
| **50 s** | Fouisseurs, Pilon |

⚠ **Le §6 du brief annonce « de 7 s pour le Guetteur à 50 s pour les Fouisseurs ».**
Le plancher est bien celui du Guetteur, mais il vaut **4 s** et non 7 : 400 ÷ 10 = 40
de réserve, soit 4 s. Les 7 s sont celles du **Fusilier** (700 ÷ 10 = 70). Et le
plafond de 50 s est partagé par les **Fouisseurs et le Pilon**, tous deux à 5 000
munitions. La plage réelle est donc **4 s → 50 s**, contre 15 à 30 s avant la
conversion : elle encadre bien l'ancienne, plus largement qu'annoncé.
T7 assèce les deux bornes et vérifie qu'aucune unité ne dépasse les 90 s.

---

## 6. ⚠ Une asymétrie trouvée et corrigée : le miroir

Le §9 T5 du brief exige que l'invariance en miroir (T12 du lot 2B) **ne bouge pas**,
et qu'un écart soit cherché plutôt que toléré. Elle a bougé : **0 → 2 ticks**.

La cause, isolée : `pvMaxMilli` se met à l'échelle **exactement** — les PV vivent en
milli-PV, `pv × facteurMilli` n'a pas de reste — alors qu'une colonne de dégâts
écrite en **PV entiers** perdait le sien à chaque niveau. Au 12e, où le facteur vaut
2683, une colonne de 5 PV rendait `floor(13,415) = 13`, soit **1,56 % de moins**. Le
défaut était invisible avant le lot : `degats` était un scalaire de 8 à 20, jamais
un 1 ou un 2.

| niveau | 1 | 8 | 11 | 12 | 16 | 20 | 30 | 40 | 50 |
|---|---|---|---|---|---|---|---|---|---|
| avant correction | 175 | **176** | 174 | **176** | 174 | 174 | 174 | 174 | 174 |
| après correction | 175 | 175 | 175 | 175 | 175 | 175 | 175 | 175 | 175 |

**Correction : les colonnes sont portées en MILLI-PV dès le profil, comme
`pvMaxMilli`.** La formule devient
`floor(degatsColonneMilli × ratioMilli / 1000)`.

C'est un **écart avec la lettre du brief**, qui écrit `floor(degatsColonne × ratioMilli)`.
Les deux coïncident au niveau 1 ; au-delà, seule celle-ci conserve le rapport.
Le brief perd sa multiplication comme annoncé — c'est la division par 1000 qui
revient. Aucune tolérance n'a été élargie : celle du T12 reste à 1 tick, et l'écart
mesuré est désormais **0 sur neuf niveaux**, contre 0 avant le lot.

Coût : le produit de la formule de tir passe de 1,4 × 10¹¹ à 1,4 × 10¹⁴, soit de
62 000× à **62,4×** sous `MAX_SAFE_INTEGER`. Voir §7.

---

## 7. Débordement — la marge réelle n'est pas celle du brief

Le §4 du brief demande d'asserter la marge du Firehawk au niveau 50. Elle est
confortable. **Mais ce n'est pas le produit le plus lourd du moteur.**

| produit | valeur au niveau 50 | marge sous `MAX_SAFE_INTEGER` |
|---|---|---|
| dégâts × santé (Frappeur) | 1,44 × 10¹⁴ | **62,4×** |
| **`pvCourantMilli × 1000`** (ratio de santé) | **9,62 × 10¹⁴** | **9,36×** |

Le PV maximal du roster passe de 500 à **2 000** (Mammoth et Wall), et c'est lui qui
commande. Point de rupture :
`floor(MAX_SAFE_INTEGER / (facteurMilli(50) × 1000))` = **18 728 PV de base**, neuf
fois le plus gros profil. C'est asserté noir sur blanc en T4 et dans T13 du lot 2B :
**tout profil futur au-dessus de 18 728 PV cassera l'arithmétique entière.**

---

## 8. Tests

### Les huit du lot — `test/roster.test.js`

| | ce qu'il tient | résultat |
|---|---|---|
| **T1** | 57 valeurs, PGCD 160, aucune fractionnaire ; vitesses 60·90·120·240 et /2,5 → 24·36·48·96 ; T = 10, 13, 20 échouent tous | **PASS** |
| **T1 bis** | les seuls flottants restants de `src/data/combat.js`, énumérés | **PASS** |
| **T2** | les 23 profils reconstruisent le §6 : `degatsColonne × 160` = valeur lue, plus PV, portées, vitesses, réparation, noms d'origine | **PASS** |
| **T3** | dominante unique sur les 23 ; **et identique à la prédilection du lot 2A sur les 20 profils qui tiraient** ; et conforme à la `cible` déclarée des six défenses | **PASS** |
| **T4** | pas de débordement au niveau 50, marges 62,4× et 9,36×, rupture à 18 728 PV, éprouvé dans le moteur | **PASS** |
| **T5** | miroir sur neuf niveaux : **une seule durée, 175 ticks** | **PASS** |
| **T6** | A, B et C, cause · tick · butin · survivants | **PASS** |
| **T7** | réserve = munitions ÷ 10 ; secondes de tir 4 → 50 ; aucune > 90 s ; plancher ≥ 1 pour les quatorze | **PASS** |

**T8 — non-régression** : les 106 tests antérieurs passent, seuils mis à jour ci-dessous.
**T9 — build hors ligne** : `npm run build` passe, **55 883 octets**, aucune URL.

### Vérifié dans un vrai navigateur

Chromium, réseau coupé (toute requête non-`file:` avortée) : ouverture, raid complet
`mixte / avant-poste 15 / graine 3` joué jusqu'à sa fin au tick 373, légende ouverte
et refermée, inspecteur cliqué sur le champ. **0 requête sortante, 0 erreur de page,
0 erreur console.**

---

## 9. Les seuils déplacés, avec leurs deux valeurs et la raison

**Aucun n'est une régression** : c'est le roster qui a changé. Le tableau est complet.

### `test/combat.test.js` (lot 2A) — 14 tests

| test | avant | après | raison |
|---|---|---|---|
| T3 | Merlon 500 000 − 2400 | 2 000 000 − 7000 | Wall 500 → 2 000 PV ; Fusilier 2,4 → 7 PV contre structure |
| T4 | Fusilier 100 000 − 20 000 | 700 000 − 10 000 | Fusilier 700 PV ; Watchtower 10 PV contre infanterie. **Les portées 5,5/3,5 ne bougent pas** |
| T5 | plancher au tick 135, mur au 209 | plancher au **63**, mur au **286** | réserve 150 → 70 ; 7000 milli-PV/tir sur 2 000 000 |
| T5 bis | Gangue 114 000, butin 216 | **101 000**, butin **294** | réserve 15 → 7, 7000/tir |
| T6 | demi-vie 50 000, Merlon 488 000 | **350 000**, **1 965 000** | 700 PV ; la demi-vie est 350 000 |
| T7 a | écrasement au tick 10, à 3000 | tick **12**, à **3080** | Predator 100 → 90 milli/tick |
| T7 b | PV entre 100 000 et 200 000 | **628 044** des deux côtés | Predator 300 → 1 000 PV, 12 × 1,0 → 23 PV |
| T8 | 1500 · 2000 · 2200 ; Crécelle 2500 | **1600** · **2020** · **2380** ; **2200** | Fusilier 50 → 60, Orca 150 → 120. Le **rapport** 2,5 est inchangé |
| T10 | Casemate 35 000, morte au tick 2 | **100 000**, morte au tick **3** | MG Nest 350 → 1 000 PV ; Commando 900 PV et 50 PV/tir |
| T11 | Souche au tick 27 | tick **8** | Juggernaut 15 × 1,0 → **50** PV contre structure |
| T12 | Pilon, 5 ticks | **Bélier**, 3 ticks | 150 000/2 = 75 000 n'est plus un multiple de 50 000 ; le Bélier à 25 000/tick le donne en 3 ticks pile. **Montage changé pour garder un seuil rond** |
| T13 | Merlon 792 500, monté à 396 250 | **3 170 000**, monté à **1 585 000** | Wall 2 000 PV. **Les 4 000 milli-points ne bougent pas** : le barème ne dépend que du niveau et de la fraction détruite |
| T14 | 500 × facteurMilli(50), 2400/tick | **2000 ×**, **7000**/tick | idem. Toujours `duree` au tick 900 |
| §9 | Fusilier mort au tick 7 | tick **39** | MG Nest 20 PV/tir sur 700 PV, et sa riposte fait décroître la Casemate |
| §7 barrière | entrée au 20, 152 000, 1900, sortie 67 116 | **17**, **881 000**, **2202**, **664 919** | Barbwire 200 → 1 000 PV ; Fusilier 700 PV et 60 milli/tick |
| §7 aérien | Frappeur t56/57, Busard t108/137 | **t70/71**, **t135/164** | Firehawk 300 → 240, Paladin 150 → 120 milli/tick |
| §8 | réserve 16→15, Merlon 476 000 | **8→7**, **1 937 000** | réserve 70, plancher 7 ; neuf tirs avant de sortir de portée |

### `test/generateur.test.js` (lot 2B) — 5 tests

| test | avant | après | raison |
|---|---|---|---|
| T11 | `haut.degats` scalaire | `degatsColonne` par colonne, **en milli-PV** | forme des données |
| T11 | 10 ticks → +500 | **+600** | vitesse 60 |
| T12 | tolérance 1 tick, écart 0 | **écart 0**, neuf niveaux à 175 ticks | tolérance **inchangée** (§6) |
| T13 | max 500 PV, marge 936× | **2 000 PV**, marges **9,36×** et **62,4×**, rupture à **18 728** | §7 |
| T14 | 152 000 à l'entrée, 20/10 ticks par case | **881 000 / 1 381 000**, **17/12** ticks | PV et vitesses mesurés |
| T16 | `meute.degats` scalaire | trois colonnes × 1000 | forme des données |

### `test/grille.test.js` (T16 du lot 2A)

| avant | après | raison |
|---|---|---|
| « les matrices sont des multiples de 10 ‰, dans 0…1000 » | **« toute valeur de dégâts est un entier de PV ≥ 0 »** | la matrice n'a plus d'objet ; **le remplaçant est plus dur, pas plus lâche** — plus d'échelle, plus d'arrondi |
| `vitesse × 100` entier | `vitesse` entière, `(v × 1000) % 2500 === 0` | la vitesse EST le milli/tick |
| `herse.matrice.infanterie === 0.03`, `franchissement 15` et `2.5` | tables absolues `{450·15000·0}` et `{2500·250·0}` | report exact du lot 2B |
| — | **ajouté** : une défense porte `degats` OU `degatsFranchissement`, jamais les deux | les deux tables n'ont pas la même unité ; les confondre serait un facteur 1000 silencieux |

### `test/rendu.test.js`, `test/repli.test.js`, `test/cible.test.js`

| test | avant | après | raison |
|---|---|---|---|
| rendu T3 | Meute à 2050 | **2060** | vitesse 60. Les positions à l'écran, 722 et 721 px, **ne bougent pas** |
| rendu T8 | dominante lue dans `matrice` | dans `degats` (et `degatsFranchissement` pour les barrières) | forme. **Les 14 accents d'unité sont identiques** |
| repli T1 | écrasement t10 à 3000, Fusilier 100 000 | **t12 à 3080**, **700 000** | vitesses et PV |
| repli T3 | fond au t320, repli au 350 | **t267**, repli au **297** | vitesse 60 |
| repli T4 | 20 ticks bloqué, reprise à 18 000 | **18 ticks**, reprise à **18 080** | Predator 90 milli/tick |
| repli T5 | mur au tick 209 | **286** | 7000/tir sur 2 000 000 |
| repli T6 (raid C) | 82 849 + 27 616, 5 surv., t566 | **66 992 + 22 330**, **6 surv.**, **t471** | roster mesuré |
| repli T7 | appât avec `matrice` | avec `degats` | forme |
| repli T8 bis | « 100,0 / 100,0 PV », t325 | « **700,0 / 700,0 PV** », **t272** | PV et vitesse |
| cible T1 | Crécelle abattue | **elle s'échappe à 160 milli-PV**, hors de portée au tick 28 | Orca 200 → 900 PV, et 120 milli/tick la sort de la portée 2,5 avant la mise à mort. **Le Fusilier reste intact — ce que T1 tient** |
| cible T2 | matrices `{0,0,1}` | `degats` `{0,0,300}` et `{0,0,16}` | forme |
| cible T4 | `attaquants` t542, 55 251 + 18 417, 2 surv. | **`souche` t419**, **299 878 + 99 959**, **4 surv.** | l'assaut lourd mesuré rase le site |
| cible T5 | 0 raid par `duree` | **1 raid**, `mixte/avantPoste/7` | §10 ci-dessous |
| cible T6 | Gangue −8000 | **−25 000** | Missile Squad 25 PV contre structure |

### Deux seuils qui n'ont PAS bougé, et pourquoi

- **T5 du lot 2A** (Meute contre Merlon) : le brief prévient que ce test ne doit pas
  bouger. **Il a bougé** — 209 → 286 ticks — et c'est normal : le brief vise la
  matrice structure à 0,3, non nulle, donc la Meute frappe toujours le mur. Ce qui ne
  devait pas changer, c'est que **le tir continue au-delà du plancher**, et il
  continue : 223 tirs gratuits au lieu de 74. La mécanique est intacte, seuls les PV
  et les dégâts ont été mesurés.
- **T13 du lot 2A** : les 4 000 milli-points de recherche sont **inchangés** alors que
  le Merlon quadruple de PV. Le barème ne dépend que du niveau et de la *fraction*
  détruite, jamais de la magnitude — c'est la preuve que la conversion n'a pas fui
  dans l'économie.

---

## 10. ⚠ Ce que le brief demandait de remesurer : la marge sous 900 ticks

Le §3 annonce que T = 16 s laisse **389 ticks de marge** sous le plafond de 90
secondes, et prévient que la mesure a été faite avec le roster d'avant. **Le roster
mesuré consomme cette marge.**

Sur les 54 raids du balayage : **un raid touche le plafond**,
`mixte / avant-poste 15 / graine 7`.

**Ce n'est pas un gel.** Vérifié en levant le plafond : le raid se conclut de
lui-même au **tick 907**, par `attaquants`, le dernier Pilon se repliant après ses 30
ticks inutiles. Il manque **sept ticks**, pas une issue. Le défaut fermé au lot 3C —
une unité visant éternellement une cible qu'elle ne peut pas blesser — n'est pas
revenu : le balayage compte toujours **zéro cible stérile survivant à un ciblage**.

C'est un fait à trancher, pas à corriger en douce. Trois issues, dans l'ordre où je
les recommanderais :

1. **Ne rien faire.** Un raid sur 54 qui expire à sept ticks près est une queue de
   distribution, pas un défaut. Le joueur voit un raid repoussé de justesse.
2. **Porter le plafond à 100 s** (1 000 ticks). Une ligne dans `src/data/combat.js`.
   Coûte 10 s d'attente au pire cas.
3. **Descendre T à 15 s.** Écarté : 150 ne divise pas 160, chaque profil demanderait
   un arrondi, et tout le §3 du brief tombe.

Les causes de fin sur les 54 raids : **35 `attaquants`, 18 `souche`, 1 `duree`.**
Dix-huit sites rasés contre six avant le lot — le roster mesuré est nettement plus
mordant à l'attaque.

---

## 11. Les trois raids de référence, avant et après

| | avant (lot 3C) | **après (lot 4A)** | prévu au §3 pour T = 16 |
|---|---|---|---|
| **A** avant-poste 15 · g1 · Infanterie | `attaquants` t315, butin 0, 0 surv. | `attaquants` **t321**, **765 quartz + 255 scorie**, **2 surv.** | 403 |
| **B** camp 15 · g1 · Blindé lourd | `souche` t329, 215 130 + 71 710, 4 surv. | **`souche` t267**, 215 130 + 71 710, 4 surv. | 511 |
| **C** camp 15 · g1 · Infanterie | `attaquants` t566, 82 849 + 27 616, 5 surv. | `attaquants` **t471**, **66 992 + 22 330**, **6 surv.** | 629 |

**Le point que le brief demandait de surveiller est bon : B prend toujours la
Souche**, et il la prend **plus vite** (267 contre 329 avant, et 511 prévus). Le
butin de B est identique au quartz près — le site est rasé dans les deux cas, et un
site rasé livre tout.

Les durées sont **plus courtes que prévu**, pas plus longues : la mise à l'échelle
uniforme du §3 supposait que tout le monde ralentissait ensemble. Le roster mesuré
fait le contraire — il **spécialise**. Le Pilon passe de 15 à 50 PV contre les
structures, les Grenadiers de 8 à 25 : les bâtiments tombent bien plus vite qu'avec
le roster deviné, ce qui compense largement l'allongement des échanges entre unités.

A change de nature : il rapportait **zéro** butin, il en rapporte maintenant un peu
(765 quartz) et laisse deux survivants. Le raid d'infanterie sur avant-poste cesse
d'être une perte sèche.

---

## 12. Les sept contrôles du §10

| contrôle | état |
|---|---|
| aucune valeur de dégât, PV, portée ou vitesse ne vient d'ailleurs que du relevé, la réserve exceptée et signalée | ✔ T2 reconstruit les 23 profils depuis la table transcrite. La réserve est signalée au §5, dans le code, et par T7 |
| correspondance des 23 noms vérifiée ligne à ligne contre `ANNEXE-STATS.md` | ✔ §4. **Trois écarts trouvés et corrigés** (`carapace`, `faucheuse`, `mortier`) |
| `src/data/niveaux.js` n'a pas été touché | ✔ `git diff` vide ; `deuxRegimes` toujours `true` |
| aucun flottant ne subsiste dans `src/data/combat.js` | ⚠ **partiellement.** Voir ci-dessous |
| les deux passages erronés du relevé sur la portée minimale sont corrigés | ✔ §6.4 et §9.4 de `RELEVE-TA-COURBES-2.md`, plus une note de statut en tête |
| `npm run check` passe | ✔ build + **114 tests PASS** |
| aucun `.xlsx` ouvert | ✔ |

**Le quatrième contrôle, en détail.** Tous les flottants que la conversion touche ont
disparu : les facteurs de matrice, le `degatsFranchissement: 2.5`, le
`matrice.infanterie: 0.03`, les `vitesse: 0.5`. Trois familles restent, et **aucune
n'est une valeur convertie** :

1. les quatre **portées** — 1,5 · 2,5 · 5,5 · 3,5. Le §5 du brief les écrit
   lui-même sous cette forme (« identiques aux nôtres ») et demande de prendre « la
   valeur du relevé ». Les passer en milli-cases serait une réinterprétation d'unité
   que le §5 réserve explicitement à la vitesse ;
2. `GRILLE.tickSec = 0,1`, antérieur au lot ;
3. `OBSTACLES.diviseurVitesse = 2,5`, antérieur lui aussi.

Les deux derniers sont hors du périmètre du roster : **le §10 lu à la lettre n'est
satisfaisable par aucun lot qui ne touche ni `GRILLE` ni `OBSTACLES`.** Plutôt que de
trancher seul, T1 bis **énumère les six rescapés** — un flottant nouveau se verra,
au lieu de se fondre dans un décompte flou. Tous tombent juste dans l'échelle entière
du moteur, et c'est asserté.

---

## 13. Écarts par rapport au brief

1. **La formule de dégâts.** Le §4 écrit `floor(degatsColonne × ratioMilli)`. Les
   colonnes sont portées en **milli-PV**, d'où `floor(degatsColonneMilli × ratioMilli
   / 1000)`. Raison au §6 : sans cela l'invariance en miroir, que le §9 T5 exige de ne
   pas voir bouger, passait de 0 à 2 ticks. Coût : la marge de débordement des dégâts
   tombe de 62 000× à 62,4× — toujours confortable, et ce n'est de toute façon pas la
   contrainte qui mord (§7).
2. **`degatsParcours` et `reparation` ajoutés aux données.** Le §5 range la réparation
   « en données » sans dire où ; les dégâts de parcours sont dans les 57 valeurs de T1
   mais le §8 met leur *mécanique* hors périmètre. Les deux sont donc **stockés et non
   câblés** : `src/data/` est le seul domicile légitime d'une valeur de calibrage, et
   ils seront là quand Ethan jugera l'écrasement par dégâts de parcours.
3. **Le franchissement des barrières n'est pas repris du relevé** — il ne l'expose
   pas. Report exact des arbitrages du lot 2B (§2).
4. **`MATRICE_COLONNES` renommée `COLONNES_DEGATS`.** Non demandé ; garder « matrice »
   quand la matrice n'existe plus aurait piégé le lot suivant.
5. **T12 du lot 2A : montage changé**, Pilon → Bélier, pour garder un seuil rond
   (§9).
6. **La plage de secondes de tir n'est pas celle annoncée** : 4 s → 50 s, pas 7 → 50
   (§5).
7. **La marge sous 900 ticks n'est pas celle annoncée** : un raid sur 54 la dépasse
   de sept ticks (§10).
8. **`ANNEXE-STATS.md` annoté** comme périmé. Non demandé, mais ses tables
   contredisent maintenant `src/data/` sur chaque ligne — exactement le piège que
   `CLAUDE.md` §1 signale pour les classeurs.

---

## 14. Points laissés en suspens

**Le franchissement des barrières est décroché de l'échelle des PV.** C'est le seul
endroit du roster où deux échelles ne se parlent plus. La Ronce coûtait au lot 2B la
moitié de la vie d'un Fusilier ; elle lui coûte maintenant **6,1 %** — 17 ticks à
2 500 milli-PV sur 700 PV. Les PV ont été mesurés et multipliés par sept, le
franchissement non, parce que le relevé ne l'expose pas. **À revoir au banc :** soit
on multiplie le franchissement dans le même rapport, soit on accepte que les
barrières ne soient plus qu'un ralentisseur. C'est un arbitrage, pas un défaut, et je
ne l'ai pas pris seul.

**Le gel à 0 ‰ de PV**, signalé aux lots 3B et 3C, est toujours là et **le lot 4A le
rend plus visible** : les PV mesurés étant bien plus gros, une entité descend plus
souvent sous 1 ‰ sans mourir. Le T10 du lot 2A l'exhibe désormais en clair — une
Casemate à 150 milli-PV sur 1 000 000 tire à blanc pendant un tick avant d'être
achevée. Toujours en attente de ton arbitrage.

**La bascule sol/air est validée, rien à faire.** Le §3 du relevé montre que la même
unité, consultée en attaque puis en défense, porte les mêmes nombres à une case
près : la quatrième passe du bâtiment à l'aviation. **Notre modèle à trois colonnes
est exact**, une quatrième serait redondante. Consigné dans l'en-tête de
`COLONNES_DEGATS` et asserté par T2, qui vérifie que la colonne `air` de toute unité
offensive et la colonne `bât` de toute défense sont bien nulles au relevé.

**Hors périmètre, comme demandé** (§8 du brief) : la vitesse en ×2/3 en défense,
l'écrasement par dégâts de parcours, les trois classes de blindage des défenses, les
bâtiments de soutien. Rien n'en a été câblé.

---

## 15. Ce qu'Ethan doit regarder au banc

### Le raid à ouvrir : `Mixte / camp / niveau 15 / riche en quartz / graine 2`

Il montre les deux nouveautés du lot dans la même partie.

| tick | ce qui se passe |
|---|---|
| 100 | la vague 3 arrive : Crécelle, Frappeur, Busard |
| **123** | la **Batterie ouvre le feu sur le Frappeur** |
| **136** | le Frappeur atteint un **Nœud** — mais à **73 ‰ de vie**, la DCA l'ayant mâché : il l'entame au lieu de le pulvériser |
| 259 | fin, `souche` : le site est rasé |

### Et le contre-exemple : `Mixte / camp / niveau 15 / riche en quartz / graine 42`

Le même assaut sur un site **sans aucune Batterie**. Le Frappeur arrive au tick 132
à **529 ‰ de vie** et **détruit une Gangue d'un seul tir**.

C'est toute la démonstration : **300 PV par tir contre 7 pour le Fusilier**. Une
Gangue de 150 PV tombe en **un** tir du Frappeur, contre 22 du Fusilier ; une Souche
de 400 PV en **deux** tirs, contre 58. Montage direct, niveau 15 : le Frappeur rase
une Gangue au tick 1 et la Souche au tick 5.

**La question à trancher au banc est donc celle-ci : la couche anti-aérienne est-elle
la seule réponse au Frappeur, et une garnison sans Batterie est-elle jouable ?** Sur
les 18 raids `mixte` du balayage, le Frappeur atteint un bâtiment dans **4 cas sur
18** : `camp/2`, `camp/7`, `camp/11` et `camp/42`. Trois d'entre eux n'ont **qu'une
seule** pièce de DCA, le quatrième n'en a **aucune** — et c'est le seul où le
Frappeur détruit son bâtiment du premier coup. Dans les quatorze autres raids, il est
abattu avant d'arriver. C'est la spécialisation du relevé qui entre dans le jeu, et
il faut la voir tourner pour juger si elle est tenable.

Deux autres choses à sentir à la main :

- **la réserve à 4 s du Guetteur** — il tire quarante fois et se tait. Est-ce une
  unité, ou une capacité ?
- **la Ronce à 6 %** — franchir une barbelée ne fait presque plus rien à
  l'infanterie. C'est le suspens du §14.
