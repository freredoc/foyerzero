# RAPPORT — lot ÉCRANS (10/09/2026)

Huit points d'Ethan du 10/09 — **3, 4, 5, 6, 7, 11, 13 et 14** — tous
d'interface. Le lot ne touche ni `src/sim/`, ni `src/render/`, ni `src/son/`,
ni `art/`, ni `tools/` : **zéro fichier de ces cinq dossiers au diff**, vérifié
par `git diff --name-only`.

---

## 0. Le verdict, mesuré

| | valeur |
|---|---|
| version · build | **0.99.39 · build 141** — le suivant disponible APRÈS la fusion |
| `npm test` | **1550 déclarés · 1549 pass · 0 fail · 1 skipped** |
| le `skipped` | `LIMITE T8`, suspendu par Ethan le 08/09 — **non réparé**, §10 |
| `npm run check` | **sort en 0** |
| `npm run build` | `dist/index.html`, **9 425 421 octets**, **0 référence externe** |
| borne T10 | **9 600 000** (relevée par ART-90, **non touchée ici**) — marge **174 579 octets, 1,82 %** |
| `SAVE_VERSION` | **31** — **pas une ligne de ce lot ne le touche**, vérifié au diff ;
  il est passé de 30 à 31 sur `main`, par RÈGLES-DE-CARTE, pas ici |

