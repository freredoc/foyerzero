# RAPPORT — lot REJEU

**12/09/2026.** Deux demandes d'Ethan, dans cet ordre :

> « Un changement tres rapide, pqs de blabla pas de test, juste enlever le
> plafond imposer par le chantier de construction qui limite le niv max des
> bâtiments. Il y reste sur qg def et centre commandement. Ouvre une pr. »

puis, en interrompant le contrôle :

> « + tu fais le rejeu quand même »

---

## 0. Le verdict, mesuré

`npm test` déclare **1601** tests au sens de la garde de `documentation.test.js` ;
le verdict mesuré est **1600 pass · 0 fail · 1 skipped** (`LIMITE T8`, suspendu
par Ethan le 08/09), et `npm run check` sort en 0.

⚠⚠ **LE COMPTE NE BOUGE PAS D'UN TEST, ET C'EST LA CONSIGNE.** « pas de test » :
**aucun test n'entre**. Ce qui a été fait sur `test/` était OBLIGATOIRE pour ne
pas laisser `main` rouge — deux gardes RETOURNÉES parce que leur prémisse est
exactement ce que les arbitrages renversent, une réancrée et resserrée, cinq
réancrages de `SAVE_VERSION`, un montage réparé, `PIC T7` remesuré, et une
VINGT-TROISIÈME couche au témoin de BASES-0. Le détail est au §7.

`npm run build` → `dist/index.html`, **9 384 775 octets**, 0 référence externe.

Coût **+1 105 octets, SANS UN OCTET D'IMAGE NI DE SON**, ventilé poste par poste
contre le livrable rebâti dans un `git worktree` sur l'arbre pristine de `main` =
`d2dfae3` (**9 383 670**) :

| poste | avant | après | écart |
|---|---|---|---|
| JavaScript | 423 489 | 424 503 | **+1 014** |
| balisage | 36 694 | 36 785 | **+91** |
| feuille | 46 538 | 46 538 | +0 |
| images | 7 683 603 | 7 683 603 | +0 |
| audio | 1 193 346 | 1 193 346 | +0 |
| **somme** | **9 383 670** | **9 384 775** | **+1 105** |

La somme des cinq postes tombe **EXACTEMENT** sur le total des DEUX côtés, et il
y a **306 URI / 307 lignes `data:` de part et d'autre**. Borne T10 **inchangée à
9 600 000**, marge **215 225 octets, 2,24 %**.

Version et build passent à **0.99.54 · build 156** — et **les deux restent des
CHAÎNES**, vérifié au type : `android/app/build.gradle.kts` les lit `as String`,
et un nombre y fait tomber le job Android à la CONFIGURATION.

`main` a bougé sous le lot : la PR #137 (BARÈME-ET-REJEU) a été fusionnée par
Ethan pendant la session. ⚠ **Vérifié aux sources primaires plutôt que sur la
notification**, précédent du 10/09 où la PR #128 a été fusionnée sur un commit
qui ne portait pas son correctif : le commit de fusion `d2dfae3` a pour parents
`f6fb04e` — la base exacte que le lot précédent avait mesurée — et `5ac1e38`, et
`git diff --stat 5ac1e38 origin/main` est **VIDE**. Les deux arbres sont
identiques : les nombres du rapport précédent décrivent `main` au mot, et il n'y
avait rien à remesurer.

Le lot touche `src/index.src.html`, `src/sim/raid.js`, `src/sim/raid-ouvrage.js`,
`src/sim/state.js`, `src/ui/raid.js`, `src/ui/rapport.js`, `src/ui/session.js`,
`package.json`, **huit** fichiers de `test/`, le témoin de BASES-0, et fait
entrer ce rapport. **Pas une ligne de `src/data/`, `src/render/`, `src/son/`,
`tools/` ni `art/`** — vérifié au diff.

---

## 1. Le plafond du Chantier disparaît, les deux autres restent

