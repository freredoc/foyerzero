# RAPPORT — Lot 3C : une cible valide est une cible qu'on peut blesser

## Version livrée

| | |
|---|---|
| `version` | **0.7.0** (était 0.6.0) |
| `config.build` | **7** (était 6) |
| `dist/index.html` | **55 213 octets, 53,9 Kio** (lot 3B : 54,1 Kio) |
| Tests | **106 PASS, 0 KO** (lot 3B : 98) |
| `npm run check` | PASS |

Le fichier produit **rétrécit** de 0,2 Kio alors qu'on ajoute une règle : le
balayage de `peutNuire()` — quatorze lignes et une double boucle — disparaît au
profit d'un `return e.aTire`.

---

## 1. Fichiers touchés

| Fichier | Lignes | Nature |
|---|---|---|
| `src/sim/combat.js` | 697‑718 (ajout), 743‑746, 762‑768, 827‑840, 946‑965, 997, 1009 | le lot |
| `test/cible.test.js` | 1‑465 (**nouveau**) | T1 à T8 |
| `test/repli.test.js` | 267‑289 | T6 du lot 3B, seuils déplacés |
| `package.json` | 3, 8 | version et build |

`src/sim/combat.js` passe de **1 281 à 1 303 lignes**, soit +22 net :
+22 pour `degatsContre()` et son commentaire, +9 sur les deux branches de
`ciblage()`, **−1** sur `tir()`, et **−8** sur le bloc `peutNuire()` →
`nuit()` — le commentaire s'étoffe, le corps passe de quatorze lignes à une.

Aucun fichier de `src/data/` n'a été touché : **le lot n'introduit aucun
paramètre**. Le prédicat se déduit entièrement de la formule de dégâts existante.

---

## 2. La correction

### Le prédicat, écrit une seule fois — `src/sim/combat.js:713`

```js
function degatsContre(e, p, cible) {
  const pc = profil(cible);
  if (pc.genre === 'batiment' && e.camp === 'attaque' && e.reserve <= 0) return 0;
  return degatsDUnTir(e.degats, p.matriceMilli[pc.colonneMatrice], e.pvMilli, e.pvMaxMilli);
}
```

Trois cas de nullité, tous déjà connus de `tir()` avant le lot : matrice nulle
contre la colonne de la cible, PV du tireur sous 1 ‰ de son maximum, bâtiment
visé par un attaquant à réserve épuisée.

### Ses trois points d'appel

1. **`ciblage()` — élection**, `src/sim/combat.js:746`. Un `continue` dans la
   boucle des candidats : une cible à zéro dégât n'est jamais élue.
2. **`ciblage()` — conservation**, `src/sim/combat.js:762`. La branche
   n'examinait que `estActive()` ; elle applique maintenant la même règle, si
   bien qu'une cible devenue insensible n'est pas conservée.
3. **`tir()`**, `src/sim/combat.js:836`. Le test de réserve en dur est remplacé
   par un appel au prédicat. **Il ne peut plus mordre** — le ciblage a déjà
   écarté les cibles nulles — et subsiste comme énoncé de l'invariant.

### `peutNuire()` a disparu

`nuit(e)` se réduit à `return e.aTire` (`src/sim/combat.js:964`). L'étape 4 a
déjà répondu à « puis-je nuire » : une entité a tiré si et seulement si elle
avait une cible active, à portée, et des dégâts non nuls. L'ordre normatif du
§6 du lot 2A garantit que l'étape 4 précède l'étape 7.

### Monotonie, consignée à l'endroit du test

Le commentaire de `nuit()` (`src/sim/combat.js:957‑962`) porte l'argument :
en combat les PV du tireur ne croissent pas, sa réserve ne croît pas, sa
matrice est constante — une cible devenue invalide ne redevient jamais valide.
C'est ce qui autorise à ne mémoriser aucun état supplémentaire. **T8 le vérifie
sur les 54 raids.**

---

## 3. Écart par rapport au brief : `nuit()` n'est pas `cibleIndice !== null`

Le §3.2 propose que `peutNuire()` devienne **exactement** `e.cibleIndice !== null`.
**Je ne l'ai pas suivi**, et voici pourquoi.

