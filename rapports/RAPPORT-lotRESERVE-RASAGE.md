# RAPPORT — cavalier RÉSERVE-RASAGE

**20/09/2026.** Greffé sur la PR d'accueil du lot SOUFFLE (`claude/lot-souffle`),
en second commit, sans branche à lui — c'est ce que le micro-brief demandait.
Base de départ du cavalier : `c864e91`, le commit SOUFFLE appliqué sur `main` =
`c8567bc` (RUINES-DÉFENSE, #159). **Aucun numéro de version bumpé par le
cavalier** : le bump de SOUFFLE — 0.99.70 · build 182 — le couvre.

L'arbitrage tient en une phrase, et c'est celle du brief : **seul le rasage
vide, et il ne vide que les trois réservoirs d'armée. La réserve des bâtiments
n'est vidée par rien.**

---

## 1. La base relevée sur la branche d'accueil, avant travail

Relevée par exécution, sur `claude/lot-souffle` = `c864e91`, arbre propre,
Node 22.23.2, `core.autocrlf=false` :

| grandeur | valeur mesurée | ce que le brief annonçait |
|---|---|---|
| tests | **1650 déclarés — 1 649 pass · 0 fail · 1 skipped** | 1648 / 1 647 (c'est la base de `main`) |
| `dist/index.html` | **9 122 717 octets** | 9 494 171 (idem) |
| version · build | **0.99.70 · 182** | 0.99.69 · 181 (idem) |
| `SAVE_VERSION` | **38** (`src/sim/state.js:84`) | 37 |

Les trois premiers écarts sont ceux que le brief prévoyait — « la PR d'accueil
aura bougé certains de ces nombres, ce sont les siens qui font foi ». Le
quatrième ne vient pas de SOUFFLE : le brief a recopié le « 37 » de la §0 de
`CLAUDE.md` d'alors, que SOUFFLE a corrigé le même jour (le code dit 38 depuis
MODE-DEV). Sans conséquence : le cavalier ne touche pas à l'état.

Et, parce que SOUFFLE touche à l'art, `tools/verifier.py --outil emblemes` a
été lancé sur cette machine avant d'écrire une ligne — voir §8.

---

## 2. Le diff de la condition, cité

`src/sim/raid-ouvrage.js`, étape 3 des cinq conséquences du §4.4 :

```diff
-  const aPerduDesPv = resultat.batiments.some((b) => b.pvPerdusIciMilli > 0);
-  if (aPerduDesPv) {
+  if (rase) {
     for (const chassis of Object.keys(laBase.reserveReparation)) {
       laBase.reserveReparation[chassis] = 0;
     }
   }
```

et le champ du rapport :

```diff
-    reserveVidee: aPerduDesPv,
+    reserveVidee: rase,
```

`rase` est calculé à l'étape 1 (`chantierTombe`, L. 769) et consommé à l'étape 2
(`raserLaBase`, L. 786), tous deux **au-dessus** de ce bloc — rien à faire
descendre, aucun ordre à changer, ce que le brief §2.1 annonçait et qui a été
relu sur le bloc entier après coup. `aPerduDesPv` n'a plus d'occurrence dans
`src/` ni dans `test/` hors commentaires (`grep` : deux mentions en prose, qui
disent que la condition a changé).

Le champ `reserveVidee` **reste** et double `rase` dans le même rapport, et le
doublon est écrit à côté de lui : `rase` dit ce que le raid a fait à la base,
`reserveVidee` ce qu'il a fait à la réserve, et c'est cette seconde ligne que
`lignesDeLaDefense` affiche. `reserveReparationBatiments` n'est vidée nulle part
— la seconde moitié de l'arbitrage se tient par une absence, et `T9 bis` la
garde.

Trois blocs de prose remis droit, comme demandé : l'en-tête des cinq
conséquences (étape 3 « se vide, SI LA BASE EST RASÉE »), le bloc ⚠⚠ de
`subirUnRaid` (qui portait l'arbitrage du 05/09 et sa justification par le
cliquet — il porte celui du 20/09, la mesure qui l'a motivé, et garde les deux
phrases sur le verdict, qui restent vraies), le commentaire de `src/ui/rapport.js`
L. 552 (le code de la ligne n'a pas changé), et `MODELE-ECONOMIQUE.md` §7 —
« vide le réservoir de réparation » devient faux et la phrase est amendée en y
accrochant la raison du plancher de PV. `test/journal-raids.test.js` L. 640
n'a pas été touché : c'est un montage synthétique d'affichage.

---

## 3. Les falsifications jouées, avec le rouge obtenu

Chacune appliquée sur `src/sim/raid-ouvrage.js`, mesurée par
`node --test test/raid-ouvrage.test.js`, puis défaite — le fichier a été
restauré à l'identique (comparé au caractère près, jamais par `git checkout`,
qui rendrait l'index et effacerait le lot).

**F1 — la condition `aPerduDesPv` remise** (le code d'avant le cavalier) :
37 tests, **36 pass · 1 fail**, et c'est `T9` :

```
not ok 12 - RAID-B T9 — un raid qui abîme SANS raser ne vide pas la réserve
  error: |-
    un raid qui abîme sans raser a vidé la réserve d'armée
    + actual - expected
    +   aeronef: 0,
    +   blinde: 0,
    +   escouade: 0
    -   aeronef: 12345,
    -   blinde: 12345,
    -   escouade: 12345
```

**F2 — le bloc `if (rase) { … }` retiré en entier** : 37 tests, **36 pass ·
1 fail**, et c'est `T9 bis` :

```
not ok 13 - RAID-B T9 bis — le rasage vide les trois réservoirs d'armée, et PAS celui des bâtiments
  error: |-
    le rasage n'a pas vidé la réserve d'armée
    + actual - expected
    +   aeronef: 12345,
    +   blinde: 12345,
    +   escouade: 12345
    -   aeronef: 0,
    -   blinde: 0,
    -   escouade: 0
```

**F3 — une ligne de plus, `if (rase) laBase.reserveReparationBatiments = 0;`**
(l'« harmonisation » que le brief redoute) : 37 tests, **36 pass · 1 fail**, et
c'est la seconde assertion de `T9 bis`, celle qui n'existait nulle part avant :

```
not ok 13 - RAID-B T9 bis — le rasage vide les trois réservoirs d'armée, et PAS celui des bâtiments
    le rasage a vidé la réserve des BÂTIMENTS, que rien ne vide
  expected: 54321
  actual: 0
```

Trois falsifications, trois chutes, **une par test et rien d'autre ne tombe**.
La relecture hostile du brief est donc faite en lançant la suite : `T9` échoue
vraiment si on restaure `aPerduDesPv`.

---

## 4. Le relevé du montage `niveau: 10`, tel qu'obtenu à l'exécution

Rejoué avant d'écrire une ligne, avec une réplique exacte de `baseALaRangee`
du fichier de test, graine 7, rangée 200, attaquante synthétique
`{ type: 'base', niveau: 20, rangee: 190, colonne: 16 }`, réservoirs à 12 345
et réserve des bâtiments à 54 321 avant le raid — **sur le code d'AVANT le
correctif**, ce qui montre aussi ce qu'il corrige :

| montage | `rase` | `restantBatiments` | `verdict` | réserve d'armée après (ancienne règle) | réserve bâtiments après |
|---|---|---|---|---|---|
| `{ niveau: 1, garnison: false }` | **true** | 45 % | `defaite-totale` | 0 · 0 · 0 | 54 321 |
| `{ niveau: 8 }` | false | 59 % | `defaite` | 0 · 0 · 0 | 54 321 |
| **`{ niveau: 10 }`** | **false** | **81 %** | **`defaite`** | **0 · 0 · 0** | 54 321 |
| `{ niveau: 12 }` | false | 96 % | `defaite` | 0 · 0 · 0 | 54 321 |
| `{ niveau: 16 }` | false | 100 % | `victoire-totale` | 12 345 · 12 345 · 12 345 | 54 321 |

Les trois colonnes du brief (§4.1) sont **reproduites ligne pour ligne** :
l'équilibrage n'a pas bougé depuis le 20/09, le montage `niveau: 10` est
retenu tel quel. La colonne « ancienne règle » dit le défaut : trois défaites
sans rasage sur quatre vidaient la réserve. ⚠ L'ancien `T9` appelait
`basesAttaquantes(etat)[0]` et non `ATTAQUANTE` ; le neuf prend `ATTAQUANTE`,
comme `T8` et comme le relevé du brief — c'est ce montage-là qui a été mesuré.

---

## 5. Le compte de tests, et `documentation.test.js`

`npm run check` sur la branche d'accueil avec le cavalier : **1650 déclarés —
1 649 pass · 0 fail · 1 skipped** (`LIMITE T8`, suspendu par Ethan le 08/09),
sortie **0**. C'est le compte de la branche d'accueil, inchangé : `T9` et
`T9 bis` sont réécrits sur place, zéro ajouté, zéro supprimé, et `grep -c
"^test("` sur `test/*.test.js` rend 1650. `documentation.test.js` — les six
tests — est vert **sans que la ligne « 1650 pass / 0 fail » de `CLAUDE.md`
§0 ait été touchée** : elle reste la première annonce du fichier, à l'offset
où SOUFFLE l'a laissée.

⚠⚠ **MAIS LE BRIEF ANNONÇAIT QUATRE FICHIERS ET « AUCUN AUTRE », ET C'ÉTAIT
FAUX — MESURÉ AU PREMIER `npm run check`.** Le cavalier appliqué à la lettre
rendait **1 647 pass · 2 fail** : `BASES-0 T1 — empreinte par champ` et
`empreinte par graine`, les deux gardes du témoin gelé de `test/bases.test.js`.
Ce n'était pas une surprise de mécanisme, c'est la doctrine du dépôt — un lot
qui change ce que `subirUnRaid` écrit dans l'état déplace le témoin, et le
témoin **s'empile, il ne se recapture pas**. Le brief n'avait pas lancé la
suite complète. Écart déclaré, et traité comme les trente et une couches
d'avant :

- **`p13_apresLeRaid.rapports`, `p13_apresLeRaid.reserveReparation`,
  `p14_sousLeFeu.rapports`** — trois champs, deux phases, les deux seules où le
  joueur SUBIT un assaut. Les douze autres phases ne bougent d'aucun octet.
- **graines 10, 15, 17, 22** — quatre sur vingt-cinq, la table la plus creuse
  depuis CONTACT-2 (six). Mesuré sur les verdicts rangés, graine par graine :
  sur vingt et une parties, TOUS les assauts subis dans la fenêtre sont des
  `defaite-totale` (rasage), que les deux règles vident pareil. Sur **17 et 22**,
  l'unique assaut de la phase 13 rend `defaite` sans raser : la réserve
  retrouvée vaut **666 100 et 651 100 ticks** (18,5 h · 18,1 h) là où l'ancienne
  règle la mettait à zéro. Sur **15**, une défaite précède un rasage dans la même
  phase — la réserve est re-vidée, seul le rapport bouge. Sur **10**, la défaite
  sans rasage est à la phase 14, entre deux rasages — seul le rapport bouge.
- `reserveReparation` ne bouge qu'à la phase 13 parce qu'**à la phase 14 les
  vingt-cinq parties subissent au moins un rasage** — mesuré, pas déduit.

`DEPLACES_PAR_RESERVE_RASAGE` et `EMPREINTES_PAR_GRAINE_RESERVE_RASAGE`
entrent dans `test/temoins-bases-0.js` (trente-deuxième couche), et
`bases.test.js` les lit en tête de ses deux chaînes de `??`. Les empreintes
ont été relevées par un test de dump temporaire appendu au fichier, exécuté,
puis retiré — le fichier commité est celui d'avant, plus les deux chaînes.
Aucun scalaire du témoin ne bouge, la taille de la sauvegarde comprise :
`SAVE_VERSION` reste à 38, vérifié au diff.

⚠ **ET `PIC T7` EST RÉANCRÉ, POUR 44 OCTETS.** Le livrable passe de
**9 122 717 à 9 122 673** — `aPerduDesPv` n'est plus calculé, et c'est du
JavaScript pur. Un millième de la tolérance de 50 000 : le laisser aurait passé
au vert en faisant mentir la mesure écrite, ce que ce test existe pour refuser
(ÉCHELLE-RECHERCHE en a réancré 51 pour la même raison). Marge **577 327**,
5,95 % inchangé à la décimale, contre-assertion `notEqual 577_283` ajoutée. Le
titre du test, qui disait encore « 9 494 171 » après SOUFFLE, est mis au
nombre du disque.

Un paragraphe « Cavalier RÉSERVE-RASAGE » entre dans le bloc §0 de SOUFFLE
dans `CLAUDE.md`, sous ses lignes à lui — pour que le dépôt ne dise pas
9 122 717 pendant que le disque dit 9 122 673, ni « aucun fichier de `src/` »
pendant que `raid-ouvrage.js` bouge. La ligne du compte de tests n'a pas été
touchée.

Fichiers touchés par le cavalier, contre les quatre du brief :

```
src/sim/raid-ouvrage.js       condition, champ du rapport, trois commentaires   (brief)
src/ui/rapport.js             un commentaire, aucun code                        (brief)
test/raid-ouvrage.test.js     T9 et T9 bis réécrits sur place                   (brief)
MODELE-ECONOMIQUE.md          §7, la phrase amendée                             (brief)
test/temoins-bases-0.js       trente-deuxième couche                            (écart, §5)
test/bases.test.js            deux chaînes de `??`, un import                   (écart, §5)
test/pictogramme.test.js      PIC T7 réancré, −44 octets                        (écart, §5)
CLAUDE.md                     un paragraphe sous le bloc SOUFFLE                (écart, §5)
rapports/RAPPORT-lotRESERVE-RASAGE.md   ce fichier                              (brief §7)
```

---

## 6. Ce qui reste ouvert

- **Le plafond de 24,6 h est inatteignable sur une base attaquée toutes les
  45 minutes**, et ce cavalier n'y touche pas — le brief §5 l'exclut nommément.
  Ce qu'il change est que la réserve n'est plus remise à zéro entre deux
  attaques ; ce qu'il ne change pas est qu'elle continue de l'être à chaque
  rasage, et qu'à une base par 45 minutes le crédit de 1 tick par tick ne
  remonte jamais au plafond. `plafondDeLaReserve` est un arbitrage
  d'équilibrage distinct. **Ethan tranche.**
- **Aucun rattrapage rétroactif** : les parties dont la réserve est déjà à zéro
  la reconstituent au taux normal. Pas de maillon de migration, et le schéma ne
  change pas.
- Le rendu n'a pas été vu : la ligne « Réserve de réparation · intacte » après
  une défaite non rasée est mesurée par `lignesDeLaDefense`, pas à l'écran.

---

## 7. Le verdict du lot SOUFFLE, revérifié ici avant de greffer

Le cavalier n'existe que sur une PR d'accueil, et celle-ci a été montée dans la
même session : `lotSOUFFLE.patch` appliqué par `git am` sur `main` = `c8567bc`
(`git apply --check` sortie 0 d'abord), commit `c864e91`, message et auteur
conservés. Les dix-sept fichiers du zip sont **identiques à l'octet** à ceux de
l'arbre après application, et aucun ne porte de CRLF.

- `npm run check` sur `c864e91` : **1650 · 1 649 pass · 0 fail · 1 skipped**,
  sortie 0, `dist/index.html` **9 122 717 octets** — les deux nombres du
  `LISEZ-MOI-SOUFFLE.md`, retrouvés.
- `python tools/verifier.py --outil emblemes` sur cette machine (Pillow 12.3.0,
  numpy 2.5.3, libwebp 1.6.0) : **5 identiques · 266 différents · 0 nouveaux**,
  EXIT 1. Ce n'est PAS le verdict du conteneur (271 identiques), et c'est la
  limite que `CLAUDE.md` §3 écrit depuis RUINES-DÉFENSE : il compte des octets.
  Rejoué sous `FZ_SPRITES` dans un dossier dérouté et comparé image par image
  en RVBA (numpy) : **266 identiques au PIXEL, 0 différent au pixel** — les
  266 « différents » sont l'encodeur PNG de Pillow 12.3 contre 12.2. **Et les
  quatre `.webp` du lot sont dans les cinq identiques à l'octet** : la chaîne de
  cette machine reproduit exactement `base_o_2x2` et `base_o_3x3` aux deux
  grilles, avec `emblemes-mesures.json`. C'est ce qui fallait savoir avant
  d'ouvrir la PR.
