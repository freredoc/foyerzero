# RAPPORT — lot FICHES-ENNEMIES

Retours d'Ethan du 07/09, points **7** et **8** : « En prépa raid, possibilité de
cliquer sur une unité ennemie pour voir ses stats », et « **idem pour les
bâtiments** ».

**Version produite : `0.99.27` · build `129`.** Les deux restent des **chaînes
JSON** — `android/app/build.gradle.kts` les lit `as String`, et un nombre fait
tomber le build Android à la CONFIGURATION, avant le moindre test.

---

## 0. Le compte, d'abord

| Grandeur | Avant | Après |
|---|---|---|
| `npm test` | **1 386 pass / 0 fail** | **1 397 pass / 0 fail** |
| `dist/index.html` | **8 350 024** octets | **8 352 389** octets |
| Références externes | 0 | 0 |
| Lignes `data:` | 297 | 297 |
| URI `data:` | 292 | 292 |
| `SAVE_VERSION` | 28 | **28** |
| version · build | 0.99.26 · 128 | **0.99.27 · 129** |

**Coût +2 365 octets**, mesuré poste par poste contre un livrable **rebâti dans
un `git worktree`** depuis le commit précédent (`b403a3c`, lot RETOUCHES) :

| Poste | Écart |
|---|---|
| JavaScript | **+2 029** |
| feuille | **+0** |
| balisage | **+336** |
| images | **+0** |
| audio | **+0** |
| **somme des cinq** | **+2 365** |

La somme des cinq postes tombe **exactement** sur le total. Borne T10 **inchangée
à 9 300 000**, marge **947 611 octets, 10,19 %**.

⚠⚠ **LA FEUILLE NE GAGNE PAS UN OCTET, ET C'EST LA MESURE DU LOT.** Le brief
l'annonçait — « ce lot fournit des sections et des paires, il n'écrit pas une
ligne de mise en page » — et le poste `feuille` le prouve à l'octet : la fiche
d'une cible ennemie porte la classe `panneau-detail`, qui existe depuis le lot
PANNEAU-ET-MARGES, et **rien d'autre**. Les 336 octets de balisage sont le `div`
du panneau et son commentaire ; les 2 029 de JavaScript sont `ficheDeLEntite`, le
câblage du toucher et le déménagement de deux fonctions.

---

## 1. ⚠⚠ LA PREUVE DU PARTAGE — TROIS FICHES, UN SEUL RENDU

C'est la demande centrale du §1 du brief, et elle se lit dans la source :

```
$ grep -rn "peindreVueDuPanneau(" src/ --include=*.js | grep -v "export function"
src/ui/chantier.js:4916:    peindreVueDuPanneau(doc, {
src/ui/offense.js:1128:    peindreVueDuPanneau(doc, {
src/ui/raid.js:1401:    peindreVueDuPanneau(doc, elementsFiche, ficheDeLEntite(…));
```

**Trois appels, une seule définition**, dans `src/ui/chantier.js`. Le commentaire
que le lot ÉCRAN-DÉFENSE avait laissé — « la fiche d'une cible ennemie, que les
points 7 et 8 du 07/09 demandent, l'appellera comme les deux autres » — est tenu
à la lettre, et `ÉD T8 ter` n'a pas eu à changer d'une virgule : il exigeait déjà
qu'il n'y ait **qu'un** rendu de paires dans tout `src/ui/`, et il l'exige encore.

⚠⚠ **ET LES DEUX VUES ONT LA MÊME FORME, MESURÉE ET NON AFFIRMÉE.** Confrontation
d'une Casemate de niveau 12 en **garnison du joueur** et de la même Casemate au
niveau 12 dans la **défense d'un site de l'Ouvrage** :

| | fiche JOUEUR | fiche ENNEMIE |
|---|---|---|
| sections | `Au combat` · `La pièce` | `Au combat` · `La pièce` |
| lignes | PV · les trois dégâts · Portée · **Points engagés** · État | PV · les trois dégâts · Portée · **Classe** · État |
| clés de la vue | `titre` `picto` `sections` `bouton` | `titre` `picto` `sections` |

**Six lignes sur sept sont communes, mot pour mot**, et les deux titres de
section sont identiques. `FE T7` le mesure des DEUX côtés : il monte une pièce de
garnison du joueur, en tire les libellés par `lignesDeLaPiece(apercuDeLaPiece(…))`,
et exige que la fiche ennemie dise exactement les mêmes.

