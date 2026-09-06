# RAPPORT — lot CHANTIER-FICHES

Retours d'Ethan du 06/09, **points 18, 19 et 20**.

---

## 0. Base de départ — ÉCART AU BRIEF, DÉCLARÉ, ET IL EST BÉNIN

| | attendu par le brief | mesuré au départ |
|---|---|---|
| `npm test` | 1135 pass / 0 fail | **1139 pass / 0 fail** |
| `dist/index.html` | 7 987 956 octets | **7 987 821 octets** |
| version · build | 0.99.2 · 103 | **0.99.3 · 104** |

Le lot **CARTE-B a été mergé entre l'écriture du brief et son exécution** (PR #93,
06/09 à 09:39). Ce n'est pas un point d'arrêt : **les sept faits dont ce lot
dépend étaient intacts**, vérifiés un par un avant d'écrire une ligne —

- les **deux** `formaterCout(apercu.cout)`, aux lignes 1390 et 1463 ;
- `noteDuRefus`, appelée une seule fois, côté bâtiment ;
- le terme `capsAvant[cle] !== 0` du filtre des capacités ;
- la branche `emplacements: def.role === 'central' ? … : null` ;
- les **sept** `unique: true` de `src/data/base.js`.

CARTE-B ne touchait que `src/ui/monde.js`. Signalé plutôt que traité comme un
arrêt — même situation que le lot BARÈME.

---

## 1. Ce qui a été produit

**Version 0.99.4 · build 105**, bumpés ENSEMBLE et tous deux **chaînes JSON** —
vérifié par `typeof` après écriture (`"0.99.4"`, `"105"`).
`android/app/build.gradle.kts` les lit `as String` ; un nombre y ferait tomber le
build Android à la configuration, et aucun test JS ne le verrait.

| | avant | après | delta |
|---|---|---|---|
| `npm test` | 1139 pass / 0 fail | **1148 pass / 0 fail** | +9 |
| `dist/index.html` | 7 987 821 | **7 988 857** | **+1 036** |
| références externes | 0 | **0** | — |

**Coût entièrement du JavaScript**, mesuré poste par poste contre un livrable
rebâti depuis l'arbre d'avant (`git stash` sur le seul fichier de `src/` touché) :

| poste | delta |
|---|---|
| JavaScript | **+1 036** |
| feuille · balisage · images · audio | **+0** chacun |

**296 lignes `data:` avant, 296 après ; 291 URI de part et d'autre.** Borne T10
inchangée à 9 300 000, marge **1 311 143 octets, 14,10 %**.

**Un seul fichier de `src/` est touché : `src/ui/chantier.js`.**

---

## 2. Point 18 — le coût complet survit au refus

C'était un **ou exclusif** : dès qu'un problème existait, `formaterCout` cédait la
place au seul manque. Le joueur à qui il manquait huit quartz apprenait combien il
lui en manquait et **perdait de vue ce que le palier coûte en entier** — or c'est
ce second nombre qui lui dit s'il attend une minute ou s'il renonce.

### Les DEUX points d'appel sont traités

`formaterCout(apercu.cout)` apparaissait **deux fois** : le panneau d'un
**bâtiment** (peint par `lignesDuPanneau`) et celui d'une **pièce** (peint par
`lignesDeLaPiece`). Les deux sont corrigés.

Les deux refus ne se composent pas de la même façon, et c'est pourquoi la
composition est passée au point d'appel plutôt que dans une fonction unique : le
bâtiment passe par `noteDuRefus` (qui ajoute le délai), la pièce par la liste des
messages du moteur — un aperçu de pièce ne porte pas de `delai`.

**`CH-F T3` est le test qui attrape un lot qui n'en aurait corrigé qu'un.** La
falsification qui ne défait que la moitié PIÈCE ne fait tomber que lui.

### `noteDuRefus` n'a pas bougé d'un caractère

Un composeur neuf, `noteDuBouton`, coud le coût au refus. Il reçoit un refus
**déjà composé** et ne lit jamais `apercu.problemes` : lui faire relire les
problèmes en aurait fait une **troisième** écriture de la règle dans un fichier
qui en porte deux.

### Le plafond ne change pas

`apercu.auPlafond` rend `cout: null`, et le bouton garde sa note **vide**. Il n'y
a pas de prix pour un palier qui n'existe pas, et « rien » ou « 0 » s'y lirait
gratuit. `CH-F T2` le tient, et la falsification qui compose un coût au plafond
fait tomber ce test **et** une garde préexistante.

---

## 3. Point 19 — le stockage ne s'affiche plus partout

