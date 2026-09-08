# RAPPORT — lot ÉTAT-EN-RAID

**08/09/2026 · version 0.99.34 · build 136 · branche `claude/lot-etat-en-raid`**

Deux défauts vus par Ethan sur une partie réelle, après le lot
BÂTIMENTS-QUATRE-ÉTATS : les bâtiments d'un raid restaient tout neufs quels que
soient leurs PV, et un bâtiment détruit laissait la ruine générique du camp au
lieu de sa propre planche.

**Les deux étaient du câblage.** Les quarante planches abîmées et les vingt
planches détruites étaient dans l'atlas depuis la veille, payées en octets,
demandées par personne. **Aucun art dans ce lot, aucun seuil touché.**

---

## 1. Les deux causes, confirmées par la lecture

Le brief demandait de vérifier avant d'appliquer. Les deux se confirment ; une
troisième affirmation, en revanche, ne tient pas — §4.

### Cause A — confirmée

`src/render/scene.js`, boucle des entités visibles, composait :

```js
couchesDeLEntite({
  genre: e.genre, id: e.id, proprietaire: e.proprietaire, camp: e.camp,
  rangee: …, colonne: …,
}, { cible: cibleAffichee(e) })
```

Aucun champ `etat`. `couchesDuBatiment` lit `d.etat ?? 'intact'` — et **ce
défaut est juste** : il sert les montages qui composent un bâtiment à la main,
et il y en a plusieurs au dépôt. Résultat : chaque bâtiment de chaque raid
composait sur le défaut.

La vérification que le brief proposait tient aussi : `etatDuBatiment` n'avait
qu'**un** appelant, `src/sim/reparation.js:750`, pour la pose dans la base. Le
chemin du combat ne l'appelait nulle part.

**Mesuré avant le correctif** (les deux fichiers source remis à `HEAD`, le
fichier de test neuf en place) : `bat_o_souche` rendu aux **six** valeurs de PV
d'`ER T2`, y compris à zéro.

### Cause B — confirmée

`src/data/sites.js` portait `RESTE_APRES_DESTRUCTION.batiment = 'ruine'`, et
`scene.js` en tirait `couchesDeLaRuine(e.proprietaire)`.

**Mesuré avant le correctif** : la Souche et le Nœud, deux bâtiments différents
du même camp, rendaient tous deux `ruine_o` — le même tas de gravats. C'est le
défaut d'Ethan, mot pour mot.

---

## 2. Ce qui a été fait

### A — le rendu demande l'état, il ne le calcule pas

```js
...(e.genre === 'batiment'
  ? { etat: estTombee(e) ? 'detruit' : etatDuBatiment(e.pvMilli, e.pvMaxMilli) }
  : {}),
```

⚠⚠ **La règle des seuils n'entre pas dans `render/`.** Le rendu APPELLE
`etatDuBatiment`, qui vit dans `src/data/base.js`. `ER T6` interdit tout suffixe
d'état (`_abime`, `_tres_abime`, `_detruit`) écrit en dur dans `render/` ou
`sim/` — et le motif est falsifiable des deux côtés : il attrape l'appât et
laisse passer le nom d'état, qui est du vocabulaire de jeu légitime.

⚠ **Et seulement pour les bâtiments**, par `...` conditionnel : le champ est
**absent** pour les unités et les structures, pas à `undefined`. Un champ passé
partout serait un champ qu'on croit lu.

⚠⚠ **L'effondrement force `detruit`, il ne le calcule pas.**
`ordreDeLEffondrement` ne prend que les **survivantes** du camp de la défense :
une pièce qui tombe à l'effondrement est à pleins PV, et un rendu qui lirait
`pvMilli` la dessinerait intacte pendant qu'elle s'écroule. `ER T3` monte les
deux bâtiments à `pvMilli === pvMaxMilli` et l'asserte.

### B — une troisième valeur, `'planche'`

`RESTE_APRES_DESTRUCTION.batiment = 'planche'` pose la planche `_detruit` **du
bâtiment**. Deux gardes neuves dans `scene.js` :

- un reste **inconnu** lève, au lieu de retomber sur le dessin ordinaire — une
  valeur mal orthographiée relèverait la pièce toute neuve au milieu de
  l'effondrement, ce qui a l'air d'un choix ;
- `'planche'` demandé pour un genre **sans états** lève aussi, au lieu de
  dessiner la pièce intacte en silence.

⚠ **Le commentaire de la table a été réécrit, pas effacé.** Il disait « un
troisième reste demanderait des sprites qui ne sont dans aucun atlas » — vrai au
lot EFFONDREMENT, **faux depuis que les vingt planches `_detruit` sont cousues**.
Il dit maintenant pourquoi il n'y avait que deux valeurs et ce qui a changé,
sinon la troisième se relira comme une entorse et quelqu'un la retirera « pour
revenir au propre ».

---

## 3. Les tests

Fichier neuf `test/etat-en-raid.test.js`. **Chacun a été passé avant ET après le
correctif**, les deux fichiers source remis à `HEAD` pour la mesure d'avant.

| Test | Ce qu'il mesure | Avant | Après |
| --- | --- | --- | --- |
| **ER T1** | Un bâtiment à la moitié de ses PV rend `_abime`, et à pleins PV le nom nu | **rouge** — rendait `bat_o_souche` | vert |
| **ER T2** | Six PV (1000, 999, 500, 499, 1, 0) → quatre suffixes, **dans le rendu** | **rouge** | vert |
| **ER T3** | Deux bâtiments tombés du même camp → deux noms différents | **rouge** — `ruine_o` deux fois | vert |
| **ER T4** | `ruine_j`/`ruine_o` restent atteignables, et la carte n'en dépendait pas | vert | vert |
| **ER T5** | Une unité et une structure entamées rendent le même nom qu'intactes | vert | vert |
| **ER T6** | Aucun suffixe en dur, et le dessin suit la table **dans les deux sens** | **rouge** | vert |

