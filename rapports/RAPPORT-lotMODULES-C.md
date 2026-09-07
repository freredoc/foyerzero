# RAPPORT — lot MODULES-C

Le **Bouclier**, porté par l'Enclume. Un seul module, mais **le premier qui
touche à `appliquerDegats`**, et le seul qui donne à une entité un réservoir qui
lui survit d'un tick à l'autre.

Exécuté le **31/08/2026** sur `origin/main` remis à neuf (`git fetch` puis
`git reset --hard origin/main` → `0db2322`, arbre propre), branche
`claude/lot-modules-c`.

---

## 1. Ce qui a été produit

| | avant (MODULES-B) | après (MODULES-C) | delta |
|---|---|---|---|
| `package.json` version | 0.52.0 | **0.53.0** | — |
| `config.build` | 53 | **54** | — |
| `SAVE_VERSION` | 14 | **14** | inchangé |
| `npm run check` | 682 pass / 0 fail | **692 pass / 0 fail** | **+10 tests** |
| `dist/index.html` | 1 261 788 o | **1 262 193 o** | **+405 o** |
| Marge sous la borne T10 (1 300 000) | 38 212 o · 2,94 % | **37 807 o · 2,91 %** | −405 o |
| `node tools/audit-maquette.mjs` | ROUGE, 7 écarts, rc=1 | **ROUGE, 7 écarts, rc=1** | **identique à la ligne** |

**Enveloppe respectée, et de loin** : +405 octets sur les 2 000 annoncés au §5
du brief — un cinquième. Aucune image, aucun écran neuf, aucun champ de
sauvegarde. Le brief demandait un module et pas trois ; il en a eu un.

**Dix tests neufs, 682 → 692.** La ligne de base du brief annonçait 682 : elle a
été **mesurée** sur `origin/main` avant le premier geste, et elle est exacte.
Quatre tests existants ont par ailleurs été **réécrits sur place** — ils ne
changent pas le compte, mais ils changent de contenu : voir §3. La garde
`documentation` de `CLAUDE.md` §0 est à jour à chaque étape.

`version` et `config.build` sont des **chaînes**, et ils ont été bumpés
ensemble. Le brief ne proposait aucun numéro : 0.53.0 · 54 suit la série.
Vérifié après `git fetch --all` : **`origin/main` est la seule branche distante**,
et elle porte 0.52.0 · 53 — aucun numéro plus haut ailleurs.

---

## 2. Ce qui a changé, fichier par fichier

**`src/data/modules.js`** — un drapeau retourné, `cable: {offense: true,
defense: false}` pour `bouclier`, avec le commentaire qui dit **pourquoi la
défense reste fausse, et que c'est un constat et non un arbitrage** : l'Enclume
est le seul porteur du jeu (`data/combat.js`, `module: 'bouclier'`), et aucun
profil ne porte `bouclier` en `moduleOuvrage` ni en `moduleJoueur`. Le câbler en
défense ouvrirait une ligne d'achat sans aucune pièce derrière. C'est mesuré,
pas supposé : `MODULES-C T10` asserte `porteurs.defense == []`.

**`src/sim/combat.js`** — trois endroits.

1. `ajouterEntite` : le champ **`bouclierMilli: 0`** dans le littéral d'entité,
   et juste après lui, avant le `push`, la pose au montage
   `if (moduleActif(etat, entite, p, 'bouclier')) entite.bouclierMilli = pvMaxMilli;`.
   ⚠ **Vérifié et non supposé** : `creerCombat` remplit `etat.modulesDebloques`
   aux lignes 638-641, et le premier `ajouterEntite` n'arrive qu'à la ligne 668
   — `moduleActif` est donc appelable au montage. Le poser au premier tick
   laisserait passer un tick de tir sans protection.
2. La constante **`BOUCLIER_RAYON_CARRE = 2500 * 2500`**, avec le ⚠ qui dit
   pourquoi ce n'est pas `2.5 * 2.5`.
3. `appliquerDegats` : le **tri du tampon** puis l'**absorption**.

