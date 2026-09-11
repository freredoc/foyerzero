# RAPPORT — lot RAID-ET-ÉCRAN

Six points d'Ethan du 10/09 — 1, 9, 4, 6, 7 et 8 — dans un seul lot, sur la
branche `claude/lot-raid-et-ecran`.

---

## Base de départ

`main` = **`ea79a16`**, qui EST le commit de fusion du lot MUR (PR #131) : la
condition du §9 du brief — « merger APRÈS le lot MUR » — est donc tenue, et la
base est bien celle d'après. Vérifié au `git fetch` au départ et à la fin ;
`main` n'a pas bougé sous le lot.

Sur l'arbre pristine de `main` :

| grandeur | valeur |
|---|---|
| `npm test` | **1571 déclarés · 1570 pass · 0 fail · 1 skipped** (`LIMITE T8`) |
| `npm run check` | sortie **0** |
| `dist/index.html` | **9 310 894 octets**, 0 référence externe |
| version · build | **0.99.43 · build 145** |
| `SAVE_VERSION` | **31** |

⚠ Le nombre annoncé par la garde de `documentation.test.js` (1571) est le NOMBRE
DE TESTS DÉCLARÉS ; le verdict mesuré est 1570 pass, la différence étant le test
suspendu par Ethan le 08/09.

---

## Ce qui est produit

| grandeur | valeur |
|---|---|
| `GAME_VERSION` · `GAME_BUILD` | **0.99.44 · build 146** — le suivant disponible |
| `dist/index.html` | **9 314 390 octets**, 0 référence externe |
| coût | **+3 496 octets**, sans un octet d'image ni de son |
| `SAVE_VERSION` | **31 → 32** |
| `npm test` | **1573 déclarés · 1572 pass · 0 fail · 1 skipped** |
| `npm run check` | sortie **0** |

### La ventilation, poste par poste

Mesurée contre le livrable rebâti dans un `git worktree` sur l'arbre pristine de
`ea79a16`. Les cinq postes PARTITIONNENT le fichier des deux côtés — chacun NET
de ses `data:` —, et la somme des écarts tombe EXACTEMENT sur le total.

| poste | avant | après | écart |
|---|---:|---:|---:|
| feuille | 44 556 | 45 020 | **+464** |
| JavaScript | 405 494 | 408 183 | **+2 689** |
| balisage | 36 255 | 36 598 | **+343** |
| images | 7 631 243 | 7 631 243 | **+0** |
| audio | 1 193 346 | 1 193 346 | **+0** |
| **total** | **9 310 894** | **9 314 390** | **+3 496** |

**307 lignes `data:` et 306 URI de part et d'autre** : aucune ressource n'entre.
Borne T10 **inchangée à 9 600 000** — le lot ne fait entrer ni image ni son —,
marge **285 610 octets, 2,98 %**.

### `SAVE_VERSION` : 32

Un seul champ neuf, `formationRetenue`, à la RACINE de l'état, `null` par défaut.
Il entre parce que **la mémoire doit survivre à la fermeture du jeu** : « je fais
un raid, mais il n'est pas terminé » est le cas d'usage d'Ethan, pas un cas
limite. Tant que la formation vivait dans la fermeture de l'écran de raid,
`SAVE_VERSION` n'avait aucune raison de bouger — c'est ce que le lot
FORMATION-ET-GARNISON écrivait le 08/09, et c'est ce que ce lot-ci renverse.

La migration 31 → 32 **ne calcule rien, et ne peut rien calculer** : une v31 ne
sait ni quelle cible le joueur regardait, ni comment il avait rangé ses unités.
`null` est exactement ce qu'une v31 AVAIT, à chaque ouverture. Elle n'écrase pas
une valeur déjà présente — même discipline que le compteur d'instance de la
23 → 24.

**La chaîne complète est rejouée par `FR T3`**, depuis la plus vieille version
que `migrer` accepte (la 0, vérifiée comme plancher : un cran en dessous lève),
et une seconde fois depuis la v10.

---

## Point par point

### Point 1 — la formation reste en place d'un raid à l'autre

`src/sim/formation-de-raid.js`, `src/sim/state.js`, `src/ui/raid.js`.

**La clé de la mémoire est un quadruplet** : la BASE courante, la CIBLE (rangée
et colonne), l'EMPREINTE de l'armée, et la LONGUEUR. `formationPourLaCible` rend
la formation retenue si et seulement si les quatre coïncident ; sinon elle rend
une formation neuve, tirée d'Offense, toutes unités actives.

**L'empreinte est la suite des identifiants de `baseCourante(etat).armee`, jointe
par `|`.** C'est elle qui attrape la RECOMPOSITION, et c'est le terme qui compte :
sans elle, une armée dont le joueur a retiré la première pièce et posé une autre
à la fin recevrait les positions retenues **décalées d'un cran, en silence**. Ni
`reporterLesDegats` ni `problemesDeLEffectif` ne le diraient — les indices sont
alignés, les cases sont légales, et le raid partirait avec une formation que
personne n'a composée.

**Quatre champs sont retenus, et ils se lisent dans `CHAMPS_RETENUS`** — `vague`,
`colonne`, `actif`, `embarqueDans`. `niveau` et `degatsMilli` se relisent FRAIS
dans `armee` : une unité réparée entre deux passes part réparée.

**Le raid non terminé a été mesuré, pas raisonné.** Au banc (§ « Contrôles »),
sur une vraie partie : formation rangée en vague 2 avec une pièce désactivée,
raid mené sur un camp qui reste DEBOUT — « Bâtiments restants 99 % », « Souche
99 % » —, retour à la carte, et la MÊME cible rouverte rend
`2:1 2:2 2:3(off) 2:4 2:5 2:6`, à l'identique. Une AUTRE cible rend
`1:1 1:2 1:3 1:4 1:5 1:6`, toutes actives. Et le contenu de
`localStorage['foyer-zero/partie/1']` porte la mémoire entre les deux : c'est ce
qui la fait survivre à la fermeture du jeu.

⚠ **`retenir()` est appelée à chaque geste qui touche les quatre champs**, juste
avant `apresGeste()`, qui sauvegarde. Une écriture posée sur une seule des portes
de sortie — retour à la carte, retour en Offense, raid lancé, application tuée —
serait la première à être oubliée quand une cinquième apparaîtra.

⚠ **« Ré-attaquer » en hérite, et c'est le point.** Le commentaire
d'`ouvrirSurLaCible` disait jusqu'au 10/09 qu'« après un raid, le rangement de la
passe précédente n'a plus de sens » : c'est exactement ce qu'Ethan renverse. Les
deux arbitrages datés — 08/09 et 10/09 — sont en tête de
`sim/formation-de-raid.js`, avec ce qui survit du premier.

### Point 9 — quatre flèches qui déplacent toute la formation

`src/sim/formation-de-raid.js`, `src/index.src.html`, `src/ui/raid.js`.

`SENS_DE_TRANSLATION`, `problemesDeLaTranslationEnFormation` et
`translaterLaFormation` entrent dans le moteur ; l'écran DEMANDE, par `tenter`,
le même chemin que le déplacement d'une pièce — donc `retenir()` puis
`apresGeste()`.

**Le refus est en bloc, et la fonction juge la formation d'ARRIVÉE.** C'est le
motif exact de `problemesDeLaPermutationEnFormation`, et **ce n'est pas un
confort : c'est mesuré.** Appelé pièce par pièce sur la formation COURANTE,
`problemesDeLEffectif` refuse une translation parfaitement légale dès que deux
pièces se suivent — relevé sur deux Meutes en (1, 1) et (1, 2) décalées d'une
colonne vers la droite : **la première rend `superposition`, la seconde une liste
vide**.

⚠ **Les passagères ne se comptent pas et ne bougent pas.** Elles n'ont pas de
case — `embarquerEnFormation` la leur retire —, donc elles ne peuvent ni sortir
de la grille ni entrer en collision, et elles suivent leur porteur sans une
écriture. Les inclure ferait refuser la translation sur un `hors-grille` de
`colonne null`, c'est-à-dire sur rien.

⚠ **Une formation sans une seule pièce posée se refuse**, elle ne réussit pas en
silence : une flèche qui répondrait « fait » à un geste qui n'a rien déplacé est
l'inverse de ce qu'on demande à un avis.

**La place est prise à la VERTICALE, et elle a été mesurée avant qu'une ligne ne
soit écrite.** Relevé dans Chromium, géométrie du S25 FE : les cinq boutons de
mots faisaient **45,6 × 48 px** pour un texte de 9 px — la hauteur venait d'un
`align-items: stretch` aligné sur les 48 px d'`ATTAQUER`, et les trois quarts en
étaient vides. C'est la « place quelque part en bas » d'Ethan.
`#raid-boutons` devient une grille de DEUX rangées : il fait toujours
**240 × 48**, `#raid-rangee` toujours **56**, le canevas ne perd rien, et chaque
flèche fait **57,8 × 21,9 px**. Débordement horizontal **0**.

⚠ **Et les cinq mots cessent de se couper.** Les colonnes passent de `1fr` à
`auto` : à parts égales, « Simulateur » demandait **48,5 px pour 45,6** et se
coupait EN PLEIN MOT ; il en reçoit **57,7**, et **aucun des cinq ne se coupe
plus** — mesuré des deux côtés. Le point 9 rend la rangée plus lisible qu'il ne
l'a trouvée.

⚠ **Le haut et le bas sont la gauche et la droite tournées d'un quart de tour.**
`PICTOGRAMMES` ne porte que `ui_fleche_gauche` et `ui_fleche_droite` — vérifié
dans `src/data/atlas.js`, la famille `interface` n'a AUCUNE flèche verticale.
Inventer un sprite serait un lot d'art ; écrire un glyphe `▲` serait une seconde
façon de dire une flèche à côté de celles que l'atlas porte. `transform` reste
interdit sur la grille de la base — l'interdiction du lot POSE-À-L'ÉCRAN nomme
`#chantier-grille`, `.case` et `.jeton`, elle défend le POINTAGE d'une case, et un
bouton n'a pas de case à désigner. Le précédent est `.couche-tournante`.

⚠ **Aucun nom de sprite dans le balisage** : les quatre boutons naissent vides et
le pictogramme se DEMANDE au câblage, comme les deux flèches de `#navigation`.
Chacun porte son `aria-label` — il est SEUL dans son bouton, donc il parle.

### Point 4 — l'Épervier ne part plus sans aérodrome

`src/sim/batiment-de-production.js` (neuf), `src/sim/state.js`, `src/sim/raid.js`.

Ce qui manquait était **un lecteur**. `batimentDeProductionManquant` répondait
juste depuis le 07/09, `FORCES.armee.exigeLeBatimentDeProduction` valait déjà
`true`, et `problemesDuRaid` ne l'interrogeait pas.

Le refus porte **sur les seules pièces qui PARTENT** — celles que
`composerLesVagues` retient, donc `actif !== false` et au-dessus du plancher de
PV. Refuser sur `armee` entière bloquerait le raid pour une unité que le joueur a
précisément laissée à la maison. La phrase vient de `messageSansBatiment` de
`data/base.js`, jamais d'une seconde formulation, et elle nomme la sortie.

**Et il a fallu extraire `src/sim/batiment-de-production.js` pour ne pas faire le
premier cycle de `src/sim/`.** La fonction vivait dans `sim/state.js`, qui importe
DÉJÀ `creerRecherche` de `sim/raid.js` : demander à `raid.js` de l'importer aurait
refermé la boucle. Précédents exacts : `base-courante.js` (lot BASES-0) et
`saveur.js` (lot RETOUCHES). **C'est un DÉPLACEMENT, pas une écriture** — pas une
ligne du corps n'a changé, `state.js` la RÉ-EXPORTE, et aucun de ses appelants —
les deux palettes, l'écran de réparation, le tutoriel, six fichiers de test — n'a
eu à changer d'import. Le ré-export est un `import` PUIS un `export`, jamais un
`export … from` seul : `state.js` LIT cette fonction pour son propre
`problemeDuBatimentDeProduction`, et un ré-export nu ne crée aucune liaison
locale — leçon payée au lot MURS-OUVRAGE.

**Écart déclaré : `FORCES.armee.exigeLeBatimentDeProduction` n'est PAS lu sur ce
chemin-là.** Le lire demanderait d'importer `FORCES` de `sim/state.js`, donc de
rouvrir le cycle qu'on vient de fermer ; et ce chemin EST l'armée par
construction — `composerLesVagues` ne compose que `baseCourante(etat).armee`. Le
couplage est écrit à côté du code : **le jour où Ethan retire ce verrou à
l'ARMÉE, il faut basculer LES DEUX endroits**, la table et `problemesDuRaid`.

### Point 6 — le temps de déplacement avant confirmation

`src/sim/deplacement.js`, `src/ui/monde.js`.

`delaiDuDeplacementVers(etat, cible)` entre : **une écriture, deux lecteurs**.
`deplacerLaBase` l'appelle pour ÉCRIRE `dernierDeplacementDelaiTicks`, l'écran de
la carte pour ANNONCER — le nombre annoncé est le nombre facturé **par
construction**, pas par vérification. `enDuree` est EXPORTÉE plutôt que
reformulée : c'est la phrase qui écrit déjà le refus `delai`, et son en-tête
disait depuis le lot RÈGLES-DE-CARTE pourquoi elle ne descend pas dans `ui/`.
Surtout pas `formaterDuree` de `ui/raid.js`, qui compte des ticks de COMBAT.

Les deux lignes — « Distance » et « Immobilisée » — entrent par la MÊME porte que
le bilan de territoire, `peindreLesLignes`, en UN seul appel : la discipline que
`PC T3` mesure — le bilan se calcule au TOUCHER, pas à chaque image — n'est pas
touchée. Elles se lisent AVANT le bilan : ce que le geste COÛTE avant ce qu'il
RAPPORTE.

⚠ **Aucun seuil, aucun verdict sur la courbe.** `PC T1` mesure que le panneau
annonce EXACTEMENT ce que `delaiDuDeplacementVers` donne — une cohérence entre
deux sites —, jamais que ce nombre soit le bon. Le barème appartient à Ethan.

### Point 7 — le pictogramme à gauche du nom disparaît

`src/ui/chantier.js`, `src/ui/raid.js`.

L'insertion se retire **une fois**, dans `peindreVueDuPanneau`, et le champ
`picto` de niveau TITRE part de ses quatre producteurs ENSEMBLE —
`lignesDuPanneau`, `lignesDeLaPiece`, `vueDuJournal` et `ficheDeLEntite`. Les
retirer d'un seul côté fait rougir `ERGO T7 bis`, qui exige que les vues aient
EXACTEMENT les mêmes clés.

⚠ **Les pictogrammes de LIGNE restent** : ils sont dans le CORPS, ils nomment la
grandeur de chaque paire, et `CÂB T7` les mesure toujours ligne par ligne.

### Point 8 — le bouton Réparer de la bande Défense

`src/ui/chantier.js`.

La règle est **`TERRAINS[terrainCourant()].actions[nom] === null`** — jamais un
`=== 'defense'` écrit dans l'écran, que `chantier.test.js` interdit de toute
façon depuis le lot GARNISON-ET-ARMÉE. Le jour où une cinquième action naîtra
sans moteur d'un côté, elle se masquera sans qu'une ligne soit écrite.

**Ce qui disparaît est l'AFFICHAGE.** `ACTIONS.reparer` garde son `problemes` et
son `agir`, que la bande Bâtiments emploie ; `actionSansMoteur` reste ; et le long
bloc de `TERRAINS.defense.actions` qui dit POURQUOI `reparer` vaut `null` — le
Complexe de défense répare la garnison gratuitement et tout seul depuis le lot
COMPLEXE — reste mot pour mot. C'est lui qui empêchera qu'on le recâble.
`#offense-reparer` n'est pas concerné : il a un vrai moteur, `reparerUnePiece`.

⚠ **Et une action dont le bouton va disparaître se désarme.** L'action armée
SURVIT au changement de bande, et c'est voulu depuis le 28/08 ; mais retoucher le
bouton armé est la SEULE façon de désarmer. Un bouton masqué aurait laissé
« Mode RÉPARER » actif et sans issue — le piège exact que cette barre refuse
depuis le 28/08.

---

## Tests versionnés (deux, pas plus)

### `FR T2` — l'armée recomposée jette la mémoire

`test/formation-et-garnison.test.js`.

**Montage effectif** : six pièces posées dans le désordre par `armeeDeSix`, la
formation rangée à la main — une pièce déplacée en (4, 9), une autre désactivée —
puis retenue. Deux contrôles de montage AVANT la mesure : sur la même cible et la
même armée la mémoire est rendue (sinon il n'y aurait rien à jeter), et elle
diffère de la formation d'Offense (sinon l'écart ne dirait rien).

**La recomposition se fait à LONGUEUR ÉGALE** : on retire la PREMIÈRE pièce et on
en pose une autre à la fin. C'est le point délicat — retirer sans remettre ferait
répondre le garde de LONGUEUR, et la falsification qui compte laisserait le test
vert. Le montage asserte les trois : longueur identique, **au moins cinq
positions décalées**, empreinte différente.

**Falsification jouée** : la ligne
`if (memoire.empreinte !== empreinteDeLArmee(etat)) return fraiche;` retirée de
`formationPourLaCible`. `FR T2` tombe ; remise, il repasse. **Il est le seul du
dépôt à tomber.**

### `FR T3` — la chaîne de migration se rejoue en entier

`test/formation-et-garnison.test.js`.

**Montage effectif** : une partie complète sérialisée, aplatie par
`aplatirSauvegarde` — une v0 n'a jamais porté `bases` —, rabaissée à la
version **0**, privée de `formationRetenue`, puis migrée. Le plancher est
VÉRIFIÉ et non cru : `migrer({ version: -1 })` lève « aucune migration depuis la
version -1 ».

**Ce que la chaîne depuis la v0 laisse est MESURÉ, pas supposé** : la base est
REFONDÉE — `CLAUDE.md` §6 l'écrit depuis le 26/08, « la migration 3 → 4 refonde,
elle ne convertit pas ». Relevé version par version sur ce montage : **v0 et v3
rendent 0 pièce d'armée et 1 bâtiment, v4 en rend 0 et 4** — `armee` naît à la
v7 — **et v10 et au-delà rendent les six pièces et les quatre bâtiments**. D'où le
second départ, depuis la v10 : la chaîne y tourne sur une VRAIE partie, et les
six pièces arrivent intactes avec `formationRetenue: null`.

**Le maillon n'écrase pas une mémoire déjà présente** : une v31 qui en porte une
la retrouve identique de l'autre côté.

**Et un maillon sauté ne peut pas rester silencieux** : `formationRetenue` est
dans la boucle des champs exigés par `verifierEtat`, donc une v32 qui ne le porte
pas est REFUSÉE au chargement. Le test l'asserte de face.

**Falsifications jouées, deux** :
1. le corps du maillon 31 → 32 vidé (il ne pose plus le champ) → `FR T3` tombe ;
2. le maillon RETIRÉ de la table `MIGRATIONS` → la chaîne lève « aucune migration
   depuis la version 31 », et `FR T3` tombe avec elle.

Les deux remises, il repasse.

---

## Montages existants réalignés

### Les 34 montages du point 4 — mesurés, et le brief en annonçait 32

**L'aide de montage existait déjà — écart au brief, déclaré.** Il demandait d'en
écrire une ; `test/batiments-de-production.js` est au dépôt depuis le lot
PRODUCTION-EN-DÉFENSE, 07/09, il est idempotent, il lit la liste dans
`BATIMENT_DE_CHASSIS` plutôt que de la recopier, et il fait exactement ce qu'il
fallait. **Pas une ligne de l'aide n'a changé.**

**Huit appels ont été ajoutés, dans quatre fichiers** :

| fichier | appels | où |
|---|---:|---|
| `test/poi.test.js` | 1 | le montage de `POI T18` |
| `test/raid.test.js` | 3 | `partieArmee`, `partieAuMilieu`, et le montage inline d'« armée — plancher à 1 PV » |
| `test/raid-ecran.test.js` | 1 | `partieArmee` |
| `test/recherche.test.js` | 1 | `partieAvecGarnison` |

*(trois des huit — deux dans `raid.test.js`, un dans `raid-ecran.test.js` —
étaient déjà écrits par le lot PRODUCTION-EN-DÉFENSE et n'ont pas été touchés ;
les cinq autres sont de ce lot, plus trois imports.)*

**Le compte est MESURÉ, pas repris du brief.** Dans une copie de l'arbre où les
huit appels sont neutralisés, les quatre fichiers rendent **1 + 16 + 15 + 2 = 34
rouges** — le brief en annonçait trente-deux. La liste des tests dont le message
d'échec nomme le bâtiment manquant : `POI T18`, « refus — les quatre raisons »,
« paiement », `TRANSFERT T4`, `TRANSFERT T4 bis`, « recherche », « armée » ×2,
« deux raids », « rasage », `RAID-0 T6`, `RAID-0 T9`, `MODULES-D T11` et `T12` ;
les vingt autres tombent en cascade, leur montage commun étant refusé avant la
première assertion.

⚠ **« refus — les quatre raisons de ne pas partir » en compte désormais CINQ**,
et son montage a été laissé tel quel : il n'énumère pas les codes, il vérifie que
chacun se dit.

**Deux montages ont perdu leur prémisse, et c'est le MONTAGE qu'on répare, jamais
l'assertion :**

1. **`TRANSFERT T4`** mesurait le franchissement du plafond par une comparaison
   de TAILLES — « un camp de niveau 1 rapporte largement plus que le coffre d'une
   base neuve ». L'aide monte le Chantier au niveau 5, donc le coffre de **50 à
   122** (mesuré), quand le camp rapporte **52 de quartz et 17 de scorie**. La
   prémisse était devenue fausse pour une raison qui ne regarde pas ce test. Il
   part désormais **à une unité sous le plafond** et exige les DEUX bouts : on
   part sous, on finit au-dessus. Ce n'est pas `T4 bis`, qui part déjà au-dessus.
2. **« armée — une unité détruite plancher à 1 PV »** monte sa base au niveau 12
   AVANT le rattrapage, parce que le niveau d'un camp se fixe à l'apparition.
   L'aide pose donc ses trois bâtiments **après** : posés avant, ils feraient
   tomber la moyenne des bâtiments de 12 à **3,75**, donc le camp avec, donc le
   mordant du montage. C'est le paragraphe que ce test porte depuis le 31/08,
   repris par l'autre bout.

### `CÂB T7` — inversé, pas supprimé

Il exigeait `piece.picto === 'ui_niveau'` et `batiment.picto === 'ui_niveau'` ; il
exige l'ABSENCE du champ, avec la date et la phrase d'Ethan à côté. **L'absence se
mesure par `in`, pas par `=== undefined`** : un `picto: undefined` posé d'un seul
côté passerait l'égalité et ferait diverger les formes que `ERGO T7 bis` accorde.
Son titre change avec lui — il parle désormais des pictogrammes de LIGNE. Les
sept autres assertions du test, celles du corps, n'ont pas bougé.

### Trois autres gardes changent de valeur, aucune ne s'assouplit

- **`PC T1`** — le panneau de déplacement porte deux lignes de plus. Il mesurait
  déjà que le panneau annonce EXACTEMENT ce que le moteur donne : il les voit, et
  l'ORDRE est asserté.
- **`ASSAUT T1`** — sa tranche non gloutonne s'arrêtait au PREMIER `</div>` et
  rendait neuf boutons depuis que `#raid-fleches` est imbriqué. Elle coupe
  désormais au bon endroit et compte les deux moitiés SÉPARÉMENT : **cinq mots et
  quatre flèches**, ce qui attrape aussi bien un sixième mot qu'une cinquième
  flèche. Une assertion ENTRE : aucune flèche ne nomme un sprite dans le
  balisage.
- **Le faux document de `raid-ecran.test.js`** apprend les quatre identifiants —
  il LÈVE sur tout identifiant que `src/index.src.html` n'a pas, donc il garde
  aussi que l'écran ne demande rien qui n'existe pas dans la page.
- **Quatre gardes de `SAVE_VERSION`** — `PD T10`, `JRN T10`, `RCU T12`, `B4 T7` —
  passent de 31 à 32, chacune précédée du paragraphe daté qui dit POURQUOI.
- **`PIC T7`** est RÉANCRÉ — **9 310 752 → 9 314 390**, marge **289 248 →
  285 610**, soit **3,01 % → 2,98 %**. Son ancre datait du lot
  ARRIVÉE-CARTE-ET-BUILD et MUR était passé dessus sans la toucher : l'écart
  cumulé faisait **3 638 octets**, sous la tolérance de 50 000, donc vert. C'est
  ce que sa dernière assertion existe pour empêcher — « la tolérance garde contre
  la dérive LENTE, pas contre un lot qui sait ce qu'il déplace ».
- **`test/temoins-bases-0.js`** gagne un SIXIÈME terme d'octets,
  `OCTETS_AJOUTES_PAR_RAID_ET_ECRAN = 24` — `,"formationRetenue":null` — et il
  s'AJOUTE aux cinq précédents au lieu de les remplacer.

### Les témoins

| garde | verdict |
|---|---|
| `JOURNAL T1` | **PASS** |
| `JOURNAL T1 bis` | **PASS** |
| `BASES-0 T1` | **PASS** |

Aucun témoin n'a été régénéré, `test/temoins-combat.js` n'a pas une ligne de
changée, et `src/sim/combat.js` n'apparaît pas au diff — vérifié.

---

## Contrôles joués au banc (aucun fichier de test créé)

Chromium, géométrie du S25 FE (360 × 780 CSS), livrable servi depuis `dist/`, une
vraie partie injectée dans `localStorage['foyer-zero/partie/1']` — base en
(295, 16), Chantier au niveau 12, six Meutes en vague 1, trois camps autour.

| contrôle | geste effectif | constat |
|---|---|---|
| **Même cible, la formation revient** | quatre flèches → vague 2, colonnes 1–6 ; mode « Activer » sur la colonne 3 ; ATTAQUER ; retour carte ; re-touche du camp (295, 17) | **`2:1 2:2 2:3(off) 2:4 2:5 2:6`**, à l'identique. Le raid a laissé le site DEBOUT — « Bâtiments restants 99 % », « Souche 99 % », « Défense restante 0 % » |
| **Autre cible, on repart d'Offense** | même partie, camp (296, 17) | **`1:1 1:2 1:3 1:4 1:5 1:6`**, toutes actives |
| **La translation se refuse en bloc** | six pièces en vague 1, colonnes 1–6 ; ← puis ↑ | ← : **rien ne bouge**, avis « colonne 0 hors de 1…9 » ; ↑ : **rien ne bouge**, avis « vague 0 hors de 1…4 ». → puis ↓ puis ← déplacent les six d'un coup, avis vide. Le message est DÉDOUBLONNÉ : une phrase, pas six |
| **L'Épervier sans aérodrome bloque le raid** | Épervier posé, aérodrome retiré de la disposition, second toucher sur le camp | l'écran de raid ne s'ouvre pas ; `#monde-panneau-refus` : **« sans Aérodrome, pas d'avion : désactive la pièce ou retire-la en Offense. »** L'Épervier retiré en Offense, la cible s'ouvre |
| **Le délai annoncé est celui qui sera facturé** | « Déplacer la base », case voisine, accord donné | annoncé **« Distance 1 case · Immobilisée 1 h »** ; `dernierDeplacementDelaiTicks` relu après le geste : **36 000 ticks**, soit exactement une heure. **Les deux nombres sont le même** |
| **Plus aucun pictogramme dans les quatre titres** | fiche d'un bâtiment, fiche d'une pièce d'armée, journal, fiche d'une cible ennemie | **0 pictogramme au titre** dans les quatre. Les corps en portent toujours : **6** sur la fiche d'une pièce, **5** sur celle d'une cible ennemie |
| **Réparer absent en Défense, présent au Chantier** | bascule Base → Défense → Base | Chantier : `hidden = false`, affiché. Défense : `hidden = true`, non affiché. Retour : affiché. Les trois autres boutons ne se masquent jamais, `#offense-reparer` non plus |
| **Un mode armé ne reste pas sans issue** | « Réparer » armé au Chantier, puis bascule en Défense | bouton masqué, classe `arme` RETIRÉE, ligne de mode **vide** |

⚠ **Le déroulé du raid n'a pas été regardé en temps réel, et c'est déclaré.** Le
volet du navigateur reste masqué dans cet environnement, donc
`requestAnimationFrame` ne bat pas et le déroulé se fige. Le raid a été conclu par
la porte que le jeu offre déjà — page masquée ⇒ rapport immédiat, lot
RETOUR-DE-RAID — et l'ÉTAT, lui, était commis avant la première image depuis
l'arbitrage du 01/09. Ce qui est mesuré ci-dessus est donc l'état d'après-raid,
pas l'animation.

### Géométrie relevée, avant et après

| grandeur | avant | après |
|---|---:|---:|
| `#raid-rangee` | 360 × 56 | **360 × 56** |
| `#raid-boutons` | 240 × 48 | **240 × 48** |
| bouton de mot | 45,6 × 48 (cinq parts égales) | 45,8 · 42,5 · 57,7 · 36,2 · 45,9 × 22,9 |
| « Simulateur » | demande 48,5 px, en reçoit 45,6 → **coupé** | en reçoit 57,7 → **entier** |
| flèche | — | **57,8 × 21,9** |
| débordement horizontal | 0 | **0** |

---

## Mesures consignées, sans assertion

**Le délai de déplacement (point 6).** Ce que l'écran annonce, et ce que le geste
facture — les deux sortent de `delaiDuDeplacementVers`, donc ils sont égaux par
construction. Aucun seuil, aucun verdict : la courbe appartient à Ethan.

| niveau des bâtiments | distance | annoncé | ticks facturés |
|---:|---:|---|---:|
| 1 | 1 | 1 h | 36 000 |
| 1 | 5 | 1 h | 36 000 |
| 1 | 10 | 1 h | 36 000 |
| 5 | 1 | 1 h 1 | 36 240 |
| 5 | 5 | 1 h 2 | 37 080 |
| 5 | 10 | 1 h 4 | 38 160 |
| 10 | 1 | 1 h 3 | 37 800 |
| 10 | 5 | 1 h 15 | 45 000 |
| 10 | 10 | 1 h 30 | 54 000 |
| 20 | 1 | 1 h 12 | 43 200 |
| 20 | 5 | 2 h | 72 000 |
| 20 | 10 | 3 h | 108 000 |
| 35 | 1 | 1 h 45 | 62 940 |
| 35 | 5 | 4 h 45 | 170 760 |
| 35 | 10 | 8 h 30 | 305 460 |
| 50 | 1 | 3 h 18 | 118 800 |
| 50 | 5 | 12 h 30 | 450 000 |
| 50 | 10 | **24 h** | 864 000 |

⚠ **Aux trois premiers niveaux la distance est gratuite**, et ce n'est pas un
défaut du point 6 : c'est la forme du barème d'EMPRISES-ET-DÉLAI — le plafond
passe sous le plancher d'une heure en dessous du niveau 4,2, et le `max(0, …)` du
terme de distance écrase alors le surplus. Le lot ne fait que le RENDRE VISIBLE
au joueur, ce qui est exactement ce qu'Ethan demande.

Contrôle par exécution, hors écran : base au niveau 35, saut de 8 cases —
**annoncé 251 580 ticks (7 h), facturé 251 580 ticks**.

**Le coût de la mémoire dans la sauvegarde.** `,"formationRetenue":null` fait
**24 octets**, et le nombre est FIXE sur les vingt-cinq graines du témoin de
BASES-0 : le scénario n'ouvre aucun écran de raid, donc rien ne s'y range. C'est
le plus petit coût qu'un champ neuf puisse avoir.

---

## Écarts au brief

1. **L'aide de montage existait déjà.** Le brief demandait d'écrire « un seul aide
   de montage » ; `test/batiments-de-production.js` est au dépôt depuis le 07/09
   et fait exactement cela. Huit appels ajoutés, pas une ligne de l'aide.
2. **Le point 4 déplace 34 montages, pas 32** — mesuré en neutralisant les huit
   appels dans une copie de l'arbre.
3. **`FORCES.armee.exigeLeBatimentDeProduction` n'est pas lu dans
   `problemesDuRaid`** : le lire rouvrirait le cycle d'imports que
   `sim/batiment-de-production.js` vient d'être écrit pour fermer. Le couplage est
   déclaré dans le code, et il faudra basculer les deux endroits ensemble.
4. **La translation ne passe PAS par `problemesDuDeplacementEnFormation`, pièce
   par pièce**, comme le brief le suggérait : mesuré, cet appel-là refuse une
   translation légale dès que deux pièces se suivent. Elle juge la formation
   d'ARRIVÉE, motif de la permutation.
5. **Les flèches prennent la place VERTICALE, pas la largeur** — le brief disait
   « la place existe : `#raid-boutons` » sans dire laquelle. Mesuré : à la
   largeur, les cinq mots tombaient à 35,4 px et deux de plus se coupaient.
6. **`FR T3` part de la v0 ET de la v10**, parce que la chaîne depuis la v0
   REFONDE la base — fait documenté depuis le 26/08 et remesuré ici. Partir de la
   v0 seule prouverait que la chaîne ne lève pas, pas qu'elle porte une partie.
7. **Le contrôle « délai annoncé = délai facturé » est joué au BANC, pas asserté
   dans un test** : le brief le range lui-même parmi les six contrôles du §7, et
   `PC T1` se contente de mesurer que les deux lignes viennent de la fonction que
   `deplacerLaBase` lit.
8. **La ligne d'attente porte DEUX lignes, « Distance » et « Immobilisée »**, là
   où le brief ne demandait que le temps. La distance est affichée parce qu'elle
   est FACTURÉE — sans elle, le joueur lirait un délai sans savoir ce qui le fait
   monter.

---

## Restes ouverts

1. ⚠⚠ **La sortie « désactiver » n'est pas atteignable depuis la carte, et c'est
   trouvé en jouant.** `entrerDansLaCible` lit `problemesDuRaid` : le refus du
   point 4 ferme donc l'écran de raid, qui est le SEUL endroit où l'on désactive
   une pièce — l'écran Offense n'a pas ce geste. La phrase nomme deux sorties et
   **une seule est ouverte** dans ce cas-là ; l'autre l'est si le joueur est déjà
   sur l'écran de raid quand le bâtiment tombe. **Deux issues, et Ethan tranche** :
   soit la phrase ne nomme que l'Offense, soit l'écran de raid s'ouvre et ne
   refuse qu'au DÉPART. Relevé, non corrigé.
2. **Le jumeau du point 8 côté Offense n'existe pas** : `ACTIONS_ARMEE` n'a aucune
   action à `null` aujourd'hui, donc la règle « un bouton sans moteur sur ce
   terrain-là ne s'affiche pas » n'y mord sur rien. Elle est écrite une fois, dans
   `marquerBoutonsAction` du Chantier ; le jour où l'Offense en aura besoin, il
   faudra la répéter là-bas ou la monter.
3. **Le rendu n'a pas été vu sur l'appareil d'Ethan** (§3). Tout ce qui précède
   est relevé dans Chromium à la géométrie du S25 FE ; ce n'est pas son téléphone.
   Ce qu'il faut regarder au premier essai : les quatre flèches à 57,8 × 21,9 px
   sous le doigt, et la seconde rangée de `#raid-boutons`.
4. **Le déroulé d'un raid en temps réel n'a pas été regardé** — voir le contrôle
   au banc ci-dessus.
5. **`enDuree` écrit « 1 h 12 » sans le mot « min »**, ce qui est la forme
   existante depuis le lot RÈGLES-DE-CARTE et n'a pas été touchée : la changer
   ici ferait diverger la ligne du panneau et le message de refus `delai`.
