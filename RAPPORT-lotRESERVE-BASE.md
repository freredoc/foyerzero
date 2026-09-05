# RAPPORT — lot RÉSERVE-BASE

**05/09/2026.** La quatrième réserve de temps de réparation, celle des bâtiments,
et le barème qui la dépense. Aucun module de `src/ui/` n'est touché.

---

## 0. La phrase qui doit venir en premier

⚠⚠ **LE CLIQUET N'EST PAS REFERMÉ POUR LE JOUEUR.** Le moteur sait réparer un
bâtiment ; **aucun écran ne l'appelle**. Un raid subi laisse toujours la base à
1 PV du point de vue du joueur, qui n'a aucun bouton pour payer. Écrire
« cliquet corrigé » serait faux : il est cassé **côté moteur**, et l'écran est le
lot suivant.

---

## 1. Version, build, sauvegarde

| | avant | après |
|---|---|---|
| `version` | 0.97.0 | **0.98.0** |
| `config.build` | 99 | **100** |
| `SAVE_VERSION` | 24 | **25** |

⚠ **LE BUMP DE `SAVE_VERSION` EST OBLIGATOIRE ICI, ET IL FAUT DIRE POURQUOI.** Le
lot BARÈME ne l'avait pas touché parce qu'il ne changeait que des PRIX, qui se
recalculent. Ici la **forme** de l'état change : une base sauvegardée n'a pas le
champ, et `crediterLesReserves` ferait un `NaN` dès le premier tick.

⚠ **UNE DÉRIVE DE VERSION EST CORRIGÉE AU PASSAGE, ET ELLE ÉTAIT BÉNIGNE.** L'en-tête
de `CLAUDE.md` annonçait « version 0.96.0 · build 98 » quand `package.json` portait
0.97.0 / 99 : le lot BARÈME avait bumpé sans mettre l'en-tête à jour. Signalé,
corrigé, aucune conséquence.

---

## 2. `npm run check` — avant et après

| | avant (baseline) | après |
|---|---|---|
| `npm test` | **1105 pass / 0 fail** | **1117 pass / 0 fail** |
| `dist/index.html` | 8 996 025 o | **8 996 966 o** |
| référence externe | 0 | 0 |
| balises `data:` | 296 | **296** |

**Coût : +941 octets, ENTIÈREMENT DU JAVASCRIPT.** Aucune image, aucun son,
aucune feuille, aucun balisage — les 296 `data:` sont identiques des deux côtés.
Trois de ces octets sont la chaîne de version elle-même (`0.98.0 build 100` est
plus long que `0.97.0 build 99`) ; les 938 autres sont le module.

**Borne T10 inchangée à 9 300 000** — marge **303 034 octets, 3,26 %** (contre
303 975 et 3,27 % avant). Aucune ressource n'entre : il n'y avait pas lieu de la
relever.

⚠ **LA BASE DE DÉPART A ÉTÉ MESURÉE, ET LES SIX FAITS DU §0 DU BRIEF ÉTAIENT
INTACTS** : `REPARATION_BASE_JOUEUR.courbe` porte bien `penteNiveau`,
`diviseurBatiment` et `diviseurDuCout` et **aucun module de `src/sim/` ne la
lisait** ; `reparationSec` vaut 88 · 65 · 42 ; `niveauDesBatiments` est exportée
en dixièmes ; `reservesVides`, `plafondDeLaReserveDeLaBase` et
`crediterLesReserves` existent ; `base.reserveReparation` est un objet à trois
clés de châssis en ticks ; `raid-ouvrage.js` écrit `degatsMilli` sur les
bâtiments comme sur les pièces. Aucun point d'arrêt.

---

## 3. Ce qui a été écrit

### `src/data/base.js`

`REPARATION_BASE_JOUEUR` gagne `plafondHeures: 12` et
`plafondHeuresParNiveauBatiments: 1`, avec le commentaire qui dit que **ce ne
sont pas des mesures** — `MODELE-REPARATION-1.md` §6 point 8 est ouvert, l'écran
de TA n'affiche qu'un stock (`3j 22:01:08`) sans son dénominateur — et qui porte
le calibrage remesuré (§5 ci-dessous).

⚠ Ils vivent là et **pas dans `REPARATION` de `data/sites.js`**, qui porte déjà
`plafondHeures` et `plafondHeuresParNiveauArmee` pour l'ARMÉE.

### `src/sim/reparation.js`

