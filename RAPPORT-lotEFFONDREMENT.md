# RAPPORT — lot EFFONDREMENT

**07/09/2026 — version `0.99.17` · build `118`.**

Retour d'Ethan du 07/09, point **12** : « Lors d'une victoire totale, juste après
la destruction et avant le rapport, détruire les unités et bâtiments de défense
en 2 secondes. »

Arbitrage du 07/09 : **purement visuel, l'état ne bouge pas.**

---

## 0. La base de départ

Ce lot part de `main`, où les trois lots précédents sont mergés.

| Grandeur | Valeur mesurée |
| --- | --- |
| `node --test "test/*.test.js"` | **1 295 pass / 0 fail** |
| `dist/index.html` rebâti au `git worktree` | **8 014 150 octets** |
| version · build | **0.99.16 · 117** |

⚠ **LE BRIEF ANNONÇAIT 1 245 TESTS, 8 003 811 OCTETS ET 0.99.12 · 113 — PÉRIMÉ DE
QUATRE LOTS.** Sans conséquence, mais consigné pour la quatrième fois.

⚠ **`RAPPORT-lotECRAN-RAID.md` EST DANS `rapports/`**, pas à la racine ;
`RAPPORT-lotRETOUR-DE-RAID.md` y est. Les deux ont été lus.

⚠ **LES DEUX ÉCARTS D'OUTILLAGE TIENNENT** : dépôt en LF, **Node 22.14.0
portable** hors du dépôt. Sous le Node 20.11.1 de la machine, `npm test` ne
trouve aucun fichier.

---

## 1. Ce qui a été écrit, et où

**Trois choses, et rien d'autre.**

**① La durée, dans `src/data/sites.js`** — §4 de `CLAUDE.md` : aucun seuil de jeu
ne s'écrit dans un fichier de dessin.

```js
export const ECRAN_RAID = {
  delaiArmementMs: 300,
  effondrementMs: 2000,
};
```

Elle se range avec `delaiArmementMs`, qui est de la même nature — un temps
d'écran arbitré.

**② Deux fonctions PURES, exportées, dans `src/ui/raid.js`** :

```js
export function ordreDeLEffondrement(entites)          // les indices, dans l'ordre où ils tombent
export function effondrees(entites, ecouleMs, dureeMs) // ceux déjà tombés
```

⚠ **L'ORDRE SUIT LE CHEMIN DE L'ASSAUT** — rangée croissante, puis colonne, puis
indice. La rangée 3 est celle que l'assaut rencontre en premier, la 18 celle de
la Souche et de l'Étai : la vague court derrière l'attaquant et se termine sur
les deux objectifs du raid. L'ordre d'insertion aurait donné l'inverse — les
bâtiments d'abord, donc le fond avant l'avant — sans qu'aucune raison ne le
fonde.

⚠ **ET ELLE NE TOUCHE QUE LE CAMP `defense`.** Les unités d'assaut **survivantes
restent à l'écran** : ce sont elles qui ont gagné, et les faire disparaître avec
le site dirait le contraire de ce qui vient de se passer.

**③ Le câblage dans la boucle d'images**, entre la fin du combat et
`montrerResultat` — cinq points dans `src/ui/raid.js`, plus un paramètre
optionnel et `couchesDeLaRuine` dans `src/render/scene.js`.

---

## 2. L'état ne bouge pas, et voici comment on s'en assure

⚠⚠ **C'ÉTAIT DÉJÀ VRAI AVANT LE LOT, ET C'EST LA PREMIÈRE CHOSE À DIRE.**
`executerRaid` commet tout l'état avant la première image — arbitrage « A » du
01/09, écrit en tête de `rejouer` : « LE DÉROULÉ EST UN REJEU, PAS LA SOURCE DE
VÉRITÉ. »

**Aucune ligne de ce lot n'entre dans `src/sim/`** — `git diff --stat` le montre.

Le dessin reçoit un **ensemble d'indices**, et l'état n'est pas touché :

```js
function tombeesALEcran() {
  if (effondrementMs === null || combat === null) return null;
  return effondrees(combat.entites, effondrementMs, ECRAN_RAID.effondrementMs);
}
…
listeAffichage(combat, projection, precedentes, …, etatCourant.graine, tombeesALEcran())
```