**`test/recherche.test.js`** — dix tests neufs, `MODULES-C T1` à `T10`, deux
aides (`sceneBouclier`, `bouclierStabilise`), et **quatre tests existants mis à
jour** : voir §3.

**`CLAUDE.md`** — §0 (compte de tests, octets, marge, série des marges, verdict
d'audit, ligne d'historique MODULES-B) et cinq entrées neuves au journal §6,
« Sur le moteur de combat ».

⚠ **Ni `art/`, ni `tools/*.py`, ni `SAVE_VERSION` n'ont été touchés**, conforme
au §0 du brief. `tools/verifier.py` n'a donc pas été lancé, et c'était conforme.

---

## 3. Les quatre tests existants qui ont dû être réécrits

Ils ne sont pas des dommages collatéraux : **ils tenaient tous un compte, et le
compte a changé parce que le Bouclier est devenu vendable.** Chacun a été
réécrit pour dire le nouveau chiffre ET pourquoi il a bougé.

| test | ce qu'il tenait | avant | après |
|---|---|---|---|
| `T11` | lignes d'arbre dont le module n'est pas câblé | 20 | **19** |
| `MODULES-A T9` | liste exacte des modules câblés | 6 | **7**, `bouclier` en plus |
| `MODULES-B T13` | liste exacte des modules NON câblés | 8 | **7**, `bouclier` en moins |
| `T15` (écran) | la ligne de l'Enclume accumule ses deux refus | « pièce non débloquée » + « pas d'effet en jeu » | « pièce non débloquée » + « il manque … points » |

Le quatrième mérite un mot. Il montrait la ligne module de l'Enclume comme
exemple d'accumulation de refus, et le second refus était justement « n'a pas
encore d'effet en jeu » — celui que ce lot fait disparaître. Le test a été
**réécrit sur ce qui reste vrai** : deux refus s'accumulent toujours sur la même
ligne, mais ce sont maintenant « la pièce doit être débloquée » et « il manque
… points ». Il gagne au passage **deux assertions neuves** : que la ligne du
Bouclier ne porte PLUS la mention d'effet (montage qui la ferait tomber :
repasser `cable.offense` à `false`), et qu'une ligne réellement non câblée — la
Buse, qui porte la Garnison — la porte, elle, bien.

⚠ **Aucun test n'a été assoupli.** Les quatre disent un chiffre plus précis
qu'avant, pas moins.

---

## 4. L'étape 2 prise seule — la question du brief

Le brief demande d'appliquer **le tri du tampon seul, sans absorption**, et de
rapporter si un test existant tombe.

> **Réponse : NON. Aucun test ne tombe.** `npm run check` reste vert avec le seul
> tri en place — **683 pass / 0 fail** à ce moment-là, T10 étant déjà entré à
> l'étape 1 et les neuf autres pas encore.

Et parce qu'une suite verte peut simplement ne pas exercer le cas, la propriété
a été **mesurée en plus** : quatre raids joués tick à tick sur des sites réels du
générateur, l'arbre courant contre un témoin identique dont le seul `.sort()` a
été retiré, en comparant `serialiserEtat` **à chaque tick**.

```
avantPoste n20/armée n20 : 237 ticks · IDENTIQUE tick à tick
avantPoste n40/armée n40 : 224 ticks · IDENTIQUE tick à tick
base       n30/armée n35 : 399 ticks · IDENTIQUE tick à tick
avantPoste n50/armée n50 : 259 ticks · IDENTIQUE tick à tick
                            1 119 ticks, 0 divergence
```

Le tri est donc un **no-op observable** sur le moteur d'avant ce lot : rien ne
dépendait de l'ordre d'insertion. Il ne devient une décision qu'avec le
réservoir partagé, ce qui est précisément la raison écrite en toutes lettres
dans le commentaire de `appliquerDegats`.

---

## 5. La lecture du §1.1.1, en clair — un mot d'Ethan la renverse

> **Le porteur n'est PAS sous son propre bouclier.**

C'est une **lecture** de la phrase du classeur : « encaisse tous les dégâts
subis par **les alliés** sous le bouclier ». « Les alliés », pas « les unités ».
L'y inclure donnerait à l'Enclume deux fois ses PV, puisque son réservoir vaut
exactement `pvMaxMilli`.