⚠⚠ **LA BASE A BOUGÉ SOUS LE LOT, ET TOUT CE QUI SUIT EST REMESURÉ.** `main` est
passé de `14dd4ac` à **`3e68d7b`** pendant l'exécution, Ethan ayant fusionné
SON-ET-ARRIVÉE (#126), RÈGLES-DE-CARTE (#125) puis ART-90 (#124). Le lot est
**remesuré poste par poste contre la base neuve**, pas recopié — précédent
SOL-OUVRAGE. Les nombres de la première livraison (9 147 308, +13 127,
1532 tests, marge 1,64 %) sont **périmés** et remplacés ici.

⚠⚠ **ET LE NUMÉRO DE BUILD ÉTAIT EN COLLISION, CE QUE GIT A FUSIONNÉ EN
SILENCE.** ART-90 a pris **0.99.38 · build 140** ; ce lot avait pris le même,
indépendamment. Les deux côtés portant le MÊME texte, `git merge` n'a rien
signalé — et deux livrables DIFFÉRENTS auraient porté un seul numéro, que
l'enveloppe Android lit par `config.build` et que le manifeste de Pages publie.
Le lot passe donc à **0.99.39 · build 141**.

### Le coût, ventilé poste par poste

Mesuré contre un livrable rebâti dans un `git worktree` depuis
`origin/main` = **`3e68d7b`**, qui rend **9 412 300 octets**.

| poste | avant | après | écart |
|---|---:|---:|---:|
| JavaScript | 401 161 | 402 212 | **+1 051** |
| feuille | 129 497 | 141 917 | **+12 420** |
| balisage | 36 205 | 35 855 | **−350** |
| **images** | 7 652 091 | 7 652 091 | **+0** |
| **audio** | 1 193 346 | 1 193 346 | **+0** |
| TOTAL | 9 412 300 | 9 425 421 | **+13 121** |

**Les cinq postes PARTITIONNENT le fichier des deux côtés** — chacun est NET de
ses `data:`, si bien que leur somme tombe sur le total avant comme après, et pas
seulement parce que les images ne bougent pas. `data:` à **311 lignes / 306 URI
des deux côtés** — aucune ressource n'entre ni ne sort, ce que le §11 du brief
exigeait.

⚠⚠ **ET LE JAVASCRIPT PERD SIX OCTETS À LA FUSION : +1 057 → +1 051.**
`src/ui/monde.js` et `src/ui/raid.js` sont touchés par les DEUX côtés, donc le
livrable fusionné n'est pas la somme des deux diffs. **C'est la mesure qui le
dit, pas l'arithmétique** — et c'est exactement pourquoi un lot dont la base a
bougé se remesure au lieu de se recopier.

⚠⚠ **ET `main` EST ROUGE À L'HEURE OÙ CE LOT SE FUSIONNE — MESURÉ, PAS DÉDUIT.**
Sur un `git worktree` pristine à `3e68d7b`, `dist/` rebâti : **1542 déclarés ·
1540 pass · 1 fail · 1 skipped**, et le rouge est
`documentation — CLAUDE.md §0 annonce le vrai nombre de tests` — la §0 de `main`
annonce **1527**, le dépôt en déclare **1542**. Les trois lots du 10/09 ont
chacun mesuré leur compte contre `14dd4ac`, et aucun n'a remesuré après
l'atterrissage des deux autres. **Ce lot le referme** en écrivant 1550, le compte
mesuré de l'arbre fusionné. ⚠ Le premier relevé de cette base annonçait 20 échecs
et **c'était mon artefact** : `FZ_SORTIE` prend un chemin de FICHIER, donc le
worktree n'avait pas de `dist/index.html` et dix-neuf gardes qui le lisent
tombaient. Rebâti normalement, il en reste **un**, celui ci-dessus.
⚠ Même écart sur la taille : la §0 d'ART-90 annonce **9 410 485**, l'arbre réel
de `main` en rend **9 412 300** — les **1 815 octets** d'écart sont le JavaScript
des deux lots frères, que sa mesure contre `14dd4ac` ne portait pas. **Son bloc
n'est pas réécrit** : il dit ce que son lot a mesuré, et c'est ce qu'un bloc
« Auparavant » doit dire.

⚠⚠ **ET LES ONZE MILLE OCTETS DE FEUILLE SONT DE LA PROSE, MESURÉ.** Sur les
+12 420, **+11 755 sont des commentaires** et **+665 des règles** :
`tools/build.js` inline la feuille TELLE QUELLE, sans retirer les `/* */`. Le
livrable porte aujourd'hui **98 084 octets de commentaires CSS pour 43 833 de
règles**. Ce n'est pas un défaut de ce lot — c'est le régime depuis toujours —
mais c'est le premier qui le mesure, et la marge est à 1,82 %.
**Le levier existe et il est chiffré** : les retirer AU BUILD rendrait ~98 Kio
sans toucher une ligne de source, et la source garderait tout. C'est un lot
d'outillage. **Ethan tranche.**

### Fichiers touchés — aucun n'entre, aucun ne sort

`src/data/base.js` · `src/index.src.html` · `src/ui/chantier.js` ·
`src/ui/monde.js` · `src/ui/offense.js` · `src/ui/raid.js` ·
`src/ui/session.js` · huit fichiers de `test/` · `package.json` · `CLAUDE.md`.

---

## 1. Point 3 — le Chantier sort de la palette

> « Enlever le chantier de construction dans la liste des constructions. »

`ORDRE_PALETTE` passe de **14 à 13** vignettes.

⚠⚠ **ET IL SORT D'UN BOUTON QUI NE POUVAIT PAS AGIR.** Mesuré avant d'écrire :
`chantierDeConstruction` est `unique: true` **ET** posé par `BASE_NEUVE` sur
TOUTE base du joueur — pas seulement la première, c'est l'arbitrage du 26/08.
Sa vignette était donc grisée **en permanence, sur toutes les bases, depuis
toujours**. Ce qu'Ethan fait retirer n'est pas un choix, c'est un bouton mort.

⚠⚠ **LA GARDE DE COUVERTURE CESSE D'ÊTRE « LE ROSTER » ET DEVIENT « LE ROSTER
MOINS `BATIMENTS_DONNES` ».** Une soustraction **NOMMÉE** et **DÉRIVÉE** de
`BASE_NEUVE` — `export const BATIMENTS_DONNES = [BASE_NEUVE.id];` — jamais une
liste écrite à la main. `B4 T7` ne s'est donc pas relâché : « ni un nom en trop,
ni un oublié » vaut toujours, et `EC T1` ajoute que l'union des posables et des
donnés est le roster ENTIER et que leur intersection est vide.

⚠⚠ **ET `BATIMENTS_DONNES` A LEVÉ À L'EXÉCUTION APRÈS AVOIR PASSÉ
`node --check`.** Posé 220 lignes AVANT `BASE_NEUVE`, il y lisait une zone morte
temporelle : `ReferenceError: Cannot access 'BASE_NEUVE' before initialization`.
C'est la leçon §6 du dépôt payée une fois de plus — **un `const` ne se lit pas
avant d'être écrit**, et la syntaxe ne le dit pas. Il vit désormais
immédiatement sous sa source. ⚠ Et le premier jet écrivait `BASE_NEUVE.map(...)`
alors que `BASE_NEUVE` est un OBJET, pas une liste.

⚠ **UNE GARDE EST RETOURNÉE, PAS ASSOUPLIE.** « la palette GRISE un unique déjà
posé » comptait **UNE** vignette grisée sur une base neuve ; elle en exige
**ZÉRO**. Une liste vide seule ne discrimine rien — un `dejaPose` cassé rendrait
`[]` aussi —, donc la falsifiabilité passe par un **CONTRASTE** : la maquette,
elle, en marque toujours plus de zéro, et le test l'asserte dans le même souffle.

⚠ **LE BÂTIMENT RESTE ENTIER** : il garde son niveau, son coût de montée, son
sprite `bat_j_chantier_de_construction` et son plafond sur toute la base. Ce qui
sort est la VIGNETTE.

---

## 2. Point 4 — le journal devient global

> « Bouton rapport a deplacer en haut entre base et mission. »

Un bouton `#tete-rapport`, un panneau `#journal-panneau`, un câblage dans
`ui/session.js`. `#chantier-journal`, `#offense-journal` et leurs **DEUX**
panneaux sortent, avec leur règle de feuille.

⚠⚠ **IL N'EST PAS UN `onglet-`, ET C'EST CE QUI L'ÉCARTE DE
`ONGLET_DE_L_ECRAN`.** Nommé `onglet-rapport`, il aurait été compté parmi les
cinq onglets et aurait cherché un écran qui n'existe pas. La garde de la barre
compte donc **DEUX populations** : cinq `onglet-…` et exactement un
`tete-rapport`. Un septième bouton fait tomber l'une ou l'autre.

⚠⚠ **`vueDuJournal` RESTE DANS `ui/chantier.js`, ET C'EST UN CYCLE QUI L'EXIGE.**
Elle a besoin de `formaterEntier`, `direLaDuree` et `peindreVueDuPanneau`, tous
locaux à ce fichier ; la déménager dans `ui/session.js` aurait fait importer
`session.js` par `chantier.js` — que `session.js` importe déjà. C'est le motif
que `JRN T8` portait déjà depuis le lot JOURNAL, et il tient.

⚠⚠ **`#journal-panneau` EST LE DERNIER ENFANT DE `#jeu`, PAS LE PREMIER.** Les
`.panneau-detail` partagent `z-index: 2` et ne créent **aucun** contexte
d'empilement — `position: relative` sans `z-index` n'en fait pas un —, donc à
égalité c'est le **DERNIER ÉCRIT** qui peint par-dessus. Posé avant `#ecrans`,
le journal serait passé **SOUS** la fiche d'un bâtiment restée ouverte, et
« Fermer » n'aurait rien fermé. `EC T2` mesure la profondeur de `<div>` et
l'ordre, pas la présence.

⚠ **CONSÉQUENCE DÉCLARÉE** : ouvrir le journal ne **FERME** plus la fiche, il la
**RECOUVRE**, et la refermer la rend. C'est un changement par rapport au lot
JOURNAL, où les deux vivaient dans le même conteneur et où l'écran devait fermer
l'un pour ouvrir l'autre. Ce qui motivait ce `fermerPanneau` était qu'un panneau
caché **avalait** les touchers de l'autre ; ici le journal est au-dessus, donc
c'est lui qui les reçoit, et rien n'est volé.

⚠ **ET LE DÉROULÉ D'UN RAID LE REFERME**, par le crochet `pendantLeDeroule` : le
combat masque tout le chrome, et un panneau laissé ouvert serait le seul élément
d'interface à l'écran pendant le raid, son « Fermer » le seul geste possible.

⚠ **LE BUDGET DE 288 PX EST INTACT.** `#tete-rapport` porte `flex: 0 0 32px`,
qui est une **LARGEUR** — il est enfant de `#tete-onglets`, qui est une RANGÉE —
et non une hauteur de barre. L'exception est **NOMMÉE** dans la garde, et deux
assertions la prouvent : `#tete-onglets` est bien `display: flex` sans
`flex-direction: column`, et le balayage **TROUVE** le sélecteur sans le filtre —
sans quoi l'exception protégerait un motif qui ne mord plus.

---

## 3. Point 5 — armer un mode ne recadre plus le décor

> « Appuyez sur réparer décale le sprite et les unités dans l'onglet armée idem
> en préparation raid. »

⚠⚠ **DEUX MOITIÉS, DEUX REMÈDES, ET ILS NE SONT PAS INTERCHANGEABLES.**

`#offense-avis` et `#raid-avis` **quittent le flux** — `position: absolute` plus
`pointer-events: none`, exactement `#chantier-avis` depuis le lot ÉCRAN-DÉFENSE,
qui avait mesuré **44 px volés au champ** ce jour-là. Leurs parents
(`#offense-champ`, `#raid-bas`) gagnent `position: relative` : sans ancêtre
positionné, un `absolute` se cale sur `#ecrans` et la ligne se peint au milieu
de la page — la faute mesurée au lot RECHERCHE-ÉCRAN.

`#chantier-reparation` et `#raid-tout-reparer` portent un **BOUTON**, donc ils
doivent **RECEVOIR** le toucher : ils ne peuvent pas sortir du flux. Ils
**RÉSERVENT** leur place — `.repliee` passe de `hidden` à
**`visibility: hidden`**, qui garde la hauteur là où `display: none` la rend.

⚠⚠ **ET L'ATTRIBUT `hidden` DEVAIT PARTIR DU BALISAGE, PAS SEULEMENT DU CODE.**
La tête de feuille porte `[hidden] { display: none !important }` : un `hidden`
laissé sur l'élément l'aurait emporté sur la classe, et le repli serait resté un
RETRAIT. Les deux naissent donc `class="repliee"`, sans attribut, et `EC T3`
refuse le retour de l'un comme de l'autre.

⚠ **ÉCART DÉCLARÉ : `#chantier-reparation` N'EST PAS DANS LE MOT D'ETHAN.** Il
ne nomme que l'armée et le raid. Le Chantier portait le même défaut, mesuré à
**22 px** par le lot ÉCRAN-DÉFENSE, qui l'avait laissé ouvert en écrivant « Ethan
tranche ». Ce lot le referme dans le même geste, la règle de repli étant
partagée. **Une ligne le rouvre** — retirer `#chantier-reparation` du sélecteur.

---

## 4. Point 6 — « Tout réparer » dans l'onglet armée

> « Rajouter un bouton tout réparer dans l'onglet armée. »

`#offense-tout-reparer` entre à côté de `#offense-reserve`, dans une barre
`#offense-reparation` en `flex: 0 0 auto` — donc **hors du budget de 288 px**,
qui n'énumère que les hauteurs FIXES.

⚠⚠ **IL EST PERMANENT, PAS SOUS MODE.** C'est la différence avec
`#raid-tout-reparer`, replié tant que « Réparer » n'est pas armé : l'écran
d'armée n'a pas de mode « réparation » à ouvrir, et un bouton qu'il faut armer
pour voir est un bouton qu'on ne trouve pas.

⚠⚠ **ÉCART DÉCLARÉ, ET IL ÉTAIT FORCÉ : LE GESTE UNITAIRE GAGNE SON MOTEUR
AUSSI.** Le brief ne demandait que le bouton global ; mais `ACTIONS_ARMEE.reparer`
portait `agir: null` et répondait par une phrase. Un « Tout réparer » qui marche
à côté d'un « Réparer » qui ne fait rien aurait été le pire des deux états. Il
reçoit donc `problemesDeLaReparationDUnePiece` et `reparerUnePiece`, **qui
existent dans `src/sim/reparation.js` depuis le lot RÉSERVE** — pas une ligne de
moteur n'est écrite, c'est du câblage.

⚠⚠ **CONSÉQUENCE : LA BRANCHE `agir === null` DE L'ÉCRAN EST DEVENUE
INATTEIGNABLE.** Les quatre actions ont un moteur. Elle reste écrite — c'est le
précédent d'`effetNonCable` au lot FORMATION-ET-GARNISON, la ligne qui parlera de
la prochaine action écrite avant son moteur — et `EC T4` dit qu'aujourd'hui elle
ne parle de personne.

⚠ **`REPARATION_AILLEURS` DISPARAÎT AVEC SON DERNIER LECTEUR.** Elle disait
« les unités se réparent sur l'écran de raid » : vrai jusqu'à ce lot, faux
depuis. La garder « au cas où » l'aurait fait relire comme une règle.

⚠⚠ **ET LA GARDE QUI LE MESURE A LU MA PROPRE PROSE — NEUVIÈME FOIS DU DÉPÔT.**
Son premier jet cherchait `REPARATION_AILLEURS` dans la source **BRUTE** et
tombait sur les **DEUX** commentaires d'`ui/offense.js` qui nomment la constante
pour dire qu'elle est partie. Elle lit la source **DÉCOMMENTÉE**, avec un appât
dans chaque sens : le commentaire doit exister, et le code doit rester lisible
après filtrage.

---

## 5. Point 7 — les sprites de la barre du bas

> « Sprites trop petit dans la barre du bas construction. »

`#offense-palette .unite i` passe de **26 à 40 px**.

⚠⚠ **LE BRIEF SE TROMPAIT SUR LA PRÉMISSE ET SUR LA CIBLE — MESURÉ.** Il annonce
que la vignette « n'a pas de taille explicite » : elle en a une, **26 px**, depuis
le 30/08. Ce qui manquait, c'est qu'elle n'a pas suivi `.posable i` quand le lot
RETOUCHES l'a portée à 52 le 08/09.

⚠⚠ **ET « ≥ `.posable i` », C'EST-À-DIRE 52, EST GÉOMÉTRIQUEMENT IMPOSSIBLE.**
Calculé avant d'écrire une ligne : la bande fait **86 px** et porte, EN PLUS du
sprite, un **libellé** et un **coût** que celle du Chantier n'a pas.

```
  86      hauteur de #offense-palette          (flex: 0 0 86px)
 − 1      border-top
 − 2 × 5  padding vertical de la bande         (padding: 5px 6px)
 = 75     hauteur de la vignette
 − 2 × 1  liseré de la vignette                (1px dashed)
 − 0      padding vertical de la vignette      (padding: 0 2px — RIEN en vertical)
 = 73     contenu de la vignette
 − 2 × 2  DEUX gap entre TROIS enfants         (gap: 2px)
 = 69
 − 15,4   libellé, pire cas deux lignes        (7px × (1,05 + 1,15), picto compris)
 −  9,2   coût, une ligne                      (8px × 1,15, picto compris)
 = 44,4   disponible pour le sprite
```

À 52 la vignette déborderait de **7,6 px** et serait rognée par
l'`overflow-y: hidden` de la bande. **40** est le plus grand multiple de huit qui
tienne — un sprite de 128 s'y réduit donc d'un facteur entier, ce que le dépôt
cherche partout ailleurs. **Écart déclaré au §5 du brief, et il est
arithmétique.**

⚠⚠ **ET LE PREMIER JET DE CE CALCUL ÉTAIT FAUX DE DEUX PIXELS — IL FAUT LE DIRE
DANS CE SENS-LÀ.** Il retirait un `padding` vertical de `2 × 4` que la règle ne
déclare pas — `.unite` porte `padding: 0 2px` —, oubliait les deux `gap`, et
attribuait au libellé une `font-size` de 11 px là où elle vaut 7. Il rendait
**42,4**. Le CHOIX ne bouge pas : 48 ne tenait ni dans l'un ni dans l'autre, et
40 reste le plus grand multiple de huit qui passe. **Le nombre écrit, si**, et
c'est lui qui sera relu le jour où quelqu'un voudra remonter la vignette.

⚠ `EC T5` exige le NOMBRE, pas « une taille est écrite » : la falsification que
le brief nomme — un test qui resterait vert à 12 px — a été jouée et elle mord.

---

## 6. Point 11 — le toast des gisements devient un pop-up, et le pop-up est la liste

> « Plutôt qu'un toast mieux vaut avoir un pop-up pour les POI et rajouter un
> petit bouton pour voir les POI acquis. Et non acquis avec coordonnées. »

⚠⚠ **LES DEUX MOITIÉS SORTENT DU MÊME GESTE, ET C'EST LA LECTURE DU LOT.** Ethan
demande un pop-up ET de quoi voir les gisements : **le message EST la liste**,
titrée par la nouvelle. Le joueur apprend qu'il vient d'en prendre un et voit
lequel sans un geste de plus. `ouvrirLesPois(annonce = null)` sert le pop-up
(`annonce` non nulle) et le bouton `#monde-poi` (`annonce` nulle) ; un second
chemin aurait donné deux panneaux qui disent la même chose, dont un seul
suivrait le prochain réglage.

`vueDesPois(graine, poisAcquis)` entre — **PURE et EXPORTÉE**, comme
`phraseDesAttaquantes` et `lignesDuBilan`, parce que le dépôt n'a pas de
navigateur. Elle rend les **soixante-dix** gisements dans l'ordre de
`sim/poi.js`, chacun « Acquis » ou à sa coordonnée `rangée · colonne`.

⚠⚠ **ELLE LIT `sim/poi.js`, ELLE NE LE RÉÉCRIT PAS.** La liste vient de
`carteDesPoi`, l'acquisition de `poiEstAcquis` — celle-là même que le moteur
emploie, et qui compare le **TYPE** et la **BANDE**. Recompter ici « ce type est
dans `poisAcquis` » serait juste par accident sur une graine et faux de **neuf
bandes sur dix** : `EC T6` balaie **cinq graines**, et la falsification qui
recompte par type seul tombe.

⚠⚠ **ET L'ORDRE NE SE RECALCULE PAS NON PLUS.** `tirerLesPoi` pose bande par
bande, puis type par type dans l'ordre de `POI` — c'est exactement le `rang` que
`releverLesPoisAcquis` emploie à l'écriture. Trier dans l'écran serait écrire une
seconde fois un ordre qui existe, et deux ouvertures du panneau pourraient rendre
deux listes.

⚠ **IL SE FERME AU BOUTON, JAMAIS À LA MINUTERIE** — « un pop-up qu'on n'a pas
eu le temps de lire est un toast avec un cadre ». La boîte fabriquée à la main
dans `#monde-outils`, sa `minuterieToast` et la fonction `toast()` SORTENT, et
`DUREE_TOAST_MS` n'est plus importé par `ui/monde.js` — un import que plus rien
ne lit est une dépendance qu'on croit vivante.

⚠⚠ **`PC T5` MESURE LES DEUX MOITIÉS DU RETRAIT.** **Aucune minuterie n'est
posée** — donc le retrait est franc, pas contourné par un délai très long — et
faire échoir tout ce qui traîne ne referme rien. L'assertion « il s'efface tout
seul » est **RETOURNÉE**, pas retirée : c'est exactement la propriété qu'Ethan
renverse. Et une assertion **ENTRE** : le bouton « Fermer » referme — sans elle,
« il ne se ferme pas tout seul » serait vrai d'un panneau qu'on ne peut plus
fermer du tout.

⚠⚠ **SIX TESTS EXISTANTS ONT CHANGÉ DE SONDE SANS PERDRE UNE ASSERTION.**
`PC T5` à `PC T10` montaient l'écran par un helper qui **EXIGEAIT** la boîte du
toast. Il surveille désormais les écritures du **TITRE du panneau** — on compte
les ÉCRITURES et non l'état final, l'idiome du double appel de `JRN T6` — et il
**REFUSE le retour d'une boîte de message dans `#monde-outils`**. C'est la
falsification du point 11 prise par l'autre bout : elle fait tomber les six d'un
coup, une fois pour toutes les mesures qui montent cet écran.

⚠ **LE BRIEF SE TROMPAIT SUR DEUX FAITS, MESURÉS** : `#monde-panneau` n'est PAS
un `.panneau-detail` — il a sa propre règle — et `ui/monde.js` n'emploie
`peindreVueDuPanneau` **nulle part** (0 occurrence). On a donc repris le motif
d'`ouvrirRuine`, à la lettre : même titre, mêmes lignes par `peindreLesLignes`,
et tout ce qui appartient à un SITE explicitement refermé — prix, refus,
confirmation, « Déplacer », « Attaquer ». Un bouton « Attaquer » laissé là
pointerait sur le dernier site ouvert, depuis un panneau qui parle de gisements.

⚠ **`#monde-poi` DÉSARME LE DÉPLACEMENT AVANT D'OUVRIR**, comme « Ma base » juste
au-dessus : sans ça, le mode resterait armé derrière la liste et le prochain
toucher sur la carte déplacerait la base.

---

## 7. Point 13 — les sprites de l'arbre de recherche

> « Sprites trop petit dans l'arbre de recherche. »

`#ecran-recherche .sprite` **et** `.pastille` passent de **28 à 44 px**.

⚠⚠ **CE QUI COMPTE N'EST PAS LE NOMBRE, C'EST L'ÉGALITÉ DES DEUX.** La pastille
`◈` d'un module et le sprite d'une pièce tiennent la même colonne d'une rangée ;
régler l'un sans l'autre décale toute la rangée d'un module — c'est la faute que
le commentaire de la pastille annonce depuis le lot RECHERCHE-ÉCRAN, et `EC T7`
la joue.

⚠ **ET LA RANGÉE LE PORTE, MESURÉ.** Le nom d'une pièce et sa description font
deux lignes de 11 px à `line-height: 1,2`, soit **26,4** : c'était déjà le SPRITE
qui gouvernait la hauteur à 28, et il la gouverne encore à 44. La rangée est un
`flex` à `align-items: center` — sa hauteur EST celle de son plus grand enfant,
donc elle grandit avec lui au lieu de le rogner. La ligne passe de **40 à 56 px**.

⚠ **ET LE PANNEAU DÉFILE** (`#recherche-panneaux .panneau`, `overflow-y: auto`),
ce qui est ce qui rend l'agrandissement payable : trente et une lignes plus
hautes ne tiennent pas dans l'écran, et c'était déjà vrai à 28.

---

## 8. Point 14 — le libellé de la palette de l'Offense

> « Sur cette même barre, on ne voit pas bien les noms. »

⚠⚠ **UNE OMBRE, PAS UNE COULEUR — ET C'EST LA MESURE QUI L'A DÉCIDÉ.** Trois
contrastes calculés avant de toucher quoi que ce soit :

| | contraste |
|---|---:|
| os `#F5F3E8` sur le fond `#1E2124` de la bande | **14,53** |
| os `#F5F3E8` sur `#8C9A72`, le ton clair de la rampe kaki | **2,70** |
| os `#F5F3E8` sur une ombre `#161914` | **15,95** |

À 40 px le sprite occupe la moitié de la vignette, et le libellé tombe dessus :
il est sous les **3** qu'un texte de 11 px demande. **Aucune teinte de texte ne
contraste avec la bande sans se perdre dans le sprite** — ce n'est donc pas la
COULEUR qu'il faut changer, c'est le FOND. L'ombre `#161914` des **quatre**
côtés suit le texte où qu'il tombe.

⚠ **AUCUNE TEINTE NEUVE** — `#161914` est l'ombre des pastilles de niveau depuis
le lot RETOUR-DE-RAID. La garde de palette de `banc.test.js` n'a pas bougé.

⚠ **ET LE LIBELLÉ VERROUILLÉ PASSE DE `#68727E` À `#8C9A72`** : cerné de noir,
l'ancien ne se distinguait plus du repos. Contraste sur la bande **3,31 → 5,38**,
et le verrou garde son **second** signal, l'opacité — un seul support de
distinction serait perdu au premier réglage de teinte.

⚠⚠ **ET `#ecran-offense .unite:disabled` ÉTAIT UNE RÈGLE MORTE — MESURÉ.** Le
brief la nomme comme la règle à changer ; or `.unite` ne désigne QUE la vignette
de palette, et `ui/offense.js` n'écrit `disabled` sur aucune — ses deux seules
mentions de ce mot sont les commentaires qui l'interdisent (« la vignette éteinte
n'est pas `disabled` : elle doit répondre au toucher », arbitrage du 28/08).
Elle est **retirée**, avec sa mesure écrite en commentaire à sa place.

⚠ **ET `RET T7` NE POUVAIT PAS ENTRER EN COLLISION** : il lit `border-color`,
jamais `color`. Vérifié avant de toucher au libellé.

---

## 9. Les tests — `EC T1` à `EC T8`

**Huit entrent, zéro sort, le compte passe de 1 524 à 1 532.** Aucune assertion
n'a été retirée ni assouplie.

| test | fichier | montage | verdict |
|---|---|---|---|
| `EC T1` | `batiments-quatre-etats` | les tables `ORDRE_PALETTE` × `VIGNETTES_MIXTES` × `BATIMENTS_DONNES`, plus `dispositionNouvelleBase()` jouée | **PASS** |
| `EC T2` | `chantier` | le balisage produit, par PROFONDEUR de `<div>` et par ORDRE ; la source de `session.js`, décommentée | **PASS** |
| `EC T3` | `chantier` | la feuille décommentée, six règles et deux attributs | **PASS** |
| `EC T4` | `offense` | les tables `ACTIONS_ARMEE` × `MESSAGES_MODE_ARMEE` ; le balisage ; `ui/offense.js` décommenté | **PASS** |
| `EC T5` | `offense` | la feuille : la vignette, la bande qui la porte, et son jumeau du Chantier | **PASS** |
| `EC T6` | `monde` | `vueDesPois` sur **cinq graines** contre `poisDeLaFenetre`, plus une partie jouée par `rattraperJeu` | **PASS** |
| `EC T7` | `recherche` | la feuille : sprite, pastille, rangée, cadre, conteneur défilant | **PASS** |
| `EC T8` | `offense` | le montage de `RET T7`, repris par `regleCss` et non réécrit | **PASS** |

### Les tests existants qui changent de cible — quinze, tous RESSERRÉS

`B4 T7` (la soustraction nommée) · « la palette GRISE un unique déjà posé »
(retournée, falsifiable par contraste) · « palette — UNE bande qui défile » ·
« le HTML produit porte les sept bandeaux » (deux populations de boutons) ·
« le chrome fixe tient dans l'écran » (l'axe des largeurs, nommé et prouvé) ·
`ERGO T7 ter` et `FE T6` (qui gagnent `session.js` — il n'était couvert par
aucun des deux) · `RÉPARER T11` et `RAID-A T5` (qui gagnent la moitié
`visibility` que ce lot achète) · `JRN T8` (**13 → 14 assertions**) ·
`PC T4`, `PC T5`, `PC T6` et le montage des `PC T7`–`PC T10` · `RECH-É T11` ·
« l'onglet Monde est vivant » · « offense — la barre contextuelle » ·
`ERGO T8` · `PAL T10` · `CARTE-B T4`.

