# RAPPORT — lot BÂTIMENTS-QUATRE-ÉTATS

> Passer les bâtiments de un état à quatre, créer les cinq identifiants qui
> manquent, et brancher le tout au rendu.

Livré le **08/09/2026**. Modèle : Opus 5, effort élevé.

---

## 0. Base de départ, et ce qui sort

| | avant | après |
|---|---|---|
| `npm test` | **1411 pass / 1 fail** | **1419 pass / 0 fail** |
| `dist/index.html` | **8 395 461 octets** | **8 647 037 octets** |
| delta | — | **+251 576 octets** |
| dont images | — | **+246 932** — l'atlas `batiment` passe de 34 à 83 sprites |
| dont code | — | **+4 644** |
| `data:` dans la page | 297 | **297** — aucune ressource nouvelle |
| marge sous la borne T10 | 904 539 · 9,73 % | **652 963 octets · 7,02 %** |
| `version` | 0.99.29 | **0.99.30** |
| `build` | 131 | **132** |
| `SAVE_VERSION` | 28 | **29** |

⚠ **LA BASE DE DÉPART PORTAIT UN ÉCHEC, ET IL ÉTAIT ATTENDU.** Le seul test rouge
était `entrées — tout fichier d'art/sources/ est CLASSÉ` : Ethan avait commité les
quatre-vingts planches de bâtiment quelques heures plus tôt, et rien ne les
consommait encore. C'est très exactement ce que ce lot répare.

⚠⚠ **LA MARGE T10 TOMBE À 7,02 %**, contre 9,73 % le matin même et 11,22 % la
veille. Trois lots d'art se sont succédé en deux jours ; **le prochain devra
compter avant de dessiner.** Le détail est au §7.

**Fichiers.** Deux nouveaux : `tools/batiments_v2.py` et
`test/batiments-quatre-etats.test.js`. Modifiés côté source :
`src/data/base.js`, `src/data/atlas.js` (généré), `src/data/missions.js`,
`src/sim/disposition.js`, `src/sim/state.js`, `src/sim/reparation.js`,
`src/render/scene.js`, `src/ui/chantier.js`. Côté outils : `tools/final128.py`,
`tools/planches.py`, `tools/ruines.py`, `tools/atlas.py`, `tools/verifier.py`.
Côté art : **81 sources consommées**, **162 sprites**, **2 atlas** recousus.
Dix-huit fichiers de test.

---

## 1. ⚠⚠ LE POINT QU'IL A FALLU FAIRE TRANCHER

Le §1 du brief dit que `collecteur` disparaît et que deux identifiants le
remplacent. Il ne dit pas ce qu'il advient de **l'arbitrage du 26/08**, écrit en
toutes lettres dans `CHAMPS.ressourceDonneeParLeChamp` :

> Un collecteur ne choisit pas ce qu'il produit : il produit ce qu'il y a sous
> lui.

Et le tutoriel le répète **au joueur**, mot pour mot : « c'est le champ sous lui
qui décide de ce qu'il sort ». Deux lectures étaient possibles et menaient à des
travaux différents — le champ contraint LEQUEL on pose, ou les deux se posent
partout et le nom ment. La question a été posée.

**Ethan, 08/09 :** « une icône collecteur mixte / le bâtiment posé quartz ou
scories en fonction du champ. »

C'est une troisième lecture, meilleure que les deux proposées : **le joueur ne
choisit pas**. La palette porte UNE vignette, et le terrain dit lequel des deux
atterrit. L'arbitrage du 26/08 n'est pas seulement préservé, il est **renforcé** —
le champ ne décide plus de ce que produit un bâtiment, il décide **du bâtiment**,
donc de ce qu'il produit. La phrase du tutoriel reste vraie sans qu'on y touche.

⚠ **Conséquence structurelle : `ORDRE_PALETTE` n'est plus une permutation du
roster.** Quinze bâtiments, **quatorze vignettes**. Ce que le test garde change
de forme sans se relâcher : la palette doit **couvrir exactement** le roster —
chaque vignette pose au moins un bâtiment, chaque bâtiment est posé par au moins
une vignette.