**La ligne à changer est unique**, et elle est commentée comme telle dans
`appliquerDegats` :

```js
if (b.indice === e.indice) continue;
```

La retirer suffit à renverser l'arbitrage. Un seul test tombe alors de ce fait —
`MODULES-C T2` —, plus `MODULES-C T5` par ricochet (son porteur, protégé par
lui-même, ne tomberait plus au tick voulu). Vérifié : voir la matrice §7,
sabotage **C**.

⚠ **Deux Enclumes se couvrent MUTUELLEMENT**, et c'est la conséquence directe de
cette lecture : chacune est « alliée » de l'autre. Le raid du §9 le montre en
jeu — les deux porteurs y passent l'essentiel de leur réservoir l'un sur
l'autre. Si l'arbitrage doit changer, c'est ce comportement-là qui bougera aussi.

---

## 6. Les six règles, et où chacune est écrite

| § | règle | où | test |
|---|---|---|---|
| 1.1.1 | le porteur n'est pas sous son bouclier | `b.indice === e.indice` | T2 |
| 1.1.2 | rayon 2,5 **cases**, borne comprise | `BOUCLIER_RAYON_CARRE = 2500 * 2500`, comparé par `>` | T1 |
| 1.1.3 | le réservoir ne se recharge jamais | aucune écriture de `bouclierMilli` hors `-= pris` et le montage | T4 |
| 1.1.4 | un bouclier mort ne protège plus | `!estActive(b) \|\| b.pvMilli <= 0` | T5 |
| 1.1.5 | absorption partielle | `Math.min(b.bouclierMilli, reste)`, le reste passe | T3 |
| 1.1.6 | recouvrement : plus petit indice d'abord | `etat.entites.filter(...)`, ordre naturel des indices | T7 |

**Le seuil.** `distanceCarree` rend un carré de **milli-cases** : deux cases
voisines valent 1 000 000, pas 1. Le seuil est donc `2500 × 2500 = 6 250 000`.
Une comparaison à `6.25` passerait `node --check`, passerait le build, et le
bouclier ne couvrirait plus que la case du porteur. `MODULES-C T1` l'attrape
**dès deux cases** (sabotage A, §7).

**La borne est comprise, et franche à la milli-case.** Mesuré :

| distance porteur↔allié | absorbé | l'allié perd |
|---|---|---|
| 2 000 (2 cases) | oui | 0 |
| 2 499 | oui | 0 |
| **2 500 (2,5 cases pile)** | **oui** | **0** |
| 2 501 | non | tout |
| 3 000 (3 cases) | non | tout |

**Le tampon.** `tir` remplit une `Map` dont l'ordre d'itération est l'ordre
d'insertion, donc l'ordre de déclaration des tireurs. Cet ordre était **sans
effet** tant que chaque cible ne touchait que ses propres PV — les soustractions
commutent. Un réservoir **partagé** casse cette indifférence : selon qui passe le
premier, ce n'est pas le même allié qui est couvert. `appliquerDegats` **trie
donc par indice de cible croissant** avant d'appliquer, et la raison est écrite
en toutes lettres au-dessus du tri.

L'absorption est restée **dans `appliquerDegats`**, comme le brief l'exige. Rien
n'a bougé dans `tir` : le tampon reste simultané, c'est son application qui est
séquentielle.

---

## 7. Les dix tests, et le montage qui ferait tomber chacun

Le brief le demande explicitement, et il a raison de le demander : **un test qui
asserte le champ que le patch vient d'écrire ne peut pas échouer.** Les douze
sabotages ci-dessous ont été **réellement joués** — source patchée, suite
complète relancée, source restaurée et vérifiée au `md5sum`.

