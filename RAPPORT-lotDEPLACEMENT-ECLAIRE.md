# RAPPORT — lot DÉPLACEMENT-ÉCLAIRÉ

Ethan, 07/09/2026, point **1** : « Confirmation avant de bouger la base +
indiquer le nombre de base ouvrage à portée », précisé le même jour : « nombre
de base ouvrage **qui pourront attaquer** ».

**Version produite : 0.99.25 · build 127.** Les deux restent des chaînes JSON.

---

## 0. La base annoncée n'était plus là

Le brief pose **1340 pass**, `dist/index.html` **8 256 764 octets**, version
**0.99.23 · build 124**. Mesuré au départ, branche repartie de `origin/main`
après le merge de la PR #100 :

| | brief | mesuré |
|---|---|---|
| `npm test` | 1340 | **1359** |
| `dist/index.html` | 8 256 764 | **8 344 729** |
| version | 0.99.23 · 124 | **0.99.24 · 126** |
| marge T10 | — | **955 271 octets, 10,27 %** |

Deux lots ont été mergés entre l'écriture du brief et son exécution —
TERRITOIRE-LU et CONQUÊTE-24H. **Les quatre faits dont ce lot dépend étaient
intacts**, vérifiés un par un avant d'écrire : `basesAttaquantes` et ses trois
conditions, `ciblesAPortee` et son carré de Tchebychev de rayon 10,
`RAID_OUVRAGE.niveauMinimal` à 10, et le mode armé de `ui/monde.js`
(`armerLeDeplacement` / `desarmerLeDeplacement`). Signalé plutôt que traité
comme un point d'arrêt.

---

## 1. Ce que le lot pèse

`npm test` → **1370 pass / 0 fail** (1359 avant). `npm run build` →
`dist/index.html`, **8 346 566 octets**, 0 référence externe.

Coût **+1 837 octets**, mesuré poste par poste contre un livrable rebâti dans un
`git worktree` depuis `origin/main` :

| poste | delta |
|---|---|
| JavaScript | **+771** |
| feuille | **+748** |
| balisage | **+318** |
| images | **+0** |
| audio | **+0** |
| **somme des cinq** | **+1 837** |

La somme des cinq postes tombe **exactement** sur le total. **297 lignes `data:`
avant, 297 après, 297 URI de part et d'autre** : aucune ressource n'entre.

Borne T10 **inchangée à 9 300 000**, marge **953 434 octets, 10,25 %**.

Le lot touche `src/sim/raid-ouvrage.js`, `src/ui/monde.js`, la feuille et le
balisage, plus trois fichiers de `test/`.

---

## 2. ⚠⚠ COMMENT L'UNICITÉ D'ÉCRITURE A ÉTÉ OBTENUE : QUI S'EXPRIME PAR QUI

C'est le §2 du brief, et c'est le cœur du lot.

**`attaquantesDeLaPosition(etat, position)` entre dans `src/sim/raid-ouvrage.js`,
et elle est la SEULE écriture des trois conditions.** Elle prend une POSITION —
pas une base — parce que c'est ce qui la rend utile aux deux appelants :
`basesAttaquantes` lui passe la position d'une base existante, l'écran de la
carte celle d'une case **candidate**, où aucune base ne se trouve encore.
`ciblesAPortee` n'a jamais lu que `.position` de ce qu'on lui donne.

```js
export function attaquantesDeLaPosition(etat, position) {
  const retenues = [];
  for (const site of ciblesAPortee(etat, { position })) {
    if (TYPES_SITE[site.type]?.attaqueLeJoueur !== true) continue;
    if (site.niveau < RAID_OUVRAGE.niveauMinimal) continue;
    retenues.push(site);
  }
  return retenues;
}
```

**`basesAttaquantes` s'exprime par elle**, et n'en garde que le REGROUPEMENT —
la clé par case d'attaquante, le départage de `RAID-CIBLE-UNIQUE`, le tri de
sortie. Ses trois `if` ont disparu de son corps.

**`nombreDAttaquantes(etat, position)` est une dérivation d'une ligne** —
`attaquantesDeLaPosition(...).length` — et c'est ce que l'écran lit. Le compte
et la liste ne peuvent donc pas se contredire.

