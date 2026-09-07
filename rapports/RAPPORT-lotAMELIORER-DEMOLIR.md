# RAPPORT — lot AMÉLIORER-DÉMOLIR

Session du 27/08/2026, soir. Trois arbitrages d'Ethan descendus dans le moteur,
et le premier lot du dépôt qui **dépense** des ressources.

---

## 1. Ce qui a été produit, mesuré

| | Avant | Après |
|---|---|---|
| version · build | 0.17.0 · 17 | **0.18.0 · 18** |
| `npm run check` | 293 pass / 0 fail | **304 pass / 0 fail** |
| `dist/index.html` | 133 545 o | **134 019 o** |
| SHA-256 du livrable | `1f1c2cec…9bab4` | `0bdc2913…d038ab` |
| `audit-maquette.mjs` | vert | **vert** |
| `SAVE_VERSION` | 6 | **6, inchangé** |

**Le bump est dû** : `dist/index.html` a changé de 474 octets. Numéro choisi au
moment de l'exécution, `version` et `config.build` bumpés ensemble.

**`SAVE_VERSION` ne bouge pas, et c'est vérifié, pas supposé.** Améliorer et
démolir n'ajoutent aucun champ à l'état : le niveau d'un bâtiment existait déjà,
`economie.residus` existait déjà, et démolir retire une ligne des deux listes
parallèles au même indice. Une sauvegarde de la v6 se relit sans migration — un
test le rejoue (`état — démolir rend 90 %…`, dernière assertion).

---

## 2. Les trois arbitrages, et ce qu'ils sont devenus dans le code

### 2.1 Bâtiments en quartz, défenses et offense en scorie

`RESSOURCE_DE_COUT` dans `src/data/base.js` :

```
batiment: 'quartz'   defense: 'scorie'   offense: 'scorie'
```

Les onze bâtiments de `BASE_BATIMENTS` sont de catégorie `batiment` par
`CATEGORIE_DE_COUT_DE_LA_BASE` — **y compris le QG de défense et le Complexe de
défense**, arbitré ce soir : ce sont des bâtiments de la base, pas des pièces de
la bande de défense. Les deux autres lignes de la table ne sont lues par rien
aujourd'hui ; elles existent pour que l'arbitrage soit écrit à l'endroit où il
sera lu, et non redécouvert.

L'électricité prend sa fraction **sur la ressource principale du bâtiment** —
donc sur le quartz ici, sur la scorie le jour où les défenses arriveront.

⚠ **Une fraction peut s'arrondir à zéro, et ce n'est pas un défaut.** La
centrale paie 10 % d'un coût de 4 : 0,4 → 0. Relevé par exécution, asserté tel
quel, plutôt que masqué par un plancher à 1.

### 2.2 La poche du Chantier suit le niveau, × 1,25

`stockagePropreDuNiveau(id, niveau)`. Le 1,25 **n'est pas écrit** : c'est
`ECONOMIE_NIVEAU.penteProduction`, la même que suivent la production et, par
construction, la capacité des deux bâtiments de stockage. Une table fait foi par
grandeur (CLAUDE.md §4) ; l'écrire en dur aurait laissé la poche en arrière le
jour où la pente bougerait.

| niveau | poche |
|---|---|
| 1 | 50 · 50 · 40 |
| 2 | 63 · 63 · 50 |
| 6 | 153 · 153 · 122 |
| 10 | 373 · 373 · 298 |

`capacitesMilli` passe désormais par cette fonction. Lire le champ
`stockagePropre` directement, c'est lire le niveau 1 en croyant lire le niveau
courant — la faute est signalée en commentaire à l'endroit exact où elle a été
commise.

### 2.3 Démolir rend 90 % de l'ensemble des ressources

`REMBOURSEMENT_DEMOLITION.fraction = 0.9`, appliqué au **cumul depuis le
niveau 1**, pas au dernier palier, et sur les **trois** ressources. Arrondi
**vers le bas** : le joueur perd la fraction, jamais la banque.

Un collecteur de niveau 5 a coûté 47 de quartz et 22 d'électricité ; il rend
42 et 19.

⚠ **Le remboursement n'est pas plafonné par la capacité, délibérément.**
Démolir une raffinerie fait baisser la capacité et peut porter le stock
au-dessus : `economie-base` **gèle** un stock excédentaire au lieu de l'amputer
(arbitré le 26/08, « rien ne se retire en silence »). Écrêter ici ferait
disparaître des ressources que le joueur vient de récupérer, sans rien lui dire.

---

## 3. Fichiers touchés

