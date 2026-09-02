# RAPPORT — lot RAID-B : l'Ouvrage attaque

Exécuté le **02/09/2026**. Base de départ : `main` à `a339699` (après RAID-A).

---

## 1. Version et build produits

| Grandeur | Avant | Après |
| --- | --- | --- |
| `package.json` version | 0.62.0 | **0.63.0** |
| `config.build` | `"63"` | **`"64"`** |
| `dist/index.html` | 1 370 976 o | **1 376 307 o** |
| `SAVE_VERSION` | 19 | **20** |

Les deux champs restent des **chaînes** — `android/app/build.gradle.kts` les lit
`as String`, et un nombre y fait tomber le build Android à la configuration.

---

## 2. Base de référence du §1 — retrouvée, les quatre nombres

Mesurée sur le clone avant toute modification :

| Grandeur | Attendu | Mesuré |
| --- | --- | --- |
| version / build | 0.62.0 / 63 | **0.62.0 / 63** ✅ |
| `dist/index.html` | 1 370 976 octets | **1 370 976** ✅ |
| `node --test "test/*.test.js"` | 820 / 820 / 0 | **820 pass, 0 fail** ✅ |
| `SAVE_VERSION` | 19 | **19** ✅ |

Aucun `RAPPORT-lotRAID-B.md` n'existait à la racine.

---

## 3. Delta d'octets, tests avant / après

- **+5 331 octets** (1 370 976 → 1 376 307). Du code et rien d'autre : **aucune
  image n'entre**. Mesuré des deux côtés, `grep -c "data:image/png;base64,"` →
  **16 avant, 16 après**.
- Marge sous la borne T10 (1 400 000) : **23 693 octets, soit 1,69 %**. C'est la
  marge la plus mince depuis RETOURS-DU-31 (1,97 %). La borne **n'a pas été
  relevée** : ce lot ne fait entrer aucune ressource.
- Tests : **820 → 843**, 0 fail. +23 dans `test/raid-ouvrage.test.js` (fichier
  neuf).

---

## 4. Chaque test du §6, avec sa falsification effectivement jouée

Toutes les falsifications ont été jouées **sur une copie fraîche du dépôt**,
jamais sur l'arbre de travail. Le tableau donne, pour chacune, ce qui est tombé.

| # | Verdict | Falsification jouée | Résultat |
| --- | --- | --- | --- |
| **T1** | **PASS** | Le hachage remplacé par un `let fluxConserve` créé une fois et consommé d'appel en appel | **7 tests tombent**, dont T1, T1 bis, T1 ter, T2, T3, T11 |
| **T1 bis** | **PASS** | (même montage) | tombe |
| **T1 ter** | **PASS** | (même montage) | tombe — le `let` de niveau module est refusé de face |
| **T2** | **PASS** | — (le brief n'en demande pas ; T2 vérifie aussi qu'une AUTRE graine ne rend pas la même liste, sans quoi « reproductible » voudrait seulement dire « constant ») | — |
| **T2 bis** | **PASS** | — | — |
| **T3** | **PASS** | `rattraperJeu` ramasse tous les raids de la fenêtre, avance d'un coup, puis les résout **à l'envers** | **3 tests tombent** : T1, T3, T11 |
| **T4** | **PASS** | `modulesDebloques.joueur.defense` laissé **vide** | T4 tombe, seul |
| **T5** | **PASS** | `genererSite` rappelé pour fabriquer les bâtiments | T5 tombe, seul |
| **T6** | **PASS** | Filtre `niveau >= niveauMinimal` retiré | T6 tombe, seul |
| **T7** | **PASS** | Rappel de `releverLesPoisAcquis` omis après le rasage | T7 tombe, seul |
| **T8** | **PASS** | Borne de carte retirée (`rangeeApres = voulue`) | T8 tombe, seul |
| **T9** | **PASS** | Réserve non vidée (`if (false && …)`) | T9 tombe, seul |
| **T10** | **PASS** | `reparerLaGarnison` non appelée | T10 tombe, seul |
| **T10 bis** | **PASS** | — (garde de prose : refuse le retour de « ÉCRIT ET INATTEIGNABLE ») | — |
| **T11** | **PASS** | `pop()` au lieu de `shift()` — garder les dix **premiers** | T11 tombe, seul |
| **T12** | **PASS** | Migration 19 → 20 qui n'ajoute rien | T12 tombe, seul |
| **T12 bis** | **PASS** | — | — |
| *hors brief* : pièce sur obstacle | **PASS** | Filtre des pièces sur obstacle retiré | tombe, seul |
| *hors brief* : le Chantier ne planche pas | **PASS** | Le Chantier planche comme les dix autres | T7 tombe |
| *hors brief* : les onze bâtiments au combat | **PASS** | — | — |
| *hors brief* : `prochaineMinuteDeRaid` ne résout rien | **PASS** | — | — |