⚠ **LES PICTOGRAMMES N'ONT PAS ÉTÉ RECÂBLÉS**, comme le brief l'exigeait : la vue
porte une clé `picto` par ligne, `creerPictogramme` est posé par le rendu, et
`PICTOGRAMME_DE_LA_COLONNE` est **importé** de `ui/chantier.js`, jamais retapé.

---

## 2. Les deux écarts de contenu, et pourquoi

⚠ **« POINTS ENGAGÉS » NE PASSE PAS CÔTÉ ENNEMI — LECTURE DÉCLARÉE.** C'est le
prix d'une pièce dans le BUDGET D'ARMÉE du joueur. L'Ouvrage n'a pas de budget
que le joueur puisse lire, et afficher le prix qu'aurait cette pièce **chez lui**
serait un nombre vrai qui répond à une question que personne ne pose. Le §2 du
brief interdit déjà de répéter le butin, la force de défense et le coût en points
d'attaque ; celui-ci relève de la même famille et se déclare.

⚠⚠ **« CLASSE » ENTRE, ET ELLE N'EST PAS DANS LA FICHE DU JOUEUR — LECTURE
DÉCLARÉE AUSSI.** Le brief la demande explicitement (« châssis ») pour le point 7,
et elle a une raison propre au camp d'en face : le joueur connaît le châssis de sa
propre pièce, il l'a choisie dans une palette qui les range par famille ; d'une
pièce ennemie il ne sait rien. **Et elle sert les DEUX points d'un seul libellé** —
`classeDe(genre, id)` rend le châssis d'une unité, le type d'un ouvrage ET
`batiment` pour un bâtiment, si bien que la même ligne répond au point 7 et au
point 8 sans qu'un `if` sur le genre soit écrit à l'écran.

⚠ **AUCUN CHAMP N'A MANQUÉ.** Les sept lignes se lisent toutes dans l'entité de
combat ou dans sa ligne de roster : `pvMaxMilli`, `pvMilli`, `degatsColonne`,
`niveau`, `id`, `genre`, `proprietaire` pour l'entité ; `portee` et `porteeMini`
pour la ligne. **Pas un nombre n'a été estimé, ni moyenné, ni arrondi « pour
faire joli ».**

---

## 3. ⚠⚠ RIEN QUI NE SORTE DU MOTEUR, ET C'EST MESURÉ AU NOMBRE PRÈS

Une Carapace de niveau 20 dans la garnison d'un camp, relevée **à l'écran dans
Chromium** :

| Ligne | Affiché | D'où il vient |
|---|---|---|
| Points de vie | **4 893** | `pv: 800` × `facteurMilli(20) = 6 116` ‰ = 4 892 800 milli |
| Contre l'infanterie | **24** | `degats.infanterie: 4` × 6 116 ‰ |
| Contre les véhicules | **214** | `degats.vehicule: 35` × 6 116 ‰ |
| Contre les structures | **37** | `degats.structureOuAviation: 6` × 6 116 ‰ |
| Portée | **1,5 cases** | `portee: 1.5` — la portée ne suit PAS le niveau |
| Classe | **Escouade** | `NOMS_CLASSE[classeDe('unite', 'carapace')]` |
| État | **intacte** | `pvMaxMilli - pvMilli === 0` |

Les quatre premiers nombres sont **la table multipliée par l'échelle de niveau**,
pas la table : c'est ce que `FE T3` mesure, en montant la MÊME pièce à deux
niveaux et en exigeant que les nombres diffèrent. La falsification qui lit
`ligne.pv` au lieu d'`entite.pvMaxMilli` le fait tomber ; celle qui lit
`ligne.degats` au lieu d'`entite.degatsColonne` aussi.

⚠ **LES PV SE LISENT SUR LE MAXIMUM, ET L'AVARIE EST UNE PART.** « Points de
vie » annonce `pvMaxMilli` — ce que la pièce vaut entière — et l'état dit
séparément « N % de dégâts ». Un site déjà entamé se lit donc ici, ce qui est
exactement ce qui sert au joueur qui revient dessus. Écrire les PV COURANTS à la
place ferait deux fois la même information et perdrait la référence.

