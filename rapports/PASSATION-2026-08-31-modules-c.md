# PASSATION — 31/08/2026, après le lot MODULES-C

**Où en est le projet.** Version **0.53.0 · build 54**, `SAVE_VERSION` **14**,
`npm run check` → **692 pass / 0 fail**, `dist/index.html` → **1 262 193
octets**, marge sous la borne T10 **37 807 o · 2,91 %**.
`node tools/audit-maquette.mjs` → **ROUGE, 7 écarts, rc=1** — et il l'était déjà.

Branche `claude/lot-modules-c`, partie de `origin/main` = `0db2322` (le merge de
MODULES-B). Rapport complet : `RAPPORT-lotMODULES-C.md`.

---

## Ce que ce lot a fait

Un module câblé : le **Bouclier**, porté par la seule **Enclume** (Albatros).
Une entité attaquante dont le module est actif porte un **réservoir** valant
`pvMaxMilli` au montage ; tant qu'il n'est pas vide, les dégâts destinés à un
**allié à 2,5 cases ou moins** en sont retranchés au lieu des PV de l'allié.

C'est le premier lot qui touche à `appliquerDegats`, et le seul qui donne à une
entité un état de combat qui lui survit d'un tick à l'autre.

`cable.offense` passe à `true` pour `bouclier` ; la défense reste fausse, et
c'est un **constat** : aucun profil ne porte ce module côté défense.
**Onze lignes de module s'ouvraient à l'écran, douze s'ouvrent maintenant** —
compté en parcourant `ARBRE_RECHERCHE`, confirmé à l'écran, figé par
`MODULES-C T10`.

---

## Ce qui a coûté cher, et qu'il ne faut pas repayer

### 1. `distanceCarree` rend des MILLI-cases au carré

Deux cases voisines sont à **1 000 000**, pas à 1. Un rayon de 2,5 cases s'écrit
`2500 * 2500`. La forme naïve `2.5 * 2.5` passe `node --check`, passe le build,
et réduit la portée à la case du porteur **sans qu'aucune erreur ne le dise**.
C'était le piège annoncé par le brief ; il est désamorcé et gardé par
`MODULES-C T1`, qui tient le seuil **à la milli-case près** (2 500 protégé,
2 501 non).

### 2. Le déplacement est l'étape 7, les dégâts l'étape 5

La position qui compte pour tout ce que fait `appliquerDegats` est celle
d'**avant** le tick. Une première écriture des tests a mesuré après coup et a
conclu, à tort, que la borne de 2,5 était **exclue**. Elle est comprise.

### 3. Les dégâts d'un tir suivent la santé du TIREUR

`degatsDUnTir` met les dégâts à l'échelle de `pvCourant / pvMax` du tireur. Un
défenseur qu'on entame frappe moins fort au tick suivant. **Un montage de test ne
doit jamais soustraire les mesures de deux ticks différents** — coûté 4 893
milli-PV d'écart inexpliqué avant d'être compris. `MODULES-C T3` et `T7` sont
écrits en invariants pour cette raison.

### 4. `estActive` ne voit pas un mort du tick courant

`vivant` n'est écrit qu'à l'étape 6, `retirerLesMorts` : pendant toute l'étape 5
une entité à zéro PV est encore « active ». La règle « un bouclier mort ne
protège plus, dans le même tick » a donc exigé un `pvMilli <= 0` **en plus**.

### 5. Le tampon de `tir` est une `Map`, son ordre est celui d'insertion

Il était **sans effet** tant que chaque cible ne touchait que ses propres PV. Un
réservoir **partagé** casse cette indifférence. `appliquerDegats` trie désormais
par indice de cible croissant, et **tout mécanisme futur qui partage une
ressource entre plusieurs cibles doit passer par ce tri.**

⚠ Le tri a été appliqué **seul, sans absorption**, comme le brief l'exigeait :
`npm run check` est resté vert, **aucun test n'est tombé**, et la propriété a été
mesurée en plus — 1 119 ticks de raid sur quatre sites, `serialiserEtat`
identique tick à tick contre un témoin sans tri. Rien ne dépendait de l'ordre
d'insertion avant ce lot.

---

## L'arbitrage qui attend un mot d'Ethan

> **Le porteur n'est PAS sous son propre bouclier.**

Lecture de la phrase du classeur — « les **alliés** », pas « les unités ». L'y
inclure lui donnerait deux fois ses PV.

**Une seule ligne le décide**, dans `appliquerDegats` :

```js
if (b.indice === e.indice) continue;
```

La retirer renverse l'arbitrage. Conséquence visible en jeu : **deux Enclumes se
couvrent mutuellement** — chacune est « alliée » de l'autre —, et le raid du
rapport montre les deux porteurs passer l'essentiel de leur réservoir l'un sur
l'autre.

---

## Ce qui reste ouvert

- **`garnison`** — le seul module non câblé qui ait un porteur offensif
  (Éclaireur, Buse). Il demande une règle d'embarquement que le classeur ne donne
  pas. **Lot à part entière.**
- **Les quatre purement défensifs** — `autoReparation`, `rayonMiniMoinsUn`,
  `rayonPlusUn`, `pvPlusVingt` : aucun porteur offensif, et la branche défense
  est toujours à **0 ligne ouverte**.
- **Les deux que seul `moduleOuvrage` porte** — `munitionSpeciale`, `volDeVie` :
  ils n'apparaissent dans aucune ligne d'arbre du joueur.
- **La marge sous la borne T10 : 2,91 %** (4,4 → 3,1 → 3,05 → 2,94 → 2,91). Elle
  ne descend plus que de quelques centièmes tant que les lots sont du code ; le
  prochain atlas la fera tomber, et il faudra **rouvrir la borne, pas la
  contourner**.
- **L'audit maquette : ROUGE, 7 écarts.** Il l'était avant ce lot, mot pour mot.
  Le porter à 6 ou à 8 sans lot dédié serait une régression, dans les deux sens.
- **`tools/verifier.py` n'a pas été lancé**, et c'était conforme : ce lot ne
  touche ni `art/`, ni `tools/`.

---

## Signalé, non corrigé

**`modulesActifs` n'est pas renseigné pour le Bouclier**, contrairement au
Booster et aux neutralisations. Ce tableau est une marque « déjà déclenché une
fois », faite pour les modules à usage unique ; le Bouclier est un réservoir
permanent, et son état est `bouclierMilli`. C'est un écart de style assumé, pas
un oubli.
