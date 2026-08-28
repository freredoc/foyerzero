# RAPPORT — lot STOCKAGE-ET-VOISINAGE

Premier des trois lots répondant à la liste du 28/08 (quatorze points). Celui-ci
prend les **chiffres et les règles** ; les deux suivants prendront la mise en
page, puis la pose et le déplacement. Le découpage et ce qui reste sont au §7.

**Version produite : 0.21.0 · build 22.** `dist/index.html` : 151 187 →
**153 506 octets** (+2 319), SHA-256
`825923497d0b563ff377d7db6aa322566a1e1ebb7da5c80ddf2737df3de1a130`, 0 référence
externe. `SAVE_VERSION` **inchangée à 6**.

**Suite : 321 → 326 pass / 0 fail** — cinq tests ajoutés, sept réécrits, aucun
retiré ni assoupli. `audit-maquette.mjs` : **vert** (la maquette a suivi la
nouvelle courbe, sinon il serait rouge).

**APK hors ligne : confirmé par Ethan.** Les marges système du lot précédent
tiennent, en haut comme en bas.

---

## 1. La courbe de stockage — et deux mesures qui doivent te revenir

> « courbe stockage raffinerie et accumulateur chelou, on reprend ces chiffres :
> niv 1 : 15 pour accu, 20 pour raff, amélioration x2 jusqu'au niv 10, puis
> courbe linéaire pour atteindre x1,333 au niv 50 »

**Écrit tel quel.** `STOCKAGE` porte maintenant quatre constantes — la capacité
de niveau 1 par bâtiment, le multiplicateur de départ, le niveau de bascule, le
multiplicateur du plafond — et `capaciteDuNiveau` les applique palier par
palier. `1,333` est pris **littéralement** : `4/3` en diffère de 1 % au niveau
50, et ce n'est pas à moi de choisir. Une ligne à changer si tu voulais la
fraction ronde.

C'est une **rupture, pas un réglage** : la capacité ne se déduit plus du débit du
producteur apparié, donc `STOCKAGE.autonomieHeures` disparaît avec le principe
qu'il portait.

### ⚠ Mesure n° 1 — l'autonomie n'est plus constante, et l'écart est énorme

Capacité d'une raffinerie face à un collecteur du même niveau :

| niv | ancienne | autonomie | **nouvelle** | autonomie |
|---|---|---|---|---|
| 1 | 2 880 | 12,0 h | **20** | **5 min** |
| 5 | 7 032 | 12,0 h | 320 | 33 min |
| 10 | 21 456 | 12,0 h | 10 240 | 5,7 h |
| 20 | 199 836 | 12,0 h | 6 536 863 | 16 j |
| 50 | 161 429 580 | 12,0 h | **4 752 154 949 956** | **41 ans** |

C'est cohérent avec ce que tu demandes — le stockage devient l'investissement
qui structure la partie — mais l'ouverture est **beaucoup plus serrée**. Sur une
base neuve, mesuré :

| Geste | Stocks | Capacités | Emplac. |
|---|---|---|---|
| base neuve | 30 / 30 / 20 | 50 / 50 / 40 | 1 / 2 |
| Chantier → niv. 2 (8 quartz) | 22 / 30 / 20 | 63 / 63 / 50 | 1 / 4 |
| + Collecteur sur un champ | 22 / 30 / 20 | 63 / 63 / 50 | 2 / 4 |
| + Raffinerie voisine | 22 / 30 / 20 | **83** / 83 / 50 | 3 / 4 |
| après 1 h | **83** (saturé) | 83 / 83 / 50 | 3 / 4 |

Une raffinerie de niveau 1 apportait 2 880 de capacité ; elle en apporte **20**,
c'est-à-dire moins que la poche du Chantier. **L'ouverture ne se joue donc plus
en POSANT une raffinerie mais en la MONTANT** — ses premiers paliers coûtent 2,
3 puis 4 quartz et doublent la capacité à chaque fois, ce qui reste payable sous
un plafond de 83. La boucle est vérifiée par simulation, pas supposée. Elle
tient, mais elle est étroite.

Conséquence mesurée aussi sur la base de la MAQUETTE (onze bâtiments, Chantier
de niveau 6) : sa capacité en quartz passe de **7 185 à 473**, et elle **sature
en treize minutes**. Un test l'asserte pour que personne ne le découvre sur son
téléphone.

### ⚠⚠ Mesure n° 2 — la courbe frôle le mur arithmétique