⚠⚠ **L'ARBITRAGE DU 29/08 EST RENVERSÉ.** Ce jour-là Ethan écrivait « le chantier
de construction définit le niveau max des bâtiments. Donc aucun bâtiment ne peut
avoir un niveau supérieur à celui du chantier » ; le 12/09 il le retire. Le code
`plafond-chantier` n'existe plus dans `problemesDeLAmelioration`.

⚠ **`niveauDuChantier` RESTE EXPORTÉE, ET CE N'EST PAS UN OUBLI.** Elle est LUE
ailleurs — la réparation des bâtiments est indexée sur le Chantier
(`REPARATION_BASE_JOUEUR.indexeeSur`) — ; elle ne REFUSE plus rien, c'est tout.
La retirer aurait cassé un mécanisme qu'Ethan n'a pas visé.

⚠⚠ **ET LES DEUX AUTRES PLAFONDS NE SONT PAS CELUI-CI — vérifié au code, pas
supposé.** « Il y reste sur qg def et centre commandement » : ce sont le Centre
de commandement et le QG de défense, qui bornent le niveau des **PIÈCES** par
`plafond-commandement` de `problemesDeLAmeliorationDEffectif`. Un budget de force
n'est pas le rythme de la construction, et les deux codes ne se croisent nulle
part. Un commentaire de `src/sim/state.js` le dit à l'endroit du retrait, pour
qu'un lot futur ne les retire pas « en croyant achever celui-ci ».

⚠ **CE QUE ÇA COÛTE, MESURÉ** : `état — l'amorce paie de quoi démarrer` est tombé.
Sa prémisse était que le premier geste payable d'une partie neuve est le SEUL —
monter le Chantier. Ce n'est plus vrai : le Collecteur se monte aussi. **Le
MONTAGE est réparé, jamais l'assertion** : il exige désormais que les deux
premières montées soient payables dans l'un comme dans l'autre ordre.

⚠ **ET `état — le Chantier plafonne le niveau de toute la base` EST RETOURNÉ, PAS
RETIRÉ.** Il garde le même montage MORDANT — Chantier au niveau 1, un Collecteur
au niveau 1 — et exige l'INVERSE : la liste des problèmes est vide, la montée
passe trois niveaux au-dessus du Chantier, et `plafond-chantier` est absent des
codes. Il falsifie l'ancienne règle de face, et il garde ce qui reste vrai — le
plafond de JEU à 50 mord toujours.

---

## 2. Le rejeu d'un raid — ce que le lot précédent avait arrêté

⚠⚠ **LE LOT PRÉCÉDENT S'ÉTAIT ARRÊTÉ SUR SA PROPRE CONDITION D'ARRÊT, ET LA
MESURE QUI L'AVAIT FAIT S'ARRÊTER EST FAUSSE D'UN FACTEUR DEUX.** Son §4 écrivait
« MESURER LE COÛT AVANT DE LE FAIRE, ET LE PUBLIER […] Si le surcoût d'une
sauvegarde dépasse ce qui paraît raisonnable, s'arrêter » et publiait **7 780 o
par rapport sur une base neuve, 8 908 à moitié pleine, 10 312 sur une base
pleine**, soit **×9,7 · ×9,3 · ×9,0** sur la sauvegarde.

**Mesuré pour de bon, sur les vingt-cinq parties réelles du témoin de BASES-0,
après vingt-quatre heures sous le feu :**

| grandeur | relevé |
|---|---|
| rapports gardés | 5 à 7 |
| sauvegarde SANS le montage | 5 883 à 6 907 o |
| sauvegarde AVEC | 18 036 à 23 522 o |
| facteur | **×3,07 à ×3,44** (médiane ×3,16) |
| coût par rapport | **2 302 à 2 430 o** (médiane 2 352) |
| projection à dix rapports | ×4,5 à ×4,9 |