L'en-tête est réécrit : le module ne répare plus « l'armée » mais « le joueur ».
Entrent `plafondDeLaReserveDesBatiments`, `secondesPleinesDUnBatiment`,
`coutDeLaReparationDUnBatiment`, `devisDeLaReparationDesBatiments`,
`problemesDeLaReparationDUnBatiment`, `reparerUnBatiment`,
`problemesDeToutReparerLesBatiments`, `toutReparerLesBatiments` et
`problemesDeLaReserveDesBatiments`. `crediterLesReserves` crédite le quatrième
réservoir **dans la même boucle, avec son propre plafond**.

⚠ `scorieDisponible` devient `ressourceDisponible(etat, cle)` : l'armée se paie
en scorie, les bâtiments en quartz, et deux conversions milli → unité voisines
auraient divergé au premier changement d'échelle.

### `src/sim/state.js`

`reserveReparationBatiments: 0` à la création, `CHAMPS_DE_BASE` passe de onze à
douze, `HORS_EXIGENCE` de deux à trois, `verifierEtat` gagne son contrôle, et la
migration 24 → 25 pose le champ **à zéro** sur **toutes** les bases.

### `src/sim/raid-ouvrage.js`

**Un commentaire, zéro ligne de code.** Voir §7.

---

## 4. Les douze tests

Tous dans `test/reparation.test.js` — **aucun fichier de test n'entre**, donc
`CLAUDE.md` §2 ne bouge pas de ce côté. Le compte passe de 1 105 à **1 117**.

| # | Test | Montage effectif | Verdict |
|---|---|---|---|
| 1 | plafond = 12 h + 1 h par niveau de bâtiments, en dixièmes | Chantier 20 + Caserne 21 → moyenne **205 dixièmes** ; plafond attendu 32,5 h = **1 170 000 ticks**, et ≠ `217 h`. Plus : lève sur une disposition vide. | **PASS** |
| 2 | les deux réservoirs sont disjoints | Vider celui des bâtiments ne touche pas les trois ; l'inverse non plus ; et `Object.keys(reserveReparation)` vaut exactement les trois châssis. | **PASS** |
| 3 | `reservoirsDeLArmee` rend TROIS entrées | `CHASSIS_REPARABLES.length === 3`, `reservesVides()` à trois clés, et ni `batiments` ni `base` dedans. | **PASS** |
| 4 | équivalence des deux chemins | `tickJeu` × 1 000 contre `rattraperJeu(1000)` : réserve **identique au tick près**, et **sérialisation entière identique**. L'intitulé NOMME sa condition de rupture. | **PASS** |
| 5 | le plafond mord | Un million de ticks sur une base à Chantier 12 ; la réserve s'arrête au plafond, et n'avance plus d'un tick au million suivant. | **PASS** |
| 6 | le temps suit la courbe | Caserne 40 : **813,9 s** au Chantier 40, **7 852,6 s** au Chantier 20 ; **c'est le rapport 9,646** qui est asserté, plus le fait que 1,1767 n'est aucune des quatre pentes connues. | **PASS** |
| 7 | coût = prix du niveau ÷ 230, et zéro dans le bas d'échelle | Caserne 20 pleine → `coutDeMontee/230` ; puis la frontière : gratuit au niveau 5 pour les trois classes testées, gratuit au 6 pour `accumulateur` seul. | **PASS** |
| 8 | prorata des PV perdus | Le même bâtiment à 100 % et à 50 % : quartz et secondes exactement moitié, ticks à un près. Et un bâtiment intact rend `null`, pas zéro. | **PASS** |
| 9 | le cliquet est cassé au moteur | **Un vrai `subirUnRaid`** de niveau 20 sur une base à quatre bâtiments : `rase: false`, quatre abîmés dont **trois au plancher de 1 PV** ; `reparerUnBatiment` puis `toutReparerLesBatiments` les rendent tous entiers. | **PASS** |
| 10 | tout ou rien | Réserve à `ticks − 1` → refus, et ni quartz, ni PV, ni réserve n'ont bougé ; quartz à zéro → même refus, même immobilité ; payable → les trois bougent, **et la scorie ne bouge pas**. | **PASS** |
| 11 | la migration pose 0 partout | Une v24 à **deux** bases, champ absent → deux zéros, aucune exception ; une v25 rabaissée garde sa réserve ; une v22 aplatie traverse la chaîne complète ; et une réserve négative fait lever au chargement. Porte aussi `SAVE_VERSION === 25`. | **PASS** |
| 12 | le Chantier décote par son NIVEAU | Chantier à 1 PV → temps, ticks et quartz **identiques** à un Chantier intact ; Chantier au niveau 10 → temps plus que doublé, quartz inchangé. | **PASS** |