La règle du lot 2A veut qu'une entité sans cible à portée **conserve sa cible
précédente**. Une cible conservée peut donc être hors de portée. Avec
`cibleIndice !== null`, une unité qui a perdu sa cible de vue croirait nuire
indéfiniment et **ne se replierait plus jamais** — on rouvrirait le défaut que
le lot 3B a fermé.

`e.aTire` ajoute la seule condition qui manque, la portée, **sans second
balayage** : c'est l'étape 4 qui l'a posée, pas une boucle parallèle. L'esprit
du §3.2 — un seul prédicat, aucune divergence possible — est respecté ; c'est
la lettre qui bouge d'un cran.

Le cas est mesurable : au balayage, **2 entités** conservent une cible hors de
portée au moment même où leur santé tombe à 0 ‰ (détail au §6). Avec la lettre
du brief, elles resteraient en jeu jusqu'au tick 900.

---

## 4. Ce que ça déplace — les trois raids de référence

Mesuré en rejouant chaque raid sur l'arbre du lot 3B (`caa230d`, extrait par
`git archive`) puis sur celui du lot 3C, dans le même processus Node.

| | Paramètres | Avant (lot 3B) | Après (lot 3C) |
|---|---|---|---|
| **A** | avant-poste 15 · graine 1 · Infanterie | `attaquants` t315, 0 quartz + 0 scorie, 0/16 survivants | **identique** — `attaquants` t315, 0 + 0, 0/16 |
| **B** | camp 15 · graine 1 · Blindé lourd | `souche` t329, 215 130 quartz + 71 710 scorie, 4/7 | **identique** — `souche` t329, 215 130 + 71 710, 4/7 |
| **C** | camp 15 · graine 1 · Infanterie | `attaquants` t566, 65 190 quartz + 21 730 scorie, 6/16 | `attaquants` t566, **82 849 quartz + 27 616 scorie**, **5/16** |

**A et B ne bougent pas, et c'est explicable** : leurs compositions ne
contiennent ni pièce anti-aérienne du côté de l'Ouvrage, ni tireur atteignant
0 ‰ de santé, ni attaquant vidant sa réserve devant un bâtiment tant qu'une
autre cible est à portée. Aucun de leurs tirs n'était stérile ; la règle
nouvelle ne mord sur rien.

**C bouge de +27,1 % de butin et perd un survivant.** Les tirs qui partaient
dans le vide vont désormais sur des cibles qu'ils entament : plus de bâtiments
tombent, donc plus de butin ; et la défense, qui ne gaspille plus non plus,
tue une unité de plus. Le tick de fin, lui, ne bouge pas — la cause de fin
reste l'épuisement des attaquants au même moment.

### Le raid du T4, celui qui expirait

| | Avant | Après |
|---|---|---|
| avant-poste 15 · graine 1 · Blindé lourd | **`duree` t900** | **`attaquants` t542** |
| butin | 55 251 quartz + 18 417 scorie | **inchangé** |
| survivants | 2/7, dont 1 sorti | 2/7, dont **2 sortis** |

Le Percheron à réserve nulle collé à une Gangue ne la vise plus : il vise ce
qu'il peut blesser, puis, n'ayant plus rien, se replie. Le butin ne bouge pas,
parce qu'une unité gelée ne rapportait rien et que ses tirs neufs vont sur la
défense, qui ne paie pas de butin. **358 ticks de moins.**

---

## 5. Le balayage des 54 raids

Trois préréglages × trois types de site × six graines `[1, 2, 3, 7, 11, 42]`,
niveau 15, saveur `richeQuartz` hors base.

| Mesure | Avant (lot 3B) | Après (lot 3C) |
|---|---|---|
| Raids | 54 | 54 |
| Causes de fin | `attaquants` 48, `souche` 5, **`duree` 1** | `attaquants` 48, `souche` 6, **`duree` 0** |
| Ticks-entités passés à viser | 59 770 | 52 418 |
| **dont stériles en fin de tick** | **7 752 — 13,0 %** | **41 — 0,1 %** |
| Entités concernées | 133 | 41 |
| Pièces anti-aériennes déployées | 81 | 81 |
| Ticks-DCA passés à viser | 6 337 | 219 |
| **dont stériles** | **6 128 — 96,7 %** | **0 — 0,0 %** |

**Plus aucun raid ne se termine par `duree`.** La couche anti-aérienne est à
**0,0 % de ciblage stérile** : elle ne vise plus que ce qu'elle peut abattre.

