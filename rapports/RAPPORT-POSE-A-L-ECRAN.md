# RAPPORT — lot POSE-À-L'ÉCRAN : le joueur peut enfin construire

> Le moteur était déjà écrit et testé. Ce lot n'est que du branchement — et il
> rend exécutables quatre vérifications appareil qui ne l'étaient pas.

---

## 1. Ce qui a réellement été produit

| | avant | après |
|---|---|---|
| Version · build | 0.15.0 · 15 | **0.16.0 · 16** |
| `npm run check` | 286 pass / 0 fail | **291 pass / 0 fail** |
| `dist/index.html` | 131 302 o | **133 455 o** — borne T10 : 200 000 |
| SHA-256 | `7deac539…ae6ed` | `5ad4e08e1f3980d959c5c48293efa0d01be83f710ff35d79741df9236ed31ae0` |
| `audit-maquette.mjs` | vert | **vert** |
| `SAVE_VERSION` | 6 | **6, inchangée** |
| Palette | 33 teintes | 33, inchangée |

**Confrontation d'entrée.** La référence du brief — 286 pass, 131 302 octets,
SHA `7deac539…ae6ed`, 0.15.0 · build 15, `SAVE_VERSION` 6 — s'est vérifiée **au
test, à l'octet et au SHA près**.

⚠ **`SAVE_VERSION` ne bouge pas, et c'est vérifié plutôt que supposé.** Une pose
allonge `disposition` et `economie.residus`, deux listes qui existent depuis la
v4. Rien n'est ajouté à la forme de l'état ; bumper imposerait une migration qui
n'aurait rien à migrer.

**+5 tests, aucune assertion supprimée**, tous dans `test/chantier.test.js`.

---

## 2. L'audit était rouge sur `main` — et Ethan l'a réparé pendant le lot

En confrontant la base, `node tools/audit-maquette.mjs` est sorti **ROUGE** :

```
KO   la palette transcrite ici et celle de FICHE-STYLE.md ont divergé
```

Mesuré : `FICHE-STYLE.md` porte **33** teintes, `test/banc.test.js` en transcrit
**33** — il est dans `npm run check`, il ne pouvait pas ne pas suivre — et
`tools/audit-maquette.mjs` en portait **28**. C'est exactement ce que le fichier
joint au brief décrit : *un audit hors de `npm run check` n'existe pas*.

J'avais installé la version corrigée jointe au brief. **Ethan l'a commitée sur
`main` pendant que je travaillais** ; j'ai refetché, constaté que sa version est
identique à ma copie, et **repris ma branche depuis `main`**. `tools/audit-maquette.mjs`
ne fait donc **pas** partie de ce lot — il n'y a pas de doublon.

---

## 3. Fichiers touchés

| Fichier | Ce qui change |
|---|---|
| `src/ui/chantier.js` | `casesPosables`, `messageDeRefus`, palette vivante, clic-pour-poser, `avis` |
| `src/ui/session.js` | fournit le rappel de sauvegarde, parle par `ecran.avis()` |
| `src/index.src.html` | habillage des cases légales et de la vignette active |
| `test/chantier.test.js` | +5 tests |
| `CLAUDE.md` | §0 (compte, taille, version), §6 |
| `package.json` | `version` et `config.build` |

**Aucun fichier ajouté ni retiré** : `CLAUDE.md` §2 n'avait rien à corriger.
Aucun fichier de `src/sim/` ni de `src/data/` n'est touché — le moteur était
prêt, c'était bien du branchement.

---

## 4. Le geste, tel qu'il est écrit

1. le joueur touche un bâtiment de la palette → il devient **actif** ;
2. `casesPosables` interroge `problemesDeLaPose` sur les **72 cases de la bande
   des bâtiments** et les cercle ;
3. case légale → `poserBatiment`, repeint, **sauvegarde immédiate** ;
4. case illégale → le message du moteur, **mot pour mot**, et la sélection reste ;
5. retoucher le bâtiment actif défait la sélection.

### Ce qui a été mesuré

`casesPosables` sur une base neuve : **1,5 ms** pour 72 cases. Le brief annonçait
0,82 ms sur sa machine ; l'ordre de grandeur est le même et la conclusion
identique — c'est un geste, pas une boucle de rendu, et **rien ne justifie de
réimplémenter les règles dans l'écran** pour aller plus vite.