⚠⚠ **`DÉ T4` MESURE L'ACCORD AU LIEU DE L'AFFIRMER**, et c'est ce que le brief
exige : sur **cent positions tirées**, le compte annoncé égale le nombre de
bases DISTINCTES que `basesAttaquantes` produirait depuis cette position.
**86 des 100 positions portent au moins une attaquante** — un balayage qui
rendrait zéro partout passerait sur n'importe quel code, et le test l'asserte
avant de comparer.

⚠ **LE COMPTE EST CELUI DES ATTAQUANTES, PAS DES PAIRES.** `ciblesAPortee`
balaie chaque case une fois, donc un site n'y paraît qu'une fois : deux bases du
joueur à portée de la même attaquante ne la comptent pas deux fois. `DÉ T5` le
mesure en fondant une seconde base.

⚠⚠ **ET LA PREMIÈRE ÉCRITURE DE `DÉ T5` MESURAIT LA FAUTE INVERSE.** Elle posait
la seconde base deux rangées au nord ; mesuré, le compte tombait de **49 à 48**,
pas à 98. `siteDeLaCase` rend `null` sur toute case occupée par une base du
joueur, donc **fonder sur une base de l'Ouvrage l'efface de la carte**. Le
montage cherche désormais une case libre, et il l'asserte.

---

## 3. La confirmation

Elle s'intercale **entre le toucher de la case et le déplacement**, jamais entre
le bouton et l'armement : c'est la case VISÉE qui donne le chiffre, et elle
n'est pas connue avant qu'on la touche. `DÉ T10` le mesure — deux comptes
DIFFÉRENTS, assertés différents avant d'être lus.

`poserLaBase` est remplacée par **trois temps** dans `src/ui/monde.js` :

- **`demanderLeDeplacement(cible)`** — interroge `problemesDuDeplacement`,
  **refuse d'abord**, puis retient la case et ouvre la confirmation ;
- **`renoncerAuDeplacement()`** — vide l'accord, désarme le mode, ferme ;
- **`confirmerLeDeplacement()`** — **redemande les problèmes**, puis appelle
  `deplacerLaBase`.

Plus **`refuserLeDeplacement(problemes)`**, extraite parce que **deux** chemins y
mènent : le toucher et l'accord. L'écrire deux fois aurait donné deux
formulations du même refus au premier ajustement.

⚠⚠ **LA RELECTURE DES PROBLÈMES À L'ACCORD N'EST PAS DÉCORATIVE.** Entre le
toucher et l'accord, la session continue de tourner : un raid de l'Ouvrage peut
se résoudre, et `raserLaBase` **DÉPLACE la base de vingt rangées**. La case visée
devient alors hors de portée — ou celle où la base se trouve déjà. Sans cette
relecture, `deplacerLaBase` LÈVERAIT au milieu d'un geste que le joueur a
commencé légalement.

⚠ **LE REFUS PASSE AVANT LA CONFIRMATION** — on ne demande pas d'accord pour un
geste qui sera refusé. `DÉ T9` le mesure, et son montage a dû être **réécrit** :
`casesAtteignables` est **VIDE** pendant le délai, donc le second montage ne
pouvait pas passer par elle. Il vise une case à portée que le moteur refuse, et
asserte que le refus mesuré est bien `['delai']` et non celui de la distance.

⚠ **RENONCER RAMÈNE À L'ÉTAT D'AVANT LE TOUCHER.** `DÉ T7` compare la
`serialiser` complète avant et après, et mesure le désarmement **par le
comportement** — un toucher de plus doit ouvrir le panneau d'un site, pas
reposer la base — plutôt que par une variable que l'écran n'expose pas.

⚠⚠ **ET « FERMER » EST UNE PORTE DE SORTIE COMME UNE AUTRE.** `fermerPanneau`
vide `deplacementEnAttente` : sans cette ligne, le panneau se refermerait en
gardant la case retenue, et le bouton d'accord — que plus personne ne voit —
resterait capable de déplacer la base. **`DÉ T7 bis` a été écrit pour ça**, et
la falsification F10 ne fait tomber que lui.

---