⚠ **UN ZÉRO SE DIT « — », JAMAIS « 0 ».** C'est la convention de la fiche du
joueur, reprise à la lettre : un Merlon rend « Contre l'infanterie : — », ce qui
se lit « ce mur ne tue rien », là où « 0 » se calcule. **Mesuré à l'écran sur le
Nœud et la Gangue** : les trois lignes rendent le tiret.

---

## 4. ⚠⚠ CE QUI DÉCIDE QU'UNE PIÈCE TIRE EST `porteeQuiTire`, ET RIEN D'AUTRE

Le point 8 demande « ce que la pièce fait — une tourelle tire, un merlon non ».
Un `entite.genre === 'defense'` écrit dans l'écran aurait été une **seconde
règle** : il mentirait sur la **Ronce**, qui porte une portée de 1 et FRANCHIT
sans jamais tirer, et sur le **Merlon**, qui est rangé exactement comme une
tourelle. `render/portee.js` porte déjà l'unique écriture des trois conditions de
`peutTirer` — pas de table de dégâts, portée nulle, table entièrement à zéro — et
c'est elle que la fiche appelle.

Conséquence, **relevée à l'écran dans Chromium** :

| Pièce | Classe | Portée | Portée minimale |
|---|---|---|---|
| Casemate · niv. 20 | Tourelle | **2,5 cases** | *(absente)* |
| Batterie · niv. 20 | Tourelle | **2,5 cases** | *(absente)* |
| Créneau · niv. 20 | Tourelle | **2,5 cases** | *(absente)* |
| Merlon · niv. 20 | **Mur** | *(absente)* | *(absente)* |
| Herse · niv. 20 | **Barrière** | *(absente)* | *(absente)* |
| Nœud · niv. 20 | **Bâtiment** | *(absente)* | *(absente)* |
| Meute · niv. 20 | Escouade | **1,5 cases** | *(absente)* |

Le Merlon et la Herse ont pourtant, l'un une portée nulle, l'autre **une portée
de 1 qui ne sert qu'à franchir** : les deux se taisent, et c'est `porteeQuiTire`
qui le décide. Un `genre === 'defense'` aurait donné une portée à la Herse.

⚠⚠ **ET LA LIGNE « PORTÉE MINIMALE » N'A PAS ÉTÉ VUE DANS CHROMIUM — DÉCLARÉ.**
Les trois seules pièces qui la portent sont les artilleries (`faucheuse`,
`mortier`, `harpon`, `porteeMini: 3.5`), et **la garnison du camp joué n'en
comptait aucune** : les douze titres ouverts sont trois tourelles, un mur, une
barrière, quatre unités et deux bâtiments. La ligne est mesurée **hors ligne**
par `FE T10`, qui monte une Faucheuse et une Casemate dans le même combat ; elle
n'est pas mesurée à l'écran, et ça se dit.

⚠ **LA PORTÉE MINIMALE NE SE DIT QUE SI ELLE EXISTE.** Les trois artilleries
portent `porteeMini: 3.5` — elles ne couvrent pas leur propre case — et une
tourelle n'a pas d'angle mort : « Portée minimale : 0 cases » ferait chercher un
trou qu'il n'y a pas. `FE T10` monte une artillerie ET une tourelle et exige la
ligne sur l'une, son absence sur l'autre ; la falsification qui passe le test à
`>= 0` le fait tomber.

⚠ **ET LA VIRGULE, PAS LE POINT.** `String(2.5)` rend « 2.5 », qui est de
l'anglais. Même écriture que la fiche du joueur.

---

## 5. Le chemin toucher → case, et d'où il vient

Le brief exige de **relever** comment l'écran fait déjà correspondre un toucher à
une case, et de réutiliser ce chemin. Relevé :

```
$ grep -rn "caseDepuisPixels" src/ --include=*.js | grep -v "^src/render/projection.js"
src/ui/banc.js:650:    const cible = caseDepuisPixels(
src/ui/raid.js:1539:      ouvrirLaFicheSur(caseDepuisPixels(
```

C'est **`caseDepuisPixels` de `render/projection.js`**, la réciproque exacte de
`xDeColonne` et `yDeRangee` qui ont servi à dessiner, et le chemin que
`src/ui/banc.js` emploie depuis le lot 3A. Il y a donc **deux appelants et une
seule écriture** ; refaire la division dans l'écran de raid en aurait fait une
seconde, et la première divergence se lirait comme un doigt qui désigne la
voisine.