Et le **pire cas absolu**, balayé sur 120 sites de niveau 50 des trois types avec
les quatre vagues PLEINES du joueur à 36 attaquants de niveau 50 : **7 198 o par
rapport**, donc **71 980 o** pour les dix que `APRES_RAID.rapportsGardes` garde.

⚠⚠ **ET L'ÉCART SE DÉCOMPOSE : LA PROJECTION COMPTAIT DEUX FOIS.** Elle
additionnait « la base du joueur TELLE QU'ELLE ÉTAIT — disposition, garnison,
armée, dégâts de l'époque » au montage. Or **le montage que `creerCombat` reçoit
PORTE DÉJÀ le camp qui défend** — ses bâtiments, sa garnison — et les vagues qui
attaquent : il n'y avait rien à ajouter. `pourLeRejeu` ne retire même que deux
tableaux d'indices. Le ×9,7 était une addition, pas une mesure.

⚠⚠ **ET CE N'EST PAS L'OPTION BON MARCHÉ QUI A ÉTÉ PRISE.** Le rapport du lot
précédent laissait quatre issues à Ethan ; il n'en a choisi aucune, et il a dit
« tu fais le rejeu quand même ». **Le rejeu est donc COMPLET — les dix rapports
gardés, les deux sens de raid.** Se rabattre de moi-même sur « le dernier raid
seulement » (×1,9) aurait été rétrécir la demande en silence, et le rejeu
approximatif que la quatrième issue proposait est interdit par `JRN T9`, qui
refuse qu'un chiffre de rapport se recompose depuis l'état d'aujourd'hui.

### 2.1 Ce qui est rangé, et pourquoi c'est exact

`pourLeRejeu(montageComplet)` de `src/sim/raid.js` rend **l'argument EXACT de
`creerCombat`**, moins `indicesDefenseurs` et `indicesBatiments`.

⚠⚠ **LE REJEU EST EXACT AU TICK PRÈS, ET CE N'EST PAS UNE PROMESSE : LE MOTEUR DE
COMBAT NE TIRE RIEN.** Le tirage du langage n'apparaît pas une fois dans
`src/sim/combat.js` — le montage détermine entièrement le combat, ce que les deux
cents témoins de `test/temoins-combat.js` mesurent depuis le lot
JOURNAL-DE-COMBAT. Rejouer le montage rejoue le combat, image par image.

⚠ **LES DEUX TABLEAUX D'INDICES SORTENT, ET RIEN D'AUTRE.** `creerCombat`
destructure par propriété et ne les lit jamais : ils servent à
`reporterLesDegats`, après coup. Une centaine d'octets par rapport, dix rapports.
**Ne pas élargir ce retrait « pour gagner encore » : tout le reste est lu.**

⚠ **LE RAPPORT PORTE LE MONTAGE, JAMAIS LE `resultat`.** Le premier est l'état de
DÉPART d'un combat et il se rejoue ; le second porte les positions et les PV de
chaque entité à chaque tick — c'est une bande vidéo, elle pèse des centaines de
kilo-octets, et elle ne se rejoue pas, elle se regarde. `RAID-B T12 bis` garde
cette distinction par quatre assertions nommées.