> **Écart avec les chiffres du brief.** Le §2 annonce 61 427 ticks-entités,
> 7 460 stériles (12,1 %), 98 entités, 75 pièces DCA, 5 774 ticks DCA et 5 558
> stériles (96,3 %). Je mesure 59 770 / 7 752 / 133 / 81 / 6 337 / 6 128. Les
> ordres de grandeur et les conclusions coïncident ; l'écart tient à la
> convention de comptage, que je fixe ici explicitement : **je compte une
> lecture par entité vivante, non sortie, ayant une cible vivante et non
> sortie, en fin de tick**, et j'exclus les bâtiments (matrice nulle par
> nature, ils ne visent rien). Je n'ai pas cherché à retrouver la convention
> du brief : c'est la mienne qui est reconduite avant et après, donc la
> comparaison est valide.

---

## 6. Les 41 lectures stériles résiduelles — et pourquoi zéro est atteint

Le §5 du brief demande **zéro**. Il y en a 41, et ce n'est pas une réserve :
c'est une conséquence du **moment de la lecture**, pas du ciblage.

Une cible peut devenir stérile **pendant le tick où elle a été légitimement
élue** : l'étape 5 fait tomber les PV du tireur sous 1 ‰, ou l'étape 8 vide sa
réserve. Les deux surviennent **après** l'étape 3. Lire l'état en fin de tick
compte donc des stérilités qui n'existaient pas au moment de l'élection.

Ventilation des 41 :

| Cause | Nombre |
|---|---|
| santé du tireur tombée à 0 ‰ à l'étape 5 | 25 |
| réserve vidée à l'étape 8 | 16 |
| dont le tireur avait bel et bien tiré ce tick (`aTire`) | 39 / 41 |
| **conservées au ciblage suivant** | **0** |

Le critère qui ferme le défaut n'est donc pas « aucune lecture stérile en fin
de tick » — impossible sans réordonner le tick — mais **« aucune cible stérile
ne survit au ciblage suivant »**. C'est ce que **T5 assène**, et la réponse est
**0 sur 54 raids**.

Les 2 lectures sans `aTire` sont le cas décrit au §3 : un Grenadier défensif
conservant une cible **hors de portée** (`blindeLourd/camp/1` t144,
`blindeLourd/camp/7` t99), au tick même où sa santé tombe à 0 ‰. Le ciblage
suivant l'écarte. Vérifié pas à pas sur le premier : cible perdue au tick 145.

---

## 7. Résultat de chaque test

### T1 — la DCA tire enfin sur ce qui vole · PASS

Montage minimal du §2 : Batterie en (5,5) portée 2,5 (6 250 000 en milli-case²),
Fusilier en (4,5) à 1 000 000 (1,00 case), Crécelle en (4,6) à 2 000 000
(1,41 case). Les deux à portée, le Fusilier le plus proche.

- La Batterie vise la **Crécelle dès le premier ciblage**. ✔
- Premier tir : 15 × 1000 ‰ × 1000 ‰ / 1000 = **15 000 milli-PV**, 200 000 → 185 000. ✔
- Après 33 ticks, le Fusilier est à **100 000 milli-PV, intact**. ✔
- La Crécelle morte, la Batterie **n'a plus aucune cible valide** (`cibleIndice: null`). ✔

> **Seuil corrigé en cours de rédaction.** J'avais d'abord écrit la mort de la
> Crécelle au tick 14 — `ceil(200 000 / 15 000)`, à dégâts constants. C'est
> faux : les trois pièces se tirent dessus au même tick et la formule pondère
> chaque tir par la santé **courante** du tireur. La Batterie encaisse 2 400
> milli-PV du Fusilier (8 × 300 ‰) et 2 400 de la Crécelle (12 × 200 ‰) au
> premier tick ; sa santé baisse, ses dégâts avec. La Crécelle tombe au
> **tick 15**. Le test reproduit les trois décroissances couplées depuis les
> seules données et exige que le moteur les suive **tick par tick** : c'est le
> calcul qui est porté, pas un nombre recopié d'une exécution.

Avant correction : ni le Fusilier ni la Crécelle ne perdaient un point de vie
en 33 ticks. Vérifié sur l'arbre du lot 3B.

### T2 — le facteur nul en général, des deux côtés · PASS