Un Collecteur sur une base neuve : **exactement 12 cases légales, et ce sont les
douze champs**, vérifié par égalité d'ensemble dans les deux sens.

### Ce que le DOM factice a montré, de bout en bout

```
choisir un Collecteur   → 12 cases légales, ce sont bien les champs
case illégale (12,4)    → « Collecteur doit être posé sur un champ »
                          rien posé, sélection gardée
case légale (12,5)      → posé · 1 sauvegarde · débit 0 → 240 000 milli/h
                          emplacements 1 → 2 · contexte « Collecteur / Niv. 1 · +240 s /h »
plus d'emplacement      → « 2 bâtiments pour 2 emplacements : améliorer le
                          Chantier de construction en ouvrira d'autres. » · 0 case légale
déchoisir               → aucune vignette active, 0 case légale, avis effacé
```

⚠ **Ce DOM factice n'est PAS commité** (≈ 70 lignes, jeté dans le répertoire de
travail). Il ne connaît ni mise en page, ni cascade, ni défilement — c'est-à-dire
exactement ce qui peut casser à l'écran. Il attrape un identifiant fautif ou un
plantage au premier rendu, rien de plus.

---

## 5. Les cinq tests, et leur montage effectif

| Test | Montage | Résultat |
|---|---|---|
| douze champs | base neuve · terrain asserté à 12 champs AVANT de compter · égalité d'ensemble · centrale comme témoin | PASS |
| quatre grandeurs | base de la maquette + raffinerie en (12,1) | PASS |
| le niveau moyen baisse | même montage : 46 → 43 dixièmes | PASS |
| refus mot pour mot | collecteur hors champ, message comparé au moteur | PASS |
| jamais de `try` | balayage de `src/ui/`, blocs `try` découpés par comptage d'accolades | PASS |

### ⚠ Le montage des « quatre grandeurs » a dû être choisi, pas pris au hasard

Sur une base **neuve**, poser un Collecteur ne déplace que **deux** des quatre :
la capacité ne bouge pas (un collecteur ne stocke rien) et le niveau moyen non
plus (tout est au niveau 1). Un test écrit là-dessus aurait passé **en n'ayant
rien mesuré** — c'est ce que le DOM factice a montré au premier jet, et c'est
pour ça que le montage est une base déjà montée, de moyenne 4,6, et un bâtiment
de **stockage** :

```
débit quartz     2 250 000 → 2 542 000 milli/h
capacité quartz  7 082 000 → 9 962 000 milli
emplacements            11 → 12
niveau moyen            46 → 43 dixièmes
```

Le test asserte que **chacune** des quatre a bougé : un repeint partiel — les
stocks sans les emplacements, ou l'inverse — passerait un test qui n'en
regarderait qu'une.

⚠ **Le niveau moyen BAISSE, et c'est juste.** C'est une moyenne : poser un
niveau 1 sur une base à 4,6 la tire à 4,3. Contre-intuitif, visible à l'écran,
donc asserté maintenant pour qu'on ne le prenne jamais pour un défaut de calcul.

### ⚠ La garde du `try` a d'abord accusé du code juste

Écrite pour chercher `poser(`, elle est sortie rouge sur `ui/banc.js` — qui
entoure bien `poser(arsenal, …)` d'un `try`. Vérification faite, **ce n'est pas
la même fonction** : `src/ui/` porte DEUX `poser` sans rapport, celui de
`sim/state.js` (un bâtiment) et celui d'`ui/arsenal.js` (une unité dans une
vague). Le banc a **raison** de rattraper le second : le contrat de l'Arsenal est
de lever sur un dépassement de budget, qui est un fait de jeu.

Corrigé à la source plutôt qu'en assouplissant la garde :
`chantier.js` importe `poser as poserBatiment`, et le balayage vise ce nom-là.
Le dépôt s'était déjà fait mordre par un nom court homonyme — `combat.js`, table
et moteur — et la leçon vaut ici.

### Falsification, une mutation à la fois

Chacune injectée seule, suite relancée, fichiers restaurés et comparés :

| Mutation | Verdict |
|---|---|
| `casesPosables` cesse de filtrer | ROUGE |
| un `try` entoure `poserBatiment` | ROUGE |
| la pose ne sauvegarde plus | ROUGE |
| la session ne fournit plus le rappel | ROUGE |
| les messages de refus sont reformulés | ROUGE |

---

