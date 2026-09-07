# RAPPORT — lot DÉPLACEMENT : la base bouge

Exécuté le **02/09/2026**. Base de départ : `main` à `cf76b03` (après EUCLIDE).

---

## 1. Version et build produits

| Grandeur | Avant | Après |
| --- | --- | --- |
| `package.json` version | 0.64.0 | **0.65.0** |
| `config.build` | `"65"` | **`"66"`** |
| `dist/index.html` | 1 376 909 o | **1 383 723 o** |
| `SAVE_VERSION` | 21 | **22** |

Les deux champs restent des **chaînes** — `android/app/build.gradle.kts` les lit
`as String`.

---

## 2. Base de référence du §1 — retrouvée, les quatre nombres

| Grandeur | Attendu | Mesuré |
| --- | --- | --- |
| version / build | 0.64.0 / 65 | **0.64.0 / 65** ✅ |
| `dist/index.html` | 1 376 909 octets | **1 376 909** ✅ |
| `node --test "test/*.test.js"` | 855 / 855 / 0 | **855 pass, 0 fail** ✅ |
| `SAVE_VERSION` | 21 | **21** ✅ |

Aucun `RAPPORT-lotDEPLACEMENT.md` n'existait à la racine.

---

## 3. Delta d'octets, tests avant / après

- **+6 814 octets** (1 376 909 → 1 383 723). Du code, du balisage et de la
  feuille : **aucune image n'entre**, mesuré — `grep -c "data:image/png;base64,"`
  rend **16 avant, 16 après**.
- Marge sous la borne T10 (1 400 000) : **16 277 octets, 1,16 %**. C'est la marge
  la plus mince du dépôt ; la borne **n'a pas été relevée**, ce lot ne faisant
  entrer aucune ressource.
- Tests : **855 → 872**, 0 fail. +17 dans `test/deplacement.test.js`.

---

## 4. Chaque test du §6, avec sa falsification jouée

Toutes les falsifications ont été jouées **sur une copie fraîche du dépôt**.