| # | sabotage joué | tests tombés |
|---|---|---|
| A | seuil écrit en cases (`2.5 * 2.5`) | **8**, dont **T1** |
| B | borne exclue (`>=` au lieu de `>`) | **1 : T1** |
| C | le porteur sous son propre bouclier | **2 : T2**, T5 |
| D | absorption en tout ou rien | **4**, dont **T3** |
| E | le réservoir se recharge | **7**, dont **T4** |
| F | un porteur à 0 PV protège encore | **1 : T5** |
| G | le tampon n'est pas trié | **1 : T6** |
| H | `boucliers` parcouru à l'envers | **1 : T7** |
| I | `bouclierMilli` ajouté à `ligneResultat` | **1 : T8** |
| J | `bouclier` décâblé | **5**, dont **T10** |
| K | le bouclier protège aussi l'ennemi | **4**, dont T2, T3 |
| L | réservoir laissé à zéro au montage | **6**, dont T1 à T5 |
| M | `projectionCanonique` aveugle au réservoir | **1 : T9** |

**Aucun trou.** Chacune des six règles a au moins un sabotage qui ne fait tomber
**qu'elle** : B pour la borne, F pour le mort, G pour le tri, H pour l'ordre des
porteurs, I pour le butin, M pour la projection. Les sabotages A, E, K et L en
font tomber plusieurs parce qu'ils cassent la mécanique entière, ce qui est
attendu.

`md5sum` de `src/sim/combat.js` et `src/data/modules.js` **identiques avant et
après** la matrice : rien n'est resté saboté.

⚠ **T9 NE TOMBE PAS SUR G, ET C'EST MESURÉ, PAS SUPPOSÉ.** Retirer le tri du
tampon ne le fait PAS tomber : c'est un test de **déterminisme**, pas de règle
d'absorption, et le tri est gardé par T6, plus direct. Sa garde propre est le
sabotage **M** : la projection canonique a été **étendue au réservoir** — et
**réutilisée, pas dupliquée**, comme le brief l'exige —, et T9 asserte
explicitement que deux états ne différant QUE par `bouclierMilli` donnent deux
projections différentes. Retirer ce champ de la projection fait tomber T9, et lui
seul.

⚠ **ET SON MONTAGE A DÛ ÊTRE BRIDÉ POUR VALOIR QUELQUE CHOSE.** À réservoir
plein, le bouclier ne s'épuise jamais et l'ordre d'application ne décide de
rien : les permutations concordaient pour une raison sans rapport avec ce lot.
Les réservoirs sont désormais ramenés à 400 000 milli-PV et le test asserte
qu'ils sont **tous les deux à sec** à la fin — sinon la projection ne prouverait
rien.

⚠ **Deux tests ont failli être vacants, et ne le sont plus.**

- Une première écriture de **T1** mesurait la distance **après** le tick.
  `deplacement` est l'étape 7 et `appliquerDegats` l'étape 5 : elle mesurait donc
  une position que l'absorption n'avait jamais vue, et concluait que la borne de
  2,5 était **exclue** alors qu'elle est comprise. Corrigé en mesurant avant, et
  le test asserte désormais la distance qu'il croit mesurer.
- Une première écriture de **T3** et **T7** soustrayait les dégâts d'un tick à
  ceux d'un autre. `degatsDUnTir` met les dégâts à l'échelle de la **santé du
  tireur** : la casemate, qu'on entame, frappe moins fort de tick en tick. Écart
  constaté : 4 893 milli-PV. Les deux tests sont réécrits en **invariants** — « le
  réservoir est vidé », « du dégât est passé », « le second porteur a complété »
  — et ne comparent plus jamais deux ticks différents.

---

## 8. L'écran Recherche — rendu et cliqué

Chromium 1194, viewport **360 × 740, `deviceScaleFactor` 2**, `hasTouch`,
`isMobile`, sur le `dist/index.html` de ce lot, save forgée avec l'Enclume, la
Buse et l'Éclaireur acquis.

```
points de départ : 9 999 972 730 000 points
lignes de module à l'écran : {"offense":{"lignes":14,"sansEffet":2},
                              "defense":{"lignes":17,"sansEffet":17}}

=== ACHAT DU BOUCLIER (offense / Enclume) ===
  avant : {"titre":"Bouclier","bouton":"2 500 000 000","disabled":false,"mention":null}
  armé  : "Confirmer ?"
  après : {"titre":"Bouclier","bouton":"Acquis","disabled":true,"mention":null}
  débit : 2 500 000 000 points  (prix affiché 2 500 000 000)

=== CONTRE-ÉPREUVE : la Garnison (Buse) refuse ===
  ligne : {"bouton":"60 000 000","disabled":true,
           "mention":"Garnison n'a pas encore d'effet en jeu"}
  après deux touchers : identique · points inchangés : true

=== DÉFENSE : aucune ligne ne porte le Bouclier ===
  ligne Bouclier en défense : null
```