## 4. Le libellé retenu pour zéro

**« Aucune base de l'Ouvrage ne pourra vous attaquer ici. »**

Les trois formes, dans `phraseDesAttaquantes`, pure et exportée :

| compte | phrase |
|---|---|
| 0 | Aucune base de l'Ouvrage ne pourra vous attaquer ici. |
| 1 | 1 base de l'Ouvrage pourra vous attaquer ici. |
| n | *n* bases de l'Ouvrage pourront vous attaquer ici. |

⚠ **ZÉRO SE DIT, IL NE SE MASQUE PAS.** C'est souvent le renseignement exact que
le joueur cherche en fuyant ; taire la ligne le laisserait croire que le chiffre
n'a pas pu être calculé. `DÉ T6` l'exige en toutes lettres, et la falsification
F9 — zéro rend la chaîne vide — ne fait tomber que lui.

⚠ **« POURRONT », PAS « SONT À PORTÉE ».** Les deux ensembles ne coïncident pas :
il faut le TYPE et le NIVEAU MINIMAL en plus de la portée. Mesuré — `DÉ T3` : un
camp de niveau 30 et un avant-poste de niveau 40 à trois et quatre cases comptent
pour **ZÉRO**. `DÉ T2` : à niveau égal de portée, une base de niveau 9 ne compte
pas et une de niveau 10 compte.

⚠ **LA FONCTION EST PURE ET EXPORTÉE** parce que c'est la seule façon d'éprouver
le libellé sans monter l'écran, et parce qu'elle n'a rien à savoir de l'état : le
COMPTE vient du moteur, elle n'en fait qu'une phrase.

---

## 5. Les nombres relevés

Comptes d'attaquantes mesurés sur la graine 7, colonne 16 :

| rangée | attaquantes |
|---|---|
| 295 (départ) | **0** |
| 280 | **0** |
| 250 | 37 |
| 200 | 54 |
| 150 | 57 |
| 100 | 54 |
| 50 | 53 |
| 20 | 55 |

⚠ **LE ZÉRO DU DÉPART N'EST PAS UN DÉFAUT** : la garde du peuplement écarte les
bases de l'Ouvrage de quinze cases du départ, et `niveauMinimal` vaut 10. C'est
ce qui rend `DÉ T6` mesurable sur une partie neuve, et le montage l'asserte
avant de lire la phrase.

Frontière du niveau, mesurée : les rangées **248 à 252** rendent le niveau 10,
les rangées **253 à 257** le niveau 9. La frontière est donc atteignable dans un
même disque de rayon 10, ce qui rend le montage de `DÉ T2` possible.

---

## 6. Les tests — PASS/KO et le montage effectivement écrit

**Onze tests entrent, et le compte passe de 1 359 à 1 370.** Cinq de moteur dans
`test/deplacement.test.js`, six d'écran dans `test/monde.test.js` — `DÉ T7 bis`
n'était pas au brief et a été écrit après la mesure du §3.