⚠ **T4 et T5 passaient déjà, et c'est voulu** : ils gardent ce qui ne devait pas
bouger. Un lot dont tous les tests rougissent avant n'a rien gardé.

### Le montage de T2, et pourquoi `pvMax` vaut 1 000

La Souche a 5 500 000 millièmes de PV : « la moitié moins un » y serait un rang
de mesure plus loin que la frontière visée. Le montage fixe `pvMaxMilli` à
**1 000**, ce qui donne des bornes entières — 1000, 999, 500, 499, 1, 0 —,
c'est-à-dire très exactement les six compositions que le brief demande. La règle
elle-même reste gardée au PV près par `B4 T3`, sur 201 valeurs ; ce qui manquait
était qu'elle **traverse**.

### Deux tests existants changent de valeur

`EFF T11` et `EFF T12` figeaient la ruine générique sous un bâtiment — très
exactement ce qu'Ethan fait changer. **Ils rougissaient tels qu'ils étaient
écrits.** Aucun n'a été assoupli : `EFF T11` exige maintenant la planche ET
l'absence de toute ruine générique, et `EFF T12` gagne **deux gardes** —
`'planche'` sur une structure lève, un reste mal orthographié lève.

---

## 4. ⚠⚠ ÉCART AU BRIEF — LE BRIEF SE TROMPE SUR `ruine_j`/`ruine_o`

Le brief écrit : « `ruine_j` ET `ruine_o` RESTENT […] Elles servent à la base
**RASÉE sur la carte** ». **C'est faux, et la lecture le montre.**

Une base rasée est **retirée** de la carte par `sitesDeLaFenetre`, un `.filter`
sur `casesRasees` (`src/ui/monde.js:373`). Ce qui se dessine à sa place est
`dessinerRuineDUneCase` de `src/render/embleme.js`, qui va chercher
`spriteDeLaRuine` dans la famille **`embleme`** — les planches de ruine de site,
pas les deux de la famille `batiment`. Un `grep` sur tout `src/` ne trouve
`couchesDeLaRuine` qu'à deux endroits : sa déclaration, et la ligne même que ce
lot change.

**Autrement dit : l'unique lecteur de production de `ruine_j`/`ruine_o` était
`RESTE_APRES_DESTRUCTION.batiment`.**

**Ce qui a été fait, et pourquoi.** Elles ne sont **pas** retirées — l'intention
du brief est claire et elle est juste : ne pas les renvoyer dormir, ce qui serait
`ui_pause` une quatrième fois et cette fois de notre main. Le chemin vers elles
reste ouvert et **mesuré** : `RESTE_APRES_DESTRUCTION.defense`, que tu as parké
« en attente d'un coup d'œil », les remet à l'écran en changeant **un mot**, et
`EFF T12` fait le va-et-vient dans les deux sens. `ER T4` fige la lecture
ci-dessus pour qu'elle ne se reperde pas.

**Ce que ça te laisse à trancher** : aujourd'hui les deux planches ne se
dessinent nulle part en jeu. Soit tu ouvres `defense: 'ruine'` — un mot, et tu
regardes ce que ça donne sous une tourelle, ce que personne n'a encore vu —, soit
elles restent en réserve. Ce n'est pas une décision de dessin, donc elle ne se
prend pas ici.

**Aucun autre écart au brief.** Le nom de la troisième valeur était libre :
`'planche'` a été retenu parce qu'il dit ce qui reste sans nommer un fichier.

---

## 5. Le poids

| | |
| --- | --- |
| `dist/index.html` avant | **8 654 729** octets (0.99.33 · build 135) |
| après | **8 655 020** octets (0.99.34 · build 136) |
| coût | **+291 octets, entièrement du JavaScript** |
| lignes `data:` | **297 avant, 297 après** — aucun actif touché |
| borne T10 | 9 300 000, inchangée |
| marge | **644 980 octets, 6,94 %** |

`npm test` → **1461 pass / 0 fail** (1 455 avant).

⚠ **La marge continue de descendre** — 7,02 % le matin, 6,94 % depuis
NEUTRALISATION, 6,94 % ici. Ce lot n'y est pour rien (il ne pèse que du code),
mais le point reste le plus sérieux du dépôt : **le prochain lot d'art devra être
mesuré avant d'être cousu.**

---

## 6. Ce qui reste ouvert

1. ⚠⚠ **`ruine_j`/`ruine_o` n'ont plus de lecteur en jeu** — §4. Un mot dans
   `RESTE_APRES_DESTRUCTION.defense` suffit à les rendre au dessin ; c'est ton
   coup d'œil qui manque, pas le câblage.
2. ⚠ **Un bâtiment tombé à zéro PV pendant le raid ne montre pas `_detruit`.**
   `retirerLesMorts` passe `vivant` à faux et `visible` le retire de la liste à
   l'instant même : il disparaît, il ne s'affiche pas en ruine. `_detruit` est ce
   que l'**effondrement** dessine. Les deux moitiés du lot sont donc
   complémentaires — la première donne `abime` et `tres_abime` à l'écran, la
   seconde `detruit`. Si tu veux voir la planche détruite **pendant** le raid, ça
   se décide dans `sim/`, pas ici, et c'est un lot.
3. **Le rendu n'a pas été vu**, ni sur appareil ni dans un navigateur, et se
   déclare non exécuté. Tout est mesuré sur la liste d'affichage.
4. **La marge T10**, §5.

---

## 7. Rendu

Branche `claude/lot-etat-en-raid`, **PR ouverte, non mergée**.