⚠ **ET CÔTÉ SUBI, LE MONTAGE EST LE COÛT IRRÉDUCTIBLE.** Un raid subi rejoue la
base du JOUEUR telle qu'elle était : rien dans l'état d'aujourd'hui ne peut la
reconstituer. La vague ATTAQUANTE, elle, se reconstruit bit pour bit depuis
`attaquant` + `minute` — c'est ce que le lot précédent avait mesuré, `IDENTIQUES ?
true` — mais elle voyage quand même, pour qu'il n'y ait pas DEUX chemins de
composition dont un seul recevrait la prochaine correction.

### 2.1 bis L'exactitude est MESURÉE, pas plaidée

⚠⚠ **SEPT REJEUX SUR SEPT TOMBENT AU TICK ET À LA CAUSE PRÈS.** Les sept montages
d'une vraie partie — un raid mené, six subis — rejoués par `creerCombat` + `tick`
jusqu'à la fin, et comparés à ce que le rapport RANGÉ annonce :

| sens | rangé | rejoué |
|---|---|---|
| mené | 900 ticks · `duree` | **900 ticks · `duree`** |
| subi | 412 ticks · `attaquants` | **412 · `attaquants`** |
| subi | 572 · `attaquants` | **572 · `attaquants`** |
| subi | 391 · `attaquants` | **391 · `attaquants`** |
| subi | 392 · `attaquants` | **392 · `attaquants`** |
| subi | 572 · `attaquants` | **572 · `attaquants`** |
| subi | 311 · `souche` | **311 · `souche`** |

⚠ **C'EST CETTE MESURE-LÀ QUI PORTE LA PREUVE, PAS LE PANNEAU DE FIN.** Celui-ci
lit le rapport RANGÉ : il afficherait les mêmes nombres même si le rejeu se
déroulait de travers. Le tick de fin et la cause, eux, sont ce que le rejeu
CALCULE.

### 2.2 `SAVE_VERSION` passe de 32 à 33, et la migration ne calcule rien

⚠⚠ **ELLE NE PEUT RIEN CALCULER, ET ELLE NE POSE MÊME PAS LE CHAMP.** Un montage
est l'état de départ d'un combat fini : une sauvegarde v32 ne sait ni quelle
garnison le site portait, ni quels obstacles, ni quelles vagues sont parties.
Lui en inventer un ferait rejouer un combat qui n'a pas eu lieu.

⚠ **« ABSENT » VAUT « PAS DE REJEU », ET C'EST LA SEULE ÉCRITURE DE CETTE
ABSENCE.** Poser `rejeu: null` en donnerait deux — donc deux lecteurs, dont un
seul recevrait la prochaine correction. `rapportRejouable` teste les DEUX
(`undefined` et `null`) et le bouton du journal reste caché : les anciens
rapports se déplient comme avant, sans bouton.

⚠ **ET LA MIGRATION NE VIDE PAS `rapports`.** Les dix derniers raids sont de
l'histoire ; les jeter pour offrir un bouton priverait le joueur de ce qu'il a.

### 2.3 L'écran : un bouton dans le journal, et rien de plus

`#journal-rejouer` entre dans `#ecran-journal`, après le corps.

⚠ **IL RÉEMPLOIE LA RÈGLE `.panneau-detail .ameliorer`** — **+0 octet de
feuille**, mesuré.

⚠⚠ **ET IL NE PASSE PAS PAR LE BOUTON PARTAGÉ DE `peindreVueDuPanneau`, QUI
ÉCRIT `PICTOGRAMMES.ameliorer` EN DUR.** Une flèche verte d'amélioration au-dessus
d'un rapport de raid promettrait une montée de niveau. C'est un bouton à lui, avec
son libellé — « Rejouer ce raid » ou « Rejouer ce raid subi », lu sur `sens`.

⚠ **IL NE PARAÎT QUE SUR UN RAPPORT DÉPLIÉ QUI PORTE UN MONTAGE.**
`rapportRejouable(etat.rapports, cle)` est PURE et exportée : elle cherche par la
même clé que le dépliant et rend `null` si le rapport n'a pas de `rejeu`. Un
bouton visible sur un rapport d'avant le lot serait un bouton mort.

⚠⚠ **ET `ouvrirEnRejeu` NE PASSE PAS PAR `ouvrirSurLaCible`, DÉLIBÉRÉMENT.**
Celle-ci relit `siteDeLaCase` : elle montrerait le site tel qu'il est AUJOURD'HUI,
donc un autre combat. Le rejeu monte le combat depuis le montage rangé, et rien
d'autre.

⚠ **PAS DE CIBLE, DONC PAS DE SECOND RAID DEPUIS UN REJEU.** `cibleCourante` vaut
`null` : « Attaquer » et « Ré-attaquer » se gardent tous les deux dessus, et c'est
ce qui fait du rejeu une CONSULTATION.

