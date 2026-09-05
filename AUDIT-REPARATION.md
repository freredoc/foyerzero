# AUDIT — la réparation, côté Ouvrage et côté joueur

**Fait le 04/09/2026 sur `main`, version 0.91.0.** Demandé par Ethan : « Réparation
des bâtiments ouvrage et défense à auditer. »

**Aucun code n'a été modifié.** Ce document mesure, il ne corrige pas.

---

## 1. Le verdict en trois lignes

- **Côté Ouvrage : conforme au modèle, rien à signaler.**
- **Côté joueur : deux régimes sur trois ne sont pas branchés**, et ce n'est pas
  une dette cosmétique — c'est un **cliquet qui ne se remonte jamais**.
- Ce n'est pas un défaut caché : `MODELE-REPARATION-1.md` le déclare lui-même en
  point ouvert. Ce que l'audit ajoute, c'est **la conséquence en jeu**, que le
  document ne dit nulle part.

---

## 2. Ce que le modèle prévoit

`MODELE-REPARATION-1.md` §3 — trois régimes disjoints :

| Ce qu'on répare | Temps commandé par | Coût | Ressource |
|---|---|---|---|
| Bâtiments de la base | niveau du **Chantier de construction** | niveau du bâtiment | quartz |
| Unités offensives | Caserne · Dépôt de véhicules · Aérodrome, selon le châssis | niveau de l'unité | scorie |
| Défenses | niveau du **Complexe de défense** | **gratuit** | — |

Et §3, sur les défenses : « Le Complexe de défense répare **tout**,
**gratuitement**, **en une heure** — joueur comme Ouvrage. » Le temps ne descend
jamais sous une heure, mais monte si le niveau des défenses dépasse celui du
Complexe.

---

## 3. Ce que le code fait — mesuré, pas lu en diagonale

**Tous les chemins qui écrivent `degatsMilli`, dans tout `src/` :**

| Site | Ce qu'il fait | Sur quoi |
|---|---|---|
| `sim/raid.js:709` | inflige | l'armée du joueur, après un raid mené |
| `sim/raid-ouvrage.js:403` | inflige | **la garnison ET les bâtiments** du joueur, après un raid subi |
| `sim/raid.js:673` | **rend** | garnison, **et seulement les pièces à module `autoReparation`** |
| `sim/reparation.js:482` | **rend** | **l'armée seule** — `laBase.armee[index]` |
| `sim/state.js:2460` | pose à zéro | migration v19 → v20, pas une réparation |

Deux chemins infligent, deux rendent, et les deux qui rendent ne couvrent que
l'armée et une poignée de pièces de garnison.

**Trois mesures qui ferment l'audit :**

1. **`sim/reparation.js` ne touche que `laBase.armee`.** Son en-tête l'annonce
   dès la première ligne — « la réparation de l'armée ». Aucun écran ne répare un
   bâtiment.
2. **`complexeDeDefense` n'apparaît dans AUCUN module de `src/sim/`.** Le
   bâtiment existe dans `src/data/base.js`, il est constructible, il monte en
   niveau — et il ne commande rien. Grep sur tout `src/sim/` : zéro occurrence.
3. **`reparerLaGarnison` (`sim/raid.js:666`) filtre sur le module** :
   `if (nomDuModule('defense', piece.id) !== 'autoReparation') continue;`. Ce
   n'est pas la réparation d'une heure du Complexe, c'est le module Herse, il
   rend un pourcentage, et il ne se déclenche qu'au moment d'un raid.

**Côté Ouvrage, en revanche, `sim/site-entame.js` fait le travail en entier** :
`reparerLesSites` rend une base attaquée intégralement au bout d'une heure —
l'entrée est supprimée, donc tout revient, y compris ce qui était tombé —, et
pour un camp ou un avant-poste, seules les défenses **survivantes** reviennent, et
seulement si l'Étai est debout. C'est exactement le §3 du modèle. La fonction est
appelée depuis `sim/state.js` en deux points, dont le rattrapage hors-ligne.

---

## 4. La conséquence en jeu, et c'est elle qui compte

`raid-ouvrage.js:401` pose les bâtiments et défenses touchés à leur plancher —
**1 PV** — et `raid-ouvrage.js:279` les relit au raid suivant pour monter le
combat. Donc :

> Un raid subi laisse la base du joueur à 1 PV, **et rien au monde ne l'en fait
> remonter**. Le raid suivant la traverse. Le troisième aussi.

