# RAPPORT — lot ÉCRAN-NAVIGATION : le miroir, les deux écrans, le coût

> Suite de l'AMENDEMENT au brief ÉCRAN-CHANTIER, lui-même suite de la PR 12,
> **fusionnée** puis **essayée sur GitHub Pages** par Ethan le 27/08. Ce rapport
> dit ce qui a été **mesuré**, ce qui est **déclaré non exécuté**, et pourquoi.

---

## 1. Ce qui a réellement été produit

| | avant (PR 12) | après |
|---|---|---|
| Version · build | 0.13.0 · 13 | **0.14.0 · 14** |
| `dist/index.html` | 123 785 o | **130 676 o** — borne T10 : 200 000 |
| SHA-256 | `ba594508…45702` | `60603a87dc7e5b89feeed24f887831f787a96d33db27ee88eb0b258f34040f91` |
| `npm run check` | 271 pass / 0 fail | **282 pass / 0 fail** |
| `audit-maquette.mjs` | vert | **vert** |
| `SAVE_VERSION` | 6 | 6, inchangée |
| Références externes | 0 | **0**, garde du build passée |

**Confrontation d'entrée, faite avant de toucher à quoi que ce soit** : la
référence de l'amendement — 271 pass / 0 fail, 123 785 octets, SHA `ba594508…`,
0.13.0 · build 13 — s'est vérifiée **à l'octet et au test près**.

⚠ **`main` avait bougé depuis le merge**, de quatre commits : les deux briefs,
la suppression de `LISEZ-MOI-DEPOT.md`, et surtout **`PASSATION-2026-08-27-soir.md`**,
qui n'existait pas quand l'amendement a été écrit. Aucun code touché. Elle a été
lue, et elle porte deux choses qui comptent pour ce lot — voir §6.

### Compte de tests : 271 → 282, **+11**, aucune assertion supprimée

| Origine | Δ |
|---|---|
| `test/offense.test.js`, nouveau | +6 |
| `test/rendu.test.js` — trois tests d'orientation | +3 |
| `test/chantier.test.js` — barre à deux bandes, pastille de pose | +2 |

---

## 2. Fichiers touchés

| Fichier | État | Ce qui change |
|---|---|---|
| `src/render/orientation.js` | **nouveau** | le miroir et sa réciproque — pur, sans DOM |
| `src/ui/offense.js` | **nouveau** | l'écran des quatre vagues |
| `test/offense.test.js` | **nouveau** | 6 tests |
| `src/ui/chantier.js` | modifié | miroir, barre à deux bandes, pastille de pose |
| `src/ui/session.js` | modifié | navigation entre les deux écrans de jeu |
| `src/index.src.html` | modifié | écran Offense, portes, feuille de style |
| `test/chantier.test.js` | modifié | +2 tests, champ de coût renommé |
| `test/rendu.test.js` | modifié | +3 tests d'orientation |
| `foyer-zero-ui.html` | modifié | miroir et barre à deux bandes (§7) |
| `CLAUDE.md` | modifié | §0, §2, §6 |
| `package.json` | modifié | `version` et `config.build` |

Aucun fichier de `src/sim/` ni de `src/data/` n'a été touché : **le modèle ne
bouge pas d'un pouce**, c'est l'affichage qui se retourne.

---

## 3. Le miroir

`ligne d'écran = GRILLE.longueur + 1 − rangée`, dans `src/render/orientation.js`,
avec sa réciproque et le placement d'une bande entière. Appliqué aux **deux**
endroits que l'amendement nomme : les cases et les segments de rail.

Résultat mesuré sur le rendu réel :

```
rail batiments   gridRow 1 / span 8      ligne d'écran  1 → rangée 18
rail defense     gridRow 9 / span 8      ligne d'écran  9 → rangée 10
rail deploiement gridRow 17 / span 2     ligne d'écran 18 → rangée 1
```

### Pourquoi dans `render/`, et pas dans l'écran