⚠⚠ **LE PREMIER JET COPIAIT LE COMBAT** en marquant les tombées `vivant: false`.
C'était juste, et c'était de trop dès lors qu'elles laissent une **ruine** plutôt
que du vide : `listeAffichage` doit savoir laquelle dessiner **autrement**, pas
laquelle sauter. On lui passe donc l'ensemble, et la décision de ce qu'une chose
détruite laisse derrière elle vit chez le **dessin**, où elle appartient.

⚠ **`null` EST LE CAS DE TOUS LES AUTRES APPELANTS** — l'Arsenal, la légende, le
banc, le fond : le paramètre est optionnel, et son défaut ne change rien.

⚠ **ET UNE RUINE N'A NI BARRE DE PV NI TRAIT DE TIR** : la barre dit ce qu'il
reste à casser, et il ne reste rien.

---

## 3. Les quatre choix du §3, écrits un par un

### ① L'écran qui se masque **coupe** l'effondrement

Une **cinquième garde** entre dans l'écouteur `visibilitychange`, **avant** la
quatrième :

```js
if (effondrementMs !== null) { arreterBoucle(); finDuDeroule(); return; }
if (combat === null || combat.termine) return;
```

⚠ **L'ORDRE EST TOUT L'INTÉRÊT.** Pendant l'effondrement le combat est
**terminé** : la garde `combat.termine` renverrait donc sans rien conclure, et le
joueur qui revient trouverait deux secondes d'animation figée devant son
rapport. C'est très exactement le défaut que le lot RETOUR-DE-RAID a réparé,
refait un cran plus loin. `EFF T4`.

### ② Le toucher **n'abrège pas**

Trois raisons, et la troisième tranche :

- deux secondes est **sous le seuil** où un raccourci paie sa complexité ;
- le canevas porte **déjà** le pincement et le glissement, et un toucher qui
  abrège entrerait en concurrence avec eux pendant que le joueur regarde ;
- **Ethan a refusé un raccourci le 06/09**, mot pour mot : « bouton passer non ».
  Un toucher qui abrège est le même geste sans le bouton.

Les **deux vraies sorties** restent : la page masquée et « Instantané ».
`EFF T7` fige la décision — un lot qui la renverserait le fera en le disant.

### ③ La **simulation ne s'effondre pas**

```js
function doitSEffondrer() {
  return !simulation && rapportCourant !== null && rapportCourant.rase === true;
}
```

Le simulateur ne commande rien à personne : le bandeau « SIMULATEUR » existe pour
qu'on ne confonde pas un essai avec un ordre, et **une animation de destruction y
ferait croire à une destruction**. C'est la même garde que celle du son, qui ne
part que sur la vraie attaque, et que la deuxième des quatre de
`visibilitychange`. `EFF T6`.

### ④ « Instantané » **n'attend pas**

`conclureLeDeroule` résout le combat puis appelle `finDuDeroule` alors que
`effondrementMs` vaut encore `null` : le rapport suit **sans une seule image**.
Son sens est d'aller au bout tout de suite. `EFF T5` mesure que
`rafs.horodatage` vaut encore zéro.

⚠ **LA CONDITION SE LIT, ELLE NE SE RECALCULE PAS.** `rapport.rase` sert déjà à
`$('raid-reattaquer').hidden` : c'est la MÊME vérité.

---

## 4. ⚠⚠ Un défaut du lot, trouvé par son propre test

`EFF T4` est tombé, et il avait raison.

Sans la garde `deroule`, **une image arrivant après le rapport relançait
l'effondrement** : `finDuDeroule` remet `effondrementMs` à `null`, le combat est
toujours terminé, et `doitSEffondrer` répond encore oui. Le site se serait remis
à tomber **derrière le panneau de résultat**, en boucle.

```js
if (deroule && combat !== null && combat.termine
  && effondrementMs === null && doitSEffondrer()) {
  effondrementMs = 0;
}
```