Le filtre portait `capsAvant[cle] !== 0`, **vrai pour toute base possédant le
moindre stockage, quel que soit le bâtiment sélectionné** : une Centrale, une
Caserne, un QG ouvraient tous « Stockage de la base » sur des nombres que les
améliorer ne bouge pas d'une unité.

Le terme est retiré. Le filtre devient : une ressource ne s'affiche que si
**améliorer ce bâtiment change sa capacité**.

### Le commentaire réécrit, cité

Il annonçait la bonne règle et se contredisait dans la même phrase — « ne se
filtrent que sur ce qui CHANGE **ou ce qui n'est pas nul** ». Réécrit dans le même
geste :

> ⚠⚠ LES CAPACITÉS NE SE FILTRENT QUE SUR CE QUI CHANGE — 06/09, ET LE TERME QUI
> VIENT DE PARTIR FAISAIT APPARAÎTRE LA SECTION PARTOUT. […] Le filtre portait
> aussi `capsAvant[cle] !== 0`, qui est vrai pour toute base possédant le moindre
> stockage, QUEL QUE SOIT le bâtiment sélectionné […]
>
> ⚠ ET LE COMMENTAIRE D'AVANT ANNONÇAIT DÉJÀ LA BONNE RÈGLE […] : c'est la seconde
> moitié qui était de trop, et elle contredisait la phrase qui la portait.
>
> ⚠ CONSÉQUENCE VOULUE : sur un bâtiment qui ne stocke rien, la liste est VIDE et
> la section entière disparaît — `lignesDuPanneau` teste déjà cette longueur.

### Le titre et les nombres ne bougent pas

« Stockage **de la base** », et l'`avant` reste `capacitesMilli` de la disposition
ENTIÈRE. Ce que le lot change est **quand** la section apparaît, jamais **ce**
qu'elle annonce. `delai.cause === 'capacite'` lit `capacitesMilli` de son côté et
ne passe pas par ce filtre : il n'est pas touché.

---

## 4. Point 20 — LE RELEVÉ, bâtiment par bâtiment

**Fait avant d'écrire une ligne d'écran.** Chaque effet est lu dans le module qui
le porte ; aucun n'est paraphrasé.

| bâtiment | fonction lectrice | fichier | grandeur affichée |
|---|---|---|---|
| **Chantier de construction** | `emplacementsDuNiveau` | `src/data/base.js` | emplacements ouverts — **déjà affiché, non touché** |
| **Centre de commandement** | `niveauDeCommandementDeLaBase(base, 'armee')` | `src/sim/state.js` | ① budget de points d'assaut, via `budgetDuNiveau` de `src/ui/arsenal.js` — `POINTS_ARMEE.offense.batiment` de `src/data/sites.js` le nomme ; ② niveau maximum des pièces, refusé sous le code `plafond-commandement` par `problemesDeLAmeliorationDUnePiece` (`src/sim/state.js`) |
| **QG de défense** | `niveauDeCommandementDeLaBase(base, 'garnison')` | `src/sim/state.js` | ① budget de points de garnison, via `budgetDuNiveau` de `src/ui/defense.js` — `POINTS_ARMEE.defense.batiment` le nomme ; ② même plafond de niveau |
| **Complexe de défense** | `complexeDeLaBase` puis `ticksDeRetour` | `src/sim/reparation.js` | temps de retour d'une défense de niveau `NIVEAU.plafond` — `RETOUR_DEFENSES.indexeeSur` de `src/data/base.js` le nomme |
| **Caserne** | `batimentDuChassis` puis `diviseurDuBatiment` | `src/sim/reparation.js` | diviseur du temps de réparation · infanterie |
| **Dépôt de véhicules** | idem | `src/sim/reparation.js` | idem · véhicule |
| **Aérodrome** | idem | `src/sim/reparation.js` | idem · avion |

⚠ **Le brief nomme le quatrième « Complexe de réparation ».** Le dépôt l'appelle
**Complexe de défense** (`complexeDeDefense`, `role: 'reparation'`) — c'est la
clé et le nom joueur qui font foi.

⚠ **Aucun effet n'a été laissé de côté faute de lecteur.** Les six sont lisibles,
donc la mention « effet non trouvé, non affiché » ne s'applique à aucun.

⚠ **Le niveau d'un bâtiment de production ne fait QUE décoter la réparation**, et
c'est le module qui le dit, pas moi : « le niveau du bâtiment rend les réparations
MOINS CHÈRES — `diviseurDuBatiment` —, et c'est son SEUL effet ». La **présence**
seule, et non le niveau, gouverne la construction (`batimentDeProductionManquant`).

### Ce qui a été écrit

Une section « Ce qu'il commande », à la forme existante `{ libelle, avant, apres }` :
**`peindrePanneau` n'apprend aucune structure nouvelle**, et `CH-F T7` compare les
clés d'une ligne à cette forme exacte.