⚠⚠ **ET LES DEUX DÉCALAGES NE S'AJOUTENT PAS — TROUVÉ PAR UN TEST, PAS PAR
RELECTURE.** La première écriture passait `(clientX − cadre.left) × dpr +
decalageX`. Ils sont **DÉJÀ** dans `projection` : `calculerProjection` les reçoit
et les replie dans `margeX` et `margeY` — **mesuré, `margeY` passe de 54 à −546**
quand on lui donne le décalage de l'ouverture. Les rajouter les comptait DEUX
FOIS, et le doigt désignait une case cinq rangées plus haut : le premier balayage
de `FE T1` n'atteignait aucune pièce des rangées 9 et 10. La falsification qui
les remet fait tomber `FE T2` et `FE T9`.

⚠ **TROIS PIXELS DE TOLÉRANCE, LE MÊME NOMBRE QUE `ui/monde.js`.** Un doigt ne se
pose jamais parfaitement immobile ; au-delà, le geste est un promenage de la vue
et n'ouvre rien. La falsification qui retire `aGlisse` fait tomber `FE T9`.

⚠ **ET UN PINCEMENT NE VAUT PAS UN TOUCHER.** `pointercancel` passe par le même
`relacher` avec `toucher: false` : le navigateur annule les contacts dès qu'il
prend la main sur le geste, et sans cette garde tout pincement finirait par ouvrir
la fiche de la case du premier doigt.

---

## 6. Une case vide n'ouvre rien, et ne ferme rien

**Comportement retenu**, comme le §3 du brief l'exige : `ouvrirLaFicheSur` sort
silencieusement quand la case ne porte aucun occupant. **Elle ne referme pas non
plus la fiche déjà ouverte.**

⚠ **LE MOTIF.** Fermer sur une case vide ferait de chaque doigt mal posé une
perte d'information — les pièces sont serrées, les cases font 36 pixels CSS au
plancher du zoom, et un toucher qui rate d'un demi-doigt effacerait ce que le
joueur venait de lire. Il y a un bouton « Fermer » pour ça, et il est le seul
chemin de fermeture au doigt.

⚠ **`FE T9` MESURE LES DEUX MOITIÉS** : il balaie le canevas pixel par pixel,
retient un point qui n'ouvre RIEN et qui est **encadré des deux côtés, sur les
deux axes, par des points qui ouvrent** — sans quoi il tomberait hors de la
grille et ne mesurerait que le bord —, ouvre une fiche, touche ce point, et exige
que la fiche soit **toujours là et inchangée**.

---

## 7. ⚠⚠ « UN PANNEAU PAR-DESSUS UN AUTRE » — VÉRIFIÉ À LA MAIN, ET C'EST NON

Le §3 du brief demande de vérifier à la main si un panneau s'ouvre par-dessus un
autre et avale le premier toucher. **Mesuré dans Chromium, géométrie du S25 FE :**

- la fiche ouverte occupe **`y` 376 → 506** sur un canevas qui va de 40 à 506 ;
- **ZÉRO des 23 points qui ouvrent une fiche ne tombe sous elle** — les pièces
  sont dessinées au-dessus, la fiche couvre du terrain vide ;
- fiche **déjà ouverte** sur le « Nœud », un toucher sur la Gangue au-dessus
  d'elle : la fiche affiche **« Gangue · niv. 20 » au PREMIER toucher**. Aucun
  toucher n'est avalé.

Le cas que `useGhostGuard` couvrirait ailleurs **ne se présente donc pas ici**, et
c'est une mesure, pas une supposition.

---

## 8. Le déménagement de deux fonctions — un DÉPLACEMENT, pas une copie

`nomAffiche` et `entitesSurLaCase` vivaient dans **`src/ui/banc.js`**, où un seul
écran s'en servait. La fiche d'une cible ennemie en a besoin aussi, et
`src/ui/raid.js` **ne peut pas importer le banc** : un écran de production qui
dépend du banc de debug est la dépendance à l'envers. Les deux montent dans
**`src/render/scene.js`**, qui répond déjà « qu'est-ce que cette entité » —
`classeDe`, `accentDe`, `NOMS_CLASSE`, `couchesDeLEntite`.