En production `arreterBoucle` annule la demande et cette image n'arrive pas —
mais **compter sur une annulation n'est pas une conception**. C'est la même
garde, pour la même raison, que la troisième des quatre de `visibilitychange` :
`deroule` est exactement « un déroulé est en cours ».

⚠ **ET C'EST EN LE CHERCHANT QU'ON A VU AUTRE CHOSE** : `arreterBoucle` annule
par `globalThis.cancelAnimationFrame`, alors que la demande est faite par
`doc.defaultView.requestAnimationFrame`. Dans un navigateur les deux sont le même
objet et rien ne se voit ; dans un faux document, l'annulation ne porte pas.
**Rien n'a été corrigé** — c'est hors du lot, et la garde `deroule` rend le
comportement juste dans les deux cas. Consigné au §9.

---

## 5. Le relevé des sprites de destruction — **deux gisements dormants**

Le brief demandait de chercher avant de fabriquer. Le relevé trouve, et il
trouve deux fois.

| Trouvé | Où | Dans le livrable ? | Employé par |
| --- | --- | --- | --- |
| **12 PNG d'explosion** — `explosion_aeronef_1..4`, `explosion_champignon_1..4`, `explosion_normale_1..4` | `art/sprites/effet/64` et `/128` | **NON** | personne |
| `ruine_j`, `ruine_o` | atlas `batiment` | **OUI** | **personne** |
| `bat_o_*_detruit` (5 bâtiments) | atlas `batiment` | OUI | personne dans `render/` |
| `_feu`, `_fumee` | `render/embleme.js`, `SUFFIXE_AVARIE` | OUI | les emblèmes de la **CARTE**, pas le champ de bataille |

⚠⚠ **IL N'Y A AUCUNE FAMILLE `effet` DANS `src/data/atlas.js`.** Les neuf
familles sont `batiment`, `terrain`, `defense`, `socle`, `unite`, `chassis`,
`tourelle_unite`, `carte`, `limite`. Les douze explosions sont sur le disque
depuis leur fabrication et **ne sont dans aucun atlas, donc dans aucun
livrable**.

⚠⚠ **ET `ruine_j` / `ruine_o` SONT PAYÉES ET INUTILISÉES.** Elles sont dans
l'atlas `batiment`, donc dans les 6,3 Mo d'images du livrable, et un `grep` sur
tout `src/` ne les trouve **que dans leur propre déclaration**. C'est `ui_pause`,
une seconde fois.

### ⚠⚠ Et Ethan a tranché : « utilise ruine_j ruine_o »

Elles sont **mises au travail**, et elles ne coûtent **pas un octet d'image** —
elles étaient déjà dans l'atlas.

**Un BÂTIMENT laisse une ruine ; une structure de défense et une escouade n'en
laissent pas** — Ethan, dans la foulée : « restreins aux bâtiments pour
l'instant ». Le motif est mesurable et non frileux : les deux planches ont été
dessinées pour une case de BÂTIMENT, et personne n'a vu ce qu'elles donnent sous
une tourelle ou sous un mur.

```js
export function couchesDeLaRuine(proprietaire) {
  return [{ famille: 'batiment', nom: `ruine_${lettreDuProprietaire(proprietaire)}` }];
}
```

⚠ **LA LETTRE VIENT DU PROPRIÉTAIRE, JAMAIS DU CAMP** — « le joueur peut
défendre » (CLAUDE.md §4). Les deux planches existent parce que les deux camps
ont des bâtiments ; `ruine_j` n'a pas d'appelant aujourd'hui, et la règle la
servira le jour où un déroulé montrera une base du joueur attaquée.

### ⚠⚠ Et le câblage est POSÉ pour les trois genres

« Prépare les câblages » : ouvrir aux structures ne demandera **pas une ligne de
code**, seulement un mot dans `src/data/sites.js`.

```js
export const RESTE_APRES_DESTRUCTION = {
  batiment: 'ruine',
  defense: 'rien',   // ⚠ en attente d'un coup d'œil d'Ethan
  unite: 'rien',     // ⚠ celui-ci n'a pas de raison de changer
};
```

