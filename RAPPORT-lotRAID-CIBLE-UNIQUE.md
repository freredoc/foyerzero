# RAPPORT — lot RAID-CIBLE-UNIQUE

**07/09/2026 — version `0.99.15` · build `116`.**

Arbitrage d'Ethan du 07/09 : « **Elle n'en frappe qu'une, la plus proche.** » Et,
pour l'égalité : « **le plus haut, puis gauche à droite.** »

Le code annonçait lui-même la ligne à changer. Elle a changé, et elle seule.

---

## 0. La base de départ

Ce lot part du **tip de `claude/lot-production-en-defense`**, non mergé : les deux
lots touchent `package.json` et `CLAUDE.md`, et les empiler garde les numéros
monotones. Aucun fichier de code n'est partagé entre eux.

| Grandeur | Valeur mesurée |
| --- | --- |
| `node --test "test/*.test.js"` | **1 287 → base à 1 274 pass / 0 fail** |
| `dist/index.html` rebâti au `git worktree` | **8 012 333 octets** |
| version · build | **0.99.14 · 115** |

⚠ **LE BRIEF ANNONÇAIT 1 245 TESTS, 8 003 811 OCTETS ET 0.99.12 · 113 — PÉRIMÉ DE
DEUX LOTS.** ÉCRAN-DÉFENSE puis PRODUCTION-EN-DÉFENSE sont passés depuis. Sans
conséquence sur le travail, mais consigné.

⚠ **`RAPPORT-lotBASES-1.md` N'EST PAS À LA RACINE** : il est dans
`rapports/RAPPORT-lotBASES-1.md`, et il a été lu.

⚠⚠ **LES DEUX ÉCARTS D'OUTILLAGE DU LOT PRÉCÉDENT TIENNENT TOUJOURS** : le dépôt
est en LF (`core.autocrlf false`, posé sur ce dépôt seulement) et tourne sous un
**Node 22.14.0 portable**, hors du dépôt. Sous le Node 20.11.1 de la machine,
`npm test` ne trouve aucun fichier — pas de glob dans `--test` — et quatre tests
tombent faute de `Dirent.parentPath`. Rien n'a été installé sur la machine.

---

## 1. ⚠⚠ La vérification de l'orientation — par EXÉCUTION, avant d'écrire le comparateur

C'est le piège que le brief signale, et il se prend à l'envers sans que rien ne le
dise. Mesuré, pas déduit :

```
GEOGRAPHIE.carte.hauteur = 300, niveauParCase = 0,2
niveauDeLaRangee(1)   → 50      (le plafond)
niveauDeLaRangee(50)  → 50
niveauDeLaRangee(150) → 30
niveauDeLaRangee(250) → 10
niveauDeLaRangee(295) → 1       ← positionDepartJoueur() = { rangee: 295, colonne: 16 }
niveauDeLaRangee(300) → 1
```

**« Le plus haut » est donc la rangée la plus PETITE.** Le nord est en haut, le
niveau y croît, et la rangée décroît. `RCU T0` exécute ces quatre lectures avant
que le comparateur ne soit lu, et exige en plus que le niveau **décroisse** quand
la rangée croît — un signe inversé donnerait un départage qui marche parfaitement
et choisit systématiquement la mauvaise base.

**« Gauche à droite » est la colonne croissante** : la plus petite gagne. C'est la
convention de toute la grille, et `ciblesAPortee` trie déjà ainsi.

---

## 2. ⚠⚠ La mesure de « la plus proche » — et une prémisse du brief à corriger

Le brief §2 dit : « `ciblesAPortee` balaie *un carré de Tchebychev de rayon 10*.
Le tri doit employer la même mesure que le balayage. » **Il cite l'en-tête de
`ciblesAPortee`, et cet en-tête était devenu FAUX.**

Il affirmait « un carré de Tchebychev, **pas un disque** » — en contredisant le
commentaire de sa propre boucle, trois lignes plus bas :

> ⚠⚠ LE BALAYAGE EST UN CARRÉ, LA PORTÉE EST UN DISQUE — depuis le lot EUCLIDE.
> Avant lui les deux coïncidaient et ce filtre n'existait pas […] Il en reste 316,
> et les 124 coins sont désormais REFUSÉS.

**Mesuré :**

```
distanceTchebychev({100,100}, {110,110}) → 10      = GEOGRAPHIE.rayonAttaque
estAPorteeDAttaque({100,100}, {110,110}) → false   d² = 200 > 100
estAPorteeDAttaque({100,100}, {107,107}) → true    d² = 98  ≤ 100
```