⚠ **PAS UNE LIGNE DE LEUR CORPS N'A CHANGÉ EN ROUTE**, et `banc.js` les importe
désormais d'ici. Trois fichiers de test suivent l'import — `banc.test.js`,
`repli.test.js`, `defense.test.js` — sans qu'une assertion bouge. La falsification
qui les rend privées fait tomber **quatre fichiers de test d'un coup**.

⚠ **`caseDepuisMilli` ENTRE DANS `render/scene.js` AVEC ELLES**, et c'est le seul
import neuf : `entitesSurLaCase` compare des milli-cases, et le module ne
l'importait pas encore.

---

## 9. Ce que le lot NE touche pas — vérifié plutôt que cru

⚠ **`src/sim/` N'A PAS UNE LIGNE DE CHANGÉE.** `git diff --stat -- src/sim/`
rend le vide. Tout ce que la fiche annonce existait déjà.

⚠ **`SAVE_VERSION` NE BOUGE PAS, ET RESTE À 28 — VÉRIFIÉ AU DIFF.**
`git show b403a3c:src/sim/state.js` rend 28, le fichier courant rend 28. Une
fiche est un affichage : rien n'entre dans l'état, rien ne traverse `serialiser`.

⚠ **LE PANNEAU DE LA CIBLE NE CHANGE PAS.** Butin, force de défense et coût en
points d'attaque restent où ils sont, et la fiche ne les répète pas — c'est
l'interdit du §2, et il est tenu : aucun des trois n'apparaît dans les sept
lignes.

⚠ **AUCUNE TEINTE NEUVE, AUCUNE RÈGLE DE FEUILLE.** Le poste `feuille` vaut +0.

⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni un outil de la chaîne.

---

## 10. Les tests — PASS/KO et le montage effectivement écrit

**Onze tests entrent, et le compte passe de 1 386 à 1 397.** Dix portent les
codes du brief ; le onzième, `FE T9 bis`, a été **écrit après une mesure** — voir
le §11.