⚠ **`JRN T8` A CHANGÉ DE NOM, PAS DE NATURE.** « Défense et Offense passent par
LA MÊME fonction » a cessé d'être vrai — aucun des deux écrans ne porte plus le
journal — et il devient « UNE vue, UN lecteur, UN panneau ». **13 assertions
avant, 14 après.**

### Les dix-neuf falsifications — dix-neuf chutes, zéro muette

| # | falsification | ce qui tombe |
|---|---|---|
| 1 | le Chantier revient dans `ORDRE_PALETTE` | `EC T1`, `B4 T7`, 3 gardes d'écran |
| 2 | `BATIMENTS_DONNES` vidé | `EC T1`, `B4 T7` |
| 3 | le journal repasse AVANT `#ecrans` | `EC T2` |
| 4 | le déroulé ne ferme plus le journal | `EC T2` |
| 5 | `#offense-avis` revient dans le flux | `EC T3` |
| 6 | `.repliee` redevient `display: none` | `EC T3`, `RÉPARER T11` |
| 7 | `hidden` revient sur `#raid-tout-reparer` | `EC T3` |
| 8 | `reparer` reperd son moteur | `EC T4`, « la barre contextuelle » |
| 9 | `#offense-tout-reparer` naît caché | `EC T4` |
| 10 | la vignette redescend à 26 | `EC T5` |
| 11 | la vignette est écrite, mais à 12 px | `EC T5` |
| 12 | l'acquisition se recalcule sur le seul TYPE | `EC T6` |
| 13 | la liste est triée dans l'écran | `EC T6` |
| 14 | la coordonnée disparaît de la liste | `EC T6` |
| 15 | la pastille ne suit pas le sprite | `EC T7` |
| 16 | les deux redescendent ENSEMBLE à 28 | `EC T7` |
| 17 | l'ombre du libellé disparaît | `EC T8` |
| 18 | l'ombre ne cerne qu'un côté | `EC T8` |
| 19 | le verrouillé reprend la teinte du repos | `EC T8` |