| Code | Verdict | Montage effectivement écrit |
|---|---|---|
| **DÉ T1** | **PASS** | Balaie les graines 1 à 400 jusqu'à trouver une position portant une base de l'Ouvrage de niveau ≥ 10 **juste dedans** le disque et une **juste dehors mais dans le carré de balayage** ; rase toutes les autres ; asserte 1. Les deux bornes sont assertées avant de compter. |
| **DÉ T2** | **PASS** | Base du joueur en rangée 252 ; garde une attaquante de niveau ≥ 10 et une de niveau 9, toutes deux dans le disque ; rase le reste ; asserte 1. Le niveau 9 est asserté avant. |
| **DÉ T3** | **PASS** | Rase toutes les bases de l'Ouvrage à portée (asserte 0), puis pose un camp niveau 30 et un avant-poste niveau 40 comme satellites. Asserte que `ciblesAPortee` les VOIT (2 sites) et que leur niveau ne discrimine pas, puis asserte 0. |
| **DÉ T4** | **PASS** | Cent positions tirées, la base du joueur déplacée sur chacune ; compare `nombreDAttaquantes` au nombre de cases d'attaquante DISTINCTES de `basesAttaquantes`. Asserte ≥ 50 positions non nulles (86 mesurées). |
| **DÉ T5** | **PASS** | Deux bases du joueur ; le montage cherche une case libre d'attaquante, asserte qu'au moins une attaquante est partagée, puis asserte que le compte de la première position n'a pas bougé. |
| **DÉ T6** | **PASS** | Écran monté, mode armé, case atteignable touchée. Asserte 0 attaquante d'abord, puis la confirmation ouverte, la phrase exacte, le motif « aucune base », la longueur non nulle, la base non déplacée et `apresDeplacement` non appelé. |
| **DÉ T7** | **PASS** | Renonce ; compare la `serialiser` complète, la position, `apresDeplacement`, les deux `hidden`, puis mesure le désarmement par un toucher de plus qui doit ouvrir le panneau du site. |
| **DÉ T7 bis** | **PASS** | Touche, puis « Fermer », puis « Déplacer ici » : la base ne bouge pas. |
| **DÉ T8** | **PASS** | Accepte ; asserte la nouvelle position, `apresDeplacement`, les deux fermetures, et **`dernierDeplacementTick`** — la preuve qu'on est passé par `deplacerLaBase` et non par `poserLaBaseSur`. |
| **DÉ T9** | **PASS** | Consomme le délai par un premier déplacement, asserte `casesAtteignables` VIDE, vise une case à portée dont le refus est exactement `['delai']`, asserte qu'aucune confirmation ne s'ouvre et que le refus chiffré se dit. |
| **DÉ T10** | **PASS** | Balaie 300 graines jusqu'à trouver une base et une case atteignable aux comptes DIFFÉRENTS ; asserte la différence, puis que la phrase peinte est celle de la case visée et **pas** celle de la position actuelle. |

**Aucune assertion n'a été retirée ni assouplie.**

⚠ **UNE GARDE CHANGE DE SONDE ET SE RESSERRE** — `RCU T11`. Elle proxyait la
BASE et comptait les lectures de `.position` : depuis que `basesAttaquantes` lit
cette position elle-même pour la passer à `attaquantesDeLaPosition`,
`ciblesAPortee` reçoit un objet nu et la sonde ne voyait plus rien — **0 au lieu
de 1, mesuré**. La sonde porte désormais sur la **POSITION** et compte les
lectures de `rangee` faites DANS `ciblesAPortee`, c'est-à-dire sa ligne de
déstructuration : **elle mesure les ENTRÉES dans la fonction** plutôt qu'une
lecture que n'importe quel appelant pouvait faire à sa place. Et **une assertion
de source ENTRE** — les appels d'`attaquantesDeLaPosition` doivent rester trois
(sa déclaration, `basesAttaquantes`, `nombreDAttaquantes`) —, sans quoi un
second appel glissé dans la boucle intérieure doublerait le compte par la même
unique `ciblesAPortee`.

⚠ **LE FAUX DOCUMENT DE `monde.test.js` GAGNE QUATRE IDENTIFIANTS** —
`monde-panneau-confirmation`, `-menace`, `-confirmer`, `-renoncer` — et ils sont
**confrontés au balisage** par la boucle qui existait déjà : un identifiant que
`src/index.src.html` ne déclare pas fait LEVER le faux document.

---

## 7. Onze falsifications, onze chutes

| # | Falsification | Ce qui tombe |
|---|---|---|
| **F1** | Le filtre de TYPE retiré d'`attaquantesDeLaPosition` | **DÉ T3**, RAID-B T1, RCU T10 |
| **F2** | Le NIVEAU MINIMAL retiré | **DÉ T2**, **DÉ T6**, RAID-B T6, RCU T9 |
| **F3** | La portée cesse d'être un DISQUE (`estAPorteeDAttaque` retirée de `ciblesAPortee`) | **DÉ T1**, RCU T1, T2, T5, T7 |
| **F4** | `basesAttaquantes` reprend ses trois conditions, avec `<=` au lieu de `<` | **DÉ T4**, RAID-B T6, RCU T9, RCU T11 |
| **F5** | La confirmation retirée : le toucher déplace tout de suite | **DÉ T6, T7, T7 bis, T8, T10** |
| **F6** | L'écran annonce le compte de la position ACTUELLE | **DÉ T10** seul |
| **F7** | Renoncer ne désarme plus le mode | **DÉ T7** seul |
| **F8** | L'accord est demandé AVANT de regarder les refus | **DÉ T9** seul |
| **F9** | Zéro masque la ligne au lieu de la dire | **DÉ T6** seul |
| **F10** | `fermerPanneau` garde l'accord en attente | **DÉ T7 bis** seul |
| **F11** | `nombreDAttaquantes` recompte sur `ciblesAPortee` au lieu de dériver | **DÉ T2, T3, T4, T6**, RCU T11 |

