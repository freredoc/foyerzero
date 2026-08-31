# RAPPORT — lot MODULES-A

**31/08/2026 · version 0.51.0 · build 52 · branche `claude/lot-modules-a`**

Objet : câbler les deux modules qui n'ont besoin ni de toucher au ciblage ni de
changer la structure du combat — **Tir de barrage** et **Booster** — et rendre
le drapeau de câblage honnête, branche par branche.

---

## 1. Les chiffres, mesurés

| Grandeur | Avant (`origin/main`) | Après | Écart |
|---|---|---|---|
| `npm run check` | **658 pass / 0 fail** | **667 pass / 0 fail** | **+9 tests** |
| `dist/index.html` | 1 259 092 o | **1 260 325 o** | **+1 233 o** |
| Marge sous la borne T10 (1 300 000) | 40 908 o · 3,1 % | **39 675 o · 3,05 %** | −1 233 o |
| `node tools/audit-maquette.mjs` | ROUGE, 7 écarts, rc=1 | ROUGE, **7 écarts**, rc=1 | **aucun** |
| `SAVE_VERSION` | 14 | 14 | inchangé |

⚠ **LE PLAFOND DE 3 000 OCTETS EST TENU, ET LARGEMENT** : +1 233, soit 41 % de
l'enveloppe. Ce lot est du code pur — aucune image, aucun écran neuf, aucune
feuille de style touchée.