**Côté attaque.** Frappeur en (4,5), matrice {0, 0, 1}, portée 1,5 (2 250 000).
Meute défensive en (5,5) à 1 000 000, Merlon en (5,6) à 2 000 000 — **les deux
à portée** (2 000 000 ≤ 2 250 000), la Meute la plus proche. Il vise le
**Merlon**, et la Meute reste à 100 000 milli-PV. ✔
Le piège du brief est évité : le Merlon n'est **pas** en (6,5), où il serait à
2,0 cases et hors de portée. Le test asserte explicitement `2 000 000 ≤ portée²`.

**Côté défense.** Harpon en (8,5), portée 5,5 (30 250 000), portée minimale 3,5
(12 250 000). Fendeur en (4,5) à 16 000 000 (4,000), Crécelle en (4,7) à
20 000 000 (4,472). Les deux dans la fenêtre — asserté borne par borne —, le
Fendeur le plus proche. Il vise la **Crécelle** ; le Fendeur reste à
300 000 milli-PV. ✔

### T3 — la réserve vide invalide le bâtiment, pas le défenseur · PASS

Grenadier en (11,5), portée 1,5. Casemate en (10,5) et Gangue en (12,5),
**toutes deux à 1 000 000** — départagées par la seule validité.

- À `reserve: 0` : vise la **Casemate**, la Gangue reste à 150 000 milli-PV. ✔
- À `reserve: 1` : les deux redeviennent valides. Distance égale, colonne
  égale ; c'est le **troisième critère, la rangée la plus basse**, qui sort la
  **Casemate**. Ce n'est pas un hasard de montage : un défenseur vit entre les
  rangées 3 et 10, un bâtiment entre 11 et 18, donc **sur une égalité parfaite
  le défenseur est toujours le plus bas**. ✔
- Casemate retirée : à `reserve: 1` il vise la Gangue, à `reserve: 0` il n'a
  **aucune cible**. ✔ C'est ce couple qui prouve que la réserve rend bien le
  bâtiment de nouveau valide, et non que la Casemate serait un cas particulier.

### T4 — le Broyeur ne gèle plus · PASS

`blindeLourd` / avant-poste 15 / graine 1. `duree` t900 → **`attaquants` t542**.
Butin inchangé (55 251 quartz + 18 417 scorie), 2 survivants. ✔

### T5 — plus aucun ciblage stérile · PASS

Les 54 raids. **0** cible stérile survit à un ciblage, **0** raid finit par
`duree`, **0** ciblage stérile de la DCA. Garde de non-vacuité : le balayage
doit compter plus de 40 000 ticks-entités visant (il en compte 52 418) et
contenir des pièces anti-aériennes. ✔

### T6 — la cible conservée suit la même règle · PASS

Grenadier en (11,5) à `reserve: 1`. Gangue en (12,5) à 1 000 000, Casemate en
(10,4) à 2 000 000 — à portée mais plus loin. Tick 1 : il vise la **Gangue**
(plus proche et valide), tire 8 × 1000 ‰ = **8 000 milli-PV** (150 000 →
142 000), et l'étape 8 vide sa réserve. Tick 2 : il **change** pour la
Casemate, et la Gangue **ne reçoit plus rien**. ✔

### T7 — un seul prédicat · PASS

Test de source, sur `src/sim/combat.js` commentaires retirés :

- `peutNuire` n'apparaît plus, jusqu'à son nom ;
- `function degatsContre(` défini **exactement une fois** ;
- la règle de réserve — le seul morceau du prédicat qui ne soit pas la formule
  de dégâts — n'est écrite **qu'une fois**, dans `degatsContre` ;
- `degatsDUnTir(` n'est appelé que **deux fois** : par le prédicat et par le
  franchissement des barrières, qui est un autre mécanisme ;
- `nuit(e)` se réduit littéralement à `return e.aTire;`.

### T8 — monotonie · PASS

Sur les 54 raids : dès qu'un couple (tireur, cible) a été stérile une fois, le
tireur ne réélit **jamais** cette cible. **0 reprise.** Garde de non-vacuité :
plus de 100 couples deviennent effectivement stériles au cours du balayage.
L'enregistrement se fait **après** la vérification du tick, pour qu'un couple
devenu stérile en cours de tick ne compte pas comme une reprise.

### T9 — non-régression · PASS

98 tests du lot 3B → **106**, dont 8 neufs. Un seul test antérieur modifié (§8).