⚠⚠ **LE PREMIER JET ÉCRIVAIT `if (genreVoulu === 'unite') continue;` DANS
`render/scene.js`.** C'était juste, et c'était déjà une règle de jeu écrite dans
un fichier de dessin. « Pour l'instant » est très exactement ce qui va bouger :
ça appartient à `src/data/` (§4 de `CLAUDE.md`).

⚠ **DEUX VALEURS, ET PAS UNE DE PLUS.** `'ruine'` pose la planche, `'rien'`
efface la pièce. Un troisième reste — une explosion, une fumée — demanderait des
sprites qui ne sont dans aucun atlas : **inventer la valeur avant les sprites
ferait une table qui promet ce qu'elle ne peut pas tenir.**

⚠ **UN GENRE ABSENT DE LA TABLE LÈVE**, il ne retombe pas sur un défaut. Une
entité qu'on oublierait de classer disparaîtrait en silence, et le silence est ce
qu'on ne veut pas d'un effet qu'on ne regarde qu'une fois par raid. `EFF T12` le
mesure.

⚠ **CE QUI RESTE DORMANT** : les douze explosions. Les employer demanderait une
famille d'atlas, donc des octets d'images, donc un delta à ventiler — et le point
13 d'Ethan touchera de toute façon aux mêmes assets. **Le lot les nomme pour que
le suivant les trouve.**

⚠ **CE QU'ON VOIT, DONC** : les pièces de défense s'effacent de l'avant vers le
fond, **les bâtiments laissent une ruine**, et l'attaquant survivant reste debout
au milieu.
**Aucun sprite neuf, aucune teinte neuve, aucun `data:` de plus** — `images +0`,
296 lignes et 291 URI de part et d'autre.

---

## 6. Le temps, et l'absence de seconde horloge

L'effondrement s'intercale dans `image()`, la boucle `requestAnimationFrame` qui
tourne déjà :

```js
if (deroule && combat !== null && combat.termine
  && effondrementMs === null && doitSEffondrer()) {
  effondrementMs = 0;
} else if (effondrementMs !== null) {
  effondrementMs += ecoule;
}
dessiner();
if (effondrementMs !== null) {
  if (effondrementMs >= ECRAN_RAID.effondrementMs) { finDuDeroule(); return; }
} else if (combat !== null && combat.termine) { finDuDeroule(); return; }
```

⚠ **IL COMMENCE À ZÉRO, ET LA PREMIÈRE IMAGE MONTRE DONC LE SITE INTACT.**
Ajouter `ecoule` dès l'entrée ferait sauter la première tranche.

⚠ **AUCUN `setTimeout`** — `EFF T9` le mesure par un compteur posé sur le faux
`window` **et** par un balayage du corps de `image`. Une seconde horloge ne se
figerait pas avec la première quand l'application passe en arrière-plan.

⚠ **LES DEUX PLAFONDS NE BOUGENT PAS** — `PLAFOND_RATTRAPAGE_MS` et
`TICKS_MAX_PAR_IMAGE` sont intacts, `git diff` sur `render/interpolation.js` est
vide.

⚠ **ET L'EFFONDREMENT COMPTE LE TEMPS BRUT, PAS LE TEMPS PLAFONNÉ.** Les deux
plafonds bornent les TICKS de simulation qu'une image résout ; l'effondrement est
une animation d'horloge murale, et une image qui arrive en retard doit avancer
d'autant. La question ne se pose pas en pratique : la page masquée coupe
l'effondrement avant d'en arriver là.

---

## 7. Les tests — PASS/KO de T1 à T9

**Dix tests entrent** (les neuf du brief, plus `EFF T10` pour la règle pure).

