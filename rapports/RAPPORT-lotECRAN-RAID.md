# RAPPORT — lot ÉCRAN-RAID

Trois retours d'Ethan du 04/09, tous sur l'écran de raid :

> « Mode Raid : afficher seulement la défense ou la base comme pour la base du
> joueur, de sorte que le fond remplisse toute la largeur. Possibilité de
> zoomer. Il n'y a pas les sprites de nos unités en bas. »

---

## 0. Base de départ, et un écart au brief

| Grandeur | Brief | Mesuré sur clone à jour |
| --- | --- | --- |
| `npm test` | 1044 pass / 0 fail | **1044 pass / 0 fail** ✔ |
| `dist/index.html` | 6 787 002 octets | **6 786 776 octets** |
| version / build | 0.90.0 · 92 | **0.90.0 · 92** ✔ |

⚠ **Le nombre d'octets du brief est haut de 226**, et il se disait lui-même « à
confronter — c'est la valeur lue dans `CLAUDE.md` ». `CLAUDE.md` porte
6 786 776 ; c'est aussi ce que rend `node tools/build.js` sur `origin/main`
(`910bd77`). Écart signalé, base saine, lot poursuivi.

⚠ `tools/verifier.py` **n'a pas été lancé, et c'était conforme** : le lot ne
touche ni `art/`, ni `tools/`. Les six captures de ce rapport vivent dans
`rapports/`, hors de la chaîne.

**Produit :** version **0.91.0 · build 93**, `npm run check` →
**1053 pass / 0 fail**, `dist/index.html` **6 791 796 octets**, 0 référence
externe.

---

## 1. §2 du brief — le diagnostic, et il ne tombe pas où le brief le croyait

Le brief demandait laquelle de trois explications est la bonne. **C'est la
première — la géométrie de l'appareil — mais pas pour la raison qu'il donnait**,
et sa prémisse est fausse.

### 1.1 Ce que le brief supposait

> « Sur le canevas relevé au lot ASSAUT — **360 × 674 px CSS en préparation** »

Ce 674 est le **DÉROULÉ** du lot ASSAUT, relevé avant que `#barre-bas` ne soit
masquée (720 − 46 = 674). Ce n'est pas la préparation.

### 1.2 Ce que la mesure dit

Chromium, géométrie du S25 FE — **1080 × 2340, DPR 3**, donc 360 × 780 CSS —,
partie chargée depuis un fixture, écran de raid ouvert par le double-toucher :

| Grandeur | S25 FE (360 × 780) | Banc ASSAUT (360 × 720) |
| --- | --- | --- |
| `#tete-onglets` | 40 px CSS | 40 |
| `#barre-bas` | 46 | 46 |
| **`#raid-bas`** | **227,56** | **227,56** |
| `#raid-cible` = le canevas | **466,44** | **406,44** |
| buffer du canevas | 1080 × 1398 | 1080 × 1218 |
| largeur / 10 colonnes | 108 | 108 |
| hauteur / 18,5 lignes | **75,568** | **65,838** |
| **ce qui commande** | **la HAUTEUR** | **la HAUTEUR** |
| `tailleCase` | **75** | **65** |
| `margeX` | 202,5 | 247,5 |
| `margeY` | 42,5 | 39,5 |
| `rectangleDuFond` | x 165, y 5, l **750**, h 1500 | x 215, y 7, l **650**, h 1300 |
| **vide de chaque côté** | **165 px de buffer** | **215** |
| **part de la largeur perdue** | **30,6 %** | **39,8 %** |

Capture : `rapports/ecran-raid-1-avant.png`.

### 1.3 Les trois explications, tranchées

1. **La géométrie de l'appareil — OUI, et c'est celle-là.** Mais ce n'est pas
   l'appareil d'Ethan qui est en cause : **le banc l'avait déjà, et pire.** Ce
   qui écrase le canevas, c'est `#raid-bas` — les quatre vagues de neuf, la
   rangée de boutons et la ligne d'avis — qui prend **227,56 px CSS** des 780. Le
   rapport hauteur/largeur du canevas vaut 1,294, très en dessous du 1,85 de la
   boîte de grille : la hauteur commande, toujours, sur tout téléphone.