**La mesure qui décide de la portée est `distanceCarree`** — le carré de la
distance euclidienne, `d² ≤ rayon²` —, et c'est elle que `ciblesAPortee` pose sur
chaque site qu'elle rend, mesurée depuis la base qui l'a demandé. **Le départage
la RELIT ; il n'en écrit aucune seconde.** C'est exactement la consigne du
brief, appliquée à la vraie mesure.

⚠ **L'en-tête de `ciblesAPortee` est corrigé**, avec la raison : il a coûté un
aller-retour, et un commentaire qui contredit sa propre boucle en coûtera un
autre. `distance` (Tchebychev) reste sur le site pour qui en a besoin ailleurs.

---

## 3. Le `for` imbriqué, et lui seul

**Avant :**

```js
export function basesAttaquantes(etat) {
  const paires = [];
  for (let i = 0; i < etat.bases.length; i += 1) {
    for (const site of ciblesAPortee(etat, etat.bases[i])) {
      if (TYPES_SITE[site.type]?.attaqueLeJoueur !== true) continue;
      if (site.niveau < RAID_OUVRAGE.niveauMinimal) continue;
      paires.push({ ...site, baseVisee: i });
    }
  }
  return paires;
}
```

**Après** — les deux filtres sont intacts, le `push` devient un regroupement :

```js
export function basesAttaquantes(etat) {
  const parAttaquante = new Map();
  for (let i = 0; i < etat.bases.length; i += 1) {
    for (const site of ciblesAPortee(etat, etat.bases[i])) {
      if (TYPES_SITE[site.type]?.attaqueLeJoueur !== true) continue;
      if (site.niveau < RAID_OUVRAGE.niveauMinimal) continue;
      const cle = `${site.rangee},${site.colonne}`;
      const candidate = { ...site, baseVisee: i };
      const tenante = parAttaquante.get(cle);
      if (tenante === undefined || departagerLesCandidates(etat, candidate, tenante) < 0) {
        parAttaquante.set(cle, candidate);
      }
    }
  }
  return [...parAttaquante.values()]
    .sort((a, b) => a.rangee - b.rangee || a.colonne - b.colonne);
}
```

Et la règle, écrite **une fois**, dans `departagerLesCandidates` :

```js
function departagerLesCandidates(etat, a, b) {
  if (a.distanceCarree !== b.distanceCarree) return a.distanceCarree - b.distanceCarree;
  const pa = etat.bases[a.baseVisee].position;
  const pb = etat.bases[b.baseVisee].position;
  if (pa.rangee !== pb.rangee) return pa.rangee - pb.rangee;
  if (pa.colonne !== pb.colonne) return pa.colonne - pb.colonne;
  throw new Error(
    `raid-ouvrage : deux bases du joueur en (${pa.rangee}, ${pa.colonne}) — `
      + 'le départage ne peut plus trancher',
  );
}
```

⚠⚠ **ELLE LÈVE PLUTÔT QUE DE RENDRE ZÉRO, ET C'EST LA TOTALITÉ DU DÉPARTAGE.**
Deux bases du joueur ne peuvent pas partager une case : un ex æquo après les trois
critères est un fait de PROGRAMME. Rendre `0` laisserait l'ordre de parcours
trancher en silence, c'est-à-dire **l'INDICE dans `etat.bases`** — exactement ce
que le lot supprime.

⚠ **ELLE LIT LA POSITION DE LA BASE DU JOUEUR, PAS CELLE DE LA PAIRE.** La paire
porte la case du SITE attaquant ; ce qui se départage est la case de la base
VISÉE. C'est le second endroit où une inattention passerait tous les tests
d'égalité écrits avec la même erreur — d'où `RCU T3` et `RCU T4`, qui construisent
la géométrie à la main autour d'une attaquante réelle.

### ⚠⚠ L'ordre de sortie est devenu une RÈGLE

Il suit la case de l'**attaquante** — la plus haute d'abord, puis de gauche à
droite —, là où il suivait la distance depuis la base qui avait demandé le
balayage. Ce n'est pas cosmétique : `resoudreLaMinute` parcourt cette liste, et
les raids d'une même minute partagent des stocks. Un ordre qui dépendrait du
tableau `etat.bases` ferait changer l'issue d'une minute **quand le joueur fonde
une base**.

C'est le **seul** effet mesurable à une seule base, et il est sans conséquence :
voir §5.

---

## 4. Le commentaire de `basesAttaquantes`, réécrit

Il annonçait une lecture prise ; elle est arbitrée. Cité :