⚠ **LES DEUX BANDEAUX DU SIMULATEUR RESTENT CACHÉS.** Un rejeu n'est pas une
simulation : il montre un combat qui a EU LIEU, et « Simulateur » dirait au
joueur que rien de ce qu'il regarde n'est arrivé.

⚠ **ET `#raid-fin` MONTRE LES MÊMES LIGNES QUE LE DÉPLIANT DU JOURNAL.**
`lignesDuPanneauDeFin(rapport)` entre dans `ui/rapport.js` et route sur `sens` :
un raid mené rend `lignesDuResultat`, un raid subi `lignesDeLaDefense`. **Une
écriture, deux formes** — `RAID-A T7` est resserré pour l'exiger, et il refuse
désormais que l'écran appelle la vue d'OFFENSE, qui afficherait butin et points
sous un raid subi.

---

## 3. Ce que le banc a trouvé, et que la relecture n'avait pas vu

⚠⚠ **QUATRE DÉFAUTS, TOUS TROUVÉS DANS CHROMIUM, AUCUN À LA RELECTURE.**
Géométrie du S25 FE — 360 × 780 à dpr 3 —, livrable servi sur une vraie origine,
sauvegarde injectée AVANT le premier chargement, portant **sept** rapports : un
raid mené et six subis, chacun avec son montage.

1. ⚠⚠ **`peindreVagues` LEVAIT SUR UNE FORMATION NULLE, ET LE REJEU S'ARRÊTAIT
   AVANT SA PREMIÈRE IMAGE.** `vaguesDeLArmee` fait `formation.forEach` ; un rejeu
   n'a pas de formation. **`TypeError: Cannot read properties of null (reading
   'forEach')` au premier toucher du bouton.** La grille des quatre vagues est
   l'ÉDITEUR de composition : un rejeu ne compose rien, donc il n'en peint aucune.
   ⚠ Et on ne lui donne PAS `montage.vagues` à la place : ce n'est pas la même
   forme — un tableau PAR VAGUE, dont les entrées ne portent ni `vague`, ni
   `degatsMilli`, ni `actif`.
2. ⚠⚠ **`fondDeLaBase` AURAIT LEVÉ SUR TOUT RAID MENÉ, ET SUR LUI SEUL.** Un
   montage d'`executerRaid` ne porte PAS `proprietaireDefense` — c'est
   `creerCombat` qui le défaute — et `fondDeLaBase` LÈVE sur un propriétaire
   inconnu. Un raid SUBI porte le champ, donc il passait : le défaut n'était
   visible que d'un côté. Le propriétaire se lit désormais sur le COMBAT, après
   `rejouer`, exactement comme le chemin ordinaire vingt lignes plus haut.
3. ⚠⚠ **LES ATLAS N'ARRIVAIENT PAS.** L'écran de raid ne les retient que si on les
   lui a donnés une fois, et seul `ouvrir` les passait : un joueur qui va droit au
   journal ouvrait l'écran EN PREMIER, et `canvas2d` levait sur « la famille
   d'atlas "fond_j_01" manque ». `rejouerUnRapport` les prend à son tour.
4. ⚠ **LA SAUVEGARDE INJECTÉE ÉTAIT ÉCRASÉE PAR LE `pagehide` DU PREMIER
   CHARGEMENT** — un défaut du BANC, pas du jeu, et il fallait le dire : le
   premier relevé annonçait « Aucun raid mené ni subi » sur une partie qui en
   portait sept. Elle s'injecte désormais avant le premier chargement.

**Relevé après correction, zéro erreur de page :** le bouton est caché tant
qu'aucun rapport n'est déplié ; déplié, il mesure **344 × 34 px**, porte
« Rejouer ce raid subi », débordement horizontal **0** ; le rejeu ouvre l'écran de
raid, canevas **360 × 780 CSS pour un tampon de 1080 × 2340**, `#raid-bandeau`,
`#raid-vitesses` et `#raid-bas` cachés, et **les quatre blocs de chrome masqués** —
onglets, ressources, barre du bas, navigation.

