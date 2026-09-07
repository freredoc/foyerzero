# RAPPORT — lot BASCULE : `state.js` passe sur le moteur de la base

---

## 1. Résultat, mesuré

| | `main` | après ce lot |
|---|---|---|
| `npm test` | 243 pass / 0 fail | **247 pass / 0 fail** |
| Durée de la suite | ~13 s | **19,7 s** |
| `SAVE_VERSION` | 3 | **4** |
| `dist/index.html` | 81 236 o · `f6b082b4…5ad430` | **inchangé, même SHA-256** |
| `version` · `config.build` | 0.12.0 · 12 | **inchangés** |

---

## 2. Ce que l'état porte maintenant

| Avant (lot 1) | Après |
|---|---|
| `batiments: [{type, niveau, voisinsQualifiants, residuFlux}]` | `disposition: [{id, rangee, colonne, niveau}]` |
| `ressources: {quartzMilli, scorieMilli}` | `economie: {ressources: {quartz, scorie, electricite}, residus}` |
| — | `position: {rangee, colonne}` sur la carte monde |
| — | `champs` — **dérivé, non sauvegardé** |

`tickJeu` et `rattraperJeu` ne prennent plus `params` : toutes les données
viennent de `src/data/`.

### Le terrain n'est pas sauvegardé, et ce n'est pas un oubli

Trois options, une seule bonne :

- **Le recalculer par tick** → non. **MESURÉ : 71,6 µs par appel**, soit à 10 Hz
  0,72 ms par seconde de jeu — plus du DOUBLE du tick économique lui-même. Ce
  serait tripler le coût de la boucle pour une valeur qui ne peut pas changer
  pendant un tick.
- **Le sauvegarder** → non plus. Une sauvegarde pourrait alors porter un terrain
  qui ne correspond plus à sa position, et rien ne le dirait.
- **Retenu** : il vit en mémoire, `serialiser` l'OMET, `charger` le redéduit de
  `position`. Un seul endroit peut mentir, et c'est celui qui est écrit.

### La migration 3 → 4 REFONDE, elle ne convertit pas

Il n'existe aucune correspondance entre une `foreuse` sans coordonnée et un
collecteur qui doit se poser sur un champ : inventer une case reviendrait à
fabriquer une partie qui n'a jamais été jouée.

**Ce qui survit : la graine, le tirage, l'horloge — le TEMPS de la partie, pas
son contenu.** C'est acceptable uniquement parce qu'aucune sauvegarde n'existe
(« personne ne joue, pas même moi », 26/08). Le jour où il y en aura, une
refondation muette ne le sera plus : il faudra prévenir le joueur AVANT. C'est
écrit dans la migration elle-même.

### `verifierEtat` lève, `problemesDeDisposition` rend une liste

La différence est voulue. En cours de partie, une disposition illégale est un
fait de **jeu** : on la montre, le joueur purge. Au **chargement**, c'est un
fait de programme : la partie n'est pas jouable, et continuer produirait des
résultats faux en silence. Trois sauvegardes abîmées sont testées, chacune
refusée par un message différent.

---

## 3. ⚠ La suite est passée de 13 à 74 secondes — et pourquoi

Le montage du test 11 rattrapait **1 h, 24 h et 72 h** tick par tick. Il venait
du moteur du lot 1, deux ordres de grandeur moins cher par tick. Après la
bascule, les 72 h font **2,6 millions de ticks** : `state.test.js` y passait
**58 secondes** à lui seul.

### Le coût du tick, mesuré pour de bon

Les rédactions précédentes d'`economie-base.js` n'avaient mesuré qu'**un seul
point** et en tiraient une conclusion générale. Courbe complète, 3 000 ticks par
point :

| Bâtiments | µs / tick | ms par seconde de jeu (10 Hz) |
|---|---|---|
| 1 | 2,0 | 0,020 |
| 5 | 27,7 | 0,277 |
| 9 | 21,1 | 0,211 |
| 20 | 108,0 | 1,080 |
| **40 (base pleine)** | **280,7** | **2,807** |

**Une base pleine coûte neuf fois le chiffre cité jusqu'ici.** 2,8 ms par
seconde reste acceptable, mais la croissance est superlinéaire :
`voisinsQualifiants` reconstruit une carte des cases occupées par bâtiment.
Consigné dans le module.

### Le rabotage, et pourquoi ce n'est pas une baisse d'exigence

Horizons de boucle ramenés à **1 h et 2 h**. Ce que 72 h prouvaient de plus au
niveau des chemins de code : **rien**. La formule décompose en heures pleines +
reste ; deux heures exercent déjà `heuresPleines >= 2` et le reste, et la
saturation est franchie dès la première.

**Et les longues absences sont mieux couvertes qu'avant**, par un test neuf en
temps constant : `rattraper(a)` puis `rattraper(b)` doit valoir
`rattraper(a + b)`. Cinq coupures, dont **un mois d'absence coupé après un seul
tick** — 26 millions de ticks, impossibles à simuler, mais dont la composition
doit tenir. C'est la propriété dont dépend tout retour d'absence : un joueur qui
ouvre le jeu deux fois doit obtenir la même chose que celui qui l'ouvre une
fois.

**Résultat : 58 s → 2,4 s pour `state.test.js`, 74 s → 19,7 s pour la suite.**
Une suite qu'on hésite à lancer cesse d'être lancée.

---

## 4. Falsification — huit défauts, huit tombés

| Défaut injecté | Résultat |
|---|---|
| le terrain part dans la sauvegarde | tombe |
| le terrain n'est pas redéduit au chargement | tombe (2 tests) |
| la migration 3 → 4 laisse les vieilles clés | tombe |
| `SAVE_VERSION` reste à 3 | tombe |
| `verifierEtat` ne vérifie plus la disposition | tombe |
| `verifierEtat` ne compte plus les résidus | tombe |
| le tick ignore le terrain | tombe (3) |
| la refondation pose deux bâtiments | tombe |

---

## 5. Une assertion qui vaut d'être signalée

**Une base qui n'a que son Chantier ne produit RIEN.** Après une heure pleine,
les trois stocks sont encore à zéro — ni collecteur, ni centrale. Un moteur qui
produirait « un peu » de quelque chose ici serait faux, et personne ne le
verrait sans cette assertion.

---

## 6. Fichiers — ⚠ DEUX ARCHIVES

| Archive | Fichiers |
|---|---|
| **1 — `src/`** | `src/sim/state.js`, `src/sim/economie-base.js` |
| **2 — `test/` + racine** | `test/state.test.js`, `test/clock.test.js`, `CLAUDE.md`, ce rapport |

---

## 7. Ce qui reste

1. **`sim/economy.js` est ORPHELIN** : plus personne ne l'importe, mais
   `test/economy.test.js` le teste encore, et `params.batiments`,
   `params.stockage`, `params.courbes`, `params.adjacence` ne servent plus qu'à
   lui. **Le retirer est le lot suivant** — et il fera baisser le compte de
   tests, comme le retrait des colis.
2. **Le redéploiement change les champs** — découle du code, jamais dit.
3. **Les valeurs manquantes** : coûts de réparation, plafonds d'électricité,
   réserve de temps de réparation, formule du dépassement.
4. **Rien n'est encore branché à l'écran.** `index.src.html` n'importe toujours
   que `ui/banc.js` : le jeu tourne, mais personne ne le voit.