Parce que **la même vue servira à regarder une base de l'Ouvrage en raid**. La
géométrie est la même des deux côtés — c'est exactement pour ça que
`GEOMETRIE_BASE` de `data/base.js` RÉFÉRENCE `GRILLE` au lieu de la recopier.
Écrite en dur dans l'écran Chantier, la transformation aurait été recopiée pour
l'écran de raid, et les deux copies auraient divergé.

### ⚠ Ce que l'amendement ne pouvait pas savoir : la convention existait déjà

`src/render/projection.js` place la rangée du fond en tête du canvas **depuis le
lot 3A** : `yDeRangee` vaut `margeY + (GRILLE.longueur − rangee) × tailleCase`,
donc zéro pour la dernière rangée. **Le banc d'essai dessinait déjà dans le bon
sens.** L'écran DOM du lot ÉCRAN-CHANTIER était le SEUL du dépôt à contredire la
convention, parce qu'il posait ses cases dans l'ordre naturel de sa boucle.

Ce n'était donc pas une décision manquante, c'était une **divergence** — et
personne ne pouvait la voir tant que les deux vues n'étaient pas regardées côte
à côte. D'où un troisième test, non demandé : il asserte que le canvas et la
grille CSS ordonnent les rangées **pareil**, pour qu'on ne puisse plus en
corriger un seul.

### La falsification, mesurée une mutation à la fois

Chaque mutation injectée seule, suite relancée, fichiers restaurés et comparés à
l'octet entre deux :

| Mutation | Verdict | Test qui tombe |
|---|---|---|
| miroir remplacé par l'**identité** | ROUGE | orientation — première ligne |
| bande calée sur `premiere` au lieu de `derniere` | ROUGE | orientation — les trois bandes |
| la navigation gèle le jeu (`suspendre()`) | ROUGE | offense — la boucle |
| le déploiement reprend un bouton de bande | ROUGE | chantier — deux bandes |
| chiffre nu remis sur la pastille | ROUGE | chantier — coût de pose |
| pastille court-circuitée par une chaîne en dur | ROUGE | chantier — coût de pose |
| la constante ment (« 3 quartz ») | ROUGE | chantier — coût de pose |

⚠ **L'identité est le piège de ce test, et l'amendement avait raison de le
signaler.** `ligne = rangée` passe un aller-retour parfait : elle est sa propre
réciproque. Ce qui est asserté est donc la **position** — rangée 18 en ligne 1,
rangée 1 en dernière ligne — plus la bijection sur les dix-huit rangées.

---

## 4. Deux écrans

### L'écran Base — deux bandes, un défilement

La barre du bas passe de trois boutons à deux : **Chantier** et **Défense**,
chacun avec son niveau (`4,6` et `—`). Le défilement reste continu. Le jeu
s'ouvre sur le Chantier, qui est désormais en tête du champ — défilement à 0.

⚠ **Le bouton « Assaut » était une faute**, et le retirer était le point le plus
utile de l'amendement. Il pointait sur les rangées 1–2, qui sont l'endroit où les
vagues **paraissent** pendant un combat — pas celui où on les **compose**. Il
promettait un éditeur et livrait du sol nu. Un test refuse maintenant qu'un
bouton « Assaut » reparaisse dans la page.

⚠ **Un défaut trouvé et corrigé avant livraison, que le DOM factice avait
masqué.** Le bouton « Offense → » est écrit dans le balisage, tandis que les
boutons de bande sont ajoutés par le JS : ils se seraient donc posés **après**
lui, et le saut d'écran se serait lu en premier. Réparé par une liste dédiée
(`#chantier-bandes-liste`), et non par un `order` CSS — l'ordre du document doit
rester égal à l'ordre de l'écran.

### L'écran Offense — une coquille qui se dit coquille

Trente-six emplacements, **comptés depuis `EMPLACEMENTS_ASSAUT`** et jamais
écrits en dur : quatre vagues de neuf, dessinées et vides. Quatre titres avec
leur retard, le niveau à `—`, les points à `0 / —`, une palette de quatorze
unités **présente et désactivée**, et un mot qui dit que la composition d'armée
n'existe pas encore.