---

## 2. Les cinq identifiants

| Identifiant | Sort de | `ressource` | PV | Classe |
|---|---|---|---|---|
| `collecteurQuartz` | `collecteur` | `quartz` | 1 500 | modeste |
| `collecteurScorie` | `collecteur` | `scorie` | 1 500 | modeste |
| `artillerieAntiInfanterie` | — | *aucune* | 2 000 | courant |
| `artillerieAntiVehicule` | — | *aucune* | 2 000 | courant |
| `artillerieAntiAerien` | — | *aucune* | 2 000 | courant |

### 2.1 `quartzOuScorie` disparaît, et c'est un gain

L'exclusif n'avait de sens que tant qu'UN bâtiment couvrait les deux cas : il
disait « la réponse n'est pas sur ma ligne, elle est sous moi ». Il y a
maintenant deux bâtiments, et **chacun sait**. La raffinerie garde l'inclusif
`quartzEtScorie`, qui dit tout autre chose — elle tient les deux à la fois.

Un test balaie les quinze lignes et exige qu'aucune ne porte encore l'ancienne
valeur : oubliée quelque part, `ressourceProduite` l'aurait lue comme « pas de
ressource propre », en silence.

### 2.2 ⚠ Les deux collecteurs perdent `nom.ouvrage`, et le précédent est écrit

`BATIMENTS.noeud.ressource` vaut `{ quartz: 0.5, scorie: 0.5 }` : **un** bâtiment
de l'Ouvrage fait désormais face à **deux** du joueur. C'est exactement
l'asymétrie de la Raffinerie prise à l'envers, et le raisonnement était déjà dans
le fichier :

> Un vers deux : aucun nom ne convient, et en choisir un serait faux la moitié du
> temps.

L'appariement déclaré passe de trois à deux, et la garde inverse — « ces
bâtiments de l'Ouvrage ne renvoient vers AUCUN bâtiment du joueur » — gagne le
Nœud à côté de la Gangue et du Terril.

### 2.3 ⚠ Les trois artilleries entrent SANS effet de jeu, et le blanc est déclaré

Le brief les fait entrer comme **identifiants**, avec leurs sprites et leurs
quatre états ; il ne dit rien de ce qu'elles font. `role: 'artillerie'` est un
rôle **neuf**, qu'aucune branche du dépôt ne lit : elles se posent, se montent et
se réparent sans rien produire.

C'est un choix, pas une négligence. Leur donner `'production'` les aurait fait
entrer dans la garde des trois casernes ; `'producteur'` dans le calcul des
débits. **Deux mensonges silencieux au lieu d'un blanc visible.** Leurs PV
(2 000), leur classe (`courant`) et leur coefficient de régime (6, celui des trois
casernes) sont des emprunts déclarés — aucun relevé ne parle d'elles.

⚠ **Elles ne sont pas les Faucheuse, Mortier et Harpon de `DEFENSES`.** Celles-là
sont des PIÈCES qu'on garnit, qui tirent, qui ont une portée. Le brief prévenait ;
elles n'ont pas été touchées.

### 2.4 Les 341 occurrences, par fichier

Relevé avant de commencer, sur l'identifiant **borné à droite** — sans quoi
`collecteurQuartz` fait passer le motif partout :

| | occurrences | | occurrences |
|---|---|---|---|
| `test/disposition.test.js` | 50 | `src/sim/disposition.js` | 12 |
| `test/temoins-bases-0.js` | 50 | `test/missions.test.js` | 10 |
| `test/chantier.test.js` | 44 | `src/ui/chantier.js` | 7 |
| `test/base.test.js` | 42 | `test/donnees.test.js` | 6 |
| `test/state.test.js` | 35 | `src/sim/economie-base.js` | 5 |
| `src/data/base.js` | 20 | 19 autres fichiers | 1 à 4 |
| `test/economie-base.test.js` | 20 | **TOTAL** | **341 dans 30 fichiers** |