Plus les **trois** du point 11, jouées à part : le pop-up se referme à la
minuterie (`PC T5`), le pop-up n'ouvre plus la liste (`PC T5`), la boîte de
message revient dans `#monde-outils` (**les six `PC T5`–`PC T10`**).

⚠ **LA PLUS INSTRUCTIVE EST LA N° 6** : remettre `display: none` sous `.repliee`
fait tomber `EC T3` **et** `RÉPARER T11`, ce qui dit que la garde d'hier mesurait
bien la même chose sous un autre nom.

---

## 10. Les erreurs du brief, mesurées

Cinq, toutes vérifiées par exécution avant d'être écartées.

1. **§5** — « la vignette de l'Offense n'a pas de taille explicite » : **faux**,
   elle porte 26 px depuis le 30/08. Et « ≥ 52 » est **géométriquement
   impossible** : 44,4 px disponibles, calcul au §5 ci-dessus.
2. **§6** — « `#monde-panneau` est un `.panneau-detail` » : **faux**, il a sa
   propre règle ; et `ui/monde.js` n'emploie `peindreVueDuPanneau` **nulle part**.
3. **§8** — « `#ecran-offense .unite:disabled` » : règle **MORTE**, aucune
   vignette ne porte `disabled`.
4. **§9** — « les **six** tests qui lisent `ORDRE_PALETTE` et les **trois** qui
   lisent la barre d'onglets » : **les deux nombres sont intervertis**. Mesuré
   test par test sur `HEAD` — **trois** lisent `ORDRE_PALETTE` (`B4 T7`, « la
   palette GRISE », « UNE bande qui défile ») et **six** lisent la barre
   d'onglets (`chantier` ×3, `offense`, `ASSAUT T6`, `RAID-A T4`). **Les neuf
   sont réécrits ou relus, aucun contourné.**
