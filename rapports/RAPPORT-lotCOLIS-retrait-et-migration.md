# RAPPORT — lot COLIS : retrait du reliquat, `SAVE_VERSION` 2 → 3

---

## 1. Résultat, mesuré

| | `main` | après ce lot |
|---|---|---|
| `npm test` | 234 pass / 0 fail | **233 pass / 0 fail** |
| `SAVE_VERSION` | 2 | **3** |
| `dist/index.html` | 81 236 o · `f6b082b4…5ad430` | **inchangé, même SHA-256** |
| `version` · `config.build` | 0.12.0 · 12 | **inchangés** |

⚠ **Le compte de tests BAISSE de un, et c'est normal** : le test 9 (« saturation
des colis ») disparaît avec les colis, et un test neuf n'a pas été ajouté pour
compenser artificiellement. 234 − 1 = 233.

---

## 2. Pourquoi maintenant, et pas avec la bascule du moteur

J'avais écrit qu'il fallait grouper le retrait des colis avec le remplacement de
`sim/economy.js`, pour ne payer **qu'une** migration. **Je change d'avis, et
voici la raison mesurée** : la bascule est bloquée sur trois arbitrages que je
n'ai pas, et le dépôt le confirme.

- **La position du joueur sur la carte n'existe nulle part.** `grep` sur
  `src/data/sites.js` et `src/sim/state.js` : rien. Or les champs se tirent DE
  la position — sans elle, `champsDeLaBase` n'a pas d'argument.
- **La base initiale n'est pas définie.** Un Chantier niveau 1 seul ? Avec quoi ?
- **Le sort des sauvegardes v2 n'est pas tranché.** L'ancien état porte des
  `foreuse` et des `decapeuse` sans coordonnées ; le nouveau veut
  `{ id, rangee, colonne, niveau }`. Il n'existe aucune correspondance
  naturelle. Et `CLAUDE.md` ne porte **aucune** politique de compatibilité des
  sauvegardes — vérifié.

Attendre coûtait donc plus qu'une migration : ça faisait entrer du code mort
dans la bascule, la rendant d'autant plus dure à relire. Deux migrations, mais
deux lots petits et lisibles.

---

## 3. Ce qui a été retiré

| Endroit | Ce qui part |
|---|---|
| `src/data/params.js` | `colis: { intervalleMs, maxEnAttente }` |
| `src/sim/economy.js` | `intervalleColisTicks`, le bloc colis du tick, celui du rattrapage, la troisième formule de la démonstration |
| `src/sim/state.js` | le champ `colis` de `creerBatiment`, la ligne du `@typedef` |
| `test/economy.test.js` | le test 9 en entier |
| `test/state.test.js` | le colis du montage de référence, les assertions du test 11 |

**Un import mort trouvé au passage** : `TICK_MS` n'était importé dans
`economy.js` que pour l'intervalle des colis. Retiré — un import mort finit
toujours par faire croire à une dépendance.

**Aucun commentaire n'a été effacé sans laisser d'adresse** : chaque endroit
retiré porte une ligne qui dit ce qui était là et pourquoi c'est parti.

---

## 4. La migration 2 → 3 — la première qui SUPPRIME

Les deux migrations précédentes **ajoutaient** un champ manquant. Celle-ci en
retire un, et c'est un choix délibéré : laisser `colis` traîner dans les
sauvegardes alors que plus une ligne ne le lit, c'est préparer quelqu'un à
croire, dans six mois, qu'il sert encore.

Ce qui est retiré n'est pas une ressource du joueur, c'est un compteur mort.

Le test 12 le vérifie sur une sauvegarde v0 **fabriquée à la main avec un
`colis` d'époque** : après la chaîne 0 → 1 → 2 → 3, la clé doit avoir disparu —
asserté par `hasOwnProperty`, pas par `=== undefined`.

---

## 5. Un test sauvé plutôt que supprimé

Le « test 11 bis » portait sur le passage d'un colis en cours de fabrication. Il
aurait pu partir avec eux. **Il a été gardé, parce que son montage vaut pour
autre chose** : le test 11 ne rattrape que des heures RONDES (1 h, 24 h, 72 h),
pour lesquelles le reste de la division par `TICKS_PAR_HEURE` vaut zéro — soit
exactement le chemin que la formule du rattrapage traite à part. **Une fenêtre
non ronde est le seul montage qui l'emprunte.**

Réécrit autour de ça : 4 530 ticks, avec deux assertions de montage neuves —
que la fenêtre n'est pas ronde, et qu'au moins un bâtiment finit avec un résidu
non nul. Sans elles, il ne prouverait pas plus qu'une fenêtre ronde.

---

## 6. Falsification — trois défauts, trois tombés

| Défaut injecté | Résultat |
|---|---|
| `SAVE_VERSION` laissée à 2 | tombe |
| la migration remet le compteur à zéro au lieu de retirer le champ | tombe |
| fenêtre ronde au lieu de non ronde dans le test 11 bis | tombe |

---

## 7. Fichiers, et ⚠ DEUX ARCHIVES — c'est désormais la règle

| Archive | Fichiers |
|---|---|
| **1 — `src/`** | `src/data/params.js`, `src/sim/economy.js`, `src/sim/state.js` |
| **2 — `test/` + racine** | `test/economy.test.js`, `test/state.test.js`, `CLAUDE.md`, ce rapport |

`economy.js` / `economy.test.js` et `state.js` / `state.test.js` : **deux paires**
qui ne diffèrent que par `.test`. La règle est inscrite dans `CLAUDE.md` :
`src/` et `test/` ne voyagent jamais ensemble.

⚠ **Entre les deux dépôts, `main` sera ROUGE.** L'archive 1 retire `params.colis`
que les tests de l'archive 2 lisent encore. C'est attendu et c'est ce que le
garde-fou dit. Déposer 1, puis 2.

---

## 8. Ce qui reste

1. **Trois arbitrages avant la bascule** (§2) : position de départ du joueur,
   base initiale, sort des sauvegardes v2.
2. **Le redéploiement change les champs** — découle du code, jamais dit.
3. **Les valeurs manquantes ailleurs** : coûts de réparation, plafonds
   d'électricité, réserve de temps, formule du dépassement.
