# RAPPORT — lot CIBLES-RANGÉES

**07/09/2026 — version `0.99.16` · build `117`.**

Retour d'Ethan du 07/09, point **9** : « Audit sur les cibles ouvrage : elles sont
toutes positionnées de façon identique. Elles doivent bien + aléatoire. »

C'est une **reprise**. Le lot COLONNE du 06/09 a traité la même plainte et n'en a
traité que la moitié.

---

## 0. La base de départ

Ce lot part du tip de `claude/lot-raid-cible-unique`, **rebasé sur `main`** — la
PR PRODUCTION-EN-DÉFENSE est mergée, celle de RAID-CIBLE-UNIQUE ne l'est pas.

| Grandeur | Valeur mesurée |
| --- | --- |
| `node --test "test/*.test.js"` | **1 287 pass / 0 fail** |
| `dist/index.html` rebâti au `git worktree` | **8 012 887 octets** |
| version · build | **0.99.15 · 116** |

⚠ **LE BRIEF ANNONÇAIT 1 245 TESTS, 8 003 811 OCTETS ET 0.99.12 · 113 — PÉRIMÉ DE
TROIS LOTS.** Sans conséquence, mais consigné.

⚠ **`RAPPORT-lotCOLONNE.md` EST BIEN À LA RACINE**, et il a été lu en entier :
ses dix-neuf falsifications et la liste de ses gardes sont ce sur quoi ce lot
travaille.

⚠ **LES DEUX ÉCARTS D'OUTILLAGE DES LOTS PRÉCÉDENTS TIENNENT** : dépôt en LF
(`core.autocrlf false`, posé sur ce dépôt seulement) et **Node 22.14.0 portable**,
hors du dépôt. Sous le Node 20.11.1 de la machine, `npm test` ne trouve aucun
fichier.

---

## 1. L'audit du §1, rejoué — avant et après

200 graines, `genererSite({ type, niveau, graine })`. Les trois mesures demandées,
plus la décomposition défenses / bâtiments.

### Avant le lot

| type | niv | dispositions complètes | **formes** (id + rangée) | **profils par rangée** |
| --- | --- | --- | --- | --- |
| camp | 3 | 200 | **1** | **1** |
| camp | 7 | 200 | **3** | **1** |
| camp | 15 | 200 | 145 | **1** |
| camp | 30 | 200 | 200 | **1** |
| avantPoste | 7 | 200 | 5 | **1** |
| base | 30 | 200 | 200 | **1** |

**Un seul profil d'occupation par rangée, partout.** Les « formes » qui varient
aux hauts niveaux ne viennent pas de la disposition : c'est la COMPOSITION qui
change, `composerRepartition` tirant quelles pièces sont posées.

### Après le lot

| type | niv | complètes | **formes** | **profils par rangée** | dont défenses | dont bâtiments |
| --- | --- | --- | --- | --- | --- | --- |
| camp | 3 | 200 | **18** | **18** | 4 | 10 |
| camp | 7 | 200 | **39** | **21** | 6 | 10 |
| camp | 15 | 200 | 197 | **86** | 25 | 35 |
| camp | 30 | 200 | 200 | **187** | 119 | 74 |
| avantPoste | 3 | 200 | 18 | **18** | 5 | 10 |
| avantPoste | 7 | 200 | 66 | **34** | 12 | 10 |
| avantPoste | 30 | 200 | 200 | **200** | 169 | 133 |
| base | 15 | 200 | 200 | **187** | 124 | 74 |
| base | 30 | 200 | 200 | **200** | 164 | 140 |

Le camp de niveau 7, trois graines — l'exemple du brief :

```
graine 1 :  rangée 10 : 5 · rangée 11 : 7 · rangée 18 : 2
graine 2 :  rangée 10 : 5 · rangée 11 : 6 · rangée 12 : 1 · rangée 18 : 2
graine 3 :  rangée  9 : 1 · rangée 10 : 4 · rangée 11 : 7 · rangée 18 : 2
```

**D'autres rangées, d'autres comptes.** C'est ce que le §3 demandait.

### ⚠⚠ Pourquoi `COL T15` n'a rien vu

Il mesure le **multi-ensemble des charges par colonne**. Il est passé vert sans
jamais regarder l'axe qui gênait Ethan. Le brief d'alors demandait « le
multi-ensemble des `(rangee, id)` », et l'exécution a mesuré autre chose.