2. **Le décor a un défaut propre — NON, mesuré.** `rectangleDuFond` pose une
   image de `LARGEUR_EN_CASES × tailleCase` = 750 px pour une boîte de grille de
   750 px. **Le décor remplit exactement ce que la grille occupe** ; le vide
   était du letterboxing, pas un défaut de pose.

3. **Ethan parlait de la hauteur — NON.** `margeY` valait **42,5 px de buffer**,
   soit 14 px CSS. Le vide était horizontal, et il valait douze fois plus.

### 1.4 Et le déroulé, lui, était déjà juste

Plein cadre, le canevas fait **1080 × 2340** : `2340 / 18,5 = 126,49 > 108`,
donc **la largeur commande, la case vaut 108, et le vide vaut zéro**. Seule la
PRÉPARATION était en cause — ce qui est exactement l'écran où Ethan compose,
répare et active. C'est aussi pourquoi aucune capture ne montrait le défaut :
toutes celles du lot ASSAUT étaient prises au déroulé.

---

## 2. Ce qui a été fait

### 2.1 Les bandes déménagent — `src/render/bandes.js`

**Un déplacement, pas une écriture.** `BANDES`, `BANDES_NAVIGABLES`,
`bandesDansLOrdreDeLEcran`, `basculeDeBande`, `bornesDeDefilement` et
`bandeDeLaRangee` quittent `src/ui/chantier.js` ; **pas une ligne de la
géométrie n'a changé en route**, seuls les trois préfixes de message d'erreur
passent de « chantier : » à « bandes : ».

⚠ **Il n'y a PAS de ré-export.** Le lot MUR-PEINT a retiré le dernier du dépôt
en écrivant pourquoi ; `test/chantier.test.js` importe désormais à la source.

⚠ **Il est dans `render/`, pas dans `ui/`.** Un écran qui importerait l'autre
pour une géométrie ferait dépendre le raid de la mise en page de la base — le
couplage exact que `render/fond.js` existe pour éviter.

Trois fonctions **entrent**, et elles sont pour le canevas :

| Fonction | Ancre | Ce qu'elle rend |
| --- | --- | --- |
| `casesDeLaBande` | `src/render/bandes.js:200` | la hauteur d'une bande en cases, mur compris ; `null` = vue d'ensemble |
| `bornesDuDecalage` | `src/render/bandes.js:231` | la borne de bande COMPOSÉE avec le bord du contenu |
| `bornesDuDecalageX` | `src/render/bandes.js:260` | le débord horizontal, que rien d'autre ne borne sur un canevas |

⚠⚠ **La composition est nécessaire, et elle se chiffre.** Sur un canevas la vue
est souvent PLUS HAUTE que la bande : au plancher de zoom, **treize rangées
tiennent dans le cadre pour une bande qui en fait huit**. S'en tenir à
`bornesDeDefilement` (`src/render/bandes.js:143`) poserait la Défense à 918 px
alors que le contenu s'arrête **318 px plus haut que le bas du cadre** — trois
cents pixels de noir sous la dernière rangée.

### 2.2 `calculerProjection` gagne une `vue` — `src/render/projection.js:91`