⚠ **LA LIGNE DE BASE A ÉTÉ MESURÉE, PAS RECOPIÉE DU BRIEF, ET ELLE A FAILLI
ÊTRE FAUSSE.** La référence `main` du clone local pointait sur **b16f0b2**
(PR #42), c'est-à-dire AVANT la fusion de RECHERCHE ; la vraie base est
**6cce620** (PR #43), qu'il a fallu aller chercher par `git fetch`. Le premier
audit « avant » a donc été joué sur le mauvais arbre. Refait sur `origin/main` :
`git archive origin/main` reconstruit dans un dossier neuf, `node tools/build.js`
y rend **1 259 092 octets** exactement, et l'audit y rend **les sept mêmes
écarts**. Les deux nombres du tableau ci-dessus sont donc constatés, pas repris.

⚠ **`tools/verifier.py` N'A PAS ÉTÉ LANCÉ**, et c'était la consigne : ce lot ne
touche ni `art/`, ni `tools/*.py`. Son dernier verdict connu reste celui de
FINITIONS.

---

## 2. L'audit maquette, écart par écart

Les sept écarts sont **byte-identiques** avant et après. `diff` des lignes `KO`
entre `origin/main` et la branche : **vide**.

| # | Écart | Avant | Après |
|---|---|---|---|
| 1 | `terrain identique à champsDeLaBase(275, 16)` | KO | KO |
| 2 | `disposition légale` | KO | KO |
| 3 | `emplacements 11 / 12` | KO | KO |
| 4 | `débit quartz : +732/h` | KO | KO |
| 5 | `débit scorie : +0/h` | KO | KO |
| 6 | `débit electricite : +684/h` | KO | KO |
| 7 | `raffinerie : +176 quartz +352 scorie / h` | KO | KO |

Aucun n'est de ce lot : ils portent tous sur le terrain de la maquette, sa
disposition et ses débits — MODULES-A ne touche ni `data/`, ni les bâtiments, ni
l'économie. **Ni en plus, ni en moins.**

---

## 3. Ce qui a changé, et pourquoi

### 3.1 `src/data/modules.js` — le drapeau devient une paire

`cable: false` devient `cable: { offense: false, defense: false }` sur les
quatorze lignes ; `moduleEstCable(nom)` devient `moduleEstCable(nom, branche)`
et **lève** sur une branche inconnue comme sur un module inconnu.

⚠ **LE DRAPEAU GLOBAL MENTAIT PAR CONSTRUCTION.** Les trois modules câblés le
sont tous en **offense** et aucun en **défense**, parce que `moduleActif` ne lit
`p.module` que du côté qui attaque : le module d'un ouvrage posé en défense
n'est jamais consulté par le moteur. Sous un drapeau unique, la ligne défense
des Grenadiers aurait vendu 200 000 000 de points un Tir de barrage qui n'aurait
jamais tiré. C'est exactement le vol que le code `effetNonCable` existe pour
empêcher — il était sur le point de le commettre lui-même.

`ecraseur`, `tirDeBarrage` et `booster` portent `{ offense: true, defense: false }`,
chacun avec la raison écrite au-dessus.

### 3.2 `src/sim/recherche.js` — le refus dit LAQUELLE des deux

```js
const MOT_DE_LA_BRANCHE = { offense: 'offense', defense: 'défense' };
```

`effetNonCable` écrit désormais deux messages différents :

- **« Tir de barrage n'a pas d'effet en défense »** quand l'autre branche est
  câblée — un fait définitif ;
- **« Flashbang n'a pas encore d'effet en jeu »** quand aucune ne l'est — une
  attente.

Les confondre ferait patienter le joueur devant une case qui ne s'ouvrira
jamais.

⚠ **UN DÉFAUT VISIBLE PAR LE JOUEUR A ÉTÉ TROUVÉ ET CORRIGÉ EN COURS DE ROUTE.**
La première version interpolait `branche` directement : elle imprimait
**« n'a pas d'effet en defense »**, sans accent, parce que `branche` est une
CLÉ. Le mot affiché vient donc d'une table, jamais de la clé. C'est visible à
l'écran, et le banc navigateur du §7 le confirme accentué.

### 3.3 `src/sim/combat.js` — Tir de barrage

30 % des dégâts sur les structures adverses **voisines de la cible**, rayon 1 en
Tchebychev, genres `defense` et `batiment`, **cible exclue**.

⚠ **`distanceTchebychev` DE `sim/points-attaque.js` N'EST PAS IMPORTÉE**, comme
le brief l'interdit : elle prend des cases entières et traînerait `clock.js` et
`niveau-de-base.js` dans `combat.js`, qui ne dépend que de `grille.js`. La
distance est recalculée sur place, en `caseDepuisMilli` pour la rangée et en
colonne entière — **deux unités différentes, et c'est le piège du fichier** :
`rangeeMilli` est en milli-cases, `colonne` en cases.

⚠ **LES ÉCLABOUSSURES PARTENT DANS LE MÊME TAMPON QUE LE TIR PRINCIPAL**, à
l'étape 4 : elles sont donc simultanées comme tout le reste, et un défenseur tué
au même tick riposte quand même. Les appliquer après `appliquerDegats` casserait
la simultanéité normative des neuf étapes.

⚠ **AUCUNE RÉSERVE N'EST CONSOMMÉE POUR ELLES.** L'étape 8 compte les tirs, pas
les impacts ; facturer les voisins ferait payer deux fois le même coup.

### 3.4 `src/sim/combat.js` — Booster

Vitesse ×10 pendant 30 ticks, **une seule fois par raid**, déclenché à la
première blessure.

⚠ **LE DÉCLENCHEUR EST À L'ÉTAPE 6 bis, APRÈS LE RETRAIT DES MORTS.** Lu avant
`appliquerDegats`, il raterait la blessure du tick même et le module se
déclencherait toujours avec un tick de retard — mesurable, et faux.

⚠ **LE TICK DE LA BLESSURE COMPTE : la fenêtre est N..N+29, pas N+1..N+30.**
C'est un **écart au brief**, assumé et justifié au §8.

⚠ **`modulesActifs` EST LA MÉMOIRE, `effetsTemporises` LA FENÊTRE.** Le marqueur
n'est jamais retiré — c'est lui qui interdit la seconde poussée ; l'effet, lui,
expire à l'étape 1. Confondre les deux rendrait le module rejouable à chaque
blessure.

⚠ **LE ×10 S'APPLIQUE APRÈS LA RÉDUCTION D'OBSTACLE**, jamais avant :
60 → 24 sous obstacle → **240** boosté. L'inverse rendrait l'obstacle inopérant
sous boost. Et le pas reste borné par l'invariant des 1 000 milli-cases de
`peutAvancer` — vérifié par un test dédié (T6), sur tous les porteurs.

### 3.5 Ce que le lot n'a PAS fait

`moduleActif` n'a pas été « généralisé » au passage — le brief l'interdit, et
ses trois conditions sont inchangées. Aucun champ de sauvegarde n'a bougé :
`modulesActifs` et `effetsTemporises` existent dans l'état **depuis le lot 2A**,
ce lot est le premier à les employer.

---

## 4. Les tests ajoutés — et le montage qui les ferait tomber

**+9 tests**, tous dans `test/recherche.test.js` (658 → 667). Chacun a été
falsifié : le sabotage a été appliqué à `src/sim/combat.js`, la suite relancée,
puis le fichier restauré depuis `/tmp/combat.orig.js`. **Aucun test ne se
contente d'asserter le champ que le patch vient d'écrire.**

| Test | Ce qu'il prouve | Le montage qui le fait tomber — **mesuré** |
|---|---|---|
| **T9** — `cable` est par branche | La table porte les deux clés sur les 14 modules ; la fonction lève sur un nom inconnu, une branche inconnue, `toString` et `undefined` ; la liste câblée vaut `['booster','ecraseur','tirDeBarrage']`, **zéro en défense** | Remettre un drapeau global : la lecture par branche rend `undefined`, l'égalité de liste tombe |
| **T10** — l'achat suit le drapeau | Offense achète, défense refuse avec **« n'a pas d'effet en défense »** ; le Flashbang garde **« n'a pas encore d'effet en jeu »** | **G** — retirer le contrôle `moduleEstCable` de `problemesDeLAchat` : la ligne défense devient achetable |
| **T1** — le barrage frappe les voisines | Rayon 1 autour de la **cible**, cible exclue | **B** — passer le rayon à 2 : une structure à deux cases encaisse. **F** — ne pas exclure la cible : elle prend 130 % |
| **T2** — la colonne est recalculée | Le barrage lit la colonne de chaque voisine, il ne reverse pas celle de la cible ; et il ne touche **que** les genres `defense`/`batiment` | **A** — lecture naïve de la colonne de la cible. **E** — retirer le filtre de genre : l'escouade ennemie adjacente encaisse |
| **T3** — le barrage est gratuit en munitions | La réserve consommée est celle des tirs, pas des impacts | **C** — facturer chaque éclaboussure : la réserve tombe plus vite |
| **T4** — en défense, rien à frapper | Un Grenadier **en défense** porteur du module ne fait aucune éclaboussure, et un Merlon **allié** adjacent à sa cible reste intact | **D** — retirer le filtre de camp : le Merlon allié encaisse |
| **T5** — une fois, 30 ticks, sans retour | Blessure au tick 18 → boosté 18 à 47 **inclus**, soit exactement 30 (mesuré ; le test asserte la RELATION, pas le nombre) ; deltas 60 / 600 / 240 / 24 ; re-blessé après la fenêtre, aucune seconde poussée | **H** — ×10 avant l'obstacle : le delta sous obstacle passe à 60. **I** — fenêtre de 31 ticks. **J** — ne jamais poser le marqueur : le module se redéclenche. **K** — déclencher avant `appliquerDegats` : la blessure du tick même est ratée |
| **T6** — l'invariant des 1 000 milli tient | Aucun porteur boosté ne franchit 1 000 milli-cases en un tick | Retirer la borne de `peutAvancer` |
| **T8** — le déterminisme tient | `serialiserEtat` de deux parties identiques, Booster actif, reste égal | Introduire un `Math.random`, un `Set` non trié ou un flottant dans l'effet |

⚠ **DEUX TROUS DE COUVERTURE RÉELS ONT ÉTÉ TROUVÉS PAR CETTE MATRICE, ET
COMBLÉS.** Les sabotages **D** (retrait du filtre de camp) et **E** (retrait du
filtre de genre) ne faisaient tomber **aucun test** dans la première version :
les montages ne contenaient ni structure alliée adjacente, ni unité ennemie
adjacente. T4 a reçu un Merlon allié, T2 une seconde escouade. Les deux
sabotages font tomber la suite depuis. Un test qui passe sur du code saboté ne
prouve rien, et deux des neuf étaient dans ce cas.

---

## 5. Les quatre assertions réécrites de `test/combat.test.js`

Le brief les nomme lignes 977-983 et exige qu'elles soient **réécrites, pas
supprimées**. Sur `origin/main` :

```js
test('§11 — l\'état porte dès 2A les champs que le lot 2C remplira', () => {
  const etat = creerCombat(montageRiche());
  for (const e of etat.entites) {
    assert.deepEqual(e.modulesActifs, [], `${e.id} : modulesActifs doit exister et rester vide`);
    assert.deepEqual(e.effetsTemporises, [], `${e.id} : effetsTemporises doit exister et rester vide`);
  }
  jouer(etat, 200);
  for (const e of etat.entites) {
    assert.deepEqual(e.modulesActifs, [], 'les modules restent inertes en 2A');
    assert.deepEqual(e.effetsTemporises, [], 'les effets temporisés restent inertes en 2A');
  }
});
```

**Pourquoi elles ne tenaient plus.** Les quatre exigeaient que ces deux champs
restent **vides pour toute entité, avant et après 200 ticks** — « les modules
restent inertes en 2A ». Le Booster est le premier module à les employer : la
troisième et la quatrième deviennent fausses dès qu'un porteur est blessé.

**Ce qui les remplace** (`test/combat.test.js`, test renommé
`'§11 — modulesActifs et effetsTemporises ne se remplissent QUE sous module
câblé'`) — l'intention est **séparée en deux**, et la borne en ressort **plus
forte, pas plus faible** :

1. Les deux premières assertions sont **gardées telles quelles** : les champs
   existent et **partent** vides à la création.
2. Les deux suivantes sont **conditionnées** : après 200 ticks de
   `montageRiche` — qui ne débloque **aucun** module côté joueur, l'Ouvrage n'y
   ayant que `pvPlusVingt` et `munitionSpeciale`, tous deux non câblés — elles
   doivent encore être vides. C'est l'assertion d'origine, restreinte au cas où
   elle est encore vraie.
3. **Un contre-cas est ajouté**, sans lequel la moitié haute passerait sur un
   moteur qui n'écrirait JAMAIS dans ces deux champs : un Cuirassier à Booster
   blessé au passage d'une Ronce. On y asserte `modulesActifs === ['booster']`,
   **un seul** effet, et `Object.keys(effet).sort() === ['finTick', 'nom']` avec
   `nom` chaîne et `finTick` entier — la contrainte de `serialiserEtat`. Les
   autres entités de la même partie restent vides.

Le montage qui fait tomber la nouvelle version : **J** (ne jamais poser le
marqueur) casse le contre-cas ; ajouter une écriture parasite dans
`modulesActifs` casse la moitié haute. La version d'origine ne détectait ni
l'un ni l'autre — elle acceptait un moteur totalement inerte.

---

## 6. Le raid, avec et sans module — chiffré

Huit graines (2026, 7, 42, 99, 314, 555, 1000, 1789), même armée : **6
Grenadiers + 6 Cuirassiers** contre le premier camp. Butin brut du combat, avant
écrêtage par le stockage.

| graine | rien | barrage | booster | les deux |
|---|---|---|---|---|
| 2026 | 460t 5400b 17554p 6/8 bât | 432t 5400b 17554p 6/8 | 460t 5400b 17554p 6/8 | 432t 5400b 17554p 6/8 |
| 7 | 437t 5400b 15332p 5/8 | 415t 5400b 15332p 5/8 | 437t 5400b 14898p 5/8 | 415t 5400b 14898p 5/8 |
| 42 | 571t 3893b 23948p 4/8 | 500t **5400b** 25406p **6/8** | 571t 3893b 23948p 4/8 | 500t 5400b 24945p 6/8 |
| 99 | 360t 2206b 10871p 2/8 | 535t **3832b** 10449p **3/8** | 360t 2206b 10871p 2/8 | 535t 3832b 9992p 3/8 |
| 314 | 402t 3065b 16095p 3/8 | 535t **4028b** 15844p **5/8** | 402t 3158b 15030p 3/8 | 535t 4121b 14779p 5/8 |
| 555 | 520t 3457b 22776p 3/8 | 513t **4334b** 22776p **5/8** | 520t 3328b 22329p 3/8 | 513t 4206b 21771p 5/8 |
| 1000 | 374t 2698b 23671p 2/8 | 356t **3621b** 23802p 2/8 | 374t 2698b 23671p 2/8 | 352t 3621b 23802p 2/8 |
| 1789 | 545t 3069b 19249p 2/8 | 555t **3918b** 20024p **5/8** | 545t 2957b 17871p 2/8 | 555t 3906b 18593p 5/8 |

**Médianes sur les huit graines :**

| | butin | points | ticks | bâtiments détruits |
|---|---|---|---|---|
| rien | 3 263 | 18 401,5 | 448,5 | **27 / 64** |
| **barrage** | **4 181** (+28,1 %) | 18 789 (+2,1 %) | 506,5 | **37 / 64** |
| booster | 3 243 (−0,6 %) | 17 712,5 (**−3,7 %**) | 448,5 | 27 / 64 |
| les deux | 4 163,5 | 18 073,5 | 506,5 | 37 / 64 |

⚠ **LE TIR DE BARRAGE FAIT CE QU'IL PROMET** : +28,1 % de butin médian, et dix
bâtiments de plus tombent sur les soixante-quatre. Sur la graine 1789, les
bâtiments restés debout passent de **6 à 3**.

⚠ **LE BOOSTER FONCTIONNE ET IL EST MAUVAIS, ET LES DEUX SONT MESURÉS.** Il se
déclenche à **chaque** raid — 3 à 5 Cuirassiers sur 6 selon la graine — et
`ticksSousBoost === boostés × 30` est vrai sur les huit. Ce n'est donc pas
« il ne s'est rien passé » : il fait courir l'unité blessée droit sur la
défense, et rend **−3,7 % de points médians**. Sur quatre graines il ne change
rien du tout parce qu'aucune unité boostée n'atteint une cible différente avant
de mourir.

**Un module câblé n'est pas un module rentable.** Le brief demande de le
câbler, pas de l'équilibrer ; le dire est le travail de ce rapport, pas du code.
La valeur `BOOSTER_FACTEUR = 10` et la fenêtre `BOOSTER_TICKS = 30` viennent du
brief. Si Ethan veut que le Booster serve, c'est le barème qu'il faut rouvrir,
pas le câblage.

---

## 7. L'écran Recherche — rendu ET cliqué

Chromium 1194, `dist/index.html` servi en local, **360 × 740, dpr 2, tactile**,
sauvegarde forgée injectée sous `foyer-zero/partie/1` puis `setItem` neutralisé
pour que la partie ne s'écrase pas au rechargement.

**Les quatre lignes qui s'ouvrent s'achètent**, en deux touchers, au prix exact :

| ligne | avant | 1ᵉʳ toucher | 2ᵉ toucher | débit constaté |
|---|---|---|---|---|
| Tir de barrage #0 (offense) | `24 000 000`, actif | **`Confirmer ?`** | **`Acquis`**, désactivé | **24 000 000** |
| Booster #0 (offense) | `10 000 000`, actif | `Confirmer ?` | `Acquis` | **10 000 000** |
| Booster #1 (offense) | `200 000 000`, actif | `Confirmer ?` | `Acquis` | **200 000 000** |
| Tir de barrage #1 (offense) | `1 000 000 000`, actif | `Confirmer ?` | `Acquis` | **1 000 000 000** |

**La ligne défense des Grenadiers refuse, avec sa mention :** bouton
`200 000 000` **`disabled`**, mention posée sous la ligne —
**« Tir de barrage n'a pas d'effet en défense »**, accent compris. Deux touchers
dessus : le libellé ne bouge pas, la mention non plus, et **le compteur de
points est inchangé** (assertion explicite du banc).

⚠ **UN PIÈGE DE BANC A ÉTÉ PAYÉ, ET IL FAISAIT MENTIR LA MESURE.** La première
version capturait le nœud de la ligne AVANT l'achat, puis le relisait après :
`peindre` **reconstruit le DOM**, si bien que le handle pointait sur un élément
détaché — il affichait encore le prix et `disabled: false` alors que les points
avaient bien été débités. Le banc relit désormais la ligne **vive** avant chaque
geste. Sans cette correction, le rapport aurait conclu à un défaut d'écran qui
n'existe pas.

Erreurs console : **une**, `GET /favicon.ico → 404`, émise par le serveur
statique du banc. Ce n'est pas une erreur du jeu — tracée à l'URL près, elle
n'existe pas dans le livrable. **Aucune `pageerror`.**

Captures : `/tmp/banc/offense.png` (rendu) et `/tmp/banc/achat.png` (après les
quatre achats). ⚠ **Aucun appareil réel n'a été joint** — c'est un Chromium
headless au gabarit du téléphone, pas la WebView Android.

---

## 8. Écarts au brief, et leur raison

1. **La fenêtre du Booster est N..N+29, pas N+1..N+30.** Le §4.2 du brief écrit
   « ×10 des ticks N+1 à N+30 » — mais sa propre justification, deux lignes plus
   bas, dit que le déclencheur est lu **après** `appliquerDegats` précisément
   pour ne pas rater la blessure du tick même. Les deux sont incompatibles : si
   le tick de la blessure ne comptait pas, poser le déclencheur à l'étape 6 bis
   n'aurait aucun intérêt. La justification l'emporte sur le nombre. Durée
   **exactement 30 ticks** dans les deux lectures ; seule l'origine diffère.
   Mesuré : blessure au tick 18, boosté de 18 à 47 inclus.

2. **La démonstration de T2 n'emploie pas l'exemple du brief.** Il propose un
   porteur anti-véhicule pour creuser l'écart entre deux voisines ; **aucun
   porteur de `tirDeBarrage` n'est anti-véhicule** — les Perceurs et le Pilon
   sont anti-structure. Le test oppose donc des Perceurs à une escouade, un mur
   sur la case voisine : la lecture **naïve** de la colonne rendrait
   `floor(5 000 × 30 / 100)` = **1 500 milli-PV** sur le mur, la lecture juste
   `floor(25 000 × 30 / 100)` = **7 500**. Un écart de ×5 — assez large pour que
   le sabotage **A** tombe, sans emprunter l'exemple du brief.

3. **« Une structure amie » n'est pas constructible pour un attaquant.**
   `creerCombat` range tous les défenseurs et bâtiments dans le camp `defense` :
   un porteur du camp `attaque` n'a aucune structure alliée sur la grille. Le
   filtre de camp est donc démontré par T4, du côté défense, où un Merlon allié
   existe réellement. Le cas est documenté dans T1 plutôt que simulé de force.

4. **`test/recherche.test.js` accueille les neuf tests, pas
   `test/combat.test.js`.** Le brief ne dit pas où les mettre ; ils rejoignent
   les tests `T12`/`T13` de l'Écraseur, qui sont déjà là et qui mesurent la même
   chose — un module câblé vu depuis le moteur. `test/combat.test.js` ne bouge
   que pour la réécriture du §11.

---

## 9. Ce qui reste ouvert

**Onze modules sur quatorze ne sont toujours pas câblés**, et le refus
`effetNonCable` continue de les protéger. Ils se rangent en trois familles, et
la famille dit ce que coûtera le câblage :

**Cinq offensifs — ils demandent de toucher au ciblage ou à la structure du
combat**, ce que ce lot s'interdisait :

| module | ce qu'il faudra ouvrir |
|---|---|
| `flashbang` | une entité doit pouvoir être **empêchée de tirer** — un état neuf lu à l'étape 4 |
| `emp` | idem, sur les défenses seulement, avec une portée propre |
| `camouflage` | le **ciblage** (étape 3) doit pouvoir ignorer une entité |
| `bouclier` | `appliquerDegats` doit absorber avant de retrancher |
| `garnison` | des entités **apparaissent en cours de combat**, hors `apparitionDeVague` |

**Quatre purement défensifs — ils n'ont aucun lecteur aujourd'hui** parce que
`moduleActif` ne consulte `p.module` que du côté qui attaque. Les câbler
suppose d'abord de **décider comment un ouvrage porte son module** :
`autoReparation`, `rayonMiniMoinsUn`, `pvPlusVingt`, `rayonPlusUn`.

**Deux que seul `moduleOuvrage` porte** — ils n'existent sur aucune pièce du
joueur : `munitionSpeciale`, `volDeVie`.

⚠ **ET LE DRAPEAU EST DÉSORMAIS PRÊT POUR ÇA.** `cable: { offense, defense }`
permet de câbler un module d'un seul côté ; c'est ce qui manquait pour que les
quatre défensifs puissent s'ouvrir sans mentir en offense.

**Hors périmètre, non touché :** l'audit maquette et ses sept écarts, le barème
du Booster (mesuré perdant, cf. §6), `SAVE_VERSION`, `art/`, `tools/*.py`.