### T10 — build hors ligne · PASS

`npm run build` : `dist/index.html`, version 0.7.0 build 7, **55 213 octets
(53,9 Kio)**. Aucune URL `http://` ou `https://` dans le fichier produit. Le
build sort en erreur s'il en trouve une ; il n'a pas sorti en erreur.

---

## 8. Tests antérieurs modifiés

**Un seul.**

### T6 du lot 3B — `test/repli.test.js:267`

| Seuil | Avant | Après |
|---|---|---|
| butin | 65 190 quartz + 21 730 scorie | **82 849 quartz + 27 616 scorie** |
| survivants | 6 | **5** |
| cause et tick | `attaquants` t566 | inchangés |

**Raison** : c'est le raid C. Les tirs qui partaient dans le vide vont
désormais sur des cibles qu'ils entament — plus de bâtiments tombent, donc plus
de butin ; et la défense, qui ne gaspille plus ses tirs non plus, tue une unité
de plus. **La règle a changé, le repli n'a pas régressé** : l'assertion « au
moins une unité est rentrée à la base » tient toujours, et les 5 survivants
sont tous des unités repliées.

### Ceux qui ne bougent pas, et pourquoi

Le §4 du brief en désigne quatre. **Aucun n'a bougé.** Chacun est expliqué.

| Test | Attendu | Constaté | Raison |
|---|---|---|---|
| **T5 du lot 2A** — Meute contre Merlon, 209 ticks | ne doit **pas** bouger | ne bouge pas ✔ | matrice structure de la Meute = 0,3, non nulle. Le Merlon reste valide de bout en bout : la règle nouvelle ne mord sur rien. C'est le témoin négatif du lot. |
| **T5 bis du lot 2A** — réserve épuisée sur la Gangue | pouvait bouger | ne bouge pas | Le montage tourne avec `maxTicks: 25`. Mesuré : la Meute perd bien sa cible au **tick 16** (elle la conservait avant le lot 3C), mais son compteur d'inutilité ne démarre qu'au **tick 20** — jusque-là elle **progresse** encore, partie de 10 000 milli-cases à 50 par tick, elle n'est bloquée par la Gangue qu'à 10 950. Repli au **tick 49**, fin `attaquants`. La fenêtre de 25 ticks se referme bien avant. Les assertions `tick === 25` et `cause === 'duree'` tiennent. |
| **T14 du lot 2A** — fin par `duree` | pouvait bouger | ne bouge pas | Meute niveau 1 contre Merlon niveau 50 (240 470 840 500 milli-PV). Matrice 0,3, non nulle : la cible reste valide, l'unité nuit, elle ne se replie pas, et il lui faudrait cent millions de ticks. Le plafond de 900 est atteint pour la bonne raison — un raid **qui a une issue mais ne l'atteint pas**. |
| **T12 du lot 2B** — invariance du miroir | tolérance fragile, mesurée à 2‑3 ticks | ne bouge pas | Écart mesuré après le lot 3C : **0 tick** sur les quatre couples `[1,11] [8,16] [30,50] [1,50]`, tous à 117 ticks, même cause. Identique à la mesure du lot 2B. **Aucune tolérance n'a été élargie** : elle reste à 1 tick, et l'écart réel est nul. |

---

## 9. Effet mesuré sur la couche anti-aérienne

Balayage des 18 raids `mixte` (les seuls dont l'assaut contient des aéronefs :
Crécelle, Frappeur, Busard).