```
Vague d'attaque 1 / Vague d'attaque 2 (+5 s) / (+10 s) / (+15 s)
9+9+9+9 = 36        niveau —   points 0 / —   14 unités, toutes désactivées
```

⚠ **`GRILLE.intervalleVagueSec` VAUT 5, PAS 10.** La capture de référence
fournie avec l'amendement affiche « +10 s » : c'est un autre jeu. La table du
dépôt fait foi, un test l'asserte de face, et **l'écart est signalé ici plutôt
que tranché** — comme l'amendement le demandait.

⚠ **La palette n'est pas filtrée par niveau, et c'est délibéré.**
`unitesDisponibles(niveau)` de l'Arsenal ne montre que `apparition <= niveau` —
mais le joueur n'a **pas** de niveau d'armée. En choisir un pour pouvoir filtrer
reviendrait à l'inventer. Le roster entier s'affiche, désactivé, et l'écran dit
pourquoi. Les points engagés valent `0` et non `—` : zéro unité, c'est un fait,
pas une lacune.

### Le passage, et ce qu'il ne fait pas

Un bouton dans chaque sens. **La boucle et la sauvegarde ne s'arrêtent pas** :
`suspendre()` / `reprendre()` restent réservés au banc, qui remplace la page, et
au masquage de l'application.

⚠ **Ce défaut aurait été invisible à l'œil**, et c'est pour ça qu'il a mérité un
garde-fou plutôt qu'une relecture : au retour, le rattrapage par l'horloge murale
aurait rendu les ressources manquantes, si bien que le gel ne se serait lu que
sur un chronomètre. Le test lit la source des deux portes — c'est assumé, et son
commentaire dit ses limites.

---

## 5. Le coût qui mentait

`chantier.js` affichait `COUT_NIVEAU_DEUX` en **chiffre nu** dans un coin de
chaque vignette posable : « 3 » sur un Collecteur se lit « poser coûte 3 ». Or
`ECONOMIE_NIVEAU.premierNiveauPayant` vaut **2** — poser au niveau 1 ne coûte
rien, et un commentaire du même fichier l'écrivait noir sur blanc trois lignes
plus haut.

Trois gestes, pas un :

1. **La pastille annonce le fait vrai** : `gratuit`. L'amendement laissait le
   choix entre le dire et le retirer ; une vignette de 82 px n'a pas la place de
   dire « première amélioration », et un chiffre mal légendé est exactement ce
   qu'on répare.
2. **Le champ est renommé** `coutNiveauDeux` → `coutPremiereAmelioration`. Le
   point d'appel ne peut plus se tromper sans que ça se voie en relecture. Un
   test refuse que l'ancien nom survive en doublon.
3. **Le coût n'a pas disparu** : il reste rendu par `posablesDeLaBase` et porté
   par le `title` de la vignette. On ne l'a pas supprimé, on a cessé de le
   présenter comme un prix à payer pour poser.

⚠ **Le bandeau contextuel a été vérifié, comme l'amendement le demandait** : son
bouton « Améliorer » ne porte qu'un niveau cible (« vers niv. 6 »), aucun
chiffre de coût. Rien à corriger là-bas — et un test l'empêche d'en gagner un.

⚠ **Aucune ressource n'est nommée avec ce nombre.** `COUT_NIVEAU_DEUX` donne un
nombre unique et `COUT_ELECTRICITE` une fraction du coût **en quartz** ; rien ne
dit comment le total se répartit depuis que le modèle du lot 1 est parti avec
`data/params.js`. **Vérifié : aucune fonction de coût par niveau n'existe dans
le dépôt.** Un nombre sans ressource est plus honnête qu'un « 3 quartz » faux.

---

## 6. Les deux points du §5 — signalés, non traités

### 6.1 La bande de défense n'a ni garnison ni obstacles