`apercuDuBatiment` rend des **nombres** et une `forme` ; `lignesDuPanneau`
formate. Les trois formes — entier, durée en ticks, diviseur — empruntent chacune
un formateur qui existe déjà ; `direLaDuree` n'est pas réécrite.

### Deux décisions à signaler

**① La pièce de référence du Complexe est celle du plafond, et c'est le seul point
de comparaison qui ne s'invente pas.** Le retour d'une défense dépend du
**dépassement** entre son niveau et celui du Complexe : il n'existe **aucune durée
qui soit fonction du seul Complexe**. Le haut de la table donne le pire cas, qui
est aussi le levier — c'est la mesure que `CLAUDE.md` porte déjà (« pièce de niveau
50 sous un Complexe 10 → 45,3 h »). Relevé : **106,7 h → 97,0 h** en montant le
Complexe du niveau 1 au 2.

Et c'est **`NIVEAU.plafond`, pas `GEOGRAPHIE.niveauPlafond`**. Les deux valent 50,
et ce n'est pas une coquetterie : `ticksDeRetour` **lève** quand `1 + dépassement`
sort de `NIVEAU`, si bien que prendre l'autre plafond ferait tomber **tout le
panneau** le jour où les deux divergeraient. Avec celui-ci la borne tient par
construction, le niveau du Complexe valant au moins 1.

**② Les deux QG portent DEUX lignes, pas une.** Le même niveau commande le budget
**et** le plafond de niveau des pièces, et les deux sont lus dans `src/sim/`. Le
second n'est pas le titre du panneau : celui-ci dit « niv. 3 » du **bâtiment**, la
ligne dit jusqu'où montent les **pièces** — une règle que rien n'annonçait avant
qu'un refus ne l'apprenne au joueur.

⚠ **La santé du Complexe se relit sur la disposition CANDIDATE.** Monter le
Complexe augmente ses PV maximaux sans réparer un seul dégât : sa santé en
millièmes monte donc toute seule, et lire l'avant des deux côtés annoncerait un
retour plus lent qu'il ne sera. Un Complexe à zéro PV rend `santeMilli: null`,
c'est-à-dire « rien ne revient, jamais » — la ligne se dit alors sans nombre.

⚠ **Le mot du châssis vient de `FAMILLE_DE_CHASSIS`** — « infanterie »,
« véhicule », « avion », les mots d'Ethan du 29/08. En écrire une seconde table
serait la seconde vérité que §4 interdit.

⚠ **Le Chantier garde « Emplacements ouverts » et n'en gagne pas une seconde.**

---

## 5. Les tests — T1 à T9, et le montage effectivement écrit

**Aucune coordonnée n'est écrite dans le montage** : les cases se **demandent** à
`problemesDeLaPose`. Un montage qui écrit « rangée 11, colonne 3 » ne garde que
lui-même et tombe le jour où le tirage met un champ ou un obstacle dessous — le
dépôt l'a payé cinq fois.

| Code | Verdict | Montage effectivement écrit |
|---|---|---|
| **CH-F T1** | **PASS** | Base des sept uniques, **poche à sec** — sans quoi aucun problème n'existe et le test serait vert sans rien mesurer. Asserte que la note contient **le coût complet ET chacun des messages du moteur**, puis que prix et refus sont deux textes **différents** (sinon une note ne portant que l'un passerait). Vérifie enfin l'autre moitié : sans problème, la note est le seul prix. |
| **CH-F T2** | **PASS** | Bâtiment porté à `GEOGRAPHIE.niveauPlafond` : `auPlafond`, `cout === null`, `niveauVise === null`, **note vide**, bouton impossible. Vérifie en plus qu'un UNIQUE au plafond ne promet aucun `apres` dans sa section d'effet. |
| **CH-F T3** | **PASS** | Le même refus **sur un bâtiment et sur une pièce**, chacun par **son propre peintre** — `lignesDuPanneau` et `lignesDeLaPiece`. Asserte que les deux aperçus et les deux peintres sont bien quatre fonctions distinctes, sans quoi le test ne mesurerait qu'une ligne là où le fichier en portait deux. |
| **CH-F T4** | **PASS** | Base **avec** du stockage ailleurs — asserté d'abord, faute de quoi une base sans stockage rendrait un tableau vide de toute façon et le test passerait sur le code d'avant. Quatre bâtiments qui ne stockent rien : `capacites.length === 0` et la section absente du panneau. |
| **CH-F T5** | **PASS** | Les stockeurs se **demandent à la table** (`role: 'stockage'`), ils ne sont pas écrits à la main : un quatrième entrerait tout seul. Chaque ressource listée a un `apres` **différent** de son `avant`. |
| **CH-F T6** | **PASS** | `avantMilli === capacitesMilli(disposition)[cle]` de la base entière. Discrimine : la base entière stocke **strictement plus** que le seul bâtiment regardé — sans cet écart, lire la capacité propre rendrait le même nombre. |
| **CH-F T7** | **PASS** | Les **six** balayés — un test sur un seul en laisserait cinq. Chaque effet a un libellé et une valeur, et la section atteint le panneau à la forme exacte `{libelle, avant, apres}`. La liste des six se **dérive** de `unique: true` moins le rôle `central` : un huitième unique fait tomber le test. |
| **CH-F T8** | **PASS** | Deux montages, les six montés au niveau 12 dans l'un, et la **valeur** doit différer. C'est le test qui distingue un effet **lu** d'un libellé plausible écrit en dur. |
| **CH-F T9** | **PASS** | Centrale, raffinerie, accumulateur : `effets === []` et pas de section. Et le Chantier garde « Emplacements ouverts » **sans** gagner celle-ci. |