### Trois tests ont été RESSERRÉS après avoir passé VERT sur du code cassé

1. **T6 ne mesurait rien.** Il regardait une partie NEUVE : la garde du
   peuplement écarte toute base de quinze cases du départ, donc il n'y a
   **aucune** base à portée, donc « aucune attaquante » est vrai avec ou sans le
   filtre de niveau. Il regarde maintenant la **rangée 255**, où la fenêtre porte
   des bases des deux côtés du seuil (23 sous, 19 au-dessus sur la graine 7), et
   il compte.
2. **T7 ne mesurait rien non plus.** À n'importe quelle position, `poisAcquis`
   reste vide avant comme après le rasage — c'est `POI T24` : la garde du
   peuplement et le disque de rayon 2 du territoire sont disjoints par
   construction. Le montage plante donc la base **vingt cases exactement
   au-dessus d'un POI** (graine 7, rangée 255, colonne 13) : rien avant, un POI
   après. C'est le seul montage où omettre le rappel se voit.
3. **T11 ne distinguait pas une file d'une pile.** `pop()` au lieu de `shift()`
   laisse la liste triée, longue de dix, pleine de rapports valides — mais le
   joueur qui revient après trois jours lit son premier soir et jamais ce qui
   vient de se passer. T11 mesure maintenant `garderLeRapport` de face, sur
   quinze rapports numérotés.

### Une falsification qui n'en était pas une, et qui a fait corriger un commentaire