Quatre champs, quatre défauts qui rendent la formule d'hier **au caractère
près** : `lignesVisibles` (ce qui doit tenir en hauteur), `coteCase` (la taille
imposée par le doigt), `decalageX` et `decalageY` (l'endroit).

⚠ **Un paramètre, pas une seconde fonction** — la règle que `murCases` porte
déjà dans ce fichier. Une `projectionDeLaBande` aurait mis deux letterboxing
dans le dépôt, dont un seul serait corrigé le jour d'une correction.

⚠⚠ **Et le centrage se mesure sur le CONTENU ENTIER, pas sur la bande visible.**
Voir §4.2 : cette ligne-là est celle qu'une falsification a trouvée non gardée.

### 2.3 L'écran de raid cadre une bande

`src/ui/raid.js` tient **trois** états de vue et pas un de plus : la bande, le
côté de case, les deux décalages. Tout le reste se recalcule à chaque image.

- `bandeDeLaVue` — `src/ui/raid.js:490` — rend `null` pendant le déroulé. ⚠ La
  bande **se demande, elle ne se retient pas** : écrire `bandeCourante = null` en
  entrant dans le déroulé obligerait à la restaurer aux QUATRE portes de sortie,
  et c'est le défaut que le lot ASSAUT a payé sur le chrome.
- `allerALaBande` — `src/ui/raid.js:548` — pose le décalage hors bornes et laisse
  `dimensionner` le rabattre sur le `min` de la bande visée. La borne basse de la
  Défense est le HAUT de la Défense ; zéro serait le haut de la base.
- `marquerBascule` — `src/ui/raid.js:935` — le bouton `#raid-bascule-bande`
  (`src/index.src.html:2145`), **le même que celui du Chantier**, au même coin,
  40 px de côté, glyphe DÉDUIT par `basculeDeBande`. Il part pendant le déroulé.

**Mesuré à l'écran, S25 FE, DPR 3** : la case passe de **75 à 108**, la boîte
occupe les **1080** pixels du cadre, et le vide vaut **zéro à gauche comme à
droite**, sur les deux bandes. Le glyphe passe de ▼ (« Aller à Défense ») à ▲
(« Aller à Chantier »). Zéro erreur de page.

Captures : `rapports/ecran-raid-2-apres.png`, `rapports/ecran-raid-3-defense.png`.

⚠ **Le déploiement n'est pas navigable, et c'est `BANDES_NAVIGABLES` qui le
dit** — pas un cas particulier écrit ici. En préparation, ces deux rangées sont
du sol nu : y emmener le joueur serait le bouton « Assaut » du 27/08, qui
promettait un éditeur et livrait du vide. Elles restent ATTEIGNABLES par le bas
de la bande Défense, ce que `bornesDeDefilement` fait déjà depuis le 31/08.

### 2.4 Le zoom — `plafondDuZoom`, `src/ui/raid.js:297`

⚠⚠ **Le plafond de la base est en pixels CSS, celui du canevas en pixels de
buffer, et les confondre diviserait la plage par la densité.** Prendre
`COTE_CASE_MAX` tel quel donnerait, à densité 3, **128 de plafond pour 108 de
plancher — une plage de 1,19 fois**, c'est-à-dire très exactement le « zoom
chelou, très lent » qu'Ethan a rapporté le 31/08.

`plafondDuZoom` rend le multiple **ENTIER** de `COTE_SPRITE` le plus proche du
plafond de la base converti : **384 à densité 3**. Il reste entier même sur une
densité fractionnaire (2,625 sur certains Android), ce qu'un simple produit ne
ferait pas.

⚠ **Le plancher se DÉRIVE** : c'est ce que la même formule rend quand on ne lui
impose rien, donc la taille qui fait tenir la bande entière. ⚠ **Et il l'emporte
sur le plafond** : sur un écran très large, montrer la bande entière est la
contrainte forte.

**Mesure — la plage du raid est celle de la base à la quatrième décimale :**

| | plancher | plafond | plage |
| --- | --- | --- | --- |
| Raid, S25 FE, bande des bâtiments | 108 (buffer) | 384 | **3,5556** |
| Base, 360 px CSS | 36 (CSS) | 128 | **3,5556** |

**Mesuré au doigt, dans Chromium** : un pincement de 1,25 porte la case de
**108 à 135** (plage d'obstacle 324 → 134) ; le relâchement rend **324, au
pixel**. Capture : `rapports/ecran-raid-4-zoom.png`.

⚠⚠ **UN POINT POUR ETHAN.** Au plafond, un SPRITE est agrandi **×3 exactement**,
donc sans interpolation — c'est ce que le multiple entier garantit. Le **DÉCOR**,
lui, est agrandi **×3,5556** : sa case source vaut 108 px (`COTE_CASE_SOURCE`) et
non 128. **C'est déjà vrai de l'écran de la base**, dont le plafond est le même ;
le raid ne fait que le reproduire. Descendre le plafond à 108 buffer supprimerait
le flou du décor **et le zoom avec** (plage 1,00 à densité 3). **Un nombre se
change seul ; Ethan tranche.**

### 2.5 Les sprites des vagues

`emplacement.textContent = occupant.nom` a disparu ; la vignette est **celle de
l'Offense** — `couchesDeLUniteDAssaut(occupant.id)` posée par `poserCouches`,
`src/ui/raid.js:787`. Le nom n'est pas perdu : il était déjà dans le `title`,
avec le niveau et les PV.

⚠ **La règle CSS gagne un SÉLECTEUR, elle ne se dédouble pas**
(`src/index.src.html:1463`) : deux blocs identiques divergeraient au premier
ajustement, et la divergence se lirait comme deux tailles de sprite pour la même
unité d'un écran à l'autre. Une garde du dépôt l'exige désormais.

**Relevé à l'écran** : 6 pièces sur 6 portent un sprite, **0 case contient du
texte**, la vignette fait 34,9 × 35,1 px CSS.

⚠⚠ **La question que le brief posait — « une pièce abîmée reste-t-elle
lisible ? » — a été confrontée à l'écran, densité 3, sur six pièces** : intacte,
inactive, intacte, abîmée, inactive ET abîmée, intacte.
`rapports/ecran-raid-5-etats.png`. **Les six sprites sont également
reconnaissables**, et la raison est structurelle : les trois règles d'état
portent sur le **LISERÉ**, aucune ne peint le fond ni ne voile l'image. `RAID-E
T8` l'exige désormais de face.

⚠ **Ce qui est perdu se déclare** : `.inactive` posait aussi `color: #68727E`,
qui teintait le NOM. Le nom parti, cette moitié du signal est inerte. Le liseré
tireté clair la porte seul — et il est PLUS visible que le liseré presque noir
d'une pièce active, donc l'état se lit au moins aussi bien qu'avant.

---

## 3. La lecture du §3.1, déclarée comme lecture

> **Préparation** : une bande à la fois, défilement, zoom.
> **Déroulé** : la vue d'ensemble par défaut, **zoom remis au plancher**, mais
> le pincement et le défilement restent disponibles.

Ethan a dit « mode Raid » sans distinguer les deux temps. Le motif de cette
lecture : un raid part des rangées 1–2, traverse la défense en 3–10 et atteint
les bâtiments en 11–18 ; **cadrer une seule bande pendant qu'il se joue, ce
serait regarder ailleurs pendant que ça se passe.** Et garder le gros plan de la
préparation ferait regarder trois colonnes pendant que le combat traverse les
dix-huit rangées.

**Un mot d'Ethan renverse ça, et c'est un nombre de départ qui change, pas une
architecture** — `bandeDeLaVue` rend `null` pendant le déroulé ; lui faire rendre
la bande courante suffirait.

Capture du déroulé : `rapports/ecran-raid-6-deroule.png`.

⚠ **Et le chrome revient sur tous les chemins**, relevé après la fin d'un raid
complet : onglets ✔, barre du bas ✔, `#raid-bas` ✔, bouton de bascule ✔ ;
`#ressources` et `#navigation` restent masqués, ce qui est l'état de préparation.

---

## 4. Les neuf tests, et leur montage effectif

`test/raid-ecran.test.js` passe de 11 à **20 tests**. Compte global :
**1044 → 1053**. **Aucune assertion n'a été retirée.**

| Test | Montage effectif | Verdict |
| --- | --- | --- |
| `RAID-E T1` | `calculerProjection(1080, 1398, 0.5)` puis la même avec `lignesVisibles: casesDeLaBande('batiments', 0.5)` | PASS — 75 → **108**, vide latéral 165 → **0** |
| `RAID-E T2` | l'ANCIENNE formule refaite à la main sur cinq viewports (1080×1398, 1080×2340, 412×820, 360×560, 1024×768), comparée terme à terme | PASS — `tailleCase`, `margeX`, `margeY` identiques |
| `RAID-E T3` | `casesDeLaBande` sur les trois bandes, avec et sans mur ; `BANDE_SOUS_LE_MUR` LU, jamais recopié | PASS — une seule bande porte la demi-case |
| `RAID-E T4` | `bornesDuDecalage` sur les deux bandes navigables, `bornesDuDecalageX`, plus le cas zoomé | PASS — `max === min` au plancher, bornes ≥ 0, les deux axes s'ouvrent une fois zoomé |
| `RAID-E T5` | balayage de `src/data`, `src/sim`, `src/render`, `src/ui`, `src/son` — qui nomme les trois clés de bande ? | PASS — **`render/bandes.js` et lui seul** |
| `RAID-E T6` | le plancher dérivé sur 3 hauteurs de bande × 3 viewports, et la vérification qu'il est MAXIMAL | PASS |
| `RAID-E T7` | `plafondDuZoom` sur dpr 1 · 1,5 · 2 · 2,625 · 3 · 4, plus la plage contre le plancher | PASS — multiple entier partout, plage > 3 |
| `RAID-E T8` | source de `ui/raid.js` + les trois règles d'état de la feuille | PASS — nom nu absent, `title` présent, aucun `background`/`opacity`/`filter` sur un état |
| `RAID-E T9` | les six écouteurs NOMMÉS, la règle « deux doigts », `Map` de contacts, absence de `transform` | PASS |

⚠ **`T5` et `T8` sont des gardes de SOURCE** : elles disent qu'une table est
unique et qu'un nom nu a disparu, **jamais qu'un pixel est au bon endroit**. La
preuve du rendu est au §1, §2 et §5, mesurée dans Chromium.

### 4.1 Vingt falsifications, vingt chutes

| # | Falsification | Verdict |
| --- | --- | --- |
| 1 | la projection ignore `lignesVisibles` | MORD — T1, T6 |
| 2 | **le centrage se mesure sur la bande** | voir §4.2 |
| 3 | le mur compte pour les trois bandes | MORD — T3 |
| 4 | le bord du contenu ne borne plus le décalage | MORD — T4 |
| 5 | la taille de case s'arrondit vers le haut | MORD — T1, T2 |
| 6 | le plafond ne s'arrondit plus sur un multiple de sprite | MORD — T7 |
| 7 | le nom nu revient dans la vignette | MORD — T8 |
| 8 | l'état « abîmée » voile le sprite (`opacity: 0.5`) | MORD — T8 |
| 9 | le pincement s'ouvre à UN doigt | MORD — T9 |
| 10 | le zoom passe par `ctx.setTransform` | MORD — T9 |
| 11 | un `1` au site d'appel : l'anneau se rallume | MORD — `FOND T1` |
| 12 | la demi-case écrite `0.5` à la main | MORD — `FOND T1` |
| 13 | la vignette se dédouble au lieu de se partager | MORD — garde du Chantier |
| 14 | une seconde table de bandes dans `ui/raid.js` | MORD — T5 |
| 15 | le défaut de `lignesVisibles` change | MORD — T1, T2 |
| 16 | les couches ne se posent plus | MORD — T8 |
| 17 | **le canevas cesse d'écouter `pointermove`** | voir §4.3 |
| 18 | le décalage horizontal cesse d'être borné | MORD — T4 |
| 19 | les vagues cessent d'écouter `pointerdown` | MORD — T9 |
| 20 | le pincement passe sur la rangée des vagues | MORD — T9 |

### 4.2 La falsification 2 n'a pas mordu au premier relevé — dixième fois du dépôt

Remplacer `contenuY = (GRILLE.longueur + murCases) * tailleCase` par
`contenuY = lignes * tailleCase` laissait la suite **ENTIÈREMENT VERTE — mesuré,
30 pass / 0 fail** sur `raid-ecran` et `rendu` réunis.

**Et c'est un vrai défaut, mesuré avant d'être cru** : sur le canevas de
préparation, `margeY` passe de **54 à 294** — soit **240 pixels de buffer (80 px
CSS) de noir au-dessus de la rangée 18**. C'est la bande de noir que le lot
existe pour retirer, déplacée des côtés vers le haut.

Elle ne mordait pas parce que tous les appels du dépôt emploient le défaut
`lignesVisibles = GRILLE.longueur + murCases`, où les deux expressions
coïncident. **L'assertion a été écrite APRÈS la mesure**, dans `T1`, avec les
deux moitiés : la bande ne laisse aucun vide en haut quand le contenu déborde,
**et** la vue d'ensemble se centre encore quand elle a de la place — sans quoi la
première serait vraie d'un code qui ne centrerait jamais rien.

### 4.3 La falsification 17 n'a pas mordu non plus, et la garde a changé de forme

`RAID-E T9` exigeait « au moins trois écouteurs de contact par élément ».
Renommer `pointermove` en laissait trois — `pointerdown`, `pointerup`,
`pointercancel` — donc **20 pass / 0 fail**, pendant que ni le promenage ni le
pincement ne faisaient plus rien.

**Un compte ne dit pas ce qui manque.** La garde NOMME désormais les six
écouteurs, et les trois falsifications de geste (17, 19, 20) mordent.

### 4.4 Trois gardes existantes resserrées, aucune assouplie

- **`FOND T1`** cherchait `calculerProjection(…, 1)` et la chaîne exacte
  `calculerProjection(largeur, hauteur, MUR_CASES)`. Avec DEUX sites d'appel et
  un quatrième argument, le premier motif ne trouvait plus la parenthèse
  fermante et **cessait de voir un `1` remis**. Elle lit maintenant le TROISIÈME
  argument de CHAQUE appel : elle attrape le `1` de l'anneau, le `0.5` écrit à
  la main, et tout site d'appel ajouté sans y penser. Une assertion de plus
  refuse que la boucle soit vide.
- **La garde du grossissement du jeton** (`chantier.test.js`) et **celle du
  quinconce** (`offense.test.js`) lisaient un sélecteur nu. Elles lisent la
  LISTE de sélecteurs — et celle du Chantier exige **en plus** que l'écran de
  raid partage la règle, ce qui est une assertion de plus, pas une de moins.

---

## 5. Le geste, mesuré dans Chromium

⚠⚠ **Le brief supposait que le glisser-déposer et le pincement vivent sur la
même grille. C'est faux, et c'est mesuré** : les pièces se glissent sur
`#raid-vagues`, le pincement est sur `#raid-canvas`. **Deux éléments, et un
contact tombe sur un seul.**

| Geste | Ce que fait la pièce | Ce que fait le canevas |
| --- | --- | --- |
| un doigt sur `#raid-vagues` | **1:1 → 3:5** | inchangé — 93 312 px d'obstacle, coin (54 ; 918) |
| deux doigts sur `#raid-vagues` | inchangée | inchangé — 93 312 px, même coin |
| deux doigts sur `#raid-canvas` | inchangée | **zoome** — 93 312 → 51 330 px, coin (54 ; 918) → (203 ; 1148) |
| un doigt à l'horizontale sur le canevas | inchangée | **promène de 135 px** — coin 203 → 68 |
| un doigt en hauteur, une fois zoomé | inchangée | **promène** — empreinte du décor `608a4220` → `12a38cbe` |

⚠ **Un contact dispatché par CDP coûte une soixantaine de millisecondes** — la
mesure du lot ASSAUT tient. Les intervalles courts ne sont pas atteignables
depuis le banc ; ce test-ci n'en dépend pas, il mesure des positions.

⚠ **La dette d'ergonomie déclarée en tête de `src/ui/raid.js` reste entière** —
les modes tactiles d'`ui/offense.js` et le glissement coexistent sur la même
grille 4 × 9. **Ce lot ne l'aggrave pas d'un pixel**, et il ne la résout pas.

---

## 6. Le coût

Mesuré poste par poste contre un livrable **rebâti** depuis `origin/main`
(`910bd77`) dans un `git worktree`.

| Poste | `main` | ce lot | écart |
| --- | ---: | ---: | ---: |
| total | 6 786 776 | 6 791 796 | **+5 020** |
| JavaScript | 334 581 | 338 137 | +3 556 |
| feuille | 95 580 | 96 961 | +1 381 |
| balisage | 1 964 518 | 1 964 601 | +83 |
| audio `data:` | 1 193 346 | 1 193 346 | **+0** |
| images `data:` | 5 130 772 | 5 130 772 | **+0** |
| nombre de `data:` | 289 | 289 | **+0** |

**Borne T10 inchangée à 7 000 000** — aucune ressource n'entre. Marge
**208 204 octets, 2,97 %**.

⚠ **`SAVE_VERSION` ne bouge pas, et reste à 24.** Pas un champ n'entre dans
l'état : une bande courante, un côté de case et deux décalages vivent dans
l'écran. **La sauvegarde ne grandit pas d'un octet** — 1 301 · 1 301 · 1 303 ·
1 307 · 1 309 sur les cinq graines témoins, avant comme après.

---

## 7. Ce qui revient à Ethan

1. **Le facteur d'agrandissement du décor au plafond du zoom : ×3,5556.** Les
   sprites, eux, restent à ×3 exactement — donc nets. C'est déjà le
   comportement de l'écran de la base ; descendre le plafond supprimerait le
   flou **et le zoom avec**. Un nombre : `ZOOM_BASE_MULTIPLE_MAX`.
2. **La lecture du §3.1** — préparation par bande, déroulé en vue d'ensemble
   avec le zoom remis au plancher. Un mot la renverse.
3. **La bande d'ouverture est `batiments`.** L'écran s'ouvre donc sur la base de
   la cible, pas sur sa défense. Une ligne.

## 8. Écarts au brief

1. **La base d'octets du brief était haute de 226** (§0). Signalé, non bloquant.
2. **La prémisse du §2 du brief était fausse** — les 674 px sont le déroulé, pas
   la préparation (§1.1). Le diagnostic demandé a été rendu quand même.
3. **Le brief supposait que le glisser-déposer vit sur la même grille que le
   zoom** (§2 de son 3.2, et `T9`). Mesuré : ils sont sur deux éléments
   distincts. `T9` garde donc la SÉPARATION, qui est ce qui rend le geste
   possible.
4. **La bande du déploiement n'est pas navigable**, conformément à
   `BANDES_NAVIGABLES` que le brief demandait de réemployer. Ses deux rangées
   restent atteignables par le bas de la bande Défense.

## 9. Points laissés en suspens

- La dette du glisser-déposer / modes tactiles (§5), hors lot et déclarée telle.
- **L'audit de la réparation des bâtiments de l'Ouvrage et de la défense**, que
  le brief met hors lot : **rien n'y a été touché.**
- Les trois arbitrages ouverts du lot ZOOM-CONTINU (`dallesEnCache` à 64 Mio, la
  queue d'images, `DALLES_PAR_IMAGE = 1`) : **aucun n'a été tranché ici.**
- Le panneau de la carte qui couvre le bas de l'écran, signalé aux lots ASSAUT
  et CARTE-A : toujours ouvert, toujours pas pris.