| Fichier | Ce qui change |
|---|---|
| `src/data/base.js` | `RESSOURCE_DE_COUT`, `CATEGORIE_DE_COUT_DE_LA_BASE`, `coutDeMontee`, `coutCumule`, `REMBOURSEMENT_DEMOLITION`, `remboursementDuNiveau`, `stockagePropreDuNiveau` |
| `src/sim/state.js` | `problemesDeLAmelioration`, `ameliorer`, `problemesDeLaDemolition`, `demolir` |
| `src/sim/economie-base.js` | `capacitesMilli` passe par `stockagePropreDuNiveau` |
| `test/base.test.js` | +7 tests |
| `test/state.test.js` | +4 tests |
| `test/chantier.test.js` | une ligne formatée réparée (§5.1) |
| `CLAUDE.md` | §0 : 304 tests, 134 019 octets ; en-tête : 0.18.0 · 18 |
| `foyer-zero-ui.html` | trois capacités alignées sur le moteur (§5.2) |

**Aucun fichier créé ni supprimé** — les onze tests sont allés dans les fichiers
des modules qu'ils testent, pas dans un `amelioration.test.js` neuf. Un fichier
de plus aurait demandé de toucher `documentation.test.js`, qui asserte les noms
depuis le lot HOMONYMES, pour un lot qui n'introduit aucun module.

---

## 4. Chaque test, avec son montage effectif

### `test/base.test.js` — sept

| Test | Montage | Résultat |
|---|---|---|
| un bâtiment coûte du quartz, jamais de la scorie | les 11 ids × niveaux 2, 5, 9 | **PASS** |
| la chaîne des coûts restitue la table relevée | chantier, niveaux 2→7 : 8, 10, 20, 80, 440, 1440 | **PASS** |
| l'électricité est une fraction du principal | les 11 ids × niveaux 3, 6, 11, comparés à `COUT_ELECTRICITE.fraction` | **PASS** |
| le niveau 1 est gratuit et ne se demande pas | `coutDeMontee(id, 1)` **lève** pour les 11 | **PASS** |
| le cumul est la somme des paliers | 3 ids × niveaux 2, 5, 8, resommés à la main | **PASS** |
| démolir rend 90 %, arrondi vers le bas | 3 ids × niveaux 2, 4, 7 | **PASS** |
| la poche suit le niveau, pente écrite une fois | niveaux 2, 4, 6, 10, 25 contre `penteProduction` | **PASS** |

### `test/state.test.js` — quatre

| Test | Montage | Résultat |
|---|---|---|
| améliorer monte d'un niveau et débite le palier | base neuve + collecteur sur un vrai champ, **deux** montées d'affilée pour que les paliers diffèrent | **PASS** |
| améliorer sans les ressources est refusé | stocks à zéro, puis **exactement** le coût | **PASS** |
| démolir rend 90 %, retire la ligne et son résidu | collecteur monté au niveau 3, relecture par `charger(serialiser())` | **PASS** |
| le Chantier ne se démolit pas | indice 0 refusé, indice 1 accepté dans le **même** montage | **PASS** |

**Ce que les montages assertent AVANT de mesurer** — sans quoi ils passeraient
sur du code cassé :

- que le palier visé n'est pas gratuit, avant de mesurer un débit ;
- que l'investi n'est pas nul dans les deux canaux, avant de comparer un rendu ;
- que le rendu est **strictement** inférieur à l'investi : un remboursement à
  100 % passerait toutes les égalités le jour où quelqu'un écrirait 1 à la place
  de 0,9, car l'arrondi vers le bas ne le trahirait pas ;
- que la poche **monte** dès le niveau 2, sinon un module resté plat passerait la
  comparaison au niveau 1 et rien d'autre ne le verrait ;
- que le collecteur du même montage, lui, **se démolit** — sinon le test du
  Chantier protégé passerait sur un module qui refuserait toute démolition ;
- qu'un refus **ne débite pas et ne monte pas le niveau** : un `throws` seul ne
  dit rien de ce qui a été fait avant de lever.

### Falsification — sept défauts injectés, **zéro passé**

Sur une copie, ancre vérifiée à une occurrence, suite relancée à chaque fois,
copie restaurée entre deux injections depuis une archive et **non depuis git** :
le HEAD du dépôt ne porte pas ce lot, un `git checkout` aurait restauré l'état
d'avant au lieu de l'état de travail — piège rencontré et corrigé en séance.

| Défaut injecté | Tests tombés |
|---|---|
| remboursement 0,9 → 1,0 | 2 |
| table de coût : quartz → scorie | 8 |
| poche : courbe supprimée, retour au plat | 3 |
| `ameliorer` ne débite plus | 1 |
| `demolir` ne retire plus le résidu | 1 |
| le Chantier n'est plus protégé | 1 |
| électricité : fraction ignorée | 4 |

---

## 5. Deux défauts trouvés en séance

### 5.1 Un nombre retapé à deux endroits n'en fait bouger qu'un

`test/chantier.test.js` portait `7 082` en dur — 7 032 + 50, la poche **plate**
— sur la ligne qui vérifie le formatage, alors que l'assertion vingt lignes plus
haut était déjà passée à `poche.quartz`. Le passage à la courbe a fait tomber la
seconde et pas la première : la suite était **rouge à 292/293** au moment où
j'ai repris la copie.