**F4 est la falsification centrale du lot** : elle rejoue exactement la
divergence que §2 du brief décrit — deux écritures des trois conditions qui
diffèrent d'un signe —, et **`DÉ T4` la voit**. Cinq falsifications ne font
tomber qu'un seul test, ce qui est ce qu'on leur demande.

---

## 8. `SAVE_VERSION` ne bouge pas, et reste à 28 — vérifié au diff

`git diff src/sim/state.js` est **vide**. Pas un champ n'entre dans l'état : une
case retenue entre deux touchers vit dans la fermeture de l'écran, et
`attaquantesDeLaPosition` ne fait que LIRE.

---

## 9. Écarts et points en suspens

⚠ **ÉCART DÉCLARÉ : LE LOT N'EST PAS SUR SA PROPRE BRANCHE.** L'environnement
d'exécution épingle la session à `claude/foyer-zer0-patch-5lqyq8`. Les quatre
lots de la série sont donc quatre COMMITS distincts sur cette branche ;
celui-ci est le premier, et il se révoque par un `git revert` d'un seul commit.

⚠ **LE RENDU N'A PAS ÉTÉ VU SUR APPAREIL, ET SE DÉCLARE NON EXÉCUTÉ.** §3 de
`CLAUDE.md` : il n'y a pas de téléphone ici. Tout ce qui touche le DOM est mesuré
par le faux document de `monde.test.js`, qui monte l'écran et rejoue de vrais
évènements de pointeur — mais qui n'est pas un navigateur. **La hauteur du bloc
de confirmation dans le panneau n'a donc pas été relevée à l'écran.**

⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni un outil de la chaîne.

⚠ **AUCUNE VALEUR DE CALIBRAGE NE BOUGE.** `RAID_OUVRAGE.niveauMinimal`,
`chanceParMinute`, `GEOGRAPHIE.rayonAttaque` et `DEPLACEMENT` sont **lus, jamais
modifiés** — `git diff src/data/` est vide.

⚠ **LA RESTRICTION DE DÉPLACEMENT SOUS LE NIVEAU 5 N'A PAS ÉTÉ INVENTÉE**, comme
le §5 du brief l'exige : elle n'a jamais eu de règle écrite, et ce lot n'en écrit
aucune.

⚠ **LE RECENTRAGE APRÈS DÉPLACEMENT N'A PAS BOUGÉ** : `centrerSur` est appelée
dans `confirmerLeDeplacement` exactement là où elle l'était dans `poserLaBase`.

⚠ **LE PANNEAU RESTE OUVERT PENDANT LE MODE ARMÉ — RELEVÉ, NON CORRIGÉ.** C'est
le fait que `CARTE-C T14` a établi le 06/09 et qui n'a pas changé :
`armerLeDeplacement` ferme le panneau puis le rouvre pour y écrire son message.
La confirmation s'y ajoute sans déplacer ce comportement.

⚠⚠ **UN CAS N'EST PAS COUVERT PAR UN TEST, ET IL EST DÉCLARÉ : TOUCHER UNE
SECONDE CASE PENDANT QU'UNE CONFIRMATION EST OUVERTE.** Le mode reste armé, donc
`relacher` rappelle `demanderLeDeplacement` et la case retenue est REMPLACÉE —
le joueur peut re-viser sans renoncer. C'est le comportement retenu, et il est
utile ; mais le panneau couvrant la moitié basse de l'écran, il n'est
atteignable qu'en haut de la vue, et aucun montage ne le rejoue. **Ethan
tranche s'il préfère que la confirmation verrouille la visée.**