## 6. Les DIX vérifications appareil — **AUCUNE EXÉCUTÉE**

⚠ **Un test appareil non exécuté se déclare NON EXÉCUTÉ, jamais passé.**

Cette session n'a ni Galaxy S25 FE, ni émulateur, ni navigateur ; le proxy
sortant refuse même `freredoc.github.io`.

**Les quatre qui restaient dues et que ce lot rend enfin atteignables :**

| # | Vérification | État |
|---|---|---|
| 7 | poser un collecteur sur un champ, puis voir les stocks monter | **NON EXÉCUTÉE** |
| 9 | l'économie a tourné pendant un passage à l'Offense | **NON EXÉCUTÉE** |
| 11 | fermer l'app, attendre, rouvrir → les stocks ont avancé | **NON EXÉCUTÉE** |
| 12 | replier seulement, sans fermer → même résultat | **NON EXÉCUTÉE** |

**Les six propres à ce lot :**

| # | Vérification | État |
|---|---|---|
| 15 | toucher un bâtiment distingue ses cases légales, 12 pour un Collecteur | **NON EXÉCUTÉE** |
| 16 | poser sur une case légale place le bâtiment, le compteur avance | **NON EXÉCUTÉE** |
| 17 | toucher une case illégale dit pourquoi, en français, et ne pose rien | **NON EXÉCUTÉE** |
| 18 | le niveau du Chantier, en bas d'écran, bouge après la pose | **NON EXÉCUTÉE** |
| 19 | poser puis tuer l'application aussitôt : le bâtiment est toujours là | **NON EXÉCUTÉE** |
| 20 | une fois les emplacements pleins, l'écran le dit avant qu'on essaie | **NON EXÉCUTÉE** |

Le DOM factice couvre **la logique** de 15, 16, 17, 18 et 20 ; il ne prouve rien
du rendu, et rien du tout de 19, qui met en jeu le système d'exploitation.

---

## 7. Écarts par rapport au brief

1. **`poser` importé sous le nom `poserBatiment`** (§5). Le brief demandait la
   garde ; l'homonymie rendait la garde fausse. Corrigé à la source.
2. **Le bandeau d'avis a changé de propriétaire** : il vit maintenant dans
   `chantier.js` et la session lui parle par `ecran.avis()`. Deux modules qui
   écrivaient la même ligne sans se connaître se seraient effacés l'un l'autre
   dès que la pose s'est mise à parler.
3. **Deux gardes de plus, non demandées** : que la légalité soit consultée
   AVANT la pose, et que la sauvegarde immédiate existe des deux côtés du
   rappel. Sans elles, retirer le `try` interdit et ne rien mettre à la place
   aurait passé.
4. **`tools/audit-maquette.mjs` ne fait pas partie du lot** (§2), Ethan l'ayant
   commité pendant la session.

---

## 8. Points laissés en suspens

1. **Les dix vérifications appareil** (§6). Seul point qui empêche de dire que ce
   lot est prouvé.
2. **Améliorer** — attend la répartition d'un coût entre quartz et scorie.
   Vérifié à nouveau : aucune fonction de coût par niveau n'existe dans le dépôt.
3. **Démonter** — attend de savoir si ça rend quelque chose.
4. **Les couleurs de terrain** `#9FB3C5` · `#C1CEDA` · `#382E47` — toujours pas
   arbitrées, donc toujours pas employées. Ce lot n'y a pas touché.
5. **Les obstacles de la bande de défense** — signalés au lot précédent, toujours
   ouverts : `PASSATION-2026-08-27-soir.md` §3 dit que la bande 3–10 les porte,
   aucun code ne les pose sur la base du joueur.
6. **Le stockage propre du Chantier est plat** (50/50/40, sans courbe) — signalé
   comme arbitrage à part par le lot DÉMARRAGE, non repris ici.

---

## 9. Livraison

- **PR.** Le merge sur `main` appartient à Ethan seul.
- La PR 13 étant fusionnée, la branche est **repartie de `main` à jour**, puis
  reprise une seconde fois après le commit d'Ethan sur l'audit.
- `CLAUDE.md` §0 et §6 à jour ; §2 inchangé, aucun fichier ajouté ni retiré.
- ⚠ **La taille du HTML a été re-mesurée après le build**, comme le brief
  l'exige : c'est le seul chiffre du fichier qu'aucune garde ne protège.