J'avais écrit que `chantierTombe` **devait** précéder l'écriture des dégâts, au
motif que le report « relèverait » le Chantier au-dessus de zéro. La
falsification qui lit l'état après coup est passée **entièrement verte** : le
Chantier est le seul bâtiment sans plancher, donc il tombe vraiment à zéro et les
deux lectures coïncident. Le commentaire disait plus que ce qui est vrai — il a
été **réécrit** pour dire ce qui l'est : ce n'est pas l'ordre qui protège, c'est
la SOURCE (`ligne.detruit` du résultat, jamais `piece.degatsMilli` de l'état), et
la différence n'apparaîtrait que si le Chantier gagnait un plancher.

C'est la même leçon qu'au lot RÉSERVE : **vérifier qu'on a bien injecté un défaut
avant d'accuser la garde.**

### Une falsification qui est un no-op, et qui se dit

Inverser la boucle de `resoudreLesMinutes` (`for m = minuteApres; m > minuteAvant; m -= 1`)
ne fait **rien** tomber, et c'est exact : appelée depuis `tickJeu`, cette fenêtre
ne dépasse jamais une minute. La généralité de la boucle est une ceinture, pas un
mécanisme — l'ordre chronologique qui compte est celui du **découpage** de
`rattraperJeu`, et c'est là que la falsification de T3 mord.

---

## 5. M1 et M2

### M1 — coût d'un rattrapage de 72 h

Mesuré sur **30 configurations** : rangées 110 à 200 par pas de 10, trois graines
chacune, base montée à douze bâtiments de niveau 50 et garnison pleine.

| Grandeur | Valeur |
| --- | --- |
| **Pire cas mesuré** | **327 ms** (rangée 150, graine 9) |
| Médiane | ≈ 160 ms |
| Meilleur cas | 83 ms |
| **Seuil d'arrêt du brief** | 1 000 ms |

**Sous le seuil, largement.** Le coût BRUT est de **12,4 ms par raid**, mesuré
sur 124 raids ; ce qui borne le total, c'est un fait de jeu et non une
optimisation : **le rasage est aussi le frein.** Il redéploie la base de vingt
cases vers le bas, donc hors de portée de ses attaquantes ; une base qui tombe
huit fois en 72 h sort de la zone dangereuse à la moitié de l'absence.

⚠ **Le pire cas théorique, lui, dépasse.** En neutralisant le rasage — une base
qui repousserait chaque assaut à la rangée 50 —, 124 raids × 12,4 ms font
**1 532 ms**. Ce n'est atteignable en jeu par aucune configuration mesurée, mais
c'est le nombre qui bougera le jour où l'équilibrage rendra la défense du joueur
capable de tenir face à des bases de niveau 50. **À remonter à Ethan si ce jour
arrive** : le curseur est `RAID_OUVRAGE.chanceParMinute`, et il ne se touche pas
sans lui.

### M2 — nombre moyen de raids subis sur 24 h, **150 graines**

| Rangée | Bases à portée | Raids / 24 h | Médiane | Min | Max | Espérance | Écart |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 200 | 36,0 | **36,49** | 37 | 18 | 56 | 36,01 | **+1,33 %** |
| 150 | 36,8 | **36,92** | 37 | 22 | 53 | 36,75 | **+0,45 %** |
| 100 | 36,3 | **36,06** | 36 | 20 | 58 | 36,33 | **−0,75 %** |
| 50 | 36,8 | **36,42** | 36 | 20 | 56 | 36,79 | **−1,01 %** |

Le tirage colle à l'espérance arithmétique à **1,4 % près au pire**, ce qui est
ce qu'on attend d'un hachage : il ne biaise pas.

⚠⚠ **ET LE BRIEF SE TROMPAIT D'UN FACTEUR SEPT SUR LE NOMBRE DE BASES.** Son §4.2
raisonnait sur « cinq bases à portée » ; **mesuré, il y en a entre 30 et 45**
selon la rangée et la graine. Le nombre de raids est donc de **36 par jour**, pas
de cinq. **C'est une MESURE, pas un réglage** : je n'ai touché aucun nombre de
`RAID_OUVRAGE`, et l'équilibrage est à Ethan seul. Si 36 raids par jour lui paraît
beaucoup, le curseur est `chanceParMinute` — une ligne de `src/data/sites.js`.

---

## 6. Les deux lectures prises

### 6.1 — Les verdicts vus du côté de celui qui se défend (§2.6)

`verdictDeLaDefense` est le miroir exact de `verdictDuRaid` du 01/09 :

| Situation | Verdict |
| --- | --- |
| La base est rasée | `defaite-totale` |
| Des bâtiments ont perdu des PV | `defaite` |
| Rien n'a été touché | `victoire-totale` |

Ethan avait annoncé que « Défaite apparaîtra en défense ». **Si Ethan décide
autrement** — par exemple qu'une attaque repoussée avec des pertes de garnison
n'est pas une « victoire totale » —, c'est **une fonction de sept lignes** dans
`src/sim/raid-ouvrage.js`, et rien d'autre.

### 6.2 — Un raid qui passe vide la réserve de réparation (§2.7)

`MODELE-ECONOMIQUE.md` §7 : « un raid qui passe fait tomber la production et vide
le réservoir de réparation ». Le mécanisme n'existait pas quand la phrase a été
écrite ; il existe depuis le lot RÉSERVE. C'est implémenté.

⚠ **« Qui passe » a été lu comme « qui a fait des dégâts »**, pas « qui a eu
lieu » : une attaque entièrement repoussée ne vide rien. Punir une défense qui a
fait son travail serait le contraire de ce que la phrase décrit. Un test le tient
des deux côtés (T9 et T9 bis).

⚠ **La seconde moitié de la phrase — « fait tomber la production » — n'est PAS
implémentée**, et c'est délibéré : rien ne dit de combien ni pour combien de
temps, et l'inventer figerait un barème sous l'apparence d'une donnée relevée.
Les bâtiments abîmés produisent donc à plein (voir §8).

**Si Ethan n'en veut pas** : c'est le bloc `if (aPerduDesPv)` de `subirUnRaid`,
cinq lignes, plus le champ `reserveVidee` du rapport.

---

## 7. Le commentaire de rupture de `rattraperJeu` l. 397, tel que réécrit

Avant :

> ⚠ ET VOICI SA CONDITION DE RUPTURE, ÉCRITE : le jour où la base pourra se
> DÉPLACER en cours de rattrapage, cette ligne cessera d'être juste — le
> territoire aura balayé des cases que ce seul appel n'aura jamais vues. C'est le
> test d'équivalence des deux chemins qui doit tomber en premier.

Après :

> ⚠⚠ ET SA CONDITION DE RUPTURE EST ADVENUE — lot RAID-B, 02/09/2026. Elle
> annonçait : « le jour où la base pourra se DÉPLACER en cours de rattrapage,
> cette ligne cessera d'être juste — le territoire aura balayé des cases que ce
> seul appel n'aura jamais vues ». Ce jour est celui du rasage : la sanction de
> `RAID_OUVRAGE` redéploie la base de vingt cases vers le bas, et elle peut tomber
> au milieu d'une absence de trois jours.
>
> ⚠ CE QUI LA TRAITE : le rattrapage ne fait plus UN appel mais un par SEGMENT, et
> `subirUnRaid` rappelle lui-même `releverLesPoisAcquis` à l'instant du rasage. La
> ligne ci-dessous redevient donc juste au sens strict — pendant un segment, la
> base ne bouge pas, par construction, puisqu'un segment s'arrête à chaque raid.
> C'est T7 qui le mesure, avec la falsification qui retire le rappel : les POI de
> l'ancienne position survivent alors au déménagement.

Un **second** commentaire périmé a été trouvé et corrigé : celui de
`reparerLaGarnison` dans `src/sim/raid.js`, qui annonçait « l'effet est ÉCRIT ET
INATTEIGNABLE EN JEU tant que les attaques sur la base n'existent pas ». Elles
existent. Un test (T10 bis) refuse le retour de la formule.

Et une **troisième** rupture a été écrite, celle du lot : la boucle de découpage
de `rattraperJeu` est bornée par le nombre de raids retenus, pas par le nombre de
ticks, et cesserait d'être tenable si `chanceParMinute` montait d'un ordre de
grandeur.

---

## 8. Le recensement du §5.1 — qui lit `disposition` et `garnison`

Grep sur l'accès, fichier par fichier, verdict compris quand il ne change rien.

### `etat.disposition`

| Fichier | Ce qu'il lit | Verdict |
| --- | --- | --- |
| `sim/state.js` (27) | `id`, `rangee`, `colonne`, `niveau` — pose, amélioration, démolition, déplacement, emplacements, budgets | **ne change pas** — aucun ne lit `degatsMilli` |
| `ui/chantier.js` (24) | idem, plus le dessin des jetons | **ne change pas** — un bâtiment abîmé se dessine intact (voir « points en suspens ») |
| `sim/missions.js` (4) | `niveau` et `length` | **ne change pas** |
| `sim/satellites.js` (1) | `niveauDesBatiments(etat.disposition)` | **ne change pas** |
| `sim/reparation.js` (1) | `.find((b) => b.id === id)` puis `niveau` | **ne change pas** |
| `sim/raid.js` (1) | `capacitesMilli(etat.disposition)` | **ne change pas** |
| `ui/monde.js` (1) | `niveauDesBatiments` | **ne change pas** |
| `sim/economie-base.js` | `debitsMilliParHeure` — `id`, `niveau`, voisinage | **ne change pas** — un bâtiment abîmé produit à plein |
| `sim/disposition.js` | légalité, voisinage, débits | **ne change pas** |
| `sim/niveau-de-base.js` | `niveau` seulement | **ne change pas** — un bâtiment abîmé compte toujours dans la moyenne |

### `etat.garnison`

| Fichier | Ce qu'il lit | Verdict |
| --- | --- | --- |
| `ui/chantier.js` (7) | pose, déplacement, retrait, points engagés | **ne change pas** — il lisait déjà `degatsMilli` sans qu'il soit jamais non nul |
| `sim/raid.js` (2) | `reparerLaGarnison`, qui écrit `degatsMilli` | **CHANGE** : l'effet devient atteignable (T10) |
| `sim/state.js` (2) | validation, points engagés | **ne change pas** |
| `sim/missions.js` (1) | `niveauDeLaDefense` | **ne change pas** |
| `sim/raid-ouvrage.js` (4) | le montage et le report des dégâts | **neuf** |

### Ce qui change VRAIMENT, et c'est `etat.position`

Le rasage déplace la base. Les lecteurs de `position` ont été regardés un par un :

- `champs` et `obstacles` dérivent de **`fondation`**, qui ne bouge pas : le
  terrain suit la base, arbitrage du 27/08. **Vérifié par un test.**
- `releverLesPoisAcquis` est **rappelé** à l'instant du rasage (T7).
- `sim/carte.js` (niveau de la rangée), `points-attaque` (territoire),
  `site-de-la-case` (cibles à portée) : tous **recalculent** à chaque demande,
  rien n'est stocké.
- `sim/satellites.js` : les satellites DÉJÀ POSÉS ne bougent pas et peuvent se
  retrouver hors de portée après un rasage. Voir « points en suspens ».

---

## 9. Écarts par rapport au brief

1. **`src/sim/combat.js` a été ouvert, sur arbitrage d'Ethan.** Le §3 le classait
   « à ne pas toucher », mais le §4.3 demandait `batiments ← etat.disposition,
   PV réels` — et `creerCombat` ne connaissait que les CINQ bâtiments de
   l'Ouvrage : monter un `chantierDeConstruction` levait « identifiant inconnu »,
   mesuré avant de poser la question. Ethan, le 02/09 : **« Ouvrir combat.js »**.
   La modification fait 20 lignes : un import, un constructeur qui **réemploie**
   `profilBatiment`, une boucle et un garde-fou de collision de clé.
2. **La signature de `montageDeLaBaseDuJoueur` prend quatre arguments**, pas
   trois. Le brief écrivait `(etat, budgetPoints, graine)` ; il manque le
   **niveau de l'attaquant**, dont `genererVague` et `creerCombat` ont tous deux
   besoin. Signature retenue :
   `montageDeLaBaseDuJoueur(etat, niveauAttaquant, budgetPoints, graine)`.
3. **Le montage porte deux listes d'INDICES**, `indicesBatiments` et
   `indicesDefenseurs`, que le brief ne demandait pas. `creerCombat` REFUSE une
   pièce posée sur un obstacle, or `CODES_TOLERES_AU_CHARGEMENT` **tolère
   exactement ce cas** — le terrain se redéduit à chaque chargement, donc un
   rocher peut se poser sous une pièce placée légalement la veille. Sans le
   filtre, un raid de l'Ouvrage aurait **levé** sur un état que le jeu déclare
   jouable. C'est le motif de `composerLesVagues`, repris tel quel.
4. **Le brief se trompait sur deux points de fait**, tous deux vérifiés :
   - §3 localise `enDefenseurs` dans `src/sim/defense.js` : il est dans
     `src/ui/defense.js`, et il consomme l'état de l'**éditeur** (`etat.cases`,
     `etat.niveau`), pas `etat.garnison`. Il n'était donc **pas réutilisable** :
     la conversion est écrite dans `montageDeLaBaseDuJoueur`, où elle tient en
     six lignes parce que `etat.garnison` porte déjà la bonne forme.
   - §4.1 écrit « `TICK_MS = 10` dans `clock.js` » : il vaut **100**. La
     conclusion du paragraphe — 600 ticks par minute — reste juste.
5. **Le rapport de raid OFFENSIF gagne un champ `sens: 'offense'`.** Le brief ne
   le demandait pas ; sans lui, la liste des dix mêlerait des rapports déclarés
   et des rapports muets, et le premier lecteur qui oublierait le cas afficherait
   une défaite comme une victoire.
6. **`reparerLaGarnison` et `garderLeRapport` de `src/sim/raid.js` sont
   exportés.** Ils étaient privés ; le §4.4 exige que le raid de défense les
   appelle tous les deux, et les recopier aurait fait deux journaux et deux
   auto-réparations.
7. **`raseLeSite: true` entre dans `BASE_BATIMENTS.chantierDeConstruction`**, sous
   le même nom que `BATIMENTS.souche`. C'est du calibrage, donc `src/data/`.

---

## 10. Points en suspens

1. **Rien ne répare un bâtiment du joueur.** `REPARATION_BASE_JOUEUR.courbe` vaut
   toujours `null` — Ethan avait dit QUI décide du barème (le Chantier), pas de
   combien. Un bâtiment abîmé le reste donc pour toujours, et une base rasée garde
   son Chantier à zéro PV. **C'est le prochain trou**, et il est plus visible
   qu'avant ce lot : jusqu'ici aucun bâtiment ne pouvait être abîmé.
2. **Un bâtiment abîmé n'a aucun effet de jeu**, hors du raid suivant. Il produit
   à plein, il compte dans la moyenne de niveau, il ouvre ses emplacements. C'est
   la moitié non implémentée de `MODELE-ECONOMIQUE.md` §7 (« fait tomber la
   production ») : le barème n'existe pas.
3. **Un bâtiment abîmé se dessine intact.** L'atlas porte pourtant les onze
   sprites `bat_j_*_detruit`, payés et inutilisés. C'est un lot d'interface d'une
   demi-journée, et il n'était pas au périmètre.
4. **Les satellites ne suivent pas un rasage.** `planifierSatellites` n'est appelé
   qu'à la fondation ; après un redéploiement de vingt cases, les camps posés
   restent où ils sont et peuvent sortir de l'anneau. La §10 de la spec indexe
   l'avant-poste sur « le rayon et la PRÉSENCE du joueur », ce qui plaide pour
   qu'ils disparaissent — mais c'est un arbitrage, pas une lecture, et je ne l'ai
   pas pris.
5. **Le joueur ne voit rien.** Les rapports de défense rejoignent la liste des dix
   et **aucun écran ne lit `etat.rapports`** — ni avant ce lot, ni après. Un
   joueur qui revient après trois jours trouve sa base rasée, ses stocks à zéro et
   **aucun message**. C'est le hors-périmètre du §0 pris au mot ; c'est aussi ce
   qui manque le plus à ce lot du point de vue d'Ethan.
6. **Le pire cas théorique de M1 dépasse la seconde** (1 532 ms), sans être
   atteignable en jeu aujourd'hui. À remesurer le jour où la défense du joueur
   pourra tenir face à des bases de niveau 50.
7. **36 raids par jour est une mesure, pas un réglage.** Sept fois ce que le brief
   supposait. Le curseur est `RAID_OUVRAGE.chanceParMinute`, une ligne de
   `src/data/sites.js`, et il appartient à Ethan.

---

## 11. Ce qui a été lancé, et ce qui ne l'a pas été

- `npm run check` (build + suite) : **843 pass / 0 fail**, `dist/index.html`
  **1 376 307 octets**, **0 référence externe**.
- **Boot sans tête** (Chromium préinstallé, `playwright-core` hors du dépôt,
  412 × 915) : démarrage **sans une seule erreur** ; les sept écrans sont là ;
  une sauvegarde **v19 authentique, sans `degatsMilli`**, se charge sans erreur ;
  une **v20 dont la base a été rasée** aussi.
- `python3 tools/verifier.py` : **NON LANCÉ, et c'était conforme** — le lot ne
  touche ni `art/`, ni `tools/`. Son dernier verdict connu reste celui de
  MUR-DE-CONTOUR.
- `node tools/audit-maquette.mjs` : **non lancé** — le lot ne touche pas
  `foyer-zero-ui.html`.