⚠⚠ **QUATRE OCCURRENCES DE CODE SEULEMENT DANS `src/`** — le reste est de la
prose. Mais quatre TABLES de `src/data/base.js` le portaient en clé, et ce sont
elles qui comptaient : `COEFFICIENT_DE_REGIME`, `COUT_ELECTRICITE.fraction`,
`DEBITS` et `PRODUCTEUR_APPARIE`.

⚠ **`PRODUCTEUR_APPARIE` PASSE D'UNE CHAÎNE À UNE LISTE.** La Raffinerie fait face
à deux producteurs, l'Accumulateur toujours à un seul. Une chaîne aurait obligé à
en choisir un — la même impasse que `nom.ouvrage`.

⚠ **`DEBITS.raffinerie.parVoisin` porte deux clés**, et c'est l'exemple d'Ethan du
26/08 écrit dans la table : « une raffinerie entourée de deux collecteurs à
quartz et trois à scorie produit 144/h de quartz et 216/h de scorie ». Conséquence
mesurée : `voisinsQualifiants` rend désormais `{ collecteurQuartz: 1,
collecteurScorie: 0 }` — la clé à zéro comprise, comme la règle du fichier
l'exige déjà pour l'accumulateur.

### 2.5 ⚠⚠ DEUX RÉFÉRENCES MORTES QUE LE RENOMMAGE A LAISSÉES PASSER

Elles sont la raison d'être de `B4 T1`, et elles ont été trouvées **par lui** :

- `test/couts-militaires.test.js` : `COUT_ELECTRICITE.fraction.collecteur` —
  `undefined`, comparé par `notEqual` à `0.25`. **Le test passait.**
- `test/niveau-de-base.test.js` : `{ id: 'collecteur', … }` dans un montage de
  disposition, que le calcul de moyenne n'interroge pas.

Un `undefined` qui se promène ne fait pas de bruit : il en fait plus tard, ailleurs.

---

## 3. Les quatre états

| État | Suffixe | Condition sur les PV |
|---|---|---|
| intact | *aucun* | `pv === pvMax`, **exactement** |
| `_abime` | `_abime` | du premier PV perdu à **50 % inclus** |
| `_tres_abime` | `_tres_abime` | **sous 50 %**, jusqu'à 1 PV |
| `_detruit` | `_detruit` | `pv === 0` |

⚠⚠ **DEUX ÉGALITÉS ENCADRENT DEUX FRACTIONS, ET C'EST LA SEULE FAÇON D'AVOIR
QUATRE ÉTATS SUR TROIS FRONTIÈRES.** « Intact » n'est pas « au-dessus de 99 % » ;
`_detruit` n'est pas « moins de 1 % ». Un bâtiment à 1 PV sur 5 500 tient encore,
et le dessin doit le dire.

⚠ **LA COMPARAISON RESTE ENTIÈRE :** `pv * 2 >= pvMax`. Une division rendrait la
moitié inexacte sur un `pvMax` impair, et la frontière se déplacerait d'un PV
selon la parité. `B4 T3` le mesure sur `pvMax = 7`.

⚠ **LA TABLE VIT DANS `src/data/base.js`**, le rendu la lit. Un module de rendu
qui saurait à partir de quel pourcentage un mur se fissure serait la seconde
vérité que `CLAUDE.md` §4 refuse.

**Qui calcule l'état d'un bâtiment POSÉ :** `etatDeLaPose` de
`src/sim/reparation.js`, là où vivent déjà `pvMaxDuBatimentMilli` et
`degatsMilli`. Recomposer les deux dans l'écran aurait fait une seconde
arithmétique des PV.

---

## 4. ⚠⚠ `_detruit` AVAIT UN LECTEUR DE ZÉRO — VÉRIFIÉ