> ⚠⚠ **UNE BASE DE L'OUVRAGE N'EN FRAPPE QU'UNE, LA PLUS PROCHE — ARBITRÉ PAR
> ETHAN LE 07/09/2026.** Ce commentaire portait une LECTURE PRISE : à portée de
> deux bases du joueur, une base de l'Ouvrage les attaquait TOUTES LES DEUX la
> même minute, faute d'une règle pour choisir. Elle est donnée : « elle n'en
> frappe qu'une, la plus proche », et pour l'égalité « le plus haut, puis gauche à
> droite ». Le `for` imbriqué que ce commentaire désignait est devenu la boucle
> ci-dessous, et lui seul : `departagerLesCandidates` porte la règle.
>
> ⚠⚠ **ET `baseAttaqueALaMinute` N'A PAS BOUGÉ D'UNE LIGNE.** Elle hache la CASE
> de l'attaquante et la minute, jamais la cible : le TIRAGE est donc identique au
> bit. Ce qui change est ce qui en découle — une minute qui produisait deux raids
> n'en produit plus qu'un. Une partie à UNE SEULE base du joueur n'a rien à
> départager et reste identique, minute pour minute ; c'est la non-régression
> `RCU T7`, et le témoin de BASES-0 la mesure sur vingt-cinq graines.
>
> ⚠ **LE COÛT NE BOUGE PAS** : `ciblesAPortee` reste appelée UNE FOIS PAR BASE DU
> JOUEUR. Inverser les boucles pour partir des bases de l'Ouvrage aurait demandé
> de balayer la carte à l'envers ; la distance est symétrique, donc on garde le
> balayage et on REGROUPE. `RCU T11` compte les appels.
>
> ⚠ **L'ORDRE DE SORTIE EST UNE RÈGLE, PAS UN ORDRE DE TABLEAU.** […]
> `resoudreLaMinute` résout les raids d'une même minute dans cet ordre, et ils
> partagent des stocks : un ordre qui dépendrait de l'ordre du tableau ferait
> changer l'issue quand le joueur fonde une base.

---

## 5. ⚠⚠ Ce que ça déplace — mesuré sur trois jours, avant et après

Scénario : graine **7**, bases du joueur plantées au nord (rangée 200), **4 320
minutes** (trois jours), tous les couples (minute, attaquante) énumérés. La mesure
tourne dans les DEUX arbres — celui d'avant par `git worktree` — avec le **même
script**.

| Montage | Attaquantes | Raids subis | Empreinte des minutes |
| --- | --- | --- | --- |
| **1 base** — avant | 58 | **157** | `9da2b5139d0cefdb` |
| **1 base** — après | 58 | **157** | `9da2b5139d0cefdb` |
| **2 bases** — avant | 112 | **318** | `6df24e70f6ce4249` |
| **2 bases** — après | **72** | **202** | `f93604818d53a47f` |
| **3 bases** — avant | 167 | **490** | `ceb123e1926d2468` |
| **3 bases** — après | **90** | **267** | `c8524de2436ea5b2` |

### ⚠⚠ À une base, c'est identique — et pas seulement en compte

Le brief demandait « exactement le même compte ». C'est plus fort que ça :

- **58 attaquantes, 157 raids subis, la même empreinte de minutes.**
- Et **24 h de `rattraperJeu` sur une partie réelle rendent une sauvegarde
  identique au bit** : empreinte `4ac990e3f61405eb` avant comme après.
- Le **témoin de BASES-0** — vingt-cinq graines, quatorze phases, une base — **n'a
  pas bougé d'une empreinte**. Rien n'a été recapturé.

⚠ **UN SEUL CHIFFRE DIFFÈRE À UNE BASE, ET IL SE DÉCLARE** : l'empreinte de la
liste ORDONNÉE (`baf2f59b…` → `7af59eef…`). C'est l'ordre de sortie du §3, et
l'égalité au bit de la sauvegarde après 24 h prouve qu'il ne change rien de ce qui
compte.

### À deux bases et plus, les raids subis changent — et c'est le lot

**318 → 202** à deux bases, **490 → 267** à trois. Le tirage lui-même n'a pas
changé d'un bit : `baseAttaqueALaMinute` hache la case de l'attaquante et la
minute, jamais la cible. Ce qui change est ce qui en découle — 40 attaquantes à
deux bases, 77 à trois, voyaient deux cibles et n'en voient plus qu'une.

**Les raids subis d'une partie en cours à plusieurs bases ne seront plus les
mêmes.** Sans importance — Ethan est seul joueur — mais **annoncé, pas
découvert**.

⚠ **`baseAttaqueALaMinute` ET SON HACHAGE N'ONT PAS ÉTÉ TOUCHÉS.** Le sel reste le
sixième, la case et la minute restent les deux passes. `git diff` sur la fonction
est vide.

