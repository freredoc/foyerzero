# Rapport — lot PANNEAUX-DE-LA-CARTE

**08/09/2026** · branche `claude/new-session-qqvfgw` · base `566a453`
(fusion de la PR #116, lot SOL-OUVRAGE) · version produite **0.99.36 · build 138**.

Trois retours d'Ethan du 08/09, tous sur l'écran de la carte :

- **point 5** — « lorsqu'on déplace une base, faire une simulation de territoire » ;
- **point 6** — « rajouter un toast quand on possède un POI » ;
- **point 10** — « une base détruite doit être cliquable et voir encore ses
  stats, surtout le niveau et dans combien de temps la ruine disparaît ».

---

## 0. Ce qu'il faut lire en premier

⚠⚠ **LA SUITE N'EST PAS VERTE, ET LE ROUGE EST CELUI D'HIER.** `npm test` rend
**1481 pass / 1 fail**. Le rouge est **`LIMITE T8`**, il est **unique**, il est
**PRÉEXISTANT** — il est arrivé au lot SOL-OUVRAGE et la PR #116 a été fusionnée
avec lui —, et le §1 du brief de ce lot-ci dit « **ne pas le réparer, ne pas le
contourner. Le consigner.** » **Ni le seuil ni la rampe n'ont été touchés**, et
aucun fichier de la frontière n'apparaît au diff.

⚠ **LA BASE ANNONCÉE PAR LE BRIEF ÉTAIT EXACTE**, ce qui est assez rare pour se
dire : `main` à `566a453`, **1 471 pass / 1 fail**, `dist/index.html` à
**9 124 362 octets**, `0.99.35 · build 137`, et le rouge unique bien nommé.

---

## 1. Ce que le lot pèse

`npm run build` → `dist/index.html`, **9 127 599 octets**, **0 référence
externe**.

Coût **+3 237 octets, ENTIÈREMENT DU JAVASCRIPT**, mesuré poste par poste contre
un livrable rebâti dans un `git worktree` depuis `566a453` :

| poste | base `566a453` | ce lot | écart |
|---|---:|---:|---:|
| images | 7 375 787 | 7 375 787 | **+0** |
| audio | 1 193 346 | 1 193 346 | **+0** |
| feuille | 127 211 | 127 211 | **+0** |
| **JavaScript** | 391 813 | 395 050 | **+3 237** |
| balisage | 36 205 | 36 205 | **+0** |
| **total** | **9 124 362** | **9 127 599** | **+3 237** |

⚠ **LA SOMME DES CINQ POSTES TOMBE EXACTEMENT SUR LE TOTAL, DES DEUX CÔTÉS.**
**311 lignes `data:` avant, 311 après ; 306 URI de part et d'autre** — 263
`data:audio/` et 43 `data:image/`, identiques. Aucune ressource n'entre ni ne
sort ; le lot est du code et rien d'autre.

Borne T10 **inchangée à 9 300 000**, marge **172 401 octets, 1,85 %**.

---

## 2. Fichiers touchés

| fichier | ce qui change |
|---|---|
| `src/ui/monde.js` | les trois points ; onze exports neufs, un en-tête réécrit |
| `src/sim/ruines.js` | **un champ additif**, `tick` — écart déclaré, §6 ci-dessous |
| `test/monde.test.js` | dix tests `PC T1`–`T10`, le faux document corrigé |
| `test/pictogramme.test.js` | `PIC T7` réancré sur la taille et la marge neuves |
| `package.json` | version et build, tous deux en CHAÎNES (vérifié) |

⚠⚠ **TROIS LOTS TOURNENT EN PARALLÈLE, ET LE PÉRIMÈTRE A ÉTÉ TENU.** Le §1.6 du
brief attribue à celui-ci `ui/monde.js`, `ui/session.js`, `sim/ruines.js` et
`sim/poi.js`, et lui interdit `ui/chantier.js`, `ui/offense.js`,
`src/index.src.html`, `sim/fondation.js`, `sim/deplacement.js`,
`sim/raid-ouvrage.js` et `sim/generateur.js`. **Vérifié au diff : aucun de ces
sept fichiers n'apparaît**, et le lot ne touche même pas `ui/session.js` ni
`sim/poi.js`, qui lui étaient pourtant ouverts.

⚠ **`SAVE_VERSION` NE BOUGE PAS, ET RESTE À 29** — vérifié au diff,
`src/sim/state.js` n'a pas une ligne de changée. Rien n'entre dans l'état : un
bilan est une hypothèse jetée, un message est un affichage, et l'ensemble des
gisements connus vit dans la fermeture de l'écran.

---

## 3. Point 5 — la simulation de territoire

`bilanDuTerritoire(etat, cible)` monte une **hypothèse** — une copie de SURFACE
de l'état où la seule base courante porte une position neuve — et appelle
**`territoireDeLaFenetre` DEUX fois sur la MÊME fenêtre**, puis compte les cases
qui changent de camp.

⚠⚠ **AUCUNE FORMULE D'INFLUENCE N'EST ÉCRITE**, ce que le §3 du brief exige en
capitales. La règle reste écrite une seule fois, dans `sim/territoire.js` ; ce
module-ci ne fait que de l'arithmétique sur deux `Uint8Array`. Le TÉMOIN du test,
lui, réimplémente le COMPTAGE et jamais la formule — c'est ce partage qui rend
`PC T1` utile.

⚠ **ET L'ÉTAT RÉEL NE BOUGE PAS D'UN OCTET.** `PC T1` sérialise avant et après,
et compare les chaînes. Une copie qui partagerait l'objet `position` au lieu d'en
poser un neuf téléporterait la base à l'ouverture de la confirmation, avant même
l'accord du joueur.

### La fenêtre

`RAYON_DU_BILAN` vaut `Math.max(...Object.values(RAYONS))`, soit **3** — jamais
un nombre écrit à la main : une case peut changer de camp jusqu'au rayon de
l'Ouvrage au-delà du segment qui joint les deux positions. `fenetreDuBilan`
prend la boîte des deux positions et la dilate de ce rayon.

⚠⚠ **LE COUPLE `T1`/`T2` EST CE QUI MESURE LA FENÊTRE, ET LE PARTAGE EST
DÉLIBÉRÉ.** `T1` compare le panneau au comptage sur la MÊME fenêtre — il mesure
que le panneau AFFICHE ce que le comptage donne ; `T2` mesure la fenêtre. Sans
ce partage, le rayon ramené à zéro déplacerait les deux côtés de `T1` ensemble et
le laisserait vert. Mesuré : la falsification du rayon fait tomber `T2` **seul**.

### ⚠⚠ `PC T1` a dû changer de montage APRÈS mesure

**La falsification du §5 du brief — « décaler la cible d'une case » — l'a laissé
VERT au premier relevé, et elle est tombée sur `PC T2` à la place.** Le motif est
mesuré, pas deviné.

Au DÉPART — rangée 295 —, la garde du peuplement écarte les bases de l'Ouvrage
de quinze cases : un déplacement de cinq cases emporte l'octogone ENTIER sans
rien contester, et rend **21 gagnées, 21 perdues, solde 0** quelle que soit la
direction. Mesuré sur les 155 cases que `armerEtViser` retient : **16 bilans
distincts en tout, mais la PREMIÈRE — celle que le montage prend, `ecart = 0` —
tombe dans la nappe plate, et sa voisine y rend le MÊME 21/21/0.**

Le montage vise donc désormais la **rangée 250, bâtiments au niveau 20**, où
`niveauDeLaRangee(250)` vaut 10 et la carte est CONTESTÉE :

| montage | cases retenues | bilans distincts | premier bilan | sa voisine |
|---|---:|---:|---|---|
| départ, rangée 295, niveau 1 | 155 | 16 | 21 / 21 / 0 | 21 / 21 / 0 — **aveugle** |
| retenu, rangée 250, niveau 20 | 168 | **34** | 20 / 17 / **+3** | 19 / 17 / +2 — **discrimine** |

**Une assertion de discrimination entre avec le montage** — `assert.notDeepEqual`
entre le bilan de la cible et celui de sa voisine — pour qu'il ne puisse plus
redevenir aveugle en silence. Après ce changement, **F1 tombe sur `PC T1`** (et
sur `T2`), et **F2 tombe sur `T2` seul** : c'est la forme que le brief décrit.

### Le bilan se calcule une fois

`PC T3` le mesure **par différentiel**, l'idiome de `RCU T11` :
`territoireDeLaFenetre` est appelée à CHAQUE image pour les frontières, donc un
compte absolu d'appels ne dirait rien. La sonde est `etat.graine`, lue une fois
par appel à `forcesDeLOuvrage`. Deux assertions :

1. l'**ouverture** de la confirmation coûte au moins deux lectures de plus — donc
   le bilan est bien calculé là ;
2. **dix images confirmation OUVERTE coûtent exactement dix fois une image
   ordinaire** — donc il n'est pas recalculé à l'image.

Plus trois assertions de source : exactement **deux** occurrences de
`bilanDuTerritoire(`, **aucune** dans `dessiner`, **une** dans
`demanderLeDeplacement`.

---

## 4. Point 6 — le message des gisements

⚠⚠ **LA DÉTECTION SE FAIT PAR DIFFÉRENCE, CÔTÉ ÉCRAN, ET `releverLesPoisAcquis`
N'A PAS UNE LIGNE DE CHANGÉE** — c'est ce que le §4.1 du brief exige en
capitales. Elle tourne dans le chemin CHAUD du tick (`sim/state.js`,
`sim/deplacement.js`) ; lui faire émettre un événement mettrait une notion
d'interface dans la simulation.

⚠ **LA COMPARAISON PORTE SUR L'IDENTITÉ, PAS SUR LA LONGUEUR.** `poisAcquis` est
**retriée à chaque ajout** : un compte n'aurait pas dit LESQUELS, et deux
gisements pris pendant qu'un autre chemin en retire un — cas qui n'existe pas
aujourd'hui — auraient rendu un delta nul. `clesDesPoisAcquis` rend l'ensemble
des clés `type:bande`.

⚠ **ET LA PREMIÈRE MESURE EST MUETTE, PAR CONSTRUCTION.** `poisConnus` vaut
`null` tant que rien n'a été vu. Sans ça, ouvrir la carte sur une partie qui
porte déjà dix gisements annoncerait « 10 gisements acquis » au joueur qui les a
pris la veille.

⚠⚠ **ET LE RELEVÉ EST AVANT LA SORTIE ANTICIPÉE DE `rafraichir`.**
`empreinteDeLaCarte` ne porte ni les gisements acquis ni l'horloge : posé après,
le message ne partirait que les images où la carte change par ailleurs — donc
presque jamais. La falsification qui le déplace fait tomber `PC T5` **et**
`PC T6`.

### Le montage de `PC T6` a dû être mesuré avant d'être écrit

**Une base de niveau 1 ne peut PAS tenir deux cases à gisement** : le plancher
ne protège que la sienne, et l'Ouvrage l'emporte partout ailleurs.

| graine | centres couvrant deux gisements | deux acquis au niveau 1 | au niveau 50 |
|---:|---:|---:|---:|
| 20260906 | 19 | **0** | 19 |
| 7 | 15 | **0** | 15 |
| 42 | 13 | **0** | 13 |
| 1234 | 4 | **0** | 4 |
| **total** | **51** | **0** | **51** |

Le centre se **CHERCHE** dans le test, il ne s'écrit pas — une coordonnée écrite
à la main ne garderait qu'elle-même, cinquième fois du dépôt.

### Où vit le message

⚠⚠ **IL EST CRÉÉ EN JAVASCRIPT ET POSÉ DANS `#monde-outils`, PARCE QUE LE
BALISAGE APPARTIENT À UN AUTRE LOT.** `src/index.src.html` est hors périmètre
(§1.6) : l'élément naît donc dans l'écran, et son style se **LIT** dans
`PALETTE` — **aucune teinte neuve, aucun hex écrit dans `monde.js`** (vérifié :
zéro `#RRGGBB` et zéro `rgba(` au diff), la garde de palette reste satisfaite.

⚠ **SA DURÉE VIENT DE `DUREE_TOAST_MS` D'`ui/chantier.js`.** Un second message
qui s'effacerait au bout d'un AUTRE délai apprendrait au joueur deux grammaires
pour le même objet.

⚠ **L'AFFICHAGE, LUI, EST RECOPIÉ — DETTE DÉCLARÉE.** Le registre `toast` de
`ui/chantier.js` ne peut pas servir : il écrit dans `#chantier-avis`, qui n'est
pas sur cet écran, et le mutualiser demanderait de toucher au balisage. **Le lot
qui pourra y toucher réunira les deux**, et ce sera un déplacement, pas une
écriture.

---

## 5. Point 10 — la ruine cliquable

⚠⚠ **LA RUINE N'ENTRE PAS DANS `sitesDeLaFenetre`**, ce que le §4.3 du brief
exige en capitales. C'est cette liste-là qui pilote le TOUCHER des cibles et les
étiquettes ; l'y faire entrer donnerait à une ruine le bouton « Attaquer » par le
même chemin que les autres. Elle garde sa passe de dessin, muette par
construction depuis le lot CONQUÊTE-24H.

`ouvrirRuine` masque les **CINQ** blocs d'action — le prix, le refus, la
confirmation, « Déplacer la base » et « Attaquer » — et pose quatre lignes :
niveau, terrain tenu par, disparaît dans, position.

⚠ **UN SITE SUR LA MÊME CASE GAGNE**, et c'est la POSITION de la recherche qui le
dit : la ruine se cherche **APRÈS** la boucle des sites, jamais avant. Un panneau
en lecture seule ne doit pas recouvrir une cible attaquable — c'est le sens du
toucher qui changerait. `PC T9` pose la ruine sur la case d'un satellite et exige
que le titre soit celui du SATELLITE.

⚠ **LE COMPTE À REBOURS SE RAFRAÎCHIT, ET IL NE DIT JAMAIS UN DÉLAI NÉGATIF.**
`resteDeLaRuine` plancher à zéro, et `rafraichirLaRuine` **FERME** le panneau dès
que `ruineDeLaCase` ne rend plus rien : une ruine expirée cesse d'exister, elle ne
reste pas à l'écran à annoncer « 0,0 h ». Le panneau ne se repeint que si la
chaîne de durée a CHANGÉ — `rafraichir` passe dix fois par seconde.

---

## 6. Écarts au brief, tous déclarés

### 6.1 — `direLaDuree` est importée de `sim/reparation.js`

Le §4.2 ne laissait que deux issues : exporter la fonction de
`sim/deplacement.js` — **interdit**, ce fichier appartient à un autre lot — ou
« en écrire la sienne dans `monde.js`, en la déclarant au rapport comme la
troisième jumelle ».

**Mesuré : ni l'une ni l'autre n'était nécessaire.** `direLaDuree` est **DÉJÀ
exportée** de `sim/reparation.js` depuis le lot RÉPARER-ÉCRAN, et
`ui/chantier.js` la partage **DÉJÀ**, très exactement pour que la même durée ne
se lise pas de deux façons. L'importer **n'ajoute pas une ligne** à
`sim/reparation.js`, donc **pas un conflit à résoudre sur un téléphone** — ce qui
EST le motif du §1.6. Écrire une troisième jumelle aurait mis au dépôt trois
formulations de la même durée, dont deux seulement se confrontent.

### 6.2 — `ruinesActives` gagne `tick`

Le §6 pose `sim/ruines.js` **en lecture** « si l'exécution ne démontre pas le
contraire », et demande de « le dire au rapport **avant** de le faire ». Elle l'a
démontré, et c'est dit ici.

Ethan demande qu'une ruine annonce « dans combien de temps la ruine disparaît ».
`ruinesActives` est **LA SEULE PORTE vers l'émission** — `sim/ruines.js` l'écrit
lui-même deux paragraphes plus haut — et elle **jetait le seul champ dont ce
compte à rebours se dérive**.

**Les deux autres issues ont été écartées, et elles se valent mal :**

- lire `etat.basesRasees` depuis l'écran **contournerait cette porte**, donc
  ouvrirait un panneau sur une ruine périmée — la faute que `sim/ruines.js`
  existe pour empêcher ;
- refaire une seconde recherche dans la liste, gardée par `ruineEstActive`,
  **parcourrait deux fois la même liste pour deux réponses qui doivent
  s'accorder**.

⚠ **LE CHAMP NE SERT À AUCUN CALCUL DU MODULE.** `ruineEstActive` continue de
lire l'entrée BRUTE, comme avant : ce champ-ci est ce que l'entrée **TRANSPORTE**,
pas une seconde source d'expiration. Le changement est **purement additif** — 18
lignes au diff, dont **17 de commentaire** : une seule ligne de code.

### 6.3 — `getBoundingClientRect` n'est pas asserté

Le §5 demandait de l'asserter plutôt que la seule présence au DOM. **Le faux
document de `test/monde.test.js` rend un rectangle CONSTANT — 360 × 640, écrit à
sa création** : une assertion dessus mesurerait le faux et non l'écran. Le dépôt
n'a ni jsdom ni navigateur (`CLAUDE.md` §3), et cette instruction ne survit pas
au contact.

**Ce qui est asserté à la place est ce qui se mesure ici** : `hidden`,
`pointer-events`, le CONTENU des lignes, et le comportement du toucher.

### 6.4 — l'en-tête de `monde.js` mentait, et il est réécrit

Il finissait par « Aucun bouton "Attaquer" : le raid n'existe pas » — **vrai le
27/08** contre le bouton « Assaut » de l'écran Chantier, **FAUX depuis le lot
CARTE-C du 06/09**, qui a posé `#monde-panneau-attaquer` sur ordre d'Ethan. Le
balisage portait déjà le renversement en toutes lettres ; l'en-tête ne l'avait
pas suivi.

C'est le **commentaire menteur en puissance** que `CLAUDE.md` §6 raconte trois
fois, trouvé en ajoutant un troisième panneau. Il est **réécrit plutôt
qu'enjambé**, et il porte désormais la règle qui tourne : « Attaquer » entre dans
une cible, « Déplacer la base » n'apparaît que sur sa propre base, le panneau
d'une RUINE ne porte aucun des deux.

---

## 7. Un défaut du harnais, trouvé par `PC T10`

⚠⚠ **LE `textContent` DU FAUX DOCUMENT ÉTAIT UN CHAMP, PAS UN ACCESSEUR.**
Écrire dedans ne vidait pas `children`, donc les lignes du panneau s'empilaient
d'un rafraîchissement à l'autre et `find()` rendait la **première**, périmée. Le
test lisait `["24.0 h","24.0 h","24.0 h","24.0 h"]` pour quatre instants
distincts, sur un code parfaitement juste.

C'est devenu un **accesseur qui vide les enfants** — le comportement fidèle du
DOM, et exactement le défaut que `test/offense.test.js` a payé au lot
RETOUR-DE-RAID (« écrire `textContent` doit vider les enfants — trouvé en le
mesurant, pas en le relisant »). **Deuxième fois du dépôt.**

Le faux document apprend aussi les **minuteries** — `setTimeout` / `clearTimeout`
adossés à une `Map`, plus un `echoir()` qui les fait toutes tomber — sans quoi
le message ne pourrait jamais être vu s'effacer.

---

## 8. Les dix tests

Tous **PASS**. Le fichier `test/monde.test.js` passe de **85 à 95 tests**, et le
dépôt de **1 472 à 1 482**.

| test | ce qu'il mesure | montage effectif |
|---|---|---|
| `PC T1` | le panneau annonce le bilan que la carte peint, et l'état ne bouge pas | base rangée 250, bâtiments niveau 20, cible tirée d'`armerEtViser` ; témoin recalculé à la main ; `serialiser` avant/après |
| `PC T2` | la fenêtre couvre les DEUX positions, dilatées | la case la plus lointaine **se demande** ; comptée sur la fenêtre nue puis dilatée |
| `PC T3` | le bilan se calcule UNE fois, à l'ouverture | différentiel sur les lectures d'`etat.graine` + trois assertions de source |
| `PC T4` | la phrase de menace n'a pas bougé d'un mot | le bilan s'ouvre, `phraseDesAttaquantes` est comparée mot pour mot |
| `PC T5` | un gisement acquis parle UNE fois, le tick suivant se tait | un tick qui acquiert, un tick qui n'acquiert pas, `echoir()` |
| `PC T6` | deux gisements dans le même tick font UN message qui dit deux | centre **cherché** sur 51 candidats, base montée au niveau 50 |
| `PC T7` | la ruine dit son niveau, son camp, son délai | `ruineFraiche` sur une case sans site, toucher, quatre lignes lues |
| `PC T8` | la ruine n'est PAS attaquable | les cinq blocs d'action assertés cachés, et le refus resté muet |
| `PC T9` | un site sur la même case gagne | ruine posée sur la case d'un satellite |
| `PC T10` | l'expiration ferme le panneau, sans délai négatif | horloge avancée par paliers, panneau lu à chaque palier |

⚠⚠ **CES DIX TESTS NE « TOMBENT PAS SUR LE CODE D'AVANT » AU SENS ORDINAIRE, ET
IL FAUT LE DIRE.** Le fichier entier refuse de se charger — les exports n'existent
pas. Ce n'est PAS la propriété qu'ils mesurent. **Ce qui la mesure, ce sont les
quinze falsifications ci-dessous, jouées sur l'arbre FINAL, une par
propriété.**

⚠ **AUCUNE ASSERTION N'A ÉTÉ RETIRÉE NI ASSOUPLIE.** **Une garde change de
valeur** — `PIC T7`, qui suit la taille du livrable et la marge : 9 124 362 et
1,89 % deviennent **9 127 599 et 1,85 %**.

---

## 9. Falsifications — quinze, quinze chutes, zéro muette

| # | falsification | verdict | ce qui tombe |
|---|---|---|---|
| F1 | cible décalée d'une case dans le bilan | CHUTE | `PC T1`, `PC T2` |
| F2 | `RAYON_DU_BILAN` ramené à zéro | CHUTE | `PC T2` **seul** |
| F3 | le bilan recalculé dans `dessiner` | CHUTE | `PC T3` |
| F4 | la phrase de menace écrite en dur | CHUTE | `DÉ T6`, `DÉ T10`, `PC T4` |
| F5 | l'ensemble des gisements connus n'est jamais adopté | CHUTE | `PC T5` |
| F5b | le relevé placé APRÈS la sortie anticipée de `rafraichir` | CHUTE | `PC T5`, `PC T6` |
| F5c | la minuterie du message retirée | CHUTE | `PC T5` |
| F5d | `pointer-events: none` retiré du message | CHUTE | `PC T5` |
| F6 | un message par gisement au lieu d'un seul | CHUTE | `PC T6` |
| F7 | le niveau de la ruine remplacé par son vainqueur | CHUTE | `PC T7` |
| F7b | le délai de la ruine écrit en dur | CHUTE | `PC T7`, `PC T10` |
| F8 | la ruine entre dans `sitesDeLaFenetre` | CHUTE | `PC T7`, `T8`, `T9`, `T10` |
| F9 | la ruine cherchée AVANT les sites | CHUTE | `PC T9` |
| F10 | le compte à rebours ne se rafraîchit plus | CHUTE | `PC T10` |
| F11 | le faux document ne vide plus les enfants sur `textContent` | CHUTE | `PC T10` |

⚠ **F1 ET F2 SONT LE COUPLE QUE LE BRIEF DÉCRIT**, et il fallait corriger `T1`
pour l'obtenir — voir §3. Au premier relevé, F1 tombait sur `T2` et laissait `T1`
vert.

⚠ **F4 MORD PLUS LARGE QUE SON TEST, ET C'EST CE QU'ON LUI DEMANDE** : la phrase
de menace était déjà gardée par le lot DÉPLACEMENT-ÉCLAIRÉ, et le bilan s'insère
**au-dessus** d'elle sans la déplacer.

---

## 10. Ce qui n'a pas été fait, et pourquoi

⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni un outil de la chaîne — le §1 du brief l'écrit de face
(« **PAS D'ART** : ne pas lancer `tools/verifier.py` »). Pas un octet
d'`art/sprites/` ne change.

⚠ **LE RENDU N'A PAS ÉTÉ VU, NI SUR APPAREIL NI DANS UN NAVIGATEUR, ET SE
DÉCLARE NON EXÉCUTÉ.** Tout est mesuré par le faux document de
`test/monde.test.js`, qui monte l'écran et rejoue de vrais évènements de
pointeur — mais qui n'est pas un navigateur. Ce qui reste à juger à l'œil : la
place du message dans `#monde-outils`, sa lisibilité à 10 px, et la hauteur du
bloc de bilan dans le panneau de confirmation.

⚠ **`LIMITE T8` RESTE ROUGE.** Voir le §0.

---

## 11. Ce qui reste ouvert pour Ethan

1. **La dette d'affichage du message.** Il est recopié depuis `ui/chantier.js`
   faute de pouvoir toucher au balisage. Le lot qui le pourra les réunira.
2. **Le libellé du bilan.** « Cases gagnées / Cases perdues / Solde » est une
   lecture ; Ethan n'a pas dicté les mots.
3. **Le panneau de ruine n'a aucun bouton**, pas même « Fermer » propre à lui —
   il emprunte celui du panneau de site. C'est délibéré : un second bouton aurait
   été une seconde façon de fermer la même chose.