| Raid | Pièces DCA | Avant : premier tir | tirs | Après : premier tir | tirs |
|---|---|---|---|---|---|
| camp/1 | 1 | t115 → **fendeur** | 133 | t120 → **frappeur** | 18 |
| camp/2 | 1 | t111 → **meute** | 71 | t119 → **frappeur** | 21 |
| camp/3 | 2 | t108 → **fendeur** | 140 | t120 → **frappeur** | 19 |
| camp/7 | 1 | t108 → **fendeur** | 168 | *jamais* | 0 |
| camp/11 | 1 | t111 → **meute** | 93 | t119 → **frappeur** | 22 |
| camp/42 | 0 | — | 0 | — | 0 |
| avant-poste/1 | 1 | t116 → **meute** | 89 | t120 → **frappeur** | 14 |
| avant-poste/2 | 2 | t111 → **meute** | 78 | t119 → **frappeur** | 26 |
| avant-poste/3 | 3 | t109 → **belier** | 181 | t115 → **frappeur** | 25 |
| avant-poste/7 | 1 | t119 → frappeur | 79 | t119 → **frappeur** | 14 |
| avant-poste/11 | 2 | t111 → **meute** | 179 | t120 → **frappeur** | 16 |
| avant-poste/42 | 1 | t115 → **fendeur** | 143 | t120 → **frappeur** | 20 |
| base/1 | 1 | t108 → **fendeur** | 223 | t122 → **frappeur** | 7 |
| base/2 | 2 | t108 → **fendeur** | 40 | t120 → **frappeur** | 12 |
| base/3 | 4 | t91 → **meute** | 235 | t115 → **frappeur** | 32 |
| base/7 | 1 | t119 → frappeur | 14 | t119 → **frappeur** | 9 |
| base/11 | 2 | t111 → **meute** | 93 | t120 → **frappeur** | 12 |
| base/42 | 1 | t111 → **carapace** | 12 | t122 → **frappeur** | 4 |

En gras, les cibles au sol : Bélier, Fendeur, Carapace et Meute ont tous un
facteur **0** dans la matrice de la Batterie. **Les tirs d'avant étaient des
tirs à blanc.** Le compte de tirs s'effondre — **1 971 contre 271** — parce
qu'une Batterie ne « tire » plus qu'en présence d'un aéronef dans sa bulle de
2,5 cases, au lieu de mitrailler en continu l'infanterie collée à elle.

Contribution **propre** de la DCA aux aéronefs abattus (dégâts recalculés tir
par tir, pas une différence de PV qui mélangerait les tireurs) :

| Raid | Crécelle | Frappeur | Busard |
|---|---|---|---|
| avant-poste/3 | 50,6 % | 49,7 % | 57,5 % |
| base/3 | 79,3 % | 59,6 % | 47,4 % |
| camp/1 | 0,0 % | 30,0 % | 97,4 % |

**De 0 % à la moitié ou plus des dégâts qui abattent un aéronef.** Les 10 % de
points d'armée qu'une garnison met en Batteries ne sont plus jetés.

### Le raid dont l'issue bascule

`mixte` / camp 15 / graine 2 :

| | Avant | Après |
|---|---|---|
| issue | `attaquants` t360 — **raid repoussé** | `souche` t518 — **site pris** |
| butin | 58 122 quartz + 19 374 scorie | **215 130 quartz + 71 710 scorie** |
| survivants | 2/12 | 2/12 |

**×3,7 sur le butin.** C'est le seul des 54 raids dont la cause de fin bascule
en faveur de l'attaque. Il n'y a pas de contradiction avec le renforcement de
la DCA : la règle profite **aux deux camps**, et l'assaut mixte y gagne plus
qu'il n'y perd ici.

---

## 10. Ce qu'Ethan doit revoir sur l'appareil

### Le raid à ouvrir en premier

| | |
|---|---|
| préréglage | **Mixte** |
| type de site | **avant-poste**, niveau **15** |
| saveur | **riche en quartz** |
| graine | **3** |

Trois Batteries dans la garnison, en (10,4), (10,2) et (9,5).

**La DCA ouvre le feu au tick 115**, sur le **Frappeur** — c'est la première
fois qu'elle tirera pour de bon depuis que le jeu existe. Elle place 25 tirs.
Le Frappeur tombe au tick 120, la Crécelle au 138, le Busard au 163.

Ce qu'il faut regarder, dans l'ordre :

1. **Tick 115.** Les trois Batteries s'allument ensemble. Avant, elles tiraient
   depuis le tick 109 sur un Bélier, 181 fois, sans lui retirer un point.
2. **Ticks 115 à 163.** Les traits partent vers les aéronefs et **seulement**
   vers eux, même quand de l'infanterie est collée à la tourelle.
3. **Le silence.** Hors de ces fenêtres, une Batterie sans aéronef à 2,5 cases
   **ne tire pas du tout**. C'est le changement visuel le plus net, et il est
   voulu.

### Le raid qui montre que la DCA peut rester muette

`mixte` / camp 15 / graine 7 : une seule Batterie, **aucun tir de tout le
raid** (168 tirs à blanc avant). Aucun aéronef n'entre jamais dans sa bulle ;
la Crécelle traverse et **sort du champ**. Une DCA muette n'est plus un défaut
d'affichage — c'est l'information juste.

