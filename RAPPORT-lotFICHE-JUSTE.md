# RAPPORT — lot FICHE-JUSTE

Retours d'Ethan du 06/09 : « **Un collecteur posé sur un Champ de scories bloque
la production d'élec : anormal** », et « **Le complexe n'indique pas le coût de
réparation. Ou juste dire 1h pour un niveau similaire** », puis, à la question
directe : « **Complexe seulement du temps.** »

---

## 0. Ce qui a été produit

| | valeur |
|---|---|
| version · build | **0.99.11 · build 112** (les deux restent des chaînes JSON) |
| `npm test` avant | **1 231 pass / 0 fail** |
| `npm test` après | **1 241 pass / 0 fail** |
| `dist/index.html` avant | **8 003 118 octets** |
| `dist/index.html` après | **8 003 079 octets** |
| delta | **−39 octets** |
| borne T10 | inchangée à 9 300 000 — marge **1 296 921 octets, 13,95 %** |

**Le lot REND 39 octets, ENTIÈREMENT DU JAVASCRIPT**, mesurés poste par poste
contre un livrable rebâti dans un `git worktree` depuis le commit précédent
(`e87a2f0`, lot CARTE-C) :

```
js         356 910 → 356 871   −39
feuille  3 187 921 → 3 187 921   +0
images   6 306 190 → 6 306 190   +0
audio    1 193 346 → 1 193 346   +0
balisage         inchangé        +0
somme des cinq postes : −39   ← tombe EXACTEMENT sur le total
lignes `data:` : 296 avant, 296 après   ·   URI : 291 de part et d'autre
```

Les 39 octets se décomposent : la ligne `import { NIVEAU } from
'../data/niveaux.js';` sort de `src/ui/chantier.js` — elle n'avait plus de
lecteur de code une fois le niveau 50 retiré — et le libellé de la ligne du
Complexe raccourcit, `esbuild` conservant le reste à l'identique.

**Fichiers touchés :** `src/sim/disposition.js`, `src/ui/chantier.js`,
`test/disposition.test.js`, `test/chantier.test.js`, `test/reparation.test.js`,
`package.json`, `CLAUDE.md`, plus ce rapport.

---

## 1. Le voisinage — la mesure du brief, rejouée des deux côtés

Montage : centrale de niveau 1 en (14, 4), **un** champ de scorie en (13, 3),
Chantier loin en (18, 5) — les deux dispositions sont légales, ce que le test
asserte avant de mesurer.

**AVANT** (arbre `e87a2f0`) :

```
sans collecteur          | problèmes [] | total 180 | comptes {champDeScorie:1} | parCase ["13,3:champDeScorie"]
collecteur SUR le champ  | problèmes [] | total 180 | comptes {champDeScorie:1} | parCase []
```

**APRÈS** :

```
sans collecteur          | problèmes [] | total 180 | comptes {champDeScorie:1} | parCase ["13,3:champDeScorie"]
collecteur SUR le champ  | problèmes [] | total 180 | comptes {champDeScorie:1} | parCase ["13,3:champDeScorie"]
```

⚠⚠ **LA PRODUCTION N'ÉTAIT PAS BLOQUÉE, ET ELLE NE BOUGE PAS D'UN MILLI —
`total 180` SUR LES QUATRE LIGNES.** Ce qu'Ethan a vu disparaître est la
**flèche** de la fiche, et il l'a lue, très raisonnablement, comme une perte de
production. Le lot corrige un DESSIN ; `F-J T3` est le test qui attrape un lot
qui aurait « corrigé » le moteur à la place.

⚠⚠ **ET `voisinsQualifiants` ET `voisinsQualifiantsParCase` NE S'ACCORDAIENT PAS,
SUR LA MÊME QUESTION.** La première ne regarde pas l'occupation pour une clé
`champDe…` — elle boucle sur `ressourceDeLaCase` seule ; la seconde avait sa
branche champ en `else if (i === undefined)`. Le dessin est aligné sur le moteur,
jamais l'inverse : c'est l'arbitrage d'Ethan, qui appelle le blocage « anormal ».