Le brief le relevait ; c'est confirmé. Les seize sprites `_detruit` étaient dans
le livrable **depuis leur fabrication** et n'étaient nommés par aucune ligne de
`src/` — seulement par la table de `src/data/atlas.js`, qui les décrit sans les
demander. **Troisième fois du dépôt** après `ui_pause` et `ruine_j`/`ruine_o`.

Ils ont un lecteur depuis ce lot : le jeton de la grille du Chantier demande
`etat: (piece.degatsMilli ?? 0) === 0 ? 'intact' : etatDeLaPose(piece)`.

⚠ **LE DISCRIMINANT EST LES DÉGÂTS, PAS LE NIVEAU**, et c'est une mesure. La même
fonction `spriteDe` sert la grille ET la palette ; la palette décrit sa pièce « au
niveau 1 », comme une pose, mais ne lui donne jamais de dégâts — et sa vignette
peut même n'être pas un bâtiment. Tester le niveau faisait lever `etatDeLaPose`
sur `collecteurMixte`.

⚠ **`ruine_<c>` ET `_detruit` NE SE CONFONDENT PAS**, et `B4 T5` le garde : la
ruine se pose quand la CASE est rasée, `_detruit` quand le bâtiment est à zéro PV
mais **toujours là**, réparable.

---

## 5. Le rendu — l'atlas décide, jamais une liste

`couchesDuBatiment` compose le nom et **le rabat sur ce que l'atlas porte** :

```js
const base = existeDansAtlas('batiment', nu(d.id)) ? nu(d.id) : nu(batimentDeReference(d.id));
return [{ famille: 'batiment', nom: nomAvecEtat(base, d.etat ?? 'intact') }];
```

⚠⚠ **LA DÉGRADATION VA VERS LE SAIN, ET C'EST LE SEUL SENS DÉFENDABLE.** Un
bâtiment très abîmé dessiné en `_abime` montre moins de dégâts qu'il n'en a ;
dessiné en `_detruit`, il annoncerait une ruine là où le joueur peut encore
réparer. **Mieux vaut sous-dire que sur-dire** — la barre de PV, elle, ne ment
jamais.

⚠⚠ **CE MÉCANISME A ÉTÉ ÉPROUVÉ EN VRAI, PAS SEULEMENT TESTÉ.** Ethan a livré
l'icône `bat_j_collecteur_mixte` alors que le lot était déjà câblé sur son repli.
Elle est passée par la chaîne, l'atlas l'a portée, et **le jeu l'a prise sans
qu'une seule ligne de code change**. C'est exactement ce que le §3 du brief
demandait de rendre possible.

---

## 6. La chaîne d'art

**`tools/batiments_v2.py`** — une planche, un sprite, comme `joueur_v2.py` pour
les unités. **81 sources → 162 fichiers** : vingt bâtiments × quatre états × deux
grilles, plus l'icône de la vignette mixte.

⚠⚠ **IL REMPLACE, IL NE S'AJOUTE PAS.** `tools/planches.py` perd sa boucle sur la
table `B` et `tools/ruines.py` ses seize `_detruit` : les deux produisaient les
mêmes noms de fichier, et le second écrasait le premier selon l'ordre de la
chaîne. `ruines.py` ne garde que `ruine_j` et `ruine_o`, qui n'ont jamais été des
bâtiments.

⚠ **L'EMPRISE VIENT DE `PV` DE `final128.py`**, où cinq clés entrent — là-bas, pas
dans l'outil neuf, pour que l'emprise d'un bâtiment reste écrite au même endroit
que celle des quinze autres. **Les quatre états partagent l'emprise de leur
bâtiment** : une caserne détruite doit tenir la place d'une caserne, sinon elle
annoncerait un changement de niveau qui n'a pas eu lieu.

⚠⚠ **`tools/verifier.py` A GAGNÉ UNE LIGNE, ET L'OUBLI A ÉTÉ MESURÉ.** Sans
`('batiments_v2', [])` dans `CHAINE`, `entrees.py --declarer` rend **406
consommées et 233 dormantes** au lieu de 487 et 152 : la trace ne voit que ce que
la chaîne OUVRE, et un outil hors table n'ouvre rien.