5. **§9, `EC T3`** — il nomme `#chantier-tout-reparer` comme l'élément qui se
   replie : c'est `#chantier-reparation`, la BARRE, `#chantier-tout-reparer`
   étant le bouton dedans. Le test porte sur la barre.

⚠ **ET `EMPRISE_UNITE` N'EXISTE PAS DANS `src/` — MESURÉ.** Le §10 du brief
interdit de la bouger ; `grep` sur tout `src/` rend **zéro occurrence**. Elle
appartient au lot ART-90 et n'est pas encore au dépôt. Rien à ne pas bouger.

---

## 11. Ce qui n'a PAS été vu — déclaré non exécuté

⚠⚠ **C'EST LE LOT LE PLUS VISUEL DEPUIS LONGTEMPS, ET RIEN DE CE QU'IL CHANGE
N'A ÉTÉ REGARDÉ.** Ni sur appareil, ni dans un navigateur. Nommément :

- **la vignette de l'Offense à 40 px** — le calcul dit 44,4 disponibles ; le
  libellé sur deux lignes, la coupure des noms longs et le coût n'ont pas été vus
  se poser ;
- **le sprite de l'arbre de recherche à 44 px** et la rangée à 56 — la hauteur
  est dérivée de la feuille, pas relevée ;
- **le contraste du libellé sur un sprite RÉEL** : les trois nombres sont
  **calculés** sur des teintes de la palette, et `#8C9A72` est un ton de la rampe
  kaki, **pas un pixel échantillonné** — l'atlas est en WebP et Node n'a pas de
  décodeur (§3 de `CLAUDE.md`) ;