### La double qualification — issue retenue : DEUX ENTRÉES

Une fois alignée, une case peut qualifier deux fois — comme champ **et** comme
bâtiment. Les trois issues du brief ont été pesées ; c'est la **première** qui
est retenue : la case rend **deux entrées**, et `flechesDeVoisinage` dessine deux
flèches depuis la même case.

**Motif :** c'est exactement ce que le moteur fait — deux boucles, deux lignes de
`comptes` — et `apportParHeure` est **par type**. Une entrée qui porterait
plusieurs types devrait porter plusieurs apports, c'est-à-dire changer de forme
pour dire exactement ce que deux entrées disent déjà. La troisième issue — « le
champ l'emporte » — est celle qu'on vient de retirer, dans l'autre sens.

⚠⚠ **LE CAS EST INATTEIGNABLE AUJOURD'HUI, MESURÉ ET NON SUPPOSÉ.** Il faudrait
qu'une table `parVoisin` porte à la fois une clé `champDe…` et une clé de
bâtiment **posable sur un champ**. Les quatre tables existantes sont :

```
centrale     { champDeScorie, accumulateur }
accumulateur { centrale }
collecteur   { raffinerie }
raffinerie   { collecteur }
```

et `CHAMPS.posableDessus` ne contient que `collecteur`, qu'aucune table
n'apparie à un champ. `F-J T5` monte donc un `parVoisin` **à la main** — pas de
test sauté —, asserte d'abord que le cas est bien inatteignable en jeu, puis le
retire de `DEBITS` dans un `finally`.

### Les deux commentaires réécrits, cités

**`src/sim/disposition.js`**, au point de décision — l'ancien disait « une case
occupée par un bâtiment ne peut pas porter de champ qualifiant en plus : c'est le
bâtiment qui compte, ou rien » :

> ⚠⚠ UNE CASE PEUT QUALIFIER DEUX FOIS, ET C'EST CE QUE LE MOTEUR FAIT — lot
> FICHE-JUSTE, 06/09/2026. […] **`voisinsQualifiants` ne regarde PAS
> l'occupation** pour une clé `champDe…` : elle boucle sur `ressourceDeLaCase`
> seule. Les deux fonctions répondaient donc à la même question et rendaient deux
> réponses.
>
> ⚠⚠ ET CE N'ÉTAIT PAS THÉORIQUE. Ethan, 06/09 : « un collecteur posé sur un
> champ de scories bloque la production d'élec : anormal ». **Mesuré : la
> production ne bougeait pas d'un milli** […]. Ce qu'il voyait disparaître était
> la FLÈCHE de la fiche […]. On aligne donc le DESSIN sur le moteur, jamais
> l'inverse.

et son en-tête, qui portait la même affirmation :

> ⚠⚠ « LA MÊME RÈGLE » SE MESURE DEPUIS LE 06/09, ELLE NE S'AFFIRME PLUS. Cette
> phrase était écrite ici et dans `ui/chantier.js` **et elle était fausse** […].
> `F-J T2` compare désormais le compte PAR TYPE de cette fonction-ci à celui de
> `voisinsQualifiants`, sur une famille de montages […]. Une divergence ne peut
> plus revenir en silence.

**`src/ui/chantier.js`**, au-dessus de `flechesDeVoisinage` :

> ⚠⚠ ET CE COMMENTAIRE AFFIRMAIT UNE PROPRIÉTÉ FAUSSE JUSQU'AU 06/09/2026. Il
> disait : « `voisinsQualifiantsParCase` est la même règle que celle qui calcule
> le débit. » **Elle ne l'était pas** […]. C'est très exactement la faute que le
> dépôt se nomme à lui-même : justifier une propriété par un mécanisme qu'on n'a
> pas ouvert. Le lot FICHE-JUSTE aligne le DESSIN sur le moteur, et la phrase est
> redevenue vraie.
>
> ⚠⚠ ELLE N'EST PLUS SEULEMENT AFFIRMÉE : ELLE EST MESURÉE. `F-J T2` compare le
> COMPTE PAR TYPE des deux fonctions sur une famille de montages […] et il tombe
> si elles divergent à nouveau. Sans lui, cette ligne redeviendrait un pari.