**La ligne qui s'ouvre achète bel et bien**, en deux touchers, et débite
exactement son prix affiché — au point près, sans division parasite. La
contre-épreuve tient : une ligne non câblée reste `disabled` et deux touchers ne
prennent rien.

### Le compte de lignes qui s'ouvrent — MESURÉ, pas de tête

Compté **en parcourant `ARBRE_RECHERCHE`**, comme le brief l'exige — c'est la
leçon de MODULES-B, dont le brief annonçait six lignes ouvertes là où il y en
avait cinq.

| | lignes de module | ouvertes AVANT | ouvertes APRÈS |
|---|---|---|---|
| offense | 14 | 11 | **12** |
| défense | 17 | 0 | **0** |
| **total** | **31** | **11** | **12** |

La douzième est `enclume:bouclier`. Le chiffre est **confirmé à l'écran** :
14 lignes de module en offense dont **2 portent la mention « pas d'effet »** (les
deux Garnison, Éclaireur et Buse) → 12 ouvertes ; 17 lignes en défense, **17**
portant la mention → 0 ouverte. Les deux comptes concordent, et `MODULES-C T10`
les fige.

⚠ **`src/ui/recherche.js` n'a pas été touché**, conforme au §2 du brief : la
ligne s'ouvre par le seul drapeau.

⚠ **Une erreur de console est apparue au banc — elle est PRÉEXISTANTE.** Le même
banc joué sur le `dist/index.html` de `origin/main` (`0db2322`), non modifié,
produit **la même unique ligne** « Failed to load resource: 404 ». C'est la
faveur d'icône que le serveur jetable `python3 -m http.server` ne sert pas.
Aucune réponse 404 n'est enregistrée côté réseau pour une ressource du jeu.

Captures : `c-offense.png`, `c-defense.png`, `c-bouclier.png` (hors dépôt).

---

## 9. Le raid — preuve d'EXISTENCE

Sites réels du générateur, `montageDuSite(2026, {type:'avantPoste', …,
saveur:'richeQuartz', instance:1, rangee:275, colonne:18})`, module `bouclier`
débloqué côté joueur, composition 2 Enclumes + 3 Meutes + 2 Béliers + 2 Fendeurs.

```
=== avantPoste niveau 20, armée niveau 20 — 173 ticks, fin « attaquants »
  Enclume #47 — réservoir plein 11 008 800 milli-PV
    premier tick où il baisse : 79
    tick où il atteint zéro   : 117
    alliés couverts           : #48 enclume (38 ticks)
  Enclume #48 — réservoir plein 11 008 800 milli-PV
    premier tick où il baisse : 39
    tick où il atteint zéro   : 132
    alliés couverts           : #47 enclume (66 ticks), #49 meute (30 ticks),
                                #50 meute (13 ticks)

=== avantPoste niveau 40, armée niveau 40 — 297 ticks, fin « attaquants »
  Enclume #70 — réservoir plein 74 061 000 milli-PV
    premier tick où il baisse : 14
    tick où il atteint zéro   : 43
    alliés couverts           : #71 enclume (29 ticks), #72 meute (13 ticks)
  Enclume #71 — réservoir plein 74 061 000 milli-PV
    premier tick où il baisse : 35
    tick où il atteint zéro   : jamais (reste 17 696 488)
    alliés couverts           : #70 enclume (70 ticks)
```

Le réservoir vaut bien **`pvMaxMilli` du porteur, à son niveau** (11 008 800 au
niveau 20, 74 061 000 au niveau 40), il baisse, il atteint zéro, et il ne remonte
jamais. Les alliés couverts sont nommés par leur indice, ainsi que le nombre de
ticks où ils ont été visés sans rien perdre.