Réparé, et le remède n'est pas de dériver le nombre : une ligne dérivée de
`resume` s'asserterait elle-même et ne testerait plus le formatage. Un garde
nommé a été mis devant, qui dit la cause au lieu de laisser un écart de trois
chiffres :

> `la poche du Chantier a bougé : recalculer la ligne formatée juste en dessous`

### 5.2 L'audit de maquette est passé rouge, et il avait raison

Les capacités de la maquette dataient de la poche plate. `AUDIT ROUGE — 3
écarts`. La maquette a été alignée : 7 082 → 7 185 (×2), 2 296 → 2 378.

⚠ **La maquette emploie une espace ASCII, `CLAUDE.md` une espace fine
insécable (U+202F).** Le premier remplacement, écrit avec le séparateur de
`CLAUDE.md`, a trouvé **zéro occurrence** dans la maquette. Les deux fichiers ne
se corrigent pas avec la même chaîne.

---

## 6. Incident de session — la deuxième fois

**Ma réponse a planté en cours de tour.** Ethan a dû renvoyer son message ; une
nouvelle instance a repris la conversation dans **le même conteneur**, où les
fichiers écrits par l'instance précédente étaient toujours là. Le transcript
avait disparu, pas le disque.

Vu depuis la nouvelle instance, cela s'est présenté comme une copie de travail
qui **diverge de `main` entre deux de ses propres lectures**, sans qu'elle ait
écrit quoi que ce soit : 478 insertions dans cinq fichiers, horodatées pendant
la conversation, implémentant exactement ce qui venait d'être demandé, et un
commentaire datant l'arbitrage d'avant qu'il ne soit prononcé.

**C'est la deuxième fois que ça arrive.**

**Ce qui a été fait, et qu'il faut refaire à l'identique :**

1. **Ne rien construire dessus.** Une divergence non expliquée est de la même
   famille que le `combat.js` écrasé du 27/08 au matin : du code plausible à la
   bonne place, que rien ne signale.
2. **Mesurer avant de conclure** — `git fetch` (`main` intact à `28270faf`),
   `git diff --stat`, horodatages comparés au reste de l'arbre.
3. **Conserver la divergence** en `divergence.patch` avant toute manipulation.
4. **Re-cloner à neuf** et vérifier que la base de référence est verte.
5. **Le dire à Ethan** plutôt que d'absorber silencieusement du travail dont
   l'origine n'est pas établie.

**Et ce que l'incident a produit de bon.** La copie reprise était **rouge** —
292/293 — et sans tests pour le code neuf. La croire sur parole aurait livré un
lot non prouvé avec une suite cassée. Le §5.1 est sorti de là.

⚠ **Le repère qui tranche vite, la prochaine fois** : `origin/main` inchangé +
horodatages *pendant la conversation* + contenu conforme à la demande en cours
= instance précédente, pas intrusion. `origin/main` **avancé** serait une autre
histoire.

---

## 7. Écarts et points laissés ouverts

**Écarts.** Aucun par rapport aux arbitrages. Le lot livré est plus large que ce
qui avait été annoncé — les onze tests et les deux réparations n'étaient pas
prévus, ils étaient dus.

**Ouverts :**

1. **Les trois boutons ne sont toujours pas branchés.** Le moteur sait
   améliorer et démolir ; l'écran ne les appelle pas. Ça touche le DOM, donc
   brief pour Claude Code et PR — pas ce lot.
2. **Rien ne plafonne le niveau d'un bâtiment par celui du Chantier.** Dans
   Tiberium Alliances, le Centre de commandement plafonne les unités et le QG
   de défense les défenses. Chez nous, un collecteur peut monter au plafond
   général sans que le Chantier suive. Non arbitré, non implémenté, signalé.
3. **`ameliorer` ne vérifie pas que le coût est ATTEIGNABLE.** Si un palier
   dépassait la capacité de stockage maximale, le joueur ne pourrait jamais
   l'accumuler et l'écran dirait « il manque N » pour toujours. Ça ne se produit
   pas aux niveaux bas ; ça se vérifiera quand la courbe sera jouée loin.
4. **Les dix vérifications appareil** de `TESTS-APPAREIL.md` restent **NON
   EXÉCUTÉES**, et ce lot n'en rend aucune caduque.
5. **`CLAUDE.md` §5 prescrit encore `LISEZ-MOI-DEPOT.md`** — le nom qui s'est
   retrouvé commité. La passation du jour l'a renommé
   `A-LIRE-AVANT-DE-DEPOSER.md` et le document qui fait autorité ne le sait pas
   encore. Une ligne, pas corrigée ici pour ne pas mélanger deux sujets dans un
   même lot.