**Le montage de `CR T1` ignore la colonne par construction** — il ne compte que
`rangée → nombre d'occupants` — **et il porte sa propre falsification** : le même
balayage AVEC les colonnes distingue les 40 graines, celui sans en distingue
moins. Sans cette ligne, rien ne prouverait qu'il ne refait pas la faute.

Une note a été ajoutée à `COL T15` : il reste juste et utile, mais il ne prouve
pas que deux sites ont deux formes.

---

## 2. La réponse à la contrainte 2 : **six pour les défenses, neuf pour les bâtiments**

Le brief relevait « 7 occupants en rangée 11 » et demandait laquelle des deux
hypothèses était vraie. **C'est la première : la contrainte ne s'applique pas aux
bâtiments.**

- La rangée 11 est la première de la bande des **bâtiments** (11 à 18) ;
- `placerDefenses` passe `occupantsMaxParRangee` = **6** ;
- `placerBatiments` passe `GRILLE.largeur` = **9**.

Mesuré sur trois types × cinquante niveaux × vingt graines, avant comme après :

| groupe | maximum par rangée | plafond de la table |
| --- | --- | --- |
| défenses | **6** | `occupantsMaxParRangee` = 6 |
| bâtiments | **9** | `GRILLE.largeur` = 9 |

**Aucune contrainte n'était violée.** Six a un motif que les bâtiments n'ont pas —
laisser passer l'assaut. `CR T4` asserte les deux plafonds, et exige que les
bâtiments dépassent vraiment six, sans quoi la question ne se poserait plus.

---

## 3. Le relevé des portées minimales — et une contrainte 4 fondée sur une phrase fausse

| pièce | portée | portée mini | rangée la plus avancée qui garde une cible |
| --- | --- | --- | --- |
| merlon | 0 | 0 | 3 (elle ne tire pas) |
| ronce, herse | 1 | 0 | 3 |
| casemate, creneau, batterie | 2,5 | 0 | 3 |
| **faucheuse, mortier, harpon** | **5,5** | **3,5** | **3** |

**La borne est VACUEUSE : aucune rangée de la bande de défense n'est interdite à
aucune pièce.** Depuis n'importe quelle rangée, la couronne `[12,25 ; 30,25]` en
milli-cases² contient des cases — quatre rangées devant, par exemple.

⚠⚠ **ET C'EST DÉJÀ MESURÉ DEPUIS LE 25/08, DANS `data/sites.js` :**

> Le raisonnement est en RANGÉES ; le moteur, lui, teste une distance EUCLIDIENNE
> 2D […] Une Faucheuse en rangée 3 atteint donc les colonnes lointaines dès
> l'apparition, puis tire dans le dos de ce qui l'a dépassée. Mesuré sur cinq
> graines au niveau 30 : 23 ticks de tir, premier tir au tick 1. **Elle n'est PAS
> inerte.**

La phrase « posée à l'avant, elle ne tirerait jamais » était fausse, et **trois
endroits la portaient encore** : le brief, l'en-tête de `placerDefenses`, et le
premier bloc de `T7` de `generateur.test.js` — qui « prouvait » l'inertie avec une
distance à **un seul axe**. Les trois sont corrigés.

**Ce qui borne vraiment l'artillerie est l'ORDRE**, et son motif est le gradient
d'engagement : 23 ticks de tir en rangée 3 contre 110 en rangée 10, 32 cases de
couverture contre 50. `verifierLeRetraitDesPortees` le garde maintenant
explicitement — aucune artillerie devant quoi que ce soit d'autre — au lieu de le
déduire d'une construction que ce lot fait bouger.

⚠ **UNE FAUTE DU LOT A ÉTÉ TROUVÉE PAR SON PROPRE TEST.**
`rangeeLaPlusAvanceeQuiTire` rendait la rangée du **fond** pour un Mur : `portee:
0`, couronne vide, boucle sans aboutissement, repli mal choisi. Un Merlon
n'aurait eu le droit de se poser que collé aux bâtiments. `CR T3` lisait 10 là où
il attendait 3. Corrigé avant livraison.