| # | Verdict | Falsification jouée | Résultat |
| --- | --- | --- | --- |
| **T1** | **PASS** | portée mesurée en Tchebychev au lieu d'Euclide | T1 tombe, seul |
| **T2** | **PASS** | destination rabotée sur la carte au lieu d'être refusée | T2 tombe, seul |
| **T3** | **PASS** | boucle de déplacement dupliquée dans `raserLaBase` | T3 tombe, seul |
| **T3 bis** | **PASS** | — (il MESURE que `raserLaBase` n'a pas changé) | — |
| **T4** | **PASS** | rappel de `releverLesPoisAcquis` omis | T4 tombe, seul |
| **T4** | **PASS** | POI **recalculés** au lieu d'être enrichis | T4 tombe, seul |
| **T5** | **PASS** | terrain régénéré depuis `position` | **T5 et T5 bis tombent** |
| **T6** | **PASS** | — | — |
| **T7** | **PASS** | `niveauDesBatiments` lu comme un entier | **T7 et T8 tombent** |
| **T8** | **PASS** | refus rendu sans chiffre (« ne peut pas encore ») | T8 tombe, seul |
| **T9** | **PASS** | `0` posé à la place de `null`, création et migration | **11 tests tombent** |
| **T10** | **PASS** | état bricolé à la main au lieu de `partieNeuve` | T10 tombe, seul |
| **T11** | **PASS** | coût recalculé dans la flèche | T11 tombe, seul |
| **T11 bis** | **PASS** | halo réduit à l'intérieur de la case ; flèche vers sa propre base | T11 bis tombe sur chacune |
| **T12** | **PASS** | — | — |
| **T12 bis** | **PASS** | — (équivalence des deux chemins, 9 h × 2 graines) | — |

### La falsification la plus parlante : `0` au lieu de `null`

Poser `dernierDeplacementTick: 0` plutôt que `null` fait tomber **onze tests sur
dix-sept**. C'est ce qui donne sa valeur à l'insistance du §4.3 : un zéro se lit
« déplacée au tick 0 », ce qui est vrai par accident sur une partie neuve et faux
partout ailleurs. Un test dédié (T9) le prouve avec l'appât qui va avec.

---

## 5. M1 — ce que le déplacement change

Sur **150 graines**, un saut de dix cases vers le haut, c'est-à-dire vers
l'Ouvrage :

| Départ → arrivée | Cibles à portée, avant | après | Bases attaquantes, avant | après |
| --- | --- | --- | --- | --- |
| 240 → 230 | 34,27 | 34,53 | 34,27 | 34,53 |
| 200 → 190 | 34,29 | 34,37 | 34,29 | 34,37 |
| 150 → 140 | 34,31 | 34,40 | 34,31 | 34,40 |
| 100 → 90 | 34,30 | 34,40 | 34,30 | 34,40 |

⚠⚠ **LE NOMBRE NE DIT RIEN, ET C'EST LA MESURE QUI COMPTE.** La densité du
peuplement est uniforme depuis EUCLIDE, donc bouger de dix cases ne change
pratiquement pas le NOMBRE de cibles. Ce qui change, c'est LESQUELLES :

| Grandeur, rangée 200 → 190 | Valeur |
| --- | --- |
| Cibles NEUVES après le saut | **60,0 %** |
| Niveau moyen des cibles | **20,01 → 22,00** |

Ce que le déplacement achète, ce n'est pas plus de cibles : ce sont **d'autres
cibles, plus hautes**. C'est un **constat**, pas un réglage — aucun nombre
d'équilibrage n'a été touché.

---

## 6. Le recensement des §5.1 et §5.2

### Qui lit `etat.position` — et ce que le déplacement lui fait

| Lieu | Ce qu'il en fait | Verdict |
| --- | --- | --- |
| `sim/deplacement.js` | **L'ÉCRIT** — le seul du dépôt | **neuf** |
| `sim/territoire.js:150` | `basesDuJoueur` rend `[etat.position]` | **CHANGE** : le territoire suit, et c'est voulu |
| `sim/satellites.js:157` | `niveauDeLaRangee(etat.position.rangee)` | **CHANGE** : le rayon des anneaux suit la rangée (T6) |
| `sim/satellites.js:360` | `casesDeLAnneau(etat.position, …)` | **CHANGE** : les apparitions futures tombent ailleurs |
| `sim/site-de-la-case.js:144` | « cette case est-elle ma base ? » | **CHANGE**, et c'est juste : l'ancienne case redevient attaquable |
| `sim/site-de-la-case.js:313` | `ciblesAPortee` part de la position | **CHANGE** : c'est M1 |
| `sim/points-attaque.js:372,417` | territoire allié, distance du barème | **CHANGE** : le tarif suit la base |
| `sim/raid.js:178` | portée d'un raid | **CHANGE** |
| `sim/poi.js` (par `basesDuJoueur`) | le relevé des POI | **CHANGE**, et c'est rappelé à chaque déplacement (T4) |
| `ui/monde.js:244` | où la base est peinte | **CHANGE** : le halo la suit |
| `ui/monde.js:1147,1180` | `centrerSur` | **CHANGE** : le bouton « Ma base » suit |
| `sim/state.js:1644,1663` | migrations v0 → v1 et v4 → v5 | **ne change pas** : elles écrivent une position de départ |
| `ui/chantier.js:2026,2098` | `backgroundPosition` CSS | **ne change pas** : homonyme, sans rapport |

### Qui lit `fondation` — et pourquoi rien ne bouge

| Lieu | Ce qu'il en fait | Verdict |
| --- | --- | --- |
| `sim/state.js:2132-2133` (`serialiser`) | redéduit `champs` et `obstacles` | **ne change pas** — `fondation` n'est jamais écrite par ce lot |
| `sim/champs.js` | `champsDeLaBase`, `obstaclesDeLaBase` | **ne change pas** — jamais appelés par le déplacement (T5 bis le balaie) |
| `sim/rendu-pose.js` | la variante d'un sprite de case | **ne change pas** |
| `sim/state.js:145` (`creerEtat`) | la pose initiale | **ne change pas** |

**Conséquence mesurée** (T5) : sur une base réellement construite, `champs`,
`obstacles`, `fondation` et `disposition` sont **identiques au caractère** avant
et après un déplacement, et **aucun bâtiment ne se retrouve sur un obstacle**.
Le §7 du brief en faisait un point d'arrêt ; il n'a pas été atteint.

---

## 7. Comment `raserLaBase` a été ramenée à la fonction commune

**Ce qui a été déplacé :** la seule ligne qui écrivait la position, plus le
rappel de `releverLesPoisAcquis` qui la suivait. Les deux vivent désormais dans
`poserLaBaseSur`, dans `sim/deplacement.js`.

**Ce qui est resté :** tout ce qui est PROPRE au rasage — une seule direction,
une distance fixe (`sanctionRasage.redeploiementCases`), le rabotage case par
case sur le bord de carte, et la perte des stocks.

```js
// avant                              // après
etat.position.rangee = rangeeApres;   poserLaBaseSur(etat, rangeeApres, etat.position.colonne);
// … puis, dans subirUnRaid :
if (rase) releverLesPoisAcquis(etat); // (le relevé est fait par poserLaBaseSur)
```

**La preuve que le comportement n'a pas changé**, en trois formes :

1. **Les tests RAID-B sont passés sans une seule retouche** — c'est le §6 T12 du
   brief de ce lot-ci, et le §7 en faisait un point d'arrêt.
2. **T3 bis le mesure de face**, sur trois positions de départ dont deux au bord
   de la carte : vingt cases vers le bas, rabotées à la dernière rangée valide,
   stocks à zéro, `sanction.cases` exact.
3. **T3 balaie la source** : un seul fichier de `src/sim/` écrit `etat.position`,
   et `raid-ouvrage.js` n'en fait plus partie.

⚠ **UNE LECTURE PRISE AU PASSAGE, ET ELLE SE SIGNALE.** L'horodatage du délai
s'écrit dans `deplacerLaBase`, **pas** dans `poserLaBaseSur` : **un rasage ne
consomme donc pas le délai du joueur**. La sanction est déjà la plus lourde du
jeu ; lui retirer aussi le droit de bouger le punirait deux fois, et
l'empêcherait précisément de fuir l'endroit où il vient d'être rasé. Une ligne à
déplacer si Ethan tranche autrement, et T3 bis la fige.

---

## 8. Le libellé exact de la confirmation

Le bouton `#options-zero` porte **« Effacer et recommencer »**. Il n'efface rien :
il révèle un avertissement et deux boutons, **« Oui, tout effacer »** et
**« Annuler »**.

L'avertissement, mot pour mot :

> Toute la partie sera effacée : ta base et sa disposition, ta garnison, ton
> armée, tes recherches, ta position sur la carte et les dix derniers rapports de
> raid. La carte sera tirée à neuf. C'est définitif, et rien n'est mis de côté.

⚠ **CE N'EST PAS UN « ÊTES-VOUS SÛR ? », ET C'EST LE POINT.** Un joueur qui a
touché par erreur n'apprend rien d'une question ; il apprend quelque chose d'une
liste de ce qu'il perd. Un test (T10) exige que le libellé nomme la base, la
garnison, l'armée, les recherches, et le mot « définitif » — et **refuse** la
formule « êtes-vous sûr ».

**Les deux autres précautions du §4.5 :**

- le bloc est **en bas de l'écran**, séparé par un écart de 24 px et un trait
  rouge, loin du bouton de mise à jour : le doigt qui rate sa cible ne peut pas
  tomber dessus ;
- il repart par **`partieNeuve`**, la fonction que le bouton de l'écran d'alerte
  appelle déjà — donc `creerEtat`, donc une graine et une fondation neuves. T10
  refuse tout état bricolé à la main. **Vérifié dans le navigateur** : la graine
  change (1 632 367 264 → 1 632 372 486).

---

## 9. Écarts par rapport au brief, et points en suspens

### Un défaut ANTÉRIEUR au lot, trouvé et corrigé

⚠⚠ **`ciblageDuSite` FAISAIT LEVER LE PANNEAU DE L'ÉCRAN MONDE SUR TOUT SITE
LOINTAIN, ET C'ÉTAIT SUR `main`.** Elle demandait `coutDUnRaid` **avant**
`problemesDuRaid` ; or `coutDuRaid` LÈVE au-delà du rayon d'attaque, à raison —
un raid hors de portée n'a pas de prix. Le panneau, lui, s'ouvre sur ce que la
FENÊTRE montre, pas sur ce qui est à portée.

**Mesuré dans Chromium, sur un balayage complet de l'écran Monde : 0 panneau
ouvert avant, 32 après.** Le joueur ne pouvait consulter **aucun** site à plus
de dix cases, sur toute la carte. Vérifié aussi en simulation pure sur
`origin/main` : `ciblageDuSite` lève « coutDuRaid : 25 cases — hors du rayon
d'attaque (10) ».

Le correctif tient en trois lignes : les problèmes se demandent d'abord, et
`cout` vaut **`null`** hors de portée — jamais zéro, qui se lirait « gratuit ».
Le panneau écrit « hors de portée », et la flèche ne se dessine pas sans prix.
C'est la même situation qu'au lot RAID-A, où l'écran a rendu atteignable un
défaut de moteur qui existait déjà.

### Écarts

1. **Deux garde-fous resserrés, avec leur raison écrite** — jamais assouplis :
   - `monde.test.js` interdisait `fillText` **partout** dans l'écran Monde
     (arbitrage du 30/08, « on enlève les lettres quoi qu'il arrive »). Le §4.4
     demande que la flèche « porte le coût d'attaque », c'est-à-dire un nombre.
     L'interdiction **nomme désormais son unique exception**, `dessinerFleche`,
     et reste **totale ailleurs** : une lettre ne peut pas revenir sur un emblème
     sans faire tomber le test.
   - Le panneau de site n'admettait que le bouton « Fermer ». Il en admet un
     second, **« Déplacer la base », qui n'apparaît que sur SA PROPRE base** ; les
     quatre mots promis-mais-absents (Attaquer, Raider, Piller, Conquérir)
     restent interdits.
2. **Le délai n'est pas une table de paliers neuve.** Le §4.3 demandait « des
   paliers interpolés » ; `GEOGRAPHIE.delaiEntreSautsHeures` portait déjà le
   couple exact que le brief cite, et il dormait sans lecteur depuis
   `SESSION-RELEVE-BUTIN.md`. `DEPLACEMENT.delaiHeures` le **référence** plutôt
   que de le recopier — `CLAUDE.md` §4 : « une seule table fait foi par
   grandeur ». Un test l'asserte par identité, pas par valeur.
3. **Une fonction de plus que le brief ne demandait** : `casesAtteignables`, qui
   interroge `problemesDuDeplacement` pour que l'écran montre où aller. C'est le
   motif de `casesPosables` de l'écran Chantier : une seconde liste de règles
   finirait par montrer une case que le geste refuse.
4. **Le geste suit le modèle « armer puis toucher »** de l'écran Chantier, que le
   brief ne nommait pas : on arme au bouton, on touche une case, fermer désarme.
   Le joueur n'a qu'une grammaire à apprendre pour les deux écrans.

### Points en suspens

1. **Le multi-bases reste hors périmètre**, comme le §0 le dit. `geometrieDuHalo`
   prend une POSITION et non un état, pour que ce jour-là il n'y ait qu'un
   appelant à changer.
2. **Un rasage ne consomme pas le délai** — lecture prise, §7 ci-dessus.
3. **Le joueur ne voit toujours aucun rapport de défense**, et **rien ne répare
   un bâtiment abîmé** : les deux trous hérités de RAID-B sont intacts.
4. **La marge sous la borne T10 est à 1,16 %**, la plus mince du dépôt. Le
   prochain lot qui fait entrer une image devra relever la borne en écrivant
   pourquoi.

---

## 10. Ce qui a été lancé, et ce qui ne l'a pas été

- `npm run check` : **872 pass / 0 fail**, `dist/index.html` **1 383 723
  octets**, **0 référence externe**.
- **Boot sans tête** (Chromium préinstallé, `playwright-core` hors du dépôt,
  412 × 915), et c'est lui qui a trouvé le défaut du panneau :
  - balayage complet de l'écran Monde — **0 panneau ouvert avant correctif, 32
    après** ;
  - le geste complet joué à la souris : panneau de la base → « Déplacer la
    base » → « Touchez une case à 10 cases au plus » → toucher → **base déplacée
    de 295 à 293, `fondation` et `disposition` identiques, horodatage écrit,
    sauvegarde en v22** ;
  - la remise à zéro en deux temps : avertissement affiché, confirmation, **graine
    changée** ;
  - **aucune erreur de page ni de console** dans aucun des scénarios.
- `python3 tools/verifier.py` : **NON LANCÉ, et c'était conforme** — le lot ne
  touche ni `art/`, ni `tools/`.
- `node tools/audit-maquette.mjs` : **non lancé** — le lot ne touche pas
  `foyer-zero-ui.html`.