---

## 5. Le calibrage, remesuré

Base **pleine** — quarante bâtiments, le plafond d'`emplacementsDuNiveau` —, tous
ramenés à **1 PV**, ce qui est le pire cas.

| Chantier | bâtiments | plafond | tout réparer | tient ? |
|---|---|---|---|---|
| 10 | 10 | 22,0 h | **0,85 h** | oui |
| 30 | 30 | 42,0 h | **4,73 h** | oui |
| 50 | 50 | 62,0 h | **12,69 h** | oui |
| 30 | 50 | 61,5 h | **118,98 h** | **non** |
| 20 | 50 | 61,3 h | **369,19 h** | **non** |
| 10 | 50 | 61,0 h | **1 085,86 h** | **non** |

⚠⚠ **LE §3 DU BRIEF ANNONÇAIT 10 H POUR 62 ; MESURÉ, C'EST 12,69 H.** La
conclusion tient et se renforce : la réserve **ne mord pas** quand le Chantier
suit, et le levier est **beaucoup plus raide** que le brief ne le laissait croire
— vingt niveaux de retard font déjà déborder le plafond d'un facteur deux, et
quarante d'un facteur dix-huit.

⚠ **ET LE PLAFOND, LUI, NE BOUGE PRESQUE PAS D'UNE LIGNE À L'AUTRE** — 62,0 · 61,5 ·
61,3 · 61,0. Il est indexé sur la **moyenne** des bâtiments, que le Chantier seul
ne déplace guère quand il y en a quarante. C'est donc bien le **coût**, et non le
plafond, qui porte le levier.

---

## 6. Les falsifications

⚠⚠ **LES DOUZE TESTS NE « TOMBENT PAS SUR LE CODE D'AVANT » AU SENS OÙ ON
L'ENTEND D'HABITUDE, ET IL FAUT LE DIRE.** Le fichier entier refuse de se charger
sur `HEAD` — vérifié dans un `git worktree` :

```
SyntaxError: The requested module '../src/sim/reparation.js'
  does not provide an export named 'coutDeLaReparationDUnBatiment'
```

**Ce n'est pas la propriété qu'ils mesurent.** Ce qui la mesure, ce sont
**quatorze falsifications ciblées sur l'arbre FINAL**, une par test, chacune
défaite avant la suivante :

| # | Falsification | Ce qui tombe | Message |
|---|---|---|---|
| F1 | les dixièmes lus comme des niveaux entiers | `T1`, `T5` | `1 170 000 !== 7 812 000` |
| F2 | la réserve fuit en 4ᵉ clé de `reserveReparation` | **`RÉSERVE T4`**, `T2` | `2 !== 1` |
| F3 | `CHASSIS_REPARABLES` gagne `batiments` | `T3` + huit gardes d'armée | `réparation : châssis « batiments » inconnu` |
| F4 | un arrondi entre dans le crédit | `RÉSERVE T3`, `T4` | les deux chemins divergent de 1 tick |
| F5 | le plafond ne borne plus rien | `T5` | la réserve dépasse le plafond |
| F6 | 1,1767 « harmonisée » sur 1,15 | `T6` | `332,58 s au Chantier 40` |
| F7 | arrondi au SUPÉRIEUR au lieu du plus proche | `T7` | `false !== true` |
| F7 bis | diviseur du coût 230 → 153,6 | `T7` | `153.6 !== 230` |
| F7 ter | le devis annonce autre chose que ce qui est facturé | `T7` | `1 !== 0` |
| F8 | le coût cesse d'être au prorata | `T8` | `5 770,7 contre 2 885,3` |
| F9 | réparer débite et ne rend pas les PV | `T9`, `T10` | `15 289 000 !== 0` |
| F10 | le quartz débité AVANT le refus | `T10` | le quartz a bougé |
| F11 | la migration écrase une réserve accumulée | `T11` | `0 !== 72 000` |
| F12 | le Chantier décote au prorata de ses PV | `T12` | le Chantier décote par ses PV |