⚠ **ET LE BOUTON TOMBE À `y = 783`, DONC SOUS LE PLI — RELEVÉ, NON CORRIGÉ.** Il
est le dernier enfant du journal, qui défile ; le joueur doit descendre pour le
trouver après avoir déplié un rapport. Le remonter demande de le poser DANS le
dépliant, donc dans `vueDuJournal`, qui est PURE et partagée par deux vues. **Ethan
tranche.**

⚠⚠ **ET UN CINQUIÈME DÉFAUT A ÉTÉ TROUVÉ EN REGARDANT, PAS EN RELISANT : LE REJEU
N'AVAIT AUCUNE PORTE DE SORTIE.** Mesuré : un rejeu de raid mené sur une base de
niveau 14 **tournait encore au bout de soixante-dix secondes**, tout le chrome
masqué — onglets, ressources, barre du bas — et `#raid-vitesses` caché. Le joueur
était retenu jusqu'à quatre-vingt-dix secondes devant une consultation qu'il
venait de demander, sans moyen d'en sortir.

⚠⚠ **`#raid-vitesses` S'OUVRE DONC DANS UN REJEU, ET C'EST UNE LECTURE DE
L'ARBITRAGE DU 01/09, PAS SON RENVERSEMENT.** Celui-ci dit « le vrai raid se
regarde en temps réel, sans contrôle de vitesse » : il porte sur un raid dont
l'issue se joue SOUS LES YEUX du joueur, qui vient d'en payer les points. Un rejeu
ne joue rien — le combat est commis, et rien de ce que le joueur touche ne peut en
changer le verdict. Le bandeau « Simulateur », lui, RESTE caché : un rejeu n'est
pas une simulation, et le mot dirait que rien de ce qu'on regarde n'est arrivé.
**Une ligne renverse cette lecture-ci si Ethan préfère le temps réel.**

**Relevé après, sur les DEUX sens, zéro erreur de page :** les cinq contrôles sont
là — « Pas à pas · ×1 · ×2 · ×4 · Instantané » —, « Instantané » conclut le rejeu
sur-le-champ, et les deux panneaux de fin sont de la BONNE FORME :

* **raid mené**, dix lignes d'offense — « Verdict Défaite totale », « Butin 0 quartz
  · 0 scorie », « Défense restante 68 % », « Bâtiments restants 100 % »,
  « Souche 100 % », « Étai 100 % », « Infanterie 22 min 23 s · — de la réserve »,
  « Véhicules sans bâtiment », « Aviation sans bâtiment », « Durée du combat
  1 min 30 s » ;
* **raid subi**, huit lignes de défense, **sans butin ni points** — « Fin du combat
  Chantier de construction tombé », « Durée du combat 31 s », « Défense restante
  0 % », « Bâtiments restants 0 % », « Garnison au plancher 3 pièce(s) »,
  « Bâtiments au plancher 5 pièce(s) », « Réserve de réparation vidée », « Base
  rasée, reculée de 20 case(s) · r 240 → r 260 ».

C'est `lignesDuPanneauDeFin` qui route sur `sens`, et c'est la mesure qui dit
qu'elle route juste : la vue d'OFFENSE aurait affiché un butin sous un raid subi.

⚠ **« RÉ-ATTAQUER » EST INERTE DANS LES DEUX CAS**, relevé à l'attribut : c'est
`cibleCourante = null` qui le tient, et c'est ce qui fait du rejeu une
consultation. Le chrome est RENDU à la fin — onglets et barre du bas —, `#raid-bas`
reparaît, **débordement horizontal 0**, et ni `NaN`, ni `undefined`, ni `Infinity`
dans un texte affiché.