---

## 2. Le Complexe — une durée lisible, et pas de coût

### La durée s'annonce pour une pièce de MÊME niveau, et le chiffre est CALCULÉ

`ticksDeRetour(niveau, niveau, santé)` remplace
`ticksDeRetour(NIVEAU.plafond, niveau, santé)`. Mesuré, Complexe **entier** :

| niveau du Complexe | **après** (pièce de son niveau) | avant (pièce de niveau 50) |
|---|---|---|
| 1 | **1,0000 h** | 106,7190 h |
| 3 | **1,0000 h** | 88,1970 h |
| 5 | **1,0000 h** | 72,8900 h |
| 10 | **1,0000 h** | 45,2590 h |
| 25 | **1,0000 h** | 10,8350 h |
| 50 | **1,0000 h** | 1,0000 h |

⚠⚠ **LE CHIFFRE TOMBE SUR 1 h, ET IL N'EST PAS ÉCRIT.** `ticksDeRetour` fait
`heuresDeBase × facteurMilli(1 + dépassement)/1000 × pénalité(santé)` ; à
dépassement nul et pleine santé, les deux derniers facteurs valent un.
**36 000 ticks, soit une heure ronde, aux cinq niveaux balayés par `F-J T7`.**
Le second repère du §0 de `CLAUDE.md` tient aussi : `ticksDeRetour(7, 7, 0)` rend
**24,0000 h TOUT ROND**, ce que le même test asserte.

⚠⚠ **ET LE NIVEAU 50 EST LE SEUL POINT OÙ LES DEUX RÈGLES COÏNCIDENT** — c'est
pourquoi `F-J T6` monte un Complexe de niveau **10** : à 50, un lot qui n'aurait
rien changé passerait.

⚠⚠ **`F-J T6` MONTE EN PLUS UN COMPLEXE ABÎMÉ, ET C'EST CE QUI ATTRAPE LA PIRE
FAÇON DE SE TROMPER.** Intact, la valeur vaut exactement 36 000 : **une fiche qui
écrirait 36 000 en dur, sans jamais appeler la formule, passerait l'égalité comme
l'inégalité.** Sous avarie (`degatsMilli = 800 000`), les trois nombres divergent :

```
Complexe niv 10 · santé 864 ‰ → même niveau 4,128 h | niveau 50 186,829 h
```

La falsification **F5** le confirme : `return 36000;` fait tomber `F-J T6`.

### Ce que le nouveau choix coûte — dit, pas tu

Le commentaire du bloc défendait le niveau 50, et **le raisonnement était juste**.
Il est écarté par arbitrage, et le bloc le dit :

> ⚠⚠ LA PIÈCE DE RÉFÉRENCE EST DE MÊME NIVEAU QUE LE COMPLEXE, ET C'EST UN
> ARBITRAGE D'ETHAN DU 06/09 QUI RENVERSE LE MOTIF ÉCRIT ICI. […] **Le
> raisonnement était juste et il est écarté** […]. Le pire cas annonçait 106,7 h à
> un joueur dont la garnison est au niveau 3 — un nombre qui ne le concerne pas.
>
> ⚠⚠ ET CE QUE LE NOUVEAU CHOIX COÛTE SE DIT : UN JOUEUR DONT LA GARNISON DÉPASSE
> LE NIVEAU DU COMPLEXE ATTENDRA PLUS LONGTEMPS QUE CETTE LIGNE NE L'ANNONCE.
> C'est la contrepartie exacte de l'ancien choix, prise dans l'autre sens : le
> dépassement est réel, la fiche cesse simplement de le supposer maximal. Une
> pièce de niveau 50 sous un Complexe 10 revient toujours en 45,3 h ; la ligne,
> elle, dit 1 h. **Le jour où la fiche devra dire les deux, c'est une SECONDE
> ligne qu'il faudra, pas ce niveau-ci qu'il faudra remonter.**