**La déclaration bouge exactement de ce qu'on attend :**

- **+81 consommées** — les 80 planches d'états et l'icône mixte ;
- **−10 consommées / +10 dormantes** — les cinq planches multi-sujets et leurs
  cinq jumelles détruites, que plus personne ne lit. Elles restent dans
  `art/sources/` : « rien n'y est un produit, tout y est un original ».

### 6.1 Le verdict de `tools/verifier.py`

Chaîne complète, 719 s : **826 identiques à l'octet, 270 différents, 0 nouveau,
**0 MANQUANT**.

⚠⚠ **AUCUN SPRITE NE DIFFÈRE.** Les 162 fichiers produits par l'outil neuf se
reproduisent tous, et le **0 MANQUANT** dit l'autre moitié : rien au dépôt n'est
orphelin — ni les deux `bat_j_collecteur.png` supprimés, ni les seize `_detruit`
dont le producteur a changé.

Les 270 écarts sont deux tas connus, tous deux antérieurs au lot :

- **264 `.opus`** — `opusenc` est absent de cette machine, et `entrees.py
  --declarer` rejoue toute la chaîne, sons compris. Il a été joué avec un
  `opusenc` local délégant à `ffmpeg` : les écarts sont l'artefact de la mesure,
  pas un fait du dépôt.
- **6 JSON** — `ancres-blindes.json`, `ancres-blindes-ouvrage.json`,
  `ancres-defense.json`, `ancres-defense-ouvrage.json`, `fond-empreintes.json`,
  `sol-empreintes.json` : le défaut `newline=` des outils non corrigés au lot
  précédent.

⚠ **ET LA LIGNE « ATLAS » RESTE**, inchangée : `atlas.py --verifier` rend des
écarts sur les atlas dont l'encodeur WebP de cette machine diffère de celui qui
les a produits. C'est l'écart mesuré sur arbre pristine depuis le lot
PICTOGRAMMES.

---

## 7. Le poids, ventilé

| poste | avant | après | delta |
|---|---|---|---|
| `atlas-batiment-128.webp` | 114 650 | **299 848** | +185 198 |
| … le même en base64 | 152 868 | **399 800** | **+246 932** |
| `atlas-batiment-64.webp` | 42 952 | **107 050** | *hors livrable* |
| code | — | — | **+4 644** |
| `dist/index.html` | 8 395 461 | **8 647 037** | **+251 576** |

La somme des deux postes tombe exactement sur le total. **Aucune ressource
nouvelle n'entre** : les `data:` restent à 297, c'est la même image qui
s'alourdit — l'atlas `batiment` était déjà dans la page.

⚠⚠ **LA GRILLE 64 NE COÛTE RIEN AU LIVRABLE** et 64 098 octets de dépôt : elle est
cousue pour exister le jour où un écran la demandera.

⚠⚠ **MARGE T10 : 652 963 octets, 7,02 %.** Elle valait 11,22 % le 07/09 au matin.
Trois lots d'art l'ont mangée en deux jours — les ruines de base (−0,95 point),
l'Ouvrage v2 (−0,54), celui-ci (−2,71). **C'est le point en suspens le plus
sérieux du lot.**

---

## 8. Les témoins gelés — une couche qui ne déplace qu'un champ

⚠⚠ **QUATORZE PHASES, VINGT-CINQ GRAINES, UN SEUL CHAMP : `disposition`.** C'est
la mesure la plus utile du lot. Le scénario pose deux collecteurs, donc deux
identifiants au lieu d'un ; **tout ce qui en dépend** — l'économie, les stocks,
les raids, les rapports, la garnison, l'armée, les satellites — tombe à l'octet
sur la capture d'origine.

Autrement dit : **le dédoublement a changé un NOM, pas un comportement**, ce qui
est très exactement ce que la migration v28 → v29 promet aux sauvegardes
existantes.