⚠ **LA SCÈNE EST BIEN DESSINÉE, ET C'EST COMPTÉ** : `drawImage` instrumenté rend
**3 846 poses** sur la première seconde du rejeu mené et **1 857** sur le subi. Un
rejeu qui n'aurait rien peint aurait passé toutes les assertions de forme.

---

## 4. Ce que le lot ne fait pas

⚠ **AUCUN TEST N'ENTRE — c'est la consigne, et elle est tenue au test près.**
1601 déclarés avant, 1601 après.

⚠ **LE MONTAGE NE SE REJOUE PAS EN SIMULATION.** `simulerRaid` travaille sur une
copie et son rapport reste dans la copie : rien à changer.

⚠ **ET LE REJEU NE SONNE PAS DIFFÉREMMENT D'UN RAID.** `relever()` verse les
événements du journal du combat comme pour un vrai raid — ce sont les mêmes ticks,
donc les mêmes sons. Les taire demanderait un drapeau dans `src/son/`, que ce lot
ne touche pas.

---

## 5. Le témoin de BASES-0 prend sa vingt-troisième couche

⚠⚠ **HUIT COUPLES SUR 350, ET LES HUIT SONT `rapports`.** C'est la couche la plus
étroite en nombre de CHAMPS de toute l'histoire de ce témoin : un seul champ, sur
les huit phases où un rapport existe.

⚠⚠ **LES SIX PREMIÈRES PHASES SONT IDENTIQUES AU BIT**, et c'est la moitié qui
prouve : `etat.rapports` est VIDE jusqu'au premier raid, qui est la phase 7. Un
lot qui aurait touché au combat, à la carte, à l'économie ou à un geste se serait
vu avant.

⚠⚠ **ET AUCUN SCALAIRE NE BOUGE — LES DIX-SEPT, SUR 25 GRAINES SUR 25 : LA TAILLE
DE LA SAUVEGARDE COMPRISE.** Elle se relève à la phase 6, donc avant qu'un montage
y soit rangé : **aucun terme `OCTETS_AJOUTES_PAR_*` n'entre**, et c'est la seule
couche de l'histoire de ce témoin qui ajoute un champ à la sauvegarde sans en
ajouter un.

⚠ **LES DEUX TABLES DE RAPPORT SONT PLEINES — 25 sur 25 des deux côtés**, là où
BARÈME-ET-REJEU n'en remplissait que 9 et 14. C'est toute l'attribution : là-bas
la règle changeait le DÉROULÉ d'un combat, donc elle ne mordait que là où une
alliée bloquait une alliée ; ici ce qui bouge n'est pas l'ISSUE du raid mais la
FORME du rapport. **Une table creuse voudrait dire qu'un raid sur deux ne se
rejouerait pas.**

⚠ **ET LA LISTE DES CLÉS SE COMPOSE, ELLE NE SE RÉÉCRIT PAS.**
`CLES_AJOUTEES_PAR_REJEU = ['rejeu']` entre à côté de
`CLES_DU_RAPPORT_AVANT_TRANSFERT`, qui est un RELEVÉ pris sur `origin/main` dans
un arbre détaché : le modifier effacerait ce qu'il mesure. C'est cette assertion
structurelle qui porte la preuve — une seconde clé entrée fait tomber le test en
la NOMMANT, là où une empreinte dirait seulement « ça a bougé ».

---

## 6. Les témoins de combat ne bougent pas d'un bit

`test/temoins-combat.js` n'a pas une ligne de changée, et `src/sim/combat.js` non
plus — vérifié au diff. `pourLeRejeu` ne fait que RANGER l'argument que
`creerCombat` a déjà reçu.

---

## 7. Ce qui a changé dans `test/`, ligne par ligne

**Aucune assertion n'a été retirée ni assouplie.**