C'est le point sur lequel je te demande de trancher, parce qu'il n'est pas
rattrapable par de l'interface.

| multiplicateur au plafond | raffinerie niv 50 | ×20, en milli | marge sous l'entier sûr |
|---|---|---|---|
| **1,333 (le tien)** | 4,75 × 10¹² | 9,50 × 10¹⁶ | **0,1 — dépasse** |
| 1,25 | 1,53 × 10¹² | 3,07 × 10¹⁶ | 0,3 — dépasse |
| 1,20 | 7,58 × 10¹¹ | 1,52 × 10¹⁶ | 0,6 — dépasse |
| 1,15 | 3,68 × 10¹¹ | 7,35 × 10¹⁵ | 1,2 |
| 1,10 | 1,75 × 10¹¹ | 3,50 × 10¹⁵ | 2,6 |
| *ancienne courbe* | *1,61 × 10⁸* | *3,2 × 10¹²* | ***2 815*** |

**Une seule raffinerie de niveau 50 occupe 53 % de l'entier exact de
JavaScript ; deux le dépassent.** Et le facteur dominant n'est pas la queue de
courbe : c'est le **× 2 des dix premiers niveaux**, qui vaut × 512 à lui seul —
même à 1,10 au plafond, vingt raffineries ne laissent que 2,6 fois de marge.

**Ce que j'ai fait en attendant ton arbitrage** : `capacitesMilli` **écrête** à
`CAPACITE_MILLI_MAX` au lieu de laisser la somme dériver. C'est le contraire du
choix fait pour `DEBIT_MILLI_PAR_HEURE_MAX`, qui LÈVE — et la différence se
justifie : un débit qui déborde fausse le rattrapage en silence, alors qu'une
capacité qui déborde ne fausse rien, elle borne. Lever ferait planter la partie
d'un joueur qui a simplement bien joué.

**Les quatre constantes de `STOCKAGE` sont la seule chose à changer** si tu veux
redresser la courbe. Dis-moi le nombre, c'est une ligne et les tests suivent.

---

## 2. Deux bâtiments uniques ne peuvent pas être voisins

> « Les bâtiments unique ne peuvent être placer à côté d'un autre bâtiment
> unique. »

Écrit dans `problemesDeDisposition`. « À côté » est le voisinage de
`casesVoisines`, les huit cases — **jamais une seconde notion de voisinage** :
le bonus de proximité et cette interdiction doivent parler du même 3 × 3, sinon
le joueur apprendrait deux géométries pour le même mot. Sept des onze bâtiments
sont uniques, donc la règle force la base à s'étaler.

### ⚠ Elle aurait rendu TA partie injouable, et c'est mesuré

`verifierEtat` LÈVE là où `problemesDeDisposition` rend une liste — c'est la
bonne règle : au chargement, une disposition illégale est un fait de programme.
Mais elle a une limite : **une règle ajoutée après coup rend illégales des bases
qui étaient légales quand le joueur les a construites.**

Ta capture du 28/08 à 17 h 38 porte le **Centre de commandement, le QG de
défense et le Chantier côte à côte**. Les trois sont uniques. Sans précaution,
ta sauvegarde aurait cessé de se charger.

D'où `CODES_TOLERES_AU_CHARGEMENT` dans `sim/state.js`, qui ne contient que
`uniques-voisins`. **Toléré n'est pas effacé** : le défaut reste signalé, et il
interdit toujours toute NOUVELLE pose au contact d'un unique — parce que
`problemesDeLaPose` ne filtre que les défauts *préexistants*. Vérifié de bout en
bout : ta base se charge, une Caserne posée au contact du Chantier est refusée
avec les trois raisons nommées, une Centrale au même endroit passe.

L'ensemble doit rester minuscule : un code **structurel** — `sans-chantier`,
`superposition`, `hors-base` — n'a jamais été légal, donc aucune sauvegarde
honnête ne le porte, et le tolérer ferait tourner le moteur sur un état
incohérent. Un test l'asserte de face, et vérifie qu'une superposition fait
toujours lever le chargement.

---

## 3. Le chronomètre d'amélioration

> « Onglet bâtiment : quand l'amélioration n'est pas possible, indiquer un
> chronomètre. Si le stock requis est sous le seuil du stockage maximum. »

Ta seconde phrase est la condition, et elle porte tout : un coût plus grand que
la capacité de la base **n'arrivera jamais**, et un compte à rebours dessus
tournerait sans atteindre zéro. `delaiAvantAmelioration` rend donc quatre
réponses distinctes, et le bouton du panneau les dit :