⚠ **CONSÉQUENCE MESURÉE : l'artillerie descend maintenant jusqu'à la rangée 8**,
contre 9 avant le lot. Les rangées se remplissaient six par six, donc les douze
premières places tenaient en rangées 9 et 10 ; une rangée du fond peut désormais
n'avoir qu'un occupant. `T7` écrit le 8 **en clair**, pour qu'une dispersion qui
irait plus loin fasse tomber le test.

---

## 4. Ce qu'il a fallu écrire

`taillesDeRangee` était la cause, et elle seule :

```js
// AVANT — une fonction pure de `nb`, donc du niveau.
const tailles = [];
let reste = nb;
for (let k = 0; k < rangees; k++) { const t = Math.min(parRangee, reste); tailles.push(t); reste -= t; }
```

```js
// APRÈS — le découpage d'avant, puis des TRANSFERTS.
const tailles = new Array(rangeesMax).fill(0);
…
for (let k = 0; k < brassages; k++) {
  const depuis = entier(rng, 0, rangeesMax - 1);
  const vers = entier(rng, 0, rangeesMax - 1);
  if (depuis === vers) continue;
  if (tailles[depuis] === 0) continue;
  if (tailles[vers] + 1 > parRangee) continue;
  tailles[depuis] -= 1;
  tailles[vers] += 1;
  if (!contigueDepuisLOrigine(tailles)) { tailles[depuis] += 1; tailles[vers] -= 1; }
}
return tailles.filter((t) => t > 0);
```

Même forme que `profilDeCharge`, et pour les mêmes raisons.

⚠ **LES DEUX BORNES SONT TIRÉES AVANT TOUT TEST** : un transfert refusé consomme
ses tirages comme un accepté. C'est la règle du §5.

⚠ **LE TABLEAU FAIT `rangeesMax` CASES**, pas `ceil(nb / parRangee)` : sans les
cases vides au bout, aucun transfert ne pourrait AJOUTER une rangée, et le nombre
de rangées resterait la fonction pure de `nb` qu'on vient de retirer.

⚠ **LA CONTIGUÏTÉ EST GARDÉE PAR CONSTRUCTION** — c'est la contrainte 1, et
`COL T16` l'assertait déjà : « les rangées occupées sont les plus ARRIÈRE, sans
trou ».

### `brassagesDeRangee` = 24, et le tableau qui le justifie

Profils distincts sur 200 graines, tous occupants / défenses seules :

| transferts | camp n.3 | camp n.7 | base n.15 | base n.30 |
| --- | --- | --- | --- | --- |
| 6 | 5 / 2 | 6 / 3 | 59 / 25 | 122 / 50 |
| 12 | 10 / 4 | 12 / 5 | 117 / 53 | 190 / 121 |
| 18 | 11 / 4 | 13 / 5 | 162 / 90 | 200 / 147 |
| **24** | **18 / 4** | **21 / 6** | **187 / 124** | **200 / 164** |
| 36 | 25 / 4 | 32 / 10 | 200 / 158 | 200 / 191 |
| 48 | 35 / 4 | 44 / 13 | 198 / 172 | 200 / 197 |

⚠ **LE COMPTE MONTE ENCORE À 48 : 24 N'EST PAS UN OPTIMUM**, et la table le dit.
Ce qui plafonne est la colonne des défenses aux bas niveaux — un camp de niveau 3
n'a que trois défenseurs et pas plus de quatre façons de les répartir sous les
contraintes. Aucun nombre de transferts ne l'ouvre. **Monter est sans risque et
sans migration** ; la valeur est dans la table pour ça.

---

## 5. Le décalage du PRNG — mesuré, et il change de NATURE

Mesuré en instrumentant `tirer` dans les deux arbres, puis en restaurant le
fichier. Trois graines par ligne :

| montage | tirages AVANT | tirages APRÈS |
| --- | --- | --- |
| camp n.3 | 192 / 192 / 192 | **296 / 296 / 296** |
| camp n.7 | 195 / 195 / 195 | **291 / 299 / 299** |
| camp n.20 | 234 / 234 / 234 | **338 / 330 / 354** |
| base n.15 | 251 / 251 / 251 | **363 / 371 / 371** |
| base n.30 | 297 / 297 / 297 | **393 / 409 / 425** |
| base n.50 | 318 / 318 / 318 | **422 / 438 / 430** |