La sauvegarde grandit de **12 octets**, et le compte est exact à la lettre près :
deux collecteurs posés, `collecteur` fait onze caractères, `collecteurQuartz` et
`collecteurScorie` dix-sept — +6 et +6. Un écart qui dépendrait de la partie
voudrait dire qu'un CONTENU a bougé.

**La migration ne devine rien, elle calcule.** Les champs d'une base sont une
fonction déterministe de sa position — contrat du 26/08 — et la sauvegarde porte
la position. Un collecteur hors champ serait retiré, et c'est le seul cas où la
migration jette quelque chose : il ne peut pas exister, `problemesDeLaPose`
refusant `hors-champ` depuis toujours.

---

## 9. Les tests

**1419 pass / 0 fail.** Sept tests neufs dans
`test/batiments-quatre-etats.test.js`, et **dix-huit fichiers de test** mis à
jour.

| Code | PASS | Montage effectivement écrit |
|---|---|---|
| **B4 T1** | ✅ | Motif **borné des deux côtés** — `'collecteur'`, `.collecteur`, `collecteur:` — appliqué au CODE de `src/` (commentaires retirés). Falsifié dans les deux sens : il attrape `const x = 'collecteur';`, il laisse passer `collecteurQuartz` et le nom commun français. **Une exception déclarée avec son compte** : la migration, seule à devoir prononcer le nom qu'elle remplace. |
| **B4 T2** | ✅ | Les 20 bâtiments × 4 états composés **par le vrai chemin** (`couchesDeLEntite`), 80 noms **distincts**, tous dans l'atlas ; et l'atlas n'en porte que trois de plus, nommés : les deux ruines et l'icône mixte. Aucun compte n'est écrit en dur. |
| **B4 T3** | ✅ | Balayage **au PV près** sur `pvMax = 200` : aucun trou, monotonie stricte, les quatre états paraissent. Les six frontières du brief assertées une à une, plus un `pvMax` de 50 (le piège du `> 0.99`) et un `pvMax` **impair** de 7 (le piège de la division). |
| **B4 T4** | ✅ | **Le montage du brief** : on retire une entrée de la table de l'atlas, une puis deux puis trois, et on exige que le nom rendu reste un nom porté. La table est **remise** dans un `finally`. Et l'autre moitié : sans montage, les 80 noms existent — le repli ne sert à personne aujourd'hui. |
| **B4 T5** | ✅ | `ruine_<c>` et `_detruit` sont deux familles **disjointes** ; 20 `_detruit` cousus ; `etatDeLaPose` rend `detruit` à zéro PV et `intact` sans dégâts. |
| **B4 T6** | ✅ | Balayage de source sur la **tranche** `nomAvecEtat` → `couchesDeLaRuine` de `scene.js` : aucun `=== 'o'`, `=== 'j'`, `'bat_j_'` ni `'bat_o_'`. Falsifiable — le motif attrape un appât — et complété par les deux camps rendus dans les quatre états. |
| **B4 T7** | ✅ | ⚠ **Hors liste** — le §1. Le champ tranche dans les deux sens, hors champ rend le défaut, une ressource inconnue LÈVE, et la palette **couvre exactement** le roster avec une seule vignette mixte. |

⚠ **Le compte de `PIC T7` a été remesuré et réécrit**, comme sa dernière ligne le
demande depuis toujours ; `PIC T6` gagne deux lignes d'atlas déplacé, en le
sachant, et les quatorze autres continuent de garder qu'aucun autre n'a bougé.

⚠ **L'appât de `sprite.test.js` a changé de famille**, et c'est la seconde fois.
Il lisait les bâtiments du joueur pour prouver que le compteur de trous compte
vraiment ; les planches neuves sont denses et ne portent plus que **330 px**
d'ajours contre les 500 exigés. **On ne baisse pas le seuil, on change d'appât** :
mesuré sur six familles, les **socles** en portent **972 sur six fichiers** — un
socle de tourelle est un anneau, ce qu'il enferme est un trou par construction.

