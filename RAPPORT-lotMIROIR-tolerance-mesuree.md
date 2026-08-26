# RAPPORT — lot MIROIR : la tolérance du T12, enfin mesurée

> Dette portée par deux passations (§3.1.9 du 25/08), jamais re-mesurée.
> Livraison directe : un seul fichier, `test/generateur.test.js`.

---

## 1. Mesuré, pas estimé

| | avant | après |
|---|---|---|
| `npm test` | 154 pass / 0 fail | **154 pass / 0 fail** |
| durée de la suite | 11,5 s | **12,7 s** (+1,2 s, le montage du T12) |
| `npm run build` | 81 236 o | **81 236 o**, inchangé à l'octet |
| `test/generateur.test.js` | 17 tests, 132 lignes `assert.` | 17 tests, **140 lignes** `assert.` |

**La suite est VERTE.** Un seul fichier touché, aucun code de production modifié.

---

## 2. Le protocole, exécuté

Celui de la passation, à la lettre — puis élargi pour calculer les seuils.

**Balayage de calibrage** (hors dépôt, jetable) : 3 types de site × 20 graines ×
7 compositions d'assaut × 5 niveaux `{1, 2, 10, 30, 50}` = **420 montages,
2 100 combats, 4 200 comparaisons de niveaux.**

| grandeur | mesure |
|---|---|
| causes divergentes | **0 sur 4 200** |
| écart de ticks, médiane | **0** |
| écart de ticks, maximum | **1** |
| comparaisons au-dessus de 0 tick | 32 / 4 200 = **0,76 %** |
| montages où une entité change de sort | **1 / 420 = 0,2 %** |
| résidu de PV de l'entité qui bascule | **25,0 / 27,4 / 25,4 ppm** des PV max |

**La tolérance d'un tick est JUSTE.** Elle n'a pas été devinée en 2B, elle est
maintenant mesurée sur 4 200 comparaisons au lieu de 4.

---

## 3. Ce que la mesure a trouvé, et que le test ne regardait pas

Le T12 comparait la **cause** et le **tick**. Il ne regardait pas le **sort des
entités**. Or c'est là que le miroir n'est pas parfait.

Un montage sur 420 — `avantPoste` graine 11, assaut mixte graine 5 — porte une
**Batterie** dont le sort dépend du niveau :

| niveau | 1 | 2 | 10 | 30 | 50 |
|---|---|---|---|---|---|
| sort | vivante | **détruite** | **détruite** | vivante | vivante |
| PV restants | 25 / 1 000 000 | 0 | 0 | 434 / 15 863 000 | 2 706 / 106 719 000 |
| en ppm | 25,0 | — | — | 27,4 | 25,4 |

Elle tient **2,7 PV sur 106 719** au niveau 50, et le tick de fin ne bouge pas
d'une unité (228 partout), ni la cause.

**Ce n'est pas un défaut, c'est la borne du miroir.** `pvMaxMilli` et les dégâts
sont arrondis séparément par niveau : le dernier coup tombe tantôt juste avant
zéro, tantôt juste après. Et le résidu est lui-même invariant en relatif —
25,0 / 27,4 / 25,4 ppm, le miroir tient jusque dans son propre bruit.

Le nouveau T12 asserte donc que **toute entité dont le sort bascule est à un
arrondi de la mort** : là où elle survit, elle tient moins de **100 ppm** de ses
PV max. Seuil **calculé** — 27,4 ppm mesuré au pire, 3,6 fois de marge.

---

## 4. Falsifiabilité — prouvée, pas affirmée

Défaut injecté sur une copie : les dégâts mis à l'échelle par
`facteurMilli × 1,002` au lieu de `facteurMilli`, soit **+0,2 %** de rupture du
miroir. Puis **+0,02 %**.

| rupture du miroir | ancien T12 | nouveau T12 |
|---|---|---|
| +0,2 % | **PASSE** — écart max 0 tick | **TOMBE** — 7 ticks |
| +0,02 % | **PASSE** — écart max 0 tick | **TOMBE** — 3 ticks |

**L'ancien T12 ne voyait rien, même à +0,2 %.** Sa graine unique et sa
composition unique tombaient sur un site où l'arrondi n'avait aucune prise. Il
passait depuis le lot 2B en ne prouvant rien du tout.

