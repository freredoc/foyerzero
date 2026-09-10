# RAPPORT — lot ARRIVÉE-CARTE-ET-BUILD

**Version produite : 0.99.40 · build 142.** Base de départ : `main` = `d68c4d1`
(PR #127 fusionnée), **rebâtie et remesurée dans un `git worktree` avant
d'écrire une ligne** — 1 550 tests déclarés (1 549 pass · 0 fail · 1 skipped),
`dist/index.html` **9 425 421 octets**, 0.99.39 · build 141. La base annoncée par
le brief était donc exacte, ce qui n'arrive pas si souvent qu'il faille le taire.

---

## 0. Le fait à dire en premier

⚠⚠ **APRÈS LE §1, L'ÉCRAN DE LA BASE EST ENTIÈREMENT SILENCIEUX.** Le lot
SON-VOLUMES avait fait taire la carte ; celui-ci fait taire la base. Mesuré, pas
déduit : `bouclesDesirees` rend l'ensemble **VIDE** sur `chantier`, `offense`,
`mission`, `recherche`, `monde`, `options` et `transfert` — quelle que soit la
disposition, Caserne, Dépôt de véhicules, Aérodrome et Centrale posés compris —
et ne rend quelque chose que sur `raid` : `['ambience_battlefield_distant_loop']`.
**Il ne reste qu'UNE boucle atteignable dans tout le jeu, et elle est dans le
combat.**

---

## 1. Résultat des commandes

| Commande | Verdict |
|---|---|
| `npm ci` | ok |
| `npm test` | **1558 déclarés · 1557 pass · 0 fail · 1 skipped** |
| `npm run check` | **sortie 0** |
| `npm run build` | `dist/index.html`, **9 331 195 octets**, 0 référence externe |

⚠ Le skipped est `LIMITE T8`, suspendu par Ethan le 08/09. Il était déjà là au
départ ; ce lot ne l'a pas touché.

⚠⚠ **ET LA RÉFÉRENCE QUE LE LOT ÉCRANS AVAIT ÉCRITE ÉTAIT EXACTE, CE QUI EST
RARE ET MÉRITE D'ÊTRE DIT.** Son §0 annonçait « 1550, qui est le compte mesuré de
l'arbre fusionné » en refermant la garde du compte de tests, qu'il avait trouvée
ROUGE ; **mesuré ici sur le worktree pristine de `d68c4d1`, c'est exactement 1 550
et la suite est VERTE**. La base de ce lot-ci n'a donc rien eu à réparer.

⚠ **Le compte passe de 1 550 à 1 558, soit +8, et ce sont EXACTEMENT les huit
`AC T1`…`AC T8`** — mesuré des deux côtés, pas déduit du diff. Les trois
falsifications muettes du §7 n'ont pas fait entrer de test : elles ont fait
RESSERRER celui qui les laissait passer, et corriger le code dans un cas.

⚠ **Les assertions passent de 10 010 à 10 132, soit +122.** **Aucune n'a été
retirée, aucune n'a été assouplie** — vérifié en comptant les
`assert.<méthode>(` de `test/*.test.js` des deux côtés.

---

## 2. `dist/index.html` — ventilation poste par poste

Mesurée contre un livrable **rebâti dans un `git worktree` sur l'arbre pristine
de `main` = `d68c4d1`**, jamais contre un nombre recopié.

| Poste | Avant | Après | Écart |
|---|---:|---:|---:|
| **feuille** | 142 308 | 44 947 | **−97 361** |
| **JavaScript** | 402 212 | 404 947 | **+2 735** |
| **balisage** | 42 237 | 42 637 | **+400** |
| **images** | 7 651 104 | 7 651 104 | **0** |
| **audio** | 1 187 560 | 1 187 560 | **0** |
| **total** | **9 425 421** | **9 331 195** | **−94 226** |

⚠⚠ **LA SOMME DES CINQ POSTES TOMBE EXACTEMENT SUR LE TOTAL DES DEUX CÔTÉS**, et
c'est ce qui dit qu'aucune ressource n'est entrée par une porte qu'on n'a pas
regardée. **306 URI de part et d'autre** — 263 `data:audio/ogg`, 41
`data:image/webp`, 2 `data:image/png` —, et les LIGNES `data:` passent de **311 à
307**. ⚠ Les quatre qui partent ne sont pas des ressources : ce sont des
COMMENTAIRES de feuille qui NOMMAIENT `data:` sans en porter un. Le compte
d'URI, lui, ne bouge pas d'une unité, et c'est celui-là qui dit qu'aucune image
n'est entrée ni sortie.

⚠⚠ **LE GAIN DU §6 EST ISOLÉ ET IL EST LE LOT ENTIER : −97 361 OCTETS DE
FEUILLE.** La feuille passe de 142 308 à 44 947 octets, soit **68,4 % de son
poids**. C'est le rapport que le brief soupçonnait sans le chiffrer, et il est
plus élevé qu'annoncé : cette feuille porte plus de prose que de règles, parce
que chaque arbitrage y a laissé son paragraphe. **Rien de cette prose n'est
perdu** — elle reste dans `src/index.src.html`, qui est la source ; ce qui part
est sa copie dans le livrable, que personne ne lit.

⚠ **CE QUE LE LOT COÛTE VRAIMENT, HORS §6, EST +3 135 OCTETS** — JavaScript
+2 735 (la mini-carte, l'arrivée dérivée, le pop-up), balisage +400 (le panneau
de la mini-carte et son bouton). **Les images et l'audio ne bougent pas d'un
octet** : le lot ne fait entrer aucune ressource, et `src/data/sons.js` est
régénéré sans qu'un `.opus` change.

**Borne T10 inchangée à 9 600 000, marge 268 805 octets, 2,80 %.** ⚠ Elle ne
BAISSE pas parce qu'un lot rend : « baisser une borne pour faire passer un lot :
jamais » se lit dans les deux sens, et une borne relevée au lot ART-90 pour de
l'art qui est toujours là n'a aucune raison de redescendre.

---

## 3. §7 — les ancres appliquées, avec leur compte

Toutes **RE-EXTRAITES du dépôt**, jamais retapées depuis le brief.

| Ancre | Fichier | Occurrences attendues | Trouvées |
|---|---|---:|---:|
| `BORNE = 9_600_000` | `test/pictogramme.test.js` | 1 | **1** |
| `assert.ok(MARGE >= 150_000, …)` | `test/pictogramme.test.js` | 1 | **1** |
| `MESURE = …` | `test/pictogramme.test.js` | 1 | **1** |
| `assert.equal(MARGE, …)` | `test/pictogramme.test.js` | 1 | **1** |
| titre de `PIC T7` | `test/pictogramme.test.js` | 1 | **1** |
| compte de `pixelated` | `test/chantier.test.js` | 1 | **1** |

**`PIC T7` porte désormais le chiffre définitif** :

```js
const BORNE = 9_600_000;      // T10 de `banc.test.js`, relevée au lot ART-90
const MESURE = 9_331_195;     // mesuré le 10/09, lot ARRIVÉE-CARTE-ET-BUILD, base `d68c4d1`
const MARGE = BORNE - MESURE; // 268 805 octets
assert.equal(MARGE, 268_805);
assert.equal(Math.round((MARGE / BORNE) * 10_000) / 100, 2.8);
```

⚠ **`BORNE` N'A PAS BOUGÉ ET `assert.ok(MARGE >= 150_000, …)` N'A PAS ÉTÉ
TOUCHÉE D'UN CARACTÈRE** — le brief l'exige, et le lot rend des octets plutôt
qu'il n'en prend, donc la question ne se posait pas.

⚠ **LE COMMENTAIRE CUMULATIF EST AJOUTÉ, PAS ÉCRASÉ.** La ligne du lot ART-90
reste ; celle de ce lot-ci s'écrit en dessous, avec son sens — c'est le PREMIER
lot de la série qui fait DESCENDRE le livrable, et le dire est ce qui empêchera
de lire la marge de 2,80 % comme un resserrement.

⚠ **`image-rendering: pixelated` passe de 8 à 9 sites**, et le neuvième est
`#monde-mini-canvas` : une mini-carte de 1 080 px affichée dans 360 px CSS est
RÉDUITE, et sans cette ligne le navigateur la lisserait — les marqueurs d'un
pixel disparaîtraient. Le compte est mis à jour avec sa note cumulative, jamais
remplacé.

---

## 4. Le verdict de chaque `AC T*`, avec son montage effectif

| Test | Fichier | Verdict | Montage |
|---|---|---|---|
| **AC T1** | `son.test.js` | **ok** | `bouclesDesirees` sur les SEPT écrans, avec une disposition portant Caserne, Dépôt, Aérodrome et Centrale — les quatre bâtiments qui bouclaient. Ensemble vide sur six, `['ambience_battlefield_distant_loop']` sur `raid`. Plus : la table `BOUCLES_DE_BATIMENT` est **vide et PRÉSENTE** (`hasOwnProperty`, jamais `=== undefined`), et un témoin de non-vacuité prouve que le montage porte bien les quatre bâtiments. |
| **AC T2** | `rendu.test.js` | **ok** | Balayage de TOUS les sprites d'un vrai déroulé à SEPT instants — 0, 100, 400, 833, 1 000, 1 667 et 3 000 ms après la naissance : **aucun `alpha` autre que `OPACITE_PLEINE`**. Plus un balayage de source, **DÉCOMMENTÉE**, sur `render/arrivee.js` et `render/scene.js` : aucun `OPACITE_ARRIVEE`, aucun 350. |
| **AC T3** | `rendu.test.js` | **ok** | `dureeDArrivee` confrontée aux quatorze unités du roster : la durée attendue est **recalculée** `Math.round((MILLI_PAR_CASE × TICK_MS) / vitesse)`, jamais recopiée. Discrimination : `duree(la plus lente) === 2 × duree(la plus vive) + 1`. Plus cinq levées — `{id:'inconnu'}`, `{id:null}`, `{}`, `null`, `undefined` — toutes `RangeError`. |
| **AC T4** | `rendu.test.js` | **ok** | La rampe tombe **exactement à zéro** à l'échéance, pour les quatre vitesses du roster ; à `duree + 1` ms elle rend `null` ; à `duree − 1` elle rend un décalage strictement positif ; un instant ANTÉRIEUR au stamp rend une case pleine et ne lève pas. |
| **AC T5** | `monde.test.js` | **ok** | Le pop-up d'ACQUISITION monté sur une vraie partie : trois POI pris, le titre du pop-up nomme **les trois et rien d'autre** ; le bouton `#monde-poi` sur le MÊME état en rend **soixante-dix**. La sélection est construite **à l'envers** pour que la garde d'ordre morde (voir §7, F5). |
| **AC T6** | `monde.test.js` | **ok** | `marqueursDeLaMiniCarte` sur une vraie graine : les quatre coins de la carte tombent aux quatre coins du canevas, une case fait 35 × 6 px, **tout marqueur tient dans le cadre**, l'ordre de dessin est `['ouvrage','poi','base']`, les rapports de hauteur sont gardés (poi > ouvrage, base > poi), les rasées sont filtrées, les dix bandes pavent 1 920 px **sans trou ni recouvrement**, et `basculeDuSol()` rend `{selonLesTons: 6, selonLeSol: 6}`. Plus : **`src/render/mini-carte.js` ne porte AUCUN hexadécimal** — `assert.equal(source.match(/#[0-9A-Fa-f]{6}/g), null)`. |
| **AC T7** | `chantier.test.js` | **ok** | Les six libellés lus dans le HTML PRODUIT : `['Base','Journal','Mission','Recherche','Monde','Options']`, chacun `/^[A-Za-zÀ-ÿ]+$/` — donc **aucun glyphe** —, aucun `aria-label` sur la barre, `AVANCE_MAX_PX = 8.5`, `BORDURES_PX = 6`, **39 caractères** pour un plafond calculé de **41**. |
| **AC T8** | `chantier.test.js` | **ok** | Le livrable porte **zéro `/*` et zéro `<!--`** ; **306 URI**, chacune de longueur base64 valide et d'en-tête de format connu ; la ventilation `{ ogg: 263, webp: 41, png: 2 }` ; 307 lignes `data:` ; et `tools/build.js` porte bien `verifierLeScanner`. |

---

## 5. §2 — la durée d'arrivée, mesurée aux deux vitesses extrêmes

La durée n'est plus décrétée : c'est **exactement le temps que l'unité met à
franchir une case à son propre pas**, `round(MILLI_PAR_CASE × TICK_MS / vitesse)`.

| Vitesse | Unités concernées | Durée mesurée |
|---:|---:|---:|
| **60** — la plus lente | 6 | **1 667 ms** |
| 90 | 2 | 1 111 ms |
| 120 | 5 | 833 ms |
| **240** — la plus vive (Frappeur) | 1 | **417 ms** |

⚠⚠ **LE BRIEF SE TROMPAIT SUR LA BORNE BASSE, ET IL FAUT LE DIRE DANS CE
SENS-LÀ.** Il annonce « 833 ms au plus rapide » : mesuré, la plus rapide du
roster est le **Frappeur à 240**, donc **417 ms**. 833 est la durée de la
troisième vitesse sur quatre, pas de la première.

⚠ **LA DURÉE EST CONTRACTÉE À LA NAISSANCE ET FIGÉE.** `noterLesArrivees` range
`{ ms, dureeMs }`, et `etatDeLArrivee` ne reçoit qu'un indice : la relire à
chaque image ferait s'étirer l'arrivée sous les yeux du joueur le jour où une
unité ralentit sous un obstacle — `vitesseObstacleMilli` existe. C'est le motif
exact de `dernierDeplacementDelaiTicks` au lot RÈGLES-DE-CARTE.

⚠⚠ **ET LA VITESSE SE LIT DANS `UNITES`, PAS SUR L'ENTITÉ — LE BRIEF SE
TROMPAIT UNE SECONDE FOIS.** Il posait « `vitesseMilli` EST SUR L'ENTITÉ ; le
lire, ne pas le recalculer depuis `UNITES` ». **Mesuré : le littéral d'entité de
`ajouterEntite` ne porte pas ce champ** — la vitesse vit sur le PROFIL, partagé
par toutes les pièces d'un identifiant, et `profil` n'est pas exporté. La
première écriture a levé sur **sept tests de `raid-ecran.test.js`**, avec
« vitesseMilli « undefined » », sur de VRAIS montages passés par `creerCombat`.
Et ce n'est pas une seconde écriture pour autant : `profilUnite` fait
`entierDeDonnees(u.vitesse, …)`, donc `UNITES[id].vitesse` **EST** la source dont
le profil dérive.

⚠ **PLUS DE FANTÔME.** Ethan, 10/09 : « Ne pas faire de fantôme. » Le second
champ de `etatDeLArrivee` valait `OPACITE_ARRIVEE` (350 ‰) et montait à 1 000 ;
il n'existe plus. `OPACITE_PLEINE` et le champ `alpha` de `sprite()` RESTENT —
le champ est générique, `SB T6` garde la restauration de `globalAlpha`, et
retirer la plomberie parce que son premier client s'en va obligerait le suivant
à la réécrire.

---

## 6. §5 — la taille de police retenue, et son calcul

**11 px. Elle ne bouge pas.** Le brief prédisait que six mots ne tiendraient pas
dans 360 px CSS et qu'il faudrait baisser les six.

**Relevé dans Chromium, géométrie du S25 FE, police réelle « Roboto Condensed »,
`letter-spacing: 0.06em`, `text-transform: uppercase` :**

```
BASE      31,66
JOURNAL   54,11
MISSION   51,45
RECHERCHE 73,44
MONDE     45,11
OPTIONS   53,75
          ------
          309,52 px de texte
        +   6,00 px de bordures (6 × 1 px)
          ------
          315,52 px sur 360  →  87,6 %, et 44,48 px de mou
```

**Zéro coupure, zéro débordement.** Baisser la police aurait rapetissé cinq
libellés justes pour un débordement qui n'a pas lieu.

⚠ **ET ELLE TIENT PLUS ÉTROIT QUE LA CIBLE** : mesuré à **412, 393, 360 et
320 px** CSS, les six tiennent aux quatre largeurs — à 320 il reste **4,5 px**.
C'est en dessous de 320 que le mur arrive, et aucun téléphone en service n'y est.

⚠ **CE QUI TRAVAILLE EST `flex: 1 1 0%` AVEC `min-width: auto`** : RECHERCHE, le
plus long, garde sa largeur de contenu et les cinq autres se partagent le reste.
Mesuré AVANT le lot, à cinq onglets et un glyphe : RECHERCHE tenait déjà
74,44 px contre 63,39 aux autres. **Le partage n'a jamais été égal**, et c'est
exactement ce qui donne le mou.

⚠⚠ **LA RÈGLE `#tete-rapport` DISPARAÎT ENTIÈREMENT**, elle n'est pas ajustée.
Elle posait `flex: 0 0 32px`, `font-size: 16px`, `text-transform: none` et
`letter-spacing: 0` — les quatre déclarations qui faisaient d'un pictogramme
autre chose qu'un libellé. Le bouton prend sa part de `#tete-onglets button`
comme les cinq autres.

⚠ **ET IL NE DEVIENT PAS UN ONGLET POUR AUTANT.** Son identifiant reste
`tete-rapport` — il ne commence pas par `onglet-` —, il ne prend jamais `.actif`,
et `ONGLET_DE_L_ECRAN` de `ui/session.js` ne le connaît pas : il n'a pas d'écran,
il ouvre un panneau. `AC T7` sépare les deux populations, **cinq onglets et un
bouton**, au lieu de compter six boutons.

⚠ **LA HAUTEUR DE LA BARRE NE BOUGE PAS** : `flex: 0 0 40px` est intact, donc les
**288 px** de chrome que `chantier.test.js` somme sont inchangés.

---

## 7. Les falsifications — quatorze posées, quatorze mordent, TROIS muettes au premier relevé

| # | Falsification | Verdict |
|---|---|---|
| F1 | `BOUCLES_DE_BATIMENT` remise à ses quatre entrées | `AC T1` + 2 |
| F2 | La table supprimée au lieu d'être vidée | `AC T1` |
| F3 | `OPACITE_ARRIVEE` remise dans `etatDeLArrivee` | `AC T2` |
| F4 | `dureeDArrivee` remise à `400` en dur | `AC T3`, `AC T4` |
| F5 | Le pop-up rend les soixante-dix | **MUETTE au premier relevé** |
| F6 | Un marqueur peint hors du cadre | `AC T6` |
| F6 bis | L'ordre de dessin inversé (base sous ouvrage) | `AC T6` |
| F6 ter | Les deux rampes de sol permutées | **MUETTE au premier relevé** |
| F6 quater | Le débord des marqueurs retiré | **MUETTE au premier relevé** |
| F7 | Le glyphe ▤ remis sur le bouton du journal | `AC T7` |
| F8 | Le scanner remplacé par une expression régulière | **mord dans l'OUTIL** |
| F9 | Un hexadécimal littéral déposé dans `mini-carte.js` | `AC T6` + garde de palette |
| F10 | `#monde-mini-canvas` privé de `pixelated` | `chantier.test.js` |
| F11 | La mini-carte non recadrée sur la base | `AC T6` (bordY) |

⚠⚠ **F5 ÉTAIT MUETTE, ET LA RAISON EST DANS MON PROPRE MONTAGE.**
`clesDesPoisAcquis(pris)` construit son ensemble **dans l'ordre de dessin**,
donc `[...selection].map(…)` rendait le même ordre que la fonction qu'on voulait
falsifier : le test comparait deux listes identiques par accident. **Le montage
construit désormais sa sélection À L'ENVERS**, et c'est justifié plutôt que
bricolé — `poisAcquis` est trié par `releverLesPoisAcquis`, **jamais par rang de
dessin**, donc l'ordre inverse est un état atteignable.

⚠⚠ **F6 ter ÉTAIT MUETTE, ET C'EST UNE FAUTE DE MON CODE, PAS DU TEST.**
`basculeDuSol` lisait **l'INDICE DANS LA LISTE** pour décider si une bande est de
l'Ouvrage : permuter les deux rampes — donc peindre le violet au SUD — ne
changeait aucun indice et passait au vert. Elle lit désormais la RAMPE :
`TERRAIN_CARTE.rampes.ouvrage.includes(tonDeLaBande(bande))`. **La falsification
a trouvé un défaut, pas un trou de test.**

⚠⚠ **F6 quater ÉTAIT MUETTE, ET ELLE A FAIT ÉCRIRE UNE GARDE.** Retirer le
débord des marqueurs ne faisait tomber personne : rien ne mesurait leur taille
RELATIVE. `AC T6` garde désormais les **rapports de hauteur** — un POI est plus
haut qu'une case d'Ouvrage, la base est plus haute qu'un POI — et jamais un
nombre de pixels, qui vieillirait au premier changement de géométrie.

⚠⚠ **F8 NE MORD PAS DANS LA SUITE JS, ET IL FAUT LE DIRE DANS CE SENS-LÀ.**
Remplacer le scanner par `/\/\*[\s\S]*?\*\//g` **ne fait tomber AUCUN test** —
mesuré. Le motif : la feuille d'aujourd'hui porte 173 chaînes et 18 `url()`, et
**aucune ne contient d'ouvreur de commentaire** ; de plus le retrait tourne
AVANT l'inlinage, donc les 306 `data:` ne sont pas encore là. La faute est donc
inatteignable sur l'état du jour, et un test qui ne peut tomber sur aucun état
ne garderait rien.

**D'où la démonstration sur une feuille FORGÉE**, dangereuse par construction :

```css
#a::after { content: "/* pas un commentaire"; }
#b { background-image: url('data:image/webp;base64,UklGRhY/*AAAA'); }
/* un vrai commentaire */
#c { color: red; }
```

L'expression régulière naïve **mange la règle `#b` ENTIÈRE et son `data:`** — de
l'ouvreur de la chaîne de `#a` jusqu'au `*/` qui se trouve dans le base64 ; le
scanner garde les quatre règles et ne retire que le vrai commentaire.

⚠⚠ **ET LA GARDE EST DANS L'OUTIL, PAS DANS LA SUITE.** `verifierLeScanner()`
tourne à CHAQUE build sur ce témoin ; un scanner remplacé par une expression
régulière fait **échouer le build**, pas un test. C'est l'idiome de
`verifier_les_coupes` de `tools/planches.py` : la garde va là où la faute se
commet. **Vérifié en le cassant pour de bon** :
`BUILD EN ÉCHEC — feuille : le retrait des commentaires a mangé « #b »`.
Et `AC T8` **garde la garde** : il exige que `tools/build.js` porte encore
`verifierLeScanner`.

---

## 8. Les gardes existantes qui changent de cible — aucune ne s'assouplit

| Fichier | Gardes |
|---|---|
| `son.test.js` | `SB T1`, `SB T3`, `SON T14`, `SON T15`, `SON T20`, `SON-V T3` |
| `rendu.test.js` | `SB T4`, `SB T5`, `SB T5 bis` |
| `monde.test.js` | `CARTE-B T4`, `PC T5`, `PC T10` |
| `chantier.test.js` | `PAL T8`, `décor — …`, `mise en page — le chrome fixe…` |
| `offense.test.js` | `le HTML produit porte…`, `le budget vient du Centre de commandement` |
| `pictogramme.test.js` | `PIC T7` |

⚠ **`SON T15` EST RETOURNÉE, PAS RÉPARÉE.** Elle exigeait que l'exception soit
« exactement Monde, nommée » ; il n'y a plus d'exception à nommer — **six écrans
sur sept sont muets**, et c'est le RAID qui est l'exception. Elle mesure la règle
neuve et falsifie l'ancienne de face.

⚠ **`SON T20` SUIT LE COMPTE DES MUETS**, et c'est la mesure du §1 vue par
l'autre bout : quatre sons de plus deviennent inatteignables — 71 016 octets
d'Opus, 94 688 en base64 — sans qu'un `.opus` sorte du livrable.

⚠ **LES DEUX GARDES DE `offense.test.js` ONT CHANGÉ DE CIBLE SANS QUE LE LOT LES
VISE** : elles lisent le HTML produit, dont la feuille vient de perdre 68,4 % de
son poids. Elles ne se sont pas relâchées ; elles ont cessé de compter des
octets de commentaire.

---

## 9. §4 — la mini-carte, ce qui a été mesuré

⚠⚠ **`src/render/mini-carte.js` NE PORTE AUCUN HEXADÉCIMAL, ET C'EST UNE
CONTRAINTE, PAS UNE ÉLÉGANCE.** La garde de palette de `banc.test.js` balaie
`src/render/` et refuse toute teinte hors de `FICHE-STYLE.md` ; elle ne tolère de
couleur CALCULÉE que dans `src/ui/monde.js`, exactement deux. Les quatre teintes
de marqueur se **LISENT** dans `EMBLEMES_CARTE` et les dix tons de sol dans
`TERRAIN_CARTE.rampes` :

| Rôle | Source | Valeur |
|---|---|---|
| Ouvrage | `EMBLEMES_CARTE.base.fond` | `#231D2E` — le FOND, pas le bord |
| POI | `EMBLEMES_CARTE.poiQuartz.bord` | `#68727E` — le métal, il n'appartient à personne |
| POI acquis | `EMBLEMES_CARTE.camp.bord` | `#F5B636` — l'ambre du butin |
| Base du joueur | `EMBLEMES_CARTE.baseJoueur.bord` | `#F5F3E8` — l'os |

⚠ **1 080 × 1 920 PIXELS D'APPAREIL**, comme le brief l'exige. Une case fait donc
**35 × 6 px** — `1080 / 31` et `1920 / 300` — et les bords se calculent par
`Math.round` **sur les BORDS**, jamais par une largeur arrondie multipliée : le
second rendrait un trou ou un recouvrement tous les trois pixels. Mesuré : (1,1)
tombe à `{x:0, y:0, largeur:35, hauteur:6}`, (300,31) à `{x:1045, y:1914}`.

⚠⚠ **LES POI ÉTAIENT INVISIBLES, ET C'EST EN REGARDANT QU'ON L'A VU.** Mesuré
sur la graine 2026, la texture de l'Ouvrage couvre **16,89 %** du canevas : un
POI d'une case s'y noyait. `DEBORD` donne **1 px au POI et 2 px à la base**,
borné au canevas — et il est gardé comme un RAPPORT, jamais comme un nombre de
pixels.

⚠⚠ **ET LA BASE DU JOUEUR TOMBAIT SOUS LE PLI.** Mesuré : le canevas fait
**640 px CSS** de haut dans un corps de **588** — la base du joueur, rangée 295,
est à 1 888 px sur 1 920, donc hors cadre à l'ouverture.
`cadrerLaMiniCarteSurLaBase()` la centre : `scrollTop = 52`, qui est le maximum.

⚠ **LE DESSIN SE REFAIT SUR EMPREINTE, JAMAIS À CHAQUE OUVERTURE.**
`empreinteDeLaMiniCarte` porte la graine, les positions de base, le nombre de POI
acquis et le nombre de rasées : sur la graine 2026, **1 642 marqueurs — 1 571
Ouvrage, 70 POI, 1 base — en 56 ms**. Les redessiner à chaque ouverture serait
56 ms rendus au joueur pour une image identique. ⚠ Le compte dépend de la
GRAINE — c'est le peuplement de l'Ouvrage —, la durée non.

⚠ **L'ORDRE DE DESSIN EST `ouvrage → poi → base`**, et il est gardé : la texture
d'abord, les gisements dessus, **la base seule au-dessus de tout**. `AC T6`
l'exige, et F6 bis le fait tomber.

⚠ **LE SOL EST PAVÉ PAR BANDES DE POI, PAS PAR RANGÉE.** Dix bandes, un ton
chacune, pris **proportionnellement** dans les deux rampes du terrain retournées
(nord = violet, sud = ocre). Elles pavent les 1 920 px **sans trou ni
recouvrement**, mesuré. Et `basculeDuSol()` rend `{selonLesTons: 6, selonLeSol: 6}` :
la bascule que la mini-carte PEINT et celle que le sol de la vraie carte
FRANCHIT tombent sur **la même bande**, ce qui est la seule chose qui dise que la
miniature ne ment pas sur le monde.

---

## 10. §3 — le pop-up d'acquisition

⚠ **DEUX LECTEURS, UNE SEULE VUE.** `vueDesPois(graine, acquis, selection)`
porte le troisième argument ; à `selection === null` elle rend les soixante-dix,
et c'est ce que `#monde-poi` demande. Le pop-up d'ACQUISITION passe la liste de
ce qui vient d'être pris. **Une seconde fonction aurait donné deux façons de
nommer un gisement**, et la première divergence se serait lue comme un bogue.

⚠ **LE TITRE COMPTE CE QU'IL MONTRE**, jamais un total : « 3 gisements acquis »
sur un pop-up qui en liste trois, « 70 » sur le bouton.

---

## 11. Ce qui n'a pu être NI VU NI ENTENDU — liste nommée

⚠⚠ **LE SON N'A PAS ÉTÉ ENTENDU, ET IL SE DÉCLARE NON ENTENDU.** Il n'y a pas de
sortie audio ici, `opusenc` est absent du conteneur, et §3 de `CLAUDE.md` dit
qu'un test appareil non exécuté se déclare non exécuté. Ce qui est mesuré à la
place est ce que `bouclesDesirees` RÉCLAME, écran par écran et disposition par
disposition — pas ce qui sort du haut-parleur.

**Ce qui n'a pas été vu, nommément :**

1. **L'arrivée d'une unité à l'écran.** Le mouvement lui-même — le véhicule qui
   émerge d'une case plus bas — n'a été vu par personne. Ce qui est mesuré est la
   LISTE D'AFFICHAGE : le décalage en milli-cases à sept instants, sa chute
   exacte à zéro, et l'absence de tout alpha partiel.
2. **La mini-carte SUR APPAREIL.** Elle a été relevée dans Chromium à la
   géométrie du S25 FE — 1 080 × 1 920 décodés, 1 659 marqueurs, `scrollTop = 52`,
   zéro erreur de page, zéro débordement horizontal — et **ce n'est pas le
   téléphone d'Ethan** (§3).
3. **Les six libellés sur appareil.** Les 309,52 px sont relevés dans Chromium
   avec « Roboto Condensed » ; la police du SYSTÈME d'Ethan peut différer, et
   c'est le seul chiffre du §5 qui en dépend. **Les 44,5 px de mou donnent
   14,4 % de marge** avant qu'un débordement soit possible.
4. **Le silence de l'écran de la base.** Personne n'a écouté ; ce qui est mesuré
   est un ensemble vide.
5. **Le pop-up d'acquisition en jeu réel.** Il demande qu'un POI soit acquis,
   donc que la base entre dans son territoire ; le montage le force.

⚠ **`python3 tools/verifier.py` N'A PAS ÉTÉ LANCÉ, ET C'ÉTAIT CONFORME.** Le lot
ne touche ni `art/`, ni un outil de la chaîne graphique — `tools/build.js` ne
produit ni sprite ni son. Le brief le dit en toutes lettres : « Le lancer quand
même affaiblirait la consigne. »

---

## 12. Écarts au brief, déclarés

1. ⚠⚠ **`vitesseMilli` N'EST PAS SUR L'ENTITÉ.** Le brief l'affirme et interdit
   de lire `UNITES` ; **mesuré, c'est l'inverse**, et l'obéir a levé sur sept
   tests. Voir §5.
2. ⚠⚠ **« 833 ms AU PLUS RAPIDE » EST FAUX** : c'est **417 ms**, le Frappeur à
   `vitesse: 240`. Voir §5.
3. ⚠⚠ **LA POLICE NE DESCEND PAS.** Le brief prédit qu'il faudra la baisser ;
   **mesuré, il reste 44,5 px de mou à 360 px et 4,5 px à 320**. Voir §6.
4. ⚠⚠ **F8 NE MORD PAS DANS LA SUITE JS.** Le brief attendait qu'un test tombe ;
   la faute est inatteignable sur l'état du jour, et la garde a été mise dans
   l'OUTIL. Voir §7.
5. ⚠ **LE BRIEF ANNONÇAIT HUIT TESTS, ET IL Y EN A EXACTEMENT HUIT** — mesuré,
   1 550 → 1 558. Les trois falsifications muettes du §7 n'ont pas fait entrer un
   neuvième test : deux ont fait RESSERRER `AC T5` et `AC T6`, et la troisième a
   fait corriger `basculeDuSol` elle-même. **Aucun test n'est retiré, aucune
   assertion n'est assouplie.**

---

## 13. Ce qui n'a PAS bougé — vérifié plutôt que cru

- **`SAVE_VERSION` reste à 31** — vérifié au diff : `src/sim/` n'a pas une ligne
  de changée. Une arrivée est un dessin, une mini-carte est un dessin, un
  commentaire de feuille est du texte.
- **`test/temoins-combat.js` n'a pas une ligne de changée** — `git diff --stat`
  vide. Les deux cents témoins de combat sont VERTS sans avoir été régénérés.
- **`test/temoins-bases-0.js` non plus.**
- **`art/`, `src/sim/`, `src/son/` : zéro fichier touché** — le territoire
  interdit du brief est intact, vérifié au diff.
- **`tools/batiments_v2.py`, `tools/ruines.py`, `tools/atlas.py` : intacts.**
- **Aucune valeur de calibrage n'a bougé** hors la table `BOUCLES_DE_BATIMENT`,
  que le §1 vide.

---

## 14. Points en suspens — pour Ethan

1. ⚠⚠ **QUATRE SONS SONT DEVENUS DORMANTS ET RESTENT AU LIVRABLE :
   71 016 OCTETS D'OPUS, 94 688 EN BASE64.** `building_player_factory_loop`
   (10 535), `building_reactor_loop` (21 414), `ambience_base_player_loop`
   (19 869), `ambience_calm_map_loop` (19 198). **Le lot ne les retire pas**, et
   c'est délibéré : les sortir demande de toucher `tools/sons.py` et de
   régénérer les 263 entrées, ce qui est **hors du territoire de ce lot-ci**.
   C'est un lot à soi, et il rendrait au livrable presque autant que la moitié
   d'un lot d'art. **Ethan tranche.**
2. ⚠ **LA MINI-CARTE N'A NI ZOOM NI TOUCHER.** Elle se défile verticalement et
   se recadre sur la base à l'ouverture ; toucher un marqueur ne fait rien. Le
   brief ne le demande pas. **Ethan tranche** s'il veut qu'un toucher amène la
   grande carte sur cette case.
3. ⚠ **LE `DEBORD` EST UN RÉGLAGE, PAS UNE MESURE.** 1 px pour un POI, 2 pour la
   base : c'est ce qu'il a fallu pour les voir sur 17,23 % de texture. Deux
   nombres, dans `src/render/mini-carte.js`, qui se changent seuls.
4. ⚠ **LA FEUILLE N'EST TOUJOURS PAS MINIFIÉE.** Le §6 retire les commentaires ;
   les espaces, les retours à la ligne et l'indentation restent — **44 947
   octets**, dont une bonne part est de la mise en forme. Les retirer demanderait
   un minifieur CSS, donc une dépendance, ce que `CLAUDE.md` §3 interdit.
   **Relevé, non corrigé.**
5. ⚠ **`LIMITE T8` EST TOUJOURS SUSPENDU** — 08/09, décision d'Ethan. Son corps
   est intact sous le `skip`, avec ce qu'il faut pour le rouvrir.

---

## 15. Livraison

Branche `claude/lot-2-74vd58`, PR ouverte, **prête pour revue**.
⚠ **Le merge sur `main` appartient à Ethan seul.**
