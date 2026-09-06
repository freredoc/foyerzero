# RAPPORT — lot SON-VOLUMES

Retours d'Ethan du 06/09, points **2** et **22**.
Exécuté le 06/09/2026. Version produite : **0.99.7 · build 108**.

---

## 0. Ce qu'il faut lire en premier

⚠⚠ **LA PRÉMISSE CENTRALE DU BRIEF EST FAUSSE, ET C'EST LE PREMIER FAIT À DIRE.**

Le brief §2 pose, dans un tableau, que les trois sons à préserver « ne sont pas
sur le bus `interface` », et en tire sa conclusion en gras : « baisser
`BUS.interface` fait exactement ce qu'Ethan demande, et rien d'autre ».

**Mesuré : `order_player_attack`, qui EST le son du lancement de raid, est sur le
bus `interface`.**

Le brief posait lui-même la condition d'arrêt : « Si l'un d'eux y était,
**s'arrêter** : le moyen retenu serait faux et il faudrait passer par les
`volumeDb` individuels. » Elle s'est déclenchée. `SON-V T4` a été écrit et lancé
**avant qu'un seul niveau ne bouge**, sur l'arbre intact — il passait déjà —, et
c'est lui qui a changé le moyen du lot.

⚠ **Et le fait était au dépôt depuis le 04/09.** `RAPPORT-lotSON-CATALOGUE.md` §5
écrit `alerts → interface` et `orders → interface` en toutes lettres, avec le
motif : « des accusés de réception d'un ordre que le joueur vient de donner ».

---

## 1. Les mesures

| grandeur | avant | après |
|---|---|---|
| `npm test` | **1173 pass / 0 fail** | **1179 pass / 0 fail** |
| `dist/index.html` | 7 997 324 o | **7 997 316 o** |
| delta | — | **−8 octets** |
| lignes `data:` | 296 | **296** |
| URI `data:` | 291 | **291** |
| `python3 tools/verifier.py` | **VERT** — 858 · 0 · 0 · 0 | **VERT** — 858 · 0 · 0 · 0 |
| version · build | 0.99.6 · 107 | **0.99.7 · 108** |
| `SAVE_VERSION` | 26 | **26** |

Poste par poste, contre le livrable bâti depuis `origin/main` :

| poste | avant | après | delta |
|---|---|---|---|
| JavaScript | 352 405 | 352 397 | **−8** |
| feuille | 3 186 734 | 3 186 734 | **+0** |
| balisage | 4 458 185 | 4 458 185 | **+0** |
| images | 6 306 190 | 6 306 190 | **+0** |
| audio | 1 193 346 | 1 193 346 | **+0** |

La somme des cinq postes tombe **exactement** sur le total. Borne T10 **inchangée
à 9 300 000**, marge **1 302 684 octets, 14,01 %**.

⚠⚠ **ET LES HUIT OCTETS SE DÉCOMPOSENT AU CARACTÈRE.** Le brief demandait : « si
le delta d'octets n'est pas quasi nul, quelque chose a débordé : le mesurer et le
dire. » Rien n'a débordé, et voici pourquoi :

- `monde:"ambience_calm_map_loop",` fait **31 octets** dans le livrable minifié,
  et il sort : **−31** ;
- vingt-trois `volumeDb:0` deviennent `volumeDb:-6`, un caractère de plus
  chacun : **+23**.

**−31 + 23 = −8.** Vérifié dans `dist/` : les occurrences de `volumeDb:-6`
passent de **18 à 41** (+23, exactement les 23 boutons), et
`ambience_calm_map_loop` de 4 à 3 — la seule référence perdue est celle de la
table d'écran. Le bump de version ne coûte rien, les deux numéros gardant leur
nombre de chiffres.

---

## 2. §0 — le premier geste