---

## 6. Le coût — un appel par base du joueur, avant comme après

`ciblesAPortee` lit `base.position` **une fois et une seule**. Un getter posé sur
les bases du joueur, qui regarde **l'appelant DIRECT** dans la pile, donne donc le
compte exact sans toucher au code mesuré.

| Bases du joueur | Appels à `ciblesAPortee` avant | après | Lectures de `position` avant | après |
| --- | --- | --- | --- | --- |
| 1 | **1** | **1** | 317 | 317 |
| 2 | **2** | **2** | 1 265 | 1 265 |
| 3 | **3** | **3** | 2 841 | 2 841 |

**Aucun appel de plus, aucune lecture de plus.** Inverser les boucles pour partir
des bases de l'Ouvrage aurait demandé de balayer la carte à l'envers ; la distance
étant symétrique, on garde le balayage et on regroupe.

⚠ **CHERCHER `ciblesAPortee` DANS LA PILE ENTIÈRE DONNAIT 317 AU LIEU DE 1**, et
c'est instructif : les 316 autres lectures sont faites plus bas par
`siteDeLaCase`, une par case du disque. La première mesure était fausse et l'a
dit.

⚠ **`RCU T11` exige en plus qu'il n'y ait qu'UN `ciblesAPortee(` dans tout
`raid-ouvrage.js`** : un second, ajouté un jour dans la boucle intérieure sur une
base de l'Ouvrage, ne se verrait pas dans le compte ci-dessus.

---

## 7. Les tests — PASS/KO, avec le montage effectivement écrit

**Treize tests entrent. Aucune assertion n'a été retirée ni assouplie, et aucun
test existant n'a été modifié.**

| Code | Verdict | Le montage écrit |
| --- | --- | --- |
| **RCU T0** | **PASS** | *Hors brief, exigé par son §2.* L'orientation par EXÉCUTION : `niveauDeLaRangee(1) === niveauPlafond`, `niveauDeLaRangee(300) === 1`, le niveau DÉCROÎT quand la rangée croît, et la rangée de départ du joueur est au niveau 1. Puis la mesure : Tchebychev vaut 10 sur un coin **hors de portée**, `estAPorteeDAttaque` le refuse. |
| **RCU T1** | **PASS** | Bases en (200, 16) et (204, 19), graine 7. Aucune attaquante ne paraît deux fois, et le **compte des doublons retirés tombe exactement sur celui des attaquantes contestées** (celles à portée des deux). ⚠ Les contestées se comptent SUR l'état à deux bases : `siteDeLaCase` rend `null` sur la case d'une base du joueur, donc croiser deux états à une base comptait un site qui n'existe plus — mesuré, 73 contre 72. |
| **RCU T2** | **PASS** | Même montage. Pour chaque attaquante dont les deux distances DIFFÈRENT, la base frappée est celle de distance minimale, recalculée dans le test. Le montage doit en porter au moins une, asserté. |
| **RCU T3** | **PASS** | Deux bases **symétriques** autour d'une attaquante réelle : `(r−3, c−4)` et `(r+3, c+4)`, `d² = 25` des deux côtés, rangées différentes. La plus PETITE rangée gagne — et le commentaire dit pourquoi. **Joué dans les deux ordres de tableau.** |
| **RCU T4** | **PASS** | `(r−3, c−4)` et `(r−3, c+4)` : `d² = 25`, **même rangée**, colonnes différentes. La plus petite colonne gagne. **Joué dans les deux ordres.** |
| **RCU T5** | **PASS** | Cent montages de 2 à 4 bases tirés au **PRNG du dépôt** (`creerRng(20260907)`, jamais `Math.random`). `basesAttaquantes` ne lève jamais, et pour chaque attaquante le vainqueur est **recalculé indépendamment** sur la clé annoncée. Falsifiable : plus de 100 attaquantes réellement contestées, asserté. |
| **RCU T6** | **PASS** | `[A, B]` puis `[B, A]` : la table `case d'attaquante → case de base frappée` est **identique**. ⚠ Falsifiable : le montage doit voir les DEUX bases visées, sinon l'égalité serait gratuite. **C'est le test qui prouve que la règle est une règle.** |
| **RCU T7** | **PASS** | Une base, trois jours. **58 attaquantes, 157 raids, empreinte de minutes `9da2b5139d0cefdb`** — les trois nombres relevés sur l'arbre d'AVANT par `git worktree`, recopiés, non produits par le code qu'ils gardent. Et l'ordre de sortie est asserté comme suivant la case de l'attaquante. |
| **RCU T8** | **PASS** | Deux bases : la liste rendue est **exactement** l'ensemble des sites attaquants de niveau ≥ 10 à portée d'au moins une base. Le lot ne perd ni n'invente d'attaquante — il limite **par attaquante**, pas globalement. |
| **RCU T9** | **PASS** | Non-régression du niveau minimal sur le chemin NEUF, celui du regroupement : deux bases en (255, 16) et (258, 19), là où la fenêtre porte des sites des deux côtés du seuil. `RAID-B T6`, qui mesure une base seule, **n'est pas modifié**. |
| **RCU T10** | **PASS** | Camps et avant-postes. ⚠ Le montage rattrape `TICKS_APPARITION` d'abord : sans satellites parus, il n'y a aucun site non attaquant à portée et l'assertion serait gratuite. Chaque type non attaquant doit être présent, asserté. |
| **RCU T11** | **PASS** | Le compte d'appels du §6, plus le balayage de source : un seul `ciblesAPortee(` dans le fichier. |
| **RCU T12** | **PASS** | *Hors brief, exigé par son §6.* `SAVE_VERSION === 27`, une sauvegarde v27 traverse `migrer` sans être réécrite, et `basesAttaquantes` ne modifie pas l'état — sérialisation identique avant/après appel. |