⚠ **ET LA BORNE DE `ticksDeRetour` TIENT MIEUX QU'AVANT, PAS MOINS BIEN.** Elle
lève quand `1 + dépassement` sort de `NIVEAU` ; le dépassement vaut désormais
**zéro par construction**. Le départage entre `NIVEAU.plafond` et
`GEOGRAPHIE.niveauPlafond` que le bloc portait devient sans objet, et le
paragraphe qui le défendait est retiré avec l'import qu'il justifiait.

⚠ **`direLaDuree` ET SON POINT DÉCIMAL N'ONT PAS ÉTÉ TOUCHÉS**, comme le brief
l'exige : la fonction est partagée avec la réserve de réparation, et la corriger
ici ferait diverger les deux affichages.

⚠ **`RETOUR_DEFENSES`, `pvApresRetour` ET `sim/reparation.js` N'ONT PAS UNE LIGNE
DE CHANGÉE.** Le lot change ce que la fiche **annonce**, jamais ce que le moteur
**fait**. Vérifié au diff.

### `CH-F T8` a dû changer de montage, et AUCUNE assertion n'est assouplie

`CH-F T8` monte les six uniques à deux niveaux et exige que la valeur diffère. À
dépassement nul, **un Complexe intact rend 1 h à tous les niveaux** : sa prémisse
a cessé d'être vraie, et l'assertion serait tombée sur un code parfaitement juste.
Le montage abîme donc le Complexe des deux côtés du même `degatsMilli` — les
dégâts sont un absolu quand les PV maximaux croissent avec le niveau, donc la
**santé** discrimine encore :

```
niveau  1 · santé 680 ‰ → 8,360 h
niveau 12 · santé 888 ‰ → 3,576 h
```

⚠ **ET L'AVARIE SE JUSTIFIE DANS LE TEST LUI-MÊME** : une assertion ajoutée à la
fin de `CH-F T8` prouve qu'un Complexe **intact** rendrait le même nombre aux
deux niveaux. Sans elle, l'avarie serait une précaution non mesurée. La
falsification **F6** — l'avarie retirée — fait tomber `CH-F T8`, et lui seul.

---

## 3. ⚠⚠ ÉCART DÉCLARÉ — `REPARATION_BASE_JOUEUR` N'EST PAS TOUCHÉ

Le brief demande : « la formulation de `data/base.js` qui laisse croire à un prix
doit être **corrigée** ». **Elle ne l'a pas été, et c'est délibéré :
l'instruction repose sur une confusion entre deux mécanismes que le dépôt tient
séparés depuis le lot RETOUR-DÉFENSES.**

`REPARATION_BASE_JOUEUR` décrit la réparation d'un **BÂTIMENT** — son
`indexeeSur` nomme le Chantier de construction, sa `courbe.diviseurDuCout` est le
diviseur d'un **prix**, et ce prix est réellement débité. Relevé, quatre sites
dans `src/sim/reparation.js` :

```
816:    : (coutDeMontee(pose.id, pose.niveau).quartz
860:    quartz += Math.round(cout.quartz);
889:  const du = Math.round(cout.quartz);
921:  const quartz = Math.round(cout.quartz);
```

Le lot RÉPARER-ÉCRAN mesure d'ailleurs « Tout réparer solde les trois autres pour
**9 109 de quartz** ». Écrire que la réparation « ne coûte que du temps » dans ce
bloc-là en ferait un **mensonge**, et contredirait l'arbitrage d'Ethan du 05/09
qui a posé la quatrième réserve.