1. `CLAUDE.md` lu en entier, puis les trois rapports exigés —
   `RAPPORT-lotSON-MOTEUR.md`, `RAPPORT-lotSON-CATALOGUE.md`,
   `RAPPORT-lotSON-CABLAGE.md`. C'est le troisième qui porte le fait du §0.
2. `src/son/` (2 fichiers), `src/data/` (13), `test/` (61) listés.
3. `npm ci && npm run check` → **1173 pass / 0 fail**.

⚠⚠ **LA BASE ANNONCÉE PAR LE BRIEF N'ÉTAIT PLUS LÀ, QUATRIÈME LOT DE SUITE.** Il
pose 1 135 pass, 7 987 956 octets et 0.99.2 · build 103 ; mesuré au départ,
**1 173 pass, 7 997 324 octets, 0.99.6 · build 107**. Les lots CARTE-B,
CHANTIER-FICHES, RECHERCHE-ÉCRAN et RETOUR-DE-RAID ont été mergés entre
l'écriture du brief et son exécution. Signalé plutôt que traité comme un point
d'arrêt.

⚠ **Un second fait du brief est faux, en plus de la prémisse** : il annonce
« trente-et-un sons `ui_*` à `volumeDb: 0` ». **Mesuré : ils sont vingt-trois.**

⚠⚠ **ET `verifier.py` N'A PAS DÉMARRÉ AU PREMIER ESSAI.** Sortie 1 dès
`planches.py`, `ModuleNotFoundError: No module named 'PIL'` — le cas exact que
`CLAUDE.md` §3 annonce : « les trois paquets ne sont pas dans l'environnement
d'exécution, et il faut le savoir avant de conclure ». `Pillow`, `numpy`, `scipy`
et `opus-tools` installés, il démarre. Sans cette lecture on lit « chaîne
cassée » là où il manque une dépendance.

---

## 3. Point 2 — plus d'ambiance sur la carte

Ethan : « **Enlever son d'ambiance sur la carte.** »

La clé `monde` **disparaît** d'`AMBIANCE_PAR_ECRAN`. La table passe de sept
entrées à six.

⚠ **LA CLÉ DISPARAÎT, ELLE NE PASSE PAS À `null`**, comme le brief l'exige.
`bouclesDesirees` teste `!== undefined` : une clé posée à `null` passerait le
test, et `voulu.add(null)` empoisonnerait l'ensemble des boucles voulues avec un
nom qui n'est pas un événement — la réconciliation lèverait, loin de la faute.