⚠⚠ **ET LE COMPTE CESSE D'ÊTRE LE MÊME D'UNE GRAINE À L'AUTRE, CE QUI SE
DÉCLARE.** Avant, `genererSite` consommait un nombre FIXE de tirages pour un
couple (type, niveau). Après, il dépend des tailles tirées :
`repartirLesColonnes` tire neuf clés **par rangée**, et le nombre de rangées
varie.

**Ce n'est PAS le « tire, si ça ne va pas recommence » que le §5 interdit.** Il
n'y a aucune boucle de reprise : le `rng` de `genererSite` naît de la graine du
site, **ne sort jamais de la fonction**, et personne d'autre ne le consomme —
`genererVague` et `genererAssaut` créent le leur. Le site reste une fonction PURE
de ses paramètres, et `CR T6` le mesure sur trois types, dans les deux sens.

**Ce que ça change aux sites existants : tout.** Obstacles, composition, vagues.
Dix-huit tests l'ont mesuré en tombant, et le §7 dit lesquels.

---

## 6. Les tests — PASS/KO de T1 à T8

**Huit tests entrent. Deux tests existants changent d'assertion, et les deux se
RESSERRENT.**

| Code | Verdict | Le montage écrit |
| --- | --- | --- |
| **CR T1** | **PASS** | 200 graines × 4 couples (type, niveau). `profilDeRangee` ne lit que `rangée → nombre d'occupants` — **la colonne n'y entre pas**. Le compte d'avant le lot, **1**, est écrit dans le test. ⚠ Et la falsification du montage : le même balayage AVEC les colonnes distingue les 40 graines, celui sans en distingue strictement moins. C'est ce qui prouve qu'il ne refait pas la faute de `COL T15`. |
| **CR T2** | **PASS** | Second angle : le multi-ensemble des couples `(rangée, id)`, sur 40 graines et trois types. ⚠ Plus une falsification par le bas — le plus petit camp, 200 graines : il n'est plus identique à lui-même. |
| **CR T3** | **PASS** | Les deux moitiés de la contrainte 4. La géométrie : `rangeeLaPlusAvanceeQuiTire` rend la rangée la plus avancée de la bande pour les NEUF défenses, Mur compris — c'est le relevé du §3, et c'est ce test qui a trouvé la faute du repli. L'ordre : sur 100 graines × 3 types, **aucune artillerie devant quoi que ce soit d'autre**, plus de 100 artilleries vues. Le montage asserte qu'il y a bien trois pièces à portée minimale, toutes à 3,5. |
| **CR T4** | **PASS** | 100 graines × 3 types. Les deux seuils **écrits en clair et non touchés** (`6` et `2`), les six occupants, les trois colonnes libres, la contiguïté sans trou, l'écart de charge sur les DEUX groupes. ⚠ Le budget d'écart est VRAIMENT consommé — `ecartMax === 2` asserté — et les bâtiments dépassent vraiment six par rangée, sans quoi la question du §2 ne se poserait plus. |
| **CR T5** | **PASS** | Souche et Étai, rangée 18, colonnes 5 et 4, sur 100 graines × 3 types. Non-régression de `COL T18` sur le chemin neuf : les deux uniques sont posés HORS du tirage. |
| **CR T6** | **PASS** | Même graine deux fois, `deepEqual`, sur trois types. ⚠ Plus la contre-épreuve : la graine voisine rend un site différent — sans elle, un générateur figé passerait. |
| **CR T7** | **PASS** | `COL T15` rejoué à l'identique sur le chemin neuf : le multi-ensemble des charges par colonne varie encore, sur quatre couples. **Un lot qui gagnerait les rangées en perdant les colonnes n'aurait rien gagné.** |
| **CR T8** | **PASS** | Le décalage du PRNG est au §5 — c'est une MESURE, et elle ne s'observe qu'en instrumentant `tirer`. Ce test garde l'autre moitié : `densite` n'a pas bougé. Sur 40 graines × 4 couples, le nombre de bâtiments, de défenses et d'obstacles est exactement celui de la table. **Le lot DÉPLACE, il n'ajoute ni ne retire.** |
| **T6** *(existant)* | **MODIFIÉ** | `rangees.size === ceil(nb / 6)` était **le défaut lui-même**. Devient un ENCADREMENT — `[ceil(nb/6), min(8, nb)]` — **plus une falsification** : un même effectif doit se répartir sur deux nombres de rangées différents selon la graine. Le plafond par rangée, la bande et la contiguïté restent assertés à l'identique. |
| **T7** *(existant)* | **MODIFIÉ** | Le bloc qui « prouvait » l'inertie de l'artillerie par une distance à un seul axe est **retiré et remplacé par sa contre-mesure en 2D**. `a.rangee >= bande.derniere - 1` devient l'ordre COMPLET — aucune artillerie devant aucune autre pièce — plus la borne géométrique. La rangée la plus avancée atteinte, **8**, est écrite en clair. |

