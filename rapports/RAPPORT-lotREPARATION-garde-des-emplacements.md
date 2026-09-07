# RAPPORT — lot RÉPARATION : remettre `main` au vert, et fermer la faute

> ⚠ **`main` est ROUGE.** Ce lot le répare et empêche la récidive.
> ⚠ **Il contient aussi un signalement qui n'a rien à voir avec le code.** §4.

---

## 1. État de `main`, relevé

`npm test` → **197 pass / 2 fail**, et le compte des tests exécutés est **199**
alors que le dépôt en **déclare 218**.

| Fichier | État |
|---|---|
| `test/disposition.test.js` | ✅ bon — la version à 20 tests |
| `CLAUDE.md` | ✅ bon — annonce 218 |
| `src/sim/disposition.js` | ❌ **version périmée**, sans `productionParRessource` |
| `src/sim/disposition.test.js` | ❌ **copie parasite du test**, à supprimer |

**Pourquoi dix-neuf tests avaient disparu.** `test/disposition.test.js` importe
`productionParRessource`. Le module commité ne l'exporte pas. En modules ES, un
import nommé absent est une erreur de LIAISON, pas d'exécution : le fichier ne
se charge pas du tout, et ses vingt tests ne sont jamais enregistrés. D'où
`not ok 10 - test/disposition.test.js` et 199 au lieu de 218.

C'est un mode d'échec vicieux : le test le plus proche du problème ne dit rien,
parce qu'il n'existe pas.

---

## 2. Deux livraisons de suite tombées à côté — c'est ma livraison, pas la manipulation

| Quand | Ce qui est arrivé |
|---|---|
| lot DISPOSITION | `src/sim/disposition.js` déposé **dans `test/`** sous le nom `disposition.js` — invisible au glob, quinze tests évaporés |
| lot ATTRIBUTION | `disposition.test.js` déposé **dans `src/sim/`**, pendant que le module y restait périmé |

Le dépôt se met à jour depuis un téléphone, fichier par fichier, et le sélecteur
n'affiche que les noms courts. `disposition.js` et `disposition.test.js` s'y
ressemblent beaucoup. **Livrer deux fichiers dont les noms ne diffèrent que par
`.test` était une mauvaise idée de ma part**, et les deux accidents en découlent
directement.

Les deux fois, le symptôme était lointain et illisible.

---

## 3. La correction, et la garde

### `src/sim/disposition.js` — la bonne version

Celle qui exporte `productionParRessource`. Les vingt tests se rechargent.

### `test/documentation.test.js` — une garde qui NOMME le fichier fautif

Un test neuf, `aucun fichier de test ne traîne hors de test/`, qui vérifie les
deux sens :

- **aucun `*.test.js`** dans `src/data`, `src/sim`, `src/render`, `src/ui`,
  `tools` ;
- **aucun fichier autre qu'un `*.test.js`** dans `test/`, hors
  `prereglages-lot3a.js` qui est un préréglage connu.

Les deux accidents réels ont été **rejoués contre elle**, et voici ce qu'elle
dit :

```
fichier(s) inattendu(s) dans test/ : disposition.js
  — un module de src/ déposé au mauvais endroit ne serait exécuté par personne

fichier(s) de test hors de test/ : src/sim/disposition.test.js
  — à supprimer, le bon exemplaire est dans test/
```

Elle vaut aussi comme règle de fond : `src/` ne contient que du code livré.

### Ce que je change de mon côté

À partir de maintenant, **je ne livre plus dans un même zip deux fichiers dont
les noms ne diffèrent que par `.test`**. Quand c'est inévitable, ils partiront
en deux livraisons séparées.

---

## 4. ⚠ Signalement — deux fichiers d'origine inconnue

En préparant ce lot, j'ai trouvé dans mon répertoire de travail deux fichiers
que **je n'ai pas écrits** :

```
src/sim/economie-base.js        15 061 o   créé à 20:08:41
test/economie-base.test.js      20 178 o   créé à 20:10:04
sha256  e06ebeb03dceda3649e55e64cbd5b2a0a1e5b83e3bec0c2fa27626d21d0d7cc0
        7d6f971384835b74940fa2c7b17446454a95bad25e2028939a655332d59199ad
```

Ma dernière écriture datait de **19:37**. Ils ne sont dans aucune des copies
fraîches de `main`, personne ne les importe, et il n'existe aucune trace de leur
écriture dans la session.

Ils sont rédigés dans mon style, implémentent exactement le tick que j'avais
annoncé comme lot suivant (`capacitesMilli`, `debitsMilliParHeure`,
`creerEtatEconomie`, `tickEconomieBase`, `rattrapageEconomieBase`), et passent
leurs douze tests.

**Rien de tout ça ne vaut caution.** Les tests sont venus avec le code : ils ne
prouvent que la cohérence de l'ensemble avec lui-même. Je n'ai ni écrit ni relu
ces fichiers, donc je ne peux pas en répondre — et la règle du projet est qu'on
ne livre que ce qu'on a vérifié par exécution ET compris.

**Ils ne sont pas dans ce lot.** Ils sont mis de côté, intacts, et je peux te les
passer pour relecture si tu veux — mais alors comme du code à auditer de zéro,
pas comme un lot.

---

## 5. Résultat

| | `main` actuel | après ce lot |
|---|---|---|
| `npm test` | **197 pass / 2 FAIL** (199 exécutés, 218 déclarés) | **219 pass / 0 fail** |
| `dist/index.html` | 81 236 o · `f6b082b4…5ad430` | **inchangé, même SHA-256** |
| `version` · `config.build` | 0.12.0 · 12 | **inchangés** |

## 6. Fichiers

| Fichier | Nature |
|---|---|
| `src/sim/disposition.js` | remplace la version périmée |
| `test/documentation.test.js` | + la garde des emplacements |
| `CLAUDE.md` | §0 compteur 219 |
| ⚠ `src/sim/disposition.test.js` | **À SUPPRIMER sur GitHub** |

## 7. Ensuite

Le tick reste à écrire — **par moi, à partir de rien**. Il ne manque aucune
donnée : terrain, validation, voisinage typé, débits, attribution par ressource.
Ce qui reste est le stock par ressource, la saturation au plafond, le rattrapage
hors ligne, puis le débranchement de `sim/economy.js` avec le retrait des colis
et une seule migration `SAVE_VERSION`.