Ce dont Ethan parle — « Complexe seulement du temps » — est le **RETOUR de la
garnison**, qui vit dans `RETOUR_DEFENSES` et `pvApresRetour`. Et **ce bloc-là dit
déjà exactement ce qu'il fallait dire**, depuis le 06/09 :

> ⚠⚠ ET C'EST GRATUIT, DONC IL N'Y A NI RÉSERVE NI RESSOURCE. Rien ici ne
> ressemble à `REPARATION_BASE_JOUEUR` au-dessus : la défense ne se paie pas, ne
> consomme aucun réservoir de temps, et le joueur n'a aucun geste à faire. Ce
> sont deux mécanismes distincts, et les fondre serait la faute […].

⚠⚠ **CE QUI MANQUAIT N'ÉTAIT DONC PAS LA PHRASE, C'ÉTAIT SA MESURE** — et c'est
précisément la faute que ce lot répare pour le voisinage. `F-J T9` l'a écrite :
il balaie les corps de `pvApresRetour`, `ramenerLaGarnison` et `ticksDeRetour`,
refuse huit mots (`ressources`, `reserveReparation`,
`reserveReparationBatiments`, `quartz`, `scorie`, `electricite`, `coutDeMontee`,
`coutDeLaReparation`), **prouve que le motif n'est pas aveugle** en exigeant que
`reparerUnBatiment` nomme bien le quartz, puis **le mesure par exécution** : un
retour complet ne bouge ni les stocks, ni les quatre réserves.

**Ethan tranche s'il voulait dire autre chose : ce serait alors la réparation des
BÂTIMENTS qui cesserait de coûter, et c'est un changement de règle, pas de
formulation.**

---

## 4. Les tests — PASS/KO et montage effectivement écrit

**Dix tests entrent, et le compte passe de 1 231 à 1 241** — quatre dans
`test/disposition.test.js`, cinq dans `test/chantier.test.js`, un dans
`test/reparation.test.js`.

| Code | verdict | montage écrit |
|---|---|---|
| **F-J T1** | PASS | Centrale niv 1, champ de scorie en (13,3), collecteur dessus. Asserte que les DEUX dispositions sont légales et que `CHAMPS.posableDessus === ['collecteur']`, puis qu'une entrée `champDeScorie` sort dans les deux cas, à la bonne case et avec un apport non nul. |
| **F-J T2** | PASS | Six montages — champ libre, champ occupé, bâtiment sur case nue, les deux à la fois, aucun voisin, le terrain complet. Pour chaque bâtiment à `parVoisin` non vide : compte par type de `ParCase` comparé à `voisinsQualifiants`. **Deux planchers** — au moins 10 bâtiments comparés ET au moins 8 voisins qualifiants vus — sans quoi une fonction qui rendrait toujours la liste vide passerait. |
| **F-J T3** | PASS | `debitDuBatiment.total === 180` des deux côtés, `productionParRessource` identique, **et le montage discrimine** : sans le champ, la centrale ne rend pas 180. |
| **F-J T4** | PASS | `flechesDeVoisinage` rend une flèche depuis (13,3) avec et sans collecteur, au bon libellé, apport non nul, départ/arrivée en lignes d'écran. **Et le collecteur n'ajoute pas de flèche à lui** — `DEBITS.centrale.parVoisin.collecteur` est `undefined`. |
| **F-J T5** | PASS | Asserte d'abord qu'AUCUNE table n'apparie un `champDe…` à un bâtiment posable sur un champ, puis monte `DEBITS.fauxDoubleQualifiant` à la main dans un `try/finally` : deux entrées, deux types, même case, et le moteur compte `{champDeScorie: 1, collecteur: 1}`. |
| **F-J T6** | PASS | Complexe niveau **10**, **abîmé** de 800 000 milli. Asserte la santé strictement entre 0 et 1000, que la durée abîmée ne retombe PAS sur une heure ronde, que la fiche rend `ticksDeRetour(10,10,santé)` et **pas** `ticksDeRetour(50,10,santé)`. |
| **F-J T7** | PASS | Complexe entier aux niveaux 1, 5, 10, 25 et 50 : la fiche rend **36 000 ticks**, écrit dans le test et confronté à `TICKS_PAR_HEURE`. Plus `ticksDeRetour(7,7,0) === 24 h`. |
| **F-J T8** | PASS | Toutes les lignes d'effet du Complexe sont de forme `duree` ; le texte de la section ne nomme aucune des trois ressources. **Et le montage discrimine** : le bouton du même panneau, lui, en nomme une. |
| **F-J T9** | PASS | Balayage des corps de `pvApresRetour`, `ramenerLaGarnison`, `ticksDeRetour` (huit mots interdits) + témoin sur `reparerUnBatiment` + mesure par exécution : stocks et quatre réserves identiques après un retour complet. **Les tests de `pvApresRetour` et `ticksDeRetour` n'ont pas été modifiés** — vérifié au diff. |
| **F-J T10** | PASS | Complexe à zéro PV (dégâts au-delà du maximum, la santé nulle est assertée) : `effets[0].avant === null` et la ligne se DIT — « aucun retour » — au lieu de se taire. |