---

## 7. Les dix-huit tests réancrés

⚠⚠ **AUCUN TÉMOIN N'A ÉTÉ RAFRAÎCHI EN BLOC.** Deux couches s'empilent, nommées,
et le reste continue d'être gardé contre sa capture d'origine.

| Fichier | Test | Ce qui a été fait |
| --- | --- | --- |
| `journal.test.js` | JOURNAL T1 | **Troisième couche** : `COMBATS_DEPLACES_PAR_CIBLES_RANGEES`, 200 combats, **1 208 champs**. La surcharge passe de 1 291 à **1 296** — l'UNION, pas la somme : 1 203 champs étaient déjà couverts. Il reste **304 champs** adossés à la capture d'avant JOURNAL-DE-COMBAT. |
| `journal.test.js` | JOURNAL T8 | **Prémisse réparée** : la graine 12 n'écrase plus personne (0 contre 2). Balayage 1→60, cinq graines en écrasent exactement deux ; **35** retenue, 821 impacts pour un seuil de 500. ⚠ Et une entité posée PENDANT le tick n'a pas de « avant » : la soustraction rendait `NaN`, ce qui aurait fait tomber l'assertion en accusant le journal. Les impacts sans passé sont écartés, avec la raison. |
| `bases.test.js` | BASES-0 T1 ×3 | **Overlay** `DEPLACES_PAR_CIBLES_RANGEES` : **58 couples**, tous à partir de la phase 7 — le premier raid. Les phases p01 à p06 sont identiques AU BIT. |
| `colonne.test.js` | COL T18 bis | **La dette n'est pas payée, elle a bougé.** Ses trois scénarios ne lèvent plus ; balayage de 540 : **188 lèvent encore**, du même message `pvMilli N hors de 1…M`. Trois nouveaux triplets, le test reste. |
| `recherche.test.js` | MODULES-F T14 | **Prémisse réparée** : sur la graine 14, « armé sous vide » cesse d'être vrai au niveau 38. Les graines passent de `3, 14, 31` à **`1, 3, 4`**, balayage 1→60 qui en donne six. Neuf valeurs réancrées. |
| `recherche.test.js` | MODULES-F T14 bis | **Prémisse réparée, seconde fois** : la graine 1077 n'abîme plus un porteur de Camouflage. **1099** en porte cinq et en abîme. |
| `arsenal.test.js` | T10 | 513 → **635** ticks. |
| `repli.test.js` | T6 | 513 → **635**, butin 54 560 → **60 714**, survivants 3 → **9**. |
| `assaut.test.js` | T7 | Six ticks réancrés, plus le butin de C. |
| `cible.test.js` | T4 | 164 → **409** ticks, butin 0 → **31 028**. |
| `cible.test.js` | T5 | La liste des raids qui touchent le plafond passe de un à **trois, tous neufs**. ⚠ **Aucun n'est un gel** — vérifié à `maxTicks` 20 000 : 1 478, 1 101 et 945 ticks, tous par `attaquants`. **Le « autre régime » à 5 478 ticks du lot COLONNE a disparu.** |
| `poi.test.js` | T18 | Butin 730/243 → **743/247** et 851/283 → **896/298**. L'ÉCART, que le test mesure, ne bouge pas. |
| `roster.test.js` | T5 | Durée unique 188 → **146**. **La propriété tient : une SEULE durée sur neuf niveaux.** |
| `roster.test.js` | T6 | Les trois raids de référence réancrés. |

⚠⚠ **TROIS MONTAGES ONT PERDU LEUR PRÉMISSE, ET DEUX POUR LA SECONDE FOIS.** Ce
n'est pas un accident : **un montage qui dépend d'une disposition tirée la
reperdra au prochain lot qui y touche.** C'est écrit dans les trois.

---

## 8. Les chiffres