### Ce qui demande un arbitrage, pas une correction

- **Le calibrage anti-aérien.** La couche est vivante pour la première fois ;
  ses valeurs n'ont jamais été observées en vol. Les aéronefs tombent presque
  aux mêmes ticks qu'avant sur `avant-poste/3` (138/120/163 contre 138/121/163),
  parce que le reste de la garnison suffisait déjà. La DCA fournit désormais la
  moitié des dégâts — mais elle n'avance pas la mort d'un aéronef. À toi de dire
  si c'est le bon dosage.
- **Le basculement de `camp/2`.** ×3,7 sur le butin d'un raid. Toutes les
  observations d'équilibre antérieures au lot 3C sont à refaire ; c'est
  annoncé par le §2 du brief, mais l'ampleur mérite d'être vue.

---

## 11. Points laissés en suspens

### La santé à 0 ‰ fige encore un défenseur — **inchangé depuis le lot 3B**

Une entité dont les PV tombent sous 1 ‰ de son maximum a une santé arrondie de
0 et **ses tirs ne retirent plus rien**. C'est une propriété émergente de la
quantification de la santé en millièmes, arbitrée en cours de lot 2A.

Le lot 3C **change le symptôme mais pas la cause** : une telle entité n'a plus
aucune cible valide, donc elle ne vise plus rien au lieu de tirer à blanc. Côté
attaque, le repli du lot 3B la sort du champ au bout de 30 ticks. **Côté
défense, il n'y a pas de repli** : elle reste sur la grille, vivante, bloquante
et parfaitement inoffensive, jusqu'à ce qu'on l'achève.

Mesuré : 25 des 41 lectures résiduelles du §6 sont dans ce cas. Deux exemples
reproductibles — `blindeLourd/camp/1` tick 144, un Grenadier défensif à
2 206 milli-PV sur 2 897 400 ; `blindeLourd/camp/7` tick 99, à 240 sur
2 897 400.

**Ce n'est plus un défaut fonctionnel** — aucun raid n'expire plus, aucun
ciblage n'est stérile — mais c'est une **question de modèle** que je ne peux
pas trancher seul : faut-il qu'une entité sous 1 ‰ soit considérée comme
détruite ? Faut-il un plancher de dégâts à 1 milli-PV ? Faut-il l'accepter
telle quelle ? Signalé au lot 3B, je le reconduis ici sans l'avoir corrigé,
parce que le corriger serait changer une règle arbitrée.

### La convention de comptage des ticks stériles

Mes chiffres et ceux du §2 du brief diffèrent (§5). J'ai fixé et documenté ma
convention plutôt que de reconstituer la sienne. Si tu veux comparer aux
chiffres du brief plutôt qu'aux miens, il faut d'abord fixer la convention.

---

## 12. Les sept contrôles du §6

| Contrôle | État |
|---|---|
| le prédicat de validité est écrit **une seule fois** et utilisé par le ciblage comme par le repli | ✔ `degatsContre()`, `src/sim/combat.js:713`. Vérifié **par le code** : T7 asserte une définition unique, une seule écriture de la règle de réserve, et deux appels seulement à `degatsDUnTir`. |
| la monotonie est consignée en commentaire **à l'endroit du test** | ✔ `src/sim/combat.js:957‑962`, dans l'en-tête de `nuit()`, et rappelée à la branche de conservation du ciblage (`:763‑764`). Éprouvée par T8. |
| aucun nouveau paramètre n'a été introduit | ✔ `src/data/` n'est pas touché. Le prédicat se déduit de `degatsDUnTir()` et de la règle de réserve, toutes deux préexistantes. |
| chaque seuil déplacé figure au rapport avec ses deux valeurs et sa raison | ✔ §8 — un seul test modifié, T6 du lot 3B. Les quatre candidats du §4 qui **n'ont pas** bougé sont expliqués un par un. |
| aucune tolérance de test n'a été élargie en silence | ✔ Aucune tolérance élargie du tout. T12 du lot 2B reste à 1 tick, écart réel mesuré 0. |
| `npm run check` passe | ✔ build + **106 tests PASS, 0 KO**. |
| aucun `.xlsx` ouvert | ✔ Aucun. Les valeurs viennent de `src/data/combat.js` et de `src/data/sites.js` seuls. |