### Huit falsifications, huit chutes

| # | Falsification | Ce qui tombe |
|---|---|---|
| 1 | le refus chasse le coût (bâtiment) | **T1**, **T3** |
| 2 | le refus chasse le coût **côté PIÈCE seulement** | **T3** seul |
| 3 | le plafond compose un coût | **T2** + une garde préexistante |
| 4 | `capsAvant[cle] !== 0` remis au filtre | **T4**, **T5** |
| 5 | la capacité **propre** lue au lieu de celle de la base | **T4**, **T6** + une garde préexistante |
| 6 | la section retirée aux six | **T2**, **T7**, **T8** |
| 7 | l'effet écrit en dur (`avant: 1, apres: 2`) | **T8** seul |
| 8 | la section ouverte à **tout** bâtiment | **T9** seul |

La deuxième est celle qui compte : c'est le lot à moitié fait, et seul `T3`
l'attrape.

### Deux montages ont dû être corrigés avant de mordre — les deux dits par un test

**① Le montage vidait `economie.stocks`, un champ qui n'existe pas.** Le vrai est
`economie.ressources`. Rien n'a bronché parce que **poser est gratuit au niveau
1** : une base sans le sou se construisait quand même. C'est `CH-F T1` qui l'a
dit, en ne trouvant aucun refus là où il en attendait un.

**② `CH-F T9` testait `unique === undefined`.** La table écrit `unique: false` sur
les onze : l'assertion passait pour une garde et n'en était pas.

### Aucune assertion retirée, aucune garde à changer de cible

Les deux gardes préexistantes qui tombent sous falsification — « au plafond, tout
le volet après vaut null » et « le si j'améliorais se calcule avec les mêmes
fonctions » — **faisaient leur travail et sont restées telles quelles**.

---

## 6. Ce qui n'a pas été fait, et c'était conforme

- **`src/sim/` : pas une ligne.** Les six effets étaient tous lisibles sans y
  toucher, donc le point d'arrêt du brief n'a pas été atteint.
- **`src/data/base.js` : aucune valeur de calibrage.**
- **`peindrePanneau` : aucune structure nouvelle.**
- **Les modes armés, le voisinage, les débits, l'apport unitaire : intouchés.**
- **`SAVE_VERSION` reste à 26** : `effets` ne traverse ni `serialiser` ni une
  migration.
- **`python3 tools/verifier.py` n'a pas été lancé** : le lot ne touche ni `art/`,
  ni un outil de la chaîne.
- **Aucun relevé sur appareil.** Le dépôt n'a ni jsdom ni navigateur, et un test
  appareil non exécuté se déclare non exécuté (§3). Les valeurs ont été relevées
  par une sonde en Node sur une vraie base ; ce qu'elles **donnent à l'œil** dans
  le panneau reste à regarder sur le téléphone.

---

## 7. Points restés en suspens

1. **La durée du Complexe se lit « 106.7 h », avec un POINT décimal.** C'est
   `direLaDuree` qui l'écrit ainsi, et elle est partagée avec la réserve de
   réparation depuis le lot RÉSERVE-BASE : la corriger ici en virgule française
   ferait diverger les deux affichages. **À reprendre pour les deux ensemble, ou
   pas du tout.**
2. **La pièce de référence du Complexe est le niveau 50.** C'est le pire cas et le
   levier ; un joueur dont la garnison est au niveau 3 lira un nombre qui ne le
   concerne pas encore. L'alternative — la pièce la plus haute de sa propre
   garnison — rendrait un nombre plus proche mais sauterait quand la garnison
   change. **Ethan tranche ; c'est une ligne.**
3. **Les deux QG portent deux lignes.** Si Ethan ne veut que le budget, la seconde
   se retire d'une ligne.