| Grandeur | Avant | Après | Écart |
| --- | --- | --- | --- |
| `npm test` | **1 287 pass / 0 fail** | **1 295 pass / 0 fail** | **+8** |
| `dist/index.html` | **8 012 887** | **8 014 150** | **+1 263** |
| `SAVE_VERSION` | 27 | **27** | **0** |
| version · build | 0.99.15 · 116 | **0.99.16 · 117** | — |

| Poste | Écart |
| --- | --- |
| JavaScript | **+1 263** |
| feuille · balisage · images · audio | **+0** |

**La somme des cinq postes tombe EXACTEMENT sur le total.** **296 lignes `data:`
de part et d'autre, 291 URI.** Borne T10 inchangée à **9 300 000** ; marge
**1 285 850 octets, 13,83 %**. Zéro référence externe.

⚠ **`SAVE_VERSION` VÉRIFIÉ, PAS CRU** : les sites se régénèrent depuis leur
graine, rien n'entre dans l'état, et le champ n'a pas bougé.

---

## 9. La relecture du §9 : « un test qui mesure les colonnes en croyant mesurer les rangées »

Cherché, et voici ce qui a été trouvé :

1. **`COL T15` lui-même** — c'est la faute d'origine. Il mesure bien les colonnes
   et son titre le dit ; ce qui manquait, c'est qu'on l'a pris pour une preuve de
   forme. **Une note l'y attache désormais**, et renvoie à `CR T1`.
2. **`CR T1` ne la refait pas**, et il le prouve plutôt que de l'affirmer : la
   comparaison AVEC colonnes contre SANS colonnes est écrite dans le test.
3. **`CR T2` n'utilise que `rangée:id`**, jamais la colonne.
4. **`CR T7` mesure les colonnes et le dit** — c'est son sujet.
5. **`T6` de `generateur.test.js`** compte des rangées et des tailles de rangée,
   et rien d'autre.

⚠ **ET UNE SECONDE FAUTE DU MÊME GENRE A ÉTÉ TROUVÉE, SUR UN AUTRE AXE** : le
premier bloc de `T7` mesurait une distance à **un seul axe** en croyant mesurer
la portée du moteur, qui est en 2D. Il « prouvait » une phrase fausse depuis le
25/08. Corrigé, avec sa contre-mesure.

---

## 10. Écarts et points en suspens

### ⚠⚠ 10.1 — Le nombre de tirages de `genererSite` dépend désormais de la graine

Déclaré au §5. Ce n'est pas la boucle de reprise que le brief interdit, et le site
reste une fonction pure de ses paramètres. **Si Ethan veut que le compte
redevienne fixe**, il faudrait faire tirer à `repartirLesColonnes` ses neuf clés
pour toutes les rangées de la bande, occupées ou non — c'est une ligne, et elle
coûte des tirages inutiles.

### ⚠ 10.2 — L'artillerie descend à la rangée 8 au lieu de 9

Déclaré au §3, écrit en clair dans `T7`. Le gradient d'engagement entre 8 et 10
est faible ; l'ordre, qui est le vrai motif, est inchangé et désormais gardé
explicitement.

### ⚠ 10.3 — `brassagesDeRangee` n'est pas un optimum

Le tableau du §4 montre que le nombre de formes monte encore à 48. **24 est un
choix, pas un maximum**, et il est dans la table pour être relevé sans migration.

### 10.4 — Points en suspens

1. **La dispersion est-elle assez forte aux bas niveaux ?** Un camp de niveau 3
   n'offre que **quatre** répartitions de défenses distinctes, quel que soit le
   nombre de transferts : il n'a que trois défenseurs. Si Ethan trouve les petits
   camps encore trop semblables, c'est la DENSITÉ qu'il faut regarder, pas le
   placement.
2. **Le bloc de défense reste collé au fond, sans trou.** C'est la contrainte 1 et
   `COL T16` l'asserte. Autoriser un trou ouvrirait beaucoup de formes de plus —
   c'est un arbitrage de jeu, pas de code.
3. **`COL T18 bis` reste une dette ouverte**, et elle est mesurée : 188 levées sur
   540 scénarios.
4. **`package.json` ne déclare aucun `engines`.** Node 20.11.1 rend `npm test`
   inutilisable. Hors du lot, toujours non fait.

---

**PR ouverte, non mergée.**