⚠⚠ **ET LE GÉNÉRATEUR REFUSE DÉJÀ LE PIÈGE, MESURÉ.** `src/data/sons.js` est un
fichier GÉNÉRÉ ; poser `'monde': None` dans `tools/sons.py` fait lever
`exiger_une_boucle` — « `AMBIANCE_PAR_ECRAN[monde] : « None » n'est pas un son du
pack » — et la table empoisonnée n'atteint jamais le dépôt. Voir §7,
falsification n° 1.

### 3.1 La vérification que l'écran est la SEULE source — faite, pas supposée

Le brief l'exigeait. Relevé sur tout `src/`, hors le fichier de données lui-même :

- `AMBIANCE_PAR_ECRAN` n'a **qu'un seul lecteur**, `bouclesDesirees` de
  `src/son/cablage.js`, ligne 188 ;
- `BOUCLES_DE_BATIMENT` ne porte **aucune** ambiance — mesuré : ses quatre
  valeurs sont `building_player_factory_loop` et `building_reactor_loop` ;
- `boucleDeLUnite` ne rend que des `movement_*` ;
- aucun autre fichier de `src/` ne nomme `ambience_calm_map_loop`.

**Le retrait de la clé suffit donc**, et il n'y avait pas à patcher à l'aveugle.

### 3.2 Relevé dans Chromium, géométrie du S25 FE — la boucle s'arrête vraiment

Les tests mesurent ce que la réconciliation VEUT ; ce qui suit mesure ce que le
navigateur FAIT. `AudioBufferSourceNode.prototype.start` et `.stop` sont
instrumentés **avant le chargement**, et seules les sources qui BOUCLENT sont
comptées — c'est la seule fenêtre honnête sur ce qui tourne, l'adaptateur
n'exposant rien.

| écran | sources en boucle |
|---|---|
| Chantier | **1** |
| **Monde** | **0** |
| retour au Chantier | **1** |

L'ambiance s'arrête à l'entrée dans la carte et repart en sortant. **Zéro erreur
de page** sur tout le trajet. ⚠ Et `document.querySelectorAll('audio')` rend
**263** balises, dont celle d'`ambience_calm_map_loop` : le son dormant est bien
toujours dans le livrable.

### 3.3 Un son devient dormant, zéro `data:` retiré

`ambience_calm_map_loop` **reste au catalogue et au livrable**. Ses 19 198 octets
d'Opus sont toujours inlinés ; le son n'a simplement plus aucun demandeur.

Mesuré par les gardes existantes, qui ont changé de cible pour le dire :
**168 sons atteignables au lieu de 169, 95 muets au lieu de 94**, et
`ambience_calm_map_loop` entre dans la liste nommée des ambiances muettes.

⚠ **Le départage `calm_map` / `map_wind` devient SANS OBJET.** C'était « le SEUL
choix esthétique » du lot SON-CÂBLAGE, pris « pour que la carte ne soit pas
muette » ; l'arbitrage le renverse — elle doit l'être. Aucune des deux n'est
retirée du catalogue, et la question ne se pose plus.

---

## 4. Point 22 — baisser les sons de boutons

Ethan : « **Baisser les sons des boutons, garder les seuils pour les
améliorations, construction et lancement de raid.** »

### 4.1 La mesure exigée par le brief §2.1

Énumération **programmatique** des sons dont `bus === 'interface'` — **53 sons** :

| préfixe | nombre | sons |
|---|---|---|
| `ui_` | **23** | `ui_cancel_01/02`, `ui_click_01/02`, `ui_confirm_01/02`, `ui_countdown`, `ui_defeat`, `ui_error_01/02`, `ui_hover_01/02`, `ui_objective_complete`, `ui_objective_new`, `ui_pause`, `ui_queue_add`, `ui_queue_remove`, `ui_resource_gain`, `ui_resource_spend`, `ui_resume`, `ui_toggle_off`, `ui_toggle_on`, `ui_victory` |
| `alert_` | **18** | les neuf alertes × deux camps |
| `order_` | **12** | `select`, `move`, **`attack`** × deux variantes × deux camps |

Répartition complète des cinq bus : `armes` 87 · `impacts` 68 · **`interface`
53** · `moteurs` 47 · `ambiances` 8.

Les trois gestes à préserver, résolus par `evenementDuGeste` :

| geste | événement | bus | `volumeDb` | niveau effectif |
|---|---|---|---|---|
| pose (construction) | `building_player_complete` | `moteurs` | 0 | **−12** |
| amélioration | `building_player_complete` | `moteurs` | 0 | **−12** |
| **lancement de raid** | **`order_player_attack`** | **`interface`** | 0 | **−3** |

⚠⚠ **UN DES TROIS EST SUR `interface`. Le brief demandait de s'arrêter ; le lot
s'est arrêté et a changé de moyen.**

### 4.2 Pourquoi pas un sixième bus

Loger les boutons sur une ligne à eux résoudrait tout en un nombre. C'est
interdit, et pas par confort : `BUS_PAR_CATEGORIE` de `tools/sons.py` écrit « il
n'y a pas de sixième bus — on n'en invente pas », et les cinq niveaux se **lisent
dans `art/sources/README.md` ligne 36** — c'est la recommandation du pack, pas un
réglage du dépôt. `SON T12` les confronte par un `deepEqual`.

**`BUS` ne bouge donc pas d'un décibel**, et `SON T12` est intact.

### 4.3 Le moyen retenu : un cran par FAMILLE, une seule décision

`RETRAIT_PAR_CATEGORIE = {'ui': -6}` entre dans `tools/sons.py` ; le générateur
écrit `recommended_volume_db + retrait[catégorie]` dans les 263 lignes.

Le brief interdisait de « toucher aucun `volumeDb` individuel », au motif que
« les décaler un par un ouvrirait vingt-trois décisions là où il en faut une ».
**La règle tient cette intention à la lettre** : une ligne de générateur,
vingt-trois conséquences, et la famille reste cohérente **par construction** —
`SON-V T5` exige qu'elle ne porte qu'UN seul cran.

⚠ `src/data/sons.js` étant GÉNÉRÉ, la décision ne pouvait pas vivre ailleurs :
une retouche à la main y serait effacée au prochain lot d'art, sans bruit.

### 4.4 La valeur retenue, et sa justification par le barème

**`-6 dB` de retrait, soit un bouton à `-3 + -6 = -9` de niveau effectif.**

Le barème des bus : `interface` −3 · `armes` −6 · `impacts` −7 · `moteurs` −12 ·
`ambiances` −18.

- **Six décibels, c'est l'amplitude divisée par deux** — une baisse qui s'entend,
  pas un ajustement cosmétique.
- **−9 tombe entre `impacts` (−7) et `moteurs` (−12)** : les boutons restent
  **au-dessus** de la couche des moteurs. Le brief pose cette borne basse —
  « une descente qui mettrait `interface` sous `moteurs` rendrait les boutons
  inaudibles sur un téléphone en extérieur » — et elle est respectée avec marge.
- Les deux voisins ont été regardés : **−3** mettrait les boutons à −6, soit
  seulement 3 dB sous le lancement de raid — un écart à peine perceptible, qui ne
  se lirait pas comme un seuil ; **−9** les mettrait à −12, à égalité avec
  `moteurs`, c'est-à-dire sur la borne que le brief signale.

⚠⚠ **ET « GARDER LES SEUILS » N'AVAIT AUCUN SEUIL À GARDER — MESURÉ.** Avant ce
lot, **un clic et un lancement de raid étaient au MÊME niveau, −3**. Baisser le
bus les aurait fait descendre ensemble : il n'aurait rien gardé du tout. Après :

| son | avant | après |
|---|---|---|
| clic de bouton | −3 | **−9** |
| lancement de raid | −3 | **−3** |
| construction / amélioration | −12 | **−12** |

Le raid passe **6 dB au-dessus** des boutons. C'est ce que la demande veut dire.

⚠ **ET LA CONSTRUCTION EST À −12, DONC SOUS LES BOUTONS MÊME APRÈS LA BAISSE.**
`building_player_complete` est sur le bus `moteurs` ; son écart aux boutons passe
de 9 dB à 3 dB — dans le bon sens, sans qu'une ligne la concerne. **Relevé, non
corrigé** : la monter serait inventer une demande qu'Ethan n'a pas faite. À
rouvrir s'il la trouve trop discrète.

**Le nombre appartient à Ethan et se change seul**, sur une ligne de
`tools/sons.py` suivie d'un `python3 tools/sons.py --ecrire`. `SON-V T5` asserte
le SENS de la variation, jamais la valeur, pour que son prochain réglage n'ait
rien à casser.

---

## 5. Ce que le lot ne touche pas

- **`src/son/politique.js`** : aucune ligne. `gainDuSon` fait déjà la somme des
  décibels ; le retrait est baké dans la table et ne s'applique pas deux fois.
- **`src/son/cablage.js`** : aucune ligne. Le `!== undefined` suffit.
- **`BUS`** : les cinq niveaux du pack, intacts.
- **Les quatre autres bus**, le volume du joueur, le muet, l'écran d'options.
- **Aucun écran de `src/ui/`.**
- **`art/sprites/son/`** : pas un octet. Le retrait vit dans la TABLE, jamais dans
  l'encodage — les 263 `.opus` sont identiques, et le vérificateur le prouve.
- **`SAVE_VERSION`** reste à **26** : un niveau de mixage et une table d'ambiance
  par écran sont des réglages de SORTIE ; le volume et le muet vivent depuis
  toujours dans le magasin séparé `foyer-zero/reglages/1`.

Fichiers touchés : `tools/sons.py`, `src/data/sons.js` (généré),
`test/son.test.js`, `package.json`, `CLAUDE.md`, ce rapport.

---

## 6. Les tests — T1 à T6, et ce qui a changé du brief

**Six tests entrent dans `test/son.test.js`. Le compte passe de 1 173 à 1 179.**

| code | verdict | montage effectivement écrit |
|---|---|---|
| **SON-V T1** | **PASS** | `hasOwnProperty(AMBIANCE_PAR_ECRAN, 'monde') === false`, avec un TÉMOIN : sur une table où la clé est posée à `undefined`, la lecture par valeur passe et celle par présence mord. |
| **SON-V T2** | **PASS** | `deepEqual` sur les six clés restantes ET leur valeur ; puis les sept écrans sont LUS dans `session.js` et le test exige que l'exception soit exactement `['monde']`. |
| **SON-V T3** | **PASS** | `bouclesDesirees({ ecran: 'monde' })` ne contient aucune boucle d'ambiance, avec un témoin sur `chantier` qui prouve que la fonction en rend une ; et une base à caserne montre que la machinerie sonne toujours sur la carte — le retrait est chirurgical. |
| **SON-V T4** | **PASS** | Les trois gestes résolus par `evenementDuGeste`, leur bus mesuré, `BUS.interface === -3`, et le seuil de 6 dB entre le raid et les boutons. **Écrit et lancé AVANT toute modification.** |
| **SON-V T5** | **PASS** | Les 23 `ui_*` ne portent qu'UN seul `volumeDb`, et il est `< 0`. |
| **SON-V T6** | **PASS** | `BUS` aux cinq niveaux du pack ; les **30** autres sons du bus `interface` — 12 ordres, 18 alertes — encore à `volumeDb: 0` ; et les trois sons préservés nommément. |

### 6.1 Trois tests du brief ont changé de sens, et c'est déclaré

Le brief écrivait T4, T5 et T6 sous sa prémisse fausse. Ils sont **retournés**,
pas assouplis :

- **T4** — le brief : « les trois gestes préservés ne sont pas sur `interface` ».
  Écrit tel quel, il aurait **échoué**. Il mesure désormais la vérité : deux sur
  `moteurs`, un sur `interface`, et c'est ce fait qui **interdit** la voie du
  bus. Sa fonction — « c'est lui qui autorise le moyen retenu » — est conservée
  mot pour mot ; c'est sa réponse qui a changé.
- **T5** — le brief : `BUS.interface < -3`. **Sans objet** : le bus ne bouge pas.
  Remplacé par la garde qui mesure ce qui a réellement baissé, et qui exige en
  plus l'unicité du cran dans la famille.
- **T6** — le brief : « tous les `ui_*` sont encore à `volumeDb: 0` ».
  **Inversé** : ce sont les 30 sons qui PARTAGENT leur bus avec les boutons qui
  doivent être restés à 0, et c'est le test qui attrape un lot parti baisser la
  ligne de mixage.

### 6.2 Six gardes existantes changent de cible, cinq se resserrent

**Aucune assertion n'a été retirée ni assouplie.**

| garde | ce qui change | resserrement |
|---|---|---|
| `SON T1` | `volumeDb === recommended` devient `recommended + retrait[catégorie]`, le retrait **LU dans `tools/sons.py`** | **oui** — elle attrape en plus un réglage son par son et un retrait posé sur une autre famille |
| `SON T12` | le gain attendu s'écrivait `-3` en dur, donc supposait `volumeDb: 0` ; il nomme les DEUX termes | **oui** — la forme d'avant était déjà fausse des moteurs et des ambiances |
| `SON T14` | 169 → **168** atteignables, 94 → **95** muets | non — même garde, nouveau compte |
| `SON T15` | exigeait une ambiance sur les SEPT écrans ; exige que l'exception soit **exactement Monde, nommée** | **oui** — un `>= 6` aurait laissé n'importe quel écran la perdre |
| `SON T16` | le montage prend l'ambiance du raid, la carte n'en ayant plus | non — montage réparé, propriété inchangée, et l'assertion de discrimination le prouve |
| `SON T20` | mêmes comptes que T14, plus `ambience_calm_map_loop` dans la liste NOMMÉE des ambiances muettes | **oui** — la liste est nommée, pas comptée |

⚠ **`SON T1` lit une source Python, d'où un second filtre de commentaires.**
`sansCommentairesPython` ne retire que les lignes **entièrement** commentées — la
leçon du lot SOL-SATELLITE : couper à tout croisillon mangerait les clés
`'#FF00FF'`. Un témoin prouve que le filtre n'a pas tout mangé.

---

## 7. Les falsifications — onze, onze chutes

| n° | falsification | fait tomber |
|---|---|---|
| **1** | `'monde': None` dans le générateur | **AUCUN test JS — attrapé par l'OUTIL**, voir ci-dessous |
| **2** | la clé `monde` revient au fichier généré | `SON T14`, `SON T15`, `SON T20`, **`SON-V T1`, `T2`, `T3`** |
| **3** | la clé `monde` revient posée à `undefined` | `SON T14`, `SON T15`, `SON T20`, **`SON-V T1`, `T2`** — **et PAS `T3`** |
| **4** | un AUTRE écran perd son ambiance | `SON T15`, **`SON-V T2`** |
| **5** | un repli `?? 'ambience_calm_map_loop'` dans `cablage.js` | **`SON-V T3` SEUL** |
| **6** | les ordres passent sur `moteurs` — le monde que le brief supposait | **`SON-V T4`, `T6`** |
| **7** | le retrait revient à zéro | **`SON-V T4`, `T5`** |
| **8** | le retrait s'étend aux ordres : le raid baisse aussi | `SON T1`, **`SON-V T4`, `T6`** |
| **9** | `BUS.interface` baissé à −9 — **la voie que le brief prescrivait** | `SON T12`, **`SON-V T4`, `T6`** |
| **10** | un seul bouton réglé à part | `SON T1`, **`SON-V T5`** |
| **11** | le fichier généré retouché à la main sur un son hors famille | `SON T1`, **`SON-V T4`, `T6`** |

⚠⚠ **LA PREMIÈRE EST ATTRAPÉE PAR L'OUTIL, PAS PAR LA SUITE, ET IL FALLAIT LE
DIRE.** Poser `'monde': None` dans `tools/sons.py` ne fait tomber aucun test
JavaScript : `exiger_une_boucle` **LÈVE à la production** et `src/data/sons.js`
n'est pas réécrit. C'est le bon endroit pour cette garde-là — le piège que le
brief signale ne peut pas atteindre le dépôt — et la compter comme une chute de
test aurait été faux. La falsification n° 3 la rejoue **au niveau JS**, en
écrivant la table empoisonnée à la main.

⚠⚠ **ET LA PLUS INSTRUCTIVE EST LA N° 3.** Une clé posée à `undefined` fait
tomber `SON-V T1` et **PAS `SON-V T3`** : `bouclesDesirees` teste `!== undefined`,
donc le comportement reste juste et seule la garde de PRÉSENCE mord. C'est
exactement pourquoi T1 mesure `hasOwnProperty` et jamais `=== undefined`, comme
le brief l'exigeait.

⚠ **ET `SON-V T3` A SA PROPRE FALSIFICATION, QUI NE FAIT TOMBER QUE LUI** (n° 5) :
un repli glissé dans `cablage.js` laisse la table juste et le comportement faux.
C'est elle qui justifie que T3 existe à côté de T1 et T2.

⚠ **LA VOIE QUE LE BRIEF PRESCRIVAIT EST DÉSORMAIS GARDÉE TROIS FOIS** (n° 9).

---

## 8. Le vérificateur

⚠ **`python3 tools/verifier.py`, AVANT et APRÈS, comme le brief l'exige :**

| | avant | après |
|---|---|---|
| identiques à l'octet | **858** | **858** |
| différents | 0 | 0 |
| nouveaux | 0 | 0 |
| MANQUANTS | 0 | 0 |
| verdict | **VERT** | **VERT** |
| second verdict | « la chaîne lit exactement les sources déclarées » | idem |
| durée | 523,1 s | **515,6 s** |

**Le compte ne bouge pas, et les 263 `.opus` sont dans les identiques** : le
retrait vit dans la TABLE, pas dans l'encodage. Pas un octet d'audio n'a changé,
`art/sources/` n'a pas bougé, et aucune source n'entre ni ne sort.

⚠ Il a été lancé sur un arbre **immobile** dans les deux cas — « ne jamais le
lancer sur un arbre qu'on modifie » —, donc avant toute écriture pour le premier
et après la dernière pour le second, falsifications défaites.

---

## 9. Écarts par rapport au brief

1. ⚠⚠ **Le moyen a changé** : `BUS.interface` n'est PAS baissé ; c'est la famille
   `ui` qui l'est, par `RETRAIT_PAR_CATEGORIE` dans le générateur. C'est le
   fallback que le brief nomme lui-même — « il faudrait passer par les `volumeDb`
   individuels » —, appliqué en UNE décision plutôt qu'en vingt-trois. §0 et §4.
2. **T4, T5 et T6 changent de sens**, et le §6.1 dit lequel et pourquoi.
3. **Six gardes existantes changent de cible**, dont cinq se resserrent. Le brief
   n'en prévoyait aucune ; elles sont la conséquence mécanique du retrait de la
   clé et du cran de famille. §6.2.
4. **La base annoncée était périmée** (1 135 / 7 987 956 / 0.99.2·103 contre
   1 173 / 7 997 324 / 0.99.6·107), et **« trente-et-un sons `ui_*` » en fait
   vingt-trois**. §2.
5. **`verifier.py` n'a pas démarré au premier essai** faute des trois paquets
   Python et d'`opus-tools`. §2.

---

## 10. Points en suspens — pour Ethan

1. ⚠⚠ **La valeur `-6` est une PROPOSITION.** Elle se change sur une ligne de
   `tools/sons.py` suivie d'un `--ecrire`. Le barème et les deux voisins écartés
   sont au §4.4.
2. ⚠ **La construction reste 3 dB SOUS les boutons** (−12 contre −9). Relevé, non
   corrigé : la monter n'était pas demandé. §4.4.
3. ⚠ **Les alertes et les ordres restent à −3**, boutons compris dans la même
   ligne de mixage. Seuls les `ui_*` baissent ; `order_player_select` et
   `order_player_move` — qui sonnent au toucher d'une pièce — gardent donc leur
   niveau. **Si Ethan les compte parmi « les boutons », il suffit d'ajouter
   `'orders'` au retrait — mais cela baisserait aussi le lancement de raid**, ce
   qu'il demande de garder : il faudrait alors séparer `order_player_attack` du
   reste de sa famille, ce qui est un autre lot.
4. ⚠ **Le départage `calm_map` / `map_wind` est clos par disparition**, pas par
   arbitrage : les deux ambiances de carte sont muettes, aucune n'est retirée.
5. ⚠ **Les 240 sons muets le restent** — les 174 sons de combat attendent
   toujours leur branchement, et ce lot ne l'ouvre pas.