| Code | Verdict | Le montage écrit |
| --- | --- | --- |
| **EFF T1** | **PASS** | ⚠⚠ **LE MONTAGE QUI RASE A DÛ ÊTRE CHERCHÉ** : celui du fichier — six Meutes de niveau 1, graine 2026 — rend `rase: false`, et `EFF T1` serait passé sans rien mesurer. Balayage sur six graines × quatre niveaux : **neuf Meutes de niveau 20 sur la graine 42** rasent la Souche au tick 340, seul couple du balayage qui rase. La mesure est un **ÉCART**, pas un nombre absolu : le même raid joué à 0, 2 000 et 4 000 ms coûte **0, 8 et 16 images de 250 ms**. Proportionnel — un délai fixe écrit dans l'écran ne passerait pas la troisième assertion. |
| **EFF T2** | **PASS** | Le montage d'origine, `rase === false`. La durée de la table ne change **rien** : 2 000 ms et 10 000 ms donnent le même compte d'images que 0. **C'est le test qui borne le lot.** |
| **EFF T3** | **PASS** | `structuredClone` de l'état **au milieu** de l'effondrement, deux images de plus, `deepEqual`. Prendre le relevé après aurait été trop tard pour voir une mutation. Et le rapport finit par venir — sinon on aurait mesuré l'immobilité d'un écran mort. |
| **EFF T4** | **PASS**, et il a trouvé un défaut | ⚠ **LA FENÊTRE DE L'EFFONDREMENT NE SE VOIT PAS DE L'EXTÉRIEUR** — `combat` ne sort pas du module, et pendant l'effondrement l'écran ressemble exactement à un combat en cours. On mesure donc le combat SEUL en réglant la table à zéro, puis on rejoue le même raid en s'arrêtant à ce compte-là : on est à la première image de l'effondrement, sûrement. `visibilitychange` → le rapport est là, le déroulé est quitté, et la boucle s'arrête. |
| **EFF T5** | **PASS** | Clic sur `#raid-instantane` juste après le lancement : le rapport suit, et `rafs.horodatage` vaut **zéro** — aucune image n'a été jouée. ⚠ Le bouton est CACHÉ sur un vrai raid (`RDR T4` le tient) ; ce qui est mesuré est le **chemin de code**, celui que `conclureLeDeroule` porte. |
| **EFF T6** | **PASS** | `#raid-simuler`, bandeau « SIMULATEUR » asserté visible. La durée de la table ne change rien : 2 000 et 10 000 ms donnent le même compte que 0. Falsifiable par `EFF T1`, qui mesure l'inverse sur un vrai raid. |
| **EFF T7** | **PASS** | Arrêté à la première image de l'effondrement, `pointerdown` puis `pointerup` sur le canevas : le rapport **n'apparaît pas**. Puis il vient tout seul, par la boucle. Le test fige la décision. |
| **EFF T8** | **PASS** | La mesure est dans `EFF T1` ; celui-ci garde l'autre moitié : la valeur est dans la table, elle vaut 2 000, l'écran la LIT (`ECRAN_RAID.effondrementMs`), et **aucun `2000` n'est écrit en clair dans `src/ui/raid.js`**. |
| **EFF T9** | **PASS** | Un compteur remplace `setTimeout` sur le faux `window` **après** le lancement — `armerLAttaque` en pose un à l'ouverture et il ne regarde pas ce lot. Zéro minuterie de plus jusqu'au rapport. ⚠ Plus la preuve par la source : le corps de `image` ne contient ni `setTimeout` ni `setInterval`. |
| **EFF T10** | **PASS** | *Hors brief.* La règle pure, prise seule : six entités montées à la main — deux à l'avant, une au fond, un attaquant, une morte, une sortie. L'ordre rendu est `[2, 1, 0]` ; l'attaquant, la morte et la sortie n'y sont pas. La chute est proportionnelle, atteint le total à la fin, et une durée nulle fait tout tomber plutôt que de diviser par zéro. ⚠ Falsifiable : sans le tri, l'ordre d'insertion rendrait `[0, 1, 2]`. |

| **EFF T11** | **PASS** | *Ajouté sur demande d'Ethan — « utilise ruine_j ruine_o ».* Un montage aux **trois genres** : une Souche (bâtiment), un Merlon (structure), une escouade. Hors effondrement, **zéro ruine** dessinée et la Souche présente. Les trois tombées : **UNE `ruine_o`**, celle du bâtiment, **zéro `ruine_j`**, et aucune des trois pièces d'origine ne se dessine plus. Plus la règle prise seule : `couchesDeLaRuine('ouvrage')` et `('joueur')` rendent les deux planches. |
| **EFF T12** | **PASS** | *Ajouté sur demande d'Ethan — « prépare les câblages ».* Le réglage du jour est asserté en clair, puis **ouvert** — `defense: 'ruine'` → deux ruines — puis **refermé** — une ruine : le câblage répond dans les **deux** sens, sinon il ne prouverait qu'une porte qui s'ouvre. ⚠ Et un genre **retiré** de la table fait **lever** `listeAffichage` : une entité qu'on oublierait de classer disparaîtrait en silence. La table est restaurée en `finally`, et le test le vérifie. |