⚠ **C'EST UNE PREUVE D'EXISTENCE, PAS UN RENDEMENT.** Aucun butin n'est comparé,
aucune conclusion n'est tirée sur la valeur du module, aucun barème n'est
proposé. Ce lot ne touche pas à l'équilibrage.

---

## 10. Écarts au brief, et pourquoi

1. **La garde `b.pvMilli <= 0` en plus de `estActive`.** Le §1.1.4 veut qu'un
   porteur tombé cesse d'absorber « dans le même tick ». `estActive` ne suffit
   pas : `vivant` n'est écrit qu'à l'étape 6, `retirerLesMorts`, donc un porteur
   à zéro PV est encore « actif » pendant toute l'étape 5. Sans ce second test,
   la règle du brief n'aurait pas été implémentée. Tenu par T5, falsifié par F.
2. **`MODULES-B T13` réécrit plutôt qu'ajouté.** Il tenait la liste exacte des
   modules non câblés ; le Bouclier en sort. Le compte de tests ne bouge donc
   pas de son fait — les dix neufs sont bien dix.
3. **`T15` de l'écran réécrit** : son exemple d'accumulation de refus était
   justement la ligne que ce lot ouvre. Voir §3.
4. **La projection canonique étendue au réservoir.** Le brief dit de la
   réutiliser et de ne pas en écrire une seconde ; elle a été réutilisée, et un
   champ y a été ajouté — sans quoi T9 aurait été aveugle au seul état neuf.
5. **`modulesActifs` n'est PAS renseigné pour le Bouclier**, contrairement au
   Booster et aux neutralisations. Ce tableau est une marque « déjà déclenché
   une fois », faite pour les modules à usage unique ; le Bouclier est un
   réservoir permanent, son état est `bouclierMilli`. Signalé, non corrigé.

---

## 11. Ce qui reste ouvert

- **`garnison`** — le seul module encore non câblé qui a un porteur offensif
  (Éclaireur et Buse). Il demande une règle d'embarquement que le classeur ne
  donne pas : qui embarque, quand, ce qu'il advient de l'infanterie si le
  véhicule est détruit avant la ligne de défense. Lot à part entière, comme le
  brief l'annonce.
- **Les quatre purement défensifs** — `autoReparation`, `rayonMiniMoinsUn`,
  `rayonPlusUn`, `pvPlusVingt`. Ils n'ont aucun porteur offensif ; les câbler
  suppose d'ouvrir la branche défense, aujourd'hui à **0 ligne ouverte**.
- **Les deux que seul `moduleOuvrage` porte** — `munitionSpeciale` et
  `volDeVie` — n'apparaissent dans aucune ligne d'arbre du joueur.
- **La marge sous la borne T10 : 2,91 %.** Elle ne descend plus que de quelques
  centièmes tant que les lots sont du code. C'est le prochain atlas qui la fera
  tomber, et il faudra rouvrir la borne, pas la contourner.
- **L'audit maquette reste ROUGE à 7 écarts**, exactement comme avant ce lot.
  Le porter à 6 ou à 8 sans lot dédié serait une régression, dans les deux sens.

---

## 12. Ce qui a été vérifié, en une liste

- `npm ci && npm run check` sur `origin/main` **avant** le premier geste :
  682 pass / 0 fail, `dist/index.html` 1 261 788 o, `SAVE_VERSION` 14, audit
  ROUGE 7 écarts rc=1. La ligne de base du brief est exacte, mesurée et non
  recopiée.
- `npm run check` **vert à la fin de l'étape 2**, le tri seul, sans absorption.
- `npm run check` final : **692 pass / 0 fail**.
- `node tools/build.js` : **1 262 193 o**, **+405** sur les 2 000 permis.
- `node tools/audit-maquette.mjs` : `diff` **vide** contre la sortie d'avant.
- **Treize** sabotages joués, treize font tomber au moins un test, sources
  restaurées et vérifiées au `md5sum`.
- Écran rendu **et cliqué** en 360 × 740 dpr 2 ; l'achat débite le prix affiché.
- Deux raids joués sur des sites réels, réservoir tracé du premier tick à zéro.