- **la place que le journal prend par-dessus une fiche ouverte**, et le fait
  qu'il reçoive bien les touchers ;
- **le pop-up des gisements et ses soixante-dix lignes** dans un panneau qui
  défile — la hauteur du panneau à soixante-dix lignes n'a été mesurée par
  personne ;
- **la barre `#offense-reparation`** et ce qu'elle prend à la grille des vagues.

Tout ce qui précède est mesuré sur la **FEUILLE**, la **SOURCE**, le **BALISAGE
PRODUIT** et les **fonctions PURES**.

⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni un outil de la chaîne — **zéro fichier de ces deux
dossiers au diff**. Le lancer quand même aurait affaibli la consigne qui dit de
ne le lancer qu'aux lots d'art.

---

## 12. Points ouverts — Ethan tranche

1. **Les 98 084 octets de commentaires CSS du livrable.** La marge T10 est à
   **1,82 %** — la borne vient d'être relevée à 9 600 000 par ART-90, donc elle
   respire, mais le poste ne se réduit pas tout seul. Les retirer AU BUILD
   rendrait ~98 Kio sans toucher une ligne de source. C'est un lot d'outillage.
2. **`#chantier-reparation` sorti du flux** est un écart au mot d'Ethan, qui ne
   nommait que l'armée et le raid. Réversible en retirant un sélecteur.
3. **Ouvrir le journal recouvre la fiche au lieu de la fermer.** Voulu et
   déclaré ; si Ethan préfère l'ancien comportement, c'est un `fermerPanneau()`
   dans l'écouteur de `#tete-rapport`.
4. **La vignette de l'Offense à 40 px plafonne à 44,4.** Aller plus haut demande
   de retirer le libellé ou le coût de la bande — c'est une décision
   d'interface, pas un nombre.
5. **Le pop-up des gisements s'ouvre sur SOIXANTE-DIX lignes.** Une acquisition
   annonce donc la carte entière. Le filtrer (« les non acquis seulement », « la
   bande courante seulement ») est une décision de jeu.
6. **`LIMITE T8` reste suspendu**, non réparé — §10 du brief.