⚠ **LE FAUX DOCUMENT APPREND À RETENIR SA RAPPEL D'IMAGE**, et rien de plus. Il
ne comptait que les demandes, ce qui suffisait tant qu'aucun test n'avait besoin
de faire avancer le temps — c'est ce que `RDR T1` exploite, une boucle qui ne
rappelle jamais. **Aucun test existant n'a changé de comportement.**

---

## 8. Les chiffres

| Grandeur | Avant | Après | Écart |
| --- | --- | --- | --- |
| `npm test` | **1 295 pass / 0 fail** | **1 307 pass / 0 fail** | **+12** |
| `dist/index.html` | **8 014 150** | **8 015 213** | **+1 063** |
| lignes `data:` | 296 | **296** | **0** |
| URI `data:` | 291 | **291** | **0** |
| `SAVE_VERSION` | 27 | **27** | **0** |
| version · build | 0.99.16 · 117 | **0.99.17 · 118** | — |

| Poste | Écart |
| --- | --- |
| JavaScript | **+1 063** |
| feuille · balisage · **images** · audio | **+0** |

**La somme des cinq postes tombe EXACTEMENT sur le total.** Borne T10 inchangée à
**9 300 000** ; marge **1 284 787 octets, 13,82 %**. Zéro référence externe.

⚠ **`images +0` EST LE CHIFFRE À LIRE** : le lot ajoute un effet visuel — un
champ de ruines — **sans un octet d'image**, parce que les deux planches étaient
déjà payées et dormaient.

---

## 9. Écarts et points en suspens

### ⚠⚠ 9.1 — Le rendu n'a pas été vu, et c'est plus gênant que d'habitude

**Non exécuté.** Ce lot est le premier depuis longtemps dont l'objet EST un effet
visuel. Ce qui est mesuré ici est le **temps** et l'**état** — pas l'aspect. La
disparition progressive elle-même n'a été vue par personne : ni sur appareil, ni
dans un navigateur.

Ce qui reste à juger à l'œil : est-ce que deux secondes se **sentent** ? est-ce
qu'un bâtiment en ruine au milieu de pièces effacées lit comme une destruction ?
**La question des structures est REPORTÉE, pas tranchée** — `RESTE_APRES_DESTRUCTION`
attend un coup d'œil, et le câblage est déjà éprouvé.

### ⚠ 9.2 — `arreterBoucle` annule par `globalThis`

`arreterBoucle` appelle `globalThis.cancelAnimationFrame`, alors que la demande
vient de `doc.defaultView.requestAnimationFrame`. Dans un navigateur les deux
sont le même objet ; ailleurs — un faux document, une iframe — l'annulation ne
porte pas. **Rien n'a été corrigé** : c'est hors du lot, et la garde `deroule` du
§4 rend le comportement juste dans les deux cas.

### 9.3 — Points en suspens

1. **`ruine_o` sous une tourelle, est-ce que ça tient ?** C'est LA question
   ouverte, et elle est câblée : `RESTE_APRES_DESTRUCTION.defense` passe de
   `'rien'` à `'ruine'`, **un mot**, et `EFF T12` prouve que le câblage répond.
   Il faut un coup d'œil avant, pas un pari.
2. **Faut-il des explosions en plus des ruines ?** Les douze dorment toujours ;
   les employer demanderait une famille d'atlas, donc des octets. §5.
3. **Deux secondes, est-ce le bon temps ?** La valeur est dans la table, elle se
   change sans migration, et `EFF T1` la mesure quelle qu'elle soit.
4. **Le toucher doit-il abréger ?** Décidé non, §3-②. La décision tient en un
   écouteur si Ethan la renverse.
5. **`package.json` ne déclare aucun `engines`.** Toujours non fait.

---

**PR ouverte, non mergée.**