Confirmé dans le code : `OBSTACLES` existe (`{ nombre: 10, … }`) et **seul
`sim/generateur.js` en pose**, pour un site de l'Ouvrage. Rien n'en pose sur la
base du joueur.

⚠ **MAIS L'AMENDEMENT DIT « rien ne dit qu'il devrait y en avoir », ET C'EST
DÉSORMAIS FAUX.** `PASSATION-2026-08-27-soir.md` §3 — déposée sur `main` après
l'écriture de l'amendement — écrit la topologie « une fois pour toutes » :

| Bande | Rangées | Ce qui s'y pose |
|---|---|---|
| Déploiement | 1–2 | rien. Sol nu. |
| **Défense** | **3–10** | **les 10 obstacles, dispersés** |
| Bâtiments | 11–18 | les 12 champs |

La question n'est donc plus « faut-il des obstacles ? » mais **« qui les pose,
et quand ? »** — la passation les annonce sur la base du joueur, et aucun code
ne les y met. C'est un écart entre un document de rang 3 et `src/`, à arbitrer.
Rien n'a été codé : ce lot ne pose pas d'obstacles.

### 6.2 Le niveau à deux décimales

La référence affiche « Niv. base : 55.28 ». Ethan a arbitré **une** décimale le
27/08 et `sim/niveau-de-base.js` range des dixièmes entiers. **L'arbitrage prime
sur la capture** : rien n'a été changé, et l'affichage montre toujours une
décimale, toujours présente (« 6,0 », jamais « 6 »).

---

## 7. La maquette — reprise, et ce qu'elle ne porte pas

`foyer-zero-ui.html` était devenue **fausse sur la navigation** : trois bandes,
grille non retournée. L'amendement laissait le choix entre la reprendre et la
déclarer périmée. **Elle a été reprise** sur les deux points qui mentaient — le
miroir et la barre à deux bandes — parce qu'une maquette qui enseigne une
navigation abandonnée fera écrire le prochain écran de travers.

⚠ **Elle ne porte PAS l'écran Offense**, seulement son renvoi. Écart assumé : la
maquette sert à dessiner une décision **avant** de l'écrire, et cet écran-là a
été écrit dans le même lot. Y redessiner après coup une coquille de trente-six
cases vides créerait une seconde source à maintenir sans rien arbitrer de neuf.
`tools/audit-maquette.mjs` ne regarde pas la navigation et ne l'aurait pas dit —
d'où cette ligne.

Le miroir de la maquette est écrit **comme celui du jeu** — placement explicite
`grid-row: 19 − r` — et non par un ordre d'émission inversé, ce qui aurait aussi
cassé la sonde `r <= 18;` de l'audit.

---

## 8. Les DOUZE vérifications appareil — **AUCUNE EXÉCUTÉE**

⚠ **Un test appareil non exécuté se déclare NON EXÉCUTÉ, jamais passé.**

Cette session n'a ni Galaxy S25 FE, ni émulateur, ni navigateur. Le proxy
sortant refuse même `freredoc.github.io` (403 sur le tunnel CONNECT), donc la
page publiée n'a pas pu être relue.

**Les six de la PR 12 restent dues :**

| # | Vérification | État |
|---|---|---|
| 1 | grille dans la largeur, cellules carrées, 9 colonnes sans défilement horizontal | **NON EXÉCUTÉE** |
| 2 | les boutons de bande amènent où ils disent | **NON EXÉCUTÉE** |
| 3 | les stocks montent en regardant l'écran | **NON EXÉCUTÉE** |
| 4 | fermer, attendre, rouvrir → les stocks ont avancé | **NON EXÉCUTÉE** |
| 5 | le geste de debug ouvre le banc, et on en revient | **NON EXÉCUTÉE** |
| 6 | les boutons inertes se voient inertes | **NON EXÉCUTÉE** |

**Les six de ce lot le sont aussi :**