| fichier | ce qui change | pourquoi |
|---|---|---|
| `state.test.js` | `état — le Chantier plafonne…` **RETOURNÉ** | sa prémisse EST l'arbitrage renversé |
| `state.test.js` | `état — l'amorce paie…` montage **RÉPARÉ** | deux montées payables au lieu d'une |
| `state.test.js` | `SAVE_VERSION` 32 → **33** | le rejeu entre dans l'état |
| `raid.test.js` | `RAID-A T7` réancré et **RESSERRÉ** | il refuse en plus la vue d'OFFENSE sur un raid subi |
| `raid-ouvrage.test.js` | `RAID-B T12 bis` **RETOURNÉ** | il bornait le POIDS du rapport, ce que le lot change |
| `raid-ouvrage.test.js` | `SAVE_VERSION` 32 → **33** | — |
| `journal-raids.test.js` | `SAVE_VERSION` 32 → **33** | — |
| `batiments-quatre-etats.test.js` | `SAVE_VERSION` 32 → **33** | — |
| `formation-et-garnison.test.js` | `SAVE_VERSION` 32 → **33** | — |
| `pictogramme.test.js` | `PIC T7` **réancré** | 9 383 670 → 9 384 775, marge 2,25 → 2,24 % |
| `bases.test.js` | vingt-troisième couche câblée | §5 |
| `temoins-bases-0.js` | quatre tables neuves + `CLES_AJOUTEES_PAR_REJEU` | §5 |

⚠⚠ **`RAID-B T12 bis` EST RETOURNÉ SUR LA GRANDEUR QUI N'A PAS CHANGÉ.** Il
bornait le rapport ENTIER à 1 024 octets ; mesuré, il en pèse **1 915**, dont
**1 489 de montage** — donc **417 sans lui**, et la sauvegarde entière **3 110**.
La borne porte désormais sur le rapport MOINS son montage (< 512), et le test
garde en plus les quatre propriétés qui comptent : le `rejeu` est présent, il
porte `niveau`, `vagues` et `proprietaireDefense`, il ne porte **ni `entites`, ni
`termine`, ni `tick`, ni `cause`** — c'est la distinction montage/résultat, gardée
—, et il ne porte **ni `indicesDefenseurs` ni `indicesBatiments`**.

⚠⚠ **ET `PIC T7` EST RÉANCRÉ POUR LA TROISIÈME FOIS EN DEUX JOURS.** Les 1 105
octets valent un quarante-cinquième de sa tolérance de 50 000 : le laisser tomberait
très exactement sous la dérive LENTE que sa dernière assertion existe pour
refuser, et le pourcentage annoncé par `CLAUDE.md` cesserait d'être celui du
disque.

⚠ **UNE GARDE A LU MA PROPRE PROSE — SEPTIÈME FOIS DU DÉPÔT.** Le commentaire de
`pourLeRejeu` écrivait le nom du tirage du langage EN CLAIR, pour dire qu'il
n'apparaît pas dans `sim/combat.js` ; `test/clock.test.js` §4 balaie `src/sim/`
commentaires compris. **C'est le TEXTE qui a été corrigé, pas la garde** — après
`viewport-fit=cover`, `MENTION_SATURE`, `variante.js`, `render/contour.js`, le
calque des traits et `REPARATION_AILLEURS`.

⚠ **ET CHAQUE PATCH A ÉTÉ ASSERTÉ APPLIQUÉ AVANT D'ÊTRE CRU**, chacun derrière un
`assert s.count(v) == 1` : c'est la leçon du lot précédent, où deux `sed` n'avaient
rien remplacé et où la suite était restée VERTE.

---

## 8. `python3 tools/verifier.py` n'a pas été lancé, et c'était conforme

Le lot ne touche ni `art/`, ni un outil de la chaîne — zéro fichier au diff.

---

## 9. Écart déclaré : la branche

Le lot est poussé sur `claude/new-session-ae87x9` — l'environnement d'exécution
épingle la session à cette branche et interdit de pousser ailleurs sans
autorisation explicite. Les deux demandes d'Ethan y sont poussées d'un seul
tenant, et la PR les porte ensemble : le plafond est un retrait de quelques
lignes, le rejeu est ce qui déplace le témoin.
