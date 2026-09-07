# RAPPORT — lot ATTRIBUTION : la production, ressource par ressource

> Lot vérifiable par exécution, livré en direct.
> ⚠ **Il contient aussi la réparation de `main`, qui est ROUGE.** Voir §2.

---

## 1. Résultat, mesuré

| | `main` **actuel** | après ce lot |
|---|---|---|
| `npm test` | **195 pass / 3 FAIL** | **218 pass / 0 fail** |
| Fichiers `*.test.js` | 19 | **20** |
| `dist/index.html` | 81 236 o · `f6b082b4…5ad430` | **81 236 o · `f6b082b4…5ad430`** |
| `version` · `config.build` | 0.12.0 · 12 | **inchangés** |

---

## 2. ⚠ `main` est rouge, et voici pourquoi

Le lot DISPOSITION a été commité **incomplet**. Relevé sur `main` :

- `src/sim/disposition.js` — présent, correct.
- `test/disposition.test.js` — **absent**.
- `test/disposition.js` — **présent, et c'est une copie octet pour octet du
  module**. Vérifié par `cmp` : 13 363 octets identiques des deux côtés.

Ce n'est donc pas un renommage : **le module a été déposé deux fois**, une fois
au bon endroit et une fois à la place du fichier de test. Comme il ne finit pas
par `.test.js`, le glob de `npm test` ne le ramasse pas — il ne casse rien, il
occupe juste la place du vrai.

Les trois échecs sont ceux du garde-fou documentaire : `CLAUDE.md` annonce 213
tests et 20 fichiers, le dépôt en a 198 et 19. **Il a fait exactement son
travail** : sans lui, la perte d'un fichier de test entier serait passée
inaperçue, et personne n'aurait su que quinze tests avaient cessé d'exister.

**Ce lot répare les deux choses en une seule livraison.**

---

## 3. L'arbitrage du 26/08 — l'attribution par voisin

> « la ressource du collecteur qui l'a causé — oui. Donc une raffinerie niv 1
> avec 2 collecteurs quartz et 3 scories, ça fait 144/h quartz et 216/h scorie »

`productionParRessource(disposition, champs, index)` rend
`{ quartz: 144, scorie: 216 }` sur ce montage exact. Un test le monte à la
lettre.

### ⚠ Et la règle NE SE GÉNÉRALISE PAS — c'est tout le piège du lot

« La ressource du voisin » ne vaut **que** pour la raffinerie. Une centrale qui
touche trois champs de scorie ne produit pas de la scorie : elle produit de
l'**électricité**. Elle les compte pourtant bien — 120 + 3 × 60 = 300 — mais
dans sa propre ressource.

Le discriminant est `BASE_BATIMENTS[x].ressource`, et c'est **exactement la
distinction posée hier** entre exclusif et inclusif :

| `ressource` | Bâtiments | Attribution |
|---|---|---|
| `quartzOuScorie` | collecteur | ressource propre = le champ sous lui ; **tout** y va, bonus compris |
| `electricite` | centrale, accumulateur | ressource propre = électricité ; **tout** y va |
| `quartzEtScorie` | raffinerie | **pas** de ressource propre → chaque voisin apporte la sienne |

Séparer `quartzOuScorie` de `quartzEtScorie` avait été fait pour éviter de lire
une capacité comme un total. Ça sert aujourd'hui à autre chose, sans une ligne
de plus : le module branche sur ce champ, il ne réécrit aucune liste.

### `indetermine` — un signal, pas une valeur

L'apport d'un collecteur posé **hors champ** ne peut pas être attribué : il ne
produit rien d'identifiable. Il tombe dans `indetermine` plutôt que d'être versé
au hasard dans le quartz. Sur une disposition valide, la clé n'apparaît jamais —
un test le vérifie sur toutes les dispositions valides du fichier.

### Ce qui ne produit rien rend `{}`, pas `{ quartz: 0 }`

Sinon un panneau afficherait « 0 quartz/h » pour une caserne, ce qui laisserait
croire qu'elle pourrait en produire.

---

## 4. Le lien avec le calcul précédent, asserté

La somme des ressources doit valoir le débit brut : `144 + 216 = 360`, et
`debitDuBatiment(...).total` vaut 360. **Rien ne se perd, tout se sépare.**
C'est l'assertion qui relie les deux calculs et qui tomberait si l'un dérivait
de l'autre.

---

## 5. Falsification — sept défauts, six tombés

| Défaut injecté | Résultat |
|---|---|
| la raffinerie verse tout dans une seule ressource | tombe (3 tests) |
| la centrale hérite de la ressource de ses voisins | tombe (2) |
| le mal posé est versé dans le quartz | tombe (1) |
| attribution au niveau du voisin, pas de la raffinerie | tombe (1) |
| les zéros sont versés quand même | tombe (4) |
| n'importe quel voisin apporte, même non qualifiant | tombe (1) |
| **la raffinerie se compte elle-même comme voisine** | **PASSE** |

Le septième est **la même garde morte qu'hier**, au même endroit conceptuel :
`casesVoisines` exclut le centre, donc `i === index` est inatteignable. Le code
renvoie maintenant à l'explication d'origine au lieu de la répéter.

---

## 6. Fichiers touchés

| Fichier | Nature |
|---|---|
| `src/sim/disposition.js` | `productionParRessource` ; `ressourceProduite` redocumentée ; garde commentée |
| `test/disposition.test.js` | **manquait sur `main`** — 15 tests d'origine **+ 5 neufs** = 20 |
| `CLAUDE.md` | §0 compteur 218, §6 trois pièges neufs |
| `RAPPORT-lotATTRIBUTION-production-par-ressource.md` | ce fichier |
| ⚠ `test/disposition.js` | **À SUPPRIMER sur GitHub** — copie parasite du module |

---

## 7. Ce qui reste ouvert

1. **Le redéploiement change les champs** — découle du code, jamais dit.
2. **Le reliquat des colis** — à faire AVEC le remplacement du moteur : les deux
   touchent `SAVE_VERSION`, groupés ça coûte une migration au lieu de deux.
3. **Les valeurs manquantes ailleurs** : coûts de réparation, plafonds
   d'électricité, réserve de temps, formule du dépassement.
4. **Le remplacement de `sim/economy.js`.** Il ne manque plus rien pour
   l'écrire : terrain, validation, voisinage typé, débits, et maintenant
   l'attribution par ressource. Ce qui reste, c'est le TICK — le stock par
   ressource et par bâtiment, la saturation au plafond, le rattrapage hors ligne.