| # | Vérification | État |
|---|---|---|
| 7 | le jeu s'ouvre sur le Chantier, bâtiments en premier | **NON EXÉCUTÉE** |
| 8 | en défilant : défense, puis les deux rangées de déploiement | **NON EXÉCUTÉE** |
| 9 | le bouton mène à l'Offense, et on en revient | **NON EXÉCUTÉE** |
| 10 | les quatre vagues de neuf sont visibles et vides | **NON EXÉCUTÉE** |
| 11 | l'économie a tourné pendant le passage à l'Offense | **NON EXÉCUTÉE** |
| 12 | aucune vignette ne présente un coût comme un coût de pose | **NON EXÉCUTÉE** |

### Ce qui a été fait à la place, et qui ne vaut pas preuve

Un **DOM factice** (≈ 60 lignes, jeté dans le répertoire de travail, **non
commité**) a fait tourner les deux écrans de bout en bout. Relevé :

```
rangée 18 en ligne 1 | rangée 1 en ligne 18
rail batiments 1/span 8 · defense 9/span 8 · deploiement 17/span 2
boutons : Chantier 1,0 | Défense —          défilement à l'ouverture : 0
clic Défense → scrollTop 312  (= 8 rangées × 39 px)
10 posables ; pastille : « gratuit » ; titre : « …la première amélioration coûtera 8 »
Offense : 36 emplacements, 4 vagues (+5/+10/+15 s), niveau —, points 0 / —,
          14 unités, toutes désactivées
```

Il couvre 7, 8, 10 et 12 **sur la logique**, pas sur le rendu : il ne connaît ni
mise en page, ni cascade, ni `aspect-ratio`, ni défilement réel — c'est-à-dire
exactement ce qui peut casser à l'écran. Il ne remplace **aucune** des douze.

⚠ **Il a d'ailleurs échoué une fois, utilement** : après le renommage du
conteneur des bandes, il est tombé sur un `getElementById` rendant `null`.
C'est la classe d'erreur pour laquelle il existe.

---

## 9. Écarts par rapport à l'amendement

1. **Un troisième test d'orientation, non demandé** — l'accord entre le canvas et
   la grille CSS (§3). L'amendement ne pouvait pas savoir que `projection.js`
   portait déjà la convention ; sans ce test, on pourrait n'en corriger qu'un.
2. **La maquette reprise, mais sans l'écran Offense** (§7), avec la raison.
3. **La pastille dit « gratuit » plutôt que de légender le coût** — l'amendement
   offrait les deux, celle-ci tient dans 82 px.
4. **Le champ de données renommé**, en plus du libellé. L'amendement demandait
   de ne pas se contenter de changer un libellé ; le renommage est ce qui
   empêche le point d'appel de se retromper.
5. **Un défaut d'ordre du document trouvé et corrigé** avant livraison (§4).

---

## 10. Points laissés en suspens

1. **Les douze vérifications appareil** (§8). Seul point qui empêche de dire que
   ce lot est prouvé.
2. **Les obstacles de la bande de défense** (§6.1) — la passation du soir dit
   qu'ils y sont, aucun code ne les y met. À arbitrer : qui les pose, et quand.
3. **L'intervalle entre vagues** — 5 s dans la table, « +10 s » sur la capture.
   La table a été suivie.
4. **Les trois couleurs de terrain de la fiche** — toujours pas arbitrées, donc
   toujours pas employées. Écran et maquette se reprendront ensemble.
5. **La part de scorie dans un coût de construction** — bloque toujours la
   couche d'action, donc la pose, l'amélioration et le démontage.
6. **Le niveau de défense et le niveau d'armée** — l'état ne porte ni garnison ni
   armée ; les deux s'affichent « — ».

---

## 11. Livraison

- **PR**, jamais de merge : le merge sur `main` appartient à Ethan seul.
- La PR 12 étant **fusionnée**, la branche a été **repartie de `main` à jour** :
  une PR fusionnée est finie, elle ne peut pas porter un lot de plus.
- `CLAUDE.md` §0 (compte, taille), §2 (arborescence, **noms compris**) et §6
  sont à jour ; `documentation.test.js` les asserte contre le disque, et la
  suite est verte.