---

## 10. Écarts au brief

### 10.1 ⚠⚠ Le §1 a demandé un arbitrage, et la réponse a changé la palette

Détaillé au §1. Le brief déléguait (« décider POUR CHACUNE »), mais la décision
touchait une règle arbitrée et un texte lu par le joueur. La réponse d'Ethan a
fait entrer une notion que le brief n'avait pas : **une vignette de palette qui
n'est pas un bâtiment**. `ORDRE_PALETTE` cesse d'être une permutation du roster,
`SIGLES` porte une seizième entrée, et `familleDuBatiment`, `nomDe`,
`casesPosables`, `problemesDeLaPose` et `poser` résolvent la vignette.

### 10.2 ⚠ Le §5 dit « ce lot ne renomme rien » — il a fallu renommer

`bat_j_collecteur` devient `bat_j_collecteur_quartz` et `bat_j_collecteur_scorie`.
C'est inévitable dès lors que le §1 dédouble l'identifiant, et les deux fichiers
d'origine sont **supprimés** du dépôt plutôt que laissés à pourrir.

### 10.3 ⚠ `GAME_VERSION` et `GAME_BUILD` n'existent pas sous ce nom

Le §6 les nomme ainsi ; le dépôt porte `version` et `config.build` dans
`package.json`, tous deux chaînes JSON. Ce sont eux qui ont été montés.

### 10.4 ⚠ Le rendu n'a pas été vu à l'écran, et se déclare non exécuté

Le dépôt ne sait pas monter le Chantier (CLAUDE.md §3). Ce qui est vérifié est le
NOM du sprite, sa présence dans l'atlas et le repli ; pas les pixels.

### 10.5 Les deux sources sans affectation, confirmées

`16_collecteur_raffinerie` n'a toujours aucune affectation. `22_collecteur_mixte_icone`
en a trouvé une **pendant le lot** : c'est la vignette mixte, et Ethan l'a livrée
— elle est au dépôt sous `bat_j_collecteur_mixte.png`.

---

## 11. Points en suspens

1. ⚠⚠ **La marge T10 à 7,02 %.** §7. Le prochain lot d'art devra compter avant de
   dessiner ; il reste 652 963 octets.
2. ⚠⚠ **Les trois artilleries ne font rien.** Elles se posent, coûtent et se
   réparent sans produire ni tirer. C'est ce que le brief demande, mais un joueur
   qui en pose une paie pour un décor. **À arbitrer avant d'ouvrir la palette au
   joueur**, ou à retirer de `ORDRE_PALETTE` en attendant.
3. ⚠ **`16_collecteur_raffinerie` reste sans emploi**, §10.5.
4. ⚠ **Les dix outils qui écrivent encore en CRLF** — signalé au lot précédent,
   toujours vrai ; et les 264 `.opus` qui ne se reproduiront pas tant qu'`opusenc`
   manquera à cette machine.
5. ⚠ **`COEFFICIENT_DE_REGIME` des artilleries est un emprunt**, pas un relevé :
   6, celui des trois casernes. Le jour d'un calibrage, ce sont ces trois lignes
   qui bougent.

---

## 12. Rendu

Branche `claude/lot-batiments-quatre-etats`, **PR ouverte, non mergée**.

---

## 13. ⚠⚠ LE DÉFAUT DU 08/09 — LA MIGRATION A EFFACÉ TROIS BÂTIMENTS

**Signalé par Ethan, sur sa vraie partie, après l'ouverture de la PR :**
« sauvegarde illisible — 19 résidus pour 16 bâtiment ».

### Ce qui s'est passé

La migration `v28 → v29`, celle qui convertit `collecteur` en
`collecteurQuartz` / `collecteurScorie`, recalculait le terrain avec
`champsDeLaBase(base.position.rangee, base.position.colonne)`.