⚠ **`pvMaxDuBatimentMilli` N'A PAS ÉTÉ EXPORTÉE POUR L'OCCASION.** `F-J T10` pose
`Number.MAX_SAFE_INTEGER` de dégâts et laisse `complexeDeLaBase` borner à zéro :
exporter une fonction privée pour un test mettrait dans `src/` une porte que la
production n'emploie pas.

### Neuf falsifications, neuf chutes

| | falsification | ce qui tombe |
|---|---|---|
| **F1** | la branche champ redevient `else if (i === undefined)` — le défaut d'origine | `F-J T1`, `T2`, `T4`, `T5` |
| **F2** | le champ l'emporte, le bâtiment cesse de compter | `F-J T5` seul |
| **F3** | le **MOTEUR** est « corrigé » à la place du dessin | `F-J T2`, `T3`, `T5` |
| **F4** | la fiche revient à la pièce de niveau 50 | `CH-F T8`, `F-J T6`, `T7` |
| **F5** | la fiche écrit `36000` en dur au lieu d'appeler la formule | `CH-F T8`, `F-J T6` |
| **F6** | `CH-F T8` perd l'avarie de son Complexe | `CH-F T8` seul |
| **F7** | la fiche annonce une ligne de coût en ressource | `F-J T6`, `T7`, `T8`, `T10` |
| **F8** | le Complexe à zéro PV promet « aucune attente » (0) au lieu de rien | `F-J T10` seul |
| **F9** | `ramenerLaGarnison` se met à débiter du quartz | `F-J T9`, plus `RÉSERVE T3` et `RÉSERVE-BASE T4` |

⚠ **F9 FAIT TOMBER DEUX GARDES D'ÉQUIVALENCE EN PLUS**, et c'est instructif :
`tickJeu × n ≡ rattraperJeu(n)` cesse de tenir dès qu'un retour dépense quelque
chose, parce que le rattrapage n'appelle `ramenerLaGarnison` qu'aux bornes de ses
segments. Le retour gratuit n'est donc pas seulement une règle de jeu — c'est une
condition de l'équivalence des deux chemins d'avancement.

**Aucune assertion n'a été retirée ni assouplie.** Trois gardes changent de
cible : l'en-tête de `voisinsQualifiantsParCase` et le commentaire de
`flechesDeVoisinage` cessent d'affirmer pour renvoyer à `F-J T2` ; `CH-F T8`
gagne une avarie et **une assertion de plus**.

---

## 5. Relecture hostile (§6 du brief)

Cherché **une seule chose** : un endroit où le code ou un commentaire affirme
encore que deux mécanismes s'accordent sans qu'un test le vérifie. Balayage de
`src/` sur « la même règle », « la même formule que », « s'accordent », « ne
peuvent pas diverger », « le même nombre que » — 23 occurrences relues une par
une.