```
il manque 10 de quartz · dans 2 min 30 s          ← ça arrive
il manque 253 440 de quartz · le stockage de
   quartz est trop petit pour ce palier            ← un mur, pas une attente
il manque 8 de quartz · rien n'en produit          ← ni l'un ni l'autre
8 quartz                                           ← payable tout de suite
```

Le délai est le **maximum sur les ressources, pas leur somme** — les trois
montent en parallèle, c'est la dernière à arriver qui décide — et il s'arrondit
**vers le haut** : annoncer une seconde de moins ferait cliquer sur un refus.

Au passage : le moteur écrivait « il manque 63 340 **de** électricité ». Corrigé
— la préposition voyage maintenant avec le nom dans la table, plutôt que par une
règle d'élision qui se tromperait au premier h aspiré.

---

## 4. Les pastilles de case libre sont parties

> « Supprimer les petits carrés en haut a droite qui montrent place disponible
> bâtiment »

Retirées. Elles dessinaient un NOMBRE à des endroits qui n'avaient rien à voir
avec les cases que tu choisirais réellement ; « Emplac. 3 / 4 », remis hier dans
le bandeau des ressources, dit la même grandeur sans mentir sur la géométrie. La
grandeur reste calculée — c'est le dessin qui part, pas le plafond.

---

## 5. Un unique déjà posé est grisé, pas retiré

> « Quand on pose un bâtiment unique, griser le bouton, pas le faire
> disparaitre. »

`posablesDeLaBase` rend maintenant les onze bâtiments, tout le temps, avec un
champ `dejaPose`. La palette ne change donc plus de longueur d'une pose à
l'autre — c'était le vrai défaut : les vignettes se déplaçaient sous le doigt
entre deux gestes.

**Et la vignette grisée répond quand on la touche** : « Le Chantier de
construction est unique, et il est déjà posé. » Un bouton inerte n'apprend
rien ; « un indice n'est pas une interdiction » (CLAUDE.md §4).

---

## 6. Tests — et deux gardes que la falsification a corrigées

**Cinq tests ajoutés, sept réécrits, aucun retiré ni assoupli.**

| Test | Résultat |
|---|---|
| `base — capaciteDuNiveau suit la courbe arbitrée le 28/08, palier par palier` | PASS (réécrit) |
| `base — la capacité de niveau 50 FRÔLE l'entier sûr, et l'écrêtage est là pour ça` | PASS (réécrit) |
| `disposition — deux bâtiments uniques ne peuvent pas être voisins` | PASS (ajouté) |
| `état — une règle née APRÈS les sauvegardes ne rend pas une partie illisible` | PASS (ajouté) |
| `panneau — le chronomètre dit QUAND, ou pourquoi il n'y en aura pas` | PASS (ajouté) |
| `panneau — un délai se lit, il ne se compte pas en secondes` | PASS (ajouté) |
| `écran — les pastilles de case libre ont quitté la grille, pas le calcul` | PASS (ajouté) |
| `chantier — la palette GRISE un unique déjà posé, elle ne le retire plus` | PASS (réécrit) |

Les réécritures portent toutes sur des tests qui assertaient l'**ancienne
courbe**. Là où le nombre en dur ne mesurait rien de plus que la table, il a été
remplacé par `capaciteDuNiveau(...)` — c'est `base.test.js` qui asserte la
courbe, palier par palier, et les autres tests mesurent la STRUCTURE de la somme
(par ressource, plus la poche). Là où il mesurait quelque chose, il a été
recalculé, pas supprimé.

Un test a changé d'horizon et il faut le dire : `un tick de jeu fait monter le
stock que l'écran affiche` bouclait une heure, or la base de la maquette **sature
maintenant en treize minutes** — une heure de boucle ne mesurait donc plus « le
stock monte » mais « le stock est plein », ce qui est vrai de n'importe quel
code, cassé compris. L'horizon est passé à six minutes, **et la saturation est
assertée à part** : c'est un fait neuf, il mérite sa garde.

### Falsification — treize mutations, une à la fois

Restauration par copie, sources byte-identiques en fin de campagne (vérifié).