⚠⚠ **ET `F7` N'A PAS MORDU AU PREMIER RELEVÉ — TREIZIÈME FOIS DU DÉPÔT.** La
première écriture de `T7` calculait `Math.round(cout.quartz)` **dans le test** :
remplacer l'arrondi du module par un `Math.ceil` laissait la suite **entièrement
verte**, parce que le test refaisait le calcul au lieu de le lire. **Un test qui
interroge le témoin ne garde que le témoin** — exactement la leçon de `T3` et
`T6` du lot BARÈME, un lot plus tôt. Il lit désormais les DEUX sorties du module,
ce que le devis **annonce** et ce que la réparation **facture**, et il exige
qu'elles coïncident ; `F7 ter` mesure cette seconde moitié.

⚠ **`F2` EST LA PLUS INSTRUCTIVE DES TREIZE AUTRES** : elle fait tomber
`RÉSERVE T4`, une garde d'ARMÉE écrite au lot RÉSERVE, en même temps que la garde
neuve. C'est la mesure qui prouve que la fuite annoncée par le §4.1 du brief était
réelle — l'écran d'armée aurait bien affiché un quatrième réservoir.

---

## 7. Les écarts par rapport au brief, et pourquoi

**7.1 — `diviseurDuBatiment` gagne un second argument.** Le brief demandait de
passer par la fonction existante « telle quelle », donc de lire les pentes de
`REPARATION` — celles de l'ARMÉE. Refusé, et voici pourquoi : celles de l'armée
sont **mesurées** (Exosoldats à Caserne 10 puis 12, rapport 1,1874 = 1,09² à un
millième) ; celles des bâtiments, dans
`REPARATION_BASE_JOUEUR.courbe.diviseurBatiment`, sont **reprises par analogie et
sans preuve**, et le commentaire de `data/base.js` le dit en toutes lettres.
Lire la table de l'armée pour les bâtiments ferait de ce commentaire un mensonge
et rendrait **invisible** le jour où une capture mesurera le vrai diviseur. La
**formule** reste écrite une seule fois — c'est ce que le brief protégeait
vraiment. Les deux tables portent aujourd'hui les mêmes trois nombres.

**7.2 — l'arrondi du coût est au plus proche, pas une troncature.** Le brief
écrit : « `coutDeMontee` y rend moins de 230 unités de quartz, donc la division
rend 0 ». Mesuré sur les onze bâtiments, cette lecture ne reproduit **pas** la
frontière du relevé. `MODELE-REPARATION-1.md` §3 dit « jusqu'au niveau 5, **6
pour la classe la plus légère** : le prix d'un palier y pèse moins d'une
**demi**-unité ». Au niveau 6 : `mineur` = **0,478**, `modeste` = 0,896,
`courant` = 1,287, `majeur` = 1,913. Seul l'arrondi au plus proche rend **une**
classe gratuite au niveau 6 ; une troncature en rendrait **deux** (`modeste`
aussi), et un `Math.ceil` — celui du coût en scorie de l'armée — **aucune**
au-dessus du niveau 1. **La frontière du relevé départage les trois lectures, et
c'est la seule mesure qui les départage.**

**7.3 — le devis somme des arrondis au lieu d'arrondir la somme.** Non demandé
par le brief. `toutReparerLesBatiments` appelle `reparerUnBatiment` bâtiment par
bâtiment, donc débite un arrondi **par bâtiment** : un devis qui arrondirait la
somme des parts exactes annoncerait un prix que l'opération ne pratique pas, et le
joueur pourrait passer la garde de quartz puis manquer d'une unité au dernier
bâtiment. À onze bâtiments l'écart peut atteindre cinq unités. `T7` l'exige des
deux côtés.

**7.4 — deux nombres du brief étaient faux, et les deux sont déclarés.** Son `T5`
annonçait « 100 000 ticks sur une base neuve » pour saturer : mesuré, une base
neuve porte un Chantier de niveau 1, donc un plafond de 12,1 h = **435 600
ticks** — à 100 000 le plafond ne mord pas, et le test aurait été vert sur
n'importe quel code. Son `T9` demandait un raid qui abîme : balayé de 1 à 40, un
attaquant de niveau 40 **RASE** la base (donc plus rien à réparer, et le test ne
mesurerait plus le cliquet), et sous le niveau 5 rien n'atteint le plancher. Le
niveau 20 abîme quatre bâtiments dont trois au plancher. Les deux montages
portent leur mesure en commentaire.