C'est un **effet cliquet** : la base du joueur ne fait que se dégrader, sans
palier, sans coût, sans écran pour intervenir. Le modèle dit que « le joueur paie
ses réparations » — aujourd'hui il ne peut pas les payer, il n'y a pas de caisse.

**Ce qui atténue, et qu'il faut dire aussi :** aucun module de simulation ne LIT
`degatsMilli` de la disposition en dehors du combat. Grep sur `economie-base.js`,
`disposition.js`, `champs.js` : zéro. **La production ignore les dégâts.** Une
base à 1 PV partout produit donc exactement comme une base neuve. Le cliquet ne
mord que sur la défense — mais il y mord entièrement.

---

## 5. Ce qui appartient à Ethan avant tout brief

Le modèle laisse deux choses ouvertes, et **aucune ne se devine** :

1. **Le barème** — `MODELE-REPARATION-1.md` point 7, ouvert : coût et temps de
   réparation par niveau, pour les bâtiments. Sans lui, un lot inventerait des
   nombres, ce qui est la faute la plus chère du dépôt.
2. **La formule de dépassement du Complexe** — point 6, ouvert : de combien
   l'heure s'allonge quand les défenses dépassent le niveau du Complexe. C'est
   tout l'arbitrage « puissance contre disponibilité » entre le QG de défense et
   le Complexe, et c'est une décision de calibrage.

Une troisième question s'est ouverte depuis, le 01/09, et le document ne l'a pas
absorbée : **la réserve est par châssis, et par base.** Le §4 dit que les
bâtiments « puisent dans la même réserve » que les unités — mais il y a
maintenant trois réserves, une par châssis. Les bâtiments puisent dans laquelle ?
Une quatrième ? Ce n'est pas tranchable par le code.

---

## 6. Ce qu'un lot ferait, quand ces trois réponses existeront

Par ordre de morsure, pas par ordre de difficulté :

1. **La défense sur son horloge propre** — gratuite, une heure, commandée par le
   Complexe. C'est ce qui arrête le cliquet, et c'est le seul des trois qui ne
   demande aucun barème de coût : le modèle dit « gratuit ».
2. **La réparation des bâtiments**, contre quartz, sur la réserve — demande le
   barème et la réponse sur les réserves par châssis.
3. **L'écran** qui permet de la déclencher. Il n'en existe aucun : le bouton
   « Réparer » de l'écran de raid porte sur l'armée.

⚠ Le point 1 seul suffirait à supprimer le cliquet, et il est le moins cher des
trois. S'il ne devait y en avoir qu'un, c'est celui-là.

---

## 7. Suite donnée — 05/09/2026

Cet audit ne mesure plus l'état du dépôt : il mesure l'état du **04/09**. Ce qui suit dit
ce qu'il est advenu de chacun de ses points ouverts, pour qu'on ne le relise pas comme s'il
était encore d'actualité.

**Le §5 est clos.** Les trois questions qui « appartenaient à Ethan » ont trouvé leur
réponse le 05/09, sur trente captures d'écran de Tiberium Alliances :

1. **Le barème** — mesuré. Une réparation complète coûte **5,1887 %** du prix du niveau
   pour une unité, **le prix du niveau ÷ 230** pour un bâtiment. Voir
   `RELEVE-TA-REPARATION.md` §5.
2. **La formule de dépassement du Complexe** — **toujours ouverte**. Aucune des trente
   captures ne la montre, et Ethan ne peut pas la provoquer en jeu. C'est le seul point de
   cet audit qui survit intact.
3. **La réserve** — tranchée. Les bâtiments ne puisent pas dans les réserves de châssis :
   ils ont **la leur, une quatrième**, produite par le Chantier de construction.

**Le §6 est réordonné.** L'audit proposait de commencer par la défense sur son horloge
propre, au motif qu'elle seule ne demandait aucun barème. Les barèmes existent maintenant,
et c'est la défense qui reste bloquée — sur la formule de dépassement. L'ordre s'inverse :
les bâtiments et l'écran d'abord, la défense quand le point 2 tombera.

**Le §4 est confirmé et il faut le redire** : le cliquet est toujours là. `raid-ouvrage.js`
pose les bâtiments à 1 PV, rien ne les en fait remonter, et vérifié sur `main` au build 96,
`complexeDeDefense` n'apparaît toujours dans **aucun** module de `src/sim/`.

Le modèle mis à jour est `MODELE-REPARATION-1.md`, réécrit en place le 05/09 — même nom, même numérotage de sections, parce que vingt-trois commentaires de `src/` et `test/` les citent.
