# RAPPORT — lot FORMATION-ET-GARNISON

**Version produite : 0.99.32 · build 134.** `npm run check` → **1 441 pass /
0 fail**, `dist/index.html` **8 654 436 octets**, 0 référence externe.

---

## §0 — LES PRÉ-VÉRIFICATIONS, ET CE QU'ELLES ONT RENDU

Les quatre étapes du brief ont été faites avant d'écrire une ligne. Deux d'entre
elles ne rendent pas ce que le brief annonce, et il faut le dire dans ce sens-là.

⚠⚠ **LA BASE N'ÉTAIT PLUS CELLE DU BRIEF, ET C'EST BÉNIN.** Il décrit le commit
`5593b2c` (PR #111, lot BÂTIMENTS-QUATRE-ÉTATS) et annonce **1 419 tests,
8 647 037 octets, marge 7,02 %**. Mesuré au départ, `main` était à **`e97fb72`**
— PR #112, « correctif — la migration v28 → v29 effaçait des bâtiments », mergée
entre l'écriture du brief et son exécution :

| | brief (`5593b2c`) | mesuré (`e97fb72`) |
|---|---|---|
| `npm test` | 1 419 pass | **1 421 pass / 0 fail** |
| `dist/index.html` | 8 647 037 o | **8 647 318 o** |
| marge T10 | 7,02 % | **7,02 %** |

Les deux tests de plus et les 281 octets sont ceux de la PR #112. **Rien de ce
dont ce lot dépend n'avait bougé**, vérifié un par un.

⚠ **LES TREIZE ANCRES DU §9 SONT PRÉSENTES ET UNIQUES**, vérifiées par un
balayage avant écriture — une occurrence exactement pour chacune, `A1` à `A13`,
y compris les trois ancres multi-lignes (`A1`, `A9`, `A13`).

⚠ **`npm install`** : `esbuild` était déjà présent, aucune installation.
⚠⚠ **DEUX ÉCARTS D'ENVIRONNEMENT, NI L'UN NI L'AUTRE DANS LE DÉPÔT.** Le `node`
du PATH est **20.11.1** : `npm test` lance `node --test "test/*.test.js"`, et le
glob demande Node ≥ 21 — la commande ne trouve alors **aucun** fichier et sort en
erreur, sans qu'aucun test n'ait tourné. Un **Node 22.23.2 portable** a été
déposé à côté du `gh` portable, dans `C:\Users\ethan\Desktop\claudax\outils\`,
hors du dépôt. `package.json` ne déclare toujours aucun `engines` — **point
ouvert, signalé pour la quatrième fois**. Et `core.autocrlf` valait déjà `false`
sur ce clone, donc les balayages de source n'ont pas rougi.

⚠ **`tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot ne
touche ni `art/`, ni un outil de la chaîne. **Aucun fichier d'`art/` n'apparaît
au diff** — vérifié.

---

## §1 — CE QUI EST LIVRÉ

| Fichier | Nature |
|---|---|
| `src/sim/formation-de-raid.js` | **neuf** — la copie de travail de l'armée |
| `test/formation-et-garnison.test.js` | **neuf** — vingt tests, `FG T1` à `FG T20` |
| `src/sim/combat.js` | l'inertie, le débarquement, les deux listes fermées |
| `src/sim/raid.js` | `composerLesVagues(etat, formation)`, `options.formation` |
| `src/sim/state.js` | `problemesDeLEffectif` **exporté**, rien d'autre |
| `src/data/modules.js` | `garnison.cable.offense` passe à `true` |
| `src/ui/raid.js` | la formation dans la fermeture, permutation, embarquement |
| `src/index.src.html` | le badge passager et le liseré d'un véhicule chargé |
| `package.json` | 0.99.31 · 133 → **0.99.32 · 134** |
| `CLAUDE.md` | §0 et §2 |
| `test/recherche.test.js` | six gardes de câblage remesurées |
| `test/raid.test.js` | `RAID-A T6` change de destination et se resserre |
| `test/batiments-quatre-etats.test.js` | une garde corrigée — voir §6 |

**Coût du livrable : +7 118 octets**, mesuré poste par poste contre un livrable
rebâti dans un `git worktree` depuis `e97fb72` :

| poste | avant | après | écart |
|---|---|---|---|
| images | 6 909 281 | 6 909 281 | **+0** |
| audio | 1 193 346 | 1 193 346 | **+0** |
| feuille | 125 687 | 127 226 | **+1 539** |
| JavaScript | 383 467 | 389 046 | **+5 579** |
| balisage | 35 537 | 35 537 | **+0** |
| **total** | **8 647 318** | **8 654 436** | **+7 118** |

La somme des cinq postes tombe EXACTEMENT sur le total. **297 lignes `data:`
avant, 297 après** : aucune ressource n'entre. Borne T10 **inchangée à
9 300 000**, marge **645 564 octets, 6,94 %**.

⚠ **`SAVE_VERSION` NE BOUGE PAS ET RESTE À 29** — vérifié au diff : `src/sim/state.js`
ne gagne qu'un mot-clé `export` et son commentaire. Pas un champ n'entre dans
l'état, et c'est la conséquence directe de « la formation repart toujours de
celle d'Offense ».

---

## §2 — LES ANCRES, ET CE QU'ELLES SONT DEVENUES

Les treize ont été vérifiées **présentes et uniques** avant écriture, puis
appliquées. Aucune n'a manqué.

| # | Fichier | Compte avant | Ce qu'elle est devenue |
|---|---|---|---|
| A1 | `src/ui/raid.js` | 1 | l'import de `sim/state.js` **disparaît**, remplacé par celui de `sim/formation-de-raid.js` et `nomDuModule` |
| A2 | `src/ui/raid.js` | 1 | `problemesDuDeplacementEnFormation(formation, index, position)`, et trois autres routes |
| A3 | `src/ui/raid.js` | 1 | `deplacerEnFormation(formation, index, position)` |
| A4 | `src/ui/raid.js` | 1 | `vaguesDeLArmee(etat, formation)` |
| A5 | `src/ui/raid.js` | 1 | `surPointerDown` gagne le départage badge / porteur |
| A6 | `src/sim/raid.js` | 1 | `composerLesVagues(etat, formation)` |
| A7 | `src/sim/raid.js` | 1 | `composerLesVagues(etat, formation = null)` |
| A8 | `src/sim/raid.js` | 1 | inchangée — c'est elle que tout le lot protège |
| A9 | `src/sim/combat.js` | 1 | `return e.vivant && !e.sorti && !e.embarquee;` |
| A10 | `src/sim/combat.js` | 1 | la passagère entre avec son porteur, sans prendre de case |
| A11 | `src/sim/combat.js` | 1 | inchangée — `estActive` fait le travail |
| A12 | `src/sim/state.js` | 1 | `export function problemesDeLEffectif(…)` |
| A13 | `src/data/modules.js` | 1 | `cable: { offense: true, defense: false }` |

---

## §3 — LES VINGT TESTS, PASS/KO ET MONTAGE EFFECTIF

Tous **PASS**. Le montage donné est celui qui a réellement tourné, pas celui que
le brief prévoyait.

| # | Verdict | Montage effectif |
|---|---|---|
| **FG T1** | PASS | Six pièces sur trois vagues, **posées dans le désordre** — le test asserte d'abord que l'ordre de pose n'est PAS l'ordre trié, sans quoi une copie qui ne trierait pas passerait. `deepEqual` sur `vagues` ET `indices` entre les deux chemins. |
| **FG T2** | PASS | Même état, `serialiser(etat, INSTANT)` avant / après **cinq** gestes — deux déplacements, une permutation, une désactivation, un embarquement. Égalité de CHAÎNE, octet pour octet. Et une contre-assertion prouve que les cinq ont bien changé la formation. |
| **FG T3** | PASS | Formation modifiée, puis reconstruite — **sur un état dont la pièce 0 porte `actif: false`**, le cas d'une sauvegarde d'avant ce lot. Les six pièces sont comparées champ par champ. |
| **FG T4** | PASS | Graine 7, premier camp. Formation modifiée (un déplacement + un embarquement), `executerRaid` sur `structuredClone`, `simulerRaid` sur l'original, `deepEqual` des deux rapports. **Plus une contre-mesure** : le même raid SANS formation rend un autre rapport. |
| **FG T5** | PASS | Deux pièces de niveaux 3 et 7, dégâts 12 345 et 6 789. Le test asserte d'abord que les deux diffèrent — sans quoi « ils suivent » serait vrai de n'importe quel code. `pointsEngages` et la somme sur la formation, inchangés. |
| **FG T6** | PASS | Éclaireur (1, 3), Fusiliers (1, 4), Chasseur (4, 9). Le test asserte d'abord que la colonne 4 REFUSE, puis qu'elle accepte après embarquement, puis interroge `problemesDeLEffectif` directement. Points et longueur de liste inchangés. |
| **FG T7** | PASS | Quatre montages : Percheron (`sansModule`), Éclaireur module non payé (`moduleNonAcquis`), Éclaireur chargé (`dejaCharge`), Chasseur candidat passager (`pasUneInfanterie`). Les quatre **codes** et les quatre **messages** mot pour mot, plus la levée sur un geste refusé. |
| **FG T8** | PASS | Porteur en vague 3 colonne 6, passagère posée en vague 1, un Pionnier en vague 1. Deux vagues émises ; la passagère est **seconde** de la vague du porteur, `embarquee: true`, colonne 6. `indices` vaut `[iAutre, iPorteur, iPassagere]`. |
| **FG T9** | PASS | Graine 11, six identifiants **distincts** en vague 1 — Grenadiers, Pionnier, **Éclaireur chargé au milieu**, Chasseur, Milan, Fusiliers. Le combat est REJOUÉ à l'identique par `resoudre(creerCombat({...montageDuRaid, vagues}))` et `attaquants[i].id` est croisé avec `armee[indices[i]].id`, un par un. Plus `doesNotThrow` sur le vrai `executerRaid`. |
| **FG T10** | PASS | Éclaireur + passagère en (2, 5), **Casemate en (6, 5)**, et une **seconde vague** en (2, 5). Vingt ticks : `aTire === false`, aucun `cibleIndice` de défenseur ne la vise, PV intacts. Le montage MORD — le porteur, lui, est visé et touché. Puis, au tick 50, la vague 2 **entre** sur la case de la passagère : c'est la mesure de `construireOccupation`, la seule observable de l'extérieur du moteur. |
| **FG T11** | PASS | Éclaireur + passagère montés en rangée 10 ; le seuil est lu dans `GRILLE.bandes`, jamais écrit `11`. Au tick du franchissement : `embarquee` faux, **rangée 10, colonne 5**, PV du départ, et une ligne dans `journal.apparitions`. |
| **FG T12** | PASS | Éclaireur monté à **1 milli-PV** en (6, 5), Casemate en (8, 5). Un seul tick : le porteur meurt à l'étape 6, la passagère sort **rangée 5** avec `pvMilli === pvInitialMilli`. |
| **FG T13** | PASS | Deux passes avec l'Épervier, **réserve à zéro**. ⚠ Sans cela le montage NE MESURAIT RIEN : `doitSArreter` rend vrai devant un bâtiment, donc l'aéronef s'arrêtait à la rangée 10 pour tirer sur celui qui barre sa case et ne franchissait jamais — la passe 2 restait embarquée soixante ticks. Réserve vide, `degatsContre` rend 0 contre un bâtiment et il vole. Passe 1 (case libre) → rangée 11 ; passe 2 (Terril en (11, 5)) → rangée 10. Une assertion exige que les deux passes rendent des rangées DIFFÉRENTES. |
| **FG T14** | PASS | Éclaireur à 1 PV en (12, 5), Terril en (11, 5), Casemate en (10, 5), **plus une alliée en (2, 1)**. ⚠ L'alliée est OBLIGATOIRE : une passagère qui attend n'est pas un attaquant actif, donc `conditionsDeFin` concluait « attaquants » au tick où le porteur meurt et le combat s'arrêtait avant qu'aucune case ne se libère. Six ticks d'attente, puis les PV du Terril sont forcés à zéro — **forgé, et dit comme tel** : rien dans ce combat ne peut l'abattre. Elle sort au tick suivant, rangée 11, PV intacts. |
| **FG T15** | PASS | Éclaireur **réserve à zéro** en rangée 10, Gangue en (11, 5), aucun défenseur. ⚠ C'est la seule façon d'atteindre le repli sans forger l'entité : à réserve pleine il tirerait sur le bâtiment, `nuit(e)` remettrait `ticksInutiles` à zéro et il ne rentrerait jamais. Le repli tombe **une dizaine de ticks après `TICKS_AVANT_REPLI`** — `peutAvancer` appelle « progresser » le fait d'avancer À L'INTÉRIEUR de sa case. Les deux portent `sorti === true`, la passagère reste `embarquee` (elle est RENTRÉE, pas débarquée), et les deux comptent parmi les survivants. |
| **FG T16** | PASS | `moduleEstCable` des deux côtés, `problemesDeLAchat` sur la ligne offense de l'Éclaireur (vide), achat, puis la même ligne **en défense** qui rend toujours `effetNonCable`. |
| **FG T17** | PASS | *(le brief l'appelait « les deux cents témoins » — voir §5.)* `vaguesDeLArmee` avant / après embarquement : la colonne 4 se vide, le badge porte la passagère, `porteur` vaut vrai. `vueDuRaid(…).engagees` vaut 2 pour une seule case occupée. Et `problemesDuRaid` rend `sans-armee` sur une formation entièrement désactivée pendant que l'armée, elle, ne le rend pas. |
| **FG T18** | PASS | Une pièce abîmée à 400 000 milli-PV, réparée dans `etat.armee` APRÈS la copie. `resynchroniserLaFormation` rend les dégâts et **ne rend ni la case ni le drapeau**. Plus une garde de SOURCE : l'écran appelle bien la remise à niveau, **sous la condition `m.ecritSurLArmee`** — voir §7, falsification 7. |
| **FG T19** | PASS | Embarquement, puis débarquement refusé sur une case prise, accepté sur une case libre. Et les deux gardes qui LÈVENT : déplacer ou permuter une passagère. Un porteur CHARGÉ, lui, se permute, et sa passagère le suit — vérifié par `passagerDe` après la permutation. |
| **FG T20** | PASS | *(écrit APRÈS une falsification muette — voir §7.)* Vague 1 = une alliée en (2, 5) bloquée par un **Merlon** en (3, 5) qui ne tire pas ; vague 2 = le porteur et sa passagère, même case. Au tick 55 **aucun des deux n'est entré** et `enAttente` porte les deux descripteures dans l'ordre. Le mur tombe, l'alliée repart, et les deux entrent **avec des indices consécutifs**, `porteurIndice` en règle. |

⚠ **`temoins-combat.js` N'A PAS UNE LIGNE DE CHANGÉE, ET LES DEUX CENTS TÉMOINS
SONT VERTS.** C'est le `T17` du brief, et il est tenu — voir §5.

---

## §4 — LES ÉCARTS AVEC LE BRIEF, ET LEUR RAISON

⚠⚠ **1. `problemesDuRaid` PREND LA FORMATION — AJOUT NON DEMANDÉ.** Le brief ne
nomme que `composerLesVagues` et `executerRaid`. Sans cet ajout, une formation
entièrement désactivée passait le refus `sans-armee` : le moteur résolvait un
combat **sans un seul attaquant**, les points étaient payés, le raid perdu, et le
bouton n'avait rien dit. Le compteur « engagées » de `vueDuRaid` mentait de la
même façon. Le défaut est `null`, donc l'ancien comportement est intact
(`FG T17` mesure les deux sens). **CLAUDE.md §5 : « ne jamais signaler un défaut
connu au moment de livrer : le corriger avant. »**

⚠⚠ **2. `resynchroniserLaFormation` — AJOUT NON DEMANDÉ, ET C'EST LE DÉFAUT LE
PLUS DISCRET DU LOT.** « Réparer » et « Tout réparer » écrivent dans
`etat.armee` ; la formation en porte une COPIE, prise à l'ouverture de l'écran.
Sans remise à niveau, un raid lancé juste après une réparation partait avec les
dégâts d'il y a cinq minutes, et une pièce remontée au-dessus du plancher de PV
restait à la maison — `composerLesVagues` lisant la copie. **Aucun test ne
l'aurait dit : les deux chemins sont muets.** La fonction ne touche QUE `niveau`
et `degatsMilli`, jamais les quatre champs que la formation possède.

⚠⚠ **3. LE DÉPLACEMENT ET LA PERMUTATION D'UN PASSAGER LÈVENT — LE MÉCANISME DU
BRIEF NE FIRE PAS.** Il pose que `vague: null` fera refuser tout déplacement
direct par `hors-grille`. **Mesuré : il ne le fait pas.** Le candidat que
`problemesDuDeplacementEnFormation` soumet est `{ ...piece, ...position }`, et la
position ÉCRASE les deux `null` : la liste revenait VIDE, `deplacerEnFormation`
posait la pièce sur une case et elle gardait son `embarqueDans` — une pièce à la
fois posée et embarquée, que `composerLesVagues` montait derrière son porteur en
ignorant sa case. Les deux gestes portent donc une garde EXPLICITE, et elle LÈVE
plutôt que de refuser : l'écran route un passager vers le débarquement ou vers un
autre véhicule, jamais là, donc un appelant qui y arrive s'est trompé de chemin.
⚠ **Ce qui reste vrai du brief est la SUPERPOSITION** : `autre[f.axe] === axe`
ne peut pas être vrai avec `null`, donc « elle libère sa case » tient bien PAR
CONSTRUCTION — `FG T6` le mesure sur le validateur lui-même.

⚠⚠ **4. `embarquee` N'EST POSÉ SUR L'ENTITÉ QUE S'IL EST VRAI.** Le brief demande
de l'ajouter aux deux listes fermées, ce qui est fait ; il ne dit pas comment
l'écrire sur l'entité. Un champ posé sur TOUTES les entités entre dans
`serialiserEtat`, donc dans l'empreinte d'état de `test/temoins-combat.js` : **les
deux cents témoins auraient rougi d'un coup**, sur des montages où pas un
passager n'embarque. Le témoin ne se rafraîchit pas ; c'est donc le champ qui
reste absent là où il n'a rien à dire. Même raison pour le `embarquee:
u.embarquee` du `descripteurs.push` : à `undefined`, `JSON.stringify` laisse
tomber la clé, et les descripteures d'un montage sans passager rendent les mêmes
octets qu'avant le lot.

⚠ **5. `creerCombat` REFUSE UNE PASSAGÈRE QUI NE SUIT PAS UN PORTEUR** — garde
non demandée. Elle est ce qui rend légitime le `porteur.indice` d'`apparitionDeVague` :
sans elle, une passagère en tête de vague donnerait un `TypeError` au montage.

⚠ **6. `vaguesDeLArmee` REND DEUX CHAMPS DE PLUS** — `porteur` et `passager`.
Le brief demande un badge sans dire d'où l'écran tire de quoi le peindre. Les
deux questions sont distinctes et le restent : `porteur` est le couple
`nomDuModule` × `moduleEstAcquis` — « ce joueur-là peut s'en servir » — et sert
la phrase du survol ; le **geste**, lui, se route sur la ligne qui PORTE le
module, acquis ou non, pour que le refus « le module Garnison n'est pas acquis »
puisse s'afficher au lieu que le glissement bascule en permutation.

⚠ **7. `MODES_RAID` GAGNE `ecritSurLArmee`.** Les deux modes n'écrivent pas au
même endroit — « Réparer » dans l'état, « Activer » dans la copie — et le drapeau
le dit dans la table plutôt que par un `nom === 'reparer'` écrit à la main.

⚠ **8. `test/batiments-quatre-etats.test.js` — UNE GARDE CORRIGÉE, PAS
ASSOUPLIE.** `B4 T7` s'annonçait « la garde du numéro de SAUVEGARDE » et
assertait `package.json.version === '0.99.31'` : la mauvaise grandeur. Le numéro
de version bump à chaque lot qui change `dist/index.html` (§5 de CLAUDE.md), donc
ce test tombait au premier lot suivant — celui-ci — pour une raison qui n'a rien
à voir avec la sauvegarde. Il asserte désormais **`SAVE_VERSION === 29`**, ce que
son propre commentaire annonçait. **Le nom de la garde et ce qu'elle lit
s'accordent enfin, et la garde est plus forte** : elle tombe si le format de
l'état bouge, ce qu'elle ne faisait pas.

⚠ **9. VINGT TESTS AU LIEU DE DIX-SEPT.** Les `T1` à `T16` du brief sont rendus
tels quels ; son `T17` — « les deux cents témoins n'ont pas bougé » — n'est pas
un test à écrire mais un FAIT à mesurer, et il l'est (§5). Trois tests entrent en
plus : `FG T17` (ce que l'écran montre de la formation), `FG T18` (la remise à
niveau, écart n° 2) et `FG T20` (une passagère n'entre jamais avant son porteur,
écrit après une falsification muette).

⚠ **10. `package-lock.json` — REMIS EN ÉTAT.** `npm install` y réécrit `name` et
`version` (`chantier` / `0.1.0` → le nom réel) ; le lot n'a rien à y faire, donc
le fichier est restauré. **Le lockfile porte donc encore un nom et une version
périmés** — sans conséquence, `npm ci` n'en fait rien. Point ouvert.

---

## §5 — CE QUI N'A PAS BOUGÉ, VÉRIFIÉ

- **Les deux cents témoins de `test/temoins-combat.js` sont VERTS, sans que le
  fichier ait une ligne de changée.** Aucun passager n'embarque dans ces
  montages, donc le champ `embarquee` n'y est jamais écrit et l'empreinte d'état
  ne peut pas bouger. C'est le `T17` du brief, tenu.
- **`SAVE_VERSION` reste à 29**, et `src/sim/state.js` ne gagne qu'un `export`.
- **§7 du brief, point par point** : `declencherNeutralisations`,
  `cibleDeNeutralisation` et `ticksDeNeutralisation` n'ont pas une ligne de
  changée — vérifié au diff ; `src/data/sons.js` n'est pas touché ;
  `src/ui/offense.js` non plus ; **aucun mode « Débarquer » n'entre dans
  `MODES_RAID`** ; le `actif` résiduel des anciennes sauvegardes n'est pas purgé.
- **Aucun fichier d'`art/` au diff**, et aucune image n'entre au livrable.
- **Le mode armé l'emporte toujours sur le glissement** : la garde
  `if (mode !== null)` en tête de `surPointerDown` est intacte. La dette
  d'ergonomie déclarée en tête de `ui/raid.js` reste entière.

---

## §6 — CE QUI A CHANGÉ AILLEURS, ET POURQUOI

**Six gardes de câblage remesurées, aucune assouplie.** Le drapeau
`garnison.cable.offense` fait tomber sept assertions qui décrivaient l'état
d'avant. Chacune portait sa condition de mort, et deux la nommaient en toutes
lettres.

| Garde | Ce qui change |
|---|---|
| `T11` | **8 → 6** lignes non câblées ; les deux qui partent sont la Garnison de l'Éclaireur et de l'Épervier. ⚠ Le contre-cas que ce test annonçait — « ce qui falsifierait ce test : passer `cable.offense` à `true` sur `garnison` » — **s'est produit**, et le compte est REMESURÉ plutôt que rattrapé. |
| `MODULES-A T9` | **13 → 14** modules câblés. Une assertion ENTRE : le catalogue n'a plus un seul module câblé nulle part. |
| `MODULES-A T10` | Le contre-cas du message « n'a pas encore d'effet en jeu » **a disparu du jeu** : il portait la Meute, puis le Ratisseur « encore câblé nulle part », en annonçant « le jour où elle le sera, ce bloc changera de pièce à son tour ». Il n'y a plus de pièce où aller. Le test asserte le FAIT — aucun module câblé nulle part — et vérifie que la ligne de DÉFENSE du Ratisseur nomme désormais sa branche. |
| `MODULES-B T13`, `MODULES-C T10` | La liste des modules sans effet passe de `['garnison']` à `[]`. |
| `MODULES-C T10` | Lignes ouvertes : **offense 12 → 14**, défense 11 inchangée. |
| `MODULES-D T3` | **7 → 8** modules câblés en offense. Le huitième ne passe pas par `moduleActif` — la Garnison décide de ce que `composerLesVagues` MONTE — et le test le dit. |
| `RECH-É T5`, `T15` d'écran | La ligne témoin passe de l'Épervier (offense) au Flashbang des **Fusiliers en défense** : gratuite donc acquise, et son refus d'effet s'affiche seul. ⚠ `T15` se RESSERRE au passage — il assertait une ligne, il asserte maintenant que **le panneau OFFENSE entier** ne porte plus aucun refus d'effet. |

**`RAID-A T6` change de destination et se resserre.** Il gardait « le
glisser-déposer passe par `deplacerEffectif` » ; ce qu'il défend n'a pas changé
d'un mot — le geste DEMANDE, puis il agit —, c'est sa destination qui a bougé. Il
nomme désormais les **quatre** gestes du glissement au lieu d'un, et il interdit
l'écriture directe d'un champ **des deux côtés**, `etatCourant.armee` ET
`formation`.

**Conséquence de jeu à dire : le message « n'a pas encore d'effet en jeu » est
devenu inatteignable par l'arbre de recherche.** Tout refus `effetNonCable` nomme
désormais sa branche. La ligne de code n'est pas retirée — elle parlera du
prochain module écrit avant son moteur.

---

## §7 — LES QUINZE FALSIFICATIONS

Chacune est appliquée seule sur l'arbre final, la suite complète est lancée, puis
le fichier est remis en état.

| # | Falsification | Tests tombés |
|---|---|---|
| F1 | `estActive` perd `&& !e.embarquee` | 4 — `FG T10`, `T11`, `T13`, `T14` |
| F2 | `embarquee` sort de la liste fermée du descripteur | 7 — `FG T9` à `T14` |
| F3 | `embarquee` sort de l'en-tête d'`ajouterEntite` | **294** — le montage lève partout |
| F4 | la passagère est émise AVANT son porteur | 32, dont `BASES-0 T1`, `FG T1`, `T4`, `T8` |
| F5 | la copie RETIRE une pièce au lieu de la copier | 1 — `FG T3` |
| F6 | `actif: true` omis à la copie | 1 — `FG T3` |
| F7 | la remise à niveau enfermée dans `if (false)` | **0 au premier relevé**, 1 après correction — `FG T18` |
| F8 | l'ordre des deux essais de sortie inversé | 1 — `FG T13` |
| F9 | l'exemption de collision retirée d'`ajouterEntite` | 8 |
| F10 | le seuil de franchissement écrit `12` en dur | 2 — `FG T11`, `T14` |
| F11 | le porteur replié n'emmène plus sa passagère | 1 — `FG T15` |
| F12 | `problemesDuRaid` cesse de lire la formation | 1 — `FG T17` |
| F13 | `executerRaid` ignore `options.formation` | 1 — `FG T4` |
| F14 | la passagère entre sans son porteur | **0 au premier relevé**, 1 après écriture de `FG T20` |
| F15 | le déplacement d'une passagère n'est plus gardé | 1 — `FG T19` |

⚠⚠ **DEUX MUETTES, ET CHACUNE A PRODUIT UN TRAVAIL.**

**F7.** La garde de source de `FG T18` COMPTAIT les occurrences de
`resynchroniserLaFormation(` : un appel enfermé dans un `if (false)` la laissait
verte. C'est le proxy que le dépôt a déjà payé au lot ÉCRAN-CARTE, commis à
nouveau. Elle lit désormais la CONDITION — `if (m.ecritSurLArmee)
resynchroniserLaFormation(` —, et la falsification mord.

**F14.** Aucun montage du lot ne retenait un porteur à l'apparition, et il a
fallu le chercher : c'est impossible en vague 1 — `creerCombat` refuse deux
entités sur une case —, donc il faut une **vague 2 dont la colonne est encore
tenue par une alliée de la vague 1**, elle-même bloquée par un mur qui ne tire
pas. `FG T20` monte cela, et la falsification mord.

---

## §8 — LA RELECTURE HOSTILE DU §11

1. **`11`, `ratisseur`, `busard` en dur ?** Non. Le seuil est
   `GRILLE.bandes.batiments.premiere` (`RANGEE_DEFENSE_FRANCHIE`), et `FG T11`
   asserte l'égalité avec la table. Les deux porteurs ne sont nommés QUE dans la
   prose du module, jamais dans une condition — la règle se lit dans
   `nomDuModule('offense', id) === 'garnison'`.
2. **`embarquee` dans les DEUX listes fermées ?** Oui — l'en-tête d'`ajouterEntite`
   (ligne 593) et le `descripteurs.push` de `creerCombat` (ligne 991). F2 et F3
   le mesurent séparément.
3. **Le `deepEqual` de sérialisation prouve-t-il vraiment que rien n'a fui ?**
   `FG T2` compare deux CHAÎNES rendues par `serialiser(etat, INSTANT)`, avec un
   instant fixe pour que seul le contenu puisse différer, et il porte une
   contre-assertion qui prouve que les cinq gestes ont bien changé la formation.
4. **Un test n'assure-t-il que le champ que le correctif vient d'écrire ?**
   `FG T18` était dans ce cas — il ne mesurait que `resynchroniserLaFormation`,
   la fonction du lot. Il gagne une garde de SOURCE sur le point d'appel, et F7
   l'a exigée.
5. **Quelque chose du §7 a-t-il été touché ?** Non — voir §5.
6. **Les deux cents témoins sont-ils verts sans avoir été régénérés ?** Oui, et
   le fichier n'a pas une ligne de changée.

---

## §9 — POINTS OUVERTS

⚠⚠ **1. LE BADGE PASSAGER — FAUT-IL UN MODE « DÉBARQUER » ?** C'est le point le
plus fragile du lot, et il n'a **pas été vu à l'écran** (§10). Le badge fait
**24 px CSS de côté** avec `touch-action: none` — le plancher de toucher du
dépôt — dans une case de vague qui en fait une trentaine sur un téléphone. Si à
l'usage le doigt prend le porteur au lieu de la passagère, **la correction n'est
pas de l'agrandir** — il mangerait la vignette — mais d'ajouter un mode
« Débarquer » à `MODES_RAID`, comme « Réparer ». Ce lot ne le fait pas.
**Ethan tranche.**

⚠⚠ **2. `problemeDuBatimentDeProduction` N'EST PAS RAPPELÉ EN PRÉPARATION.**
Décision réversible d'une ligne, prise telle que le brief la formule : on ne
compose rien dans la formation, on RANGE ce qui est déjà composé, et refuser de
réarranger sa formation parce qu'une Caserne est tombée serait un piège au moment
où le joueur en a le plus besoin. **Conséquence assumée : la formation de raid et
l'écran Offense ne refusent pas la même chose.** Il suffit d'appeler ce voisin
dans `problemesDuDeplacementEnFormation` et `problemesDeLaPermutationEnFormation`
pour la renverser.

⚠⚠ **3. LE `actif` RÉSIDUEL DES ANCIENNES SAUVEGARDES.** `piece.actif` reste dans
`etat.armee`, et une sauvegarde d'avant ce lot peut le porter à `false`. Plus
personne ne l'écrit depuis l'écran de raid ; **seul le chemin `formation === null`
le lit encore** — c'est-à-dire les tests et tout appelant qui n'a pas de
formation. Le purger demanderait une migration, donc `SAVE_VERSION`, donc un lot.

⚠ **4. DEUX REFUS D'EMBARQUEMENT SUR QUATRE NE SONT PAS ATTEIGNABLES AU DOIGT.**
Le glissement route sur la LIGNE qui porte le module, donc `moduleNonAcquis` et
`dejaCharge` s'affichent bien ; `sansModule` ne s'atteint qu'en déposant une
passagère prise sur son badge sur une pièce qui ne transporte pas, et
`pasUneInfanterie` ne s'atteint pas du tout — un blindé déposé sur un porteur
part en PERMUTATION, qui est le geste voulu (§4.3 du brief : « permuter deux
pièces dont l'une est chargée : autorisé »). Les quatre restent gardés par
`FG T7` au niveau du moteur.

⚠ **5. UN PASSAGER QUI NE PEUT PAS DÉBARQUER NE PROLONGE PAS LE RAID.** Mesuré en
écrivant `FG T14` : une passagère qui attend n'est pas un attaquant actif —
c'est ce que `estActive` fait —, donc `conditionsDeFin` conclut « attaquants »
au tick où le porteur meurt, même si elle est vivante et enfermée. Elle compte
alors parmi les survivants, ni sortie ni détruite. **C'est cohérent avec le
reste du lot, ce n'est pas arbitré.**

⚠ **6. `package.json` NE DÉCLARE TOUJOURS AUCUN `engines`**, alors que
`npm test` exige Node ≥ 21 pour son glob et que le `node` du PATH de cette
machine est en 20.11.1. Signalé pour la quatrième fois.

⚠ **7. `package-lock.json` PORTE `"name": "chantier"` ET `"version": "0.1.0"`**,
que `npm install` réécrit à chaque exécution. Restauré ici, hors périmètre.

---

## §10 — CE QUI N'A PAS ÉTÉ VU

⚠⚠ **LE RENDU N'A ÉTÉ VU NI SUR APPAREIL NI DANS UN NAVIGATEUR, ET SE DÉCLARE
NON EXÉCUTÉ.** CLAUDE.md §3 : le dépôt n'a ni jsdom ni navigateur de test. Ce
qui est mesuré ici l'est par les fonctions PURES de l'écran — `vaguesDeLArmee`,
`vueDuRaid`, `MODES_RAID` — et par des balayages de source. **Le badge passager,
sa taille au doigt, le liseré ambre d'un véhicule chargé et le glisser-déposer
qui l'emporte n'ont été vus par personne.**

---

## §11 — LA PR

Branche `claude/lot-formation-et-garnison`, partant de `main` (`e97fb72`).
**PR ouverte, NON fusionnée** — la fusion sur `main` appartient à Ethan seul.
