# RAPPORT — lot VERROUS

**20/09/2026.** La base finale devient attaquable, et elle ne l'est qu'après ses
six verrous. Version produite : **0.99.71 · build 183**. Base de départ :
`31b40dc`, merge du lot SOUFFLE et de son cavalier RÉSERVE-RASAGE (PR #162).

Coût : **+1 349 octets**. Aucune ressource n'entre.

---

## 1. Base relevée avant travail

| Grandeur | Mesuré sur `31b40dc` |
|---|---|
| Version · build | 0.99.70 · 182 |
| Suite | **1650 déclarés · 1649 pass · 0 fail · 1 skipped** — VERTE |
| `dist/index.html` | 9 122 673 octets |
| `SAVE_VERSION` | 38 |

⚠ Le cavalier RÉSERVE-RASAGE a été greffé sur la PR SOUFFLE avant merge : le
livrable pèse **44 octets de moins** que ce que SOUFFLE seul rendait, et `PIC T7`
avait été réancré en conséquence. Ce lot part de la valeur fusionnée.

---

## 2. Ce que le lot pose

**Les six verrous.** Hexagone pointe en haut, rayon **12**, autour de la base
finale en (15, 16). Sommets : **(3,16) (9,26) (21,26) (27,16) (21,6) (9,6)**.
Chacun couvre **2 × 2** cases, la finale **3 × 3** — 33 cases en tout.

**La porte.** `problemesDuRaid` rend le refus `verrou-terminale` tant qu'il
reste un verrou debout. Six sur six, pas cinq : Ethan, 10/09 — « il faut d'abord
avoir rasé les six ».

**Le compteur ne se stocke pas.** `verrousDebout(etat)` se dérive de
`positionsDesVerrous()` et de `casesRasees(etat)`. Un champ
`verrousRases: 4` aurait été une seconde vérité à côté de `basesRasees`, et les
deux auraient divergé au premier maillon de migration oublié.

**Les sept sont passives.** `attaqueLeJoueur: false` — Q9. Et le câblage est
**gratuit** : `sim/raid-ouvrage.js` filtrait déjà sur ce champ, pas une de ses
lignes n'a changé. C'est le signe que la table était au bon endroit.

⚠ Elles tiennent quand même du **territoire** : `raisonDeLaForce` vaut 2, donc
une base de niveau 60 en vaut **1 024** de niveau 50. « Passif » qualifie le
raid, pas l'influence.

---

## 3. Le rayon : les deux bouts de la fourchette sont morts à la mesure

Ethan avait dicté « entre dix et quinze cases ». Ni l'un ni l'autre ne tient.

**À 15**, le sommet du haut tombe **rangée 0** — hors carte.
`empriseDeLaGrosseBase` lève, et une levée dans la boucle de dessin vide tout
l'écran Monde. Ce n'est pas un réglage de goût, c'est une borne.

**À 10**, la ligne des verrous **se contourne**. Le cercle inscrit d'un hexagone
de rayon `R` vaut `R × cos 30°` : **8,66 à R = 10**, sous le rayon d'attaque de
10. Mesuré : **76 des 317 cases** d'où la finale est atteignable sont alors
*hors* de l'hexagone — le joueur frappe le centre sans franchir la ligne qu'il
vient d'ouvrir.

**À 12**, l'inscrit vaut **10,392** et il n'en reste **aucune**.

### ⚠⚠ Le premier jet avait écrit la mauvaise propriété — son propre test l'a fait tomber

Le commentaire de `GEOGRAPHIE.verrous` affirmait d'abord :

> « À 12, aucune case de la carte ne porte les deux à la fois. »

**C'est faux : il y en a 308.** Et il ne peut pas en être autrement — deux
disques de rayon 10 dont les centres sont à 12 se recoupent largement ; il aurait
fallu écarter les verrous de plus de vingt cases, ce que la carte ne permet pas.

`VERROU T2` a refusé l'affirmation avant qu'elle n'entre au dépôt. Le commentaire
porte désormais la propriété qui tient — celle du cercle inscrit — **et la
fausse, nommée comme telle**, pour qu'un lot futur ne la réécrive pas.

C'est le seul endroit du lot où une affirmation non mesurée a failli passer.

---

## 4. Le niveau 60 — sept bornes ouvertes, deux fermées

Arbitrage **Q8 : « B »**. `niveauPlafond` reste **50** ;
`GEOGRAPHIE.niveauDeLaBaseFinale` vaut **60**, et `NIVEAU_MAXIMAL_DUN_SITE` s'en
dérive. L'option écartée — porter le plafond à 60 — déplaçait le niveau de
**toutes** les rangées hautes, donc celui de toutes les bases procédurales des
sauvegardes existantes.

| Borne | Fichier | Ouverte ? |
|---|---|---|
| `palierDeNiveau` | `data/sites.js` | **oui** |
| `creerCombat` | `sim/combat.js` | **oui** |
| validation d'entité | `sim/combat.js` | **oui** |
| `facteurMilli` | `sim/combat.js` | **oui** |
| `genererSite` | `sim/generateur.js` | **oui** |
| `genererVague` | `sim/generateur.js` | **oui** |
| niveau d'une ruine | `sim/ruines.js` | **oui** |
| bâtiment d'un site | `sim/disposition.js` | **oui** |
| `budgetAssaut` | `sim/generateur.js` | **non** — le joueur |
| `genererAssaut` | `sim/generateur.js` | **non** — le joueur |
| Chantier du joueur | `sim/disposition.js` | **non** — le joueur |

Chacune cite la constante, aucune n'élargit « au cas où ».

⚠ **Elles ont été trouvées une par une, en jouant le combat.** La liste n'était
pas devinée : `montageDuSite` puis `creerCombat` sur la base finale ont levé
quatre fois de suite, la dernière sur *« défenseur « faucheuse » en (10, 1) —
niveau 60 hors de 1…50 »*.

### `verifierArithmetique` monte à 60, et elle tient

Le garde-fou assertait au plafond de carte. Il asserte désormais au niveau de la
finale — sans quoi il serait resté vert pendant que le seul combat qu'il devait
surveiller débordait.

**60 × 3 487 954 433 × 1 200 = 251 132 719 176 000**, contre
9 007 199 254 740 991 pour l'entier sûr : **35,9 fois de marge**, contre 318 au
niveau 50. La marge se divise par neuf et reste large.

---

## 5. `densiteComme` — deux `=== 'base'` deviennent une donnée

`sim/generateur.js` portait deux `type === 'base'` écrits en dur. Tenables tant
qu'il n'y avait qu'une sorte de base ; il y en a trois.

`TYPES_SITE[x].densiteComme` nomme la colonne empruntée, et sa **présence** vaut
aussi « majoré de `DENSITE.facteurBase` » — la phrase de la §8 de la spec, « base
= avant-poste de même niveau + 10 % ».

Vérifié : **comportement inchangé au nombre près** pour les trois types
existants.

| Type | niveau 50 |
|---|---|
| camp | 25 / 25 |
| avantPoste | 35 / 35 |
| base | 39 / 39 |
| baseVerrou | 39 / 39 |
| baseTerminale (n60) | 39 / 39 |

⚠ **La finale a les mêmes effectifs qu'un verrou** — `DENSITE.parNiveau` s'arrête
à 50 et `encadrer` borne au dernier palier. Ce qui les sépare est la force de
chaque unité : `facteurEconomiqueMilli` passe de 480 941 681 à **7 723 812 617**,
soit **×16,06**. C'est un fait d'équilibrage, signalé et non arbitré ici.

---

## 6. `empriseDeLaGrosseBase` monte dans `sim/` — le fichier avait écrit sa propre condition

`sim/poi.js` portait ceci depuis le 31/08 :

> « Il n'y a pas de cycle aujourd'hui — `render/embleme.js` ne lit rien de
> `sim/` —, mais le jour où il en lirait, c'est CETTE ligne qu'il faudra
> défaire, en montant la géométrie dans `sim/` plutôt qu'en recopiant le
> décalage. »

Ce lot est ce jour-là : `poi.js`, `peuplement.js` et `site-de-la-case.js` ont
tous les trois besoin de savoir quelles cases une grosse base couvre.

La fonction vit dans `sim/carte.js`. **`render/embleme.js` la réexporte** : aucun
import du dépôt ne change, aucun test n'a eu à être déplacé. Ce qui change est la
direction — `render/` lit `sim/`, comme `render/terrain.js` le fait déjà.

`SPRITES_GROSSE_BASE` reste dans `render/` : quel dessin porte une grosse base
est une question de rendu, quelles cases elle couvre une question de carte.

---

## 7. L'exclusion du peuplement — une première pour le dépôt

`estCandidate` refuse les 33 cases des sept emprises. Sans quoi `siteDeLaCase`
rendrait deux sites pour une même case.

⚠ Elle est dans `estCandidate`, **pas** dans `estBaseOuvrage` : une case exclue
doit cesser d'être *candidate*, sans quoi elle continuerait de dominer le hachage
de ses huit voisines et creuserait un trou de neuf cases au lieu d'une.

**C'est la première fois que le dépôt déplace des bases sur des cartes
existantes.** Le lot POI s'y était explicitement interdit, et `POI T5` mesurait
cette abstinence.

### `POI T5` est retourné, pas supprimé

| | Avant | Après |
|---|---|---|
| Propriété | « aucune base ne bouge » | « **seules** les cases des sept emprises bougent » |
| Mesure | six comptes | six comptes **+ case par case sur la carte entière** |

La propriété resserrée est **plus forte** : un total identique pourrait cacher
une base déplacée à l'autre bout du couloir ; l'assertion case par case, non.

Comptes remesurés : **1590→1586, 1588→1584, 1581→1576, 1569→1568, 1571→1566,
1572→1569**, avec une contre-assertion `notEqual` sur chaque ancienne valeur.

Impact mesuré sur 60 graines, rangées 1-30 : **168,08 → 164,90 bases**, soit
**−3,18 par carte** pour 33 cases exclues — la règle de non-contact libère de la
place autour, et le tirage en reprend une partie ailleurs.

⚠ `EUCLIDE T5 ter` compare la récursion locale à une passe globale
réimplémentée dans le test : l'exclusion a été ajoutée **des deux côtés**, en la
lisant de `sim/carte.js`. Sans quoi la comparaison serait tombée sur une
différence voulue.

---

## 8. `SAVE_VERSION` 38 → 39, et le maillon n'est pas décoratif

Aucun champ n'entre dans l'état. Ce qui change est la **carte**.

Une partie d'avant le lot peut porter dans `basesRasees` une case tombée sous une
emprise — le joueur y avait rasé une base quand elle existait. Or `siteDeLaCase`
interroge `casesRasees` **avant** de rendre une grosse base : cette case rendrait
`null` là où le jeu doit rendre un verrou.

**Conséquence sans le maillon : une base finale à jamais inattaquable**, un trou
au bout de la carte, et aucune ligne pour l'expliquer. C'est exactement la panne
muette que ce genre de maillon existe pour éviter.

Le maillon retire ces ruines-là, **et elles seules** : une base rasée ailleurs
reste rasée. Le lot ne rend au joueur aucune conquête qu'il a faite.

---

## 9. Deux défauts de conception attrapés par les tests

**Le verrou sortait en rouge.** Je lui avais donné le bord `#E43E32` — « il se
laisse attaquer comme une base ». Or ce rouge désigne **exactement** ce qui
attaque le joueur, et `monde.test.js` asserte l'égalité des deux ensembles. Un
verrou est `attaqueLeJoueur: false` : le peindre en rouge annonçait une menace
qu'il n'exerce pas. Il porte le bord de la base finale, dont il est l'avant-poste.

**`MODE-DEV T1` cachait un piège de montage.** Il partait de `SAVE_VERSION - 1`
pour mesurer le maillon 37 → 38. Le raccourci était juste tant que MODE-DEV était
le dernier lot ; à 39 il désignait 38, et le maillon mesuré **n'était plus
traversé du tout**. Le test annonçait que la migration n'éteint pas le mode,
alors qu'elle n'était jamais appelée. Il épingle désormais **37**, le maillon
qu'il mesure — et traverse au passage tous les maillons postérieurs, ce qui est
une garde de plus.

---

## 10. Tests

**Sept tests neufs**, dans `test/verrous.test.js` — le lot crée une notion, donc
un fichier. `test/` passe de 78 à **79** ; `CLAUDE.md` §2 le nomme.

| | Ce qu'il garde |
|---|---|
| `VERROU T1` | les sept sont des bases, passives, aucune ne respawne ; `TYPES_DE_BASE` se dérive |
| `VERROU T2` | les six sommets figés, et **pourquoi ni 10 ni 15** — la mesure du cercle inscrit |
| `VERROU T3` | 33 cases couvertes, **aucune base procédurale dessous** sur 10 graines |
| `VERROU T4` | les 9 cases de la finale rendent **un** site, pas neuf |
| `VERROU T5` | la porte : 6 sur 6, et cinq ne suffisent pas |
| `VERROU T6` | les sept se composent et se combattent — sept bornes traversées d'un coup |
| `VERROU T7` | la v39 retire les ruines sous emprise, **et elles seules** |

### Six falsifications, six chutes

| Falsification | Verdict |
|---|---|
| rayon ramené à 10 | **tombe** (`T2`) |
| verrou rendu attaquant | **tombe** (`T1`) |
| exclusion du peuplement retirée | **tombe** (`T3`) |
| porte devenue jauge — 5 sur 6 ouvrirait | **tombe** (`T5`) |
| migration qui ne nettoie plus | **tombe** (`T7`) |
| chaque case rendant SA position | **tombe** (`T4`) |

Chacune appliquée, mesurée, puis défaite ; retour à 7 pass / 0 fail après
restauration.

### Treize tests réancrés, aucun assoupli

`POI T5`, `EUCLIDE T5 ter`, `T15` (combat), `§7` (générateur), `FOND T8`,
`RAID-B T6`, `RCU T10`, `MODE-DEV T1`, `PIC T7`, quatre d'emblème dans
`monde.test.js`, et les six épingles de `SAVE_VERSION`.

⚠ Deux méritent un mot :

- **`T15`** gagne un **témoin inverse** — un montage qui doit *passer*, le niveau
  de la base finale. Sans lui, remettre la borne à 50 aurait laissé ce test vert
  (le cas hors-bornes lèverait toujours) et rendu la finale injouable en silence.
- **`RCU T10`** exigeait que *tous* les types non attaquants soient à portée du
  montage. Impossible pour des sites fixes du bout de carte. Le discriminant
  devient `respawn` — un satellite suit le joueur, une base ne réapparaît
  jamais — plutôt qu'une liste de noms.

---

## 11. Coût et verdict

| Poste | Avant | Après | Écart |
|---|---|---|---|
| images | 7 396 133 | 7 395 405 | **−728** |
| JavaScript | 436 982 | 439 059 | **+2 077** |
| feuille | 48 043 | 48 043 | +0 |
| balisage | 38 429 | 38 429 | +0 |
| audio | 1 203 086 | 1 203 086 | +0 |
| **TOTAL** | **9 122 673** | **9 124 022** | **+1 349** |

Partition exacte des deux côtés — **écart 0 · 0** — et **306 URI / 307 lignes
`data:`** de part et d'autre.

⚠ **Les images baissent alors que le lot ajoute une notion** : la 2 × 2 est
remplacée par la planche d'Ethan du 10/09 (Q2), et le dessin neuf se comprime
mieux — 18 684 → 18 136 octets en 128, 6 496 → 6 448 en 64. **Le lot ne fait
entrer aucune ressource** : les six verrous se dessinent avec la 2 × 2 qui
dormait au dépôt depuis le 30/08.

**Borne T10 : 9 700 000, non touchée.** Marge **575 978 octets, 5,94 %**. C'est
au lot de la grille longue de la relever — c'est lui qui fait entrer les fonds.

### Verdict

- `npm run check` : **0**.
- `npm test` : **1657 déclarés · 1656 pass · 0 fail · 1 skipped**
  (`LIMITE T8`, suspendu par Ethan le 08/09).
- `tools/verifier.py --outil emblemes` : **271 identiques · 0 différents · 0
  nouveaux**, après le remplacement de la 2 × 2.
- `tools/atlas.py --verifier` : **17 identiques · 3 différents** — les trois
  ÉCARTs préexistants, laissés où le lot les a trouvés.
- `dist/index.html` : **9 124 022 octets**, 0 référence externe.

⚠ `verifier.py` **sans `--outil`** sort toujours en rouge — 176 sprites de
`bâtiment`, `defense`, `socle` et `chassis`. C'est le constat du lot SOUFFLE,
préexistant et mesuré sur `main` pristine : la famille `carte` est intacte.
Cause probable : Pillow 12.2.0 dans ce conteneur. **À vérifier sur la machine
d'Ethan.**

---

## 12. Ce qui reste ouvert

**La grille longue.** La base finale impose 9 × 27 rangées — bandes **2 / 16 /
9**, défense doublée à **78** — et trois fonds de 1080 × 3240. Elle rend `GRILLE`
variable : **31 lectures de `GRILLE.longueur` dans 8 fichiers**, `GRILLE.bandes`
dans 12. C'est le lot suivant, et c'est lui qui relèvera T10 vers **10 770 000**.

⚠ Le doublement des défenses **appartient à ce lot-là, pas à celui-ci** : 78
défenses ne tiennent pas sur 72 cases, et **aucune garde du générateur ne le
dirait** — le placement déborderait en silence. Le lot de la grille longue doit
poser cette garde manquante.

**Les états d'avarie des grosses bases.** Les six planches du ZIP d'Ethan
(`abimee`, `tres_abimee`, `ruine`, en 2 × 2 et 3 × 3) ne sont pas entrées. Aujourd'hui
un verrou entamé se dessine comme un verrou intact. C'est le lot AVARIES, indépendant
des deux autres.

**La récompense de la victoire.** Le jeu n'a pas de fin aujourd'hui ; raser la
base finale en est une. Sujet entier, non ouvert.

**Le plafond de la réserve**, signalé par le cavalier RÉSERVE-RASAGE et non
repris ici.

---

## 13. Amendement à l'ouverture de la PR — un bloc mort retiré

Relu en lecteur adverse avant d'ouvrir la PR : `executerRaid` portait un
**second** bloc `verrou-terminale`, copie conforme de celui de `problemesDuRaid`
— commentaire compris —, qui poussait dans `problemes` **après** le `throw` qui
lève sur cette liste. Personne ne lisait ce `push` : `problemes` n'a plus aucun
lecteur dans la fonction après la levée (vérifié ligne par ligne, 665 → 834). Le
commentaire laissait pourtant croire que la fonction revérifiait le verrou.

Retiré, et remplacé par trois lignes qui disent où la porte vit. **Rien ne change
au comportement** : `executerRaid` consulte `problemesDuRaid` en tête et lève
dessus, `VERROU T5` et les 1 657 sont verts des deux côtés. Ce qui change est
le livrable — `esbuild` ne peut pas élaguer un `push` — : **9 124 022 →
9 123 813, −209 octets**, coût du lot ramené de +1 349 à **+1 140** (JavaScript
+1 868, images −728). `PIC T7` réancré, contre-assertion `notEqual 575_978`
ajoutée, `CLAUDE.md` §0 amendé sous le bloc de ce lot.

Vérifié sur cette machine avant de greffer quoi que ce soit : le patch
s'applique par `git am` sur `31b40dc` (`--check` sortie 0), les 33 fichiers du
zip sont identiques à l'octet à l'arbre, zéro CRLF ; `verifier.py --outil
emblemes` rend 5 identiques · 266 différents à l'octet (Pillow 12.3 contre 12.2,
le bruit d'encodeur déjà mesuré à SOUFFLE), rejoué sous `FZ_SPRITES` et comparé
en RVBA : **266 identiques au pixel, 0 différent**, et **les deux
`base_o_2x2.webp` neufs sont dans les cinq identiques à l'octet** — la 2 × 2 du
10/09 se conditionne ici exactement comme dans le conteneur.