---

## 8. Les chiffres

| Grandeur | Avant | Après | Écart |
| --- | --- | --- | --- |
| `npm test` | **1 274 pass / 0 fail** | **1 287 pass / 0 fail** | **+13** |
| `dist/index.html` | **8 012 333** | **8 012 887** | **+554** |
| `SAVE_VERSION` | 27 | **27** | **0** |
| version · build | 0.99.14 · 115 | **0.99.15 · 116** | — |

| Poste | Écart |
| --- | --- |
| JavaScript | **+554** |
| feuille | +0 |
| balisage | +0 |
| images | +0 |
| audio | +0 |

**La somme des cinq postes tombe EXACTEMENT sur le total.** **296 lignes `data:`
avant, 296 après ; 291 URI de part et d'autre.** Borne T10 inchangée à
**9 300 000** ; marge **1 287 113 octets, 13,84 %**. Zéro référence externe.

---

## 9. Ce qui n'a pas bougé

- **`baseAttaqueALaMinute`, son sel, sa case, sa minute** — `git diff` vide.
- **`RAID_OUVRAGE.chanceParMinute` et `niveauMinimal`** — aucune valeur de
  calibrage.
- **`baseVisee` reste un INDICE**, pas un objet.
- **`subirUnRaid`** — pas une ligne.
- **`TYPES_SITE[x].attaqueLeJoueur`** — le filtre reste dans les données ; aucun
  `type === 'base'` n'a été écrit.
- **`SAVE_VERSION`**, vérifié par `RCU T12`.
- **Le témoin de BASES-0** — aucune empreinte recapturée.
- **Le territoire et la formule d'influence** — lot TERRITOIRE-FORCE, aucun
  fichier partagé.

**Fichiers touchés :** `src/sim/raid-ouvrage.js`, l'en-tête de `ciblesAPortee`
dans `src/sim/site-de-la-case.js`, `test/raid-ouvrage.test.js`, `CLAUDE.md`,
`package.json`, ce rapport.

---

## 10. Écarts et points en suspens

### ⚠ 10.1 — La prémisse « Tchebychev » du brief était fausse, et l'en-tête aussi

Corrigé aux deux endroits, §2. **C'est le seul écart de fond du lot** : le
départage emploie `distanceCarree`, la mesure qui décide de la portée, et non la
distance de Tchebychev que le brief citait.

### ⚠ 10.2 — L'ordre de la liste rendue a changé, y compris à une base

Déclaré au §3 et au §5. La sauvegarde après 24 h est identique au bit à une base,
et le témoin de BASES-0 n'a pas bougé : l'effet est nul là où on peut le mesurer.
**Si Ethan préfère que l'ordre reste celui de la distance, c'est le `.sort()`
final qui change, et lui seul.**

### 10.3 — Points en suspens

1. **La règle vaut-elle aussi dans l'autre sens ?** Une base du joueur à portée de
   deux bases de l'Ouvrage est toujours attaquée par les deux, la même minute si
   les deux tirages tombent. C'est `RCU T8` — le lot limite **par attaquante** —,
   et c'est ce que le brief demande. Rien ne dit que ce soit voulu du côté de la
   défense.
2. **Le journal des attaques subies** — point 14 d'Ethan : lot séparé, non touché.
3. **`package.json` ne déclare aucun `engines`.** Node 20.11.1 rend `npm test`
   inutilisable. Hors du lot, toujours non fait.

---

**PR ouverte, non mergée.**