**Vingt-deux sont légitimes** : ce sont des « par construction » où le second
mécanisme APPELLE littéralement le premier (`niveauDeLaDefense` et
`niveauDeLArmee` appellent `moyenneEnDixiemes` ; les deux panneaux de raid
appellent `lignesDuResultat` du même rapport, et nomment leur test), ou des
renvois à un test nommé.

**Une seule candidate reste, et elle est DÉCLARÉE plutôt que corrigée.**
`src/ui/chantier.js` l. 142 écrit, au-dessus de `formaterUnites` : « TRONQUÉ,
JAMAIS ARRONDI AU SUPÉRIEUR […] C'est la même règle que `formaterPv` du banc ».
Les deux fonctions sont indépendantes, et **rien ne mesure qu'elles s'accordent**.

Pourquoi ce n'est PAS le même défaut, et pourquoi rien n'a été écrit :

- elles ne répondent **pas** à la même question — `formaterUnites` rend un
  entier, `formaterPv` rend un dixième (`formaterPv(2 897 400)` → `'2897,4'`) ;
  un test qui les comparerait comparerait deux formes différentes ;
- ce que la phrase revendique est une **direction d'arrondi partagée**, et
  chacune des deux est épinglée séparément par une assertion **discriminante** :
  `formaterUnites(999) === '0'` dans `chantier.test.js`, `formaterPv(499) ===
  '0,4'` dans `banc.test.js`. Un arrondi au supérieur fait tomber les deux.

**À reprendre si Ethan veut la garde croisée** ; elle demanderait de faire rendre
aux deux fonctions une grandeur comparable, ce qui est un autre lot.

---

## 6. Ce qui n'a pas bougé, vérifié plutôt que cru

- **`SAVE_VERSION` reste à 27.** Pas un champ n'entre dans l'état : une entrée de
  voisinage est calculée à la demande, une durée de fiche est un affichage.
  Vérifié au diff — `src/sim/state.js` n'a pas une ligne de changée.
- **`debitDuBatiment`, `productionParRessource`, `capacitesMilli`** : lus, jamais
  modifiés. `F-J T3` le mesure.
- **`problemesDeDisposition`** : la règle « seul le collecteur occupe un champ »
  ne bouge pas — `F-J T1` l'asserte de face.
- **`direLaDuree`** et son point décimal : intacts.
- **`RETOUR_DEFENSES`, `pvApresRetour`, `sim/reparation.js`** : aucune ligne de
  code changée. Le seul ajout au fichier de test est `F-J T9`.
- **Le mode `'manuelle'`** de la réparation des bâtiments : intact — voir §3.
- **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME** : le lot
  ne touche ni `art/`, ni un outil de la chaîne.

---

## 7. Points en suspens

1. **La formulation de `REPARATION_BASE_JOUEUR`** — §3. Le brief demandait de la
   corriger ; l'instruction repose sur une confusion, et la corriger ferait
   mentir la table sur la réparation des bâtiments, qui coûte réellement du
   quartz. **Ethan tranche** : s'il voulait dire que la réparation des BÂTIMENTS
   cesse de coûter, c'est un changement de règle, pas de formulation, et un lot à
   lui seul.
2. **La fiche du Complexe ne dit plus le pire cas.** Un joueur dont la garnison
   dépasse le niveau du Complexe attend plus longtemps que la ligne n'annonce.
   Une SECONDE ligne — « et pour votre pièce la plus haute : N h » — le dirait
   sans reprendre l'arbitrage ; elle n'a pas été écrite, Ethan n'ayant demandé
   qu'un chiffre.
3. **La garde croisée `formaterUnites` / `formaterPv`** — §5.
4. **La double qualification reste inatteignable en jeu.** La règle est écrite et
   gardée ; une ligne de plus dans un `parVoisin` la rendrait atteignable sans
   qu'on y pense, et `F-J T5` tombera alors en demandant qu'on monte le cas pour
   de bon.