| Code | Verdict | Montage effectivement écrit |
|---|---|---|
| **FE T1** | **PASS** | Écran monté sur la graine 42, camp porté au niveau 20. Balayage du canevas **pixel par pixel au pas de 4** ; pour chaque point, le titre de la fiche qui s'y ouvre. On retient **deux titres distincts** dont les nuages de points sont disjoints, et on exige que le centre du nuage de l'un n'ouvre JAMAIS l'autre. C'est « la fiche ouverte est celle de l'entité touchée, pas d'une voisine », mesuré sur la géométrie réelle. |
| **FE T2** | **PASS** | Le point 8 **séparément** : le même balayage, filtré sur les titres qui sont des noms de `BATIMENTS`. Le test asserte d'abord que les clés d'`UNITES`, `DEFENSES` et `BATIMENTS` sont **disjointes** — sans quoi « c'est un bâtiment » ne voudrait rien dire — puis qu'au moins un bâtiment ouvre sa fiche et que ses lignes sont celles d'un bâtiment. |
| **FE T3** | **PASS** | La **même** pièce montée à deux niveaux dans deux combats, et l'égalité des nombres est REFUSÉE. Les PV et les trois dégâts doivent tous différer. Un montage à niveau 1 partout ne distinguerait pas un champ lu d'un champ écrit en dur. |
| **FE T4** | **PASS** | Deux montages : `proprietaireDefense: 'ouvrage'` et `proprietaireDefense: 'joueur'` (avec `proprietaireAttaque: 'ouvrage'`, `creerCombat` refusant le même propriétaire des deux côtés). Le test asserte le nom Ouvrage sur le premier, le nom joueur sur le second, **et que les deux diffèrent** pour la même pièce. |
| **FE T5** | **PASS** | Trois entités — une unité, une défense, un bâtiment. `apres === null` sur **toutes** les paires des deux sections, et le test asserte d'abord qu'il y a bien des paires à mesurer. |
| **FE T6** | **PASS** | Trois assertions : (1) le corps de la fiche est peint par `peindreVueDuPanneau` — le seul appel de `raid.js`, compté après retrait de la déclaration ; (2) `raid.js` n'écrit **aucune** classe `ligne` de son côté au-delà de celle que `remplirLignes` du panneau de résultat pose déjà, comptée à **exactement 1** avec un témoin de proximité ; (3) la vue ennemie porte les **mêmes clés** que celle du Chantier, `bouton` en moins. |
| **FE T7** | **PASS** | Les libellés de la fiche ennemie confrontés à ceux de `lignesDeLaPiece(apercuDeLaPiece(etat, 'garnison', 0))` — la fiche du JOUEUR, montée pour de bon. Les trois lignes de dégâts viennent de `LIBELLES_COLONNE_DEGATS`, **importée**, jamais retapée. **Plus deux assertions écrites après falsification** : la classe rend un mot de `NOMS_CLASSE` et **pas une de ses clés**, et un Merlon rend « — » sur ses trois lignes de dégâts. |
| **FE T8** | **PASS** | L'écran monté, on prouve d'abord que le balayage ouvre des fiches en préparation, **on en ouvre une pour de bon**, on touche « Attaquer », on asserte que `#raid-bas` est caché (donc qu'on est bien dans un déroulé), que la fiche s'est **refermée**, et qu'un balayage complet pendant le rejeu n'en ouvre **aucune**. |
| **FE T9** | **PASS** | Un point qui n'ouvre rien, **encadré des deux côtés sur les deux axes** par des points qui ouvrent — sans cette contrainte il tombait hors de la grille et le test ne mesurait que le bord. Fiche ouverte, on touche ce point : elle est toujours là, avec le même titre. Plus un **glissement** (`pointerdown`, deux `pointermove` au-delà de la tolérance, retour au point de départ, `pointerup`) qui n'ouvre rien. |
| **FE T9 bis** | **PASS** | `pointerdown` puis `pointercancel` sur un point dont on a prouvé, deux lignes plus haut, qu'il ouvre par le chemin du toucher. **Écrit après la mesure** — voir §11. |
| **FE T10** | **PASS** | Une Batterie (`porteeMini: 3.5`) et une Casemate (`porteeMini: 0`) dans le même montage : la ligne « Portée minimale » sur la première, son absence sur la seconde, et « Portée » présente sur les deux. Plus un Merlon et un bâtiment, qui n'ont **ni l'une ni l'autre**. |

**Aucune assertion n'a été retirée ni assouplie. Aucune garde existante n'a eu à
changer de cible** — `ÉD T8 ter`, qui garde le partage du rendu, était déjà écrit
pour cette troisième famille et n'a pas bougé d'un caractère.

---

## 11. ⚠⚠ VINGT-DEUX FALSIFICATIONS, VINGT ET UNE CHUTES — ET TROIS ONT FAIT ÉCRIRE DU TEST

Chaque falsification a été appliquée sur l'arbre FINAL, la suite relancée, puis
l'arbre restauré.

| # | Falsification | Ce qui tombe |
|---|---|---|
| G1 | le filtre du camp attaquant est retiré | `FE T9` |
| G2 | on prend le PREMIER occupant au lieu du dernier | **rien — déclarée, voir ci-dessous** |
| G3 | la garde du déroulé est retirée | `FE T8` |
| G4 | une case vide ouvre quand même | `FE T9` |
| G5 | une paire porte un `apres` | `FE T5` |
| G6 | le rendu partagé est remplacé par une écriture locale | `FE T6` |
| G7 | le libellé des PV est réécrit en « PV » | `FE T3`, `FE T7` |
| G8 | le nom du joueur remplace celui de l'Ouvrage | `FE T1`, `FE T2`, `FE T4` |
| G9 | les PV sont lus dans la TABLE, hors échelle de niveau | `FE T3` |
| G10 | la portée se décide sur le genre au lieu de `porteeQuiTire` | `FE T10` |
| G11 | la portée minimale se dit même à zéro | `FE T10` |
| G12 | les décalages sont recomptés dans le toucher | `FE T2`, `FE T9` |
| G13 | un glissement vaut un toucher | `FE T9` |
| G14 | un pincement annulé vaut un toucher | `FE T9 bis` |
| G15 | la fiche gagne un bouton d'action | `FE T6` |
| G16 | les bâtiments ne sont plus résolus | **six tests** |
| G17 | le déroulé ne referme plus la fiche | `FE T8` |
| G18 | un zéro de dégâts s'écrit « 0 » | `FE T7` |
| G19 | la classe rend la clé interne au lieu du mot | `FE T7` |
| G20 | les dégâts sont lus dans la table, hors échelle | `FE T3` |
| G21 | `nomAffiche` et `entitesSurLaCase` restent privées | **quatre fichiers de test** |
| G22 | le rendu partagé n'accepte plus une vue sans bouton | **cinq tests** |

⚠⚠ **TROIS N'ONT PAS MORDU AU PREMIER RELEVÉ, ET LES TROIS ONT FAIT ÉCRIRE DU
TEST APRÈS LA MESURE.** G14, G18 et G19 laissaient la suite **entièrement verte —
51 pass / 0 fail mesuré sur chacune**. Ce que le fichier gardait alors, c'étaient
les LIBELLÉS et le chemin du toucher ; il ne regardait ni les VALEURS de la fiche,
ni le chemin du pincement. `FE T9 bis` est entré pour G14, et deux assertions
neuves de `FE T7` pour G18 et G19. **Une falsification qui ne mord pas se vérifie
avant d'être crue**, et les trois mordent désormais.

⚠⚠ **ET LA VINGT-DEUXIÈME NE MORD PAS, ELLE SE DÉCLARE — POUR UNE RAISON
MESURÉE.** G2 remplace `occupants[occupants.length - 1]` par `occupants[0]` :
elle ne fait tomber aucun test, parce **qu'aucune case ne porte jamais deux
occupants du côté de la défense**. Le commentaire d'`entitesSurLaCase` annonce
pourtant qu'elle peut en rendre deux — « l'aviation ne bloque rien et peut donc
partager sa case ». **Mesuré : les huit unités qui entrent en garnison sont
quatre escouades et quatre blindés, ZÉRO aéronef** ; et sur **40 graines,
120 sites, 19 440 cases** balayées, le maximum d'occupants vaut **1**. Le cas est
donc inatteignable par construction du côté qu'on regarde. Le dernier occupant est
retenu quand même : le jour où un aéronef entrera en garnison, c'est celui qui
survole qui est au-dessus, donc celui que le doigt désigne.

---

## 12. ⚠⚠ RELEVÉ DANS CHROMIUM, GÉOMÉTRIE DU S25 FE, SUR UNE VRAIE PARTIE

Le rendu a été **vu**, sur le livrable servi en `http://localhost` — le
`localStorage` demande une origine —, viewport 360 × 780, `deviceScaleFactor` 3,
contacts dispatchés par CDP `Input.dispatchTouchEvent`.

**Parcours joué** : partie de graine 42 rattrapée de 3 001 ticks, six Meutes en
armée, 5 000 points d'attaque, camp de niveau 20 en (294, 15). Onglet Monde →
toucher du camp (« Camp » au panneau) → second toucher → écran de raid, titre
**« camp · niveau 20 · rangée 294, colonne 15 »**, bascule « Aller à Chantier »
(donc ouvert sur la **défense**, acquis du lot RETOUR-DE-RAID).

**Ce qui a été mesuré :**

- **23 fiches ouvertes sur 42 sprites** pointés au centre — les 19 autres sont des
  poses de décor ou d'obstacle, qui ne portent aucune entité ;
- **douze titres distincts** : Nœud, Gangue, Casemate, Batterie, Créneau, Merlon,
  Herse, Meute, Carapace, Fendeur, Bélier, Ratisseur — **des bâtiments, des
  ouvrages et des unités**, donc les points 7 et 8 des deux côtés ;
- mise en page : **`.paires` = 2 dans les douze**, six ou sept lignes réparties
  sur **trois ou quatre rangées** — c'est le couple libellé/valeur côte à côte du
  lot ÉCRAN-DÉFENSE, sans une ligne de feuille neuve ;
- **`.fleche` = 0 et `apres` = 0 dans les douze** — aucune flèche de palier ;
- **un seul bouton, « Fermer »** ;
- **débordement horizontal 0** dans la fiche **et** sur la page entière ;
- boîte de la fiche : **360 × 130** pour un bâtiment, **360 × 145** pour une pièce
  qui tire, posée en bas de `#raid-cible` ;
- « Fermer » referme pour de bon : `hidden` repasse à vrai ;
- **le raid lancé, la fiche est refermée** (`raid-fiche.hidden` vrai,
  `raid-bas` caché) **et un toucher au milieu du canevas pendant le déroulé
  n'ouvre rien** ;
- **zéro erreur de page** sur tout le trajet.

⚠ **ET UN DÉFAUT DE MON PROPRE INSTRUMENTATION A ÉTÉ TROUVÉ EN CHEMIN, IL FAUT LE
DIRE.** Un premier balayage en aveugle, au pas de 10 pixels, rendait **0 fiche
ouverte** et m'a fait croire une heure que le toucher ne passait pas dans le
navigateur. Ce qui l'a tranché est d'avoir instrumenté `drawImage` sur le canevas
du raid et de viser le **centre des sprites réellement posés** : 23 ouvertures du
premier coup. **Le code n'avait rien.** C'est la même leçon que « une
falsification qui ne mord pas se vérifie avant d'être crue », prise du côté de la
mesure.

⚠ **CE N'EST PAS L'APPAREIL D'ETHAN.** Tout ce qui précède est relevé dans
Chromium à la géométrie du S25 FE ; **le rendu sur téléphone se déclare NON
EXÉCUTÉ** (`CLAUDE.md` §3 — il n'y a pas d'appareil ici).

---

## 13. Écarts au brief, déclarés

⚠⚠ **LA BASE ANNONCÉE PAR LE BRIEF N'ÉTAIT PLUS LÀ, ET L'ÉCART EST DE MON FAIT.**
Il pose **1 340 pass, 8 256 764 octets, 0.99.23 · build 124** ; mesuré au départ,
**1 386 pass, 8 350 024 octets, 0.99.26 · build 128**. Les quatre briefs ont été
livrés ensemble et exécutés dans l'ordre : **DÉPLACEMENT-ÉCLAIRÉ puis RETOUCHES
sont passés avant celui-ci, sur la même branche.** Les faits dont ce lot dépend
ont été vérifiés un par un et étaient intacts : le rendu partagé et son
commentaire d'attente, `porteeQuiTire`, `caseDepuisPixels`, `nomAffiche`,
`entitesSurLaCase`, et les libellés des trois colonnes de dégâts.

⚠ **`FE T9 bis` N'EST PAS AU BRIEF, ET IL EST DÉCLARÉ.** Il n'ajoute pas une
propriété : il ferme le trou qu'une falsification a mesuré (§11).

⚠ **DEUX LIGNES DE CONTENU S'ÉCARTENT DE LA FICHE DU JOUEUR**, dans les deux
sens — « Points engagés » sort, « Classe » entre. Les deux sont argumentées au §2
et se défont d'une ligne chacune.

⚠ **`peindreVueDuPanneau` GAGNE UNE GARDE DE TROIS LIGNES**, et c'est le seul
changement du rendu partagé : il écrivait son bouton sans regarder si l'appelant
lui en donnait un. Les deux fiches existantes en passent toujours un ; la fiche
ennemie n'en a pas. **La garde est un `return` avant l'écriture du bouton, pas une
branche de mise en page** — la falsification G22 qui la retire fait tomber cinq
tests, dont `FE T6`.

---

## 14. Points en suspens — Ethan tranche

⚠⚠ **LA FICHE NE DIT RIEN DU MODULE QUE PORTE LA PIÈCE.** `UNITES[x].moduleOuvrage`
existe, et `modulesDebloques.ouvrage.defense` est armé depuis le lot MODULES-F :
une Carapace de niveau 28 ou plus porte un Camouflage que le joueur n'a aucun
moyen de lire. **Ce serait une ligne de plus dans la section « La pièce »**, et
elle n'est pas au brief. À rouvrir.

⚠ **LA FICHE NE DIT PAS LA VITESSE NI LA MASSE.** Les deux sont dans la table et
les deux se voient au combat ; le brief ne les demande pas, et les ajouter seul
aurait été choisir ce qui compte à la place d'Ethan.

⚠ **LA FICHE D'UNE PIÈCE DU JOUEUR SUR L'ÉCRAN DE RAID N'EXISTE PAS.** Le filtre
retient les entités dont le camp n'est pas `attaque` — donc, en préparation où
`vagues` est vide, la défense de la cible et elle seule. Toucher une case des deux
rangées de déploiement n'ouvre donc rien, ce qui est exact aujourd'hui et
deviendra un manque le jour où les vagues seront montées avant le lancement.
**Une ligne à changer.**

⚠ **ET LE FILTRE EST INERTE AUJOURD'HUI, MESURÉ.** En préparation, `montageDuRaid`
rend `vagues: []` : il n'y a aucune entité de camp `attaque` à écarter. Il est
écrit quand même, parce que le déroulé en porte et que la garde du déroulé est la
seule chose qui l'en empêche — deux gardes valent mieux qu'une sur un écran qui
s'ouvre par trois portes.

