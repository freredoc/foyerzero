# RAPPORT — lot TERRITOIRE-FORCE

**Version 0.99.23 · build 124.** Branche `claude/lot-territoire-force`, empilée
sur `claude/lot-pictogrammes` (PR #106, encore ouverte). PR ouverte, non mergée.

Arbitrages d'Ethan du 07/09, point **13**, première moitié.

---

## 0. Base de départ

| | annoncé au brief | mesuré |
|---|---|---|
| `npm run check` | 1245 pass / 0 fail | **1324 pass / 0 fail** |
| `dist/index.html` | 8 003 811 octets | **8 255 283 octets** |
| version | 0.99.12 · build 113 | **0.99.20 · build 121** |

⚠ **LE BRIEF EST EN RETARD DE HUIT LOTS**, PICTOGRAMMES, CÂBLAGE et
NOMBRES-COMPACTS compris. Rien de ce qui suit n'est mesuré contre ses chiffres.

---

## 1. ⚠⚠ LE VERDICT DU §6, MESURÉ AVANT TOUTE MODIFICATION

**DÉFAUT CONFIRMÉ.** Premier geste du lot, avant qu'une ligne ne change :

```
base choisie : { rangee: 1, colonne: 2 }, graine 11
avant rasage — occupant de sa case : OUVRAGE
siteDeLaCase après rasage          : null
APRÈS rasage — occupant de sa case : OUVRAGE
APRÈS rasage — cases encore peintes: 30
```

`territoireDeLaFenetre` appelait `basesDeLaFenetre(etat.graine, elargie)` — **la
graine seule, sans l'état**. Une base de l'Ouvrage rasée continuait donc de
peindre son octogone entier : **trente cases** restaient à l'Ouvrage pendant que
`siteDeLaCase` y rendait déjà `null`. La carte montrait un territoire autour d'un
site que le joueur avait détruit.

⚠⚠ **ET LE DÉFAUT NE FAUSSAIT PAS QU'UN DESSIN : IL FAUSSAIT LES SOMMES.** Une
base rasée pesait `raison ^ niveau` dans le partage du chevauchement — c'est
pourquoi il se corrige **dans ce lot** et pas au suivant. `forcesDeLOuvrage` lit
`basesRasees` ; `TF T10` le garde, et il était rouge avant la correction.

---

## 2. La règle, et ce qu'elle produit

```
influence d'une base sur une case = raison ^ (niveau − distance)
influence d'un camp sur une case  = somme de ses bases
la case revient au camp dont la somme est la plus forte
```

**La raison vaut 2**, et elle vit dans `GEOGRAPHIE.raisonDeLaForce` — c'est une
valeur de calibrage, `sim/territoire.js` la lit et ne l'écrit pas.

| ce qu'Ethan a dit | mesuré |
|---|---|
| deux bases 10 valent une base 11 | `2¹⁰ + 2¹⁰ = 2¹¹`, **égalité stricte**, à tous les niveaux de 1 à 49 |
| une base 20 vaut 1 024 bases de 10 | rapport **1 024** exactement ; mille bases de 10 restent SOUS une base de 20, mille vingt-cinq la dépassent |

⚠ **LES DEUX MOITIÉS TIENNENT AU MÊME NOMBRE.** Une raison plus petite
écraserait l'essaimage, une plus grande écraserait la montée en niveau.

### Le niveau d'une base — la seule chose que le brief ne disait pas

- **Ouvrage** : `niveauDeLaRangee(rangee)`, la seule grandeur que la carte lui
  donne, et celle que `siteDeLaCase` inscrit déjà dans l'identité qu'il rend.
- **Joueur** : **la moyenne de ses bâtiments, arrondie**. Ce n'est pas une
  invention de ce lot : `GEOGRAPHIE.niveauBase` porte déjà « moyenne des niveaux
  de ses bâtiments », et **`palierDuSite` d'`ui/monde.js` emploie exactement
  cette grandeur avec exactement cet arrondi** — `Math.max(1, Math.round(dixiemes
  / 10))` — pour choisir l'emblème d'une base du joueur. En prendre une autre
  ferait dire deux choses au même dessin : un emblème de palier 3 qui
  projetterait la force d'un niveau 2.

⚠ **SURTOUT PAS `niveauDeLaRangee` POUR LE JOUEUR.** C'est la faute que
`sim/carte.js` existe pour empêcher, et que trois commentaires du dépôt nomment
déjà.

---

## 3. La distance, et le piège de l'octogone

`dansLOctogoneDInfluence` ne rendait qu'un booléen. La distance en est
**extraite** dans une fonction pure et exportable, et **le booléen s'exprime
maintenant par elle** :

```js
distanceOctogonaleDInfluence(dr, dc) = max(|dr|, |dc|, |dr| + |dc| − marge)
dansLOctogoneDInfluence(dr, dc, r)   = distanceOctogonaleDInfluence(dr, dc) <= r
```

La boule de rayon `r` de cette distance **est** l'octogone dicté : « dans le
carré de Tchebychev de rayon `r` ET dans le losange de Manhattan de rayon
`r + marge` », mot pour mot.

⚠⚠ **VÉRIFIÉ PAR EXÉCUTION, EN DIAGONALE.** 2 023 couples confrontés à l'ancienne
écriture — tous les écarts de −8 à 8, les rayons 0 à 6 —, dont **1 792 en
diagonale** : aucune divergence. Les deux figures se recomptent à **21** et **37**
cases.

⚠⚠ **ET ELLE NE VAUT PAS TCHEBYCHEV DANS LES ANGLES** — c'est le piège que le
brief signalait, et il est réel :

| écart | octogone | Tchebychev |
|---|---:|---:|
| (1, 1) | 1 | 1 |
| (2, 1) | 2 | 2 |
| **(2, 2)** | **3** | 2 |
| **(3, 3)** | **5** | 3 |

La distance entre dans l'**exposant** : se tromper de géométrie dans un coin
change la force d'un facteur 2 à 4. Un montage aligné ne l'aurait pas vu.

---

## 4. ⚠⚠ CE QUI DISPARAÎT — LES DEUX COMMENTAIRES, CITÉS

**Ce qui est retiré du code :**

```js
// Le joueur l'emporte : on n'écrase jamais sa marque.
if (occupant[i] === JOUEUR) continue;
```

**Le premier commentaire réécrit** — l'en-tête de `territoireDeLaFenetre` :

> ⚠⚠ LA RÈGLE A ÉTÉ RENVERSÉE LE 07/09, POINT 13 D'ETHAN, ET CE BLOC RACONTE LES
> DEUX. **L'ancienne :** « le joueur l'emporte sur l'Ouvrage quand les deux se
> recouvrent », une LECTURE prise faute d'arbitrage, justifiée par le fait que le
> territoire allié est la seule des deux zones qui ait un effet de jeu écrit — le
> tarif du raid à +1 par case. **La nouvelle :** […] **Pourquoi le renversement.**
> Ethan : « deux bases 10 est moins fort qu'une base 20 ». Un joueur qui ne peut
> pas perdre une case ne peut pas non plus en gagner une : la priorité
> inconditionnelle rendait tout le partage muet.

**Le second** — celui qui justifiait l'ordre des deux boucles :

> ⚠⚠ L'ORDRE DES DEUX BOUCLES N'A PLUS AUCUN EFFET, ET C'EST LE SIGNE QUE LE
> RENVERSEMENT EST RÉEL. Ce bloc disait le contraire : « le joueur en premier, et
> c'est ce qui rend la règle de priorité réelle » — parce qu'une priorité qui
> tient à l'ordre de deux boucles n'est pas une règle, et qu'on pouvait alors
> retirer le garde-fou sans qu'un seul test tombe. Il n'y a plus de garde-fou,
> plus de priorité, et plus d'ordre à tenir : chaque base AJOUTE sa force à la
> somme de son camp, et l'addition est commutative.

### La liste nominative des tests tombés

| test | verdict |
|---|---|
| `EUCLIDE — les zones d'influence sont un OCTOGONE, et une seule écriture le dit` | **prémisse devenue fausse** |

**Un seul, et il ne portait pas la priorité.** Il exigeait que la boucle de
peinture appelle `dansLOctogoneDInfluence(dr, dc, rayon)` ; elle appelle
maintenant `distanceOctogonaleDInfluence(dr, dc)`, dont le booléen se dérive. Le
test **se resserre** : il exige désormais les DEUX moitiés — que la carte demande
la distance à la fonction commune, ET que le booléen s'exprime par cette même
distance.

⚠⚠ **AUCUN TEST NE GARDAIT L'ANCIENNE PRIORITÉ, ET C'EST COHÉRENT AVEC CE QUE SON
PROPRE COMMENTAIRE DISAIT** : « mesuré par falsification : on pouvait le retirer
sans qu'un seul test tombe ». Le lot le confirme par l'autre bout — on l'a
retiré, et rien n'est tombé. `TF T5` et `TF T6` comblent le trou.

---

## 5. Le coût, mesuré avant et après

Fenêtre pleine : **69 × 31 = 2 139 cases, toutes occupées** — le cas le plus
lourd, pris au milieu de la carte pour qu'aucun bord ne la rogne.

| | µs par appel |
|---|---:|
| avant | **5 612,3** |
| après | **6 701,2** |
| écart | **+19,4 %** |

⚠⚠ **ET LA CARTE NE SE REDESSINE PAS DIX FOIS PAR SECONDE.** Le brief le
supposait ; `rafraichir` d'`ui/monde.js` sort sur une empreinte inchangée et ne
redessine qu'au clignotement du halo — **une fois par seconde** — ou sur un geste.
**Le vrai cas chaud est le défilement au doigt** : `pointermove` rappelle
`dessiner`, donc `territoireDeLaFenetre`, à chaque mouvement.

⚠ **SUR UN GALAXY S25 FE, C'EST SENSIBLE — ET ÇA L'ÉTAIT DÉJÀ.** À trois ou cinq
fois plus lent qu'ici, 6,7 ms deviennent **20 à 33 ms** par mouvement de doigt,
contre **17 à 28 ms** avant ce lot. Le lot aggrave de 19 % un coût qui existait ;
il ne le crée pas.

### ⚠⚠ ET LE REMÈDE A ÉTÉ TROUVÉ, MESURÉ ET IMPLANTÉ — lot MÉMO-DES-TOURS

Il n'est **aucun** des deux que le brief proposait, et il ne coûte rien au sens
de la règle : il ne change pas un comportement.

`priseAUnTour` prend un mémo en argument, et `basesDeLaFenetre` en **ouvrait un
neuf à chaque appel** pour le jeter aussitôt. Son propre commentaire posait déjà
la condition — « le mémo est PROPRE À UNE GRAINE […] c'est l'appelant qui
garantit l'unicité » — sans que personne ne remarque que l'appelant pouvait le
garder. Il est désormais partagé sur **une seule entrée par graine**, exactement
le motif de `carteDesPoi` : « une seule partie est ouverte à la fois, et le cache
ne peut pas mentir, puisque la carte est une fonction pure de la graine ».

| `territoireDeLaFenetre`, fenêtre pleine | µs / appel |
|---|---:|
| avant TERRITOIRE-FORCE | 5 612,3 |
| après TERRITOIRE-FORCE | 6 701,2 |
| **après MÉMO-DES-TOURS** | **1 783,8** |

**3,8 fois plus rapide qu'il y a une heure, et 3,1 fois plus rapide qu'avant ce
lot.** Le défilement au doigt repasse largement sous les 10 ms, même sur un
téléphone cinq fois plus lent. **Le point 2 des « en suspens » est clos.**

⚠ **`MEM T1` ALTERNE DEUX GRAINES CASE PAR CASE**, il ne les enchaîne pas : deux
balayages l'un après l'autre passeraient même si le cache ne se renouvelait
jamais — la seconde graine trouverait le cache de la première et rendrait sa
carte, sans qu'on l'ait comparée à rien.

**Les deux remèdes que le brief proposait, pour mémoire :**

1. **Mémoriser la carte tant que ni les bases ni la fenêtre n'ont bougé.** C'est
   celui que la mesure désigne : pendant un défilement la fenêtre bouge d'une
   case sur deux images, et le clignotement du halo recalcule une carte
   identique une fois par seconde. C'est aussi le motif que `rafraichir` emploie
   déjà avec son empreinte.
2. **Ne sommer que là où deux camps se chevauchent réellement.** Moins efficace
   qu'il n'y paraît, mesuré : le coût est dans la boucle de PEINTURE — environ
   470 bases × 37 cases —, pas dans la comparaison finale. Il faudrait éviter le
   `BigInt` *à la peinture*, ce qui demande un accumulateur exact en `Number`.

⚠ **`occupant` RESTE UN `Uint8Array`.** Ce qu'on y écrit est toujours un camp,
jamais une force ; les `BigInt` sont des intermédiaires de calcul.

---

## 6. Non-régression : `poi.js`, `points-attaque.js`, `fondation.js`, `SAVE_VERSION`

Le même montage a été joué sur l'arbre **d'avant** et **d'après** le lot, et les
deux sorties comparées **à l'octet** :

| | mesuré | verdict |
|---|---|---|
| `SAVE_VERSION` | 27 | **inchangé** — le territoire ne stocke toujours rien |
| `releverLesPoisAcquis` | 0 POI, `[]` | identique |
| `estEnTerritoireAllie` | 81 cases | identique |
| `coutDUnRaid` | 335 cases | identique |
| `problemesDeLaFondation` | 450 cases, **refus territorial sur 92** | identique |

**`diff` : IDENTIQUE.** Le refus `territoire-ennemi` de `fondation.js` lit la
nouvelle carte sans changer de code — **vérifié, pas supposé**, et il se déclenche
bien (92 cases sur 450, sinon le montage ne mesurerait rien).

---

## 7. ⚠⚠ CE QUE LA RELECTURE DU §10 A TROUVÉ — ET QUI RESTE OUVERT

Le brief demandait de chercher **une** chose : « un endroit où le code suppose
encore que le joueur ne peut pas perdre une case ». **Il y en a un, et il est
mesurable.**

`estEnTerritoireAllie` demande « cette case est-elle dans l'**octogone** du
joueur », pas « le joueur la **possède**-t-il ». Avant ce lot les deux questions
avaient la même réponse, puisque le joueur ne perdait jamais. **Depuis, elles
divergent.** Mesuré sur un montage joueur niveau 1 contre Ouvrage niveau 30 à
deux cases :

```
cases DANS l'octogone du joueur mais PEINTES à l'Ouvrage : 15
… et toutes facturées au tarif ALLIÉ                     : 15
exemple (98, 9) → carte : OUVRAGE | estEnTerritoireAllie : true | raid : 11 pts
```

**La carte peinte et le prix affiché décrivent maintenant deux choses
différentes** — la divergence exacte que `CLAUDE.md` nomme depuis EUCLIDE. Et
`releverLesPoisAcquis` a le même défaut : il parcourt l'octogone du joueur, pas
son territoire, donc il ramasserait un POI sur une case perdue.

⚠ **CE N'EST PAS CORRIGÉ, ET C'EST CONFORME AU BRIEF** : son §8 dit « `poi.js` et
`points-attaque.js` : ils lisent, ils ne changent pas ». Le §10 demandait de
TROUVER, pas de réparer. **Ethan tranche** : soit ces deux modules demandent
désormais la carte d'occupation, soit la règle assume que le tarif et les POI
suivent la PORTÉE et non la propriété.

---

## 8. Les tests

| code | verdict | montage |
|---|---|---|
| **TF T1** | **PASS** | égalité stricte en `BigInt`, à **tous** les niveaux de 1 à 49 ; falsifiée par « trois bases de 10 ≠ une de 11 » |
| **TF T2** | **PASS** | rapport 1 024 ; et la borne est serrée — 1 000 bases restent dessous, 1 025 dépassent |
| **TF T3** | **PASS** | le cas d'Ethan, monté exactement, **case par case** |
| **TF T4** | **PASS** | niveau 1 contre niveau 20 à trois cases : le pied reste, et la voisine tombe |
| **TF T5** | **PASS** | le joueur perd une case face à un niveau 30 — **remplace explicitement le test de l'ancienne priorité** |
| **TF T6** | **PASS** | deux configurations où seul le rapport de force change ; plus la garde de source |
| **TF T7** | **PASS** | 2 023 couples, dont 1 792 **en diagonale** ; les deux figures recomptées |
| **TF T8** | **PASS** | un niveau 50 peint 21 cases, pas une de plus, diagonales comprises |
| **TF T9** | **PASS** | non-régression : hors octogone, `NEUTRE` |
| **TF T10** | **PASS** | rouge avant la correction — le montage du §1 |
| **TF T11** | **PASS** | niveaux 1 et 50 ; et la force au plafond dépasse l'entier sûr |
| **TF T12** | **mesuré** | §5 — 5 612 → 6 701 µs |

⚠⚠ **`TF T3` NE DONNE PAS LE CHIFFRE QUE LE BRIEF ANNONÇAIT, ET LE BRIEF AVAIT
TORT.** Il prévoyait « le 15 prend deux cases au 13 » ; mesuré, il lui en prend
**onze** (l'Ouvrage tombe de 37 à 26, le joueur garde ses 21). La raison est
géométrique : **les deux rayons ne sont pas les mêmes** — 2 pour le joueur, 3 pour
l'Ouvrage — et leur chevauchement à trois cases d'écart fait onze cases. Le
« deux cases » valait pour deux bases de MÊME rayon.

⚠⚠ **ET LE CAS NE PEUT PAS ÊTRE MONTÉ ENTRE DEUX BASES DE L'OUVRAGE, C'EST
MESURABLE.** Le niveau d'un site de l'Ouvrage est celui de sa rangée et monte de
`niveauParCase` = 0,2 par case : il faut **cinq rangées pour un niveau**, donc dix
pour aller de 13 à 15. Deux bases de l'Ouvrage distantes de trois cases ne peuvent
pas différer de deux niveaux. **Le cas d'Ethan n'existe qu'entre le joueur et
l'Ouvrage** — ce qui est justement ce que ce lot ouvre.

⚠ **`TF T6` NE RETOURNE PAS LES BOUCLES, IL RETOURNE LES NIVEAUX**, et c'est plus
fort : inverser l'ordre de peinture demanderait un drapeau de test dans le code de
production. Deux configurations, un ordre de peinture identique, deux vainqueurs
différents — si l'ordre décidait, la même case irait au même camp dans les deux.

⚠ **LES MONTAGES RASENT LE VOISINAGE PLUTÔT QUE DE FORGER UNE CARTE.** Les
positions des bases de l'Ouvrage sont une fonction de la graine ; `basesRasees`
est déjà dans l'état, et raser le voisinage donne un montage exact **sans une
seule ligne de code de production écrite pour le test** — tout en éprouvant le
filtre du §1 par la manche.

**`npm run check` : 1335 pass / 0 fail.** +11 tests, **aucune assertion retirée**.

---

## 9. Le poids

| poste | avant | après | delta |
|---|---:|---:|---:|
| **total** | 8 255 283 | **8 256 200** | **+917** |
| JavaScript | 366 161 | 367 078 | **+917** |
| feuille · balisage · images · audio | — | — | **+0** |
| lignes `data:` · URI | 297 · 292 | 297 · 292 | +0 |

Marge sur la borne T10 : **1 043 800 octets, 11,22 %**. La borne ne bouge pas.

---

## 10. Écarts et points en suspens

1. ⚠⚠ **LA CARTE ET LE PRIX DIVERGENT** (§7). **La correction a été écrite,
   mesurée, puis RETIRÉE** — voir le §11, qui dit pourquoi. **Ethan tranche.**
2. ✅ **LE COÛT EST RÉGLÉ** — `territoireDeLaFenetre` passe à **1 784 µs**, soit
   3,1 fois plus rapide qu'AVANT ce lot. Voir le §5.
3. ⚠ **`GEOGRAPHIE.rayonInfluenceJoueur` ET `rayonInfluenceEnnemie` N'ONT PAS
   BOUGÉ**, comme le §4 du brief l'exigeait : `TF T8` le garde en mesurant qu'un
   niveau 50 ne peint pas une case de plus qu'un niveau 1.
4. ⚠ **L'ÉGALITÉ DE DEUX SOMMES VA AU JOUEUR.** Elle est possible — 2¹¹ contre
   2¹⁰ + 2¹⁰ — et il fallait trancher. C'est le seul reste de l'ancienne
   priorité, et il tient à la même raison qu'elle : une case qui se paie comme
   alliée doit se lire comme telle. **Un caractère à changer.**
5. ⚠ **LE RENDU N'A PAS ÉTÉ VU** — la carte du monde se dessine sur un canevas,
   que le dépôt ne sait pas monter (`CLAUDE.md` §3). Ce qui est mesuré ici est le
   MODÈLE, case par case.
6. ⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le
   lot ne touche ni `art/`, ni un outil de la chaîne.

---

---

## 11. ⚠⚠ LA CORRECTION DU §7 — lot TERRITOIRE-LU

Ethan, le jour même : « donc pour 1. tu corriges ou non », puis, sur mes
objections : **« un poi pris est validé de façon permanente »** et **« si tu vas
vers le nord, tu montes aussi en niveau avant sinon tu te fais poutrer »**.

⚠⚠ **LES DEUX REMARQUES ONT INVALIDÉ MON REFUS, ET IL FAUT LE DIRE SANS DÉTOUR.**
J'avais argumenté que la correction « fait perdre au joueur des POI qu'il
acquérait » — mais les POI déjà pris restent pris, et un joueur de niveau 1 collé
à une base de niveau 30 est un **artefact de montage**, pas une situation de jeu.
Mon argument reposait sur des tests forgés, pas sur la partie réelle. La
correction est faite.

### La réponse est OUI pour les POI, NON pour le tarif — et c'est une mesure

**La récolte demande la propriété.** `releverLesPoisAcquis` parcourait l'octogone
d'une base — où elle **projette** — et ramassait tout ce qui s'y trouvait. Elle
demande maintenant `campDeLaCase` : ce qu'elle **tient**. Sans ça, le joueur
ramassait le gisement d'une case que la carte peint à l'Ouvrage.

⚠⚠ **LE TARIF DU RAID, LUI, RESTE SUR LA PORTÉE, ET C'EST LA MESURE QUI L'A
DÉCIDÉ, PAS UNE PRÉFÉRENCE.** La correction avait été écrite en entier ; elle a
été retirée quand le montage a montré ceci :

```
cibles à portée d'une base : 58   { base: 58 }
cibles à 2 cases ou moins  : 4    — toutes OUVRAGE
```

**Les cibles de raid sont TOUTES des bases de l'Ouvrage**, et une base garde
toujours sa case — c'est le plancher qu'Ethan a dicté au §1 de ce lot. Demander
la propriété rendrait donc le tarif de proximité **inatteignable** : la règle de
la spec §8 — « le territoire allié est ce qui rend un raid bon marché » —
mourrait en silence, sans qu'aucun test ne tombe.

**Les deux grandeurs répondent donc à deux questions différentes**, et ce n'est
plus une divergence mais une distinction :

| | ce que ça demande | qui le lit |
|---|---|---|
| **portée** | où mes bases **projettent** — la logistique | le tarif du raid |
| **propriété** | ce que je **tiens** — le rapport de force | la carte, la récolte des POI |

### Le coût, et l'ordre des gardes

⚠⚠ **`campDeLaCase` A D'ABORD COÛTÉ 153 µs PAR CASE**, soit très exactement le
« 441 hachages PAR CASE » que l'en-tête de `sim/territoire.js` existe pour
refuser. Le mémo partagé du lot MÉMO-DES-TOURS le ramène à **20 µs**.

⚠⚠ **ET L'ORDRE DES QUATRE GARDES DE LA RÉCOLTE EST UNE MESURE, PAS UN GOÛT.**
`releverLesPoisAcquis` tourne **à chaque tick** ; demander la propriété AVANT de
regarder s'il y a seulement un gisement la faisait passer de 1 à **45 µs**, et
trois tests de simulation de secondes à des **minutes**. Il y a 70 POI sur 9 300
cases : la question ne se pose donc presque jamais, à condition de la poser en
dernier — mesuré à **3,1 µs** l'appel.

⚠ **UN POI DÉJÀ PRIS RESTE PRIS**, et la garde d'acquisition passe AVANT celle de
propriété pour cette raison exacte. `TL T4` le mesure : on ramasse, on rend la
case à l'Ouvrage, on relève cinquante fois — rien ne bouge.

### Les témoins gelés : une couche, pas une réécriture

| | ce qui bouge |
|---|---|
| `DEPLACES_PAR_TERRITOIRE_LU` | **5 phases sur 14**, 18 champs — les neuf premières tombent à l'octet sur la capture d'origine |
| `RAPPORTS_OUVRAGE_TERRITOIRE_LU` | **1 graine sur 25** — sur la 6, un gisement de moins finance une recherche de moins, donc une autre armée |

⚠ **C'EST CETTE PROPORTION QUI PROUVE QUE LA RÈGLE N'A PAS FUI.** Une couche qui
aurait déplacé les quatorze phases et les vingt-cinq graines ne dirait rien.

### Quatre montages disent enfin ce qu'ils supposaient

`POI T8`, `POI T25` et `RAID-B T7` posaient une base et comptaient sur son
octogone entier — gratuit tant que la portée **était** la propriété. Ils rasent
maintenant le voisinage de l'Ouvrage (`sansVoisinsOuvrage`) pour mesurer la
**forme** et pas un rapport de force qu'ils n'ont pas choisi.

⚠ **`BASES-1 T2` A ESSAYÉ LE RASAGE AUSSI, ET ÇA NE MARCHE PAS** : raser retire
les **cibles**, et le montage tombait sur son propre garde-fou — « trop peu de
cibles ». Il est resté tel quel, le tarif n'ayant pas changé.

### Les tests

| code | ce qu'il prouve |
|---|---|
| **TL T1** | `campDeLaCase` rend exactement ce que la carte peint, case par case, avec les trois occupants présents |
| **TL T2** | le plancher tient aussi sur une case : chaque base garde la sienne, la voisine tombe |
| **TL T3** | même case, deux niveaux : perdue elle ne donne rien, tenue elle donne son gisement |
| **TL T4** | un POI déjà pris reste pris, cinquante relevés plus tard, la case rendue à l'Ouvrage |

**`npm run check` : 1340 pass / 0 fail.** +4 tests, aucune assertion retirée.