**7.5 — un raid subi ne vide PAS la quatrième réserve.** Non demandé, et
délibérément non fait. `raid-ouvrage.js` vide les trois réservoirs d'armée depuis
le lot RÉSERVE ; y ajouter celui des bâtiments rendrait le cliquet **incassable**
— le raid qui abîme les bâtiments emporterait du même geste le temps qu'il faut
pour les relever, et le joueur repartirait de zéro à chaque passe. La phrase de
`MODELE-ECONOMIQUE.md` §7 est du 24/08 et ne connaît qu'UN réservoir. **Un
commentaire a été ajouté à l'endroit exact** pour que l'omission soit une
décision lisible et non un oubli ; c'est une clé de boucle qui change si Ethan
tranche autrement.

**7.6 — une garde a changé de cible, et elle mesurait un proxy.**
`chantier.test.js` portait « Réparer n'a pas de moteur, et ce n'est pas un
oubli », qui se disait **« fait pour tomber le jour où le moteur en gagne une »**.
Ce jour est venu, **et elle est restée verte** : elle regardait les exports de
`sim/state.js` quand la fonction est née dans `sim/reparation.js`. Troisième proxy
du dépôt, après `ZOOM_BASE_MULTIPLE_MAX` et `ZOOM_CARTE.grilleEmbleme`. Elle exige
désormais que le moteur **porte** `reparerUnBatiment` et que l'écran ne l'appelle
**pas** : elle tombera au branchement, et il faudra alors la **retirer**.

⚠ **ET ELLE A RÉVÉLÉ UN DÉFAUT D'ÉCRAN, ANTÉRIEUR À CE LOT.** La phrase de refus
du bouton dit « aucun bâtiment n'est endommagé » ; `raid-ouvrage.js` écrit
`degatsMilli` sur les bâtiments depuis le lot RAID-B (02/09), donc **elle peut
mentir depuis trois jours**. C'est un fait d'écran, hors de ce lot, nommé dans le
test pour qu'on ne le redécouvre pas.

**7.7 — la garde du numéro de version a déménagé.** Règle du dépôt : « la garde du
numéro appartient au maillon le plus RÉCENT de la chaîne, une seule fois ». Le
`SAVE_VERSION === 24` de `BASES-1 T14` part, et `RÉSERVE-BASE T11` porte le
`=== 25`. `BASES-1 T14` garde ce qu'il mesure vraiment — que SON maillon est
encore là — et le dit.

---

## 8. La sauvegarde grandit de 36 octets, exactement

Mesuré sur les **vingt-cinq graines** du témoin de BASES-0, en phase 5 :
`,"reserveReparationBatiments":` fait trente caractères, et sa valeur six
chiffres. `OCTETS_AJOUTES_PAR_RESERVE_BASE = 36` entre dans
`test/temoins-bases-0.js` et **s'ajoute** aux trois termes précédents au lieu de
les remplacer — chacun dit ce que son lot a coûté, et la somme reste lisible ligne
par ligne.

⚠ **LE NOMBRE EST FIXE, ET C'EST CE QU'ON LUI DEMANDE.** Un écart qui dépendrait
de la partie voudrait dire que la réserve diverge d'une graine à l'autre ; son
plafond ne dépend que du niveau des BÂTIMENTS, et le scénario du témoin pose
exactement les mêmes quatre bâtiments aux mêmes niveaux sur les vingt-cinq.

⚠ **AUCUN AUTRE SCALAIRE DU TÉMOIN NE BOUGE** — gestes, gestes d'armement, cases
atteignables, déplacement, bases attaquantes, nombre de cibles, cible retenue,
empreintes de rapport : **25 graines sur 25, identiques**. C'est la mesure qui dit
que le lot ne touche à aucune règle de jeu existante.

---

## 9. Ce qui reste ouvert, nommé

- **L'écran de réparation des bâtiments.** C'est lui qui refermera le cliquet
  pour le joueur, et c'est le lot suivant.
- **La phrase de refus du bouton Réparer**, qui peut mentir depuis le lot RAID-B.
- **La défense.** `complexeDeDefense` reste absent de tout `src/sim/` — la formule
  de dépassement (`MODELE-REPARATION-1.md` §6 point 6) est toujours ouverte.
- **Le calibrage du plafond** — 12 h + 1 h par niveau. Deux nombres posés pour
  être joués et changés ; le §5 dit ce qu'ils donnent.
- **Un raid subi vide-t-il la quatrième réserve ?** Voir §7.5.
- **L'anomalie du Collecteur** — 1/153,6 contre 1/230 —, abandonnée sur arbitrage
  du 05/09.

---

## 10. Vérificateur d'art

⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
ne touche ni `art/`, ni un outil de la chaîne graphique. Pas un octet
d'`art/sprites/` ne change.