| Mutation | Verdict |
|---|---|
| courbe : × 3 au lieu de × 2 | ROUGE ✔ |
| courbe : le plafond réécrit en dur (50) au lieu de `GEOGRAPHIE` | ROUGE ✔ |
| écrêtage des capacités retiré | ROUGE ✔ |
| règle des uniques voisins retirée | ROUGE ✔ |
| tolérance au chargement vidée (ta partie ne charge plus) | ROUGE ✔ |
| tolérance élargie à une faute structurelle | ROUGE ✔ |
| chronomètre arrondi vers le bas | ROUGE ✔ (après correction du montage) |
| condition de capacité ignorée | ROUGE ✔ |
| unique posé retiré de la palette | ROUGE ✔ |
| pastilles de case libre rétablies | ROUGE ✔ |

⚠ **Une garde ne mordait pas, et c'est mon montage qui était en cause, pas le
code.** Le test du chronomètre partait d'une caisse à zéro : le manque valait
exactement 10 000 milli contre 240 000/h, la division tombait juste, et
`Math.floor` rendait alors le même nombre que `Math.ceil`. Le test passait sur
les deux codes. **Un montage qui tombe rond ne mesure pas un arrondi** — corrigé
en mettant un milli en caisse, ce qui suffit à séparer les deux.

---

## 7. Ce qui reste de ta liste, et pourquoi en trois lots

Ta liste fait quatorze points. Les faire d'un bloc donnerait un diff de plus de
deux mille lignes touchant tout l'écran, que ni toi ni moi ne pourrions relire
sérieusement. Découpage :

**Lot suivant — MISE EN PAGE**
- les deux rangées de cinq boutons de la palette tiennent dans l'écran ;
- onglet **Mission** entre Recherche et Chantier, et **Chantier → Base** ;
- Base / Défense / Offense prennent toute la barre du bas ; la version du jeu
  part dans les Options (⚠ elle porte le geste qui ouvre le banc d'essai — les
  Options doivent donc devenir un écran réel, sinon le banc devient
  inatteignable et un test tombe) ;
- barre de navigation entre bases, flèches gauche et droite, sous les
  ressources ;
- le compteur change de grandeur en Défense et en Offense.

**Lot d'après — POSE ET DÉPLACEMENT**
- pose en deux temps : premier toucher = fantôme + flèches de voisinage, second
  toucher = pose ; les mêmes flèches à l'ouverture du panneau ;
- déplacer un bâtiment, bouton entre Améliorer et Démolir.

### ⚠ Trois points de ta liste que l'état du jeu ne permet pas encore

Je préfère te le dire maintenant plutôt que de livrer une coquille de plus.

1. **« Déplacer une défense / des unités d'attaque »** — l'état ne porte NI
   garnison NI armée d'assaut. `ui/defense.js` et `ui/arsenal.js` sont des
   éditeurs dont rien n'est sauvegardé. Le déplacement de **bâtiments** se fera ;
   les deux autres attendent que la forme de cet état soit arbitrée.
2. **« En Défense, le nombre d'emplacements devient les points de défense ;
   idem en Offense »** — mêmes raisons. Le compteur peut changer de LIBELLÉ, mais
   la valeur sera « — » tant qu'il n'y a rien à compter. Un chiffre inventé
   serait pire qu'un tiret.
3. **Les flèches de bascule entre bases** — le joueur n'a qu'UNE base. Elles
   seront dessinées et inertes, et le diront, comme l'écran Offense.

### Et une question ouverte de ma part

**Le multiplicateur du plafond de la courbe de stockage** (§1, mesure n° 2). Ta
valeur dépasse l'entier exact ; j'ai posé un écrêtage pour que rien ne dérive en
silence, mais c'est un mur, pas une réponse. Un nombre de ta part et c'est
réglé.

---

## ⚠ Vérifications appareil — NON EXÉCUTÉES

Le dépôt n'a ni jsdom ni navigateur.

1. **La courbe.** Sur ta partie existante, les capacités doivent avoir chuté
   (raffinerie de niveau 3 : 80 au lieu de 4 500). Rien ne doit être **perdu** :
   un stock au-dessus du nouveau plafond est GELÉ, pas amputé.
2. **Ta sauvegarde se charge.** C'est la vérification la plus importante du lot :
   tes trois uniques côte à côte ne doivent pas empêcher la partie de s'ouvrir.
3. **Poser un unique** au contact d'un autre : refusé, avec les deux noms.
4. **Le chronomètre** : vider la caisse, ouvrir le panneau du Chantier, voir le
   compte à rebours descendre seconde par seconde.
5. **La palette** : le Chantier y est grisé ; le toucher dit pourquoi.
6. **Les pastilles** ont disparu de la grille, et « Emplac. » est toujours là.