`sim/state.js` prévient pourtant **en capitales**, soixante lignes plus haut :
les champs sont « **DÉRIVÉS DE LA FONDATION, PAS DE LA POSITION COURANTE** … il
ne faut jamais les confondre ». C'est une règle arbitrée le 27/08 et écrite pour
ça. La base d'Ethan avait bougé — le geste le plus ordinaire du jeu —, si bien
que la migration lisait un terrain qui n'était pas le sien.

Et elle **filtrait** la disposition : un collecteur « tombé à côté » de ce
terrain imaginaire était **retiré**. Trois bâtiments d'une partie réelle.

### ⚠⚠ LE DÉFAUT NE S'EST VU QUE TROIS COUCHES PLUS LOIN

`economie.residus` est un tableau **parallèle** à `disposition`. Retirer une pose
sans retirer son résidu désaligne les deux, et c'est `verifierEtat` qui a parlé,
avec un message d'**économie** pour une faute de **migration** :
`19 résidus pour 16 bâtiments`.

**Cette maladresse de diagnostic a sauvé la partie.** `ui/session.js:683` ne
réécrit la sauvegarde que si le chargement a réussi — `sauvegardeArmee` reste
à `false` quand `charger` lève. Le fichier d'Ethan n'a **jamais** été écrasé :
il était intact sur le disque pendant tout l'incident, et il n'y avait rien à
supprimer. **Il ne faut pas compter dessus deux fois.**

### Ce qui a été corrigé

1. La migration lit **`base.fondation ?? base.position`**, jamais `position`
   seule.
2. Elle **ne supprime plus rien** : un collecteur que le terrain ne tranche pas
   prend le défaut de la vignette (`collecteurQuartz`). Le cas est inatteignable
   — `problemesDeLaPose` refuse `hors-champ` depuis toujours — mais s'il
   survenait, garder le bâtiment avec un identifiant défendable vaut infiniment
   mieux que le jeter : la disposition serait alors **signalée** au chargement,
   et le joueur garderait ce qu'il a construit.

### Et une garde structurelle, pour les migrations à venir

`migrer` encadre désormais **chaque** maillon :

```js
const avant = posesParBase(sauvegarde);
migration(sauvegarde);
…
exigerAucunePerte(avant, posesParBase(sauvegarde), version);
```

`exigerAucunePerte` est **nommée et exportée**, donc mesurable. `MIGRATIONS` ne
l'est pas — et ne doit pas l'être, c'est une table interne : un test qui la
remplacerait laisserait une migration fausse derrière lui si une assertion
tombait au mauvais moment. Le test monte donc **la garde elle-même**.

⚠ Elle dit « **pas moins** », pas « autant ». Une migration a le droit
d'**ajouter** une pose ; exiger l'égalité stricte interdirait un lot légitime pour
attraper une faute qui, elle, est **toujours une perte**. Le message nomme le
maillon fautif et la base fautive — pas l'économie, trois couches plus loin.

### Les deux tests

| Test | Ce qu'il mesure |
| --- | --- |
| **B4 T8** | Une base **déplacée** migre sans perdre un bâtiment, `residus` et `disposition` restent alignés, et **chaque collecteur porte la ressource de son vrai champ** — celui de la fondation. Sans cette seconde moitié, une migration qui garderait tout en mettant `collecteurQuartz` partout passerait. |
| **B4 T9** | La garde lève sur `[16] → [13]` — **le compte exact du défaut d'Ethan** —, laisse passer autant ou plus, ignore une base sans liste (une v9 n'avait pas de `bases`), et **nomme** la base fautive quand il y en a plusieurs. |

⚠ **Ce qui manquait aux montages d'alors tient en une ligne** : ils posaient
tous sur une base **neuve**, où `fondation` et `position` coïncident. La faute
était invisible par construction.

### Poids

Le correctif coûte **281 octets** dans `dist/index.html` :
**8 647 037 → 8 647 318**. La marge T10 passe à **652 682 octets, 7,02 %** —
inchangée au centième. Compte de tests : **1 419 → 1 421**.