---

## 5. Les cinq assertions du nouveau T12

Le montage : 2 types × 5 graines × 5 compositions = **50 montages**, 5 niveaux
chacun = **250 combats**, toutes les paires = **500 comparaisons**.

1. **Cause identique** sur les 500 paires.
2. **Sort de chaque entité** : toute bascule tient sous 100 ppm de ses PV max.
3. **Le montage a mesuré quelque chose** : exactement 50 montages, exactement
   500 comparaisons, **zéro combat de 50 ticks ou moins**. Un montage qui se
   dégraderait en silence — un assaut vide, un site trivial — le dirait.
4. **Écarts de ticks : médiane 0 ET maximum ≤ 1 ET moins de 5 % au-dessus de
   zéro.** Le maximum seul ne suffit pas : un miroir qui se dégraderait partout
   sans jamais dépasser un tick passerait sans être vu. Le plafond de 5 % laisse
   6,5 fois de marge sur les 0,76 % mesurés.
5. **Le résidu observé doit rester sous la moitié de son plafond**, sinon le
   seuil du §2 aurait été choisi trop juste sans qu'on le sache.

Les compositions d'assaut sont **tirées de `genererAssaut`**, pas écrites à la
main : trois profils, cinq graines fixes. Le test reste strictement
déterministe.

---

## 6. Audit du compte d'assertions

`test/generateur.test.js` : 17 tests avant, **17 après** — le T12 est réécrit,
pas doublé. 132 → **140** lignes `assert.`.

**Aucune assertion supprimée. Aucun seuil abaissé.** Les deux assertions de
l'ancien T12 sont conservées et élargies :

| ancien | nouveau |
|---|---|
| `ra.cause === rb.cause` sur 4 couples | sur **500 paires** |
| `ra.tick > 50` sur 4 combats | compteur global, **0 sur 250 combats** |
| `ecartMax <= 1` sur 4 couples | sur **500 paires**, + médiane, + taux |

L'ancien couvrait les couples `[1,11] [8,16] [30,50] [1,50]`. Le nouveau couvre
les niveaux `{1, 2, 10, 30, 50}` **toutes paires** : de part et d'autre de la
bascule du niveau 12, et le plafond. Le niveau 11 et le niveau 16 tombent, les
niveaux 2 et 10 les remplacent — le protocole de la passation les nommait
explicitement, et l'encadrement de la bascule est conservé.

**Coût : +1,2 s sur une suite de 12,7 s.** C'est le prix de cinq graines. Le
balayage complet à 420 montages coûtait 12 s : écarté du dépôt, gardé hors ligne
pour le calcul des seuils.

---

## 7. Où déposer

**Dépôt `freredoc/foyerzero`, branche `main`, un seul fichier :**

| fichier livré | destination |
|---|---|
| `test/generateur.test.js` | `test/generateur.test.js` |

Aucun code de production touché. Le commit ne peut pas casser `main` : il ne
change qu'un test, et ce test passe.

**`package.json` n'est PAS livré, et c'est délibéré.** `dist/index.html` est
identique à l'octet près, donc son SHA-256 aussi, donc le manifeste de Pages
aussi. Bumper la version pousserait une mise à jour aux appareils pour un
changement qui ne les concerne pas. Si tu préfères tenir la règle de `CLAUDE.md`
§5 sans exception, c'est 0.12.1 · build 13 — dis-le et je le livre.

---

## 8. Laissé en suspens

- **La dette §3.1.9 est close.** La tolérance est mesurée, le seuil calculé, le
  test falsifié.
- Les trois scripts de mesure (`balayage-miroir.mjs` et deux sondes) sont restés
  **hors du dépôt**. Le balayage à 420 montages coûte 12 s : il double la suite
  pour un gain de couverture marginal. Si tu veux le garder pour un audit
  ponctuel, il se remonte en dix minutes.
- **`verif.mjs` est toujours mort** à la racine (documenté dans `CLAUDE.md`
  depuis ce matin, toujours pas réparé ni supprimé).
- Les autres points ouverts du lot HYGIÈNE — garde du lot 1, `SPEC` l. 281,
  trois liens morts de suffixe — n'ont pas été touchés.
